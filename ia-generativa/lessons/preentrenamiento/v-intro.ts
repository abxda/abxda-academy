// Gancho y objetivo: el transformer con números al azar frente a una montaña de texto; luego, una frase real del texto de
// prueba partida en tokens, tapar la siguiente pieza, destaparla, hacerlo en cada lugar, autosupervisado, la apuesta de
// Pythia antes y después de entrenar (medición real) y el ciclo del preentrenamiento.
import { alpha, clamp, ease, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import {
  ap, area, arrowP, caption, card, chip, chipW, docIcon, fitText, fr, hbar, hold, int, isShort, lineH, mark, measure, para, paraH, pct, provenance, provH, tok, txt,
} from './draw';
import { ERR0, ERR1, GUESS0, GUESS1, SENT, TARGET } from './pythia';
import { PYTHIA } from './pythia-data';

// ═════════ gancho: un transformer con números al azar y una montaña de texto ═════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), P = S.portrait;
  const titleH = lineH(S, short ? 18 : 22, 1.2) + 8;
  const body: Rect = { x: A.x, y: A.y, w: A.w, h: A.h - titleH };
  // reparto: documentos → modelo (de izquierda a derecha, o de arriba abajo en vertical)
  const gap = P ? 34 : 60;
  const docsR: Rect = P ? { x: body.x, y: body.y, w: body.w, h: (body.h - gap) * 0.5 } : { x: body.x, y: body.y, w: (body.w - gap) * 0.5, h: body.h };
  const modR: Rect = P ? { x: body.x, y: docsR.y + docsR.h + gap, w: body.w, h: body.h - docsR.h - gap } : { x: docsR.x + docsR.w + gap, y: body.y, w: body.w - docsR.w - gap, h: body.h };
  // el modelo: una caja con una cuadrícula de números al azar
  const aM = ap(S, 'hook', 0.03, 0.16);
  const capH = lineH(S, 12) + 4;
  const bw = Math.min(modR.w * 0.8, modR.h * 1.3, 300), bh = Math.min(modR.h - capH - 4, bw * 0.75);
  const bx = modR.x + (modR.w - bw) / 2, by = modR.y + (modR.h - capH - bh) / 2;
  d.withAlpha(aM, () => {
    d.rect(bx, by, bw, bh, { fill: p.surface, stroke: p.ink, lw: 2, r: 6 });
    const hh = lineH(S, 13) + 6;
    fitText(S, 'transformer', bx + bw / 2, by + hh / 2 + 2, bw - 12, { s: 14, weight: 800, mono: true, align: 'center' });
    const cols = 10, rows = 6, gx = bx + 10, gy = by + hh + 2, cw = (bw - 20) / cols, chh = (bh - hh - 12) / rows, wt = tone(S, 'w');
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = hash(r * 31 + c, 3) * 2 - 1;
      d.rect(gx + c * cw + 1, gy + r * chh + 1, cw - 2, chh - 2, { fill: alpha(wt.c, 0.08 + 0.6 * Math.abs(v)), stroke: v < 0 ? wt.c : undefined, lw: 1, dash: v < 0 ? [2, 2] : undefined });
    }
    caption(S, S.l('sus números empiezan al azar', 'its numbers start out random'), modR.x + modR.w / 2, by + bh + capH / 2 + 2, modR.w, { align: 'center' });
  });
  // la montaña de texto: documentos que se apilan
  const cols = P ? 7 : 6, rows = P ? 3 : 5, gx = 6, gy = 6;
  const dw = Math.min((docsR.w - (cols - 1) * gx) / cols, 46), dh = Math.min((docsR.h - capH - (rows - 1) * gy) / rows, dw * 1.25);
  const tw = cols * dw + (cols - 1) * gx, th = rows * dh + (rows - 1) * gy;
  const ox = docsR.x + (docsR.w - tw) / 2, oy = docsR.y + (docsR.h - capH - th) / 2;
  for (let i = 0; i < cols * rows; i++) {
    const a = ap(S, 'hook', 0.18 + (i / (cols * rows)) * 0.38, 0.24 + (i / (cols * rows)) * 0.38);
    if (a <= 0.01) continue;
    const c = i % cols, r = Math.floor(i / cols);
    docIcon(S, ox + c * (dw + gx), oy + r * (dh + gy) + (1 - a) * 8, dw, dh, i, { a });
  }
  caption(S, S.l('una montaña de texto', 'a mountain of text'), docsR.x + docsR.w / 2, oy + th + capH / 2 + 2, docsR.w, { align: 'center', a: ap(S, 'hook', 0.45, 0.6) });
  // flecha: el texto entra al modelo
  const aA = fr(S, 'hook', 0.58, 0.7);
  if (P) arrowP(S, body.x + body.w / 2, docsR.y + docsR.h + 4, body.x + body.w / 2, by - 6, { p: aA, tone: 'ink', lw: 2.2 });
  else arrowP(S, docsR.x + docsR.w + 6, body.y + body.h / 2, bx - 8, body.y + body.h / 2, { p: aA, tone: 'ink', lw: 2.2 });
  // nombre
  fitText(S, S.l('preentrenamiento', 'pretraining'), A.x + A.w / 2, A.y + A.h - titleH / 2, A.w, { s: short ? 18 : 22, weight: 800, align: 'center', a: ap(S, 'hook', 0.72, 0.86), c: tone(S, 'w').ink });
}

// ═════════ objetivo ═════════
interface Pos { x: number; y: number; w: number }
/** Fichas de la frase, en filas centradas. Las piezas que empiezan con espacio arrancan palabra (más separación). */
function sentLayout(S: Frame, A: Rect) {
  const short = isShort(S), s = short ? 13 : S.portrait ? 14 : 16, h = short ? 25 : S.portrait ? 27 : 31;
  const lab = SENT.map((t) => t.trim() || '·');
  const ws = lab.map((t, i) => (i === TARGET ? Math.max(chipW(S, t, s, true), 46) : chipW(S, t, s, true)));
  const gapW = 8, gapIn = 2, rowGap = short ? 6 : 9;
  const rows: number[][] = [[]]; let x = 0;
  ws.forEach((w, i) => {
    const g = i === 0 ? 0 : SENT[i].startsWith(' ') ? gapW : gapIn;
    if (x > 0 && x + g + w > A.w) { rows.push([]); x = 0; }
    rows[rows.length - 1].push(i); x += (x > 0 ? g : 0) + w;
  });
  const pos: Pos[] = new Array(SENT.length);
  rows.forEach((r, ri) => {
    const rw = r.reduce((acc, i, k) => acc + ws[i] + (k === 0 ? 0 : SENT[i].startsWith(' ') ? gapW : gapIn), 0);
    let cx = A.x + (A.w - rw) / 2;
    r.forEach((i, k) => { if (k > 0) cx += SENT[i].startsWith(' ') ? gapW : gapIn; pos[i] = { x: cx, y: A.y + ri * (h + rowGap), w: ws[i] }; cx += ws[i]; });
  });
  return { pos, lab, s, h, height: rows.length * h + (rows.length - 1) * rowGap };
}

/** Peso de cada etapa del objetivo (se funden entre segmentos). */
function stages(S: Frame) {
  return {
    hide: hold(S, 'obj-hide', 'obj-check'),
    check: hold(S, 'obj-check', 'obj-every'),
    every: hold(S, 'obj-every', 'obj-self'),
    self: hold(S, 'obj-self', 'obj-guess0'),
    guess: hold(S, 'obj-guess0', 'pretrain-def'),
    loop: ap(S, 'pretrain-def', 0, 0.1),
  };
}
/** Pieza tapada en el ejercicio que recorre la frase (1..18). */
const everyCur = (S: Frame) => clamp(1 + Math.floor(fr(S, 'obj-every', 0.06, 0.82) * 18), 1, SENT.length - 1);

export function drawObjective(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), short = isShort(S), st = stages(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const L = sentLayout(S, A);
  const lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const cur = everyCur(S);
  // ── la frase ──
  const revealT = ap(S, 'obj-check', 0.08, 0.26);
  L.lab.forEach((lab, i) => {
    const a0 = ap(S, 'obj-task', 0.04 + i * 0.022, 0.1 + i * 0.022);
    if (a0 <= 0.01) return;
    const hid = st.hide * (i === TARGET ? ap(S, 'obj-hide', 0.04, 0.18) : 0) + st.check * (i === TARGET ? 1 - revealT : 0) + st.every * (i === cur ? 1 : 0) + st.guess * (i === TARGET ? 1 : 0);
    const dim = st.hide * (i > TARGET ? 1 : 0) + st.check * (i > TARGET ? 1 : 0) + st.every * (i > cur ? 1 : 0) + st.guess * (i > TARGET ? 1 : 0);
    const ctx = st.hide * (i < TARGET ? 1 : 0) + st.every * (i < cur ? 1 : 0) + st.guess * (i < TARGET ? 1 : 0);
    const rev = st.check * (i === TARGET ? revealT : 0);
    const c = L.pos[i], a = a0 * (1 - 0.72 * clamp(dim)) * (1 - 0.5 * st.loop);
    d.withAlpha(a, () => {
      chip(S, c.x, c.y, lab, { s: L.s, h: L.h, w: c.w, mono: true, weight: 600, fill: 0.12 + 0.16 * clamp(ctx), tone: rev > 0.5 ? 'dat' : 'lat', active: rev * 0.4 });
      if (hid > 0.01) d.withAlpha(clamp(hid), () => {
        d.rect(c.x - 1, c.y - 1, c.w + 2, L.h + 2, { fill: p.stage });
        d.rect(c.x, c.y, c.w, L.h, { fill: alpha(er.c, 0.12), stroke: er.c, lw: 1.8, r: 3, dash: [4, 3] });
        txt(S, '?', c.x + c.w / 2, c.y + L.h / 2 + 1, { s: L.s + 2, weight: 800, c: er.ink, align: 'center' });
      });
      if (rev > 0.01) mark(S, c.x + c.w, c.y, true, 6, rev);
    });
  });
  void lt; void dt;
  // ── traducción / procedencia de la frase ──
  const gy = A.y + L.height + (short ? 6 : 10);
  const gloss = S.l('«La panadería de la calle Quinta abre a las seis, pero Marta suele llegar a las cinco.»', 'a sentence from a text written for this lesson');
  const gH = para(S, gloss, A.x, gy, A.w, { s: 12.5, c: p.mute, weight: 600, align: 'center', max: 2, a: ap(S, 'obj-task', 0.5, 0.65) * (1 - 0.5 * st.loop) });
  // ── zona inferior ──
  const top = gy + gH + (short ? 8 : 16);
  const R: Rect = { x: A.x, y: top, w: A.w, h: A.y + A.h - top };
  if (st.hide > 0.01) drawHideLegend(S, R, st.hide);
  if (st.check > 0.01) drawCheck(S, R, st.check);
  if (st.every > 0.01) drawEvery(S, R, st.every, cur);
  if (st.self > 0.01) drawSelf(S, R, st.self);
  if (st.guess > 0.01) drawGuess(S, R, st.guess);
  if (st.loop > 0.01) drawLoop(S, R, st.loop);
  if (st.guess > 0.01) provenance(S, S.l('medición real · Pythia-1.4B, puntos de control 0 y 143 000', 'real measurement · Pythia-1.4B, checkpoints 0 and 143,000'), st.guess);
}

function drawHideLegend(S: Frame, R: Rect, a: number) {
  const { d, pal: p } = S, lt = tone(S, 'lat'), er = tone(S, 'err');
  const s = 13, h = lineH(S, s) + 8, sw = 34;
  const items: [string, 'lat' | 'err'][] = [[S.l('contexto: todo lo anterior', 'context: everything before'), 'lat'], [S.l('el hueco: la pieza que el modelo apuesta', 'the gap: the piece the model bets on'), 'err']];
  const tw = Math.max(...items.map(([t]) => measure(S, t, s))) + sw + 10, x0 = R.x + Math.max(0, (R.w - tw) / 2), y0 = R.y + Math.min(20, R.h * 0.1);
  items.forEach(([t, k], i) => {
    const ai = a * ap(S, 'obj-hide', 0.2 + i * 0.22, 0.34 + i * 0.22), y = y0 + i * (h + 8), c = k === 'lat' ? lt : er;
    d.withAlpha(ai, () => {
      d.rect(x0, y + 2, sw, h - 4, { fill: alpha(c.c, k === 'lat' ? 0.28 : 0.12), stroke: c.c, lw: 1.6, r: 3, dash: k === 'err' ? [4, 3] : undefined });
      if (k === 'err') txt(S, '?', x0 + sw / 2, y + h / 2, { s: 14, weight: 800, c: c.ink, align: 'center' });
      fitText(S, t, x0 + sw + 10, y + h / 2, R.w - sw - 10, { s, weight: 700, c: p.ink });
    });
  });
}

function drawCheck(S: Frame, R: Rect, a: number) {
  const { pal: p } = S, dt = tone(S, 'dat');
  const y = R.y + Math.min(26, R.h * 0.14), aa = a * ap(S, 'obj-check', 0.3, 0.45);
  S.d.withAlpha(aa, () => {
    const t = S.l('la respuesta correcta ya venía en el texto', 'the right answer was already in the text');
    const w = Math.min(R.w, measure(S, t, 14, false, 700) + 30), x = R.x + (R.w - w) / 2;
    mark(S, x + 8, y + 10, true, 7);
    fitText(S, t, x + 26, y + 10, w - 26, { s: 14, weight: 700, c: dt.ink });
    const t2 = S.l('nadie tuvo que escribirla ni etiquetarla', 'nobody had to write it down or label it');
    fitText(S, t2, R.x + R.w / 2, y + 10 + lineH(S, 14) + 8, R.w, { s: 13, weight: 600, c: p.ink2, align: 'center', a: ap(S, 'obj-check', 0.5, 0.65) });
  });
}

function drawEvery(S: Frame, R: Rect, a: number, cur: number) {
  const { pal: p } = S, er = tone(S, 'err');
  const n = SENT.length - 1, short = isShort(S);
  S.d.withAlpha(a, () => {
    const y = R.y + Math.min(short ? 14 : 30, R.h * 0.16);
    const big = short ? 22 : 30;
    fitText(S, S.l(`ejercicio ${cur} de ${n}`, `exercise ${cur} of ${n}`), R.x + R.w / 2, y + lineH(S, big) / 2, R.w, { s: big, weight: 800, mono: true, align: 'center', c: er.ink });
    caption(S, S.l('cada pieza se adivina mirando solo las anteriores', 'each piece is guessed looking only at the ones before'), R.x + R.w / 2, y + lineH(S, big) + lineH(S, 12) / 2 + 8, R.w, { align: 'center', c: p.ink2 });
    // una tira de 18 casillas: las hechas se rellenan
    const bw = Math.min(26, (R.w - 20) / n), bh = short ? 12 : 16, bx = R.x + (R.w - bw * n) / 2, by = y + lineH(S, big) + lineH(S, 12) + 22;
    if (by + bh < R.y + R.h) for (let i = 1; i <= n; i++) {
      const done = i < cur ? 1 : i === cur ? 0.6 : 0;
      S.d.rect(bx + (i - 1) * bw + 1.5, by, bw - 3, bh, { fill: done ? alpha(er.c, 0.2 + 0.5 * done) : alpha(p.ink, 0.06), stroke: i === cur ? er.c : undefined, lw: 1.5, r: 2 });
    }
  });
}

function drawSelf(S: Frame, R: Rect, a: number) {
  const { d, pal: p } = S, short = isShort(S), P = S.portrait;
  const titleH = lineH(S, 15) + 10;
  const gap = 12, cardsH = Math.min(R.h - titleH, short ? 120 : 170);
  const cw = P ? R.w : (R.w - gap) / 2, ch = P ? (cardsH - gap) / 2 : cardsH;
  const cards: Rect[] = P ? [{ x: R.x, y: R.y, w: cw, h: ch }, { x: R.x, y: R.y + ch + gap, w: cw, h: ch }] : [{ x: R.x, y: R.y, w: cw, h: ch }, { x: R.x + cw + gap, y: R.y, w: cw, h: ch }];
  const content: [string, string, string, 'mute' | 'dat'][] = [
    [S.l('Lección 1', 'Lesson 1'), S.l('ejemplo  →  respuesta', 'example  →  answer'), S.l('la respuesta la puso una persona', 'a person wrote the answer'), 'mute'],
    [S.l('Aquí', 'Here'), S.l('lo anterior  →  la pieza siguiente', 'what came before  →  the next piece'), S.l('la respuesta ya está en el texto', 'the answer is already in the text'), 'dat'],
  ];
  content.forEach(([head, flow, note, tn], i) => {
    const r = cards[i], ai = a * ap(S, 'obj-self', 0.04 + i * 0.3, 0.16 + i * 0.3);
    if (ai <= 0.01) return;
    d.withAlpha(ai, () => {
      card(S, r, { tone: tn === 'dat' ? 'dat' : undefined });
      const lh = lineH(S, 13), inner = r.w - 20, y0 = r.y + Math.max(6, (r.h - lh * 3 - 10) / 2);
      fitText(S, head, r.x + 10, y0 + lh / 2, inner, { s: 13, weight: 800, c: tn === 'dat' ? tone(S, 'dat').ink : p.ink2 });
      fitText(S, flow, r.x + 10, y0 + lh * 1.5 + 4, inner, { s: 14, weight: 700, mono: true });
      fitText(S, note, r.x + 10, y0 + lh * 2.5 + 8, inner, { s: 13, weight: 600, c: p.ink2 });
    });
  });
  fitText(S, S.l('aprendizaje autosupervisado', 'self-supervised learning'), R.x + R.w / 2, R.y + cardsH + titleH / 2 + 4, R.w, { s: 16, weight: 800, align: 'center', c: tone(S, 'dat').ink, a: a * ap(S, 'obj-self', 0.66, 0.8) });
}

// ── la apuesta de Pythia antes y después de entrenar (medición real) ──
function drawGuess(S: Frame, R: Rect, a: number) {
  const gap = 10, w = (R.w - gap) / 2;
  const ph = Math.min(R.h, lineH(S, 12.5) * 2 + 12 + 7 * (lineH(S, 13) + 10) + lineH(S, 13) + 18), y = R.y + Math.max(0, (R.h - ph) * 0.4);
  const L: Rect = { x: R.x, y, w, h: ph }, Rr: Rect = { x: R.x + w + gap, y, w, h: ph };
  const truth = PYTHIA.guess.truth;
  panel(S, L, GUESS0, S.l('Pythia sin entrenar (números al azar)', 'Pythia untrained (random numbers)'), ERR0, truth, a * ap(S, 'obj-guess0', 0.04, 0.16), 'obj-guess0', 0.25);
  panel(S, Rr, GUESS1, S.l(`Pythia tras leer ${tok(S, 299892736000)} de tokens`, `Pythia after reading ${tok(S, 299892736000)} tokens`), ERR1, truth, a * ap(S, 'obj-guess1', 0.04, 0.16), 'obj-guess1', 0.6);
}

function panel(S: Frame, r: Rect, g: typeof GUESS0, title: string, err: number, truth: string, a: number, seg: string, errAt: number) {
  if (a <= 0.01) return;
  const { d, pal: p } = S, dt = tone(S, 'dat'), er = tone(S, 'err'), short = isShort(S);
  const pad = 8, errStr = `${S.l('error', 'error')}: ${S.n(err, 1)}`, errW = measure(S, errStr, 14, true, 800) + 8;
  // en escenarios bajos el error va junto al título, no en un pie aparte
  const titleW = r.w - 2 * pad - (short ? errW : 0);
  const titleH = paraH(S, title, titleW, { s: 12.5, weight: 800, max: short ? 1 : 2 }) + 6, footH = short ? 4 : lineH(S, 13) + 8;
  const inTop = g.top.findIndex(([t]) => t === truth);
  const rankFull = S.l(`lugar ${int(S, g.rank_true)} de ${int(S, PYTHIA.vocab)}`, `rank ${int(S, g.rank_true)} of ${int(S, PYTHIA.vocab)}`);
  const rankShort = S.l(`lugar ${int(S, g.rank_true)}`, `rank ${int(S, g.rank_true)}`);
  // cuántas filas caben sin encimarse: se muestran menos candidatas si hace falta
  const rhMin = lineH(S, 12.5) + 3, room = Math.max(3, Math.floor((r.h - titleH - footH - 10) / rhMin));
  const labW0 = Math.max(...g.top.slice(0, 5).map(([t]) => measure(S, t.trim(), 12.5, true)), measure(S, truth.trim(), 12.5, true)) + 8;
  const rankInline = inTop < 0 && r.w - 2 * pad - Math.min(r.w * 0.36, labW0) - measure(S, pct(S, g.p_true), 12, true, 700) - 16 > measure(S, rankFull, 12, false, 800);
  const extra = inTop < 0 && !rankInline ? 1 : 0;
  const nTop = inTop >= 0 ? Math.max(inTop + 1, Math.min(5, room)) : Math.max(1, Math.min(5, room - 1 - extra));
  const list = g.top.slice(0, nTop).map(([t, v]) => ({ t, v, hit: t === truth }));
  if (inTop < 0 || inTop >= nTop) list.push({ t: truth, v: g.p_true, hit: true });
  const nRows = list.length + extra;
  d.withAlpha(a, () => {
    card(S, r);
    para(S, title, r.x + pad, r.y + 6, titleW, { s: 12.5, weight: 800, max: short ? 1 : 2 });
    const rowsTop = r.y + 6 + titleH, rh = Math.max(rhMin, Math.min(lineH(S, 13) + 8, (r.h - titleH - footH - 8) / nRows));
    const labW = Math.min(r.w * 0.36, labW0);
    const valW = Math.max(...list.map((it) => measure(S, pct(S, it.v), 12, true, 700))) + 8, bw = Math.max(0, r.w - 2 * pad - labW - valW - 6);
    list.forEach((it, i) => {
      const ai = ap(S, seg, 0.08 + i * 0.05, 0.16 + i * 0.05), y = rowsTop + i * rh;
      const rankRow = it.hit && inTop < 0;
      d.withAlpha(ai, () => {
        if (it.hit) d.rect(r.x + 4, y + 1, r.w - 8, rh - 2, { fill: alpha(dt.c, 0.12), stroke: dt.c, lw: 1.2, r: 3 });
        fitText(S, it.t.trim(), r.x + pad, y + rh / 2, labW - 4, { s: 12.5, weight: it.hit ? 800 : 600, mono: true, c: it.hit ? dt.ink : p.ink2 });
        if (rankRow && rankInline) fitText(S, rankFull, r.x + pad + labW, y + rh / 2, bw, { s: 12, weight: 800, c: dt.ink });
        else if (bw > 8) hbar(S, r.x + pad + labW, y + rh * 0.25, bw, rh * 0.5, it.v / 0.3, { tone: it.hit ? 'dat' : 'lat', hot: it.hit ? 1 : 0 });
        fitText(S, pct(S, it.v), r.x + r.w - pad, y + rh / 2, valW, { s: 12, weight: 700, mono: true, c: it.hit ? dt.ink : p.ink2, align: 'right' });
        // si la respuesta no está entre las más probables y no cabe en su fila: su lugar, en una línea aparte
        if (rankRow && !rankInline) {
          const w = r.w - 2 * pad, str = measure(S, rankFull, 12, false, 800) <= w ? rankFull : rankShort;
          fitText(S, str, r.x + pad, y + rh * 1.5, w, { s: 12, weight: 800, c: dt.ink });
        }
      });
    });
    const ae = ap(S, 'obj-error', errAt - 0.1, errAt + 0.04);
    if (short) fitText(S, errStr, r.x + r.w - pad, r.y + 6 + lineH(S, 12.5) / 2, errW, { s: 14, weight: 800, mono: true, c: er.ink, align: 'right', a: ae });
    else fitText(S, errStr, r.x + r.w / 2, r.y + r.h - footH / 2 - 2, r.w - 2 * pad, { s: 14, weight: 800, mono: true, c: er.ink, align: 'center', a: ae });
  });
}

// ── el ciclo del preentrenamiento ──
function drawLoop(S: Frame, R: Rect, a: number) {
  const { d, pal: p } = S, P = S.portrait, short = isShort(S);
  const names = [S.l('corpus', 'corpus'), S.l('tapar y adivinar', 'cover and guess'), S.l('medir el error', 'measure the error'), S.l('ajustar parámetros', 'adjust parameters')];
  const tones = ['dat', 'err', 'err', 'w'] as const;
  const titleH = lineH(S, 18) + 8, foot = lineH(S, 13) + 8;
  const body: Rect = { x: R.x, y: R.y, w: R.w, h: R.h - titleH - foot };
  const cols = P ? 2 : 4, rows = P ? 2 : 1, gx = P ? 34 : 30, gy = 34;
  const bw = Math.min(170, (body.w - (cols - 1) * gx) / cols), bh = Math.min(short ? 40 : 52, (body.h - (rows - 1) * gy) / rows);
  const tw = cols * bw + (cols - 1) * gx, th = rows * bh + (rows - 1) * gy, ox = body.x + (body.w - tw) / 2, oy = body.y + (body.h - th) / 2;
  // orden en el ciclo: en vertical, 0 1 / 3 2 (en el sentido de las agujas del reloj)
  const cell = (i: number): Rect => {
    const [c, r] = P ? [[0, 0], [1, 0], [1, 1], [0, 1]][i] : [i, 0];
    return { x: ox + c * (bw + gx), y: oy + r * (bh + gy), w: bw, h: bh };
  };
  names.forEach((n, i) => {
    const ai = a * ap(S, 'pretrain-def', 0.04 + i * 0.13, 0.14 + i * 0.13), r = cell(i), t = tone(S, tones[i]);
    d.withAlpha(ai, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.12), stroke: t.c, lw: 1.6, r: 5 });
      fitText(S, n, r.x + r.w / 2, r.y + r.h / 2, r.w - 10, { s: 14, weight: 800, align: 'center', c: t.ink });
    });
    if (i > 0) {
      const q = cell(i - 1), pa = a * fr(S, 'pretrain-def', 0.02 + i * 0.13, 0.1 + i * 0.13);
      if (!P) arrowP(S, q.x + q.w + 3, q.y + q.h / 2, r.x - 4, r.y + r.h / 2, { p: pa, tone: 'ink', a });
      else if (i === 1) arrowP(S, q.x + q.w + 3, q.y + q.h / 2, r.x - 4, r.y + r.h / 2, { p: pa, tone: 'ink', a });
      else if (i === 2) arrowP(S, q.x + q.w / 2, q.y + q.h + 3, r.x + r.w / 2, r.y - 4, { p: pa, tone: 'ink', a });
      else arrowP(S, q.x - 3, q.y + q.h / 2, r.x + r.w + 4, r.y + r.h / 2, { p: pa, tone: 'ink', a });
    }
  });
  // de vuelta: ajustar → tapar y adivinar (otra vez)
  const back = a * fr(S, 'pretrain-def', 0.55, 0.65), c1 = cell(1), c3 = cell(3);
  if (back > 0.01) {
    if (!P) {
      const yb = c1.y + c1.h + Math.min(22, gy * 0.6);
      d.withAlpha(back, () => { d.line(c3.x + c3.w / 2, c3.y + c3.h + 3, c3.x + c3.w / 2, yb, p.ink, 1.8); d.line(c3.x + c3.w / 2, yb, c1.x + c1.w / 2, yb, p.ink, 1.8); });
      arrowP(S, c1.x + c1.w / 2, yb, c1.x + c1.w / 2, c1.y + c1.h + 4, { p: 1, tone: 'ink', a: back });
    } else arrowP(S, c3.x + c3.w * 0.8, c3.y - 3, c1.x + c1.w * 0.2, c1.y + c1.h + 4, { p: back, tone: 'ink', a });
  }
  const capT = S.l('× miles de millones de veces', '× billions of times'), aCap = a * ap(S, 'pretrain-def', 0.6, 0.72);
  if (!P) {   // en horizontal, el rótulo va sobre la flecha de vuelta
    const yb = c1.y + c1.h + Math.min(22, gy * 0.6), cx = (c1.x + c1.w / 2 + c3.x + c3.w / 2) / 2, tw = measure(S, capT, 13, true, 700) + 16;
    d.withAlpha(aCap, () => { d.rect(cx - tw / 2, yb - lineH(S, 13) / 2 - 2, tw, lineH(S, 13) + 4, { fill: p.stage }); txt(S, capT, cx, yb, { s: 13, weight: 700, mono: true, c: p.ink2, align: 'center' }); });
  } else fitText(S, capT, R.x + R.w / 2, body.y + body.h + foot / 2, R.w, { s: 13, weight: 700, mono: true, c: p.ink2, align: 'center', a: aCap });
  fitText(S, S.l('preentrenamiento', 'pretraining'), R.x + R.w / 2, R.y + R.h - titleH / 2, R.w, { s: 18, weight: 800, align: 'center', c: tone(S, 'w').ink, a: a * ap(S, 'pretrain-def', 0.78, 0.9) });
  void ease;
}
