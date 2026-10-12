// Acto 4: el orden. (1) La atención sola no sabe el orden: una cabeza real de nuestro modelo, sin posición, reparte igual
// si se barajan los tokens. (2) La codificación de posición: una lista por lugar, sumada al embedding; sus ondas.
// (3) La máscara causal: la frase de entrenamiento, la trampa de copiar, la tabla de atención del modelo que copia,
// las casillas tapadas y la tabla de nuestro modelo. (4) El experimento: error al entrenar y al escribir de verdad.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, arc, area, caption, chip, chipW, fitText, fr, grid, hold, isShort, measure, mv, num, pct, strip, txt } from './draw';
import { MASK_NUMS, SENT5, noPosWeights, promptOf, run, tableMasked, tableUnmasked } from './data';
import { posEnc, type Lang } from './model';

/** Fila de fichas centradas; devuelve los rectángulos. `order` = lugar visual de cada ficha (puede ser fraccionario al animar). */
function chipsAt(S: Frame, words: string[], cx: number, y: number, s: number, h: number, gap: number, o: { a?: number; active?: (i: number) => number; slot?: (i: number) => number; tone?: 'lat' | 'ink' } = {}) {
  const ws = words.map((w) => chipW(S, w, s)), slotW = Math.max(...ws) + gap, n = words.length, x0 = cx - (n * slotW - gap) / 2;
  return words.map((w, i) => {
    const k = o.slot ? o.slot(i) : i, x = x0 + k * slotW + (slotW - gap - ws[i]) / 2;
    chip(S, x, y, w, { s, h, w: ws[i], a: o.a, active: o.active?.(i), tone: o.tone });
    return { x, y, w: ws[i], h, cx: x + ws[i] / 2 };
  });
}

// ═════════ codificación de posición ═════════
export function drawPos(S: Frame) {
  const A = area(S);
  const a1 = S.on('pos-add') ? 1 - fr(S, 'pos-add', 0, 0.06) : 1;
  if (a1 > 0.01) S.d.withAlpha(a1, () => posWhy(S, A));
  const a2 = S.on('pos-add') ? ap(S, 'pos-add', 0.04, 0.12) * (S.on('pos-waves') ? 1 - fr(S, 'pos-waves', 0, 0.06) : 1) : 0;
  if (a2 > 0.01) S.d.withAlpha(a2, () => posAdd(S, A));
  const a3 = S.on('pos-waves') ? ap(S, 'pos-waves', 0.04, 0.12) : 0;
  if (a3 > 0.01) S.d.withAlpha(a3, () => posWaves(S, A));
}

function posWhy(S: Frame, A: Rect) {
  const { d, pal: p } = S, L = S.lang as Lang, short = isShort(S), port = S.portrait, words = promptOf(L, 0), shuf = [words[2], words[1], words[0]];
  const wA = noPosWeights(L, words, words[2]), wB = noPosWeights(L, shuf, words[2]);
  const side = short;   // en pantallas bajas, las dos filas lado a lado
  const s = short ? 14 : port ? 16 : 18, h = short ? 26 : port ? 32 : 36, gap = short ? 30 : 56;
  const rA: Rect = side ? { x: A.x, y: A.y + 20, w: A.w / 2 - 8, h: A.h - 20 } : { x: A.x, y: A.y + 20, w: A.w, h: (A.h - 30) / 2 };
  const rB: Rect = side ? { x: A.x + A.w / 2 + 8, y: A.y + 20, w: A.w / 2 - 8, h: A.h - 20 } : { x: A.x, y: A.y + 30 + (A.h - 30) / 2, w: A.w, h: (A.h - 30) / 2 };
  caption(S, S.l('una cabeza de nuestro modelo, sin posición', 'one head of our model, with no position'), A.x + A.w / 2, A.y + 8, A.w, { align: 'center' });
  const row = (R: Rect, ws: string[], wts: number[], label: string, a: number, wa: number, slot?: (i: number) => number) => {
    const y = R.y + R.h * 0.5 - h / 2;
    caption(S, label, R.x + R.w / 2, R.y + 10, R.w, { align: 'center', a, c: p.ink2 });
    const rs = chipsAt(S, ws, R.x + R.w / 2, y, s, h, gap, { a, slot, active: (i) => (ws[i] === words[2] ? 0.7 : 0) });
    const me = rs[ws.indexOf(words[2])];
    rs.forEach((r, j) => {
      if (r === me) return;
      arc(S, me.cx, y - 3, r.cx, y - 3, { bulge: (r.cx < me.cx ? 1 : -1) * (Math.abs(r.cx - me.cx) * 0.22 + 6), lw: 1 + 6 * wts[j], a: wa, head: 7 });
    });
    d.withAlpha(wa, () => rs.forEach((r, j) => txt(S, pct(S, wts[j]), r.cx, y + h + (short ? 12 : 16), { s: short ? 13 : 15, mono: true, weight: 800, align: 'center' })));
  };
  row(rA, words, wA, S.l('en orden', 'in order'), ap(S, 'pos-why', 0.06, 0.16), ap(S, 'pos-why', 0.14, 0.24));
  // la misma frase barajada: las fichas se mueven a su nuevo lugar
  const aB = ap(S, 'pos-why', 0.32, 0.4), mvB = mv(S, 'pos-why', 0.38, 0.55);
  const slot = (i: number) => lerp(2 - i, i, mvB);   // shuf[i] parte del lugar que tenía en la frase original
  row(rB, shuf, wB, S.l('barajada', 'shuffled'), aB, ap(S, 'pos-why', 0.58, 0.68), slot);
  const eq = ap(S, 'pos-why', 0.72, 0.82);
  if (eq > 0.01) fitText(S, S.l('mismos tokens, mismos pesos: el orden no cuenta', 'same tokens, same weights: order does not count'), A.x + A.w / 2, A.y + A.h - 6, A.w, { s: 13, weight: 800, align: 'center', a: eq, c: tone(S, 'sig').ink, halo: true });
}

function posAdd(S: Frame, A: Rect) {
  const { pal: p } = S, L = S.lang as Lang, short = isShort(S), port = S.portrait, tr = run(L, promptOf(L, 0));
  const words = promptOf(L, 0), s = short ? 13 : 14;
  const chipWm = Math.max(...words.map((w) => chipW(S, w, s))), opW = port ? 16 : 26;
  const cell = clamp((A.w - chipWm - 12 - 2 * opW) / 24, 6, 22), ch = Math.min(port ? 16 : 22, cell * 1.1);
  const rowH = Math.min(short ? 46 : 70, (A.h - 40) / 3.3), top = A.y + 34 + (A.h - 34 - 3 * rowH) / 2;
  const xE = A.x + chipWm + 12, xP = xE + 8 * cell + opW, xS = xP + 8 * cell + opW;
  const aE = ap(S, 'pos-add', 0.12, 0.24), aP = ap(S, 'pos-add', 0.38, 0.5), aS = ap(S, 'pos-add', 0.62, 0.74);
  const hy = top - (short ? 12 : 18);
  caption(S, S.l('embedding', 'embedding'), xE + 4 * cell, hy, 8 * cell + opW, { align: 'center', a: aE });
  caption(S, S.l('posición', 'position'), xP + 4 * cell, hy, 8 * cell + opW, { align: 'center', a: aP, c: tone(S, 'w').ink });
  caption(S, port ? S.l('suma', 'sum') : S.l('suma: entra al bloque', 'sum: goes into the block'), xS + 4 * cell, hy, 8 * cell + opW, { align: 'center', a: aS });
  for (let i = 0; i < 3; i++) {
    const y = top + i * rowH + rowH / 2;
    chip(S, A.x, y - 13, words[i], { s, h: 26, w: chipWm, a: aE });
    S.d.withAlpha(aE, () => strip(S, xE, y - ch / 2, tr.emb[i], cell, ch, { tone: 'lat', vmax: 1.6 }));
    S.d.withAlpha(aP, () => {
      txt(S, '+', xP - opW / 2, y, { s: 18, weight: 800, align: 'center' });
      strip(S, xP, y - ch / 2, tr.pos[i], cell, ch, { tone: 'w', vmax: 1.6 });
      if (!short) caption(S, S.l(`lugar ${i + 1}`, `place ${i + 1}`), xP + 4 * cell, y + ch / 2 + 10, 8 * cell, { align: 'center', c: tone(S, 'w').ink });
    });
    S.d.withAlpha(aS, () => { txt(S, '=', xS - opW / 2, y, { s: 18, weight: 800, align: 'center' }); strip(S, xS, y - ch / 2, tr.x0[i], cell, ch, { tone: 'lat', vmax: 1.6 }); });
  }
  if (!short) caption(S, port ? S.l('cada token lleva qué es y dónde está', 'each token carries what it is and where') : S.l('número por número: cada token lleva qué es y dónde está', 'number by number: each token carries what it is and where it is'), A.x + A.w / 2, A.y + A.h - 6, A.w, { align: 'center', a: ap(S, 'pos-add', 0.75, 0.85), c: p.ink2 });
}

function posWaves(S: Frame, A: Rect) {
  const { d, pal: p } = S, short = isShort(S), port = S.portrait, w = tone(S, 'w');
  const T = 12, PE = posEnc(T, 8);
  const labW = port ? 0 : 70, R: Rect = { x: A.x + labW, y: A.y + 24, w: A.w - labW - 8, h: A.h - (short ? 44 : 64) };
  const rh = R.h / 8, X = (pos: number) => R.x + 10 + (pos / (T - 1)) * (R.w - 20);
  const hc0 = ap(S, 'pos-waves', 0.45, 0.58);
  caption(S, port ? S.l('posición en el juguete: 8 ondas', 'position in the toy: 8 waves') : S.l('la codificación de posición de nuestro juguete: 8 ondas', 'our toy’s positional encoding: 8 waves'), A.x + A.w / 2, A.y + 8, A.w, { align: 'center', c: w.ink, a: port ? 1 - hc0 : 1 });
  if (port) caption(S, S.l('cada columna: la lista de un lugar', 'each column: the list for one place'), A.x + A.w / 2, A.y + 8, A.w, { align: 'center', c: p.ink, a: hc0 });
  const draw = mv(S, 'pos-waves', 0.08, 0.4);
  for (let k = 0; k < 8; k++) {
    const yc = R.y + k * rh + rh / 2, amp = rh * 0.38, i = k >> 1, f = Math.pow(10000, (2 * i) / 8);
    const ak = clamp(draw * 9 - k);
    if (ak <= 0.01) continue;
    d.withAlpha(ak, () => {
      d.line(R.x, yc, R.x + R.w, yc, p.line, 1);
      const pts: [number, number][] = [];
      for (let q = 0; q <= 120; q++) { const pos = (q / 120) * (T - 1), v = k % 2 === 0 ? Math.sin(pos / f) : Math.cos(pos / f); pts.push([X(pos), yc - v * amp]); }
      d.polyline(pts, alpha(w.c, 0.8), 1.6);
      for (let pos = 0; pos < T; pos++) d.circle(X(pos), yc - PE[pos][k] * amp, 2.6, { fill: w.c });
      if (labW) fitText(S, S.l(`n.º ${k + 1}`, `no. ${k + 1}`), A.x, yc, labW - 8, { s: 12, c: p.mute });
    });
  }
  // columnas: la lista de cada lugar
  const hc = ap(S, 'pos-waves', 0.45, 0.58);
  if (hc > 0.01) {
    for (let pos = 0; pos < 3; pos++) d.rect(X(pos) - 7, R.y - 2, 14, R.h + 4, { stroke: p.ink, lw: 1.6, r: 4, a: hc });
  }
  d.withAlpha(ap(S, 'pos-waves', 0.4, 0.5), () => {
    for (let pos = 0; pos < T; pos += port ? 2 : 1) caption(S, String(pos + 1), X(pos), R.y + R.h + 10, 24, { align: 'center' });
    caption(S, S.l('lugar en el texto →', 'place in the text →'), R.x + R.w, R.y + R.h + (short ? 24 : 28), 220, { align: 'right' });
  });
  if (hc > 0.01 && !short && !port) caption(S, S.l('cada columna (recuadro) es la lista de un lugar', 'each column (boxed) is the list for one place'), R.x, R.y + R.h + 28, R.w * 0.6, { a: hc, c: p.ink });
}

// ═════════ máscara causal ═════════
interface MLay { sent: Rect; table: Rect; cell: number; side: boolean }
function mlay(S: Frame): MLay {
  const A = area(S), port = S.portrait, short = isShort(S);
  if (!port) {
    const tw = Math.min(A.w * 0.46, short ? 330 : 420), sent: Rect = { x: A.x, y: A.y, w: A.w - tw - 24, h: A.h }, table: Rect = { x: A.x + A.w - tw, y: A.y, w: tw, h: A.h };
    return { sent, table, cell: short ? Math.min((tw - 70) / 5, (A.h - 40) / 5) : Math.min((tw - 80) / 5, (A.h - 90) / 5, 60), side: true };
  }
  const sent: Rect = { ...A }, table: Rect = { ...A };
  return { sent, table, cell: Math.min((A.w - 70) / 5, (A.h - 120) / 5, 58), side: false };
}

export function drawMask(S: Frame) {
  const { d, pal: p } = S, L = S.lang as Lang, M = mlay(S), short = isShort(S), words = SENT5[L], err = tone(S, 'err');
  // ── la frase de entrenamiento: lo que lee y lo que debe adivinar en cada lugar ──
  const R = M.sent, s = short ? 13 : S.portrait ? 13 : 16, h = short ? 24 : S.portrait ? 28 : 32, labW = M.side ? Math.min(R.w * 0.3, measure(S, S.l('debe adivinar', 'must guess'), 12, false, 700) + 10) : 0;
  const n = 5, slotW = Math.min((R.w - labW) / n, 110), x0 = R.x + labW, y1 = R.y + (M.side ? R.h * (short ? 0.4 : 0.3) : R.h * 0.3), y2 = y1 + h + (short ? 26 : M.side ? 34 : 44);
  // vertical: la frase ocupa todo y se desvanece cuando llega la tabla
  const sentA = M.side ? 1 : 1 - (S.on('mask-table') ? fr(S, 'mask-table', 0, 0.08) : 0);
  const drawSentence = () => {
  const cx = (i: number) => x0 + i * slotW + slotW / 2;
  const aS = ap(S, 'mask-train', 0.12, 0.25);
  const cheat = hold(S, 'mask-cheat', undefined, 0.25, 0.4), blocked = S.on('mask-cover') ? ap(S, 'mask-cover', 0.6, 0.72) : 0;
  d.withAlpha(aS, () => {
    if (M.side) caption(S, S.l('lee', 'reads'), R.x, y1 + h / 2, labW - 8, { c: p.ink2 });
    else caption(S, S.l('lee', 'reads'), R.x, y1 - 44, R.w, { c: p.ink2 });
    words.forEach((w, i) => { const cw = Math.min(slotW - 4, chipW(S, w, s)); chip(S, cx(i) - cw / 2, y1, w, { s, h, w: cw, active: i === 2 ? cheat * 0.7 : 0 }); });
  });
  const aT = ap(S, 'mask-train', 0.45, 0.58);
  d.withAlpha(aT, () => {
    if (M.side) caption(S, S.l('debe adivinar', 'must guess'), R.x, y2 + h / 2, labW - 8, { c: p.ink2 });
    else caption(S, S.l('debe adivinar', 'must guess'), R.x, y2 + h + 14, R.w, { c: p.ink2 });
    for (let i = 0; i < 4; i++) {
      const a = clamp(fr(S, 'mask-train', 0.45, 0.85) * 5 - i), w = words[i + 1], cw = Math.min(slotW - 4, chipW(S, w, s));
      if (a <= 0.01) continue;
      d.withAlpha(a, () => { d.arrow(cx(i), y1 + h + 3, cx(i), y2 - 3, p.mute, 1.4, 5); chip(S, cx(i) - cw / 2, y2, w, { s, h, w: cw, tone: 'ink', dash: true, active: i === 2 ? cheat * 0.5 : 0 }); });
    }
  });
  // la trampa: «come» mira a «pescado» (el futuro)
  if (cheat > 0.01) {
    arc(S, cx(2), y1 - 3, cx(3), y1 - 3, { bulge: -(slotW * 0.35 + 6), tone: 'err', lw: 2.6, a: cheat, head: 8 });
    fitText(S, S.l('¿copiar?', 'copy?'), (cx(2) + cx(3)) / 2, y1 - slotW * 0.2 - 18, slotW * 1.4, { s: 13, weight: 800, c: err.ink, align: 'center', a: cheat * (1 - blocked), halo: true });
    if (blocked > 0.01) { const mx = (cx(2) + cx(3)) / 2, my = y1 - slotW * 0.17 - 6, r = 9; d.withAlpha(blocked, () => { d.line(mx - r, my - r, mx + r, my + r, p.ink, 3); d.line(mx - r, my + r, mx + r, my - r, p.ink, 3); }); }
  }
  };
  if (sentA > 0.003) S.d.withAlpha(sentA, drawSentence);
  // ── la tabla de atención ──
  if (!S.on('mask-table')) return;
  const T = M.table, c = M.cell, lw = Math.max(...words.map((w) => measure(S, w, 12, false, 600))) + 10;
  const gx = T.x + Math.max(lw, (T.w - 5 * c - lw) / 2 + lw), gy = short ? T.y + 34 : T.y + (T.h - 5 * c - 62) / 2 + (M.side ? 56 : 62);
  const aG = ap(S, 'mask-table', 0.05, 0.18);
  const toMasked = S.on('mask-masked') ? mv(S, 'mask-masked', 0.1, 0.3) : 0;
  const U = tableUnmasked(L), Mk = tableMasked(L), V = U.map((r, i) => r.map((v, j) => lerp(v, Mk[i][j], toMasked)));
  const cover = (r: number, col: number) => (col > r && S.on('mask-cover') ? clamp(fr(S, 'mask-cover', 0.15, 0.5) * 4 - (col - r - 1) * 1.0) : 0);
  const hot = (r: number, col: number) => (r === 2 && col === 3 ? hold(S, 'mask-table', 'mask-cover', 0.62, 0.72) : 0);
  d.withAlpha(aG, () => {
    const title = toMasked > 0.5 ? S.l('nuestro modelo, con máscara', 'our model, with the mask') : S.l('modelo entrenado sin máscara', 'model trained without the mask');
    if (short) fitText(S, title, R.x, R.y + 10, R.w, { s: 13, weight: 800, c: toMasked > 0.5 ? tone(S, 'sig').ink : err.ink });
    else {
      fitText(S, title, gx + 2.5 * c - (M.side ? 0 : lw / 2), gy - 54, 5 * c + lw, { s: 13, weight: 800, align: 'center', c: toMasked > 0.5 ? tone(S, 'sig').ink : err.ink });
      caption(S, S.l('mirado →', 'looked at →'), gx + 2.5 * c, gy - 36, 5 * c, { align: 'center' });
    }
    const stagger = Math.max(...words.map((w) => measure(S, w, 12, false, 600))) > c - 2;
    words.forEach((w, i) => {
      const up = stagger && i % 2 === 1 ? 15 : 0;
      fitText(S, w, gx + i * c + c / 2, gy - 3 - up, stagger ? 2 * c - 4 : c, { s: 12, align: 'center', base: 'bottom', c: p.ink2 });
      fitText(S, w, gx - 6, gy + i * c + c / 2, lw, { s: 12, align: 'right', c: i === 2 ? p.ink : p.ink2, weight: i === 2 ? 800 : 600 });
    });
    if (!short) caption(S, S.l('mira ↓', 'looks ↓'), gx - 6, gy - 10, gx - T.x - 6, { align: 'right' });
    grid(S, gx, gy, V, { tone: 'sig', vmax: 1, unsigned: true, cw: c, ch: c, gap: 3, numbers: c >= 28 ? (v) => (v < 0.005 ? '0' : S.n(v * 100, 0)) : false, size: 12, masked: cover, hot });
  });
  if (c >= 28 && !short) caption(S, S.l('números: % de atención de cada fila', 'numbers: % of each row’s attention'), gx + 2.5 * c, gy + 5 * c + 12, 5 * c + lw, { align: 'center', a: aG });
  if (S.is('mask-cover') || S.is('mask-masked')) {
    const a = S.is('mask-cover') ? ap(S, 'mask-cover', 0.55, 0.68) : 1 - ap(S, 'mask-masked', 0, 0.1);
    const ty = short ? R.y + R.h - 8 : gy + 5 * c + (c >= 28 ? 30 : 14);
    fitText(S, S.l('puntuación −∞  →  softmax le da peso 0', 'score −∞  →  softmax gives it weight 0'), short ? R.x + R.w / 2 : gx + 2.5 * c, ty, short ? R.w : T.w, { s: 13, weight: 800, align: 'center', a, c: p.ink });
  }
  void num;
}

// ═════════ el experimento: error al entrenar y al escribir de verdad ═════════
export function drawMaskTest(S: Frame) {
  const { d, pal: p } = S, L = S.lang as Lang, A = area(S), short = isShort(S), port = S.portrait, N = MASK_NUMS(L), err = tone(S, 'err'), sig = tone(S, 'sig');
  const xmax = 3.5;
  const labW = port ? 0 : Math.min(A.w * 0.34, 250);
  const plot: Rect = { x: A.x + labW, y: A.y + 34, w: A.w - labW - 70, h: A.h - (short ? 54 : 80) };
  const X = (v: number) => plot.x + (v / xmax) * plot.w;
  const groups: { name: string; tone: 'err' | 'sig'; rows: [string, number, number][] }[] = [
    { name: S.l('modelo que copia (sin máscara)', 'model that copies (no mask)'), tone: 'err', rows: [[S.l('al entrenar', 'in training'), N.trainUnmasked, ap(S, 'mask-test', 0.22, 0.34)], [S.l('al escribir de verdad', 'when really writing'), N.realUnmasked, S.on('mask-real') ? ap(S, 'mask-real', 0.3, 0.45) : 0]] },
    { name: S.l('nuestro modelo (con máscara)', 'our model (with the mask)'), tone: 'sig', rows: [[S.l('al entrenar', 'in training'), N.trainMasked, ap(S, 'mask-test', 0.62, 0.74)], [S.l('al escribir de verdad', 'when really writing'), N.realMasked, S.on('mask-real') ? ap(S, 'mask-real', 0.82, 0.92) : 0]] },
  ];
  caption(S, S.l('error por palabra (pérdida): menos es mejor', 'error per word (loss): lower is better'), A.x + A.w / 2, A.y + 8, A.w, { align: 'center', c: p.ink2 });
  const gH = plot.h / 2, bh = Math.min(short ? 16 : 26, gH / 4.2);
  groups.forEach((g, gi) => {
    const gy = plot.y + gi * gH, t = tone(S, g.tone);
    const aG = Math.max(...g.rows.map((r) => r[2]));
    if (aG <= 0.01) return;
    d.withAlpha(aG, () => fitText(S, g.name, port ? A.x : A.x, gy + (port ? 8 : gH * 0.18), port ? A.w : labW + plot.w, { s: 13, weight: 800, c: t.ink }));
    g.rows.forEach(([lab, v, a], ri) => {
      if (a <= 0.01) return;
      const y = gy + (port ? 22 : gH * 0.36) + ri * (bh + (port ? 22 : 12)) + (port ? 14 : 0);
      d.withAlpha(a, () => {
        if (port) caption(S, lab, A.x, y - 9, A.w, { c: p.ink2 });
        else fitText(S, lab, A.x + labW - 10, y + bh / 2, labW - 10, { s: 13, align: 'right', c: p.ink2 });
        d.rect(plot.x, y, Math.max(2, (X(v) - plot.x) * clamp(a * 1.2)), bh, { fill: alpha(t.c, 0.7) });
        txt(S, S.n(v, 2), Math.min(X(v), plot.x + plot.w) + 8, y + bh / 2, { s: 14, mono: true, weight: 800 });
      });
    });
  });
  // eje y referencia «al azar»
  d.line(plot.x, plot.y - 4, plot.x, plot.y + plot.h, p.lineStrong, 1.5);
  const aR = S.on('mask-real') ? ap(S, 'mask-real', 0.6, 0.72) : 0;
  if (aR > 0.01) d.withAlpha(aR, () => {
    d.line(X(N.random), plot.y - 4, X(N.random), plot.y + plot.h, p.ink, 1.6, [5, 4]);
    fitText(S, S.l(`adivinar al azar: ${S.n(N.random, 2)}`, `random guessing: ${S.n(N.random, 2)}`), X(N.random), plot.y + plot.h + 12, 260, { s: 13, weight: 800, align: 'center', c: p.ink });
  });
  void err; void sig; void num;
}
