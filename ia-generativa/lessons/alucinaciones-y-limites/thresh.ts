// Acto 7 · responder o callar: un umbral de confianza sobre las 424 respuestas reales de Pythia-1.4B (real-data.ts).
// Segundo turno: el puntaje de cada persona (acierto +1, error −k, callar 0) se calcula con los datos medidos, no con una fórmula.
import { Plot, alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { QA } from './real-data';
import { best, outcome, rule, score } from './stats';
import { FS, axes, fitText, fr, holds, pct, smooth, source, stat, tagText } from './ui';

export const KS = [1, 3, 9, 19];
const CONF = QA.conf, OK = [...QA.ok].map((c) => c === '1');
const NB = 50;                                 // tramos de 0,02: el umbral se mueve de 0,02 en 0,02 y cada tramo queda entero a un lado
const HB = (() => {
  const c = new Array(NB).fill(0), w = new Array(NB).fill(0);
  CONF.forEach((v, i) => { const b = Math.min(NB - 1, Math.floor(v * NB + 1e-9)); (OK[i] ? c : w)[b]++; });
  return { c, w, max: Math.max(...c.map((v: number, i: number) => v + w[i])) };
})();

export interface ThrState { tried: Record<number, boolean>; hit: Record<number, boolean>; trace: Record<number, number[]> }
export const thrOf = (S: Frame): ThrState => (S.st.thr ??= { tried: {}, hit: {}, trace: {} });
/** Costo de un error elegido (k). */
export const kOf = (S: Frame) => Number(S.p.kc ?? 1);

/** Umbral que se dibuja: guion al principio; en el turno, el deslizador. */
export function thetaOf(S: Frame): number {
  if (S.on('try2')) return clamp(Number(S.p.thr ?? 0.5));
  if (S.on('cost')) {
    const down = 1 - S.at('cost', 0, 0.9, 'io'), up = fr(S, 'cost', 0.42, 0.56, 'io');
    return 0.5 * Math.max(down, up);
  }
  if (S.on('abstain')) return 0.5 * S.at('abstain', 0.5, 2.8, 'io');
  return 0;
}

/** Turno 2: registra qué umbrales exploró la persona y cuándo se detuvo cerca del mejor puntaje con cada k. */
export function updateThr(S: Frame): boolean {
  if (!S.between('try2', 'mit-ground')) return false;
  const st = thrOf(S), k = kOf(S), th = clamp(Number(S.p.thr ?? 0.5)), key = Math.round(th * NB);
  st.tried[k] = true;
  const tr = (st.trace[k] ??= []);
  if (!tr.includes(key)) tr.push(key);
  const near = score(th, k) >= 0.95 * best(k).score;
  if (holds(S, `thr${k}`, near, 0.6)) st.hit[k] = true;
  return Object.keys(st.hit).length >= 2;
}

// ───────────────────────── dibujo ─────────────────────────
export function drawThresh(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, m = R.main;
  const th = thetaOf(S), k = kOf(S), inTry = S.on('try2'), afterB = S.on('after-b');
  const compact = S.H < 420;
  const mix = smooth(S.at('try2', 0, 0.8));
  const histH = lerp(m.h, compact ? m.h * 0.5 : m.h * 0.54, mix);
  const hr: Rect = { x: m.x, y: m.y, w: m.w, h: histH };
  drawHist(S, hr, th);
  if (inTry && mix > 0.02) {
    const sr: Rect = { x: m.x, y: m.y + histH + (compact ? 4 : 8) * u, w: m.w, h: m.h - histH - (compact ? 4 : 8) * u };
    d.withAlpha(mix, () => (afterB ? drawRules(S, sr, th) : drawScore(S, sr, th, k)));
  }
  drawThreshStats(S, R.aside, th, k);
  source(S, S.l('Pythia-1.4B · 424 preguntas de cultura general · la confianza es la probabilidad de la respuesta', 'Pythia-1.4B · 424 general-knowledge questions · confidence is the probability of the answer'), S.reveal('abstain', 0.2, 0.5));
}

function drawHist(S: Frame, r: Rect, th: number) {
  const { d, pal: p } = S, u = S.u;
  const small = r.h < 200 * u;
  const pl = new Plot(S, r, { xr: [0, 1], yr: [0, HB.max * 1.05], pad: { l: 40, r: 8, t: small ? 16 : 24, b: small ? 34 : 50 } });
  const dat = tone(S, 'dat'), err = tone(S, 'err');
  const a = S.reveal('abstain', 0.0, 0.5);
  axes(S, pl, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [], xFmt: (v) => pct(S, v), yFmt: () => '', grid: false, a, xLabel: small ? '' : S.l('confianza del modelo', 'model confidence'), yLabel: small ? '' : S.l('preguntas', 'questions') });
  const bw = pl.r.w / NB;
  for (let i = 0; i < NB; i++) {
    const c = HB.c[i], w = HB.w[i]; if (c + w === 0) continue;
    const silent = (i + 1) / NB <= th + 1e-9, hc = (pl.r.h * c) / (HB.max * 1.05), hw = (pl.r.h * w) / (HB.max * 1.05), x = pl.r.x + i * bw + 0.5, y0 = pl.r.y + pl.r.h;
    d.withAlpha(a, () => {
      if (silent) {
        d.rect(x, y0 - hc - hw, bw - 1, hc + hw, { fill: alpha(p.mute, 0.22), stroke: alpha(p.mute, 0.5), lw: 1 });
      } else {
        d.rect(x, y0 - hc, bw - 1, hc, { fill: alpha(dat.c, 0.6) });
        if (w > 0) { d.rect(x, y0 - hc - hw, bw - 1, hw, { fill: alpha(err.c, 0.9) }); d.rect(x, y0 - hc - hw, bw - 1, hw, { stroke: err.ink, lw: 1 }); }
      }
    });
  }
  // el umbral
  if (S.on('abstain')) {
    const x = pl.X(th);
    d.line(x, pl.r.y - 2 * u, x, pl.r.y + pl.r.h, p.ink, 2.2);
    d.circle(x, pl.r.y - 2 * u, 5 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
    if (th > 0.06) tagText(S, S.l('callar: «no lo sé»', 'silent: “I don’t know”'), pl.r.x + 6 * u, pl.r.y + 10 * u, { t: 'mute', align: 'left', size: 13, w: Math.max(40, (x - pl.r.x) - 10 * u) });
    tagText(S, S.l('responde', 'answers'), Math.min(pl.r.x + pl.r.w - 4 * u, x + 8 * u + (th < 0.1 ? 0 : 0)), pl.r.y + 10 * u, { t: 'dat', align: x > pl.r.x + pl.r.w - 70 * u ? 'right' : 'left', size: 13 });
    tagText(S, `θ = ${pct(S, th)}`, x, pl.r.y + pl.r.h + (small ? 30 : 44) * u + 0, { t: 'ink', align: 'center', size: 13, a: 0 });
  }
  // leyenda de colores con forma
  if (!small) d.withAlpha(a, () => {
    const lx = pl.r.x + 6 * u, ly = pl.r.y + pl.r.h + 5 * u + 22 * u;
    void lx; void ly;
  });
}

function drawScore(S: Frame, r: Rect, th: number, k: number) {
  const { d, pal: p } = S, u = S.u;
  const b = best(k), ymax = b.score * 1.12, ymin = -b.score * 0.45;
  const small = r.h < 150 * u;
  const pl = new Plot(S, r, { xr: [0, 1], yr: [ymin, ymax], pad: { l: 40, r: 8, t: small ? 8 : 14, b: small ? 22 : 34 } });
  const sig = tone(S, 'sig');
  axes(S, pl, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, Math.round(b.score)], xFmt: (v) => pct(S, v), yFmt: (v) => String(Math.round(v)), grid: true, xLabel: small ? '' : S.l('umbral', 'threshold'), yLabel: small ? '' : S.l(`puntaje con k = ${k}`, `score with k = ${k}`) });
  d.line(pl.r.x, pl.Y(0), pl.r.x + pl.r.w, pl.Y(0), p.lineStrong, 1.6, [5, 4]);
  tagText(S, S.l('callar siempre = 0', 'always silent = 0'), pl.r.x + pl.r.w - 4 * u, pl.Y(0) - 10 * u, { t: 'mute', align: 'right', size: 12.5, a: pl.Y(0) < pl.r.y + 14 * u ? 0 : 1 });
  // los umbrales probados: el punto aparece al visitarlos
  const st = thrOf(S), tr = (st.trace[k] ?? []).slice().sort((x, y) => x - y);
  d.clip(pl.r.x, pl.r.y - 2, pl.r.w, pl.r.h + 4, () => {
    for (let i = 1; i < tr.length; i++) if (tr[i] - tr[i - 1] <= 1) d.line(pl.X(tr[i - 1] / NB), pl.Y(score(tr[i - 1] / NB, k)), pl.X(tr[i] / NB), pl.Y(score(tr[i] / NB, k)), sig.c, 2.4);
    tr.forEach((q) => d.circle(pl.X(q / NB), pl.Y(score(q / NB, k)), 2.6 * u, { fill: sig.c }));
  });
  const x = pl.X(th), y = clamp(pl.Y(score(th, k)), pl.r.y, pl.r.y + pl.r.h);
  d.line(x, pl.r.y, x, pl.r.y + pl.r.h, alpha(p.ink, 0.35), 1.2);
  d.circle(x, y, 6 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
  // la meta: el mejor puntaje posible (sin decir dónde está)
  const ty = pl.Y(b.score);
  d.line(pl.r.x, ty, pl.r.x + pl.r.w, ty, tone(S, 'dat').c, 1.4, [3, 4]);
  tagText(S, S.l(`mejor posible: ${Math.round(b.score)}`, `best possible: ${Math.round(b.score)}`), pl.r.x + 6 * u, ty - 10 * u, { t: 'dat', align: 'left', size: 12.5 });
}

/** Después del turno: el mejor umbral de cada k frente a la regla teórica k / (k + 1). */
function drawRules(S: Frame, r: Rect, th: number) {
  const { d, pal: p } = S, u = S.u;
  void th;
  const small = r.h < 150 * u;
  const pl = new Plot(S, r, { xr: [0, 1], yr: [-0.35, 1.12], pad: { l: 40, r: 8, t: small ? 8 : 14, b: small ? 22 : 34 } });
  const sig = tone(S, 'sig'), dat = tone(S, 'dat');
  axes(S, pl, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 1], xFmt: (v) => pct(S, v), yFmt: (v) => (v === 1 ? S.l('mejor', 'best') : '0'), grid: true, xLabel: small ? '' : S.l('umbral', 'threshold'), yLabel: small ? '' : S.l('puntaje ÷ mejor puntaje', 'score ÷ best score') });
  const peaks = fr(S, 'after-b', 0.0, 0.3);
  const dash: (number[] | undefined)[] = [undefined, [10, 4], [5, 4], [2, 4]];
  KS.forEach((k, i) => {
    const b = best(k), pts: [number, number][] = [];
    for (let q = 0; q <= NB; q++) pts.push([pl.X(q / NB), pl.Y(score(q / NB, k) / b.score)]);
    d.withAlpha(peaks, () => {
      d.clip(pl.r.x, pl.r.y - 2, pl.r.w, pl.r.h + 4, () => d.polyline(pts, sig.c, 2.2, { dash: dash[i] }));
      d.circle(pl.X(b.theta), pl.Y(1), 5 * u, { fill: sig.c, stroke: p.stage, lw: 2 });
      tagText(S, `k = ${k}`, pl.X(b.theta), pl.Y(1) - 11 * u - (i % 2) * 0, { t: 'sig', align: 'center', size: 12.5 });
    });
  });
  // la regla teórica: rombo vacío sobre el eje
  const rl = fr(S, 'after-b', 0.5, 0.75);
  d.withAlpha(rl, () => {
    KS.forEach((k) => {
      const x = pl.X(rule(k)), y = pl.Y(-0.18), s = 5.5 * u;
      d.polygon([[x, y - s], [x + s, y], [x, y + s], [x - s, y]], { stroke: dat.ink, lw: 1.8, fill: p.stage });
      d.line(pl.X(best(k).theta), pl.Y(-0.04), x, y - s - 1, alpha(dat.c, 0.7), 1.2, [3, 3]);
    });
    tagText(S, S.l('◇ regla k/(k+1)', '◇ rule k/(k+1)'), pl.r.x + 8 * u, pl.Y(-0.18) + 0, { t: 'dat', align: 'left', size: 12.5 });
  });
}

function drawThreshStats(S: Frame, a: Rect, th: number, k: number) {
  const { d, pal: p } = S, u = S.u;
  const o = outcome(th), cols = S.portrait ? 3 : 1, cw = a.w / cols, rh = 62 * u;
  const items: { l: string; v: string; t: 'ink' | 'dat' | 'err' | 'mute' | 'w'; a: number }[] = [];
  const g = S.on('cost') ? S.reveal('cost', 0.1, 0.5) : S.reveal('abstain', 0.8, 0.5);
  if (S.on('abstain')) {
    items.push({ l: S.l('responde', 'answers'), v: String(o.answered), t: 'dat', a: g });
    items.push({ l: S.l('errores entre ellas', 'errors among them'), v: `${o.wrong} (${pct(S, o.errRate, o.errRate < 0.1 ? 1 : 0)})`, t: 'err', a: g });
    items.push({ l: S.l('calla', 'stays silent'), v: `${o.silent} (${pct(S, o.silent / 424)})`, t: 'mute', a: g });
  }
  if (S.on('try2')) {
    const sc = score(th, k), b = best(k);
    items.push({ l: S.l('puntaje', 'score'), v: String(sc), t: sc >= 0.95 * b.score ? 'dat' : 'ink', a: 1 });
    items.push({ l: S.l('mejor posible', 'best possible'), v: String(Math.round(b.score)), t: 'dat', a: 1 });
  }
  items.forEach((it, i) => stat(S, a.x + (i % cols) * cw, a.y + Math.floor(i / cols) * rh + 2 * u, it.l, it.v, it.t, { size: 24, w: cw - 8 * u, a: it.a }));
  // leyenda de formas: acierto lleno / error con borde
  const ly = a.y + Math.ceil(items.length / cols) * rh + 8 * u;
  if (!S.portrait && S.on('abstain') && ly + 40 * u < a.y + a.h) d.withAlpha(g, () => {
    const t1 = tone(S, 'dat'), t2 = tone(S, 'err');
    d.rect(a.x, ly, 14 * u, 14 * u, { fill: alpha(t1.c, 0.6) });
    fitText(S, S.l('acierto', 'right'), a.x + 22 * u, ly + 7 * u, a.w - 24 * u, 12.5, { weight: 600, color: p.ink2, base: 'middle' });
    d.rect(a.x, ly + 22 * u, 14 * u, 14 * u, { fill: alpha(t2.c, 0.9), stroke: t2.ink, lw: 1 });
    fitText(S, S.l('error', 'wrong'), a.x + 22 * u, ly + 29 * u, a.w - 24 * u, 12.5, { weight: 600, color: p.ink2, base: 'middle' });
  });
  void FS;
}
