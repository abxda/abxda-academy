// Utilidades de dibujo de la lección «Secuencias y memoria»: tamaño mínimo de texto, números con el formato del idioma,
// texto con tramos de color, paneles y la geometría común de la «línea de pasos» (columnas en horizontal, filas en teléfono).
// Todo es PURO: solo lee lo que se le pasa. Los tiempos y los segmentos viven en scene.ts.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── texto ───────────────────────────────────────────────────────────────────
/** Escala de diseño: en escenarios amplios (escritorio) los elementos y el texto crecen hasta un 40 %; en teléfono vale 1. */
export const kk = (S: Frame) => clamp(Math.min(S.W / 720, S.H / 405), 1, 1.4);
/** Unidad de diseño: S.u (escala del tema) por la escala de diseño. */
export const uu = (S: Frame) => S.u * kk(S);
/** Tamaño pedido a d.text() para que el texto efectivo (size × u) nunca baje de ~12 px. */
export const fz = (S: Frame, n = 13) => Math.max(n * kk(S), 12.3 / S.u);
/** Número con el formato del idioma (coma decimal en español) y signo «−» tipográfico. */
export const num = (S: Frame, v: number, digits = 2, sign = false) => {
  let s = Math.abs(v).toFixed(digits);
  const neg = v < 0 && Number(s) !== 0;
  if (S.lang === 'es') s = s.replace('.', ',');
  return (neg ? '−' : sign && Number(s.replace(',', '.')) !== 0 ? '+' : '') + s;
};
/** Porcentaje (0..1 → «7 %»). */
export const pct = (S: Frame, v: number, digits = 0) => `${num(S, v * 100, digits)} %`;
/** Factor «×0,69». */
export const times = (S: Frame, v: number, digits = 2) => `×${num(S, v, digits)}`;

export type Role = Tone | 'ink2';
export type Part = [string, Role, boolean?];
const roleInk = (S: Frame, r: Role) => (r === 'ink2' ? S.pal.ink2 : tone(S, r).ink);

/** Una línea de texto con tramos de color. Se encoge (hasta el mínimo legible) si no cabe en maxW. Devuelve el ancho. */
export function rich(S: Frame, x: number, y: number, parts: Part[], o: { size?: number; a?: number; maxW?: number; align?: 'left' | 'center' | 'right'; font?: 'mono' | 'ui' } = {}) {
  const d = S.d, font = o.font ?? 'ui';
  let size = fz(S, o.size ?? 13);
  const width = (sz: number) => parts.reduce((s, [t, , b]) => s + d.measure(t, { size: sz, weight: b ? 700 : 500, font }), 0);
  let tw = width(size);
  if (o.maxW && tw > o.maxW) { size = Math.max(12.3 / S.u, size * (o.maxW / tw)); tw = width(size); }
  let cx = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
  d.withAlpha(o.a ?? 1, () => {
    for (const [t, r, b] of parts) {
      d.text(t, cx, y, { size, weight: b ? 700 : 500, font, color: roleInk(S, r), base: 'middle' });
      cx += d.measure(t, { size, weight: b ? 700 : 500, font });
    }
  });
  return tw;
}

/** Texto que se encoge (hasta el mínimo legible) para caber en maxW. */
export function fit(S: Frame, text: string, x: number, y: number, maxW: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; font?: 'ui' | 'mono'; a?: number; halo?: boolean } = {}) {
  const d = S.d;
  let size = fz(S, o.size ?? 13);
  const w0 = d.measure(text, { size, weight: o.weight ?? 600, font: o.font });
  if (w0 > maxW) size = Math.max(12.3 / S.u, size * (maxW / w0));
  d.text(text, x, y, { size, weight: o.weight ?? 600, color: o.color ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}

// ── tiempo ──────────────────────────────────────────────────────────────────
/** Opacidad de un bloque que vive entre el inicio del segmento a y el del b (con fundidos de entrada y de salida). */
export const win = (S: Frame, a: string, b?: string, fin = 0.7, fout = 0.5) => S.at(a, 0, fin) * (b ? 1 - S.at(b, 0, fout) : 1);

// ── paneles ─────────────────────────────────────────────────────────────────
/** Fondo de un panel (la «banda» de explicación o la columna de lecturas). Devuelve el interior. */
export function panel(S: Frame, r: Rect, a = 1, edge: Tone | null = null): Rect {
  const u = uu(S);
  S.d.withAlpha(a, () => S.d.rect(r.x, r.y, r.w, r.h, { fill: S.pal.surface, stroke: edge ? tone(S, edge).c : S.pal.line, lw: 1.5, r: 4 }));
  return inset(r, 7 * u, 10 * u, 7 * u, 10 * u);
}
/** Título pequeño de un panel; devuelve la y de la primera línea de contenido (centro). */
export function panelTitle(S: Frame, r: Rect, text: string, t: Tone, a = 1, sub?: string) {
  const d = S.d, size = fz(S, 12.5), lh = size * uu(S) * 1.5;
  d.withAlpha(a, () => {
    fit(S, text, r.x, r.y + lh / 2, sub ? r.w * 0.62 : r.w, { size: 12.5, weight: 800, color: tone(S, t).ink });
    if (sub) fit(S, sub, r.x + r.w, r.y + lh / 2, r.w * 0.38, { size: 12, weight: 500, color: S.pal.mute, align: 'right' });
  });
  return r.y + lh;
}

// ── geometría común de la línea de pasos ────────────────────────────────────
export const NSLOT = 8;     // siete palabras leídas + la que se predice
export const NCOL = 7;      // columnas con celda y estado

export interface Lane {
  vertical: boolean;
  all: Rect;
  area: Rect;
  band: Rect;
  /** Rectángulos de la columna (o fila) i = 0..7. */
  tok: (i: number) => Rect;
  cell: (i: number) => Rect;
  st: (i: number) => Rect;
  inf: (i: number) => Rect;
  /** Centro del paso i a lo largo del eje del tiempo y tamaño del paso. */
  along: (i: number) => number;
  step: number;
}

export function lane(S: Frame): Lane {
  const u = uu(S), vertical = S.portrait;
  const all = inset(S.full(), 13 * u);
  const bh = vertical ? clamp(S.H * 0.21, 78 * u, 104 * u) : clamp(S.H * 0.19, 56 * u, 92 * u);
  const gap = 8 * u;
  const band: Rect = { x: all.x, y: all.y + all.h - bh, w: all.w, h: bh };
  const area: Rect = { x: all.x, y: all.y, w: all.w, h: all.h - bh - gap };
  if (!vertical) {
    const cw = area.w / NSLOT;
    const h = area.h, g = Math.min(0.045 * h, 11 * u);
    const tokH = Math.min(0.14 * h, 34 * u), cellH = Math.min(0.12 * h, 32 * u), stH = Math.min(0.28 * h, 84 * u), infH = Math.min(0.34 * h, 112 * u);
    const total = tokH + cellH + stH + infH + 3 * g;
    const y0 = area.y + Math.max(0, (h - total) * 0.35);
    const cellW = Math.min(cw * 0.66, 54 * u), stW = Math.min(cw * 0.78, 62 * u);
    const mk = (y: number, hh: number, w: number) => (i: number): Rect => ({ x: area.x + cw * (i + 0.5) - w / 2, y, w, h: hh });
    const tokW = cw - 4 * u;
    return {
      vertical, all, area, band, step: cw, along: (i) => area.x + cw * (i + 0.5),
      tok: mk(y0, tokH, tokW), cell: mk(y0 + tokH + g, cellH, cellW), st: mk(y0 + tokH + cellH + 2 * g, stH, stW), inf: mk(y0 + tokH + cellH + stH + 3 * g, infH, cw - 6 * u),
    };
  }
  const rh = area.h / NSLOT;
  const tokW = 66 * u, cellW = 40 * u, stW = 100 * u, g = 9 * u;
  const infW = Math.max(60 * u, area.w - tokW - cellW - stW - 3 * g);
  const rowH = Math.min(rh - 5 * u, 36 * u);
  const mk = (x: number, w: number, hh = rowH) => (i: number): Rect => ({ x, y: area.y + rh * (i + 0.5) - hh / 2, w, h: hh });
  return {
    vertical, all, area, band, step: rh, along: (i) => area.y + rh * (i + 0.5),
    tok: mk(area.x, tokW, Math.min(rowH, 27 * u)), cell: mk(area.x + tokW + g, cellW, Math.min(rowH, 27 * u)),
    st: mk(area.x + tokW + cellW + 2 * g, stW), inf: mk(area.x + tokW + cellW + stW + 3 * g, infW),
  };
}

/** Centro de un rectángulo. */
export const mid = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];

/** Una palabra (ficha violeta) centrada en (cx, cy); se encoge si no cabe en maxW. Devuelve su caja. */
export function tok(S: Frame, text: string, cx: number, cy: number, o: { maxW?: number; h?: number; a?: number; active?: number; dashed?: boolean; tone?: Tone; size?: number } = {}): Rect {
  const d = S.d, t = tone(S, o.tone ?? 'lat'), h = (o.h ?? 28) * uu(S);
  let size = fz(S, o.size ?? 13.5);
  const pad = 9 * uu(S), maxW = o.maxW ?? 1e9;
  let tw = d.measure(text, { size, weight: 600 });
  if (tw + 2 * pad > maxW) { size = Math.max(12.3 / S.u, size * ((maxW - 2 * pad) / tw)); tw = d.measure(text, { size, weight: 600 }); }
  const w = Math.min(maxW, tw + 2 * pad), r = { x: cx - w / 2, y: cy - h / 2, w, h };
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.14 + 0.5 * (o.active ?? 0)), stroke: t.c, lw: 1.5, r: 3, dash: o.dashed ? [4, 3] : undefined });
    d.text(text, cx, cy, { size, weight: 600, color: (o.active ?? 0) > 0.6 ? S.pal.stage : t.ink, align: 'center', base: 'middle' });
  });
  return r;
}

/** Barras del estado oculto (6 valores en −1..1): positivo hacia arriba y relleno; negativo hacia abajo y hueco. */
export function stateBars(S: Frame, r: Rect, h: number[], o: { a?: number; tone?: Tone; vertical?: boolean; hot?: boolean } = {}) {
  const d = S.d, t = tone(S, o.tone ?? 'dat'), n = h.length, bw = (r.w / n) * 0.66, step = r.w / n, cy = r.y + r.h / 2, half = r.h / 2 - 2 * uu(S);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x - 2, r.y, r.w + 4, r.h, { fill: alpha(t.c, 0.05), stroke: o.hot ? t.c : S.pal.line, lw: o.hot ? 2 : 1, r: 2 });
    d.line(r.x, cy, r.x + r.w, cy, S.pal.lineStrong, 1);
    h.forEach((v, i) => {
      const x = r.x + step * i + (step - bw) / 2, hh = Math.max(1, Math.abs(v) * half);
      if (v >= 0) d.rect(x, cy - hh, bw, hh, { fill: t.c });
      else d.rect(x, cy, bw, hh, { fill: alpha(t.c, 0.18), stroke: t.c, lw: 1.5 });
    });
  });
}

/** Flecha entre dos puntos con trazo progresivo p (0..1). */
export function arrow(S: Frame, x1: number, y1: number, x2: number, y2: number, c: string, o: { lw?: number; head?: number; a?: number; p?: number; dash?: number[] } = {}) {
  const p = clamp(o.p ?? 1); if (p <= 0) return;
  const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p, head = (o.head ?? 7) * Math.max(0.9, uu(S));
  S.d.withAlpha(o.a ?? 1, () => { if (p > 0.97 && !o.dash) S.d.arrow(x1, y1, x2, y2, c, o.lw ?? 2, head); else S.d.line(x1, y1, ex, ey, c, o.lw ?? 2, o.dash); });
}
/** Polilínea con cabeza de flecha al final. */
export function elbow(S: Frame, pts: [number, number][], c: string, o: { lw?: number; head?: number; a?: number } = {}) {
  const d = S.d, n = pts.length, head = (o.head ?? 7) * Math.max(0.9, uu(S));
  d.withAlpha(o.a ?? 1, () => {
    const body = pts.slice(0, n - 1), [bx, by] = pts[n - 2], [ex, ey] = pts[n - 1];
    const ang = Math.atan2(ey - by, ex - bx);
    body.push([ex - Math.cos(ang) * head * 0.7, ey - Math.sin(ang) * head * 0.7]);
    d.polyline(body, c, o.lw ?? 2);
    d.polygon([[ex, ey], [ex - Math.cos(ang - 0.45) * head, ey - Math.sin(ang - 0.45) * head], [ex - Math.cos(ang + 0.45) * head, ey - Math.sin(ang + 0.45) * head]], { fill: c });
  });
}
