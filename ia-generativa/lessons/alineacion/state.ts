// Estado interactivo de la escena (S.st). Se actualiza en update() y en las acciones; render() solo lo lee. Todo cálculo es determinista.
import type { Frame } from '../../../../../theme/kit';
import { BEST, btLoss, dot, fitDPO, fitRM, gains, marginals, pressure, type Phi } from './toy';
import { DEFAULT_PICKS, PAIRS, deltaOf, loser, winner, type Pick } from './pairs';

export interface St {
  // turno 1: base frente a asistente
  q: number; viewed: number[]; qClock: number | undefined;
  // turno 2: elegir la mejor respuesta (modelo de recompensa de juguete)
  picks: Pick[]; w: number[]; wShown: number[];
  /** Última elección: qué probabilidad le daba el modelo de recompensa (con lo aprendido hasta entonces) a lo que la persona eligió. */
  last: { pair: number; choice: 'A' | 'B'; pChosen: number } | null; lastClock: number;
  // turno 3: presión de optimización
  sShown: number; sMax: number; overshot: boolean; bestHit: boolean; goldBest: number;
  // rechazos
  thrOwn: boolean;
}

export const newSt = (): St => ({
  q: 1, viewed: [], qClock: undefined,
  picks: [], w: [0, 0, 0, 0], wShown: [0, 0, 0, 0], last: null, lastClock: -9,
  sShown: 0, sMax: 0, overshot: false, bestHit: false, goldBest: 0,
  thrOwn: false,
});
export const st = (S: Frame): St => (S.st.a ??= newSt());

/** Índice del par que toca (o PAIRS.length si ya se eligieron todos). */
export const curPair = (s: St) => Math.min(s.picks.length, PAIRS.length);

export const deltasOf = (picks: Pick[]) => picks.map(deltaOf);

/** Probabilidad (según el RM con pesos w) de que gane A en un par. */
export const probA = (w: number[], pairIdx: number) => {
  const p = PAIRS[pairIdx], d = (p.A.phi as number[]).map((v, i) => v - p.B.phi[i]);
  return 1 / (1 + Math.exp(-dot(w, d)));
};
export const scoreOf = (w: number[], phi: Phi) => dot(w, phi);

/** Registra una elección en el turno «elige la mejor respuesta». Devuelve false si ya estaban todas. */
export function choose(S: Frame, c: 'A' | 'B'): boolean {
  const s = st(S), pair = s.picks.length;
  if (pair >= PAIRS.length) return false;
  const pA = probA(s.w, pair);
  s.last = { pair, choice: c, pChosen: c === 'A' ? pA : 1 - pA };
  s.lastClock = S.clock;
  s.picks.push({ pair, choice: c });
  s.w = fitRM(deltasOf(s.picks));
  if (s.picks.length >= PAIRS.length) S.complete('rm');
  return true;
}
export function resetPicks(S: Frame) {
  const s = st(S);
  s.picks = []; s.w = [0, 0, 0, 0]; s.wShown = [0, 0, 0, 0]; s.last = null; s.lastClock = -9;
}

// ── elecciones «efectivas»: las de la persona si las hizo; si no, unas por defecto (rotulado en la escena) ──
const memo = new Map<string, { w: number[]; delta: number[]; loss: number }>();
export function effective(s: St): { picks: Pick[]; own: boolean; w: number[]; delta: number[]; loss: number; marg: number[] } {
  const own = s.picks.length >= 1;
  const picks: Pick[] = own ? s.picks : DEFAULT_PICKS.map((choice, pair) => ({ pair, choice }));
  const key = picks.map((p) => p.pair + p.choice).join('');
  let m = memo.get(key);
  if (!m) {
    const deltas = deltasOf(picks);
    const w = fitRM(deltas);
    const delta = fitDPO(picks.map((p) => ({ w: winner(PAIRS[p.pair], p.choice).phi, l: loser(PAIRS[p.pair], p.choice).phi })), 1);
    m = { w, delta, loss: btLoss(w, deltas) };
    memo.set(key, m);
  }
  return { picks, own, w: m.w, delta: m.delta, loss: m.loss, marg: marginals(m.delta) };
}

/** Posición del control de presión en la que la calidad real es máxima. */
export const S_BEST = Math.log(1 + (BEST.p * (Math.exp(3) - 1)) / 8) / 3;
export { gains, pressure };
/** Resolución de las curvas del turno de presión (puntos por unidad de control). */
export const CURVE_STEPS = 100;
