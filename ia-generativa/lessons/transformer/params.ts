// Cuenta de parámetros de un transformer solo decodificador estilo GPT-2/GPT-3 (con sesgos, red de d → 4d → d,
// salida atada al embedding).
//
//   embeddings  V·d            (tabla E; la salida reutiliza E, por eso no suma otra tabla)
//   posiciones  ctx·d          (solo si se aprenden; la de ondas no tiene parámetros)
//   atención    L·(4d² + 4d)   (Wq, Wk, Wv, Wo de d×d y sus 4 sesgos de d)
//   red         L·(2·d·ff + ff + d)   con ff = 4d  →  L·(8d² + 5d)
//   normaliz.   (4L + 2)·d     (dos por bloque y una final; cada una tiene ganancia y sesgo = 2d)
//   total       ≈ 12·L·d² cuando d es grande (Kaplan et al., 2020, ec. 2.1)
//
// Verificada con PyTorch (el juguete: 1856) y con Hugging Face `transformers` para GPT-2 (124 439 808 con contexto
// 1024; ver train_tiny.py, verify_formula). Para «GPT-3 Small» (12 bloques, d = 768) y GPT-3 (96 bloques, d = 12 288),
// con el vocabulario de GPT-2 (50 257) y contexto 2048 (Brown et al., 2020, tabla 2.1), da 125 226 240 y
// 174 604 259 328: el artículo lista 125M y 175.0B. El reparto por partes es nuestro cálculo con esta fórmula.
export interface PCfg { d: number; L: number; V: number; ctx: number; ff?: number }
export interface PParts { emb: number; attn: number; mlp: number; norms: number; total: number }

export function countParams(c: PCfg): PParts {
  const { d, L, V, ctx } = c, ff = c.ff ?? 4 * d;
  const emb = V * d + ctx * d, attn = L * (4 * d * d + 4 * d), mlp = L * (2 * d * ff + ff + d), norms = (4 * L + 2) * d;
  return { emb, attn, mlp, norms, total: emb + attn + mlp + norms };
}

export type ModelId = 'toy' | 'small' | 'gpt3';
export const MODELS: Record<ModelId, PCfg> = {
  toy: { d: 8, L: 2, V: 12, ctx: 0, ff: 32 },            // posición con ondas: sin parámetros
  small: { d: 768, L: 12, V: 50257, ctx: 2048 },         // «GPT-3 Small»: 12 capas, d_model 768 (tabla 2.1)
  gpt3: { d: 12288, L: 96, V: 50257, ctx: 2048 },        // GPT-3: 96 capas, d_model 12 288 (tabla 2.1)
};
export const MODEL_IDS: ModelId[] = ['toy', 'small', 'gpt3'];
