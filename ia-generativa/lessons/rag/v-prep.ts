// Vistas de «preparar» (se hace una sola vez):
//  · drawManual (manual, chunk): los nueve documentos del manual ficticio y sus 25 párrafos = 25 fragmentos.
//  · drawSize   (size-small … try-chunk): la garantía cortada en grupos de N oraciones; cuál se recupera (coseno TF-IDF
//    real) y si trae el dato y su condición. El tamaño lo mueve la escena (S.drive) o la persona.
//  · drawVec    (vector … vector-db): un fragmento → su vector TF-IDF de 228 casilleros → los 25 vectores del índice.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CHUNK_DEMO, DOCS } from './corpus';
import { mainIndex, terms, words } from './ir';
import { chunkDemo, lang, vocabPos, wordWeight } from './model';
import { FS, LH, area, card, cardH, chip, chipH, chunkCard, fitText, flow, fr, header, lines, mark, para, strip, tiny, tight, type Tok } from './ui';

// ═════════════ el manual y sus fragmentos ═════════════
export function drawManual(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz);
  const hh = header(S, S.l('Manual de la tienda · inventado para la lección', 'Shop manual · made up for this lesson'), A, fr(S, 'manual', 0, 0.1));
  const docs = DOCS[l], n = docs.length, cols = S.portrait ? 3 : tiny(S) ? 9 : 5, rows = Math.ceil(n / cols);
  const foot = chipH(S, 12) + 8 * u, gap = (tiny(S) ? 6 : 10) * u;
  const G: Rect = { x: A.x, y: A.y + hh + 2 * u, w: A.w, h: A.h - hh - 2 * u - foot };
  const cw = (G.w - (cols - 1) * gap) / cols, ch = Math.min((G.h - (rows - 1) * gap) / rows, cw * 1.5);
  const split = fr(S, 'chunk', 0.22, 0.5, 'io'), dt = tone(S, 'dat');
  docs.forEach((doc, i) => {
    const x = G.x + (i % cols) * (cw + gap), y = G.y + Math.floor(i / cols) * (ch + gap), a = fr(S, 'manual', 0.12 + i * 0.05, 0.22 + i * 0.05);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: p.surface, stroke: dt.c, lw: 1.5, r: 3 });
      const tsz = FS(S, 12.5), tl = LH(S, tsz, 1.2), tls = lines(S, doc.title, cw - 10 * u, tsz, { weight: 800, maxLines: tiny(S) ? 1 : 2 });
      tls.forEach((t, j) => d.text(t, x + 5 * u, y + 5 * u + j * tl, { size: tsz, weight: 800, color: dt.ink, base: 'top' }));
      const by = y + 8 * u + tls.length * tl, bh = y + ch - 5 * u - by;
      if (bh < 8 * u) return;
      const wc = doc.paras.map((t) => words(t).length), tot = wc.reduce((s, v) => s + v, 0), g = 4 * u * split, inner = bh - g * (doc.paras.length - 1);
      let yy = by;
      wc.forEach((w) => {
        const h = (inner * w) / tot, bx = x + 5 * u, bw = cw - 10 * u;
        if (split > 0.01) d.rect(bx - 1, yy, bw + 2, h, { fill: alpha(dt.c, 0.1 * split), stroke: alpha(dt.c, split), lw: 1.2, r: 2 });
        const nl = Math.max(1, Math.floor((h - 4 * u) / (5 * u)));
        for (let k = 0; k < nl; k++) d.rect(bx + 3 * u, yy + 3 * u + k * 5 * u, (bw - 6 * u) * (k === nl - 1 ? 0.55 : 0.92), Math.max(1.2, 1.6 * u), { fill: alpha(p.ink2, 0.35) });
        yy += h + g;
      });
    });
  });
  const total = docs.reduce((s, dd) => s + dd.paras.length, 0);
  chip(S, S.l(`${total} fragmentos`, `${total} chunks`), A.x + A.w, A.y + A.h - foot / 2 + 2 * u, 'dat', { size: 12, align: 'right', a: fr(S, 'chunk', 0.62, 0.76), solid: false });
  chip(S, S.l(`${n} documentos`, `${n} documents`), A.x, A.y + A.h - foot / 2 + 2 * u, 'dat', { size: 12, align: 'left', a: fr(S, 'manual', 0.6, 0.75) });
  void L;
}

// ═════════════ el tamaño del fragmento ═════════════
/** Tamaño mostrado: el del control (la escena lo mueve sola antes de que la persona lo toque). */
export const gNow = (S: Frame) => Math.max(1, Math.min(8, Math.round(Number(S.p.g ?? 1))));

function bgOf(S: Frame, g: number, si: number) {
  const l = lang(S), cd = chunkDemo(l, g), ci = cd.wins.findIndex(([a, b]) => si >= a && si < b);
  if (ci === cd.best) return alpha(tone(S, 'lat').c, 0.3);
  return ci % 2 ? alpha(S.pal.mute, 0.16) : alpha(tone(S, 'dat').c, 0.13);
}

export function drawSize(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz);
  const g = gNow(S), xf = S.st.gx as { cur: number; prev: number; t0: number } | undefined;
  const prevG = xf && xf.cur === g ? xf.prev : g, k = xf && xf.cur === g ? clamp((S.clock - xf.t0) / 0.35) : 1;
  const cd = chunkDemo(l, g), sg = tone(S, 'sig'), w = tone(S, 'w'), lt = tone(S, 'lat');
  const T = tiny(S);
  // reparto: texto | panel
  const hh = T ? 0 : header(S, S.l('Pregunta: ', 'Question: ') + CHUNK_DEMO[l].q, A, fr(S, 'size-small', 0, 0.1), 'sig');
  let TR: Rect, PR: Rect;
  if (S.portrait) { TR = { x: A.x, y: A.y + hh, w: A.w, h: 0 }; PR = { x: A.x, y: 0, w: A.w, h: 0 }; }
  else { const tw = A.w * 0.6; TR = { x: A.x, y: A.y + hh + 2 * u, w: tw, h: A.h - hh }; PR = { x: A.x + tw + 16 * u, y: A.y + hh + 2 * u, w: A.w - tw - 16 * u, h: A.h - hh - 2 * u }; }
  // el texto de la garantía, palabra por palabra (la disposición no cambia con el tamaño: solo los fondos)
  const sents = cd.sents, toks0: Tok[] = [], sentOf: number[] = [];
  sents.forEach((s, si) => s.split(/\s+/).filter(Boolean).forEach((wd) => {
    const isF = si === cd.fi, isC = si === cd.ci;
    toks0.push({ t: wd, color: isF ? sg.ink : isC ? w.ink : p.ink, weight: isF || isC ? 800 : 500, ul: isF ? sg.c : isC ? w.c : undefined, uld: isC });
    sentOf.push(si);
  }));
  const maxLines = S.portrait ? undefined : Math.max(3, Math.floor((TR.h - 4 * u) / LH(S, sz, 1.3)));
  const f = flow(S, 'warranty-doc', toks0, TR.w, sz, { maxLines });
  const aT = fr(S, 'size-small', 0.05, 0.2);
  d.withAlpha(aT, () => {
    f.items.forEach((it, i) => {
      const si = sentOf[i]; if (si === undefined) return;
      const x = TR.x + it.x - 2 * u, y = TR.y + it.y + 1, wd = it.w + 4 * u + 1, h = f.lh - 2;
      if (k < 1) d.rect(x, y, wd, h, { fill: bgOf(S, prevG, si), a: 1 - k });
      d.rect(x, y, wd, h, { fill: bgOf(S, g, si), a: k });
    });
    // separadores entre fragmentos: una raya vertical antes de la primera palabra de cada fragmento
    f.items.forEach((it, i) => {
      const si = sentOf[i]; if (si === undefined || i === 0) return;
      const starts = (gg: number) => chunkDemo(l, gg).wins.some(([a]) => a === si) && sentOf[i - 1] !== si;
      const on = (starts(g) ? k : 0) + (k < 1 && starts(prevG) ? 1 - k : 0);
      if (on > 0.01) d.line(TR.x + it.x - 3.5 * u, TR.y + it.y + 1, TR.x + it.x - 3.5 * u, TR.y + it.y + f.lh - 1, p.ink, 2, undefined, on);
    });
    for (const it of f.items) {
      const kk = it.k, ty = TR.y + it.y + f.lh / 2;
      d.text(kk.t, TR.x + it.x, ty, { size: f.size, weight: kk.weight ?? 500, color: kk.color ?? p.ink, base: 'middle' });
      if (kk.ul) d.line(TR.x + it.x, TR.y + it.y + f.lh - 2, TR.x + it.x + it.w, TR.y + it.y + f.lh - 2, kk.ul, 1.6, kk.uld ? [3, 2] : undefined);
    }
  });
  if (S.portrait) PR = { x: A.x, y: TR.y + f.h + 10 * u, w: A.w, h: A.y + A.h - (TR.y + f.h + 10 * u) };

  // panel: qué fragmento se recupera y qué trae
  const row = Math.max(L * 1.15, Math.min(L * 1.6, PR.h / (S.portrait ? 4.6 : 6.2)));
  let y = PR.y;
  const aP = fr(S, 'size-small', 0.25, 0.4);
  d.withAlpha(aP, () => {
    d.rect(PR.x, y + row / 2 - 6 * u, 12 * u, 12 * u, { fill: alpha(lt.c, 0.3), stroke: lt.c, lw: 1.5, r: 2 });
    fitText(S, S.l(`Se recupera el fragmento ${cd.best + 1} de ${cd.wins.length}`, `Chunk ${cd.best + 1} of ${cd.wins.length} is retrieved`), PR.x + 18 * u, y + row / 2, PR.w - 18 * u, sz, { weight: 700, color: lt.ink });
  });
  y += row;
  const item = (label: string, ok: boolean, t: 'sig' | 'w', a: number, dash: boolean) => {
    d.withAlpha(a, () => {
      d.line(PR.x, y + row / 2 + L * 0.45, PR.x + 14 * u, y + row / 2 + L * 0.45, tone(S, t).c, 1.8, dash ? [3, 2] : undefined);
      fitText(S, label, PR.x + 20 * u, y + row / 2, PR.w - 44 * u, sz, { weight: 700, color: tone(S, t).ink });
      mark(S, PR.x + PR.w - 10 * u, y + row / 2, ok, 5.5);
    });
    y += row;
  };
  item(S.l('trae el dato (18 meses)', 'has the fact (18 months)'), cd.hasFact, 'sig', fr(S, 'size-small', 0.4, 0.55), false);
  item(S.l('trae la condición (cargador original)', 'has the condition (original charger)'), cd.hasCond, 'w', fr(S, 'size-small', 0.62, 0.77), true);
  // parte del fragmento que responde (dato + condición sobre el total de palabras)
  if (S.on('size-big')) {
    const a = S.on('try-chunk') ? 1 : fr(S, 'size-big', 0.45, 0.6), pct = Math.round(cd.frac * 100), bw = PR.w;
    d.withAlpha(a, () => {
      fitText(S, S.l(`parte del fragmento que responde: ${pct} %`, `share of the chunk that answers: ${pct}%`), PR.x, y + row * 0.32, PR.w, sz, { weight: 700, color: p.ink2 });
      d.rect(PR.x, y + row * 0.7, bw, 6 * u, { fill: p.surface2 });
      d.rect(PR.x, y + row * 0.7, bw * clamp(cd.frac), 6 * u, { fill: tone(S, pct >= 50 ? 'dat' : 'w').c });
    });
    y += row * 1.1;
  }
  // veredicto
  if (S.on('size-mislead')) {
    const msg = !cd.hasCond || !cd.hasFact ? S.l('Falta la condición: la respuesta engañaría.', 'The condition is missing: the answer would mislead.')
      : cd.frac >= 0.5 ? S.l('Dato y condición, juntos.', 'Fact and condition, together.')
      : S.l('Todo está, pero rodeado de texto que no responde.', 'It is all there, but surrounded by text that does not answer.');
    const t = !cd.ok ? 'err' : cd.frac >= 0.5 ? 'dat' : 'w', a = S.is('size-mislead') ? fr(S, 'size-mislead', 0.45, 0.6) : 1;
    const room = PR.y + PR.h - y;
    if (room > L) para(S, msg, PR.x, y + 2 * u, PR.w, sz, { weight: 800, color: tone(S, t).ink, maxLines: Math.max(1, Math.floor(room / LH(S, sz, 1.28))), a });
  }
}

// ═════════════ vectores e índice ═════════════
const VEC_ID = 'garantia.2';
export function drawVec(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz);
  const ix = mainIndex(l), pos = vocabPos(l), n = ix.vocab.length, ci = ix.chunks.findIndex((c) => c.id === VEC_ID), ch = ix.chunks[ci];
  const lt = tone(S, 'lat'), T = tiny(S);
  const inIndex = S.on('index'), mv = fr(S, 'index', 0.08, 0.4, 'io'), cardA = 1 - fr(S, 'index', 0, 0.15);
  // tabla del índice (geometría fija desde el principio, para que la tira llegue a su fila)
  const hh = LH(S, sz, 1.5), foot = chipH(S, 12) + 6 * u;
  const lw = T ? 0 : Math.min(S.portrait ? 96 * u : 140 * u, A.w * 0.3), TB: Rect = { x: A.x, y: A.y + hh, w: A.w, h: A.h - hh - foot };
  const rowH = Math.min(18 * u, TB.h / 25), showLab = rowH >= 13.5 && !T, sx = TB.x + lw + (lw ? 8 * u : 0), sw = TB.x + TB.w - sx;
  const rowY = (i: number) => TB.y + i * rowH;
  // ── el fragmento y su vector (vector · vector-words · vector-weights) ──
  if (!inIndex || cardA > 0.01) {
    const nL = T ? 1 : S.portrait ? 3 : 2, cr: Rect = { x: A.x, y: A.y + hh, w: A.w, h: cardH(S, nL) };
    const hit = S.on('vector-words') ? new Set(terms(ch.text, l)) : undefined;
    d.withAlpha(cardA, () => {
      header(S, S.l('Un fragmento', 'One chunk'), A, fr(S, 'vector', 0, 0.1));
      chunkCard(S, cr, ch, { tone: 'dat', hit, a: fr(S, 'vector', 0.05, 0.2), maxLines: nL });
    });
  }
  // la tira grande: debajo de la tarjeta; en «index» viaja a su fila de la tabla
  const nL = T ? 1 : S.portrait ? 3 : 2, cardBottom = A.y + hh + cardH(S, nL);
  const big: Rect = { x: A.x, y: cardBottom + L * 1.6 + 8 * u, w: A.w, h: Math.min(T ? 26 * u : 54 * u, A.h * 0.16) };
  const dst: Rect = { x: sx, y: rowY(ci) + 1, w: sw, h: Math.max(3, rowH - 2) };
  const R: Rect = { x: lerp(big.x, dst.x, mv), y: lerp(big.y, dst.y, mv), w: lerp(big.w, dst.w, mv), h: lerp(big.h, dst.h, mv) };
  const aS = fr(S, 'vector', 0.45, 0.6), grow = S.on('vector-weights') ? fr(S, 'vector-weights', 0.1, 0.4, 'io') : 0;
  const vec = S.on('vector-words') ? ix.vecs[ci] : new Map<number, number>();
  const a1 = 1 - fr(S, 'index', 0, 0.15);
  if (!inIndex || a1 > 0.01) d.withAlpha(a1 * aS, () => {
    fitText(S, S.l(`vector: ${n} casilleros, uno por palabra del manual`, `vector: ${n} slots, one per word in the manual`), A.x, big.y - L * 0.75, A.w, sz, { weight: 700, color: lt.ink });
    // los casilleros vacíos, como una regla fina
    const cw = big.w / n;
    for (let i = 0; i < n; i += 1) if (i % 4 === 0) d.line(big.x + i * cw, big.y + big.h - 4 * u, big.x + i * cw, big.y + big.h, alpha(p.ink, 0.25), 1);
  });
  const xs = strip(S, R, vec, pos, n, { grow: inIndex ? 1 : grow, a: aS, max: 0.3 });
  // cuántos casilleros tienen algo
  if (!inIndex || a1 > 0.01) {
    const nz = ix.vecs[ci].size, cy = big.y + big.h + 8 * u + chipH(S, 12) / 2;
    d.withAlpha(a1, () => {
      const c1 = chip(S, S.l(`${nz} con algo`, `${nz} with something`), A.x, cy, 'lat', { size: 12, align: 'left', a: fr(S, 'vector-words', 0.55, 0.7) });
      chip(S, S.l(`${n - nz} en cero`, `${n - nz} at zero`), c1.x + c1.w + 8 * u, cy, 'mute', { size: 12, align: 'left', a: fr(S, 'vector-words', 0.75, 0.88) });
      // dos pesos con nombre: una palabra rara y una común
      if (S.on('vector-weights') && !T) {
        const rare = wordWeight(l, VEC_ID, S.l('ciclos', 'cycles')), common = wordWeight(l, VEC_ID, S.l('garantía', 'warranty'));
        const items = [
          { w: rare, word: S.l('ciclos', 'cycles'), at: 0.35, t: 'lat' as const, sub: S.l(`en ${rare.df} fragmento`, `in ${rare.df} chunk`) },
          { w: common, word: S.l('garantía', 'warranty'), at: 0.55, t: 'mute' as const, sub: S.l(`en ${common.df} fragmentos`, `in ${common.df} chunks`) },
        ];
        const ly = cy + chipH(S, 12) / 2 + 10 * u;
        items.forEach((it, j) => {
          const a = fr(S, 'vector-weights', it.at, it.at + 0.12), x = xs.get(it.w.k) ?? A.x, lx = S.portrait ? A.x + j * A.w * 0.5 : A.x + A.w * (0.35 + j * 0.3);
          d.withAlpha(a, () => {
            d.line(x, big.y + big.h + 2 * u, x, ly - 2 * u, tone(S, it.t === 'lat' ? 'lat' : 'ink').c, 1.2, [3, 3]);
            d.line(x, ly - 2 * u, lx, ly - 2 * u, tone(S, it.t === 'lat' ? 'lat' : 'ink').c, 1.2, [3, 3]);
            fitText(S, `${it.word} ${S.n(it.w.w, 2)}`, lx, ly + L * 0.5, (S.portrait ? A.w * 0.5 : A.w * 0.3) - 8 * u, sz, { weight: 800, font: 'mono', color: it.t === 'lat' ? lt.ink : p.ink2 });
            fitText(S, it.sub, lx, ly + L * 1.45, (S.portrait ? A.w * 0.5 : A.w * 0.3) - 8 * u, FS(S, 12), { weight: 600, color: p.mute });
          });
        });
        const ta = fr(S, 'vector-weights', 0.82, 0.94), ty = ly + L * 2.6;
        if (ty + chipH(S, 12) < A.y + A.h) chip(S, S.l('peso = veces × rareza: TF-IDF', 'weight = count × rarity: TF-IDF'), A.x, ty, 'lat', { size: 12, align: 'left', a: ta, maxW: A.w });
      }
    });
  }
  // ── el índice: 25 vectores con su fuente ──
  if (inIndex) {
    header(S, S.l(`Índice: ${ix.N} vectores, con su texto y su fuente`, `Index: ${ix.N} vectors, with their text and source`), A, fr(S, 'index', 0.15, 0.3), 'lat');
    ix.chunks.forEach((c, i) => {
      const a = i === ci ? 1 : fr(S, 'index', 0.3 + (i / ix.N) * 0.4, 0.4 + (i / ix.N) * 0.4);
      d.withAlpha(a, () => {
        if (showLab) fitText(S, `${c.title.split(/[ ,]/)[0]} §${c.n}`, TB.x, rowY(i) + rowH / 2, lw, FS(S, 12), { weight: i === ci ? 800 : 600, color: i === ci ? tone(S, 'dat').ink : p.ink2 });
        if (i !== ci) strip(S, { x: sx, y: rowY(i) + 1, w: sw, h: Math.max(3, rowH - 2) }, ix.vecs[i], pos, n, { grow: 1, max: 0.3 });
      });
    });
    if (!showLab) d.withAlpha(fr(S, 'index', 0.5, 0.65), () => chip(S, S.l(`${ix.N} fragmentos`, `${ix.N} chunks`), A.x, A.y + A.h - foot / 2 + 2 * u, 'dat', { size: 12, align: 'left' }));
    // base de datos vectorial
    const a = fr(S, 'vector-db', 0.15, 0.3);
    if (a > 0.01) d.withAlpha(a, () => {
      d.rect(TB.x - 4 * u, TB.y - 3 * u, TB.w + 8 * u, 25 * rowH + 6 * u, { stroke: lt.c, lw: 2.2, r: 5 });
      chip(S, S.l('base de datos vectorial', 'vector database'), A.x + A.w, A.y + A.h - foot / 2 + 2 * u, 'lat', { size: 12, align: 'right', solid: true });
    });
    const b = fr(S, 'vector-db', 0.75, 0.9);
    if (b > 0.01 && !tight(S)) chip(S, S.l('se prepara una vez', 'prepared once'), A.x + A.w * (S.portrait ? 0.02 : 0.3), A.y + A.h - foot / 2 + 2 * u, 'dat', { size: 12, align: 'left', a: b });
  }
}
