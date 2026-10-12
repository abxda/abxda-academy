// Escena: Entrenar bien. Un modelo de juguete de dos pesos y 256 ejemplos (sim.ts) donde los lotes, las épocas y los
// optimizadores SGD, momento y Adam corren de verdad. La escena hace sola cada demostración (tres tamaños de lote, la
// comparación de los tres optimizadores, la tasa alta sin y con calendario) y mueve los controles con S.drive; después,
// cada «tu turno» es opcional y solo cuenta lo que haga la persona. Todo lo narrado se anima por FRACCIONES de la duración
// de cada segmento (las voces y los idiomas duran distinto); lo interactivo vive en S.st y avanza en update().
import {
  alpha, badge, clamp, link, neu, regions, tone,
  type Frame, type Rect, type Regions, type SceneFactory, type Tone,
} from '../../../../../theme/kit';
import {
  BOWL, CANYON, N, START_BOWL, START_HIGH, START_NEAR, cachedTrain, epochOrder, exPos, grad, h2eff, perm, toUV, toXY, train,
  type Opt, type Run, type Sched, type V2,
} from './sim';
import { FS, descentArrow, drawCloud, drawLand, drawMin, drawRun, drawStart, landView, marker, type LView, type Shape } from './view';
import { asideSplit, boxS, deck, dial, etaChart, hbars, kvCard, lerpRect, lossChart, readouts, type Series } from './parts';

// ── constantes de la lección ───────────────────────────────────────────────
const ETA_BOWL = 0.08, BUDGET = 1024, BOWL_SEED = 5, T_RACE = 120, THR = 0.05, T_SCHED = 160, WARM = 16, HIGH_ETA = 0.07;
const OPTS: Record<Opt, { name: { es: string; en: string }; tone: Tone; shape: Shape; eta: number }> = {
  sgd: { name: { es: 'SGD', en: 'SGD' }, tone: 'w', shape: 'circle', eta: 0.07 },
  mom: { name: { es: 'Momento', en: 'Momentum' }, tone: 'sig', shape: 'square', eta: 0.02 },
  adam: { name: { es: 'Adam', en: 'Adam' }, tone: 'lat', shape: 'diamond', eta: 0.2 },
};
const ORDER: Opt[] = ['sgd', 'mom', 'adam'];
/** Posición del deslizador de la tasa (escala logarítmica, paso 0.005) para una tasa dada. */
const LETA = (eta: number) => Math.round(Math.log10(eta) / 0.005) * 0.005;
type SchedKind = 'none' | 'warm' | 'both';
const SCHEDS: Record<SchedKind, Sched | null> = {
  none: null,
  warm: { warm: WARM, decay: false, total: T_SCHED, floor: 0.02 },
  both: { warm: WARM, decay: true, total: T_SCHED, floor: 0.02 },
};
const SCHED_NAME: Record<SchedKind, { es: string; en: string }> = {
  none: { es: 'Tasa fija', en: 'Fixed rate' },
  warm: { es: 'Solo calentamiento', en: 'Warmup only' },
  both: { es: 'Calentamiento y decaimiento', en: 'Warmup and decay' },
};
const SCHED_SHORT: Record<SchedKind, { es: string; en: string }> = { none: { es: 'fija', en: 'fixed' }, warm: { es: 'calentamiento', en: 'warmup' }, both: { es: 'calentar y bajar', en: 'warm up, decay' } };
const oname = (S: Frame, o: Opt) => S.L(OPTS[o].name);
const f2 = (S: Frame, x: number, d = 2) => S.n(x, d);
const errTxt = (S: Frame, v: number) => (v >= 59 ? S.l('diverge', 'diverges') : f2(S, v, v < 0.001 ? 4 : v < 0.1 ? 3 : 2));
/** Etiqueta del kit con tamaño mínimo de 12 px efectivos (en teléfono, `u` < 1 la encogería). */
const badgeF = (S: Frame, text: string, x: number, y: number, o: Parameters<typeof badge>[4] = {}) => badge(S, text, x, y, { size: FS(S, 12), ...o });

// ── tiempo por fracciones del segmento ─────────────────────────────────────
type Ez = 'lin' | 'in' | 'out' | 'io';
const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de empezar, 1 después). */
const F = (S: Frame, k: string, a: number, b = a + 0.1, e: Ez = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
const P = (S: Frame, k: string, a: number, b: number) => F(S, k, a, b, 'lin');
let idsCache: { idx: Record<string, number>; ids: string[] } | null = null;
/** Id del segmento en curso. */
function segId(S: Frame): string {
  if (!idsCache || idsCache.idx !== S.idx) { const ids: string[] = []; for (const k in S.idx) ids[S.idx[k]] = k; idsCache = { idx: S.idx, ids }; }
  return idsCache.ids[S.seg] ?? '';
}

// ── corridas narradas (deterministas) ──────────────────────────────────────
const bowlRun = (B: number, seed: number, steps: number, full = false) => cachedTrain(BOWL, 'sgd', ETA_BOWL, B, seed, steps, { start: START_BOWL, full });
const FULL = () => bowlRun(256, 1, 12, true);
const SGD8 = () => bowlRun(8, BOWL_SEED, 128);
const DEMO_B = [256, 8, 1];
const DEMO_T: Tone[] = ['ink', 'w', 'lat'], DEMO_SH: Shape[] = ['square', 'circle', 'diamond'];
const DEMO_W: [number, number][] = [[0.06, 0.24], [0.32, 0.6], [0.66, 0.94]];
const demoRun = (i: number) => (i === 0 ? bowlRun(256, 1, 4, true) : bowlRun(DEMO_B[i], BOWL_SEED, BUDGET / DEMO_B[i]));
const demoSeed = (i: number) => (i === 0 ? 1 : BOWL_SEED);
const cy = (opt: Opt, eta: number, seed: number, steps: number, o: { start?: V2; sched?: Sched | null } = {}) => cachedTrain(CANYON, opt, eta, 32, seed, steps, { start: o.start ?? START_NEAR, sched: o.sched });
const R_SGD_A = () => cy('sgd', 0.08, 3, 100);
const R_SGD_DIV = () => cy('sgd', 0.11, 3, 60);
const R_SGD_SMALL = () => cy('sgd', 0.02, 3, 120);
const R_SGD_REF = () => cy('sgd', 0.06, 3, 120);
const R_MOM = () => cy('mom', 0.015, 3, 120);
const R_ADAM = () => cy('adam', 0.25, 3, 120);
const R_ADAM_C = () => cy('adam', 0.3, 5, 100);
const R_ADAM_D = () => cy('adam', 0.3, 5, 100, { sched: { warm: 0, decay: true, total: 100, floor: 0.02 } });
const R_HIGH_DIV = () => cy('sgd', HIGH_ETA, 3, T_SCHED, { start: START_HIGH });
const R_HIGH_OK = () => cy('sgd', HIGH_ETA, 3, T_SCHED, { start: START_HIGH, sched: SCHEDS.both });
const REF: Record<Opt, () => Run> = { sgd: () => cy('sgd', 0.07, 9, T_RACE), mom: () => cy('mom', 0.02, 9, T_RACE), adam: () => cy('adam', 0.2, 9, T_RACE) };
const RACE_W: [number, number][] = [[0.05, 0.31], [0.36, 0.62], [0.67, 0.93]];

// ── curva «lote → error final» (mediana de 12 semillas, mismo presupuesto) ──────────────
const BS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
let uCurve: { B: number; v: number }[] | null = null;
const U_CURVE = () => uCurve ??= BS.map((B) => {
  const fs = Array.from({ length: 12 }, (_, i) => { const r = train(BOWL, 'sgd', ETA_BOWL, B, i + 1, Math.ceil(BUDGET / B), { start: START_BOWL }); return r.loss[r.loss.length - 1]; }).sort((a, b) => a - b);
  return { B, v: (fs[5] + fs[6]) / 2 };
});

// ── abanico de flechas de lotes ────────────────────────────────────────────
const fanIdx = (k: number, B: number) => perm(5000 + k * 31 + B);
const fanCache = new Map<number, { g: V2; rel: number }[]>();
function fan(B: number) {
  let f = fanCache.get(B);
  if (!f) {
    const gT = grad(BOWL, START_BOWL[0], START_BOWL[1]);
    f = Array.from({ length: 24 }, (_, k) => { const g = grad(BOWL, START_BOWL[0], START_BOWL[1], fanIdx(k, B), 0, B); return { g, rel: Math.hypot(g[0] - gT[0], g[1] - gT[1]) / Math.hypot(gT[0], gT[1]) }; });
    fanCache.set(B, f);
  }
  return f;
}
const fanRel = (B: number) => fan(B).reduce((s, e) => s + e.rel, 0) / 24;
const FAN_B = [2, 8, 32, 128];

/** Un ejemplo bien visible (arriba a la derecha de la nube) para enlazar su casilla con su punto. */
const I0 = (() => { let best = 0, bv = -9; for (let i = 0; i < N; i++) { const [x, y] = exPos(i), r = Math.hypot(x, y); if (r < 1.25 && x > 0.3 && y > 0.3 && x + y > bv) { bv = x + y; best = i; } } return best; })();

// ── estado interactivo ─────────────────────────────────────────────────────
interface Anim { run: Run; k: number; speed: number; done: boolean; opt: Opt; eta: number; B: number; tone: Tone; shape: Shape; seed: number }
interface G1 { cur: Anim | null; runs: Anim[]; count: number }
interface G2 { cur: Anim | null; runs: Anim[]; count: number; best: Partial<Record<Opt, Anim>> }
interface G3 { cur: Anim | null; count: number; verdict: '' | 'div' | 'bounce' | 'ok'; kind: SchedKind }
const G1 = (S: Frame): G1 => (S.st.g1 ??= { cur: null, runs: [], count: 0 });
const G2 = (S: Frame): G2 => (S.st.g2 ??= { cur: null, runs: [], count: 0, best: {} });
const G3 = (S: Frame): G3 => (S.st.g3 ??= { cur: null, count: 0, verdict: '', kind: 'none' });
const finalLoss = (a: { run: Run }) => a.run.loss[a.run.loss.length - 1];
const lossAt = (run: Run, k: number) => run.loss[clamp(Math.floor(k), 0, run.loss.length - 1)];
function advance(S: Frame, a: Anim | null): boolean {
  if (!a || a.done) return false;
  a.k = S.reduced ? a.run.steps : Math.min(a.run.steps, a.k + a.speed * Math.min(0.1, S.dt));
  if (a.k >= a.run.steps) { a.done = true; return true; }
  return false;
}
const userBowl = (S: Frame) => { const g = G1(S); return S.between('batch-demo', 'tradeoff') && (!!g.cur || g.runs.length > 0); };
const userRace = (S: Frame) => { const g = G2(S); return S.between('race-demo', 'decay') && (!!g.cur || g.runs.length > 0); };
const userSched = (S: Frame) => S.between('sched-demo', 'hyper') && !!G3(S).cur;

const scene: SceneFactory = () => ({
  controls: [
    { id: 'batch', kind: 'slider', label: { es: 'Tamaño del lote', en: 'Batch size' }, min: 0, max: 8, step: 1, value: 8, from: 'batch-demo', to: 'tradeoff', fmt: (v, l) => `${2 ** v} · ${Math.ceil(BUDGET / 2 ** v)} ${l === 'es' ? 'pasos' : 'steps'}` },
    { id: 'train1', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'batch-demo', to: 'tradeoff' },
    { id: 'opt', kind: 'choice', label: { es: 'Optimizador', en: 'Optimizer' }, value: 'sgd', options: ORDER.map((o) => ({ value: o, label: OPTS[o].name })), from: 'race-demo', to: 'decay' },
    { id: 'leta', kind: 'slider', label: { es: 'Tasa de aprendizaje η', en: 'Learning rate η' }, min: -2.5, max: -0.5, step: 0.005, value: LETA(0.07), from: 'race-demo', to: 'decay', fmt: (v) => (10 ** v).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) },
    { id: 'train2', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'race-demo', to: 'decay' },
    { id: 'sched', kind: 'choice', label: { es: 'Calendario de la tasa', en: 'Rate schedule' }, value: 'none', options: (['none', 'warm', 'both'] as SchedKind[]).map((k) => ({ value: k, label: SCHED_NAME[k] })), from: 'sched-demo', to: 'hyper' },
    { id: 'train3', kind: 'button', primary: true, label: { es: 'Entrenar', en: 'Train' }, from: 'sched-demo', to: 'hyper' },
  ],

  action(S, id) {
    if (id === 'train1') {
      const g = G1(S), B = 2 ** (S.p.batch ?? 3), steps = Math.ceil(BUDGET / B), seed = 11 + g.count++;
      g.cur = { run: train(BOWL, 'sgd', ETA_BOWL, B, seed, steps, { start: START_BOWL }), k: 0, speed: Math.max(steps / 3.2, 3), done: false, opt: 'sgd', eta: ETA_BOWL, B, tone: 'w', shape: 'circle', seed };
    } else if (id === 'train2') {
      const g = G2(S), opt = (S.p.opt ?? 'sgd') as Opt, eta = 10 ** (S.p.leta ?? LETA(0.07)), seed = 7 + g.count++;
      g.cur = { run: train(CANYON, opt, eta, 32, seed, T_RACE, { start: START_NEAR, thr: THR }), k: 0, speed: 30, done: false, opt, eta, B: 32, tone: OPTS[opt].tone, shape: OPTS[opt].shape, seed };
    } else if (id === 'train3') {
      const g = G3(S), kind = ((S.p.sched as SchedKind) in SCHEDS ? S.p.sched : 'none') as SchedKind;
      g.count++; g.kind = kind; g.verdict = '';
      g.cur = { run: train(CANYON, 'sgd', HIGH_ETA, 32, 3, T_SCHED, { start: START_HIGH, sched: SCHEDS[kind], thr: THR }), k: 0, speed: 45, done: false, opt: 'sgd', eta: HIGH_ETA, B: 32, tone: 'w', shape: 'circle', seed: 3 };
    }
  },

  update(S) {
    // ── demostraciones guiadas: la escena mueve los controles mientras la persona no los toque ──
    if (S.between('batch-demo', 'tradeoff') && !S.touched.has('train1')) {
      const q = P(S, 'batch-demo', 0, 1), i = q >= DEMO_W[2][0] ? 2 : q >= DEMO_W[1][0] ? 1 : 0;
      S.drive('batch', Math.round(Math.log2(DEMO_B[i])));
    }
    if (S.between('race-demo', 'decay')) {
      if (!S.touched.has('train2')) { const q = P(S, 'race-demo', 0, 1), i = q >= RACE_W[2][0] ? 2 : q >= RACE_W[1][0] ? 1 : 0; S.drive('opt', ORDER[i]); }
      // la tasa sigue al optimizador elegido (ya ajustada) mientras nadie mueva el deslizador
      S.drive('leta', LETA(OPTS[(S.p.opt as Opt) in OPTS ? (S.p.opt as Opt) : 'sgd'].eta));
    }
    if (S.between('sched-demo', 'hyper') && !S.touched.has('train3')) S.drive('sched', S.is('sched-demo') && P(S, 'sched-demo', 0, 1) < 0.46 ? 'none' : 'both');

    // ── corridas de la persona ──
    const g1 = G1(S);
    if (advance(S, g1.cur) && g1.cur) { g1.runs.push(g1.cur); if (g1.runs.length > 4) g1.runs.shift(); g1.cur = null; S.complete('batch'); }
    const g2 = G2(S);
    if (advance(S, g2.cur) && g2.cur) {
      const a = g2.cur; g2.runs.push(a); if (g2.runs.length > 5) g2.runs.shift(); g2.cur = null;
      if (a.run.hit >= 0 && a.run.divAt < 0 && (!g2.best[a.opt] || a.run.hit < g2.best[a.opt]!.run.hit)) g2.best[a.opt] = a;
      S.complete('race');
    }
    const g3 = G3(S);
    if (advance(S, g3.cur) && g3.cur) { const a = g3.cur; g3.verdict = a.run.divAt >= 0 ? 'div' : finalLoss(a) < THR ? 'ok' : 'bounce'; S.complete('sched'); }
  },

  render(S) {
    const R = regions(S, S.portrait ? 0.64 : 0.68);
    const x = (k: string) => F(S, k, 0, 0.1, 'io');
    const aTrade = x('tradeoff'), aReal = x('real-batch'), aCan = x('canyon'), aHyper = x('hyper'), aSearch = x('search'), aRealCard = x('real'), aRecap = x('recap'), aBridge = x('bridge');
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
type DeckSt = (i: number) => 0 | 1 | 2;
const ALL1: DeckSt = () => 1, ALL2: DeckSt = () => 2;
/** Ejemplos del lote usado en el paso `step` (1 = el primero) por una corrida con lotes de B y semilla `seed`. */
function batchAt(seed: number, B: number, step: number): number[] {
  if (step <= 0) return [];
  if (B >= N) return Array.from({ length: N }, (_, i) => i);
  const e = Math.floor(((step - 1) * B) / N), lo = ((step - 1) * B) % N, pm = epochOrder(seed, e).perm;
  return Array.from(pm.slice(lo, lo + B));
}
/** Estado de la baraja por época: 0 sin usar, 1 ya usado en esta época, 2 en el lote actual. */
function epochSt(seed: number, B: number, step: number): DeckSt {
  if (step <= 0) return () => 0;
  if (B >= N) return ALL2;
  const e = Math.floor(((step - 1) * B) / N), lo = ((step - 1) * B) % N, { pos } = epochOrder(seed, e);
  return (i) => { const q = pos[i]; return q >= lo && q < lo + B ? 2 : q < lo ? 1 : 0; };
}
/** Baraja sin épocas: todas rellenas y el lote actual resaltado. */
const plainSt = (idx: number[]): DeckSt => { const s = new Set(idx); return (i) => (s.has(i) ? 2 : 1); };

function cellRect(grid: Rect, i: number): Rect {
  const c = grid.w / 16, g = Math.max(1, c * 0.14);
  return { x: grid.x + (i % 16) * c + g / 2, y: grid.y + Math.floor(i / 16) * c + g / 2, w: c - g, h: c - g };
}
/** Casillas encendidas (lote) con su propia opacidad, para que el lote aparezca sin saltos. */
function litCells(S: Frame, grid: Rect, idx: number[], a: number) {
  if (a <= 0.01) return;
  const sg = tone(S, 'sig');
  S.d.withAlpha(a, () => idx.forEach((i) => { const r = cellRect(grid, i); S.d.rect(r.x, r.y, r.w, r.h, { fill: sg.c }); }));
}
/** Puntos del lote resaltados en la nube. */
function batchDots(S: Frame, v: LView, idx: number[], a: number) {
  if (a <= 0.01 || !idx.length) return;
  const { d, pal: p } = S, sg = tone(S, 'sig'), s = Math.max(3, Math.round(3.4 * S.u)), many = idx.length > 64;
  d.withAlpha(a, () => idx.forEach((i) => { const [x, y] = v.pt(exPos(i)); if (many) d.rect(x - s / 2, y - s / 2, s, s, { fill: sg.c }); else d.rect(x - s, y - s, s * 2, s * 2, { fill: sg.c, stroke: p.stage, lw: 1.5 }); }));
}
/** Rótulos de los ejes con realce (en «toy» se presentan uno por uno). */
function axisNames(S: Frame, v: LView, a1: number, a2: number, h1 = 0, h2 = 0) {
  const { d, pal: p } = S, r = v.r, u = S.u, wt = tone(S, 'w');
  if (a1 > 0.01) d.withAlpha(a1, () => {
    if (h1 > 0.01) d.withAlpha(h1, () => d.arrow(r.x + r.w * 0.3, r.y + r.h - 26 * u, r.x + r.w * 0.66, r.y + r.h - 26 * u, wt.c, 3, 10));
    d.text(S.l('peso w₁ →', 'weight w₁ →'), r.x + r.w - 6, r.y + r.h - 5, { size: FS(S, 12 + 3 * h1), weight: 800, color: h1 > 0.5 ? wt.ink : p.mute, align: 'right', base: 'bottom', halo: p.stage });
  });
  if (a2 > 0.01) d.withAlpha(a2, () => {
    if (h2 > 0.01) d.withAlpha(h2, () => d.arrow(r.x + 26 * u, r.y + r.h * 0.72, r.x + 26 * u, r.y + r.h * 0.36, wt.c, 3, 10));
    d.text(S.l('peso w₂ ↑', 'weight w₂ ↑'), r.x + 6, r.y + 5, { size: FS(S, 12 + 3 * h2), weight: 800, color: h2 > 0.5 ? wt.ink : p.mute, base: 'top', halo: p.stage });
  });
}

/** Gancho: un ejemplo (lección 8) frente a millones; en «deck» el ejemplo se vuelve la primera casilla de la cuadrícula. */
function drawHook(S: Frame, R: Regions, center: Rect) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), dt = tone(S, 'dat'), all = R.all;
  const gone = F(S, 'deck', 0, 0.2), labA = 1 - F(S, 'toy', 0, 0.15);
  const s = Math.min(all.w, all.h) * 0.15;
  const hx = S.portrait ? all.x + all.w / 2 : all.x + all.w * 0.27, hy = S.portrait ? all.y + all.h * 0.24 : all.y + all.h * 0.42;
  // la cuadrícula centrada: su primera casilla es el destino del ejemplo
  const c = Math.floor((Math.min(center.w, center.h) / 16) * 10) / 10, gw = c * 16, gx = center.x + (center.w - gw) / 2, gy = center.y + (center.h - gw) / 2;
  const cell0 = cellRect({ x: gx, y: gy, w: gw, h: gw }, 0);
  if (gone < 1) d.withAlpha(1 - gone, () => {
    d.withAlpha(F(S, 'hook', 0.02, 0.12), () => {
      d.text(S.l('un ejemplo', 'one example'), hx, hy + s / 2 + 14 * u, { size: FS(S, 18), weight: 800, color: p.ink, align: 'center', base: 'top' });
      d.text(S.l('lección 8', 'lesson 8'), hx, hy + s / 2 + 14 * u + FS(S, 18) * u * 1.35, { size: FS(S, 13), weight: 600, color: p.mute, align: 'center', base: 'top' });
    });
    const aM = F(S, 'hook', 0.36, 0.5);
    if (aM > 0.01) {
      const mw = S.portrait ? all.w * 0.86 : all.w * 0.4, mh = S.portrait ? all.h * 0.26 : all.h * 0.52;
      const mx = S.portrait ? all.x + (all.w - mw) / 2 : all.x + all.w * 0.54, my = S.portrait ? all.y + all.h * 0.56 : all.y + all.h * 0.42 - mh / 2;
      d.withAlpha(aM, () => {
        d.dither(Math.round(mx), Math.round(my), Math.round(mw), Math.round(mh), alpha(dt.c, 0.75), 0.5, Math.max(2, Math.round(2 * u)));
        d.rect(mx, my, mw, mh, { stroke: p.line, lw: 1 });
        d.text(S.l('un modelo real: millones', 'a real model: millions'), mx + mw / 2, my + mh + 12 * u, { size: FS(S, 18), weight: 800, color: p.ink, align: 'center', base: 'top' });
      });
    }
  });
  // el ejemplo: un cuadrado grande que viaja a la primera casilla
  const mv = F(S, 'deck', 0, 0.25, 'io'), fade = 1 - F(S, 'deck', 0.27, 0.37);
  const big: Rect = { x: hx - s / 2, y: hy - s / 2, w: s, h: s }, r = lerpRect(big, cell0, mv);
  if (fade > 0.01) d.withAlpha(F(S, 'hook', 0, 0.08) * fade, () => d.rect(r.x, r.y, r.w, r.h, { fill: sg.c }));
  // rótulos de la cuadrícula
  d.withAlpha(labA, () => {
    d.withAlpha(F(S, 'deck', 0.22, 0.32), () => d.text(S.l('256 ejemplos', '256 examples'), center.x + center.w / 2, center.y + center.h + 10 * u, { size: FS(S, 20), weight: 800, color: p.ink, align: 'center', base: 'top' }));
    d.withAlpha(F(S, 'deck', 0.55, 0.65), () => d.text(S.l('una casilla = un ejemplo', 'one square = one example'), center.x + center.w / 2, center.y + center.h + 10 * u + FS(S, 20) * u * 1.35, { size: FS(S, 14), weight: 600, color: p.mute, align: 'center', base: 'top' }));
  });
}

/** Lo que muestra la fase del cuenco en el segmento en curso. */
interface BowlShow { st: DeckSt; stA?: number; st2?: DeckSt; st2A?: number; lit?: number[]; litA?: number; hot?: number[]; hotA?: number }

function drawBowlLayer(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, id = segId(S);
  const { deck: deckR, info } = asideSplit(S, R.aside);
  const sz = Math.min(R.all.w * 0.46, R.all.h * (S.portrait ? 0.46 : 0.62));
  const center: Rect = { x: R.all.x + (R.all.w - sz) / 2, y: R.all.y + R.all.h * (S.portrait ? 0.1 : 0.05), w: sz, h: sz };
  const dk = lerpRect(center, deckR, F(S, 'toy', 0, 0.3, 'io'));
  if (!S.on('toy') || F(S, 'toy', 0, 0.15) < 1) drawHook(S, R, center);
  const user = userBowl(S), g1 = G1(S);

  // ── qué se ve (baraja y nube) ──
  let show: BowlShow = { st: ALL1 };
  let s8 = 0;                                   // paso de la corrida de lotes de ocho (SGD8)
  if (S.on('sgd') && !S.on('cheap')) {
    s8 = S.on('epoch-count') ? 32 + 4 * P(S, 'epoch-count', 0.62, 0.95) : S.on('epoch') ? 20 + 12 * P(S, 'epoch', 0.3, 0.9) : S.on('sgd-path') ? 8 + 12 * P(S, 'sgd-path', 0.05, 0.85) : 8 * P(S, 'sgd', 0.15, 0.9);
  }
  const step8 = Math.floor(s8);
  if (id === 'full') show = { st: ALL1, lit: Array.from({ length: N }, (_, i) => i), litA: F(S, 'full', 0.3, 0.45) };
  else if (id === 'full-cost') show = { st: ALL2 };
  else if (id === 'batch' || id === 'batch-arrow') {
    const b = batchAt(BOWL_SEED, 8, 1), a = id === 'batch' ? F(S, 'batch', 0.3, 0.45) : 1;
    show = { st: ALL1, st2: ALL2, st2A: id === 'batch' ? 1 - F(S, 'batch', 0, 0.15) : 0, lit: b, litA: a, hot: b, hotA: a };
  }
  else if (id === 'noisy' || id === 'bigger' || id === 'bigger-rule') {
    const fb = fanNow(S), b = fb ? Array.from(fanIdx(fb.n, fb.B).slice(0, fb.B)) : batchAt(BOWL_SEED, 8, 1);
    show = { st: ALL1, lit: b, litA: 1, hot: b, hotA: 1 };
  } else if (id === 'sgd' || id === 'sgd-path') {
    const b = batchAt(BOWL_SEED, 8, step8), out = id === 'sgd' ? 1 - F(S, 'sgd', 0, 0.12) : 0;
    show = { st: plainSt(b), hot: b, hotA: 1, lit: out > 0.01 ? Array.from(fanIdx(23, 128).slice(0, 128)) : undefined, litA: out };
  }
  else if (id === 'epoch' || id === 'epoch-count') {
    const b = batchAt(BOWL_SEED, 8, step8), sw = id === 'epoch' ? F(S, 'epoch', 0, 0.2) : 1;
    show = { st: plainSt(b), stA: 1 - sw, st2: epochSt(BOWL_SEED, 8, step8), st2A: sw, hot: b, hotA: 1 };
  } else if (id === 'cheap') { const sw = F(S, 'cheap', 0, 0.12); show = { st: epochSt(BOWL_SEED, 8, 36), stA: 1 - sw, st2: ALL2, st2A: sw }; }
  else if (id === 'cheap-8') { const k = Math.floor(128 * P(S, 'cheap-8', 0.1, 0.85)), b = batchAt(BOWL_SEED, 8, k); show = { st: k > 0 && k < 128 ? epochSt(BOWL_SEED, 8, k) : ALL1, st2: ALL2, st2A: 1 - F(S, 'cheap-8', 0, 0.1), hot: k < 128 ? b : [], hotA: 1 }; }
  else if (user) {
    const a = g1.cur ?? g1.runs[g1.runs.length - 1];
    if (a && !a.done) { const k = Math.floor(a.k); show = { st: epochSt(a.seed, a.B, k), hot: batchAt(a.seed, a.B, k), hotA: 1 }; }
  } else if (id === 'batch-demo') {
    const q = P(S, 'batch-demo', 0, 1);
    for (let i = 2; i >= 0; i--) {
      const [a0, a1] = DEMO_W[i];
      if (q >= a0 && q < a1) { const k = Math.floor(demoRun(i).steps * P(S, 'batch-demo', a0, a1)); if (k > 0) show = { st: epochSt(demoSeed(i), DEMO_B[i], k), hot: DEMO_B[i] < N ? batchAt(demoSeed(i), DEMO_B[i], k) : [], hotA: 1 }; break; }
    }
  }

  // ── baraja ──
  let grid: Rect | null = null;
  if (S.on('deck')) {
    const vis = Math.floor(N * P(S, 'deck', 0.12, 0.6));
    grid = deck(S, dk, { state: show.st, visible: vis, frame: S.on('toy'), a: show.stA ?? 1 });
    if (show.st2 && (show.st2A ?? 0) > 0.01) deck(S, dk, { state: show.st2, a: show.st2A });
    if (show.lit) litCells(S, grid, show.lit, show.litA ?? 1);
  }

  // ── paisaje ──
  const land = F(S, 'toy', 0.25, 0.4);
  if (land <= 0.01) return;
  const v = landView(S, R.main, BOWL);
  d.withAlpha(land, () => d.rect(v.r.x, v.r.y, v.r.w, v.r.h, { fill: alpha(p.surface, 0.5), stroke: p.line, lw: 1 }));
  drawLand(S, v, F(S, 'map', 0.1, 0.45));
  const h1 = F(S, 'toy', 0.45, 0.55) * (1 - F(S, 'map', 0, 0.15)), h2 = F(S, 'toy', 0.7, 0.8) * (1 - F(S, 'map', 0, 0.15));
  axisNames(S, v, F(S, 'toy', 0.45, 0.55), F(S, 'toy', 0.7, 0.8), h1, h2);
  d.withAlpha(F(S, 'toy', 0.25, 0.4), () => d.text(S.l('modelo de juguete: dos pesos', 'toy model: two weights'), v.r.x + v.r.w - 6, v.r.y + 5, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage }));
  // cómo leer el mapa
  const mapOut = 1 - F(S, 'dots', 0, 0.15);
  if (S.on('map') && mapOut > 0.01) d.withAlpha(mapOut, () => {
    badgeF(S, S.l('una línea = mismo error', 'one line = same error'), v.r.x + 10 * u, v.r.y + 40 * u, { tone: 'mute', align: 'left', a: F(S, 'map', 0.4, 0.5) });
    badgeF(S, S.l('más color = más error', 'more color = more error'), v.r.x + 10 * u, v.r.y + 40 * u + FS(S, 12) * u * 2.2, { tone: 'err', align: 'left', a: F(S, 'map', 0.7, 0.8) });
  });
  // nube de ejemplos
  if (S.on('dots')) {
    drawCloud(S, v, { appear: P(S, 'dots', 0.08, 0.55) });
    const lbl = F(S, 'dots', 0.3, 0.4) * (1 - F(S, 'average', 0, 0.15));
    if (lbl > 0.01) badgeF(S, S.l('un punto = un ejemplo', 'one dot = one example'), v.r.x + 10 * u, v.r.y + 40 * u, { tone: 'dat', align: 'left', a: lbl });
    // una casilla y su punto
    const lk = F(S, 'dots', 0.62, 0.74) * (1 - F(S, 'average', 0, 0.15));
    if (lk > 0.01 && grid) {
      const c = cellRect(grid, I0), [px, py] = v.pt(exPos(I0)), sg = tone(S, 'sig');
      d.withAlpha(lk, () => {
        d.rect(c.x - 2, c.y - 2, c.w + 4, c.h + 4, { fill: sg.c, stroke: p.ink, lw: 1.5 });
        d.line(c.x + c.w / 2, c.y + c.h / 2, px, py, sg.ink, 1.6, [4, 4]);
        d.circle(px, py, 6 * u, { fill: sg.c, stroke: p.ink, lw: 1.5 });
      });
    }
  }
  if (show.hot && show.hot.length) batchDots(S, v, show.hot, show.hotA ?? 1);
  // el promedio: el mínimo en el centro de la nube
  if (S.on('average')) {
    const la = F(S, 'average', 0.05, 0.3) * (1 - F(S, 'full', 0, 0.15)), [mx, my] = v.pt([0, 0]);
    if (la > 0.01) d.withAlpha(la * 0.4, () => { for (let i = 0; i < N; i += 8) { const [x, y] = v.pt(exPos(i)); d.line(x, y, mx, my, tone(S, 'dat').c, 1); } });
    drawMin(S, v, F(S, 'average', 0.4, 0.55));
    const q = P(S, 'average', 0.45, 0.85);
    if (q > 0 && q < 1) d.circle(mx, my, (8 + 26 * q) * u, { stroke: tone(S, 'dat').c, lw: 2, a: 1 - q });
    const ba = F(S, 'average', 0.6, 0.7) * (1 - F(S, 'full', 0, 0.15));
    if (ba > 0.01) badgeF(S, S.l('centro de la nube', 'center of the cloud'), mx + 18 * u, my - 26 * u, { tone: 'dat', align: 'left', a: ba });
  }
  if (!S.on('full')) return;

  // ── caminos y flechas ──
  drawStart(S, v, START_BOWL, F(S, 'full', 0.05, 0.15), S.l('inicio', 'start'));
  const gT = grad(BOWL, START_BOWL[0], START_BOWL[1]);
  if (id === 'full') { const a = F(S, 'full', 0.55, 0.7); if (a > 0.01) descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, a, scale: 9, max: 100 }); }
  else if (id === 'full-cost') {
    descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, a: 1 - F(S, 'full-cost', 0, 0.1), scale: 9, max: 100 });
    drawRun(S, v, FULL(), 12 * P(S, 'full-cost', 0.08, 0.65), { tone: 'ink', shape: 'square', lw: 2.4 });
  } else if (id === 'batch') {
    const a = 1 - F(S, 'batch', 0, 0.15); if (a > 0.01) drawRun(S, v, FULL(), 12, { tone: 'ink', shape: 'square', lw: 2.4, a });
  } else if (id === 'batch-arrow') {
    descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, a: F(S, 'batch-arrow', 0.02, 0.12), scale: 9, max: 100 });
    const gB = grad(BOWL, START_BOWL[0], START_BOWL[1], batchAt(BOWL_SEED, 8, 1), 0, 8);
    descentArrow(S, v, START_BOWL, gB, { tone: 'err', lw: 3.2, a: F(S, 'batch-arrow', 0.3, 0.42), scale: 9, max: 100 });
  } else if (id === 'noisy' || id === 'bigger' || id === 'bigger-rule') {
    const fb = fanNow(S);
    if (fb) { const f = fan(fb.B); for (let i = 0; i <= fb.n; i++) descentArrow(S, v, START_BOWL, f[i].g, { tone: 'err', lw: 2, a: 0.5, scale: 9, max: 100 }); }
    descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, scale: 9, max: 100 });
    drawStart(S, v, START_BOWL, 1);
    if (fb && id !== 'noisy') {
      const tx = v.r.x + v.r.w - 10 * u, ty = v.r.y + 24 * u;
      d.text(S.l(`lote de ${fb.B}`, `batch of ${fb.B}`), tx, ty, { size: FS(S, 20), weight: 800, color: p.ink, align: 'right', base: 'top', halo: p.stage, a: fb.a });
      d.text(S.l(`desvío medio: ${pctTxt(S, fanRel(fb.B))}`, `average error: ${pctTxt(S, fanRel(fb.B))}`), tx, ty + FS(S, 20) * u * 1.3, { size: FS(S, 14), weight: 700, color: tone(S, 'err').ink, align: 'right', base: 'top', halo: p.stage, a: fb.a });
    }
  } else if (s8 > 0 || id === 'sgd') {
    const out = id === 'sgd' ? 1 - F(S, 'sgd', 0, 0.12) : 0;
    if (out > 0.01) { const f = fan(128); d.withAlpha(out, () => { f.forEach((e) => descentArrow(S, v, START_BOWL, e.g, { tone: 'err', lw: 2, a: 0.5, scale: 9, max: 100 })); descentArrow(S, v, START_BOWL, gT, { color: p.ink, lw: 3.4, scale: 9, max: 100 }); }); }
    drawRun(S, v, SGD8(), s8, { tone: 'w', lw: 2.2, dots: s8 < 70 });
    legend(S, v.r.x + 8 * u, v.r.y + v.r.h - 12 * u - legendH(S, 1), [{ tone: 'w', shape: 'circle', text: S.l('SGD · lotes de 8', 'SGD · batches of 8') }], F(S, 'sgd', 0.05, 0.15));
  } else if (id === 'cheap' || id === 'cheap-8') {
    if (id === 'cheap') { const a = 1 - F(S, 'cheap', 0, 0.12); if (a > 0.01) drawRun(S, v, SGD8(), 36, { tone: 'w', lw: 2.2, dots: false, a }); }
    const k4 = id === 'cheap' ? 4 * P(S, 'cheap', 0.3, 0.85) : 4;
    drawRun(S, v, FULL(), k4, { tone: 'ink', shape: 'square', lw: 2.6 });
    if (id === 'cheap-8') drawRun(S, v, SGD8(), 128 * P(S, 'cheap-8', 0.1, 0.85), { tone: 'w', lw: 2, dots: false });
    const items = [{ tone: 'ink' as Tone, shape: 'square' as Shape, text: S.l('lotes de 256', 'batches of 256') }, ...(id === 'cheap-8' ? [{ tone: 'w' as Tone, shape: 'circle' as Shape, text: S.l('lotes de 8', 'batches of 8') }] : [])];
    legend(S, v.r.x + 8 * u, v.r.y + v.r.h - 12 * u - legendH(S, items.length), items, F(S, 'cheap', 0.25, 0.35));
  } else if (user) {
    drawUserBowl(S, v);
  } else if (S.on('batch-demo')) {
    const final = !S.is('batch-demo'), q = P(S, 'batch-demo', 0, 1), hl = demoHi(S), old = S.is('batch-demo') ? 1 - F(S, 'batch-demo', 0, 0.06) : 0;
    if (old > 0.01) { drawRun(S, v, FULL(), 4, { tone: 'ink', shape: 'square', lw: 2.6, a: old }); drawRun(S, v, SGD8(), 128, { tone: 'w', lw: 2, dots: false, a: old }); }
    // al terminar, el camino del lote de uno (el más enredado) va debajo para no tapar a los otros dos
    (final ? [2, 0, 1] : [0, 1, 2]).forEach((i) => {
      const [a0, a1] = DEMO_W[i]; if (!final && q < a0) return;
      const r = demoRun(i), k = final ? r.steps : r.steps * P(S, 'batch-demo', a0, a1), active = !final && q < a1;
      const a = hl ? 0.25 + 0.75 * hl[i] : active ? 1 : i === 2 ? 0.6 : 0.85;
      drawRun(S, v, r, k, { tone: DEMO_T[i], shape: DEMO_SH[i], lw: i === 2 ? 1.3 : active ? 2.4 : 2.2, dots: r.steps <= 8, a });
    });
    const items = DEMO_B.map((B, i) => ({ tone: DEMO_T[i], shape: DEMO_SH[i], text: S.l(`lotes de ${B}`, `batches of ${B}`), a: final || q >= DEMO_W[i][0] ? 1 : 0.25 }));
    legend(S, v.r.x + 8 * u, v.r.y + v.r.h - 12 * u - legendH(S, 3), items, F(S, 'batch-demo', 0, 0.08));
  }

  // ── lateral ──
  asideBowl(S, info, id, s8);
}

/** Abanico vigente: qué tamaño de lote y cuántas flechas van. */
function fanNow(S: Frame): { B: number; n: number; a: number } | null {
  if (S.is('noisy')) { const q = P(S, 'noisy', 0.1, 0.75); return { B: 8, n: Math.min(23, Math.floor(q * 24)), a: 1 }; }
  const two = (k: string, Bs: [number, number]) => {
    const q = P(S, k, 0, 1), j = q < 0.48 ? 0 : 1, a0 = j === 0 ? 0.04 : 0.5, n = Math.min(23, Math.floor(P(S, k, a0, a0 + 0.3) * 24));
    return { B: Bs[j], n, a: F(S, k, a0 - 0.02, a0 + 0.06) };
  };
  if (S.is('bigger')) return two('bigger', [2, 8]);
  if (S.is('bigger-rule')) return two('bigger-rule', [32, 128]);
  return null;
}
const pctTxt = (S: Frame, rel: number) => `${S.n(rel * 100, rel * 100 < 3 ? 1 : 0)}${S.lang === 'es' ? ' %' : '%'}`;

/** Resaltado de las tres corridas en «batch-read» (orden de la voz: 256, 1, 8). */
function demoHi(S: Frame): number[] | null {
  if (!S.is('batch-read')) return null;
  const h256 = F(S, 'batch-read', 0.04, 0.12) * (1 - F(S, 'batch-read', 0.36, 0.42)), h1 = F(S, 'batch-read', 0.38, 0.46) * (1 - F(S, 'batch-read', 0.7, 0.76)), h8 = F(S, 'batch-read', 0.72, 0.8);
  return [h256, h8, h1];
}

function drawUserBowl(S: Frame, v: LView) {
  const { d, pal: p } = S, u = S.u, g1 = G1(S);
  g1.runs.forEach((a, i) => {
    const last = i === g1.runs.length - 1 && !g1.cur;
    drawRun(S, v, a.run, a.run.steps, { tone: 'w', a: last ? 1 : 0.3, lw: last ? 2.2 : 1.6, dots: false, marker: last });
    const e = v.pt(a.run.pts[a.run.pts.length - 1]);
    d.text(`${a.B}`, e[0] + 8 * u, e[1] - 8 * u, { size: FS(S, 12), font: 'mono', weight: 700, color: tone(S, 'w').ink, halo: p.stage, a: last ? 1 : 0.6 });
  });
  if (g1.cur) drawRun(S, v, g1.cur.run, g1.cur.k, { tone: 'w', lw: 2.4, dots: g1.cur.run.steps <= 64 });
}

function asideBowl(S: Frame, info: Rect, id: string, s8: number) {
  const { d, pal: p } = S, u = S.u;
  const cw = info.w / 2, lab = (long: string, short: string) => (S.d.measure(long, { size: FS(S, 12), weight: 700 }) < cw - 10 * u ? long : short);
  const rowH = S.portrait ? 40 : 50, size = S.portrait ? 18 : 22;
  const RD = (items: { l: string; v: string; t?: Tone }[], a: number, cols = 2) => readouts(S, info, items, cols, { rowH, size, a });
  const seenL = () => lab(S.l('ejemplos revisados', 'examples used'), S.l('revisados', 'used'));
  if (id === 'full') { RD([{ l: lab(S.l('ejemplos por paso', 'examples per step'), S.l('por paso', 'per step')), v: '256', t: 'dat' }], F(S, 'full', 0.3, 0.4)); drawLegend(S, { ...info, y: info.y + rowH * u + 6 * u, h: info.h - rowH * u }, F(S, 'full', 0.6, 0.7), 0); }
  else if (id === 'full-cost') {
    const n = Math.floor(12 * P(S, 'full-cost', 0.08, 0.65));
    RD([{ l: S.l('pasos', 'steps'), v: String(n), t: 'ink' }, { l: seenL(), v: S.n(n * 256, 0), t: 'dat' }, { l: S.l('error', 'error'), v: f2(S, FULL().loss[n]), t: 'err' }], 1);
  } else if (id === 'batch') RD([{ l: lab(S.l('ejemplos por paso', 'examples per step'), S.l('por paso', 'per step')), v: S.l('8 de 256', '8 of 256'), t: 'dat' }], F(S, 'batch', 0.45, 0.55), 1);
  else if (id === 'batch-arrow' || id === 'noisy') drawLegend(S, info, F(S, 'batch-arrow', 0.02, 0.12), F(S, 'batch-arrow', 0.3, 0.42));
  else if (id === 'bigger' || id === 'bigger-rule') drawDevBars(S, info);
  else if (s8 > 0 || id === 'sgd') {
    const n = Math.floor(s8), run = SGD8(), err = { l: S.l('error', 'error'), v: f2(S, run.loss[Math.min(n, 128)], 3), t: 'err' as Tone };
    if (S.on('epoch')) {
      const ep = n === 0 ? 1 : Math.floor((n - 1) / 32) + 1, inEp = n === 0 ? 0 : ((n - 1) % 32) + 1;
      RD([{ l: S.l('época', 'epoch'), v: String(ep), t: 'sig' }, { l: lab(S.l('pasos de esta época', 'steps this epoch'), S.l('pasos', 'steps')), v: `${inEp} / 32`, t: 'ink' }], 1);
      const fa = F(S, 'epoch-count', 0.15, 0.3);
      if (fa > 0.01) d.text('256 ÷ 8 = 32 ' + S.l('pasos', 'steps'), info.x, info.y + rowH * u + 14 * u, { size: FS(S, S.portrait ? 16 : 20), font: 'mono', weight: 800, color: p.ink, base: 'top', a: fa, w: info.w });
    } else RD([{ l: S.l('pasos', 'steps'), v: String(n), t: 'ink' }, { l: seenL(), v: S.n(n * 8, 0), t: 'dat' }, err], 1);
  } else if (id === 'cheap' || id === 'cheap-8') {
    const k4 = Math.floor(id === 'cheap' ? 4 * P(S, 'cheap', 0.3, 0.85) : 4), k8 = id === 'cheap-8' ? Math.floor(128 * P(S, 'cheap-8', 0.1, 0.85)) : 0;
    rowList(S, info, S.l('mismo trabajo: 1 024 ejemplos (4 épocas)', 'same work: 1,024 examples (4 epochs)'), [
      { tone: 'ink', shape: 'square', label: S.l('lotes de 256', 'batches of 256'), short: S.l('lote 256', 'batch 256'), sub: `${k4} ${S.l('pasos', 'steps')}`, value: f2(S, FULL().loss[k4]), a: F(S, 'cheap', 0.25, 0.35) },
      { tone: 'w', shape: 'circle', label: S.l('lotes de 8', 'batches of 8'), short: S.l('lote 8', 'batch 8'), sub: `${k8} ${S.l('pasos', 'steps')}`, value: f2(S, SGD8().loss[k8], 3), a: F(S, 'cheap-8', 0.05, 0.15) },
    ], F(S, 'cheap', 0.05, 0.15), S.l('error', 'error'));
  } else if (userBowl(S)) {
    const g1 = G1(S), all = [...g1.runs, ...(g1.cur ? [g1.cur] : [])].slice(-3);
    rowList(S, info, S.l('tus intentos · error tras 4 épocas', 'your runs · error after 4 epochs'), all.map((a) => ({ tone: 'w' as Tone, shape: 'circle' as Shape, label: S.l(`lote de ${a.B}`, `batch of ${a.B}`), short: S.l(`lote ${a.B}`, `batch ${a.B}`), sub: `${Math.floor(a.k)} ${S.l('pasos', 'steps')}`, value: f2(S, lossAt(a.run, a.k), 3), a: 1 })), 1);
  } else if (S.on('batch-demo')) {
    const final = !S.is('batch-demo'), q = P(S, 'batch-demo', 0, 1), hl = demoHi(S);
    rowList(S, info, S.l('error tras 4 épocas', 'error after 4 epochs'), DEMO_B.map((B, i) => {
      const [a0, a1] = DEMO_W[i], r = demoRun(i), k = final ? r.steps : Math.floor(r.steps * P(S, 'batch-demo', a0, a1));
      return { tone: DEMO_T[i], shape: DEMO_SH[i], label: S.l(`lotes de ${B}`, `batches of ${B}`), short: S.l(`lote ${B}`, `batch ${B}`), sub: `${S.n(k, 0)} ${S.l('pasos', 'steps')}`, value: f2(S, r.loss[k], i === 1 ? 3 : 2), a: final ? 1 : F(S, 'batch-demo', a0 - 0.02, a0 + 0.04), hi: hl ? hl[i] : 0 };
    }), 1);
  }
}

/** Lista de filas «marcador · rótulo (subrótulo) … valor», con resaltado opcional. */
function rowList(S: Frame, r: Rect, title: string, rows: { tone: Tone; shape: Shape; label: string; short?: string; sub?: string; value: string; a: number; hi?: number }[], a = 1, valueHead?: string) {
  const { d, pal: p } = S, u = S.u, ts = FS(S, 12), ls = FS(S, S.portrait ? 13 : 14), ss = FS(S, 12);
  const tl = d.wrap(title, r.w, { size: ts, weight: 700 }).length, top = r.y + tl * ts * u * 1.3 + 8 * u + (valueHead ? ts * u * 1.2 : 0);
  const rh = Math.min(46 * u, (r.y + r.h - top) / Math.max(2, rows.length));
  d.withAlpha(a, () => {
    d.text(title, r.x, r.y, { size: ts, weight: 700, color: p.mute, base: 'top', w: r.w });
    if (valueHead) d.text(valueHead, r.x + r.w, top - 2 * u, { size: ts, weight: 700, color: p.mute, align: 'right', base: 'bottom' });
    rows.forEach((row, i) => {
      if (row.a <= 0.01) return;
      const y = top + i * rh, t = tone(S, row.tone), hi = row.hi ?? 0, cyy = y + rh / 2;
      // si no caben dos líneas por fila, el subrótulo se omite (el rótulo y el valor bastan)
      const sub = row.sub && rh >= (ls + ss) * u * 1.35 ? row.sub : '', dy = sub ? ss * u * 0.55 : 0;
      d.withAlpha(row.a, () => {
        if (hi > 0.01) d.rect(r.x - 4 * u, y + 1, r.w + 8 * u, rh - 2, { fill: alpha(t.c, 0.16 * hi), stroke: alpha(t.c, hi), lw: 1.8, r: 3 });
        marker(S, r.x + 8 * u, cyy - dy, row.shape, row.tone, 4.5);
        const vs = FS(S, S.portrait || rh < 30 * u ? 15 : 18), fits = 20 * u + d.measure(row.label, { size: ls, weight: 800 }) + d.measure(row.value, { size: vs, font: 'mono', weight: 800 }) + 8 * u < r.w;
        d.text(fits || !row.short ? row.label : row.short, r.x + 20 * u, cyy - dy, { size: ls, weight: 800, color: p.ink, base: 'middle' });
        if (sub) d.text(sub, r.x + 20 * u, cyy + ss * u * 0.75, { size: ss, font: 'mono', weight: 600, color: p.mute, base: 'middle' });
        d.text(row.value, r.x + r.w, cyy, { size: vs, font: 'mono', weight: 800, color: t.ink, align: 'right', base: 'middle' });
      });
    });
  });
}

/** Barras del desvío medio de la flecha según el tamaño del lote (datos reales del abanico). */
function drawDevBars(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const reveal = [F(S, 'bigger', 0.25, 0.35), F(S, 'bigger', 0.75, 0.85), F(S, 'bigger-rule', 0.25, 0.35), F(S, 'bigger-rule', 0.75, 0.85)];
  const ts = FS(S, 12), top = r.y + ts * u * 1.6, ann = F(S, 'bigger-rule', 0.04, 0.14), annH = ts * u * 1.8;
  const rowH = Math.min(30 * u, (r.y + r.h - top - annH) / 4);
  d.text(S.l('desvío medio de la flecha', 'average error of the arrow'), r.x, r.y, { size: ts, weight: 700, color: p.mute, base: 'top', w: r.w });
  const labW = (d.measure(S.l('lote 128', 'batch 128'), { size: FS(S, 12.5), weight: 700 }) + 12 * u) / u;
  hbars(S, { x: r.x, y: top, w: r.w, h: rowH * 4 }, FAN_B.map((B, i) => ({ label: S.l(`lote ${B}`, `batch ${B}`), value: fanRel(B), text: pctTxt(S, fanRel(B)), tone: 'err' as Tone, a: reveal[i] })), { max: fanRel(2) * 1.05, labelW: labW, rowH });
  if (ann > 0.01) d.text(S.l('lote ×4 → desvío ÷2', 'batch ×4 → error ÷2'), r.x, top + rowH * 4 + 6 * u, { size: FS(S, 14), font: 'mono', weight: 800, color: p.ink, base: 'top', a: ann });
}

function drawLegend(S: Frame, r: Rect, aBlack: number, aRed: number) {
  const { d, pal: p } = S, u = S.u, rows: [string, string, number][] = [[p.ink, S.l('flecha con todos los ejemplos', 'arrow from all the examples'), aBlack], [tone(S, 'err').c, S.l('flecha de un lote de 8', 'arrow from a batch of 8'), aRed]];
  rows.forEach(([c, t, a], i) => { if (a <= 0.01) return; const y = r.y + 14 * u + i * 40 * u; d.withAlpha(a, () => { d.arrow(r.x + 2, y, r.x + 36 * u, y, c, 3, 9); d.text(t, r.x + 46 * u, y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle', w: r.w - 50 * u }); }); });
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 2: la curva «tamaño del lote → error final»
// ═════════════════════════════════════════════════════════════════════════
function drawTradeoff(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, r = R.all, curve = U_CURVE(), g1 = G1(S);
  const pl = 52 * u, pr = 14 * u, pt = 26 * u, pb = 84 * u, c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (i: number) => c.x + (i / 8) * c.w, Y = (v: number) => c.y + c.h - ((Math.log10(Math.max(1e-3, v)) + 3) / 4.2) * c.h;
  const prog = P(S, 'tradeoff', 0.08, 0.45) * 8;
  d.text(S.l('error tras 4 épocas (escala logarítmica)', 'error after 4 epochs (log scale)'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top' });
  d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
  [0.001, 0.01, 0.1, 1].forEach((v) => { d.line(c.x, Y(v), c.x + c.w, Y(v), p.line, 1); d.text(S.n(v, v < 0.01 ? 3 : v < 0.1 ? 2 : v < 1 ? 1 : 0), c.x - 6 * u, Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
  curve.forEach((e, i) => d.text(String(e.B), X(i), c.y + c.h + 6 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }));
  d.text(S.l('tamaño del lote', 'batch size'), c.x + c.w / 2, c.y + c.h + 6 * u + FS(S, 12) * u * 1.5, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top' });
  const pts: [number, number][] = [];
  for (let i = 0; i <= 8; i++) { if (i > prog) break; pts.push([X(i), Y(curve[i].v)]); }
  if (prog < 8) { const i = Math.floor(prog), f = prog - i; if (i < 8) pts.push([X(i) + (X(i + 1) - X(i)) * f, Y(curve[i].v) + (Y(curve[i + 1].v) - Y(curve[i].v)) * f]); }
  if (pts.length > 1) d.polyline(pts, p.ink, 2.6);
  curve.forEach((e, i) => { if (i <= prog) d.circle(X(i), Y(e.v), 4 * u, { fill: p.surface, stroke: p.ink, lw: 2 }); });
  // las tres corridas de la demostración y los intentos de la persona
  DEMO_B.forEach((B, i) => marker(S, X(Math.log2(B)), Y(finalLoss({ run: demoRun(i) })), DEMO_SH[i], DEMO_T[i], 5.5));
  g1.runs.forEach((rr) => marker(S, X(Math.log2(rr.B)), Y(finalLoss(rr)), 'circle', 'w', 6));
  // anotaciones, en el orden de la voz
  const best = curve.reduce((m, e, i) => (e.v < curve[m].v ? i : m), 0);
  badgeF(S, S.portrait ? S.l('pocos pasos', 'few steps') : S.l('lotes enormes: pocos pasos', 'huge batches: few steps'), X(7.6), Y(curve[8].v) - 26 * u, { tone: 'mute', align: 'right', a: F(S, 'tradeoff', 0.32, 0.42) });
  badgeF(S, S.portrait ? S.l('mucho ruido', 'very noisy') : S.l('lotes de 1: mucho ruido', 'batches of 1: very noisy'), X(0.2), Y(curve[0].v) - 30 * u, { tone: 'mute', align: 'left', a: F(S, 'tradeoff', 0.5, 0.6) });
  d.withAlpha(F(S, 'tradeoff', 0.7, 0.8), () => {
    badgeF(S, S.l(`mejor: ${curve[best].B}`, `best: ${curve[best].B}`), X(best), c.y + c.h + 56 * u, { tone: 'dat', align: 'center' });
    d.line(X(best), Y(curve[best].v) + 8 * u, X(best), c.y + c.h, tone(S, 'dat').c, 1.4, [3, 3]);
  });
  d.text(S.l('mediana de 12 corridas; con esta tasa', 'median of 12 runs; for this rate'), r.x + r.w, r.y + r.h, { size: FS(S, 12), color: p.mute, align: 'right', base: 'bottom', a: F(S, 'tradeoff', 0.85, 0.95) });
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 3: el lote a escala real (GPT-3)
// ═════════════════════════════════════════════════════════════════════════
function drawRealBatch(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const pl = 104 * u, pr = 16 * u, pt = 52 * u, pb = 44 * u, c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (t: number) => c.x + t * c.w, Y = (v: number) => c.y + c.h - v * c.h;
  const prog = P(S, 'real-batch', 0.45, 0.85), wt = tone(S, 'w');
  d.text(S.l('GPT-3 · tamaño del lote', 'GPT-3 · batch size'), r.x, r.y, { size: FS(S, 15), weight: 800, color: p.ink, base: 'top' });
  d.text(S.l('medido en tokens: trozos de texto', 'measured in tokens: chunks of text'), r.x, r.y + FS(S, 15) * u * 1.4, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', a: F(S, 'real-batch', 0.2, 0.3) });
  d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
  d.text(S.l('32 mil', '32 thousand'), c.x - 6 * u, Y(0.01), { size: FS(S, 12), font: 'mono', weight: 700, color: wt.ink, align: 'right', base: 'middle', a: F(S, 'real-batch', 0.4, 0.5) });
  d.withAlpha(F(S, 'real-batch', 0.75, 0.85), () => {
    d.text(S.n(3.2, 1) + S.l(' millones', ' million'), c.x - 6 * u, Y(1), { size: FS(S, 12), font: 'mono', weight: 700, color: wt.ink, align: 'right', base: 'middle' });
    d.line(c.x, Y(1), c.x + c.w, Y(1), p.line, 1, [4, 4]);
  });
  d.text(S.l('avance del entrenamiento → (sin escala)', 'training progress → (not to scale)'), c.x + c.w, c.y + c.h + 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
  const t1 = 0.3, pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * prog; const v = t < t1 ? 0.01 + 0.99 * (t / t1) : 1; pts.push([X(t), Y(v)]); }
  if (prog > 0 && pts.length > 1) { d.polyline(pts, wt.c, 3.4); const q = pts[pts.length - 1]; marker(S, q[0], q[1], 'circle', 'w', 6.5); }
  d.text(S.l('Brown et al., 2020 · Tabla 2.1 y Apéndice B', 'Brown et al., 2020 · Table 2.1 and Appendix B'), r.x + r.w, r.y + r.h, { size: FS(S, 12), color: p.mute, align: 'right', base: 'bottom', a: F(S, 'real-batch', 0.85, 0.95) });
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 4: el cañón, los optimizadores y el calendario
// ═════════════════════════════════════════════════════════════════════════
const legendH = (S: Frame, n: number) => FS(S, 13) * S.u * 1.55 * n + 8 * S.u;
function legend(S: Frame, x: number, y: number, items: { tone: Tone; shape: Shape; text: string; dash?: boolean; a?: number }[], a = 1, hi = 0) {
  if (a <= 0.01) return;
  const { d, pal: p } = S, u = S.u, sz = FS(S, 13), rh = sz * u * 1.55;
  const wmax = Math.max(...items.map((it) => d.measure(it.text, { size: sz, weight: 700 })));
  d.withAlpha(a, () => {
    d.rect(x, y, wmax + 44 * u, rh * items.length + 8 * u, { fill: alpha(p.stage, 0.88), stroke: hi > 0.5 ? p.ink : p.line, lw: hi > 0.5 ? 2 : 1, r: 3 });
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
const etaLbl = (S: Frame, eta: number) => `η = ${S.n(eta, eta < 0.1 ? 3 : 2)}`;

function drawCanyonLayer(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, id = segId(S);
  const v = landView(S, R.main, CANYON), high = S.on('warm-problem');
  d.rect(v.r.x, v.r.y, v.r.w, v.r.h, { fill: alpha(p.surface, 0.5) });
  drawLand(S, v, 1);
  axisNames(S, v, 1, 1);
  drawCloud(S, v, { dim: 0.55, a: 0.8 });
  drawMin(S, v, 1, !S.on('momentum'));
  d.text(S.l('paisaje de juguete', 'toy landscape'), v.r.x + v.r.w - 6, v.r.y + 5, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage });
  if (high) drawStart(S, v, START_HIGH, F(S, 'warm-problem', 0.05, 0.15), S.is('warm-problem') || S.is('warmup') ? S.l('inicio en zona empinada', 'start on steep ground') : undefined);
  else drawStart(S, v, START_NEAR, F(S, 'optimizer', 0.05, 0.15), S.l('inicio', 'start'));
  const L = (items: Parameters<typeof legend>[3], a = 1) => legend(S, v.r.x + 8 * u, v.r.y + 28 * u, items, a);

  // ── lateral: gráfica arriba (o izquierda) y lecturas abajo (o derecha) ──
  const aside = R.aside;
  const chartRect: Rect = S.portrait ? { x: aside.x, y: aside.y, w: aside.w * 0.56, h: aside.h } : { x: aside.x, y: aside.y, w: aside.w, h: aside.h * 0.46 };
  const infoRect: Rect = S.portrait ? { x: aside.x + aside.w * 0.6, y: aside.y, w: aside.w * 0.4, h: aside.h } : { x: aside.x, y: aside.y + aside.h * 0.52, w: aside.w, h: aside.h * 0.48 };
  const lossSide = (series: Series[], T: number, items: { l: string; v: string; t?: Tone }[], a = 1) => {
    lossChart(S, chartRect, series, { T, thr: THR, a, title: S.l('error (escala logarítmica)', 'error (log scale)') });
    readouts(S, infoRect, items, S.portrait ? 1 : 2, { rowH: S.portrait ? 40 : 48, size: S.portrait ? 17 : 21, a });
  };

  if (id === 'canyon' || id === 'canyon-why' || id === 'optimizer') {
    const out = id === 'optimizer' ? 1 - F(S, 'optimizer', 0, 0.15) : 1;
    const along = [toXY(0.5, -0.25), toXY(2.4, -0.25)].map((q) => v.pt(q)), across = [toXY(-1.3, -0.8), toXY(-1.3, 0.8)].map((q) => v.pt(q));
    const mid = [(across[0][0] + across[1][0]) / 2, (across[0][1] + across[1][1]) / 2];
    d.withAlpha(out * F(S, 'canyon', 0.4, 0.52), () => {
      d.arrow(mid[0], mid[1], across[0][0], across[0][1], p.ink, 3, 10); d.arrow(mid[0], mid[1], across[1][0], across[1][1], p.ink, 3, 10);
      badgeF(S, S.l('paredes: empinadas', 'walls: steep'), across[1][0] + 10 * u, across[1][1] + 6 * u, { tone: 'err', align: 'left' });
    });
    d.withAlpha(out * F(S, 'canyon', 0.7, 0.82), () => {
      d.arrow(along[0][0], along[0][1], along[1][0], along[1][1], p.ink, 3, 10);
      const txt = S.l('fondo: casi plano', 'bottom: almost flat'), bw = d.measure(txt, { size: FS(S, 12), weight: 600 }) + 14 * u;
      badgeF(S, txt, Math.min((along[0][0] + along[1][0]) / 2 + 36 * u, v.r.x + v.r.w - bw / 2 - 4 * u), (along[0][1] + along[1][1]) / 2 + 28 * u, { tone: 'dat' });
    });
    if (id === 'canyon-why') {
      const rows = [
        { label: S.l('fondo', 'bottom'), value: CANYON.H1, text: S.n(CANYON.H1, 1), tone: 'dat' as Tone, a: F(S, 'canyon-why', 0.12, 0.22) },
        { label: S.l('paredes', 'walls'), value: h2eff(CANYON), text: S.n(h2eff(CANYON), 0), tone: 'err' as Tone, a: F(S, 'canyon-why', 0.25, 0.35) },
      ];
      d.withAlpha(F(S, 'canyon-why', 0.02, 0.12), () => {
        d.text(S.l('qué tan rápido se empina', 'how fast it gets steeper'), aside.x, aside.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top', w: aside.w });
        hbars(S, { x: aside.x, y: aside.y + 30 * u, w: aside.w, h: 72 * u }, rows, { max: h2eff(CANYON), labelW: 76, rowH: 34 * u });
      });
      d.text(S.l(`paredes: unas ${S.n(h2eff(CANYON) / CANYON.H1, 0)} veces más empinadas`, `walls: about ${S.n(h2eff(CANYON) / CANYON.H1, 0)} times steeper`), aside.x, aside.y + 112 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', w: aside.w, a: F(S, 'canyon-why', 0.4, 0.5) });
    }
    if (id === 'optimizer') {
      const bh = Math.min(70 * u, aside.h * 0.4), gap = 12 * u;
      const b1: Rect = { x: aside.x, y: aside.y, w: aside.w, h: bh }, b2: Rect = { x: aside.x, y: aside.y + bh + gap, w: aside.w, h: bh };
      boxS(S, b1, S.l('Optimizador', 'Optimizer'), { tone: 'ink', sub: S.l('pendiente → paso', 'slope → step'), size: 16, a: F(S, 'optimizer', 0.08, 0.18) });
      boxS(S, b2, 'SGD', { tone: 'w', sub: S.l('paso = η × pendiente', 'step = η × slope'), size: 16, a: F(S, 'optimizer', 0.5, 0.6) });
      if (S.portrait) { /* en vertical las dos cajas caben una sobre otra en el lateral */ }
    }
    return;
  }
  if (id === 'sgd-big') {
    const A = R_SGD_A(), Bd = R_SGD_DIV(), kA = 80 * P(S, 'sgd-big', 0.05, 0.5), kB = 6 * P(S, 'sgd-big', 0.6, 0.76), twoOn = F(S, 'sgd-big', 0.56, 0.62);
    drawRun(S, v, A, kA, { tone: 'w', lw: 2.2, a: 1 - 0.6 * twoOn, marker: twoOn < 0.5 });
    if (twoOn > 0.01) { drawRun(S, v, Bd, kB, { tone: 'err', shape: 'square', lw: 2.6, a: twoOn }); badgeF(S, S.l('¡diverge!', 'diverges!'), v.r.x + v.r.w / 2, v.r.y + v.r.h * 0.28, { tone: 'err', a: F(S, 'sgd-big', 0.76, 0.84) }); }
    L([{ tone: 'w', shape: 'circle', text: 'SGD · ' + etaLbl(S, 0.08) }, { tone: 'err', shape: 'square', text: 'SGD · ' + etaLbl(S, 0.11), a: twoOn }], F(S, 'sgd-big', 0.02, 0.1));
    const two = twoOn > 0.5;
    lossSide([{ run: A, k: kA, tone: 'w', a: two ? 0.5 : 1 }, ...(twoOn > 0.01 ? [{ run: Bd, k: kB, tone: 'err' as Tone, dash: [5, 3] }] : [])], 100,
      [{ l: S.l('pasos', 'steps'), v: String(Math.floor(two ? kB : kA)), t: 'ink' }, { l: S.l('error', 'error'), v: errTxt(S, two ? lossAt(Bd, kB) : lossAt(A, kA)), t: 'err' }], F(S, 'sgd-big', 0, 0.1));
    return;
  }
  if (id === 'sgd-small') {
    const Rr = R_SGD_SMALL(), k = 120 * P(S, 'sgd-small', 0.05, 0.85);
    drawRun(S, v, R_SGD_A(), 80, { tone: 'w', lw: 1.6, a: 0.25 * (1 - F(S, 'sgd-small', 0, 0.2)), dots: false, marker: false });
    drawRun(S, v, Rr, k, { tone: 'w', lw: 2.4 });
    L([{ tone: 'w', shape: 'circle', text: 'SGD · ' + etaLbl(S, 0.02) }]);
    lossSide([{ run: Rr, k, tone: 'w' }], 120, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'error'), v: errTxt(S, lossAt(Rr, k)), t: 'err' }]);
    d.withAlpha(F(S, 'sgd-small', 0.55, 0.65), () => { const [mx, my] = v.pt([0, 0]); badgeF(S, S.l('avanza muy despacio', 'crawls along'), mx - 40 * u, my + 40 * u, { tone: 'w' }); });
    return;
  }
  if (id === 'momentum' || id === 'momentum-cost') {
    const mo = R_MOM(), k = id === 'momentum' ? 30 * P(S, 'momentum', 0.15, 0.9) : 60 * P(S, 'momentum-cost', 0.05, 0.85);
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 2.6 });
    const n = Math.min(mo.pts.length - 2, Math.floor(k));
    if (n >= 1) { const p0 = mo.pts[n], p1 = mo.pts[n + 1], [x0, y0] = v.pt(p0), [x1, y1] = v.pt(p1); d.arrow(x0, y0, x0 + (x1 - x0) * 5, y0 + (y1 - y0) * 5, tone(S, 'sig').ink, 2.2, 8); }
    L([{ tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') + ' · ' + etaLbl(S, 0.015) }]);
    if (id === 'momentum') {
      momentumRule(S, aside, F(S, 'momentum', 0.05, 0.15), F(S, 'momentum', 0.45, 0.55));
    } else {
      // el primer vaivén: la pelota cruza el fondo del valle y sube del otro lado (el «pasarse de largo»)
      let imax = 0, vmin = 9; mo.pts.forEach((q, i) => { const vv = toUV(q[0], q[1])[1]; if (i > 0 && i < 30 && vv < vmin) { vmin = vv; imax = i; } });
      if (k > imax && vmin < -0.15) { const [ox, oy] = v.pt(mo.pts[imax]); badgeF(S, S.l('se pasa de largo', 'overshoots'), ox + 62 * u, oy + 6 * u, { tone: 'sig', a: F(S, 'momentum-cost', 0.35, 0.45) }); }
      d.text(S.l('flecha: la velocidad', 'arrow: the velocity'), v.r.x + 10 * u, v.r.y + v.r.h - 12 * u, { size: FS(S, 13), weight: 700, color: tone(S, 'sig').ink, base: 'bottom', halo: p.stage });
      lossSide([{ run: mo, k, tone: 'sig' }], 100, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'error'), v: errTxt(S, lossAt(mo, k)), t: 'err' }], F(S, 'momentum-cost', 0, 0.1));
    }
    return;
  }
  if (id === 'momentum-why') {
    const sg = R_SGD_REF(), mo = R_MOM(), k = 60 * P(S, 'momentum-why', 0.1, 0.9);
    drawRun(S, v, sg, k, { tone: 'w', lw: 1.8, a: 0.85 });
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 2.6 });
    L([{ tone: 'w', shape: 'circle', text: 'SGD · ' + etaLbl(S, 0.06) }, { tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') + ' · ' + etaLbl(S, 0.015) }]);
    lossSide([{ run: sg, k, tone: 'w' }, { run: mo, k, tone: 'sig' }], 100, [{ l: S.l('error SGD', 'SGD error'), v: errTxt(S, lossAt(sg, k)), t: 'w' }, { l: S.l('error momento', 'momentum error'), v: errTxt(S, lossAt(mo, k)), t: 'sig' }], F(S, 'momentum-why', 0, 0.1));
    return;
  }
  if (id === 'adam-idea') {
    const ad = R_ADAM(), mo = R_MOM(), k = 40 * P(S, 'adam-idea', 0.1, 0.85);
    drawRun(S, v, mo, k, { tone: 'sig', shape: 'square', lw: 1.8, a: 0.5, dots: false });
    drawRun(S, v, ad, k, { tone: 'lat', shape: 'diamond', lw: 2.6 });
    L([{ tone: 'sig', shape: 'square', text: S.l('Momento', 'Momentum') }, { tone: 'lat', shape: 'diamond', text: 'Adam · ' + etaLbl(S, 0.25) }]);
    drawWeightBars(S, aside, F(S, 'adam-idea', 0.02, 0.12), [F(S, 'adam-idea', 0.15, 0.25), F(S, 'adam-idea', 0.3, 0.4), F(S, 'adam-idea', 0.45, 0.55)]);
    return;
  }
  if (id === 'adam-how') {
    drawRun(S, v, R_MOM(), 40, { tone: 'sig', shape: 'square', lw: 1.6, a: 0.35, dots: false, marker: false });
    drawRun(S, v, R_ADAM(), 40, { tone: 'lat', shape: 'diamond', lw: 2.6 });
    drawAdamBoxes(S, aside);
    return;
  }
  if (id === 'adam-honest') {
    const ad = R_ADAM(), k = 40 + 80 * P(S, 'adam-honest', 0.05, 0.8);
    drawRun(S, v, ad, k, { tone: 'lat', shape: 'diamond', lw: 2.4, dots: false });
    const [mx, my] = v.pt([0, 0]); badgeF(S, S.l('tiembla cerca del fondo', 'jitters near the bottom'), mx + (S.portrait ? 4 : 30) * u, my - 46 * u, { tone: 'lat', a: F(S, 'adam-honest', 0.3, 0.4) });
    L([{ tone: 'lat', shape: 'diamond', text: 'Adam · ' + etaLbl(S, 0.25) + S.l(' (fija)', ' (fixed)') }]);
    lossSide([{ run: ad, k, tone: 'lat' }], 120, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'error'), v: errTxt(S, lossAt(ad, k)), t: 'err' }], F(S, 'adam-honest', 0, 0.1));
    return;
  }
  if (id === 'race-demo' || id === 'race-read' || id === 'try2') {
    if (userRace(S)) drawRaceUser(S, v, aside, chartRect, infoRect); else drawRaceDemo(S, v, aside, chartRect, infoRect);
    return;
  }
  if (id === 'decay') {
    const c = R_ADAM_C(), dd = R_ADAM_D(), k = 100 * P(S, 'decay', 0.3, 0.9), two = F(S, 'decay', 0.28, 0.38);
    drawRun(S, v, c, k, { tone: 'lat', shape: 'diamond', lw: 1.8, dash: [5, 4], dots: false, a: 0.9 * two });
    drawRun(S, v, dd, k, { tone: 'dat', shape: 'square', lw: 2.8, dots: false, a: two });
    L([{ tone: 'lat', shape: 'diamond', text: S.l('Adam · tasa fija', 'Adam · fixed rate'), dash: true }, { tone: 'dat', shape: 'square', text: S.l('Adam · tasa que baja', 'Adam · decaying rate'), a: two }], F(S, 'decay', 0.05, 0.15));
    drawAsideTwo(S, aside, [{ run: c, k, tone: 'lat', dash: [5, 4], a: two }, { run: dd, k, tone: 'dat', a: two }], 100,
      [{ etas: c.etas, tone: 'lat', dash: [5, 4], k: 100 }, { etas: dd.etas, tone: 'dat', k: Math.max(k, 1), a: two }], 0.35, F(S, 'decay', 0.02, 0.12));
    return;
  }
  if (id === 'warm-problem') {
    const r = R_HIGH_DIV(), k = 4 * P(S, 'warm-problem', 0.4, 0.62);
    drawRun(S, v, r, k, { tone: 'err', shape: 'square', lw: 3 });
    if (k >= r.divAt - 0.2) badgeF(S, S.l('¡sale disparado!', 'it shoots off!'), v.r.x + v.r.w * 0.58, v.r.y + v.r.h * 0.8, { tone: 'err', a: F(S, 'warm-problem', 0.62, 0.7) });
    L([{ tone: 'err', shape: 'square', text: 'SGD · ' + etaLbl(S, HIGH_ETA) + S.l(' (fija)', ' (fixed)') }], F(S, 'warm-problem', 0.3, 0.4));
    lossSide([{ run: r, k, tone: 'err' }], T_SCHED, [{ l: S.l('pasos', 'steps'), v: String(Math.floor(k)), t: 'ink' }, { l: S.l('error', 'error'), v: errTxt(S, lossAt(r, k)), t: 'err' }], F(S, 'warm-problem', 0.3, 0.4));
    return;
  }
  if (id === 'warmup') {
    const r = R_HIGH_OK(), k = WARM * P(S, 'warmup', 0.25, 0.85);
    drawRun(S, v, r, k, { tone: 'w', lw: 2.4, dots: true });
    L([{ tone: 'w', shape: 'circle', text: 'SGD · ' + S.l('calentamiento', 'warmup') }]);
    // escala corta (40 pasos) para que la rampa de los primeros 16 se vea como rampa
    drawAsideTwo(S, aside, [{ run: r, k, tone: 'w' }], 40, [{ etas: r.etas, tone: 'w', k: Math.max(1, k) }], 0.08, F(S, 'warmup', 0.05, 0.15), S.l(`tasa η · calentamiento: ${WARM} pasos`, `rate η · warmup: ${WARM} steps`));
    return;
  }
  if (id === 'sched-demo' || id === 'try3') {
    if (userSched(S)) drawSchedUser(S, v, aside); else drawSchedDemo(S, v, aside);
  }
}

/** Regla del momento, con el 0.9 («nueve décimas») resaltado. */
function momentumRule(S: Frame, r: Rect, a1: number, a2: number) {
  const { d, pal: p } = S, u = S.u, sz = FS(S, S.portrait ? 14 : 16), sg = tone(S, 'sig');
  d.withAlpha(a1, () => {
    d.text(S.l('regla con momento', 'rule with momentum'), r.x, r.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top' });
    d.text(S.l('v: la velocidad', 'v: the velocity'), r.x, r.y + 22 * u, { size: FS(S, 12.5), weight: 700, color: sg.ink, base: 'top' });
  });
  const y1 = r.y + 58 * u, y2 = y1 + sz * u * 1.9;
  d.withAlpha(a1, () => d.text(S.l('v ← ', 'v ← ') + S.n(0.9, 1) + S.l(' · v + pendiente', ' · v + slope'), r.x, y1, { size: sz, font: 'mono', weight: 800, color: sg.ink, base: 'top', w: r.w }));
  d.withAlpha(a2, () => d.text(S.l('peso ← peso − η · v', 'weight ← weight − η · v'), r.x, y2, { size: sz, font: 'mono', weight: 800, color: p.ink, base: 'top', w: r.w }));
  d.withAlpha(a1, () => d.text(S.l(`${S.n(0.9, 1)} = nueve décimas de la velocidad anterior`, `${S.n(0.9, 1)} = nine tenths of the previous velocity`), r.x, y2 + sz * u * 2.2, { size: FS(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: r.w, a: F(S, 'momentum', 0.65, 0.75) }));
}

function drawAsideTwo(S: Frame, aside: Rect, series: Series[], T: number, etas: { etas: number[]; tone: Tone; dash?: number[]; k: number; a?: number }[], etaMax: number, a: number, etaTitle?: string, aLoss = a) {
  const g = 10 * S.u;
  const [r1, r2]: Rect[] = S.portrait ? [{ x: aside.x, y: aside.y, w: aside.w * 0.49, h: aside.h }, { x: aside.x + aside.w * 0.51, y: aside.y, w: aside.w * 0.49, h: aside.h }] : [{ x: aside.x, y: aside.y, w: aside.w, h: (aside.h - g) / 2 }, { x: aside.x, y: aside.y + (aside.h + g) / 2, w: aside.w, h: (aside.h - g) / 2 }];
  etaChart(S, r1, etas.map((e) => ({ ...e })), { T, max: etaMax, a, title: etaTitle ?? S.l('tasa η', 'rate η') });
  lossChart(S, r2, series, { T, thr: THR, a: aLoss, title: S.l('error (escala logarítmica)', 'error (log scale)'), small: S.portrait });
}

function drawWeightBars(S: Frame, r: Rect, a: number, reveal: number[]) {
  const { d, pal: p } = S, u = S.u;
  const runs: Run[] = [R_SGD_REF(), R_MOM(), R_ADAM()];
  const mv = runs.map((rn) => { let a1 = 0, b1 = 0; for (let i = 0; i < 20; i++) { a1 += Math.abs(rn.pts[i + 1][0] - rn.pts[i][0]); b1 += Math.abs(rn.pts[i + 1][1] - rn.pts[i][1]); } return [a1 / 20, b1 / 20]; });
  const mx = Math.max(...mv.flat());
  d.withAlpha(a, () => {
    d.text(S.l('cuánto se mueve cada peso por paso', 'how far each weight moves per step'), r.x, r.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top', w: r.w });
    const top = r.y + (S.portrait ? 30 : 44) * u, rowH = Math.min(46 * u, (r.h - (top - r.y)) / 3), lw = 78 * u;
    ORDER.forEach((o, i) => {
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

function drawAdamBoxes(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, bw = S.portrait ? r.w * 0.3 : r.w * 0.46, bh = (S.portrait ? 74 : 62) * u;
  const mk = (x: number, y: number): Rect => ({ x, y, w: bw, h: bh });
  const A = S.portrait ? [mk(r.x, r.y + 6 * u), mk(r.x + r.w * 0.35, r.y + 6 * u), mk(r.x + r.w * 0.7, r.y + 6 * u)] : [mk(r.x, r.y + 4 * u), mk(r.x + r.w - bw, r.y + 4 * u), mk(r.x + (r.w - bw) / 2, r.y + 4 * u + bh + 46 * u)];
  const tx = ['m', 's', 'η · m / √s'], sub = [S.l('promedio de la pendiente', 'average of the slope'), S.l('promedio de su tamaño', 'average of its size'), S.l('el paso de este peso', 'this weight’s step')], tn: Tone[] = ['sig', 'err', 'lat'];
  const at = [F(S, 'adam-how', 0.2, 0.3), F(S, 'adam-how', 0.5, 0.6), F(S, 'adam-how', 0.75, 0.85)];
  A.forEach((b, i) => { if (at[i] > 0.01) boxS(S, b, tx[i], { tone: tn[i], sub: sub[i], a: at[i], font: 'mono', size: 15 }); });
  const l1 = P(S, 'adam-how', 0.72, 0.8), l2 = P(S, 'adam-how', 0.76, 0.84);
  if (S.portrait) { if (l1 > 0) link(S, A[0], A[1], { tone: 'ink', progress: l1 }); if (l2 > 0) link(S, A[1], A[2], { tone: 'ink', progress: l2 }); }
  else { if (l1 > 0) link(S, A[0], A[2], { tone: 'ink', progress: l1 }); if (l2 > 0) link(S, A[1], A[2], { tone: 'ink', progress: l2 }); }
  d.withAlpha(F(S, 'adam-how', 0.05, 0.15), () => {
    const txt = S.l('por separado para cada peso', 'separately for every weight'), sz = FS(S, 13), n = d.wrap(txt, r.w, { size: sz, weight: 700 }).length;
    d.text(txt, r.x, r.y + r.h - 2 - (n - 1) * sz * u * 1.3, { size: sz, weight: 700, color: p.ink2, base: 'bottom', w: r.w });
  });
}

// ── la comparación de optimizadores ──
function raceK(S: Frame, i: number): number {
  if (!S.is('race-demo')) return S.on('race-demo') ? T_RACE : 0;
  const [a0, a1] = RACE_W[i]; return T_RACE * P(S, 'race-demo', a0, a1);
}
/** Barras «pasos hasta el fondo», con la tasa de cada uno. */
function raceBars(S: Frame, r: Rect, rows: { o: Opt; steps: number; done: boolean; eta: number; a: number; hi: number; etaHi: number }[], a = 1) {
  const { d, pal: p } = S, u = S.u, ts = FS(S, 12), top = r.y + d.wrap(S.l(`pasos hasta el fondo (error < ${S.n(THR, 2)})`, `steps to reach the bottom (error < ${S.n(THR, 2)})`), r.w, { size: ts, weight: 700 }).length * ts * u * 1.3 + 6 * u;
  const rh = Math.min(44 * u, (r.y + r.h - top) / 3), max = 80;
  d.withAlpha(a, () => {
    d.text(S.l(`pasos hasta el fondo (error < ${S.n(THR, 2)})`, `steps to reach the bottom (error < ${S.n(THR, 2)})`), r.x, r.y, { size: ts, weight: 700, color: p.mute, base: 'top', w: r.w });
    rows.forEach((row, i) => {
      if (row.a <= 0.01) return;
      const y = top + i * rh, t = tone(S, OPTS[row.o].tone), ly = y + rh * 0.3, by = y + rh * 0.56, bh = rh * 0.3;
      d.withAlpha(row.a, () => {
        if (row.hi > 0.01) d.rect(r.x - 4 * u, y + 1, r.w + 8 * u, rh - 2, { fill: alpha(t.c, 0.15 * row.hi), stroke: alpha(t.c, row.hi), lw: 1.8, r: 3 });
        marker(S, r.x + 7 * u, ly, OPTS[row.o].shape, OPTS[row.o].tone, 4.2);
        d.text(oname(S, row.o), r.x + 18 * u, ly, { size: FS(S, 13), weight: 800, color: t.ink, base: 'middle' });
        const nw = d.measure(oname(S, row.o), { size: FS(S, 13), weight: 800 }), ew = d.measure(etaLbl(S, row.eta), { size: FS(S, 12), font: 'mono', weight: 800 });
        if (26 * u + nw + ew < r.w - 34 * u) d.text(etaLbl(S, row.eta), r.x + 26 * u + nw, ly, { size: FS(S, 12), font: 'mono', weight: row.etaHi > 0.5 ? 800 : 600, color: row.etaHi > 0.5 ? p.ink : p.mute, base: 'middle' });
        const bwMax = r.w - 8 * u, bw = Math.max(2, bwMax * Math.min(1, row.steps / max));
        d.rect(r.x, by, bwMax, bh, { fill: p.surface2 });
        d.rect(r.x, by, bw, bh, { fill: t.c });
        d.text(row.done ? String(row.steps) : '…', r.x + r.w, ly, { size: FS(S, 14), font: 'mono', weight: 800, color: t.ink, align: 'right', base: 'middle' });
      });
    });
  });
}
function drawRaceDemo(S: Frame, v: LView, aside: Rect, chartRect: Rect, infoRect: Rect) {
  const u = S.u, read = S.is('race-read');
  const hi = read ? [F(S, 'race-read', 0.02, 0.1) * (1 - F(S, 'race-read', 0.2, 0.26)), F(S, 'race-read', 0.22, 0.3) * (1 - F(S, 'race-read', 0.38, 0.44)), F(S, 'race-read', 0.4, 0.48) * (1 - F(S, 'race-read', 0.56, 0.62))] : [0, 0, 0];
  const etaHi = read ? F(S, 'race-read', 0.6, 0.7) : 0;
  const series: Series[] = [];
  const rows = ORDER.map((o, i) => {
    const r = REF[o](), k = raceK(S, i), started = !S.is('race-demo') || P(S, 'race-demo', 0, 1) >= RACE_W[i][0];
    const active = S.is('race-demo') && started && k < T_RACE, emph = read ? 0.35 + 0.65 * Math.max(hi[i], etaHi, hi.every((h) => h < 0.01) ? 1 : 0) : 1;
    if (started) {
      drawRun(S, v, r, k, { tone: OPTS[o].tone, shape: OPTS[o].shape, lw: active ? 2.6 : 2, dots: false, a: active ? 1 : 0.75 * emph });
      series.push({ run: r, k, tone: OPTS[o].tone, a: active ? 1 : 0.7 });
    }
    return { o, steps: Math.min(Math.floor(k), r.hit), done: r.hit >= 0 && k >= r.hit, eta: OPTS[o].eta, a: started ? F(S, 'race-demo', RACE_W[i][0] - 0.02, RACE_W[i][0] + 0.04) : 0, hi: hi[i], etaHi };
  });
  legend(S, v.r.x + 8 * u, v.r.y + 28 * u, ORDER.map((o, i) => ({ tone: OPTS[o].tone, shape: OPTS[o].shape, text: `${oname(S, o)} · ${etaLbl(S, OPTS[o].eta)}`, a: rows[i].a > 0.01 ? 1 : 0.2 })), F(S, 'race-demo', 0.02, 0.08), etaHi);
  lossChart(S, chartRect, series, { T: T_RACE, thr: THR, title: S.l('error (escala logarítmica)', 'error (log scale)'), small: S.portrait, a: F(S, 'race-demo', 0, 0.06) });
  raceBars(S, infoRect, rows, F(S, 'race-demo', 0, 0.06));
}
function drawRaceUser(S: Frame, v: LView, aside: Rect, chartRect: Rect, infoRect: Rect) {
  const { d, pal: p } = S, g = G2(S);
  const all = g.runs.slice(); if (g.cur) all.push(g.cur);
  all.forEach((a, i) => { const last = i === all.length - 1; drawRun(S, v, a.run, a.k, { tone: a.tone, shape: a.shape, lw: last ? 2.6 : 1.6, a: last ? 1 : 0.3, dots: false, marker: last }); });
  const c = all[all.length - 1];
  legend(S, v.r.x + 8 * S.u, v.r.y + 28 * S.u, [{ tone: c.tone, shape: c.shape, text: `${oname(S, c.opt)} · ${etaLbl(S, c.eta)}` }]);
  lossChart(S, chartRect, all.map((a, i) => ({ run: a.run, k: a.k, tone: a.tone, a: i === all.length - 1 ? 1 : 0.35 })), { T: T_RACE, thr: THR, title: S.l('error (escala logarítmica)', 'error (log scale)'), small: S.portrait });
  const lo = lossAt(c.run, c.k), div = c.run.divAt >= 0 && c.k >= c.run.divAt;
  const msg = div ? S.l(`${oname(S, c.opt)} sale disparado: tasa demasiado alta`, `${oname(S, c.opt)} shoots off: rate too high`)
    : !c.done ? S.l(`${oname(S, c.opt)} entrenando…`, `${oname(S, c.opt)} training…`)
      : c.run.hit >= 0 ? S.l(`${oname(S, c.opt)} llegó al fondo en ${c.run.hit} pasos`, `${oname(S, c.opt)} reached the bottom in ${c.run.hit} steps`)
        : S.l(`${oname(S, c.opt)} no llegó: error ${f2(S, lo, 2)}`, `${oname(S, c.opt)} did not get there: error ${f2(S, lo, 2)}`);
  const ok = c.done && c.run.hit >= 0 && !div;
  d.text(msg, infoRect.x, infoRect.y, { size: FS(S, 14), weight: 800, color: ok ? tone(S, 'dat').ink : div ? tone(S, 'err').ink : p.ink, base: 'top', w: infoRect.w });
  const n = d.wrap(msg, infoRect.w, { size: FS(S, 14), weight: 800 }).length;
  d.text(S.l(`tasa ajustada: ${etaLbl(S, OPTS[c.opt].eta)}`, `tuned rate: ${etaLbl(S, OPTS[c.opt].eta)}`), infoRect.x, infoRect.y + n * FS(S, 14) * S.u * 1.3 + 10 * S.u, { size: FS(S, 12.5), weight: 600, color: p.mute, base: 'top', w: infoRect.w });
  void aside;
}

// ── el calendario ──
function schedVerdict(S: Frame, run: Run, k: number): { txt: string; t: Tone } {
  if (run.divAt >= 0 && k >= run.divAt - 0.01) return { txt: S.l(`explota en el paso ${run.divAt}`, `blows up at step ${run.divAt}`), t: 'err' };
  if (k < run.steps) return { txt: '', t: 'ink' };
  const fl = run.loss[run.loss.length - 1];
  return fl < THR ? { txt: S.l(`se asienta: error final ${f2(S, fl, 3)}`, `settles: final error ${f2(S, fl, 3)}`), t: 'dat' } : { txt: S.l(`no explota, pero tiembla: error final ${f2(S, fl, 2)}`, `no blow-up, but it jitters: final error ${f2(S, fl, 2)}`), t: 'w' };
}
function schedSide(S: Frame, v: LView, aside: Rect, run: Run, k: number, kind: SchedKind, verdict: { txt: string; t: Tone }, a = 1) {
  const { d, pal: p } = S, u = S.u;
  const [r1, r2]: Rect[] = S.portrait ? [{ x: aside.x, y: aside.y, w: aside.w * 0.49, h: aside.h }, { x: aside.x + aside.w * 0.51, y: aside.y, w: aside.w * 0.49, h: aside.h }] : [{ x: aside.x, y: aside.y, w: aside.w, h: aside.h * 0.36 }, { x: aside.x, y: aside.y + aside.h * 0.4, w: aside.w, h: aside.h * 0.36 }];
  const etas = Array.from({ length: T_SCHED }, (_, t) => (run.etas[t] ?? HIGH_ETA));
  const tn: Tone = verdict.t === 'ink' ? 'w' : verdict.t;
  d.withAlpha(a, () => {
    etaChart(S, r1, [{ etas, tone: 'ink', k: T_SCHED }], { T: T_SCHED, max: 0.08, title: S.l(`tasa η (${S.L(SCHED_SHORT[kind])})`, `rate η (${S.L(SCHED_SHORT[kind])})`), cursor: k });
    lossChart(S, r2, [{ run, k, tone: tn }], { T: T_SCHED, thr: THR, title: S.l('error (escala logarítmica)', 'error (log scale)'), small: S.portrait });
  });
  if (!verdict.txt) return;
  if (!S.portrait) d.text(verdict.txt, aside.x, aside.y + aside.h * 0.82, { size: FS(S, 14), weight: 800, color: tone(S, verdict.t).ink, base: 'top', w: aside.w });
  else badgeF(S, verdict.txt, v.r.x + v.r.w / 2, v.r.y + v.r.h * 0.84, { tone: verdict.t });
}
function drawSchedDemo(S: Frame, v: LView, aside: Rect) {
  const second = !S.is('sched-demo') || P(S, 'sched-demo', 0, 1) >= 0.46;
  if (!second) {
    const r = R_HIGH_DIV(), k = 4 * P(S, 'sched-demo', 0.08, 0.24);
    drawRun(S, v, r, k, { tone: 'err', shape: 'square', lw: 3 });
    legend(S, v.r.x + 8 * S.u, v.r.y + 28 * S.u, [{ tone: 'err', shape: 'square', text: S.L(SCHED_NAME.none) + ' · ' + etaLbl(S, HIGH_ETA) }]);
    schedSide(S, v, aside, r, k, 'none', schedVerdict(S, r, k), F(S, 'sched-demo', 0, 0.08));
  } else {
    const r = R_HIGH_OK(), k = S.is('sched-demo') ? T_SCHED * P(S, 'sched-demo', 0.5, 0.92) : T_SCHED, a = F(S, 'sched-demo', 0.46, 0.52);
    drawRun(S, v, R_HIGH_DIV(), 4, { tone: 'err', shape: 'square', lw: 2, a: 0.3 * (1 - F(S, 'sched-demo', 0.5, 0.6)), marker: false, dots: false });
    drawRun(S, v, r, k, { tone: 'dat', lw: 2.4, dots: false, a });
    legend(S, v.r.x + 8 * S.u, v.r.y + 28 * S.u, [{ tone: 'dat', shape: 'circle', text: S.L(SCHED_NAME.both) + ' · ' + etaLbl(S, HIGH_ETA) }], a);
    schedSide(S, v, aside, r, k, 'both', schedVerdict(S, r, k), a);
  }
}
function drawSchedUser(S: Frame, v: LView, aside: Rect) {
  const g = G3(S), a = g.cur!;
  const verdict = schedVerdict(S, a.run, a.k), tn: Tone = verdict.t === 'ink' ? 'w' : verdict.t;
  drawRun(S, v, a.run, a.k, { tone: tn, shape: verdict.t === 'err' ? 'square' : 'circle', lw: 2.6, dots: false });
  legend(S, v.r.x + 8 * S.u, v.r.y + 28 * S.u, [{ tone: tn, shape: verdict.t === 'err' ? 'square' : 'circle', text: S.L(SCHED_NAME[g.kind]) + ' · ' + etaLbl(S, HIGH_ETA) }]);
  schedSide(S, v, aside, a.run, a.k, g.kind, verdict);
}

// ═════════════════════════════════════════════════════════════════════════
// Fase 5: hiperparámetros, búsqueda, receta real, resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawHyper(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const items: { l: string; v: string; x01: number; t: Tone }[] = [
    { l: S.l('lote', 'batch'), v: '32', x01: 0.55, t: 'dat' }, { l: S.l('tasa η', 'rate η'), v: S.n(0.05, 2), x01: 0.35, t: 'w' },
    { l: S.l('optimizador', 'optimizer'), v: 'Adam', x01: 0.8, t: 'lat' }, { l: S.l('épocas', 'epochs'), v: '4', x01: 0.25, t: 'sig' },
    { l: S.l('calendario', 'schedule'), v: S.l('coseno', 'cosine'), x01: 0.65, t: 'err' },
  ];
  const at = [0.04, 0.1, 0.16, 0.24, 0.32];
  const cols = S.portrait ? 3 : 5, rows = Math.ceil(items.length / cols), rad = Math.min(34 * u, (r.w / cols) * 0.32), gh = S.portrait ? 120 * u : 130 * u;
  items.forEach((it, i) => {
    const row = Math.floor(i / cols), n = row === 0 ? Math.min(cols, items.length) : items.length - cols, col = i % cols, rowW = r.w / n;
    const cx = r.x + rowW * (col + 0.5), cyy = r.y + 24 * u + rad + row * gh;
    const a = F(S, 'hyper', at[i], at[i] + 0.08);
    if (a > 0.01) dial(S, cx, cyy, rad, it.x01, it.l, it.v, it.t, a);
  });
  const top = r.y + 24 * u + rows * gh + 6 * u, availH = r.y + r.h - top - 6 * u, bh = S.portrait ? clamp((availH - 10 * u) / 2, 44 * u, 68 * u) : clamp(availH, 56 * u, 84 * u);
  const bw = S.portrait ? r.w : (r.w - 16 * u) / 2;
  const b1: Rect = { x: r.x, y: top, w: bw, h: bh }, b2: Rect = S.portrait ? { x: r.x, y: top + bh + 10 * u, w: bw, h: bh } : { x: r.x + bw + 16 * u, y: top, w: bw, h: bh };
  boxS(S, b1, S.l('Pesos: miles de millones', 'Weights: billions'), { tone: 'w', sub: S.l('se aprenden con gradientes', 'learned with gradients'), size: 16, a: F(S, 'hyper', 0.45, 0.55) });
  boxS(S, b2, S.l('Hiperparámetros: unos pocos', 'Hyperparameters: just a few'), { sub: S.l('los elige una persona', 'a person chooses them'), size: 16, a: F(S, 'hyper', 0.62, 0.72) });
  d.text(S.l('ajustes del entrenamiento (valores de ejemplo)', 'training settings (example values)'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top', a: F(S, 'hyper', 0, 0.08) });
}

function drawSearch(S: Frame, R: Regions) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const etas = [0.01, 0.03, 0.1, 0.3, 1, 3], runs = etas.map((e) => cy('adam', e, 3, 100));
  // «más estable» = menor error medio en los últimos 20 pasos (el primero en cruzar el umbral no siempre es el mejor)
  const tail = runs.map((x) => x.loss.slice(-20).reduce((a, b) => a + b, 0) / 20), best = tail.indexOf(Math.min(...tail));
  const cols = S.portrait ? 2 : 3, rows = S.portrait ? 3 : 2, head = 34 * u, foot = 48 * u, gap = 10 * u;
  const tw = (r.w - gap * (cols - 1)) / cols, th = (r.h - head - foot - gap * (rows - 1)) / rows;
  d.text(S.l('Adam con seis tasas: seis entrenamientos', 'Adam with six rates: six training runs'), r.x, r.y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', a: F(S, 'search', 0, 0.08) });
  const bestA = F(S, 'search', 0.82, 0.9);
  etas.forEach((e, i) => {
    const col = i % cols, row = Math.floor(i / cols), tr: Rect = { x: r.x + col * (tw + gap), y: r.y + head + row * (th + gap), w: tw, h: th };
    const t0 = 0.1 + i * 0.1, a = F(S, 'search', t0, t0 + 0.06), k = P(S, 'search', t0, t0 + 0.2) * 100;
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      const isBest = i === best && bestA > 0.2;
      d.rect(tr.x, tr.y, tr.w, tr.h, { fill: p.surface, stroke: isBest ? tone(S, 'dat').c : p.line, lw: isBest ? 2.6 : 1, r: 3 });
      const inner = inset(tr, 6 * u);
      lossChart(S, { x: inner.x, y: inner.y + 14 * u, w: inner.w, h: inner.h - 14 * u }, [{ run: runs[i], k, tone: 'lat' }], { T: 100, thr: THR, small: true });
      d.text(`η = ${S.n(e, e < 0.1 ? 2 : e < 1 ? 1 : 0)}`, inner.x, inner.y, { size: FS(S, 13), font: 'mono', weight: 800, color: p.ink, base: 'top' });
      const verdict = runs[i].hit >= 0 ? S.l(`${runs[i].hit} pasos`, `${runs[i].hit} steps`) : S.l('no llega', 'not reached');
      if (k >= 99) d.text(verdict, inner.x + inner.w, inner.y, { size: FS(S, 12.5), weight: 800, color: runs[i].hit >= 0 ? tone(S, 'dat').ink : tone(S, 'err').ink, align: 'right', base: 'top' });
    });
  });
  d.withAlpha(bestA, () => {
    d.text(S.l('seis pruebas = seis veces el costo de un entrenamiento', 'six trials = six times the cost of one training run'), r.x, r.y + r.h - FS(S, 12) * u * 1.5, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom', w: r.w });
    d.text(S.l('marcada: termina más estable', 'outlined: ends steadiest'), r.x, r.y + r.h, { size: FS(S, 12), weight: 700, color: tone(S, 'dat').ink, base: 'bottom', w: r.w });
  });
}
const inset = (r: Rect, m: number): Rect => ({ x: r.x + m, y: r.y + m, w: r.w - 2 * m, h: r.h - 2 * m });

function drawRealCard(S: Frame, R: Regions) {
  const u = S.u, r = R.all;
  const w = Math.min(r.w, 600 * u), x = r.x + (r.w - w) / 2, h = Math.min(r.h - 8 * u, 300 * u);
  const rows = [
    { k: S.l('Optimizador', 'Optimizer'), v: 'Adam', t: 'lat' as Tone },
    { k: S.l('Calentamiento', 'Warmup'), v: S.l('375 millones de tokens', '375 million tokens'), t: 'sig' as Tone },
    { k: S.l('Decaimiento', 'Decay'), v: S.l('coseno, hasta el 10 %', 'cosine, down to 10%'), t: 'err' as Tone },
    { k: S.l('Lote (final)', 'Batch (final)'), v: S.n(3.2, 1) + S.l(' millones de tokens', ' million tokens'), t: 'dat' as Tone },
  ];
  const at = [0.12, 0.3, 0.62, 0.85], show = at.reduce((n, a) => n + F(S, 'real', a, a + 0.08), 0);
  kvCard(S, { x, y: r.y + (r.h - h) / 2, w, h }, rows, { title: S.l('GPT-3: la receta publicada', 'GPT-3: the published recipe'), foot: S.l('Brown et al., 2020 (Tabla 2.1 y Apéndice B)', 'Brown et al., 2020 (Table 2.1 and Appendix B)'), show, a: F(S, 'real', 0, 0.08) });
}

function drawRecap(S: Frame, R: Regions) {
  const r = R.all, u = S.u;
  const labels = [S.l('Lote', 'Batch'), S.l('Optimizador', 'Optimizer'), S.l('Calendario', 'Schedule')];
  const subs = [S.l('abarata cada paso', 'makes each step cheaper'), S.l('pendiente → paso', 'slope → step'), S.l('la tasa con el tiempo', 'the rate over time')];
  const tones: Tone[] = ['dat', 'lat', 'w'], at = [0.05, 0.28, 0.52];
  const bw = Math.min(S.portrait ? r.w * 0.8 : r.w * 0.27, 230 * u), bh = 70 * u;
  const pos: Rect[] = S.portrait ? [0, 1, 2].map((i) => ({ x: r.x + (r.w - bw) / 2, y: r.y + 14 * u + i * (bh + 36 * u), w: bw, h: bh })) : [0, 1, 2].map((i) => ({ x: r.x + r.w * (0.1 + 0.3 * i), y: r.y + r.h * 0.25, w: bw, h: bh }));
  pos.forEach((b, i) => { const a = F(S, 'recap', at[i], at[i] + 0.08); if (a > 0) boxS(S, b, labels[i], { tone: tones[i], sub: subs[i], a, size: 17 }); });
  for (let i = 0; i < 2; i++) { const a = P(S, 'recap', at[i + 1] - 0.06, at[i + 1]); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  const y = S.portrait ? pos[2].y + bh + 22 * u : pos[0].y + bh + 56 * u;
  S.d.text(S.l('lo decide quien entrena, no la red', 'decided by whoever trains, not by the network'), r.x + r.w / 2, y, { size: FS(S, 16), weight: 800, color: S.pal.ink, align: 'center', base: 'top', w: r.w * 0.9, a: F(S, 'recap', 0.78, 0.88) });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cyy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cyy - 70 * u - (18 * sc) / 2 + 20 * u, { scale: sc, mood: 'think', a: F(S, 'bridge', 0.02, 0.12) });
  d.withAlpha(F(S, 'bridge', 0.1, 0.2), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cyy + 60 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Generalizar y evaluar', 'Generalizing and evaluating'), cx, cyy + 92 * u, { size: 24, weight: 800, align: 'center', w: S.W * 0.9 });
  });
}

export default scene;
