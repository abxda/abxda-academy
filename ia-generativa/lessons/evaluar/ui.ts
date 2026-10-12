// Ayudas de dibujo propias de la lección «Evaluar sistemas de IA» (mismo criterio que las de «agentes»).
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win(), hold().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). La forma acompaña siempre al color: acierto = palomita, fallo = cruz,
//   empate = signo igual; lo ilustrativo o supuesto va punteado o rotulado.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
/** Resalte que sube al empezar `a` (en la fracción f0…f1) y baja al empezar `b`. */
export const hold = (S: Frame, a: string, b?: string, f0 = 0.05, f1 = 0.2) => (S.on(a) ? fr(S, a, f0, f1) * (b && S.on(b) ? 1 - fr(S, b, 0, 0.12) : 1) : 0);

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** En escenarios horizontales amplios (escritorio, tableta) el texto crece un poco: ahí sobra lugar. */
export const zoom = (S: Frame) => (!S.portrait && S.H >= 360 && S.W >= 640 ? 1.12 : 1);
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px * zoom(S), 12.2 / S.u);
/** Escenario muy bajo (teléfono en horizontal) o vertical casi cuadrado. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 36 : tight(S) ? 20 : 28) * S.u, (tight(S) ? 10 : 16) * S.u);

// ── texto ───────────────────────────────────────────────────────────────────────────────────────────
export function lines(S: Frame, text: string, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; maxLines?: number } = {}): string[] {
  const ls = S.d.wrap(text, w, { size, weight: o.weight ?? 500, font: o.font });
  if (o.maxLines && ls.length > o.maxLines) {
    const cut = ls.slice(0, o.maxLines); let last = cut[o.maxLines - 1];
    while (last.length > 1 && S.d.measure(last + '…', { size, weight: o.weight ?? 500, font: o.font }) > w) last = last.slice(0, -1);
    cut[o.maxLines - 1] = last.replace(/[\s,;.]+$/, '') + '…';
    return cut;
  }
  return ls;
}
/** Párrafo: dibuja las líneas y devuelve la altura usada. */
export function para(S: Frame, text: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; maxLines?: number; lh?: number; align?: CanvasTextAlign; a?: number; italic?: boolean } = {}): number {
  const d = S.d, lh = (o.lh ?? 1.28) * size * S.u, ls = lines(S, text, w, size, o);
  ls.forEach((ln, i) => {
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(ln, tx, y + i * lh, { size, weight: o.weight ?? 500, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, italic: o.italic });
  });
  return ls.length * lh;
}
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; maxLines?: number; lh?: number; font?: 'ui' | 'mono' } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.28) * size * S.u;

/** Tamaño que hace caber `str` en `w` px sin bajar de 12 px efectivos. `size` es el tamaño «de diseño» (sin FS). */
export function fitSize(S: Frame, str: string, w: number, size: number, weight = 600, font?: 'ui' | 'mono') {
  const minS = 12.2 / S.u;
  let s = FS(S, size);
  while (s > minS && S.d.measure(str, { size: s, weight, font }) > w) s -= 0.5;
  return Math.max(s, minS);
}
/** Texto de una línea que se encoge hasta caber (≥ 12 px); si ni así cabe, se recorta con puntos suspensivos. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number; italic?: boolean } = {}) {
  const wt = o.weight ?? 600, s = fitSize(S, str, w, size, wt, o.font);
  if (S.d.measure(str, { size: s, weight: wt, font: o.font }) > w && str.length > 2) {
    let t = str;
    while (t.length > 1 && S.d.measure(t + '…', { size: s, weight: wt, font: o.font }) > w) t = t.slice(0, -1);
    str = t.replace(/[\s,;.·(]+$/, '') + '…';
  }
  return S.d.text(str, x, y, { size: s, weight: wt, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base, halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a, italic: o.italic });
}
export const fits = (S: Frame, str: string, w: number, size = 12, weight = 600, font?: 'ui' | 'mono') => S.d.measure(str, { size: FS(S, size), weight, font }) <= w;
/** La primera opción que cabe en `w` (o la última). */
export const pick = (S: Frame, opts: string[], w: number, size = 12, weight = 600, font?: 'ui' | 'mono') => opts.find((o) => fits(S, o, w, size, weight, font)) ?? opts[opts.length - 1];

/** Porcentaje con la convención de cada idioma: «78 %» en español, «78%» en inglés. */
export const pct = (S: Frame, v: number, dig = 0) => `${S.n(v, dig)}${S.lang === 'es' ? ' %' : '%'}`;
/** «78 de 100» / «78 of 100». */
export const ofN = (S: Frame, a: number | string, b: number | string) => S.l(`${a} de ${b}`, `${a} of ${b}`);

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas en vertical y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  const u = S.u, x = (tight(S) ? 10 : 16) * u, w = S.W - 2 * x, size = FS(S, 12);
  const ls = lines(S, str, w, size, { weight: 600 });
  const lh = size * u * 1.15, maxN = S.portrait ? 2 : 1;
  if (ls.length > maxN) return;
  const y0 = S.H - 4 * u - ls.length * lh;
  ls.forEach((ln, i) => S.d.text(ln, x, y0 + i * lh, { size, weight: 600, color: S.pal.mute, base: 'top', a: a * 0.95, italic: true }));
}

// ── piezas ──────────────────────────────────────────────────────────────────────────────────────────
/** Tarjeta con borde del tono pedido. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: number[]; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.05 + 0.2 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? ((o.hot ?? 0) > 0.4 ? 2.6 : 1.5), r: o.r ?? 4, dash: o.dash, a: o.a });
}
/** Pastilla con borde (rótulo corto). Devuelve su caja. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; maxW?: number; weight?: number; solid?: boolean; font?: 'ui' | 'mono' } = {}) {
  const { d } = S, c = tone(S, t), u = S.u, padX = 7 * u, wt = o.weight ?? 700;
  let size = FS(S, o.size ?? 13);
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX, o.size ?? 13, wt, o.font);
  if (o.maxW && d.measure(str, { size, weight: wt, font: o.font }) > o.maxW - 2 * padX) {
    let t2 = str;
    while (t2.length > 1 && d.measure(t2 + '…', { size, weight: wt, font: o.font }) > o.maxW - 2 * padX) t2 = t2.slice(0, -1);
    str = t2.replace(/[\s,;.·(]+$/, '') + '…';
  }
  const tw = d.measure(str, { size, weight: wt, font: o.font }), h = size * u + 10 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.solid ? c.c : t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: wt, font: o.font, color: o.solid ? S.pal.stage : t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
export const chipW = (S: Frame, str: string, size = 13, weight = 700, font?: 'ui' | 'mono') => S.d.measure(str, { size: FS(S, size), weight, font }) + 14 * S.u;
export const chipH = (S: Frame, size = 13) => FS(S, size) * S.u + 10 * S.u;

/** Flecha que crece de (x1,y1) a (x2,y2) según `k`. */
export function growArrow(S: Frame, x1: number, y1: number, x2: number, y2: number, k: number, color: string, lw = 2.2) {
  if (k <= 0) return;
  S.d.arrow(x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, color, lw, k > 0.97 ? 8 * Math.max(0.85, S.u) : 0.001);
}

/** Persona en píxeles. Ocupa 6·sc × 9·sc. */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'sig', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

// ── pictogramas ─────────────────────────────────────────────────────────────────────────────────────
export type GlyphKind = 'check' | 'cross' | 'equal' | 'warn' | 'eye' | 'lock';
/** Pictograma centrado en (x, y) de tamaño s (px). Acompaña al color: nunca es el único canal. */
export function glyph(S: Frame, kind: GlyphKind, x: number, y: number, s: number, color: string, a = 1) {
  const d = S.d, lw = Math.max(1.5, s * 0.16);
  d.withAlpha(a, () => {
    if (kind === 'check') d.polyline([[x - 0.42 * s, y + 0.02 * s], [x - 0.12 * s, y + 0.32 * s], [x + 0.44 * s, y - 0.34 * s]], color, lw, { join: 'round' });
    else if (kind === 'cross') { d.line(x - 0.34 * s, y - 0.34 * s, x + 0.34 * s, y + 0.34 * s, color, lw); d.line(x - 0.34 * s, y + 0.34 * s, x + 0.34 * s, y - 0.34 * s, color, lw); }
    else if (kind === 'equal') { d.line(x - 0.32 * s, y - 0.13 * s, x + 0.32 * s, y - 0.13 * s, color, lw); d.line(x - 0.32 * s, y + 0.13 * s, x + 0.32 * s, y + 0.13 * s, color, lw); }
    else if (kind === 'warn') { d.polygon([[x, y - 0.46 * s], [x + 0.5 * s, y + 0.4 * s], [x - 0.5 * s, y + 0.4 * s]], { stroke: color, lw: lw * 0.8 }); d.line(x, y - 0.14 * s, x, y + 0.1 * s, color, lw * 0.8); d.circle(x, y + 0.26 * s, lw * 0.5, { fill: color }); }
    else if (kind === 'eye') {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI; pts.push([x - 0.5 * s * Math.cos(t), y - 0.3 * s * Math.sin(t)]); }
      for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI; pts.push([x + 0.5 * s * Math.cos(t), y + 0.3 * s * Math.sin(t)]); }
      d.polyline(pts, color, lw * 0.8);
      d.circle(x, y, 0.14 * s, { fill: color });
    } else if (kind === 'lock') {
      d.rect(x - 0.32 * s, y - 0.05 * s, 0.64 * s, 0.5 * s, { fill: color, r: 2 });
      const arc: [number, number][] = [];
      for (let i = 0; i <= 12; i++) { const t = Math.PI + (i / 12) * Math.PI; arc.push([x + 0.22 * s * Math.cos(t), y - 0.05 * s + 0.3 * s * Math.sin(t)]); }
      d.polyline(arc, color, lw * 0.9);
    }
  });
}

/** Casilla de una cuadrícula: acierto (relleno + palomita), fallo (borde + cruz), empate (borde + signo igual) o vacía. */
export type Mark = 'ok' | 'bad' | 'tie' | 'none' | 'seen';
export function mark(S: Frame, x: number, y: number, s: number, m: Mark, a = 1, t: Tone = 'dat') {
  const { d, pal: p } = S;
  if (a <= 0.01) return;
  const g = s * 0.12, w = s - 2 * g;
  d.withAlpha(a, () => {
    if (m === 'none') d.rect(x + g, y + g, w, w, { stroke: p.line, lw: 1, r: 2 });
    else if (m === 'ok') { const c = tone(S, t); d.rect(x + g, y + g, w, w, { fill: alpha(c.c, 0.28), stroke: c.c, lw: 1.1, r: 2 }); if (w >= 9) glyph(S, 'check', x + s / 2, y + s / 2, w * 0.7, c.ink); }
    else if (m === 'bad') { const c = tone(S, 'err'); d.rect(x + g, y + g, w, w, { stroke: c.c, lw: 1.1, r: 2 }); glyph(S, 'cross', x + s / 2, y + s / 2, w * 0.72, c.c); }
    else if (m === 'tie') { const c = tone(S, 'w'); d.rect(x + g, y + g, w, w, { stroke: c.c, lw: 1.1, r: 2, dash: [3, 2] }); glyph(S, 'equal', x + s / 2, y + s / 2, w * 0.7, c.ink); }
    else if (m === 'seen') { const c = tone(S, 'lat'); d.rect(x + g, y + g, w, w, { fill: alpha(c.c, 0.55), stroke: c.c, lw: 1.1, r: 2 }); if (w >= 9) glyph(S, 'eye', x + s / 2, y + s / 2, w * 0.72, S.pal.stage); }
  });
}

/** Rejilla de 10 × 10 (o cols × rows) centrada en r; devuelve la geometría. */
export function gridGeom(r: Rect, cols = 10, rows = 10, max = 40) {
  const s = Math.min(r.w / cols, r.h / rows, max), gw = s * cols, gh = s * rows;
  return { x: r.x + (r.w - gw) / 2, y: r.y + (r.h - gh) / 2, s, w: gw, h: gh };
}

/** Eje horizontal de porcentaje: devuelve la función valor → x. */
export function pAxis(S: Frame, x0: number, x1: number, y: number, lo: number, hi: number, ticks: number[], a = 1, o: { label?: string; labelY?: number } = {}) {
  const { d, pal: p } = S, u = S.u, X = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  if (a > 0.01) d.withAlpha(a, () => {
    d.line(x0, y, x1, y, p.lineStrong, 1.6);
    ticks.forEach((v) => {
      d.line(X(v), y, X(v), y + 5 * u, p.lineStrong, 1.5);
      d.text(S.n(v, 0), X(v), y + 8 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
    if (o.label) fitText(S, o.label, x0, o.labelY ?? y + 8 * u + FS(S, 12) * u + 6 * u, x1 - x0, 12.5, { weight: 700, color: p.ink2, base: 'top', align: 'left' });
  });
  return X;
}
