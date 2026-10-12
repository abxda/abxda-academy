// Columna lateral (escritorio) o franja inferior (teléfono): una lista de «celdas» que se acomodan solas.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { score, type Model } from './data';
import { chip, equation, fz, gauge, groupBars, kk, legend, lock, num, readout, signed, type BarRow } from './helpers';

export type Cell =
  | { k: 'ro'; name: string; value: string; tone?: Tone; a?: number }
  | { k: 'gauge'; name: string; f: number; text: string; tone: Tone; marks?: { f: number; text: string; tone?: Tone }[] }
  | { k: 'text'; text: string; tone?: Tone; mono?: boolean; a?: number }
  | { k: 'legend'; fresh?: boolean; ring?: boolean; counts?: boolean }
  | { k: 'chips'; m: Model; hot?: number; lock?: boolean }
  | { k: 'lockText'; text: string; a?: number }
  | { k: 'eq'; rev?: [number, number, number]; blanks?: boolean; vals?: Model; hot?: [number, number, number] }
  | { k: 'bars'; rows: BarRow[]; seen: string; fresh: string }
  | { k: 'arith'; m: Model; l: number; c: number; a?: number; res?: number };

/** Dibuja las celdas de arriba abajo. En vertical, las lecturas cortas (`ro`) se reparten en tres columnas. */
export function flow(S: Frame, A: Rect, cells: Cell[], a = 1) {
  const { d, pal: p } = S, k = kk(S), cols = S.portrait ? 3 : 1, gap = 8 * k;
  let y = A.y, row: Extract<Cell, { k: 'ro' }>[] = [];
  const flush = () => {
    if (!row.length) return;
    const cw = A.w / cols;
    row.forEach((c, i) => d.withAlpha(c.a ?? 1, () => readout(S, A.x + i * cw, y, c.name, c.value, c.tone ?? 'ink', cw - 6 * k)));
    y += 46 * k; row = [];
  };
  d.withAlpha(a, () => {
    for (const c of cells) {
      if (c.k === 'ro') { row.push(c); if (row.length >= cols) flush(); continue; }
      flush();
      if (c.k === 'gauge') y += gauge(S, { x: A.x, y, w: A.w, h: 0 }, c.name, c.f, c.text, c.tone, c.marks) + gap * 0.5;
      else if (c.k === 'text') {
        const size = fz(S, 13), t = c.tone ? tone(S, c.tone).ink : p.ink2;
        const r = d.text(c.text, A.x, y, { size, weight: c.mono ? 700 : 600, font: c.mono ? 'mono' : 'ui', color: t, w: A.w, base: 'top', a: c.a });
        y += r.h + gap;
      } else if (c.k === 'legend') y += legend(S, A.x, y, A.w, c) + gap * 0.5;
      else if (c.k === 'lockText') {
        const cell = 2.4 * k;
        d.withAlpha(c.a ?? 1, () => { lock(S, A.x, y, cell); d.text(c.text, A.x + 8 * cell + 8 * k, y + 4 * cell, { size: fz(S, 13), weight: 700, color: p.ink2, base: 'middle' }); });
        y += 8 * cell + gap;
      } else if (c.k === 'eq') y += equation(S, A.x, y, A.w, { reveal: c.rev, blanks: c.blanks, vals: c.vals, hot: c.hot }) + gap;
      else if (c.k === 'bars') y += groupBars(S, { x: A.x, y, w: A.w, h: 0 }, c.rows, { seenLabel: c.seen, freshLabel: c.fresh }) + gap * 0.5;
      else if (c.k === 'chips') {
        const lw = c.lock ? 30 * k : 0, cw = (A.w - lw - 2 * 6 * k) / 3, h = 44 * k;
        if (c.lock) { lock(S, A.x + 2 * k, y + (h - 8 * 3.4 * k) / 2, 3.4 * k); }
        ([['w₁', c.m.w1], ['w₂', c.m.w2], ['b', c.m.b]] as [string, number][]).forEach(([nm, v], i) => chip(S, { x: A.x + lw + i * (cw + 6 * k), y, w: cw, h }, nm, v, { hot: c.hot === i }));
        y += h + gap;
      } else if (c.k === 'arith') {
        const s = score(c.m, c.l, c.c), spam = s > 0, size = fz(S, 13);
        const line = `${num(S, c.m.w1)}×${c.l} + ${num(S, c.m.w2)}×${S.n(c.c, c.c % 1 ? 1 : 0)} ${c.m.b < 0 ? '−' : '+'} ${num(S, Math.abs(c.m.b))}`;
        const r1 = d.text(line, A.x, y, { size, weight: 600, font: 'mono', color: tone(S, 'w').ink, w: A.w, base: 'top', a: c.a });
        y += r1.h + 2 * k;
        const t = tone(S, spam ? 'err' : 'dat'), ra = (c.a ?? 1) * (c.res ?? 1);
        if (ra < 0.01) { y += 30 * k; continue; }
        d.text(`= ${signed(S, s)}`, A.x, y, { size: fz(S, 17), weight: 800, font: 'mono', color: p.ink, base: 'top', a: ra });
        const vx = A.x + d.measure(`= ${signed(S, s)}  `, { size: fz(S, 17), weight: 800, font: 'mono' });
        d.withAlpha(ra, () => {
          const label = spam ? 'spam' : S.l('normal', 'legit');
          const tw = d.measure(label, { size: fz(S, 14), weight: 800 }) + 14 * k;
          d.rect(vx, y - 1, tw, 24 * k, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 1.5, r: 3 });
          d.text(label, vx + tw / 2, y + 11 * k, { size: fz(S, 14), weight: 800, color: t.ink, align: 'center', base: 'middle' });
        });
        y += 30 * k;
      }
    }
    flush();
  });
  return y - A.y;
}
