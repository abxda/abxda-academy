// Números y cuentas de la lección «GPUs, memoria y cuantización». Sin dibujo ni DOM: determinista y puro.
//
// ── De dónde sale cada número ─────────────────────────────────────────────────────────────────────────────
// 1) Bytes por parámetro: FP32 = 4, FP16 = 2, INT8 = 1, INT4 = ½. Memoria de los pesos = parámetros × bytes por parámetro.
//    1 GB = 10⁹ bytes (como dicen las fichas de los fabricantes; «12 GB» de VRAM son en realidad 12 GiB: la diferencia,
//    del 7 %, no cambia ninguna conclusión de la lección y se explica en «por dentro»).
// 2) Entrenar con Adam en precisión mixta: 2 (pesos FP16) + 2 (gradientes FP16) + 4 (copia FP32) + 4 + 4 (los dos promedios de
//    Adam en FP32) = 16 bytes por parámetro: Rajbhandari et al. (2020, ZeRO), §3.1; Micikevicius et al. (2018).
//    Medido en una GeForce RTX 3060 (measure-memory.py, 2026-10-04): 16.05 bytes por parámetro con precisión mixta.
// 3) Hardware: H100 SXM, 80 GB HBM3, 3.35 TB/s, 16 896 núcleos FP32, 1 979 TFLOPS FP16 «con dispersión» (989 sin ella): ficha y
//    blog técnico de NVIDIA. RTX 3060: 12 GB GDDR6 con bus de 192 bits (ficha de NVIDIA); su ancho de banda se MIDIÓ: 333 GB/s
//    al copiar 1 GiB (measure-memory.py). Servidor de 8 H100 (como los de Meta para Llama 3: Llama Team, 2024, §3.3.1).
// 4) Llama 3.1: 8, 70 y 405 mil millones de parámetros (Llama Team, 2024, tabla 3; tamaños nominales). 405B entrenado con hasta
//    16 384 H100 = 8 (tensor) × 16 (tubería) × 128 (datos): tabla 4. En BF16 no cabe en un servidor de 8 H100: §6.1.
// 5) Cuantización: build-data.py (redondeo simétrico al más cercano, una escala por cada grupo de 32 pesos) sobre pesos reales de
//    Pythia-1.4B; la pérdida del modelo entero se midió sobre WikiText-2 (real-data.ts).
import { LOSS, PATCH, SAMPLE, ZERO_FRAC } from './real-data';

export const GB = 1e9;

// ── formatos de número ───────────────────────────────────────────────────────────────────────────────
export type FmtId = 'fp32' | 'fp16' | 'int8' | 'int4';
export interface Fmt { id: FmtId; name: string; bytes: number }
export const FMTS: Fmt[] = [
  { id: 'fp32', name: 'FP32', bytes: 4 },
  { id: 'fp16', name: 'FP16', bytes: 2 },
  { id: 'int8', name: 'INT8', bytes: 1 },
  { id: 'int4', name: 'INT4', bytes: 0.5 },
];
export const fmtOf = (id: string): Fmt => FMTS.find((f) => f.id === id) ?? FMTS[1];
export const weightsGB = (params: number, bytes: number) => (params * bytes) / GB;

// ── modelos de la calculadora (tamaños nominales) ─────────────────────────────────────────────────────────
export interface ModelSize { id: string; params: number; es: string; en: string; who: string }
export const MODELS: ModelSize[] = [
  { id: '1.4', params: 1.4e9, es: '1.4 mil M', en: '1.4B', who: 'Pythia' },
  { id: '8', params: 8e9, es: '8 mil M', en: '8B', who: 'Llama 3.1 8B' },
  { id: '70', params: 70e9, es: '70 mil M', en: '70B', who: 'Llama 3.1 70B' },
  { id: '405', params: 405e9, es: '405 mil M', en: '405B', who: 'Llama 3.1 405B' },
];
export const modelOf = (id: string): ModelSize => MODELS.find((m) => m.id === id) ?? MODELS[2];

// ── GPUs ─────────────────────────────────────────────────────────────────────────────────────────────────
export interface Gpu { id: string; es: string; en: string; sub: { es: string; en: string }; mem: number }
export const GPUS: Gpu[] = [
  { id: 'rtx', es: 'RTX 3060', en: 'RTX 3060', sub: { es: 'para videojuegos', en: 'gaming card' }, mem: 12 },
  { id: 'h100', es: 'H100', en: 'H100', sub: { es: 'centro de datos', en: 'data center' }, mem: 80 },
  { id: 'srv', es: '8 × H100', en: '8 × H100', sub: { es: 'un servidor', en: 'one server' }, mem: 640 },
];
export const H100 = { mem: 80, bwGBs: 3350, cores: 16896, tflopsDense: 989 };
/** Ancho de banda MEDIDO en una RTX 3060 (copiar 1 GiB; measure-memory.py). Se redondea a «unos 330» en la voz. */
export const RTX_BW_MEASURED = 333;
/** Operaciones que la H100 podría hacer mientras lee un parámetro de 2 bytes: 989 TFLOPS ÷ 3.35 TB/s × 2 ≈ 590. */
export const OPS_PER_PARAM = Math.round(((H100.tflopsDense * 1e12) / (H100.bwGBs * 1e9)) * 2);

// ── entrenar: bytes por parámetro ────────────────────────────────────────────────────────────────────────
export interface TrainPart { id: 'w' | 'g' | 'm1' | 'm2' | 'master'; bytes: number; tone: 'w' | 'err' | 'dat'; dither: boolean; es: string; en: string; seg: string }
export const TRAIN_PARTS: TrainPart[] = [
  { id: 'w', bytes: 2, tone: 'w', dither: false, es: 'parámetro (FP16)', en: 'parameter (FP16)', seg: 'train-grad' },
  { id: 'g', bytes: 2, tone: 'err', dither: false, es: 'gradiente (FP16)', en: 'gradient (FP16)', seg: 'train-grad' },
  { id: 'm1', bytes: 4, tone: 'dat', dither: false, es: 'Adam: promedio de la pendiente', en: 'Adam: average slope', seg: 'train-adam' },
  { id: 'm2', bytes: 4, tone: 'dat', dither: true, es: 'Adam: promedio del tamaño', en: 'Adam: average size', seg: 'train-adam' },
  { id: 'master', bytes: 4, tone: 'w', dither: true, es: 'copia del parámetro (FP32)', en: 'parameter copy (FP32)', seg: 'train-master' },
];
export const TRAIN_BYTES = TRAIN_PARTS.reduce((a, p) => a + p.bytes, 0);   // 16
export const TRAIN_MEASURED = 16.05;                                        // precisión mixta, Pythia-160M, RTX 3060

// ── el parámetro de ejemplo: PATCH[0][2] de la muestra real (capa 14, atención) ──────────────────────────────
export const EX = (() => {
  const w = PATCH[0][2];                                   // 0.02405 (redondeado a 5 decimales al guardar la muestra)
  const f16 = f16Value(w);                                 // el valor FP16 real: 0.0240478515625
  const top = Math.max(...PATCH[0].map((v) => Math.abs(v)));  // escala del grupo (la fila 0 de la muestra, 32 pesos)
  const L8 = Math.round(f16 / (top / 127)), L4 = Math.round(f16 / (top / 7));   // 68 y 4
  return { f16, L8, L4, q8: L8 * (top / 127), q4: L4 * (top / 7), top };
})();

/** Valor representable en FP16 (IEEE 754, binario16) más cercano a x (valores normales, suficiente para pesos ~10⁻²). */
export function f16Value(x: number): number {
  if (x === 0) return 0;
  const a = Math.abs(x), e = Math.floor(Math.log2(a)), step = 2 ** (e - 10);
  return Math.sign(x) * Math.round(a / step) * step;
}

// ── cuantización de la muestra de 32 × 32 (la misma regla de build-data.py, esquema «grupo») ────────────────────
/** Bits del deslizador: 16 = el original, sin cuantizar. No hay 7 bits: no se midió. */
export const BITS = [2, 3, 4, 5, 6, 8, 16];
export const bitsOf = (v: number | undefined) => BITS[Math.max(0, Math.min(BITS.length - 1, Math.round(v ?? BITS.length - 1)))];
export const bitsIndex = (b: number) => Math.max(0, BITS.indexOf(b));
export const P = SAMPLE.patch;                                // 32
export const W0: number[] = PATCH.flat();

export interface QuantOut { q: number[]; zero: number }
const qcache = new Map<number, QuantOut>();
/** Cuantiza la muestra: cada fila de 32 pesos es un grupo con su propia regla (escala = su máximo ÷ qmax). */
export function quantPatch(bits: number): QuantOut {
  const hit = qcache.get(bits); if (hit) return hit;
  if (bits >= 16) { const o = { q: W0.slice(), zero: 0 }; qcache.set(bits, o); return o; }
  const qmax = 2 ** (bits - 1) - 1, q: number[] = [];
  let zeros = 0;
  for (let r = 0; r < P; r++) {
    const row = PATCH[r], s = Math.max(...row.map((v) => Math.abs(v))) / qmax;
    for (let c = 0; c < P; c++) { const L = Math.max(-qmax, Math.min(qmax, Math.round(row[c] / s))); q.push(L * s); if (L === 0) zeros++; }
  }
  const o = { q, zero: zeros / (P * P) }; qcache.set(bits, o); return o;
}
/** Marcas de la regla de un grupo: −qmax…+qmax multiplicadas por la escala. */
export const rulerMarks = (bits: number, top: number): number[] => {
  const qmax = 2 ** (bits - 1) - 1, s = top / qmax, out: number[] = [];
  for (let k = -qmax; k <= qmax; k++) out.push(k * s);
  return out;
};
/** Pérdida medida del modelo entero (nats por token, WikiText-2) con las 96 matrices cuantizadas por grupos de 32. */
export const lossOf = (bits: number): number => (bits >= 16 ? LOSS.fp16 : (LOSS.group[String(bits)] ?? LOSS.fp16));
/** Fracción de pesos de la matriz entera que quedan en cero (medido en build-data.py). */
export const zeroOf = (bits: number): number => (bits >= 16 ? 0 : ZERO_FRAC.group[String(bits)] ?? 0);

// ── imagen ilustrativa para «menos tonos» (generada por fórmula; no es una foto) ─────────────────────────────
export const IW = 30, IH = 20;
/** Sol, dos colinas y un árbol, con degradados suaves. Tono de 0 (claro) a 1 (oscuro). */
export function picture(i: number, j: number): number {
  const x = (i + 0.5) / IW, y = (j + 0.5) / IH;
  let v = 0.15 + 0.45 * y;                                                     // cielo: más claro arriba
  const ds = Math.hypot(x - 0.72, (y - 0.3) * 1.5);
  v -= 0.15 * Math.exp(-((ds / 0.25) ** 2));                                   // resplandor
  if (ds < 0.11) v = 0.02;                                                     // sol
  const h1 = 0.62 + 0.07 * Math.sin(5 * x + 1), h2 = 0.8 + 0.07 * Math.sin(4 * x + 3);
  if (y > h1) v = 0.55 + 0.35 * (y - h1);                                      // colina lejana
  if (y > h2) v = 0.78 + 0.3 * (y - h2);                                       // colina cercana
  if (Math.abs(x - 0.2) < 0.018 && y > 0.5 && y < h2 + 0.02) v = 0.95;          // tronco
  if (Math.hypot(x - 0.2, (y - 0.46) * 1.3) < 0.085) v = 0.88;                 // copa
  return Math.max(0, Math.min(1, v));
}
export const posterize = (v: number, levels: number) => Math.round(v * (levels - 1)) / (levels - 1);

// ── bits reales de un número (para la vista de bytes) ─────────────────────────────────────────────────────
/** Los 32 bits de x en FP32 (IEEE 754, binario32). */
export const f32bits = (x: number): string => {
  const b = new DataView(new ArrayBuffer(4)); b.setFloat32(0, x);
  return b.getUint32(0).toString(2).padStart(32, '0');
};
/** Los 16 bits de x en FP16 (IEEE 754, binario16), redondeado al más cercano (solo valores normales). */
export const f16bits = (x: number): string => {
  const s = x < 0 ? 1 : 0, a = Math.abs(x);
  if (a === 0) return String(s) + '0'.repeat(15);
  let e = Math.floor(Math.log2(a)), mant = Math.round((a / 2 ** e - 1) * 1024);
  if (mant === 1024) { mant = 0; e += 1; }
  return String(s) + (e + 15).toString(2).padStart(5, '0') + mant.toString(2).padStart(10, '0');
};
/** Un entero en complemento a dos con `bits` bits. */
export const intBits = (q: number, bits: number): string => ((q + (1 << bits)) & ((1 << bits) - 1)).toString(2).padStart(bits, '0');
