// Modelos numéricos de la lección «El big bang del deep learning». Todo es matemática pura y determinista (sin DOM).
//
//  1) Pila de capas de juguete: retropropagación REAL del gradiente a través de D capas tanh, con y sin atajo (conexión residual).
//     - Ancho 16, pesos W_l ~ N(0, σ²/16) con σ² = 1/3: es la varianza de la inicialización «estándar» de la época,
//       U(−1/√n, 1/√n) (Glorot y Bengio, 2010, ec. 15: n·Var[W] = 1/3). Con ella, en su experimento, el factor por capa de
//       la señal retropropagada baja a ≈ 0,5; aquí sale ≈ 0,56.
//     - La red es la MISMA con y sin atajo (mismos pesos y misma entrada); lo único que cambia es la suma «+ x».
//     - Se parte de un gradiente de norma 1 en la salida y se mide la norma del gradiente que llega a la salida de cada capa.
//     - Semilla fija (SEED = 5, elegida porque su curva es típica entre las semillas 1–5: con 40 capas la red simple termina
//       entre 1e-10 y 1e-9 y la residual entre 3 y 16). Reproducible: ver gradients.py (mismo algoritmo, otro generador).
//  2) Carrera ilustrativa de multiplicación de matrices (conteo ideal de pasos; NO son tiempos de hardware real).
//  3) Funciones de activación y sus pendientes (tanh, ReLU).
import { gauss, rng } from '../../../../../theme/kit';

// ───────────────────────── 1) pila de capas ─────────────────────────
export const D_MAX = 40;
export const WIDTH = 16;
const SEED = 5;
const SIGMA = Math.sqrt(1 / 3);

interface Stack { W: number[][][]; x0: number[] }
let STACK: Stack | null = null;
function stack(): Stack {
  if (STACK) return STACK;
  const r = rng(SEED);
  const W: number[][][] = [];
  for (let l = 0; l < D_MAX; l++) {
    const M: number[][] = [];
    for (let i = 0; i < WIDTH; i++) { const row: number[] = []; for (let j = 0; j < WIDTH; j++) row.push(gauss(r) * SIGMA / Math.sqrt(WIDTH)); M.push(row); }
    W.push(M);
  }
  const x0 = Array.from({ length: WIDTH }, () => gauss(r));
  return (STACK = { W, x0 });
}

export interface GradRun {
  /** norms[k] = norma del gradiente tras retropropagar k capas desde la salida (k = 0: salida, norma 1; k = depth: entrada). */
  norms: number[];
  depth: number;
  residual: boolean;
}
const CACHE = new Map<string, GradRun>();

/** Pase hacia delante y retropropagación por D capas. h_{l+1} = tanh(W_l h_l)  (simple)  o  h_l + tanh(W_l h_l)  (residual). */
export function gradRun(depth: number, residual: boolean): GradRun {
  const D = Math.max(1, Math.min(D_MAX, Math.round(depth)));
  const key = `${D}|${residual ? 1 : 0}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const { W, x0 } = stack();
  let h = x0.slice();
  const ts: number[][] = [];
  for (let l = 0; l < D; l++) {
    const t = W[l].map((row) => Math.tanh(row.reduce((s, w, j) => s + w * h[j], 0)));
    ts.push(t);
    h = residual ? h.map((v, i) => v + t[i]) : t;
  }
  let g = new Array(WIDTH).fill(1 / Math.sqrt(WIDTH));        // gradiente de norma 1 en la salida
  const norms = [1];
  for (let l = D - 1; l >= 0; l--) {
    const gz = g.map((v, i) => v * (1 - ts[l][i] ** 2));       // derivada de tanh
    const gin = new Array(WIDTH).fill(0);
    for (let i = 0; i < WIDTH; i++) for (let j = 0; j < WIDTH; j++) gin[j] += W[l][i][j] * gz[i];   // Wᵀ (g ⊙ tanh')
    g = residual ? g.map((v, j) => v + gin[j]) : gin;           // con atajo: el gradiente pasa intacto y se SUMA la rama
    norms.push(Math.hypot(...g));
  }
  const run = { norms, depth: D, residual };
  CACHE.set(key, run);
  return run;
}

/** Norma del gradiente que llega a la salida de la capa l (1 = primera, depth = última). */
export const normAtLayer = (run: GradRun, l: number) => run.norms[run.depth - l];

/** Para comprobar el algoritmo en pruebas: gradiente numérico de la salida respecto de la entrada (diferencias finitas). */
export function finiteDiffInputGrad(depth: number, residual: boolean, eps = 1e-6): number[] {
  const { W, x0 } = stack();
  const f = (x: number[]) => {
    let h = x.slice();
    for (let l = 0; l < depth; l++) { const t = W[l].map((row) => Math.tanh(row.reduce((s, w, j) => s + w * h[j], 0))); h = residual ? h.map((v, i) => v + t[i]) : t; }
    return h.reduce((s, v) => s + v / Math.sqrt(WIDTH), 0);   // L = suma de la salida / √16 → gradiente de salida = 1/√16 en cada unidad
  };
  return x0.map((_, i) => { const a = x0.slice(), b = x0.slice(); a[i] += eps; b[i] -= eps; return (f(a) - f(b)) / (2 * eps); });
}
export const analyticInputGradNorm = (depth: number, residual: boolean) => gradRun(depth, residual).norms[depth];

// ───────────────────────── 2) carrera ilustrativa CPU / GPU ─────────────────────────
export interface Hardware { id: 'gtx580' | 'rtx3060'; cores: number; name: string; year: number }
/** Núcleos CUDA según las fichas de producto de NVIDIA: GTX 580 (2010) 512; RTX 3060 (2021) 3584. */
export const GPUS: Record<Hardware['id'], Hardware> = {
  gtx580: { id: 'gtx580', cores: 512, name: 'GTX 580', year: 2010 },
  rtx3060: { id: 'rtx3060', cores: 3584, name: 'RTX 3060', year: 2021 },
};
/** Supuesto ilustrativo (no es una medición): una CPU de escritorio con 8 núcleos. */
export const CPU_CORES = 8;

export interface Race {
  n: number;
  cells: number;        // n² celdas independientes (cada una es un producto punto de n multiplicaciones-suma)
  nbCpu: number;        // lotes que necesita la CPU
  nbGpu: number;        // lotes que necesita la GPU
  stepsCpu: number;     // pasos ideales (una multiplicación-suma por núcleo y por paso) = lotes × n
  stepsGpu: number;
  speedup: number;      // pasos CPU / pasos GPU
  usedGpu: number;      // núcleos de la GPU con trabajo en el primer lote
  util: number;         // fracción de núcleos de la GPU en uso
  secPerBatch: number;  // duración de un lote en la animación
  totalSec: number;     // duración total de la animación (la termina la GPU)
}
export function raceModel(n: number, hw: Hardware['id']): Race {
  const cells = n * n, P = GPUS[hw].cores;
  const nbCpu = Math.ceil(cells / CPU_CORES), nbGpu = Math.ceil(cells / P);
  const secPerBatch = Math.min(1.2, Math.max(0.4, 2.4 / nbGpu));
  return {
    n, cells, nbCpu, nbGpu, stepsCpu: nbCpu * n, stepsGpu: nbGpu * n, speedup: nbCpu / nbGpu,
    usedGpu: Math.min(P, cells), util: Math.min(1, cells / P), secPerBatch, totalSec: nbGpu * secPerBatch,
  };
}
/** Estado de un procesador tras b lotes (b fraccionario): celdas terminadas y celdas en curso con su avance 0..1. */
export function raceProgress(cells: number, cores: number, b: number) {
  const nb = Math.ceil(cells / cores), bb = Math.max(0, Math.min(nb, b));
  const full = Math.min(nb, Math.floor(bb)), frac = full >= nb ? 0 : bb - full;
  const done = Math.min(cells, full * cores), live = full >= nb ? 0 : Math.min(cores, cells - done);
  return { done, live, frac, finished: bb >= nb };
}

// ───────────────────────── 3) activaciones ─────────────────────────
export const tanhD = (x: number) => 1 - Math.tanh(x) ** 2;
export const reluF = (x: number) => Math.max(0, x);
export const reluD = (x: number) => (x > 0 ? 1 : 0);

// ───────────────────────── matriz de juguete para ilustrar C = A·B ─────────────────────────
export const MA = [[1, 2, 0, 1], [0, 1, 3, 1], [2, 0, 1, 2], [1, 1, 2, 0]];
export const MB = [[2, 0, 1, 1], [1, 3, 0, 2], [0, 1, 2, 1], [3, 1, 1, 0]];
export const MC = MA.map((row) => MB[0].map((_, j) => row.reduce((s, v, k) => s + v * MB[k][j], 0)));
