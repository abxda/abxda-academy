// Datos y cálculos de la lección «Tokens».
//  · El tokenizador de juguete (BPE a nivel de bytes) se entrenó offline con build-tokenizers.mts sobre corpus.ts → merges.ts.
//  · Las cifras de tokenizadores REALES (GPT-2, GPT-4, GPT-4o) y de FLORES-200 vienen de measure-real.py → real-data.ts.
//  · El corpus diminuto de la animación de BPE (gato ×5…) se traza aquí mismo con `trace` (bpe.ts).
import { VARIANTS, MERGE_COUNT, type Variant } from './merges';
import { encode, makeTokenizer, trace, type Step, type Tok, type Tokenizer } from './bpe';
import { REAL } from './real-data';

export { MERGE_COUNT, REAL, type Variant };
export type Lg = 'es' | 'en';

/** La frase de toda la lección (la misma que se mide con GPT-4o en real-data.ts). */
export const SENT: Record<Lg, string> = { es: 'Mi gato se llama Quetzalcóatl.', en: 'My cat is named Quetzalcoatl.' };
/** La frase cortada en palabras (para el carril «palabras»). */
export const WORDS: Record<Lg, string[]> = { es: ['Mi', 'gato', 'se', 'llama', 'Quetzalcóatl.'], en: ['My', 'cat', 'is', 'named', 'Quetzalcoatl.'] };

// ── el corpus diminuto de la animación de BPE ──
export const MINI: Record<Lg, [string, number][]> = {
  es: [['gato', 5], ['gatos', 3], ['pato', 4], ['patos', 2], ['gatita', 1]],
  en: [['cat', 5], ['cats', 3], ['hat', 4], ['hats', 2], ['catnip', 1]],
};
/** Estado tras cada fusión: es → at, ato, gato, pato, gatos, patos (6); en → at, cat, hat, cats, hats (5). */
export const TRACE: Record<Lg, Step[]> = { es: trace(MINI.es, 8), en: trace(MINI.en, 8) };

/** Cuentas de las parejas vecinas en un estado del corpus diminuto, de mayor a menor (empate: orden alfabético, como `trace`). */
export function pairCounts(pieces: string[][], freq: number[]) {
  const m = new Map<string, number>();
  pieces.forEach((p, wi) => { for (let i = 0; i < p.length - 1; i++) { const k = p[i] + '\u0000' + p[i + 1]; m.set(k, (m.get(k) ?? 0) + freq[wi]); } });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([k, n]) => { const [a, b] = k.split('\u0000'); return { a, b, n }; });
}

// ── tokenizadores de juguete ──
const tks: Partial<Record<Variant, Tokenizer>> = {};
export const tokenizer = (v: Variant): Tokenizer => (tks[v] ??= makeTokenizer(VARIANTS[v]));

const memo = new Map<string, Tok[]>();
/** Tokeniza con memoria (render se llama en cada fotograma). `max` = cuántas fusiones aplicar. */
export function tok(text: string, v: Variant = 'mix', max = MERGE_COUNT): Tok[] {
  const k = `${v}|${max}|${text}`;
  let r = memo.get(k);
  if (!r) { if (memo.size > 1200) memo.clear(); r = encode(text, tokenizer(v), max); memo.set(k, r); }
  return r;
}

/** Tokens totales de las cuatro frases del «tu turno» (inglés · español) con una variante del juguete. */
const pairMemo = new Map<Variant, { en: number; es: number }>();
export function toyPairTotals(v: Variant): { en: number; es: number } {
  let r = pairMemo.get(v);
  if (!r) { r = { en: 0, es: 0 }; for (const p of REAL.pairs) { r.en += tok(p.en.text, v).length; r.es += tok(p.es.text, v).length; } pairMemo.set(v, r); }
  return r;
}

/** Palabras del corpus de juguete (en · es) con que se entrenó cada variante; ver corpus.ts y build-tokenizers.mts. */
export const TOY_WORDS = { mix: 1740 };
