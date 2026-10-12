// Estado interactivo y constantes compartidas por las vistas de la escena (todo determinista).
import { along, type Frame } from '../../../../../theme/kit';
import * as L from './latent';

export type P2 = [number, number];

/** El siete de ejemplo de toda la lección (imagen de entrenamiento 477): tinta arriba 12.0, tinta abajo 7.75;
 *  código del autocodificador (−0.54, 0.61); error de reconstrucción 0.84. */
export const EX = 477;
/** Punto del espacio latente del VAE que da el «siete nuevo» del principio (se lee como 7 con p = 0.99; su vecino de
 *  entrenamiento más cercano está a 0.79, más lejos que muchos dígitos reales entre sí). */
export const NEW_Z: P2 = [2.0, 0.3];
export const NEW_IMG = L.decVAE(NEW_Z[0], NEW_Z[1]);
/** Puntos nuevos que la escena saca sola en «sample» (los demás los saca la persona con el botón). */
export const AUTO_N = 24;

export interface St {
  /** Pulsaciones del botón «Sacar un punto nuevo» y el reloj de cada una (para animarlas). */
  presses: number[];
  /** Punto que la persona arrastró en el plano (null: sigue el camino del deslizador). */
  z: P2 | null;
  drag: boolean;
  lastWalk: number;
  /** Posición continua del paseo guiado (el deslizador muestra su redondeo). */
  wf: number;
  lastSeen: string;
  found: boolean[];
}
const fresh = (): St => ({ presses: [], z: null, drag: false, lastWalk: -1, wf: 0, lastSeen: '', found: new Array(10).fill(false) });
export const stOf = (S: Frame): St => (S.st.s ??= fresh()) as St;
export const resetSt = (S: Frame) => { S.st.s = fresh(); };

// ── el plano del autocodificador ──
const median = (codes: L.Codes, k: number): P2 => {
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === k) { xs.push(codes.x[i]); ys.push(codes.y[i]); }
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  return [xs[xs.length >> 1], ys[ys.length >> 1]];
};
export const MED_AE: P2[] = Array.from({ length: 10 }, (_, k) => median(L.CODES_AE, k));
export const MED_VAE: P2[] = Array.from({ length: 10 }, (_, k) => median(L.CODES_VAE, k));

/** Camino del paseo: pasa por los grupos 7 → 3 → 9 → 0 → 6 → 4 (Catmull-Rom). Por el camino se leen 7, 3, 9, 5, 0, 6 y 4. */
export const WALK = [7, 3, 9, 0, 6, 4];
export const PATH: P2[] = (() => {
  const c = WALK.map((k) => MED_AE[k]), out: P2[] = [];
  for (let s = 0; s < c.length - 1; s++) {
    const p0 = c[Math.max(0, s - 1)], p1 = c[s], p2 = c[s + 1], p3 = c[Math.min(c.length - 1, s + 2)];
    for (let i = 0; i < 24; i++) {
      const t = i / 24, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(c[c.length - 1]);
  return out;
})();
export const pathAt = (t: number): P2 => along(PATH, t);
/** Dónde está el punto que recorre el plano: el que arrastró la persona o el del deslizador. */
export const explorerZ = (S: Frame): P2 => { const st = stOf(S); return st.z ?? pathAt((S.touched.has('walk') ? S.p.walk ?? 0 : st.wf) / 100); };

/** Huecos grandes del plano del autocodificador dentro del recuadro de sus códigos (centro y radio sin ningún código dentro;
 *  calculados offline con los mismos pesos) y la zona más apiñada (sietes, ochos y doses). */
export const HOLES: [number, number, number][] = [[-7.72, -0.23, 3.4], [12.44, -9.49, 2.5], [12.44, -17.95, 2.4]];
export const CROWD: [number, number, number] = [-0.1, -1.7, 2.4];
/** Un punto dentro del hueco de arriba a la izquierda: se decodifica como una mancha (el lector duda: p = 0.39). */
export const JUNK: P2 = [-9, 2];
