// Estado interactivo de la escena (S.st). update() y las acciones lo cambian; render() solo lo lee.
//  · calentamiento de las corridas que necesitan las partes narradas;
//  · turno «entrena tu adaptador» (gate `train`): un ensayo = una corrida REAL del modelo diminuto, animada a RATE pasos por segundo;
//  · turno «¿prompt, RAG o ajuste fino?» (gate `decide`): un caso a la vez; se completa al acertar los cuatro.
import type { Frame } from '../../../../../theme/kit';
import { CASES } from './cases';
import { getRun, STEPS, type Spec } from './runs';

export const RATE = 100;                   // pasos de entrenamiento por segundo en las animaciones
export const GOAL_NEW = 0.85, GOAL_OLD = 0.96;

export interface Trial { spec: Spec; age: number; step: number; done: boolean; ok: boolean; newSk: number; oldSk: number }
export interface Dec { idx: number; picks: number[]; wrong: { idx: number; opt: number } | null; wrongCount: number; lastOk: number }
export interface St { warm: number; tr: Trial | null; tries: number; dec: Dec }

export const newSt = (): St => ({ warm: 0, tr: null, tries: 0, dec: { idx: 0, picks: [], wrong: null, wrongCount: 0, lastOk: -1 } });
export const st = (S: Frame): St => (S.st.a ??= newSt());

/** Rango y repaso elegidos en los controles. */
export const trialSpec = (S: Frame): Spec => ({ mode: Math.max(1, Math.min(32, Math.round(Number(S.p.tr ?? 2)))), replay: !!S.p.rp, rule: 'A' });

/** Empieza un ensayo con lo elegido en los controles. */
export function startTrial(S: Frame) {
  const s = st(S);
  s.tr = { spec: trialSpec(S), age: 0, step: 0, done: false, ok: false, newSk: 0, oldSk: 1 };
  s.tries++;
}

/** Hace avanzar el ensayo: calcula la corrida de a pocos pasos por fotograma y completa el gate si se cumplen las dos metas. */
export function stepTrial(S: Frame) {
  const s = st(S), tr = s.tr;
  if (!tr || tr.done) return;
  tr.age += Math.min(S.dt, 0.1);
  const run = getRun(tr.spec);
  const goal = S.reduced ? STEPS : Math.min(STEPS, Math.floor(tr.age * RATE));
  run.ensure(goal, 24);
  tr.step = Math.min(goal, run.tuner.step);
  if (tr.step >= STEPS) {
    const sn = run.at(STEPS);
    tr.done = true; tr.newSk = sn.newSk; tr.oldSk = sn.oldSk;
    tr.ok = sn.newSk >= GOAL_NEW && sn.oldSk >= GOAL_OLD;
    if (tr.ok) S.complete('train');
  }
}

/** Elige una opción (0 prompt, 1 RAG, 2 ajuste fino) para el caso actual. */
export function pick(S: Frame, opt: number): boolean {
  const d = st(S).dec;
  if (d.idx >= CASES.length) return false;
  if (opt === CASES[d.idx].answer) {
    d.picks[d.idx] = opt; d.wrong = null; d.lastOk = d.idx; d.idx++;
    if (d.idx >= CASES.length) S.complete('decide');
  } else { d.wrong = { idx: d.idx, opt }; d.wrongCount++; }
  return true;
}
