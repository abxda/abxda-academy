// El «mundo» del modelo diminuto: un plano [-1,1]² con tres clases.
//   · Regla original (la que aprendió el modelo base, preentrenado fuera de línea con build-base.ts).
//   · Regla A y regla B: «tu empresa» define distinto dos fronteras. Cada una trae pocos ejemplos, de una franja ESTRECHA del plano.
// La evaluación usa una rejilla uniforme de G×G puntos (la misma que se dibuja como mapa), así lo que se ve y lo que se mide coinciden:
//   · habilidad nueva    = acierto, según la regla nueva, en las celdas donde la regla CAMBIÓ.
//   · habilidad original = acierto, según la regla original, en las celdas donde NO cambió.
import { rng } from '../../../../../theme/kit';
import { predict, type Params, type Lora, type Pt } from './tinynet';

export type RuleId = 'A' | 'B';
export const G = 40;

export const ruleBase = (x: number, y: number): number => (y > 0.3 ? 0 : x < 0 ? 1 : 2);
/** A: a la derecha, la frontera superior baja (de y=0,3 a y=-0,2) y la clase 1 se extiende hasta x=0,55 por abajo. Dos cambios independientes. */
export const ruleA = (x: number, y: number): number => (x < 0 ? ruleBase(x, y) : y > -0.2 ? 0 : x < 0.55 ? 1 : 2);
/** B: a la izquierda, la frontera superior sube (a y=0,65) y la clase 2 se extiende hasta x=-0,45. */
export const ruleB = (x: number, y: number): number => (x > 0 ? ruleBase(x, y) : y > 0.65 ? 0 : x < -0.45 ? 1 : 2);
export const RULES: Record<RuleId, (x: number, y: number) => number> = { A: ruleA, B: ruleB };

export const cellX = (i: number) => -1 + ((i + 0.5) * 2) / G;
export const cellY = (j: number) => 1 - ((j + 0.5) * 2) / G;

const grid = (f: (x: number, y: number) => number): Uint8Array => { const a = new Uint8Array(G * G); for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) a[j * G + i] = f(cellX(i), cellY(j)); return a; };
export const TARGET_BASE = grid(ruleBase);
export const TARGET: Record<RuleId, Uint8Array> = { A: grid(ruleA), B: grid(ruleB) };
/** Celdas donde la regla nueva difiere de la original. */
export const CHANGED: Record<RuleId, Uint8Array> = { A: TARGET.A.map((v, k) => (v !== TARGET_BASE[k] ? 1 : 0)), B: TARGET.B.map((v, k) => (v !== TARGET_BASE[k] ? 1 : 0)) };

/** Puntos uniformes en una caja, con la regla dada (determinista). */
function uni(n: number, seed: number, rule: (x: number, y: number) => number, box: [number, number, number, number] = [-1, 1, -1, 1], skip?: (x: number, y: number) => boolean): Pt[] {
  const r = rng(seed), out: Pt[] = [];
  while (out.length < n) {
    const x = box[0] + (box[1] - box[0]) * r(), y = box[2] + (box[3] - box[2]) * r();
    if (skip?.(x, y)) continue;
    out.push({ x, y, c: rule(x, y) });
  }
  return out;
}
const changedAt = (id: RuleId) => (x: number, y: number) => RULES[id](x, y) !== ruleBase(x, y);

/** Datos con los que se preentrena el modelo base: todo el plano, regla original. */
export const baseData = (): Pt[] => uni(900, 11, ruleBase);
/** Ejemplos nuevos de «tu empresa»: pocos y de una franja estrecha. */
export const FT: Record<RuleId, Pt[]> = {
  A: uni(70, 34, ruleA, [0.05, 1, -0.5, 0.35]),
  B: uni(70, 35, ruleB, [-1, -0.05, -0.35, 0.9]),
};
/** Ejemplos originales «de repaso»: todo el plano, regla original, solo donde no chocan con la regla nueva. */
export const REPLAY: Record<RuleId, Pt[]> = {
  A: uni(30, 32, ruleBase, [-1, 1, -1, 1], changedAt('A')),
  B: uni(30, 36, ruleBase, [-1, 1, -1, 1], changedAt('B')),
};

/** Mapa de clases predichas en la rejilla G×G. */
export function mapOf(p: Params, lora: Lora | null): Uint8Array {
  const a = new Uint8Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) a[j * G + i] = predict(p, lora, cellX(i), cellY(j));
  return a;
}

/** Habilidades sobre un mapa de predicciones (fracciones 0..1). */
export function skills(map: Uint8Array, id: RuleId): { newSk: number; oldSk: number } {
  let nn = 0, nok = 0, on = 0, ook = 0;
  const ch = CHANGED[id], tg = TARGET[id];
  for (let k = 0; k < G * G; k++) {
    if (ch[k]) { nn++; if (map[k] === tg[k]) nok++; }
    else { on++; if (map[k] === TARGET_BASE[k]) ook++; }
  }
  return { newSk: nn ? nok / nn : 0, oldSk: on ? ook / on : 0 };
}

// ── aritmética de parámetros (la parte de LoRA que no necesita entrenar nada) ──
/** Números de una matriz d×k completa y de su corrección de rango r (B: d×r, A: r×k). */
export const fullCount = (d: number, k: number) => d * k;
export const loraCount = (d: number, k: number, r: number) => r * (d + k);
