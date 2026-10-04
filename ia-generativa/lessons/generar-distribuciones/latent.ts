// Datos y modelos REALES (diminutos) de la lección. Todo sale de train_toy.py (ver ese archivo para el origen de los datos, la licencia y las semillas):
// dígitos escritos a mano de 8×8 píxeles (UCI, CC BY 4.0), un autocodificador (AE) y un autocodificador variacional (VAE) de dos números de código.
// Aquí solo se ejecutan: codificar, decodificar, sortear. Nada está simulado.
import { gauss, rng } from '../../../../../theme/kit';
import D from './latent.json';

const CH = '0123456789abcdefg';
export const NTR: number = D.ntrain;                       // las primeras 1500 imágenes son de entrenamiento; las 297 últimas, reservadas
export const N_ALL: number = D.lab.length;
export const IMGS = new Float32Array(N_ALL * 64);
for (let i = 0; i < IMGS.length; i++) IMGS[i] = CH.indexOf(D.imgs[i]) / 16;
export const LAB = Uint8Array.from(D.lab, (c) => +c);
export const SHOW: number[] = D.show;                      // 8 imágenes reservadas de 8 dígitos distintos
export const img = (i: number) => IMGS.subarray(i * 64, i * 64 + 64);

// ── tinta total: un solo número por imagen (la distribución de la primera parte) ──
export const INK = Float64Array.from({ length: N_ALL }, (_, i) => { let s = 0; for (let j = 0; j < 64; j++) s += IMGS[i * 64 + j]; return s; });
export const INK_MU = INK.reduce((a, b) => a + b, 0) / N_ALL;
export const INK_SD = Math.sqrt(INK.reduce((a, b) => a + (b - INK_MU) ** 2, 0) / N_ALL);   // desviación poblacional (la del máximo de verosimilitud)
export const INK_LO = 11, INK_HI = 28;                                     // histograma de barras de ancho 1
export const INK_HIST = (() => { const h = new Array(INK_HI - INK_LO).fill(0); for (const v of INK) { const b = Math.floor(v) - INK_LO; if (b >= 0 && b < h.length) h[b]++; } return h as number[]; })();
/** Puntuación de una campana N(μ, σ): promedio del logaritmo de la densidad que le da a los 1797 datos (exacto, en forma cerrada). */
export const inkScore = (mu: number, sd: number) => -Math.log(sd) - 0.5 * Math.log(2 * Math.PI) - (INK_SD ** 2 + (INK_MU - mu) ** 2) / (2 * sd * sd);
export const INK_BEST = inkScore(INK_MU, INK_SD);
export const normPdf = (x: number, mu: number, sd: number) => Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
/** Algunas imágenes con su tinta, para el primer vistazo (una por dígito distinto, de las reservadas, y su valor). */
export const INK_PICKS = SHOW.slice(0, 6);

// ── redes ──
const H: number = D.H;
interface Net { e1w: Float64Array; e1b: Float64Array; mw: Float64Array; mb: Float64Array; lw?: Float64Array; lb?: Float64Array; d1w: Float64Array; d1b: Float64Array; d2w: Float64Array; d2b: Float64Array }
const mk = (o: Record<string, number[]>): Net => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Float64Array.from(v)])) as unknown as Net;
const AE = mk(D.ae), VAE = mk(D.vae);
export const N_PARAMS_AE = Object.values(D.ae).reduce((a, v) => a + v.length, 0);
export const N_PARAMS_VAE = Object.values(D.vae).reduce((a, v) => a + v.length, 0);
const hid = new Float64Array(H);

/** Codificador. Devuelve el centro μ (y, en el VAE, log σ²) del código de dos números. */
function encode(n: Net, x: ArrayLike<number>): { mu: [number, number]; lv: [number, number] } {
  for (let o = 0; o < H; o++) { let s = n.e1b[o]; for (let i = 0; i < 64; i++) s += n.e1w[o * 64 + i] * x[i]; hid[o] = Math.tanh(s); }
  const mu: [number, number] = [0, 0], lv: [number, number] = [0, 0];
  for (let o = 0; o < 2; o++) {
    let s = n.mb[o]; for (let i = 0; i < H; i++) s += n.mw[o * H + i] * hid[i]; mu[o] = s;
    if (n.lw && n.lb) { let t = n.lb[o]; for (let i = 0; i < H; i++) t += n.lw[o * H + i] * hid[i]; lv[o] = t; }
  }
  return { mu, lv };
}
/** Decodificador: dos números → imagen de 64 píxeles en 0..1. */
function decode(n: Net, z0: number, z1: number): Float32Array {
  for (let o = 0; o < H; o++) hid[o] = Math.tanh(n.d1b[o] + n.d1w[o * 2] * z0 + n.d1w[o * 2 + 1] * z1);
  const out = new Float32Array(64);
  for (let o = 0; o < 64; o++) { let s = n.d2b[o]; for (let i = 0; i < H; i++) s += n.d2w[o * H + i] * hid[i]; out[o] = 1 / (1 + Math.exp(-s)); }
  return out;
}
export const encAE = (x: ArrayLike<number>) => encode(AE, x).mu;
export const decAE = (z0: number, z1: number) => decode(AE, z0, z1);
export const encVAE = (x: ArrayLike<number>) => encode(VAE, x);
export const decVAE = (z0: number, z1: number) => decode(VAE, z0, z1);

/** Comprobación contra los números calculados por PyTorch (devuelve el mayor desvío; ~0). */
export function selfCheck(): number {
  const c = D.check, x = img(SHOW[0]);
  const a = encAE(x), v = encVAE(x), da = decAE(c.z[0], c.z[1]), dv = decVAE(c.z[0], c.z[1]);
  let m = 0;
  for (let k = 0; k < 2; k++) m = Math.max(m, Math.abs(a[k] - c.ae_mu[k]), Math.abs(v.mu[k] - c.vae_mu[k]), Math.abs(v.lv[k] - c.vae_lv[k]));
  for (let k = 0; k < 64; k++) m = Math.max(m, Math.abs(da[k] - c.ae_dec[k]), Math.abs(dv[k] - c.vae_dec[k]));
  return m;
}

// ── códigos de las 1500 imágenes de entrenamiento ──
export interface Codes { x: Float32Array; y: Float32Array; sx?: Float32Array; sy?: Float32Array }
export const CODES_AE: Codes = (() => { const x = new Float32Array(NTR), y = new Float32Array(NTR); for (let i = 0; i < NTR; i++) { const m = encAE(img(i)); x[i] = m[0]; y[i] = m[1]; } return { x, y }; })();
export const CODES_VAE: Codes = (() => {
  const x = new Float32Array(NTR), y = new Float32Array(NTR), sx = new Float32Array(NTR), sy = new Float32Array(NTR);
  for (let i = 0; i < NTR; i++) { const e = encVAE(img(i)); x[i] = e.mu[0]; y[i] = e.mu[1]; sx[i] = Math.exp(0.5 * e.lv[0]); sy[i] = Math.exp(0.5 * e.lv[1]); }
  return { x, y, sx, sy };
})();
const range = (a: Float32Array) => { let lo = Infinity, hi = -Infinity; for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi] as const; };
/** Recuadro que contiene todos los códigos del AE (de ahí se sortea «a ciegas»). */
export const AE_BOX = (() => { const [x0, x1] = range(CODES_AE.x), [y0, y1] = range(CODES_AE.y); return { x0, x1, y0, y1 }; })();

// ── lector: un clasificador sencillo (regresión logística) que solo sirve para ETIQUETAR imágenes generadas ──
const CW = Float64Array.from(D.clf.w), CB = Float64Array.from(D.clf.b);
export const CLF_ACC: number = D.clf.acc;
export function readDigit(x: ArrayLike<number>): { digit: number; p: number } {
  const s = new Float64Array(10); let mx = -Infinity;
  for (let c = 0; c < 10; c++) { let t = CB[c]; for (let i = 0; i < 64; i++) t += CW[c * 64 + i] * x[i]; s[c] = t; if (t > mx) mx = t; }
  let z = 0; for (let c = 0; c < 10; c++) { s[c] = Math.exp(s[c] - mx); z += s[c]; }
  let best = 0; for (let c = 1; c < 10; c++) if (s[c] > s[best]) best = c;
  return { digit: best, p: s[best] / z };
}

// ── sortear ──
export interface Draws { z: [number, number][]; img: Float32Array[]; digit: number[] }
/** AE: no dice dónde sortear; el recurso ingenuo es sortear al azar dentro del recuadro de los códigos. */
export function drawAE(n: number, seed: number): Draws {
  const r = rng(seed), z: [number, number][] = [], im: Float32Array[] = [], dg: number[] = [];
  for (let i = 0; i < n; i++) { const p: [number, number] = [AE_BOX.x0 + r() * (AE_BOX.x1 - AE_BOX.x0), AE_BOX.y0 + r() * (AE_BOX.y1 - AE_BOX.y0)]; z.push(p); const g = decAE(p[0], p[1]); im.push(g); dg.push(readDigit(g).digit); }
  return { z, img: im, digit: dg };
}
/** VAE: se sortea de la campana estándar N(0, I) y se decodifica. */
export function drawVAE(n: number, seed: number): Draws {
  const r = rng(seed), z: [number, number][] = [], im: Float32Array[] = [], dg: number[] = [];
  for (let i = 0; i < n; i++) { const p: [number, number] = [gauss(r), gauss(r)]; z.push(p); const g = decVAE(p[0], p[1]); im.push(g); dg.push(readDigit(g).digit); }
  return { z, img: im, digit: dg };
}
export const digitFreq = (digits: ArrayLike<number>) => { const h = new Array(10).fill(0); for (let i = 0; i < digits.length; i++) h[digits[i]]++; return h as number[]; };

// ── distancias al dato de entrenamiento más cercano (memoizadas: se calculan una vez) ──
export function nearest(x: ArrayLike<number>): { i: number; d: number } {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < NTR; i++) {
    let s = 0; const o = i * 64;
    for (let j = 0; j < 64; j++) { const t = x[j] - IMGS[o + j]; s += t * t; if (s >= bd) break; }
    if (s < bd) { bd = s; bi = i; }
  }
  return { i: bi, d: Math.sqrt(bd) };
}
/** Imágenes sorteando cada píxel por separado, con la frecuencia con que ese píxel toma cada valor en los datos. */
export function drawIndependent(n: number, seed: number): Float32Array[] {
  const r = rng(seed), out: Float32Array[] = [];
  for (let k = 0; k < n; k++) { const g = new Float32Array(64); for (let j = 0; j < 64; j++) g[j] = IMGS[Math.floor(r() * NTR) * 64 + j]; out.push(g); }
  return out;
}
export function drawNoise(n: number, seed: number): Float32Array[] {
  const r = rng(seed), out: Float32Array[] = [];
  for (let k = 0; k < n; k++) { const g = new Float32Array(64); for (let j = 0; j < 64; j++) g[j] = r(); out.push(g); }
  return out;
}
let _dist: { real: number[]; indep: number[]; noise: number[]; vae: number[]; ex: { real: Float32Array; indep: Float32Array; noise: Float32Array } } | null = null;
export function distances() {
  if (_dist) return _dist;
  const N = 150, dist = (xs: ArrayLike<number>[]) => xs.map((x) => nearest(x).d);
  const real = Array.from({ length: N }, (_, k) => img(NTR + (k % (N_ALL - NTR))));
  const indep = drawIndependent(N, 41), noise = drawNoise(N, 42), vae = drawVAE(N, 43).img;
  _dist = { real: dist(real), indep: dist(indep), noise: dist(noise), vae: dist(vae), ex: { real: img(SHOW[0]), indep: indep[1], noise: noise[1] } };
  return _dist;
}
export const mean = (a: ArrayLike<number>) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
/** Fracción de píxeles «bien definidos» (casi blancos o casi negros): una medida de nitidez. */
export const crisp = (x: ArrayLike<number>) => { let c = 0; for (let j = 0; j < 64; j++) if (x[j] < 0.15 || x[j] > 0.85) c++; return c / 64; };

// ── entrenamiento registrado ──
export const SNAP = { ep: D.snap.ep as number[], rec: D.snap.rec.map((r: number[]) => Float32Array.from(r)) };
export const LOSS: number[] = D.loss;                                         // error de reconstrucción por imagen, cada 10 pasos
export const SWEEP = { k: D.sweep.k as number[], sse: D.sweep.sse as number[], acc: (D.sweep as { acc?: number[] }).acc ?? [], rec: D.sweep.rec.map((r: number[]) => Float32Array.from(r)), base: D.base as number };
export const STATS = D.stats;
/** Imagen i (0..7) de un bloque de 8 imágenes aplanado (para SNAP y SWEEP). */
export const slot = (block: Float32Array, i: number) => block.subarray(i * 64, i * 64 + 64);
export const BASE_SSE: number = D.base;
