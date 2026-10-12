#!/usr/bin/env python3
"""Mide cuánto mejora un modelo de razonamiento abierto al dejarlo pensar más (lección «razonamiento»).

Modelo: Qwen3.5-4B (Qwen, febrero de 2026; licencia Apache-2.0), con pesos en fp8 calculados al cargar, ejecutado con vLLM 0.17
en una RTX 3060 de 12 GB compartida. Se eligió un modelo pequeño a propósito: cabe en la GPU y el efecto del pensamiento se ve mejor.

Protocolo (presupuesto forzado, como el «budget forcing» de s1, Muennighoff et al. 2025):
  1. Para cada problema se muestrean K cadenas de pensamiento completas (hasta BMAX tokens) con T = 0.7, top-p 0.95, top-k 20.
  2. Para cada presupuesto B de la lista: si la cadena terminó sola en L <= B tokens, se usa su respuesta natural;
     si no, se corta el pensamiento en los primeros B tokens, se cierra con una frase fija + </think> y se pide la respuesta.
  3. B = 0 es «responder de inmediato»: bloque de pensamiento vacío, tal como la plantilla del modelo en modo sin pensar.
  4. La respuesta se compara con la exacta (aritmética entera): esa comparación es la «recompensa verificable».
Salida (en --out): results.jsonl (una línea por problema y muestra, con las respuestas a cada presupuesto) y
chains.jsonl (texto de las cadenas, solo para inspección; no se publica).
Uso:  python run_experiment.py --problems problems.json --k 8 --out DIR [--limit N] [--chunk 12]
Es reanudable: los problemas ya presentes en results.jsonl se saltan.
"""
import argparse, glob, json, os, re, subprocess, time

BUDGETS = [0, 32, 64, 128, 256, 512, 1024, 2048, 4096]
BMAX = 4096
CLOSE = "\n\nConsidering the limited time by the user, I have to give the solution based on the thinking directly now.\n</think>.\n\n"
USER = "Compute {expr}. Reply with only the final integer, no explanation."
NUM = re.compile(r"-?\d[\d,]*")


def parse_int(text):
    m = NUM.findall(text.replace("−", "-"))
    if not m:
        return None
    try:
        return int(m[-1].replace(",", ""))
    except ValueError:
        return None


def free_mib():
    out = subprocess.run(["nvidia-smi", "--query-gpu=memory.free,memory.total", "--format=csv,noheader,nounits"], capture_output=True, text=True).stdout
    f, t = [int(x) for x in out.strip().split(",")]
    return f, t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--problems", required=True)
    ap.add_argument("--k", type=int, default=8)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--chunk", type=int, default=12)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--quant", default="fp8")
    ap.add_argument("--util", type=float, default=0.0, help="fracción de la GPU (0 = automática según la memoria libre)")
    ap.add_argument("--min-free", type=int, default=6200, help="espera a que haya esta memoria libre (MiB)")
    ap.add_argument("--seqs", type=int, default=24)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    rpath, cpath = os.path.join(a.out, "results.jsonl"), os.path.join(a.out, "chains.jsonl")

    probs = json.load(open(a.problems))
    if a.limit:
        by = {}
        for p in probs:
            by.setdefault(p["level"], []).append(p)
        probs = [p for lv in by.values() for p in lv[: max(1, a.limit // len(by))]]
    done = set()
    if os.path.exists(rpath):
        done = {json.loads(l)["id"] for l in open(rpath)}
    todo = [p for p in probs if p["id"] not in done]
    if not todo:
        print("nada que hacer")
        return

    while free_mib()[0] < a.min_free:
        time.sleep(10)
    free, total = free_mib()
    util = a.util or min(0.60, (free - 600) / total)

    from vllm import LLM, SamplingParams
    llm = LLM(model=a.model, max_model_len=BMAX + 1400, gpu_memory_utilization=util, max_num_seqs=a.seqs,
              limit_mm_per_prompt={"image": 0, "video": 0}, enforce_eager=True, seed=a.seed,
              quantization=(a.quant if a.quant != "none" else None))
    tok = llm.get_tokenizer()
    think_end = tok.convert_tokens_to_ids("</think>")
    close_ids = tok.encode(CLOSE, add_special_tokens=False)

    def prompt(p, think):
        content = p["prompt"] if "prompt" in p else USER.format(expr=p["expr"])
        return tok.apply_chat_template([{"role": "user", "content": content}], add_generation_prompt=True, tokenize=False, enable_thinking=think)

    kof = lambda p: p.get("k", a.k)
    sp = lambda n, mt: SamplingParams(temperature=0.7, top_p=0.95, top_k=20, max_tokens=mt, n=n, seed=a.seed)
    t0 = time.time()

    for c0 in range(0, len(todo), a.chunk):
        chunk = todo[c0:c0 + a.chunk]
        res = {}
        # --- B = 0: responder de inmediato ---
        outs = llm.generate([{"prompt": prompt(p, False)} for p in chunk], [sp(kof(p), 24) for p in chunk], use_tqdm=False)
        for p, o in zip(chunk, outs):
            for s, c in enumerate(o.outputs):
                res[(p["id"], s)] = {"id": p["id"], "s": s, "L": None, "ans": {"0": parse_int(c.text)}, "raw0": c.text.strip()[:40]}
        # --- cadenas completas ---
        outs = llm.generate([{"prompt": prompt(p, True)} for p in chunk], [sp(kof(p), BMAX) for p in chunk], use_tqdm=False)
        chains = {}
        for p, o in zip(chunk, outs):
            for s, c in enumerate(o.outputs):
                ids = list(c.token_ids)
                r = res[(p["id"], s)]
                if think_end in ids:
                    i = ids.index(think_end)
                    tail = tok.decode(ids[i + 1:], skip_special_tokens=True)
                    r["L"] = i
                    r["natural"] = parse_int(tail)
                    r["tail"] = tail.strip()[:60]
                    chains[(p["id"], s)] = ids[:i]
                else:
                    chains[(p["id"], s)] = ids   # no terminó en BMAX tokens: L desconocida (> BMAX)
        # --- respuestas forzadas por presupuesto ---
        reqs, keys = [], []
        for p in chunk:
            base = tok.encode(prompt(p, True), add_special_tokens=False)
            for s in range(kof(p)):
                r, ids = res[(p["id"], s)], chains[(p["id"], s)]
                for B in BUDGETS[1:]:
                    if r["L"] is not None and r["L"] <= B:
                        r["ans"][str(B)] = r["natural"]
                    else:
                        reqs.append({"prompt_token_ids": base + ids[:B] + close_ids}); keys.append((p["id"], s, B))
        outs = llm.generate(reqs, sp(1, 24), use_tqdm=False) if reqs else []
        for (pid, s, B), o in zip(keys, outs):
            res[(pid, s)]["ans"][str(B)] = parse_int(o.outputs[0].text)
        truth = {p["id"]: p["answer"] for p in chunk}
        with open(rpath, "a") as f:
            for (pid, s), r in sorted(res.items()):
                r["truth"] = truth[pid]
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        with open(cpath, "a") as f:
            for (pid, s), ids in chains.items():
                f.write(json.dumps({"id": pid, "s": s, "L": res[(pid, s)]["L"], "n": len(ids), "text": tok.decode(ids, skip_special_tokens=False)}, ensure_ascii=False) + "\n")
        print(f"[{time.time()-t0:.0f}s] trozo {c0 // a.chunk + 1}/{(len(todo) + a.chunk - 1) // a.chunk} listo ({sum(len(v) for v in chains.values())} tokens de pensamiento)", flush=True)


if __name__ == "__main__":
    main()
