// Escena: Retropropagación. Una red 2-2-1 con todos sus valores a la vista: pase hacia delante, pérdida,
// la culpa (gradiente) fluyendo hacia atrás con la regla de la cadena, y la actualización de los pesos.
// Todo número que se ve sale de math.ts (cálculo real, sin valores inventados). Dos turnos: mover un peso
// a mano y ver cambiar las seis culpas; y dar pasos de entrenamiento y ver bajar la pérdida.
import {
  alpha, badge, clamp, drawNet, ease, inset, layoutNet, lerp, link, neu, split, tone, Plot,
  type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { EDGE, TARGET, W0, W_MAX, X, backward, clampW, forward, numGrad, stepW, wName } from './math';
import {
  LAYERS, LH, big, chipRects, getK, setK, drawNetView, drawStrip, drawTable, fz, netLayout, num, panel, rich, title,
  type NetView, type Part,
} from './parts';

// ── números canónicos del ejemplo ──────────────────────────────────────────
const F0 = forward(W0), B0 = backward(W0, F0);
const W1 = stepW(W0, B0.g, 1), F1 = forward(W1);
const PROBE = W0.map((_, k) => numGrad(W0, k));
const GOAL = 0.10;                       // meta del primer turno: pérdida ≤ 0.10 (se llega con un mínimo de 6 clics de ±0.1; ver verify-data.ts)
const STEP_BTN = 0.1;                    // paso de los botones «subir / bajar peso»

// ── estado interactivo ──────────────────────────────────────────────────────
interface G1 { w: number[]; shown: number[]; active: number; lastSel: number; drag: null | { k: number; x0: number; y0: number; w0: number }; won: boolean; edits: number }
interface G2 { w: number[]; shown: number[]; hist: number[]; steps: number; anim: null | { t: number; dur: number; from: number[]; to: number[] }; run: number; eta: number; won: boolean }
const newG1 = (S: Frame): G1 => ({ w: W0.slice(), shown: W0.slice(), active: S.p.wsel ?? 4, lastSel: S.p.wsel ?? 4, drag: null, won: false, edits: 0 });
const newG2 = (): G2 => ({ w: W1.slice(), shown: W1.slice(), hist: [F1.L], steps: 0, anim: null, run: 0, eta: 1, won: false });
const G1 = (S: Frame): G1 => (S.st.g1 ??= newG1(S));
const G2 = (S: Frame): G2 => (S.st.g2 ??= newG2());
const round2 = (v: number) => Math.round(v * 100) / 100;

const ANIM_SLOW = 1.5, ANIM_FAST = 0.6;
function startStep(S: Frame, g: G2) {
  if (g.anim) finishStep(g);
  const b = backward(g.w);
  const eta = S.p.eta ?? 1;
  g.eta = eta;
  g.anim = { t: 0, dur: g.run > 0 ? ANIM_FAST : ANIM_SLOW, from: g.w.slice(), to: stepW(g.w, b.g, eta) };
}
function finishStep(g: G2) {
  if (!g.anim) return;
  g.w = g.anim.to; g.shown = g.w.slice();
  g.hist.push(forward(g.w).L); g.steps++; g.anim = null;
}
const animProg = (g: G2) => (g.anim ? clamp(g.anim.t / g.anim.dur) : 1);
function animW(g: G2): number[] {
  if (!g.anim) return g.shown;
  const k = ease.io(clamp((animProg(g) - 0.68) / 0.32));
  return g.anim.from.map((v, i) => lerp(v, g.anim!.to[i], k));
}

// ── utilidades de tiempo y de diseño ────────────────────────────────────────
/** Opacidad de un bloque que vive entre el inicio del segmento a y el del b. */
const win = (S: Frame, a: string, b?: string, fin = 0.5, fout = 0.4) => S.at(a, 0, fin) * (b ? 1 - S.at(b, 0, fout) : 1);
const edgeKey = (k: number) => { const [l, i, j] = EDGE[k]; return `${l}:${i}>${j}`; };
const mixW = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t));

function lay(S: Frame) {
  const all = inset(S.full(), 16 * S.u);
  const gap = 12 * S.u;
  const [net, led] = S.portrait ? split(all, 'v', 0.46, gap) : split(all, 'h', 0.54, gap);
  return { all, net, led };
}

/** Pesos que muestra la red en cada momento de la lección. */
function wShown(S: Frame): number[] {
  if (S.between('try2', 'loop')) { const g = G2(S); return g.anim ? animW(g) : g.shown; }
  if (S.between('try1', 'reset-ex')) return G1(S).shown;
  if (S.between('reset-ex', 'who')) return mixW(G1(S).w, W0, S.at('reset-ex', 0.5, 1.9, 'io'));
  if (S.between('update', 'after')) return mixW(W0, W1, S.at('update', 1.8, 3.0, 'io'));
  if (S.on('after')) return W1;
  return W0;
}

// ── la escena ───────────────────────────────────────────────────────────────
const wLabel = (k: number) => ({ es: wName(k), en: wName(k) });
const fmtEta = (v: number) => v.toFixed(1);

const scene: SceneFactory = () => ({
  controls: [
    { id: 'wsel', kind: 'choice', label: { es: 'Peso a mover', en: 'Weight to move' }, options: [0, 1, 2, 3, 4, 5].map((k) => ({ value: k, label: wLabel(k) })), value: 4, from: 'try1', to: 'reset-ex' },
    { id: 'wdown', kind: 'button', label: { es: 'Bajar peso', en: 'Lower weight' }, from: 'try1', to: 'reset-ex' },
    { id: 'wup', kind: 'button', primary: true, label: { es: 'Subir peso', en: 'Raise weight' }, from: 'try1', to: 'reset-ex' },
    { id: 'wreset', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try1', to: 'reset-ex' },
    { id: 'eta', kind: 'slider', label: { es: 'Tasa de aprendizaje η', en: 'Learning rate η' }, min: 0.1, max: 5, step: 0.1, value: 1, from: 'try2', to: 'loop', fmt: fmtEta },
    { id: 'train', kind: 'button', primary: true, label: { es: 'Dar un paso de entrenamiento', en: 'Take a training step' }, from: 'try2', to: 'loop' },
    { id: 'train10', kind: 'button', label: { es: 'Correr diez pasos', en: 'Run ten steps' }, from: 'try2', to: 'loop' },
    { id: 'treset', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try2', to: 'loop' },
  ],

  action(S, id) {
    if (id === 'wup' || id === 'wdown' || id === 'wreset') {
      if (!S.between('try1', 'reset-ex')) return;
      const g = G1(S);
      if (id === 'wreset') { S.st.g1 = newG1(S); return; }
      const k = g.active;
      g.w[k] = clampW(round2(g.w[k] + (id === 'wup' ? STEP_BTN : -STEP_BTN))); g.edits++;
    } else if (id === 'train' || id === 'train10' || id === 'treset') {
      if (!S.between('try2', 'loop')) return;
      const g = G2(S);
      if (id === 'treset') { S.st.g2 = newG2(); return; }
      if (id === 'train') { g.run = 0; startStep(S, g); } else { g.run = 10; startStep(S, g); g.run--; }
    }
  },

  pointer(S, e) {
    if (!S.between('try1', 'reset-ex') || !S.free) return;
    const g = G1(S), L = lay(S), NL = netLayout(S, L.net);
    if (e.type === 'down') {
      const chips = chipRects(S, NL, g.shown);
      let best = -1, bd = Infinity;
      chips.forEach((c, k) => { const dd = Math.hypot(e.x - c.cx, e.y - c.cy); if (dd < bd) { bd = dd; best = k; } });
      if (best >= 0 && bd <= Math.max(S.hitR + 14 * S.u, chips[best].w / 2 + 10)) { g.drag = { k: best, x0: e.x, y0: e.y, w0: g.w[best] }; g.active = best; }
    } else if (e.type === 'move' && g.drag) {
      const dr = g.drag, delta = ((e.x - dr.x0) - (e.y - dr.y0)) / (110 * S.u);
      const nv = clampW(round2(dr.w0 + delta));
      if (nv !== g.w[dr.k]) { g.w[dr.k] = nv; g.edits++; }
    } else if (e.type === 'up' || e.type === 'leave') g.drag = null;
  },
  cursor(S, x, y) {
    if (!S.between('try1', 'reset-ex') || !S.free) return undefined;
    const g = G1(S), chips = chipRects(S, netLayout(S, lay(S).net), g.shown);
    return chips.some((c) => Math.hypot(x - c.cx, y - c.cy) <= Math.max(S.hitR, c.w / 2 + 6)) ? (g.drag ? 'grabbing' : 'grab') : undefined;
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const dt = Math.min(S.dt, 0.1);
    if (S.between('try1', 'reset-ex')) {
      const g = G1(S);
      if (S.p.wsel !== undefined && S.p.wsel !== g.lastSel) { g.active = S.p.wsel; g.lastSel = S.p.wsel; }
      const k = 1 - Math.exp(-dt * 14);
      for (let i = 0; i < 6; i++) g.shown[i] += (g.w[i] - g.shown[i]) * k;
      if (forward(g.w).L <= GOAL) { g.won = true; S.complete('hand'); }
    }
    if (S.between('try2', 'loop')) {
      const g = G2(S);
      if (g.anim) { g.anim.t += dt; if (g.anim.t >= g.anim.dur) { finishStep(g); if (g.run > 0) { startStep(S, g); g.run--; } } }
      if (g.steps >= 5 && !g.won) { g.won = true; S.complete('train'); }
    }
  },

  render(S) {
    const { d } = S;
    const L = lay(S);
    const uiA = 1 - S.at('loop', 0, 0.7);
    if (uiA > 0.01) d.withAlpha(uiA, () => drawMain(S, L));
    if (S.on('loop')) {
      const a = S.at('loop', 0.2, 0.9) * (1 - S.at('history-a', 0, 0.6));
      if (a > 0.01) d.withAlpha(a, () => drawLoop(S, L.all));
      const h = S.at('history-a', 0.2, 0.9) * (1 - S.at('limit-memory', 0, 0.6));
      if (h > 0.01) d.withAlpha(h, () => drawHistory(S, L.all));
      const m = S.at('limit-memory', 0.2, 0.9) * (1 - S.at('limit-fade', 0, 0.6));
      if (m > 0.01) d.withAlpha(m, () => drawMemory(S, L.all));
      const f = S.at('limit-fade', 0.2, 0.9) * (1 - S.at('bridge', 0, 0.6));
      if (f > 0.01) d.withAlpha(f, () => drawFade(S, L.all));
      if (S.on('bridge')) d.withAlpha(S.at('bridge', 0.1, 0.8), () => drawBridge(S));
    }
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Red + cuaderno
// ═════════════════════════════════════════════════════════════════════════
function drawMain(S: Frame, L: { all: Rect; net: Rect; led: Rect }) {
  // hook: una red grande, desvaída, con la pregunta
  const bigA = S.reveal('hook', 0, 0.8) * (1 - S.at('tiny', 0, 0.7));
  if (bigA > 0.01) S.d.withAlpha(bigA, () => drawBigNet(S, L.all));
  const tinyA = S.at('tiny', 0.1, 0.9);
  if (tinyA <= 0.01) return;
  S.d.withAlpha(tinyA, () => {
    setK(1);
    drawNetPart(S, netLayout(S, L.net));
    drawLedger(S, L.led);
    setK(1);
  });
}

function netView(S: Frame): NetView {
  const w = wShown(S), f = forward(w), b = backward(w, f);
  const g1 = S.between('try1', 'reset-ex'), g2 = S.between('try2', 'loop');
  // señal hacia delante
  let signal = 0;
  if (S.between('fwd-h', 'fwd-out')) signal = S.at('fwd-h', 0.2, 2.0, 'lin');
  else if (S.on('fwd-out')) signal = 1 + S.at('fwd-out', 0.2, 2.0, 'lin');
  if (S.between('after', 'try2')) signal = 2 * S.at('after', 0.2, 3.0, 'lin');
  // anillos de culpa (los pulsos de culpa de la narración se dibujan aparte)
  let blame = 0;
  if (S.between('back-err', 'all-six')) blame = 0.001;
  if (S.between('back-hidden', 'all-six') && S.since('back-hidden') > 1.4) blame = 1;
  if (S.between('back-w14', 'all-six') && S.since('back-w14') > 1.4) blame = 2;
  if (g2) { const g = G2(S); if (g.anim) { const p = animProg(g); signal = 2 * clamp(p / 0.34); blame = 2 * clamp((p - 0.34) / 0.34); } else { signal = 2; blame = 0; } }
  // brote de la culpa sobre cada arista
  const ovl = EDGE.map((_, k) => (k >= 4 ? S.at('back-w56', 0.3, 1.8, 'out') : S.at('back-w14', 0.3, 1.8, 'out')));
  // resaltado
  const hl: string[] = [];
  if (S.between('fwd-h', 'fwd-out')) { const t = S.since('fwd-h'); hl.push(t < 1.5 ? '1:0' : t < 2.7 ? '1:1' : ''); }
  if (S.between('chain-w5', 'back-w56')) hl.push(edgeKey(4), '2:0');
  if (S.between('back-w56', 'back-hidden')) hl.push(edgeKey(4), edgeKey(5));
  if (S.between('back-hidden', 'sign')) hl.push('1:0', '1:1');
  if (S.between('sign', 'back-w14')) hl.push(edgeKey(5), '1:1');
  if (S.between('back-w14', 'reuse')) hl.push(edgeKey(0), edgeKey(1), edgeKey(2), edgeKey(3));
  if (S.between('reuse', 'all-six')) hl.push(edgeKey(0), edgeKey(4), '1:0', '2:0');
  // tanteo de cada peso
  let hot = -1;
  if (S.between('wiggle', 'wiggle-cost')) { const k = Math.floor((S.since('wiggle') - 0.3) / 0.4); hot = k >= 0 && k < 6 ? k : -1; }
  if (g1) hot = G1(S).active;
  // pulsos de culpa propios
  let pulse: NetView['pulse'];
  if (S.between('back-w56', 'back-hidden')) pulse = { layer: 1, f: S.at('back-w56', 0.2, 1.5, 'lin') };
  else if (S.between('back-hidden', 'sign')) pulse = { layer: 1, f: S.at('back-hidden', 0.2, 1.5, 'lin') };
  else if (S.between('back-w14', 'reuse')) pulse = { layer: 0, f: S.at('back-w14', 0.2, 1.5, 'lin') };
  return {
    w, a1: f.a1, a2: f.a2, y: f.y,
    inA: S.reveal('example', 0.3, 0.5), hidA: S.at('fwd-h', 1.6, 2.2), outA: S.at('fwd-out', 1.6, 2.2),
    signal, blame, highlight: hl, ovl, g: b.g,
    qA: S.on('question') ? S.at('question', 0.3, 0.9) : 0,
    chipA: S.reveal('tiny', 0.3, 0.6), active: g1 ? G1(S).active : -1, hot, grab: g1,
    names: S.reveal('tiny', 0.6, 0.5), targetA: S.reveal('example', 0.6, 0.5),
    pulse,
    hint: g1 ? S.l('arrastra un peso ↕ o usa los botones', 'drag a weight ↕ or use the buttons') : undefined,
  };
}

function drawNetPart(S: Frame, NL: ReturnType<typeof netLayout>) {
  const v = netView(S);
  const { g } = drawNetView(S, NL, v);
  // aviso del signo (segmento «sign»): el peso w₆ es negativo
  if (S.between('sign', 'back-w14')) {
    const a = S.reveal('sign', 0.3, 0.5), o = g.nodes[2][0];
    S.d.withAlpha(a, () => badge(S, S.l('w₆ < 0: culpa invertida', 'w₆ < 0: blame flipped'), NL.rect.x + NL.rect.w * 0.5, NL.rect.y + NL.rect.h + 18 * S.u, { tone: 'err', mono: true }));
    void o;
  }
}

// ── el cuaderno ─────────────────────────────────────────────────────────────
function drawLedger(S: Frame, led: Rect) {
  const pa = S.reveal('tiny', 0.2, 0.6);
  const r = panel(S, led, pa);
  setK(clamp(Math.min(r.w / 300, r.h / 190), 1, 1.5));
  d_modes(S, r);
}

function d_modes(S: Frame, r: Rect) {
  const w = wShown(S), f = forward(w), b = backward(w, f);
  // 0 · ficha del ejemplo
  let a = win(S, 'tiny', 'fwd-h'); if (a > 0.01) mSpec(S, r, a);
  // 1 · pase hacia delante
  a = win(S, 'fwd-h', 'loss'); if (a > 0.01) mForward(S, r, a);
  // 2 · pérdida
  a = win(S, 'loss', 'question'); if (a > 0.01) mLoss(S, r, a);
  // 3 · tabla de culpas: ¿?, tanteo
  a = win(S, 'question', 'chain'); if (a > 0.01) mProbe(S, r, a);
  // 4 · regla de la cadena (idea) y cadena de w₅
  a = win(S, 'chain', 'chain-w5'); if (a > 0.01) mChainIdea(S, r, a);
  a = win(S, 'chain-w5', 'back-hidden'); if (a > 0.01) mStrip5(S, r, a);
  // 5 · culpa de las ocultas y de los pesos de entrada
  a = win(S, 'back-hidden', 'reuse'); if (a > 0.01) mHidden(S, r, a);
  a = win(S, 'reuse', 'all-six'); if (a > 0.01) mStrip1(S, r, a);
  // 6 · las seis culpas
  a = Math.max(win(S, 'all-six', 'cost'), win(S, 'read-sign', 'who')); if (a > 0.01) mTable(S, r, a, w, b.g, f.L);
  a = win(S, 'cost', 'read-sign'); if (a > 0.01) mCost(S, r, a);
  // 7 · quién hace qué, actualización, después
  a = win(S, 'who', 'update'); if (a > 0.01) mRoles(S, r, a);
  a = win(S, 'update', 'after'); if (a > 0.01) mUpdate(S, r, a);
  a = win(S, 'after', 'try2'); if (a > 0.01) mAfter(S, r, a);
  a = win(S, 'try2', 'loop'); if (a > 0.01) mTrain(S, r, a);
}

const par = (S: Frame, v: number, dg: number) => (v < 0 ? '(' + num(S, v, dg) + ')' : num(S, v, dg));
const sumLine = (S: Frame, name: string, w1: number, x1: number, d1: number, w2: number, x2: number, d2: number, res: number, t2: 'sig' | 'sig' = 'sig'): Part[] => [
  [name + ' = ', 'ink2'], [par(S, w1, 1), 'w'], ['·', 'ink2'], [num(S, x1, d1), t2], [' + ', 'ink2'], [par(S, w2, 1), 'w'], ['·', 'ink2'], [num(S, x2, d2), t2], [' = ', 'ink2'], [num(S, res, 3), 'ink', true],
];

/** Ancho de una línea de partes a un tamaño dado. */
const partsWidth = (S: Frame, parts: Part[], size: number) => parts.reduce((w, [t, , b]) => w + S.d.measure(t, { size, weight: b ? 700 : 500, font: 'mono' }), 0);
/** Parte una línea «a = b = c» antes del último «=»: la segunda línea queda sangrada («    = c»). */
function wrapEq(parts: Part[]): Part[][] {
  for (let i = parts.length - 1; i >= 0; i--) {
    const [t, role, b] = parts[i], k = t.lastIndexOf('=');
    if (k < 0) continue;
    const first: Part[] = [...parts.slice(0, i), ...(k > 0 ? [[t.slice(0, k).trimEnd(), role, b] as Part] : [])];
    return [first, [['  ' + t.slice(k), role, b], ...parts.slice(i + 1)]];
  }
  return [parts];
}
/**
 * Líneas del cuaderno. Si una no cabe ni al tamaño mínimo legible (teléfono en horizontal), se parte en dos
 * renglones antes del último «=». Las posiciones dependen solo del ancho del panel, no del tiempo. Devuelve la y siguiente.
 */
function lines(S: Frame, r: Rect, y0: number, rows: { parts: Part[]; a: number }[], lh = LH(S), ys?: number[]): number {
  let y = y0;
  const minSize = 12.3 / S.u;
  for (const row of rows) {
    ys?.push(y);
    const ls = partsWidth(S, row.parts, minSize) > r.w ? wrapEq(row.parts) : [row.parts];
    for (const p of ls) { if (row.a > 0.01) rich(S, r.x, y, p, { a: row.a, maxW: r.w }); y += lh; }
  }
  ys?.push(y);
  return y;
}

// 0 · ficha ──────────────────────────────────────────────────────────────
function mSpec(S: Frame, r: Rect, a: number) {
  const y = title(S, r, S.l('La red de la lección', 'The lesson network'), 'ink', a);
  const y0 = y + LH(S) * 0.8;
  const tx = (t: string, role: 'ink2' = 'ink2'): Part => [t, role];
  lines(S, r, y0, [
    { a: a * S.reveal('tiny', 0.5, 0.4), parts: [tx(S.l('capas: ', 'layers: ')), ['2 → 2 → 1', 'ink', true]] },
    { a: a * S.reveal('tiny', 1.1, 0.4), parts: [tx(S.l('pesos: ', 'weights: ')), ['6', 'w', true], tx(S.l(' (sin sesgos)', ' (no biases)'))] },
    { a: a * S.reveal('tiny', 1.7, 0.4), parts: [tx(S.l('activación: ', 'activation: ')), tx('σ(z) = 1 / (1 + e^−z)')] },
    { a: a * S.reveal('example', 0.4, 0.4), parts: [tx(S.l('entradas: ', 'inputs: ')), ['x₁', 'sig', true], tx(' = ' + num(S, X[0], 1) + '   '), ['x₂', 'sig', true], tx(' = ' + num(S, X[1], 1))] },
    { a: a * S.reveal('example', 1.0, 0.4), parts: [tx(S.l('objetivo: ', 'target: ')), ['t', 'dat', true], tx(' = ' + num(S, TARGET, 1))] },
  ]);
}

// 1 · pase hacia delante ─────────────────────────────────────────────────
function mForward(S: Frame, r: Rect, a: number) {
  const y = title(S, r, S.l('Hacia delante', 'Forward'), 'sig', a, S.l('cifras a 3 decimales', '3-decimal digits'));
  const y0 = y + LH(S) * 0.8, f = F0;
  const T = (k: number, d = 0.5) => a * S.reveal('fwd-h', 0.5 + d * k, 0.4);
  const To = (k: number) => a * S.reveal('fwd-out', 0.5 + 0.6 * k, 0.4);
  lines(S, r, y0, [
    { a: T(0), parts: sumLine(S, 'z₁', W0[0], X[0], 1, W0[1], X[1], 1, f.z1) },
    { a: T(1), parts: [['a₁ = σ(' + num(S, f.z1, 3) + ') = ', 'ink2'], [num(S, f.a1, 3), 'sig', true]] },
    { a: T(2), parts: sumLine(S, 'z₂', W0[2], X[0], 1, W0[3], X[1], 1, f.z2) },
    { a: T(3), parts: [['a₂ = σ(' + num(S, f.z2, 3) + ') = ', 'ink2'], [num(S, f.a2, 3), 'sig', true]] },
    { a: To(0), parts: [['z = ', 'ink2'], [par(S, W0[4], 1), 'w'], ['·', 'ink2'], [num(S, f.a1, 3), 'sig'], [' + ', 'ink2'], [par(S, W0[5], 1), 'w'], ['·', 'ink2'], [num(S, f.a2, 3), 'sig'], [' = ', 'ink2'], [num(S, f.z, 3), 'ink', true]] },
    { a: To(1), parts: [['ŷ = σ(' + num(S, f.z, 3) + ') = ', 'ink2'], [num(S, f.y, 3), 'sig', true]] },
  ]);
}

// 2 · pérdida ────────────────────────────────────────────────────────────
function mLoss(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), sg = tone(S, 'sig'), dt = tone(S, 'dat'), er = tone(S, 'err');
  const y = title(S, r, S.l('Pérdida', 'Loss'), 'err', a);
  const f = F0, sz = fz(S, 12.5);
  // recta de 0 a 1 con la predicción y el objetivo
  const x0 = r.x + 14 * u, x1 = r.x + r.w - 14 * u, ly = y + 52 * u, X_ = (v: number) => lerp(x0, x1, v);
  const A1 = a * S.reveal('loss', 0.2, 0.5), A2 = a * S.reveal('loss', 0.8, 0.5), A3 = a * S.reveal('loss', 1.4, 0.5);
  d.withAlpha(a * A1, () => {
    d.line(x0, ly, x1, ly, p.lineStrong, 2);
    [0, 1].forEach((v) => { d.line(X_(v), ly - 4 * u, X_(v), ly + 4 * u, p.lineStrong, 1.5); d.text(num(S, v, 1), X_(v), ly + 16 * u, { size: sz, font: 'mono', color: p.mute, align: 'center', base: 'middle' }); });
    d.circle(X_(f.y), ly, 7 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
    d.text('ŷ = ' + num(S, f.y, 3), X_(f.y), ly - 20 * u, { size: sz, weight: 700, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
  });
  d.withAlpha(a * A2, () => {
    const c = X_(TARGET), s = 7.5 * u;
    d.polygon([[c, ly - s], [c + s, ly], [c, ly + s], [c - s, ly]], { fill: dt.c, stroke: p.stage, lw: 1.5 });
    d.text('t = ' + num(S, TARGET, 1), c, ly - 20 * u, { size: sz, weight: 700, font: 'mono', color: dt.ink, align: 'right', base: 'middle' });
  });
  d.withAlpha(a * A3, () => {
    const xa = X_(f.y) + 8 * u, xb = X_(TARGET) - 9 * u;
    d.line(xa, ly + 3 * u, xb, ly + 3 * u, er.c, 3);
    d.text(S.l('error ŷ − t = ', 'error ŷ − t = ') + num(S, f.y - TARGET, 3), (xa + xb) / 2, ly + 36 * u, { size: sz, weight: 700, font: 'mono', color: er.ink, align: 'center', base: 'middle' });
  });
  const lh = LH(S), y0 = ly + 62 * u;
  lines(S, r, y0, [
    { a: a * S.reveal('loss', 2.0, 0.4), parts: [['L = ½·(ŷ − t)²', 'ink2']] },
    { a: a * S.reveal('loss', 2.6, 0.4), parts: [['  = ½·(' + num(S, f.y, 3) + ' − ' + num(S, TARGET, 1) + ')² = ', 'ink2'], [num(S, f.L, 3), 'err', true]] },
  ], lh);
}

// 3 · tabla: «?» y tanteo ─────────────────────────────────────────────────
function mProbe(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err');
  const sub = S.between('wiggle', 'wiggle-cost') || S.on('wiggle-cost');
  const y = title(S, r, S.l('La culpa de cada peso', 'The blame of each weight'), 'err', a, '∂L/∂w');
  const inWig = S.on('wiggle'), costA = S.at('wiggle-cost', 0.1, 0.6);
  const rowA = [0, 1, 2, 3, 4, 5].map((k) => a * S.reveal('question', 0.3 + 0.12 * k, 0.4));
  const gA = [0, 1, 2, 3, 4, 5].map((k) => (inWig ? S.at('wiggle', 0.3 + 0.4 * k, 0.55 + 0.4 * k, 'out') : 0));
  const tr = { x: r.x, y: y + 4 * u, w: r.w, h: r.h - (y - r.y) - 4 * u - 26 * u };
  d.withAlpha(1 - 0.78 * costA, () => drawTable(S, tr, { w: W0, g: B0.g, rowA, kind: inWig ? 'probe' : 'q', gA, probe: PROBE, active: S.between('wiggle', 'wiggle-cost') ? Math.floor((S.since('wiggle') - 0.3) / 0.4) : -1, scale: 0.12 }));
  // contador de pases extra
  if (inWig) {
    const n = S.between('wiggle', 'wiggle-cost') ? clamp(Math.floor((S.since('wiggle') - 0.3) / 0.4) + 1, 0, 6) : 6;
    d.withAlpha(a * (1 - costA), () => rich(S, r.x, r.y + r.h - 8 * u, [[S.l('pases hacia delante extra: ', 'extra forward passes: '), 'ink2'], [String(n), 'err', true]], { maxW: r.w }));
  }
  // el costo a escala de GPT-3
  if (costA > 0.01) d.withAlpha(a * costA, () => {
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.55;
    d.rect(r.x + 6 * u, cy - 50 * u, r.w - 12 * u, 100 * u, { fill: p.surface, stroke: er.c, lw: 1.5, r: 4 });
    d.text(big(S, 175000000000), cx, cy - 12 * u, { size: Math.min(30, 17 + r.w / 22), weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'middle' });
    d.text(S.l('pases extra en cada paso de entrenamiento', 'extra passes at every training step'), cx, cy + 24 * u, { size: fz(S, 12.5), weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w - 30 * u });
  });
  void sub;
}

// 4 · regla de la cadena: A → B → C ──────────────────────────────────────
function mChainIdea(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err'), ink = tone(S, 'ink');
  const y = title(S, r, S.l('Regla de la cadena', 'The chain rule'), 'ink', a);
  const bw = 50 * u, bh = 38 * u, gap = (r.w - 3 * bw) / 2, cy = y + 52 * u;
  const names = ['A', 'B', 'C'];
  names.forEach((n, i) => {
    const t = S.reveal('chain', 0.3 + 0.8 * i, 0.4), x = r.x + i * (bw + gap);
    d.withAlpha(a * t, () => {
      d.rect(x, cy - bh / 2, bw, bh, { fill: alpha(ink.c, 0.08), stroke: ink.c, lw: 1.8, r: 3 });
      d.text(n, x + bw / 2, cy + 0.5, { size: fz(S, 18), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    });
  });
  [['×2', 1], ['×3', 2]].forEach(([t, i], k) => {
    const prog = S.at('chain', 0.6 + 0.8 * k, 1.2 + 0.8 * k, 'out'), x1 = r.x + k * (bw + gap) + bw + 3 * u, x2 = r.x + (k + 1) * (bw + gap) - 3 * u;
    d.withAlpha(a * prog, () => {
      d.arrow(x1, cy, x1 + (x2 - x1) * prog, cy, p.ink2, 2.4, 9);
      d.text(String(t), (x1 + x2) / 2, cy - 17 * u, { size: fz(S, 15), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    });
    void i;
  });
  const br = S.at('chain', 2.4, 3.2, 'out');
  d.withAlpha(a * br, () => {
    const x1 = r.x + bw / 2, x2 = r.x + 2 * (bw + gap) + bw / 2, by = cy + bh / 2 + 12 * u;
    d.polyline([[x1, by - 5 * u], [x1, by], [x2, by], [x2, by - 5 * u]], er.c, 2);
    d.text('×2 · ×3 = ×6', (x1 + x2) / 2, by + 18 * u, { size: fz(S, 17), weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'middle' });
    d.text(S.l('las influencias se multiplican', 'influences multiply'), (x1 + x2) / 2, by + 40 * u, { size: fz(S, 12.5), weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
}

// 4b · cadena de w₅ ──────────────────────────────────────────────────────
function mStrip5(S: Frame, r: Rect, a: number) {
  const f = F0, b = B0, er = tone(S, 'err');
  const y = title(S, r, S.l('Cadena de w₅', 'Chain of w₅'), 'err', a);
  const fill = [S.at('back-err', 0.4, 0.9), S.at('back-sig', 0.4, 0.9), S.at('back-w56', 0.4, 0.9)];
  const h = drawStrip(S, { x: r.x, y: y + 2 * S.u, w: r.w, h: r.h }, {
    factors: [
      { sym: 'ŷ − t', val: b.eY, cap: S.l('error de la salida', 'output error'), tone: 'err' },
      { sym: "σ'(z)", val: b.spY, cap: S.l('pendiente sigmoide', 'sigmoid slope'), tone: 'dat' },
      { sym: 'a₁', val: f.a1, cap: S.l('señal que llevaba', 'signal it carried'), tone: 'sig' },
    ],
    fill, res: { sym: '∂L/∂w₅', val: b.g[4], cap: S.l('culpa de w₅', 'blame of w₅') }, resA: S.at('back-w56', 1.0, 1.6), a,
    bracket: { from: 0, to: 1, text: 'δ_y = ' + num(S, b.dY, 3), a: S.at('back-sig', 1.0, 1.6) },
  });
  const y0 = y + h + LH(S) * 0.7;
  const lh = LH(S);
  lines(S, r, y0, [
    { a: a * (S.between('chain-w5', 'back-err') ? S.reveal('chain-w5', 1.0, 0.5) : 0), parts: [['∂L/∂w₅ = ', 'ink2'], ['(ŷ − t)', 'err'], [' · ', 'ink2'], ["σ'(z)", 'dat'], [' · ', 'ink2'], ['a₁', 'sig']] },
    { a: a * (S.between('back-err', 'back-sig') ? S.reveal('back-err', 0.6, 0.5) : 0), parts: [['ŷ − t = ' + num(S, f.y, 3) + ' − ' + num(S, TARGET, 1) + ' = ', 'ink2'], [num(S, b.eY, 3), 'err', true]] },
    { a: a * (S.between('back-sig', 'back-w56') ? S.reveal('back-sig', 0.6, 0.5) : 0), parts: [['δ_y = ' + num(S, b.eY, 3) + ' · ' + num(S, b.spY, 3) + ' = ', 'ink2'], [num(S, b.dY, 3), 'err', true]] },
  ], lh);
  // las dos culpas de la última capa
  if (S.on('back-w56')) lines(S, r, y0, [
    { a: a * S.reveal('back-w56', 0.8, 0.4), parts: [['∂L/∂w₅ = ' + num(S, b.dY, 3) + ' · ' + num(S, f.a1, 3) + ' = ', 'ink2'], [num(S, b.g[4], 3), 'err', true]] },
    { a: a * S.reveal('back-w56', 1.4, 0.4), parts: [['∂L/∂w₆ = ' + num(S, b.dY, 3) + ' · ' + num(S, f.a2, 3) + ' = ', 'ink2'], [num(S, b.g[5], 3), 'err', true]] },
  ], lh);
  void er;
}

// 5 · culpa de las ocultas y de sus pesos ────────────────────────────────
function mHidden(S: Frame, r: Rect, a: number) {
  const f = F0, b = B0;
  const y = title(S, r, S.on('back-w14') ? S.l('Hacia atrás, capa por capa', 'Backward, layer by layer') : S.l('La culpa llega a las ocultas', 'The blame reaches the hidden neurons'), 'err', a);
  const lh = LH(S), y0 = y + lh * 0.8;
  const hot = S.between('sign', 'back-w14');
  const hl = hot ? S.pal.ink : '';
  void hl;
  const ys: number[] = [];
  const yEnd = lines(S, r, y0, [
    { a: a * S.reveal('back-hidden', 0.2, 0.4), parts: [['δ_y = ', 'ink2'], [num(S, b.dY, 3), 'err', true], [S.l('   (ya la tenemos)', '   (we have it)'), 'ink2']] },
    { a: a * S.reveal('back-hidden', 0.9, 0.4), parts: [['δ₁ = ' , 'ink2'], [num(S, b.dY, 3), 'err'], ['·', 'ink2'], [num(S, W0[4], 1), 'w'], ['·', 'ink2'], [num(S, b.sp1, 3), 'dat'], [' = ', 'ink2'], [num(S, b.d1, 3), 'err', true]] },
    { a: a * S.reveal('back-hidden', 1.5, 0.4), parts: [['δ₂ = ', 'ink2'], [num(S, b.dY, 3), 'err'], ['·', 'ink2'], [par(S, W0[5], 1), 'w'], ['·', 'ink2'], [num(S, b.sp2, 3), 'dat'], [' = ', 'ink2'], [num(S, b.d2, 3), 'err', true]] },
  ], lh, ys);
  if (hot) {
    const yy = ys[2], hh = ys[3] - ys[2], u = S.u, a2 = S.reveal('sign', 0.2, 0.4);
    S.d.withAlpha(a * a2, () => S.d.rect(r.x - 4 * u, yy - lh / 2 + 1, r.w + 8 * u, hh - 2, { stroke: tone(S, 'err').c, lw: 1.6, r: 3 }));
  }
  const y1 = yEnd + lh * 0.3, T = (t: number) => a * S.reveal('back-w14', t, 0.4);
  lines(S, r, y1, [
    { a: T(0.4), parts: [['∂L/∂w₁ = δ₁·x₁ = ' + num(S, b.d1, 3) + '·' + num(S, X[0], 1) + ' = ', 'ink2'], [num(S, b.g[0], 3), 'err', true]] },
    { a: T(0.9), parts: [['∂L/∂w₂ = δ₁·x₂ = ' + num(S, b.d1, 3) + '·' + num(S, X[1], 1) + ' = ', 'ink2'], [num(S, b.g[1], 3), 'err', true]] },
    { a: T(1.4), parts: [['∂L/∂w₃ = δ₂·x₁ = ' + num(S, b.d2, 3) + '·' + num(S, X[0], 1) + ' = ', 'ink2'], [num(S, b.g[2], 3), 'err', true]] },
    { a: T(1.9), parts: [['∂L/∂w₄ = δ₂·x₂ = ' + num(S, b.d2, 3) + '·' + num(S, X[1], 1) + ' = ', 'ink2'], [num(S, b.g[3], 3), 'err', true]] },
  ], lh);
}

// 5b · cadena de w₁: reutiliza δ_y ───────────────────────────────────────
function mStrip1(S: Frame, r: Rect, a: number) {
  const f = F0, b = B0;
  const y = title(S, r, S.l('Cadena de w₁', 'Chain of w₁'), 'err', a);
  const k = [S.at('reuse', 0.3, 0.8), S.at('reuse', 0.7, 1.2), S.at('reuse', 1.1, 1.6), S.at('reuse', 1.5, 2.0)];
  const h = drawStrip(S, { x: r.x, y: y + 2 * S.u, w: r.w, h: r.h }, {
    factors: [
      { sym: 'δ_y', val: b.dY, cap: S.l('ya calculada', 'already known'), tone: 'err' },
      { sym: 'w₅', val: W0[4], cap: S.l('peso', 'weight'), tone: 'w', digits: 1 },
      { sym: "σ'(z₁)", val: b.sp1, cap: S.l('pendiente de h₁', 'slope of h₁'), tone: 'dat' },
      { sym: 'x₁', val: X[0], cap: S.l('entrada', 'input'), tone: 'sig', digits: 1 },
    ],
    fill: k, res: { sym: '∂L/∂w₁', val: b.g[0], cap: S.l('culpa de w₁', 'blame of w₁') }, resA: S.at('reuse', 2.0, 2.6), a,
    bracket: { from: 0, to: 0, text: S.l('reutilizada', 'reused'), a: S.at('reuse', 0.6, 1.2) },
  });
  void f;
  const lh = LH(S), y0 = y + h + lh * 0.7;
  lines(S, r, y0, [
    { a: a * S.reveal('reuse', 2.4, 0.5), parts: [['∂L/∂w₁ = ' + num(S, b.dY, 3) + '·' + num(S, W0[4], 1) + '·' + num(S, b.sp1, 3) + '·' + num(S, X[0], 1) + ' = ', 'ink2'], [num(S, b.g[0], 3), 'err', true]] },
  ], lh);
}

// 6 · las seis culpas ────────────────────────────────────────────────────
function mTable(S: Frame, r: Rect, a: number, w: number[], g: number[], L: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err');
  const g1 = S.between('try1', 'reset-ex');
  const y = title(S, r, g1 ? S.l('Mueve un peso y mira', 'Move a weight and watch') : S.l('Las seis culpas', 'All six blames'), 'err', a, g1 ? undefined : '∂L/∂w');
  const first = S.between('all-six', 'cost');
  const rowA = [0, 1, 2, 3, 4, 5].map((k) => (first ? S.at('all-six', 0.1 + 0.12 * k, 0.5 + 0.12 * k) : 1));
  const gA = [0, 1, 2, 3, 4, 5].map((k) => (first ? S.at('all-six', 0.3 + 0.18 * k, 0.8 + 0.18 * k, 'out') : 1));
  const arrows = S.on('read-sign') ? S.at('read-sign', 1.4, 2.0) : undefined;
  const active = g1 ? G1(S).active : -1;
  const foot = 30 * u;
  const tr = { x: r.x, y: y + 4 * u, w: r.w, h: r.h - (y - r.y) - 4 * u - foot };
  drawTable(S, tr, { w, g, rowA, kind: 'bp', gA, active, arrows, scale: 0.12, a });
  // pie: pérdida, y la comprobación contra el tanteo
  const fy = r.y + r.h - 10 * u;
  d.withAlpha(a, () => {
    const parts: Part[] = [[S.l('pérdida L = ', 'loss L = '), 'ink2'], [num(S, L, 3), 'err', true]];
    if (g1) {
      const G = G1(S);
      parts.push([S.l('   (inicial ', '   (start ') + num(S, F0.L, 3) + ')', 'ink2']);
      if (G.won) parts.push(['  ✓', 'dat', true]);
    }
    rich(S, r.x, fy, parts, { maxW: r.w });
  });
  if (first && S.on('all-six')) {
    const ca = S.reveal('all-six', 2.0, 0.6);
    d.withAlpha(a * ca, () => { const tw = d.measure('✓ ' + S.l('coincide con el tanteo', 'matches the probing'), { size: fz(S, 12.5), weight: 700 }); d.text('✓ ' + S.l('coincide con el tanteo', 'matches the probing'), r.x + r.w, fy, { size: fz(S, 12.5), weight: 700, color: tone(S, 'dat').ink, align: 'right', base: 'middle' }); void tw; });
  }
  if (g1 && G1(S).won) d.withAlpha(a, () => d.text(S.l('¡Lo hiciste a mano!', 'You did it by hand!'), r.x + r.w, fy, { size: fz(S, 12.5), weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'middle' }));
  void er; void p;
}

// 6b · costo de obtener el gradiente ─────────────────────────────────────
// Un bloque por tamaño de red: arriba, cuántos pesos; abajo, cuántos pases hacia delante extra pide cada método.
// Tantear: uno por peso (exacto). Retropropagación: del orden de dos (orden de magnitud; Kaplan et al. 2020 y Baydin et al. 2018).
function mCost(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err');
  const y = title(S, r, S.l('Costo de obtener las culpas', 'Cost of getting the blames'), 'err', a);
  const rows: [number, string][] = [[6, S.l('esta red', 'this network')], [1000, S.l('una red pequeña', 'a small network')], [175000000000, 'GPT-3']];
  const lh = LH(S), rh = lh * 2.9;
  rows.forEach(([n, tag], i) => {
    const ya = y + 12 * u + lh * 0.5 + i * rh, t = a * S.reveal('cost', 0.3 + 0.55 * i, 0.4);
    if (t <= 0.01) return;
    d.withAlpha(t, () => {
      rich(S, r.x, ya, [[big(S, n), 'ink', true], [' ' + S.l('pesos', 'weights'), 'ink2'], [' · ' + tag, 'ink2']], { maxW: r.w });
      rich(S, r.x + 8 * u, ya + lh, [[S.l('tantear: ', 'probing: '), 'ink2'], [big(S, n), 'ink2', true], [S.l(' pases', ' passes'), 'ink2']], { maxW: r.w - 8 * u });
      rich(S, r.x + 8 * u, ya + lh * 1.9, [[S.l('retroprop.: ', 'backprop: '), 'err'], ['≈ 2', 'err', true], [S.l(' pases', ' passes'), 'err']], { maxW: r.w - 8 * u });
      if (i < rows.length - 1) d.line(r.x, ya + lh * 2.45, r.x + r.w, ya + lh * 2.45, p.line, 1);
    });
  });
  const rowsEnd = y + 12 * u + lh * 0.5 + 2 * rh + lh * 2.6, noteH = 2.4 * 12.3 * 1.2 * getK();
  if (rowsEnd + noteH < r.y + r.h) d.withAlpha(a * S.reveal('cost', 2.2, 0.5), () => d.text(S.l('pases hacia delante extra para obtener las culpas (orden de magnitud)', 'extra forward passes to get the blames (order of magnitude)'), r.x, r.y + r.h - 6 * u, { size: fz(S, 12), weight: 500, color: p.mute, base: 'bottom', w: r.w, lh: 1.2 }));
  void er;
}

// 7a · quién hace qué ────────────────────────────────────────────────────
function mRoles(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err'), wt = tone(S, 'w');
  const y = title(S, r, S.l('Dos oficios distintos', 'Two different jobs'), 'ink', a);
  const bh = Math.min(70 * u, (r.h - (y - r.y) - 40 * u) / 2), x0 = r.x, w = r.w;
  const y1 = y + 10 * u, y2 = y1 + bh + 28 * u;
  const A1 = a * S.reveal('who', 0.5, 0.5), A2 = a * S.reveal('who', 1.6, 0.5), AA = a * S.reveal('who', 1.1, 0.4);
  const card = (yy: number, t: typeof er, head: string, sub: string, tag: string, al: number) => d.withAlpha(al, () => {
    d.rect(x0, yy, w, bh, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 1.8, r: 4 });
    d.text(head, x0 + 12 * u, yy + bh * 0.3, { size: fz(S, 14.5), weight: 800, color: t.ink, base: 'middle' });
    d.text(sub, x0 + 12 * u, yy + bh * 0.68, { size: fz(S, 13), weight: 600, font: 'mono', color: p.ink, base: 'middle', w: w - 24 * u });
    d.tag(tag, x0 + w - 8 * u, yy + 4 * u, { align: 'right', color: t.ink, fill: p.surface, stroke: t.c, size: 12, weight: 700 });
  });
  card(y1, er, S.l('Retropropagación', 'Backpropagation'), '∂L/∂w₁ … ∂L/∂w₆', S.l('calcula', 'computes'), A1);
  card(y2, wt, S.l('Descenso del gradiente', 'Gradient descent'), 'w ← w − η · ∂L/∂w', S.l('corrige', 'corrects'), A2);
  d.withAlpha(AA, () => {
    const cx = x0 + w / 2;
    d.arrow(cx, y1 + bh + 3 * u, cx, y2 - 3 * u, p.ink2, 2.2, 8);
    d.text(S.l('las seis culpas', 'the six blames'), cx + 10 * u, (y1 + bh + y2) / 2, { size: fz(S, 12.5), weight: 700, color: p.ink2, base: 'middle' });
  });
}

// 7b · actualización ─────────────────────────────────────────────────────
function mUpdate(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK();
  const y = title(S, r, S.l('Actualizar', 'Update'), 'w', a, 'η = ' + num(S, 1, 1));
  const rowA = [0, 1, 2, 3, 4, 5].map(() => a);
  const nwA = [0, 1, 2, 3, 4, 5].map((k) => S.at('update', 0.4 + 0.22 * k, 0.9 + 0.22 * k, 'out'));
  const foot = 28 * u;
  const tr = { x: r.x, y: y + 4 * u, w: r.w, h: r.h - (y - r.y) - 4 * u - foot };
  drawTable(S, tr, { w: W0, g: B0.g, rowA, kind: 'bp', gA: rowA, nw: W1, nwA, scale: 0.12, a });
  d.withAlpha(a * S.reveal('update', 0.2, 0.5), () => rich(S, r.x, r.y + r.h - 10 * u, [[S.l('nuevo = w − η · culpa', 'new = w − η · blame'), 'ink2']], { maxW: r.w }));
  void p;
}

// 7c · después de un paso ────────────────────────────────────────────────
function mAfter(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), sz = fz(S, 12.5);
  const y = title(S, r, S.l('Después de un paso', 'After one step'), 'dat', a);
  const rows: { l: string; o: number; n: number; t: 'sig' | 'err' }[] = [
    { l: S.l('predicción ŷ', 'prediction ŷ'), o: F0.y, n: F1.y, t: 'sig' },
    { l: S.l('pérdida L', 'loss L'), o: F0.L, n: F1.L, t: 'err' },
  ];
  const rh = Math.max(52 * u, 12.3 * 4);
  rows.forEach((row, i) => {
    const ya = y + 22 * u + i * rh, t = a * S.reveal('after', 0.6 + 1.2 * i, 0.5), tn = tone(S, row.t);
    d.withAlpha(t, () => {
      d.text(row.l, r.x, ya, { size: sz, weight: 700, color: p.mute, base: 'middle' });
      d.text(num(S, row.o, 3), r.x, ya + 24 * u, { size: fz(S, 20), weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
      d.arrow(r.x + 64 * u, ya + 24 * u, r.x + 96 * u, ya + 24 * u, p.ink2, 2, 8);
      d.text(num(S, row.n, 3), r.x + 108 * u, ya + 24 * u, { size: fz(S, 20), weight: 800, font: 'mono', color: tn.ink, base: 'middle' });
    });
  });
  d.withAlpha(a * S.reveal('after', 2.8, 0.5), () => d.text(S.l('1 pase hacia delante + 1 viaje de vuelta + 1 actualización', '1 forward pass + 1 trip back + 1 update'), r.x, r.y + r.h - 4 * u, { size: fz(S, 12), weight: 500, color: p.mute, base: 'bottom', w: r.w, lh: 1.2 }));
}

// 7d · entrenar ──────────────────────────────────────────────────────────
function mTrain(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u * getK(), er = tone(S, 'err'), sz = fz(S, 12.5);
  const g = G2(S), w = wShown(S), f = forward(w), b = backward(w, f);
  const y = title(S, r, S.l('Entrenando', 'Training'), 'err', a, 'η = ' + num(S, g.anim ? g.eta : (S.p.eta ?? 1), 1));
  const items: { l: string; v: string; t: 'ink' | 'sig' | 'err' }[] = [
    { l: S.l('pasos', 'steps'), v: String(g.steps + (g.anim ? 0 : 0)), t: 'ink' },
    { l: S.l('predicción ŷ', 'prediction ŷ'), v: num(S, f.y, 3), t: 'sig' },
    { l: S.l('pérdida L', 'loss L'), v: num(S, f.L, 3), t: 'err' },
  ];
  const cw = r.w / 3, ry = y + 12 * u;
  d.withAlpha(a, () => items.forEach((it, i) => {
    d.text(it.l, r.x + i * cw, ry, { size: sz, weight: 700, color: p.mute, base: 'middle' });
    d.text(it.v, r.x + i * cw, ry + 22 * u, { size: fz(S, 20), weight: 700, font: 'mono', color: tone(S, it.t).ink, base: 'middle' });
  }));
  const tableRoom = r.h - (ry + 40 * u - r.y) > 330 * u;
  const cr: Rect = { x: r.x, y: ry + 44 * u, w: r.w, h: Math.max(40 * u, (tableRoom ? 130 * u : r.h - (ry + 44 * u - r.y) - 6 * u)) };
  // curva de la pérdida
  const hist = g.hist.slice(), cur = g.anim ? [] : [];
  void cur;
  const n = Math.max(10, hist.length), plot = new Plot(S, cr, { xr: [0, n - 1], yr: [0, 0.2], pad: { l: 8, r: 8, t: 14, b: 10 } });
  d.withAlpha(a, () => {
    d.text(S.l('pérdida en cada paso', 'loss at each step'), cr.x, cr.y + 2, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.line(plot.r.x, plot.r.y + plot.r.h, plot.r.x + plot.r.w, plot.r.y + plot.r.h, p.line, 1);
    const pts: [number, number][] = hist.map((v, i) => [plot.X(i), plot.Y(v)]);
    if (g.anim) pts.push([plot.X(hist.length - 1 + animProg(g)), plot.Y(lerp(hist[hist.length - 1], forward(g.anim.to).L, ease.io(clamp((animProg(g) - 0.68) / 0.32))))]);
    d.polyline(pts, er.c, 2);
    pts.forEach(([x, yy]) => d.circle(x, yy, 2.6 * u, { fill: er.c }));
  });
  if (tableRoom) {
    const ty = cr.y + cr.h + 8 * u;
    const rowA = [1, 1, 1, 1, 1, 1];
    drawTable(S, { x: r.x, y: ty, w: r.w, h: r.y + r.h - ty }, { w, g: b.g, rowA, kind: 'bp', gA: rowA, scale: 0.12, a });
  }
  if (g.won) d.withAlpha(a, () => d.text(S.l('¡La pérdida baja en cada paso!', 'The loss drops at every step!'), r.x + r.w, r.y + r.h - 4 * u, { size: sz, weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'bottom' }));
}

// ═════════════════════════════════════════════════════════════════════════
// hook: una red grande
// ═════════════════════════════════════════════════════════════════════════
function drawBigNet(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, er = tone(S, 'err');
  const layers = [3, 5, 5, 4, 2];
  const rect = inset(r, 24 * u, 70 * u, 46 * u, 36 * u);
  const weights = layers.slice(0, -1).map((n, l) => Array.from({ length: n }, (_, i) => Array.from({ length: layers[l + 1] }, (_, j) => Math.sin(1.7 * (i + 1) * (j + 2) + l * 2.3))));
  const acts = layers.map((n, l) => Array.from({ length: n }, (_, i) => 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(i * 2.1 + l * 1.3))));
  const reveal = 1 + (layers.length - 1) * S.at('hook', 0.2, 1.8, 'out');
  const g = drawNet(S, rect, { layers, weights, acts, reveal, edges: 0.85, nodeR: Math.max(9, Math.min(15, rect.h / 16)) / u });
  const qa = S.reveal('hook', 2.4, 0.6);
  const qs: [number, number, number, number][] = [[1, 1, 2, 3], [2, 3, 3, 1], [1, 3, 2, 0], [2, 0, 3, 2], [0, 2, 1, 4]];
  d.withAlpha(qa, () => qs.forEach(([l, i, l2, j]) => {
    const A = g.nodes[l][i], B = g.nodes[l2][j], x = (A.x + B.x) / 2, y = (A.y + B.y) / 2;
    d.circle(x, y, 10 * u, { fill: er.soft, stroke: er.c, lw: 1.8 });
    d.text('?', x, y + 0.5, { size: fz(S, 14), weight: 800, color: er.ink, align: 'center', base: 'middle' });
  }));
  const o = g.nodes[4];
  d.withAlpha(S.reveal('hook', 1.4, 0.6), () => badge(S, S.l('error', 'error'), o[0].x + g.r + 12 * u, (o[0].y + o[1].y) / 2, { tone: 'err', align: 'left' }));
  d.withAlpha(S.reveal('hook', 1.0, 0.6), () => d.text(S.l('esquema: una red real tiene miles de pesos, o más', 'sketch: a real network has thousands of weights, or more'), r.x + r.w / 2, r.y + r.h - 22 * u, { size: fz(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'middle', w: r.w - 16 * u, lh: 1.2 }));
}

// ═════════════════════════════════════════════════════════════════════════
// cierre: bucle, historia, límites, puente
// ═════════════════════════════════════════════════════════════════════════
function drawLoop(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const items: { l: string; s: string; t: 'sig' | 'err' | 'w' }[] = [
    { l: S.l('1 · Hacia delante', '1 · Forward pass'), s: S.l('la red predice', 'the network predicts'), t: 'sig' },
    { l: S.l('2 · Pérdida', '2 · Loss'), s: S.l('mide el error', 'measures the error'), t: 'err' },
    { l: S.l('3 · Retropropagación', '3 · Backpropagation'), s: S.l('calcula las culpas', 'computes the blames'), t: 'err' },
    { l: S.l('4 · Descenso del gradiente', '4 · Gradient descent'), s: S.l('corrige los pesos', 'corrects the weights'), t: 'w' },
  ];
  // cada caja lleva su título y su descripción dentro, para que las flechas del ciclo no crucen ningún texto
  const bw = Math.min(250 * u, S.portrait ? r.w - 24 * u : r.w * 0.42), bh = 58 * u;
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: r.x + (r.w - bw) / 2 - 8 * u, y: r.y + 14 * u + i * (bh + (r.h - 4 * bh - 28 * u) / 3), w: bw, h: bh }))
    : [{ x: r.x + r.w * 0.5 - bw - 36 * u, y: r.y + r.h * 0.16, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 36 * u, y: r.y + r.h * 0.16, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 36 * u, y: r.y + r.h * 0.56, w: bw, h: bh }, { x: r.x + r.w * 0.5 - bw - 36 * u, y: r.y + r.h * 0.56, w: bw, h: bh }];
  const hot = Math.floor(S.clock / 1.2) % 4;
  pos.forEach((b, i) => {
    const a = S.reveal('loop', 0.2 + i * 0.4, 0.5); if (a <= 0.01) return;
    const t = tone(S, items[i].t);
    d.withAlpha(a, () => {
      d.rect(b.x, b.y, b.w, b.h, { fill: alpha(t.c, 0.1 + 0.28 * (i === hot ? 1 : 0)), stroke: t.c, lw: 1.5, r: 3 });
      d.text(items[i].l, b.x + b.w / 2, b.y + b.h * 0.34, { size: fz(S, 14.5), weight: 700, color: t.ink, align: 'center', base: 'middle', w: b.w - 12 * u });
      d.text(items[i].s, b.x + b.w / 2, b.y + b.h * 0.72, { size: fz(S, 12.5), weight: 500, color: p.ink2, align: 'center', base: 'middle', w: b.w - 12 * u });
    });
  });
  for (let i = 0; i < 3; i++) { const a = S.at('loop', 0.7 + i * 0.4, 1.2 + i * 0.4); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  const aLoop = S.at('loop', 2.0, 2.8);
  if (aLoop > 0) {
    if (S.portrait) {
      const x1 = pos[3].x + pos[3].w, x2 = x1 + 16 * u, ya = pos[3].y + pos[3].h / 2, yb = pos[0].y + pos[0].h / 2;
      d.polyline([[x1, ya], [x2, ya], [x2, yb + (ya - yb) * (1 - aLoop)]], tone(S, 'ink').c, 2);
      if (aLoop > 0.98) d.arrow(x2, yb, x1 + 1, yb, tone(S, 'ink').c, 2, 8);
    } else link(S, pos[3], pos[0], { tone: 'ink', progress: aLoop });
  }
  // «calcula» frente a «corrige»
  const ta = S.reveal('loop', 3.2, 0.5);
  d.withAlpha(ta, () => {
    badge(S, S.l('calcula', 'computes'), pos[2].x + pos[2].w - 8 * u, pos[2].y - 2 * u, { tone: 'err', align: 'right' });
    badge(S, S.l('corrige', 'corrects'), pos[3].x + pos[3].w - 8 * u, pos[3].y - 2 * u, { tone: 'w', align: 'right' });
  });
}

// Línea de tiempo con lo que se verificó (ver docs/v2/verificacion/backpropagation.md):
//  1970 Linnainmaa (Griewank 2012) · 1974 Werbos, tesis (Werbos 2006; thesis) · 1981 Werbos propone aplicarlo a redes (Goodfellow et al. 2016)
//  1986 Rumelhart, Hinton y Williams (Nature; reconocen a Parker y LeCun)
function drawHistory(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const ev = [
    { y: '1970', who: 'Seppo Linnainmaa', what: S.l('Tesis de maestría (Helsinki) sobre errores de redondeo: el cálculo hacia atrás', 'Master’s thesis (Helsinki) on rounding errors: the backward computation'), a: S.reveal('history-a', 0.4, 0.6), t: 'dat' as const },
    { y: '1974', who: 'Paul Werbos', what: S.l('Tesis doctoral (Harvard): derivadas calculadas hacia atrás para modelos de predicción', 'PhD thesis (Harvard): derivatives computed backward for prediction models'), a: S.reveal('history-a', 1.2, 0.6), t: 'w' as const },
    { y: '1981', who: 'Paul Werbos', what: S.l('Propone aplicarlo a entrenar redes neuronales', 'Proposes applying it to training neural networks'), a: S.reveal('history-a', 2.0, 0.6), t: 'w' as const },
    { y: '1986', who: 'Rumelhart, Hinton, Williams', what: S.l('Nature: las capas ocultas aprenden representaciones internas', 'Nature: hidden layers learn internal representations'), a: S.reveal('history-b', 0.4, 0.6), t: 'err' as const },
  ];
  const also = S.reveal('history-b', 1.4, 0.6);
  const alsoTxt = S.l('También, por su cuenta: Parker y LeCun', 'Also, independently: Parker and LeCun');
  const sz = fz(S, 13);
  if (S.portrait) {
    const x0 = r.x + 44 * u, y0 = r.y + 26 * u, step = Math.min(118 * u, (r.h - 56 * u) / 3);
    d.line(x0, y0, x0, y0 + step * 3, p.lineStrong, 2);
    ev.forEach((e, i) => {
      const yy = y0 + i * step;
      d.withAlpha(e.a, () => {
        d.circle(x0, yy, 7 * u, { fill: tone(S, e.t).c, stroke: p.stage, lw: 2 });
        d.text(e.y, x0 - 18 * u, yy - 16 * u, { size: fz(S, 17), weight: 800, font: 'mono', color: tone(S, e.t).ink, align: 'left', base: 'middle' });
        d.text(e.who, x0 + 18 * u, yy - 2 * u, { size: sz, weight: 800, color: p.ink, base: 'middle', w: r.w - 76 * u });
        d.text(e.what, x0 + 18 * u, yy + 12 * u, { size: fz(S, 12.5), weight: 500, color: p.ink2, base: 'top', w: r.w - 76 * u, lh: 1.25 });
      });
    });
    d.withAlpha(also, () => d.text(alsoTxt, x0 + 18 * u, y0 + 3 * step + 66 * u, { size: fz(S, 12.5), weight: 700, color: tone(S, 'err').ink, base: 'middle', w: r.w - 76 * u }));
  } else {
    const cw = r.w / 4, ly = r.y + r.h * 0.34;
    d.line(r.x + 16 * u, ly, r.x + r.w - 16 * u, ly, p.lineStrong, 2);
    ev.forEach((e, i) => {
      const cx = r.x + i * cw + cw / 2;
      d.withAlpha(e.a, () => {
        d.circle(cx, ly, 8 * u, { fill: tone(S, e.t).c, stroke: p.stage, lw: 2 });
        d.text(e.y, cx, ly - 32 * u, { size: fz(S, 22), weight: 800, font: 'mono', color: tone(S, e.t).ink, align: 'center', base: 'middle' });
        const whoLines = d.measure(e.who, { size: fz(S, 13.5), weight: 800 }) > cw - 14 * u ? 2 : 1;
        d.text(e.who, cx, ly + 28 * u + (whoLines - 1) * 8 * u, { size: fz(S, 13.5), weight: 800, color: p.ink, align: 'center', base: 'middle', w: cw - 14 * u, lh: 1.2 });
        d.text(e.what, cx, ly + 50 * u + (whoLines - 1) * 20 * u, { size: fz(S, 12.5), weight: 500, color: p.ink2, align: 'center', base: 'top', w: cw - 22 * u, lh: 1.3 });
      });
    });
    const cx = r.x + 3 * cw + cw / 2;
    d.withAlpha(also, () => d.text(alsoTxt, cx, ly + 128 * u, { size: fz(S, 12.5), weight: 700, color: tone(S, 'err').ink, align: 'center', base: 'top', w: cw - 14 * u, lh: 1.25 }));
  }
}

// Lo que el pase hacia atrás necesita haber guardado: los valores reales de esta red (math.ts)
function drawMemory(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), er = tone(S, 'err');
  const sz = fz(S, 12.5);
  const names = [S.l('entradas', 'inputs'), S.l('ocultas', 'hidden'), S.l('salida', 'output')];
  const vals = [[num(S, X[0], 1), num(S, X[1], 1)], [num(S, F0.a1, 3), num(S, F0.a2, 3)], [num(S, F0.y, 3)]];
  const bw = Math.min(100 * u, (r.w - 40 * u) / 3.4), bh = 40 * u, gap = (r.w - 3 * bw) / 2;
  const cy = r.y + r.h * 0.2;
  const fwd = S.at('limit-memory', 0.2, 2.2, 'lin'), bwd = S.at('limit-memory', 2.4, 4.4, 'lin');
  names.forEach((n, i) => {
    const x = r.x + i * (bw + gap), fa = clamp(fwd * 3 - i);
    d.rect(x, cy - bh / 2, bw, bh, { fill: alpha(sg.c, 0.08 + 0.2 * fa), stroke: sg.c, lw: 1.6, r: 3 });
    d.text(n, x + bw / 2, cy, { size: fz(S, 13.5), weight: 700, color: sg.ink, align: 'center', base: 'middle' });
    // los números que quedan guardados tras el pase hacia delante
    const sx = x + bw / 2, sy = cy + bh / 2 + 16 * u;
    d.withAlpha(clamp(fa * 2), () => {
      const row = 17 * u, hh = vals[i].length * row + 8 * u;
      d.rect(sx - bw / 2, sy, bw, hh, { fill: alpha(sg.c, 0.1), stroke: sg.c, lw: 1, r: 2, dash: [3, 2] });
      vals[i].forEach((v, k) => d.text(v, sx, sy + 4 * u + row * (k + 0.5) + 0.5, { size: fz(S, 12.5), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' }));
      d.text(S.l('guardado', 'stored'), sx, sy + 2 * row + 8 * u + 12 * u, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle' });
    });
    if (i < 2) { const x1 = x + bw + 3 * u, x2 = x + bw + gap - 3 * u; d.arrow(x1, cy, x1 + (x2 - x1) * clamp(fwd * 3 - i - 0.5), cy, sg.c, 2, 8, clamp(fwd * 3 - i)); }
  });
  d.text(S.l('hacia delante: guarda', 'forward: store'), r.x, r.y + 6 * u, { size: sz, weight: 700, color: sg.ink, base: 'top' });
  // el viaje de vuelta lee lo guardado
  const by = cy + bh / 2 + 16 * u + 2 * 17 * u + 8 * u + 12 * u + 40 * u;
  d.withAlpha(bwd > 0 ? 1 : 0, () => {
    const x1 = r.x + r.w - bw / 2, x2 = r.x + bw / 2, xc = lerp(x1, x2, bwd);
    d.arrow(x1, by, xc, by, er.c, 3, 10);
    d.text(S.l('hacia atrás: lee lo guardado para calcular cada culpa', 'backward: reads what was stored to compute each blame'), r.x + r.w / 2, by + 16 * u, { size: sz, weight: 700, color: er.ink, align: 'center', base: 'top', w: r.w - 10 * u });
    rich(S, r.x + r.w / 2, by + 64 * u, [['δ₁ = δ_y · w₅ · ', 'ink2'], ['a₁', 'sig', true], ['(1 − ', 'ink2'], ['a₁', 'sig', true], [')', 'ink2']], { align: 'center', maxW: r.w - 10 * u, a: S.at('limit-memory', 3.2, 4.2) });
  });
  d.withAlpha(S.reveal('limit-memory', 5.0, 0.6), () => d.text(S.l('una razón de que entrenar gaste más memoria que usar el modelo', 'one reason training uses more memory than using the model'), r.x + r.w / 2, r.y + r.h - 30 * u, { size: fz(S, 13), weight: 700, color: p.ink, align: 'center', base: 'top', w: r.w - 10 * u, lh: 1.2 }));
}

function drawFade(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, er = tone(S, 'err'), dt = tone(S, 'dat');
  const sz = fz(S, 12.5);
  const top: Rect = { x: r.x, y: r.y, w: r.w, h: r.h * 0.44 }, bot: Rect = { x: r.x, y: r.y + r.h * 0.5, w: r.w, h: r.h * 0.5 };
  // 1 · la culpa en esta red: cae al cruzar una capa
  const bars1 = [{ l: 'δ_y', v: Math.abs(B0.dY), n: S.l('salida', 'output') }, { l: 'δ₁', v: Math.abs(B0.d1), n: S.l('oculta 1', 'hidden 1') }, { l: 'δ₂', v: Math.abs(B0.d2), n: S.l('oculta 2', 'hidden 2') }];
  d.text(S.l('la culpa en esta red, en valor absoluto', 'the blame in this network, absolute value'), top.x, top.y + 4 * u, { size: sz, weight: 700, color: p.ink2, base: 'top', w: top.w });
  const lw = 84 * u, mx = 0.15, barH = Math.min(22 * u, (top.h - 30 * u) / 3 - 6 * u);
  bars1.forEach((b, i) => {
    const yy = top.y + 34 * u + i * (barH + 8 * u), a = S.reveal('limit-fade', 0.3 + 0.5 * i, 0.5);
    d.withAlpha(a, () => {
      d.text(b.l + ' ' + b.n, top.x, yy + barH / 2, { size: sz, weight: 600, font: 'mono', color: p.ink2, base: 'middle' });
      const bx = top.x + lw + 20 * u, full = top.w - lw - 20 * u - 54 * u;
      d.rect(bx, yy, Math.max(2, (full * b.v) / mx * a), barH, { fill: alpha(er.c, 0.8) });
      d.text(num(S, b.v, 3), bx + (full * b.v) / mx * a + 6 * u, yy + barH / 2, { size: sz, weight: 700, font: 'mono', color: er.ink, base: 'middle' });
    });
  });
  // 2 · el factor máximo que aportan n sigmoides
  d.withAlpha(S.reveal('limit-fade', 1.8, 0.6), () => {
    d.text(S.l('factor de las pendientes de n sigmoides: a lo sumo ¼ⁿ', 'factor from the slopes of n sigmoids: at most ¼ⁿ'), bot.x, bot.y + 4 * u, { size: sz, weight: 700, color: p.ink2, base: 'top', w: bot.w, lh: 1.25 });
  });
  const ns = [1, 2, 4, 6], digits = [2, 4, 4, 5];
  const bw = (bot.w - 3 * 10 * u) / 4, base = bot.y + bot.h - 22 * u, maxH = bot.h - 74 * u;
  ns.forEach((n, i) => {
    const v = Math.pow(0.25, n), a = S.reveal('limit-fade', 2.4 + 0.45 * i, 0.5), x = bot.x + i * (bw + 10 * u), h = Math.max(2, maxH * v / 0.25);
    d.withAlpha(a, () => {
      d.rect(x, base - h * a, bw, h * a, { fill: alpha(dt.c, 0.7) });
      d.text(num(S, v, digits[i]), x + bw / 2, base - h * a - 8 * u, { size: fz(S, 12), weight: 700, font: 'mono', color: dt.ink, align: 'center', base: 'middle' });
      d.text(n + ' ' + (n === 1 ? S.l('capa', 'layer') : S.l('capas', 'layers')), x + bw / 2, base + 12 * u, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle' });
    });
  });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 90 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 36 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Entrenar bien: lotes, épocas y optimizadores', 'Training well: batches, epochs, and optimizers'), cx, cy + 62 * u, { size: 22, weight: 800, align: 'center', w: S.W - 48 * u, lh: 1.2 });
  });
}

export default scene;
void layoutNet; void LAYERS; void W_MAX; void numGrad;
