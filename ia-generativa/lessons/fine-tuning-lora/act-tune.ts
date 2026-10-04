// Acto 4: LoRA en el modelo diminuto. demo-lora (entrenar con rango 2 y ver B·A llenarse), rank-demo (rangos 1, 2 y 8),
// try-train (turno: entrena tu adaptador), replay (con y sin ejemplos originales) y swap (una base, muchos adaptadores).
// Todo son corridas REALES del modelo diminuto (runs.ts); nada de lo que se ve es dibujado a mano.
import { clamp, inset, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BASE } from './base';
import { drawPanel } from './panel';
import { getRun, STEPS, type Snap, type Spec } from './runs';
import { RATE, GOAL_NEW, GOAL_OLD, st, trialSpec } from './state';
import { CHANGED, FT, REPLAY, TARGET, TARGET_BASE, mapOf, skills, type RuleId } from './task';
import { FS, chip, drawMap, drawSigned, maxAbs, meter, para, wrongCells } from './ui';

const BASE_MAP = mapOf(BASE, null);
const W2_AT_LOAD = BASE.W2.slice();
/** ¿Sigue la matriz congelada idéntica, número a número, a como se cargó? (Solo tiene sentido tras haber entrenado.) */
/** Celdas del mapa donde el modelo base (sin adaptador) difiere del mapa base de referencia: 0 si quitar el adaptador devuelve el modelo exacto. */
let SWAP_DIFF = -1;
const swapDiff = () => { if (SWAP_DIFF < 0) { const m = mapOf(BASE, null); SWAP_DIFF = 0; for (let k = 0; k < m.length; k++) if (m[k] !== BASE_MAP[k]) SWAP_DIFF++; } return SWAP_DIFF; };
export const baseUntouched = () => BASE.W2.every((v, i) => v === W2_AT_LOAD[i]);

const spec = (mode: number, replay: boolean, rule: RuleId = 'A'): Spec => ({ mode, replay, rule });
const WRONG = new WeakMap<Snap, Uint8Array>();
const wrongOf = (s: Snap, rule: RuleId): Uint8Array => { let w = WRONG.get(s); if (!w) { w = wrongCells(s.pred, TARGET[rule], TARGET_BASE, CHANGED[rule], 'old'); WRONG.set(s, w); } return w; };
const stepIn = (S: Frame, seg: string, delay: number) => (S.on(seg) ? clamp(Math.floor((S.since(seg) - delay) * RATE), 0, STEPS) : 0);
const pct = (S: Frame, v: number) => S.n(v * 100, 0) + '\u00a0%';

// ── reparto: mapa cuadrado + lateral (escritorio) o mapa arriba a la izquierda + lateral derecho + panel abajo (teléfono) ──
interface Lay { map: Rect; panel: Rect; right: Rect | null; cap: number }
function toyLay(S: Frame, wantRight: boolean): Lay {
  const u = S.u, all = inset(S.full(), 14 * u), cap = (S.portrait ? 38 : 22) * u;
  if (S.portrait) {
    const side = Math.min(all.w * (wantRight ? 0.56 : 0.6), all.h * 0.46 - cap);
    const map: Rect = { x: all.x, y: all.y, w: side, h: side };
    const right: Rect = { x: all.x + side + 10 * u, y: all.y, w: all.w - side - 10 * u, h: side + cap };
    const py = all.y + side + cap + 8 * u;
    return { map, right, panel: { x: all.x, y: py, w: all.w, h: all.y + all.h - py }, cap };
  }
  const side = Math.min(all.w * 0.55, all.h - cap);
  const map: Rect = { x: all.x, y: all.y + (all.h - cap - side) / 2, w: side, h: side };
  const ax = map.x + side + 18 * u, aside: Rect = { x: ax, y: all.y, w: all.x + all.w - ax, h: all.h };
  return { map, right: wantRight ? aside : null, panel: aside, cap };
}

/** Matrices B (d×r), A (r×k) y el producto ΔW = B·A (32×32) con sus rótulos; el rango de color es fijo para que no «respire» al entrenar. */
function falk(S: Frame, r: Rect, snap: Snap, fin: Snap, a: number) {
  const { d, pal: p } = S, u = S.u, rk = snap.r || fin.r, gap = 6 * u;
  const lab = 34 * u;                                    // rótulos arriba (A) y abajo (B, ΔW)
  const cs = Math.max(2, Math.min((r.w - gap) / (32 + rk), (r.h - gap - 2 * lab) / (32 + rk)));
  const w = (32 + rk) * cs + gap, x = r.x + (r.w - w) / 2, y = r.y + lab;
  const B = snap.B ?? new Array(32 * rk).fill(0), A = snap.A ?? new Array(rk * 32).fill(0);
  const rB = Math.max(0.05, maxAbs(fin.B ?? [0])), rA = Math.max(0.05, maxAbs(fin.A ?? [0])), rD = Math.max(0.05, maxAbs(fin.dW));
  d.withAlpha(a, () => {
    const ax = x + rk * cs + gap, by = y + rk * cs + gap;
    drawSigned(S, ax, y, A, rk, 32, cs, { range: rA });
    drawSigned(S, x, by, B, 32, rk, cs, { range: rB });
    drawSigned(S, ax, by, snap.dW, 32, 32, cs, { range: rD });
    const t = tone(S, 'w');
    d.text('A', ax + 16 * cs, y - 6 * u, { size: FS(S, 12), weight: 700, color: t.ink, align: 'center', base: 'bottom' });
    d.text('B', x + rk * cs / 2, by + 32 * cs + 6 * u, { size: FS(S, 12), weight: 700, color: t.ink, align: 'center', base: 'top' });
    d.text('ΔW = B·A', ax + 16 * cs, by + 32 * cs + 6 * u, { size: FS(S, 12), weight: 700, color: p.ink, align: 'center', base: 'top' });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// demo-lora: LoRA de rango 2 sobre la capa central; la corrección arranca en blanco
// ═════════════════════════════════════════════════════════════════════════════
const LORA2 = spec(2, false);
export function drawLoraDemo(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, L = toyLay(S, true), run = getRun(LORA2);
  const step = stepIn(S, 'demo-lora', 5.5), snap = run.at(step), fin = run.at(STEPS);
  d.withAlpha(vis, () => {
    drawMap(S, L.map, snap.pred, { reveal: S.reveal('demo-lora', 0, 0.9), hatch: CHANGED.A, data: FT.A, dataA: 0.95 });
    d.text(S.l('rayado = regla nueva · marcas = tus ejemplos', 'hatched = new rule · marks = your examples'), L.map.x, L.map.y + L.map.h + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: Math.max(L.map.w, 150 * u) });
    const a2 = S.reveal('demo-lora', 0.8, 0.6);
    if (S.portrait) {
      drawPanel(S, L.panel, { a: a2, trainable: 128, frozen: 1251, newSk: snap.newSk, oldSk: snap.oldSk, oldRef: 1, showLoss: false });
    } else {
      const compact = S.H < 360, ph = (compact ? 158 : 180) * u;
      drawPanel(S, { ...L.panel, h: ph }, { a: a2, trainable: 128, frozen: 1251, newSk: snap.newSk, oldSk: snap.oldSk, oldRef: 1, showLoss: false, title: compact ? undefined : S.l('LoRA r = 2 · capa central', 'LoRA r = 2 · middle layer') });
    }
    const fr = L.right!, phh = (S.H < 360 ? 158 : 180) * u, fr2: Rect = S.portrait ? fr : { x: fr.x, y: fr.y + phh + 6 * u, w: fr.w, h: fr.h - phh - 6 * u };
    falk(S, fr2, snap, fin, S.reveal('demo-lora', 1.6, 0.7));
    const blank = S.reveal('demo-lora', 2.4, 0.5) * (1 - clamp(step / 10));
    if (blank > 0.01) d.text(S.l('B = 0: la corrección empieza en blanco', 'B = 0: the correction starts blank'), fr2.x + fr2.w / 2, fr2.y + fr2.h - 2 * u, { size: FS(S, 12), weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'bottom', w: fr2.w, a: blank });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// rank-demo: rangos 1, 2 y 8 sobre las mismas dos reglas nuevas
// ═════════════════════════════════════════════════════════════════════════════
export function drawRanks(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), gap = (S.portrait ? 8 : 18) * u;
  const ranks = [1, 2, 8], colW = (all.w - gap * 2) / 3;
  const head = 62 * u, meters = 88 * u, foot = 22 * u;
  const side = Math.min(colW, all.h - head - meters - foot - 8 * u);
  const y0 = all.y + Math.max(0, (all.h - head - side - meters - foot) / 2);
  const step = stepIn(S, 'rank-demo', 0.8);
  d.withAlpha(vis, () => {
    ranks.forEach((r, i) => {
      const x = all.x + i * (colW + gap), cx = x + colW / 2, ai = S.reveal('rank-demo', 0.1 + i * 0.25, 0.5);
      const run = getRun(spec(r, false)), snap = run.at(step);
      d.withAlpha(ai, () => {
        chip(S, S.l(`rango ${r}`, `rank ${r}`), cx, y0 + 12 * u, { tone: 'w', mono: false });
        para(S, S.l(`${r * 64} números`, `${r * 64} numbers`), cx, y0 + 30 * u, colW, { align: 'center', size: 12, weight: 700, color: tone(S, 'w').ink });
        const mx = x + (colW - side) / 2, my = y0 + head - 10 * u;
        drawMap(S, { x: mx, y: my, w: side, h: side }, snap.pred, { hatch: CHANGED.A, reveal: 1 });
        const my2 = my + side + 10 * u;
        meter(S, { x: mx, y: my2, w: side, h: 36 * u }, S.l('nueva', 'new'), snap.newSk, { tone: 'dat', hatch: true });
        meter(S, { x: mx, y: my2 + 44 * u, w: side, h: 36 * u }, S.l('original', 'original'), snap.oldSk, { tone: 'dat', ghost: 1 });
      });
    });
    d.text(S.l('mismas dos reglas nuevas · 300 pasos · medido en el mapa', 'same two new rules · 300 steps · measured on the map'), all.x + all.w / 2, all.y + all.h - 2 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'bottom', w: all.w, a: S.reveal('rank-demo', 1.5, 0.5) });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// try-train (turno): rango, repaso y «Entrenar adaptador»
// ═════════════════════════════════════════════════════════════════════════════
export function drawTrain(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, L = toyLay(S, S.portrait), s = st(S), tr = s.tr;
  const live = trialSpec(S), sp = tr ? tr.spec : live;
  const run = getRun(sp), step = tr ? tr.step : 0, snap = run.at(step);
  const rp = sp.replay;
  const wrongNow = tr && tr.step >= STEPS ? wrongOf(snap, 'A') : null;
  d.withAlpha(vis, () => {
    drawMap(S, L.map, snap.pred, { reveal: S.reveal('try-train', 0, 0.8), hatch: CHANGED.A, data: FT.A, extra: rp ? REPLAY.A : undefined, wrong: wrongNow, dataA: 0.95 });
    d.text(rp ? S.l('rayado = nueva · ■ = ejemplos originales', 'hatched = new · ■ = original examples') : S.l('rayado = regla nueva · marcas = tus ejemplos', 'hatched = new rule · marks = your examples'), L.map.x, L.map.y + L.map.h + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: Math.max(L.map.w, 150 * u) });
    // veredicto
    let verdict: { t: string; tn: 'dat' | 'err' | 'ink' };
    if (!tr) verdict = { t: S.l('Elige el rango y si repasas; luego pulsa «Entrenar adaptador».', 'Pick the rank and whether to replay; then press “Train adapter”.'), tn: 'ink' };
    else if (!tr.done) verdict = { t: S.l(`Entrenando… paso ${tr.step} de ${STEPS}`, `Training… step ${tr.step} of ${STEPS}`), tn: 'ink' };
    else {
      const okN = tr.newSk >= GOAL_NEW, okO = tr.oldSk >= GOAL_OLD;
      const mk = (b: boolean) => (b ? '✓' : '✗');
      const head = S.l(`nueva ${pct(S, tr.newSk)} ${mk(okN)} · original ${pct(S, tr.oldSk)} ${mk(okO)}`, `new ${pct(S, tr.newSk)} ${mk(okN)} · original ${pct(S, tr.oldSk)} ${mk(okO)}`);
      const hint = tr.ok ? S.l('Cumple las dos metas.', 'Both goals met.')
        : (!okN ? S.l(' Lo nuevo no alcanza: ¿qué pasa con el rango?', ' The new rule falls short: what about the rank?') : '') + (!okO ? S.l(' Se olvidó lo anterior: ¿qué falta en los ejemplos?', ' It forgot the old: what is missing from the examples?') : '');
      verdict = { t: head + '\n' + hint.trim(), tn: tr.ok ? 'dat' : 'err' };
    }
    const pn = S.portrait ? L.right! : { x: L.panel.x, y: L.panel.y + L.panel.h - 74 * u, w: L.panel.w, h: 74 * u };
    d.text(verdict.t, pn.x, pn.y + (S.portrait ? 0 : 4 * u), { size: FS(S, 13), weight: 700, color: verdict.tn === 'ink' ? p.ink2 : tone(S, verdict.tn).ink, base: 'top', w: pn.w, lh: 1.3 });
    const r = sp.mode as number, trainable = r * 64;
    const rect: Rect = S.portrait ? L.panel : { x: L.panel.x, y: L.panel.y, w: L.panel.w, h: L.panel.h - 78 * u };
    drawPanel(S, rect, { trainable, frozen: 1251, newSk: snap.newSk, oldSk: snap.oldSk, oldRef: 1, markNew: GOAL_NEW, markOld: GOAL_OLD, losses: run.losses, step, total: STEPS, showLoss: !!tr, title: S.l('metas: las marcas negras', 'goals: the black marks') });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// replay: sin y con ejemplos originales (rango 2)
// ═════════════════════════════════════════════════════════════════════════════
export function drawReplay(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), gap = 18 * u, colW = (all.w - gap) / 2;
  const head = 54 * u, meters = 88 * u;
  const side = Math.min(colW, all.h - head - meters - 14 * u);
  const y0 = all.y + Math.max(0, (all.h - head - side - meters) / 2);
  const step = stepIn(S, 'replay', 0.7);
  const cols = [{ sp: spec(2, false), title: S.l('sin repaso', 'no replay'), sub: S.l(`${FT.A.length} nuevos`, `${FT.A.length} new`), extra: false }, { sp: spec(2, true), title: S.l('con repaso', 'with replay'), sub: S.l(`${FT.A.length} nuevos + ${REPLAY.A.length} originales`, `${FT.A.length} new + ${REPLAY.A.length} original`), extra: true }];
  d.withAlpha(vis, () => {
    cols.forEach((c, i) => {
      const x = all.x + i * (colW + gap), cx = x + colW / 2, ai = S.reveal('replay', 0.1 + i * 0.3, 0.5);
      const snap = getRun(c.sp).at(step);
      d.withAlpha(ai, () => {
        chip(S, c.title, cx, y0 + 12 * u, { tone: c.extra ? 'dat' : 'err' });
        para(S, c.sub, cx, y0 + 30 * u, colW, { align: 'center', size: 12, weight: 600, color: p.mute });
        const mx = x + (colW - side) / 2, my = y0 + head - 6 * u;
        drawMap(S, { x: mx, y: my, w: side, h: side }, snap.pred, { hatch: CHANGED.A, wrong: wrongOf(snap, 'A'), extra: c.extra ? REPLAY.A : undefined, reveal: 1 });
        const my2 = my + side + 10 * u;
        meter(S, { x: mx, y: my2, w: side, h: 36 * u }, S.l('nueva', 'new'), snap.newSk, { tone: 'dat', hatch: true });
        meter(S, { x: mx, y: my2 + 44 * u, w: side, h: 36 * u }, S.l('original', 'original'), snap.oldSk, { tone: 'dat', ghost: 1 });
      });
    });
    d.text(S.l('punto oscuro = respuesta original perdida · ■ huecos = ejemplos de repaso', 'dark dot = lost original answer · hollow ■ = replay examples'), all.x + all.w / 2, all.y + all.h - 2 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'bottom', w: all.w, a: S.reveal('replay', 1.2, 0.5) });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// swap: una base congelada y varios adaptadores
// ═════════════════════════════════════════════════════════════════════════════
export function drawSwap(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), gap = (S.portrait ? 8 : 18) * u, colW = (all.w - gap * 2) / 3;
  const head = 66 * u, meters = 88 * u, foot = (S.portrait ? 54 : 28) * u;
  const side = Math.min(colW, all.h - head - meters - foot - 6 * u);
  const y0 = all.y + Math.max(0, (all.h - head - side - meters - foot) / 2);
  const cols: { title: string; sub: string; tn: 'ink' | 'w'; rule: RuleId | null; at: number }[] = [
    { title: S.l('base', 'base'), sub: S.l('sin adaptador', 'no adapter'), tn: 'ink', rule: null, at: 0.1 },
    { title: S.l('base + A', 'base + A'), sub: S.l('adaptador A · 128 números', 'adapter A · 128 numbers'), tn: 'w', rule: 'A', at: 2.0 },
    { title: S.l('base + B', 'base + B'), sub: S.l('adaptador B · 128 números', 'adapter B · 128 numbers'), tn: 'w', rule: 'B', at: 3.8 },
  ];
  d.withAlpha(vis, () => {
    cols.forEach((c, i) => {
      const x = all.x + i * (colW + gap), cx = x + colW / 2, ai = S.reveal('swap', c.at, 0.6);
      d.withAlpha(ai, () => {
        chip(S, c.title, cx, y0 + 12 * u, { tone: c.tn });
        para(S, c.sub, cx, y0 + 30 * u, colW, { align: 'center', size: 12, weight: 600, color: c.rule ? tone(S, 'w').ink : p.mute });
        const mx = x + (colW - side) / 2, my = y0 + head - 6 * u;
        if (!c.rule) {
          drawMap(S, { x: mx, y: my, w: side, h: side }, BASE_MAP, { reveal: clamp((S.since('swap') - c.at) / 0.9) });
          meter(S, { x: mx, y: my + side + 10 * u, w: side, h: 36 * u }, S.l('original', 'original'), skills(BASE_MAP, 'A').oldSk, { tone: 'dat' });
        } else {
          const snap = getRun(spec(2, true, c.rule)).at(STEPS);
          drawMap(S, { x: mx, y: my, w: side, h: side }, snap.pred, { hatch: CHANGED[c.rule], reveal: clamp((S.since('swap') - c.at) / 0.9) });
          meter(S, { x: mx, y: my + side + 10 * u, w: side, h: 36 * u }, S.l('nueva', 'new'), snap.newSk, { tone: 'dat', hatch: true });
          meter(S, { x: mx, y: my + side + 54 * u, w: side, h: 36 * u }, S.l('original', 'original'), snap.oldSk, { tone: 'dat', ghost: 1 });
        }
      });
    });
    const a = S.reveal('swap', 6.0, 0.6);
    if (a > 0.01) {
      const done = getRun(spec(2, true, 'A')).done && getRun(spec(2, true, 'B')).done;
      const ok = done && baseUntouched() && swapDiff() === 0;
      const t = ok ? S.l(`✓ La matriz congelada es idéntica antes y después de entrenar (1 024 pesos comparados): quitar el adaptador devuelve el modelo base, exacto.`, `✓ The frozen matrix is identical before and after training (1,024 weights compared): removing the adapter returns the base model, exactly.`)
        : S.l('✗ La matriz congelada cambió (no debería).', '✗ The frozen matrix changed (it should not).');
      d.text(t, all.x, all.y + all.h - foot + 6 * u, { size: FS(S, 12), weight: 700, color: ok ? tone(S, 'dat').ink : tone(S, 'err').ink, base: 'top', w: all.w, a, lh: 1.3 });
    }
  });
}
