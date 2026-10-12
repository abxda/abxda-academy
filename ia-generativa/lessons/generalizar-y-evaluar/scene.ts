// Escena: Generalizar y evaluar. Ajuste polinómico real (sub/sobreajuste, regularización, parada temprana),
// y un clasificador de juguete con umbral, matriz de confusión, costos y tasa base. Todo se calcula de verdad en math.ts.
// La escena hace sola las demostraciones (grado, lambda, umbral) con S.drive; los «tu turno» son opcionales.
import {
  Plot, alpha, badge, bars, box, clamp, hash, inset, lerp, neu, regions, rng, tone, type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { BEST_DEG, BY_DEGREE, CURVES, MU_NEG, MU_POS, N_POP, PREV, TRAIN, VAL, confusion, evalPoly, f, fitPoly, pdf, rmse } from './math';

const BEST_VAL = Math.min(...BY_DEGREE.map((b) => b.val));
const lamOf = (e: number) => (e <= -5.9 ? 0 : 10 ** e);
const THR0 = 0.8;   // umbral inicial del control: marca demasiado (recall 99 %, precisión 34 %), de modo que el gate exige moverlo; con 1.7 ya se cumplía sin tocar nada
const COSTS: Record<string, [number, number]> = { equal: [1, 1], fn: [10, 1], fp: [1, 10] };   // [costo de FN, costo de FP]

interface St { degSeen: Record<number, boolean>; thrSeen: number }
const stOf = (S: Frame): St => (S.st.s ??= { degSeen: {}, thrSeen: 0 });
/** Progreso 0..1 entre las fracciones a y b del segmento k. */
const fr = (S: Frame, k: string, a: number, b: number) => clamp(((S.t - S.start(k)) / Math.max(0.5, S.end(k) - S.start(k)) - a) / (b - a));

const scene: SceneFactory = () => ({
  controls: [
    { id: 'deg', kind: 'slider', label: { es: 'Grado del polinomio', en: 'Polynomial degree' }, min: 1, max: 10, step: 1, value: 1, from: 'deg-demo', to: 'gap', fmt: (v) => String(v) },
    { id: 'lam', kind: 'slider', label: { es: 'Regularización λ (escala logarítmica)', en: 'Regularization λ (log scale)' }, min: -6, max: 1, step: 0.25, value: -6, from: 'reg-demo', to: 'early', fmt: (v) => (v <= -5.9 ? '0' : (10 ** v).toExponential(0).replace('e-', '·10⁻').replace('e+', '·10')) },
    { id: 'thr', kind: 'slider', label: { es: 'Umbral de decisión', en: 'Decision threshold' }, min: -1, max: 5, step: 0.05, value: THR0, from: 'thr-demo', to: 'base', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { id: 'costs', kind: 'choice', label: { es: 'Qué cuesta más', en: 'What costs more' }, value: 'equal', from: 'cost', to: 'base', options: [{ value: 'equal', label: { es: 'Igual', en: 'Equal' } }, { value: 'fn', label: { es: 'Perder un caso', en: 'Missing a case' } }, { value: 'fp', label: { es: 'Falsa alarma', en: 'False alarm' } }] },
  ],

  init(S) { S.st.s = { degSeen: {}, thrSeen: 0 }; },

  update(S) {
    const st = stOf(S);
    // demostraciones guiadas (mientras la persona no toque ese control)
    if (S.between('deg-demo', 'gap')) S.drive('deg', S.on('try1') ? 4 : 1 + Math.min(9, Math.floor(fr(S, 'deg-demo', 0.08, 0.85) * 9.999)));
    if (S.between('reg-demo', 'early')) S.drive('lam', S.on('try2') ? -2.5 : Math.round((-6 + 3.5 * fr(S, 'reg-demo', 0.15, 0.75)) * 4) / 4);
    if (S.between('thr-demo', 'base')) {
      const t = S.on('try3') ? 1.7 : fr(S, 'thr-demo', 0.12, 0.42) < 1 ? 1.7 - 1.1 * fr(S, 'thr-demo', 0.12, 0.42) : 0.6 + 2.4 * fr(S, 'thr-demo', 0.55, 0.85);
      S.drive('thr', Math.round(t * 20) / 20);
    }
    if (S.between('try1', 'gap') && S.touched.has('deg')) {
      const d = S.p.deg ?? 1;
      st.degSeen[d] = true;
      const seen = Object.keys(st.degSeen).length, v = BY_DEGREE[d - 1].val;
      if (seen >= 4 && v <= BEST_VAL * 1.03) S.complete('degree');
    }
    if (S.between('try2', 'early') && S.touched.has('lam')) {
      const w = fitPoly(10, lamOf(S.p.lam ?? -6));
      if (rmse(w, VAL) <= 0.262) S.complete('reg');
    }
    if (S.between('try3', 'cost') && S.touched.has('thr')) {
      const c = confusion(S.p.thr ?? THR0);
      if (c.recall >= 0.85 && c.precision >= 0.6) S.complete('threshold');
    }
  },

  render(S) {
    const g = groupOf(S), prev = groupOf(S, Math.max(0, S.seg - 1));
    const fade = g !== prev && S.seg > 0 ? clamp(S.segT / 0.5) : 1;
    S.d.withAlpha(fade, () => {
      switch (g) {
        case 'fit': return drawFit(S, false);
        case 'gap': return drawGap(S);
        case 'split': return drawSplit(S);
        case 'reg': return drawFit(S, true);
        case 'early': return drawEarly(S);
        case 'trap': return drawPeople(S, false);
        case 'conf': return drawConf(S);
        case 'base': return drawPeople(S, true);
        case 'recap': return drawRecap(S);
        default: return drawBridge(S);
      }
    });
  },
});

function groupOf(S: Frame, seg = S.seg) {
  const id = (k: string) => S.segIndex(k);
  if (seg < id('gap')) return 'fit';
  if (seg === id('gap')) return 'gap';
  if (seg < id('reg')) return 'split';
  if (seg < id('early')) return 'reg';
  if (seg === id('early')) return 'early';
  if (seg < id('confusion')) return 'trap';
  if (seg < id('base')) return 'conf';
  if (seg < id('recap')) return 'base';
  if (seg === id('recap')) return 'recap';
  return 'bridge';
}

// ═════════ ajuste polinómico (grados y regularización) ═════════
function drawFit(S: Frame, reg: boolean) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.74 : 0.66);
  const plot = new Plot(S, R.main, { xr: [0, 1], yr: [-1.1, 1.3], xLabel: 'x', yLabel: 'y', xTicks: [0, 0.5, 1], yTicks: [-1, 0, 1], tickFmt: (v) => String(v), pad: { l: 30, b: 30, t: 14, r: 10 } });
  if (S.is('hook')) {   // gancho: lo que dice el modelo con datos vistos frente a datos nuevos
    const cx = S.W / 2, cy = S.H / 2, a = S.reveal('hook', 0.2, 0.7), b = S.reveal('hook', 1.6, 0.7), P = S.portrait;
    const x1 = P ? cx : cx - 140 * u, x2 = P ? cx : cx + 140 * u, y1 = P ? cy - 110 * u : cy - 50 * u, y2 = P ? cy + 20 * u : cy - 50 * u;
    d.withAlpha(a, () => { d.text(S.l('con los datos que ya vio', 'on the data it has seen'), x1, y1, { size: 14, weight: 700, color: p.ink2, align: 'center' }); d.text('100 %', x1, y1 + 14 * u, { size: 52, weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'top' }); });
    d.withAlpha(b, () => { d.text(S.l('con casos nuevos', 'on new cases'), x2, y2, { size: 14, weight: 700, color: p.ink2, align: 'center' }); d.text('?', x2, y2 + 14 * u, { size: 60, weight: 800, font: 'mono', color: tone(S, 'lat').ink, align: 'center', base: 'top' }); });
    return;
  }
  plot.axes(S.reveal('data', 0, 0.6));
  // señal verdadera, solo como pista tenue
  if (S.on('val')) plot.curve(f, 'mute', 1.5, { dash: [4, 5], a: 0.7 });
  // qué modelo se dibuja
  const ids = (k: string) => S.on(k);
  let w: number[] | null = null, wPrev: number[] | null = null, t = 1, label = '';
  const narr = S.between('underfit', 'deg-demo');
  if (reg) { w = fitPoly(10, lamOf(S.p.lam ?? -6)); label = `${S.l('grado', 'degree')} 10 · λ = ${lamOf(S.p.lam ?? -6) === 0 ? '0' : (10 ** (S.p.lam ?? -6)).toExponential(0)}`; }
  else if (S.between('deg-demo', 'gap')) { const dd = S.p.deg ?? 1; w = BY_DEGREE[dd - 1].w; label = `${S.l('grado', 'degree')} ${dd}`; }
  else if (narr) {
    if (ids('overfit')) { w = BY_DEGREE[9].w; wPrev = BY_DEGREE[3].w; t = S.at('overfit', 0.2, 1.6, 'io'); label = `${S.l('grado', 'degree')} 10`; }
    else if (ids('good')) { w = BY_DEGREE[3].w; wPrev = BY_DEGREE[2].w; t = S.at('good', 0.2, 1.4, 'io'); label = `${S.l('grado', 'degree')} 4`; }
    else if (ids('flex')) {
      // cada grado más permite una curva más: grado 1 → 2 → 3
      const f = fr(S, 'flex', 0.35, 0.95) * 2, k = Math.min(1, Math.floor(f)), q = clamp((f - k) / 0.6);
      wPrev = BY_DEGREE[k].w; w = BY_DEGREE[k + 1].w; t = q; label = `${S.l('grado', 'degree')} ${q > 0.5 ? k + 2 : k + 1}`;
    }
    else { w = BY_DEGREE[0].w; t = S.at('underfit', 0.2, 1.2); label = `${S.l('grado', 'degree')} 1`; }
  }
  const showVal = S.on('val') || reg;
  // puntos de entrenamiento y validación
  const k = S.reveal('data', 0, 0.8);
  TRAIN.x.forEach((x, i) => { const a = clamp(k * 12 - i); if (a > 0) plot.dot(x, TRAIN.y[i], 4.6 * a, 'dat'); });
  if (showVal) { const a = reg ? 1 : S.reveal('val', 0.2, 0.8); VAL.x.forEach((x, i) => plot.dot(x, VAL.y[i], 2.6, 'lat', { ring: true, a: a * 0.75 })); }
  if (w) {
    const curve = (x: number) => (wPrev && t < 1 ? lerp(evalPoly(wPrev, x), evalPoly(w!, x), t) : evalPoly(w!, x));
    plot.curve(curve, 'ink', 3, { a: S.between('underfit', 'data') ? 0 : 1, n: 260 });
    d.text(label, plot.r.x + plot.r.w - 6, plot.r.y + 8, { size: 15, weight: 800, align: 'right', base: 'top', halo: p.stage });
  }
  // lectura de errores
  if (w && !S.is('underfit') || (w && S.is('underfit'))) {
    const eT = rmse(w!, TRAIN) * (wPrev && t < 1 ? 1 : 1), eV = rmse(w!, VAL);
    const a = S.reveal(reg ? 'reg' : 'underfit', 0.5, 0.6), r = R.aside;
    d.withAlpha(a, () => {
      d.text(S.l('error (RMSE)', 'error (RMSE)'), r.x, r.y + 2, { size: 12, weight: 700, color: p.mute });
      bars(S, { x: r.x, y: r.y + 16 * u, w: r.w, h: 70 * u }, [
        { label: S.l('entrenamiento', 'training'), value: eT, tone: 'dat', hot: !showVal },
        ...(showVal ? [{ label: S.l('validación', 'validation'), value: eV, tone: 'lat' as const, hot: true }] : []),
      ], { max: 0.45, fmt: (v) => S.n(v, 2), labelW: S.portrait ? 92 * u : Math.min(104 * u, r.w * 0.42), rowH: 30 * u, size: 12 });
      if (showVal) d.text(S.l(`ruido de las mediciones: 0.20`, `measurement noise: 0.20`).replace(/0[,.]20/, S.n(0.2, 2)), r.x, r.y + 96 * u, { size: 11, color: p.mute, w: r.w });
    });
  }
  if (S.is('overfit') && S.at('overfit', 1.6, 2.2) > 0) d.withAlpha(S.at('overfit', 1.6, 2.2), () => badge(S, S.l('casi sin error aquí…', 'almost no error here…'), plot.X(0.5), plot.Y(1.18), { tone: 'dat' }));
  if (S.is('val') && S.at('val', 1.0, 1.6) > 0) d.withAlpha(S.at('val', 1.0, 1.6), () => badge(S, S.l('…pero mucho aquí', '…but a lot here'), plot.X(0.5), plot.Y(-0.98), { tone: 'lat' }));
  if (S.between('data', 'underfit')) d.withAlpha(S.reveal('data', 0.8, 0.5), () => badge(S, S.l('datos de entrenamiento (simulados)', 'training data (simulated)'), plot.X(0.5), plot.Y(1.18), { tone: 'dat' }));
  if (showVal && !reg) d.withAlpha(S.reveal('val', 0.2, 0.6), () => { d.circle(plot.r.x + 12 * u, plot.r.y + plot.r.h + 24 * u, 4 * u, { stroke: tone(S, 'lat').c, lw: 1.5 }); d.text(S.l('validación', 'validation'), plot.r.x + 22 * u, plot.r.y + plot.r.h + 24 * u, { size: 11, color: p.ink2, base: 'middle' }); });
}

// ═════════ error frente a grado (la brecha) ═════════
function drawGap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.78 : 0.68);
  const plot = new Plot(S, R.main, { xr: [1, 10], yr: [0, 0.42], xLabel: S.l('grado (complejidad)', 'degree (complexity)'), yLabel: S.l('error', 'error'), xTicks: [1, 4, 7, 10], yTicks: [0, 0.2, 0.4], tickFmt: (v) => S.n(v, Number.isInteger(v) ? 0 : 1), pad: { l: 38, b: 34, t: 14, r: 12 } });
  plot.axes();
  const sweep = 1 + 9 * S.at('gap', 0.3, 3.2, 'out');
  const part = (key: 'train' | 'val') => BY_DEGREE.filter((b) => b.deg <= sweep).map((b) => [plot.X(b.deg), plot.Y(b[key])] as [number, number]);
  d.polyline(part('train'), tone(S, 'dat').c, 3); d.polyline(part('val'), tone(S, 'lat').c, 3);
  BY_DEGREE.filter((b) => b.deg <= sweep).forEach((b) => { plot.dot(b.deg, b.train, 3.5, 'dat'); plot.dot(b.deg, b.val, 3.5, 'lat'); });
  const a = S.at('gap', 3.0, 3.8);
  d.withAlpha(a, () => {
    plot.line(BEST_DEG, 0, BEST_DEG, 0.42, 'ink', 1.5, [4, 4]);
    badge(S, S.l(`mejor: grado ${BEST_DEG}`, `best: degree ${BEST_DEG}`), plot.X(BEST_DEG), plot.Y(0.4), { tone: 'sig' });
    const b10 = BY_DEGREE[9]; d.line(plot.X(10), plot.Y(b10.train), plot.X(10), plot.Y(b10.val), tone(S, 'err').c, 2.5);
    d.text(S.l('brecha', 'gap'), plot.X(10) - 8, (plot.Y(b10.train) + plot.Y(b10.val)) / 2, { size: 13, weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle', halo: p.stage });
  });
  const r = R.aside, items: [string, 'dat' | 'lat'][] = [[S.l('error de entrenamiento', 'training error'), 'dat'], [S.l('error de validación', 'validation error'), 'lat']];
  items.forEach(([t, tn], i) => { const x = S.portrait ? r.x + i * r.w / 2 : r.x, y = S.portrait ? r.y + 8 * u : r.y + 10 * u + i * 26 * u; d.rect(x, y, 16 * u, 4 * u, { fill: tone(S, tn).c }); d.text(t, x + 24 * u, y + 2 * u, { size: 12, weight: 600, color: p.ink2, base: 'middle' }); });
  if (S.p.deg) d.text(S.l(`tu grado: ${S.p.deg}`, `your degree: ${S.p.deg}`), r.x, r.y + (S.portrait ? 34 : 70) * u, { size: 12, weight: 700, color: p.ink2 });
}

// ═════════ tres conjuntos y la fuga ═════════
function drawSplit(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const W = R.w - 8 * u, x0 = R.x + 4 * u, y0 = R.y + R.h * (S.portrait ? 0.2 : 0.28), h = 56 * u;
  const parts = [{ k: 70, es: 'Entrenamiento', en: 'Training', do_es: 'ajusta los pesos', do_en: 'fits the weights', t: 'dat' as const }, { k: 15, es: 'Validación', en: 'Validation', do_es: 'elige el modelo', do_en: 'chooses the model', t: 'lat' as const }, { k: 15, es: 'Prueba', en: 'Test', do_es: 'informa, una vez', do_en: 'reports, once', t: 'ink' as const }];
  let x = x0;
  parts.forEach((pt, i) => {
    const w = (W * pt.k) / 100, a = S.reveal('split', 0.2 + i * 0.5, 0.5), t = tone(S, pt.t);
    const once = i === 2 && S.is('test-once') ? fr(S, 'test-once', 0.1, 0.25) : 0;
    if (once > 0.01) d.withAlpha(once, () => { d.rect(x - 4 * u, y0 - 4 * u, w + 5 * u, h + 8 * u, { stroke: tone(S, 'sig').c, lw: 3, r: 4 }); badge(S, S.l('se usa una sola vez', 'used only once'), x + w / 2, y0 - 22 * u, { tone: 'sig' }); });
    d.withAlpha(a, () => {
      d.rect(x, y0, w - 3, h, { fill: i === 2 ? p.surface2 : alpha(t.c, 0.2), stroke: t.c, lw: 2, r: 3 });
      d.text(`${pt.k} %`, x + w / 2, y0 + h / 2, { size: S.portrait && i > 0 ? 12 : 16, weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
      const lab = S.portrait && i > 0 ? S.l(pt.es.slice(0, 6) + '.', pt.en.slice(0, 5) + '.') : S.l(pt.es, pt.en);
      d.text(lab, x + w / 2, y0 + h + 18 * u, { size: 13, weight: 700, color: p.ink, align: 'center' });
      if (!S.portrait || i === 0) d.text(S.l(pt.do_es, pt.do_en), x + w / 2, y0 + h + 38 * u, { size: 12, weight: 600, color: p.ink2, align: 'center', w: Math.max(80 * u, w) });
      if (S.portrait && i > 0) d.text(S.l(pt.do_es, pt.do_en), x + w / 2, y0 + h + 38 * u + (i - 1) * 16 * u + 0, { size: 11, weight: 600, color: p.ink2, align: i === 1 ? 'center' : 'right' });
    });
    x += w;
  });
  d.text(S.l('reparto de ejemplo: no hay una regla única (depende del tamaño de los datos y de su ruido)', 'example split: there is no single rule (it depends on the size of the data and its noise)'), R.x + R.w / 2, R.y + R.h - 6 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom', w: R.w - 16 * u });
  if (S.is('leak')) {
    const a = S.reveal('leak', 0.3, 0.7), tx = x0 + W * 0.85, fx = x0 + W * 0.35, ay = y0 - 24 * u;
    d.withAlpha(a, () => {
      const c = tone(S, 'err').c;
      d.polyline([[tx, y0 - 2], [tx, ay], [fx, ay], [fx, y0 - 2]], c, 3);
      d.arrow(fx, ay + 2, fx, y0 - 3, c, 3, 9);
      badge(S, S.l('fuga de datos', 'data leakage'), (tx + fx) / 2, ay - 18 * u, { tone: 'err' });
      d.text(S.l('el examen se cuela en el entrenamiento: el resultado parece mejor de lo que es', 'the exam slips into training: the result looks better than it is'), x0 + W / 2, y0 + h + 90 * u, { size: 14, weight: 700, color: tone(S, 'err').ink, align: 'center', w: W - 16 * u });
    });
  }
}

// ═════════ curvas de entrenamiento y parada temprana ═════════
function drawEarly(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.78 : 0.7);
  const xs = (e: number) => Math.log10(e + 1);
  const plot = new Plot(S, R.main, { xr: [0, xs(20000)], yr: [0, 0.56], xLabel: S.l('épocas (escala logarítmica)', 'epochs (log scale)'), yLabel: S.l('error', 'error'), xTicks: [0, 1, 2, 3, 4], yTicks: [0, 0.25, 0.5], tickFmt: (v) => (v <= 4 && Number.isInteger(v) && v !== 0.0 ? '10' + '⁰¹²³⁴'[v] : S.n(v, v === 0 ? 0 : 2)), pad: { l: 40, b: 34, t: 14, r: 12 } });
  plot.axes();
  const sweep = S.at('early', 0.3, 4.5, 'out') * xs(20000);
  const pts = (key: 'train' | 'val') => CURVES.curves.filter((c) => xs(c.e) <= sweep && c.e > 0).map((c) => [plot.X(xs(c.e)), plot.Y(clamp(c[key], 0, 0.5))] as [number, number]);
  d.polyline(pts('train'), tone(S, 'dat').c, 3); d.polyline(pts('val'), tone(S, 'lat').c, 3);
  const a = S.at('early', 4.5, 5.3);
  d.withAlpha(a, () => {
    const b = CURVES.best;
    plot.line(xs(b.e), 0, xs(b.e), 0.5, 'sig', 2, [4, 4]);
    badge(S, S.l('parar aquí', 'stop here'), plot.X(xs(b.e)), plot.Y(0.46), { tone: 'sig' });
    plot.dot(xs(b.e), b.val, 5, 'sig');
  });
  const r = R.aside;
  [[S.l('entrenamiento', 'training'), 'dat'], [S.l('validación', 'validation'), 'lat']].forEach(([t, tn], i) => { const x = S.portrait ? r.x + i * r.w / 2 : r.x, y = S.portrait ? r.y + 8 * u : r.y + 10 * u + i * 26 * u; d.rect(x, y, 16 * u, 4 * u, { fill: tone(S, tn as 'dat').c }); d.text(t, x + 24 * u, y + 2 * u, { size: 12, weight: 600, color: p.ink2, base: 'middle' }); });
  d.withAlpha(a, () => d.text(S.l(`mejor validación: época ${CURVES.best.e}`, `best validation: epoch ${CURVES.best.e}`), r.x, r.y + (S.portrait ? 36 : 70) * u, { size: 12, weight: 700, color: tone(S, 'sig').ink, w: r.w }));
}

// ═════════ personas: la trampa de la exactitud y la tasa base ═════════
function drawPeople(S: Frame, base: boolean) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const n = base ? 2000 : 1000, cols = base ? (S.portrait ? 40 : 50) : (S.portrait ? 25 : 40), rows = Math.ceil(n / cols);
  const gh = R.h * (S.portrait ? 0.56 : 0.62), cs = Math.floor(Math.min(R.w / cols, gh / rows)), gw = cs * cols, x0 = R.x + (R.w - gw) / 2, y0 = R.y + 6 * u;
  const r = rng(base ? 91 : 17), sickN = base ? 20 : 10;
  const sick = new Set<number>(); while (sick.size < sickN) sick.add(Math.floor(r() * n));
  // en la tasa base: 95 % de los enfermos se detectan y 5 % de los sanos se marcan por error
  const flagged = new Set<number>(); let tp = 0, fp = 0;
  if (base) {
    const arr = [...sick]; arr.forEach((i, k) => { if (k < 19) { flagged.add(i); tp++; } });
    const rr = rng(5); while (fp < 99) { const i = Math.floor(rr() * n); if (!sick.has(i) && !flagged.has(i)) { flagged.add(i); fp++; } }
  }
  const aSick = S.reveal(base ? 'base' : 'metric', 0.4, 0.8), aFlag = base && S.on('base3') ? fr(S, 'base3', 0.05, 0.6) : 0;
  const order = [...flagged].sort((a, b) => hash(a, 3) - hash(b, 3));
  for (let i = 0; i < n; i++) {
    const cx = x0 + (i % cols) * cs, cy = y0 + Math.floor(i / cols) * cs, isSick = sick.has(i);
    let fill = alpha(p.mute, 0.22);
    if (isSick) fill = alpha(tone(S, 'err').c, 0.15 + 0.85 * aSick);
    const fl = flagged.has(i) && order.indexOf(i) < aFlag * order.length;
    d.rect(cx, cy, cs - 1, cs - 1, { fill });
    if (fl) d.rect(cx - 0.5, cy - 0.5, cs, cs, { stroke: isSick ? tone(S, 'err').c : tone(S, 'w').c, lw: Math.max(1.5, cs / 4) });
  }
  const ty = y0 + rows * cs + 18 * u;
  const lead = (x: number, y: number, l: string, v: string, t: 'ink' | 'err' | 'w' | 'dat') => { d.text(l, x, y, { size: 12, weight: 700, color: p.mute }); d.text(v, x, y + 6 * u, { size: S.portrait ? 24 : 30, weight: 800, font: 'mono', color: tone(S, t).ink, base: 'top' }); };
  if (!base) {
    d.withAlpha(S.reveal('metric', 0.8, 0.5), () => d.text(S.l('1 000 personas · 10 enfermas (1 %)', '1,000 people · 10 sick (1%)'), R.x + R.w / 2, ty, { size: 14, weight: 700, color: p.ink2, align: 'center' }));
    if (S.on('trap')) d.withAlpha(S.reveal('trap', 0.3, 0.6), () => { badge(S, S.l('el clasificador siempre dice «sano»', 'the classifier always says “healthy”'), R.x + R.w / 2, ty + 34 * u, { tone: 'mute' }); lead(R.x + R.w * 0.15, ty + 60 * u, S.l('exactitud', 'accuracy'), '99 %', 'dat'); lead(R.x + R.w * 0.55, ty + 60 * u, S.l('enfermos detectados (recall)', 'sick detected (recall)'), '0 %', 'err'); });
  } else {
    d.withAlpha(S.reveal('base', 0.8, 0.5), () => d.text(S.l('2 000 personas · 20 enfermas (1 %)', '2,000 people · 20 sick (1%)'), R.x + R.w / 2, ty, { size: 14, weight: 700, color: p.ink2, align: 'center' }));
    if (S.is('base2')) badge(S, S.l('la prueba acierta el 95 % con sanos y con enfermos', 'the test is right 95% of the time, healthy or sick'), R.x + R.w / 2, ty + 34 * u, { tone: 'ink', a: fr(S, 'base2', 0.35, 0.5) });
    if (S.on('base3')) d.withAlpha(clamp(aFlag * 2), () => {
      const k = aFlag >= 0.99;
      lead(R.x + R.w * 0.04, ty + 30 * u, S.l('enfermos detectados', 'sick detected'), k ? '19 / 20' : String(Math.round(aFlag * 19)), 'err');
      lead(R.x + R.w * 0.36, ty + 30 * u, S.l('falsas alarmas', 'false alarms'), k ? '99' : String(Math.round(aFlag * 99)), 'w');
      lead(R.x + R.w * 0.66, ty + 30 * u, S.l('precisión', 'precision'), k ? '16 %' : '…', 'ink');
    });
    neu(S, R.x + R.w - 70 * u, R.y + R.h - 58 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: fr(S, 'base3', 0.65, 0.8) });
  }
}

// ═════════ distribución de puntuaciones, matriz de confusión, costos ═════════
function drawConf(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.62 : 0.6);
  const fixed = S.between('confusion', 'thr-demo');
  const t = fixed ? 1.7 : S.p.thr ?? THR0, c = confusion(t);
  const plot = new Plot(S, R.main, { xr: [-3, 6.5], yr: [0, 1.0], xLabel: S.l('puntuación del modelo', 'model score'), yLabel: S.l('personas', 'people'), xTicks: [-2, 0, 2, 4, 6], yTicks: [], pad: { l: 14, b: 32, t: 10, r: 10 } });
  plot.axes();
  const nNeg = N_POP * (1 - PREV), nPos = N_POP * PREV, k = 0.88 / (nNeg * pdf(0, 0));      // misma escala de personas para las dos campanas
  const neg = (x: number) => nNeg * pdf(x, MU_NEG) * k, pos = (x: number) => nPos * pdf(x, MU_POS) * k;
  const reveal = S.reveal('confusion', 0.2, 0.9);
  // áreas: a la derecha del umbral = marcados positivos
  const fillArea = (fn: (x: number) => number, from: number, to: number, col: string, a: number) => {
    const pts: [number, number][] = [[plot.X(from), plot.Y(0)]];
    for (let i = 0; i <= 80; i++) { const x = lerp(from, to, i / 80); pts.push([plot.X(x), plot.Y(fn(x))]); }
    pts.push([plot.X(to), plot.Y(0)]);
    plot.clip(() => d.polygon(pts, { fill: alpha(col, a) }));
  };
  d.withAlpha(reveal, () => {
    fillArea(neg, -3, t, tone(S, 'dat').c, 0.12); fillArea(neg, t, 6.5, tone(S, 'w').c, 0.45);
    fillArea(pos, -3, t, tone(S, 'err').c, 0.1); fillArea(pos, t, 6.5, tone(S, 'err').c, 0.45);
    plot.curve(neg, 'dat', 2.5); plot.curve(pos, 'err', 2.5);
    plot.line(t, 0, t, 1, 'ink', 2.5);
    badge(S, S.l('umbral', 'threshold'), plot.X(t), plot.Y(0.97), { tone: 'sig' });
    d.text(S.l('sanos', 'healthy'), plot.X(-1.1), plot.Y(0.7), { size: 13, weight: 800, color: tone(S, 'dat').ink, halo: p.stage });
    d.text(S.l('enfermos', 'sick'), plot.X(MU_POS), plot.Y(0.22), { size: 13, weight: 800, color: tone(S, 'err').ink, align: 'center', halo: p.stage });
  });
  // matriz de confusión
  const r = R.aside, cs = Math.min(S.portrait ? 62 * u : 84 * u, r.w / 2.6), lw = S.portrait ? 40 * u : 50 * u, mx = r.x + lw, my = r.y + 26 * u;
  const cells = [
    // filas = lo real (arriba enfermos, abajo sanos); columnas = lo que marcó el modelo (+ a la izquierda, − a la derecha)
    { k: 'tp', v: c.tp, t: 'err' as const, es: 'VP', en: 'TP', i: 0, j: 0, at: 0.3 }, { k: 'fn', v: c.fn, t: 'err' as const, es: 'FN', en: 'FN', i: 0, j: 1, at: 1.0 },
    { k: 'fp', v: c.fp, t: 'w' as const, es: 'FP', en: 'FP', i: 1, j: 0, at: 1.7 }, { k: 'tn', v: c.tn, t: 'dat' as const, es: 'VN', en: 'TN', i: 1, j: 1, at: 2.4 },
  ];
  d.withAlpha(reveal, () => {
    d.text(S.l('otro ejemplo (simulado): 1 000 personas · 100 enfermas (10 %)', 'another example (simulated): 1,000 people · 100 sick (10%)'), r.x, r.y + 2 * u, { size: 11, weight: 600, color: p.mute, w: r.w });
    d.text(S.l('marcado +', 'flagged +'), mx + cs * 0.5, my - 10 * u, { size: 11, weight: 700, color: p.ink2, align: 'center' });
    d.text(S.l('marcado −', 'flagged −'), mx + cs * 1.5, my - 10 * u, { size: 11, weight: 700, color: p.ink2, align: 'center' });
    d.text(S.l('real +', 'real +'), mx - 6 * u, my + cs * 0.5, { size: 11, weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    d.text(S.l('real −', 'real −'), mx - 6 * u, my + cs * 1.5, { size: 11, weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    // las cuatro casillas, vacías, para que desde «confusion» se lea como tabla
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) d.rect(mx + j * cs, my + i * cs, cs - 3, cs - 3, { stroke: p.line, lw: 1.5 });
    cells.forEach((q) => {
      // «confusion»: la tabla vacía; «tp-fn»: la fila de los enfermos; «fp-tn»: la de los sanos
      const row = q.k === 'tp' || q.k === 'fn' ? 'tp-fn' : 'fp-tn', at = q.k === 'tp' || q.k === 'fp' ? 0.12 : 0.5;
      const a = fixed && !S.on(row) ? 0 : fixed && S.is(row) ? fr(S, row, at, at + 0.12) : 1, tn = tone(S, q.t);
      d.withAlpha(a, () => {
        d.rect(mx + q.j * cs, my + q.i * cs, cs - 3, cs - 3, { fill: tn.soft, stroke: tn.c, lw: 1.5 });
        d.text(String(Math.round(q.v)), mx + q.j * cs + (cs - 3) / 2, my + q.i * cs + (cs - 3) / 2 - 6 * u, { size: S.portrait ? 18 : 22, weight: 800, font: 'mono', color: tn.ink, align: 'center', base: 'middle' });
        d.text(S.l(q.es, q.en), mx + q.j * cs + (cs - 3) / 2, my + q.i * cs + (cs - 3) / 2 + 14 * u, { size: 11, weight: 700, color: p.ink2, align: 'center', base: 'middle' });
      });
    });
  });
  // precisión, recall y costo: bajo la matriz (horizontal) o en una columna a su derecha (vertical)
  const col = (x: number, yy: number, l: string, v: string, sub: string, tn: 'sig' | 'err' | 'ink') => { d.text(l, x, yy, { size: 12, weight: 700, color: p.mute }); d.text(v, x, yy + 3 * u, { size: S.portrait ? 22 : 28, weight: 800, font: 'mono', color: tone(S, tn).ink, base: 'top' }); if (sub) d.text(sub, x, yy + (S.portrait ? 30 : 40) * u, { size: 11, font: 'mono', color: p.ink2 }); };
  const colX = S.portrait ? mx + 2 * cs + 16 * u : r.x, rowY = (k: number) => (S.portrait ? my + 4 * u + k * 48 * u : my + 2 * cs + 16 * u);
  if (S.on('precision')) d.withAlpha(S.reveal('precision', 0.3, 0.6), () => col(colX, rowY(0), S.l('precisión', 'precision'), S.n(c.precision * 100, 0) + ' %', `${Math.round(c.tp)} / ${Math.round(c.tp + c.fp)}`, 'sig'));
  if (S.on('recall')) d.withAlpha(S.reveal('recall', 0.3, 0.6), () => col(S.portrait ? colX : r.x + r.w / 2, rowY(1), S.l('recall', 'recall'), S.n(c.recall * 100, 0) + ' %', `${Math.round(c.tp)} / ${Math.round(c.tp + c.fn)}`, 'err'));
  // costos
  if (S.on('cost')) {
    const [cFN, cFP] = COSTS[S.p.costs ?? 'equal'];
    let bestT = -1, bestC = Infinity;
    for (let i = 0; i <= 600; i++) { const tt = -1 + i * 0.01, q = confusion(tt), cc = cFN * q.fn + cFP * q.fp; if (cc < bestC) { bestC = cc; bestT = tt; } }
    const a = S.reveal('cost', 0.4, 0.6);
    d.withAlpha(a, () => {
      plot.line(bestT, 0, bestT, 1, 'dat', 2.5, [6, 4]);
      badge(S, S.l('óptimo', 'optimal'), plot.X(bestT), plot.Y(0.82), { tone: 'dat' });
      const cc = cFN * c.fn + cFP * c.fp;
      if (S.portrait) { col(colX, rowY(2), S.l('costo esperado', 'expected cost'), String(Math.round(cc)), S.l(`óptimo ≈ ${S.n(bestT, 1)}`, `optimal ≈ ${S.n(bestT, 1)}`), 'ink'); }
      else { col(r.x, r.y + r.h - 44 * u, S.l('costo esperado', 'expected cost'), String(Math.round(cc)), '', 'ink'); d.text(S.l(`umbral óptimo ≈ ${S.n(bestT, 1)}`, `optimal threshold ≈ ${S.n(bestT, 1)}`), r.x + r.w, r.y + r.h - 28 * u, { size: 12, weight: 700, color: tone(S, 'dat').ink, align: 'right' }); }
    });
  }
  void inset; void box;
}

// ═════════ resumen y puente ═════════
function drawRecap(S: Frame) {
  const R = regions(S, 1).all, u = S.u;
  const labels = [S.l('Medir con datos no vistos', 'Measure on unseen data'), S.l('Vigilar la brecha', 'Watch the gap'), S.l('Elegir la métrica por costo', 'Choose the metric by cost'), S.l('No olvidar la tasa base', 'Do not forget the base rate')];
  const tones = ['dat', 'lat', 'w', 'err'] as const;
  const bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.46, 280 * u), bh = 58 * u;
  labels.forEach((l, i) => {
    const col = S.portrait ? 0 : i % 2, row = S.portrait ? i : Math.floor(i / 2), a = S.reveal('recap', 0.2 + i * 0.4, 0.5);
    const x = S.portrait ? R.x + (R.w - bw) / 2 : R.x + R.w / 2 + (col ? 10 * u : -bw - 10 * u), y = R.y + (S.portrait ? 10 * u : R.h * 0.22) + row * (bh + 22 * u);
    if (a > 0) box(S, { x, y, w: bw, h: bh }, l, { tone: tones[i], a, size: 14 });
  });
}
function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Convoluciones y visión', 'Convolutions and vision'), cx, cy + 82 * u, { size: 24, weight: 800, align: 'center' });
  });
}

export default scene;
