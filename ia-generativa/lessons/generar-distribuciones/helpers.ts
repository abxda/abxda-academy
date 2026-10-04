// Ayudas de dibujo locales de la lección: imágenes de 8×8 como píxeles, rejillas de miniaturas, ejes con texto legible,
// tiras de puntos y barras por dígito. Todo usa tone()/S.pal (tema claro y oscuro); nada de colores literales.
import { alpha, clamp, tone, type Frame, type Plot, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de texto que garantiza ≥ 12 px efectivos (el tamaño pedido se multiplica por S.u). */
export const fs = (S: Frame, base: number) => Math.max(base, 12 / S.u);

// ── colores de los 17 niveles de tinta (cacheados por tema) ──
const lutCache = new Map<string, string[]>();
export function lut(color: string): string[] {
  let l = lutCache.get(color);
  if (!l) { l = Array.from({ length: 17 }, (_, i) => alpha(color, i === 0 ? 0 : 0.08 + 0.92 * (i / 16))); lutCache.set(color, l); if (lutCache.size > 24) lutCache.delete(lutCache.keys().next().value as string); }
  return l;
}

export interface DigitOpts {
  /** real: marco continuo; model: marco punteado (lo hizo un modelo, no existía antes). */
  kind?: 'real' | 'model';
  tone?: Tone;                     // tiñe la tinta (por defecto, la tinta neutra del tema)
  a?: number;
  /** Marco resaltado con un tono. */
  hl?: Tone;
  values?: boolean;                // escribe el valor 0–16 en cada celda
  noFrame?: boolean;
}

/** Imagen de 8×8 (valores 0..1) como matriz de píxeles. `cell` debe ser entero para que se vea nítida. */
export function digit(S: Frame, x: number, y: number, v: ArrayLike<number>, cell: number, o: DigitOpts = {}) {
  const ctx = S.ctx, p = S.pal, w = 8 * cell, col = lut(o.tone ? tone(S, o.tone).c : p.ink);
  x = Math.round(x); y = Math.round(y);
  ctx.save();
  if (o.a !== undefined) ctx.globalAlpha *= clamp(o.a);
  ctx.fillStyle = p.surface; ctx.fillRect(x, y, w, w);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const k = Math.round(clamp(v[r * 8 + c]) * 16);
    if (k > 0) { ctx.fillStyle = col[k]; ctx.fillRect(x + c * cell, y + r * cell, cell, cell); }
  }
  ctx.restore();
  S.d.withAlpha(o.a ?? 1, () => {
    if (!o.noFrame) S.d.rect(x - 0.5, y - 0.5, w + 1, w + 1, { stroke: o.hl ? tone(S, o.hl).c : p.lineStrong, lw: o.hl ? 2.5 : 1.2, dash: o.kind === 'model' ? [3, 2.5] : undefined });
    if (o.values) {
      const fsz = fs(S, 11) , big = cell * 1; void big;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const k = Math.round(clamp(v[r * 8 + c]) * 16);
        S.d.text(String(k), x + c * cell + cell / 2, y + r * cell + cell / 2, { size: Math.min(fsz, (cell * 0.5) / S.u), font: 'mono', weight: 600, color: k > 9 ? p.stage : p.ink2, align: 'center', base: 'middle' });
      }
    }
  });
}

// ── rejillas de miniaturas que se ajustan al espacio ──
export interface TileLayout { cell: number; cols: number; rows: number; gap: number; extraH: number; x0: number; y0: number; w: number; h: number; tile: number; pos: (i: number) => { x: number; y: number } }
export function tileLayout(r: Rect, n: number, o: { cols?: number; gap?: number; extraH?: number; minCell?: number; maxCell?: number; align?: 'center' | 'left'; valign?: 'top' | 'center' } = {}): TileLayout {
  const gap = o.gap ?? 6, extraH = o.extraH ?? 0, maxC = o.maxCell ?? 12, minC = o.minCell ?? 2;
  let best = { cell: -1, cols: 1 };
  for (let cols = o.cols ?? 1; cols <= (o.cols ?? n); cols++) {
    const rows = Math.ceil(n / cols);
    const cell = Math.min(maxC, Math.floor(Math.min((r.w - (cols - 1) * gap) / (8 * cols), (r.h - (rows - 1) * gap - rows * extraH) / (8 * rows))));
    if (cell > best.cell || (cell === best.cell && cols > best.cols && Math.ceil(n / cols) < Math.ceil(n / best.cols))) best = { cell, cols };
  }
  const cell = Math.max(minC, best.cell), cols = best.cols, rows = Math.ceil(n / cols), tile = 8 * cell;
  const w = cols * tile + (cols - 1) * gap, h = rows * (tile + extraH) + (rows - 1) * gap;
  const x0 = o.align === 'left' ? r.x : r.x + (r.w - w) / 2, y0 = o.valign === 'center' ? r.y + (r.h - h) / 2 : r.y;
  return { cell, cols, rows, gap, extraH, x0, y0, w, h, tile, pos: (i) => ({ x: x0 + (i % cols) * (tile + gap), y: y0 + Math.floor(i / cols) * (tile + extraH + gap) }) };
}

// ── ejes con texto legible (los del kit usan 11 px fijos) ──
export function axes(S: Frame, plot: Plot, o: { xTicks?: number[]; yTicks?: number[]; xFmt?: (v: number) => string; yFmt?: (v: number) => string; xLabel?: string; yLabel?: string; a?: number; xLabelAlign?: CanvasTextAlign } = {}) {
  const { d, pal: p } = S, r = plot.r, u = S.u, sz = fs(S, 11.5);
  d.withAlpha(o.a ?? 1, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    if (o.yTicks || o.yLabel) d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    (o.xTicks ?? []).forEach((v) => { const X = plot.X(v); d.line(X, r.y + r.h, X, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text((o.xFmt ?? String)(v), X, r.y + r.h + 7 * u, { size: sz, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    (o.yTicks ?? []).forEach((v) => { const Y = plot.Y(v); d.line(r.x - 4 * u, Y, r.x, Y, p.lineStrong, 1.5); d.text((o.yFmt ?? String)(v), r.x - 7 * u, Y, { size: sz, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    if (o.xLabel) d.text(o.xLabel, o.xLabelAlign === 'center' ? r.x + r.w / 2 : r.x + r.w, r.y + r.h + 24 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, align: o.xLabelAlign ?? 'right', base: 'top' });
    if (o.yLabel) d.text(o.yLabel, plot.outer.x + 2, r.y - 4 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom' });
  });
}

/** Tono y forma de cada dígito en los mapas: 5 tonos × 2 formas (cuadrado / círculo): la forma acompaña al color. */
export const DIG_TONES: Tone[] = ['dat', 'err', 'w', 'lat', 'sig'];
export const digTone = (k: number): Tone => DIG_TONES[k % 5];
export const digSquare = (k: number) => k < 5;

/** Marca de un punto con la forma de su dígito. */
export function mark(S: Frame, x: number, y: number, k: number, r: number, a = 1) {
  const ctx = S.ctx, c = tone(S, digTone(k)).c;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c;
  if (digSquare(k)) ctx.fillRect(x - r, y - r, 2 * r, 2 * r); else { ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

/** Elipse (alineada con los ejes) como polilínea. */
export function ellipsePts(cx: number, cy: number, rx: number, ry: number, n = 40): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI * 2; return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)] as [number, number]; });
}

// ── tira de puntos: una fila por grupo, un punto por valor ──
export interface StripRow { label: string; vals: ArrayLike<number>; tone: Tone; ex?: ArrayLike<number>; seed: number; a?: number }
export function strip(S: Frame, r: Rect, rows: StripRow[], o: { xmax: number; xTicks: number[]; xLabel: string; show?: number; ex?: boolean; zero?: string; fmt?: (v: number) => string }) {
  const { d, pal: p } = S, u = S.u, fm = o.fmt ?? ((v: number) => S.n(v, 1));
  const cellEx = S.portrait ? 3 : 4, exW = o.ex === false ? 0 : 8 * cellEx + 10 * u;
  const left = r.x + exW, axisH = 44 * u, rowH = (r.h - axisH) / rows.length, W = r.w - exW - 8 * u;
  const X = (v: number) => left + (v / o.xmax) * W;
  d.line(left, r.y + r.h - axisH + 6 * u, left + W, r.y + r.h - axisH + 6 * u, p.lineStrong, 1.5);
  o.xTicks.forEach((v) => { d.line(X(v), r.y + r.h - axisH + 6 * u, X(v), r.y + r.h - axisH + 10 * u, p.lineStrong, 1.5); d.text(fm(v), X(v), r.y + r.h - axisH + 13 * u, { size: fs(S, 11.5), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
  d.text(o.xLabel, left + W, r.y + r.h - 2, { size: fs(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'bottom', w: Math.max(120, W) });
  if (o.zero !== undefined) {
    d.line(X(0), r.y + 2, X(0), r.y + r.h - axisH + 6 * u, tone(S, 'err').c, 2, [5, 4]);
  }
  rows.forEach((row, i) => {
    const y0 = r.y + i * rowH, cy = y0 + rowH * 0.58, t = tone(S, row.tone), a = row.a ?? 1;
    d.withAlpha(a, () => {
      d.text(row.label, left, y0 + 2, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
      if (row.ex && o.ex !== false) digit(S, r.x, cy - 4 * cellEx, row.ex, cellEx, { kind: 'real' });
      const n = Math.floor(row.vals.length * (o.show ?? 1));
      let sum = 0;
      for (let k = 0; k < row.vals.length; k++) sum += row.vals[k];
      for (let k = 0; k < n; k++) {
        const jx = (((k * 2654435761 + row.seed * 97) >>> 0) % 1000) / 1000;
        d.circle(X(row.vals[k]), cy + (jx - 0.5) * rowH * 0.42, 2.6 * u, { fill: alpha(t.c, 0.5) });
      }
      const m = sum / row.vals.length;
      d.line(X(m), cy - rowH * 0.28, X(m), cy + rowH * 0.28, t.ink, 2.5);
      d.text(fm(m), X(m), cy - rowH * 0.3, { size: fs(S, 13), weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'bottom', halo: p.stage });
    });
  });
  return { X };
}

/** Barras de la frecuencia de cada dígito (0–9) con la línea del reparto parejo (10 %). */
export function digitBars(S: Frame, r: Rect, counts: number[], o: { tone: Tone; title?: string; n?: number; a?: number; stats?: boolean; ymax?: number }) {
  const { d, pal: p } = S, u = S.u, total = o.n ?? counts.reduce((a, b) => a + b, 0), t = tone(S, o.tone);
  const titleH = o.title ? 18 * u : 0, labH = 18 * u, top = r.y + titleH + 10 * u, h = r.h - titleH - labH - 10 * u - (o.stats ? 20 * u : 0);
  const ymax = o.ymax ?? 0.3, slot = r.w / 10, bw = Math.max(3, slot * 0.62);
  d.withAlpha(o.a ?? 1, () => {
    if (o.title) d.text(o.title, r.x, r.y, { size: fs(S, 13), weight: 800, color: t.ink, base: 'top' });
    d.line(r.x, top + h, r.x + r.w, top + h, p.lineStrong, 1.5);
    const f = counts.map((c) => (total > 0 ? c / total : 0));
    f.forEach((v, k) => {
      const bh = clamp(v / ymax) * h, x = r.x + k * slot + (slot - bw) / 2;
      d.rect(x, top + h - bh, bw, bh, { fill: alpha(t.c, 0.7), stroke: t.c, lw: 1 });
      d.text(String(k), x + bw / 2, top + h + 3 * u, { size: fs(S, 12), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    });
    const yRef = top + h - (0.1 / ymax) * h;
    d.line(r.x, yRef, r.x + r.w, yRef, p.ink2, 1.5, [5, 4]);
    d.text(S.l('parejo: 10 %', 'even: 10%'), r.x + r.w, yRef - 3, { size: fs(S, 11.5), weight: 600, color: p.ink2, align: 'right', base: 'bottom', halo: p.stage });
    if (o.stats && total > 0) {
      let hi = 0, lo = 0; f.forEach((v, k) => { if (v > f[hi]) hi = k; if (v < f[lo]) lo = k; });
      d.text(S.l(`más: ${hi} (${S.n(f[hi] * 100, 0)} %) · menos: ${lo} (${S.n(f[lo] * 100, 0)} %)`, `most: ${hi} (${S.n(f[hi] * 100, 0)}%) · least: ${lo} (${S.n(f[lo] * 100, 0)}%)`), r.x, r.y + r.h, { size: fs(S, 12.5), weight: 700, color: p.ink, base: 'bottom' });
    }
  });
}
