// Acto 3 · El ancho de banda manda: leer vs calcular, el techo de velocidad, la cuantización, los lotes y el turno 2
// («un lote que cueste poco sin que cada persona vaya lenta»). Todos los números salen de model.ts.
import { Plot, alpha, clamp, hash, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { A100, H100, LLAMA3_8B, RTX3060, denseParams, gb, nf, secs, serve, sig, tok, usd, type Gpu } from './model';
import { FS, axes, chip, fitText, holds, lang, lerpRect, line2, mark, noteUp, op, pad, pill, show, tagText } from './ui';

const A8 = LLAMA3_8B, N8 = denseParams(A8), W8 = N8 * 2, BW = H100.bw;

// ═════════════ leer vs calcular ═════════════
export function drawBw(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const dh = clamp(A.h * 0.34, 110 * u, 190 * u), y0 = A.y + clamp(A.h * 0.05, 6 * u, 36 * u), bwid = A.w * (S.portrait ? 0.28 : 0.26);
  const mem: Rect = { x: A.x, y: y0, w: bwid, h: dh }, cmp: Rect = { x: A.x + A.w - bwid, y: y0, w: bwid, h: dh };
  const tCalc = (2 * N8) / H100.peak, tMem = W8 / BW;
  const cells = (r: Rect, t: 'w' | 'dat', act: (i: number) => number, al: number) => {
    const c = tone(S, t), cols = S.portrait ? 5 : 7, rows = S.portrait ? 4 : 5, gap = 2 * u, top = 30 * u, bot = 26 * u;
    const cs = Math.min((r.w - 16 * u) / cols, (r.h - top - bot) / rows), gw = cs * cols, gx = r.x + (r.w - gw) / 2, gy = r.y + top;
    d.withAlpha(al, () => { for (let k = 0; k < cols * rows; k++) d.rect(gx + (k % cols) * cs, gy + Math.floor(k / cols) * cs, cs - gap, cs - gap, { fill: alpha(c.c, 0.08 + 0.8 * clamp(act(k))) }); });
  };
  // memoria
  const aM = S.reveal('read-all', 0.1, 0.6);
  show(S, aM, () => {
    d.rect(mem.x, mem.y, mem.w, mem.h, { fill: alpha(wt.c, 0.06), stroke: wt.c, lw: 1.6, r: 4 });
    fitText(S, S.l('Memoria (HBM)', 'Memory (HBM)'), mem.x + mem.w / 2, mem.y + 8 * S.u, mem.w - 8 * u, 14, { weight: 800, color: wt.ink, align: 'center', base: 'top' });
    cells(mem, 'w', (k) => 0.55 + 0.4 * hash(k, 5), 1);
    fitText(S, S.portrait ? gb(W8, l, 1) : S.l(`pesos ${gb(W8, 'es', 1)}`, `weights ${gb(W8, 'en', 1)}`), mem.x + mem.w / 2, mem.y + mem.h - 6 * S.u, mem.w - 8 * u, 13, { weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'bottom' });
  });
  // cálculo
  const flash = S.on('math-little') && !S.on('read-slow') ? clamp(1 - Math.abs(S.since('math-little') - 1.2) / 0.45) : 0;
  show(S, S.reveal('read-all', 0.5, 0.6), () => {
    d.rect(cmp.x, cmp.y, cmp.w, cmp.h, { fill: alpha(dt.c, 0.06), stroke: dt.c, lw: 1.6, r: 4 });
    fitText(S, S.l('Cálculo', 'Arithmetic'), cmp.x + cmp.w / 2, cmp.y + 8 * S.u, cmp.w - 8 * u, 14, { weight: 800, color: dt.ink, align: 'center', base: 'top' });
    const blink = S.on('read-slow') ? (Math.sin(S.clock * 1.7) > 0.96 ? 1 : 0) : 0;
    cells(cmp, 'dat', (k) => (flash > 0 ? 0.15 + 0.85 * flash : blink && k === Math.floor(S.clock * 3) % 30 ? 0.9 : 0.02), 1);
    if (S.on('read-slow')) tagText(S, S.portrait ? S.l('esperando', 'waiting') : S.l('esperando datos', 'waiting for data'), cmp.x + cmp.w / 2, cmp.y + cmp.h - 6 * S.u, { t: 'mute', align: 'center', base: 'bottom', weight: 700 });
  });
  // tubería
  const py = y0 + dh / 2, px0 = mem.x + mem.w + 8 * u, px1 = cmp.x - 8 * u, ph = 28 * u;
  show(S, S.reveal('read-all', 0.8, 0.6), () => {
    d.rect(px0, py - ph / 2, px1 - px0, ph, { fill: p.surface2, stroke: p.lineStrong, lw: 1.3 });
    const n = Math.max(4, Math.floor((px1 - px0) / (26 * u)));
    for (let i = 0; i < n; i++) { const f = (S.clock * 0.45 + i / n) % 1; d.rect(px0 + f * (px1 - px0 - 10 * u), py - 5 * u, 10 * u, 10 * u, { fill: alpha(wt.c, 0.85) }); }
    d.arrow(px0 + 6 * u, py + ph / 2 + 12 * u, px1 - 6 * u, py + ph / 2 + 12 * u, p.lineStrong, 1.6, 7);
    tagText(S, S.l(`${gb(W8, 'es', 1)} por token`, `${gb(W8, 'en', 1)} per token`), (px0 + px1) / 2, py - ph / 2 - 12 * u, { t: 'w', align: 'center', base: 'bottom', size: S.portrait ? 13 : 14 });
    if (S.on('read-slow')) tagText(S, S.l(`ancho de banda ${nf(BW / 1e12, 2, 'es')} TB/s`, `bandwidth ${nf(BW / 1e12, 2, 'en')} TB/s`), (px0 + px1) / 2, py + ph / 2 + 28 * u, { t: 'w', align: 'center', base: 'top', a: S.reveal('read-slow', 0.1, 0.5), weight: 600 });
  });
  // barras de tiempo
  const by = y0 + dh + clamp(A.h * 0.12, 44 * u, 74 * u), bh = clamp(A.h * 0.065, 22 * u, 34 * u), lw = Math.min(160 * u, A.w * 0.3), bx = A.x + lw + 8 * u, bw = A.x + A.w - bx - 84 * u;
  const aBars = S.reveal('math-little', 0.3, 0.5) * (1 - S.reveal('speed-law', 0, 0.5));
  show(S, aBars, () => {
    const r1 = S.reveal('math-little', 0.9, 0.8), r2 = S.reveal('read-slow', 0.5, 1.2);
    d.text(S.l('calcular (un token)', 'arithmetic (one token)'), bx - 8 * u, by + bh / 2, { size: FS(S, 13), weight: 700, color: dt.ink, align: 'right', base: 'middle', w: lw });
    d.rect(bx, by, bw, bh, { fill: p.surface2 }); d.rect(bx, by, Math.max(3, bw * (tCalc / tMem) * r1), bh, { fill: dt.c });
    d.text(secs(tCalc, l), bx + Math.max(3, bw * (tCalc / tMem)) + 8 * u, by + bh / 2, { size: FS(S, 14), weight: 700, font: 'mono', color: dt.ink, base: 'middle', a: r1 });
    const y2 = by + bh + 16 * u;
    show(S, r2, () => {
      d.text(S.l('leer los pesos', 'read the weights'), bx - 8 * u, y2 + bh / 2, { size: FS(S, 13), weight: 700, color: wt.ink, align: 'right', base: 'middle', w: lw });
      d.rect(bx, y2, bw, bh, { fill: p.surface2 }); d.rect(bx, y2, bw * r2, bh, { fill: wt.c });
      d.text(secs(tMem, l), bx + bw + 8 * u, y2 + bh / 2, { size: FS(S, 14), weight: 700, font: 'mono', color: wt.ink, base: 'middle' });
    });
    show(S, S.reveal('read-slow', 2.4, 0.6), () => {
      pill(S, S.l(`≈ ${nf(Math.round(tMem / tCalc / 10) * 10, 0, 'es')} veces más`, `≈ ${nf(Math.round(tMem / tCalc / 10) * 10, 0, 'en')}× longer`), bx + bw * 0.5, y2 + bh + 24 * u, { t: 'w' });
      pill(S, S.l(`cálculo usado: ${nf((tCalc / tMem) * 100, 1, 'es')} %`, `arithmetic used: ${nf((tCalc / tMem) * 100, 1, 'en')}%`), cmp.x + cmp.w, cmp.y + cmp.h + 20 * u, { t: 'dat', align: 'right' });
    });
  });
  // la regla: ancho de banda ÷ bytes
  const aF = S.reveal('speed-law', 0.4, 0.6);
  show(S, aF, () => {
    const gap = 26 * u, cw = (A.w - 2 * gap) / 3, chH = clamp(A.h * 0.13, 56 * u, 80 * u), y = by - 4 * u, ceil = BW / W8;
    chip(S, { x: A.x, y, w: cw, h: chH }, S.l('ancho de banda', 'bandwidth'), `${nf(BW / 1e12, 2, l)} TB/s`, 'w', { vsize: S.portrait ? 15 : 20 });
    op(S, A.x + cw + gap / 2, y + chH / 2, '÷');
    chip(S, { x: A.x + cw + gap, y, w: cw, h: chH }, S.l('bytes por token', 'bytes per token'), gb(W8, l, 1), 'w', { vsize: S.portrait ? 15 : 20 });
    op(S, A.x + 2 * cw + gap * 1.5, y + chH / 2, '=');
    chip(S, { x: A.x + 2 * (cw + gap), y, w: cw, h: chH }, S.portrait ? S.l('techo', 'ceiling') : S.l('techo, un usuario', 'ceiling, one user'), `${nf(Math.round(ceil), 0, l)} t/s`, 'dat', { vsize: S.portrait ? 15 : 20, hot: 0.5 });
    tagText(S, S.l('tokens por segundo ≤ ancho de banda ÷ bytes leídos por token', 'tokens per second ≤ bandwidth ÷ bytes read per token'), A.x + A.w / 2, y + chH + 26 * u, { align: 'center', base: 'top', w: A.w, size: 14, t: 'ink' });
  });
  void tok; void sig;
}

// ═════════════ cuantización: el techo sube ═════════════
export function drawQuant(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), dt = tone(S, 'dat'), wt = tone(S, 'w'), er = tone(S, 'err');
  const gpus: Gpu[] = [RTX3060, A100, H100], precs: [number, string, string][] = [[2, '16 bits', '16 bits'], [1, '8 bits', '8 bits'], [0.5, '4 bits', '4 bits']];
  const rowLabW = Math.min(150 * u, A.w * (S.portrait ? 0.38 : 0.33)), cw = (A.w - rowLabW) / 3, top = A.y + 56 * u, rh = clamp((A.h - 56 * u - 70 * u) / 3, 54 * u, 100 * u), headH = 46 * u;
  const a0 = S.reveal('quant-speed', 0.1, 0.5);
  show(S, a0, () => {
    fitText(S, S.l('Techo de tokens por segundo, una persona', 'Tokens-per-second ceiling, one person'), A.x, A.y + 4 * u, A.w, 17, { weight: 800, base: 'top' });
    fitText(S, S.l('modelo de 8 mil millones de parámetros', '8-billion-parameter model'), A.x, A.y + 30 * u, A.w, 12, { weight: 600, color: p.mute, base: 'top' });
  });
  precs.forEach(([bp, es, en], ci) => {
    const a = S.reveal('quant-speed', 0.4 + ci * 1.6, 0.6), x = A.x + rowLabW + ci * cw, bytes = N8 * bp;
    show(S, a, () => {
      d.text(S.l(es, en), x + cw / 2, top, { size: FS(S, 15), weight: 800, color: p.ink, align: 'center', base: 'top' });
      d.text(gb(bytes, l, 1), x + cw / 2, top + 22 * u, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' });
      gpus.forEach((g, ri) => {
        const y = top + headH + ri * rh, fits = bytes <= g.mem, v = g.bw / bytes, k = v / (H100.bw / (N8 * 0.5)), cx = x + 3 * u, cwid = cw - 6 * u, chh = rh - 6 * u;
        if (fits) {
          d.rect(cx, y, cwid, chh, { fill: alpha(dt.c, 0.08 + 0.55 * Math.sqrt(k)), stroke: dt.c, lw: 1.3, r: 3 });
          fitText(S, nf(Math.round(v), 0, l), cx + cwid / 2, y + chh / 2, cwid - 8 * u, S.portrait ? 20 : 26, { weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
        } else {
          d.rect(cx, y, cwid, chh, { fill: alpha(er.c, 0.05), stroke: er.c, lw: 1.3, r: 3, dash: [5, 4] });
          mark(S, cx + cwid / 2, y + chh * 0.36, false, { r: 8 });
          fitText(S, S.portrait ? S.l('no cabe', 'won’t fit') : S.l('no cabe', 'does not fit'), cx + cwid / 2, y + chh * 0.72, cwid - 8 * u, 13, { weight: 700, color: er.ink, align: 'center', base: 'middle' });
        }
      });
    });
  });
  show(S, a0, () => gpus.forEach((g, ri) => {
    const y = top + headH + ri * rh, hot = ri === 0 && S.on('quant-speed') && S.at('quant-speed', 5.0, 5.6) > 0.5;
    d.text(g.name, A.x + rowLabW - 10 * u, y + rh / 2 - 12 * u, { size: FS(S, 14), weight: 800, color: hot ? wt.ink : p.ink, align: 'right', base: 'middle', w: rowLabW - 10 * u });
    d.text(`${nf(g.bw / 1e9, 0, l)} GB/s`, A.x + rowLabW - 10 * u, y + rh / 2 + 8 * u, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' });
    d.text(`${gb(g.mem, l, 0)}`, A.x + rowLabW - 10 * u, y + rh / 2 + 24 * u, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' });
  }));
  show(S, S.reveal('quant-speed', 5.0, 0.6), () => {
    const y = top + headH, r = { x: A.x + 2 * u, y: y - 2 * u, w: A.w - 4 * u, h: rh - 2 * u };
    d.rect(r.x, r.y, r.w, r.h, { stroke: p.ink, lw: 2.2, r: 4 });
  });
  show(S, S.reveal('quant-speed', 1.0, 0.6), () => noteUp(S, S.l('cota teórica: ignora la caché y los sobrecostos; 4 bits cuenta como medio byte por peso', 'theoretical bound: ignores the cache and overheads; 4 bits counts as half a byte per weight'), A.x + A.w / 2, A.y + A.h - 2 * u, A.w, { align: 'center' }));
}

// ═════════════ lotes: rendimiento y velocidad por persona ═════════════
interface Curves { thr: number[]; per: number[]; cost: number[]; maxU: number }
const CACHE = new Map<number, Curves>();
export const NB = 64;
export function curves(ctx: number): Curves {
  const hit = CACHE.get(ctx); if (hit) return hit;
  const thr: number[] = [], per: number[] = [], cost: number[] = []; let maxU = 0;
  for (let b = 1; b <= NB; b++) { const s = serve(A8, H100, 2, b, ctx); thr.push(s.throughput); per.push(s.perUser); cost.push(s.costPerM); maxU = s.maxUsers; }
  const c = { thr, per, cost, maxU }; CACHE.set(ctx, c); return c;
}
const CTX = 8000;
const at = (arr: number[], b: number) => { const i = clamp(b, 1, NB) - 1, i0 = Math.floor(i), i1 = Math.min(NB - 1, i0 + 1); return lerp(arr[i0], arr[i1], i - i0); };
const idealThr = (b: number) => (b * BW) / W8, idealPer = BW / W8;

function chartRects(S: Frame, A: Rect, pairT: number): [Rect, Rect] {
  const gap = (S.portrait ? 12 : 22) * S.u;
  const solo: Rect = S.portrait ? A : { x: A.x + A.w * 0.1, y: A.y, w: A.w * 0.8, h: A.h };
  const a: Rect = S.portrait ? { x: A.x, y: A.y, w: A.w, h: (A.h - gap) / 2 } : { x: A.x, y: A.y, w: (A.w - gap) / 2, h: A.h };
  const b: Rect = S.portrait ? { x: A.x, y: A.y + (A.h - gap) / 2 + gap, w: A.w, h: (A.h - gap) / 2 } : { x: A.x + (A.w - gap) / 2 + gap, y: A.y, w: (A.w - gap) / 2, h: A.h };
  return [lerpRect(solo, a, pairT), b];
}
const mkPlot = (S: Frame, r: Rect, yMax: number, yTicks: number[], xLabel: string, yLabel: string, yFmt: (v: number) => string, a = 1) => {
  const l = lang(S), pl = new Plot(S, r, { xr: [0, NB], yr: [0, yMax], pad: { l: S.portrait ? 44 : 52, r: 10, t: 24, b: 34 } });
  axes(S, pl, { xTicks: [0, 16, 32, 48, 64], yTicks, xFmt: (v) => nf(v, 0, l), yFmt, xLabel, yLabel, grid: true, a });
  return pl;
};
const maxUMark = (S: Frame, pl: Plot, maxU: number, a = 1) => {
  const { d } = S, er = tone(S, 'err');
  d.withAlpha(a, () => {
    d.dither(pl.X(maxU), pl.r.y, pl.r.x + pl.r.w - pl.X(maxU), pl.r.h, er.c, 0.22, 2);
    d.line(pl.X(maxU), pl.r.y, pl.X(maxU), pl.r.y + pl.r.h, er.c, 2, [5, 4]);
  });
};
const sample = (f: (b: number) => number, from = 1, to = NB): [number, number][] => { const o: [number, number][] = []; for (let b = from; b <= to; b++) o.push([b, f(b)]); return o; };

export function drawBatch(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), dt = tone(S, 'dat'), sg = tone(S, 'sig'), mt = tone(S, 'mute');
  const pairT = S.at('trade-off', 0, 0.9, 'io'), [r1, r2] = chartRects(S, A, pairT), c8 = curves(CTX);
  const fmtK = (v: number) => nf(v, 0, l);
  // gráfica 1: rendimiento del sistema
  const a1 = S.reveal('batching', 0.1, 0.6);
  show(S, a1, () => {
    const pl = mkPlot(S, r1, 14000, [0, 5000, 10000], S.l('personas en el lote', 'people in the batch'), S.l('tokens/s de todo el sistema', 'tokens/s of the whole system'), fmtK);
    const prog = S.on('batch-limit') ? 1 : S.at('batching', 0.8, 5.5, 'io'), bMax = 1 + (NB - 1) * prog;
    line2(S, pl, sample(idealThr, 1, Math.floor(bMax)), 'mute', 2.2, { dash: [6, 5] });
    if (!S.on('batch-limit')) {
      const b = Math.max(1, bMax), x = pl.X(b), y = pl.Y(idealThr(b));
      d.circle(x, y, 6 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
      pill(S, `${nf(Math.round(b), 0, l)} · ${tok(idealThr(b), l)} t/s`, clamp(x, pl.r.x + 70 * u, pl.r.x + pl.r.w - 70 * u), y - 20 * u, { t: 'ink' });
    }
    tagText(S, S.l('si solo hubiera que leer los pesos', 'if only the weights had to be read'), pl.r.x + 10 * u, pl.Y(idealThr(NB)) + 0, { align: 'left', base: 'top', size: 12, t: 'mute', weight: 600 });
    // la caché de cada persona
    const aR = S.reveal('batch-limit', 0.3, 0.8);
    show(S, aR, () => {
      const q = S.at('batch-limit', 0.8, 4.6, 'io'), bm = 1 + (NB - 1) * q;
      maxUMark(S, pl, c8.maxU, S.reveal('batch-limit', 4.8, 0.6));
      line2(S, pl, sample((b) => at(c8.thr, b), 1, Math.floor(bm)), 'dat', 3);
      if (S.on('trade-off')) { /* queda dibujada */ }
      const yEnd = at(c8.thr, Math.min(c8.maxU, bm)), xEnd = pl.X(Math.min(c8.maxU, bm));
      d.circle(xEnd, pl.Y(yEnd), 5.5 * u, { fill: dt.c, stroke: p.stage, lw: 2 });
      if (!S.on('trade-off')) tagText(S, S.portrait ? S.l('con cachés (8 000 tokens)', 'with caches (8,000 tokens)') : S.l('con la caché de cada persona (8 000 tokens)', 'with each person’s cache (8,000 tokens)'), pl.r.x + pl.r.w - 8 * u, pl.Y(c8.thr[NB - 1]) - 26 * u, { align: 'right', base: 'bottom', t: 'dat', size: 12 });
      show(S, S.reveal('batch-limit', 4.8, 0.6), () => tagText(S, S.l('no cabe', 'does not fit'), pl.r.x + pl.r.w - 4 * u, pl.r.y + pl.r.h * 0.45, { t: 'err', align: 'right', size: 12 }));
    });
    if (S.on('trade-off')) {
      const q = S.at('trade-off', 0.8, 3.4, 'io'), b = 1 + 31 * q, x = pl.X(b), y = pl.Y(at(c8.thr, b));
      d.circle(x, y, 6 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
      pill(S, `${nf(Math.round(b), 0, l)} · ${tok(at(c8.thr, b), l)} t/s`, clamp(x, pl.r.x + 70 * u, pl.r.x + pl.r.w - 70 * u), y - 22 * u, { t: 'ink' });
    }
  });
  // gráfica 2: velocidad por persona
  if (S.on('trade-off')) show(S, S.reveal('trade-off', 0.3, 0.7), () => {
    const pl = mkPlot(S, r2, 240, [0, 100, 200], S.l('personas en el lote', 'people in the batch'), S.l('tokens/s por persona', 'tokens/s per person'), fmtK);
    line2(S, pl, [[0, idealPer], [NB, idealPer]], 'mute', 2.2, { dash: [6, 5] });
    line2(S, pl, sample((b) => at(c8.per, Math.min(b, c8.maxU))), 'sig', 3, { a: 1 });
    maxUMark(S, pl, c8.maxU);
    const q = S.at('trade-off', 0.8, 3.4, 'io'), b = 1 + 31 * q, x = pl.X(b), y = pl.Y(at(c8.per, b));
    d.circle(x, y, 6 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
    pill(S, `${nf(Math.round(at(c8.per, b)), 0, l)} t/s`, clamp(x, pl.r.x + 40 * u, pl.r.x + pl.r.w - 40 * u), y - 22 * u, { t: 'sig' });
    tagText(S, S.l('latencia: lo que espera cada persona', 'latency: what each person waits'), pl.r.x + pl.r.w - 8 * u, pl.r.y + pl.r.h * 0.42, { align: 'right', base: 'bottom', t: 'sig', size: 12 });
    void mt; void sg;
  });
}

// ═════════════ turno 2 ═════════════
export const GOAL_COST = 0.3, GOAL_SPEED = 50;
export function updateBatch(S: Frame): boolean {
  if (!S.between('try2', 'context-hurts')) return false;
  const ctx = Number(S.p.ctx2 ?? 8000), B = Math.round(S.p.bsize ?? 1), s = serve(A8, H100, 2, B, ctx);
  return holds(S, 'batch', ctx === 8000 && s.fits && s.costPerM <= GOAL_COST && s.perUser >= GOAL_SPEED);   // detenerse en la meta, no pasar de largo
}

export function drawGate2(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), dt = tone(S, 'dat'), sg = tone(S, 'sig'), wt = tone(S, 'w');
  const hurts = S.on('context-hurts');
  const ctx = Number(S.p.ctx2 ?? 8000), B = Math.round(S.p.bsize ?? 1), s = serve(A8, H100, 2, B, ctx), cv = curves(ctx), c8 = curves(8000), c32 = curves(32000);
  const chipH = 60 * u, area: Rect = { x: A.x, y: A.y, w: A.w, h: A.h - chipH - 12 * u * (hurts ? 0 : 1) - (hurts ? 0 : 0) };
  const body: Rect = hurts ? A : area, gap = (S.portrait ? 12 : 22) * u;
  const r1: Rect = S.portrait ? { x: body.x, y: body.y, w: body.w, h: (body.h - gap) / 2 } : { x: body.x, y: body.y, w: (body.w - gap) / 2, h: body.h };
  const r2: Rect = S.portrait ? { x: body.x, y: body.y + (body.h - gap) / 2 + gap, w: body.w, h: (body.h - gap) / 2 } : { x: body.x + (body.w - gap) / 2 + gap, y: body.y, w: (body.w - gap) / 2, h: body.h };
  const yMaxC = 3.6;
  // costo
  const p1 = new Plot(S, r1, { xr: [0, NB], yr: [0, yMaxC], pad: { l: S.portrait ? 44 : 52, r: 10, t: 24, b: 34 } });
  axes(S, p1, { xTicks: [0, 16, 32, 48, 64], yTicks: [0, 1, 2, 3], xFmt: (v) => nf(v, 0, l), yFmt: (v) => nf(v, 0, l), xLabel: S.l('personas en el lote', 'people in the batch'), yLabel: S.l('US$ por millón de tokens', 'US$ per million tokens'), grid: true });
  const p2 = new Plot(S, r2, { xr: [0, NB], yr: [0, 240], pad: { l: S.portrait ? 44 : 52, r: 10, t: 24, b: 34 } });
  axes(S, p2, { xTicks: [0, 16, 32, 48, 64], yTicks: [0, 50, 100, 150, 200], xFmt: (v) => nf(v, 0, l), yFmt: (v) => nf(v, 0, l), xLabel: S.l('personas en el lote', 'people in the batch'), yLabel: S.l('tokens/s por persona', 'tokens/s per person'), grid: true });
  const feas = (c: Curves, f: (b: number) => number) => sample(f, 1, c.maxU);
  const metaC = (pl: Plot) => { line2(S, pl, [[0, GOAL_COST], [NB, GOAL_COST]], 'dat', 2, { dash: [7, 5] }); if (!(hurts && S.portrait)) tagText(S, S.l(`meta ≤ ${nf(GOAL_COST, 2, 'es')}`, `goal ≤ ${nf(GOAL_COST, 2, 'en')}`), pl.r.x + pl.r.w - 6 * u, pl.Y(GOAL_COST) + (hurts ? 10 : -10) * u, { align: 'right', base: hurts ? 'top' : 'bottom', t: 'dat', size: 12 }); };
  const metaS = (pl: Plot) => { line2(S, pl, [[0, GOAL_SPEED], [NB, GOAL_SPEED]], 'sig', 2, { dash: [7, 5] }); tagText(S, S.l(`meta ≥ ${GOAL_SPEED}`, `goal ≥ ${GOAL_SPEED}`), pl.r.x + pl.r.w - 6 * u, pl.Y(GOAL_SPEED) + 10 * u, { align: 'right', base: 'top', t: 'sig', size: 12 }); };
  metaC(p1); metaS(p2);
  if (!hurts) {
    maxUnfit(S, p1, cv.maxU); maxUnfit(S, p2, cv.maxU);
    line2(S, p1, feas(cv, (b) => at(cv.cost, b)), 'dat', 3); line2(S, p2, feas(cv, (b) => at(cv.per, b)), 'sig', 3);
    // marcador
    const bb = Math.min(B, NB);
    [[p1, s.costPerM, 'dat'], [p2, s.perUser, 'sig']].forEach(([pl, v, t]) => {
      const P = pl as Plot, x = P.X(bb), y = P.Y(clamp(v as number, 0, P.o.yr[1]));
      d.line(x, P.r.y + P.r.h, x, y, p.ink, 1.3, [3, 3]);
      d.circle(x, y, 6.5 * u, { fill: s.fits ? tone(S, t as 'dat').c : p.surface, stroke: s.fits ? p.stage : tone(S, 'err').c, lw: 2.2 });
    });
    // lecturas
    const n = 3, cg = 8 * u, cwid = (A.w - cg * (n - 1)) / n, y = A.y + A.h - chipH;
    const okC = s.fits && s.costPerM <= GOAL_COST, okS = s.fits && s.perUser >= GOAL_SPEED;
    const rows: [string, string, boolean, 'dat' | 'sig' | 'w'][] = [
      [S.l('costo por millón', 'cost per million'), s.fits ? usd(s.costPerM, l) : '—', okC, 'dat'],
      [S.l('por persona', 'per person'), s.fits ? `${nf(s.perUser, 0, l)} t/s` : '—', okS, 'sig'],
      [S.l('memoria', 'memory'), s.fits ? `${gb(s.memUsed, l, 0)} / 80` : S.l('no cabe', 'no fit'), s.fits, 'w'],
    ];
    rows.forEach(([lab, v, ok, t], i) => {
      const r = { x: A.x + i * (cwid + cg), y, w: cwid, h: chipH };
      chip(S, r, S.portrait && i === 0 ? S.l('US$/millón', 'US$/million') : lab, v, ok ? t : 'err', { vsize: S.portrait ? 14 : 17, hot: ok ? 0.6 : 0 });
      mark(S, r.x + r.w - 12 * u, r.y + 12 * u, ok, { r: 6 });
    });
  } else {
    const a = S.reveal('context-hurts', 0.2, 0.7);
    show(S, a, () => {
      maxUnfit(S, p1, c32.maxU, 0.6); maxUnfit(S, p2, c32.maxU, 0.6);
      line2(S, p1, feas(c8, (b) => at(c8.cost, b)), 'dat', 3); line2(S, p2, feas(c8, (b) => at(c8.per, b)), 'sig', 3);
      line2(S, p1, feas(c32, (b) => at(c32.cost, b)), 'w', 3, { dash: [8, 4] }); line2(S, p2, feas(c32, (b) => at(c32.per, b)), 'w', 3, { dash: [8, 4] });
      const best = Math.min(...c32.cost.slice(0, c32.maxU));
      tagText(S, S.l('8 000 tokens', '8,000 tokens'), p1.X(40), p1.Y(at(c8.cost, 40)) - 14 * u, { t: 'dat', size: 12, align: 'center' });
      tagText(S, S.l('32 000 tokens', '32,000 tokens'), p1.X(8), p1.Y(at(c32.cost, 8)) - 14 * u, { t: 'w', size: 12, align: 'left' });
      tagText(S, S.l('8 000 tokens', '8,000 tokens'), p2.X(52), p2.Y(at(c8.per, 48)) - 16 * u, { t: 'sig', size: 12, align: 'center' });
      tagText(S, S.l('32 000 tokens', '32,000 tokens'), p2.X(14), p2.Y(at(c32.per, 14)) - 12 * u, { t: 'w', size: 12, align: 'left' });
      show(S, S.reveal('context-hurts', 2.4, 0.6), () => pill(S, S.l(`mejor caso con 32 000: ${usd(best, 'es')} por millón`, `best case at 32,000: ${usd(best, 'en')} per million`), p1.r.x + p1.r.w / 2, p1.r.y + p1.r.h * 0.5, { t: 'w' }));
    });
  }
  void wt; void fitText; void nf; void secs; void sig;
}
function maxUnfit(S: Frame, pl: Plot, maxU: number, a = 1) {
  const { d } = S, er = tone(S, 'err');
  d.withAlpha(a, () => { d.dither(pl.X(maxU), pl.r.y, pl.r.x + pl.r.w - pl.X(maxU), pl.r.h, er.c, 0.2, 2); d.line(pl.X(maxU), pl.r.y, pl.X(maxU), pl.r.y + pl.r.h, er.c, 1.8, [5, 4]); });
}
