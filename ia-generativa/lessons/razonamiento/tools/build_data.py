#!/usr/bin/env python3
"""Convierte results.jsonl (salida de run_experiment.py) en ../data.ts, el archivo que lee la escena.

data.ts guarda solo los datos crudos medidos: por problema y muestra, la longitud natural del pensamiento (L, en tokens;
-1 si no terminó en 4096) y la respuesta que dio el modelo con cada presupuesto (null si no se pudo leer un entero).
Todo lo demás (exactitud, votos, costo) lo calcula la escena a partir de estos números.
Uso:  python3 build_data.py problems2.json main/results.jsonl > ../data.ts
"""
import json, sys, collections

BUDGETS = [0, 32, 64, 128, 256, 512, 1024, 2048, 4096]
LV = {"uno": 0, "tres": 1, "siete": 2, "demo": 3}


def main():
    probs = {p["id"]: p for p in json.load(open(sys.argv[1]))}
    runs = collections.defaultdict(dict)
    for line in open(sys.argv[2]):
        r = json.loads(line)
        runs[r["id"]][r["s"]] = r
    out = []
    for pid, p in probs.items():
        if pid not in runs:
            continue
        ss = [runs[pid][s] for s in sorted(runs[pid])]
        L = [(-1 if r["L"] is None else r["L"]) for r in ss]
        A = [[r["ans"].get(str(b)) for b in BUDGETS] for r in ss]
        out.append({"id": pid, "lv": LV[p["level"]], "expr": p["expr"], "ans": p["answer"], "L": L, "A": A})
    print("// GENERADO por tools/build_data.py a partir de los resultados de tools/run_experiment.py. No editar a mano.")
    print("// Qwen3.5-4B (Apache-2.0), fp8, vLLM; T = 0,7; presupuesto forzado. Ver los comentarios de esos guiones.")
    print("export const BUDGETS = " + json.dumps(BUDGETS) + " as const;")
    print("/** lv: 0 = una operación, 1 = tres, 2 = siete, 3 = demostración (tren/tienda). L: longitud natural del pensamiento (-1 = más de 4096). A[s][b]: respuesta con el presupuesto b. */")
    print("export interface Prob { id: string; lv: 0 | 1 | 2 | 3; expr: string; ans: number; L: number[]; A: (number | null)[][] }")
    print("export const PROBS: Prob[] = [")
    for o in out:
        print(" " + json.dumps(o, ensure_ascii=False, separators=(",", ":")) + ",")
    print("];")


if __name__ == "__main__":
    main()
