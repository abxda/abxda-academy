// Matemática pura de la lección «GPUs, memoria y cuantización». Sin dibujo, sin DOM, determinista.
//
// ── De dónde sale cada número ─────────────────────────────────────────────────────────────────────
// 1) Bytes por parámetro: FP32 = 4, FP16 / BF16 = 2, INT8 = 1, INT4 = 0,5. Formatos (signo, exponente, mantisa): FP32 (1, 8, 23),
//    FP16 (1, 5, 10), BF16 (1, 8, 7) — Kalamkar et al. (2019), tabla 1. Memoria de los pesos = N · bytes por parámetro.
//    1 GB = 10⁹ bytes (como en las fichas de los fabricantes para el ancho de banda; las capacidades de VRAM de las fichas son en
//    realidad GiB: una «12 GB» muestra 12 288 MiB en nvidia-smi. La diferencia, 7 %, no cambia ninguna conclusión de la lección).
// 2) Entrenar con Adam en precisión mixta: 2 (pesos fp16) + 2 (gradientes fp16) + 12 (copia maestra fp32 + momento + varianza) =
//    16 bytes por parámetro — Rajbhandari et al. (2020, ZeRO), §3.1; Micikevicius et al. (2018). Medido en una RTX 3060: measure-memory.py.
// 3) Activaciones por capa de un transformer en 16 bits: s·b·h·(34 + 5·a·s/h) bytes (Korthikanti et al., 2022, ec. 1). El término
//    5·a·s/h es la atención (matriz s × s); con atención de memoria lineal (FlashAttention) solo queda 34·s·b·h. Si se recalcula
//    todo, se guarda solo la entrada de cada capa: 2·s·b·h (§5). s = longitud de secuencia, b = tamaño de lote, h = dimensión.
// 4) Modelos Llama 3 (Llama Team, 2024, tabla 3): 8B (32 capas, h = 4096), 70B (80, 8192), 405B (126, 16384).
// 5) Paralelismo: GPUs = TP · PP · DP (Llama 3.1 405B: 8 · 16 · 128 = 16 384; tabla 4). Burbuja del pipeline = (PP − 1) / M con M
//    micro-lotes (Narayanan et al., 2021; Llama Team, 2024, §3.3.2, sin entrelazado).
// 6) Hardware: fichas oficiales de NVIDIA (H100 SXM, A100 80 GB SXM, H200), AMD (MI300X) y GeForce RTX 3060 (12 GB GDDR6, 192 bits,
//    15 Gbps por pin = 360 GB/s). Los valores se verificaron en las páginas de producto (ver `sources` en content.ts).
// 7) Cuantización: build-data.py (redondeo simétrico, una escala por matriz o por grupo de 32), sobre pesos reales de Pythia-1.4B.
import { FULL_ERR, LOSS, PATCH, SAMPLE, ZERO_FRAC } from './real-data';

export const GB = 1e9;

// ── precisiones ─────────────────────────────────────────────────────────────────────────────────
export interface Prec { id: 'fp32' | 'fp16' | 'int8' | 'int4'; bits: number; es: string; en: string }
export const PRECS: Prec[] = [
  { id: 'fp32', bits: 32, es: 'FP32', en: 'FP32' },
  { id: 'fp16', bits: 16, es: 'FP16 / BF16', en: 'FP16 / BF16' },
  { id: 'int8', bits: 8, es: 'INT8', en: 'INT8' },
  { id: 'int4', bits: 4, es: 'INT4', en: 'INT4' },
];
export const precBits = (id: string) => PRECS.find((p) => p.id === id)?.bits ?? 16;
export const weightsGB = (N: number, bits: number) => (N * bits) / 8 / GB;

// ── GPUs (fichas oficiales; ver nota 6) ───────────────────────────────────────────────────────────
export interface Gpu { id: string; name: string; mem: number; bw: number; kind: string; units?: number }
export const GPUS: Gpu[] = [
  { id: 'rtx3060', name: 'RTX 3060', mem: 12, bw: 360, kind: 'GDDR6' },
  { id: 'a100', name: 'A100', mem: 80, bw: 2039, kind: 'HBM2e' },
  { id: 'h100', name: 'H100', mem: 80, bw: 3350, kind: 'HBM3' },
  { id: 'h200', name: 'H200', mem: 141, bw: 4800, kind: 'HBM3e' },
  { id: 'mi300x', name: 'MI300X', mem: 192, bw: 5300, kind: 'HBM3' },
  { id: 'dgx8', name: '8 × H100', mem: 640, bw: 3350, kind: 'NVLink', units: 8 },
];
/** Margen reservado para la caché de atención, las activaciones y el entorno de ejecución (SUPUESTO de la lección). */
export const MARGIN = 0.2;
export type Fit = 'ok' | 'tight' | 'no';
export const fitOf = (gb: number, mem: number): Fit => (gb <= mem * (1 - MARGIN) ? 'ok' : gb <= mem ? 'tight' : 'no');
export const cardsNeeded = (gb: number, mem: number) => Math.max(1, Math.ceil(gb / (mem * (1 - MARGIN))));

/** Pico de cálculo H100 SXM (FP16 tensor, denso) y su ancho de banda: la «razón de la máquina». */
export const H100 = { tflops: 989, bw: 3350 };
/** Operaciones que la H100 puede hacer por cada byte que lee: 989 TFLOPS / 3,35 TB/s ≈ 295. */
export const OPS_PER_BYTE = (H100.tflops * 1e12) / (H100.bw * 1e9);

// ── entrenar: bytes por parámetro ───────────────────────────────────────────────────────────────
export interface TrainPart { id: 'w' | 'g' | 'master' | 'm' | 'v'; bytes: number; tone: 'w' | 'err' | 'dat'; es: string; en: string; hatch: number }
export const TRAIN_PARTS: TrainPart[] = [
  { id: 'w', bytes: 2, tone: 'w', es: 'Pesos (FP16)', en: 'Weights (FP16)', hatch: 1 },
  { id: 'g', bytes: 2, tone: 'err', es: 'Gradientes (FP16)', en: 'Gradients (FP16)', hatch: 1 },
  { id: 'master', bytes: 4, tone: 'w', es: 'Copia de pesos (FP32)', en: 'Weight copy (FP32)', hatch: 0.55 },
  { id: 'm', bytes: 4, tone: 'dat', es: 'Momento de Adam (FP32)', en: 'Adam momentum (FP32)', hatch: 1 },
  { id: 'v', bytes: 4, tone: 'dat', es: 'Varianza de Adam (FP32)', en: 'Adam variance (FP32)', hatch: 0.55 },
];
export const TRAIN_BYTES = TRAIN_PARTS.reduce((a, p) => a + p.bytes, 0); // 16
export const trainGB = (N: number) => (N * TRAIN_BYTES) / GB;

export interface LlamaCfg { name: string; N: number; L: number; h: number }
export const LLAMA: Record<string, LlamaCfg> = {
  '8B': { name: '8B', N: 8e9, L: 32, h: 4096 },
  '70B': { name: '70B', N: 70e9, L: 80, h: 8192 },
  '405B': { name: '405B', N: 405e9, L: 126, h: 16384 },
};
/** Memoria de activaciones (bytes) de un transformer en 16 bits con `tokens` = s·b por paso (nota 3). */
export const actBytes = (c: LlamaCfg, tokens: number, recompute: boolean) => (recompute ? 2 : 34) * c.h * c.L * tokens;

// ── paralelismo (el turno 2) ────────────────────────────────────────────────────────────────────
export const SPLIT = { N: 70e9, layers: 80, gpuMem: 80, reserve: 0.25, micro: 32, maxTP: 8 };
export interface SplitOut { gpus: number; perGpu: number; budget: number; fits: boolean; bubble: number; tpOk: boolean; statesGB: number }
export function splitOf(tp: number, pp: number, dp: number): SplitOut {
  const statesGB = trainGB(SPLIT.N), perGpu = statesGB / (tp * pp), budget = SPLIT.gpuMem * (1 - SPLIT.reserve);
  return { gpus: tp * pp * dp, perGpu, budget, fits: perGpu <= budget, bubble: (pp - 1) / SPLIT.micro, tpOk: tp <= SPLIT.maxTP, statesGB };
}

// ── bits reales de un número (para la escena de «bytes») ───────────────────────────────────────
export const f32bits = (x: number): string => {
  const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, x);
  return b.getUint32(0).toString(2).padStart(32, '0');
};
export const bf16bits = (x: number): string => {
  const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, x);
  const u = b.getUint32(0), r = ((u + 0x7fff + ((u >>> 16) & 1)) >>> 0) >>> 16;   // redondeo al más cercano (par)
  return r.toString(2).padStart(16, '0');
};
/** IEEE 754 binario16 con redondeo al más cercano (solo valores normales, suficiente para pesos de magnitud ~10⁻²). */
export const f16bits = (x: number): string => {
  const s = x < 0 ? 1 : 0, a = Math.abs(x);
  if (a === 0) return String(s) + '0'.repeat(15);
  let e = Math.floor(Math.log2(a)); let m = a / 2 ** e - 1;
  let mant = Math.round(m * 1024);
  if (mant === 1024) { mant = 0; e += 1; }
  const exp = e + 15;
  return String(s) + exp.toString(2).padStart(5, '0') + mant.toString(2).padStart(10, '0');
};
export const intBits = (q: number, bits: number): string => ((q + (1 << bits)) & ((1 << bits) - 1)).toString(2).padStart(bits, '0');

/** El peso de mayor magnitud de la muestra (para mostrar sus bits). */
export const BIG = (() => {
  let best = { v: 0, r: 0, c: 0 };
  PATCH.forEach((row, r) => row.forEach((v, c) => { if (Math.abs(v) > Math.abs(best.v)) best = { v, r, c }; }));
  return best;
})();

// ── cuantización de la muestra (la misma regla de build-data.py) ─────────────────────────────────
/** Los pesos originales de la muestra, 32×32 en orden de fila. */
export const PATCH_F32 = (() => { const P = SAMPLE.patch, a = new Float32Array(P * P); PATCH.forEach((row, r) => row.forEach((v, c) => (a[r * P + c] = v))); return a; })();
export type Scheme = 'tensor' | 'group';
export interface QuantOut {
  q: Float32Array;            // pesos ya cuantizados (des-cuantizados), 32×32 en orden de fila
  lev: Int16Array;            // nivel entero de cada peso
  err: number;                // error relativo en la muestra: ||w − w'|| / ||w||
  zero: number;               // fracción de pesos de la muestra que se redondean a cero
  scaleMax: Float32Array;     // máximo que fija la escala de cada peso (para normalizar el histograma)
  qmax: number;
  hist: Float32Array;         // histograma de w / escala máxima en [−1, 1] (NB bins)
  used: number;               // niveles distintos ocupados por al menos el 1 % de la muestra
  usedPct: number;
}
export const NB = 41;
const cache = new Map<string, QuantOut>();
export function quantOf(bits: number, scheme: Scheme): QuantOut {
  const key = `${bits}|${scheme}`, hit = cache.get(key);
  if (hit) return hit;
  const P = SAMPLE.patch, n = P * P, qmax = 2 ** (bits - 1) - 1;
  const w = new Float32Array(n); PATCH.forEach((row, r) => row.forEach((v, c) => (w[r * P + c] = v)));
  const q = new Float32Array(n), lev = new Int16Array(n), sm = new Float32Array(n), hist = new Float32Array(NB);
  let num = 0, den = 0, zeros = 0;
  for (let r = 0; r < P; r++) {
    // esquema «grupo»: cada fila de la muestra son 32 pesos = un grupo (el tamaño de grupo de build-data.py)
    let rowMax = 0; for (let c = 0; c < P; c++) rowMax = Math.max(rowMax, Math.abs(w[r * P + c]));
    const top = scheme === 'tensor' ? SAMPLE.absmax : Math.max(rowMax, 1e-12), s = top / qmax;
    for (let c = 0; c < P; c++) {
      const i = r * P + c, L = Math.max(-qmax, Math.min(qmax, Math.round(w[i] / s)));
      lev[i] = L; q[i] = L * s; sm[i] = top; num += (w[i] - q[i]) ** 2; den += w[i] ** 2; if (L === 0) zeros++;
      const x = w[i] / top, b = Math.min(NB - 1, Math.max(0, Math.floor(((x + 1) / 2) * NB))); hist[b]++;
    }
  }
  const counts = new Map<number, number>(); lev.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
  let used = 0; counts.forEach((c) => { if (c >= 0.01 * n) used++; });
  const out: QuantOut = { q, lev, err: Math.sqrt(num / den), zero: zeros / n, scaleMax: sm, qmax, hist, used, usedPct: used / (2 * qmax + 1) };
  cache.set(key, out);
  return out;
}
/** Valores de la tabla medida (offline) para toda la matriz y para todo el modelo. */
export const fullErr = (bits: number, scheme: Scheme) => FULL_ERR[scheme][String(bits)];
export const fullZero = (bits: number, scheme: Scheme) => ZERO_FRAC[scheme][String(bits)];
export const modelLoss = (bits: number, scheme: Scheme): number | null => (bits >= 16 ? LOSS.fp16 : (LOSS[scheme][String(bits)] ?? null));
export const BITS_LIST = [2, 3, 4, 5, 6, 8];
/** Bits efectivos por peso: la escala fp16 de cada grupo de 32 añade 16/32 = 0,5 bit (como el bloque Q4_0 de llama.cpp: 18 bytes por 32 pesos). */
export const effBits = (bits: number, scheme: Scheme) => bits + (scheme === 'group' ? 16 / SAMPLE.group : 0);

// ── mediciones propias (measure-memory.py, RTX 3060 de 12 GB, 2026-10-04) ───────────────────────────
export const MEASURED = {
  fp32: { afterStep: 16.19 },          // bytes por parámetro tras el primer paso de AdamW (fp32 completo)
  mixed: { afterStep: 16.05 },         // precisión mixta con copia maestra fp32
  copyGBps: 333,                       // copiar 1 GiB: 333 GB/s de los 360 de la ficha
  matvec: { ms: 1.57, GBps: 341, tflops: 0.34 },
  matmulTflops: 27.7,                  // el mismo chip con 4096 vectores a la vez
  actRatio: 0.949,                     // activaciones medidas / (34·s·b·h·L)
};

// ── formato de números (mismos locales que Frame.n: es-MX → punto decimal; en-US) ─────────────────────
type Lang = 'es' | 'en';
const loc = (lang: Lang) => (lang === 'es' ? 'es-MX' : 'en-US');
export const nf = (x: number, digits: number, lang: Lang) => x.toLocaleString(loc(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
/** Cifras con 3 cifras significativas aproximadas. */
export function sig(x: number, lang: Lang): string {
  const ax = Math.abs(x), d = ax >= 100 ? 0 : ax >= 10 ? 1 : 2;
  const s = nf(x, d, lang), sep = (1.5).toLocaleString(loc(lang)).replace(/\d/g, '')[0];
  return d > 0 && s.includes(sep) ? s.replace(new RegExp(`\\${sep}?0+$`), '') : s;
}
/** Conteos de parámetros: «13 mil M» / «13B». */
export function count(x: number, lang: Lang): string {
  if (x < 1e6) return nf(Math.round(x), 0, lang);
  if (lang === 'es') {
    if (x < 1e9) return `${sig(x / 1e6, lang)} M`;
    if (x < 1e12) return `${sig(x / 1e9, lang)} mil M`;
    const v = sig(x / 1e12, lang); return `${v} ${v === '1' ? 'billón' : 'billones'}`;
  }
  if (x < 1e9) return `${sig(x / 1e6, lang)}M`;
  if (x < 1e12) return `${sig(x / 1e9, lang)}B`;
  return `${sig(x / 1e12, lang)}T`;
}
export function gbText(gb: number, lang: Lang): string {
  if (gb >= 1000) return `${nf(gb / 1000, gb >= 10000 ? 0 : 1, lang)} TB`;
  return `${sig(gb, lang)} GB`;
}
export const bwText = (gbps: number, lang: Lang) => (gbps >= 1000 ? `${nf(gbps / 1000, 2, lang)} TB/s` : `${nf(gbps, 0, lang)} GB/s`);
export const ms = (x: number, lang: Lang) => `${sig(x, lang)} ms`;
