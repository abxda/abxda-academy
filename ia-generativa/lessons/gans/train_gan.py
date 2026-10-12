"""Entrena GAN DIMINUTAS en 1D y exporta sus pesos a gan-data.ts. Se ejecuta una sola vez, offline:
      ~/venvs/tts/bin/python train_gan.py          (≈ 3–5 min en CPU; sin GPU)

La lección (scene.ts) ejecuta en el navegador estas mismas redes (solo la pasada hacia delante): no hay nada simulado.

Datos reales (solo estos, generados aquí; sin conjuntos externos): mezcla 50/50 de dos gaussianas, N(-1.5, 0.4²) y N(+1.5, 0.4²).
Generador G: z ~ N(0,1) (1 número) → 10 tanh → 10 tanh → x   (141 parámetros).
Discriminador D: x → 10 tanh → 10 tanh → logit    (141 parámetros; D(x) = sigmoide(logit)).
Pérdidas (Goodfellow et al., 2014, con el truco «no saturante» que ellos mismos proponen para G):
      D minimiza  −log D(x_real) − log(1 − D(G(z)))        G minimiza  −log D(G(z))
Adam (tasa 5e-4, β1 = 0.5), lote de 256, 2000 pasos del generador.
Un solo hiperparámetro cambia entre las dos series:
      k = 1  → el detective da un paso por cada paso del falsificador (Algoritmo 1 del artículo, k = 1)
      k = 5  → el detective da cinco pasos por cada paso del falsificador
Se entrenan 20 semillas (0–19) con cada k. Se exportan:
      · A = semilla 0 con k = 1 (entrenamiento «sano»), con puntos de control (G y D) a lo largo del entrenamiento;
      · B = la primera semilla con k = 5 cuyo generador termina en una sola montaña (colapso), igual con puntos de control;
      · el generador final de las 40 corridas (para contar cuántas colapsan; definición de «cubre una montaña» en data.ts).
Los pesos se cuantizan a enteros de 16 bits (escala SCALE) y se guardan en base64 (little-endian).
"""
import base64, copy, json, math, struct, sys
from multiprocessing import Pool
from statistics import NormalDist
import numpy as np, torch, torch.nn as nn
torch.set_num_threads(1)

H, ITERS, B, LR = 10, 2000, 256, 5e-4
MODES, SD = (-1.5, 1.5), 0.4
CK = list(range(0, 200, 10)) + list(range(200, 600, 20)) + list(range(600, ITERS + 1, 50))
NZ = 800
ZQ = np.array([NormalDist().inv_cdf((i + 0.5) / NZ) for i in range(NZ)])

def real(n, g):
    c = (torch.rand(n, generator=g) < 0.5).float()
    return torch.randn(n, 1, generator=g) * SD + (c * 3 - 1.5).unsqueeze(1)

def net():
    return nn.Sequential(nn.Linear(1, H), nn.Tanh(), nn.Linear(H, H), nn.Tanh(), nn.Linear(H, 1))

def flat(m):
    s = m.state_dict()  # orden: W1, b1, W2, b2, W3, b3
    return np.concatenate([s[k].numpy().ravel() for k in ('0.weight', '0.bias', '2.weight', '2.bias', '4.weight', '4.bias')])

def train(a):
    seed, k = a
    torch.manual_seed(seed); g = torch.Generator().manual_seed(seed + 1000)
    G, D = net(), net()
    oG = torch.optim.Adam(G.parameters(), lr=LR, betas=(0.5, 0.999)); oD = torch.optim.Adam(D.parameters(), lr=LR, betas=(0.5, 0.999))
    bce = nn.BCEWithLogitsLoss(); ck = []; ld_acc, lg_acc, ld_hist, lg_hist = 0.0, 0.0, [], []
    for it in range(ITERS + 1):
        if it in CK: ck.append(np.concatenate([flat(G), flat(D)]))
        if it == ITERS: break
        for _ in range(k):
            x = real(B, g); z = torch.randn(B, 1, generator=g)
            ld = bce(D(x), torch.ones(B, 1)) + bce(D(G(z).detach()), torch.zeros(B, 1))
            oD.zero_grad(); ld.backward(); oD.step()
        z = torch.randn(B, 1, generator=g)
        lg = bce(D(G(z)), torch.ones(B, 1))
        oG.zero_grad(); lg.backward(); oG.step()
        ld_acc += ld.item(); lg_acc += lg.item()
        if (it + 1) % 10 == 0: ld_hist.append(ld_acc / 10); lg_hist.append(lg_acc / 10); ld_acc = lg_acc = 0.0
    return seed, k, np.array(ck), ld_hist, lg_hist

# ── comprobación en NumPy con los pesos ya cuantizados (lo mismo que hará el navegador) ──
def fwd(p, x):
    o = 0; W1 = p[o:o + H].reshape(H, 1); o += H; b1 = p[o:o + H]; o += H; W2 = p[o:o + H * H].reshape(H, H); o += H * H; b2 = p[o:o + H]; o += H; W3 = p[o:o + H].reshape(1, H); o += H; b3 = p[o:o + 1]
    h = np.tanh(x.reshape(-1, 1) @ W1.T + b1); h = np.tanh(h @ W2.T + b2); return (h @ W3.T + b3).ravel()
NP = 3 * H + H * H + H + 1 + 0  # 141 = H + H + H*H + H + H + 1
def covered(f):  # fracción de las muestras a menos de 0.8 de cada centro
    return [float((np.abs(f - m) < 0.8).mean()) for m in MODES]

if __name__ == '__main__':
    jobs = [(s, k) for k in (1, 5) for s in range(20)]
    with Pool(10) as pool: res = {(s, k): (ck, ld, lg) for s, k, ck, ld, lg in pool.imap(train, jobs)}
    allw = np.concatenate([r[0].ravel() for r in res.values()]); amax = float(np.abs(allw).max())
    SCALE = 2 ** int(math.floor(math.log2(32000 / amax))); print('max |w| =', round(amax, 3), '→ SCALE =', SCALE)
    q = lambda a: np.clip(np.round(a * SCALE), -32767, 32767).astype('<i2')
    b64 = lambda a: base64.b64encode(q(a).tobytes()).decode()
    deq = lambda a: q(a).astype(np.float64) / SCALE
    assert NP == 141 and res[(0, 1)][0].shape[1] == 2 * 141
    # series
    rows = {}
    for k in (1, 5):
        rows[k] = []
        for s in range(20):
            Gf = deq(res[(s, k)][0][-1][:141]); L, R = covered(fwd(Gf, ZQ)); rows[k].append((s, L, R))
        print('k =', k, ' semillas que cubren ambas montañas (≥ 20 % cada una):', sum(min(L, R) >= 0.2 for _, L, R in rows[k]), '/ 20')
        print('   ', [(s, round(L, 2), round(R, 2)) for s, L, R in rows[k]])
    sB = next(s for s, L, R in rows[5] if min(L, R) < 0.05)
    print('A = semilla 0 con k=1; B = semilla', sB, 'con k=5')
    out = []
    out.append('// GENERADO por train_gan.py (no editar a mano). Pesos de GAN diminutas en 1D, cuantizados a int16 (little-endian) y en base64.')
    out.append('// Orden de cada red: W1 (H×1), b1 (H), W2 (H×H), b2 (H), W3 (1×H), b3 (1). Cada punto de control guarda G (141) y luego D (141).')
    out.append(f'export const SCALE = {SCALE};')
    out.append(f'export const HID = {H};')
    out.append(f'export const ITS: number[] = {json.dumps(CK)};')
    out.append(f'export const SEED_B = {sB};')
    for name, key in (('A', (0, 1)), ('B', (sB, 5))):
        ck, ld, lg = res[key]
        out.append(f"export const RUN_{name} = '{b64(ck.ravel())}';")
        out.append(f'export const LOSS_{name} = {json.dumps({"d": [round(v, 3) for v in ld], "g": [round(v, 3) for v in lg]})};')
    for k in (1, 5):
        out.append(f"export const GRID_{k} = '{b64(np.concatenate([res[(s, k)][0][-1][:141] for s in range(20)]))}';")
    open('gan-data.ts', 'w').write('\n'.join(out) + '\n')
    print('gan-data.ts escrito:', sum(len(x) for x in out) // 1024, 'KB')
