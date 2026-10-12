// Simulador de fiabilidad de un agente: cada paso sale bien con probabilidad P, de forma independiente, y basta un paso
// mal para arruinar el intento. Con revisión humana, cada CHK pasos una persona revisa el tramo: si hubo un error lo
// detecta con probabilidad Q y el tramo se repite; si se le pasa, el error se queda y el intento sale mal.
//
// Es una simulación de verdad, determinista (hash del kit, sin azar ni relojes) y con números aleatorios comunes:
// el intento i usa siempre los mismos «dados» para el paso k, así que al alargar la tarea los intentos no cambian al
// azar (un intento que falló en el paso 7 falla también con 8, 9… pasos) y al encender la revisión los errores que
// se ven son los mismos que sin ella. La semilla se eligió (comentario al final) para que la muestra de veinte
// intentos quede cerca de lo esperado.
//
// Fórmulas exactas (lo que la muestra aproxima):
//   éxito sin revisión            P^n
//   un tramo de m pasos           A = P^m ; termina (se acepta) con prob. A + (1 − A)(1 − Q)
//   éxito del tramo               A / (A + (1 − A)(1 − Q))
//   revisiones esperadas          1 / (A + (1 − A)(1 − Q))   (una por intento del tramo)
import { hash } from '../../../../../theme/kit';

export const P = 0.95;          // acierto por paso (supuesto ilustrativo)
export const Q = 0.9;           // errores que detecta quien revisa (supuesto ilustrativo)
export const RUNS = 20;         // intentos que muestra el simulador
export const MAXN = 40;         // pasos como máximo
export const CHK = 5;           // revisión cada cinco pasos
export const NREV = 20;         // pasos de la tarea en la parte de revisión
export const SEED = 10553;      // ver comentario al final

const draw = (run: number, k: number, attempt: number) => hash(SEED * 7919 + run * 104729 + 17, k * 131 + attempt * 6151 + 3);
const catchDraw = (run: number, stretch: number, attempt: number) => hash(SEED * 3571 + run * 15485863 + 29, stretch * 977 + attempt * 31 + 7);

/** ¿Sale bien el paso k del intento `run` (en su intento de tramo `attempt`)? */
export const stepOk = (run: number, k: number, attempt = 0) => draw(run, k, attempt) < P;

/** Primer paso que sale mal en el intento `run` sin revisión (MAXN si ninguno de los 40 falla). */
export function firstFail(run: number): number {
  for (let k = 0; k < MAXN; k++) if (!stepOk(run, k)) return k;
  return MAXN;
}

/** Intentos que terminan bien sin revisión, con n pasos. */
export const plainOk = (n: number) => Array.from({ length: RUNS }, (_, i) => firstFail(i) >= n).filter(Boolean).length;

export interface Stretch { redo: number[]; missed: number }   // pasos donde se detectó un error (y se repitió el tramo); paso del error que se le pasó (−1 si ninguno)
export interface ReviewRun { ok: boolean; stretches: Stretch[]; reviews: number; steps: number; failAt: number }

/** Un intento con revisión cada CHK pasos (tarea de NREV pasos). El primer intento de cada tramo usa los mismos dados que sin revisión. */
export function reviewRun(run: number): ReviewRun {
  const stretches: Stretch[] = [];
  let ok = true, reviews = 0, steps = 0, failAt = -1;
  for (let j = 0; j * CHK < NREV; j++) {
    const s: Stretch = { redo: [], missed: -1 };
    for (let a = 0; a < 30; a++) {
      let bad = -1;
      for (let t = 0; t < CHK; t++) { steps++; if (bad < 0 && !stepOk(run, j * CHK + t, a)) bad = j * CHK + t; }
      reviews++;
      if (bad < 0) break;                                   // el tramo salió bien: la revisión lo confirma
      if (catchDraw(run, j, a) < Q) { s.redo.push(bad); continue; }   // la persona lo detecta: se repite el tramo
      s.missed = bad; ok = false; if (failAt < 0) failAt = bad; break;   // se le pasa: el error se queda
    }
    stretches.push(s);
    if (!ok) break;
  }
  return { ok, stretches, reviews, steps, failAt };
}

export const REVIEW: ReviewRun[] = Array.from({ length: RUNS }, (_, i) => reviewRun(i));
export const FIRST: number[] = Array.from({ length: RUNS }, (_, i) => firstFail(i));
export const reviewOk = () => REVIEW.filter((r) => r.ok).length;

// ── exacto ──
export const chain = (p: number, n: number) => Math.pow(p, n);
export function reviewExact(p = P, n = NREV, k = CHK, q = Q) {
  let success = 1, reviews = 0, steps = 0;
  for (let left = n; left > 0; left -= k) {
    const m = Math.min(k, left), A = Math.pow(p, m), stop = A + (1 - A) * (1 - q);
    success *= A / stop; reviews += 1 / stop; steps += m / stop;
  }
  return { success, reviews, steps };
}

// Semilla: se probaron SEED = 1…20 000 con un script de un solo uso (misma función hash y misma lógica que aquí) y se
// tomó una cuya muestra de 20 intentos da, sin revisión, 19 con 1 paso, 18 con 2, 12 con 10, 9 con 14, 7 con 20 y
// 3 con 40 pasos (esperado: 19, 18, 12, 9.8, 7.2 y 2.6), y con revisión cada 5 pasos 18 de 20 (esperado 17.8) con
// 4.9 revisiones por intento (esperado 5.0). Con otra semilla cambian unos pocos intentos, no la idea.
