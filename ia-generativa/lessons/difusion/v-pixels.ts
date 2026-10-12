// Vistas en píxeles: el gancho (estática → siete), qué es el ruido, el proceso hacia delante con su barra y su calendario,
// «con cualquier dígito pasa lo mismo» y por qué no se puede regresar de un salto.
import { alpha, clamp, lerp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MEAN, OTHERS, SEVEN, SEVENS5, T, forward, noise64, pixTraj, signalShare, toInk, toInt } from './models';
import { DEMO } from './demo';
import { cellFor, fr, fz, kk, label, live, mixBar, noisePix, pix } from './helpers';

const X0 = toInt(SEVEN);
/** El siete del proceso hacia delante en el paso t (tinta 0..1). */
export const sevenAt = (t: number) => toInk(forward(X0, DEMO.noise, t, new Float64Array(64)));
const ADD_T = 6;            // «un poco de ruido»
const FILM = [0, 10, 20, 30, 40, 50];

// ═════════ vista 1: el siete, el ruido y el proceso hacia delante ═════════
function layPix(S: Frame) {
  const R = regions(S, S.portrait ? 0.6 : 0.5), k = kk(S), labH = 26 * k;
  const side = Math.min(R.main.w - 8 * k, R.main.h - 2 * labH), cell = cellFor(side, 36), w = cell * 8;
  return { R, cell, w, x: R.main.x + (R.main.w - w) / 2, y: R.main.y + labH + Math.max(0, (R.main.h - 2 * labH - w) / 2) };
}

/** Paso del proceso hacia delante que muestra la imagen grande en cada momento. */
function bigStep(S: Frame): number {
  if (S.on('fwd-demo')) return S.p.fwd ?? 0;
  if (S.on('steps')) return ADD_T + (T - ADD_T) * fr(S, 'steps', 0.12, 0.9, 'lin');   // sigue la tira, sin saltos
  if (S.on('add-little')) return ADD_T * fr(S, 'add-little', 0.15, 0.4, 'io');
  return 0;
}

export function drawPixView(S: Frame) {
  const { d, pal: p } = S, L = layPix(S), k = kk(S), A = L.R.aside;
  // ── la imagen grande ──
  const hookTr = pixTraj(DEMO.hookSeed, 7, DEMO.pixScale);
  const hk = Math.round(T * fr(S, 'hook', 0.22, 0.86, 'io'));
  const gen = toInk(hookTr[hk]), real = 1 - fr(S, 'destroy', 0, 0.18);
  let topLabel = '';
  if (real > 0.01) {
    d.withAlpha(real, () => pix(S, L.x, L.y, gen, L.cell, { kind: 'model' }));
    topLabel = S.on('recall') ? S.l('una muestra nueva', 'a new sample') : hk < T * 0.15 ? S.l('estática', 'static') : hk >= T ? S.l('un siete nuevo', 'a new seven') : S.l('quitando ruido…', 'removing noise…');
  }
  if (S.on('destroy')) {
    const t = bigStep(S);
    d.withAlpha(1 - real, () => pix(S, L.x, L.y, sevenAt(t), L.cell));
    topLabel = S.on('steps') ? S.l(`paso ${Math.round(t)} de ${T}`, `step ${Math.round(t)} of ${T}`) : S.on('add-little') ? S.l('siete + un poco de ruido', 'seven + a little noise') : S.l('un siete real · 8 × 8 píxeles', 'a real seven · 8 × 8 pixels');
  }
  label(S, topLabel, L.x + L.w / 2, L.y - 8 * k, L.R.main.w, { size: 14, weight: 800, color: p.ink, base: 'bottom' });

  // ── el panel ──
  const aw = A.w, cx = A.x + aw / 2;
  // datos reales (repaso: aprender la distribución y sacar muestras nuevas)
  const aR = live(S, 'recall', 'destroy', 0.15, 0.15);
  if (aR > 0.01) d.withAlpha(aR, () => {
    const gap = 8 * k, cell = cellFor(Math.min((aw - 4 * gap) / 5, A.h * 0.4), 9), tw = cell * 8, x0 = cx - (5 * tw + 4 * gap) / 2, y0 = A.y + A.h / 2 - tw / 2;
    label(S, S.l('datos reales', 'real data'), cx, y0 - 10 * k, aw, { base: 'bottom' });
    SEVENS5.forEach((im, i) => pix(S, x0 + i * (tw + gap), y0, im, cell, { a: fr(S, 'recall', 0.2 + i * 0.06, 0.32 + i * 0.06) }));
    label(S, S.l('lo aprendido: cómo son los sietes', 'what is learned: what sevens look like'), cx, y0 + tw + 10 * k, aw, { size: 12, weight: 600, a: fr(S, 'recall', 0.5, 0.65) });
  });
  // escala de un píxel: de cero (vacío) a uno (tinta llena)
  const aS = live(S, 'destroy', 'noise-what', 0.3, 0.15);
  if (aS > 0.01) d.withAlpha(aS, () => {
    const n = 9, cw = Math.min(30 * k, (aw - 16 * k) / n), x0 = cx - (n * cw) / 2, y0 = A.y + A.h / 2 - cw / 2;
    for (let i = 0; i < n; i++) { d.rect(x0 + i * cw, y0, cw, cw, { fill: p.surface }); d.rect(x0 + i * cw, y0, cw, cw, { fill: alpha(p.ink, i / (n - 1)) }); }
    d.rect(x0 - 0.5, y0 - 0.5, n * cw + 1, cw + 1, { stroke: p.lineStrong });
    const sz = fz(S, 13);
    d.text(S.l('0 · vacío', '0 · empty'), x0, y0 + cw + 8 * k, { size: sz, weight: 700, color: p.ink2, base: 'top' });
    d.text(S.l('1 · tinta llena', '1 · full ink'), x0 + n * cw, y0 + cw + 8 * k, { size: sz, weight: 700, color: p.ink2, base: 'top', align: 'right' });
    label(S, S.l('cada píxel es un número', 'each pixel is a number'), cx, y0 - 10 * k, aw, { base: 'bottom' });
  });
  // el ruido solo
  const aN = live(S, 'noise-what', 'add-little', 0.12, 0.15);
  if (aN > 0.01) d.withAlpha(aN, () => {
    const cell = cellFor(Math.min(aw * 0.6, A.h * 0.55), 22), w = cell * 8, x0 = cx - w / 2, y0 = A.y + (A.h - w) / 2;
    label(S, S.l('ruido: números al azar', 'noise: random numbers'), cx, y0 - 10 * k, aw, { base: 'bottom' });
    noisePix(S, x0, y0, DEMO.noise, cell, { a: fr(S, 'noise-what', 0.1, 0.3) });
    label(S, S.l('más tinta: positivo · menos tinta: negativo', 'more ink: positive · less ink: negative'), cx, y0 + w + 10 * k, aw, { size: 12, weight: 600, a: fr(S, 'noise-what', 0.6, 0.75) });
  });
  // siete + un poco de ruido = siete sucio
  const aE = live(S, 'add-little', 'steps', 0.1, 0.15);
  if (aE > 0.01) d.withAlpha(aE, () => {
    const sym = 22 * k, cell = cellFor(Math.min((aw - 2 * sym) / 3, A.h * 0.5), 14), w = cell * 8, x0 = cx - (3 * w + 2 * sym) / 2, y0 = A.y + (A.h - w) / 2;
    pix(S, x0, y0, SEVEN, cell);
    noisePix(S, x0 + w + sym, y0, DEMO.noise, cell, { gain: 0.35, a: fr(S, 'add-little', 0.1, 0.25) });
    pix(S, x0 + 2 * (w + sym), y0, sevenAt(ADD_T), cell, { a: fr(S, 'add-little', 0.35, 0.5) });
    const sz = fz(S, 20);
    d.text('+', x0 + w + sym / 2, y0 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle', a: fr(S, 'add-little', 0.1, 0.25) });
    d.text('=', x0 + 2 * w + 1.5 * sym, y0 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle', a: fr(S, 'add-little', 0.35, 0.5) });
    const ls = 12, ly = y0 + w + 8 * k;
    label(S, S.l('siete', 'seven'), x0 + w / 2, ly, w + sym, { size: ls, weight: 600 });
    label(S, S.l('poco ruido', 'a little noise'), x0 + 1.5 * w + sym, ly, w + sym, { size: ls, weight: 600, a: fr(S, 'add-little', 0.1, 0.25) });
    label(S, S.l('sucio', 'dirty'), x0 + 2.5 * w + 2 * sym, ly, w + sym, { size: ls, weight: 600, a: fr(S, 'add-little', 0.35, 0.5) });
  });
  // tira de pasos (y su calendario) + barra imagen/ruido
  const aF = fr(S, 'steps', 0.05, 0.15);
  if (aF > 0.01) d.withAlpha(aF, () => drawFilm(S, A));
}

function drawFilm(S: Frame, A: Rect) {
  const { d, pal: p } = S, k = kk(S), n = FILM.length, gap = 6 * k, aw = A.w;
  const barH = 16 * k + 5 * k + fz(S, 12) * S.u * 1.2, labH = fz(S, 12) * S.u * 1.25, pctH = labH;
  const room = A.h - barH - 2 * labH - pctH - 22 * k;
  const cell = cellFor(Math.min((aw - (n - 1) * gap) / n, room), 12), tw = cell * 8, rowW = n * tw + (n - 1) * gap;
  const x0 = A.x + (aw - rowW) / 2, total = labH + tw + pctH + 14 * k + barH, y0 = A.y + Math.max(0, (A.h - total) / 2) + labH;
  const cur = S.on('fwd-demo') ? S.p.fwd ?? 0 : -1;
  // si «100 %» no cabe bajo cada cuadro, se escriben solo los números y el «%» pasa al rótulo
  const narrow = d.measure(S.lang === 'es' ? '100 %' : '100%', { size: fz(S, 12), weight: 700, font: 'mono' }) > tw + gap * 0.6;
  FILM.forEach((t, i) => {
    const a = fr(S, 'steps', 0.12 + i * (0.78 / n), 0.2 + i * (0.78 / n)), x = x0 + i * (tw + gap);
    if (a <= 0.01) return;
    const hot = cur >= 0 && Math.round(cur / 10) === i;
    pix(S, x, y0, sevenAt(t), cell, { a, hl: hot ? 'sig' : undefined });
    d.text(String(t), x + tw / 2, y0 - 4 * k, { size: fz(S, 12), weight: hot ? 800 : 600, font: 'mono', color: hot ? tone(S, 'sig').ink : p.mute, align: 'center', base: 'bottom', a });
    // calendario: qué parte de la mezcla sigue siendo imagen en ese paso
    const pa = fr(S, 'schedule', 0.25 + i * 0.06, 0.35 + i * 0.06) * a;
    if (pa > 0.01) d.text(`${S.n(signalShare(t) * 100, 0)}${narrow ? '' : S.lang === 'es' ? ' %' : '%'}`, x + tw / 2, y0 + tw + 5 * k, { size: fz(S, 12), weight: 700, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'top', a: pa });
  });
  d.text(S.l('paso', 'step'), x0 - 6 * k, y0 - 4 * k, { size: fz(S, 12), weight: 600, color: p.mute, align: 'right', base: 'bottom', a: x0 - 6 * k - d.measure(S.l('paso', 'step'), { size: fz(S, 12) }) > A.x - 2 ? 1 : 0 });
  const ca = fr(S, 'schedule', 0.15, 0.3);
  if (ca > 0.01) label(S, narrow ? S.l('calendario: % de imagen en la mezcla', 'schedule: % of image in the mix') : S.l('calendario: imagen en la mezcla', 'schedule: image in the mix'), A.x + aw / 2, y0 + tw + 5 * k + pctH, aw, { size: 12, weight: 600, color: tone(S, 'dat').ink, a: ca });
  // barra
  const ba = fr(S, 'mix-bar', 0.05, 0.2);
  if (ba > 0.01) {
    const t = S.p.fwd ?? 0, bw = Math.min(aw, rowW + 20 * k);
    mixBar(S, A.x + (aw - bw) / 2, y0 + tw + pctH + 14 * k + labH * (ca > 0 ? 1 : 0.4), bw, signalShare(t), { a: ba });
  }
}

// ═════════ vista 2: con cualquier dígito pasa lo mismo ═════════
const FRESH = noise64(99);
export function drawEnds(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, n = 4, gap = 14 * k;
  const labH = 22 * k, cell = cellFor(Math.min((R.w - (n - 1) * gap) / n, R.h - 3 * labH - 30 * k), 20), tw = cell * 8;
  const x0 = R.x + (R.w - (n * tw + (n - 1) * gap)) / 2, y0 = R.y + (R.h - tw) / 2;
  const t = T * fr(S, 'same-end', 0.12, 0.62, 'lin');
  const names = [S.l('un tres', 'a three'), S.l('un cero', 'a zero'), S.l('un ocho', 'an eight')];
  OTHERS.forEach((im, i) => {
    const x = x0 + i * (tw + gap), a = fr(S, 'same-end', 0.02 + i * 0.03, 0.1 + i * 0.03);
    pix(S, x, y0, toInk(forward(toInt(im), DEMO.otherNoise[i], t, new Float64Array(64))), cell, { a });
    label(S, names[i], x + tw / 2, y0 + tw + 8 * k, tw + gap, { a });
  });
  const fa = fr(S, 'same-end', 0.72, 0.84), xf = x0 + 3 * (tw + gap);
  pix(S, xf, y0, toInk(FRESH), cell, { a: fa, kind: 'model' });
  label(S, S.l('estática nueva', 'fresh static'), xf + tw / 2, y0 + tw + 8 * k, tw + gap, { a: fa, color: tone(S, 'sig').ink });
  label(S, S.l(`paso ${Math.round(t)} de ${T}`, `step ${Math.round(t)} of ${T}`), x0 + (3 * tw + 2 * gap) / 2, y0 - 12 * k, 3 * tw + 2 * gap, { size: 14, weight: 800, color: p.ink, base: 'bottom' });
  void d;
}

// ═════════ vista 3: ¿de un salto? No: en pasos pequeños ═════════
export function drawJump(S: Frame) {
  const c2 = fr(S, 'small-step', 0.02, 0.16, 'io');
  if (c2 < 1) S.d.withAlpha(1 - c2, () => drawJumpQ(S));
  if (c2 > 0) S.d.withAlpha(c2, () => drawSmallStep(S));
}
function drawJumpQ(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, P = S.portrait, labH = 24 * k;
  const big = cellFor(Math.min(P ? R.w * 0.36 : R.w * 0.22, P ? (R.h - 3 * labH) * 0.3 : R.h * 0.5), 18), bw = big * 8;
  const short = !P && R.h < 330 * k;
  const sm = cellFor(Math.min(P ? (R.w - 60 * k) / 3.4 : short ? R.w * 0.075 : R.w * 0.12, P ? (R.h - 3 * labH) * 0.2 : short ? R.h * 0.5 : (R.h - 4 * labH) / 3.3), 12), sw = sm * 8;
  // A: la estática · C: el promedio (en medio, aparece después) · B: los candidatos (al fondo)
  const A = P ? { x: R.x + (R.w - bw) / 2, y: R.y + labH } : { x: R.x + R.w * 0.07, y: R.y + (R.h - bw) / 2 };
  const C = P ? { x: R.x + (R.w - bw) / 2, y: A.y + bw + labH + 50 * k } : { x: R.x + R.w * 0.47 - bw / 2, y: A.y };
  const Bpos = (i: number) => P ? { x: R.x + R.w / 2 + (i - 1) * (sw + 34 * k) - sw / 2, y: C.y + bw + labH + 10 * k }
    : short ? { x: R.x + R.w * 0.84 + (i - 1) * (sw + 24 * k) - sw / 2, y: A.y + (bw - sw) / 2 } : { x: R.x + R.w * 0.86 - sw / 2, y: R.y + R.h / 2 + (i - 1) * (sw + labH) - sw / 2 };
  const ca = fr(S, 'jump-blur', 0.3, 0.5), dimB = 1 - 0.7 * fr(S, 'jump-blur', 0.1, 0.3);
  pix(S, A.x, A.y, sevenAt(T), big);
  label(S, S.l('esta estática', 'this static'), A.x + bw / 2, A.y - 8 * k, bw * 2, { base: 'bottom', size: 13 });
  OTHERS.forEach((im, i) => {
    const b = Bpos(i), a = fr(S, 'jump-q', 0.4 + i * 0.1, 0.52 + i * 0.1) * dimB;
    if (a <= 0.01) return;
    const ax = P ? A.x + bw / 2 : A.x + bw + 8 * k, ay = P ? A.y + bw + 6 * k : A.y + bw / 2, tx = P ? b.x + sw / 2 : b.x - 8 * k, ty = P ? b.y - 6 * k : b.y + sw / 2;
    d.withAlpha(a, () => { d.line(ax, ay, tx, ty, p.mute, 1.5, [4, 4]); pix(S, b.x, b.y, im, sm); });
    d.text('?', b.x + sw + 5 * k, b.y, { size: fz(S, 18), weight: 800, color: p.ink2, base: 'top', a });
  });
  if (ca > 0.01) {
    const er = tone(S, 'err');
    d.withAlpha(ca, () => {
      if (P) d.arrow(A.x + bw / 2, A.y + bw + 6 * k, C.x + bw / 2, C.y - labH - 2 * k, er.c, 2.5, 9);
      else d.arrow(A.x + bw + 8 * k, A.y + bw / 2, C.x - 8 * k, C.y + bw / 2, er.c, 2.5, 9);
    });
    if (P) d.text(S.l('un salto', 'one jump'), A.x + bw / 2 + 8 * k, (A.y + bw + C.y - labH) / 2, { size: fz(S, 12), weight: 800, color: er.ink, base: 'middle', halo: p.stage, a: ca });
    else d.text(S.l('un salto', 'one jump'), (A.x + bw + C.x) / 2, A.y + bw / 2 - 8 * k, { size: fz(S, 12), weight: 800, color: er.ink, align: 'center', base: 'bottom', halo: p.stage, a: ca });
    pix(S, C.x, C.y, MEAN, big, { a: ca, kind: 'model' });
    label(S, S.l('el promedio de los 1 500 dígitos', 'the average of the 1,500 digits'), C.x + bw / 2, C.y - 8 * k, P ? R.w * 0.9 : R.w * 0.3, { base: 'bottom', size: 13, a: ca });
  }
}
function drawSmallStep(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, gap = 70 * k;
  const cell = cellFor(Math.min((R.w - gap) / 2.3, R.h * 0.55), 20), w = cell * 8, x0 = R.x + (R.w - 2 * w - gap) / 2, y0 = R.y + (R.h - w) / 2;
  pix(S, x0, y0, sevenAt(20), cell);
  pix(S, x0 + w + gap, y0, sevenAt(19), cell, { a: fr(S, 'small-step', 0.2, 0.35) });
  label(S, S.l('paso 20', 'step 20'), x0 + w / 2, y0 - 8 * k, w + gap, { base: 'bottom', size: 14, weight: 800, color: p.ink });
  label(S, S.l('paso 19', 'step 19'), x0 + 1.5 * w + gap, y0 - 8 * k, w + gap, { base: 'bottom', size: 14, weight: 800, color: p.ink, a: fr(S, 'small-step', 0.2, 0.35) });
  const aa = fr(S, 'small-step', 0.25, 0.4), sg = tone(S, 'sig');
  d.withAlpha(aa, () => { d.arrow(x0 + w + 10 * k, y0 + w / 2, x0 + w + gap - 10 * k, y0 + w / 2, sg.c, 2.5, 9); });
  label(S, S.l('un paso', 'one step'), x0 + w + gap / 2, y0 + w / 2 + 10 * k, gap, { size: 12, weight: 800, color: sg.ink, a: aa });
  label(S, S.l('casi iguales: lo que sobra se puede estimar', 'nearly the same: what is extra can be estimated'), R.x + R.w / 2, y0 + w + 14 * k, R.w, { size: 13, a: fr(S, 'small-step', 0.55, 0.7) });
  void clamp; void lerp;
}
