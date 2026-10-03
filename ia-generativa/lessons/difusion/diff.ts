// Modelo de difusión REAL (diminuto) que corre en el navegador: los pesos salen de train_toy.py (DDPM + guiado sin clasificador, dos lunas en 2D).
import { gauss, rng } from '../../../../../theme/kit';
import W from './denoiser.json';

export const T: number = W.T;
export const betas: number[] = W.betas;
export const alphas = betas.map((b) => 1 - b);
export const abar = alphas.reduce<number[]>((a, x, i) => (a.push((a[i - 1] ?? 1) * x), a), []);

const H = W.H, IN = 2 + 8 + 3;
const L1W = Float64Array.from(W.l1w), L1B = Float64Array.from(W.l1b), L2W = Float64Array.from(W.l2w), L2B = Float64Array.from(W.l2b);
const L3W = Float64Array.from(W.l3w), L3B = Float64Array.from(W.l3b), OW = Float64Array.from(W.ow), OB = Float64Array.from(W.ob);
const silu = (x: number) => x / (1 + Math.exp(-x));
const z0 = new Float64Array(IN), h1 = new Float64Array(H), h2 = new Float64Array(H), h3 = new Float64Array(H);
const FREQ = [1, 2, 4, 8].map((f) => f * Math.PI);

/** Red de ruido ε_θ(x, t, c): c = 0 (luna de arriba), 1 (luna de abajo) ó 2 (sin etiqueta). */
export function eps(x0: number, x1: number, t: number, c: number, out: [number, number]) {
  z0[0] = x0; z0[1] = x1;
  for (let k = 0; k < 4; k++) { z0[2 + k] = Math.sin((t / T) * FREQ[k]); z0[6 + k] = Math.cos((t / T) * FREQ[k]); }
  z0[10] = c === 0 ? 1 : 0; z0[11] = c === 1 ? 1 : 0; z0[12] = c === 2 ? 1 : 0;
  for (let o = 0; o < H; o++) { let s = L1B[o]; for (let i = 0; i < IN; i++) s += L1W[o * IN + i] * z0[i]; h1[o] = silu(s); }
  for (let o = 0; o < H; o++) { let s = L2B[o]; for (let i = 0; i < H; i++) s += L2W[o * H + i] * h1[i]; h2[o] = silu(s); }
  for (let o = 0; o < H; o++) { let s = L3B[o]; for (let i = 0; i < H; i++) s += L3W[o * H + i] * h2[i]; h3[o] = silu(s); }
  for (let o = 0; o < 2; o++) { let s = OB[o]; for (let i = 0; i < H; i++) s += OW[o * H + i] * h3[i]; out[o] = s; }
}

/** Trayectoria completa del muestreo: traj[k] = estado tras k pasos inversos (k = 0: ruido puro; k = T: resultado). */
export function sample(n: number, cls: number, w: number, seed: number): Float32Array[] {
  const r = rng(seed), x = new Float64Array(n * 2), traj: Float32Array[] = [];
  for (let i = 0; i < n * 2; i++) x[i] = gauss(r);
  traj.push(Float32Array.from(x));
  const ec: [number, number] = [0, 0], eu: [number, number] = [0, 0];
  for (let i = T - 1; i >= 0; i--) {
    for (let p = 0; p < n; p++) {
      eps(x[2 * p], x[2 * p + 1], i, 2, eu);
      let e0 = eu[0], e1 = eu[1];
      if (cls < 2) { eps(x[2 * p], x[2 * p + 1], i, cls, ec); e0 = eu[0] + (1 + w) * (ec[0] - eu[0]); e1 = eu[1] + (1 + w) * (ec[1] - eu[1]); }
      const k = betas[i] / Math.sqrt(1 - abar[i]), a = 1 / Math.sqrt(alphas[i]), s = i > 0 ? Math.sqrt(betas[i]) : 0;
      x[2 * p] = a * (x[2 * p] - k * e0) + s * (i > 0 ? gauss(r) : 0);
      x[2 * p + 1] = a * (x[2 * p + 1] - k * e1) + s * (i > 0 ? gauss(r) : 0);
    }
    traj.push(Float32Array.from(x));
  }
  return traj;
}

/** Datos de entrenamiento: dos medias lunas (misma construcción que train_toy.py). */
export function moons(n: number, seed: number): { x: Float32Array; y: Uint8Array } {
  const r = rng(seed), x = new Float32Array(n * 2), y = new Uint8Array(n), h = n >> 1;
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI, up = i < h;
    let a = up ? Math.cos(th) : 1 - Math.cos(th), b = up ? Math.sin(th) : 0.5 - Math.sin(th);
    a += 0.05 * gauss(r); b += 0.05 * gauss(r);
    x[2 * i] = (a - 0.5) * 1.6; x[2 * i + 1] = (b - 0.25) * 1.6; y[i] = up ? 0 : 1;
  }
  return { x, y };
}
export const DATA = moons(260, 31);
const REF = moons(1200, 77);

/** Fidelidad (fracción de muestras cuyo dato de referencia más cercano es de la clase pedida) y variedad (desviación típica) de un conjunto. */
export function stats(pts: Float32Array, cls: number) {
  const n = pts.length / 2; let ok = 0, mx = 0, my = 0;
  for (let p = 0; p < n; p++) {
    let best = 1e9, bc = 0;
    for (let q = 0; q < REF.y.length; q++) { const dx = pts[2 * p] - REF.x[2 * q], dy = pts[2 * p + 1] - REF.x[2 * q + 1], d = dx * dx + dy * dy; if (d < best) { best = d; bc = REF.y[q]; } }
    if (bc === cls) ok++; mx += pts[2 * p]; my += pts[2 * p + 1];
  }
  mx /= n; my /= n;
  let v = 0; for (let p = 0; p < n; p++) v += (pts[2 * p] - mx) ** 2 + (pts[2 * p + 1] - my) ** 2;
  const sd = Math.sqrt(v / n);
  let rv = 0, rmx = 0, rmy = 0, rn = 0; for (let q = 0; q < REF.y.length; q++) if (REF.y[q] === cls) { rmx += REF.x[2 * q]; rmy += REF.x[2 * q + 1]; rn++; }
  rmx /= rn; rmy /= rn; for (let q = 0; q < REF.y.length; q++) if (REF.y[q] === cls) rv += (REF.x[2 * q] - rmx) ** 2 + (REF.x[2 * q + 1] - rmy) ** 2;
  return { fidelity: ok / n, variety: sd, refVariety: Math.sqrt(rv / rn) };
}
