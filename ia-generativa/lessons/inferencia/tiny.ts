// Un transformer de juguete REAL (solo decodificador, 2 capas, 2 cabezas, d = 16) con caché KV, para comprobar dos cosas:
//   1) que reutilizar la caché da exactamente los mismos resultados que recalcularlo todo en cada paso, y
//   2) cuánto trabajo se ahorra: se cuenta cada token que atraviesa el modelo y cada multiplicación-suma realizada.
// Los pesos son aleatorios (semilla fija): NO sirve para escribir texto, solo para medir. Todo es determinista.
//
// Receta (la misma que la versión en Python de «Por dentro»):
//   x = embedding(token) + posición sinusoidal
//   por capa:  x += Atención(LN(x))   ;   x += MLP(LN(x))            (LN = normalización de capa, MLP = 2 capas con ReLU)
//   Atención de un token en la posición p: q, k, v = x·Wq, x·Wk, x·Wv; se añade (k, v) a la caché de la capa;
//   puntuaciones = q·k_i/√dh para i ≤ p (máscara causal); softmax; salida = Σ peso_i · v_i; luego Wo.
//   logits = LN(x_final)·Eᵀ
//   SIN caché: para generar cada token se vacía la caché y se procesan de nuevo todas las posiciones.
//   CON caché: la caché persiste; cada paso procesa solo la posición nueva.
import { rng, gauss } from '../../../../../core/scene/math';

const D = 16, H = 2, DH = D / H, FF = 32, NL = 2;
type Vec = number[];
interface Layer { wq: Vec[]; wk: Vec[]; wv: Vec[]; wo: Vec[]; w1: Vec[]; w2: Vec[] }
export interface Tiny { vocab: number; emb: Vec[]; layers: Layer[] }
export interface Cache { k: Vec[][]; v: Vec[][] }          // [capa][posición] → vector de d
export interface Counter { passes: number; macs: number }

const mat = (r: () => number, n: number, m: number, s: number): Vec[] => Array.from({ length: n }, () => Array.from({ length: m }, () => gauss(r) * s));

export function makeTiny(vocab: number, seed = 7): Tiny {
  const r = rng(seed);
  return {
    vocab, emb: mat(r, vocab, D, 0.5),
    layers: Array.from({ length: NL }, () => ({ wq: mat(r, D, D, 0.25), wk: mat(r, D, D, 0.25), wv: mat(r, D, D, 0.25), wo: mat(r, D, D, 0.25), w1: mat(r, D, FF, 0.25), w2: mat(r, FF, D, 0.18) })),
  };
}
export const newCache = (): Cache => ({ k: Array.from({ length: NL }, () => []), v: Array.from({ length: NL }, () => []) });

const vm = (x: Vec, w: Vec[], c: Counter): Vec => { const out = new Array(w[0].length).fill(0); for (let i = 0; i < x.length; i++) for (let j = 0; j < out.length; j++) out[j] += x[i] * w[i][j]; c.macs += x.length * out.length; return out; };
const ln = (x: Vec): Vec => { const m = x.reduce((a, b) => a + b, 0) / x.length, v = x.reduce((a, b) => a + (b - m) ** 2, 0) / x.length; return x.map((a) => (a - m) / Math.sqrt(v + 1e-5)); };
const pos = (p: number): Vec => Array.from({ length: D }, (_, i) => (i % 2 === 0 ? Math.sin(p / 10000 ** (i / D)) : Math.cos(p / 10000 ** ((i - 1) / D))));

/** Procesa UN token en la posición `p`, usando y ampliando la caché. Devuelve los logits de la siguiente pieza. */
export function step(m: Tiny, cache: Cache, token: number, p: number, c: Counter): Vec {
  c.passes++;
  let x = m.emb[token].map((a, i) => a + pos(p)[i]);
  m.layers.forEach((L, li) => {
    const h = ln(x), q = vm(h, L.wq, c), k = vm(h, L.wk, c), v = vm(h, L.wv, c);
    cache.k[li][p] = k; cache.v[li][p] = v;                             // lo único «nuevo» que entra a la caché
    const att = new Array(D).fill(0);
    for (let hd = 0; hd < H; hd++) {
      const o = hd * DH, sc: number[] = [];
      for (let i = 0; i <= p; i++) { let s = 0; for (let j = 0; j < DH; j++) s += q[o + j] * cache.k[li][i][o + j]; sc.push(s / Math.sqrt(DH)); c.macs += DH; }
      const mx = Math.max(...sc), e = sc.map((s) => Math.exp(s - mx)), tot = e.reduce((a, b) => a + b, 0);
      for (let i = 0; i <= p; i++) for (let j = 0; j < DH; j++) att[o + j] += (e[i] / tot) * cache.v[li][i][o + j];
      c.macs += (p + 1) * DH;
    }
    const a = vm(att, L.wo, c); x = x.map((t, i) => t + a[i]);
    const f = vm(vm(ln(x), L.w1, c).map((t) => Math.max(0, t)), L.w2, c); x = x.map((t, i) => t + f[i]);
  });
  const xf = ln(x), logits = m.emb.map((e) => { let s = 0; for (let i = 0; i < D; i++) s += xf[i] * e[i]; return s; });
  c.macs += m.vocab * D;
  return logits;
}

export interface Demo {
  P: number; G: number;
  /** Posiciones procesadas en cada paso (fila = paso de generación). */
  rowsNoCache: number[]; rowsCache: number[];
  passesNoCache: number; passesCache: number; macsNoCache: number; macsCache: number;
  /** Mayor diferencia absoluta entre los logits de ambos caminos, en todos los pasos. */
  maxDiff: number;
}
/** `ids` = prompt (P) + respuesta (G). El paso j produce la pieza j de la respuesta con los logits de la posición P+j−2. */
export function runDemo(ids: number[], P: number, vocab: number): Demo {
  const G = ids.length - P, m = makeTiny(vocab);
  const cNo: Counter = { passes: 0, macs: 0 }, cYes: Counter = { passes: 0, macs: 0 };
  const rowsNoCache: number[] = [], rowsCache: number[] = [];
  const cache = newCache();
  let maxDiff = 0;
  // con caché: se alimenta la secuencia de una vez, token por token
  const lg: Vec[] = [];
  for (let p = 0; p < ids.length - 1; p++) lg.push(step(m, cache, ids[p], p, cYes));
  for (let j = 1; j <= G; j++) {
    rowsCache.push(j === 1 ? P : 1);
    // sin caché: caché vacía y todas las posiciones otra vez
    const fresh = newCache(); let last: Vec = [];
    for (let p = 0; p < P + j - 1; p++) last = step(m, fresh, ids[p], p, cNo);
    rowsNoCache.push(P + j - 1);
    const ref = lg[P + j - 2];
    for (let i = 0; i < ref.length; i++) maxDiff = Math.max(maxDiff, Math.abs(ref[i] - last[i]));
  }
  return { P, G, rowsNoCache, rowsCache, passesNoCache: cNo.passes, passesCache: cYes.passes, macsNoCache: cNo.macs, macsCache: cYes.macs, maxDiff };
}
