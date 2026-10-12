// Estadística de la lección «Evaluar sistemas de IA». Todo es cálculo real, determinista y sin dependencias:
// las cifras que dice la voz salen de aquí (compruébalo con `npx tsx src/content/courses/ia-generativa/lessons/evaluar/verify-data.ts`).
//
// Cómo se generan los datos (simulación; la escena la rotula así):
//  · Un sistema con exactitud real del 78 %: cada «evaluación» es una muestra de n casos tomada con rng(semilla) del kit.
//    Tu evaluación (la primera) se fija en 78 de 100; las otras 99 son simuladas. Con 400 casos se repiten otras 100.
//  · Dos sistemas, A (78 % real) y B (74 % real), calificados con LOS MISMOS casos. Sus aciertos están correlacionados, como
//    pasa con dos modelos ante las mismas preguntas: en cada caso, ambos aciertan con probabilidad 0.66, solo A 0.12, solo B 0.08
//    y ninguno 0.14 (así A = 0.66 + 0.12 y B = 0.66 + 0.08). Para la comparación con casos distintos, cada sistema tiene su muestra.
//  · «Repetir la comparación» = 100 evaluaciones con semillas fijas; se cuenta en cuántas A queda estrictamente por delante.
//  · Las semillas base (25574, 9511 y 49) se eligieron con una búsqueda para que los conteos mostrados sean típicos (iguales al valor
//    esperado redondeado, calculado de forma exacta con la distribución multinomial en verify-data.ts) y la «montaña» de 100 resultados
//    se parezca a la distribución binomial esperada; no cambian ninguna regla.
import { rng } from '../../../../../theme/kit';

export const Z95 = 1.959964;
/** Margen (mitad del intervalo de confianza al 95 %, aproximación normal) para una proporción p medida con n casos. */
export const margin = (p: number, n: number) => Z95 * Math.sqrt((p * (1 - p)) / n);

// ── un sistema ───────────────────────────────────────────────────────────────────────────────────
export const P_TRUE = 0.78;
export const REPS = 100;
const ONE_BASE = 25574;
function countOk(n: number, p: number, seed: number) { const r = rng(seed); let k = 0; for (let i = 0; i < n; i++) if (r() < p) k++; return k; }
const oneMemo = new Map<number, number[]>();
/** Exactitud medida (en %) de 100 evaluaciones con n casos. Con n = 100 la primera es «tu evaluación»: 78 de 100. */
export function oneRuns(n: number): number[] {
  const hit = oneMemo.get(n); if (hit) return hit;
  let out: number[];
  if (n === 100) out = [78, ...Array.from({ length: REPS - 1 }, (_, k) => countOk(100, P_TRUE, ONE_BASE * 104729 + k * 31))];
  else out = Array.from({ length: REPS }, (_, k) => (100 * countOk(n, P_TRUE, ONE_BASE * 104729 + k * 31 + 999331)) / n);
  oneMemo.set(n, out);
  return out;
}
/** Redondeo «a la par» (78.5 → 78, 79.5 → 80): agrupa los resultados de 400 casos en columnas de 1 punto sin sesgarlos hacia arriba. */
export const roundHalfEven = (v: number) => { const f = Math.floor(v), d = v - f; return Math.abs(d - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(v); };
/** Qué casos acierta «tu evaluación» (78 de 100), en orden fijo: para dibujar la cuadrícula. */
export const YOUR_CASES: boolean[] = (() => {
  const idx = Array.from({ length: 100 }, (_, i) => i), r = rng(2718);
  for (let i = 99; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const ok = Array(100).fill(true); idx.slice(0, 22).forEach((i) => (ok[i] = false));
  return ok;
})();
/** Una cuadrícula de 100 casos para la evaluación k (k ≥ 1): qué acierta. Se usa al repetir la evaluación en pantalla. */
export function casesOf(k: number): boolean[] {
  if (k === 0) return YOUR_CASES;
  const r = rng(ONE_BASE * 104729 + (k - 1) * 31), out: boolean[] = [];
  for (let i = 0; i < 100; i++) out.push(r() < P_TRUE);
  return out;
}

// ── dos sistemas ─────────────────────────────────────────────────────────────────────────────────
export const PA = 0.78, PB = 0.74;
export const Q_BOTH = 0.66, Q_ONLY_A = 0.12, Q_ONLY_B = 0.08;
export const N_STEPS = [25, 50, 100, 200, 400, 1000, 2000];
export const N_IDX_100 = 2;
const PAIR_BASE = 9511, INDEP_BASE = 49;

export interface Run { a: number; b: number }
function pairRun(n: number, seed: number): Run {
  const r = rng(seed); let a = 0, b = 0;
  for (let i = 0; i < n; i++) { const u = r(); if (u < Q_BOTH) { a++; b++; } else if (u < Q_BOTH + Q_ONLY_A) a++; else if (u < Q_BOTH + Q_ONLY_A + Q_ONLY_B) b++; }
  return { a, b };
}
function indepRun(n: number, seed: number): Run { return { a: countOk(n, PA, seed), b: countOk(n, PB, seed + 7777) }; }

export interface Tally { n: number; runs: Run[]; winA: number; tie: number; winB: number; typical: number }
const memo = new Map<string, Tally>();
/** 100 comparaciones repetidas con n casos (mismos casos para A y B, o casos distintos). */
export function tally(n: number, same = true): Tally {
  const key = `${n}|${same}`, hit = memo.get(key); if (hit) return hit;
  const runs = Array.from({ length: REPS }, (_, k) => (same ? pairRun(n, PAIR_BASE * 1000003 + k * 7919 + n) : indepRun(n, INDEP_BASE * 1000003 + k * 7919 + n)));
  let winA = 0, tie = 0, winB = 0;
  runs.forEach((r) => { if (r.a > r.b) winA++; else if (r.a === r.b) tie++; else winB++; });
  // la evaluación «típica» que se dibuja con sus márgenes: la más cercana a lo esperado (A = 78 %, B = 74 %)
  let typical = 0, best = Infinity;
  runs.forEach((r, k) => { const dist = Math.abs(r.a - PA * n) + Math.abs(r.b - PB * n); if (dist < best - 1e-9) { best = dist; typical = k; } });
  const out = { n, runs, winA, tie, winB, typical };
  memo.set(key, out);
  return out;
}

// ── contaminación (modelo simplificado, ilustrativo) ────────────────────────────────────────────
/** A resuelve de verdad 70 de cada 100 preguntas; B, 76. Lo que A «vio» del examen lo acierta siempre (memoria). */
export const ABILITY_A = 70, ABILITY_B = 76;
/** Nota medida de A (de 100) si vio `seen` de las 100 preguntas: las vistas + el 70 % de las demás. */
export const scoreA = (seen: number) => seen + (ABILITY_A * (100 - seen)) / 100;
