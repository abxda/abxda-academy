// Acto E (heads-why → real-few): varias cabezas y atención REAL de BERT medida con `real-attention.py` (ver real-data.ts).
// Inglés: bert-base-uncased · español: bert-base-multilingual-cased (distinto modelo, así que las cabezas elegidas no coinciden).
// Lo que se ve sale de medir ESTA frase; la cabeza «de referencia» es la mejor de 144 (la más legible), no la típica.
import { alpha, badge, clamp, inset, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { layoutChips, chip, chipSize } from './act-sentence';
import { gridGeom, mapGrid } from './act-map';
import { REAL, type RealHead } from './real-data';
import { actAlpha, arcBetween, fs, pct, textBlock, textTop, title } from './ui';

export type Kind = RealHead['kind'];
/** Orden en pantalla (la cabeza de referencia no va primera: hay que buscarla). */
export const HEAD_ORDER: Kind[] = ['sep', 'prev', 'ref', 'next'];
const LETTERS = ['A', 'B', 'C', 'D'];

export interface HeadsState { word: number; head: number; prev: number; t0: number; touched: boolean }
export const newHeadsState = (): HeadsState => ({ word: REAL.es.query, head: 1, prev: 1, t0: -9, touched: false });

const headsOf = (S: Frame) => HEAD_ORDER.map((k) => REAL[S.lang].heads.find((h) => h.kind === k)!);
const nameOf = (S: Frame, h: RealHead) => S.l(`capa ${h.layer} · cabeza ${h.head}`, `layer ${h.layer} · head ${h.head}`);

// ───────────────────────────── miniaturas ─────────────────────────────
function miniMap(S: Frame, r: Rect, M: number[][], o: { a?: number; hot?: number; sel?: boolean }) {
  const { d, pal: p } = S, sig = tone(S, 'sig'), n = M.length, cs = r.w / n;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2 });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const w = M[i][j]; if (w > 0.01) d.rect(r.x + j * cs, r.y + i * cs, cs + 0.3, cs + 0.3, { fill: alpha(sig.c, 0.1 + 0.9 * Math.min(1, w)) }); }
    if (o.hot !== undefined) d.rect(r.x, r.y + o.hot * cs, r.w, cs, { stroke: p.ink, lw: 1.5 });
    d.rect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1, { stroke: o.sel ? sig.c : p.lineStrong, lw: o.sel ? 3 : 1.25 });
  });
}

// ───────────────────────────── heads-why: el esquema ─────────────────────────────
export function drawHeadsWhy(S: Frame) {
  const A = actAlpha(S, 'heads-why', 'heads-real'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), hs = headsOf(S), sig = tone(S, 'sig'), lat = tone(S, 'lat'), wt = tone(S, 'w'), dat = tone(S, 'dat');
  const size = fs(S, 12), ar = (x1: number, y1: number, x2: number, y2: number, a: number) => d.arrow(x1, y1, x2, y2, p.ink2, 1.6, 7, a);
  const box = (r: Rect, label: string, t: Tone, a: number, sub?: string) => d.withAlpha(a, () => {
    const tc = tone(S, t);
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tc.c, 0.12), stroke: tc.c, lw: 1.5, r: 3 });
    textBlock(S, label, r.x + r.w / 2, r.y + r.h / 2 - (sub ? 7 * u : 0), r.w - 6 * u, { size: fs(S, 13), weight: 800, color: tc.ink, align: 'center' });
    if (sub) textBlock(S, sub, r.x + r.w / 2, r.y + r.h / 2 + 9 * u, r.w - 6 * u, { size, weight: 600, color: p.mute, align: 'center' });
  });
  const aH = (i: number) => S.reveal('heads-why', 0.3 + i * 0.5, 0.5), aC = S.reveal('heads-why', 4.4, 0.6), aO = S.reveal('heads-why', 5.6, 0.6), aOut = S.reveal('heads-why', 6.8, 0.6);
  d.withAlpha(A, () => {
    const headBox = (r: Rect, i: number, a: number) => d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: sig.c, lw: 1.5, r: 3 });
      d.text(S.l(`cabeza ${i + 1}`, `head ${i + 1}`), r.x + 6 * u, r.y + 5 * u, { size, weight: 800, color: sig.ink, base: 'top' });
      const ms = Math.min(r.h - 28 * u, r.w - 12 * u, 62 * u);
      miniMap(S, { x: r.x + 6 * u, y: r.y + r.h - ms - 6 * u, w: ms, h: ms }, hs[i].M, {});
      if (!S.portrait || r.w > 90 * u) d.text('W_Q W_K W_V', r.x + r.w - 6 * u, r.y + r.h - 8 * u, { size, weight: 700, font: 'mono', color: wt.ink, align: 'right', base: 'bottom', a: r.w > 120 * u ? 1 : 0 });
      else d.text('W', r.x + r.w - 6 * u, r.y + 5 * u, { size, weight: 700, font: 'mono', color: wt.ink, align: 'right', base: 'top' });
    });
    if (S.portrait) {
      const g = 6 * u, hw = (all.w - 3 * g) / 4, hh = 98 * u;
      const xb: Rect = { x: all.x + all.w / 2 - 100 * u, y: all.y, w: 200 * u, h: 32 * u };
      box(xb, S.l('vectores de las palabras', 'word vectors'), 'lat', 1);
      const hy = xb.y + xb.h + 26 * u;
      const hr = [0, 1, 2, 3].map((i) => ({ x: all.x + i * (hw + g), y: hy, w: hw, h: hh }));
      hr.forEach((r, i) => { ar(xb.x + xb.w / 2 + (i - 1.5) * 20 * u, xb.y + xb.h, r.x + r.w / 2, r.y, aH(i)); headBox(r, i, aH(i)); });
      const cy = hy + hh + 22 * u, cb: Rect = { x: all.x, y: cy, w: all.w, h: 28 * u };
      hr.forEach((r, i) => ar(r.x + r.w / 2, r.y + r.h, r.x + r.w / 2, cy, aC * aH(i)));
      box(cb, S.l('pegar los resultados', 'join the results'), 'sig', aC);
      const ob: Rect = { x: all.x + all.w / 2 - 90 * u, y: cy + cb.h + 18 * u, w: 180 * u, h: 28 * u };
      ar(all.x + all.w / 2, cb.y + cb.h, all.x + all.w / 2, ob.y, aO); box(ob, S.l('combinar: × W_O', 'combine: × W_O'), 'w', aO);
      const out: Rect = { x: ob.x, y: ob.y + ob.h + 18 * u, w: ob.w, h: 28 * u };
      ar(all.x + all.w / 2, ob.y + ob.h, all.x + all.w / 2, out.y, aOut); box(out, S.l('salida', 'output'), 'dat', aOut);
    } else {
      const cx = (f: number) => all.x + all.w * f, gv = 10 * u;
      const xb: Rect = { x: cx(0), y: all.y + all.h / 2 - 40 * u, w: all.w * 0.13, h: 80 * u };
      box(xb, S.l('vectores de las palabras', 'word vectors'), 'lat', 1);
      const hh = Math.min(100 * u, (all.h - 3 * gv) / 4), hx = cx(0.23), hw = all.w * 0.3, top = all.y + (all.h - (4 * hh + 3 * gv)) / 2;
      const hr = [0, 1, 2, 3].map((i) => ({ x: hx, y: top + i * (hh + gv), w: hw, h: hh }));
      const cb: Rect = { x: cx(0.6), y: all.y + all.h / 2 - 90 * u, w: all.w * 0.08, h: 180 * u };
      hr.forEach((r, i) => { ar(xb.x + xb.w, xb.y + xb.h / 2 + (i - 1.5) * 12 * u, r.x, r.y + r.h / 2, aH(i)); headBox(r, i, aH(i)); ar(r.x + r.w, r.y + r.h / 2, cb.x, cb.y + cb.h / 2 + (i - 1.5) * 40 * u, aC * aH(i)); });
      d.withAlpha(aC, () => { d.rect(cb.x, cb.y, cb.w, cb.h, { fill: alpha(sig.c, 0.12), stroke: sig.c, lw: 1.5, r: 3 }); });
      d.withAlpha(aC, () => { const c = S.ctx; c.save(); c.translate(cb.x + cb.w / 2, cb.y + cb.h / 2); c.rotate(-Math.PI / 2); d.text(S.l('pegar los resultados', 'join the results'), 0, 0, { size: fs(S, 13), weight: 800, color: sig.ink, align: 'center', base: 'middle' }); c.restore(); });
      const ob: Rect = { x: cx(0.72), y: all.y + all.h / 2 - 28 * u, w: all.w * 0.12, h: 56 * u };
      ar(cb.x + cb.w, cb.y + cb.h / 2, ob.x, ob.y + ob.h / 2, aO); box(ob, '× W_O', 'w', aO, S.l('combinar', 'combine'));
      const out: Rect = { x: cx(0.88), y: ob.y, w: all.w * 0.12, h: ob.h };
      ar(ob.x + ob.w, ob.y + ob.h / 2, out.x, out.y + out.h / 2, aOut); box(out, S.l('salida', 'output'), 'dat', aOut);
    }
    void lat; void dat;
  });
}

// ───────────────────────────── heads-real y try3: las cuatro cabezas ─────────────────────────────
export interface HLay { map: Rect; thumbs: Rect[]; panel: Rect; ts: number; lab: number }
export function headsLayout(S: Frame): HLay {
  const u = S.u, all = inset(S.full(), 14 * u), gap = 10 * u;
  if (S.portrait) {
    const ts = 58 * u, lab = 24 * u, capH = 22 * u, mh = all.h - ts - lab - capH - 2 * gap;
    const map = { x: all.x, y: all.y, w: all.w, h: mh }, g = (all.w - 4 * ts) / 3, y = map.y + map.h + gap;
    return { map, ts, lab, thumbs: [0, 1, 2, 3].map((i) => ({ x: all.x + i * (ts + g), y, w: ts, h: ts })), panel: { x: all.x, y: y + ts + lab, w: all.w, h: capH } };
  }
  const mw = Math.round(Math.min(all.h + 52 * u, all.w * 0.54)), map = { x: all.x, y: all.y, w: mw, h: all.h }, px = all.x + mw + gap * 1.5, pw = all.w - mw - gap * 1.5;
  const ts = Math.min((pw - 3 * 8 * u) / 4, 92 * u), lab = ts >= 70 * u ? 50 * u : 22 * u;
  return { map, ts, lab, thumbs: [0, 1, 2, 3].map((i) => ({ x: px + i * (ts + 8 * u), y: all.y, w: ts, h: ts })), panel: { x: px, y: all.y + ts + lab + 10 * u, w: pw, h: all.h - ts - lab - 10 * u } };
}

const headNote = (S: Frame, h: RealHead) =>
  h.kind === 'prev' ? S.l(`en promedio, ${pct(S, h.metric ?? 0)} % de la atención de cada palabra va a la palabra anterior`, `on average, ${pct(S, h.metric ?? 0)} % of each word’s attention goes to the previous word`)
  : h.kind === 'next' ? S.l(`en promedio, ${pct(S, h.metric ?? 0)} % va a la palabra siguiente`, `on average, ${pct(S, h.metric ?? 0)} % goes to the next word`)
  : h.kind === 'sep' ? S.l(`en promedio, ${pct(S, h.metric ?? 0)} % va a las marcas [CLS], [SEP] y el punto`, `on average, ${pct(S, h.metric ?? 0)} % goes to the marks [CLS], [SEP], and the period`)
  : S.l('la más legible de las 144 para esta frase', 'the most readable of the 144 for this sentence');

export function drawHeadsMaps(S: Frame) {
  const A = actAlpha(S, 'heads-real', 'real-flip'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, L = headsLayout(S), st: HeadsState = S.st.hd ?? newHeadsState(), R = REAL[S.lang], words = R.words.heavy, hs = headsOf(S), sig = tone(S, 'sig');
  const inTry = S.on('try3'), sel = inTry ? st.head : 1, word = inTry ? st.word : R.query;
  const k = inTry ? clamp((S.clock - st.t0) / 0.28) : 1, from = hs[st.prev].M, to = hs[sel].M;
  const M = inTry && k < 1 ? to.map((row, i) => row.map((w, j) => lerp(from[i][j], w, k))) : to;
  d.withAlpha(A, () => {
    mapGrid(S, L.map, { words, M, hotRow: word, rowA: () => S.reveal('heads-real', 0, 0.5), minNum: 0.12 });
    hs.forEach((h, i) => {
      const a = inTry ? 1 : S.reveal('heads-real', 0.3 + i * 0.4, 0.5), r = L.thumbs[i], on = i === sel && inTry;
      miniMap(S, r, h.M, { a, sel: on || (!inTry && i === sel) });
      if (inTry && !st.touched && !S.reduced && i !== sel) { const pu = 0.5 + 0.5 * Math.sin(S.clock * 3.2); d.rect(r.x - 4 * u, r.y - 4 * u, r.w + 8 * u, r.h + 8 * u, { stroke: sig.c, lw: 2, r: 3, a: 0.25 + 0.5 * pu, dash: [5, 4] }); }
      d.withAlpha(a, () => {
        const lx = r.x + r.w / 2, sm = L.lab > 30 * u;
        d.text(LETTERS[i], lx, r.y + r.h + 3 * u, { size: fs(S, 14), weight: 800, color: i === sel ? sig.ink : p.ink2, align: 'center', base: 'top' });
        if (sm) {
          d.text(S.l(`capa ${h.layer}`, `layer ${h.layer}`), lx, r.y + r.h + 20 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top' });
          d.text(S.l(`cabeza ${h.head}`, `head ${h.head}`), lx, r.y + r.h + 34 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top' });
        }
      });
    });
    // lectura de la palabra elegida en la cabeza elegida
    const sorted = M[word].map((w, j) => ({ w, j })).sort((a, b) => b.w - a.w), row = sorted.filter((q, i) => i === 0 || q.w >= 0.02).slice(0, 3);
    const pn = L.panel, h = hs[sel];
    d.withAlpha(S.reveal('heads-real', 1.6, 0.6) * (inTry ? 1 : 1), () => {
      if (S.portrait) {
        const txt = S.l(`«${words[word]}» mira a: `, `“${words[word]}” looks at: `) + row.slice(0, 2).map((q) => `${words[q.j]} ${pct(S, q.w)} %`).join(' · ');
        textBlock(S, txt, pn.x, pn.y + pn.h / 2, pn.w, { size: fs(S, 13), weight: 700, color: p.ink, lh: 1.15 });
      } else {
        d.text(S.l(`«${words[word]}» mira a:`, `“${words[word]}” looks at:`), pn.x, pn.y, { size: fs(S, 14), weight: 800, color: p.ink, base: 'top' });
        const bh = 20 * u, lw = Math.max(...row.map((q) => d.measure(words[q.j], { size: fs(S, 13), weight: 700 }))) + 8 * u, bw = pn.w - lw - 46 * u;
        row.forEach((q, i) => {
          const y = pn.y + 26 * u + i * (bh + 6 * u);
          d.text(words[q.j], pn.x + lw - 6 * u, y + bh / 2, { size: fs(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
          d.rect(pn.x + lw, y, bw, bh, { fill: p.surface2 });
          d.rect(pn.x + lw, y, Math.max(1.5, bw * q.w), bh, { fill: sig.c });
          d.text(pct(S, q.w) + ' %', pn.x + pn.w, y + bh / 2, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
        });
        const ny = pn.y + 26 * u + 3 * (bh + 6 * u) + 6 * u;
        textBlock(S, `${LETTERS[sel]} · ${nameOf(S, h)}: ${headNote(S, h)}`, pn.x, ny + 18 * u, pn.w, { size: fs(S, 12), weight: 600, color: p.ink2, lh: 1.2 });
        textBlock(S, S.l(`Modelo: ${R.model}. Marcas: [CLS] y [SEP] los añade el modelo.`, `Model: ${R.model}. [CLS] and [SEP] are added by the model.`), pn.x, pn.y + pn.h - 16 * u, pn.w, { size: fs(S, 12), weight: 600, color: p.mute, lh: 1.15 });
      }
    });
  });
}

// ───────────────────────────── real-flip: el cambio de final con números reales ─────────────────────────────
export function drawFlip(S: Frame) {
  const A = actAlpha(S, 'real-flip', 'real-few'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), R = REAL[S.lang], sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const heavy = R.words.heavy.slice(1, -1), tired = R.words.tired.slice(1, -1), q = R.query - 1, ia = R.a - 1, ib = R.b - 1;
  const m = S.at('real-flip', 3.4, 4.8), second = m > 0.5, words = second ? tired : heavy;
  const wH = R.flip.heavy.slice(1, -1), wT = R.flip.tired.slice(1, -1), wt = wH.map((v, i) => lerp(v, wT[i], m));
  const gap = 6 * u, h = 30 * u, size = chipSize(S, all.w, gap);
  const probe = layoutChips(S, heavy, 0, 0, all.w, size, h, gap, 26 * u);
  const rowGap = probe.lines > 1 ? 30 * u : 8 * u, head = (probe.lines > 1 ? 70 : 90) * u;
  const L = layoutChips(S, words, 0, 0, all.w, size, h, gap, rowGap);
  const cardH = 84 * u, cardsY = all.y + all.h - (S.portrait ? 2 * cardH + 8 * u : cardH);
  const x0 = all.x + (all.w - L.width) / 2, y0 = all.y + 22 * u + head + Math.max(0, (cardsY - all.y - 22 * u - head - L.height - 30 * u) / 2);
  const rects = L.rects.map((r) => ({ ...r, x: r.x + x0, y: r.y + y0 }));
  d.withAlpha(A, () => {
    d.text(`${R.model} · ${S.l(`capa ${R.flip.layer} · cabeza ${R.flip.head}`, `layer ${R.flip.layer} · head ${R.flip.head}`)} · ${S.l('la cabeza elegida', 'the chosen head')}`, all.x, all.y + 2 * u, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: all.w });
    const a1 = S.reveal('real-flip', 0.1, 0.6);
    rects.forEach((r, i) => chip(S, r, words[i], { size, a: a1, fill: i === q ? 0 : wt[i] * 1.25, ring: i === q }));
    const it = rects[q];
    wt.forEach((w, i) => {
      if (i === q || w < 0.03) return;
      const a = S.at('real-flip', 0.5 + i * 0.05, 1.6, 'out');
      arcBetween(S, it, rects[i], { tone: 'sig', lw: 1.4 + 11 * w, a: 0.9 * a, lift: Math.min(70 * u, 14 * u + Math.abs(it.x - rects[i].x) * 0.16), head: w > 0.06 });
    });
    d.withAlpha(S.reveal('real-flip', 1.6, 0.5), () => rects.forEach((r, i) => {
      const w = wt[i]; if (i === q || w < 0.05) return;
      const first = L.lines > 1 && r.y < it.y - 1;
      d.text(pct(S, w) + ' %', r.x + r.w / 2, first ? r.y - 11 * u : r.y + r.h + 11 * u, { size: fs(S, 12), weight: 800, font: 'mono', color: sig.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
    }));
    // los dos finales, lado a lado
    const cw = S.portrait ? all.w : (all.w - 12 * u) / 2;
    [[heavy[heavy.length - 2], R.flip.heavy, 0], [tired[tired.length - 2], R.flip.tired, 1]].forEach(([w2, row, i]) => {
      const r: Rect = S.portrait ? { x: all.x, y: cardsY + (i as number) * (cardH + 8 * u), w: cw, h: cardH } : { x: all.x + (i as number) * (cw + 12 * u), y: cardsY, w: cw, h: cardH };
      const on = (i === 0) !== second, a = i === 0 ? S.reveal('real-flip', 1.8, 0.5) : S.at('real-flip', 4.0, 4.8);
      d.withAlpha(a, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: on ? sig.c : p.line, lw: on ? 2.5 : 1.25, r: 3 });
        d.text(S.l(`con «${w2}»`, `with “${w2}”`), r.x + 10 * u, r.y + 8 * u, { size: fs(S, 13), weight: 800, color: on ? sig.ink : p.ink2, base: 'top' });
        [[R.a, S.l('paquete', 'package')], [R.b, 'robot']].forEach(([ix, nm], k) => {
          const v = (row as number[])[ix as number], y = r.y + 34 * u + k * 22 * u, lw = 62 * u, bw = r.w - lw - 62 * u;
          d.text(nm as string, r.x + 10 * u, y + 8 * u, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'middle' });
          d.rect(r.x + 10 * u + lw, y, bw, 16 * u, { fill: p.surface2 });
          d.rect(r.x + 10 * u + lw, y, Math.max(1.5, bw * v), 16 * u, { fill: sig.c });
          d.text(pct(S, v) + ' %', r.x + r.w - 10 * u, y + 8 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
        });
      });
    });
    void ia; void ib;
  });
}

// ───────────────────────────── real-few: las 144 cabezas ─────────────────────────────
/** Mosaico de las 144 cabezas (12 capas × 12 cabezas): intensidad = fracción de la atención de «este» que cae en marcas. */
export function mosaic(S: Frame, r: Rect, sp: number[][], o: { a?: number; marks?: boolean; ringRef?: boolean; faint?: boolean }) {
  const { d, pal: p } = S, u = S.u, n = 12, lab = 38 * u, side = Math.min(r.w - 24 * u, r.h - lab), cs = side / n, gx = r.x + 24 * u + (r.w - 24 * u - side) / 2, gy = r.y + lab;
  const hs = headsOf(S), sig = tone(S, 'sig');
  d.withAlpha(o.a ?? 1, () => {
    for (let l = 0; l < n; l++) for (let h = 0; h < n; h++) d.rect(gx + h * cs, gy + l * cs, cs - 1, cs - 1, { fill: alpha(p.ink, (o.faint ? 0.05 : 0.06) + (o.faint ? 0.3 : 0.78) * sp[l][h]) });
    if (cs >= 18 * u) for (let i = 0; i < n; i++) { const t = String(i + 1); d.text(t, gx + i * cs + cs / 2, gy - 9 * u, { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'middle' }); d.text(t, gx - 5 * u, gy + i * cs + cs / 2, { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
    else [1, 6, 12].forEach((i) => { d.text(String(i), gx + (i - 0.5) * cs, gy - 10 * u, { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'middle' }); d.text(String(i), gx - 5 * u, gy + (i - 0.5) * cs, { size: fs(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('cabeza →', 'head →'), gx + side, r.y + 2 * u, { size: fs(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top' });
    d.text(S.l('capa ↓', 'layer ↓'), r.x, r.y + 2 * u, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
    if (o.marks) hs.forEach((h, i) => {
      const x = gx + (h.head - 1) * cs, y = gy + (h.layer - 1) * cs, ref = h.kind === 'ref';
      d.rect(x - 1, y - 1, cs + 1, cs + 1, { stroke: ref ? sig.c : p.ink, lw: ref ? 3 : 1.5 });
      if (cs >= 16 * u) d.text(LETTERS[i], x + cs / 2, y + cs / 2, { size: fs(S, 12), weight: 800, color: p.surface, align: 'center', base: 'middle', halo: ref ? sig.c : p.ink, haloW: 4 });
    });
  });
  return { gx, gy, cs, side };
}

export function drawFew(S: Frame) {
  const A = actAlpha(S, 'real-few', 'explain'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), R = REAL[S.lang], err = tone(S, 'err'), sig = tone(S, 'sig');
  const mr: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.5 } : { x: all.x, y: all.y, w: Math.min(all.h + 22 * u, all.w * 0.5), h: all.h };
  const pr: Rect = S.portrait ? { x: all.x, y: mr.y + mr.h + 10 * u, w: all.w, h: all.h - mr.h - 10 * u } : { x: mr.x + mr.w + 24 * u, y: all.y, w: all.w - mr.w - 24 * u, h: all.h };
  d.withAlpha(A, () => {
    mosaic(S, mr, R.grid.sp, { a: S.reveal('real-few', 0.1, 0.7), marks: S.on('real-few') && S.at('real-few', 1.2, 1.9) > 0.5 });
    const bs = fs(S, S.portrait ? 22 : 32), ls = fs(S, 13);
    const stat = (y: number, big: string, label: string, t: Tone, a: number) => d.withAlpha(a, () => {
      const tc = tone(S, t);
      d.text(big, pr.x, y, { size: bs, weight: 800, font: 'mono', color: tc.ink, base: 'top' });
      const bw = d.measure(big, { size: bs, weight: 800, font: 'mono' });
      textTop(S, label, pr.x + bw + 10 * u, y + 1 * u, pr.w - bw - 10 * u, { size: ls, weight: 600, color: p.ink2, lh: 1.2 });
    });
    // la altura de cada leyenda depende del ancho (teléfono horizontal: varias líneas): la segunda cifra baja lo necesario
    const heightOf = (big: string, label: string) => {
      const bw = d.measure(big, { size: bs, weight: 800, font: 'mono' });
      return Math.max(bs * u * 1.1, d.wrap(label, pr.w - bw - 10 * u, { size: ls, weight: 600 }).length * 1.2 * ls * u);
    };
    const l1 = S.l('cabezas con el mayor peso de «este» en una marca: [CLS], [SEP] o el punto', 'heads with the biggest weight of “it” on a mark: [CLS], [SEP], or the period');
    const l2 = S.l('cabezas que giran como la elegida: más de 0,3 con «pesado» en el paquete y con «cansado» en el robot', 'heads that swing like the chosen one: over 0.3 on the package with “heavy” and on the robot with “tired”');
    const b1 = `${R.grid.nSpecialTop} / 144`, b2 = `${R.flip.nFlip} / 144`;
    const step = Math.max(S.portrait ? 64 * u : 96 * u, heightOf(b1, l1) + 14 * u);
    stat(pr.y + (S.portrait ? 2 : 8) * u, b1, l1, 'err', S.reveal('real-few', 2.4, 0.6));
    stat(pr.y + (S.portrait ? 2 : 8) * u + step, b2, l2, 'sig', S.reveal('real-few', 4.2, 0.6));
    d.withAlpha(S.reveal('real-few', 1.4, 0.6), () => textBlock(S, S.l('intensidad: parte de la atención de «este» que cae en marcas · recuadro C: la elegida', 'intensity: share of the attention of “it” that lands on marks · box C: the chosen one'), pr.x, pr.y + pr.h - 18 * u, pr.w, { size: fs(S, 12), weight: 600, color: p.mute, lh: 1.15 }));
    void err; void sig;
  });
}

void badge; void title;
