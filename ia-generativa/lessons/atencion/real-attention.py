#!/usr/bin/env python3
"""
Genera `real-data.ts`: atención REAL de BERT para la lección «Atención».

Reproducir (desde esta carpeta; requiere torch + transformers; corre en CPU, unos segundos):
    CUDA_VISIBLE_DEVICES= python real-attention.py      # escribe real-data.ts junto a este archivo

Modelos (ambos con licencia Apache-2.0, de Hugging Face; se fija la revisión):
  · inglés:   bert-base-uncased             rev 86b5e0934494bd15c9632b12f734a8a67f723594
  · español:  bert-base-multilingual-cased  rev 3f076fdb1ab68d5b2880cb87a0886f315b8146f8
  Los dos son BERT base: 12 capas × 12 cabezas = 144 cabezas (config.json: num_hidden_layers 12,
  num_attention_heads 12; Devlin et al., 2018). Se usan los pesos de `output_attentions=True`
  (tras softmax), cabeza por cabeza, sin promediar.

Frases (la palabra ambigua es «banco»/«bank»; en cada frase otra palabra decide su sentido):
  es: A «Me senté en el banco de mi jardín.» (asiento)      B «Saqué dinero del banco.» (dinero)
  en: A "I sat on the bank of the river."    (riverbank)    B "I took money out of the bank." (money)
  Se probaron varias redacciones en español y se eligió la de A por ser natural y tener ocho palabras,
  como la inglesa (así el ejemplo hecho a mano de la lección usa la misma frase en los dos idiomas).

Qué se guarda (redondeado a 2 decimales):
  · words: las piezas que ve el modelo, unidas a nivel de palabra (las piezas «##» de mBERT se suman en las
    columnas; para una fila —la palabra que mira— se usa su primera pieza). Incluye [CLS], «.» y [SEP].
  · heads: cuatro cabezas con su mapa completo (T×T) para la frase A:
        ctx   = la cabeza de «banco»: entre las cabezas en las que el mayor peso de «banco» cae en la palabra que
                decide el sentido EN LAS DOS frases (jardín/river en A, dinero/money en B), la de mayor suma de
                esos dos pesos. Se ELIGE la mejor de 144: es el ejemplo más legible, no el típico. Guarda además
                la fila de «banco» en la frase B (rowB).
        prev  = la que más peso pone en la palabra anterior (promedio sobre las palabras, sin las marcas);
        next  = la que más peso pone en la palabra siguiente (ídem);
        marks = la que más peso pone en las marcas [CLS], [SEP] y «.» (ídem).
  · nCtxBoth: cuántas de las 144 cabezas cumplen la condición de ctx (mayor peso en la palabra que decide, en A y en B).
  · nMarkTop: en cuántas de las 144 el mayor peso de «banco» (frase A) cae en una marca.
"""
import os, json, pathlib
os.environ.setdefault('CUDA_VISIBLE_DEVICES', '')        # CPU: la GPU de la máquina se usa para otras cosas
import numpy as np, torch
torch.set_num_threads(4)
from transformers import AutoTokenizer, AutoModel

CFG = {
    'en': dict(model='bert-base-uncased', rev='86b5e0934494bd15c9632b12f734a8a67f723594', target='bank',
               A='I sat on the bank of the river.', ca='river', B='I took money out of the bank.', cb='money'),
    'es': dict(model='bert-base-multilingual-cased', rev='3f076fdb1ab68d5b2880cb87a0886f315b8146f8', target='banco',
               A='Me senté en el banco de mi jardín.', ca='jardín', B='Saqué dinero del banco.', cb='dinero'),
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
    words = [''.join(toks[j].replace('##', '') for j in g) for g in groups]
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
    wa, Ma = run(tok, model, c['A']); wb, Mb = run(tok, model, c['B'])
    qa, qb, ia, ib = wa.index(c['target']), wb.index(c['target']), wa.index(c['ca']), wb.index(c['cb'])
    L, H, T = Ma.shape[0], Ma.shape[1], len(wa)
    sp = [i for i, w in enumerate(wa) if w in SPECIAL]
    content = [i for i, w in enumerate(wa) if w not in SPECIAL]
    both = [(l, h) for l in range(L) for h in range(H) if int(np.argmax(Ma[l, h, qa])) == ia and int(np.argmax(Mb[l, h, qb])) == ib]
    cl, ch = max(both, key=lambda lh: Ma[lh[0], lh[1], qa, ia] + Mb[lh[0], lh[1], qb, ib])
    n_mark_top = sum(1 for l in range(L) for h in range(H) if int(np.argmax(Ma[l, h, qa])) in sp)

    def best(kind):
        top = None
        for l in range(L):
            for h in range(H):
                if (l, h) == (cl, ch): continue
                A = Ma[l, h]
                if kind == 'prev': v = np.mean([A[i, i - 1] for i in content if i - 1 >= 0])
                elif kind == 'next': v = np.mean([A[i, i + 1] for i in content if i + 1 < T])
                else: v = np.mean([A[i, sp].sum() for i in content])
                if top is None or v > top[0]: top = (float(v), l, h)
        return top

    heads = [dict(kind='ctx', layer=cl + 1, head=ch + 1, metric=None, M=r2(Ma[cl, ch]), rowB=r2(Mb[cl, ch, qb]))]
    for kind in ('prev', 'next', 'marks'):
        v, l, h = best(kind)
        heads.append(dict(kind=kind, layer=l + 1, head=h + 1, metric=round(v, 2), M=r2(Ma[l, h])))
    out[lang] = dict(model=c['model'], revision=c['rev'], sentences=dict(A=c['A'], B=c['B']), words=dict(A=wa, B=wb),
                     q=dict(A=qa, B=qb), ctx=dict(A=ia, B=ib), heads=heads, nCtxBoth=len(both), nMarkTop=n_mark_top)
    print(lang, 'ctx head', cl + 1, ch + 1, 'A', round(float(Ma[cl, ch, qa, ia]), 2), 'B', round(float(Mb[cl, ch, qb, ib]), 2),
          '| nCtxBoth', len(both), '| nMarkTop', n_mark_top, [(h['kind'], h['layer'], h['head'], h['metric']) for h in heads[1:]])

here = pathlib.Path(__file__).parent
(here / 'real-data.ts').write_text(
    '// GENERADO por real-attention.py (no editar a mano). Ver ese archivo para el método y la reproducción.\n'
    "export type HeadKind = 'ctx' | 'prev' | 'next' | 'marks';\n"
    'export interface RealHead { kind: HeadKind; layer: number; head: number; metric: number | null; M: number[][]; rowB?: number[] }\n'
    'export interface RealLang { model: string; revision: string; sentences: { A: string; B: string }; words: { A: string[]; B: string[] };\n'
    '  q: { A: number; B: number }; ctx: { A: number; B: number }; heads: RealHead[]; nCtxBoth: number; nMarkTop: number }\n'
    "export const REAL: Record<'es' | 'en', RealLang> = " + json.dumps(out, ensure_ascii=False) + ';\n', encoding='utf-8')
print('escrito', here / 'real-data.ts')
