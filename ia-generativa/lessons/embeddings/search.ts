// Buscador de juguete de la lección: diez documentos y 36 consultas de prueba (ilustrativos, escritos para la lección;
// ver data/search-cases.json) y tres formas de buscar:
//   · por palabras exactas: cuenta cuántas palabras de la consulta aparecen tal cual en el documento.
//   · por promedio de vectores de palabras: cada texto se resume con el PROMEDIO de los vectores GloVe de sus palabras
//     (vectors.ts) y se ordena por similitud coseno. Es la versión más simple posible de la búsqueda semántica
//     y no entiende el orden de las palabras (ver ORDER).
//   · por un modelo moderno de oraciones (paraphrase-multilingual-MiniLM-L12-v2): sus puntajes se calcularon
//     fuera de línea con eval-search.py (data/search-eval.json) y solo existen para las 36 consultas de prueba.
import CASES from './data/search-cases.json';
import EVAL from './data/search-eval.json';
import { isStop, mean, parse, words, type Lg } from './vectors';

export interface Doc { id: string; title: Record<Lg, string>; en: string; es: string }
export const DOCS: Doc[] = CASES.docs as Doc[];
export interface Query { want: string; en: string; es: string }
export const QUERIES: Query[] = CASES.queries;
/** Consultas que se ofrecen como atajo (índices de QUERIES). */
export const PRESETS: number[] = CASES.presets;
export const MODEL = { name: EVAL.model, license: EVAL.license, dim: EVAL.dim };

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Palabra normalizada para la búsqueda exacta: sin acentos y sin la «s» del plural. */
const stem = (w: string) => { const s = strip(w); return s.length >= 5 && s.endsWith('s') ? s.slice(0, -1) : s; };
const content = (text: string, lang: Lg) => words(text).filter((w) => !isStop(w, lang)).map(stem);

// vector de cada documento (promedio de sus palabras conocidas), calculado una vez por idioma
const docVec = new Map<string, { ids: number[]; v: Float32Array }>();
function docInfo(d: Doc, lang: Lg) {
  const k = d.id + lang; let r = docVec.get(k);
  if (!r) { const ids = parse(d[lang], lang).ids; r = { ids, v: mean(ids) }; docVec.set(k, r); }
  return r;
}
function sim(a: Float32Array, b: Float32Array): number {
  let s = 0, x = 0, y = 0;
  for (let k = 0; k < a.length; k++) { s += a[k] * b[k]; x += a[k] * a[k]; y += b[k] * b[k]; }
  return x && y ? s / Math.sqrt(x * y) : 0;
}

export interface Hit { doc: Doc; score: number; shared: string[] }
export interface Result {
  /** Orden por palabras exactas (puntaje = palabras en común). */
  exact: Hit[];
  /** Orden por promedio de vectores (puntaje = coseno). Vacío si ninguna palabra es conocida. */
  semantic: Hit[];
  /** Orden del modelo moderno: solo si el texto es una de las 36 consultas de prueba. */
  modern: Hit[] | null;
  /** Índice en QUERIES si el texto es una consulta de prueba (con documento correcto conocido). */
  caseIndex: number;
  /** Palabras de la consulta: conocidas (índices y texto) y desconocidas. */
  known: number[]; knownWords: string[]; unknown: string[];
}

const sortHits = (h: (Hit & { n: number })[]): Hit[] => h.sort((a, b) => b.score - a.score || a.n - b.n).map(({ doc, score, shared }) => ({ doc, score, shared }));

export const caseOf = (text: string, lang: Lg): number => { const t = text.trim().toLowerCase(); return QUERIES.findIndex((q) => q[lang].toLowerCase() === t); };

export function search(query: string, lang: Lg): Result {
  const q = parse(query, lang), qs = new Set(content(query, lang)), caseIndex = caseOf(query, lang);
  const exact = sortHits(DOCS.map((doc, n) => {
    const ds = new Set(content(doc[lang], lang)), shared = [...qs].filter((w) => ds.has(w));
    return { doc, score: shared.length, shared, n };
  }));
  let semantic: Hit[] = [];
  if (q.ids.length) { const v = mean(q.ids); semantic = sortHits(DOCS.map((doc, n) => ({ doc, score: sim(v, docInfo(doc, lang).v), shared: [], n }))); }
  const modern = caseIndex >= 0 ? sortHits(DOCS.map((doc, n) => ({ doc, score: (EVAL.scores as Record<Lg, number[][]>)[lang][caseIndex][n], shared: [], n }))) : null;
  return { exact, semantic, modern, caseIndex, known: q.ids, knownWords: q.known, unknown: q.unknown };
}

/** ¿Quedó primero el documento correcto? (en palabras exactas, solo si es el único con más coincidencias). */
export const firstIsRight = (hits: Hit[] | null, want: string, strict = false): boolean => !!hits && hits.length > 0 && hits[0].score > 0 && hits[0].doc.id === want && (!strict || !hits[1] || hits[1].score < hits[0].score);

const boards = new Map<Lg, { n: number; exact: number; avg: number; modern: number }>();
/** Marcador de las 36 consultas de prueba: aciertos de cada método (los dos primeros se calculan aquí, el tercero viene de eval-search.py). */
export function board(lang: Lg) {
  let b = boards.get(lang);
  if (!b) {
    b = { n: QUERIES.length, exact: 0, avg: 0, modern: 0 };
    QUERIES.forEach((q) => { const r = search(q[lang], lang); if (firstIsRight(r.exact, q.want, true)) b!.exact++; if (firstIsRight(r.semantic, q.want)) b!.avg++; if (firstIsRight(r.modern, q.want)) b!.modern++; });
    boards.set(lang, b);
  }
  return b;
}

/** Palabras (índices del vocabulario) con las que se resumió un documento. */
export const docWords = (d: Doc, lang: Lg): number[] => docInfo(d, lang).ids;

/** El límite del promedio: dos frases con las mismas palabras en otro orden dan el mismo vector. */
export const ORDER = {
  a: { en: 'the dog bites the man', es: 'el perro muerde al hombre' },
  b: { en: 'the man bites the dog', es: 'el hombre muerde al perro' },
};
