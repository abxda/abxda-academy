// Datos de la escena: frases, semillas y cuentas que se muestran. Todo sale del modelo entrenado (nn.ts, model.ts);
// las únicas cifras fijas son las dos tasas medidas con 1 280 imágenes (verify-data.ts las recalcula).
import type { Frame } from '../../../../../theme/kit';
import { CLIP_REC, WORLD } from './model';
import { caption, generate, type Reading } from './nn';

/** Frases de la lista «elige un prompt» (forma, color, fondo). La primera es la de la demostración. */
export const PROMPTS: [number, number, number][] = [[3, 2, 4], [0, 0, 3], [2, 2, 0], [3, 1, 2]];
export const promptOf = (S: Frame, i: number) => { const p = PROMPTS[i] ?? PROMPTS[0]; return caption(p[0], p[1], p[2], S.lang); };
/** Escala de guiado con la que se generan las imágenes fuera de la sección del guiado. */
export const GEN_SCALE = 3;
/** Ruidos iniciales (semillas) de las cuatro imágenes de resultados; la primera es la de la demostración paso a paso. */
export const RESULT_SEEDS = [1, 2, 3, 4];
/** Las veinticuatro semillas de la cuadrícula del guiado (consecutivas, sin elegir). */
export const GUIDE_SEEDS = Array.from({ length: 24 }, (_, i) => 1000 + i);
export const guidePrompt = (S: Frame) => S.l('círculo', 'circle');
export const GUIDE_VALUES = Array.from({ length: 17 }, (_, i) => i * 0.5);
/** Generación sin frase (escala 0) del recuerdo de la lección 17: la primera se ve paso a paso. */
export const UNCOND_SEEDS = [10, 9, 12, 14, 7, 13];
/** Semillas de las tiras de cuatro imágenes de la sección de límites. */
export const LIMIT_SEEDS = [5, 6, 7, 8];
/** Semillas de «lo que nunca vio» (las primeras cuatro, sin elegir). */
export const NEVER_SEEDS = [1, 2, 3, 4];
export const UNSEEN_OK: [number, number, number] = [0, 3, 0];    // círculo verde sobre fondo cian (nunca visto)
export const UNSEEN_BAD: [number, number, number] = [2, 4, 1];   // triángulo violeta sobre fondo magenta (nunca visto)
export const neverPrompt = (S: Frame) => S.l('círculo y cruz', 'circle and cross');
/** Medido con verify-data.ts (escala 3, 16 ruidos por combinación): 968 de 1 120 vistas y 121 de 160 nunca vistas. */
export const SEEN_RATE = 968 / 1120, UNSEEN_RATE = 121 / 160;

export const CLIP_STEPS: number[] = CLIP_REC.steps;
export const clipSims = (S: Frame, idx: number): number[][] => CLIP_REC.sims[S.lang][idx];
export const clipLoss = (S: Frame, idx: number): number => CLIP_REC.loss[S.lang][idx];

/** Lecturas de la cuadrícula del guiado con escala s. */
export function guideReads(S: Frame, s: number): Reading[] {
  const q = guidePrompt(S);
  return GUIDE_SEEDS.map((sd) => generate(q, s, sd).read);
}
export function guideStats(S: Frame, s: number) {
  const reads = guideReads(S, s), combos = new Set<string>(), fg = [0, 0, 0, 0, 0, 0];   // fg[5] = sin figura
  let circles = 0;
  for (const r of reads) { if (r.shape === 0) circles++; combos.add(`${r.shape}-${r.fg}-${r.bg}`); fg[r.fg >= 0 ? r.fg : 5]++; }
  return { circles, combos: combos.size, fg, n: reads.length };
}

/** Distribución exacta del color de los círculos en los datos (misma regla de muestreo que train_toy.py). */
export function dataColors(shape = 0): number[] {
  const hold = WORLD.hold as number[][], typ = WORLD.typical[shape] as number, pt = WORLD.pTypical as number;
  const P = [0, 0, 0, 0, 0];
  for (let f = 0; f < 5; f++) for (let b = 0; b < 5; b++) {
    if (f === b || hold.some((h) => h[0] === shape && h[1] === f && h[2] === b)) continue;
    P[f] += (pt * (f === typ ? 1 : 0) + (1 - pt) / 5) / 5;
  }
  const s = P.reduce((a, x) => a + x, 0);
  return P.map((x) => x / s);
}

// ── estado interactivo ──
export interface St { stepSeen: Set<number>; prLast: number; prClock: number; prUser: boolean; gsLow: boolean; gsHigh: boolean }
export const freshSt = (): St => ({ stepSeen: new Set(), prLast: -1, prClock: -99, prUser: false, gsLow: false, gsHigh: false });
export const stOf = (S: Frame): St => (S.st.q ??= freshSt()) as St;

// ── precálculo progresivo (en update): las imágenes de la cuadrícula del guiado y de los resultados ──
let jobs: (() => void)[] = [], jobsLang = '', jobsAt = 0;
export function warm(S: Frame, perFrame = 3) {
  if (jobsLang !== S.lang) {
    jobsLang = S.lang; jobsAt = 0; jobs = [];
    const g = guidePrompt(S);
    for (const s of GUIDE_VALUES) for (const sd of GUIDE_SEEDS) jobs.push(() => generate(g, s, sd));
    PROMPTS.forEach((_, i) => RESULT_SEEDS.forEach((sd) => jobs.push(() => generate(promptOf(S, i), GEN_SCALE, sd))));
  }
  for (let n = 0; n < perFrame && jobsAt < jobs.length; n++) jobs[jobsAt++]();
}
