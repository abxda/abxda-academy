#!/usr/bin/env python3
"""
Genera `real-data.ts`: cuantización REAL de pesos REALES para la lección «GPUs, memoria y cuantización».

Reproducir (desde esta carpeta; requiere torch, transformers, safetensors y una GPU de >= 6 GB; ~6 GB de descarga la primera vez):
    python build-data.py                 # escribe real-data.ts junto a este archivo (unos 20 min en una RTX 3060)
    python build-data.py --quick         # solo la muestra y las estadísticas, sin evaluar la pérdida de todo el modelo

Modelo: EleutherAI/pythia-1.4b (Biderman et al., 2023, arXiv:2304.01373), licencia Apache-2.0, pesos finales (rama `main`,
paso 143 000), 24 capas, d_modelo 2048, 1.4 mil M de parámetros, en fp16. Es el mismo modelo que usa la lección «Preentrenamiento».

Texto de evaluación: WikiText-2 (Merity et al., 2016), partición de prueba, licencia CC BY-SA 3.0. NO se incluye el texto en la
lección: solo los números que salen de medirlo. Se une con "\\n\\n" (convención de Hugging Face), se tokeniza con el tokenizador
de Pythia (aprox. 340 mil tokens) y se evalúa en ventanas de 1024 tokens sin solapamiento. Pérdida = entropía cruzada media por
token, en nats (la misma unidad que la lección «Leyes de escala y costos»). Pythia vio Wikipedia en The Pile: el nivel absoluto
de la pérdida es optimista; lo que importa es la DIFERENCIA al cuantizar, que se mide con el mismo texto y las mismas ventanas.

Cuantización (la más simple posible, «redondeo al más cercano», sin calibración ni trucos; solo pesos):
    q = clamp(round(w / s), -qmax, +qmax),   w' = q * s,   qmax = 2^(b-1) - 1,   s = max|w| / qmax
  · esquema «matriz»  (tensor): UNA escala s para toda la matriz de pesos (max |w| de la matriz entera).
  · esquema «grupo»   (group):  una escala por cada 32 pesos consecutivos de una fila (el max |w| de ese grupo).
Se cuantizan las cuatro matrices lineales de cada una de las 24 capas (query_key_value, attention.dense, mlp.dense_h_to_4h,
mlp.dense_4h_to_h; 96 matrices, 1 208 M de pesos). Se dejan en fp16 las embeddings de entrada y de salida, las normalizaciones
y los sesgos (es lo habitual: GPTQ, AWQ y llama.cpp hacen lo mismo con las embeddings). La cuantización se «simula»: se
cuantiza y se vuelve a fp16 antes de evaluar, lo que da el mismo resultado numérico que ejecutar con pesos enteros.

Muestra para el navegador: la matriz `gpt_neox.layers.13.attention.dense.weight` (2048 × 2048). Se eligió porque su cociente
max|w| / desviación típica (13,4) es EXACTAMENTE la mediana de las 96 matrices (rango 6,0 a 111,2); no se escogió por verse
bien. Se toma la esquina superior izquierda de 32 × 32 pesos (filas 0-31, columnas 0-31), sin elegir. En el navegador, el
esquema «matriz» usa como escala el máximo de la matriz ENTERA (guardado aquí), no el de la muestra.
"""
import json, math, pathlib, sys, time
import torch
import torch.nn.functional as F
from safetensors import safe_open
from transformers import AutoTokenizer, AutoModelForCausalLM

HERE = pathlib.Path(__file__).parent
QUICK = '--quick' in sys.argv
SNAP = pathlib.Path.home() / '.cache/huggingface/hub/models--EleutherAI--pythia-1.4b/snapshots/fedc38a16eea3bd36a96b906d78d11d2ce18ed79'
NAME = 'EleutherAI/pythia-1.4b'
TEXT = pathlib.Path(sys.argv[sys.argv.index('--text') + 1]) if '--text' in sys.argv else HERE / 'wikitext2-test.txt'
SAMPLE_KEY = 'gpt_neox.layers.13.attention.dense.weight'
PATCH = 32
GROUP = 32
BITS = [8, 6, 5, 4, 3, 2]
LINEAR = ('attention.query_key_value', 'attention.dense', 'mlp.dense_h_to_4h', 'mlp.dense_4h_to_h')


def quantize(w: torch.Tensor, bits: int, scheme: str) -> torch.Tensor:
    """Redondeo al más cercano, simétrico. Devuelve los pesos ya «des-cuantizados» (mismo dtype)."""
    qmax = 2 ** (bits - 1) - 1
    x = w.float()
    if scheme == 'tensor':
        s = x.abs().max() / qmax
        return (torch.clamp(torch.round(x / s), -qmax, qmax) * s).to(w.dtype)
    out_f, in_f = x.shape
    g = x.reshape(out_f, in_f // GROUP, GROUP)
    s = g.abs().amax(dim=2, keepdim=True).clamp_min(1e-12) / qmax
    return (torch.clamp(torch.round(g / s), -qmax, qmax) * s).reshape(out_f, in_f).to(w.dtype)


def rel_err(w: torch.Tensor, q: torch.Tensor) -> float:
    w, q = w.float(), q.float()
    return float(((w - q) ** 2).sum().sqrt() / (w ** 2).sum().sqrt())


@torch.no_grad()
def eval_loss(model, ids: torch.Tensor, win=1024, bs=2) -> float:
    n = ids.numel() // win
    x = ids[: n * win].reshape(n, win).cuda()
    tot, cnt = 0.0, 0
    for i in range(0, n, bs):
        b = x[i:i + bs]
        logits = model(b).logits.float()
        loss = F.cross_entropy(logits[:, :-1].reshape(-1, logits.size(-1)), b[:, 1:].reshape(-1), reduction='sum')
        tot += float(loss); cnt += b[:, 1:].numel()
    return tot / cnt


def main():
    f = safe_open(str(SNAP / 'model.safetensors'), 'pt')
    # 1) estadísticas de todas las matrices lineales (cociente max/σ)
    ratios = []
    for k in f.keys():
        if k.endswith('.weight') and any(s in k for s in LINEAR):
            w = f.get_tensor(k).float()
            ratios.append((k, float(w.abs().max() / w.std())))
    ratios_sorted = sorted(r for _, r in ratios)
    median = ratios_sorted[len(ratios_sorted) // 2]
    print(f'{len(ratios)} matrices; max/σ: min {ratios_sorted[0]:.1f}, mediana {median:.1f}, max {ratios_sorted[-1]:.1f}')
    n_weights = sum(f.get_tensor(k).numel() for k, _ in ratios)

    # 2) la muestra
    W = f.get_tensor(SAMPLE_KEY)                       # fp16 [2048, 2048]
    Wf = W.float()
    sigma, absmax = float(Wf.std()), float(Wf.abs().max())
    patch = Wf[:PATCH, :PATCH].tolist()
    beyond6 = float((Wf.abs() > 6 * sigma).float().mean())
    stats = dict(shape=list(W.shape), sigma=sigma, absmax=absmax, ratio=absmax / sigma, beyond6=beyond6, mean=float(Wf.mean()))
    full_err = {}
    for sch in ('tensor', 'group'):
        full_err[sch] = {str(b): rel_err(W, quantize(W, b, sch)) for b in BITS}
    zero_frac = {}
    for sch in ('tensor', 'group'):
        zero_frac[sch] = {str(b): float((quantize(W, b, sch) == 0).float().mean()) for b in BITS}
    print('stats', stats)
    print('rel_err matriz muestra', json.dumps(full_err))

    # 3) pérdida de todo el modelo
    loss = {'fp16': None, 'tensor': {}, 'group': {}}
    mean_err = {'tensor': {}, 'group': {}}
    n_tokens = None
    if not QUICK:
        tok = AutoTokenizer.from_pretrained(str(SNAP))
        text = TEXT.read_text(encoding='utf8')
        ids = tok(text, return_tensors='pt').input_ids[0]
        n_tokens = int(ids.numel() // 1024 * 1024)
        print('tokens', ids.numel(), 'evaluados', n_tokens)
        model = AutoModelForCausalLM.from_pretrained(str(SNAP), torch_dtype=torch.float16).cuda().eval()
        lin = [(n, m) for n, m in model.named_modules() if isinstance(m, torch.nn.Linear) and any(s in n for s in LINEAR)]
        assert len(lin) == 96, len(lin)
        orig = [m.weight.data.cpu().clone() for _, m in lin]   # copias en la CPU (la GPU puede estar compartida)
        t0 = time.time()
        loss['fp16'] = eval_loss(model, ids)
        print(f'fp16: {loss["fp16"]:.4f}  ({time.time() - t0:.0f} s)')
        for sch in ('tensor', 'group'):
            for b in BITS:
                errs = []
                for (n, m), w0 in zip(lin, orig):
                    w0g = w0.cuda(); q = quantize(w0g, b, sch); errs.append(rel_err(w0g, q)); m.weight.data.copy_(q)
                l = eval_loss(model, ids)
                loss[sch][str(b)] = l if math.isfinite(l) else None
                mean_err[sch][str(b)] = sum(errs) / len(errs)
                print(f'{sch:6s} {b} bits: pérdida {l:.4f}  error relativo medio {mean_err[sch][str(b)]*100:.2f} %', flush=True)
                for (n, m), w0 in zip(lin, orig): m.weight.data.copy_(w0.cuda())

    # 4) escribir real-data.ts
    out = HERE / 'real-data.ts'
    r = lambda x, d=5: round(x, d)
    lines = [
        '// GENERADO por build-data.py (no editar a mano). Cuantización real de pesos reales de Pythia-1.4B (Apache-2.0).',
        '// Cómo se hizo y cómo reproducirlo: ver el docstring de build-data.py.',
        f'export const MODEL = {{ name: {json.dumps(NAME)}, params: {n_weights + 0}, quantizedWeights: {n_weights}, matrices: {len(ratios)}, layers: 24 }};',
        f'export const SAMPLE = {{ key: {json.dumps(SAMPLE_KEY)}, patch: {PATCH}, group: {GROUP}, sigma: {r(sigma, 6)}, absmax: {r(absmax, 5)}, ratio: {r(absmax / sigma, 2)}, beyond6: {r(beyond6, 6)}, medianRatio: {r(median, 2)}, minRatio: {r(ratios_sorted[0], 2)}, maxRatio: {r(ratios_sorted[-1], 2)} }};',
        'export const PATCH: number[][] = ' + json.dumps([[r(v, 5) for v in row] for row in patch]) + ';',
        '/** Error relativo (norma de w - w\' sobre norma de w) en TODA la matriz de la muestra, por esquema y bits. */',
        'export const FULL_ERR: Record<string, Record<string, number>> = ' + json.dumps({s: {b: r(v, 5) for b, v in d.items()} for s, d in full_err.items()}) + ';',
        '/** Fracción de pesos de la matriz de la muestra que se redondean a cero. */',
        'export const ZERO_FRAC: Record<string, Record<string, number>> = ' + json.dumps({s: {b: r(v, 5) for b, v in d.items()} for s, d in zero_frac.items()}) + ';',
    ]
    if not QUICK:
        lines += [
            f'/** Pérdida (nats por token) de Pythia-1.4B con las 96 matrices cuantizadas, sobre WikiText-2 (prueba), {n_tokens} tokens en ventanas de 1024. */',
            'export const LOSS = { tokens: ' + str(n_tokens) + ', fp16: ' + str(r(loss['fp16'], 4)) + ', tensor: ' + json.dumps({b: (r(v, 4) if v is not None else None) for b, v in loss['tensor'].items()}) + ', group: ' + json.dumps({b: (r(v, 4) if v is not None else None) for b, v in loss['group'].items()}) + ' } as { tokens: number; fp16: number; tensor: Record<string, number | null>; group: Record<string, number | null> };',
            '/** Error relativo medio de las 96 matrices, por esquema y bits. */',
            'export const MEAN_ERR: Record<string, Record<string, number>> = ' + json.dumps({s: {b: r(v, 5) for b, v in d.items()} for s, d in mean_err.items()}) + ';',
        ]
    out.write_text('\n'.join(lines) + '\n', encoding='utf8')
    print('escrito', out)


if __name__ == '__main__':
    main()
