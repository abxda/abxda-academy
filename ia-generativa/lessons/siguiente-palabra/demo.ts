// Datos de las demostraciones: todo sale del modelo de verdad (lm.ts) con semillas fijas, así que cada corrida que se ve
// es una corrida real del sorteo y se puede reproducir. Las semillas se eligieron mirando las salidas (como se elige una
// toma): la de «run» termina en una frase que no está en el texto; las tres de «sample-runs» empiezan distinto.
// verify-data.ts comprueba que las cifras que dice la voz salen de aquí.
import { rng } from '../../../../../core/scene/math';
import { generate, modelOf, probs, rowsFor, wordsOf, type Lang, type Model, type Prob, type Step } from './lm';

/** Palabras que la lección nombra, en cada idioma (el texto es paralelo palabra por palabra). */
export const WORDS = {
  es: { el: 'el', cielo: 'cielo', es: 'es', azul: 'azul', gris: 'gris', grande: 'grande', oscuro: 'oscuro', sol: 'sol', mar: 'mar', oceano: 'océano', y: 'y', de: 'de', noche: 'noche', hoy: 'hoy', brilla: 'brilla' },
  en: { el: 'the', cielo: 'sky', es: 'is', azul: 'blue', gris: 'gray', grande: 'big', oscuro: 'dark', sol: 'sun', mar: 'sea', oceano: 'ocean', y: 'and', de: 'at', noche: 'night', hoy: 'today', brilla: 'shines' },
} as const;
export type WKey = keyof typeof WORDS.es;

export const SEED_RUN = 74;            // «el cielo es azul» → «. de noche el mar es oscuro .»
export const RUN_STEPS = 8;
export const SEEDS_3 = [32, 1, 36];     // tres corridas desde «el cielo es»
export const SEED_DARTS = 2;            // diez dardos: 5 azul, 3 gris, 1 grande, 1 oscuro
export const SEED_DRAWS = 35;           // diez sorteos de la temperatura: con 1 → 5/3/1/1; con 0.5 → 7/3/0/0; con 0.1 → 10 azul; con 2 → 3/3/2/2
export const userSeed = (k: number) => 500 + k * 7;

/** Una corrida sorteada desde «el cielo es», hasta el segundo punto (o 14 vueltas). */
export function runOf(m: Model, start: string[], seed: number): string[] {
  const w = wordsOf(start, generate(m, start, 14, {}, seed));
  let dots = 0, end = w.length - 1;
  for (let i = start.length; i < w.length; i++) if (w[i] === '.') { dots++; end = i; if (dots === 2) break; }
  return w.slice(0, end + 1);
}

export interface Demo {
  m: Model; lang: Lang; W: Record<WKey, string>;
  start: string[];
  /** Probabilidades tras «es» (con temperatura 1). */
  esP: Prob[];
  /** La corrida de «run»: 8 vueltas desde «el cielo es azul». */
  run: Step[]; runWords: string[]; novel: [number, number];
  greedy: string[];
  runs3: string[][];
  darts: number[]; draws: number[];
}

const CACHE: Partial<Record<Lang, Demo>> = {};
export function demoOf(lang: Lang): Demo {
  const hit = CACHE[lang]; if (hit) return hit;
  const m = modelOf(lang), W = WORDS[lang] as Record<WKey, string>;
  const start = [W.el, W.cielo, W.es];
  const runStart = [...start, W.azul];
  const run = generate(m, runStart, RUN_STEPS, {}, SEED_RUN), runWords = wordsOf(runStart, run);
  let s = runWords.length - 2; while (s > 0 && runWords[s] !== '.') s--;
  const greedy = wordsOf(start, generate(m, start, 12, { greedy: true }));   // «el cielo es azul.» tres veces
  const r1 = rng(SEED_DARTS), r2 = rng(SEED_DRAWS);
  const d: Demo = {
    m, lang, W, start, esP: probs(rowsFor(m, W.es)!),
    run, runWords, novel: [s + 1, runWords.length - 1], greedy,
    runs3: SEEDS_3.map((sd) => runOf(m, start, sd)),
    darts: Array.from({ length: 10 }, () => r1()), draws: Array.from({ length: 10 }, () => r2()),
  };
  return (CACHE[lang] = d);
}
