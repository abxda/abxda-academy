// Piezas de dibujo propias de la lección «Preentrenamiento»: tiempo por fracciones de cada segmento, márgenes, texto que se
// achica o se parte (siempre ≥ 12 px efectivos), fichas, tarjetas, barras y rótulos de procedencia. El kit no garantiza un
// tamaño mínimo de texto ni trae párrafos con límite de líneas; se implementan aquí. Todo pide roles de color (tone) y colores
// del tema (S.pal): nada de hex. Todo es puro: solo lee sus argumentos.
//
// Convención visual de la lección (no depende solo del color):
//   · lat = tokens y texto que lee el modelo · dat = datos que se conservan, aciertos (✓) · err = lo que sale, errores (✕),
//     el hueco que hay que adivinar · w = parámetros y cifras de escala · mute = lo apagado.
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
/** Área útil del escenario. */
export function area(S: Frame): Rect { const m = isShort(S) ? 10 : S.portrait ? 12 : 18; return { x: m, y: m, w: S.W - 2 * m, h: S.H - 2 * m }; }

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
/** Rótulo pequeño y apagado en una línea. */
export const caption = (S: Frame, str: string, x: number, y: number, w: number, o: TxtOpts = {}) => fitText(S, str, x, y, w, { s: 12, weight: 700, c: S.pal.mute, ...o });

/** Líneas de un párrafo con ajuste a `w`; con `max`, se recorta la última con «…». */
export function lines(S: Frame, str: string, w: number, o: { s?: number; mono?: boolean; weight?: number; max?: number } = {}): string[] {
  const size = fz(S, o.s ?? 13), font = o.mono ? 'mono' as const : undefined, weight = o.weight ?? 600;
  const out = S.d.wrap(str, w, { size, weight, font }).flatMap((ln) => {
    // palabras más largas que el ancho (p. ej., texto sin espacios): se cortan por caracteres
    if (S.d.measure(ln, { size, weight, font }) <= w) return [ln];
    const parts: string[] = []; let cur = '';
    for (const ch of ln) { if (cur && S.d.measure(cur + ch, { size, weight, font }) > w) { parts.push(cur); cur = ch; } else cur += ch; }
    if (cur) parts.push(cur);
    return parts;
  });
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
/** Porcentaje con el formato del idioma (es: «12 %», en: «12%»); los muy pequeños llevan más decimales. */
export function pct(S: Frame, p: number, digits?: number) {
  const x = p * 100, d = digits ?? (x >= 10 ? 0 : x >= 1 ? 1 : x >= 0.1 ? 2 : 3);
  return `${S.n(x, d)}${S.l(' %', '%')}`;
}
/** Entero con separador de miles del idioma. */
export const int = (S: Frame, n: number) => S.n(Math.round(n), 0);
/** Tokens en forma compacta: es «34 M», «2.1 mil M», «300 mil M»; en «34M», «2.1B», «300B». */
export function tok(S: Frame, n: number): string {
  if (n <= 0) return '0';
  const sig = (v: number) => S.n(v, v >= 10 ? 0 : 1).replace(/\.0$/, '');
  if (n < 1e6) return int(S, n);
  if (n < 1e9) return S.l(`${sig(n / 1e6)} M`, `${sig(n / 1e6)}M`);
  return S.l(`${sig(n / 1e9)} mil M`, `${sig(n / 1e9)}B`);
}

// ───────── formas ─────────
/** Ficha con texto (token, rótulo). Devuelve su ancho. `active` 0..1 la rellena. */
export function chip(S: Frame, x: number, y: number, text: string, o: { tone?: Tone; h?: number; s?: number; a?: number; active?: number; mono?: boolean; w?: number; dash?: boolean; fill?: number; weight?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), h = o.h ?? 26, s = o.s ?? 14;
  const w = o.w ?? measure(S, text, s, o.mono, o.weight ?? 700) + 14;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(t.c, (o.fill ?? 0.14) + 0.5 * (o.active ?? 0)), stroke: t.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    fitText(S, text, x + w / 2, y + h / 2 + 0.5, w - 6, { s, weight: o.weight ?? 700, c: (o.active ?? 0) > 0.6 ? p.stage : t.ink, align: 'center', mono: o.mono });
  });
  return w;
}
export const chipW = (S: Frame, text: string, s = 14, mono = false) => measure(S, text, s, mono, 700) + 14;

/** Tarjeta: fondo de superficie y borde. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; a?: number; lw?: number; dash?: boolean; fill?: number } = {}) {
  const { d, pal: p } = S, t = o.tone ? tone(S, o.tone) : null;
  d.withAlpha(o.a ?? 1, () => d.rect(r.x, r.y, r.w, r.h, { fill: t ? alpha(t.c, o.fill ?? 0.07) : p.surface, stroke: t ? t.c : p.lineStrong, lw: o.lw ?? 1.3, r: 5, dash: o.dash ? [5, 4] : undefined }));
}

/** Barra horizontal (0..1) con fondo tenue. */
export function hbar(S: Frame, x: number, y: number, w: number, h: number, v: number, o: { tone?: Tone; a?: number; hot?: number; track?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat');
  d.withAlpha(o.a ?? 1, () => {
    if (o.track !== false) d.rect(x, y, w, h, { fill: alpha(p.ink, 0.06) });
    d.rect(x, y, Math.max(1.5, w * clamp(v)), h, { fill: alpha(t.c, 0.45 + 0.4 * (o.hot ?? 0)) });
  });
}

/** Marca de acierto (✓) o error (✕) dibujada con trazos (no depende de la fuente). */
export function mark(S: Frame, x: number, y: number, ok: boolean, r = 7, a = 1) {
  const { d } = S, t = tone(S, ok ? 'dat' : 'err');
  d.withAlpha(a, () => {
    d.circle(x, y, r + 2, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 1.4 });
    const k = r * 0.55;
    if (ok) d.polyline([[x - k, y], [x - k * 0.25, y + k * 0.7], [x + k, y - k * 0.6]], t.c, 2.2);
    else { d.line(x - k, y - k, x + k, y + k, t.c, 2.2); d.line(x - k, y + k, x + k, y - k, t.c, 2.2); }
  });
}

/** Flecha entre dos puntos con progreso 0..1 (se dibuja a medida que avanza). */
export function arrowP(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; p?: number; lw?: number; a?: number; head?: number } = {}) {
  const k = clamp(o.p ?? 1); if (k <= 0) return;
  const t = tone(S, o.tone ?? 'mute'), tx = x1 + (x2 - x1) * k, ty = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => S.d.arrow(x1, y1, tx, ty, t.c, o.lw ?? 1.8, k > 0.97 ? (o.head ?? 8) : 0.001));
}

/** Rótulo de procedencia al pie del escenario («medición real», «ilustrativo»…). */
export function provenance(S: Frame, str: string, a = 1) {
  const A = area(S);
  fitText(S, str, A.x, S.H - (isShort(S) ? 6 : 8), A.w, { s: 12, weight: 600, c: S.pal.mute, base: 'bottom', a });
}
/** Alto reservado para el rótulo de procedencia. */
export const provH = (S: Frame) => lineH(S, 12, 1.2) + (isShort(S) ? 4 : 8);

/** Mini documento (icono de página): rectángulo con líneas de texto simuladas. */
export function docIcon(S: Frame, x: number, y: number, w: number, h: number, seed: number, o: { tone?: Tone; a?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'dat');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface, stroke: alpha(t.c, 0.8), lw: 1, r: 2 });
    const n = Math.max(2, Math.min(5, Math.floor(h / 7))), pad = Math.max(2, w * 0.14);
    for (let i = 0; i < n; i++) {
      const lw = (w - 2 * pad) * (0.45 + 0.55 * (((seed * 9301 + i * 49297) % 233280) / 233280));
      d.rect(x + pad, y + pad + i * ((h - 2 * pad) / n), lw, Math.max(1.2, (h - 2 * pad) / n * 0.38), { fill: alpha(t.c, 0.5) });
    }
  });
}
