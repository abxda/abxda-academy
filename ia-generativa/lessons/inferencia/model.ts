// Matemática pura de la lección «Inferencia: cómo responde un modelo». Sin dibujo, sin DOM, determinista.
//
// ── De dónde sale cada número (ver `sources` en content.ts y docs/v2/verificacion/inferencia.md) ──────────────────────
// 1) Llama 3 8B (Llama Team, 2024, arXiv:2407.21783, tabla 3): 32 capas (bloques), dimensión 4 096, FFN 14 336,
//    32 cabezas de atención, 8 cabezas de clave-valor (GQA), vocabulario 128 000; ventana de contexto de hasta 128 000 tokens
//    (§3.4.2). La dimensión por cabeza no está en la tabla: 4 096 ÷ 32 = 128. Los parámetros se cuentan abajo: 8.03 mil M.
// 2) Caché KV por token = 2 (clave y valor) × capas × cabezas KV × dimensión por cabeza × bytes por número
//    = 2 × 32 × 8 × 128 × 2 = 131 072 bytes. Es la misma cuenta que Kwon et al. (2023, arXiv:2309.06180, §3) para OPT-13B.
// 3) H100 SXM (página de NVIDIA): 80 GB, 3.35 TB/s; 1 979 TFLOPS en BF16 «con dispersión», es decir 989 sin ella.
// 4) Una vuelta de decodificación (Pope et al., 2022, arXiv:2211.05102, §2): «tiempo de memoria» = bytes de pesos y de caché
//    que hay que traer de la HBM ÷ ancho de banda; «tiempo de cálculo» = FLOPs ÷ cálculo útil. Manda el mayor.
//    FLOPs por token ≈ 2·N (Kaplan et al., 2020) + 4·capas·d_atención·contexto (atención; PaLM, apéndice B).
//    SUPUESTO: el cálculo útil en la decodificación es la mitad del pico. En todos los casos de la lección manda la memoria.
// 5) Llenado (prefill): FLOPs = 2·N·L + 2·capas·d_atención·L² (atención causal), a una fracción del pico.
//    SUPUESTO: 40 % (del orden del 38–43 % que Llama 3 reporta al entrenar; Pope et al. llegan a 76 % con lotes grandes).
// 6) Precios: SUPUESTOS rotulados. US$ 2 por hora de GPU (el mismo de la lección 24). Para la API, US$ 3 y 15 por millón de
//    tokens de entrada y de salida: la proporción 1 : 5 es la de todos los modelos de la lista de Anthropic consultada el
//    2026-10-12 (y la lista de Google va de 1 : 5 a más de 1 : 8).
// 7) Mixtral 8x7B (Jiang et al., 2024, arXiv:2401.04088): 8 expertos por capa, 2 por token; 47 mil M de parámetros, 13 mil M
//    activos. La tabla 1 da la arquitectura; contada abajo da 46.7 y 12.9 mil M.

export const LLAMA = { layers: 32, dModel: 4096, heads: 32, kvHeads: 8, headDim: 128, ffn: 14336, vocab: 128000, maxCtx: 128000 };

/** Parámetros de Llama 3 8B: atención con GQA (Wq, Wo | Wk, Wv) + FFN SwiGLU de 3 matrices + embeddings de entrada y salida. */
export const PARAMS = (() => {
  const a = LLAMA;
  const attn = a.dModel * a.heads * a.headDim * 2 + a.dModel * a.kvHeads * a.headDim * 2;
  return a.layers * (attn + 3 * a.dModel * a.ffn) + 2 * a.vocab * a.dModel;
})();
export const D_ATTN = LLAMA.heads * LLAMA.headDim;
/** Números de cada clave (o de cada valor) por bloque: 8 cabezas KV × 128. */
export const KV_NUMS = LLAMA.kvHeads * LLAMA.headDim;
/** Bytes de caché KV por token de contexto (FP16: 2 bytes por número). */
export const KV_TOKEN = 2 * LLAMA.layers * KV_NUMS * 2;
/** Bytes de los pesos en FP16. */
export const W_BYTES = PARAMS * 2;

export const H100 = { mem: 80e9, bw: 3.35e12, peak: 989e12 };
export const PRICE_GPU_HOUR = 2;
export const PRICE_IN = 3, PRICE_OUT = 15;
export const MFU_PREFILL = 0.4, DECODE_COMPUTE = 0.5;

/** Caché de una conversación de `ctx` tokens (bytes). */
export const kvBytes = (ctx: number) => ctx * KV_TOKEN;
/** Cuántas conversaciones de `ctx` tokens caben en la H100 junto a los pesos. */
export const maxUsers = (ctx: number) => Math.floor((H100.mem - W_BYTES) / kvBytes(ctx));

/** Una vuelta de decodificación con `B` personas de `ctx` tokens cada una. */
export function turn(B: number, ctx: number) {
  const bytes = W_BYTES + B * kvBytes(ctx);
  const tMem = bytes / H100.bw;
  const flops = B * (2 * PARAMS + 4 * LLAMA.layers * D_ATTN * ctx);
  const tComp = flops / (H100.peak * DECODE_COMPUTE);
  const t = Math.max(tMem, tComp);
  return { bytes, tMem, tComp, t, perUser: 1 / t, total: B / t, costPerM: (PRICE_GPU_HOUR / 3600 / (B / t)) * 1e6, compUse: flops / t / H100.peak };
}

/** Tiempo de llenado (s) de `L` tokens con una persona. */
export const prefillTime = (L: number) => (2 * PARAMS * L + 2 * LLAMA.layers * D_ATTN * L * L) / (H100.peak * MFU_PREFILL);

/** Tiempo (s) de escribir `G` tokens tras `P` de entrada, una persona: suma de las vueltas (la caché crece en cada una). */
export function decodeTime(P: number, G: number) {
  let s = 0;
  for (let j = 0; j < G; j++) s += turn(1, P + j).t;
  return s;
}

// ── tareas (turno 3) ─────────────────────────────────────────────────────────────────────────────────────────────
export type TaskId = 'contract' | 'report' | 'question';
export const TASKS: Record<TaskId, { tin: number; tout: number; es: string; en: string }> = {
  contract: { tin: 40000, tout: 400, es: 'Resumir un contrato', en: 'Summarize a contract' },
  report: { tin: 500, tout: 4000, es: 'Redactar un informe', en: 'Draft a report' },
  question: { tin: 100, tout: 300, es: 'Pregunta corta', en: 'Short question' },
};
export function bill(id: TaskId) {
  const t = TASKS[id];
  const cin = (t.tin * PRICE_IN) / 1e6, cout = (t.tout * PRICE_OUT) / 1e6;
  const first = prefillTime(t.tin), gen = decodeTime(t.tin, t.tout);
  return { ...t, cin, cout, total: cin + cout, shareIn: cin / (cin + cout), first, gen, time: first + gen };
}

// ── mezcla de expertos (Mixtral 8x7B, tabla 1) ────────────────────────────────────────────────────────────────────
export const MIXTRAL = (() => {
  const dim = 4096, layers = 32, headDim = 128, hidden = 14336, heads = 32, kvHeads = 8, vocab = 32000, experts = 8, k = 2;
  const attn = layers * (dim * heads * headDim * 2 + dim * kvHeads * headDim * 2);
  const shared = attn + 2 * vocab * dim + layers * dim * experts;
  const expert = 3 * dim * hidden;
  return { experts, k, total: shared + layers * experts * expert, active: shared + layers * k * expert };
})();

// ── el ejemplo de la caché: 6 tokens de entrada, 10 de salida ─────────────────────────────────────────────────────────
export const P_IN = 6, G_OUT = 10;
/** Casillas calculadas (posiciones que atraviesan el modelo) sin y con caché. */
export const CELLS_NO = G_OUT * P_IN + (G_OUT * (G_OUT - 1)) / 2;
export const CELLS_YES = P_IN + G_OUT - 1;
