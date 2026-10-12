// Vistas de la red que estima el ruido (pieza por pieza: imagen con ruido, paso → ruido estimado; restar una parte; cómo se entrena)
// y del regreso completo en píxeles (estática → siete; otra estática, otro siete). Todo lo que se ve sale de la red real (models.ts).
import { box, hash, lerp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { NULL, OTHERS, PIX, SEVEN, SEVENS5, T, forward, noise64, pixTraj, reverseStep, toInk, toInt } from './models';
import { DEMO } from './demo';
import { cellFor, fr, fz, kk, label, live, noisePix, pix } from './helpers';

// ── el ejemplo: el siete en el paso veinte ──
const X20 = forward(toInt(SEVEN), DEMO.noise, 20, new Float64Array(64));
const EHAT = (() => { const e = new Float64Array(64); PIX.eps(X20, 0, 19, NULL, e); return e; })();
const X19 = (() => { const x = Float64Array.from(X20); reverseStep(x, 0, 64, EHAT, 0, 19); return x; })();
/** Error cuadrático medio por píxel entre el ruido verdadero y el estimado (verify-data.ts lo recalcula: 0.135). */
export const ERR = EHAT.reduce((s, v, i) => s + (v - DEMO.noise[i]) ** 2, 0) / 64;
const INK20 = toInk(X20), INK19 = toInk(X19);

function layNet(S: Frame) {
  const R = regions(S, 1).all, k = kk(S), labH = 24 * k;
  // escenario bajo (teléfono en horizontal): la fila de abajo pasa a la derecha
  const short = !S.portrait && R.h < 330 * k;
  const L1: Rect = short ? { x: R.x, y: R.y, w: R.w * 0.56, h: R.h } : R, R2w = short ? R.w * 0.4 : R.w;
  const ag = Math.max(26 * k, L1.w * 0.05), bwMin = 76 * k;
  const symMin = 26 * k, cellRow2 = (R2w - 2 * symMin) / 3.2;
  const vroom = short ? R.h - 3 * labH - 40 * k : (R.h - 4 * labH - 64 * k) / 2;
  const cell = cellFor(Math.min((L1.w - 2 * ag - bwMin) / 2.1, vroom, short ? cellRow2 : 1e9), 22), w = cell * 8;
  const bw = Math.max(bwMin, Math.min(w * 1.2, L1.w - 2 * w - 2 * ag)), bh = Math.min(w, 70 * k);
  const rowW = 2 * w + bw + 2 * ag, x0 = L1.x + (L1.w - rowW) / 2;
  const blockH = short ? labH + w + 52 * k : labH + w + 52 * k + labH + w + labH;
  const y1 = R.y + Math.max(labH, (R.h - blockH) / 2 + labH);
  const A: Rect = { x: x0, y: y1, w, h: w }, B: Rect = { x: x0 + w + ag, y: y1 + (w - bh) / 2, w: bw, h: bh }, C: Rect = { x: x0 + w + 2 * ag + bw, y: y1, w, h: w };
  const y2 = short ? y1 : y1 + w + 52 * k + labH;
  const r2: Rect = short ? { x: R.x + R.w * 0.6, y: R.y, w: R2w, h: R.h } : R;
  return { R, k, cell, w, A, B, C, y2, labH, ag, r2, short };
}

export function drawNet(S: Frame) {
  const { d, pal: p } = S, L = layNet(S), { k, cell, w, A, B, C } = L;
  const sg = tone(S, 'sig'), wt = tone(S, 'w');
  // A: imagen con ruido
  const aA = fr(S, 'net-in1', 0.1, 0.3);
  pix(S, A.x, A.y, INK20, cell, { a: aA });
  label(S, S.l('imagen con ruido', 'noisy image'), A.x + w / 2, A.y - 8 * k, w + L.ag, { base: 'bottom', a: aA });
  // B: la red
  const aB = fr(S, 'net-in1', 0.4, 0.6);
  box(S, B, S.l('red', 'network'), { tone: 'w', a: aB, size: fz(S, 15) });
  d.withAlpha(aB, () => d.arrow(A.x + w + 6 * k, A.y + w / 2, B.x - 6 * k, A.y + w / 2, p.ink2, 2, 8));
  // el paso: segunda entrada
  const aP = fr(S, 'net-in2', 0.1, 0.3);
  if (aP > 0.01) {
    const txt = S.l('paso 20', 'step 20'), cw = d.measure(txt, { size: fz(S, 13), weight: 800, font: 'mono' }) + 16 * k, chH = 24 * k;
    const cx = B.x + B.w / 2, cy = B.y + B.h + 30 * k;
    d.withAlpha(aP, () => {
      d.rect(cx - cw / 2, cy, cw, chH, { fill: sg.soft, stroke: sg.c, lw: 1.5, r: 3 });
      d.text(txt, cx, cy + chH / 2, { size: fz(S, 13), weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
      d.arrow(cx, cy - 2 * k, cx, B.y + B.h + 4 * k, sg.c, 2, 7);
    });
    label(S, S.l('cuánto ruido tiene', 'how much noise it has'), cx, cy + chH + 4 * k, B.w + 2 * L.ag, { size: 12, weight: 600, a: aP * (1 - live(S, 'net-step', undefined, 0.1)) });
  }
  // C: ruido estimado
  const aC = fr(S, 'net-out', 0.1, 0.3);
  if (aC > 0.01) {
    d.withAlpha(aC, () => d.arrow(B.x + B.w + 6 * k, A.y + w / 2, C.x - 6 * k, A.y + w / 2, p.ink2, 2, 8));
    noisePix(S, C.x, C.y, EHAT, cell, { a: aC, kind: 'model' });
    label(S, S.l('ruido estimado', 'estimated noise'), C.x + w / 2, C.y - 8 * k, w + L.ag, { base: 'bottom', a: aC, color: wt.ink });
  }

  // ── fila de abajo ──
  const row = (items: number, sym: number) => { const x0 = L.r2.x + (L.r2.w - (items * w + (items - 1) * sym)) / 2; return (i: number) => x0 + i * (w + sym); };
  const sym = L.short ? Math.min(Math.max(26 * k, L.ag * 0.9), (L.r2.w - 3 * w) / 2) : Math.max(28 * k, L.ag * 0.9), y2 = L.y2, sz = fz(S, 20);
  const under = (x: number, t: string, a: number, color?: string) => label(S, t, x + w / 2, y2 + w + 6 * k, w + sym, { size: 12, weight: 600, a, color });
  // restar una parte → paso 19
  const aS = live(S, 'net-step', 'train-idea', 0.1, 0.12);
  if (aS > 0.01) d.withAlpha(aS, () => {
    const X = row(3, sym);
    pix(S, X(0), y2, INK20, cell);
    noisePix(S, X(1), y2, EHAT, cell, { kind: 'model', gain: 0.6, a: fr(S, 'net-step', 0.1, 0.25) });
    pix(S, X(2), y2, INK19, cell, { kind: 'model', a: fr(S, 'net-step', 0.3, 0.45) });
    d.text('−', X(1) - sym / 2, y2 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle' });
    d.text('=', X(2) - sym / 2, y2 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle', a: fr(S, 'net-step', 0.3, 0.45) });
    under(X(0), S.l('paso 20', 'step 20'), 1); under(X(1), S.l('una parte', 'a part'), fr(S, 'net-step', 0.1, 0.25), wt.ink); under(X(2), S.l('paso 19', 'step 19'), fr(S, 'net-step', 0.3, 0.45));
  });
  // cómo se fabricó el ejemplo de entrenamiento
  const aT = live(S, 'train-idea', 'train-loss', 0.1, 0.12);
  if (aT > 0.01) d.withAlpha(aT, () => {
    const X = row(3, sym);
    pix(S, X(0), y2, SEVEN, cell, { a: fr(S, 'train-idea', 0.15, 0.3) });
    noisePix(S, X(1), y2, DEMO.noise, cell, { a: fr(S, 'train-idea', 0.35, 0.5), hl: 'dat' });
    pix(S, X(2), y2, INK20, cell, { a: fr(S, 'train-idea', 0.5, 0.62) });
    d.text('+', X(1) - sym / 2, y2 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle', a: fr(S, 'train-idea', 0.35, 0.5) });
    d.text('=', X(2) - sym / 2, y2 + w / 2, { size: sz, weight: 800, align: 'center', base: 'middle', a: fr(S, 'train-idea', 0.5, 0.62) });
    under(X(0), S.l('dígito real', 'real digit'), fr(S, 'train-idea', 0.15, 0.3));
    under(X(1), S.l('ruido fabricado', 'noise we made'), fr(S, 'train-idea', 0.35, 0.5), tone(S, 'dat').ink);
    under(X(2), S.l('paso al azar: 20', 'random step: 20'), fr(S, 'train-idea', 0.5, 0.62));
    label(S, S.l('= respuesta conocida', '= known answer'), X(1) + w / 2, y2 + w + 6 * k + fz(S, 12) * S.u * 1.35, w + sym, { size: 12, weight: 800, color: tone(S, 'dat').ink, a: fr(S, 'train-idea', 0.75, 0.88) });
  });
  // comparar con el ruido verdadero
  const aL = live(S, 'train-loss', 'train-free', 0.1, 0.12);
  if (aL > 0.01) d.withAlpha(aL, () => {
    const X = row(2, Math.min(Math.max(sym * 3, 110 * k), L.r2.w - 2 * w));
    noisePix(S, X(0), y2, DEMO.noise, cell, { hl: 'dat' });
    noisePix(S, X(1), y2, EHAT, cell, { kind: 'model', a: fr(S, 'train-loss', 0.1, 0.25) });
    under(X(0), S.l('ruido verdadero', 'true noise'), 1, tone(S, 'dat').ink);
    under(X(1), S.l('ruido estimado', 'estimated noise'), fr(S, 'train-loss', 0.1, 0.25), wt.ink);
    const mx = (X(0) + w + X(1)) / 2, ea = fr(S, 'train-loss', 0.3, 0.45), er = tone(S, 'err');
    d.text(S.l('error', 'error'), mx, y2 + w / 2 - 4 * k, { size: fz(S, 12), weight: 700, color: er.ink, align: 'center', base: 'bottom', a: ea });
    d.text(S.n(ERR, 3), mx, y2 + w / 2, { size: fz(S, 18), weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'top', a: ea });
    label(S, S.l('se reduce con descenso del gradiente', 'reduced with gradient descent'), L.r2.x + L.r2.w / 2, y2 + w + 26 * k, L.r2.w, { size: 12, weight: 600, a: fr(S, 'train-loss', 0.6, 0.75) });
  });
  // ejemplos sin fin
  const aF = live(S, 'train-free', undefined, 0.1);
  if (aF > 0.01) d.withAlpha(aF, () => {
    const pool = [SEVEN, ...OTHERS, ...SEVENS5], n = Math.max(4, Math.min(10, Math.floor((L.r2.w + 6 * k) / (w * 0.55 + 6 * k))));
    const c2 = Math.max(2, Math.floor(cell * 0.55)), tw = c2 * 8, gap = 6 * k, x0 = L.r2.x + (L.r2.w - (n * tw + (n - 1) * gap)) / 2;
    for (let i = 0; i < n; i++) {
      const a = fr(S, 'train-free', 0.05 + i * 0.05, 0.12 + i * 0.05);
      if (a <= 0.01) continue;
      const t = 3 + Math.floor(hash(i, 3) * 45), img = pool[Math.floor(hash(i, 4) * pool.length)];
      pix(S, x0 + i * (tw + gap), y2 + (w - tw) / 2, toInk(forward(toInt(img), noise64(200 + i), t, new Float64Array(64))), c2, { a });
    }
    const big = S.n(30000 * 256, 0);
    label(S, S.l(`${big} versiones con ruido`, `${big} noisy versions`), L.r2.x + L.r2.w / 2, y2 + (w + tw) / 2 + 10 * k, L.r2.w, { size: 14, weight: 800, color: tone(S, 'dat').ink, a: fr(S, 'train-free', 0.55, 0.7) });
  });
}

// ═════════ el regreso completo, en píxeles ═════════
export function drawRev(S: Frame) {
  const { pal: p } = S, k = kk(S), R = regions(S, 1).all, labH = 26 * k, P = S.portrait;
  const bigCell = cellFor(Math.min(R.w * 0.6, R.h - 2 * labH - 20 * k), 34), bw = bigCell * 8;
  const n = 6, cols = P ? 3 : 6, rows = Math.ceil(n / cols), gap = 14 * k;
  const smCell = cellFor(Math.min((R.w - (cols - 1) * gap) / cols, (R.h - rows * labH - (rows - 1) * gap - 30 * k) / rows), 18), sw = smCell * 8;
  const gx0 = R.x + (R.w - (cols * sw + (cols - 1) * gap)) / 2, gy0 = R.y + (R.h - (rows * sw + (rows - 1) * (gap + labH))) / 2 + labH * 0.5;
  const slot = (i: number) => ({ x: gx0 + (i % cols) * (sw + gap), y: gy0 + Math.floor(i / cols) * (sw + gap + labH) });
  const mv = fr(S, 'reverse-new', 0.02, 0.22, 'io');
  const k0 = Math.round(T * fr(S, 'reverse-pixels', 0.12, 0.84, 'lin'));
  const hookTr = pixTraj(DEMO.hookSeed, 7, DEMO.pixScale);
  // el principal: de grande y al centro a la primera casilla
  const s0 = slot(0), cell = Math.round(lerp(bigCell, smCell, mv)), w = cell * 8;
  const x = lerp(R.x + (R.w - bw) / 2, s0.x, mv), y = lerp(R.y + labH + (R.h - labH - bw) / 2, s0.y, mv);
  pix(S, x, y, toInk(hookTr[k0]), cell, { kind: 'model' });
  label(S, S.l(`regreso: paso ${k0} de ${T}`, `way back: step ${k0} of ${T}`), x + w / 2, y - 8 * k, R.w, { size: 14, weight: 800, color: p.ink, base: 'bottom', a: 1 - mv });
  // los otros: cada uno sale de su propia estática
  DEMO.moreSeeds.forEach((seed, j) => {
    const i = j + 1, a = fr(S, 'reverse-new', 0.12 + j * 0.06, 0.2 + j * 0.06);
    if (a <= 0.01) return;
    const kk2 = Math.round(T * fr(S, 'reverse-new', 0.14 + j * 0.06, 0.4 + j * 0.06, 'io')), s = slot(i);
    pix(S, s.x, s.y, toInk(pixTraj(seed, 7, DEMO.pixScale)[kk2]), smCell, { a, kind: 'model' });
  });
  const la = fr(S, 'reverse-new', 0.3, 0.45);
  if (la > 0.01) label(S, S.l('otra estática de partida → otro siete', 'different starting static → a different seven'), R.x + R.w / 2, gy0 - 10 * k, R.w, { size: 13, base: 'bottom', a: la });
  const qa = fr(S, 'reverse-new', 0.7, 0.82);
  if (qa > 0.01) label(S, S.l('¿por qué siempre un siete?', 'why always a seven?'), R.x + R.w / 2, slot(n - 1).y + sw + 10 * k, R.w, { size: 14, weight: 800, color: tone(S, 'lat').ink, a: qa });
}
