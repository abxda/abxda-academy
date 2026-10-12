// Utilidades de dibujo de la lección «Tokens»: tiempo por fracciones del segmento, márgenes adaptables y filas de bloques
// (tokens) con ajuste de línea, número debajo y grupos de bytes sueltos. Todo se pide al kit por rol de color; nada de hex.
import { alpha, clamp, ease, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { Tok } from './bpe';

// ── tiempo: siempre por fracciones de la duración del segmento (las voces y los idiomas duran distinto) ──
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

// ── espacio ──
/** ¿Escenario muy bajo (teléfono en horizontal)? */
export const isShort = (S: Frame) => !S.portrait && S.H < 300;
/** Margen exterior. */
export const margin = (S: Frame) => (isShort(S) ? 10 : 16) * S.u;
/** Área útil del escenario. */
export function area(S: Frame): Rect { const m = margin(S); return { x: m, y: m, w: S.W - 2 * m, h: S.H - 2 * m }; }

/** Texto corto en una línea que se achica (hasta `min`) para caber en `w`; si aun así no cabe, se recorta con «…». */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, o: { size?: number; min?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; font?: 'ui' | 'mono'; a?: number } = {}) {
  const d = S.d; let size = o.size ?? 13; const min = o.min ?? 12, weight = o.weight ?? 600;
  while (size > min && d.measure(str, { size, weight, font: o.font }) > w) size -= 0.5;
  let s = str;
  if (d.measure(s, { size, weight, font: o.font }) > w) { while (s.length > 1 && d.measure(s + '…', { size, weight, font: o.font }) > w) s = s.slice(0, -1); s += '…'; }
  return d.text(s, x, y, { size, weight, color: o.color, align: o.align, base: o.base ?? 'top', font: o.font, a: o.a });
}

/** Nota pequeña que se parte en varias líneas si no cabe; `bottom` = se apoya en y (crece hacia arriba). */
export function note(S: Frame, str: string, x: number, y: number, w: number, o: { align?: CanvasTextAlign; a?: number; color?: string; bottom?: boolean } = {}) {
  const lines = S.d.wrap(str, w, { size: 12, weight: 600 }), lh = 12 * 1.3 * S.u;
  const yy = o.bottom ? y - lines.length * lh : y;
  return S.d.text(str, x, yy, { size: 12, weight: 600, color: o.color ?? S.pal.mute, align: o.align, base: 'top', w, a: o.a });
}

/** ¿Cabe el texto en una línea de ancho w? */
export const fits = (S: Frame, str: string, w: number, size = 12, weight = 700) => S.d.measure(str, { size, weight }) <= w;

/** Caja con borde y texto centrado que se parte en líneas si hace falta (alto según el texto). Devuelve el alto. */
export function textBox(S: Frame, x: number, y: number, w: number, str: string, t: Tone, o: { a?: number; size?: number } = {}) {
  const { d } = S, u = S.u, c = tone(S, t), size = o.size ?? 13, lines = d.wrap(str, w - 20 * u, { size, weight: 700 }), lh = size * 1.3 * u, h = lines.length * lh + 14 * u;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(c.c, 0.12), stroke: c.c, lw: 1.5, r: 4 });
    d.text(str, x + w / 2, y + 7 * u, { size, weight: 700, color: c.ink, align: 'center', base: 'top', w: w - 20 * u });
  });
  return h;
}

/** Rótulo de sección pequeño y apagado. */
export function caption(S: Frame, str: string, x: number, y: number, w: number, o: { align?: CanvasTextAlign; a?: number; color?: string; size?: number } = {}) {
  return fitText(S, str, x, y, w, { size: o.size ?? 12, weight: 700, color: o.color ?? S.pal.mute, align: o.align, a: o.a });
}

// ── filas de bloques (tokens) ──
export interface BOpt {
  size?: number; minSize?: number; gap?: number;
  /** Número bajo cada bloque. */
  ids?: (string | number)[] | null; idsA?: number;
  tone?: Tone;
  /** Resaltado 0..1 de un bloque (relleno fuerte y borde de tinta). */
  hi?: (i: number) => number;
  /** Marca de error 0..1 (borde punteado). */
  warn?: (i: number) => number;
  /** Atenuado 0..1. */
  dim?: (i: number) => number;
  /** Bloque «crudo» (bytes sueltos): borde punteado. */
  raw?: (i: number) => boolean;
  /** Cuántos tokens representa cada bloque (un grupo de bytes que forman una letra = 2 o más). */
  parts?: number[];
  /** Cuántos bloques se ven (fraccionario = aparición progresiva). */
  show?: number;
  a?: number; center?: boolean; maxRows?: number;
  /** Si la fila no cabe en una línea, se fuerza un salto antes de este índice (p. ej. para que un nombre quede entero en su fila). */
  breakAt?: number;
}
export interface BLay { boxes: Rect[]; h: number; rows: number; size: number; bh: number; idH: number; rowOf: number[]; truncated: boolean }

/** Reparte los bloques en filas dentro de `w` px con letra `size` (sin achicar). Cajas relativas a (0, 0). */
export function layBlocks(S: Frame, labels: string[], w: number, size: number, o: BOpt = {}): BLay {
  const u = S.u, d = S.d, gap = (o.gap ?? 4) * u, pad = Math.max(4, size * 0.38) * u, bh = (size + 10) * u, idH = o.ids ? 15 * u : 0, rowH = bh + idH + gap + (o.ids ? 3 * u : 0);
  const boxes: Rect[] = [], rowOf: number[] = [];
  let x = 0, y = 0, row = 0;
  const widths = labels.map((l, i) => {
    const n = o.parts?.[i] ?? 1;
    let bw = Math.max(bh * 0.78, d.measure(l, { size, weight: 600, font: 'mono' }) + 2 * pad) + (n > 1 ? (n - 1) * 8 * u : 0);
    if (o.ids) bw = Math.max(bw, d.measure(String(o.ids[i] ?? ''), { size: 12, font: 'mono' }) + 4 * u);
    return bw;
  });
  const oneRow = widths.reduce((s2, v) => s2 + v + gap, -gap) <= w;
  labels.forEach((_, i) => {
    const bw = widths[i];
    if (x > 0 && (x + bw > w || (!oneRow && o.breakAt === i))) { x = 0; y += rowH; row++; }
    boxes.push({ x, y, w: bw, h: bh }); rowOf.push(row);
    x += bw + gap;
  });
  const rows = row + 1;
  if (o.center) {
    for (let r = 0; r < rows; r++) {
      const idx = rowOf.map((rr, i) => (rr === r ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) continue;
      const last = boxes[idx[idx.length - 1]], rw = last.x + last.w, off = (w - rw) / 2;
      idx.forEach((i) => (boxes[i].x += off));
    }
  }
  return { boxes, h: rows * rowH - gap, rows, size, bh, idH, rowOf, truncated: false };
}

/** Elige la letra más grande (entre size y minSize) con la que la fila cabe en `r`. */
export function fitBlocks(S: Frame, labels: string[], r: { w: number; h: number }, o: BOpt = {}): BLay {
  let size = o.size ?? 16; const min = o.minSize ?? 12;
  let L = layBlocks(S, labels, r.w, size, o);
  while ((L.h > r.h || (o.maxRows && L.rows > o.maxRows)) && size > min) { size -= 1; L = layBlocks(S, labels, r.w, size, o); }
  return L;
}

/** Dibuja una fila de bloques que cabe en `rect` (usa `lay` si ya se calculó). Devuelve la disposición en coordenadas absolutas. */
export function drawBlocks(S: Frame, labels: string[], rect: Rect, o: BOpt = {}, lay?: BLay): BLay {
  const { d, pal: p } = S, u = S.u;
  const L = lay ?? fitBlocks(S, labels, rect, o);
  const t = tone(S, o.tone ?? 'lat'), er = tone(S, 'err'), n = labels.length, shown = o.show ?? n;
  const boxes = L.boxes.map((b) => ({ x: rect.x + b.x, y: rect.y + b.y, w: b.w, h: b.h }));
  let truncated = false;
  boxes.forEach((b, i) => {
    if (b.y + b.h > rect.y + rect.h + 1) { truncated = true; return; }
    const a = clamp(shown - i) * (o.a ?? 1) * (1 - 0.7 * (o.dim?.(i) ?? 0));
    if (a <= 0.003) return;
    const hi = o.hi?.(i) ?? 0, warn = o.warn?.(i) ?? 0, parts = o.parts?.[i] ?? 1, raw = parts > 1 || !!o.raw?.(i);
    d.withAlpha(a, () => {
      if (raw) {
        d.rect(b.x, b.y, b.w, b.h, { fill: alpha(p.mute, 0.1 + 0.25 * hi), stroke: hi > 0.5 ? p.ink : p.mute, lw: 1.3, r: 3, dash: [3, 3] });
        for (let k = 1; k < parts; k++) { const xx = b.x + (b.w * k) / parts; d.line(xx, b.y + 4 * u, xx, b.y + b.h - 4 * u, p.mute, 1, [2, 2]); }
      } else d.rect(b.x, b.y, b.w, b.h, { fill: alpha(t.c, 0.13 + 0.12 * (i % 2) + 0.4 * hi), stroke: hi > 0.5 ? p.ink : t.c, lw: 1.3 + 1.2 * hi, r: 3 });
      if (warn > 0) d.rect(b.x - 2 * u, b.y - 2 * u, b.w + 4 * u, b.h + 4 * u, { stroke: er.c, lw: 2, r: 4, dash: [4, 3], a: warn });
      d.text(labels[i], b.x + b.w / 2, b.y + b.h / 2 + 0.5 * u, { size: L.size, weight: 600, font: 'mono', color: warn > 0.5 ? er.ink : raw ? p.ink2 : hi > 0.5 ? p.ink : t.ink, align: 'center', base: 'middle' });
      if (o.ids) d.text(String(o.ids[i] ?? ''), b.x + b.w / 2, b.y + b.h + 3 * u, { size: 12, font: 'mono', weight: 500, color: p.ink2, align: 'center', base: 'top', a: o.idsA ?? 1 });
    });
  });
  return { ...L, boxes, truncated };
}

/** Bloques de un texto tokenizado con el juguete: los bytes sueltos que juntos forman una letra se agrupan en un solo bloque punteado. */
export function toyItems(toks: Tok[]): { labels: string[]; parts: number[]; count: number } {
  const labels: string[] = [], parts: number[] = [];
  const dec = new TextDecoder('utf-8', { fatal: true });
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.text !== null) { labels.push(t.text.replace(/ /g, '·').replace(/\n/g, '↵')); parts.push(1); continue; }
    let j = i, bytes: number[] = [], txt: string | null = null;
    while (j < toks.length && j < i + 4) { bytes = bytes.concat(toks[j].bytes); try { txt = dec.decode(new Uint8Array(bytes)); break; } catch { j++; } }
    if (txt === null) { labels.push(t.bytes.map((b) => String(b)).join(' ')); parts.push(1); continue; }
    labels.push(txt.replace(/ /g, '·')); parts.push(j - i + 1); i = j;
  }
  return { labels, parts, count: toks.length };
}

/** Insignia con un conteo («10 tokens»), alineada a la derecha. */
export function countTag(S: Frame, str: string, x: number, y: number, t: Tone, o: { a?: number; align?: CanvasTextAlign } = {}) {
  const c = tone(S, t);
  return S.d.tag(str, x, y, { color: c.ink, fill: c.soft, stroke: c.c, align: o.align ?? 'right', font: 'mono', size: 12, a: o.a });
}

/** Lectura grande con rótulo; `hot` 0..1 la enmarca. */
export function bigReadout(S: Frame, x: number, y: number, w: number, label: string, value: string, t: Tone, o: { size?: number; hot?: number; a?: number } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, t), size = o.size ?? 26;
  d.withAlpha(o.a ?? 1, () => {
    const hot = o.hot ?? 0;
    if (hot > 0) d.rect(x - 6 * u, y - 6 * u, w + 4 * u, (size + 30) * u, { fill: alpha(c.c, 0.08 * hot), stroke: c.c, lw: 1.5, r: 4, a: hot });
    fitText(S, label, x, y, w - 4 * u, { size: 12, weight: 700, color: p.mute });
    d.text(value, x, y + 17 * u, { size, weight: 700, font: 'mono', color: c.ink, base: 'top' });
  });
}

/** Flecha vertical corta. */
export function downArrow(S: Frame, x: number, y1: number, y2: number, a = 1) {
  if (a <= 0 || y2 - y1 < 4) return;
  S.d.arrow(x, y1, x, y2, S.pal.ink2, 1.6, 7, a);
}
