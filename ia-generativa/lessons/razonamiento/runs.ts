// Lo medido, listo para la escena. Todo sale de data.ts (generado por tools/build_data.py a partir de
// tools/run_experiment.py: Qwen3.5-4B, 32 intentos del problema del tren por idioma, presupuesto forzado como en s1).
// Aquí solo se cuenta: aciertos por presupuesto, tokens de pensamiento usados, votos por respuesta. Nada se inventa.
// La pregunta en español se muestra en la lección en español y la de inglés en la de inglés: sus cifras difieren
// (14 y 10 aciertos sin pensar, por ejemplo); la narración solo dice lo que vale en los dos idiomas.
import { BUDGETS, PROBS, type Prob } from './data';

export type L2 = 'es' | 'en';
export const ANSWER = 120;
export const N_TRIES = 32;
/** Índice del presupuesto más grande (4 096 tokens). */
export const B_MAX = BUDGETS.length - 1;
export { BUDGETS };

const TREN: Record<L2, Prob> = { es: PROBS.find((p) => p.id === 'tren-es')!, en: PROBS.find((p) => p.id === 'tren-en')! };

/** Las 32 respuestas con el presupuesto de índice `bi`. */
export const answers = (l: L2, bi: number): (number | null)[] => TREN[l].A.map((a) => a[bi]);
/** Aciertos (de 32) con el presupuesto de índice `bi`. */
export const hits = (l: L2, bi: number) => answers(l, bi).filter((a) => a === ANSWER).length;
/** Largo natural (tokens) del pensamiento de cada intento. */
export const lengths = (l: L2) => TREN[l].L.map((x) => (x < 0 ? 4096 : x));
/** Tokens de pensamiento usados en promedio con el presupuesto `B` (si termina antes, se detiene solo). */
export const usedMean = (l: L2, B: number) => lengths(l).reduce((s, x) => s + Math.min(x, B), 0) / N_TRIES;
/** Largo medio del pensamiento completo. */
export const meanLen = (l: L2) => usedMean(l, 1e9);
/** Suma de los tokens de pensamiento de los 32 intentos completos (para el costo de votar). */
export const sumLen = (l: L2) => lengths(l).reduce((s, x) => s + x, 0);

/** Votos por respuesta, de más a menos (en un empate, la menor primero). */
export function tally(l: L2, bi: number): { v: number; n: number }[] {
  const m = new Map<number, number>();
  for (const a of answers(l, bi)) if (a !== null) m.set(a, (m.get(a) ?? 0) + 1);
  return [...m.entries()].map(([v, n]) => ({ v, n })).sort((a, b) => b.n - a.n || a.v - b.v);
}

/** Tokens del ejemplo, contados con el tokenizador de Qwen3.5 (cada cifra es un token): la respuesta sola y los cuatro pasos. */
export const TOK_ANSWER = 3;
export const TOK_STEPS = 51;
/** Velocidad supuesta para estimar la espera (rotulada como supuesto en la escena). */
export const TOK_PER_S = 100;

/** Cifras de las fuentes (ver sources en content.ts y el registro de verificación). */
export const PAPERS = {
  // Wei et al. 2022, tabla 2 (GSM8K): directo frente a cadena de pensamiento
  palm540: [17.9, 56.9], palm8: [4.9, 4.1],
  // Wang et al. 2023: cadena sola (su medición) y autoconsistencia con 40 cadenas
  scSingle: 56.5, scVote: 74.4,
  // DeepSeek-AI 2025 (v2): R1-Zero en AIME 2024, al empezar y al terminar el refuerzo
  r1Start: 15.6, r1End: 77.9,
  // Chen et al. 2025: cuántas veces el pensamiento menciona la pista que el modelo usó
  faithClaude: 25, faithR1: 39,
} as const;
