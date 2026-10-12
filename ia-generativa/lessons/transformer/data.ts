// Datos de la escena: frases, pases hacia delante del transformer diminuto (calculados de verdad, con memoria) y cifras
// derivadas. Todo sale de los pesos entrenados (weights.ts, train_tiny.py) y de model.ts: aquí no se inventa ningún número.
import { forward, idsOf, layerNorm, softmax, type Lang, type Mat, type Trace } from './model';
import { MASK_EXP, TINY } from './weights';

export const DET: Record<Lang, string> = { es: 'el', en: 'the' };
export const SUBJ: Record<Lang, string[]> = { es: ['gato', 'perro', 'loro'], en: ['cat', 'dog', 'parrot'] };
export const VERB: Record<Lang, string> = { es: 'come', en: 'eats' };
/** Frase de entrenamiento del acto de la máscara (la misma que train_tiny.py usó para el modelo sin máscara). */
export const SENT5: Record<Lang, string[]> = { es: ['el', 'gato', 'come', 'pescado', '.'], en: ['the', 'cat', 'eats', 'fish', '.'] };
export const vocab = (lang: Lang) => TINY[lang].vocab;
export const promptOf = (lang: Lang, s: number) => [DET[lang], SUBJ[lang][s], VERB[lang]];

const cache = new Map<string, Trace>();
/** Pase hacia delante con memoria (función pura de sus argumentos). */
export function run(lang: Lang, words: string[], attention = true): Trace {
  const key = `${lang}|${words.join(' ')}|${attention ? 1 : 0}`;
  let t = cache.get(key); if (!t) { t = forward(lang, idsOf(lang, words), { attention }); cache.set(key, t); }
  return t;
}
/** Pase de «el SUJETO come» (s = 0 gato, 1 perro, 2 loro). */
export const passOf = (lang: Lang, s: number, attention = true) => run(lang, promptOf(lang, s), attention);
/** Índice del token «come» (el último) en el prompt. */
export const LAST = 2;

/** Pesos de atención de una cabeza (bloque l, cabeza h), fila de cada token. */
export const attnRow = (tr: Trace, l: number, h: number, i: number) => tr.blocks[l].weights[h][i];

/** «La atención sola no sabe el orden»: la cabeza 1 del bloque 1 de nuestro modelo sobre los embeddings SOLOS (sin posición)
 *  y sin máscara. Devuelve los pesos de «come» hacia cada token, en el orden dado. Barajar los tokens solo baraja los pesos. */
export function noPosWeights(lang: Lang, words: string[], who: string): number[] {
  const W = TINY[lang], b = W.blocks[0], d = 8, dh = 4, ids = idsOf(lang, words);
  const h = ids.map((t) => layerNorm(W.E.slice(t * d, (t + 1) * d), b.ln1g, b.ln1b).y);
  const lin = (x: number[], M: number[], bias: number[]) => Array.from({ length: d }, (_, j) => bias[j] + x.reduce((a, v, i) => a + v * M[i * d + j], 0));
  const q = h.map((x) => lin(x, b.wq, b.bq).slice(0, dh)), k = h.map((x) => lin(x, b.wk, b.bk).slice(0, dh));
  const i = words.indexOf(who);
  return softmax(k.map((kj) => q[i].reduce((a, u, c) => a + u * kj[c], 0) / Math.sqrt(dh)));
}

// ───────── experimento de la máscara (train_tiny.py) ─────────
/** Tabla de atención (bloque 2, cabeza 1) del modelo entrenado SIN máscara, sobre SENT5. */
export const tableUnmasked = (lang: Lang): Mat => MASK_EXP[lang].attnU[1][0];
/** La misma cabeza de nuestro modelo (con máscara) sobre SENT5. */
export const tableMasked = (lang: Lang): Mat => run(lang, SENT5[lang]).blocks[1].weights[0];
export const MASK_NUMS = (lang: Lang) => {
  const e = MASK_EXP[lang];
  return {
    trainUnmasked: e.unmasked[e.unmasked.length - 1],   // 0.059: pérdida de entrenamiento del modelo que copia
    trainMasked: e.masked[e.masked.length - 1],         // 0.526: la nuestra
    realUnmasked: e.valUnmaskedHonest,                  // 3.088: el que copiaba, usado sin futuro
    realMasked: e.valMasked,                            // 0.527: el nuestro, con frases nuevas
    random: Math.log(12),                               // 2.485: repartir por igual entre doce palabras
  };
};

/** Media y desviación estándar (sesgada, como la normalización de capa). */
export function stats(v: number[]) {
  const m = v.reduce((a, x) => a + x, 0) / v.length, s = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length);
  return { mean: m, std: s };
}
