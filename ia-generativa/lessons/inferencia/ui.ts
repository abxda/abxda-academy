// Ayudas propias de la lección: tiempo por fracciones del segmento, tamaños con piso de 12 px efectivos, texto que se
// achica o se parte para caber, piezas de dibujo (tokens, pastillas, barras) y formato de números (siempre a partir de
// S.n: punto decimal y espacio para los miles en español). Todo color sale de tone()/S.pal: nunca hex.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Duración (s) del segmento k. Las voces y los idiomas duran distinto: se anima por fracciones del segmento. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.1, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to`. */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
/** Tamaño de texto (antes de escalar por S.u) con piso de 12 px efectivos. */
export const fz = (S: Frame, n: number) => Math.max(n, 12.2 / S.u);
/** Alto en px de una línea de texto a tamaño `n`. */
export const lh = (S: Frame, n: number, k = 1.3) => fz(S, n) * S.u * k;
export const lg = (S: Frame) => S.lang as 'es' | 'en';
/** Área de trabajo: márgenes y una franja al pie para la procedencia de los datos. */
export const area = (S: Frame): Rect => inset(S.full(), 14 * S.u, 16 * S.u, Math.max(20, 22 * S.u), 16 * S.u);
/** Escenario apretado (teléfono horizontal o casi cuadrado). */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);

export interface TOpts { size?: number; weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; a?: number; halo?: boolean; italic?: boolean }

/** Tamaño que hace caber `str` en `w` px sin bajar de 12 px efectivos. */
export function fitSize(S: Frame, str: string, w: number, size: number, o: TOpts = {}) {
  const min = fz(S, 12);
  let s = fz(S, size);
  while (s > min && S.d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return Math.max(min, s);
}
/** ¿Cabe `str` en `w` al tamaño `size` (o al mínimo legible)? */
export const fits = (S: Frame, str: string, w: number, o: TOpts = {}) => S.d.measure(str, { size: fz(S, o.size ?? 12), weight: o.weight ?? 600, font: o.font }) <= w;

/** Texto de una línea que se achica para caber en `w`. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, o: TOpts = {}) {
  const size = fitSize(S, str, w, o.size ?? 13, o);
  return S.d.text(str, x, y, { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base, a: o.a, italic: o.italic, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Texto que se parte en líneas de ancho `w`. Devuelve el alto usado. */
export function para(S: Frame, str: string, x: number, y: number, w: number, o: TOpts & { lh?: number } = {}) {
  const size = fz(S, o.size ?? 13);
  const r = S.d.text(str, x, y, { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink2, align: o.align, base: o.base ?? 'top', a: o.a, w, lh: o.lh ?? 1.25, italic: o.italic, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
  return r.h;
}
/** Alto que ocuparía `para` (sin dibujar). */
export const paraH = (S: Frame, str: string, w: number, size = 13, weight = 600, k = 1.25) => S.d.wrap(str, w, { size: fz(S, size), weight }).length * fz(S, size) * S.u * k;

/** Pastilla con borde (rótulo corto). `dash` = supuesto o estimación. Devuelve su caja. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; fill?: number; maxW?: number; weight?: number } = {}) {
  const { d } = S, c = tone(S, t), u = S.u;
  let size = fz(S, o.size ?? 12.5);
  const padX = 7 * u;
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX, size, { weight: o.weight ?? 700 });
  const tw = d.measure(str, { size, weight: o.weight ?? 700 }), h = size * u + 9 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: t === 'ink' ? S.pal.surface : alpha(c.c, o.fill ?? 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: o.weight ?? 700, color: t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
/** Nota centrada en `cx` que se parte en varias líneas si no cabe (fondo suave y borde del tono). Devuelve su alto. */
export function note(S: Frame, str: string, cx: number, y: number, maxW: number, t: Tone, o: { a?: number; size?: number; dash?: boolean; base?: 'top' | 'middle' } = {}) {
  const { d } = S, u = S.u, c = tone(S, t), size = fz(S, o.size ?? 13), padX = 8 * u, padY = 4 * u;
  const lines = d.wrap(str, maxW - 2 * padX, { size, weight: 700 });
  const w = Math.min(maxW, Math.max(...lines.map((l) => d.measure(l, { size, weight: 700 }))) + 2 * padX);
  const lhh = size * u * 1.25, h = lines.length * lhh + 2 * padY;
  const y0 = o.base === 'middle' ? y - h / 2 : y;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(cx - w / 2, y0, w, h, { fill: t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.3, r: 3, dash: o.dash ? [4, 3] : undefined });
    lines.forEach((l, i) => d.text(l, cx, y0 + padY + i * lhh + lhh / 2, { size, weight: 700, color: t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' }));
  });
  return h;
}
/** Alto que ocuparía `note`. */
export const noteH = (S: Frame, str: string, maxW: number, size = 13) => S.d.wrap(str, maxW - 16 * S.u, { size: fz(S, size), weight: 700 }).length * fz(S, size) * S.u * 1.25 + 8 * S.u;
/** Escenarios holgados (escritorio, tableta en horizontal): todo un poco más grande; teléfono: tamaño base. */
export const roomy = (S: Frame) => (S.portrait || S.H < 360 ? 1 : Math.min(1.25, Math.max(1, S.H / 420)));

/** Ancho de una pastilla sin dibujarla. */
export const chipW = (S: Frame, str: string, size = 12.5, weight = 700) => S.d.measure(str, { size: fz(S, size), weight }) + 14 * S.u;

/** Un token: caja con su texto (se achica para caber). `ghost` = casilla vacía punteada; `hot` = resaltado. */
export function tok(S: Frame, r: Rect, str: string, o: { t?: Tone; a?: number; hot?: number; ghost?: boolean; size?: number } = {}) {
  const { d, pal: p } = S, c = tone(S, o.t ?? 'lat'), hot = o.hot ?? 0;
  d.withAlpha(o.a ?? 1, () => {
    if (o.ghost) { d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1.3, r: 3, dash: [4, 3] }); if (str) fitText(S, str, r.x + r.w / 2, r.y + r.h / 2 + 0.5, r.w - 6 * S.u, { size: o.size ?? 14, weight: 700, color: p.mute, align: 'center', base: 'middle' }); return; }
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.14 + 0.3 * hot), stroke: c.c, lw: 1.4 + hot, r: 3 });
    fitText(S, str, r.x + r.w / 2, r.y + r.h / 2 + 0.5, r.w - 8 * S.u, { size: o.size ?? 14, weight: 650, color: c.ink, align: 'center', base: 'middle' });
  });
}

/** Barra horizontal: fondo + relleno (0..1). */
export function hbar(S: Frame, r: Rect, frac: number, t: Tone, o: { a?: number; dash?: boolean; min?: number } = {}) {
  const { d, pal: p } = S, c = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2 });
    const w = Math.max(frac > 0 ? (o.min ?? 2) : 0, r.w * clamp(frac));
    d.rect(r.x, r.y, w, r.h, { fill: alpha(c.c, 0.85) });
    if (o.dash) d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1, dash: [4, 3] });
  });
}

/** Rayado diagonal dentro de un rectángulo (trabajo repetido, espera). */
export function hatch(S: Frame, r: Rect, color: string, step = 5, lw = 1.2) {
  S.d.clip(r.x, r.y, r.w, r.h, () => {
    const s = step * Math.max(0.8, S.u);
    for (let x = r.x - r.h; x < r.x + r.w; x += s) S.d.line(x, r.y + r.h, x + r.h, r.y, color, lw);
  });
}

/** Rótulo de procedencia al pie (pequeño, gris, se achica; se omite si no cabe ni a 12 px). */
export function provenance(S: Frame, str: string, a = 1) {
  const x = 16 * S.u, w = S.W - 32 * S.u, y = S.H - 4 * S.u;
  if (!fits(S, str, w, { weight: 600 })) return;
  fitText(S, str, x, y, w, { size: 12, weight: 600, color: S.pal.mute, base: 'bottom', a: a * 0.95, italic: true });
}

/** Flecha curva (cuadrática) con punta. */
export function curveArrow(S: Frame, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, color: string, lw = 1.8, prog = 1) {
  const n = 24, pts: [number, number][] = [];
  const k = clamp(prog);
  for (let i = 0; i <= n * k; i++) { const t = i / n; pts.push([(1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2]); }
  if (pts.length < 2) return;
  S.d.polyline(pts, color, lw);
  if (k > 0.97) { const a = pts[pts.length - 2], b = pts[pts.length - 1]; S.d.arrow(a[0], a[1], b[0], b[1], color, lw, 7 * Math.max(0.8, S.u)); }
}

// ── números ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** Número con `n` cifras significativas, sin ceros finales tras el punto. */
export function sig(S: Frame, x: number, n = 3) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))), d = Math.max(0, n - 1 - e);
  const r = Math.round(x * 10 ** d) / 10 ** d;
  const s = S.n(r, d);
  return d > 0 ? s.replace(/\.?0+$/, '') : s;
}
/** Bytes → «16 GB», «8.4 GB», «1.05 GB». */
export const gb = (S: Frame, bytes: number, n = 3) => `${sig(S, bytes / 1e9, n)} GB`;
/** Entero con separador de miles. */
export const int = (S: Frame, x: number) => S.n(Math.round(x), 0);
/** Dólares: «US$ 0.218» / «$0.218». */
export function usd(S: Frame, x: number, digits?: number) {
  const d = digits ?? (x >= 1 ? 2 : x >= 0.1 ? 2 : x >= 0.01 ? 3 : 4);
  const v = S.n(x, d);
  return S.lang === 'es' ? `US$ ${v}` : `$${v}`;
}
/** Segundos → «84 ms», «1.5 s», «20 s». */
export function secs(S: Frame, s: number) {
  if (s < 1) return `${sig(S, s * 1000, 2)} ms`;
  return `${sig(S, s, s < 10 ? 2 : 2)} s`;
}
/** Formato de los controles (sin Frame): miles con espacio fino en español, coma en inglés. */
export const fmtInt = (v: number, l: 'es' | 'en') => { const s = Math.round(v).toLocaleString('en-US'); return l === 'es' ? s.replace(/,/g, ' ') : s; };

// ── el ejemplo del chat ─────────────────────────────────────────────────────────────────────────────────────────
export const WORDS = {
  es: { msg: ['Resume', 'este', 'contrato', 'en', 'tres', 'puntos'], ans: ['El', 'plazo', 'es', 'de', 'doce', 'meses'], full: 'Resume este contrato en tres puntos', reply: 'El plazo es de doce meses, se paga cada mes y se renueva solo.' },
  en: { msg: ['Summarize', 'this', 'contract', 'in', 'three', 'points'], ans: ['The', 'term', 'is', 'twelve', 'months', 'long'], full: 'Summarize this contract in three points', reply: 'The term is twelve months long, it is paid monthly, and it renews on its own.' },
} as const;
