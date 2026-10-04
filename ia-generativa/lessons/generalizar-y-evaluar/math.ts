// Matemática REAL de la lección (a pequeña escala): ajuste polinómico por mínimos cuadrados con regularización (ridge),
// descenso del gradiente con curvas de entrenamiento/validación, y la distribución de puntuaciones de un clasificador.
// Los datos son sintéticos y deterministas (semilla fija); la lección los rotula como ilustrativos.
import { gauss, rng } from '../../../../../theme/kit';

export const f = (x: number) => 0.6 * Math.sin(2 * Math.PI * x) + 0.2;      // la señal verdadera (desconocida para el modelo)
const sigma = 0.2;                                                            // ruido de las mediciones

function makeSet(n: number, seed: number, even: boolean): { x: number[]; y: number[] } {
  const r = rng(seed), x: number[] = [], y: number[] = [];
  for (let i = 0; i < n; i++) {
    const xi = even ? Math.min(0.99, Math.max(0.01, (i + 0.5) / n + (r() - 0.5) * 0.04)) : r();
    x.push(xi); y.push(f(xi) + sigma * gauss(r));
  }
  return { x, y };
}
export const TRAIN = makeSet(12, 4242, true);
export const VAL = makeSet(80, 777, false);

const z = (x: number) => 2 * x - 1;                                           // x ∈ [0,1] → z ∈ [-1,1] (estabilidad numérica)
const feats = (x: number, deg: number) => { const a = new Array(deg + 1); let p = 1; for (let k = 0; k <= deg; k++) { a[k] = p; p *= z(x); } return a as number[]; };

/** Resuelve A w = b por eliminación gaussiana con pivoteo parcial. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) { const k = M[r][c] / d; for (let q = c; q <= n; q++) M[r][q] -= k * M[c][q]; }
  }
  const w = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let q = r + 1; q < n; q++) s -= M[r][q] * w[q]; w[r] = s / (M[r][r] || 1e-12); }
  return w;
}

/** Ajuste polinómico de grado `deg` con regularización ridge λ (sin penalizar el término constante). */
export function fitPoly(deg: number, lambda = 0, data = TRAIN): number[] {
  const n = deg + 1, A = Array.from({ length: n }, () => new Array(n).fill(0)), b = new Array(n).fill(0);
  data.x.forEach((x, i) => { const a = feats(x, deg); for (let r = 0; r < n; r++) { b[r] += a[r] * data.y[i]; for (let c = 0; c < n; c++) A[r][c] += a[r] * a[c]; } });
  for (let k = 1; k < n; k++) A[k][k] += lambda;
  for (let k = 0; k < n; k++) A[k][k] += 1e-9;
  return solve(A, b);
}
export const evalPoly = (w: number[], x: number) => { const a = feats(x, w.length - 1); let s = 0; for (let k = 0; k < w.length; k++) s += w[k] * a[k]; return s; };
export const rmse = (w: number[], data: { x: number[]; y: number[] }) => Math.sqrt(data.x.reduce((s, x, i) => s + (evalPoly(w, x) - data.y[i]) ** 2, 0) / data.x.length);

/** Error de entrenamiento y de validación para cada grado 1..10 (λ ≈ 0). */
export const DEGREES = Array.from({ length: 10 }, (_, i) => i + 1);
export const BY_DEGREE = DEGREES.map((d) => { const w = fitPoly(d, 0); return { deg: d, w, train: rmse(w, TRAIN), val: rmse(w, VAL) }; });
export const BEST_DEG = BY_DEGREE.reduce((a, b) => (b.val < a.val ? b : a)).deg;

/** Descenso del gradiente sobre un polinomio de grado 9: curvas de entrenamiento y validación por época.
 *  20 000 épocas (el eje de la escena llega hasta ahí): con 600 el mínimo de validación (época 348) apenas se notaba;
 *  con 20 000 la validación sube de 0.237 a ≈ 0.27 mientras el entrenamiento baja de 0.163 a ≈ 0.07 (verify-data.ts). */
export function trainingCurves(deg = 9, epochs = 20000) {
  const n = TRAIN.x.length, F = TRAIN.x.map((x) => feats(x, deg)), w = new Array(deg + 1).fill(0);
  // tasa de aprendizaje estable = 1 / λmax(H), con H = 2·FᵀF/n (de ahí el 0.5/λ), λ por iteración de potencias
  let v = new Array(deg + 1).fill(1), lam = 1;
  for (let it = 0; it < 60; it++) { const u = new Array(deg + 1).fill(0); F.forEach((a) => { const d = a.reduce((s, q, k) => s + q * v[k], 0); a.forEach((q, k) => (u[k] += (q * d) / n)); }); lam = Math.hypot(...u); v = u.map((q) => q / lam); }
  const lr = 0.5 / lam, out: { e: number; train: number; val: number }[] = [];
  for (let e = 0; e <= epochs; e++) {
    if (e % 3 === 0) out.push({ e, train: rmse(w, TRAIN), val: rmse(w, VAL) });
    const g = new Array(deg + 1).fill(0);
    F.forEach((a, i) => { const r = a.reduce((s, q, k) => s + q * w[k], 0) - TRAIN.y[i]; a.forEach((q, k) => (g[k] += (2 * r * q) / n)); });
    for (let k = 0; k <= deg; k++) w[k] -= lr * g[k];
  }
  const best = out.reduce((a, b) => (b.val < a.val ? b : a));
  return { curves: out, best };
}
export const CURVES = trainingCurves();

// ───────── clasificador de juguete: puntuaciones gaussianas ─────────
export const MU_POS = 3.0, MU_NEG = 0, PREV = 0.1, N_POP = 1000;
export const pdf = (x: number, mu: number) => Math.exp(-0.5 * (x - mu) ** 2) / Math.sqrt(2 * Math.PI);
/** Φ(x): función de distribución normal estándar (aproximación 26.2.17 de Abramowitz y Stegun, 1964, p. 932; error < 3·10⁻⁷ con estas 7 cifras, comprobado en verify-data.ts). */
export function cdf(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
/** Matriz de confusión esperada sobre N_POP personas con un umbral t. */
export function confusion(t: number, prev = PREV, n = N_POP) {
  const pos = n * prev, neg = n - pos;
  const tp = pos * (1 - cdf(t - MU_POS)), fn = pos - tp, fp = neg * (1 - cdf(t - MU_NEG)), tn = neg - fp;
  return { tp, fp, fn, tn, precision: tp + fp > 0 ? tp / (tp + fp) : 1, recall: tp / pos, fpr: fp / neg };
}
