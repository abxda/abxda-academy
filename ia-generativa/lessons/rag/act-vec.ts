// Acto 3: vectorizar e indexar. La matriz palabras × fragmentos sale del índice real (conteos, df, idf y pesos TF-IDF); la tabla del
// índice muestra el texto, la fuente y los mayores pesos del vector de cada fragmento.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { mainIndex } from './ir';
import { lang, manualWords, matrixDemo, topWeights } from './model';
import { area, fit, fz, lh, srcLabel, srcShort, tagAt } from './ui';

/** Texto girado 90° hacia arriba (cabeceras de columna). */
function rotText(S: Frame, text: string, x: number, y: number, o: { size: number; weight?: number; color: string }) {
  const { ctx, d } = S; ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 2);
  d.text(text, 0, 0, { size: o.size, weight: o.weight ?? 700, color: o.color, align: 'left', base: 'middle' }); ctx.restore();
}

// ═════════════ la matriz: vectorize · idf ═════════════
export function drawVectorize(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S, true), sz = fz(S, 13), L = lh(S, sz);
  const M = matrixDemo(l), nr = M.rows.length, nc = M.cols.length;
  const idfOn = S.on('idf'), morph = idfOn ? S.at('idf', 0.2, 1.5, 'io') : 0;
  const lat = tone(S, 'lat'), dat = tone(S, 'dat');
  // geometría
  const headH = Math.max(...M.cols.map((c) => d.measure(c.word, { size: sz, weight: 700 }))) + 8 * u;
  const labW = Math.min(S.portrait ? 104 * u : 150 * u, A.w * 0.34);
  const extra = idfOn ? 2 : 0;                        // filas df e idf
  const cs = Math.min((A.w - labW) / nc, S.portrait ? 60 * u : 78 * u), rh = Math.min(S.portrait ? 40 * u : 44 * u, (A.h - headH - 4 * L) / (nr + extra + 0.3));
  const W = labW + nc * cs, x0 = A.x + (A.w - W) / 2, y0 = A.y + (S.portrait ? 4 * u : 6 * u);
  const gx = x0 + labW, gy = y0 + headH;
  const vmax = Math.max(...M.w.flat(), 1);
  // cabeceras de columna (palabras)
  const aH = S.reveal('vectorize', 0, 0.5);
  d.withAlpha(aH, () => M.cols.forEach((c, j) => rotText(S, c.word, gx + j * cs + cs / 2 - 1, gy - 5 * u, { size: sz, color: p.ink })));
  // filas
  M.rows.forEach((c, i) => {
    const a = S.reveal('vectorize', 0.3 + i * 0.35, 0.4), y = gy + i * rh;
    d.withAlpha(a, () => {
      d.text(fit(S, srcShort(c), labW - 8 * u, sz, 700), gx - 6 * u, y + rh / 2, { size: sz, weight: 700, color: p.ink2, align: 'right', base: 'middle' });
      M.cols.forEach((cl, j) => {
        const cnt = M.counts[i][j], w = M.w[i][j], k0 = cnt > 0 ? 0.55 : 0, k1 = w / vmax;
        const k = lerp(k0, k1, morph), x = gx + j * cs;
        d.rect(x + 1, y + 1, cs - 2, rh - 2, { fill: alpha(lat.c, 0.06 + 0.7 * clamp(k)), stroke: alpha(p.line, 1), lw: 1 });
        const shown = morph > 0.5 ? (w > 0 ? S.n(w, 1) : '·') : cnt > 0 ? String(cnt) : '·';
        d.text(shown, x + cs / 2, y + rh / 2, { size: sz, weight: 700, font: 'mono', color: k > 0.55 ? p.stage : cnt > 0 || w > 0 ? p.ink : p.mute, align: 'center', base: 'middle' });
      });
    });
  });
  // df e idf (solo en «idf»)
  if (idfOn) {
    const a = S.reveal('idf', 0.15, 0.6), y1 = gy + nr * rh + 6 * u;
    d.withAlpha(a, () => {
      d.text(S.l('en cuántos', 'in how many'), gx - 6 * u, y1 + rh / 2 - L * 0.5, { size: sz, weight: 700, color: p.mute, align: 'right', base: 'middle' });
      d.text(S.l('fragmentos', 'chunks'), gx - 6 * u, y1 + rh / 2 + L * 0.5, { size: sz, weight: 700, color: p.mute, align: 'right', base: 'middle' });
      d.text(S.l('rareza (idf)', 'rarity (idf)'), gx - 6 * u, y1 + rh * 1.5, { size: sz, weight: 700, color: lat.ink, align: 'right', base: 'middle' });
      M.cols.forEach((cl, j) => {
        const x = gx + j * cs;
        d.text(String(cl.df), x + cs / 2, y1 + rh / 2, { size: sz, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
        const bw = (cs - 10 * u) * clamp((cl.idf - 1) / 2.2);
        d.rect(x + 5 * u, y1 + rh * 1.15, cs - 10 * u, 5 * u, { fill: p.surface2 });
        d.rect(x + 5 * u, y1 + rh * 1.15, Math.max(2, bw), 5 * u, { fill: lat.c });
        d.text(S.n(cl.idf, 1), x + cs / 2, y1 + rh * 1.15 + 14 * u, { size: sz, weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
      });
    });
    // resaltar «días» (muchos) y «cancelar» (uno)
    const hot = S.at('idf', 1.2, 2.2);
    d.withAlpha(hot, () => {
      const by = gy - 2 * u, bh = nr * rh + (extra ? rh * 2.15 + 8 * u : 0) + 4 * u;
      const dI = M.cols.findIndex((c) => c.df === Math.max(...M.cols.map((q) => q.df))), cI = M.cols.findIndex((c) => c.df === Math.min(...M.cols.map((q) => q.df)));
      if (dI >= 0) d.rect(gx + dI * cs, by, cs, bh, { stroke: tone(S, 'err').c, lw: 2, dash: [5, 4] });
      if (cI >= 0) d.rect(gx + cI * cs, by, cs, bh, { stroke: tone(S, 'sig').c, lw: 2.5 });
    });
  }
  // nota al pie: cuántas columnas hay de verdad
  const ix = M.cols.length, total = manualVocab(l);
  const fy = Math.min(A.y + A.h - L, gy + (nr + extra * 1.2) * rh + L * 2.6 + 18 * u);
  d.withAlpha(S.reveal('vectorize', 1.6, 0.5), () => {
    d.text(S.l(`Se ven ${ix} de ${total} palabras: cada fragmento es un vector de ${total} números, casi todos cero.`, `Showing ${ix} of ${total} words: each chunk is a vector of ${total} numbers, mostly zero.`), A.x + A.w / 2, fy, { size: sz * 0.96, weight: 600, color: p.mute, align: 'center', base: 'middle', w: A.w });
  });
  if (idfOn) d.withAlpha(S.reveal('idf', 0.4, 0.5), () => tagAt(S, S.l('peso = veces × rareza', 'weight = count × rarity'), A.x + A.w / 2, fy - L * 1.5, { tone: 'lat', align: 'center' }));
  void dat;
}
const manualVocab = (l: 'es' | 'en') => mainIndex(l).vocab.length;

// ═════════════ el índice: index ═════════════
export function drawIndex(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S, true), sz = fz(S, 13), L = lh(S, sz);
  const lat = tone(S, 'lat'), mixc = tone(S, 'dat');
  const ixm = mainIndex(l), N = ixm.N;
  const pick = [1, 5, 7, 9, 12, 20, 22].filter((i) => i < N);                 // algunos fragmentos de distintos documentos
  const rowH0 = S.portrait ? L * 2.3 : L * 1.75, rows = Math.max(4, Math.min(S.portrait ? 7 : 8, pick.length + 1, Math.floor((A.h - L * 7) / rowH0)));
  const rowH = rowH0, headH = L * 1.5, topPad = 10 * u;
  const T: Rect = { x: A.x, y: A.y + L + 10 * u, w: A.w, h: topPad + headH + rows * rowH + L * 1.4 };
  const a = S.reveal('index', 0, 0.5);
  d.withAlpha(a, () => {
    d.text(S.l('Índice vectorial', 'Vector index'), A.x, A.y + L / 2, { size: sz, weight: 800, color: lat.ink, base: 'middle' });
    d.rect(T.x, T.y, T.w, T.h, { fill: alpha(lat.c, 0.05), stroke: lat.c, lw: 2, r: 4 });
    const cx = T.x + 10 * u, hy = T.y + topPad + headH / 2;
    if (S.portrait) d.text(S.l('fuente · texto · vector', 'source · text · vector'), cx, hy, { size: sz, weight: 800, color: p.mute, base: 'middle' });
    else {
      d.text(S.l('fuente', 'source'), cx, hy, { size: sz, weight: 800, color: p.mute, base: 'middle' });
      d.text(S.l('texto', 'text'), cx + 170 * u, hy, { size: sz, weight: 800, color: p.mute, base: 'middle' });
      d.text(S.l('vector (3 pesos mayores de ' + ixm.vocab.length + ')', 'vector (3 largest of ' + ixm.vocab.length + ' weights)'), T.x + T.w - 10 * u, hy, { size: sz, weight: 800, color: p.mute, align: 'right', base: 'middle' });
    }
    d.line(T.x + 6 * u, T.y + topPad + headH, T.x + T.w - 6 * u, T.y + topPad + headH, p.line, 1);
  });
  const shown = Math.min(rows - 1, pick.length);
  for (let r = 0; r < shown; r++) {
    const i = pick[r], c = ixm.chunks[i], y = T.y + topPad + headH + r * rowH, ra = S.reveal('index', 0.5 + r * 0.28, 0.4);
    d.withAlpha(ra, () => {
      const cx = T.x + 10 * u, W = topWeights(l, i, 3).map((q) => `${q.term} ${S.n(q.w, 2)}`).join(' · ');
      if (S.portrait) {
        d.text(fit(S, srcLabel(c), T.w * 0.4, sz, 800), cx, y + rowH * 0.28, { size: sz, weight: 800, color: tone(S, 'dat').ink, base: 'middle' });
        d.text(fit(S, c.text, T.w - 20 * u - T.w * 0.4 - 8 * u, sz, 500), cx + T.w * 0.4 + 8 * u - 8 * u, y + rowH * 0.28, { size: sz, weight: 500, color: p.ink2, base: 'middle' });
        d.text(fit(S, W, T.w - 20 * u, sz * 0.9, 600, 'mono'), cx, y + rowH * 0.74, { size: sz * 0.9, weight: 600, font: 'mono', color: lat.ink, base: 'middle' });
      } else {
        d.text(fit(S, srcLabel(c), 160 * u, sz, 800), cx, y + rowH / 2, { size: sz, weight: 800, color: tone(S, 'dat').ink, base: 'middle' });
        const tw = T.w - 20 * u - 170 * u - 310 * u;
        d.text(fit(S, c.text, tw, sz, 500), cx + 170 * u, y + rowH / 2, { size: sz, weight: 500, color: p.ink2, base: 'middle' });
        d.text(fit(S, W, 296 * u, sz * 0.9, 600, 'mono'), T.x + T.w - 10 * u, y + rowH / 2, { size: sz * 0.9, weight: 600, font: 'mono', color: lat.ink, align: 'right', base: 'middle' });
      }
      if (r < shown - 1) d.line(T.x + 6 * u, y + rowH, T.x + T.w - 6 * u, y + rowH, alpha(p.line, 0.6), 1);
    });
  }
  // «… y N−k más» y rótulos
  const ya = T.y + topPad + headH + shown * rowH;
  d.withAlpha(S.reveal('index', 2.0, 0.5), () => {
    d.text(S.l(`… y otros ${N - shown} fragmentos (${manualWords(l)} palabras en total)`, `… and ${N - shown} more chunks (${manualWords(l)} words in total)`), T.x + 10 * u, ya + L * 0.7, { size: sz, weight: 700, color: p.mute, base: 'middle' });
  });
  d.withAlpha(S.reveal('index', 2.6, 0.6), () => {
    const by = T.y + T.h + 12 * u;
    const msg = S.l('Una base de datos vectorial guarda esto y encuentra vecinos cercanos muy rápido.', 'A vector database stores this and finds nearby neighbors very fast.');
    const hh = d.wrap(msg, A.w * (S.portrait ? 1 : 0.8), { size: sz, weight: 700 }).length * L;
    if (by + hh <= A.y + A.h + 2) d.text(msg, A.x, by, { size: sz, weight: 700, color: p.ink2, w: A.w * (S.portrait ? 1 : 0.8), base: 'top' });
  });
  void mixc;
}
