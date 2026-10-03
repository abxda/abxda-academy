// Matemática REAL de la lección «Secuencias y memoria» (a pequeña escala, con semilla fija; nada es una animación inventada).
//
// 1) RNN diminuta (Elman, 1990):  h_t = tanh( Wx·x_t + Wh·h_{t-1} ),  h_0 = 0
//      · estado oculto de H = 6 números; cada palabra es un vector de D = 4 números asignado AL AZAR (con semilla): no hay lenguaje
//        aprendido, solo la mecánica de arrastrar un estado.
//      · Wx: matriz H×D con entradas N(0, WXS²).   Wh = g · Q, con Q ortogonal (Gram–Schmidt sobre una matriz gaussiana con semilla):
//        todos sus valores singulares valen g, así que g es «la magnitud de los pesos recurrentes» y, sin tanh, cada paso multiplicaría
//        la longitud del estado exactamente por g.
//      · Medida de influencia: se cambia UNA palabra (la k-ésima) por otra y se mide cuánto cambia el estado final h_T
//          influencia(k→T) = ‖Δh_T‖ / ‖Δh_k‖      (fracción del cambio inmediato que sobrevive hasta el final),
//        promediada en cuadrados (raíz de la media) sobre NS = 16 frases de juguete para que la curva no dependa de una frase concreta.
//        Es la versión «experimental» de ‖∂h_T/∂h_k‖, el producto de jacobianos que multiplica la retropropagación (ver «Por dentro»).
//
// 2) Celda LSTM de juguete (Hochreiter y Schmidhuber, 1997; compuerta de olvido: Gers, Schmidhuber y Cummins, 2000), con UNA celda
//    escalar y compuertas fijadas a mano en lugar de calculadas por la red, para ver qué hace cada una:
//      c_t = f·c_{t-1} + i·tanh(x_t),    h_t = o·tanh(c_t)
//    En el paso 1 la celda está vacía (c_0 = 0) y el dato entra con la compuerta de entrada de «escritura».
//
// Reproducible: todo sale de rng(semilla) del kit; mismos números en cada carga. Los valores de entrada del juguete LSTM son ilustrativos.
import { gauss, rng } from '../../../../../core/scene/math';

export const H = 6, D = 4, NS = 16, WXS = 0.35, SEED = 1, TMAX = 30;
/** Magnitud de los pesos recurrentes por defecto (el estado del control en la lección). */
export const G_DEFAULT = 0.9;
export const G_MIN = 0.3, G_MAX = 2.8;

// ═════════ RNN ═════════
function orthogonal(seed: number, n: number): number[][] {
  const r = rng(seed), M = Array.from({ length: n }, () => Array.from({ length: n }, () => gauss(r))), Q: number[][] = [];
  for (const v of M) {
    const w = v.slice();
    for (const q of Q) { const dot = q.reduce((s, x, i) => s + x * w[i], 0); for (let i = 0; i < n; i++) w[i] -= dot * q[i]; }
    const nr = Math.hypot(...w); Q.push(w.map((x) => x / nr));
  }
  return Q;
}
const Q = orthogonal(SEED, H);
const rW = rng(SEED + 1);
const WX = Array.from({ length: H }, () => Array.from({ length: D }, () => gauss(rW) * WXS));

/** Vector de la palabra en la posición k de la frase s (alt = 1: la palabra de reemplazo). */
export const wordVec = (s: number, k: number, alt = 0): number[] => { const r = rng(1000 + s * 9973 + k * 7 + alt * 131 + SEED); return Array.from({ length: D }, () => gauss(r)); };

export function rnnStep(g: number, h: number[], x: number[]): number[] {
  return Array.from({ length: H }, (_, i) => {
    let s = 0;
    for (let j = 0; j < H; j++) s += g * Q[i][j] * h[j];
    for (let j = 0; j < D; j++) s += WX[i][j] * x[j];
    return Math.tanh(s);
  });
}
/** Estados h_0..h_T al leer xs (h_0 = 0). */
export function rnnStates(g: number, xs: number[][]): number[][] {
  let h: number[] = new Array(H).fill(0); const out = [h];
  for (const x of xs) { h = rnnStep(g, h, x); out.push(h); }
  return out;
}
const sq = (a: number[], b: number[]) => a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0);

export interface Curve {
  /** c[T]: fracción del cambio de la PRIMERA palabra que sobrevive en el estado tras leer T palabras (c[1] = 1). */
  c: number[];
  /** Fracción de unidades con |h| > 0,9, promediada sobre todos los pasos y frases. */
  sat: number;
  /** Cuánto se conserva por paso en los primeros 10 pasos: c[10]^(1/9). */
  factor: number;
}
const curveCache = new Map<number, Curve>();
export function curveFor(g: number): Curve {
  const key = Math.round(g * 1000);
  const hit = curveCache.get(key); if (hit) return hit;
  const num = new Array(TMAX + 1).fill(0); let den = 0, sat = 0, cnt = 0;
  for (let s = 0; s < NS; s++) {
    const xs = Array.from({ length: TMAX }, (_, k) => wordVec(s, k)), base = rnnStates(g, xs);
    const xs2 = xs.slice(); xs2[0] = wordVec(s, 0, 1);
    const sw = rnnStates(g, xs2);
    den += sq(sw[1], base[1]);
    for (let t = 1; t <= TMAX; t++) { num[t] += sq(sw[t], base[t]); for (const v of base[t]) { sat += Math.abs(v) > 0.9 ? 1 : 0; cnt++; } }
  }
  const c = num.map((n) => Math.sqrt(n / den)); c[0] = 1;
  const res = { c, sat: sat / cnt, factor: Math.pow(Math.max(c[10], 1e-12), 1 / 9) };
  curveCache.set(key, res); return res;
}

const stripCache = new Map<string, number[]>();
/** strip[k]: influencia de la palabra k (0-based) sobre el estado tras leer T palabras (la última vale 1). */
export function stripFor(g: number, T: number): number[] {
  const key = `${Math.round(g * 1000)}|${T}`;
  const hit = stripCache.get(key); if (hit) return hit;
  const num = new Array(T).fill(0), den = new Array(T).fill(0);
  for (let s = 0; s < NS; s++) {
    const xs = Array.from({ length: T }, (_, k) => wordVec(s, k)), base = rnnStates(g, xs);
    for (let k = 0; k < T; k++) {
      const xs2 = xs.slice(); xs2[k] = wordVec(s, k, 1);
      const sw = rnnStates(g, xs2);
      num[k] += sq(sw[T], base[T]); den[k] += sq(sw[k + 1], base[k + 1]);
    }
  }
  const res = num.map((n, k) => Math.sqrt(n / den[k]));
  if (stripCache.size > 80) stripCache.clear();
  stripCache.set(key, res); return res;
}

/** Frase concreta del ejemplo (10 palabras); la 1.ª cambia entre «flores» (A) y «flor» (B). */
export const SENT_SEED = 100;
export interface AB { A: number[][]; B: number[][]; delta: number[] }
const abCache = new Map<number, AB>();
export function abRun(g: number): AB {
  const key = Math.round(g * 1000), hit = abCache.get(key); if (hit) return hit;
  const xs = Array.from({ length: 10 }, (_, k) => wordVec(SENT_SEED, k)), xs2 = xs.slice(); xs2[0] = wordVec(SENT_SEED, 0, 1);
  const A = rnnStates(g, xs), B = rnnStates(g, xs2);
  const res = { A, B, delta: A.map((a, t) => Math.sqrt(sq(a, B[t]))) };
  abCache.set(key, res); return res;
}
/** Estados de la frase concreta (para dibujar el recorrido de la red). */
export const sentenceStates = (g: number, n = 10) => rnnStates(g, Array.from({ length: n }, (_, k) => wordVec(SENT_SEED, k))).slice(0, n + 1);

// ═════════ LSTM de juguete ═════════
export const STEPS = 10;
/** Valor que cada palabra aporta al juguete (ilustrativo). La 1.ª es el dato («plural»); las otras nueve son distracciones. */
export const X_DATUM = 1.2;
const HAND = [-0.8, 0.5, -1.1, 0.3, -0.7, 0.9, -0.6, -0.9, 0.4];
export const distractors = (set: number): number[] => {
  if (set % 4 === 0) return HAND.slice();
  const r = rng(7000 + set * 31); return HAND.map(() => Math.max(-1.3, Math.min(1.3, gauss(r) * 0.8)));
};
export interface LstmGates { f: number; i: number; iw: number; o: number }
export interface LstmRun { x: number[]; cand: number[]; c: number[]; h: number[]; read: number; ref: number; ratio: number; verdict: 'ok' | 'half' | 'none' | 'wrong' }
export function lstmRun(gt: LstmGates, set: number): LstmRun {
  const x = [X_DATUM, ...distractors(set)], cand = x.map(Math.tanh), c: number[] = [], h: number[] = [];
  let prev = 0;
  for (let t = 0; t < STEPS; t++) {
    prev = t === 0 ? gt.iw * cand[0] : gt.f * prev + gt.i * cand[t];
    c.push(prev); h.push(gt.o * Math.tanh(prev));
  }
  const ref = Math.tanh(Math.tanh(X_DATUM)), read = h[STEPS - 1], ratio = read / ref;
  const verdict = ratio >= 0.7 ? 'ok' : ratio > 0.25 ? 'half' : ratio > -0.1 ? 'none' : 'wrong';
  return { x, cand, c, h, read, ref, ratio, verdict };
}
