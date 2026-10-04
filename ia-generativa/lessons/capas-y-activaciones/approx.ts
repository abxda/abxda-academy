// Parte 4: aproximación universal (una curva dibujada con esquinas ReLU) y profundidad (la sierra: tramos que se duplican por capa).
import { Plot, alpha, badge, clamp, drawNet, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { AX, approxError, target, tentK } from './mlp';
import { fs, nf, ph, sn } from './shared';

export const APPROX_GOAL = 0.05;           // error máximo que pide el primer «Tu turno»
export const N_MAX = 24;

// ═════════════════════════════════════════════════════════════════════════
// Aproximar una curva con n neuronas ReLU
// ═════════════════════════════════════════════════════════════════════════
/** Número de neuronas que muestra la escena en cada momento (guion durante la voz; el control durante el turno). */
export function approxN(S: Frame): number {
  if (S.between('try1', 'depth')) return Math.round(S.p.n ?? 3);
  if (S.on('approx-theorem')) return N_MAX;
  if (S.on('approx-grow')) return Math.round(lerp(3, N_MAX, ph(S, 'approx-grow', 0.08, 0.88, 'io')));
  if (S.on('approx-start')) { const t = ph(S, 'approx-start', 0.38, 0.9, 'lin'); return t <= 0 ? 0 : Math.min(3, 1 + Math.floor(t * 3)); }
  return 0;
}

const ERR = new Map<number, number>();
const errOf = (n: number) => { let e = ERR.get(n); if (e === undefined) { e = approxError(n); ERR.set(n, e); } return e; };
/** Error máximo de la aproximación con n neuronas (para que la escena complete el turno). */
export const approxErrOf = errOf;

export function drawApprox(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const main: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.6 } : { x: all.x, y: all.y, w: all.w * 0.68, h: all.h };
  const aside: Rect = S.portrait ? { x: all.x, y: all.y + all.h * 0.62, w: all.w, h: all.h * 0.38 } : { x: all.x + all.w * 0.72, y: all.y, w: all.w * 0.28, h: all.h };
  const n = approxN(S);
  const plot = new Plot(S, main, { xr: [-3.3, 3.3], yr: [-1.2, 1.1], pad: { l: 8, r: 8, t: 10, b: 24 }, xLabel: 'x', yLabel: undefined });
  const sg = tone(S, 'sig'), er = tone(S, 'err'), wt = tone(S, 'w');
  const a0 = S.reveal('approx-start', 0, 0.7);

  d.withAlpha(a0, () => {
    d.rect(plot.r.x, plot.r.y, plot.r.w, plot.r.h, { fill: alpha(p.surface, 0.6), stroke: p.line, lw: 1 });
    d.line(plot.r.x, plot.Y(0), plot.r.x + plot.r.w, plot.Y(0), p.line, 1.2);
    d.text('x', plot.r.x + plot.r.w - 4 * u, plot.Y(0) - 12 * u, { size: fs(S, 14), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    // palitos de error
    if (n >= 1) {
      const h = (AX[1] - AX[0]) / n;
      const f = (x: number) => { const k = Math.min(n - 1, Math.floor((x - AX[0]) / h)), t0 = AX[0] + k * h; return lerp(target(t0), target(t0 + h), (x - t0) / h); };
      const m = S.portrait ? 40 : 64;
      for (let i = 0; i <= m; i++) { const x = AX[0] + ((AX[1] - AX[0]) * i) / m; plot.line(x, target(x), x, f(x), 'err', 1.3, undefined, 0.55); }
      // aproximación: unión de tramos rectos entre las esquinas
      const pts: [number, number][] = [];
      for (let k = 0; k <= n; k++) { const x = AX[0] + k * h; pts.push([plot.X(x), plot.Y(target(x))]); }
      plot.clip(() => d.polyline(pts, sg.c, 3.4));
      // esquinas (una por neurona, salvo la inicial que solo fija la pendiente)
      if (n <= 14) for (let k = 0; k < n; k++) { const x = AX[0] + k * h; plot.dot(x, target(x), 4.2, 'w', { ring: true }); }
    }
    plot.curve(target, 'ink', 3);
    // la banda ±ε del teorema: la red nunca sale de ella
    const bandA = S.between('approx-theorem', 'depth') ? S.at('approx-theorem', 0.5, 2.5, 'out') : 0;     // desde el teorema hasta el turno: la meta del turno es no salir de la banda
    if (bandA > 0) {
      const m = 80, up: [number, number][] = [], dn: [number, number][] = [];
      for (let i = 0; i <= m; i++) { const x = AX[0] + ((AX[1] - AX[0]) * i) / m; up.push([plot.X(x), plot.Y(target(x) + APPROX_GOAL)]); dn.push([plot.X(x), plot.Y(target(x) - APPROX_GOAL)]); }
      d.polygon([...up, ...dn.reverse()], { fill: alpha(wt.c, 0.22 * bandA) });
    }
    // rótulos
    const ly = plot.r.y + 14 * u;
    badge(S, S.l('curva objetivo', 'target curve'), plot.r.x + 10 * u, ly, { align: 'left' });
    if (n >= 1) badge(S, S.l('suma de n neuronas ReLU', 'sum of n ReLU neurons'), plot.r.x + 10 * u, ly + 28 * u, { tone: 'sig', align: 'left' });

  });

  // lateral: neuronas, error máximo y el aviso de honestidad
  const e = n >= 1 ? errOf(n) : NaN, ok = n >= 1 && e < APPROX_GOAL;
  d.withAlpha(a0, () => {
    const x0 = aside.x + 4 * u, cols = S.portrait ? 2 : 1, cw = aside.w / cols;
    d.text(S.l('neuronas', 'neurons'), x0, aside.y + 12 * u, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
    d.text(String(n), x0, aside.y + 38 * u, { size: fs(S, 28), weight: 800, font: 'mono', color: sg.ink, base: 'middle' });
    const ex = aside.x + (S.portrait ? cw : 0) + 4 * u, ey = S.portrait ? aside.y : aside.y + 70 * u;
    d.text(S.l('error máximo', 'maximum error'), ex, ey + 12 * u, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
    d.text(n >= 1 ? nf(S, e, 3) : '—', ex, ey + 38 * u, { size: fs(S, 28), weight: 800, font: 'mono', color: ok ? tone(S, 'dat').ink : er.ink, base: 'middle' });
    // una casilla por neurona: el glifo es la propia ReLU
    const cell = Math.min(S.portrait ? 18 * u : 26 * u, (aside.w - 8 * u) / (S.portrait ? 12 : 6)), per = S.portrait ? 12 : 6;
    const gy = S.portrait ? aside.y + 62 * u : aside.y + 150 * u;
    for (let i = 0; i < N_MAX; i++) {
      const cx = x0 + (i % per) * cell, cy = gy + Math.floor(i / per) * cell, on = i < n;
      d.rect(cx, cy, cell - 3 * u, cell - 3 * u, { fill: on ? alpha(sg.c, 0.18) : undefined, stroke: on ? sg.c : p.line, lw: on ? 1.5 : 1 });
      if (on) { const m = cell - 3 * u; d.polyline([[cx + m * 0.18, cy + m * 0.62], [cx + m * 0.5, cy + m * 0.62], [cx + m * 0.82, cy + m * 0.22]], sg.ink, 1.8); }
    }
    // el teorema: la banda de error permitido y quiénes lo probaron (debajo de las casillas, fuera de la curva)
    if (S.between('approx-theorem', 'try1')) {
      const my = gy + Math.ceil(N_MAX / per) * cell + 18 * u, ta = S.between('approx-theorem', 'approx-caveat') ? S.at('approx-theorem', 0.2, 1.2, 'out') : 1;
      d.withAlpha(ta, () => {
        badge(S, S.l(`banda de error ±${nf(S, APPROX_GOAL, 2)}`, `error band ±${nf(S, APPROX_GOAL, 2)}`), x0, my, { tone: 'w', align: 'left' });
        if (S.between('approx-theorem', 'approx-caveat')) d.text(S.l('Cybenko 1989 · Hornik, Stinchcombe y White 1989 · Leshno et al. 1993', 'Cybenko 1989 · Hornik, Stinchcombe, and White 1989 · Leshno et al. 1993'), x0, my + 22 * u, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'top', w: aside.w - 8 * u });
      });
    }
    // meta del turno
    if (S.on('try1')) {
      const my = gy + Math.ceil(N_MAX / per) * cell + 14 * u;
      d.text(S.l(`meta: error < ${nf(S, APPROX_GOAL, 2)}`, `goal: error < ${nf(S, APPROX_GOAL, 2)}`), x0, my, { size: fs(S, 13), weight: 700, color: ok ? tone(S, 'dat').ink : p.ink2, base: 'middle' });
    }
  });
  // aviso: pesos calculados, no entrenados (ilustrativo)
  const ca = ph(S, 'approx-caveat', 0.15, 0.4, 'out') || (S.on('approx-caveat') ? 1 : 0);
  if (ca > 0) d.withAlpha(ca, () => badge(S, S.l('esquinas puestas a mano, no entrenadas', 'corners placed by hand, not trained'), plot.r.x + plot.r.w / 2, plot.r.y + plot.r.h - 14 * u, { tone: 'w' }));
  void sn; void clamp;
}

// ═════════════════════════════════════════════════════════════════════════
// Profundidad
// ═════════════════════════════════════════════════════════════════════════
export function drawDepth(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  // 1) la red que se apila capa a capa
  const netA = S.at('depth', 0, 0.7, 'out') * (1 - S.at('depth-why', 0, 0.7, 'out'));
  if (netA > 0.01) d.withAlpha(netA, () => {
    const layers = [2, 4, 4, 4, 1], rev = ph(S, 'depth', 0.08, 0.72, 'lin') * layers.length;
    const rect: Rect = { x: all.x + 8 * u, y: all.y + 54 * u, w: all.w - 16 * u, h: all.h - 54 * u - (S.portrait ? 60 : 50) * u };
    const g = drawNet(S, rect, { layers, nodeR: S.portrait ? 9 : 12, reveal: rev, nodeTone: 'sig' });
    const wt = tone(S, 'w');
    const names = [S.l('entradas', 'inputs'), S.l('oculta 1', 'hidden 1'), S.l('oculta 2', 'hidden 2'), S.l('oculta 3', 'hidden 3'), S.l('salida', 'output')];
    names.forEach((t, i) => d.text(t, g.nodes[i][0].x, all.y + 38 * u, { size: fs(S, 13), weight: 700, color: i > 0 && i < 4 ? wt.ink : p.mute, align: 'center', base: 'middle', a: clamp(rev - i) }));
    const ba = ph(S, 'depth', 0.72, 0.92, 'out');
    if (ba > 0) d.withAlpha(ba, () => {
      const x1 = g.nodes[1][0].x - 14 * u, x2 = g.nodes[3][0].x + 14 * u, y = all.y + all.h - (S.portrait ? 44 : 36) * u;
      d.polyline([[x1, y - 8 * u], [x1, y], [x2, y], [x2, y - 8 * u]], wt.c, 2);
      badge(S, S.l('red profunda: varias capas ocultas', 'deep network: several hidden layers'), (x1 + x2) / 2, y + 22 * u, { tone: 'w' });
    });
  });

  // 2) la sierra: composición de la función tienda
  const tentA = S.at('depth-why', 0, 0.7, 'out') * (1 - S.at('depth-real', 0, 0.7, 'out'));
  if (tentA > 0.01) d.withAlpha(tentA, () => drawTent(S, all));

  // 3) la torre de noventa y seis capas
  const towA = S.at('depth-real', 0, 0.7, 'out');
  if (towA > 0.01) d.withAlpha(towA, () => drawTower(S, all));
}

function drawTent(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const main: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.52 } : { x: all.x, y: all.y, w: all.w * 0.62, h: all.h };
  const aside: Rect = S.portrait ? { x: all.x, y: all.y + all.h * 0.55, w: all.w, h: all.h * 0.45 } : { x: all.x + all.w * 0.66, y: all.y, w: all.w * 0.34, h: all.h };
  const kF = S.on('depth-cost') ? 5 : 1 + 4 * ph(S, 'depth-why', 0.3, 0.88, 'lin');
  const k0 = Math.min(5, Math.floor(kF)), f = kF - k0, kShow = k0 + (f > 0.001 ? 1 : 0);
  const plot = new Plot(S, main, { xr: [0, 1], yr: [-0.06, 1.1], pad: { l: 10, r: 10, t: 10, b: 24 }, xLabel: 'x' });
  d.rect(plot.r.x, plot.r.y, plot.r.w, plot.r.h, { fill: alpha(p.surface, 0.6), stroke: p.line, lw: 1 });
  const sg = tone(S, 'sig'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const N = 512, curve = (k: number) => { const pts: [number, number][] = []; for (let i = 0; i <= N; i++) { const x = i / N; pts.push([plot.X(x), plot.Y(tentK(x, k))]); } return pts; };
  // las anteriores, tenues
  for (let k = 1; k < k0; k++) d.polyline(curve(k), sg.c, 1.4, { a: 0.22 });
  d.polyline(curve(k0), sg.c, 3.2, { a: f > 0.001 ? 1 - f : 1 });
  if (f > 0.001 && k0 < 5) d.polyline(curve(k0 + 1), sg.c, 3.2, { a: f });
  void kShow;
  const k = Math.round(kF), pieces = 2 ** k;
  // contadores
  const items: { l: string; v: string; t: 'w' | 'sig' | 'dat' }[] = [
    { l: S.l('capas', 'layers'), v: String(k), t: 'w' },
    { l: S.l('neuronas', 'neurons'), v: String(2 * k), t: 'sig' },
    { l: S.l('tramos rectos', 'straight pieces'), v: String(pieces), t: 'dat' },
  ];
  const cols = S.portrait ? 3 : 1, rowH = 56 * u, cw = aside.w / cols;
  items.forEach((it, i) => {
    const x = aside.x + (i % cols) * cw + 4 * u, y = aside.y + Math.floor(i / cols) * rowH;
    d.text(it.l, x, y + 12 * u, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
    d.text(it.v, x, y + 38 * u, { size: fs(S, 28), weight: 800, font: 'mono', color: tone(S, it.t).ink, base: 'middle' });
  });
  // comparación: con profundidad vs. una sola capa
  const ca = ph(S, 'depth-cost', 0.12, 0.4, 'out');
  if (ca > 0) d.withAlpha(ca, () => {
    const y0 = aside.y + (S.portrait ? rowH + 6 * u : 3 * rowH + 6 * u);
    const per = S.portrait ? 16 : 16, cell = Math.min(15 * u, (aside.w - 8 * u) / per);
    const row = (label: string, count: number, y: number, t: 'sig' | 'w') => {
      d.text(label, aside.x + 4 * u, y, { size: fs(S, 13), weight: 700, color: tone(S, t).ink, base: 'middle' });
      for (let i = 0; i < count; i++) { const cx = aside.x + 4 * u + (i % per) * cell, cy = y + 12 * u + Math.floor(i / per) * cell; d.rect(cx, cy, cell - 2.5 * u, cell - 2.5 * u, { fill: alpha(tone(S, t).c, 0.25), stroke: tone(S, t).c, lw: 1.3 }); }
    };
    row(S.l('cinco capas de dos: 10 neuronas', 'five layers of two: 10 neurons'), 10, y0, 'sig');
    const yb = y0 + 12 * u + 1 * cell + 26 * u;
    d.withAlpha(ph(S, 'depth-cost', 0.4, 0.7, 'out'), () => row(S.l('una sola capa: al menos 31', 'a single layer: at least 31'), 31, yb, 'w'));
  });
  void wt; void dt;
}

function drawTower(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), sg = tone(S, 'sig');
  const n = 96, count = Math.round(ph(S, 'depth-real', 0.12, 0.7, 'out') * n);
  const tw = Math.min(all.w * (S.portrait ? 0.46 : 0.34), 230 * u), th = all.h - 30 * u, bh = th / n, x0 = all.x + (S.portrait ? 6 * u : all.w * 0.12), yb = all.y + all.h - 8 * u;
  for (let i = 0; i < count; i++) {
    const t = i % 2;
    d.rect(x0, yb - (i + 1) * bh, tw, Math.max(1.5, bh - 1.4), { fill: alpha(t ? sg.c : wt.c, 0.5 + 0.35 * (i / n)) });
  }
  const tx = x0 + tw + (S.portrait ? 16 : 36) * u, a = ph(S, 'depth-real', 0.3, 0.6, 'out');
  d.withAlpha(a, () => {
    d.text('GPT-3', tx, all.y + all.h * 0.34, { size: fs(S, 18), weight: 700, color: p.ink2, base: 'middle' });
    d.text(`${count < n ? count : n}`, tx, all.y + all.h * 0.34 + 44 * u, { size: fs(S, S.portrait ? 40 : 54), weight: 800, font: 'mono', color: wt.ink, base: 'middle' });
    d.text(S.l('capas', 'layers'), tx, all.y + all.h * 0.34 + 88 * u, { size: fs(S, 18), weight: 700, color: p.ink2, base: 'middle' });
    d.text(S.l('(cada barra es una capa)', '(each bar is one layer)'), tx, all.y + all.h * 0.34 + 118 * u, { size: fs(S, 13), color: p.mute, base: 'middle', w: all.x + all.w - tx });
    d.text(S.l('175 mil millones de parámetros', '175 billion parameters'), tx, all.y + all.h * 0.34 + 150 * u, { size: fs(S, 15), weight: 700, color: sg.ink, base: 'top', w: all.x + all.w - tx });
  });
}
