#!/usr/bin/env python3
"""
Genera `outputs-data.ts`: salidas REALES de un modelo base y del mismo modelo convertido en asistente, para la lección
«De modelo base a asistente».

Reproducir (desde esta carpeta; requiere torch + transformers, una GPU de ≥ 6 GB y red la primera vez; ~2,2 GB por modelo):
    python build-outputs.py             # escribe outputs.json y outputs-data.ts junto a este archivo

Modelos (ambos con licencia Apache-2.0; Zhang et al., «TinyLlama», 2024, arXiv:2401.02385; receta de ajuste: Tunstall et al., «Zephyr», 2023, arXiv:2310.16944):
    · TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T   modelo base: solo preentrenamiento (≈ 3 billones de tokens)
    · TinyLlama/TinyLlama-1.1B-Chat-v1.0                    el mismo modelo ajustado: primero con UltraChat (diálogos sintéticos;
                                                            ajuste con instrucciones) y luego alineado con DPO sobre UltraFeedback
                                                            (64 mil indicaciones con respuestas ordenadas por GPT-4), según su ficha.
Decodificación voraz (sin muestreo), bf16, un solo intento por indicación; nada se retoca a mano, salvo recortar el texto en la escena.
  · Base: la indicación se pasa tal cual, como texto plano (sin plantilla de chat); hasta 60 tokens nuevos.
  · Asistente: se usa la plantilla de chat del modelo; hasta 100 tokens nuevos.
Las cuatro indicaciones se fijaron ANTES de ver ninguna salida y se muestran todas (no se descartó ninguna). El modelo se
entrenó sobre todo en inglés, por eso las indicaciones van en inglés en las dos versiones de la lección.
Transparencia sobre la elección del par de modelos: antes se probó, con las mismas cuatro indicaciones, Qwen2.5-1.5B (base) y su
versión Instruct (Apache-2.0). Su modelo base ya responde con soltura (su informe técnico, arXiv:2412.15115 §3.1, dice que el
preentrenamiento usa datos sintéticos generados por modelos instruidos), así que no sirve para mostrar el contraste que enseña la
lección. Se descartó ese par por esa razón, no por la calidad de sus respuestas; se menciona en «Por dentro».
Si un modelo alcanza el tope de tokens sin terminar, se marca `cut: true` y la escena añade «…».
"""
import json, pathlib
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

BASE, CHAT = 'TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T', 'TinyLlama/TinyLlama-1.1B-Chat-v1.0'
PROMPTS = ['What is the capital of France?', 'Explain in one sentence what inflation is.',
           'Write a two-line email asking for a meeting.', 'Give me three tips to sleep better.']
N_BASE, N_CHAT = 60, 100
here = pathlib.Path(__file__).parent
dev = 'cuda' if torch.cuda.is_available() else 'cpu'

def load(name):
    tok = AutoTokenizer.from_pretrained(name)
    model = AutoModelForCausalLM.from_pretrained(name, dtype=torch.bfloat16).to(dev).eval()
    return tok, model

@torch.no_grad()
def gen(tok, model, text, n):
    ids = tok(text, return_tensors='pt').to(dev)
    out = model.generate(**ids, max_new_tokens=n, do_sample=False, pad_token_id=tok.eos_token_id)
    new = out[0, ids['input_ids'].shape[1]:]
    return tok.decode(new, skip_special_tokens=True), bool(len(new) >= n and new[-1].item() != tok.eos_token_id)

res = [{'prompt': p} for p in PROMPTS]
tok, m = load(BASE)
for r in res:
    r['base'], r['baseCut'] = gen(tok, m, r['prompt'], N_BASE)
del m; torch.cuda.empty_cache()
tok, m = load(CHAT)
for r in res:
    text = tok.apply_chat_template([{'role': 'user', 'content': r['prompt']}], tokenize=False, add_generation_prompt=True)
    r['chat'], r['chatCut'] = gen(tok, m, text, N_CHAT)

(here / 'outputs.json').write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')
ts = ['// GENERADO por build-outputs.py (ver ese archivo para reproducirlo). No editar a mano.',
      '// Salidas reales, decodificación voraz, de TinyLlama-1.1B (base, 3T) y TinyLlama-1.1B-Chat-v1.0 (Apache-2.0).',
      'export interface Sample { prompt: string; base: string; baseCut: boolean; chat: string; chatCut: boolean }',
      'export const SAMPLES: Sample[] = ' + json.dumps(res, ensure_ascii=False, indent=2) + ';', '']
(here / 'outputs-data.ts').write_text('\n'.join(ts), encoding='utf-8')
print(json.dumps(res, ensure_ascii=False, indent=1))
