// Acto B (roles → try1): consultas, claves y valores con números pequeños, el plano, el producto punto, la escala, el softmax,
// la mezcla de valores y la fórmula. Todo se calcula en vivo con `attend()` (producto punto, escala, softmax, suma ponderada);
// lo ilustrativo son los números de partida (hechos a mano) y los nombres de los ejes del plano de valores.
import { Plot, alpha, badge, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ATT_IT, D, I, K, N, Q, Q_IT, QR, TOK, V, X_IT, attend, dot, type Att, type V2 } from './data';
import { actAlpha, diamond, fitSize, fs, num, pct, placeLabels, squareIn, textBlock, title, vecCells, type LabelItem } from './ui';

const TQ: Tone = 'sig', TK: Tone = 'lat', TV: Tone = 'dat';
const PAQUETE = I.pkg;

// ───────────────────────────── geometría ─────────────────────────────
export interface QLay { A: Rect; B: Rect; sq: Rect; cap: number; T: Rect; head: number; rowH: number; gap: number }
/** A = lienzo izquierdo (tarjetas / plano), B = derecho (tabla); en teléfono vertical, A arriba y B abajo. */
export function qLayout(S: Frame): QLay {
  const u = S.u, all = inset(S.full(), 14 * u), gap = 10 * u;
  let A: Rect, B: Rect;
  if (S.portrait) {
    const hA = Math.round(all.h * 0.49);
    A = { x: all.x, y: all.y, w: all.w, h: hA };
    B = { x: all.x, y: all.y + hA + gap, w: all.w, h: all.h - hA - gap };
  } else {
    const wA = Math.round((all.w - gap) * 0.5);
    A = { x: all.x, y: all.y, w: wA, h: all.h };
    B = { x: all.x + wA + gap, y: all.y, w: all.w - wA - gap, h: all.h };
  }
  const head = 24;
  const rowH = clamp((B.h - head) / 10, 15, 30);
  const th = head + 10 * rowH;
  const T: Rect = { x: B.x, y: S.portrait ? B.y : B.y + Math.max(0, (B.h - th) / 2), w: B.w, h: th };
  const cap = 20 * u;   // franja inferior del lienzo izquierdo: rótulo de lo que se ve
  return { A, B, sq: squareIn({ x: A.x, y: A.y, w: A.w, h: A.h - cap }), cap, T, head, rowH, gap };
}
/** Plano de consulta y clave (el mismo en la escena y en el puntero). */
export const qPlot = (S: Frame, L: QLay = qLayout(S)) => new Plot(S, L.sq, { xr: [-QR, QR], yr: [-QR, QR], pad: { l: 3, r: 3, t: 3, b: 3 } });

// ───────────────────────────── tabla de palabras ─────────────────────────────
interface TG { wordW: number; cw: number; ch: number; rowY: (i: number) => number; size: number }
function tg(S: Frame, L: QLay): TG {
  const u = S.u, size = fs(S, 12), T = L.T;
  const words = TOK[S.lang], wordW = Math.max(...words.map((w) => S.d.measure(w, { size, weight: 700 }))) + 10 * u;
  const cw = clamp((T.w - wordW - 24 * u) / 6 - 2 * u, 24, 40);
  return { wordW, cw, ch: Math.min(L.rowH - 3, 22 * u), rowY: (i) => T.y + L.head + i * L.rowH + L.rowH / 2, size };
}
function drawWords(S: Frame, L: QLay, g: TG, a: number, usedW: number) {
  const { d, pal: p } = S, sig = tone(S, 'sig'), T = L.T, words = TOK[S.lang];
  d.withAlpha(a, () => {
    words.forEach((w, i) => {
      const y = g.rowY(i);
      if (i === I.it) d.rect(T.x - 3, y - L.rowH / 2 + 1, usedW + 6, L.rowH - 2, { fill: alpha(sig.c, 0.1), stroke: alpha(sig.c, 0.55), lw: 1.25, r: 3 });
      d.text(w, T.x + 2, y, { size: g.size, weight: i === I.it ? 800 : 600, color: i === I.it ? sig.ink : p.ink2, base: 'middle' });
    });
  });
}

/** Fase «qkv»: palabra | q | k | v (los nueve vectores de cada tipo). `hot` atenúa los otros y enmarca la columna. */
function drawTableQKV(S: Frame, L: QLay, a: number, hot: 'q' | 'k' | 'v' | null) {
  const { d } = S, u = S.u, g = tg(S, L), T = L.T, groups: [string, V2[], Tone][] = [['q', Q, TQ], ['k', K, TK], ['v', V, TV]];
  const gw = 2 * g.cw + 2 * u, step = gw + 8 * u, gx = (i: number) => T.x + g.wordW + 4 * u + i * step;
  d.withAlpha(a, () => {
    drawWords(S, L, g, 1, g.wordW + 4 * u + 3 * step - 8 * u);
    groups.forEach(([id, M, t], gi) => {
      const dim = hot && hot !== id ? 0.32 : 1, tc = tone(S, t);
      d.withAlpha(dim, () => {
        d.text(id, gx(gi) + gw / 2, T.y + L.head / 2, { size: fs(S, 14), weight: 800, color: tc.ink, align: 'center', base: 'middle', font: 'mono' });
        M.forEach((v, i) => vecCells(S, gx(gi), g.rowY(i), v, { tone: t, cw: g.cw / u, h: g.ch / u, strong: i === I.it, size: fs(S, 12), digits: 1 }));
      });
      if (hot === id) d.rect(gx(gi) - 4, T.y + 2, gw + 8, L.head + 10 * L.rowH - 4, { stroke: tc.c, lw: 2, r: 4 });
    });
  });
}

/** Fase «score»: palabra | q·k | ÷√d | peso. Cada columna aparece cuando la narración la nombra. */
function drawTableScore(S: Frame, L: QLay, a: number, att: Att, o: { rows: number; scaled: number; weights: number; scan: number; sum: boolean }) {
  const { d, pal: p } = S, u = S.u, g = tg(S, L), T = L.T, sig = tone(S, 'sig');
  const colW = clamp(T.w * 0.13, 38 * 1, 54), x1 = T.x + g.wordW + colW, x2 = x1 + colW + 2 * u;
  const barX = x2 + 8 * u, pctW = 34 * u, barW = Math.max(20, T.x + T.w - pctW - barX);
  const hy = T.y + L.head / 2, size = g.size;
  const sd = Math.sqrt(D);
  // el resaltado de la fila crece con las columnas que ya se mostraron
  const usedW = g.wordW + colW + 8 * u + o.scaled * (colW + 2 * u) + o.weights * (T.w - (g.wordW + 2 * colW + 2 * u + 8 * u));
  d.withAlpha(a, () => {
    drawWords(S, L, g, 1, usedW);
    d.withAlpha(clamp(o.rows), () => d.text('q·k', x1, hy, { size: fs(S, 13), weight: 800, color: p.ink2, align: 'right', base: 'middle', font: 'mono' }));
    d.withAlpha(o.scaled, () => d.text(S.lang === 'es' ? '÷√2' : '÷√2', x2, hy, { size: fs(S, 13), weight: 800, color: p.ink2, align: 'right', base: 'middle', font: 'mono' }));
    d.withAlpha(o.weights, () => d.text(S.l('peso', 'weight'), barX, hy, { size: fs(S, 13), weight: 800, color: sig.ink, base: 'middle' }));
    for (let i = 0; i < N; i++) {
      const y = g.rowY(i);
      d.withAlpha(clamp(o.rows) * clamp(o.scan - i + 1), () => {
        const neg = att.raw[i] < 0;
        d.text(num(S, att.raw[i], 1), x1, y, { size, weight: 700, font: 'mono', color: neg ? p.mute : p.ink, align: 'right', base: 'middle' });
      });
      d.withAlpha(o.scaled, () => d.text(num(S, att.scaled[i], 2), x2, y, { size, weight: 700, font: 'mono', color: att.scaled[i] < 0 ? p.mute : p.ink, align: 'right', base: 'middle' }));
      d.withAlpha(o.weights, () => {
        const w = att.w[i], bh = Math.min(L.rowH - 6, 14 * u);
        d.rect(barX, y - bh / 2, barW, bh, { fill: p.surface2 });
        d.rect(barX, y - bh / 2, Math.max(1, barW * w * o.weights), bh, { fill: i === I.it ? alpha(sig.c, 0.4) : sig.c });
        d.text(pct(S, w) + ' %', T.x + T.w, y, { size, weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
      });
    }
    if (o.sum) d.withAlpha(o.weights, () => d.text(S.l('suma = 100 %', 'sum = 100 %'), T.x + T.w, T.y + L.head + 10 * L.rowH - L.rowH / 2, { size, weight: 700, color: sig.ink, align: 'right', base: 'middle' }));
  });
}

/** Fase «mix»: palabra | peso | v, y debajo la suma ponderada (el nuevo vector). */
function drawTableMix(S: Frame, L: QLay, a: number, att: Att, grow: number, sumA: number, hot: number) {
  const { d, pal: p } = S, u = S.u, g = tg(S, L), T = L.T, sig = tone(S, 'sig');
  const vW = 2 * g.cw + 2 * u, vx = T.x + T.w - vW, barX = T.x + g.wordW + 4 * u, pctW = 34 * u, barW = Math.max(20, vx - 8 * u - pctW - barX);
  const hy = T.y + L.head / 2, size = g.size;
  d.withAlpha(a, () => {
    drawWords(S, L, g, 1, T.w);
    d.text(S.l('peso', 'weight'), barX, hy, { size: fs(S, 13), weight: 800, color: sig.ink, base: 'middle' });
    d.text('v', vx + vW / 2, hy, { size: fs(S, 14), weight: 800, color: tone(S, TV).ink, align: 'center', base: 'middle', font: 'mono' });
    for (let i = 0; i < N; i++) {
      const y = g.rowY(i), w = att.w[i], bh = Math.min(L.rowH - 6, 14 * u);
      d.rect(barX, y - bh / 2, barW, bh, { fill: p.surface2 });
      d.rect(barX, y - bh / 2, Math.max(1, barW * w), bh, { fill: sig.c });
      d.text(pct(S, w) + ' %', barX + barW + pctW, y, { size, weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
      d.withAlpha(0.35 + 0.65 * clamp(w * 6) * grow + 0.0, () => vecCells(S, vx, y, V[i], { tone: TV, cw: g.cw / u, h: g.ch / u, size: fs(S, 12), digits: 1, strong: w > 0.05 }));
    }
    d.withAlpha(sumA, () => {
      const y = g.rowY(9);
      d.line(T.x, y - L.rowH / 2, T.x + T.w, y - L.rowH / 2, p.lineStrong, 1.5);
      d.text(S.l('Σ peso × v =', 'Σ weight × v ='), barX + barW + pctW - 2 * u - vW - 8 * u, y, { size, weight: 800, color: sig.ink, align: 'right', base: 'middle' });
      vecCells(S, vx, y, att.out, { tone: TQ, cw: g.cw / u, h: g.ch / u, size: fs(S, 12), digits: 2, strong: true });
      if (hot > 0.01) d.rect(vx - 3, y - g.ch / 2 - 3, vW + 6, g.ch + 6, { stroke: p.ink, lw: 2.5, r: 3, a: hot });
    });
  });
}

// ───────────────────────────── lienzo izquierdo ─────────────────────────────
/** Rótulo bajo el lienzo izquierdo (qué se está viendo). */
function caption(S: Frame, L: QLay, str: string, a = 1) {
  const A = L.A;
  S.d.text(str, A.x + A.w / 2, A.y + A.h - L.cap / 2 + 2 * S.u, { size: fs(S, 12), weight: 600, color: S.pal.mute, align: 'center', base: 'middle', a, w: A.w });
}

/** Tarjetas de «este»: el vector de entrada y los tres vectores que salen de él (q, k, v). */
function drawCards(S: Frame, L: QLay, a: number, hot: 'q' | 'k' | 'v' | null) {
  const { d, pal: p } = S, u = S.u, A = L.A, w = tone(S, 'w'), lat = tone(S, 'lat');
  const items: [string, V2, Tone, string, string, string][] = [
    ['q', Q_IT, TQ, S.l('qué busca', 'what it seeks'), 'W_Q', 'q'],
    ['k', K[I.it], TK, S.l('cómo se le encuentra', 'how it is found'), 'W_K', 'k'],
    ['v', V[I.it], TV, S.l('qué aporta', 'what it gives'), 'W_V', 'v'],
  ];
  const size = fs(S, 12);
  d.withAlpha(a, () => {
    if (S.portrait) {
      const cardW = (A.w - 2 * 8 * u) / 3, cardH = A.h - 90 * u, top = A.y + 66 * u;
      // entrada
      const xb = { x: A.x + A.w / 2 - 70 * u, y: A.y + 2 * u, w: 140 * u, h: 40 * u };
      d.rect(xb.x, xb.y, xb.w, xb.h, { fill: lat.soft, stroke: lat.c, lw: 1.5, r: 3 });
      d.text(S.l('«este»', '“it”'), xb.x + 8 * u, xb.y + xb.h / 2, { size, weight: 700, color: lat.ink, base: 'middle' });
      vecCells(S, xb.x + xb.w - 2 * 34 * u - 10 * u, xb.y + xb.h / 2, X_IT, { tone: 'lat', cw: 32, h: 22, strong: true, size });
      items.forEach(([id, v, t, cap, mat], i) => {
        const cx = A.x + i * (cardW + 8 * u), tc = tone(S, t), dim = hot && hot !== id ? 0.3 : 1;
        d.withAlpha(dim, () => {
          d.line(xb.x + xb.w / 2, xb.y + xb.h, cx + cardW / 2, top, w.c, 1.6);
          d.rect(cx, top, cardW, cardH, { fill: alpha(tc.c, 0.1), stroke: tc.c, lw: hot === id ? 2.5 : 1.5, r: 3 });
          d.text(id, cx + 8 * u, top + 6 * u, { size: fs(S, 24), weight: 800, color: tc.ink, base: 'top', font: 'mono' });
          d.text('× ' + mat, cx + cardW - 6 * u, top + 8 * u, { size, weight: 700, color: w.ink, align: 'right', base: 'top', font: 'mono' });
          vecCells(S, cx + (cardW - (2 * 32 + 2) * u) / 2, top + 66 * u, v, { tone: t, cw: 32, h: 22, strong: true, size });
          d.text(cap, cx + cardW / 2, top + cardH - 8 * u, { size, weight: 600, color: p.ink2, align: 'center', base: 'bottom', w: cardW - 8 * u });
        });
      });
    } else {
      const xw = Math.min(118 * u, A.w * 0.3), xb = { x: A.x + 4 * u, y: A.y + A.h / 2 - 34 * u, w: xw, h: 68 * u };
      d.rect(xb.x, xb.y, xb.w, xb.h, { fill: lat.soft, stroke: lat.c, lw: 1.5, r: 3 });
      d.text(S.l('«este»', '“it”'), xb.x + xb.w / 2, xb.y + 14 * u, { size, weight: 700, color: lat.ink, align: 'center', base: 'middle' });
      vecCells(S, xb.x + (xb.w - (2 * 32 + 2) * u) / 2, xb.y + 44 * u, X_IT, { tone: 'lat', cw: 32, h: 22, strong: true, size });
      const cx = A.x + Math.max(xw + 54 * u, A.w * 0.36), cardW = A.x + A.w - cx, cardH = Math.min(96 * u, (A.h - 24 * u) / 3), gapC = (A.h - 3 * cardH) / 4;
      items.forEach(([id, v, t, cap, mat], i) => {
        const cy = A.y + gapC + i * (cardH + gapC), tc = tone(S, t), dim = hot && hot !== id ? 0.3 : 1;
        d.withAlpha(dim, () => {
          d.line(xb.x + xb.w, xb.y + xb.h / 2, cx, cy + cardH / 2, w.c, 1.6);
          d.rect(cx, cy, cardW, cardH, { fill: alpha(tc.c, 0.1), stroke: tc.c, lw: hot === id ? 2.5 : 1.5, r: 3 });
          d.text(id, cx + 10 * u, cy + cardH / 2, { size: fs(S, 30), weight: 800, color: tc.ink, base: 'middle', font: 'mono' });
          vecCells(S, cx + 44 * u, cy + cardH * 0.33, v, { tone: t, cw: 32, h: 22, strong: true, size });
          d.text(cap, cx + 44 * u, cy + cardH * 0.7, { size, weight: 600, color: p.ink2, base: 'middle', w: cardW - 50 * u });
          d.text('× ' + mat, cx + cardW - 8 * u, cy + 8 * u, { size, weight: 700, color: w.ink, align: 'right', base: 'top', font: 'mono' });
        });
      });
    }
    caption(S, L, S.l('números ilustrativos, hechos a mano', 'illustrative numbers, made up by hand'));
  });
}

interface PlaneOpts { q: V2; att: Att; signs: boolean; weights: number; scan: number; zero: number; dotKey: number; qHandle: number; drag: boolean; hint: boolean }
/** El plano: claves (puntos), consulta (flecha con asa), línea de producto punto cero y pesos como aros. */
function drawPlane(S: Frame, L: QLay, a: number, o: PlaneOpts) {
  const { d, pal: p } = S, u = S.u, plot = qPlot(S, L), r = plot.r, lat = tone(S, 'lat'), sig = tone(S, 'sig');
  const words = TOK[S.lang];
  d.withAlpha(a, () => {
    d.rect(L.sq.x, L.sq.y, L.sq.w, L.sq.h, { fill: p.surface, stroke: p.line, lw: 1.25, r: 3 });
    for (let k = -QR + 1; k < QR; k++) { if (k !== 0) { plot.line(k, -QR, k, QR, p.line, 1); plot.line(-QR, k, QR, k, p.line, 1); } }
    plot.line(-QR, 0, QR, 0, p.lineStrong, 1.5); plot.line(0, -QR, 0, QR, p.lineStrong, 1.5);
    const qn = Math.hypot(o.q[0], o.q[1]) || 1, qx = o.q[0] / qn, qy = o.q[1] / qn;
    // semiplano positivo y línea de producto punto cero (perpendicular a q)
    if (o.zero > 0 && qn > 0.01) {
      d.withAlpha(o.zero, () => {
        const tx = -qy, ty = qx, B = 12;
        const poly: [number, number][] = [[tx * B, ty * B], [tx * B + qx * B, ty * B + qy * B], [-tx * B + qx * B, -ty * B + qy * B], [-tx * B, -ty * B]].map(([x, y]) => [plot.X(x), plot.Y(y)] as [number, number]);
        plot.clip(() => d.polygon(poly, { fill: alpha(sig.c, 0.08) }));
        plot.line(tx * B, ty * B, -tx * B, -ty * B, p.ink2, 1.6, [6, 5]);
      });
    }
    // claves
    const items: LabelItem[] = [];
    for (let j = 0; j < N; j++) {
      const x = plot.X(K[j][0]), y = plot.Y(K[j][1]), neg = o.signs && o.att.raw[j] < 0, w = o.att.w[j] * o.weights;
      const rr = (5 + 13 * Math.sqrt(w)) * u;
      if (o.dotKey === j) plot.line(0, 0, K[j][0], K[j][1], lat.c, 2.2);
      if (o.scan >= 0 && Math.floor(o.scan) === j) d.circle(x, y, rr + 6 * u, { stroke: p.ink, lw: 2 });
      if (w > 0.02) d.circle(x, y, rr + 3 * u, { fill: alpha(sig.c, 0.18 + 0.5 * Math.min(1, w * 1.5)), stroke: alpha(sig.c, 0.9), lw: 1.5 });
      if (neg) d.circle(x, y, 5.5 * u, { fill: p.surface, stroke: lat.c, lw: 2.2 });
      else d.circle(x, y, 5.5 * u, { fill: lat.c, stroke: p.surface, lw: 1.5 });
      const pr = (o.weights > 0 ? w * 20 : 0) + (j === o.dotKey ? 5 : 0) + (j === I.it ? -1 : 0) + 1;
      items.push({ x, y, r: Math.max(rr + 3 * u, 6 * u), text: words[j] + (o.weights > 0.5 && w >= 0.05 ? ' ' + pct(S, w) + '%' : ''), prio: pr, color: lat.c, ink: lat.ink });
    }
    // consulta
    const tipX = plot.X(o.q[0]), tipY = plot.Y(o.q[1]), ox = plot.X(0), oy = plot.Y(0);
    if (o.qHandle > 0 && qn > 0.01) {
      d.arrow(ox, oy, tipX, tipY, sig.c, 3.2, 11);
      d.circle(tipX, tipY, 7 * u, { fill: sig.c, stroke: p.surface, lw: 2.2 });
      if (o.hint) { const pu = 0.5 + 0.5 * Math.sin(S.clock * 3.2); d.circle(tipX, tipY, (11 + 6 * pu) * u, { stroke: sig.c, lw: 2, a: 0.7 }); }
      if (o.drag) d.circle(tipX, tipY, 12 * u, { stroke: p.ink, lw: 1.5 });
      items.push({ x: tipX, y: tipY, r: 12 * u, text: S.l('q de «este»', 'q of “it”'), prio: 40, color: sig.c, ink: sig.ink, weight: 800 });
    } else if (qn <= 0.01) {
      d.circle(ox, oy, 7 * u, { fill: sig.c, stroke: p.surface, lw: 2 });
    }
    const sg = (x: number, y: number): Rect => ({ x: x - 10 * u, y: y - 10 * u, w: 20 * u, h: 20 * u });
    placeLabels(S, items, { x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4 }, o.zero > 0.5 ? [sg(plot.X(qx * 2.78), plot.Y(qy * 2.78)), sg(plot.X(-qx * 2.78), plot.Y(-qy * 2.78))] : []);
    if (o.zero > 0.5) {
      const px = plot.X(qx * 2.78), py = plot.Y(qy * 2.78), mx = plot.X(-qx * 2.78), my = plot.Y(-qy * 2.78);
      d.withAlpha(o.zero, () => {
        d.text('+', px, py, { size: fs(S, 20), weight: 800, color: sig.ink, align: 'center', base: 'middle', halo: p.surface, haloW: 4 });
        d.text('−', mx, my, { size: fs(S, 20), weight: 800, color: p.mute, align: 'center', base: 'middle', halo: p.surface, haloW: 4 });
      });
    }
    caption(S, L, S.l('plano de consulta (flecha) y clave (puntos)', 'query (arrow) and key (points) plane'));
  });
}

/** El plano de valores: cada palabra aporta su valor con el tamaño de su peso; el resultado cae en el promedio. */
function drawValues(S: Frame, L: QLay, a: number, att: Att, o: { grow: number; res: number; lines: number; read: number }) {
  const { d, pal: p } = S, u = S.u, sq = L.sq, dat = tone(S, 'dat'), sig = tone(S, 'sig');
  const plot = new Plot(S, sq, { xr: [-0.22, 1.28], yr: [-0.22, 1.28], pad: { l: 3, r: 3, t: 3, b: 3 } });
  const words = TOK[S.lang];
  d.withAlpha(a, () => {
    d.rect(sq.x, sq.y, sq.w, sq.h, { fill: p.surface, stroke: p.line, lw: 1.25, r: 3 });
    plot.line(-0.22, 0, 1.28, 0, p.lineStrong, 1.5); plot.line(0, -0.22, 0, 1.28, p.lineStrong, 1.5);
    plot.line(1, -0.03, 1, 0.03, p.lineStrong, 1.5); plot.line(-0.03, 1, 0.03, 1, p.lineStrong, 1.5);
    d.text('1', plot.X(1), plot.Y(0) + 6 * u, { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    d.text('1', plot.X(0) - 6 * u, plot.Y(1), { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    const ox = plot.X(att.out[0]), oy = plot.Y(att.out[1]), items: LabelItem[] = [];
    // líneas del promedio: del resultado a cada valor, con grosor según el peso
    d.withAlpha(o.lines, () => att.w.forEach((w, j) => { if (w >= 0.03) plot.line(att.out[0], att.out[1], V[j][0], V[j][1], dat.c, 1 + 7 * w, [5, 4], 0.8); }));
    for (let j = 0; j < N; j++) {
      const w = att.w[j], rr = (3.5 + 11 * Math.sqrt(w) * o.grow) * u, x = plot.X(V[j][0]), y = plot.Y(V[j][1]);
      diamond(S, x, y, rr, { fill: alpha(dat.c, 0.25 + 0.6 * Math.min(1, w * 2 * o.grow)), stroke: dat.c, lw: 1.6 });
      if (w >= (S.portrait ? 0.15 : 0.04)) items.push({ x, y, r: rr, text: words[j] + ' ' + pct(S, w) + '%', prio: w * 10, color: dat.c, ink: dat.ink });
    }
    d.withAlpha(o.res, () => {
      d.circle(ox, oy, 9 * u, { fill: sig.c, stroke: p.surface, lw: 2.5 });
      d.circle(ox, oy, 15 * u, { stroke: sig.c, lw: 1.5 });
      items.push({ x: ox, y: oy, r: 15 * u, text: S.l('«este» nuevo', 'new “it”'), prio: 50, color: sig.c, ink: sig.ink, weight: 800 });
    });
    // «meaning»: las coordenadas del resultado sobre cada eje (cuánto de «cosa» y cuánto de «agente»)
    d.withAlpha(o.read, () => {
      d.line(ox, oy, ox, plot.Y(0), sig.c, 1.6, [4, 3]); d.line(ox, oy, plot.X(0), oy, sig.c, 1.6, [4, 3]);
      d.text(num(S, att.out[0], 2), ox, plot.Y(0) + 5 * u, { size: fs(S, 12), weight: 800, font: 'mono', color: sig.ink, align: 'center', base: 'top', halo: p.surface, haloW: 4 });
      d.text(num(S, att.out[1], 2), plot.X(0) - 5 * u, oy, { size: fs(S, 12), weight: 800, font: 'mono', color: sig.ink, align: 'right', base: 'middle', halo: p.surface, haloW: 4 });
    });
    placeLabels(S, items, { x: plot.r.x + 2, y: plot.r.y + 2, w: plot.r.w - 4, h: plot.r.h - 4 }, o.read > 0.2 ? [{ x: ox - 18 * u, y: plot.Y(0) + 2 * u, w: 36 * u, h: 18 * u }, { x: plot.X(0) - 40 * u, y: oy - 9 * u, w: 36 * u, h: 18 * u }] : []);
    caption(S, L, o.read > 0.5 ? S.l('sobre todo «paquete», con algo de «robot»', 'mostly “package”, with some “robot”') : S.l('valores · x: cosa, y: agente (ilustrativo)', 'values · x: thing, y: agent (illustrative)'));
  });
}

/** Tarjeta del producto punto de «este» con «paquete» (segmento «dot»). */
function drawCalc(S: Frame, L: QLay, a: number) {
  const { d, pal: p } = S, u = S.u, B = L.B, k = K[PAQUETE], q = Q_IT, sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const t1 = q[0] * k[0], t2 = q[1] * k[1], tot = dot(q, k);
  const lines: string[] = [`(${num(S, q[0], 1)} × ${num(S, k[0], 1)}) + (${num(S, q[1], 1)} × ${num(S, k[1], 1)})`, `= ${num(S, t1, 1)} + ${num(S, t2, 1)}`, `= ${num(S, tot, 1)}`];
  const w = Math.min(B.w, 380 * u), h = Math.min(B.h, S.portrait ? 120 * u : 190 * u), x = B.x + (B.w - w) / 2, y = B.y + (B.h - h) / 2;
  const sz = fitSize(S, lines[0], w - 28 * u, 20, { weight: 700, font: 'mono' });
  d.withAlpha(a, () => {
    d.rect(x, y, w, h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    const hy = y + 16 * u;
    d.text('q', x + 14 * u, hy, { size: fs(S, 15), weight: 800, color: sig.ink, base: 'middle', font: 'mono' });
    d.text('·', x + 14 * u + 14 * u, hy, { size: fs(S, 15), weight: 800, color: p.ink, base: 'middle', font: 'mono' });
    d.text('k', x + 14 * u + 26 * u, hy, { size: fs(S, 15), weight: 800, color: lat.ink, base: 'middle', font: 'mono' });
    d.text(S.l('de «este» con «paquete»', 'of “it” with “package”'), x + 14 * u + 42 * u, hy, { size: fs(S, 12), weight: 600, color: p.mute, base: 'middle' });
    const step = (h - 38 * u) / 3;
    lines.forEach((ln, i) => d.text(ln, x + 14 * u, y + 34 * u + step * (i + 0.5), { size: i === 2 ? sz * 1.1 : sz, weight: i === 2 ? 800 : 600, font: 'mono', color: i === 2 ? p.ink : p.ink2, base: 'middle' }));
  });
}

// ───────────────────────────── orquestación ─────────────────────────────
export interface QState { q: V2; qs: V2; drag: boolean; moved: boolean }
export const newQState = (): QState => ({ q: [...Q_IT] as V2, qs: [...Q_IT] as V2, drag: false, moved: false });

/** Vista principal del acto B (de «roles» a «try1»); la fórmula tiene su propia vista. */
export function drawQKV(S: Frame) {
  const A0 = actAlpha(S, 'roles', 'sqrt-why'); if (A0 <= 0) return;
  const fa = actAlpha(S, 'formula', 'try1'), main = A0 * (1 - fa);
  const L = qLayout(S), st: QState = S.st.q ?? newQState();
  const inTry = S.on('try1');
  const q: V2 = inTry ? st.qs : Q_IT, att = attend(q);
  if (main > 0.003) S.d.withAlpha(main, () => {
    const hot = S.is('q') ? 'q' : S.is('k') || S.is('plane') ? 'k' : S.is('v') ? 'v' : null;
    // lienzo izquierdo
    const aCards = S.on('plane') ? 1 - S.at('plane', 0, 0.7) : S.at('roles', 0, 0.7);
    const aPlane = inTry ? 1 : S.on('mix') ? 1 - S.at('mix', 0, 0.7) : S.at('plane', 0, 0.7);
    const aVal = inTry ? 0 : S.on('mix') ? S.at('mix', 0, 0.7) : 0;
    if (aCards > 0.01) drawCards(S, L, aCards, hot);
    if (aPlane > 0.01) {
      const sc = S.on('scores') ? S.at('scores', 0.3, 0.3 + 9 * 0.2, 'lin') * 9 : -1, scan = S.between('scores', 'scale') && sc < 9 ? sc : -1;
      drawPlane(S, L, aPlane, {
        q, att, signs: S.on('scores'), weights: inTry ? 1 : S.at('softmax', 0.2, 1.3), scan,
        zero: inTry ? 1 : S.at('scores', 0.1, 0.8), dotKey: S.between('dot', 'scores') ? PAQUETE : -1, qHandle: S.on('plane') ? S.reveal('plane', 0.5, 0.6) : 0,
        drag: inTry && st.drag, hint: inTry && !st.moved && !S.reduced,
      });
    }
    if (aVal > 0.01) drawValues(S, L, aVal, att, { grow: S.at('mix', 0.6, 1.8), res: S.at('mix', 1.8, 2.6), lines: S.at('mix', 2.2, 3.0), read: S.at('meaning', 0.3, 1.2) });
    // lienzo derecho
    const aT1 = S.on('dot') ? 1 - S.at('dot', 0, 0.5) : S.at('roles', 0.1, 0.7);
    const aCalc = S.on('scores') ? 1 - S.at('scores', 0, 0.5) : S.at('dot', 0.1, 0.6);
    const aT2 = inTry ? 1 : S.on('mix') ? 1 - S.at('mix', 0, 0.6) : S.at('scores', 0.1, 0.7);
    const aT3 = inTry ? 0 : S.at('mix', 0.2, 0.9);
    if (aT1 > 0.01) drawTableQKV(S, L, aT1, hot);
    if (aCalc > 0.01) drawCalc(S, L, aCalc);
    if (aT2 > 0.01) {
      const scan = S.on('scores') ? S.at('scores', 0.3, 0.3 + 9 * 0.2, 'lin') * 9 : 0;
      drawTableScore(S, L, aT2, att, {
        rows: inTry || S.on('scale') ? 1 : S.at('scores', 0.1, 0.5), scan: inTry || S.on('scale') ? 99 : scan,
        scaled: inTry ? 1 : S.at('scale', 0.1, 0.8), weights: inTry ? 1 : S.at('softmax', 0.1, 1.2), sum: !inTry,
      });
    }
    if (aT3 > 0.01) drawTableMix(S, L, aT3, att, S.at('mix', 0.6, 1.8), S.at('mix', 1.8, 2.6), S.at('meaning', 0.3, 1.0));
    // tabla de lectura del resultado durante el turno
    if (inTry) drawTryResult(S, L, att, st);
  });
  if (fa > 0.003) S.d.withAlpha(A0 * fa, () => drawFormula(S));
}

/** Durante el turno: el nuevo vector de «este» y una pista para elegir el robot. */
function drawTryResult(S: Frame, L: QLay, att: Att, st: QState) {
  const { d, pal: p } = S, u = S.u, T = L.T, g = tg(S, L), sig = tone(S, 'sig'), y = g.rowY(9);
  const ok = att.w[I.robot] > 0.5;
  d.line(T.x, y - L.rowH / 2, T.x + T.w, y - L.rowH / 2, p.lineStrong, 1.5);
  const vW = 2 * g.cw + 2 * u;
  d.text(S.l('«este» nuevo', 'new “it”'), T.x + 2, y, { size: g.size, weight: 800, color: sig.ink, base: 'middle' });
  const mid = T.x + g.wordW + 4 * u + 40 * u;
  d.text(ok ? S.l('el robot gana ✓', 'the robot wins ✓') : S.l('robot: ', 'robot: ') + pct(S, att.w[I.robot]) + ' %', mid, y, { size: g.size, weight: 700, color: ok ? tone(S, 'dat').ink : p.ink2, base: 'middle' });
  vecCells(S, T.x + T.w - vW, y, att.out, { tone: TQ, cw: g.cw / u, h: g.ch / u, size: fs(S, 12), digits: 2, strong: true });
  void st;
}

/** Vista de «formula»: las matrices Q, K, V y la fórmula completa, con cada pieza nombrada. */
export function drawFormula(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u), sig = tone(S, TQ), lat = tone(S, TK), dat = tone(S, TV);
  const aM = S.reveal('formula', 0.1, 0.7), aF = S.reveal('formula', 0.9, 0.7);
  const cell = Math.min(13 * u, (all.h * (S.portrait ? 0.22 : 0.27)) / N), mw = 2 * cell, gapM = (S.portrait ? 30 : 46) * u;
  const cols = S.portrait ? 1 : 2, capH = (S.portrait ? 34 : 46) * u, hM = 24 * u + N * cell + 24 * u, hF = 46 * u, hC = (4 / cols) * capH;
  const total = hM + 12 * u + hF + 14 * u + hC, top = all.y + Math.max(0, (all.h - total) / 2);
  const mx = all.x + (all.w - (3 * mw + 2 * gapM)) / 2, my = top + 24 * u;
  const mats: [string, V2[], Tone][] = [['Q', Q, TQ], ['K', K, TK], ['V', V, TV]];
  d.withAlpha(aM, () => {
    mats.forEach(([nm, M, t], i) => {
      const x = mx + i * (mw + gapM), tc = tone(S, t), lo = Math.min(...M.flat()), hi = Math.max(...M.flat());
      d.text(nm, x + mw / 2, my - 12 * u, { size: fs(S, 16), weight: 800, color: tc.ink, align: 'center', base: 'middle', font: 'mono' });
      M.forEach((row, r) => row.forEach((v, c) => d.rect(x + c * cell, my + r * cell, cell - 1.5, cell - 1.5, { fill: alpha(tc.c, 0.1 + 0.8 * ((v - lo) / (hi - lo || 1))) })));
      d.text(`${N} × ${D}`, x + mw / 2, my + N * cell + 12 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle' });
    });
  });
  const label = S.portrait ? '' : S.l('Atención = ', 'Attention = ');
  const parts: [string, string][] = [[label, p.mute], ['softmax(', p.ink], ['Q', sig.ink], [' Kᵀ', lat.ink], [' / √d', p.ink2], [')', p.ink], [' V', dat.ink]];
  const size = fitSize(S, parts.map((q) => q[0]).join(''), all.w * 0.96, 30, { weight: 800, font: 'mono' });
  const widths = parts.map(([t]) => d.measure(t, { size, weight: 800, font: 'mono' })), tw = widths.reduce((a, b) => a + b, 0);
  const fy = my + N * cell + 24 * u + 12 * u + hF / 2;
  d.withAlpha(aF, () => {
    let x = all.x + (all.w - tw) / 2;
    parts.forEach(([t, c], i) => { d.text(t, x, fy, { size, weight: 800, font: 'mono', color: c, base: 'middle' }); x += widths[i]; });
  });
  const caps: [string, string, string, Tone | undefined][] = [
    ['Q Kᵀ', S.l('puntuación de cada palabra contra todas', 'score of each word against all'), '1', 'sig'],
    ['/ √d', S.l('escala, para que softmax no se sature', 'scale, so softmax does not saturate'), '2', undefined],
    ['softmax', S.l('pesos positivos que suman uno por fila', 'positive weights summing to one per row'), '3', undefined],
    ['· V', S.l('mezcla de valores con esos pesos', 'blend of values with those weights'), '4', 'dat'],
  ];
  const cy0 = fy + hF / 2 + 14 * u, cwid = all.w / cols, fz = fs(S, 13);
  caps.forEach(([k, txt, n, t], i) => {
    const a = S.reveal('formula', 1.4 + i * 0.45, 0.5), x = all.x + (i % cols) * cwid, yc = cy0 + Math.floor(i / cols) * capH + capH / 2;
    d.withAlpha(a, () => {
      d.text(n, x + 2, yc, { size: fz, weight: 800, color: p.mute, base: 'middle', font: 'mono' });
      const b = badge(S, k, x + 18 * u, yc, { tone: t, align: 'left', size: fz, mono: true });
      textBlock(S, txt, b.x + b.w + 8 * u, yc, x + cwid - (b.x + b.w + 8 * u) - 8 * u, { size: fz, lh: 1.15 });
    });
  });
}
