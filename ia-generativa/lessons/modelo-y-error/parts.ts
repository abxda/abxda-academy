// Piezas de dibujo de la lección «Un modelo y su error»: texto con tamaño efectivo, ejes, tabla de datos, escalones de la recta,
// errores, tarjetas, lecturas y gráficas del panel lateral.
// Todo es función pura de lo que recibe (sin azar ni reloj propios): la escena decide qué mostrar y cuándo.
import { Plot, alpha, clamp, lerp, regions, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { TextOpts } from '../../../../../theme/canvas/draw';
import { XS, fr, nf, yAt, type Line } from './helpers';

// ── texto ────────────────────────────────────────────────────────────────
/** Texto con tamaño EFECTIVO en px (el kit multiplica `size` por S.u; aquí se compensa para no bajar de 12 px). */
export function tx(S: Frame, s: string, x: number, y: number, o: TextOpts & { px?: number } = {}) {
  const { px, ...rest } = o;
  return S.d.text(s, x, y, { ...rest, size: (px ?? 12) / S.u });
}
export const tw = (S: Frame, s: string, px = 12, o: TextOpts = {}) => S.d.measure(s, { ...o, size: px / S.u });
const ink = (S: Frame, t: Tone) => tone(S, t).ink;
/** Etiqueta con fondo, en tamaño efectivo. */
export function chipTag(S: Frame, s: string, x: number, y: number, t: Tone | 'plain', o: { align?: CanvasTextAlign; a?: number; px?: number } = {}) {
  const c = t === 'plain' ? null : tone(S, t);
  return S.d.tag(s, x, y, { color: c ? c.ink : S.pal.ink2, fill: c ? c.soft : S.pal.surface, stroke: c ? c.c : S.pal.line, align: o.align, a: o.a, size: (o.px ?? 12) / S.u });
}

// ── disposición ──────────────────────────────────────────────────────────
export interface Lay { all: Rect; main: Rect; aside: Rect; plot: Plot; xmax: number; ymax: number }
/** Gráfica principal + panel lateral (o inferior en teléfono). La disposición no cambia en toda la lección (nada salta);
 *  solo en «limits» la gráfica se aleja para mostrar lo que queda fuera de los datos. */
export function layout(S: Frame): Lay {
  const R = regions(S, S.portrait ? 0.64 : 0.68);
  const z = S.on('limits') ? fr(S, 'limits', 0.04, 0.3, 'io') : 0;
  const xmax = lerp(10.5, 13, z), ymax = lerp(100, 112, z), u = S.u;
  const plot = new Plot(S, R.main, { xr: [0, xmax], yr: [0, ymax], pad: { l: 40 / u, r: 14 / u, t: 26 / u, b: 46 / u } });
  return { all: R.all, main: R.main, aside: R.aside, plot, xmax, ymax };
}

// ── ejes ─────────────────────────────────────────────────────────────────
export interface AxesOpts {
  xTicks: number[]; yTicks: number[]; xLabel: string; yLabel: string; xTone?: Tone; yTone?: Tone; grid?: number[]; note?: string;
  /** opacidad de cada eje (se presentan uno por uno) y de la nota «datos ilustrativos» */
  ax?: number; ay?: number; noteA?: number;
}
/** Ejes de una gráfica con marcas y rótulos de 12–13 px efectivos. `outer` es el rectángulo que contiene la gráfica y sus rótulos. */
export function axesOf(S: Frame, plot: Plot, outer: Rect, o: AxesOpts, a = 1) {
  const { d, pal: p, u } = S, r = plot.r, ax = (o.ax ?? 1) * a, ay = (o.ay ?? 1) * a;
  if (ax * ay > 0.01) d.withAlpha(ax * ay, () => (o.grid ?? []).forEach((v) => d.line(r.x, plot.Y(v), r.x + r.w, plot.Y(v), p.line, 1, [2, 5])));
  if (ax > 0.01) d.withAlpha(ax, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    o.xTicks.forEach((v) => {
      const x = plot.X(v);
      d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5);
      tx(S, String(v), x, r.y + r.h + 7 * u, { px: 12, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
    tx(S, o.xLabel, r.x + r.w, r.y + r.h + 26 * u, { px: 13, weight: 700, color: ink(S, o.xTone ?? 'ink'), align: 'right', base: 'top' });
  });
  if (ay > 0.01) d.withAlpha(ay, () => {
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    o.yTicks.forEach((v) => {
      const y = plot.Y(v);
      d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5);
      tx(S, String(v), r.x - 7 * u, y, { px: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    });
    tx(S, o.yLabel, outer.x + 2, r.y - 8 * u, { px: 13, weight: 700, color: ink(S, o.yTone ?? 'ink'), base: 'bottom' });
  });
  const na = (o.noteA ?? 1) * a;
  if (o.note && na > 0.01) tx(S, o.note, r.x, r.y + r.h + 26 * u, { px: 12, weight: 600, italic: true, color: p.mute, base: 'top', a: na });
}

/** Ejes de la gráfica principal. `hx`/`hy`: flechas «más horas» y «mejor nota» que explican cada eje al presentarlo. */
export function drawAxes(S: Frame, P: Lay, o: { ax: number; ay: number; hx?: number; hy?: number; note?: number; letters?: boolean }) {
  const ticks: number[] = []; for (let v = 0; v <= P.xmax + 0.01; v += 2) ticks.push(v);
  const narrow = S.portrait || S.W < 640;
  axesOf(S, P.plot, P.main, {
    xTicks: ticks, yTicks: [0, 50, 100], grid: [25, 50, 75], xTone: 'sig', yTone: 'dat',
    xLabel: S.l('horas de estudio', 'hours of study') + (o.letters ? '  x' : ''), yLabel: S.l('calificación', 'grade'),
    note: narrow ? undefined : S.l('datos ilustrativos', 'illustrative data'), ax: o.ax, ay: o.ay, noteA: o.note,
  });
  // en pantallas angostas la nota va arriba a la derecha para no chocar con el rótulo del eje horizontal
  const r = P.plot.r, u = S.u;
  if (narrow && (o.note ?? 0) > 0.01) tx(S, S.l('datos ilustrativos', 'illustrative data'), r.x + r.w, r.y - 8 * u, { px: 12, weight: 600, italic: true, color: S.pal.mute, align: 'right', base: 'bottom', a: o.note });
  const sgn = tone(S, 'sig'), dat = tone(S, 'dat');
  if ((o.hx ?? 0) > 0.01) {
    const y = r.y + r.h - 16 * u, x0 = r.x + r.w * 0.5, x1 = r.x + r.w - 10 * u;
    S.d.arrow(x0, y, x1, y, sgn.c, 2.5, 9 * u, o.hx);
    tx(S, S.l('más horas', 'more hours'), x0, y - 7 * u, { px: 12, weight: 800, color: sgn.ink, base: 'bottom', halo: S.pal.stage, haloW: 4, a: o.hx });
  }
  if ((o.hy ?? 0) > 0.01) {
    const x = r.x + 16 * u, y0 = r.y + r.h * 0.62, y1 = r.y + r.h * 0.18;
    S.d.arrow(x, y0, x, y1, dat.c, 2.5, 9 * u, o.hy);
    tx(S, S.l('mejor nota', 'better grade'), x + 9 * u, (y0 + y1) / 2, { px: 12, weight: 800, color: dat.ink, base: 'middle', halo: S.pal.stage, haloW: 4, a: o.hy });
  }
}

// ── datos ────────────────────────────────────────────────────────────────
export function drawPoints(S: Frame, P: Lay, ys: number[], o: { appear?: (i: number) => number; ring?: number[]; a?: number } = {}) {
  ys.forEach((y, i) => {
    const a = (o.appear ? o.appear(i) : 1) * (o.a ?? 1);
    if (a <= 0.01) return;
    P.plot.datum(XS[i], y, 0, { r: 5, a, ring: o.ring?.includes(i) });
  });
}

/** Tabla de dos columnas (p. ej. horas | calificación). Elige su forma según el espacio: 10 filas, dos bloques de 5 filas,
 *  2 filas × 10 columnas o dos grupos de 2 × 5. `diff` son rótulos entre filas consecutivas (p. ej. «+5»). Devuelve el alto usado. */
export interface TableOpts { heads: [string, string]; a: string[]; b: string[]; tones?: [Tone, Tone]; appear?: (i: number) => number; hot?: (i: number) => number; diff?: string[]; diffA?: (i: number) => number; maxRow?: number }
export function drawTable(S: Frame, r: Rect, o: TableOpts): number {
  const { d, pal: p } = S, n = o.a.length, [t1, t2] = o.tones ?? ['sig', 'dat'];
  const headW = Math.max(tw(S, o.heads[0], 12, { weight: 700 }), tw(S, o.heads[1], 12, { weight: 700 })) + 10;
  const diffW = o.diff ? 38 : 0, minRow = 18, maxRow = o.maxRow ?? 26;
  const hot = (i: number) => (o.hot ? o.hot(i) : 0), ap = (i: number) => (o.appear ? o.appear(i) : 1);
  const cell = (s: string, x: number, y: number, t: Tone, i: number, px: number) => {
    const a = ap(i); if (a <= 0.01) return;
    tx(S, s, x, y, { px, weight: hot(i) > 0.5 ? 800 : 600, font: 'mono', color: ink(S, t), align: 'center', base: 'middle', a });
  };
  // ── vertical: una columna por variable ──
  const blocks = r.h >= (n + 1) * minRow + 4 && r.w >= 120 + diffW ? 1 : r.h >= (Math.ceil(n / 2) + 1) * minRow + 4 && r.w >= 250 + 2 * diffW ? 2 : 0;
  if (blocks) {
    const per = Math.ceil(n / blocks), rh = Math.min(maxRow, (r.h - 4) / (per + 1)), px = clamp(rh * 0.6, 12, 17);
    const gap = 14, bw = Math.min(260, (r.w - gap * (blocks - 1)) / blocks), cw = (bw - diffW) / 2;
    const x0 = r.x + (r.w - (bw * blocks + gap * (blocks - 1))) / 2;
    for (let k = 0; k < blocks; k++) {
      const bx = x0 + k * (bw + gap);
      tx(S, o.heads[0], bx + cw / 2, r.y + rh / 2, { px: 12, weight: 700, color: ink(S, t1), align: 'center', base: 'middle' });
      tx(S, o.heads[1], bx + cw * 1.5, r.y + rh / 2, { px: 12, weight: 700, color: ink(S, t2), align: 'center', base: 'middle' });
      d.line(bx, r.y + rh, bx + cw * 2, r.y + rh, p.lineStrong, 1.2);
      for (let j = 0; j < per; j++) {
        const i = k * per + j; if (i >= n) break;
        const cy = r.y + rh * (j + 1.5), h = hot(i);
        if (h > 0.01) d.rect(bx, cy - rh / 2 + 1, cw * 2, rh - 2, { fill: alpha(tone(S, 'sig').c, 0.18 * h), stroke: tone(S, 'sig').c, lw: 1.5, r: 3, a: h });
        cell(o.a[i], bx + cw / 2, cy, t1, i, px); cell(o.b[i], bx + cw * 1.5, cy, t2, i, px);
        if (o.diff && i < n - 1 && j < per - 1) {
          const da = o.diffA ? o.diffA(i) : 1;
          if (da > 0.01) tx(S, o.diff[i], bx + cw * 2 + 6, cy + rh / 2, { px: 12, weight: 800, font: 'mono', color: ink(S, 'w'), base: 'middle', a: da });
        }
      }
    }
    return rh * (per + 1);
  }
  // ── horizontal: una fila por variable ──
  const groups = (r.w - headW) / n >= 30 ? 1 : 2, per = Math.ceil(n / groups);
  const cw = Math.min(56, (r.w - headW) / per), rh = Math.min(maxRow, Math.max(minRow, (r.h - (groups - 1) * 8) / (groups * (o.diff ? 3 : 2)))), px = clamp(rh * 0.62, 12, 16);
  let y = r.y;
  for (let k = 0; k < groups; k++) {
    tx(S, o.heads[0], r.x, y + rh / 2, { px: 12, weight: 700, color: ink(S, t1), base: 'middle' });
    tx(S, o.heads[1], r.x, y + rh * 1.5, { px: 12, weight: 700, color: ink(S, t2), base: 'middle' });
    d.line(r.x, y + rh, r.x + headW + cw * per, y + rh, p.line, 1);
    for (let j = 0; j < per; j++) {
      const i = k * per + j; if (i >= n) break;
      const cx = r.x + headW + cw * (j + 0.5), h = hot(i);
      if (h > 0.01) d.rect(cx - cw / 2 + 1, y, cw - 2, rh * 2, { fill: alpha(tone(S, 'sig').c, 0.18 * h), stroke: tone(S, 'sig').c, lw: 1.5, r: 3, a: h });
      cell(o.a[i], cx, y + rh / 2, t1, i, px); cell(o.b[i], cx, y + rh * 1.5, t2, i, px);
      if (o.diff && i < n - 1 && j < per - 1) {
        const da = o.diffA ? o.diffA(i) : 1;
        if (da > 0.01) tx(S, o.diff[i], cx + cw / 2, y + rh * 2.5, { px: 12, weight: 800, font: 'mono', color: ink(S, 'w'), align: 'center', base: 'middle', a: da });
      }
    }
    y += rh * (o.diff ? 3 : 2) + 8;
  }
  return y - 8 - r.y;
}

// ── recta ────────────────────────────────────────────────────────────────
export function drawLine(S: Frame, P: Lay, l: Line, o: { reveal?: number; t?: Tone; lw?: number; dash?: number[]; a?: number; from?: number; to?: number } = {}) {
  const x0 = o.from ?? 0, x1 = lerp(x0, o.to ?? P.xmax, o.reveal ?? 1);
  if (x1 <= x0) return;
  P.plot.line(x0, yAt(l, x0), x1, yAt(l, x1), o.t ?? 'w', o.lw ?? 3.4, o.dash, o.a ?? 1);
}

/** Escalones bajo la recta: por cada hora a la derecha (tramo horizontal), la subida del peso (tramo vertical). */
export function drawStairs(S: Frame, P: Lay, l: Line, from: number, to: number, appear: (k: number) => number) {
  const plot = P.plot, sgn = tone(S, 'sig'), w = tone(S, 'w');
  plot.clip(() => {
    for (let k = from; k < to; k++) {
      const a = appear(k); if (a <= 0.01) continue;
      const y0 = yAt(l, k), y1 = yAt(l, k + 1);
      S.d.line(plot.X(k), plot.Y(y0), plot.X(lerp(k, k + 1, a)), plot.Y(y0), sgn.c, 2, [4, 3]);
      if (a > 0.5) S.d.line(plot.X(k + 1), plot.Y(y0), plot.X(k + 1), plot.Y(lerp(y0, y1, (a - 0.5) * 2)), w.c, 2.6);
    }
  });
}

/** Un escalón destacado entre x0 y x0 + 1, con «1 hora» bajo el tramo horizontal y la subida junto al vertical. */
export function drawStep(S: Frame, P: Lay, l: Line, x0: number, o: { a?: number; rise: string; run?: string; lw?: number }) {
  const { u } = S, plot = P.plot, sgn = tone(S, 'sig'), w = tone(S, 'w'), y0 = yAt(l, x0), y1 = yAt(l, x0 + 1);
  S.d.withAlpha(o.a ?? 1, () => {
    plot.line(x0, y0, x0 + 1, y0, 'sig', o.lw ?? 2.6, [5, 3]);
    plot.line(x0 + 1, y0, x0 + 1, y1, 'w', (o.lw ?? 2.6) + 0.6);
    // los rótulos van del lado libre: si la recta sube, por debajo del tramo horizontal (ahí no pasa la recta); si baja, por encima
    const down = y1 < y0 - 1e-9;
    tx(S, o.run ?? (plot.X(x0 + 1) - plot.X(x0) < 44 ? '1 h' : S.l('1 hora', '1 hour')), plot.X(x0 + 0.5), plot.Y(y0) + (down ? -6 : 6) * u, { px: 12, weight: 800, color: sgn.ink, align: 'center', base: down ? 'bottom' : 'top', halo: S.pal.stage, haloW: 4 });
    tx(S, o.rise, plot.X(x0 + 1) + 7 * u, plot.Y(y0) + (down ? -3 : 3) * u, { px: 14, weight: 800, font: 'mono', color: w.ink, base: down ? 'bottom' : 'top', halo: S.pal.stage, haloW: 4 });
  });
}

/** Barra vertical que muestra una altura (de y0 a y1) en la columna x, con su rótulo a la derecha. */
export function heightBar(S: Frame, P: Lay, x: number, y0: number, y1: number, t: Tone, label: string, o: { a?: number; grow?: number; fill?: number } = {}) {
  const { u } = S, plot = P.plot, c = tone(S, t), g = o.grow ?? 1, yt = lerp(y0, y1, g), bw = 7 * u, px = plot.X(x);
  S.d.withAlpha(o.a ?? 1, () => {
    S.d.rect(px - bw / 2, Math.min(plot.Y(y0), plot.Y(yt)), bw, Math.abs(plot.Y(yt) - plot.Y(y0)), { fill: alpha(c.c, o.fill ?? 0.55), stroke: c.c, lw: 1.5 });
    if (g > 0.95) tx(S, label, px + bw / 2 + 6 * u, (plot.Y(y0) + plot.Y(y1)) / 2, { px: 13, weight: 800, color: c.ink, base: 'middle', halo: S.pal.stage, haloW: 4 });
  });
}

// ── errores: segmentos y cuadrados ───────────────────────────────────────
/** Un segmento por estudiante (de la predicción al dato) y, opcionalmente, su cuadrado (lado = error, en píxeles).
 *  Positivo (dato sobre la recta): línea continua. Negativo: línea discontinua. */
export function errorMarks(S: Frame, P: Lay, l: Line, ys: number[], o: { seg: (i: number) => number; sq?: (i: number) => number; hot?: number[]; sqA?: number; only?: number[] }) {
  const { d, u } = S, plot = P.plot, er = tone(S, 'err');
  const mid = (plot.r.x + plot.r.x + plot.r.w) / 2;
  const idx = o.only ?? ys.map((_, i) => i);
  plot.clip(() => {
    idx.forEach((i) => {
      const s = o.sq ? o.sq(i) : 0; if (s <= 0.01) return;
      const px = plot.X(XS[i]), yP = plot.Y(ys[i]), yL = plot.Y(yAt(l, XS[i])), side = Math.abs(yP - yL), dir = px < mid ? 1 : -1, hot = o.hot?.includes(i);
      const x0 = dir > 0 ? px : px - side * s;
      d.rect(x0, Math.min(yP, yL), side * s, side, { fill: alpha(er.c, (hot ? 0.3 : 0.15) * (o.sqA ?? 1)), stroke: er.c, lw: hot ? 2.4 : 1.2, a: (hot ? 1 : 0.85) * (o.sqA ?? 1) });
    });
    idx.forEach((i) => {
      const g = o.seg(i); if (g <= 0.01) return;
      const px = plot.X(XS[i]), yP = plot.Y(ys[i]), yL = plot.Y(yAt(l, XS[i])), e = ys[i] - yAt(l, XS[i]);
      d.line(px, yL, px, lerp(yL, yP, g), er.c, Math.max(2, 2.4 * u), e < 0 ? [5, 4] : undefined);
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

/** Cuadrícula n × n de celdas: el cuadrado de un error, contado en celdas. */
export function gridSq(S: Frame, x: number, y: number, n: number, cell: number, o: { a?: number; dash?: boolean } = {}) {
  const { d, pal: p } = S, er = tone(S, 'err');
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d.rect(x + i * cell, y + j * cell, cell - 1.5, cell - 1.5, { fill: alpha(er.c, 0.45) });
    d.rect(x - 1, y - 1, n * cell + 0.5, n * cell + 0.5, { stroke: er.c, lw: 1.6, dash: o.dash ? [4, 3] : undefined });
    void p;
  });
}

// ── tarjeta de fórmula ───────────────────────────────────────────────────
export type Part = [text: string, t: Tone | 'plain'];
/** Tarjeta con una línea principal y, opcionalmente, una secundaria. `pa(i)` da la opacidad de cada parte de la línea principal
 *  (para revelarla por partes) y `hl(i)` su realce (recuadro detrás). Devuelve la altura usada. */
export function formulaCard(S: Frame, r: Rect, parts: Part[], o: { px?: number; a?: number; sub?: Part[]; subPx?: number; pa?: (i: number) => number; hl?: (i: number) => number; subA?: number } = {}): number {
  const { d, pal: p } = S;
  const wOf = (ps: Part[], pxs: number) => ps.reduce((a, [t]) => a + tw(S, t, pxs, { weight: 700, font: 'mono' }), 0);
  const fit = (ps: Part[], pxs: number) => { while (pxs > 12 && wOf(ps, pxs) > r.w - 20) pxs -= 1; return pxs; };
  const px = fit(parts, o.px ?? 20), subPx = o.sub ? fit(o.sub, o.subPx ?? 14) : 0;
  const h = o.sub ? px + subPx + 26 : px + 20;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    const line = (ps: Part[], pxs: number, cy: number, main: boolean) => {
      let x = r.x + r.w / 2 - wOf(ps, pxs) / 2;
      ps.forEach(([t, k], i) => {
        const w = tw(S, t, pxs, { weight: 700, font: 'mono' }), a = main && o.pa ? o.pa(i) : main ? 1 : o.subA ?? 1, hh = main && o.hl ? o.hl(i) : 0;
        if (hh > 0.01) d.rect(x - 3, cy - pxs * 0.72, w + 6, pxs * 1.44, { fill: alpha(k === 'plain' ? p.ink : tone(S, k).c, 0.2 * hh), stroke: k === 'plain' ? p.ink : tone(S, k).c, lw: 1.8, r: 3, a: hh });
        if (a > 0.01) tx(S, t, x, cy, { px: pxs, weight: 700, font: 'mono', color: k === 'plain' ? p.ink : ink(S, k), base: 'middle', a });
        x += w;
      });
    };
    line(parts, px, r.y + (o.sub ? 10 + px / 2 : h / 2), true);
    if (o.sub) line(o.sub, subPx, r.y + h - 10 - subPx / 2, false);
  });
  return h;
}

// ── lectura numérica ─────────────────────────────────────────────────────
export interface Item { label: string; value: string; t?: Tone; big?: boolean; sub?: string; a?: number }
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
        // rótulo y subtítulo se parten en líneas si no caben en la columna: la fila crece en vez de montarse sobre la siguiente
        const lines = (t: string, wt: number) => Math.max(1, Math.ceil(tw(S, t, 12, { weight: wt }) / Math.max(20, cw - 6)));
        const dl = 15 * (lines(it.label, 700) - 1), ds = it.sub ? 15 * lines(it.sub, 600) : 0;
        S.d.withAlpha(it.a ?? 1, () => {
          tx(S, it.label, x, y, { px: 12, weight: 700, color: p.mute, base: 'top', w: cw - 6 });
          tx(S, it.value, x, y + 15 + dl, { px: pxv, weight: 700, font: 'mono', color: it.t ? ink(S, it.t) : p.ink, base: 'top' });
          if (it.sub) tx(S, it.sub, x, y + 15 + dl + pxv * 1.25, { px: 12, weight: 600, color: p.ink2, base: 'top', w: cw - 6 });
        });
        hRow = Math.max(hRow, rh(it) + dl + ds);
      }
      y += hRow;
    }
  });
  return y - r.y;
}

// ── gráficas del panel lateral ───────────────────────────────────────────
/** Barras por estudiante: error con signo o al cuadrado. `scale` es el valor que llena la altura. */
export function errBars(S: Frame, r: Rect, vals: number[], o: { kind: 'signed' | 'sq'; scale: number; title: string; hot?: number[]; a?: number; show?: (i: number) => number }) {
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

/** Barras horizontales de comparación. Con espacio: rótulo encima de la barra; si no, rótulo a la izquierda en la misma fila. */
export function hBars(S: Frame, r: Rect, rows: { label: string; value: number; t: Tone; hot?: boolean; a?: number }[], max: number) {
  const { d, pal: p, u } = S, rh = Math.min(46 * u, r.h / rows.length), stacked = rh >= 38;
  rows.forEach((row, i) => {
    const y = r.y + i * rh, c = tone(S, row.t);
    d.withAlpha(row.a ?? 1, () => {
      const valW = tw(S, '000.0', 12, { weight: 700, font: 'mono' }) + 6;
      if (stacked) {
        const bh = Math.min(14 * u, rh - 24), w = clamp(row.value / max) * r.w;
        tx(S, row.label, r.x, y, { px: 12, weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, base: 'top' });
        tx(S, nf(S, row.value, 1), r.x + r.w, y, { px: 12, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'top' });
        d.rect(r.x, y + 17, r.w, bh, { fill: p.surface2 });
        d.rect(r.x, y + 17, Math.max(2, w), bh, { fill: row.hot ? c.c : alpha(c.c, 0.55) });
      } else {
        const lw = Math.min(r.w * 0.42, 150), bx = r.x + lw, bw = r.w - lw - valW, bh = Math.max(6, rh * 0.42), cy = y + rh / 2;
        tx(S, row.label, r.x, cy, { px: 12, weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, base: 'middle', w: lw - 6 });
        d.rect(bx, cy - bh / 2, bw, bh, { fill: p.surface2 });
        d.rect(bx, cy - bh / 2, Math.max(2, clamp(row.value / max) * bw), bh, { fill: row.hot ? c.c : alpha(c.c, 0.55) });
        tx(S, nf(S, row.value, 1), r.x + r.w, cy, { px: 12, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
      }
    });
  });
}

/** Barra apilada: aporte de cada estudiante al total. El estudiante `focus` va primero y resaltado. Devuelve el alto usado. */
export function stackBar(S: Frame, r: Rect, share: number[], focus: number, label: string, a = 1): number {
  const { d, pal: p } = S, er = tone(S, 'err'), order = [focus, ...share.map((_, i) => i).filter((i) => i !== focus)];
  const h = Math.min(24 * S.u, 22);
  d.withAlpha(a, () => {
    tx(S, label, r.x, r.y, { px: 12, weight: 700, color: p.ink2, base: 'top' });
    const y = r.y + 18;
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
  return 18 + h;
}
