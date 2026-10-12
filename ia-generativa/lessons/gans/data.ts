// Las GAN diminutas de la lección, ejecutadas de verdad (solo la pasada hacia delante) con los pesos que exportaron
// train_gan.py (gan-data.ts) y train_detective.py (detective-data.ts). Nada se simula: cada histograma, cada curva del
// detective y cada conteo sale de correr estas redes. Los resultados se guardan en caché (son deterministas), así que
// render() sigue siendo una función pura del tiempo y de los controles.
//
// Cada red: x → 10 tanh → 10 tanh → salida (141 parámetros). Orden: W1 (10×1), b1 (10), W2 (10×10), b2 (10), W3 (1×10), b3 (1).
// Generador (falsificador): z ~ N(0, 1) → x.  Discriminador (detective): x → logit; D(x) = sigmoide(logit) ∈ (0, 1).
import { GRID_1, GRID_5, HID, ITS, RUN_A, RUN_B, SCALE, SEED_B } from './gan-data';
import { DET, DET_ITS } from './detective-data';

export { ITS, SEED_B, DET_ITS };
export const NP = 141;
const H = HID;

function dec(b64: string): Float64Array {
  const bin = atob(b64), n = bin.length >> 1, out = new Float64Array(n);
  for (let i = 0; i < n; i++) { let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); if (v & 0x8000) v -= 0x10000; out[i] = v / SCALE; }
  return out;
}
const RA = dec(RUN_A), RB = dec(RUN_B), G1 = dec(GRID_1), G5 = dec(GRID_5), DA = dec(DET);

/** Una red: pesos y desplazamiento dentro del arreglo. */
export interface Net { p: Float64Array; off: number }
const h1 = new Float64Array(H), h2 = new Float64Array(H);
/** Pasada hacia delante de una red 1 → 10 → 10 → 1 con tanh. */
export function fwd(n: Net, x: number): number {
  const p = n.p, o = n.off, W1 = o, b1 = o + H, W2 = o + 2 * H, b2 = W2 + H * H, W3 = b2 + H, b3 = W3 + H;
  for (let i = 0; i < H; i++) h1[i] = Math.tanh(p[W1 + i] * x + p[b1 + i]);
  for (let i = 0; i < H; i++) { let s = p[b2 + i]; for (let j = 0; j < H; j++) s += p[W2 + i * H + j] * h1[j]; h2[i] = Math.tanh(s); }
  let s = p[b3]; for (let j = 0; j < H; j++) s += p[W3 + j] * h2[j];
  return s;
}
export const sig = (v: number) => 1 / (1 + Math.exp(-v));
/** Lo que responde el detective: probabilidad de que x sea real. */
export const judge = (d: Net, x: number) => sig(fwd(d, x));

export type Run = 'A' | 'B';
/** Corrida A: sana (k = 1). Corrida B: el detective da cinco pasos por cada paso del falsificador (k = 5) y colapsa. */
export const gen = (r: Run, i: number): Net => ({ p: r === 'A' ? RA : RB, off: i * 2 * NP });
export const det = (r: Run, i: number): Net => ({ p: r === 'A' ? RA : RB, off: i * 2 * NP + NP });
/** El detective entrenado solo contra el falsificador novato (corrida A, punto 0), en el paso DET_ITS[i]. */
export const detAlone = (i: number): Net => ({ p: DA, off: i * NP });
/** Generador final de la semilla s (0–19) con k = 1 o k = 5. */
export const gridGen = (k: 1 | 5, s: number): Net => ({ p: k === 1 ? G1 : G5, off: s * NP });

// ── sorteos deterministas ───────────────────────────────────────────────────
/** Inversa de la distribución normal estándar (Acklam; error relativo < 1.2e-9). */
export function icdf(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q: number) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
/** Los 800 sorteos de la campana estándar (cuantiles, como NZ y ZQ en train_gan.py). */
export const NZ = 800;
export const ZQ: number[] = Array.from({ length: NZ }, (_, i) => icdf((i + 0.5) / NZ));
/** Las dos montañas reales: N(−1.5, 0.4²) y N(+1.5, 0.4²), 400 datos cada una (cuantiles de cada campana). */
export const MODES = [-1.5, 1.5] as const, SD = 0.4;
const RZ = Array.from({ length: NZ / 2 }, (_, i) => icdf((i + 0.5) / (NZ / 2)));
export const REAL: number[] = [...RZ.map((z) => MODES[0] + SD * z), ...RZ.map((z) => MODES[1] + SD * z)];

// ── histogramas ─────────────────────────────────────────────────────────────
/** Tramos de 0.25 centrados en −3.5, −3.25, …, 3.5 (el centro de cada montaña cae en el centro de un tramo). */
export const BW = 0.25, X0 = -3.625, NB = 29;
export const binCenter = (b: number) => X0 + (b + 0.5) * BW;
export function hist(xs: number[]): number[] {
  const h = new Array(NB).fill(0);
  for (const x of xs) { const b = Math.floor((x - X0) / BW); if (b >= 0 && b < NB) h[b]++; }
  return h;
}
export const REAL_HIST = hist(REAL);

/** «Cubre una montaña» (la definición de train_gan.py): fracción de los 800 falsos a menos de 0.8 del centro de cada montaña. */
export const coverage = (xs: number[]): [number, number] => MODES.map((m) => xs.filter((x) => Math.abs(x - m) < 0.8).length / xs.length) as [number, number];
/** Cubre las dos montañas: al menos 20 % de los falsos en cada una. Colapso: una montaña recibe menos de 5 %. */
export const coversBoth = (c: [number, number]) => Math.min(c[0], c[1]) >= 0.2;
export const collapsed = (c: [number, number]) => Math.min(c[0], c[1]) < 0.05;

// ── estado de una red en un punto del entrenamiento (en caché) ─────────────
export interface GenStats { fakes: number[]; hist: number[]; cov: [number, number] }
const gCache = new Map<string, GenStats>();
export function genStats(key: string, g: Net): GenStats {
  let s = gCache.get(key);
  if (!s) { const fakes = ZQ.map((z) => fwd(g, z)); s = { fakes, hist: hist(fakes), cov: coverage(fakes) }; gCache.set(key, s); }
  return s;
}
/** Curva del detective: D(x) en NC puntos de −3.5 a 3.5. */
export const NC = 141, CX0 = -3.5, CX1 = 3.5;
export const curveX = (i: number) => CX0 + ((CX1 - CX0) * i) / (NC - 1);
const dCache = new Map<string, number[]>();
export function detCurve(key: string, d: Net): number[] {
  let c = dCache.get(key);
  if (!c) { c = Array.from({ length: NC }, (_, i) => judge(d, curveX(i))); dCache.set(key, c); }
  return c;
}
/** Promedio de lo que responde el detective a una lista de números. */
const mCache = new Map<string, number>();
export function meanJudge(key: string, d: Net, xs: number[]): number {
  let m = mCache.get(key);
  if (m === undefined) { m = xs.reduce((s, x) => s + judge(d, x), 0) / xs.length; mCache.set(key, m); }
  return m;
}

/** Todo lo de un punto de control de una corrida. */
export function checkpoint(r: Run, i: number) {
  const g = genStats(`${r}${i}`, gen(r, i)), D = det(r, i);
  return {
    it: ITS[i], ...g, D,
    curve: detCurve(`${r}${i}`, D),
    dReal: meanJudge(`${r}${i}r`, D, REAL),
    dFake: meanJudge(`${r}${i}f`, D, g.fakes),
  };
}
export const LAST = ITS.length - 1;
/** Índice del punto de control más cercano a un paso de entrenamiento. */
export function ckAt(step: number): number {
  let best = 0;
  ITS.forEach((v, i) => { if (Math.abs(v - step) < Math.abs(ITS[best] - step)) best = i; });
  return best;
}

/** Las 40 corridas: generador final de cada semilla, con su cobertura. */
export function grid() {
  return ([1, 5] as const).map((k) => Array.from({ length: 20 }, (_, s) => genStats(`g${k}-${s}`, gridGen(k, s))));
}
