// Recuperación de información de verdad, a pequeña escala y sin dependencias: normalizar, partir en palabras, quitar
// palabras vacías, reducir a la raíz (stemming ligero), pesar con TF-IDF, normalizar a longitud 1 y comparar con la
// similitud coseno. Todo es determinista y corre en el navegador sobre el índice de la lección.
//
// Fórmulas (las mismas de «Por dentro»):  tf = 1 + ln(cuenta)   ·   idf = ln((N + 1) / (df + 1)) + 1   ·   peso = tf · idf
// El vector de cada fragmento se normaliza (norma 1): entonces la similitud coseno es solo el producto punto.
import { DOCS, OLD_WARRANTY, REVIEW_TRAP, type Doc, type Lang } from './corpus';

// ── texto → términos ──────────────────────────────────────────────────────
const STOP: Record<Lang, Set<string>> = {
  es: new Set(('a al algo ante as asi aun aunque bien cada como con contra cual cuales cuando cuanto cuantos cuantas de del desde donde dos '
    + 'e el ella ellas ello ellos en entre era eran es esa esas ese eso esos esta estan estas este esto estos fue ha han hasta hay la las le les lo '
    + 'los me mi mis mucho muy ni no nos o os otra otras otro otros para pero poco por porque que quien quienes se si sin sobre su sus tambien te '
    + 'tiene tienen tu tus un una uno unas unos va y ya yo puedo puede puedes pueden hacer cuanto cuanta tengo tener ser son soy somos sera seria '
    + 'esta estoy estamos estar hay habia').split(/\s+/)),
  en: new Set(('a about after all also am an and any are as at be been being but by can could did do does for from had has have how i if in into is it '
    + 'its me my no not of on or our out so than that the their them then there these they this to up was we were what when where which who why will '
    + 'with would you your yours should may might must shall').split(/\s+/)),
};

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Stemmer ligero del español: plurales, infinitivos y vocal final. Imperfecto a propósito: es lo que hacen los sistemas simples. */
function stemEs(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith('ces')) w = w.slice(0, -3) + 'z';
  else if (w.endsWith('es') && w.length > 4) w = w.slice(0, -2);
  else if (w.endsWith('s') && w.length > 3) w = w.slice(0, -1);
  if (w.length > 5 && /(ar|er|ir)$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 4 && /[aeo]$/.test(w)) w = w.slice(0, -1);
  return w;
}
/** Stemmer ligero del inglés: plurales, -ing, -ed y e final. */
function stemEn(w: string): string {
  if (w.length <= 3) return w;
  if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -3) + 'y';
  else if (/(ss|us)$/.test(w)) { /* se queda */ }
  else if (w.endsWith('es') && /(ch|sh|x|z|s)es$/.test(w)) w = w.slice(0, -2);
  else if (w.endsWith('s') && w.length > 3) w = w.slice(0, -1);
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}
export const stem = (w: string, l: Lang) => (l === 'es' ? stemEs(w) : stemEn(w));

/** Palabras con significado (sin vacías, en raíz) de un texto, en orden. */
export function terms(text: string, l: Lang): string[] {
  const out: string[] = [];
  for (const m of norm(text).matchAll(/[a-z0-9ñ]+/g)) { const w = m[0]; if (!STOP[l].has(w) && w.length > 1) out.push(stem(w, l)); }
  return out;
}

/** Raíz de UNA palabra tal como se ve (o '' si es vacía): sirve para saber si coincide con la pregunta. */
export function wordStem(w: string, l: Lang): string {
  const n = norm(w).replace(/[^a-z0-9ñ]/g, '');
  return !n || n.length < 2 || STOP[l].has(n) ? '' : stem(n, l);
}

/** Palabras tal como se ven (para dividir por tamaño) — separa por espacios sin tocar nada. */
export const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Frases de un texto (corte en . ? ! seguido de espacio). */
export const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

// ── fragmentos e índice ───────────────────────────────────────────────────
export interface Chunk { id: string; doc: string; title: string; n: number; text: string }

export function chunksOf(docs: Doc[]): Chunk[] {
  const out: Chunk[] = [];
  for (const d of docs) d.paras.forEach((t, i) => out.push({ id: `${d.id}.${i + 1}`, doc: d.id, title: d.title, n: i + 1, text: t }));
  return out;
}
export const mainChunks = (l: Lang) => chunksOf(DOCS[l]);
export const oldChunks = (l: Lang) => chunksOf([OLD_WARRANTY[l]]);
export const trapChunks = (l: Lang) => chunksOf([REVIEW_TRAP[l]]);

export type Sparse = Map<number, number>;
export interface Index { lang: Lang; chunks: Chunk[]; vocab: string[]; id: Map<string, number>; df: number[]; idf: number[]; vecs: Sparse[]; N: number }

const tf = (c: number) => 1 + Math.log(c);

export function buildIndex(chunks: Chunk[], lang: Lang): Index {
  const id = new Map<string, number>(), vocab: string[] = [], df: number[] = [];
  const bags = chunks.map((c) => {
    const bag = new Map<number, number>();
    for (const t of terms(c.text, lang)) {
      let k = id.get(t);
      if (k === undefined) { k = vocab.length; id.set(t, k); vocab.push(t); df.push(0); }
      bag.set(k, (bag.get(k) ?? 0) + 1);
    }
    for (const k of bag.keys()) df[k]++;
    return bag;
  });
  const N = chunks.length, idf = df.map((d) => Math.log((N + 1) / (d + 1)) + 1);
  const vecs = bags.map((bag) => unit(new Map([...bag].map(([k, c]) => [k, tf(c) * idf[k]] as [number, number]))));
  return { lang, chunks, vocab, id, df, idf, vecs, N };
}

function unit(v: Sparse): Sparse {
  let s = 0; for (const x of v.values()) s += x * x;
  const n = Math.sqrt(s) || 1;
  return new Map([...v].map(([k, x]) => [k, x / n] as [number, number]));
}
export function dot(a: Sparse, b: Sparse): number {
  const [s, l] = a.size <= b.size ? [a, b] : [b, a];
  let t = 0; for (const [k, x] of s) { const y = l.get(k); if (y !== undefined) t += x * y; }
  return t;
}

/** Vector de una consulta con el vocabulario y los idf del índice (las palabras desconocidas no cuentan). */
export function embedQuery(ix: Index, q: string): Sparse {
  const bag = new Map<number, number>();
  for (const t of terms(q, ix.lang)) { const k = ix.id.get(t); if (k !== undefined) bag.set(k, (bag.get(k) ?? 0) + 1); }
  return unit(new Map([...bag].map(([k, c]) => [k, tf(c) * ix.idf[k]] as [number, number])));
}

export interface Hit { i: number; score: number }
/** Todos los fragmentos ordenados por similitud coseno con la consulta (empates por orden original). */
export function search(ix: Index, q: string): { hits: Hit[]; qv: Sparse; matched: string[] } {
  const qv = embedQuery(ix, q);
  const hits = ix.vecs.map((v, i) => ({ i, score: dot(qv, v) })).sort((a, b) => b.score - a.score || a.i - b.i);
  return { hits, qv, matched: [...qv.keys()].map((k) => ix.vocab[k]) };
}

/** Palabras de la consulta (en raíz) que aparecen en un fragmento: sirve para resaltar la coincidencia. */
export function sharedTerms(ix: Index, qv: Sparse, i: number): Set<string> {
  const s = new Set<string>();
  for (const k of qv.keys()) if (ix.vecs[i].has(k)) s.add(ix.vocab[k]);
  return s;
}

// ── la respuesta de juguete (extractiva) ──────────────────────────────────
export interface AnswerPart { text: string; src: number }          // src = número de cita (1…k)
export interface Answer { ok: boolean; parts: AnswerPart[]; top: number }

/** Umbral de coseno por debajo del cual el sistema dice «no lo encuentro» (calibrado en las preguntas de ejemplo). */
export const ABSTAIN = 0.12;

/**
 * Generador de juguete: NO es un modelo de lenguaje. Copia el mejor fragmento recuperado (con su número de cita) y, de los
 * otros k−1 fragmentos, la frase que más pesa para la pregunta, siempre que su fragmento esté cerca del mejor (≥ 85 % de su
 * puntuación). Si el mejor queda por debajo de ABSTAIN, no responde: «no lo encuentro».
 */
export function extractAnswer(ix: Index, hits: Hit[], k: number, qv: Sparse): Answer {
  const top = hits[0]?.score ?? 0;
  if (top < ABSTAIN) return { ok: false, parts: [], top };
  const parts: AnswerPart[] = sentences(ix.chunks[hits[0].i].text).map((t) => ({ text: t, src: 1 }));
  hits.slice(1, k).forEach((h, r) => {
    if (h.score < Math.max(ABSTAIN, 0.85 * top)) return;
    let best: { t: string; sc: number } | null = null;
    for (const t of sentences(ix.chunks[h.i].text)) {
      let sc = 0; const seen = new Set<number>();
      for (const w of terms(t, ix.lang)) { const id = ix.id.get(w); if (id !== undefined && qv.has(id) && !seen.has(id)) { seen.add(id); sc += ix.idf[id]; } }
      if (sc > 0 && (!best || sc > best.sc)) best = { t, sc };
    }
    if (best) parts.push({ text: best.t, src: r + 2 });
  });
  return { ok: true, parts, top };
}

// ── fragmentación por oraciones ───────────────────────────────────────────
/** Agrupa las oraciones de un texto en fragmentos de `g` oraciones, con `overlap` oraciones repetidas entre fragmentos
 *  contiguos. Devuelve [primera, última+1) por fragmento (índices de oración). */
export function sentenceWindows(n: number, g: number, overlap = 0): [number, number][] {
  const out: [number, number][] = [], step = Math.max(1, g - overlap);
  for (let s = 0; s < n; s += step) { out.push([s, Math.min(n, s + g)]); if (s + g >= n) break; }
  return out;
}

// ── métricas de evaluación ────────────────────────────────────────────────
/** Puesto (1 = primero) de `gold` en una lista de ids ordenada; 0 si no aparece entre los candidatos. */
export const rankOf = (order: string[], gold: string) => { const i = order.indexOf(gold); return i < 0 ? 0 : i + 1; };
export const hitAt = (rank: number, k: number) => rank > 0 && rank <= k;
export const rr = (rank: number) => (rank > 0 ? 1 / rank : 0);

/** Atajos con caché por (idioma, texto): evita rehacer el índice y las búsquedas en cada fotograma. */
const ixCache = new Map<string, Index>();
export function mainIndex(l: Lang): Index { let ix = ixCache.get('m' + l); if (!ix) { ix = buildIndex(mainChunks(l), l); ixCache.set('m' + l, ix); } return ix; }
export function indexWith(l: Lang, extra: Chunk[], key: string): Index { let ix = ixCache.get(key + l); if (!ix) { ix = buildIndex([...mainChunks(l), ...extra], l); ixCache.set(key + l, ix); } return ix; }
const sCache = new Map<string, ReturnType<typeof search>>();
export function searchMain(l: Lang, q: string) { const k = l + '|' + q; let r = sCache.get(k); if (!r) { r = search(mainIndex(l), q); if (sCache.size > 200) sCache.clear(); sCache.set(k, r); } return r; }
