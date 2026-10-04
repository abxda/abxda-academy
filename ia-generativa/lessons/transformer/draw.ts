// Piezas de dibujo propias de la lección «El transformer completo»: celdas con números, matrices, tiras de vector,
// barras con signo y barras horizontales. El kit no trae matrices con signo ni tiras de vector; se implementan aquí.
// Todo pide roles de color (tone) y colores del tema (S.pal): nada de hex. Todo es puro: solo lee sus argumentos.
//
// Convención visual de la lección (se repite en todas las vistas, y no depende solo del color):
//   · relleno más intenso = valor de mayor magnitud; borde PUNTEADO = valor negativo (y el número lleva «−»).
//   · lat (violeta) = vectores de las palabras (el flujo residual) · sig (cian) = atención · dat (verde) = red MLP y cálculo
//     · w (ámbar) = parámetros · err (magenta) = error / trampa · mute = normalización, máscara, lo que no cuenta.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de texto con mínimo de 12 px efectivos (d.text multiplica por S.u). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);

/** Entero con separador de miles del idioma: es «175 000 000 000» (4 cifras sin separador), en «175,000,000,000». */
export function fmtInt(S: Frame, n: number): string {
  const s = Math.round(n).toString();
  if (S.lang === 'en') return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return s.length <= 4 ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
/** Menos tipográfico para los números negativos. */
export const sgn = (s: string) => s.replace('-', '−');
export const pct = (S: Frame, p: number, digits = 0) => `${S.n(p * 100, digits)} %`;

export interface TxtOpts { s?: number; c?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; weight?: number; mono?: boolean; halo?: boolean; a?: number; w?: number; lh?: number }
/** Texto con mínimo de 12 px efectivos. `s` es el tamaño nominal. */
export function txt(S: Frame, str: string, x: number, y: number, o: TxtOpts = {}) {
  return S.d.text(str, x, y, { size: fz(S, o.s ?? 13), weight: o.weight ?? 600, color: o.c ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.mono ? 'mono' : undefined, halo: o.halo ? S.pal.stage : undefined, haloW: 4, a: o.a, w: o.w, lh: o.lh });
}
export const measure = (S: Frame, str: string, s = 13, mono = false, weight = 600) => S.d.measure(str, { size: fz(S, s), weight, font: mono ? 'mono' : undefined });

// ───────────────────────── celdas, tiras y matrices ─────────────────────────
export interface GridOpts {
  tone?: Tone; vmax?: number; digits?: number;
  /** false = solo color; función = texto propio por celda. */
  numbers?: boolean | ((v: number, r: number, c: number) => string);
  cw?: number; ch?: number; gap?: number; size?: number;
  rowLabels?: string[]; colLabels?: string[]; labelSize?: number;
  /** Resalta celdas con un marco grueso. */
  hot?: (r: number, c: number) => boolean;
  /** Celdas tapadas por la máscara: se dibujan rayadas con «−∞». */
  masked?: (r: number, c: number) => boolean;
  /** Opacidad por celda (animaciones de aparición). */
  cellA?: (r: number, c: number) => number;
  /** Atenúa filas (índices). */
  dimRows?: number[];
  rowHot?: number[];
  a?: number;
  /** Color de las etiquetas de fila. */
  rowTone?: (Tone | undefined)[];
  /** Los valores van de 0 a vmax (probabilidades): sin borde punteado. */
  unsigned?: boolean;
  /** Sin borde punteado en negativos (tablas pequeñas sin números). */
  noDash?: boolean;
}
export interface GridGeo { x: number; y: number; w: number; h: number; cw: number; ch: number; rows: number; cols: number; lw: number; th: number }

/** Matriz de celdas con color por magnitud. (x, y) es la esquina superior izquierda de TODO el bloque (etiquetas incluidas). */
export function grid(S: Frame, x: number, y: number, M: number[][], o: GridOpts = {}): GridGeo {
  const { d, pal: p } = S, rows = M.length, cols = M[0]?.length ?? 0, t = tone(S, o.tone ?? 'lat');
  const cw = o.cw ?? 34, ch = o.ch ?? 26, gap = o.gap ?? 2, ls = o.labelSize ?? 12;
  const vmax = o.vmax ?? Math.max(1e-9, ...M.flat().map(Math.abs));
  const lw = o.rowLabels ? Math.max(...o.rowLabels.map((s) => measure(S, s, ls))) + 8 : 0, th = o.colLabels ? fz(S, ls) * S.u + 6 : 0;
  const x0 = x + lw, y0 = y + th;
  d.withAlpha(o.a ?? 1, () => {
    o.colLabels?.forEach((s, c) => txt(S, s, x0 + c * cw + (cw - gap) / 2, y + th / 2, { s: ls, c: p.ink2, align: 'center' }));
    o.rowLabels?.forEach((s, r) => txt(S, s, x0 - 7, y0 + r * ch + (ch - gap) / 2, { s: ls, c: o.rowTone?.[r] ? tone(S, o.rowTone[r]!).ink : (o.rowHot?.includes(r) ? p.ink : p.ink2), align: 'right', a: o.dimRows?.includes(r) ? 0.4 : 1, weight: o.rowHot?.includes(r) ? 800 : 600 }));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = M[r][c], k = clamp(Math.abs(v) / vmax), cx = x0 + c * cw, cy = y0 + r * ch, a = (o.cellA?.(r, c) ?? 1) * (o.dimRows?.includes(r) ? 0.35 : 1);
      if (a <= 0.01) continue;
      d.withAlpha(a, () => {
        if (o.masked?.(r, c)) {
          d.rect(cx, cy, cw - gap, ch - gap, { fill: p.surface2, stroke: p.line, lw: 1 });
          d.ctx.save(); d.ctx.beginPath(); d.ctx.rect(cx, cy, cw - gap, ch - gap); d.ctx.clip();
          for (let q = -ch; q < cw; q += 7) d.line(cx + q, cy + ch, cx + q + ch, cy, p.line, 1);
          d.ctx.restore();
          if (o.numbers !== false && cw >= 30) txt(S, '−∞', cx + (cw - gap) / 2, cy + (ch - gap) / 2, { s: o.size ?? 12, mono: true, c: p.mute, align: 'center', halo: true });
          return;
        }
        d.rect(cx, cy, cw - gap, ch - gap, { fill: alpha(t.c, 0.07 + 0.72 * k), stroke: v < 0 && !o.unsigned && !o.noDash ? t.c : undefined, lw: 1.5, dash: v < 0 && !o.unsigned && !o.noDash ? [3, 2] : undefined });
        if (o.numbers !== false && cw >= 28) {
          const str = typeof o.numbers === 'function' ? o.numbers(v, r, c) : sgn(S.n(v, o.digits ?? 1));
          txt(S, str, cx + (cw - gap) / 2, cy + (ch - gap) / 2, { s: o.size ?? 12, mono: true, c: k > 0.55 ? p.stage : p.ink, align: 'center' });
        }
      });
      if (o.hot?.(r, c)) d.rect(cx - 1, cy - 1, cw - gap + 2, ch - gap + 2, { stroke: p.ink, lw: 2.5 });
    }
  });
  return { x: x0, y: y0, w: cols * cw - gap, h: rows * ch - gap, cw, ch, rows, cols, lw, th };
}

/** Un vector como una fila de celdas. */
export const strip = (S: Frame, x: number, y: number, v: number[], o: GridOpts = {}) => grid(S, x, y, [v], o);

/** Barras con signo (cero en el centro): negativo = hacia abajo, con borde punteado. */
export function vbars(S: Frame, r: Rect, v: number[], o: { tone?: Tone; vmax?: number; a?: number; zero?: boolean; band?: [number, number]; gap?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), n = v.length, vmax = o.vmax ?? Math.max(1e-9, ...v.map(Math.abs)), zy = r.y + r.h / 2, bw = r.w / n, gap = o.gap ?? 3;
  d.withAlpha(o.a ?? 1, () => {
    if (o.band) { const y1 = zy - (o.band[1] / vmax) * (r.h / 2), y2 = zy - (o.band[0] / vmax) * (r.h / 2); d.rect(r.x, Math.min(y1, y2), r.w, Math.abs(y2 - y1), { fill: alpha(p.ink, 0.07) }); }
    d.line(r.x, zy, r.x + r.w, zy, p.lineStrong, 1.5);
    v.forEach((q, i) => {
      const h = (clamp(Math.abs(q) / vmax)) * (r.h / 2 - 1), bx = r.x + i * bw + gap / 2, w = bw - gap;
      if (q >= 0) d.rect(bx, zy - h, w, h, { fill: alpha(t.c, 0.7) });
      else d.rect(bx, zy, w, h, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 1.5, dash: [3, 2] });
    });
  });
}

/** Hatch de «tapado» para un rectángulo. */
export function hatch(S: Frame, r: Rect, a = 1) {
  const { d, pal: p } = S;
  d.withAlpha(a, () => { d.ctx.save(); d.ctx.beginPath(); d.ctx.rect(r.x, r.y, r.w, r.h); d.ctx.clip(); for (let q = -r.h; q < r.w; q += 7) d.line(r.x + q, r.y + r.h, r.x + q + r.h, r.y, p.line, 1); d.ctx.restore(); });
}

/** Nodo ⊕ (suma). */
export function plus(S: Frame, x: number, y: number, r: number, o: { tone?: Tone; a?: number; fill?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.circle(x, y, r, { fill: o.fill ? alpha(t.c, 0.2) : p.surface, stroke: t.c, lw: 2 });
    d.line(x - r * 0.55, y, x + r * 0.55, y, t.c, 2); d.line(x, y - r * 0.55, x, y + r * 0.55, t.c, 2);
  });
}

/** Caja con título centrado (kit.box pero con 12 px mínimos). Devuelve el rectángulo. */
export function node(S: Frame, r: Rect, label: string, o: { tone?: Tone; a?: number; active?: number; sub?: string; size?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.3 * (o.active ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: 1.5 + (o.active ?? 0), r: 3 });
    txt(S, label, r.x + r.w / 2, r.y + r.h / 2 - (o.sub ? 6 : 0), { s: o.size ?? 13, weight: 700, c: o.tone ? t.ink : p.ink, align: 'center' });
    if (o.sub) txt(S, o.sub, r.x + r.w / 2, r.y + r.h / 2 + 9, { s: 12, c: p.mute, align: 'center', weight: 500 });
  });
}

/** Flecha entre dos puntos con progreso 0..1 (se dibuja a medida que avanza). */
export function arrowP(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; p?: number; lw?: number; dash?: number[]; a?: number } = {}) {
  const k = clamp(o.p ?? 1); if (k <= 0) return;
  const t = tone(S, o.tone ?? 'ink'), tx = x1 + (x2 - x1) * k, ty = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => { if (o.dash) S.d.line(x1, y1, tx, ty, t.c, o.lw ?? 2, o.dash); else S.d.arrow(x1, y1, tx, ty, t.c, o.lw ?? 2, k > 0.97 ? 8 : 0.001); });
}

/** Aparece/desaparece una vista entre segmentos. */
export function view(S: Frame, from: string, to: string | undefined, fn: (a: number) => void) {
  if (!S.on(from)) return;
  const a = S.reveal(from, 0, 0.4) * (to ? 1 - S.reveal(to, 0, 0.3) : 1);
  if (a > 0.003) S.d.withAlpha(a, () => fn(a));
}

/** Barra de etapa: nombre de la etapa actual y puntos de avance. */
export function stageBar(S: Frame, r: Rect, idx: number, names: string[], a = 1) {
  const { d, pal: p } = S, n = names.length;
  d.withAlpha(a, () => {
    txt(S, names[idx], r.x, r.y + r.h / 2, { s: 13, weight: 800, c: p.ink2 });
    const sz = 9, gap = 7, w = n * sz + (n - 1) * gap;
    for (let i = 0; i < n; i++) d.rect(r.x + r.w - w + i * (sz + gap), r.y + r.h / 2 - sz / 2, sz, sz, { fill: i <= idx ? tone(S, 'ink').c : undefined, stroke: p.lineStrong, lw: 1.5, a: i === idx ? 1 : i < idx ? 0.55 : 0.8 });
  });
}

// ───────────────────────── fichas (tokens), números compactos y gráficas ─────────────────────────
/** Número sin el cero inicial cuando |v| < 1 («.85», «−.11»): ahorra una columna en las celdas. */
export function compact(S: Frame, v: number, digits = 1): string {
  if (Math.abs(v) < 0.5 * Math.pow(10, -digits)) return '0';
  const s = S.n(v, digits);
  return sgn(Math.abs(v) < 1 ? s.replace(/^(-?)0(?=[.,])/, '$1') : s);
}

/** Una ficha (token). Devuelve su ancho. */
export function chip(S: Frame, x: number, y: number, text: string, o: { tone?: Tone; h?: number; s?: number; a?: number; active?: number; mono?: boolean; dim?: boolean; w?: number; dash?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), h = o.h ?? 28, s = o.s ?? 14;
  const w = o.w ?? measure(S, text, s, o.mono) + 18;
  d.withAlpha((o.a ?? 1) * (o.dim ? 0.45 : 1), () => {
    d.rect(x, y, w, h, { fill: alpha(t.c, 0.14 + 0.5 * (o.active ?? 0)), stroke: t.c, lw: 1.5, r: 3, dash: o.dash ? [4, 3] : undefined });
    txt(S, text, x + w / 2, y + h / 2, { s, weight: 700, c: (o.active ?? 0) > 0.6 ? p.stage : t.ink, align: 'center', mono: o.mono });
  });
  return w;
}

/** Fila de fichas con salto de línea. Devuelve {h, boxes}. */
export function chipRow(S: Frame, x: number, y: number, maxW: number, items: string[], o: { tone?: Tone; h?: number; s?: number; gap?: number; show?: number; a?: number; active?: number[]; mono?: boolean; dim?: number[] } = {}) {
  const h = o.h ?? 28, gap = o.gap ?? 6, s = o.s ?? 14, boxes: Rect[] = [];
  let cx = x, cy = y;
  items.forEach((t, i) => {
    const w = measure(S, t, s, o.mono) + 18;
    if (cx + w > x + maxW && cx > x) { cx = x; cy += h + gap; }
    const a = clamp((o.show ?? items.length) - i) * (o.a ?? 1);
    if (a > 0.01) chip(S, cx, cy, t, { tone: o.tone, h, s, a, active: o.active?.includes(i) ? 1 : 0, mono: o.mono, dim: o.dim?.includes(i) });
    boxes.push({ x: cx, y: cy, w, h });
    cx += w + gap;
  });
  return { h: cy + h - y, boxes };
}

/** Ejes sencillos con texto ≥ 12 px. Devuelve las funciones de conversión y el área de trazado. */
export function chart(S: Frame, outer: Rect, o: { xr: [number, number]; yr: [number, number]; xTicks: number[]; yTicks: number[]; xFmt?: (v: number) => string; yFmt?: (v: number) => string; xLabel?: string; yLabel?: string; padL?: number; padB?: number; padT?: number; padR?: number; a?: number }) {
  const { d, pal: p } = S, padL = o.padL ?? 34, padB = o.padB ?? (o.xLabel ? 36 : 22), padT = o.padT ?? (o.yLabel ? 20 : 8), padR = o.padR ?? 10;
  const r: Rect = { x: outer.x + padL, y: outer.y + padT, w: outer.w - padL - padR, h: outer.h - padT - padB };
  const X = (v: number) => r.x + ((v - o.xr[0]) / (o.xr[1] - o.xr[0])) * r.w, Y = (v: number) => r.y + r.h - ((v - o.yr[0]) / (o.yr[1] - o.yr[0])) * r.h;
  d.withAlpha(o.a ?? 1, () => {
    o.yTicks.forEach((v) => { d.line(r.x, Y(v), r.x + r.w, Y(v), p.line, 1); txt(S, (o.yFmt ?? ((q) => S.n(q, 0)))(v), r.x - 6, Y(v), { s: 12, mono: true, c: p.mute, align: 'right' }); });
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5); d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    o.xTicks.forEach((v) => { d.line(X(v), r.y + r.h, X(v), r.y + r.h + 4, p.lineStrong, 1.5); txt(S, (o.xFmt ?? ((q) => S.n(q, 0)))(v), X(v), r.y + r.h + 7, { s: 12, mono: true, c: p.mute, align: 'center', base: 'top' }); });
    if (o.xLabel) txt(S, o.xLabel, r.x + r.w, r.y + r.h + (o.xTicks.length ? 24 : 8), { s: 12, c: p.ink2, align: 'right', base: 'top' });
    if (o.yLabel) txt(S, o.yLabel, outer.x + 2, outer.y + 2, { s: 12, c: p.ink2, base: 'top' });
  });
  return { X, Y, r };
}
