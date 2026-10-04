#!/usr/bin/env python3
"""
Genera `pythia-data.ts`: mediciones REALES sobre puntos de control de Pythia-1.4B para la lección «Preentrenamiento».
Nada de lo que contiene es ilustrativo: cada número y cada texto salen de ejecutar el modelo en cada punto de control.

Reproducir (desde esta carpeta; requiere torch + transformers, una GPU de ≥ 6 GB y red la primera vez; ~5,7 GB por punto de control):
    python build-pythia.py              # escribe pythia-data.ts junto a este archivo
Entorno usado: torch 2.5.1 (CUDA 12.1), transformers 4.57.3, GPU RTX 3060 de 12 GB; los pesos (guardados en fp32) se cargan en fp16
(Pythia se entrenó con precisión mixta fp16; el redondeo cambia las cifras de la tercera cifra decimal en adelante) y los logits
se pasan a fp32 antes de calcular probabilidades y pérdidas.

Modelo: EleutherAI/pythia-1.4b (Biderman et al., 2023, arXiv:2304.01373), licencia Apache-2.0. Se entrenó con The Pile
(Gao et al., 2020, arXiv:2101.00027: 825 GiB de texto, mayoritariamente en inglés) SIN deduplicar, durante 143 000 pasos con
un lote de 1024 secuencias × 2048 tokens = 2 097 152 tokens por paso. Tokens vistos en el paso s = s × 2 097 152
(paso 143 000 → 299 892 736 000 ≈ 300 mil M). Hay un punto de control en el paso 0 (pesos aleatorios), en 1, 2, 4, …, 512 y
cada 1000 pasos hasta el 143 000 (154 en total); aquí se usan 25 de ellos, repartidos aproximadamente en escala logarítmica
(se bajan con la revisión `step<N>` de Hugging Face).

Qué se mide en cada punto de control (todo determinista: sin muestreo, decodificación voraz):
  · en / es: pérdida de entropía cruzada media (nats por token) y en bits por byte (bpb) sobre un texto de prueba PROPIO,
    escrito para esta lección en 2026 (EVAL_EN y su versión en español, EVAL_ES). Como The Pile se publicó en 2020, ese texto
    no puede estar en sus datos. Son pocos cientos de tokens: la medición es ruidosa, sirve para ver la forma de la curva,
    no para comparar modelos. Los bits por byte son comparables entre idiomas (no dependen del tokenizador); los nats por
    token no. La primera pieza de cada texto no tiene contexto y no se cuenta.
  · cat: pérdida media del texto en inglés por tipo de pieza (puntuación, palabras funcionales, nombres propios y
    capitalizadas, y el resto), con reglas simples y visibles en `categorize`.
  · passage: pérdida (nats) de cada una de las piezas del arranque del texto en inglés (el pasaje que dibuja la escena).
  · probs: probabilidad que el modelo da a la respuesta correcta completa de cada indicación de PROBES (producto de las
    probabilidades de sus piezas, con las anteriores forzadas) y si decodificando de forma voraz la dice tal cual (`hit`).
  · gen: lo que el modelo escribe a continuación de cada indicación de PROMPTS (voraz, GEN_TOKENS piezas nuevas).
  · mem: para textos muy repetidos en internet y libres de derechos (preámbulo de la Constitución de EE. UU., licencia MIT,
    Quijote, el «lorem ipsum»), cuántas piezas seguidas del texto original recita el modelo palabra por palabra.
  · guess (solo pasos 0 y 143 000): la distribución de la siguiente pieza tras el comienzo de la primera frase del texto de
    prueba («…Marta is usually there by»): las 6 piezas más probables, la probabilidad y el lugar de la pieza correcta.
  · final (solo en el último punto de control): respuestas más largas a indicaciones de chat y de continuación (BASE_PROMPTS).
Nada se retoca a mano; la escena solo recorta el texto generado para que quepa.
"""
import json, math, pathlib, re, sys
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

NAME = 'EleutherAI/pythia-1.4b'
BATCH_TOKENS = 1024 * 2048
STEPS = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1000, 2000, 3000, 4000, 6000, 8000, 12000, 16000, 24000, 32000, 48000, 64000, 100000, 143000]
GEN_TOKENS = 24
PASSAGE_TOKENS = 40     # cuántas piezas del arranque del texto en inglés dibuja la escena

EVAL_EN = """The bakery on Fifth Street opens at six, but Marta is usually there by five. She turns on the ovens, weighs the flour, and checks the notes she left the night before. By the time the first customers arrive, the shelves are full of warm bread and the whole street smells of butter and yeast.

A bicycle stays upright mostly because the rider steers into the direction of the fall. When the bike leans to the left, a small turn of the handlebar to the left moves the wheels back under the rider. This happens so quickly and so often that the rider never notices it.

The town council voted on Tuesday to extend the opening hours of the public library until nine in the evening. Supporters said that many families can only visit after work, while a few residents worried about the cost of keeping the building open. The new schedule will begin next month.

To make a simple tomato sauce, heat some olive oil in a pan and add chopped garlic. When it turns golden, add a can of crushed tomatoes, a pinch of salt, and a few leaves of basil. Let it simmer for twenty minutes, stirring from time to time, until it thickens.

Learning a new skill rarely feels smooth. At the beginning, every step requires effort and attention, and mistakes are frequent. With practice, small pieces of the task become automatic, and attention is free to move on to harder parts. That is why short, regular sessions often work better than a single long one.

The ferry crosses the bay four times a day, and in winter the crossing can take twice as long when the wind rises. Passengers usually stay inside the cabin with a cup of coffee, but a few always remain on deck to watch the gulls follow the boat. When the island finally appears through the fog, everyone looks up at the same time.

Our neighbor keeps bees on the roof of her building. In spring she opens the hives to check the queen, and in late summer she collects the honey, which tastes different every year depending on which flowers bloomed. She says the first thing a beekeeper learns is to move slowly.

The museum will close its main gallery next week for repairs to the roof. Visitors who already bought tickets can use them later, and the paintings from that room will be shown in the east wing until the work is finished. A spokesperson said that the repairs should take about six weeks."""

EVAL_ES = """La panadería de la calle Quinta abre a las seis, pero Marta casi siempre llega a las cinco. Enciende los hornos, pesa la harina y revisa las notas que dejó la noche anterior. Cuando llegan los primeros clientes, los estantes ya están llenos de pan caliente y toda la calle huele a mantequilla y levadura.

Una bicicleta se mantiene en pie sobre todo porque quien la conduce gira hacia el lado de la caída. Cuando la bici se inclina a la izquierda, un pequeño giro del manubrio a la izquierda coloca de nuevo las ruedas bajo el ciclista. Esto ocurre tan rápido y tantas veces que nadie lo nota.

El consejo del pueblo votó el martes ampliar el horario de la biblioteca pública hasta las nueve de la noche. Quienes lo apoyan dijeron que muchas familias solo pueden ir después del trabajo, mientras que algunos vecinos se preocuparon por el costo de mantener abierto el edificio. El nuevo horario comenzará el mes próximo.

Para preparar una salsa de tomate sencilla, calienta un poco de aceite de oliva en una sartén y agrega ajo picado. Cuando se dore, añade una lata de tomate triturado, una pizca de sal y unas hojas de albahaca. Déjala hervir a fuego lento durante veinte minutos, removiendo de vez en cuando, hasta que espese.

Aprender una habilidad nueva pocas veces resulta fluido. Al principio, cada paso exige esfuerzo y atención, y los errores son frecuentes. Con la práctica, partes pequeñas de la tarea se vuelven automáticas y la atención queda libre para pasar a lo más difícil. Por eso las sesiones cortas y regulares suelen funcionar mejor que una sola sesión larga.

El transbordador cruza la bahía cuatro veces al día y, en invierno, la travesía puede durar el doble cuando se levanta el viento. Los pasajeros suelen quedarse dentro de la cabina con una taza de café, pero unos pocos siempre se quedan en cubierta para ver cómo las gaviotas siguen al barco. Cuando por fin aparece la isla entre la niebla, todos levantan la vista al mismo tiempo.

Nuestra vecina tiene abejas en la azotea de su edificio. En primavera abre las colmenas para revisar a la reina y, a finales del verano, recoge la miel, que cada año sabe distinto según las flores que hayan brotado. Dice que lo primero que aprende un apicultor es a moverse despacio.

El museo cerrará la sala principal la próxima semana para reparar el techo. Quienes ya compraron boleto podrán usarlo más adelante, y las pinturas de esa sala se mostrarán en el ala este hasta que terminen las obras. Un portavoz dijo que las reparaciones deberían tardar unas seis semanas."""

# indicación → respuesta correcta (se mide la probabilidad de la respuesta completa)
PROBES = {
    'fact':    ('The capital of France is', ' Paris'),
    'opp':     ('The opposite of hot is', ' cold'),
    'count':   ('1, 2, 3, 4, 5,', ' 6'),
    'pattern': ('cat = gato, dog = perro, house =', ' casa'),
    'water':   ('The chemical formula for water is', ' H2O'),
    'sum':     ('Two plus two equals', ' four'),
    'es':      ('La capital de Francia es', ' París'),
}
# indicaciones cuya continuación se guarda en cada punto de control
PROMPTS = {
    'walk':    'The old man walked slowly down the',
    'door':    'She opened the door and',
    'fact':    'The capital of France is',
    'opp':     'The opposite of hot is',
    'count':   '1, 2, 3, 4, 5,',
    'pattern': 'cat = gato, dog = perro, house =',
    'sum':     'Two plus two equals',
    'es':      'La capital de Francia es',
    'qa':      'Q: What is the capital of France?\nA:',
    'wc22':    'The 2022 FIFA World Cup was won by',
    'gpt':     'In November 2022, OpenAI released a chatbot called',
}
# textos de dominio público (o sin derechos de autor) muy repetidos en la web: ¿los recita palabra por palabra?
MEM = {
    'lorem':     ('Lorem ipsum dolor sit amet, consectetur adipiscing elit,', ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'),
    'preamble':  ('We the People of the United States, in Order to form a more perfect Union,', ' establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.'),
    'mit':       ('Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal', ' in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,'),
    'quijote':   ('En un lugar de la Mancha, de cuyo nombre no quiero acordarme,', ' no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor.'),
}
MEM_TOKENS = 40
# apuesta del modelo en un hueco concreto de la escena (primera frase del texto de prueba): distribución de la siguiente pieza
GUESS_CONTEXT = 'The bakery on Fifth Street opens at six, but Marta is usually there by'
GUESS_TRUTH = ' five'
GUESS_STEPS = [0, 143000]
GUESS_TOP = 6
# solo en el último punto de control: respuestas largas a indicaciones de chat (el modelo base NO las contesta como un asistente)
BASE_PROMPTS = {
    'chat_capital': 'What is the capital of France?',
    'chat_poem':    'Write a short poem about the sea.',
    'chat_nn':      'Explain what a neural network is in one sentence.',
    'chat_es':      '¿Cuál es la capital de Francia?',
    'doc_capital':  'Q: What is the capital of France?\nA:',
    'doc_list':     'Frequently asked questions\n\nQ: What is the capital of France?\nA: Paris.\n\nQ: What is the capital of Italy?\nA:',
}
BASE_TOKENS = 56

FUNC = set('''the a an of to and in is are was were be been being that this these those it its for as with on by at but or not
from has have had he she they we you i his her their our your my me him them us so if than then there here which who whom what
when where why how can could will would shall should may might do does did done no yes more most some any all each other such
only own same too very just also into over about up out off after before between through during under again once while
because until against both few further how nor s t don now'''.split())

def categorize(piece: str) -> str:
    """Tipo de pieza: puntuación, palabra funcional, nombre propio/capitalizada u otra."""
    core = piece.strip()
    if not any(ch.isalnum() for ch in core): return 'punct'
    w = core.lower()
    if w in FUNC: return 'func'
    if core[:1].isupper(): return 'name'
    return 'content'

def text_losses(model, tok, text):
    enc = tok(text, return_tensors='pt')
    ids = enc.input_ids.cuda()
    with torch.no_grad():
        logits = model(ids).logits.float()
    lp = torch.log_softmax(logits[0, :-1], -1)
    nll = -lp.gather(1, ids[0, 1:, None]).squeeze(1)       # nats de las piezas 1..n-1 (la 0 no tiene contexto)
    return ids[0].tolist(), nll.cpu().tolist()

def seq_prob(model, tok, prompt, answer):
    p_ids = tok(prompt, return_tensors='pt').input_ids[0].tolist()
    a_ids = tok(answer, add_special_tokens=False).input_ids
    ids = torch.tensor([p_ids + a_ids]).cuda()
    with torch.no_grad():
        logits = model(ids).logits[0].float()
    lp = torch.log_softmax(logits, -1)
    total = 0.0
    for i, a in enumerate(a_ids):
        total += float(lp[len(p_ids) - 1 + i, a])
    return math.exp(total), a_ids

def generate_ids(model, tok, prompt, n):
    enc = tok(prompt, return_tensors='pt').to('cuda')
    with torch.no_grad():
        out = model.generate(**enc, max_new_tokens=n, do_sample=False, pad_token_id=tok.eos_token_id)
    return out[0][enc['input_ids'].shape[1]:].tolist()

def r(x, k=3): return round(float(x), k)

tok = AutoTokenizer.from_pretrained(NAME)
# pasaje que dibuja la escena: las primeras PASSAGE_TOKENS piezas del texto en inglés
en_ids0 = tok(EVAL_EN).input_ids
passage_pieces = [tok.decode([i]) for i in en_ids0[:PASSAGE_TOKENS]]
passage_text = tok.decode(en_ids0[:PASSAGE_TOKENS])
cats_en = [categorize(tok.decode([i])) for i in en_ids0[1:]]       # categoría de las piezas 1..n-1

import os, time
CACHE = pathlib.Path(os.environ.get('PYTHIA_CACHE', '/tmp/pythia-cache')); CACHE.mkdir(parents=True, exist_ok=True)

def measure(s):
    model = AutoModelForCausalLM.from_pretrained(NAME, revision=f'step{s}', dtype=torch.float16).cuda().eval()
    ids_en, nll_en = text_losses(model, tok, EVAL_EN)
    ids_es, nll_es = text_losses(model, tok, EVAL_ES)
    n_en, n_es = len(nll_en), len(nll_es)
    b_en, b_es = len(EVAL_EN.encode('utf-8')), len(EVAL_ES.encode('utf-8'))
    cat = {}
    for c in ('punct', 'func', 'name', 'content'):
        xs = [x for x, k in zip(nll_en, cats_en) if k == c]
        cat[c] = r(sum(xs) / len(xs))
    row = dict(step=s, tokens=s * BATCH_TOKENS,
               en=dict(loss=r(sum(nll_en) / n_en), bpb=r(sum(nll_en) / (b_en * math.log(2)), 4)),
               es=dict(loss=r(sum(nll_es) / n_es), bpb=r(sum(nll_es) / (b_es * math.log(2)), 4)),
               cat=cat, passage=[r(x, 2) for x in nll_en[:PASSAGE_TOKENS - 1]])
    probs = {}
    for k, (p, a) in PROBES.items():
        pr, a_ids = seq_prob(model, tok, p, a)
        g = generate_ids(model, tok, p, len(a_ids))
        probs[k] = dict(p=float(f'{pr:.4g}'), hit=bool(g == a_ids))
    row['probs'] = probs
    row['gen'] = {k: tok.decode(generate_ids(model, tok, p, GEN_TOKENS)) for k, p in PROMPTS.items()}
    mem = {}
    for k, (p, a) in MEM.items():
        a_ids = tok(a, add_special_tokens=False).input_ids
        g = generate_ids(model, tok, p, MEM_TOKENS)
        m = 0
        while m < len(a_ids) and m < len(g) and g[m] == a_ids[m]: m += 1
        mem[k] = dict(gen=tok.decode(g), match=m, truth=len(a_ids))
    row['mem'] = mem
    if s == STEPS[-1]:
        row['final'] = {k: tok.decode(generate_ids(model, tok, p, BASE_TOKENS)) for k, p in BASE_PROMPTS.items()}
    del model; torch.cuda.empty_cache()
    return row

def guess_at(s):
    model = AutoModelForCausalLM.from_pretrained(NAME, revision=f'step{s}', dtype=torch.float16).cuda().eval()
    ids = tok(GUESS_CONTEXT, return_tensors='pt').input_ids.cuda()
    with torch.no_grad():
        pr = torch.softmax(model(ids).logits[0, -1].float(), -1)
    t = tok(GUESS_TRUTH, add_special_tokens=False).input_ids[0]
    top = torch.topk(pr, GUESS_TOP)
    out = dict(top=[[tok.decode([int(i)]), float(f'{float(v):.4g}')] for v, i in zip(top.values, top.indices)],
               p_true=float(f'{float(pr[t]):.4g}'), rank_true=int((pr > pr[t]).sum()) + 1)
    del model; torch.cuda.empty_cache()
    return out

rows = []
for s in STEPS:
    f = CACHE / f'step{s}.json'
    if f.exists():
        row = json.loads(f.read_text(encoding='utf-8'))
    else:
        for attempt in range(60):                       # la GPU puede estar compartida: si falta memoria, espera y reintenta
            try:
                row = measure(s); break
            except torch.OutOfMemoryError:
                torch.cuda.empty_cache(); print('sin memoria en la GPU; reintento', attempt, flush=True); time.sleep(30)
        else:
            sys.exit('no se pudo medir el paso %d' % s)
        f.write_text(json.dumps(row, ensure_ascii=False), encoding='utf-8')
    rows.append(row)
    print(s, row['en'], row['es']['bpb'], row['cat'], row['probs']['fact'], repr(row['gen']['fact'][:50]), flush=True)

guess = {}
for gs in GUESS_STEPS:
    f = CACHE / f'guess{gs}.json'
    if f.exists():
        guess[str(gs)] = json.loads(f.read_text(encoding='utf-8'))
    else:
        for attempt in range(60):
            try:
                guess[str(gs)] = guess_at(gs); break
            except torch.OutOfMemoryError:
                torch.cuda.empty_cache(); print('sin memoria en la GPU; reintento', attempt, flush=True); time.sleep(30)
        f.write_text(json.dumps(guess[str(gs)], ensure_ascii=False), encoding='utf-8')
    print('guess', gs, guess[str(gs)], flush=True)

data = dict(model=NAME, batch_tokens=BATCH_TOKENS, vocab=tok.vocab_size, eval_tokens_en=len(en_ids0) - 1, eval_bytes_en=len(EVAL_EN.encode('utf-8')),
            eval_bytes_es=len(EVAL_ES.encode('utf-8')), passage_pieces=passage_pieces, passage_text=passage_text,
            prompts=PROMPTS, probes={k: v[0] for k, v in PROBES.items()}, answers={k: v[1] for k, v in PROBES.items()},
            mem_prompts={k: v[0] for k, v in MEM.items()}, mem_truth={k: v[1] for k, v in MEM.items()}, base_prompts=BASE_PROMPTS,
            guess=dict(context=GUESS_CONTEXT, truth=GUESS_TRUTH, steps=guess), rows=rows)

here = pathlib.Path(__file__).parent
body = json.dumps(data, ensure_ascii=False, indent=1)
(here / 'pythia-data.ts').write_text(
    '// GENERADO por build-pythia.py: mediciones reales de Pythia-1.4B (EleutherAI, Apache-2.0). No editar a mano.\n'
    '/* eslint-disable */\n'
    'export interface PythiaRow {\n'
    '  step: number; tokens: number;\n'
    '  en: { loss: number; bpb: number }; es: { loss: number; bpb: number };\n'
    '  cat: { punct: number; func: number; name: number; content: number };\n'
    '  passage: number[];\n'
    '  probs: Record<string, { p: number; hit: boolean }>;\n'
    '  gen: Record<string, string>;\n'
    '  mem: Record<string, { gen: string; match: number; truth: number }>;\n'
    '  final?: Record<string, string>;\n'
    '}\n'
    'export interface PythiaData {\n'
    '  model: string; batch_tokens: number; vocab: number; eval_tokens_en: number; eval_bytes_en: number; eval_bytes_es: number;\n'
    '  passage_pieces: string[]; passage_text: string;\n'
    '  prompts: Record<string, string>; probes: Record<string, string>; answers: Record<string, string>;\n'
    '  mem_prompts: Record<string, string>; mem_truth: Record<string, string>; base_prompts: Record<string, string>;\n'
    '  guess: { context: string; truth: string; steps: Record<string, { top: [string, number][]; p_true: number; rank_true: number }> };\n'
    '  rows: PythiaRow[];\n'
    '}\n'
    'export const PYTHIA: PythiaData = ' + body + ';\n', encoding='utf-8')
print('escrito pythia-data.ts')
