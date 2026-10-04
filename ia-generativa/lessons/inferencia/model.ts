// Matemática pura de la lección «Inferencia: cómo responde un modelo». Sin dibujo, sin DOM, determinista.
//
// ── De dónde sale cada número ─────────────────────────────────────────────────────────────────────
// 1) Arquitecturas (todas de fuentes primarias, ver `sources` en content.ts):
//    · Llama 3 8B y 70B: Llama Team (2024), arXiv:2407.21783, tabla 3. Capas 32 / 80; dimensión del modelo 4096 / 8192;
//      FFN 14 336 / 28 672; cabezas de atención 32 / 64; cabezas clave-valor 8 / 8; vocabulario 128 000. La dimensión por
//      cabeza no está en la tabla: es (dimensión del modelo ÷ cabezas) = 128 en ambos. Los parámetros se calculan abajo
//      (denseParams) y dan 8,03 y 70,6 mil millones.
//    · Mixtral 8x7B: Jiang et al. (2024), arXiv:2401.04088, tabla 1: dim 4096, capas 32, head_dim 128, hidden_dim 14 336,
//      cabezas 32, cabezas KV 8, vocabulario 32 000, 8 expertos, 2 por token. El artículo dice «47B parámetros, 13B activos».
//      Aquí se deriva el desglose exacto (46,7 y 12,9 mil millones) contando matrices.
// 2) Caché KV por token = 2 (clave y valor) × capas × cabezas KV × dimensión por cabeza × bytes por número.
//    Misma cuenta que Kwon et al. (2023), arXiv:2309.06180, §3: OPT-13B = 2 × 5120 × 40 × 2 B = 800 KB por token.
// 3) Tiempo de un paso de decodificación (Pope et al. 2022, arXiv:2211.05102, §2): hay un «tiempo de memoria» (bytes de
//    pesos y de caché que hay que mover desde la HBM ÷ ancho de banda) y un «tiempo de cálculo» (FLOPs ÷ pico). Con
//    lotes pequeños manda el de memoria. Aquí: t = máx(t_memoria, t_cálculo).
//       bytes por paso = bytes de pesos leídos + usuarios × contexto × bytes de caché por token
//       FLOPs por paso = usuarios × (2·N_activos + 4·capas·d_atención·contexto)     (PaLM, apéndice B: 12LHQT = 3 × 4LHQT)
// 4) Prefill: FLOPs = 2·N·L + 2·capas·d_atención·L² (atención causal), a una fracción MFU del pico (SUPUESTO: 40 %, del
//    orden de lo que reporta Llama 3 en entrenamiento, 38–43 %; en prefill de lotes grandes Pope et al. alcanzan 76 %).
// 5) Hardware (hojas de datos de NVIDIA): H100 SXM 80 GB, 3,35 TB/s, BF16 denso 989 TFLOPS (la hoja da 1 979 con
//    esparsidad: la mitad sin ella). A100 80 GB: 2 039 GB/s, BF16 denso 312 TFLOPS. RTX 3060 12 GB: bus de 192 bits a
//    15 Gbps = 360 GB/s.
// 6) Los precios son SUPUESTOS ilustrativos (US$ 2,00 por GPU-hora; US$ 3 y 15 por millón de tokens de entrada y salida).

export interface Arch {
  id: string; name: string;
  layers: number; dModel: number; heads: number; kvHeads: number; headDim: number; ffn: number; vocab: number;
}
export const LLAMA3_8B: Arch = { id: '8b', name: 'Llama 3 8B', layers: 32, dModel: 4096, heads: 32, kvHeads: 8, headDim: 128, ffn: 14336, vocab: 128000 };
export const LLAMA3_70B: Arch = { id: '70b', name: 'Llama 3 70B', layers: 80, dModel: 8192, heads: 64, kvHeads: 8, headDim: 128, ffn: 28672, vocab: 128000 };

/** Parámetros de un transformer denso (atención con GQA + FFN SwiGLU de 3 matrices + embeddings sin compartir). */
export function denseParams(a: Arch): number {
  const attn = a.dModel * a.heads * a.headDim * 2 + a.dModel * a.kvHeads * a.headDim * 2;   // Wq, Wo | Wk, Wv
  const ffn = 3 * a.dModel * a.ffn;
  return a.layers * (attn + ffn) + 2 * a.vocab * a.dModel;
}
/** Dimensión total de la atención (cabezas × dimensión por cabeza). */
export const dAttn = (a: Arch) => a.heads * a.headDim;

/** Bytes de caché KV por cada token de contexto. */
export const kvBytesPerToken = (a: Arch, bytes = 2) => 2 * a.layers * a.kvHeads * a.headDim * bytes;

// ── Mixtral 8x7B (tabla 1 del artículo) ──
export const MIXTRAL = { dim: 4096, layers: 32, headDim: 128, hidden: 14336, heads: 32, kvHeads: 8, vocab: 32000, experts: 8, topK: 2 };
export function mixtralParams() {
  const m = MIXTRAL;
  const attn = m.layers * (m.dim * m.heads * m.headDim * 2 + m.dim * m.kvHeads * m.headDim * 2);
  const emb = 2 * m.vocab * m.dim, router = m.layers * m.dim * m.experts;
  const shared = attn + emb + router;                                 // lo que todo token usa
  const oneExpert = 3 * m.dim * m.hidden;                             // SwiGLU: 3 matrices
  const expertsAll = m.layers * m.experts * oneExpert, expertsActive = m.layers * m.topK * oneExpert;
  return { shared, expertsAll, expertsActive, total: shared + expertsAll, active: shared + expertsActive };
}
/** Fracción esperada de expertos que alguien consulta en una capa con un lote de B tokens (enrutamiento uniforme: SUPUESTO). */
export const expertsTouched = (B: number, E = MIXTRAL.experts, k = MIXTRAL.topK) => 1 - Math.pow(1 - k / E, B);

// ── hardware ──
export interface Gpu { id: string; name: string; mem: number; bw: number; peak: number }
export const H100: Gpu = { id: 'h100', name: 'H100 SXM', mem: 80e9, bw: 3.35e12, peak: 989e12 };
export const A100: Gpu = { id: 'a100', name: 'A100 80 GB', mem: 80e9, bw: 2.039e12, peak: 312e12 };
export const RTX3060: Gpu = { id: '3060', name: 'RTX 3060 12 GB', mem: 12e9, bw: 360e9, peak: 0 };   // el pico no se usa en la lección

// ── el modelo de servicio de la lección ──
export const PRICE_GPU_HOUR = 2.0;                        // US$, supuesto ilustrativo (igual que la lección 24)
export const PRICE_IN = 3, PRICE_OUT = 15;                // US$ por millón de tokens, supuestos ilustrativos (relación 1:5)
export const CACHE_READ = 0.1;                            // lectura de caché de prompt: 0,1 × el precio de entrada
export const MFU_PREFILL = 0.4;

export interface Step { bytesW: number; bytesKV: number; tMem: number; tComp: number; t: number; bound: 'mem' | 'comp' }
/** Un paso de decodificación (una vuelta: un token por usuario). `wBytes` = bytes de pesos leídos en la vuelta. */
export function decodeStep(a: Arch, g: Gpu, wBytes: number, users: number, ctx: number, kvBytes = 2): Step {
  const bytesW = wBytes, bytesKV = users * ctx * kvBytesPerToken(a, kvBytes);
  const flops = users * (2 * denseParams(a) + 4 * a.layers * dAttn(a) * ctx);
  const tMem = (bytesW + bytesKV) / g.bw, tComp = g.peak > 0 ? flops / (g.peak * 0.5) : 0;   // el cálculo rinde ≈ 50 % del pico (supuesto)
  return { bytesW, bytesKV, tMem, tComp, t: Math.max(tMem, tComp), bound: tMem >= tComp ? 'mem' : 'comp' };
}

export interface Serve {
  step: Step; perUser: number; throughput: number; costPerM: number;
  memUsed: number; fits: boolean; maxUsers: number; compUse: number;
}
/** Servicio con `users` conversaciones simultáneas de `ctx` tokens cada una (modelo denso, pesos de `bytesPer` bytes). */
export function serve(a: Arch, g: Gpu, bytesPer: number, users: number, ctx: number, price = PRICE_GPU_HOUR): Serve {
  const wBytes = denseParams(a) * bytesPer, step = decodeStep(a, g, wBytes, users, ctx);
  const memUsed = wBytes + users * ctx * kvBytesPerToken(a);
  const free = g.mem - wBytes, per = ctx * kvBytesPerToken(a);
  const throughput = users / step.t;
  const flops = users * (2 * denseParams(a) + 4 * a.layers * dAttn(a) * ctx);
  return {
    step, perUser: 1 / step.t, throughput, costPerM: (price / (3600 * throughput)) * 1e6,
    memUsed, fits: memUsed <= g.mem, maxUsers: free > 0 ? Math.floor(free / per) : 0,
    compUse: Math.min(1, flops / (g.peak * step.t)),
  };
}

/** Tiempo de prefill (s) de `L` tokens: cálculo de 2·N·L + atención causal, a una fracción MFU del pico. */
export function prefillTime(a: Arch, g: Gpu, L: number, mfu = MFU_PREFILL): number {
  const flops = 2 * denseParams(a) * L + 2 * a.layers * dAttn(a) * L * L;
  return flops / (g.peak * mfu);
}

// ── la tarea (turno 3) ──
export interface Task { tin: number; tout: number; cached: boolean }
export interface Bill {
  costIn: number; costOut: number; total: number; shareIn: number; ttft: number; gen: number; time: number; newIn: number;
}
/** Factura y tiempos de una tarea (modelo 8B en una H100, con 16 conversaciones en lote: SUPUESTO de la lección).
 *  Con caché de prompt se supone que el 90 % de la entrada es un inicio repetido: se cobra a 0,1 × y no se vuelve a procesar. */
export function bill(t: Task, users = 16): Bill {
  const hit = t.cached ? 0.9 : 0, newIn = t.tin * (1 - hit);
  const costIn = ((newIn + t.tin * hit * CACHE_READ) * PRICE_IN) / 1e6, costOut = (t.tout * PRICE_OUT) / 1e6;
  const ttft = prefillTime(LLAMA3_8B, H100, newIn) + 0.02;                  // + 20 ms de red y cola (supuesto)
  const ctxMid = t.tin + t.tout / 2;
  const st = decodeStep(LLAMA3_8B, H100, denseParams(LLAMA3_8B) * 2, users, ctxMid);
  const gen = t.tout * st.t;
  return { costIn, costOut, total: costIn + costOut, shareIn: costIn / (costIn + costOut), ttft, gen, time: ttft + gen, newIn };
}

// ── formato (mismos locales que Frame.n) ──
export type Lang = 'es' | 'en';
const loc = (l: Lang) => (l === 'es' ? 'es-MX' : 'en-US');
export const nf = (x: number, d: number, l: Lang) => x.toLocaleString(loc(l), { minimumFractionDigits: d, maximumFractionDigits: d });
/** Cifras significativas sin ceros finales (3 cifras). */
export function sig(x: number, l: Lang): string {
  const ax = Math.abs(x), d = ax >= 100 ? 0 : ax >= 10 ? 1 : ax >= 1 ? 2 : 3;
  const s = nf(x, d, l), sep = (1.5).toLocaleString(loc(l)).replace(/\d/g, '')[0];
  return d > 0 && s.includes(sep) ? s.replace(new RegExp(`\\${sep}?0+$`), '') : s;
}
/** Bytes → «16,1 GB» (decimal, como en las hojas de datos). */
export function gb(bytes: number, l: Lang, digits?: number): string {
  const g = bytes / 1e9;
  if (digits !== undefined) return `${nf(g, digits, l)} GB`;
  return `${sig(g, l)} GB`;
}
/** Segundos → «16 µs», «4,8 ms», «1,5 s». */
export function secs(s: number, l: Lang): string {
  if (s < 1e-3) return `${sig(s * 1e6, l)} µs`;
  if (s < 1) return `${sig(s * 1e3, l)} ms`;
  if (s < 90) return `${sig(s, l)} s`;
  return `${sig(s / 60, l)} min`;
}
export function usd(x: number, l: Lang): string {
  const p = l === 'es' ? 'US$ ' : '$';
  if (x >= 100) return p + nf(x, 0, l);
  if (x >= 1) return p + nf(x, 2, l);
  if (x >= 0.01) return p + nf(x, 3, l);
  return p + nf(x, 4, l);
}
/** Conteos de tokens con separador de miles. */
export const tok = (x: number, l: Lang) => nf(Math.round(x), 0, l);
export const bn = (x: number, l: Lang) => `${nf(x / 1e9, 1, l)}${l === 'es' ? ' mil M' : 'B'}`;
