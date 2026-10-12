// La línea de tiempo (tl-axis … try-tl): un eje de años de 1943 a hoy (2026), un cursor que la escena mueve sola (control
// «anio», con S.drive) de hito en hito mientras la voz los cuenta, y una tarjeta con lo que pasó y en qué lección se vio.
// En «tl-gap» el eje se parte en dos tramos (1943–2012 y 2012–hoy) y la tarjeta compara cuántos hitos caben en cada uno;
// en «tl-scale», qué cambió desde 2012. Después, «tu turno»: mover el año.
// REAL: cada fecha está verificada en la lección que la cuenta (ver data.ts). La selección de hitos es de este curso.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LESSONS } from '../../curriculum';
import { EVENTS, YEAR0, YEAR1, eventAt } from './data';
import { FS, area, chip, chipH, chipW, dur, fitText, fr, para, paraH, pick, smooth, tight, win } from './ui';

// ── la demostración: el cursor de hito en hito ──────────────────────────────────────────────────────
const KEYS: [string, number, number][] = [
  ['tl-axis', 0, YEAR0], ['tl-1943', 0, YEAR0],
  ['tl-1958', 0, YEAR0], ['tl-1958', 0.12, 1958], ['tl-1958', 0.52, 1958], ['tl-1958', 0.6, 1959],
  ['tl-1969', 0, 1959], ['tl-1969', 0.1, 1969],
  ['tl-1986', 0, 1969], ['tl-1986', 0.12, 1986], ['tl-1986', 0.55, 1986], ['tl-1986', 0.64, 1997],
  ['tl-2012', 0, 1997], ['tl-2012', 0.1, 2012],
  ['tl-2014', 0.22, 2012], ['tl-2014', 0.3, 2013], ['tl-2014', 0.6, 2013], ['tl-2014', 0.68, 2014],
  ['tl-2017', 0, 2014], ['tl-2017', 0.08, 2017], ['tl-2017', 0.56, 2017], ['tl-2017', 0.64, 2020],
  ['tl-2022', 0, 2020], ['tl-2022', 0.08, 2022],
  ['tl-2024', 0, 2022], ['tl-2024', 0.08, 2024], ['tl-2024', 0.78, 2024], ['tl-2024', 0.9, YEAR1],
];
/** Año que la demostración pone en el cursor en este instante (entero: el deslizador se ve avanzar año por año). */
export function demoYear(S: Frame): number {
  const T = (k: string, f: number) => S.start(k) + f * dur(S, k);
  if (S.on('tl-gap')) return YEAR1;
  let prev = KEYS[0];
  for (const key of KEYS) {
    const t1 = T(key[0], key[1]);
    if (S.t < t1) {
      const t0 = T(prev[0], prev[1]);
      const k = t1 > t0 ? smooth((S.t - t0) / (t1 - t0)) : 1;
      return Math.round(prev[2] + (key[2] - prev[2]) * k);
    }
    prev = key;
  }
  return prev[2];
}

// ── reparto ─────────────────────────────────────────────────────────────────────────────────────────
export function timeLayout(S: Frame) {
  const u = S.u, A = area(S), t = tight(S);
  const x0 = A.x + 12 * u, x1 = A.x + A.w - 12 * u;
  const ay = A.y + (t ? 40 * u : S.portrait ? Math.max(58 * u, A.h * 0.17) : Math.max(64 * u, A.h * 0.28));
  const X = (y: number) => x0 + ((x1 - x0) * (y - YEAR0)) / (YEAR1 - YEAR0);
  const top = ay + (t ? 30 * u : 46 * u);
  const card: Rect = { x: A.x, y: top, w: A.w, h: A.y + A.h - top };
  return { A, x0, x1, ay, X, card };
}

export interface TimeSt { year: number; shown: number; marks: Record<number, number>; evAt: number; ev: number; forceEv: boolean }

// ── dibujo ──────────────────────────────────────────────────────────────────────────────────────────
export function drawTime(S: Frame, s: TimeSt) {
  const { d, pal: p } = S, u = S.u, L = timeLayout(S), sig = tone(S, 'sig');
  const grow = fr(S, 'tl-axis', 0.04, 0.4, 'io');
  // los dos tramos (tl-gap): bandas sobre el eje
  const gapA = s.forceEv ? 0 : win(S, 'tl-gap', 'try-tl');
  if (gapA > 0.003) {
    const b1 = fr(S, 'tl-gap', 0.2, 0.32), b2 = fr(S, 'tl-gap', 0.62, 0.74), bh = 10 * u;
    d.withAlpha(gapA, () => {
      d.rect(L.X(YEAR0), L.ay - bh / 2, L.X(2012) - L.X(YEAR0), bh, { fill: alpha(tone(S, 'dat').c, 0.28 * b1), r: 3 });
      d.rect(L.X(2012), L.ay - bh / 2, L.X(YEAR1) - L.X(2012), bh, { fill: alpha(sig.c, 0.4 * b2), r: 3 });
      d.line(L.X(2012), L.ay - 16 * u, L.X(2012), L.ay + 8 * u, p.ink2, 1.4, [3, 2], Math.max(b1, b2));
    });
  }
  // el eje y sus rótulos
  d.line(L.x0, L.ay, L.x0 + (L.x1 - L.x0) * grow, L.ay, p.ink2, 1.8);
  const ty = L.ay + 8 * u, lsz = 12.5;
  for (let yr = 1950; yr <= 2020; yr += 10) { const x = L.X(yr); if (x <= L.x0 + (L.x1 - L.x0) * grow) d.line(x, L.ay - 3 * u, x, L.ay + 3 * u, p.line, 1.2); }
  const left = String(YEAR0), right = S.l(`hoy · ${YEAR1}`, `today · ${YEAR1}`);
  const lw = S.d.measure(left, { size: FS(S, lsz), weight: 700, font: 'mono' }), rw = S.d.measure(right, { size: FS(S, lsz), weight: 700, font: 'mono' });
  fitText(S, left, L.x0, ty, lw + 4, lsz, { weight: 700, font: 'mono', color: p.ink2, base: 'top', a: fr(S, 'tl-axis', 0.3, 0.42) });
  fitText(S, right, L.x1, ty, rw + 4, lsz, { weight: 700, font: 'mono', color: p.ink2, base: 'top', align: 'right', a: fr(S, 'tl-axis', 0.66, 0.78) });
  // décadas intermedias, si caben sin tocar los extremos
  [1960, 1980, 2000].forEach((yr) => {
    const x = L.X(yr), w = S.d.measure(String(yr), { size: FS(S, 12), weight: 600, font: 'mono' });
    if (x - w / 2 > L.x0 + lw + 8 * u && x + w / 2 < L.x1 - rw - 8 * u) d.text(String(yr), x, ty, { size: FS(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top', a: fr(S, 'tl-axis', 0.45, 0.6) });
  });
  const w12 = S.d.measure('2012', { size: FS(S, 12.5), weight: 800, font: 'mono' });
  if (gapA > 0.003 && L.X(2012) + w12 / 2 < L.x1 - rw - 6 * u) d.withAlpha(gapA * fr(S, 'tl-gap', 0.2, 0.32), () => {
    const x = L.X(2012), w = w12;
    d.rect(x - w / 2 - 3 * u, ty - 1, w + 6 * u, FS(S, 12.5) * u * 1.2, { fill: p.stage });
    d.text('2012', x, ty, { size: FS(S, 12.5), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
  });
  // marcas de los hitos (entran con un fundido corto cuando el cursor las alcanza)
  const cur = eventAt(s.year);
  EVENTS.forEach((e, i) => {
    const at = s.marks[i];
    if (at === undefined) return;
    const a = at < 0 ? 1 : clamp((S.clock - at) / 0.3), x = L.X(e.year), isCur = i === cur && !(gapA > 0.5);
    d.circle(x, L.ay, (isCur ? 6.5 : 4) * u, { fill: isCur ? sig.c : p.ink2, stroke: p.stage, lw: 1.4, a });
  });
  // el cursor
  const cx = L.X(s.shown), cy = L.ay, lab = String(s.year);
  const cA = fr(S, 'tl-axis', 0.1, 0.25);
  d.withAlpha(cA, () => {
    d.line(cx, cy - 22 * u, cx, cy, sig.c, 2);
    const w = S.d.measure(lab, { size: FS(S, 15), weight: 800, font: 'mono' }) + 12 * u, h = FS(S, 15) * u + 8 * u;
    const bx = clamp(cx - w / 2, L.A.x, L.A.x + L.A.w - w);
    d.rect(bx, cy - 22 * u - h, w, h, { fill: sig.c, r: 4 });
    d.text(lab, bx + w / 2, cy - 22 * u - h / 2 + 0.5, { size: FS(S, 15), weight: 800, font: 'mono', color: p.stage, align: 'center', base: 'middle' });
  });
  // la tarjeta: lo que pasó (o la comparación de los dos tramos, o qué cambió desde 2012)
  const evA = s.forceEv ? 1 : fr(S, 'tl-1943', 0, 0.1) * (1 - win(S, 'tl-gap', 'try-tl'));
  if (evA > 0.003 && cur >= 0) {
    const k = s.evAt < 0 ? 1 : clamp((S.clock - s.evAt) / 0.25);
    d.withAlpha(evA * (0.25 + 0.75 * smooth(k)), () => drawEvent(S, L.card, cur));
  }
  if (gapA > 0.003) d.withAlpha(win(S, 'tl-gap', 'tl-scale') * (s.forceEv ? 0 : 1), () => drawGap(S, L.card));
  const scA = s.forceEv ? 0 : win(S, 'tl-scale', 'try-tl');
  if (scA > 0.003) d.withAlpha(scA, () => drawScale(S, L.card));
}

function drawEvent(S: Frame, R: Rect, i: number) {
  const { d, pal: p } = S, u = S.u, e = EVENTS[i], sig = tone(S, 'sig');
  const wide = !S.portrait && R.w >= 460 * u;
  const yw = wide ? 96 * u : 0, w = Math.min(R.w - yw, 560 * u), x = R.x + (wide ? (R.w - w - yw) / 2 + yw : 0);
  const big = !S.portrait && !tight(S), tsz = tight(S) ? 14 : big ? 18 : 16;
  const items = e.items.map((it) => {
    const t = S.L(it), th = paraH(S, t, w, FS(S, tsz), { weight: 700, maxLines: 2 });
    return { t, th, n: it.n };
  });
  const ch = chipH(S, 13), yh = wide ? 0 : FS(S, tight(S) ? 20 : 24) * u * 1.2 + 4 * u;
  const total = yh + items.reduce((s2, it) => s2 + it.th + 4 * u + ch + 10 * u, 0) - 10 * u;
  let y = R.y + Math.max(0, Math.min((R.h - total) / 2, 60 * u));
  const year = String(e.year);
  if (wide) fitText(S, year, x - yw, y - 2 * u, yw - 12 * u, 28, { weight: 800, font: 'mono', color: sig.ink, base: 'top' });
  else { fitText(S, year, x, y, w, tight(S) ? 20 : 24, { weight: 800, font: 'mono', color: sig.ink, base: 'top' }); y += yh; }
  items.forEach((it) => {
    para(S, it.t, x, y, w, FS(S, tsz), { weight: 700, color: p.ink, maxLines: 2 });
    y += it.th + 4 * u;
    const lab = pick(S, [S.l(`Lección ${it.n} · ${S.L(LESSONS[it.n - 1].title)}`, `Lesson ${it.n} · ${S.L(LESSONS[it.n - 1].title)}`), S.l(`Lección ${it.n}`, `Lesson ${it.n}`)], w - 16 * u, 13, 700);
    chip(S, lab, x, y + ch / 2, 'sig', { size: 13, align: 'left', maxW: w });
    y += ch + 10 * u;
  });
  void d;
}

function drawGap(S: Frame, R: Rect) {
  const { d, pal: p } = S, u = S.u, sz = tight(S) ? 13 : 14.5;
  const rows: { lab: string; yrs: number; marks: number[]; t: string; f: number; tone: 'dat' | 'sig' }[] = [
    { lab: S.l('1943 → 2012', '1943 → 2012'), yrs: 69, marks: EVENTS.filter((e) => e.year < 2012).map((e) => e.year), t: S.l('69 años · 6 hitos', '69 years · 6 milestones'), f: 0.2, tone: 'dat' },
    { lab: S.l('2012 → hoy', '2012 → today'), yrs: 14, marks: EVENTS.filter((e) => e.year >= 2012).map((e) => e.year), t: S.l('14 años · 7 hitos', '14 years · 7 milestones'), f: 0.62, tone: 'sig' },
  ];
  const w = Math.min(R.w, 560 * u), x = R.x + (R.w - w) / 2;
  const labW = Math.max(...rows.map((r) => S.d.measure(r.lab, { size: FS(S, 12.5), weight: 700, font: 'mono' }))) + 10 * u;
  const rowH = FS(S, sz) * u * 1.3 + 24 * u, total = rows.length * rowH;
  let y = R.y + Math.max(0, Math.min((R.h - total) / 2, 60 * u));
  const barW = w - labW, bh = 12 * u;
  rows.forEach((r) => {
    const a = fr(S, 'tl-gap', r.f, r.f + 0.12), t = tone(S, r.tone);
    d.withAlpha(a, () => {
      fitText(S, r.lab, x, y + bh / 2, labW, 12.5, { weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
      const bw = (barW * r.yrs) / 69, bx = x + labW;
      d.rect(bx, y, bw, bh, { fill: alpha(t.c, 0.25), stroke: t.c, lw: 1.2, r: 3 });
      const y0 = r.yrs === 69 ? YEAR0 : 2012;
      r.marks.forEach((yr) => d.circle(bx + (bw * (yr - y0)) / r.yrs, y + bh / 2, 3.2 * u, { fill: t.c, stroke: p.stage, lw: 1 }));
      fitText(S, r.t, bx, y + bh + 6 * u, barW, sz, { weight: 800, color: t.ink, base: 'top' });
    });
    y += rowH;
  });
}

function drawScale(S: Frame, R: Rect) {
  const { pal: p } = S, u = S.u, sz = tight(S) ? 13.5 : 15;
  const w = Math.min(R.w, 560 * u), x = R.x + (R.w - w) / 2;
  const l1 = S.l('La neurona artificial es de 1943: más de 80 años.', 'The artificial neuron dates from 1943: over 80 years ago.');
  const l2 = S.l('Desde 2012, la escala:', 'Since 2012, scale:');
  const h1 = paraH(S, l1, w, FS(S, sz), { weight: 700 }), ch = chipH(S, 13.5);
  const total = h1 + 14 * u + FS(S, sz) * u * 1.3 + 8 * u + ch;
  let y = R.y + Math.max(0, Math.min((R.h - total) / 2, 60 * u));
  S.d.withAlpha(fr(S, 'tl-scale', 0.04, 0.16), () => para(S, l1, x, y, w, FS(S, sz), { weight: 700, color: p.ink }));
  y += h1 + 14 * u;
  S.d.withAlpha(fr(S, 'tl-scale', 0.42, 0.54), () => fitText(S, l2, x, y, w, sz, { weight: 800, color: tone(S, 'sig').ink, base: 'top' }));
  y += FS(S, sz) * u * 1.3 + 8 * u;
  const chips = [S.l('más datos', 'more data'), S.l('más cómputo', 'more compute'), S.l('algunos trucos', 'a few tricks')];
  let cx = x;
  chips.forEach((c, i) => {
    const a = fr(S, 'tl-scale', 0.58 + 0.1 * i, 0.68 + 0.1 * i);
    if (cx > x && cx + chipW(S, c, 13.5) > x + w) { cx = x; y += ch + 6 * u; }   // si no caben en un renglón, se parten
    const b = chip(S, c, cx, y + ch / 2, i === 2 ? 'w' : 'dat', { size: 13.5, align: 'left', a });
    cx += b.w + 8 * u;
  });
}
