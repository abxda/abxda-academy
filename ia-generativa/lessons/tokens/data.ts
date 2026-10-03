// Datos y cálculos de la lección «Tokens»: los tokenizadores de juguete (entrenados offline, ver build-tokenizers.mts),
// las frases de ejemplo y las cifras REALES medidas con tokenizadores de verdad (ver measure-real.py).
import { EN, ES, ES_CORE } from './corpus';
import { VARIANTS, MERGE_COUNT, type Variant } from './merges';
import { encode, makeTokenizer, chunks, type Tok, type Tokenizer } from './bpe';

export { MERGE_COUNT, type Variant };
export type Lg = 'es' | 'en';

// ── frases de la lección (no están en el corpus de entrenamiento salvo palabras sueltas; ver corpus.ts) ──
export const SENT: Record<Lg, string> = { es: 'Mi gato se llama Quetzalcóatl.', en: 'My cat is named Quetzalcoatl.' };
/** La palabra común y la rara de la frase (con el espacio inicial: así es la pieza). */
export const COMMON: Record<Lg, string> = { es: ' gato', en: ' cat' };
export const RARE: Record<Lg, string> = { es: ' Quetzalcóatl', en: ' Quetzalcoatl' };
/** Texto de ejemplo del campo libre (hasta que la persona escribe el suyo). */
export const SAMPLE: Record<Lg, string> = { es: 'Hola, ¿cómo estás hoy?', en: 'Hello, how are you today?' };

/** Cuatro frases iguales en los dos idiomas (inglés, español). Las mismas que se midieron con tokenizadores reales. */
export const PAIRS: [string, string][] = [
  ['The company is investing in artificial intelligence.', 'La empresa está invirtiendo en inteligencia artificial.'],
  ["Please send me the report before tomorrow's meeting.", 'Por favor, envíame el informe antes de la reunión de mañana.'],
  ['The weather is nice today, so we are going to the park.', 'El clima está agradable hoy, así que vamos al parque.'],
  ['The customer says the product arrived late.', 'El cliente dice que el producto llegó tarde.'],
];

// ── tokenizadores de juguete ──
const tks: Partial<Record<Variant, Tokenizer>> = {};
export const tokenizer = (v: Variant): Tokenizer => (tks[v] ??= makeTokenizer(VARIANTS[v]));

const memo = new Map<string, Tok[]>();
/** Tokeniza con memoria (render se llama en cada fotograma). */
export function tok(text: string, v: Variant = 'mix', max = MERGE_COUNT): Tok[] {
  const k = `${v}|${max}|${text}`;
  let r = memo.get(k);
  if (!r) { if (memo.size > 400) memo.clear(); r = encode(text, tokenizer(v), max); memo.set(k, r); }
  return r;
}

/** Número de tokens de cada trozo (palabra, número, signo) del texto, en orden. */
export function perChunk(toks: Tok[]): number[] {
  const out: number[] = [];
  for (const t of toks) out[t.chunk] = (out[t.chunk] ?? 0) + 1;
  return out;
}

/** Con cuántas fusiones `word` pasa a ser un solo token (−1 si nunca, dentro del presupuesto). Búsqueda binaria: es monótono. */
const firstMemo = new Map<string, number>();
export function mergesToSingle(word: string, v: Variant = 'mix'): number {
  const k = `${v}|${word}`;
  const c = firstMemo.get(k);
  if (c !== undefined) return c;
  const tk = tokenizer(v);
  let r = -1;
  if (encode(word, tk).length === 1) { let lo = 0, hi = MERGE_COUNT; while (lo < hi) { const m = (lo + hi) >> 1; if (encode(word, tk, m).length === 1) hi = m; else lo = m + 1; } r = lo; }
  firstMemo.set(k, r);
  return r;
}

/** Tokens de un texto con 0…MERGE_COUNT fusiones, muestreado cada `step` (para la curva). */
const curveMemo = new Map<string, number[]>();
export function curve(text: string, step = 8, v: Variant = 'mix'): { m: number; n: number }[] {
  const k = `${v}|${step}|${text}`;
  let ns = curveMemo.get(k);
  if (!ns) { const tk = tokenizer(v); ns = []; for (let m = 0; m <= MERGE_COUNT; m += step) ns.push(encode(text, tk, m).length); curveMemo.set(k, ns); }
  return ns.map((n, i) => ({ m: i * step, n }));
}

/** Tokens totales de varios textos con 0…MERGE_COUNT fusiones, muestreado cada `step`. */
const sumMemo = new Map<string, { m: number; n: number }[]>();
export function curveSum(texts: string[], step = 8, v: Variant = 'mix'): { m: number; n: number }[] {
  const k = `${v}|${step}|${texts.join('\u0001')}`;
  let r = sumMemo.get(k);
  if (!r) { const tk = tokenizer(v); r = []; for (let m = 0; m <= MERGE_COUNT; m += step) r.push({ m, n: texts.reduce((a, t) => a + encode(t, tk, m).length, 0) }); sumMemo.set(k, r); }
  return r;
}

/** Total de tokens de las cuatro frases por idioma con un tokenizador de juguete. */
const pairMemo = new Map<Variant, { en: number; es: number }>();
export function pairTotals(v: Variant): { en: number; es: number } {
  let r = pairMemo.get(v);
  if (!r) { r = { en: 0, es: 0 }; for (const [e, s] of PAIRS) { r.en += tok(e, v).length; r.es += tok(s, v).length; } pairMemo.set(v, r); }
  return r;
}

/** Caracteres de español y de inglés con que se entrenó cada variante. */
export function corpusShare(v: Variant): { en: number; es: number } {
  const len = (a: string[]) => a.join('').length;
  return v === 'en' ? { en: len(EN), es: 0 } : v === 'mix' ? { en: len(EN), es: len(ES_CORE) } : { en: len(EN), es: len(ES) };
}

/** Palabras que aparecen en el corpus (para el «vocabulario de palabras» de la animación). */
let known: Set<string> | null = null;
export function isKnownWord(w: string): boolean {
  if (!known) { known = new Set(); for (const t of [...EN, ...ES]) for (const c of chunks(t)) { const x = c.trim().toLowerCase(); if (/^\p{L}+$/u.test(x)) known.add(x); } }
  return known.has(w.trim().toLowerCase().replace(/[^\p{L}]/gu, ''));
}

// ── cifras REALES (medidas con tiktoken 0.14.0 y tomadas de informes técnicos; ver measure-real.py) ──
export const REAL = {
  /** Tamaño del vocabulario. gpt-2: 50 257 (Radford et al., 2019). Llama 2: 32 k (Touvron et al., 2023). Llama 3: 128 K (Dubey et al., 2024).
   *  cl100k_base (gpt-4) y o200k_base (gpt-4o): n_vocab de tiktoken = 100 277 y 200 019 (100 256 y 199 998 ordinarios). */
  vocab: [
    { id: 'toy', v: 656 },
    { id: 'llama2', v: 32000 },
    { id: 'gpt2', v: 50257 },
    { id: 'cl100k', v: 100277 },
    { id: 'llama3', v: 128000 },
    { id: 'o200k', v: 200019 },
  ],
  /** Tokens totales de las 4 frases de PAIRS (en · es) con cada tokenizador real. */
  pairs: { gpt2: { en: 40, es: 73 }, cl100k: { en: 40, es: 53 }, o200k: { en: 40, es: 46 } },
  /** « strawberry» y « frambuesa» (con su espacio inicial, como aparecen en una frase) con cl100k_base: ids y trozos.
   *  Ojo: « strawberry» es UN solo token (sin el espacio inicial sí se parte en «str», «aw», «berry»). */
  word: {
    en: { text: ' strawberry', ids: [73700], pieces: [' strawberry'] },
    es: { text: ' frambuesa', ids: [1448, 3042, 1157, 64], pieces: [' fr', 'amb', 'ues', 'a'] },
  },
  /** «1234567» con cl100k_base. */
  num: { text: '1234567', ids: [4513, 10961, 22], pieces: ['123', '456', '7'] },
};
