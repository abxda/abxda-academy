#!/usr/bin/env python3
"""
Genera `weights.ts`: un transformer DIMINUTO, de verdad, entrenado desde cero para la lección «El transformer completo».

Reproducir (desde esta carpeta; requiere torch y numpy, sin red):
    python train_tiny.py            # escribe weights.ts junto a este archivo y tarda < 1 min en CPU

Qué es (idéntico en español y en inglés, solo cambian las palabras):
  · Gramática de juguete, inventada por nosotros (sin derechos de autor), con 12 «palabras»:
        . el|the  gato|cat  perro|dog  loro|parrot  bebe|drinks  come|eats
        leche|milk  agua|water  pescado|fish  hueso|bone  semillas|seeds
    Cada frase es «el SUJETO VERBO OBJETO .» y el OBJETO depende del sujeto Y del verbo (no basta mirar la palabra
    anterior), con probabilidades fijas (ver GRAMMAR). Una secuencia de entrenamiento son 3 frases seguidas (12 tokens).
  · Arquitectura estilo GPT, a escala de juguete: d = 8, 2 cabezas (d_cabeza = 4), 2 bloques, MLP de 32 (= 4·d),
    normalización previa (pre-LN), GELU (aproximación tanh de GPT-2), posición SINUSOIDAL fija (Vaswani et al., 2017),
    salida con la misma matriz que el embedding de entrada (weight tying), con sesgos. Sin dropout.
  · Entrenamiento: predicción de la siguiente palabra en todas las posiciones a la vez (con máscara causal),
    AdamW, 4000 pasos, lote de 256 secuencias muestreadas de la gramática, semilla fija (0).
  · Experimento de la máscara causal: se entrena OTRO modelo idéntico (misma semilla, mismos datos, mismos pasos) pero SIN
    máscara causal. Se guardan las dos curvas de pérdida de entrenamiento y la atención del modelo sin máscara.
    Cota inferior de la pérdida con máscara: la entropía condicional media de la gramática (FLOOR, en nats).
  · Se guarda: pesos redondeados a 4 decimales (el modelo que corre el navegador es ESTE, redondeado), y, como
    comprobación, los logits de PyTorch (sin redondear) para cuatro frases, que `verify-forward.mts` compara
    con la implementación en TypeScript de `model.ts`.
  · También se verifica aquí la fórmula de parámetros de la lección (params.ts) contra PyTorch y contra
    Hugging Face `transformers` (GPT2Config → GPT2LMHeadModel sin descargar pesos), si está instalado.
Licencia de los datos y pesos: se generan aquí mismo; no hay corpus de terceros.
"""
import json, math, pathlib, sys
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
torch.set_num_threads(4)

HERE = pathlib.Path(__file__).parent
D, H, L, FF, T = 8, 2, 2, 32, 12

LANG = {
    'es': dict(det='el', nouns=['gato', 'perro', 'loro'], verbs=['bebe', 'come'], objs=['leche', 'agua', 'pescado', 'hueso', 'semillas']),
    'en': dict(det='the', nouns=['cat', 'dog', 'parrot'], verbs=['drinks', 'eats'], objs=['milk', 'water', 'fish', 'bone', 'seeds']),
}
# GRAMMAR[(sujeto, verbo)] = {objeto: probabilidad}; índices: sujetos 0 gato/cat, 1 perro/dog, 2 loro/parrot;
# verbos 0 bebe/drinks, 1 come/eats; objetos 0 leche, 1 agua, 2 pescado, 3 hueso, 4 semillas.
GRAMMAR = {
    (0, 0): {0: .70, 1: .30}, (0, 1): {2: .90, 3: .10},
    (1, 0): {1: .80, 0: .20}, (1, 1): {3: .70, 2: .30},
    (2, 0): {1: .90, 0: .10}, (2, 1): {4: .85, 2: .15},
}
SUBJ_P = [1 / 3, 1 / 3, 1 / 3]
VERB_P = [.5, .5]


def vocab_of(lg):
    c = LANG[lg]
    return ['.', c['det']] + c['nouns'] + c['verbs'] + c['objs']


def sample_sentence(rng, ids):
    s = rng.choice(3, p=SUBJ_P); v = rng.choice(2, p=VERB_P)
    objs = GRAMMAR[(s, v)]; o = rng.choice(list(objs.keys()), p=list(objs.values()))
    return [ids['det'], ids['nouns'][s], ids['verbs'][v], ids['objs'][o], ids['.']]


def index_map(lg):
    V = vocab_of(lg); c = LANG[lg]
    ix = {w: i for i, w in enumerate(V)}
    return V, dict(det=ix[c['det']], nouns=[ix[w] for w in c['nouns']], verbs=[ix[w] for w in c['verbs']], objs=[ix[w] for w in c['objs']], **{'.': ix['.']})


# Probabilidades acumuladas del objeto para cada (sujeto, verbo): CUM[s, v, o]
CUM = np.zeros((3, 2, 5))
for (_s, _v), _d in GRAMMAR.items():
    for _o, _p in _d.items(): CUM[_s, _v, _o] = _p
CUM = CUM.cumsum(-1)


def batch(rng, ids, n):
    """n secuencias de T+1 palabras: 3 frases «el SUJETO VERBO OBJETO .» seguidas, muestreadas de GRAMMAR (vectorizado)."""
    s = rng.integers(0, 3, (n, 3)); v = rng.integers(0, 2, (n, 3)); u = rng.random((n, 3))
    o = np.minimum((u[..., None] > CUM[s, v]).sum(-1), 4)
    nouns = np.array(ids['nouns']); verbs = np.array(ids['verbs']); objs = np.array(ids['objs'])
    sent = np.stack([np.full((n, 3), ids['det']), nouns[s], verbs[v], objs[o], np.full((n, 3), ids['.'])], -1)   # (n, 3, 5)
    return torch.from_numpy(sent.reshape(n, 15)[:, :T + 1].astype(np.int64))


def sinusoid(T_, d):
    pe = np.zeros((T_, d))
    for pos in range(T_):
        for i in range(d // 2):
            a = pos / (10000 ** (2 * i / d)); pe[pos, 2 * i] = math.sin(a); pe[pos, 2 * i + 1] = math.cos(a)
    return torch.tensor(pe, dtype=torch.float32)


def gelu(x): return 0.5 * x * (1 + torch.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * x ** 3)))


class Block(nn.Module):
    def __init__(s):
        super().__init__()
        s.ln1 = nn.LayerNorm(D); s.ln2 = nn.LayerNorm(D)
        s.q = nn.Linear(D, D); s.k = nn.Linear(D, D); s.v = nn.Linear(D, D); s.o = nn.Linear(D, D)
        s.f1 = nn.Linear(D, FF); s.f2 = nn.Linear(FF, D)

    def forward(s, x, mask=True, trace=None):
        B, Tn, _ = x.shape; dh = D // H
        h = s.ln1(x)
        q = s.q(h).view(B, Tn, H, dh).transpose(1, 2); k = s.k(h).view(B, Tn, H, dh).transpose(1, 2); v = s.v(h).view(B, Tn, H, dh).transpose(1, 2)
        sc = q @ k.transpose(-1, -2) / math.sqrt(dh)
        if mask: sc = sc.masked_fill(torch.triu(torch.ones(Tn, Tn, dtype=torch.bool), 1), float('-inf'))
        a = sc.softmax(-1)
        if trace is not None: trace.append(a.detach())
        x = x + s.o((a @ v).transpose(1, 2).reshape(B, Tn, D))
        return x + s.f2(gelu(s.f1(s.ln2(x))))


class Tiny(nn.Module):
    def __init__(s, V):
        super().__init__()
        s.E = nn.Embedding(V, D); s.blocks = nn.ModuleList([Block() for _ in range(L)]); s.lnf = nn.LayerNorm(D)
        s.register_buffer('pe', sinusoid(T, D))
        nn.init.normal_(s.E.weight, std=0.5)

    def forward(s, ids, mask=True, trace=None):
        x = s.E(ids) + s.pe[:ids.shape[1]]
        for b in s.blocks: x = b(x, mask, trace)
        return s.lnf(x) @ s.E.weight.T


def train(lg, steps=4000, mask=True):
    torch.manual_seed(0)
    V, ids = index_map(lg); rng = np.random.default_rng(0)
    m = Tiny(len(V)); opt = torch.optim.AdamW(m.parameters(), lr=3e-3, weight_decay=0.0)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3, total_steps=steps, pct_start=0.1)
    curve = []   # pérdida de entrenamiento (nats por palabra), cada 50 pasos: promedio de los últimos 50
    acc = 0.0
    for st in range(steps):
        b = batch(rng, ids, 256); loss = F.cross_entropy(m(b[:, :-1], mask=mask).reshape(-1, len(V)), b[:, 1:].reshape(-1))
        opt.zero_grad(); loss.backward(); opt.step(); sched.step()
        acc += loss.item()
        if (st + 1) % 50 == 0: curve.append(round(acc / 50, 3)); acc = 0.0
        if st % 1000 == 0 or st == steps - 1: print(lg, 'mask' if mask else 'SIN máscara', st, round(loss.item(), 4))
    return m, V, ids, curve


def floor_nats():
    """Entropía condicional media (nats) de las 12 palabras que se predicen en una secuencia de entrenamiento."""
    H = lambda p: -sum(q * math.log(q) for q in p if q > 0)
    h_obj = np.mean([H(list(GRAMMAR[(s, v)].values())) for s in range(3) for v in range(2)])
    # objetivos (tokens 1..12): sujeto×3, verbo×3, objeto×2, «.»×2, «el»×2  (las dos últimas son deterministas)
    return (3 * math.log(3) + 3 * math.log(2) + 2 * h_obj) / 12


def true_dist(ids, sidx, vidx, nv):
    p = np.zeros(nv)
    for o, pr in GRAMMAR[(sidx, vidx)].items(): p[ids['objs'][o]] = pr
    return p


def flat(t): return [round(float(x), 4) for x in t.detach().reshape(-1).tolist()]


def export(m, lg, V, ids):
    sd = {k: v for k, v in m.state_dict().items()}
    blocks = []
    for i in range(L):
        g = lambda n: sd[f'blocks.{i}.{n}']
        blocks.append(dict(ln1g=flat(g('ln1.weight')), ln1b=flat(g('ln1.bias')), ln2g=flat(g('ln2.weight')), ln2b=flat(g('ln2.bias')),
                           wq=flat(g('q.weight').T), bq=flat(g('q.bias')), wk=flat(g('k.weight').T), bk=flat(g('k.bias')),
                           wv=flat(g('v.weight').T), bv=flat(g('v.bias')), wo=flat(g('o.weight').T), bo=flat(g('o.bias')),
                           w1=flat(g('f1.weight').T), b1=flat(g('f1.bias')), w2=flat(g('f2.weight').T), b2=flat(g('f2.bias'))))
    return dict(vocab=V, E=flat(sd['E.weight']), lnfg=flat(sd['lnf.weight']), lnfb=flat(sd['lnf.bias']), blocks=blocks)


def round_model(m):
    with torch.no_grad():
        for p in m.parameters(): p.copy_(torch.round(p * 1e4) / 1e4)


def attn_of(m, words, V, mask):
    idx = torch.tensor([[V.index(w) for w in words]]); tr = []
    lo = m(idx, mask=mask, trace=tr)[0]
    return lo, [[[[round(float(x), 5) for x in row] for row in hd] for hd in a[0]] for a in tr]


def main():
    out = {}; refs = {}; exp = {}
    fl = floor_nats(); print('cota inferior de la pérdida (entropía condicional media de la gramática):', round(fl, 4), 'nats')
    for lg in ('es', 'en'):
        m, V, ids, curve = train(lg)
        round_model(m); m.eval()
        mu, _, _, curve_u = train(lg, mask=False); round_model(mu); mu.eval()
        # calidad: distancia a la distribución verdadera en los 6 contextos «el SUJETO VERBO»
        worst = 0
        for s in range(3):
            for v in range(2):
                x = torch.tensor([[ids['det'], ids['nouns'][s], ids['verbs'][v]]])
                p = m(x)[0, -1].softmax(-1).detach().numpy(); q = true_dist(ids, s, v, len(V))
                kl = float(np.sum(q[q > 0] * np.log(q[q > 0] / p[q > 0]))); worst = max(worst, kl)
        print(lg, 'peor KL(verdadera || modelo) en los 6 contextos:', round(worst, 4))
        npar = sum(p.numel() for p in m.parameters()); print(lg, 'parámetros:', npar)
        out[lg] = export(m, lg, V, ids)
        # referencias para verify-forward.mts
        prompts = {'es': [['el', 'gato', 'bebe'], ['el', 'perro', 'come'], ['el', 'loro', 'come'], ['el', 'gato', 'come', 'pescado', '.']],
                   'en': [['the', 'cat', 'drinks'], ['the', 'dog', 'eats'], ['the', 'parrot', 'eats'], ['the', 'cat', 'eats', 'fish', '.']]}[lg]
        r = []
        for pr in prompts:
            lo, at = attn_of(m, pr, V, True)
            r.append(dict(words=pr, logits=[[round(float(x), 5) for x in row] for row in lo.detach()], attn=at))
        refs[lg] = r
        # experimento de la máscara: curvas de pérdida y atención del modelo entrenado SIN máscara (frase de 5 palabras)
        _, at_u = attn_of(mu, prompts[3], V, False)
        # pérdida de validación (frases nuevas, semilla distinta) de cada modelo, SIN trampa: con máscara en ambos
        rv = np.random.default_rng(123); bv = batch(rv, ids, 4096)
        with torch.no_grad():
            lv_m = F.cross_entropy(m(bv[:, :-1]).reshape(-1, len(V)), bv[:, 1:].reshape(-1)).item()
            lv_u = F.cross_entropy(mu(bv[:, :-1], mask=True).reshape(-1, len(V)), bv[:, 1:].reshape(-1)).item()
            lv_u_nomask = F.cross_entropy(mu(bv[:, :-1], mask=False).reshape(-1, len(V)), bv[:, 1:].reshape(-1)).item()
        print(lg, f'pérdida en frases nuevas: con máscara={lv_m:.3f}  | modelo sin máscara usado SIN trampa (con máscara)={lv_u:.3f}  | usado con trampa={lv_u_nomask:.3f}')
        exp[lg] = dict(masked=curve, unmasked=curve_u, valMasked=round(lv_m, 3), valUnmaskedHonest=round(lv_u, 3), valUnmaskedCheat=round(lv_u_nomask, 3), attnU=at_u)
    ts = ("// GENERADO por train_tiny.py (no editar a mano). Transformer diminuto entrenado de verdad; ver ese archivo para el método.\n"
          "export interface TinyBlockW { ln1g: number[]; ln1b: number[]; ln2g: number[]; ln2b: number[]; wq: number[]; bq: number[]; wk: number[]; bk: number[]; wv: number[]; bv: number[]; wo: number[]; bo: number[]; w1: number[]; b1: number[]; w2: number[]; b2: number[] }\n"
          "export interface TinyWeights { vocab: string[]; E: number[]; lnfg: number[]; lnfb: number[]; blocks: TinyBlockW[] }\n"
          f"export const TINY_CFG = {{ d: {D}, heads: {H}, layers: {L}, ff: {FF}, ctx: {T} }};\n"
          f"export const TINY: Record<'es' | 'en', TinyWeights> = {json.dumps(out, ensure_ascii=False, separators=(',', ':'))};\n"
          f"export const TINY_REF: Record<'es' | 'en', {{ words: string[]; logits: number[][]; attn: number[][][][] }}[]> = {json.dumps(refs, ensure_ascii=False, separators=(',', ':'))};\n"
          f"export const MASK_FLOOR = {round(fl, 4)};   // nats por palabra: entropía condicional media de la gramática (cota inferior con máscara)\n"
          f"export const MASK_EXP: Record<'es' | 'en', {{ masked: number[]; unmasked: number[]; valMasked: number; valUnmaskedHonest: number; valUnmaskedCheat: number; attnU: number[][][][] }}> = {json.dumps(exp, ensure_ascii=False, separators=(',', ':'))};\n")
    (HERE / 'weights.ts').write_text(ts)
    print('escrito weights.ts', len(ts), 'bytes')
    verify_formula()


# ───────────────────────── verificación de la fórmula de parámetros ─────────────────────────
def formula(d, L_, V, ctx=1024, ff=None, tied=True):
    ff = ff or 4 * d
    emb = V * d; pos = ctx * d
    attn = L_ * (4 * d * d + 4 * d); mlp = L_ * (2 * d * ff + ff + d); norms = L_ * 4 * d + 2 * d
    out = 0 if tied else V * d
    return emb + pos + attn + mlp + norms + out


def verify_formula():
    print('\n── verificación de la fórmula (embeddings V·d + posiciones ctx·d + L·(4d²+4d) + L·(8d²+5d) + (4L+2)·d) ──')
    cfgs = {'gpt2': (12, 768), 'gpt2-medium': (24, 1024), 'gpt2-large': (36, 1280), 'gpt2-xl': (48, 1600)}
    try:
        from transformers import GPT2Config, GPT2LMHeadModel
        for name, (Ln, d) in cfgs.items():
            hf = GPT2LMHeadModel(GPT2Config(n_layer=Ln, n_embd=d, n_head={768: 12, 1024: 16, 1280: 20, 1600: 25}[d], vocab_size=50257, n_positions=1024))
            n = sum(p.numel() for p in hf.parameters()); f = formula(d, Ln, 50257)
            print(f'{name:12s} HF={n:>13,}  fórmula={f:>13,}  {"OK" if n == f else "DIFIERE"}  12·L·d²={12 * Ln * d * d:,}')
    except Exception as e:
        print('transformers no disponible:', e)
    for name, (Ln, d, V, ctx) in {'GPT-3 175B': (96, 12288, 50257, 2048)}.items():
        f = formula(d, Ln, V, ctx); print(f'{name}: fórmula={f:,}  12·L·d²={12 * Ln * d * d:,}  (artículo: 175.0B)')
    # el propio juguete
    print('juguete d=8, L=2, V=12, ctx=0 (sinusoidal), FF=32, tied:', formula(8, 2, 12, ctx=0, ff=32), '(PyTorch cuenta lo mismo si no hay posiciones aprendidas)')


if __name__ == '__main__':
    main()
