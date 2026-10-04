// Datos derivados que comparten las vistas de la escena (todo se calcula de verdad a partir del corpus; con caché).
import type { Frame } from '../../../../../theme/kit';
import { ALL_FIXED, CHUNK_DEMO, DOCS, EXTRA, GOLD, type Lang, type Question } from './corpus';
import { DENSE } from './dense';
import {
  ABSTAIN, dot, embedQuery, extractAnswer, hitAt, mainIndex, rankOf, rr, search, searchMain, sentenceWindows, sentences, terms, words, wordStem,
  type Answer, type Index,
} from './ir';

export const lang = (S: Frame) => S.lang as Lang;

// ── preguntas de las demostraciones ──────────────────────────────────────
export const demoQ = (l: Lang): Question => GOLD[l][0];      // garantía de la batería
export const hardQ = (l: Lang): Question => GOLD[l][4];      // «¿a qué velocidad deja de ayudar el motor?»: por palabras queda tercera
export const missQ = (l: Lang): Question => GOLD[l][7];      // «si me arrepiento…»: cero palabras en común
export const nopeQ = (l: Lang): Question => EXTRA[l][0];     // sucursal en Lima: el manual no lo dice
/** Las opciones de ejemplo del turno «Pregunta» (la última no tiene respuesta en el manual). */
export const exampleQs = (l: Lang): Question[] => [GOLD[l][0], GOLD[l][1], EXTRA[l][2], EXTRA[l][3], GOLD[l][5], EXTRA[l][0]];

/** La pregunta activa del turno: lo que la persona escribió, o el ejemplo elegido. */
export function userQuery(S: Frame): string {
  const l = lang(S), typed = String(S.p.q ?? '').trim();
  if (typed) return typed;
  const i = Number(S.p.ex ?? 0);
  return exampleQs(l)[Number.isFinite(i) ? Math.max(0, Math.min(5, i)) : 0].q;
}

// ── índice y búsqueda ────────────────────────────────────────────────────
export const idx = (S: Frame): Index => mainIndex(lang(S));
export const manualWords = (l: Lang) => mainIndex(l).chunks.reduce((a, c) => a + words(c.text).length, 0);

/** Resultado de buscar `q` en el índice principal: lista ordenada, vector de la consulta y respuesta de juguete. */
export function board(l: Lang, q: string, k = 3) {
  const ix = mainIndex(l), r = searchMain(l, q), ans: Answer = extractAnswer(ix, r.hits, k, r.qv);
  return { ix, hits: r.hits, qv: r.qv, matched: r.matched, top: r.hits[0]?.score ?? 0, abstain: (r.hits[0]?.score ?? 0) < ABSTAIN, ans };
}
export const stemSet = (l: Lang, q: string) => new Set(terms(q, l));

// ── real: embeddings y reordenador precalculados (build-dense.py) ────────
export function denseOrder(l: Lang, q: string): { id: string; s: number }[] | null {
  const row = DENSE[l].q[q]; if (!row) return null;
  return row.e5.map((s, i) => ({ id: DENSE[l].ids[i], s })).sort((a, b) => b.s - a.s);
}
export function ceOf(l: Lang, q: string, id: string): number | null {
  const row = DENSE[l].q[q]; if (!row) return null;
  const i = DENSE[l].ids.indexOf(id); return i < 0 ? null : row.ce[i];
}
/** Reordena los primeros `n` candidatos de una lista de ids con las puntuaciones del cross-encoder. */
export function rerankIds(l: Lang, q: string, order: string[], n = 5): string[] {
  const cand = order.slice(0, n).map((id) => ({ id, s: ceOf(l, q, id) ?? -99 })).sort((a, b) => b.s - a.s);
  return cand.map((c) => c.id);
}
/** Orden por palabras: solo los fragmentos con alguna coincidencia (puntuación > 0). */
export function wordOrder(l: Lang, q: string): string[] {
  const ix = mainIndex(l);
  return searchMain(l, q).hits.filter((h) => h.score > 0).map((h) => ix.chunks[h.i].id);
}

// ── evaluación: 10 preguntas de oro × 4 configuraciones ──────────────────
export const CONFIGS = ['words', 'words+rr', 'emb', 'emb+rr'] as const;
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

// ── fragmentar por oraciones (turno 1) ───────────────────────────────────
export interface ChunkDemo { sents: string[]; wins: [number, number][]; cos: number[]; best: number; hasFact: boolean; hasCond: boolean; frac: number; ok: boolean; fi: number; ci: number; words: number[] }
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
  const r = { sents: S, wins, cos, best, hasFact, hasCond, frac, ok: hasFact && hasCond && frac >= 0.4, fi, ci, words: S.map((s) => words(s).length) };
  cdCache.set(key, r); return r;
}

// ── matriz de palabras × fragmentos (vectorizar / idf) ───────────────────
const MAT_ROWS = ['garantia.2', 'bateria.1', 'devoluciones.1', 'envios.2'];
const MAT_COLS: Record<Lang, string[]> = { es: ['batería', 'garantía', 'carga', 'días', 'cancelar', 'envío'], en: ['battery', 'warranty', 'charge', 'days', 'cancel', 'shipping'] };
export function matrixDemo(l: Lang) {
  const ix = mainIndex(l), rows = MAT_ROWS.map((id) => ix.chunks.find((c) => c.id === id)!);
  const cols = MAT_COLS[l].map((word) => { const stem = wordStem(word, l), k = ix.id.get(stem)!; return { word, stem, k, df: ix.df[k], idf: ix.idf[k] }; });
  const counts = rows.map((c) => { const ts = terms(c.text, l); return cols.map((cl) => ts.filter((t) => t === cl.stem).length); });
  const w = counts.map((r) => r.map((c, j) => (c > 0 ? (1 + Math.log(c)) * cols[j].idf : 0)));
  return { rows, cols, counts, w, N: ix.N };
}

// ── vector de un fragmento: sus pesos mayores, con la palabra tal como se lee ──
const surf = new Map<string, string>();
export function surfaceOf(l: Lang, stem: string): string {
  const key = `${l}|${stem}`; const hit = surf.get(key); if (hit) return hit;
  let out = stem;
  outer: for (const d of DOCS[l]) for (const p of d.paras) for (const w of p.split(/\s+/)) { const c = w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase(); if (c && wordStem(c, l) === stem) { out = c; break outer; } }
  surf.set(key, out); return out;
}
export function topWeights(l: Lang, i: number, n = 3): { term: string; w: number }[] {
  const ix = mainIndex(l);
  return [...ix.vecs[i]].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, w]) => ({ term: surfaceOf(l, ix.vocab[k]), w }));
}

/** Total de preguntas fijas con datos precalculados (para saber si una pregunta tiene embeddings). */
export const isFixed = (l: Lang, q: string) => ALL_FIXED(l).some((x) => x.q === q);
