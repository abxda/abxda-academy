#!/usr/bin/env python3
"""
Corte de conocimiento, medido en el MISMO modelo real que `run-qa.py` (Pythia-1.4B, Apache-2.0, modelo base en inglés).
Pythia se entrenó con The Pile (Gao et al., 2020), reunido hasta 2020: no puede saber quién ganó un mundial posterior.

Reproducir (CPU, pocos hilos; tarda menos de un minuto):
    CUDA_VISIBLE_DEVICES= python run-cutoff.py EleutherAI/pythia-1.4b out/cutoff.json

Mismo prompt que `run-qa.py` (cinco ejemplos «Q: … A: …» y la pregunta), decodificación voraz hasta el salto de línea.
Para cada pregunta guarda: la respuesta voraz, su probabilidad conjunta y las 6 primeras piezas con su probabilidad.
Resultado (2026-10-12, CPU float32), copiado a mano en `cutoff-data.ts` (constante CUTOFF):
  2014 → «Germany» 0.616 (correcta) · 2018 → «Germany» 0.527 (falla: ganó Francia) · 2022 → «Germany» 0.464 (ganó Argentina)
"""
import json, math, sys, pathlib, importlib.util
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

torch.set_num_threads(4)
here = pathlib.Path(__file__).parent
spec = importlib.util.spec_from_file_location('rq', here / 'run-qa.py'); rq = importlib.util.module_from_spec(spec); spec.loader.exec_module(rq)

name, out = sys.argv[1], sys.argv[2]
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, dtype=torch.float32).eval()

def step(ids):
    with torch.no_grad():
        return torch.softmax(model(ids).logits[0, -1].float(), -1)

def run(q):
    pre = rq.SHOTS + f"Q: {q}\nA:"
    ids = tok(pre, return_tensors='pt').input_ids
    pr0 = step(ids)
    v, i = torch.topk(pr0, 6)
    top = [[tok.decode(int(a)), float(b)] for b, a in zip(v, i)]
    res, probs, cur = [], [], ids
    for _ in range(14):
        pr = step(cur); nxt = int(torch.argmax(pr)); s = tok.decode(nxt)
        if '\n' in s: break
        res.append(s); probs.append(float(pr[nxt])); cur = torch.cat([cur, torch.tensor([[nxt]])], 1)
    return {'q': q, 'ans': ''.join(res).strip(), 'p': math.prod(probs) if probs else 0.0, 'top': top}

QS = ["Who won the 2014 FIFA World Cup?", "Who won the 2018 FIFA World Cup?", "Who won the 2022 FIFA World Cup?"]
R = {'model': name, 'device': 'cpu', 'items': [run(q) for q in QS]}
pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
for it in R['items']: print(it['q'], '→', repr(it['ans']), round(it['p'], 4), [(t, round(p, 3)) for t, p in it['top']])
