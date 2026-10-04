// Acto 2 · Entrenar cuesta 16 bytes por parámetro: pesos, gradientes y estados de Adam, más las activaciones. Y por qué se usan tantas GPU.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LLAMA, MEASURED, TRAIN_BYTES, TRAIN_PARTS, actBytes, count, gbText, nf, GB } from './model';
import { FS, fitText, phases, tagText } from './ui';

const N = 8e9, CFG = LLAMA['8B'], TOKENS = 8192;          // modelo de 8 mil M (Llama 3 8B: 32 capas, h = 4096); 8 192 tokens por paso
const ACT_FULL = actBytes(CFG, TOKENS, false) / GB, ACT_RECOMP = actBytes(CFG, TOKENS, true) / GB;
const AX = 170;                                            // eje de la barra, GB

export function drawAct2(S: Frame, all: Rect) {
  const [a, b] = phases(S, ['train-q', 'ladder']);
  if (a > 0.005) S.d.withAlpha(a, () => drawTrain(S, all));
  if (b > 0.005) S.d.withAlpha(b, () => drawLadder(S, all));
}

const partIds = ['train-q', 'grads', 'adam', 'adam', 'adam'];
const partDelay = [0.3, 0.3, 0.2, 1.4, 2.6];

function drawTrain(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const track = all.w, X = (g: number) => all.x + (g / AX) * track;
  // progresos de cada parte
  const prog = TRAIN_PARTS.map((_, i) => S.at(partIds[i], partDelay[i], partDelay[i] + 0.9, 'out'));
  const bytesNow = TRAIN_PARTS.reduce((s, pt, i) => s + pt.bytes * prog[i], 0);
  const gbNow = (N * bytesNow) / GB;
  // cabecera
  d.text(S.l(`Modelo de ${count(N, 'es')} de parámetros`, `Model with ${count(N, 'en')} parameters`), all.x, all.y + 2 * u, { size: FS(S, 14), weight: 700, color: p.mute, base: 'top' });
  d.text(S.l(`${nf(bytesNow, bytesNow % 1 ? 1 : 0, 'es')} B por parámetro`, `${nf(bytesNow, bytesNow % 1 ? 1 : 0, 'en')} B per parameter`), all.x, all.y + 22 * u, { size: FS(S, port ? 20 : 24), weight: 800, font: 'mono', color: p.ink, base: 'top' });
  d.text('= ' + gbText(gbNow, S.lang), all.x + all.w, all.y + 22 * u, { size: FS(S, port ? 20 : 24), weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'right', base: 'top' });
  // barra
  const by = all.y + (port ? 62 : 70) * u, bh = (port ? 40 : 50) * u;
  d.rect(all.x, by, track, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
  let acc = 0;
  TRAIN_PARTS.forEach((pt, i) => {
    const gb = (N * pt.bytes) / GB, w0 = X(acc) , w = (X(acc + gb) - X(acc)) * prog[i], c = tone(S, pt.tone);
    if (w > 0.5) {
      d.rect(w0, by, w, bh, { fill: alpha(c.c, 0.75), stroke: p.stage, lw: 1.5 });
      if (pt.hatch < 1) d.dither(w0, by, w, bh, p.stage, 0.34, 2);
    }
    acc += gb * (prog[i] > 0 ? 1 : 0);
  });
  // activaciones (hatched, tono de señal)
  const aAct = S.on('activ') ? S.at('activ', 0.4, 1.6, 'out') : 0;
  if (aAct > 0) {
    const w0 = X(N * TRAIN_BYTES / GB), w = (X(N * TRAIN_BYTES / GB + ACT_FULL) - w0) * aAct, c = tone(S, 'sig');
    d.rect(w0, by, w, bh, { fill: alpha(c.c, 0.35), stroke: c.c, lw: 1.6, dash: [5, 3] });
    d.dither(w0, by, w, bh, c.c, 0.4, 3);
  }
  // marca de la H100
  d.line(X(80), by - 8 * u, X(80), by + bh + 18 * u, p.ink, 1.8, [5, 4]);
  tagText(S, S.l('1 H100: 80 GB', '1 H100: 80 GB'), X(80), by - 16 * u, { align: 'center', size: 13 });
  // eje
  [0, 40, 80, 120, 160].forEach((g) => { d.line(X(g), by + bh, X(g), by + bh + 5 * u, p.lineStrong, 1.5); d.text(String(g), X(g), by + bh + 8 * u, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: g === 0 ? 'left' : 'center', base: 'top' }); });
  d.text('GB', all.x + all.w, by + bh + 8 * u, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: 'right', base: 'top' });

  // leyenda en tabla
  const ly = by + bh + 34 * u, rowH = 24 * u, cols = port ? 1 : 2;
  const items: { name: string; b: string; gb: string; t: 'w' | 'err' | 'dat' | 'sig'; hatch: number; on: number }[] = TRAIN_PARTS.map((pt, i) => ({
    name: S.l(pt.es, pt.en), b: `${pt.bytes} B`, gb: gbText((N * pt.bytes) / GB, S.lang), t: pt.tone, hatch: pt.hatch, on: prog[i],
  }));
  if (S.on('activ')) {
    items.push({ name: S.l(`Activaciones (${nf(TOKENS, 0, 'es')} tokens), sin recalcular`, `Activations (${nf(TOKENS, 0, 'en')} tokens), stored`), b: '—', gb: gbText(ACT_FULL, S.lang), t: 'sig', hatch: 0.4, on: aAct });
    items.push({ name: S.l('Activaciones, recalculándolas', 'Activations, recomputing them'), b: '—', gb: gbText(ACT_RECOMP, S.lang), t: 'sig', hatch: 0.4, on: S.at('activ', 2.2, 3.0, 'out') });
  }
  const colW = all.w / cols;
  items.forEach((it, i) => {
    const cx = all.x + (i % cols) * colW, cy = ly + Math.floor(i / cols) * rowH, c = tone(S, it.t);
    d.withAlpha(it.on, () => {
      d.rect(cx, cy - 7 * u, 14 * u, 14 * u, { fill: alpha(c.c, 0.75), stroke: c.c, lw: 1.2 });
      if (it.hatch < 1) d.dither(cx, cy - 7 * u, 14 * u, 14 * u, p.stage, 0.34, 2);
      const gbW = (port ? 62 : 66) * u, bW = (port ? 34 : 36) * u;
      fitText(S, it.name, cx + 20 * u, cy, colW - 20 * u - gbW - bW - 8 * u, 13, { weight: 700, color: p.ink, base: 'middle' });
      d.text(it.b, cx + colW - gbW - 4 * u, cy, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
      d.text(it.gb, cx + colW - 6 * u, cy, { size: FS(S, 13), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    });
  });
  // total y medición
  if (S.on('sixteen')) {
    const rows = Math.ceil(items.length / cols), y = ly + rows * rowH + 8 * u, a = S.reveal('sixteen', 0.3, 0.7);
    d.withAlpha(a, () => {
      d.line(all.x, y - 4 * u, all.x + all.w, y - 4 * u, p.lineStrong, 1.2);
      fitText(S, S.l('2 + 2 + 4 + 4 + 4 = 16 bytes por parámetro: 8 veces más que usarlo', '2 + 2 + 4 + 4 + 4 = 16 bytes per parameter: 8 times more than using it'), all.x, y + 10 * u, all.w, 14, { weight: 800, color: p.ink, base: 'middle' });
      const m = tone(S, 'dat');
      d.rect(all.x, y + 26 * u, all.w, 34 * u, { stroke: m.c, lw: 1.5, dash: [5, 3], r: 3 });
      fitText(S, S.l(`medido en una RTX 3060 (Pythia-160M): ${nf(MEASURED.fp32.afterStep, 1, 'es')} B por parámetro con FP32 y ${nf(MEASURED.mixed.afterStep, 1, 'es')} con precisión mixta`, `measured on an RTX 3060 (Pythia-160M): ${nf(MEASURED.fp32.afterStep, 1, 'en')} B per parameter in FP32 and ${nf(MEASURED.mixed.afterStep, 1, 'en')} in mixed precision`), all.x + 8 * u, y + 43 * u, all.w - 16 * u, 12.5, { weight: 700, color: m.ink, base: 'middle' });
    });
  }
}

// ── la regla de GPU: la memoria fija el mínimo; el cómputo, el número real ──
function drawLadder(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const states = 405e9 * TRAIN_BYTES / GB, minGpus = Math.ceil(states / 80), used = 16384;
  const lo = 0, hi = 5, tx = all.x + 12 * u, tw = all.w - 24 * u;
  const X = (g: number) => tx + ((Math.log10(g) - lo) / (hi - lo)) * tw;
  const cy = all.y + all.h * (port ? 0.52 : 0.55);
  const aRule = S.reveal('ladder', 0, 0.7);
  d.withAlpha(aRule, () => {
    d.line(tx, cy, tx + tw, cy, p.lineStrong, 2);
    [1, 10, 100, 1000, 10000, 100000].forEach((g) => { d.line(X(g), cy - 5 * u, X(g), cy + 5 * u, p.lineStrong, 1.8); d.text(nf(g, 0, S.lang), X(g), cy + 10 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    d.text(S.l('número de GPU H100 (escala logarítmica)', 'number of H100 GPUs (logarithmic scale)'), tx + tw, cy + 30 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  // título de la cuenta
  const a1 = S.reveal('ladder', 0.4, 0.7);
  d.withAlpha(a1, () => {
    d.text('Llama 3.1 405B', all.x, all.y + 2 * u, { size: FS(S, 18), weight: 800, color: p.ink, base: 'top' });
    d.text(S.l(`${count(405e9, 'es')} × 16 B = ${nf(states, 0, 'es')} GB de estados`, `${count(405e9, 'en')} × 16 B = ${nf(states, 0, 'en')} GB of states`), all.x, all.y + 26 * u, { size: FS(S, 15), weight: 700, font: 'mono', color: tone(S, 'dat').ink, base: 'top', w: all.w });
    d.text(S.l('estimación a 16 B por parámetro, sin activaciones; no es el desglose real de Meta', 'estimate at 16 B per parameter, no activations; not Meta’s actual breakdown'), all.x, all.y + 26 * u + (port ? 38 : 22) * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: all.w });
  });
  // marcas
  const a2 = S.reveal('ladder', 1.4, 0.7), a3 = S.reveal('ladder', 3.2, 0.7);
  const m1 = tone(S, 'w'), m2 = tone(S, 'dat');
  d.withAlpha(a2, () => {
    d.polygon([[X(minGpus), cy], [X(minGpus) - 8 * u, cy - 16 * u], [X(minGpus) + 8 * u, cy - 16 * u]], { fill: m1.c, stroke: p.stage, lw: 1.5 });
    tagText(S, S.l(`≥ ${nf(minGpus, 0, 'es')} por la memoria`, `≥ ${nf(minGpus, 0, 'en')} for memory`), X(minGpus), cy - 32 * u, { t: 'w', align: 'center' });
  });
  d.withAlpha(a3, () => {
    d.polygon([[X(used), cy], [X(used) - 8 * u, cy - 16 * u], [X(used) + 8 * u, cy - 16 * u]], { fill: m2.c, stroke: p.stage, lw: 1.5 });
    tagText(S, S.l(`${nf(used, 0, 'es')} usadas, por el cómputo`, `${nf(used, 0, 'en')} used, for compute`), X(used), cy - 32 * u, { t: 'dat', align: port ? 'right' : 'center' });
    // el tramo entre las dos
    d.line(X(minGpus), cy + 56 * u, X(used), cy + 56 * u, p.ink2, 1.6);
    d.line(X(minGpus), cy + 50 * u, X(minGpus), cy + 62 * u, p.ink2, 1.6); d.line(X(used), cy + 50 * u, X(used), cy + 62 * u, p.ink2, 1.6);
    d.text(S.l('el resto es para terminar a tiempo (lección 24)', 'the rest is to finish on time (lesson 24)'), (X(minGpus) + X(used)) / 2, cy + 68 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'center', base: 'top', w: Math.max(150 * u, X(used) - X(minGpus)) });
  });
  void clamp;
}
