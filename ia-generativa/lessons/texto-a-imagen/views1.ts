// Primeras vistas: el gancho y el recuerdo de la difusión, el mundo de juguete, las dos piezas de CLIP,
// la tabla de similitudes con su entrenamiento real y el mapa de imágenes y frases.
import { alpha, clamp, inset, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DEMO, GALLERY, MAP } from './model';
import { ES_SHAPE, EN_SHAPE, ES_COLOR, EN_COLOR, T, caption, decodeStep, dot, generate, textVec } from './nn';
import { CLIP_STEPS, UNCOND_SEEDS, clipLoss, clipSims } from './state';
import { TOY_TONES, counter, fitText, flow, fr, fz, isShort, kk, label, netBox, promptBox, toyImage, vecBars } from './toy';

const area = (S: Frame): Rect => inset(S.full(), 14 * S.u, 14 * S.u, 12 * S.u, 14 * S.u);
const neg = (S: Frame, x: number, d = 2) => S.n(x, d).replace('-', '−');

// ═════════ gancho y recuerdo ═════════
export function drawIntro(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const out = fr(S, 'recall', 0, 0.12);
  // el prompt del gancho y el marco vacío
  const big = P ? Math.min(R.w * 0.5, R.h * 0.34) : Math.min(R.h * 0.5, R.w * 0.28);
  const fx0 = P ? R.x + R.w / 2 - big / 2 : R.x + R.w * 0.64, fy0 = P ? R.y + R.h * 0.36 : R.y + R.h * 0.4 - big / 2;
  if (out < 0.99) {
    const a = 1 - out, pw = P ? R.w * 0.86 : R.w * 0.42;
    const pb = promptBox(S, S.l('un gato astronauta', 'an astronaut cat'), P ? R.x + R.w / 2 : R.x + R.w * 0.27, P ? R.y + R.h * 0.08 : R.y + R.h * 0.4 - 24 * k, pw, { a: a * fr(S, 'hook', 0, 0.06), typed: fr(S, 'hook', 0.04, 0.3, 'lin'), size: fz(S, 18), label: S.l('lo que escribes', 'what you type') });
    const ar = fr(S, 'hook', 0.34, 0.48);
    if (P) flow(S, R.x + R.w / 2, pb.y + pb.h + 8 * k, R.x + R.w / 2, fy0 - 10 * k, ar, { a });
    else flow(S, pb.x + pb.w + 10 * k, pb.y + pb.h / 2, fx0 - 12 * k, pb.y + pb.h / 2, ar, { a });
    const fa = fr(S, 'hook', 0.44, 0.56) * a;
    if (fa > 0.01) d.withAlpha(fa, () => {
      d.rect(fx0, fy0, big, big, { fill: alpha(p.surface, 0.6), stroke: p.lineStrong, lw: 1.5, dash: [6, 5], r: 4 });
      d.text('?', fx0 + big / 2, fy0 + big / 2, { size: fz(S, 44), weight: 800, color: p.mute, align: 'center', base: 'middle' });
      label(S, S.l('una imagen que nadie dibujó', 'an image nobody drew'), fx0 + big / 2, fy0 + big + 8 * k, { size: fz(S, 13) });
    });
    const sc = Math.max(2, Math.round(2.3 * S.u));
    neu(S, P ? fx0 + big + 8 * k : fx0 + big + 22 * k, fy0 + big * 0.55, { scale: sc, mood: 'think', a: fr(S, 'hook', 0.6, 0.72) * a });
  }
  if (!S.on('recall')) return;
  // la difusión de la lección 17: de ruido a imagen, sin frase
  const n = UNCOND_SEEDS.length, cols = P ? 3 : 6, rows = Math.ceil(n / cols), gap = 14 * k;
  const gy = R.y + (P ? R.h * 0.34 : isShort(S) ? R.h * 0.12 : R.h * 0.4), labH = 34 * k;
  const cell = Math.min((R.w - (cols - 1) * gap) / cols * (P ? 0.82 : 0.86), (R.h * (P ? 0.6 : 0.5) - (rows - 1) * gap) / rows, (R.y + R.h - gy - labH - (rows - 1) * (gap + 20 * k)) / rows);
  const gw = cols * cell + (cols - 1) * gap, gx = R.x + (R.w - gw) / 2;
  const slot = (i: number) => ({ x: gx + (i % cols) * (cell + gap), y: gy + Math.floor(i / cols) * (cell + gap + 20 * k) });
  const bigS = P ? Math.min(R.w * 0.56, R.h * 0.4) : Math.min(R.h * 0.56, R.w * 0.32);
  const bx = R.x + R.w / 2 - bigS / 2, by = R.y + (P ? R.h * 0.12 : R.h * 0.1);
  const kStep = Math.round(T * fr(S, 'recall', 0.12, 0.5, 'lin'));
  const mv = fr(S, 'recall', 0.54, 0.66, 'io'), s0 = slot(0);
  const x = lerp(bx, s0.x, mv), y = lerp(by, s0.y, mv), sz = lerp(bigS, cell, mv);
  const a0 = fr(S, 'recall', 0.06, 0.14);
  toyImage(S, x, y, sz, null, { probs: decodeStep('', 0, UNCOND_SEEDS[0], kStep), probsKey: `u${UNCOND_SEEDS[0]}-${kStep}`, a: a0 });
  if (mv < 0.98) label(S, S.l(`paso ${kStep} de ${T}`, `step ${kStep} of ${T}`), x + sz / 2, y + sz + 8 * k, { a: a0 * (1 - mv), size: fz(S, 13), weight: 700 });
  for (let i = 1; i < n; i++) {
    const a = fr(S, 'recall', 0.64 + i * 0.04, 0.7 + i * 0.04), s = slot(i);
    toyImage(S, s.x, s.y, cell, generate('', 0, UNCOND_SEEDS[i]).img, { a });
  }
  const ca = fr(S, 'recall', 0.82, 0.92);
  label(S, S.l('sin decirle qué queremos: cualquier figura, cualquier color', 'without saying what we want: any shape, any color'), R.x + R.w / 2, gy + rows * (cell + gap + 20 * k) - gap + 4 * k, { a: ca, size: fz(S, 13), w: R.w * 0.9 });
}

// ═════════ el mundo de juguete ═════════
export function drawWorld(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const pairs = fr(S, 'pairs', 0.08, 0.3);
  const head = fr(S, 'pairs', 0.6, 0.75);
  const topPad = 26 * k * (P ? 1 : 0.6);
  // cuatro imágenes de verdad (de la galería), una por forma
  const n = 4, cols = P ? 2 : 4, gap = (P ? 18 : 22) * k;
  const capH = (P ? 46 : 52) * k;
  const swH = 56 * k;
  const availH = R.h - swH - topPad - 10 * k;
  const rows = n / cols;
  const size = Math.min((R.w * (P ? 0.8 : 0.9) - (cols - 1) * gap) / cols, (availH - rows * capH - (rows - 1) * gap) / rows);
  const cellW = Math.max(size, P ? (R.w - gap) / 2 : (R.w - 3 * gap) / 4 * 0.98);
  const blockH = topPad + rows * (size + capH) + (rows - 1) * gap + 10 * k + swH;
  const gw = cols * cellW + (cols - 1) * gap, gx = R.x + (R.w - gw) / 2, gy = R.y + topPad + Math.max(0, (R.h - blockH) / 2);
  const names = S.lang === 'es' ? ES_SHAPE : EN_SHAPE;
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const cx = gx + c * (cellW + gap) + cellW / 2, y = gy + r * (size + capH + gap);
    const a = fr(S, 'world', 0.38 + i * 0.1, 0.46 + i * 0.1);
    const combo = GALLERY.combos[i] as number[];
    toyImage(S, cx - size / 2, y, size, GALLERY.imgs[i], { a, grid: i === 0 ? fr(S, 'world', 0.12, 0.25) * (1 - fr(S, 'colors', 0, 0.2)) : 0 });
    if (i === 0) {
      const ga = fr(S, 'world', 0.12, 0.25) * (1 - fr(S, 'colors', 0, 0.2));
      if (ga > 0.01) label(S, S.l('12 × 12 píxeles', '12 × 12 pixels'), cx, y - 6 * k, { a: ga, base: 'bottom', weight: 700 });
    }
    label(S, names[combo[0]], cx, y + size + 8 * k, { a: a * (1 - pairs), size: fz(S, 14), weight: 700, color: p.ink });
    if (pairs > 0.01) {
      const ft = fitText(S, caption(combo[0], combo[1], combo[2], S.lang), cellW, fz(S, 13), { lines: 2, font: 'mono' });
      ft.lines.forEach((ln, j) => d.text(ln, cx, y + size + 8 * k + j * ft.size * S.u * 1.25, { size: ft.size, font: 'mono', weight: 600, color: p.ink, align: 'center', base: 'top', a: pairs }));
    }
  }
  if (head > 0.01) label(S, S.l('datos de entrenamiento: imagen + frase', 'training data: image + sentence'), R.x + R.w / 2, gy - topPad, { a: head, weight: 700, size: fz(S, 13), color: p.ink });
  // los cinco colores
  const cn = S.lang === 'es' ? ES_COLOR : EN_COLOR, sw = Math.min(R.w / 5, 120 * k), sx = R.x + (R.w - 5 * sw) / 2, sq = 20 * k;
  const sy = Math.min(R.y + R.h - swH + 6 * k, gy + rows * (size + capH + gap) + 10 * k);
  for (let i = 0; i < 5; i++) {
    const a = fr(S, 'colors', 0.28 + i * 0.12, 0.36 + i * 0.12);
    if (a < 0.01) continue;
    const cx = sx + i * sw + sw / 2;
    d.rect(cx - sq / 2, sy, sq, sq, { fill: tone(S, TOY_TONES[i]).c, stroke: p.lineStrong, lw: 1, a });
    label(S, cn[i], cx, sy + sq + 5 * k, { a, size: fz(S, 13), color: p.ink });
  }
}

// ═════════ las dos piezas de CLIP ═════════
function encGeom(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S);
  const sh = isShort(S);
  const W = sh ? R.w * 0.7 : Math.min(R.w, 860 * S.u), x0 = sh ? R.x : R.x + (R.w - W) / 2;
  const inW = W * (P ? 0.3 : 0.26), gA = W * 0.07, boxW = W * (P ? 0.24 : 0.22), barW = W - inW - boxW - 2 * gA;
  const laneH = Math.min(R.h * (P ? 0.2 : sh ? 0.36 : 0.26), inW * 0.9, 150 * k);
  const yI = R.y + R.h * (P ? 0.17 : sh ? 0.24 : 0.2), yT = R.y + R.h * (P ? 0.47 : sh ? 0.72 : 0.52);
  return { R, P, k, sh, x0, W, inW, gA, boxW, barW, laneH, yI, yT, xBox: x0 + inW + gA, xBar: x0 + inW + 2 * gA + boxW };
}
export function drawEnc(S: Frame) {
  const g = encGeom(S), { k } = g, p = S.pal, d = S.d;
  const combo = GALLERY.combos[0] as number[], cap = caption(combo[0], combo[1], combo[2], S.lang);
  const tv = textVec(cap), iv = GALLERY.emb[0] as number[];
  const bh = g.laneH * 0.62, boxH = g.laneH * 0.72;
  // carril de la imagen
  const ia = fr(S, 'img-enc', 0.28, 0.38), isz = Math.min(g.laneH, g.inW * 0.62);
  toyImage(S, g.x0 + g.inW / 2 - isz / 2, g.yI - isz / 2, isz, GALLERY.imgs[0], { a: ia });
  flow(S, g.x0 + g.inW / 2 + isz / 2 + 6 * k, g.yI, g.xBox - 4 * k, g.yI, fr(S, 'img-enc', 0.36, 0.46));
  netBox(S, { x: g.xBox, y: g.yI - boxH / 2, w: g.boxW, h: boxH }, S.l('codificador de imágenes', 'image encoder'), { a: fr(S, 'img-enc', 0.4, 0.5), hl: S.between('img-enc', 'txt-enc') ? 1 : 0 });
  flow(S, g.xBox + g.boxW + 4 * k, g.yI, g.xBar - 6 * k, g.yI, fr(S, 'img-enc', 0.5, 0.58));
  vecBars(S, { x: g.xBar, y: g.yI - bh / 2, w: g.barW, h: bh }, iv, { a: fr(S, 'img-enc', 0.55, 0.62), show: fr(S, 'img-enc', 0.58, 0.85, 'lin') });
  label(S, S.l('32 números', '32 numbers'), g.xBar + g.barW / 2, g.yI - bh / 2 - 8 * k, { a: fr(S, 'img-enc', 0.8, 0.9), base: 'bottom', weight: 700 });
  // carril del texto
  const ta = fr(S, 'numbers', 0.12, 0.25);
  promptBox(S, cap, g.x0 + g.inW / 2, g.yT - 30 * k, g.inW, { a: ta, lines: 3, size: fz(S, 13) });
  const ph = fr(S, 'numbers', 0.5, 0.62) * (1 - fr(S, 'txt-enc', 0.55, 0.65));
  if (ph > 0.01) d.withAlpha(ph, () => {
    d.rect(g.xBar, g.yT - bh / 2, g.barW, bh, { stroke: p.lineStrong, lw: 1.5, dash: [5, 4], r: 3 });
    d.text('?', g.xBar + g.barW / 2, g.yT, { size: fz(S, 26), weight: 800, color: p.mute, align: 'center', base: 'middle' });
    label(S, S.l('un vector que describa la imagen', 'a vector that describes the image'), g.xBar + g.barW / 2, g.yT + bh / 2 + 8 * k, { w: g.barW + g.gA });
  });
  flow(S, g.x0 + g.inW + 4 * k, g.yT, g.xBox - 4 * k, g.yT, fr(S, 'txt-enc', 0.3, 0.4));
  netBox(S, { x: g.xBox, y: g.yT - boxH / 2, w: g.boxW, h: boxH }, S.l('codificador de texto', 'text encoder'), { a: fr(S, 'txt-enc', 0.3, 0.4), hl: S.between('txt-enc', 'cosine') ? 1 : 0 });
  flow(S, g.xBox + g.boxW + 4 * k, g.yT, g.xBar - 6 * k, g.yT, fr(S, 'txt-enc', 0.45, 0.55));
  vecBars(S, { x: g.xBar, y: g.yT - bh / 2, w: g.barW, h: bh }, tv, { a: fr(S, 'txt-enc', 0.55, 0.62), show: fr(S, 'txt-enc', 0.58, 0.85, 'lin') });
  label(S, S.l('32 números', '32 numbers'), g.xBar + g.barW / 2, g.yT - bh / 2 - 8 * k, { a: fr(S, 'txt-enc', 0.8, 0.9), base: 'bottom', weight: 700 });
  // la similitud coseno
  const sim = dot(tv, iv), ca = fr(S, 'cosine', 0.4, 0.55);
  const bxR = g.xBar + g.barW + 10 * k;
  if (ca > 0.01) d.withAlpha(ca, () => {
    d.polyline([[bxR, g.yI], [bxR + 10 * k, g.yI], [bxR + 10 * k, g.yT], [bxR, g.yT]], p.ink, 2);
  });
  const goal = fr(S, 'goal', 0.05, 0.2);
  const other = caption(2, 3, 0, S.lang), simO = dot(textVec(other), iv);
  const name1 = goal > 0.5 ? S.l('similitud con su frase', 'similarity with its sentence') : S.l('similitud coseno', 'cosine similarity');
  const ma = fr(S, 'goal', 0.55, 0.7), meta = S.l('meta: cerca de su frase, lejos de las demás', 'goal: close to its sentence, far from the others');
  if (g.sh) {
    // teléfono en horizontal: las cifras van en una columna a la derecha
    const cx = g.R.x + g.R.w * 0.73, cw = g.R.w * 0.27;
    const h1 = counter(S, cx, g.R.y, cw, name1, neg(S, sim), { a: ca, hl: S.on('cosine') && !S.on('goal') ? 1 : 0, size: fz(S, 18) });
    const h2 = counter(S, cx, g.R.y + h1 + 8 * k, cw, S.l(`con «${other}»`, `with “${other}”`), neg(S, simO), { a: goal, size: fz(S, 18) });
    if (ma > 0.01) label(S, meta, cx + cw / 2, g.R.y + h1 + h2 + 16 * k, { a: ma, weight: 700, color: p.ink, w: cw });
    return;
  }
  const ry = g.yT + g.laneH * 0.6 + 18 * k, cw = Math.min(g.W * (g.P ? 0.48 : 0.3), 260 * k);
  const cx1 = goal > 0.01 ? lerp(g.x0 + g.W / 2 - cw / 2, g.x0 + g.W / 2 - cw - 8 * k, goal) : g.x0 + g.W / 2 - cw / 2;
  const h1 = counter(S, cx1, ry, cw, name1, neg(S, sim), { a: ca, hl: S.on('cosine') && !S.on('goal') ? 1 : 0 });
  const h2 = counter(S, g.x0 + g.W / 2 + 8 * k, ry, cw, S.l(`con «${other}»`, `with “${other}”`), neg(S, simO), { a: goal });
  if (ma > 0.01) label(S, meta, g.x0 + g.W / 2, ry + Math.max(h1, h2) + 12 * k, { a: ma, weight: 700, color: p.ink, size: fz(S, 13), w: g.W });
}

// ═════════ la tabla de similitudes ═════════
function matGeom(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S);
  const [main, aside] = P ? [{ x: R.x, y: R.y, w: R.w, h: R.h * 0.7 }, { x: R.x, y: R.y + R.h * 0.73, w: R.w, h: R.h * 0.27 }]
    : [{ x: R.x, y: R.y, w: R.w * 0.7, h: R.h }, { x: R.x + R.w * 0.73, y: R.y, w: R.w * 0.27, h: R.h }];
  const caps = (DEMO.combos as number[][]).map((c) => caption(c[0], c[1], c[2], S.lang));
  let lw = clamp(main.w * 0.36, 96 * k, 230 * k);
  let fs = fz(S, 13);
  const fits = (w: number, s: number) => caps.map((c) => S.d.wrap(`${c}`, w, { size: s, weight: 600 }).length);
  while (Math.max(...fits(lw, fs)) > 2 && fs > fz(S, 12) + 0.01) fs = Math.max(fz(S, 12), fs - 0.5);
  const nl = Math.max(...fits(lw, fs));
  const cs = Math.min((main.w - lw - 30 * k) / 6, (main.h - 26 * k) / 6.85);
  const th = cs * 0.8;
  const gw = lw + 22 * k + 6 * cs, gx = main.x + (main.w - gw) / 2 + lw + 22 * k, gy = main.y + th + 26 * k;
  return { R, P, k, main, aside, caps, lw, fs, nl, cs, th, gx, gy };
}
export function drawMatrix(S: Frame) {
  const g = matGeom(S), { k, cs, gx, gy } = g, p = S.pal, d = S.d;
  const idx = Math.round(S.p.step ?? 0), M = clipSims(S, S.on('train-demo') ? idx : 0);
  const lo = -0.45, hi = 0.95, ink = p.ink;
  // filas: las seis frases (con su número)
  g.caps.forEach((c, r) => {
    const a = fr(S, 'batch', 0.22 + r * 0.04, 0.3 + r * 0.04), ls = S.d.wrap(c, g.lw, { size: g.fs, weight: 600 }), lh = g.fs * S.u * 1.2;
    const y0 = gy + r * cs + cs / 2 - ((ls.length - 1) * lh) / 2;
    ls.forEach((ln, i) => d.text(ln, gx - 12 * k, y0 + i * lh, { size: g.fs, weight: 600, color: p.ink, align: 'right', base: 'middle', a }));
    d.text(String(r + 1), gx - g.lw - 18 * k, gy + r * cs + cs / 2, { size: fz(S, 12), font: 'mono', weight: 700, color: p.mute, align: 'right', base: 'middle', a });
  });
  // columnas: las seis imágenes
  for (let c = 0; c < 6; c++) {
    const a = fr(S, 'batch', 0.6 + c * 0.04, 0.68 + c * 0.04), ts = g.th * 0.86;
    toyImage(S, gx + c * cs + (cs - ts) / 2, gy - ts - 8 * k, ts, DEMO.imgs[c], { a });
    d.text(String(c + 1), gx + c * cs + cs / 2, gy - ts - 12 * k, { size: fz(S, 12), font: 'mono', weight: 700, color: p.mute, align: 'center', base: 'bottom', a });
  }
  const frameA = fr(S, 'batch', 0.86, 0.96);
  if (frameA > 0.01) d.rect(gx - 1, gy - 1, 6 * cs + 2, 6 * cs + 2, { stroke: p.lineStrong, lw: 1, a: frameA });
  // las casillas (filas = frases, columnas = imágenes)
  const digits = cs / S.u >= 44 ? 2 : 1;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const a = fr(S, 'cells', 0.12 + (r * 6 + c) * 0.009, 0.2 + (r * 6 + c) * 0.009);
    if (a < 0.01) continue;
    const v = M[c][r], q = clamp((v - lo) / (hi - lo)), x = gx + c * cs, y = gy + r * cs;
    d.rect(x + 1, y + 1, cs - 2, cs - 2, { fill: alpha(ink, 0.05 + 0.8 * q), a });
    const ts = digits === 2 ? Math.min(fz(S, 12.5), (cs * 0.3) / S.u) : fz(S, 12);
    if (cs >= S.d.measure('−0.0', { size: ts, font: 'mono', weight: 600 }) + 4) d.text(neg(S, v, digits), x + cs / 2, y + cs / 2, { size: ts, font: 'mono', weight: 600, color: q > 0.55 ? p.stage : p.ink, align: 'center', base: 'middle', a });
  }
  // la diagonal
  for (let i = 0; i < 6; i++) {
    const a = fr(S, 'diag', 0.22 + i * 0.07, 0.3 + i * 0.07);
    if (a > 0.01) d.rect(gx + i * cs + 1.5, gy + i * cs + 1.5, cs - 3, cs - 3, { stroke: ink, lw: 2.6, a });
  }
  // los empujones: ▲ en la diagonal, ▼ en el resto de la fila y la columna uno
  const pushA = fr(S, 'push', 0.25, 0.4) * (1 - fr(S, 'train-demo', 0, 0.1)), downA = fr(S, 'push', 0.55, 0.7) * (1 - fr(S, 'train-demo', 0, 0.1));
  if (pushA > 0.01) for (let i = 0; i < 6; i++) tri(S, gx + i * cs + cs * 0.82, gy + i * cs + cs * 0.2, cs * 0.12, true, pushA);
  if (downA > 0.01) {
    d.rect(gx - 2, gy - 2, 6 * cs + 4, cs + 4, { stroke: ink, lw: 1.6, dash: [4, 3], a: downA });
    d.rect(gx - 2, gy - 2, cs + 4, 6 * cs + 4, { stroke: ink, lw: 1.6, dash: [4, 3], a: downA });
    for (let j = 1; j < 6; j++) { tri(S, gx + j * cs + cs * 0.82, gy + cs * 0.2, cs * 0.12, false, downA); tri(S, gx + cs * 0.82, gy + j * cs + cs * 0.2, cs * 0.12, false, downA); }
  }
  // columna lateral: leyenda, paso y error, CLIP
  const A = g.aside, aw = g.P ? Math.min(A.w * 0.9, 320 * k) : A.w;
  const legA = fr(S, 'cells', 0.5, 0.65) * (1 - fr(S, 'train-demo', 0, 0.1));
  if (legA > 0.01) {
    const lx = A.x + (g.P ? (A.w - aw) / 2 : 0), ly = A.y + (g.P ? 8 * k : A.h * 0.3), lw = aw, lh = 14 * k;
    for (let i = 0; i < 24; i++) d.rect(lx + (i / 24) * lw, ly, lw / 24 + 0.5, lh, { fill: alpha(ink, 0.05 + 0.8 * (i / 23)), a: legA });
    d.rect(lx, ly, lw, lh, { stroke: p.line, lw: 1, a: legA });
    label(S, S.l('menos parecidas', 'less alike'), lx, ly + lh + 5 * k, { a: legA, align: 'left' });
    label(S, S.l('más parecidas', 'more alike'), lx + lw, ly + lh + 5 * k, { a: legA, align: 'right' });
  }
  const conA = fr(S, 'contrastive', 0.3, 0.42) * (1 - fr(S, 'train-demo', 0, 0.1));
  if (conA > 0.01) {
    const lx = A.x + (g.P ? (A.w - aw) / 2 : 0), ly = A.y + (g.P ? 50 * k : A.h * 0.3 + 56 * k);
    label(S, S.l('aprendizaje contrastivo: subir la diagonal, bajar el resto', 'contrastive learning: raise the diagonal, lower the rest'), lx + (g.P ? aw / 2 : 0), ly, { a: conA, align: g.P ? 'center' : 'left', weight: 700, color: p.ink, w: aw });
  }
  const trA = fr(S, 'train-demo', 0.04, 0.12) * (1 - fr(S, 'clip', 0, 0.12));
  if (trA > 0.01) {
    const loss = clipLoss(S, idx);
    if (g.P) {
      const cw = (A.w - 12 * k) / 2;
      counter(S, A.x, A.y + 4 * k, cw, S.l('paso de entrenamiento', 'training step'), S.n(CLIP_STEPS[idx], 0), { a: trA });
      counter(S, A.x + cw + 12 * k, A.y + 4 * k, cw, S.l('error del lote', 'batch error'), S.n(loss, 2), { a: trA, hl: S.on('try-train') ? 1 : 0 });
    } else {
      const h1 = counter(S, A.x, A.y + A.h * 0.18, A.w, S.l('paso de entrenamiento', 'training step'), S.n(CLIP_STEPS[idx], 0), { a: trA });
      counter(S, A.x, A.y + A.h * 0.18 + h1 + 12 * k, A.w, S.l('error del lote', 'batch error'), S.n(loss, 2), { a: trA, hl: S.on('try-train') ? 1 : 0 });
    }
  }
  const cA = fr(S, 'clip', 0.08, 0.2);
  if (cA > 0.01) {
    const cx = A.x, cy = A.y + (g.P ? 4 * k : A.h * 0.16);
    label(S, S.l('CLIP · OpenAI · enero de 2021', 'CLIP · OpenAI · January 2021'), g.P ? A.x + A.w / 2 : cx, cy, { a: cA, align: g.P ? 'center' : 'left', weight: 800, color: p.ink, size: fz(S, 13), w: A.w });
    const cw = g.P ? Math.min(A.w, 300 * k) : A.w;
    counter(S, g.P ? A.x + (A.w - cw) / 2 : cx, cy + 26 * k, cw, S.l('pares de imagen y texto, de internet', 'image-and-text pairs, from the internet'), S.l('≈ 400 000 000', '≈ 400,000,000'), { a: fr(S, 'clip', 0.45, 0.6), size: fz(S, 18) });
  }
}
function tri(S: Frame, x: number, y: number, r: number, up: boolean, a: number) {
  const pts: [number, number][] = up ? [[x - r, y + r * 0.8], [x + r, y + r * 0.8], [x, y - r * 0.8]] : [[x - r, y - r * 0.8], [x + r, y - r * 0.8], [x, y + r * 0.8]];
  S.d.polygon(pts, { fill: S.pal.ink, stroke: S.pal.stage, lw: 1.2, a });
}

// ═════════ el mapa de imágenes y frases ═════════
export function drawMap(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const [main, aside] = P ? [{ x: R.x, y: R.y, w: R.w, h: R.h * 0.78 }, { x: R.x, y: R.y + R.h * 0.8, w: R.w, h: R.h * 0.2 }]
    : [{ x: R.x, y: R.y, w: R.w * 0.72, h: R.h }, { x: R.x + R.w * 0.75, y: R.y, w: R.w * 0.25, h: R.h }];
  const side = Math.min(main.w, main.h), pr = { x: main.x + (main.w - side) / 2, y: main.y + (main.h - side) / 2, w: side, h: side };
  const ts = side * 0.1, m = ts * 0.75 + 6 * k;
  const X = (v: number) => pr.x + m + ((v + 1) / 2) * (pr.w - 2 * m), Y = (v: number) => pr.y + m + ((1 - v) / 2) * (pr.h - 2 * m);
  const imgP = (MAP.img as number[][]).map((q) => [X(q[0]), Y(q[1])] as [number, number]);
  const esP = (MAP.es as number[][]).map((q) => [X(q[0]), Y(q[1])] as [number, number]);
  const enP = (MAP.en as number[][]).map((q) => [X(q[0]), Y(q[1])] as [number, number]);
  // miniaturas sin encimarse: se separan un poco de su punto (determinista) y una línea fina las une
  const pos = imgP.map((q) => [q[0], q[1]] as [number, number]);
  for (let it = 0; it < 60; it++) for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) {
    const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], dd = Math.hypot(dx, dy) || 0.01, need = ts * 1.18;
    if (dd < need) { const push = (need - dd) / 2, ux = dx / dd, uy = dy / dd; pos[i][0] -= ux * push; pos[i][1] -= uy * push; pos[j][0] += ux * push; pos[j][1] += uy * push; }
  }
  pos.forEach((q) => { q[0] = clamp(q[0], pr.x + ts / 2, pr.x + pr.w - ts / 2); q[1] = clamp(q[1], pr.y + ts / 2, pr.y + pr.h - ts / 2); });
  d.rect(pr.x, pr.y, pr.w, pr.h, { stroke: p.line, lw: 1, a: fr(S, 'map', 0.02, 0.1) });
  const la = fr(S, 'map', 0.45, 0.6), ea = fr(S, 'map', 0.68, 0.82);
  for (let i = 0; i < imgP.length; i++) {
    if (la > 0.01) d.line(imgP[i][0], imgP[i][1], esP[i][0], esP[i][1], p.mute, 1.2, undefined, la * 0.8);
    if (ea > 0.01) d.line(esP[i][0], esP[i][1], enP[i][0], enP[i][1], p.mute, 1.2, [3, 3], ea * 0.8);
  }
  for (let i = 0; i < imgP.length; i++) {
    const a = fr(S, 'map', 0.1 + i * 0.022, 0.16 + i * 0.022);
    if (a < 0.01) continue;
    d.circle(imgP[i][0], imgP[i][1], 2.5 * k, { fill: p.ink2, a });
    if (Math.hypot(pos[i][0] - imgP[i][0], pos[i][1] - imgP[i][1]) > 2) d.line(imgP[i][0], imgP[i][1], pos[i][0], pos[i][1], p.ink2, 1, undefined, a);
    toyImage(S, pos[i][0] - ts / 2, pos[i][1] - ts / 2, ts, GALLERY.imgs[i], { a });
  }
  for (let i = 0; i < esP.length; i++) {
    if (la > 0.01) d.circle(esP[i][0], esP[i][1], 4.5 * k, { fill: p.ink, stroke: p.stage, lw: 1.5, a: la });
    if (ea > 0.01) diamond(S, enP[i][0], enP[i][1], 5.5 * k, ea);
  }
  // leyenda
  const items: [string, number][] = [[S.l('imagen', 'image'), fr(S, 'map', 0.1, 0.2)], [S.l('frase en español', 'Spanish sentence'), la], [S.l('frase en inglés', 'English sentence'), ea]];
  const rowH = 26 * k;
  items.forEach(([t, a], i) => {
    if (a < 0.01) return;
    const x = P ? aside.x + (i * aside.w) / 3 : aside.x, y = P ? aside.y + 10 * k : aside.y + aside.h * 0.3 + i * rowH;
    if (i === 0) toyImage(S, x, y - 8 * k, 16 * k, GALLERY.imgs[0], { a });
    if (i === 1) d.circle(x + 8 * k, y, 4.5 * k, { fill: p.ink, a });
    if (i === 2) diamond(S, x + 8 * k, y, 5.5 * k, a);
    label(S, t, x + 24 * k, y, { a, align: 'left', base: 'middle', w: P ? aside.w / 3 - 26 * k : aside.w - 26 * k });
  });
  const na = fr(S, 'map', 0.85, 0.95);
  label(S, S.l('proyección a dos dimensiones: aproximada', 'projection to two dimensions: approximate'), P ? aside.x + aside.w / 2 : aside.x, P ? aside.y + 40 * k : aside.y + aside.h * 0.3 + 3 * rowH + 6 * k, { a: na, align: P ? 'center' : 'left', italic: true, color: p.mute, w: aside.w });
}
function diamond(S: Frame, x: number, y: number, r: number, a: number) {
  S.d.polygon([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], { fill: S.pal.stage, stroke: S.pal.ink, lw: 2, a });
}
