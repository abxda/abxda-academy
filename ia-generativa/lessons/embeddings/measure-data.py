#!/usr/bin/env python3
"""Mide propiedades de los datos de la lección 14 y las guarda en data/measures.json (la escena las muestra; nada está inventado).

    python3 measure-data.py                          # solo numpy: todo sale de data/embeddings.json y data/vocab.tsv
    python3 measure-data.py --glove glove.6B.100d.txt  # además comprueba el sesgo con «he»/«she» de GloVe completo

Qué escribe:
  · groups   Las secciones de data/vocab.tsv (animales, comida, …): nombre y rango de índices. El orden de embeddings.json es el del
             vocabulario, así que un grupo es un rango contiguo. La escena los usa solo para rotular zonas del mapa; el modelo NO conoce
             estas categorías (las puse yo).
  · map      Fidelidad del mapa 2D: de los k vecinos más cercanos de cada palabra con coseno en 100 dimensiones, qué fracción vuelve a
             aparecer entre sus k vecinos más cercanos en el mapa t-SNE (k = 5 y 10), promediada sobre todas las palabras.
  · bias     Eje de género: puntaje(palabra) = media del coseno con {woman, girl, mother, wife, sister, daughter}
                                             − media del coseno con {man, boy, father, husband, brother, son}
             (positivo = más cerca de lo femenino). Se usan CONJUNTOS de palabras, no un par, porque «man» tiene varios sentidos.
             `neutral` = rango del mismo puntaje en 26 objetos sin género (mesa, árbol…): sirve de referencia de «ruido».
             `debias`: experimento pequeño de «quitar una dirección». Se calcula g = media(F) − media(M) (longitud 1) y se resta a cada
             profesión su componente en g. Luego se pregunta si se puede adivinar de qué lado estaba cada una (por encima o por debajo
             de la mediana del puntaje original) con el centroide más cercano por coseno, dejando una fuera cada vez (52 profesiones,
             azar = 50 %). Es una versión mínima de lo que hacen Gonen y Goldberg (2019): el eje queda en cero por construcción, pero el
             sesgo sigue en otras direcciones.
             Con --glove: correlación de Spearman entre este puntaje y el de «she» − «he» en GloVe completo (comprobación de robustez).
"""
import argparse, base64, json, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--glove'); A = ap.parse_args()
D = json.load(open(os.path.join(HERE, 'data', 'embeddings.json'), encoding='utf8'))
W, N, dim = D['words'], len(D['words']), D['dim']
q = np.frombuffer(base64.b64decode(D['q']), dtype=np.int8).reshape(N, dim).astype(np.float32)
V = q / np.linalg.norm(q, axis=1, keepdims=True)
I = {w: i for i, w in enumerate(W)}
xy = np.frombuffer(base64.b64decode(D['xy']), dtype='<u2').reshape(N, 2).astype(np.float64)
xy = (xy - xy.min(0)) / (xy.max(0) - xy.min(0))      # como XY en vectors.ts: cada eje a 0..1

# ── grupos = secciones del vocabulario ──
names, start, cur, n = [], [], None, 0
for ln in open(os.path.join(HERE, 'data', 'vocab.tsv'), encoding='utf8'):
    ln = ln.rstrip('\n')
    if ln.startswith('# ──'): cur = ln[4:].strip(); names.append(cur); start.append(n); continue
    if not ln or ln.startswith('#'): continue
    n += 1
assert n == N
groups = [dict(name=nm, a=a, b=(start[i + 1] if i + 1 < len(start) else N)) for i, (nm, a) in enumerate(zip(names, start))]

# ── fidelidad del mapa ──
S = V @ V.T; np.fill_diagonal(S, -9)
dm = np.linalg.norm(xy[:, None] - xy[None], axis=2); np.fill_diagonal(dm, 9)
mp = {}
for k in (5, 10):
    t, m = np.argsort(-S, 1)[:, :k], np.argsort(dm, 1)[:, :k]
    mp[f'overlap{k}'] = round(float(np.mean([len(set(t[i]) & set(m[i])) / k for i in range(N)])), 4)
print('mapa: fracción de vecinos reales que siguen siendo vecinos en el mapa', mp)

# ── eje de género ──
F = ['woman', 'girl', 'mother', 'wife', 'sister', 'daughter']; M = ['man', 'boy', 'father', 'husband', 'brother', 'son']
def score(x): return float(np.mean([x @ V[I[f]] for f in F]) - np.mean([x @ V[I[m]] for m in M]))
NEUTRAL = 'table tree river stone chair window door bottle apple banana car bus train bicycle mountain cloud rain sun moon star book pencil paper hammer bridge road'.split()
ns = [score(V[I[w]]) for w in NEUTRAL if w in I]
bias = dict(neutral=[round(min(ns), 4), round(max(ns), 4)], neutral_n=len(ns))

PROFS = 'doctor nurse teacher engineer lawyer pilot chef farmer scientist artist writer singer dancer painter musician actor athlete soldier police firefighter plumber electrician mechanic carpenter baker butcher waiter secretary receptionist librarian cashier accountant banker programmer designer architect professor surgeon dentist pharmacist journalist judge manager president worker employee boss janitor babysitter hairdresser ceo maid'.split()
X = np.stack([V[I[p]] for p in PROFS]); sc = np.array([score(x) for x in X]); lean = (sc > np.median(sc)).astype(int)
g = V[[I[w] for w in F]].mean(0) - V[[I[w] for w in M]].mean(0); g /= np.linalg.norm(g)
def loo(Z):
    ok = 0
    for i in range(len(Z)):
        k = np.ones(len(Z), bool); k[i] = False
        c1, c0 = Z[k & (lean == 1)].mean(0), Z[k & (lean == 0)].mean(0)
        cs = lambda a, b: a @ b / np.linalg.norm(a) / np.linalg.norm(b)
        ok += int(cs(Z[i], c1) > cs(Z[i], c0)) == lean[i]
    return ok
bias['debias'] = dict(n=len(PROFS), before=int(loo(X)), after=int(loo(X - np.outer(X @ g, g))))
print('sesgo: adivinar el lado de cada profesión por vecindad: antes', bias['debias']['before'], 'de', len(PROFS), '· tras quitar la dirección', bias['debias']['after'])
if A.glove:
    from scipy.stats import spearmanr
    rows = {}
    want = set(['he', 'she'])
    want |= set(PROFS)
    for ln in open(A.glove, encoding='utf8'):
        w, _, rest = ln.partition(' ')
        if w in want and w not in rows: rows[w] = np.asarray(rest.split(' '), dtype=np.float32)
    u = lambda v: v / np.linalg.norm(v)
    a = [score(V[I[p]]) for p in PROFS]; b = [float(u(rows[p]) @ u(rows['she']) - u(rows[p]) @ u(rows['he'])) for p in PROFS]
    r = spearmanr(a, b); bias['spearman_vs_he_she'] = round(float(r.statistic), 3); bias['n_professions'] = len(PROFS)
    print('sesgo: Spearman entre el puntaje de la lección y she−he de GloVe completo:', bias['spearman_vs_he_she'], f'({len(PROFS)} profesiones)')
print('sesgo: rango de objetos neutros', bias['neutral'])
json.dump(dict(groups=groups, map=mp, bias=bias), open(os.path.join(HERE, 'data', 'measures.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('escrito data/measures.json')
