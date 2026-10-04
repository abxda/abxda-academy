#!/usr/bin/env python3
"""Mide, FUERA de línea, qué tan bien encuentra un modelo moderno de oraciones los documentos de la búsqueda de juguete
de la lección 14, y guarda los puntajes en data/search-eval.json.

    ~/venvs/tts/bin/python eval-search.py        # cualquier entorno con torch y transformers

Modelo: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (licencia Apache-2.0, 384 dimensiones, 50 idiomas, ≈ 0,1 mil
millones de parámetros), revisión e8f8c211226b894fcb81acc59f3b34ba3efd5f42. Se promedian los vectores de las palabras de cada
texto (con la máscara de atención), como en su ficha, y se normalizan a longitud 1: el puntaje es la similitud coseno.
Las 10 frases-documento y las 36 consultas están en data/search-cases.json (las escribió el autor; son ilustrativas).
Se evalúa cada idioma por separado: documentos y consultas en español, o documentos y consultas en inglés.
Las otras dos búsquedas (palabras exactas y promedio de vectores GloVe) se miden en el navegador, con el mismo código que la escena.

Referencias: Reimers y Gurevych (2019), «Sentence-BERT», EMNLP; Reimers y Gurevych (2020), «Making Monolingual Sentence
Embeddings Multilingual using Knowledge Distillation», EMNLP.
"""
import json, os
import numpy as np, torch
from transformers import AutoModel, AutoTokenizer

HERE = os.path.dirname(os.path.abspath(__file__))
NAME, REV = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', 'e8f8c211226b894fcb81acc59f3b34ba3efd5f42'
C = json.load(open(os.path.join(HERE, 'data', 'search-cases.json'), encoding='utf8'))
tok = AutoTokenizer.from_pretrained(NAME, revision=REV); mod = AutoModel.from_pretrained(NAME, revision=REV).eval()

def enc(texts):
    out = []
    for i in range(0, len(texts), 32):
        b = tok(texts[i:i + 32], padding=True, truncation=True, max_length=128, return_tensors='pt')
        with torch.no_grad(): h = mod(**b).last_hidden_state
        m = b['attention_mask'].unsqueeze(-1).float(); out.append(((h * m).sum(1) / m.sum(1)).numpy())
    E = np.concatenate(out); return E / np.linalg.norm(E, axis=1, keepdims=True)

res = {'model': NAME, 'revision': REV, 'license': 'Apache-2.0', 'dim': 384, 'scores': {}, 'hits': {}}
ids = [d['id'] for d in C['docs']]
for lang in ('en', 'es'):
    D = enc([d[lang] for d in C['docs']]); Q = enc([q[lang] for q in C['queries']])
    S = Q @ D.T
    res['scores'][lang] = S.round(4).tolist()
    res['hits'][lang] = int(sum(ids[S[i].argmax()] == q['want'] for i, q in enumerate(C['queries'])))
    print(lang, res['hits'][lang], '/', len(C['queries']))
json.dump(res, open(os.path.join(HERE, 'data', 'search-eval.json'), 'w'), separators=(',', ':'))
