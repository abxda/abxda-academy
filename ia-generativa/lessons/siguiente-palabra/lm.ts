// Un modelo de lenguaje de verdad, a pequeña escala: n-gramas de palabras contados sobre un texto de dominio público
// (corpus.ts). Todo es puro y determinista: la misma semilla da el mismo texto, así que la escena puede dibujar
// cualquier instante de la lección sin guardar estado.
//
// Receta (la misma que se explica en «Por dentro»):
//   1. Normalizar: minúsculas; «?» y «!» se funden en «.»; «:» en «,»; se quitan comillas, guiones y paréntesis.
//   2. Partir en palabras y signos (. , ;). Cada palabra o signo es una «pieza».
//   3. Contar, para cada contexto (la última pieza, o las dos últimas), qué pieza viene después.
//   4. Puntuación de cada candidata: z = ln(cuenta). Probabilidad: softmax(z / T). Con T = 1 es cuenta / total.
//   5. Recorte opcional (top-k, top-p), renormalizar y sortear (o elegir la más probable: «voraz»).
import { rng } from '../../../../../core/scene/math';

export type Lang = 'es' | 'en';
export const isPunct = (w: string) => w === '.' || w === ',' || w === ';';

export interface Row { w: string; c: number }
export interface Prob { w: string; c: number; z: number; p: number; keep: boolean; q: number }
export interface Model {
  lang: Lang;
  toks: string[];
  t1: Map<string, Row[]>;
  t2: Map<string, Row[]>;
  /** Cómo se escribe una palabra (mayúscula de nombres propios, «I» en inglés). */
  show: (w: string, startOfSentence?: boolean) => string;
  stats: { tokens: number; vocab: number; pairs1: number; pairs2: number; ctx1: number; ctx2: number; single1: number; single2: number };
}

// ───────── texto → piezas ─────────
function scan(text: string, lang: Lang): string[] {
  const t = text.replace(/[’‘]/g, "'").replace(/[?!]/g, '.').replace(/:/g, ',').replace(/[¿¡«»"“”()[\]—–\-_…*]/g, ' ');
  const re = lang === 'es' ? /[a-záéíóúüñ]+|[.,;]/gi : /[a-z]+(?:'[a-z]+)?|[.,;]/gi;
  const raw = t.match(re) ?? [];
  return raw.filter((w, i) => !(isPunct(w) && i > 0 && isPunct(raw[i - 1])));   // sin signos repetidos
}
export const tokenize = (text: string, lang: Lang): string[] => scan(text, lang).map((w) => w.toLowerCase());

function makeShow(raw: string[]): Model['show'] {
  const cap = new Map<string, number>(), low = new Map<string, number>();
  raw.forEach((w, i) => {
    if (isPunct(w) || i === 0 || raw[i - 1] === '.') return;             // las mayúsculas de inicio de oración no cuentan
    const k = w.toLowerCase(), isCap = w[0] !== k[0];
    (isCap ? cap : low).set(k, ((isCap ? cap : low).get(k) ?? 0) + 1);
  });
  return (w, start = false) => {
    if (isPunct(w)) return w;
    const up = start || (cap.get(w) ?? 0) > (low.get(w) ?? 0);
    return up ? w[0].toUpperCase() + w.slice(1) : w;
  };
}

// ───────── contar ─────────
export function buildModel(paragraphs: string[], lang: Lang): Model {
  const text = paragraphs.join(' ');
  const raw = scan(text, lang), toks = raw.map((w) => w.toLowerCase());
  const first = new Map<string, number>(); toks.forEach((w, i) => { if (!first.has(w)) first.set(w, i); });
  const count = (k: number) => {
    const m = new Map<string, Map<string, number>>();
    for (let i = k; i < toks.length; i++) {
      const key = toks.slice(i - k, i).join(' ');
      let e = m.get(key); if (!e) m.set(key, (e = new Map()));
      e.set(toks[i], (e.get(toks[i]) ?? 0) + 1);
    }
    const out = new Map<string, Row[]>();
    for (const [key, e] of m) out.set(key, [...e].map(([w, c]) => ({ w, c })).sort((a, b) => b.c - a.c || first.get(a.w)! - first.get(b.w)!));
    return out;
  };
  const t1 = count(1), t2 = count(2);
  const pairs = (t: Map<string, Row[]>) => [...t.values()].reduce((a, r) => a + r.length, 0);
  const single = (t: Map<string, Row[]>) => [...t.values()].filter((r) => r.length === 1).length;
  return {
    lang, toks, t1, t2, show: makeShow(raw),
    stats: { tokens: toks.length, vocab: first.size, pairs1: pairs(t1), pairs2: pairs(t2), ctx1: t1.size, ctx2: t2.size, single1: single(t1), single2: single(t2) },
  };
}

/** Candidatas para un contexto: usa las k últimas piezas y, si nunca se vieron juntas, retrocede a k − 1. */
export function lookup(m: Model, ctx: string[], k: 1 | 2): { rows: Row[]; total: number; k: 1 | 2; backoff: boolean } | null {
  if (k === 2 && ctx.length >= 2) {
    const r = m.t2.get(ctx.slice(-2).join(' '));
    if (r) return { rows: r, total: r.reduce((a, x) => a + x.c, 0), k: 2, backoff: false };
  }
  const r1 = ctx.length ? m.t1.get(ctx[ctx.length - 1]) : undefined;
  if (r1) return { rows: r1, total: r1.reduce((a, x) => a + x.c, 0), k: 1, backoff: k === 2 };
  return null;
}

// ───────── puntuaciones → probabilidades ─────────
/** softmax(z / T), con la resta del máximo para que sea estable. */
export function softmax(z: number[], T = 1): number[] {
  const s = z.map((v) => v / T), mx = Math.max(...s), e = s.map((v) => Math.exp(v - mx)), tot = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / tot);
}

/** Puntuación z = ln(cuenta); probabilidad = softmax(z / T). Las filas llegan ordenadas de mayor a menor cuenta. */
export function probs(rows: Row[], T = 1): Prob[] {
  const z = rows.map((r) => Math.log(r.c)), p = softmax(z, T);
  return rows.map((r, i) => ({ w: r.w, c: r.c, z: z[i], p: p[i], keep: true, q: p[i] }));
}

/** Recorta (top-k y/o top-p) y renormaliza: `keep` marca las que sobreviven y `q` es su probabilidad nueva. */
export function truncate(ps: Prob[], o: { topK?: number; topP?: number } = {}): Prob[] {
  let keep = ps.map(() => true);
  if (o.topK !== undefined && o.topK < ps.length) keep = ps.map((_, i) => i < Math.max(1, o.topK!));
  if (o.topP !== undefined && o.topP < 1) {
    const mass = ps.reduce((a, x, i) => a + (keep[i] ? x.p : 0), 0);
    let acc = 0, done = false;
    keep = ps.map((x, i) => {
      if (!keep[i] || done) return false;
      acc += x.p / mass;
      if (acc >= o.topP! - 1e-9) done = true;
      return true;
    });
  }
  const tot = ps.reduce((a, x, i) => a + (keep[i] ? x.p : 0), 0);
  return ps.map((x, i) => ({ ...x, keep: keep[i], q: keep[i] ? x.p / tot : 0 }));
}

/** Cuántas palabras hacen falta (de las más probables) para cubrir una masa p. */
export function nucleusSize(ps: Prob[], p: number): number {
  let acc = 0;
  for (let i = 0; i < ps.length; i++) { acc += ps[i].p; if (acc >= p - 1e-9) return i + 1; }
  return ps.length;
}

/** Elige un índice entre las que sobreviven, con u uniforme en [0, 1). */
export function choose(ps: Prob[], u: number): number {
  let acc = 0, last = 0;
  for (let i = 0; i < ps.length; i++) { if (!ps[i].keep) continue; acc += ps[i].q; last = i; if (u < acc) return i; }
  return last;
}

// ───────── generar (autorregresión) ─────────
export interface GenOpts { k: 1 | 2; T: number; topK?: number; topP?: number; greedy?: boolean }
export interface Step { ctx: string[]; ps: Prob[]; pick: number; k: 1 | 2; backoff: boolean; restart: boolean }

/** `n` pasos del bucle: mirar el contexto, calcular probabilidades, elegir, agregar. Determinista dada la semilla. */
export function generate(m: Model, start: string[], n: number, o: GenOpts, seed: number): Step[] {
  const r = rng(seed), out = [...start], steps: Step[] = [];
  for (let i = 0; i < n; i++) {
    let hit = lookup(m, out, o.k), restart = false;
    if (!hit) { const rows = m.t1.get('.')!; hit = { rows, total: rows.reduce((a, x) => a + x.c, 0), k: 1, backoff: true }; restart = true; }
    const ps = truncate(probs(hit.rows, o.T), { topK: o.topK, topP: o.topP });
    const pick = o.greedy ? 0 : choose(ps, r());
    steps.push({ ctx: out.slice(-2), ps, pick, k: hit.k, backoff: hit.backoff, restart });
    out.push(ps[pick].w);
  }
  return steps;
}

/** Texto legible a partir de piezas: sin espacio antes de los signos y con mayúscula tras un punto. */
export function pretty(m: Model, words: string[], startCap = true): string {
  let s = '';
  words.forEach((w, i) => {
    const sent = (i === 0 && startCap) || (i > 0 && words[i - 1] === '.');
    s += (isPunct(w) || i === 0 ? '' : ' ') + m.show(w, sent);
  });
  return s;
}

/** Primeras apariciones de una palabra en el corpus, con su contexto previo y la palabra siguiente. */
export function kwic(m: Model, word: string, max: number, before = 4): { left: string[]; next: string }[] {
  const out: { left: string[]; next: string }[] = [];
  for (let i = 0; i + 1 < m.toks.length && out.length < max; i++) if (m.toks[i] === word) out.push({ left: m.toks.slice(Math.max(0, i - before), i), next: m.toks[i + 1] });
  return out;
}
