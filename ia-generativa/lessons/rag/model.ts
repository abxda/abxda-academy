// Datos derivados que comparten las vistas de la escena. Todo se calcula de verdad a partir del corpus (con caché):
// la búsqueda TF-IDF corre aquí, en el navegador; las cifras de embeddings y del reordenador se leen de dense.ts
// (medidas aparte con build-dense.py, solo para las preguntas fijas).
import type { Frame } from '../../../../../theme/kit';
import { CHUNK_DEMO, DOCS, EXTRA, GOLD, type Lang, type Question } from './corpus';
import { DENSE } from './dense';
import {
  ABSTAIN, dot, embedQuery, extractAnswer, hitAt, indexWith, mainIndex, oldChunks, rankOf, rr, search, searchMain, sentenceWindows,
  sentences, terms, trapChunks, wordStem, words, type Answer, type Hit, type Index,
} from './ir';

export const lang = (S: Frame) => S.lang as Lang;

// ── preguntas de las demostraciones ──────────────────────────────────────────────────────────────────
export const demoQ = (l: Lang): Question => GOLD[l][0];      // garantía de la batería
export const hardQ = (l: Lang): Question => GOLD[l][4];      // «¿a qué velocidad deja de ayudar el motor?»: por palabras queda tercera
export const missQ = (l: Lang): Question => GOLD[l][7];      // «si me arrepiento…»: ninguna palabra en común
export const nopeQ = (l: Lang): Question => EXTRA[l][0];     // sucursal en Lima: el manual no lo dice
/** Pregunta de la demostración de la trampa (la reseña con una orden escondida se recupera entre las tres primeras). */
export const TRAP_Q: Record<Lang, string> = { es: '¿Cuánto tarda el reembolso si cancelo mi compra?', en: 'How long does the refund take if I cancel my purchase?' };

/** Opciones del control «Pregunta» (rótulo corto + la pregunta completa). La última no tiene respuesta en el manual. */
export const EXAMPLES: Record<Lang, { label: string; q: string }[]> = {
  es: [
    { label: 'Garantía de la batería', q: GOLD.es[0].q }, { label: 'Cancelar una compra', q: GOLD.es[1].q },
    { label: 'Horario del taller', q: EXTRA.es[2].q }, { label: 'Costo del envío', q: EXTRA.es[3].q }, { label: 'Sucursal en Lima', q: EXTRA.es[0].q },
  ],
  en: [
    { label: 'Battery warranty', q: GOLD.en[0].q }, { label: 'Cancel a purchase', q: GOLD.en[1].q },
    { label: 'Workshop hours', q: EXTRA.en[2].q }, { label: 'Shipping cost', q: EXTRA.en[3].q }, { label: 'Branch in Lima', q: EXTRA.en[0].q },
  ],
};
export const exampleQ = (l: Lang, i: number) => EXAMPLES[l][Math.max(0, Math.min(EXAMPLES[l].length - 1, Math.round(Number(i) || 0)))].q;

// ── índice y búsqueda ────────────────────────────────────────────────────────────────────────────────
export const idx = (S: Frame): Index => mainIndex(lang(S));
export const manualWords = (l: Lang) => mainIndex(l).chunks.reduce((a, c) => a + words(c.text).length, 0);
export const chunkById = (l: Lang, id: string) => mainIndex(l).chunks.find((c) => c.id === id)!;

/** Resultado de buscar `q` en el índice principal: lista ordenada, vector de la pregunta y respuesta de juguete con k fuentes. */
export function board(l: Lang, q: string, k = 3) {
  const ix = mainIndex(l), r = searchMain(l, q), ans: Answer = extractAnswer(ix, r.hits, k, r.qv);
  const top = r.hits[0]?.score ?? 0;
  return { ix, hits: r.hits, qv: r.qv, matched: r.matched, top, abstain: top < ABSTAIN, ans };
}
/** Raíces de la pregunta que sí están en el índice (las demás no cuentan para la búsqueda, así que no se resaltan). */
export const stemSet = (l: Lang, q: string) => { const ix = mainIndex(l); return new Set(terms(q, l).filter((t) => ix.id.has(t))); };
export { ABSTAIN };

/** Columna de cada término en la tira del vector: orden alfabético de la palabra tal como se lee (así las barras se reparten). */
const posCache = new Map<Lang, number[]>();
export function vocabPos(l: Lang): number[] {
  let p = posCache.get(l); if (p) return p;
  const ix = mainIndex(l), order = ix.vocab.map((s, k) => ({ k, w: surfaceOf(l, s).normalize('NFD').replace(/[̀-ͯ]/g, '') })).sort((a, b) => a.w.localeCompare(b.w));
  p = new Array(ix.vocab.length); order.forEach((o, i) => { p![o.k] = i; });
  posCache.set(l, p); return p;
}

// ── la palabra tal como se lee, para una raíz ────────────────────────────────────────────────────────
const surf = new Map<string, string>();
export function surfaceOf(l: Lang, stem: string): string {
  const key = `${l}|${stem}`; const hit = surf.get(key); if (hit) return hit;
  let out = stem;
  outer: for (const d of DOCS[l]) for (const p of d.paras) for (const w of p.split(/\s+/)) { const c = w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase(); if (c && wordStem(c, l) === stem) { out = c; break outer; } }
  surf.set(key, out); return out;
}
/** Peso de una palabra (escrita como se lee) en el vector del fragmento `id`, y en cuántos fragmentos aparece. */
export function wordWeight(l: Lang, id: string, word: string) {
  const ix = mainIndex(l), i = ix.chunks.findIndex((c) => c.id === id), k = ix.id.get(wordStem(word, l));
  return { k: k ?? -1, w: k === undefined ? 0 : ix.vecs[i].get(k) ?? 0, df: k === undefined ? 0 : ix.df[k] };
}

// ── embeddings y reordenador reales (precalculados, build-dense.py) ──────────────────────────────────
export function denseOrder(l: Lang, q: string): { id: string; s: number }[] | null {
  const row = DENSE[l].q[q]; if (!row) return null;
  return row.e5.map((s, i) => ({ id: DENSE[l].ids[i], s })).sort((a, b) => b.s - a.s);
}
export function ceOf(l: Lang, q: string, id: string): number | null {
  const row = DENSE[l].q[q]; if (!row) return null;
  const i = DENSE[l].ids.indexOf(id); return i < 0 ? null : row.ce[i];
}
/** Reordena los primeros `n` candidatos de una lista de ids con las puntuaciones del reordenador (cross-encoder). */
export function rerankIds(l: Lang, q: string, order: string[], n = 5): string[] {
  return order.slice(0, n).map((id) => ({ id, s: ceOf(l, q, id) ?? -99 })).sort((a, b) => b.s - a.s).map((c) => c.id);
}
/** Orden por palabras: solo los fragmentos con alguna coincidencia (puntuación > 0). */
export function wordOrder(l: Lang, q: string): string[] {
  const ix = mainIndex(l);
  return searchMain(l, q).hits.filter((h) => h.score > 0).map((h) => ix.chunks[h.i].id);
}
/** Demostración del reordenador: los 5 primeros por palabras (con su puntuación) y el nuevo orden. */
export function rerankDemo(l: Lang) {
  const ix = mainIndex(l), q = hardQ(l).q, hits = searchMain(l, q).hits.slice(0, 5);
  const before = hits.map((h) => ({ id: ix.chunks[h.i].id, s: h.score }));
  const after = rerankIds(l, q, before.map((b) => b.id), 5);
  return { q, before, after, gold: hardQ(l).gold! };
}

// ── evaluación: 10 preguntas × 4 configuraciones ─────────────────────────────────────────────────────
/** Columnas: 0 = palabras, 1 = palabras + reordenador, 2 = embeddings, 3 = embeddings + reordenador. */
export interface EvalRow { q: string; gold: string; ranks: [number, number, number, number] }
const evalCache = new Map<string, EvalRow[]>();
export function evalRows(l: Lang): EvalRow[] {
  let rows = evalCache.get(l); if (rows) return rows;
  rows = GOLD[l].map((g) => {
    const w = wordOrder(l, g.q), e = (denseOrder(l, g.q) ?? []).map((x) => x.id);
    return { q: g.q, gold: g.gold!, ranks: [rankOf(w, g.gold!), rankOf(rerankIds(l, g.q, w), g.gold!), rankOf(e, g.gold!), rankOf(rerankIds(l, g.q, e), g.gold!)] as [number, number, number, number] };
  });
  evalCache.set(l, rows); return rows;
}
export function metrics(rows: EvalRow[], c: number, k: number) {
  const n = rows.length;
  return { hit: rows.filter((r) => hitAt(r.ranks[c], k)).length, mrr: rows.reduce((a, r) => a + rr(r.ranks[c]), 0) / n, n };
}

// ── fragmentar por oraciones (tamaño del fragmento) ──────────────────────────────────────────────────
export interface ChunkDemo { sents: string[]; wins: [number, number][]; cos: number[]; best: number; hasFact: boolean; hasCond: boolean; frac: number; ok: boolean; fi: number; ci: number }
const cdCache = new Map<string, ChunkDemo>();
export const demoDoc = (l: Lang) => DOCS[l][0].paras.join(' ');
export function chunkDemo(l: Lang, g: number): ChunkDemo {
  const key = `${l}|${g}`, hit = cdCache.get(key); if (hit) return hit;
  const ix = mainIndex(l), S = sentences(demoDoc(l)), D = CHUNK_DEMO[l];
  const fi = S.indexOf(D.fact), ci = S.indexOf(D.cond), qv = embedQuery(ix, D.q);
  const wins = sentenceWindows(S.length, g, 0);
  const cos = wins.map(([a, b]) => dot(qv, embedQuery(ix, S.slice(a, b).join(' '))));
  let best = 0; cos.forEach((c, i) => { if (c > cos[best]) best = i; });
  const [a, b] = wins[best], nw = (i: number) => words(S[i]).length;
  const hasFact = a <= fi && fi < b, hasCond = a <= ci && ci < b;
  const total = S.slice(a, b).reduce((x, s) => x + words(s).length, 0);
  const ans = (hasFact ? nw(fi) : 0) + (hasCond ? nw(ci) : 0), frac = total ? ans / total : 0;
  const r = { sents: S, wins, cos, best, hasFact, hasCond, frac, ok: hasFact && hasCond, fi, ci };
  cdCache.set(key, r); return r;
}

// ── fallas: contradicción y trampa (búsqueda real sobre el índice con una pieza añadida) ─────────────
export function conflictDemo(l: Lang) {
  const ix = indexWith(l, oldChunks(l), 'old'), r = search(ix, demoQ(l).q);
  return { ix, hits: r.hits.slice(0, 3), hit: stemSet(l, demoQ(l).q) };
}
export function trapDemo(l: Lang) {
  const ix = indexWith(l, trapChunks(l), 'trap'), r = search(ix, TRAP_Q[l]);
  const top = r.hits.slice(0, 3), at = top.findIndex((h: Hit) => ix.chunks[h.i].doc === 'resenas');
  return { ix, top, at, review: trapChunks(l)[0] };
}
