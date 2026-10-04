// Datos compartidos de la escena: el rastro del pase hacia delante de «el gato bebe» (calculado de verdad, con memoria),
// la geometría común y las constantes de la lección. Todo es derivado de los pesos entrenados (weights.ts): nada se inventa aquí.
import { inset, type Frame, type Rect } from '../../../../../theme/kit';
import { forward, idsOf, type Lang, type RunOpts, type Trace } from './model';

export const PROMPT: Record<Lang, string[]> = { es: ['el', 'gato', 'bebe'], en: ['the', 'cat', 'drinks'] };
/** Frase de cinco palabras del experimento de la máscara (la misma que train_tiny.py guardó para el modelo sin máscara). */
export const SENT5: Record<Lang, string[]> = { es: ['el', 'gato', 'come', 'pescado', '.'], en: ['the', 'cat', 'eats', 'fish', '.'] };
/** Frase completa del bucle. */
export const FULL: Record<Lang, string[]> = { es: ['el', 'gato', 'bebe', 'leche', '.'], en: ['the', 'cat', 'drinks', 'milk', '.'] };

const cache = new Map<string, Trace>();
/** Pase hacia delante con memoria (función pura de sus argumentos). */
export function run(lang: Lang, words: string[], o: RunOpts = {}): Trace {
  const key = `${lang}|${words.join(' ')}|${o.mask === false ? 'M0' : 'M1'}${o.attention === false ? 'A0' : 'A1'}`;
  let t = cache.get(key); if (!t) { t = forward(lang, idsOf(lang, words), o); cache.set(key, t); }
  return t;
}
export const trace = (S: Frame) => run(S.lang as Lang, PROMPT[S.lang as Lang]);
/** Índice (0-based) del token «bebe» en el prompt. */
export const LAST = 2;

/** Reparto común: barra de etapa arriba y cuerpo debajo. */
export function lay(S: Frame) {
  const all = inset(S.full(), 12), barH = 22;
  const bar: Rect = { x: all.x, y: all.y, w: all.w, h: barH };
  const body: Rect = { x: all.x, y: all.y + barH + 6, w: all.w, h: all.h - barH - 6 };
  return { all, bar, body };
}
export type Lay = ReturnType<typeof lay>;
/** Escala de una vista: cuántas veces cabe su tamaño natural (w × h px, pensado para teléfono) en el cuerpo. Entre 1 y max. */
export const fit = (b: Rect, w: number, h: number, max = 1.55) => Math.max(1, Math.min(b.w / w, b.h / h, max));

/** Etapa de la tubería en la que está cada segmento (para la barra de arriba). */
export const STAGES: Record<Lang, string[]> = {
  es: ['Entrada', 'Vectores', 'Bloques', 'Salida', 'Tamaño'],
  en: ['Input', 'Vectors', 'Blocks', 'Output', 'Size'],
};
export const STAGE_OF: [string, number][] = [
  ['tokens-in', 0], ['embed', 1], ['block', 2], ['logits', 3], ['decoder-only', 2], ['params-intro', 4], ['honest-today', -1],
];
