"""Un modelo de TEXTO A IMAGEN diminuto, entrenado de verdad, para la lección 18. Se ejecuta una sola vez, offline:

    ~/venvs/tts/bin/python train_toy.py            # escribe model.ts (≈ 15 min en CPU)

La escena corre en el navegador (nn.ts) el mismo cálculo con estos pesos: no hay nada simulado. Piezas:
  1. Mundo de juguete: imágenes de 12×12 píxeles con cinco colores (los cinco tonos del curso), un fondo y UNA forma
     (círculo, cuadrado, triángulo, cruz). Se generan aquí mismo, sin conjuntos externos (licencia: propia).
     Sesgo deliberado: en los datos de entrenamiento la mitad de las figuras de cada forma tiene su «color típico»
     (círculo→magenta, cuadrado→ámbar, triángulo→verde, cruz→cian). Diez combinaciones (forma, color, fondo) NUNCA se ven.
  2. CLIP de juguete: un codificador de imagen y uno de texto (frases en español y en inglés, a veces incompletas)
     entrenados juntos con la pérdida contrastiva simétrica del artículo (Radford et al., 2021, Fig. 3).
     Se guardan las matrices de similitud de un lote fijo de seis pares en varios pasos del entrenamiento.
  3. Un segundo codificador de texto, «bolsa de palabras» (suma de palabras, sin orden), alineado con el codificador
     de imagen ya congelado: sirve para mostrar qué pasa cuando el texto no distingue quién va con quién.
  4. Autocodificador variacional (VAE) pequeño: 720 números (12×12 píxeles × 5 colores) → latente de 16.
  5. Modelo de difusión en el espacio latente, condicionado por el vector de CLIP y entrenado con «texto borrado»
     el 10 % de las veces para poder hacer guiado sin clasificador (Ho y Salimans, 2022), como Stable Diffusion v1-4.
Todas las semillas son fijas. Los pesos se guardan cuantizados a 8 bits por fila (base64); las pruebas de la
lección usan esos mismos pesos cuantizados.
"""
import base64, json, math, sys, time
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F
torch.set_num_threads(16)

# ───────────────────────── 1. el mundo ─────────────────────────
N = 12
K = 5                                   # 0 cian(sig) 1 magenta(err) 2 ámbar(w) 3 verde(dat) 4 violeta(lat)
SHAPES = 4                              # 0 círculo 1 cuadrado 2 triángulo 3 cruz
ES_SHAPE = ['círculo', 'cuadrado', 'triángulo', 'cruz']
EN_SHAPE = ['circle', 'square', 'triangle', 'cross']
ES_COLOR = ['cian', 'magenta', 'ámbar', 'verde', 'violeta']
EN_COLOR = ['cyan', 'magenta', 'amber', 'green', 'violet']
VOCAB = ['<pad>'] + ES_SHAPE + EN_SHAPE
for w in ES_COLOR + EN_COLOR:
    if w not in VOCAB:
        VOCAB.append(w)
VOCAB += ['sobre', 'fondo', 'on', 'background']
TOK = {w: i for i, w in enumerate(VOCAB)}
L = 5                                   # palabras por frase (con relleno)
TYPICAL = [1, 2, 3, 0]                  # color típico de cada forma
P_TYPICAL = 0.5

YY, XX = np.mgrid[0:N, 0:N].astype(np.float32)


def render(shape, fg, bg, cx, cy, r):
    dx = XX[None] - cx[:, None, None]; dy = YY[None] - cy[:, None, None]; r = r[:, None, None]
    circ = dx ** 2 + dy ** 2 <= r ** 2
    sq = np.maximum(np.abs(dx), np.abs(dy)) <= r * 0.8
    t = (dy + r) / (2 * r)
    tri = (t >= 0) & (t <= 1) & (np.abs(dx) <= t * r + 0.3)
    cr = ((np.abs(dx) <= 0.6) & (np.abs(dy) <= r)) | ((np.abs(dy) <= 0.6) & (np.abs(dx) <= r))
    m = np.where((shape == 0)[:, None, None], circ, np.where((shape == 1)[:, None, None], sq, np.where((shape == 2)[:, None, None], tri, cr)))
    return np.where(m, fg[:, None, None], bg[:, None, None]).astype(np.int64)


def sample_pose(rng, B):
    return (rng.uniform(5.0, 6.0, B).astype(np.float32), rng.uniform(5.0, 6.0, B).astype(np.float32), rng.uniform(2.7, 3.9, B).astype(np.float32))


COMBOS = [(s, f, b) for s in range(SHAPES) for f in range(K) for b in range(K) if f != b]            # 80


def holdout_combos():
    """10 combinaciones que nunca se ven. Ninguna usa el color típico de su forma; cada forma, color y fondo aparece en otras."""
    rng = np.random.default_rng(2024)
    cand = [c for c in COMBOS if c[1] != TYPICAL[c[0]]]
    while True:
        hs = [cand[i] for i in rng.choice(len(cand), 10, replace=False)]
        rest = [c for c in COMBOS if c not in hs]
        if all(any(c[0] == s for c in rest) for s in range(SHAPES)) and all(any(c[1] == f for c in rest) for f in range(K)) \
           and all(any(c[2] == b for c in rest) for b in range(K)) and all(sum(1 for c in hs if c[0] == s) >= 2 for s in range(SHAPES)):
            return sorted(hs)


HOLD = holdout_combos()
TRAIN = [c for c in COMBOS if c not in HOLD]


def caption_tokens(s, f, b, lang, kind):
    """kind: 0 completa · 1 sin fondo · 2 sin color · 3 solo la forma."""
    if lang == 'es':
        sh, co, bg = ES_SHAPE[s], ES_COLOR[f], ES_COLOR[b]
        words = {0: [sh, co, 'sobre', 'fondo', bg], 1: [sh, co], 2: [sh, 'sobre', 'fondo', bg], 3: [sh]}[kind]
    else:
        sh, co, bg = EN_SHAPE[s], EN_COLOR[f], EN_COLOR[b]
        words = {0: [co, sh, 'on', bg, 'background'], 1: [co, sh], 2: [sh, 'on', bg, 'background'], 3: [sh]}[kind]
    ids = [TOK[w] for w in words]
    return ids + [0] * (L - len(ids))


def caption_text(s, f, b, lang, kind=0):
    return ' '.join(VOCAB[i] for i in caption_tokens(s, f, b, lang, kind) if i)


def draw_combos(rng, B):
    """Combinaciones de entrenamiento con el sesgo: la mitad de cada forma lleva su color típico."""
    shape = rng.integers(0, SHAPES, B); fg = np.zeros(B, int); bg = np.zeros(B, int)
    for i in range(B):
        while True:
            f = TYPICAL[shape[i]] if rng.random() < P_TYPICAL else int(rng.integers(0, K))
            b = int(rng.integers(0, K))
            if f != b and (int(shape[i]), f, b) not in HOLD:
                break
        fg[i], bg[i] = f, b
    return shape, fg, bg


def batch(rng, B, combos=None, kinds_p=(0.55, 0.15, 0.15, 0.15)):
    if combos is None:
        s, f, b = draw_combos(rng, B)
    else:
        ci = rng.integers(0, len(combos), B)
        s = np.array([combos[i][0] for i in ci]); f = np.array([combos[i][1] for i in ci]); b = np.array([combos[i][2] for i in ci])
    cx, cy, r = sample_pose(rng, B)
    img = render(s, f, b, cx, cy, r)
    lang = rng.integers(0, 2, B); kind = rng.choice(4, B, p=kinds_p)
    toks = np.array([caption_tokens(s[i], f[i], b[i], 'es' if lang[i] == 0 else 'en', kind[i]) for i in range(B)])
    return img, toks, (s, f, b, cx, cy, r, lang, kind)


# ───────────────────────── 2. CLIP de juguete ─────────────────────────
D = 32


class TextEnc(nn.Module):
    def __init__(s, kind='flat', e=16, h=64):
        super().__init__()
        s.kind = kind
        s.E = nn.Embedding(len(VOCAB), e)
        if kind == 'flat':
            s.P = nn.Parameter(torch.randn(L, e) * 0.1); s.l1 = nn.Linear(L * e, h)
        else:
            s.l1 = nn.Linear(e, h)
        s.l2 = nn.Linear(h, D)

    def forward(s, tok):
        x = s.E(tok)
        if s.kind == 'flat':
            z = s.l2(F.silu(s.l1((x + s.P).flatten(1))))
        else:
            z = s.l2(F.silu(s.l1((x * (tok > 0).float().unsqueeze(-1)).sum(1))))
        return F.normalize(z, dim=-1)


class ImgEnc(nn.Module):
    def __init__(s, h=96):
        super().__init__(); s.l1 = nn.Linear(K * N * N, h); s.l2 = nn.Linear(h, D)

    def forward(s, img):
        return F.normalize(s.l2(F.silu(s.l1(F.one_hot(img, K).float().flatten(1)))), dim=-1)


class Clip(nn.Module):
    def __init__(s):
        super().__init__()
        s.te = TextEnc('flat'); s.ie = ImgEnc(); s.t = nn.Parameter(torch.tensor(math.log(1 / 0.07)))

    def logits(s, img, tok):
        return s.ie(img) @ s.te(tok).T * s.t.exp().clamp(max=100)


def clip_loss(lg):
    y = torch.arange(lg.shape[0])
    return (F.cross_entropy(lg, y) + F.cross_entropy(lg.T, y)) / 2


def pick_demo():
    """Seis pares con las cuatro formas, todos de entrenamiento y con frase completa (el lote fijo de la demostración)."""
    want = [(0, 1, 2), (1, 2, 4), (2, 3, 0), (3, 0, 1), (0, 4, 3), (1, 0, 2)]
    assert all(c in TRAIN for c in want), 'combinación de la demostración fuera del entrenamiento'
    return want


def fixed_images(combos, seed):
    rng = np.random.default_rng(seed)
    cx, cy, r = sample_pose(rng, len(combos))
    return render(np.array([c[0] for c in combos]), np.array([c[1] for c in combos]), np.array([c[2] for c in combos]), cx, cy, r)


CKPT = [0, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2500]


def train_clip(steps=2500, B=96, seed=0):
    torch.manual_seed(seed); rng = np.random.default_rng(seed)
    m = Clip(); opt = torch.optim.Adam(m.parameters(), lr=3e-3); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, steps)
    demo = pick_demo(); dimg = torch.tensor(fixed_images(demo, 11))
    dtok = {lg: torch.tensor([caption_tokens(s, f, b, lg, 0) for (s, f, b) in demo]) for lg in ('es', 'en')}
    rec = dict(steps=[], sims={'es': [], 'en': []}, loss={'es': [], 'en': []}, temp=[])

    @torch.no_grad()
    def snap(st):
        rec['steps'].append(st); rec['temp'].append(float(m.t.exp().clamp(max=100)))
        for lg in ('es', 'en'):
            cos = (m.ie(dimg) @ m.te(dtok[lg]).T)                       # filas: imágenes · columnas: frases
            rec['sims']['es' if lg == 'es' else 'en'].append(cos.numpy().round(4).tolist())
            rec['loss'][lg].append(float(clip_loss(cos * m.t.exp().clamp(max=100))))
    for st in range(steps + 1):
        if st in CKPT: snap(st)
        if st == steps: break
        img, tok, _ = batch(rng, B)
        loss = clip_loss(m.logits(torch.tensor(img), torch.tensor(tok)))
        opt.zero_grad(); loss.backward(); opt.step(); sch.step()
        if st % 500 == 0: print('CLIP', st, round(loss.item(), 3), flush=True)
    return m, rec


def train_bag(clip, steps=1500, B=96, seed=1):
    """Codificador de texto «bolsa de palabras» alineado con el codificador de imagen congelado."""
    torch.manual_seed(seed); rng = np.random.default_rng(seed + 7)
    te = TextEnc('bag'); opt = torch.optim.Adam(te.parameters(), lr=3e-3)
    for p in clip.parameters(): p.requires_grad_(False)
    for st in range(steps):
        img, tok, _ = batch(rng, B)
        lg = clip.ie(torch.tensor(img)) @ te(torch.tensor(tok)).T * clip.t.exp().clamp(max=100)
        loss = clip_loss(lg); opt.zero_grad(); loss.backward(); opt.step()
    for p in clip.parameters(): p.requires_grad_(True)
    return te


@torch.no_grad()
def binding_accuracy(ie, te, n=60, seed=3):
    """Para n parejas (forma, color a, fondo b) vs (forma, color b, fondo a): ¿la frase de cada imagen está más cerca de SU imagen que de la intercambiada?"""
    rng = np.random.default_rng(seed); ok = tot = 0
    for _ in range(n):
        s = int(rng.integers(0, SHAPES)); a, b = rng.choice(K, 2, replace=False)
        imgs = fixed_images([(s, int(a), int(b)), (s, int(b), int(a))], int(rng.integers(1 << 30)))
        I = ie(torch.tensor(imgs))
        for lg in ('es', 'en'):
            T_ = te(torch.tensor([caption_tokens(s, int(a), int(b), lg, 0), caption_tokens(s, int(b), int(a), lg, 0)]))
            S_ = I @ T_.T
            ok += int(S_[0, 0] > S_[0, 1] + 1e-6) + int(S_[1, 1] > S_[1, 0] + 1e-6); tot += 2
    return ok / tot


# ───────────────────────── 3. VAE y difusión latente ─────────────────────────
Z = 16
T = 40                                  # misma receta que la lección 17
B0, B1 = 0.02, 0.30
SIGMA = 'beta'                          # varianza del paso inverso (σ² = β), como en la lección 17
BETA_KL = 0.02


class VAE(nn.Module):
    def __init__(s, he=128, hd=64):
        super().__init__()
        s.e1 = nn.Linear(K * N * N, he); s.mu = nn.Linear(he, Z); s.lv = nn.Linear(he, Z)
        s.d1 = nn.Linear(Z, hd); s.d2 = nn.Linear(hd, K * N * N)

    def enc(s, img):
        h = F.silu(s.e1(F.one_hot(img, K).float().flatten(1))); return s.mu(h), s.lv(h)

    def dec(s, z):
        return s.d2(F.silu(s.d1(z))).view(-1, N * N, K)


def train_vae(steps=5000, B=256, seed=0):
    torch.manual_seed(seed); rng = np.random.default_rng(seed + 100)
    m = VAE(); opt = torch.optim.Adam(m.parameters(), lr=2e-3); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, steps)
    for st in range(steps):
        img, _, _ = batch(rng, B, COMBOS); img = torch.tensor(img)          # un compresor genérico: ve las 80 combinaciones
        mu, lv = m.enc(img); z = mu + torch.randn_like(mu) * (0.5 * lv).exp()
        rec = F.cross_entropy(m.dec(z).reshape(-1, K), img.flatten(), reduction='sum') / B
        kl = (-0.5 * (1 + lv - mu ** 2 - lv.exp()).sum(1)).mean()
        loss = rec + BETA_KL * kl
        opt.zero_grad(); loss.backward(); opt.step(); sch.step()
    with torch.no_grad():
        img, _, _ = batch(np.random.default_rng(9), 1024, COMBOS); mu, _ = m.enc(torch.tensor(img))
        pred = m.dec(mu).argmax(-1).view(-1, N, N).numpy()
        print('VAE píxeles %.4f · imágenes exactas %.3f' % ((pred == img).mean(), (pred == img).all((1, 2)).mean()), flush=True)
    return m


def temb(t):
    t = t.float().unsqueeze(1) / T
    f = torch.tensor([1, 2, 4, 8], dtype=torch.float32).unsqueeze(0) * math.pi
    return torch.cat([torch.sin(t * f), torch.cos(t * f)], 1)


class Den(nn.Module):
    def __init__(s, h=192):
        super().__init__()
        s.l1 = nn.Linear(Z + 8 + D, h); s.l2 = nn.Linear(h, h); s.l3 = nn.Linear(h, h); s.out = nn.Linear(h, Z)

    def forward(s, z, t, c):
        x = torch.cat([z, temb(t), c], 1)
        return s.out(F.silu(s.l3(F.silu(s.l2(F.silu(s.l1(x)))))))


betas = np.linspace(B0, B1, T); alphas = 1 - betas; abar = np.cumprod(alphas)


def train_den(clip, vae, zscale, steps=24000, B=512, p_uncond=0.1, seed=0):
    torch.manual_seed(seed); rng = np.random.default_rng(seed + 200)
    den = Den(); opt = torch.optim.Adam(den.parameters(), lr=2e-3); sch = torch.optim.lr_scheduler.CosineAnnealingLR(opt, steps)
    ab = torch.tensor(abar, dtype=torch.float32); null = clip.te(torch.zeros(1, L, dtype=torch.long)).detach()
    for st in range(steps):
        img, tok, _ = batch(rng, B)
        with torch.no_grad():
            mu, lv = vae.enc(torch.tensor(img)); z0 = (mu + torch.randn_like(mu) * (0.5 * lv).exp()) / zscale
            c = clip.te(torch.tensor(tok)); drop = (torch.rand(B) < p_uncond).unsqueeze(1); c = torch.where(drop, null.expand(B, -1), c)
        t = torch.randint(0, T, (B,)); eps = torch.randn_like(z0)
        zt = ab[t].sqrt().unsqueeze(1) * z0 + (1 - ab[t]).sqrt().unsqueeze(1) * eps
        loss = ((den(zt, t, c) - eps) ** 2).mean(); opt.zero_grad(); loss.backward(); opt.step(); sch.step()
        if st % 4000 == 0 or st == steps - 1: print('DEN', st, round(loss.item(), 4), flush=True)
    return den


# ───────────────────────── 4. exportar ─────────────────────────
def pack(w):
    """Matriz (filas × columnas) → int8 por fila + escala por fila, en base64."""
    w = w.detach().numpy().astype(np.float64)
    if w.ndim == 1: w = w[None]
    sc = np.abs(w).max(1) / 127.0; sc[sc == 0] = 1
    q = np.clip(np.round(w / sc[:, None]), -127, 127).astype(np.int8)
    return dict(r=int(w.shape[0]), c=int(w.shape[1]), sc=[float('%.6g' % s) for s in sc], q=base64.b64encode(q.tobytes()).decode()), (q * sc[:, None]).astype(np.float32)


def vec(b):
    return [float('%.5g' % x) for x in b.detach().numpy().flatten()]


def quantize_inplace(mod):
    """Sustituye los pesos de las capas lineales y embeddings por su versión cuantizada, para probar con lo mismo que enviamos."""
    for name, p in mod.named_parameters():
        if p.ndim >= 2:
            _, dq = pack(p.data); p.data = torch.tensor(dq).view_as(p.data)
    return mod


def export(clip, bag, vae, den, zscale, rec, extra, path='model.ts'):
    te, ie = clip.te, clip.ie
    M = {}
    M['T'] = T; M['Z'] = Z; M['D'] = D; M['L'] = L; M['zscale'] = float('%.6g' % zscale); M['b0'] = B0; M['b1'] = B1; M['sigma'] = SIGMA
    M['vocab'] = VOCAB
    M['te'] = dict(E=pack(te.E.weight)[0], P=pack(te.P)[0], l1w=pack(te.l1.weight)[0], l1b=vec(te.l1.bias), l2w=pack(te.l2.weight)[0], l2b=vec(te.l2.bias))
    M['bag'] = dict(E=pack(bag.E.weight)[0], l1w=pack(bag.l1.weight)[0], l1b=vec(bag.l1.bias), l2w=pack(bag.l2.weight)[0], l2b=vec(bag.l2.bias))
    M['dec'] = dict(d1w=pack(vae.d1.weight)[0], d1b=vec(vae.d1.bias), d2w=pack(vae.d2.weight)[0], d2b=vec(vae.d2.bias))
    M['den'] = dict(l1w=pack(den.l1.weight)[0], l1b=vec(den.l1.bias), l2w=pack(den.l2.weight)[0], l2b=vec(den.l2.bias),
                    l3w=pack(den.l3.weight)[0], l3b=vec(den.l3.bias), ow=pack(den.out.weight)[0], ob=vec(den.out.bias))
    out = ['// GENERADO por train_toy.py (no editar a mano). Un modelo de texto a imagen diminuto, entrenado de verdad: ver ese archivo.',
           'export interface Q { r: number; c: number; sc: number[]; q: string }   // matriz r×c, int8 por filas (base64) y escala por fila',
           'export const MODEL = ' + json.dumps(M, ensure_ascii=False, separators=(',', ':')) + ';']
    for k, v in extra.items():
        out.append('export const %s = %s;' % (k, json.dumps(v, ensure_ascii=False, separators=(',', ':'))))
    out.append('export const CLIP_REC = ' + json.dumps(rec, separators=(',', ':')) + ';')
    open(path, 'w').write('\n'.join(out) + '\n')
    print('escrito', path, sum(len(s) for s in out) // 1024, 'KB')


@torch.no_grad()
def reference(clip, bag, vae, den, zscale):
    """Valores de referencia (calculados aquí con los pesos cuantizados) para comprobar el código del navegador."""
    tok = torch.tensor([caption_tokens(1, 2, 4, 'es', 0), caption_tokens(0, 1, 2, 'en', 1)])
    z = torch.linspace(-1, 1, Z).unsqueeze(0).repeat(2, 1); t = torch.tensor([7, 31]); c = clip.te(tok)
    return dict(tok=tok.tolist(), te=clip.te(tok).numpy().round(5).tolist(), bag=bag(tok).numpy().round(5).tolist(),
                eps=den(z, t, c).numpy().round(5).tolist(), z=z[0].tolist(), t=t.tolist(),
                dec=vae.dec(z * zscale).softmax(-1)[0, :3].numpy().round(5).tolist())


if __name__ == '__main__':
    t0 = time.time()
    clip, rec = train_clip()
    bag = train_bag(clip)
    print('binding: texto que ve el orden %.2f · bolsa de palabras %.2f' % (binding_accuracy(clip.ie, clip.te), binding_accuracy(clip.ie, bag)))
    vae = train_vae()
    img, _, _ = batch(np.random.default_rng(1), 4096, COMBOS)
    with torch.no_grad():
        mu, lv = vae.enc(torch.tensor(img)); zscale = (mu + torch.randn_like(mu) * (0.5 * lv).exp()).std().item()
    print('zscale', zscale)
    den = train_den(clip, vae, zscale)
    for m in (clip, bag, vae, den): quantize_inplace(m)       # probar y exportar los mismos números
    clip.eval(); bag.eval(); vae.eval(); den.eval()
    bind = dict(flat=binding_accuracy(clip.ie, clip.te), bag=binding_accuracy(clip.ie, bag))
    print('binding (cuantizado)', bind)

    demo = pick_demo(); dimg = fixed_images(demo, 11)
    # galería de 12 imágenes (6 vistas, 6 inéditas) y su mapa (PCA de imágenes y frases en los dos idiomas)
    seen = [(0, 1, 2), (1, 2, 4), (2, 3, 0), (3, 0, 1), (0, 4, 3), (2, 0, 4)]
    assert all(c in TRAIN for c in seen)
    unseen = [HOLD[i] for i in (0, 2, 4, 6, 8, 9)]
    gal = seen + unseen; gimg = fixed_images(gal, 21)
    with torch.no_grad():
        gI = clip.ie(torch.tensor(gimg)).numpy()
        gTes = clip.te(torch.tensor([caption_tokens(s, f, b, 'es', 0) for (s, f, b) in gal])).numpy()
        gTen = clip.te(torch.tensor([caption_tokens(s, f, b, 'en', 0) for (s, f, b) in gal])).numpy()
    pts = np.concatenate([gI, gTes, gTen]); mean = pts.mean(0); U, S_, Vt = np.linalg.svd(pts - mean, full_matrices=False)
    xy = (pts - mean) @ Vt[:2].T; xy = xy / np.abs(xy).max()
    n = len(gal)
    # intercambio de colores (forma sobre fondo / fondo sobre forma)
    swap = [(0, 1, 2), (0, 2, 1)]; simg = fixed_images(swap, 5)
    with torch.no_grad():
        sI = clip.ie(torch.tensor(simg)).numpy()
    extra = dict(
        DEMO=dict(combos=demo, imgs=dimg.reshape(len(demo), -1).tolist(), tokEs=[caption_tokens(s, f, b, 'es', 0) for (s, f, b) in demo], tokEn=[caption_tokens(s, f, b, 'en', 0) for (s, f, b) in demo]),
        GALLERY=dict(combos=gal, seen=[1] * len(seen) + [0] * len(unseen), imgs=gimg.reshape(len(gal), -1).tolist(), emb=gI.round(5).tolist()),
        MAP=dict(img=xy[:n].round(4).tolist(), es=xy[n:2 * n].round(4).tolist(), en=xy[2 * n:].round(4).tolist(), var=[float('%.3f' % (s ** 2 / (S_ ** 2).sum())) for s in S_[:2]]),
        SWAP=dict(combos=swap, imgs=simg.reshape(2, -1).tolist(), emb=sI.round(5).tolist(), acc=bind),
        WORLD=dict(typical=TYPICAL, pTypical=P_TYPICAL, hold=HOLD, train=len(TRAIN), kinds=[0.55, 0.15, 0.15, 0.15]),
        REF=reference(clip, bag, vae, den, zscale),
    )
    export(clip, bag, vae, den, zscale, rec, extra)
    print('listo en %.1f min' % ((time.time() - t0) / 60))
