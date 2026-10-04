// Acto C (sqrt-why → try2): por qué se divide entre √d. Todo es cálculo real sobre vectores gaussianos con semilla fija
// (ver `demo` en data.ts): las puntuaciones q·k de nueve claves aleatorias se dispersan como √d, y con puntuaciones grandes
// el softmax se vuelve un interruptor. Lo ilustrativo: son vectores aleatorios, no palabras de un modelo entrenado.
import { alpha, clamp, inset, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DIMS, demo, demoAt } from './data';
import { actAlpha, fs, num, panel, textBlock, title } from './ui';

export interface SqrtState { mixS: number }
export const newSqrtState = (): SqrtState => ({ mixS: 1 });

type DM = ReturnType<typeof demoAt>;
const R = 40;   // las puntuaciones se dibujan entre −40 y 40 (en este sorteo, las mayores llegan a ±32 con d = 512)

interface Lay { read: Rect; strip: Rect; bars: Rect; all: Rect }
function layout(S: Frame): Lay {
  const u = S.u, all = inset(S.full(), 14 * u), gap = 10 * u;
  if (S.portrait) {
    const rh = 56 * u, sh = 106 * u;
    const strip = { x: all.x, y: all.y + rh + gap, w: all.w, h: sh };
    return { all, read: { x: all.x, y: all.y, w: all.w, h: rh }, strip, bars: { x: all.x, y: strip.y + sh + gap, w: all.w, h: all.y + all.h - (strip.y + sh + gap) } };
  }
  const lw = Math.round(all.w * 0.62), sh = Math.round(all.h * 0.38);
  const strip = { x: all.x, y: all.y, w: lw, h: sh };
  return { all, strip, bars: { x: all.x, y: all.y + sh + gap, w: lw, h: all.h - sh - gap }, read: { x: all.x + lw + gap * 1.5, y: all.y, w: all.w - lw - gap * 1.5, h: all.h } };
}

/** Qué se muestra en este instante: índice de dimensión (0..8), mezcla de escalado (0 = sin dividir, 1 = dividido) y transparencias. */
function view(S: Frame) {
  const st: SqrtState = S.st.sq ?? newSqrtState();
  if (S.on('try2')) return { x: clamp((S.p.dIdx ?? 3) - 1, 0, 8), mix: st.mixS, bars: 1, ghost: 1, growth: 0 };
  if (S.on('sqrt-sat')) {
    const mix = S.at('sqrt-sat', 6.6, 7.8);
    return { x: S.since('sqrt-sat') > 5.8 ? 5 : 5 * S.at('sqrt-sat', 0.5, 5.8, 'io'), mix, bars: S.at('sqrt-sat', 0.1, 0.8), ghost: mix, growth: 1 - S.at('sqrt-sat', 0, 0.7) };
  }
  return { x: 8 * S.at('sqrt-why', 0.6, 7.6, 'io'), mix: 0, bars: 0, ghost: 0, growth: 1 };
}

export function drawSqrt(S: Frame) {
  const A = actAlpha(S, 'sqrt-why', 'all'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, L = layout(S), v = view(S), dm = demoAt(v.x);
  const cur = v.mix > 0.5 ? 1 : 0;
  d.withAlpha(A, () => {
    // la gráfica de crecimiento (sqrt-why) cede su sitio a la franja y las barras (sqrt-sat, try2)
    if (v.growth > 0.01) d.withAlpha(v.growth, () => drawGrowth(S, { x: L.all.x, y: L.strip.y, w: L.strip.w, h: L.bars.y + L.bars.h - L.strip.y }, v.x));
    if (v.growth < 0.99) d.withAlpha(1 - v.growth, () => drawStrip(S, L.strip, dm, v.mix));
    if (v.bars > 0.01) d.withAlpha(v.bars, () => drawBars(S, L.bars, dm, v.mix, v.ghost));
    // lectura
    const rr = L.read, big = fs(S, S.portrait ? 24 : 34), sq = Math.sqrt(dm.d);
    d.text(S.portrait ? 'd' : S.l('dimensión d', 'dimension d'), rr.x + 2, rr.y + 2, { size: fs(S, 13), weight: 700, color: p.mute, base: 'top' });
    d.text(String(Math.round(dm.d)), rr.x + 2, rr.y + (S.portrait ? 18 : 20) * u, { size: big, weight: 800, font: 'mono', color: p.ink, base: 'top' });
    const rx = S.portrait ? rr.x + rr.w / 3 : rr.x, ry = S.portrait ? rr.y : rr.y + 78 * u, rw = S.portrait ? rr.w * 2 / 3 - 4 * u : rr.w;
    if (v.growth > 0.5) {
      d.withAlpha((v.growth - 0.5) * 2, () => {
        d.text('√d', rx, ry + 2, { size: fs(S, 13), weight: 700, color: p.mute, base: 'top' });
        d.text(num(S, sq, 1), rx, ry + (S.portrait ? 18 : 22) * u, { size: fs(S, S.portrait ? 24 : 34), weight: 800, font: 'mono', color: p.ink2, base: 'top' });
      });
    } else d.withAlpha(1 - v.growth * 2, () => readMax(S, rx, ry, rw, dm, cur, S.portrait, true));
  });
}

/** Gráfica de crecimiento: las nueve puntuaciones a medida que sube d, con la envolvente ±√d. */
function drawGrowth(S: Frame, r: Rect, x: number) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat');
  panel(S, r);
  title(S, S.l('puntuación q·k de nueve claves al azar, según d', 'q·k score of nine random keys, by d'), r.x + 8 * u, r.y + 6 * u, { w: r.w - 16 * u });
  const pl = 38 * u, pr = 14 * u, pt = 32 * u, pb = 30 * u, px = r.x + pl, pw = r.w - pl - pr, py = r.y + pt, ph = r.h - pt - pb;
  const X = (i: number) => px + (i / 8) * pw, Y = (s: number) => py + ph / 2 - (s / R) * (ph / 2);
  [-40, -20, 20, 40].forEach((t) => d.line(px, Y(t), px + pw, Y(t), p.line, 1));
  d.line(px, Y(0), px + pw, Y(0), p.lineStrong, 1.5); d.line(px, py, px, py + ph, p.lineStrong, 1.5);
  [-40, -20, 0, 20, 40].forEach((t) => d.text(num(S, t, 0), px - 6 * u, Y(t), { size: fs(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' }));
  DIMS.forEach((dd, i) => { d.line(X(i), Y(0) - 3, X(i), Y(0) + 3, p.lineStrong, 1.5); d.text(String(dd), X(i), py + ph + 6 * u, { size: fs(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top', a: i === 0 || i === 8 || pw > 330 || i % 2 === 0 ? 1 : 0 }); });
  d.text('d →', px + pw, py + ph + 18 * u, { size: fs(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top' });
  // envolvente ±√d (hasta el cursor)
  const n = 60, top: [number, number][] = [], bot: [number, number][] = [];
  for (let k = 0; k <= n; k++) { const i = (x * k) / n, sd = Math.sqrt(Math.pow(2, 1 + i)); top.push([X(i), Y(sd)]); bot.push([X(i), Y(-sd)]); }
  if (x > 0.02) {
    d.polygon([...top, ...bot.slice().reverse()], { fill: alpha(p.ink2, 0.1) });
    d.polyline(top, p.ink2, 1.6, { dash: [5, 4] }); d.polyline(bot, p.ink2, 1.6, { dash: [5, 4] });
  }
  // las nueve puntuaciones
  const cur = demoAt(x);
  for (let j = 0; j < 9; j++) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= Math.floor(x); i++) pts.push([X(i), Y(demo(DIMS[i]).raw[j])]);
    pts.push([X(x), Y(cur.raw[j])]);
    d.polyline(pts, alpha(lat.c, 0.75), 1.6);
    d.circle(X(x), Y(cur.raw[j]), 4.2 * u, { fill: lat.c, stroke: p.surface, lw: 1.25 });
  }
  if (x > 0.5) {
    const sd = Math.sqrt(cur.d), lab = '±√d';
    d.text(lab, Math.min(X(x) + 6 * u, px + pw - 30 * u), Y(sd) - 9 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink2, base: 'middle', halo: p.surface, haloW: 4 });
  }
}

/** Franja con las nueve puntuaciones en una recta (sin dividir, o ya divididas) y la banda ±√d. */
function drawStrip(S: Frame, sr: Rect, dm: DM, mix: number) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat');
  panel(S, sr);
  title(S, mix > 0.5 ? S.l('puntuaciones divididas entre √d', 'scores divided by √d') : S.l('puntuaciones q·k sin dividir', 'q·k scores, not divided'), sr.x + 8 * u, sr.y + 6 * u, { w: sr.w - 16 * u });
  const ax = { x: sr.x + 26 * u, w: sr.w - 52 * u }, ay = sr.y + sr.h * 0.62, X = (s: number) => ax.x + ((s + R) / (2 * R)) * ax.w;
  const sd = lerp(Math.sqrt(dm.d), 1, mix), step = Math.min(5.2 * u, (sr.h * 0.4) / 9), bandH = 9 * step + 6 * u;
  d.rect(X(-sd), ay - bandH / 2, Math.max(2, X(sd) - X(-sd)), bandH, { fill: alpha(p.ink2, 0.1), stroke: alpha(p.ink2, 0.5), lw: 1.25, dash: [5, 4] });
  d.line(ax.x, ay, ax.x + ax.w, ay, p.lineStrong, 1.5);
  [-40, -20, 0, 20, 40].forEach((t) => { d.line(X(t), ay - 3, X(t), ay + 5 * u, p.lineStrong, 1.5); d.text(num(S, t, 0), X(t), ay + bandH / 2 + 4 * u, { size: fs(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' }); });
  dm.raw.forEach((r, j) => {
    const s = lerp(r, dm.scaled[j], mix), yy = ay + (((j * 4) % 9) - 4) * step;
    d.circle(X(clamp(s, -R, R)), yy, 4.2 * u, { fill: lat.c, stroke: p.surface, lw: 1.25 });
  });
  const lab = mix > 0.5 ? '±1' : '±√d = ±' + num(S, Math.sqrt(dm.d), 1);
  d.text(lab, Math.min(X(sd) + 6 * u, ax.x + ax.w - d.measure(lab, { size: fs(S, 13), weight: 800, font: 'mono' }) - 2), ay - bandH / 2 - 9 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink2, base: 'middle', halo: p.surface, haloW: 4 });
}

/** Peso máximo medio (100 sorteos) con y sin escalar, y la pendiente del softmax del modo actual. */
function readMax(S: Frame, x: number, y: number, w: number, dm: DM, cur: number, compact: boolean, showMode: boolean) {
  const { d, pal: p } = S, u = S.u, sig = tone(S, 'sig'), err = tone(S, 'err');
  const lab = compact ? S.l('peso máximo medio', 'average top weight') : S.l('peso máximo medio (100 sorteos)', 'average top weight (100 draws)');
  d.text(lab, x, y + 2, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w });
  const rowY = y + (compact ? 20 : 22) * u;
  [[S.l('sin ÷√d', 'no ÷√d'), dm.avgMaxRaw, 0], [S.l('con ÷√d', 'with ÷√d'), dm.avgMaxScaled, 1]].forEach(([nm, val, i], k) => {
    const on = showMode && cur === i, cx = x + k * (w / 2);
    d.text(nm as string, cx, rowY, { size: fs(S, 12), weight: on ? 800 : 600, color: on ? p.ink : p.mute, base: 'top' });
    d.text(num(S, val as number, 2), cx, rowY + 15 * u, { size: fs(S, compact ? 18 : 22), weight: 800, font: 'mono', color: on ? (i === 0 ? err.ink : sig.ink) : p.mute, base: 'top' });
  });
  if (!compact && showMode) {
    // pendiente del softmax (cuánto cambia el reparto al mover una puntuación)
    const sy = rowY + 58 * u, val = dm.sens[cur], bw = w - 4;
    d.text(S.l('pendiente del softmax', 'softmax slope'), x, sy, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.rect(x, sy + 20 * u, bw, 10 * u, { fill: p.surface2 });
    d.rect(x, sy + 20 * u, Math.max(1.5, bw * clamp(val / 0.9)), 10 * u, { fill: cur ? sig.c : err.c });
    d.text(num(S, val, 2), x + bw, sy + 36 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink2, align: 'right', base: 'top' });
    const top = Math.max(...(cur ? dm.wScaled : dm.wRaw)), sat = !cur && top > 0.9;
    const msg = sat ? S.l('Softmax saturado: casi todo el peso en una clave.', 'Saturated softmax: almost all the weight on one key.') : S.l('Reparto con matices: varias claves cuentan.', 'A nuanced spread: several keys count.');
    textBlock(S, msg, x, sy + 70 * u, w, { size: fs(S, 13), weight: 700, color: sat ? err.ink : tone(S, 'dat').ink, lh: 1.2 });
  }
}

function drawBars(S: Frame, r: Rect, dm: DM, mix: number, ghost: number) {
  const { d, pal: p } = S, u = S.u, sig = tone(S, 'sig'), err = tone(S, 'err');
  panel(S, r);
  title(S, S.l('pesos sobre las nueve claves', 'weights over the nine keys'), r.x + 8 * u, r.y + 6 * u, { w: r.w - 150 * u });
  const top = r.y + 58 * u, base = r.y + r.h - 24 * u, hMax = Math.max(20, base - top), n = 9, cw = (r.w - 24 * u) / n, bw = Math.min(30 * u, cw - 6 * u);
  d.line(r.x + 8 * u, base, r.x + r.w - 8 * u, base, p.lineStrong, 1.5);
  for (let j = 0; j < n; j++) {
    const cx = r.x + 12 * u + j * cw + cw / 2, w = lerp(dm.wRaw[j], dm.wScaled[j], mix), h = hMax * w;
    d.rect(cx - bw / 2, base - h, bw, Math.max(1.5, h), { fill: mix > 0.5 ? sig.c : err.c });
    if (ghost > 0.05) { const o = mix > 0.5 ? dm.wRaw[j] : dm.wScaled[j]; d.rect(cx - bw / 2, base - hMax * o, bw, Math.max(1.5, hMax * o), { stroke: p.ink2, lw: 1.25, dash: [4, 3], a: 0.7 * ghost }); }
    d.text(String(j + 1), cx, base + 6 * u, { size: fs(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    if (w >= 0.1) d.text(num(S, w * 100, 0), cx, base - h - 3 * u, { size: fs(S, 12), weight: 800, font: 'mono', color: mix > 0.5 ? sig.ink : err.ink, align: 'center', base: 'bottom' });
  }
  d.text(mix > 0.5 ? S.l('con ÷√d', 'with ÷√d') : S.l('sin dividir', 'not divided'), r.x + r.w - 10 * u, r.y + 7 * u, { size: fs(S, 13), weight: 800, color: mix > 0.5 ? sig.ink : err.ink, align: 'right', base: 'top' });
  if (ghost > 0.05) d.text(S.l('contorno: el otro caso', 'outline: the other case'), r.x + r.w - 10 * u, r.y + 24 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top', a: ghost });
}

/** Estado del turno: la mezcla se anima hacia el interruptor, y el turno se cumple al ver ambos casos con d ≥ 64. */
export function updateSqrt(S: Frame) {
  const st: SqrtState = (S.st.sq ??= newSqrtState());
  const target = S.p.div === false ? 0 : 1;
  st.mixS += (target - st.mixS) * (1 - Math.exp(-S.dt * 9));
  if (S.between('try2', 'all')) {
    const big = DIMS[clamp(Math.round(S.p.dIdx ?? 3), 1, 9) - 1] >= 64, flags = (S.st.sqFlags ??= { on: false, off: false });
    if (big) { if (S.p.div === false) flags.off = true; else flags.on = true; }
    if (flags.on && flags.off) S.complete('scale');
  }
}
