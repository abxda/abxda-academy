// Últimas vistas: los límites (sesgo amplificado, lo nunca visto, quién va con quién, lo que nunca vio), derechos,
// suplantación y procedencia, el resumen y el puente. Las imágenes y los números de los límites se calculan aquí con el
// modelo real; el estudio de 2023 y la credencial de contenido son rótulos con su fuente (la credencial es un esquema).
import { alpha, clamp, inset, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SWAP } from './model';
import { T, caption, decodeStep, dot, encodeBag, encodeText, generate, tokens, VOCAB } from './nn';
import { GEN_SCALE, LIMIT_SEEDS, NEVER_SEEDS, SEEN_RATE, UNSEEN_BAD, UNSEEN_OK, UNSEEN_RATE, dataColors, guideStats, neverPrompt } from './state';
import { TOY_TONES, counter, fitText, flow, fr, fz, isShort, kk, label, netBox, promptBox, toyImage, vecBars, verdict } from './toy';

const area = (S: Frame): Rect => inset(S.full(), 14 * S.u, 14 * S.u, 12 * S.u, 14 * S.u);
const pct = (S: Frame, f: number) => `${S.n(f * 100, 0)}${S.lang === 'es' ? ' %' : '%'}`;

// ═════════ sesgo ═════════
/** Barra apilada al 100 %: cada tramo con su color del juguete (y gris neutro para «sin figura»). */
function stackBar(S: Frame, r: Rect, parts: number[], a: number) {
  const tot = parts.reduce((s, x) => s + x, 0) || 1, d = S.d;
  let x = r.x;
  const order = [1, 0, 2, 3, 4, 5];   // magenta primero: es el color del que se habla
  d.withAlpha(a, () => {
    order.forEach((ci) => {
      const w = (parts[ci] / tot) * r.w; if (w <= 0.2) return;
      d.rect(x, r.y, w, r.h, { fill: ci < 5 ? tone(S, TOY_TONES[ci]).c : S.pal.surface2 });
      x += w;
    });
    d.rect(r.x, r.y, r.w, r.h, { stroke: S.pal.lineStrong, lw: 1 });
  });
}
export function drawBias(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const dc = dataColors(0), s1 = guideStats(S, 1), s3 = guideStats(S, 3);
  const rows: [string, number[], string, number][] = [
    [S.l('datos: color de los círculos', 'data: color of the circles'), [...dc, 0], S.l('2 de cada 3 magenta', '2 in 3 magenta'), fr(S, 'bias', 0.45, 0.6)],
    [S.l('modelo, escala 1 («círculo»)', 'model, scale 1 (“circle”)'), s1.fg, S.l(`${s1.fg[1]} de 24 magenta`, `${s1.fg[1]} of 24 magenta`), fr(S, 'bias-amp', 0.08, 0.22)],
    [S.l('modelo, escala 3 («círculo»)', 'model, scale 3 (“circle”)'), s3.fg, S.l(`${s3.fg[1]} de 24 magenta`, `${s3.fg[1]} of 24 magenta`), fr(S, 'bias-amp', 0.5, 0.64)],
  ];
  const sh = isShort(S), BW = sh ? R.w * 0.6 : R.w;   // en horizontal bajo, las barras a la izquierda y el estudio a la derecha
  const top = R.y + (P ? 6 : 10) * k, rowH = Math.min(66 * k, R.h * (sh ? 0.24 : 0.15));
  const rowStep = P ? 52 * k : rowH + 10 * k, barH = P ? 18 * k : Math.min(26 * k, rowH * 0.5);
  const lw = P ? 0 : Math.min(BW * 0.34, 260 * k), bx = R.x + lw + (P ? 0 : 14 * k), bw = BW - lw - (P ? 0 : 14 * k) - (P ? 0 : (sh ? 112 : 150) * k);
  label(S, S.l('sesgo puesto a propósito en los datos de juguete', 'bias planted on purpose in the toy data'), R.x + BW / 2, top, { a: fr(S, 'bias', 0.2, 0.32), weight: 700, color: p.ink, size: fz(S, 13), w: BW });
  rows.forEach(([nm, parts, val, a], i) => {
    if (a < 0.01) return;
    const y = top + 30 * k + i * rowStep;
    if (P) {
      label(S, nm, R.x, y, { a, align: 'left', weight: 700, color: p.ink });
      stackBar(S, { x: R.x, y: y + 20 * k, w: R.w * 0.58, h: barH }, parts, a);
      label(S, val, R.x + R.w * 0.58 + 8 * k, y + 20 * k + barH / 2, { a, align: 'left', base: 'middle', weight: 800, color: p.ink, w: R.w * 0.4 });
    } else {
      const ft = fitText(S, nm, lw, fz(S, 13), { lines: 2, weight: 700 });
      ft.lines.forEach((ln, j) => d.text(ln, R.x + lw, y + barH / 2 - ((ft.lines.length - 1) * ft.size * S.u * 1.2) / 2 + j * ft.size * S.u * 1.2, { size: ft.size, weight: 700, color: p.ink, align: 'right', base: 'middle', a }));
      stackBar(S, { x: bx, y, w: bw, h: barH }, parts, a);
      label(S, val, bx + bw + 10 * k, y + barH / 2, { a, align: 'left', base: 'middle', weight: 800, color: p.ink, w: (sh ? 104 : 145) * k });
    }
  });
  // el estudio de 2023 (cifras del artículo; no son imágenes de la escena)
  const ra = fr(S, 'bias-real', 0.15, 0.3);
  if (ra > 0.01) {
    const cy = sh ? top : top + 30 * k + 3 * rowStep + 4 * k, cw = sh ? R.w - BW - 16 * k : Math.min(R.w, 680 * S.u), cx = sh ? R.x + BW + 16 * k : R.x + (R.w - cw) / 2;
    const P2 = P || sh;
    const tt = S.l('Bianchi y colegas, 2023 · Stable Diffusion · «la cara de un desarrollador de software»', 'Bianchi et al., 2023 · Stable Diffusion · “a photo of the face of a software developer”');
    const th = d.wrap(tt, cw - 24 * k, { size: fz(S, 12), weight: 700 }).length * fz(S, 12) * S.u * 1.3;
    const bh = 14 * k, lw2 = P2 ? 0 : Math.min(250 * k, cw * 0.42), bw2 = cw - 24 * k - lw2 - (P2 ? 0 : 12 * k), step = P2 ? 44 * k : 34 * k;
    let y = cy + 18 * k + th + (P2 ? 18 : 6) * k;
    const items: [string, number, number][] = [[S.l('imágenes generadas: con rasgos blancos', 'generated images: white features'), 0.99, fr(S, 'bias-real', 0.35, 0.5)], [S.l('programadores en EE. UU.: blancos', 'U.S. software developers: white'), 0.56, fr(S, 'bias-real', 0.62, 0.76)]];
    const ch = y - cy + items.length * step - 8 * k;
    d.rect(cx, cy, cw, ch, { fill: alpha(p.surface, 0.8), stroke: p.line, lw: 1, r: 4, a: ra });
    label(S, tt, cx + 12 * k, cy + 10 * k, { a: ra, align: 'left', weight: 700, color: p.ink, w: cw - 24 * k });
    items.forEach(([nm, v, a]) => {
      if (a >= 0.01) {
        if (P2) label(S, `${nm}: ${pct(S, v)}`, cx + 12 * k, y - 4 * k, { a, align: 'left', base: 'bottom', w: cw - 24 * k });
        else label(S, `${nm}: ${pct(S, v)}`, cx + 24 * k + bw2, y + bh / 2, { a, align: 'left', base: 'middle', w: lw2 });
        d.rect(cx + 12 * k, y, bw2, bh, { fill: p.surface2, a });
        d.rect(cx + 12 * k, y, bw2 * v, bh, { fill: p.ink2, a });
      }
      y += step;
    });
  }
}

// ═════════ lo nunca visto ═════════
function strip(S: Frame, r: Rect, combo: [number, number, number], a: number, prog: number, tag: string) {
  const k = kk(S), text = caption(combo[0], combo[1], combo[2], S.lang), P = S.portrait;
  const pw = P ? r.w : r.w * 0.36;
  const pb = promptBox(S, text, r.x + (P ? r.w / 2 : 0), r.y + (P ? 0 : 6 * k), pw, { a, lines: P ? 1 : 3, size: fz(S, 12.5), align: P ? 'center' : 'left' });
  if (a > 0.01) label(S, tag, pb.x + (P ? pb.w / 2 : 0), pb.y + pb.h + 5 * k, { a, align: P ? 'center' : 'left', italic: true, color: S.pal.mute });
  const ix = P ? r.x : r.x + pw + 18 * k, iy = P ? pb.y + pb.h + 26 * k : r.y, iw = P ? r.w : r.w - pw - 18 * k;
  const gap = 12 * k, size = Math.min((iw - 3 * gap) / 4, r.y + r.h - iy - 22 * k);
  const kk2 = Math.round(T * prog);
  LIMIT_SEEDS.forEach((sd, i) => {
    const x = ix + i * (size + gap), g = generate(text, GEN_SCALE, sd);
    if (kk2 >= T) toyImage(S, x, iy, size, g.img, { a });
    else toyImage(S, x, iy, size, null, { probs: decodeStep(text, GEN_SCALE, sd, kk2), probsKey: `l${text}-${sd}-${kk2}`, a });
    const ok = g.read.shape === combo[0] && g.read.fg === combo[1] && g.read.bg === combo[2];
    verdict(S, x + size / 2, iy + size + 12 * k, ok, { a: a * (kk2 >= T ? 1 : 0) });
  });
}
export function drawUnseen(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), p = S.pal;
  const barsH = P ? 74 * k : 0, sideW = P ? 0 : Math.min(R.w * 0.26, 220 * k);
  const mw = R.w - sideW - (P ? 0 : 18 * k), rh = (R.h - barsH - 10 * k) / 2;
  const tag = S.l('nunca vista al entrenar', 'never seen in training');
  strip(S, { x: R.x, y: R.y, w: mw, h: rh - 8 * k }, UNSEEN_OK, fr(S, 'unseen', 0.08, 0.2), fr(S, 'unseen', 0.25, 0.6, 'lin'), tag);
  strip(S, { x: R.x, y: R.y + rh + 4 * k, w: mw, h: rh - 8 * k }, UNSEEN_BAD, fr(S, 'unseen-fail', 0.04, 0.14), fr(S, 'unseen-fail', 0.14, 0.4, 'lin'), tag);
  // las dos tasas medidas
  const ba = fr(S, 'unseen-fail', 0.55, 0.7);
  if (ba > 0.01) {
    const bx = P ? R.x : R.x + mw + 18 * k, by = P ? R.y + R.h - barsH : R.y + R.h * 0.3, bw = P ? R.w : sideW;
    const cw = P ? (bw - 10 * k) / 2 : bw;
    const h1 = counter(S, bx, by, cw, S.l('combinaciones vistas: bien', 'seen combinations: right'), pct(S, SEEN_RATE), { a: ba, size: fz(S, 18) });
    counter(S, P ? bx + cw + 10 * k : bx, P ? by : by + h1 + 10 * k, cw, S.l('nunca vistas: bien', 'never seen: right'), pct(S, UNSEEN_RATE), { a: ba, size: fz(S, 18), hl: 1 });
    if (!P) label(S, S.l('medido: 1 280 imágenes, escala 3', 'measured: 1,280 images, scale 3'), bx, by + 2 * (h1 + 10 * k), { a: ba, align: 'left', italic: true, color: p.mute, w: bw });
  }
}

// ═════════ quién va con quién ═════════
function table2(S: Frame, x: number, y: number, cs: number, M: number[][], title: string, a: number, mark: 'max' | 'eq') {
  const d = S.d, p = S.pal, k = kk(S);
  if (a < 0.01) return;
  label(S, title, x + cs, y - 6 * k, { a, base: 'bottom', weight: 800, color: p.ink, w: cs * 3.2 });
  const hs = cs * 0.62;
  [0, 1].forEach((c) => toyImage(S, x + cs * 0.5 + c * cs + (cs - hs) / 2 - cs * 0.5 + cs * 0.5, y + 2 * k, hs, SWAP.imgs[c], { a }));
  const gy = y + hs + 8 * k;
  [0, 1].forEach((r) => d.text(r === 0 ? 'A' : 'B', x + cs * 0.5 - 8 * k, gy + r * cs + cs / 2, { size: fz(S, 13), font: 'mono', weight: 800, color: p.ink, align: 'right', base: 'middle', a }));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const v = M[c][r], cx = x + cs * 0.5 + c * cs, cy = gy + r * cs;
    const best = mark === 'max' && v >= Math.max(M[c][0], M[c][1]) - 1e-9;
    d.rect(cx + 1, cy + 1, cs - 2, cs - 2, { fill: alpha(p.ink, 0.06 + 0.5 * clamp(v)), stroke: best ? p.ink : p.line, lw: best ? 2.4 : 1, a });
    d.text(S.n(v, 2), cx + cs / 2, cy + cs / 2, { size: Math.min(fz(S, 14), cs * 0.3 / S.u), font: 'mono', weight: 700, color: clamp(v) > 0.6 ? p.stage : p.ink, align: 'center', base: 'middle', a });
  }
  if (mark === 'eq') [0, 1].forEach((c) => d.text('=', x + cs * 0.5 + c * cs + cs / 2, gy + cs, { size: fz(S, 16), weight: 800, color: p.ink, align: 'center', base: 'middle', a, halo: p.stage }));
}
export function drawBinding(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  const caps = (SWAP.combos as number[][]).map((c) => caption(c[0], c[1], c[2], S.lang));
  const I = SWAP.emb as number[][];
  const flat = caps.map((c) => encodeText(tokens(c).ids)), bag = caps.map((c) => encodeBag(tokens(c).ids));
  const Mf = I.map((e) => flat.map((v) => dot(v, e))), Mb = I.map((e) => bag.map((v) => dot(v, e)));
  // las dos imágenes con su frase
  const sh = isShort(S), SIDE = P || sh;   // tablas lado a lado (vertical u horizontal bajo)
  const leftW = P ? R.w : R.w * (sh ? 0.4 : 0.44), isz = Math.min(P ? R.w * 0.22 : leftW * 0.3, R.h * (P ? 0.17 : sh ? 0.3 : 0.28));
  [0, 1].forEach((i) => {
    const a = fr(S, 'binding', 0.22 + i * 0.3, 0.32 + i * 0.3);
    if (a < 0.01) return;
    const x = P ? R.x + i * (R.w / 2) : R.x, y = P ? R.y + 4 * k : R.y + R.h * (sh ? 0.04 : 0.08) + i * (isz + (sh ? 26 : 50) * k);
    d.text(i === 0 ? 'A' : 'B', x, y + isz / 2, { size: fz(S, 16), font: 'mono', weight: 800, color: p.ink, base: 'middle', a });
    toyImage(S, x + 20 * k, y, isz, SWAP.imgs[i], { a });
    const tw = P ? R.w / 2 - 28 * k : leftW - isz - 34 * k;
    const ft = fitText(S, caps[i], P ? R.w / 2 - 12 * k : tw, fz(S, 13), { lines: 3, font: 'mono' });
    const tx = P ? x + 4 * k : x + isz + 32 * k, ty = P ? y + isz + 10 * k : y + isz / 2 - ((ft.lines.length - 1) * ft.size * S.u * 1.25) / 2;
    ft.lines.forEach((ln, j) => d.text(ln, tx, ty + j * ft.size * S.u * 1.25, { size: ft.size, font: 'mono', weight: 600, color: p.ink, base: P ? 'top' : 'middle', a }));
  });
  const sw = fr(S, 'binding', 0.78, 0.9);
  if (sw > 0.01) label(S, S.l('mismas palabras, otro orden', 'same words, different order'), P ? R.x + R.w / 2 : R.x + leftW / 2, P ? R.y + isz + 66 * k : R.y + R.h * (sh ? 0.04 : 0.08) + 2 * (isz + (sh ? 26 : 50) * k) - (sh ? 18 : 30) * k, { a: sw, weight: 700, color: p.ink, w: P ? R.w : leftW });
  // las dos tablas
  const tx0 = P ? R.x : R.x + leftW + 20 * k, tw = P ? R.w : R.w - leftW - 20 * k;
  const cs = Math.min(SIDE ? (tw / 2 - 20 * k) / 2.6 : tw / 3.2, P ? R.h * 0.13 : sh ? (R.h - 70 * k) / 2.8 : R.h * 0.15);
  const ty0 = P ? R.y + isz + 110 * k : R.y + (sh ? 22 : 30) * k;
  table2(S, tx0 + (SIDE ? 0 : (tw - cs * 2.5) / 2), ty0, cs, Mf, S.l('lee el orden', 'reads word order'), fr(S, 'binding-bag', 0.04, 0.16), 'max');
  table2(S, tx0 + (SIDE ? tw / 2 : (tw - cs * 2.5) / 2), SIDE ? ty0 : ty0 + cs * 2.62 + 40 * k, cs, Mb, S.l('bolsa de palabras', 'bag of words'), fr(S, 'binding-bag', 0.4, 0.52), 'eq');
  const na = fr(S, 'binding-bag', 0.25, 0.35);
  if (na > 0.01) label(S, S.l('filas: frases A y B · columnas: imágenes', 'rows: sentences A and B · columns: images'), P ? R.x + R.w / 2 : tx0 + tw / 2, R.y + R.h - (sh ? 2 : 16) * k, { a: na, italic: true, color: p.mute, w: P ? R.w : tw, base: sh ? 'bottom' : 'top' });
}

// ═════════ lo que nunca vio ═════════
export function drawNever(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal, sh = isShort(S);
  const q = neverPrompt(S), words = q.split(' '), known = new Set(VOCAB);
  // en horizontal bajo: el prompt y sus palabras a la izquierda, las imágenes a la derecha
  const LW = sh ? R.w * 0.4 : R.w, LX = R.x + LW / 2;
  const pb = promptBox(S, q, LX, R.y + 6 * k, Math.min(LW, 420 * S.u), { a: fr(S, 'never-saw', 0.04, 0.12), size: fz(S, 16), label: S.l('prompt', 'prompt') });
  // las palabras que entiende y la que no
  const ty = pb.y + pb.h + 22 * k, ta = fr(S, 'never-saw', 0.14, 0.24);
  const sizes = words.map((w) => d.measure(w, { size: fz(S, 14), font: 'mono', weight: 700 }) + 20 * k), tot = sizes.reduce((a, b) => a + b, 0) + (words.length - 1) * 10 * k;
  let x = LX - tot / 2;
  words.forEach((w, i) => {
    const ok = known.has(w), bw = sizes[i], h = 30 * k;
    d.rect(x, ty, bw, h, { fill: ok ? p.surface : p.stage, stroke: ok ? p.ink : p.mute, lw: ok ? 1.8 : 1.4, dash: ok ? undefined : [4, 3], r: 4, a: ta });
    d.text(w, x + bw / 2, ty + h / 2, { size: fz(S, 14), font: 'mono', weight: 700, color: ok ? p.ink : p.mute, align: 'center', base: 'middle', a: ta });
    if (!ok) { d.line(x + 6 * k, ty + h / 2, x + bw - 6 * k, ty + h / 2, p.mute, 2, undefined, ta); label(S, S.l('no está entre sus palabras', 'not one of its words'), x + bw / 2, ty + h + 6 * k, { a: ta, color: p.mute, italic: true }); }
    x += bw + 10 * k;
  });
  // cuatro intentos: una sola figura cada vez
  const IX = sh ? R.x + R.w * 0.44 : R.x, IW = sh ? R.w * 0.56 : R.w;
  const top = sh ? R.y + 8 * k : ty + 30 * k + 40 * k, gap = 14 * k, foot = sh ? 64 * k : 70 * k;
  const size = Math.min((IW * (P || sh ? 0.95 : 0.7) - 3 * gap) / 4, R.y + R.h - top - foot);
  const gw = 4 * size + 3 * gap, gx = IX + (IW - gw) / 2, prog = fr(S, 'never-saw', 0.24, 0.5, 'lin'), kk2 = Math.round(T * prog);
  NEVER_SEEDS.forEach((sd, i) => {
    const a = fr(S, 'never-saw', 0.22, 0.3);
    if (kk2 >= T) toyImage(S, gx + i * (size + gap), top, size, generate(q, GEN_SCALE, sd).img, { a });
    else toyImage(S, gx + i * (size + gap), top, size, null, { probs: decodeStep(q, GEN_SCALE, sd, kk2), probsKey: `n${q}-${sd}-${kk2}`, a });
  });
  const cx = IX + IW / 2;
  label(S, S.l('nunca vio dos figuras juntas: dibuja una', 'it never saw two shapes together: it draws one'), cx, top + size + 8 * k, { a: fr(S, 'never-saw', 0.48, 0.58), weight: 700, color: p.ink, w: IW });
  const la = fr(S, 'never-saw', 0.68, 0.8);
  if (la > 0.01) {
    const by = top + size + (sh ? 34 : 40) * k;
    const t1 = S.l('contar objetos', 'counting objects'), t2 = S.l('escribir texto legible', 'writing legible text');
    const w1 = d.measure(t1, { size: fz(S, 13), weight: 700 }) + 24 * k, w2 = d.measure(t2, { size: fz(S, 13), weight: 700 }) + 24 * k;
    const bx = cx - (w1 + w2 + 12 * k) / 2;
    S.d.tag(t1, bx + w1 / 2, by, { size: fz(S, 13), align: 'center', a: la, weight: 700, fill: p.surface, stroke: p.lineStrong, color: p.ink });
    S.d.tag(t2, bx + w1 + 12 * k + w2 / 2, by, { size: fz(S, 13), align: 'center', a: la, weight: 700, fill: p.surface, stroke: p.lineStrong, color: p.ink });
    label(S, S.l('límites reconocidos en los artículos de CLIP (2021) y DALL·E 2 (2022)', 'limits acknowledged in the CLIP (2021) and DALL·E 2 (2022) papers'), cx, by + 18 * k, { a: la, italic: true, color: p.mute, w: IW });
  }
}

// ═════════ derechos, suplantación y procedencia ═════════
function photoCard(S: Frame, r: Rect, a: number, wm: number) {
  const d = S.d, p = S.pal, k = kk(S);
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5, r: 4 });
    // una persona esquemática (pictograma, no una persona real)
    const cx = r.x + r.w / 2, hy = r.y + r.h * 0.38, hr = r.h * 0.13;
    d.circle(cx, hy, hr, { fill: p.ink2 });
    d.polygon([[cx - r.w * 0.24, r.y + r.h], [cx - r.w * 0.17, hy + hr * 1.6], [cx + r.w * 0.17, hy + hr * 1.6], [cx + r.w * 0.24, r.y + r.h]], { fill: p.ink2 });
    if (wm > 0.01) for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) d.circle(r.x + (i + 0.5) * (r.w / 9), r.y + (j + 0.5) * (r.h / 7), 1.6 * k, { fill: alpha(p.stage, 0.5), a: wm });
  });
}
export function drawRights(S: Frame) {
  const R = area(S), P = S.portrait, k = kk(S), d = S.d, p = S.pal;
  // derechos: de muchas páginas a un gran conjunto de pares
  const out = fr(S, 'impersonation', 0, 0.12);
  if (out < 0.99) {
    const a0 = 1 - out, cols = 3, rows = 3, gw = P ? R.w * 0.8 : R.w * 0.42, cw = gw / cols - 8 * k, ch = Math.min(cw * 0.7, (R.h * (P ? 0.34 : 0.78)) / rows - 8 * k);
    const gx = P ? R.x + (R.w - gw) / 2 : R.x, gy = R.y + (P ? 4 * k : R.h * 0.08);
    for (let i = 0; i < 9; i++) {
      const a = fr(S, 'rights', 0.05 + i * 0.035, 0.12 + i * 0.035) * a0;
      if (a < 0.01) continue;
      const x = gx + (i % cols) * (cw + 8 * k), y = gy + Math.floor(i / cols) * (ch + 8 * k);
      d.rect(x, y, cw, ch, { fill: p.surface, stroke: p.line, lw: 1, r: 3, a });
      const im = Math.min(ch * 0.62, cw * 0.45);
      toyImage(S, x + 6 * k, y + 6 * k, im, generate('', 0, 20 + i).img, { a, frame: false });
      for (let l = 0; l < 3; l++) d.rect(x + im + 12 * k, y + 8 * k + l * 9 * k, (cw - im - 18 * k) * (l === 2 ? 0.6 : 1), 4 * k, { fill: alpha(p.ink, 0.25), a });
      d.rect(x + 6 * k, y + im + 12 * k, cw * 0.5, 4 * k, { fill: alpha(p.ink, 0.25), a });
    }
    label(S, S.l('páginas web: fotos e ilustraciones con autor', 'web pages: photos and illustrations with authors'), gx + gw / 2, gy + rows * (ch + 8 * k) + 2 * k, { a: fr(S, 'rights', 0.3, 0.4) * a0, w: gw });
    const ax = P ? R.x + R.w / 2 : gx + gw + 14 * k, ay = P ? gy + rows * (ch + 8 * k) + 24 * k : gy + rows * (ch + 8 * k) / 2;
    const bxW = P ? R.w * 0.7 : R.w * 0.36, bx = P ? R.x + (R.w - bxW) / 2 : R.x + R.w - bxW, byy = P ? ay + 20 * k : ay - 40 * k;
    if (P) flow(S, ax, ay, ax, byy - 4 * k, fr(S, 'rights', 0.38, 0.5) * a0); else flow(S, ax, ay, bx - 8 * k, ay, fr(S, 'rights', 0.38, 0.5) * a0);
    const ca = fr(S, 'rights', 0.45, 0.58) * a0;
    const chh = counter(S, bx, byy, bxW, S.l('pares de imagen y texto (CLIP)', 'image-and-text pairs (CLIP)'), S.l('≈ 400 000 000', '≈ 400,000,000'), { a: ca, size: fz(S, 18) });
    const qa = fr(S, 'rights', 0.62, 0.74) * a0;
    if (qa > 0.01) {
      S.d.tag(S.l('¿se pueden usar sin permiso?', 'can they be used without permission?'), bx + bxW / 2, byy + chh + 20 * k, { size: fz(S, 13), align: 'center', a: qa, weight: 800, fill: p.surface, stroke: p.ink, color: p.ink });
      label(S, S.l('decenas de demandas pendientes en EE. UU. (Oficina de Derechos de Autor, 2025)', 'dozens of pending lawsuits in the U.S. (Copyright Office, 2025)'), bx + bxW / 2, byy + chh + 36 * k, { a: qa, italic: true, color: p.mute, w: P ? R.w : bxW });
    }
  }
  if (!S.on('impersonation')) return;
  // suplantación: una foto fabricada; procedencia: su credencial
  const ia = fr(S, 'impersonation', 0.1, 0.22);
  const pw = P ? Math.min(R.w * 0.5, R.h * 0.34) : Math.min(R.w * 0.3, R.h * 0.62), ph = pw * 1.15;
  const provOn = fr(S, 'provenance', 0.1, 0.3);
  const pcx = P ? R.x + R.w / 2 : lerp(R.x + R.w / 2, R.x + R.w * 0.27, provOn);
  const pr = { x: pcx - pw / 2, y: R.y + (P ? 6 * k : (R.h - ph) / 2 - 10 * k), w: pw, h: ph };
  photoCard(S, pr, ia, fr(S, 'provenance', 0.45, 0.6));
  const sa = fr(S, 'impersonation', 0.35, 0.48);
  if (sa > 0.01) S.d.tag(S.l('fabricada con una frase', 'made from one sentence'), pr.x + pr.w / 2, pr.y + pr.h + 16 * k, { size: fz(S, 13), align: 'center', a: sa, weight: 800, fill: p.surface, stroke: p.ink, color: p.ink });
  label(S, S.l('persona real · escena que nunca pasó (pictograma)', 'real person · scene that never happened (pictogram)'), pr.x + pr.w / 2, pr.y + pr.h + 34 * k, { a: fr(S, 'impersonation', 0.5, 0.62) * (1 - provOn), italic: true, color: p.mute, w: Math.max(pw * 1.6, 200 * k) });
  if (provOn > 0.01) {
    const cx = P ? R.x : pr.x + pr.w + 30 * k, cy = P ? pr.y + pr.h + 34 * k : pr.y, cw = P ? R.w : R.x + R.w - cx;
    const rows: [string, string][] = [
      [S.l('credencial de contenido (C2PA)', 'content credential (C2PA)'), ''],
      [S.l('herramienta', 'tool'), S.l('generador de imágenes', 'image generator')],
      [S.l('¿intervino una IA?', 'was AI involved?'), S.l('sí', 'yes')],
      [S.l('firma digital', 'digital signature'), S.l('válida', 'valid')],
    ];
    const rh = 30 * k;
    d.rect(cx, cy, cw, rows.length * rh + 14 * k, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4, a: provOn });
    rows.forEach(([kq, v], i) => {
      const a = fr(S, 'provenance', 0.2 + i * 0.08, 0.28 + i * 0.08);
      const y = cy + 8 * k + i * rh + rh / 2;
      if (i === 0) { label(S, kq, cx + 12 * k, y, { a, align: 'left', base: 'middle', weight: 800, color: p.ink, w: cw - 24 * k }); return; }
      label(S, kq, cx + 12 * k, y, { a, align: 'left', base: 'middle', w: cw * 0.5 });
      label(S, v, cx + cw - 12 * k, y, { a, align: 'right', base: 'middle', weight: 800, color: p.ink });
    });
    const wa = fr(S, 'provenance', 0.45, 0.6);
    label(S, S.l('+ marca de agua invisible en los píxeles', '+ invisible watermark in the pixels'), cx + (P ? cw / 2 : 0), cy + rows.length * rh + 26 * k, { a: wa, align: P ? 'center' : 'left', weight: 700, color: p.ink, w: cw });
    label(S, S.l('esquema', 'diagram'), cx + (P ? cw / 2 : 0), cy + rows.length * rh + 46 * k, { a: wa, align: P ? 'center' : 'left', italic: true, color: p.mute });
  }
  const nu = Math.max(2, Math.round(2.2 * S.u));
  if (!P) neu(S, R.x + R.w - 18 * nu, R.y + 4 * k, { scale: nu, mood: 'sad', a: fr(S, 'impersonation', 0.55, 0.65) * (1 - provOn) });
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame) {
  const R = area(S), k = kk(S), d = S.d, p = S.pal, P = S.portrait;
  const items = [
    S.l('CLIP pone imágenes y frases en un mismo espacio', 'CLIP puts images and sentences in one space'),
    S.l('el vector de la frase condiciona la difusión', 'the sentence vector conditions diffusion'),
    S.l('la escala de guiado: fidelidad o variedad', 'the guidance scale: faithfulness or variety'),
  ];
  const rh = Math.min(R.h / 3.4, 110 * k), ic = Math.min(rh * 0.7, 80 * k), x0 = R.x + (P ? 0 : R.w * 0.12), y0 = R.y + (R.h - 3 * rh) / 2;
  items.forEach((t, i) => {
    const a = fr(S, 'recap', 0.08 + i * 0.28, 0.18 + i * 0.28), y = y0 + i * rh + (rh - ic) / 2;
    if (a < 0.01) return;
    d.withAlpha(a, () => {
      if (i === 0) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) d.rect(x0 + c * ic / 3 + 1, y + r * ic / 3 + 1, ic / 3 - 2, ic / 3 - 2, { fill: alpha(p.ink, r === c ? 0.85 : 0.1) });
      if (i === 1) { vecBars(S, { x: x0, y: y + ic * 0.1, w: ic * 0.45, h: ic * 0.35 }, [0.4, -0.2, 0.7, 0.1, -0.5, 0.3, 0.6, -0.1], { frame: false }); flow(S, x0 + ic * 0.5, y + ic * 0.3, x0 + ic * 0.62, y + ic * 0.55, 1); netBox(S, { x: x0 + ic * 0.3, y: y + ic * 0.55, w: ic * 0.7, h: ic * 0.42 }, '', {}); }
      if (i === 2) { d.line(x0, y + ic / 2, x0 + ic, y + ic / 2, p.lineStrong, 3); d.circle(x0 + ic * 0.4, y + ic / 2, 8 * k, { fill: p.ink }); }
    });
    label(S, t, x0 + ic + 18 * k, y + ic / 2, { a, align: 'left', base: 'middle', weight: 700, color: p.ink, size: fz(S, 16), w: R.x + R.w - x0 - ic - 24 * k });
  });
}
export function drawBridge(S: Frame) {
  const R = area(S), k = kk(S), d = S.d, p = S.pal;
  const a1 = fr(S, 'bridge', 0.05, 0.18), a2 = fr(S, 'bridge', 0.35, 0.5), a3 = fr(S, 'bridge', 0.62, 0.76);
  label(S, S.l('aquí: texto → imagen', 'here: text → image'), R.x + R.w / 2, R.y + R.h * 0.18, { a: a1, size: fz(S, 16), weight: 700 });
  const sent = S.l('El gato se sentó en la', 'The cat sat on the'), sz = fz(S, 20);
  const w = d.measure(sent, { size: sz, font: 'mono', weight: 700 }), bx = R.x + (R.w - w - 40 * k) / 2, by = R.y + R.h * 0.44;
  if (a2 > 0.01) {
    d.text(sent, bx, by, { size: sz, font: 'mono', weight: 700, color: p.ink, base: 'middle', a: a2 });
    const blink = Math.sin(S.clock * 5) > -0.3 ? 1 : 0.35;
    d.rect(bx + w + 10 * k, by - 14 * k, 28 * k, 28 * k, { stroke: p.ink, lw: 2, dash: [4, 3], a: a2 * blink });
    d.text('?', bx + w + 24 * k, by, { size: fz(S, 16), weight: 800, color: p.ink, align: 'center', base: 'middle', a: a2 });
  }
  label(S, S.l('lección 19: predecir la siguiente palabra', 'lesson 19: predicting the next word'), R.x + R.w / 2, R.y + R.h * 0.64, { a: a3, size: fz(S, 16), weight: 800, color: p.ink, w: R.w });
  const sc = Math.max(2, Math.round(2.4 * S.u));
  neu(S, R.x + R.w / 2 - 8 * sc, R.y + R.h * 0.74, { scale: sc, mood: 'happy', a: a3 });
}

