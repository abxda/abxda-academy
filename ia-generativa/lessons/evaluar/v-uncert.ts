// Vistas 14–17: cuánto confiar en el número (SIMULACIÓN real, ver stats.ts).
//  · drawOne    (one-eval … ci-400): tu evaluación de 100 casos; otras evaluaciones; la montaña de 100 resultados; el margen
//                ± 8 (intervalo de confianza); con 400 casos, ± 4.
//  · drawTwo    (two … try-n): A (78 % real) contra B (74 % real) con los mismos casos: márgenes que se enciman y 100
//                comparaciones repetidas; «tu turno» con el número de casos.
//  · drawTie    (tie): la regla del empate, con 100 y con 1 000 casos.
//  · drawPaired (paired): 400 casos, los mismos para los dos o distintos para cada uno.
import { alpha, clamp, ease, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { N_STEPS, PA, PB, P_TRUE, casesOf, margin, oneRuns, roundHalfEven, tally, type Tally } from './stats';
import { FS, area, chip, chipH, chipW, fitText, fr, gridGeom, hold, mark, ofN, para, tight, type Mark } from './ui';

const LO = 60, HI = 100;

/** Eje de exactitud de 60 a 100 con marcas cada 10. */
function accAxis(S: Frame, x0: number, x1: number, y: number, a: number, label?: string) {
  const { d, pal: p } = S, u = S.u, X = (v: number) => x0 + ((v - LO) / (HI - LO)) * (x1 - x0);
  if (a > 0.01) d.withAlpha(a, () => {
    d.line(x0, y, x1, y, p.lineStrong, 1.8);
    for (let v = LO; v <= HI; v += 10) { d.line(X(v), y, X(v), y + 5 * u, p.lineStrong, 1.5); d.text(S.n(v, 0), X(v), y + 8 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); }
    if (label) fitText(S, label, x1, y + 10 * u + FS(S, 12) * u, (x1 - x0) * 0.75, 12.5, { weight: 700, align: 'right', base: 'top', color: p.ink2 });
  });
  return X;
}

/** Intervalo dibujado como barra con topes: de lo a hi, a la altura y. */
function interval(S: Frame, X: (v: number) => number, lo: number, hi: number, y: number, t: 'sig' | 'lat' | 'w' | 'err' | 'ink', a = 1, o: { h?: number; dash?: boolean; fill?: boolean } = {}) {
  if (a <= 0.01) return;
  const { d } = S, u = S.u, c = tone(S, t), h = (o.h ?? 12) * u;
  d.withAlpha(a, () => {
    if (o.fill !== false) d.rect(X(lo), y - h / 2, X(hi) - X(lo), h, { fill: alpha(c.c, 0.16), r: 2 });
    d.line(X(lo), y, X(hi), y, c.c, 2.4, o.dash ? [5, 4] : undefined);
    d.line(X(lo), y - h / 2, X(lo), y + h / 2, c.c, 2.4);
    d.line(X(hi), y - h / 2, X(hi), y + h / 2, c.c, 2.4);
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Un sistema: tu nota y su margen
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Posición de cada uno de los 100 resultados en la montaña: valor (para x) y su lugar en la pila. */
function pile(vals: number[]) {
  const cnt = new Map<number, number>();
  return vals.map((v) => { const b = roundHalfEven(v); const k = cnt.get(b) ?? 0; cnt.set(b, k + 1); return { v, b, k }; });
}
const P100 = pile(oneRuns(100)), P400 = pile(oneRuns(400));
const MAXSTACK = Math.max(...P100.map((q) => q.k), ...P400.map((q) => q.k)) + 1;

export function drawOne(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  // reparto: cuadrícula de casos + línea de exactitud; desde «many», la línea ocupa todo
  const full = S.on('many') ? fr(S, 'many', 0, 0.25, 'io') : 0;
  const G: Rect = port ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.42 } : { x: A.x, y: A.y + A.h * 0.04, w: A.w * 0.34, h: A.h * 0.9 };
  const P0: Rect = port ? { x: A.x, y: A.y + A.h * 0.46, w: A.w, h: A.h * 0.54 } : { x: A.x + A.w * 0.4, y: A.y, w: A.w * 0.6, h: A.h };
  const P: Rect = { x: lerp(P0.x, A.x, full), y: lerp(P0.y, A.y, full), w: lerp(P0.w, A.w, full), h: lerp(P0.h, A.h, full) };
  // ── la cuadrícula de 100 casos (tu evaluación y las tres siguientes) ──
  const aGrid = fr(S, 'one-eval', 0.05, 0.18) * (1 - full);
  const evalK = !S.on('again') ? 0 : fr(S, 'again', 0.85, 0.9) > 0 ? 3 : fr(S, 'again', 0.68, 0.73) > 0 ? 2 : fr(S, 'again', 0.5, 0.55) > 0 ? 1 : 0;
  const swapT = evalK === 0 ? 1 : fr(S, 'again', [0, 0.5, 0.68, 0.85][evalK], [0, 0.55, 0.73, 0.9][evalK]);
  if (aGrid > 0.01) {
    const big = tight(S) ? 20 : 26, lab = 13.5;
    const txtH = FS(S, lab) * u * 1.3 + FS(S, big) * u * 1.2 + 10 * u;
    // vertical: cuadrícula a la izquierda y texto a la derecha; horizontal: texto arriba y cuadrícula abajo
    const gr: Rect = port ? { x: G.x, y: G.y, w: Math.min(G.h, G.w * 0.58), h: G.h } : { x: G.x, y: G.y + txtH, w: G.w, h: G.h - txtH };
    const g = gridGeom(gr, 10, 10, 34 * u);
    if (port) { g.x = gr.x; }
    const cur = casesOf(evalK), prev = casesOf(Math.max(0, evalK - 1));
    const fill = fr(S, 'one-eval', 0.12, 0.5, 'lin');
    for (let i = 0; i < 100; i++) {
      const x = g.x + (i % 10) * g.s, y = g.y + Math.floor(i / 10) * g.s, a = aGrid * clamp(fill * 110 - i);
      const mk = (ok: boolean): Mark => (ok ? 'ok' : 'bad');
      if (swapT >= 1 || cur[i] === prev[i]) mark(S, x, y, g.s, mk(cur[i]), a);
      else { mark(S, x, y, g.s, mk(prev[i]), a * (1 - swapT)); mark(S, x, y, g.s, mk(cur[i]), a * swapT); }
    }
    const v = oneRuns(100)[evalK];
    const label = evalK === 0 ? S.l('tu evaluación', 'your evaluation') : S.l(`otros 100 casos (la ${evalK + 1}.ª)`, `another 100 cases (#${evalK + 1})`);
    const tx = port ? g.x + g.w + 14 * u : g.x, tw = port ? A.x + A.w - tx : g.w, ty = port ? g.y + 4 * u : G.y;
    d.withAlpha(aGrid * fr(S, 'one-eval', 0.45, 0.55), () => {
      fitText(S, label, tx, ty, tw, lab, { weight: 700, base: 'top', color: p.ink2 });
      fitText(S, ofN(S, v, 100), tx, ty + FS(S, lab) * u * 1.3 + 4 * u, tw, big, { weight: 800, font: 'mono', base: 'top', color: tone(S, 'dat').ink });
      if (port) para(S, S.l('casos acertados', 'cases right'), tx, ty + FS(S, lab) * u * 1.3 + FS(S, big) * u * 1.25 + 10 * u, tw, FS(S, 12.5), { weight: 600, color: p.ink2, maxLines: 2 });
    });
  }
  // ── la línea de exactitud ──
  const aAx = fr(S, 'axis', 0.05, 0.25);
  // escenario muy bajo (teléfono en horizontal): menos reserva abajo; el título del eje va arriba a la derecha
  const compact = tight(S) && !port;
  const axY = P.y + P.h - (port ? 104 : compact ? 54 : 96) * u, x0 = P.x + 12 * u, x1 = P.x + P.w - 12 * u;
  const axTitle = S.l('exactitud medida (%)', 'measured accuracy (%)');
  const X = accAxis(S, x0, x1, axY, aAx, compact ? undefined : axTitle);
  if (compact) fitText(S, axTitle, x1, P.y + 2 * u, P.w * 0.3, 12.5, { weight: 700, align: 'right', base: 'top', color: p.ink2, a: aAx });
  if (!S.on('axis')) return;
  // ── la montaña: 100 resultados ──
  const binW = (x1 - x0) / (HI - LO), pileH = axY - P.y - (port ? 34 : 44) * u;
  const ds = Math.max(3, Math.min(binW * 0.92, pileH / MAXSTACK)), cw = Math.min(binW * 0.8, ds * 3);
  const morph = S.on('ci-400') ? fr(S, 'ci-400', 0.12, 0.5, 'io') : 0;
  const outDim = S.on('ci') ? fr(S, 'ci', 0.45, 0.6) * (S.on('ci-400') ? 1 - fr(S, 'ci-400', 0.05, 0.15) : 1) : 0;
  for (let k = 0; k < 100; k++) {
    // cuándo cae cada punto: el tuyo en «axis», tres en «again», los demás en «many»
    let a: number;
    if (k === 0) a = fr(S, 'axis', 0.55, 0.7);
    else if (k <= 3) a = fr(S, 'again', [0, 0.52, 0.7, 0.87][k], [0, 0.6, 0.78, 0.95][k]);
    else a = S.on('many') ? fr(S, 'many', 0.18 + (k / 100) * 0.4, 0.24 + (k / 100) * 0.4) : 0;
    if (a <= 0.01) continue;
    const q1 = P100[k], q4 = P400[k];
    const cx = lerp(X(q1.b), X(q4.b), morph), cy = lerp(axY - (q1.k + 0.5) * ds, axY - (q4.k + 0.5) * ds, morph) - (1 - ease.out(a)) * 30 * u;
    const out = Math.abs(q1.v - P_TRUE * 100) > 8;
    const mine = k === 0 && morph < 0.5;
    const c = mine ? tone(S, 'sig') : tone(S, 'dat');
    // cada resultado es una ficha: redonda si cabe; en escenarios muy bajos, un ladrillo más ancho que alto (se lee como histograma)
    d.withAlpha(a * (out ? 1 - 0.65 * outDim : 1), () => {
      if (cw <= ds * 1.15) d.circle(cx, cy, ds * 0.44, { fill: mine ? c.c : alpha(c.c, 0.7), stroke: mine ? p.ink : p.stage, lw: mine ? 2 : 1 });
      else d.rect(cx - cw / 2, cy - ds * 0.42, cw, ds * 0.84, { fill: mine ? c.c : alpha(c.c, 0.7), stroke: mine ? p.ink : undefined, lw: 1.5, r: 1 });
    });
  }
  // «tu resultado» (se va cuando llegan las otras evaluaciones)
  const aMine = fr(S, 'axis', 0.6, 0.75) * (S.on('again') ? 1 - fr(S, 'again', 0.42, 0.5) : 1);
  if (aMine > 0.01) chip(S, S.l('tu resultado: 78', 'your result: 78'), X(78), axY - ds - chipH(S, 13) / 2 - 10 * u, 'sig', { a: aMine, weight: 800 });
  // nota de cada evaluación nueva
  if (S.is('again')) {
    const vals = oneRuns(100);
    [1, 2, 3].forEach((k) => {
      const a = hold(S, 'again', undefined, [0, 0.52, 0.7, 0.87][k], [0, 0.6, 0.78, 0.95][k]) * (k === 3 ? 1 : 1 - fr(S, 'again', [0, 0.7, 0.87][k], [0, 0.74, 0.91][k]));
      if (a > 0.01) chip(S, S.n(vals[k], 0), X(vals[k]), axY - (P100[k].k + 1) * ds - chipH(S, 13) / 2 - 8 * u, 'dat', { a, weight: 800, font: 'mono' });
    });
  }
  // exactitud real (simulación)
  const aReal = fr(S, 'many', 0.66, 0.8);
  if (aReal > 0.01) d.withAlpha(aReal, () => {
    d.line(X(78), P.y + 26 * u, X(78), axY, p.ink, 1.6, [5, 4]);
    fitText(S, S.l('exactitud real (simulación): 78', 'true accuracy (simulation): 78'), X(78), P.y + 20 * u, P.w * 0.9, 13, { weight: 800, align: 'center', base: 'bottom', halo: true });
  });
  // rótulos informativos arriba a la izquierda (en la mitad libre, a la izquierda de la línea de la exactitud real)
  const infoW = X(78) - x0 - 12 * u, infoS = FS(S, 13);
  let iy = P.y + 30 * u;
  const info = (t: string, tn: 'dat' | 'sig', a: number) => { if (a > 0.01) iy += para(S, t, x0, iy, infoW, infoS, { weight: 800, color: tone(S, tn).ink, a, maxLines: 3 }) + 8 * u; };
  info(S.l('95 de 100 caen a 8 puntos o menos', '95 of 100 land within 8 points'), 'dat', fr(S, 'ci', 0.55, 0.68) * (S.on('ci-name') ? 1 - fr(S, 'ci-name', 0, 0.12) : 1));
  info(S.l('100 resultados, de 400 casos cada uno', '100 results, of 400 cases each'), 'dat', fr(S, 'ci-400', 0.15, 0.3));
  info(S.l('×4 casos → ½ margen', '×4 cases → ½ margin'), 'sig', fr(S, 'ci-400', 0.74, 0.86));
  // el margen: ± 8 con 100 casos; ± 4 con 400
  const yb = compact ? axY + 12 * u + FS(S, 12) * u + 12 * u : axY + 14 * u + FS(S, 12) * u + FS(S, 12.5) * u + 14 * u;
  const m100 = 100 * margin(P_TRUE, 100), m400 = 100 * margin(P_TRUE, 400);
  const aCi = fr(S, 'ci', 0.2, 0.35);
  if (aCi > 0.01) {
    const shrink = S.on('ci-400') ? fr(S, 'ci-400', 0.5, 0.66, 'io') : 0;
    const m = lerp(m100, m400, shrink);
    if (shrink > 0.01) interval(S, X, 78 - m100, 78 + m100, yb, 'sig', shrink * 0.45, { dash: true, fill: false });
    interval(S, X, 78 - m, 78 + m, yb, 'sig', aCi);
    const named = S.on('ci-name') ? fr(S, 'ci-name', 0.05, 0.2) : 0;
    const lab = shrink > 0.5 ? S.l('con 400 casos: 78 ± 4', 'with 400 cases: 78 ± 4') : named > 0.5 ? S.l('intervalo de confianza: de 70 a 86', 'confidence interval: 70 to 86') : S.l('tu nota: 78 ± 8', 'your score: 78 ± 8');
    if (compact) fitText(S, lab, X(78 + m100) + 12 * u, yb, x1 - X(78 + m100) - 12 * u, 13.5, { weight: 800, base: 'middle', color: tone(S, 'sig').ink, a: aCi, halo: true });
    else fitText(S, lab, X(78), yb + 12 * u, P.w, 14, { weight: 800, align: 'center', base: 'top', color: tone(S, 'sig').ink, a: aCi, halo: true });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Dos sistemas
// ════════════════════════════════════════════════════════════════════════════════════════════════
export interface TwoState { idx: number; prev: number; k: number }
const markOf = (r: { a: number; b: number }): Mark => (r.a > r.b ? 'ok' : r.a === r.b ? 'tie' : 'bad');

/** Las 100 comparaciones como cuadrícula de 10 × 10 (con fundido entre dos tamaños de muestra). */
function cmpGrid(S: Frame, R: Rect, cur: Tally, prev: Tally | null, k: number, a: number, maxCell = 30) {
  const g = gridGeom(R, 10, 10, maxCell * S.u);
  for (let i = 0; i < 100; i++) {
    const x = g.x + (i % 10) * g.s, y = g.y + Math.floor(i / 10) * g.s, m1 = markOf(cur.runs[i]);
    const m0 = prev ? markOf(prev.runs[i]) : m1;
    if (m0 === m1 || k >= 1) mark(S, x, y, g.s, m1, a, 'lat');
    else { mark(S, x, y, g.s, m0, a * (1 - k), 'lat'); mark(S, x, y, g.s, m1, a * k, 'lat'); }
  }
  return g;
}

export function drawTwo(S: Frame, st: TwoState) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const split = S.on('wrong') ? fr(S, 'wrong', 0, 0.22, 'io') : 0;
  const I1: Rect = port ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.46 } : { x: A.x, y: A.y, w: A.w * 0.54, h: A.h };
  const I: Rect = { x: lerp(A.x, I1.x, split), y: lerp(A.y, I1.y, split), w: lerp(A.w, I1.w, split), h: lerp(A.h, I1.h, split) };
  const n = S.on('demo-n') ? N_STEPS[st.idx] : 100, nPrev = S.on('demo-n') ? N_STEPS[st.prev] : 100;
  const cur = tally(n), prev = tally(nPrev), k = st.k;
  // ── panel de intervalos: encabezado, dos filas (A y B) y el eje ──
  const headH = FS(S, 13.5) * u + 14 * u, axisBlock = 8 * u + FS(S, 12) * u + 8 * u + FS(S, 12.5) * u + 4 * u;
  const avail = I.h - headH - axisBlock, rowH = Math.min(avail / 2, port ? 84 * u : 120 * u), off = (avail - 2 * rowH) / 2;
  const yA = I.y + headH + off + rowH / 2, yB = yA + rowH, axY = yB + rowH / 2;
  const x0 = I.x + 30 * u, x1 = I.x + I.w - 14 * u;
  const X = accAxis(S, x0, x1, axY, fr(S, 'two', 0.05, 0.2), S.l('exactitud (%)', 'accuracy (%)'));
  const aMeas = fr(S, 'two-100', 0.25, 0.4);
  // encabezado: «en realidad» y luego cuántos casos
  fitText(S, S.l('en realidad (supuesto)', 'in reality (assumed)'), I.x, I.y + 4 * u, I.w, 13.5, { weight: 800, base: 'top', color: p.ink2, a: fr(S, 'two', 0.05, 0.2) * (1 - fr(S, 'two-100', 0, 0.12)) });
  fitText(S, S.l(`${S.n(n, 0)} casos, los mismos para A y B`, `${S.n(n, 0)} cases, the same for A and B`), I.x, I.y + 4 * u, I.w, 13.5, { weight: 800, base: 'top', color: p.ink2, a: fr(S, 'two-100', 0.05, 0.18) });
  const rows = [{ key: 'A', real: PA * 100, y: yA, t: 'lat' as const, at: 0.25, up: true }, { key: 'B', real: PB * 100, y: yB, t: 'w' as const, at: 0.5, up: false }];
  // medición típica con n casos (fundida entre el tamaño anterior y el actual)
  const tyC = cur.runs[cur.typical], tyP = prev.runs[prev.typical];
  const meas = (key: string) => {
    const vC = (100 * (key === 'A' ? tyC.a : tyC.b)) / n, vP = (100 * (key === 'A' ? tyP.a : tyP.b)) / nPrev;
    const mC = 100 * margin(vC / 100, n), mP = 100 * margin(vP / 100, nPrev);
    return { v: lerp(vP, vC, k), m: lerp(mP, mC, k) };
  };
  const tick = rowH * 0.3;
  rows.forEach((r) => {
    const a = fr(S, 'two', r.at, r.at + 0.12), c = tone(S, r.t);
    d.withAlpha(a, () => {
      d.text(r.key, I.x + 4 * u, r.y, { size: FS(S, 18), weight: 800, font: 'mono', color: c.ink, base: 'middle' });
      d.line(X(r.real), r.y - tick, X(r.real), r.y + tick, c.c, 2, [4, 3]);
      fitText(S, S.l(`real: ${S.n(r.real, 0)}`, `true: ${S.n(r.real, 0)}`), X(r.real), r.up ? r.y - tick - 3 * u : r.y + tick + 3 * u, 140 * u, 13, { weight: 800, align: 'center', base: r.up ? 'bottom' : 'top', color: c.ink, a: 1 - aMeas, halo: true });
    });
    if (aMeas > 0.01) {
      const m = meas(r.key);
      interval(S, X, m.v - m.m, m.v + m.m, r.y, r.t, aMeas, { h: 14 });
      d.withAlpha(aMeas, () => d.circle(X(m.v), r.y, 6 * u, { fill: c.c, stroke: p.stage, lw: 2 }));
      const lab = S.l(`medido: ${S.n(m.v, 0)} ± ${S.n(m.m, 0)}`, `measured: ${S.n(m.v, 0)} ± ${S.n(m.m, 0)}`);
      fitText(S, lab, clamp(X(m.v), x0 + 70 * u, x1 - 70 * u), r.up ? r.y - 12 * u : r.y + 12 * u, 160 * u, 13, { weight: 800, align: 'center', base: r.up ? 'bottom' : 'top', color: c.ink, a: aMeas, halo: true });
    }
  });
  // la diferencia real: 4 puntos (entre las dos filas)
  const aGap = fr(S, 'two', 0.78, 0.9) * (S.on('two-100') ? 1 - fr(S, 'two-100', 0.05, 0.18) : 1);
  if (aGap > 0.01) d.withAlpha(aGap, () => {
    const y = (yA + yB) / 2, c = tone(S, 'err').c;
    d.line(X(74), y, X(78), y, c, 2.4); d.line(X(74), y - 5 * u, X(74), y + 5 * u, c, 2); d.line(X(78), y - 5 * u, X(78), y + 5 * u, c, 2);
    fitText(S, S.l('4 puntos', '4 points'), X(78) + 8 * u, y, 120 * u, 13.5, { weight: 800, base: 'middle', color: tone(S, 'err').ink, halo: true });
  });
  // se enciman: banda detrás de las dos barras
  const aOv = fr(S, 'two-100', 0.78, 0.9) * (S.on('wrong') ? 1 - fr(S, 'wrong', 0, 0.15) : 1);
  if (aOv > 0.01) {
    const mA = meas('A'), mB = meas('B'), lo = Math.max(mA.v - mA.m, mB.v - mB.m), hi = Math.min(mA.v + mA.m, mB.v + mB.m);
    if (hi > lo) d.withAlpha(aOv, () => {
      d.rect(X(lo), yA - 10 * u, X(hi) - X(lo), yB - yA + 20 * u, { fill: alpha(tone(S, 'err').c, 0.12), r: 3 });
      fitText(S, S.l('se enciman', 'they overlap'), (X(lo) + X(hi)) / 2, (yA + yB) / 2, Math.max(X(hi) - X(lo), 120 * u), 14, { weight: 800, align: 'center', base: 'middle', color: tone(S, 'err').ink, halo: true });
    });
  }
  if (!S.on('wrong')) return;
  // ── 100 comparaciones repetidas ──
  const aG = fr(S, 'wrong', 0.15, 0.3), titleH = FS(S, 13.5) * u + 10 * u;
  const Gr: Rect = port ? { x: A.x, y: A.y + A.h * 0.5, w: A.w * 0.56, h: A.h * 0.5 } : { x: A.x + A.w * 0.6, y: A.y, w: A.w * 0.4, h: A.h * 0.72 };
  fitText(S, S.l('100 comparaciones repetidas', '100 repeated comparisons'), Gr.x, Gr.y, port ? A.w : Gr.w, 13.5, { weight: 800, base: 'top', color: p.ink2, a: aG });
  const g = gridGeom({ x: Gr.x, y: Gr.y + titleH, w: Gr.w, h: Gr.h - titleH }, 10, 10, 28 * u);
  if (port) g.x = Gr.x;
  const fillG = fr(S, 'wrong', 0.22, 0.5, 'lin');
  for (let i = 0; i < 100; i++) {
    const a = aG * clamp(fillG * 110 - i);
    if (a <= 0.01) continue;
    const x = g.x + (i % 10) * g.s, y = g.y + Math.floor(i / 10) * g.s, m1 = markOf(cur.runs[i]), m0 = markOf(prev.runs[i]);
    if (m0 === m1 || k >= 1) mark(S, x, y, g.s, m1, a, 'lat');
    else { mark(S, x, y, g.s, m0, a * (1 - k), 'lat'); mark(S, x, y, g.s, m1, a * k, 'lat'); }
  }
  // contador: a la derecha de la cuadrícula (vertical) o debajo (horizontal)
  const C: Rect = port ? { x: g.x + g.w + 14 * u, y: g.y, w: A.x + A.w - g.x - g.w - 14 * u, h: g.h } : { x: Gr.x, y: g.y + g.h + 14 * u, w: Gr.w, h: A.y + A.h - g.y - g.h - 14 * u };
  const winA = Math.round(lerp(prev.winA, cur.winA, k)), other = 100 - winA;
  const big = FS(S, tight(S) ? 18 : 24), lgS = 15 * u;
  const item = (y: number, marks: Mark[], label: string, val: number, tn: 'lat' | 'err', a: number) => d.withAlpha(a, () => {
    marks.forEach((m, j) => mark(S, C.x + j * (lgS + 2 * u), y, lgS, m, 1, 'lat'));
    const lx = C.x + marks.length * (lgS + 2 * u) + 4 * u;
    if (port) {
      fitText(S, label, lx, y + lgS / 2, C.x + C.w - lx, 12.5, { weight: 700, base: 'middle' });
      d.text(S.n(val, 0), C.x, y + lgS + 6 * u, { size: big, weight: 800, font: 'mono', color: tone(S, tn).ink, base: 'top' });
    } else {
      fitText(S, label, lx, y + lgS / 2, C.w * 0.7, 13, { weight: 700, base: 'middle' });
      d.text(S.n(val, 0), C.x + C.w, y + lgS / 2, { size: big, weight: 800, font: 'mono', color: tone(S, tn).ink, align: 'right', base: 'middle' });
    }
  });
  const step = port ? lgS + 6 * u + big * u * 1.2 + 12 * u : Math.max(lgS, big * u) + 12 * u;
  item(C.y, ['ok'], S.l('gana A', 'A wins'), winA, 'lat', fr(S, 'wrong', 0.5, 0.62));
  item(C.y + step, ['tie', 'bad'], S.l('B empata o gana', 'B ties or wins'), other, 'err', fr(S, 'wrong', 0.7, 0.82));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La regla del empate
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawTie(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const panels = [{ n: 100, at: 0.15 }, { n: 1000, at: 0.42 }];
  const chipsH = chipH(S, 13) + 14 * u;
  const ph = (A.h - chipsH - 16 * u) / 2;
  panels.forEach((pn, i) => {
    const R: Rect = { x: A.x, y: A.y + i * (ph + 8 * u), w: A.w, h: ph }, a = fr(S, 'tie', pn.at, pn.at + 0.12);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      const titleH = FS(S, 13.5) * u * 1.3;
      fitText(S, S.l(`si mides 78 y 74 con ${S.n(pn.n, 0)} casos`, `if you measure 78 and 74 with ${S.n(pn.n, 0)} cases`), R.x, R.y, port ? R.w : R.w * 0.62, 13.5, { weight: 800, base: 'top', color: p.ink2 });
      const mA = 100 * margin(PA, pn.n), mB = 100 * margin(PB, pn.n), tie = 4 < mA;
      const txt = tie ? S.l(`diferencia 4 < margen ${S.n(mA, 0)}: empate`, `difference 4 < margin ${S.n(mA, 0)}: tie`) : S.l(`diferencia 4 > margen ${S.n(mA, 0)}: A es mejor`, `difference 4 > margin ${S.n(mA, 0)}: A is better`);
      const k = fr(S, 'tie', pn.at + 0.12, pn.at + 0.22);
      const top = R.y + titleH + (port ? chipH(S, 13) + 8 * u : 0) + 6 * u;
      if (port) chip(S, txt, R.x, R.y + titleH + 4 * u + chipH(S, 13) / 2, tie ? 'w' : 'lat', { a: k, align: 'left', size: 13, weight: 800, maxW: R.w });
      else chip(S, txt, R.x + R.w * 0.82, R.y + R.h / 2, tie ? 'w' : 'lat', { a: k, size: 13.5, weight: 800, maxW: R.w * 0.34 });
      const x0 = R.x + 26 * u, x1 = port ? R.x + R.w - 8 * u : R.x + R.w * 0.62, axY = R.y + R.h - FS(S, 12) * u - 14 * u;
      const X = accAxis(S, x0, x1, axY, 1);
      const y1 = top + (axY - top) * 0.3, y2 = top + (axY - top) * 0.72;
      interval(S, X, 78 - mA, 78 + mA, y1, 'lat', 1, { h: 12 }); d.circle(X(78), y1, 5 * u, { fill: tone(S, 'lat').c });
      interval(S, X, 74 - mB, 74 + mB, y2, 'w', 1, { h: 12 }); d.circle(X(74), y2, 5 * u, { fill: tone(S, 'w').c });
      d.text('A', R.x + 4 * u, y1, { size: FS(S, 15), weight: 800, font: 'mono', color: tone(S, 'lat').ink, base: 'middle' });
      d.text('B', R.x + 4 * u, y2, { size: FS(S, 15), weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'middle' });
    });
  });
  // decide por costo, rapidez o riesgo
  const items = [S.l('costo', 'cost'), S.l('rapidez', 'speed'), S.l('riesgo', 'risk')];
  const yC = A.y + A.h - chipH(S, 13) / 2 - 2 * u;
  const lead = S.l('si empatan, decide por:', 'if they tie, decide on:');
  const lw = S.d.measure(lead, { size: FS(S, 13), weight: 800 }) + 10 * u;
  const total = lw + items.reduce((s, t) => s + chipW(S, t, 13) + 8 * u, 0);
  let x = A.x + Math.max(0, (A.w - total) / 2);
  const k0 = fr(S, 'tie', 0.72, 0.82);
  fitText(S, lead, x, yC, lw, 13, { weight: 800, base: 'middle', a: k0, color: p.ink2 });
  x += lw;
  items.forEach((t, i) => { const c = chip(S, t, x, yC, 'sig', { align: 'left', a: fr(S, 'tie', 0.76 + i * 0.05, 0.84 + i * 0.05) }); x += c.w + 8 * u; });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Mismos casos o casos distintos
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawPaired(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const sides = [{ t: tally(400, true), lab: S.l('los mismos 400 casos para los dos', 'the same 400 cases for both'), at: 0.12 }, { t: tally(400, false), lab: S.l('400 casos distintos para cada uno', '400 different cases for each'), at: 0.55 }];
  sides.forEach((s, i) => {
    const R: Rect = port ? { x: A.x, y: A.y + i * A.h / 2, w: A.w, h: A.h / 2 - 8 * u } : { x: A.x + i * A.w / 2, y: A.y, w: A.w / 2 - 12 * u, h: A.h };
    const a = fr(S, 'paired', s.at, s.at + 0.14);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      fitText(S, s.lab, R.x, R.y, R.w, 13.5, { weight: 800, base: 'top', color: p.ink2 });
      const top = R.y + FS(S, 13.5) * u + 10 * u, big = FS(S, tight(S) ? 18 : 22);
      const gr: Rect = port ? { x: R.x, y: top, w: R.w * 0.56, h: R.h - (top - R.y) } : { x: R.x, y: top, w: R.w, h: R.h - (top - R.y) - big * u * 1.4 - 10 * u };
      const g = cmpGrid(S, gr, s.t, null, 1, 1, port ? 20 : 28);
      if (port) {
        const tx = g.x + g.w + 14 * u, tw = R.x + R.w - tx;
        fitText(S, S.l('A gana', 'A wins'), tx, g.y + 4 * u, tw, 13, { weight: 700, base: 'top', color: p.ink2 });
        fitText(S, ofN(S, s.t.winA, 100), tx, g.y + 4 * u + FS(S, 13) * u * 1.4, tw, tight(S) ? 18 : 22, { weight: 800, font: 'mono', base: 'top', color: tone(S, i ? 'err' : 'lat').ink });
      } else fitText(S, S.l(`A gana: ${s.t.winA} de 100`, `A wins: ${s.t.winA} of 100`), g.x + g.w / 2, g.y + g.h + 12 * u, R.w, tight(S) ? 18 : 22, { weight: 800, font: 'mono', align: 'center', base: 'top', color: tone(S, i ? 'err' : 'lat').ink });
    });
  });
}
