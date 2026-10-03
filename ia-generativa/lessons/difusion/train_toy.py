"""Entrena un modelo de difusión DIMINUTO (DDPM + guiado sin clasificador) sobre dos «lunas» en 2D y exporta sus pesos a denoiser.json.
Se ejecuta una sola vez, offline:   ~/venvs/tts/bin/python train_toy.py
La lección (scene.ts) corre en el navegador el mismo bucle de muestreo con estos pesos: no hay nada simulado.
Datos: dos medias lunas generadas aquí mismo (clase 0 = arriba, clase 1 = abajo). Sin conjuntos externos.
"""
import json, math, numpy as np, torch, torch.nn as nn

torch.manual_seed(0); np.random.seed(0)
T = 40
betas = np.linspace(0.02, 0.30, T)                      # calendario lineal de ruido
alphas = 1 - betas
abar = np.cumprod(alphas)

def moons(n, noise=0.05):
    h = n // 2
    th = np.random.rand(h) * math.pi
    up = np.stack([np.cos(th), np.sin(th)], 1)
    th2 = np.random.rand(n - h) * math.pi
    dn = np.stack([1 - np.cos(th2), 0.5 - np.sin(th2)], 1)
    x = np.concatenate([up, dn]) + noise * np.random.randn(n, 2)
    y = np.concatenate([np.zeros(h), np.ones(n - h)]).astype(int)
    x = (x - np.array([0.5, 0.25])) * 1.6                # centrar y escalar a ≈ [-2.4, 2.4]
    return x.astype(np.float32), y

H = 64
def temb(t):                                             # incrustación sinusoidal del paso (8 valores)
    t = t.float().unsqueeze(1) / T
    f = torch.tensor([1, 2, 4, 8], dtype=torch.float32).unsqueeze(0) * math.pi
    return torch.cat([torch.sin(t * f), torch.cos(t * f)], 1)

class Net(nn.Module):
    def __init__(s):
        super().__init__()
        s.l1 = nn.Linear(2 + 8 + 3, H); s.l2 = nn.Linear(H, H); s.l3 = nn.Linear(H, H); s.out = nn.Linear(H, 2)
        s.act = nn.SiLU()
    def forward(s, x, t, c):                             # c: 0, 1 ó 2 (= sin etiqueta)
        z = torch.cat([x, temb(t), torch.nn.functional.one_hot(c, 3).float()], 1)
        z = s.act(s.l1(z)); z = s.act(s.l2(z)); z = s.act(s.l3(z))
        return s.out(z)

net = Net(); opt = torch.optim.Adam(net.parameters(), lr=2e-3)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, 12000)
ab = torch.tensor(abar, dtype=torch.float32)
for step in range(12000):
    x0, y = moons(512); x0 = torch.tensor(x0); y = torch.tensor(y)
    c = torch.where(torch.rand(512) < 0.2, torch.full_like(y, 2), y)       # 20 % sin etiqueta: permite el guiado
    t = torch.randint(0, T, (512,))
    eps = torch.randn_like(x0)
    xt = ab[t].sqrt().unsqueeze(1) * x0 + (1 - ab[t]).sqrt().unsqueeze(1) * eps
    loss = ((net(xt, t, c) - eps) ** 2).mean()
    opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    if step % 2000 == 0 or step == 11999: print(step, round(loss.item(), 4), flush=True)

# comprobación: muestreo en Python (mismo bucle que usará el navegador)
@torch.no_grad()
def sample(n, cls, w, seed=1):
    g = torch.Generator().manual_seed(seed)
    x = torch.randn(n, 2, generator=g)
    for i in reversed(range(T)):
        t = torch.full((n,), i)
        ec = net(x, t, torch.full((n,), cls)); eu = net(x, t, torch.full((n,), 2))
        e = eu + (1 + w) * (ec - eu) if cls < 2 else eu
        mean = (x - betas[i] / math.sqrt(1 - abar[i]) * e) / math.sqrt(alphas[i])
        x = mean + (math.sqrt(betas[i]) * torch.randn(n, 2, generator=g) if i > 0 else 0)
    return x.numpy()
for cls, w in [(2, 0), (0, 0), (0, 3), (1, 3)]:
    s = sample(1000, cls, w)
    print('clase', cls, 'w', w, 'media', s.mean(0).round(2), 'sd', s.std(0).round(2))

def arr(m): return [round(float(v), 5) for v in m.detach().numpy().flatten()]
json.dump({
    'T': T, 'H': H, 'betas': [round(float(b), 6) for b in betas],
    'l1w': arr(net.l1.weight), 'l1b': arr(net.l1.bias), 'l2w': arr(net.l2.weight), 'l2b': arr(net.l2.bias),
    'l3w': arr(net.l3.weight), 'l3b': arr(net.l3.bias), 'ow': arr(net.out.weight), 'ob': arr(net.out.bias),
}, open('denoiser.json', 'w'))
print('denoiser.json escrito')
