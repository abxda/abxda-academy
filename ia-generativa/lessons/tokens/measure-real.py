"""Mide con tokenizadores REALES todas las cifras «medidas» de la lección «Tokens» y escribe `real-data.ts`.

Reproducir (CPU, sin GPU; tarda unos segundos):
    python3 -m venv /tmp/v && /tmp/v/bin/pip install tiktoken==0.14.0
    curl -LO https://dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz      # FLORES-200 (CC BY-SA 4.0)
    tar -xzf flores200_dataset.tar.gz
    /tmp/v/bin/python -I measure-real.py flores200_dataset

Qué se mide:
  · Con tiktoken 0.14.0 (OpenAI, licencia MIT): `gpt2` es el tokenizador de GPT-2; `cl100k_base`, el que tiktoken asigna
    a gpt-4; `o200k_base`, el que asigna a gpt-4o (ver `tiktoken.encoding_for_model`, que el script imprime).
  · Las frases cortas (la del gato, las cuatro parejas inglés/español, la pregunta de las erres) las escribimos nosotros.
  · La comparación grande usa las 1 012 frases paralelas de FLORES-200 «devtest» en inglés (eng_Latn) y español
    (spa_Latn) (NLLB Team, 2022). No se redistribuye el texto: solo se publican los totales de tokens.
  · Los tamaños de vocabulario de Llama 2 (32 k) y Llama 3 (128 K) NO se miden aquí: vienen de sus informes técnicos.
"""
import json
import sys

import tiktoken

E = {n: tiktoken.get_encoding(n) for n in ("gpt2", "cl100k_base", "o200k_base")}
O = E["o200k_base"]


def pieces(enc, text):
    ids = enc.encode(text)
    return {"text": text, "ids": ids, "pieces": [enc.decode([i]) for i in ids]}


SENT = {"es": "Mi gato se llama Quetzalcóatl.", "en": "My cat is named Quetzalcoatl."}
# Cuatro parejas (inglés, español) para el «tu turno»: escritas para la lección.
PAIRS = [
    ("Please send me the report before tomorrow's meeting.", "Por favor, envíame el informe antes de la reunión de mañana."),
    ("The company is investing in artificial intelligence.", "La empresa está invirtiendo en inteligencia artificial."),
    ("The customer says the product arrived late.", "El cliente dice que el producto llegó tarde."),
    ("We need to reduce costs without affecting quality.", "Necesitamos reducir costos sin afectar la calidad."),
]
ASK = {"es": "¿Cuántas erres tiene carretera?", "en": "How many r's are in strawberry?"}
WORD = {"es": " carretera", "en": " strawberry"}
SPELL = {"es": "c a r r e t e r a", "en": "s t r a w b e r r y"}
NUM = "1234567"
# Una petición y su respuesta (para mostrar lo que se lee y lo que se escribe).
CHAT = {"es": ("¿Cómo se llama mi gato?", "Se llama Quetzalcóatl."), "en": ("What is my cat's name?", "Its name is Quetzalcoatl.")}

print("modelo -> codificación:", {m: tiktoken.encoding_for_model(m).name for m in ("gpt-2", "gpt-4", "gpt-4o")}, file=sys.stderr)

out = {
    "vocab": {n: E[n].n_vocab for n in E},
    "sent": {lg: pieces(O, t) for lg, t in SENT.items()},
    "pairs": [{"en": pieces(O, a), "es": pieces(O, b)} for a, b in PAIRS],
    "ask": {lg: pieces(O, t) for lg, t in ASK.items()},
    "word": {lg: pieces(O, t) for lg, t in WORD.items()},
    "spell": {lg: pieces(O, t) for lg, t in SPELL.items()},
    "num": pieces(O, NUM),
    "chat": {lg: {"ask": pieces(O, q), "answer": pieces(O, a)} for lg, (q, a) in CHAT.items()},
}

if len(sys.argv) > 1:
    d = sys.argv[1]
    en = open(f"{d}/devtest/eng_Latn.devtest", encoding="utf-8").read().splitlines()
    es = open(f"{d}/devtest/spa_Latn.devtest", encoding="utf-8").read().splitlines()
    assert len(en) == len(es) == 1012
    fl = {"sentences": len(en), "words": {"en": sum(len(s.split()) for s in en), "es": sum(len(s.split()) for s in es)}}
    for n, enc in E.items():
        fl[n] = {"en": sum(len(enc.encode(s)) for s in en), "es": sum(len(enc.encode(s)) for s in es)}
        print(n, fl[n], f"razón {fl[n]['es'] / fl[n]['en']:.3f}", f"palabras por token (inglés) {fl['words']['en'] / fl[n]['en']:.3f}", file=sys.stderr)
    out["flores"] = fl

src = "// GENERADO por measure-real.py (tiktoken 0.14.0 y FLORES-200 devtest). No editar a mano: vuelve a ejecutar el script.\n"
src += "// Cada entrada: el texto, los ids que produce el tokenizador o200k_base (GPT-4o) y el texto de cada pieza.\n"
src += "export const REAL = " + json.dumps(out, ensure_ascii=False, indent=1, separators=(",", ": ")) + " as const;\n"
open(__file__.rsplit("/", 1)[0] + "/real-data.ts" if "/" in __file__ else "real-data.ts", "w", encoding="utf-8").write(src)
print("escrito real-data.ts", file=sys.stderr)
