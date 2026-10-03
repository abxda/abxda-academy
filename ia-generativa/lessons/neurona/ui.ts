// Utilidades de dibujo propias de la lección: texto con tamaño mínimo legible, etiquetas, lecturas y geometría.
import { alpha, clamp, ease, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { fmtN } from './model';

type TextOpts = NonNullable<Parameters<Frame['d']['text']>[3]>;

/** Tamaño tipográfico que nunca baja de ≈12 px efectivos (el kit multiplica por S.u). */
export const fs = (S: Frame, n: number) => Math.max(n, 12.3 / S.u);

export function txt(S: Frame, s: string, x: number, y: number, o: TextOpts = {}) {
  return S.d.text(s, x, y, { ...o, size: fs(S, o.size ?? 13) });
}
/** Número con coma/punto del idioma y signo menos tipográfico. */
export const num = (S: Frame, x: number, d = 2, plus = false) => fmtN(x, S.lang, d, plus);

/** Etiqueta con fondo (rotula elementos del diagrama). `opaque` tapa lo que haya debajo (líneas, regiones). */
export function tag(S: Frame, s: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; size?: number; mono?: boolean; weight?: number; opaque?: boolean } = {}) {
  const t = tone(S, o.tone ?? 'ink'), size = fs(S, o.size ?? 12), u = S.u, pad = 6 * u;
  if (o.opaque) {
    const tw = S.d.measure(s, { size, weight: o.weight ?? 600, font: o.mono ? 'mono' : 'ui' }), h = size * u + pad * 1.2, w = tw + pad * 2;
    const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    S.d.rect(x0, y - h / 2, w, h, { fill: S.pal.stage, r: 2, a: o.a });
  }
  return S.d.tag(s, x, y, { color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, size, font: o.mono ? 'mono' : 'ui', weight: o.weight });
}

/** Lectura: rótulo pequeño y valor grande en mono. Devuelve el alto ocupado. */
export function stat(S: Frame, x: number, y: number, label: string, value: string, o: { tone?: Tone; size?: number; align?: CanvasTextAlign; a?: number } = {}) {
  const t = tone(S, o.tone ?? 'ink'), u = S.u, ls = fs(S, 12), vs = fs(S, o.size ?? 22);
  txt(S, label, x, y, { size: 12, weight: 700, color: S.pal.mute, base: 'top', align: o.align, a: o.a });
  txt(S, value, x, y + ls * u * 1.15, { size: o.size ?? 22, weight: 700, font: 'mono', color: o.tone ? t.ink : S.pal.ink, base: 'top', align: o.align, a: o.a });
  return ls * u * 1.15 + vs * u * 1.2;
}

/** Fila de lecturas (teléfono) o columna (escritorio) dentro de un rectángulo. Devuelve el alto usado. */
export function statBlock(S: Frame, r: Rect, items: { l: string; v: string; t?: Tone }[], o: { row?: boolean; size?: number; a?: number } = {}) {
  const row = o.row ?? S.portrait, n = items.length;
  let used = 0;
  if (row) {
    const cw = r.w / n;
    items.forEach((it, i) => { used = Math.max(used, stat(S, r.x + i * cw, r.y, it.l, it.v, { tone: it.t, size: o.size ?? 20, a: o.a })); });
  } else {
    let y = r.y;
    items.forEach((it) => { y += stat(S, r.x, y, it.l, it.v, { tone: it.t, size: o.size ?? 22, a: o.a }) + 6 * S.u; });
    used = y - r.y;
  }
  return used;
}

/** Rectángulo de la proporción pedida (ancho/alto), centrado dentro de r. */
export function fit(r: Rect, aspect: number): Rect {
  let w = r.w, h = w / aspect;
  if (h > r.h) { h = r.h; w = h * aspect; }
  return { x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h };
}

export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t });

/** Texto en partes de colores, centrado o alineado a la izquierda. Devuelve el ancho total. */
export function parts(S: Frame, items: [string, string, boolean?][], x: number, y: number, o: { size?: number; align?: 'center' | 'left'; a?: number; font?: 'mono' | 'ui' } = {}) {
  const size = fs(S, o.size ?? 18), font = o.font ?? 'mono';
  const ws = items.map(([t, , b]) => S.d.measure(t, { size, weight: b ? 800 : 600, font }));
  const total = ws.reduce((a, b) => a + b, 0);
  let cx = o.align === 'left' ? x : x - total / 2;
  items.forEach(([t, c, b], i) => { S.d.text(t, cx, y, { size, weight: b ? 800 : 600, font, color: c, base: 'middle', a: o.a }); cx += ws[i]; });
  return total;
}

/** Flecha con punta, usando el color del tema. */
export function arrow(S: Frame, x1: number, y1: number, x2: number, y2: number, color: string, lw = 2, head = 8, a = 1) {
  S.d.arrow(x1, y1, x2, y2, color, lw, head * Math.max(0.9, S.u), a);
}

export const soft = (c: string, a: number) => alpha(c, clamp(a));

/** Posición normalizada (0–1) dentro de un segmento: sigue el ritmo de la voz en cualquier idioma. */
export const tau = (S: Frame, id: string) => clamp((S.t - S.start(id)) / Math.max(0.5, S.end(id) - S.start(id)));
/** Progreso suave entre dos posiciones normalizadas. */
export const tr = (t: number, a: number, b: number, e: 'io' | 'out' | 'lin' = 'out') => ease[e](clamp((t - a) / (b - a || 1e-6)));
/** Interpolación suave entre fotogramas clave [posición, valor]. */
export const keys = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, v0] = k[i - 1], [t1, v1] = k[i]; return v0 + (v1 - v0) * ease.io(clamp((t - t0) / (t1 - t0))); }
  return k[k.length - 1][1];
};
