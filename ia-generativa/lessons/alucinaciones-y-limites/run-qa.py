#!/usr/bin/env python3
"""
Mide, con un modelo de lenguaje REAL y abierto, cuánta probabilidad asigna a sus respuestas y cuántas acierta.
Paso 1 de 2 de la lección «Alucinaciones y límites» (el paso 2 es `build-data.py`, que escribe `real-data.ts`).

Reproducir (requiere torch + transformers; GPU de ≥ 6 GB o CPU; red la primera vez):
    python run-qa.py EleutherAI/pythia-1.4b out/pythia-1.4b.json [cuda|cpu]

Modelo: Pythia (Biderman et al., 2023, arXiv:2304.01373), licencia Apache-2.0, entrenado con The Pile (solo texto en inglés).
Es un modelo BASE: solo predice la siguiente pieza de texto; no se le ajustó para seguir instrucciones.

Método (determinista, sin muestreo):
  · Prompt = 5 ejemplos fijos «Q: … A: …» (SHOTS, ninguno está en `questions.py`) + la pregunta + «A:».
  · Respuesta = decodificación voraz: en cada paso se toma la pieza más probable, hasta el primer salto de línea (máx. 14 piezas).
  · Confianza = probabilidad conjunta de las piezas de la respuesta (regla de la cadena), sin contar el salto de línea.
    p_first = probabilidad de la primera pieza (la que decide casi todo).
  · Acierto = la respuesta (sin acentos, mayúsculas ni signos) es igual a una de las respuestas aceptadas, o la empieza o termina
    con ella como palabra completa. Después se revisaron a mano todas las respuestas marcadas como acierto (ver `review` en la salida).
Las 424 preguntas están en `questions.py` (escritas para la lección; hechos estables y comprobables).
"""
import copy, json, math, sys, unicodedata, re, pathlib
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from questions import Q

SHOTS = """Q: What is the capital of Germany?
A: Berlin

Q: Who painted the ceiling of the Sistine Chapel?
A: Michelangelo

Q: What is the chemical symbol for carbon?
A: C

Q: In what year did World War I begin?
A: 1914

Q: What is the currency of the United Kingdom?
A: Pound sterling

"""

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"[^a-z0-9]+", ' ', s)
    return ' '.join(s.split())

def is_correct(pred, aliases):
    p = norm(pred)
    if not p: return False
    for a in aliases:
        a = norm(a)
        if p == a or p.startswith(a + ' ') or p.endswith(' ' + a): return True
    return False

def main(name, out, device=None):
    tok = AutoTokenizer.from_pretrained(name)
    dev = device or ('cuda' if torch.cuda.is_available() else 'cpu')
    model = AutoModelForCausalLM.from_pretrained(name, dtype=torch.float16 if dev == 'cuda' else torch.float32).to(dev).eval()
    # Los 5 ejemplos son iguales para todas las preguntas: se calculan una vez y se reutiliza su memoria (caché KV).
    # Es un atajo de velocidad. Se tokeniza el prompt COMPLETO (la frontera entre ejemplos y pregunta puede fusionar piezas) y
    # solo se reutiliza el tramo inicial idéntico; así el resultado es el mismo que recalcular el prompt entero.
    shot_ids = tok(SHOTS, return_tensors='pt').input_ids.to(dev)
    keep = shot_ids.shape[1] - 2
    with torch.no_grad():
        base = model(shot_ids[:, :keep], use_cache=True)
    rows = []
    for cat, q, aliases in Q:
        full_ids = tok(SHOTS + f"Q: {q}\nA:", return_tensors='pt').input_ids.to(dev)
        assert torch.equal(full_ids[0, :keep], shot_ids[0, :keep])
        cache = copy.deepcopy(base.past_key_values)
        inp, pieces, probs, top5 = full_ids[:, keep:], [], [], None
        for t in range(14):
            with torch.no_grad():
                o = model(inp, past_key_values=cache, use_cache=True)
            cache = o.past_key_values
            pr = torch.softmax(o.logits[0, -1].float(), -1)
            if t == 0:
                v, i = torch.topk(pr, 6); top5 = [[tok.decode(int(a)), round(float(b), 4)] for b, a in zip(v, i)]
            nxt = int(torch.argmax(pr)); s = tok.decode(nxt)
            if '\n' in s: break
            pieces.append(s); probs.append(float(pr[nxt]))
            inp = torch.tensor([[nxt]], device=dev)
        ans = ''.join(pieces).strip()
        rows.append({'cat': cat, 'q': q, 'gold': aliases[0], 'ans': ans, 'p': math.prod(probs) if probs else 0.0,
                     'p1': probs[0] if probs else 0.0, 'ok': is_correct(ans, aliases), 'top': top5})
    json.dump({'model': name, 'n': len(rows), 'rows': rows}, open(out, 'w'), ensure_ascii=False, indent=1)
    acc = sum(r['ok'] for r in rows) / len(rows)
    print(f'{name}: {len(rows)} preguntas, exactitud {acc:.3f}')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
