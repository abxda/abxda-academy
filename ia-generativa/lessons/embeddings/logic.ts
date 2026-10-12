// Estado y cálculo de los tres turnos «Tu turno»: vecinos de una palabra, aritmética de palabras y búsqueda. Todo sale de los vectores
// reales (vectors.ts) y de los casos de búsqueda (search.ts). `view*` son funciones puras de S.p y S.st; `update*` cambian S.st.
import type { Frame } from '../../../../../theme/kit';
import { combine, idOf, mean, nearestTo, parse, parseExpr, type Lg } from './vectors';
import { PRESETS, QUERIES, search, type Result } from './search';

const DWELL = 0.6; // segundos que una entrada escrita debe quedarse quieta para contar como «vista»

// ═════════════ turno 1 · vecinos de una palabra ═════════════
export const KNN_WORDS = ['dog', 'bread', 'king', 'doctor', 'apple', 'paris', 'car', 'love', 'rain', 'music'].map(idOf);
export interface KnnState { src: 'preset' | 'typed' | 'tap'; k: number; lastW: string; key: string; dwell: number; seen: string[]; tap: number }
export const knnOf = (S: Frame): KnnState => (S.st.knn ??= { src: 'preset', k: 0, lastW: '', key: '', dwell: 0, seen: [], tap: -1 } as KnnState);
export interface KnnView { ids: number[]; key: string; vec: Float32Array; nb: { i: number; s: number }[]; unknown: string[]; src: KnnState['src'] }
const knnCache = new Map<string, { i: number; s: number }[]>();

export function knnView(S: Frame): KnnView {
  const st = knnOf(S), lang = S.lang as Lg;
  let ids: number[] = [], unknown: string[] = [];
  if (st.src === 'tap' && st.tap >= 0) ids = [st.tap];
  else if (st.src === 'typed') { const r = parse(String(S.p.w ?? ''), lang); ids = r.ids.slice(0, 4); unknown = r.unknown; }
  if (!ids.length && st.src !== 'typed') ids = [KNN_WORDS[st.k % KNN_WORDS.length]];
  const vec = ids.length ? mean(ids) : new Float32Array(100), key = ids.join('+');
  let nb = knnCache.get(key);
  if (!nb) { nb = ids.length ? nearestTo(vec, 10, ids) : []; knnCache.set(key, nb); }
  return { ids, key, vec, nb, unknown, src: st.src };
}

export function updateKnn(S: Frame) {
  const st = knnOf(S), w = String(S.p.w ?? '');
  if (w !== st.lastW) { st.lastW = w; if (w.trim()) { st.src = 'typed'; st.dwell = 0; } else if (st.src === 'typed') st.src = 'preset'; }
  const v = knnView(S);
  if (v.key !== st.key) { st.key = v.key; st.dwell = st.src === 'typed' ? 0 : DWELL; }
  else st.dwell += S.dt;
  if (v.ids.length && st.dwell >= DWELL && (st.src !== 'preset' || st.k > 0 || S.p.nextW > 0) && !st.seen.includes(v.key)) st.seen.push(v.key);
  if (st.seen.length >= 3 && (S.touched.has('w') || S.touched.has('nextW'))) S.complete('knn');
}
export function actionKnn(S: Frame, id: string) {
  const st = knnOf(S);
  if (id === 'nextW') { st.k++; st.src = 'preset'; st.dwell = DWELL; }
}

// ═════════════ turno 2 · aritmética de palabras ═════════════
type Term = { k: string; s: 1 | -1 };
export const ARITH_PRESETS: Term[][] = [
  [{ k: 'king', s: 1 }, { k: 'man', s: -1 }, { k: 'woman', s: 1 }],
  [{ k: 'paris', s: 1 }, { k: 'france', s: -1 }, { k: 'italy', s: 1 }],
  [{ k: 'tokyo', s: 1 }, { k: 'japan', s: -1 }, { k: 'france', s: 1 }],
  [{ k: 'father', s: 1 }, { k: 'man', s: -1 }, { k: 'woman', s: 1 }],
  [{ k: 'dog', s: 1 }, { k: 'puppy', s: -1 }, { k: 'kitten', s: 1 }],
  [{ k: 'beer', s: 1 }, { k: 'germany', s: -1 }, { k: 'france', s: 1 }],
  [{ k: 'hot', s: 1 }, { k: 'cold', s: -1 }, { k: 'day', s: 1 }],
];
export interface ArState { src: 'preset' | 'typed'; k: number; lastE: string; key: string; dwell: number; seen: string[]; on: boolean; off: boolean }
export const arOf = (S: Frame): ArState => (S.st.ar ??= { src: 'preset', k: 0, lastE: '', key: '', dwell: 0, seen: [], on: false, off: false } as ArState);
export interface ArView { terms: { i: number; sign: 1 | -1 }[]; bad: string[]; key: string; valid: boolean; excl: { i: number; s: number }[]; incl: { i: number; s: number }[]; src: ArState['src'] }
const arCache = new Map<string, { excl: { i: number; s: number }[]; incl: { i: number; s: number }[] }>();

export function arithTerms(S: Frame): { terms: { i: number; sign: 1 | -1 }[]; bad: string[] } {
  const st = arOf(S);
  if (st.src === 'typed') { const r = parseExpr(String(S.p.expr ?? ''), S.lang as Lg); return r ? { terms: r.terms.map((t) => ({ i: t.i, sign: t.sign })), bad: r.bad } : { terms: [], bad: [] }; }
  return { terms: ARITH_PRESETS[st.k % ARITH_PRESETS.length].map((t) => ({ i: idOf(t.k), sign: t.s })), bad: [] };
}
export function arithView(S: Frame): ArView {
  const st = arOf(S), { terms, bad } = arithTerms(S);
  const key = terms.map((t) => (t.sign > 0 ? '+' : '-') + t.i).join('');
  const valid = terms.length >= 2;
  let r = arCache.get(key);
  if (!r) {
    if (valid) { const v = combine(terms.map((t) => ({ i: t.i, sign: t.sign }))); r = { excl: nearestTo(v, 6, terms.map((t) => t.i)), incl: nearestTo(v, 6) }; } else r = { excl: [], incl: [] };
    arCache.set(key, r);
  }
  return { terms, bad, key, valid, excl: r.excl, incl: r.incl, src: st.src };
}
export function updateArith(S: Frame) {
  const st = arOf(S), e = String(S.p.expr ?? '');
  if (e !== st.lastE) { st.lastE = e; if (e.trim()) { st.src = 'typed'; st.dwell = 0; } else if (st.src === 'typed') st.src = 'preset'; }
  const v = arithView(S);
  if (v.key !== st.key) { st.key = v.key; st.dwell = st.src === 'typed' ? 0 : DWELL; } else st.dwell += S.dt;
  if (v.valid) { if (S.p.excl === false) st.off = true; else st.on = true; }
  if (v.valid && st.dwell >= DWELL && (st.src !== 'preset' || st.k > 0 || S.p.nextE > 0) && !st.seen.includes(v.key)) st.seen.push(v.key);
  if (st.seen.length >= 2 && st.on && st.off && ['expr', 'nextE', 'excl'].some((k) => S.touched.has(k))) S.complete('arith');
}
export function actionArith(S: Frame, id: string) {
  const st = arOf(S);
  if (id === 'nextE') { st.k++; st.src = 'preset'; st.dwell = DWELL; }
}

// ═════════════ turno 3 · búsqueda ═════════════
export interface SeState { src: 'preset' | 'typed'; k: number; lastQ: string; key: string; dwell: number; seen: string[]; zero: boolean }
export const seOf = (S: Frame): SeState => (S.st.se ??= { src: 'preset', k: 0, lastQ: '', key: '', dwell: 0, seen: [], zero: false } as SeState);
export interface SeView { text: string; res: Result; key: string; src: SeState['src'] }
const seCache = new Map<string, Result>();

export function searchText(S: Frame): string {
  const st = seOf(S), lang = S.lang as Lg;
  return st.src === 'typed' ? String(S.p.qry ?? '') : QUERIES[PRESETS[st.k % PRESETS.length]][lang];
}
export function searchView(S: Frame): SeView {
  const st = seOf(S), text = searchText(S), key = S.lang + '|' + text.trim().toLowerCase();
  let res = seCache.get(key);
  if (!res) { res = search(text, S.lang as Lg); seCache.set(key, res); }
  return { text, res, key, src: st.src };
}
export function updateSearch(S: Frame) {
  const st = seOf(S), q = String(S.p.qry ?? '');
  if (q !== st.lastQ) { st.lastQ = q; if (q.trim()) { st.src = 'typed'; st.dwell = 0; } else if (st.src === 'typed') st.src = 'preset'; }
  const v = searchView(S);
  if (v.key !== st.key) { st.key = v.key; st.dwell = st.src === 'typed' ? 0 : DWELL; } else st.dwell += S.dt;
  const counted = st.dwell >= DWELL && v.text.trim() && (st.src !== 'preset' || st.k > 0 || S.p.nextQ > 0);
  if (counted && !st.seen.includes(v.key)) {
    st.seen.push(v.key);
    if (v.res.exact.every((h) => h.score === 0)) st.zero = true;
  }
  if (st.seen.length >= 3 && st.zero && (S.touched.has('qry') || S.touched.has('nextQ'))) S.complete('search');
}
export function actionSearch(S: Frame, id: string) {
  const st = seOf(S);
  if (id === 'nextQ') { st.k++; st.src = 'preset'; st.dwell = DWELL; }
}
