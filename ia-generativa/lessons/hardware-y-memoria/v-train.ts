// Vista 6: entrenar pide unos 16 bytes por parámetro. Una barra de «usar» (2 bytes) y otra de «entrenar» que crece pieza por
// pieza mientras la voz las nombra: parámetro y gradiente en FP16, los dos promedios de Adam y la copia en FP32 (Rajbhandari et
// al., 2020, §3.1). Al final, la cuenta para 70 mil millones: 1 120 GB, catorce H100 llenas. Medido: 16.05 bytes por parámetro.
import { alpha, clamp, tone, type Frame } from '../../../../../theme/kit';
import { TRAIN_MEASURED, TRAIN_PARTS, type TrainPart } from './model';
import { ap, area, fitText, fr, gpuBox, isShort, lineH, measure, pill, provenance, txt } from './draw';

/** Progreso de cada pieza: cuándo crece dentro de su segmento. */
const WHEN: Record<TrainPart['id'], [number, number]> = { w: [0.04, 0.24], g: [0.55, 0.75], m1: [0.5, 0.66], m2: [0.68, 0.84], master: [0.06, 0.3] };
const grow = (S: Frame, pt: TrainPart) => ap(S, pt.seg, WHEN[pt.id][0], WHEN[pt.id][1]);

function swatch(S: Frame, x: number, y: number, w: number, h: number, pt: TrainPart) {
  const t = tone(S, pt.tone);
  S.d.rect(x, y, w, h, { fill: alpha(t.c, 0.78) });
  if (pt.dither) S.d.dither(x, y, w, h, S.pal.stage, 0.32, 2);
}

export function drawTrain(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait;
  const a0 = ap(S, 'train-q', 0, 0.12), a70 = ap(S, 'train-70', 0, 0.12);
  const bh = (short ? 18 : 26) * u, x0 = A.x, x1 = A.x + A.w - (port ? 4 : 10) * u, X = (b: number) => x0 + (b / 16) * (x1 - x0);
  // en escenarios holgados, el conjunto se centra un poco en vertical (en uno bajo, arriba)
  const cols0 = !port && A.w > 560 ? 2 : 1, est = 2 * lineH(S, 14, 1.2) + 2 * bh + (short ? 10 : 18) * u + lineH(S, 12, 1.2) + Math.ceil(5 / cols0) * lineH(S, 13, 1.6) + 70 * u;
  let y = A.y + (short ? 0 : Math.max(0, (A.h - est) * 0.35));
  // ── usar ──
  d.withAlpha(a0, () => {
    txt(S, S.l('Usar el modelo', 'Using the model'), x0, y + lineH(S, 14, 0.55), { s: 14, weight: 800 });
    txt(S, S.l('2 bytes por parámetro', '2 bytes per parameter'), x1, y + lineH(S, 14, 0.55), { s: 13, weight: 700, mono: true, c: tone(S, 'w').ink, align: 'right' });
  });
  y += lineH(S, 14, 1.2);
  d.withAlpha(a0, () => {
    d.rect(x0, y, x1 - x0, bh, { fill: alpha(p.ink, 0.04), stroke: p.line, lw: 1, r: 2 });
    swatch(S, X(0), y, X(2) - X(0), bh, TRAIN_PARTS[0]);
  });
  y += bh + (short ? 10 : 18) * u;
  // ── entrenar ──
  const total = TRAIN_PARTS.reduce((s, pt) => s + pt.bytes * grow(S, pt), 0);
  d.withAlpha(a0, () => {
    txt(S, S.l('Entrenarlo con Adam', 'Training it with Adam'), x0, y + lineH(S, 14, 0.55), { s: 14, weight: 800 });
    const shown = total < 0.05 ? '?' : S.l(`${S.n(Math.round(total), 0)} bytes por parámetro`, `${S.n(Math.round(total), 0)} bytes per parameter`);
    txt(S, shown, x1, y + lineH(S, 14, 0.55), { s: 13, weight: 800, mono: true, align: 'right' });
  });
  y += lineH(S, 14, 1.2);
  const by = y;
  d.withAlpha(a0, () => {
    d.rect(x0, by, x1 - x0, bh, { fill: alpha(p.ink, 0.04), stroke: p.line, lw: 1, r: 2 });
    let acc = 0;
    TRAIN_PARTS.forEach((pt) => {
      const g = grow(S, pt);
      if (g > 0.001) swatch(S, X(acc), by, (X(acc + pt.bytes) - X(acc)) * g, bh, pt);
      if (g > 0.001) d.line(X(acc), by, X(acc), by + bh, p.stage, 1.5);
      acc += pt.bytes * (g > 0 ? 1 : 0);
    });
    // regla de bytes
    for (let b = 0; b <= 16; b++) {
      const big = b % 4 === 0;
      d.line(X(b), by + bh, X(b), by + bh + (big ? 6 : 3) * u, p.lineStrong, 1.2);
      if (big) txt(S, String(b), X(b), by + bh + 8 * u, { s: 12, mono: true, c: p.mute, align: b === 0 ? 'left' : b === 16 ? 'right' : 'center', base: 'top' });
    }
  });
  y = by + bh + lineH(S, 12, 1.2) + (short ? 6 : 14) * u;
  // ── leyenda (desde train-grad) o la cuenta de 70 mil M (train-70) ──
  const legendA = (1 - a70);
  if (legendA > 0.01) {
    const cols = !port && A.w > 560 ? 2 : 1, rh = lineH(S, 13, short ? 1.35 : 1.6), colW = A.w / cols;
    TRAIN_PARTS.forEach((pt, i) => {
      const a = ap(S, pt.seg, WHEN[pt.id][0], WHEN[pt.id][0] + 0.1) * legendA;
      if (a <= 0) return;
      const cx = A.x + (i % cols) * colW, cy = y + Math.floor(i / cols) * rh + rh / 2, sw = 13 * u;
      d.withAlpha(a, () => {
        swatch(S, cx, cy - sw / 2, sw, sw, pt);
        fitText(S, S.l(pt.es, pt.en), cx + sw + 8 * u, cy, colW - sw - 60 * u, { s: 13, weight: 700 });
        txt(S, `${pt.bytes} B`, cx + colW - 14 * u, cy, { s: 13, weight: 800, mono: true, c: tone(S, pt.tone).ink, align: 'right' });
      });
    });
    const rows = Math.ceil(TRAIN_PARTS.length / cols), my = y + rows * rh + (short ? 4 : 12) * u;
    const aM = ap(S, 'train-16', 0.45, 0.6) * legendA;
    if (aM > 0) {
      const t1 = S.l('2 + 2 + 4 + 4 + 4 = 16 bytes: 8 veces lo de usarlo', '2 + 2 + 4 + 4 + 4 = 16 bytes: 8 times using it');
      fitText(S, t1, A.x, my + lineH(S, 14, 0.5), A.w, { s: 14, weight: 800, a: ap(S, 'train-16', 0.08, 0.22) * legendA });
      pill(S, S.l(`medido en una RTX 3060: ${S.n(TRAIN_MEASURED, 2)} bytes`, `measured on an RTX 3060: ${S.n(TRAIN_MEASURED, 2)} bytes`), A.x, my + lineH(S, 14, 1.25) + lineH(S, 12.5, 0.75), { tone: 'dat', s: 12.5, align: 'left', a: aM });
    } else {
      fitText(S, S.l('2 + 2 + 4 + 4 + 4 = 16 bytes: 8 veces lo de usarlo', '2 + 2 + 4 + 4 + 4 = 16 bytes: 8 times using it'), A.x, my + lineH(S, 14, 0.5), A.w, { s: 14, weight: 800, a: ap(S, 'train-16', 0.08, 0.22) * legendA });
    }
  }
  if (a70 > 0.01) {
    const t = S.l(`70 mil M × 16 bytes = ${S.n(1120, 0)} GB`, `70B × 16 bytes = ${S.n(1120, 0)} GB`);
    fitText(S, t, A.x, y + (short ? 4 : 12) * u + lineH(S, 17, 0.55), A.w, { s: 17, weight: 800, mono: true, a: a70 });
    const gy = y + (short ? 4 : 12) * u + lineH(S, 17, 1.2) + (short ? 8 : 22) * u, n = 14, cols = short ? 14 : 7, nRows = short ? 1 : 2, gap = (short ? 5 : 8) * u;
    const bw = Math.min(72 * u, (A.w - gap * (cols - 1)) / cols), bH = Math.max(14 * u, Math.min(bw * 0.62, (A.y + A.h - gy - lineH(S, 12.5, 1.6)) / nRows - gap - (short ? 0 : 12) * u));
    const fill = fr(S, 'train-70', 0.12, 0.6) * n;
    for (let i = 0; i < n; i++) {
      const cx = A.x + (i % cols) * (bw + gap), cy = gy + Math.floor(i / cols) * (bH + gap + (short ? 0 : 12) * u), f = clamp(fill - i);
      gpuBox(S, { x: cx, y: cy, w: bw, h: bH }, '', { a: a70 * ap(S, 'train-70', 0.08 + i * 0.012, 0.16 + i * 0.012) });
      if (f > 0) d.rect(cx + 3 * u, cy + bH - 3 * u - (bH - 6 * u) * f, bw - 6 * u, (bH - 6 * u) * f, { fill: alpha(tone(S, 'w').c, 0.7 * a70) });
      if (f > 0.95 && bH > lineH(S, 12, 1.1)) txt(S, '80', cx + bw / 2, cy + bH / 2, { s: 12, weight: 800, mono: true, c: p.stage, align: 'center', a: a70 });
    }
    const ly = gy + nRows * (bH + gap + (short ? 0 : 12) * u);
    fitText(S, S.l('14 H100 de 80 GB llenas, sin contar las activaciones', '14 full 80 GB H100s, not counting activations'), A.x, ly + lineH(S, 12.5, 0.4), A.w, { s: 12.5, weight: 700, c: p.ink2, a: ap(S, 'train-70', 0.55, 0.7) });
  }
  provenance(S, S.l('Adam en precisión mixta: ZeRO (2020), §3.1 · medido con measure-memory.py en una RTX 3060', 'Adam in mixed precision: ZeRO (2020), §3.1 · measured with measure-memory.py on an RTX 3060'), a0);
  void measure;
}
