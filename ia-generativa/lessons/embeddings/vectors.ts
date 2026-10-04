// Vectores REALES de la lección: GloVe 6B de 100 dimensiones (Stanford, PDDL) para ≈ 900 palabras comunes.
// Se generan con build-vectors.py (ver el comentario de ese archivo: fuente, licencia y proyección t-SNE).
// Aquí solo se decodifican y se ofrecen las operaciones: coseno, vecinos, aritmética y búsqueda de palabras (es/en).
import D from './data/embeddings.json';

export type Lg = 'es' | 'en';
export const DIM: number = D.dim;
export const N: number = D.words.length;
export const KEY: string[] = D.words;
const ENG: string[] = D.disp;
const SPA: string[] = D.es;

const b64 = (s: string): Uint8Array => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };

/** Vectores de longitud 1 (N×DIM). */
export const V: Float32Array = (() => {
  const raw = new Int8Array(b64(D.q).buffer), out = new Float32Array(N * DIM);
  for (let i = 0; i < N; i++) { let s = 0; for (let k = 0; k < DIM; k++) { const x = raw[i * DIM + k]; out[i * DIM + k] = x; s += x * x; } s = 1 / Math.sqrt(s || 1); for (let k = 0; k < DIM; k++) out[i * DIM + k] *= s; }
  return out;
})();

/** Posición en el mapa t-SNE, escalada a 0..1 (la dimensión mayor ocupa 0..1). */
export const XY: Float32Array = (() => {
  const u = new Uint16Array(b64(D.xy).buffer.slice(0)), out = new Float32Array(N * 2);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < N; i++) { x0 = Math.min(x0, u[2 * i]); x1 = Math.max(x1, u[2 * i]); y0 = Math.min(y0, u[2 * i + 1]); y1 = Math.max(y1, u[2 * i + 1]); }
  for (let i = 0; i < N; i++) { out[2 * i] = (u[2 * i] - x0) / (x1 - x0); out[2 * i + 1] = (u[2 * i + 1] - y0) / (y1 - y0); }
  return out;
})();
/** Razón de aspecto del mapa (ancho / alto) tal como lo dejó t-SNE. */
export const MAP_ASPECT = 1;

export const IDX = new Map<string, number>(KEY.map((k, i) => [k, i]));
export const idOf = (key: string): number => { const i = IDX.get(key); if (i === undefined) throw new Error('palabra fuera del vocabulario: ' + key); return i; };
export const label = (lang: Lg, i: number): string => (lang === 'es' ? SPA[i] : ENG[i]);

// ── álgebra ───────────────────────────────────────────────────────────────
export const dot = (i: number, j: number) => { let s = 0; for (let k = 0; k < DIM; k++) s += V[i * DIM + k] * V[j * DIM + k]; return s; };
export const cos = dot; // los vectores del vocabulario ya tienen longitud 1
export function cosVec(v: ArrayLike<number>, i: number): number { let s = 0, n = 0; for (let k = 0; k < DIM; k++) { s += v[k] * V[i * DIM + k]; n += v[k] * v[k]; } return n > 0 ? s / Math.sqrt(n) : 0; }
export const vecOf = (i: number): Float32Array => V.slice(i * DIM, (i + 1) * DIM);

/** Los `k` más cercanos (por coseno) a un vector arbitrario. `exclude` = índices que no se devuelven. */
export function nearestTo(v: ArrayLike<number>, k: number, exclude: number[] = []): { i: number; s: number }[] {
  const ex = new Set(exclude), out: { i: number; s: number }[] = [];
  let n = 0; for (let q = 0; q < DIM; q++) n += v[q] * v[q]; n = 1 / Math.sqrt(n || 1);
  for (let i = 0; i < N; i++) {
    if (ex.has(i)) continue;
    let s = 0; for (let q = 0; q < DIM; q++) s += v[q] * V[i * DIM + q];
    s *= n;
    if (out.length < k || s > out[out.length - 1].s) {
      let p = out.length; out.push({ i, s });
      while (p > 0 && out[p - 1].s < s) { out[p] = out[p - 1]; p--; }
      out[p] = { i, s };
      if (out.length > k) out.pop();
    }
  }
  return out;
}
export const nearest = (i: number, k: number) => nearestTo(vecOf(i), k, [i]);

/** a ± b ± c …: combinación lineal de palabras. Devuelve el vector (sin normalizar). */
export function combine(terms: { i: number; sign: 1 | -1 }[]): Float32Array {
  const v = new Float32Array(DIM);
  for (const t of terms) for (let k = 0; k < DIM; k++) v[k] += t.sign * V[t.i * DIM + k];
  return v;
}
/** Promedio de palabras (la «bolsa de vectores» de la búsqueda semántica). */
export function mean(ids: number[]): Float32Array {
  const v = new Float32Array(DIM);
  for (const i of ids) for (let k = 0; k < DIM; k++) v[k] += V[i * DIM + k] / (ids.length || 1);
  return v;
}

// ── búsqueda de palabras escritas por la persona ──────────────────────────
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = (s: string) => s.toLowerCase().trim();
const exactEs = new Map<string, number>(), looseEs = new Map<string, number>(), enForms = new Map<string, number>();
(function build() {
  const put = (m: Map<string, number>, k: string, i: number) => { if (k && !m.has(k)) m.set(k, i); };
  for (let i = 0; i < N; i++) {
    const forms: string[] = [];
    const base = SPA[i];
    if (base.includes('/')) {
      // «médico/a», «enfermero/a», «juez/a», «director/a general»
      const parts = base.split(' ');
      const w0 = parts[0], rest = parts.slice(1).join(' ');
      const [stem, suf] = w0.split('/');
      forms.push(norm(stem + (rest ? ' ' + rest : '')));
      const fem = suf === 'a' ? (stem.endsWith('o') ? stem.slice(0, -1) + 'a' : stem + 'a') : suf;
      forms.push(norm(fem + (rest ? ' ' + rest : '')));
    } else forms.push(norm(base));
    for (const a of D.alias[i]) forms.push(norm(a));
    for (const f of forms) { put(exactEs, f, i); put(looseEs, strip(f), i); }
    put(enForms, KEY[i], i);
  }
})();

const EN_IRREG: Record<string, string> = { paid: 'pay', bought: 'buy', sold: 'sell', ate: 'eat', took: 'take', went: 'go', gave: 'give', came: 'come', ran: 'run', saw: 'see', wrote: 'write', knew: 'know', thought: 'think', told: 'tell', children: 'baby', men: 'man', women: 'woman', mice: 'mouse', feet: 'foot', teeth: 'tooth', people: 'people' };

function enLookup(t: string): number {
  const c = [t, EN_IRREG[t], t.replace(/ies$/, 'y'), t.replace(/es$/, ''), t.replace(/s$/, ''), t.replace(/ed$/, ''), t.replace(/d$/, ''), t.replace(/ing$/, ''), t.replace(/ing$/, 'e'), t.replace(/ly$/, '')];
  for (const x of c) if (x) { const i = enForms.get(x); if (i !== undefined) return i; }
  return -1;
}
function esLookup(t: string): number {
  const tries = [t, t.replace(/(es|s)$/, ''), t.replace(/s$/, ''), t.replace(/a$/, 'o'), t.replace(/as$/, 'o'), t.replace(/os$/, 'o'), t.replace(/(ando|iendo)$/, 'ar')];
  for (const x of tries) { const i = exactEs.get(x); if (i !== undefined) return i; }
  for (const x of tries) { const i = looseEs.get(strip(x)); if (i !== undefined) return i; }
  return -1;
}

/** Busca una palabra escrita (en el idioma de la interfaz o en inglés). Devuelve el índice o -1. */
export function lookup(token: string, lang: Lg): number {
  const t = norm(token);
  if (!t) return -1;
  const first = lang === 'es' ? esLookup : enLookup, second = lang === 'es' ? enLookup : esLookup;
  const a = first(t); if (a >= 0) return a;
  return second(t);
}

const STOP: Record<Lg, Set<string>> = {
  es: new Set('el la los las un una unos unas de del al a en por para con sin y o u e que se me mi mis tu tus su sus lo le les es son esta estan está están soy eres fue ser estar hay como mas más pero si sí no ni muy ya yo tu tú el él ella nos te cuando cuándo donde dónde que qué quien quién cual cuál cuanto cuánto porque este esto eso esa ese quiero quieres quiere puedo puede cada todo toda todos todas tengo tiene mismo hacer'.split(' ').map(norm)),
  en: new Set('a an the of to in on at for from by with and or but not is are was were be been am do does did my your his her its our their me you he she it we they i this that these those what when where how why who which can will would should could have has had get make give want every any some all back out up'.split(' ')),
};
STOP.es.delete('quiero'); // «quiero» es función aquí
export const isStop = (t: string, lang: Lg) => STOP[lang].has(norm(t)) || STOP[lang].has(strip(norm(t)));

export const words = (text: string): string[] => (text.toLowerCase().match(/[\p{L}][\p{L}'’-]*/gu) ?? []);

/** Palabras de un texto: las que el vocabulario conoce (`ids`), las que no (`unknown`) y las de relleno que se omiten (`stop`). */
export function parse(text: string, lang: Lg): { ids: number[]; known: string[]; unknown: string[] } {
  const ids: number[] = [], known: string[] = [], unknown: string[] = [];
  for (const w of words(text)) {
    if (isStop(w, lang) || (lang === 'es' && isStop(w, 'en') && lookup(w, 'es') < 0 && w.length < 4)) continue;
    const i = lookup(w, lang);
    if (i >= 0) { ids.push(i); known.push(w); } else unknown.push(w);
  }
  return { ids, known, unknown };
}

/** Expresión de la persona: «rey», «rey - hombre + mujer»… Devuelve los términos con su signo, o null si no entiende. */
export function parseExpr(text: string, lang: Lg): { terms: { i: number; sign: 1 | -1; raw: string }[]; bad: string[] } | null {
  const t = text.trim();
  if (!t) return null;
  const parts = t.replace(/[−–—]/g, '-').split(/\s*([+-])\s*/);
  const terms: { i: number; sign: 1 | -1; raw: string }[] = [], bad: string[] = [];
  let sign: 1 | -1 = 1;
  for (let q = 0; q < parts.length; q++) {
    const p = parts[q].trim();
    if (p === '+') { sign = 1; continue; }
    if (p === '-') { sign = -1; continue; }
    if (!p) continue;
    const i = lookup(p, lang);
    if (i >= 0) terms.push({ i, sign, raw: p }); else bad.push(p);
    sign = 1;
  }
  return { terms, bad };
}
