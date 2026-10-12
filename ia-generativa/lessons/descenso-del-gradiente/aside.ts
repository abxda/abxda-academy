// Columna lateral (escritorio) o franja inferior (teléfono): celdas apiladas en lugares fijos.
// Cada celda trae su opacidad; una celda invisible conserva su lugar, así nada salta cuando aparece otra.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { fz, hist, kk } from './helpers';

export interface Ro { name: string; value: string; tone?: Tone; a?: number; hl?: number }
export interface FormulaPart { sym: string; word: string; tone?: Tone }
export type Cell =
  | { k: 'ro'; items: Ro[]; cols?: number }
  | { k: 'text'; text: string; tone?: Tone; mono?: boolean; a?: number; lines?: number }
  | { k: 'table'; rows: [number, number][]; show: number[]; hl?: number; hlA?: number; a?: number }
  | { k: 'formula'; parts: FormulaPart[]; rev: number[]; hot: number[]; a?: number }
  | { k: 'hist'; vals: number[]; n: number; max: number; title: string; a?: number; opt?: boolean }
  | { k: 'swatch'; lo: string; hi: string; a?: number }
  | { k: 'gap'; h: number };

/** Una lectura: rótulo pequeño y valor grande. */
function readout(S: Frame, x: number, y: number, w: number, r: Ro) {
  const { d, pal: p } = S, k = kk(S), t = r.tone ? tone(S, r.tone) : null;
  d.withAlpha(r.a ?? 1, () => {
    if ((r.hl ?? 0) > 0.01) d.rect(x - 5 * k, y - 4 * k, w - 4 * k, 46 * k, { fill: alpha(t ? t.c : p.ink, 0.1), stroke: t ? t.c : p.ink, lw: 2, r: 4, a: r.hl });
    d.text(r.name, x, y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.text(r.value, x, y + 15 * k, { size: fz(S, 20), weight: 700, font: 'mono', color: t ? t.ink : p.ink, base: 'top' });
  });
}

const fmt1 = (S: Frame, v: number) => S.n(v, Number.isInteger(v) ? 0 : 1).replace('-', '−');

/** Dibuja las celdas de arriba abajo dentro de A. Devuelve la altura usada. */
export function flow(S: Frame, A: Rect, cells: Cell[], a = 1) {
  const { d, pal: p } = S, k = kk(S), gap = 9 * k;
  let y = A.y;
  d.withAlpha(a, () => {
    for (const c of cells) {
      if (c.k === 'gap') { y += c.h * k; continue; }
      if (c.k === 'ro') {
        const cols = c.cols ?? (S.portrait ? Math.min(4, c.items.length) : 2), cw = A.w / cols;
        c.items.forEach((it, i) => readout(S, A.x + (i % cols) * cw + 4 * k, y + Math.floor(i / cols) * 50 * k, cw, it));
        y += Math.ceil(c.items.length / cols) * 50 * k + gap * 0.3;
      } else if (c.k === 'text') {
        const size = fz(S, 13), col = c.tone ? tone(S, c.tone).ink : p.ink2;
        const r = d.text(c.text, A.x + 4 * k, y, { size, weight: c.mono ? 700 : 600, font: c.mono ? 'mono' : 'ui', color: col, w: A.w - 8 * k, base: 'top', a: c.a });
        y += Math.max(r.h, (c.lines ?? 0) * size * S.u * 1.3) + gap * 0.6;
      } else if (c.k === 'table') {
        y += table(S, { x: A.x + 4 * k, y, w: A.w - 8 * k, h: A.y + A.h - y }, c) + gap;
      } else if (c.k === 'formula') {
        y += formula(S, A.x + 4 * k, y, A.w - 8 * k, c) + gap;
      } else if (c.k === 'hist') {
        const h = 58 * k;
        if (c.opt && y + h > A.y + A.h + 2) continue;
        y += hist(S, A.x + 4 * k, y, A.w - 8 * k, c.vals, { n: c.n, max: c.max, title: c.title, a: c.a, h }) + gap;
      } else if (c.k === 'swatch') {
        d.withAlpha(c.a ?? 1, () => {
          const n = 8, sw = Math.min(16 * k, (A.w - 140 * k) / n), lw = d.measure(c.lo, { size: fz(S, 12), weight: 600 }) + 8 * k, x0 = A.x + 4 * k + lw;
          d.text(c.lo, A.x + 4 * k, y + 8 * k, { size: fz(S, 12), weight: 600, color: p.ink2, base: 'middle' });
          for (let i = 0; i < n; i++) d.rect(x0 + i * sw, y, sw, 16 * k, { fill: alpha(tone(S, 'err').c, 0.03 + 0.11 * Math.sqrt(i / (n - 1))) });
          d.rect(x0, y, n * sw, 16 * k, { stroke: p.line, lw: 1 });
          d.text(c.hi, x0 + n * sw + 8 * k, y + 8 * k, { size: fz(S, 12), weight: 600, color: p.ink2, base: 'middle' });
        });
        y += 16 * k + gap;
      }
    }
  });
  return y - A.y;
}

/** La tabla «peso → error» de los puntos de muestra: lista en escritorio, dos renglones en teléfono. */
function table(S: Frame, r: Rect, c: Extract<Cell, { k: 'table' }>) {
  const { d, pal: p } = S, k = kk(S), size = fz(S, 13), wt = tone(S, 'w'), er = tone(S, 'err');
  let used = 0;
  d.withAlpha(c.a ?? 1, () => {
    if (!S.portrait) {
      const lh = Math.min(22 * k, (r.h - 22 * k) / (c.rows.length + 0.5));
      d.text(S.l('peso → error', 'weight → error'), r.x, r.y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
      c.rows.forEach(([w, e], i) => {
        const y = r.y + 22 * k + i * lh, a = c.show[i] ?? 0;
        if (a < 0.01) return;
        d.withAlpha(a, () => {
          if (c.hl === i && (c.hlA ?? 1) > 0.01) d.rect(r.x - 4 * k, y - 3 * k, Math.min(r.w, 150 * k), lh, { fill: alpha(tone(S, 'dat').c, 0.18), stroke: tone(S, 'dat').c, lw: 1.5, r: 3, a: c.hlA ?? 1 });
          d.text(fmt1(S, w), r.x + 30 * k, y, { size, weight: 700, font: 'mono', color: wt.ink, align: 'right', base: 'top' });
          d.text('→', r.x + 44 * k, y, { size, weight: 600, font: 'mono', color: p.mute, base: 'top' });
          d.text(fmt1(S, e), r.x + 70 * k, y, { size, weight: 700, font: 'mono', color: er.ink, base: 'top' });
        });
      });
      used = 22 * k + c.rows.length * lh;
    } else {
      const lw = Math.max(d.measure(S.l('peso', 'weight'), { size: fz(S, 12), weight: 700 }), d.measure('error', { size: fz(S, 12), weight: 700 })) + 8 * k;
      const cw = (r.w - lw) / c.rows.length, rh = 22 * k;
      d.text(S.l('peso', 'weight'), r.x, r.y + rh / 2, { size: fz(S, 12), weight: 700, color: wt.ink, base: 'middle' });
      d.text('error', r.x, r.y + rh * 1.5, { size: fz(S, 12), weight: 700, color: er.ink, base: 'middle' });
      c.rows.forEach(([w, e], i) => {
        const x = r.x + lw + i * cw + cw / 2, a = c.show[i] ?? 0;
        if (a < 0.01) return;
        d.withAlpha(a, () => {
          if (c.hl === i && (c.hlA ?? 1) > 0.01) d.rect(x - cw / 2 + 1, r.y, cw - 2, rh * 2, { fill: alpha(tone(S, 'dat').c, 0.18), stroke: tone(S, 'dat').c, lw: 1.5, r: 3, a: c.hlA ?? 1 });
          d.text(fmt1(S, w), x, r.y + rh / 2, { size: fz(S, 12), weight: 700, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
          d.text(fmt1(S, e), x, r.y + rh * 1.5, { size: fz(S, 12), weight: 700, font: 'mono', color: er.ink, align: 'center', base: 'middle' });
        });
      });
      used = rh * 2;
    }
  });
  return used;
}

/** La regla en dos renglones: con símbolos (w ← w − η × pendiente) y, debajo, en palabras. Cada pieza aparece y se resalta por separado. */
function formula(S: Frame, x: number, y: number, w: number, c: Extract<Cell, { k: 'formula' }>) {
  const { d, pal: p } = S, k = kk(S);
  let big = fz(S, 18);
  const symW = () => c.parts.reduce((s, q) => s + d.measure(q.sym, { size: big, weight: 700, font: 'mono' }), 0);
  while (symW() > w && big > 12 / S.u) big -= 0.5;
  const small = fz(S, 12.5), lh1 = big * S.u * 1.35, lh2 = small * S.u * 1.4;
  const col = (q: FormulaPart) => (q.tone ? tone(S, q.tone).ink : p.ink2);
  const hotBox = (bx0: number, by: number, bw0: number, bh: number, q: FormulaPart, h: number, size: number, mono: boolean) => {
    // el recuadro abraza solo el símbolo, sin los espacios que lo rodean
    const tr = d.measure(q.sym.trim(), { size, weight: mono ? 700 : 600, font: mono ? 'mono' : 'ui' }) + 2 * k;
    const bw = Math.min(bw0, tr), bx = bx0 + (bw0 - bw) / 2;
    if (h > 0.01) d.rect(bx - 3 * k, by - 2 * k, bw + 6 * k, bh, { fill: q.tone ? alpha(tone(S, q.tone).c, 0.2 * h) : undefined, stroke: q.tone ? tone(S, q.tone).c : p.ink, lw: q.tone ? 1.5 : 2, r: 3, a: h });
  };
  let lines2 = 1;
  d.withAlpha(c.a ?? 1, () => {
    // renglón 1: símbolos
    let cx = x;
    c.parts.forEach((q, i) => {
      const tw = d.measure(q.sym, { size: big, weight: 700, font: 'mono' }), a = c.rev[i] ?? 1;
      if (a > 0.01) {
        hotBox(cx, y, tw, lh1, q, (c.hot[i] ?? 0) * a, big, true);
        d.text(q.sym, cx, y + lh1 * 0.08, { size: big, weight: 700, font: 'mono', color: col(q), base: 'top', a });
      }
      cx += tw;
    });
    // renglón 2: en palabras, con ajuste de línea por pieza
    let wx = x, wy = y + lh1 + 4 * k;
    c.parts.forEach((q, i) => {
      const txt = q.word, tw = d.measure(txt, { size: small, weight: 600 }), a = c.rev[i] ?? 1;
      if (wx + tw > x + w && wx > x) { wx = x; wy += lh2; lines2++; }
      if (a > 0.01) {
        hotBox(wx, wy, tw, lh2, { ...q, sym: q.word }, (c.hot[i] ?? 0) * a, small, false);
        d.text(txt, wx, wy + lh2 * 0.1, { size: small, weight: 600, color: col(q), base: 'top', a });
      }
      wx += tw;
    });
  });
  return lh1 + 4 * k + lines2 * lh2;
}
