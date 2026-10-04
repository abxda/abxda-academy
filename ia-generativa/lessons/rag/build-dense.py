#!/usr/bin/env python3
"""
Genera `dense.ts`: mediciones REALES con dos modelos neuronales sobre los fragmentos del manual de la lección «RAG».

Reproducir (desde `app/`, con un entorno que tenga torch + sentence-transformers y los dos modelos en la caché de HF):
    python src/content/courses/ia-generativa/lessons/rag/build-dense.py

Modelos (descargados de Hugging Face, ambos con licencia que permite uso comercial):
  · Recuperador denso (bi-encoder): intfloat/multilingual-e5-small (licencia MIT; Wang et al., 2022, arXiv:2212.03533).
    Convención del modelo: «query: …» para la pregunta y «passage: …» para el fragmento. Se guarda la similitud coseno
    entre el vector de la pregunta y el de cada fragmento (vectores normalizados).
  · Reordenador (cross-encoder): cross-encoder/mmarco-mMiniLMv2-L12-H384-v1 (licencia Apache-2.0; entrenado con mMARCO,
    Bonifacio et al., 2021, arXiv:2108.13897). Lee la pregunta y el fragmento JUNTOS y devuelve una puntuación (logit).
Para cada pregunta fija (las de evaluación GOLD y las de ejemplo EXTRA de corpus.ts) se guardan las puntuaciones contra los
25 fragmentos del índice, en el orden de `ids`. Nada se retoca a mano. Los modelos no corren en el navegador: la escena lee
estas cifras, y solo para esas preguntas. La búsqueda por palabras (TF-IDF) sí se calcula en vivo en el navegador.
"""
import json, pathlib, subprocess, datetime, sys
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder
import sentence_transformers, torch

HERE = pathlib.Path(__file__).resolve().parent
APP = HERE.parents[5]            # …/app
raw = subprocess.run(['npx', 'tsx', str(HERE / 'export-corpus.mts')], cwd=APP, capture_output=True, text=True, check=True).stdout
data = json.loads(raw)

bi = SentenceTransformer('intfloat/multilingual-e5-small', device='cpu')
ce = CrossEncoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1', device='cpu')

out = {}
for lang, d in data.items():
    ids = [c['id'] for c in d['chunks']]
    P = bi.encode(['passage: ' + c['text'] for c in d['chunks']], normalize_embeddings=True)
    rows = {}
    for q in d['questions']:
        Q = bi.encode(['query: ' + q], normalize_embeddings=True)[0]
        e5 = P @ Q
        cx = ce.predict([(q, c['text']) for c in d['chunks']], show_progress_bar=False)
        rows[q] = {'e5': [round(float(x), 3) for x in e5], 'ce': [round(float(x), 2) for x in cx]}
    out[lang] = {'ids': ids, 'q': rows}

stamp = datetime.date.today().isoformat()
ts = f"""// GENERADO por build-dense.py (no editar a mano). Mediciones reales de un recuperador denso y de un reordenador sobre el
// manual ficticio de la lección. Modelos: intfloat/multilingual-e5-small (MIT) y cross-encoder/mmarco-mMiniLMv2-L12-H384-v1
// (Apache-2.0). Generado el {stamp} con sentence-transformers {sentence_transformers.__version__} y torch {torch.__version__}, en CPU.
export interface DenseRow {{ e5: number[]; ce: number[] }}
export const DENSE: Record<'es' | 'en', {{ ids: string[]; q: Record<string, DenseRow> }}> = {json.dumps(out, ensure_ascii=False)};
"""
(HERE / 'dense.ts').write_text(ts, encoding='utf-8')
print('escrito dense.ts', {k: len(v['q']) for k, v in out.items()})
