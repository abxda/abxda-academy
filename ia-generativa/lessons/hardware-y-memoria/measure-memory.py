#!/usr/bin/env python3
"""
Mediciones REALES de memoria y ancho de banda en la GPU de esta máquina (una GeForce RTX 3060 de 12 GB) para la lección
«GPUs, memoria y cuantización». Los resultados se citan en la lección con la etiqueta «medido» y se pueden repetir:

    python measure-memory.py             # imprime un JSON con todo (hay que tener la GPU libre: otros procesos distorsionan el ancho de banda)

Qué mide:
  1) ancho de banda: copiar 1 GiB (fp16) de un buffer a otro lee 1 GiB y escribe 1 GiB; GB/s = 2 · 2^30 / tiempo (1 GB = 10^9 bytes).
     Se compara con la ficha: 12 GB GDDR6 a 15 Gbps por pin en un bus de 192 bits = 360 GB/s.
  2) producto matriz-vector (la operación de generar UNA palabra): W (16384 × 16384, fp16) por un vector. Lee 512 MiB de pesos y hace
     2·n² operaciones. Se ve que el rendimiento queda en una fracción mínima del pico de cálculo, porque manda la memoria.
     Se contrasta con el producto matriz-matriz (W por 4096 vectores a la vez), donde cada peso se reutiliza 4096 veces.
  3) memoria de ENTRENAR un transformer pequeño (arquitectura Pythia-160M con pesos aleatorios: solo se cuenta memoria, no se entrena
     nada útil): bytes por parámetro tras el primer paso del optimizador (AdamW), en dos recetas:
       a) fp32 completo: pesos 4 + gradientes 4 + momento 4 + varianza 4 = 16 B/parámetro;
       b) precisión mixta «a mano» (Micikevicius et al., 2018): pesos fp16 (2) + gradientes fp16 (2) + copia maestra fp32 (4)
          + momento fp32 (4) + varianza fp32 (4) = 16 B/parámetro.
  4) memoria de las ACTIVACIONES del cuerpo del transformer (embeddings + capas + normalización final; sin la capa de salida, que
     para vocabularios grandes y modelos pequeños pesa mucho y la fórmula no incluye): modelo en bfloat16, un pase hacia delante con
     gradientes activados; activaciones = memoria tras el pase menos memoria antes. Se compara con la fórmula de Korthikanti et al. (2022):
     34·s·b·h por capa (con atención de memoria lineal, tipo FlashAttention; el artículo da 34 + 5·a·s/h con la matriz de atención y
     cuenta máscaras de dropout, que aquí están desactivadas) y 2·s·b·h por capa si se recalcula todo (gradient checkpointing).

Resultados de la corrida del 2026-10-04 (torch 2.11, CUDA 12.8; GeForce RTX 3060 de 12 GB, 11 909 MiB utilizables; la GPU estaba libre,
solo el escritorio la usaba). Las cifras de ancho de banda cambian si otro proceso usa la GPU a la vez (en una segunda corrida con la GPU
compartida, el matriz-vector bajó a 160 GB/s):
  · ancho de banda (copiar 1 GiB): 333 GB/s, el 92 % de los 360 GB/s de la ficha.
  · matriz-vector 16384 × 16384 fp16: 1,57 ms, 341 GB/s, 0,34 TFLOPS; matriz-matriz con 4096 vectores: 27,7 TFLOPS (81 veces más
    rendimiento con el mismo chip: con un solo vector manda la memoria).
  · entrenar Pythia-160M (162 322 944 parámetros), tras el primer paso de AdamW: fp32 completo 16,19 B/parámetro; precisión mixta 16,05.
  · activaciones del cuerpo del transformer (b = 2; s = 512, 1024, 2048): medido / fórmula de 34·s·b·h·L = 0,949 en los tres casos;
    con recalculación total, medido / (2·s·b·h·L) = 1,11, 1,14 y 1,20.
"""
import json, time
import torch
from transformers import GPTNeoXConfig, GPTNeoXForCausalLM


def gib(x): return x / 2 ** 30


def bandwidth():
    n = 2 ** 29                                    # 2^29 elementos fp16 = 1 GiB
    a = torch.randn(n, device='cuda', dtype=torch.float16); b = torch.empty_like(a)
    for _ in range(3): b.copy_(a)
    torch.cuda.synchronize(); e0, e1 = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
    reps = 20; e0.record()
    for _ in range(reps): b.copy_(a)
    e1.record(); torch.cuda.synchronize()
    ms = e0.elapsed_time(e1) / reps
    return {'copy_GBps': 2 * 2 ** 30 / (ms / 1e3) / 1e9, 'ms_per_copy': ms}


def matvec_vs_matmul(n=16384, k=4096):
    W = torch.randn(n, n, device='cuda', dtype=torch.float16)
    x = torch.randn(n, 1, device='cuda', dtype=torch.float16); X = torch.randn(n, k, device='cuda', dtype=torch.float16)
    def timeit(fn, reps):
        for _ in range(3): fn()
        torch.cuda.synchronize(); e0, e1 = torch.cuda.Event(enable_timing=True), torch.cuda.Event(enable_timing=True)
        e0.record()
        for _ in range(reps): fn()
        e1.record(); torch.cuda.synchronize(); return e0.elapsed_time(e1) / reps / 1e3
    t1 = timeit(lambda: W @ x, 50); t2 = timeit(lambda: W @ X, 5)
    return {
        'matvec': {'ms': t1 * 1e3, 'weights_GB': n * n * 2 / 1e9, 'GBps': n * n * 2 / t1 / 1e9, 'TFLOPS': 2 * n * n / t1 / 1e12},
        'matmul_4096_vectors': {'ms': t2 * 1e3, 'TFLOPS': 2 * n * n * k / t2 / 1e12},
    }


def build(dtype=torch.float32):
    cfg = GPTNeoXConfig(vocab_size=50304, hidden_size=768, num_hidden_layers=12, num_attention_heads=12, intermediate_size=3072,
                        max_position_embeddings=2048, rotary_pct=0.25, use_parallel_residual=True, tie_word_embeddings=False,
                        attn_implementation='sdpa')
    torch.manual_seed(0)
    return GPTNeoXForCausalLM(cfg).to('cuda', dtype), cfg


def train_memory(mode: str, s=1024, b=2):
    """mode: 'fp32' (AdamW de PyTorch) o 'mixed' (pesos fp16 + copia maestra fp32, Adam escrito a mano)."""
    torch.cuda.empty_cache(); torch.cuda.reset_peak_memory_stats()
    base = torch.cuda.memory_allocated()
    model, cfg = build(torch.float32 if mode == 'fp32' else torch.float16)
    model.train()
    P = sum(p.numel() for p in model.parameters())
    ids = torch.randint(0, cfg.vocab_size, (b, s), device='cuda')
    m_params = torch.cuda.memory_allocated() - base
    if mode == 'fp32':
        opt = torch.optim.AdamW(model.parameters(), lr=1e-4)
    else:
        master = [p.detach().float().clone() for p in model.parameters()]
        mom = [torch.zeros_like(t) for t in master]; var = [torch.zeros_like(t) for t in master]
    torch.cuda.reset_peak_memory_stats(); before_step = torch.cuda.memory_allocated() - base
    ctx = torch.autocast('cuda', dtype=torch.bfloat16) if mode == 'fp32' else torch.autocast('cuda', dtype=torch.float16, enabled=False)
    with ctx:
        loss = model(ids, labels=ids).loss
    after_fwd = torch.cuda.memory_allocated() - base
    loss.backward()
    after_bwd = torch.cuda.memory_allocated() - base
    if mode == 'fp32':
        opt.step()
    else:
        with torch.no_grad():
            for p, w, m1, v1 in zip(model.parameters(), master, mom, var):
                g = p.grad.float(); m1.mul_(0.9).add_(g, alpha=0.1); v1.mul_(0.999).addcmul_(g, g, value=0.001)
                w.addcdiv_(m1, v1.sqrt().add_(1e-8), value=-1e-4); p.copy_(w.half())
            del g
    torch.cuda.synchronize()
    after_step = torch.cuda.memory_allocated() - base
    peak = torch.cuda.max_memory_allocated() - base
    out = {'params': P, 'mode': mode, 's': s, 'b': b,
           'weights_B_per_param': m_params / P, 'after_backward_B_per_param': after_bwd / P,
           'after_step_B_per_param': after_step / P, 'resident_states_GiB': gib(after_step), 'peak_GiB': gib(peak)}
    del model, loss
    if mode == 'fp32': del opt
    torch.cuda.empty_cache()
    return out


def activation_memory(s: int, b: int, checkpoint: bool):
    """Activaciones guardadas por el cuerpo del transformer (bf16) en un pase hacia delante con gradientes."""
    torch.cuda.empty_cache()
    model, cfg = build(torch.bfloat16)
    cfg.hidden_dropout = 0.0; cfg.attention_dropout = 0.0
    if checkpoint: model.gradient_checkpointing_enable(); model.config.use_cache = False
    model.train()
    ids = torch.randint(0, cfg.vocab_size, (b, s), device='cuda')
    torch.cuda.synchronize(); before = torch.cuda.memory_allocated()
    out = model.gpt_neox(ids).last_hidden_state
    torch.cuda.synchronize(); after = torch.cuda.memory_allocated()
    h, L = cfg.hidden_size, cfg.num_hidden_layers
    act = after - before - out.numel() * 2           # se descuenta la salida misma (b·s·h en bf16)
    res = {'s': s, 'b': b, 'checkpoint': checkpoint, 'measured_GiB': gib(act), 'formula_GiB': gib((2 if checkpoint else 34) * s * b * h * L)}
    res['measured_over_formula'] = res['measured_GiB'] / res['formula_GiB']
    del model, out
    torch.cuda.empty_cache()
    return res


if __name__ == '__main__':
    props = torch.cuda.get_device_properties(0)
    res = {'gpu': props.name, 'total_memory_MiB': props.total_memory / 2 ** 20, 'torch': torch.__version__}
    res['bandwidth'] = bandwidth()
    res['matvec_vs_matmul'] = matvec_vs_matmul()
    res['train'] = [train_memory('fp32'), train_memory('mixed')]
    res['activations'] = [activation_memory(s, 2, ck) for s in (512, 1024, 2048) for ck in (False, True)]
    print(json.dumps(res, indent=1))
