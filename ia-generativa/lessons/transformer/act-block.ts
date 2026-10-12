// Acto 3: el bloque, pieza por pieza. Arriba, el diagrama del bloque (la línea de la lista del token, con dos desvíos:
// normalizar → atención → sumar; normalizar → red → sumar). Abajo, el detalle con los números reales de «come»:
// a quién mira, qué pasa si se apaga la atención, la red 8 → 32 → 8, la suma residual, la normalización y la pila.
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { along, type Pt } from '../../../../../theme/kit';
import { ap, arc, area, caption, chip, chipW, fitText, fr, hatch, hbar, hold, isShort, measure, mv, node, num, pct, plus, strip, txt, vbars } from './draw';
import { DET, LAST, SUBJ, VERB, passOf, promptOf, stats, vocab } from './data';
import type { Lang } from './model';

// ───────── geometría del diagrama y del panel ─────────
interface BLay {
  Dg: Rect; Pn: Rect; short: boolean; port: boolean;
  ym: number; yb: number; bh: number; yc: number;
  xs: number; sp1: number; n1: Rect; at: Rect; p1: number; sp2: number; n2: Rect; ml: Rect; p2: number; xe: number; r: number;
}
function blay(S: Frame): BLay {
  const A = area(S), short = isShort(S), port = S.portrait;
  const dh = short ? 74 : port ? 98 : clamp(A.h * 0.3, 110, 146);
  const dw = Math.min(A.w, port ? A.w : 800), dx = A.x + (A.w - dw) / 2;
  const Dg: Rect = { x: dx, y: A.y, w: dw, h: dh };
  const gap = short ? 6 : 12, Pn: Rect = { x: A.x, y: A.y + dh + gap, w: A.w, h: A.h - dh - gap };
  const U = dw / 20, bh = short ? 24 : port ? 28 : 34, yb = A.y + (short ? 2 : 8), yc = yb + bh / 2, ym = yb + bh + (short ? 24 : port ? 30 : 38);
  const box = (x: number, w: number): Rect => ({ x: dx + x * U, y: yb, w: w * U, h: bh });
  return {
    Dg, Pn, short, port, ym, yb, bh, yc, r: short ? 7 : 9,
    xs: dx, sp1: dx + 1.0 * U, n1: box(1.6, 2.7), at: box(4.9, 3.9), p1: dx + 9.5 * U,
    sp2: dx + 10.4 * U, n2: box(11.0, 2.7), ml: box(14.3, 3.9), p2: dx + 18.9 * U, xe: dx + 20 * U,
  };
}
function route(B: BLay): Pt[] {
  return [[B.xs, B.ym], [B.sp1, B.ym], [B.sp1, B.yc], [B.n1.x + B.n1.w / 2, B.yc], [B.at.x + B.at.w / 2, B.yc], [B.p1, B.yc], [B.p1, B.ym],
    [B.sp2, B.ym], [B.sp2, B.yc], [B.n2.x + B.n2.w / 2, B.yc], [B.ml.x + B.ml.w / 2, B.yc], [B.p2, B.yc], [B.p2, B.ym], [B.xe, B.ym]];
}

/** Activación de cada pieza del diagrama según el segmento. */
function actives(S: Frame) {
  const seq = S.is('block-parts');
  const full = S.is('block-full') ? fr(S, 'block-full', 0.06, 0.88) : -1;
  const pass = (a: number, b: number) => (full >= a && full < b ? 1 : 0);
  const attn = Math.max(seq ? ap(S, 'block-parts', 0.15, 0.25) * (1 - ap(S, 'block-parts', 0.5, 0.58)) : 0, hold(S, 'attn', 'mlp'), pass(0.24, 0.4));
  const mlp = Math.max(seq ? ap(S, 'block-parts', 0.58, 0.68) : 0, hold(S, 'mlp', 'residual'), pass(0.66, 0.82));
  const res = Math.max(hold(S, 'residual', 'norm-why'), pass(0.4, 0.5), pass(0.82, 0.92));
  const norm = Math.max(hold(S, 'norm-mean', 'block-full'), pass(0.13, 0.24), pass(0.55, 0.66));
  return { attn, mlp, res, norm, full };
}

function drawDiagram(S: Frame, B: BLay) {
  const { d, pal: p } = S, act = actives(S);
  const lineC = tone(S, 'lat').c, lw = 2.2;
  const resA = ap(S, 'residual', 0.15, 0.35), normA = ap(S, 'norm-mean', 0.05, 0.2);
  const off = S.is('attn-off') ? mv(S, 'attn-off', 0.36, 0.46) * (1 - mv(S, 'attn-off', 0.92, 1)) : 0;
  // tramos fijos de la línea
  d.line(B.xs, B.ym, B.sp1, B.ym, lineC, lw);
  d.line(B.p1, B.ym, B.sp2, B.ym, lineC, lw);
  d.arrow(B.p2, B.ym, B.xe, B.ym, lineC, lw, 8);
  // desvíos (la lista pasa por cada parte)
  for (const [sp, n, bx, pp] of [[B.sp1, B.n1, B.at, B.p1], [B.sp2, B.n2, B.ml, B.p2]] as [number, Rect, Rect, number][]) {
    d.polyline([[sp, B.ym], [sp, B.yc], [bx.x, B.yc]], lineC, lw);
    d.polyline([[bx.x + bx.w, B.yc], [pp, B.yc], [pp, B.ym - (resA > 0.5 ? B.r : 0)]], lineC, lw);
    if (resA < 0.5) d.line(pp, B.ym, pp + 1, B.ym, lineC, lw);
  }
  // atajo residual: la línea sigue derecho y las dos se suman en ⊕
  if (resA > 0.01) {
    const hot = act.res;
    d.withAlpha(resA, () => {
      d.line(B.sp1, B.ym, B.p1 - B.r, B.ym, hot > 0.3 ? p.ink : lineC, lw + hot);
      d.line(B.sp2, B.ym, B.p2 - B.r, B.ym, hot > 0.3 ? p.ink : lineC, lw + hot);
      plus(S, B.p1, B.ym, B.r, { tone: 'ink', fill: hot });
      plus(S, B.p2, B.ym, B.r, { tone: 'ink', fill: hot });
    });
  }
  // cajas
  const nl = measure(S, S.l('normalizar', 'normalize'), 12, false, 700) + 10 <= B.n1.w ? S.l('normalizar', 'normalize') : S.l('norm.', 'norm');
  if (normA > 0.01) { node(S, B.n1, nl, { tone: 'mute', a: normA, active: act.norm, size: 12 }); node(S, B.n2, nl, { tone: 'mute', a: normA, active: act.norm, size: 12 }); }
  node(S, B.at, S.l('atención', 'attention'), { tone: 'sig', active: act.attn });
  if (off > 0.01) d.withAlpha(off, () => { d.rect(B.at.x, B.at.y, B.at.w, B.at.h, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5, r: 3 }); hatch(S, B.at); fitText(S, S.l('apagada', 'off'), B.at.x + B.at.w / 2, B.yc, B.at.w - 6, { s: 12, weight: 800, c: p.ink2, align: 'center', halo: true }); });
  node(S, B.ml, S.l('red', 'network'), { tone: 'dat', active: act.mlp });
  // entra / sale
  const ly = B.ym + (B.short ? 13 : 16);
  caption(S, S.l('entra', 'in'), B.xs, ly, 60, {});
  caption(S, S.l('sale', 'out'), B.xe, ly, 60, { align: 'right' });
  // pila (segmento «stack»): copias detrás
  // el punto que recorre el bloque
  if (act.full >= 0 && act.full < 1) {
    const [x, y] = along(route(B), act.full);
    d.circle(x, y, 6, { fill: tone(S, 'lat').c, stroke: p.stage, lw: 2 });
  }
}

// ───────── panel ─────────
/** Grupo de barras con rótulo arriba. */
function vgroup(S: Frame, r: Rect, v: number[], label: string, o: { tone?: Tone; vmax?: number; a?: number; line?: number | null; band?: number; hotI?: number; hotA?: number; nums?: boolean; labTone?: Tone } = {}) {
  const { pal: p } = S, labH = 18, numH = o.nums ? 18 : 0;
  const R: Rect = { x: r.x, y: r.y + labH, w: r.w, h: r.h - labH - numH };
  S.d.withAlpha(o.a ?? 1, () => {
    caption(S, label, r.x + r.w / 2, r.y + 8, r.w + 10, { align: 'center', c: o.labTone ? tone(S, o.labTone).ink : p.ink2 });
    const g = vbars(S, R, v, { tone: o.tone, vmax: o.vmax ?? 2.4, line: o.line, band: o.band, hotI: o.hotI, hotA: o.hotA });
    if (o.nums) v.forEach((q, i) => fitText(S, num(S, q, 1), R.x + (i + 0.5) * g.bw, R.y + R.h + 10, g.bw + 4, { s: 12, mono: true, c: p.ink2, align: 'center' }));
  });
}

export function drawBlock(S: Frame) {
  const B = blay(S);
  drawDiagram(S, B);
  const P = B.Pn;
  const seg = (k: string, until: string) => (S.on(k) && !S.on(until) ? ap(S, k, 0, 0.08) * (1 - fr(S, until, 0, 0.05)) : 0);
  const show = (k: string, until: string, fn: () => void) => { const a = seg(k, until); if (a > 0.003) S.d.withAlpha(a, fn); };
  show('block-parts', 'attn', () => panelParts(S, P));
  show('attn', 'attn-off', () => panelAttn(S, P));
  show('attn-off', 'mlp', () => panelOff(S, P));
  show('mlp', 'residual', () => panelMlp(S, P));
  show('residual', 'norm-why', () => panelResidual(S, P));
  show('norm-why', 'norm-mean', () => panelNormWhy(S, P));
  show('norm-mean', 'block-full', () => panelNorm(S, P));
  show('block-full', 'stack', () => panelFull(S, P));
  show('stack', 'pos-why', () => panelStack(S, P));
}

/** Fila de tres fichas centradas en un ancho. Devuelve los centros. */
function chipRow(S: Frame, words: string[], cx: number, y: number, maxW: number, s: number, h: number, o: { a?: number; active?: (i: number) => number; gap?: number } = {}) {
  const gap = o.gap ?? Math.min(48, maxW * 0.12), ws = words.map((w) => chipW(S, w, s)), tot = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = cx - tot / 2; const cs: number[] = [];
  words.forEach((w, i) => { chip(S, x, y, w, { s, h, w: ws[i], a: o.a, active: o.active?.(i) }); cs.push(x + ws[i] / 2); x += ws[i] + gap; });
  return cs;
}

function panelParts(S: Frame, P: Rect) {
  const { pal: p } = S, L = S.lang as Lang, words = promptOf(L, 0), short = isShort(S), port = S.portrait;
  const halves: [Rect, Rect] = port ? [{ x: P.x, y: P.y, w: P.w, h: P.h / 2 }, { x: P.x, y: P.y + P.h / 2, w: P.w, h: P.h / 2 }] : [{ x: P.x, y: P.y, w: P.w / 2 - 10, h: P.h }, { x: P.x + P.w / 2 + 10, y: P.y, w: P.w / 2 - 10, h: P.h }];
  const s = short ? 13 : 14, h = short ? 24 : 28;
  // atención: los tokens se miran
  const a1 = ap(S, 'block-parts', 0.15, 0.27), a2 = ap(S, 'block-parts', 0.55, 0.67);
  S.d.withAlpha(a1, () => {
    const R = halves[0], y = R.y + R.h * (port ? 0.42 : 0.5) - h / 2;
    caption(S, S.l('atención: los tokens se miran', 'attention: tokens look at each other'), R.x + R.w / 2, R.y + 9, R.w, { align: 'center', c: tone(S, 'sig').ink });
    const cs = chipRow(S, words, R.x + R.w / 2, y, R.w, s, h);
    [[2, 1], [2, 0], [1, 0]].forEach(([i, j], k) => arc(S, cs[i], y - 3, cs[j], y - 3, { bulge: Math.abs(cs[i] - cs[j]) * 0.3 + 6, a: 1 - 0.2 * k, head: 6, p: mv(S, 'block-parts', 0.2 + k * 0.05, 0.32 + k * 0.05) }));
  });
  S.d.withAlpha(a2, () => {
    const R = halves[1], y = R.y + R.h * (port ? 0.3 : 0.38);
    caption(S, S.l('red: cada token por su cuenta', 'network: each token on its own'), R.x + R.w / 2, R.y + 9, R.w, { align: 'center', c: tone(S, 'dat').ink });
    const cs = chipRow(S, words, R.x + R.w / 2, y, R.w, s, h);
    const bw = Math.min(56, R.w / 5), bhh = short ? 20 : 24;
    cs.forEach((c) => {
      S.d.arrow(c, y + h + 2, c, y + h + 12, p.mute, 1.4, 5);
      node(S, { x: c - bw / 2, y: y + h + 14, w: bw, h: bhh }, S.l('red', 'net'), { tone: 'dat', size: 12 });
    });
  });
}

function panelAttn(S: Frame, P: Rect) {
  const { d, pal: p } = S, L = S.lang as Lang, words = promptOf(L, 0), short = isShort(S);
  const w = passOf(L, 0).blocks[0].weights[0][LAST];
  const s = short ? 14 : 18, h = short ? 26 : 36;
  const y = P.y + P.h * (short ? 0.66 : 0.6) - h / 2;
  caption(S, S.l('bloque 1, una cabeza: a quién mira «come»', 'block 1, one head: who “eats” looks at').replace('come', VERB[L]), P.x + P.w / 2, P.y + 9, P.w, { align: 'center' });
  const cs = chipRow(S, words, P.x + P.w / 2, y, P.w, s, h, { gap: Math.min(80, P.w * 0.16), active: (i) => (i === 2 ? 0.7 : 0) });
  const hot = ap(S, 'attn', 0.6, 0.72);
  [0, 1, 2].forEach((j) => {
    const a = ap(S, 'attn', 0.25 + j * 0.06, 0.35 + j * 0.06);
    if (a <= 0.01) return;
    if (j !== 2) arc(S, cs[2], y - 4, cs[j], y - 4, { bulge: Math.abs(cs[2] - cs[j]) * (short ? 0.16 : 0.26) + 6, lw: 1 + 7 * w[j], a, head: 8, tone: 'sig' });
    const isHot = j === 1 ? hot : 0;
    d.withAlpha(a, () => {
      const ty = y + h + (short ? 13 : 18);
      txt(S, pct(S, w[j]), cs[j], ty, { s: short ? 14 : 18, weight: 800, mono: true, align: 'center', c: isHot > 0.5 ? tone(S, 'sig').ink : p.ink2 });
      if (isHot > 0.01) d.rect(cs[j] - 34, ty - 13, 68, 26, { stroke: p.ink, lw: 2, r: 4, a: isHot });
    });
  });
  if (!short) caption(S, S.l('el grosor de cada flecha: cuánta atención', 'the thickness of each arrow: how much attention'), P.x + P.w / 2, P.y + P.h - 8, P.w, { align: 'center', a: ap(S, 'attn', 0.4, 0.5) });
}

function panelOff(S: Frame, P: Rect) {
  const { d, pal: p } = S, L = S.lang as Lang, V = vocab(L), short = isShort(S), port = S.portrait;
  const off = mv(S, 'attn-off', 0.36, 0.48);
  const rows = 3, rh = Math.min(short ? 34 : port ? 84 : 54, (P.h - 40) / rows), top = P.y + 22 + (P.h - 40 - rh * rows) / 2;
  const chipWm = Math.max(...SUBJ[L].map((w) => chipW(S, `${DET[L]} ${w} ${VERB[L]}`, 13))) + 4;
  const px = port ? P.x : P.x + chipWm + 12, pw = port ? P.w : P.w - chipWm - 12, colW = (pw - 16) / 2;
  caption(S, off > 0.5 ? S.l('con la atención apagada', 'with attention switched off') : S.l('con la atención encendida', 'with attention on'), P.x + P.w / 2, P.y + 8, P.w, { align: 'center', c: off > 0.5 ? p.ink2 : tone(S, 'sig').ink, a: short ? 1 - ap(S, 'attn-off', 0.6, 0.66) : 1 });
  for (let s = 0; s < 3; s++) {
    const y = top + s * rh, a = ap(S, 'attn-off', 0.05 + s * 0.05, 0.15 + s * 0.05);
    if (a <= 0.01) continue;
    const on = passOf(L, s).probs[LAST], of = passOf(L, s, false).probs[LAST];
    const cy = port ? y + 14 : y + rh / 2, py = port ? y + 28 + (rh - 28) / 2 : y + rh / 2;
    d.withAlpha(a, () => {
      chip(S, P.x, cy - 13, `${DET[L]} ${SUBJ[L][s]} ${VERB[L]}`, { s: 13, h: 26, w: chipWm });
      const drawTop = (pr: number[], al: number, tn: Tone) => {
        if (al <= 0.01) return;
        const order = [...pr.keys()].sort((a2, b2) => pr[b2] - pr[a2]).slice(0, 2);
        order.forEach((k, j) => {
          const x = px + j * (colW + 16), lw = Math.min(port ? 62 : 80, measure(S, V[k], 12, false, 700) + 6), bw = colW - lw - 48;
          d.withAlpha(al, () => {
            fitText(S, V[k], x, py, lw, { s: 12, weight: 700 });
            hbar(S, x + lw, py - 6, Math.max(10, bw), 12, pr[k], { tone: tn, hot: j === 0 ? 1 : 0 });
            txt(S, pct(S, pr[k]), x + colW - 2, py, { s: 12, mono: true, align: 'right', weight: 700 });
          });
        });
      };
      drawTop(on, 1 - off, 'dat');
      drawTop(of, off, 'mute');
    });
  }
  const eq = ap(S, 'attn-off', 0.62, 0.74);
  if (eq > 0.01) caption(S, S.l('las tres predicciones, idénticas', 'all three predictions, identical'), P.x + P.w / 2, short ? P.y + 8 : P.y + P.h - 6, P.w, { align: 'center', a: eq, c: p.ink });
}

function panelMlp(S: Frame, P: Rect) {
  const { d, pal: p } = S, L = S.lang as Lang, b = passOf(L, 0).blocks[0], short = isShort(S), port = S.portrait;
  const inV = b.ln2[LAST], hid = b.hact[LAST], outV = b.mlpOut[LAST];
  const side = port ? 0 : Math.min(200, P.w * 0.26);
  const R: Rect = { x: P.x, y: P.y + 18, w: P.w - side - (side ? 20 : 0), h: P.h - 18 - (port ? 60 : 0) };
  const labW = Math.max(measure(S, S.l('8 números', '8 numbers'), 12, false, 700), measure(S, S.l('32', '32'), 12)) + 10;
  const cellW = Math.min(16, (R.w - labW) / 32), gw = cellW * 32, x0 = R.x + labW + (R.w - labW - gw) / 2;
  const ch = short ? 11 : 16, gapY = (R.h - 3 * ch) / 2.4;
  const y1 = R.y + gapY * 0.3, y2 = y1 + ch + gapY, y3 = y2 + ch + gapY;
  const w8 = cellW * 32 / 8 * 0.5, x8 = x0 + (gw - w8 * 8) / 2;
  caption(S, S.l('la red del bloque 1, con la lista de «come»', 'block 1’s network, with the list for “eats”').replace('come', VERB[L]), P.x + P.w / 2 - side / 2, P.y + 8, R.w, { align: 'center' });
  const a1 = ap(S, 'mlp', 0.12, 0.22), a2 = ap(S, 'mlp', 0.25, 0.4), a3 = ap(S, 'mlp', 0.42, 0.55);
  // abanicos
  d.withAlpha(a2 * 0.5, () => { for (let i = 0; i <= 8; i += 2) for (let j = 0; j <= 32; j += 8) d.line(x8 + Math.min(i, 7.5) * w8 + w8 / 2, y1 + ch, x0 + Math.min(j, 31.5) * cellW + cellW / 2, y2, alpha(tone(S, 'dat').c, 0.35), 1); });
  d.withAlpha(a3 * 0.5, () => { for (let j = 0; j <= 32; j += 8) for (let i = 0; i <= 8; i += 2) d.line(x0 + Math.min(j, 31.5) * cellW + cellW / 2, y2 + ch, x8 + Math.min(i, 7.5) * w8 + w8 / 2, y3, alpha(tone(S, 'dat').c, 0.35), 1); });
  d.withAlpha(a1, () => { strip(S, x8, y1, inV, w8, ch, { tone: 'lat', vmax: 2.4 }); caption(S, S.l('8 números', '8 numbers'), x8 - 8, y1 + ch / 2, labW + 40, { align: 'right' }); });
  d.withAlpha(a2, () => { strip(S, x0, y2, hid, cellW, ch, { tone: 'dat', vmax: 2 }); caption(S, '32', x0 - 8, y2 + ch / 2, labW, { align: 'right' }); if (!short) caption(S, S.l('tras la activación', 'after the activation'), x0 + gw, y2 + ch + 10, gw, { align: 'right' }); });
  d.withAlpha(a3, () => { strip(S, x8, y3, outV, w8, ch, { tone: 'dat', vmax: 2.4 }); caption(S, S.l('8 números', '8 numbers'), x8 - 8, y3 + ch / 2, labW + 40, { align: 'right' }); });
  // cada token por separado
  const a4 = ap(S, 'mlp', 0.72, 0.84);
  if (a4 > 0.01) d.withAlpha(a4, () => {
    const words = promptOf(L, 0), s = 13, h = 24;
    if (port) {
      const y = P.y + P.h - 50;
      caption(S, S.l('la misma red, un token a la vez', 'the same network, one token at a time'), P.x + P.w / 2, y, P.w, { align: 'center', c: p.ink });
      chipRow(S, words, P.x + P.w / 2, y + 12, P.w, s, h, { gap: 26 });
    } else {
      const x = P.x + P.w - side, ys = R.y + 4, cw = Math.min(64, (side - 16) / 3), gx = 8;
      caption(S, S.l('la misma red,', 'the same network,'), x + side / 2, ys, side, { align: 'center', c: p.ink });
      caption(S, S.l('un token a la vez', 'one token at a time'), x + side / 2, ys + 16, side, { align: 'center', c: p.ink });
      const x0 = x + (side - 3 * cw - 2 * gx) / 2, yy = ys + 32;
      words.forEach((w, i) => {
        const cx = x0 + i * (cw + gx);
        chip(S, cx, yy, w, { s, h, w: cw });
        S.d.arrow(cx + cw / 2, yy + h + 2, cx + cw / 2, yy + h + 11, p.mute, 1.4, 5);
        node(S, { x: cx + 4, y: yy + h + 13, w: cw - 8, h: h - 4 }, S.l('red', 'net'), { tone: 'dat', size: 12 });
      });
    }
  });
}

function panelResidual(S: Frame, P: Rect) {
  const { d, pal: p } = S, L = S.lang as Lang, b = passOf(L, 0).blocks[0], short = isShort(S), port = S.portrait;
  const xin = b.x[LAST], add = b.attnOut[LAST];
  // en «residual-name» el aporte se apaga y vuelve
  const zero = S.is('residual-name') ? mv(S, 'residual-name', 0.12, 0.3) * (1 - mv(S, 'residual-name', 0.68, 0.84)) : 0;
  const addV = add.map((v) => v * (1 - zero)), outV = xin.map((v, i) => v + addV[i]);
  const opW = port ? 16 : 30, gw = (P.w - 2 * opW) / 3, gh = Math.min(P.h - (short ? 24 : 44), port ? P.h * 0.62 : 210), gy = P.y + 4;
  const xs = [P.x, P.x + gw + opW, P.x + 2 * (gw + opW)];
  const scan = S.is('residual-demo') ? Math.floor(fr(S, 'residual-demo', 0.12, 0.82) * 8) : -1, scanA = S.is('residual-demo') ? ap(S, 'residual-demo', 0.1, 0.16) * (1 - ap(S, 'residual-demo', 0.86, 0.95)) : 0;
  const a1 = ap(S, 'residual', 0.3, 0.42), a2 = ap(S, 'residual', 0.48, 0.6), a3 = ap(S, 'residual', 0.7, 0.82);
  const labs = [S.l('lo que traía', 'what it had'), port ? S.l('aporte', 'contribution') : S.l('aporte de la atención', 'attention’s contribution'), S.l('lista nueva', 'new list')];
  vgroup(S, { x: xs[0], y: gy, w: gw, h: gh }, xin, labs[0], { a: a1, hotI: scan >= 0 ? Math.min(7, scan) : undefined, hotA: scanA });
  vgroup(S, { x: xs[1], y: gy, w: gw, h: gh }, addV, labs[1], { a: a2, tone: 'sig', hotI: scan >= 0 ? Math.min(7, scan) : undefined, hotA: scanA, labTone: 'sig' });
  vgroup(S, { x: xs[2], y: gy, w: gw, h: gh }, outV, labs[2], { a: a3, hotI: scan >= 0 ? Math.min(7, scan) : undefined, hotA: scanA });
  const oy = gy + 18 + (gh - 18) / 2;
  d.withAlpha(a2, () => txt(S, '+', xs[1] - opW / 2, oy, { s: 22, weight: 800, align: 'center', c: p.ink }));
  d.withAlpha(a3, () => txt(S, '=', xs[2] - opW / 2, oy, { s: 22, weight: 800, align: 'center', c: p.ink }));
  // la cuenta del número que se está sumando
  const ty = gy + gh + (short ? 10 : 18);
  if (scanA > 0.01 && scan >= 0) {
    const j = Math.min(7, scan);
    fitText(S, S.l(`número ${j + 1}:  ${num(S, xin[j], 2)} + ${num(S, add[j], 2)} = ${num(S, xin[j] + add[j], 2)}`, `number ${j + 1}:  ${num(S, xin[j], 2)} + ${num(S, add[j], 2)} = ${num(S, xin[j] + add[j], 2)}`), P.x + P.w / 2, ty, P.w, { s: 14, mono: true, weight: 700, align: 'center', a: scanA });
  }
  if (S.is('residual-name')) {
    const a = ap(S, 'residual-name', 0.2, 0.3) * (1 - ap(S, 'residual-name', 0.66, 0.74));
    fitText(S, S.l('aporte = 0  →  la lista pasa intacta', 'contribution = 0  →  the list passes through intact'), P.x + P.w / 2, ty, P.w, { s: 14, weight: 800, align: 'center', a, c: tone(S, 'sig').ink });
  }
}

function panelNormWhy(S: Frame, P: Rect) {
  const { pal: p } = S, L = S.lang as Lang, tr = passOf(L, 0), short = isShort(S), port = S.portrait;
  const vs = [tr.blocks[0].x[LAST], tr.blocks[1].x[LAST], tr.blocks[1].out[LAST]];
  const labs = port ? [S.l('entra al 1', 'into 1'), S.l('entra al 2', 'into 2'), S.l('sale del 2', 'out of 2')] : [S.l('entra al bloque 1', 'into block 1'), S.l('entra al bloque 2', 'into block 2'), S.l('sale del bloque 2', 'out of block 2')];
  const gap = port ? 10 : 30, gw = (P.w - 2 * gap) / 3, gh = Math.min(P.h - (short ? 22 : 44), port ? P.h * 0.62 : 210);
  vs.forEach((v, i) => {
    const a = ap(S, 'norm-why', 0.12 + i * 0.12, 0.22 + i * 0.12), m = stats(v);
    const r: Rect = { x: P.x + i * (gw + gap), y: P.y + 2, w: gw, h: gh };
    vgroup(S, r, v, labs[i], { a, line: ap(S, 'norm-why', 0.5, 0.62) > 0.01 ? m.mean : null });
    S.d.withAlpha(a * ap(S, 'norm-why', 0.5, 0.62), () => fitText(S, S.l(`centro ${num(S, m.mean, 2)}`, `center ${num(S, m.mean, 2)}`), r.x + r.w / 2, r.y + r.h + (short ? 9 : 14), r.w, { s: 13, mono: true, weight: 700, align: 'center', c: p.ink }));
  });
  if (!short) caption(S, S.l('línea punteada: el centro (promedio) de cada lista', 'dashed line: the center (average) of each list'), P.x + P.w / 2, P.y + P.h - 6, P.w, { align: 'center', a: ap(S, 'norm-why', 0.55, 0.65) });
}

function panelNorm(S: Frame, P: Rect) {
  const { pal: p } = S, L = S.lang as Lang, b = passOf(L, 0).blocks[1], short = isShort(S), port = S.portrait;
  const x = b.x[LAST], { mean, std } = stats(x), z = b.ln1s[LAST].z, y = b.ln1[LAST];
  // paso 1: restar el promedio (norm-mean); paso 2: dividir entre la desviación (norm-scale); paso 3: ajustes (norm-name)
  const k1 = S.on('norm-mean') ? mv(S, 'norm-mean', 0.4, 0.7) : 0, k2 = S.on('norm-scale') ? mv(S, 'norm-scale', 0.38, 0.68) : 0, k3 = S.on('norm-name') ? mv(S, 'norm-name', 0.3, 0.55) : 0;
  const c = x.map((v) => v - mean * k1), sc = c.map((v, i) => lerp(v, z[i], k2)), v = sc.map((q, i) => lerp(q, y[i], k3));
  const curMean = mean * (1 - k1), curStd = lerp(std, 1, k2);
  const side = port || short ? 0 : Math.min(230, P.w * 0.3);
  const gw = Math.min(P.w - side - (side ? 24 : 0), port ? P.w : 520), gh = Math.min(P.h - (port ? 74 : short ? 22 : 34), 230);
  const r: Rect = { x: P.x + (P.w - side - (side ? 24 : 0) - gw) / 2, y: P.y + 2, w: gw, h: gh };
  const band = S.on('norm-scale') ? curStd : undefined;
  vgroup(S, r, v, S.l('la lista de «come» al entrar al bloque 2', 'the list for “eats” entering block 2').replace('come', VERB[L]), { line: S.on('norm-scale') ? null : curMean, band, nums: !short, vmax: 2.4 });
  // lecturas
  const lines: [string, number][] = [
    [S.l(`promedio: ${num(S, curMean, 2)}`, `average: ${num(S, curMean, 2)}`), ap(S, 'norm-mean', 0.12, 0.24)],
    [S.l(`desviación estándar: ${num(S, curStd, 2)}`, `standard deviation: ${num(S, curStd, 2)}`), ap(S, 'norm-scale', 0.12, 0.24)],
    [S.l('+ dos ajustes aprendidos', '+ two learned adjustments'), ap(S, 'norm-name', 0.2, 0.32)],
  ];
  const hot = [hold(S, 'norm-mean', 'norm-scale', 0.1, 0.2), hold(S, 'norm-scale', 'norm-name', 0.1, 0.2), hold(S, 'norm-name', undefined, 0.15, 0.25)];
  lines.forEach(([t, a], i) => {
    if (a <= 0.01) return;
    if (side) fitText(S, t, P.x + P.w - side, P.y + 40 + i * 34, side, { s: 14, mono: i < 2, weight: hot[i] > 0.5 ? 800 : 600, c: hot[i] > 0.5 ? p.ink : p.ink2, a });
    else fitText(S, t, P.x + (port ? 0 : (i * P.w) / 3), port ? r.y + r.h + 12 + i * 18 : r.y + r.h + 10, port ? P.w : P.w / 3 - 6, { s: 13, mono: i < 2, weight: hot[i] > 0.5 ? 800 : 600, c: hot[i] > 0.5 ? p.ink : p.ink2, a });
  });
  if (S.on('norm-scale') && !short) caption(S, port ? S.l('franja: ± una desviación estándar', 'band: ± one standard deviation') : S.l('franja: una desviación estándar hacia arriba y hacia abajo', 'band: one standard deviation up and down'), P.x + P.w / 2, r.y + r.h + (port ? 66 : 26), P.w, { align: 'center', a: ap(S, 'norm-scale', 0.2, 0.3) });
  void clamp;
}

function panelFull(S: Frame, P: Rect) {
  const L = S.lang as Lang, b = passOf(L, 0).blocks[0], short = isShort(S), port = S.portrait;
  const vs = [b.x[LAST], b.mid[LAST], b.out[LAST]];
  const labs = port ? [S.l('entra', 'in'), S.l('+ atención', '+ attention'), S.l('+ red', '+ network')] : [S.l('entra', 'in'), S.l('tras sumar la atención', 'after adding attention'), S.l('tras sumar la red', 'after adding the network')];
  const ts = [0.04, 0.46, 0.88];
  const gap = port ? 10 : 30, gw = (P.w - 2 * gap) / 3, gh = Math.min(P.h - (short ? 4 : 20), port ? P.h * 0.62 : 210);
  vs.forEach((v, i) => {
    const a = ap(S, 'block-full', ts[i], ts[i] + 0.08);
    vgroup(S, { x: P.x + i * (gw + gap), y: P.y + 2, w: gw, h: gh }, v, labs[i], { a, tone: 'lat' });
  });
}

function panelStack(S: Frame, P: Rect) {
  const { d, pal: p } = S, short = isShort(S);
  const rowH = Math.min(short ? 40 : 70, P.h / 2.4), y1 = P.y + (P.h - 2 * rowH - 20) / 2, y2 = y1 + rowH + 20;
  const labW = Math.min(P.w * 0.32, 190), x0 = P.x + labW, W = P.w - labW;
  const a1 = ap(S, 'stack', 0.3, 0.42), a2 = ap(S, 'stack', 0.6, 0.72);
  const bh = rowH * 0.62;
  caption(S, S.l('un transformer apila varios bloques', 'a transformer stacks several blocks'), P.x + P.w / 2, P.y + 9, P.w, { align: 'center', a: ap(S, 'stack', 0.08, 0.2), c: p.ink2 });
  d.withAlpha(a1, () => {
    fitText(S, S.l('el juguete: 2', 'the toy: 2'), P.x, y1 + rowH / 2, labW - 10, { s: 14, weight: 700 });
    const bw = Math.min(90, W / 3);
    for (let i = 0; i < 2; i++) { node(S, { x: x0 + i * (bw + 26), y: y1 + (rowH - bh) / 2, w: bw, h: bh }, S.l(`bloque ${i + 1}`, `block ${i + 1}`), { tone: 'sig', size: 12 }); if (i === 0) d.arrow(x0 + bw + 3, y1 + rowH / 2, x0 + bw + 23, y1 + rowH / 2, p.mute, 1.5, 6); }
  });
  d.withAlpha(a2, () => {
    fitText(S, 'GPT-3: 96', P.x, y2 + rowH / 2, labW - 10, { s: 14, weight: 700 });
    const n = 96, k = mv(S, 'stack', 0.6, 0.88), cw = W / n;
    for (let i = 0; i < Math.round(n * k); i++) d.rect(x0 + i * cw, y2 + (rowH - bh) / 2, Math.max(1, cw - 1), bh, { fill: alpha(tone(S, 'sig').c, 0.55) });
  });
}
void hbar;
