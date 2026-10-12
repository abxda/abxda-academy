#!/usr/bin/env python3
# Uso (CPU, sin GPU): CUDA_VISIBLE_DEVICES= python verify-sample.py   (requiere torch y safetensors, y los pesos de Pythia-1.4B ya descargados)
# Comprobación en CPU (4 hilos, sin GPU) de las cifras de la muestra que usa la lección (real-data.ts).
import os
import torch
from safetensors import safe_open
torch.set_num_threads(4)
SNAP = os.path.expanduser('~/.cache/huggingface/hub/models--EleutherAI--pythia-1.4b/snapshots/fedc38a16eea3bd36a96b906d78d11d2ce18ed79/model.safetensors')
f = safe_open(SNAP, 'pt')
W = f.get_tensor('gpt_neox.layers.13.attention.dense.weight').float()
print('shape', tuple(W.shape), 'sigma %.6f absmax %.5f ratio %.2f' % (W.std(), W.abs().max(), W.abs().max() / W.std()))
print('patch[0][:5]', [round(v, 5) for v in W[0, :5].tolist()], 'row0 max', round(W[0, :32].abs().max().item(), 5))
def q(w, bits, scheme):
    qmax = 2 ** (bits - 1) - 1
    if scheme == 'tensor':
        s = w.abs().max() / qmax; return torch.clamp(torch.round(w / s), -qmax, qmax) * s
    g = w.reshape(w.shape[0], -1, 32); s = g.abs().amax(2, keepdim=True) / qmax
    return (torch.clamp(torch.round(g / s), -qmax, qmax) * s).reshape(w.shape)
for sch in ('tensor', 'group'):
    for b in (8, 4, 2):
        Q = q(W, b, sch)
        print(sch, b, 'rel_err %.5f zero %.5f' % (((W - Q).norm() / W.norm()).item(), (Q == 0).float().mean().item()))
n = 0; rs = []
for k in f.keys():
    if k.endswith('.weight') and any(s in k for s in ('attention.query_key_value', 'attention.dense', 'mlp.dense_h_to_4h', 'mlp.dense_4h_to_h')):
        w = f.get_tensor(k).float(); n += w.numel(); rs.append((w.abs().max() / w.std()).item())
rs.sort(); print('matrices', len(rs), 'weights', n, 'ratio min %.2f median %.2f max %.2f' % (rs[0], rs[len(rs) // 2], rs[-1]))
