// Escena: Entrenar bien. Un modelo de juguete de dos pesos y 256 ejemplos (sim.ts) donde los lotes, las épocas y los
// optimizadores SGD, momento y Adam corren de verdad. Tres turnos: el tamaño del lote, la carrera de optimizadores y el calendario
// de la tasa. Lo narrado es función del tiempo; lo interactivo vive en S.st y avanza en update().
import {
  alpha, badge, box, clamp, ease, hash, inset, link, neu, regions, tone,
  type Frame, type Rect, type SceneFactory, type Tone,
} from '../../../../../theme/kit';
import {
  BOWL, CANYON, EX, M2B, N, START_BOWL, START_HIGH, START_NEAR, batchCenter, cachedTrain, epochOrder, grad, h2eff, perm, toUV, toXY, train,
  type Opt, type Run, type Sched, type V2,
} from './sim';
import {
  FS, batchGrad, descentArrow, drawAxisNames, drawCloud, drawLand, drawMin, drawRun, drawStart, landView, marker,
  type LView, type Shape,
} from './view';
import { asideSplit, deck, dial, etaChart, hbars, kvCard, lerpRect, lossChart, readouts, type Series } from './parts';

// ── constantes de la lección ───────────────────────────────────────────────
const ETA_BOWL = 0.08, BUDGET = 1024, BOWL_SEED = 5, T_RACE = 120, THR = 0.05, T_SCHED = 160, WARM = 16;
const OPTS: Record<Opt, { name: { es: string; en: string }; tone: Tone; shape: Shape; eta: number }> = {
  sgd: { name: { es: 'SGD', en: 'SGD' }, tone: 'w', shape: 'circle', eta: 0.07 },
  mom: { name: { es: 'Momento', en: 'Momentum' }, tone: 'sig', shape: 'square', eta: 0.02 },
  adam: { name: { es: 'Adam', en: 'Adam' }, tone: 'lat', shape: 'diamond', eta: 0.2 },
};
const oname = (S: Frame, o: Opt) => S.L(OPTS[o].name);
const f2 = (S: Frame, x: number, d = 2) => S.n(x, d);

// ── corridas narradas (deterministas) ──────────────────────────────────────
const bowlRun = (B: number, seed: number, steps: number, full = false) => cachedTrain(BOWL, 'sgd', ETA_BOWL, B, seed, steps, { start: START_BOWL, full });
const FULL = () => bowlRun(256, 1, 40, true);
const SGD8 = () => bowlRun(8, BOWL_SEED, 128);
const cy = (opt: Opt, eta: number, seed: number, steps: number, o: { start?: V2; sched?: Sched | null } = {}) => cachedTrain(CANYON, opt, eta, 32, seed, steps, { start: o.start ?? START_NEAR, sched: o.sched });
const R_SGD_A = () => cy('sgd', 0.08, 3, 100);
const R_SGD_DIV = () => cy('sgd', 0.11, 3, 60);
const R_SGD_SMALL = () => cy('sgd', 0.02, 3, 120);
const R_SGD_REF = () => cy('sgd', 0.06, 3, 120);
const R_MOM = () => cy('mom', 0.015, 3, 120);
const R_ADAM = () => cy('adam', 0.25, 3, 120);
const R_ADAM_C = () => cy('adam', 0.3, 5, 100);
const R_ADAM_D = () => cy('adam', 0.3, 5, 100, { sched: { warm: 0, decay: true, total: 100, floor: 0.02 } });
const SCHED_FULL: Sched = { warm: WARM, decay: true, total: T_SCHED, floor: 0.02 };
const R_HIGH_DIV = () => cy('sgd', 0.07, 3, T_SCHED, { start: START_HIGH });
const R_HIGH_OK = () => cy('sgd', 0.07, 3, T_SCHED, { start: START_HIGH, sched: SCHED_FULL });
const REF: Record<Opt, () => Run> = { sgd: () => cy('sgd', 0.07, 9, T_RACE), mom: () => cy('mom', 0.02, 9, T_RACE), adam: () => cy('adam', 0.2, 9, T_RACE) };

// ── curva «lote → error final» (mediana de 12 semillas, mismo presupuesto) ──────────────
const BS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
let uCurve: { B: number; v: number }[] | null = null;
const U_CURVE = () => uCurve ??= BS.map((B) => {
  const fs = Array.from({ length: 12 }, (_, i) => { const r = train(BOWL, 'sgd', ETA_BOWL, B, i + 1, Math.ceil(BUDGET / B), { start: START_BOWL }); return r.loss[r.loss.length - 1]; }).sort((a, b) => a - b);
  return { B, v: (fs[5] + fs[6]) / 2 };
});

// ── abanico de pendientes de lotes ─────────────────────────────────────────
const fanIdx = (k: number, B: number) => perm(5000 + k * 31 + B);
const fanCache = new Map<number, { g: V2; rel: number }[]>();
function fan(B: number) {
  let f = fanCache.get(B);
  if (!f) {
    const gT = grad(BOWL, START_BOWL[0], START_BOWL[1]);
    f = Array.from({ length: 24 }, (_, k) => { const g = batchGrad(BOWL, START_BOWL, B, k); return { g, rel: Math.hypot(g[0] - gT[0], g[1] - gT[1]) / Math.hypot(gT[0], gT[1]) }; });
    fanCache.set(B, f);
  }
  return f;
}

// ── estado interactivo ─────────────────────────────────────────────────────
interface Anim { run: Run; k: number; speed: number; done: boolean; opt: Opt; eta: number; B: number; tone: Tone; shape: Shape; seed: number }
interface G1 { cur: Anim | null; runs: Anim[]; count: number; tried: number[]; best: number }
interface G2 { cur: Anim | null; runs: Anim[]; count: number; best: Partial<Record<Opt, Anim>> }
interface G3 { cur: Anim | null; count: number; verdict: '' | 'div' | 'bounce' | 'ok'; warm: boolean; decay: boolean; sched: Sched | null }
const G1 = (S: Frame): G1 => (S.st.g1 ??= { cur: null, runs: [], count: 0, tried: [], best: Infinity });
const G2 = (S: Frame): G2 => (S.st.g2 ??= { cur: null, runs: [], count: 0, best: {} });
const G3 = (S: Frame): G3 => (S.st.g3 ??= { cur: null, count: 0, verdict: '', warm: false, decay: false, sched: null });
const finalLoss = (a: Anim) => a.run.loss[a.run.loss.length - 1];
const lossAt = (a: { run: Run; k: number }) => a.run.loss[Math.min(a.run.loss.length - 1, Math.floor(a.k))];
function advance(S: Frame, a: Anim | null): boolean {
  if (!a || a.done) return false;
  a.k = S.reduced ? a.run.steps : Math.min(a.run.steps, a.k + a.speed * Math.min(0.1, S.dt));
  if (a.k >= a.run.steps) { a.done = true; return true; }
  return false;
}
const schedOf = (warm: boolean, decay: boolean): Sched | null => (warm || decay ? { warm: warm ? WARM : 0, decay, total: T_SCHED, floor: 0.02 } : null);
const sigLoss = (v: number, S: Frame) => (v >= 59 ? S.l('diverge', 'diverges') : f2(S, v, v < 0.1 ? 3 : 2));

// ── textos de lectura ──────────────────────────────────────────────────────
const stepsWord = (S: Frame, n: number) => `${n} ${S.l('pasos', 'steps')}`;

const scene: SceneFactory = () => ({
  controls: [
    { id: 'batch', kind: 'slider', label: { es: 'Tamaño del lote', en: 'Batch size' }, min: 0, max: 8, step: 1, value: 3, from: 'try1', to: 'tradeoff', fmt: (v, l) => `${2 ** v} · ${Math.ceil(BUDGET / 2 ** v)} ${l === 'es' ? 'pasos' : 'steps'}` },
    { id: 'train1', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'try1', to: 'tradeoff' },
    { id: 'clear1', kind: 'button', label: { es: 'Borrar intentos', en: 'Clear runs' }, from: 'try1', to: 'tradeoff' },
    { id: 'guess', kind: 'choice', label: { es: 'Mi apuesta: llega primero…', en: 'My bet: arrives first…' }, value: '', options: [{ value: 'sgd', label: OPTS.sgd.name }, { value: 'mom', label: OPTS.mom.name }, { value: 'adam', label: OPTS.adam.name }], from: 'try2', to: 'schedule' },
    { id: 'opt', kind: 'choice', label: { es: 'Optimizador', en: 'Optimizer' }, value: 'sgd', options: [{ value: 'sgd', label: OPTS.sgd.name }, { value: 'mom', label: OPTS.mom.name }, { value: 'adam', label: OPTS.adam.name }], from: 'try2', to: 'race-result' },
    { id: 'leta', kind: 'slider', label: { es: 'Tasa de aprendizaje η', en: 'Learning rate η' }, min: -2.5, max: -0.5, step: 0.025, value: -1.3, from: 'try2', to: 'race-result', fmt: (v, l) => (10 ** v).toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) },
    { id: 'train2', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'try2', to: 'race-result' },
    { id: 'clear2', kind: 'button', label: { es: 'Borrar intentos', en: 'Clear runs' }, from: 'try2', to: 'race-result' },
    { id: 'warm', kind: 'toggle', label: { es: `Calentamiento (${WARM} pasos)`, en: `Warmup (${WARM} steps)` }, value: false, from: 'try3', to: 'hyper' },
    { id: 'decay', kind: 'toggle', label: { es: 'Decaimiento coseno', en: 'Cosine decay' }, value: false, from: 'try3', to: 'hyper' },
    { id: 'train3', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'try3', to: 'hyper' },
  ],

  action(S, id) {
    if (id === 'train1') {
      const g = G1(S), B = 2 ** (S.p.batch ?? 3), steps = Math.ceil(BUDGET / B), seed = 11 + g.count++;
      g.cur = { run: train(BOWL, 'sgd', ETA_BOWL, B, seed, steps, { start: START_BOWL }), k: 0, speed: Math.max(steps / 3.2, 3), done: false, opt: 'sgd', eta: ETA_BOWL, B, tone: 'w', shape: 'circle', seed };
    } else if (id === 'clear1') { const n = G1(S).count; S.st.g1 = { ...G1(S), cur: null, runs: [], count: n }; }
    else if (id === 'train2') {
      const g = G2(S), opt = (S.p.opt ?? 'sgd') as Opt, eta = 10 ** (S.p.leta ?? -1.3), seed = 7 + g.count++;
      g.cur = { run: train(CANYON, opt, eta, 32, seed, T_RACE, { start: START_NEAR, thr: THR }), k: 0, speed: 26, done: false, opt, eta, B: 32, tone: OPTS[opt].tone, shape: OPTS[opt].shape, seed };
    } else if (id === 'clear2') { const g = G2(S); S.st.g2 = { cur: null, runs: [], count: g.count, best: g.best }; }
    else if (id === 'train3') {
      const g = G3(S), warm = !!S.p.warm, decay = !!S.p.decay, sched = schedOf(warm, decay);
      g.count++; g.warm = warm; g.decay = decay; g.sched = sched; g.verdict = '';
      g.cur = { run: train(CANYON, 'sgd', 0.07, 32, 3, T_SCHED, { start: START_HIGH, sched, thr: THR }), k: 0, speed: 40, done: false, opt: 'sgd', eta: 0.07, B: 32, tone: 'w', shape: 'circle', seed: 3 };
    }
  },

  update(S) {
    const g1 = G1(S);
    if (advance(S, g1.cur) && g1.cur) {
      const a = g1.cur, fl = finalLoss(a); g1.runs.push(a); if (g1.runs.length > 5) g1.runs.shift();
      if (!g1.tried.includes(a.B)) g1.tried.push(a.B);
      g1.best = Math.min(g1.best, fl);
      if (g1.tried.length >= 3 && g1.best < THR) S.complete('batch');
    }
    const g2 = G2(S);
    if (advance(S, g2.cur) && g2.cur) {
      const a = g2.cur; g2.runs.push(a); if (g2.runs.length > 6) g2.runs.shift();
      if (a.run.hit >= 0 && a.run.divAt < 0 && (!g2.best[a.opt] || a.run.hit < g2.best[a.opt]!.run.hit)) g2.best[a.opt] = a;
      if (g2.best.sgd && g2.best.mom && g2.best.adam) S.complete('race');
    }
    const g3 = G3(S);
    if (advance(S, g3.cur) && g3.cur) {
      const a = g3.cur, fl = finalLoss(a);
      g3.verdict = a.run.divAt >= 0 ? 'div' : fl < THR ? 'ok' : 'bounce';
      if (g3.verdict === 'ok') S.complete('sched');
    }
  },

  render(S) {
    const R = regions(S, S.portrait ? 0.64 : 0.68);
    const aTrade = S.at('tradeoff', 0, 0.6), aReal = S.at('real-batch', 0, 0.6), aCan = S.at('canyon', 0, 0.7), aHyper = S.at('hyper', 0, 0.6),
      aSearch = S.at('search', 0, 0.6), aRealCard = S.at('real', 0, 0.6), aRecap = S.at('recap', 0, 0.6), aBridge = S.at('bridge', 0, 0.6);
    if (aTrade < 1) S.d.withAlpha(1 - aTrade, () => drawBowlLayer(S, R));
    if (aTrade > 0 && aReal < 1) S.d.withAlpha(aTrade * (1 - aReal), () => drawTradeoff(S, R));
    if (aReal > 0 && aCan < 1) S.d.withAlpha(aReal * (1 - aCan), () => drawRealBatch(S, R));
    if (aCan > 0 && aHyper < 1) S.d.withAlpha(aCan * (1 - aHyper), () => drawCanyonLayer(S, R));
    if (aHyper > 0 && aSearch < 1) S.d.withAlpha(aHyper * (1 - aSearch), () => drawHyper(S, R));
    if (aSearch > 0 && aRealCard < 1) S.d.withAlpha(aSearch * (1 - aRealCard), () => drawSearch(S, R));
    if (aRealCard > 0 && aRecap < 1) S.d.withAlpha(aRealCard * (1 - aRecap), () => drawRealCard(S, R));
    if (aRecap > 0 && aBridge < 1) S.d.withAlpha(aRecap * (1 - aBridge), () => drawRecap(S, R));
    if (aBridge > 0) S.d.withAlpha(aBridge, () => drawBridge(S));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Fase 1: lotes y épocas sobre el cuenco
// ═════════════════════════════════════════════════════════════════════════
function deckState(seed: number, B: number, cur: number): (i: number) => 0 | 1 | 2 {
  if (cur <= 0) return () => 0;
  const e = Math.floor(((cur - 1) * B) / N), lo = ((cur - 1) * B) % N, { pos } = epochOrder(seed, e);
  return (i) => { const q = pos[i]; return q >= lo && q < lo + B ? 2 : q < lo ? 1 : 0; };
}

function drawBowlLayer(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u;
  const inT1 = S.between('try1', 'tradeoff');
  const g1 = G1(S);
  // ── rectángulo de la baraja: del centro (gancho) al lateral ──
  const sz = Math.min(R.all.w * 0.5, R.all.h * 0.6);
  const hook: Rect = { x: R.all.x + R.all.w / 2 - sz / 2, y: R.all.y + R.all.h * 0.1, w: sz, h: sz };
  const { deck: deckR, info } = asideSplit(S, R.aside);
  const mv = ease.io(S.at('toy', 0.1, 1.4, 'lin'));
  const dk = lerpRect(hook, deckR, mv);

  // ── qué lote y qué paso se muestran ──
  let state: (i: number) => 0 | 1 | 2 = () => 1, batch: { idx: ArrayLike<number>; lo: number; hi: number } | null = null;
  let run: Run | null = null, k = 0, mode = 'idle';
  const T = (id: string) => S.since(id);
  if (inT1) {
    mode = 'g1';
    const a = g1.cur ?? g1.runs[g1.runs.length - 1] ?? null;
    if (a) { k = a.k; run = a.run; const cur = Math.floor(a.k); if (cur > 0) { const e = Math.floor(((cur - 1) * a.B) / N), lo = ((cur - 1) * a.B) % N; batch = { idx: epochOrder(a.seed, e).perm, lo, hi: lo + a.B }; } state = a.done && !g1.cur ? () => 1 : deckState(a.seed, a.B, Math.floor(a.k)); }
  } else if (S.on('cheap')) {
    mode = 'cheap';
    const q = S.at('cheap', 0.9, 6.2, 'lin'), s8 = SGD8(); run = s8; k = q * 128;
    state = deckState(BOWL_SEED, 8, Math.floor(k)); const cur = Math.floor(k);
    if (cur > 0) { const e = Math.floor(((cur - 1) * 8) / N), lo = ((cur - 1) * 8) % N; batch = { idx: epochOrder(BOWL_SEED, e).perm, lo, hi: lo + 8 }; }
  } else if (S.on('epoch')) {
    mode = 'epoch'; run = SGD8(); k = 32 + 32 * S.at('epoch', 1.5, 7.5, 'lin');
    state = deckState(BOWL_SEED, 8, Math.floor(k)); const cur = Math.floor(k);
    if (cur > 0) { const e = Math.floor(((cur - 1) * 8) / N), lo = ((cur - 1) * 8) % N; batch = { idx: epochOrder(BOWL_SEED, e).perm, lo, hi: lo + 8 }; }
  } else if (S.on('sgd')) {
    mode = 'sgd'; run = SGD8(); k = 32 * S.at('sgd', 1.0, 8.4, 'lin');
    state = deckState(BOWL_SEED, 8, Math.floor(k)); const cur = Math.floor(k);
    if (cur > 0) { const e = Math.floor(((cur - 1) * 8) / N), lo = ((cur - 1) * 8) % N; batch = { idx: epochOrder(BOWL_SEED, e).perm, lo, hi: lo + 8 }; }
  } else if (S.on('bigger')) {
    mode = 'bigger';
    const j = clamp(Math.floor((T('bigger') - 0.3) / 2.4), 0, 3), B = [2, 8, 32, 128][j], n = Math.floor(clamp((T('bigger') - 0.3 - j * 2.4) / 0.08, 0, 24));
    batch = { idx: fanIdx(Math.max(0, n - 1), B), lo: 0, hi: B }; state = (i) => { const q = batch!.idx; for (let t = 0; t < B; t++) if (q[t] === i) return 2; return 0; };
  } else if (S.on('noisy')) {
    mode = 'noisy';
    const n = Math.floor(clamp((T('noisy') - 0.8) / 0.14, 0, 24));
    batch = { idx: fanIdx(Math.max(0, n - 1), 8), lo: 0, hi: 8 }; state = (i) => { const q = batch!.idx; for (let t = 0; t < 8; t++) if (q[t] === i) return 2; return 0; };
  } else if (S.on('sample')) {
    mode = 'sample';
    const hi = S.reveal('sample', 3.2, 0.5) > 0.01, ord = epochOrder(BOWL_SEED, 0).perm;
    if (hi) { batch = { idx: ord, lo: 0, hi: 8 }; state = (i) => (epochOrder(BOWL_SEED, 0).pos[i] < 8 ? 2 : 0); }
  } else if (S.on('full')) { mode = 'full'; state = () => 2; }
  else mode = 'idle';

  // ── baraja ──
  const visible = Math.floor(N * S.at('hook', 0.2, 2.2, 'lin'));
  deck(S, dk, { state, visible, frame: S.on('toy') });
  // rótulos del gancho
  const hookA = 1 - S.at('toy', 0, 0.6);
  if (hookA > 0.01) {
    d.withAlpha(hookA, () => {
      d.text(S.l('256 ejemplos', '256 examples'), hook.x + hook.w / 2, hook.y + hook.h + 12 * u, { size: FS(S, 22), weight: 800, color: p.ink, align: 'center', base: 'top' });
      d.withAlpha(S.reveal('hook', 3.2, 0.7), () => d.text(S.l('modelo de juguete · un modelo real: millones', 'toy model · a real model: millions'), hook.x + hook.w / 2, hook.y + hook.h + 12 * u + FS(S, 22) * u * 1.3, { size: FS(S, 14), weight: 600, color: p.mute, align: 'center', base: 'top' }));
    });
  }

  // ── paisaje ──
  const land = S.reveal('toy', 0.2, 0.7);
  if (land > 0.01) {
    const v = landView(S, R.main, BOWL);
    d.withAlpha(land, () => { d.rect(v.r.x, v.r.y, v.r.w, v.r.h, { fill: alpha(p.surface, 0.5) }); });
    drawLand(S, v, S.reveal('average', 0, 0.9));
    drawAxisNames(S, v, land);
    drawCloud(S, v, { appear: S.at('toy', 0.7, 2.6, 'lin'), batch, a: land });
    if (S.on('average')) drawMin(S, v, S.reveal('average', 0.9, 0.5));
    if (S.on('toy') && !S.on('average')) d.withAlpha(S.reveal('toy', 2.8, 0.6), () => badge(S, S.l('un punto = un ejemplo', 'one dot = one example'), v.r.x + 10 * u, v.r.y + 40 * u, { tone: 'dat', align: 'left' }));
    drawBowlStory(S, v, mode, run, k);
    d.withAlpha(land, () => d.text(S.l('modelo de juguete', 'toy model'), v.r.x + v.r.w - 6, v.r.y + 5, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage }));
  }

  // ── lateral ──
  asideBowl(S, info, mode, run, k);
}

function drawBowlStory(S: Frame, v: LView, mode: string, run: Run | null, k: number) {
  const { d, pal: p } = S, u = S.u;
  if (!S.on('full')) return;
  drawStart(S, v, START_BOWL, S.reveal('full', 0.2, 0.5), S.l('inicio', 'start'));
  if (S.between('full', 'sample')) {
    const kk = clamp((S.since('full') - 1.0) / 0.7, 0, 12);
    drawRun(S, v, FULL(), kk, { tone: 'ink', shape: 'square', lw: 2.2 });
    return;
  }
  if (S.between('sample', 'noisy')) {
    const gT = grad(BOWL, START_BOWL[0], START_BOWL[1]);
    const idx = epochOrder(BOWL_SEED, 0).perm, gB = grad(BOWL, START_BOWL[0], START_BOWL[1], idx, 0, 8);
    const aC = S.reveal('sample', 5.4, 0.6), aA = S.reveal('sample', 6.4, 0.6);
    if (aC > 0.01) {
      const c = batchCenter(idx, 0, 8), [cx, cyy] = v.pt(c), [sx, sy] = v.pt(START_BOWL);
      d.withAlpha(aC, () => { d.line(sx, sy, cx, cyy, tone(S, 'sig').c, 1.4, [4, 4]); const r = 5 * u; d.line(cx - r, cyy - r, cx + r, cyy + r, tone(S, 'sig').ink, 2.6); d.line(cx - r, cyy + r, cx + r, cyy - r, tone(S, 'sig').ink, 2.6); });
    }
    if (aA > 0.01) { descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3, a: aA, scale: 9, max: 100 }); descentArrow(S, v, START_BOWL, gB, { tone: 'err', lw: 3, a: aA, scale: 9, max: 100 }); }
    return;
  }
  if (S.between('noisy', 'sgd')) {
    const isBig = S.on('bigger');
    const j = isBig ? clamp(Math.floor((S.since('bigger') - 0.3) / 2.4), 0, 3) : 0, B = isBig ? [2, 8, 32, 128][j] : 8;
    const t0 = isBig ? S.since('bigger') - 0.3 - j * 2.4 : S.since('noisy') - 0.8, n = Math.floor(clamp(t0 / (isBig ? 0.08 : 0.14), 0, 24));
    const f = fan(B), gT = grad(BOWL, START_BOWL[0], START_BOWL[1]);
    const fade = isBig ? clamp(1 - (t0 - 2.1) / 0.3) : 1;
    for (let i = 0; i < n; i++) descentArrow(S, v, START_BOWL, f[i].g, { tone: 'err', lw: 2, a: 0.5 * fade, scale: 9, max: 100 });
    descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, a: 1, scale: 9, max: 100 });
    drawStart(S, v, START_BOWL, 1);
    if (isBig) {
      const rel = f.reduce((s, e) => s + e.rel, 0) / f.length;
      d.text(S.l(`lote de ${B}`, `batch of ${B}`), v.r.x + 10 * u, v.r.y + 28 * u, { size: FS(S, 20), weight: 800, color: p.ink, base: 'top', halo: p.stage });
      d.text(S.l(`desvío medio de la flecha: ${S.n(rel * 100, 0)} %`, `average arrow error: ${S.n(rel * 100, 0)} %`), v.r.x + 10 * u, v.r.y + 28 * u + FS(S, 20) * u * 1.3, { size: FS(S, 13), weight: 700, color: tone(S, 'err').ink, base: 'top', halo: p.stage });
    }
    return;
  }
  // de sgd en adelante: un camino de lotes
  drawStart(S, v, START_BOWL, 1);
  if (mode === 'cheap') {
    const q = S.at('cheap', 0.9, 6.2, 'lin'), seen = q * BUDGET;
    const f = FULL(), s8 = SGD8();
    drawRun(S, v, f, Math.min(4, seen / 256), { tone: 'ink', shape: 'square', lw: 2.4 });
    const cur = drawRun(S, v, s8, seen / 8, { tone: 'w', shape: 'circle', lw: 2 });
    if (q > 0.98) {
      const e4 = v.pt(f.pts[4]);
      d.withAlpha(S.reveal('cheap', 6.4, 0.6), () => {
        badge(S, S.l('lote 256 · 4 pasos', 'batch 256 · 4 steps'), e4[0] + 12 * u, e4[1] - 16 * u, { tone: 'mute', align: 'left' });
        badge(S, S.l('lote 8 · 128 pasos', 'batch 8 · 128 steps'), cur[0] + 12 * u, cur[1] + 22 * u, { tone: 'w', align: 'left' });
      });
    }
    return;
  }
  if (mode === 'g1') {
    const g1 = G1(S);
    g1.runs.forEach((a, i) => { if (a === g1.cur) return; const end = drawRun(S, v, a.run, a.run.steps, { tone: 'w', a: 0.28 + 0.1 * (i / Math.max(1, g1.runs.length)), lw: 1.6, dots: false, marker: false }); void end; const e = v.pt(a.run.pts[a.run.pts.length - 1]); d.withAlpha(0.7, () => d.text(`${a.B}`, e[0] + 7 * u, e[1] - 7 * u, { size: FS(S, 12), font: 'mono', weight: 700, color: tone(S, 'w').ink, halo: p.stage })); });
    if (g1.cur) {
      const a = g1.cur; drawRun(S, v, a.run, a.k, { tone: 'w', lw: 2.4, dots: a.run.steps <= 64 });
      if (a.k > 0 && a.B > 1) { const c = a.run.centers[Math.min(a.run.centers.length - 1, Math.max(0, Math.floor(a.k) - 1))]; const [cx, cyy] = v.pt(c), r = 4.5 * u; const sg = tone(S, 'sig'); d.line(cx - r, cyy - r, cx + r, cyy + r, sg.ink, 2.4); d.line(cx - r, cyy + r, cx + r, cyy - r, sg.ink, 2.4); }
    } else if (!g1.runs.length) {
      d.text(S.l('elige un lote y pulsa Entrenar', 'pick a batch size and press Train'), v.r.x + v.r.w / 2, v.r.y + v.r.h - 12 * u, { size: FS(S, 14), weight: 700, color: p.mute, align: 'center', base: 'bottom', halo: p.stage });
    }
    return;
  }
  if (run) {
    const cur = drawRun(S, v, run, k, { tone: 'w', lw: 2, dots: k < 70 });
    const n = Math.floor(k);
    if (n > 0) { const c = run.centers[Math.min(run.centers.length - 1, n - 1)], [cx, cyy] = v.pt(c), r = 4.5 * u, sg = tone(S, 'sig'); d.line(cx - r, cyy - r, cx + r, cyy + r, sg.ink, 2.4); d.line(cx - r, cyy + r, cx + r, cyy - r, sg.ink, 2.4); }
    void cur;
  }
}

function asideBowl(S: Frame, info: Rect, mode: string, run: Run | null, k: number) {
  const { d, pal: p } = S, u = S.u;
  if (!S.on('full')) return;
  const cols = S.portrait ? 2 : 2, items: { l: string; v: string; t?: Tone; on?: boolean }[] = [];
  const g1 = G1(S);
  let rowsH = 0;
  const a = S.reveal('full', 0.3, 0.5);
  const step = Math.floor(k);
  if (mode === 'full') {
    const kk = clamp((S.since('full') - 1.0) / 0.7, 0, 12), n = Math.floor(kk), f = FULL();
    items.push({ l: S.l('pasos', 'steps'), v: String(n), t: 'ink' }, { l: S.l('ejemplos vistos', 'examples seen'), v: String(n * 256), t: 'dat' }, { l: S.l('ejemplos por paso', 'examples per step'), v: '256', t: 'dat' }, { l: S.l('error', 'loss'), v: f2(S, f.loss[n]), t: 'err' });
  } else if (mode === 'sample') {
    items.push({ l: S.l('ejemplos por paso', 'examples per step'), v: S.reveal('sample', 3.2, 0.4) > 0.5 ? '8' : '256', t: 'dat' });
    const h = readouts(S, info, items, 1, { rowH: 50, a });
    drawLegend(S, { ...info, y: info.y + h + 6 * u }, S.reveal('sample', 6.4, 0.5));
    return;
  } else if (mode === 'noisy' || mode === 'bigger') {
    drawLegend(S, info, a);
    return;
  } else if (mode === 'sgd' || mode === 'epoch') {
    const r = run!, ep = (step * 8) / N;
    items.push({ l: S.l('pasos', 'steps'), v: String(step), t: 'ink' }, { l: S.l('ejemplos vistos', 'examples seen'), v: String(step * 8), t: 'dat' }, { l: S.l('época', 'epoch'), v: S.n(ep, 2), t: 'sig' }, { l: S.l('error', 'loss'), v: f2(S, r.loss[Math.min(step, r.loss.length - 1)], 3), t: 'err' });
  } else if (mode === 'cheap') {
    const q = S.at('cheap', 0.9, 6.2, 'lin'), seen = Math.round(q * BUDGET), f = FULL(), s8 = SGD8(), n4 = Math.min(4, Math.floor(seen / 256)), n8 = Math.floor(seen / 8);
    items.push({ l: S.l('ejemplos vistos', 'examples seen'), v: `${seen} / ${BUDGET}`, t: 'dat' }, { l: S.l('presupuesto', 'budget'), v: S.l('4 épocas', '4 epochs'), t: 'ink' }, { l: S.l('lote 256', 'batch 256'), v: `${n4} ${S.l('pasos', 'steps')} · ${f2(S, f.loss[n4])}`, t: 'ink' }, { l: S.l('lote 8', 'batch 8'), v: `${n8} ${S.l('pasos', 'steps')} · ${f2(S, s8.loss[Math.min(128, n8)], 3)}`, t: 'w' });
    rowsH = readouts(S, info, items, 1, { rowH: 42, size: S.portrait ? 15 : 17, a });
    return;
  } else if (mode === 'g1') {
    const c = g1.cur ?? g1.runs[g1.runs.length - 1] ?? null;
    if (c) items.push({ l: S.l('lote', 'batch'), v: String(c.B), t: 'ink' }, { l: S.l('pasos', 'steps'), v: `${Math.floor(c.k)} / ${c.run.steps}`, t: 'ink' }, { l: S.l('ejemplos vistos', 'examples seen'), v: String(Math.round(Math.min(c.k, c.run.steps) * c.B)), t: 'dat' }, { l: S.l('error', 'loss'), v: f2(S, lossAt(c), 3), t: 'err' });
    else items.push({ l: S.l('presupuesto', 'budget'), v: S.l('1024 ejemplos (4 épocas)', '1024 examples (4 epochs)'), t: 'dat' });
  } else {
    return;
  }
  rowsH = readouts(S, info, items, cols, { rowH: S.portrait ? 44 : 50, a });
  if (mode === 'g1' && g1.runs.length) {
    const y = info.y + rowsH + 8 * u, line = g1.runs.slice().reverse().slice(0, S.portrait ? 3 : 4).map((r) => `${S.l('lote', 'batch')} ${r.B}: ${f2(S, finalLoss(r), finalLoss(r) < 0.1 ? 3 : 2)}`).join('  ·  ');
    if (y < info.y + info.h - 10 * u) d.withAlpha(a, () => { d.text(S.l('error final por intento', 'final error per run'), info.x, y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' }); d.text(line, info.x, y + FS(S, 12) * u * 1.4, { size: FS(S, 12), font: 'mono', weight: 600, color: p.ink2, base: 'top', w: info.w }); });
  }
}

function drawLegend(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, rows: [string, string, string][] = [[p.ink, S.l('flecha con todos los ejemplos', 'arrow from all the examples'), 'a'], [tone(S, 'err').c, S.l('flecha de un lote', 'arrow from one batch'), 'b']];
  d.withAlpha(a, () => rows.forEach(([c, t], i) => { const y = r.y + 14 * u + i * 40 * u; d.arrow(r.x + 2, y, r.x + 36 * u, y, c, 3, 9); d.text(t, r.x + 46 * u, y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle', w: r.w - 50 * u }); }));
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 2: la curva «tamaño del lote → error final»
// ═════════════════════════════════════════════════════════════════════════
function drawTradeoff(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u, r = R.all, curve = U_CURVE(), g1 = G1(S);
  const pl = 52 * u, pr = 14 * u, pt = 26 * u, pb = 52 * u, c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (i: number) => c.x + (i / 8) * c.w, Y = (v: number) => c.y + c.h - ((Math.log10(Math.max(1e-3, v)) + 3) / 4.2) * c.h;
  const a = S.reveal('tradeoff', 0.1, 0.6), prog = S.at('tradeoff', 0.8, 4.6, 'lin') * 8;
  d.withAlpha(a, () => {
    d.text(S.l('error final tras 4 épocas (escala log)', 'final error after 4 epochs (log scale)'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top' });
    d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
    [0.001, 0.01, 0.1, 1].forEach((v) => { d.line(c.x, Y(v), c.x + c.w, Y(v), p.line, 1); d.text(S.n(v, v < 0.01 ? 3 : v < 0.1 ? 2 : v < 1 ? 1 : 0), c.x - 6 * u, Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    curve.forEach((e, i) => d.text(String(e.B), X(i), c.y + c.h + 6 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }));
    d.text(S.l('tamaño del lote', 'batch size'), c.x + c.w / 2, c.y + c.h + 6 * u + FS(S, 12) * u * 1.5, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top' });
    const pts: [number, number][] = [];
    for (let i = 0; i <= 8; i++) { if (i > prog) break; pts.push([X(i), Y(curve[i].v)]); }
    if (prog < 8 && Math.floor(prog) < 8) { const i = Math.floor(prog), f = prog - i; pts.push([lerpN(X(i), X(i + 1), f), lerpN(Y(curve[i].v), Y(curve[i + 1].v), f)]); }
    if (pts.length > 1) d.polyline(pts, p.ink, 2.6);
    curve.forEach((e, i) => { if (i <= prog) d.circle(X(i), Y(e.v), 4 * u, { fill: p.surface, stroke: p.ink, lw: 2 }); });
    // los intentos de la persona
    g1.runs.forEach((rr) => { const i = Math.round(Math.log2(rr.B)); marker(S, X(i), Y(finalLoss(rr)), 'circle', 'w', 6); });
    if (g1.runs.length) badge(S, S.l('tus intentos', 'your runs'), c.x + c.w - 8 * u, c.y + 14 * u, { tone: 'w', align: 'right' });
  });
  // anotaciones
  const best = curve.reduce((m, e, i) => (e.v < curve[m].v ? i : m), 0);
  d.withAlpha(S.reveal('tradeoff', 5.4, 0.6), () => {
    badge(S, S.l('pocos pasos, limpios', 'few steps, clean'), X(7.2), Y(curve[7].v) - 32 * u, { tone: 'mute', align: 'center' });
    badge(S, S.l('muchos pasos, ruidosos', 'many steps, noisy'), X(1.1), Y(curve[0].v) - 32 * u, { tone: 'mute', align: 'center' });
    badge(S, S.l(`mejor: ${curve[best].B}`, `best: ${curve[best].B}`), X(best), Y(curve[best].v) + 26 * u, { tone: 'dat', align: 'center' });
  });
  d.withAlpha(S.reveal('tradeoff', 6.4, 0.6), () => d.text(S.l('(con esta tasa y este presupuesto; ilustrativo)', '(for this rate and budget; illustrative)'), r.x + r.w, r.y + r.h, { size: FS(S, 12), color: p.mute, align: 'right', base: 'bottom' }));
}
const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

// ═════════════════════════════════════════════════════════════════════════
// Fase 3: el lote a escala real (GPT-3)
// ═════════════════════════════════════════════════════════════════════════
function drawRealBatch(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const pl = 60 * u, pr = 16 * u, pt = 48 * u, pb = 56 * u, c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (t: number) => c.x + t * c.w, Y = (v: number) => c.y + c.h - v * c.h;
  const a = S.reveal('real-batch', 0.1, 0.6), prog = S.at('real-batch', 1.0, 4.5, 'lin');
  const wt = tone(S, 'w');
  d.withAlpha(a, () => {
    d.text(S.l('GPT-3 · tamaño del lote durante el entrenamiento', 'GPT-3 · batch size during training'), r.x, r.y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' });
    d.text(S.l('lote medido en tokens', 'batch measured in tokens'), r.x, r.y + FS(S, 14) * u * 1.4, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
    d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
    d.text(S.l('3,2 millones', '3.2 million'), c.x - 6 * u, Y(1), { size: FS(S, 13), font: 'mono', weight: 700, color: wt.ink, align: 'right', base: 'middle' });
    d.text(S.l('32 mil', '32 thousand'), c.x - 6 * u, Y(0.01), { size: FS(S, 13), font: 'mono', weight: 700, color: wt.ink, align: 'right', base: 'middle' });
    d.line(c.x, Y(1), c.x + c.w, Y(1), p.line, 1, [4, 4]);
    d.text(S.l('tokens vistos →', 'tokens seen →'), c.x + c.w, c.y + c.h + 8 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    const t1 = 0.3, pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * prog; if (t > 1) break; const v = t < t1 ? 0.01 + 0.99 * (t / t1) : 1; pts.push([X(t), Y(v)]); }
    if (pts.length > 1) d.polyline(pts, wt.c, 3.4);
    if (pts.length) { const q = pts[pts.length - 1]; marker(S, q[0], q[1], 'circle', 'w', 6.5); }
  });
  d.withAlpha(S.reveal('real-batch', 5.4, 0.6), () => {
    const x0 = X(0), x1 = X(0.3), y = c.y + c.h + 24 * u;
    d.line(x0, y, x1, y, p.ink2, 1.6); d.line(x0, y - 4 * u, x0, y + 4 * u, p.ink2, 1.6); d.line(x1, y - 4 * u, x1, y + 4 * u, p.ink2, 1.6);
    d.text(S.l('primeros 4 a 12 mil millones de tokens, según el tamaño del modelo', 'first 4 to 12 billion tokens, depending on model size'), x0, y + 6 * u, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'top', w: Math.min(c.w * 0.9, 520 * u) });
  });
  d.withAlpha(S.reveal('real-batch', 6.4, 0.6), () => d.text('Brown et al., 2020 · Tabla 2.1 y Apéndice B', r.x + r.w, r.y + r.h, { size: FS(S, 12), color: p.mute, align: 'right', base: 'bottom' }));
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 4: el cañón y los optimizadores
// ═════════════════════════════════════════════════════════════════════════
function legend(S: Frame, x: number, y: number, items: { tone: Tone; shape: Shape; text: string; dash?: boolean; a?: number }[], a = 1) {
  const { d, pal: p } = S, u = S.u, sz = FS(S, 13), rh = sz * u * 1.55;
  const wmax = Math.max(...items.map((it) => d.measure(it.text, { size: sz, weight: 700 })));
  d.withAlpha(a, () => {
    d.rect(x, y, wmax + 44 * u, rh * items.length + 8 * u, { fill: alpha(p.stage, 0.88), stroke: p.line, lw: 1, r: 3 });
    items.forEach((it, i) => {
      const yy = y + 4 * u + i * rh + rh / 2, c = tone(S, it.tone);
      d.withAlpha(it.a ?? 1, () => {
        if (it.dash) d.line(x + 6 * u, yy, x + 26 * u, yy, c.c, 2.4, [4, 3]); else d.line(x + 6 * u, yy, x + 26 * u, yy, c.c, 2.4);
        marker(S, x + 16 * u, yy, it.shape, it.tone, 4.2);
        d.text(it.text, x + 34 * u, yy, { size: sz, weight: 700, color: p.ink, base: 'middle' });
      });
    });
  });
}

function cross(S: Frame, v: LView, p0: V2, color: string) {
  const [x, y] = v.pt(p0), r = 6 * S.u; S.d.line(x - r, y - r, x + r, y + r, color, 2.4); S.d.line(x - r, y + r, x + r, y - r, color, 2.4);
}

function drawCanyonLayer(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u;
  const v = landView(S, R.main, CANYON), high = S.on('warm-problem');
  d.rect(v.r.x, v.r.y, v.r.w, v.r.h, { fill: alpha(p.surface, 0.5) });
  drawLand(S, v, 1);
  drawAxisNames(S, v, 1);
  drawCloud(S, v, { dim: 0.55, a: 0.8 });
  drawMin(S, v, 1, !S.on('adam-idea'));
  drawStart(S, v, high ? START_HIGH : START_NEAR, S.reveal('canyon', 1.0, 0.5), S.on('sgd-big') && !S.on('sgd-small') ? S.l('inicio', 'start') : high && S.between('warm-problem', 'warmup') ? S.l('pesos recién iniciados', 'freshly initialized weights') : undefined);
  d.text(S.l('paisaje de juguete', 'toy landscape'), v.r.x + v.r.w - 6, v.r.y + 5, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage });
  const T = (id: string) => S.since(id);
  const ls = (id: string, a = 1) => S.reveal(id, 0.4, 0.5) * a;

  // ── aside: se compone por tramos ──
  const aside = R.aside;
  const chartRect = S.portrait ? { x: aside.x, y: aside.y, w: aside.w * 0.56, h: aside.h } : { x: aside.x, y: aside.y, w: aside.w, h: aside.h * 0.46 };
  const infoRect: Rect = S.portrait ? { x: aside.x + aside.w * 0.58, y: aside.y, w: aside.w * 0.42, h: aside.h } : { x: aside.x, y: aside.y + aside.h * 0.5, w: aside.w, h: aside.h * 0.5 };

  if (S.between('canyon', 'sgd-big')) {
    const along = [toXY(0.5, -0.25), toXY(2.4, -0.25)], across = [toXY(-1.3, -0.8), toXY(-1.3, 0.8)];
    d.withAlpha(S.reveal('canyon', 2.2, 0.6), () => {
      const [a0, a1] = along.map((q) => v.pt(q)), [b0, b1] = across.map((q) => v.pt(q)), mid = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
      d.arrow(a0[0], a0[1], a1[0], a1[1], p.ink, 3, 10);
      badge(S, S.l('fondo: casi plano', 'bottom: almost flat'), (a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2 + 22 * u, { tone: 'dat' });
      d.arrow(mid[0], mid[1], b0[0], b0[1], p.ink, 3, 10); d.arrow(mid[0], mid[1], b1[0], b1[1], p.ink, 3, 10);
      badge(S, S.l('paredes: empinadas', 'walls: steep'), mid[0] + (S.portrait ? 40 : 70) * u, mid[1], { tone: 'err' });
    });
    // lateral: curvatura a lo largo y a lo ancho (números reales del modelo)
    const rows = [
      { label: S.l('a lo largo del fondo', 'along the bottom'), value: CANYON.H1, text: S.n(CANYON.H1, 1), tone: 'dat' as Tone, a: S.reveal('canyon', 3.4, 0.5) },
      { label: S.l('a través de las paredes', 'across the walls'), value: h2eff(CANYON), text: S.n(h2eff(CANYON), 0), tone: 'err' as Tone, a: S.reveal('canyon', 4.4, 0.5) },
    ];
    d.withAlpha(S.reveal('canyon', 3.0, 0.5), () => {
      d.text(S.l('curvatura: qué tan rápido cambia la pendiente', 'curvature: how fast the slope changes'), aside.x, aside.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top', w: aside.w });
      hbars(S, { x: aside.x, y: aside.y + 46 * u, w: aside.w, h: 90 * u }, rows, { max: h2eff(CANYON), labelW: S.portrait ? 120 : 92, rowH: 36 * u });
    });
    d.withAlpha(S.reveal('canyon', 5.4, 0.6), () => d.text(S.l(`la pared es unas ${S.n(h2eff(CANYON) / CANYON.H1, 0)} veces más empinada`, `the wall is about ${S.n(h2eff(CANYON) / CANYON.H1, 0)} times steeper`), aside.x, aside.y + (S.portrait ? 100 : 150) * u, { size: FS(S, 13.5), weight: 800, color: p.ink, base: 'top', w: aside.w }));
    return;
  }

  // ── tramos con corridas narradas ──
  if (S.between('sgd-big', 'sgd-small')) {
    const A = R_SGD_A(), Bd = R_SGD_DIV(), t = T('sgd-big');
    const kA = clamp((t - 0.8) * 10, 0, 80), tB = t - 8.0, kB = clamp(tB * 5, 0, 6), fadeA = clamp(1 - tB / 0.5) * 0.65 + 0.35;
    drawRun(S, v, A, kA, { tone: 'w', lw: 2.2, a: tB > 0 ? fadeA : 1, marker: tB <= 0 });
    if (tB > 0) { drawRun(S, v, Bd, kB, { tone: 'err', shape: 'square', lw: 2.6 }); if (kB >= Bd.divAt - 1) { d.withAlpha(S.reveal('sgd-big', 8.8, 0.3), () => badge(S, S.l('¡diverge!', 'diverges!'), v.r.x + v.r.w / 2, v.r.y + v.r.h * 0.28, { tone: 'err' })); } }
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'w', shape: 'circle', text: 'SGD · η = ' + S.n(0.08, 2) }, ...(tB > 0 ? [{ tone: 'err' as Tone, shape: 'square' as Shape, text: 'SGD · η = ' + S.n(0.11, 2) }] : [])], ls('sgd-big'));
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: A, k: kA, tone: 'w', a: tB > 0 ? 0.5 : 1 }, ...(tB > 0 ? [{ run: Bd, k: kB, tone: 'err' as Tone, dash: [5, 3] }] : [])], 100, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(tB > 0 ? kB : kA)), t: 'ink' }, { l: S.l('error', 'loss'), v: sigLoss(tB > 0 ? Bd.loss[Math.min(Math.floor(kB), Bd.loss.length - 1)] : A.loss[Math.min(Math.floor(kA), 100)], S), t: 'err' }]);
    return;
  }
  if (S.between('sgd-small', 'momentum')) {
    const Rr = R_SGD_SMALL(), A = R_SGD_A(), t = T('sgd-small'), k = clamp((t - 0.6) * 12, 0, 120);
    drawRun(S, v, A, 80, { tone: 'w', lw: 1.6, a: 0.25, dots: false, marker: false });
    drawRun(S, v, Rr, k, { tone: 'w', lw: 2.4 });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'w', shape: 'circle', text: 'SGD · η = ' + S.n(0.02, 2) }], ls('sgd-small'));
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: Rr, k, tone: 'w' }], 120, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'loss'), v: f2(S, Rr.loss[Math.min(Math.floor(k), 120)], 2), t: 'err' }]);
    return;
  }
  if (S.between('momentum', 'momentum-cost')) {
    const sg = R_SGD_REF(), mo = R_MOM(), t = T('momentum'), k = clamp((t - 0.8) * 12, 0, 70);
    drawRun(S, v, sg, k, { tone: 'w', lw: 1.8, a: 0.8 });
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 2.6 });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'w', shape: 'circle', text: 'SGD · η = ' + S.n(0.06, 3) }, { tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') + ' · η = ' + S.n(0.015, 3) }], ls('momentum'));
    d.withAlpha(S.reveal('momentum', 3.4, 0.6), () => {
      const x = v.r.x + 10 * u, y = v.r.y + v.r.h - 12 * u, sz = FS(S, 14);
      d.text('v ← 0,9·v + g'.replace(',', S.lang === 'es' ? ',' : '.'), x, y - sz * u * 1.5, { size: sz, font: 'mono', weight: 700, color: tone(S, 'sig').ink, base: 'bottom', halo: p.stage });
      d.text('w ← w − η·v', x, y, { size: sz, font: 'mono', weight: 700, color: p.ink, base: 'bottom', halo: p.stage });
    });
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: sg, k, tone: 'w' }, { run: mo, k, tone: 'sig' }], 100, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: 'SGD', v: f2(S, sg.loss[Math.min(Math.floor(k), 120)], 2), t: 'w' }, { l: S.l('Momento', 'Momentum'), v: f2(S, mo.loss[Math.min(Math.floor(k), 120)], 2), t: 'sig' }]);
    return;
  }
  if (S.between('momentum-cost', 'adam-idea')) {
    const mo = R_MOM(), t = T('momentum-cost'), k = clamp((t - 0.6) * 8, 0, 90);
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 2.6 });
    const n = Math.min(mo.pts.length - 2, Math.floor(k));
    if (n >= 1) { const p0 = mo.pts[n], p1 = mo.pts[n + 1], [x0, y0] = v.pt(p0), [x1, y1] = v.pt(p1); d.arrow(x0, y0, x0 + (x1 - x0) * 5, y0 + (y1 - y0) * 5, tone(S, 'sig').ink, 2.2, 8); }
    let imax = 0, umax = -9; mo.pts.forEach((q, i) => { const uu = toUV(q[0], q[1])[0]; if (i < 90 && uu > umax) { umax = uu; imax = i; } });
    if (k > imax && umax > 0.08) { const [ox, oy] = v.pt(mo.pts[imax]); d.withAlpha(S.reveal('momentum-cost', 5.2, 0.5), () => badge(S, S.l('se pasa de largo', 'overshoots'), ox, oy - 26 * u, { tone: 'sig' })); }
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') + ' · η = ' + S.n(0.015, 3) }, ], 1);
    d.text(S.l('flecha: la velocidad', 'arrow: the velocity'), v.r.x + 10 * u, v.r.y + v.r.h - 12 * u, { size: FS(S, 13), weight: 700, color: tone(S, 'sig').ink, base: 'bottom', halo: p.stage });
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: mo, k, tone: 'sig' }], 100, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'loss'), v: f2(S, mo.loss[Math.min(Math.floor(k), 120)], 3), t: 'err' }]);
    return;
  }
  if (S.between('adam-idea', 'adam-how')) {
    const ad = R_ADAM(), mo = R_MOM(), t = T('adam-idea'), k = clamp((t - 0.8) * 12, 0, 40);
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 1.8, a: 0.5, dots: false });
    drawRun(S, v, ad, k, { tone: 'lat', shape: 'diamond', lw: 2.6 });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') }, { tone: 'lat', shape: 'diamond', text: 'Adam · η = ' + S.n(0.25, 2) }], ls('adam-idea'));
    drawWeightBars(S, aside, S.reveal('adam-idea', 0.5, 0.5), [S.reveal('adam-idea', 3.6, 0.5), S.reveal('adam-idea', 5.0, 0.5), S.reveal('adam-idea', 6.6, 0.5)]);
    return;
  }
  if (S.between('adam-how', 'adam-honest')) {
    const ad = R_ADAM(), mo = R_MOM();
    drawRun(S, v, mo, 40, { tone: 'sig', shape: 'square', lw: 1.6, a: 0.35, dots: false, marker: false });
    drawRun(S, v, ad, 40, { tone: 'lat', shape: 'diamond', lw: 2.6 });
    drawAdamBoxes(S, aside, T('adam-how'));
    return;
  }
  if (S.between('adam-honest', 'try2')) {
    const ad = R_ADAM(), t = T('adam-honest'), k = 40 + clamp((t - 0.5) * 14, 0, 80);
    drawRun(S, v, ad, k, { tone: 'lat', shape: 'diamond', lw: 2.4, dots: false });
    d.withAlpha(S.reveal('adam-honest', 3.6, 0.6), () => { const [mx, my] = v.pt([0, 0]); badge(S, S.l('rebota alrededor del fondo', 'bounces around the bottom'), mx + (S.portrait ? 4 : 30) * u, my - 46 * u, { tone: 'lat' }); });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'lat', shape: 'diamond', text: 'Adam · η = ' + S.n(0.25, 2) + S.l(' (constante)', ' (constant)') }], 1);
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: ad, k, tone: 'lat' }], 120, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'loss'), v: f2(S, ad.loss[Math.min(Math.floor(k), 120)], 3), t: 'err' }]);
    return;
  }
  if (S.between('try2', 'race-result')) { drawRace(S, v, aside, chartRect, infoRect); return; }
  if (S.between('race-result', 'schedule')) { drawRaceResult(S, v, aside); return; }
  if (S.between('schedule', 'warm-problem')) {
    const c = R_ADAM_C(), dd = R_ADAM_D(), t = T('schedule'), k = clamp((t - 0.8) * 14, 0, 100);
    drawRun(S, v, c, k, { tone: 'lat', shape: 'diamond', lw: 1.8, dash: [5, 4], dots: false, a: 0.9 });
    drawRun(S, v, dd, k, { tone: 'dat', shape: 'square', lw: 2.8, dots: false });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'lat', shape: 'diamond', text: S.l('tasa constante', 'constant rate'), dash: true }, { tone: 'dat', shape: 'square', text: S.l('tasa que decae', 'decaying rate') }], ls('schedule'));
    drawAsideTwo(S, aside, [{ run: c, k, tone: 'lat', dash: [5, 4] }, { run: dd, k, tone: 'dat' }], 100, [{ etas: c.etas, tone: 'lat', dash: [5, 4], k }, { etas: dd.etas, tone: 'dat', k }], 0.35, S.reveal('schedule', 0.5, 0.5));
    return;
  }
  if (S.between('warm-problem', 'warmup')) {
    const r = R_HIGH_DIV(), t = T('warm-problem'), k = clamp((t - 1.2) * 2.2, 0, 4);
    drawRun(S, v, r, k, { tone: 'err', shape: 'square', lw: 3 });
    if (k >= r.divAt - 0.2) d.withAlpha(S.reveal('warm-problem', 3.0, 0.4), () => { badge(S, S.l('¡diverge! sale del mapa', 'diverges! off the map'), v.r.x + v.r.w / 2, v.r.y + v.r.h * 0.3, { tone: 'err' }); });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'err', shape: 'square', text: 'SGD · η = ' + S.n(0.07, 2) + S.l(' (constante)', ' (constant)') }], ls('warm-problem'));
    drawAsideLoss(S, aside, chartRect, infoRect, [{ run: r, k, tone: 'err' }], T_SCHED, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'loss'), v: sigLoss(r.loss[Math.min(Math.floor(k), r.loss.length - 1)], S), t: 'err' }]);
    return;
  }
  if (S.between('warmup', 'try3')) {
    const r = R_HIGH_OK(), t = T('warmup'), k = clamp((t - 0.8) * 26, 0, T_SCHED);
    drawRun(S, v, r, k, { tone: 'w', lw: 2.4, dots: false });
    legend(S, v.r.x + 8 * u, v.r.y + 28 * u, [{ tone: 'w', shape: 'circle', text: 'SGD · η = ' + S.n(0.07, 2) + S.l(' + calendario', ' + schedule') }], ls('warmup'));
    drawAsideTwo(S, aside, [{ run: r, k, tone: 'w' }], T_SCHED, [{ etas: r.etas, tone: 'w', k }], 0.08, S.reveal('warmup', 0.3, 0.5));
    return;
  }
  if (S.on('try3')) { drawTry3(S, v, aside, chartRect, infoRect); return; }
}

// ── lateral con curva de error y lecturas ──
function drawAsideLoss(S: Frame, aside: Rect, chartRect: Rect, infoRect: Rect, series: Series[], T: number, items: { l: string; v: string; t?: Tone }[]) {
  const a = S.reveal('canyon', 0.2, 0.5);
  lossChart(S, chartRect, series, { T, thr: THR, a, title: S.l('error (escala log)', 'loss (log scale)') });
  readouts(S, infoRect, items, S.portrait ? 1 : 2, { rowH: S.portrait ? 40 : 48, size: S.portrait ? 17 : 21, a });
}

function drawAsideTwo(S: Frame, aside: Rect, series: Series[], T: number, etas: { etas: number[]; tone: Tone; dash?: number[]; k: number }[], etaMax: number, a: number) {
  const g = 10 * S.u;
  const [r1, r2]: Rect[] = S.portrait ? [{ x: aside.x, y: aside.y, w: aside.w * 0.49, h: aside.h }, { x: aside.x + aside.w * 0.51, y: aside.y, w: aside.w * 0.49, h: aside.h }] : [{ x: aside.x, y: aside.y, w: aside.w, h: (aside.h - g) / 2 }, { x: aside.x, y: aside.y + (aside.h + g) / 2, w: aside.w, h: (aside.h - g) / 2 }];
  etaChart(S, r1, etas.map((e) => ({ ...e })), { T, max: etaMax, a, title: S.l('tasa η', 'rate η'), cursor: Math.min(...etas.map((e) => e.k)) });
  lossChart(S, r2, series, { T, thr: THR, a, title: S.l('error (escala log)', 'loss (log scale)'), small: S.portrait });
}

function drawWeightBars(S: Frame, r: Rect, a: number, reveal: number[]) {
  const { d, pal: p } = S, u = S.u;
  const names: Opt[] = ['sgd', 'mom', 'adam'], runs: Run[] = [R_SGD_REF(), R_MOM(), R_ADAM()];
  const mv = runs.map((rn) => { let a1 = 0, b1 = 0; for (let i = 0; i < 20; i++) { a1 += Math.abs(rn.pts[i + 1][0] - rn.pts[i][0]); b1 += Math.abs(rn.pts[i + 1][1] - rn.pts[i][1]); } return [a1 / 20, b1 / 20]; });
  const mx = Math.max(...mv.flat());
  d.withAlpha(a, () => {
    d.text(S.l('cuánto se mueve cada peso por paso (promedio de 20 pasos)', 'how far each weight moves per step (20-step average)'), r.x, r.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top', w: r.w });
    const top = r.y + (S.portrait ? 34 : 50) * u, rowH = Math.min(46 * u, (r.h - (top - r.y)) / 3), lw = 78 * u;
    names.forEach((o, i) => {
      const y = top + i * rowH, t = tone(S, OPTS[o].tone);
      d.withAlpha(reveal[i] ?? 1, () => {
        d.text(oname(S, o), r.x + lw - 8 * u, y + rowH / 2, { size: FS(S, 13), weight: 800, color: t.ink, align: 'right', base: 'middle' });
        [0, 1].forEach((j) => {
          const bw = (r.w - lw - 30 * u) * (mv[i][j] / mx), by = y + rowH * (0.14 + j * 0.4);
          d.rect(r.x + lw, by, Math.max(2, bw), rowH * 0.34, { fill: j === 0 ? t.c : alpha(t.c, 0.45), stroke: j === 0 ? undefined : t.c, lw: 1 });
          d.text(j === 0 ? 'w₁' : 'w₂', r.x + lw + Math.max(2, bw) + 5 * u, by + rowH * 0.17, { size: FS(S, 12), font: 'mono', weight: 700, color: p.ink2, base: 'middle' });
        });
      });
    });
  });
}

function drawAdamBoxes(S: Frame, r: Rect, t: number) {
  const { d, pal: p } = S, u = S.u, bw = S.portrait ? r.w * 0.3 : r.w * 0.46, bh = (S.portrait ? 54 : 58) * u;
  const mk = (x: number, y: number): Rect => ({ x, y, w: bw, h: bh });
  const A = S.portrait ? [mk(r.x, r.y + 6 * u), mk(r.x + r.w * 0.35, r.y + 6 * u), mk(r.x + r.w * 0.7, r.y + 6 * u)] : [mk(r.x, r.y + 4 * u), mk(r.x + r.w - bw, r.y + 4 * u), mk(r.x + (r.w - bw) / 2, r.y + 4 * u + bh + 46 * u)];
  const tx = ['m', 's', 'η · m / √s'], sub = [S.l('promedio del gradiente', 'average of the gradient'), S.l('promedio de su cuadrado', 'average of its square'), S.l('el paso de este peso', 'this weight’s step')], tn: Tone[] = ['sig', 'err', 'lat'];
  A.forEach((b, i) => { const a = S.reveal('adam-how', 0.5 + i * 1.8, 0.5); if (a > 0.01) box(S, b, tx[i], { tone: tn[i], sub: sub[i], a, font: 'mono', size: 15 }); });
  const l1 = S.at('adam-how', 4.4, 5.2), l2 = S.at('adam-how', 4.8, 5.6);
  if (S.portrait) { if (l1 > 0) link(S, A[0], A[1], { tone: 'ink', progress: l1 }); if (l2 > 0) link(S, A[1], A[2], { tone: 'ink', progress: l2 }); }
  else { if (l1 > 0) link(S, A[0], A[2], { tone: 'ink', progress: l1 }); if (l2 > 0) link(S, A[1], A[2], { tone: 'ink', progress: l2 }); }
  d.withAlpha(S.reveal('adam-how', 6.4, 0.6), () => d.text(S.l('esto se hace por separado para cada peso', 'this is done separately for every weight'), r.x, r.y + r.h - 2, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom', w: r.w }));
}

// ── turno 2: la carrera ──
function drawRace(S: Frame, v: LView, aside: Rect, chartRect: Rect, infoRect: Rect) {
  const { d, pal: p } = S, u = S.u, g = G2(S);
  const all = g.runs.slice(); if (g.cur) all.push(g.cur);
  all.forEach((a, i) => { const last = a === g.cur; drawRun(S, v, a.run, a.k, { tone: a.tone, shape: a.shape, lw: last ? 2.6 : 1.8, a: last ? 1 : 0.28 + 0.4 * (i / Math.max(1, all.length)), dots: false, marker: last || a === g.runs[g.runs.length - 1] }); });
  if (!all.length) d.text(S.l('elige un optimizador y una tasa, y pulsa Entrenar', 'pick an optimizer and a rate, and press Train'), v.r.x + v.r.w / 2, v.r.y + v.r.h - 12 * u, { size: FS(S, 14), weight: 700, color: p.mute, align: 'center', base: 'bottom', halo: p.stage });
  const rows = (['sgd', 'mom', 'adam'] as Opt[]).map((o) => { const b = g.best[o]; return { o, b }; });
  // lectura: curvas
  const series: Series[] = all.map((a, i) => ({ run: a.run, k: a.k, tone: a.tone, a: a === g.cur ? 1 : 0.3 + 0.3 * (i / Math.max(1, all.length)), lw: a === g.cur ? 2.4 : 1.6 }));
  const cr = S.portrait ? chartRect : { x: aside.x, y: aside.y, w: aside.w, h: aside.h * 0.42 };
  lossChart(S, cr, series, { T: T_RACE, thr: THR, title: S.l('error (escala log)', 'loss (log scale)') });
  // lectura: resultados por optimizador
  const rr: Rect = S.portrait ? { x: aside.x + aside.w * 0.58, y: aside.y, w: aside.w * 0.42, h: aside.h } : { x: aside.x, y: aside.y + aside.h * 0.46, w: aside.w, h: aside.h * 0.54 };
  const rh = Math.min(38 * u, rr.h / 4);
  rows.forEach((row, i) => {
    const y = rr.y + i * rh + rh / 2, t = tone(S, OPTS[row.o].tone), ok = !!row.b;
    marker(S, rr.x + 8 * u, y, OPTS[row.o].shape, OPTS[row.o].tone, 5);
    d.text(oname(S, row.o), rr.x + 22 * u, y, { size: FS(S, 13), weight: 800, color: t.ink, base: 'middle' });
    d.text(ok ? `✓ ${row.b!.run.hit} ${S.l('pasos', 'steps')}` : '—', rr.x + rr.w, y, { size: FS(S, 13), font: 'mono', weight: 700, color: ok ? tone(S, 'dat').ink : p.mute, align: 'right', base: 'middle' });
  });
  const c = g.cur ?? g.runs[g.runs.length - 1];
  if (c) {
    const y = rr.y + 3 * rh + 4 * u, lo = lossAt(c), msg = c.run.divAt >= 0 && c.k >= c.run.divAt ? S.l(`${oname(S, c.opt)} diverge`, `${oname(S, c.opt)} diverges`) : c.done ? (c.run.hit >= 0 ? S.l(`${oname(S, c.opt)} llegó en ${c.run.hit} pasos`, `${oname(S, c.opt)} got there in ${c.run.hit} steps`) : S.l(`${oname(S, c.opt)} no llegó: error ${f2(S, lo, 2)}`, `${oname(S, c.opt)} did not get there: loss ${f2(S, lo, 2)}`)) : S.l(`${oname(S, c.opt)} · η = ${f2(S, c.eta, 3)}`, `${oname(S, c.opt)} · η = ${f2(S, c.eta, 3)}`);
    if (!S.portrait || rr.h > 4 * rh) d.text(msg, rr.x, y, { size: FS(S, 12.5), weight: 700, color: c.run.hit >= 0 && c.done ? tone(S, 'dat').ink : tone(S, 'err').ink, base: 'top', w: rr.w });
  }
}

function bestOf(S: Frame, o: Opt): { run: Run; mine: boolean; eta: number } {
  const b = G2(S).best[o];
  if (b) return { run: b.run, mine: true, eta: b.eta };
  const r = REF[o](); return { run: r, mine: false, eta: r.eta };
}

function drawRaceResult(S: Frame, v: LView, aside: Rect) {
  const { d, pal: p } = S, u = S.u, order: Opt[] = ['sgd', 'mom', 'adam'];
  const bs = order.map((o) => ({ o, ...bestOf(S, o) }));
  const k = S.at('race-result', 0.5, 4.5, 'lin') * T_RACE;
  bs.forEach((b, i) => drawRun(S, v, b.run, k, { tone: OPTS[b.o].tone, shape: OPTS[b.o].shape, lw: 2.4, dots: false, a: 0.95 }));
  legend(S, v.r.x + 8 * u, v.r.y + 28 * u, bs.map((b) => ({ tone: OPTS[b.o].tone, shape: OPTS[b.o].shape, text: `${oname(S, b.o)} · η = ${S.n(b.eta, 3)}` })), S.reveal('race-result', 0.3, 0.5));
  const max = Math.max(...bs.map((b) => (b.run.hit >= 0 ? b.run.hit : T_RACE)), 1);
  const rows = bs.map((b, i) => ({ label: oname(S, b.o), value: b.run.hit >= 0 ? Math.min(k, b.run.hit) : 0, text: b.run.hit >= 0 ? `${b.run.hit}${b.mine ? '' : ' *'}` : '—', tone: OPTS[b.o].tone, a: S.reveal('race-result', 1.0 + i * 0.5, 0.4) }));
  d.withAlpha(S.reveal('race-result', 0.5, 0.5), () => {
    d.text(S.l('pasos hasta el fondo (error < 0,05)', 'steps to reach the bottom (loss < 0.05)'), aside.x, aside.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top', w: aside.w });
    hbars(S, { x: aside.x, y: aside.y + 42 * u, w: aside.w, h: 110 * u }, rows, { max, labelW: S.portrait ? 78 : 72, rowH: 34 * u });
  });
  const miss = bs.some((b) => !b.mine);
  const guess = S.p.guess as Opt | '' | undefined, winner = bs.filter((b) => b.run.hit >= 0).sort((a, b) => a.run.hit - b.run.hit)[0];
  d.withAlpha(S.reveal('race-result', 3.2, 0.5), () => {
    let y = aside.y + 42 * u + 3 * 34 * u + 10 * u;
    if (guess && winner) { d.text(guess === winner.o ? S.l(`Tu apuesta, ${oname(S, guess)}, acertó.`, `Your bet, ${oname(S, guess)}, was right.`) : S.l(`Apostaste por ${oname(S, guess as Opt)}; llegó primero ${oname(S, winner.o)}.`, `You bet on ${oname(S, guess as Opt)}; ${oname(S, winner.o)} arrived first.`), aside.x, y, { size: FS(S, 13), weight: 800, color: p.ink, base: 'top', w: aside.w }); y += 40 * u; }
    if (miss) d.text(S.l('* corrida de referencia (no la hiciste tú)', '* reference run (not yours)'), aside.x, y, { size: FS(S, 12), color: p.mute, base: 'top', w: aside.w });
  });
}

// ── turno 3: el calendario ──
function drawTry3(S: Frame, v: LView, aside: Rect, chartRect: Rect, infoRect: Rect) {
  const { d, pal: p } = S, u = S.u, g = G3(S), a = g.cur;
  const warm = !!S.p.warm, decay = !!S.p.decay, prev = schedOf(warm, decay);
  const shown = a ?? null;
  if (shown) drawRun(S, v, shown.run, shown.k, { tone: g.verdict === 'ok' ? 'dat' : g.verdict === 'div' ? 'err' : 'w', shape: g.verdict === 'div' ? 'square' : 'circle', lw: 2.6, dots: false });
  else d.text(S.l('activa lo que haga falta y pulsa Entrenar', 'switch on what is needed and press Train'), v.r.x + v.r.w / 2, v.r.y + v.r.h - 12 * u, { size: FS(S, 14), weight: 700, color: p.mute, align: 'center', base: 'bottom', halo: p.stage });
  // vista previa de la tasa elegida
  const etasPrev = Array.from({ length: T_SCHED }, (_, t) => (prev ? (prev.warm > 0 && t < prev.warm ? 0.07 * ((t + 1) / prev.warm) : 0.07) * (prev.decay ? prev.floor + (1 - prev.floor) * 0.5 * (1 + Math.cos(Math.PI * clamp((t - prev.warm) / Math.max(1, prev.total - prev.warm)))) : 1) : 0.07));
  const series: Series[] = shown ? [{ run: shown.run, k: shown.k, tone: g.verdict === 'ok' ? 'dat' : g.verdict === 'div' ? 'err' : 'w' }] : [];
  const g2 = 10 * u, [r1, r2]: Rect[] = S.portrait ? [{ x: aside.x, y: aside.y, w: aside.w * 0.49, h: aside.h }, { x: aside.x + aside.w * 0.51, y: aside.y, w: aside.w * 0.49, h: aside.h }] : [{ x: aside.x, y: aside.y, w: aside.w, h: aside.h * 0.34 }, { x: aside.x, y: aside.y + aside.h * 0.36, w: aside.w, h: aside.h * 0.34 }];
  etaChart(S, r1, [{ etas: etasPrev, tone: 'ink', k: T_SCHED }], { T: T_SCHED, max: 0.08, title: S.l('tasa η que vas a usar', 'rate η you will use'), cursor: shown ? shown.k : undefined });
  lossChart(S, r2, series, { T: T_SCHED, thr: THR, title: S.l('error (escala log)', 'loss (log scale)'), small: S.portrait });
  void g2;
  if (!S.portrait) {
    const y = aside.y + aside.h * 0.74, t = g.verdict;
    const msg = t === 'div' ? S.l(`Diverge en el paso ${a!.run.divAt}: la tasa alta lo lanza lejos.`, `It diverges at step ${a!.run.divAt}: the high rate throws it far away.`) : t === 'bounce' ? S.l(`No explota, pero termina rebotando: error ${f2(S, finalLoss(a!), 2)}.`, `It does not blow up, but it ends up bouncing: loss ${f2(S, finalLoss(a!), 2)}.`) : t === 'ok' ? S.l(`¡Asentado! Error final ${f2(S, finalLoss(a!), 3)}.`, `Settled! Final loss ${f2(S, finalLoss(a!), 3)}.`) : '';
    if (msg) d.text(msg, aside.x, y, { size: FS(S, 13.5), weight: 800, color: t === 'ok' ? tone(S, 'dat').ink : tone(S, 'err').ink, base: 'top', w: aside.w });
  } else if (g.verdict) {
    const t = g.verdict, msg = t === 'div' ? S.l('Diverge', 'Diverges') : t === 'bounce' ? S.l('Rebota', 'Bounces') : S.l('¡Asentado!', 'Settled!');
    badge(S, msg, v.r.x + v.r.w / 2, v.r.y + v.r.h * 0.2, { tone: t === 'ok' ? 'dat' : 'err' });
  }
  if (!S.portrait && g.verdict) { /* el veredicto ya está en el lateral */ }
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 5: hiperparámetros, búsqueda, receta real, resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawHyper(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const items: { l: string; v: string; x01: number; t: Tone }[] = [
    { l: S.l('lote', 'batch'), v: '32', x01: 0.55, t: 'dat' }, { l: S.l('tasa η', 'rate η'), v: S.n(0.05, 2), x01: 0.35, t: 'w' },
    { l: S.l('optimizador', 'optimizer'), v: 'Adam', x01: 0.8, t: 'lat' }, { l: S.l('épocas', 'epochs'), v: '4', x01: 0.25, t: 'sig' },
    { l: S.l('calendario', 'schedule'), v: S.l('coseno', 'cosine'), x01: 0.65, t: 'err' },
  ];
  const cols = S.portrait ? 3 : 5, rows = Math.ceil(items.length / cols), rad = Math.min(34 * u, (r.w / cols) * 0.32), gh = S.portrait ? 120 * u : 130 * u;
  items.forEach((it, i) => {
    const row = Math.floor(i / cols), n = row === 0 ? Math.min(cols, items.length) : items.length - cols, col = i % cols, rowW = r.w / n;
    const cx = r.x + rowW * (col + 0.5), cyy = r.y + 24 * u + rad + row * gh;
    const a = S.reveal('hyper', 0.8 + i * 1.15, 0.5);
    if (a > 0.01) dial(S, cx, cyy, rad, it.x01 * (0.9 + 0.1 * Math.sin(S.clock * 1.4 + i)), it.l, it.v, it.t, a);
  });
  const top = r.y + 24 * u + rads(rad) + rows * gh + 8 * u, bh = Math.max(56 * u, (r.y + r.h - top - 8 * u) / 2.2);
  d.withAlpha(S.reveal('hyper', 7.6, 0.6), () => {
    const bw = S.portrait ? r.w : (r.w - 16 * u) / 2, wt = tone(S, 'w');
    const b1: Rect = { x: r.x, y: top, w: bw, h: bh }, b2: Rect = S.portrait ? { x: r.x, y: top + bh + 10 * u, w: bw, h: bh } : { x: r.x + bw + 16 * u, y: top, w: bw, h: bh };
    box(S, b1, S.l('Pesos: miles de millones', 'Weights: billions'), { tone: 'w', sub: S.l('se aprenden con gradientes', 'learned with gradients'), size: 16 });
    box(S, b2, S.l('Hiperparámetros: unas decenas', 'Hyperparameters: a few dozen'), { sub: S.l('los elige una persona', 'a person chooses them'), size: 16 });
    void wt;
  });
  d.withAlpha(S.reveal('hyper', 0.2, 0.5), () => d.text(S.l('ajustes del entrenamiento (valores de ejemplo)', 'training settings (example values)'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top' }));
}
const rads = (x: number) => x * 2 + 38;

function drawSearch(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const etas = [0.01, 0.03, 0.1, 0.3, 1, 3], runs = etas.map((e) => cy('adam', e, 3, 100));
  const hits = runs.map((x) => (x.hit >= 0 ? x.hit : 1e9)), best = hits.indexOf(Math.min(...hits));
  const cols = S.portrait ? 2 : 3, rows = S.portrait ? 3 : 2, head = 34 * u, foot = 26 * u, gap = 10 * u;
  const tw = (r.w - gap * (cols - 1)) / cols, th = (r.h - head - foot - gap * (rows - 1)) / rows;
  d.withAlpha(S.reveal('search', 0.2, 0.5), () => d.text(S.l('Adam con seis tasas: seis entrenamientos', 'Adam with six rates: six training runs'), r.x, r.y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' }));
  etas.forEach((e, i) => {
    const col = i % cols, row = Math.floor(i / cols), tr: Rect = { x: r.x + col * (tw + gap), y: r.y + head + row * (th + gap), w: tw, h: th };
    const a = S.reveal('search', 1.0 + i * 0.8, 0.5), k = S.at('search', 1.0 + i * 0.8, 3.0 + i * 0.8, 'lin') * 100;
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      const isBest = i === best && S.reveal('search', 7.0, 0.5) > 0.2;
      d.rect(tr.x, tr.y, tr.w, tr.h, { fill: p.surface, stroke: isBest ? tone(S, 'dat').c : p.line, lw: isBest ? 2.6 : 1, r: 3 });
      const inner = inset(tr, 6 * u);
      lossChart(S, { x: inner.x, y: inner.y + 14 * u, w: inner.w, h: inner.h - 14 * u }, [{ run: runs[i], k, tone: 'lat' }], { T: 100, thr: THR, small: true });
      d.text(`η = ${S.n(e, e < 0.1 ? 2 : e < 1 ? 1 : 0)}`, inner.x, inner.y, { size: FS(S, 13), font: 'mono', weight: 800, color: p.ink, base: 'top' });
      const done = k >= 99, verdict = runs[i].hit >= 0 ? S.l(`${runs[i].hit} pasos`, `${runs[i].hit} steps`) : S.l('no llega', 'does not get there');
      if (done) d.text(verdict, inner.x + inner.w, inner.y, { size: FS(S, 12.5), weight: 800, color: runs[i].hit >= 0 ? tone(S, 'dat').ink : tone(S, 'err').ink, align: 'right', base: 'top' });
    });
  });
  d.withAlpha(S.reveal('search', 7.0, 0.5), () => d.text(S.l('seis pruebas = seis veces el costo de un entrenamiento', 'six trials = six times the cost of one training run'), r.x, r.y + r.h, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' }));
}

function drawRealCard(S: Frame, R: ReturnType<typeof regions>) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const w = Math.min(r.w, 600 * u), x = r.x + (r.w - w) / 2, h = Math.min(r.h - 8 * u, 380 * u);
  const rows = [
    { k: S.l('Optimizador', 'Optimizer'), v: S.l('Adam · β₂ = 0,95', 'Adam · β₂ = 0.95'), t: 'lat' as Tone },
    { k: S.l('Lote (final)', 'Batch (final)'), v: S.l('3,2 millones de tokens', '3.2 million tokens'), t: 'dat' as Tone },
    { k: S.l('Tasa máxima', 'Peak rate'), v: S.n(0.00006, 5), t: 'w' as Tone },
    { k: S.l('Calentamiento', 'Warmup'), v: S.l('375 millones de tokens', '375 million tokens'), t: 'sig' as Tone },
    { k: S.l('Decaimiento', 'Decay'), v: S.l('coseno hasta el 10 %', 'cosine down to 10 %'), t: 'err' as Tone },
    { k: S.l('Rastreo web: épocas', 'Web crawl: epochs'), v: S.n(0.44, 2), t: 'ink' as Tone },
  ];
  kvCard(S, { x, y: r.y + (r.h - h) / 2, w, h }, rows, { title: S.l('GPT-3 175B: la receta publicada', 'GPT-3 175B: the published recipe'), foot: S.l('Brown et al., 2020 (Tabla 2.1, Tabla 2.2, Apéndice B)', 'Brown et al., 2020 (Table 2.1, Table 2.2, Appendix B)'), show: S.at('real', 0.6, 0.6 + rows.length * 1.0, 'lin') * rows.length + 0.99, a: S.reveal('real', 0.1, 0.5) });
  void d; void p;
}

function drawRecap(S: Frame, R: ReturnType<typeof regions>) {
  const r = R.all, u = S.u;
  const labels = [S.l('Lote', 'Batch'), S.l('Optimizador', 'Optimizer'), S.l('Calendario', 'Schedule')];
  const subs = [S.l('abarata cada paso', 'makes each step cheaper'), S.l('gradiente → paso', 'gradient → step'), S.l('la tasa en el tiempo', 'the rate over time')];
  const tones: Tone[] = ['dat', 'lat', 'w'];
  const bw = Math.min(S.portrait ? r.w * 0.8 : r.w * 0.27, 230 * u), bh = 70 * u;
  const pos: Rect[] = S.portrait ? [0, 1, 2].map((i) => ({ x: r.x + (r.w - bw) / 2, y: r.y + 14 * u + i * (bh + 36 * u), w: bw, h: bh })) : [0, 1, 2].map((i) => ({ x: r.x + r.w * (0.1 + 0.3 * i), y: r.y + r.h * 0.25, w: bw, h: bh }));
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.3 + i * 1.6, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], sub: subs[i], a, size: 17 }); });
  for (let i = 0; i < 2; i++) { const a = S.at('recap', 1.3 + i * 1.6, 2.0 + i * 1.6); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  const aT = S.reveal('recap', 5.4, 0.7), y = S.portrait ? pos[2].y + bh + 22 * u : pos[0].y + bh + 56 * u;
  S.d.withAlpha(aT, () => {
    S.d.text(S.l('decisiones de quien entrena, no algo que la red aprenda', 'decisions made by whoever trains, not something the network learns'), r.x + r.w / 2, y, { size: FS(S, 16), weight: 800, color: S.pal.ink, align: 'center', base: 'top', w: r.w * 0.9 });
  });
  if (!S.portrait) neu(S, r.x + r.w / 2 - 36 * u, y + 56 * u, { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 6.2, 0.5) });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cyy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cyy - 70 * u - (18 * sc) / 2 + 20 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cyy + 60 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Generalizar y evaluar', 'Generalizing and evaluating'), cx, cyy + 92 * u, { size: 24, weight: 800, align: 'center', w: S.W * 0.9 });
  });
}

export default scene;
void EX; void M2B;
