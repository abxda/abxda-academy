// Escena: Descenso del gradiente. La curva de error se arma pieza por pieza (eje horizontal = el peso, eje vertical = el
// error, puntos de muestra, la curva y su fondo); la pendiente se explica desde cero con una lupa (un movimiento de una
// décima), la tangente y su escalón, y su signo a los dos lados del valle; la regla se arma símbolo por símbolo; luego,
// en la niebla, la bolita baja paso a paso con la tangente visible y los pasos que se acortan solos. Después, la tasa de
// aprendizaje (lenta, rebota, diverge, buena), el gradiente con dos pesos, la escala y los valles múltiples.
// La escena hace sola cada demostración (S.drive mueve la tasa); quien quiere toma los controles y la demostración le
// cede el paso. Todo se anima por fracciones de cada segmento (fr): así sigue a la voz en cualquier idioma.
import { clamp, ease, lerp, regions, tone, type Frame, type Rect, type SceneFactory } from '../../../../../theme/kit';
import { DEMOS, ETA, L, MAIN, NUDGE, RUN_STEPS, SAMPLES, TOL, W0, WR, WS, dL, traj, verdictOf } from './curves';
import { axes1, ball, fog, fr, fz, kk, kxy, label, lupa, nice, plot1, sg, sn, stepOnTangent, tangent } from './helpers';
import { flow, type Cell, type FormulaPart, type Ro } from './aside';
import { draw2D, drawBridge, drawHook, drawRecap, drawRugged, drawScale } from './views';

// ── estado interactivo ─────────────────────────────────────────────────────
/** Turno 1: los pasos que da la persona (pesos visitados) y la animación del salto en curso. */
interface U1 { path: number[]; hop: number; back: { from: number; e: number } | null }
/** Turno 2: la corrida con la tasa que eligió la persona. */
interface U2 { eta: number; path: number[]; k: number; done: boolean }
const r2 = (x: number) => Math.round(x * 100) / 100;
/** Camino de la corrida del turno 2: se corta cuando la bolita sale de la gráfica (diverge). */
// la carrera se detiene al llegar al fondo (así el contador de pasos coincide con «Llega en k pasos») o al salirse de la gráfica
const runPath = (eta: number) => { const p = traj(W0, eta, RUN_STEPS), out: number[] = []; for (const w of p) { out.push(w); if (Math.abs(w - WS) > 5.2 || Math.abs(w - WS) < TOL) break; } return out; };

const LAY = (S: Frame) => regions(S, 0.64);

// ── la historia narrada del peso (sin interacción) ───────────────────────
/** Índice del punto del camino principal que se deja y progreso del salto hacia el siguiente. */
function story(S: Frame): { i: number; e: number } {
  if (S.on('bottom')) { const q = fr(S, 'bottom', 0.08, 0.5, 'lin') * 2, j = Math.min(1, Math.floor(q)); return { i: 6 + j, e: ease.io(clamp((q - j) / 0.6)) }; }
  if (S.on('repeat')) { const q = fr(S, 'repeat', 0.12, 0.92, 'lin') * 4, j = Math.min(3, Math.floor(q)); return { i: 2 + j, e: ease.io(clamp((q - j) / 0.6)) }; }
  if (S.on('second-step')) return { i: 1, e: fr(S, 'second-step', 0.55, 0.76, 'io') };
  if (S.on('first-step')) return { i: 0, e: fr(S, 'first-step', 0.5, 0.72, 'io') };
  return { i: 0, e: 0 };
}

/** Un salto de a a b: posición en datos (peso, error) a lo largo de la cuerda; `lift` (0..1) lo eleva un poco. */
const hopAt = (a: number, b: number, e: number) => ({ w: lerp(a, b, e), y: lerp(L(a), L(b), e), lift: Math.sin(Math.PI * clamp(e)) });

interface View1 {
  w: number; y: number; lift: number;         // la bolita (peso, error mostrado, elevación del salto)
  path: number[]; done: number;               // pesos visitados y cuántos pasos completos
  hopE: number;                               // progreso del salto en curso (0 = en reposo)
  arrowsA: number; trailA: number;
  user: boolean;
}

/** Qué se muestra en la parte de un peso: la narración, la vuelta al inicio del turno 1, o los pasos de la persona. */
function view1(S: Frame): View1 {
  const u1 = S.st.u1 as U1 | undefined;
  if (S.on('try1') && u1) {
    const n = u1.path.length - 1, a = u1.path[Math.max(0, n - 1)], b = u1.path[n];
    if (u1.back) { const w = lerp(u1.back.from, W0, ease.io(u1.back.e)); return { w, y: L(w), lift: 0, path: [W0], done: 0, hopE: 0, arrowsA: 0, trailA: 0, user: true }; }
    const h = n > 0 && u1.hop < 1 ? hopAt(a, b, ease.io(u1.hop)) : { w: b, y: L(b), lift: 0 };
    return { ...h, path: u1.path, done: u1.hop < 1 ? n - 1 : n, hopE: n > 0 && u1.hop < 1 ? u1.hop : 0, arrowsA: 1, trailA: 1, user: true };
  }
  if (S.on('try1')) {
    const w = lerp(MAIN[8], W0, fr(S, 'try1', 0.05, 0.35, 'io')), out = 1 - fr(S, 'try1', 0, 0.2);
    return { w, y: L(w), lift: 0, path: MAIN.slice(0, 9), done: 8, hopE: 0, arrowsA: out, trailA: out, user: false };
  }
  const { i, e } = story(S), h = hopAt(MAIN[i], MAIN[i + 1], e);
  const done = e >= 1 ? i + 1 : i;
  return { ...h, path: MAIN.slice(0, done + 1 + (e > 0 && e < 1 ? 1 : 0)), done, hopE: e > 0 && e < 1 ? e : 0, arrowsA: 1, trailA: 1, user: false };
}

// ── demostraciones de la tasa ─────────────────────────────────────────────
const LR_SEGS = [
  { id: 'lr-small', ...DEMOS.small, a: 0.12, b: 0.85 },
  { id: 'lr-osc', ...DEMOS.osc, a: 0.15, b: 0.85 },
  { id: 'lr-diverge', ...DEMOS.div, a: 0.2, b: 0.8 },
  { id: 'lr-good', ...DEMOS.good, a: 0.15, b: 0.6 },
] as const;

/** Tasa que la demostración pone en el deslizador (con un deslizamiento suave al cambiar de segmento). */
function lrTarget(S: Frame): number {
  let prev = ETA, cur = ETA, f = 1;
  for (const d of LR_SEGS) if (S.on(d.id)) { prev = cur; cur = d.eta; f = fr(S, d.id, 0, 0.1, 'io'); }
  return lerp(prev, cur, f);
}

interface ViewLR { path: number[]; k: number; eta: number; verdictA: number; ghost: number; prev: { path: number[]; a: number } | null; back: { from: number; f: number } | null }
function viewLR(S: Frame): ViewLR {
  const u2 = S.st.u2 as U2 | undefined;
  if (S.touched.has('eta') && u2) return { path: u2.path, k: u2.k, eta: u2.eta, verdictA: u2.done ? 1 : 0, ghost: 0, prev: null, back: null };
  let cur: (typeof LR_SEGS)[number] | null = null, prv: (typeof LR_SEGS)[number] | null = null;
  for (const d of LR_SEGS) if (S.on(d.id)) { prv = cur; cur = d; }
  const ghost = fr(S, 'lr-intro', 0.3, 0.45) * (1 - fr(S, 'lr-small', 0, 0.1));
  if (!cur) {
    // vuelve al inicio desde donde quedó el turno 1
    const v = view1Frozen(S);
    return { path: [W0], k: 0, eta: ETA, verdictA: 0, ghost, prev: null, back: { from: v, f: fr(S, 'lr-intro', 0, 0.25, 'io') } };
  }
  const eta = S.touched.has('eta') ? r2(S.p.eta ?? cur.eta) : cur.eta;
  const path = traj(W0, eta, cur.n), k = (S.on('try2') ? 1 : fr(S, cur.id, cur.a, cur.b, 'lin')) * cur.n;
  const prev = prv ? { path: traj(W0, prv.eta, prv.n), a: 1 - fr(S, cur.id, 0, 0.1) } : null;
  const back = prv && !S.on('try2') ? { from: prev!.path[prev!.path.length - 1], f: fr(S, cur.id, 0, 0.1, 'io') } : null;
  return { path, k, eta, verdictA: S.on('try2') ? 1 : fr(S, cur.id, cur.b, cur.b + 0.08), ghost: 0, prev, back };
}
/** Dónde quedó la bolita al terminar el turno 1 (para volver al inicio sin saltos). */
function view1Frozen(S: Frame): number {
  const u1 = S.st.u1 as U1 | undefined;
  return u1 ? u1.path[u1.path.length - 1] : W0;
}

// ── la escena ──────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'step', kind: 'button', primary: true, label: { es: 'Dar un paso', en: 'Take a step' }, from: 'try1', to: 'lr-intro' },
    { id: 'reset', kind: 'button', label: { es: 'Volver a empezar', en: 'Start over' }, from: 'try1', to: 'lr-intro' },
    { id: 'eta', kind: 'slider', label: { es: 'Tasa de aprendizaje η', en: 'Learning rate η' }, min: 0.01, max: 2.2, step: 0.01, value: ETA, from: 'lr-intro', to: 'two-weights', fmt: (v) => v.toFixed(2) },
  ],

  init(S) { S.st = {}; },

  action(S, id) {
    if (!S.between('try1', 'lr-intro')) return;
    let u1 = S.st.u1 as U1 | undefined;
    if (!u1) {
      const from = view1(S).w;
      u1 = S.st.u1 = { path: [W0], hop: 1, back: Math.abs(from - W0) > 0.01 ? { from, e: 0 } : null } as U1;
    }
    if (id === 'step') {
      if (u1.back) u1.back = null;
      if (u1.path.length > 40) return;
      const w = u1.path[u1.path.length - 1];
      u1.path.push(w - ETA * dL(w)); u1.hop = 0;
    } else if (id === 'reset') {
      u1.back = { from: view1(S).w, e: 0 }; u1.path = [W0]; u1.hop = 1;
    }
  },

  // Demostración guiada de la tasa (S.drive) y animación de lo que hace la persona. render() solo lee S.st.
  update(S) {
    const u1 = S.st.u1 as U1 | undefined;
    if (u1) {
      if (u1.hop < 1) u1.hop = Math.min(1, u1.hop + S.dt / 0.55);
      if (u1.back) { u1.back.e = Math.min(1, u1.back.e + S.dt / 0.6); if (u1.back.e >= 1) u1.back = null; }
      if (u1.path.length - 1 >= 3) S.complete('steps');
    }
    if (S.between('lr-intro', 'two-weights')) {
      S.drive('eta', r2(lrTarget(S)));
      if (S.touched.has('eta')) {
        const e = r2(S.p.eta ?? ETA);
        let u2 = S.st.u2 as U2 | undefined;
        if (!u2 || u2.eta !== e) u2 = S.st.u2 = { eta: e, path: runPath(e), k: 0, done: false };
        if (!u2.done) {
          u2.k = Math.min(u2.path.length - 1, u2.k + S.dt / 0.34);
          if (u2.k >= u2.path.length - 1) { u2.done = true; if (verdictOf(e).v === 'ok') S.complete('lr'); }
        }
      }
    }
  },

  render(S) {
    const R = LAY(S), d = S.d;
    const aHook = 1 - fr(S, 'axis-x', 0, 0.3);
    if (aHook > 0.01) d.withAlpha(aHook, () => drawHook(S, R));
    const a1 = S.on('axis-x') ? 1 - fr(S, 'two-weights', 0, 0.3) : 0;
    if (a1 > 0.01) d.withAlpha(a1, () => drawV1(S, R));
    const a2 = fr(S, 'two-weights', 0, 0.3) * (1 - fr(S, 'scale', 0, 0.25));
    if (a2 > 0.01) d.withAlpha(a2, () => draw2D(S, R));
    const aS = fr(S, 'scale', 0, 0.25) * (1 - fr(S, 'rugged', 0, 0.25));
    if (aS > 0.01) d.withAlpha(aS, () => drawScale(S, R));
    const aR = fr(S, 'rugged', 0, 0.25) * (1 - fr(S, 'recap', 0, 0.25));
    if (aR > 0.01) d.withAlpha(aR, () => drawRugged(S, R));
    const aC = fr(S, 'recap', 0, 0.25) * (1 - fr(S, 'bridge', 0, 0.25));
    if (aC > 0.01) d.withAlpha(aC, () => drawRecap(S, R));
    const aB = fr(S, 'bridge', 0, 0.25);
    if (aB > 0.01) d.withAlpha(aB, () => drawBridge(S));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Un peso: la curva, la pendiente, la regla, los pasos en la niebla y la tasa
// ═════════════════════════════════════════════════════════════════════════
function drawV1(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, pl = plot1(S, R.main), r = pl.r, k = kk(S), u = S.u;
  const wt = tone(S, 'w'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const inLR = S.on('lr-intro');

  // ── ejes, uno por uno ──
  axes1(S, pl, fr(S, 'axis-x', 0.05, 0.3), fr(S, 'axis-y', 0.05, 0.3));
  // el eje horizontal recorre sus valores: cada posición es un peso distinto
  if (S.between('axis-x', 'axis-y')) {
    const a = fr(S, 'axis-x', 0.32, 0.4) * (1 - fr(S, 'axis-x', 0.88, 0.97)), w = lerp(-2, 8, fr(S, 'axis-x', 0.38, 0.86, 'io'));
    if (a > 0.01) {
      const x = pl.X(w), by = r.y + r.h;
      d.withAlpha(a, () => { d.circle(x, by, 6 * k, { fill: wt.c, stroke: p.stage, lw: 2 }); });
      label(S, `w = ${sn(S, w, 1)}`, x, by - 22 * k, { tone: 'w', a, mono: true });
    }
  }
  // el eje vertical: hacia arriba, más error
  const moreA = fr(S, 'axis-y', 0.45, 0.6) * (1 - fr(S, 'curve', 0, 0.2));
  if (moreA > 0.01) {
    const x = r.x + 22 * k;
    d.arrow(x, pl.Y(2), x, pl.Y(11), er.c, 2.5, 9 * k, moreA);
    d.text(S.l('más error', 'more error'), x + 10 * k, pl.Y(6.5), { size: fz(S, 12.5), weight: 800, color: er.ink, base: 'middle', halo: p.stage, a: moreA });
    d.text(S.l('poco error', 'little error'), x + 10 * k, pl.Y(1.2), { size: fz(S, 12), weight: 700, color: p.ink2, base: 'middle', halo: p.stage, a: moreA });
  }

  // ── puntos de muestra y la curva ──
  if (S.on('curve')) {
    const fade = 1 - 0.75 * fr(S, 'goal', 0.1, 0.3), gone = 1 - fr(S, 'start', 0, 0.2);
    SAMPLES.forEach((w, i) => {
      const t0 = i === 0 ? 0.42 : i === 1 ? 0.56 : 0.66 + (i - 2) * 0.022, a = fr(S, 'curve', t0, t0 + 0.06) * gone;
      if (a < 0.01) return;
      const x = pl.X(w), y = pl.Y(L(w));
      if (i < 2) {
        const g = a * (1 - fr(S, 'curve', 0.82, 0.92));
        if (g > 0.01) d.line(x, r.y + r.h, x, y, wt.c, 1.5, [4, 4], g);
        label(S, nice(S, L(w)), x + (i === 0 ? 16 : 18) * k, y - 4 * k, { tone: 'err', a: a * (1 - fr(S, 'goal', 0, 0.15)), mono: true, align: 'left' });
      }
      d.withAlpha(a * fade, () => d.circle(x, y, 4.5 * k, { fill: er.c, stroke: p.stage, lw: 1.5 }));
    });
    const cA = fr(S, 'curve', 0.8, 0.97, 'io');
    if (cA > 0.001) pl.curve(L, 'ink', 3, { to: lerp(pl.o.xr[0], pl.o.xr[1], cA) });
  }
  // el fondo: el mejor peso
  const goalA = fr(S, 'goal', 0.3, 0.45) * (1 - fr(S, 'start', 0, 0.2));
  if (goalA > 0.01) {
    const x = pl.X(WS), y = pl.Y(L(WS));
    d.line(x, y, x, r.y + r.h, dt.c, 2, [5, 4], goalA);
    d.withAlpha(goalA, () => d.circle(x, y, 7 * k, { fill: dt.c, stroke: p.stage, lw: 2 }));
    d.line(x, y - 8 * k, x, y - 32 * k, dt.c, 1.5, undefined, goalA);
    label(S, S.l('el mejor peso: 3', 'the best weight: 3'), x, y - 42 * k, { tone: 'dat', a: goalA });
  }

  // ── la bolita: dónde está ──
  const v = view1(S);
  let lr: ViewLR | null = null, bw = v.w, by = v.y, lift = v.lift;
  if (inLR) {
    lr = viewLR(S);
    if (lr.back && lr.back.f < 1) { bw = lerp(lr.back.from, W0, lr.back.f); by = L(bw); lift = 0; }
    else { const i = Math.min(lr.path.length - 2, Math.floor(lr.k)), e = ease.io(clamp((lr.k - i) / 0.7)); const h = i >= 0 ? hopAt(lr.path[i], lr.path[i + 1], e) : { w: W0, y: L(W0), lift: 0 }; bw = h.w; by = h.y; lift = h.lift; }
  }
  // ¿se muestra la bolita? aparece cuando el punto de partida llega a la curva
  const ballA = S.on('start') ? fr(S, 'start', 0.6, 0.7) : 0;

  // ubicar el punto de partida: en la línea horizontal y luego subir hasta la curva
  if (S.between('start', 'slope-nudge')) {
    const out = 1 - fr(S, 'slope-what', 0, 0.2), mA = fr(S, 'start', 0.2, 0.3) * out, up = fr(S, 'start', 0.38, 0.62, 'io');
    const x = pl.X(W0), yb = r.y + r.h, yU = lerp(yb, pl.Y(L(W0)), up);
    if (up > 0.001) d.line(x, yb, x, yU, wt.c, 2, [5, 4], out);
    const hz = fr(S, 'start', 0.66, 0.8);
    if (hz > 0.01) { d.line(r.x, pl.Y(L(W0)), x, pl.Y(L(W0)), er.c, 2, [5, 4], hz * out); label(S, '9', r.x + 14 * k, pl.Y(L(W0)) - 15 * k, { tone: 'err', a: hz * out, mono: true }); }
    if (mA > 0.01 && ballA < 1) d.withAlpha(mA * (1 - ballA), () => d.circle(x, yU, 6 * k, { fill: wt.c, stroke: p.stage, lw: 2 }));
    label(S, 'w = −1', x + 8 * k, yb - 18 * k, { tone: 'w', a: mA * (1 - up), mono: true, align: 'left' });
  }

  // ── pendiente: pregunta, pedazo de curva, lupa, tangente y escalón ──
  const fogF = fr(S, 'fog', 0.15, 0.5) * (1 - fr(S, 'map', 0.05, 0.45));
  const fogRad = clamp(r.w * 0.09, 30, 56 * k);
  const tanPx = lerp(clamp(r.w * 0.14, 46, 96), fogRad * 0.9, fogF);
  // ← ? →
  const qA = fr(S, 'slope-what', 0.08, 0.22) * (1 - fr(S, 'slope-nudge', 0, 0.15));
  if (qA > 0.01) {
    const x = pl.X(W0), y = pl.Y(L(W0)) + 30 * k;
    d.arrow(x - 14 * k, y, Math.max(r.x + 8 * k, x - 52 * k), y, p.ink2, 2.5, 9 * k, qA); d.arrow(x + 14 * k, y, x + 52 * k, y, p.ink2, 2.5, 9 * k, qA);
    d.text('?', x, y, { size: fz(S, 20), weight: 800, color: p.ink, align: 'center', base: 'middle', a: qA });
  }
  // el pedazo de curva bajo los pies
  const pieceA = fr(S, 'slope-what', 0.55, 0.7) * (1 - fr(S, 'slope-tangent', 0.3, 0.45));
  if (pieceA > 0.01) pl.curve(L, 'err', 7, { from: W0 - 0.45, to: W0 + 0.45, a: 0.35 * pieceA });
  // tangente de la bolita (en el punto de partida, y luego en cada paso)
  const lrOut = inLR ? 1 - fr(S, 'lr-intro', 0, 0.2) : 1;   // al entrar a la tasa, lo de los pasos se desvanece
  const tanOn = S.on('slope-tangent') && lrOut > 0.01;
  if (tanOn) {
    const grow = fr(S, 'slope-tangent', 0.35, 0.55, 'io');
    const dim = (S.between('slope-sign', 'derivative') ? 1 - fr(S, 'slope-sign', 0, 0.15) * (1 - fr(S, 'slope-zero', 0.5, 0.62)) : 1);
    const hopFade = v.hopE > 0 ? clamp(Math.abs(v.hopE - 0.5) * 4 - 1) : 1;
    const tw = inLR ? bw : v.hopE > 0 ? (v.hopE < 0.5 ? v.path[v.path.length - 2] : v.path[v.path.length - 1]) : v.w;
    const a = grow * dim * hopFade * lrOut;
    if (a > 0.01) tangent(S, pl, tw, { px: tanPx * (S.between('slope-tangent', 'slope-sign') ? lerp(0.3, 1, grow) : 1), minRun: S.between('slope-tangent', 'slope-zero') ? 1.15 * (1 - fr(S, 'slope-sign', 0, 0.15)) : 0, a });
  }
  // escalón sobre la tangente en −1: un paso a la derecha, baja cuatro
  const stepA = S.between('slope-tangent', 'slope-zero') ? fr(S, 'slope-tangent', 0.62, 0.72) * (1 - fr(S, 'slope-sign', 0, 0.15)) : 0;
  if (stepA > 0.01) stepOnTangent(S, pl, W0, stepA, fr(S, 'slope-tangent', 0.72, 0.86));
  if (S.between('slope-tangent', 'slope-zero')) {
    // rótulo de la tangente, a la derecha de su parte alta, con una línea guía
    const a = fr(S, 'slope-tangent', 0.5, 0.6) * (1 - fr(S, 'slope-sign', 0, 0.12)), wq = W0 - 0.45, lx = pl.X(W0 + 0.5), ly = pl.Y(L(W0) - dL(W0) * 0.45 + 0.9);
    d.line(pl.X(wq) + 3 * k, pl.Y(L(W0) - dL(W0) * 0.45), lx - 4 * k, ly, er.c, 1.2, undefined, a);
    label(S, S.l('tangente', 'tangent'), lx, ly, { tone: 'err', a, align: 'left' });
  }

  // la sonda: recorre el valle hasta el peso 6 (pendiente +3) y vuelve al fondo (pendiente 0)
  if (S.between('slope-sign', 'rule-dir')) {
    let w = lerp(W0, WR, fr(S, 'slope-sign', 0.08, 0.42, 'io'));
    if (S.on('slope-zero')) w = lerp(WR, WS, fr(S, 'slope-zero', 0.08, 0.38, 'io'));
    const a = fr(S, 'slope-sign', 0.04, 0.14) * (1 - fr(S, 'derivative', 0, 0.2));
    if (a > 0.01) {
      tangent(S, pl, w, { px: tanPx, a });
      ball(S, pl.X(w), pl.Y(L(w)), a, true);
      const sA = S.on('slope-zero') ? 1 - fr(S, 'slope-zero', 0, 0.12) : fr(S, 'slope-sign', 0.45, 0.55);
      stepOnTangent(S, pl, WR, sA * a, (S.on('slope-zero') ? 1 : fr(S, 'slope-sign', 0.52, 0.66)) * sA * a);
      label(S, S.l('pendiente +3', 'slope +3'), pl.X(WR) - 14 * k, pl.Y(L(WR)) - 26 * k, { tone: 'err', a: fr(S, 'slope-sign', 0.62, 0.72) * (1 - fr(S, 'slope-zero', 0, 0.12)) * a, align: 'right' });
      if (S.on('slope-zero'))
        label(S, S.l('pendiente 0: el fondo', 'slope 0: the bottom'), pl.X(WS), pl.Y(L(WS)) - 24 * k, { tone: 'err', a: fr(S, 'slope-zero', 0.3, 0.4) * (1 - fr(S, 'slope-zero', 0.5, 0.6)) * a });
    }
    // resumen: los tres casos a la vez
    const sumA = fr(S, 'slope-zero', 0.55, 0.68) * (1 - fr(S, 'derivative', 0, 0.2));
    if (sumA > 0.01) {
      tangent(S, pl, WR, { px: tanPx, a: sumA });
      ball(S, pl.X(WR), pl.Y(L(WR)), sumA, true);
      label(S, S.l('negativa', 'negative'), pl.X(W0) + 14 * k, pl.Y(L(W0)) - 24 * k, { tone: 'err', a: sumA, align: 'left' });
      label(S, S.l('cero', 'zero'), pl.X(WS), pl.Y(L(WS)) - 24 * k, { tone: 'err', a: sumA });
      label(S, S.l('positiva', 'positive'), pl.X(WR) - 14 * k, pl.Y(L(WR)) - 26 * k, { tone: 'err', a: sumA, align: 'right' });
    }
  }
  // derivada: el mismo número, con su nombre
  const derA = fr(S, 'derivative', 0.2, 0.32) * (1 - fr(S, 'rule-dir', 0, 0.15));
  if (derA > 0.01) label(S, S.l('derivada: −4', 'derivative: −4'), pl.X(W0) + 14 * k, pl.Y(L(W0)) - 24 * k, { tone: 'err', a: derA, align: 'left' });

  // ── la regla: hacia dónde (flechas) y cuánto (η × pendiente) ──
  if (S.between('rule-dir', 'first-step')) {
    const out = 1 - fr(S, 'fog', 0, 0.2), len = fr(S, 'rule-eta', 0.45, 0.65, 'io');
    const yA = pl.Y(L(W0)) - 26 * k, yB = pl.Y(L(WR)) - 26 * k;
    const aA = fr(S, 'rule-dir', 0.3, 0.42) * out, aB = fr(S, 'rule-dir', 0.55, 0.67) * out;
    const xA0 = pl.X(W0) + 10 * k, xA1 = lerp(xA0 + 58 * k, pl.X(W0 - ETA * dL(W0)), len);
    const xB0 = pl.X(WR) - 10 * k, xB1 = lerp(xB0 - 58 * k, pl.X(WR - ETA * dL(WR)), len);
    if (aA > 0.01) {
      d.arrow(xA0, yA, xA1, yA, wt.c, 3, 10 * k, aA);
      d.text(S.l('avanzar', 'forward'), (xA0 + xA1) / 2, yA - 7 * k, { size: fz(S, 12.5), weight: 800, color: wt.ink, align: 'center', base: 'bottom', halo: p.stage, a: aA * (1 - fr(S, 'rule-minus', 0.2, 0.3)) });
    }
    if (aB > 0.01) {
      tangent(S, pl, WR, { px: tanPx, a: aB });
      ball(S, pl.X(WR), pl.Y(L(WR)), aB, true);
      d.arrow(xB0, yB, xB1, yB, wt.c, 3, 10 * k, aB);
      d.text(S.l('retroceder', 'back'), (xB0 + xB1) / 2, yB - 7 * k, { size: fz(S, 12.5), weight: 800, color: wt.ink, align: 'center', base: 'bottom', halo: p.stage, a: aB * (1 - fr(S, 'rule-minus', 0.2, 0.3)) });
    }
    // el signo menos en acción, a cada lado
    const mA = fr(S, 'rule-minus', 0.3, 0.42) * out, mB = fr(S, 'rule-minus', 0.55, 0.67) * out;
    if (mA > 0.01) label(S, `−${S.n(ETA, 1)} × (−4) = +2`, xA0, yA - 18 * k, { tone: 'w', a: mA, mono: true, align: 'left' });
    if (mB > 0.01) label(S, `−${S.n(ETA, 1)} × (+3) = −1.5`, xB0, yB - 18 * k, { tone: 'w', a: mB, mono: true, align: 'right' });
  }

  // ── niebla ──
  const fx = pl.X(inLR ? bw : v.w);
  fog(S, pl, fx, fogF, fogRad);
  const noSee = fr(S, 'fog', 0.42, 0.55) * (1 - fr(S, 'first-step', 0, 0.15));
  if (noSee > 0.01) label(S, S.l('lo que la máquina no ve', 'what the machine cannot see'), r.x + r.w * 0.62, r.y + r.h * 0.42, { a: noSee });

  // ── el rastro y los pasos (narración y turno 1) ──
  if (S.on('first-step') && lrOut > 0.01) {
    const tA = v.trailA * lrOut;
    for (let j = 0; j < v.path.length - 1; j++) {
      const a = v.path[j], b = v.path[j + 1], last = j === v.path.length - 2 && v.hopE > 0;
      if (!last) pl.line(a, L(a), b, L(b), 'w', 1.5, [4, 4], 0.7 * tA);
      pl.dot(a, L(a), 3.2, 'w', { a: 0.55 * tA });
    }
    // flechas de los pasos sobre el eje: cada una más corta que la anterior
    const ya = r.y + r.h - 12 * k;
    for (let j = 0; j < v.path.length - 1; j++) {
      const a = v.path[j], b = v.path[j + 1], last = j === v.path.length - 2 && v.hopE > 0;
      const x0 = pl.X(a), x1 = pl.X(last ? lerp(a, b, ease.io(v.hopE)) : b), len = Math.abs(x1 - x0);
      if (len < 2) continue;
      d.withAlpha(v.arrowsA * lrOut, () => {
        d.arrow(x0, ya, x1, ya, wt.c, 2.5, Math.min(8 * k, len * 0.6));
        d.line(x0, ya - 5 * k, x0, ya + 5 * k, wt.c, 1.5);
        const txt = sg(S, b - a, 2).replace(/0+$/, '').replace(/\.$/, '');
        if (!last && len > d.measure(txt, { size: fz(S, 12), font: 'mono', weight: 700 }) + 6 * k) d.text(txt, (x0 + x1) / 2, ya - 6 * k, { size: fz(S, 12), font: 'mono', weight: 700, color: wt.ink, align: 'center', base: 'bottom', halo: p.stage });
      });
    }
  }

  // ── demostraciones de la tasa ──
  if (lr) {
    const drawPath = (path: number[], kk_: number, a: number) => {
      const n = Math.min(path.length - 1, Math.floor(kk_));
      for (let j = 0; j < n; j++) pl.line(path[j], L(path[j]), path[j + 1], L(path[j + 1]), 'w', 2, [5, 4], 0.85 * a);
      for (let j = 0; j <= n; j++) pl.dot(path[j], L(path[j]), 3.4, 'w', { a: 0.6 * a });
    };
    if (lr.ghost > 0.01) MAIN.slice(0, 7).forEach((w) => pl.dot(w, L(w), 3.4, 'w', { a: 0.5 * lr!.ghost }));
    if (lr.prev && lr.prev.a > 0.01) drawPath(lr.prev.path, lr.prev.path.length, lr.prev.a);
    if (!lr.back || lr.back.f >= 1) drawPath(lr.path, lr.k, 1);
  }

  // ── la bolita, su error y la etiqueta del método ──
  if (ballA > 0.01) {
    const bx = pl.X(bw), byp = pl.Y(by) - lift * 10 * k;
    const dimBall = S.between('slope-sign', 'derivative') ? 1 - 0.55 * fr(S, 'slope-sign', 0, 0.15) * (1 - fr(S, 'slope-zero', 0.5, 0.62)) : 1;
    ball(S, bx, byp, ballA * dimBall);
    // anillo suave que invita a probar en el turno 1
    if (S.between('try1', 'lr-small') && !v.user) d.circle(bx, byp, (14 + 2.5 * Math.sin(S.clock * 4)) * k, { stroke: wt.c, lw: 2, a: fr(S, 'try1', 0.35, 0.5) * (1 - fr(S, 'lr-intro', 0, 0.15)) });
    // el número del error, junto a la bolita, mientras baja
    const errA = S.on('first-step') ? (fr(S, 'first-step', 0, 0.15) * (1 - fr(S, 'map', 0.5, 0.65)) + (S.on('try1') ? fr(S, 'try1', 0.3, 0.45) : 0)) * lrOut : 0;
    if (errA > 0.01) label(S, `error ${sn(S, by, 2)}`, bx + 12 * k, byp - 28 * k, { tone: 'err', a: clamp(errA), mono: true, align: 'left' });
  }
  const nameA = fr(S, 'name', 0.08, 0.22) * (1 - fr(S, 'try1', 0, 0.15));
  if (nameA > 0.01) label(S, S.l('descenso del gradiente', 'gradient descent'), r.x + r.w / 2, r.y + 14 * k, { tone: 'w', a: nameA, size: fz(S, 14) });

  // la lupa va encima de todo
  if (S.between('slope-nudge', 'slope-sign')) {
    const a = fr(S, 'slope-nudge', 0.05, 0.2) * (1 - fr(S, 'slope-tangent', 0.3, 0.45));
    lupa(S, pl, W0, NUDGE, a, fr(S, 'slope-nudge', 0.35, 0.5), fr(S, 'slope-tangent', 0.05, 0.2));
  }

  // ── columna lateral ──
  drawAside1(S, R.aside, inLR ? { w: bw, y: by } : { w: focusW(S, v), y: focusY(S, v) }, v, lr);
  void u;
}

/** El peso del que hablan las lecturas: la bolita, salvo cuando la sonda recorre el valle. */
function focusW(S: Frame, v: View1) {
  if (S.between('slope-sign', 'derivative')) return S.on('slope-zero') ? lerp(WR, WS, fr(S, 'slope-zero', 0.08, 0.38, 'io')) : lerp(W0, WR, fr(S, 'slope-sign', 0.08, 0.42, 'io'));
  if (S.between('derivative', 'rule-dir')) return lerp(WS, W0, fr(S, 'derivative', 0, 0.2, 'io'));
  return v.w;
}
function focusY(S: Frame, v: View1) {
  return S.between('slope-sign', 'rule-dir') ? L(focusW(S, v)) : v.y;
}

// ── la columna lateral de la parte de un peso ──
function drawAside1(S: Frame, A: Rect, f: { w: number; y: number }, v: View1, lr: ViewLR | null) {
  const { d } = S, k = kk(S);
  const aT = fr(S, 'curve', 0, 0.15) * (1 - fr(S, 'start', 0, 0.2));
  const aR = fr(S, 'start', 0, 0.2) * (1 - fr(S, 'lr-intro', 0, 0.2));
  const aL = fr(S, 'lr-intro', 0, 0.2);

  // tabla «peso → error» mientras se arma la curva
  if (aT > 0.01) {
    const show = SAMPLES.map((_, i) => fr(S, 'curve', i === 0 ? 0.42 : i === 1 ? 0.56 : 0.66 + (i - 2) * 0.022, (i === 0 ? 0.42 : i === 1 ? 0.56 : 0.66 + (i - 2) * 0.022) + 0.06));
    flow(S, A, [{ k: 'table', rows: SAMPLES.map((w) => [w, L(w)] as [number, number]), show, hl: SAMPLES.indexOf(WS), hlA: fr(S, 'goal', 0.3, 0.45) }], aT);
  }

  // lecturas, pendiente y regla
  if (aR > 0.01) {
    const m = dL(f.w);
    const hl = fr(S, 'fog-local', 0.12, 0.25) * (1 - fr(S, 'first-step', 0, 0.15));
    const items: Ro[] = [
      { name: S.l('peso w', 'weight w'), value: sn(S, f.w, 2), tone: 'w', a: fr(S, 'start', 0.2, 0.32) },
      { name: 'error', value: sn(S, f.y, 2), tone: 'err', hl, a: fr(S, 'start', 0.62, 0.72) },
      { name: S.l('pendiente', 'slope'), value: sg(S, m, 2), tone: 'err', a: fr(S, 'slope-value', 0.45, 0.58), hl },
      { name: S.l('tasa η', 'rate η'), value: S.n(ETA, 2), tone: 'dat', a: fr(S, 'rule-eta', 0.3, 0.45), hl: fr(S, 'rule-eta', 0.3, 0.45) * (1 - fr(S, 'rule-minus', 0, 0.2)) },
    ];
    const h0 = flow(S, A, [{ k: 'ro', items }], aR);
    const B: Rect = { x: A.x, y: A.y + h0 + 4 * k, w: A.w, h: A.h - h0 - 4 * k };

    // antes de la regla: el movimiento de una décima, la derivada, hacia dónde
    const pre: Cell[] = [];
    const nA = fr(S, 'slope-nudge', 0.35, 0.5) * (1 - fr(S, 'slope-tangent', 0.3, 0.45));
    if (nA > 0.01) {
      pre.push(
        { k: 'text', mono: true, tone: 'w', a: nA, text: `${S.l('peso', 'weight')}: −1 → −0.9  (+0.1)` },
        { k: 'text', mono: true, tone: 'err', a: nA, text: `error: 9 → ${S.n(L(W0 + NUDGE), 3)}  (${sn(S, L(W0 + NUDGE) - L(W0), 3)})` },
        { k: 'text', mono: true, tone: 'err', a: nA * fr(S, 'slope-value', 0.3, 0.45), text: `${sn(S, L(W0 + NUDGE) - L(W0), 3)} ÷ 0.1 ≈ −4` },
      );
    }
    const dA = fr(S, 'derivative', 0.2, 0.35) * (1 - fr(S, 'rule-dir', 0, 0.15));
    if (dA > 0.01) pre.push({ k: 'text', tone: 'err', a: dA, text: S.l('Derivada: la pendiente en un punto.', 'Derivative: the slope at a point.') });
    const rA = fr(S, 'rule-dir', 0.3, 0.45) * (1 - fr(S, 'rule-words', 0, 0.12));
    if (rA > 0.01) pre.push(
      { k: 'text', tone: 'w', a: rA, text: S.l('pendiente negativa → avanzar', 'negative slope → forward') },
      { k: 'text', tone: 'w', a: rA * fr(S, 'rule-dir', 0.55, 0.67), text: S.l('pendiente positiva → retroceder', 'positive slope → back') },
    );
    if (pre.length) flow(S, B, pre);

    // la regla y, debajo, la cuenta de cada paso y el historial del error
    const fA = fr(S, 'rule-words', 0.05, 0.2);
    if (fA > 0.01) {
      const parts: FormulaPart[] = [
        { sym: 'w', word: S.l('peso nuevo', 'new weight'), tone: 'w' }, { sym: ' ← ', word: '  =  ' },
        { sym: 'w', word: S.l('peso actual', 'current weight'), tone: 'w' }, { sym: ' − ', word: '  −  ' },
        { sym: 'η', word: S.l('tasa', 'rate'), tone: 'dat' }, { sym: ' × ', word: '  ×  ' },
        { sym: S.l('pendiente', 'slope'), word: S.l('pendiente', 'slope'), tone: 'err' },
      ];
      const rev = [0.12, 0.2, 0.3, 0.45, 0.58, 0.62, 0.74].map((t) => fr(S, 'rule-words', t, t + 0.1));
      const hot = [0, 0, 0, fr(S, 'rule-minus', 0.05, 0.2) * (1 - fr(S, 'fog', 0, 0.2)), fr(S, 'rule-eta', 0.08, 0.22) * (1 - fr(S, 'rule-minus', 0, 0.2)), 0, 0];
      const hF = flow(S, B, [{ k: 'formula', parts, rev, hot }], fA);
      // la cuenta del paso: la anterior se desvanece mientras entra la nueva, en el mismo lugar
      const C: Rect = { x: B.x, y: B.y + hF, w: B.w, h: B.h - hF };
      arith(S, v).forEach((t) => { if (t.a > 0.01) flow(S, C, [{ k: 'text', mono: true, tone: 'w', a: t.a, text: t.text, lines: 1 }], fA); });
      const lh = fz(S, 13) * S.u * 1.3 + 6 * k;
      if (S.on('first-step')) flow(S, { x: C.x, y: C.y + lh, w: C.w, h: C.h - lh }, [{ k: 'hist', vals: v.path.slice(0, v.done + 1).map(L), n: 8, max: 10, title: S.l('error en cada paso', 'error at each step'), a: v.user ? 1 : fr(S, 'first-step', 0.6, 0.75) * v.trailA, opt: true }], fA);
    }
  }

  // la tasa: lecturas, veredicto e historial
  if (aL > 0.01 && lr) {
    const n = Math.min(lr.path.length - 1, Math.floor(lr.k)), cur = lr.back && lr.back.f < 1 ? L(f.w) : f.y;
    const items: Ro[] = [
      { name: S.l('tasa η', 'rate η'), value: S.n(lr.eta, 2), tone: 'dat' },
      { name: S.l('pasos', 'steps'), value: String(lr.back && lr.back.f < 1 ? 0 : n) },
      { name: 'error', value: sn(S, cur, 2), tone: 'err' },
    ];
    const cells: Cell[] = [{ k: 'ro', items, cols: S.portrait ? 3 : 2 }];
    const vd = verdictOf(lr.eta), vt = verdictText(S, vd.v, vd.k, lr.path.length - 1);
    cells.push({ k: 'text', text: vt.text, tone: vt.tone, a: lr.verdictA, lines: 2 });
    cells.push({ k: 'hist', vals: lr.back && lr.back.f < 1 ? [] : lr.path.slice(0, n + 1).map(L), n: RUN_STEPS, max: 14, title: S.l('error en cada paso', 'error at each step'), opt: true });
    flow(S, A, cells, aL);
  }
  void d;
}

/** La cuenta del paso en curso, con los números de la narración. Devuelve la línea anterior (que se va) y la actual (que entra). */
function arith(S: Frame, v: View1): { text: string; a: number }[] {
  const line = (a: number) => {
    const m = dL(a), ms = (m > 0 ? '+' : '') + nice(S, m);
    return `w ← ${nice(S, a)} − ${S.n(ETA, 1)} × (${ms}) = ${nice(S, a - ETA * m)}`;
  };
  const swap = (prev: number | null, cur: number, f: number) => [...(prev === null ? [] : [{ text: line(prev), a: 1 - clamp(f * 2) }]), { text: line(cur), a: clamp(f * 2 - 1) }];
  if (S.between('first-step', 'second-step')) return [{ text: line(MAIN[0]), a: fr(S, 'first-step', 0.08, 0.2) }];
  if (S.between('second-step', 'repeat')) return swap(MAIN[0], MAIN[1], fr(S, 'second-step', 0, 0.2));
  if (S.between('repeat', 'map')) { const { i, e } = story(S); return e > 0 ? swap(MAIN[i - 1], MAIN[i], clamp(e / 0.25)) : [{ text: line(MAIN[i - 1]), a: 1 }]; }
  if (S.between('map', 'name')) return [{ text: line(MAIN[7]), a: 1 - fr(S, 'map', 0, 0.15) }];
  if (S.on('try1') && v.user && v.path.length >= 2) {
    const n = v.path.length - 1, u1 = S.st.u1 as U1;
    return n >= 2 && u1.hop < 1 ? swap(v.path[n - 2], v.path[n - 1], clamp(u1.hop / 0.25)) : [{ text: line(v.path[n - 1]), a: 1 }];
  }
  return [];
}

function verdictText(S: Frame, v: string, k: number, steps: number): { text: string; tone: 'dat' | 'err' } {
  if (v === 'ok') return { text: S.l(`Llega en ${k} ${k === 1 ? 'paso' : 'pasos'}, sin rebotar.`, `Gets there in ${k} ${k === 1 ? 'step' : 'steps'}, no bouncing.`), tone: 'dat' };
  if (v === 'slow') return k > 0 && k <= steps ? { text: S.l(`Llega, pero lenta: ${k} pasos.`, `Gets there, but slowly: ${k} steps.`), tone: 'err' } : { text: S.l(`Lenta: tras ${steps} pasos sigue lejos.`, `Slow: after ${steps} steps it is still far.`), tone: 'err' };
  if (v === 'osc') return { text: S.l('Rebota de un lado a otro, aunque se acerca.', 'It bounces back and forth, though it gets closer.'), tone: 'err' };
  if (v === 'bounce') return { text: S.l('Rebota sin acercarse nunca.', 'It bounces without ever getting closer.'), tone: 'err' };
  return { text: S.l('Diverge: cada salto cae más arriba.', 'It diverges: each jump lands higher.'), tone: 'err' };
}

export default scene;
void TOL;
