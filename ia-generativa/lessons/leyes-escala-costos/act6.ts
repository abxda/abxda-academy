// Acto 6 · Qué decides tú: casi nadie entrena desde cero. Los 16 384 GPU de Llama 3.1, la escalera de opciones y el puente.
import { alpha, clamp, neu, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REF, flops, gpuHours, nf, sci } from './model';
import { FS, fitText, log10, pow10 } from './ui';
import { params } from './act3';

export function drawAct6(S: Frame) {
  const R = regions(S, 0.68);
  const aScratch = S.at('from-scratch', 0, 0.8) * (1 - S.at('instead', 0, 0.8));
  const aLadder = S.at('instead', 0, 0.8) * (1 - S.at('bridge', 0, 0.8));
  if (aScratch > 0.01) S.d.withAlpha(aScratch, () => drawScratch(S, R.all));
  if (aLadder > 0.01) S.d.withAlpha(aLadder, () => drawLadder(S, R.all));
  if (S.on('bridge')) S.d.withAlpha(S.at('bridge', 0, 0.8), () => drawBridge(S));
}

// ── 16 384 GPU: cada punto son 16 ───────────────────────────────────────────────
function drawScratch(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat'), port = S.portrait;
  const gridBox: Rect = port ? { x: r.x, y: r.y, w: r.w, h: r.h * 0.46 } : { x: r.x, y: r.y, w: r.w * 0.5, h: r.h };
  const txt: Rect = port ? { x: r.x, y: r.y + r.h * 0.48, w: r.w, h: r.h * 0.52 } : { x: r.x + r.w * 0.54, y: r.y, w: r.w * 0.46, h: r.h };
  const n = 32, side = Math.min(gridBox.w, gridBox.h - 6 * u), cell = side / n, gx = gridBox.x + (gridBox.w - side) / 2, gy = gridBox.y + (gridBox.h - side) / 2;
  const prog = S.at('from-scratch', 0.3, 3.2, 'lin') * n * n;
  for (let k = 0; k < n * n; k++) {
    const a = clamp(prog - k + 1);
    if (a <= 0) break;
    const i = k % n, j = Math.floor(k / n);
    d.rect(gx + i * cell, gy + j * cell, cell - 1.2, cell - 1.2, { fill: alpha(dat.c, 0.85), a });
  }
  const a1 = S.reveal('from-scratch', 0.6, 0.6);
  d.text('Llama 3.1 405B', txt.x, txt.y + 8 * u, { size: FS(S, 18), weight: 800, color: p.ink, base: 'top', a: a1 });
  d.text(S.l('hasta', 'up to'), txt.x, txt.y + 34 * u, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top', a: S.reveal('from-scratch', 1.0, 0.6) });
  fitText(S, `${nf(REF.llama31.gpus, 0, S.lang)} GPU H100`, txt.x, txt.y + 52 * u, txt.w, 24, { weight: 800, font: 'mono', color: dat.ink, base: 'top' });
  d.text(S.l('cada punto = 16 GPU', 'each dot = 16 GPUs'), txt.x, txt.y + 82 * u, { size: FS(S, 12.5), weight: 600, color: p.mute, base: 'top', a: S.reveal('from-scratch', 1.4, 0.6) });
  // lo que la calculadora no incluye
  const items = [S.l('datos y su limpieza', 'data and its cleaning'), S.l('personal', 'staff'), S.l('ensayos y experimentos', 'trials and experiments'), S.l('corridas fallidas', 'failed runs')];
  const y0 = txt.y + 114 * u;
  d.text(S.l('La calculadora no incluye:', 'The calculator leaves out:'), txt.x, y0, { size: FS(S, 13.5), weight: 800, color: p.ink2, base: 'top', a: S.reveal('from-scratch', 3.0, 0.5) });
  items.forEach((t, i) => {
    const a = S.reveal('from-scratch', 3.5 + i * 0.5, 0.5), y = y0 + 24 * u + i * 22 * u;
    d.withAlpha(a, () => {
      d.rect(txt.x, y - 6 * u, 12 * u, 12 * u, { stroke: tone(S, 'err').c, lw: 1.8, dash: [3, 2], r: 2 });
      fitText(S, t, txt.x + 20 * u, y, txt.w - 24 * u, 13.5, { weight: 600, color: p.ink, base: 'middle' });
    });
  });
}

// ── la escalera: de «usar» a «entrenar desde cero» ──────────────────────────────
function drawLadder(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat'), lang = S.lang;
  const { cl } = params(S);
  const eff = cl.peakTflops * 1e12 * cl.mfu;                  // FLOP/s efectivos por GPU, con tus supuestos
  const rows: { name: string; C: number; delay: number; none?: boolean }[] = [
    { name: S.l('Usar un modelo ya entrenado, con tus documentos', 'Use an already-trained model, with your documents'), C: 0, delay: 0.4, none: true },
    { name: S.l('Ajustar un modelo de 7 mil M con 100 M de tokens', 'Fine-tune a 7B model on 100M tokens'), C: flops(7e9, 1e8), delay: 1.8 },
    { name: S.l('Preentrenar uno de 7 mil M con 140 mil M de tokens', 'Pretrain a 7B model on 140B tokens'), C: flops(7e9, 1.4e11), delay: 3.2 },
    { name: S.l('Llama 3.1 405B: 405 mil M y 15.6 billones', 'Llama 3.1 405B: 405B and 15.6T'), C: flops(REF.llama31.N, REF.llama31.D), delay: 4.6 },
  ];
  const LO = 17, HI = 26;
  const top = r.y + 4 * u, foot = 22 * u, rowH = Math.min(78 * u, (r.h - foot - 6 * u) / 4);
  rows.forEach((row, i) => {
    const a = S.reveal('instead', row.delay, 0.6), y = top + i * rowH;
    if (a <= 0) return;
    d.withAlpha(a, () => {
      fitText(S, row.name, r.x, y, r.w, 14, { weight: 700, color: p.ink, base: 'top' });
      const by = y + 24 * u, bh = 13 * u;
      if (row.none) {
        d.text(S.l('sin entrenamiento: 0 FLOPs de entrenamiento', 'no training: 0 training FLOPs'), r.x, by + bh / 2, { size: FS(S, 13), weight: 700, color: tone(S, 'sig').ink, base: 'middle' });
        return;
      }
      const fr = clamp((log10(row.C) - LO) / (HI - LO));
      d.rect(r.x, by, r.w, bh, { fill: p.surface2 });
      d.rect(r.x, by, r.w * fr * a, bh, { fill: dat.c });
      const hrs = row.C / (eff * 3600);
      d.text(sci(row.C, lang, 1), r.x, by + bh + 4 * u, { size: FS(S, 13), weight: 800, font: 'mono', color: dat.ink, base: 'top' });
      d.text(`≈ ${gpuHours(hrs, lang)} ${S.l('horas de GPU', 'GPU-hours')}`, r.x + r.w, by + bh + 4 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'top' });
    });
  });
  d.text(S.l('Escala logarítmica: 10¹⁷ → 10²⁶ · solo cómputo, con tus supuestos de pico y MFU', 'Log scale: 10¹⁷ → 10²⁶ · compute only, with your peak and MFU assumptions'), r.x, r.y + r.h, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom', a: S.reveal('instead', 5.4, 0.6), w: r.w });
  void pow10;
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 70 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 60 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('GPUs, memoria y cuantización', 'GPUs, memory, and quantization'), cx, cy + 92 * u, { size: 24, weight: 800, align: 'center', w: S.W * 0.9 });
  });
}
