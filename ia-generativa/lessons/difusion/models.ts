// Los dos modelos de difusión REALES (diminutos) de la lección, con los pesos que exporta train_toy.py (ver ese archivo: datos, licencia,
// arquitectura y semillas). Aquí solo se ejecutan: el proceso hacia delante (fórmula cerrada), la red que estima el ruido y el muestreo
// (determinista, DDIM) con guiado sin clasificador. Nada está simulado.
//   · red de píxeles: dígitos de 8×8 (escala interna −1…1)
//   · red del plano: los códigos de dos números del VAE de la lección 15 (multiplicados por SC); el decodificador de ese VAE los dibuja
import { gauss, rng } from '../../../../../theme/kit';
import M from './models.json';

export const T: number = M.T;
export const SC: number = M.SC;
export const betas: number[] = M.betas;
export const alphas = betas.map((b) => 1 - b);
/** ᾱ_t (t = 1…T) en abar[t − 1]: cuánto de la imagen queda, medido en «energía» (la fracción de ruido es 1 − ᾱ). */
export const abar = alphas.reduce<number[]>((a, x, i) => (a.push((a[i - 1] ?? 1) * x), a), []);
/** Fracción de la mezcla que todavía es imagen en el paso t (0…T). */
export const signalShare = (t: number) => (t <= 0 ? 1 : abar[Math.min(T, Math.round(t)) - 1]);
export const PARAMS = M.params as { pix: number; lat: number };
export const NULL = 10;   // etiqueta «sin pista»

// ── la red: ε_θ(x_t, t, c) ───────────────────────────────────────────────────
interface Layer { W: Float64Array; b: Float64Array; rows: number; cols: number }
interface LayerJ { q: string; s: number[]; b: number[]; rows: number; cols: number }
function b64(s: string): Int8Array {
  const bin = atob(s), out = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) { const v = bin.charCodeAt(i); out[i] = v > 127 ? v - 256 : v; }
  return out;
}
function layer(j: LayerJ): Layer {
  const q = b64(j.q), W = new Float64Array(q.length);
  for (let r = 0; r < j.rows; r++) for (let c = 0; c < j.cols; c++) W[r * j.cols + c] = q[r * j.cols + c] * j.s[r];
  return { W, b: Float64Array.from(j.b), rows: j.rows, cols: j.cols };
}
const silu = (x: number) => x / (1 + Math.exp(-x));

class Net {
  D: number; H: number; L: Layer[]; z: Float64Array; h1: Float64Array; h2: Float64Array; h3: Float64Array;
  constructor(j: { l1: LayerJ; l2: LayerJ; l3: LayerJ; out: LayerJ; H: number }) {
    this.L = [layer(j.l1), layer(j.l2), layer(j.l3), layer(j.out)];
    this.H = j.H; this.D = this.L[3].rows;
    this.z = new Float64Array(this.D + 27); this.h1 = new Float64Array(this.H); this.h2 = new Float64Array(this.H); this.h3 = new Float64Array(this.H);
  }
  /** Estimación del ruido de x (D números) en el paso con índice t (0…T−1, es decir, el paso t + 1) con la etiqueta c (0–9; 10 = sin pista). */
  eps(x: ArrayLike<number>, off: number, t: number, c: number, out: Float64Array, oo = 0) {
    const { D, H, z, h1, h2, h3 } = this, [l1, l2, l3, lo] = this.L;
    for (let i = 0; i < D; i++) z[i] = x[off + i];
    for (let k = 0; k < 8; k++) { const a = (t / T) * (Math.PI / 2) * 2 ** k; z[D + k] = Math.sin(a); z[D + 8 + k] = Math.cos(a); }
    for (let k = 0; k < 11; k++) z[D + 16 + k] = k === c ? 1 : 0;
    const n1 = D + 27;
    for (let o = 0; o < H; o++) { let s = l1.b[o]; const r = o * n1; for (let i = 0; i < n1; i++) s += l1.W[r + i] * z[i]; h1[o] = silu(s); }
    for (let o = 0; o < H; o++) { let s = l2.b[o]; const r = o * H; for (let i = 0; i < H; i++) s += l2.W[r + i] * h1[i]; h2[o] = h1[o] + silu(s); }
    for (let o = 0; o < H; o++) { let s = l3.b[o]; const r = o * H; for (let i = 0; i < H; i++) s += l3.W[r + i] * h2[i]; h3[o] = h2[o] + silu(s); }
    for (let o = 0; o < D; o++) { let s = lo.b[o]; const r = o * H; for (let i = 0; i < H; i++) s += lo.W[r + i] * h3[i]; out[oo + o] = s; }
  }
}
export const PIX = new Net(M.pix);
export const LAT = new Net(M.lat);

/** Estimación guiada: ε̂ = ε(sin pista) + s·(ε(con pista) − ε(sin pista)). Con cls = NULL (o s = 0) es la estimación sin pista. */
const eu = new Float64Array(64), ec = new Float64Array(64);
export function guided(net: Net, x: ArrayLike<number>, off: number, t: number, cls: number, s: number, out: Float64Array, oo = 0) {
  net.eps(x, off, t, NULL, eu);
  if (cls === NULL || s === 0) { for (let i = 0; i < net.D; i++) out[oo + i] = eu[i]; return; }
  net.eps(x, off, t, cls, ec);
  for (let i = 0; i < net.D; i++) out[oo + i] = eu[i] + s * (ec[i] - eu[i]);
}

/** Un paso de regreso (del paso i + 1 al i), en el lugar, con el muestreo determinista de DDIM (η = 0): con la estimación ε̂ se calcula
 *  la imagen limpia que implica, x̂₀ = (x − √(1 − ᾱ)·ε̂)/√ᾱ, y se vuelve a mezclar con la parte de ruido que corresponde al paso anterior.
 *  Es la misma red entrenada como en DDPM; no se añade ruido nuevo: la misma estática da siempre el mismo resultado. */
export function reverseStep(x: Float64Array, off: number, D: number, e: ArrayLike<number>, eo: number, i: number) {
  const at = abar[i], ap = i > 0 ? abar[i - 1] : 1, sa = Math.sqrt(at), sn = Math.sqrt(1 - at), pa = Math.sqrt(ap), pn = Math.sqrt(1 - ap);
  for (let j = 0; j < D; j++) { const x0 = (x[off + j] - sn * e[eo + j]) / sa; x[off + j] = pa * x0 + pn * e[eo + j]; }
}

/** Proceso hacia delante en forma cerrada: x_t = √ᾱ_t · x₀ + √(1 − ᾱ_t) · ε. */
export function forward(x0: ArrayLike<number>, e: ArrayLike<number>, t: number, out: Float64Array | Float32Array) {
  const a = signalShare(t), sa = Math.sqrt(a), sn = Math.sqrt(1 - a);
  for (let i = 0; i < out.length; i++) out[i] = sa * x0[i] + sn * e[i];
  return out;
}

// ── imágenes (8×8) ───────────────────────────────────────────────────────────
const CH = '0123456789abcdefg';
const decode17 = (s: string) => Float32Array.from(s, (c) => CH.indexOf(c) / 16);
const IMGS = M.imgs as Record<string, string>;
/** Imagen de entrenamiento i (en el orden de la lección 15), en 0…1. */
export const img = (i: number) => decode17(IMGS[String(i)]);
export const SEVEN = img(M.seven);
export const OTHERS = (M.others as number[]).map(img);
/** Otros cinco sietes reales («datos reales» del repaso). */
export const SEVENS5 = (M.sevens as number[]).map(img);
export const MEAN = Float32Array.from(M.mean);
export const toInt = (v: ArrayLike<number>) => Float64Array.from(v as ArrayLike<number>, (x) => 2 * x - 1);
/** De la escala interna (−1…1) a tinta 0…1, recortada. */
export const toInk = (x: ArrayLike<number>) => Float32Array.from(x as ArrayLike<number>, (v) => Math.min(1, Math.max(0, (v + 1) / 2)));
/** Ruido fijo de 64 píxeles (semilla dada). */
export const noise64 = (seed: number) => { const r = rng(seed); return Float64Array.from({ length: 64 }, () => gauss(r)); };

const memo = new Map<string, Float32Array[]>();
/** Muestreo completo en píxeles: traj[k] = imagen tras k pasos de regreso (k = 0: ruido puro; k = T: resultado). Escala interna. */
export function pixTraj(seed: number, cls: number, s: number): Float32Array[] {
  const key = `p${seed}|${cls}|${s}`;
  let tr = memo.get(key);
  if (tr) return tr;
  const r = rng(seed), x = Float64Array.from({ length: 64 }, () => gauss(r)), e = new Float64Array(64);
  tr = [Float32Array.from(x)];
  for (let i = T - 1; i >= 0; i--) { guided(PIX, x, 0, i, cls, s, e); reverseStep(x, 0, 64, e, 0, i); tr.push(Float32Array.from(x)); }
  memo.set(key, tr);
  return tr;
}

// ── el plano de códigos ──────────────────────────────────────────────────────
export const CODES = Float32Array.from(M.codes);
export const LAB = Uint8Array.from(M.lab as string, (c) => +c);
export const NCODES = LAB.length;
const VH: number = M.vaeH, VD1W = Float64Array.from(M.vae.d1w), VD1B = Float64Array.from(M.vae.d1b), VD2W = Float64Array.from(M.vae.d2w), VD2B = Float64Array.from(M.vae.d2b);
const vh = new Float64Array(VH);
/** Decodificador del VAE de la lección 15: un punto del plano (en unidades de la escena, ya multiplicadas por SC) → imagen 0…1. */
export function vaeDec(p0: number, p1: number): Float32Array {
  const z0 = p0 / SC, z1 = p1 / SC, out = new Float32Array(64);
  for (let o = 0; o < VH; o++) vh[o] = Math.tanh(VD1B[o] + VD1W[o * 2] * z0 + VD1W[o * 2 + 1] * z1);
  for (let o = 0; o < 64; o++) { let s = VD2B[o]; for (let i = 0; i < VH; i++) s += VD2W[o * VH + i] * vh[i]; out[o] = 1 / (1 + Math.exp(-s)); }
  return out;
}
// lector: la regresión logística de la lección 15 (solo para CONTAR qué dígito sale)
const CW = Float64Array.from(M.clf.w), CB = Float64Array.from(M.clf.b);
export function readDigit(x: ArrayLike<number>): number {
  let best = 0, bv = -Infinity;
  for (let c = 0; c < 10; c++) { let t = CB[c]; for (let i = 0; i < 64; i++) t += CW[c * 64 + i] * x[i]; if (t > bv) { bv = t; best = c; } }
  return best;
}

/** Muestreo en el plano, por partes (para repartir el cálculo entre fotogramas). traj[k] = puntos tras k pasos de regreso. */
export class LatJob {
  n: number; cls: number; s: number; r: () => number; x: Float64Array; e = new Float64Array(2); i = T - 1; traj: Float32Array[];
  constructor(seed: number, n: number, cls: number, s: number) {
    this.n = n; this.cls = cls; this.s = s; this.r = rng(seed);
    this.x = Float64Array.from({ length: n * 2 }, () => gauss(this.r));
    this.traj = [Float32Array.from(this.x)];
  }
  get done() { return this.i < 0; }
  /** Da hasta `k` pasos de regreso. */
  advance(k = 1) {
    for (; k > 0 && this.i >= 0; k--, this.i--) {
      for (let p = 0; p < this.n; p++) { guided(LAT, this.x, 2 * p, this.i, this.cls, this.s, this.e); reverseStep(this.x, 2 * p, 2, this.e, 0, this.i); }
      this.traj.push(Float32Array.from(this.x));
    }
    return this;
  }
  finish() { return this.advance(T); }
}
const jobs = new Map<string, LatJob>();
export function latJob(seed: number, n: number, cls: number, s: number): LatJob {
  const key = `${seed}|${n}|${cls}|${s}`;
  let j = jobs.get(key);
  if (!j) { j = new LatJob(seed, n, cls, s); jobs.set(key, j); }
  return j;
}
/** Movimiento de un punto en un paso de regreso: hacia dónde lo lleva quitar el ruido estimado. */
export function latMove(x0: number, x1: number, i: number, cls: number, s: number): [number, number] {
  const x = new Float64Array([x0, x1]), e = new Float64Array(2);
  guided(LAT, x, 0, i, cls, s, e);
  reverseStep(x, 0, 2, e, 0, i);
  return [x[0] - x0, x[1] - x1];
}
export const CHECK = M.check as { pix: number[]; lat: number[] };
