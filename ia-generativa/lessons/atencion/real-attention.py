#!/usr/bin/env python3
"""
Genera `real-data.ts`: atención REAL de BERT para la lección «Atención».

Reproducir (desde esta carpeta; requiere torch + transformers y red la primera vez):
    python real-attention.py            # escribe real-data.ts junto a este archivo

Modelos (ambos con licencia Apache-2.0, descargados de Hugging Face; se fija la revisión):
  · inglés:   bert-base-uncased             rev 86b5e0934494bd15c9632b12f734a8a67f723594
  · español:  bert-base-multilingual-cased  rev 3f076fdb1ab68d5b2880cb87a0886f315b8146f8
  BERT base: 12 capas × 12 cabezas = 144 cabezas (Devlin et al., 2018). Se usa la atención de
  `output_attentions=True` (pesos tras softmax, promedio NO aplicado: cabeza por cabeza).

Frases (una palabra cambia al final; la segunda obliga a leer «este/it» como el robot):
  en: "The robot dropped the package because it was heavy."   /  "... because it was tired."
  es: "El robot soltó el paquete porque este era pesado."     /  "... porque este estaba cansado."

Qué se guarda:
  · words: las piezas que ve el modelo, a nivel de palabra (las piezas «##» de mBERT se suman;
    para una fila —la palabra que mira— se usa su primera pieza). Incluye [CLS], «.» y [SEP].
  · grid: para cada una de las 144 cabezas, la fracción de la atención de «it/este» (frase «pesado»)
    que cae en las marcas [CLS]/[SEP]/«.» (sp) y en «package/paquete» + «robot» (pr).
  · flip: la cabeza que mejor «gira»: maximiza min(peso en «paquete» con «pesado», peso en «robot» con «cansado»).
    Se ELIGE la mejor de las 144, así que es el ejemplo más legible, no el típico. nFlip = cuántas de las 144 superan 0,3.
  · heads: cuatro cabezas con la matriz completa (T×T) para la frase «pesado»:
        ref  = la cabeza anterior (flip);
        prev = la que más atención pone en la palabra anterior (promedio sobre las palabras de contenido);
        sep  = la que más atención pone en [SEP]/«.» (promedio sobre las palabras de contenido);
        next = la que más atención pone en la palabra siguiente (ídem).
    Cada una con su métrica, medida sobre esta misma frase.
Los números se redondean a 2 decimales.
"""
import json, sys, pathlib
import numpy as np, torch
from transformers import AutoTokenizer, AutoModel

CFG = {
    'en': dict(model='bert-base-uncased', rev='86b5e0934494bd15c9632b12f734a8a67f723594', query='it', a='package', b='robot',
               s_heavy='The robot dropped the package because it was heavy.', s_tired='The robot dropped the package because it was tired.'),
    'es': dict(model='bert-base-multilingual-cased', rev='3f076fdb1ab68d5b2880cb87a0886f315b8146f8', query='este', a='paquete', b='robot',
               s_heavy='El robot soltó el paquete porque este era pesado.', s_tired='El robot soltó el paquete porque este estaba cansado.'),
}
SPECIAL = {'[CLS]', '[SEP]', '.'}

def run(tok, model, sentence):
    enc = tok(sentence, return_tensors='pt')
    toks = tok.convert_ids_to_tokens(enc['input_ids'][0])
    with torch.no_grad():
        att = torch.stack(model(**enc).attentions)[:, 0].numpy()          # L, H, T, T
    groups = []
    for i, t in enumerate(toks):
        if t.startswith('##') and groups: groups[-1].append(i)
        else: groups.append([i])
    words = [''.join(toks[j].replace('##', '') for j in g) if len(g) > 1 else toks[g[0]] for g in groups]
    T = len(groups)
    M = np.zeros((att.shape[0], att.shape[1], T, T))
    for gi, g in enumerate(groups):
        for gj, h in enumerate(groups):
            M[:, :, gi, gj] = att[:, :, g[0], :][..., h].sum(-1)          # fila = primera pieza; columnas = suma de piezas
    return words, M

def r2(x): return np.round(np.asarray(x, dtype=float), 2).tolist()

out = {}
for lang, c in CFG.items():
    tok = AutoTokenizer.from_pretrained(c['model'], revision=c['rev'])
    model = AutoModel.from_pretrained(c['model'], revision=c['rev'], attn_implementation='eager', output_attentions=True).eval()
    wh, Mh = run(tok, model, c['s_heavy']); wt, Mt = run(tok, model, c['s_tired'])
    assert len(wh) == len(wt)
    T = len(wh); q = wh.index(c['query']); ia = wh.index(c['a']); ib = wh.index(c['b'])
    sp = [i for i, w in enumerate(wh) if w in SPECIAL]
    content = [i for i, w in enumerate(wh) if w not in SPECIAL]
    L, H = Mh.shape[:2]
    grid_sp = [[float(Mh[l, h, q, sp].sum()) for h in range(H)] for l in range(L)]
    grid_pr = [[float(Mh[l, h, q, [ia, ib]].sum()) for h in range(H)] for l in range(L)]
    # puntuación de «giro»: la cabeza mira al paquete con «pesado» Y al robot con «cansado»: min(peso paquete [pesado], peso robot [cansado])
    flip = sorted(((float(min(Mh[l, h, q, ia], Mt[l, h, q, ib])), l, h) for l in range(L) for h in range(H)), reverse=True)
    n_flip = sum(1 for f, _, _ in flip if f > 0.3)
    fl, fh = flip[0][1], flip[0][2]
    def metric(kind):
        best = None
        for l in range(L):
            for h in range(H):
                A = Mh[l, h]
                if kind == 'prev': v = np.mean([A[i, i - 1] for i in content if i - 1 >= 0])
                elif kind == 'next': v = np.mean([A[i, i + 1] for i in content if i + 1 < T])
                else: v = np.mean([A[i, sp].sum() for i in content])
                if (l, h) == (fl, fh): continue
                if best is None or v > best[0]: best = (float(v), l, h)
        return best
    heads = [dict(kind='ref', layer=fl + 1, head=fh + 1, metric=None, M=r2(Mh[fl, fh]))]
    for kind in ('prev', 'sep', 'next'):
        v, l, h = metric(kind)
        heads.append(dict(kind=kind, layer=l + 1, head=h + 1, metric=round(v, 2), M=r2(Mh[l, h])))
    out[lang] = dict(
        model=c['model'], revision=c['rev'], sentences=dict(heavy=c['s_heavy'], tired=c['s_tired']),
        words=dict(heavy=wh, tired=wt), query=q, a=ia, b=ib,
        flip=dict(layer=fl + 1, head=fh + 1, heavy=r2(Mh[fl, fh, q]), tired=r2(Mt[fl, fh, q]), nFlip=n_flip),
        grid=dict(sp=r2(grid_sp), pr=r2(grid_pr), nSpecialTop=int(sum(1 for l in range(L) for h in range(H) if int(np.argmax(Mh[l, h, q])) in sp))),
        heads=heads,
    )
    print(lang, 'flip head', fl + 1, fh + 1, 'n_flip>0.3:', n_flip, 'top-special heads:', out[lang]['grid']['nSpecialTop'], [(h['kind'], h['layer'], h['head'], h['metric']) for h in heads])

here = pathlib.Path(__file__).parent
(here / 'real-data.ts').write_text(
    '// GENERADO por real-attention.py (no editar a mano). Ver ese archivo para el método y la reproducción.\n'
    'export interface RealHead { kind: \'ref\' | \'prev\' | \'sep\' | \'next\'; layer: number; head: number; metric: number | null; M: number[][] }\n'
    'export interface RealLang { model: string; revision: string; sentences: { heavy: string; tired: string }; words: { heavy: string[]; tired: string[] }; query: number; a: number; b: number;\n'
    '  flip: { layer: number; head: number; heavy: number[]; tired: number[]; nFlip: number };\n'
    '  grid: { sp: number[][]; pr: number[][]; nSpecialTop: number }; heads: RealHead[] }\n'
    'export const REAL: Record<\'es\' | \'en\', RealLang> = ' + json.dumps(out, ensure_ascii=False) + ';\n', encoding='utf-8')
print('escrito', here / 'real-data.ts')
