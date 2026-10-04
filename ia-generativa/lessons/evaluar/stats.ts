// Estadística de la lección «Evaluar sistemas de IA». Todo es cálculo real, determinista y sin dependencias.
//
// Cómo se generan los datos de la comparación (turno 3):
//  · Dos sistemas ficticios, A y B, con exactitud verdadera conocida: A acierta 78 % de los casos y B 74 % (supuesto editable, rotulado «ilustrativo»).
//  · Sus aciertos están correlacionados, como pasa con dos modelos reales ante las mismas preguntas: la probabilidad conjunta de cada caso es
//    ambos aciertan 0,66 · solo A acierta 0,12 · solo B acierta 0,08 · ninguno 0,14 (así A = 0,66 + 0,12 y B = 0,66 + 0,08).
//  · Una «evaluación» es una muestra de n casos tomada con rng(semilla) del kit (PRNG determinista, sin generador aleatorio del navegador).
//  · «Mismos casos»: una sola muestra de n casos que se califica con A y con B (la diferencia usa los pares).
//    «Casos distintos»: dos muestras independientes de n casos, una para cada sistema.
//  · «Repetir la evaluación» = 500 evaluaciones con semillas fijas; se cuenta cuántas veces A queda estrictamente por delante de B.
// El mismo cálculo se verifica con `npx tsx src/content/courses/ia-generativa/lessons/evaluar/check-sim.ts`.
import { rng } from '../../../../../theme/kit';

export const Z95 = 1.959964;

/** Intervalo de Wilson (1927) para una proporción k/n. */
export function wilson(k: number, n: number, z = Z95): [number, number] {
  if (n <= 0) return [0, 1];
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / den, h = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

/** Margen aproximado (mitad del ancho) del intervalo al 95 % para una nota p con n casos. */
export const margin = (p: number, n: number) => Z95 * Math.sqrt((p * (1 - p)) / n);

// ── los dos sistemas ────────────────────────────────────────────────────────
export const PA = 0.78, PB = 0.74;
export const Q11 = 0.66, Q10 = 0.12, Q01 = 0.08;          // ambos · solo A · solo B  (ninguno = 0,14)
export const TRUE_DIFF = PA - PB;                          // 0,04
export const N_STEPS = [10, 20, 30, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000];
export const REPS = 500;

export interface Sample { n: number; a: number; b: number; n10: number; n01: number; paired: boolean }

export function sample(n: number, paired: boolean, seed: number): Sample {
  const r = rng(seed);
  let a = 0, b = 0, n10 = 0, n01 = 0;
  if (paired) {
    for (let i = 0; i < n; i++) {
      const u = r();
      if (u < Q11) { a++; b++; } else if (u < Q11 + Q10) { a++; n10++; } else if (u < Q11 + Q10 + Q01) { b++; n01++; }
    }
  } else {
    for (let i = 0; i < n; i++) if (r() < PA) a++;
    for (let i = 0; i < n; i++) if (r() < PB) b++;
  }
  return { n, a, b, n10, n01, paired };
}

/** Diferencia A − B (en proporción) con su intervalo al 95 %: por pares si son los mismos casos, independiente si no. */
export function diffCI(s: Sample): { d: number; lo: number; hi: number; se: number } {
  const n = s.n, d = (s.a - s.b) / n;
  let se: number;
  if (s.paired) { const m = (s.n10 + s.n01) / n; se = Math.sqrt(Math.max(0, (m - d * d) * (n / (n - 1))) / n); }
  else { const pa = s.a / n, pb = s.b / n; se = Math.sqrt((pa * (1 - pa)) / n + (pb * (1 - pb)) / n); }
  return { d, lo: d - Z95 * se, hi: d + Z95 * se, se };
}

export interface Repeated { n: number; paired: boolean; bins: Record<number, number>; winsA: number; ties: number; winsB: number; sig: number }

const memo = new Map<string, Repeated>();
/** 500 evaluaciones repetidas con n casos. Memoizado: es una función pura de (n, paired). */
export function repeated(n: number, paired: boolean): Repeated {
  const key = `${n}|${paired}`, hit = memo.get(key);
  if (hit) return hit;
  const bins: Record<number, number> = {};
  let winsA = 0, ties = 0, winsB = 0, sig = 0;
  for (let k = 0; k < REPS; k++) {
    const s = sample(n, paired, 1000 + k * 7919 + n);
    if (s.a > s.b) winsA++; else if (s.a === s.b) ties++; else winsB++;
    const ci = diffCI(s);
    if (ci.lo > 0) sig++;
    const bin = Math.round(ci.d * 100);
    bins[bin] = (bins[bin] ?? 0) + 1;
  }
  const out = { n, paired, bins, winsA, ties, winsB, sig };
  memo.set(key, out);
  return out;
}

/** Una evaluación suelta (la que se resalta sobre el histograma). */
// La semilla base (424259) se eligió para que la primera evaluación suelta de cada tamaño sea típica: diferencia cerca de +4 y, con 100 casos, un intervalo que incluye el 0.
export const oneSample = (n: number, paired: boolean, draw: number) => sample(n, paired, 424259 + draw * 104729 + n);

/** Tabla de la lección (calculada con el mismo código): para cada tamaño, % de evaluaciones con A por delante y con intervalo que excluye 0. */
export function curveByN(paired: boolean) {
  return N_STEPS.map((n) => { const r = repeated(n, paired); return { n, winsA: (100 * r.winsA) / REPS, sig: (100 * r.sig) / REPS }; });
}

/** Menor n de la cuadrícula con A por delante en al menos 95 de cada 100 evaluaciones (o null). */
export function minNForClearWinner(paired: boolean): number | null {
  for (const n of N_STEPS) if (repeated(n, paired).winsA / REPS >= 0.95) return n;
  return null;
}
