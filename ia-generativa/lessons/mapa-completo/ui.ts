// Ayudas de dibujo propias de «El mapa completo» (adaptadas de las de «Riesgos y gobernanza» y «Agentes»).
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). La forma acompaña siempre al color.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de algo que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** En escenarios horizontales amplios (escritorio, tableta) el texto crece un poco: ahí sobra lugar. */
export const zoom = (S: Frame) => (!S.portrait && S.H >= 360 && S.W >= 640 ? 1.2 : 1);
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. Recibe el tamaño «de diseño». */
export const FS = (S: Frame, px: number) => Math.max(px * zoom(S), 12.2 / S.u);
/** Escenario muy bajo (teléfono en horizontal) o vertical casi cuadrado. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 42 : tight(S) ? 24 : 28) * S.u, (tight(S) ? 10 : 16) * S.u);
/** Reparto principal + lateral (horizontal) o principal + inferior (vertical). `asideMin`: alto mínimo de la franja inferior. */
export function panes(S: Frame, ratio = 0.6, asideMin = 112): { main: Rect; aside: Rect; gap: number } {
  const u = S.u, A = area(S), gap = (tight(S) ? 10 : 18) * u;
  if (S.portrait) {
    const ah = clamp(A.h * 0.36, asideMin * u, 176 * u);
    return { main: { x: A.x, y: A.y, w: A.w, h: A.h - ah - gap }, aside: { x: A.x, y: A.y + A.h - ah, w: A.w, h: ah }, gap };
  }
  const mw = Math.round(A.w * ratio);
  return { main: { x: A.x, y: A.y, w: mw, h: A.h }, aside: { x: A.x + mw + gap, y: A.y, w: A.w - mw - gap, h: A.h }, gap };
}

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
  if (!str || a <= 0.003) return;
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
export const chipW = (S: Frame, str: string, size = 13, weight = 700, font?: 'ui' | 'mono') => S.d.measure(str, { size: FS(S, size), weight, font }) + 14 * S.u;
export const chipH = (S: Frame, size = 13) => FS(S, size) * S.u + 10 * S.u;

// ── pictogramas ─────────────────────────────────────────────────────────────────────────────────────
export type GlyphKind = 'check' | 'mail' | 'chat' | 'book' | 'doc' | 'list' | 'flag' | 'map' | 'clock' | 'ask';
/** Pictograma centrado en (x, y) de tamaño s (px). Acompaña al color: nunca es el único canal. */
export function glyph(S: Frame, kind: GlyphKind, x: number, y: number, s: number, color: string, a = 1) {
  const d = S.d, lw = Math.max(1.5, s * 0.12), bg = S.pal.surface;
  if (a <= 0.003) return;
  d.withAlpha(a, () => {
    if (kind === 'check') d.polyline([[x - 0.42 * s, y + 0.02 * s], [x - 0.12 * s, y + 0.32 * s], [x + 0.44 * s, y - 0.34 * s]], color, lw * 1.25, { join: 'round' });
    else if (kind === 'mail') { d.rect(x - 0.46 * s, y - 0.3 * s, 0.92 * s, 0.6 * s, { stroke: color, lw: lw * 0.85, fill: bg }); d.polyline([[x - 0.46 * s, y - 0.3 * s], [x, y + 0.06 * s], [x + 0.46 * s, y - 0.3 * s]], color, lw * 0.85); }
    else if (kind === 'chat') { d.rect(x - 0.46 * s, y - 0.36 * s, 0.92 * s, 0.56 * s, { stroke: color, lw: lw * 0.85, fill: bg, r: 4 }); d.polygon([[x - 0.22 * s, y + 0.2 * s], [x - 0.28 * s, y + 0.44 * s], [x + 0.02 * s, y + 0.2 * s]], { fill: color }); [-0.2, 0, 0.2].forEach((k) => d.circle(x + k * s, y - 0.08 * s, lw * 0.7, { fill: color })); }
    else if (kind === 'book') { d.rect(x - 0.36 * s, y - 0.4 * s, 0.72 * s, 0.8 * s, { stroke: color, lw: lw * 0.9, fill: bg, r: 1.5 }); d.line(x - 0.2 * s, y - 0.4 * s, x - 0.2 * s, y + 0.4 * s, color, lw * 0.8); }
    else if (kind === 'doc') { d.rect(x - 0.3 * s, y - 0.42 * s, 0.6 * s, 0.84 * s, { stroke: color, lw: lw * 0.85, fill: bg }); [-0.2, 0, 0.2].forEach((k) => d.line(x - 0.16 * s, y + k * s, x + 0.16 * s, y + k * s, color, lw * 0.7)); }
    else if (kind === 'list') { [-0.26, 0, 0.26].forEach((k) => { d.polyline([[x - 0.42 * s, y + k * s], [x - 0.33 * s, y + (k + 0.08) * s], [x - 0.2 * s, y + (k - 0.08) * s]], color, lw * 0.8); d.line(x - 0.08 * s, y + k * s, x + 0.42 * s, y + k * s, color, lw * 0.9); }); }
    else if (kind === 'flag') { d.line(x - 0.3 * s, y + 0.46 * s, x - 0.3 * s, y - 0.46 * s, color, lw); d.polygon([[x - 0.3 * s, y - 0.46 * s], [x + 0.42 * s, y - 0.24 * s], [x - 0.3 * s, y - 0.02 * s]], { fill: color }); }
    else if (kind === 'map') { d.polyline([[x - 0.44 * s, y + 0.3 * s], [x - 0.14 * s, y - 0.1 * s], [x + 0.12 * s, y + 0.14 * s], [x + 0.44 * s, y - 0.3 * s]], color, lw, { join: 'round' }); [[-0.44, 0.3], [-0.14, -0.1], [0.12, 0.14], [0.44, -0.3]].forEach(([a2, b2]) => d.circle(x + a2 * s, y + b2 * s, lw * 1.1, { fill: bg, stroke: color, lw: lw * 0.8 })); }
    else if (kind === 'clock') { d.circle(x, y, 0.42 * s, { stroke: color, lw, fill: bg }); d.line(x, y, x, y - 0.26 * s, color, lw); d.line(x, y, x + 0.2 * s, y + 0.06 * s, color, lw); }
    else if (kind === 'ask') { d.circle(x, y, 0.44 * s, { stroke: color, lw, fill: bg }); d.text('?', x, y + 0.02 * s, { size: (0.62 * s) / S.u, weight: 800, color, align: 'center', base: 'middle' }); }
  });
}
