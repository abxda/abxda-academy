// Piezas de dibujo de la lección «Contexto y memoria»: texto con tamaño efectivo garantizado (≥ 12 px), etiquetas,
// vagones del tren de contexto, vías y la ventana. Todo en roles de color (tone), nunca hex.
import { alpha, clamp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { NeuMood } from '../../../../../theme/kit';
import type { Role } from './model';

/** Factor de legibilidad: en escenarios grandes el texto crece un poco (hasta 1,25×); nunca baja de `px` píxeles. */
export const K = (S: Frame) => Math.max(1, Math.min(1.25, S.u));
/** Parámetro `size` de Draw.text para obtener `px` píxeles efectivos (Draw ya multiplica por S.u). */
export const sz = (S: Frame, px: number) => (px * K(S)) / S.u;
/** Área útil con márgenes. */
export const pad = (S: Frame, m = 14): Rect => { const k = m * S.u; return { x: k, y: k, w: S.W - 2 * k, h: S.H - 2 * k }; };
/** Teléfono en horizontal o escenarios muy bajos. */
export const isShort = (S: Frame) => !S.portrait && S.H < 380;
/** Separador de miles con espacio fino (es) o coma (en). */
export const num = (S: Frame, v: number) => Math.round(v).toLocaleString(S.lang === 'es' ? 'es-MX' : 'en-US').replace(/,/g, S.lang === 'es' ? ' ' : ',');

export interface TO { px?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; w?: number; font?: 'ui' | 'mono'; halo?: boolean; a?: number; lh?: number; italic?: boolean }
/** Texto del lienzo con tamaño en píxeles efectivos. Devuelve {w,h}. */
export function T(S: Frame, str: string, x: number, y: number, o: TO = {}) {
  return S.d.text(str, x, y, { size: sz(S, o.px ?? 13), weight: o.weight ?? 600, color: o.color ?? S.pal.ink, align: o.align, base: o.base ?? 'alphabetic', w: o.w, font: o.font, halo: o.halo ? S.pal.stage : undefined, haloW: 4, a: o.a, lh: o.lh, italic: o.italic });
}
/** Texto con ajuste de línea anclado ABAJO: la última línea queda en `y` (Draw pone la primera en `y` y las demás debajo). */
export function Tbot(S: Frame, str: string, x: number, y: number, o: TO & { w: number }) {
  const px = o.px ?? 13, n = Math.max(1, S.d.wrap(str, o.w, { size: sz(S, px), weight: o.weight ?? 600, font: o.font }).length);
  return T(S, str, x, y - (n - 1) * px * K(S) * (o.lh ?? 1.3), { ...o, base: 'bottom' });
}
export const mw = (S: Frame, str: string, px = 13, weight = 600, font?: 'ui' | 'mono') => S.d.measure(str, { size: sz(S, px), weight, font });
export const wrapLines = (S: Frame, str: string, w: number, px = 13, weight = 600) => S.d.wrap(str, w, { size: sz(S, px), weight });

/** Etiqueta corta en una pastilla. */
export function chip(S: Frame, str: string, x: number, y: number, o: { tone?: Tone; align?: 'left' | 'center' | 'right'; px?: number; a?: number; mono?: boolean } = {}): Rect {
  const t = tone(S, o.tone ?? 'ink');
  return S.d.tag(str, x, y, { size: sz(S, o.px ?? 12.5), color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, font: o.mono ? 'mono' : 'ui', weight: 700 });
}

/** Tarjeta: fondo de superficie con borde fino y un título opcional. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; a?: number; title?: string; dashed?: boolean; fill?: boolean; titleTone?: Tone } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: o.fill === false ? undefined : alpha(p.surface, 0.9), stroke: o.tone ? t.c : p.lineStrong, lw: 1.5, r: 4, dash: o.dashed ? [5, 4] : undefined });
    if (o.title) T(S, o.title, r.x + 10 * S.u, r.y + 8 * S.u, { px: 12, weight: 800, color: o.titleTone ? tone(S, o.titleTone).ink : p.mute, base: 'top' });
  });
}

/** Neu, en enteros de píxel (nítido). */
export function neuAt(S: Frame, x: number, y: number, mood: NeuMood, a = 1, k = 2.4) {
  return neu(S, x, y, { scale: Math.max(2, Math.round(k * S.u)), mood, a });
}
export const neuW = (S: Frame, k = 2.4) => 24 * Math.max(2, Math.round(k * S.u));
export const neuH = (S: Frame, k = 2.4) => 18 * Math.max(2, Math.round(k * S.u));

/** Cifra grande con rótulo. */
export function stat(S: Frame, x: number, y: number, label: string, value: string, o: { tone?: Tone; px?: number; align?: CanvasTextAlign; a?: number } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  T(S, label, x, y, { px: 12, weight: 700, color: S.pal.mute, align: o.align, base: 'top', a: o.a });
  return T(S, value, x, y + 15 * S.u, { px: o.px ?? 22, weight: 800, font: 'mono', color: o.tone ? t.ink : S.pal.ink, align: o.align, base: 'top', a: o.a });
}

// ───────────────────────────── vagones ─────────────────────────────
export const ROLE: Record<Role, { tone: Tone; es: string; en: string; sEs: string; sEn: string }> = {
  sys: { tone: 'ink', es: 'sistema', en: 'system', sEs: 'S', sEn: 'S' },
  user: { tone: 'sig', es: 'tú', en: 'you', sEs: 'tú', sEn: 'you' },
  ai: { tone: 'lat', es: 'IA', en: 'AI', sEs: 'IA', sEn: 'AI' },
  doc: { tone: 'dat', es: 'documento', en: 'document', sEs: 'doc', sEn: 'doc' },
  sum: { tone: 'dat', es: 'resumen', en: 'summary', sEs: 'res.', sEn: 'sum.' },
  mem: { tone: 'dat', es: 'notas', en: 'notes', sEs: 'notas', sEn: 'notes' },
};
export const roleLabel = (S: Frame, r: Role, short = false) => (S.lang === 'es' ? (short ? ROLE[r].sEs : ROLE[r].es) : short ? ROLE[r].sEn : ROLE[r].en);

/** Un vagón: cuerpo con relleno suave y borde del rol; la etiqueta se pone solo si cabe. */
export function wagon(S: Frame, r: Rect, role: Role, o: { label?: string | false; a?: number; dashed?: boolean; hot?: boolean; wheels?: boolean; px?: number; solid?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, ROLE[role].tone);
  if (r.w < 1 || r.h < 1) return;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, o.solid ? 0.55 : o.hot ? 0.34 : 0.16), stroke: t.c, lw: o.hot ? 2.5 : 1.5, r: 3, dash: o.dashed ? [4, 3] : undefined });
    if (o.wheels) { const wy = r.y + r.h, ww = 4 * S.u; d.rect(r.x + r.w * 0.2 - ww / 2, wy, ww, ww, { fill: p.lineStrong }); d.rect(r.x + r.w * 0.8 - ww / 2, wy, ww, ww, { fill: p.lineStrong }); }
    const label = o.label === false ? '' : o.label ?? '';
    if (label) { const px = o.px ?? 12.5; if (mw(S, label, px, 700) + 6 * S.u <= r.w && px * K(S) + 2 <= r.h) T(S, label, r.x + r.w / 2, r.y + r.h / 2, { px, weight: 700, color: o.solid ? p.stage : t.ink, align: 'center', base: 'middle' }); }
  });
}

// ───────────────────────────── vía y ventana ─────────────────────────────
/** Vía: una línea a lo largo de la cual se ponen vagones. En vertical, «a lo largo» corre hacia abajo (lo viejo arriba). */
export interface Track { x: number; y: number; len: number; thick: number; vertical: boolean }
/** Rectángulo del tramo [s0, s1] (px a lo largo de la vía), con desplazamiento lateral `off` y grosor opcional. */
export function seg(tr: Track, s0: number, s1: number, off = 0, thick = tr.thick): Rect {
  return tr.vertical ? { x: tr.x + off, y: tr.y + s0, w: thick, h: s1 - s0 } : { x: tr.x + s0, y: tr.y + off, w: s1 - s0, h: thick };
}
/** Punto (a lo largo s, a lo ancho o). */
export const pt = (tr: Track, s: number, o = 0): [number, number] => (tr.vertical ? [tr.x + o, tr.y + s] : [tr.x + s, tr.y + o]);

/** Marco de la ventana alrededor de una vía, con una regla de tokens. */
export function windowFrame(S: Frame, tr: Track, o: { a?: number; label?: string; limit: number; ticks?: boolean; hot?: number }) {
  const { d, pal: p } = S, m = 6 * S.u, a = o.a ?? 1;
  const r = seg(tr, 0, tr.len);
  const fr: Rect = { x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m };
  d.withAlpha(a, () => {
    d.rect(fr.x, fr.y, fr.w, fr.h, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 2, r: 5 });
    // vía (rieles)
    const [x0, y0] = pt(tr, 0, tr.thick / 2), [x1, y1] = pt(tr, tr.len, tr.thick / 2);
    d.line(x0, y0, x1, y1, p.line, 1, [3, 4]);
    if (o.ticks !== false) {
      const n = 4;
      for (let i = 0; i <= n; i++) {
        const s = (tr.len * i) / n, [ax, ay] = tr.vertical ? [tr.x + tr.thick + m, tr.y + s] : [tr.x + s, tr.y + tr.thick + m];
        const [bx, by] = tr.vertical ? [ax + 5 * S.u, ay] : [ax, ay + 5 * S.u];
        d.line(ax, ay, bx, by, p.lineStrong, 1.5);
        if (!tr.vertical && i % 2 === 0) T(S, i === 0 ? '0' : num(S, (o.limit * i) / n), ax, by + 3 * S.u, { px: 12, weight: 600, font: 'mono', color: p.mute, align: i === 0 ? 'left' : i === n ? 'right' : 'center', base: 'top' });
      }
    }
    if (o.label) {
      if (tr.vertical) T(S, o.label, fr.x, fr.y - 6 * S.u, { px: 12.5, weight: 800, color: p.ink2, base: 'bottom' });
      else T(S, o.label, fr.x, fr.y - 6 * S.u, { px: 12.5, weight: 800, color: p.ink2, base: 'bottom' });
    }
  });
  return fr;
}

/** Barra horizontal de ocupación (usado / límite). */
export function gauge(S: Frame, r: Rect, used: number, limit: number, o: { tone?: Tone; a?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), k = clamp(used / limit);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2, stroke: p.line, lw: 1, r: 2 });
    d.rect(r.x, r.y, r.w * k, r.h, { fill: alpha(t.c, 0.7), r: 2 });
  });
}

/** Una burbuja de chat. */
export function bubble(S: Frame, r: Rect, str: string, who: 'user' | 'ai', o: { a?: number; px?: number; hot?: boolean } = {}) {
  const { d } = S, t = tone(S, who === 'user' ? 'sig' : 'lat');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, o.hot ? 0.3 : 0.14), stroke: t.c, lw: o.hot ? 2.5 : 1.5, r: 6 });
    T(S, str, r.x + r.w / 2, r.y + r.h / 2, { px: o.px ?? 13, weight: 600, color: S.pal.ink, align: 'center', base: 'middle', w: r.w - 14 * S.u });
  });
}

/** Alfa de una vista entre el inicio de `from` y el inicio de `to` (con fundido corto). */
export const view = (S: Frame, from: string, to?: string, fin = 0.5, fout = 0.4) => S.at(from, 0, fin, 'out') * (1 - (to ? S.at(to, 0, fout, 'out') : 0));

/** Candado diminuto (pesos congelados). */
export function lock(S: Frame, x: number, y: number, s: number, color: string, a = 1) {
  const { d } = S;
  d.withAlpha(a, () => {
    d.rect(x, y + s * 0.42, s, s * 0.58, { fill: color, r: 2 });
    d.polyline([[x + s * 0.2, y + s * 0.42], [x + s * 0.2, y + s * 0.22], [x + s * 0.35, y + s * 0.04], [x + s * 0.65, y + s * 0.04], [x + s * 0.8, y + s * 0.22], [x + s * 0.8, y + s * 0.42]], color, 2);
  });
}

/** Primera etiqueta de la lista que cabe en el rectángulo (o false). */
export function fitLabel(S: Frame, r: Rect, labels: string[], px = 12.5): string | false {
  for (const l of labels) if (l && mw(S, l, px, 700) + 6 * S.u <= r.w && px * K(S) + 2 <= r.h) return l;
  return false;
}
