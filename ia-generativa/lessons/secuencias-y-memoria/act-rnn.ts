// Primer acto: la frase, las secuencias y la RNN desenrollada (columnas en horizontal, filas en teléfono).
import { alpha, clamp, hash, inset, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { sentenceRun, T, KEY, G_DEFAULT } from './model';
import { NCOL, NSLOT, arrow, elbow, fit, fz, lane, mid, num, panel, panelTitle, pct, rich, stateBars, tok, win, type Lane, type Part, uu } from './ui';

export const WORDS = {
  es: ['Las', 'flores', 'que', 'compré', 'en', 'el', 'mercado', 'están', 'marchitas'],
  en: ['The', 'flowers', 'I', 'bought', 'at', 'the', 'market', 'are', 'wilted'],
};
export const words = (S: Frame) => WORDS[S.lang];
const q = (S: Frame, s: string) => (S.lang === 'es' ? `«${s}»` : `“${s}”`);
export const quoted = q;
const sub = (n: number) => String.fromCharCode(0x2080 + n);

// ═════════════════════════════════════════════════════════════════════════
// Vista 1 · la frase (gancho)
// ═════════════════════════════════════════════════════════════════════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, u = uu(S), W = words(S), all = inset(S.full(), 16 * u);
  const size = fz(S, 19), h = 40 * u, gap = 9 * u, pad = 11 * u;
  const widths = W.map((w) => d.measure(w, { size, weight: 600 }) + 2 * pad);
  // reparto en líneas
  const lines: number[][] = [[]]; let acc = 0;
  widths.forEach((w, i) => { if (acc + w > all.w && lines[lines.length - 1].length) { lines.push([]); acc = 0; } lines[lines.length - 1].push(i); acc += w + gap; });
  const lh = h + 14 * u, y0 = S.H * (lines.length === 1 ? 0.4 : 0.26);
  const pos: Rect[] = [];
  lines.forEach((ln, li) => {
    const tw = ln.reduce((s, i) => s + widths[i], 0) + gap * (ln.length - 1);
    let x = all.x + (all.w - tw) / 2;
    ln.forEach((i) => { pos[i] = { x, y: y0 + li * lh - h / 2, w: widths[i], h }; x += widths[i] + gap; });
  });
  const aTok = (i: number) => S.reveal('hook', 0.15 + i * 0.16, 0.45);
  W.forEach((w, i) => {
    const r = pos[i], key = i === KEY - 1 || i === 7, on = key ? S.reveal('hook', 1.9, 0.6) : 0;
    d.withAlpha(aTok(i), () => {
      const t = tone(S, key && on > 0 ? 'sig' : 'lat');
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.14 + 0.4 * on), stroke: t.c, lw: 1.5 + on, r: 3 });
      d.text(w, r.x + r.w / 2, r.y + r.h / 2, { size, weight: 600, color: on > 0.6 ? p.stage : t.ink, align: 'center', base: 'middle' });
    });
  });
  // concordancia: el verbo con el sujeto lejano
  const a = S.reveal('hook', 2.2, 0.7);
  if (a > 0) {
    const rf = pos[KEY - 1], rv = pos[7], sig = tone(S, 'sig');
    if (lines.length === 1) {
      const yb = rf.y + rf.h + 14 * u, cx1 = rf.x + rf.w / 2, cx2 = rv.x + rv.w / 2;
      d.withAlpha(a, () => {
        d.polyline([[cx1, rf.y + rf.h + 2], [cx1, yb], [cx2, yb], [cx2, rv.y + rv.h + 2]], sig.c, 2, { dash: [6, 4] });
        S.d.tag(S.l('mismo número: plural', 'same number: plural'), (cx1 + cx2) / 2, yb + 18 * u, { color: sig.ink, fill: sig.soft, stroke: sig.c, size: fz(S, 13) });
      });
    } else {
      const ly = pos[8].y + h + 30 * u;
      d.withAlpha(a, () => S.d.tag(`${q(S, W[1])} = ${q(S, W[7])}: ${S.l('plural', 'plural')}`, S.W / 2, ly, { color: sig.ink, fill: sig.soft, stroke: sig.c, size: fz(S, 13) }));
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Vista 2 · secuencias (orden, texto, audio, sensor)
// ═════════════════════════════════════════════════════════════════════════
export function drawSequences(S: Frame) {
  const { d, pal: p } = S, u = uu(S), all = inset(S.full(), 14 * u), cols = S.W >= 860 ? 3 : 1, g = 12 * u;
  const ch = cols === 3 ? Math.min(all.h * 0.66, 250 * u) : (all.h - 2 * g) / 3, cwid = cols === 3 ? (all.w - 2 * g) / 3 : all.w;
  const y0 = cols === 3 ? all.y + (all.h - ch) / 2 : all.y;
  const e = S.at('uses', 0, 0.9, 'io');
  const card = (i: number): Rect => (cols === 3
    ? { x: i === 0 ? lerp(all.x + (all.w - cwid) / 2, all.x, e) : all.x + i * (cwid + g), y: y0, w: cwid, h: ch }
    : { x: all.x, y: y0 + i * (ch + g), w: cwid, h: ch });
  const aText = S.reveal('order', 0, 0.6), aOther = [S.reveal('uses', 0.2, 0.6), S.reveal('uses', 0.7, 0.6)];

  // tarjeta 1: texto, con el cambio de orden
  {
    const r = card(0), inn = panel(S, r, aText), lat = tone(S, 'lat'), err = tone(S, 'err');
    const ty = panelTitle(S, inn, S.l('Texto: el orden cambia el sentido', 'Text: order changes the meaning'), 'lat', aText);
    const rows = S.lang === 'es' ? [['El', 'perro', 'mordió', 'al', 'niño'], ['El', 'niño', 'mordió', 'al', 'perro']] : [['The', 'dog', 'bit', 'the', 'boy'], ['The', 'boy', 'bit', 'the', 'dog']];
    const swap = S.at('order', 0.9, 2.0), size0 = fz(S, 14), pad0 = 7 * u, gp0 = 5 * u;
    const w0 = rows[0].map((w) => d.measure(w, { size: size0, weight: 600 }) + 2 * pad0), tot0 = w0.reduce((s, x) => s + x, 0) + gp0 * 4;
    const sc = Math.min(1.25, inn.w / tot0), size = size0 * sc, rowW = w0.map((x) => x * sc), gp = gp0 * sc, totalW = tot0 * sc;
    const free = inn.y + inn.h - ty, rh = Math.min(36 * u * sc, free / 2.6);
    const xs: number[] = []; let acc = inn.x + Math.max(0, (inn.w - totalW) / 2);
    rowW.forEach((w) => { xs.push(acc); acc += w + gp; });
    const ys = [ty + free * 0.3, ty + free * 0.3 + rh * 1.5];
    d.withAlpha(aText, () => {
      rows.forEach((row, ri) => row.forEach((w, i) => {
        const hot = (i === 1 || i === 4) && swap > 0, t = hot ? err : lat;
        d.rect(xs[i], ys[ri] - rh * 0.42, rowW[i], rh * 0.84, { fill: alpha(t.c, hot ? 0.28 : 0.14), stroke: t.c, lw: 1.5, r: 3 });
        d.text(w, xs[i] + rowW[i] / 2, ys[ri], { size, weight: 600, color: t.ink, align: 'center', base: 'middle' });
      }));
      if (swap > 0) {
        const c1 = xs[1] + rowW[1] / 2, c4 = xs[4] + rowW[4] / 2, ya = ys[0] + rh * 0.42 + 1, yb = ys[1] - rh * 0.42 - 1;
        d.withAlpha(swap, () => { d.line(c1, ya, c4, yb, err.c, 1.8); d.line(c4, ya, c1, yb, err.c, 1.8); });
      }
    });
  }
  // tarjeta 2: audio
  {
    const r = card(1), a = aOther[0], inn = panel(S, r, a);
    const ty = panelTitle(S, inn, S.l('Audio: muestras en el tiempo', 'Audio: samples over time'), 'sig', a);
    const plot: Rect = { x: inn.x, y: ty + 4 * u, w: inn.w, h: inn.y + inn.h - ty - 4 * u }, n = 90, cy = plot.y + plot.h / 2, sg = tone(S, 'sig');
    const reveal = S.at('uses', 0.3, 2.3, 'lin');
    d.withAlpha(a, () => {
      d.line(plot.x, cy, plot.x + plot.w, cy, p.line, 1);
      const pts: [number, number][] = [];
      for (let i = 0; i <= n * reveal; i++) {
        const t = i / n, env = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.7, v = (Math.sin(t * 55) * 0.6 + Math.sin(t * 23 + 1) * 0.35 + (hash(i, 3) - 0.5) * 0.25) * env;
        pts.push([plot.x + plot.w * t, cy - v * plot.h * 0.42]);
      }
      d.polyline(pts, sg.c, 1.8);
    });
  }
  // tarjeta 3: sensor
  {
    const r = card(2), a = aOther[1], inn = panel(S, r, a);
    const ty = panelTitle(S, inn, S.l('Sensor: lecturas en el tiempo', 'Sensor: readings over time'), 'dat', a);
    const plot: Rect = { x: inn.x, y: ty + 6 * u, w: inn.w, h: inn.y + inn.h - ty - 6 * u }, n = 26, dt = tone(S, 'dat');
    const reveal = S.at('uses', 0.8, 2.8, 'lin');
    d.withAlpha(a, () => {
      d.line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, p.line, 1);
      const pts: [number, number][] = [];
      for (let i = 0; i < n * reveal; i++) pts.push([plot.x + (plot.w * (i + 0.5)) / n, plot.y + plot.h * (0.5 - 0.28 * Math.sin(i / 4.1) - (hash(i, 9) - 0.5) * 0.22)]);
      d.polyline(pts, dt.c, 2);
      pts.forEach(([x, y]) => d.circle(x, y, 2.6 * u, { fill: dt.c }));
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Vista 3 · la RNN desenrollada sobre la frase
// ═════════════════════════════════════════════════════════════════════════
export interface RnnView {
  a: number;
  tokA: number[];            // 8
  qMark: boolean;
  cellA: number[];           // 7
  feedA: number[];           // 7  (palabra → celda y celda → estado)
  linkA: number[];           // 7  (celda i−1 → celda i)
  stA: number[];             // 7
  hot: number;               // celda resaltada (receta) o −1
  inf: (number | null)[];    // 7: valores 0..1
  infA: number;
  infLabelA: number;
  strong: number;            // columna cuya cifra se destaca (−1: ninguna)
  hl: { col: number; a: number }[];
  pulse: number;             // posición (columna, decimal) del empujón; < 0: sin empujón
  pulseA: number;
  predictA: number;
  layersA: number;
  blame: number;             // progreso 0..1 de la culpa que retrocede (6 → 0); < 0: sin culpa
  g: number;
}

export function drawRnnLane(S: Frame, L: Lane, v: RnnView) {
  const { d, pal: p } = S, u = uu(S), W = words(S), vert = L.vertical, run = sentenceRun(v.g);
  const err = tone(S, 'err'), wt = tone(S, 'w'), dat = tone(S, 'dat'), lat = tone(S, 'lat'), ink = p.ink2;
  d.withAlpha(v.a, () => {
    // columnas destacadas
    for (const h of v.hl) if (h.a > 0) {
      const t = L.tok(h.col), s = L.inf(h.col), x = Math.min(t.x, L.cell(h.col).x, s.x) - 3 * u, y = t.y - 4 * u;
      const r = vert ? { x: L.area.x - 3 * u, y: t.y - 3 * u, w: L.area.w + 6 * u, h: s.y + s.h - t.y + 6 * u } : { x, y, w: Math.max(t.w, s.w) + 6 * u, h: s.y + s.h - t.y + 8 * u };
      d.withAlpha(h.a, () => d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tone(S, 'sig').c, 0.07), stroke: tone(S, 'sig').c, lw: 1.5, r: 4, dash: [5, 4] }));
    }
    // palabras
    for (let i = 0; i < NSLOT; i++) {
      const a = v.tokA[i]; if (a <= 0) continue;
      const r = L.tok(i), [cx, cy] = mid(r), text = i === 7 ? (v.qMark ? '?' : W[7]) : W[i];
      tok(S, text, cx, cy, { maxW: r.w, h: r.h / u, a, dashed: i === 7 && v.qMark, active: 0 });
    }
    // celdas y flechas
    const lw = (hot: boolean) => (hot ? 3.2 : 1.8);
    for (let i = 0; i < NCOL; i++) {
      const hot = v.hot === i, t = L.tok(i), c = L.cell(i), s = L.st(i), fa = v.feedA[i], ca = v.cellA[i];
      if (ca > 0) {
        d.withAlpha(ca, () => {
          d.rect(c.x, c.y, c.w, c.h, { fill: alpha(wt.c, 0.1 + 0.34 * (hot ? 1 : 0)), stroke: wt.c, lw: hot ? 2.5 : 1.5, r: 3 });
          const lab = v.layersA > 0 ? S.l(`capa ${i + 1}`, `layer ${i + 1}`) : 'RNN';
          fit(S, lab, c.x + c.w / 2, c.y + c.h / 2, c.w - 4 * u, { size: 12.5, weight: 700, color: wt.ink, align: 'center' });
        });
      }
      const oa = v.stA[i];
      if (fa > 0) {
        if (!vert) arrow(S, t.x + t.w / 2, t.y + t.h + 2, c.x + c.w / 2, c.y - 1, hot ? lat.c : ink, { a: fa * (hot ? 1 : 0.7), lw: lw(hot), head: 6 });
        else arrow(S, t.x + t.w + 2, t.y + t.h / 2, c.x - 1, c.y + c.h / 2, hot ? lat.c : ink, { a: fa * (hot ? 1 : 0.7), lw: lw(hot), head: 6 });
      }
      if (oa > 0) {
        if (!vert) arrow(S, c.x + c.w / 2, c.y + c.h + 1, s.x + s.w / 2, s.y - 3 * u, hot ? dat.c : ink, { a: oa * (hot ? 1 : 0.7), lw: lw(hot), head: 6 });
        else arrow(S, c.x + c.w + 1, c.y + c.h / 2, s.x - 3 * u, c.y + c.h / 2, hot ? dat.c : ink, { a: oa * (hot ? 1 : 0.7), lw: lw(hot), head: 6 });
      }
      if (i > 0 && v.linkA[i] > 0) {
        const pc = L.cell(i - 1), hh = v.hot === i;
        if (!vert) arrow(S, pc.x + pc.w + 1, pc.y + pc.h / 2, c.x - 1, c.y + c.h / 2, hh ? dat.c : ink, { a: v.linkA[i] * (hh ? 1 : 0.7), lw: lw(hh), head: 6, p: 1 });
        else arrow(S, pc.x + pc.w / 2, pc.y + pc.h + 1, c.x + c.w / 2, c.y - 1, hh ? dat.c : ink, { a: v.linkA[i] * (hh ? 1 : 0.7), lw: lw(hh), head: 6 });
      }
      // estado
      if (v.stA[i] > 0) {
        stateBars(S, s, run.states[i + 1], { a: v.stA[i], hot: hot });
        const lx = vert ? s.x - 14 * u : s.x + s.w / 2, ly = vert ? s.y + s.h / 2 - 10 * u : s.y + s.h + 9 * u;
        d.text(`h${sub(i + 1)}`, lx, ly, { size: fz(S, 12), weight: 600, font: 'mono', color: dat.ink, align: 'center', base: 'middle', a: v.stA[i] });
      }
    }
    // el estado final alimenta la predicción
    if (v.predictA > 0) {
      const c6 = L.cell(NCOL - 1), t7 = L.tok(7), a = v.predictA, sg = tone(S, 'sig');
      if (!vert) {
        const x7 = t7.x + t7.w / 2;
        elbow(S, [[c6.x + c6.w + 2, c6.y + c6.h / 2], [x7, c6.y + c6.h / 2], [x7, t7.y + t7.h + 3]], sg.c, { a, lw: 2.4 });
        d.withAlpha(a, () => d.tag(S.l('predice', 'predicts'), x7, c6.y + c6.h / 2 + 20 * u, { color: sg.ink, fill: sg.soft, stroke: sg.c, size: fz(S, 12.5) }));
      } else {
        const cx = c6.x + c6.w / 2;
        elbow(S, [[cx, c6.y + c6.h + 2], [cx, t7.y + t7.h / 2], [t7.x + t7.w + 3, t7.y + t7.h / 2]], sg.c, { a, lw: 2.4 });
        d.withAlpha(a, () => d.tag(S.l('predice', 'predicts'), cx + 38 * u, t7.y + t7.h / 2, { color: sg.ink, fill: sg.soft, stroke: sg.c, size: fz(S, 12.5), align: 'left' }));
      }
    }
    if (v.infA > 0) drawInf(S, L, v.inf, v.infA, v.strong);
    // empujón que viaja hacia delante
    if (v.pulse >= 0 && v.pulseA > 0) {
      const k = clamp(v.pulse, 0, NCOL - 1), i0 = Math.floor(k), i1 = Math.min(NCOL - 1, i0 + 1), f = k - i0;
      const A = mid(L.st(i0)), B = mid(L.st(i1)), x = lerp(A[0], B[0], f), y = lerp(A[1], B[1], f);
      const amp = run.amp[KEY][Math.min(T, Math.round(k) + 1)] ?? 0.05;
      d.withAlpha(v.pulseA, () => {
        d.circle(x, y, (4 + 7 * Math.sqrt(clamp(amp))) * u, { fill: alpha(err.c, 0.25), stroke: err.c, lw: 2 });
        d.circle(x, y, 2.4 * u, { fill: err.c });
      });
    }
    // culpa que retrocede
    if (v.blame >= 0) {
      const k = (NCOL - 1) * (1 - clamp(v.blame)), infl = (i: number) => run.infl[i + 1];
      for (let j = NCOL - 1; j > Math.ceil(k); j--) {
        const A = mid(L.cell(j)), B = mid(L.cell(j - 1)), val = infl(j - 1);
        d.polyline([[A[0], A[1]], [B[0], B[1]]], err.c, Math.max(1.6, 7 * Math.sqrt(clamp(val)) * u), { a: 0.55 });
      }
      const i0 = Math.floor(k), i1 = Math.min(NCOL - 1, i0 + 1), f = k - i0;
      const val = lerp(infl(i0), infl(i1), f), A = mid(L.cell(i0)), B = mid(L.cell(i1)), x = lerp(A[0], B[0], f), y = lerp(A[1], B[1], f);
      if (f > 0.001) d.polyline([[B[0], B[1]], [x, y]], err.c, Math.max(1.6, 7 * Math.sqrt(clamp(infl(i1))) * u), { a: 0.55 });
      d.circle(x, y, (3 + 8 * Math.sqrt(clamp(val))) * u, { fill: alpha(err.c, 0.3), stroke: err.c, lw: 2 });
      d.circle(x, y, 2.2 * u, { fill: err.c });
    }
  });
  void num;
}


/** Zona de influencia/culpa: una barra por paso (vertical en columnas, horizontal en filas) con su porcentaje. */
export function drawInf(S: Frame, L: Lane, vals: (number | null)[], a: number, strong: number, tn: 'err' | 'dat' = 'err') {
  const { d, pal: p } = S, u = uu(S), vert = L.vertical, t = tone(S, tn);
  d.withAlpha(a, () => {
    for (let i = 0; i < NCOL; i++) {
      const val = vals[i]; if (val === null || val === undefined) continue;
      const r = L.inf(i), st = strong === i, lab = pct(S, val);
      if (!vert) {
        const lh = 17 * u, base = r.y + r.h - lh, hmax = r.h - lh - 3 * u, bw = Math.min(26 * u, r.w * 0.5), cx = r.x + r.w / 2;
        d.rect(cx - bw / 2, base - hmax, bw, hmax, { fill: alpha(t.c, 0.06), stroke: p.line, lw: 1 });
        const bh = Math.max(1.5, hmax * clamp(val));
        d.rect(cx - bw / 2, base - bh, bw, bh, { fill: st ? t.c : alpha(t.c, 0.72) });
        d.line(cx - bw / 2 - 3 * u, base, cx + bw / 2 + 3 * u, base, p.lineStrong, 1.2);
        fit(S, lab, cx, r.y + r.h - lh / 2, r.w - 2 * u, { size: st ? 13.5 : 12.5, weight: st ? 800 : 600, color: t.ink, align: 'center', font: 'mono' });
      } else {
        const lw2 = 46 * u, track = r.w - lw2, bh = Math.min(r.h * 0.5, 14 * u), cy = r.y + r.h / 2;
        d.rect(r.x, cy - bh / 2, track, bh, { fill: alpha(t.c, 0.06), stroke: p.line, lw: 1 });
        const bw2 = Math.max(1.5, track * clamp(val));
        d.rect(r.x, cy - bh / 2, bw2, bh, { fill: st ? t.c : alpha(t.c, 0.72) });
        fit(S, lab, r.x + track + 5 * u, cy, lw2 - 4 * u, { size: st ? 13.5 : 12.5, weight: st ? 800 : 600, color: t.ink, font: 'mono' });
      }
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Banda inferior: la explicación que acompaña a la línea de pasos
// ═════════════════════════════════════════════════════════════════════════
const sym = (S: Frame, s: string): Part => [s, 'ink2'];
export function bandRnn(S: Frame, L: Lane, id: string, a: number, extra: { guess?: string; g: number }) {
  if (a <= 0) return;
  const { d } = S, u = uu(S), run = sentenceRun(extra.g), W = words(S);
  const inn = panel(S, L.band, a, null);
  const cx = inn.x + inn.w / 2, mw = inn.w;
  const A = (k: string, delay = 0.2) => a * S.reveal(k, delay, 0.5);
  const line = (y: number, parts: Part[], aa: number, o: { size?: number; align?: 'left' | 'center' | 'right'; font?: 'mono' | 'ui' } = {}) => rich(S, o.align === 'center' ? cx : inn.x, y, parts, { size: o.size ?? 13, maxW: mw, a: aa, align: o.align, font: o.font });
  const lhh = fz(S, 13) * u * 1.55;
  const toy = S.l('pesos al azar', 'random weights');   // la RNN de la lección es de juguete: pesos al azar, sin entrenar
  switch (id) {
    case 'state': {
      const y = panelTitle(S, inn, S.l('Estado oculto h₃ tras «que»', 'Hidden state h₃ after “I”').replace('«que»', q(S, W[2])), 'dat', A('state', 0.3), toy);
      const vals = run.states[3];
      line(y + lhh * 0.7, vals.flatMap((v, i): Part[] => [[num(S, v, 2, true), v >= 0 ? 'dat' : 'ink2', true], [i < 5 ? '  ' : '', 'ink2']]), A('state', 0.6), { font: 'mono', size: 13 });
      break;
    }
    case 'recipe': {
      const y = panelTitle(S, inn, S.l('La regla de cada paso', 'The rule at every step'), 'w', A('recipe', 0.2));
      line(y + lhh * 0.75, [['h_t', 'dat', true], [' = tanh( ', 'ink2'], ['Wx', 'w', true], [' · ', 'ink2'], ['x_t', 'lat', true], [' + ', 'ink2'], ['Wh', 'w', true], [' · ', 'ink2'], ['h_(t−1)', 'dat', true], [' )', 'ink2']], A('recipe', 0.5), { font: 'mono', size: 13.5 });
      line(y + lhh * 1.75, [[S.l('palabra', 'word'), 'lat', true], [' · ', 'ink2'], [S.l('estado anterior', 'previous state'), 'dat', true], [' · ', 'ink2'], [S.l('pesos', 'weights'), 'w', true]], A('recipe', 0.9), { size: 12.5 });
      break;
    }
    case 'loop': case 'unroll': {
      const showLoop = id === 'loop' || (id === 'unroll' && !S.portrait);
      drawLoopChain(S, inn, S.reveal(id, 0.1, 0.6) * a, id === 'unroll' ? S.reveal('unroll', 0.2, 1.4) : 0, showLoop);
      break;
    }
    case 'predict': {
      const y = panelTitle(S, inn, S.l('Un cambio en «flores»…', 'A change in “flowers”…').replace('«flores»', q(S, W[1])), 'err', A('predict', 0.3));
      const g = extra.guess;
      const txt = g === 'all' ? S.l('Casi todo', 'Almost all') : g === 'half' ? S.l('Cerca de la mitad', 'About half') : g === 'none' ? S.l('Casi nada', 'Almost nothing') : '';
      line(y + lhh * 0.7, txt ? [[S.l('Tu predicción: ', 'Your prediction: '), 'ink2'], [txt, 'err', true]] : [[S.l('¿cuánto llega todavía al estado final?', 'how much still reaches the final state?'), 'ink2']], A('predict', 0.6));
      break;
    }
    case 'wiggle': {
      const y = panelTitle(S, inn, S.l('Empujón en «flores»', 'Nudge at “flowers”').replace('«flores»', q(S, W[1])), 'err', A('wiggle', 0.2), toy);
      const arr = S.at('wiggle', 3.4, 4.2);
      line(y + lhh * 0.7, [[S.l('tamaño del cambio en cada celda', 'size of the change in each cell'), 'ink2']], A('wiggle', 0.5));
      line(y + lhh * 1.7, [[S.l('llega a la última: ', 'reaches the last one: '), 'ink2'], [pct(S, run.amp[KEY][T]), 'err', true]], a * arr);
      break;
    }
    case 'fade': {
      const f = run.amp[KEY];
      const parts: Part[] = [['1', 'ink2', true]];
      for (let t = KEY + 1; t <= T; t++) parts.push([' × ', 'ink2'], [num(S, f[t] / f[t - 1], 2), 'err', true]);
      parts.push([' = ', 'ink2'], [num(S, f[T], 2), 'err', true]);
      const y = panelTitle(S, inn, S.l('Cinco factores seguidos', 'Five factors in a row'), 'err', A('fade', 0.2), toy);
      line(y + lhh * 0.7, parts, A('fade', 0.5), { font: 'mono' });
      const g = extra.guess, ok = g === 'none', txt = g === 'all' ? S.l('Casi todo', 'Almost all') : g === 'half' ? S.l('Cerca de la mitad', 'About half') : S.l('Casi nada', 'Almost nothing');
      if (g && g !== 'x') line(y + lhh * 1.7, [[S.l('Tu predicción: ', 'Your prediction: '), 'ink2'], [txt, ok ? 'dat' : 'err', true], [ok ? S.l(' — acertaste.', ' — spot on.') : S.l(' — era casi nada.', ' — it was almost nothing.'), 'ink2']], A('fade', 1.2));
      break;
    }
    case 'strip': {
      const y = panelTitle(S, inn, S.l('Lo que llega al final desde cada palabra', 'What reaches the end from each word'), 'err', A('strip', 0.2));
      line(y + lhh * 0.7, [[q(S, W[6]), 'lat', true], [' ' + pct(S, run.infl[7]), 'err', true], [S.portrait ? '   ' : '      ', 'ink2'], [q(S, W[1]), 'lat', true], [' ' + pct(S, run.infl[2]), 'err', true]], A('strip', 0.6), { size: 13.5 });
      break;
    }
    case 'bptt': {
      const y = panelTitle(S, inn, S.l('Retropropagación a través del tiempo', 'Backpropagation through time'), 'err', A('bptt', 0.2));
      line(y + lhh * 0.7, [[S.l('siete palabras = una red de siete capas', 'seven words = a network seven layers deep'), 'ink2']], A('bptt', 0.5));
      line(y + lhh * 1.7, [[S.l('los mismos pesos en todas', 'the same weights in all of them'), 'w', true]], A('bptt', 0.9));
      break;
    }
    case 'vanish': {
      const y = panelTitle(S, inn, S.l('La culpa retrocede', 'The blame travels back'), 'err', A('vanish', 0.2), toy);
      line(y + lhh * 0.7, [[S.l('llega a ', 'it reaches '), 'ink2'], [q(S, W[1]), 'lat', true], [S.l(' con ', ' with '), 'ink2'], [pct(S, run.infl[2]), 'err', true], [S.l(' de su tamaño', ' of its size'), 'ink2']], A('vanish', 0.6));
      break;
    }
  }
}

/** Dibujo compacto del lazo (x_t → RNN → h_t, con la salida que vuelve a entrar) y de la cadena desenrollada (en la banda). */
function drawLoopChain(S: Frame, r: Rect, a: number, chain: number, showLoop: boolean) {
  const { d } = S, u = uu(S), wt = tone(S, 'w'), lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const bw = 56 * u, bh = Math.min(28 * u, r.h * 0.38), cy = r.y + r.h * 0.64;
  const cell = (x: number, y: number) => { d.rect(x - bw / 2, y - bh / 2, bw, bh, { fill: alpha(wt.c, 0.14), stroke: wt.c, lw: 1.8, r: 3 }); fit(S, 'RNN', x, y, bw - 4 * u, { size: 12.5, weight: 700, color: wt.ink, align: 'center' }); };
  d.withAlpha(a, () => {
    if (showLoop && chain < 0.5) {
      const cx = r.x + r.w / 2, la = 1 - chain * 2;
      d.withAlpha(la, () => {
        cell(cx, cy);
        const lx = cx - bw / 2 - 52 * u, rx = cx + bw / 2 + 52 * u;
        d.text('x_t', lx, cy, { size: fz(S, 13), font: 'mono', weight: 700, color: lat.ink, align: 'center', base: 'middle' });
        arrow(S, lx + 14 * u, cy, cx - bw / 2 - 1, cy, lat.c, { lw: 1.8, head: 6 });
        arrow(S, cx + bw / 2 + 1, cy, rx - 16 * u, cy, dat.c, { lw: 1.8, head: 6 });
        d.text('h_t', rx, cy, { size: fz(S, 13), font: 'mono', weight: 700, color: dat.ink, align: 'center', base: 'middle' });
        // lazo: la salida vuelve a entrar en la misma celda
        const xo = cx + bw / 2 + 22 * u, xi = cx + bw / 2 - 12 * u, yt = cy - bh / 2 - 13 * u;
        d.polyline([[xo, cy], [xo, yt], [xi, yt]], dat.c, 1.8);
        arrow(S, xi, yt, xi, cy - bh / 2 - 1, dat.c, { lw: 1.8, head: 6 });
      });
    }
    if (chain > 0) {
      const n = (4 * bw + 3 * 34 * u) <= r.w ? 4 : 3, gapx = Math.min(54 * u, (r.w - n * bw) / n), total = n * bw + (n - 1) * gapx, x0 = r.x + (r.w - total) / 2 + bw / 2;
      d.withAlpha(chain, () => {
        for (let i = 0; i < n; i++) {
          const cx = x0 + i * (bw + gapx);
          cell(cx, cy);
          if (i > 0) arrow(S, cx - bw - gapx + bw / 2 + 1, cy, cx - bw / 2 - 1, cy, dat.c, { lw: 1.8, head: 6 });
        }
        if (n === 4) d.text('…', x0 + 2.5 * (bw + gapx) - bw / 2 - gapx / 2 + bw / 2, cy - 2 * u, { size: fz(S, 18), weight: 700, color: S.pal.ink2, align: 'center', base: 'middle' });
        const y1 = cy - bh / 2 - 9 * u;
        d.line(x0 - bw / 2, y1, x0 + total - bw / 2, y1, wt.c, 1.5, [5, 4]);
        fit(S, S.l('los mismos pesos en cada paso', 'the same weights at every step'), x0 + total / 2 - bw / 2, y1 - 10 * u, total, { size: 12.5, weight: 700, color: wt.ink, align: 'center' });
      });
    }
  });
}

export const rnnG = G_DEFAULT;
