#!/usr/bin/env python3
"""Mide, con los MISMOS vectores de la lección (data/embeddings.json), cuántas analogías «a : b :: c : ?» acierta la aritmética
de vectores, y cuántas veces la respuesta más cercana es una de las tres palabras de entrada. Escribe data/analogy-eval.json.

    python3 eval-analogies.py                              # vocabulario de la lección (≈ 880 palabras); solo necesita numpy
    python3 eval-analogies.py --glove glove.6B.100d.txt    # además, contra el vocabulario COMPLETO de GloVe (400 000 palabras)

Elegir entre ≈ 880 palabras es mucho más fácil que entre 400 000, así que los dos números NO son comparables: el segundo es el
honesto para decir «qué tan bien funciona la aritmética».

Pares (los elegí a mano entre las palabras del vocabulario; no hay otros candidatos escondidos):
  · capital–país:  19 pares → 19·18 = 342 preguntas  («paris : france :: rome : ?» → italy, y al revés).
  · género:        10 pares → 10·9  =  90 preguntas  («king : queen :: man : ?» → woman).
Para cada pregunta a : a* :: b : ?  se calcula  v = a* − a + b  (vectores de longitud 1) y se ordenan TODAS las palabras del
vocabulario (≈ 880) por coseno con v. «Con exclusión»: se descartan a, a* y b antes de elegir (como en Mikolov et al., 2013).
«Sin exclusión»: se elige entre todas. Acierto = la más cercana es exactamente b*. No se cuentan sinónimos.
"""
import argparse, base64, json, os, itertools
import numpy as np

ap = argparse.ArgumentParser(); ap.add_argument('--glove'); A = ap.parse_args()

HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, 'data', 'embeddings.json'), encoding='utf8'))
W, N, dim = D['words'], len(D['words']), D['dim']
q = np.frombuffer(base64.b64decode(D['q']), dtype=np.int8).reshape(N, dim).astype(np.float32)
V = q / np.linalg.norm(q, axis=1, keepdims=True)
I = {w: i for i, w in enumerate(W)}

SETS = {
    'capitals': [('france', 'paris'), ('italy', 'rome'), ('spain', 'madrid'), ('germany', 'berlin'), ('japan', 'tokyo'), ('china', 'beijing'),
                 ('russia', 'moscow'), ('england', 'london'), ('canada', 'ottawa'), ('greece', 'athens'), ('egypt', 'cairo'),
                 ('portugal', 'lisbon'), ('sweden', 'stockholm'), ('norway', 'oslo'), ('cuba', 'havana'), ('colombia', 'bogota'),
                 ('ecuador', 'quito'), ('venezuela', 'caracas'), ('uruguay', 'montevideo')],
    'gender': [('man', 'woman'), ('king', 'queen'), ('boy', 'girl'), ('father', 'mother'), ('brother', 'sister'), ('son', 'daughter'),
               ('husband', 'wife'), ('uncle', 'aunt'), ('prince', 'princess'), ('grandfather', 'grandmother')],
}

def top(v, exclude=()):
    s = V @ (v / np.linalg.norm(v))
    for w in exclude: s[I[w]] = -9
    return W[int(np.argmax(s))]

res = {}
for name, pairs in SETS.items():
    n = ok_ex = ok_in = is_input = 0; fails = []
    for (a, a2), (b, b2) in itertools.permutations(pairs, 2):
        v = V[I[a2]] - V[I[a]] + V[I[b]]
        t_ex, t_in = top(v, (a, a2, b)), top(v)
        n += 1; ok_ex += t_ex == b2; ok_in += t_in == b2; is_input += t_in in (a, a2, b)
        if t_ex != b2 and len(fails) < 400: fails.append([a, a2, b, b2, t_ex])
    res[name] = dict(questions=n, correct_excluding=ok_ex, correct_including=ok_in, top_is_input_including=is_input, fails=fails[:12])
    print(f'{name:9s} {n} preguntas · con exclusión {ok_ex} ({ok_ex / n:.1%}) · sin exclusión {ok_in} ({ok_in / n:.1%}) · '
          f'la respuesta era una de las 3 palabras de entrada: {is_input} ({is_input / n:.1%})')

# ── vocabulario completo (opcional): las mismas preguntas, pero eligiendo entre las 400 000 palabras de GloVe ──
if A.glove:
    words, rows = [], []
    for ln in open(A.glove, encoding='utf8'):
        w, _, rest = ln.partition(' '); words.append(w); rows.append(np.asarray(rest.split(' '), dtype=np.float32))
    F = np.stack(rows); F /= np.linalg.norm(F, axis=1, keepdims=True); FI = {w: i for i, w in enumerate(words)}
    full = {}
    for name, pairs in SETS.items():
        n = ok_ex = ok_in = is_input = 0
        for (a, a2), (b, b2) in itertools.permutations(pairs, 2):
            v = F[FI[a2]] - F[FI[a]] + F[FI[b]]; s = F @ (v / np.linalg.norm(v))
            t_in = int(np.argmax(s))
            for w in (a, a2, b): s[FI[w]] = -9
            t_ex = int(np.argmax(s))
            n += 1; ok_ex += words[t_ex] == b2; ok_in += words[t_in] == b2; is_input += words[t_in] in (a, a2, b)
        full[name] = dict(questions=n, correct_excluding=ok_ex, correct_including=ok_in, top_is_input_including=is_input)
        print(f'[400 000 palabras] {name:9s} {n} preguntas · con exclusión {ok_ex} ({ok_ex / n:.1%}) · sin exclusión {ok_in} ({ok_in / n:.1%}) · era una de las 3 de entrada: {is_input} ({is_input / n:.1%})')
    res['full_vocab'] = dict(size=len(words), **full)
json.dump(res, open(os.path.join(HERE, 'data', 'analogy-eval.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
