// Acto 1 · La curva: pérdida frente a parámetros (ley de potencia de Kaplan et al., 2020).
// Una sola gráfica que se transforma de ejes lineales a log-log, con la ley y la regla «×10 → ×0,84».
import { alpha, clamp, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { Lkaplan, KAPLAN, count } from './model';
import { FS, fitText, tagText, log10, pow10 } from './ui';

const X0 = 5, X1 = 12;                 // log10 N visible en la vista log-log
const LIN_MAX = 1.6e9;                 // vista lineal: de 0 a 1 600 M de parámetros (el rango medido por Kaplan)
const YN0 = 2.0, YN1 = 4.9;            // pérdida en la vista lineal
const YG0 = log10(1.3), YG1 = log10(5);  // pérdida en la vista log-log
const MEAS = 1.5e9;                    // hasta aquí hay modelos entrenados (Kaplan: de 768 a 1 500 M)
const SIZES = [1e5, 3e5, 1e6, 3e6, 1e7, 3e7, 1e8, 3e8, 1e9, 1.5e9];
const NS = Array.from({ length: 281 }, (_, i) => 10 ** (X0 + ((X1 - X0) * i) / 280));
const NS_MEAS = NS.filter((n) => n <= MEAS).concat([MEAS]);
const NS_EXT = [MEAS].concat(NS.filter((n) => n > MEAS));

export interface Geo { r: Rect; lg: number; P: (N: number, L: number) => [number, number] }

export function geo1(S: Frame, rect: Rect): Geo {
  const u = S.u;
  const r: Rect = { x: rect.x + 46 * u, y: rect.y + 26 * u, w: rect.w - 58 * u, h: rect.h - 70 * u };
  const lg = S.at('loglog', 0.2, 2.6, 'io');
  const P = (N: number, L: number): [number, number] => {
    const xl = N / LIN_MAX, yl = (L - YN0) / (YN1 - YN0);
    const xg = (log10(N) - X0) / (X1 - X0), yg = (log10(L) - YG0) / (YG1 - YG0);
    return [r.x + lerp(xl, xg, lg) * r.w, r.y + r.h - lerp(yl, yg, lg) * r.h];
  };
  return { r, lg, P };
}

export function drawAct1(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const g = geo1(S, R.main), { r, lg, P } = g;
  const errT = tone(S, 'err'), wT = tone(S, 'w');
  const aAxes = S.reveal('hook', 0, 0.7);
  const ts = FS(S, 11.5);

  // ───── ejes ─────
  d.withAlpha(aAxes, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
  });
  if (S.on('levers')) {
    const aL = S.reveal('levers', 0.2, 0.5);
    d.text(S.l('parámetros N', 'parameters N'), r.x + r.w, r.y + r.h + 7 * u + ts * u + 8 * u, { size: FS(S, 13), weight: 700, color: wT.ink, align: 'right', base: 'top', a: aL });
  }
  if (S.on('kaplan')) d.text(S.l('pérdida L', 'loss L'), R.main.x + 2, r.y - 6 * u, { size: FS(S, 13), weight: 700, color: errT.ink, base: 'bottom', a: S.reveal('kaplan', 0, 0.5) });

  // marcas: lineales (se desvanecen) y logarítmicas (aparecen)
  const aTick = S.on('kaplan') ? S.reveal('kaplan', 0.1, 0.6) : 0;
  if (aTick > 0) {
    const linA = aTick * (1 - lg), logA = aTick * lg;
    d.withAlpha(linA, () => {
      [0, 5e8, 1e9, 1.5e9].forEach((n) => { const x = r.x + (n / LIN_MAX) * r.w; d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(n === 0 ? '0' : count(n, S.lang), Math.min(x, r.x + r.w - 14 * u), r.y + r.h + 7 * u, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
      [2, 3, 4].forEach((v) => { const y = r.y + r.h - ((v - YN0) / (YN1 - YN0)) * r.h; d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5); d.text(String(v), r.x - 7 * u, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    });
    d.withAlpha(logA, () => {
      for (let v = X0; v <= X1; v++) { const x = r.x + ((v - X0) / (X1 - X0)) * r.w; d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.line(x, r.y, x, r.y + r.h, p.line, 1); d.text(pow10(v), x, r.y + r.h + 7 * u, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); }
      [1.5, 2, 3, 4, 5].forEach((v) => { const y = r.y + r.h - ((log10(v) - YG0) / (YG1 - YG0)) * r.h; d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5); d.line(r.x, y, r.x + r.w, y, p.line, 1); d.text(S.n(v, v === 1.5 ? 1 : 0), r.x - 7 * u, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    });
  }

  // ───── el gancho: una pregunta ─────
  if (!S.on('kaplan')) {
    const a = S.reveal('hook', 0.5, 0.7);
    d.text('?', r.x + r.w / 2, r.y + r.h / 2 - 6 * u, { size: 54, weight: 800, color: p.ink2, align: 'center', base: 'middle', a: a * (0.55 + 0.45 * Math.abs(Math.sin(S.clock * 2.2))) });
    d.text(S.l('¿cuánto mejora?', 'how much better?'), r.x + r.w / 2, r.y + r.h / 2 + 36 * u, { size: FS(S, 15), weight: 700, color: p.ink2, align: 'center', base: 'middle', a });
  } else {
    const k = 1 - S.at('kaplan', 0, 0.3);
    if (k > 0.01) d.text('?', r.x + r.w / 2, r.y + r.h / 2, { size: 54, weight: 800, color: p.ink2, align: 'center', base: 'middle', a: k * 0.5 });
  }

  // ───── la curva ─────
  if (S.on('kaplan')) {
    const prog = S.at('kaplan', 0.3, 2.8, 'lin');
    const nShow = Math.max(0, Math.round(prog * (NS_MEAS.length - 1)));
    const pts = NS_MEAS.slice(0, nShow + 1).map((n) => P(n, Lkaplan(n)));
    d.clip(r.x, r.y, r.w, r.h, () => { d.polyline(pts, errT.c, 3.2); });
    // tamaños de modelo (puntos sobre el ajuste)
    SIZES.forEach((n) => {
      const a = clamp((prog * (NS_MEAS.length - 1) - NS_MEAS.findIndex((m) => m >= n) + 4) / 4);
      if (a <= 0) return;
      const [x, y] = P(n, Lkaplan(n));
      d.circle(x, y, 4 * u, { fill: wT.c, stroke: p.stage, lw: 1.5, a });
    });
    d.withAlpha(S.reveal('kaplan', 1.2, 0.6), () => {
      d.circle(r.x + 12 * u, r.y + r.h - 12 * u, 4 * u, { fill: wT.c, stroke: p.stage, lw: 1.5 });
      d.text(S.l('un tamaño de modelo', 'one model size'), r.x + 22 * u, r.y + r.h - 12 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'middle', halo: p.stage });
    });
  }

  // ───── rendimientos decrecientes (vista lineal) ─────
  if (S.on('flat') && !S.on('powerlaw')) {
    const a = S.reveal('flat', 0.3, 0.6) * (1 - lg);
    if (a > 0.01) d.withAlpha(a, () => {
      bracket(S, g, 1e8, 6e8, S.reveal('flat', 0.3, 0.8), 'r');
      bracket(S, g, 1e9, 1.5e9, S.reveal('flat', 1.6, 0.8), 'l');
    });
  }

  // ───── la ley de potencia ─────
  if (S.on('powerlaw')) {
    const a = S.reveal('powerlaw', 0.2, 0.7);
    formulaBox(S, r, a);
    const [sx, sy] = P(1e9, Lkaplan(1e9));
    d.withAlpha(S.reveal('powerlaw', 1.0, 0.6), () => {
      tagText(S, S.l(`pendiente −${S.n(KAPLAN.aN, 3)}`, `slope −${S.n(KAPLAN.aN, 3)}`), sx + 16 * u, sy - 20 * u, { t: 'err', align: 'left', size: 13 });
    });
  }

  // ───── ×10 en parámetros ─────
  if (S.on('times10') && !S.on('three')) drawTimes10(S, g, 1);
  else if (S.on('three')) { const a = 1 - S.at('three', 0, 0.6); if (a > 0.01) d.withAlpha(a, () => drawTimes10(S, g, 1)); }

  // ───── predicción por extrapolación ─────
  if (S.on('predict')) {
    const prog = S.at('predict', 0.3, 2.4, 'io');
    const [mx] = P(MEAS, Lkaplan(MEAS));
    d.line(mx, r.y, mx, r.y + r.h, p.mute, 1.5, [3, 4], S.reveal('predict', 0, 0.5));
    d.text(S.l('medido hasta aquí', 'measured up to here'), mx - 6 * u, r.y + 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage, a: S.reveal('predict', 0, 0.5) });
    const nExt = Math.max(1, Math.round(prog * (NS_EXT.length - 1)));
    const pts = NS_EXT.slice(0, nExt + 1).map((n) => P(n, Lkaplan(n)));
    d.polyline(pts, errT.c, 3, { dash: [7, 6] });
    const Nt = 1.5e11, [tx, ty] = P(Nt, Lkaplan(Nt)), a2 = S.reveal('predict', 2.0, 0.6);
    d.withAlpha(a2, () => {
      d.circle(tx, ty, 7 * u, { stroke: errT.c, lw: 2.5, fill: p.stage });
      tagText(S, S.l('×100 de tamaño', '×100 in size'), tx - 12 * u, ty - 34 * u, { align: 'right', t: 'ink', size: 13 });
      tagText(S, S.l(`pérdida prevista ≈ ${S.n(Lkaplan(Nt), 2)}`, `predicted loss ≈ ${S.n(Lkaplan(Nt), 2)}`), tx - 12 * u, ty - 16 * u, { align: 'right', t: 'err', size: 13 });
    });
  }

  // ───── lateral: las tres palancas ─────
  drawLevers(S, R.aside);
}

/** Corchete de «mismos +500 M de parámetros»: ganancia de pérdida en la vista lineal. */
function bracket(S: Frame, g: Geo, n1: number, n2: number, a: number, side: 'l' | 'r') {
  const { d, pal: p } = S, u = S.u, { P } = g;
  const A = P(n1, Lkaplan(n1)), B = P(n2, Lkaplan(n2)), errT = tone(S, 'err');
  const gain = Lkaplan(n1) - Lkaplan(n2), h = clamp(a * 2), v = clamp(a * 2 - 1);
  d.line(A[0], A[1], A[0] + (B[0] - A[0]) * h, A[1], p.mute, 1.5, [4, 3]);
  if (v <= 0) return;
  d.arrow(B[0], A[1], B[0], A[1] + (B[1] - A[1]) * v, errT.c, 2.6, v >= 1 ? 8 : 0.001);
  if (a < 0.95) return;
  tagText(S, `+${count(n2 - n1, S.lang)}`, (A[0] + B[0]) / 2, A[1] - 11 * u, { t: 'ink', size: 12.5 });
  if (side === 'r') tagText(S, `−${S.n(gain, 2)}`, B[0] + 9 * u, (A[1] + B[1]) / 2, { t: 'err', align: 'left', size: 14 });
  else tagText(S, `−${S.n(gain, 2)}`, B[0] - 2 * u, B[1] + 15 * u, { t: 'err', align: 'right', size: 14 });
}

function formulaBox(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, sz = FS(S, 16);
  const base = 'L(N) = (Nc / N)', ex = S.n(KAPLAN.aN, 3), exSz = FS(S, 12.5);
  const w1 = d.measure(base, { size: sz, weight: 700, font: 'mono' }), w2 = d.measure(ex, { size: exSz, weight: 700, font: 'mono' });
  const bw = w1 + w2 + 26 * u, bh = 38 * u, x0 = r.x + r.w - bw - 6 * u, y0 = r.y + 6 * u;
  d.withAlpha(a, () => {
    d.rect(x0, y0, bw, bh, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    d.text(base, x0 + 13 * u, y0 + bh / 2 + 3 * u, { size: sz, weight: 700, font: 'mono', color: p.ink, base: 'middle' });
    d.text(ex, x0 + 13 * u + w1 + 1, y0 + bh / 2 - 8 * u, { size: exSz, weight: 700, font: 'mono', color: tone(S, 'err').ink, base: 'middle' });
  });
}

/** Los pasos «×10» a lo largo de la recta: cada uno multiplica la pérdida por 10^−0,076. */
function drawTimes10(S: Frame, g: Geo, a0: number) {
  const { d, pal: p } = S, u = S.u, { P } = g, wT = tone(S, 'w'), errT = tone(S, 'err');
  const Ns = [1e8, 1e9, 1e10, 1e11];
  const k = S.at('times10', 0.2, 3.6, 'lin') * 3;   // pasos mostrados (0..3)
  const pts = Ns.map((n) => P(n, Lkaplan(n)));
  const mult = 10 ** -KAPLAN.aN;
  d.withAlpha(a0, () => {
    pts.forEach(([x, y], i) => {
      const a = clamp(k - i + 1);
      if (a <= 0) return;
      d.circle(x, y, 5 * u, { fill: wT.c, stroke: p.stage, lw: 1.5, a });
      tagText(S, S.n(Lkaplan(Ns[i]), 2), x - 8 * u, y + 14 * u, { align: 'right', size: 12.5, t: 'ink', font: 'mono', a });
    });
    for (let i = 0; i < 3; i++) {
      const a = clamp(k - i);
      if (a <= 0) continue;
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], h = clamp(a * 2), v = clamp(a * 2 - 1);
      d.arrow(x1, y1, x1 + (x2 - x1) * h, y1, wT.c, 2.4, h >= 1 ? 8 : 0.001);
      if (v > 0) d.arrow(x2, y1, x2, y1 + (y2 - y1) * v, errT.c, 2.4, v >= 1 ? 8 : 0.001);
      if (a > 0.95) {
        if (i === 0) tagText(S, '×10', (x1 + x2) / 2, y1 - 11 * u, { t: 'w', size: 12.5 });
        tagText(S, `×${S.n(mult, 2)}`, x2 + 7 * u, (y1 + y2) / 2, { t: 'err', align: 'left', size: 13.5 });
      }
    }
  });
}

// ── lateral: parámetros, datos, cómputo ───────────────────────────────────────
function drawLevers(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  if (!S.on('levers')) {
    neu(S, S.portrait ? r.x + r.w - 76 * u : r.x + r.w / 2 - 36 * u, r.y + (S.portrait ? 4 : r.h * 0.35), { scale: Math.max(2, Math.round(2.6 * u)), mood: 'think', a: S.reveal('hook', 0.4, 0.6) });
    return;
  }
  const fadeNeu = 1 - S.at('levers', 0, 0.4);
  if (fadeNeu > 0.02) neu(S, S.portrait ? r.x + r.w - 76 * u : r.x + r.w / 2 - 36 * u, r.y + (S.portrait ? 4 : r.h * 0.35), { scale: Math.max(2, Math.round(2.6 * u)), mood: 'think', a: fadeNeu });
  const cards: { letter: string; label: string; t: 'w' | 'lat' | 'dat'; m: number; showM: boolean; hot: number }[] = [
    { letter: 'N', label: S.l('parámetros', 'parameters'), t: 'w', m: 10 ** -KAPLAN.aN, showM: S.on('times10'), hot: S.between('times10', 'three') ? 1 : 0 },
    { letter: 'D', label: S.l('tokens de datos', 'data tokens'), t: 'lat', m: 10 ** -KAPLAN.aD, showM: S.on('three'), hot: 0 },
    { letter: 'C', label: S.l('cómputo (FLOPs)', 'compute (FLOPs)'), t: 'dat', m: 10 ** -KAPLAN.aC, showM: S.on('three'), hot: 0 },
  ];
  const gap = 8 * u;
  const cw = S.portrait ? (r.w - gap * 2) / 3 : r.w, ch = S.portrait ? Math.min(r.h, 112 * u) : Math.min(104 * u, (r.h - gap * 2) / 3);
  cards.forEach((c, i) => {
    const a = S.reveal('levers', 0.4 + i * 0.7, 0.5);
    if (a <= 0) return;
    const x = S.portrait ? r.x + i * (cw + gap) : r.x, y = S.portrait ? r.y : r.y + i * (ch + gap);
    const t = tone(S, c.t), mA = c.showM ? S.reveal(c.letter === 'N' ? 'times10' : 'three', 0.4 + (c.letter === 'C' ? 0.8 : 0), 0.6) : 0;
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: alpha(t.c, 0.07 + 0.22 * c.hot), stroke: t.c, lw: c.hot ? 2.4 : 1.5, r: 3 });
      d.text(c.letter, x + 10 * u, y + 8 * u, { size: FS(S, 26), weight: 800, font: 'mono', color: t.ink, base: 'top' });
      fitText(S, c.label, x + cw - 8 * u, y + 11 * u, cw - 50 * u, 13, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
      if (mA > 0.01) {
        d.withAlpha(mA, () => {
          fitText(S, `×10 → ×${S.n(c.m, 2)}`, x + cw / 2, y + ch - 10 * u - (S.portrait ? 0 : 0), cw - 12 * u, 15, { weight: 700, font: 'mono', color: tone(S, 'err').ink, align: 'center', base: 'bottom' });
          d.text(`−${S.n((1 - c.m) * 100, 0)} %`, x + cw / 2, y + ch - 12 * u - 17 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'bottom' });
        });
      }
    });
  });
  // nota al pie de «tres rectas»
  if (S.on('three') && !S.portrait) {
    const a = S.reveal('three', 1.6, 0.6), y = r.y + 3 * (ch + gap) - 2 * u;
    if (y + 28 * u < r.y + r.h) d.text(S.l('Kaplan et al., ec. 1.1–1.3', 'Kaplan et al., eq. 1.1–1.3'), r.x, y, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', a });
  }
}
