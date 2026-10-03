"""Mide con tokenizadores REALES las cifras que la lección «Tokens» muestra como «medido» (data.ts → REAL).

Reproducir:
    python3 -m venv /tmp/v && /tmp/v/bin/pip install tiktoken && /tmp/v/bin/python measure-real.py

Se midió con tiktoken 0.14.0 (OpenAI, licencia MIT). `gpt2` es el tokenizador de GPT-2 (también el de GPT-3);
`cl100k_base` es el que tiktoken asigna a gpt-4 y gpt-3.5-turbo; `o200k_base`, el que asigna a gpt-4o
(ver `tiktoken.encoding_for_model`). Las frases son nuestras (no salen de ningún conjunto de datos).
Las cifras de vocabulario de Llama 2 (32 k) y Llama 3 (128 k) NO se miden aquí: vienen de sus informes técnicos.
"""
import tiktoken

PAIRS = [  # (inglés, español): la misma frase en los dos idiomas
    ("The company is investing in artificial intelligence.", "La empresa está invirtiendo en inteligencia artificial."),
    ("Please send me the report before tomorrow's meeting.", "Por favor, envíame el informe antes de la reunión de mañana."),
    ("The weather is nice today, so we are going to the park.", "El clima está agradable hoy, así que vamos al parque."),
    ("The customer says the product arrived late.", "El cliente dice que el producto llegó tarde."),
]

print("modelo -> codificación:", {m: tiktoken.encoding_for_model(m).name for m in ("gpt-4", "gpt-4o", "gpt-3.5-turbo")})
for name in ("gpt2", "cl100k_base", "o200k_base"):
    enc = tiktoken.get_encoding(name)
    en = sum(len(enc.encode(a)) for a, _ in PAIRS)
    es = sum(len(enc.encode(b)) for _, b in PAIRS)
    print(f"{name}: vocabulario {enc.n_vocab} ({len(enc._mergeable_ranks)} ordinarios), 4 frases: en {en} · es {es} · razón {es / en:.2f}")

enc = tiktoken.get_encoding("cl100k_base")
for w in (" strawberry", " frambuesa", "1234567"):   # con espacio inicial, como aparecen en una frase
    ids = enc.encode(w)
    print(w, ids, [enc.decode([i]) for i in ids])
