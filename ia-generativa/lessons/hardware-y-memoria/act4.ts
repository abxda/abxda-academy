// Acto 4 · Repartir un modelo entre GPU: datos, pipeline y tensor; cómo se combinan (Llama 3.1 405B) y el turno 2.
import { alpha, clamp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SPLIT, nf, splitOf, gbText } from './model';
import { FS, check, chip, fitText, op, phases, tagText } from './ui';

type R3 = ReturnType<typeof regions>;

export function drawAct4(S: Frame, R: R3) {
  const [a0, a1, a2, a3, a4, a5] = phases(S, ['no-fit', 'data-par', 'pipe-par', 'tensor-par', 'combine', 'try-split']);
  const A = R.all;
  if (a0 > 0.005) S.d.withAlpha(a0, () => drawNoFit(S, A));
  if (a1 > 0.005) S.d.withAlpha(a1, () => drawData(S, A));
  if (a2 > 0.005) S.d.withAlpha(a2, () => drawPipe(S, A));
  if (a3 > 0.005) S.d.withAlpha(a3, () => drawTensor(S, A));
  if (a4 > 0.005) S.d.withAlpha(a4, () => drawCombine(S, A));
  if (a5 > 0.005) S.d.withAlpha(a5, () => drawSplit(S, R));
}

// ── pieza común: una caja de GPU ─────────────────────────────────────────────
function gpuBox(S: Frame, r: Rect, label: string, o: { a?: number; dash?: boolean; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u;
  d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.ink, 0.04 + 0.08 * (o.hot ?? 0)), stroke: p.ink2, lw: 1.6, r: 4, dash: o.dash ? [5, 3] : undefined, a: o.a });
  d.text(label, r.x + r.w / 2, r.y - 4 * u, { size: FS(S, 12.5), weight: 800, color: p.ink2, align: 'center', base: 'bottom', a: o.a });
}
/** Capas del modelo como barras finas apiladas; `lo..hi` son las que esta GPU guarda (las demás, apagadas). */
function layers(S: Frame, r: Rect, n: number, lo: number, hi: number, t: 'w' | 'lat' = 'w', a = 1) {
  const { d } = S, c = tone(S, t), gap = Math.max(1.2, r.h / n * 0.2), h = r.h / n - gap;
  for (let i = 0; i < n; i++) { const on = i >= lo && i < hi; d.rect(r.x, r.y + i * (h + gap), r.w, h, { fill: on ? alpha(c.c, 0.8) : alpha(c.c, 0.07), stroke: on ? c.c : alpha(c.c, 0.25), lw: 1, a }); }
}

// ═════════════════════════════════════════════════════════════════════════
// no cabe: 810 GB de Llama 3.1 405B en BF16 frente a un servidor de 8 H100 (640 GB)
// ═════════════════════════════════════════════════════════════════════════
function drawNoFit(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, wt = tone(S, 'w'), er = tone(S, 'err');
  const AX = 1300, X = (g: number) => all.x + (g / AX) * all.w;
  const y0 = all.y + 34 * u, bh = (port ? 40 : 52) * u;
  d.withAlpha(S.reveal('no-fit', 0, 0.6), () => d.text(S.l('Llama 3.1 405B en BF16: 405 mil M × 2 B', 'Llama 3.1 405B in BF16: 405B × 2 B'), all.x, all.y + 2 * u, { size: FS(S, 14.5), weight: 800, color: p.ink, base: 'top', w: all.w }));
  // GPU: 8 solidas (un servidor) y 8 punteadas (el segundo)
  const aSrv = S.reveal('no-fit', 0.5, 0.7), aSrv2 = S.reveal('no-fit', 3.4, 0.7);
  d.withAlpha(1, () => {
    for (let k = 0; k < 16; k++) {
      const second = k >= 8, a = second ? aSrv2 : aSrv;
      if (a <= 0) continue;
      const x = X(80 * k) + 1, w = X(80) - X(0) - 2;
      d.rect(x, y0, w, bh, { fill: alpha(p.ink, second ? 0.02 : 0.05), stroke: p.ink2, lw: 1.5, dash: second ? [4, 3] : undefined, r: 2, a });
      if (!port || k % 2 === 0) d.text('80', x + w / 2, y0 + bh / 2, { size: FS(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'center', base: 'middle', a });
    }
  });
  tagText(S, S.l('8 × H100 = 640 GB (un servidor)', '8 × H100 = 640 GB (one server)'), X(0), y0 + bh + 18 * u, { align: 'left', size: 13, a: aSrv });
  tagText(S, S.l('16 × H100 = 1 280 GB (dos)', '16 × H100 = 1,280 GB (two)'), all.x + all.w, y0 + bh + 18 * u + (port ? 20 * u : 0), { align: 'right', size: 13, a: aSrv2 });
  // el modelo
  const yM = y0 + bh + 54 * u, aM = S.reveal('no-fit', 1.4, 1.2);
  d.withAlpha(aM, () => {
    const w1 = (X(Math.min(640, 810 * aM)) - X(0)), w2 = Math.max(0, X(810 * aM) - X(640));
    d.rect(X(0), yM, w1, bh, { fill: alpha(wt.c, 0.75), stroke: wt.c, lw: 1.5 });
    if (w2 > 0) { d.rect(X(640), yM, w2, bh, { fill: alpha(er.c, 0.45), stroke: er.c, lw: 1.6, dash: [5, 3] }); d.dither(X(640), yM, w2, bh, er.c, 0.4, 3); }
    d.text('810 GB', X(0) + 10 * u, yM + bh / 2, { size: FS(S, 17), weight: 800, font: 'mono', color: p.stage, base: 'middle' });
  });
  const aO = S.reveal('no-fit', 2.6, 0.7);
  tagText(S, S.l('+170 GB no caben', '+170 GB do not fit'), X(640) + 8 * u, yM + bh + 18 * u, { t: 'err', align: 'left', size: 13, a: aO });
  d.withAlpha(S.reveal('no-fit', 4.2, 0.7), () => d.text(S.l('Meta, en BF16: 16 GPU repartidas en dos servidores (Llama 3, §6.1)', 'Meta, in BF16: 16 GPUs across two servers (Llama 3, §6.1)'), all.x, all.y + all.h, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', w: all.w }));
  void clamp;
}

// ═════════════════════════════════════════════════════════════════════════
// paralelismo de datos: copia completa en cada GPU, lotes distintos, gradientes promediados
// ═════════════════════════════════════════════════════════════════════════
function drawData(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, n = 4, gap = 14 * u, w = (all.w - gap * (n - 1)) / n, dat = tone(S, 'dat'), er = tone(S, 'err');
  const bTop = all.y + 20 * u, bH = Math.min(46 * u, all.h * 0.16), gTop = bTop + bH + 24 * u, gH = all.h - (gTop - all.y) - 78 * u;
  d.withAlpha(S.reveal('data-par', 0, 0.6), () => d.text(S.l('Paralelismo de datos', 'Data parallelism'), all.x, all.y + 2 * u, { size: FS(S, 15), weight: 800, color: p.ink, base: 'top' }));
  for (let k = 0; k < n; k++) {
    const x = all.x + k * (w + gap), a = S.reveal('data-par', 0.2 + k * 0.12, 0.5);
    d.withAlpha(a, () => {
      // el lote: una cuadrícula de datos distinta en cada GPU
      const cs = Math.min(bH / 3, w / 4.5);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) { const on = ((i * 5 + j * 3 + k * 7) % 4) < 2; d.rect(x + (w - cs * 4) / 2 + i * cs, bTop + j * cs, cs - 2, cs - 2, { fill: alpha(dat.c, on ? 0.75 : 0.25), stroke: dat.c, lw: 1 }); }
      d.text(S.l(`lote ${k + 1}`, `batch ${k + 1}`), x + w / 2, bTop + bH + 6 * u, { size: FS(S, 12), weight: 700, color: dat.ink, align: 'center', base: 'top' });
      d.line(x + w / 2, bTop + bH + 22 * u, x + w / 2, gTop - 2 * u, p.mute, 1.4);
      gpuBox(S, { x, y: gTop, w, h: gH }, `GPU ${k + 1}`);
      layers(S, { x: x + 8 * u, y: gTop + 8 * u, w: w - 16 * u, h: gH - 16 * u }, 8, 0, 8);
    });
  }
  // gradientes que se promedian
  const aG = S.reveal('data-par', 1.4, 0.7), by = gTop + gH + 22 * u, x0 = all.x + w / 2, x1 = all.x + (n - 1) * (w + gap) + w / 2;
  d.withAlpha(aG, () => {
    for (let k = 0; k < n; k++) d.line(all.x + k * (w + gap) + w / 2, gTop + gH, all.x + k * (w + gap) + w / 2, by, er.c, 1.6);
    d.line(x0, by, x1, by, er.c, 2.4);
    for (let k = 0; k < 3; k++) { const t = ((S.clock * 0.5 + k / 3) % 1), px = x0 + (x1 - x0) * t; d.circle(px, by, 4 * u, { fill: er.c, stroke: p.stage, lw: 1.2 }); }
    tagText(S, S.l('se promedian los gradientes', 'the gradients are averaged'), (x0 + x1) / 2, by + 20 * u, { t: 'err', align: 'center', size: 13 });
    tagText(S, S.l('cada GPU guarda el modelo completo', 'every GPU holds the whole model'), (x0 + x1) / 2, by + 42 * u, { align: 'center', size: 13, w: all.w });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// paralelismo de pipeline: el modelo por capas y los lotes como línea de ensamblaje (con su burbuja)
// ═════════════════════════════════════════════════════════════════════════
function drawPipe(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, n = 4, gap = 22 * u, w = (all.w - gap * (n - 1)) / n, dat = tone(S, 'dat');
  const top = all.y + 22 * u, gH = Math.min(all.h * 0.34, 120 * u);
  d.withAlpha(S.reveal('pipe-par', 0, 0.6), () => d.text(S.l('Paralelismo de pipeline', 'Pipeline parallelism'), all.x, all.y + 2 * u, { size: FS(S, 15), weight: 800, color: p.ink, base: 'top' }));
  for (let k = 0; k < n; k++) {
    const x = all.x + k * (w + gap), a = S.reveal('pipe-par', 0.2 + k * 0.15, 0.5);
    d.withAlpha(a, () => {
      gpuBox(S, { x, y: top, w, h: gH }, `GPU ${k + 1}`);
      layers(S, { x: x + 8 * u, y: top + 8 * u, w: w - 16 * u, h: gH - 16 * u }, 8, k * 2, k * 2 + 2);
      if (k < n - 1) d.arrow(x + w + 2 * u, top + gH / 2, x + w + gap - 2 * u, top + gH / 2, p.ink2, 2, 8);
    });
  }
  tagText(S, S.l('cada GPU, un tramo de capas', 'each GPU, a stretch of layers'), all.x + all.w / 2, top + gH + 18 * u, { align: 'center', size: 13, a: S.reveal('pipe-par', 0.9, 0.6) });
  // diagrama de tiempo: M = 4 micro-lotes por 4 etapas → 7 columnas; las vacías son la burbuja
  const gy = top + gH + 46 * u, rows = n, M = 4, cols = M + n - 1, lab = (port ? 42 : 56) * u;
  const cw = (all.w - lab) / cols, ch = Math.min(22 * u, (all.h - (gy - all.y) - 34 * u) / rows);
  const prog = S.at('pipe-par', 1.5, 6.5, 'lin') * cols;
  d.withAlpha(S.reveal('pipe-par', 1.3, 0.6), () => d.text(S.l('tiempo →', 'time →'), all.x + all.w, gy - 14 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'middle' }));
  for (let r = 0; r < rows; r++) {
    d.withAlpha(S.reveal('pipe-par', 1.3, 0.6), () => d.text(`GPU ${r + 1}`, all.x, gy + r * ch + ch / 2, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' }));
    for (let c = 0; c < cols; c++) {
      const m = c - r, work = m >= 0 && m < M, shown = clamp(prog - c);
      if (shown <= 0) continue;
      const x = all.x + lab + c * cw;
      if (work) { d.rect(x + 1, gy + r * ch + 1, cw - 2, ch - 2, { fill: alpha(dat.c, 0.75), stroke: dat.c, lw: 1, a: shown }); d.text(String(m + 1), x + cw / 2, gy + r * ch + ch / 2, { size: FS(S, 12), weight: 800, font: 'mono', color: p.stage, align: 'center', base: 'middle', a: shown }); }
      else d.rect(x + 1, gy + r * ch + 1, cw - 2, ch - 2, { stroke: tone(S, 'err').c, lw: 1.2, dash: [3, 3], a: shown });
    }
  }
  d.withAlpha(S.reveal('pipe-par', 6.4, 0.6), () => {
    const y = gy + rows * ch + 16 * u;
    d.rect(all.x, y - 7 * u, 14 * u, 14 * u, { stroke: tone(S, 'err').c, lw: 1.4, dash: [3, 3] });
    d.text(S.l('burbuja: la GPU espera (3 de cada 7 casillas con 4 micro-lotes)', 'bubble: the GPU waits (3 of 7 slots with 4 micro-batches)'), all.x + 20 * u, y, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'middle', w: all.w - 20 * u });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// paralelismo de tensor: cada matriz cortada en trozos; todas calculan a la vez y se combinan por NVLink
// ═════════════════════════════════════════════════════════════════════════
function drawTensor(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, n = 4, wt = tone(S, 'w'), sig = tone(S, 'sig'), dat = tone(S, 'dat');
  d.withAlpha(S.reveal('tensor-par', 0, 0.6), () => d.text(S.l('Paralelismo de tensor: una capa, cuatro GPU', 'Tensor parallelism: one layer, four GPUs'), all.x, all.y + 2 * u, { size: FS(S, 15), weight: 800, color: p.ink, base: 'top', w: all.w }));
  const top = all.y + 50 * u, vH = 30 * u, mH = Math.min(all.h * 0.34, 130 * u), gap = 8 * u, mw = all.w * 0.78, mx = all.x + (all.w - mw) / 2, stripe = (mw - gap * (n - 1)) / n;
  // entrada (vector) arriba
  const aIn = S.reveal('tensor-par', 0.3, 0.6);
  d.withAlpha(aIn, () => { for (let i = 0; i < 12; i++) d.rect(mx + (i * mw) / 12, top - 34 * u, mw / 12 - 2, 14 * u, { fill: alpha(sig.c, 0.2 + 0.6 * ((i * 7) % 5) / 4), stroke: sig.c, lw: 1 }); tagText(S, S.l('entrada', 'input'), mx - 6 * u, top - 27 * u, { t: 'sig', align: 'right', size: 12.5 }); });
  for (let k = 0; k < n; k++) {
    const x = mx + k * (stripe + gap), a = S.reveal('tensor-par', 0.7 + k * 0.25, 0.5);
    d.withAlpha(a, () => {
      d.line(x + stripe / 2, top - 18 * u, x + stripe / 2, top - 2 * u, sig.c, 1.5);
      const cols = 3, rows = 6, cw = stripe / cols, ch = mH / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d.rect(x + i * cw, top + j * ch, cw - 1.5, ch - 1.5, { fill: alpha(wt.c, 0.25 + 0.5 * (((i + j * 3 + k * 2) % 4) / 3)), stroke: alpha(wt.c, 0.7), lw: 1 });
      d.rect(x - 2, top - 2, stripe + 4, mH + 4, { stroke: p.ink2, lw: 1.6, r: 3 });
      d.text(`GPU ${k + 1}`, x + stripe / 2, top + mH + 14 * u, { size: FS(S, 12.5), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      // resultado parcial
      d.line(x + stripe / 2, top + mH + 26 * u, x + stripe / 2, top + mH + 44 * u, dat.c, 1.6);
    });
  }
  const yb = top + mH + 44 * u, aC = S.reveal('tensor-par', 2.2, 0.8);
  d.withAlpha(aC, () => {
    d.line(mx + stripe / 2, yb, mx + mw - stripe / 2, yb, dat.c, 2.4);
    for (let k = 0; k < 3; k++) { const t = ((S.clock * 0.6 + k / 3) % 1); d.circle(mx + stripe / 2 + (mw - stripe) * t, yb, 4 * u, { fill: dat.c, stroke: p.stage, lw: 1.2 }); }
    tagText(S, S.l('se combinan en cada capa', 'combined in every layer'), mx + mw / 2, yb + 18 * u, { t: 'dat', align: 'center', size: 13 });
  });
  d.withAlpha(S.reveal('tensor-par', 3.4, 0.7), () => {
    const y = yb + 42 * u;
    d.rect(mx + mw / 2 - 150 * u, y - 14 * u, 300 * u, 28 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 3 });
    d.text(S.l('NVLink: 900 GB/s dentro del servidor', 'NVLink: 900 GB/s inside the server'), mx + mw / 2, y, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle', w: 290 * u });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// la cuadrícula de una réplica: tensor (columnas) × pipeline (filas); las réplicas de datos, detrás
// ═════════════════════════════════════════════════════════════════════════
interface GridO { tp: number; pp: number; dp: number; fill?: number; over?: boolean; a?: number; cellMax?: number; dpText?: string }
function replicaGrid(S: Frame, r: Rect, o: GridO) {
  const { d, pal: p } = S, u = S.u, g = Math.max(1.5, 2 * u);
  const cs = Math.min((r.w - 14 * u) / o.tp, (r.h - 14 * u) / o.pp, (o.cellMax ?? 56) * u), W = cs * o.tp, H = cs * o.pp, x = r.x + (r.w - 14 * u - W) / 2 + 14 * u, y = r.y + (r.h - 14 * u - H) / 2 + 14 * u;
  const ghosts = o.dp > 1 ? Math.min(3, Math.ceil(Math.log2(o.dp))) : 0;
  for (let k = ghosts; k >= 1; k--) d.rect(x - k * 5 * u, y - k * 5 * u, W, H, { fill: p.stage, stroke: alpha(p.ink2, 0.5), lw: 1.4, a: o.a });
  const c = o.over ? tone(S, 'err') : tone(S, 'dat');
  for (let j = 0; j < o.pp; j++) for (let i = 0; i < o.tp; i++) {
    const cx = x + i * cs, cy = y + j * cs, f = clamp(o.fill ?? 0);
    d.rect(cx + g / 2, cy + g / 2, cs - g, cs - g, { fill: p.surface, stroke: p.ink2, lw: 1.2, a: o.a });
    d.rect(cx + g / 2, cy + g / 2 + (cs - g) * (1 - f), cs - g, (cs - g) * f, { fill: alpha(c.c, 0.75), a: o.a });
    if (o.over) d.dither(cx + g / 2, cy + g / 2, cs - g, cs - g, c.c, 0.3, 2);
  }
  return { x, y, W, H, cs };
}

// ═════════════════════════════════════════════════════════════════════════
// combinar: 8 × 16 × 128 = 16 384 GPU (Llama 3.1 405B, tabla 4)
// ═════════════════════════════════════════════════════════════════════════
function drawCombine(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const aG = S.reveal('combine', 0, 0.7);
  const gr: Rect = port ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.5 } : { x: all.x, y: all.y, w: all.w * 0.5, h: all.h };
  const cr: Rect = port ? { x: all.x, y: all.y + all.h * 0.54, w: all.w, h: all.h * 0.46 } : { x: all.x + all.w * 0.54, y: all.y, w: all.w * 0.46, h: all.h };
  d.withAlpha(aG, () => {
    const g = replicaGrid(S, gr, { tp: 8, pp: 16, dp: 128, fill: 0.5, cellMax: 30 });
    tagText(S, S.l('tensor: 8 →', 'tensor: 8 →'), g.x + g.W / 2, g.y - 10 * u, { align: 'center', size: 12.5, t: 'dat' });
    tagText(S, S.l('pipeline: 16 ↓', 'pipeline: 16 ↓'), g.x - 6 * u, g.y + g.H / 2, { align: 'right', size: 12.5, t: 'dat', w: 70 * u });
    d.text(S.l('una réplica = 128 GPU', 'one replica = 128 GPUs'), g.x + g.W / 2, g.y + g.H + 14 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'center', base: 'top' });
  });
  const items: [string, string, 'w' | 'lat' | 'dat' | 'ink', number][] = [[S.l('tensor', 'tensor'), '8', 'w', 0.5], [S.l('pipeline', 'pipeline'), '16', 'lat', 1.1], [S.l('datos (réplicas)', 'data (replicas)'), '128', 'dat', 1.7], [S.l('GPU en total', 'GPUs in total'), nf(8 * 16 * 128, 0, S.lang), 'ink', 2.5]];
  const ch = Math.min(46 * u, (cr.h - 3 * 12 * u) / 4), opW = 0;
  items.forEach(([l, v, t, at], i) => {
    const y = cr.y + (cr.h - (4 * ch + 3 * 12 * u)) / 2 + i * (ch + 12 * u), a = S.reveal('combine', at, 0.6);
    chip(S, { x: cr.x, y, w: cr.w, h: ch }, l, v, t as 'w', { a, vsize: 19, hot: i === 3 ? 0.4 : 0 });
    if (i < 3 && a > 0) op(S, cr.x + cr.w / 2, y + ch + 6 * u, i < 2 ? '×' : '=', a);
  });
  void opW; void fitText;
}

// ═════════════════════════════════════════════════════════════════════════
// turno 2: reparte el entrenamiento de un modelo de 70 mil M
// ═════════════════════════════════════════════════════════════════════════
export function splitParams(S: Frame) {
  const tp = 2 ** (S.p.tp ?? 0), pp = 2 ** (S.p.pp ?? 0), dp = 2 ** (S.p.dp ?? 0);
  return { tp, pp, dp, out: splitOf(tp, pp, dp) };
}

function drawSplit(S: Frame, R: R3) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const { tp, pp, dp, out } = splitParams(S);
  const A = R.all, aBody = S.reveal('try-split', 0, 0.6);
  const gr: Rect = port ? { x: A.x, y: A.y + 20 * u, w: A.w, h: A.h * 0.5 - 20 * u } : { x: A.x, y: A.y + 24 * u, w: A.w * 0.52, h: A.h - 24 * u };
  const cr: Rect = port ? { x: A.x, y: A.y + A.h * 0.5 + 6 * u, w: A.w, h: A.h * 0.5 - 6 * u } : { x: A.x + A.w * 0.56, y: A.y, w: A.w * 0.44, h: A.h };
  d.withAlpha(aBody, () => {
    d.text(S.l('Entrenar un modelo de 70 mil M (16 B por parámetro)', 'Training a 70B model (16 B per parameter)'), A.x, A.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', w: A.w });
    replicaGrid(S, gr, { tp, pp, dp, fill: out.perGpu / SPLIT.gpuMem, over: !out.fits, cellMax: 48 });
    tagText(S, S.l(`tensor ${tp} × pipeline ${pp}`, `tensor ${tp} × pipeline ${pp}`), gr.x + gr.w / 2, gr.y + gr.h + 6 * u, { align: 'center', size: 12.5, base: 'top' });
  });
  const chs: [string, string, 'w' | 'err' | 'dat' | 'ink', number][] = [
    [S.l('estados por GPU', 'states per GPU'), `${nf(out.perGpu, 1, S.lang)} GB`, out.fits ? 'dat' : 'err', out.fits ? 0 : 0.5],
    [S.l('GPU en total', 'GPUs in total'), nf(out.gpus, 0, S.lang), 'ink', 0],
    [S.l('burbuja del pipeline', 'pipeline bubble'), `${nf(out.bubble * 100, 0, S.lang)} %`, out.bubble > 0.25 ? 'err' : 'w', 0],
  ];
  const cols = port ? 3 : 1, gap = 10 * u, ch = port ? 44 * u : Math.min(50 * u, (cr.h - 120 * u) / 3), cw = (cr.w - gap * (cols - 1)) / cols;
  d.withAlpha(aBody, () => {
    chs.forEach(([l, v, t, hot], i) => chip(S, { x: cr.x + (port ? i * (cw + gap) : 0), y: cr.y + (port ? 0 : i * (ch + gap)), w: cw, h: ch }, l, v, t, { vsize: port ? 15 : 19, hot }));
    const y0 = cr.y + (port ? ch + 14 * u : 3 * (ch + gap) + 6 * u);
    d.text(S.l(`Límite por GPU: ${nf(out.budget, 0, S.lang)} GB (80 GB menos un 25 % de margen, supuesto)`, `Limit per GPU: ${nf(out.budget, 0, S.lang)} GB (80 GB minus a 25% margin, assumption)`), cr.x, y0, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: cr.w });
    const st = S.st.splitGate ?? { fit: false, dp: false };
    const yc = y0 + (port ? 36 : 40) * u;
    check(S, cr.x, yc, !!st.fit, S.l('cabe: estados ≤ límite con tensor ≤ 8', 'fits: states ≤ limit with tensor ≤ 8'), cr.w, 'dat');
    check(S, cr.x, yc + 24 * u, !!st.dp, S.l('añade réplicas de datos (≥ 2)', 'add data replicas (≥ 2)'), cr.w, 'dat');
  });
}

/** Turno 2: que quepa (tensor ≤ 8) y, después, al menos dos réplicas de datos. */
export function updateSplit(S: Frame): boolean {
  const st = S.st.splitGate ?? (S.st.splitGate = { fit: false, dp: false });
  if (!S.between('try-split', 'after-split')) return false;
  const { tp, dp, out } = splitParams(S);
  st.fit = out.fits && tp <= SPLIT.maxTP;
  st.dp = st.fit && dp >= 2;
  return st.fit && st.dp;
}
void gbText;
