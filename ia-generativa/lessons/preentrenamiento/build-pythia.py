#!/usr/bin/env python3
"""
Genera `pythia-data.ts`: mediciones REALES sobre puntos de control de Pythia-1.4B para la lección «Preentrenamiento».

Reproducir (desde esta carpeta; requiere torch + transformers, una GPU de ≥ 6 GB y red la primera vez; ~3 GB por punto de control):
    python build-pythia.py              # escribe pythia-data.ts junto a este archivo

Modelo: EleutherAI/pythia-1.4b (Biderman et al., 2023, arXiv:2304.01373), licencia Apache-2.0. Se entrenó con The Pile
(Gao et al., 2020: 825 GiB de texto en inglés; Pythia ve unos 300 mil M de tokens) con un lote de 1024 secuencias × 2048 tokens
= 2 097 152 tokens por paso. Hay un punto de control en la inicialización (paso 0), en los pasos 1, 2, 4, …, 512 y cada 1000
pasos hasta el 143 000. Tokens vistos en el paso s = s × 2 097 152 (paso 143 000 → 299 892 736 000 ≈ 300 mil M).
Se usa la revisión `step<N>` de Hugging Face, en fp16, sin muestreo (decodificación voraz, 14 tokens nuevos).

Qué se mide en cada punto de control (todo determinista):
  · loss_en / loss_es: pérdida de entropía cruzada media (nats por token) sobre un texto de prueba PROPIO, escrito para esta
    lección (EVAL_EN y su versión en español, EVAL_ES). No está en The Pile (que se publicó en 2020). Son ~350 tokens: la
    medición es ruidosa, sirve para ver la forma de la curva, no para comparar modelos. bpb_*: la misma pérdida en bits por byte
    (comparable entre idiomas, porque no depende del tokenizador).
  · prob: probabilidad que el modelo asigna a la palabra correcta justo después de cada indicación (prompt) de PROBES.
  · gen: lo que el modelo escribe a continuación de cada indicación de PROMPTS (voraz).
Se hace un solo paso hacia delante por indicación; nada se retoca a mano, salvo recortar el texto generado en la escena.
"""
import json, math, pathlib, sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

NAME = 'EleutherAI/pythia-1.4b'
BATCH_TOKENS = 1024 * 2048
STEPS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 143000]

EVAL_EN = """The bakery on Fifth Street opens at six, but Marta is usually there by five. She turns on the ovens, weighs the flour, and checks the notes she left the night before. By the time the first customers arrive, the shelves are full of warm bread and the whole street smells of butter and yeast.

A bicycle stays upright mostly because the rider steers into the direction of the fall. When the bike leans to the left, a small turn of the handlebar to the left moves the wheels back under the rider. This happens so quickly and so often that the rider never notices it.

The town council voted on Tuesday to extend the opening hours of the public library until nine in the evening. Supporters said that many families can only visit after work, while a few residents worried about the cost of keeping the building open. The new schedule will begin next month.

To make a simple tomato sauce, heat some olive oil in a pan and add chopped garlic. When it turns golden, add a can of crushed tomatoes, a pinch of salt, and a few leaves of basil. Let it simmer for twenty minutes, stirring from time to time, until it thickens.

Learning a new skill rarely feels smooth. At the beginning, every step requires effort and attention, and mistakes are frequent. With practice, small pieces of the task become automatic, and attention is free to move on to harder parts. That is why short, regular sessions often work better than a single long one."""

EVAL_ES = """La panadería de la calle Quinta abre a las seis, pero Marta casi siempre llega a las cinco. Enciende los hornos, pesa la harina y revisa las notas que dejó la noche anterior. Cuando llegan los primeros clientes, los estantes ya están llenos de pan caliente y toda la calle huele a mantequilla y levadura.

Una bicicleta se mantiene en pie sobre todo porque quien la conduce gira hacia el lado de la caída. Cuando la bici se inclina a la izquierda, un pequeño giro del manubrio a la izquierda coloca de nuevo las ruedas bajo el ciclista. Esto ocurre tan rápido y tantas veces que nadie lo nota.

El consejo del pueblo votó el martes ampliar el horario de la biblioteca pública hasta las nueve de la noche. Quienes lo apoyan dijeron que muchas familias solo pueden ir después del trabajo, mientras que algunos vecinos se preocuparon por el costo de mantener abierto el edificio. El nuevo horario comenzará el mes próximo.

Para preparar una salsa de tomate sencilla, calienta un poco de aceite de oliva en una sartén y agrega ajo picado. Cuando se dore, añade una lata de tomate triturado, una pizca de sal y unas hojas de albahaca. Déjala hervir a fuego lento durante veinte minutos, removiendo de vez en cuando, hasta que espese.

Aprender una habilidad nueva pocas veces resulta fluido. Al principio, cada paso exige esfuerzo y atención, y los errores son frecuentes. Con la práctica, partes pequeñas de la tarea se vuelven automáticas y la atención queda libre para pasar a lo más difícil. Por eso las sesiones cortas y regulares suelen funcionar mejor que una sola sesión larga."""

# indicación → palabra correcta (la probabilidad de esa primera pieza se mide en cada punto de control)
PROBES = {
    'fact':    ('The capital of France is', ' Paris'),
    'pattern': ('cat = gato, dog = perro, house =', ' casa'),
    'count':   ('1, 2, 3, 4, 5,', ' 6'),
    'opp':     ('The opposite of hot is', ' cold'),
    'chem':    ('The chemical symbol for water is', ' H'),
    'es':      ('La capital de Francia es', ' París'),
}
PROMPTS = {
    'walk':    'The old man walked slowly down the',
    'door':    'She opened the door and',
    'fact':    'The capital of France is',
    'pattern': 'cat = gato, dog = perro, house =',
    'count':   '1, 2, 3, 4, 5,',
    'opp':     'The opposite of hot is',
    'chem':    'The chemical symbol for water is',
    'es':      'La capital de Francia es',
    'qa':      'What is the capital of France?',
    'poem':    'Write a short poem about the sea.',
    'logic':   'If all cats are animals and Tom is a cat, then Tom is',
    'add':     '2 + 2 =',
}

def text_loss(model, tok, text):
    ids = tok(text, return_tensors='pt').input_ids.cuda()
    with torch.no_grad():
        logits = model(ids).logits.float()
    lp = torch.log_softmax(logits[0, :-1], -1)
    nll = -lp.gather(1, ids[0, 1:, None]).squeeze(1)
    n = ids.shape[1] - 1                       # la primera pieza no tiene contexto: no se cuenta
    total = float(nll.sum())
    return total / n, total / (len(text.encode('utf-8')) * math.log(2)) * (n / n), n

def prob_of(model, tok, prompt, answer):
    ids = tok(prompt, return_tensors='pt').input_ids.cuda()
    a = tok(answer, add_special_tokens=False).input_ids[0]
    with torch.no_grad():
        p = torch.softmax(model(ids).logits[0, -1].float(), -1)
    rank = int((p > p[a]).sum()) + 1
    return float(p[a]), rank

def generate(model, tok, prompt, n=14):
    ids = tok(prompt, return_tensors='pt').to('cuda')
    with torch.no_grad():
        out = model.generate(**ids, max_new_tokens=n, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0][ids['input_ids'].shape[1]:], skip_special_tokens=True)

rows = []
tok = AutoTokenizer.from_pretrained(NAME)
for s in STEPS:
    model = AutoModelForCausalLM.from_pretrained(NAME, revision=f'step{s}', dtype=torch.float16).cuda().eval()
    le, be, ne = text_loss(model, tok, EVAL_EN)
    ls, bs, ns = text_loss(model, tok, EVAL_ES)
    # bits por byte: nats totales / (bytes · ln 2); text_loss ya devuelve nats/token, se recalcula con el total
    row = dict(step=s, tokens=s * BATCH_TOKENS, loss_en=le, loss_es=ls, n_en=ne, n_es=ns,
               bytes_en=len(EVAL_EN.encode('utf-8')), bytes_es=len(EVAL_ES.encode('utf-8')))
    row['bpb_en'] = le * ne / (row['bytes_en'] * math.log(2))
    row['bpb_es'] = ls * ns / (row['bytes_es'] * math.log(2))
    row['prob'] = {k: dict(zip(('p', 'rank'), prob_of(model, tok, p, a))) for k, (p, a) in PROBES.items()}
    row['gen'] = {k: generate(model, tok, p) for k, p in PROMPTS.items()}
    rows.append(row)
    print(s, round(le, 3), round(ls, 3), round(row['prob']['fact']['p'], 5), repr(row['gen']['fact'][:40]), flush=True)
    del model; torch.cuda.empty_cache()

here = pathlib.Path(__file__).parent
(here / 'pythia-data.json').write_text(json.dumps(dict(model=NAME, batch_tokens=BATCH_TOKENS, rows=rows), ensure_ascii=False, indent=1), encoding='utf-8')
print('escrito pythia-data.json')
