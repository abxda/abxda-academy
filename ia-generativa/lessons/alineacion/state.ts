// Estado interactivo de la escena (S.st). Se actualiza en update() y en las acciones; render() solo lo lee. Todo cálculo es determinista.
import { clamp, type Frame } from '../../../../../theme/kit';
import { btLoss, dot, fitDPO, fitRM, gains, marginals, pressure, BEST, type Phi } from './toy';
import { DEFAULT_PICKS, PAIRS, deltaOf, loser, winner, type Pick } from './pairs';
import { fr } from './ui';

export interface St {
  // base frente a asistente
  q: number; qClock: number; qOwn: boolean;
  // el juez de juguete: elecciones de la persona
  own: boolean; picks: Pick[]; w: number[]; wShown: number[]; lastClock: number;
  // presión de optimización
  sShown: number; sMin: number; sMax: number; ext: number;
  lastT: number;
}
export const newSt = (): St => ({
  q: 1, qClock: -99, qOwn: false,
  own: false, picks: [], w: [0, 0, 0, 0], wShown: [0, 0, 0, 0], lastClock: -99,
  sShown: 0, sMin: Infinity, sMax: -Infinity, ext: 0, lastT: -1,
});
export const st = (S: Frame): St => (S.st.a ??= newSt());

// ── base frente a asistente ─────────────────────────────────────────────────────────────────────────
/** Indicación que muestra la demostración en cada momento (0 capital · 1 inflación · 2 correo · 3 dormir). */
export function demoQ(S: Frame): number {
  if (!S.on('compare-demo')) return 1;
  if (!S.on('try-compare')) { const f = fr(S, 'compare-demo', 0, 1, 'lin'); return f < 0.3 ? 2 : f < 0.6 ? 3 : 0; }
  return 0;
}
/** Ventana de la demostración en la que se escribe la indicación actual: [inicio, fin] como fracciones de compare-demo. */
export const DEMO_WIN: Record<number, [number, number]> = { 2: [0.02, 0.24], 3: [0.32, 0.54], 0: [0.62, 0.8] };

// ── el juez de juguete ──────────────────────────────────────────────────────────────────────────────
/** Fracciones de rm-demo en las que la demostración elige en cada pareja. */
export const PICK_AT = [0.18, 0.33, 0.48, 0.63, 0.78];
/** Cuántas elecciones lleva la demostración (0..5) y el avance de la siguiente (0..1). */
export function demoProgress(S: Frame): { k: number; f: number } {
  if (!S.on('rm-demo')) return { k: 0, f: 0 };
  if (S.on('try-rm')) return { k: 5, f: 0 };
  let k = 0;
  PICK_AT.forEach((a) => { if (fr(S, 'rm-demo', a, a + 0.001, 'lin') >= 1) k++; });
  const next = PICK_AT[Math.min(k, 4)], f = k < 5 ? fr(S, 'rm-demo', next - 0.1, next, 'lin') : 0;
  return { k, f };
}
const DEMO_PICKS: Pick[] = DEFAULT_PICKS.map((choice, pair) => ({ pair, choice }));
export const deltasOf = (picks: Pick[]) => picks.map(deltaOf);
const wMemo = new Map<string, number[]>();
/** Pesos del juez tras las primeras k elecciones de una lista. */
export function weightsAfter(picks: Pick[], k: number): number[] {
  const key = picks.slice(0, k).map((p) => p.pair + p.choice).join('');
  let w = wMemo.get(key);
  if (!w) { w = k ? fitRM(deltasOf(picks.slice(0, k))) : [0, 0, 0, 0]; wMemo.set(key, w); }
  return w;
}
export const demoWeights = (k: number) => weightsAfter(DEMO_PICKS, k);

/** Probabilidad (según el juez con pesos w) de que gane A en una pareja. */
export const probA = (w: number[], pairIdx: number) => {
  const p = PAIRS[pairIdx], d = (p.A.phi as number[]).map((v, i) => v - p.B.phi[i]);
  return 1 / (1 + Math.exp(-dot(w, d)));
};
export const scoreOf = (w: number[], phi: Phi) => dot(w, phi);

/** Registra una elección de la persona. La primera reemplaza las del ejemplo; tras la quinta, otra elección empieza una ronda nueva. */
export function choose(S: Frame, c: 'A' | 'B') {
  const s = st(S);
  if (!s.own || s.picks.length >= PAIRS.length) { s.own = true; s.picks = []; }
  s.picks.push({ pair: s.picks.length, choice: c });
  s.w = weightsAfter(s.picks, s.picks.length);
  s.lastClock = S.clock;
  if (s.picks.length >= PAIRS.length) S.complete('rm');
}

// ── elecciones «efectivas»: las de la persona si eligió; si no, las del ejemplo (rotulado en la escena) ──
const memo = new Map<string, { w: number[]; delta: number[]; loss: number }>();
export function effective(s: St): { picks: Pick[]; own: boolean; w: number[]; delta: number[]; loss: number; marg: number[] } {
  const own = s.own && s.picks.length >= 1;
  const picks: Pick[] = own ? s.picks : DEMO_PICKS;
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

// ── presión de optimización ─────────────────────────────────────────────────────────────────────────
/** Posición del control (0..1) que corresponde a una presión p (inversa de pressure()). */
export const sOf = (p: number) => Math.log(1 + (p * (Math.exp(3) - 1)) / 8) / 3;
/** Posición del control en la que la calidad real es máxima. */
export const S_BEST = sOf(BEST.p);
export const S_ONE = sOf(1);
/** Valor que la demostración da al control en cada momento (mientras la persona no lo toque). */
export function demoPress(S: Frame): number {
  if (!S.on('rl-push')) return 0;
  if (S.is('rl-push')) return S_ONE * fr(S, 'rl-push', 0.25, 0.7, 'io');
  // la correa: aflojarla deja que el juez empuje más (presión 3) y se vuelve a la presión 1
  if (S.is('rl-leash')) return S_ONE + (sOf(3) - S_ONE) * (fr(S, 'rl-leash', 0.5, 0.66, 'io') - fr(S, 'rl-leash', 0.8, 0.94, 'io'));
  if (!S.on('opt-demo')) return S_ONE;
  if (S.is('opt-demo')) return fr(S, 'opt-demo', 0, 0.1, 'lin') < 1 ? S_ONE * (1 - fr(S, 'opt-demo', 0, 0.1, 'io')) : fr(S, 'opt-demo', 0.14, 0.9, 'lin');
  return 1;
}
export { gains, pressure, clamp };
