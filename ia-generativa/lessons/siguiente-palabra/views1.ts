// Primeras vistas: el gancho «el cielo es…» con sus barras (antes de cualquier término) y el conteo, pieza por pieza,
// sobre el texto de ocho frases: cada «es», la palabra que lo sigue, cuentas, división entre el total y la tabla.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import type { Demo } from './demo';
import { area, drawWords, fitSize, fr, fz, isShort, kk, label, layoutWords, pct, probBars, q, textPanel, wl, wordBox, type WLayout } from './helpers';
import { CORPUS } from './lm';

// ═════════ gancho y barras ═════════
function introGeom(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S);
  if (P) {
    const pb: Rect = { x: R.x, y: R.y + 22 * k, w: R.w, h: 60 * k };
    const mb: Rect = { x: R.x + R.w * 0.16, y: pb.y + pb.h + 34 * k, w: R.w * 0.68, h: 46 * k };
    const top = mb.y + mb.h + 46 * k, br: Rect = { x: R.x, y: top, w: R.w, h: Math.min(4 * 44 * k, R.y + R.h - top - 30 * k) };
    return { R, P, pb, mb, br };
  }
  const short = isShort(S), mid = R.y + R.h * (short ? 0.5 : 0.45);
  const pb: Rect = { x: R.x, y: mid - 30 * k, w: R.w * 0.34, h: 60 * k };
  const mb: Rect = { x: R.x + R.w * 0.395, y: mid - 26 * k, w: R.w * 0.19, h: 52 * k };
  const bh = Math.min(4 * 46 * k, R.h * 0.66), br: Rect = { x: R.x + R.w * 0.62, y: mid - bh / 2 + 10 * k, w: R.w * 0.38, h: bh };
  return { R, P, pb, mb, br };
}

export function drawIntro(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = introGeom(S), k = kk(S), u = S.u;
  const words = D.start;
  // la caja de texto: «El cielo es ▍»
  textPanel(S, g.pb, S.l('lo que escribes', 'what you type'), { a: fr(S, 'hook', 0, 0.06) });
  const size = fitSize(S, 'El cielo es azul', g.pb.w - 30 * u, fz(S, g.P ? 21 : 22), 650);
  const L = layoutWords(S, words, g.pb.w - 24 * u, size, 650);
  const ox = g.pb.x + 14 * u, oy = g.pb.y + (g.pb.h - L.lh) / 2;
  drawWords(S, L, ox, oy, { shown: 0.3 + fr(S, 'hook', 0.04, 0.28, 'lin') * words.length, cursor: true, weight: 650, a: fr(S, 'hook', 0, 0.06) });
  // lo que pensaste: «azul»… tal vez «gris» (fantasmas bajo la caja; se van cuando llegan las barras)
  const gone = 1 - fr(S, 'guess', 0.35, 0.55);
  const gx = g.pb.x + 14 * u, gy = g.pb.y + g.pb.h + 10 * k;
  if (!S.on('bars')) {
    const ga = [fr(S, 'hook', 0.5, 0.6), fr(S, 'hook', 0.76, 0.86)];
    [D.W.azul, D.W.gris].forEach((w, i) => {
      const a = ga[i] * gone; if (a < 0.01) return;
      const x = gx + (g.P ? i * 84 * k : 0), y = gy + (g.P ? 0 : i * 30 * k);
      d.text(`${w}?`, x, y, { size: fz(S, 17), weight: 600, italic: true, color: p.mute, base: 'top', a });
    });
  }
  // flecha del texto a las palabras posibles (y, más tarde, la caja del modelo en medio)
  const arrowA = fr(S, 'guess', 0.1, 0.3), boxA = fr(S, 'lm', 0.12, 0.3);
  const ink = p.ink2;
  if (g.P) {
    const x = g.R.x + g.R.w / 2, y0 = g.pb.y + g.pb.h + 6 * k, y3 = g.br.y - 24 * k;
    if (boxA < 0.99) d.arrow(x, y0 + (g.P ? 24 * k : 0), x, y3, ink, 2, 9 * u, arrowA * (1 - boxA));
    if (boxA > 0.01) { d.arrow(x, y0, x, g.mb.y - 5 * k, ink, 2, 9 * u, boxA); d.arrow(x, g.mb.y + g.mb.h + 5 * k, x, y3, ink, 2, 9 * u, boxA); }
  } else {
    const y = g.pb.y + g.pb.h / 2, x0 = g.pb.x + g.pb.w + 8 * k, x3 = g.br.x - 10 * k;
    if (boxA < 0.99) d.arrow(x0, y, x3, y, ink, 2, 9 * u, arrowA * (1 - boxA));
    if (boxA > 0.01) { d.arrow(x0, y, g.mb.x - 6 * k, y, ink, 2, 9 * u, boxA); d.arrow(g.mb.x + g.mb.w + 6 * k, y, x3, y, ink, 2, 9 * u, boxA); }
  }
  if (boxA > 0.01) d.withAlpha(boxA, () => {
    const r = g.mb, w = tone(S, 'w');
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(w.c, 0.14), stroke: w.c, lw: 2, r: 6 });
    const sz = fz(S, 14), lines = d.wrap(S.l('modelo de lenguaje', 'language model'), r.w - 14 * u, { size: sz, weight: 800 });
    const lh = sz * u * 1.2;
    lines.forEach((ln, i) => d.text(ln, r.x + r.w / 2, r.y + r.h / 2 + (i - (lines.length - 1) / 2) * lh, { size: sz, weight: 800, color: w.ink, align: 'center', base: 'middle' }));
  });
  // las palabras posibles y luego sus barras
  const ca = fr(S, 'guess', 0.45, 0.62);
  if (ca < 0.01) return;
  label(S, S.l('palabras que podrían seguir', 'words that could come next'), g.br.x + g.br.w / 2, g.br.y - 22 * k, { a: ca, size: fz(S, 13), color: p.mute, weight: 700 });
  const ps = D.esP;
  const rows = ps.map((x, i) => {
    const grow = fr(S, 'bars', 0.06 + 0.12 * i, 0.22 + 0.12 * i, 'io');
    return { label: x.w, p: x.p * grow, a: ca * fr(S, 'guess', 0.45 + 0.1 * i, 0.6 + 0.1 * i), text: grow > 0.02 ? pct(S, x.p * grow) : '' };
  });
  const barsA = fr(S, 'bars', 0.02, 0.12);
  // antes de «bars» solo se ven los nombres: las barras crecen después
  const geo = probBars(S, g.br, rows.map((r) => ({ ...r, a: barsA > 0.01 ? r.a : 0 })), { slots: 4 });
  if (barsA < 0.99) rows.forEach((r, i) => d.text(r.label, geo[i].lx, geo[i].y + geo[i].h / 2, { size: fz(S, 15), weight: 650, color: p.ink2, align: 'right', base: 'middle', a: r.a * (1 - barsA) }));
  const tot = fr(S, 'bars', 0.72, 0.86);
  if (tot > 0.01) {
    const y = geo[3].y + geo[3].h + 6 * k;
    d.line(geo[0].x0, y, g.br.x + g.br.w, y, p.lineStrong, 1.2, undefined, tot);
    label(S, `${S.l('suman', 'total')}: ${pct(S, 1)}`, g.br.x + g.br.w, y + 5 * k, { a: tot, align: 'right', size: fz(S, 13), weight: 800, color: p.ink });
  }
}

// ═════════ contar ═════════
interface CorpusLay { lines: WLayout[]; tok: { line: number; j: number }[]; size: number }
function corpusLayout(S: Frame, maxW: number, base: number): CorpusLay {
  const sents = CORPUS[S.lang as 'es' | 'en'].map((s) => s.split(' '));
  const longest = sents.map((s) => s.join(' ')).sort((a, b) => b.length - a.length)[0];
  const size = fitSize(S, longest.replace(' .', '.'), maxW, base, 600);
  const lines = sents.map((s) => layoutWords(S, s, 1e6, size, 600));
  const tok: { line: number; j: number }[] = [];
  sents.forEach((s, li) => s.forEach((_, j) => tok.push({ line: li, j })));
  return { lines, tok, size };
}

function countGeom(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), u = S.u, short = isShort(S);
  const cw = P ? R.w : R.w * 0.47;
  const C = corpusLayout(S, cw - 30 * u, fz(S, P ? 14 : short ? 13 : 15));
  const lh = C.lines[0].lh * 0.92, ch = 14 * k + 8 * lh + 8 * k;
  const card: Rect = P ? { x: R.x, y: R.y + 20 * k, w: cw, h: ch } : { x: R.x, y: R.y + 20 * k + Math.max(0, (R.h - 20 * k - ch) / 2), w: cw, h: Math.min(ch, R.h - 20 * k) };
  const tab: Rect = P ? { x: R.x, y: card.y + ch + 16 * k, w: R.w, h: R.y + R.h - (card.y + ch + 16 * k) } : { x: R.x + R.w * 0.53, y: card.y - 20 * k, w: R.w * 0.47, h: R.y + R.h - (card.y - 20 * k) };
  return { R, P, k, card, tab, C, lh };
}
const tokOrigin = (S: Frame, g: ReturnType<typeof countGeom>, line: number): [number, number] => [g.card.x + 14 * S.u, g.card.y + 10 * g.k + line * g.lh];

export function drawCount(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = countGeom(S), k = g.k, u = S.u, lat = tone(S, 'lat'), sig = tone(S, 'sig');
  const toks = D.m.toks;
  // la tarjeta con el texto
  const cardA = fr(S, 'text', 0.15, 0.35);
  textPanel(S, g.card, S.l('el texto que leyó el modelo', 'the text the model read'), { a: cardA });
  const occ = toks.map((w, i) => (w === D.W.es ? i : -1)).filter((i) => i >= 0);   // las ocho apariciones de «es»
  const rowsOff = fr(S, 'rows', 0.02, 0.16);
  const boxA = (i: number) => fr(S, 'find', 0.14 + 0.08 * i, 0.2 + 0.08 * i) * (1 - rowsOff);
  const nextA = (i: number) => fr(S, 'next', 0.1 + 0.075 * i, 0.16 + 0.075 * i) * (1 - rowsOff);
  d.withAlpha(cardA, () => {
    g.C.lines.forEach((L, li) => {
      const [ox, oy] = tokOrigin(S, g, li);
      d.withAlpha(fr(S, 'text', 0.25 + 0.05 * li, 0.33 + 0.05 * li), () => drawWords(S, L, ox, oy - L.lh * 0.04));
    });
    occ.forEach((ti, i) => {
      const a = boxA(i), an = nextA(i);
      const t0 = g.C.tok[ti], t1 = g.C.tok[ti + 1];
      if (a > 0.01) { const [ox, oy] = tokOrigin(S, g, t0.line), r = wordBox(S, g.C.lines[t0.line], t0.j, ox, oy - g.C.lines[0].lh * 0.04); d.rect(r.x, r.y, r.w, r.h, { stroke: lat.c, lw: 2, r: 4, fill: alpha(lat.c, 0.14), a }); }
      if (an > 0.01 && t1) { const [ox, oy] = tokOrigin(S, g, t1.line), r = wordBox(S, g.C.lines[t1.line], t1.j, ox, oy - g.C.lines[0].lh * 0.04); d.rect(r.x, r.y, r.w, r.h, { fill: alpha(sig.c, 0.3), r: 4, a: an }); }
    });
  });
  // a la derecha (o abajo): qué viene después de «es»
  const T = g.tab, tabA = fr(S, 'find', 0.05, 0.18) * (1 - rowsOff);
  if (tabA > 0.01) d.withAlpha(tabA, () => drawEsTable(S, D, g, occ));
  if (S.on('rows')) d.withAlpha(rowsOff, () => drawFullTable(S, D, T));
}

function drawEsTable(S: Frame, D: Demo, g: ReturnType<typeof countGeom>, occ: number[]) {
  const tallyA = (i: number) => fr(S, 'next', 0.1 + 0.075 * i, 0.16 + 0.075 * i);
  const { d, pal: p } = S, T = g.tab, k = g.k, u = S.u, sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const toks = D.m.toks, ps = D.esP;
  let y = T.y;
  label(S, S.l(`después de ${q(S, D.W.es)}`, `after ${q(S, D.W.es)}`), T.x, y, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink });
  y += 26 * k;
  // contador de apariciones (find) y luego el esquema «solo mira la última palabra» (ngram)
  const seen = occ.filter((_, i) => fr(S, 'find', 0.14 + 0.08 * i, 0.2 + 0.08 * i) > 0.5).length;
  const cntA = fr(S, 'find', 0.1, 0.2) * (1 - fr(S, 'ngram', 0.1, 0.25));
  if (cntA > 0.01) label(S, S.l(`${q(S, D.W.es)} aparece ${seen} ${seen === 1 ? 'vez' : 'veces'}`, `${q(S, D.W.es)} appears ${seen} time${seen === 1 ? '' : 's'}`), T.x, y, { align: 'left', size: fz(S, 14), weight: 700, color: lat.ink, a: cntA });
  const ngA = fr(S, 'ngram', 0.3, 0.45);
  if (ngA > 0.01) {
    const sz = fz(S, 15), L = layoutWords(S, D.start, T.w, sz, 650);
    const lw = S.d.measure(S.l('solo mira: ', 'looks only at: '), { size: fz(S, 13), weight: 700 });
    const fits = lw + L.width + 30 * u < T.w;
    const ox = fits ? T.x + lw : T.x + 4 * u, oy = fits ? y - L.lh * 0.25 : y + 18 * k;
    label(S, S.l('solo mira:', 'looks only at:'), T.x, y + 2 * k, { align: 'left', size: fz(S, 13), weight: 700, color: p.mute, a: ngA });
    drawWords(S, L, ox, oy, { a: ngA, ctx: wordBox(S, L, 2, ox, oy), ctxA: fr(S, 'ngram', 0.5, 0.62), dim: (i) => (i < 2 ? 1 - 0.65 * fr(S, 'ngram', 0.5, 0.62) : 1), weight: 650 });
    if (!fits) y += 18 * k;
  }
  y += 30 * k;
  // filas: palabra · marcas de conteo · cuenta · (÷ 8 =) · porcentaje y barra
  const rh = Math.min(40 * k, (T.y + T.h - y - 4 * k) / 4), size = fz(S, 15);
  const lw = Math.max(...ps.map((x) => d.measure(x.w, { size, weight: 700 }))) + 10 * u;
  const sq = Math.min(13 * k, rh * 0.42), sqGap = 4 * u;
  const xSq = T.x + lw, xCnt = xSq + 4 * (sq + sqGap) + 8 * u;
  const xDiv = xCnt + 24 * u, divW = d.measure('÷ 8 =', { size: fz(S, 13), weight: 700, font: 'mono' }) + 10 * u;
  const xBar = xDiv + divW, xEnd = T.x + T.w, pctW = d.measure('100 %', { size: fz(S, 13), weight: 700, font: 'mono' }) + 8 * u;
  const after = occ.map((i) => toks[i + 1]);
  ps.forEach((x, r) => {
    const rowA = fr(S, 'next', 0.04, 0.12);
    if (rowA < 0.01) return;
    const ry = y + r * rh, cy = ry + rh / 2;
    d.withAlpha(rowA, () => {
      d.text(x.w, T.x + lw - 10 * u, cy, { size, weight: 700, color: p.ink, align: 'right', base: 'middle' });
      // una marca por cada aparición, en el orden del texto
      let j = 0, n = 0;
      after.forEach((w, i) => {
        if (w !== x.w) return;
        const a = tallyA(i);
        d.rect(xSq + j * (sq + sqGap), cy - sq / 2, sq, sq, { stroke: p.line, lw: 1, r: 2 });
        if (a > 0.01) d.rect(xSq + j * (sq + sqGap), cy - sq / 2, sq, sq, { fill: sig.c, r: 2, a });
        if (a > 0.5) n++;
        j++;
      });
      if (n > 0) d.text(String(n), xCnt, cy, { size: fz(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      // dividir entre el total
      const dv = fr(S, 'divide', 0.1 + 0.1 * r, 0.22 + 0.1 * r);
      if (dv > 0.01) {
        d.text('÷ 8 =', xDiv, cy, { size: fz(S, 13), weight: 700, font: 'mono', color: p.mute, base: 'middle', a: dv });
        const bw = Math.max(0, xEnd - pctW - xBar), bh = rh * 0.5;
        d.rect(xBar, cy - bh / 2, bw, bh, { fill: p.surface2, r: 2, a: dv });
        d.rect(xBar, cy - bh / 2, bw * x.p * fr(S, 'divide', 0.16 + 0.1 * r, 0.36 + 0.1 * r, 'io'), bh, { fill: alpha(lat.c, 0.6), r: 2, a: dv });
        d.text(pct(S, x.p), xEnd, cy, { size: fz(S, 13), weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle', a: dv });
      }
    });
  });
  const totA = fr(S, 'next', 0.78, 0.9);
  if (totA > 0.01) {
    const ty = y + 4 * rh + 2 * k;
    d.line(T.x, ty, xCnt + 18 * u, ty, p.lineStrong, 1.2, undefined, totA);
    label(S, S.l('total: 8', 'total: 8'), xCnt + 14 * u, ty + 4 * k, { align: 'right', a: totA, size: fz(S, 13), weight: 800, color: p.ink });
  }
}

function drawFullTable(S: Frame, D: Demo, T: Rect) {
  const { d, pal: p } = S, k = kk(S), u = S.u, lat = tone(S, 'lat');
  const W = D.W, show = [W.el, W.cielo, W.es, W.azul, '.', W.sol];
  const rows = show.map((c) => ({ c, txt: (D.m.t1.get(c) ?? []).map((r) => `${wl(S, r.w)} ${r.c}`).join(' · ') }));
  const P = S.portrait;
  let y = T.y;
  label(S, S.l('la tabla de cuentas', 'the table of counts'), T.x, y, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink });
  label(S, S.l('qué sigue a cada palabra', 'what follows each word'), T.x, y + 20 * k, { align: 'left', size: fz(S, 12), weight: 600, color: p.mute });
  y += 46 * k;
  const ctxW = Math.max(...show.map((c) => d.measure(wl(S, c), { size: fz(S, 14), weight: 700 }))) + 18 * u;
  const avail = T.w - ctxW - 30 * u;
  const widest = rows.map((r) => r.txt).sort((a, b) => b.length - a.length)[0];
  const size = fitSize(S, widest, avail, fz(S, 14), 600);
  const rh = Math.min(34 * k, (T.y + T.h - y - 24 * k) / rows.length);
  const hotEl = fr(S, 'rows', 0.28, 0.4) * (1 - fr(S, 'rows', 0.66, 0.74)), hotDot = fr(S, 'rows', 0.72, 0.82);
  rows.forEach((r, i) => {
    const ry = y + i * rh, cy = ry + rh / 2, hot = r.c === W.el ? hotEl : r.c === '.' ? hotDot : 0;
    const a = fr(S, 'rows', 0.06 + 0.04 * i, 0.14 + 0.04 * i);
    if (a < 0.01) return;
    d.withAlpha(a, () => {
      if (hot > 0.01) d.rect(T.x - 4 * u, ry + 1, T.w + 8 * u, rh - 2, { fill: alpha(lat.c, 0.12 * hot), stroke: alpha(p.ink, 0.6 * hot), lw: 1.5, r: 4 });
      const bw = ctxW - 8 * u, bh = Math.min(rh * 0.74, 26 * k);
      d.rect(T.x, cy - bh / 2, bw, bh, { fill: alpha(lat.c, 0.16), stroke: lat.c, lw: 1.5, r: 4 });
      d.text(wl(S, r.c), T.x + bw / 2, cy, { size: fz(S, 14), weight: 700, color: lat.ink, align: 'center', base: 'middle' });
      d.text('→', T.x + ctxW + 2 * u, cy, { size: fz(S, 14), weight: 700, color: p.mute, base: 'middle' });
      d.text(r.txt, T.x + ctxW + 24 * u, cy, { size, weight: 600, color: p.ink, base: 'middle' });
    });
  });
  const more = D.m.t1.size - rows.length;
  label(S, S.l(`… y ${more} filas más, una por palabra`, `… and ${more} more rows, one per word`), T.x, y + rows.length * rh + 6 * k, { align: 'left', size: fz(S, 12), color: p.mute, a: fr(S, 'rows', 0.35, 0.45) });
}
