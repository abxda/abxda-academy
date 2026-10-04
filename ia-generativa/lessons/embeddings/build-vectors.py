#!/usr/bin/env python3
"""Genera data/embeddings.json: los vectores REALES que usa la lección 14 («Embeddings: el significado como geometría»).

Se ejecuta una sola vez, offline (no corre en el navegador):

    python3 build-vectors.py --glove /ruta/a/glove.6B.zip          # o a glove.6B.100d.txt
    python3 build-vectors.py --glove glove.6B.zip --check          # además imprime vecinos y analogías de comprobación

Necesita: numpy y scikit-learn.

────────────────────────── DE DÓNDE SALEN LOS DATOS ──────────────────────────
· Vectores: GloVe 6B de 100 dimensiones (glove.6B.100d.txt), de Stanford.
    Pennington, Socher y Manning (2014), «GloVe: Global Vectors for Word Representation», EMNLP.
    Entrenados con Wikipedia 2014 + Gigaword 5: 6 mil millones de palabras, 400 000 palabras de vocabulario,
    sin distinguir mayúsculas. Solo texto en INGLÉS.
    Licencia: Public Domain Dedication and License v1.0 (http://www.opendatacommons.org/licenses/pddl/1.0/):
    se pueden redistribuir, también derivados. Página oficial: https://nlp.stanford.edu/projects/glove/
    Archivo usado: glove.6B.zip (822 MB), SHA-256 6471382cdd837544bf3ac72497a38715e845897d265b2b424b4761832009c837,
    descargado de https://huggingface.co/stanfordnlp/glove (organización oficial de Stanford NLP; esa copia añade
    una línea final «<unk>» que aquí se ignora; el archivo de nlp.stanford.edu/data tiene exactamente 400 000 filas).
· Vocabulario: data/vocab.tsv, escrito a mano para esta lección (≈ 900 palabras comunes y concretas con su
    etiqueta en español). Como el modelo se entrenó con inglés, la etiqueta en español es una TRADUCCIÓN de la
    palabra inglesa: en la versión en español, «perro» usa el vector de «dog». La escena lo declara así.
· Mapa: proyección t-SNE (van der Maaten y Hinton, 2008) de los 100 números a 2, con métrica coseno,
    perplejidad 20, inicialización PCA y semilla 0 (scikit-learn). t-SNE conserva vecindades, NO distancias globales:
    la escena lo rotula como «proyección».
· Cuantización: cada vector se normaliza a longitud 1 (la similitud coseno solo usa la dirección) y se guarda como
    enteros de 8 bits (valor·SCALE, redondeado). Al cargar se vuelve a normalizar. El error de coseno que añade es < 0,01.

Salida (JSON):  dim, scale, words (claves en inglés), disp (cómo se escribe en inglés), es, alias (otras formas en español),
                q (int8, n·dim, base64), xy (uint16, n·2, base64, 0..65535), meta.
"""
import argparse, base64, collections, io, json, os, sys, unicodedata, zipfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DIM, SCALE = 100, 200

def read_vocab(path):
    rows = []
    for ln in open(path, encoding='utf8'):
        ln = ln.rstrip('\n')
        if not ln or ln.startswith('#'): continue
        p = ln.split('|')
        key = p[0].lstrip('^')
        rows.append(dict(key=key, proper=p[0].startswith('^'), es=p[1], alias=[a for a in (p[2].split(',') if len(p) > 2 else []) if a]))
    return rows

def load_glove(path, wanted):
    """Lee solo las filas que están en `wanted`; admite el .zip o el .txt."""
    want = set(wanted); out = {}
    if path.endswith('.zip'):
        zf = zipfile.ZipFile(path); f = io.TextIOWrapper(zf.open(f'glove.6B.{DIM}d.txt'), encoding='utf8')
    else:
        f = open(path, encoding='utf8')
    for ln in f:
        w, _, rest = ln.partition(' ')
        if w in want and w not in out:
            out[w] = np.asarray(rest.split(' '), dtype=np.float32)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--glove', required=True)
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--retsne', action='store_true', help='recalcula la proyección aunque el vocabulario no haya cambiado')
    ap.add_argument('--out', default=os.path.join(HERE, 'data', 'embeddings.json'))
    a = ap.parse_args()
    rows = read_vocab(os.path.join(HERE, 'data', 'vocab.tsv'))
    vec = load_glove(a.glove, [r['key'] for r in rows])
    miss = [r['key'] for r in rows if r['key'] not in vec]
    if miss: sys.exit(f'faltan en GloVe: {miss}')
    dups = [k for k, c in collections.Counter(r['key'] for r in rows).items() if c > 1]
    if dups: sys.exit(f'claves repetidas: {dups}')
    E = np.stack([vec[r['key']] for r in rows]); E /= np.linalg.norm(E, axis=1, keepdims=True)
    q = np.clip(np.rint(E * SCALE), -127, 127)
    clip = float((np.abs(E * SCALE) > 127).mean())
    Q = (q / np.linalg.norm(q, axis=1, keepdims=True))
    err = np.abs((E @ E.T) - (Q @ Q.T)).max()
    print(f'{len(rows)} palabras · recorte {clip:.5f} · error máximo de coseno por cuantización {err:.4f}')

    words = [r['key'] for r in rows]
    prev = json.load(open(a.out, encoding='utf8')) if os.path.exists(a.out) else None
    if prev and prev['words'] == words and not a.retsne:
        xy_b64 = prev['xy']; print('t-SNE: se reutilizan las posiciones (mismo vocabulario); --retsne para recalcular')
    else:
        from sklearn.manifold import TSNE
        xy = TSNE(2, perplexity=20, init='pca', metric='cosine', random_state=0, max_iter=3000).fit_transform(E)
        lo, hi = xy.min(0), xy.max(0)
        u16 = np.rint((xy - lo) / (hi - lo).max() * 65535).astype('<u2')
        xy_b64 = base64.b64encode(u16.tobytes()).decode()

    out = dict(
        dim=DIM, scale=SCALE,
        words=[r['key'] for r in rows],
        disp=[r['key'].capitalize() if r['proper'] else r['key'] for r in rows],
        es=[r['es'] for r in rows],
        alias=[r['alias'] for r in rows],
        q=base64.b64encode(q.astype(np.int8).tobytes()).decode(),
        xy=xy_b64,
        meta=dict(source='GloVe 6B 100d (Pennington, Socher, Manning 2014), PDDL v1.0', tsne=dict(perplexity=20, metric='cosine', init='pca', seed=0)),
    )
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    json.dump(out, open(a.out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print('escrito', a.out, os.path.getsize(a.out) // 1024, 'KB')

    if a.check:
        idx = {r['key']: i for i, r in enumerate(rows)}
        def nn(v, excl=(), k=6):
            s = Q @ (v / np.linalg.norm(v))
            for w in excl: s[idx[w]] = -9
            o = np.argsort(-s)[:k]; return ' '.join(f"{rows[j]['key']}({s[j]:.2f})" for j in o)
        for w in ['dog', 'bread', 'king', 'doctor', 'apple', 'paris', 'car', 'love']:
            print(f'{w:8s}', nn(Q[idx[w]], (w,)))
        for x, y, z in [('king', 'man', 'woman'), ('paris', 'france', 'italy'), ('tokyo', 'japan', 'france')]:
            v = Q[idx[x]] - Q[idx[y]] + Q[idx[z]]
            print(f'{x}-{y}+{z}: sin excluir -> {nn(v, (), 3)} | excluyendo -> {nn(v, (x, y, z), 3)}')

if __name__ == '__main__':
    main()
