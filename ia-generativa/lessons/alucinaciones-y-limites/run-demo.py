#!/usr/bin/env python3
"""
Demostraciones sueltas con el MISMO modelo real que `run-qa.py` (Pythia-1.4B, Apache-2.0, modelo base en inglés).
Paso 1b de la lección «Alucinaciones y límites». Escribe un JSON que `build-data.py` incorpora a `real-data.ts`.

Reproducir:  python run-demo.py EleutherAI/pythia-1.4b out/demo.json [cuda|cpu]

Qué mide (todo determinista, voraz):
  · dist:   las 8 piezas más probables tras «A:» para cuatro preguntas, y la respuesta voraz con su probabilidad conjunta.
            Dos son preguntas del banco de `questions.py`; «The Glass Cathedral of Aldermoor» es un título INVENTADO para esta lección.
  · idk:    probabilidad de que el modelo continúe con una frase de «no sé» (suma de variantes) frente a nombrar un autor.
  · snow:   continuación voraz de una frase que da por cierta una autoría falsa y de la misma con la autoría correcta.
  · arith:  40 multiplicaciones de tres cifras por dos cifras (semilla fija); ¿acierta?, ¿acierta el número de cifras?
"""
import copy, json, math, random, sys, pathlib, importlib.util
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

here = pathlib.Path(__file__).parent
spec = importlib.util.spec_from_file_location('rq', here / 'run-qa.py'); rq = importlib.util.module_from_spec(spec); spec.loader.exec_module(rq)
SHOTS = rq.SHOTS

name, out = sys.argv[1], sys.argv[2]
dev = sys.argv[3] if len(sys.argv) > 3 else ('cuda' if torch.cuda.is_available() else 'cpu')
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name, dtype=torch.float16 if dev == 'cuda' else torch.float32).to(dev).eval()

def probs_next(text):
    ids = tok(text, return_tensors='pt').input_ids.to(dev)
    with torch.no_grad():
        return torch.softmax(model(ids).logits[0, -1].float(), -1)

def top(text, k=8):
    v, i = torch.topk(probs_next(text), k)
    return [[tok.decode(int(a)), float(b)] for b, a in zip(v, i)]

def seqprob(prefix, cont):
    ids = tok(prefix, return_tensors='pt').input_ids.to(dev)
    full = tok(prefix + cont, return_tensors='pt').input_ids.to(dev)
    n0 = ids.shape[1]
    with torch.no_grad():
        lg = torch.softmax(model(full).logits[0].float(), -1)
    return math.prod(float(lg[j - 1, full[0, j]]) for j in range(n0, full.shape[1]))

def greedy(text, n=40, stop_nl=False):
    ids = tok(text, return_tensors='pt').input_ids.to(dev)
    res, probs = [], []
    cur = ids
    for _ in range(n):
        with torch.no_grad():
            pr = torch.softmax(model(cur).logits[0, -1].float(), -1)
        nxt = int(torch.argmax(pr)); s = tok.decode(nxt)
        if stop_nl and '\n' in s: break
        res.append(s); probs.append(float(pr[nxt])); cur = torch.cat([cur, torch.tensor([[nxt]], device=dev)], 1)
    return ''.join(res), probs

R = {'model': name, 'device': dev}
DQ = ["What is the capital of Australia?", "What is the capital of Mongolia?", "Who wrote 'Pedro Páramo'?",
      "Who wrote the novel 'The Glass Cathedral of Aldermoor'?"]
R['dist'] = []
for q in DQ:
    pre = SHOTS + f"Q: {q}\nA:"
    ans, pr = greedy(pre, 14, stop_nl=True)
    R['dist'].append({'q': q, 'top': top(pre, 8), 'ans': ans.strip(), 'p': math.prod(pr), 'p1': pr[0]})

R['idk'] = {}
for q in ["Who wrote 'Pedro Páramo'?", "Who wrote the novel 'The Glass Cathedral of Aldermoor'?", "What is the capital of Australia?"]:
    pre = SHOTS + f"Q: {q}\nA:"
    variants = [" I don't know", " I do not know", " I'm not sure", " Unknown", " I don't know.", " Not sure", " No one knows", " There is no such novel"]
    R['idk'][q] = {'variants': {v: seqprob(pre, v) for v in variants}}

R['snow'] = []
for pre in ["Pedro Páramo is a novel by Pablo Neruda, first published in", "Pedro Páramo is a novel by Juan Rulfo, first published in"]:
    txt, _ = greedy(pre, 36)
    R['snow'].append({'prefix': pre, 'cont': txt})

rnd = random.Random(33)
items = []
seen = set()
while len(items) < 40:
    a, b = rnd.randint(100, 999), rnd.randint(11, 99)
    if (a, b) in seen: continue
    seen.add((a, b))
    pre = SHOTS + f"Q: What is {a} times {b}?\nA:"
    ans, pr = greedy(pre, 10, stop_nl=True)
    gold = a * b
    digits = ''.join(c for c in ans if c.isdigit())
    items.append({'a': a, 'b': b, 'gold': gold, 'ans': ans.strip(), 'p': math.prod(pr) if pr else 0.0,
                  'ok': digits == str(gold), 'len_ok': len(digits) == len(str(gold)), 'first_ok': digits[:1] == str(gold)[:1]})
R['arith'] = {'items': items, 'acc': sum(i['ok'] for i in items) / len(items), 'len_ok': sum(i['len_ok'] for i in items) / len(items),
              'first_ok': sum(i['first_ok'] for i in items) / len(items)}
json.dump(R, open(out, 'w'), ensure_ascii=False, indent=1)
print('listo', out, 'aritmética: acierto', R['arith']['acc'], 'cifras', R['arith']['len_ok'])
