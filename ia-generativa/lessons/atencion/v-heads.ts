// Vista 6 (heads … honest): varias cabezas, con mapas REALES de BERT leyendo «Me senté en el banco de mi jardín.» /
// "I sat on the bank of the river." (real-data.ts, generado por real-attention.py). Cuatro cabezas elegidas por lo claro de
// su patrón: la de «banco» (que también se ve con la otra frase), la palabra anterior, la siguiente y las marcas.
import { alpha, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REAL, type HeadKind } from './real-data';
import { setHead, stOf, swap } from './state';
import { area, attArc, chip, drawGrid, fitText, fr, fz, gridGeom, isShort, label, layoutChips, pct, placeRow, q, tagNote, tokLabel } from './ui';

const NAME: Record<HeadKind, [string, string]> = { ctx: ['sentido', 'meaning'], prev: ['anterior', 'previous'], next: ['siguiente', 'next'], marks: ['marcas', 'marks'] };
const DESC = (S: Frame, k: HeadKind) => {
  const R = REAL[S.lang], w = R.words.A;
  switch (k) {
    case 'ctx': return S.l(`${q(S, w[R.q.A])} mira sobre todo a ${q(S, w[R.ctx.A])}`, `${q(S, w[R.q.A])} looks mostly at ${q(S, w[R.ctx.A])}`);
    case 'prev': return S.l('cada palabra mira a la anterior', 'each word looks at the previous one');
    case 'next': return S.l('cada palabra mira a la siguiente', 'each word looks at the next one');
    default: return S.l('casi todo va a las marcas', 'almost everything goes to the marks');
  }
};
/** Cuándo se nombra cada cabeza (y aparece su rótulo). */
const named = (S: Frame, i: number) => (i === 0 ? fr(S, 'head-ctx', 0.05, 0.18) : S.on('try-heads') ? 1 : fr(S, 'head-others', [0, 0.12, 0.42, 0.7][i], [0, 0.24, 0.54, 0.82][i]));

export interface HeadsGeo { R: Rect; map: Rect; title: Rect; thumbs: Rect[]; thumbLab: number }
export function headsGeo(S: Frame): HeadsGeo {
  const R0 = area(S), P = S.portrait, sh = isShort(S), u = S.u;
  const srcH = fz(S, 12) * u * 1.5, R: Rect = { ...R0, h: R0.h - srcH };   // última línea: la fuente
  const titleH = (sh ? 36 : P ? 50 : 58) * u, labH = fz(S, 12) * u * 1.5 + 6 * u;
  if (P) {
    const thH = Math.min(R.w / 4 - 10 * u, R.h * 0.17), thY = R.y + R.h - thH - labH;
    const map: Rect = { x: R.x, y: R.y + titleH, w: R.w, h: thY - R.y - titleH - 10 * u };
    const tw = thH, gap = (R.w - tw * 4) / 3;
    return { R, map, title: { x: R.x, y: R.y, w: R.w, h: titleH }, thumbs: [0, 1, 2, 3].map((i) => ({ x: R.x + i * (tw + gap), y: thY, w: tw, h: tw })), thumbLab: labH };
  }
  const mw = Math.min(R.h, R.w * 0.52), map: Rect = { x: R.x, y: R.y, w: mw, h: R.h };
  const rx = R.x + mw + 18 * u, rw = R.x + R.w - rx;
  const title: Rect = { x: rx, y: R.y, w: rw, h: titleH };
  const avail = R.h - titleH - 20 * u;
  if (sh) { const tw = Math.min((rw - 30 * u) / 4, avail - labH); return { R, map, title, thumbs: [0, 1, 2, 3].map((i) => ({ x: rx + i * (tw + 10 * u), y: R.y + titleH + 10 * u, w: tw, h: tw })), thumbLab: labH }; }
  const tw = Math.min((rw - 16 * u) / 2, (avail - labH * 2 - 16 * u) / 2), x0 = rx + (rw - tw * 2 - 16 * u) / 2, y0 = R.y + titleH + 14 * u;
  return { R, map, title, thumbs: [0, 1, 2, 3].map((i) => ({ x: x0 + (i % 2) * (tw + 16 * u), y: y0 + Math.floor(i / 2) * (tw + labH + 12 * u), w: tw, h: tw })), thumbLab: labH };
}

export function drawHeads(S: Frame) {
  const { d, pal: p } = S, u = S.u, Rl = REAL[S.lang], H = headsGeo(S), st = stOf(S);
  const words = Rl.words.A.map((w) => tokLabel(S, w));
  const lt = tone(S, 'lat'), sg = tone(S, 'sig');
  const size = fz(S, 12);
  // ── miniaturas: una por cabeza ──
  Rl.heads.forEach((h, i) => {
    const r = H.thumbs[i], a = fr(S, 'heads', 0.3 + i * 0.1, 0.42 + i * 0.1);
    if (a < 0.01) return;
    const G = { x: r.x, y: r.y, cs: r.w / words.length, n: words.length, m: words.length, lw: 0, lh: 0 };
    drawGrid(S, G, h.M, { a });
    const sel = S.on('head-ctx') ? (i === st.head ? 1 : 0) : 0;
    if (sel > 0) d.rect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, { stroke: lt.c, lw: 2.5, r: 4, a });
    const na = named(S, i) * a;
    label(S, S.l(NAME[h.kind][0], NAME[h.kind][1]), r.x + r.w / 2, r.y + r.h + 8 * u, { a: na, size: fz(S, 12), weight: i === st.head && sel ? 800 : 600, color: i === st.head && sel ? lt.ink : p.ink2, base: 'top' });
  });
  // ── el mapa grande de la cabeza elegida (con fundido al cambiar) ──
  const aMap = fr(S, 'heads', 0.55, 0.75);
  const kB = S.between('head-ctx', 'head-others') ? fr(S, 'head-ctx', 0.5, 0.62) : 0;   // la otra frase, en lugar del mapa
  const G = gridGeom(S, H.map, words, words, size);
  const k = swap(S, st.headT0), qa = Rl.q.A;
  const drawOne = (hi: number, a: number) => drawGrid(S, G, Rl.heads[hi].M, { a, rows: words, cols: words, size, hlRow: qa, numbersRow: qa, numA: S.on('bert') ? 1 : 0, colLabels: G.colLabels });
  if (k < 1) drawOne(st.headPrev, aMap * (1 - k) * (1 - kB));
  drawOne(st.head, aMap * (k < 1 ? k : 1) * (1 - kB));
  // la otra frase: la fila de «banco» de la misma cabeza, como arcos sobre la frase
  if (kB > 0.01) {
    const hb = Rl.heads[0], wb = Rl.words.B.map((w) => tokLabel(S, w)), m = H.map;
    const row = layoutChips(S, wb, m.w * 0.98, fz(S, 16), { gap: 4, pad: 5 });
    fitText(S, q(S, Rl.sentences.B), m.x + m.w / 2, m.y + m.h * (row.lines > 1 ? 0.04 : 0.16), m.w, { a: kB, size: fz(S, 14), weight: 800, color: p.ink, base: row.lines > 1 ? 'top' : 'middle' });
    if (row.lines > 1) {   // espacio angosto: la fila de «banco» como lista de barras
      const top = m.y + fz(S, 14) * u * 1.9, n = wb.length, rh = Math.min(22 * u, (m.y + m.h - top) / n), lw2 = Math.max(...wb.map((w) => d.measure(w, { size, weight: 600 }))) + 8 * u;
      const bw = Math.max(30 * u, m.w - lw2 - 44 * u);
      wb.forEach((w, j) => {
        const y = top + (j + 0.5) * rh, wt = hb.rowB![j], isQ = j === Rl.q.B;
        label(S, w, m.x + lw2 - 6 * u, y, { a: kB, size, weight: isQ ? 800 : 600, color: isQ ? lt.ink : p.ink2, align: 'right' });
        d.rect(m.x + lw2, y - rh * 0.28, bw, rh * 0.56, { fill: p.surface2, r: 2, a: kB });
        d.rect(m.x + lw2, y - rh * 0.28, bw * wt, rh * 0.56, { fill: sg.c, r: 2, a: kB });
        if (wt >= 0.05) label(S, pct(S, wt), m.x + lw2 + bw + 4 * u, y, { a: kB, size, weight: 800, font: 'mono', color: sg.ink, align: 'left' });
      });
    } else {
    const yRow = m.y + m.h * 0.5;
    const rr = placeRow(row, m.x + m.w / 2, yRow);
    wb.forEach((w, i) => chip(S, rr[i], w, { a: kB, size: row.size, tone: i === Rl.q.B ? 'lat' : 'sig', strong: i === Rl.q.B ? 1 : i === Rl.ctx.B ? 0.6 : 0, dashed: w === tokLabel(S, '[CLS]') || w === tokLabel(S, '[SEP]') }));
    hb.rowB!.forEach((w, j) => { attArc(S, rr[Rl.q.B], rr[j], w, { a: kB, hMax: (yRow - m.y - m.h * 0.22) / u, head: w > 0.08 }); if (w >= 0.1) label(S, pct(S, w), rr[j].x + rr[j].w / 2, yRow + row.h + 5 * u, { a: kB, size: fz(S, 12), weight: 800, font: 'mono', color: sg.ink, base: 'top' }); });
    }
  }
  // ── título: capa, cabeza y qué hace ──
  const T = H.title, hh = Rl.heads[st.head];
  const aT = fr(S, 'bert', 0.08, 0.22);
  const honest = fr(S, 'honest', 0.05, 0.2);
  if (aT > 0.01) {
    const txt = `BERT · ${S.l('12 capas × 12 cabezas = 144', '12 layers × 12 heads = 144')}`;
    fitText(S, txt, T.x + (S.portrait ? T.w / 2 : 0), T.y + 2 * u, T.w, { a: aT * (1 - honest), size: fz(S, 13), weight: 800, color: p.ink, align: S.portrait ? 'center' : 'left', base: 'top' });
    const a2 = S.on('head-ctx') ? fr(S, 'head-ctx', 0.02, 0.15) * (1 - honest) : 0;
    const desc = `${S.l('capa', 'layer')} ${hh.layer} · ${S.l('cabeza', 'head')} ${hh.head}: ${DESC(S, hh.kind)}`;
    fitText(S, desc, T.x + (S.portrait ? T.w / 2 : 0), T.y + fz(S, 13) * u * 1.6, T.w, { a: a2 * (kB > 0.5 ? 0.35 : 1), size: fz(S, 13), weight: 700, color: lt.ink, align: S.portrait ? 'center' : 'left', base: 'top' });
  } else {
    label(S, S.l('una cabeza, un mapa', 'one head, one map'), T.x + (S.portrait ? T.w / 2 : 0), T.y + 2 * u, { a: fr(S, 'heads', 0.3, 0.45), size: fz(S, 13), weight: 800, color: p.ink, align: S.portrait ? 'center' : 'left', base: 'top' });
  }
  if (honest > 0.01) {
    const t1 = S.l(`En ${Rl.nMarkTop} de 144 cabezas, ${q(S, Rl.words.A[qa])} mira sobre todo a una marca.`, `In ${Rl.nMarkTop} of 144 heads, ${q(S, Rl.words.A[qa])} looks mostly at a mark.`);
    const t2 = S.l('Un mapa muestra dónde mira, no por qué.', 'A map shows where it looks, not why.');
    const h1 = fitText(S, t1, T.x + (S.portrait ? T.w / 2 : 0), T.y + 2 * u, T.w, { a: honest, size: fz(S, 13), weight: 800, color: p.ink, align: S.portrait ? 'center' : 'left', base: 'top' });
    fitText(S, t2, T.x + (S.portrait ? T.w / 2 : 0), T.y + 6 * u + Math.max(h1.h, fz(S, 13) * u * 1.3), T.w, { a: fr(S, 'honest', 0.55, 0.7), size: fz(S, 13), weight: 700, color: tone(S, 'err').ink, align: S.portrait ? 'center' : 'left', base: 'top' });
  }
  const src = `${S.l('mapas reales', 'real maps')} · ${Rl.model}`;
  tagNote(S, src, H.R.x + H.R.w, H.R.y + H.R.h + 2 * u, fr(S, 'bert', 0.3, 0.45));
  void alpha; void setHead;
}

/** ¿Qué miniatura (o nada) hay en (x, y)? */
export function hitThumb(S: Frame, x: number, y: number): number {
  const H = headsGeo(S);
  return H.thumbs.findIndex((r) => x >= r.x - 6 && x <= r.x + r.w + 6 && y >= r.y - 6 && y <= r.y + r.h + H.thumbLab);
}
