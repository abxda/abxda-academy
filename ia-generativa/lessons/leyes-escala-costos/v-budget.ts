// Vista 4 · Presupuesto fijo. N por D es el área de un rectángulo (ancho N, alto D) y el cómputo es seis veces esa área.
// Con un presupuesto fijo, la esquina del rectángulo se desliza sobre la curva N·D = constante: ancho y bajo (modelo
// grande, pocos datos) o angosto y alto. Gopher frente a Chinchilla, MMLU y la regla de unos veinte tokens por parámetro.
// Ejes en miles de millones (escala normal). Datos: Hoffmann et al. 2022 (tablas 1, 3 y 6).
import { alpha, regions, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { GOPHER, GOPHER_BUDGET, MMLU, MODELS } from './data';
import { box, count, fitText, fr, fz, kk, lerp, lineH, para, roomy } from './ui';

const XM = 320, YM = 1600;                 // ejes: N hasta 320 mil M, D hasta 1 600 mil M
const K = GOPHER_BUDGET / 6 / 1e18;        // N·D (en miles de millones al cuadrado) del presupuesto de Gopher ≈ 96 000

function geo(S: Frame) {
  const R = regions(S, S.portrait ? 0.64 : 0.66), m = R.main, k = kk(S), u = S.u;
  const padL = Math.max(36, 42 * u), padB = 7 * k + lineH(S, 12) + 4 * k + lineH(S, 13), padT = lineH(S, 13) + 8 * k, padR = 12 * k;
  const r: Rect = { x: m.x + padL, y: m.y + padT, w: m.w - padL - padR, h: m.h - padT - padB };
  const X = (n: number) => r.x + (n / XM) * r.w, Y = (dd: number) => r.y + r.h - (dd / YM) * r.h;
  return { R, r, X, Y };
}

type G = ReturnType<typeof geo>;

function rectND(S: Frame, g: G, n: number, dd: number, t: Tone, o: { a?: number; fill?: number; dash?: boolean; lw?: number } = {}) {
  const c = tone(S, t), x0 = g.X(0), y0 = g.Y(0);
  S.d.rect(x0, g.Y(dd), g.X(n) - x0, y0 - g.Y(dd), { fill: alpha(c.c, o.fill ?? 0.16), stroke: c.c, lw: o.lw ?? 2, dash: o.dash ? [6, 4] : undefined, a: o.a });
}

/** Esquina del rectángulo de «budget-fixed» y «kaplan-advice». */
function cornerND(S: Frame): [number, number] {
  // budget-fixed: aparece en (240, 400) y se desliza sobre la curva: ancho (320) → angosto (64)
  if (!S.on('kaplan-advice')) {
    const f1 = fr(S, 'budget-fixed', 0.32, 0.5, 'io'), f2 = fr(S, 'budget-fixed', 0.6, 0.85, 'io');
    const n = f2 > 0 ? 320 * (64 / 320) ** f2 : 240 * (320 / 240) ** f1;
    return [n, K / n];
  }
  // kaplan-advice: de la forma angosta a Gopher (280 mil M × 300 mil M)
  const f = fr(S, 'kaplan-advice', 0.45, 0.7, 'io');
  const n = lerp(64, GOPHER.N / 1e9, f), dd = lerp(K / 64, GOPHER.D / 1e9, f);
  return [n, dd];
}

function axes(S: Frame, g: G, a: number) {
  const { d, pal: p } = S, k = kk(S), { r } = g, ts = fz(S, 11.5);
  d.withAlpha(a, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    [0, 100, 200, 300].forEach((v) => { const x = g.X(v); d.line(x, r.y + r.h, x, r.y + r.h + 4 * k, p.lineStrong, 1.5); d.text(S.n(v, 0), x, r.y + r.h + 7 * k, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    [0, 500, 1000, 1500].forEach((v) => { const y = g.Y(v); d.line(r.x - 4 * k, y, r.x, y, p.lineStrong, 1.5); d.text(S.n(v, 0), r.x - 7 * k, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    fitText(S, S.l('N, parámetros (miles de millones)', 'N, parameters (billions)'), r.x + r.w, r.y + r.h + 7 * k + lineH(S, 12) + 3 * k, r.w, { size: 13, weight: 700, color: tone(S, 'w').ink, align: 'right', base: 'top' });
    fitText(S, S.l('D, tokens (miles de millones)', 'D, tokens (billions)'), g.R.main.x, r.y - 6 * k, r.w + 30 * k, { size: 13, weight: 700, color: tone(S, 'lat').ink, base: 'bottom' });
  });
}

/** Columna lateral: una tarjeta por segmento (fórmula, Gopher, los 400 modelos, ambos modelos, MMLU, la regla). */
function drawAside(S: Frame, g: G) {
  const { d, pal: p } = S, k = kk(S), A = g.R.aside, pad = 10 * k, b = roomy(S);
  const item = (from: string, to: string | null, fn: () => void) => {
    const a = fr(S, from, 0.05, 0.25) * (to ? 1 - fr(S, to, 0, 0.15) : 1);
    if (a > 0.01) d.withAlpha(a, fn);
  };
  // fórmula (budget, budget-fixed)
  item('budget', 'kaplan-advice', () => {
    const r: Rect = { x: A.x, y: A.y, w: A.w, h: Math.min(A.h, 140 * k) };
    let y = r.y + pad;
    fitText(S, 'C ≈ 6 · N · D', r.x + pad, y, r.w - 2 * pad, { size: 20 * b, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    y += lineH(S, 20 * b) + 6 * k;
    const a2 = fr(S, 'budget', 0.7, 0.85);
    fitText(S, S.l('= 6 × área del rectángulo', '= 6 × area of the rectangle'), r.x + pad, y, r.w - 2 * pad, { size: 13.5 * b, weight: 700, color: p.ink2, base: 'top', a: a2 });
    y += lineH(S, 13.5 * b) + 8 * k;
    const a3 = fr(S, 'budget-fixed', 0.1, 0.25);
    if (a3 > 0.01) para(S, S.l('presupuesto fijo → área fija: si sube N, baja D', 'fixed budget → fixed area: if N goes up, D goes down'), r.x + pad, y, r.w - 2 * pad, { size: 13.5 * b, weight: 800, color: tone(S, 'dat').ink, a: a3 });
  });
  // Gopher (kaplan-advice, hoffmann)
  const card = (r: Rect, name: string, who: string, n: number, dd: number, t: Tone) => {
    box(S, r, t, { fill: 0.08 });
    let y = r.y + 7 * k;
    fitText(S, name, r.x + 8 * k, y, r.w - 16 * k, { size: 15 * b, weight: 800, color: tone(S, t).ink, base: 'top' });
    y += lineH(S, 15 * b);
    fitText(S, who, r.x + 8 * k, y, r.w - 16 * k, { size: 12, weight: 600, color: p.mute, base: 'top' });
    y += lineH(S, 12) + 3 * k;
    fitText(S, `N = ${count(S, n)}`, r.x + 8 * k, y, r.w - 16 * k, { size: 13.5 * b, weight: 700, font: 'mono', color: p.ink, base: 'top' });
    y += lineH(S, 13.5 * b);
    if (y + lineH(S, 13.5 * b) <= r.y + r.h + 2 * k) fitText(S, `D = ${count(S, dd)}`, r.x + 8 * k, y, r.w - 16 * k, { size: 13.5 * b, weight: 700, font: 'mono', color: p.ink, base: 'top' });
  };
  const cardH = Math.min(A.h, lineH(S, 15 * b) + lineH(S, 12) + 2 * lineH(S, 13.5 * b) + 18 * k);
  item('kaplan-advice', 'hoffmann', () => card({ x: A.x, y: A.y, w: Math.min(A.w, 240 * k), h: cardH }, 'Gopher', 'DeepMind, 2021', GOPHER.N, GOPHER.D, 'w'));
  // los más de 400 modelos de Hoffmann et al.
  item('hoffmann', 'chinchilla', () => {
    let y = A.y;
    const h1 = para(S, S.l('Hoffmann et al., 2022: más de 400 modelos entrenados', 'Hoffmann et al., 2022: over 400 models trained'), A.x, y, A.w, { size: 13.5 * b, weight: 800, color: p.ink2 });
    y += h1 + 8 * k;
    const n = 20, cell = Math.max(3, Math.min((A.w - 4) / n, (A.y + A.h - y) / n));
    const shown = Math.floor(400 * fr(S, 'hoffmann', 0.3, 0.8, 'lin'));
    for (let i = 0; i < shown; i++) d.rect(A.x + (i % n) * cell, y + Math.floor(i / n) * cell, cell - 1, cell - 1, { fill: alpha(tone(S, 'dat').c, 0.6) });
  });
  // Gopher y Chinchilla lado a lado (o uno sobre otro)
  item('chinchilla', 'wins', () => {
    const two = A.w >= 2 * 130 * k + 8 * k || S.portrait;
    const w = two ? (A.w - 8 * k) / 2 : A.w, h = two ? cardH : Math.min(cardH, (A.h - 8 * k) / 2);
    card({ x: A.x, y: A.y, w, h }, 'Gopher', 'DeepMind, 2021', GOPHER.N, GOPHER.D, 'w');
    const a2 = fr(S, 'chinchilla', 0.3, 0.5);
    d.withAlpha(a2, () => card(two ? { x: A.x + w + 8 * k, y: A.y, w, h } : { x: A.x, y: A.y + h + 8 * k, w, h }, 'Chinchilla', 'DeepMind, 2022', MODELS.chinchilla.N, MODELS.chinchilla.D, 'lat'));
  });
  // MMLU
  item('wins', 'twenty', () => {
    let y = A.y;
    const h1 = para(S, S.l('MMLU: examen de 57 materias, % de aciertos', 'MMLU: exam on 57 subjects, % correct'), A.x, y, A.w, { size: 13 * b, weight: 800, color: p.ink2 });
    y += h1 + 8 * k;
    const rows: [string, number, Tone][] = [['Gopher', MMLU.gopher, 'w'], ['Chinchilla', MMLU.chinchilla, 'lat']];
    const labW = d.measure('Chinchilla', { size: fz(S, 12.5), weight: 700 }) + 8 * k;
    const bh = Math.min(24 * k, (A.y + A.h - y) / 2.4), bwMax = A.w - labW - 54 * k;
    rows.forEach(([name, v, t], i) => {
      const ai = fr(S, 'wins', 0.3 + i * 0.15, 0.45 + i * 0.15), yy = y + i * (bh + 8 * k);
      d.text(name, A.x, yy + bh / 2, { size: fz(S, 12.5), weight: 700, color: tone(S, t).ink, base: 'middle', a: ai });
      const bw = bwMax * (v / 100) * ai;
      d.rect(A.x + labW, yy, bw, bh, { fill: alpha(tone(S, t).c, 0.5), stroke: tone(S, t).c, lw: 1.2, r: 2, a: ai });
      d.text(`${S.n(v, 1)}${S.lang === 'es' ? ' %' : '%'}`, A.x + labW + bw + 6 * k, yy + bh / 2, { size: fz(S, 13), weight: 800, font: 'mono', color: p.ink, base: 'middle', a: ai });
    });
  });
  // la regla
  item('twenty', null, () => {
    let y = A.y;
    fitText(S, S.l('≈ 20 tokens', '≈ 20 tokens'), A.x, y, A.w, { size: 26 * b, weight: 800, font: 'mono', color: tone(S, 'lat').ink, base: 'top' });
    y += lineH(S, 26 * b);
    fitText(S, S.l('por cada parámetro', 'per parameter'), A.x, y, A.w, { size: 15 * b, weight: 800, color: p.ink, base: 'top' });
    y += lineH(S, 15 * b) + 6 * k;
    const lines: [string, Tone, number][] = [
      [S.l(`Chinchilla: ${count(S, 70e9)} × 20 = ${count(S, 1.4e12)}`, `Chinchilla: ${count(S, 70e9)} × 20 = ${count(S, 1.4e12)}`), 'lat', fr(S, 'twenty', 0.4, 0.55)],
      [S.l(`Gopher: ${S.n(300, 0)} ÷ ${S.n(280, 0)} ≈ 1`, `Gopher: ${S.n(300, 0)} ÷ ${S.n(280, 0)} ≈ 1`), 'w', fr(S, 'twenty', 0.6, 0.72)],
    ];
    lines.forEach(([str, t, a]) => {
      if (y + lineH(S, 13.5 * b) > A.y + A.h + 2 * k) return;
      fitText(S, str, A.x, y, A.w, { size: 13.5 * b, weight: 700, font: 'mono', color: tone(S, t).ink, base: 'top', a });
      y += lineH(S, 13.5 * b) + 3 * k;
    });
    const a3 = fr(S, 'twenty', 0.82, 0.95);
    if (y + lineH(S, 12.5) <= A.y + A.h + 2 * k) fitText(S, S.l('una guía, no una ley', 'a guide, not a law'), A.x, y + 3 * k, A.w, { size: 12.5 * b, weight: 700, color: p.mute, base: 'top', a: a3, italic: true });
  });
}

export function drawBudget(S: Frame) {
  const { d, pal: p } = S, k = kk(S), g = geo(S), { r } = g;
  axes(S, g, fr(S, 'budget', 0.02, 0.2));
  // ejemplo: el rectángulo de GPT-3 (175 mil M × 300 mil M)
  const gA = fr(S, 'budget', 0.22, 0.4) * (1 - fr(S, 'budget-fixed', 0.2, 0.32));
  if (gA > 0.01) {
    const grow = fr(S, 'budget', 0.22, 0.45, 'io');
    rectND(S, g, 175 * grow, 300 * grow, 'mute', { a: gA, fill: 0.14 });
    const cx = (g.X(0) + g.X(175)) / 2, cy = (g.Y(0) + g.Y(300)) / 2;
    d.text(S.l('área = N × D', 'area = N × D'), cx, cy, { size: fz(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle', a: gA * fr(S, 'budget', 0.45, 0.6), halo: p.stage, haloW: 4 });
    d.text(S.l('ejemplo: GPT-3', 'example: GPT-3'), g.X(175) + 6 * k, g.Y(300), { size: fz(S, 12), weight: 700, color: p.mute, base: 'bottom', a: gA * fr(S, 'budget', 0.45, 0.6) });
  }
  // la curva del presupuesto fijo (todas las esquinas con la misma área)
  const hA = fr(S, 'budget-fixed', 0.05, 0.3);
  if (hA > 0.01) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 80; i++) { const n = 60 + (XM - 60) * (i / 80); pts.push([g.X(n), g.Y(K / n)]); }
    d.clip(r.x, r.y, r.w, r.h, () => d.polyline(pts.slice(0, Math.max(2, Math.round(pts.length * hA))), tone(S, 'dat').c, 2, { dash: [3, 4] }));
    fitText(S, S.l('mismo presupuesto', 'same budget'), g.X(150) + 8 * k, g.Y(K / 150) - 8 * k, r.x + r.w - g.X(150) - 10 * k, { size: 12.5, weight: 800, color: tone(S, 'dat').ink, base: 'bottom', a: hA * fr(S, 'budget-fixed', 0.2, 0.3), halo: true });
  }
  // el rectángulo que se desliza (y termina en Gopher)
  const sA = fr(S, 'budget-fixed', 0.22, 0.35);
  if (sA > 0.01) {
    const [n, dd] = cornerND(S);
    const isG = fr(S, 'kaplan-advice', 0.45, 0.7);
    rectND(S, g, n, dd, isG > 0.5 ? 'w' : 'dat', { a: sA, fill: 0.16 });
    d.circle(g.X(n), g.Y(dd), 4.5 * k, { fill: tone(S, isG > 0.5 ? 'w' : 'dat').c, stroke: p.stage, lw: 1.5, a: sA });
    // rótulos de forma durante «budget-fixed»
    const wide = fr(S, 'budget-fixed', 0.45, 0.55) * (1 - fr(S, 'budget-fixed', 0.6, 0.66));
    const tall = fr(S, 'budget-fixed', 0.82, 0.92) * (1 - fr(S, 'kaplan-advice', 0.3, 0.45));
    if (wide > 0.01) d.text(S.l('modelo grande, pocos datos', 'big model, little data'), g.X(160), g.Y(dd) - 8 * k, { size: fz(S, 12.5), weight: 800, color: p.ink2, align: 'center', base: 'bottom', a: wide, halo: p.stage, haloW: 4 });
    if (tall > 0.01) d.text(S.l('modelo chico, muchos datos', 'small model, lots of data'), g.X(n) + 8 * k, g.Y(dd * 0.75), { size: fz(S, 12.5), weight: 800, color: p.ink2, base: 'middle', a: tall, halo: p.stage, haloW: 4 });
    const gl = isG;
    if (gl > 0.01) d.text('Gopher', g.X(GOPHER.N / 1e9) - 6 * k, g.Y(GOPHER.D / 1e9) + 6 * k, { size: fz(S, 14), weight: 800, color: tone(S, 'w').ink, align: 'right', base: 'top', a: gl, halo: p.stage, haloW: 4 });
  }
  // Chinchilla: 70 mil M × 1.4 billones
  const cA = fr(S, 'chinchilla', 0.25, 0.4);
  if (cA > 0.01) {
    const grow = fr(S, 'chinchilla', 0.25, 0.6, 'io');
    rectND(S, g, 70, 1400 * grow, 'lat', { a: cA, fill: 0.2 });
    d.text('Chinchilla', g.X(70) + 6 * k, g.Y(1400 * grow) + 4 * k, { size: fz(S, 14), weight: 800, color: tone(S, 'lat').ink, base: 'top', a: cA * fr(S, 'chinchilla', 0.55, 0.7), halo: p.stage, haloW: 4 });
  }
  // tokens por parámetro: la Chinchilla se marca con un borde más grueso; las cuentas van en la columna lateral
  const tA = fr(S, 'twenty', 0.15, 0.3);
  if (tA > 0.01) rectND(S, g, 70, 1400, 'lat', { a: tA, fill: 0, lw: 3.2 });
  drawAside(S, g);
}
