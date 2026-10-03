// Parte 2: en el plano, apilar capas lineales sigue dando una recta; y un grupo rodeado por un anillo derrota a cualquier recta.
import { alpha, badge, box, clamp, lerp, link, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { lineSweep, makeData, R, type LineFit, type Pt } from './mlp';
import { drawFrame, drawPoints, drawRegion, fieldPlot, revealOrder } from './field';
import { fs, ph, square } from './shared';

// Los puntos y el barrido de rectas se calculan una vez (funciones puras de datos con semilla fija).
let CACHE: { pts: Pt[]; sweep: LineFit[]; best: LineFit; bestK: number; order: number[] } | null = null;
function data() {
  if (!CACHE) {
    const pts = makeData('circles'), sweep = lineSweep(pts);
    let bestK = 0; sweep.forEach((s, k) => { if (s.acc > sweep[bestK].acc) bestK = k; });
    CACHE = { pts, sweep, best: sweep[bestK], bestK, order: revealOrder(pts.length) };
  }
  return CACHE;
}
export const bestLineAccuracy = () => data().best.acc;

const GN = 28;                         // rejilla del tinte de la recta
const gridBuf = new Float32Array(GN * GN);

export function drawPlane(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, D = data();
  const R_ = regions(S, S.portrait ? 0.7 : 0.6);
  const main = S.portrait ? { ...all, h: all.h * 0.66 } : { x: all.x, y: all.y, w: all.w * 0.6, h: all.h };
  const aside = S.portrait ? { x: all.x, y: all.y + all.h * 0.68, w: all.w, h: all.h * 0.32 } : { x: all.x + all.w * 0.64, y: all.y, w: all.w * 0.36, h: all.h };
  void R_;
  const sq = square(main, 'left'), plot = fieldPlot(S, sq);
  const dt = tone(S, 'dat'), wt = tone(S, 'w'), ink = tone(S, 'ink');

  // ── recta: primero una cualquiera (capas lineales apiladas); luego el barrido sobre los datos ──
  const dataK = ph(S, 'plane', 0.34, 0.5, 'lin');                 // aparición de los puntos
  const sweepP = ph(S, 'plane', 0.5, 0.86, 'lin'), settle = ph(S, 'plane', 0.86, 0.97, 'io');
  let fit: LineFit;
  if (sweepP <= 0) fit = { angle: 1.05, offset: 0.35, acc: 0 };
  else {
    const k = Math.min(179, Math.floor(sweepP * 180));
    const cur = D.sweep[k], b = D.best;
    fit = settle > 0 ? { angle: lerp(cur.angle, b.angle, settle), offset: lerp(cur.offset, b.offset, settle), acc: settle > 0.98 ? b.acc : cur.acc } : cur;
  }
  const nx = Math.cos(fit.angle), ny = Math.sin(fit.angle);

  // tinte de los lados de la recta: el lado donde hay más unos se pinta como «clase 1»
  let onesPos = 0, nPos = 0;
  for (const q of D.pts) { if (q.x * nx + q.y * ny > fit.offset) { nPos++; onesPos += q.c; } }
  const posIsOne = nPos === 0 ? true : onesPos / nPos >= 0.5;
  const a0 = S.reveal('plane', 0.1, 0.6);
  d.withAlpha(a0, () => {
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      const x = -R + ((i + 0.5) / GN) * 2 * R, y = R - ((j + 0.5) / GN) * 2 * R, pos = x * nx + y * ny > fit.offset;
      gridBuf[j * GN + i] = pos === posIsOne ? 0.9 : 0.1;
    }
    drawRegion(S, plot, gridBuf, GN, 0.8);
    drawFrame(S, plot);
    const L = 2 * R * 1.5, px = nx * fit.offset, py = ny * fit.offset;
    plot.line(px - ny * L, py + nx * L, px + ny * L, py - nx * L, 'ink', 2.6);
  });
  if (dataK > 0) drawPoints(S, plot, D.pts, { frac: dataK, order: D.order });

  // etiqueta de la recta
  d.withAlpha(S.reveal('plane', 0.15, 0.5), () => {
    const L1 = plot.r.x + plot.r.w - 8 * u, y1 = plot.r.y + plot.r.h - 12 * u;
    if (dataK <= 0) badge(S, S.l('la frontera es una recta', 'the boundary is a straight line'), plot.r.x + plot.r.w / 2, y1, { tone: 'ink' });
    void L1;
  });

  // ── lateral: tres capas lineales que se funden en una; lecturas de aciertos ──
  const mergeP = ph(S, 'plane', 0.18, 0.4, 'io');
  const bw = Math.min(S.portrait ? aside.w * 0.28 : aside.w * 0.8, 130 * u), bh = 30 * u;
  const surv = S.portrait ? 1 : 0;                                // la caja que sobrevive a la fusión
  const boxes: Rect[] = [0, 1, 2].map((i) => S.portrait
    ? { x: aside.x + (aside.w - bw) / 2 + (i - 1) * (bw + 16 * u) * (1 - mergeP), y: aside.y + 6 * u, w: bw, h: bh }
    : { x: aside.x + (aside.w - bw) / 2, y: aside.y + 8 * u + i * (bh + 12 * u) * (1 - mergeP), w: bw, h: bh });
  d.withAlpha(S.reveal('plane', 0.1, 0.5), () => {
    const names = [S.l('capa lineal', 'linear layer'), S.l('capa lineal', 'linear layer'), S.l('capa lineal', 'linear layer')];
    for (let i = 2; i >= 0; i--) {
      const dim = i === surv ? 1 : 1 - mergeP;
      if (dim <= 0.02) continue;
      d.withAlpha(dim, () => box(S, boxes[i], names[i], { tone: 'w', size: 13 }));
    }
    const lab = ph(S, 'plane', 0.34, 0.46, 'out');
    if (lab > 0) d.withAlpha(lab, () => d.text(S.l('= una sola recta', '= one single line'), boxes[surv].x + boxes[surv].w / 2, boxes[surv].y + bh + 16 * u, { size: fs(S, 14), weight: 700, color: wt.ink, align: 'center', base: 'middle' }));
  });
  void link; void alpha; void clamp; void ink;

  // lecturas
  const ra = ph(S, 'plane', 0.5, 0.6, 'out');
  if (ra > 0) d.withAlpha(ra, () => {
    const y0 = S.portrait ? aside.y + 70 * u : aside.y + 120 * u, x0 = aside.x + (S.portrait ? 4 : 0), cw = S.portrait ? aside.w / 2 : aside.w;
    const live = sweepP > 0 ? fit.acc : 0;
    d.text(S.l('esta recta acierta', 'this line is right'), x0, y0, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
    d.text(`${S.n(live * 100, 0)} %`, x0, y0 + 24 * u, { size: fs(S, 26), weight: 700, font: 'mono', color: p.ink, base: 'middle' });
    const bx = S.portrait ? x0 + cw : x0, by = S.portrait ? y0 : y0 + 76 * u, ba = ph(S, 'plane', 0.84, 0.95, 'out');
    d.withAlpha(ba, () => {
      d.text(S.l('la mejor recta posible', 'the best possible line'), bx, by, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
      d.text(`${S.n(D.best.acc * 100, 0)} %`, bx, by + 24 * u, { size: fs(S, 26), weight: 700, font: 'mono', color: dt.ink, base: 'middle' });
    });
  });
}
