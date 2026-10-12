// Los datos: cuánto texto y de dónde (GPT-3, Common Crawl); la tubería de limpieza sobre doce páginas escritas para la
// lección (los filtros de crawl.ts corren de verdad); el duplicado casi idéntico medido por trozos de cinco palabras; la regla
// de parecido con su umbral (demostración guiada y «tu turno»); la memorización real de Pythia; y la mezcla de GPT-3.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import {
  ap, area, arrowP, caption, card, chip, chipW, docIcon, fitText, fr, hbar, hold, int, isShort, lineH, lines, mark, measure, para, paraH, pct, provenance, provH, txt,
} from './draw';
import { PAGES, maskPII, runPipeline, shingles, wordsOf, type Row } from './crawl';
import { MIT } from './pythia';

// ═════════ cuánto texto y de dónde ═════════
export function drawWeb(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const gap = P ? 18 : 30;
  const L: Rect = P ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.36 } : { x: A.x, y: A.y, w: A.w * 0.44, h: A.h };
  const R: Rect = P ? { x: A.x, y: A.y + L.h + gap, w: A.w, h: A.h - L.h - gap } : { x: A.x + L.w + gap, y: A.y, w: A.w - L.w - gap, h: A.h };
  // GPT-3: trescientos mil millones de tokens
  const a1 = ap(S, 'web', 0.03, 0.16), wt = tone(S, 'w');
  const big = short ? 24 : P ? 26 : 30, lh = lineH(S, 13), bh = lineH(S, big);
  const y0 = L.y + (L.h - (lh + bh + lh + 12)) / 2;
  d.withAlpha(a1, () => {
    fitText(S, S.l('GPT-3 leyó unos', 'GPT-3 read about'), L.x + L.w / 2, y0 + lh / 2, L.w, { s: 13, weight: 700, c: p.ink2, align: 'center' });
    fitText(S, int(S, 3e11), L.x + L.w / 2, y0 + lh + 6 + bh / 2, L.w, { s: big, weight: 800, mono: true, c: wt.ink, align: 'center' });
    fitText(S, 'tokens', L.x + L.w / 2, y0 + lh + bh + 12 + lh / 2, L.w, { s: 13, weight: 700, c: p.ink2, align: 'center' });
  });
  // la web: páginas que se guardan
  const capH = lineH(S, 13) * 2 + 10, boxH = Math.min(short ? 36 : 46, R.h * 0.2);
  const grid: Rect = { x: R.x, y: R.y, w: R.w, h: R.h - capH - boxH - 22 };
  const cols = P ? 10 : 12, rows = Math.max(2, Math.min(5, Math.floor(grid.h / 26)));
  const dw = Math.min(28, (grid.w - (cols - 1) * 5) / cols), dh = Math.min(dw * 1.2, (grid.h - (rows - 1) * 5) / rows);
  const ox = grid.x + (grid.w - (cols * dw + (cols - 1) * 5)) / 2, oy = grid.y + Math.max(0, (grid.h - (rows * dh + (rows - 1) * 5)) / 2);
  const flow = fr(S, 'web', 0.42, 0.85);
  for (let i = 0; i < cols * rows; i++) {
    const a = ap(S, 'web', 0.36 + (i / (cols * rows)) * 0.25, 0.42 + (i / (cols * rows)) * 0.25);
    if (a <= 0.01) continue;
    const c = i % cols, r = Math.floor(i / cols);
    docIcon(S, ox + c * (dw + 5), oy + r * (dh + 5), dw, dh, i + 7, { a: a * (1 - 0.55 * flow) });
  }
  const bxW = Math.min(R.w * 0.7, 260), bx = R.x + (R.w - bxW) / 2, byy = grid.y + grid.h + 18;
  arrowP(S, R.x + R.w / 2, grid.y + grid.h + 2, R.x + R.w / 2, byy - 3, { p: fr(S, 'web', 0.5, 0.6), tone: 'dat' });
  const a2 = ap(S, 'web', 0.5, 0.62), dt = tone(S, 'dat');
  d.withAlpha(a2, () => {
    d.rect(bx, byy, bxW, boxH, { fill: alpha(dt.c, 0.12), stroke: dt.c, lw: 1.8, r: 5 });
    fitText(S, 'Common Crawl', bx + bxW / 2, byy + boxH / 2, bxW - 12, { s: 15, weight: 800, c: dt.ink, align: 'center' });
  });
  const a3 = ap(S, 'web', 0.62, 0.76);
  para(S, S.l('de 3 000 a 5 000 millones de páginas nuevas al mes · sin fines de lucro, desde 2007', '3 to 5 billion new pages a month · nonprofit, since 2007'), R.x, byy + boxH + 6, R.w, { s: 12.5, c: p.ink2, weight: 600, align: 'center', max: 2, a: a3 });
  provenance(S, S.l('Brown et al., 2020 (GPT-3) · commoncrawl.org', 'Brown et al., 2020 (GPT-3) · commoncrawl.org'), ap(S, 'web', 0, 0.2));
}

// ═════════ la tubería de limpieza ═════════
const BASE_ROWS = runPipeline(1);
const ROW = (id: string) => BASE_ROWS.find((r) => r.page.id === id)!;
/** Copias: páginas que se parecen al menos la mitad a una anterior que se quedó. */
const COPIES = BASE_ROWS.filter((r) => r.langOk && r.quality.ok && r.sim >= 0.5).map((r) => ({ id: r.page.id, of: BASE_ROWS[r.simWith].page }));
const CONTACT_MASKED = maskPII(ROW('contact').page.text).text;
const N_EMAIL = CONTACT_MASKED.split('[correo]').length - 1, N_IP = CONTACT_MASKED.split('[ip]').length - 1;

const STEPS_PIPE = [
  { seg: 'pipe-lang', es: 'Idioma', en: 'Language' },
  { seg: 'pipe-quality', es: 'Calidad', en: 'Quality' },
  { seg: 'pipe-pii', es: 'Datos personales', en: 'Personal data' },
  { seg: 'pipe-dup', es: 'Duplicados', en: 'Duplicates' },
];

/** Momento (segmento y fracción) en que sale cada página y por qué. */
function outEvent(S: Frame, r: Row): { a: number; why: string } | null {
  if (!r.langOk) return { a: ap(S, 'pipe-lang', 0.55, 0.68), why: S.l('otro idioma', 'other language') };
  if (!r.quality.ok) {
    const at: Record<string, number> = { menu: 0.25, spam: 0.5, lorem: 0.72 };
    const why = r.quality.rule === 'punct' ? S.l('sin frases', 'no sentences') : r.quality.rule === 'dup' ? S.l('repite líneas', 'repeats lines') : r.quality.rule === 'lorem' ? S.l('de relleno', 'filler') : r.quality.rule === 'short' ? S.l('líneas cortas', 'short lines') : S.l('código', 'code');
    const k = at[r.page.id] ?? 0.5;
    return { a: ap(S, 'pipe-quality', k, k + 0.12), why };
  }
  return null;
}

function tileGrid(S: Frame, R: Rect) {
  const P = S.portrait, short = isShort(S);
  const cols = P ? 3 : short ? 6 : 4, rows = Math.ceil(PAGES.length / cols), g = short ? 6 : 8;
  const tw = (R.w - (cols - 1) * g) / cols, th = Math.min((R.h - (rows - 1) * g) / rows, tw * 0.9);
  const oy = R.y + Math.max(0, (R.h - (rows * th + (rows - 1) * g)) / 2);
  return PAGES.map((_, i) => ({ x: R.x + (i % cols) * (tw + g), y: oy + Math.floor(i / cols) * (th + g), w: tw, h: th }));
}

export function drawPipe(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  // pasos de la tubería
  const s = 13, ch = lineH(S, s) + 8, gap = 6;
  const labels = STEPS_PIPE.map((st, i) => `${i + 1} ${S.l(st.es, st.en)}`);
  const ws = labels.map((t) => chipW(S, t, s));
  let tw = ws.reduce((a, w) => a + w, 0) + gap * (labels.length - 1);
  const twoRows = tw > A.w;
  const rowsOf = twoRows ? [[0, 1], [2, 3]] : [[0, 1, 2, 3]];
  let y = A.y;
  const aS = ap(S, 'pipe-intro', 0.05, 0.2);
  rowsOf.forEach((rr) => {
    tw = rr.reduce((a, i) => a + ws[i], 0) + gap * (rr.length - 1);
    let x = A.x + (A.w - tw) / 2;
    rr.forEach((i) => {
      const st = STEPS_PIPE[i], on = S.on(st.seg) ? hold(S, st.seg, STEPS_PIPE[i + 1]?.seg ?? 'near-def') : 0, done = S.on(st.seg) ? 1 : 0;
      chip(S, x, y, labels[i], { s, h: ch, w: ws[i], tone: on > 0.5 ? 'dat' : 'mute', active: on * 0.75, a: aS * (0.55 + 0.45 * Math.max(done, on)), weight: 700 });
      x += ws[i] + gap;
    });
    y += ch + 5;
  });
  // cuántas páginas quedan
  const left = BASE_ROWS.filter((r) => {
    const ev = outEvent(S, r); return !(ev && ev.a > 0.5);
  }).length;
  const copies = COPIES.filter((c, i) => ap(S, 'pipe-dup', 0.38 + i * 0.17, 0.48 + i * 0.17) > 0.5).length;
  const status = copies > 0 ? S.l(`quedan ${left} páginas · ${copies} son copias`, `${left} pages left · ${copies} are copies`) : S.l(`quedan ${left} páginas`, `${left} pages left`);
  fitText(S, status, A.x + A.w / 2, y + lineH(S, 13) / 2 + 2, A.w, { s: 13, weight: 700, c: p.ink2, align: 'center', a: aS, mono: true });
  y += lineH(S, 13) + (short ? 6 : 12);
  // las doce páginas
  const R: Rect = { x: A.x, y, w: A.w, h: A.y + A.h - y };
  const cells = tileGrid(S, R);
  BASE_ROWS.forEach((r, i) => {
    const a0 = ap(S, 'pipe-intro', 0.12 + i * 0.035, 0.2 + i * 0.035);
    if (a0 <= 0.01) return;
    tile(S, cells[i], r, a0);
  });
  provenance(S, S.l('ilustrativo: páginas escritas para la lección · los filtros corren de verdad (reglas de FineWeb y C4)', 'illustrative: pages written for the lesson · the filters really run (FineWeb and C4 rules)'), ap(S, 'pipe-intro', 0.3, 0.45));
}

function tile(S: Frame, c: Rect, r: Row, a0: number) {
  const { d, pal: p } = S, er = tone(S, 'err'), dt = tone(S, 'dat');
  const ev = outEvent(S, r), out = ev ? ev.a : 0;
  const ci = COPIES.findIndex((x) => x.id === r.page.id), copy = ci >= 0 ? ap(S, 'pipe-dup', 0.38 + ci * 0.17, 0.48 + ci * 0.17) : 0;
  const masked = r.page.id === 'contact' ? ap(S, 'pipe-pii', 0.22, 0.36) : 0;
  const pad = 6, s = 12.5, lh = lineH(S, s);
  d.withAlpha(a0 * (1 - 0.55 * out), () => {
    d.rect(c.x, c.y, c.w, c.h, { fill: p.surface, stroke: copy > 0.5 ? er.c : p.lineStrong, lw: copy > 0.5 ? 1.8 : 1.2, r: 4, dash: copy > 0.5 ? [5, 3] : undefined });
    const badge = r.page.lang.toUpperCase(), bw = measure(S, badge, 12, true, 700) + 8;
    const tag = S.l(r.page.tag.es, r.page.tag.en), tagW = measure(S, tag, s, false, 800);
    const below = tagW > c.w - 2 * pad - bw - 4;   // mosaico angosto: el idioma va en la segunda línea
    fitText(S, tag, c.x + pad, c.y + pad + lh / 2, below ? c.w - 2 * pad : c.w - 2 * pad - bw - 4, { s, weight: 800 });
    const bx = below ? c.x + pad : c.x + c.w - pad - bw, byB = below ? c.y + pad + lh + 3 : c.y + pad;
    d.rect(bx, byB, bw, lh, { fill: alpha(tone(S, 'lat').c, 0.14), r: 2 });
    txt(S, badge, bx + bw / 2, byB + lh / 2, { s: 12, weight: 700, mono: true, c: tone(S, 'lat').ink, align: 'center' });
    // cuerpo: líneas de texto simuladas o, en «contacto», los datos tapados
    const by = c.y + pad + lh + 6 + (below ? lh + 3 : 0), bh = c.y + c.h - by - pad - (out > 0.01 || copy > 0.01 ? lh + 2 : 0);
    const maskStr = `[${S.l('correo', 'email')}] ×${N_EMAIL} · [ip] ×${N_IP}`, maskTwo = measure(S, maskStr, 12, true, 700) > c.w - 2 * pad;
    const maskH = masked > 0.01 ? (maskTwo ? 2 : 1) * lh : 0;
    if (masked > 0.01 && bh > lh) d.withAlpha(masked, () => {
      if (!maskTwo) fitText(S, maskStr, c.x + pad, by + lh / 2, c.w - 2 * pad, { s: 12, weight: 700, mono: true, c: dt.ink });
      else {
        fitText(S, `[${S.l('correo', 'email')}] ×${N_EMAIL}`, c.x + pad, by + lh / 2, c.w - 2 * pad, { s: 12, weight: 700, mono: true, c: dt.ink });
        if (bh > 2 * lh) fitText(S, `[ip] ×${N_IP}`, c.x + pad, by + lh * 1.5, c.w - 2 * pad, { s: 12, weight: 700, mono: true, c: dt.ink });
      }
    });
    const n = Math.max(0, Math.min(4, Math.floor((bh - maskH) / 8)));
    for (let k = 0; k < n; k++) {
      const yy = by + maskH + 2 + k * 8;
      if (yy + 3 > by + bh) break;
      d.rect(c.x + pad, yy, (c.w - 2 * pad) * (0.55 + 0.45 * ((i32(r.page.id) + k * 7) % 10) / 10), 3, { fill: alpha(p.ink, 0.18) });
    }
  });
  // por qué sale (o de quién es copia)
  if (out > 0.01) d.withAlpha(a0 * out, () => {
    const narrow = c.w < 150;   // en mosaicos angostos, el motivo usa todo el ancho (el mosaico ya se ve apagado)
    if (!narrow) mark(S, c.x + c.w - 10, c.y + c.h - 10, false, 5);
    fitText(S, `✕ ${ev!.why}`, c.x + pad, c.y + c.h - pad - lh / 2, c.w - 2 * pad - (narrow ? 0 : 20), { s: 12, weight: 800, c: er.ink });
  });
  if (copy > 0.01) {
    const of = COPIES[ci].of;
    d.withAlpha(a0 * copy, () => fitText(S, `≈ ${S.l(of.tag.es, of.tag.en)}`, c.x + pad, c.y + c.h - pad - lh / 2, c.w - 2 * pad, { s: 12, weight: 800, c: er.ink }));
  }
}
const i32 = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 1000; return h; };

// ═════════ duplicado casi idéntico ═════════
const firstSentence = (id: string) => { const body = ROW(id).page.text.split('\n')[1]; return body.slice(0, body.indexOf('.') + 1); };
const EX = {
  es: ['plantarán dos mil árboles nuevos junto al río', 'plantarán tres mil árboles nuevos junto al río'],
  en: ['plant two thousand trees along the river path', 'plant three thousand trees along the river path'],
};

export function drawNear(S: Frame) {
  const aDef = hold(S, 'near-def', 'near-chunks');
  if (aDef > 0.01) drawDiff(S, aDef);
  const aCh = ap(S, 'near-chunks', 0, 0.1);
  if (aCh > 0.01) drawChunks(S, aCh);
}

/** Reparto de un texto palabra por palabra (las resaltadas llevan más aire alrededor). */
function wordsLayout(S: Frame, words: string[], hot: boolean[], w: number, s: number) {
  const lh = lineH(S, s, 1.5), sp = measure(S, ' ', s) + 1, pad = 4;
  const pos: { x: number; y: number; w: number }[] = [];
  let cx = 0, cy = 0;
  words.forEach((wd, i) => {
    const ww = measure(S, wd, s, false, hot[i] ? 800 : 600), extra = hot[i] ? pad : 0;
    if (cx > 0 && cx + ww + 2 * extra > w) { cx = 0; cy += lh; }
    pos.push({ x: cx + extra, y: cy, w: ww }); cx += ww + 2 * extra + sp;
  });
  return { pos, h: cy + lh, lh };
}
function wordsPara(S: Frame, words: string[], hot: boolean[], x: number, y: number, w: number, s: number, hotA: number) {
  const { d, pal: p } = S, er = tone(S, 'err'), L = wordsLayout(S, words, hot, w, s);
  words.forEach((wd, i) => {
    const q = L.pos[i];
    if (hot[i] && hotA > 0.01) d.rect(x + q.x - 3, y + q.y + 2, q.w + 6, L.lh - 4, { fill: alpha(er.c, 0.2 * hotA), stroke: alpha(er.c, hotA), lw: 1.4, r: 3 });
    txt(S, wd, x + q.x, y + q.y + L.lh / 2, { s, weight: hot[i] ? 800 : 600, c: hot[i] && hotA > 0.5 ? er.ink : p.ink });
  });
  return L.h;
}

function drawDiff(S: Frame, a: number) {
  const { pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const wa = firstSentence('news').split(' '), wb = firstSentence('news-edit').split(' ');
  const hot = wa.map((w, i) => w !== wb[i]);
  const gap = 12, tagH = lineH(S, 14) + 22;
  const cw = P ? A.w : (A.w - gap) / 2, s = short ? 13 : 15;
  const headH = lineH(S, 13) + 14;
  const textH = Math.max(wordsLayout(S, wa, hot, cw - 24, s).h, wordsLayout(S, wb, hot, cw - 24, s).h);
  const chh = headH + textH + 14;
  const groupH = (P ? 2 * chh + gap : chh) + tagH, oy = A.y + Math.max(0, (A.h - groupH) / 2);
  const cards: Rect[] = P ? [{ x: A.x, y: oy, w: cw, h: chh }, { x: A.x, y: oy + chh + gap, w: cw, h: chh }] : [{ x: A.x, y: oy, w: cw, h: chh }, { x: A.x + cw + gap, y: oy, w: cw, h: chh }];
  const hotA = ap(S, 'near-def', 0.4, 0.55);
  ([[S.l('Noticia original', 'Original story'), wa], [S.l('Copia editada', 'Edited copy'), wb]] as [string, string[]][]).forEach(([head, words], i) => {
    const r = cards[i], ai = a * ap(S, 'near-def', 0.04 + i * 0.12, 0.14 + i * 0.12);
    if (ai <= 0.01) return;
    S.d.withAlpha(ai, () => {
      card(S, r);
      fitText(S, head, r.x + 12, r.y + 8 + lineH(S, 13) / 2, r.w - 24, { s: 13, weight: 800, c: p.ink2 });
      wordsPara(S, words, hot, r.x + 12, r.y + headH, r.w - 24, s, hotA);
    });
  });
  const t = S.l('≈ duplicado casi idéntico', '≈ near-duplicate'), th = lineH(S, 14) + 8;
  const ty = oy + groupH - tagH / 2;
  chip(S, A.x + (A.w - chipW(S, t, 14)) / 2, ty - th / 2, t, { s: 14, h: th, tone: 'err', a: a * ap(S, 'near-def', 0.68, 0.8) });
  provenance(S, S.l('ilustrativo: páginas escritas para la lección', 'illustrative: pages written for the lesson'), a);
}

function drawChunks(S: Frame, a: number) {
  const { d, pal: p } = S, A0 = area(S), short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const [ta, tb] = EX[S.lang], wa = wordsOf(ta), wb = wordsOf(tb);
  const shA = [...shingles(ta)], shB = new Set(shingles(tb));
  const setA = new Set(shA), union = new Set([...shA, ...shB]).size, both = shA.filter((x) => shB.has(x)).length;
  const share = ap(S, 'near-share', 0, 0.1);
  // tamaño de las palabras: lo más grande que quepa
  // tamaño y relleno de las palabras: lo más grande que quepa (en pantallas angostas, con menos relleno)
  let s = short ? 14 : S.portrait ? 15 : 17, px = 7, gapW = 6;
  const wordW = (w: string, sz: number) => measure(S, w, sz, false, 600) + 2 * px;
  const rowW = (ws: string[], sz: number) => ws.reduce((acc, w) => acc + wordW(w, sz), 0) + gapW * (ws.length - 1);
  while (s > 12.2 / S.u && Math.max(rowW(wa, s), rowW(wb, s)) > A.w) s -= 0.5;
  if (Math.max(rowW(wa, s), rowW(wb, s)) > A.w) { px = 3; gapW = 3; }
  const ch = lineH(S, s) + 8, barH = short ? 6 : 8, barG = short ? 3 : 4, winH = 4 * (barH + barG);
  const resH = lineH(S, 14) + 10;
  const blockH = (ch + 6 + winH) * 2 + (short ? 10 : 22) + resH;
  let y = A.y + Math.max(0, (A.h - blockH) / 2);
  const row = (words: string[], yy: number, other: Set<string>, mine: string[], segA: string, isB: boolean) => {
    const tw = rowW(words, s); let x = A.x + (A.w - tw) / 2;
    const xs: [number, number][] = [];
    words.forEach((w, i) => {
      const changed = isB ? w !== wa[i] : w !== wb[i];
      const hot = changed ? share : 0;
      const cw = wordW(w, s);
      chip(S, x, yy, w, { s, h: ch, w: cw, tone: hot > 0.5 ? 'err' : 'lat', a: a * ap(S, segA, 0.03 + i * 0.03, 0.1 + i * 0.03), weight: 600 });
      xs.push([x, x + cw]); x += cw + gapW;
    });
    // trozos de cinco palabras: una barra por trozo, escalonadas
    mine.forEach((sh, j) => {
      const aj = a * ap(S, segA, 0.32 + j * 0.12, 0.42 + j * 0.12);
      if (aj <= 0.01) return;
      const x0 = xs[j][0], x1 = xs[j + 4][1], yb = yy + ch + 6 + j * (barH + barG);
      const shared = other.has(sh);
      const kShared = shared ? share : 0, kOdd = shared ? 0 : share;
      const t = kShared > 0.5 ? tone(S, 'dat') : kOdd > 0.5 ? tone(S, 'err') : tone(S, 'lat');
      d.withAlpha(aj, () => d.rect(x0, yb, x1 - x0, barH, { fill: alpha(t.c, kOdd > 0.5 ? 0.12 : 0.55), stroke: t.c, lw: 1.2, r: 2, dash: kOdd > 0.5 ? [4, 2] : undefined }));
    });
  };
  row(wa, y, shB, shA, 'near-chunks', false);
  // rótulo del primer paso
  const capA = S.l(`${wa.length} palabras → ${shA.length} trozos de 5 palabras`, `${wa.length} words → ${shA.length} chunks of 5 words`);
  y += ch + 6 + winH + (short ? 10 : 22);
  if (share < 0.99) caption(S, capA, A.x + A.w / 2, y - (short ? 5 : 11), A.w, { align: 'center', a: a * ap(S, 'near-chunks', 0.75, 0.88) * (1 - share), c: p.ink2 });
  if (share > 0.01) {
    d.withAlpha(share, () => row(wb, y, setA, [...shingles(tb)], 'near-share', true));
    const res = S.l(`en las dos: ${both} de ${union} trozos distintos = ${pct(S, both / union, 0)}`, `in both: ${both} of ${union} different chunks = ${pct(S, both / union, 0)}`);
    const ry = y + ch + 6 + winH + (short ? 8 : 16) + resH / 2;
    para(S, res, A.x, ry - lineH(S, 14) / 2, A.w, { s: 14, weight: 800, mono: true, align: 'center', c: tone(S, 'dat').ink, a: ap(S, 'near-share', 0.55, 0.7), max: 2 });
  }
  provenance(S, S.l('parecido = trozos en ambas ÷ trozos distintos (índice de Jaccard)', 'similarity = chunks in both ÷ different chunks (Jaccard index)'), a);
}

// ═════════ la regla del parecido y el umbral ═════════
const RULER_ITEMS = [
  { id: 'recipe-copy', es: 'receta con otro pie', en: 'recipe, new footer' },
  { id: 'news-copy', es: 'noticia con otro título', en: 'story, new headline' },
  { id: 'news-edit', es: 'noticia editada', en: 'edited story' },
  { id: 'recipe-para', es: 'receta reescrita', en: 'rewritten recipe' },
  { id: 'garden', es: 'artículo distinto', en: 'different article' },
].map((it) => ({ ...it, v: ROW(it.id).sim }));

/** Umbral que se dibuja: el del control desde la demostración; antes, sin umbral. */
export const thrShown = (S: Frame) => (S.on('thr-demo') ? clamp(+(S.p.thr ?? 1), 0.05, 1) : 1.01);

export function drawRuler(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), short = isShort(S), er = tone(S, 'err'), dt = tone(S, 'dat');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const thr = thrShown(S), rows = S.on('thr-demo') ? runPipeline(Math.round(thr * 100) / 100) : BASE_ROWS;
  const aThr = ap(S, 'thr-demo', 0, 0.1);
  const headH = lineH(S, 13) + 10, axisH = lineH(S, 12) + 16 + lineH(S, 12);
  const rx0 = A.x + 8, rx1 = A.x + A.w - 8, X = (v: number) => rx0 + (rx1 - rx0) * clamp(v);
  const rh = Math.min(lineH(S, 13) + 26, (A.h - headH - axisH) / RULER_ITEMS.length);
  const oy = A.y + Math.max(0, (A.h - headH - axisH - rh * RULER_ITEMS.length) / 2), top = oy + headH;
  const yAxis = top + rh * RULER_ITEMS.length + 6;
  // zona que sale
  if (aThr > 0.01 && thr <= 1) d.withAlpha(aThr, () => {
    d.rect(X(thr), top - 4, rx1 - X(thr), yAxis - top + 4, { fill: alpha(er.c, 0.07) });
  });
  // regla
  const aAx = ap(S, 'near-ruler', 0.02, 0.12);
  d.withAlpha(aAx, () => {
    d.line(rx0, yAxis, rx1, yAxis, p.lineStrong, 1.5);
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
      d.line(X(v), yAxis, X(v), yAxis + 5, p.lineStrong, 1.3);
      txt(S, pct(S, v, 0), X(v), yAxis + 8 + lineH(S, 12) / 2, { s: 12, weight: 600, mono: true, c: p.mute, align: v === 0 ? 'left' : v === 1 ? 'right' : 'center' });
    });
    caption(S, S.l('parecido con la página más parecida que ya se quedó', 'similarity to the most similar page already kept'), A.x + A.w / 2, yAxis + 12 + lineH(S, 12) * 1.5, A.w, { align: 'center' });
  });
  // umbral
  if (aThr > 0.01 && thr <= 1) d.withAlpha(aThr, () => {
    const x = X(thr);
    d.line(x, top - 6, x, yAxis + 2, er.c, 2.2, [6, 4]);
    const lab = `${S.l('umbral', 'threshold')} ${pct(S, thr, 0)}`, lw = measure(S, lab, 13, true, 800);
    const saleW = measure(S, S.l('salen: 0', 'out: 0'), 13, false, 800) + 14, lx = clamp(x - lw / 2, A.x + saleW, A.x + A.w - lw);
    txt(S, lab, lx, oy + headH / 2 - 2, { s: 13, weight: 800, mono: true, c: er.ink, halo: true });
  });
  // páginas
  const at = [0.12, 0.42, 0.68, 0.84, 0.88];
  let gone = 0;
  RULER_ITEMS.forEach((it, i) => {
    const a = ap(S, 'near-ruler', at[i], at[i] + 0.1);
    if (a <= 0.01) return;
    const r = rows.find((x) => x.page.id === it.id)!, out = S.on('thr-demo') && r.dup ? 1 : 0;
    gone += out;
    const y = top + i * rh + rh / 2, x = X(it.v);
    const label = `${S.l(it.es, it.en)} · ${pct(S, it.v, 0)}`, s = 12.5, cw = chipW(S, label, s), chH = lineH(S, s) + 6;
    const left = x - cw - 12 >= A.x;
    d.withAlpha(a, () => {
      d.line(x, y, x, yAxis, alpha(p.ink, 0.25), 1, [2, 3]);
      const cx = left ? x - cw - 12 : Math.min(x + 12, A.x + A.w - cw);
      d.rect(cx - 1, y - chH / 2 - 1, cw + 2, chH + 2, { fill: p.stage, r: 3 });   // la línea del umbral pasa por detrás
      chip(S, cx, y - chH / 2, label, { s, h: chH, w: cw, tone: out ? 'err' : 'lat', dash: !!out, a: out ? 0.75 : 1, weight: 700 });
      if (out) mark(S, x, y, false, 5); else d.circle(x, y, 5, { fill: dt.c, stroke: p.stage, lw: 1.5 });
    });
  });
  // cuántas salen
  if (aThr > 0.01) fitText(S, S.l(`salen: ${gone}`, `out: ${gone}`), A.x, oy + headH / 2 - 2, Math.min(A.w * 0.3, 110), { s: 13, weight: 800, c: er.ink, a: aThr * (thr <= 1 ? 1 : 0) });
  else caption(S, S.l('parecido de cada página', 'how alike each page is'), A.x, oy + headH / 2 - 2, A.w, { a: aAx });
  provenance(S, S.l('ilustrativo: páginas escritas para la lección · parecido calculado de verdad', 'illustrative: pages written for the lesson · similarity really computed'), aAx);
  void short;
}

// ═════════ lo repetido se memoriza (Pythia y la licencia MIT) ═════════
export function drawRecite(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S), dt = tone(S, 'dat');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const footH = lineH(S, 14) + 16, gap = 12;
  const side = !P;
  const cw = side ? (A.w - gap) / 2 : A.w;
  const s = short ? 12.5 : 14, head = lineH(S, 13) + 14, lh = lineH(S, s);
  const truth = MIT.truth.trimStart();
  const n1 = lines(S, MIT.prompt, cw - 24, { s, mono: true, weight: 600 }).length, n2 = lines(S, truth, cw - 24, { s, mono: true, weight: 700 }).length;
  const avail = side ? A.h - footH : (A.h - footH - gap) / 2;
  const h1 = Math.min(avail, head + (side ? Math.max(n1, n2) : n1) * lh + 14), h2 = Math.min(avail, head + (side ? Math.max(n1, n2) : n2) * lh + 14);
  const groupH = (side ? h1 : h1 + gap + h2) + footH, oy = A.y + Math.max(0, (A.h - groupH) / 2);
  const c1: Rect = { x: A.x, y: oy, w: cw, h: h1 };
  const c2: Rect = side ? { x: A.x + cw + gap, y: oy, w: cw, h: h2 } : { x: A.x, y: oy + h1 + gap, w: cw, h: h2 };
  const a1 = ap(S, 'recite', 0.05, 0.16);
  d.withAlpha(a1, () => {
    card(S, c1);
    fitText(S, S.l('le damos el principio', 'we give it the start'), c1.x + 12, c1.y + 8 + lineH(S, 13) / 2, c1.w - 24, { s: 13, weight: 800, c: p.ink2 });
    para(S, MIT.prompt, c1.x + 12, c1.y + head, c1.w - 24, { s, mono: true, weight: 600, max: Math.max(1, Math.floor((c1.h - head - 8) / lh)) });
  });
  const a2 = ap(S, 'recite', 0.2, 0.3);
  d.withAlpha(a2, () => {
    card(S, c2, { tone: 'dat' });
    fitText(S, S.l('Pythia continúa', 'Pythia continues'), c2.x + 12, c2.y + 8 + lineH(S, 13) / 2, c2.w - 24, { s: 13, weight: 800, c: dt.ink });
    const k = fr(S, 'recite', 0.28, 0.78), n = Math.round(truth.length * k);
    // se escribe de corrido, sin que las líneas se reacomoden: se calcula el reparto con el texto completo
    const all = lines(S, truth, c2.w - 24, { s, mono: true, weight: 700 }).slice(0, Math.max(1, Math.floor((c2.h - head - 8) / lh)));
    let left = n;
    all.forEach((ln, j) => {
      if (left <= 0) return;
      const part = ln.slice(0, left); left -= ln.length + 1;
      txt(S, part, c2.x + 12, c2.y + head + j * lh + lh / 2, { s, weight: 700, mono: true, c: dt.ink });
    });
  });
  const aF = ap(S, 'recite', 0.8, 0.92);
  d.withAlpha(aF, () => {
    const t = S.l(`${MIT.row.match} de ${MIT.row.truth} piezas, idénticas al original`, `${MIT.row.match} of ${MIT.row.truth} pieces, identical to the original`);
    const tw = Math.min(A.w - 30, measure(S, t, 14, false, 800)), x = A.x + (A.w - tw - 26) / 2, y = oy + groupH - footH / 2;
    mark(S, x + 7, y, true, 6);
    fitText(S, t, x + 24, y, tw, { s: 14, weight: 800, c: dt.ink });
  });
  provenance(S, S.l('medición real · Pythia-1.4B, último punto de control · decodificación voraz', 'real measurement · Pythia-1.4B, last checkpoint · greedy decoding'), a1);
}

// ═════════ calidad: la mezcla de GPT-3 ═════════
const MIX = [
  { es: 'Wikipedia', en: 'Wikipedia', v: 3.4, hot: true, at: 0.22 },
  { es: 'WebText2 (páginas enlazadas)', en: 'WebText2 (linked pages)', v: 2.9, hot: false, at: 0.62 },
  { es: 'Libros 1', en: 'Books1', v: 1.9, hot: false, at: 0.66 },
  { es: 'Web filtrada (Common Crawl)', en: 'Filtered web (Common Crawl)', v: 0.44, hot: true, at: 0.4 },
  { es: 'Libros 2', en: 'Books2', v: 0.43, hot: false, at: 0.7 },
];
export function drawQuality(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, wt = tone(S, 'w');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const headH = lineH(S, 14) + 14;
  const a0 = ap(S, 'quality', 0.03, 0.15);
  fitText(S, S.l('GPT-3: cuántas veces leyó cada fuente', 'GPT-3: how many times it read each source'), A.x, A.y + headH / 2, A.w, { s: 14, weight: 800, a: a0 });
  const rowsH = A.h - headH - lineH(S, 12) - 10;
  const rh = Math.min(P ? 58 : 44, rowsH / MIX.length);
  const labW = P ? A.w : Math.min(A.w * 0.4, 260), valW = measure(S, '0.44 ×', 13, true, 800) + 10;
  const bx = P ? A.x : A.x + labW, bw = A.x + A.w - valW - bx, max = 3.6;
  const top = A.y + headH;
  // la marca de «una vez»
  const xOne = bx + bw * (1 / max);
  d.withAlpha(a0, () => {
    d.line(xOne, top, xOne, top + rh * MIX.length, p.ink, 1.4, [4, 4]);
    txt(S, S.l('1 vez', 'once'), xOne, top + rh * MIX.length + 6 + lineH(S, 12) / 2, { s: 12, weight: 700, c: p.ink2, align: 'center' });
  });
  MIX.forEach((m, i) => {
    const a = ap(S, 'quality', m.at, m.at + 0.1), y = top + i * rh;
    if (a <= 0.01) return;
    const lab = S.l(m.es, m.en);
    d.withAlpha(a, () => {
      const barY = P ? y + lineH(S, 13) + 2 : y + rh * 0.22, barH = P ? rh - lineH(S, 13) - 10 : rh * 0.56;
      fitText(S, lab, A.x, P ? y + lineH(S, 13) / 2 : y + rh / 2, P ? A.w - valW : labW - 8, { s: 13, weight: m.hot ? 800 : 600, c: m.hot ? wt.ink : p.ink });
      hbar(S, bx, barY, bw, barH, m.v / max, { tone: 'w', hot: m.hot ? 1 : 0 });
      txt(S, `${S.n(m.v, m.v < 1 ? 2 : 1)} ×`, A.x + A.w, barY + barH / 2, { s: 13, weight: 800, mono: true, c: m.hot ? wt.ink : p.ink2, align: 'right' });
    });
  });
  provenance(S, S.l('Brown et al., 2020 (GPT-3), tabla 2.2: veces que se leyó cada conjunto en 300 mil M de tokens', 'Brown et al., 2020 (GPT-3), table 2.2: times each dataset was read in 300B tokens'), a0);
}
