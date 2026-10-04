"""Entrena un autocodificador (AE) y un autocodificador variacional (VAE) DIMINUTOS con dígitos escritos a mano de 8×8 píxeles
y exporta lo que la lección necesita a latent.json. Se ejecuta una sola vez, offline:

    OMP_NUM_THREADS=2 ~/venvs/tts/bin/python train_toy.py        (≈ 1 min en CPU)

La escena (latent.ts + scene.ts) ejecuta en el navegador estos mismos modelos con estos mismos pesos: no hay nada simulado.

DATOS. «Optical Recognition of Handwritten Digits» (UCI Machine Learning Repository), E. Alpaydin y C. Kaynak, 1998,
licencia CC BY 4.0, doi:10.24432/C50P49. scikit-learn lo incluye como load_digits(): 1797 imágenes de 8×8 píxeles con valores enteros
de 0 a 16 (cada valor cuenta cuántos píxeles de un bloque de 4×4 del mapa original de 32×32 estaban encendidos).
Se reservan 297 imágenes que ningún modelo ve al entrenar (para reconstruir imágenes «nunca vistas»); se entrena con las otras 1500.
En latent.json las imágenes van ordenadas: primero las 1500 de entrenamiento y luego las 297 reservadas.

MODELOS (todos con 32 neuronas ocultas y activación tanh; la salida del decodificador es un sigmoide):
  AE   codificador 64 → 32 → 2   ·  decodificador 2 → 32 → 64   ·  pérdida = error cuadrático de reconstrucción (suma de los 64 píxeles)
  VAE  codificador 64 → 32 → (μ, log σ²) de 2 números  ·  mismo decodificador
       pérdida = Σ(x − x̂)² / (2·σ²obs) + KL( N(μ, σ²) ‖ N(0, I) ),  con σ²obs = 0,1 (verosimilitud gaussiana de varianza fija)
  Entrenamiento: gradiente completo (lote = todo el conjunto), Adam, tasa 0,003, 1500 épocas.
  AE de comparación con cuello de 1, 4, 8 y 16 números (misma arquitectura, otro tamaño del código).

SEMILLAS. La arquitectura y los hiperparámetros se fijaron antes de mirar resultados. Para comparar «sortear al azar» en el AE y en el VAE se mide qué tan
pareja sale la mezcla de dígitos (un clasificador de regresión logística etiqueta 3000 imágenes generadas; distancia de variación total TV a la mezcla
uniforme, 0 = pareja). Con ocho semillas (0–7; SCAN=1 python train_toy.py reproduce el cuadro): AE sorteando en el recuadro de sus códigos, TV = 0,21–0,37
(media 0,28); VAE sorteando de N(0, I), TV = 0,09–0,15 (media 0,11); en TODAS las semillas el VAE sale más parejo. La semilla 5 es la usada porque queda
más cerca del promedio de las ocho (AE 0,26; VAE 0,11): ni la mejor ni la peor.

SALIDA latent.json (imágenes como cadenas de un carácter por píxel, base 17: '0'–'9','a'–'g'):
  imgs, lab, ntrain, show (índices de las 8 imágenes reservadas que la escena reconstruye), ae, vae, clf (regresión logística para ETIQUETAR muestras),
  snap (reconstrucciones del AE de 2 números en distintas épocas), loss (pérdida de entrenamiento cada 10 épocas),
  sweep (cuello de 1…16 números: error, aciertos del lector sobre las 297 reconstruidas y reconstrucciones de las 8 imágenes), check.
"""
import json, math, os
os.environ.setdefault('OMP_NUM_THREADS', '2')
import numpy as np, torch, torch.nn as nn
from sklearn.datasets import load_digits
from sklearn.linear_model import LogisticRegression

torch.set_num_threads(2)
H, EPOCHS, LR, SIG2 = 32, 1500, 3e-3, 0.1
SEED_AE, SEED_VAE = 5, 5

# ── datos ──────────────────────────────────────────────────────────────────
d = load_digits()
X = (d.data / 16.0).astype(np.float32)
y = d.target.astype(int)
perm = np.random.RandomState(7).permutation(len(X))
te, tr = perm[:297], perm[297:]
order = np.concatenate([tr, te])                       # entrenamiento primero, reservadas al final
Xo, yo = X[order], y[order]
Xtr, Xte = torch.tensor(Xo[:1500]), torch.tensor(Xo[1500:])
ytr = yo[:1500]
# 8 imágenes reservadas de 8 dígitos distintos (las primeras que aparecen, en orden aleatorio fijo)
show, seen = [], set()
for i in range(1500, len(Xo)):
    if yo[i] not in seen and len(show) < 8: show.append(i); seen.add(int(yo[i]))
Xshow = torch.tensor(Xo[show])

class Net(nn.Module):
    def __init__(s, k, vae):
        super().__init__(); s.vae = vae
        s.e1 = nn.Linear(64, H); s.mu = nn.Linear(H, k); s.lv = nn.Linear(H, k) if vae else None
        s.d1 = nn.Linear(k, H); s.d2 = nn.Linear(H, 64)
    def enc(s, x):
        h = torch.tanh(s.e1(x)); return s.mu(h), (s.lv(h) if s.vae else None)
    def dec(s, z): return torch.sigmoid(s.d2(torch.tanh(s.d1(z))))
    def forward(s, x):
        mu, lv = s.enc(x)
        z = mu + torch.exp(0.5 * lv) * torch.randn_like(mu) if s.vae else mu
        return s.dec(z), mu, lv

def train(k, vae, seed, snaps=()):
    torch.manual_seed(seed)
    m = Net(k, vae); opt = torch.optim.Adam(m.parameters(), lr=LR)
    losses, rec = [], {}
    for ep in range(EPOCHS + 1):
        xh, mu, lv = m(Xtr)
        sse = ((xh - Xtr) ** 2).sum(1)
        loss = (sse / (2 * SIG2) + 0.5 * (mu ** 2 + lv.exp() - lv - 1).sum(1)).mean() if vae else sse.mean()
        if ep % 10 == 0: losses.append(round(float(sse.detach().mean()), 4))        # siempre el error de reconstrucción (comparable)
        if ep in snaps:
            with torch.no_grad(): rec[ep] = m.dec(m.enc(Xshow)[0]).numpy()
        if ep == EPOCHS: break
        opt.zero_grad(); loss.backward(); opt.step()
    with torch.no_grad():
        sse_te = float(((m.dec(m.enc(Xte)[0]) - Xte) ** 2).sum(1).mean())
    return m, sse_te, losses, rec

def clf_fit():
    c = LogisticRegression(max_iter=3000).fit(Xo[:1500], ytr)
    return c, float(c.score(Xo[1500:], yo[1500:]))

clf, clf_acc = clf_fit()
rs = np.random.RandomState(3)
def balance(ae, vae, n=3000):
    with torch.no_grad():
        za = ae.enc(Xtr)[0]; lo, hi = za.min(0).values.numpy(), za.max(0).values.numpy()
        A = ae.dec(torch.tensor(rs.uniform(lo, hi, (n, 2)).astype(np.float32))).numpy()
        V = vae.dec(torch.tensor(rs.randn(n, 2).astype(np.float32))).numpy()
    return np.bincount(clf.predict(A), minlength=10) / n, np.bincount(clf.predict(V), minlength=10) / n

if os.environ.get('SCAN'):
    print('semilla | TV AE-recuadro | TV VAE')
    tvs = []
    for s in range(8):
        a, _, _, _ = train(2, False, s); v, _, _, _ = train(2, True, s)
        ha, hv = balance(a, v); tvs.append((0.5 * np.abs(ha - 0.1).sum(), 0.5 * np.abs(hv - 0.1).sum())); print(s, '%.3f %.3f' % tvs[-1], flush=True)
    print('media', np.mean(tvs, 0).round(3))

# ── entrenamiento ──────────────────────────────────────────────────────────
SNAP = (0, 10, 50, 300, EPOCHS)
ae, sse_ae, loss_ae, rec_ae = train(2, False, SEED_AE, SNAP)
vae, sse_vae, _, _ = train(2, True, SEED_VAE)
ha, hv = balance(ae, vae)
print('SSE por imagen reservada: AE', round(sse_ae, 3), ' VAE', round(sse_vae, 3), ' | clasificador reservado', round(clf_acc, 3))
print('AE-recuadro  frecuencia por dígito', np.round(ha, 2), 'TV', round(0.5 * np.abs(ha - 0.1).sum(), 3)); print('VAE N(0,I)   frecuencia por dígito', np.round(hv, 2), 'TV', round(0.5 * np.abs(hv - 0.1).sum(), 3))
sweep = {'k': [1, 2, 4, 8, 16], 'sse': [], 'acc': [], 'rec': []}
for k in sweep['k']:
    if k == 2: m, s, _, _ = ae, sse_ae, 0, 0
    else: m, s, _, _ = train(k, False, 0)
    with torch.no_grad(): r = m.dec(m.enc(Xshow)[0]).numpy(); rte = m.dec(m.enc(Xte)[0]).numpy()
    sweep['acc'].append(round(float((clf.predict(rte) == yo[1500:]).mean()), 3))     # el «lector» (regresión logística) sobre las 297 reconstruidas
    sweep['sse'].append(round(s, 3)); sweep['rec'].append([round(float(v), 3) for v in r.flatten()])
print('SSE por imagen reservada según el cuello k:', dict(zip(sweep['k'], sweep['sse'])), '| lector acierta:', dict(zip(sweep['k'], sweep['acc'])))
base = float(((Xte - Xtr.mean(0)) ** 2).sum(1).mean()); print('referencia (imagen media):', round(base, 3))

# ── exportar ───────────────────────────────────────────────────────────────
CH = '0123456789abcdefg'
imgs = ''.join(CH[int(round(v * 16))] for v in Xo.flatten())
arr = lambda t: [round(float(v), 3) for v in t.detach().numpy().flatten()]
def net_json(m, vae):
    o = {'e1w': arr(m.e1.weight), 'e1b': arr(m.e1.bias), 'mw': arr(m.mu.weight), 'mb': arr(m.mu.bias), 'd1w': arr(m.d1.weight), 'd1b': arr(m.d1.bias), 'd2w': arr(m.d2.weight), 'd2b': arr(m.d2.bias)}
    if vae: o.update({'lw': arr(m.lv.weight), 'lb': arr(m.lv.bias)})
    return o
with torch.no_grad():
    zc = torch.tensor([[0.5, -0.5]]); m1, l1 = vae.enc(Xshow[:1]); a1, _ = ae.enc(Xshow[:1])
    check = {'ae_mu': arr(a1), 'vae_mu': arr(m1), 'vae_lv': arr(l1), 'ae_dec': arr(ae.dec(zc)), 'vae_dec': arr(vae.dec(zc)), 'z': [0.5, -0.5]}
out = {
    'H': H, 'ntrain': 1500, 'imgs': imgs, 'lab': ''.join(str(int(v)) for v in yo), 'show': show,
    'ae': net_json(ae, False), 'vae': net_json(vae, True),
    'clf': {'w': [round(float(v), 3) for v in clf.coef_.flatten()], 'b': [round(float(v), 3) for v in clf.intercept_], 'acc': round(clf_acc, 3)},
    'snap': {'ep': list(SNAP), 'rec': [[round(float(v), 3) for v in rec_ae[e].flatten()] for e in SNAP]},
    'loss': loss_ae, 'sweep': sweep, 'base': round(base, 3), 'check': check,
    'stats': {'ae_sse': round(sse_ae, 3), 'vae_sse': round(sse_vae, 3), 'ae_freq': [round(float(v), 3) for v in ha], 'vae_freq': [round(float(v), 3) for v in hv]},
}
here = os.path.dirname(os.path.abspath(__file__))
json.dump(out, open(os.path.join(here, 'latent.json'), 'w'), separators=(',', ':'))
print('latent.json escrito:', os.path.getsize(os.path.join(here, 'latent.json')) // 1024, 'KB')
