#!/usr/bin/env python3
"""
Genera `llm.ts`: respuestas REALES de un modelo de lenguaje local a los prompts exactos de la lección «RAG».

Reproducir (desde `app/`, entorno con vLLM, una GPU con ≥ 6 GB libres y el modelo en la caché de Hugging Face):
    python src/content/courses/ia-generativa/lessons/rag/build-llm.py

Modelo: RedHatAI/gemma-3-4b-it-quantized.w4a16 (Gemma 3 de 4 mil M de parámetros ajustado con instrucciones, cuantizado a
4 bits por RedHat; términos de uso de Gemma). Decodificación voraz (temperatura 0), 200 tokens como máximo, mismo prompt que
muestra la escena (ver prompts.ts y export-prompts.mts). Sin selección: se guarda la primera y única salida de cada prompt.
Casos: norag (solo el rol, sin documentos), rag (con las 3 fuentes recuperadas), conflict (índice con la garantía vieja),
trap (índice con la reseña que trae una instrucción escondida) y nope (pregunta que el manual no responde).
"""
import json, pathlib, subprocess, datetime
from vllm import LLM, SamplingParams

HERE = pathlib.Path(__file__).resolve().parent
APP = HERE.parents[5]
raw = subprocess.run(['npx', 'tsx', str(HERE / 'export-prompts.mts')], cwd=APP, capture_output=True, text=True, check=True).stdout
prompts = json.loads(raw)

MODEL = 'RedHatAI/gemma-3-4b-it-quantized.w4a16'
llm = LLM(MODEL, max_model_len=4096, gpu_memory_utilization=0.35, enforce_eager=True)
sp = SamplingParams(temperature=0.0, max_tokens=200)

out = {}
for lang, cases in prompts.items():
    out[lang] = {}
    for name, p in cases.items():
        msgs = [{'role': 'system', 'content': p['system']}, {'role': 'user', 'content': p['user']}]
        res = llm.chat(msgs, sp)[0].outputs[0].text.strip()
        out[lang][name] = {'ids': p.get('ids'), 'answer': res}
        print(lang, name, '→', res.replace('\n', ' ')[:300])

stamp = datetime.date.today().isoformat()
ts = f"""// GENERADO por build-llm.py (no editar a mano). Respuestas reales de {MODEL} (Gemma 3 4B, cuantizado a 4 bits) a los
// prompts de la lección, con decodificación voraz. Generado el {stamp}. Una sola corrida, sin seleccionar la mejor.
export interface LlmRow {{ ids?: string[]; answer: string }}
export const LLM: Record<'es' | 'en', Record<'norag' | 'rag' | 'conflict' | 'trap' | 'nope', LlmRow>> = {json.dumps(out, ensure_ascii=False, indent=1)};
"""
(HERE / 'llm.ts').write_text(ts, encoding='utf-8')
print('escrito llm.ts')
