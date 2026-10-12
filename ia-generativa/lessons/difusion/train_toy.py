"""Entrena dos modelos de difusión DIMINUTOS (DDPM con guiado sin clasificador) y exporta lo que la lección necesita a models.json.
Se ejecuta una sola vez, offline y en CPU (≈ 3 min con 4 hilos):

    CUDA_VISIBLE_DEVICES= OMP_NUM_THREADS=4 ~/venvs/tts/bin/python train_toy.py

La escena (models.ts + scene.ts) ejecuta en el navegador estos mismos modelos con estos mismos pesos: no hay nada simulado.

DATOS
  · «Optical Recognition of Handwritten Digits» (UCI Machine Learning Repository), E. Alpaydin y C. Kaynak, 1998, licencia CC BY 4.0,
    doi:10.24432/C50P49, vía scikit-learn load_digits(): 1797 imágenes de 8×8 píxeles (valores 0–16). Mismo reparto que la lección 15
    (permutación con semilla 7: 1500 de entrenamiento, 297 reservadas), así «el mismo siete de la lección quince» es la imagen 477 de ese orden.
  · El plano de códigos: el VAE de la lección 15 (generar-distribuciones/latent.json, solo se LEE). Cada una de las 1500 imágenes de
    entrenamiento se resume en el centro μ de su nube (dos números). Esos 1500 puntos, multiplicados por SC = 1.6, son los datos del modelo
    del plano. (Stable Diffusion también reescala sus latentes con un factor fijo antes de difundir.) Al decodificar se divide entre SC.

PROCESO HACIA DELANTE (igual para los dos modelos)
  T = 50 pasos; calendario coseno de Nichol y Dhariwal (2021), ᾱ(t) = cos²(((t/T) + s)/(1 + s) · π/2) / ᾱ(0), s = 0.008;
  β_t = 1 − ᾱ_t/ᾱ_{t−1}, recortado a [0.0001, 0.35] (con solo 50 pasos, los últimos β del coseno se acercan a 1).

MODELOS (misma arquitectura; ε_θ(x_t, t, c) predice el ruido)
  entrada = x_t (64 o 2 números) ⊕ paso (16: sen y cos de (t/T)·(π/2)·2^k, k = 0…7) ⊕ etiqueta one-hot de 11 (dígitos 0–9 y 10 = «sin pista»)
  h1 = SiLU(W1·entrada + b1);  h2 = h1 + SiLU(W2·h1 + b2);  h3 = h2 + SiLU(W3·h2 + b3);  salida = Wo·h3 + bo
  píxeles: 128 neuronas por capa (53 056 parámetros) · plano: 64 neuronas (10 370 parámetros)
  Entrenamiento: pérdida simplificada de Ho et al. (2020), ‖ε − ε_θ‖²; la etiqueta se oculta (c = 10) con probabilidad 0.15
  (Ho y Salimans, 2022); Adam 0.002 con decaimiento coseno; media móvil exponencial de los pesos (0.999), que es la que se exporta.
  píxeles: 30 000 pasos, lote 256 · plano: 40 000 pasos, lote 512. Semillas fijas (torch 0, numpy 0).

EXPORTACIÓN
  Pesos en int8 con una escala por fila (fila = neurona de salida), en base64; sesgos con 5 decimales. Se comprueba que la salida con los
  pesos cuantizados difiere poco de la original (se imprime) y se guardan valores de control para que verify-data.ts compare el navegador.
"""
import base64, json, math, os, time
os.environ.setdefault('CUDA_VISIBLE_DEVICES', '')
os.environ.setdefault('OMP_NUM_THREADS', '4')
import numpy as np, torch, torch.nn as nn
from sklearn.datasets import load_digits

torch.set_num_threads(4)
HERE = os.path.dirname(os.path.abspath(__file__))
L15 = os.path.join(HERE, '..', 'generar-distribuciones', 'latent.json')
T, SC, P_UNCOND = 50, 1.6, 0.15

# ── calendario de ruido ─────────────────────────────────────────────────────
def cos_f(t, s=0.008): return np.cos(((t / T) + s) / (1 + s) * math.pi / 2) ** 2
ab = cos_f(np.arange(T + 1)) / cos_f(0)
betas = np.clip(1 - ab[1:] / ab[:-1], 1e-4, 0.35)
alphas = 1 - betas
abar = np.cumprod(alphas)
print('√ᾱ en t = 1, 10, 25, 40, 50:', [round(float(np.sqrt(abar[t - 1])), 3) for t in (1, 10, 25, 40, 50)], ' ᾱ_T =', round(float(abar[-1]), 4))

# ── datos ───────────────────────────────────────────────────────────────────
d = load_digits()
X = (d.data / 16.0).astype(np.float32); y = d.target.astype(int)
perm = np.random.RandomState(7).permutation(len(X)); tr = perm[297:]
Xtr, ytr = X[tr], y[tr]                                  # 1500 de entrenamiento, en el orden de la lección 15
D15 = json.load(open(L15))
CH = '0123456789abcdefg'
img15 = np.array([CH.index(c) / 16 for c in D15['imgs']], dtype=np.float32).reshape(-1, 64)
assert np.allclose(img15[:1500], np.round(Xtr * 16) / 16), 'el reparto no coincide con la lección 15'
H15 = D15['H']; V = {k: np.array(v, dtype=np.float64) for k, v in D15['vae'].items()}
hh = np.tanh(img15[:1500] @ V['e1w'].reshape(H15, 64).T + V['e1b'])
MU = (hh @ V['mw'].reshape(2, H15).T + V['mb']).astype(np.float32)          # centros μ del VAE
CODES = MU * SC

# ── red ─────────────────────────────────────────────────────────────────────
def temb(t):
    f = (2.0 ** torch.arange(8).float()).unsqueeze(0) * math.pi / 2
    tt = t.float().unsqueeze(1) / T
    return torch.cat([torch.sin(tt * f), torch.cos(tt * f)], 1)

class Net(nn.Module):
    def __init__(s, D, H):
        super().__init__()
        s.l1 = nn.Linear(D + 16 + 11, H); s.l2 = nn.Linear(H, H); s.l3 = nn.Linear(H, H); s.out = nn.Linear(H, D); s.act = nn.SiLU()
    def forward(s, x, t, c):
        z = torch.cat([x, temb(t), nn.functional.one_hot(c, 11).float()], 1)
        z = s.act(s.l1(z)); z = z + s.act(s.l2(z)); z = z + s.act(s.l3(z))
        return s.out(z)

def train(data, labels, H, steps, batch):
    torch.manual_seed(0); np.random.seed(0)
    Xd, Yd = torch.tensor(data), torch.tensor(labels)
    net, ema = Net(Xd.shape[1], H), Net(Xd.shape[1], H)
    ema.load_state_dict(net.state_dict())
    opt = torch.optim.Adam(net.parameters(), lr=2e-3); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, steps)
    abt = torch.tensor(abar, dtype=torch.float32); t0 = time.time()
    for step in range(steps):
        idx = torch.randint(0, len(Xd), (batch,)); x0 = Xd[idx]; c = Yd[idx].clone()
        c[torch.rand(batch) < P_UNCOND] = 10
        t = torch.randint(0, T, (batch,)); eps = torch.randn_like(x0)
        xt = abt[t].sqrt()[:, None] * x0 + (1 - abt[t]).sqrt()[:, None] * eps
        loss = ((net(xt, t, c) - eps) ** 2).mean()
        opt.zero_grad(); loss.backward(); opt.step(); sch.step()
        with torch.no_grad():
            for pe, pn in zip(ema.parameters(), net.parameters()): pe.mul_(0.999).add_(pn, alpha=0.001)
        if step % 5000 == 0 or step == steps - 1: print(f'  paso {step:6d}  pérdida {loss.item():.4f}  ({time.time() - t0:.0f} s)', flush=True)
    return ema

print('red de píxeles…'); pix = train(Xtr * 2 - 1, ytr, 128, 30000, 256)
print('red del plano…'); lat = train(CODES, ytr, 64, 40000, 512)

# ── cuantización int8 por fila ──────────────────────────────────────────────
def quant(lin):
    W = lin.weight.detach().numpy().astype(np.float64); s = np.abs(W).max(1) / 127 + 1e-12
    q = np.clip(np.round(W / s[:, None]), -127, 127).astype(np.int8)
    return q, s, lin.bias.detach().numpy().astype(np.float64)
def export(net):
    out, deq = {}, Net(net.out.out_features, net.l1.out_features)
    deq.load_state_dict(net.state_dict())
    for name in ('l1', 'l2', 'l3', 'out'):
        q, s, b = quant(getattr(net, name))
        s = np.array([float(f'{v:.6g}') for v in s]); b = np.round(b, 5)
        out[name] = {'q': base64.b64encode(q.tobytes()).decode(), 's': s.tolist(), 'b': b.tolist(), 'rows': int(q.shape[0]), 'cols': int(q.shape[1])}
        with torch.no_grad():
            getattr(deq, name).weight.copy_(torch.tensor(q.astype(np.float64) * s[:, None])); getattr(deq, name).bias.copy_(torch.tensor(b))
    out['H'] = net.l1.out_features
    return out, deq
pixJ, pixQ = export(pix); latJ, latQ = export(lat)

@torch.no_grad()
def sample(net, D, n, cls, s, seed):
    g = torch.Generator().manual_seed(seed); x = torch.randn(n, D, generator=g)
    for i in reversed(range(T)):
        t = torch.full((n,), i); eu = net(x, t, torch.full((n,), 10))
        e = eu if cls is None else eu + s * (net(x, t, torch.full((n,), cls)) - eu)
        mean = (x - betas[i] / math.sqrt(1 - abar[i]) * e) / math.sqrt(alphas[i])
        x = mean + (math.sqrt(betas[i]) * torch.randn(n, D, generator=g) if i > 0 else 0)
    return x.numpy()

# lector (regresión logística de la lección 15) para comprobar qué dígitos salen
CW, CB = np.array(D15['clf']['w']).reshape(10, 64), np.array(D15['clf']['b'])
read = lambda ims: (ims @ CW.T + CB).argmax(1)
def vae_dec(z):
    h = np.tanh(z @ V['d1w'].reshape(H15, 2).T + V['d1b']); return 1 / (1 + np.exp(-(h @ V['d2w'].reshape(64, H15).T + V['d2b'])))
for name, net in (('original', pix), ('int8', pixQ)):
    for cls, s in ((7, 1.0), (7, 3.0), (3, 3.0)):
        ims = ((sample(net, 64, 400, cls, s, 1) + 1) / 2).clip(0, 1)
        print(f'  píxeles {name:8s} pista {cls} escala {s}: {np.mean(read(ims) == cls) * 100:.0f} % leídos como {cls}')
for name, net in (('original', lat), ('int8', latQ)):
    for s in (0.0, 1.0, 3.0):
        z = sample(net, 2, 400, 7, s, 1) / SC
        print(f'  plano   {name:8s} pista 7 escala {s}: {np.mean(read(vae_dec(z)) == 7) * 100:.0f} % leídos como 7 · dispersión {z.std(0).mean():.2f}')

# ── imágenes que usa la escena ──────────────────────────────────────────────
enc17 = lambda v: ''.join(CH[int(round(float(x) * 16))] for x in v)
probs = lambda v: np.exp((v @ CW.T + CB) - (v @ CW.T + CB).max()) / np.exp((v @ CW.T + CB) - (v @ CW.T + CB).max()).sum()
others = []
for want in (3, 0, 8):                                    # «con cualquier imagen de partida»: un tres, un cero y un ocho bien legibles
    for i in range(1500):
        if ytr[i] == want and probs(img15[i])[want] > 0.97: others.append(i); break
sevens = [i for i in range(1500) if ytr[i] == 7 and i != 477 and probs(img15[i])[7] > 0.97][:5]   # «datos reales»: otros cinco sietes
mean_img = img15[:1500].mean(0)

# valores de control: salida de cada red para una entrada fija (verify-data.ts compara el navegador con esto)
with torch.no_grad():
    xp = torch.tensor(img15[477:478] * 2 - 1); tp = torch.tensor([19]); cp = torch.tensor([10])
    ck_pix = pixQ(xp, tp, cp).numpy()[0]
    ck_lat = latQ(torch.tensor([[0.3, -0.7]]), torch.tensor([30]), torch.tensor([7])).numpy()[0]

out = {
    'T': T, 'SC': SC, 'betas': [round(float(b), 7) for b in betas],
    'pix': pixJ, 'lat': latJ,
    'seven': 477, 'others': others, 'sevens': sevens,
    'imgs': {str(i): enc17(img15[i]) for i in [477] + others + sevens},
    'mean': [round(float(v), 4) for v in mean_img],
    'codes': [round(float(v), 3) for v in CODES.flatten()], 'lab': ''.join(str(int(v)) for v in ytr),
    'vae': {k: [round(float(x), 5) for x in V[k]] for k in ('d1w', 'd1b', 'd2w', 'd2b')}, 'vaeH': H15,
    'clf': {'w': [round(float(x), 5) for x in CW.flatten()], 'b': [round(float(x), 5) for x in CB]},
    'check': {'pix': [round(float(v), 5) for v in ck_pix], 'lat': [round(float(v), 5) for v in ck_lat]},
    'params': {'pix': sum(p.numel() for p in pix.parameters()), 'lat': sum(p.numel() for p in lat.parameters())},
}
json.dump(out, open(os.path.join(HERE, 'models.json'), 'w'), separators=(',', ':'))
print('models.json escrito:', os.path.getsize(os.path.join(HERE, 'models.json')) // 1024, 'KB; otros dígitos', others, '; parámetros', out['params'])
