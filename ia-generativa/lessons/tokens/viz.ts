// Dibujo de tokens para la lección «Tokens»: filas de bloques con ajuste de línea, número de token debajo, y bloques «crudos»
// (bytes sueltos) con borde punteado. Todo se pide al kit por rol de color; nada de hex.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { show, type Tok } from './bpe';

export interface Box { x: number; y: number; w: number; h: number; i: number }

export interface TokOpts {
  /** Tamaño de letra máximo; baja hasta `minSize` si no cabe en `rect.h`. */
  size?: number;
  minSize?: number;
  /** Número de token bajo cada bloque. */
  ids?: boolean;
  tone?: Tone;
  /** Resalta ciertos bloques (borde grueso). */
  hi?: (i: number) => boolean;
  /** Atenúa ciertos bloques. */
  dim?: (i: number) => boolean;
  /** Marca (borde punteado de error) ciertos bloques: lo que está fuera de la lista. */
  warn?: (i: number) => boolean;
  /** Opacidad de la fila de números. */
  idsA?: number;
  /** Cuántos bloques se muestran (fraccionario = aparición progresiva). */
  show?: number;
  a?: number;
  gap?: number;
  /** Etiquetas y marcas «crudo» alternativas (si no se pasan, salen de los tokens). */
  labels?: string[];
  raws?: boolean[];
  /** Números alternativos para mostrar bajo los bloques. */
  idList?: (number | string)[];
}

interface Laid { boxes: Box[]; h: number; rows: number; size: number; bh: number; idH: number }

/** Reparte los bloques en filas dentro de `w` px. Todas las medidas en px de pantalla. */
function layout(S: Frame, labels: string[], w: number, size: number, ids: boolean, gap: number): Laid {
  const u = S.u, d = S.d, pad = 5 * u, bh = (size + 11) * u, idH = ids ? 15 * u : 0, rowH = bh + idH + gap;
  const boxes: Box[] = [];
  let x = 0, y = 0, rows = 1;
  labels.forEach((l, i) => {
    const bw = Math.max(bh * 0.72, d.measure(l, { size, weight: 600, font: 'mono' }) + 2 * pad);
    if (x > 0 && x + bw > w) { x = 0; y += rowH; rows++; }
    boxes.push({ x, y, w: bw, h: bh, i });
    x += bw + gap;
  });
  return { boxes, h: rows * rowH - gap, rows, size, bh, idH };
}

/** Dibuja una fila de tokens que cabe en `rect`. Devuelve las cajas (en coordenadas absolutas) y la altura usada. */
export function drawTokens(S: Frame, toks: Tok[] | null, rect: Rect, o: TokOpts = {}) {
  const { d, pal: p } = S, u = S.u, gap = (o.gap ?? 4) * u;
  const labels = o.labels ?? toks!.map((t) => show(t).label);
  const raws = o.raws ?? toks!.map((t) => show(t).raw);
  const idList = o.idList ?? toks?.map((t) => t.id) ?? [];
  let size = o.size ?? 14, L = layout(S, labels, rect.w, size, !!o.ids, gap);
  const minSize = o.minSize ?? 12;
  while (L.h > rect.h && size > minSize) { size -= 1; L = layout(S, labels, rect.w, size, !!o.ids, gap); }
  const t = tone(S, o.tone ?? 'lat'), n = labels.length, shown = o.show ?? n;
  const out: Box[] = [];
  let truncated = false;
  L.boxes.forEach((b, i) => {
    const bx = rect.x + b.x, by = rect.y + b.y;
    out.push({ ...b, x: bx, y: by });
    if (by + b.h > rect.y + rect.h + 0.5) { truncated = true; return; }
    const a = clamp(shown - i) * (o.a ?? 1) * (o.dim?.(i) ? 0.3 : 1);
    if (a <= 0) return;
    const hi = !!o.hi?.(i), raw = raws[i], warn = !!o.warn?.(i), er = tone(S, 'err');
    d.withAlpha(a, () => {
      if (warn) d.rect(bx, by, b.w, b.h, { fill: alpha(er.c, 0.12), stroke: er.c, lw: 1.6, r: 3, dash: [4, 3] });
      else if (raw) d.rect(bx, by, b.w, b.h, { fill: alpha(p.mute, 0.12), stroke: p.mute, lw: 1.3, r: 3, dash: [3, 3] });
      else d.rect(bx, by, b.w, b.h, { fill: alpha(t.c, hi ? 0.55 : i % 2 ? 0.3 : 0.14), stroke: hi ? p.ink : t.c, lw: hi ? 2.6 : 1.3, r: 3 });
      d.text(labels[i], bx + b.w / 2, by + b.h / 2, { size, weight: 600, font: 'mono', color: warn ? er.ink : raw ? p.mute : hi ? p.ink : t.ink, align: 'center', base: 'middle' });
      if (o.ids) d.text(String(idList[i] ?? ''), bx + b.w / 2, by + b.h + 2 * u, { size: 12, font: 'mono', color: p.mute, align: 'center', base: 'top', a: o.idsA });
    });
  });
  return { boxes: out, h: Math.min(L.h, rect.h), size, truncated, rows: L.rows };
}

/** Altura que ocuparía una fila de tokens (sin dibujar). */
export function tokensHeight(S: Frame, toks: Tok[] | null, w: number, o: TokOpts = {}): number {
  const labels = o.labels ?? toks!.map((t) => show(t).label), u = S.u;
  return layout(S, labels, w, o.size ?? 14, !!o.ids, (o.gap ?? 4) * u).h;
}

/** Texto corto con ajuste de línea; devuelve la altura que ocupa. */
export function note(S: Frame, text: string, x: number, y: number, w: number, o: { size?: number; color?: string; weight?: number; align?: CanvasTextAlign; a?: number } = {}) {
  return S.d.text(text, x, y, { size: o.size ?? 12, weight: o.weight ?? 600, color: o.color ?? S.pal.mute, w, align: o.align, base: 'top', a: o.a }).h;
}

/** Etiqueta de carril: rótulo a la izquierda y, si se pide, una insignia con un conteo a la derecha. */
export function laneLabel(S: Frame, label: string, x: number, y: number, w: number, o: { badge?: string; tone?: Tone; a?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.text(label, x, y, { size: 13, weight: 700, color: o.tone ? t.ink : p.ink2, base: 'top' });
    if (o.badge) d.tag(o.badge, x + w, y + 8 * u, { color: t.ink, fill: t.soft, stroke: t.c, align: 'right', font: 'mono', size: 12 });
  });
  return 20 * u;
}
