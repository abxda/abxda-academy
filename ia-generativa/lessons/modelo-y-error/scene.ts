// Escena: Un modelo y su error. Diez estudiantes (horas de estudio → calificación, datos ILUSTRATIVOS), una recta w·x + b,
// el error de cada punto, por qué se eleva al cuadrado, la pérdida (MSE), dos turnos interactivos (ajustar la recta y arrastrar
// al estudiante atípico), la mejor recta de mínimos cuadrados y la parábola de pérdida que abre la lección 4.
import {
  Plot, alpha, badge, clamp, ease, lerp, neu, regions, split, tone,
  type Frame, type Rect, type SceneFactory, type Tone,
} from '../../../../../theme/kit';
import {
  BEST, FIVE, FLAT, LMIN, N, OUT, START, THR, XS, X_NEW, YO, YS,
  errsOf, keyframes, ladFit, lerpLine, lsFit, mse, nf, sg, shares, sumAbs, sumSq, withOutlier, yAt, type Line,
} from './helpers';
import {
  axesOf, bell, drawAxes, drawHandle, drawLine, drawPoints, errBars, errorMarks, formulaCard, hBars, layout, readouts, signGlyphs, stackBar, tw, tx,
  type Item, type Lay, type Part,
} from './parts';

// ── estado interactivo ───────────────────────────────────────────────────
const XW = 7.5;                                    // horas donde vive el asa del peso w
interface Fit { w: number; b: number; best: number; drag: null | 'w' | 'b'; off: number }
interface Out { yo: number; drag: boolean; off: number; maxDev: number }
const newFit = (): Fit => ({ w: FLAT.w, b: FLAT.b, best: mse(FLAT), drag: null, off: 0 });
const newOut = (): Out => ({ yo: YO, drag: false, off: 0, maxDev: 0 });
const fitOf = (S: Frame): Fit => (S.st.fit ??= newFit());
const outOf = (S: Frame): Out => (S.st.out ??= newOut());
const inFit = (S: Frame) => S.between('try1', 'floor');
const inOut = (S: Frame) => S.between('try2', 'after-try2');
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Calificación del estudiante atípico en este instante. Si la persona no lo movió, «after-try2» lo baja solo (demostración) y «gauss» lo devuelve a su sitio. */
const heldOut = (S: Frame) => (outOf(S).maxDev < 1 && S.on('after-try2') ? 20 : outOf(S).yo);
function yoNow(S: Frame) {
  const o = outOf(S);
  if (S.on('gauss')) return lerp(heldOut(S), YO, S.at('gauss', 0, 1.2));
  if (S.on('after-try2') && o.maxDev < 1) return lerp(YO, 20, S.at('after-try2', 0.3, 1.9));
  return o.yo;
}

/** La recta del modelo según el momento de la lección. */
function modelLine(S: Frame): Line | null {
  if (!S.on('line')) return null;
  const f = fitOf(S);
  if (S.on('floor')) return lerpLine({ w: f.w, b: f.b }, lsFit(withOutlier(yoNow(S))), S.at('floor', 0.1, 1.6));
  if (S.on('try1')) return { w: f.w, b: f.b };
  if (S.on('goal')) return FLAT;
  if (S.on('sum-problem')) return lerpLine(START, FLAT, S.at('sum-problem', 0.2, 1.5));
  let w = START.w, b = START.b;
  if (S.on('weight') && !S.on('bias')) w = keyframes(S.since('weight') - 0.3, [[0, 2], [1.1, 7], [2.4, 0.5], [3.4, 2]]);
  if (S.on('bias') && !S.on('prediction')) b = keyframes(S.since('bias') - 0.3, [[0, 45], [1.1, 70], [2.4, 20], [3.4, 45]]);
  return { w, b };
}

const tag = (S: Frame, text: string, x: number, y: number, t: Tone, o: { align?: CanvasTextAlign; a?: number } = {}) =>
  badge(S, text, x, y, { tone: t, align: o.align, a: o.a, size: 12 / S.u });
const sml = (S: Frame) => S.portrait || S.W < 640;
const lb = (S: Frame, long: [string, string], short: [string, string]) => (sml(S) ? S.l(short[0], short[1]) : S.l(long[0], long[1]));

// ── la escena ─────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'wm', kind: 'button', label: { es: 'Peso w −', en: 'Weight w −' }, from: 'try1', to: 'floor' },
    { id: 'wp', kind: 'button', label: { es: 'Peso w +', en: 'Weight w +' }, from: 'try1', to: 'floor' },
    { id: 'bm', kind: 'button', label: { es: 'Sesgo b −', en: 'Bias b −' }, from: 'try1', to: 'floor' },
    { id: 'bp', kind: 'button', label: { es: 'Sesgo b +', en: 'Bias b +' }, from: 'try1', to: 'floor' },
    { id: 'reset1', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try1', to: 'floor' },
    { id: 'om', kind: 'button', label: { es: 'Bajar al atípico', en: 'Lower the outlier' }, from: 'try2', to: 'after-try2' },
    { id: 'op', kind: 'button', label: { es: 'Subir al atípico', en: 'Raise the outlier' }, from: 'try2', to: 'after-try2' },
    { id: 'reset2', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try2', to: 'after-try2' },
  ],

  init(S) { S.st.fit = newFit(); S.st.out = newOut(); },

  action(S, id) {
    const f = fitOf(S), o = outOf(S);
    // Los botones aceleran si se pulsan seguido (o se mantiene Enter): 1, 2, 4 y hasta 8 veces el paso base.
    const rep = (S.st.rep ??= { id: '', t: -9, n: 0 }) as { id: string; t: number; n: number };
    rep.n = rep.id === id && S.clock - rep.t < 0.5 ? rep.n + 1 : 0; rep.id = id; rep.t = S.clock;
    const m = Math.min(8, 2 ** Math.floor(rep.n / 2));
    if (inFit(S)) {
      if (id === 'wm') f.w = clamp(r2(f.w - 0.1 * m), -3, 12);
      else if (id === 'wp') f.w = clamp(r2(f.w + 0.1 * m), -3, 12);
      else if (id === 'bm') f.b = clamp(r2(f.b - 0.5 * m), 0, 100);
      else if (id === 'bp') f.b = clamp(r2(f.b + 0.5 * m), 0, 100);
      else if (id === 'reset1') S.st.fit = newFit();
    } else if (inOut(S)) {
      if (id === 'om') o.yo = clamp(o.yo - 2 * m, 0, 100);
      else if (id === 'op') o.yo = clamp(o.yo + 2 * m, 0, 100);
      else if (id === 'reset2') S.st.out = newOut();
    }
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea.
  update(S) {
    if (inFit(S)) {
      const f = fitOf(S), L = mse({ w: f.w, b: f.b });
      f.best = Math.min(f.best, L);
      if (L <= THR) S.complete('fit');
    }
    if (inOut(S)) {
      const o = outOf(S);
      o.maxDev = Math.max(o.maxDev, Math.abs(o.yo - YO));
      if (o.maxDev >= 30) S.complete('outlier');
    }
  },

  pointer(S, e) {
    const g1 = inFit(S), g2 = inOut(S);
    if (!g1 && !g2) return;
    const P = layout(S), plot = P.plot, f = fitOf(S), o = outOf(S);
    if (e.type === 'down') {
      if (g1) {
        const hb: [number, number] = [plot.X(0), plot.Y(f.b)], hw: [number, number] = [plot.X(XW), plot.Y(yAt(f, XW))];
        const db = Math.hypot(e.x - hb[0], e.y - hb[1]), dw = Math.hypot(e.x - hw[0], e.y - hw[1]), R = S.hitR + 6;
        if (Math.min(db, dw) <= R) { f.drag = db <= dw ? 'b' : 'w'; f.off = (f.drag === 'b' ? hb[1] : hw[1]) - e.y; }
      } else {
        const px = plot.X(XS[OUT]), py = plot.Y(o.yo);
        if (Math.hypot(e.x - px, e.y - py) <= S.hitR + 6) { o.drag = true; o.off = py - e.y; }
      }
    } else if (e.type === 'move') {
      if (g1 && f.drag) {
        const yy = clamp(plot.iY(e.y + f.off), 0, 100);
        if (f.drag === 'b') f.b = r2(yy); else f.w = clamp(r2((yy - f.b) / XW), -3, 12);
      } else if (g2 && o.drag) o.yo = clamp(Math.round(plot.iY(e.y + o.off) * 10) / 10, 0, 100);
    } else { f.drag = null; o.drag = false; }
  },

  cursor(S, x, y) {
    const g1 = inFit(S), g2 = inOut(S);
    if (!g1 && !g2) return undefined;
    const P = layout(S), plot = P.plot, f = fitOf(S), o = outOf(S);
    if (f.drag || o.drag) return 'grabbing';
    const R = S.hitR + 6;
    if (g1 && (Math.hypot(x - plot.X(0), y - plot.Y(f.b)) <= R || Math.hypot(x - plot.X(XW), y - plot.Y(yAt(f, XW))) <= R)) return 'grab';
    if (g2 && Math.hypot(x - plot.X(XS[OUT]), y - plot.Y(o.yo)) <= R) return 'grab';
    return undefined;
  },

  render(S) {
    const { d } = S, P = layout(S);
    const mainA = 1 - S.at('curve', 0, 0.5);
    if (mainA > 0.01) d.withAlpha(mainA, () => drawMain(S, P));
    if (S.on('curve')) drawCurveView(S);
    if (S.on('bridge')) drawBridge(S);
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Escena principal: ejes, datos, recta, errores, asas y panel lateral
// ═════════════════════════════════════════════════════════════════════════
function drawMain(S: Frame, P: Lay) {
  const { d, pal: p, u } = S, plot = P.plot, r = plot.r;
  const yo = yoNow(S), ys = withOutlier(yo), line = modelLine(S);
  const errA = 1 - S.at('limits', 0, 0.6);                     // los errores se retiran al salir de los datos

  drawAxes(S, P, S.reveal('hook', 0, 0.7));

  // ── «pattern»…: guía de siete horas y la pregunta ──
  if (S.between('pattern', 'reality')) drawGuide(S, P, line);

  // ── etiquetas de entrada y salida (regresión) ──
  if (S.between('regression', 'line')) {
    const a = S.reveal('regression', 0.2, 0.6);
    d.withAlpha(a, () => {
      tag(S, S.l('entrada x: horas', 'input x: hours'), r.x + 8, r.y + r.h - 16 * u, 'sig', { align: 'left' });
      tag(S, S.l('salida y: un número', 'output y: a number'), r.x + 8, r.y + 14 * u, 'dat', { align: 'left' });
    });
    d.withAlpha(S.reveal('regression', 0.9, 0.6), () => tag(S, S.l('regresión', 'regression'), r.x + 8, r.y + 44 * u, 'lat', { align: 'left' }));
  }

  // ── errores: segmentos y cuadrados (debajo de la recta y de los puntos) ──
  if (line && S.on('reality') && errA > 0.01) {
    const only = S.on('all-errors') ? undefined : [FIVE];
    const seg = (i: number) => (i === FIVE ? (S.on('all-errors') ? 1 : S.reveal('reality', 0.3, 0.8)) : S.reveal('all-errors', 0.1 + i * 0.13, 0.45));
    const sq = (i: number) => S.reveal('square', 0.1 + i * 0.14, 0.55);
    const hot = S.between('big-weighs', 'loss') ? [3, 9] : S.between('outlier', 'compare') ? [OUT] : [];
    d.withAlpha(errA, () => {
      errorMarks(S, P, line, ys, { seg, sq, hot, only, dashNeg: !S.on('absolute') });
      if (S.between('all-errors', 'absolute')) signGlyphs(S, P, line, ys, (i) => S.reveal('all-errors', 0.3 + i * 0.13, 0.4) * (1 - S.at('absolute', 0, 0.4)));
    });
  }

  // ── rectas ──
  if (line) {
    const compare = S.between('compare', 'limits');
    const reveal = S.reveal('line', 0.1, 1.3);
    if (S.on('limits')) {
      drawLine(S, P, line, { from: 0, to: 9.5 });
      drawLine(S, P, line, { from: 9.5, to: P.xmax, dash: [8, 6], t: 'w', lw: 3 });
    } else {
      drawLine(S, P, line, { reveal });
    }
    if (compare) {
      const lad = ladFit(yo);
      drawLine(S, P, lad, { t: 'ink', lw: 2.6, dash: [9, 6] });
      // leyenda arriba a la izquierda (zona libre): muestra de trazo + nombre
      const a = S.reveal('compare', 0.3, 0.6), x0 = r.x + 12 * u, y0 = r.y + 16 * u;
      d.withAlpha(a, () => {
        d.line(x0, y0, x0 + 28 * u, y0, tone(S, 'w').c, 3.4);
        tx(S, sml(S) ? S.l('cuadrática (e²)', 'squared (e²)') : S.l('cuadrática: minimiza e²', 'squared: minimizes e²'), x0 + 36 * u, y0, { px: 12, weight: 700, color: tone(S, 'w').ink, base: 'middle', halo: p.stage, haloW: 4 });
        d.line(x0, y0 + 20 * u, x0 + 28 * u, y0 + 20 * u, p.ink, 2.6, [9, 6]);
        tx(S, sml(S) ? S.l('absoluta (|e|)', 'absolute (|e|)') : S.l('absoluta: minimiza |e|', 'absolute: minimizes |e|'), x0 + 36 * u, y0 + 20 * u, { px: 12, weight: 700, color: p.ink, base: 'middle', halo: p.stage, haloW: 4 });
      });
    }
    if (S.between('sum-problem', 'square')) {
      const a = S.reveal('sum-problem', 1.2, 0.5);
      tag(S, S.l('ignora las horas', 'ignores the hours'), r.x + 10 * u, plot.Y(FLAT.b) - 18 * u, 'mute', { align: 'left', a });
    }
  }

  // ── «weight»: cuánto sube la recta por cada hora; «bias»: dónde corta el eje ──
  if (line && S.between('weight', 'bias')) {
    const a = S.reveal('weight', 0.2, 0.5), x1 = 3, x2 = 4, y1 = yAt(line, x1), y2 = yAt(line, x2);
    d.withAlpha(a, () => {
      plot.line(x1, y1, x2, y1, 'sig', 2.4, [4, 3]);
      plot.line(x2, y1, x2, y2, 'w', 2.6);
      tx(S, S.l('1 h', '1 h'), plot.X(3.5), plot.Y(y1) + 6 * u, { px: 12, weight: 800, color: tone(S, 'sig').ink, align: 'center', base: 'top', halo: p.stage, haloW: 4 });
      tx(S, sg(S, line.w, 1), plot.X(x2) + 7 * u, (plot.Y(y1) + plot.Y(y2)) / 2, { px: 13, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'middle', halo: p.stage, haloW: 4 });
    });
  }
  if (line && S.between('bias', 'prediction')) drawHandle(S, plot.X(0), plot.Y(line.b), 'b', 'w', { a: S.reveal('bias', 0.2, 0.5) });

  // ── datos ──
  drawPoints(S, P, ys, { appear: (i) => S.reveal('hook', 0.5 + i * 0.2, 0.45), ring: S.between('outlier', 'limits') || S.between('reality', 'all-errors') ? (S.between('reality', 'all-errors') ? [FIVE] : [OUT]) : [] });
  if (S.between('outlier', 'limits')) {
    const a = S.reveal('outlier', 0.3, 0.5), px = plot.X(XS[OUT]), py = plot.Y(ys[OUT]);
    d.withAlpha(a, () => tag(S, S.l('atípico', 'outlier'), px, py + 22 * u, 'err'));
  }

  // ── etiquetas del error de un punto ──
  if (line && S.between('reality', 'all-errors')) drawRealityTags(S, P, line);
  // ── etiquetas de «los cuadrados pesan distinto» ──
  if (line && S.between('big-weighs', 'loss')) drawBigTags(S, P, line, ys);
  // ── la advertencia de «limits» ──
  if (line && S.on('limits')) drawLimits(S, P, line);

  // ── asas ──
  if (S.between('goal', 'floor')) {
    const f = fitOf(S), a = S.reveal('goal', 0.4, 0.6), act = f.drag;
    const l = line ?? FLAT, pulse = S.reduced ? 0 : S.between('goal', 'try1') || (S.between('try1', 'floor') && !S.done.has('fit') && S.since('try1') < 5) ? 0.7 : 0;
    drawHandle(S, plot.X(0), plot.Y(l.b), 'b', 'w', { a, pulse, active: act === 'b' });
    drawHandle(S, plot.X(XW), plot.Y(yAt(l, XW)), 'w', 'w', { a, pulse, active: act === 'w' });
  }
  if (S.between('try2', 'after-try2')) {
    const o = outOf(S), a = S.reveal('try2', 0.2, 0.5), px = plot.X(XS[OUT]), py = plot.Y(o.yo);
    d.withAlpha(a, () => {
      d.circle(px, py, S.hitR, { stroke: tone(S, 'err').c, lw: 1.2, dash: [3, 4], a: S.coarse || o.drag ? 0.7 : 0.4 });
      const k = (S.clock * 0.9) % 1;
      if (!S.reduced && !o.drag && o.maxDev < 1) d.circle(px, py, 8 * u + (S.hitR - 6 * u) * k, { stroke: tone(S, 'err').c, lw: 2, a: (1 - k) * 0.7 });
      const dy = 16 * u + 4;
      d.arrow(px + S.hitR * 0.7 + 6, py - 4, px + S.hitR * 0.7 + 6, py - dy - 4, tone(S, 'err').c, 2, 7);
      d.arrow(px + S.hitR * 0.7 + 6, py + 4, px + S.hitR * 0.7 + 6, py + dy + 4, tone(S, 'err').c, 2, 7);
    });
  }

  // ── Neu: solo cuando ayuda ──
  const sc = Math.max(2, Math.round(2.4 * u));
  if (S.between('pattern', 'regression')) neu(S, r.x + r.w - 24 * sc - 8, r.y + r.h - 18 * sc - 10, { scale: sc, mood: 'think', a: S.reveal('pattern', 0.3, 0.5) });
  else if (S.between('floor', 'not-zero')) neu(S, r.x + r.w - 24 * sc - 8, r.y + r.h - 18 * sc - 10, { scale: sc, mood: 'wow', a: S.reveal('floor', 1.6, 0.5) });
  // Neu celebra cuando la persona logra el turno
  else if ((S.between('try1', 'floor') && S.done.has('fit')) || (S.between('try2', 'after-try2') && S.done.has('outlier'))) neu(S, r.x + r.w - 24 * sc - 8, r.y + r.h - 18 * sc - 10, { scale: sc, mood: 'happy' });

  // ── panel lateral ──
  if (S.on('formula')) d.withAlpha(Math.min(1, P.k * 1.4), () => drawAside(S, P, line, ys));
}

// ── guía de siete horas: la pregunta («¿?») y su respuesta ──
function drawGuide(S: Frame, P: Lay, line: Line | null) {
  const { d, pal: p, u } = S, plot = P.plot, r = plot.r, x = plot.X(X_NEW), sg_ = tone(S, 'sig'), w = tone(S, 'w');
  const a = S.reveal('pattern', 0.2, 0.6) * (1 - S.at('reality', 0, 0.4));
  const ans = line && S.on('prediction') ? yAt(line, X_NEW) : null;
  d.withAlpha(a, () => {
    if (ans === null) {
      d.line(x, r.y + r.h, x, r.y, sg_.c, 1.8, [5, 5], 0.8);
      tx(S, '?', x, plot.Y(76), { px: 28, weight: 800, color: sg_.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 5 });
    } else {
      const k1 = S.at('prediction', 0.1, 0.9), k2 = S.at('prediction', 0.9, 1.9), yTop = lerp(plot.Y(100), plot.Y(ans), k1);
      d.line(x, r.y + r.h, x, yTop, sg_.c, 2, [5, 5]);
      d.line(x, plot.Y(ans), lerp(x, r.x, k2), plot.Y(ans), w.c, 2, [5, 5]);
      plot.dot(X_NEW, ans, 6.5, 'w', { a: k1 });
      d.withAlpha(k2, () => tx(S, `ŷ = ${nf(S, ans, 0)}`, r.x + 8 * u, plot.Y(ans) - 7 * u, { px: 14, weight: 800, font: 'mono', color: w.ink, base: 'bottom', halo: p.stage, haloW: 4 }));
    }
    tag(S, `7 ${S.l('h', 'h')}`, x, r.y + r.h - 14 * u, 'sig');
  });
}

// ── «reality»: real, predicción y error del estudiante de cinco horas ──
function drawRealityTags(S: Frame, P: Lay, line: Line) {
  const { pal: p, u } = S, plot = P.plot, a = S.reveal('reality', 0.7, 0.6), x = plot.X(XS[FIVE]);
  const real = YS[FIVE], pred = yAt(line, XS[FIVE]), er = tone(S, 'err');
  S.d.withAlpha(a, () => {
    tx(S, S.l(`real ${nf(S, real, 0)}`, `real ${nf(S, real, 0)}`), x - 11 * u, plot.Y(real), { px: 13, weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'middle', halo: p.stage, haloW: 4 });
    tx(S, S.l(`predicción ${nf(S, pred, 0)}`, `prediction ${nf(S, pred, 0)}`), x, plot.Y(pred) + 24 * u, { px: 13, weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
    tx(S, S.l(`error ${sg(S, real - pred, 0)}`, `error ${sg(S, real - pred, 0)}`), x + 11 * u, (plot.Y(real) + plot.Y(pred)) / 2, { px: 13, weight: 800, color: er.ink, align: 'left', base: 'middle', halo: p.stage, haloW: 4 });
  });
}

// ── «big-weighs»: dos cuadrados, dos pesos distintos ──
function drawBigTags(S: Frame, P: Lay, line: Line, ys: number[]) {
  const { pal: p, u } = S, plot = P.plot, a = S.reveal('big-weighs', 0.5, 0.6), er = tone(S, 'err'), e = errsOf(line, ys), mid = plot.r.x + plot.r.w / 2;
  S.d.withAlpha(a, () => {
    [3, 9].forEach((i) => {
      const px = plot.X(XS[i]), yP = plot.Y(ys[i]), yL = plot.Y(yAt(line, XS[i])), side = Math.abs(yP - yL), dir = px < mid ? 1 : -1;
      const txt = `${nf(S, Math.abs(e[i]), 1)}² = ${nf(S, e[i] * e[i], 0)}`, big = side > 70 * u;
      // el cuadrado grande lleva su rótulo dentro; el pequeño, justo debajo
      if (big) tx(S, txt, px + dir * side / 2, (yP + yL) / 2, { px: 14, weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
      else tx(S, txt, px + dir * side / 2, Math.max(yP, yL) + 14 * u, { px: 13, weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'top', halo: p.stage, haloW: 4 });
    });
  });
}

// ── «limits»: fuera de los datos, la recta predice un imposible ──
function drawLimits(S: Frame, P: Lay, line: Line) {
  const { d, pal: p, u } = S, plot = P.plot, r = plot.r, er = tone(S, 'err');
  const a = S.reveal('limits', 0.4, 0.8), xe = 12, ye = yAt(line, xe);
  const xd = plot.X(9.5);
  d.withAlpha(a, () => {
    // zona sin datos
    d.clip(xd, r.y, r.x + r.w - xd, r.h, () => d.dither(xd, r.y, r.x + r.w - xd, r.h, p.mute, 0.14, 2));
    d.line(xd, r.y, xd, r.y + r.h, p.mute, 1.2, [4, 4]);
    tx(S, S.l('sin datos', 'no data'), (xd + r.x + r.w) / 2, r.y + r.h - 12 * u, { px: 12, weight: 700, color: p.ink2, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
    // tope de 100
    d.line(r.x, plot.Y(100), r.x + r.w, plot.Y(100), er.c, 1.6, [6, 4]);
    tx(S, S.l('máximo posible: 100', 'highest possible: 100'), r.x + 8 * u, plot.Y(100) - 6 * u, { px: 12, weight: 700, color: er.ink, base: 'bottom', halo: p.stage, haloW: 4 });
    // la predicción imposible
    d.line(plot.X(xe), r.y + r.h, plot.X(xe), plot.Y(ye), p.mute, 1.4, [4, 4]);
    plot.dot(xe, ye, 7, 'err');
    tx(S, `12 h → ${nf(S, ye, 1)}`, plot.X(xe) + 6 * u, plot.Y(ye) - 11 * u, { px: 14, weight: 800, font: 'mono', color: er.ink, align: 'right', base: 'bottom', halo: p.stage, haloW: 4 });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Panel lateral: tarjetas, lecturas y gráficas según el momento
// ═════════════════════════════════════════════════════════════════════════
const ASIDE_SEGS = ['formula', 'weight', 'bias', 'prediction', 'reality', 'all-errors', 'sum-problem', 'absolute', 'square', 'loss', 'try1', 'floor', 'not-zero', 'best-line', 'outlier', 'why-big', 'compare', 'after-try2', 'gauss', 'limits'];

interface Spec { card?: (r: Rect) => number; items?: Item[]; chart?: (r: Rect) => void; full?: boolean; onBase?: boolean }

function drawAside(S: Frame, P: Lay, line: Line | null, ys: number[]) {
  if (S.on('curve') || !line) return;
  const { d, u } = S, r = P.aside;
  const phase = [...ASIDE_SEGS].reverse().find((id) => S.on(id));
  if (!phase) return;
  const spec = asideSpec(S, phase, line, ys);
  const aIn = S.reveal(phase, 0, 0.45);
  const gap = 12 * u;
  d.withAlpha(aIn, () => {
    const hasR = !!(spec.card || spec.chart), hasI = !!spec.items?.length;
    if (S.portrait) {
      const side = hasI && hasR && !spec.full;
      if (side) {
        const wL = Math.min(r.w * 0.42, 150 * u);
        readouts(S, { x: r.x, y: r.y, w: wL, h: r.h }, spec.items!, { cols: 1, px: 19 });
        const rr: Rect = { x: r.x + wL + gap, y: r.y, w: r.w - wL - gap, h: r.h };
        if (spec.card) spec.card(rr); else if (spec.chart) spec.chart(rr);
      } else {
        let y = r.y;
        if (spec.card) y += spec.card({ x: r.x, y, w: r.w, h: 0 }) + gap * 0.6;
        if (hasI) y += readouts(S, { x: r.x, y, w: r.w, h: r.y + r.h - y }, spec.items!, { cols: Math.min(4, spec.items!.length), px: 20, flat: true }) + gap * 0.4;
        if (spec.chart) spec.chart({ x: r.x, y, w: r.w, h: Math.max(50, r.y + r.h - y) });
      }
    } else {
      let y = r.y;
      if (spec.card) y += spec.card({ x: r.x, y, w: r.w, h: 0 }) + gap;
      if (hasI) y += readouts(S, { x: r.x, y, w: r.w, h: r.y + r.h - y }, spec.items!, { cols: spec.items!.length === 1 ? 1 : 2, flat: r.w < 230 * u }) + gap * 0.5;
      if (spec.chart) {
        const base = P.plot.r.y + P.plot.r.h, top = spec.onBase ? Math.max(y, base - 260 * u) : y;      // las barras se apoyan en la misma base que la gráfica
        spec.chart({ x: r.x, y: top, w: r.w, h: Math.max(60, base - top) });
      }
    }
  });
}

function asideSpec(S: Frame, phase: string, line: Line, ys: number[]): Spec {
  const f = fitOf(S), e = errsOf(line, ys), L = sumSq(line, ys) / N, absSum = sumAbs(line, ys), sum = e.reduce((a, v) => a + v, 0);
  const wIt = (): Item => ({ label: lb(S, ['peso w', 'weight w'], ['w', 'w']), value: nf(S, line.w, 2), t: 'w' });
  const bIt = (): Item => ({ label: lb(S, ['sesgo b', 'bias b'], ['b', 'b']), value: nf(S, line.b, 1), t: 'w' });
  const numeric = (): Part[] => [['ŷ', 'plain'], [' = ', 'plain'], [nf(S, line.w, 1), 'w'], [' · x + ', 'plain'], [nf(S, line.b, 1), 'w']];
  const symbolic: Part[] = [['ŷ', 'plain'], [' = ', 'plain'], ['w', 'w'], [' · ', 'plain'], ['x', 'sig'], [' + ', 'plain'], ['b', 'w']];
  const cardPx = S.portrait ? 17 : sml(S) ? 17 : 24;
  const card = (parts: Part[], sub?: Part[]) => (r: Rect) => formulaCard(S, r, parts, { px: cardPx, sub, subPx: S.portrait ? 12 : sml(S) ? 13 : 16 });
  const suma = (lbl: [string, string], v: number, t: Tone = 'err'): Item => ({ label: lb(S, lbl, lbl), value: v >= 0 && lbl[0].includes('errores') ? sg(S, v, 1) : nf(S, v, 1), t, big: true });
  const bars = (kind: 'signed' | 'abs' | 'sq', vals: number[], scale: number, title: [string, string], hot?: number[]) => (rr: Rect) =>
    errBars(S, rr, vals, { kind, scale, title: S.l(title[0], title[1]), hot, show: (i) => S.reveal(phase, 0.1 + i * 0.05, 0.3) });

  switch (phase) {
    case 'formula': return { card: card(symbolic, [['ŷ', 'plain'], [S.l(' = la predicción', ' = the prediction'), 'plain']]) };
    case 'weight': return { card: card(symbolic, numeric()), items: [wIt()] };
    case 'bias': return { card: card(symbolic, numeric()), items: [wIt(), bIt()] };
    case 'prediction': {
      const ans = yAt(line, X_NEW);
      return { card: card(symbolic, [[nf(S, line.w, 0), 'w'], [' · 7 + ', 'plain'], [nf(S, line.b, 0), 'w'], [' = ', 'plain'], [nf(S, ans, 0), 'w']]), items: [wIt(), bIt()] };
    }
    case 'reality': {
      const real = YS[FIVE], pred = yAt(line, XS[FIVE]);
      return { card: card([['e', 'err'], [' = y − ŷ', 'plain']], [[nf(S, real, 0), 'dat'], [' − ', 'plain'], [nf(S, pred, 0), 'w'], [' = ', 'plain'], [sg(S, real - pred, 0), 'err']]), items: [wIt(), bIt()] };
    }
    case 'all-errors':
      return { items: [suma(['suma de errores', 'sum of errors'], sum)], chart: bars('signed', e, 32, ['error de cada estudiante', 'error of each student'], [FIVE]), onBase: true };
    case 'sum-problem':
      return { items: [{ label: lb(S, ['suma de errores', 'sum of errors'], ['suma de errores', 'sum of errors']), value: sg(S, Math.abs(sum) < 0.05 ? 0 : sum, 1), t: 'err', big: true }], chart: bars('signed', e, 32, ['error de cada estudiante', 'error of each student']), onBase: true };
    case 'absolute':
      return { items: [{ label: lb(S, ['suma de |error|', 'sum of |error|'], ['suma de |error|', 'sum of |error|']), value: nf(S, absSum, 1), t: 'err', big: true }], chart: bars('abs', e, 32, ['error absoluto |e|', 'absolute error |e|']), onBase: true };
    case 'square':
      return { items: [{ label: lb(S, ['suma de cuadrados', 'sum of squares'], ['suma de e²', 'sum of e²']), value: nf(S, sumSq(line, ys), 1), t: 'err', big: true }], chart: bars('sq', e.map((v) => v * v), 900, ['error al cuadrado e²', 'squared error e²']), onBase: true };
    case 'loss': {
      const k = S.on('goal') ? 1 : S.at('loss', 0.1, 1.2);
      return { items: [{ label: lb(S, ['pérdida (MSE)', 'loss (MSE)'], ['pérdida', 'loss']), value: nf(S, L * k, 1), t: 'err', big: true, sub: `${nf(S, sumSq(line, ys), 1)} ÷ ${N}` }], chart: bars('sq', e.map((v) => v * v), 900, ['error al cuadrado e²', 'squared error e²']), onBase: true };
    }
    case 'try1': {
      const done = S.done.has('fit');
      return {
        items: [wIt(), bIt(),
          { label: lb(S, ['pérdida', 'loss'], ['pérdida', 'loss']), value: nf(S, L, 1), t: done ? 'dat' : 'err', big: true, sub: done ? lb(S, ['¡Cerca del mínimo!', 'Close to the minimum!'], ['¡Cerca!', 'Close!']) : undefined },
          { label: lb(S, ['tu mejor marca', 'your best'], ['mejor', 'best']), value: nf(S, f.best, 1), t: 'dat' }],
        chart: bars('sq', e.map((v) => v * v), 900, ['error al cuadrado e²', 'squared error e²']), onBase: true, full: true,
      };
    }
    case 'floor': case 'not-zero': {
      const rows = [
        { label: lb(S, ['recta plana (el promedio)', 'flat line (the average)'], ['recta plana', 'flat line']), value: mse(FLAT), t: 'mute' as Tone, hot: false, a: 1 },
        { label: lb(S, ['tu mejor marca', 'your best'], ['tu mejor', 'your best']), value: f.best, t: 'w' as Tone, hot: false, a: 1 },
        { label: lb(S, ['mejor recta posible', 'best possible line'], ['mejor recta', 'best line']), value: LMIN, t: 'dat' as Tone, hot: true, a: S.reveal('floor', 1.2, 0.5) },
        { label: S.l('modelo perfecto', 'perfect model'), value: 0, t: 'err' as Tone, hot: false, a: S.on('not-zero') ? S.reveal('not-zero', 0.2, 0.5) : 0 },
      ];
      return { chart: (rr) => hBars(S, rr, rows, 250), full: true };
    }
    case 'best-line': {
      const num: Part[] = [['w*', 'w'], [' = cov(x, y) / var(x)', 'plain']];
      return {
        card: card(num, [['b*', 'w'], [S.l(' = media(y) − w*·media(x)', ' = mean(y) − w*·mean(x)'), 'plain']]),
        items: [{ label: lb(S, ['mejor peso w*', 'best weight w*'], ['w*', 'w*']), value: nf(S, BEST.w, 2), t: 'w' }, { label: lb(S, ['mejor sesgo b*', 'best bias b*'], ['b*', 'b*']), value: nf(S, BEST.b, 2), t: 'w' }],
        full: true,
      };
    }
    case 'outlier': case 'why-big': {
      const sq = shares(line, 'sq'), ab = shares(line, 'abs');
      return {
        full: true,
        chart: (rr) => {
          const rh = 48 * S.u;
          tx(S, S.l('¿cuánto aporta cada estudiante a la pérdida?', 'how much does each student add to the loss?'), rr.x, rr.y, { px: 12, weight: 700, color: S.pal.mute, base: 'top', w: rr.w });
          const y0 = rr.y + (tw(S, S.l('¿cuánto aporta cada estudiante a la pérdida?', 'how much does each student add to the loss?'), 12, { weight: 700 }) > rr.w ? 38 : 22);
          stackBar(S, { x: rr.x, y: y0 + 4, w: rr.w, h: rh }, sq, OUT, S.l('con cuadrados e²', 'with squares e²'), S.reveal('outlier', 0.3, 0.6));
          if (phase === 'why-big') stackBar(S, { x: rr.x, y: y0 + 4 + rh + 14 * S.u, w: rr.w, h: rh }, ab, OUT, S.l('con valores absolutos |e|', 'with absolute values |e|'), S.reveal('why-big', 0.4, 0.6));
        },
      };
    }
    case 'compare': case 'after-try2': {
      const o = outOf(S), lad = ladFit(yoNow(S)), after = phase === 'after-try2';
      const dq = line.w - BEST.w, da = lad.w - ladFit(YO).w;
      return {
        items: [
          { label: lb(S, ['peso w, cuadrática', 'weight w, squared'], ['w cuadrát.', 'w squared']), value: nf(S, line.w, 2), t: 'w', sub: after ? S.l(`cambió ${sg(S, dq, 2)}`, `changed ${sg(S, dq, 2)}`) : undefined },
          { label: lb(S, ['peso w, absoluta', 'weight w, absolute'], ['w absoluta', 'w absolute']), value: nf(S, lad.w, 2), t: 'ink', sub: after ? S.l(`cambió ${sg(S, da, 2)}`, `changed ${sg(S, da, 2)}`) : undefined },
          { label: lb(S, ['estudiante atípico', 'outlier student'], ['atípico', 'outlier']), value: nf(S, yoNow(S), 0), t: 'err', sub: o.maxDev >= 30 && S.done.has('outlier') ? S.l('¡Lo notaste!', 'You noticed!') : undefined },
        ],
      };
    }
    case 'gauss': {
      const res = errsOf(BEST, YS), sigma = Math.sqrt(LMIN);
      return { full: true, chart: (rr) => bell(S, rr, res, sigma, S.reveal('gauss', 0.3, 0.8), OUT) };
    }
    default: { // limits
      const ye = yAt(line, 12);
      return { card: card([['ŷ', 'plain'], [' = ', 'plain'], [nf(S, line.w, 2), 'w'], [' · x + ', 'plain'], [nf(S, line.b, 2), 'w']], [['x = 12  →  ŷ = ', 'plain'], [nf(S, ye, 1), 'err']]), items: [{ label: lb(S, ['predicción con 12 h', 'prediction at 12 h'], ['ŷ(12)', 'ŷ(12)']), value: nf(S, ye, 1), t: 'err', big: true, sub: S.l('más que el máximo, 100', 'above the maximum, 100') }], full: true };
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Última escena: la pérdida de cada peso dibuja una parábola
// ═════════════════════════════════════════════════════════════════════════
function drawCurveView(S: Frame) {
  const { d, pal: p, u } = S, R = regions(S).all, gap = 16 * u;
  const a = S.reveal('curve', 0.3, 0.6) * (1 - S.at('bridge', 0, 0.7));
  if (a < 0.01) return;
  const [A, B] = S.portrait ? split(R, 'v', 0.46, gap) : split(R, 'h', 0.5, gap);
  const pad = { l: 40 / u, r: 12 / u, t: 26 / u, b: 46 / u };
  const pa = new Plot(S, A, { xr: [0, 10.5], yr: [0, 100], pad }), pb = new Plot(S, B, { xr: [0, 11], yr: [0, 1000], pad });
  // barrido de w con b fijo en su mejor valor
  const k = S.at('curve', 0.9, 5.4, 'lin'), W = BEST.w;
  const w = k < 0.72 ? lerp(0.5, 10.4, ease.io(k / 0.72)) : lerp(10.4, W, ease.io((k - 0.72) / 0.28));
  const line: Line = { w, b: BEST.b }, Lw = mse(line), done = k >= 0.999;
  d.withAlpha(a, () => {
    axesOf(S, pa, A, { xTicks: [0, 2, 4, 6, 8, 10], yTicks: [0, 50, 100], grid: [25, 50, 75], xLabel: S.l('horas  x', 'hours  x'), yLabel: S.l('calificación  y', 'grade  y'), xTone: 'sig', yTone: 'dat' });
    axesOf(S, pb, B, { xTicks: [0, 2, 4, 6, 8, 10], yTicks: [0, 500, 1000], grid: [250, 500, 750], xLabel: S.l('peso  w', 'weight  w'), yLabel: S.l('pérdida  L', 'loss  L'), xTone: 'w', yTone: 'err' });
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
    // derecha: la curva de pérdida y la bolita
    pb.curve((x) => mse({ w: x, b: BEST.b }), 'err', 3);
    pb.line(w, 0, w, Lw, 'mute', 1.4, [4, 4]);
    pb.line(0, Lw, w, Lw, 'mute', 1.4, [4, 4]);
    pb.dot(w, Lw, 8, done ? 'dat' : 'w');
    tx(S, `L = ${nf(S, Lw, 1)}`, pb.r.x + 8 * u, pb.r.y + 6 * u, { px: 14, weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top', halo: p.stage, haloW: 4 });
    if (done) d.withAlpha(S.reveal('curve', 5.4, 0.5), () => tag(S, S.l('el fondo', 'the floor'), pb.X(W), pb.Y(LMIN) - 22 * u, 'dat'));
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Puente
// ═════════════════════════════════════════════════════════════════════════
function drawBridge(S: Frame) {
  const { d, u } = S, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(5.5 * u));
  neu(S, cx - 12 * sc, cy - 18 * sc - 34 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.9, 0.6), () => {
    tx(S, S.l('Siguiente', 'Next'), cx, cy + 6 * u, { px: 14, weight: 700, color: S.pal.mute, align: 'center' });
    tx(S, S.l('Descenso del gradiente', 'Gradient descent'), cx, cy + 40 * u, { px: 26, weight: 800, align: 'center' });
    tx(S, S.l('¿Cómo hallar el fondo sin probarlo todo?', 'How do we find the floor without trying everything?'), cx, cy + 74 * u, { px: 15, weight: 600, color: S.pal.ink2, align: 'center', w: S.W - 40 * u });
  });
}

export default scene;
