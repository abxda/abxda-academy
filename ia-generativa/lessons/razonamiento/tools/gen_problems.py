#!/usr/bin/env python3
"""Genera los problemas de juguete de la lección «razonamiento» (módulo 7, lección 29).

Todo es reproducible: semilla fija, aritmética exacta, respuesta entera verificable por una regla
(la «recompensa verificable» de la lección). Los problemas los genera este guion (licencia MIT, igual que el
resto del código del curso); no se copia ningún conjunto de datos de terceros.

La dificultad es el número de operaciones encadenadas (cada una depende de la anterior o de dos partes anteriores):
  uno   : un producto de tres cifras por dos cifras                 487 * 63
  tres  : dos productos de dos cifras y una suma                    47 * 36 + 58 * 29
  siete : cuatro productos de dos cifras y tres sumas/restas        47 * 36 + 58 * 29 - 61 * 83 + 94 * 17
20 problemas por nivel. Además hay cuatro problemas «de demostración» (un tren y una tienda, en español y en inglés)
con 32 muestras cada uno, y los primeros problemas de los niveles «tres» y «siete» también llevan 32 muestras.

Uso:  python3 gen_problems.py > problems.json

Nota (2026-10-12): la lección solo usa los problemas «tren-es» y «tren-en» de data.ts (32 intentos cada uno). Los otros
seis problemas de data.ts (f01, f02, m01, m02, d01, d02) vienen de un problems2.json que no está en el repositorio y
no corresponden a los niveles que genera este guion; la escena no los usa.
"""
import json, random

SEED = 29029
N_POR_NIVEL = 20
K_BASE, K_DEMO = 6, 32


def uno(r):
    a, b = r.randint(112, 987), r.randint(12, 98)
    return f"{a} * {b}", a * b


def tres(r):
    a, b, c, d = (r.randint(12, 98) for _ in range(4))
    return f"{a} * {b} + {c} * {d}", a * b + c * d


def siete(r):
    while True:
        a, b, c, d, e, f, g, h = (r.randint(12, 98) for _ in range(8))
        v = a * b + c * d - e * f + g * h
        if v > 0:
            return f"{a} * {b} + {c} * {d} - {e} * {f} + {g} * {h}", v


DEMO = [
    {"id": "tren-es", "level": "demo", "k": K_DEMO, "expr": "148 - 37 + 52 - 61 + 18", "answer": 120,
     "prompt": "Un tren sale con 148 pasajeros. En la primera parada bajan 37 y suben 52. En la segunda parada bajan 61 y suben 18. ¿Cuántos pasajeros van a bordo al final? Responde solo con el número final."},
    {"id": "tren-en", "level": "demo", "k": K_DEMO, "expr": "148 - 37 + 52 - 61 + 18", "answer": 120,
     "prompt": "A train leaves with 148 passengers. At the first stop 37 get off and 52 get on. At the second stop 61 get off and 18 get on. How many passengers are on board at the end? Reply with only the final number."},
    {"id": "tienda-es", "level": "demo", "k": K_DEMO, "expr": "24 * 36 - 417 + 5 * 36", "answer": 627,
     "prompt": "Una tienda recibe 24 cajas de 36 lápices cada una. Vende 417 lápices y luego recibe 5 cajas más de 36. ¿Cuántos lápices tiene? Responde solo con el número final."},
    {"id": "tienda-en", "level": "demo", "k": K_DEMO, "expr": "24 * 36 - 417 + 5 * 36", "answer": 627,
     "prompt": "A store receives 24 boxes of 36 pencils each. It sells 417 pencils and then receives 5 more boxes of 36. How many pencils does it have? Reply with only the final number."},
]


def main():
    r = random.Random(SEED)
    by = {}
    for nivel, fn in (("uno", uno), ("tres", tres), ("siete", siete)):
        seen, lst = set(), []
        while len(lst) < N_POR_NIVEL:
            expr, val = fn(r)
            if expr in seen:
                continue
            seen.add(expr)
            lst.append({"id": f"{nivel[0]}{len(lst) + 1:02d}", "level": nivel, "expr": expr, "answer": val})
        by[nivel] = lst
    for nivel in ("tres", "siete"):
        by[nivel][0]["k"] = K_DEMO          # problema «de muestra» para el voto
    # orden de ejecución: demostraciones, problemas de muestra y luego los niveles intercalados
    out = list(DEMO) + [by["tres"][0], by["siete"][0]]
    rest = [by[n][i] for i in range(N_POR_NIVEL) for n in ("tres", "siete", "uno") if not (i == 0 and n in ("tres", "siete"))]
    out += rest
    print(json.dumps(out, ensure_ascii=False, indent=0))


if __name__ == "__main__":
    main()
