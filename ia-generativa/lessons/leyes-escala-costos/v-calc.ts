// Vista 5 · De operaciones a tiempo y dinero: la calculadora. Se arma fila por fila con Llama 3.1 405B (cifras reales:
// parámetros, tokens, cómputo, GPU usadas, velocidad medida y horas reportadas) y dos SUPUESTOS a la vista (borde punteado):
// 400 billones de operaciones útiles por segundo por GPU y 2 dólares por hora de GPU. Luego recorre otros modelos.
import { alpha, regions, split, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { GPUS, MODELS, PEAK, PRICE, USEFUL, calc, type ModelId } from './data';
import { bigCount, count, duration, fits, fitSize, fitText, fr, fz, kk, lineH, money, roomy, sci, sig } from './ui';

interface Row { id: string; label: string; short?: string; value: string; t: Tone; on: number; assume?: boolean; sub?: string; subOn?: number; bar?: { full: number; fill: number } }

function rowsOf(S: Frame, id: ModelId) {
  const m = MODELS[id], c = calc(m), es = S.lang === 'es';
  const per = (x: number) => (es ? `${sig(S, x / 1e12, 3)} billones/s` : `${sig(S, x / 1e12, 3)} trillion/s`);
  const real = fr(S, 'gpu-real', 0.35, 0.55);
  const vRow: Row = real > 0.5
    ? { id: 'v', label: S.l('velocidad útil de una GPU (supuesto)', 'useful speed of one GPU (assumption)'), short: S.l('velocidad útil (supuesto)', 'useful speed (assumed)'), value: per(USEFUL), t: 'dat', on: 1, assume: true, bar: { full: fr(S, 'gpu-speed', 0.55, 0.8), fill: real } }
    : { id: 'v', label: S.l('una GPU H100, como máximo', 'one H100 GPU, at most'), short: S.l('H100, máximo', 'H100, at most'), value: per(PEAK), t: 'dat', on: fr(S, 'gpu-speed', 0.45, 0.65), bar: { full: fr(S, 'gpu-speed', 0.55, 0.8), fill: real } };
  const hoursSub = m.reportedHours ? S.l(`Meta reportó ${bigCount(S, m.reportedHours)}`, `Meta reported ${bigCount(S, m.reportedHours)}`) : undefined;
  const left: Row[] = [
    { id: 'N', label: S.l('parámetros N', 'parameters N'), value: count(S, m.N), t: 'w', on: fr(S, 'llama', 0.2, 0.32) },
    { id: 'D', label: S.l('tokens de entrenamiento D', 'training tokens D'), short: S.l('tokens D', 'tokens D'), value: count(S, m.D), t: 'lat', on: fr(S, 'llama', 0.35, 0.47) },
    { id: 'C', label: S.l('cómputo C = 6 · N · D', 'compute C = 6 · N · D'), short: 'C = 6 · N · D', value: `${sci(S, c.C)} FLOPs`, t: 'dat', on: fr(S, 'llama', 0.68, 0.8) },
  ];
  const right: Row[] = [
    vRow,
    { id: 'h', label: S.l('horas de GPU = C ÷ velocidad útil', 'GPU-hours = C ÷ useful speed'), short: S.l('horas de GPU', 'GPU-hours'), value: bigCount(S, c.hours), t: 'dat', on: fr(S, 'hours', 0.3, 0.45), sub: hoursSub, subOn: fr(S, 'hours', 0.65, 0.8) },
    { id: 'one', label: S.l('tiempo con una sola GPU', 'time on a single GPU'), short: S.l('con una GPU', 'on one GPU'), value: duration(S, c.oneGpuH), t: 'sig', on: fr(S, 'parallel', 0.08, 0.22) },
    { id: 'many', label: S.l(`con ${S.n(GPUS, 0)} GPU a la vez`, `with ${S.n(GPUS, 0)} GPUs at once`), short: S.l(`con ${S.n(GPUS, 0)} GPU`, `on ${S.n(GPUS, 0)} GPUs`), value: duration(S, c.manyGpuH), t: 'sig', on: fr(S, 'parallel', 0.55, 0.7) },
    { id: 'cost', label: S.l(`costo a US$ ${PRICE} por hora de GPU (supuesto)`, `cost at $${PRICE} per GPU-hour (assumption)`), short: S.l(`costo a US$ ${PRICE}/h (supuesto)`, `cost at $${PRICE}/h (assumed)`), value: money(S, c.cost), t: 'err', on: fr(S, 'money', 0.35, 0.5), assume: true },
  ];
  return { m, left, right };
}

function drawRow(S: Frame, r: Rect, row: Row, flash: number) {
  const { d, pal: p } = S, k = kk(S), c = tone(S, row.t), b = roomy(S);
  if (row.on < 0.01) return;
  d.withAlpha(row.on, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.06 + 0.12 * flash), stroke: row.assume ? p.ink2 : c.c, lw: flash > 0.3 ? 2.2 : 1.3, r: 3, dash: row.assume ? [5, 4] : undefined });
    const pad = 8 * k;
    const vSize = fitSize(S, row.value, r.w * 0.55, 15.5 * b, { weight: 800, font: 'mono' });
    const vw = d.measure(row.value, { size: vSize, weight: 800, font: 'mono' });
    const labW = r.w - vw - 3 * pad;
    const hasSub = !!row.sub && (row.subOn ?? 0) > 0.01;
    const midY = r.y + r.h / 2;
    // rótulo: una línea que se achica; si no cabe, se parte en dos (si hay alto)
    const lsz = 12.5 * b;
    const lines = d.wrap(row.label, labW, { size: fz(S, lsz), weight: 700 });
    const lh = lineH(S, lsz, 1.15);
    const twoOK = r.h >= lh * 2 + 6 * k && !hasSub;
    const subTwo = hasSub && r.h >= lh * 2 + 4 * k;
    const fitsL = (str: string) => d.measure(str, { size: fz(S, 12), weight: 700 }) <= labW;
    const lab = fitsL(row.label) || (twoOK && lines.length <= 2 && !hasSub) ? row.label : row.short ?? row.label;
    d.clip(r.x + 2, r.y, labW + pad, r.h, () => {
      if (hasSub && !subTwo) {
        // fila baja: rótulo corto y la nota en la misma línea
        const sl = row.short ?? row.label, lw = d.measure(sl, { size: fz(S, lsz), weight: 700 });
        d.text(sl, r.x + pad, midY, { size: fz(S, lsz), weight: 700, color: p.ink2, base: 'middle' });
        fitText(S, `· ${row.sub}`, r.x + pad + lw + 6 * k, midY, labW - lw - 6 * k, { size: 12, weight: 700, color: tone(S, 'w').ink, base: 'middle', a: row.subOn, italic: true });
      } else if (lab !== row.label || lines.length === 1 || !twoOK) {
        const subLab = subTwo && !fitsL(row.label) ? row.short ?? row.label : lab;
        const ly = subTwo ? midY - lh / 2 : midY;
        fitText(S, subLab, r.x + pad, ly, labW, { size: lsz, weight: 700, color: p.ink2, base: 'middle' });
        if (subTwo) fitText(S, row.sub!, r.x + pad, midY + lh / 2, labW, { size: 12, weight: 700, color: tone(S, 'w').ink, base: 'middle', a: row.subOn, italic: true });
      } else {
        lines.slice(0, 2).forEach((ln, i) => d.text(ln, r.x + pad, midY + (i - 0.5) * lh, { size: fz(S, lsz), weight: 700, color: p.ink2, base: 'middle' }));
      }
    });
    d.text(row.value, r.x + r.w - pad, midY, { size: vSize, weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    if (row.bar && row.bar.full > 0.01) {
      const bx = r.x + pad, bw = r.w - 2 * pad, by = r.y + r.h - 5 * k;
      d.line(bx, by, bx + bw * row.bar.full, by, alpha(c.c, 0.35), 3);
      if (row.bar.fill > 0.01) d.line(bx, by, bx + bw * (USEFUL / PEAK) * row.bar.fill, by, c.c, 3);
    }
  });
}

export function drawCalc(S: Frame) {
  const { d, pal: p } = S, k = kk(S), all = regions(S).all, b = roomy(S);
  const id = (S.st.model as ModelId) ?? 'llama';
  const { m, left, right } = rowsOf(S, id);
  const flash = Math.max(0, 1 - (S.clock - ((S.st.flash as number) ?? -9)) / 0.9);
  const g = 7 * k;
  const footer = S.l('borde punteado = supuesto · solo la corrida final', 'dashed border = assumption · final run only');
  const footer2 = S.l('con estos supuestos, no los costos históricos de cada modelo', 'with these assumptions, not each model’s historical cost');
  const fH = lineH(S, 12) + 4 * k;
  const head = `${m.name}`, who = m.who;
  const headA = fr(S, 'llama', 0.05, 0.2);
  const headH = lineH(S, 17 * b) + 8 * k;
  let leftR: Rect, rightR: Rect;
  const body: Rect = { x: all.x, y: all.y, w: all.w, h: all.h - fH * (S.on('calc-demo') ? 2 : 1) };
  if (S.portrait) { leftR = body; rightR = body; }
  else[leftR, rightR] = split(body, 'h', 0.44, 14 * k);
  // encabezado: el modelo
  if (headA > 0.01) {
    const hx = leftR.x, hw = leftR.w;
    const nameS = fitSize(S, head, hw * 0.7, 17 * b, { weight: 800 });
    d.text(head, hx, leftR.y, { size: nameS, weight: 800, color: p.ink, base: 'top', a: headA });
    const nw = d.measure(head, { size: nameS, weight: 800 });
    if (nw + 10 * k + d.measure(who, { size: fz(S, 12), weight: 600 }) <= hw) d.text(who, hx + nw + 10 * k, leftR.y + nameS * S.u * 0.15, { size: fz(S, 12), weight: 600, color: p.mute, base: 'top', a: headA });
  }
  if (S.portrait) {
    const rows = [...left, ...right], n = rows.length;
    const top = body.y + headH, rh = Math.min(50 * k, (body.h - headH - g * (n - 1)) / n);
    rows.forEach((row, i) => drawRow(S, { x: body.x, y: top + i * (rh + g), w: body.w, h: rh }, row, row.id === 'v' ? 0 : flash));
  } else {
    const n = right.length, rh = Math.min(64 * k * b, (rightR.h - g * (n - 1)) / n);
    right.forEach((row, i) => drawRow(S, { x: rightR.x, y: rightR.y + i * (rh + g), w: rightR.w, h: rh }, row, row.id === 'v' ? 0 : flash));
    const top = leftR.y + headH;
    left.forEach((row, i) => drawRow(S, { x: leftR.x, y: top + i * (rh + g), w: leftR.w, h: rh }, row, flash));
    // flechas entre filas de la izquierda y la derecha: C → horas
    const ca = left[2].on * right[1].on;
    if (ca > 0.01) {
      const yC = top + 2 * (rh + g) + rh / 2, yH = rightR.y + (rh + g) + rh / 2;
      d.arrow(leftR.x + leftR.w + 2 * k, yC, rightR.x - 3 * k, yH, p.mute, 1.6, 6 * k, ca);
    }
  }
  // pie: qué es supuesto
  const fa = fr(S, 'gpu-real', 0.5, 0.7);
  const fy = all.y + all.h - (S.on('calc-demo') ? fH : 0);
  const f1 = fits(S, footer, all.w) ? footer : S.l('borde punteado = supuesto', 'dashed border = assumption');
  fitText(S, f1, all.x, fy, all.w, { size: 12, weight: 600, color: p.mute, base: 'bottom', a: fa, italic: true });
  const f2 = fits(S, footer2, all.w, { weight: 700 }) ? footer2 : S.l('con estos supuestos, no costos históricos', 'with these assumptions, not historical costs');
  if (S.on('calc-demo')) fitText(S, f2, all.x, all.y + all.h, all.w, { size: 12, weight: 700, color: p.ink2, base: 'bottom', a: fr(S, 'calc-demo', 0.1, 0.25), italic: true });
}
