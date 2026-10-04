// Utilidades de dibujo compartidas por los actos de la lección «Evaluar sistemas de IA».
import { alpha, clamp, inset, split, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de texto garantizando ≥ 12 px efectivos (el lienzo ya multiplica por S.u). */
export const fs = (S: Frame, v: number) => Math.max(v, 12.5 / S.u);
/** Número con la convención de cada idioma: es → 1 205 · 15 908 · 43.9 (espacio fino de miles y punto decimal, español de México); en → 1,205 · 15,908 · 43.9. */
export function nf(S: Frame, x: number, digits = 0): string {
  const s = x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (S.lang === 'en') return s;
  const g = Math.abs(x) < 10000 ? s.replace(/,/g, '') : s.replace(/,/g, '\u202f');
  return g;
}
/** Porcentaje: «78 %» en español, «78%» en inglés. */
export const pc = (S: Frame, v: number, digits = 0) => (S.lang === 'es' ? `${nf(S, v, digits)} %` : `${nf(S, v, digits)}%`);
export const pcu = (S: Frame, v: number, digits = 0) => pc(S, v * 100, digits);

/** Panel con título; devuelve el interior. */
export function panel(S: Frame, r: Rect, title: string, o: { a?: number; tone?: Tone; sub?: string } = {}): Rect {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: o.tone ? t.c : p.line, lw: o.tone ? 1.5 : 1.2, r: 4 });
    d.text(title, r.x + 12 * u, r.y + 10 * u, { size: fs(S, 13), weight: 800, color: o.tone ? t.ink : p.ink, base: 'top', w: r.w - 24 * u });
    if (o.sub) d.text(o.sub, r.x + 12 * u, r.y + 28 * u, { size: fs(S, 11.5), weight: 600, color: p.mute, base: 'top', w: r.w - 24 * u });
  });
  const top = (o.sub ? 50 : 34) * u;
  return { x: r.x + 10 * u, y: r.y + top, w: r.w - 20 * u, h: r.h - top - 8 * u };
}

/** Rótulo pequeño «ilustrativo» u otra nota, alineado a la derecha arriba de un rectángulo. */
export function stamp(S: Frame, text: string, x: number, y: number, a = 1, align: CanvasTextAlign = 'right') {
  S.d.withAlpha(a, () => S.d.tag(text, x, y, { color: S.pal.mute, fill: S.pal.stage, stroke: S.pal.line, size: fs(S, 11.5), align }));
}

/** Pie de fuente. */
export function source(S: Frame, text: string, x: number, y: number, w: number, a = 1, align: CanvasTextAlign = 'left') {
  S.d.text(text, x, y, { size: fs(S, 11.5), weight: 500, color: S.pal.mute, w, a, base: 'bottom', align, halo: S.pal.stage, haloW: 3 });
}

/** Barra horizontal simple con fondo, relleno y valor. `v` en 0..1 del ancho. */
export function hbar(S: Frame, x: number, y: number, w: number, h: number, v: number, t: Tone, o: { a?: number; outline?: boolean; dash?: boolean } = {}) {
  const { d, pal: p } = S, tc = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface2 });
    if (o.outline) d.rect(x, y, Math.max(0, w * v), h, { stroke: tc.c, lw: 2, dash: o.dash ? [4, 3] : undefined, fill: alpha(tc.c, 0.12) });
    else d.rect(x, y, Math.max(0, w * clamp(v)), h, { fill: tc.c });
  });
}

/** Rejilla de celdas cuadradas (una «matriz de píxeles»). `paint(i, x, y, cs)` dibuja la celda i. */
export function cells(S: Frame, r: Rect, cols: number, rows: number, paint: (i: number, x: number, y: number, cs: number) => void, maxCell = 40) {
  const cs = Math.min(r.w / cols, r.h / rows, maxCell * S.u), gw = cs * cols, gh = cs * rows;
  const x0 = r.x + (r.w - gw) / 2, y0 = r.y + (r.h - gh) / 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) paint(j * cols + i, x0 + i * cs, y0 + j * cs, cs);
  return { x: x0, y: y0, w: gw, h: gh, cs };
}

/** Marca de acierto (✓ como trazo) o fallo (✗) con forma propia, para no depender solo del color. */
export function tick(S: Frame, x: number, y: number, s: number, ok: boolean, o: { a?: number } = {}) {
  const { d } = S, t = tone(S, ok ? 'dat' : 'err');
  d.withAlpha(o.a ?? 1, () => {
    if (ok) d.polyline([[x - s * 0.5, y], [x - s * 0.12, y + s * 0.4], [x + s * 0.55, y - s * 0.42]], t.c, 2.4);
    else { d.line(x - s * 0.42, y - s * 0.42, x + s * 0.42, y + s * 0.42, t.c, 2.4); d.line(x - s * 0.42, y + s * 0.42, x + s * 0.42, y - s * 0.42, t.c, 2.4); }
  });
}

/** Tarjeta con varias líneas de texto (para respuestas, casos…). Devuelve el alto usado. */
export function card(S: Frame, r: Rect, lines: { t: string; w?: number; c?: string; size?: number; mono?: boolean }[], o: { tone?: Tone; a?: number; fill?: string; dash?: boolean; pad?: number } = {}) {
  const { d, pal: p } = S, u = S.u, tc = o.tone ? tone(S, o.tone) : null, pad = (o.pad ?? 9) * u;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? p.surface, stroke: tc ? tc.c : p.lineStrong, lw: 1.5, r: 3, dash: o.dash ? [5, 4] : undefined });
    let y = r.y + pad;
    for (const ln of lines) {
      const size = fs(S, ln.size ?? 12.5);
      const h = d.text(ln.t, r.x + pad, y, { size, weight: ln.w ?? 600, color: ln.c ?? p.ink, base: 'top', w: r.w - 2 * pad, font: ln.mono ? 'mono' : undefined }).h;
      y += h + 3 * u;
    }
  });
}

/** Eje horizontal con marcas y etiquetas. Devuelve la función de mapeo valor → x. */
export function hAxis(S: Frame, x0: number, x1: number, y: number, lo: number, hi: number, ticks: number[], fmt: (v: number) => string, a = 1, labelDy = 8) {
  const { d, pal: p } = S, u = S.u, X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  d.withAlpha(a, () => {
    d.line(x0, y, x1, y, p.lineStrong, 1.5);
    ticks.forEach((v) => {
      if (v < lo - 1e-9 || v > hi + 1e-9) return;
      d.line(X(v), y, X(v), y + 5 * u, p.lineStrong, 1.5);
      d.text(fmt(v), X(v), y + labelDy * u, { size: fs(S, 11.5), font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
  });
  return X;
}

/** Reparto del escenario con una banda inferior reservada al pie (fuente / «ilustrativo»). Principal + lateral (horizontal) o principal + inferior (vertical). */
export function layout(S: Frame, ratio = 0.66, o: { foot?: boolean; gap?: number } = {}) {
  const u = S.u, m = 14 * u, f = o.foot === false ? 0 : (S.portrait ? 40 : 30) * u;
  const all: Rect = { x: m, y: m * 0.8, w: S.W - 2 * m, h: S.H - m * 0.8 - m * 0.5 - f };
  const gap = (o.gap ?? 14) * u;
  const [main, aside] = S.portrait ? split(all, 'v', Math.max(ratio, 0.6), gap * 0.8) : split(all, 'h', ratio, gap);
  return { all, main, aside };
}

/** Pie del escenario: una etiqueta opcional (p. ej. «ilustrativo») y la fuente, en hasta dos líneas, pegado al borde inferior. */
export function foot(S: Frame, text: string, o: { tag?: string; a?: number; tagTone?: Tone } = {}) {
  const { d, pal: p } = S, u = S.u, size = fs(S, 11.5), x = 14 * u, w = S.W - 28 * u, yb = S.H - 7 * u;
  d.withAlpha(o.a ?? 1, () => {
    let tx = x, tw = w;
    if (o.tag) {
      const tg = tone(S, o.tagTone ?? 'mute'), r = d.tag(o.tag, x, yb - 10 * u, { size, weight: 700, color: o.tagTone ? tg.ink : p.ink2, fill: o.tagTone ? tg.soft : p.surface2, stroke: o.tagTone ? tg.c : p.lineStrong, align: 'left' });
      tx = x + r.w + 8 * u; tw = w - r.w - 8 * u;
    }
    const lines = d.wrap(text, tw, { size, weight: 500 }), lh = size * 1.3 * u, n = Math.min(2, lines.length);
    d.text(lines.slice(0, n).join('\n'), tx, yb - (n - 1) * lh, { size, weight: 500, color: p.mute, base: 'bottom', halo: p.stage, haloW: 3, lh: 1.3 });
  });
}

/** Caja con título y subtítulo, ambos ≥ 12 px (el `box` del kit usa 11 px para el subtítulo). */
export function tbox(S: Frame, r: Rect, label: string, o: { sub?: string; tone?: Tone; a?: number; active?: number; size?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.28 * (o.active ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: 1.6, r: 3 });
    const size = fs(S, o.size ?? 14.5), sub = fs(S, 12.5), w = r.w - 14 * u;
    const lh = d.wrap(label, w, { size, weight: 800 }).length * size * 1.25 * u, sh = o.sub ? d.wrap(o.sub, w, { size: sub, weight: 600 }).length * sub * 1.3 * u : 0;
    const top = r.y + (r.h - lh - sh - (o.sub ? 4 * u : 0)) / 2;
    d.text(label, r.x + r.w / 2, top, { size, weight: 800, color: o.tone ? t.ink : p.ink, align: 'center', base: 'top', w, lh: 1.25 });
    if (o.sub) d.text(o.sub, r.x + r.w / 2, top + lh + 4 * u, { size: sub, weight: 600, color: p.ink2, align: 'center', base: 'top', w });
  });
}
