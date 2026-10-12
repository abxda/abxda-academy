// Vista del ancho de banda y los lotes: memoria → tubo → cálculo → personas, y abajo la cuenta o las tres cifras.
// Segmentos: read-all · bw-recall · bw-math · bw-idle · batch-idea · latency · throughput · batch-demo · cost-m · try-batch · tradeoff.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { H100, PRICE_GPU_HOUR, W_BYTES, kvBytes, turn } from './model';
import { area, chip, chipW, fitText, fits, fr, fz, gb, hatch, hbar, int, para, paraH, sig, tight, usd } from './ui';

export const BATCH_CTX = 8000;

function layout(S: Frame) {
  const u = S.u, R = area(S), P = S.portrait, T = tight(S);
  const topH = P ? R.h * (T ? 0.44 : 0.46) : R.h * (T ? 0.44 : 0.47);
  let mem: Rect, cpu: Rect, people: Rect, pipe: [number, number, number, number];
  if (!P) {
    const bh = Math.min(topH * 0.72, 150 * u), cy = R.y + topH / 2;
    mem = { x: R.x, y: cy - bh / 2, w: R.w * 0.34, h: bh };
    cpu = { x: R.x + R.w * 0.55, y: cy - bh / 2, w: R.w * 0.2, h: bh };
    people = { x: R.x + R.w * 0.78, y: R.y + 4 * u, w: R.w * 0.22, h: topH - 8 * u };
    pipe = [mem.x + mem.w, cy, cpu.x, cy];
  } else {
    const mh = Math.min(topH * 0.36, 78 * u);
    mem = { x: R.x, y: R.y, w: R.w, h: mh };
    const ch = Math.min(topH * 0.34, 70 * u), cyy = R.y + topH - ch;
    cpu = { x: R.x, y: cyy, w: R.w * 0.42, h: ch };
    people = { x: R.x + R.w * 0.48, y: cyy - 10 * u, w: R.w * 0.52, h: ch + 10 * u };
    pipe = [cpu.x + cpu.w / 2, mem.y + mem.h, cpu.x + cpu.w / 2, cpu.y];
  }
  const bottom: Rect = { x: R.x, y: R.y + topH + (P ? 14 : 10) * u, w: R.w, h: R.h - topH - (P ? 14 : 10) * u };
  return { R, mem, cpu, people, pipe, bottom };
}

/** Personas que se dibujan en el lote en este momento (el valor animado se calcula en update y se guarda en S.st). */
const batchOf = (S: Frame) => (S.on('batch-idea') ? (S.st.bShown ?? 1) : 1);

export function drawSpeed(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S), P = S.portrait;
  const dat = tone(S, 'dat'), w = tone(S, 'w'), lat = tone(S, 'lat'), sg = tone(S, 'sig');
  const inBatch = S.on('batch-idea');
  const B = batchOf(S), Bi = Math.max(1, Math.round(B));
  const ctx = inBatch ? BATCH_CTX : 0;
  // ── memoria ──
  const m = L.mem;
  const memA = fr(S, 'read-all', 0, 0.12);
  d.withAlpha(memA, () => {
    d.rect(m.x, m.y, m.w, m.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 5 });
    const tH = fz(S, 13) * u * 1.3;
    fitText(S, S.l('memoria de la GPU (80 GB)', 'GPU memory (80 GB)'), m.x + 8 * u, m.y + 6 * u, m.w - 16 * u, { size: 13, weight: 800, color: p.ink, base: 'top' });
    const bar: Rect = { x: m.x + 8 * u, y: m.y + 10 * u + tH, w: m.w - 16 * u, h: Math.max(14 * u, m.h - tH - 20 * u) };
    d.rect(bar.x, bar.y, bar.w, bar.h, { fill: p.surface2, r: 2 });
    const X = (b: number) => bar.x + bar.w * clamp(b / H100.mem);
    const wx = X(W_BYTES);
    d.rect(bar.x, bar.y, wx - bar.x, bar.h, { fill: alpha(w.c, 0.85), r: 2 });
    // el rótulo de los pesos va dentro del bloque si cabe; si no, debajo de la barra
    const wl = S.l('pesos 16 GB', 'weights 16 GB');
    if (fits(S, wl, wx - bar.x - 6 * u, { weight: 800 })) fitText(S, wl, (bar.x + wx) / 2, bar.y + bar.h / 2, wx - bar.x - 4 * u, { size: 12, weight: 800, color: p.stage, align: 'center', base: 'middle' });
    else if (bar.y + bar.h + fz(S, 12) * u * 1.3 < m.y + m.h + 2 * u) fitText(S, wl, bar.x, bar.y + bar.h + 2 * u, bar.w, { size: 12, weight: 800, color: w.ink, base: 'top' });
    else fitText(S, wl, wx + 4 * u, bar.y + bar.h / 2, bar.x + bar.w - wx - 6 * u, { size: 12, weight: 800, color: w.ink, base: 'middle', a: inBatch ? 0 : 1 });
    // en los lotes: una caché por persona, que también se lee en cada vuelta
    if (inBatch) {
      const per = kvBytes(ctx), hl = S.on('tradeoff') ? fr(S, 'tradeoff', 0.08, 0.2) * (0.5 + 0.5 * Math.sin(S.clock * 5)) : 0;
      for (let i = 0; i < Bi; i++) {
        const x1 = X(W_BYTES + i * per), x2 = X(W_BYTES + (i + 1) * per);
        d.rect(x1 + 0.5, bar.y + 1, Math.max(1, x2 - x1 - 1), bar.h - 2, { fill: alpha(lat.c, 0.65 + 0.3 * hl) });
      }
      if (S.on('tradeoff')) {
        const tl = S.l('+ una caché por persona', '+ one cache per person');
        fitText(S, tl, m.x + m.w, m.y + m.h + 4 * u, m.w, { size: 12.5, weight: 800, color: lat.ink, align: 'right', base: 'top', a: fr(S, 'tradeoff', 0.1, 0.2) });
      }
    }
  });
  // ── tubo: el ancho de banda ──
  const [x1, y1, x2, y2] = L.pipe, vert = P;
  const pw = 12 * u;
  d.withAlpha(memA, () => {
    if (!vert) { d.line(x1, y1 - pw / 2, x2, y2 - pw / 2, p.lineStrong, 1.5); d.line(x1, y1 + pw / 2, x2, y2 + pw / 2, p.lineStrong, 1.5); }
    else { d.line(x1 - pw / 2, y1, x2 - pw / 2, y2, p.lineStrong, 1.5); d.line(x1 + pw / 2, y1, x2 + pw / 2, y2, p.lineStrong, 1.5); }
  });
  // un paquete de 16 GB que viaja en read-all; después, un flujo continuo
  if (S.between('read-all', 'bw-recall')) {
    const k = fr(S, 'read-all', 0.25, 0.6, 'io');
    if (k > 0 && k < 1) {
      const px = x1 + (x2 - x1) * k, py = y1 + (y2 - y1) * k;
      chip(S, '16 GB', px, py, 'w', { size: 12, fill: 0.9 });
    }
  } else if (S.on('bw-recall')) {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const k = ((S.t * 0.6 + i / n) % 1);
      const px = x1 + (x2 - x1) * k, py = y1 + (y2 - y1) * k;
      d.rect(px - 5 * u, py - 3.5 * u, 10 * u, 7 * u, { fill: alpha(w.c, 0.8), r: 1.5 });
    }
  }
  const bwA = fr(S, 'bw-recall', 0.3, 0.45);
  if (bwA > 0.01) {
    const txt = S.l('ancho de banda: 3.35 TB/s', 'bandwidth: 3.35 TB/s');
    if (!vert) chip(S, txt, (x1 + x2) / 2, y1 - pw / 2 - 16 * u, 'w', { a: bwA, maxW: Math.max(x2 - x1 + 20 * u, 80 * u), size: 12.5 });
    else chip(S, txt, x1 + pw / 2 + 8 * u, (y1 + y2) / 2, 'w', { a: bwA, align: 'left', maxW: L.R.w * 0.55, size: 12.5 });
  }
  // ── cálculo ──
  const c = L.cpu;
  d.withAlpha(memA, () => {
    d.rect(c.x, c.y, c.w, c.h, { fill: alpha(dat.c, 0.08), stroke: dat.c, lw: 1.5, r: 5 });
    fitText(S, S.l('cálculo', 'compute'), c.x + c.w / 2, c.y + 6 * u, c.w - 12 * u, { size: 13, weight: 800, color: dat.ink, align: 'center', base: 'top' });
    const idle = S.on('bw-idle') ? fr(S, 'bw-idle', 0.15, 0.3) * (1 - (S.on('batch-idea') ? fr(S, 'batch-idea', 0, 0.15) : 0)) : 0;
    if (idle > 0.01) d.withAlpha(idle, () => {
      const bar: Rect = { x: c.x + 8 * u, y: c.y + c.h * 0.5, w: c.w - 16 * u, h: Math.max(10 * u, c.h * 0.18) };
      d.rect(bar.x, bar.y, bar.w, bar.h, { fill: p.surface2 });
      hatch(S, bar, alpha(p.mute, 0.6), 5, 1);
      d.rect(bar.x, bar.y, Math.max(2, bar.w * 0.0034), bar.h, { fill: dat.c });
      fitText(S, S.l('en uso: 0.3 %', 'in use: 0.3%'), c.x + c.w / 2, bar.y + bar.h + 4 * u, c.w - 8 * u, { size: 12, weight: 700, color: dat.ink, align: 'center', base: 'top' });
    });
  });
  // ── salida: un token por vuelta, o uno por persona ──
  const pe = L.people;
  if (!inBatch) {
    const ta = fr(S, 'read-all', 0.6, 0.7);
    const tx = P ? pe.x + pe.w / 2 : pe.x + pe.w / 2, ty = P ? c.y + c.h / 2 : c.y + c.h / 2;
    d.withAlpha(ta * (S.on('batch-idea') ? 0 : 1), () => {
      if (!P) d.arrow(c.x + c.w + 4 * u, ty, pe.x - 4 * u, ty, sg.c, 1.8, 7 * Math.max(0.8, u));
      else d.arrow(c.x + c.w + 4 * u, ty, pe.x + 4 * u, ty, sg.c, 1.8, 7 * Math.max(0.8, u));
      chip(S, S.l('1 token', '1 token'), tx + (P ? 30 * u : 0), ty, 'sig', { size: 13, maxW: pe.w });
    });
  } else {
    const a = fr(S, 'batch-idea', 0.15, 0.3);
    d.withAlpha(a, () => {
      d.arrow(P ? c.x + c.w + 4 * u : c.x + c.w + 4 * u, c.y + c.h / 2, pe.x - 2 * u, c.y + c.h / 2, sg.c, 1.8, 7 * Math.max(0.8, u));
      // personas en una cuadrícula que siempre cabe (hasta 60)
      const cols = pe.w > pe.h * 1.4 ? 12 : 6, rows = 60 / cols;
      const cs = Math.min(pe.w / cols, (pe.h - fz(S, 12) * u * 1.6) / rows);
      const gx = pe.x + (pe.w - cs * cols) / 2, gy = pe.y + fz(S, 12) * u * 1.6;
      for (let i = 0; i < 60; i++) {
        const cx = gx + (i % cols + 0.5) * cs, cy = gy + (Math.floor(i / cols) + 0.5) * cs;
        if (i < Bi) {
          d.circle(cx, cy, cs * 0.3, { fill: alpha(p.ink2, 0.8) });
          d.rect(cx + cs * 0.12, cy - cs * 0.42, cs * 0.3, cs * 0.3, { fill: sg.c, r: 1 });
        } else d.circle(cx, cy, cs * 0.12, { fill: alpha(p.mute, 0.35) });
      }
      fitText(S, S.l(`personas en el lote: ${Bi}`, `people in the batch: ${Bi}`), pe.x + pe.w / 2, pe.y, pe.w, { size: 12.5, weight: 800, color: p.ink, align: 'center', base: 'top' });
    });
  }
  // ── abajo: la cuenta del techo o las tres cifras ──
  const bt = L.bottom;
  const mathA = S.on('bw-math') ? fr(S, 'bw-math', 0.05, 0.15) * (1 - (S.on('batch-idea') ? fr(S, 'batch-idea', 0, 0.15) : 0)) : 0;
  if (mathA > 0.01) {
    const t1 = turn(1, 0);
    const l1 = S.l(`16 GB ÷ 3.35 TB/s ≈ ${sig(S, t1.t * 1000, 2)} ms por vuelta`, `16 GB ÷ 3.35 TB/s ≈ ${sig(S, t1.t * 1000, 2)} ms per turn`);
    const l2 = S.l(`1 vuelta = 1 token → como máximo ≈ ${int(S, t1.perUser)} tokens por segundo`, `1 turn = 1 token → at most ≈ ${int(S, t1.perUser)} tokens per second`);
    const size = 16, lhh = fz(S, size) * u * 1.5;
    const y0 = bt.y + Math.max(0, Math.min(30 * u, (bt.h - 3 * lhh) / 2));
    d.withAlpha(mathA, () => {
      // cada línea se parte si no cabe (teléfono)
      let y = y0;
      y += para(S, l1, bt.x + bt.w / 2, y, bt.w, { size: fits(S, l1, bt.w, { size, weight: 700, font: 'mono' }) ? size : 13, weight: 700, font: 'mono', color: p.ink, align: 'center', a: fr(S, 'bw-math', 0.1, 0.22) }) + 4 * u;
      y += para(S, l2, bt.x + bt.w / 2, y, bt.w, { size: fits(S, l2, bt.w, { size, weight: 800, font: 'mono' }) ? size : 13, weight: 800, font: 'mono', color: sg.ink, align: 'center', a: fr(S, 'bw-math', 0.45, 0.58) }) + 8 * u;
      if (S.on('bw-idle')) {
        const txt = S.l('por cada peso leído: 2 operaciones; podría hacer cientos', 'for each weight read: 2 operations; it could do hundreds');
        para(S, txt, bt.x + bt.w / 2, y, bt.w, { size: 13.5, weight: 700, color: dat.ink, align: 'center', a: fr(S, 'bw-idle', 0.2, 0.32) });
      }
    });
  }
  if (S.on('latency')) drawMeters(S, bt, B);
}

function drawMeters(S: Frame, r: Rect, B: number) {
  const { d, pal: p } = S, u = S.u, P = S.portrait, T = tight(S);
  const Bi = Math.max(1, Math.round(B)), res = turn(Bi, BATCH_CTX);
  const rows = [
    { seg: 'latency', label: S.l('tokens por segundo que recibe cada persona', 'tokens per second each person gets'), tag: S.l('latencia', 'latency'), v: res.perUser, max: 210, fmt: int(S, res.perUser), t: 'sig' as const },
    { seg: 'throughput', label: S.l('tokens por segundo que entrega la GPU en total', 'tokens per second the GPU delivers in total'), tag: S.l('rendimiento (throughput)', 'throughput'), v: res.total, max: 2600, fmt: int(S, res.total), t: 'dat' as const },
    { seg: 'cost-m', label: S.l('costo por millón de tokens', 'cost per million tokens'), tag: S.l(`con US$ ${PRICE_GPU_HOUR} por hora de GPU (supuesto)`, `at $${PRICE_GPU_HOUR} per GPU hour (assumption)`), v: res.costPerM, max: 3, fmt: usd(S, res.costPerM, 2), t: 'w' as const },
  ];
  const head = S.l(`conversaciones de ${int(S, BATCH_CTX)} tokens · modelo de 8 mil M · una H100`, `${int(S, BATCH_CTX)}-token conversations · 8B model · one H100`);
  const headH = paraH(S, head, r.w, 12) + 4 * u;
  para(S, head, r.x, r.y, r.w, { size: 12, weight: 600, color: p.mute, italic: true, a: fr(S, 'latency', 0.05, 0.15) });
  const rh = (r.h - headH) / 3;
  rows.forEach((row, i) => {
    const a = fr(S, row.seg, 0.05, 0.18);
    if (a <= 0.01) return;
    const y = r.y + headH + i * rh;
    const c = tone(S, row.t);
    const hot = (S.is(row.seg) ? 1 : 0) * fr(S, row.seg, 0.15, 0.3);
    d.withAlpha(a, () => {
      const valW = Math.max(chipW(S, row.fmt, 16, 800), 90 * u);
      // en vertical (o si no cabe) el rótulo va en su propia línea, arriba de la barra
      const twoLines = P || r.w < 560 * u;
      const labW = twoLines ? r.w : r.w * 0.42;
      const labSize = 12.5, labH = fz(S, labSize) * u * 1.35;
      const barH = Math.max(12 * u, Math.min(20 * u, rh * 0.28));
      const bar: Rect = twoLines ? { x: r.x, y: y + labH + 4 * u, w: r.w - valW - 8 * u, h: barH } : { x: r.x + labW + 8 * u, y: y + rh / 2 - barH / 2, w: r.w - labW - valW - 16 * u, h: barH };
      if (hot > 0.01) d.rect(r.x - 4 * u, y + 1, r.w + 8 * u, rh - 4 * u, { stroke: c.c, lw: 1.5, r: 4, a: hot });
      fitText(S, row.label, r.x, twoLines ? y + 3 * u : y + rh / 2, labW, { size: labSize, weight: 700, color: p.ink, base: twoLines ? 'top' : 'middle' });
      hbar(S, bar, row.v / row.max, row.t, { dash: row.t === 'w' });
      fitText(S, row.fmt, r.x + r.w, bar.y + bar.h / 2, valW, { size: 16, weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
      // la etiqueta del término (latencia, rendimiento, supuesto), bajo la barra
      const tg = fr(S, row.seg, 0.35, 0.5);
      const tagY = bar.y + bar.h + 4 * u;
      // el término va bajo la barra si hay sitio; si no, al final de la línea del rótulo; si tampoco cabe, lo dice la voz
      const tagW = S.d.measure(row.tag, { size: fz(S, 12), weight: 700 }), labTW = S.d.measure(row.label, { size: fz(S, labSize), weight: 700 });
      if (tagY + fz(S, 12) * u * 1.25 <= y + rh - 1 * u) fitText(S, row.tag, bar.x, tagY, bar.w, { size: 12, weight: 700, color: c.ink, base: 'top', a: tg, italic: row.t === 'w' });
      else if (twoLines && labTW + tagW + 12 * u <= r.w) fitText(S, row.tag, r.x + r.w, y + 3 * u, tagW + 2, { size: 12, weight: 700, color: c.ink, align: 'right', base: 'top', a: tg, italic: row.t === 'w' });
    });
  });
  void para; void paraH; void gb;
}
