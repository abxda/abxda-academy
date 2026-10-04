// Piezas de dibujo compartidas por los actos de preferencias, refuerzo y DPO: tarjetas de respuesta, pesos del modelo de recompensa,
// barras de probabilidad por rasgo y el reparto de actos encadenados.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, TRAIT_KEYS, card, fitText, glyph, mark, para, sgn, traitName, traitTone } from './ui';
import type { Answer } from './pairs';
import { Q_REF } from './toy';

/** Sub-escenas encadenadas: cada una se ve desde el inicio de su segmento hasta el de la siguiente, con un fundido cruzado. */
export interface Phase { from: string; draw: (S: Frame) => void }
export function phases(S: Frame, items: Phase[], until: string | null, fade = 0.7) {
  items.forEach((it, i) => {
    const next = i + 1 < items.length ? items[i + 1].from : until;
    const aIn = i === 0 ? 1 : S.at(it.from, 0, fade), aOut = next ? 1 - S.at(next, 0, fade) : 1;
    const a = aIn * aOut;
    if (a > 0.004) S.d.withAlpha(a, () => it.draw(S));
  });
}

export const pct = (S: Frame, v: number, digits = 0) => S.n(v * 100, digits) + ' %';

/** Tarjeta con una respuesta, su letra, sus rasgos (glifos) y, opcionalmente, una marca (elegida/rechazada) o una puntuación. */
export function answerCard(S: Frame, r: Rect, ans: Answer, o: { label?: string; size?: number; state?: 'yes' | 'no' | null; stateA?: number; hot?: number; a?: number; traits?: boolean; score?: number; scoreA?: number; maxLines?: number } = {}) {
  const { d, pal: p } = S, u = S.u, pad = 9 * u;
  const size = o.size ?? FS(S, 15), lh = 1.28 * size * u;
  const showT = o.traits !== false, tH = showT ? 24 * u : 0;
  d.withAlpha(o.a ?? 1, () => {
    card(S, r, { tone: o.state === 'yes' ? 'dat' : o.state === 'no' ? 'err' : 'ink', fill: p.surface, hot: o.hot, lw: o.state ? 2.2 : 1.5 });
    const lr = 9 * u;
    if (o.label) {
      d.circle(r.x + pad + lr, r.y + pad + lr, lr, { stroke: p.ink2, lw: 1.5 });
      d.text(o.label, r.x + pad + lr, r.y + pad + lr + 0.5, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle' });
    }
    const tx = r.x + pad + (o.label ? 2 * lr + 8 * u : 0), tw = r.x + r.w - pad - tx - 24 * u;
    const maxLines = o.maxLines ?? Math.max(1, Math.floor((r.h - 2 * pad - tH) / lh));
    para(S, ans[S.lang], tx, r.y + pad, tw, size, { weight: 600, maxLines, lh: 1.28 });
    if (showT) {
      const y = r.y + r.h - pad - 8 * u;
      let x = r.x + pad + 8 * u, n = 0;
      TRAIT_KEYS.forEach((k, i) => { if (ans.phi[i]) { glyph(S, k, x, y, 8 * u); x += 24 * u; n++; } });
      if (!n) d.text(S.l('sin rasgos', 'no traits'), r.x + pad, y, { size: FS(S, 12), weight: 600, color: p.mute, base: 'middle' });
    }
    if (o.state) mark(S, o.state, r.x + r.w - pad - 10 * u, r.y + pad + 10 * u, 10 * u, o.stateA ?? 1);
    if (o.score !== undefined) {
      const t = tone(S, 'w');
      d.withAlpha(o.scoreA ?? 1, () => d.tag(S.l('puntos ', 'score ') + sgn(S, o.score!, 2).replace('+', ''), r.x + r.w - pad, r.y + r.h - pad - 8 * u, { color: t.ink, stroke: t.c, size: FS(S, 12), align: 'right', weight: 700 }));
    }
  });
}

/** Los cuatro pesos del modelo de recompensa: glifo, nombre, barra divergente (continua = suma, punteada = resta) y valor. */
export function weightRows(S: Frame, r: Rect, w: number[], o: { a?: number; max?: number; rowH?: number; k?: number; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, rowH = o.rowH ?? Math.min(34 * u, r.h / 4), max = o.max ?? 3.2, k = clamp(o.k ?? 1);
  const size = FS(S, 14);
  const nameW = Math.max(...TRAIT_KEYS.map((t) => d.measure(traitName(S, t), { size, weight: 700 })));
  const valW = d.measure('−0,00', { size, weight: 700, font: 'mono' });
  const gx = r.x + 10 * u + 6 * u, nx = r.x + 30 * u;
  const bx0 = nx + nameW + 12 * u, bx1 = r.x + r.w - valW - 14 * u;
  const cx = (bx0 + bx1) / 2, half = Math.max(10, (bx1 - bx0) / 2);
  d.withAlpha(o.a ?? 1, () => {
    d.line(cx, r.y + 2 * u, cx, r.y + 4 * rowH - 2 * u, p.lineStrong, 1.5);
    TRAIT_KEYS.forEach((t, i) => {
      const y = r.y + i * rowH + rowH / 2, c = tone(S, traitTone(t)), v = (w[i] ?? 0) * k, len = clamp(Math.abs(v) / max) * half, bh = Math.min(14 * u, rowH * 0.5);
      glyph(S, t, gx, y, 8 * u);
      d.text(traitName(S, t), nx, y, { size, weight: 700, color: p.ink, base: 'middle' });
      if (v >= 0) d.rect(cx, y - bh / 2, len, bh, { fill: c.c });
      else d.rect(cx - len, y - bh / 2, len, bh, { fill: alpha(c.c, 0.18), stroke: c.c, lw: 1.8, dash: [4, 3] });
      d.text(sgn(S, v, 1), r.x + r.w - 4 * u, y, { size, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    });
  });
}

/** Barra dividida A / B con la probabilidad de que gane A. */
export function splitBar(S: Frame, r: Rect, pA: number, o: { a?: number; unknown?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, 'w'), wA = r.w * clamp(pA), size = FS(S, 14);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2, stroke: t.c, lw: 1.5 });
    d.rect(r.x, r.y, wA, r.h, { fill: alpha(t.c, 0.85) });
    d.line(r.x + r.w / 2, r.y - 3, r.x + r.w / 2, r.y + r.h + 3, p.ink, 1.5, [3, 3]);
    d.text('A ' + pct(S, pA), r.x + 8 * S.u, r.y + r.h / 2, { size, weight: 800, color: pA > 0.3 ? S.pal.stage : t.ink, base: 'middle' });
    d.text('B ' + pct(S, 1 - pA), r.x + r.w - 8 * S.u, r.y + r.h / 2, { size, weight: 800, color: t.ink, base: 'middle', align: 'right' });
  });
}

/** Fila de rasgo con barra de probabilidad y marca de referencia (la del modelo de partida). */
export function traitBar(S: Frame, r: Rect, k: number, v: number, o: { ghost?: number; a?: number; nameW?: number } = {}) {
  const { d, pal: p } = S, u = S.u, key = TRAIT_KEYS[k], c = tone(S, traitTone(key));
  const ghost = o.ghost ?? Q_REF[k], size = FS(S, 13);
  d.withAlpha(o.a ?? 1, () => {
    glyph(S, key, r.x + 8 * u, r.y + r.h / 2, 7.5 * u);
    fitText(S, traitName(S, key), r.x + 22 * u, r.y + r.h / 2, o.nameW ?? 90 * u, size, { weight: 700, color: p.ink, base: 'middle' });
    const bx = r.x + 24 * u + (o.nameW ?? 90 * u), bw = r.w - (bx - r.x) - 46 * u, bh = Math.min(11 * u, r.h * 0.5), by = r.y + r.h / 2 - bh / 2;
    d.rect(bx, by, bw, bh, { fill: p.surface2 });
    d.rect(bx, by, bw * clamp(v), bh, { fill: c.c });
    const gx = bx + bw * clamp(ghost);
    d.line(gx, by - 3, gx, by + bh + 3, p.ink, 2);
    d.text(pct(S, v), r.x + r.w - 2 * u, r.y + r.h / 2, { size, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
  });
}

/** Tabla de los cuatro rasgos con dos columnas de barras (p. ej. con correa / sin correa, o RLHF / DPO). Devuelve la geometría para anotar encima. */
export function compareTable(S: Frame, r: Rect, o: { heads: { title: string; sub?: string; t?: Tone; a: number }[]; cols: number[][]; aNames?: number; gap?: number; foot?: number }) {
  const { d, pal: p } = S, u = S.u, W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2, nameW = (S.portrait ? 108 : 128) * u, gap = (o.gap ?? 14) * u, colW = (W - nameW - gap) / 2;
  const head = 46 * u, foot = (o.foot ?? 40) * u, rowH = Math.min(58 * u, (r.h - head - foot) / 4), tableH = head + 4 * rowH, y0 = r.y + Math.max(0, (r.h - tableH - foot) / 2);
  const col = (i: number) => X + nameW + i * (colW + gap), bw = colW - 46 * u;
  o.heads.forEach((h, i) => d.withAlpha(h.a, () => {
    const c = tone(S, h.t ?? 'ink');
    fitText(S, h.title, col(i), y0 + 6 * u, colW, 16, { weight: 800, color: h.t ? c.ink : p.ink, base: 'top' });
    if (h.sub) fitText(S, h.sub, col(i), y0 + 27 * u, colW, 12, { weight: 600, color: p.mute, base: 'top' });
  }));
  TRAIT_KEYS.forEach((k, i) => {
    const cy = y0 + head + i * rowH + rowH / 2, c = tone(S, traitTone(k)), bh = Math.min(13 * u, rowH * 0.4);
    d.withAlpha(o.aNames ?? 1, () => { glyph(S, k, X + 8 * u, cy, 8 * u); fitText(S, traitName(S, k), X + 24 * u, cy, nameW - 26 * u, 14, { weight: 700, color: p.ink, base: 'middle' }); });
    o.cols.forEach((m, j) => d.withAlpha(o.heads[j].a, () => {
      const bx = col(j);
      d.rect(bx, cy - bh / 2, bw, bh, { fill: p.surface2 });
      d.rect(bx, cy - bh / 2, bw * clamp(m[i]), bh, { fill: c.c });
      const gx = bx + bw * Q_REF[i];
      d.line(gx, cy - bh / 2 - 3, gx, cy + bh / 2 + 3, p.ink, 2);
      d.text(pct(S, m[i]), bx + bw + 6 * u, cy, { size: FS(S, 13), weight: 700, font: 'mono', color: c.ink, base: 'middle' });
    }));
  });
  return { X, W, y0, rowH, head, bottom: y0 + tableH, col, colW, bw };
}

/** Título grande con subtítulo: en una línea si cabe; si no, el subtítulo pasa debajo. Devuelve la altura usada. */
export function banner(S: Frame, r: Rect, big: string, sub: string, a = 1): number {
  const { d, pal: p } = S, u = S.u, bs = S.portrait || S.H < 360 ? 22 : 28, bw = d.measure(big, { size: bs, weight: 800 }) + 12 * u;
  const ss = FS(S, 14), sw = d.measure(sub, { size: ss, weight: 600 }), same = bw + sw <= r.w;
  let h = bs * 1.25 * u;
  d.withAlpha(a, () => {
    d.text(big, r.x, r.y + 2 * u, { size: bs, weight: 800, color: p.ink, base: 'top' });
    if (same) d.text(sub, r.x + bw, r.y + 2 * u + (bs * u - ss * u) * 0.75, { size: ss, weight: 600, color: p.ink2, base: 'top' });
    else h += para(S, sub, r.x, r.y + h + 2 * u, r.w, ss, { weight: 600, color: p.ink2, maxLines: 2 });
  });
  return h;
}
