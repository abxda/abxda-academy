// Vista 2 · La curva de Kaplan: primero en escala normal (eje por eje), los rendimientos decrecientes, los modelos
// apretados contra la orilla, la regla logarítmica explicada aparte, el cambio de escala (eje x, luego eje y) hasta la
// recta, la escalera «×10 → ×0.84», la ley de escala y la extrapolación. El cambio de escala se lee de S.st (lo calcula
// update: por tiempo en la demostración, o siguiendo el interruptor si la persona lo tocó).
import { alpha, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MEASURED_MAX, MULT, SIZES, lossN } from './data';
import { chip, count, fitText, fr, fz, kk, lerp, lineH, provenance } from './ui';

const XMAX = 1.6e9;                       // escala normal: de 0 a 1 600 M de parámetros
const LX0 = 2.5, LX1 = 12.5;              // escala logarítmica: de 10^2.5 a 10^12.5
const YMAX = 7.5;                         // escala normal: pérdida de 0 a 7.5
const LY0 = Math.log10(1.25), LY1 = Math.log10(8.5);
const log10 = Math.log10;

export interface CurveGeo { R: ReturnType<typeof regions>; r: Rect; lgx: number; lgy: number; X: (N: number) => number; Y: (L: number) => number }

export function curveGeo(S: Frame): CurveGeo {
  const R = regions(S, S.portrait ? 0.64 : 0.68), m = R.main, u = S.u, k = kk(S);
  const padL = Math.max(32, 36 * u), padB = 7 * k + lineH(S, 12) + 4 * k + lineH(S, 13), padT = lineH(S, 13) + 8 * k, padR = 10 * k;
  const r: Rect = { x: m.x + padL, y: m.y + padT, w: m.w - padL - padR, h: m.h - padT - padB };
  const lgx = (S.st.lgx as number) ?? 0, lgy = (S.st.lgy as number) ?? 0;
  const X = (N: number) => r.x + lerp(N / XMAX, (log10(Math.max(N, 1)) - LX0) / (LX1 - LX0), lgx) * r.w;
  const Y = (L: number) => r.y + r.h - lerp(L / YMAX, (log10(L) - LY0) / (LY1 - LY0), lgy) * r.h;
  return { R, r, lgx, lgy, X, Y };
}

/** Puntos de la curva ajustada entre n0 y n1 (muestreo en escala logarítmica, para que se vea bien en ambas escalas). */
function curvePts(g: CurveGeo, n0: number, n1: number, upTo = 1) {
  const pts: [number, number][] = [], M = 220, l0 = log10(n0), l1 = log10(n1);
  for (let i = 0; i <= M * upTo; i++) { const N = 10 ** (l0 + ((l1 - l0) * i) / M); pts.push([g.X(N), g.Y(lossN(N))]); }
  return pts;
}

function axesAndTicks(S: Frame, g: CurveGeo) {
  const { d, pal: p } = S, k = kk(S), { r, lgx, lgy } = g;
  const ax = fr(S, 'axis-x', 0.05, 0.4, 'io'), ay = fr(S, 'axis-y', 0.05, 0.4, 'io');
  const ts = fz(S, 11.5), es = S.lang === 'es';
  const sx = r.y + r.h + 7 * k;
  if (ax > 0.01) {
    d.line(r.x, r.y + r.h, r.x + r.w * ax, r.y + r.h, p.lineStrong, 1.5);
    const tA = fr(S, 'axis-x', 0.35, 0.6);
    // escala normal
    const linA = tA * (1 - lgx);
    if (linA > 0.01) {
      const lin: [number, string][] = [[0, '0'], [5e8, es ? '500 M' : '500M'], [1e9, es ? '1 000 M' : '1B'], [1.5e9, es ? '1 500 M' : '1.5B']];
      lin.forEach(([v, s]) => {
        const x = v === 0 ? r.x : g.X(v);
        if (x < r.x - 1 || x > r.x + r.w + 1) return;
        d.line(x, r.y + r.h, x, r.y + r.h + 4 * k, p.lineStrong, 1.5, undefined, linA);
        d.text(s, x, sx, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top', a: linA });
      });
    }
    // escala logarítmica: una marca por cada ×10; rótulos cada mil veces
    const logA = lgx * lgx;
    if (logA > 0.01) {
      for (let e = 3; e <= 12; e++) {
        const x = g.X(10 ** e);
        if (x < r.x - 1 || x > r.x + r.w + 1) continue;
        d.line(x, r.y, x, r.y + r.h, alpha(p.line, 0.9), 1, undefined, logA * lgy * 0.9);
        d.line(x, r.y + r.h, x, r.y + r.h + 4 * k, p.lineStrong, 1.5, undefined, logA);
        if (e % 3 === 0) {
          const s = e === 3 ? S.n(1000, 0) : e === 6 ? (es ? '1 M' : '1M') : e === 9 ? (es ? '1 000 M' : '1B') : (es ? '1 billón' : '1T');
          const al: CanvasTextAlign = e === 12 ? 'right' : 'center';
          d.text(s, e === 12 ? Math.min(x + 10 * k, r.x + r.w + 8 * k) : x, sx, { size: ts, font: 'mono', color: p.mute, align: al, base: 'top', a: logA });
        }
      }
    }
    const lab = S.l('parámetros N', 'parameters N') + (lgx > 0.5 ? S.l(' (escala logarítmica)', ' (log scale)') : '');
    fitText(S, lab, r.x + r.w, sx + lineH(S, 12) + 3 * k, r.w, { size: 13, weight: 700, color: tone(S, 'w').ink, align: 'right', base: 'top', a: fr(S, 'axis-x', 0.5, 0.75) });
  }
  if (ay > 0.01) {
    d.line(r.x, r.y + r.h, r.x, r.y + r.h - r.h * ay, p.lineStrong, 1.5);
    const tA = fr(S, 'axis-y', 0.3, 0.55);
    const linA = tA * (1 - lgy), logA = tA * lgy;
    const lin = [0, 2, 4, 6], lg = [1.5, 2, 3, 4, 6];
    lin.forEach((v) => {
      const y = v === 0 ? r.y + r.h : g.Y(v);
      if (linA < 0.01 || y < r.y - 1) return;
      d.line(r.x - 4 * k, y, r.x, y, p.lineStrong, 1.5, undefined, linA);
      d.text(S.n(v, 0), r.x - 7 * k, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle', a: linA });
    });
    lg.forEach((v) => {
      const y = g.Y(v);
      if (logA < 0.01 || y < r.y - 1 || y > r.y + r.h + 1) return;
      d.line(r.x, y, r.x + r.w, y, alpha(p.line, 0.9), 1, undefined, logA * lgx * 0.9);
      d.line(r.x - 4 * k, y, r.x, y, p.lineStrong, 1.5, undefined, logA);
      d.text(S.n(v, v === 1.5 ? 1 : 0), r.x - 7 * k, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle', a: logA });
    });
    const lab = S.l('pérdida', 'loss') + (lgy > 0.5 ? S.l(' (escala logarítmica)', ' (log scale)') : '');
    fitText(S, lab, g.R.main.x, r.y - 6 * k, r.w * 0.62, { size: 13, weight: 700, color: tone(S, 'err').ink, base: 'bottom', a: fr(S, 'axis-y', 0.45, 0.7) });
    // «mejor» hacia abajo (solo mientras se presentan los ejes)
    const ma = fr(S, 'axis-y', 0.6, 0.8) * (1 - fr(S, 'diminishing', 0, 0.2));
    if (ma > 0.01) {
      const x = r.x + r.w - 16 * k, y0 = r.y + r.h * 0.12, y1 = r.y + r.h * 0.5;
      d.arrow(x, y0, x, y1, tone(S, 'sig').c, 2.4, 9 * k, ma);
      d.text(S.l('mejor', 'better'), x - 8 * k, (y0 + y1) / 2, { size: fz(S, 13), weight: 800, color: tone(S, 'sig').ink, align: 'right', base: 'middle', a: ma, halo: p.stage, haloW: 4 });
    }
  }
}

/** Fila de modelos de tamaños crecientes (segmento «kaplan»). */
function drawModelRow(S: Frame, g: CurveGeo) {
  const { d, pal: p } = S, k = kk(S), m = g.R.main;
  const a = S.reveal('kaplan', 0.6, 0.6) * (1 - fr(S, 'axis-x', 0, 0.3));
  if (a < 0.01) return;
  const n = 7, gap = 10 * k, maxS = Math.min(m.h * 0.42, (m.w - gap * (n - 1)) / 3.2);
  const sizes = Array.from({ length: n }, (_, i) => maxS * 0.12 * (1 / 0.12) ** (i / (n - 1)));
  const total = sizes.reduce((s, x) => s + x, 0) + gap * (n - 1);
  let x = m.x + (m.w - total) / 2;
  const base = m.y + m.h * 0.62;
  sizes.forEach((s, i) => {
    const ai = a * fr(S, 'kaplan', 0.15 + i * 0.07, 0.25 + i * 0.07);
    d.rect(x, base - s, s, s, { fill: alpha(tone(S, 'w').c, 0.22), stroke: tone(S, 'w').c, lw: 1.4, r: 2, a: ai });
    x += s + gap;
  });
  d.text(S.l('modelos de muchos tamaños', 'models of many sizes'), m.x + m.w / 2, base + 10 * k, { size: fz(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top', a: a * fr(S, 'kaplan', 0.5, 0.7) });
  d.text(S.l('de 768 parámetros a 1 500 M', 'from 768 parameters to 1.5B'), m.x + m.w / 2, base + 10 * k + lineH(S, 13), { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', a: a * fr(S, 'kaplan', 0.6, 0.8) });
}

/** La regla graduada: escala normal frente a escala logarítmica (segmento «log-ruler»). */
function drawRuler(S: Frame, g: CurveGeo, a: number) {
  const { d, pal: p } = S, k = kk(S), { r } = g, ts = fz(S, 11.5);
  const rows = [r.y + r.h * 0.28, r.y + r.h * 0.66];
  const aA = fr(S, 'log-ruler', 0.04, 0.2) * a, aB = fr(S, 'log-ruler', 0.25, 0.42) * a;
  const ttl = (str: string, y: number, al: number, below = false) => d.text(str, r.x, below ? y + 12 * k + lineH(S, 12) : y - 30 * k, { size: fz(S, 13.5), weight: 800, color: p.ink2, base: below ? 'top' : 'bottom', a: al });
  // escala normal: 0 … 1 000 000
  if (aA > 0.01) {
    const y = rows[0];
    ttl(S.l('escala normal', 'ordinary scale'), y, aA);
    d.line(r.x, y, r.x + r.w, y, p.lineStrong, 2, undefined, aA);
    [0, 1e3, 1e4, 1e5, 1e6].forEach((v) => { const x = r.x + (v / 1e6) * r.w; d.line(x, y - 6 * k, x, y + 6 * k, p.ink2, 1.6, undefined, aA); });
    d.text('0', r.x, y + 9 * k, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top', a: aA });
    d.text(S.n(1e5, 0), r.x + 0.1 * r.w, y + 9 * k, { size: ts, font: 'mono', color: p.mute, align: 'left', base: 'top', a: aA });
    d.text(S.n(1e6, 0), r.x + r.w, y + 9 * k, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'top', a: aA });
    const note = S.l(`${S.n(1000, 0)} y ${S.n(10000, 0)}: aquí, encimados`, `${S.n(1000, 0)} and ${S.n(10000, 0)}: here, piled up`);
    const na = aA * fr(S, 'log-ruler', 0.15, 0.25);
    const nw = d.measure(note, { size: fz(S, 12), weight: 700 });
    if (nw < r.w * 0.8) {
      d.arrow(r.x + 24 * k, y - 13 * k, r.x + 4 * k, y - 6 * k, tone(S, 'err').c, 1.8, 6 * k, na);
      d.text(note, r.x + 30 * k, y - 13 * k, { size: fz(S, 12), weight: 700, color: tone(S, 'err').ink, base: 'middle', a: na });
    }
  }
  // escala logarítmica: 1 000, 10 000, 100 000, 1 000 000 a la misma distancia
  if (aB > 0.01) {
    const y = rows[1];
    ttl(S.l('escala logarítmica', 'logarithmic scale'), y, aB, true);
    d.line(r.x, y, r.x + r.w, y, p.lineStrong, 2, undefined, aB);
    [1e3, 1e4, 1e5, 1e6].forEach((v, i) => {
      const x = r.x + (i / 3) * r.w;
      d.line(x, y - 6 * k, x, y + 6 * k, p.ink2, 1.6, undefined, aB);
      d.text(S.n(v, 0), x, y + 9 * k, { size: ts, font: 'mono', color: p.mute, align: i === 3 ? 'right' : i === 0 ? 'left' : 'center', base: 'top', a: aB });
    });
    for (let i = 0; i < 3; i++) {
      const ar = fr(S, 'log-ruler', 0.55 + i * 0.1, 0.65 + i * 0.1) * a;
      if (ar < 0.01) continue;
      const x0 = r.x + (i / 3) * r.w + 6 * k, x1 = r.x + ((i + 1) / 3) * r.w - 6 * k, hgt = Math.min(16 * k, (x1 - x0) * 0.2), y0 = y - 9 * k;
      const arc: [number, number][] = [];
      for (let j = 0; j <= 20; j++) { const t = j / 20; arc.push([x0 + (x1 - x0) * t, y0 - 4 * hgt * t * (1 - t)]); }
      d.polyline(arc, tone(S, 'w').c, 2, { a: ar });
      d.arrow(arc[18][0], arc[18][1], x1, y0, tone(S, 'w').c, 2, 6 * k, ar);
      d.text('×10', (x0 + x1) / 2, y0 - hgt - 3 * k, { size: fz(S, 12.5), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'bottom', a: ar, halo: p.stage, haloW: 4 });
    }
  }
}

/** Escalera «×10 en parámetros → ×0.84 en pérdida» sobre la recta. */
function drawStairs(S: Frame, g: CurveGeo, a: number) {
  const { d, pal: p } = S, k = kk(S);
  const Ns = [1e6, 1e7, 1e8, 1e9];
  const wT = tone(S, 'w'), eT = tone(S, 'err');
  for (let i = 0; i < 3; i++) {
    const s = fr(S, 'straight', 0.2 + i * 0.2, 0.38 + i * 0.2, 'io') * a;
    if (s < 0.01) continue;
    const x1 = g.X(Ns[i]), x2 = g.X(Ns[i + 1]), y1 = g.Y(lossN(Ns[i])), y2 = g.Y(lossN(Ns[i + 1]));
    const h = Math.min(1, s * 2), v = Math.max(0, s * 2 - 1);
    d.arrow(x1, y1, x1 + (x2 - x1) * h, y1, wT.c, 2.2, h > 0.98 ? 7 * k : 0.001, a);
    if (v > 0) d.arrow(x2, y1, x2, y1 + (y2 - y1) * v, eT.c, 2.2, v > 0.98 ? 7 * k : 0.001, a);
  }
  // leyenda: una flecha de cada tipo con su significado, en la esquina vacía de abajo a la izquierda
  const la = fr(S, 'straight', 0.25, 0.4) * a;
  if (la > 0.01) {
    const { r } = g, lx = r.x + 12 * k, len = 26 * k, lh = lineH(S, 13) + 8 * k, ly = r.y + r.h - 12 * k - lh * 2;
    d.arrow(lx, ly + lh / 2, lx + len, ly + lh / 2, wT.c, 2.2, 7 * k, la);
    d.text(S.l('×10 en parámetros', '×10 in parameters'), lx + len + 8 * k, ly + lh / 2, { size: fz(S, 13), weight: 800, color: wT.ink, base: 'middle', a: la, halo: p.stage, haloW: 4 });
    const lb = fr(S, 'straight', 0.5, 0.65) * a, vy = ly + lh * 1.5;
    d.arrow(lx + len / 2, vy - lh * 0.4, lx + len / 2, vy + lh * 0.4, eT.c, 2.2, 7 * k, lb);
    d.text(S.l(`×${S.n(MULT.N, 2)} en la pérdida, siempre`, `×${S.n(MULT.N, 2)} in the loss, every time`), lx + len + 8 * k, vy, { size: fz(S, 13), weight: 800, color: eT.ink, base: 'middle', a: lb, halo: p.stage, haloW: 4 });
  }
  // valores concretos (segmento «times10»): 10 M, 100 M y 1 000 M. Los puntos se marcan con un anillo y sus
  // valores van en una tablita arriba a la derecha (la zona vacía de la gráfica), sin encimarse en pantallas angostas.
  const va = fr(S, 'times10', 0.05, 0.2) * a;
  if (va > 0.01) {
    const { r } = g, rowH = lineH(S, 13.5) + 4 * k;
    const lab = (N: number) => count(S, N);
    const colW = Math.max(...[1e7, 1e8, 1e9].map((N) => d.measure(lab(N), { size: fz(S, 13), weight: 700, font: 'mono' }))) + 10 * k;
    const valW = d.measure('0.00', { size: fz(S, 13.5), weight: 800, font: 'mono' });
    const tw = colW + 14 * k + valW + 16 * k, tx = r.x + r.w - tw - 6 * k, ty = r.y + 8 * k;
    d.rect(tx, ty, tw, rowH * 4 + 6 * k, { fill: S.pal.surface, stroke: p.line, lw: 1, r: 3, a: va });
    d.text(S.l('N', 'N'), tx + 8 * k, ty + 4 * k + rowH / 2, { size: fz(S, 12), weight: 800, color: wT.ink, base: 'middle', a: va });
    d.text(S.l('pérdida', 'loss'), tx + tw - 8 * k, ty + 4 * k + rowH / 2, { size: fz(S, 12), weight: 800, color: eT.ink, align: 'right', base: 'middle', a: va });
    [1e7, 1e8, 1e9].forEach((N, i) => {
      const ai = va * fr(S, 'times10', 0.08 + i * 0.28, 0.2 + i * 0.28);
      if (ai < 0.01) return;
      const x = g.X(N), y = g.Y(lossN(N)), ry = ty + 4 * k + rowH * (i + 1.5);
      d.circle(x, y, 6.5 * k, { stroke: p.ink, lw: 2, a: ai });
      d.text(lab(N), tx + 8 * k, ry, { size: fz(S, 13), weight: 700, font: 'mono', color: wT.ink, base: 'middle', a: ai });
      d.text(S.n(lossN(N), 2), tx + tw - 8 * k, ry, { size: fz(S, 13.5), weight: 800, font: 'mono', color: eT.ink, align: 'right', base: 'middle', a: ai });
    });
  }
}

export function drawCurve(S: Frame) {
  const { d, pal: p } = S, k = kk(S);
  const g = curveGeo(S), { r } = g;
  drawModelRow(S, g);
  if (!S.on('axis-x')) return;
  // durante la regla graduada, la gráfica se apaga
  const ruler = fr(S, 'log-ruler', 0, 0.12) * (1 - fr(S, 'log-x', 0, 0.15));
  const plotA = 1 - ruler;
  d.withAlpha(plotA, () => axesAndTicks(S, g));
  if (ruler > 0.01) drawRuler(S, g, ruler);

  // la curva y los tamaños de modelo
  if (S.on('curve')) d.withAlpha(plotA, () => {
    const prog = fr(S, 'curve', 0.1, 0.75, 'lin');
    d.clip(r.x - 8 * k, r.y - 8 * k, r.w + 16 * k, r.h + 16 * k, () => {
      d.polyline(curvePts(g, SIZES[0], MEASURED_MAX, prog), tone(S, 'err').c, 3);
      SIZES.forEach((N, i) => {
        const ai = fr(S, 'curve', 0.1 + (0.65 * i) / SIZES.length, 0.16 + (0.65 * i) / SIZES.length);
        if (ai < 0.01) return;
        const hl = N <= 1e8 ? fr(S, 'squeeze', 0.35, 0.5) * (1 - fr(S, 'log-ruler', 0, 0.1)) : 0;
        d.circle(g.X(N), g.Y(lossN(N)), 4.2 * k, { fill: tone(S, 'w').c, stroke: p.stage, lw: 1.5, a: ai });
        if (hl > 0.01) d.circle(g.X(N), g.Y(lossN(N)), 8 * k, { stroke: p.ink, lw: 1.5, a: hl });
      });
    });
    provenance(S, S.l('curva: ajuste publicado por Kaplan et al. (2020)', 'curve: fit published by Kaplan et al. (2020)'), r.x + r.w, r.y - 6 * k, r.w * 0.6, { align: 'right', a: fr(S, 'curve', 0.6, 0.8) });
  });

  // rendimientos decrecientes: dos tramos de 500 M
  const dimA = fr(S, 'diminishing', 0.05, 0.2) * (1 - fr(S, 'squeeze', 0, 0.2));
  if (dimA > 0.01) {
    const span = (n1: number, n2: number, t: number, below: boolean) => {
      const x1 = n1 < 1e3 ? r.x : g.X(n1), x2 = g.X(n2), L1 = lossN(n1), L2 = lossN(n2), y1 = g.Y(L1), y2 = g.Y(L2);
      const h = Math.min(1, t * 2), v = Math.max(0, t * 2 - 1);
      d.line(x1, y1, x1 + (x2 - x1) * h, y1, p.mute, 1.6, [5, 4], dimA);
      if (v > 0) d.arrow(x2, y1, x2, y1 + (y2 - y1) * v, tone(S, 'err').c, 2.6, v > 0.98 ? 8 * k : 0.001, dimA);
      if (t > 0.95) {
        d.text(S.l('+500 M', '+500M'), (x1 + x2) / 2, y1 - 5 * k, { size: fz(S, 12.5), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'bottom', a: dimA, halo: p.stage, haloW: 4 });
        const drop = `−${S.n(L1 - L2, L1 - L2 < 0.1 ? 2 : 1)}`;
        d.text(drop, x2 + (below ? -6 : 7) * k, below ? y2 + 14 * k : (y1 + y2) / 2, { size: fz(S, 14), weight: 800, color: tone(S, 'err').ink, align: below ? 'right' : 'left', base: 'middle', a: dimA, halo: p.stage, haloW: 4 });
      }
    };
    span(SIZES[0], 5e8, fr(S, 'diminishing', 0.12, 0.45, 'io'), false);
    span(1e9, 1.5e9, fr(S, 'diminishing', 0.6, 0.85, 'io'), true);
  }

  // los pequeños, apretados contra la orilla
  const sq = fr(S, 'squeeze', 0.1, 0.3) * (1 - fr(S, 'log-ruler', 0, 0.15));
  if (sq > 0.01) {
    const x1 = Math.max(g.X(1.3e8), r.x + 14 * k);
    d.rect(r.x - 6 * k, r.y, x1 - r.x + 6 * k, r.h, { fill: alpha(tone(S, 'err').c, 0.1), stroke: tone(S, 'err').c, lw: 1.5, r: 3, dash: [4, 3], a: sq });
    const str = S.l('6 modelos en este hilo', '6 models in this sliver');
    const ly = r.y + r.h * 0.48;
    d.arrow(x1 + 34 * k, ly, x1 + 4 * k, ly, tone(S, 'err').c, 2, 7 * k, sq * fr(S, 'squeeze', 0.3, 0.45));
    d.text(str, x1 + 40 * k, ly, { size: fz(S, 13), weight: 800, color: tone(S, 'err').ink, base: 'middle', a: sq * fr(S, 'squeeze', 0.3, 0.45), halo: p.stage, haloW: 4 });
  }

  // «una recta»
  const rl = fr(S, 'log-y', 0.72, 0.88) * (1 - fr(S, 'straight', 0, 0.2));
  // los rótulos de la recta van arriba, en la zona vacía sobre la línea (abajo a la izquierda está la leyenda)
  if (rl > 0.01) chip(S, S.l('una línea recta', 'a straight line'), r.x + r.w * 0.31, r.y + 14 * k, 'err', { a: rl });

  // escalera ×10 → ×0.84 y valores concretos
  const stA = fr(S, 'straight', 0.1, 0.2) * (1 - fr(S, 'predict', 0, 0.25));
  if (stA > 0.01) drawStairs(S, g, stA);

  // «ley de escala»
  const lawA = fr(S, 'law', 0.05, 0.25) * (1 - fr(S, 'predict', 0, 0.25));
  if (lawA > 0.01) chip(S, S.l('ley de escala', 'scaling law'), r.x + r.w * 0.31, r.y + 14 * k, 'err', { a: lawA, size: 13 });

  // extrapolación: prolongar la recta más allá de lo medido
  if (S.on('predict')) {
    const a0 = fr(S, 'predict', 0.15, 0.3), ext = fr(S, 'predict', 0.3, 0.6, 'io');
    const xm = g.X(MEASURED_MAX);
    d.line(xm, r.y, xm, r.y + r.h, p.mute, 1.5, [3, 4], a0);
    fitText(S, S.l('medido hasta aquí', 'measured up to here'), xm - 6 * k, r.y + 4 * k, Math.max(60 * k, xm - r.x - 12 * k), { size: 12, weight: 700, color: p.mute, align: 'right', base: 'top', a: a0 });
    if (ext > 0.01) d.clip(r.x, r.y - 4 * k, r.w, r.h + 8 * k, () => d.polyline(curvePts(g, MEASURED_MAX, 1e12, ext), tone(S, 'err').c, 3, { dash: [7, 6] }));
    const ta = fr(S, 'predict', 0.62, 0.78);
    if (ta > 0.01) {
      const N = MEASURED_MAX * 100, x = g.X(N), y = g.Y(lossN(N));
      d.circle(x, y, 7 * k, { stroke: tone(S, 'err').c, lw: 2.5, fill: p.stage, a: ta });
      const s1 = S.l('×100 de tamaño', '×100 in size'), s2 = S.l(`pérdida prevista ≈ ${S.n(lossN(N), 2)}`, `predicted loss ≈ ${S.n(lossN(N), 2)}`);
      d.text(s1, x - 12 * k, y + 14 * k, { size: fz(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'middle', a: ta, halo: p.stage, haloW: 4 });
      d.text(s2, x - 12 * k, y + 14 * k + lineH(S, 13), { size: fz(S, 13), weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle', a: ta, halo: p.stage, haloW: 4 });
    }
  }
}
