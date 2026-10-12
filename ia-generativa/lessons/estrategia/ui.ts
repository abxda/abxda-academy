// Ayudas de dibujo propias de la lección «Estrategia para organizaciones» (adaptadas de las de «Riesgos y gobernanza»).
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). La forma acompaña siempre al color: palomita = bien o hecho,
//   cruz = descartado o mal, triángulo = advertencia; lo ilustrativo va rotulado al pie (provenance).
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de algo que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const lerp2 = (a: number, b: number, t: number) => a + (b - a) * t;

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** En escenarios horizontales amplios (escritorio, tableta) el texto crece un poco: ahí sobra lugar. */
export const zoom = (S: Frame) => (!S.portrait && S.H >= 360 && S.W >= 640 ? 1.2 : 1);
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. Recibe el tamaño «de diseño». */
export const FS = (S: Frame, px: number) => Math.max(px * zoom(S), 12.2 / S.u);
/** Escenario muy bajo (teléfono en horizontal) o vertical casi cuadrado. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 42 : tight(S) ? 24 : 28) * S.u, (tight(S) ? 10 : 16) * S.u);
/** Alto de la franja del encabezado «camino k de 8». */
export const headH = (S: Frame) => FS(S, 13) * S.u + (tight(S) ? 8 : 14) * S.u;
/** Área de trabajo debajo del encabezado. */
export const areaH = (S: Frame): Rect => { const A = area(S), h = headH(S); return { x: A.x, y: A.y + h, w: A.w, h: A.h - h }; };

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
  const d = S.d, lh = (o.lh ?? 1.26) * size * S.u, ls = lines(S, text, w, size, o);
  ls.forEach((ln, i) => {
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(ln, tx, y + i * lh, { size, weight: o.weight ?? 500, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, italic: o.italic });
  });
  return ls.length * lh;
}
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; maxLines?: number; lh?: number; font?: 'ui' | 'mono' } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.26) * size * S.u;

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

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas si hace falta y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  if (!str) return;
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
  if ((o.a ?? 1) > 0.003) d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.solid ? c.c : t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: wt, font: o.font, color: o.solid ? S.pal.stage : t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
/** Etiqueta llena que parte su texto en renglones si no cabe en `w`. Devuelve su alto (también con measureOnly). */
export function tagWrap(S: Frame, str: string, x: number, y: number, w: number, t: Tone, o: { size?: number; a?: number; measureOnly?: boolean } = {}) {
  const u = S.u, c = tone(S, t), size = FS(S, o.size ?? 13), padX = 7 * u, padY = 5 * u;
  const ls = lines(S, str, w - 2 * padX, size, { weight: 700 }), lh = size * u * 1.2;
  const tw = Math.max(...ls.map((l) => S.d.measure(l, { size, weight: 700 }))), h = ls.length * lh + 2 * padY;
  if (o.measureOnly || (o.a ?? 1) <= 0.003) return h;
  S.d.withAlpha(o.a ?? 1, () => {
    S.d.rect(x, y, tw + 2 * padX, h, { fill: c.c, r: 3 });
    ls.forEach((l, i) => S.d.text(l, x + padX, y + padY + i * lh, { size, weight: 700, color: S.pal.stage, base: 'top' }));
  });
  return h;
}
export const chipW = (S: Frame, str: string, size = 13, weight = 700, font?: 'ui' | 'mono') => S.d.measure(str, { size: FS(S, size), weight, font }) + 14 * S.u;
export const chipH = (S: Frame, size = 13) => FS(S, size) * S.u + 10 * S.u;

/** Flecha que crece de (x1,y1) a (x2,y2) según `k`. */
export function growArrow(S: Frame, x1: number, y1: number, x2: number, y2: number, k: number, color: string, lw = 2.2, dash?: number[]) {
  if (k <= 0) return;
  const ex = x1 + (x2 - x1) * k, ey = y1 + (y2 - y1) * k;
  if (dash) { S.d.line(x1, y1, ex, ey, color, lw, dash); return; }
  S.d.arrow(x1, y1, ex, ey, color, lw, k > 0.97 ? 8 * Math.max(0.85, S.u) : 0.001);
}

/** Punto a la fracción t de una poligonal (para mover fichas por un camino). */
export function along(pts: [number, number][], t: number): [number, number] {
  if (pts.length === 1) return pts[0];
  const seg: number[] = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let rem = clamp(t) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (rem <= seg[i] || i === seg.length - 1) { const k = seg[i] ? Math.min(1, rem / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; }
    rem -= seg[i];
  }
  return pts[pts.length - 1];
}

/** Persona en píxeles. Ocupa 6·sc × 9·sc. */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'sig', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

// ── pictogramas ─────────────────────────────────────────────────────────────────────────────────────
export type GlyphKind = 'check' | 'cross' | 'warn' | 'doc' | 'mail' | 'lock' | 'phone' | 'user' | 'list' | 'bolt' | 'book' | 'scale'
  | 'wrench' | 'cart' | 'blocks' | 'tune' | 'chip' | 'coin' | 'clock' | 'flag' | 'chat';
/** Pictograma centrado en (x, y) de tamaño s (px). Acompaña al color: nunca es el único canal. */
export function glyph(S: Frame, kind: GlyphKind, x: number, y: number, s: number, color: string, a = 1) {
  const d = S.d, lw = Math.max(1.5, s * 0.13), bg = S.pal.surface;
  if (a <= 0.003) return;
  d.withAlpha(a, () => {
    if (kind === 'check') d.polyline([[x - 0.42 * s, y + 0.02 * s], [x - 0.12 * s, y + 0.32 * s], [x + 0.44 * s, y - 0.34 * s]], color, lw * 1.25, { join: 'round' });
    else if (kind === 'cross') { const l2 = lw * 1.25; d.line(x - 0.36 * s, y - 0.36 * s, x + 0.36 * s, y + 0.36 * s, color, l2); d.line(x - 0.36 * s, y + 0.36 * s, x + 0.36 * s, y - 0.36 * s, color, l2); }
    else if (kind === 'warn') { d.polygon([[x, y - 0.46 * s], [x + 0.5 * s, y + 0.4 * s], [x - 0.5 * s, y + 0.4 * s]], { stroke: color, lw, fill: bg }); d.line(x, y - 0.14 * s, x, y + 0.1 * s, color, lw); d.circle(x, y + 0.25 * s, lw * 0.6, { fill: color }); }
    else if (kind === 'doc') { d.rect(x - 0.3 * s, y - 0.42 * s, 0.6 * s, 0.84 * s, { stroke: color, lw: lw * 0.85, fill: bg }); [-0.2, 0, 0.2].forEach((k) => d.line(x - 0.16 * s, y + k * s, x + 0.16 * s, y + k * s, color, lw * 0.7)); }
    else if (kind === 'mail') { d.rect(x - 0.46 * s, y - 0.3 * s, 0.92 * s, 0.6 * s, { stroke: color, lw: lw * 0.85, fill: bg }); d.polyline([[x - 0.46 * s, y - 0.3 * s], [x, y + 0.06 * s], [x + 0.46 * s, y - 0.3 * s]], color, lw * 0.85); }
    else if (kind === 'lock') { d.rect(x - 0.34 * s, y - 0.04 * s, 0.68 * s, 0.48 * s, { fill: color, r: 1.5 }); d.polyline([[x - 0.2 * s, y - 0.04 * s], [x - 0.2 * s, y - 0.26 * s], [x - 0.08 * s, y - 0.4 * s], [x + 0.08 * s, y - 0.4 * s], [x + 0.2 * s, y - 0.26 * s], [x + 0.2 * s, y - 0.04 * s]], color, lw); }
    else if (kind === 'phone') { d.rect(x - 0.24 * s, y - 0.44 * s, 0.48 * s, 0.88 * s, { stroke: color, lw: lw * 0.9, fill: bg, r: 3 }); d.line(x - 0.08 * s, y + 0.32 * s, x + 0.08 * s, y + 0.32 * s, color, lw * 0.8); }
    else if (kind === 'user') { d.circle(x, y - 0.2 * s, 0.17 * s, { fill: color }); d.polygon([[x - 0.34 * s, y + 0.42 * s], [x - 0.3 * s, y + 0.08 * s], [x, y + 0.0 * s], [x + 0.3 * s, y + 0.08 * s], [x + 0.34 * s, y + 0.42 * s]], { fill: color }); }
    else if (kind === 'list') { [-0.26, 0, 0.26].forEach((k) => { d.circle(x - 0.32 * s, y + k * s, lw * 0.75, { fill: color }); d.line(x - 0.18 * s, y + k * s, x + 0.4 * s, y + k * s, color, lw * 0.9); }); }
    else if (kind === 'bolt') d.polygon([[x + 0.08 * s, y - 0.46 * s], [x - 0.28 * s, y + 0.06 * s], [x - 0.02 * s, y + 0.06 * s], [x - 0.1 * s, y + 0.46 * s], [x + 0.28 * s, y - 0.08 * s], [x + 0.02 * s, y - 0.08 * s]], { fill: color });
    else if (kind === 'book') { d.rect(x - 0.36 * s, y - 0.4 * s, 0.72 * s, 0.8 * s, { stroke: color, lw: lw * 0.9, fill: bg, r: 1.5 }); d.line(x - 0.2 * s, y - 0.4 * s, x - 0.2 * s, y + 0.4 * s, color, lw * 0.8); }
    else if (kind === 'wrench') { d.line(x - 0.34 * s, y + 0.34 * s, x + 0.1 * s, y - 0.1 * s, color, lw * 1.5); d.circle(x + 0.2 * s, y - 0.2 * s, 0.2 * s, { stroke: color, lw: lw * 1.1, fill: bg }); d.line(x + 0.2 * s, y - 0.2 * s, x + 0.42 * s, y - 0.42 * s, bg, lw * 1.6); }
    else if (kind === 'cart') { d.polyline([[x - 0.46 * s, y - 0.34 * s], [x - 0.3 * s, y - 0.34 * s], [x - 0.18 * s, y + 0.16 * s], [x + 0.36 * s, y + 0.16 * s], [x + 0.44 * s, y - 0.18 * s], [x - 0.24 * s, y - 0.18 * s]], color, lw, { join: 'round' }); d.circle(x - 0.12 * s, y + 0.34 * s, lw * 0.9, { fill: color }); d.circle(x + 0.3 * s, y + 0.34 * s, lw * 0.9, { fill: color }); }
    else if (kind === 'blocks') { const b = 0.36 * s; d.rect(x - b, y, b, b, { stroke: color, lw: lw * 0.85, fill: bg }); d.rect(x, y, b, b, { stroke: color, lw: lw * 0.85, fill: bg }); d.rect(x - b / 2, y - b, b, b, { fill: color }); }
    else if (kind === 'tune') { [-0.24, 0, 0.24].forEach((k, i) => { d.line(x - 0.4 * s, y + k * s, x + 0.4 * s, y + k * s, color, lw * 0.8); d.circle(x + [-0.18, 0.2, -0.04][i] * s, y + k * s, 0.09 * s, { fill: color }); }); }
    else if (kind === 'chip') { d.rect(x - 0.28 * s, y - 0.28 * s, 0.56 * s, 0.56 * s, { stroke: color, lw: lw * 0.9, fill: bg, r: 2 }); [-0.14, 0, 0.14].forEach((k) => { d.line(x + k * s, y - 0.44 * s, x + k * s, y - 0.28 * s, color, lw * 0.7); d.line(x + k * s, y + 0.28 * s, x + k * s, y + 0.44 * s, color, lw * 0.7); d.line(x - 0.44 * s, y + k * s, x - 0.28 * s, y + k * s, color, lw * 0.7); d.line(x + 0.28 * s, y + k * s, x + 0.44 * s, y + k * s, color, lw * 0.7); }); }
    else if (kind === 'coin') { d.circle(x, y, 0.4 * s, { stroke: color, lw, fill: bg }); d.text('$', x, y + 0.03 * s, { size: (0.5 * s) / S.u, weight: 800, color, align: 'center', base: 'middle' }); }
    else if (kind === 'clock') { d.circle(x, y, 0.4 * s, { stroke: color, lw, fill: bg }); d.polyline([[x, y - 0.24 * s], [x, y], [x + 0.18 * s, y + 0.1 * s]], color, lw); }
    else if (kind === 'flag') { d.line(x - 0.3 * s, y - 0.44 * s, x - 0.3 * s, y + 0.44 * s, color, lw); d.polygon([[x - 0.3 * s, y - 0.44 * s], [x + 0.38 * s, y - 0.26 * s], [x - 0.3 * s, y - 0.06 * s]], { fill: color }); }
    else if (kind === 'chat') { d.rect(x - 0.44 * s, y - 0.34 * s, 0.88 * s, 0.56 * s, { stroke: color, lw: lw * 0.9, fill: bg, r: 3 }); d.polygon([[x - 0.24 * s, y + 0.2 * s], [x - 0.3 * s, y + 0.44 * s], [x - 0.04 * s, y + 0.2 * s]], { fill: color }); [-0.18, 0, 0.18].forEach((k) => d.circle(x + k * s, y - 0.06 * s, lw * 0.6, { fill: color })); }
    else if (kind === 'scale') { d.line(x, y - 0.4 * s, x, y + 0.36 * s, color, lw); d.line(x - 0.4 * s, y - 0.24 * s, x + 0.4 * s, y - 0.24 * s, color, lw); d.line(x - 0.24 * s, y + 0.38 * s, x + 0.24 * s, y + 0.38 * s, color, lw); [-0.4, 0.4].forEach((k) => d.polyline([[x + (k - 0.16) * s, y + 0.06 * s], [x + k * s, y - 0.24 * s], [x + (k + 0.16) * s, y + 0.06 * s]], color, lw * 0.8)); [-0.4, 0.4].forEach((k) => d.line(x + (k - 0.18) * s, y + 0.06 * s, x + (k + 0.18) * s, y + 0.06 * s, color, lw)); }
  });
}

/** Caja de un nodo del diagrama: pictograma a la izquierda y rótulo (una o dos líneas) que se ajusta al ancho. */
export function node(S: Frame, r: Rect, labels: string | string[], t: Tone, g: GlyphKind, o: { a?: number; hot?: number; off?: number } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, t), a = o.a ?? 1, off = o.off ?? 0;
  if (a <= 0.003) return;
  d.withAlpha(a * (1 - 0.55 * off), () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t === 'ink' ? p.ink : c.c, 0.07 + 0.22 * (o.hot ?? 0)), stroke: t === 'ink' ? p.lineStrong : c.c, lw: (o.hot ?? 0) > 0.4 ? 2.6 : 1.5, r: 5 * u, dash: off > 0.5 ? [5, 4] : undefined });
    const gs = Math.min(r.h * 0.5, 20 * u), gx = r.x + 6 * u + gs / 2;
    // el primer rótulo que quepa completo en dos renglones (si no, el último); si ni así cabe, se omite el pictograma
    const size = FS(S, 13.5), opts = Array.isArray(labels) ? labels : [labels];
    const fitsIn = (l: string, w: number) => {
      const ls0 = S.d.wrap(l, w, { size, weight: 700 });
      if (ls0.length === 1) return S.d.measure(l, { size: 12.2 / u, weight: 700 }) <= w;   // un renglón puede achicarse
      return ls0.length === 2 && ls0.every((ln) => S.d.measure(ln, { size, weight: 700 }) <= w);
    };
    let tx = gx + gs / 2 + 6 * u, tw = r.x + r.w - 6 * u - tx;
    let label = opts.find((l) => fitsIn(l, tw));
    if (!label) { tx = r.x + 6 * u; tw = r.w - 12 * u; label = opts.find((l) => fitsIn(l, tw)) ?? opts[opts.length - 1]; }
    else glyph(S, g, gx, r.y + r.h / 2, gs, t === 'ink' ? p.ink2 : c.ink);
    const ls = lines(S, label, tw, size, { weight: 700, maxLines: 2 });
    const one = ls.length === 1 ? fitSize(S, label, tw, 13.5, 700) : size;
    const lh = one * u * 1.18, y0 = r.y + r.h / 2 - (ls.length * lh) / 2;
    ls.forEach((ln, i) => d.text(ln, tx, y0 + i * lh, { size: one, weight: 700, color: t === 'ink' ? p.ink : c.ink, base: 'top' }));
  });
  if (off > 0.02) glyph(S, 'cross', r.x + r.w - 4 * u, r.y + r.h - 4 * u, 18 * u * Math.max(0.85, u), tone(S, 'err').c, a * off);
}


// ── encabezado: los seis pasos de la estrategia ─────────────────────────────────────────────────────
export const STEPS: [string, string][] = [
  ['Elegir el caso', 'Choosing the case'], ['Construir o comprar', 'Build versus buy'], ['Costo total', 'Total cost'],
  ['Retorno', 'Return'], ['Datos y piloto', 'Data and pilot'], ['Personas y errores', 'People and mistakes'],
];
/** Encabezado «Paso k de 6 · título» con seis casillas; la del paso actual va llena. k = 0 dibuja solo el título. */
export function header(S: Frame, k: number, title?: string, a = 1) {
  if (a <= 0.003) return;
  const { d, pal: p } = S, u = S.u, A = area(S), cy = A.y + (FS(S, 13) * u) / 2 + 1;
  const t = title ?? (k > 0 ? S.l(STEPS[k - 1][0], STEPS[k - 1][1]) : '');
  d.withAlpha(a, () => {
    let x = A.x;
    if (k > 0) {
      const s = Math.max(7, 8 * u), g = 3 * u;
      for (let i = 1; i <= 6; i++) {
        const on = i === k, past = i < k;
        d.rect(x, cy - s / 2, s, s, { fill: on ? tone(S, 'sig').c : past ? alpha(p.ink, 0.35) : undefined, stroke: on ? tone(S, 'sig').c : p.lineStrong, lw: 1.2 });
        x += s + g;
      }
      x += 6 * u;
    }
    const lab = k > 0 ? S.l(`Paso ${k} de 6 · ${t}`, `Step ${k} of 6 · ${t}`) : t;
    fitText(S, lab, x, cy, A.x + A.w - x, 13, { weight: 800, color: p.ink2, base: 'middle' });
  });
}

/** Dinero con el formato del idioma: «12 000 dólares» / «$12,000»; con signo si se pide. */
export function money(S: Frame, v: number, o: { digits?: number; sign?: boolean; short?: boolean } = {}) {
  const dg = o.digits ?? 0, abs = S.n(Math.abs(v), dg), sg = v < 0 ? '−' : o.sign ? '+' : '';
  if (o.short) return S.l(`${sg}${abs} USD`, `${sg}$${abs}`);
  return S.l(`${sg}${abs} dólares`, `${sg}$${abs}`);
}
