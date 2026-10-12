// El modelo de texto a imagen diminuto, ejecutado en el navegador con los pesos que escribió train_toy.py (model.ts).
// Mismo cálculo que en PyTorch: codificador de texto de CLIP (lee el orden), codificador «bolsa de palabras», red de
// difusión latente condicionada con guiado sin clasificador, y decodificador del VAE. Nada se simula: verify-model.ts
// compara estas funciones con los valores de referencia que calculó train_toy.py (REF) con los mismos pesos cuantizados.
// Además, un «lector» de reglas fijas (no aprendido) que mira una imagen de 12 × 12 y dice qué forma, color y fondo tiene:
// sirve para contar cuántas imágenes generadas cumplen lo pedido.
import { gauss, rng } from '../../../../../theme/kit';
import { MODEL, type Q } from './model';

export const N = 12, K = 5;
export const T: number = MODEL.T, Z: number = MODEL.Z, D: number = MODEL.D, L: number = MODEL.L;
export const VOCAB: string[] = MODEL.vocab;
const TOK = new Map(VOCAB.map((w, i) => [w, i] as const));

// ── pesos: int8 por fila (base64) × escala de la fila ──
function deq(m: Q): Float64Array {
  const bin = atob(m.q), out = new Float64Array(m.r * m.c);
  for (let i = 0; i < out.length; i++) { const b = bin.charCodeAt(i); out[i] = (b > 127 ? b - 256 : b) * m.sc[Math.floor(i / m.c)]; }
  return out;
}
const F = (v: number[]) => Float64Array.from(v);
const te = { E: deq(MODEL.te.E), P: deq(MODEL.te.P), l1w: deq(MODEL.te.l1w), l1b: F(MODEL.te.l1b), l2w: deq(MODEL.te.l2w), l2b: F(MODEL.te.l2b) };
const bag = { E: deq(MODEL.bag.E), l1w: deq(MODEL.bag.l1w), l1b: F(MODEL.bag.l1b), l2w: deq(MODEL.bag.l2w), l2b: F(MODEL.bag.l2b) };
const dec = { d1w: deq(MODEL.dec.d1w), d1b: F(MODEL.dec.d1b), d2w: deq(MODEL.dec.d2w), d2b: F(MODEL.dec.d2b) };
const den = { l1w: deq(MODEL.den.l1w), l1b: F(MODEL.den.l1b), l2w: deq(MODEL.den.l2w), l2b: F(MODEL.den.l2b), l3w: deq(MODEL.den.l3w), l3b: F(MODEL.den.l3b), ow: deq(MODEL.den.ow), ob: F(MODEL.den.ob) };
const E_DIM = 16, H_TXT = 64, H_DEC = 64, H_DEN = 192, IN_DEN = Z + 8 + D;

const silu = (x: number) => x / (1 + Math.exp(-x));
/** y = W x + b (W de r × c, por filas), con activación opcional. */
function dense(W: Float64Array, b: Float64Array, x: ArrayLike<number>, r: number, c: number, act = false, out = new Float64Array(r)) {
  for (let o = 0; o < r; o++) { let s = b[o]; const off = o * c; for (let i = 0; i < c; i++) s += W[off + i] * x[i]; out[o] = act ? silu(s) : s; }
  return out;
}
const normalize = (v: Float64Array) => { let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1; return v.map((x) => x / n); };

// ── frases ──
/** Palabras de una frase → ids (las desconocidas se descartan: para el modelo no existen), con relleno hasta L. */
export function tokens(text: string): { ids: number[]; unknown: string[] } {
  const ids: number[] = [], unknown: string[] = [];
  for (const w of text.toLowerCase().split(/\s+/).filter(Boolean)) { const id = TOK.get(w); if (id && id > 0) ids.push(id); else unknown.push(w); }
  const out = ids.slice(0, L); while (out.length < L) out.push(0);
  return { ids: out, unknown };
}

/** Codificador de texto de CLIP: cada palabra con su posición (lee el orden) → vector unitario de 32 números. */
export function encodeText(ids: number[]): Float64Array {
  const x = new Float64Array(L * E_DIM);
  for (let p = 0; p < L; p++) for (let j = 0; j < E_DIM; j++) x[p * E_DIM + j] = te.E[ids[p] * E_DIM + j] + te.P[p * E_DIM + j];
  return normalize(dense(te.l2w, te.l2b, dense(te.l1w, te.l1b, x, H_TXT, L * E_DIM, true), D, H_TXT));
}
/** Codificador «bolsa de palabras»: suma las palabras sin mirar su orden. */
export function encodeBag(ids: number[]): Float64Array {
  const x = new Float64Array(E_DIM);
  for (const id of ids) if (id > 0) for (let j = 0; j < E_DIM; j++) x[j] += bag.E[id * E_DIM + j];
  return normalize(dense(bag.l2w, bag.l2b, dense(bag.l1w, bag.l1b, x, H_TXT, E_DIM, true), D, H_TXT));
}
export const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
/** Vector de la frase vacía (todo relleno): la «frase borrada» del guiado sin clasificador. */
export const NULL_C = encodeText(new Array(L).fill(0));

// ── decodificador del VAE: 16 números → probabilidad de cada color en cada píxel ──
const hd = new Float64Array(H_DEC), lo = new Float64Array(N * N * K);
export function decode(z: ArrayLike<number>): Float32Array {
  const zz = new Float64Array(Z); for (let i = 0; i < Z; i++) zz[i] = z[i] * MODEL.zscale;
  dense(dec.d1w, dec.d1b, zz, H_DEC, Z, true, hd); dense(dec.d2w, dec.d2b, hd, N * N * K, H_DEC, false, lo);
  const out = new Float32Array(N * N * K);
  for (let p = 0; p < N * N; p++) {
    let m = -Infinity; for (let k = 0; k < K; k++) m = Math.max(m, lo[p * K + k]);
    let s = 0; for (let k = 0; k < K; k++) { const e = Math.exp(lo[p * K + k] - m); out[p * K + k] = e; s += e; }
    for (let k = 0; k < K; k++) out[p * K + k] /= s;
  }
  return out;
}
/** Color más probable de cada píxel (la imagen final). */
export function argmax(probs: Float32Array): Uint8Array {
  const g = new Uint8Array(N * N);
  for (let p = 0; p < N * N; p++) { let b = 0; for (let k = 1; k < K; k++) if (probs[p * K + k] > probs[p * K + b]) b = k; g[p] = b; }
  return g;
}

// ── red de difusión: predice el ruido de z_t en el paso t, dada la frase c ──
const xin = new Float64Array(IN_DEN), h1 = new Float64Array(H_DEN), h2 = new Float64Array(H_DEN), h3 = new Float64Array(H_DEN);
const FREQ = [1, 2, 4, 8].map((f) => f * Math.PI);
export function eps(z: ArrayLike<number>, t: number, c: ArrayLike<number>, out = new Float64Array(Z)) {
  for (let i = 0; i < Z; i++) xin[i] = z[i];
  for (let k = 0; k < 4; k++) { xin[Z + k] = Math.sin((t / T) * FREQ[k]); xin[Z + 4 + k] = Math.cos((t / T) * FREQ[k]); }
  for (let i = 0; i < D; i++) xin[Z + 8 + i] = c[i];
  dense(den.l1w, den.l1b, xin, H_DEN, IN_DEN, true, h1); dense(den.l2w, den.l2b, h1, H_DEN, H_DEN, true, h2); dense(den.l3w, den.l3b, h2, H_DEN, H_DEN, true, h3);
  return dense(den.ow, den.ob, h3, Z, H_DEN, false, out);
}

export const betas = Array.from({ length: T }, (_, i) => MODEL.b0 + ((MODEL.b1 - MODEL.b0) * i) / (T - 1));
export const alphas = betas.map((b) => 1 - b);
export const abar = alphas.reduce<number[]>((a, x, i) => (a.push((a[i - 1] ?? 1) * x), a), []);

/**
 * Muestreo DDPM (σ² = β) con guiado sin clasificador, escala s al estilo de Stable Diffusion:
 * ε = ε(sin frase) + s · (ε(con frase) − ε(sin frase)). s = 0 ignora la frase; s = 1 es la red condicionada tal cual.
 * Devuelve la trayectoria: traj[k] = latente tras k pasos (k = 0: ruido puro; k = T: resultado).
 */
export function sample(c: ArrayLike<number>, s: number, seed: number): Float32Array[] {
  const r = rng(seed), z = new Float64Array(Z), ec = new Float64Array(Z), eu = new Float64Array(Z), traj: Float32Array[] = [];
  for (let i = 0; i < Z; i++) z[i] = gauss(r);
  traj.push(Float32Array.from(z));
  for (let t = T - 1; t >= 0; t--) {
    eps(z, t, NULL_C, eu);
    if (s !== 0) eps(z, t, c, ec);
    const k = betas[t] / Math.sqrt(1 - abar[t]), a = 1 / Math.sqrt(alphas[t]), sd = t > 0 ? Math.sqrt(betas[t]) : 0;
    for (let i = 0; i < Z; i++) {
      const e = s === 0 ? eu[i] : eu[i] + s * (ec[i] - eu[i]);
      z[i] = a * (z[i] - k * e) + (t > 0 ? sd * gauss(r) : 0);
    }
    traj.push(Float32Array.from(z));
  }
  return traj;
}

// ── generación con memoria (determinista: misma frase, escala y semilla → misma imagen) ──
export interface Gen { traj: Float32Array[]; img: Uint8Array; read: Reading }
const cache = new Map<string, Gen>();
const vecCache = new Map<string, Float64Array>();
export function textVec(text: string): Float64Array {
  let v = vecCache.get(text);
  if (!v) { v = encodeText(tokens(text).ids); vecCache.set(text, v); }
  return v;
}
export function generate(text: string, s: number, seed: number): Gen {
  const key = `${text}|${s.toFixed(3)}|${seed}`;
  let g = cache.get(key);
  if (!g) {
    const traj = sample(textVec(text), s, seed), img = argmax(decode(traj[T]));
    g = { traj, img, read: readImage(img) };
    if (cache.size > 4000) cache.clear();
    cache.set(key, g);
  }
  return g;
}
const decCache = new Map<string, Float32Array>();
/** Imagen (probabilidades) del latente en el paso k de una trayectoria ya generada. */
export function decodeStep(text: string, s: number, seed: number, k: number): Float32Array {
  const key = `${text}|${s.toFixed(3)}|${seed}|${k}`;
  let p = decCache.get(key);
  if (!p) { p = decode(generate(text, s, seed).traj[k]); if (decCache.size > 6000) decCache.clear(); decCache.set(key, p); }
  return p;
}

// ── el mundo de juguete (misma geometría que train_toy.py) y un lector de reglas fijas ──
export const SHAPES = 4;
/** Máscara de una forma (0 círculo, 1 cuadrado, 2 triángulo, 3 cruz) con centro (cx, cy) y radio r. */
export function shapeMask(shape: number, cx: number, cy: number, r: number): Uint8Array {
  const m = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = x - cx, dy = y - cy, t = (dy + r) / (2 * r);
    const on = shape === 0 ? dx * dx + dy * dy <= r * r
      : shape === 1 ? Math.max(Math.abs(dx), Math.abs(dy)) <= r * 0.8
      : shape === 2 ? t >= 0 && t <= 1 && Math.abs(dx) <= t * r + 0.3
      : (Math.abs(dx) <= 0.6 && Math.abs(dy) <= r) || (Math.abs(dy) <= 0.6 && Math.abs(dx) <= r);
    m[y * N + x] = on ? 1 : 0;
  }
  return m;
}
/** Plantillas: cada forma en una rejilla de posiciones y tamaños del rango de entrenamiento (centro 5–6, radio 2.7–3.9). */
const TEMPLATES: { shape: number; m: Uint8Array }[] = [];
for (let s = 0; s < SHAPES; s++) for (let cx = 5; cx <= 6.001; cx += 0.25) for (let cy = 5; cy <= 6.001; cy += 0.25) for (let r = 2.7; r <= 3.901; r += 0.2) TEMPLATES.push({ shape: s, m: shapeMask(s, cx, cy, r) });

export interface Reading { shape: number; fg: number; bg: number; iou: number }
/**
 * Lector de reglas fijas (no aprendido): fondo = color más común en el borde; figura = los demás píxeles, con su color
 * más común; forma = la plantilla que mejor se superpone (intersección / unión). shape = −1 si nada se parece a una forma.
 */
export function readImage(g: ArrayLike<number>): Reading {
  const cnt = new Array(K).fill(0);
  for (let i = 0; i < N; i++) { cnt[g[i]]++; cnt[g[(N - 1) * N + i]]++; if (i > 0 && i < N - 1) { cnt[g[i * N]]++; cnt[g[i * N + N - 1]]++; } }
  const bg = cnt.indexOf(Math.max(...cnt));
  const fc = new Array(K).fill(0); let nf = 0;
  for (let p = 0; p < N * N; p++) if (g[p] !== bg) { fc[g[p]]++; nf++; }
  if (nf < 4) return { shape: -1, fg: -1, bg, iou: 0 };
  const fg = fc.indexOf(Math.max(...fc));
  let best = -1, bi = 0;
  for (const tp of TEMPLATES) {
    let inter = 0, uni = 0;
    for (let p = 0; p < N * N; p++) { const a = g[p] !== bg ? 1 : 0, b = tp.m[p]; inter += a & b; uni += a | b; }
    const iou = inter / (uni || 1);
    if (iou > bi) { bi = iou; best = tp.shape; }
  }
  return { shape: bi >= 0.6 ? best : -1, fg, bg, iou: bi };
}

// ── frases en los dos idiomas (mismo formato que train_toy.py) ──
export const ES_SHAPE = ['círculo', 'cuadrado', 'triángulo', 'cruz'], EN_SHAPE = ['circle', 'square', 'triangle', 'cross'];
export const ES_COLOR = ['cian', 'magenta', 'ámbar', 'verde', 'violeta'], EN_COLOR = ['cyan', 'magenta', 'amber', 'green', 'violet'];
/** kind: 0 completa · 1 sin fondo · 2 sin color · 3 solo la forma. */
export function caption(s: number, f: number, b: number, lang: 'es' | 'en', kind = 0): string {
  if (lang === 'es') {
    const w = { 0: [ES_SHAPE[s], ES_COLOR[f], 'sobre', 'fondo', ES_COLOR[b]], 1: [ES_SHAPE[s], ES_COLOR[f]], 2: [ES_SHAPE[s], 'sobre', 'fondo', ES_COLOR[b]], 3: [ES_SHAPE[s]] }[kind]!;
    return w.join(' ');
  }
  const w = { 0: [EN_COLOR[f], EN_SHAPE[s], 'on', EN_COLOR[b], 'background'], 1: [EN_COLOR[f], EN_SHAPE[s]], 2: [EN_SHAPE[s], 'on', EN_COLOR[b], 'background'], 3: [EN_SHAPE[s]] }[kind]!;
  return w.join(' ');
}
