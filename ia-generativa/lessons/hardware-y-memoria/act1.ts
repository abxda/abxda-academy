// Acto 1 · ¿Cabe? La GPU y su memoria, los bytes de un parámetro, la cuenta «parámetros × bytes» y la calculadora (turno 1).
import { alpha, clamp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import {
  BIG, GPUS, MARGIN, PRECS, bf16bits, cardsNeeded, count, f16bits, f32bits, fitOf, gbText, intBits, nf, precBits, weightsGB, type Fit,
} from './model';
import { SAMPLE } from './real-data';
import { FS, check, chip, fitText, op, phases, pxLabel, smooth, tagText, verdict } from './ui';

type R3 = ReturnType<typeof regions>;

export function drawAct1(S: Frame, R: R3) {
  const [a, b, c, d] = phases(S, ['hook', 'bytes', 'multiply', 'try-calc']);
  if (a > 0.005) S.d.withAlpha(a, () => drawAnatomy(S, R.all));
  if (b > 0.005) S.d.withAlpha(b, () => drawBits(S, R.all));
  if (c > 0.005) S.d.withAlpha(c, () => drawBars(S, R.all));
  if (d > 0.005) S.d.withAlpha(d, () => drawCalc(S, R));
}

// ═════════════════════════════════════════════════════════════════════════
// 1a · anatomía: una GPU = miles de núcleos + su propia memoria (esquemático, no está a escala)
// ═════════════════════════════════════════════════════════════════════════
function drawAnatomy(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const pk: Rect = port ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.56 } : { x: all.x, y: all.y, w: all.w * 0.58, h: all.h };
  const col: Rect = port ? { x: all.x, y: all.y + all.h * 0.6, w: all.w, h: all.h * 0.4 } : { x: all.x + all.w * 0.62, y: all.y, w: all.w * 0.38, h: all.h };
  const dat = tone(S, 'dat'), wt = tone(S, 'w');
  const aPkg = S.reveal('hook', 0, 0.7), aCores = S.reveal('gpu', 0.1, 0.8), aMem = S.reveal('vram', 0.1, 0.8);
  const lab = FS(S, 14);

  // ── el paquete: sustrato, chip y pilas de memoria ──
  const side = Math.min(pk.w, pk.h * 1.05), px = pk.x + (pk.w - side) / 2, py = pk.y + (pk.h - side * 0.86) / 2 + 8 * u, ph = side * 0.86;
  const dieW = side * 0.5, dieH = ph * 0.64, dx = px + (side - dieW) / 2, dy = py + (ph - dieH) / 2;
  d.withAlpha(aPkg, () => {
    d.rect(px, py, side, ph, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5, r: 6 });
    // memoria HBM: 3 pilas a la izquierda y 2 a la derecha (la H100 SXM5 lleva 5 de 16 GB: 80 GB)
    const stack = (x: number, y: number, w: number, h: number, hot: number) => {
      d.rect(x, y, w, h, { fill: alpha(wt.c, 0.12 + 0.4 * hot), stroke: wt.c, lw: 1.5 + hot });
      for (let k = 1; k < 5; k++) d.line(x, y + (h * k) / 5, x + w, y + (h * k) / 5, alpha(wt.c, 0.55), 1);
    };
    const sw = (side - dieW) / 2 - 16 * u, hotM = aMem * (0.65 + 0.35 * Math.sin(S.clock * 4) ** 2);
    for (let k = 0; k < 3; k++) stack(px + 8 * u, dy + (k * dieH) / 3 + 2, Math.max(8, sw), dieH / 3 - 5, hotM);
    for (let k = 0; k < 2; k++) stack(dx + dieW + 8 * u, dy + (k * dieH) / 2 + 2, Math.max(8, sw), dieH / 2 - 5, hotM);
    // el chip
    d.rect(dx, dy, dieW, dieH, { fill: p.surface, stroke: p.ink2, lw: 2, r: 3 });
    // 256 cuadros; cada uno son 66 núcleos (16 896 núcleos CUDA de FP32 en la H100 SXM5)
    const n = 16, gap = Math.max(1, 0.12 * dieW / n), cw = (dieW - gap * (n + 1)) / n, ch = (dieH - gap * (n + 1)) / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const wave = 0.5 + 0.5 * Math.sin(S.clock * 3.2 - (i + j) * 0.55), lit = aCores * (0.35 + 0.65 * wave);
      d.rect(dx + gap + i * (cw + gap), dy + gap + j * (ch + gap), cw, ch, { fill: alpha(dat.c, 0.12 + 0.7 * lit) });
    }
  });
  d.text('H100', px + side / 2, py - 6 * u, { size: lab, weight: 800, color: p.ink, align: 'center', base: 'bottom', a: aPkg });
  if (aCores > 0.01) {
    tagText(S, S.l('16 896 núcleos', '16,896 cores'), dx + dieW / 2, dy + dieH + 16 * u, { t: 'dat', align: 'center', a: aCores });
    tagText(S, S.l('(cada cuadro ≈ 66 núcleos)', '(each square ≈ 66 cores)'), dx + dieW / 2, dy + dieH + 34 * u, { align: 'center', size: 12, weight: 600, a: aCores * 0.9 });
  }
  if (aMem > 0.01) {
    tagText(S, S.l('memoria', 'memory'), px + (side - dieW) / 4, py + ph + 14 * u, { t: 'w', align: 'center', a: aMem });
    tagText(S, S.l('memoria', 'memory'), px + side - (side - dieW) / 4, py + ph + 14 * u, { t: 'w', align: 'center', a: aMem });
  }

  // ── columna de apoyo ──
  if (S.between('hook', 'gpu')) {
    const a = S.reveal('hook', 0.5, 0.7);
    d.withAlpha(a, () => {
      const t = tone(S, 'w');
      d.text(S.l('¿Cabe el modelo?', 'Does the model fit?'), col.x, col.y + col.h * 0.28, { size: FS(S, 22), weight: 800, color: p.ink, base: 'middle', w: col.w });
      d.text(S.l('Los pesos viven en la memoria de la GPU.', 'The weights live in the GPU’s memory.'), col.x, col.y + col.h * 0.28 + 38 * u, { size: FS(S, 14), weight: 600, color: p.ink2, base: 'top', w: col.w });
      void t;
    });
  } else if (S.between('gpu', 'vram')) {
    const a = S.reveal('gpu', 0.4, 0.7);
    d.withAlpha(a, () => cpuInset(S, col));
  } else {
    memBars(S, col, aMem);
  }
}

/** Una CPU a modo de contraste: pocos núcleos grandes. */
function cpuInset(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, sig = tone(S, 'sig');
  const w = Math.min(r.w * 0.5, 150 * u), h = w * 0.62, x = r.x, y = r.y + 4 * u;
  d.rect(x, y, w, h, { fill: p.surface, stroke: p.ink2, lw: 2, r: 3 });
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) d.rect(x + 6 * u + i * ((w - 12 * u) / 4), y + 6 * u + j * ((h - 12 * u) / 2), (w - 12 * u) / 4 - 4 * u, (h - 12 * u) / 2 - 4 * u, { fill: alpha(sig.c, 0.5), stroke: sig.c, lw: 1.2 });
  tagText(S, 'CPU', x + w + 12 * u, y + h * 0.28, { align: 'left', t: 'sig' });
  d.text(S.l('pocos núcleos, cada uno veloz y versátil', 'few cores, each fast and versatile'), x, y + h + 10 * u, { size: FS(S, 13), weight: 600, color: p.ink2, base: 'top', w: r.w });
  const y2 = y + h + 10 * u + (S.portrait ? 20 : 40) * u;
  tagText(S, 'GPU', x, y2 + 10 * u, { align: 'left', t: 'dat' });
  d.text(S.l('miles de núcleos sencillos, todos a la vez', 'thousands of simple cores, all at once'), x + 38 * u, y2 + 10 * u, { size: FS(S, 13), weight: 600, color: p.ink2, base: 'middle', w: r.w - 40 * u });
}

/** Barras de memoria: la H100 (80 GB en 5 bloques de 16) y la RTX 3060 (12 GB), a la misma escala. */
function memBars(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w');
  const bw = r.w, bh = 26 * u, x = r.x;
  d.withAlpha(a, () => {
    let y = r.y + (S.portrait ? 2 : r.h * 0.14);
    d.text(S.l('VRAM de una H100', 'VRAM of an H100'), x, y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' });
    y += 22 * u;
    const aBlocks = S.at('vram', 0.4, 2.2, 'out');
    for (let k = 0; k < 5; k++) {
      const f = clamp(aBlocks * 5 - k);
      d.rect(x + (bw / 5) * k + 1, y, bw / 5 - 2, bh, { fill: alpha(wt.c, 0.1 + 0.45 * f), stroke: wt.c, lw: 1.4 });
    }
    d.text(S.l('80 GB HBM3 · 5 pilas de 16 GB', '80 GB HBM3 · 5 stacks of 16 GB'), x, y + bh + 6 * u, { size: FS(S, 13), weight: 700, color: wt.ink, base: 'top' });
    y += bh + 34 * u;
    const rw = bw * (12 / 80);
    d.text(S.l('RTX 3060, a la misma escala', 'RTX 3060, same scale'), x, y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', a: S.reveal('vram', 2.4, 0.6) });
    y += 22 * u;
    d.withAlpha(S.reveal('vram', 2.6, 0.6), () => {
      d.rect(x, y, rw, bh, { fill: alpha(wt.c, 0.5), stroke: wt.c, lw: 1.4 });
      d.text(S.l('12 GB GDDR6', '12 GB GDDR6'), x + rw + 8 * u, y + bh / 2, { size: FS(S, 13), weight: 700, color: wt.ink, base: 'middle' });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 1b · los bits de un parámetro: FP32, FP16, BF16, INT8 e INT4 (bits REALES de un peso de Pythia)
// ═════════════════════════════════════════════════════════════════════════
interface BitRow { name: string; bytes: string; bits: string; fields: number[]; int?: boolean }
function bitRows(): BitRow[] {
  const w = BIG.v, q8 = Math.round(w / (SAMPLE.absmax / 127)), q4 = Math.round(w / (SAMPLE.absmax / 7));
  return [
    { name: 'FP32', bytes: '4', bits: f32bits(w), fields: [1, 8, 23] },
    { name: 'FP16', bytes: '2', bits: f16bits(w), fields: [1, 5, 10] },
    { name: 'BF16', bytes: '2', bits: bf16bits(w), fields: [1, 8, 7] },
    { name: 'INT8', bytes: '1', bits: intBits(q8, 8), fields: [8], int: true },
    { name: 'INT4', bytes: '½', bits: intBits(q4, 4), fields: [4], int: true },
  ];
}

function drawBits(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const rows = bitRows(), wt = tone(S, 'w'), lat = tone(S, 'lat'), ink = tone(S, 'ink');
  const showFields = S.on('fp16') ? S.at('fp16', 0, 0.9, 'out') : 0;
  const labelW = (port ? 58 : 84) * u, tailW = (port ? 0 : 70) * u;
  const cell = Math.min(24 * u, (all.w - labelW - tailW) / 32.6), gap = Math.max(1.2, cell * 0.14);
  const rowH = Math.min(cell + (port ? 26 : 22) * u, (all.h - 70 * u) / 5);
  const top = all.y + 56 * u;
  // cabecera: el peso
  const a0 = S.reveal('bytes', 0, 0.6);
  d.withAlpha(a0, () => {
    d.text(S.l('Un peso real de Pythia-1.4B', 'A real weight from Pythia-1.4B'), all.x, all.y + 2 * u, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top' });
    d.text('w = ' + S.n(BIG.v, 4), all.x, all.y + 20 * u, { size: FS(S, 20), weight: 800, font: 'mono', color: wt.ink, base: 'top' });
    if (S.on('fp16')) d.text(S.l('(1 = relleno, 0 = vacío)', '(1 = filled, 0 = empty)'), all.x + all.w, all.y + 24 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top', a: showFields });
  });
  rows.forEach((row, ri) => {
    const a = S.reveal('bytes', 0.35 + ri * 0.4, 0.55), y = top + ri * rowH;
    if (a <= 0) return;
    d.withAlpha(a, () => {
      d.text(row.name, all.x, y + cell / 2 - 7 * u, { size: FS(S, 15), weight: 800, color: p.ink, base: 'middle' });
      d.text(S.l(`${row.bytes} ${row.bytes === '1' ? 'byte' : 'bytes'}`, `${row.bytes} ${row.bytes === '1' ? 'byte' : 'bytes'}`).replace('½ bytes', S.l('½ byte', '½ byte')), all.x, y + cell / 2 + 9 * u, { size: FS(S, 12.5), weight: 700, color: wt.ink, base: 'middle' });
      let k = 0;
      row.fields.forEach((len, fi) => {
        const t = row.int ? wt : showFields > 0.5 ? (fi === 0 ? ink : fi === 1 ? lat : wt) : wt;
        for (let b = 0; b < len; b++, k++) {
          const on = row.bits[k] === '1', x = all.x + labelW + k * (cell + gap) + (fi > 0 ? fi * gap * 1.4 : 0) * (row.int ? 0 : 1);
          d.rect(x, y, cell, cell, { fill: on ? alpha(t.c, 0.88) : alpha(t.c, 0.06), stroke: t.c, lw: 1.2 });
        }
      });
      // campos: signo · exponente · mantisa
      if (showFields > 0 && !row.int) {
        const txt = row.fields.join(' · ');
        d.text(txt, port ? all.x + labelW : all.x + all.w, port ? y + cell + 11 * u : y + cell / 2, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.ink2, align: port ? 'left' : 'right', base: 'middle', a: showFields });
      }
      if (row.int) d.text(S.l('entero × escala', 'integer × scale'), port ? all.x + labelW : all.x + all.w, port ? y + cell + 11 * u : y + cell / 2, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: port ? 'left' : 'right', base: 'middle' });
    });
  });
  // leyenda de campos y alcance
  if (showFields > 0) {
    const y = top + 5 * rowH + 2 * u, items: [string, ReturnType<typeof tone>][] = [[S.l('signo', 'sign'), ink], [S.l('exponente: el alcance', 'exponent: the range'), lat], [S.l('mantisa: los decimales', 'mantissa: the decimals'), wt]];
    d.withAlpha(showFields, () => {
      let x = all.x;
      items.forEach(([t, c]) => { d.rect(x, y - 6 * u, 12 * u, 12 * u, { fill: alpha(c.c, 0.85), stroke: c.c, lw: 1.2 }); const w = d.measure(t, { size: FS(S, 12.5), weight: 700 }); d.text(t, x + 17 * u, y, { size: FS(S, 12.5), weight: 700, color: c.ink, base: 'middle' }); x += 17 * u + w + 16 * u; });
      d.text(S.l('FP16 llega a ±65 504 · BF16 tiene el alcance de FP32, con menos decimales', 'FP16 reaches ±65,504 · BF16 has FP32’s range, with fewer decimals'), all.x, y + 20 * u, { size: FS(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: all.w });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 1c · la cuenta: parámetros × bytes, para un modelo de 70 mil millones
// ═════════════════════════════════════════════════════════════════════════
function drawBars(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, wt = tone(S, 'w'), N = 70e9;
  // fórmula
  const chH = 46 * u, opW = 22 * u, cw = (all.w - 3 * opW) / 3;
  const a0 = S.reveal('multiply', 0, 0.6);
  const f = (i: number) => S.reveal('multiply', 0.2 + i * 0.5, 0.5);
  [[S.l('parámetros', 'parameters'), S.l('70 mil M', '70B'), 'w'], [S.l('bytes por parámetro', 'bytes per parameter'), '2', 'ink'], [S.l('memoria de los pesos', 'weight memory'), '140 GB', 'dat']].forEach(([label, val, t], i) => {
    const x = all.x + i * (cw + opW);
    chip(S, { x, y: all.y, w: cw, h: chH }, label, val, t as 'w', { a: f(i) * a0 || f(i), vsize: 17 });
    if (i < 2) op(S, x + cw + opW / 2, all.y + chH / 2, i === 0 ? '×' : '=', f(i + 1));
  });
  // barras
  const top = all.y + chH + 26 * u, labW = (port ? 74 : 96) * u, rightW = (port ? 74 : 96) * u, track = all.w - labW - rightW;
  const AX = 300, X = (g: number) => all.x + labW + (g / AX) * track;
  const rowH = Math.min(52 * u, (all.h - chH - 70 * u) / 4);
  const rows = PRECS.map((pr) => ({ pr, gb: weightsGB(N, pr.bits), at: pr.id === 'fp16' ? 0 : 1 }));
  rows.forEach((row, i) => {
    const a = row.at === 0 ? S.reveal('multiply', 1.2, 0.6) : S.reveal('others', 0.2 + i * 0.35, 0.55);
    if (a <= 0) return;
    const y = top + i * rowH, fit = fitOf(row.gb, 80);
    d.withAlpha(a, () => {
      d.text(S.l(row.pr.es, row.pr.en), all.x, y + rowH * 0.3, { size: FS(S, 14), weight: 800, color: p.ink, base: 'middle' });
      d.text(`${row.pr.bits / 8 < 1 ? '0,5' : nf(row.pr.bits / 8, 0, S.lang)} B`.replace('0,5', S.l('0,5', '0.5')), all.x, y + rowH * 0.3 + 15 * u, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.mute, base: 'middle' });
      const bh = rowH * 0.46, by = y + rowH * 0.12;
      d.rect(X(0), by, X(row.gb) - X(0), bh, { fill: alpha(wt.c, fit === 'no' ? 0.4 : 0.7), stroke: wt.c, lw: 1.4 });
      d.text(gbText(row.gb, S.lang), X(Math.min(row.gb, AX)) + 8 * u, by + bh / 2, { size: FS(S, 14), weight: 800, font: 'mono', color: wt.ink, base: 'middle' });
    });
    // veredicto a la derecha
    d.withAlpha(a, () => {
      const vx = all.x + all.w - rightW + 14 * u, vy = y + rowH * 0.12 + rowH * 0.23;
      verdict(S, vx, vy, fit);
      const txt = fit === 'ok' ? S.l('cabe', 'fits') : fit === 'tight' ? S.l('justo', 'tight') : `${nf(row.gb / 80, 1, S.lang)} H100`;
      d.text(txt, vx + 16 * u, vy, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
    });
  });
  // la raya de la H100
  const aLine = S.reveal('multiply', 0.9, 0.6);
  d.withAlpha(aLine, () => {
    d.line(X(80), top - 6 * u, X(80), top + 4 * rowH - rowH * 0.1, p.ink, 1.8, [5, 4]);
    tagText(S, S.l('1 H100: 80 GB', '1 H100: 80 GB'), X(80), top - 14 * u, { align: 'center', size: 13 });
  });
  void smooth;
}

// ═════════════════════════════════════════════════════════════════════════
// 1d · la calculadora: tamaño × precisión → GB, y qué GPUs lo alojan (turno 1)
// ═════════════════════════════════════════════════════════════════════════
export function calcParams(S: Frame): { N: number; bits: number; gb: number } {
  const N = 10 ** (S.p.logN ?? 9.845), bits = precBits(S.p.prec ?? 'fp16');
  return { N, bits, gb: weightsGB(N, bits) };
}

function drawCalc(S: Frame, R: R3) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, wt = tone(S, 'w');
  const { N, bits, gb } = calcParams(S);
  const area = port ? R.all : R.main;
  const aBody = S.reveal('try-calc', 0, 0.6);
  const rowsN = GPUS.length;
  // arriba (vertical) o a un lado (horizontal): la fórmula viva
  const fH = 44 * u, opW = 20 * u;
  const chipsRect: Rect = port ? { x: R.all.x, y: R.all.y, w: R.all.w, h: fH } : { x: R.aside.x, y: R.aside.y, w: R.aside.w, h: R.aside.h };
  const names = [S.l('parámetros', 'parameters'), S.l('bits', 'bits'), S.l('pesos', 'weights')];
  const vals = [count(N, S.lang), String(bits), gbText(gb, S.lang)], ts = ['w', 'ink', 'dat'] as const;
  d.withAlpha(aBody, () => {
    if (port) {
      const cw = (chipsRect.w - 2 * opW) / 3;
      names.forEach((n, i) => { const x = chipsRect.x + i * (cw + opW); chip(S, { x, y: chipsRect.y, w: cw, h: fH }, n, vals[i], ts[i], { vsize: 16 }); if (i < 2) op(S, x + cw + opW / 2, chipsRect.y + fH / 2, i === 0 ? '×' : '=', 1); });
    } else {
      const ch = Math.min(52 * u, (chipsRect.h - 150 * u) / 3);
      names.forEach((n, i) => { const y = chipsRect.y + i * (ch + 14 * u); chip(S, { x: chipsRect.x, y, w: chipsRect.w, h: ch }, n, vals[i], ts[i], { vsize: 19 }); });
      // margen
      d.text(S.l(`Margen del ${nf(MARGIN * 100, 0, S.lang)} % para la caché y los cálculos: supuesto de la lección`, `${nf(MARGIN * 100, 0, S.lang)}% margin for the cache and computation: a lesson assumption`), chipsRect.x, chipsRect.y + 3 * (ch + 14 * u) + 4 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: chipsRect.w });
    }
  });
  // filas de GPU
  const top = (port ? R.all.y + fH + 14 * u : area.y), availH = (port ? R.all.h - fH - 14 * u - 56 * u : area.h - 30 * u);
  const rowH = clamp(availH / rowsN, 34 * u, 62 * u), nameW = (port ? 78 : 112) * u, vW = (port ? 74 : 150) * u;
  const x0 = area.x, bx = x0 + nameW, bw = area.w - nameW - vW;
  GPUS.forEach((g, i) => {
    const y = top + i * rowH, a = S.reveal('try-calc', 0.05 + i * 0.07, 0.5), fit = fitOf(gb, g.mem), ratio = gb / g.mem;
    d.withAlpha(a, () => {
      d.text(g.name, x0, y + rowH * 0.34, { size: FS(S, 14), weight: 800, color: p.ink, base: 'middle' });
      d.text(`${g.mem} GB · ${g.kind}`, x0, y + rowH * 0.34 + 15 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'middle' });
      const bh = Math.min(22 * u, rowH * 0.5), by = y + rowH * 0.5 - bh / 2 - 3 * u;
      d.rect(bx, by, bw, bh, { fill: p.surface2, stroke: p.lineStrong, lw: 1.2 });
      // zona de margen (los últimos 20 % de la tarjeta)
      d.dither(bx + bw * (1 - MARGIN), by + 1, bw * MARGIN - 1, bh - 2, p.mute, 0.35, 2);
      const fillW = Math.min(1, ratio) * bw, over = ratio > 1;
      d.rect(bx, by, fillW, bh, { fill: alpha(over ? tone(S, 'err').c : wt.c, over ? 0.55 : 0.85), stroke: over ? tone(S, 'err').c : wt.c, lw: 1.4 });
      if (over) d.text('▶', bx + bw + 3 * u, by + bh / 2, { size: FS(S, 13), weight: 800, color: tone(S, 'err').ink, base: 'middle' });
      const vx = x0 + area.w - vW + 14 * u, vy = by + bh / 2;
      verdict(S, vx, vy, fit, 7);
      const need = cardsNeeded(gb, g.mem);
      const txt = fit === 'ok' ? S.l('cabe', 'fits') : fit === 'tight' ? S.l('justo', 'tight') : (port ? `×${need}` : S.l(`no cabe · ×${need}`, `no fit · ×${need}`));
      d.text(txt, vx + 15 * u, vy, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
    });
  });
  // pie: ayuda del turno
  if (S.between('try-calc', 'train-q')) {
    const y = port ? R.all.y + R.all.h - 4 * u : area.y + area.h;
    const st = S.st.calcGate ?? { hit: false };
    check(S, area.x, y - 10 * u, !!st.hit, S.l('13 mil M cabe, con margen, en la RTX 3060', '13B fits, with margin, in the RTX 3060'), area.w, 'dat');
  }
  void names;
}

/** Estado del turno 1: ¿hay un modelo de ~13 mil M que quepa con margen en la RTX 3060? */
export function updateCalc(S: Frame): boolean {
  const g = S.st.calcGate ?? (S.st.calcGate = { hit: false });
  if (!S.between('try-calc', 'train-q')) return false;
  const { N, gb } = calcParams(S);
  g.hit = N >= 11e9 && N <= 15e9 && fitOf(gb, 12) === 'ok';
  return g.hit;
}
