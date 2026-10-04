// Fiabilidad de una cadena de pasos, con y sin puntos de control. Matemática exacta + una simulación determinista.
//
// Modelo (simplificado y declarado como tal en la lección):
//  · Cada paso sale bien con probabilidad p, de forma independiente; basta un paso mal para arruinar la corrida.
//  · Un punto de control revisa el tramo de k pasos que acaba de terminar. Si hubo un error, la persona lo detecta con
//    probabilidad q y el tramo se repite; con probabilidad 1−q se le pasa y el error queda aceptado.
//  Para un tramo de m pasos: P = p^m (sale bien) y un intento termina (acepta) con prob. P + (1−P)(1−q).
//    éxito del tramo   s = P / (P + (1−P)(1−q))
//    intentos esperados  = 1 / (P + (1−P)(1−q))
//  Éxito total = producto de los s de los tramos; revisiones = suma de intentos; pasos del agente = Σ m · intentos.
//  La simulación usa números pseudoaleatorios comunes (hash del índice de corrida): al mover p o n las corridas cambian
//  de forma coherente, no al azar.
import { hash } from '../../../../../theme/kit';

export const P_DEFAULT = 0.95;
/** Semilla de las 100 corridas: elegida entre 2 000 para que la muestra por defecto (p = 0.95) quede cerca de lo esperado. Es una muestra, no un truco: con otra semilla cambian unos pocos cuadros. */
const SEED = 40;
/** Supuestos ilustrativos del costo (editables en el código; la escena los rotula como supuestos). */
export const COST = { base: 2000, perStep: 800, perMillion: 3 };

export const successPlain = (p: number, n: number) => Math.pow(p, n);
/** Número de pasos en que el éxito cruza la mitad. */
export const n50 = (p: number) => Math.log(0.5) / Math.log(p);

export interface Stats { success: number; reviews: number; steps: number }

/** k = 0: sin revisión. k ≥ n: una sola revisión al final. */
export function stats(p: number, n: number, k: number, q: number): Stats {
  if (k <= 0) return { success: Math.pow(p, n), reviews: 0, steps: n };
  const segs: number[] = [];
  for (let left = n; left > 0; left -= k) segs.push(Math.min(k, left));
  let success = 1, reviews = 0, steps = 0;
  for (const m of segs) {
    const P = Math.pow(p, m), stop = P + (1 - P) * (1 - q);
    success *= P / stop; reviews += 1 / stop; steps += m / stop;
  }
  return { success, reviews, steps };
}

export interface RunOut { ok: boolean; reviews: number; steps: number; failAt: number }

/** Corrida i: lo mismo que `stats`, pero lanzando los dados paso a paso con números comunes. */
export function simulateRun(i: number, p: number, n: number, k: number, q: number): RunOut {
  const segLen = k <= 0 ? n : k;
  let ok = true, reviews = 0, steps = 0, failAt = -1, done = 0, seg = 0;
  while (done < n) {
    const m = Math.min(segLen, n - done);
    for (let a = 0; a < 40; a++) {
      let bad = -1;
      for (let t = 0; t < m; t++) { steps++; if (bad < 0 && hash(i * 131 + SEED, (seg * 64 + a) * 97 + t) > p) bad = done + t; }
      if (k <= 0) { if (bad >= 0) { ok = false; if (failAt < 0) failAt = bad; } break; }
      reviews++;
      if (bad < 0) break;                                         // el tramo salió bien y la revisión lo confirma
      if (hash(i * 131 + SEED, (seg * 64 + a) * 97 + 90) < q) continue;   // la persona lo detecta: se repite el tramo
      ok = false; if (failAt < 0) failAt = bad; break;            // se le pasó: el error queda aceptado
    }
    done += m; seg++;
  }
  return { ok, reviews, steps, failAt };
}

export function simulate(p: number, n: number, k: number, q: number, runs = 100): RunOut[] {
  return Array.from({ length: runs }, (_, i) => simulateRun(i, p, n, k, q));
}

/** Tokens leídos en total por una corrida de n pasos si cada paso relee todo el contexto (modelo ilustrativo). */
export const tokensRead = (n: number) => n * COST.base + COST.perStep * (n * (n - 1)) / 2;
export const costAttempt = (n: number) => (tokensRead(n) / 1e6) * COST.perMillion;
/** Costo por tarea lograda = costo por intento ÷ probabilidad de éxito. */
export const costPerSuccess = (p: number, n: number) => costAttempt(n) / Math.max(1e-9, Math.pow(p, n));
