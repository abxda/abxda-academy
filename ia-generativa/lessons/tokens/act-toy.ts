// Acto 4: el tokenizador de juguete (BPE real, entrenado offline) con su deslizador de fusiones: la lista crece una pieza
// por fusión y la frase necesita menos tokens. Después, por qué no fusionar sin parar y los tamaños reales.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MERGE_COUNT, SENT, TOY_WORDS, tok, type Lg } from './data';
import { ap, area, bigReadout, caption, drawBlocks, fitBlocks, fitText, fits, fr, isShort, layBlocks, note, toyItems } from './viz';

export const mergesNow = (S: Frame) => clamp(Math.round(S.p.merges ?? 0), 0, MERGE_COUNT);

function layout(S: Frame) {
  const u = S.u, A = area(S), short = isShort(S), land = !S.portrait;
  const left: Rect = land ? { x: A.x, y: A.y, w: A.w * (short ? 0.62 : 0.6), h: A.h } : A;
  const right: Rect = land ? { x: A.x + A.w * (short ? 0.66 : 0.65), y: A.y, w: A.w * (short ? 0.34 : 0.35), h: A.h } : A;
  const headH = (short ? 20 : 40) * u, legH = (short ? 14 : 18) * u, roH = (short ? 44 : 52) * u;
  return { A, left, right, headH, legH, roH, short, land };
}

export function drawToy(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, G = layout(S);
  const m = mergesNow(S), toks = tok(SENT[L], 'mix', m), it = toyItems(toks);
  const t = tone(S, 'lat'), w = tone(S, 'w');
  const aView = 1;
  // tamaño y alto fijos: los de la frase sin fusiones (la más larga), para que nada salte al mover el deslizador
  const it0 = toyItems(tok(SENT[L], 'mix', 0));
  const portraitBottom = G.land ? 0 : G.roH + G.legH + 130 * u;
  const tokH = Math.max(50 * u, (G.land ? G.left.h - G.headH - G.legH - G.roH - 10 * u : G.A.h - G.headH - portraitBottom));
  const lay0 = fitBlocks(S, it0.labels, { w: G.left.w, h: tokH }, { size: G.short ? 15 : G.land ? 21 : 18, minSize: 12, parts: it0.parts, maxRows: 3 });
  const lay = layBlocks(S, it.labels, G.left.w, lay0.size, { parts: it.parts });
  const total = G.headH + lay0.h + 12 * u + G.legH + G.roH;
  const oy = G.land && !G.short ? Math.max(0, (G.A.h - total) * 0.4) : 0;
  // cabecera
  const aH = ap(S, 'toy', 0.03, 0.15);
  d.withAlpha(aH * aView, () => {
    fitText(S, S.l('nuestro tokenizador de juguete', 'our toy tokenizer'), G.left.x, G.left.y + oy, G.left.w, { size: G.short ? 13 : 15, weight: 800, color: t.ink });
    if (!G.short) { const long = S.l(`entrenado con ${S.n(TOY_WORDS.mix, 0)} palabras nuestras, 83 % en inglés`, `trained on ${S.n(TOY_WORDS.mix, 0)} words of ours, 83% English`), brief = S.l(`${S.n(TOY_WORDS.mix, 0)} palabras de entrenamiento, 83 % en inglés`, `${S.n(TOY_WORDS.mix, 0)} training words, 83% English`); fitText(S, fits(S, long, G.left.w, 12, 600) ? long : brief, G.left.x, G.left.y + oy + 20 * u, G.left.w, { size: 12, weight: 600, color: p.mute }); }
  });

  // la frase en tokens (con las fusiones actuales)
  const yT = G.left.y + oy + G.headH;
  const common = L === 'es' ? ['·gato', '·llama'] : ['·cat', '·named'];
  const hiC = ap(S, 'toy-result', 0.35, 0.5) * (1 - ap(S, 'size', 0, 0.1));
  drawBlocks(S, it.labels, { x: G.left.x, y: yT, w: G.left.w, h: lay0.h + 2 }, { parts: it.parts, a: ap(S, 'toy', 0.15, 0.3), hi: (i) => (common.includes(it.labels[i]) ? hiC : 0) }, lay);
  // leyenda
  const yLeg = yT + lay0.h + 6 * u;
  const aLeg = ap(S, 'toy-base', 0.3, 0.45);
  if (aLeg > 0) fitText(S, S.l('· = espacio · punteado: letra de 2 códigos', '· = space'), G.left.x, yLeg, G.left.w, { size: 12, weight: 600, color: p.ink2, a: aLeg });

  // dos cifras: piezas en la lista y tokens de la frase
  const yR = yLeg + G.legH + 6 * u, aR = ap(S, 'toy-readouts', 0.04, 0.16);
  if (aR > 0) {
    const cw = G.left.w / 2;
    const hot1 = S.is('toy-readouts') ? ap(S, 'toy-readouts', 0.1, 0.2) * (1 - ap(S, 'toy-readouts', 0.5, 0.6)) : 0;
    const hot2 = S.is('toy-readouts') ? ap(S, 'toy-readouts', 0.55, 0.65) : 0;
    bigReadout(S, G.left.x + 6 * u, yR + 6 * u, cw - 12 * u, S.l('piezas en la lista', 'pieces on the list'), S.n(256 + m, 0), 'w', { a: aR, hot: hot1, size: G.short ? 20 : 26 });
    bigReadout(S, G.left.x + cw + 6 * u, yR + 6 * u, cw - 12 * u, S.l('tokens de la frase', 'tokens in the sentence'), S.n(it.count, 0), 'lat', { a: aR, hot: hot2, size: G.short ? 20 : 26 });
  }

  // la lista como cuadrícula: 256 piezas básicas + una por fusión; y (size) la tabla de embeddings
  const aG = ap(S, 'toy-base', 0.05, 0.25);
  if (aG > 0) {
    const R: Rect = G.land ? { x: G.right.x, y: G.right.y + oy, w: G.right.w, h: G.right.h - oy } : { x: G.A.x, y: yR + G.roH + 8 * u, w: G.A.w, h: G.A.y + G.A.h - (yR + G.roH + 8 * u) };
    const aE = ap(S, 'size', 0.08, 0.25);
    const gridW = R.w * (G.land && !G.short ? 0.56 : 0.56);
    const cols = G.land && !G.short ? 24 : 32, total = 256 + MERGE_COUNT, rows = Math.ceil(total / cols);
    const cs = Math.max(2, Math.min(gridW / cols, (R.h - 22 * u) / rows)), gx = R.x, gy = R.y + 20 * u;
    d.withAlpha(aG, () => {
      caption(S, S.l(`la lista: ${S.n(256 + m, 0)} piezas`, `the list: ${S.n(256 + m, 0)} pieces`), gx, R.y, Math.max(gridW, 120 * u), { color: w.ink });
      d.rect(gx - 1, gy - 1, cols * cs + 2, rows * cs + 2, { stroke: p.line, lw: 1, dash: [2, 3] });
      const grow = fr(S, 'toy-base', 0.05, 0.4) * 256;
      for (let i = 0; i < 256 + m; i++) {
        if (i < 256 && i > grow) break;
        const cx = gx + (i % cols) * cs, cy = gy + Math.floor(i / cols) * cs;
        d.rect(cx, cy, Math.max(1, cs - 1), Math.max(1, cs - 1), { fill: i < 256 ? alpha(p.mute, 0.35) : alpha(t.c, 0.75) });
      }
      const ly = gy + rows * cs + 4 * u, lw = Math.max(cols * cs, 90 * u);
      if (ly + 30 * u < R.y + R.h + 10 * u) {
        fitText(S, S.l('gris: 256 básicas', 'gray: 256 basic'), gx, ly, lw, { size: 12, weight: 600, color: p.mute });
        fitText(S, S.l('color: nuevas', 'color: new'), gx, ly + 15 * u, lw, { size: 12, weight: 600, color: t.ink });
      }
    });
    if (aE > 0) {   // una fila de números (embedding) por pieza: la tabla crece con la lista
      const ex = gx + cols * cs + 16 * u, ew = Math.min(R.x + R.w - ex, 140 * u), maxH = rows * cs, eh = maxH * (256 + m) / total;
      if (ew > 40 * u) d.withAlpha(aE, () => {
        caption(S, S.l('embeddings', 'embeddings'), ex, R.y, ew, { color: w.ink });
        d.rect(ex, gy, ew, eh, { fill: alpha(w.c, 0.18), stroke: w.c, lw: 1.3 });
        const n = Math.round(eh / (3 * u));
        for (let k = 1; k < n; k++) d.line(ex, gy + (k * eh) / n, ex + ew, gy + (k * eh) / n, alpha(w.c, 0.35), 1);
        d.text(S.l('una fila por pieza', 'one row per piece'), ex, gy + eh + 4 * u, { size: 12, weight: 600, color: w.ink, base: 'top', w: Math.max(ew, R.x + R.w - ex) });
      });
    }
  }
}

// ═════════ tamaños reales del vocabulario ═════════
export function drawSizes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S);
  const rows = [
    { name: fits(S, S.l('nuestro juguete', 'our toy'), Math.min(140 * u, A.w * 0.3) - 10 * u, 13, 800) ? S.l('nuestro juguete', 'our toy') : S.l('juguete', 'toy'), v: 656, toy: true, at: 0.7 },
    { name: 'Llama 2', v: 32000, at: 0.16 },
    { name: 'GPT-2', v: 50257, at: 0.28 },
    { name: 'Llama 3', v: 128000, at: 0.36 },
    { name: 'GPT-4o', v: 200019, at: 0.46 },
  ];
  const footH = (short ? 16 : 34) * u, headH = 22 * u;
  const rowH = Math.min(56 * u, (A.h - headH - footH) / rows.length);
  const lw = Math.min(140 * u, A.w * 0.3), valW = 70 * u, bx = A.x + lw, bw = A.w - lw - valW;
  caption(S, S.l('tamaño del vocabulario (piezas)', 'vocabulary size (pieces)'), A.x, A.y, A.w, { a: ap(S, 'real-sizes', 0.02, 0.12) });
  rows.forEach((r, i) => {
    const y = A.y + headH + i * rowH, a = ap(S, 'real-sizes', r.at, r.at + 0.1);
    if (a <= 0) return;
    const c = tone(S, r.toy ? 'err' : 'lat'), bh = Math.min(22 * u, rowH * 0.6);
    d.withAlpha(a, () => {
      fitText(S, r.name, bx - 8 * u, y + rowH / 2 - 8 * u, lw - 10 * u, { size: 13, weight: 800, color: r.toy ? c.ink : p.ink, align: 'right' });
      d.rect(bx, y + (rowH - bh) / 2, bw, bh, { fill: p.surface2 });
      const w = Math.max(3 * u, (bw * r.v) / 200019);
      d.rect(bx, y + (rowH - bh) / 2, w, bh, { fill: r.toy ? c.c : alpha(c.c, 0.75) });
      d.text(S.n(r.v, 0), bx + w + 6 * u, y + rowH / 2, { size: 13, weight: 700, font: 'mono', color: r.toy ? c.ink : p.ink2, base: 'middle' });
      if (r.toy) { const tx = bx + w + 6 * u + d.measure(S.n(r.v, 0), { size: 13, weight: 700, font: 'mono' }) + 10 * u; fitText(S, S.l('← casi no se ve', '← barely shows'), tx, y + rowH / 2 - 8 * u, A.x + A.w - tx, { size: 12, weight: 700, color: c.ink }); }
    });
  });
  if (!short) note(S, S.l('Fuentes: informes de GPT-2, Llama 2 y Llama 3; tiktoken (GPT-4o).', 'Sources: GPT-2, Llama 2 and Llama 3 reports; tiktoken (GPT-4o).'), A.x, A.y + A.h, A.w, { a: ap(S, 'real-sizes', 0.6, 0.7), bottom: true });
}
