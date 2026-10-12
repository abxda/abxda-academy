"""El detective SOLO: entrena el discriminador de la corrida A contra el falsificador novato (congelado) y exporta sus pesos.
Se ejecuta una sola vez, offline, en CPU (sin GPU):
      CUDA_VISIBLE_DEVICES= ~/venvs/tts/bin/python train_detective.py        (unos segundos; 1000 pasos)

Para qué: la lección presenta al detective por separado, con un ejemplo concreto, antes de juntar a los dos jugadores.
Parte EXACTAMENTE de los pesos del punto de control 0 de la corrida A de gan-data.ts (G0 y D0, ya cuantizados): el mismo
falsificador novato (todo cerca de cero) y el mismo detective sin entrenar que se ven al empezar el juego.
Luego entrena solo a D, con G0 fijo, con lo mismo que train_gan.py: datos reales = mezcla 50/50 de N(-1.5, 0.4²) y N(+1.5, 0.4²);
pérdida de D = −log D(x_real) − log(1 − D(G0(z))); Adam (tasa 5e-4, β1 = 0.5), lote de 256. Semilla fija.
Exporta D en los pasos de DET_ITS, con la misma cuantización (int16, escala SCALE de gan-data.ts) y en base64.
La escena ejecuta en el navegador estas mismas redes (solo la pasada hacia delante).
"""
import base64, json, re
import numpy as np, torch, torch.nn as nn
torch.set_num_threads(4)

H, B, LR = 10, 256, 5e-4
DET_ITS = list(range(0, 1001, 25))
SRC = open('gan-data.ts').read()
SCALE = int(re.search(r'export const SCALE = (\d+);', SRC).group(1))
RUN_A = re.search(r"export const RUN_A = '([^']+)';", SRC).group(1)
w = np.frombuffer(base64.b64decode(RUN_A), dtype='<i2').astype(np.float64) / SCALE
G0, D0 = w[:141], w[141:282]          # punto de control 0: G (141) y luego D (141)

def net():
    return nn.Sequential(nn.Linear(1, H), nn.Tanh(), nn.Linear(H, H), nn.Tanh(), nn.Linear(H, 1))

def load(m, p):
    o = 0; sd = {}
    for k, shape in (('0.weight', (H, 1)), ('0.bias', (H,)), ('2.weight', (H, H)), ('2.bias', (H,)), ('4.weight', (1, H)), ('4.bias', (1,))):
        n = int(np.prod(shape)); sd[k] = torch.tensor(p[o:o + n].reshape(shape), dtype=torch.float32); o += n
    m.load_state_dict(sd)

def flat(m):
    s = m.state_dict()
    return np.concatenate([s[k].numpy().ravel() for k in ('0.weight', '0.bias', '2.weight', '2.bias', '4.weight', '4.bias')])

def real(n, g):
    c = (torch.rand(n, generator=g) < 0.5).float()
    return torch.randn(n, 1, generator=g) * 0.4 + (c * 3 - 1.5).unsqueeze(1)

torch.manual_seed(0); g = torch.Generator().manual_seed(2000)
G, D = net(), net(); load(G, G0); load(D, D0)
for p in G.parameters(): p.requires_grad_(False)
oD = torch.optim.Adam(D.parameters(), lr=LR, betas=(0.5, 0.999)); bce = nn.BCEWithLogitsLoss()
ck = []
for it in range(DET_ITS[-1] + 1):
    if it in DET_ITS: ck.append(flat(D))
    if it == DET_ITS[-1]: break
    x = real(B, g); z = torch.randn(B, 1, generator=g)
    ld = bce(D(x), torch.ones(B, 1)) + bce(D(G(z)), torch.zeros(B, 1))
    oD.zero_grad(); ld.backward(); oD.step()
ck = np.array(ck)
assert np.abs(ck).max() * SCALE < 32767, 'pesos fuera del rango de int16 con esta escala'
q = np.round(ck * SCALE).astype('<i2')

# comprobación con los pesos ya cuantizados (lo mismo que hará el navegador)
def fwd(p, x):
    o = 0; W1 = p[o:o + H].reshape(H, 1); o += H; b1 = p[o:o + H]; o += H; W2 = p[o:o + H * H].reshape(H, H); o += H * H; b2 = p[o:o + H]; o += H; W3 = p[o:o + H].reshape(1, H); o += H; b3 = p[o:o + 1]
    h = np.tanh(np.reshape(x, (-1, 1)) @ W1.T + b1); h = np.tanh(h @ W2.T + b2); return (h @ W3.T + b3).ravel()
sig = lambda v: 1 / (1 + np.exp(-v))
for i, it in enumerate(DET_ITS):
    p = q[i].astype(np.float64) / SCALE
    xs = np.array([-1.5, -0.8, 0.0, 0.07, 0.8, 1.5, 1.6])
    print(f'paso {it:3d}  D(x) en', ' '.join(f'{x:+.2f}:{v:.3f}' for x, v in zip(xs, sig(fwd(p, xs)))))
out = ['// GENERADO por train_detective.py (no editar a mano). El detective de la corrida A entrenado SOLO contra el falsificador novato (fijo).',
       '// Misma red y cuantización que gan-data.ts: W1 (H×1), b1 (H), W2 (H×H), b2 (H), W3 (1×H), b3 (1); int16 little-endian en base64.',
       f'export const DET_ITS: number[] = {json.dumps(DET_ITS)};',
       f"export const DET = '{base64.b64encode(q.tobytes()).decode()}';"]
open('detective-data.ts', 'w').write('\n'.join(out) + '\n')
print('detective-data.ts escrito')
