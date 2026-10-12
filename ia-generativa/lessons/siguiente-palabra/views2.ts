// Escribir (autorregresión) y elegir (voraz o sorteando). Arriba, el texto que se va escribiendo, con la caja de lo que
// mira el modelo (la última palabra) y el «contexto» subrayado; abajo, las barras de la fila de esa palabra y el bucle
// de cuatro pasos. Cada vuelta de la demostración es una vuelta real del modelo (demo.ts).
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { userSeed, runOf, type Demo } from './demo';
import { area, vshift, chipRow, drawWords, endOf, fitSize, franja, fr, fz, isShort, kk, label, layoutWords, loopDiagram, pct, probBars, q, textPanel, wl, wordBox, type BarRow, type WLayout } from './helpers';
import { choose, probs, rowsFor, type Prob } from './lm';
import { stOf } from './state';

// ═════════ geometría compartida: texto arriba, barras y bucle abajo ═════════
export function writeGeom(S: Frame, D: Demo) {
  const R = area(S), P = S.portrait, short = isShort(S), k = kk(S), u = S.u;
  const size = fz(S, P ? 18 : short ? 16 : 21);
  const longest = D.greedy.length > D.runWords.length ? D.greedy : D.runWords;
  const tw = R.w - 28 * u;
  const L = layoutWords(S, longest, tw, size, 650);
  const lines = Math.max(L.lines, layoutWords(S, D.runWords, tw, size, 650).lines);
  const sh = 24 * k + lines * L.lh + 20 * k;
  const strip: Rect = { x: R.x, y: R.y + 20 * k + vshift(S, R, 20 * k + sh + 36 * k + 4 * 42 * k), w: R.w, h: sh };
  const below = strip.y + strip.h + 30 * k;
  if (P) {
    const bh = Math.min(4 * 36 * k, (R.y + R.h - below) * 0.52);
    const bars: Rect = { x: R.x, y: below + 6 * k, w: R.w, h: bh };
    const loop: Rect = { x: R.x, y: bars.y + bh + 18 * k, w: R.w, h: R.y + R.h - (bars.y + bh + 18 * k) };
    return { R, P, k, size, tw, strip, bars, loop };
  }
  const bh = Math.min(4 * 42 * k, R.y + R.h - below - 8 * k);
  const bars: Rect = { x: R.x, y: below + 6 * k, w: R.w * 0.5, h: bh };
  const ly = strip.y + strip.h + 18 * k, lav = R.y + R.h - ly, lh = Math.min(lav, 210 * k);
  const loop: Rect = { x: R.x + R.w * 0.57, y: ly + (lav - lh) / 2, w: R.w * 0.43, h: lh };
  return { R, P, k, size, tw, strip, bars, loop };
}
type G = ReturnType<typeof writeGeom>;
export const textOrigin = (S: Frame, g: G): [number, number] => [g.strip.x + 14 * S.u, g.strip.y + 24 * g.k];

/** «contexto»: una llave bajo todo el texto escrito hasta ahora. */
function contextBrace(S: Frame, L: WLayout, n: number, ox: number, oy: number, a: number) {
  if (a < 0.01 || n <= 0) return;
  const { d } = S, lat = tone(S, 'lat'), u = S.u;
  const lastLine = L.pos[n - 1].line;
  for (let ln = 0; ln <= lastLine; ln++) {
    const ws = L.pos.slice(0, n).filter((p) => p.line === ln);
    if (!ws.length) continue;
    const x0 = ox + ws[0].x, x1 = ox + ws[ws.length - 1].x + ws[ws.length - 1].w, y = oy + ln * L.lh + L.lh * 0.98;
    d.line(x0, y, x1, y, lat.c, 2, [5, 4], a);
  }
}

// ═════════ la línea de tiempo de la escritura ═════════
interface StepT { look: number; bars: number; sel: number; fly: number }
const RUN_F0 = 0.03, RUN_L = 0.94 / 8;
const runLocal = (S: Frame, j: number, a: number, b: number) => fr(S, 'run', RUN_F0 + RUN_L * (j + a), RUN_F0 + RUN_L * (j + b), 'io');
function stepTimes(S: Frame, s: number): StepT {
  if (s === 0) return { look: fr(S, 'write1', 0.5, 0.62), bars: fr(S, 'write1', 0.66, 0.8), sel: fr(S, 'pick1', 0.08, 0.22), fly: fr(S, 'pick1', 0.28, 0.6, 'io') };
  if (s === 1) return { look: fr(S, 'autoreg', 0.05, 0.22, 'io'), bars: fr(S, 'autoreg', 0.28, 0.46), sel: runLocal(S, 0, 0.3, 0.55), fly: runLocal(S, 0, 0.6, 0.95) };
  return { look: runLocal(S, s - 1, 0, 0.18), bars: runLocal(S, s - 1, 0.18, 0.4), sel: runLocal(S, s - 1, 0.4, 0.62), fly: runLocal(S, s - 1, 0.62, 0.95) };
}

export function drawWrite(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = writeGeom(S, D), k = g.k, u = S.u, sig = tone(S, 'sig');
  const steps = [{ ctx: D.W.es, ps: D.esP, pick: 0 }, ...D.run.map((s) => ({ ctx: s.ctx, ps: s.ps, pick: s.pick }))];
  const allWords = [...D.start, ...steps.map((s) => s.ps[s.pick].w)];
  const n0 = D.start.length;
  // paso vigente: el último que ya empezó a «mirar»
  let s = 0;
  for (let i = 1; i < steps.length; i++) if (stepTimes(S, i).look > 0) s = i;
  const T = stepTimes(S, s);
  const placed = n0 + s + (T.fly >= 1 ? 1 : 0);   // palabras ya en el texto
  // el texto
  const novelA0 = fr(S, 'new-sentence', 0.05, 0.2);
  textPanel(S, g.strip, S.l('el texto que se va escribiendo', 'the text being written'), { a: fr(S, 'write1', 0, 0.1), alt: S.l('frase nueva: no está en el texto', 'new sentence: not in the text'), altA: novelA0 });
  const L = layoutWords(S, allWords, g.tw, g.size, 650);
  const [ox, oy] = textOrigin(S, g);
  const nCtx = n0 + s;   // palabras que ve el paso s
  const from = wordBox(S, L, Math.max(0, nCtx - 2), ox, oy), to = wordBox(S, L, nCtx - 1, ox, oy);
  const t = s === 0 ? 1 : T.look;
  const sameLine = L.pos[Math.max(0, nCtx - 2)].line === L.pos[nCtx - 1].line;
  const box: Rect = sameLine ? { x: lerp(from.x, to.x, t), y: to.y, w: lerp(from.w, to.w, t), h: to.h } : (t < 0.5 ? from : to);
  const novelA = fr(S, 'new-sentence', 0.05, 0.2);
  drawWords(S, L, ox, oy, {
    shown: placed, weight: 650,
    ctx: box, ctxA: (s === 0 ? T.look : 1) * (1 - novelA), ctxLabel: S.l('lo que mira', 'what it looks at'),
    fresh: placed - 1 >= n0 ? placed - 1 : undefined, freshA: (1 - fr(S, 'autoreg', 0.05, 0.3)) * (s === 0 ? 1 : 1 - runLocal(S, Math.max(0, s - 1), 0.05, 0.2)),
    under: S.on('new-sentence') ? D.novel.map((i) => i + 0) as [number, number] : undefined, underA: novelA,
  });
  contextBrace(S, L, placed, ox, oy, fr(S, 'write1', 0.18, 0.32) * (1 - novelA));
  if (fr(S, 'write1', 0.18, 0.32) > 0.01 && !S.on('autoreg-name')) {
    const end = L.pos[placed - 1], lx = ox + (end.line === 0 ? end.x + end.w : 0);
    label(S, S.l('contexto', 'context'), ox, oy + (end.line + 1) * L.lh + 4 * u, { align: 'left', size: fz(S, 12), weight: 800, color: tone(S, 'lat').ink, a: fr(S, 'write1', 0.18, 0.32) * (1 - fr(S, 'autoreg-name', 0, 0.1)) });
    void lx;
  }
  // barras de la fila de la última palabra (fundido de una fila a la siguiente)
  const barsOut = fr(S, 'new-sentence', 0.02, 0.18);
  const bA = (s === 0 ? T.bars : 1) * (1 - barsOut);
  const rowsOf = (ps: Prob[], hot: number, a: number): BarRow[] => ps.map((x, i) => ({ label: wl(S, x.w), p: x.p, hot: i === hot ? a : 0 }));
  const header = (w: string, a: number) => label(S, S.l(`fila de ${q(S, wl(S, w))}`, `row for ${q(S, wl(S, w))}`), g.bars.x, g.bars.y - 22 * k, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2, a });
  if (bA > 0.01) d.withAlpha(bA, () => {
    if (s > 0 && T.bars < 1) {
      const prev = steps[s - 1];
      d.withAlpha(1 - T.bars, () => { header(prev.ctx, 1); probBars(S, g.bars, rowsOf(prev.ps, prev.pick, 1), { slots: 4 }); });
    }
    const cur = steps[s];
    d.withAlpha(s > 0 ? T.bars : 1, () => {
      header(cur.ctx, 1);
      const geo = probBars(S, g.bars, rowsOf(cur.ps, cur.pick, T.sel), { slots: 4 });
      // la palabra elegida vuela de su barra al final del texto
      if (T.fly > 0 && T.fly < 1) {
        const gr = geo[cur.pick], w = cur.ps[cur.pick].w;
        const sx = gr.lx - 30 * u, sy = gr.y + gr.h / 2;
        const shown = layoutWords(S, allWords.slice(0, n0 + s + 1), g.tw, g.size, 650);
        const pp = shown.pos[n0 + s];
        const ex = ox + pp.x, ey = oy + pp.y + shown.lh / 2;
        const x = lerp(sx, ex, T.fly), y = lerp(sy, ey, T.fly) - Math.sin(Math.PI * T.fly) * 30 * k;
        const lab = w === '.' ? '.' : pp.s;
        const bw = d.measure(lab, { size: g.size, weight: 650 }) + 10 * u;
        d.rect(x - 5 * u, y - shown.lh * 0.42, bw, shown.lh * 0.84, { fill: alpha(sig.c, 0.3), stroke: sig.c, lw: 1.5, r: 4 });
        d.text(lab, x, y, { size: g.size, weight: 650, color: p.ink, base: 'middle' });
      }
    });
  });
  // el bucle de cuatro pasos (desde «autoreg-name»)
  const loopA = fr(S, 'autoreg-name', 0.02, 0.12);
  if (loopA > 0.01) {
    let active = -1, shown = 4;
    if (S.is('autoreg-name')) { shown = 0.4 + fr(S, 'autoreg-name', 0.04, 0.62, 'lin') * 4; active = Math.min(3, Math.floor(shown - 0.4)); if (shown >= 4) active = -1; }
    else if (S.between('run', 'new-sentence')) {
      const Tt = stepTimes(S, Math.max(1, s));
      active = Tt.fly > 0 && Tt.fly < 1 ? 3 : Tt.sel > 0 ? (Tt.fly >= 1 && s >= steps.length - 1 ? -1 : 2) : Tt.bars > 0 ? 1 : 0;
    }
    loopDiagram(S, g.loop, active, { a: loopA * (1 - fr(S, 'new-sentence', 0.02, 0.18)), shown });
    if (S.between('run', 'new-sentence')) {
      const turn = Math.min(8, Math.max(1, s));
      label(S, S.l(`vuelta ${turn} de 8`, `turn ${turn} of 8`), g.loop.x + g.loop.w / 2, g.loop.y + g.loop.h / 2 - 8 * k, { size: fz(S, 12), weight: 700, color: p.mute, a: fr(S, 'run', 0, 0.06) * (g.loop.w / g.loop.h > 2.8 ? 0 : 1) });
    }
  }
  // la frase nueva y los pedazos de frases que unió
  if (novelA > 0.01) drawPieces(S, D, g, novelA);
}

function drawPieces(S: Frame, D: Demo, g: G, a: number) {
  const { d, pal: p } = S, k = g.k, u = S.u, W = D.W, sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const R = g.R, top = g.strip.y + g.strip.h + 18 * k;
  const pieces: [string[], string][] = [
    [[W.de, W.noche, W.el], S.l('de la frase 5', 'from sentence 5')],
    [[W.el, W.mar, W.es], S.l('de las frases 2 y 7', 'from sentences 2 and 7')],
    [[W.es, W.oscuro, '.'], S.l('de la frase 5', 'from sentence 5')],
  ];
  const pa = fr(S, 'new-sentence', 0.45, 0.6);
  label(S, S.l('pedazos que unió', 'pieces it stitched together'), R.x, top, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2, a: pa });
  const size = fz(S, 16), rh = Math.min(40 * k, (R.y + R.h - top - 26 * k) / 3);
  pieces.forEach(([ws, src], i) => {
    const pa2 = fr(S, 'new-sentence', 0.5 + 0.1 * i, 0.6 + 0.1 * i);
    if (pa2 < 0.01) return;
    const y = top + 26 * k + i * rh;
    const txt = (i === 0 ? '' : '… ') + ws.map((w, j) => (w === '.' ? '.' : i === 0 && j === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ').replace(' .', '.') + (i === 2 ? '' : ' …');
    const tw = d.measure(txt, { size, weight: 650 }) + 18 * u;
    d.withAlpha(pa2, () => {
      d.rect(R.x, y, tw, rh * 0.78, { fill: alpha(lat.c, 0.12), stroke: lat.c, lw: 1.3, r: 4 });
      d.text(txt, R.x + 9 * u, y + rh * 0.39, { size, weight: 650, color: p.ink, base: 'middle' });
      d.text(src, R.x + tw + 10 * u, y + rh * 0.39, { size: fz(S, 12), weight: 600, color: p.mute, base: 'middle' });
    });
  });
}

// ═════════ elegir: voraz, franja y dardos, corridas ═════════
export function drawChoose(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = writeGeom(S, D), k = g.k, u = S.u;
  const runsA = fr(S, 'sample-runs', 0.02, 0.14);
  const topA = 1 - runsA;
  if (topA > 0.01) d.withAlpha(topA, () => {
    // el texto: «El cielo es» y, en «greedy», la escritura voraz
    const cyc0 = fr(S, 'greedy', 0.82, 0.92) * (1 - fr(S, 'sample', 0, 0.1));
    textPanel(S, g.strip, S.l('el texto que se va escribiendo', 'the text being written'), { alt: S.l('se repite para siempre', 'it repeats forever'), altA: cyc0, altTone: 'err' });
    const words = D.greedy, n0 = D.start.length, nG = words.length - n0;
    const gp = fr(S, 'greedy', 0.06, 0.78, 'lin') * nG;
    const placed = n0 + Math.floor(gp + 1e-6) * (S.on('sample') ? 0 : 1);
    const L = layoutWords(S, words, g.tw, g.size, 650);
    const [ox, oy] = textOrigin(S, g);
    const cyc = fr(S, 'greedy', 0.82, 0.92) * (1 - fr(S, 'sample', 0, 0.1));
    const lastBox = wordBox(S, L, placed - 1, ox, oy);
    drawWords(S, L, ox, oy, { shown: placed, weight: 650, ctx: lastBox, ctxA: 1 - cyc, ctxLabel: S.l('lo que mira', 'what it looks at'), cursor: S.on('sample') });
    if (cyc > 0.01) {
      // las tres repeticiones de «el cielo es azul.»
      for (let r = 0; r < 3; r++) {
        const a0 = wordBox(S, L, r * 5, ox, oy), a1 = wordBox(S, L, r * 5 + 4, ox, oy);
        if (L.pos[r * 5].line !== L.pos[r * 5 + 4].line) continue;
        d.line(a0.x + 2, a1.y + a1.h + 3 * k, a1.x + a1.w - 2, a1.y + a1.h + 3 * k, tone(S, 'err').c, 2.5, undefined, cyc);
      }
    }
    // barras: en «greedy-def» y «greedy» siguen a la última palabra; siempre gana la de arriba
    const barsA = 1 - fr(S, 'sample', 0.02, 0.15);
    if (barsA > 0.01) d.withAlpha(barsA, () => {
      const last = words[placed - 1], rows = probs(rowsFor(D.m, last)!);
      const hot = fr(S, 'greedy-def', 0.45, 0.6);
      label(S, S.l(`fila de ${q(S, wl(S, last))}`, `row for ${q(S, wl(S, last))}`), g.bars.x, g.bars.y - 22 * k, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2 });
      const geo = probBars(S, g.bars, rows.map((x, i) => ({ label: wl(S, x.w), p: x.p, hot: i === 0 ? hot : 0 })), { slots: 4 });
      // «la más probable»
      const tagA = fr(S, 'greedy-def', 0.5, 0.65);
      if (tagA > 0.01) label(S, S.l('elige siempre la de arriba', 'always picks the top one'), g.bars.x + g.bars.w, g.bars.y - 22 * k, { align: 'right', size: fz(S, 12), weight: 800, color: tone(S, 'sig').ink, a: tagA });
      void geo;
    });
    // la franja y los dardos (sustituyen a las barras)
    const fA = fr(S, 'sample', 0.12, 0.26);
    if (fA > 0.01) d.withAlpha(fA, () => drawDarts(S, D, g));
  });
  if (runsA > 0.01) d.withAlpha(runsA, () => drawRuns(S, D, g));
}

function drawDarts(S: Frame, D: Demo, g: G) {
  const { d, pal: p } = S, k = g.k, u = S.u, R = g.R, err = tone(S, 'err');
  const zone: Rect = { x: R.x, y: g.bars.y, w: R.w, h: R.y + R.h - g.bars.y };
  const fh = Math.min(56 * k, Math.max(28 * k, zone.h * 0.24)), fy = zone.y + (isShort(S) ? 18 : 30) * k;
  const fRect: Rect = { x: zone.x + 4 * u, y: fy, w: zone.w - 8 * u, h: fh };
  label(S, S.l(`una franja para ${q(S, D.W.es)}: cada pedazo mide lo que su probabilidad`, `a strip for ${q(S, D.W.es)}: each slice is as big as its probability`), zone.x, zone.y - 22 * k, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2, w: zone.w });
  const ps = D.esP;
  const picks = D.darts.map((uu) => choose(ps, uu));
  const nd = D.darts.length;
  const dartT = (i: number) => fr(S, 'dart', 0.12 + 0.065 * i, 0.17 + 0.065 * i, 'io');
  const shown = D.darts.filter((_, i) => dartT(i) > 0.99).length;
  const counts = [0, 0, 0, 0]; picks.forEach((c, i) => { if (dartT(i) > 0.99) counts[c]++; });
  const segs = franja(S, fRect, ps.map((x) => ({ label: `${x.w} ${pct(S, x.p)}`, p: x.p })), {});
  // dardos: caen sobre la franja en la posición sorteada
  D.darts.forEach((uu, i) => {
    const t = dartT(i); if (t < 0.01) return;
    const x = fRect.x + fRect.w * uu, y = lerp(fRect.y - 28 * k, fRect.y + 3 * k, t);
    const last = i === shown - 1 || (t < 1 && t > 0);
    d.withAlpha(t < 1 ? 1 : last ? 1 : 0.55, () => {
      d.line(x, y - 16 * k, x, y, err.c, 2);
      d.polygon([[x, y + 2 * k], [x - 4 * k, y - 6 * k], [x + 4 * k, y - 6 * k]], { fill: err.c });
    });
  });
  // cuántas veces salió cada palabra
  const cy = fRect.y + fRect.h + (segs.some(([a, b]) => b - a < d.measure('oscuro 12.5 %', { size: fz(S, 13), weight: 700 }) + 8 * u) ? 50 : 14) * k;
  const ca = fr(S, 'dart', 0.12, 0.2);
  if (ca > 0.01) {
    const lab = S.l(`${shown} de ${nd} dardos:`, `${shown} of ${nd} darts:`);
    const items = ps.map((x, i) => `${x.w} × ${counts[i]}`);
    const inline = cy + 22 * k + 26 * k > R.y + R.h;   // no cabe debajo: en el mismo renglón
    const lw = d.measure(lab, { size: fz(S, 13), weight: 800 }) + 10 * u;
    label(S, lab, zone.x, inline ? cy + 13 * k : cy, { align: 'left', base: inline ? 'middle' : 'top', size: fz(S, 13), weight: 800, color: p.ink2, a: ca });
    chipRow(S, inline ? zone.x + lw : zone.x, inline ? cy : cy + 22 * k, inline ? zone.w - lw : zone.w, items, { shown: 4 * ca });
  }
}

function drawRuns(S: Frame, D: Demo, g: G) {
  const { d, pal: p } = S, k = g.k, u = S.u, R = g.R, lat = tone(S, 'lat'), st = stOf(S);
  const top = R.y + 4 * k;
  const same = fr(S, 'same-q', 0.1, 0.3);
  label(S, S.l(`corridas sorteadas, todas desde ${q(S, D.start.join(' '))}`, `sampled runs, all starting from ${q(S, D.start.join(' '))}`), R.x, top, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2, w: R.w, a: 1 - same });
  label(S, S.l('misma entrada, textos distintos', 'same input, different texts'), R.x, top, { align: 'left', size: fz(S, 13), weight: 800, color: lat.ink, w: R.w, a: same });
  // las tres de la demostración, más las que pida la persona (las nuevas, arriba)
  type Row = { words: string[]; shown: number; n: number; user: boolean };
  const rows: Row[] = [];
  const nUser = st.runs.length;
  st.runs.slice(-2).reverse().forEach((r, j) => {
    const words = runOf(D.m, D.start, r.seed);
    rows.push({ words, shown: D.start.length + Math.max(0, (S.clock - r.t0) * 7), n: 3 + nUser - j, user: true });
  });
  D.runs3.forEach((w, i) => rows.push({ words: w, shown: D.start.length + fr(S, 'sample-runs', 0.12 + 0.24 * i, 0.32 + 0.24 * i, 'lin') * (w.length - D.start.length), n: i + 1, user: false }));
  const vis = rows.slice(0, 4);
  const size = fz(S, S.portrait ? 16 : 19), tw = R.w - 70 * u;
  const lays = vis.map((r) => layoutWords(S, r.words, tw, size, 600));
  const y0 = top + 30 * k;
  const avail = R.y + R.h - y0;
  const heights = lays.map((L) => L.lines * L.lh + 18 * k);
  const tot = heights.reduce((a, b) => a + b, 0) + (vis.length - 1) * 8 * k;
  const sc = tot > avail ? avail / tot : 1;
  let y = y0;
  vis.forEach((r, i) => {
    const L = lays[i], h = heights[i] * sc;
    const a = r.user ? 1 : clamp(r.shown - D.start.length + 1);
    d.withAlpha(a, () => {
      d.rect(R.x, y, R.w, h, { fill: p.surface, stroke: r.user ? tone(S, 'sig').c : p.line, lw: r.user ? 1.8 : 1.2, r: 5 });
      label(S, `${r.n}`, R.x + 22 * u, y + h / 2, { base: 'middle', size: fz(S, 14), weight: 800, color: p.mute });
      const ox = R.x + 48 * u, oy = y + (h - L.lines * L.lh) / 2;
      if (same > 0.01) for (let j = 0; j < D.start.length; j++) { const b = wordBox(S, L, j, ox, oy); d.rect(b.x, b.y, b.w, b.h, { fill: alpha(lat.c, 0.16 * same), r: 3 }); }
      drawWords(S, L, ox, oy, { shown: r.shown, weight: 600 });
    });
    y += h + 8 * k;
  });
}
