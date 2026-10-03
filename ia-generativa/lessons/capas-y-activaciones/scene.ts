// Escena: Capas y activaciones. Una red 2-2-1 con números (pase hacia delante y colapso lineal), la ReLU que rompe el colapso,
// el doblez del espacio, la aproximación universal con esquinas ReLU, la profundidad (la sierra de Telgarsky) y el patio de
// juegos: una MLP real que se entrena en el navegador. Tres turnos: aproximar una curva, separar círculos, separar la espiral.
import { box, clamp, drawNet, inset, link, neu, regions, tone, type Frame, type Rect, type SceneFactory } from '../../../../../theme/kit';
import { drawActs, drawFold } from './acts';
import { APPROX_GOAL, N_MAX, approxErrOf, drawApprox, drawDepth } from './approx';
import { drawNumeric } from './numeric';
import { drawPlane } from './plane';
import { drawPlayground, pgAction, pgUpdate } from './playground';
import { fs, ph, stageA } from './shared';

const L = (es: string, en: string) => ({ es, en });
const ACT_OPTS = [
  { value: 'linear', label: L('Lineal', 'Linear') }, { value: 'relu', label: L('ReLU', 'ReLU') },
  { value: 'tanh', label: L('tanh', 'tanh') }, { value: 'sigmoid', label: L('Sigmoide', 'Sigmoid') },
];
const int = (v: number) => String(Math.round(v));

/** Los cinco controles de un turno del patio de juegos. */
function pgControls(pf: 'b-' | 'c-', from: string, to: string, def: { layers: number; width: number; act: string }) {
  return [
    { id: `${pf}layers`, kind: 'slider' as const, label: L('Capas ocultas', 'Hidden layers'), min: 0, max: 4, step: 1, value: def.layers, from, to, fmt: int },
    { id: `${pf}width`, kind: 'slider' as const, label: L('Neuronas por capa', 'Neurons per layer'), min: 1, max: 8, step: 1, value: def.width, from, to, fmt: int },
    { id: `${pf}act`, kind: 'choice' as const, label: L('Activación', 'Activation'), value: def.act, options: ACT_OPTS, from, to },
    { id: `${pf}train`, kind: 'toggle' as const, label: L('Entrenar', 'Train'), value: true, from, to },
    { id: `${pf}reset`, kind: 'button' as const, label: L('Reiniciar', 'Reset'), from, to },
  ];
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'n', kind: 'slider', label: L('Neuronas ReLU', 'ReLU neurons'), min: 1, max: N_MAX, step: 1, value: 3, from: 'try1', to: 'depth', fmt: int },
    ...pgControls('b-', 'try2', 'shapes', { layers: 1, width: 2, act: 'linear' }),
    ...pgControls('c-', 'try3', 'recap', { layers: 1, width: 8, act: 'tanh' }),
  ],

  init(S) { S.st = {}; },
  action(S, id) { pgAction(S, id); },

  update(S) {
    if (S.between('try1', 'depth') && approxErrOf(Math.round(S.p.n ?? 3)) < APPROX_GOAL) S.complete('approx');
    const won = pgUpdate(S);
    if (won.B) S.complete('circles');
    if (won.C) S.complete('spiral');
  },

  render(S) {
    const all = regions(S).all;
    const stage = (from: string, to: string | undefined, draw: () => void) => { const a = stageA(S, from, to); if (a > 0.004) S.d.withAlpha(a, draw); };
    stage('hook', 'plane', () => drawNumeric(S, all, 'sum'));
    stage('plane', 'activations', () => drawPlane(S, all));
    stage('activations', 'break', () => drawActs(S, all));
    stage('break', 'fold-problem', () => drawNumeric(S, all, 'relu'));
    stage('fold-problem', 'approx-start', () => drawFold(S, all));
    stage('approx-start', 'depth', () => drawApprox(S, all));
    stage('depth', 'pg-intro', () => drawDepth(S, all));
    stage('pg-intro', 'recap', () => drawPlayground(S, all));
    stage('recap', 'bridge', () => drawRecap(S, all));
    stage('bridge', undefined, () => drawBridge(S, all));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawRecap(S: Frame, all: Rect) {
  const u = S.u, gap = (S.portrait ? 30 : 44) * u;
  const items: { t: string; sub: string; tn: 'err' | 'sig' | 'w' }[] = [
    { t: S.l('Capas lineales', 'Linear layers'), sub: S.l('= una sola capa', '= a single layer'), tn: 'err' },
    { t: S.l('+ activación', '+ activation'), sub: S.l('cada capa dobla el espacio', 'each layer folds space'), tn: 'sig' },
    { t: S.l('+ neuronas y capas', '+ neurons and layers'), sub: S.l('más formas, más costo', 'more shapes, more cost'), tn: 'w' },
  ];
  const bw = S.portrait ? Math.min(all.w * 0.86, 300 * u) : Math.min((all.w - 2 * gap) / 3, 260 * u), bh = 76 * u;
  const total = S.portrait ? 3 * bh + 2 * gap : 3 * bw + 2 * gap;
  const rs: Rect[] = items.map((_, i) => S.portrait
    ? { x: all.x + (all.w - bw) / 2, y: all.y + (all.h - total) / 2 - 10 * u + i * (bh + gap), w: bw, h: bh }
    : { x: all.x + (all.w - total) / 2 + i * (bw + gap), y: all.y + all.h * 0.34, w: bw, h: bh });
  items.forEach((it, i) => { const a = S.reveal('recap', 0.2 + i * 0.7, 0.5); if (a > 0) box(S, rs[i], it.t, { tone: it.tn, sub: it.sub, a, active: Math.floor(S.clock / 1.3) % 3 === i ? 1 : 0, size: 16 }); });
  for (let i = 0; i < 2; i++) { const a = S.at('recap', 0.55 + i * 0.7, 1.0 + i * 0.7); if (a > 0) link(S, rs[i], rs[i + 1], { tone: 'ink', progress: a }); }
  if (!S.portrait) neu(S, all.x + all.w / 2 - 36 * u, all.y + all.h * 0.34 + bh + 50 * u, { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 2.0, 0.5) });
}

function drawBridge(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const net: Rect = { x: all.x + 10 * u, y: all.y + all.h * 0.1, w: all.w - 20 * u, h: all.h * (S.portrait ? 0.4 : 0.46) };
  const a = S.reveal('bridge', 0, 0.6);
  d.withAlpha(a, () => {
    const blame = (S.clock * 0.55) % 3.8;
    drawNet(S, net, { layers: [2, 5, 5, 1], nodeR: S.portrait ? 10 : 13, blame: Math.min(blame, 3), nodeTone: 'sig', acts: [[0.8, 0.5], [0.6, 0.3, 0.9, 0.4, 0.7], [0.5, 0.8, 0.2, 0.6, 0.4], [0.7]] });
  });
  const cx = all.x + all.w / 2, cy = all.y + all.h * (S.portrait ? 0.62 : 0.68);
  d.withAlpha(S.reveal('bridge', 0.5, 0.6), () => {
    d.text(S.l('¿Cómo se reparte la culpa entre tantos pesos?', 'How is the blame shared among so many weights?'), cx, cy, { size: fs(S, 17), weight: 700, color: tone(S, 'err').ink, align: 'center', base: 'middle', w: all.w * 0.9 });
  });
  neu(S, cx - 36 * u, cy + 24 * u, { scale: Math.max(3, Math.round(3.2 * u)), mood: 'think', a: S.reveal('bridge', 1.0, 0.6) });
  d.withAlpha(S.reveal('bridge', 1.4, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 100 * u, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Retropropagación', 'Backpropagation'), cx, cy + 128 * u, { size: fs(S, 24), weight: 800, align: 'center' });
  });
  void inset; void clamp; void ph;
}

export default scene;
