// Utilidades de tiempo, tamaño y formato de esta lección. Las voces y los idiomas duran distinto: todo se anima por
// fracciones de la duración de cada segmento (fr), nunca por segundos absolutos.
import type { Frame } from '../../../../../theme/kit';

/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de algo que vive desde el segmento a hasta el b (entra y sale con desvanecido, por fracciones). */
export const live = (S: Frame, a: string, b?: string, fin = 0.12, fout = 0.12) => fr(S, a, 0, fin) * (b ? 1 - fr(S, b, 0, fout) : 1);
/** Tamaño de texto con piso de 12 px efectivos (S.u < 1 en teléfono). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
/** Espaciado que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);
/** Número con signo menos tipográfico. */
export const num = (S: Frame, x: number, digits = 2) => S.n(x, digits).replace('-', '−');
export const pct = (S: Frame, f: number, digits = 0) => `${S.n(f * 100, digits)}${S.lang === 'es' ? ' %' : '%'}`;
export const steps = (S: Frame, n: number) => S.n(n, 0);
/** Ajusta el tamaño de un texto para que quepa en w (sin bajar de 12 px efectivos). */
export function fit(S: Frame, text: string, w: number, size: number, weight = 700, font: 'ui' | 'mono' = 'ui') {
  let s = size;
  while (s > 12 / S.u && S.d.measure(text, { size: s, weight, font }) > w) s -= 0.5;
  return Math.max(s, 12 / S.u);
}
