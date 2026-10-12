// Vista de lo que paga quien usa un modelo: precios de entrada y de salida, por qué la salida es más cara, la fórmula del
// costo de una tarea y la ficha de tres tareas (tokens, costo y espera). Segmentos: api-price … try-task.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { PRICE_IN, PRICE_OUT, TASKS, bill, type TaskId } from './model';
import { area, chip, chipW, fitText, fits, fr, fz, hbar, int, para, paraH, secs, tight, tok, usd } from './ui';

const SCALE = { tok: 40000, cost: 0.13, time: 20 };
/** Montos pequeños: tres decimales, o cuatro si no llega a un centavo. */
const cents = (S: Frame, x: number) => usd(S, x, x < 0.01 ? 4 : 3);

const capText = (S: Frame) => S.l('precios de ejemplo · en las listas de Anthropic y Google, la salida cuesta 5 veces o más', 'example prices · on Anthropic’s and Google’s lists, output costs 5 times as much or more');

function layout(S: Frame) {
  const u = S.u, R = area(S), T = tight(S);
  const tagH = fz(S, 13.5) * u + 12 * u;
  const capH = T && !S.portrait ? 0 : paraH(S, capText(S), R.w, 12) + 2 * u;   // en teléfono horizontal no hay sitio: lo dice la voz y el pie
  const top = R.y + 4 * u;
  const formulaY = top + tagH + capH + 14 * u;
  const formulaH = fz(S, 14) * u * 1.5 * (S.portrait ? 2 : 1);
  const main: Rect = { x: R.x, y: formulaY + formulaH + (T ? 8 : 14) * u, w: R.w, h: R.y + R.h - (formulaY + formulaH + (T ? 8 : 14) * u) };
  return { R, top, tagH, formulaY, formulaH, main };
}

export function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S), R = L.R, P = S.portrait;
  const lat = tone(S, 'lat'), sg = tone(S, 'sig');
  // ── precios ──
  const a1 = fr(S, 'api-price', 0.15, 0.3), a2 = fr(S, 'api-price', 0.3, 0.45), aX = fr(S, 'api-price', 0.6, 0.72);
  const ty = L.top + L.tagH / 2, half = R.w / 2;
  const gapX = (P ? 26 : 34) * u;
  // si no caben con «por millón», se abrevia a «/ millón»
  const long = chipW(S, S.l(`salida: ${usd(S, PRICE_OUT, 0)} por millón`, `output: ${usd(S, PRICE_OUT, 0)} per million`), 12) <= half - gapX / 2;
  const per = long ? S.l(' por millón', ' per million') : S.l(' / millón', ' / million');
  const tIn = S.l(`entrada: ${usd(S, PRICE_IN, 0)}`, `input: ${usd(S, PRICE_IN, 0)}`) + per;
  const tOut = S.l(`salida: ${usd(S, PRICE_OUT, 0)}`, `output: ${usd(S, PRICE_OUT, 0)}`) + per;
  chip(S, tIn, R.x + half - gapX / 2, ty, 'lat', { align: 'right', a: a1, size: 13.5, dash: true, maxW: half - gapX / 2 });
  chip(S, tOut, R.x + half + gapX / 2, ty, 'sig', { align: 'left', a: a2, size: 13.5, dash: true, maxW: half - gapX / 2 });
  fitText(S, '×5', R.x + half, ty, gapX, { size: 14, weight: 800, font: 'mono', color: p.ink2, align: 'center', base: 'middle', a: aX });
  if (!tight(S) || P) para(S, capText(S), R.x + R.w / 2, L.top + L.tagH + 4 * u, R.w, { size: 12, weight: 600, color: p.mute, align: 'center', italic: true, a: aX });
  // ── la fórmula ──
  if (S.on('cost-formula')) {
    const a = fr(S, 'cost-formula', 0.05, 0.25);
    const f1 = S.l('costo = tokens de entrada × su precio', 'cost = input tokens × their price');
    const f2 = S.l('+ tokens de salida × su precio', '+ output tokens × their price');
    const size = 14.5;
    if (P) {
      fitText(S, f1, R.x + R.w / 2, L.formulaY, R.w, { size, weight: 800, color: p.ink, align: 'center', base: 'top', a });
      fitText(S, f2, R.x + R.w / 2, L.formulaY + fz(S, size) * u * 1.4, R.w, { size, weight: 800, color: p.ink, align: 'center', base: 'top', a: fr(S, 'cost-formula', 0.2, 0.35) });
    } else fitText(S, `${f1} ${f2}`, R.x + R.w / 2, L.formulaY, R.w, { size, weight: 800, color: p.ink, align: 'center', base: 'top', a });
  }
  // ── por qué la salida cuesta más (why-output) ──
  const whyA = S.on('why-output') ? fr(S, 'why-output', 0.02, 0.15) * (S.on('task-contract') ? 1 - fr(S, 'task-contract', 0, 0.12) : 1) : 0;
  if (whyA > 0.01) d.withAlpha(whyA, () => drawWhy(S, L.main));
  // ── la ficha de la tarea ──
  if (S.on('task-contract')) d.withAlpha(fr(S, 'task-contract', 0.05, 0.18), () => drawTask(S, L.main));
  void lat; void sg;
}

function drawWhy(S: Frame, M: Rect) {
  const { d, pal: p } = S, u = S.u, P = S.portrait, lat = tone(S, 'lat'), sg = tone(S, 'sig');
  const halves: Rect[] = P ? [{ x: M.x, y: M.y, w: M.w, h: M.h * 0.48 }, { x: M.x, y: M.y + M.h * 0.52, w: M.w, h: M.h * 0.48 }]
    : [{ x: M.x, y: M.y, w: M.w * 0.47, h: M.h }, { x: M.x + M.w * 0.53, y: M.y, w: M.w * 0.47, h: M.h }];
  const n = 6, gap = 5 * u;
  halves.forEach((h, k) => {
    const a = k === 0 ? fr(S, 'why-output', 0.1, 0.25) : fr(S, 'why-output', 0.45, 0.6);
    d.withAlpha(a, () => {
      const title = k === 0 ? S.l('entrada: una pasada para todos', 'input: one pass for all') : S.l('salida: una vuelta por token', 'output: one turn per token');
      fitText(S, title, h.x + h.w / 2, h.y, h.w, { size: 14, weight: 800, color: k === 0 ? lat.ink : sg.ink, align: 'center', base: 'top' });
      const tw = Math.min(54 * u, (h.w - (n - 1) * gap) / n), th = Math.max(fz(S, 12) * u + 10 * u, 24 * u);
      const x0 = h.x + (h.w - (n * tw + (n - 1) * gap)) / 2, yT = h.y + fz(S, 14) * u * 1.5 + 8 * u;
      const mY = yT + th + Math.max(20 * u, (h.h - (yT - h.y) - th - 40 * u) * 0.45), mH = Math.max(fz(S, 13) * u + 12 * u, 28 * u);
      const mx = h.x + h.w * 0.2, mw = h.w * 0.6;
      for (let i = 0; i < n; i++) {
        const r = { x: x0 + i * (tw + gap), y: yT, w: tw, h: th };
        const ta = k === 0 ? 1 : fr(S, 'why-output', 0.55 + 0.06 * i, 0.6 + 0.06 * i);
        tok(S, r, String(i + 1), { t: k === 0 ? 'lat' : 'sig', a: ta, size: 13 });
        if (k === 1 && ta > 0.01) d.withAlpha(ta, () => curveArrow2(S, r.x + r.w / 2, mY, r.x + r.w / 2, r.y + r.h + 2 * u, sg.c));
      }
      if (k === 0) {
        // una sola flecha gruesa: todos juntos
        d.arrow(h.x + h.w / 2, yT + th + 3 * u, h.x + h.w / 2, mY - 3 * u, lat.c, 3, 9 * Math.max(0.8, u));
      }
      d.rect(mx, mY, mw, mH, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 4 });
      fitText(S, k === 0 ? S.l('1 lectura de la memoria', '1 memory read') : S.l('6 lecturas de la memoria', '6 memory reads'), mx + mw / 2, mY + mH / 2, mw - 10 * u, { size: 13, weight: 700, color: p.ink, align: 'center', base: 'middle' });
    });
  });
}
function curveArrow2(S: Frame, x1: number, y1: number, x2: number, y2: number, c: string) {
  S.d.arrow(x1, y1 - 2 * S.u, x2, y2, c, 1.5, 6 * Math.max(0.8, S.u));
}

function drawTask(S: Frame, M: Rect) {
  const { d, pal: p } = S, u = S.u, P = S.portrait, T = tight(S);
  const lat = tone(S, 'lat'), sg = tone(S, 'sig'), dat = tone(S, 'dat');
  const id = (S.st.taskId ?? 'contract') as TaskId, b = bill(id);
  const ease = (S.st.taskEase ?? { tin: b.tin, tout: b.tout, cin: b.cin, cout: b.cout, first: b.first, gen: b.gen }) as Record<string, number>;
  // título
  const titleH = fz(S, 16) * u * 1.4;
  fitText(S, `${S.l(TASKS[id].es, TASKS[id].en)}: ${int(S, b.tin)} → ${int(S, b.tout)} tokens`, M.x, M.y, M.w, { size: 16, weight: 800, color: p.ink, base: 'top' });
  const rowsY = M.y + titleH + 6 * u, rh = (M.y + M.h - rowsY) / 3;
  const labW = P ? M.w : Math.min(150 * u, M.w * 0.22);
  const stacked = P;
  const row = (i: number, label: string, fn: (bar: Rect, y: number) => void, a: number) => {
    const y = rowsY + i * rh;
    d.withAlpha(a, () => {
      fitText(S, label, M.x, stacked ? y : y + rh * 0.35, labW, { size: 14, weight: 800, color: p.ink2, base: stacked ? 'top' : 'middle' });
      const by = stacked ? y + fz(S, 13) * u * 1.4 + 2 * u : y + rh * 0.35 - 8 * u;
      fn({ x: stacked ? M.x : M.x + labW + 10 * u, y: by, w: stacked ? M.w : M.w - labW - 10 * u, h: Math.max(12 * u, Math.min(18 * u, rh * 0.22)) }, y);
    });
  };
  const below = (bar: Rect) => bar.y + bar.h + 4 * u;
  // fila 1: tokens
  row(0, S.l('tokens', 'tokens'), (bar) => {
    const h = bar.h * 0.5;
    hbar(S, { x: bar.x, y: bar.y - 2 * u, w: bar.w, h }, ease.tin / SCALE.tok, 'lat', { min: 2 });
    hbar(S, { x: bar.x, y: bar.y - 2 * u + h + 3 * u, w: bar.w, h }, ease.tout / SCALE.tok, 'sig', { min: 2 });
    const t = S.l(`entrada ${int(S, b.tin)} · salida ${int(S, b.tout)}`, `input ${int(S, b.tin)} · output ${int(S, b.tout)}`);
    para(S, t, bar.x, below(bar) + 2 * u, bar.w, { size: S.portrait ? 12.5 : 13.5, weight: 700, color: p.ink2, lh: 1.15 });
  }, 1);
  // fila 2: costo (barra apilada: entrada + salida)
  row(1, S.l('costo', 'cost'), (bar) => {
    d.rect(bar.x, bar.y, bar.w, bar.h, { fill: p.surface2 });
    const wi = bar.w * clamp(ease.cin / SCALE.cost), wo = bar.w * clamp(ease.cout / SCALE.cost);
    d.rect(bar.x, bar.y, Math.max(2, wi), bar.h, { fill: alpha(lat.c, 0.85) });
    d.rect(bar.x + Math.max(2, wi), bar.y, Math.max(2, wo), bar.h, { fill: alpha(sg.c, 0.85) });
    const share = Math.round(b.shareIn * 100);
    const full = S.l(`entrada ${cents(S, b.cin)} (${share} %) · salida ${cents(S, b.cout)} (${100 - share} %) · total ${cents(S, b.total)}`,
      `input ${cents(S, b.cin)} (${share}%) · output ${cents(S, b.cout)} (${100 - share}%) · total ${cents(S, b.total)}`);
    const short = S.l(`entrada ${cents(S, b.cin)} (${share} %) · salida ${cents(S, b.cout)} (${100 - share} %)`, `input ${cents(S, b.cin)} (${share}%) · output ${cents(S, b.cout)} (${100 - share}%)`);
    const shortest = S.l(`entrada ${cents(S, b.cin)} · salida ${cents(S, b.cout)}`, `input ${cents(S, b.cin)} · output ${cents(S, b.cout)}`);
    const t = fits(S, full, bar.w, { size: 12.5, weight: 700 }) ? full : fits(S, short, bar.w, { size: 12.5, weight: 700 }) ? short : shortest;
    para(S, t, bar.x, below(bar) + 2 * u, bar.w, { size: S.portrait ? 12.5 : 13.5, weight: 700, color: p.ink2, lh: 1.15 });
  }, fr(S, 'task-contract', 0.35, 0.5));
  // fila 3: espera estimada (primer token + escribir)
  row(2, S.l('espera (estimada)', 'wait (estimated)'), (bar) => {
    d.rect(bar.x, bar.y, bar.w, bar.h, { fill: p.surface2 });
    const wf = bar.w * clamp(ease.first / SCALE.time), wg = bar.w * clamp(ease.gen / SCALE.time);
    d.rect(bar.x, bar.y, Math.max(2, wf), bar.h, { fill: alpha(dat.c, 0.9) });
    d.rect(bar.x + Math.max(2, wf), bar.y, Math.max(2, wg), bar.h, { fill: alpha(sg.c, 0.6) });
    d.rect(bar.x, bar.y, bar.w, bar.h, { stroke: p.lineStrong, lw: 1, dash: [4, 3] });
    const t = S.l(`primer token: ${secs(S, b.first)} · respuesta completa: ${secs(S, b.time)}`, `first token: ${secs(S, b.first)} · full answer: ${secs(S, b.time)}`);
    para(S, t, bar.x, below(bar) + 2 * u, bar.w, { size: S.portrait ? 12.5 : 13.5, weight: 700, color: p.ink2, lh: 1.15 });
  }, S.on('task-wait') ? fr(S, 'task-wait', 0.05, 0.18) : 0);
  void para; void paraH;
}
