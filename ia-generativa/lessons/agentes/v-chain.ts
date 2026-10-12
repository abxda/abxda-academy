// Vistas 5–8: los errores se acumulan.
//  · drawSteps   (risk, per-step, two-steps): la tarea de los boletos como cadena de pasos; qué puede salir mal;
//                 un cuadro de cien intentos: cinco fallan en el paso uno y casi cinco más en el paso dos.
//  · drawSim     (sim-intro … caveat): el simulador de veinte intentos, el contador y la gráfica P = 0.95ⁿ.
//  · drawReal    (real): τ-bench, GPT-4o en la tienda (Yao et al., 2024).
//  · drawReview  (review-idea … try-review): tarea de veinte pasos con revisión humana cada cinco.
import { alpha, clamp, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CHK, FIRST, MAXN, NREV, P, REVIEW, RUNS, chain, plainOk, reviewExact, reviewOk } from './sim';
import { FS, area, card, chip, chipH, fitText, fr, glyph, hold, para, paraH, person, pick, smooth, stepMark, tight, type StepState } from './ui';

const SUP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');
const pct = (S: Frame, f: number, dig = 0) => `${S.n(f * 100, dig)}${S.lang === 'es' ? ' %' : '%'}`;
const ofN = (S: Frame, a: number, b: number) => S.l(`${a} de ${b}`, `${a} of ${b}`);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Cadena de pasos y cuadro de cien intentos
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Qué casillas del cuadro fallan en el paso 1 (cinco) y en el paso 2 (cinco más): elegidas con hash, fijas. */
const FAIL1: number[] = [], FAIL2: number[] = [];
(() => {
  const order = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a, 77) - hash(b, 77));
  FAIL1.push(...order.slice(0, 5)); FAIL2.push(...order.slice(5, 10));
})();

export function drawSteps(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const chainA = 1 - (S.on('per-step') ? fr(S, 'per-step', 0, 0.12) : 0);
  // ── risk: la compra de boletos como tres pasos, y lo que puede salir mal ──
  if (chainA > 0.01) d.withAlpha(chainA, () => {
    const steps = [S.l('buscar funciones', 'find showtimes'), S.l('elegir y calcular', 'choose and calculate'), S.l('comprar', 'buy')];
    const bs = Math.min(46 * u, A.w / 9), gapX = Math.min((A.w - 3 * bs) / 3, 150 * u), rowW = 3 * bs + 2 * gapX, x0 = A.x + (A.w - rowW) / 2;
    const top = A.y + (tight(S) ? 6 : 24) * u;
    fitText(S, S.l('la compra de boletos, paso por paso', 'buying the tickets, step by step'), A.x + A.w / 2, top, A.w, 13.5, { weight: 800, align: 'center', base: 'top', color: p.ink2, a: fr(S, 'risk', 0, 0.12) });
    const cy = top + FS(S, 13.5) * u + 14 * u + bs / 2;
    steps.forEach((s, i) => {
      const a = fr(S, 'risk', 0.05 + i * 0.06, 0.17 + i * 0.06), cx = x0 + bs / 2 + i * (bs + gapX);
      if (i > 0) d.withAlpha(a, () => S.d.arrow(cx - bs / 2 - gapX + 6 * u, cy, cx - bs / 2 - 6 * u, cy, p.lineStrong, 2, 7));
      d.withAlpha(a, () => {
        d.circle(cx, cy, bs / 2, { fill: alpha(tone(S, 'dat').c, 0.15), stroke: tone(S, 'dat').c, lw: 2 });
        d.text(String(i + 1), cx, cy, { size: FS(S, 16), weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'middle' });
        para(S, s, cx - (bs + gapX) / 2, cy + bs / 2 + 6 * u, bs + gapX - 6 * u, FS(S, 12.5), { weight: 700, align: 'center', maxLines: 2 });
      });
    });
    const items = [S.l('elige la herramienta equivocada', 'picks the wrong tool'), S.l('escribe mal un dato: 20 en vez de 2', 'mistypes a piece of data: 20 instead of 2'), S.l('lee mal un resultado', 'misreads a result')];
    const ly = cy + bs / 2 + 6 * u + FS(S, 12.5) * u * 2.6 + (tight(S) ? 8 : 22) * u, lw = Math.min(A.w, 420 * u), lx = A.x + (A.w - lw) / 2;
    fitText(S, S.l('cada paso puede salir mal:', 'any step can go wrong:'), lx, ly, lw, 13, { weight: 800, base: 'top', a: fr(S, 'risk', 0.25, 0.35) });
    const rh = FS(S, 13) * u + (tight(S) ? 8 : 12) * u;
    items.forEach((t, i) => {
      const a = fr(S, 'risk', 0.4 + i * 0.15, 0.5 + i * 0.15), y = ly + FS(S, 13) * u + 8 * u + i * rh;
      d.withAlpha(a, () => {
        glyph(S, 'cross', lx + 8 * u, y + rh / 2 - 2 * u, 12 * u, tone(S, 'err').c);
        fitText(S, t, lx + 22 * u, y + rh / 2 - 2 * u, lw - 22 * u, 13, { weight: 600, base: 'middle' });
      });
    });
  });

  // ── per-step / two-steps: el cuadro de cien intentos ──
  const gA = S.on('per-step') ? fr(S, 'per-step', 0.05, 0.2) : 0;
  if (gA < 0.01) return;
  const port = S.portrait;
  const capH = port ? Math.min(A.h * 0.34, 150 * u) : 0, capW = port ? 0 : Math.min(A.w * 0.42, 330 * u);
  const G = { x: A.x, y: A.y, w: A.w - capW - (port ? 0 : 24 * u), h: A.h - capH - (port ? 12 * u : 0) };
  const cs = Math.min(G.w, G.h) / 10, gx = G.x + (G.w - 10 * cs) / 2, gy = G.y + (G.h - 10 * cs) / 2;
  const f1 = fr(S, 'per-step', 0.35, 0.55), f2 = S.on('two-steps') ? fr(S, 'two-steps', 0.45, 0.7) : 0;
  d.withAlpha(gA, () => {
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10, x = gx + c * cs, y = gy + r * cs, s = cs * 0.84, ox = x + (cs - s) / 2, oy = y + (cs - s) / 2;
      const in1 = FAIL1.includes(i), in2 = FAIL2.includes(i);
      const fail = in1 ? f1 : in2 ? f2 : 0;
      d.rect(ox, oy, s, s, { fill: alpha(tone(S, 'dat').c, 0.16 * (1 - fail)), stroke: alpha(tone(S, 'dat').c, 0.55 * (1 - fail) + 0.001), lw: 1, r: 2 });
      if (fail > 0.01) d.withAlpha(fail, () => {
        if (in1) d.rect(ox, oy, s, s, { fill: alpha(tone(S, 'err').c, 0.22), stroke: tone(S, 'err').c, lw: 1.4, r: 2 });
        else d.rect(ox, oy, s, s, { stroke: tone(S, 'err').c, lw: 1.4, r: 2, dash: [3, 2] });
        glyph(S, 'cross', ox + s / 2, oy + s / 2, s * 0.7, tone(S, 'err').c);
      });
    }
  });
  // texto al lado (o debajo)
  const T = port ? { x: A.x, y: A.y + A.h - capH, w: A.w, h: capH } : { x: A.x + A.w - capW, y: A.y, w: capW, h: A.h };
  const big = FS(S, tight(S) ? 20 : 26), mid = FS(S, 13);
  const two = S.on('two-steps');
  const left = two ? 100 - 5 * Math.round(f2 > 0.5 ? 2 : 1) : 95;
  const blockH = big * u * 1.2 + mid * u * 3 + 30 * u;
  let y = T.y + Math.max(0, (T.h - blockH) / 2);
  d.withAlpha(gA, () => {
    fitText(S, S.l(two ? 'dos pasos' : 'un paso', two ? 'two steps' : 'one step'), T.x, y, T.w, 13.5, { weight: 800, color: p.ink2, base: 'top' });
    y += FS(S, 13.5) * u + 6 * u;
    d.text(S.l(`${left} de 100`, `${left} of 100`), T.x, y, { size: big, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    y += big * u * 1.2 + 4 * u;
    fitText(S, S.l('intentos que salen bien', 'attempts that go right'), T.x, y, T.w, 13, { weight: 600, color: p.ink2, base: 'top' });
    y += mid * u + 12 * u;
    // leyenda
    const lg = (yy: number, dash: boolean, label: string, a: number) => d.withAlpha(a, () => {
      const s = 14 * u;
      if (dash) d.rect(T.x, yy, s, s, { stroke: tone(S, 'err').c, lw: 1.4, r: 2, dash: [3, 2] }); else d.rect(T.x, yy, s, s, { fill: alpha(tone(S, 'err').c, 0.22), stroke: tone(S, 'err').c, lw: 1.4, r: 2 });
      glyph(S, 'cross', T.x + s / 2, yy + s / 2, s * 0.7, tone(S, 'err').c);
      fitText(S, label, T.x + s + 8 * u, yy + s / 2, T.w - s - 8 * u, 12.5, { weight: 600, base: 'middle' });
    });
    lg(y, false, S.l('falla en el paso 1: 5', 'fails on step 1: 5'), f1);
    lg(y + 22 * u, true, S.l('falla en el paso 2: casi 5 más', 'fails on step 2: almost 5 more'), f2);
    y += 48 * u;
    if (two && y + mid * u < T.y + T.h + 4 * u) fitText(S, '0.95 × 0.95 ≈ 0.90', T.x, y, T.w, 14, { weight: 800, font: 'mono', base: 'top', color: tone(S, 'w').ink, a: fr(S, 'two-steps', 0.75, 0.88) });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// El simulador
// ════════════════════════════════════════════════════════════════════════════════════════════════
export interface SimLay { A: Rect; grid: Rect; side: Rect; plot: Rect; count: Rect; port: boolean }
export function simLay(S: Frame): SimLay {
  const u = S.u, A = area(S);
  if (S.portrait) {
    const gh = A.h * 0.56, grid = { x: A.x, y: A.y, w: A.w, h: gh };
    const side = { x: A.x, y: A.y + gh + 12 * u, w: A.w, h: A.h - gh - 12 * u };
    const cw = side.w * 0.4;
    return { A, grid, side, count: { x: side.x, y: side.y, w: cw - 8 * u, h: side.h }, plot: { x: side.x + cw, y: side.y, w: side.w - cw, h: side.h }, port: true };
  }
  const gw = A.w * 0.58, grid = { x: A.x, y: A.y, w: gw, h: A.h };
  const side = { x: A.x + gw + 24 * u, y: A.y, w: A.w - gw - 24 * u, h: A.h };
  const ch = Math.min(side.h * 0.4, (FS(S, 13) * 2 + FS(S, 24) * 1.2 + 26) * u);
  return { A, grid, side, count: { x: side.x, y: side.y, w: side.w, h: ch }, plot: { x: side.x, y: side.y + ch + 8 * u, w: side.w, h: side.h - ch - 8 * u }, port: false };
}

/** Estado de la casilla k del intento i: sin revisión (n pasos) o con revisión (NREV pasos). */
function plainState(i: number, k: number): StepState { const f = FIRST[i]; return k < f ? 'ok' : k === f ? 'bad' : 'ruin'; }
function reviewState(i: number, k: number): StepState {
  const r = REVIEW[i];
  if (r.failAt >= 0 && k > r.failAt) return 'ruin';
  if (k === r.failAt) return 'bad';
  for (const s of r.stretches) if (s.redo.includes(k)) return 'redo';
  return 'ok';
}

interface GridOpts { n: number; nShown: number; reveal: number; rows: number; rev: number; chk: number; label: string; labelA: number; personRow?: boolean }
/** Dibuja la rejilla de intentos. `reveal` (0..n) cuántos pasos se ven; `rev` 0..1 mezcla sin/con revisión; `chk` muestra los puntos de revisión. */
function drawGrid(S: Frame, G: Rect, o: GridOpts) {
  const { d, pal: p } = S, u = S.u;
  const pr = o.personRow ? Math.min(22 * u, G.h * 0.05) : 0;
  const head = FS(S, 13) * u + 8 * u + pr, ticks = FS(S, 12) * u + 6 * u, endW = 20 * u;
  const gw = G.w - endW - 4 * u, gh = G.h - head - ticks;
  const colW = Math.min(gw / Math.max(1, o.nShown), 44 * u), rowH = gh / RUNS, s = Math.max(4, Math.min(colW * 0.8, rowH * 0.8, 22 * u));
  const x0 = G.x, y0 = G.y + head + ticks;
  fitText(S, o.label, G.x, G.y, G.w, 13, { weight: 800, color: p.ink2, base: 'top', a: o.labelA });
  // números de paso
  const every = o.n <= 10 ? 1 : o.n <= 20 ? 5 : 10;
  for (let k = 1; k <= o.n; k++) if (k === 1 || k % every === 0) {
    const x = x0 + (k - 0.5) * colW;
    if (x < G.x + gw + 2) d.text(String(k), x, G.y + head + ticks / 2, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'middle', a: o.labelA });
  }
  // puntos de revisión: línea punteada y una persona arriba
  if (o.chk > 0.01) for (let c = CHK; c <= o.n; c += CHK) {
    const x = x0 + c * colW;
    d.line(x, y0 - 2 * u, x, y0 + rowH * o.rows, alpha(tone(S, 'w').c, 0.85 * o.chk), 1.6, [4, 3]);
    const sc = Math.max(1.4, Math.min(2.2 * u, (pr - 3 * u) / 9));
    if (pr > 0) person(S, x - 3 * sc, G.y + head - pr + (pr - 9 * sc) / 2, sc, 'w', o.chk);
  }
  for (let i = 0; i < o.rows; i++) {
    const cy = y0 + (i + 0.5) * rowH;
    let okRow = true;
    for (let k = 0; k < o.n; k++) {
      const a = clamp(o.reveal - k);
      if (a <= 0) break;
      const cx = x0 + (k + 0.5) * colW;
      if (cx > G.x + gw + colW * 0.2) break;
      const s0 = plainState(i, k), s1 = o.rev > 0 ? reviewState(i, k) : s0;
      if (o.rev > 0.01 && o.rev < 0.99 && s0 !== s1) { stepMark(S, cx, cy, s, s0, a * (1 - o.rev)); stepMark(S, cx, cy, s, s1, a * o.rev); }
      else stepMark(S, cx, cy, s, o.rev >= 0.99 ? s1 : s0, a);
    }
    // ¿terminó bien? (cuando ya se vieron todos sus pasos)
    const done = clamp(o.reveal - o.n + 1);
    okRow = o.rev > 0.5 ? REVIEW[i].ok : FIRST[i] >= o.n;
    if (done > 0.01) {
      const ex = x0 + Math.max(o.nShown, o.n) * colW + endW / 2 + 2 * u;
      if (okRow) glyph(S, 'check', Math.min(ex, G.x + G.w - endW / 2), cy, Math.min(14 * u, rowH * 0.9), tone(S, 'dat').ink, done);
      else d.line(Math.min(ex, G.x + G.w - endW / 2) - 5 * u, cy, Math.min(ex, G.x + G.w - endW / 2) + 5 * u, cy, alpha(p.ink2, 0.5), 1.5, undefined, done);
    }
  }
}

/** Contador: «12 de 20» y lo esperado. */
function drawCount(S: Frame, R: Rect, ok: number, sub: string, a: number, o: { label?: string; legend?: number } = {}) {
  const { d, pal: p } = S, u = S.u, bigR = tight(S) ? 20 : 24, big = FS(S, bigR);
  d.withAlpha(a, () => {
    let y = R.y;
    fitText(S, o.label ?? S.l('terminan bien', 'finish right'), R.x, y, R.w, 13, { weight: 700, color: p.ink2, base: 'top' });
    y += FS(S, 13) * u + 4 * u;
    fitText(S, ofN(S, ok, RUNS), R.x, y, R.w, bigR, { weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    y += big * u * 1.15 + 4 * u;
    if (sub) para(S, sub, R.x, y, R.w, FS(S, 12.5), { weight: 700, font: 'mono', color: p.ink, maxLines: 2 });
  });
}

/** Gráfica del éxito contra el número de pasos. */
function drawPlot(S: Frame, R: Rect, o: { ax: number; ay: number; pt10: number; curveTo: number; n: number; mark: number; half: number }) {
  const { d, pal: p } = S, u = S.u, size = FS(S, 12);
  const l = 34 * u, b = size * u * 2 + 12 * u, t = size * u + 8 * u;
  const r = { x: R.x + l, y: R.y + t, w: R.w - l - 8 * u, h: R.h - t - b };
  if (r.h < 30 * u || r.w < 60 * u) return;
  const X = (n: number) => r.x + ((n - 1) / (MAXN - 1)) * r.w, Y = (v: number) => r.y + r.h - v * r.h;
  if (o.ax > 0.01) d.withAlpha(o.ax, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    [1, 10, 20, 30, 40].forEach((v) => { d.line(X(v), r.y + r.h, X(v), r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(String(v), X(v), r.y + r.h + 6 * u, { size, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    fitText(S, S.l('pasos de la tarea', 'steps in the task'), r.x + r.w, r.y + r.h + 8 * u + size * u, r.w, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  if (o.ay > 0.01) d.withAlpha(o.ay, () => {
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    [0, 0.5, 1].forEach((v) => { d.line(r.x - 4 * u, Y(v), r.x, Y(v), p.lineStrong, 1.5); d.text(S.lang === 'es' ? `${v * 100} %` : `${v * 100}%`, r.x - 6 * u, Y(v), { size, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    fitText(S, S.l('salen bien de principio a fin', 'go right start to finish'), R.x, R.y, R.w, 12.5, { weight: 700, color: p.ink2, base: 'top' });
  });
  if (o.half > 0.01) {
    d.line(r.x, Y(0.5), r.x + r.w, Y(0.5), alpha(p.ink2, 0.6 * o.half), 1.2, [5, 4]);
    fitText(S, S.l('la mitad', 'half'), r.x + r.w, Y(0.5) - 3 * u, 80 * u, 12, { weight: 700, color: p.mute, align: 'right', base: 'bottom', a: o.half });
  }
  if (o.curveTo > 1) {
    const pts: [number, number][] = [];
    for (let n = 1; n <= o.curveTo + 1e-6; n += 0.25) pts.push([X(n), Y(chain(P, n))]);
    d.polyline(pts, tone(S, 'err').c, 2.6);
  }
  if (o.pt10 > 0.01) d.withAlpha(o.pt10 * (1 - o.mark), () => {
    d.circle(X(10), Y(chain(P, 10)), 5.5 * u, { fill: tone(S, 'err').c, stroke: p.stage, lw: 2 });
    fitText(S, S.l('10 pasos: 60 %', '10 steps: 60%'), X(10) + 9 * u, Y(chain(P, 10)) - 4 * u, r.w * 0.7, 12.5, { weight: 800, base: 'bottom', halo: true });
  });
  if (o.mark > 0.01) d.withAlpha(o.mark, () => {
    const n = o.n, v = chain(P, n), x = X(n), y = Y(v);
    d.line(x, y, x, r.y + r.h, alpha(tone(S, 'err').c, 0.5), 1.2, [3, 3]);
    d.circle(x, y, 6 * u, { fill: tone(S, 'err').c, stroke: p.stage, lw: 2 });
    const lab = S.l(`${n} pasos: ${pct(S, v)}`, `${n} steps: ${pct(S, v)}`), right = x < r.x + r.w * 0.6;
    fitText(S, lab, x + (right ? 9 : -9) * u, y - 5 * u, r.w * 0.62, 12.5, { weight: 800, base: 'bottom', align: right ? 'left' : 'right', halo: true });
  });
}

export function drawSim(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = simLay(S), st = (S.st.ag ?? {}) as { nShown?: number; maxN?: number };
  const inDemo = S.on('demo-steps');
  const n = inDemo ? clamp(Math.round(S.p.steps ?? 10), 1, MAXN) : 10;
  const nShown = inDemo ? clamp(st.nShown ?? n, 1, MAXN) : 10;
  // cuánto de la simulación se ve
  const rowsA = fr(S, 'sim-intro', 0.12, 0.4);
  const reveal = S.on('sim-run') ? fr(S, 'sim-run', 0.05, 0.62, 'lin') * 10 + (S.on('sim-formula') ? MAXN : 0) : 0;
  const rev = inDemo ? MAXN + 1 : reveal;
  d.withAlpha(rowsA, () => {
    // casillas vacías (antes de correr)
    if (!S.on('sim-formula')) {
      const G = L.grid, head = FS(S, 13) * u + 8 * u, ticks = FS(S, 12) * u + 6 * u, endW = 20 * u;
      const colW = Math.min((G.w - endW - 4 * u) / 10, 44 * u), rowH = (G.h - head - ticks) / RUNS, s = Math.max(4, Math.min(colW * 0.8, rowH * 0.8, 22 * u));
      for (let i = 0; i < RUNS; i++) for (let k = 0; k < 10; k++) {
        const a = clamp(rowsA * 22 - i) * (1 - clamp(reveal - k));
        if (a > 0.01) stepMark(S, G.x + (k + 0.5) * colW, G.y + head + ticks + (i + 0.5) * rowH, s, 'empty', a);
      }
    }
    drawGrid(S, L.grid, { n, nShown, reveal: rev, rows: RUNS, rev: 0, chk: 0, label: S.l(`20 intentos · tarea de ${n} pasos`, `20 attempts · ${n}-step task`), labelA: 1 - hold(S, 'caveat', 'real', 0.04, 0.16) });
  });
  // leyenda (sim-intro) → contador (sim-run en adelante)
  const lgA = fr(S, 'sim-intro', 0.45, 0.6) * (1 - (S.on('sim-run') ? fr(S, 'sim-run', 0.62, 0.72) : 0));
  if (lgA > 0.01) d.withAlpha(lgA, () => {
    const C = L.side, s = 18 * u;
    let y = C.y + 4 * u;
    ([['ok', S.l('un paso que sale bien', 'a step that goes right')], ['bad', S.l('un paso que sale mal', 'a step that goes wrong')], ['ruin', S.l('lo que sigue a un error', 'what follows an error')]] as [StepState, string][]).forEach(([k, t], i) => {
      if (i === 2 && !S.on('sim-run')) return;
      stepMark(S, C.x + s / 2, y + s / 2, s, k);
      fitText(S, t, C.x + s + 8 * u, y + s / 2, C.w - s - 8 * u, 12.5, { weight: 600, base: 'middle' });
      y += s + 8 * u;
    });
  });
  const cA = S.on('sim-run') ? fr(S, 'sim-run', 0.66, 0.78) : 0;
  if (cA > 0.01) {
    const ok = plainOk(n);
    const sub = S.on('sim-formula') ? `${S.l('esperado', 'expected')}: 0.95${sup(n)} ≈ ${pct(S, chain(P, n))}` : '';
    drawCount(S, L.count, ok, sub, cA);
  }
  // la cuenta (sim-formula), en el lugar de la gráfica
  const fA = (S.on('sim-formula') ? fr(S, 'sim-formula', 0.05, 0.2) : 0) * (1 - (S.on('axis-x') ? fr(S, 'axis-x', 0, 0.15) : 0));
  if (fA > 0.01) d.withAlpha(fA, () => {
    const R = L.plot, size = FS(S, tight(S) ? 13 : 15);
    let y = R.y + 8 * u;
    const factors = Array.from({ length: 10 }, () => '0.95').join(' × ');
    y += para(S, factors, R.x, y, R.w, size, { weight: 700, font: 'mono', color: p.ink }) + 6 * u;
    fitText(S, S.l('(diez veces, una por paso)', '(ten times, once per step)'), R.x, y, R.w, 12.5, { weight: 600, color: p.ink2, base: 'top', a: fr(S, 'sim-formula', 0.25, 0.4) });
    y += FS(S, 12.5) * u + 10 * u;
    fitText(S, `= 0.95¹⁰ ≈ 0.60 = 60 ${S.lang === 'es' ? '%' : 'percent'}`.replace(' percent', '%'), R.x, y, R.w, tight(S) ? 15 : 17, { weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top', a: fr(S, 'sim-formula', 0.5, 0.65) });
  });
  // la gráfica
  const ax = S.on('axis-x') ? fr(S, 'axis-x', 0.1, 0.35) : 0, ay = S.on('axis-y') ? fr(S, 'axis-y', 0.05, 0.3) : 0;
  if (ax > 0.01) {
    const pt10 = S.on('axis-y') ? fr(S, 'axis-y', 0.6, 0.75) : 0;
    const maxSeen = Math.max(10, st.maxN ?? 10);
    const curveTo = inDemo ? (S.on('try-steps') ? MAXN : Math.max(1 + 9 * fr(S, 'demo-steps', 0, 0.12), Math.min(maxSeen, Math.max(nShown, 10)))) : 0;
    drawPlot(S, L.plot, { ax, ay, pt10, curveTo, n, mark: inDemo ? fr(S, 'demo-steps', 0.05, 0.15) : 0, half: inDemo ? fr(S, 'demo-steps', 0.1, 0.25) : 0 });
  }
  // supuesto (caveat)
  const cvA = hold(S, 'caveat', 'real', 0.08, 0.2);
  if (cvA > 0.01) {
    // el supuesto ocupa el lugar del rótulo de la rejilla
    const G = L.grid;
    chip(S, S.l('supuesto: un error no influye en los demás', 'assumption: one error does not affect the others'), G.x, G.y + chipH(S, 12.5) / 2 - 2 * u, 'err', { size: 12.5, a: cvA, dash: true, maxW: G.w, align: 'left' });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// τ-bench
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawReal(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const w = Math.min(A.w, 620 * u), x = A.x + (A.w - w) / 2;
  const rows = [
    { f: 0.612, lt: false, a: fr(S, 'real', 0.25, 0.4), t: S.l('resuelve la tarea (un intento)', 'solves the task (one try)'), v: S.l('61 %', '61%') },
    { f: 0.25, lt: true, a: fr(S, 'real', 0.6, 0.75), t: S.l('la resuelve en 8 de 8 intentos', 'solves it in 8 tries out of 8'), v: S.l('menos de 25 %', 'under 25%') },
  ];
  const size = FS(S, 15), barH = Math.max(24 * u, size * u + 12 * u), rowH = size * u * 1.4 + barH + (tight(S) ? 10 : 22) * u;
  const title = S.l('τ-bench (2024): agente con herramientas en una tienda en línea', 'τ-bench (2024): an agent with tools in an online store');
  const sub = S.l('GPT-4o · clientes simulados · el éxito se mide por el resultado final', 'GPT-4o · simulated customers · success judged by the final result');
  const th = paraH(S, title, w, FS(S, 16.5), { weight: 800, maxLines: 2 }), sh = paraH(S, sub, w, FS(S, 13), { weight: 600, maxLines: 2 });
  const head = th + sh + 22 * u, total = head + rows.length * rowH;
  let y = A.y + Math.max(0, (A.h - total) / 2);
  d.withAlpha(fr(S, 'real', 0, 0.15), () => {
    para(S, title, x, y, w, FS(S, 16.5), { weight: 800, maxLines: 2 });
    para(S, sub, x, y + th + 4 * u, w, FS(S, 13), { weight: 600, color: p.ink2, maxLines: 2 });
  });
  y += head;
  rows.forEach((r) => {
    d.withAlpha(r.a, () => {
      fitText(S, r.t, x, y, w, 15, { weight: 700, base: 'top' });
      const by = y + size * u * 1.4;
      d.rect(x, by, w, barH, { fill: p.surface2, r: 3 });
      const bw = w * r.f * smooth(r.a);
      d.rect(x, by, bw, barH, { fill: alpha(tone(S, r.lt ? 'err' : 'dat').c, 0.7), r: 3 });
      if (r.lt) { d.line(x + bw, by - 3 * u, x + bw, by + barH + 3 * u, tone(S, 'err').c, 2, [3, 3]); }
      fitText(S, r.v, x + bw + 8 * u, by + barH / 2, w - bw - 8 * u, 15, { weight: 800, font: 'mono', base: 'middle' });
    });
    y += rowH;
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Revisión humana
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawReview(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = simLay(S), rev = clamp((S.st.ag?.rev as number) ?? 0);
  const on = rev > 0.5;
  const chk = fr(S, 'review-idea', 0.45, 0.65);
  drawGrid(S, L.grid, { n: NREV, nShown: NREV, reveal: NREV + 1, rows: RUNS, rev, chk, label: on ? S.l('20 intentos · revisión cada 5 pasos', '20 attempts · review every 5 steps') : S.l('20 intentos · tarea de 20 pasos', '20 attempts · 20-step task'), labelA: 1, personRow: true });
  // contador
  const ex0 = chain(P, NREV), ex1 = reviewExact().success;
  drawCount(S, L.count, on ? reviewOk() : plainOk(NREV), `${S.l('esperado', 'expected')}: ${pct(S, on ? ex1 : ex0)}`, 1, { label: on ? S.l('con revisión, terminan bien', 'with review, finish right') : S.l('sin revisión, terminan bien', 'no review, finish right') });
  // lo que cuesta, y la leyenda de la flecha circular
  const R = L.plot, costA = S.on('review-cost') ? fr(S, 'review-cost', 0.05, 0.2) : 0;
  const lgA = S.on('review-demo') ? fr(S, 'review-demo', 0.45, 0.6) : 0;
  let y = R.y + 4 * u;
  const s = 18 * u;
  if (lgA > 0.01) d.withAlpha(lgA, () => {
    stepMark(S, R.x + s / 2, y + s / 2, s, 'redo');
    fitText(S, S.l('error detectado: se repite el tramo', 'error caught: the stretch is redone'), R.x + s + 8 * u, y + s / 2, R.w - s - 8 * u, 12.5, { weight: 600, base: 'middle' });
    y += s + 6 * u;
    stepMark(S, R.x + s / 2, y + s / 2, s, 'bad');
    fitText(S, S.l('error que se le pasó a quien revisa', 'error the reviewer missed'), R.x + s + 8 * u, y + s / 2, R.w - s - 8 * u, 12.5, { weight: 600, base: 'middle' });
    y += s + 12 * u;
  }); else y += 2 * s + 18 * u;
  if (costA > 0.01) {
    const reviews = REVIEW.reduce((a, r) => a + r.reviews, 0) / RUNS, steps = REVIEW.reduce((a, r) => a + r.steps, 0) / RUNS;
    const items = [
      { a: fr(S, 'review-cost', 0.05, 0.2), t: S.l(`${S.n(reviews, 1)} revisiones por intento`, `${S.n(reviews, 1)} reviews per attempt`) },
      { a: fr(S, 'review-cost', 0.25, 0.4), t: S.l(`${S.n(steps, 1)} pasos hechos (de 20)`, `${S.n(steps, 1)} steps done (of 20)`) },
      { a: fr(S, 'review-cost', 0.55, 0.7), t: S.l('supuesto: se le pasa 1 de cada 10 errores', 'assumption: 1 error in 10 slips past'), dash: true },
    ];
    items.forEach((it) => {
      if (y + FS(S, 12.5) * u > R.y + R.h + 6 * u) return;
      d.withAlpha(it.a, () => {
        const h = paraH(S, it.t, R.w - 10 * u, FS(S, 12.5), { weight: 700, maxLines: 2 }) + 8 * u;
        card(S, { x: R.x, y, w: R.w, h }, { tone: it.dash ? undefined : 'w', dash: it.dash ? [4, 3] : undefined, hot: 0.05 });
        para(S, it.t, R.x + 5 * u, y + 4 * u, R.w - 10 * u, FS(S, 12.5), { weight: 700, maxLines: 2 });
        y += h + 6 * u;
      });
      if (it.a <= 0.01) y += 0;
    });
  }
  void pick; void hash;
}
