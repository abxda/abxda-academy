// Escena: Descenso del gradiente. Una curva de error con niebla, la pendiente, el paso y la tasa de aprendizaje,
// dos turnos interactivos, el paisaje de dos pesos, la escala y los valles múltiples.
import {
  Plot, alpha, badge, box, callout, clamp, ease, inset, lerp, link, neu, regions, split, tone, readout,
  type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';

// ── matemáticas de la lección ─────────────────────────────────────────────
const WS = 2.4, W0 = -0.6;                              // peso óptimo y punto de partida
const L = (w: number) => 0.5 * (w - WS) ** 2 + 0.2;     // error (parábola, curvatura h = 1)
const dL = (w: number) => w - WS;
const traj = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dL(a[i])); return a; };
const MAIN_PATH = traj(W0, 0.5, 8);

const R = (w: number) => 0.08 * w ** 4 - 0.6 * w ** 2 + 0.25 * w + 2.0;   // paisaje irregular con dos valles
const dR = (w: number) => 0.32 * w ** 3 - 1.2 * w + 0.25;
const rpath = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dR(a[i])); return a; };
const PATH_A = rpath(-0.9, 0.12, 40), PATH_B = rpath(0.9, 0.12, 40);

const C2 = [1.2, -0.4], ANG = 0.5, H2 = [1, 7];         // paisaje 2D: cuenco alargado y girado
const rot = (x: number, y: number) => { const dx = x - C2[0], dy = y - C2[1]; return [dx * Math.cos(ANG) + dy * Math.sin(ANG), -dx * Math.sin(ANG) + dy * Math.cos(ANG)]; };
const L2 = (x: number, y: number) => { const [u, v] = rot(x, y); return 0.5 * (H2[0] * u * u + H2[1] * v * v); };
const g2 = (x: number, y: number): [number, number] => { const [u, v] = rot(x, y); const gu = H2[0] * u, gv = H2[1] * v; return [gu * Math.cos(ANG) - gv * Math.sin(ANG), gu * Math.sin(ANG) + gv * Math.cos(ANG)]; };
const path2 = (() => { const a: [number, number][] = [[-1.0, 0.0]]; for (let i = 0; i < 16; i++) { const [x, y] = a[i], [gx, gy] = g2(x, y); a.push([x - 0.2 * gx, y - 0.2 * gy]); } return a; })();

const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── estado interactivo ────────────────────────────────────────────────────
interface Int { w: number; shown: number; steps: number; hist: number[]; run: null | { left: number; acc: number }; verdict: string; eta: number; conv: number }
const newInt = (): Int => ({ w: W0, shown: W0, steps: 0, hist: [L(W0)], run: null, verdict: '', eta: 0.5, conv: -1 });
const intOf = (S: Frame, key: 'i1' | 'i2'): Int => (S.st[key] ??= newInt());

function doStep(S: Frame, st: Int, eta: number) {
  st.w = st.w - eta * dL(st.w); st.steps++; st.hist.push(L(st.w)); st.eta = eta;
  if (st.conv < 0 && Math.abs(st.w - WS) < 0.08) st.conv = st.steps;
}

// ── la escena ─────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'step', kind: 'button', primary: true, label: { es: 'Dar un paso', en: 'Take a step' }, from: 'try1', to: 'lr-intro' },
    { id: 'reset', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try1', to: 'lr-intro' },
    { id: 'eta', kind: 'slider', label: { es: 'Tasa de aprendizaje η', en: 'Learning rate η' }, min: 0.04, max: 2.4, step: 0.02, value: 0.5, from: 'try2', to: 'land2d', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { id: 'run', kind: 'button', primary: true, label: { es: 'Correr 15 pasos', en: 'Run 15 steps' }, from: 'try2', to: 'land2d' },
    { id: 'reset2', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try2', to: 'land2d' },
  ],

  action(S, id) {
    const key = S.on('try2') ? 'i2' : 'i1', st = intOf(S, key);
    if (id === 'step') doStep(S, st, 0.5);
    else if (id === 'reset' || id === 'reset2') S.st[key] = newInt();
    else if (id === 'run') { const e = S.p.eta ?? 0.5; S.st[key] = newInt(); const n = intOf(S, key); n.eta = e; n.run = { left: 15, acc: 0.3 }; }
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    for (const [key, active] of [['i1', S.between('try1', 'lr-intro')], ['i2', S.between('try2', 'land2d')]] as const) {
      if (!active) continue;
      const st = intOf(S, key);
      if (st.run) {
        st.run.acc += S.dt;
        while (st.run.acc >= 0.32 && st.run.left > 0) { doStep(S, st, st.eta); st.run.left--; st.run.acc -= 0.32; }
        if (st.run.left === 0) {
          st.verdict = st.eta > 2 ? 'diverge' : st.eta > 1 ? 'osc' : st.conv > 0 && st.conv <= 10 ? 'ok' : 'slow';
          st.run = null;
          if (st.verdict === 'ok') S.complete('lr');
        }
      }
      if (key === 'i1' && st.steps >= 4) S.complete('steps');
      st.shown += (st.w - st.shown) * (1 - Math.exp(-S.dt * 12));
    }
  },

  render(S) {
    const { d } = S, p = S.pal, u = S.u;
    const R_ = regions(S, 0.68);

    // ───────── 1D: de hook a try2 ─────────
    const to2d = S.at('land2d', 0, 0.9);
    const a1D = 1 - to2d;
    if (a1D > 0) d.withAlpha(a1D, () => draw1D(S, R_));

    // ───────── 2D ─────────
    const toScale = S.at('scale', 0, 0.9);
    if (to2d > 0 && toScale < 1) d.withAlpha(to2d * (1 - toScale), () => draw2D(S, R_));
    // ───────── escala ─────────
    const toRug = S.at('rugged', 0, 0.9);
    if (toScale > 0 && toRug < 1) d.withAlpha(toScale * (1 - toRug), () => drawScale(S, R_));
    // ───────── valles múltiples ─────────
    const toRecap = S.at('recap', 0, 0.9);
    if (toRug > 0 && toRecap < 1) d.withAlpha(toRug * (1 - toRecap), () => drawRugged(S, R_));
    // ───────── bucle y puente ─────────
    const toBridge = S.at('bridge', 0, 0.9);
    if (toRecap > 0 && toBridge < 1) d.withAlpha(toRecap * (1 - toBridge), () => drawRecap(S, R_));
    if (toBridge > 0) d.withAlpha(toBridge, () => drawBridge(S));
    void p; void u;
  },
});

// ═════════════════════════════════════════════════════════════════════════
// 1D: la curva, la niebla, la pendiente y los pasos
// ═════════════════════════════════════════════════════════════════════════
function draw1D(S: Frame, R_: { main: Rect; aside: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const plot = new Plot(S, R_.main, { xr: [-1.5, 6.3], yr: [0, 7], xLabel: S.l('peso w', 'weight w'), yLabel: S.l('error', 'loss'), xTicks: [0, 2, 4, 6], yTicks: [0, 2, 4, 6], tickFmt: (v) => String(v) });
  plot.axes(S.reveal('hook', 0, 0.8));

  // ¿qué peso se muestra? narración, o estado interactivo
  const inT1 = S.between('try1', 'lr-intro'), inT2 = S.between('try2', 'land2d');
  const inDemo = S.between('lr-intro', 'try2');
  let w = W0, kShow = 0;
  if (inT1 || inT2) {
    const st = intOf(S, inT2 ? 'i2' : 'i1');
    w = st.shown;
  } else if (inDemo) {
    w = W0;
  } else {
    // narración: un paso, luego varios
    if (!S.on('step')) kShow = 0;
    else if (!S.on('repeat')) kShow = S.at('step', 1.0, 2.1, 'lin');
    else kShow = 1 + clamp((S.since('repeat') - 0.5) / 0.5, 0, 6.999);
    const i = Math.floor(kShow);
    w = lerp(MAIN_PATH[i], MAIN_PATH[Math.min(i + 1, MAIN_PATH.length - 1)], ease.io(kShow - i));
  }

  const foggy = !S.on('map') ? 1 : 1 - S.at('map', 0, 1.8);
  const curveA = S.reveal('hook', 0.3, 0.7);
  const showCurve = !inDemo || true;

  // curva de error
  d.withAlpha(curveA, () => plot.curve(L, 'ink', 3));

  // niebla: todo se oculta salvo una ventana alrededor del peso actual
  if (foggy > 0.01 && !inDemo) {
    const r = plot.r, cx = plot.X(w), rad = r.w * 0.11;
    for (let x = r.x; x < r.x + r.w; x += 5) {
      const dist = Math.abs(x + 2.5 - cx), a = foggy * smooth((dist - rad) / (rad * 0.8)) * 0.97;
      if (a > 0.01) d.dither(x, r.y, 5, r.h, p.stage, a, 2);
    }
  }

  // trayectoria dejada atrás
  const trail: number[] = [];
  if (inT1 || inT2) { const st = intOf(S, inT2 ? 'i2' : 'i1'); st.hist.forEach((_, i) => i < st.hist.length - 1 && trail.push(i)); const pts = st.hist.length; void pts; }
  const wp: number[] = [];
  if (inT1 || inT2) {
    const st = intOf(S, inT2 ? 'i2' : 'i1'); let ww = W0; wp.push(ww);
    for (let i = 0; i < st.steps; i++) { ww = ww - st.eta * dL(ww); wp.push(ww); }
  } else if (S.on('step') && !inDemo) {
    const upto = Math.floor(kShow);
    for (let i = 0; i <= upto; i++) wp.push(MAIN_PATH[i]);
  }
  if (!inDemo) {
    for (let i = 0; i < wp.length - 1; i++) plot.line(wp[i], L(wp[i]), wp[i + 1], L(wp[i + 1]), 'w', 1.5, [4, 4], 0.7);
    wp.forEach((x, i) => { if (i < wp.length - 1 || !(inT1 || inT2)) plot.dot(x, L(x), 3.2, 'w', { a: 0.55 }); });
  }

  // demostraciones con tres tasas
  let demo: { w: number; eta: number | null } | null = null;
  if (inDemo) { demo = drawDemos(S, plot); w = demo.w; }

  // pelota = el peso actual
  const showBall = S.reveal('hook', 0.6, 0.6);
  if (!inDemo && showBall > 0) {
    const sx = plot.X(w), sy = plot.Y(L(w));
    d.withAlpha(showBall, () => {
      // pendiente: tangente
      const slopeA = S.reveal('slope', 0.3, 0.7);
      if (S.on('slope') && slopeA > 0) {
        const m = dL(w), tx = 54 * u * slopeA;
        const ang = Math.atan2(-m * (plot.r.h / 7) , (plot.r.w / 7.8));
        d.line(sx - Math.cos(ang) * tx, sy - Math.sin(ang) * tx, sx + Math.cos(ang) * tx, sy + Math.sin(ang) * tx, tone(S, 'err').c, 2.5);
      }
      // gradiente (cuesta arriba) y paso (contrario)
      const gA = S.between('gradient', 'step') ? S.reveal('gradient', 0.4, 0.6) : 0;
      if (gA > 0) { const dir = Math.sign(dL(w)) || 1; d.arrow(sx, sy - 22 * u, sx + dir * 70 * u * gA, sy - 22 * u, tone(S, 'err').c, 3, 10); d.text(S.l('gradiente', 'gradient'), sx + dir * 35 * u, sy - 32 * u, { size: 12, weight: 700, color: tone(S, 'err').ink, align: 'center', base: 'bottom', halo: p.stage }); }
      if (S.between('step', 'map') && !(S.on('repeat'))) {
        const sA = S.at('step', 0.2, 1.0, 'out');
        const dir = -Math.sign(dL(W0)) || 1, len = Math.abs(0.5 * dL(W0)) * (plot.r.w / 7.8);
        if (sA > 0 && kShow < 0.98) d.arrow(plot.X(W0), plot.Y(L(W0)) - 22 * u, plot.X(W0) + dir * len * sA, plot.Y(L(W0)) - 22 * u, tone(S, 'w').c, 3, 10);
      }
      d.circle(sx, sy, 9 * u, { fill: tone(S, 'w').c, stroke: p.stage, lw: 2.5 });
    });
  }

  // niebla: etiquetas
  if (S.between('fog', 'slope') ) {
    const a = S.reveal('fog', 0.5, 0.5), sx = plot.X(W0), r = plot.r;
    d.withAlpha(a, () => {
      badge(S, S.l('lo que ves', 'what you see'), sx, plot.Y(L(W0)) - 56 * u, { tone: 'sig' });
      badge(S, S.l('lo que no ves', 'what you cannot see'), r.x + r.w * 0.72, r.y + r.h * 0.5, { tone: 'mute' });
    });
  }
  // la pregunta: ← ?  →
  if (S.between('question', 'slope')) {
    const a = S.reveal('question', 0.2, 0.5), sx = plot.X(W0), sy = plot.Y(L(W0)), pulse = 0.55 + 0.45 * Math.abs(Math.sin(S.clock * 3));
    d.withAlpha(a * pulse, () => { d.arrow(sx - 16 * u, sy + 30 * u, sx - 58 * u, sy + 30 * u, p.ink2, 3, 9); d.arrow(sx + 16 * u, sy + 30 * u, sx + 58 * u, sy + 30 * u, p.ink2, 3, 9); });
    d.withAlpha(a, () => d.text('?', sx, sy + 32 * u, { size: 22, weight: 800, color: p.ink, align: 'center', base: 'middle' }));
  }

  // fórmula de actualización
  if (S.between('step', 'lr-intro')) formula(S, R_.main, S.reveal('step', 0.1, 0.6));

  // Neu reacciona
  const mood = S.between('fog', 'slope') ? 'think' : S.on('map') && !S.on('try1') ? 'wow' : S.between('repeat', 'map') ? 'happy' : 'happy';
  if (S.between('fog', 'try1')) neu(S, R_.main.x + R_.main.w - 74 * u, R_.main.y + 4, { scale: Math.max(2, Math.round(2.6 * u)), mood: mood as any, a: S.reveal('fog', 0, 0.5) });

  // lectura numérica
  drawAside(S, R_.aside, w, { steps: inT1 || inT2 ? intOf(S, inT2 ? 'i2' : 'i1').steps : null, hist: (inT1 || inT2) ? intOf(S, inT2 ? 'i2' : 'i1').hist : (S.on('step') && !inDemo ? MAIN_PATH.slice(0, Math.floor(kShow) + 1).map(L) : []), eta: demo ? demo.eta : inT2 ? (S.p.eta ?? 0.5) : S.on('step') ? 0.5 : null, st: inT2 ? intOf(S, 'i2') : null, showSlope: S.on('slope') && !demo, showEta: S.on('step') && (!demo || demo.eta !== null), showErr: true, gate: S.between('try1', 'lr-intro') ? 'steps' : S.between('try2', 'land2d') ? 'lr' : null });
  void showCurve;
}

function formula(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), lr = tone(S, 'dat'), er = tone(S, 'err');
  const parts: [string, string, boolean?][] = [['w', wt.ink, true], [' ← ', p.ink2], ['w', wt.ink, true], [' − ', p.ink2], ['η', lr.ink, true], [' · ', p.ink2], [S.l('pendiente', 'slope'), er.ink, true]];
  const size = 20; let total = 0;
  const widths = parts.map(([t]) => d.measure(t, { size, weight: 700, font: 'mono' })); widths.forEach((w) => (total += w));
  const x0 = r.x + r.w / 2 - total / 2, y = r.y + 34 * u;
  d.withAlpha(a, () => {
    d.rect(x0 - 14 * u, y - 20 * u, total + 28 * u, 40 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    let x = x0; parts.forEach(([t, c], i) => { d.text(t, x, y, { size, weight: 700, font: 'mono', color: c, base: 'middle' }); x += widths[i]; });
  });
}

function drawAside(S: Frame, r: Rect, w: number, o: { steps: number | null; hist: number[]; eta: number | null; st: Int | null; showSlope: boolean; showEta: boolean; showErr: boolean; gate: string | null }) {
  const { d, pal: p } = S, u = S.u, a = S.reveal('hook', 0.5, 0.6);
  const items: { l: string; v: string; t: 'w' | 'err' | 'dat' | 'ink'; on: boolean }[] = [
    { l: S.l('peso w', 'weight w'), v: S.n(w, 2), t: 'w', on: true },
    { l: S.l('error', 'loss'), v: S.n(L(w), 2), t: 'err', on: o.showErr },
    { l: S.l('pendiente', 'slope'), v: (dL(w) >= 0 ? '+' : '') + S.n(dL(w), 2), t: 'err', on: o.showSlope },
    { l: S.l('tasa η', 'rate η'), v: S.n(o.eta ?? 0.5, 2), t: 'dat', on: o.showEta },
    { l: S.l('pasos', 'steps'), v: String(o.steps ?? 0), t: 'ink', on: o.steps !== null },
  ];
  const vis = items.filter((i) => i.on);
  const cols = S.portrait ? 3 : 1, rowH = (S.portrait ? 52 : 56) * u, cw = r.w / cols;
  d.withAlpha(a, () => {
    vis.forEach((it, i) => { const cx = r.x + (i % cols) * cw, cy = r.y + Math.floor(i / cols) * rowH; readout(S, cx, cy + 14 * u, it.l, it.v, { tone: it.t, size: S.portrait ? 20 : 24 }); });
    // historial del error
    const used = Math.ceil(vis.length / cols) * rowH + 10 * u, hr: Rect = { x: r.x, y: r.y + used + 10 * u, w: Math.min(r.w, S.portrait ? r.w : r.w), h: r.h - used - 16 * u };
    if (o.hist.length > 0 && hr.h > 46 * u) {
      const hp = new Plot(S, hr, { xr: [0, 15], yr: [0, 7], pad: { l: 8, r: 6, t: 14, b: 12 } });
      d.text(S.l('error en cada paso', 'loss at each step'), hr.x, hr.y + 2, { size: 11, weight: 700, color: p.mute, base: 'top' });
      d.line(hp.r.x, hp.r.y + hp.r.h, hp.r.x + hp.r.w, hp.r.y + hp.r.h, p.line, 1);
      const pts: [number, number][] = o.hist.map((v, i) => [hp.X(i), hp.Y(v)]);
      d.polyline(pts, tone(S, 'err').c, 2);
      pts.forEach(([x, y]) => d.circle(x, y, 2.5 * u, { fill: tone(S, 'err').c }));
    }
    // veredicto del segundo turno
    if (o.st?.verdict) {
      const v = o.st.verdict, msg = v === 'ok' ? S.l(`Llegó en ${o.st.conv} pasos. Sin oscilar.`, `Reached it in ${o.st.conv} steps. No oscillation.`) : v === 'slow' ? S.l('Muy lenta: aún lejos del fondo.', 'Too slow: still far from the bottom.') : v === 'osc' ? S.l('Oscila: se pasa de largo en cada paso.', 'It oscillates: it overshoots at every step.') : S.l('Diverge: el error crece.', 'It diverges: the error grows.');
      const t = tone(S, v === 'ok' ? 'dat' : 'err');
      d.text(msg, r.x, r.y + r.h - 4, { size: 13, weight: 700, color: t.ink, w: r.w, base: 'bottom' });
    }
  });
}

// ── tres tasas de aprendizaje, en secuencia ──────────────────────────────
function drawDemos(S: Frame, plot: Plot): { w: number; eta: number | null } {
  const { d, pal: p } = S;
  const small = traj(W0, 0.06, 12), osc = traj(W0, 1.7, 9), div = traj(W0, 2.08, 5), good = traj(W0, 0.7, 5);
  const show = (path: number[], k: number, t: 'w' | 'err' | 'dat', label: string, sub: string) => {
    const n = Math.floor(k);
    for (let i = 0; i < n; i++) plot.line(path[i], L(path[i]), path[i + 1], L(path[i + 1]), t, 2, [5, 4], 0.9);
    for (let i = 0; i <= n; i++) plot.dot(path[i], L(path[i]), 3.6, t);
    const cur = path[Math.min(n, path.length - 1)];
    plot.dot(cur, L(cur), 7, t);
    const r = plot.r;
    d.text(label, r.x + r.w - 8, r.y + 8, { size: 15, weight: 800, color: tone(S, t).ink, align: 'right', base: 'top', halo: p.stage });
    d.text(sub, r.x + r.w - 8, r.y + 30, { size: 12, weight: 600, color: p.ink2, align: 'right', base: 'top', halo: p.stage });
  };
  const E = (x: number) => S.n(x, 2);
  const upto = (path: number[], k: number) => path[Math.min(Math.floor(k), path.length - 1)];
  if (S.on('lr-small') && !S.on('lr-big')) { const k = clamp(S.since('lr-small') / 0.35, 0, 12); show(small, k, 'w', `η = ${E(0.06)}`, S.l('lenta: 12 pasos y aún lejos', 'slow: 12 steps and still far')); return { w: upto(small, k), eta: 0.06 }; }
  if (S.on('lr-big') && !S.on('lr-good')) {
    const t = S.since('lr-big');
    if (t < 3.6) { const k = clamp(t / 0.4, 0, 9); show(osc, k, 'err', `η = ${E(1.7)}`, S.l('oscila: se pasa de largo', 'oscillates: overshoots')); return { w: upto(osc, k), eta: 1.7 }; }
    const k = clamp((t - 3.6) / 0.6, 0, 5); show(div, k, 'err', `η = ${E(2.08)}`, S.l('diverge: el error crece', 'diverges: the loss grows')); return { w: upto(div, k), eta: 2.08 };
  }
  if (S.on('lr-good')) { const k = clamp(S.since('lr-good') / 0.5, 0, 5); show(good, k, 'dat', `η = ${E(0.7)}`, S.l('rápida y sin saltar de más', 'fast, without overshooting')); return { w: upto(good, k), eta: 0.7 }; }
  // lr-intro: las tres, tenues
  const t = S.reveal('lr-intro', 0.2, 0.7);
  d.withAlpha(t, () => { badge(S, `η = ${E(0.06)}`, plot.r.x + plot.r.w * 0.2, plot.r.y + 14, { tone: 'w' }); badge(S, `η = ${E(0.7)}`, plot.r.x + plot.r.w * 0.5, plot.r.y + 14, { tone: 'dat' }); badge(S, `η = ${E(2.08)}`, plot.r.x + plot.r.w * 0.8, plot.r.y + 14, { tone: 'err' }); });
  return { w: W0, eta: null };
}

// ═════════════════════════════════════════════════════════════════════════
// 2D: el paisaje de dos pesos
// ═════════════════════════════════════════════════════════════════════════
function draw2D(S: Frame, R_: { main: Rect; aside: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const asp = (R_.main.h - 44 * u) / Math.max(40, R_.main.w - 40 * u), yh = Math.max(1.8, 6.6 * asp / 2);
  const plot = new Plot(S, R_.main, { xr: [-2.2, 4.4], yr: [C2[1] - yh, C2[1] + yh], xLabel: S.l('peso w₁', 'weight w₁'), yLabel: S.l('peso w₂', 'weight w₂'), pad: { l: 30, b: 34 } });
  const a = S.reveal('land2d', 0.2, 0.8);
  d.withAlpha(a, () => {
    plot.heat((x, y) => L2(x, y), (v) => alpha(tone(S, 'err').c, 0.01 + 0.085 * Math.sqrt(clamp(v / 14))), [44, 30]);
    plot.contours(L2, [0.4, 1, 2, 3.5, 5.5, 8], 'mute', { lw: 1.2, res: 56 });
    plot.axes();
    plot.dot(C2[0], C2[1], 6, 'dat'); plot.label(S.l('mínimo', 'minimum'), C2[0] + 0.15, C2[1] - 0.35, 'dat', { size: 12, align: 'left' });
  });
  if (S.on('path2d')) {
    const k = S.at('path2d', 0.8, 5.6, 'lin') * 16, n = Math.floor(k);
    const start = path2[0], [gx, gy] = g2(start[0], start[1]), gl = Math.hypot(gx, gy);
    const aA = S.reveal('path2d', 0.2, 0.6);
    d.withAlpha(aA, () => {
      const L1 = 0.9; const sx = plot.X(start[0]), sy = plot.Y(start[1]);
      d.arrow(sx, sy, plot.X(start[0] + (gx / gl) * L1), plot.Y(start[1] + (gy / gl) * L1), tone(S, 'err').c, 3, 10);
      d.text(S.l('gradiente (⟂ a las curvas)', 'gradient (⟂ to the contours)'), plot.X(start[0] + (gx / gl) * L1) + 8, plot.Y(start[1] + (gy / gl) * L1) - 6, { size: 12, weight: 700, color: tone(S, 'err').ink, halo: p.stage });
    });
    for (let i = 0; i < n; i++) plot.line(path2[i][0], path2[i][1], path2[i + 1][0], path2[i + 1][1], 'w', 2.4);
    const f = k - n, cur: [number, number] = n < 16 ? [lerp(path2[n][0], path2[n + 1][0], f), lerp(path2[n][1], path2[n + 1][1], f)] : path2[16];
    if (n < 16 && n > 0) plot.line(path2[n][0], path2[n][1], cur[0], cur[1], 'w', 2.4);
    path2.slice(0, n + 1).forEach((q) => plot.dot(q[0], q[1], 3, 'w', { a: 0.6 }));
    plot.dot(cur[0], cur[1], 7, 'w');
  } else {
    plot.dot(path2[0][0], path2[0][1], 7, 'w', { a });
  }
  // lectura
  const items = [
    { l: S.l('pesos', 'weights'), v: '2', t: 'w' as const },
    { l: S.l('error', 'loss'), v: S.n(L2(...(S.on('path2d') ? (() => { const k = S.at('path2d', 0.8, 5.6, 'lin') * 16, n = Math.floor(k); return path2[Math.min(n, 16)]; })() : path2[0])), 2), t: 'err' as const },
  ];
  const r = R_.aside, cols = S.portrait ? 2 : 1;
  d.withAlpha(a, () => items.forEach((it, i) => readout(S, r.x + (i % cols) * (r.w / cols), r.y + Math.floor(i / cols) * 56 * u + 14 * u, it.l, it.v, { tone: it.t })));
  void inset;
}

// ═════════════════════════════════════════════════════════════════════════
// Escala: muchísimos pesos a la vez
// ═════════════════════════════════════════════════════════════════════════
function drawScale(S: Frame, R_: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R_.all;
  const cols = S.portrait ? 18 : 36, rows = S.portrait ? 16 : 14;
  const gw = r.w, gh = r.h * (S.portrait ? 0.62 : 0.66), cs = Math.min(gw / cols, gh / rows);
  const x0 = r.x + (gw - cs * cols) / 2, y0 = r.y + 6 * u;
  const prog = S.at('scale', 0.4, 6.5, 'io');
  const wt = tone(S, 'w');
  d.withAlpha(S.reveal('scale', 0, 0.6), () => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, h0 = hash2(k, 1), tgt = hash2(k, 2);
      const v = lerp(h0, tgt, smooth(prog * 1.2 - hash2(k, 3) * 0.4));
      d.rect(x0 + i * cs, y0 + j * cs, cs - 1.5, cs - 1.5, { fill: alpha(wt.c, 0.08 + 0.62 * v) });
    }
  });
  const ty = y0 + rows * cs + 22 * u;
  d.withAlpha(S.reveal('scale', 0.8, 0.6), () => {
    d.text(S.l('175 000 000 000', '175,000,000,000'), r.x + r.w / 2, ty, { size: Math.min(34, 20 + r.w / 30), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'top' });
    d.text(S.l('pesos en GPT-3, ajustados a la vez en cada paso', 'weights in GPT-3, adjusted at once on every step'), r.x + r.w / 2, ty + 46 * u, { size: 14, weight: 600, color: p.ink2, align: 'center', base: 'top' });
    d.text(S.l('(cada cuadro es un peso; aquí, una muestra)', '(each square is one weight; a sample here)'), r.x + r.w / 2, y0 + rows * cs + 4 * u, { size: 11, color: p.mute, align: 'center', base: 'top' });
  });
  neu(S, r.x + r.w - 76 * u, r.y + r.h - 62 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: 'wow', a: S.reveal('scale', 1.4, 0.5) });
}
const hash2 = (a: number, b: number) => { let h = (Math.imul(a + 1, 374761393) + Math.imul(b + 7, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ═════════════════════════════════════════════════════════════════════════
// Paisaje irregular: dos puntos de partida, dos valles
// ═════════════════════════════════════════════════════════════════════════
function drawRugged(S: Frame, R_: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const plot = new Plot(S, R_.all, { xr: [-3.2, 3.2], yr: [0, 5], xLabel: S.l('peso w', 'weight w'), yLabel: S.l('error', 'loss'), xTicks: [-2, 0, 2], yTicks: [0, 2, 4], tickFmt: (v) => String(v) });
  plot.axes(S.reveal('rugged', 0, 0.6));
  d.withAlpha(S.reveal('rugged', 0.2, 0.6), () => plot.curve(R, 'ink', 3));
  const k = S.at('rugged', 1.2, 7.0, 'lin') * 40, n = Math.floor(k), f = k - n;
  const draw = (path: number[], t: 'w' | 'lat', name: string) => {
    for (let i = 0; i < n; i++) plot.line(path[i], R(path[i]), path[i + 1], R(path[i + 1]), t, 2, [4, 3], 0.8);
    const cur = lerp(path[Math.min(n, 40)], path[Math.min(n + 1, 40)], f);
    plot.dot(cur, R(cur), 7.5, t);
    plot.label(name, cur, R(cur) + 0.5, t, { size: 14, base: 'bottom' });
    return { w: cur, e: R(cur) };
  };
  const A = draw(PATH_A, 'w', 'A'), B = draw(PATH_B, 'lat', 'B');
  if (S.at('rugged', 7.2, 8.0) > 0) d.withAlpha(S.at('rugged', 7.2, 8.0), () => {
    const r = plot.r;
    badge(S, `A · ${S.l('error', 'loss')} ${S.n(A.e, 2)}`, r.x + r.w * 0.2, r.y + 16, { tone: 'w' });
    badge(S, `B · ${S.l('error', 'loss')} ${S.n(B.e, 2)}`, r.x + r.w * 0.8, r.y + 16, { tone: 'lat' });
    d.text(S.l('Misma regla, otro punto de partida, otro valle.', 'Same rule, another starting point, another valley.'), r.x + r.w / 2, r.y + r.h - 6 * u, { size: 14, weight: 700, color: p.ink, align: 'center', base: 'bottom', halo: p.stage });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// El bucle y el puente
// ═════════════════════════════════════════════════════════════════════════
function drawRecap(S: Frame, R_: { all: Rect }) {
  const r = R_.all, u = S.u;
  const labels = [S.l('1 · Medir el error', '1 · Measure the error'), S.l('2 · Tantear la pendiente', '2 · Feel the slope'), S.l('3 · Avanzar al revés', '3 · Step the opposite way'), S.l('4 · Repetir', '4 · Repeat')];
  const tones = ['err', 'err', 'w', 'dat'] as const;
  const bw = Math.min(210 * u, S.portrait ? r.w - 20 : r.w * 0.34), bh = 56 * u;
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: r.x + (r.w - bw) / 2, y: r.y + 8 * u + i * (bh + (r.h - 4 * bh - 16 * u) / 3), w: bw, h: bh }))
    : [{ x: r.x + r.w * 0.5 - bw - 40 * u, y: r.y + r.h * 0.2, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 40 * u, y: r.y + r.h * 0.2, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 40 * u, y: r.y + r.h * 0.58, w: bw, h: bh }, { x: r.x + r.w * 0.5 - bw - 40 * u, y: r.y + r.h * 0.58, w: bw, h: bh }];
  const hot = Math.floor(S.clock / 1.1) % 4;
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.2 + i * 0.35, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, active: i === hot ? 1 : 0 }); });
  for (let i = 0; i < 4; i++) { const a = S.at('recap', 0.6 + i * 0.35, 1.0 + i * 0.35); if (a > 0) link(S, pos[i], pos[(i + 1) % 4], { tone: 'ink', progress: a }); }
  neu(S, r.x + r.w / 2 - 36 * u, r.y + r.h * 0.4 + (S.portrait ? 0 : 10 * u), { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 1.8, 0.5) });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  neu(S, cx - 12 * 6 * u / 2 * (Math.max(5, Math.round(6 * u)) / 6) * 2, cy - 70 * u, { scale: Math.max(5, Math.round(6 * u)), mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 60 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('La neurona artificial', 'The artificial neuron'), cx, cy + 92 * u, { size: 24, weight: 800, align: 'center' });
  });
}

export default scene;
void split;
