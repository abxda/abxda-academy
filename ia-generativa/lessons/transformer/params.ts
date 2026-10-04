// Cuenta de parámetros de un transformer solo-decodificador estilo GPT-2 (con sesgos, red de d → 4d → d, salida atada al embedding).
//
//   embeddings  V·d            (tabla E; la salida reutiliza E, por eso no suma otra matriz)
//   posiciones  ctx·d          (solo si se aprenden; la sinusoidal no tiene parámetros)
//   atención    L·(4d² + 4d)   (Wq, Wk, Wv, Wo de d×d y sus 4 sesgos de d)
//   red MLP     L·(2·d·ff + ff + d)   con ff = 4d  →  L·(8d² + 5d)
//   normaliz.   (4L + 2)·d     (dos normalizaciones por bloque y una final; cada una tiene ganancia y sesgo = 2d)
//   total       V·d + ctx·d + L·(12d² + 9d) + (4L + 2)·d  ≈ 12·L·d²  cuando d es grande
//
// Verificada con PyTorch (el juguete: 1856), y con Hugging Face `transformers` (GPT2Config → GPT2LMHeadModel) para las
// cuatro variantes de GPT-2: 124 439 808, 354 823 168, 774 030 080 y 1 557 611 200. Ver train_tiny.py (verify_formula).
export interface PCfg { d: number; L: number; V: number; ctx: number; ff?: number }
export interface PParts { emb: number; pos: number; attn: number; mlp: number; norms: number; total: number; approx: number }

export function countParams(c: PCfg): PParts {
  const { d, L, V, ctx } = c, ff = c.ff ?? 4 * d;
  const emb = V * d, pos = ctx * d, attn = L * (4 * d * d + 4 * d), mlp = L * (2 * d * ff + ff + d), norms = (4 * L + 2) * d;
  return { emb, pos, attn, mlp, norms, total: emb + pos + attn + mlp + norms, approx: 12 * L * d * d };
}

export interface Preset { id: 'toy' | 'gpt2' | 'gpt3'; cfg: PCfg; name: string }
export const TOY: PCfg = { d: 8, L: 2, V: 12, ctx: 0, ff: 32 };            // posición sinusoidal: sin parámetros
export const GPT2_SMALL: PCfg = { d: 768, L: 12, V: 50257, ctx: 1024 };      // 12 bloques, d = 768 (Radford et al., 2019, tabla 2)
export const GPT3: PCfg = { d: 12288, L: 96, V: 50257, ctx: 2048 };          // 96 bloques, d = 12288 (Brown et al., 2020, tabla 2.1)

/** Valores de d que ofrece el control (los de GPT-2 y GPT-3 incluidos). */
export const D_STEPS = [8, 64, 256, 512, 768, 1024, 1600, 2048, 4096, 8192, 12288, 16384];
