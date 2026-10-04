// Estado interactivo de la escena (S.st). Se actualiza en update(); render() solo lo lee. Todo cálculo es determinista.
import type { Frame } from '../../../../../theme/kit';
import { BEST, btLoss, dot, fitDPO, fitRM, gains, marginals, pressure, type Phi } from './toy';
import { DEFAULT_PICKS, PAIRS, deltaOf, loser, winner, type Pick } from './pairs';

export interface St {
  // turno 1: base frente a asistente
  q: number; viewed: number[]; qClock: number | undefined;
  // turno 2: elegir la mejor respuesta
  picks: Pick[]; phase: 'ask' | 'result'; resultClock: number; predBefore: number; w: number[]; wShown: number[]; lossShown: number; hitFlash: number;
  // turno 3: presión de optimización
  sShown: number; sMax: number; overshot: boolean; bestHit: boolean;
}

export const newSt = (): St => ({
  q: 1, viewed: [], qClock: undefined,
  picks: [], phase: 'ask', resultClock: -9, predBefore: 0.5, w: [0, 0, 0, 0], wShown: [0, 0, 0, 0], lossShown: Math.LN2, hitFlash: 0,
  sShown: 0, sMax: 0, overshot: false, bestHit: false,
});
export const st = (S: Frame): St => (S.st.a ??= newSt());

/** Índice del par que toca (o PAIRS.length si ya se eligieron todos). */
export const curPair = (s: St) => Math.min(s.picks.length, PAIRS.length);

export const deltasOf = (picks: Pick[]) => picks.map(deltaOf);
export const rmOf = (picks: Pick[]) => fitRM(deltasOf(picks));

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

/** Probabilidad (según el RM con pesos w) de que gane A en un par. */
export const probA = (w: number[], pairIdx: number) => {
  const p = PAIRS[pairIdx], d = (p.A.phi as number[]).map((v, i) => v - p.B.phi[i]);
  return 1 / (1 + Math.exp(-dot(w, d)));
};
export const scoreOf = (w: number[], phi: Phi) => dot(w, phi);

/** Posición del control de presión en la que la calidad real es máxima. */
export const S_BEST = Math.log(1 + (BEST.p * (Math.exp(3) - 1)) / 8) / 3;
export { gains, pressure };
