// Piezas de dibujo propias de la lección «Atención» (el kit no las trae): tiempos por fracción de segmento, tamaños
// de texto con piso de 12 px efectivos, fichas de tokens en renglón, arcos de atención, celdas de vectores, mapas de
// atención y rótulos. Todo pide roles de color a tone()/S.pal (nada de colores literales) y es puro: solo lee sus argumentos.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ═════════ tiempo ═════════
/** Duración (s) del segmento k: las voces y los idiomas duran distinto, así que se anima por fracciones. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.1, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Aparece al entrar en `from` (fracciones a..b) y se va al entrar en `to` (primer 10 % de ese segmento). */
export const life = (S: Frame, from: string, to?: string, a = 0, b = 0.12) => (S.on(from) ? fr(S, from, a, b) : 0) * (to && S.on(to) ? 1 - fr(S, to, 0, 0.1) : 1);

// ═════════ dispositivo y tamaños ═════════
/** Escenario apaisado y muy bajo (teléfono en horizontal). */
export const isShort = (S: Frame) => !S.portrait && S.H < 300;
/** Tamaño de texto con piso de 12 px efectivos (d.text multiplica por S.u). */
/** En escritorio y tableta (apaisado con altura) todo se dibuja un poco más grande: sobra espacio. */
export const boost = (S: Frame) => (S.portrait || isShort(S) ? 1 : clamp(S.H / 390, 1, 1.25));
export const fz = (S: Frame, n: number) => Math.max(n * (isShort(S) ? 0.92 : boost(S)), 12 / S.u);
/** Espaciado: S.u por el mismo aumento. */
export const kk = (S: Frame) => S.u * boost(S);
/** Área útil del escenario. */
export const area = (S: Frame): Rect => inset(S.full(), (isShort(S) ? 10 : 16) * S.u, 16 * S.u, (isShort(S) ? 8 : 14) * S.u, 16 * S.u);
/** Altura de una línea de texto de tamaño `size` (en px). */
export const lineH = (S: Frame, size: number, k = 1.25) => size * S.u * k;

// ═════════ formato ═════════
export const q = (S: Frame, s: string) => (S.lang === 'es' ? `«${s}»` : `“${s}”`);
/** Número con signo menos tipográfico. */
export const num = (S: Frame, x: number, d = 1) => (Math.abs(x) < 1e-9 ? S.n(0, d) : S.n(x, d).replace('-', '−'));
/** Número corto: sin decimales si es entero (1, 0, −1.6, 0.8). */
export const numA = (S: Frame, x: number, d = 1) => num(S, x, Math.abs(x - Math.round(x)) < 1e-9 ? 0 : d);
/** Porcentaje entero con el espacio del idioma. */
export const pct = (S: Frame, w: number, d = 0) => `${S.n(w * 100, d)}${S.lang === 'es' ? ' %' : '%'}`;
/** Nombre visible de un token de BERT: las marcas se nombran. */
export const tokLabel = (S: Frame, w: string) => (w === '[CLS]' ? S.l('inicio', 'start') : w === '[SEP]' ? S.l('fin', 'end') : w);
export const isMark = (w: string) => w === '[CLS]' || w === '[SEP]' || w === '.';

// ═════════ rótulos ═════════
export interface LabelOpts { a?: number; size?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; w?: number; italic?: boolean; halo?: boolean; font?: 'ui' | 'mono' }
export function label(S: Frame, text: string, x: number, y: number, o: LabelOpts = {}) {
  const a = o.a ?? 1;
  if (a < 0.01) return { w: 0, h: 0 };
  return S.d.text(text, x, y, { size: o.size ?? fz(S, 13), weight: o.weight ?? 600, color: o.color ?? S.pal.ink2, align: o.align ?? 'center', base: o.base ?? 'middle', w: o.w, italic: o.italic, a, font: o.font, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Mayor tamaño (hasta `size`) con el que el texto cabe en `maxW`; nunca baja de 12 px efectivos. */
export function fitSize(S: Frame, text: string, maxW: number, size: number, weight = 600, font?: 'ui' | 'mono'): number {
  const w = S.d.measure(text, { size, weight, font });
  return w <= maxW ? size : Math.max(12 / S.u, size * maxW / w);
}
/** Texto que se ajusta al ancho: primero se achica (hasta 12 px), luego se parte en renglones. */
export function fitText(S: Frame, text: string, x: number, y: number, maxW: number, o: LabelOpts & { lines?: number } = {}) {
  const size0 = o.size ?? fz(S, 13), weight = o.weight ?? 600;
  const size = fitSize(S, text, maxW, size0, weight, o.font);
  const one = S.d.measure(text, { size, weight, font: o.font }) <= maxW + 0.5;
  return label(S, text, x, y, { ...o, size, w: one ? undefined : maxW });
}
/** Etiqueta pequeña de «ejemplo hecho a mano» / fuente. */
export function tagNote(S: Frame, text: string, x: number, y: number, a = 1, align: CanvasTextAlign = 'right') {
  label(S, text, x, y, { size: fz(S, 12), weight: 600, color: S.pal.mute, italic: true, align, base: 'top', a });
}

// ═════════ fichas de tokens ═════════
export interface ChipPos { x: number; y: number; w: number; h: number; line: number }
export interface ChipRow { pos: ChipPos[]; size: number; width: number; lines: number; h: number }
/** Coloca las palabras como fichas en renglones de ancho `maxW` (achica la letra hasta 12 px antes de partir). */
export function layoutChips(S: Frame, words: string[], maxW: number, size0: number, o: { gap?: number; pad?: number; weight?: number; maxLines?: number } = {}): ChipRow {
  const d = S.d, weight = o.weight ?? 600, u = S.u;
  const build = (size: number) => {
    const pad = (o.pad ?? 7) * u, gap = (o.gap ?? 6) * u, h = size * u * 1.75;
    const ws = words.map((w) => d.measure(w, { size, weight }) + pad * 2);
    const pos: ChipPos[] = []; let x = 0, line = 0, width = 0;
    ws.forEach((w) => { if (x > 0 && x + w > maxW) { line++; x = 0; } pos.push({ x, y: line * (h + gap * 1.6), w, h, line }); x += w + gap; width = Math.max(width, x - gap); });
    return { pos, size, width, lines: line + 1, h: (line + 1) * h + line * gap * 1.6 };
  };
  let size = size0, row = build(size);
  while (row.lines > 1 && size > 12 / u + 0.01) { size = Math.max(12 / u, size - 0.5); row = build(size); }
  if (row.lines > (o.maxLines ?? 3)) row = build(12 / u);
  return row;
}
/** Desplaza las posiciones de una fila (centrada en cx, con el borde superior en y). */
export function placeRow(row: ChipRow, cx: number, y: number): Rect[] {
  const widths: number[] = [];
  row.pos.forEach((p) => { widths[p.line] = Math.max(widths[p.line] ?? 0, p.x + p.w); });
  return row.pos.map((p) => ({ x: cx - widths[p.line] / 2 + p.x, y: y + p.y, w: p.w, h: p.h }));
}
export interface ChipOpts { a?: number; tone?: Tone; strong?: number; size: number; dashed?: boolean; italic?: boolean; weight?: number; ring?: number }
/** Una ficha de token: borde fino; `tone` + `strong` la resaltan (relleno y borde del rol). */
export function chip(S: Frame, r: Rect, text: string, o: ChipOpts) {
  const { d, pal: p } = S, a = o.a ?? 1;
  if (a < 0.01) return;
  const t = o.tone ? tone(S, o.tone) : null, k = clamp(o.strong ?? 0);
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 4, dash: o.dashed ? [3, 3] : undefined });
    if (t && k > 0) d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.2 * k), stroke: alpha(t.c, k), lw: 2, r: 4 });
    if (t && (o.ring ?? 0) > 0) d.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, { stroke: alpha(t.c, o.ring!), lw: 1.5, r: 6 });
    d.text(text, r.x + r.w / 2, r.y + r.h / 2 + 0.5, { size: o.size, weight: o.weight ?? 600, color: t && k > 0.5 ? t.ink : p.ink, align: 'center', base: 'middle', italic: o.italic });
  });
}

// ═════════ arcos de atención ═════════
/** Punto de control del arco que sale de la ficha a hacia la b (por encima del renglón, o por debajo con `below`). */
function arcGeom(S: Frame, a: Rect, b: Rect, below = false, hMax = 80) {
  const ax = a.x + a.w / 2, bx = b.x + b.w / 2, ya = below ? a.y + a.h : a.y, yb = below ? b.y + b.h : b.y;
  const span = Math.abs(bx - ax), lift = Math.min(hMax * S.u, 10 * S.u + span * 0.32) * (below ? -1 : 1);
  return { p0: [ax, ya] as [number, number], p1: [bx, yb] as [number, number], c: [(ax + bx) / 2, Math.min(ya, yb) - lift] as [number, number] };
}
/** Arco de atención de la ficha a (quien mira) a la b (a quien mira): el grosor dice el peso; `t` lo dibuja de a a b. */
export function attArc(S: Frame, a: Rect, b: Rect, w: number, o: { a?: number; t?: number; tone?: Tone; below?: boolean; hMax?: number; head?: boolean } = {}) {
  const { d } = S, c = tone(S, o.tone ?? 'sig').c, t = clamp(o.t ?? 1), al = (o.a ?? 1) * (0.35 + 0.65 * clamp(w * 2.2));
  if (t <= 0 || al < 0.01) return;
  const lw = (1 + 8 * clamp(w)) * Math.max(0.8, S.u);
  if (a === b || Math.abs(a.x - b.x) < 1) {   // a sí mismo: un lazo
    const cx = a.x + a.w / 2, y = o.below ? a.y + a.h : a.y, s = o.below ? 1 : -1, r = Math.max(7, a.h * 0.45);
    S.ctx.save(); S.ctx.globalAlpha *= al; S.ctx.strokeStyle = c; S.ctx.lineWidth = lw; S.ctx.lineCap = 'round';
    S.ctx.beginPath(); S.ctx.ellipse(cx, y + s * r * 0.9, r * 0.8, r, 0, 0, Math.PI * 2 * t); S.ctx.stroke(); S.ctx.restore();
    return;
  }
  const { p0, p1, c: cp } = arcGeom(S, a, b, o.below, o.hMax);
  const pt = (u: number): [number, number] => { const m = 1 - u; return [m * m * p0[0] + 2 * m * u * cp[0] + u * u * p1[0], m * m * p0[1] + 2 * m * u * cp[1] + u * u * p1[1]]; };
  const pts: [number, number][] = []; const n = 26;
  for (let i = 0; i <= n; i++) pts.push(pt((i / n) * t));
  d.polyline(pts, c, lw, { a: al });
  if (o.head !== false && t > 0.97) {
    const e = pt(1), f = pt(0.9), ang = Math.atan2(e[1] - f[1], e[0] - f[0]), hs = (5 + lw * 0.7) * Math.max(0.9, S.u);
    d.polygon([[e[0], e[1]], [e[0] - Math.cos(ang - 0.5) * hs, e[1] - Math.sin(ang - 0.5) * hs], [e[0] - Math.cos(ang + 0.5) * hs, e[1] - Math.sin(ang + 0.5) * hs]], { fill: c, a: al });
  }
}

// ═════════ vectores ═════════
/** Celdas con los números de un vector (centradas en `cx`). Devuelve el ancho total. */
export function cells(S: Frame, cx: number, cy: number, v: number[], o: { tone?: Tone; cw?: number; h?: number; a?: number; digits?: number; strong?: boolean; size?: number; left?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), u = S.u;
  const size = o.size ?? fz(S, 13), fmt = (x: number) => numA(S, x, o.digits ?? 1), tw = Math.max(...v.map((x) => d.measure(fmt(x), { size, weight: 700, font: 'mono' })));
  const cw = Math.max((o.cw ?? 34) * u, tw + 8 * u), h = (o.h ?? 22) * u, gap = 3 * u, W = v.length * cw + (v.length - 1) * gap, x0 = o.left ? cx : cx - W / 2;
  if ((o.a ?? 1) < 0.01) return W;
  d.withAlpha(o.a ?? 1, () => {
    v.forEach((val, i) => {
      const x = x0 + i * (cw + gap);
      d.rect(x, cy - h / 2, cw, h, { fill: alpha(t.c, o.strong ? 0.22 : 0.1), stroke: alpha(t.c, o.strong ? 0.95 : 0.55), lw: o.strong ? 1.5 : 1, r: 3 });
      d.text(fmt(val), x + cw / 2, cy + 0.5, { size, font: 'mono', weight: 700, color: o.tone ? t.ink : p.ink, align: 'center', base: 'middle' });
    });
  });
  return W;
}
/** Un vector como barritas verticales (sin números), para «un vector cualquiera» (embedding). */
export function vecBars(S: Frame, r: Rect, v: number[], o: { tone?: Tone; a?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), n = v.length, bw = r.w / n, mid = r.y + r.h / 2;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 3 });
    d.line(r.x + 2, mid, r.x + r.w - 2, mid, p.line, 1);
    v.forEach((x, i) => {
      const hh = (r.h / 2 - 3) * clamp(Math.abs(x)), bx = r.x + i * bw + bw * 0.22;
      d.rect(bx, x >= 0 ? mid - hh : mid, bw * 0.56, hh, { fill: t.c, a: 0.85 });
    });
  });
}

// ═════════ mapa de atención ═════════
export interface GridGeom { x: number; y: number; cs: number; n: number; m: number; lw: number; lh: number }
/** Geometría de un mapa n×m dentro de r, con espacio para rótulos de filas (izquierda) y columnas (arriba). */
export function gridGeom(S: Frame, r: Rect, rows: string[], cols: string[], size: number, o: { colLabels?: boolean } = {}): GridGeom & { colLabels: boolean } {
  const lw = Math.max(...rows.map((w) => S.d.measure(w, { size, weight: 600 }))) + 8 * S.u;
  const colMax = Math.max(...cols.map((w) => S.d.measure(w, { size, weight: 600 })));
  const lh = o.colLabels === false ? 0 : colMax * 0.72 + size * S.u + 6 * S.u;   // rótulos a −45°
  const cs = Math.max(6, Math.min((r.w - lw) / cols.length, (r.h - lh) / rows.length));
  // si las celdas quedan más angostas que el texto, los rótulos girados se pisarían: se quitan (las columnas siguen el orden de las filas)
  if (o.colLabels !== false && cs < size * S.u * 1.15) return gridGeom(S, r, rows, cols, size, { colLabels: false });
  const gw = lw + cs * cols.length, gh = lh + cs * rows.length;
  return { x: r.x + (r.w - gw) / 2 + lw, y: r.y + (r.h - gh) / 2 + lh, cs, n: rows.length, m: cols.length, lw, lh, colLabels: o.colLabels !== false };
}
/** Celdas cuyo cuadro interior crece con el peso (área ∝ peso): «más lleno, más peso». */
export function drawGrid(S: Frame, G: GridGeom, M: number[][], o: { a?: number; rows?: string[]; cols?: string[]; size?: number; hlRow?: number; hlA?: number; rowA?: (i: number) => number; numbersRow?: number; numA?: number; tone?: Tone; colLabels?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'sig'), a = o.a ?? 1, size = o.size ?? fz(S, 12);
  if (a < 0.01) return;
  d.withAlpha(a, () => {
    for (let i = 0; i < G.n; i++) {
      const ra = o.rowA ? o.rowA(i) : 1;
      for (let j = 0; j < G.m; j++) {
        const x = G.x + j * G.cs, y = G.y + i * G.cs;
        d.rect(x + 0.5, y + 0.5, G.cs - 1, G.cs - 1, { fill: p.surface, stroke: alpha(p.line, 0.9), lw: 1 });
        const w = M[i]?.[j] ?? 0;
        if (ra > 0.01 && w > 0.004) {
          const s = (G.cs - 3) * Math.sqrt(clamp(w));
          d.rect(x + (G.cs - s) / 2, y + (G.cs - s) / 2, s, s, { fill: t.c, a: ra * (0.55 + 0.45 * clamp(w * 1.5)) });
        }
      }
    }
    if (o.hlRow !== undefined && (o.hlA ?? 1) > 0.01) d.rect(G.x - 2, G.y + o.hlRow * G.cs - 2, G.m * G.cs + 4, G.cs + 4, { stroke: tone(S, 'lat').c, lw: 2.5, r: 3, a: o.hlA ?? 1 });
    if (o.rows) o.rows.forEach((w, i) => d.text(w, G.x - 6 * S.u, G.y + (i + 0.5) * G.cs, { size, weight: i === o.hlRow ? 800 : 600, color: i === o.hlRow ? tone(S, 'lat').ink : p.ink2, align: 'right', base: 'middle' }));
    if (o.cols && o.colLabels !== false) o.cols.forEach((w, j) => {
      const c = S.ctx, cx = G.x + (j + 0.5) * G.cs, cy = G.y - 5 * S.u;
      c.save(); c.translate(cx, cy); c.rotate(-Math.PI / 4);
      d.text(w, 0, 0, { size, weight: 600, color: p.ink2, align: 'left', base: 'middle' });
      c.restore();
    });
    if (o.numbersRow !== undefined && (o.numA ?? 1) > 0.01) {
      const i = o.numbersRow;
      M[i].forEach((w, j) => {
        if (w < 0.095) return;
        const x = G.x + (j + 0.5) * G.cs, y = G.y + (i + 0.5) * G.cs;
        d.text(S.n(w * 100, 0), x, y + 0.5, { size: Math.min(size, G.cs * 0.48 / S.u), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.surface, haloW: 3, a: o.numA ?? 1 });
      });
    }
  });
}

// ═════════ escala de significado (los dos sentidos de «banco») ═════════
/** Una recta con los dos sentidos en los extremos y un marcador para el vector de «banco» (posición = dinero − asiento). */
export function senseScale(S: Frame, r: Rect, v: [number, number], o: { a?: number; dims: [string, string]; ghost?: [number, number]; ghostA?: number; caption?: string } ) {
  const { d, pal: p } = S, a = o.a ?? 1, u = S.u;
  if (a < 0.01) return;
  const size = fz(S, 13), lt = tone(S, 'lat');
  const lwA = d.measure(o.dims[0], { size, weight: 700 }), lwB = d.measure(o.dims[1], { size, weight: 700 });
  const x0 = r.x + lwA + 12 * u, x1 = r.x + r.w - lwB - 12 * u, y = r.y + r.h * 0.62;
  const pos = (vv: [number, number]) => x0 + (x1 - x0) * clamp(0.5 + (vv[1] - vv[0]) / 2);
  d.withAlpha(a, () => {
    d.line(x0, y, x1, y, p.line, 2);
    d.line(x0, y - 5 * u, x0, y + 5 * u, p.mute, 1.5); d.line(x1, y - 5 * u, x1, y + 5 * u, p.mute, 1.5);
    d.line((x0 + x1) / 2, y - 3 * u, (x0 + x1) / 2, y + 3 * u, p.mute, 1);
    d.text(o.dims[0], x0 - 8 * u, y, { size, weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    d.text(o.dims[1], x1 + 8 * u, y, { size, weight: 700, color: p.ink2, align: 'left', base: 'middle' });
    if (o.ghost && (o.ghostA ?? 1) > 0.01) d.circle(pos(o.ghost), y, 6 * u, { stroke: p.mute, lw: 1.5, dash: [2, 2], a: o.ghostA ?? 1 });
    const x = pos(v);
    d.circle(x, y, 7 * u, { fill: lt.c, stroke: p.stage, lw: 2 });
    if (o.caption) d.text(o.caption, x, y - 13 * u, { size: fz(S, 12), weight: 700, color: lt.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
  });
}

/** Texto con tramos de distinto color, centrado en cx (o alineado a la izquierda). */
export function rich(S: Frame, parts: [string, string][], cx: number, y: number, o: { size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; left?: boolean } = {}) {
  const size = o.size ?? fz(S, 14), weight = o.weight ?? 800, font = o.font ?? 'mono';
  const ws = parts.map(([t]) => S.d.measure(t, { size, weight, font })), W = ws.reduce((a, b) => a + b, 0);
  let x = o.left ? cx : cx - W / 2;
  parts.forEach(([t, c], i) => { S.d.text(t, x, y, { size, weight, font, color: c, base: 'middle', a: o.a }); x += ws[i]; });
  return W;
}
