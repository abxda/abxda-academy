// Acto 2: el camino completo de «el gato come», estación por estación (token → número → embedding → bloques → salida →
// puntajes → probabilidades), la vuelta autorregresiva, y la demostración / «tu turno» de cambiar el sujeto.
// Los números que se dibujan los suaviza update() en S.st.vis (para que nada salte al cambiar de sujeto).
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, arc, area, arrowP, caption, pct, chip, chipW, fitText, fr, hold, isShort, measure, mv, strip, txt } from './draw';
import { DET, LAST, SUBJ, VERB, passOf, vocab } from './data';
import type { Lang } from './model';

/** Lo que se dibuja (suavizado por update). */
export interface Vis { ids: number[]; emb: number[][]; out: number[][]; logits: number[]; probs: number[]; subj: number; pulse: number }
export function visTarget(lang: Lang, s: number): Omit<Vis, 'pulse'> {
  const tr = passOf(lang, s);
  return { ids: tr.ids, emb: tr.emb, out: tr.blocks[1].out, logits: tr.logits[LAST], probs: tr.probs[LAST], subj: s };
}
export const visOf = (S: Frame): Vis => (S.st.vis as Vis | undefined) ?? { ...visTarget(S.lang as Lang, 0), pulse: 9 };

const SC_MIN = -4.5, SC_MAX = 7.5;   // escala fija de los puntajes (cubre los tres sujetos)
const CELL_MAX = 2.4;                // escala de color de las tiras

export interface PathLay {
  port: boolean; short: boolean; s: number; chH: number; cell: number; ch: number;
  /** x del borde izquierdo de cada estación (horizontal) o centro de cada columna (vertical). */
  xChip: number; xId: number; idW: number; xEmb: number; xBlk: number; bw: number; xOut: number; chipWmax: number;
  rowY: (i: number) => number; rowH: number; y0: number;
  /** vertical: y de cada estación y centros de columna */
  colX: (i: number) => number; colW: number; gw: number; yChip: number; yId: number; yEmb: number; yBlk: number; blkH: number; yOut: number;
  list: Rect; headY: number;
}

export function pathLay(S: Frame): PathLay {
  const A = area(S), short = isShort(S), port = S.portrait, L = S.lang as Lang;
  const s = short ? 13 : 14;
  const chipWmax = Math.max(...[DET[L], ...SUBJ[L], VERB[L]].map((w) => chipW(S, w, s)));
  const base = { port, short, s, chipWmax } as PathLay;
  if (!port) {
    const listW = clamp(A.w * (short ? 0.38 : 0.33), 210, 320), gapLR = short ? 18 : 28, LW = A.w - listW - gapLR;
    const g = short ? 14 : 20, idW = short ? 24 : 30, bw = clamp(LW * 0.17, 70, 124);
    const cell = clamp((LW - chipWmax - idW - bw - 4 * g) / 16, 6, 19);
    const used = chipWmax + idW + bw + 4 * g + 16 * cell, ox = A.x + Math.max(0, (LW - used) / 2);
    const hh = short ? 18 : 26, rowH = short ? Math.min(44, (A.h - hh) / 3.3) : Math.min(80, (A.h - hh) / 3.8);
    const y0 = A.y + hh + (A.h - hh - 3 * rowH) / 2;
    const xChip = ox, xId = xChip + chipWmax + g, xEmb = xId + idW + g, xBlk = xEmb + 8 * cell + g, xOut = xBlk + bw + g;
    return {
      ...base, chH: Math.min(30, rowH * 0.66), cell, ch: Math.min(20, rowH * 0.4), xChip, xId, idW, xEmb, xBlk, bw, xOut,
      rowY: (i) => y0 + i * rowH + rowH / 2, rowH, y0, colX: () => 0, colW: 0, gw: 0, yChip: 0, yId: 0, yEmb: 0, yBlk: y0 + 4, blkH: 3 * rowH - 8, yOut: 0,
      list: { x: A.x + LW + gapLR, y: A.y, w: listW, h: A.h }, headY: y0 - (short ? 9 : 13),
    };
  }
  const labels = stationNames(S), gw = Math.max(...labels.map((t) => measure(S, t, 12, false, 700))) + 10;
  const gap = 6, colW = (A.w - gw - 2 * gap) / 3, cell = Math.min(11, (colW - 14) / 8);
  const chH = 26, ch = 10, yChip = A.y, yId = yChip + chH + 3, yEmb = yId + 18 + 8, yBlk = yEmb + ch + 9, blkH = 30, yOut = yBlk + blkH + 9;
  const listY = yOut + ch + 12;
  return {
    ...base, chH, cell, ch, xChip: 0, xId: 0, idW: 0, xEmb: 0, xBlk: A.x + gw, bw: A.w - gw - 9, xOut: 0,
    rowY: () => 0, rowH: 0, y0: 0, colX: (i) => A.x + gw + i * (colW + gap) + colW / 2, colW, gw, yChip, yId, yEmb, yBlk, blkH, yOut,
    list: { x: A.x, y: listY, w: A.w, h: A.y + A.h - listY }, headY: 0,
  };
}

const stationNames = (S: Frame) => [S.l('token', 'token'), S.l('número', 'number'), S.l('embedding', 'embedding'), S.l('bloques', 'blocks'), S.l('salida', 'output')];

/** Destello 0..1 de la estación k tras un cambio de sujeto. */
const flash = (v: Vis, k: number) => { const q = v.pulse - k * 0.16; return q < 0 || q > 0.5 ? 0 : Math.sin((q / 0.5) * Math.PI); };

export function drawPath(S: Frame) {
  const { d, pal: p } = S, L = S.lang as Lang, P = pathLay(S), v = visOf(S), V = vocab(L);
  const lat = tone(S, 'lat'), sig = tone(S, 'sig');
  const words = [DET[L], SUBJ[L][v.subj], VERB[L]];
  const aTok = (i: number) => ap(S, 'path-tokens', 0.1 + i * 0.14, 0.2 + i * 0.14);
  const aId = (i: number) => ap(S, 'path-ids', 0.15 + i * 0.12, 0.27 + i * 0.12);
  const aEmb = ap(S, 'path-embed', 0.12, 0.3), embFill = fr(S, 'path-embed', 0.12, 0.5);
  const aBlk = ap(S, 'path-blocks', 0.08, 0.22), aOut = ap(S, 'path-blocks', 0.6, 0.75);
  const dimFirst = hold(S, 'path-last', undefined, 0.1, 0.25);
  const lastHot = hold(S, 'path-last', 'path-scores', 0.1, 0.25);
  const subjHot = S.on('pass-why') ? hold(S, 'pass-why', undefined, 0.05, 0.2) : 0;
  const names = stationNames(S);

  // ── estaciones de cada token ──
  for (let i = 0; i < 3; i++) {
    const at = aTok(i); if (at <= 0.01) continue;
    const dim = i < 2 ? dimFirst * 0.62 : 0;
    const fl = i === 1 ? flash(v, 0) : 0;
    if (!P.port) {
      const y = P.rowY(i);
      chip(S, P.xChip, y - P.chH / 2, words[i], { s: P.s, h: P.chH, w: P.chipWmax, a: at, active: Math.max(fl, i === 1 ? subjHot : 0, i === 2 ? subjHot : 0) * 0.8 });
      d.withAlpha(aId(i), () => {
        arrowP(S, P.xChip + P.chipWmax + 3, y, P.xId - 3, y, { p: mv(S, 'path-ids', 0.12 + i * 0.12, 0.24 + i * 0.12) });
        idBox(S, P.xId, y - 11, P.idW, 22, v.ids[i], i === 1 ? flash(v, 1) : 0);
      });
      d.withAlpha(aEmb, () => {
        arrowP(S, P.xId + P.idW + 3, y, P.xEmb - 3, y, { p: mv(S, 'path-embed', 0.08, 0.2) });
        strip(S, P.xEmb, y - P.ch / 2, v.emb[i], P.cell, P.ch, { tone: 'lat', vmax: CELL_MAX, cellA: (_, c) => clamp(embFill * 9 - c), hot: i === 1 ? () => flash(v, 2) : undefined });
      });
      d.withAlpha(aOut * (1 - dim), () => {
        arrowP(S, P.xBlk + P.bw + 3, y, P.xOut - 3, y, { p: mv(S, 'path-blocks', 0.6, 0.72) });
        strip(S, P.xOut, y - P.ch / 2, v.out[i], P.cell, P.ch, { tone: 'lat', vmax: CELL_MAX, hot: i === 2 ? () => Math.max(lastHot, flash(v, 4)) : undefined });
      });
      if (aBlk > 0.01) d.withAlpha(aBlk * (1 - dim), () => arrowP(S, P.xEmb + 8 * P.cell + 3, y, P.xBlk - 3, y, { p: mv(S, 'path-blocks', 0.05, 0.18) }));
    } else {
      const cx = P.colX(i), cw = Math.min(P.colW, P.chipWmax + 6);
      chip(S, cx - cw / 2, P.yChip, words[i], { s: P.s, h: P.chH, w: cw, a: at, active: Math.max(fl, i === 1 ? subjHot : 0, i === 2 ? subjHot : 0) * 0.8 });
      d.withAlpha(aId(i), () => idBox(S, cx - 14, P.yId, 28, 18, v.ids[i], i === 1 ? flash(v, 1) : 0));
      d.withAlpha(aEmb, () => strip(S, cx - 4 * P.cell, P.yEmb, v.emb[i], P.cell, P.ch, { tone: 'lat', vmax: CELL_MAX, cellA: (_, c) => clamp(embFill * 9 - c), hot: i === 1 ? () => flash(v, 2) : undefined }));
      d.withAlpha(aOut * (1 - dim), () => strip(S, cx - 4 * P.cell, P.yOut, v.out[i], P.cell, P.ch, { tone: 'lat', vmax: CELL_MAX, hot: i === 2 ? () => Math.max(lastHot, flash(v, 4)) : undefined }));
    }
  }
  // ── rótulos de las estaciones ──
  const stA = [S.on('path-tokens') ? ap(S, 'path-tokens', 0.05, 0.15) : 0, ap(S, 'path-ids', 0.1, 0.2), ap(S, 'path-embed', 0.08, 0.18), aBlk, aOut];
  if (!P.port) {
    const xs = [P.xChip + P.chipWmax / 2, P.xId + P.idW / 2, P.xEmb + 4 * P.cell, P.xBlk + P.bw / 2, P.xOut + 4 * P.cell];
    const ws = [P.chipWmax + 16, P.idW + 30, 8 * P.cell + 16, P.bw, 8 * P.cell + 16];
    names.forEach((t, k) => { if (stA[k] > 0.01) caption(S, t, xs[k], P.headY, ws[k], { align: 'center', a: stA[k] }); });
  } else {
    const ys = [P.yChip + P.chH / 2, P.yId + 9, P.yEmb + P.ch / 2, P.yBlk + P.blkH / 2, P.yOut + P.ch / 2];
    names.forEach((t, k) => { if (stA[k] > 0.01) caption(S, t, area(S).x, ys[k], P.gw - 6, { a: stA[k] }); });
    // flechas cortas entre estaciones (en cada columna)
    for (let i = 0; i < 3; i++) {
      const cx = P.colX(i);
      if (aEmb > 0.01) arrowP(S, cx, P.yId + 19, cx, P.yEmb - 2, { a: aEmb, head: 5, lw: 1.3 });
      if (aBlk > 0.01) arrowP(S, cx, P.yEmb + P.ch + 1, cx, P.yBlk - 2, { a: aBlk, head: 5, lw: 1.3 });
      if (aOut > 0.01) arrowP(S, cx, P.yBlk + P.blkH + 1, cx, P.yOut - 2, { a: aOut * (i < 2 ? 1 - dimFirst * 0.62 : 1), head: 5, lw: 1.3 });
    }
  }
  // ── la caja de los bloques ──
  if (aBlk > 0.01) {
    const box: Rect = P.port ? { x: P.xBlk, y: P.yBlk, w: P.bw, h: P.blkH } : { x: P.xBlk, y: P.yBlk, w: P.bw, h: P.blkH };
    const open = S.on('pass-why') ? ap(S, 'pass-why', 0.7, 0.85) : 0;
    d.withAlpha(aBlk, () => {
      d.rect(box.x, box.y, box.w, box.h, { fill: alpha(sig.c, 0.08 + 0.14 * open), stroke: open > 0.01 ? p.ink : p.lineStrong, lw: 1.6 + 1.2 * open, r: 4 });
      if (P.port) txt(S, '× 2', box.x + 8, box.y + box.h / 2, { s: 13, weight: 800, c: p.ink2, mono: true });
      else txt(S, '× 2', box.x + box.w / 2, box.y + 18, { s: 15, weight: 800, align: 'center', c: p.ink2, mono: true });
    });
    // cada token mira a los anteriores: arcos dentro de la caja (horizontal) o entre columnas (vertical)
    const aArc = ap(S, 'path-blocks', 0.32, 0.5) * (S.on('path-scores') ? 1 - ap(S, 'path-scores', 0, 0.1) : 1);
    const why = S.on('pass-why') ? ap(S, 'pass-why', 0.2, 0.4) : 0;
    if (aArc > 0.01 || why > 0.01) {
      const pts: [number, number][] = P.port ? [0, 1, 2].map((i) => [P.colX(i), P.yBlk + P.blkH * 0.3]) : [0, 1, 2].map((i) => [P.xBlk + P.bw * 0.62, P.rowY(i)]);
      const pairs: [number, number][] = [[2, 1], [2, 0], [1, 0]];
      pairs.forEach(([a, b], k) => {
        const hot = a === 2 && b === 1 ? why : 0, al = Math.max(aArc * (1 - 0.2 * k), hot);
        if (al <= 0.01) return;
        const [x1, y1] = pts[a], [x2, y2] = pts[b], span = Math.hypot(x2 - x1, y2 - y1);
        arc(S, x1, y1, x2, y2, { bulge: P.port ? -Math.min(span * 0.25, P.blkH * 0.45) : span * 0.32, lw: 1.6 + hot * 1.2, a: al, dash: hot > 0.01 ? undefined : [3, 3], head: 6 });
      });
      if (why > 0.01) {
        const [x, y] = P.port ? [(pts[1][0] + pts[2][0]) / 2 + 12, P.yBlk + P.blkH * 0.5] : [P.xBlk + P.bw * 0.62 + (pts[2][1] - pts[1][1]) * 0.42, (pts[1][1] + pts[2][1]) / 2];
        txt(S, '?', x, y, { s: 18, weight: 800, c: sig.ink, align: 'center', halo: true, a: why });
      }
    }
  }
  // ── la lista de puntajes / probabilidades ──
  if (S.on('path-scores')) drawList(S, P, v, V);
  void lat;
}

function idBox(S: Frame, x: number, y: number, w: number, h: number, id: number, hot: number) {
  const { d, pal: p } = S;
  d.rect(x, y, w, h, { fill: p.surface, stroke: hot > 0.01 ? p.ink : p.lineStrong, lw: 1.3 + 1.5 * hot, r: 3 });
  txt(S, String(id), x + w / 2, y + h / 2 + 1, { s: 13, mono: true, weight: 700, align: 'center' });
}

function drawList(S: Frame, P: PathLay, v: Vis, V: string[]) {
  const { d, pal: p } = S, R = P.list, short = P.short;
  const m = S.on('path-softmax') ? mv(S, 'path-softmax', 0.12, 0.45) : 0;
  const aL = ap(S, 'path-scores', 0.08, 0.2);
  // flecha desde la salida de «come»
  const pa = mv(S, 'path-scores', 0.02, 0.16);
  if (!P.port) arrowP(S, P.xOut + 8 * P.cell + 4, P.rowY(2), R.x - 4, P.rowY(2), { p: pa, tone: 'lat', lw: 1.8 });
  else arrowP(S, P.colX(2), P.yOut + P.ch + 1, P.colX(2), R.y + 2, { p: pa, tone: 'lat', lw: 1.6, head: 5 });
  // encabezado
  const hdrH = short ? 16 : 22, hy = R.y + hdrH / 2;
  const cols = short ? 2 : 1, rows = 12 / cols;
  const rh = Math.min(short ? 28 : 27, (R.h - hdrH - 2) / rows);
  const top = R.y + hdrH + Math.max(0, (R.h - hdrH - rh * rows) * (P.port ? 0 : 0.45));
  const hx = R.x, loopOn = S.on('path-loop') && !S.on('pass-demo'), loopTxt = loopOn ? ap(S, 'path-loop', P.port ? 0.45 : 0.25, P.port ? 0.6 : 0.35) : 0;
  d.withAlpha(aL * (1 - m) * (1 - loopTxt), () => caption(S, S.l('12 puntajes, uno por palabra', '12 scores, one per word'), hx, P.port ? hy : top - 10, R.w, { c: p.ink2 }));
  d.withAlpha(aL * m * (1 - loopTxt), () => caption(S, S.l('probabilidades (softmax)', 'probabilities (softmax)'), hx, P.port ? hy : top - 10, R.w, { c: tone(S, 'dat').ink }));
  if (aL <= 0.01) return;
  // filas
  const colW = R.w / cols, labW = Math.min(Math.max(...V.map((w) => measure(S, w, 12, false, 600))) + 8, colW * 0.4), valW = Math.min(measure(S, '−4.3', 12, true) + 8, colW * 0.24);
  const chosen = S.on('path-loop') && !S.on('pass-demo') ? ap(S, 'path-loop', 0.08, 0.22) : 0;
  const top2 = [...v.probs.keys()].sort((a, b) => v.probs[b] - v.probs[a]).slice(0, 2);
  const hotScores = S.is('path-scores') ? ap(S, 'path-scores', 0.68, 0.8) : 0;
  for (let i = 0; i < 12; i++) {
    const c = Math.floor(i / rows), r = i % rows, x = R.x + c * colW, y = top + r * rh;
    const a = aL * clamp(fr(S, 'path-scores', 0.12, 0.55) * 14 - i);
    if (a <= 0.01) continue;
    const isTop = top2.includes(i), hot = Math.max(isTop ? hotScores : 0, i === top2[0] ? Math.max(m * 0.7, chosen) : 0);
    d.withAlpha(a, () => {
      txt(S, V[i], x + labW - 6, y + rh / 2, { s: 12, align: 'right', weight: hot > 0.3 ? 800 : 600, c: hot > 0.3 ? p.ink : p.ink2 });
      const bx = x + labW, bwid = colW - labW - valW - 6, bh = Math.min(rh - 4, 14), byy = y + (rh - bh) / 2;
      const zx = lerp(bx + bwid * (-SC_MIN / (SC_MAX - SC_MIN)), bx, m);
      const sLen = (v.logits[i] / (SC_MAX - SC_MIN)) * bwid, pLen = v.probs[i] * bwid, len = lerp(sLen, pLen, m);
      const t = tone(S, m > 0.5 ? 'dat' : 'lat');
      if (m < 0.98) d.line(zx, y + 1, zx, y + rh - 1, p.lineStrong, 1);
      if (len >= 0) d.rect(zx, byy, len, bh, { fill: alpha(t.c, 0.4 + 0.4 * hot) });
      else d.rect(zx + len, byy, -len, bh, { fill: alpha(t.c, 0.14), stroke: t.c, lw: 1.2, dash: [3, 2] });
      if (hot > 0.01) d.rect(bx - 3, y + 1, x + colW + 1 - (bx - 3), rh - 2, { stroke: p.ink, lw: 1.5, a: hot, r: 3 });
      const sv = S.n(v.logits[i], 1).replace('-', '−'), pv = pct(S, v.probs[i]);
      if (m < 0.5) txt(S, sv, x + colW - 6, y + rh / 2, { s: 12, mono: true, align: 'right', c: p.ink2, a: 1 - m * 2 });
      else txt(S, pv, x + colW - 6, y + rh / 2, { s: 12, mono: true, align: 'right', c: v.probs[i] > 0.05 ? p.ink : p.mute, a: m * 2 - 1, weight: v.probs[i] > 0.05 ? 800 : 600 });
    });
  }
  // la vuelta autorregresiva
  if (S.on('path-loop') && !S.on('pass-demo')) {
    const aR = ap(S, 'path-loop', 0.3, 0.5), pr = mv(S, 'path-loop', 0.3, 0.6);
    const L = S.lang as Lang, sent = `${DET[L]} ${SUBJ[L][0]} ${VERB[L]} + ${vocab(L)[9]}`;
    const sig = tone(S, 'dat');
    if (!P.port) {
      const x1 = R.x + R.w * 0.5, y1 = R.y + 4, x2 = P.xChip + P.chipWmax / 2, y2 = P.headY - 12;
      d.withAlpha(aR, () => {
        S.d.curve(x1, y1, x2, Math.max(area(S).y + 2, y2), sig.c, 1.8, { bend: -0.12, dash: [5, 4] });
        S.d.arrow(x2 + 2, Math.max(area(S).y + 2, y2) - 1, x2, Math.max(area(S).y + 2, y2) + 6, sig.c, 1.8, 6);
      });
      d.withAlpha(ap(S, 'path-loop', 0.5, 0.64), () => fitText(S, S.l(`otra vuelta: ${sent}`, `another pass: ${sent}`), (x1 + x2) / 2, area(S).y + (P.short ? 6 : 8), Math.abs(x1 - x2) * 0.9, { s: 12, weight: 700, c: sig.ink, align: 'center', halo: true }));
      void pr;
    } else {
      const A = area(S), xg = A.x + A.w - 3, yc = P.yChip + P.chH / 2;
      d.withAlpha(aR, () => {
        d.line(R.x + R.w - 70, R.y + 8, xg, R.y + 8, sig.c, 1.8, [5, 4]);
        d.line(xg, R.y + 8, xg, yc, sig.c, 1.8, [5, 4]);
        d.arrow(xg, yc, xg - 8, yc, sig.c, 1.8, 6);
      });
      d.withAlpha(loopTxt, () => fitText(S, S.l(`otra vuelta: ${sent}`, `another pass: ${sent}`), R.x, R.y + 8, R.w - 76, { s: 12, weight: 700, c: sig.ink }));
      void pr;
    }
  }
}
