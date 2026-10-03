// Acto 4 · El reparto de un presupuesto fijo: parámetros frente a tokens (Chinchilla, Hoffmann et al., 2022).
// Plano log-log (N, D) con la recta de igual cómputo y el valle de pérdida; la pérdida es el ajuste L̂(N,D)
// de Hoffmann con las constantes re-estimadas por Besiroglu et al. (2024). Ver model.ts.
import { Plot, alpha, clamp, lerp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { Lhat, Nopt, Dopt, REF, count, nf, sci, sig, A_EXP, B_EXP } from './model';
import { FS, axes, fitText, log10, pow10, tagText } from './ui';

const XR: [number, number] = [8.8, 12.4], YR: [number, number] = [9.8, 15.0];
const LN = (n: number) => log10(n);

/** Presupuesto de cómputo que muestra el plano en cada momento. */
export function budgetNow(S: Frame): number {
  if (S.between('try-budget', 'both-grow')) return 10 ** (S.p.c2 ?? 23.76);
  if (S.on('both-grow') && !S.on('rule')) return 10 ** lerp(22.4, 24.6, S.at('both-grow', 0.4, 4.6, 'io'));
  return REF.gopherBudget;
}
const logDof = (C: number, logN: number) => log10(C / 6) - logN;

export function drawAct4(S: Frame) {
  const { d } = S, u = S.u;
  const R = regions(S, S.portrait ? 0.62 : 0.6);
  const plot = new Plot(S, R.main, { xr: XR, yr: YR, pad: { l: 44, b: 44, t: 24, r: 10 } });
  const a = S.reveal('budget-intro', 0, 0.7), C = budgetNow(S), lC = log10(C);
  const red = tone(S, 'err');

  d.withAlpha(a, () => {
    plot.heat((x, y) => Lhat(10 ** x, 10 ** y), (v) => alpha(red.c, 0.02 + 0.3 * clamp((v - 1.9) / 0.75)), [44, 32]);
    plot.contours((x, y) => Lhat(10 ** x, 10 ** y), [1.95, 2.0, 2.1, 2.25, 2.5], 'mute', { res: 56, lw: 1, a: 0.55 });
    axes(S, plot, { xTicks: [9, 10, 11, 12], yTicks: [10, 11, 12, 13, 14, 15], xFmt: pow10, yFmt: pow10, xLabel: S.l('parámetros N', 'parameters N'), yLabel: S.l('tokens de entrenamiento D', 'training tokens D') });
  });
  if (a <= 0) return;

  // la recta de igual cómputo
  d.withAlpha(a, () => {
    plot.line(XR[0], logDof(C, XR[0]), XR[1], logDof(C, XR[1]), 'dat', 3);
    const lx = S.portrait ? 9.05 : 9.0, ly = logDof(C, lx);
    const t = S.n(lC, 1) === '' ? '' : sci(C, S.lang, 2);
    tagText(S, S.l(`mismo cómputo: ${t}`, `same compute: ${t}`), plot.X(lx) + 4 * u, plot.Y(ly) - 17 * u, { t: 'dat', align: 'left', size: 12.5 });
  });

  // 20 tokens por parámetro (desde «ratio»)
  if (S.on('ratio')) {
    const aR = S.reveal('ratio', 0.3, 0.8);
    d.withAlpha(aR, () => {
      plot.line(XR[0], XR[0] + log10(20), XR[1], XR[1] + log10(20), 'lat', 2.2, [7, 5]);
      const lx = 11.9, ly = lx + log10(20);
      tagText(S, S.l('20 tokens por parámetro', '20 tokens per parameter'), plot.X(lx) - 6 * u, plot.Y(ly) - 15 * u, { t: 'lat', align: 'right', size: 12.5 });
    });
  }

  // paseo por la recta (budget-intro): N sube, D baja
  if (S.between('budget-intro', 'kaplan-says')) {
    const lN = 10.7 + 1.0 * Math.sin(S.since('budget-intro') * 0.9), lD = logDof(C, lN);
    plot.dot(lN, lD, 8, 'sig');
    d.withAlpha(S.reveal('budget-intro', 1.0, 0.6), () => tagText(S, S.l('más N, menos D', 'more N, less D'), plot.X(lN), plot.Y(lD) - 18 * u, { t: 'sig', size: 13 }));
  }

  // modelos de referencia
  const refs = [
    { id: 'kaplan-says', key: 'GPT-3', N: REF.gpt3.N, D: REF.gpt3.D, shape: 'ring' as const, side: 'l' as const },
    { id: 'kaplan-says', key: 'Gopher', N: REF.gopher.N, D: REF.gopher.D, shape: 'ring' as const, side: 'r' as const },
    { id: 'chinchilla', key: 'Chinchilla', N: REF.chinchilla.N, D: REF.chinchilla.D, shape: 'diamond' as const, side: 'u' as const },
    { id: 'rule', key: 'Llama 3.1', N: REF.llama31.N, D: REF.llama31.D, shape: 'diamond2' as const, side: 'u' as const },
  ];
  const inGame = S.between('try-budget', 'both-grow') || (S.on('both-grow') && !S.on('rule'));
  refs.forEach((m) => {
    if (!S.on(m.id)) return;
    const al = S.reveal(m.id, 0.2, 0.6) * (inGame ? 0.45 : 1);
    marker(S, plot, m.N, m.D, m.key, m.shape, m.side, al);
  });
  if (S.between('chinchilla', 'try-budget')) {
    const al = S.reveal('chinchilla', 1.4, 0.6);
    d.withAlpha(al, () => tagText(S, S.l('mismo cómputo', 'same compute'), plot.X(LN(REF.chinchilla.N) + 0.62), plot.Y(LN(REF.chinchilla.D) - 0.3), { t: 'dat', size: 12.5, align: 'left' }));
  }

  // tu elección (gate)
  if (S.between('try-budget', 'both-grow')) {
    const lN = S.p.n2 ?? 11, lD = logDof(C, lN);
    d.withAlpha(S.reveal('try-budget', 0.2, 0.5), () => {
      plot.dot(lN, lD, 9, 'sig');
      d.circle(plot.X(lN), plot.Y(lD), 14 * u, { stroke: tone(S, 'sig').c, lw: 1.5, a: 0.5 });
    });
    const b = S.st.budget;
    if (b?.found) d.withAlpha(S.reveal('try-budget', 0, 0.4), () => tagText(S, S.l(`Balance Chinchilla: ≈ ${S.n(Dopt(C) / Nopt(C), 0)} tokens por parámetro`, `Chinchilla balance: ≈ ${S.n(Dopt(C) / Nopt(C), 0)} tokens per parameter`), plot.r.x + 8 * u, plot.r.y + 12 * u, { t: 'dat', align: 'left', size: 13.5 }));
  }

  // frontera eficiente (barrido de presupuesto)
  if (S.on('both-grow') && !S.on('rule')) {
    const aB = S.reveal('both-grow', 0, 0.5), cs = 22.4, ce = lC;
    d.withAlpha(aB, () => {
      const pts: [number, number][] = [];
      for (let k = 0; k <= 24; k++) { const c = lerp(cs, ce, k / 24); pts.push([plot.X(LN(Nopt(10 ** c))), plot.Y(LN(Dopt(10 ** c)))]); }
      d.polyline(pts, tone(S, 'dat').c, 2, { dash: [3, 4] });
      plot.dot(LN(Nopt(C)), LN(Dopt(C)), 8, 'dat');
      tagText(S, S.l('el óptimo', 'the optimum'), plot.X(LN(Nopt(C))) - 12 * u, plot.Y(LN(Dopt(C))) + 18 * u, { t: 'dat', align: 'right', size: 13 });
    });
  }

  drawAside4(S, R.aside, C);
}

function marker(S: Frame, plot: Plot, N: number, D: number, name: string, shape: 'ring' | 'diamond' | 'diamond2', side: 'l' | 'r' | 'u', a: number) {
  const { d, pal: p } = S, u = S.u, x = plot.X(LN(N)), y = plot.Y(LN(D)), r = 7 * u;
  d.withAlpha(a, () => {
    if (shape === 'ring') d.circle(x, y, r, { stroke: p.ink, lw: 2.4, fill: p.stage });
    else { const c = tone(S, shape === 'diamond' ? 'dat' : 'lat'); d.polygon([[x, y - r * 1.3], [x + r * 1.3, y], [x, y + r * 1.3], [x - r * 1.3, y]], { fill: shape === 'diamond' ? c.c : p.stage, stroke: shape === 'diamond' ? p.stage : c.c, lw: shape === 'diamond' ? 1.5 : 2.6 }); }
    const t = shape === 'ring' ? 'ink' : shape === 'diamond' ? 'dat' : 'lat';
    if (side === 'l') tagText(S, name, x - 12 * u, y + 2 * u, { t: t as any, align: 'right', size: 13 });
    else if (side === 'r') tagText(S, name, x + 12 * u, y + 2 * u, { t: t as any, align: 'left', size: 13 });
    else tagText(S, name, x, y - 17 * u, { t: t as any, align: 'center', size: 13 });
  });
}

// ── lateral ──────────────────────────────────────────────────────────────────────
function readout(S: Frame, x: number, y: number, w: number, label: string, value: string, t: 'w' | 'lat' | 'dat' | 'err' | 'ink', a = 1) {
  const c = tone(S, t);
  S.d.withAlpha(a, () => {
    fitText(S, label, x, y, w, 12, { weight: 700, color: S.pal.mute, base: 'top' });
    fitText(S, value, x, y + FS(S, 12) * S.u + 3 * S.u, w, 19, { weight: 700, font: 'mono', color: c.ink, base: 'top' });
  });
}

function drawAside4(S: Frame, r: Rect, C: number) {
  const { d, pal: p } = S, u = S.u;
  const inGate = S.between('try-budget', 'both-grow');
  if (S.between('budget-intro', 'chinchilla')) {
    // lectura de la posición que recorre la recta
    const lN = 10.7 + 1.0 * Math.sin(S.since('budget-intro') * 0.9), N = 10 ** lN, D = C / (6 * N);
    const show = S.between('budget-intro', 'kaplan-says');
    if (show) {
      const cols = S.portrait ? 3 : 1, cw = r.w / cols;
      const items: [string, string, 'w' | 'lat' | 'dat'][] = [['N', count(N, S.lang), 'w'], ['D', count(D, S.lang), 'lat'], ['C = 6·N·D', sci(C, S.lang, 2), 'dat']];
      items.forEach(([l, v, t], i) => readout(S, r.x + (i % cols) * cw, r.y + Math.floor(i / cols) * 50 * u + 4 * u, cw - 6 * u, l, v, t, S.reveal('budget-intro', 0.3 + i * 0.2, 0.5)));
    } else {
      const aa = S.reveal('kaplan-says', 0.3, 0.6);
      fitText(S, S.l('Más parámetros, mismos datos, más cómputo.', 'More parameters, same data, more compute.'), r.x, r.y + 6 * u, r.w, 14, { weight: 700, color: p.ink2, base: 'top' });
      void aa;
    }
    return;
  }
  if (S.between('chinchilla', 'outcome')) { versus(S, r); return; }
  if (S.between('outcome', 'ratio')) { mmlu(S, r); return; }
  if (S.between('ratio', 'try-budget') || S.between('rule', 'emergent')) { ratios(S, r); return; }
  if (inGate) { gateAside(S, r, C); return; }
  if (S.on('both-grow') && !S.on('rule')) {
    const items: [string, string, 'w' | 'lat' | 'dat'][] = [[S.l('N óptimo', 'optimal N'), count(Nopt(C), S.lang), 'w'], [S.l('D óptimo', 'optimal D'), count(Dopt(C), S.lang), 'lat'], [S.l('D / N', 'D / N'), S.n(Dopt(C) / Nopt(C), 1), 'dat']];
    const cols = S.portrait ? 3 : 1, cw = r.w / cols;
    items.forEach(([l, v, t], i) => readout(S, r.x + (i % cols) * cw, r.y + Math.floor(i / cols) * 50 * u + 4 * u, cw - 6 * u, l, v, t, 1));
    const a = S.at('both-grow', 4.8, 5.6), k = 100;
    if (a > 0) d.withAlpha(a, () => {
      const y = S.portrait ? r.y + 62 * u : r.y + 3 * 50 * u + 14 * u;
      fitText(S, S.l(`×${k} de cómputo`, `×${k} the compute`), r.x, y, r.w, 14, { weight: 800, color: p.ink, base: 'top' });
      fitText(S, S.l(`→ N ×${S.n(k ** A_EXP, 1)} · D ×${S.n(k ** B_EXP, 1)}`, `→ N ×${S.n(k ** A_EXP, 1)} · D ×${S.n(k ** B_EXP, 1)}`), r.x, y + 22 * u, r.w, 14, { weight: 700, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    });
  }
}

/** Gopher y Chinchilla con el mismo cómputo. */
function versus(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const rows = [
    { name: 'Gopher', N: REF.gopher.N, D: REF.gopher.D, t: 'ink' as const },
    { name: 'Chinchilla', N: REF.chinchilla.N, D: REF.chinchilla.D, t: 'dat' as const },
  ];
  rows.forEach((row, i) => {
    const a = S.reveal('chinchilla', 0.5 + i * 0.9, 0.6), y = r.y + 4 * u + i * 64 * u, c = tone(S, row.t);
    d.withAlpha(a, () => {
      d.text(row.name, r.x, y, { size: FS(S, 15), weight: 800, color: c.ink, base: 'top' });
      fitText(S, `${count(row.N, S.lang)} × ${count(row.D, S.lang)}`, r.x, y + 22 * u, r.w, 14, { weight: 600, font: 'mono', color: p.ink2, base: 'top' });
    });
  });
  const a = S.reveal('chinchilla', 2.4, 0.6);
  d.withAlpha(a, () => {
    const y = r.y + 4 * u + 2 * 64 * u + 2 * u;
    fitText(S, `${S.l('6·N·D ≈', '6·N·D ≈')} ${sci(REF.gopherBudget, S.lang, 2)}`, r.x, y, r.w, 14, { weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    fitText(S, S.l('FLOPs para los dos (Hoffmann et al.)', 'FLOPs for both (Hoffmann et al.)'), r.x, y + 22 * u, r.w, 12.5, { weight: 600, color: p.mute, base: 'top' });
  });
}

/** MMLU medido: Gopher frente a Chinchilla. */
function mmlu(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  d.text(S.l('Resultado medido · MMLU', 'Measured result · MMLU'), r.x, r.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', a: S.reveal('outcome', 0.1, 0.5) });
  const rows = [
    { name: `Gopher · ${count(REF.gopher.N, S.lang)}`, v: REF.mmlu.gopher, t: 'ink' as const },
    { name: `Chinchilla · ${count(REF.chinchilla.N, S.lang)}`, v: REF.mmlu.chinchilla, t: 'dat' as const },
  ];
  const top = r.y + 30 * u, rh = Math.min(58 * u, (r.h - 70 * u) / 2);
  rows.forEach((row, i) => {
    const a = S.reveal('outcome', 0.5 + i * 0.7, 0.6), y = top + i * rh, c = tone(S, row.t), bw = r.w;
    d.withAlpha(a, () => {
      fitText(S, row.name, r.x, y, bw * 0.72, 13.5, { weight: 700, color: p.ink2, base: 'top' });
      d.text(`${S.n(row.v, 1)} %`, r.x + bw, y, { size: FS(S, 14), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'top' });
      d.rect(r.x, y + 22 * u, bw, 14 * u, { fill: p.surface2 });
      d.rect(r.x, y + 22 * u, bw * (row.v / 100) * a, 14 * u, { fill: row.t === 'dat' ? c.c : alpha(p.ink, 0.5) });
    });
  });
  const a = S.reveal('outcome', 2.0, 0.6);
  d.withAlpha(a, () => {
    const y = top + 2 * rh + 4 * u;
    fitText(S, S.l(`+${S.n(REF.mmlu.chinchilla - REF.mmlu.gopher, 1)} puntos con 4× menos parámetros`, `+${S.n(REF.mmlu.chinchilla - REF.mmlu.gopher, 1)} points with 4× fewer parameters`), r.x, y, r.w, 13.5, { weight: 800, color: tone(S, 'dat').ink, base: 'top' });
    fitText(S, S.l('Hoffmann et al., tabla 6 (5 ejemplos)', 'Hoffmann et al., table 6 (5-shot)'), r.x, y + 22 * u, r.w, 12, { weight: 600, color: p.mute, base: 'top' });
  });
}

/** Tokens por parámetro de cada modelo; la regla de 20 y el ajuste propio de Meta. */
function ratios(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  d.text(S.l('Tokens por parámetro', 'Tokens per parameter'), r.x, r.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', a: S.reveal('ratio', 0.1, 0.5) });
  const rows: { name: string; v: number; t: 'ink' | 'dat' | 'lat'; at: string; delay: number }[] = [
    { name: 'GPT-3', v: REF.gpt3.D / REF.gpt3.N, t: 'ink', at: 'ratio', delay: 0.4 },
    { name: 'Gopher', v: REF.gopher.D / REF.gopher.N, t: 'ink', at: 'ratio', delay: 1.0 },
    { name: 'Chinchilla', v: REF.chinchilla.D / REF.chinchilla.N, t: 'dat', at: 'ratio', delay: 1.6 },
    { name: 'Llama 3.1', v: REF.llama31.D / REF.llama31.N, t: 'lat', at: 'rule', delay: 1.6 },
  ];
  const top = r.y + 28 * u, rh = Math.min(44 * u, (r.h - 36 * u) / 4), maxV = 42, lw = 0;
  rows.forEach((row, i) => {
    if (!S.on(row.at)) return;
    const a = S.reveal(row.at, row.delay, 0.6), y = top + i * rh, c = tone(S, row.t);
    d.withAlpha(a, () => {
      d.text(row.name, r.x + lw, y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top' });
      d.text(S.n(row.v, row.v < 10 ? 1 : 0), r.x + r.w, y, { size: FS(S, 14), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'top' });
      d.rect(r.x, y + 19 * u, r.w, 11 * u, { fill: p.surface2 });
      d.rect(r.x, y + 19 * u, r.w * clamp(row.v / maxV) * a, 11 * u, { fill: row.t === 'ink' ? alpha(p.ink, 0.5) : c.c });
    });
  });
  const x20 = r.x + r.w * (20 / maxV);
  d.withAlpha(S.reveal('ratio', 1.8, 0.6), () => {
    d.line(x20, top + 14 * u, x20, top + 4 * rh - 6 * u, tone(S, 'lat').c, 1.8, [5, 4]);
    d.text('20', x20, top + 4 * rh - 3 * u, { size: FS(S, 12.5), weight: 800, font: 'mono', color: tone(S, 'lat').ink, align: 'center', base: 'top' });
  });
  if (S.on('rule')) d.withAlpha(S.reveal('rule', 2.4, 0.6), () => fitText(S, S.l('Meta: su ajuste daba ≈ 41', 'Meta: its own fit gave ≈ 41'), r.x, top + 4 * rh + 18 * u, r.w, 12.5, { weight: 700, color: p.ink2, base: 'top' }));
}

// ── el turno: buscar el mínimo ──────────────────────────────────────────────────
function gateAside(S: Frame, r: Rect, C: number) {
  const { d, pal: p } = S, u = S.u;
  const lN = S.p.n2 ?? 11, N = 10 ** lN, D = C / (6 * N), L = Lhat(N, D);
  const port = S.portrait, cols = port ? 4 : 2, cw = r.w / cols, rh = 44 * u;
  const items: [string, string, 'w' | 'lat' | 'ink' | 'err'][] = [
    ['N', count(N, S.lang), 'w'], ['D', count(D, S.lang), 'lat'], [S.l('D / N', 'D / N'), S.n(D / N, 1), 'ink'], [S.l('pérdida', 'loss'), S.n(L, 3), 'err'],
  ];
  const a0 = S.reveal('try-budget', 0.1, 0.5);
  items.forEach(([l, v, t], i) => readout(S, r.x + (i % cols) * cw, r.y + Math.floor(i / cols) * rh + 2 * u, cw - 6 * u, l, v, t, a0));
  const used = Math.ceil(items.length / cols) * rh + 6 * u;
  const pr: Rect = { x: r.x, y: r.y + used, w: r.w, h: r.h - used };
  if (pr.h < 60 * u) return;
  const b = S.st.budget ?? { trail: [], found: false };
  // eje y según el rango de la curva completa
  let lo = Infinity, hi = -Infinity;
  const f = (x: number) => Lhat(10 ** x, C / 6 / 10 ** x);
  for (let k = 0; k <= 30; k++) { const v = f(9 + k / 10); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const pad = (hi - lo) * 0.08;
  const pl = new Plot(S, pr, { xr: [9, 12], yr: [lo - pad, hi + pad], pad: { l: 44, b: 38, t: 16, r: 8 } });
  const step = hi - lo > 0.6 ? 0.2 : 0.1, yt: number[] = [];
  for (let v = Math.ceil((lo - pad) / step) * step; v <= hi + pad; v += step) yt.push(Math.round(v * 100) / 100);
  d.withAlpha(a0, () => {
    axes(S, pl, { xTicks: [9, 10, 11, 12], yTicks: yt, xFmt: pow10, yFmt: (v) => S.n(v, 1), xLabel: S.l('N', 'N'), yLabel: S.l('pérdida a lo largo de la recta', 'loss along the line') });
    if (b.found) pl.curve(f, 'err', 2.4, { n: 90, a: 0.9 });
    (b.trail as number[]).forEach((x) => pl.dot(x, f(x), 3, 'err', { a: 0.55 }));
    pl.dot(lN, f(lN), 6, 'sig');
    if (b.found) {
      const xo = LN(Nopt(C));
      pl.dot(xo, f(xo), 6.5, 'dat');
      tagText(S, S.l('mínimo', 'minimum'), pl.X(xo), pl.Y(f(xo)) + 18 * u, { t: 'dat', size: 13 });
    }
  });
  void p;
}

/** Devuelve true cuando N está dentro de ±20 % del óptimo para el presupuesto elegido. */
export function updateBudget(S: Frame): boolean {
  if (!S.between('try-budget', 'both-grow')) return false;
  const b = S.st.budget ?? (S.st.budget = { trail: [], key: S.p.c2 ?? 23.76, found: false });
  const c2 = S.p.c2 ?? 23.76, n2 = S.p.n2 ?? 11;
  if (Math.abs(c2 - b.key) > 1e-6) { b.key = c2; b.trail = []; b.found = false; }
  const last = b.trail[b.trail.length - 1];
  if (last === undefined || Math.abs(n2 - last) >= 0.04) { b.trail.push(n2); if (b.trail.length > 60) b.trail.shift(); }
  const C = 10 ** c2;
  if (Math.abs(n2 - LN(Nopt(C))) <= 0.08) b.found = true;
  return b.found;
}

void sig; void nf;
