// Corridas de ajuste fino REALES del modelo diminuto, con memoria: una corrida es determinista (semillas fijas), así que se calcula
// una sola vez (por clave) y la escena la reproduce como una función del tiempo. Cada 10 pasos se guarda una instantánea
// (mapa de decisión, habilidades, ΔW y, en LoRA, B y A) para animar y para saltar a cualquier punto de la lección.
import { BASE } from './base';
import { FT, REPLAY, mapOf, skills, type RuleId } from './task';
import { Tuner, deltaW, type Lora } from './tinynet';

export type Mode = 'full' | number;           // 'full' = ajuste completo; número = rango r de LoRA (sobre la capa W2)
export interface Spec { mode: Mode; replay: boolean; rule: RuleId }
export const STEPS = 300, EVERY = 10, LR = 0.01, SEED = 5;
export const specKey = (s: Spec) => `${s.rule}|${s.mode}|${s.replay ? 'R' : 'n'}`;

export interface Snap { step: number; pred: Uint8Array; newSk: number; oldSk: number; dW: number[]; A: number[] | null; B: number[] | null; r: number }

const snapOf = (step: number, t: Tuner, rule: RuleId, base: Snap | null): Snap => {
  const pred = mapOf(t.p, t.lora), sk = skills(pred, rule), l: Lora | null = t.lora;
  const dW = l ? deltaW(l) : t.p.W2.map((v, i) => v - BASE.W2[i]);
  void base;
  return { step, pred, newSk: sk.newSk, oldSk: sk.oldSk, dW, A: l ? l.A.slice() : null, B: l ? l.B.slice() : null, r: l ? l.r : 0 };
};

export class Run {
  spec: Spec; tuner: Tuner; losses: number[] = []; snaps: Snap[] = []; trainable: number; n: number;
  constructor(spec: Spec) {
    this.spec = spec;
    const data = [...FT[spec.rule], ...(spec.replay ? REPLAY[spec.rule] : [])];
    this.n = data.length;
    this.tuner = new Tuner(BASE, data, spec.mode === 'full' ? { full: true } : { r: spec.mode, seed: SEED, alpha: spec.mode }, LR);
    this.trainable = this.tuner.trainable;
    this.snaps.push(snapOf(0, this.tuner, spec.rule, null));
  }
  get done() { return this.tuner.step >= STEPS; }
  /** Calcula, si hace falta, hasta el paso `step` (máx. `budget` pasos por llamada; devuelve true si ya llegó). */
  ensure(step: number, budget = STEPS): boolean {
    const goal = Math.min(STEPS, Math.max(0, Math.floor(step)));
    let n = 0;
    while (this.tuner.step < goal && n < budget) {
      this.losses.push(this.tuner.advance()); n++;
      if (this.tuner.step % EVERY === 0 || this.tuner.step === STEPS) this.snaps.push(snapOf(this.tuner.step, this.tuner, this.spec.rule, null));
    }
    return this.tuner.step >= goal;
  }
  /** Instantánea más reciente que no pase del paso `step`. */
  at(step: number): Snap {
    const s = Math.min(STEPS, Math.max(0, Math.floor(step)));
    this.ensure(s);
    let k = Math.floor(s / EVERY);
    if (s === STEPS) k = this.snaps.length - 1;
    return this.snaps[Math.min(k, this.snaps.length - 1)];
  }
  /** Pérdida (entropía cruzada) en el paso `step`; −1 si aún no se conoce. */
  loss(step: number): number { this.ensure(step + 1); return this.losses[Math.min(this.losses.length - 1, Math.max(0, Math.floor(step)))] ?? -1; }
}

const CACHE = new Map<string, Run>();
export function getRun(spec: Spec): Run {
  const k = specKey(spec);
  let r = CACHE.get(k);
  if (!r) { r = new Run(spec); CACHE.set(k, r); }
  return r;
}
