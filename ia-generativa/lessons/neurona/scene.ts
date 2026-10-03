// Escena: La neurona artificial. De la biología (McCulloch y Pitts, 1943) a la fórmula, armada pieza por pieza con números reales;
// la neurona como recta en el plano (frontera de decisión); escalón y sigmoide; el perceptrón de Rosenblatt (1958) y su regla;
// y los límites de la analogía con el cerebro. Tres turnos: las entradas, los pesos y el sesgo, y la regla del perceptrón.
import {
  alpha, clamp, ease, lerp, neu, regions, tone,
  type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { drawDiagram } from './diagram';
import { drawBioMp, drawHook } from './intro';
import { drawBridge, drawHype, drawLimits, drawReal, drawRecap, drawRosenblatt } from './history';
import {
  BASE, DATA, EX, N, PERC_REF, PERC_STEP1, P0, ETA, fire, hitsOf, learn, newPerc, nextIdx, wrongOf, zOf, type Params, type PercState,
} from './model';
import { drawAct, drawHist, drawPlane, planePlot, type PlaneSpec } from './plane';
import { fs, keys, num, stat, statBlock, tag, tau, tr, txt } from './ui';

// ── ayudas ────────────────────────────────────────────────────────────────
const fmt2 = (v: number, l: string) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt1 = (v: number, l: string) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const rawParams = (S: Frame): Params => ({ w1: S.p.w1 ?? BASE.w1, w2: S.p.w2 ?? BASE.w2, b: S.p.b ?? BASE.b });
/** Parámetros que muestra el plano en cada tramo de la narración. */
function planeParams(S: Frame): Params {
  if (S.between('try1', 'step-limit')) return rawParams(S);
  if (S.on('step-limit')) { const q = rawParams(S); return Math.hypot(q.w1, q.w2) < 0.3 ? { ...BASE } : q; }
  if (S.on('tilt')) {
    // «inclinan»: w₁ mayor; «si es negativo, se invierte»: w₂ cambia de signo; «con peso cero»: w₂ = 0 (la recta se vuelve vertical)
    const t = tau(S, 'tilt');
    return {
      w1: keys(t, [[0.26, BASE.w1], [0.44, 4], [0.52, 4], [0.60, BASE.w1]]),
      w2: keys(t, [[0.60, BASE.w2], [0.74, 1.5], [0.82, 1.5], [0.92, 0]]),
      b: keys(t, [[0, 0.6], [0.1, BASE.b]]),
    };
  }
  if (S.on('shift')) {
    // «desplaza»: sube y baja; «sesgo cero»: pasa por el origen; «al subirlo»: la zona del uno crece
    const t = tau(S, 'shift');
    return { ...BASE, b: keys(t, [[0.03, BASE.b], [0.2, 0.3], [0.3, 0.3], [0.5, 0], [0.62, 0], [0.9, 0.6]]) };
  }
  return { ...BASE };
}
/** Factor de escala de pesos y sesgo durante «sharp»: primero mayor (más tajante), luego menor (más dudosa). */
const sharpK = (S: Frame) => (S.on('sharp') ? keys(tau(S, 'sharp'), [[0.08, 1], [0.34, 3], [0.62, 3], [0.88, 0.4]]) : 1);
/** Avance del primer paso del perceptrón en «update». */
const updQ = (S: Frame) => (S.on('update') ? tr(tau(S, 'update'), 0.38, 0.72, 'io') : 0);

const percOf = (S: Frame): PercState => (S.st.perc ??= newPerc());
/** Parámetros del perceptrón que se muestran (con la animación del último paso). */
function percShown(S: Frame, pv: PercState): { p: Params; ghost: Params | null; hot: number } {
  const age = pv.t0 !== undefined ? S.clock - pv.t0 : 99;
  if (pv.from && age < 0.7 && !S.reduced) {
    const q = ease.io(clamp(age / 0.6));
    return { p: { w1: lerp(pv.from.w1, pv.w1, q), w2: lerp(pv.from.w2, pv.w2, q), b: lerp(pv.from.b, pv.b, q) }, ghost: pv.from, hot: pv.idx ?? -1 };
  }
  return { p: { w1: pv.w1, w2: pv.w2, b: pv.b }, ghost: null, hot: pv.idx !== undefined && age < 1.4 ? pv.idx : -1 };
}

// ── la escena ─────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'x1', kind: 'slider', label: { es: 'Enlaces x₁', en: 'Links x₁' }, min: 0, max: 1, step: 0.05, value: EX.x1, from: 'try0', to: 'plane', fmt: (v, l) => fmt2(v, l) },
    { id: 'x2', kind: 'slider', label: { es: 'Confianza x₂', en: 'Trust x₂' }, min: 0, max: 1, step: 0.05, value: EX.x2, from: 'try0', to: 'plane', fmt: (v, l) => fmt2(v, l) },
    { id: 'w1', kind: 'slider', label: { es: 'Peso w₁', en: 'Weight w₁' }, min: -4, max: 4, step: 0.1, value: BASE.w1, from: 'try1', to: 'step-limit', fmt: (v, l) => fmt1(v, l) },
    { id: 'w2', kind: 'slider', label: { es: 'Peso w₂', en: 'Weight w₂' }, min: -4, max: 4, step: 0.1, value: BASE.w2, from: 'try1', to: 'step-limit', fmt: (v, l) => fmt1(v, l) },
    { id: 'b', kind: 'slider', label: { es: 'Sesgo b', en: 'Bias b' }, min: -3, max: 3, step: 0.1, value: BASE.b, from: 'try1', to: 'step-limit', fmt: (v, l) => fmt1(v, l) },
    { id: 'step2', kind: 'button', primary: true, label: { es: 'Un paso de aprendizaje', en: 'One learning step' }, from: 'try2', to: 'converge' },
    { id: 'run2', kind: 'button', label: { es: 'Correr hasta acertar', en: 'Run until correct' }, from: 'try2', to: 'converge' },
    { id: 'reset2', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try2', to: 'converge' },
  ],

  init(S) { S.st.perc = newPerc(); S.st.probe = null; S.st.run = null; },

  action(S, id) {
    const pv = percOf(S);
    if (id === 'step2') { const i = nextIdx(pv); if (i >= 0) learn(pv, i, S.clock); }
    else if (id === 'run2') S.st.run = { acc: 0.3 };
    else if (id === 'reset2') { S.st.perc = newPerc(); S.st.run = null; }
  },

  pointer(S, e) {
    if (e.type !== 'down') return;
    const R_ = regions(S, 0.66), plot = planePlot(S, R_.main);
    if (S.between('try2', 'limits')) {
      const pv = percOf(S);
      let best = -1, bd = S.hitR * 1.3;
      wrongOf(pv.w1, pv.w2, pv.b).forEach((i) => { const dd = Math.hypot(plot.X(DATA[i].x) - e.x, plot.Y(DATA[i].y) - e.y); if (dd < bd) { bd = dd; best = i; } });
      if (best >= 0) learn(pv, best, S.clock);
    } else if (S.between('try1', 'rosenblatt') && plot.inside(e.x, e.y)) {
      S.st.probe = { x: clamp(plot.iX(e.x), 0, 1), y: clamp(plot.iY(e.y), 0, 1) };
    }
  },

  cursor(S, x, y) {
    const R_ = regions(S, 0.66), plot = planePlot(S, R_.main);
    if (S.between('try2', 'limits')) {
      const pv = percOf(S);
      return wrongOf(pv.w1, pv.w2, pv.b).some((i) => Math.hypot(plot.X(DATA[i].x) - x, plot.Y(DATA[i].y) - y) < S.hitR * 1.3) ? 'pointer' : undefined;
    }
    if (S.between('try1', 'rosenblatt') && plot.inside(x, y)) return 'crosshair';
    return undefined;
  },

  // El estado interactivo avanza siempre, aunque el escenario no se vea; render() solo dibuja.
  update(S) {
    // turno 1: apagar la neurona moviendo las entradas
    if (S.between('try0', 'plane')) {
      const z = zOf(BASE.w1, BASE.w2, BASE.b, S.p.x1 ?? EX.x1, S.p.x2 ?? EX.x2);
      if (fire(z) === 0) S.complete('off');
    }
    // turno 2: separar los dos grupos con los controles
    if (S.between('try1', 'step-limit')) { const q = rawParams(S); if (hitsOf(q.w1, q.w2, q.b) === N) S.complete('sep'); }
    // turno 3: la regla del perceptrón
    const pv = percOf(S), run = S.st.run as { acc: number } | null;
    if (run) {
      run.acc += S.dt;
      while (run.acc >= 0.5) {
        run.acc -= 0.5;
        const i = nextIdx(pv);
        if (i < 0) { S.st.run = null; break; }
        learn(pv, i, S.clock);
      }
      if (nextIdx(pv) < 0) S.st.run = null;
    }
    if (S.between('try2', 'converge') && nextIdx(pv) < 0 && pv.steps > 0) S.complete('learn');
  },

  render(S) {
    const R_ = regions(S, 0.66), D = R_.all, d = S.d;
    const phases: [string | null, string | null, () => void][] = [
      [null, 'bio', () => drawHook(S, D)],
      ['bio', 'inputs', () => drawBioMp(S, D)],
      ['inputs', 'plane', () => drawDiagram(S, D, S.between('try0', 'plane') ? { x1: S.p.x1 ?? EX.x1, x2: S.p.x2 ?? EX.x2 } : { x1: EX.x1, x2: EX.x2 })],
      ['plane', 'rosenblatt', () => drawPlaneStage(S, R_)],
      ['rosenblatt', 'rule', () => drawRosenblatt(S, D)],
      ['rule', 'limits', () => drawPerceptronStage(S, R_)],
      ['limits', 'real', () => drawLimits(S, D)],
      ['real', 'hype', () => drawReal(S, D)],
      ['hype', 'recap', () => drawHype(S, D)],
      ['recap', 'bridge', () => drawRecap(S, D)],
      ['bridge', null, () => drawBridge(S, D)],
    ];
    for (const [a, b, fn] of phases) {
      const al = (a ? S.at(a, 0, 0.8) : 1) * (1 - (b ? S.at(b, 0, 0.8) : 0));
      if (al > 0.004) d.withAlpha(al, fn);
    }
  },
});

export default scene;

// ═════════════════════════════════════════════════════════════════════════
// El plano: de «plane» a «sharp»
// ═════════════════════════════════════════════════════════════════════════
function drawPlaneStage(S: Frame, R_: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const prm = planeParams(S);
  const k = sharpK(S), blend = S.at('sigmoid', 0.2, 2.2, 'io');
  const tb = tau(S, 'boundary'), td = tau(S, 'data'), tp = tau(S, 'plane');
  const spec: PlaneSpec = {
    p: prm, blend, k,
    tint: S.on('boundary') ? tr(tb, 0.74, 0.88) : 0,
    line: S.on('boundary') ? tr(tb, 0.3, 0.5, 'io') : 0,
    points: S.on('data') ? clamp((td - 0.12) / 0.5, 0, 1) * N : 0,
    rings: S.on('data') ? tr(td, 0.82, 0.92) * (1 - S.at('step-limit', 0, 0.5)) : 0,
    example: (S.on('plane') ? tr(tp, 0.45, 0.58) : 0) * (1 - S.at('data', 0, 0.6)),
    probe: S.between('try1', 'rosenblatt') ? (S.st.probe as { x: number; y: number } | null) : null,
    arrow: S.on('shift') ? S.at('shift', 0.1, 0.9) : 0,
    zLabel: S.between('boundary', 'data') ? tr(tb, 0.5, 0.62) : 0,
    sides: S.between('boundary', 'data') ? tr(tb, 0.8, 0.92) : 0,
    pulse: S.is('plane'),
  };
  const plot = drawPlane(S, R_.main, spec);
  // el origen, cuando el sesgo vale cero
  if (S.is('shift') && Math.abs(prm.b) < 0.02) {
    d.circle(plot.X(0), plot.Y(0), 6 * u, { fill: p.stage, stroke: p.ink, lw: 2.5 });
    tag(S, S.l('origen', 'origin'), plot.X(0) + 36 * u, plot.Y(0) - 14 * u, { size: 12 });
  }
  asidePlane(S, R_.aside, prm, blend, k);
}

function legend(S: Frame, x: number, y: number, w: number, row: boolean): number {
  const { d, pal: p } = S, u = S.u, dt = tone(S, 'dat'), er = tone(S, 'err');
  const items = [{ cls: 0, t: S.l('legítimo · 0', 'legitimate · 0') }, { cls: 1, t: S.l('sospechoso · 1', 'suspicious · 1') }];
  items.forEach((it, i) => {
    const px = row ? x + (i * w) / 2 + 8 * u : x + 8 * u, py = row ? y + 9 * u : y + 9 * u + i * 21 * u;
    if (it.cls === 0) d.circle(px, py, 5 * u, { fill: dt.c, stroke: p.stage, lw: 1.5 });
    else { d.line(px - 5 * u, py - 5 * u, px + 5 * u, py + 5 * u, er.c, 2.6); d.line(px - 5 * u, py + 5 * u, px + 5 * u, py - 5 * u, er.c, 2.6); }
    txt(S, it.t, px + 12 * u, py, { size: 13, weight: 600, color: p.ink2, base: 'middle' });
  });
  return row ? 20 * u : 42 * u;
}

function asidePlane(S: Frame, A: Rect, prm: Params, blend: number, k: number) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const inPlane = S.between('plane', 'boundary');
  const a = S.reveal('plane', 0.8, 0.6);
  const act = S.on('step-limit');
  const gate = S.between('try1', 'step-limit');
  let y = A.y;
  d.withAlpha(a, () => {
    if (inPlane) {
      statBlock(S, { x: A.x, y, w: A.w, h: A.h }, [{ l: `${S.l('enlaces', 'links')} x₁`, v: num(S, EX.x1, 2), t: 'sig' }, { l: `${S.l('confianza', 'trust')} x₂`, v: num(S, EX.x2, 2), t: 'sig' }]);
      return;
    }
    if (S.on('data') && !(port && act)) y += legend(S, A.x, y, A.w, port) + 8 * u;
    const sc = S.on('sharp') ? k : 1;
    const items: { l: string; v: string; t?: 'w' | 'dat' | 'err' | 'ink' }[] = [
      { l: 'w₁', v: num(S, prm.w1 * sc, 2), t: 'w' }, { l: 'w₂', v: num(S, prm.w2 * sc, 2), t: 'w' }, { l: S.l('sesgo b', 'bias b'), v: num(S, prm.b * sc, 2), t: 'w' },
    ];
    if (S.on('sharp')) items.push({ l: S.l('factor k', 'factor k'), v: `×${num(S, k, 2)}`, t: 'dat' });
    const hits = hitsOf(prm.w1, prm.w2, prm.b);
    if (S.on('data') && !act) items.push({ l: S.l('aciertos', 'hits'), v: `${hits}/${N}`, t: hits === N ? 'dat' : 'ink' });
    y += statBlock(S, { x: A.x, y, w: A.w, h: A.h }, items, { size: port ? 19 : 21 }) + 8 * u;
    if (!S.on('data')) {
      // ecuación de la frontera
      txt(S, 'w₁x₁ + w₂x₂ + b = 0', A.x, y + 4 * u, { size: port ? 15 : 16, weight: 700, font: 'mono', color: p.ink, base: 'top', a: tr(tau(S, 'boundary'), 0.5, 0.62) });
      return;
    }
    if (act) {
      const hh = Math.max(60 * u, A.y + A.h - y);
      const h = port ? Math.min(hh, 96 * u) : Math.min(hh, 170 * u);
      const probe = S.st.probe as { x: number; y: number } | null;
      const zEx = probe && gate ? zOf(prm.w1, prm.w2, prm.b, probe.x, probe.y) : zOf(prm.w1, prm.w2, prm.b, EX.x1, EX.x2);
      drawAct(S, { x: A.x, y, w: A.w, h }, { blend, k, z: zEx, flat: S.between('step-limit', 'sigmoid') ? tr(tau(S, 'step-limit'), 0.55, 0.7) : 0 });
      return;
    }
    // mensaje del turno
    if (gate) {
      const probe = S.st.probe as { x: number; y: number } | null;
      const done = hits === N;
      const msg = done ? S.l(`Separadas: las ${N} marcas del lado correcto.`, `Separated: all ${N} marks on the right side.`) : S.l('Las marcas con aro están del lado equivocado.', 'Ringed marks are on the wrong side.');
      txt(S, msg, A.x, y, { size: 13, weight: done ? 800 : 600, color: done ? tone(S, 'dat').ink : p.ink2, base: 'top', w: A.w });
      if (done && !port) neu(S, A.x + A.w - 78 * u, A.y + A.h - 62 * u, { scale: 3, mood: 'happy' });
      if (probe && !port) {
        const z = zOf(prm.w1, prm.w2, prm.b, probe.x, probe.y);
        txt(S, S.l(`Tu correo de prueba: z = ${fmt2(z, 'es')}, sale ${fire(z)}.`, `Your test email: z = ${fmt2(z, 'en')}, output ${fire(z)}.`), A.x, y + 44 * u, { size: 13, weight: 600, color: p.ink2, base: 'top', w: A.w });
      }
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════
// El perceptrón: de «rule» a «converge»
// ═════════════════════════════════════════════════════════════════════════
function drawPerceptronStage(S: Frame, R_: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const pv = percOf(S);
  const interactive = S.on('try2');
  const useRef = S.on('converge') && !(S.done.has('learn') || pv.steps >= 4);
  let prm: Params, ghost: Params | null = null, hot = -1, hist: number[], steps: number;
  if (!interactive) {
    // narración: un primer paso con números reales
    const q = updQ(S);
    prm = { w1: lerp(P0.w1, PERC_STEP1.to.w1, q), w2: lerp(P0.w2, PERC_STEP1.to.w2, q), b: lerp(P0.b, PERC_STEP1.to.b, q) };
    ghost = q > 0.02 ? { ...P0 } : null; hot = S.on('update') ? PERC_STEP1.idx : -1;
    hist = [10, PERC_STEP1.hits]; steps = q > 0.98 ? 1 : 0;
  } else if (useRef) {
    prm = { w1: PERC_REF.w1, w2: PERC_REF.w2, b: PERC_REF.b }; hist = PERC_REF.hist; steps = PERC_REF.steps;
  } else {
    const sh = percShown(S, pv); prm = sh.p; ghost = sh.ghost; hot = sh.hot; hist = pv.hist; steps = pv.steps;
  }
  const spec: PlaneSpec = {
    p: prm, ghost, blend: 0, k: 1, tint: S.at('rule', 0.2, 1.2), line: S.at('rule', 0, 1.0, 'io'),
    points: N, rings: S.at('rule', 0.6, 1.2), arrow: S.at('rule', 0.6, 1.4), hot,
  };
  drawPlane(S, R_.main, spec);
  asidePerceptron(S, R_.aside, prm, hist, steps, interactive, useRef);
  void d; void p; void u;
}

function asidePerceptron(S: Frame, A: Rect, prm: Params, hist: number[], steps: number, interactive: boolean, useRef: boolean) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const wt = tone(S, 'w'), dt = tone(S, 'dat'), er = tone(S, 'err'), sg = tone(S, 'sig');
  const hits = hitsOf(prm.w1, prm.w2, prm.b);
  const a = S.reveal('rule', 0.5, 0.6);
  d.withAlpha(a, () => {
    let y = A.y;
    const sz = port ? 16 : 17, lh = (sz + 9) * u;
    const rule = () => {
      const parts1: [string, string, boolean?][] = [['w', wt.ink, true], [' ← ', p.ink2], ['w', wt.ink, true], [' + ', p.ink2], ['η', dt.ink, true], [' (', p.ink2], ['t − y', er.ink, true], [') ', p.ink2], ['x', sg.ink, true]];
      const parts2: [string, string, boolean?][] = [['b', wt.ink, true], [' ← ', p.ink2], ['b', wt.ink, true], [' + ', p.ink2], ['η', dt.ink, true], [' (', p.ink2], ['t − y', er.ink, true], [')', p.ink2]];
      [parts1, parts2].forEach((pp, i) => { let x = A.x; const size = fs(S, sz); pp.forEach(([t, c, b]) => { const w = d.measure(t, { size, weight: b ? 800 : 600, font: 'mono' }); d.text(t, x, y + i * lh + lh / 2, { size, weight: b ? 800 : 600, font: 'mono', color: c, base: 'middle' }); x += w; }); });
      y += lh * 2 + 8 * u;
    };
    if (!interactive && !S.on('update')) {
      // «rule»: la regla y qué es cada símbolo
      rule();
      const leg: [string, string][] = [['t', S.l('respuesta correcta', 'correct answer')], ['y', S.l('respuesta de la neurona', 'neuron’s answer')], ['η', S.l('tasa de aprendizaje', 'learning rate')], ['x', S.l('entradas del ejemplo', 'inputs of the example')]];
      const n = port ? 2 : 1;
      leg.forEach(([s, t], i) => { const lx = A.x + (i % n) * (A.w / n), ly = y + Math.floor(i / n) * 20 * u; txt(S, s, lx, ly, { size: 13, weight: 800, font: 'mono', color: p.ink, base: 'top' }); txt(S, t, lx + 18 * u, ly, { size: 13, weight: 600, color: p.ink2, base: 'top', w: A.w / n - 22 * u }); });
      return;
    }
    if (!interactive) {
      // «update»: el cálculo del primer paso
      const q = updQ(S), P1 = PERC_STEP1;
      const ex = DATA[P1.idx];
      txt(S, S.l(`Ejemplo (${fmt2(ex.x, 'es')}; ${fmt2(ex.y, 'es')}): debía dar ${ex.t}, dio 0.`, `Example (${fmt2(ex.x, 'en')}, ${fmt2(ex.y, 'en')}): should be ${ex.t}, got 0.`), A.x, y, { size: 13, weight: 700, color: p.ink, base: 'top', w: A.w });
      y += (port ? 20 : 40) * u;
      txt(S, S.l(`t − y = ${ex.t} − 0 = +1`, `t − y = ${ex.t} − 0 = +1`), A.x, y, { size: 14, weight: 800, font: 'mono', color: er.ink, base: 'top' });
      y += 26 * u;
      const rows: { l: string; a: number; b: number }[] = [{ l: 'w₁', a: P1.from.w1, b: P1.to.w1 }, { l: 'w₂', a: P1.from.w2, b: P1.to.w2 }, { l: 'b', a: P1.from.b, b: P1.to.b }];
      if (port) {
        const cw = A.w / 3;
        rows.forEach((r, i) => { txt(S, r.l, A.x + i * cw, y, { size: 12, weight: 700, color: p.mute, base: 'top' }); txt(S, `${num(S, r.a, 2)}→${num(S, lerp(r.a, r.b, q), 2)}`, A.x + i * cw, y + 16 * u, { size: 14, weight: 800, font: 'mono', color: wt.ink, base: 'top' }); });
        y += 40 * u;
      } else {
        rows.forEach((r) => { txt(S, r.l, A.x, y, { size: 14, weight: 700, color: p.mute, base: 'top' }); txt(S, `${num(S, r.a, 2)} → ${num(S, lerp(r.a, r.b, q), 2)}`, A.x + 34 * u, y, { size: 16, weight: 800, font: 'mono', color: wt.ink, base: 'top' }); y += 26 * u; });
        y += 6 * u;
      }
      txt(S, `${S.l('aciertos', 'hits')} ${10} → ${Math.round(lerp(10, P1.hits, q))}`, A.x, y, { size: 14, weight: 800, font: 'mono', color: dt.ink, base: 'top' });
      return;
    }
    // «try2» y «converge»
    if (S.is('converge')) {
      const h = Math.min(A.h - 60 * u, port ? 80 * u : 170 * u);
      statBlock(S, { x: A.x, y, w: A.w, h: 60 * u }, [{ l: S.l('pasos', 'steps'), v: String(steps), t: 'ink' }, { l: S.l('aciertos', 'hits'), v: `${hits}/${N}`, t: hits === N ? 'dat' : 'ink' }], { row: true, size: 20 });
      drawHist(S, { x: A.x, y: y + 52 * u, w: A.w, h }, hist, 1);
      if (useRef) txt(S, S.l('(recorrido de referencia)', '(reference run)'), A.x, A.y + A.h, { size: 12, color: p.mute, base: 'bottom' });
      return;
    }
    const err = N - hits;
    const items = [{ l: 'w₁', v: num(S, prm.w1, 2), t: 'w' as const }, { l: 'w₂', v: num(S, prm.w2, 2), t: 'w' as const }, { l: 'b', v: num(S, prm.b, 2), t: 'w' as const }, { l: S.l('errores', 'errors'), v: String(err), t: err === 0 ? ('dat' as const) : ('err' as const) }, { l: S.l('pasos', 'steps'), v: String(steps), t: 'ink' as const }];
    y += statBlock(S, { x: A.x, y, w: A.w, h: A.h }, items, { size: port ? 17 : 20 }) + 8 * u;
    const done = err === 0;
    const msg = done ? S.l(`Sin errores tras ${steps} pasos.`, `No errors after ${steps} steps.`) : steps === 0 ? S.l('Aprende de un error a la vez. Toca un punto con aro, o pulsa el botón.', 'It learns from one error at a time. Tap a ringed point, or press the button.') : S.l('Cada paso corrige un error; a veces estropea otro.', 'Each step fixes one error; sometimes it breaks another.');
    txt(S, msg, A.x, y, { size: 13, weight: done ? 800 : 600, color: done ? dt.ink : p.ink2, base: 'top', w: A.w });
    void alpha; void er;
  });
}
