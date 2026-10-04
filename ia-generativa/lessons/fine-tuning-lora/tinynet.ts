// Red neuronal diminuta REAL (2 → 32 → 32 → 3, tanh, softmax) con retropropagación a mano, para la lección de ajuste fino y LoRA.
// Todo es determinista (semillas fijas). Sirve para dos cosas:
//   · preentrenar el «modelo base» (script build-base.ts, fuera de línea; los pesos van en base.ts), y
//   · ajustarlo EN EL NAVEGADOR: ajuste completo (todos los pesos) o LoRA (W2 congelada + corrección ΔW = (α/r)·B·A).
import { gauss, rng } from '../../../../../theme/kit';

export const H = 32;          // anchura de las dos capas ocultas: W2 es de 32×32 = 1 024 números
export const C = 3;           // clases de salida

export interface Params { W1: number[]; b1: number[]; W2: number[]; b2: number[]; W3: number[]; b3: number[] }
export interface Lora { r: number; A: number[]; B: number[]; scale: number }
export interface Pt { x: number; y: number; c: number }

export const nParams = (): number => 2 * H + H + H * H + H + H * C + C;
export const copyParams = (p: Params): Params => ({ W1: p.W1.slice(), b1: p.b1.slice(), W2: p.W2.slice(), b2: p.b2.slice(), W3: p.W3.slice(), b3: p.b3.slice() });

/** Pase hacia delante de un punto. Con `lora`, la capa 2 usa W2·h1 + escala·B·(A·h1). */
export function forward(p: Params, lora: Lora | null, x: number, y: number, buf?: { h1: Float64Array; t: Float64Array; h2: Float64Array; z: Float64Array }) {
  const h1 = buf?.h1 ?? new Float64Array(H), h2 = buf?.h2 ?? new Float64Array(H), z = buf?.z ?? new Float64Array(C);
  const t = buf?.t ?? new Float64Array(lora ? lora.r : 0);
  for (let i = 0; i < H; i++) h1[i] = Math.tanh(p.W1[2 * i] * x + p.W1[2 * i + 1] * y + p.b1[i]);
  if (lora) for (let k = 0; k < lora.r; k++) { let s = 0; for (let j = 0; j < H; j++) s += lora.A[k * H + j] * h1[j]; t[k] = s; }
  for (let i = 0; i < H; i++) {
    let s = p.b2[i];
    for (let j = 0; j < H; j++) s += p.W2[i * H + j] * h1[j];
    if (lora) { let q = 0; for (let k = 0; k < lora.r; k++) q += lora.B[i * lora.r + k] * t[k]; s += lora.scale * q; }
    h2[i] = Math.tanh(s);
  }
  for (let c = 0; c < C; c++) { let s = p.b3[c]; for (let i = 0; i < H; i++) s += p.W3[c * H + i] * h2[i]; z[c] = s; }
  return { h1, t, h2, z };
}

export function predict(p: Params, lora: Lora | null, x: number, y: number): number {
  const { z } = forward(p, lora, x, y);
  let b = 0; for (let c = 1; c < C; c++) if (z[c] > z[b]) b = c;
  return b;
}

export function softmax(z: ArrayLike<number>): number[] {
  let m = -Infinity; for (let c = 0; c < C; c++) m = Math.max(m, z[c]);
  const e: number[] = []; let s = 0; for (let c = 0; c < C; c++) { const v = Math.exp(z[c] - m); e.push(v); s += v; }
  return e.map((v) => v / s);
}

export const accuracy = (p: Params, lora: Lora | null, data: Pt[]): number => (data.length ? data.reduce((a, d) => a + (predict(p, lora, d.x, d.y) === d.c ? 1 : 0), 0) / data.length : 0);

/** Inicialización de LoRA: A gaussiana, B cero ⇒ ΔW = 0 al empezar (el modelo arranca idéntico al base). */
export function newLora(r: number, seed: number, alpha = r): Lora {
  const g = rng(seed), sd = 1 / Math.sqrt(H);
  return { r, A: Array.from({ length: r * H }, () => gauss(g) * sd), B: new Array(H * r).fill(0), scale: alpha / r };
}
/** ΔW = escala · B · A (H×H). */
export function deltaW(l: Lora): number[] {
  const D = new Array(H * H).fill(0);
  for (let i = 0; i < H; i++) for (let j = 0; j < H; j++) { let s = 0; for (let k = 0; k < l.r; k++) s += l.B[i * l.r + k] * l.A[k * H + j]; D[i * H + j] = l.scale * s; }
  return D;
}

/** Entrenador de pasos completos con Adam. `full`: todos los pesos; `lora`: solo A y B (la base no se toca). */
export class Tuner {
  p: Params; lora: Lora | null; data: Pt[]; lr: number; step = 0;
  private m: Record<string, number[]> = {}; private v: Record<string, number[]> = {};
  constructor(base: Params, data: Pt[], mode: { full: true } | { r: number; seed: number; alpha?: number }, lr: number) {
    this.data = data; this.lr = lr;
    if ('full' in mode) { this.p = copyParams(base); this.lora = null; } else { this.p = base; this.lora = newLora(mode.r, mode.seed, mode.alpha ?? mode.r); }
  }
  get trainable(): number { return this.lora ? this.lora.A.length + this.lora.B.length : nParams(); }

  /** Un paso de Adam con todo el conjunto. Devuelve la pérdida media (entropía cruzada) antes del paso. */
  advance(): number {
    const { p, lora, data } = this, n = data.length;
    const full = !lora;
    const g: Record<string, number[]> = full
      ? { W1: new Array(2 * H).fill(0), b1: new Array(H).fill(0), W2: new Array(H * H).fill(0), b2: new Array(H).fill(0), W3: new Array(H * C).fill(0), b3: new Array(C).fill(0) }
      : { A: new Array(lora!.r * H).fill(0), B: new Array(H * lora!.r).fill(0) };
    const buf = { h1: new Float64Array(H), t: new Float64Array(lora ? lora.r : 0), h2: new Float64Array(H), z: new Float64Array(C) };
    const d2 = new Float64Array(H), d1 = new Float64Array(H), dt = new Float64Array(lora ? lora.r : 0);
    let loss = 0;
    for (const pt of data) {
      const { h1, t, h2, z } = forward(p, lora, pt.x, pt.y, buf);
      const pr = softmax(z); loss -= Math.log(Math.max(pr[pt.c], 1e-12));
      d2.fill(0); d1.fill(0);
      for (let c = 0; c < C; c++) {
        const dz = (pr[c] - (c === pt.c ? 1 : 0)) / n;
        if (full) { g.b3[c] += dz; for (let i = 0; i < H; i++) g.W3[c * H + i] += dz * h2[i]; }
        for (let i = 0; i < H; i++) d2[i] += dz * p.W3[c * H + i];
      }
      for (let i = 0; i < H; i++) d2[i] *= 1 - h2[i] * h2[i];                 // derivada de tanh: δ de la capa 2
      if (full) {
        for (let i = 0; i < H; i++) { g.b2[i] += d2[i]; for (let j = 0; j < H; j++) { g.W2[i * H + j] += d2[i] * h1[j]; d1[j] += d2[i] * p.W2[i * H + j]; } }
        for (let i = 0; i < H; i++) { const q = d1[i] * (1 - h1[i] * h1[i]); g.b1[i] += q; g.W1[2 * i] += q * pt.x; g.W1[2 * i + 1] += q * pt.y; }
      } else {
        const L = lora!, r = L.r; dt.fill(0);
        for (let i = 0; i < H; i++) for (let k = 0; k < r; k++) { g.B[i * r + k] += L.scale * d2[i] * t[k]; dt[k] += L.scale * L.B[i * r + k] * d2[i]; }
        for (let k = 0; k < r; k++) for (let j = 0; j < H; j++) g.A[k * H + j] += dt[k] * h1[j];
      }
    }
    this.step++;
    const upd = (name: string, w: number[]) => {
      const gr = g[name], m = (this.m[name] ??= new Array(w.length).fill(0)), v = (this.v[name] ??= new Array(w.length).fill(0));
      const b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.step), c2 = 1 - Math.pow(b2, this.step);
      for (let i = 0; i < w.length; i++) { m[i] = b1 * m[i] + (1 - b1) * gr[i]; v[i] = b2 * v[i] + (1 - b2) * gr[i] * gr[i]; w[i] -= (this.lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8); }
    };
    if (full) { upd('W1', p.W1); upd('b1', p.b1); upd('W2', p.W2); upd('b2', p.b2); upd('W3', p.W3); upd('b3', p.b3); }
    else { upd('A', lora!.A); upd('B', lora!.B); }
    return loss / n;
  }
}

/** Valores singulares de una matriz H×H (raíces de los autovalores de MᵀM, por el método de Jacobi), de mayor a menor. */
export function singularValues(M: number[]): number[] {
  const n = H, S: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) s += M[k * n + i] * M[k * n + j]; S[i][j] = S[j][i] = s; }
  for (let sweep = 0; sweep < 40; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += S[i][j] * S[i][j];
    if (off < 1e-18) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(S[p][q]) < 1e-14) continue;
      const th = (S[q][q] - S[p][p]) / (2 * S[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = S[k][p], b = S[k][q]; S[k][p] = c * a - s * b; S[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = S[p][k], b = S[q][k]; S[p][k] = c * a - s * b; S[q][k] = s * a + c * b; }
    }
  }
  return S.map((row, i) => Math.sqrt(Math.max(0, row[i]))).sort((a, b) => b - a);
}
