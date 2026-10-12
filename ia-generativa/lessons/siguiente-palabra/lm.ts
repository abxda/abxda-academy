// Un modelo de lenguaje de verdad, a escala diminuta: un modelo de n-gramas de pares de palabras (bigramas) contado
// sobre un texto de ocho frases escrito para esta lección (CORPUS). Todo es puro y determinista: la misma semilla da
// el mismo texto, así que la escena puede dibujar cualquier instante de la lección sin guardar estado.
//
// Por qué un texto propio y tan corto: quien mira puede leerlo entero y contar con la escena. Las frases en español y
// en inglés son paralelas palabra por palabra (el ↔ the, cielo ↔ sky, es ↔ is…), con una correspondencia uno a uno
// entre palabras; por eso todas las cuentas, probabilidades y textos generados coinciden en los dos idiomas y la voz
// dice las mismas cifras. verify-data.ts lo comprueba.
//
// Receta (la misma que se explica en «por dentro»):
//   1. Partir cada frase en piezas: palabras y el punto final.
//   2. Contar, para cada pieza, qué pieza viene justo después (también de una frase a la siguiente).
//   3. Probabilidad = cuenta ÷ total. Con puntajes z = ln(cuenta) y softmax(z / T) se obtiene lo mismo con T = 1.
//   4. Elegir: la más probable (voraz) o sortear con las probabilidades como pesos.
import { rng } from '../../../../../core/scene/math';

export type Lang = 'es' | 'en';

/** El texto que «leyó» el modelo: ocho frases cortas, paralelas en los dos idiomas. Escrito para la lección (sin derechos de terceros). */
export const CORPUS: Record<Lang, string[]> = {
  es: [
    'el cielo es azul .',
    'el mar es azul .',
    'el cielo es gris .',
    'el sol es grande .',
    'de noche el cielo es oscuro .',
    'el cielo es azul y el sol brilla .',
    'el mar es gris .',
    'hoy el cielo es azul .',
  ],
  en: [
    'the sky is blue .',
    'the sea is blue .',
    'the sky is gray .',
    'the sun is big .',
    'at night the sky is dark .',
    'the sky is blue and the sun shines .',
    'the sea is gray .',
    'today the sky is blue .',
  ],
};

export interface Row { w: string; c: number }
export interface Prob { w: string; c: number; z: number; p: number; keep: boolean; q: number }
export interface Model {
  lang: Lang;
  /** Todas las piezas del texto, en orden. */
  toks: string[];
  /** Para cada pieza, qué piezas la siguen y cuántas veces (de mayor a menor; empate: la que apareció antes). */
  t1: Map<string, Row[]>;
}

export function buildModel(lang: Lang): Model {
  const toks = CORPUS[lang].join(' ').split(/\s+/).filter(Boolean);
  const first = new Map<string, number>();
  toks.forEach((w, i) => { if (!first.has(w)) first.set(w, i); });
  const m = new Map<string, Map<string, number>>();
  for (let i = 1; i < toks.length; i++) {
    const key = toks[i - 1];
    let e = m.get(key); if (!e) m.set(key, (e = new Map()));
    e.set(toks[i], (e.get(toks[i]) ?? 0) + 1);
  }
  const t1 = new Map<string, Row[]>();
  for (const [key, e] of m) t1.set(key, [...e].map(([w, c]) => ({ w, c })).sort((a, b) => b.c - a.c || first.get(a.w)! - first.get(b.w)!));
  return { lang, toks, t1 };
}

const MODELS: Partial<Record<Lang, Model>> = {};
export const modelOf = (lang: Lang): Model => (MODELS[lang] ??= buildModel(lang));

/** Filas (cuentas) para la última pieza del contexto; null si esa pieza nunca apareció con algo después. */
export const rowsFor = (m: Model, w: string): Row[] | null => m.t1.get(w) ?? null;

/** softmax(z / T), restando el máximo para que sea estable. */
export function softmax(z: number[], T = 1): number[] {
  const s = z.map((v) => v / T), mx = Math.max(...s), e = s.map((v) => Math.exp(v - mx)), tot = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / tot);
}

/** Puntaje z = ln(cuenta); probabilidad = softmax(z / T). Con T = 1 es cuenta ÷ total. */
export function probs(rows: Row[], T = 1): Prob[] {
  const z = rows.map((r) => Math.log(r.c)), p = softmax(z, T);
  return rows.map((r, i) => ({ w: r.w, c: r.c, z: z[i], p: p[i], keep: true, q: p[i] }));
}

/** Recorte top-k y/o top-p, y nuevo reparto: `keep` marca las que quedan y `q` es su probabilidad nueva. */
export function truncate(ps: Prob[], o: { topK?: number; topP?: number } = {}): Prob[] {
  let keep = ps.map(() => true);
  if (o.topK !== undefined && o.topK < ps.length) keep = ps.map((_, i) => i < Math.max(1, o.topK!));
  if (o.topP !== undefined && o.topP < 1) {
    let acc = 0, done = false;
    keep = ps.map((x, i) => {
      if (!keep[i] || done) return false;
      acc += x.p;
      if (acc >= o.topP! - 1e-9) done = true;
      return true;
    });
  }
  const tot = ps.reduce((a, x, i) => a + (keep[i] ? x.p : 0), 0);
  return ps.map((x, i) => ({ ...x, keep: keep[i], q: keep[i] ? x.p / tot : 0 }));
}

/** Índice elegido al sortear con u uniforme en [0, 1): el «dardo» cae en la franja de la palabra. */
export function choose(ps: Prob[], u: number): number {
  let acc = 0, last = 0;
  for (let i = 0; i < ps.length; i++) { if (!ps[i].keep) continue; acc += ps[i].q; last = i; if (u < acc) return i; }
  return last;
}

export interface Step { ctx: string; ps: Prob[]; pick: number; u: number }

/** `n` vueltas del bucle: mirar la última pieza, sacar sus probabilidades, elegir y agregar. Determinista dada la semilla. */
export function generate(m: Model, start: string[], n: number, o: { T?: number; greedy?: boolean } = {}, seed = 1): Step[] {
  const r = rng(seed), out = [...start], steps: Step[] = [];
  for (let i = 0; i < n; i++) {
    const last = out[out.length - 1], rows = rowsFor(m, last) ?? rowsFor(m, '.')!;
    const ps = probs(rows, o.T ?? 1), u = r();
    const pick = o.greedy ? 0 : choose(ps, u);
    steps.push({ ctx: last, ps, pick, u });
    out.push(ps[pick].w);
  }
  return steps;
}
export const wordsOf = (start: string[], st: Step[]) => [...start, ...st.map((s) => s.ps[s.pick].w)];

/** Texto legible: sin espacio antes del punto y con mayúscula al empezar cada frase. */
export function pretty(words: string[]): string {
  let s = '';
  words.forEach((w, i) => {
    const cap = i === 0 || words[i - 1] === '.';
    const shown = w === '.' ? '.' : cap ? w[0].toUpperCase() + w.slice(1) : w;
    s += (w === '.' || i === 0 ? '' : ' ') + shown;
  });
  return s;
}

/** ¿Aparece esta secuencia de piezas, tal cual, en el texto? */
export function inCorpus(m: Model, seq: string[]): boolean {
  for (let i = 0; i + seq.length <= m.toks.length; i++) if (seq.every((w, j) => m.toks[i + j] === w)) return true;
  return false;
}

/** Las frases del texto generado (separadas por el punto) que no están en el texto original. */
export function novelSentences(m: Model, words: string[]): [number, number][] {
  const out: [number, number][] = [];
  let s = 0;
  for (let i = 0; i < words.length; i++) {
    if (words[i] !== '.') continue;
    let a = s;
    // una frase completa empieza tras un punto (o al principio)
    const seq = words.slice(a, i + 1);
    if (seq.length >= 3 && !CORPUS[m.lang].includes(seq.join(' '))) out.push([a, i]);
    s = i + 1;
  }
  return out;
}
