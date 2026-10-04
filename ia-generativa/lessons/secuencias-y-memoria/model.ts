// Matemática REAL de la lección «Secuencias y memoria» (a pequeña escala, con semilla fija: nada es una animación inventada).
//
// 1) RNN diminuta (Elman, 1990):  h_t = tanh( Wx·x_t + Wh·h_{t-1} ),  h_0 = 0.
//      · Estado oculto de H = 6 números; cada palabra es un vector de D = 4 números asignado AL AZAR (con semilla): no hay lenguaje
//        aprendido, solo la mecánica de arrastrar un estado. Los pesos tampoco están entrenados.
//      · Wx: matriz H×D con entradas N(0, WXS²).  Wh = g·Q, con Q ortogonal (Gram–Schmidt sobre una matriz gaussiana con semilla):
//        todos sus valores singulares valen g, así que g es «la magnitud de los pesos recurrentes».
//      · Lo que se mide es el jacobiano ∂h_T/∂h_k = J_T ··· J_{k+1}, con J_t = diag(1 − h_t²)·Wh (derivada exacta de tanh).
//        Es el producto de factores que multiplica la retropropagación (lección 8) a través del tiempo. Se resume con
//            influencia(k→T) = ‖∂h_T/∂h_k‖_F / √H      (ganancia típica ante un empujón en una dirección al azar; 1 = no se pierde nada).
//        El mismo número responde dos preguntas: «si muevo un poco el estado en la palabra k, ¿cuánto se mueve el estado final?»
//        (hacia delante) y «¿cuánta culpa del error final llega hasta k?» (hacia atrás).
//      · Curva por distancia: se promedia (media geométrica, que es la frase «típica») sobre NS frases de juguete; se guardan
//        además NL frases sueltas para ver la dispersión. Se descartan BURN pasos iniciales para que el estado ya esté «en régimen».
//      · Con la escala de entrada elegida (WXS) la influencia típica decae para todo g en [0,3; 2,8], pero cada vez más despacio,
//        mientras la media (RMS) de las frases explosivas crece: por eso se muestran las frases sueltas y no solo el promedio.
//
// 2) Celda LSTM de juguete (Hochreiter y Schmidhuber, 1997; compuerta de olvido: Gers, Schmidhuber y Cummins, 2000), con UNA celda
//    escalar y compuertas fijadas a mano en lugar de calculadas por la red, para ver qué hace cada una:
//      c_t = f·c_{t-1} + i_t·tanh(v_t),    h_t = o·tanh(c_t)
//    v_t son «pistas de número gramatical» ILUSTRATIVAS de cada palabra (flores/flowers = plural, mercado/market = singular);
//    la compuerta de entrada se abre del todo con la palabra clave (una LSTM entrenada aprende a hacerlo) y vale i con las demás.
//
// Reproducible: todo sale de rng(semilla) del kit; mismos números en cada carga.
import { gauss, rng } from '../../../../../core/scene/math';

export const H = 6, D = 4, WXS = 0.35, SEED = 1;
export const TMAX = 30, NS = 48, NL = 14, BURN = 10;
/** Magnitud de los pesos recurrentes por defecto (el estado del control en la lección). */
export const G_DEFAULT = 0.9;
export const G_MIN = 0.3, G_MAX = 2.8;
/** Frase del ejemplo: 7 palabras leídas (la octava, el verbo, es lo que se predice). */
export const T = 7;
export const KEY = 2;            // «flores» (1-indexado)
export const SENT_SEED = 100;

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

/** Vector de la palabra en la posición k (0-based) de la frase s. */
export const wordVec = (s: number, k: number): number[] => { const r = rng(1000 + s * 9973 + k * 7 + SEED); return Array.from({ length: D }, () => gauss(r)); };

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
type Mat = number[][];
const ident = (): Mat => Array.from({ length: H }, (_, i) => Array.from({ length: H }, (_, j) => (i === j ? 1 : 0)));
const mm = (A: Mat, B: Mat): Mat => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
/** Jacobiano ∂h_t/∂h_{t-1} dado el estado nuevo h_t. */
const jac = (g: number, ht: number[]): Mat => ht.map((v, i) => Q[i].map((q) => (1 - v * v) * g * q));
const fro = (M: Mat) => Math.sqrt(M.reduce((s, r) => s + r.reduce((a, b) => a + b * b, 0), 0) / H);

// ── frase concreta del ejemplo ───────────────────────────────────────────────
export interface SentenceRun {
  g: number;
  /** states[t] = h_t (t = 0..T). */
  states: number[][];
  /** amp[k][t] (k, t en 1..T, t ≥ k): influencia de un empujón en h_k sobre h_t. amp[k][k] = 1. */
  amp: number[][];
  /** infl[k] = amp[k][T]: lo que sobrevive hasta el final de un empujón en la palabra k. */
  infl: number[];
}
const sentCache = new Map<number, SentenceRun>();
export function sentenceRun(g: number): SentenceRun {
  const key = Math.round(g * 1000), hit = sentCache.get(key); if (hit) return hit;
  const xs = Array.from({ length: T }, (_, k) => wordVec(SENT_SEED, k)), states = rnnStates(g, xs);
  const Js: Mat[] = [ident(), ...states.slice(1).map((h) => jac(g, h))];
  const amp: number[][] = [];
  for (let k = 1; k <= T; k++) {
    amp[k] = new Array(T + 1).fill(NaN);
    let P = ident(); amp[k][k] = 1;
    for (let t = k + 1; t <= T; t++) { P = mm(Js[t], P); amp[k][t] = fro(P); }
  }
  const infl = [NaN, ...Array.from({ length: T }, (_, i) => amp[i + 1][T])];
  const res = { g, states, amp, infl };
  if (sentCache.size > 80) sentCache.clear();
  sentCache.set(key, res); return res;
}

// ── curva por distancia (frases de juguete) ─────────────────────────────────
export interface Curve {
  /** typ[n]: influencia típica (media geométrica sobre NS frases) a n pasos de distancia (n = 0..TMAX). */
  typ: number[];
  /** lines[j][n]: frase suelta j. */
  lines: number[][];
  /** Cuantiles 10 y 90 % entre frases a 10 pasos (para describir la dispersión). */
  p10: number; p90: number;
  /** Fracción de unidades saturadas (|h| > 0,9). */
  sat: number;
  /** Factor típico por paso en los primeros diez pasos: typ[10]^(1/10). */
  factor: number;
}
const curveCache = new Map<number, Curve>();
export function curveFor(g: number): Curve {
  const key = Math.round(g * 1000), hit = curveCache.get(key); if (hit) return hit;
  const len = BURN + TMAX + 1, logs = new Array(TMAX + 1).fill(0), lines: number[][] = [], at10: number[] = [];
  let sat = 0, cnt = 0;
  for (let s = 0; s < NS; s++) {
    const xs = Array.from({ length: len }, (_, k) => wordVec(500 + s, k)), st = rnnStates(g, xs);
    for (const h of st.slice(BURN + 1)) for (const v of h) { sat += Math.abs(v) > 0.9 ? 1 : 0; cnt++; }
    let P = ident(); const line: number[] = [];
    for (let n = 0; n <= TMAX; n++) {
      const f = fro(P); line.push(f); logs[n] += Math.log(Math.max(f, 1e-300));
      P = mm(P, jac(g, st[len - n]));          // multiplica por J_{T-n}: la distancia crece en uno
    }
    at10.push(line[10]); if (s < NL) lines.push(line);
  }
  at10.sort((a, b) => a - b);
  const typ = logs.map((l) => Math.exp(l / NS));
  const res = { typ, lines, p10: at10[Math.floor(NS * 0.1)], p90: at10[Math.floor(NS * 0.9)], sat: sat / cnt, factor: Math.pow(typ[10], 1 / 10) };
  if (curveCache.size > 80) curveCache.clear();
  curveCache.set(key, res); return res;
}

// ═════════ LSTM de juguete ═════════
/** Pistas de número gramatical, ILUSTRATIVAS, de las siete palabras leídas (la 2.ª es la clave; la 7.ª, el distractor). */
export const CUES = [0, 1.2, 0.3, -0.5, 0.2, -0.1, -0.9];
export interface LstmGates { f: number; i: number; o: number }
export const GATES_DEFAULT: LstmGates = { f: 0.6, i: 0.8, o: 1 };
export interface LstmRun {
  /** Contenido de la celda tras cada palabra (t = 1..T; c[0] = 0). */
  c: number[];
  /** h_T: lo que la red «lee» al final (positivo = plural). */
  read: number;
  /** Lectura si la pista clave se hubiera guardado intacta (f = 1, i = 0, o = 1). */
  ref: number;
  ratio: number;
  /** Culpa que llega de la salida a la palabra clave a lo largo de la cinta: producto de f entre la clave y el final. */
  blame: number;
  /** ok = plural claro · weak = plural débil · none = sin señal · wrong = la red leería «singular». */
  verdict: 'ok' | 'weak' | 'none' | 'wrong';
}
/** Un recorrido de la celda con compuertas distintas en cada paso (fs[t], is[t] para t = 0..T−1; la palabra clave siempre escribe a tope). */
export function lstmSteps(fs: number[], is: number[], o: number): { c: number[]; read: number } {
  const c = [0]; let prev = 0;
  for (let t = 1; t <= T; t++) { const w = t === KEY ? 1 : is[t - 1]; prev = fs[t - 1] * prev + w * Math.tanh(CUES[t - 1]); c.push(prev); }
  return { c, read: o * Math.tanh(c[T]) };
}
export const verdictOf = (ratio: number): LstmRun['verdict'] => (ratio >= 0.6 ? 'ok' : ratio > 0.15 ? 'weak' : ratio >= -0.15 ? 'none' : 'wrong');
export function lstmRun(gt: LstmGates): LstmRun {
  const { c, read } = lstmSteps(new Array(T).fill(gt.f), new Array(T).fill(gt.i), gt.o), ref = Math.tanh(Math.tanh(CUES[KEY - 1])), ratio = read / ref;
  return { c, read, ref, ratio, blame: Math.pow(gt.f, T - KEY), verdict: verdictOf(ratio) };
}
