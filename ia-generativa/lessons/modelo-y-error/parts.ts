// Piezas de dibujo de la lección «Un modelo y su error»: texto con tamaño efectivo, ejes, errores, asas y gráficas del panel lateral.
// Todo es función pura de lo que recibe (sin Math.random ni Date): la escena decide qué mostrar y cuándo.
import { Plot, alpha, clamp, lerp, regions, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { TextOpts } from '../../../../../theme/canvas/draw';
import { XS, nf, yAt, type Line } from './helpers';

// ── texto ────────────────────────────────────────────────────────────────
/** Texto con tamaño EFECTIVO en px (el kit multiplica `size` por S.u; aquí se compensa para no bajar de 12 px). */
export function tx(S: Frame, s: string, x: number, y: number, o: TextOpts & { px?: number } = {}) {
  const { px, ...rest } = o;
  return S.d.text(s, x, y, { ...rest, size: (px ?? 12) / S.u });
}
export const tw = (S: Frame, s: string, px = 12, o: TextOpts = {}) => S.d.measure(s, { ...o, size: px / S.u });
const ink = (S: Frame, t: Tone) => tone(S, t).ink;

// ── disposición ──────────────────────────────────────────────────────────
export interface Lay { all: Rect; main: Rect; aside: Rect; plot: Plot; xmax: number; ymax: number; k: number }
/** Gráfica principal + panel lateral (o inferior en teléfono). El panel aparece cuando entra la fórmula; antes la gráfica ocupa todo. */
export function layout(S: Frame): Lay {
  const R = regions(S, S.portrait ? 0.64 : 0.68);
  const k = S.at('formula', 0, 0.9);
  const lr = (a: Rect, b: Rect): Rect => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
  const main = lr(R.all, R.main);
  const z = S.at('limits', 0.15, 1.6);
  const xmax = lerp(10.5, 13, z), ymax = lerp(100, 112, z), u = S.u;
  const plot = new Plot(S, main, { xr: [0, xmax], yr: [0, ymax], pad: { l: 40 / u, r: 14 / u, t: 26 / u, b: 46 / u } });
  return { all: R.all, main, aside: R.aside, plot, xmax, ymax, k };
}

// ── ejes ─────────────────────────────────────────────────────────────────
export interface AxesOpts { xTicks: number[]; yTicks: number[]; xLabel: string; yLabel: string; xTone?: Tone; yTone?: Tone; grid?: number[]; note?: string }
/** Ejes de una gráfica con marcas y rótulos de 12–13 px efectivos. `outer` es el rectángulo que contiene la gráfica y sus rótulos. */
export function axesOf(S: Frame, plot: Plot, outer: Rect, o: AxesOpts, a = 1) {
  const { d, pal: p, u } = S, r = plot.r;
  d.withAlpha(a, () => {
    (o.grid ?? []).forEach((v) => d.line(r.x, plot.Y(v), r.x + r.w, plot.Y(v), p.line, 1, [2, 5]));
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    o.xTicks.forEach((v) => {
      const x = plot.X(v);
      d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5);
      tx(S, String(v), x, r.y + r.h + 7 * u, { px: 12, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
    o.yTicks.forEach((v) => {
      const y = plot.Y(v);
      d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5);
      tx(S, String(v), r.x - 7 * u, y, { px: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    });
    tx(S, o.xLabel, r.x + r.w, r.y + r.h + 26 * u, { px: 13, weight: 700, color: ink(S, o.xTone ?? 'ink'), align: 'right', base: 'top' });
    tx(S, o.yLabel, outer.x + 2, r.y - 8 * u, { px: 13, weight: 700, color: ink(S, o.yTone ?? 'ink'), base: 'bottom' });
    if (o.note) tx(S, o.note, r.x, r.y + r.h + 26 * u, { px: 12, weight: 600, color: p.mute, base: 'top' });
  });
}

export function drawAxes(S: Frame, P: Lay, a = 1) {
  const ticks: number[] = []; for (let v = 0; v <= P.xmax + 0.01; v += 2) ticks.push(v);
  axesOf(S, P.plot, P.main, {
    xTicks: ticks, yTicks: [0, 50, 100], grid: [25, 50, 75], xTone: 'sig', yTone: 'dat',
    xLabel: S.l('horas de estudio  x', 'hours of study  x'), yLabel: S.l('calificación  y', 'grade  y'),
    note: S.l('datos ilustrativos', 'illustrative data'),
  }, a);
}

// ── datos ────────────────────────────────────────────────────────────────
export function drawPoints(S: Frame, P: Lay, ys: number[], o: { appear?: (i: number) => number; ring?: number[]; a?: number } = {}) {
  ys.forEach((y, i) => {
    const a = (o.appear ? o.appear(i) : 1) * (o.a ?? 1);
    if (a <= 0.01) return;
    P.plot.datum(XS[i], y, 0, { r: 5 + 1.2 * (1 - a), a, ring: o.ring?.includes(i) });
  });
}

// ── recta ────────────────────────────────────────────────────────────────
export function drawLine(S: Frame, P: Lay, l: Line, o: { reveal?: number; t?: Tone; lw?: number; dash?: number[]; a?: number; from?: number; to?: number } = {}) {
  const x0 = o.from ?? 0, x1 = lerp(x0, o.to ?? P.xmax, o.reveal ?? 1);
  if (x1 <= x0) return;
  P.plot.line(x0, yAt(l, x0), x1, yAt(l, x1), o.t ?? 'w', o.lw ?? 3.4, o.dash, o.a ?? 1);
}

// ── errores: segmentos y cuadrados ───────────────────────────────────────
/** Un segmento por estudiante (de la predicción al dato) y, opcionalmente, su cuadrado (lado = error, en píxeles).
 *  Positivo (dato sobre la recta): línea continua. Negativo: línea discontinua. */
export function errorMarks(S: Frame, P: Lay, l: Line, ys: number[], o: { seg: (i: number) => number; sq?: (i: number) => number; hot?: number[]; sqA?: number; only?: number[]; dashNeg?: boolean }) {
  const { d, u } = S, plot = P.plot, er = tone(S, 'err');
  const mid = (plot.r.x + plot.r.x + plot.r.w) / 2;
  const idx = o.only ?? ys.map((_, i) => i);
  plot.clip(() => {
    // cuadrados debajo
    idx.forEach((i) => {
      const s = o.sq ? o.sq(i) : 0; if (s <= 0.01) return;
      const px = plot.X(XS[i]), yP = plot.Y(ys[i]), yL = plot.Y(yAt(l, XS[i])), side = Math.abs(yP - yL), dir = px < mid ? 1 : -1, hot = o.hot?.includes(i);
      const x0 = dir > 0 ? px : px - side * s;
      d.rect(x0, Math.min(yP, yL), side * s, side, { fill: alpha(er.c, (hot ? 0.3 : 0.15) * (o.sqA ?? 1)), stroke: er.c, lw: hot ? 2.4 : 1.2, a: (hot ? 1 : 0.85) * (o.sqA ?? 1) });
    });
    // segmentos encima: crecen desde la recta hacia el dato
    idx.forEach((i) => {
      const g = o.seg(i); if (g <= 0.01) return;
      const px = plot.X(XS[i]), yP = plot.Y(ys[i]), yL = plot.Y(yAt(l, XS[i])), e = ys[i] - yAt(l, XS[i]);
      d.line(px, yL, px, lerp(yL, yP, g), er.c, Math.max(2, 2.4 * u), e < 0 && o.dashNeg !== false ? [5, 4] : undefined);
    });
  });
}

/** Signos (+ / −) junto a cada segmento: un canal más, además del trazo continuo o discontinuo. */
export function signGlyphs(S: Frame, P: Lay, l: Line, ys: number[], a: (i: number) => number) {
  const plot = P.plot, er = tone(S, 'err');
  ys.forEach((y, i) => {
    const al = a(i); if (al <= 0.01) return;
    const e = y - yAt(l, XS[i]); if (Math.abs(e) < 1.2) return;
    const x = plot.X(XS[i]), ym = (plot.Y(y) + plot.Y(yAt(l, XS[i]))) / 2;
    S.d.withAlpha(al, () => tx(S, e > 0 ? '+' : '−', x - 10 * S.u, ym, { px: 14, weight: 800, color: er.ink, align: 'center', base: 'middle', halo: S.pal.stage, haloW: 4 }));
  });
}

// ── asas arrastrables ────────────────────────────────────────────────────
export function handleR(S: Frame) { return Math.max(11, S.hitR * 0.55); }
/** Asa con una letra dentro (b o w). `pulse` dibuja un anillo que invita a tocar. */
export function drawHandle(S: Frame, x: number, y: number, letter: string, t: Tone, o: { a?: number; pulse?: number; active?: boolean } = {}) {
  const { d, pal: p } = S, c = tone(S, t), r = handleR(S);
  d.withAlpha(o.a ?? 1, () => {
    if (o.pulse) { const k = (S.clock * 0.9) % 1; d.circle(x, y, r + (S.hitR - r + 4) * k, { stroke: c.c, lw: 2, a: (1 - k) * o.pulse }); }
    d.circle(x, y, S.hitR, { stroke: c.c, lw: 1, dash: [3, 4], a: S.coarse || o.active ? 0.5 : 0.25 });
    d.circle(x, y, r + (o.active ? 2 : 0), { fill: c.c, stroke: p.stage, lw: 2 });
    tx(S, letter, x, y + 0.5, { px: 13, weight: 800, color: p.stage, align: 'center', base: 'middle' });
  });
}

// ── tarjeta de fórmula ───────────────────────────────────────────────────
export type Part = [text: string, t: Tone | 'plain'];
export function formulaCard(S: Frame, r: Rect, parts: Part[], o: { px?: number; a?: number; sub?: Part[]; subPx?: number } = {}): number {
  const { d, pal: p } = S;
  const wOf = (ps: Part[], pxs: number) => ps.reduce((a, [t]) => a + tw(S, t, pxs, { weight: 700, font: 'mono' }), 0);
  // el texto se achica (hasta 12 px) si no cabe en la tarjeta
  const fit = (ps: Part[], pxs: number) => { while (pxs > 12 && wOf(ps, pxs) > r.w - 20) pxs -= 1; return pxs; };
  const px = fit(parts, o.px ?? 20), subPx = o.sub ? fit(o.sub, o.subPx ?? 14) : 0;
  const h = o.sub ? px + subPx + 26 : px + 20;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    const line = (ps: Part[], pxs: number, cy: number) => {
      let x = r.x + r.w / 2 - wOf(ps, pxs) / 2;
      ps.forEach(([t, k]) => { tx(S, t, x, cy, { px: pxs, weight: 700, font: 'mono', color: k === 'plain' ? p.ink : ink(S, k), base: 'middle' }); x += tw(S, t, pxs, { weight: 700, font: 'mono' }); });
    };
    line(parts, px, r.y + (o.sub ? 10 + px / 2 : h / 2));
    if (o.sub) line(o.sub, subPx, r.y + h - 10 - subPx / 2);
  });
  return h;
}

// ── lectura numérica ─────────────────────────────────────────────────────
export interface Item { label: string; value: string; t?: Tone; big?: boolean; sub?: string }
/** Rejilla de lecturas (rótulo pequeño + valor en mono). Devuelve el alto usado. */
export function readouts(S: Frame, r: Rect, items: Item[], o: { cols: number; a?: number; px?: number; flat?: boolean }): number {
  const { pal: p } = S, cw = r.w / o.cols, vpx = o.px ?? (S.portrait || S.W < 640 ? 19 : S.W < 820 ? 22 : 26);
  const rows = Math.ceil(items.length / o.cols), rh = (it?: Item) => (it?.big && !o.flat ? vpx * 1.5 + 30 : vpx + 30);
  let y = r.y;
  S.d.withAlpha(o.a ?? 1, () => {
    for (let row = 0; row < rows; row++) {
      let hRow = 0;
      for (let c = 0; c < o.cols; c++) {
        const it = items[row * o.cols + c]; if (!it) continue;
        const x = r.x + c * cw, big = it.big && !o.flat ? 1.45 : 1, pxv = vpx * big;
        tx(S, it.label, x, y, { px: 12, weight: 700, color: p.mute, base: 'top', w: cw - 6 });
        tx(S, it.value, x, y + 15, { px: pxv, weight: 700, font: 'mono', color: it.t ? ink(S, it.t) : p.ink, base: 'top' });
        if (it.sub) tx(S, it.sub, x, y + 15 + pxv * 1.25, { px: 12, weight: 600, color: p.ink2, base: 'top', w: cw - 6 });
        hRow = Math.max(hRow, rh(it) + (it.sub ? 15 : 0));
      }
      y += hRow;
    }
  });
  return y - r.y;
}

// ── gráficas del panel lateral ───────────────────────────────────────────
/** Barras por estudiante: error con signo, absoluto o al cuadrado. `scale` es el valor que llena la altura. */
export function errBars(S: Frame, r: Rect, vals: number[], o: { kind: 'signed' | 'abs' | 'sq'; scale: number; title: string; hot?: number[]; a?: number; show?: (i: number) => number }) {
  const { d, pal: p } = S, er = tone(S, 'err'), n = vals.length, gap = 3, bw = Math.max(5, (r.w - gap * (n - 1)) / n);
  const top = r.y + 18, area = Math.max(20, r.h - 18 - 2), base = o.kind === 'signed' ? top + area / 2 : top + area;
  const k = (o.kind === 'signed' ? area / 2 : area) / o.scale;
  d.withAlpha(o.a ?? 1, () => {
    tx(S, o.title, r.x, r.y, { px: 12, weight: 700, color: p.mute, base: 'top', w: r.w });
    d.line(r.x, base, r.x + r.w, base, p.lineStrong, 1.5);
    vals.forEach((v, i) => {
      const a = o.show ? o.show(i) : 1; if (a <= 0.01) return;
      const h = clamp(Math.abs(v) * k, 0, o.kind === 'signed' ? area / 2 : area) * a, x = r.x + i * (bw + gap), neg = v < 0 && o.kind === 'signed';
      const y = neg ? base : base - h;
      d.rect(x, y, bw, Math.max(h, 0.5), { fill: alpha(er.c, neg ? 0.25 : 0.6), stroke: er.c, lw: 1.2, dash: neg ? [3, 2] : undefined });
      if (o.hot?.includes(i)) d.rect(x - 2, Math.min(y, base) - 2, bw + 4, Math.max(h, 0.5) + 4, { stroke: p.ink, lw: 1.5 });
    });
  });
}

/** Barras horizontales de comparación (valor con su rótulo encima). */
export function hBars(S: Frame, r: Rect, rows: { label: string; value: number; t: Tone; hot?: boolean; a?: number }[], max: number) {
  const { d, pal: p, u } = S, rh = Math.min(46 * u, r.h / rows.length), bh = 14 * u;
  rows.forEach((row, i) => {
    const y = r.y + i * rh, c = tone(S, row.t), w = clamp(row.value / max) * r.w;
    d.withAlpha(row.a ?? 1, () => {
      tx(S, row.label, r.x, y, { px: 12, weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, base: 'top' });
      tx(S, nf(S, row.value, 1), r.x + r.w, y, { px: 12, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'top' });
      d.rect(r.x, y + 17, r.w, bh, { fill: p.surface2 });
      d.rect(r.x, y + 17, Math.max(2, w), bh, { fill: row.hot ? c.c : alpha(c.c, 0.55) });
    });
  });
}

/** Barra apilada: aporte de cada estudiante al total. El estudiante `focus` va primero y resaltado. */
export function stackBar(S: Frame, r: Rect, share: number[], focus: number, label: string, a = 1) {
  const { d, pal: p } = S, er = tone(S, 'err'), order = [focus, ...share.map((_, i) => i).filter((i) => i !== focus)];
  d.withAlpha(a, () => {
    tx(S, label, r.x, r.y, { px: 12, weight: 700, color: p.ink2, base: 'top' });
    const y = r.y + 18, h = 24 * S.u;
    let x = r.x;
    order.forEach((i, j) => {
      const w = share[i] * r.w;
      d.rect(x, y, Math.max(0.8, w), h, i === focus ? { fill: er.c } : { fill: alpha(er.c, j % 2 ? 0.22 : 0.36), stroke: p.stage, lw: 0.8 });
      x += w;
    });
    d.rect(r.x, y, r.w, h, { stroke: p.lineStrong, lw: 1 });
    const pct = Math.round(share[focus] * 100), txt = S.l(`${pct} %`, `${pct}%`), wFocus = share[focus] * r.w;
    if (wFocus > 44) tx(S, txt, r.x + wFocus / 2, y + h / 2, { px: 14, weight: 800, font: 'mono', color: p.stage, align: 'center', base: 'middle' });
    else tx(S, txt, r.x + wFocus + 6, y + h / 2, { px: 14, weight: 800, font: 'mono', color: er.ink, base: 'middle' });
  });
}

/** Campana normal con los errores de la mejor recta como marcas sobre el eje. */
export function bell(S: Frame, r: Rect, resid: number[], sigma: number, a = 1, focus = -1) {
  const { d, pal: p, u } = S, er = tone(S, 'err'), lat = tone(S, 'lat'), half = 27, X = (v: number) => r.x + ((v + half) / (2 * half)) * r.w;
  const baseY = r.y + r.h - 34 * u, hMax = Math.max(30, r.h - 74 * u);
  d.withAlpha(a, () => {
    tx(S, S.l('errores de la mejor recta', 'errors of the best line'), r.x, r.y, { px: 12, weight: 700, color: p.mute, base: 'top', w: r.w });
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) { const v = -half + (2 * half * i) / 60; pts.push([X(v), baseY - hMax * Math.exp(-(v * v) / (2 * sigma * sigma))]); }
    d.polygon([[X(-half), baseY], ...pts, [X(half), baseY]], { fill: alpha(lat.c, 0.14) });
    d.polyline(pts, lat.c, 2);
    d.line(r.x, baseY, r.x + r.w, baseY, p.lineStrong, 1.5);
    d.line(X(0), baseY, X(0), baseY + 5 * u, p.lineStrong, 1.5);
    tx(S, '0', X(0), baseY + 8 * u, { px: 12, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    resid.forEach((e, i) => {
      const x = X(clamp(e, -half, half)), hot = i === focus;
      d.line(x, baseY, x, baseY - (hot ? 26 : 14) * u, hot ? er.c : p.ink2, hot ? 3 : 2);
      d.circle(x, baseY - (hot ? 26 : 14) * u, (hot ? 4 : 2.6) * u, { fill: hot ? er.c : p.ink2 });
    });
    tx(S, S.l('curva normal', 'normal curve'), X(0) + 12 * u, baseY - hMax * 0.92, { px: 12, weight: 700, color: lat.ink, base: 'middle', halo: p.stage, haloW: 4 });
    if (focus >= 0) tx(S, S.l(`${nf(S, resid[focus], 1)}: el atípico`, `${nf(S, resid[focus], 1)}: the outlier`), X(resid[focus]) + 8 * u, baseY - 40 * u, { px: 12, weight: 700, color: er.ink, base: 'bottom', halo: p.stage, haloW: 4 });
  });
}

