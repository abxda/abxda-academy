// Escena: Alucinaciones y límites. Nueve actos que se funden uno en otro, con mediciones reales de Pythia (real-data.ts):
//  1 · el caso (hook, ask, define)            2 · lo que ve el modelo (recall … noidk)   3 · por qué ocurre (objective … snowball)
//  4 · tres familias de error (types … reason)  5 · turno 1: ¿verdadero o inventado? (try1, game-after)
//  6 · calibración (calib, signal, hidden, scale)  7 · responder o callar, turno 2 (abstain … after-b)
//  8 · cuatro mitigaciones (mit-*)             9 · evidencia, responsabilidad, TruthfulQA, resumen y puente
// Dos turnos: clasificar seis afirmaciones (con tu seguridad) y encontrar el mejor umbral con dos costos de error distintos.
import { regions, type Frame, type Rect, type SceneFactory } from '../../../../../theme/kit';
import { drawCase } from './case';
import { drawHidden, drawCalib, drawScale } from './calib';
import { CLAIMS, answer, drawGame, gameOf } from './game';
import { drawMitig } from './mitig';
import { drawProbs } from './probs';
import { drawAccount, drawBridge, drawEvidence, drawRecap, drawTruthful } from './proof';
import { KS, drawThresh, updateThr } from './thresh';
import { drawTypes } from './types';
import { fadeFor, show } from './ui';
import { drawObjective, drawRare, drawSnow } from './why';

type R = { main: Rect; aside: Rect; all: Rect };
interface Act { from: string; to?: string; draw: (S: Frame, R: R) => void }

const GAME_BUTTONS = ['v-sure', 'v-maybe', 'f-maybe', 'f-sure'];

const ACTS: Act[] = [
  { from: 'hook', to: 'recall', draw: drawCase },
  { from: 'recall', to: 'objective', draw: drawProbs },
  { from: 'objective', to: 'rare', draw: (S, R) => drawObjective(S, R, 1) },
  { from: 'rare', to: 'snowball', draw: (S, R) => drawRare(S, R, 1) },
  { from: 'snowball', to: 'types', draw: (S, R) => drawSnow(S, R, 1) },
  { from: 'types', to: 'try1', draw: drawTypes },
  { from: 'try1', to: 'calib', draw: (S, R) => drawGame(S, R.main, R.aside, 1) },
  { from: 'calib', to: 'hidden', draw: drawCalib },
  { from: 'hidden', to: 'scale', draw: drawHidden },
  { from: 'scale', to: 'abstain', draw: drawScale },
  { from: 'abstain', to: 'mit-ground', draw: drawThresh },
  { from: 'mit-ground', to: 'evidence', draw: drawMitig },
  { from: 'evidence', to: 'accountability', draw: drawEvidence },
  { from: 'accountability', to: 'truthfulqa', draw: drawAccount },
  { from: 'truthfulqa', to: 'recap', draw: drawTruthful },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: seis afirmaciones, verdadera o inventada, y qué tan seguro estás ──
    { id: 'v-sure', kind: 'button', label: { es: 'Verdadera, estoy seguro', en: 'True, I am sure' }, from: 'try1', to: 'game-after' },
    { id: 'v-maybe', kind: 'button', label: { es: 'Verdadera, con dudas', en: 'True, but unsure' }, from: 'try1', to: 'game-after' },
    { id: 'f-maybe', kind: 'button', label: { es: 'Inventada, con dudas', en: 'Invented, but unsure' }, from: 'try1', to: 'game-after' },
    { id: 'f-sure', kind: 'button', label: { es: 'Inventada, estoy seguro', en: 'Invented, I am sure' }, from: 'try1', to: 'game-after' },
    // ── turno 2: el mejor umbral para dos costos de error distintos ──
    { id: 'kc', kind: 'choice', label: { es: 'Costo de un error (k)', en: 'Cost of an error (k)' }, options: KS.map((k) => ({ value: k, label: { es: `k = ${k}`, en: `k = ${k}` } })), value: 1, from: 'try2', to: 'mit-ground' },
    { id: 'thr', kind: 'slider', label: { es: 'Umbral de confianza', en: 'Confidence threshold' }, min: 0, max: 1, step: 0.02, value: 0.5, fmt: (v, l) => `${Math.round(v * 100)}${l === 'es' ? ' %' : '%'}`, from: 'try2', to: 'mit-ground' },
  ],
  init(S) { S.st = {}; },
  action(S, id) {
    if (GAME_BUTTONS.includes(id)) answer(S, id);
  },
  update(S) {
    const g = gameOf(S);
    if (S.on('game-after') && !g.done) g.done = true;      // quien continúa sin responder: se muestra la solución con lo que alcanzó a contestar
    if (g.done && g.answers.length === CLAIMS.length) S.complete('game');
    if (updateThr(S)) S.complete('thr');
  },
  render(S) {
    const R = regions(S);
    for (const a of ACTS) show(S, fadeFor(S, a.from, a.to), () => a.draw(S, R));
  },
});

export default scene;
