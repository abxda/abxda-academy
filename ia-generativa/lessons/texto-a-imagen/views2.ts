// Vistas centrales: la difusión condicionada pieza por pieza, cuatro intentos por prompt, el esquema del guiado y la
// cuadrícula de veinticuatro imágenes con la escala de guiado. Todas las imágenes se generan aquí con el modelo real.
import { alpha, clamp, inset, lerp, type Frame, type Rect } from '../../../../../theme/kit';
import { DEMO, GALLERY } from './model';
import { NULL_C, T, Z, caption, decodeStep, eps, generate, textVec } from './nn';
import { GEN_SCALE, GUIDE_SEEDS, GUIDE_VALUES, RESULT_SEEDS, guidePrompt, guideStats, promptOf, stOf } from './state';
import { counter, fitText, flow, fr, fz, isShort, kk, label, netBox, promptBox, toyImage, vecBars } from './toy';

const area = (S: Frame): Rect => inset(S.full(), 14 * S.u, 14 * S.u, 12 * S.u, 14 * S.u);
const GEN_SEED = RESULT_SEEDS[0];

// ═════════ la difusión condicionada ═════════
export function drawCond(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const W = Math.min(R.w, 900 * S.u), x0 = R.x + (R.w - W) / 2;
  const cIn = { x: x0, w: W * (P ? 0.3 : 0.25) }, cBox = { x: x0 + W * (P ? 0.36 : 0.33), w: W * (P ? 0.28 : 0.24) }, cOut = { x: x0 + W * (P ? 0.7 : 0.65), w: W * (P ? 0.3 : 0.27) };
  const yA = R.y + R.h * (P ? 0.12 : 0.14), yB = R.y + R.h * (P ? 0.5 : 0.5), yC = R.y + R.h * (P ? 0.84 : 0.84);
  const bh = Math.min(R.h * 0.13, 64 * k), boxH = Math.min(R.h * 0.17, 84 * k);
  const genPrompt = promptOf(S, 0);
  // estado que se muestra: antes de la demostración, un paso intermedio fijo; durante, el paso que toca
  const gen = S.on('gen-demo'), kStep = gen ? Math.round(T * fr(S, 'gen-demo', 0.2, 0.86, 'lin')) : 12;
  const traj = generate(genPrompt, GEN_SCALE, GEN_SEED).traj, z = traj[kStep];
  const kE = Math.min(kStep, T - 1), zE = traj[kE], t = T - 1 - kE;   // tras el último paso se muestra la última predicción
  const condOn = S.on('condition'), c = textVec(genPrompt);
  const e = new Float64Array(Z);
  const eu = eps(zE, t, NULL_C);
  if (condOn) { const ec = eps(zE, t, c), s = GEN_SCALE; for (let i = 0; i < Z; i++) e[i] = eu[i] + s * (ec[i] - eu[i]); }
  else e.set(eu);
  // fila B: la red que quita el ruido
  const zA = fr(S, 'denoiser', 0.12, 0.22), boxA = fr(S, 'denoiser', 0.2, 0.3), outA = fr(S, 'denoiser', 0.55, 0.65);
  const zr = { x: cIn.x + 4 * k, y: yB - bh / 2, w: cIn.w - 8 * k, h: bh };
  vecBars(S, zr, z, { a: zA, max: 3 });
  const trainA = fr(S, 'cond-train', 0.12, 0.25) * (1 - fr(S, 'latent', 0, 0.12));
  label(S, trainA > 0.5 ? S.l('esa imagen, con ruido', 'that image, noisy') : S.l('imagen con ruido', 'noisy image'), zr.x + zr.w / 2, zr.y - 7 * k, { a: zA, base: 'bottom', weight: 700, w: cIn.w });
  label(S, S.l('16 números', '16 numbers'), zr.x + zr.w / 2, zr.y + zr.h + 7 * k, { a: fr(S, 'latent', 0.15, 0.3), weight: 700, color: p.ink });
  const box = { x: cBox.x, y: yB - boxH / 2, w: cBox.w, h: boxH };
  flow(S, zr.x + zr.w + 6 * k, yB, box.x - 4 * k, yB, fr(S, 'denoiser', 0.2, 0.3));
  netBox(S, box, S.l('red que quita el ruido', 'noise-removing network'), { a: boxA, hl: gen ? 0.6 : 0 });
  // número de paso (entra por abajo de la caja)
  const stepA = fr(S, 'denoiser', 0.32, 0.42);
  if (stepA > 0.01) {
    const txt = S.l(`paso ${kStep} de ${T}`, `step ${kStep} of ${T}`), sx = box.x + box.w / 2, sy = box.y + box.h + (P ? 24 : 28) * k;
    S.d.tag(txt, sx, sy, { size: fz(S, 12), align: 'center', a: stepA, weight: 700, fill: p.surface, stroke: p.lineStrong, color: p.ink });
    flow(S, sx, sy - 10 * k, sx, box.y + box.h + 3 * k, stepA, { lw: 1.6 });
  }
  const er = { x: cOut.x, y: yB - bh / 2, w: cOut.w - 4 * k, h: bh };
  flow(S, box.x + box.w + 4 * k, yB, er.x - 6 * k, yB, fr(S, 'denoiser', 0.5, 0.6));
  vecBars(S, er, e, { a: outA, max: 3, show: fr(S, 'denoiser', 0.58, 0.8, 'lin') });
  label(S, S.l('ruido a quitar', 'noise to remove'), er.x + er.w / 2, er.y - 7 * k, { a: outA, base: 'bottom', weight: 700, w: cOut.w });
  // fila A: la frase, su codificador y su vector (la tercera entrada)
  const pA = fr(S, 'condition', 0.1, 0.2) * (1 - trainA), encA = fr(S, 'condition', 0.2, 0.3), cA = fr(S, 'condition', 0.3, 0.42), dnA = fr(S, 'condition', 0.45, 0.6);
  const ptext = gen ? genPrompt : S.l('cruz ámbar sobre fondo violeta', 'amber cross on violet background');
  const pb = promptBox(S, ptext, cIn.x + cIn.w / 2, yA - 26 * k, cIn.w + (P ? 6 * k : 0), { a: gen ? 1 : pA, lines: 3, size: fz(S, 12.5), typed: gen ? fr(S, 'gen-demo', 0.02, 0.16, 'lin') : 1, hl: S.between('prompt', 'variety') ? fr(S, 'prompt', 0.05, 0.15) : 0, label: S.on('prompt') ? S.l('prompt', 'prompt') : undefined });
  let capEnd = 0;
  if (trainA > 0.01) {
    const ts = Math.min(bh * 1.1, cIn.w * (P ? 0.24 : 0.36)), combo = GALLERY.combos[0] as number[];
    const ft = fitText(S, caption(combo[0], combo[1], combo[2], S.lang), cIn.w - ts - 8 * k + (P ? 10 * k : 0), fz(S, 12), { lines: 4, font: 'mono' });
    const lh = ft.size * S.u * 1.2, capTop = yA - (ft.lines.length * lh) / 2;
    toyImage(S, cIn.x, yA - ts / 2, ts, GALLERY.imgs[0], { a: trainA });
    ft.lines.forEach((ln, i) => d.text(ln, cIn.x + ts + 8 * k, capTop + i * lh, { size: ft.size, font: 'mono', weight: 600, color: p.ink, base: 'top', a: trainA }));
    capEnd = cIn.x + ts + 8 * k + Math.max(...ft.lines.map((l) => d.measure(l, { size: ft.size, font: 'mono', weight: 600 })));
    label(S, S.l('par de entrenamiento', 'training pair'), cIn.x, Math.min(yA - ts / 2, capTop) - 6 * k, { a: trainA, base: 'bottom', weight: 700, align: 'left' });
  }
  const eb = { x: cBox.x, y: yA - boxH * 0.4, w: cBox.w, h: boxH * 0.8 };
  flow(S, Math.min(eb.x - 14 * k, Math.max(pb.x + pb.w, cIn.x + cIn.w, capEnd) + 4 * k), yA, eb.x - 4 * k, yA, encA);
  netBox(S, eb, S.l('codificador de texto de CLIP', 'CLIP text encoder'), { a: encA, size: fz(S, 12) });
  const cr = { x: cOut.x, y: yA - bh * 0.4, w: cOut.w - 4 * k, h: bh * 0.8 };
  flow(S, eb.x + eb.w + 4 * k, yA, cr.x - 6 * k, yA, cA);
  vecBars(S, cr, c, { a: cA, show: fr(S, 'condition', 0.34, 0.5, 'lin') });
  label(S, S.l('vector de la frase', 'sentence vector'), cr.x + cr.w / 2, cr.y - 7 * k, { a: cA, base: 'bottom', weight: 700, w: cOut.w });
  // del vector de la frase a la caja: la tercera entrada
  if (dnA > 0.01) {
    const x1 = cr.x + cr.w * 0.3, y1 = cr.y + cr.h + 6 * k, x2 = box.x + box.w * 0.8, y2 = box.y - 4 * k;
    flow(S, x1, y1, x2, y2, dnA, { lw: 2.6, color: p.ink });
    const ca = fr(S, 'condition', 0.7, 0.82);
    if (ca > 0.01) S.d.tag(S.l('condicionar', 'conditioning'), (x1 + x2) / 2 + (P ? 0 : 30 * k), (y1 + y2) / 2, { size: fz(S, 12.5), align: 'center', a: ca, weight: 800, fill: p.surface, stroke: p.ink, color: p.ink });
  }
  // fila C: el decodificador del VAE convierte los 16 números en imagen
  const cA2 = fr(S, 'latent', 0.35, 0.48), imA = fr(S, 'latent', 0.5, 0.62);
  const db = { x: cIn.x, y: yC - boxH * 0.4, w: cIn.w, h: boxH * 0.8 };
  flow(S, zr.x + zr.w / 2, zr.y + zr.h + 26 * k, zr.x + zr.w / 2, db.y - 4 * k, cA2);
  netBox(S, db, S.l('decodificador del VAE', 'VAE decoder'), { a: cA2, size: fz(S, 12) });
  const isz = Math.min(boxH * 1.05, cBox.w * 0.8, R.y + R.h - (yC - boxH * 0.5));
  const ix = cBox.x + cBox.w / 2 - isz / 2, iy = yC - isz / 2;
  flow(S, db.x + db.w + 4 * k, yC, ix - 6 * k, yC, cA2);
  toyImage(S, ix, iy, isz, null, { probs: decodeStep(genPrompt, GEN_SCALE, GEN_SEED, kStep), probsKey: `g${S.lang}-${kStep}`, a: imA });
  if (gen) {
    const fa = fr(S, 'gen-demo', 0.86, 0.95);
    label(S, S.l('resultado tras 40 pasos', 'result after 40 steps'), ix + isz + 10 * k, yC, { a: fa, align: 'left', base: 'middle', weight: 700, w: Math.max(60 * k, x0 + W - ix - isz - 12 * k) });
  }
}

// ═════════ cuatro intentos por prompt ═════════
/** Avance 0..1 de la generación de las cuatro imágenes (demostración por fracciones del segmento; si la persona eligió, por reloj). */
function resultsProgress(S: Frame, pr: number): number {
  const q = stOf(S);
  if (q.prUser) return clamp((S.clock - q.prClock) / 1.6);
  if (S.between('variety', 'prompt-demo')) return fr(S, 'variety', 0.1, 0.5, 'lin');
  if (S.between('prompt-demo', 'try-prompt')) return pr === 1 ? fr(S, 'prompt-demo', 0.16, 0.42, 'lin') : pr === 2 ? fr(S, 'prompt-demo', 0.56, 0.82, 'lin') : 1;
  return 1;
}
export function drawResults(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S);
  const pr = Math.round(S.p.pr ?? 0), text = promptOf(S, pr), prog = resultsProgress(S, pr);
  const cols = P ? 2 : 4, rows = 4 / cols, gap = 16 * k, foot = 40 * k, ph = 64 * k;
  const size = Math.min((R.w * (P ? 0.78 : 0.86) - (cols - 1) * gap) / cols, (R.h - ph - foot - (rows - 1) * gap) / rows);
  const y0 = R.y + Math.max(6 * k, (R.h - (ph + rows * size + (rows - 1) * gap + foot)) / 2);   // todo centrado en vertical
  const pb = promptBox(S, text, R.x + R.w / 2, y0, Math.min(R.w, 520 * S.u), { lines: 2, size: fz(S, 15), label: S.l('prompt', 'prompt') });
  const top = pb.y + pb.h + 18 * k;
  const gw = cols * size + (cols - 1) * gap, gx = R.x + (R.w - gw) / 2;
  RESULT_SEEDS.forEach((sd, i) => {
    const x = gx + (i % cols) * (size + gap), y = top + Math.floor(i / cols) * (size + gap);
    const pi = i === 0 && pr === 0 && !stOf(S).prUser ? 1 : prog, kk2 = Math.round(T * pi);
    const a = fr(S, 'variety', 0.04 + i * 0.03, 0.1 + i * 0.03);
    if (kk2 >= T) toyImage(S, x, y, size, generate(text, GEN_SCALE, sd).img, { a });
    else toyImage(S, x, y, size, null, { probs: decodeStep(text, GEN_SCALE, sd, kk2), probsKey: `r${text}-${sd}-${kk2}`, a });
  });
  label(S, S.l('cuatro ruidos iniciales distintos · escala de guiado 3', 'four different starting noises · guidance scale 3'), R.x + R.w / 2, top + rows * size + (rows - 1) * gap + 12 * k, { a: fr(S, 'variety', 0.6, 0.7), color: S.pal.mute, w: R.w });
}

// ═════════ esquema del guiado ═════════
export function drawCfg(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const short = isShort(S);                          // horizontal bajo: esquema a la izquierda; fórmula y fila de pares a la derecha
  const sh = short ? R.h : R.h * 0.64, sw = short ? R.w * 0.5 : R.w;
  const fTop = P ? 40 * k : 0;                       // en vertical, la fórmula va arriba
  const L = Math.min(sw * (P ? 0.3 : 0.2), (sh - fTop) * 0.3);
  const ox = R.x + sw * (P ? 0.2 : 0.22), oy = R.y + sh * 0.88;
  const U: [number, number] = [ox + 1.15 * L, oy - 0.2 * L], C: [number, number] = [ox + 0.95 * L, oy - 0.95 * L];
  const G = (s: number): [number, number] => [U[0] + s * (C[0] - U[0]), U[1] + s * (C[1] - U[1])];
  label(S, S.l('esquema', 'diagram'), R.x, R.y + fTop, { a: fr(S, 'two-preds', 0.05, 0.15), align: 'left', italic: true, color: p.mute });
  const pa = fr(S, 'two-preds', 0.25, 0.35), ca = fr(S, 'two-preds', 0.45, 0.6), ua = fr(S, 'two-preds', 0.68, 0.82);
  if (pa > 0.01) { d.circle(ox, oy, 5 * k, { fill: p.ink, a: pa }); label(S, S.l('paso actual', 'current step'), ox, oy + 10 * k, { a: pa }); }
  const ink = p.ink;
  // cada flecha se nombra a la mitad: la de la frase a la izquierda, la de la frase borrada abajo
  if (ca > 0.01) { flow(S, ox, oy, C[0], C[1], ca, { lw: 2.6, color: ink }); label(S, S.l('con la frase', 'with the sentence'), (ox + C[0]) / 2 - 18 * k, (oy + C[1]) / 2, { a: ca, align: 'right', base: 'middle', weight: 700, color: ink }); }
  if (ua > 0.01) { flow(S, ox, oy, U[0], U[1], ua, { lw: 2.6, color: p.ink2 }); label(S, S.l('con la frase borrada', 'with the sentence erased'), (ox + U[0]) / 2 + 14 * k, (oy + U[1]) / 2 + 8 * k, { a: ua, align: 'left', base: 'top', weight: 700 }); }
  // la diferencia y su extensión según la escala; los rótulos de escala van a la derecha de cada punta
  const da = fr(S, 'scale', 0.08, 0.22), ea = fr(S, 'scale', 0.42, 0.55), sNow = lerp(1, 3, fr(S, 'scale', 0.45, 0.75, 'io'));
  if (da > 0.01) { d.line(U[0], U[1], C[0], C[1], ink, 2.2, [5, 4], da); label(S, S.l('lo que aporta la frase', 'what the sentence adds'), (U[0] + C[0]) / 2 + 14 * k, (U[1] + C[1]) / 2, { a: da, align: 'left', base: 'middle', w: Math.max(90 * k, R.x + R.w * (P ? 1 : 0.58) - (U[0] + C[0]) / 2 - 18 * k) }); }
  if (ea > 0.01) {
    const g = G(sNow);
    d.line(C[0], C[1], g[0], g[1], ink, 2.2, [5, 4], ea);
    flow(S, ox, oy, g[0], g[1], ea, { lw: 3, color: ink });
    ([[0, U], [1, C], [3, G(3)]] as [number, [number, number]][]).forEach(([s, q]) => {
      if (s === 3 && sNow < 2.95) return;
      d.circle(q[0], q[1], 4 * k, { fill: p.stage, stroke: ink, lw: 2, a: ea });
      if (s !== 0 || da < 0.01) label(S, S.l(`escala ${s}`, `scale ${s}`), q[0] + 10 * k, q[1] - (s === 1 ? 6 * k : 0), { a: ea, align: 'left', base: s === 1 ? 'bottom' : 'middle', weight: 800, color: ink });
      else label(S, S.l('escala 0', 'scale 0'), q[0] + 10 * k, q[1] + 2 * k, { a: ea, align: 'left', base: 'top', weight: 800, color: ink });
    });
  }
  const fa = fr(S, 'scale', 0.62, 0.78);
  if (fa > 0.01) {
    const txt = S.l('sin frase + escala × (con frase − sin frase)', 'without + scale × (with − without)');
    const ft = fitText(S, txt, P ? R.w : R.w * 0.38, fz(S, 14), { lines: 2, font: 'mono' });
    const fx = P ? R.x + R.w / 2 : short ? R.x + R.w * 0.76 : R.x + R.w * 0.79, fy = P || short ? R.y : R.y + sh * 0.36;
    ft.lines.forEach((ln, i) => d.text(ln, fx, fy + i * ft.size * S.u * 1.3, { size: ft.size, font: 'mono', weight: 700, color: ink, align: 'center', base: 'top', a: fa }));
  }
  // al entrenar se borra la frase una de cada diez veces
  const imgs = [...DEMO.imgs.slice(0, 6), ...GALLERY.imgs.slice(5, 9)] as number[][];
  const n = 10, cols = P || short ? 5 : 10, rows = n / cols, gap = 10 * k, by = short ? R.y + R.h * 0.3 : R.y + sh + 18 * k;
  const DX = short ? R.x + R.w * 0.52 : R.x, DW = short ? R.w * 0.48 : R.w;
  const size = Math.min((DW - (cols - 1) * gap) / cols * 0.9, (R.y + R.h - by - 30 * k) / rows - 22 * k);
  const gw = cols * size + (cols - 1) * gap, gx = DX + (DW - gw) / 2;
  imgs.forEach((im, i) => {
    const a = fr(S, 'drop', 0.15 + i * 0.03, 0.21 + i * 0.03);
    if (a < 0.01) return;
    const x = gx + (i % cols) * (size + gap), y = by + Math.floor(i / cols) * (size + 22 * k);
    toyImage(S, x, y, size, im, { a });
    const erased = i === 6, ly = y + size + 6 * k;
    if (erased) {
      d.rect(x, ly, size, 8 * k, { stroke: p.ink, lw: 1.4, dash: [3, 3], a: a * fr(S, 'drop', 0.5, 0.6) });
      d.rect(x, ly, size, 8 * k, { fill: alpha(p.ink, 0.5), a: a * (1 - fr(S, 'drop', 0.5, 0.6)) });
    } else d.rect(x, ly, size, 8 * k, { fill: alpha(p.ink, 0.5), a });
  });
  label(S, S.l('al entrenar, una de cada diez frases se borra', 'during training, one sentence in ten is erased'), DX + DW / 2, by + rows * (size + 22 * k) + 2 * k, { a: fr(S, 'drop', 0.55, 0.68), weight: 700, color: p.ink, w: DW });
}

// ═════════ la cuadrícula de veinticuatro imágenes ═════════
export const gsOf = (S: Frame) => clamp(Math.round((S.p.gs ?? 0) * 2) / 2, 0, 8);
export function drawGrid(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const s = gsOf(S), q = guidePrompt(S), st = guideStats(S, s);
  const [main, aside] = P ? [{ x: R.x, y: R.y, w: R.w, h: R.h * 0.68 }, { x: R.x, y: R.y + R.h * 0.7, w: R.w, h: R.h * 0.3 }]
    : [{ x: R.x, y: R.y, w: R.w * 0.66, h: R.h }, { x: R.x + R.w * 0.69, y: R.y, w: R.w * 0.31, h: R.h }];
  const pb = promptBox(S, q, main.x + main.w / 2, main.y + 4 * k, main.w * 0.6, { a: fr(S, 'guide-setup', 0.1, 0.2), size: fz(S, 15), label: S.l('prompt', 'prompt') });
  const top = pb.y + pb.h + 12 * k, cols = 6, rows = 4, gap = 7 * k;
  const size = Math.min((main.w - (cols - 1) * gap) / cols, (main.y + main.h - top - 4 * k - (rows - 1) * gap) / rows);
  const gw = cols * size + (cols - 1) * gap, gx = main.x + (main.w - gw) / 2;
  GUIDE_SEEDS.forEach((sd, i) => {
    const a = fr(S, 'guide-setup', 0.5 + i * 0.012, 0.56 + i * 0.012);
    toyImage(S, gx + (i % cols) * (size + gap), top + Math.floor(i / cols) * (size + gap), size, generate(q, s, sd).img, { a });
  });
  // contadores
  const ca = fr(S, 'guide-setup', 0.75, 0.88);
  const hlC = S.is('guide-zero') ? fr(S, 'guide-zero', 0.15, 0.25) * (1 - fr(S, 'guide-zero', 0.55, 0.6)) : S.between('guide-demo', 'tradeoff') ? 1 : 0;
  const hlM = S.is('guide-zero') ? fr(S, 'guide-zero', 0.58, 0.66) : S.is('guide-demo') ? fr(S, 'guide-demo', 0.8, 0.88) : 0;
  const vals: [string, string, number][] = [
    [S.l('escala de guiado', 'guidance scale'), S.n(s, 1), 0],
    [S.l('círculos', 'circles'), S.l(`${st.circles} de 24`, `${st.circles} of 24`), hlC],
    [S.l('combinaciones distintas', 'different combinations'), String(st.combos), hlM],
  ];
  const chartA = fr(S, 'tradeoff', 0.08, 0.22);
  let yy = aside.y + (P ? 2 * k : 26 * k);
  if (P) {
    const cw = (aside.w - 2 * 8 * k) / 3;
    let h = 0;
    vals.forEach(([nm, v, hl], i) => { h = Math.max(h, counter(S, aside.x + i * (cw + 8 * k), yy, cw, nm, v, { a: ca, hl, size: fz(S, 17) })); });
    yy += h + 8 * k;
  } else {
    vals.forEach(([nm, v, hl]) => { yy += counter(S, aside.x, yy, aside.w, nm, v, { a: ca, hl }) + 10 * k; });
  }
  label(S, S.l('conteo: lector automático de reglas fijas', 'counted by a fixed-rule automatic reader'), aside.x + (P ? aside.w / 2 : 0), yy, { a: ca, align: P ? 'center' : 'left', italic: true, color: p.mute, w: aside.w });
  yy += 22 * k;
  // la curva del equilibrio (si cabe)
  const chH = aside.y + aside.h - yy - 6 * k;
  if (chartA > 0.01 && chH > 70 * k) drawTradeoff(S, { x: aside.x, y: yy + 4 * k, w: aside.w, h: chH }, s, chartA);
}
function drawTradeoff(S: Frame, r: Rect, sNow: number, a: number) {
  const d = S.d, p = S.pal, k = kk(S);
  const pl = { x: r.x + 26 * k, y: r.y + 6 * k, w: r.w - 34 * k, h: r.h - 34 * k };
  const X = (s: number) => pl.x + (s / 8) * pl.w, Y = (v: number) => pl.y + pl.h - (v / 24) * pl.h;
  const stats = GUIDE_VALUES.map((s) => guideStats(S, s));
  d.withAlpha(a, () => {
    d.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, p.lineStrong, 1.2);
    d.line(pl.x, pl.y, pl.x, pl.y + pl.h, p.lineStrong, 1.2);
    [0, 4, 8].forEach((s) => d.text(String(s), X(s), pl.y + pl.h + 4 * k, { size: fz(S, 11), font: 'mono', color: p.mute, align: 'center', base: 'top' }));
    [0, 24].forEach((v) => d.text(String(v), pl.x - 5 * k, Y(v), { size: fz(S, 11), font: 'mono', color: p.mute, align: 'right', base: 'middle' }));
    d.text(S.l('escala de guiado', 'guidance scale'), X(2), pl.y + pl.h + 4 * k, { size: fz(S, 11), color: p.mute, align: 'center', base: 'top' });
    d.polyline(stats.map((st, i) => [X(GUIDE_VALUES[i]), Y(st.circles)] as [number, number]), p.ink, 2.4);
    d.polyline(stats.map((st, i) => [X(GUIDE_VALUES[i]), Y(st.combos)] as [number, number]), p.ink2, 2, { dash: [5, 4] });
    d.line(X(sNow), pl.y, X(sNow), pl.y + pl.h, p.mute, 1.2, [2, 3]);
    const last = stats[stats.length - 1];
    d.text(S.l('círculos', 'circles'), X(8), Y(last.circles) - 8 * k, { size: fz(S, 11.5), weight: 700, color: p.ink, align: 'right', base: 'bottom', halo: p.stage });
    d.text(S.l('combinaciones', 'combinations'), X(8), Y(last.combos) + 6 * k, { size: fz(S, 11.5), weight: 700, color: p.ink2, align: 'right', base: 'top', halo: p.stage });
  });
}

