// Ayudas de dibujo propias de la lección (el kit no trae tarjetas de calculadora, marcas ✓/✗ ni llaves con rótulo).
// Todo texto respeta ≥ 12 px efectivos (FS) y todos los colores salen de tone()/S.pal (nunca hex).
import { alpha, clamp, inset, lerp, tone, type Frame, type Plot, type Rect, type Tone } from '../../../../../theme/kit';
import type { Lang } from './model';

export const lang = (S: Frame) => S.lang as Lang;
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
/** Verdadero cuando `cond` se ha cumplido sin interrupción durante `secs` segundos: para que un gate se complete al detenerse en la respuesta y no al pasar de largo con el deslizador. */
export function holds(S: Frame, key: string, cond: boolean, secs = 0.5): boolean {
  const st = (S.st.hold ??= {} as Record<string, number>);
  st[key] = cond ? (st[key] ?? 0) + S.dt : 0;
  return st[key] >= secs;
}
/** Área útil con márgenes. */
export const pad = (S: Frame, m = 14) => inset(S.full(), m * S.u);

/** Texto que se encoge hasta caber en `w` (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: string; a?: number } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo, a: o.a });
}

/** Texto con halo del color del escenario (legible sobre líneas y rellenos). */
export function tagText(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; base?: CanvasTextBaseline; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; w?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 700, color: o.t ? c.ink : S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, halo: S.pal.stage, haloW: 4, a: o.a, w: o.w });
}

/** Nota al pie que puede ocupar varias líneas: la última línea queda en `yBottom` y el resto crece hacia arriba (nunca se sale del escenario). */
export function noteUp(S: Frame, str: string, x: number, yBottom: number, w: number, o: { t?: Tone; align?: CanvasTextAlign; size?: number; weight?: number } = {}) {
  const size = FS(S, o.size ?? 12), weight = o.weight ?? 600, n = S.d.wrap(str, w, { size, weight }).length, lh = 1.3 * size * S.u;
  return S.d.text(str, x, yBottom - (n - 1) * lh, { size, weight, color: tone(S, o.t ?? 'mute').ink, align: o.align ?? 'left', base: 'bottom', halo: S.pal.stage, haloW: 4, w });
}

/** Rótulo en pastilla (≥ 12 px efectivos). */
export function pill(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; a?: number; mono?: boolean } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.tag(str, x, y, { color: o.t ? c.ink : S.pal.ink2, fill: o.t ? c.soft : S.pal.surface, stroke: o.t ? c.c : S.pal.line, align: o.align, a: o.a, size: FS(S, 12), font: o.mono ? 'mono' : 'ui' });
}

/** Tarjeta: rótulo arriba, valor abajo. `assume` = borde punteado (supuesto ilustrativo). */
export function chip(S: Frame, r: Rect, label: string, value: string, t: Tone, o: { assume?: boolean; a?: number; hot?: number; vsize?: number } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, t), hot = o.hot ?? 0;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.07 + 0.3 * hot), stroke: c.c, lw: hot > 0.3 ? 2.2 : 1.4, r: 3, dash: o.assume ? [5, 3] : undefined });
    fitText(S, label, r.x + r.w / 2, r.y + 4 * u, r.w - 8 * u, 12, { weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, value, r.x + r.w / 2, r.y + r.h - 5 * u, r.w - 8 * u, o.vsize ?? 16, { weight: 700, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
  });
}

/** Operador entre tarjetas (×, ÷, =). */
export function op(S: Frame, x: number, y: number, ch: string, a = 1) {
  S.d.text(ch, x, y, { size: FS(S, 17), weight: 700, font: 'mono', color: S.pal.mute, align: 'center', base: 'middle', a });
}

/** Marca ✓ (cabe, se cumple) o ✗ (no cabe): la forma acompaña al color. */
export function mark(S: Frame, x: number, y: number, ok: boolean, o: { r?: number; a?: number } = {}) {
  const { d } = S, r = (o.r ?? 7) * S.u, c = tone(S, ok ? 'dat' : 'err').c;
  d.withAlpha(o.a ?? 1, () => {
    if (ok) d.polyline([[x - r * 0.9, y + r * 0.05], [x - r * 0.25, y + r * 0.7], [x + r, y - r * 0.8]], c, 2.8);
    else { d.line(x - r * 0.8, y - r * 0.8, x + r * 0.8, y + r * 0.8, c, 2.8); d.line(x - r * 0.8, y + r * 0.8, x + r * 0.8, y - r * 0.8, c, 2.8); }
  });
}

/** Llave horizontal con rótulo (marca un tramo). `up` = la llave abre hacia arriba y el texto va debajo. */
export function brace(S: Frame, x1: number, x2: number, y: number, label: string, t: Tone = 'ink', o: { up?: boolean; a?: number } = {}) {
  const { d } = S, c = tone(S, t), h = 6 * S.u, s = o.up ? -1 : 1;
  d.withAlpha(o.a ?? 1, () => {
    d.polyline([[x1, y - s * h], [x1, y], [x2, y], [x2, y - s * h]], c.c, 1.6);
    S.d.text(label, (x1 + x2) / 2, y + s * 4 * S.u, { size: FS(S, 12), weight: 700, color: c.ink, align: 'center', base: o.up ? 'bottom' : 'top', halo: S.pal.stage, haloW: 4 });
  });
}

/** Barra horizontal de una sola cifra: fondo + relleno (0..1). */
export function hbar(S: Frame, r: Rect, frac: number, t: Tone, o: { a?: number; hatch?: boolean; stroke?: boolean } = {}) {
  const { d, pal: p } = S, c = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2 });
    const w = Math.max(frac > 0 ? 2 : 0, r.w * clamp(frac));
    if (o.hatch) { d.rect(r.x, r.y, w, r.h, { fill: alpha(c.c, 0.18) }); d.rect(r.x, r.y, w, r.h, { stroke: c.c, lw: 1.4, dash: [4, 3] }); }
    else d.rect(r.x, r.y, w, r.h, { fill: c.c });
    if (o.stroke) d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1 });
  });
}

/** Rectángulo intermedio entre dos (para que una pieza se desplace al cambiar de segmento). */
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/** Aparición de una escena entre su primer segmento y el primero de la siguiente (fundido corto). */
export function fadeFor(S: Frame, from: string, to?: string, dur = 0.5): number {
  if (!S.on(from)) return 0;
  const a = S.at(from, 0, dur, 'out'), b = to ? S.at(to, 0, dur * 0.8, 'out') : 0;
  return a * (1 - b);
}

/** Dibuja `fn` con la opacidad dada, solo si es visible. */
export const show = (S: Frame, a: number, fn: () => void) => { if (a > 0.004) S.d.withAlpha(a, fn); };

/** Palabras de ejemplo para los diagramas de tokens (palabras en lugar de piezas: simplificación rotulada). */
export const WORDS = {
  es: {
    prompt: ['Resume', 'este', 'contrato', 'en', 'tres', 'puntos', 'breves', ',', 'por', 'favor'],
    reply: ['El', 'plazo', 'es', 'de', 'doce', 'meses', ',', 'se', 'paga', 'cada', 'mes', 'y', 'se', 'renueva', 'solo', '.'],
  },
  en: {
    prompt: ['Please', 'summarize', 'this', 'contract', 'for', 'me', 'in', 'three', 'short', 'points'],
    reply: ['The', 'term', 'is', 'twelve', 'months', ',', 'it', 'is', 'paid', 'every', 'month', 'and', 'renews', 'by', 'itself', '.'],
  },
} as const;

/** Ejes de una gráfica con texto ≥ 12 px (usa las coordenadas del Plot del kit: X, Y, r, outer). */
export function axes(S: Frame, pl: Plot, o: { xTicks: number[]; yTicks: number[]; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel?: string; yLabel?: string; grid?: boolean; a?: number }) {
  const { d, pal: p } = S, u = S.u, r = pl.r, a = o.a ?? 1, ts = FS(S, 11.5);
  d.withAlpha(a, () => {
    if (o.grid) {
      o.xTicks.forEach((v) => d.line(pl.X(v), r.y, pl.X(v), r.y + r.h, p.line, 1));
      o.yTicks.forEach((v) => d.line(r.x, pl.Y(v), r.x + r.w, pl.Y(v), p.line, 1));
    }
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    o.xTicks.forEach((v) => { const x = pl.X(v); d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(o.xFmt(v), x, r.y + r.h + 7 * u, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    o.yTicks.forEach((v) => { const y = pl.Y(v); d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5); d.text(o.yFmt(v), r.x - 7 * u, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    if (o.xLabel) d.text(o.xLabel, r.x + r.w, r.y + r.h + 7 * u + ts * u + 5 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    if (o.yLabel) d.text(o.yLabel, pl.outer.x + 2, r.y - 6 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
  });
}

/** Polilínea recortada al área de la gráfica. */
export function line2(S: Frame, pl: Plot, pts: [number, number][], t: Tone, lw = 2.5, o: { dash?: number[]; a?: number } = {}) {
  const c = tone(S, t).c;
  S.d.clip(pl.r.x, pl.r.y - 2, pl.r.w, pl.r.h + 4, () => S.d.polyline(pts.map(([x, y]) => [pl.X(x), pl.Y(y)] as [number, number]), c, lw, { dash: o.dash, a: o.a }));
}

/** Ancho de un token del kit (sin dibujarlo): texto + 18 px de margen. */
export const tokW = (S: Frame, text: string, size: number) => S.d.measure(text, { size, weight: 600 }) + 18 * S.u;
