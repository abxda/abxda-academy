// Ayudas propias de la lección: tiempo por fracciones del segmento, tamaños con piso de 12 px efectivos, texto que se
// achica o se parte para caber, y formato de números (siempre a partir de S.n: punto decimal y espacio para los miles en
// español). Todo color sale de tone()/S.pal.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Duración (s) del segmento k. Las voces y los idiomas duran distinto: se anima por fracciones del segmento. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.08, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Tamaño de texto (antes de escalar por S.u) con piso de 12 px efectivos. */
export const fz = (S: Frame, n: number) => Math.max(n, 12.2 / S.u);
/** Espaciado que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Escenarios holgados (escritorio, tableta en horizontal): todo un poco más grande; teléfono: tamaño base. */
export const roomy = (S: Frame) => (S.portrait || S.H < 300 ? 1 : Math.min(1.22, Math.max(1, S.H / 410)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface TOpts { size?: number; weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; a?: number; halo?: boolean; italic?: boolean }

/** Tamaño que hace caber `str` en `w` px sin bajar de 12 px efectivos (si ni así cabe, devuelve el mínimo). */
export function fitSize(S: Frame, str: string, w: number, size: number, o: TOpts = {}) {
  const min = fz(S, 12);
  let s = fz(S, size);
  while (s > min && S.d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return Math.max(min, s);
}
/** ¿Cabe `str` en `w` al tamaño mínimo legible? */
export const fits = (S: Frame, str: string, w: number, o: TOpts = {}) => S.d.measure(str, { size: fz(S, 12), weight: o.weight ?? 600, font: o.font }) <= w;

/** Texto de una línea que se achica para caber en `w`. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, o: TOpts = {}) {
  const size = fitSize(S, str, w, o.size ?? 13, o);
  return S.d.text(str, x, y, { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base, a: o.a, italic: o.italic, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Texto que se parte en líneas de ancho `w` (a tamaño legible). Devuelve el alto usado. */
export function para(S: Frame, str: string, x: number, y: number, w: number, o: TOpts & { lh?: number } = {}) {
  const size = fz(S, o.size ?? 13);
  const r = S.d.text(str, x, y, { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base ?? 'top', a: o.a, w, lh: o.lh ?? 1.25, italic: o.italic });
  return r.h;
}
/** Alto (px) de una línea de texto a tamaño `n`. */
export const lineH = (S: Frame, n: number, lh = 1.25) => fz(S, n) * S.u * lh;

/** Pastilla con borde: rótulo corto sobre el diagrama. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; fill?: number } = {}) {
  const { d } = S, c = tone(S, t), size = fz(S, o.size ?? 12.5), u = S.u;
  const tw = d.measure(str, { size, weight: 700 }), padX = 7 * u, h = size * u + 8 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: alpha(c.c, o.fill ?? 0.12), stroke: c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: 700, color: c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}

/** Rótulo de procedencia (pequeño, gris, una línea que se achica; se omite si no cabe ni a 12 px). */
export function provenance(S: Frame, str: string, x: number, y: number, w: number, o: { a?: number; align?: CanvasTextAlign; base?: CanvasTextBaseline } = {}) {
  if (!fits(S, str, w, { weight: 600 })) return;
  fitText(S, str, x, y, w, { size: 12, weight: 600, color: S.pal.mute, align: o.align ?? 'left', base: o.base ?? 'bottom', a: o.a, italic: true });
}

/** Caja redondeada simple. */
export function box(S: Frame, r: Rect, t: Tone | null, o: { a?: number; fill?: number; dash?: boolean; lw?: number } = {}) {
  const c = t ? tone(S, t).c : S.pal.lineStrong;
  S.d.rect(r.x, r.y, r.w, r.h, { fill: t ? alpha(c, o.fill ?? 0.07) : S.pal.surface, stroke: c, lw: o.lw ?? 1.4, r: 4, dash: o.dash ? [5, 4] : undefined, a: o.a });
}

// ── números ─────────────────────────────────────────────────────────────────────────────────────────────────────
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');
export const roundSig = (x: number, n: number) => { if (x === 0) return 0; const e = Math.floor(Math.log10(Math.abs(x))) - n + 1; return Math.round(x / 10 ** e) * 10 ** e; };
/** Número con `n` cifras significativas, sin ceros finales tras el punto. */
export function sig(S: Frame, x: number, n = 3) {
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))), d = Math.max(0, n - 1 - e);
  const s = S.n(roundSig(x, n), d);
  return d > 0 ? s.replace(/\.?0+$/, '') : s;
}
/** Conteos grandes (parámetros, tokens): «175 mil M», «15.6 billones» / «175B», «15.6T». */
export function count(S: Frame, x: number) {
  if (x < 1e6) return S.n(Math.round(x), 0);
  if (S.lang === 'es') {
    if (x < 1e9) return `${sig(S, x / 1e6)} M`;
    if (x < 1e12) return `${sig(S, x / 1e9)} mil M`;
    const v = sig(S, x / 1e12);
    return `${v} ${v === '1' ? 'billón' : 'billones'}`;
  }
  if (x < 1e9) return `${sig(S, x / 1e6)}M`;
  if (x < 1e12) return `${sig(S, x / 1e9)}B`;
  return `${sig(S, x / 1e12)}T`;
}
/** Notación científica: «3.15 × 10²³». */
export function sci(S: Frame, x: number, digits = 2) {
  let e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  if (Math.round(m * 10 ** digits) / 10 ** digits >= 10) { m /= 10; e += 1; }
  return `${S.n(m, digits)} × 10${sup(e)}`;
}
/** Dinero en dólares, dos cifras significativas: «US$ 53 millones» / «$53 million». */
export function money(S: Frame, x: number) {
  const es = S.lang === 'es';
  if (x < 1e6) { const v = S.n(roundSig(x, 2), 0); return es ? `US$ ${v}` : `$${v}`; }
  const v = sig(S, x / 1e6, 2);
  return es ? `US$ ${v} ${v === '1' ? 'millón' : 'millones'}` : `$${v} million`;
}
/** Cantidad grande de horas: «26.3 millones» / «219 000». */
export function bigCount(S: Frame, x: number) {
  if (x < 1e6) return S.n(roundSig(x, 3), 0);
  const v = sig(S, x / 1e6, 3);
  return S.lang === 'es' ? `${v} ${v === '1' ? 'millón' : 'millones'}` : `${v} million`;
}
/** Duración a partir de horas: minutos, horas, días o años (dos cifras significativas). */
export function duration(S: Frame, hours: number) {
  const es = S.lang === 'es';
  const u = (v: string, a: string, b: string) => `${v} ${v === '1' ? a : b}`;
  if (hours < 1) return u(sig(S, hours * 60, 2), es ? 'minuto' : 'minute', es ? 'minutos' : 'minutes');
  if (hours < 48) return u(sig(S, hours, 2), es ? 'hora' : 'hour', es ? 'horas' : 'hours');
  const days = hours / 24;
  if (days < 730) return u(sig(S, days, 2), es ? 'día' : 'day', es ? 'días' : 'days');
  return u(S.n(roundSig(days / 365.25, days / 365.25 >= 100 ? 1 : 2), 0), es ? 'año' : 'year', es ? 'años' : 'years');
}
