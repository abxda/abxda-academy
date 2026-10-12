// Piezas de dibujo de la lección «Ajuste fino y LoRA» (copiadas y adaptadas de las de la lección 25: el kit no garantiza un tamaño
// mínimo de texto ni trae estas piezas). Tiempo por fracciones de cada segmento, márgenes, texto que se achica o se parte (siempre
// ≥ 12 px efectivos), tarjetas, pastillas, flechas que se dibujan, cajas de GPU y el rótulo de procedencia.
// Todo pide roles de color (tone) y colores del tema (S.pal): nada de hex. Todo es puro: solo lee sus argumentos.
//
// Convención visual (no depende solo del color):
//   · w = parámetros que se entrenan (B, A, la corrección) · mute/ink = lo congelado (con candado)
//   · dat = datos y ejemplos · err = error, culpa, lo que se pierde (✕) · sig = la entrada · lat = prompt y RAG.
import { alpha, clamp, ease, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ───────── tiempo: siempre por fracciones de la duración del segmento (las voces y los idiomas duran distinto) ─────────
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 si aún no empieza). */
export function fr(S: Frame, k: string, a: number, b: number): number {
  if (!S.on(k)) return 0;
  const s = S.start(k), d = Math.max(0.6, S.end(k) - s);
  return clamp(((S.t - s) / d - a) / (b - a || 1e-6));
}
/** Aparición suave entre las fracciones a y b. */
export const ap = (S: Frame, k: string, a = 0, b = 0.12) => ease.out(fr(S, k, a, b));
/** Movimiento con entrada y salida suaves entre las fracciones a y b. */
export const mv = (S: Frame, k: string, a: number, b: number) => ease.io(fr(S, k, a, b));
/** Visible desde que empieza `k` hasta que empieza `until` (con desvanecido de entrada y de salida). */
export const hold = (S: Frame, k: string, until?: string, a = 0, b = 0.1) => ap(S, k, a, b) * (until && S.on(until) ? 1 - ap(S, until, 0, 0.08) : 1);

// ───────── espacio ─────────
/** ¿Escenario muy bajo (teléfono en horizontal)? */
export const isShort = (S: Frame) => !S.portrait && S.H < 330;
/** Área útil del escenario (deja abajo el alto del rótulo de procedencia). */
export function area(S: Frame): Rect {
  const m = isShort(S) ? 10 : S.portrait ? 12 : 18;
  return { x: m, y: m, w: S.W - 2 * m, h: S.H - 2 * m - provH(S) };
}
/** Divide un rectángulo en principal + lateral (horizontal) o principal + inferior (vertical). */
export function splitArea(S: Frame, A: Rect, ratio: number, gap = 16): [Rect, Rect] {
  const g = gap * S.u;
  if (S.portrait) { const h1 = (A.h - g) * ratio; return [{ x: A.x, y: A.y, w: A.w, h: h1 }, { x: A.x, y: A.y + h1 + g, w: A.w, h: A.h - h1 - g }]; }
  const w1 = (A.w - g) * ratio; return [{ x: A.x, y: A.y, w: w1, h: A.h }, { x: A.x + w1 + g, y: A.y, w: A.w - w1 - g, h: A.h }];
}

// ───────── texto ─────────
/** Tamaño nominal con mínimo de 12 px efectivos (d.text multiplica por S.u). */
export const fz = (S: Frame, n: number) => Math.max(n, 12.2 / S.u);
export interface TxtOpts { s?: number; c?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; weight?: number; mono?: boolean; halo?: boolean; a?: number; w?: number; lh?: number }
/** Texto con mínimo de 12 px efectivos. `s` es el tamaño nominal. */
export function txt(S: Frame, str: string, x: number, y: number, o: TxtOpts = {}) {
  return S.d.text(str, x, y, { size: fz(S, o.s ?? 13), weight: o.weight ?? 600, color: o.c ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.mono ? 'mono' : undefined, halo: o.halo ? S.pal.stage : undefined, haloW: 4, a: o.a, w: o.w, lh: o.lh });
}
export const measure = (S: Frame, str: string, s = 13, mono = false, weight = 600) => S.d.measure(str, { size: fz(S, s), weight, font: mono ? 'mono' : undefined });
/** Texto en una línea que se achica (hasta 12 px efectivos) para caber en `w`; si aun así no cabe, se recorta con «…». */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, o: TxtOpts = {}) {
  let size = fz(S, o.s ?? 13); const min = fz(S, 12), weight = o.weight ?? 600, font = o.mono ? 'mono' as const : undefined;
  while (size > min && S.d.measure(str, { size, weight, font }) > w) size -= 0.5;
  let s = str;
  if (S.d.measure(s, { size, weight, font }) > w) { while (s.length > 1 && S.d.measure(s + '…', { size, weight, font }) > w) s = s.slice(0, -1); s += '…'; }
  return S.d.text(s, x, y, { size, weight, color: o.c ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Tamaño (nominal) al que `str` cabe en `w`, entre `s` y 12 px efectivos. */
export function fitSize(S: Frame, str: string, w: number, s: number, mono = false, weight = 700) {
  let size = fz(S, s); const min = fz(S, 12);
  while (size > min && S.d.measure(str, { size, weight, font: mono ? 'mono' : undefined }) > w) size -= 0.5;
  return size;
}
/** Líneas de un párrafo con ajuste a `w`; con `max`, se recorta la última con «…». */
export function lines(S: Frame, str: string, w: number, o: { s?: number; mono?: boolean; weight?: number; max?: number } = {}): string[] {
  const size = fz(S, o.s ?? 13), font = o.mono ? 'mono' as const : undefined, weight = o.weight ?? 600;
  const out = S.d.wrap(str, w, { size, weight, font });
  if (o.max && out.length > o.max) {
    const keep = out.slice(0, o.max); let last = keep[o.max - 1];
    while (last.length > 1 && S.d.measure(last + '…', { size, weight, font }) > w) last = last.slice(0, -1);
    keep[o.max - 1] = last.replace(/\s+$/, '') + '…';
    return keep;
  }
  return out;
}
/** Párrafo de arriba hacia abajo; devuelve la altura usada. */
export function para(S: Frame, str: string, x: number, y: number, w: number, o: TxtOpts & { max?: number } = {}) {
  const ls = lines(S, str, w, { s: o.s, mono: o.mono, weight: o.weight, max: o.max }), size = fz(S, o.s ?? 13) * S.u, lh = size * (o.lh ?? 1.3);
  ls.forEach((ln, i) => S.d.text(ln, o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x, y + i * lh, { size: fz(S, o.s ?? 13), weight: o.weight ?? 600, color: o.c ?? S.pal.ink, base: 'top', align: o.align, font: o.mono ? 'mono' : undefined, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 4 }));
  return ls.length * lh;
}
/** Altura que ocuparía un párrafo. */
export const paraH = (S: Frame, str: string, w: number, o: { s?: number; mono?: boolean; weight?: number; max?: number; lh?: number } = {}) => lines(S, str, w, o).length * fz(S, o.s ?? 13) * S.u * (o.lh ?? 1.3);
/** Alto de una línea de texto de tamaño nominal `s`. */
export const lineH = (S: Frame, s = 13, lh = 1.3) => fz(S, s) * S.u * lh;

// ───────── números ─────────
/** Gigabytes con el formato del idioma: «140 GB», «1 120 GB», «2.8 GB». */
export function gbTxt(S: Frame, gb: number) {
  const d = gb >= 100 ? 0 : gb >= 10 ? (Math.abs(gb - Math.round(gb)) < 0.05 ? 0 : 1) : (Math.abs(gb - Math.round(gb)) < 0.05 ? 0 : 1);
  return `${S.n(gb, d)} GB`;
}
/** Entero con separador de miles del idioma. */
export const int = (S: Frame, n: number) => S.n(Math.round(n), 0);

// ───────── formas ─────────
/** Tarjeta: fondo de superficie y borde. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; a?: number; lw?: number; dash?: boolean; fill?: number } = {}) {
  const { d, pal: p } = S, t = o.tone ? tone(S, o.tone) : null;
  d.withAlpha(o.a ?? 1, () => d.rect(r.x, r.y, r.w, r.h, { fill: t ? alpha(t.c, o.fill ?? 0.07) : p.surface, stroke: t ? t.c : p.lineStrong, lw: o.lw ?? 1.3, r: 5, dash: o.dash ? [5, 4] : undefined }));
}

/** Marca de «cabe» (✓) o «no cabe» (✕), dibujada con trazos (no depende de la fuente ni solo del color). */
export function mark(S: Frame, x: number, y: number, ok: boolean, r = 7, a = 1) {
  const { d } = S, t = tone(S, ok ? 'dat' : 'err'), k = r * 0.55 * S.u, R = (r + 2) * S.u;
  d.withAlpha(a, () => {
    d.circle(x, y, R, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 1.5 });
    if (ok) d.polyline([[x - k, y], [x - k * 0.25, y + k * 0.7], [x + k, y - k * 0.6]], t.c, 2.2);
    else { d.line(x - k, y - k, x + k, y + k, t.c, 2.2); d.line(x - k, y + k, x + k, y - k, t.c, 2.2); }
  });
}

/** Barra horizontal de memoria: fondo (capacidad) y relleno (lo ocupado). Lo que se pasa de la capacidad sale con trazo punteado. */
export function memBar(S: Frame, x: number, y: number, w: number, h: number, frac: number, o: { tone?: Tone; a?: number; dither?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'w');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(p.ink, 0.05), stroke: p.lineStrong, lw: 1.2, r: 2 });
    const f = Math.max(0, frac);
    if (f > 0) d.rect(x, y, Math.max(1.5, w * Math.min(1, f)), h, { fill: alpha(t.c, 0.72), r: 2 });
    if (o.dither && f > 0) d.dither(x, y, w * Math.min(1, f), h, p.stage, 0.3, 2);
  });
}

/** Una GPU vista como caja: borde, nombre arriba. */
export function gpuBox(S: Frame, r: Rect, label: string, o: { a?: number; dim?: number; dash?: boolean } = {}) {
  const { d, pal: p } = S;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.ink, 0.035 + 0.05 * (1 - (o.dim ?? 0))), stroke: p.ink2, lw: 1.5, r: 4, dash: o.dash ? [5, 3] : undefined });
    if (label) fitText(S, label, r.x + r.w / 2, r.y - 5 * S.u, r.w + 8 * S.u, { s: 12, weight: 800, c: p.ink2, align: 'center', base: 'bottom' });
  });
}

/** Flecha entre dos puntos con progreso 0..1 (se dibuja a medida que avanza). */
export function arrowP(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; p?: number; lw?: number; a?: number; head?: number } = {}) {
  const k = clamp(o.p ?? 1); if (k <= 0) return;
  const t = tone(S, o.tone ?? 'mute'), tx = x1 + (x2 - x1) * k, ty = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => S.d.arrow(x1, y1, tx, ty, t.c, o.lw ?? 1.8, k > 0.97 ? (o.head ?? 8) * S.u : 0.001));
}

/** Pastilla con texto (rótulo sobre el dibujo). */
export function pill(S: Frame, str: string, x: number, y: number, o: { tone?: Tone; s?: number; a?: number; align?: CanvasTextAlign; mono?: boolean; solid?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), s = o.s ?? 13, w = measure(S, str, s, o.mono, 800) + 14 * S.u, h = lineH(S, s, 1) + 8 * S.u;
  const x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.solid ? t.c : alpha(t.c, 0.12), stroke: t.c, lw: 1.3, r: h / 2 });
    txt(S, str, x0 + w / 2, y + 0.5, { s, weight: 800, c: o.solid ? p.stage : (o.tone ? t.ink : p.ink), align: 'center', mono: o.mono });
  });
  return w;
}

/** Rótulo de procedencia al pie del escenario («medido», «ilustrativo», fuente). */
export function provenance(S: Frame, str: string, a = 1) {
  const m = isShort(S) ? 10 : S.portrait ? 12 : 18;
  fitText(S, str, m, S.H - (isShort(S) ? 5 : 8), S.W - 2 * m, { s: 12, weight: 600, c: S.pal.mute, base: 'bottom', a });
}
/** Alto reservado para el rótulo de procedencia. */
export function provH(S: Frame) { return lineH(S, 12, 1.2) + (isShort(S) ? 3 : 6); }
