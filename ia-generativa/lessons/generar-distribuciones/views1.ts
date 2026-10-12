// Vistas de la primera mitad: clasificar frente a generar, los sietes reales, la nube de dos medidas (distribución y
// muestreo) y los píxeles sacados por separado. Funciones puras de S (y del estado S.st que llena update()).
import { Plot, alpha, badge, clamp, hash, inset, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import * as L from './latent';
import * as M from './measures';
import { axisX, axisY, digit, fr, fs, kk, readout, rowsReveal, tileLayout } from './helpers';
import { AUTO_N, EX, NEW_IMG, stOf } from './state';

// ═════════════════════════════════════════════════════════════════════════
// 1 · clasificar frente a generar
// ═════════════════════════════════════════════════════════════════════════
export function drawIntro(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), R = inset(S.full(), 12 * u, 14 * u), por = S.portrait, low = R.h < 260;
  const cell = por ? clamp(Math.floor(Math.min(R.h * 0.19, R.w * 0.2) / 8), 4, 9) : clamp(Math.floor(Math.min(R.h * (low ? 0.27 : 0.27), R.w * 0.13) / 8), 4, 15);
  const im = 8 * cell, tagW = low ? 104 * k : 0;
  const X0 = R.x + tagW, W = R.w - tagW;
  const rowY = low ? [R.y + R.h * 0.27, R.y + R.h * 0.76] : [R.y + R.h * 0.3, R.y + R.h * 0.76];
  const xL = X0 + Math.max(im / 2 + 2, W * 0.12), xR = X0 + W - Math.max(im / 2 + 2, W * 0.12), xC = X0 + W / 2;
  const bw = Math.min((low ? 150 : 190) * k, W * 0.3), bh = Math.max(36 * k, im * 0.62);
  const capS = fs(S, low || por ? 12.5 : 14);

  const label7 = (cx: number, cy: number, a: number) => d.withAlpha(a, () => {
    const s = im * 0.86;
    d.rect(cx - s / 2, cy - s / 2, s, s, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    d.text('7', cx, cy + 1, { size: (s * 0.62) / u, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
  });
  const net = (cy: number, a: number, sub: string, subA: number) => d.withAlpha(a, () => {
    const w = tone(S, 'w');
    d.rect(xC - bw / 2, cy - bh / 2, bw, bh, { fill: w.soft, stroke: w.c, lw: 2, r: 4 });
    d.text(S.l('red', 'network'), xC, cy, { size: fs(S, low || por ? 14 : 17), weight: 800, color: w.ink, align: 'center', base: 'middle' });
    if (subA > 0) d.text(sub, xC, cy + bh / 2 + 6 * k, { size: capS, weight: 700, color: w.ink, align: 'center', base: 'top', a: subA, w: Math.max(bw, 120 * k) });
  });
  const arrow = (x1: number, x2: number, y: number, a: number) => { if (a > 0) d.arrow(x1, y, lerp(x1, x2, a), y, p.ink2, 2, a > 0.95 ? 8 : 0.001); };
  const cap = (txt: string, x: number, y: number, a: number, t = p.ink2) => { if (a > 0) d.text(txt, x, y, { size: capS, weight: 700, color: t, align: 'center', base: 'top', a, w: Math.max(im + 30 * k, 90 * k) }); };
  const rowTag = (txt: string, row: number, a: number, t: string) => {
    if (a <= 0) return;
    if (low) d.text(txt, R.x, rowY[row], { size: fs(S, 14), weight: 800, color: t, base: 'middle', a });
    else d.text(txt, R.x, rowY[row] - im / 2 - 12 * k, { size: fs(S, por ? 14 : 17), weight: 800, color: t, base: 'bottom', a });
  };

  // fila 1: imagen → red → «7»
  const y1 = rowY[0];
  digit(S, xL - im / 2, y1 - im / 2, L.img(EX), cell, { a: fr(S, 'hook', 0.02, 0.2) });
  arrow(xL + im / 2 + 6 * k, xC - bw / 2 - 4 * k, y1, fr(S, 'hook', 0.2, 0.42, 'io'));
  net(y1, fr(S, 'hook', 0.22, 0.4), '', 0);
  arrow(xC + bw / 2 + 4 * k, xR - im * 0.43 - 6 * k, y1, fr(S, 'hook', 0.48, 0.66, 'io'));
  label7(xR, y1, fr(S, 'hook', 0.62, 0.8));
  rowTag(S.l('clasificar', 'classify'), 0, fr(S, 'classify', 0.05, 0.2), p.ink);
  cap(S.l('imagen', 'image'), xL, y1 + im / 2 + 5 * k, fr(S, 'classify', 0.3, 0.45));
  cap(S.l('etiqueta', 'label'), xR, y1 + im * 0.43 + 5 * k, fr(S, 'classify', 0.4, 0.55));

  // fila 2: «7» → red → imagen nueva
  const y2 = rowY[1], lat = tone(S, 'lat');
  label7(xL, y2, fr(S, 'generate-ask', 0.05, 0.22));
  cap(S.l('lo que pides', 'what you ask for'), xL, y2 + im * 0.43 + 5 * k, fr(S, 'generate-ask', 0.12, 0.28));
  arrow(xL + im * 0.43 + 6 * k, xC - bw / 2 - 4 * k, y2, fr(S, 'generate-ask', 0.22, 0.4, 'io'));
  net(y2, fr(S, 'generate-ask', 0.25, 0.42), S.l('modelo generativo', 'generative model'), fr(S, 'generative', 0.2, 0.36));
  arrow(xC + bw / 2 + 4 * k, xR - im / 2 - 6 * k, y2, fr(S, 'generate-ask', 0.42, 0.56, 'io'));
  const rev = fr(S, 'generate-ask', 0.55, 0.85, 'lin');
  if (S.on('generate-ask')) d.withAlpha(fr(S, 'generate-ask', 0.52, 0.6), () => digit(S, xR - im / 2, y2 - im / 2, rowsReveal(NEW_IMG, rev), cell, { kind: 'model' }));
  cap(S.l('nuevo: nunca existió', 'new: never existed'), xR, y2 + im / 2 + 5 * k, fr(S, 'generate-ask', 0.8, 0.95), lat.ink);
  rowTag(S.l('generar', 'generate'), 1, fr(S, 'generative', 0.05, 0.2), lat.ink);
}

// ═════════════════════════════════════════════════════════════════════════
// 2 · sietes reales: todos distintos, con algo en común
// ═════════════════════════════════════════════════════════════════════════
const SEV_PICK = (() => { const out = [EX]; for (const i of M.SEVENS) { if (i !== EX && i < L.NTR && hash(i, 3) < 0.3) out.push(i); if (out.length >= 16) break; } return out; })();
const SEV_ORDER = [5, 0, 9, 3, 12, 7, 14, 1, 10, 4, 15, 8, 2, 13, 6, 11];   // el ejemplo (posición 0 de SEV_PICK) cae en la casilla 5
export function drawSevens(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), R = inset(S.full(), 14 * u, 16 * u);
  const top = R.y + 26 * k;
  const lay = tileLayout({ x: R.x, y: top, w: R.w, h: R.y + R.h - top }, 16, { cols: S.portrait ? 4 : 8, gap: 10 * k, maxCell: S.portrait ? 9 : 10, valign: 'center' });
  d.text(S.l('sietes reales del conjunto de datos', 'real sevens from the dataset'), lay.x0, lay.y0 - 10 * k, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'bottom', a: fr(S, 'question', 0.02, 0.15) });
  SEV_ORDER.forEach((slotIdx, j) => {
    const q = lay.pos(slotIdx), idx = SEV_PICK[j];
    digit(S, q.x, q.y, L.img(idx), lay.cell, { a: fr(S, 'question', 0.06 + 0.035 * j, 0.14 + 0.035 * j) });
    if (j === 0) { const a = fr(S, 'question', 0.78, 0.92); if (a > 0) d.rect(q.x - 4 * k, q.y - 4 * k, lay.tile + 8 * k, lay.tile + 8 * k, { stroke: tone(S, 'sig').c, lw: 2.5, a, r: 3 }); }
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 3 · la nube de dos medidas: tinta arriba y tinta abajo
// ═════════════════════════════════════════════════════════════════════════
interface CloudLay { plot: Plot; panel: Rect; cell: number; dx: number; dy: number; rx: number; ry: number; rbY: number; rowMode: boolean; big: number }
function cloudLay(S: Frame): CloudLay {
  const u = S.u, k = kk(S), R = inset(S.full(), 12 * u, 14 * u);
  let plotR: Rect, panel: Rect;
  if (S.portrait) { const h = R.h * 0.63; plotR = { x: R.x, y: R.y, w: R.w, h }; panel = { x: R.x, y: R.y + h + 8 * k, w: R.w, h: R.h - h - 8 * k }; }
  else { const pw = clamp(R.w * 0.3, 170 * k, 290 * k); panel = { x: R.x, y: R.y, w: pw, h: R.h }; plotR = { x: R.x + pw + 14 * k, y: R.y, w: R.w - pw - 14 * k, h: R.h }; }
  const plot = new Plot(S, plotR, { xr: [2, 17], yr: [2, 17], pad: { l: 38, r: 8, t: 24, b: 40 } });
  const rowMode = panel.w >= panel.h * 1.25;
  let cell: number, dx: number, dy: number, rx: number, ry: number;
  if (rowMode) {
    cell = Math.max(4, Math.floor(Math.min(panel.h * 0.9, panel.w * 0.42) / 8));
    dx = panel.x + 2; dy = panel.y + (panel.h - 8 * cell) / 2; rx = dx + 8 * cell + 16 * k; ry = dy;
  } else {
    cell = Math.max(4, Math.floor(Math.min(panel.w * 0.6, panel.h * 0.42) / 8));
    dx = panel.x + 2; dy = panel.y + 6 * k; rx = dx; ry = dy + 8 * cell + 16 * k;
  }
  // antes de que aparezca el plano, el siete se ve grande en el centro; con «plane» se desliza a su panel
  const m = fr(S, 'plane', 0, 0.22, 'io'), rh = 17 * k + 20 * u + 10 * k;
  let rbY = ry + rh;
  if (m < 1) {
    let bc: number, bx: number, by: number, brx: number, bry: number;
    if (S.portrait) { bc = Math.floor(Math.min(R.w * 0.46, R.h * 0.5) / 8); bx = R.x + R.w * 0.5 - 8 * bc - 6 * k; by = R.y + (R.h - 8 * bc) * 0.3; brx = R.x + R.w * 0.5 + 10 * k; bry = by; }
    else { bc = Math.floor(Math.min(R.h * 0.62, R.w * 0.28) / 8); bx = R.x + R.w * 0.5 - 8 * bc - 12 * k; by = R.y + (R.h - 8 * bc) / 2; brx = R.x + R.w * 0.5 + 12 * k; bry = by + 4 * k; }
    // en grande, cada lectura va junto a su mitad
    const bTop = by + 2 * bc - rh / 2, bBot = by + 6 * bc - rh / 2;
    cell = Math.round(lerp(bc, cell, m)); dx = lerp(bx, dx, m); dy = lerp(by, dy, m); rx = lerp(brx, rx, m); rbY = lerp(bBot, rbY, m); ry = lerp(bTop, ry, m);
  }
  return { plot, panel, cell, dx, dy, rx, ry, rbY, rowMode, big: 1 - m };
}
const MX = (S: Frame) => S.n(M.TOP[EX], 1), MY = (S: Frame) => S.n(M.BOT[EX], 1);
/** Puntos nuevos visibles: los que sacó la escena (según el tiempo) y los de la persona (con su reloj). */
function newPoints(S: Frame): { pts: M.P2[]; age: number[] } {
  const st = stOf(S), pts: M.P2[] = [], age: number[] = [];
  if (!S.on('sample')) return { pts, age };
  const D = Math.max(1, S.end('sample') - S.start('sample'));
  for (let i = 0; i < AUTO_N; i++) { const t0 = S.start('sample') + (0.22 + (0.7 * i) / AUTO_N) * D, q = clamp((S.t - t0) / 0.5); if (q > 0) { pts.push(M.NEW7[i]); age.push(q); } }
  if (S.on('try-sample')) st.presses.forEach((c, j) => { if (AUTO_N + j < M.NEW7.length) { pts.push(M.NEW7[AUTO_N + j]); age.push(clamp((S.clock - c) / 0.5)); } });
  return { pts, age };
}

export function drawCloud(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), G = cloudLay(S), plot = G.plot, r = plot.r;
  const dat = tone(S, 'dat'), er = tone(S, 'err'), sg = tone(S, 'sig'), w = tone(S, 'w');
  const ticks = [4, 8, 12, 16];

  // ── panel: el siete de ejemplo con sus dos mitades (luego, el «?» del punto nuevo) ──
  const qA = fr(S, 'not-image', 0.1, 0.3);
  const exA = 1 - qA;
  const cnt = (seg: string, r0: number) => { const kq = fr(S, seg, 0.3, 0.78, 'lin') * 4; let s = 0; for (let rr = 0; rr < 4; rr++) s += M.rowInk(EX, r0 + rr) * clamp(kq - rr); return s; };
  if (exA > 0.01) d.withAlpha(exA, () => {
    digit(S, G.dx, G.dy, L.img(EX), G.cell, { a: fr(S, 'measure-top', 0.0, 0.12) });
    const c = G.cell, W8 = 8 * c;
    // fila que se está contando
    const band = (seg: string, r0: number, t: typeof sg) => { if (!S.is(seg)) return; const kq = fr(S, seg, 0.3, 0.78, 'lin') * 4; if (kq <= 0 || kq >= 4) return; const rr = Math.floor(kq); d.rect(G.dx, G.dy + (r0 + rr) * c, W8, c, { fill: alpha(t.c, 0.22) }); };
    band('measure-top', 0, sg); band('measure-bottom', 4, w);
    const aT = fr(S, 'measure-top', 0.1, 0.25), aB = fr(S, 'measure-bottom', 0.05, 0.2);
    if (aT > 0) d.rect(G.dx - 2, G.dy - 2, W8 + 4, 4 * c + 2, { stroke: sg.c, lw: 2.5, a: aT });
    if (aB > 0) d.rect(G.dx - 2, G.dy + 4 * c, W8 + 4, 4 * c + 2, { stroke: w.c, lw: 2.5, dash: [6, 4], a: aB });
    const rw = Math.max(110 * k, Math.min(S.W - G.rx - 10 * u, G.rowMode ? G.panel.x + G.panel.w - G.rx : S.W));
    const vs = lerp(20, S.portrait ? 22 : 28, G.big), ns = lerp(12.5, S.portrait ? 13 : 15, G.big);
    if (aT > 0) readout(S, G.rx, G.ry, S.l('tinta arriba', 'top ink'), S.n(cnt('measure-top', 0), 1), 'sig', { a: aT, size: vs, ns, w: rw });
    if (aB > 0) readout(S, G.rx, G.rbY, S.l('tinta abajo', 'bottom ink'), S.n(cnt('measure-bottom', 4), 1), 'w', { a: aB, size: vs, ns, w: rw });
  });

  // ── la gráfica ──
  axisX(S, plot, { ticks, label: S.l('tinta arriba', 'top ink'), a: fr(S, 'plane', 0.02, 0.25) });
  axisY(S, plot, { ticks, label: S.l('tinta abajo', 'bottom ink'), a: fr(S, 'plane', 0.28, 0.5) });

  // frontera (clasificar): lados tintados y la recta
  const lineA = fr(S, 'classify-line', 0.05, 0.4, 'io') * (1 - fr(S, 'generate-shape', 0, 0.25));
  if (lineA > 0.01) {
    const { w: lw, c } = M.LDA, f = (x: number, y: number) => lw[0] * x + lw[1] * y - c;
    const corners: M.P2[] = [[2, 2], [17, 2], [17, 17], [2, 17]];
    const half = (sgn: number) => { const out: M.P2[] = []; for (let i = 0; i < 4; i++) { const A = corners[i], B = corners[(i + 1) % 4], fa = sgn * f(A[0], A[1]), fb = sgn * f(B[0], B[1]); if (fa >= 0) out.push(A); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); } } return out.map(([x, y]) => [plot.X(x), plot.Y(y)] as M.P2); };
    const tint = fr(S, 'classify-line', 0.35, 0.55) * lineA;
    d.polygon(half(1), { fill: alpha(dat.c, 0.08 * tint) }); d.polygon(half(-1), { fill: alpha(er.c, 0.08 * tint) });
    const yA = (x: number) => (c - lw[0] * x) / lw[1], x0 = 2, x1 = 17, pa: M.P2 = [x0, yA(x0)], pb: M.P2 = [x1, yA(x1)];
    plot.clip(() => d.line(plot.X(pa[0]), plot.Y(pa[1]), plot.X(lerp(pa[0], pb[0], lineA)), plot.Y(lerp(pa[1], pb[1], lineA)), p.ink, 2.6));
    const fx = 14.8, fy = yA(fx);
    if (fy > 3 && fy < 16) badge(S, S.l('frontera', 'boundary'), plot.X(fx), plot.Y(fy) - 14 * k, { size: fs(S, 12.5), a: fr(S, 'classify-line', 0.4, 0.55) * lineA });
  }

  // óvalos (la forma de la nube de los sietes)
  const grow = fr(S, 'generate-shape', 0.2, 0.7, 'io');
  if (grow > 0.01) {
    const g = M.G7, sc = (pt: M.P2): M.P2 => [plot.X(g.mu[0] + (pt[0] - g.mu[0]) * grow), plot.Y(g.mu[1] + (pt[1] - g.mu[1]) * grow)];
    plot.clip(() => {
      d.polygon(M.oval(g, 2).map(sc), { fill: alpha(dat.c, 0.07), stroke: alpha(dat.c, 0.6), lw: 1.6 });
      d.polygon(M.oval(g, 1).map(sc), { fill: alpha(dat.c, 0.12), stroke: dat.c, lw: 2 });
    });
  }

  // los datos
  const a7 = (i: number) => fr(S, 'cloud-7', 0.06 + 0.55 * hash(i, 7), 0.16 + 0.55 * hash(i, 7));
  const a6dim = 1 - 0.78 * fr(S, 'generate-shape', 0.05, 0.3);
  const rr = 3.1 * Math.max(0.85, u);
  plot.clip(() => {
    if (S.on('cloud-6')) for (const i of M.SIXES) { const a = fr(S, 'cloud-6', 0.06 + 0.55 * hash(i, 6), 0.16 + 0.55 * hash(i, 6)) * a6dim; if (a > 0.01) d.rect(plot.X(M.TOP[i]) - rr, plot.Y(M.BOT[i]) - rr, 2 * rr, 2 * rr, { fill: alpha(er.c, 0.75), a }); }
    if (S.on('cloud-7')) for (const i of M.SEVENS) { if (i === EX) continue; const a = a7(i); if (a > 0.01) d.circle(plot.X(M.TOP[i]), plot.Y(M.BOT[i]), rr * 1.1, { fill: alpha(dat.c, 0.8), a }); }
  });
  // nombres de las nubes
  const nA = fr(S, 'cloud-7', 0.7, 0.85), sA = fr(S, 'cloud-6', 0.7, 0.85);
  if (nA > 0) badge(S, S.l('sietes', 'sevens'), plot.X(15.2), plot.Y(4.2), { tone: 'dat', size: fs(S, 12.5), a: nA });
  if (sA > 0) badge(S, S.l('seises', 'sixes'), plot.X(4.6), plot.Y(16.1), { tone: 'err', size: fs(S, 12.5), a: sA * a6dim });

  // el siete de ejemplo: guías y punto
  if (S.on('plane')) {
    const ex = plot.X(M.TOP[EX]), ey = plot.Y(M.BOT[EX]), gA = fr(S, 'plane', 0.52, 0.75) * (1 - fr(S, 'cloud-7', 0.1, 0.3));
    if (gA > 0.01) d.withAlpha(gA, () => {
      d.line(ex, r.y + r.h, ex, ey, sg.c, 1.8, [4, 4]); d.line(r.x, ey, ex, ey, w.c, 1.8, [4, 4]);
      d.text(MX(S), ex, r.y + r.h - 6 * k, { size: fs(S, 12.5), weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'bottom', halo: p.stage });
      d.text(MY(S), r.x + 6 * k, ey - 4 * k, { size: fs(S, 12.5), weight: 800, font: 'mono', color: w.ink, base: 'bottom', halo: p.stage });
    });
    const pA = fr(S, 'plane', 0.72, 0.88);
    d.circle(ex, ey, rr * 1.1, { fill: dat.c, a: pA });
    const ring = pA * (1 - fr(S, 'cloud-6', 0, 0.25));
    if (ring > 0.01) { d.circle(ex, ey, 9 * k, { stroke: p.ink, lw: 2, a: ring }); badge(S, S.l('este siete', 'this seven'), ex + 12 * k, ey - 18 * k, { size: fs(S, 12.5), align: 'left', a: ring }); }
  }

  // común, raro, nunca
  const lab = (txt: string, x: number, y: number, a: number, t: 'dat' | 'mute') => { if (a > 0.01) badge(S, txt, plot.X(x), plot.Y(y), { tone: t, size: fs(S, 12.5), a }); };
  const lOut = 1 - fr(S, 'sample', 0, 0.15);
  const rare = M.fromEps(M.G7, [1.15, -1.15]);
  lab(S.l('común', 'common'), M.G7.mu[0], M.G7.mu[1], fr(S, 'distribution', 0.12, 0.26) * lOut, 'dat');
  lab(S.l('raro', 'rare'), rare[0], rare[1], fr(S, 'distribution', 0.3, 0.44) * lOut, 'dat');
  const nevA = fr(S, 'distribution', 0.48, 0.62) * (1 - 0.6 * fr(S, 'sample', 0, 0.15));
  lab(S.l('nunca', 'never'), 4.6, 4.4, nevA, 'mute');

  // muestrear: puntos nuevos (anillos punteados)
  const { pts, age } = newPoints(S);
  if (pts.length) {
    plot.clip(() => pts.forEach((pt, i) => {
      const q = age[i], x = plot.X(pt[0]), y = plot.Y(pt[1]);
      d.circle(x, y, lerp(16, 5.2, q) * k, { fill: alpha(p.stage, 0.85), stroke: sg.c, lw: 2.2, dash: [3, 2.5], a: clamp(q * 2) });
      d.circle(x, y, 1.6 * k, { fill: sg.c, a: q });
    }));
    const cA = fr(S, 'sample', 0.15, 0.3);
    const bx = r.x + r.w - 4 * k, by = r.y + 12 * k;
    badge(S, S.l(`puntos nuevos: ${pts.length}`, `new points: ${pts.length}`), bx, by, { tone: 'sig', size: fs(S, 12.5), align: 'right', a: cA });
    d.text(S.l('sacados de los óvalos ajustados', 'drawn from the fitted ovals'), bx, by + 14 * k, { size: fs(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top', a: cA, halo: p.stage });
  }

  // un punto no es una imagen
  if (qA > 0.01 && pts.length) {
    const last = pts[pts.length - 1], lx = plot.X(last[0]), ly = plot.Y(last[1]);
    d.withAlpha(qA, () => {
      d.circle(lx, ly, 11 * k, { stroke: p.ink, lw: 2.4 });
      const c = G.cell, W8 = 8 * c, lat = tone(S, 'lat');
      d.rect(G.dx, G.dy, W8, W8, { fill: lat.soft, stroke: lat.c, lw: 2, dash: [5, 4] });
      d.text('?', G.dx + W8 / 2, G.dy + W8 / 2, { size: (W8 * 0.5) / u, weight: 800, color: lat.ink, align: 'center', base: 'middle' });
      const ax = S.portrait ? G.dx + W8 / 2 : G.dx + W8 + 6 * k, ay = S.portrait ? G.dy - 4 * k : G.dy + W8 / 2;
      d.line(lx, ly, ax, ay, p.ink2, 1.6, [4, 4]);
      const rw = Math.max(110 * k, Math.min(S.W - G.rx - 10 * u, G.rowMode ? G.panel.x + G.panel.w - G.rx : S.W));
      readout(S, G.rx, G.ry, S.l('tinta arriba', 'top ink'), S.n(last[0], 1), 'sig', { size: 20, w: rw });
      const y = G.rbY + readout(S, G.rx, G.rbY, S.l('tinta abajo', 'bottom ink'), S.n(last[1], 1), 'w', { size: 20, w: rw });
      d.text(S.l('¿qué imagen es?', 'which image is it?'), G.rx, y + 2 * k, { size: fs(S, 13), weight: 800, color: lat.ink, base: 'top', a: fr(S, 'not-image', 0.35, 0.5), w: rw });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 4 · cada píxel por separado: manchas
// ═════════════════════════════════════════════════════════════════════════
const PIX_REAL = [0, 2, 3, 4, 5, 8, 9, 6].map((dg) => { for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === dg) return i; return 0; });
const PIX_FAKE = L.drawIndependent(8, 7);
/** Píxel con más tinta a su alrededor (3 × 3) en el primer dígito real: ahí se señalan los vecinos. */
const NB = (() => { const v = L.img(PIX_REAL[0]); let best = 9, bs = -1; for (let r = 1; r < 7; r++) for (let c = 1; c < 7; c++) { let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += v[(r + a) * 8 + c + b]; if (s > bs) { bs = s; best = r * 8 + c; } } return best; })();
export function drawPix(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), R = inset(S.full(), 14 * u, 16 * u), n = S.portrait ? 4 : 8;
  const half = (R.h - 14 * k) / 2, capH = 26 * k;
  const rows: [string, Float32Array[], 'real' | 'model', number, number][] = [
    [S.l('dígitos reales', 'real digits'), PIX_REAL.slice(0, n).map((i) => L.img(i)), 'real', 0, fr(S, 'independent', 0.02, 0.15)],
    [S.l('cada píxel sacado por separado', 'each pixel drawn separately'), PIX_FAKE.slice(0, n), 'model', 1, fr(S, 'independent', 0.22, 0.36)],
  ];
  let lay0 = null as ReturnType<typeof tileLayout> | null;
  rows.forEach(([label, imgs, kind, i, a]) => {
    const top = R.y + i * (half + 14 * k);
    const lay = tileLayout({ x: R.x, y: top + capH, w: R.w, h: half - capH }, n, { cols: n, gap: 10 * k, maxCell: 10, valign: 'center' });
    if (i === 0) lay0 = lay;
    d.withAlpha(a, () => {
      d.text(label, lay.x0, lay.y0 - 8 * k, { size: fs(S, 13), weight: 700, color: i ? tone(S, 'err').ink : p.ink2, base: 'bottom', w: R.w });
      imgs.forEach((im, j) => { const q = lay.pos(j); digit(S, q.x, q.y, im, lay.cell, { kind }); });
    });
  });
  // los vecinos de un trazo
  const nA = fr(S, 'independent', 0.66, 0.8);
  if (nA > 0 && lay0) {
    const L0 = lay0 as ReturnType<typeof tileLayout>, q = L0.pos(0), c = L0.cell, rr = Math.floor(NB / 8), cc = NB % 8, t = tone(S, 'sig');
    d.rect(q.x + (cc - 1) * c - 1, q.y + (rr - 1) * c - 1, 3 * c + 2, 3 * c + 2, { stroke: t.c, lw: 2.5, a: nA });
    const by = q.y + 8 * c + 16 * k;
    d.line(q.x + (cc + 0.5) * c, q.y + (rr + 2) * c + 1, q.x + (cc + 0.5) * c, by - 9 * k, t.c, 1.6, undefined, nA);
    badge(S, S.l('vecinos con tinta', 'inked neighbors'), q.x + (cc + 0.5) * c - 10 * k, by, { tone: 'sig', align: 'left', size: fs(S, 12.5), a: nA });
  }
}
