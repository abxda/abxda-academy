// Actos 14–17: el ruido de una nota, el intervalo de confianza, la comparación de dos sistemas (turno 3) y cuántos casos hacen falta.
import { Plot, alpha, clamp, ease, lerp, neu, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { COMPARE_N_DEFAULT } from './data';
import { N_STEPS, PA, PB, REPS, TRUE_DIFF, curveByN, diffCI, margin, oneSample, repeated, sample, wilson } from './stats';
import { fr, stag } from './act-bench';
import { fs, hAxis, source, stamp, nf } from './ui';

// ═════════ una nota es una medición con ruido ═════════
const EVALS = Array.from({ length: 60 }, (_, i) => (i === 0 ? 78 : sample(100, false, 5000 + i * 31).a));
export function drawNoise(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, dat = tone(S, 'dat'), sig = tone(S, 'sig');
  const x0 = R.x + 14 * u, x1 = R.x + R.w - 12 * u, axisY = R.y + R.h * 0.66;
  const X = hAxis(S, x0, x1, axisY, 55, 100, [60, 70, 80, 90, 100], (v) => `${nf(S, v, 0)}`, S.reveal('noise', 0.1, 0.5));
  d.text(S.l('exactitud medida (%)', 'measured accuracy (%)'), x1, axisY + 30 * u, { size: fs(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
  const sq = Math.min(8 * u, (x1 - x0) / 45 - 1), counts: Record<number, number> = {};
  const nShow = Math.floor(clamp((fr(S, 'noise') - 0.18) / 0.5) * EVALS.length) + (S.on('noise') ? 1 : 0);
  EVALS.slice(0, nShow).forEach((v, i) => {
    const stack = (counts[v] = (counts[v] ?? 0) + 1) - 1, first = i === 0;
    d.rect(X(v) - sq / 2, axisY - 4 * u - (stack + 1) * (sq + 1.5), sq, sq, { fill: first ? sig.c : alpha(dat.c, 0.75), stroke: first ? p.ink : p.stage, lw: first ? 2 : 1 });
  });
  const a1 = S.reveal('noise', 0.4, 0.6), top = axisY - 4 * u - 8 * (sq + 1.5);
  d.withAlpha(a1, () => {
    d.polyline([[X(78), top - 6 * u], [X(78), top - 22 * u]], sig.c, 2);
    d.text(S.l('tu evaluación: 78 de 100', 'your evaluation: 78 of 100'), X(78), top - 26 * u, { size: fs(S, 13), weight: 800, color: sig.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
  });
  const a2 = stag(S, 'noise', 0.72, 0.1);
  d.withAlpha(a2, () => {
    const yb = axisY + 58 * u;
    d.polyline([[X(72), yb - 6 * u], [X(72), yb], [X(84), yb], [X(84), yb - 6 * u]], tone(S, 'err').c, 2);
    d.text(S.l('otras 100 evaluaciones: de 72 a 84', 'other evaluations of 100: from 72 to 84'), (X(72) + X(84)) / 2, yb + 5 * u, { size: fs(S, 12.5), weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'top', w: Math.max(180 * u, X(84) - X(72) + 80 * u) });
  });
  stamp(S, S.l('simulación: 60 evaluaciones de 100 casos, exactitud real 78 %', 'simulation: 60 evaluations of 100 cases, true accuracy 78%'), R.x + R.w, R.y + 10 * u, S.reveal('noise', 0.6, 0.5));
}

// ═════════ intervalo de confianza: el margen baja con la raíz de n ═════════
export function drawCI(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, sig = tone(S, 'sig');
  const rows = [25, 100, 400, 1600];
  const lw = Math.min(104 * u, R.w * 0.3), x0 = R.x + lw, x1 = R.x + R.w - 12 * u, top = R.y + 30 * u, rh = Math.min(62 * u, (R.h - 110 * u) / 4);
  const reveal = (n: number) => (n === 100 ? stag(S, 'ci', 0.12, 0.1) : n === 400 ? stag(S, 'ci', 0.4, 0.1) : stag(S, 'ci', 0.78, 0.1));
  const axY = top + 4 * rh + 4 * u;
  const X = hAxis(S, x0, x1, axY, 55, 100, [60, 70, 78, 90, 100], (v) => nf(S, v, 0), S.reveal('ci', 0.1, 0.5));
  d.text(S.l('exactitud (%)', 'accuracy (%)'), R.x, R.y + 2 * u, { size: fs(S, 12), weight: 700, color: p.ink2, base: 'top' });
  d.withAlpha(S.reveal('ci', 0.1, 0.5), () => d.line(X(78), top - 4 * u, X(78), axY, p.mute, 1.5, [4, 3]));
  rows.forEach((n, i) => {
    const a = reveal(n), y = top + i * rh + rh / 2, [lo, hi] = wilson(Math.round(0.78 * n), n), half = ((hi - lo) / 2) * 100;
    d.withAlpha(a, () => {
      d.text(`n = ${nf(S, n, 0)}`, R.x, y, { size: fs(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      d.rect(X(lo * 100), y - 7 * u, X(hi * 100) - X(lo * 100), 14 * u, { fill: alpha(sig.c, 0.2), stroke: sig.c, lw: 2 });
      d.circle(X(78), y, 5 * u, { fill: sig.c, stroke: p.stage, lw: 1.5 });
      d.text(`± ${nf(S, Math.round(half), 0)}`, X(hi * 100) + 6 * u, y, { size: fs(S, 14), weight: 800, font: 'mono', color: sig.ink, base: 'middle' });
    });
  });
  // ×4 casos → ½ margen
  const a = stag(S, 'ci', 0.58, 0.1);
  d.withAlpha(a, () => {
    const y1 = top + 1.5 * rh, y2 = top + 2.5 * rh, bx = R.x + lw - 14 * u;
    d.polyline([[bx + 4, y1], [bx - 6 * u, y1], [bx - 6 * u, y2], [bx + 4, y2]], tone(S, 'err').c, 2);
    d.text(S.l('×4 casos', '×4 cases'), bx - 10 * u, (y1 + y2) / 2 - 8 * u, { size: fs(S, 12), weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle' });
    d.text(S.l('½ margen', '½ margin'), bx - 10 * u, (y1 + y2) / 2 + 8 * u, { size: fs(S, 12), weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle' });
  });
  d.withAlpha(stag(S, 'ci', 0.86, 0.1), () => d.text(S.l('intervalo al 95 % (Wilson) para una nota de 78 %', '95% interval (Wilson) for a 78% score'), R.x, axY + 40 * u, { size: fs(S, 12), weight: 600, color: p.mute, base: 'top', w: R.w }));
  void margin;
}

// ═════════ comparar dos sistemas: el histograma de evaluaciones repetidas (turno 3) ═════════
export function drawCompare(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.6 : 0.62), sig = tone(S, 'sig'), err = tone(S, 'err');
  const interactive = S.on('try3');
  const nIdx = interactive ? clamp(Math.round(S.p.nidx ?? COMPARE_N_DEFAULT), 0, N_STEPS.length - 1) : 3, n = N_STEPS[nIdx];
  const paired = interactive ? (S.p.paired ?? true) !== false : true;
  const m = R.main, plot = new Plot(S, m, { xr: [-25, 25], yr: [0, 1], pad: { l: 14, r: 12, t: 28, b: 56 } });
  const yBase = plot.Y(0);
  const a0 = S.reveal('compare', 0.1, 0.5);
  d.withAlpha(a0, () => {
    const X = hAxis(S, plot.r.x, plot.r.x + plot.r.w, yBase, -25, 25, [-20, -10, 0, 10, 20], (v) => (v > 0 ? `+${v}` : `${v}`));
    d.text(S.l('diferencia observada A − B (puntos)', 'observed difference A − B (points)'), plot.r.x + plot.r.w / 2, yBase + 28 * u, { size: fs(S, 12), weight: 700, color: p.ink2, align: 'center', base: 'top' });
    d.line(X(0), plot.r.y, X(0), yBase, p.ink, 1.5);
    // diferencia real
    d.line(X(TRUE_DIFF * 100), plot.r.y + 8 * u, X(TRUE_DIFF * 100), yBase, sig.c, 2, [5, 4]);
    d.text(S.l('real: +4', 'true: +4'), X(TRUE_DIFF * 100) + 5 * u, plot.r.y + 8 * u, { size: fs(S, 12.5), weight: 800, color: sig.ink, base: 'top', halo: p.stage, haloW: 4 });
    d.text(S.l('← B por delante', '← B ahead'), X(0) - 6 * u, plot.r.y - 4 * u, { size: fs(S, 12), weight: 700, color: err.ink, align: 'right', base: 'bottom' });
    d.text(S.l('A por delante →', 'A ahead →'), X(0) + 6 * u, plot.r.y - 4 * u, { size: fs(S, 12), weight: 700, color: sig.ink, base: 'bottom' });
  });
  const X = (v: number) => plot.X(v);
  if (!interactive) {
    // doce evaluaciones con 50 casos: algunas dicen que gana B
    const k = Math.floor(clamp((fr(S, 'compare') - 0.35) / 0.5) * 12), stackH = 12 * u, cnt: Record<number, number> = {};
    for (let i = 0; i < k; i++) {
      const s = oneSample(50, true, i + 1), dd = Math.round(diffCI(s).d * 100), st = (cnt[dd] = (cnt[dd] ?? 0) + 1) - 1, win = dd > 0 ? 'sig' : dd < 0 ? 'err' : 'mute';
      const cx = X(dd), w = Math.min(plot.r.w / 51, 14 * u);
      d.rect(cx - w / 2, yBase - (st + 1) * stackH - 2, w, stackH - 2, { fill: win === 'mute' ? p.mute : tone(S, win).c, stroke: p.stage, lw: 1 });
    }
    d.withAlpha(stag(S, 'compare', 0.85, 0.1), () => d.text(S.l('12 evaluaciones con 50 casos cada una', '12 evaluations of 50 cases each'), plot.r.x + plot.r.w / 2, plot.r.y + plot.r.h * 0.45, { size: fs(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle', w: plot.r.w, halo: p.stage, haloW: 4 }));
  } else {
    const rep = repeated(n, paired), maxC = Math.max(...Object.values(rep.bins), 1), bw = plot.r.w / 51, hMax = yBase - plot.r.y - 24 * u;
    d.withAlpha(S.reveal('try3', 0.1, 0.4), () => {
      Object.entries(rep.bins).forEach(([k, c]) => {
        const v = +k, h = (c / maxC) * hMax, t = v > 0 ? sig : v < 0 ? err : null;
        d.rect(X(v) - bw / 2 + 0.5, yBase - h, bw - 1, h, { fill: t ? alpha(t.c, 0.8) : alpha(p.mute, 0.7) });
      });
    });
    // la evaluación suelta
    const one = oneSample(n, paired, Math.round(S.p.draw ?? 0)), ci = diffCI(one), ox = X(clamp(ci.d * 100, -24.5, 24.5));
    d.polygon([[ox, yBase - 2], [ox - 7 * u, yBase + 10 * u], [ox + 7 * u, yBase + 10 * u]], { fill: p.ink, stroke: p.stage, lw: 1.5 });
    // marcador: A por delante
    const win = Math.round((100 * rep.winsA) / REPS);
    d.text(S.l(`A queda por delante en ${win} de cada 100`, `A comes out ahead in ${win} of every 100`), plot.r.x + 4 * u, plot.r.y + 40 * u, { size: fs(S, 14), weight: 800, color: win >= 95 ? tone(S, 'dat').ink : p.ink, base: 'top', w: plot.r.w * 0.6, halo: p.stage, haloW: 4 });
    d.text(S.l(`n = ${nf(S, n, 0)} casos · ${paired ? 'mismos casos' : 'casos distintos'}`, `n = ${nf(S, n, 0)} cases · ${paired ? 'same cases' : 'different cases'}`), plot.r.x + 4 * u, plot.r.y + 62 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'top', w: plot.r.w * 0.6, halo: p.stage, haloW: 4 });
    // panel «una evaluación»
    const a = R.aside, rh = Math.min(48 * u, (a.h - 28 * u) / 3), [la, ha] = wilson(one.a, n), [lb, hb] = wilson(one.b, n);
    d.text(S.l('Una evaluación (▲)', 'One evaluation (▲)'), a.x, a.y, { size: fs(S, 12.5), weight: 800, color: p.ink, base: 'top' });
    const row = (i: number, label: string, v: string, lo: number, hi: number, c: number, lo0: number, hi0: number, tn: 'w' | 'sig' | 'ink' | 'lat', zero: boolean) => {
      const y = a.y + 22 * u + i * rh, bx = a.x, bw = a.w - 6 * u, X2 = (q: number) => bx + ((q - lo0) / (hi0 - lo0)) * bw, tc = tone(S, tn);
      d.text(label, bx, y, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
      d.text(v, bx + bw, y, { size: fs(S, 12.5), weight: 800, font: 'mono', color: tc.ink, align: 'right', base: 'top' });
      const by = y + 24 * u;
      d.line(bx, by, bx + bw, by, p.line, 1.5);
      if (zero) d.line(X2(0), by - 7 * u, X2(0), by + 7 * u, p.ink, 1.5);
      d.rect(X2(lo), by - 5 * u, Math.max(2, X2(hi) - X2(lo)), 10 * u, { fill: alpha(tc.c, 0.25), stroke: tc.c, lw: 1.8 });
      d.circle(X2(c), by, 4 * u, { fill: tc.c, stroke: p.stage, lw: 1.2 });
    };
    row(0, 'A', `${nf(S, (one.a / n) * 100, 0)} % [${nf(S, la * 100, 0)}–${nf(S, ha * 100, 0)}]`, la * 100, ha * 100, (one.a / n) * 100, 40, 100, 'w', false);
    row(1, 'B', `${nf(S, (one.b / n) * 100, 0)} % [${nf(S, lb * 100, 0)}–${nf(S, hb * 100, 0)}]`, lb * 100, hb * 100, (one.b / n) * 100, 40, 100, 'sig', false);
    const verdict = ci.lo > 0 ? S.l('A es mejor (intervalo > 0)', 'A is better (interval > 0)') : ci.hi < 0 ? S.l('B es mejor (intervalo < 0)', 'B is better (interval < 0)') : S.l('no se puede afirmar quién es mejor', 'cannot say who is better');
    row(2, 'A − B', `${ci.d >= 0 ? '+' : '−'}${nf(S, Math.abs(ci.d) * 100, 1)} [${nf(S, ci.lo * 100, 0)}, ${ci.hi >= 0 ? '+' : ''}${nf(S, ci.hi * 100, 0)}]`, ci.lo * 100, ci.hi * 100, ci.d * 100, -25, 25, 'lat', true);
    d.text(verdict, a.x, a.y + 22 * u + 3 * rh + 2 * u, { size: fs(S, 12.5), weight: 800, color: ci.lo > 0 || ci.hi < 0 ? tone(S, 'dat').ink : tone(S, 'err').ink, base: 'top', w: a.w });
  }
  stamp(S, S.l('simulación: A real 78 %, B real 74 %', 'simulation: A true 78%, B true 74%'), m.x + m.w, m.y + 4 * u, a0);
  if (!interactive) {
    const a = R.aside, k = stag(S, 'compare', 0.15, 0.1);
    d.withAlpha(k, () => {
      d.text(S.l('Exactitud real (supuesto)', 'True accuracy (assumed)'), a.x, a.y, { size: fs(S, 12.5), weight: 800, color: p.ink, base: 'top' });
      ([['A', PA, 'w'], ['B', PB, 'sig']] as const).forEach(([nm, v, tn], i) => {
        const y = a.y + 30 * u + i * 36 * u, bx = a.x + 24 * u, bw = a.w - 80 * u;
        d.text(nm, a.x + 8 * u, y + 8 * u, { size: fs(S, 14), weight: 800, color: tone(S, tn).ink, align: 'center', base: 'middle' });
        d.rect(bx, y, bw, 16 * u, { fill: p.surface2 }); d.rect(bx, y, bw * v, 16 * u, { fill: tone(S, tn).c });
        d.text(`${nf(S, v * 100, 0)} %`, bx + bw + 6 * u, y + 8 * u, { size: fs(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      });
    });
  }
  void lerp; void neu; void ease;
}

// ═════════ cuántos casos hacen falta (curvas calculadas con el mismo simulador) ═════════
export function drawProve(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const lx = (n: number) => Math.log10(n);
  const plot = new Plot(S, { x: R.x, y: R.y, w: R.w, h: R.h - 22 * u }, { xr: [lx(10), lx(3000)], yr: [0, 100], xLabel: S.l('casos en la evaluación', 'cases in the evaluation'), yLabel: S.l('% de evaluaciones', '% of evaluations'), pad: { l: 40, b: 40, t: 20, r: 12 }, xTicks: [lx(10), lx(100), lx(1000)], yTicks: [0, 50, 95], tickFmt: (v) => (v === 0 ? '0' : v > 5 ? String(v) : nf(S, 10 ** v, 0)) });
  plot.axes(S.reveal('prove', 0, 0.5));
  const data = curveByN(true), sweep = clamp((fr(S, 'prove') - 0.08) / 0.5);
  const upto = (key: 'winsA' | 'sig') => data.map((r) => [plot.X(lx(r.n)), plot.Y(r[key])] as [number, number]).filter((_, i) => i / (data.length - 1) <= sweep + 1e-6);
  d.withAlpha(S.reveal('prove', 0.1, 0.4), () => plot.line(lx(10), 95, lx(3000), 95, 'mute', 1.5, [4, 4]));
  const A = upto('winsA'), B = upto('sig');
  d.polyline(A, sig.c, 3); d.polyline(B, lat.c, 3);
  A.forEach(([x, y]) => d.circle(x, y, 3.2 * u, { fill: sig.c })); B.forEach(([x, y]) => d.circle(x, y, 3.2 * u, { fill: lat.c }));
  const aA = stag(S, 'prove', 0.3, 0.1), aB = stag(S, 'prove', 0.62, 0.1);
  d.withAlpha(aA, () => { plot.line(lx(400), 0, lx(400), 96, 'sig', 1.8, [3, 3]); d.tag(S.l('~400: ganador casi seguro', '~400: winner almost sure'), plot.X(lx(400)) - 6 * u, plot.Y(30), { size: fs(S, 12), color: sig.ink, fill: sig.soft, stroke: sig.c, align: 'right' }); });
  d.withAlpha(aB, () => { plot.line(lx(1000), 0, lx(1000), 82, 'lat', 1.8, [3, 3]); d.tag(S.l('~1000: diferencia demostrada', '~1000: difference proven'), plot.X(lx(1000)) + 6 * u, plot.Y(12), { size: fs(S, 12), color: lat.ink, fill: lat.soft, stroke: lat.c, align: 'right' }); });
  const lg = (y: number, t: string, tn: 'sig' | 'lat') => { d.rect(plot.r.x + 8 * u, y - 2 * u, 18 * u, 4 * u, { fill: tone(S, tn).c }); d.text(t, plot.r.x + 32 * u, y, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'middle', w: plot.r.w - 40 * u }); };
  d.withAlpha(S.reveal('prove', 0.2, 0.4), () => { lg(plot.r.y + 14 * u, S.l('A queda por delante', 'A comes out ahead'), 'sig'); lg(plot.r.y + 34 * u, S.l('el intervalo de A − B excluye el 0', 'the A − B interval excludes 0'), 'lat'); });
  source(S, S.l('Simulación de la lección: mismos casos, diferencia real de 4 puntos, 500 evaluaciones por tamaño.', 'The lesson’s simulation: same cases, true difference of 4 points, 500 evaluations per size.'), R.x, R.y + R.h + 4 * u, R.w, S.reveal('prove', 0.6, 0.5));
}
