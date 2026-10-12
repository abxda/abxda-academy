// Ayudas de dibujo propias de la lección «Agentes y herramientas».
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). La forma acompaña siempre al color: paso bien = punto con palomita,
//   paso mal = cruz, error detectado y repetido = flecha circular; lo que es una petición o un supuesto va punteado.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
/** Resalte que sube al empezar `a` y baja al empezar `b`. */
export const hold = (S: Frame, a: string, b?: string, f0 = 0.05, f1 = 0.2) => (S.on(a) ? fr(S, a, f0, f1) * (b && S.on(b) ? 1 - fr(S, b, 0, 0.12) : 1) : 0);
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** En escenarios horizontales amplios (escritorio, tableta) el texto crece un poco: ahí sobra lugar. */
export const zoom = (S: Frame) => (!S.portrait && S.H >= 360 && S.W >= 640 ? 1.14 : 1);
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. Recibe el tamaño «de diseño». */
export const FS = (S: Frame, px: number) => Math.max(px * zoom(S), 12.2 / S.u);
/** Escenario muy bajo (teléfono en horizontal) o vertical casi cuadrado. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
export const veryShort = (S: Frame) => !S.portrait && S.H < 280;
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
  return s;
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

/** Globo de chat: el de la persona a la derecha, el del modelo a la izquierda. Devuelve su alto. */
export function bubble(S: Frame, text: string, who: 'user' | 'ai', x: number, y: number, maxW: number, size: number, o: { a?: number; hot?: number; measureOnly?: boolean; maxLines?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, who === 'user' ? 'sig' : 'lat'), pad = (tight(S) ? 6 : 9) * u;
  const ls = lines(S, text, maxW - 2 * pad, size, { weight: 600, maxLines: o.maxLines });
  const tw = Math.max(...ls.map((l) => d.measure(l, { size, weight: 600 }))), w = Math.min(maxW, tw + 2 * pad), lh = size * u * 1.25, h = ls.length * lh + 2 * pad - 4 * u;
  if (o.measureOnly) return h;
  const bx = who === 'user' ? x + maxW - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(bx, y, w, h, { fill: alpha(t.c, 0.12 + 0.2 * (o.hot ?? 0)), stroke: t.c, lw: (o.hot ?? 0) > 0.4 ? 2.4 : 1.4, r: 8 * u });
    ls.forEach((l, i) => d.text(l, bx + pad, y + pad - 2 * u + i * lh, { size, weight: 600, color: p.ink, base: 'top' }));
  });
  return h;
}

/** Candado en píxeles: los pesos quedan fijos. Ocupa 8·cell de lado. */
const LOCK = ['..1111..', '.1....1.', '.1....1.', '11111111', '11222211', '11222211', '11222211', '11111111'];
export function lock(S: Frame, x: number, y: number, cell: number, a = 1, t: Tone = 'w') {
  S.d.withAlpha(a, () => LOCK.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') S.d.rect(x + c * cell, y + r * cell, cell, cell, { fill: ch === '1' ? S.pal.ink2 : tone(S, t).c }); })));
}

/** Persona en píxeles. Ocupa 6·sc × 9·sc. */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'sig', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

// ── pictogramas ─────────────────────────────────────────────────────────────────────────────────────
export type GlyphKind = 'check' | 'cross' | 'redo' | 'warn' | 'doc' | 'dot';
/** Pictograma centrado en (x, y) de tamaño s (px). Acompaña al color: nunca es el único canal. */
export function glyph(S: Frame, kind: GlyphKind, x: number, y: number, s: number, color: string, a = 1) {
  const d = S.d, lw = Math.max(1.6, s * 0.17);
  d.withAlpha(a, () => {
    if (kind === 'check') d.polyline([[x - 0.42 * s, y + 0.02 * s], [x - 0.12 * s, y + 0.32 * s], [x + 0.44 * s, y - 0.34 * s]], color, lw, { join: 'round' });
    else if (kind === 'cross') { d.line(x - 0.36 * s, y - 0.36 * s, x + 0.36 * s, y + 0.36 * s, color, lw); d.line(x - 0.36 * s, y + 0.36 * s, x + 0.36 * s, y - 0.36 * s, color, lw); }
    else if (kind === 'redo') {
      // flecha circular: arco de casi una vuelta con punta
      const r = 0.36 * s, pts: [number, number][] = [];
      for (let i = 0; i <= 18; i++) { const t = -Math.PI * 0.35 + (i / 18) * Math.PI * 1.55; pts.push([x + r * Math.cos(t), y + r * Math.sin(t)]); }
      d.polyline(pts, color, lw);
      const [ex, ey] = pts[pts.length - 1], t1 = -Math.PI * 0.35 + Math.PI * 1.55, tx = -Math.sin(t1), ty = Math.cos(t1);
      const hs = 0.26 * s;
      d.polygon([[ex + tx * hs, ey + ty * hs], [ex - ty * hs * 0.75, ey + tx * hs * 0.75], [ex + ty * hs * 0.75, ey - tx * hs * 0.75]], { fill: color });
    } else if (kind === 'warn') { d.polygon([[x, y - 0.46 * s], [x + 0.5 * s, y + 0.4 * s], [x - 0.5 * s, y + 0.4 * s]], { stroke: color, lw: lw * 0.8 }); d.line(x, y - 0.14 * s, x, y + 0.1 * s, color, lw * 0.8); d.circle(x, y + 0.26 * s, lw * 0.5, { fill: color }); }
    else if (kind === 'doc') { d.rect(x - 0.3 * s, y - 0.42 * s, 0.6 * s, 0.84 * s, { stroke: color, lw: lw * 0.7, fill: S.pal.surface }); [-0.2, 0, 0.2].forEach((k) => d.line(x - 0.16 * s, y + k * s, x + 0.16 * s, y + k * s, color, lw * 0.55)); }
    else if (kind === 'dot') d.circle(x, y, 0.22 * s, { fill: color });
  });
}

/** Casilla de un paso. estado: 'ok' (palomita), 'bad' (cruz), 'redo' (detectado y repetido), 'ruin' (después de un error), 'empty' (aún no). */
export type StepState = 'ok' | 'bad' | 'redo' | 'ruin' | 'empty';
export function stepMark(S: Frame, x: number, y: number, s: number, st: StepState, a = 1) {
  const { d, pal: p } = S;
  if (a <= 0.01) return;
  d.withAlpha(a, () => {
    if (st === 'empty') d.circle(x, y, s * 0.42, { stroke: p.line, lw: 1 });
    else if (st === 'ok') { const t = tone(S, 'dat'); d.circle(x, y, s * 0.42, { fill: alpha(t.c, 0.2), stroke: t.c, lw: 1.2 }); if (s >= 9) glyph(S, 'check', x, y, s * 0.62, t.ink); }
    else if (st === 'ruin') d.circle(x, y, s * 0.3, { fill: alpha(p.ink2, 0.12), stroke: alpha(p.ink2, 0.3), lw: 1 });
    else if (st === 'bad') { const t = tone(S, 'err'); glyph(S, 'cross', x, y, s * 1.02, t.c); }
    else if (st === 'redo') { const t = tone(S, 'w'); d.circle(x, y, s * 0.5, { fill: alpha(t.c, 0.18) }); glyph(S, 'redo', x, y, s * 0.9, t.ink); }
  });
}
