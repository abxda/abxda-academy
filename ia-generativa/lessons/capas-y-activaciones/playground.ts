// Parte 5: el «patio de juegos». Una MLP real (mlp.ts) que se entrena en el navegador, en `update`, a un ritmo por tiempo
// (nunca más de ~8 ms de entrenamiento por fotograma). Hay tres modos:
//   · demos de la voz: una o dos redes con receta fija, cuyo número de pasos es función del tiempo del segmento
//     (así la imagen sigue a la narración y se puede saltar a cualquier paso);
//   · turno 1 (círculos) y turno 2 (espiral): la red de la persona, según los controles.
import { Plot, alpha, badge, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { drawBoundary, drawFrame, drawLegend, drawPoints, drawRegion, fieldPlot, revealOrder } from './field';
import {
  collapseLinear, evaluate, gridOf, makeData, makeNet, paramCount, sizesOf, trainSteps,
  type Act, type DataId, type Net, type Pt,
} from './mlp';
import { check, fs, nf, pct, ph, sn } from './shared';

// ── datos (se generan una sola vez) ───────────────────────────────────────────────────────────────
const DATA: Partial<Record<DataId, { pts: Pt[]; order: number[] }>> = {};
const dataOf = (id: DataId) => (DATA[id] ??= (() => { const pts = makeData(id); return { pts, order: revealOrder(pts.length) }; })());

// ── paneles (red + datos + rejilla de la región + historial) ─────────────────────────────────────
export interface Spec { data: DataId; hidden: number; width: number; act: Act; seed: number }
export interface Panel { spec: Spec; net: Net; pts: Pt[]; grid: Float32Array; n: number; steps: number; hist: [number, number][]; acc: number; loss: number; params: number; fused: [number, number, number] | null }

const LR = 0.03;

export function newPanel(spec: Spec, n: number): Panel {
  const net = makeNet(spec.hidden, spec.width, spec.act, spec.seed), pts = dataOf(spec.data).pts;
  evaluate(net, pts);
  const p: Panel = { spec, net, pts, grid: gridOf(net, n), n, steps: 0, hist: [[0, net.loss]], acc: net.acc, loss: net.loss, params: paramCount(net.sizes), fused: null };
  p.fused = fusedOf(p);
  return p;
}
const fusedOf = (p: Panel) => (p.spec.hidden === 0 || p.spec.act === 'linear' ? collapseLinear(p.net) : null);

export function advance(p: Panel, k: number) {
  if (k <= 0) return;
  p.steps += trainSteps(p.net, p.pts, k, LR);
  evaluate(p.net, p.pts);
  gridOf(p.net, p.n, p.grid);
  p.acc = p.net.acc; p.loss = p.net.loss; p.fused = fusedOf(p);
  p.hist.push([p.steps, p.loss]);
  if (p.hist.length > 520) p.hist = p.hist.filter((_, i) => i % 2 === 0 || i === p.hist.length - 1);
}

/** Pasos que lleva una demo a los t segundos de su segmento: arranca despacio y se acelera (para ver cómo se forma la región). */
const DEMO_CAP = 1500;
export const stepsAt = (t: number) => Math.min(DEMO_CAP, Math.max(0, Math.floor(15 * (Math.exp(0.9 * Math.max(0, t)) - 1))));

// ── recetas de las demos ──────────────────────────────────────────────────────────────────────────
interface Demo extends Spec { from: string; to: string; train: boolean; n: number }
const DEMOS: Record<string, Demo> = {
  intro: { data: 'circles', hidden: 1, width: 6, act: 'relu', seed: 2, from: 'pg-intro', to: 'pg-one', train: false, n: 40 },
  one: { data: 'circles', hidden: 0, width: 1, act: 'relu', seed: 1, from: 'pg-one', to: 'pg-linear', train: true, n: 40 },
  lin: { data: 'circles', hidden: 3, width: 6, act: 'linear', seed: 2, from: 'pg-linear', to: 'pg-relu', train: true, n: 40 },
  relu6: { data: 'circles', hidden: 1, width: 6, act: 'relu', seed: 2, from: 'pg-relu', to: 'try2', train: true, n: 40 },
  'sh-relu': { data: 'circles', hidden: 1, width: 6, act: 'relu', seed: 2, from: 'shapes', to: 'spiral-intro', train: true, n: 30 },
  'sh-tanh': { data: 'circles', hidden: 1, width: 6, act: 'tanh', seed: 8, from: 'shapes', to: 'spiral-intro', train: true, n: 30 },
  'sp-1': { data: 'spiral', hidden: 1, width: 8, act: 'tanh', seed: 3, from: 'spiral-intro', to: 'try3', train: true, n: 30 },
  'sp-3': { data: 'spiral', hidden: 3, width: 8, act: 'tanh', seed: 1, from: 'spiral-intro', to: 'try3', train: true, n: 30 },
};

// ── la red de la persona ──────────────────────────────────────────────────────────────────────────
export type Gate = 'B' | 'C';
const PFX: Record<Gate, string> = { B: 'b-', C: 'c-' };
const GOAL: Record<Gate, number> = { B: 0.95, C: 0.9 };
const LIVE_CAP = 6000;
const ACTS: Act[] = ['linear', 'relu', 'tanh', 'sigmoid'];

interface PG { demos: Record<string, Panel>; live: Partial<Record<Gate, Panel>>; key: Partial<Record<Gate, string>>; bump: Record<Gate, number>; acc: Partial<Record<Gate, number>>; run: Partial<Record<Gate, number>>; cap: number }
const pgOf = (S: Frame): PG => (S.st.pg ??= { demos: {}, live: {}, key: {}, bump: { B: 0, C: 0 }, acc: {}, run: {}, cap: 40 } as PG);
/** Pasos máximos por fotograma de las demos de la voz (al saltar a mitad de un segmento se pone al día en pocos fotogramas). */
const DEMO_FRAME_CAP = 300;

const cfgOf = (S: Frame, g: Gate) => {
  const pf = PFX[g];
  const hidden = Math.round(clamp(S.p[`${pf}layers`] ?? 1, 0, 4)), width = Math.round(clamp(S.p[`${pf}width`] ?? 6, 1, 8));
  const act = (ACTS.includes(S.p[`${pf}act`]) ? S.p[`${pf}act`] : 'relu') as Act;
  return { hidden, width, act };
};
export const seedFor = (g: Gate, hidden: number, width: number, act: Act, bump: number) => (g === 'B' ? 1000 : 2000) + hidden * 97 + width * 13 + ACTS.indexOf(act) * 7 + bump * 1009;

export function liveSpec(S: Frame, g: Gate): Spec {
  const c = cfgOf(S, g), pg = pgOf(S);
  return { data: g === 'B' ? 'circles' : 'spiral', hidden: c.hidden, width: c.width, act: c.act, seed: seedFor(g, c.hidden, c.width, c.act, pg.bump[g]) };
}

export function pgAction(S: Frame, id: string) {
  const pg = pgOf(S);
  if (id === 'b-reset') { pg.bump.B++; pg.key.B = undefined; }
  if (id === 'c-reset') { pg.bump.C++; pg.key.C = undefined; }
}

/** Avanza las redes. Devuelve qué turnos están logrados ahora mismo (la escena libera los gates). */
export function pgUpdate(S: Frame): { B: boolean; C: boolean } {
  const pg = pgOf(S), won = { B: false, C: false };
  // 1) demos de la voz: los pasos dependen del tiempo del segmento
  for (const [k, dm] of Object.entries(DEMOS)) {
    if (!S.between(dm.from, dm.to)) continue;
    let p = pg.demos[k];
    if (!p) p = pg.demos[k] = newPanel(dm, dm.n);
    const target = dm.train ? stepsAt(S.since(dm.from) - 0.8) : 0;
    if (p.steps > target) p = pg.demos[k] = newPanel(dm, dm.n);       // se retrocedió dentro del segmento
    if (p.steps < target) advance(p, Math.min(target - p.steps, DEMO_FRAME_CAP));
  }
  // 2) las redes de los turnos
  for (const [g, from, to] of [['B', 'try2', 'shapes'], ['C', 'try3', 'recap']] as [Gate, string, string][]) {
    if (!S.between(from, to)) continue;
    const spec = liveSpec(S, g), key = `${spec.data}|${spec.hidden}|${spec.width}|${spec.act}|${spec.seed}`;
    let p = pg.live[g];
    if (!p || pg.key[g] !== key) { p = pg.live[g] = newPanel(spec, 40); pg.key[g] = key; pg.run[g] = 0; }
    const training = S.p[`${PFX[g]}train`] !== false;
    if (training && p.steps < LIVE_CAP) {
      const rate = S.reduced ? 3000 : 13.5 + 0.9 * p.steps;          // pasos por segundo (dt acotado a 0,05 s por el reproductor)
      pg.run[g] = (pg.run[g] ?? 0) + rate * S.dt;
      // presupuesto por fotograma: baja si el fotograma anterior fue lento (dt grande) y sube si fue holgado; no se lee el reloj
      pg.cap = S.dt > 0.034 ? Math.max(4, Math.floor(pg.cap * 0.7)) : S.dt < 0.022 ? Math.min(40, pg.cap + 1) : pg.cap;
      const k = Math.min(Math.floor(pg.run[g]!), pg.cap);
      if (k >= 1) { advance(p, k); pg.run[g]! -= k; if (pg.run[g]! > pg.cap) pg.run[g] = 0; }
    }
    if (p.steps >= 12 && p.acc >= GOAL[g]) won[g] = true;
  }
  return won;
}

// ═════════════════════════════════════════════════════════════════════════
// Dibujo
// ═════════════════════════════════════════════════════════════════════════
type Mode = { kind: 'single'; key: string; seg: string } | { kind: 'duo'; keys: [string, string]; seg: string } | { kind: 'live'; gate: Gate; seg: string };
function modeOf(S: Frame): Mode {
  if (S.on('try3')) return { kind: 'live', gate: 'C', seg: 'try3' };
  if (S.on('spiral-intro')) return { kind: 'duo', keys: ['sp-1', 'sp-3'], seg: 'spiral-intro' };
  if (S.on('shapes')) return { kind: 'duo', keys: ['sh-relu', 'sh-tanh'], seg: 'shapes' };
  if (S.on('try2')) return { kind: 'live', gate: 'B', seg: 'try2' };
  if (S.on('pg-relu')) return { kind: 'single', key: 'relu6', seg: 'pg-relu' };
  if (S.on('pg-linear')) return { kind: 'single', key: 'lin', seg: 'pg-linear' };
  if (S.on('pg-one')) return { kind: 'single', key: 'one', seg: 'pg-one' };
  return { kind: 'single', key: 'intro', seg: 'pg-intro' };
}

const actName = (S: Frame, a: Act) => (a === 'relu' ? 'ReLU' : a === 'tanh' ? 'tanh' : a === 'sigmoid' ? S.l('sigmoide', 'sigmoid') : S.l('lineal', 'linear'));
function describe(S: Frame, s: Spec): string {
  if (s.hidden === 0) return S.l('1 neurona · sin capas ocultas', '1 neuron · no hidden layers');
  return S.l(`${s.hidden} ${s.hidden === 1 ? 'capa oculta' : 'capas ocultas'} × ${s.width} · ${actName(S, s.act)}`, `${s.hidden} hidden ${s.hidden === 1 ? 'layer' : 'layers'} × ${s.width} · ${actName(S, s.act)}`);
}

export function drawPlayground(S: Frame, all: Rect) {
  const pg = pgOf(S), mode = modeOf(S), a = S.at(mode.seg, 0, 0.5, 'out');
  const intro = S.reveal('pg-intro', 0, 0.6);
  S.d.withAlpha(Math.min(a, 1) * intro, () => {
    if (mode.kind === 'duo') drawDuo(S, all, mode, [pg.demos[mode.keys[0]], pg.demos[mode.keys[1]]]);
    else {
      const p = mode.kind === 'single' ? pg.demos[mode.key] : pg.live[mode.gate];
      if (p) drawSingle(S, all, p, mode);
    }
  });
}

// ── una red grande: plano cuadrado + lecturas ─────────────────────────────────────────────────────
function drawSingle(S: Frame, all: Rect, p: Panel, mode: Mode) {
  const { d, pal: pl } = S, u = S.u, gap = 14 * u;
  let plotR: Rect, asideR: Rect;
  if (!S.portrait) {
    const side = Math.min(all.h, all.w * 0.58);
    plotR = { x: all.x, y: all.y + (all.h - side) / 2, w: side, h: side };
    const ax = plotR.x + side + gap * 1.5;
    asideR = { x: ax, y: all.y, w: all.x + all.w - ax, h: all.h };
  } else {
    const side = Math.min(all.w, all.h * 0.56);
    plotR = { x: all.x + (all.w - side) / 2, y: all.y, w: side, h: side };
    asideR = { x: all.x, y: all.y + side + gap * 0.8, w: all.w, h: all.h - side - gap * 0.8 };
  }
  const plot = fieldPlot(S, plotR), D = dataOf(p.spec.data);
  const intro = mode.kind === 'single' && mode.key === 'intro';
  // el plano aparece con los puntos; en el primer segmento, la región llega después
  const pts = intro ? ph(S, 'pg-intro', 0.12, 0.35, 'lin') : 1, reg = intro ? ph(S, 'pg-intro', 0.42, 0.62, 'out') : 1;
  drawFrame(S, plot);
  if (reg > 0) { drawRegion(S, plot, p.grid, p.n, reg); drawBoundary(S, plot, p.grid, p.n, reg); }
  drawPoints(S, plot, D.pts, { frac: pts, order: D.order });
  if (!intro || reg > 0) drawLegend(S, plot, intro ? ph(S, 'pg-intro', 0.5, 0.7, 'out') : 1);
  else drawLegend(S, plot, ph(S, 'pg-intro', 0.2, 0.4, 'out'));

  // lecturas
  drawAside(S, asideR, p, mode.kind === 'live' ? mode.gate : null, intro ? reg : 1);
  void pl; void d;
}

function drawAside(S: Frame, r: Rect, p: Panel, gate: Gate | null, a: number) {
  const { d, pal: pl } = S, u = S.u, er = tone(S, 'err'), dt = tone(S, 'dat'), wt = tone(S, 'w');
  const wide = r.w >= r.h * 1.5;
  const goal = gate ? GOAL[gate] : null, ok = goal !== null && p.acc >= goal;
  // reparto
  const roH = 54 * u;
  const ro: Rect = { x: r.x, y: r.y, w: r.w, h: roH };
  let loss: Rect, net: Rect, st: Rect;
  if (wide) { const w3 = (r.w - 2 * 12 * u) / 3, y = r.y + roH + 8 * u, h = r.h - roH - 8 * u; loss = { x: r.x, y, w: w3, h }; net = { x: r.x + w3 + 12 * u, y, w: w3, h }; st = { x: r.x + 2 * (w3 + 12 * u), y, w: w3, h }; }
  else if (S.portrait) { const y = r.y + roH + 6 * u, h = Math.max(70 * u, r.h - roH - 6 * u - 50 * u); loss = { x: r.x, y, w: r.w * 0.48, h }; net = { x: r.x + r.w * 0.52, y, w: r.w * 0.48, h }; st = { x: r.x, y: y + h + 6 * u, w: r.w, h: 44 * u }; }
  else { const h1 = Math.max(80 * u, r.h * 0.2), h2 = Math.max(100 * u, r.h * 0.3); loss = { x: r.x, y: r.y + roH + 10 * u, w: r.w, h: h1 }; net = { x: r.x, y: loss.y + h1 + 14 * u, w: r.w, h: h2 }; st = { x: r.x, y: net.y + h2 + 10 * u, w: r.w, h: r.y + r.h - (net.y + h2 + 10 * u) }; }

  d.withAlpha(a, () => {
    // lecturas
    const items: { l: string; v: string; t: 'ink' | 'err' | 'dat' }[] = [
      { l: S.l('pasos', 'steps'), v: String(p.steps), t: 'ink' },
      { l: S.l('pérdida', 'loss'), v: nf(S, p.loss, 2), t: 'err' },
      { l: S.l('aciertos', 'accuracy'), v: pct(S, p.acc), t: ok ? 'dat' : 'ink' },
    ];
    const cw = r.w / 3;
    items.forEach((it, i) => {
      d.text(it.l, r.x + i * cw, r.y + 10 * u, { size: fs(S, 12), weight: 700, color: pl.mute, base: 'middle' });
      d.text(it.v, r.x + i * cw, r.y + 34 * u, { size: fs(S, 22), weight: 700, font: 'mono', color: it.t === 'ink' ? pl.ink : tone(S, it.t).ink, base: 'middle' });
    });
    if (goal !== null) {
      const gt = S.l(`meta ${pct(S, goal)}`, `goal ${pct(S, goal)}`), gw = d.measure(gt, { size: fs(S, 12), weight: 700 });
      d.text(gt, r.x + 2 * cw, r.y + 51 * u, { size: fs(S, 12), weight: 700, color: ok ? dt.ink : pl.mute, base: 'middle' });
      if (ok) check(S, r.x + 2 * cw + gw + 14 * u, r.y + 51 * u, 11 * u, dt.c);
    }
    // curva de la pérdida
    drawLoss(S, loss, [p]);
    // red
    drawMiniNet(S, net, p);
    // pie: configuración, parámetros, equivalencia lineal, consejo
    const lines: { t: string; c: string; w?: number }[] = [{ t: describe(S, p.spec), c: pl.ink, w: 700 }];
    lines.push({ t: S.l(`${p.params} parámetros`, `${p.params} parameters`), c: pl.mute });
    if (p.fused) {
      const w = `w = (${sn(S, p.fused[0], 2)}; ${sn(S, p.fused[1], 2)}), b = ${sn(S, p.fused[2], 2)}`, we = `w = (${sn(S, p.fused[0], 2)}, ${sn(S, p.fused[1], 2)}), b = ${sn(S, p.fused[2], 2)}`;
      lines.push({ t: p.spec.hidden === 0 ? S.l(`su recta: ${w}`, `its line: ${we}`) : S.l(`equivale a 1 neurona: ${w}`, `equals 1 neuron: ${we}`), c: wt.ink, w: 700 });
    }
    if (gate) {
      if (ok) lines.push({ t: S.l('Separado.', 'Separated.'), c: dt.ink, w: 700 });
      else if (p.steps >= 700) lines.push({ t: S.l(`Se estancó en ${pct(S, p.acc)}: prueba otra activación, más neuronas o «Reiniciar».`, `Stuck at ${pct(S, p.acc)}: try another activation, more neurons, or “Reset”.`), c: er.ink, w: 600 });
    }
    let y = st.y + 10 * u;
    for (const ln of lines) { const o = d.text(ln.t, st.x, y, { size: fs(S, 13), weight: ln.w ?? 500, color: ln.c, base: 'middle', w: st.w }); y += Math.max(o.h, 18 * u) + 3 * u; if (y > st.y + st.h + 30 * u) break; }
  });
}

/** Curva de pérdida de uno o dos paneles (el segundo, punteado). */
function drawLoss(S: Frame, r: Rect, ps: Panel[]) {
  const { d, pal: pl } = S, u = S.u, er = tone(S, 'err');
  d.text(S.l('pérdida', 'loss'), r.x, r.y + 8 * u, { size: fs(S, 12), weight: 700, color: pl.mute, base: 'middle' });
  const pr: Rect = { x: r.x + 4 * u, y: r.y + 20 * u, w: r.w - 8 * u, h: Math.max(30, r.h - 26 * u) };
  const xmax = Math.max(120, ...ps.map((p) => p.steps)), plot = new Plot(S, pr, { xr: [0, xmax], yr: [0, 0.85], pad: { l: 0, r: 0, t: 0, b: 0 } });
  d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, pl.lineStrong, 1.2);
  d.line(pr.x, pr.y, pr.x, pr.y + pr.h, pl.line, 1);
  ps.forEach((p, i) => {
    const pts: [number, number][] = p.hist.map(([s, l]) => [plot.X(s), plot.Y(Math.min(0.85, l))]);
    d.polyline(pts, er.c, 2.2, { dash: i === 1 ? [5, 4] : undefined });
    const last = pts[pts.length - 1];
    if (last) d.circle(last[0], last[1], 3 * u, { fill: er.c });
  });
}

/** La red como dibujo compacto: nodos pequeños y aristas finas (grosor = magnitud; punteado = negativo). */
function drawMiniNet(S: Frame, r: Rect, p: Panel) {
  const { d, pal: pl } = S, u = S.u, wt = tone(S, 'w'), sg = tone(S, 'sig');
  const sizes = p.net.sizes, L = sizes.length, maxN = Math.max(...sizes);
  const pad = 6 * u, x0 = r.x + pad, x1 = r.x + r.w - pad, y0 = r.y + pad, y1 = r.y + r.h - pad;
  const rad = Math.max(2.4, Math.min(5 * u, (y1 - y0) / (maxN * 2.6)));
  const X = (l: number) => (L === 1 ? (x0 + x1) / 2 : x0 + (l * (x1 - x0)) / (L - 1));
  const Y = (l: number, i: number) => (y0 + y1) / 2 + (i - (sizes[l] - 1) / 2) * Math.min((y1 - y0 - 2 * rad) / Math.max(1, sizes[l] - 1), rad * 3.2);
  let mx = 1e-6; for (const W of p.net.W) for (const w of W) mx = Math.max(mx, Math.abs(w));
  for (let l = 0; l < L - 1; l++) {
    const W = p.net.W[l];
    for (let j = 0; j < sizes[l + 1]; j++) for (let i = 0; i < sizes[l]; i++) {
      const w = W[j * sizes[l] + i], m = Math.abs(w) / mx;
      d.line(X(l), Y(l, i), X(l + 1), Y(l + 1, j), alpha(wt.c, 0.18 + 0.7 * m), 0.6 + 1.6 * m, w < 0 ? [3, 3] : undefined);
    }
  }
  for (let l = 0; l < L; l++) for (let i = 0; i < sizes[l]; i++) d.circle(X(l), Y(l, i), rad, { fill: pl.surface, stroke: l === L - 1 ? tone(S, 'dat').c : sg.c, lw: 1.4 });
  void lerp; void badge;
}

// ── dos redes lado a lado ─────────────────────────────────────────────────────────────────────────
function drawDuo(S: Frame, all: Rect, mode: Extract<Mode, { kind: 'duo' }>, ps: [Panel | undefined, Panel | undefined]) {
  const { d, pal: pl } = S, u = S.u, gap = 14 * u, dt = tone(S, 'dat');
  if (!ps[0] || !ps[1]) return;
  let side: number, x0: number, y0: number, curves: Rect;
  const titleH = 62 * u;
  if (!S.portrait) {
    side = Math.min((all.w * 0.76 - gap) / 2, all.h - titleH);
    x0 = all.x; y0 = all.y + Math.max(0, (all.h - side - titleH) / 2);
    const cx = x0 + 2 * side + gap + 18 * u;
    curves = { x: cx, y: all.y + 4 * u, w: all.x + all.w - cx, h: Math.min(all.h * 0.5, 190 * u) };
  } else {
    side = (all.w - gap) / 2; x0 = all.x; y0 = all.y;
    const cy = y0 + side + titleH + 8 * u;
    curves = { x: all.x, y: cy, w: all.w, h: all.y + all.h - cy };
  }
  ps.forEach((p, i) => {
    const R_: Rect = { x: x0 + i * (side + gap), y: y0, w: side, h: side }, plot = fieldPlot(S, R_), D = dataOf(p!.spec.data);
    drawFrame(S, plot); drawRegion(S, plot, p!.grid, p!.n); drawBoundary(S, plot, p!.grid, p!.n);
    drawPoints(S, plot, D.pts, { r: Math.max(2.4, side / 90) });
    const tx = R_.x + 2 * u, ty = R_.y + side + 12 * u, ok = p!.acc >= 0.95;
    d.text(`${'AB'[i]} · ${describe(S, p!.spec)}`, tx, ty, { size: fs(S, 13), weight: 800, color: pl.ink, base: 'middle', w: side });
    const pv = pct(S, p!.acc), py = ty + 30 * u + (S.portrait ? 12 * u : 0), pw = d.measure(pv, { size: fs(S, 22), weight: 700, font: 'mono' });
    d.text(pv, tx, py, { size: fs(S, 22), weight: 700, font: 'mono', color: ok ? dt.ink : pl.ink, base: 'middle' });
    d.text(S.l('aciertos', 'accuracy'), tx + pw + 8 * u, py + u, { size: fs(S, 12), weight: 600, color: pl.mute, base: 'middle' });
  });
  drawLoss(S, curves, [ps[0], ps[1]]);
  const ky = curves.y + curves.h + 6 * u;
  d.line(curves.x + 4 * u, ky, curves.x + 28 * u, ky, tone(S, 'err').c, 2.2);
  d.text('A', curves.x + 34 * u, ky, { size: fs(S, 12), weight: 700, color: pl.ink2, base: 'middle' });
  d.line(curves.x + 54 * u, ky, curves.x + 78 * u, ky, tone(S, 'err').c, 2.2, [5, 4]);
  d.text('B', curves.x + 84 * u, ky, { size: fs(S, 12), weight: 700, color: pl.ink2, base: 'middle' });
  void mode;
}

export { sizesOf };
