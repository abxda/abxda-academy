// Escena: Un modelo y su error. Diez estudiantes (horas de estudio → calificación, datos ILUSTRATIVOS) pasan de una tabla a un plano
// (cada eje por separado, el primer punto avanzando y subiendo); la recta se explica pieza por pieza (escalones de ritmo constante,
// el peso, el sesgo, cómo se lee una predicción y la cuenta que la da) antes de su fórmula; luego el error de un punto, por qué se eleva
// al cuadrado (celdas de 2 × 2, 4 × 4 y −3 × −3), la pérdida (MSE), la búsqueda de la mejor recta, el estudiante atípico (cuadrados frente
// a error absoluto), los límites y la parábola de pérdida que abre la lección 4.
// La escena hace sola cada demostración (mueve el peso, el sesgo y la nota del atípico con S.drive): quien solo mira entiende todo;
// quien quiere, toma los deslizadores y la demostración le cede el paso. Las animaciones se reparten por fracciones de cada segmento
// (fr), así siguen a la voz en cualquier idioma.
import { Plot, alpha, clamp, lerp, neu, regions, split, tone, type Frame, type Rect, type SceneFactory, type Tone } from '../../../../../theme/kit';
import {
  BEST, FIVE, FLAT, GOAL, LMIN, N, NEAR, OUT, TEACH, XS, X_NEW, YO, YS,
  errsOf, f01, fr, keyframes, ladFit, lerpLine, lsFit, mse, nf, sg, shares, sumSq, withOutlier, yAt, type Line,
} from './helpers';
import {
  axesOf, chipTag, drawAxes, drawLine, drawPoints, drawStairs, drawStep, drawTable, errBars, errorMarks, formulaCard, gridSq, hBars, heightBar,
  layout, readouts, signGlyphs, stackBar, tw, tx, type Item, type Lay, type Part,
} from './parts';

// ── estado interactivo ───────────────────────────────────────────────────
interface St { best: number; maxDev: number }
const fresh = (): St => ({ best: Infinity, maxDev: 0 });
const stOf = (S: Frame): St => (S.st.q ??= fresh()) as St;
const userLine = (S: Frame): Line => ({ w: Number(S.p.w ?? TEACH.w), b: Number(S.p.b ?? TEACH.b) });
/** El escalón destacado va de 2 a 3 horas. */
const STEP_X = 2;
const sml = (S: Frame) => S.portrait || S.W < 640;
const lb = (S: Frame, long: [string, string], short: [string, string]) => (sml(S) ? S.l(short[0], short[1]) : S.l(long[0], long[1]));
/** Sube en [a, a + 0.06] y baja en [b, b + 0.06] (fracciones del segmento k). */
const bump = (S: Frame, k: string, a: number, b = 2) => fr(S, k, a, a + 0.06) * (1 - fr(S, k, b, b + 0.06));
const hrs = (S: Frame, x: number) => (x % 1 ? nf(S, x, 1) : String(x));

/** Nota del estudiante atípico en este instante: la mueven el deslizador (o la demostración) y «after-try2» la devuelve a su sitio. */
function yoNow(S: Frame) {
  const p = Number(S.p.yo ?? YO);
  if (S.on('after-try2')) return lerp(p, YO, fr(S, 'after-try2', 0, 0.3, 'io'));
  if (S.on('outlier-demo')) return p;
  return YO;
}

/** La recta del modelo según el momento de la lección. Fuera de los deslizadores la dicta el guion (no S.p). */
function modelLine(S: Frame): Line | null {
  if (!S.on('line-idea')) return null;
  if (S.on('compare')) { const yo = yoNow(S); return Math.abs(yo - YO) < 1e-6 ? BEST : lsFit(withOutlier(yo)); }
  if (S.on('floor')) return lerpLine(userLine(S), BEST, fr(S, 'floor', 0.04, 0.32, 'io'));
  if (S.on('demo-w')) return userLine(S);
  if (S.on('back-line')) return lerpLine(FLAT, TEACH, fr(S, 'back-line', 0.08, 0.42, 'io'));
  if (S.on('sum-flat')) return lerpLine(TEACH, FLAT, fr(S, 'sum-flat', 0.4, 0.62, 'io'));
  if (S.on('two-numbers')) return TEACH;
  if (S.on('bias-demo')) return { w: 5, b: keyframes(f01(S, 'bias-demo'), [[0.05, 40], [0.22, 65], [0.42, 65], [0.58, 20], [0.74, 20], [0.9, 40]]) };
  if (S.on('bias')) return { w: lerp(-3, 5, fr(S, 'bias', 0.02, 0.16, 'io')), b: 40 };
  if (S.on('weight-demo')) return { w: keyframes(f01(S, 'weight-demo'), [[0.04, 5], [0.2, 10], [0.44, 10], [0.56, 0], [0.68, 0], [0.8, -3]]), b: 40 };
  return TEACH;
}

// ── la escena ─────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'w', kind: 'slider', label: { es: 'Peso w (pendiente)', en: 'Weight w (slope)' }, min: -2, max: 12, step: 0.1, value: TEACH.w, from: 'demo-w', to: 'floor', fmt: (v) => v.toFixed(1) },
    { id: 'b', kind: 'slider', label: { es: 'Sesgo b (altura en cero horas)', en: 'Bias b (height at zero hours)' }, min: 0, max: 100, step: 0.5, value: TEACH.b, from: 'demo-w', to: 'floor', fmt: (v) => v.toFixed(1) },
    { id: 'yo', kind: 'slider', label: { es: 'Nota del estudiante atípico', en: 'Outlier’s grade' }, min: 0, max: 100, step: 1, value: YO, from: 'outlier-demo', to: 'after-try2', fmt: (v) => String(v) },
  ],

  init(S) { S.st.q = fresh(); },

  // Demostraciones guiadas (la escena mueve los deslizadores mientras nadie los toque) y comprobación de los «tu turno».
  update(S) {
    const q = stOf(S);
    if (S.between('demo-w', 'floor')) {
      // el peso: 5 → 8 (demasiado empinada) → 2.5 (demasiado plana) → 5.3; luego el sesgo: 40 → 55 → 28 → 40.5
      let w = NEAR.w, b = NEAR.b;
      if (S.between('demo-w', 'demo-b')) { w = keyframes(f01(S, 'demo-w'), [[0.04, 5], [0.22, 8], [0.4, 8], [0.58, 2.5], [0.72, 2.5], [0.9, NEAR.w]]); b = TEACH.b; }
      else if (S.between('demo-b', 'goal')) b = keyframes(f01(S, 'demo-b'), [[0.04, TEACH.b], [0.22, 55], [0.4, 55], [0.58, 28], [0.72, 28], [0.9, NEAR.b]]);
      S.drive('w', Math.round(w * 10) / 10); S.drive('b', Math.round(b * 2) / 2);
      // cuenta solo lo que hace la persona
      if (S.touched.has('w') || S.touched.has('b')) {
        const L = mse(userLine(S));
        q.best = Math.min(q.best, L);
        if (L < GOAL) S.complete('fit');
      }
    }
    if (S.between('outlier-demo', 'after-try2')) {
      // la nota del atípico: 56 → 20 (se baja) y, en la invitación, 20 → 86 (se sube)
      const yo = S.between('outlier-demo', 'try2') ? lerp(YO, 20, fr(S, 'outlier-demo', 0.26, 0.6, 'io')) : lerp(20, 86, fr(S, 'try2', 0.15, 0.75, 'io'));
      S.drive('yo', Math.round(yo));
      if (S.touched.has('yo')) {
        q.maxDev = Math.max(q.maxDev, Math.abs(Number(S.p.yo) - YO));
        if (q.maxDev >= 30) S.complete('outlier');
      }
    }
  },

  render(S) {
    const P = layout(S);
    const mainA = 1 - fr(S, 'curve', 0, 0.14);
    if (mainA > 0.01) S.d.withAlpha(mainA, () => drawMain(S, P));
    if (S.on('curve')) drawCurveView(S);
    if (S.on('bridge')) drawBridge(S);
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Escena principal
// ═════════════════════════════════════════════════════════════════════════
function tableOpts(S: Frame, hot: (i: number) => number) {
  return { heads: [S.l('horas', 'hours'), S.l('calificación', 'grade')] as [string, string], a: XS.map((x) => hrs(S, x)), b: YS.map(String), hot };
}

function drawMain(S: Frame, P: Lay) {
  const { d, pal: p, u } = S, plot = P.plot, r = plot.r;
  const yo = yoNow(S), ys = withOutlier(yo), line = modelLine(S);
  const letters = S.on('formula');

  // ── la tabla de datos, grande al principio ──
  const bigA = fr(S, 'hook', 0.02, 0.14) * (1 - fr(S, 'axis-x', 0, 0.16));
  if (bigA > 0.01) {
    const tw_ = Math.min(320 * u, P.all.w * 0.7), th = Math.min(P.all.h - 20 * u, 11 * 30);
    const rr: Rect = { x: P.all.x + (P.all.w - tw_) / 2, y: P.all.y + (P.all.h - th) / 2, w: tw_, h: th };
    d.withAlpha(bigA, () => {
      const used = drawTable(S, rr, { ...tableOpts(S, () => 0), appear: (i) => fr(S, 'hook', 0.3 + i * 0.045, 0.36 + i * 0.045), maxRow: 30 });
      tx(S, S.l('datos ilustrativos', 'illustrative data'), rr.x + rr.w / 2, rr.y + used + 8 * u, { px: 12, weight: 600, italic: true, color: p.mute, align: 'center', base: 'top', a: fr(S, 'hook', 0.4, 0.5) });
      const sc = Math.max(2, Math.round(2.2 * u));
      if (!S.portrait) neu(S, rr.x + rr.w + 12 * u, rr.y + 8 * u, { scale: sc, mood: 'think', a: fr(S, 'hook', 0.12, 0.22) });
    });
  }

  // ── el plano, eje por eje ──
  if (S.on('axis-x')) {
    const hx = fr(S, 'axis-x', 0.55, 0.68) * (1 - fr(S, 'axis-y', 0, 0.12));
    const hy = fr(S, 'axis-y', 0.45, 0.58) * (1 - fr(S, 'place', 0, 0.12));
    drawAxes(S, P, { ax: fr(S, 'axis-x', 0.12, 0.4), ay: fr(S, 'axis-y', 0.04, 0.3), hx, hy, note: fr(S, 'all-points', 0.6, 0.72), letters });
  }

  // ── la pregunta: ¿qué nota con siete horas? ──
  const qA = fr(S, 'regression', 0.36, 0.5) * (1 - fr(S, 'line-idea', 0, 0.15));
  if (qA > 0.01) d.withAlpha(qA, () => {
    const x = plot.X(X_NEW), sgn = tone(S, 'sig');
    d.line(x, r.y + r.h, x, plot.Y(98), sgn.c, 1.8, [5, 5], 0.8);
    tx(S, '?', x, plot.Y(90), { px: 28, weight: 800, color: sgn.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 5 });
    chipTag(S, S.l('7 horas', '7 hours'), x, r.y + r.h - 14 * u, 'sig');
  });

  // ── errores: segmentos y cuadrados (debajo de la recta y de los puntos) ──
  const errA = 1 - fr(S, 'limits', 0, 0.2);
  if (line && S.on('error-one') && errA > 0.01) {
    let only: number[] | undefined;
    if (!S.on('error-sign')) only = [FIVE]; else if (!S.on('all-errors')) only = [FIVE, OUT];
    const seg = (i: number) => {
      if (i === FIVE) return S.on('error-sign') ? 1 : fr(S, 'error-one', 0.14, 0.38);
      if (i === OUT && !S.on('all-errors')) return fr(S, 'error-sign', 0.42, 0.6);
      return S.on('sum-flat') ? 1 : fr(S, 'all-errors', 0.04 + i * 0.035, 0.12 + i * 0.035);
    };
    const sq = (i: number) => (S.on('square-draw') ? fr(S, 'square-draw', 0.14 + i * 0.06, 0.24 + i * 0.06) : 0);
    const hot = S.between('outlier', 'limits') ? [OUT] : [];
    d.withAlpha(errA, () => {
      errorMarks(S, P, line, ys, { seg, sq, hot, only });
      const gA = (i: number) => fr(S, 'all-errors', 0.45 + i * 0.02, 0.55 + i * 0.02) * (1 - fr(S, 'square-idea', 0, 0.15));
      if (S.between('all-errors', 'square-draw')) signGlyphs(S, P, line, ys, gA);
    });
  }

  // ── rectas ──
  if (line) {
    if (S.between('bias-demo', 'two-numbers')) drawLine(S, P, TEACH, { t: 'mute', lw: 2, dash: [6, 5], a: fr(S, 'bias-demo', 0.06, 0.16) });
    if (S.on('limits')) {
      drawLine(S, P, line, { from: 0, to: 9.5 });
      drawLine(S, P, line, { from: 9.5, to: P.xmax, dash: [8, 6], t: 'w', lw: 3 });
    } else drawLine(S, P, line, { reveal: S.on('steps') ? 1 : fr(S, 'line-idea', 0.3, 0.62, 'io') });
    if (S.between('compare', 'limits')) {
      drawLine(S, P, ladFit(yo), { t: 'ink', lw: 2.6, dash: [9, 6] });
      const a = fr(S, 'compare', 0.2, 0.32), x0 = r.x + 12 * u, y0 = r.y + 14 * u;
      d.withAlpha(a, () => {
        d.line(x0, y0, x0 + 28 * u, y0, tone(S, 'w').c, 3.4);
        tx(S, lb(S, ['minimiza los cuadrados', 'minimizes the squares'], ['cuadrados', 'squares']), x0 + 36 * u, y0, { px: 12, weight: 700, color: tone(S, 'w').ink, base: 'middle', halo: p.stage, haloW: 4 });
        d.line(x0, y0 + 20 * u, x0 + 28 * u, y0 + 20 * u, p.ink, 2.6, [9, 6]);
        tx(S, lb(S, ['minimiza los errores absolutos', 'minimizes the absolute errors'], ['absolutos', 'absolute']), x0 + 36 * u, y0 + 20 * u, { px: 12, weight: 700, color: p.ink, base: 'middle', halo: p.stage, haloW: 4 });
      });
    }
    if (S.between('sum-flat', 'square-idea')) chipTag(S, S.l('siempre el promedio', 'always the average'), r.x + 8 * u, plot.Y(FLAT.b) - 18 * u, 'plain', { align: 'left', a: fr(S, 'sum-flat', 0.62, 0.74) });
  }

  // ── piezas de la recta: escalones, el escalón del peso y la altura del sesgo ──
  if (line && S.between('steps', 'weight')) drawStairs(S, P, line, 0, 10, (k) => fr(S, 'steps', 0.1 + k * 0.05, 0.17 + k * 0.05, 'lin'));
  if (line && S.between('weight', 'weight-demo')) drawStairs(S, P, line, 0, 10, (k) => (k === STEP_X ? 0 : 1 - fr(S, 'weight', 0.04, 0.22)));
  const stepA = S.between('steps', 'predict-read') ? (S.on('weight') ? 1 : fr(S, 'steps', 0.6, 0.72)) : S.on('predict-read') && !S.on('predict-calc') ? 1 - fr(S, 'predict-read', 0, 0.14) : S.between('formula-letters', 'error-one') ? fr(S, 'formula-letters', 0.34, 0.44) * (1 - fr(S, 'reality', 0, 0.12)) : 0;
  if (line && stepA > 0.01) {
    const rise = S.between('formula-letters', 'error-one') ? `w = ${nf(S, line.w, 0)}` : `${sg(S, line.w, 0)} ${S.l('puntos', 'points')}`;
    drawStep(S, P, line, STEP_X, { a: stepA * (S.between('bias', 'bias-demo') ? 0.55 : 1), rise, lw: S.on('weight') ? 3 : 2.6 });
  }
  const biasA = S.between('bias', 'predict-read') ? fr(S, 'bias', 0.34, 0.5) : S.on('predict-read') && !S.on('predict-calc') ? 1 - fr(S, 'predict-read', 0, 0.14) : S.between('formula-letters', 'error-one') ? fr(S, 'formula-letters', 0.64, 0.74) * (1 - fr(S, 'reality', 0, 0.12)) : 0;
  if (line && biasA > 0.01) {
    const lab = S.between('formula-letters', 'error-one') ? `b = ${nf(S, line.b, 0)}` : `${S.l('sesgo', 'bias')} ${nf(S, line.b, 0)}`;
    heightBar(S, P, 0, 0, line.b, 'w', lab, { a: biasA, grow: S.on('bias-demo') || S.on('formula-letters') ? 1 : fr(S, 'bias', 0.34, 0.5, 'io') });
    d.withAlpha(biasA, () => plot.dot(0, line.b, 6.5, 'w'));
  }

  // ── leer una predicción: subir desde siete hasta la recta y leer la altura ──
  if (line && S.between('predict-read', 'error-one')) {
    const out = 1 - fr(S, 'reality', 0, 0.12);
    const k1 = fr(S, 'predict-read', 0.3, 0.55, 'io'), k2 = fr(S, 'predict-read', 0.55, 0.74, 'io'), y7 = yAt(line, X_NEW), x = plot.X(X_NEW);
    const guideA = (1 - fr(S, 'predict-calc', 0, 0.15)) * out;
    d.withAlpha(guideA, () => {
      if (k1 > 0.001) d.line(x, r.y + r.h, x, lerp(r.y + r.h, plot.Y(y7), k1), tone(S, 'sig').c, 2, [5, 4]);
      if (k2 > 0.001) d.line(x, plot.Y(y7), lerp(x, r.x, k2), plot.Y(y7), tone(S, 'w').c, 2, [5, 4]);
    });
    d.withAlpha(out, () => {
      plot.dot(X_NEW, y7, 6.5, 'w', { a: k1 > 0.98 ? 1 : 0 });
      chipTag(S, S.l('7 horas', '7 hours'), x, r.y + r.h - 14 * u, 'sig', { a: fr(S, 'predict-read', 0.14, 0.26) * (1 - fr(S, 'predict-calc', 0, 0.12)) });
      if (k2 > 0.98) chipTag(S, '75', r.x + 18 * u, plot.Y(y7), 'w', { px: 13, a: fr(S, 'predict-read', 0.74, 0.84) });
    });
    // la cuenta, en la gráfica: la parte del peso (5 × 7 = 35) sobre la del sesgo (40)
    if (S.on('predict-calc')) {
      const ca = (1 - fr(S, 'formula', 0.7, 0.85)) * out;
      heightBar(S, P, X_NEW, 40, y7, 'w', `5 × 7 = 35`, { a: ca, grow: fr(S, 'predict-calc', 0.24, 0.38, 'io') });
      heightBar(S, P, X_NEW, 0, 40, 'w', S.l('sesgo 40', 'bias 40'), { a: ca, grow: fr(S, 'predict-calc', 0.5, 0.62, 'io'), fill: 0.25 });
    }
    // las letras, en la gráfica
    if (S.on('formula-letters')) chipTag(S, `x = 7`, x, r.y + r.h - 14 * u, 'sig', { px: 13, a: fr(S, 'formula-letters', 0.06, 0.14) * out });
  }

  // ── datos ──
  const dim = S.between('line-idea', 'reality') ? lerp(1, 0.3, fr(S, 'line-idea', 0, 0.2)) : S.between('reality', 'error-one') ? lerp(0.3, 1, fr(S, 'reality', 0, 0.2)) : 1;
  const order = [...XS.keys()].filter((i) => i !== FIVE);
  const appear = (i: number) => (i === FIVE ? fr(S, 'place', 0.74, 0.84) : fr(S, 'all-points', 0.06 + order.indexOf(i) * 0.05, 0.14 + order.indexOf(i) * 0.05));
  const ring = S.between('reality', 'error-sign') ? [FIVE] : S.between('error-sign', 'all-errors') ? [OUT] : S.between('outlier', 'limits') ? [OUT] : [];
  drawPoints(S, P, ys, { appear, ring, a: dim });

  // ── ubicar el primer punto: avanzar hasta cinco horas y subir hasta 72 ──
  const guideOut = 1 - fr(S, 'all-points', 0, 0.15);
  if (S.on('place') && guideOut > 0.01) {
    const sgn = tone(S, 'sig'), wx = lerp(0, XS[FIVE], fr(S, 'place', 0.24, 0.48, 'io')), up = fr(S, 'place', 0.5, 0.72, 'io');
    const wy = lerp(0, YS[FIVE], up), x = plot.X(wx), yAxis = r.y + r.h, hz = fr(S, 'place', 0.7, 0.82);
    d.withAlpha(guideOut, () => {
      if (up > 0.001) d.line(x, yAxis, x, plot.Y(wy), sgn.c, 2, [5, 4]);
      if (hz > 0.01) d.line(r.x, plot.Y(YS[FIVE]), x, plot.Y(YS[FIVE]), tone(S, 'dat').c, 2, [5, 4], hz);
      if (appear(FIVE) < 0.99) d.circle(x, plot.Y(wy), 6 * u, { fill: sgn.c, stroke: p.stage, lw: 1.5 });
      chipTag(S, S.l('5 horas', '5 hours'), plot.X(XS[FIVE]), yAxis - 14 * u, 'sig', { a: fr(S, 'place', 0.4, 0.5) });
      if (hz > 0.01) chipTag(S, '72', r.x + 18 * u, plot.Y(YS[FIVE]), 'dat', { px: 13, a: hz });
    });
  }

  // ── el patrón ──
  const patA = fr(S, 'all-points', 0.66, 0.78) * (1 - fr(S, 'regression', 0, 0.15));
  if (patA > 0.01) d.withAlpha(patA, () => {
    d.arrow(plot.X(1.6), plot.Y(60), plot.X(7.4), plot.Y(93), tone(S, 'dat').c, 2.4, 9 * u);
    chipTag(S, S.l('más horas, más nota', 'more hours, higher grade'), r.x + 8 * u, plot.Y(95), 'dat', { align: 'left' });
  });

  // ── etiquetas del error ──
  if (line && S.between('reality', 'all-errors')) drawErrorTags(S, P, line);
  if (S.between('outlier', 'limits')) {
    const px = plot.X(XS[OUT]), py = plot.Y(ys[OUT]);
    chipTag(S, S.l('atípico', 'outlier'), px, py + 22 * u, 'err', { a: S.on('compare') ? 1 : fr(S, 'outlier', 0.3, 0.42) });
  }
  if (line && S.on('limits')) drawLimits(S, P, line);

  // ── panel lateral ──
  drawAside(S, P, line, ys);
}

/** Real, predicción y error del estudiante de cinco horas; y el error negativo del atípico. */
function drawErrorTags(S: Frame, P: Lay, line: Line) {
  const { u, d } = S, plot = P.plot, x = plot.X(XS[FIVE]), real = YS[FIVE], pred = yAt(line, XS[FIVE]);
  const out = S.on('all-errors') ? 1 - fr(S, 'all-errors', 0, 0.14) : 1;
  S.d.withAlpha(out, () => {
    // «real» y «predicción» se retiran al empezar «error-one» (la cuenta sigue en el panel) para dejar lugar al rótulo del error
    const rp = S.on('error-one') ? 1 - fr(S, 'error-one', 0, 0.12) : 1;
    if (rp > 0.01) d.withAlpha(rp, () => {
      chipTag(S, S.l(`real ${real}`, `real ${real}`), x - 14 * u, plot.Y(real) - 4 * u, 'dat', { align: 'right', px: 13, a: fr(S, 'reality', 0.3, 0.42) });
      // la predicción se lee como en «predict-read»: subir desde cinco horas hasta la recta
      const g = fr(S, 'reality', 0.5, 0.62, 'io');
      if (g > 0.001) d.line(x, plot.r.y + plot.r.h, x, lerp(plot.r.y + plot.r.h, plot.Y(pred), g), tone(S, 'sig').c, 2, [5, 4]);
      chipTag(S, S.l(`predicción ${nf(S, pred, 0)}`, `prediction ${nf(S, pred, 0)}`), x - 6 * u, plot.Y(28), 'w', { align: 'right', px: 13, a: fr(S, 'reality', 0.6, 0.7) });
    });
    plot.dot(XS[FIVE], pred, 5.5, 'w', { a: fr(S, 'reality', 0.55, 0.65) });
    const ea = S.on('error-sign') ? 1 : fr(S, 'error-one', 0.72, 0.84);
    if (ea > 0.01) chipTag(S, `${S.l('error', 'error')} ${sg(S, real - pred, 0)}`, x - 12 * u, (plot.Y(real) + plot.Y(pred)) / 2, 'err', { align: 'right', px: 13, a: ea });
    if (S.on('error-sign')) {
      const xo = plot.X(XS[OUT]), po = yAt(line, XS[OUT]);
      plot.dot(XS[OUT], po, 5.5, 'w', { a: fr(S, 'error-sign', 0.4, 0.5) });
      chipTag(S, `${S.l('error', 'error')} ${sg(S, YO - po, 1)}`, xo + 12 * u, (plot.Y(YO) + plot.Y(po)) / 2, 'err', { align: 'left', px: 13, a: fr(S, 'error-sign', 0.72, 0.84) });
    }
  });
}

/** «limits»: fuera de los datos, la recta predice un imposible. */
function drawLimits(S: Frame, P: Lay, line: Line) {
  const { d, pal: p, u } = S, plot = P.plot, r = plot.r, er = tone(S, 'err');
  const a = fr(S, 'limits', 0.28, 0.42), xe = 12, ye = yAt(line, xe), xd = plot.X(9.5);
  d.withAlpha(a, () => {
    d.clip(xd, r.y, r.x + r.w - xd, r.h, () => d.dither(xd, r.y, r.x + r.w - xd, r.h, p.mute, 0.14, 2));
    d.line(xd, r.y, xd, r.y + r.h, p.mute, 1.2, [4, 4]);
    tx(S, S.l('sin datos', 'no data'), (xd + r.x + r.w) / 2, r.y + r.h - 12 * u, { px: 12, weight: 700, color: p.ink2, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
  });
  d.withAlpha(fr(S, 'limits', 0.62, 0.76), () => {
    d.line(r.x, plot.Y(100), r.x + r.w, plot.Y(100), er.c, 1.6, [6, 4]);
    tx(S, S.l('nota máxima: 100', 'top grade: 100'), r.x + 8 * u, plot.Y(100) - 6 * u, { px: 12, weight: 700, color: er.ink, base: 'bottom', halo: p.stage, haloW: 4 });
    d.line(plot.X(xe), r.y + r.h, plot.X(xe), plot.Y(ye), p.mute, 1.4, [4, 4]);
    plot.dot(xe, ye, 7, 'err');
    tx(S, `12 h → ${nf(S, ye, 1)}`, plot.X(xe) + 6 * u, plot.Y(ye) - 11 * u, { px: 14, weight: 800, font: 'mono', color: er.ink, align: 'right', base: 'bottom', halo: p.stage, haloW: 4 });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Panel lateral: tabla, tarjetas, lecturas y gráficas según el momento
// ═════════════════════════════════════════════════════════════════════════
/** Cada fase del panel y su grupo: el panel solo entra con desvanecido al cambiar de grupo (no parpadea en cada segmento). */
const PHASES: [string, string][] = [
  ['axis-x', 'table'], ['axis-y', 'table'], ['place', 'table'], ['all-points', 'table'],
  ['regression', 'reg'], ['line-idea', 'mini'], ['steps', 'mini'],
  ['weight', 'params'], ['weight-demo', 'params'], ['bias', 'params'], ['bias-demo', 'params'], ['two-numbers', 'params'], ['predict-read', 'params'],
  ['predict-calc', 'calc'], ['formula', 'formula'], ['formula-letters', 'formula'],
  ['reality', 'real'], ['error-one', 'errcard'], ['error-sign', 'errcard'], ['all-errors', 'signed'], ['sum-flat', 'signed'],
  ['square-idea', 'grids'], ['square-neg', 'grids'], ['square-draw', 'sq'], ['loss', 'sq'], ['loss-name', 'sq'],
  ['back-line', 'live'], ['demo-w', 'live'], ['demo-b', 'live'], ['goal', 'live'], ['try1', 'live'],
  ['floor', 'cmp'], ['not-zero', 'cmp'], ['best-line', 'ls'], ['outlier', 'shares'], ['absolute', 'shares'],
  ['compare', 'lad'], ['outlier-demo', 'lad'], ['try2', 'lad'], ['after-try2', 'lad'], ['limits', 'lim'],
];

interface Spec { card?: (r: Rect) => number; items?: Item[]; chart?: (r: Rect) => void; custom?: (r: Rect) => void; full?: boolean; onBase?: boolean }

function drawAside(S: Frame, P: Lay, line: Line | null, ys: number[]) {
  if (S.on('curve')) return;
  const { d, u } = S, r = P.aside;
  const idx = PHASES.map(([k]) => k).reduce((acc, k, i) => (S.on(k) ? i : acc), -1);
  if (idx < 0) return;
  const [phase, group] = PHASES[idx], first = PHASES.find(([, g]) => g === group)![0];
  const spec = asideSpec(S, phase, line, ys);
  const aIn = fr(S, first, 0.02, 0.12);
  const gap = 12 * u;
  d.withAlpha(aIn, () => {
    if (spec.custom) { spec.custom(r); return; }
    const hasR = !!(spec.card || spec.chart), hasI = !!spec.items?.length;
    if (S.portrait) {
      if (hasI && hasR && !spec.full) {
        const wL = Math.min(r.w * 0.42, 150 * u);
        readouts(S, { x: r.x, y: r.y, w: wL, h: r.h }, spec.items!, { cols: 1, px: 19 });
        const rr: Rect = { x: r.x + wL + gap, y: r.y, w: r.w - wL - gap, h: r.h };
        if (spec.card) spec.card(rr); else spec.chart!(rr);
      } else {
        let y = r.y;
        if (spec.card) y += spec.card({ x: r.x, y, w: r.w, h: 0 }) + gap * 0.6;
        if (hasI) y += readouts(S, { x: r.x, y, w: r.w, h: r.y + r.h - y }, spec.items!, { cols: Math.min(4, spec.items!.length), px: 19, flat: true }) + gap * 0.3;
        if (spec.chart) spec.chart({ x: r.x, y, w: r.w, h: Math.max(46, r.y + r.h - y) });
      }
    } else {
      let y = r.y;
      if (spec.card) y += spec.card({ x: r.x, y, w: r.w, h: 0 }) + gap;
      if (hasI) y += readouts(S, { x: r.x, y, w: r.w, h: r.y + r.h - y }, spec.items!, { cols: spec.items!.length === 1 ? 1 : 2, flat: r.w < 230 * u }) + gap * 0.5;
      if (spec.chart) {
        const base = P.plot.r.y + P.plot.r.h, top = spec.onBase ? Math.max(y, base - 260 * u) : y;
        spec.chart({ x: r.x, y: top, w: r.w, h: Math.max(60, (spec.onBase ? base : r.y + r.h) - top) });
      }
    }
  });
}

function asideSpec(S: Frame, phase: string, line: Line | null, ys: number[]): Spec {
  const l = line ?? TEACH, L = mse(l, ys), e = errsOf(l, ys), sum = e.reduce((a, v) => a + v, 0), q = stOf(S), letters = S.on('formula');
  const cardPx = S.portrait ? 17 : sml(S) ? 17 : 22, subPx = S.portrait ? 13 : sml(S) ? 13 : 16;
  const card = (parts: Part[], o: { sub?: Part[]; pa?: (i: number) => number; hl?: (i: number) => number; subA?: number } = {}) => (rr: Rect) => formulaCard(S, rr, parts, { px: cardPx, subPx, ...o });
  const pesoLbl = (long = false) => (letters ? lb(S, ['peso w', 'weight w'], ['peso w', 'weight w']) : S.l('peso', 'weight')) + (long ? '' : '');
  const sesgoLbl = () => (letters ? lb(S, ['sesgo b', 'bias b'], ['sesgo b', 'bias b']) : S.l('sesgo', 'bias'));
  const lossIt = (label: [string, string], o: Partial<Item> = {}): Item => ({ label: lb(S, label, [S.l('pérdida', 'loss'), S.l('pérdida', 'loss')] as [string, string]), value: nf(S, L, 1), t: 'err', big: true, ...o });
  const sqBars = (show?: (i: number) => number, hot?: number[]) => (rr: Rect) => errBars(S, rr, e.map((v) => v * v), { kind: 'sq', scale: 900, title: S.l('error al cuadrado de cada estudiante', 'squared error of each student'), show, hot });

  switch (phase) {
    case 'axis-x': case 'axis-y': case 'place': case 'all-points': {
      const order = [...XS.keys()].filter((i) => i !== FIVE);
      const hot = (i: number) => {
        if (S.between('place', 'all-points')) return i === FIVE ? fr(S, 'place', 0.02, 0.12) : 0;
        if (!S.on('all-points')) return 0;
        if (i === FIVE) return 0;
        const t = 0.06 + order.indexOf(i) * 0.05;
        return fr(S, 'all-points', t, t + 0.03) * (1 - fr(S, 'all-points', t + 0.05, t + 0.08));
      };
      return { custom: (rr) => drawTable(S, rr, tableOpts(S, hot)) };
    }
    case 'regression':
      return { card: card([[S.l('horas', 'hours'), 'sig'], ['  →  ', 'plain'], [S.l('nota', 'grade'), 'dat']], { sub: [[S.l('predecir un número: regresión', 'predicting a number: regression'), 'plain']], subA: fr(S, 'regression', 0.7, 0.82) }) };
    case 'line-idea': case 'steps':
      return {
        custom: (rr) => drawTable(S, rr, {
          heads: [S.l('horas', 'hours'), S.l('predicción', 'prediction')], tones: ['sig', 'w'], a: ['0', '1', '2', '3', '4', '5'], b: ['40', '45', '50', '55', '60', '65'],
          appear: (i) => (S.on('steps') ? 1 : fr(S, 'line-idea', 0.56 + i * 0.06, 0.64 + i * 0.06)), diff: ['+5', '+5', '+5', '+5', '+5'],
          diffA: (i) => fr(S, 'steps', 0.2 + i * 0.07, 0.28 + i * 0.07), maxRow: 26,
        }),
      };
    case 'weight': case 'weight-demo': case 'bias': case 'bias-demo': case 'two-numbers': case 'predict-read': {
      const roles = S.on('two-numbers');
      const items: Item[] = [{ label: pesoLbl(), value: nf(S, l.w, 0), t: 'w', sub: roles ? S.l('inclina la recta', 'tilts the line') : S.l('puntos por hora', 'points per hour'), a: S.on('weight-demo') ? 1 : fr(S, 'weight', 0.55, 0.68) }];
      if (S.on('bias')) items.push({ label: sesgoLbl(), value: nf(S, l.b, 0), t: 'w', sub: roles ? S.l('la sube o la baja', 'moves it up or down') : S.l('nota con cero horas', 'grade at zero hours'), a: S.on('bias-demo') ? 1 : fr(S, 'bias', 0.55, 0.68) });
      if (S.on('predict-read')) items.push({ label: S.l('predicción para 7 horas', 'prediction for 7 hours'), value: nf(S, yAt(l, X_NEW), 0), t: 'w', a: fr(S, 'predict-read', 0.76, 0.86) });
      return { items, full: true };
    }
    case 'predict-calc': {
      const pa = (i: number) => (i <= 2 ? fr(S, 'predict-calc', 0.2, 0.3) : i <= 4 ? fr(S, 'predict-calc', 0.48, 0.58) : fr(S, 'predict-calc', 0.64, 0.74));
      return { card: card([['5', 'w'], [' · ', 'plain'], ['7', 'sig'], [' + ', 'plain'], ['40', 'w'], [' = ', 'plain'], ['75', 'plain']], { pa, sub: [[S.l('peso · horas + sesgo', 'weight · hours + bias'), 'plain']] }) };
    }
    case 'formula': case 'formula-letters': {
      const parts: Part[] = [[S.l('predicción', 'prediction'), 'plain'], [' = ', 'plain'], ['w', 'w'], [' · ', 'plain'], ['x', 'sig'], [' + ', 'plain'], ['b', 'w']];
      const pa = (i: number) => (S.on('formula-letters') ? 1 : fr(S, 'formula', 0.24 + i * 0.05, 0.32 + i * 0.05));
      const hl = (i: number) => (!S.on('formula-letters') ? 0 : i === 4 ? bump(S, 'formula-letters', 0.06, 0.32) : i === 2 ? bump(S, 'formula-letters', 0.36, 0.62) : i === 6 ? bump(S, 'formula-letters', 0.66) : 0);
      return { card: card(parts, { pa, hl, sub: [['75', 'plain'], [' = ', 'plain'], ['5', 'w'], [' · ', 'plain'], ['7', 'sig'], [' + ', 'plain'], ['40', 'w']] }) };
    }
    case 'reality':
      return { items: [{ label: S.l('real (5 horas)', 'real (5 hours)'), value: String(YS[FIVE]), t: 'dat', a: fr(S, 'reality', 0.3, 0.42) }, { label: S.l('predicción', 'prediction'), value: nf(S, yAt(l, XS[FIVE]), 0), t: 'w', a: fr(S, 'reality', 0.55, 0.68) }], full: true };
    case 'error-one': case 'error-sign': {
      const neg = phase === 'error-sign', pred = yAt(l, XS[neg ? OUT : FIVE]), real = neg ? YO : YS[FIVE];
      return {
        card: card([['error', 'err'], [' = ', 'plain'], [S.l('real', 'real'), 'dat'], [' − ', 'plain'], [S.l('predicción', 'prediction'), 'w']], {
          sub: [[String(real), 'dat'], [' − ', 'plain'], [nf(S, pred, pred % 1 ? 1 : 0), 'w'], [' = ', 'plain'], [sg(S, real - pred, neg ? 1 : 0), 'err']],
          subA: neg ? fr(S, 'error-sign', 0.5, 0.62) : fr(S, 'error-one', 0.45, 0.58),
        }),
      };
    }
    case 'all-errors': case 'sum-flat': {
      const show = S.on('sum-flat') ? undefined : (i: number) => fr(S, 'all-errors', 0.04 + i * 0.035, 0.12 + i * 0.035);
      const items: Item[] | undefined = S.on('sum-flat') ? [{ label: S.l('suma de los errores', 'sum of the errors'), value: sg(S, Math.abs(sum) < 0.05 ? 0 : sum, 1), t: 'err', big: true, a: fr(S, 'sum-flat', 0.08, 0.2) }] : undefined;
      return { items, chart: (rr) => errBars(S, rr, e, { kind: 'signed', scale: 32, title: S.l('error de cada estudiante', 'error of each student'), show, hot: S.on('sum-flat') ? undefined : [FIVE, OUT] }), onBase: true };
    }
    case 'square-idea': case 'square-neg':
      return { custom: (rr) => drawGrids(S, rr) };
    case 'square-draw': case 'loss': case 'loss-name': {
      const show = S.on('loss') ? undefined : (i: number) => fr(S, 'square-draw', 0.14 + i * 0.06, 0.24 + i * 0.06);
      let it: Item;
      if (phase === 'square-draw') it = { label: S.l('suma de los cuadrados', 'sum of the squares'), value: nf(S, sumSq(l, ys), 1), t: 'err', big: true, a: fr(S, 'square-draw', 0.75, 0.86) };
      else if (phase === 'loss') { const k = fr(S, 'loss', 0.4, 0.7, 'io'); it = { label: S.l('promedio: suma ÷ 10', 'average: sum ÷ 10'), value: nf(S, lerp(sumSq(l, ys), L, k), 1), t: 'err', big: true, sub: `${nf(S, sumSq(l, ys), 1)} ÷ ${N}` }; }
      else it = lossIt(['pérdida (MSE)', 'loss (MSE)']);
      return { items: [it], chart: sqBars(show), onBase: true };
    }
    case 'back-line': case 'demo-w': case 'demo-b': case 'goal': case 'try1': {
      const done = S.done.has('fit'), items: Item[] = [
        { label: pesoLbl(), value: nf(S, l.w, 1), t: 'w' },
        { label: sesgoLbl(), value: nf(S, l.b, 1), t: 'w' },
        lossIt(['pérdida (MSE)', 'loss (MSE)'], { t: done ? 'dat' : 'err', sub: phase === 'goal' ? S.l('lo más baja posible', 'as low as possible') : done && phase === 'try1' ? S.l('cerca del mínimo', 'close to the minimum') : undefined }),
      ];
      if (phase === 'try1' && Number.isFinite(q.best)) items.push({ label: lb(S, ['tu mejor marca', 'your best'], ['tu mejor', 'your best']), value: nf(S, q.best, 1), t: 'dat' });
      return { items, chart: sqBars(), onBase: true, full: true };
    }
    case 'floor': case 'not-zero': {
      const rows = [
        { label: lb(S, ['recta plana (el promedio)', 'flat line (the average)'], ['recta plana', 'flat line']), value: mse(FLAT), t: 'mute' as Tone, a: 1 },
        { label: lb(S, ['peso 5 y sesgo 40', 'weight 5, bias 40'], ['peso 5, sesgo 40', 'w 5, b 40']), value: mse(TEACH), t: 'w' as Tone, a: 1 },
        ...(Number.isFinite(q.best) ? [{ label: lb(S, ['tu mejor marca', 'your best'], ['tu mejor', 'your best']), value: q.best, t: 'w' as Tone, a: 1 }] : []),
        { label: lb(S, ['la mejor recta', 'the best line'], ['la mejor', 'the best']), value: LMIN, t: 'dat' as Tone, hot: true, a: fr(S, 'floor', 0.66, 0.78) },
        { label: lb(S, ['acertar a todos', 'hitting every point'], ['acertar todo', 'hit all']), value: 0, t: 'err' as Tone, a: S.on('not-zero') ? fr(S, 'not-zero', 0.3, 0.42) : 0 },
      ];
      return { chart: (rr) => hBars(S, rr, rows, 250), full: true };
    }
    case 'best-line':
      return {
        card: card([[S.l('mínimos cuadrados', 'least squares'), 'plain']], { sub: [['Legendre 1805 · Gauss 1795', 'plain']], subA: fr(S, 'best-line', 0.5, 0.62) }),
        items: [{ label: lb(S, ['mejor peso', 'best weight'], ['peso', 'weight']), value: nf(S, BEST.w, 2), t: 'w', a: fr(S, 'best-line', 0.25, 0.36) }, { label: lb(S, ['mejor sesgo', 'best bias'], ['sesgo', 'bias']), value: nf(S, BEST.b, 2), t: 'w', a: fr(S, 'best-line', 0.25, 0.36) }],
        full: true,
      };
    case 'outlier': case 'absolute': {
      const sq = shares(BEST, 'sq'), ab = shares(BEST, 'abs');
      return {
        full: true,
        custom: (rr) => {
          const title = S.l('¿cuánto aporta cada estudiante?', 'how much does each student add?');
          tx(S, title, rr.x, rr.y, { px: 12, weight: 700, color: S.pal.mute, base: 'top', w: rr.w });
          let y = rr.y + (tw(S, title, 12, { weight: 700 }) > rr.w ? 38 : 22);
          y += stackBar(S, { x: rr.x, y, w: rr.w, h: 0 }, sq, OUT, S.l('con cuadrados', 'with squares'), fr(S, 'outlier', 0.62, 0.74)) + 10;
          if (phase === 'absolute') stackBar(S, { x: rr.x, y, w: rr.w, h: 0 }, ab, OUT, S.l('con errores absolutos', 'with absolute errors'), fr(S, 'absolute', 0.62, 0.74));
        },
      };
    }
    case 'compare': case 'outlier-demo': case 'try2': case 'after-try2': {
      const yo = yoNow(S), lad = ladFit(yo), after = phase === 'after-try2' || phase === 'try2' || phase === 'outlier-demo';
      const dq = l.w - BEST.w, da = lad.w - ladFit(YO).w;
      return {
        items: [
          { label: lb(S, ['nota del atípico', 'outlier’s grade'], ['atípico', 'outlier']), value: nf(S, yo, 0), t: 'err', sub: S.done.has('outlier') && phase === 'try2' ? S.l('¡lo notaste!', 'you noticed!') : undefined },
          { label: lb(S, ['peso, recta de cuadrados', 'weight, squares line'], ['w cuadrados', 'w squares']), value: nf(S, l.w, 2), t: 'w', sub: after ? S.l(`cambió ${sg(S, dq, 2)}`, `changed ${sg(S, dq, 2)}`) : undefined },
          { label: lb(S, ['peso, recta absoluta', 'weight, absolute line'], ['w absoluta', 'w absolute']), value: nf(S, lad.w, 2), t: 'ink', sub: after ? S.l(`cambió ${sg(S, da, 2)}`, `changed ${sg(S, da, 2)}`) : undefined },
        ],
        full: true,
      };
    }
    default: { // limits
      const ye = yAt(l, 12);
      return {
        card: card([[S.l('predicción', 'prediction'), 'plain'], [' = ', 'plain'], [nf(S, l.w, 2), 'w'], [' · x + ', 'plain'], [nf(S, l.b, 2), 'w']], { sub: [['x = 12  →  ', 'plain'], [nf(S, ye, 1), 'err']], subA: fr(S, 'limits', 0.62, 0.74) }),
        items: [{ label: lb(S, ['predicción con 12 horas', 'prediction at 12 hours'], ['con 12 horas', 'at 12 hours']), value: nf(S, ye, 1), t: 'err', big: true, sub: S.l('más que la nota máxima', 'above the top grade'), a: fr(S, 'limits', 0.62, 0.74) }],
        full: true,
      };
    }
  }
}

/** Un error de 2 cuenta 4 celdas; uno de 4, 16; uno de −3, 9 (borde punteado: venía de un error negativo). */
function drawGrids(S: Frame, r: Rect) {
  const { pal: p } = S, er = tone(S, 'err');
  const ex = [
    { n: 2, lab: '2 × 2 = 4', a: fr(S, 'square-idea', 0.56, 0.66), dash: false },
    { n: 4, lab: '4 × 4 = 16', a: fr(S, 'square-idea', 0.8, 0.9), dash: false },
    { n: 3, lab: '(−3) × (−3) = 9', a: fr(S, 'square-neg', 0.36, 0.48), dash: true },
  ];
  const note = S.l('el doble de error, cuatro veces más', 'twice the error, four times as much'), noteA = fr(S, 'square-neg', 0.06, 0.18);
  const tall = r.h > r.w * 0.8;
  if (tall) {
    const cell = clamp(Math.min(r.w * 0.07, (r.h - 3 * 22 - 40) / 9), 8, 18);
    let y = r.y + 4;
    ex.forEach((e) => {
      gridSq(S, r.x + 2, y, e.n, cell, { a: e.a, dash: e.dash });
      tx(S, e.lab, r.x + 2 + 4 * cell + 16, y + (e.n * cell) / 2, { px: 15, weight: 700, font: 'mono', color: er.ink, base: 'middle', a: e.a });
      y += e.n * cell + 22;
      if (e.n === 4) { tx(S, note, r.x, y - 8, { px: 12, weight: 700, color: p.ink2, base: 'top', w: r.w, a: noteA }); y += 26; }
    });
  } else {
    // si los rótulos no caben en una fila, se escriben sin espacios alrededor de «×»
    const wide = (e: { lab: string }) => tw(S, e.lab, 13, { weight: 700, font: 'mono' });
    if (ex.reduce((a, e) => a + wide(e), 0) + 28 > r.w) ex.forEach((e) => (e.lab = e.lab.replace(/ × /g, '×')));
    const labW = ex.map(wide);
    const cell = clamp((r.h - 22 - 20) / 4, 6, 14), gapX = 14;
    const bw = ex.map((e, i) => Math.max(e.n * cell, labW[i]));
    let x = r.x + Math.max(0, (r.w - (bw.reduce((a, v) => a + v, 0) + gapX * 2)) / 2);
    ex.forEach((e, i) => {
      const gx = x + (bw[i] - e.n * cell) / 2, gy = r.y + (4 - e.n) * cell;
      gridSq(S, gx, gy, e.n, cell, { a: e.a, dash: e.dash });
      tx(S, e.lab, x + bw[i] / 2, r.y + 4 * cell + 6, { px: 13, weight: 700, font: 'mono', color: er.ink, align: 'center', base: 'top', a: e.a });
      x += bw[i] + gapX;
    });
    tx(S, note, r.x + r.w / 2, r.y + 4 * cell + 26, { px: 12, weight: 700, color: p.ink2, align: 'center', base: 'top', a: noteA });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Última escena: la pérdida de cada peso dibuja un valle
// ═════════════════════════════════════════════════════════════════════════
function drawCurveView(S: Frame) {
  const { d, pal: p, u } = S, R = regions(S).all, gap = 16 * u;
  const a = fr(S, 'curve', 0.04, 0.18) * (1 - fr(S, 'bridge', 0, 0.15));
  if (a < 0.01) return;
  const [A, B] = S.portrait ? split(R, 'v', 0.46, gap) : split(R, 'h', 0.5, gap);
  const pad = { l: 40 / u, r: 12 / u, t: 26 / u, b: 46 / u };
  const pa = new Plot(S, A, { xr: [0, 10.5], yr: [0, 100], pad }), pb = new Plot(S, B, { xr: [0, 11], yr: [0, 1000], pad });
  // barrido del peso con el sesgo fijo en su mejor valor: de 0.5 a 10.4 y, en «valley», de vuelta al fondo
  const valley = S.on('valley');
  const w = valley ? lerp(10.4, BEST.w, fr(S, 'valley', 0.08, 0.45, 'io')) : lerp(0.5, 10.4, fr(S, 'curve', 0.22, 0.94, 'io'));
  const line: Line = { w, b: BEST.b }, Lw = mse(line), atFloor = valley && fr(S, 'valley', 0.45, 0.5) > 0.99;
  d.withAlpha(a, () => {
    axesOf(S, pa, A, { xTicks: [0, 2, 4, 6, 8, 10], yTicks: [0, 50, 100], grid: [25, 50, 75], xLabel: S.l('horas  x', 'hours  x'), yLabel: S.l('calificación', 'grade'), xTone: 'sig', yTone: 'dat' });
    axesOf(S, pb, B, { xTicks: [0, 2, 4, 6, 8, 10], yTicks: [0, 500, 1000], grid: [250, 500, 750], xLabel: S.l('peso  w', 'weight  w'), yLabel: S.l('pérdida (MSE)', 'loss (MSE)'), xTone: 'w', yTone: 'err' });
    // izquierda: datos, cuadrados tenues y la recta que gira
    const e = errsOf(line);
    pa.clip(() => {
      e.forEach((_, i) => {
        const px = pa.X(XS[i]), yP = pa.Y(YS[i]), yL = pa.Y(yAt(line, XS[i])), side = Math.abs(yP - yL), dir = px < pa.r.x + pa.r.w / 2 ? 1 : -1;
        d.rect(dir > 0 ? px : px - side, Math.min(yP, yL), side, side, { fill: alpha(tone(S, 'err').c, 0.1), stroke: tone(S, 'err').c, lw: 1, a: 0.7 });
      });
    });
    pa.line(0, line.b, 10.5, yAt(line, 10.5), 'w', 3.2);
    YS.forEach((y, i) => pa.datum(XS[i], y, 0, { r: 5 }));
    tx(S, `w = ${nf(S, w, 2)}`, pa.r.x + 8 * u, pa.r.y + 6 * u, { px: 14, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'top', halo: p.stage, haloW: 4 });
    // derecha: la curva de pérdida se traza a medida que el peso avanza
    pb.curve((x) => mse({ w: x, b: BEST.b }), 'err', 3, { from: valley ? 0 : 0.5, to: valley ? 11 : Math.max(0.51, w) });
    pb.line(w, 0, w, Lw, 'mute', 1.4, [4, 4]);
    pb.line(0, Lw, w, Lw, 'mute', 1.4, [4, 4]);
    pb.dot(w, Lw, 8, atFloor ? 'dat' : 'w');
    tx(S, `${S.l('pérdida', 'loss')} = ${nf(S, Lw, 1)}`, pb.r.x + 8 * u, pb.r.y + 6 * u, { px: 14, weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top', halo: p.stage, haloW: 4 });
    if (valley) chipTag(S, S.l('el fondo', 'the bottom'), pb.X(BEST.w), pb.Y(LMIN) - 24 * u, 'dat', { a: fr(S, 'valley', 0.5, 0.62) });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Puente
// ═════════════════════════════════════════════════════════════════════════
function drawBridge(S: Frame) {
  const { d, u } = S, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(5.5 * u));
  neu(S, cx - 12 * sc, cy - 18 * sc - 34 * u, { scale: sc, mood: 'happy', a: fr(S, 'bridge', 0.06, 0.2) });
  d.withAlpha(fr(S, 'bridge', 0.22, 0.36), () => {
    tx(S, S.l('Siguiente', 'Next'), cx, cy + 6 * u, { px: 14, weight: 700, color: S.pal.mute, align: 'center' });
    tx(S, S.l('Descenso del gradiente', 'Gradient descent'), cx, cy + 40 * u, { px: 26, weight: 800, align: 'center' });
    tx(S, S.l('¿Cómo bajar al fondo del valle sin probarlo todo?', 'How do we reach the bottom of the valley without trying everything?'), cx, cy + 74 * u, { px: 15, weight: 600, color: S.pal.ink2, align: 'center', w: S.W - 40 * u });
  });
}

export default scene;
