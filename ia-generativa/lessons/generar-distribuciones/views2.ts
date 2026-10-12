// Vistas del autocodificador: el diagrama pieza por pieza, el entrenamiento, el plano latente (paseo incluido) y sus huecos.
import { Plot, alpha, badge, clamp, hash, inset, lerp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import * as L from './latent';
import { axisX, axisY, digit, digTone, fr, fs, kk, lut, mark, readout, textUp, tileLayout } from './helpers';
import { CROWD, EX, HOLES, JUNK, MED_AE, PATH, explorerZ, stOf, type P2 } from './state';

const EX_Z = L.encAE(L.img(EX)), EX_REC = L.decAE(EX_Z[0], EX_Z[1]);
const EX_SSE = (() => { const x = L.img(EX); let s = 0; for (let j = 0; j < 64; j++) s += (x[j] - EX_REC[j]) ** 2; return s; })();

// ═════════════════════════════════════════════════════════════════════════
// 5 · el autocodificador, pieza por pieza
// ═════════════════════════════════════════════════════════════════════════
interface AeLay { img: Rect; enc: Rect; code: Rect; dec: Rect; out: Rect; err: Rect; cell: number; hor: boolean; R: Rect }
function aeLay(S: Frame): AeLay {
  const u = S.u, k = kk(S), R = inset(S.full(), 14 * u, 14 * u);
  if (!S.portrait) {
    const low = R.h < 260;
    const cell = Math.max(4, Math.min(9, Math.floor(R.h * (low ? 0.26 : 0.24) / 8))), im = 8 * cell, cy = R.y + R.h * (low ? 0.42 : 0.4), bh = Math.min(116 * k, R.h * 0.36);
    const encW = R.w * 0.16, codeW = Math.max(R.w * 0.17, 128 * k), gap = (R.w - 2 * im - 2 * encW - codeW) / 4;
    const x1 = R.x, x2 = x1 + im + gap, x3 = x2 + encW + gap, x4 = x3 + codeW + gap, x5 = x4 + encW + gap, ch = Math.max(56 * k, bh * 0.62);
    const eCell = Math.max(3, Math.floor(cell * 0.75));
    return { hor: true, R, cell, img: { x: x1, y: cy - im / 2, w: im, h: im }, enc: { x: x2, y: cy - bh / 2, w: encW, h: bh }, code: { x: x3, y: cy - ch / 2, w: codeW, h: ch }, dec: { x: x4, y: cy - bh / 2, w: encW, h: bh }, out: { x: x5, y: cy - im / 2, w: im, h: im }, err: { x: x5 + (im - 8 * eCell) / 2, y: cy + im / 2 + (low ? 30 : 46) * k, w: 8 * eCell, h: 8 * eCell } };
  }
  // vertical: una columna (imagen → codificador → código → decodificador → reconstrucción); rótulos a la derecha
  const cell = R.h < 380 ? 4 : 5, im = 8 * cell, cx = R.x + R.w * 0.34, bh = 32 * k, bw = Math.min(170 * k, R.w * 0.46), codeH = 46 * k, codeW = Math.min(132 * k, R.w * 0.44);
  const gap = clamp((R.h - 70 * k - im * 2 - bh * 2 - codeH) / 4, 8 * k, 50 * k);   // abajo queda sitio para el error y el descenso del gradiente
  let y = R.y + 2 * k;
  const img = { x: cx - im / 2, y, w: im, h: im }; y += im + gap;
  const enc = { x: cx - bw / 2, y, w: bw, h: bh }; y += bh + gap;
  const code = { x: cx - codeW / 2, y, w: codeW, h: codeH }; y += codeH + gap;
  const dec = { x: cx - bw / 2, y, w: bw, h: bh }; y += bh + gap;
  const out = { x: cx - im / 2, y, w: im, h: im };
  return { hor: false, R, cell, img, enc, code, dec, out, err: { x: R.x + R.w - im - 2, y: out.y, w: im, h: im } };
}
function trap(S: Frame, r: Rect, hor: boolean, narrowEnd: boolean, label: string, a: number, active = 0) {
  if (a <= 0.01) return;
  const { d } = S, t = tone(S, 'w'), q = 0.28;
  let pts: [number, number][];
  if (hor) pts = narrowEnd ? [[r.x, r.y], [r.x + r.w, r.y + r.h * q], [r.x + r.w, r.y + r.h * (1 - q)], [r.x, r.y + r.h]] : [[r.x, r.y + r.h * q], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h * (1 - q)]];
  else pts = narrowEnd ? [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w * (1 - q), r.y + r.h], [r.x + r.w * q, r.y + r.h]] : [[r.x + r.w * q, r.y], [r.x + r.w * (1 - q), r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  d.withAlpha(a, () => {
    d.polygon(pts, { fill: alpha(t.c, 0.12 + 0.25 * active), stroke: t.c, lw: 2 });
    d.text(label, r.x + r.w / 2, r.y + r.h / 2, { size: fs(S, 13), weight: 800, color: t.ink, align: 'center', base: 'middle' });
  });
}
export function drawAE(S: Frame) {
  const { d, pal: p } = S, k = kk(S), G = aeLay(S), lat = tone(S, 'lat'), er = tone(S, 'err');
  const x = L.img(EX), cell = G.cell, hor = G.hor;
  const lab = (txt: string, r: Rect, a: number, o: { color?: string; sub?: boolean } = {}) => {
    if (a <= 0.01) return;
    const sz = fs(S, o.sub ? 12 : 13), col = o.color ?? (o.sub ? p.mute : p.ink2), wt = o.sub ? 600 : 700;
    if (hor) { const tw = d.measure(txt, { size: sz, weight: wt }), cx = clamp(r.x + r.w / 2, tw / 2 + 4, S.W - tw / 2 - 4); d.text(txt, cx, o.sub ? r.y + r.h + 6 * k : r.y - 8 * k, { size: sz, weight: wt, color: col, align: 'center', base: o.sub ? 'top' : 'bottom', a }); }
    else d.text(txt, r.x + r.w + 10 * k, r.y + r.h / 2 + (o.sub ? 2 : -2), { size: sz, weight: wt, color: col, base: o.sub ? 'top' : 'bottom', a, w: S.W - (r.x + r.w + 10 * k) - 8 * k });
  };
  const arr = (a: Rect, b: Rect, al: number, dash = false) => {
    if (al <= 0.01) return;
    d.withAlpha(al, () => {
      if (hor) { const y = a.y + a.h / 2; dash ? d.line(a.x + a.w + 4, y, b.x - 4, y, p.ink2, 1.8, [4, 4]) : d.arrow(a.x + a.w + 4, y, b.x - 3, y, p.ink2, 2, 8); }
      else { const xx = a.x + a.w / 2; dash ? d.line(xx, a.y + a.h + 4, xx, b.y - 4, p.ink2, 1.8, [4, 4]) : d.arrow(xx, a.y + a.h + 4, xx, b.y - 3, p.ink2, 2, 8); }
    });
  };
  const encOn = fr(S, 'encoder', 0.08, 0.28), decOn = fr(S, 'decoder', 0.08, 0.28);
  // entrada
  digit(S, G.img.x, G.img.y, x, cell, { a: fr(S, 'idea', 0.02, 0.15) });
  lab(S.l('imagen', 'image'), G.img, fr(S, 'idea', 0.05, 0.18));
  lab(S.l('64 números', '64 numbers'), G.img, fr(S, 'idea', 0.12, 0.25), { sub: true });
  // el hueco de los dos números (idea) y su llenado (código)
  const c = G.code, cA = fr(S, 'idea', 0.3, 0.45), filled = fr(S, 'code', 0.1, 0.3);
  if (cA > 0.01) d.withAlpha(cA, () => {
    d.rect(c.x, c.y, c.w, c.h, { fill: alpha(lat.c, 0.06 + 0.1 * filled), stroke: lat.c, lw: 2, r: 3, dash: filled > 0.5 ? undefined : [5, 4] });
    const sz = fs(S, 13.5);
    const v1 = filled > 0.02 ? S.n(EX_Z[0], 1) : '?', v2 = filled > 0.02 ? S.n(EX_Z[1], 1) : '?';
    d.text(`${S.l('número 1', 'number 1')}: ${v1}`, c.x + c.w / 2, c.y + c.h * 0.32, { size: sz, weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
    d.text(`${S.l('número 2', 'number 2')}: ${v2}`, c.x + c.w / 2, c.y + c.h * 0.72, { size: sz, weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
  });
  lab(filled > 0.5 ? S.l('código', 'code') : S.l('2 números', '2 numbers'), hor ? c : { x: c.x, y: c.y, w: G.enc.x + G.enc.w + 10 * k - c.x, h: c.h }, cA, { color: lat.ink });
  // salida esperada (idea) y reconstrucción real (decodificador)
  const oA = fr(S, 'idea', 0.45, 0.6), recA = fr(S, 'decoder', 0.45, 0.62);
  if (oA > 0.01 && recA < 1) d.withAlpha(oA * (1 - recA), () => { d.rect(G.out.x, G.out.y, G.out.w, G.out.h, { stroke: p.lineStrong, lw: 1.5, dash: [4, 3] }); d.text('?', G.out.x + G.out.w / 2, G.out.y + G.out.h / 2, { size: fs(S, 18), weight: 800, color: p.mute, align: 'center', base: 'middle' }); });
  if (recA > 0.01) digit(S, G.out.x, G.out.y, EX_REC, cell, { kind: 'model', a: recA });
  lab(recA > 0.5 ? S.l('reconstrucción', 'reconstruction') : S.l('imagen', 'image'), G.out, oA);
  lab(S.l('64 números', '64 numbers'), G.out, oA, { sub: true });
  // flechas: punteadas en la idea; firmes cuando llegan las piezas
  arr(G.img, G.enc, cA * (1 - encOn), true); arr(G.enc, G.code, cA * (1 - encOn), true);
  arr(G.code, G.dec, oA * (1 - decOn), true); arr(G.dec, G.out, oA * (1 - decOn), true);
  trap(S, G.enc, hor, true, S.l('codificador', 'encoder'), encOn, S.is('encoder') ? 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 3)) : 0);
  arr(G.img, G.enc, encOn); arr(G.enc, G.code, encOn);
  trap(S, G.dec, hor, false, S.l('decodificador', 'decoder'), decOn, S.is('decoder') ? 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 3)) : 0);
  arr(G.code, G.dec, decOn); arr(G.dec, G.out, decOn);
  // error de reconstrucción
  const eA = fr(S, 'error', 0.1, 0.3);
  if (eA > 0.01) d.withAlpha(eA, () => {
    const diff = Float32Array.from(x, (v, i) => Math.abs(v - EX_REC[i])), e = G.err;
    digit(S, e.x, e.y, diff, Math.max(3, Math.floor(e.w / 8)), { tone: 'err', hl: 'err' });
    if (hor) d.text(S.l('diferencia', 'difference'), e.x - 8 * k, e.y + e.h / 2, { size: fs(S, 12.5), weight: 700, color: er.ink, align: 'right', base: 'middle' });
    else d.text(S.l('diferencia', 'difference'), e.x + e.w, e.y - 6 * k, { size: fs(S, 12.5), weight: 700, color: er.ink, align: 'right', base: 'bottom' });
    const tx = G.R.x, ty = hor ? e.y + 2 * k : G.out.y + G.out.h + 8 * k;
    readout(S, tx, ty, S.l('error de reconstrucción', 'reconstruction error'), S.n(EX_SSE, 2), 'err', { size: 20, a: fr(S, 'error', 0.4, 0.55), w: hor ? e.x - G.R.x - 16 * k : G.R.w });
  });
  // el autocodificador: las dos piezas juntas, y el entrenamiento que baja el error
  const bA = fr(S, 'autoencoder', 0.05, 0.25);
  if (bA > 0.01) d.withAlpha(bA, () => {
    const w = tone(S, 'w');
    if (hor) {
      const y = Math.min(G.enc.y, G.code.y) - 14 * k, x0 = G.enc.x, x1 = G.dec.x + G.dec.w;
      d.line(x0, y + 8 * k, x0, y, w.c, 2); d.line(x0, y, x1, y, w.c, 2); d.line(x1, y, x1, y + 8 * k, w.c, 2);
      d.text(S.l('autocodificador', 'autoencoder'), (x0 + x1) / 2, y - 6 * k, { size: fs(S, 14), weight: 800, color: w.ink, align: 'center', base: 'bottom' });
    } else {
      const x0 = G.enc.x - 8 * k, x1 = G.enc.x + G.enc.w + 8 * k, y0 = G.enc.y - 6 * k, y1 = G.dec.y + G.dec.h + 6 * k;
      d.rect(x0, y0, x1 - x0, y1 - y0, { stroke: w.c, lw: 2, dash: [6, 4], r: 6 });
      d.text(S.l('autocodificador', 'autoencoder'), x1 + 8 * k, (G.dec.y + G.dec.h / 2), { size: fs(S, 13.5), weight: 800, color: w.ink, base: 'middle', w: S.W - x1 - 14 * k });
    }
  });
  const gA = fr(S, 'autoencoder', 0.45, 0.62);
  if (gA > 0.01) {
    if (hor) {
      const e = G.err, yb = e.y + e.h + 14 * k, xa = (G.enc.x + G.enc.w / 2);
      d.withAlpha(gA, () => {
        d.line(e.x + e.w / 2, e.y + e.h + 2, e.x + e.w / 2, yb, er.c, 2, [5, 4]); d.line(e.x + e.w / 2, yb, xa, yb, er.c, 2, [5, 4]);
        d.arrow(xa, yb, xa, G.enc.y + G.enc.h + 4, er.c, 2, 8);
        const long = S.l('descenso del gradiente: ajusta los pesos para que el error baje', 'gradient descent: adjusts the weights so the error goes down');
        const short = S.l('descenso del gradiente: baja el error', 'gradient descent: brings the error down');
        const room = e.x - xa - 120 * k, sz = fs(S, 12.5), txt2 = d.measure(long, { size: sz, weight: 700 }) <= room ? long : short;
        d.text(txt2, xa + 10 * k, yb - 5 * k, { size: sz, weight: 700, color: er.ink, base: 'bottom' });
      });
    } else textUp(S, S.l('descenso del gradiente: baja el error', 'gradient descent: brings the error down'), G.R.x, G.R.y + G.R.h, { size: fs(S, 12.5), weight: 700, color: er.ink, w: G.R.w, a: gA });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 6 · el entrenamiento y lo que se pierde
// ═════════════════════════════════════════════════════════════════════════
export function drawTrain(S: Frame) {
  const { d, pal: p } = S, k = kk(S), Rg = regions(S, S.portrait ? 0.62 : 0.6), n = S.portrait ? 4 : 8, lat = tone(S, 'lat'), er = tone(S, 'err');
  const SN = L.SNAP.ep, K = SN.length;
  const prog = fr(S, 'training', 0.12, 0.85, 'lin') * (K - 1);
  const idx = Math.min(K - 1, Math.floor(prog + 1e-6)), blend = idx >= K - 1 ? 1 : clamp((prog - idx) / 0.35), nxt = Math.min(K - 1, idx + 1);
  const capH = 22 * k, m = Rg.main;
  const lay = tileLayout({ x: m.x, y: m.y, w: m.w, h: (m.h - 2 * capH - 14 * k) / 2 }, n, { cols: n, gap: 6 * k, maxCell: S.portrait ? 9 : 8 });
  const blockH = lay.tile + capH, top = m.y + (m.h - 2 * blockH - 14 * k) / 2 + capH;
  const yA = top, yB = top + blockH + 14 * k;
  d.text(S.l('imágenes que la red no vio al entrenar', 'images the network never saw in training'), lay.x0, yA - 6 * k, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', a: fr(S, 'training', 0.02, 0.12), w: m.w });
  d.text(S.l('lo que reconstruye', 'what it rebuilds'), lay.x0, yB - 6 * k, { size: fs(S, 12.5), weight: 700, color: lat.ink, base: 'bottom', a: fr(S, 'training', 0.05, 0.15) });
  const hl = S.portrait ? 2 : 4, hlA = fr(S, 'lossy', 0.1, 0.25);
  for (let i = 0; i < n; i++) {
    const x = lay.x0 + i * (lay.tile + lay.gap), A = L.slot(L.SNAP.rec[idx], i), B = L.slot(L.SNAP.rec[nxt], i);
    digit(S, x, yA, L.img(L.SHOW[i]), lay.cell, { a: fr(S, 'training', 0.02 + 0.02 * i, 0.12 + 0.02 * i) });
    d.withAlpha(fr(S, 'training', 0.06, 0.16), () => digit(S, x, yB, Float32Array.from(A, (v, j) => lerp(v, B[j], blend * (idx < K - 1 ? 1 : 0))), lay.cell, { kind: 'model' }));
    if (i === hl % n && hlA > 0) d.rect(x - 4 * k, yA - 4 * k, lay.tile + 8 * k, yB + lay.tile - yA + 8 * k, { stroke: tone(S, 'sig').c, lw: 2.2, r: 4, a: hlA });
  }
  // lecturas: paso y error
  const A = Rg.aside, stepNow = Math.round(lerp(SN[idx], SN[nxt], idx < K - 1 ? blend : 0)), err = L.LOSS[Math.min(L.LOSS.length - 1, Math.round(stepNow / 10))];
  const rA = fr(S, 'training', 0.1, 0.22);
  const side = S.portrait || A.h < 230;
  readout(S, A.x + 2, A.y + 2, S.l('paso de entrenamiento', 'training step'), S.n(stepNow, 0), 'ink', { size: 20, a: rA, w: side ? A.w * 0.48 : A.w });
  readout(S, side ? A.x + A.w * 0.5 : A.x + 2, side ? A.y + 2 : A.y + 60 * k, S.l('error por imagen', 'error per image'), S.n(err, 2), 'err', { size: 20, a: rA, w: side ? A.w * 0.48 : A.w });
  // lo que se pierde: una pareja en grande
  if (hlA > 0.01) {
    const i = hl % n, yTop = side ? A.y + 64 * k : A.y + 130 * k, room = A.y + A.h - yTop - 22 * k;
    const c = Math.max(4, Math.min(12, Math.floor(Math.min(room, (A.w - 24 * k) / 2) / 8)));
    d.withAlpha(hlA, () => {
      digit(S, A.x + 2, yTop + 20 * k, L.img(L.SHOW[i]), c);
      digit(S, A.x + 2 + 8 * c + 18 * k, yTop + 20 * k, L.slot(L.SNAP.rec[K - 1], i), c, { kind: 'model' });
      d.text(S.l('original', 'original'), A.x + 2, yTop + 14 * k, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom' });
      d.text(S.l('reconstrucción', 'reconstruction'), A.x + 2 + 8 * c + 18 * k, yTop + 14 * k, { size: fs(S, 12.5), weight: 700, color: lat.ink, base: 'bottom' });
    });
  }
  void er;
}

// ═════════════════════════════════════════════════════════════════════════
// 7 · el plano latente del autocodificador: puntos, grupos, paseo y huecos
// ═════════════════════════════════════════════════════════════════════════
export function mapLayout(S: Frame) {
  const Rg = regions(S, S.portrait ? 0.64 : 0.62), B = L.AE_BOX, px = (B.x1 - B.x0) * 0.04, py = (B.y1 - B.y0) * 0.05;
  const plot = new Plot(S, Rg.main, { xr: [B.x0 - px, B.x1 + px], yr: [B.y0 - py, B.y1 + py], pad: { l: 38, r: 8, t: 24, b: 40 } });
  return { Rg, plot };
}
const PEEK = [0, 4, 3].map((dg) => { let bi = 0, bd = Infinity; for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === dg) { const dd = (L.CODES_AE.x[i] - MED_AE[dg][0]) ** 2 + (L.CODES_AE.y[i] - MED_AE[dg][1]) ** 2; if (dd < bd) { bd = dd; bi = i; } } return bi; });
export const AE_DRAW = L.drawAE(8, 7101);
const JUNK_IMG = L.decAE(JUNK[0], JUNK[1]);
const ORDER = Array.from({ length: L.NTR }, (_, i) => hash(i, 41));

export function drawMap(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), { Rg, plot } = mapLayout(S), r = plot.r, A = Rg.aside, lat = tone(S, 'lat'), B = L.AE_BOX;
  axisX(S, plot, { ticks: [-10, 0, 10], label: S.l('número 1 del código', 'code number 1'), a: fr(S, 'latent-plane', 0.03, 0.22) });
  axisY(S, plot, { ticks: [-20, -10, 0], label: S.l('número 2 del código', 'code number 2'), a: fr(S, 'latent-plane', 0.2, 0.38) });
  const walkOn = S.on('walk-demo'), dim = 1 - 0.45 * fr(S, 'walk-demo', 0, 0.2);
  // puntos: primero sin color; con «latent-groups», cada uno con el tono y la forma de su dígito
  const show = fr(S, 'latent-all', 0.05, 0.7, 'lin'), col = fr(S, 'latent-groups', 0.05, 0.3);
  if (show > 0) d.withAlpha(dim, () => plot.clip(() => {
    const rr = 2.3 * Math.max(0.85, u);
    for (let i = 0; i < L.NTR; i++) {
      const a = clamp((show * 1.25 - ORDER[i]) * 6); if (a <= 0) continue;
      const x = plot.X(L.CODES_AE.x[i]), y = plot.Y(L.CODES_AE.y[i]);
      if (col < 1) d.circle(x, y, rr, { fill: alpha(p.ink2, 0.45), a: a * (1 - col) });
      if (col > 0) mark(S, x, y, L.LAB[i], rr, 0.8 * a * col);
    }
  }));
  const tagA = fr(S, 'latent-all', 0.55, 0.72) * (1 - fr(S, 'walk-demo', 0, 0.2));
  if (tagA > 0.01) badge(S, S.l('espacio latente', 'latent space'), r.x + r.w - 4 * k, r.y + 12 * k, { tone: 'lat', align: 'right', size: fs(S, 13), a: tagA });
  // nombres de los grupos (solo para quien mira)
  const gA = fr(S, 'latent-groups', 0.2, 0.4) * (1 - 0.55 * fr(S, 'walk-demo', 0, 0.2)) * (1 - fr(S, 'generate-ae', 0, 0.2));
  if (gA > 0.01) d.withAlpha(gA, () => {
    for (let q = 0; q < 10; q++) { const t = tone(S, digTone(q)), x = plot.X(MED_AE[q][0]), y = plot.Y(MED_AE[q][1]), s = 10 * k; d.rect(x - s, y - s, 2 * s, 2 * s, { fill: p.surface, stroke: t.c, lw: 2, r: 3 }); d.text(String(q), x, y, { size: fs(S, 13), weight: 800, color: t.ink, align: 'center', base: 'middle' }); }
  });
  const capA = fr(S, 'latent-groups', 0.5, 0.65) * (1 - fr(S, 'walk-demo', 0, 0.2));
  if (capA > 0.01) textUp(S, S.l('los números de cada grupo son solo para ti: la red no los vio', 'the group numbers are just for you: the network never saw them'), r.x + 6 * k, r.y + r.h - 6 * k, { size: fs(S, 12), weight: 600, color: p.ink2, halo: p.stage, w: r.w - 12 * k, a: capA });

  // el siete de ejemplo y su punto
  const exA = fr(S, 'latent-plane', 0.45, 0.62) * (1 - fr(S, 'latent-groups', 0, 0.2));
  const ex = plot.X(EX_Z[0]), ey = plot.Y(EX_Z[1]);
  if (exA > 0.01) d.withAlpha(exA, () => {
    const c = Math.max(4, Math.min(9, Math.floor(Math.min(A.w * 0.4, A.h * 0.5) / 8)));
    digit(S, A.x + 2, A.y + 4 * k, L.img(EX), c);
    readout(S, A.x + 2, A.y + 8 * c + 14 * k, S.l('su código', 'its code'), `(${S.n(EX_Z[0], 1)}, ${S.n(EX_Z[1], 1)})`, 'lat', { size: 18, w: A.w });
    d.line(A.x + 2 + 8 * c, A.y + 4 * k + 4 * c, ex + 10 * k, ey, lat.c, 1.6, [4, 3]);
    d.circle(ex, ey, 6 * k, { fill: lat.c, stroke: p.stage, lw: 1.5 });
    d.circle(ex, ey, 11 * k, { stroke: p.ink, lw: 2 });
  });
  // tres imágenes y su punto: cerca significa parecido
  const pkA = fr(S, 'latent-groups', 0.6, 0.78) * (1 - fr(S, 'walk-demo', 0, 0.2));
  if (pkA > 0.01) {
    const lay = tileLayout(A, 3, { cols: S.portrait || A.h < 250 ? 3 : 1, gap: 12 * k, maxCell: 8, valign: 'top' });
    d.withAlpha(pkA, () => PEEK.forEach((idx, i) => {
      const q = lay.pos(i), tx = plot.X(L.CODES_AE.x[idx]), ty = plot.Y(L.CODES_AE.y[idx]);
      digit(S, q.x, q.y, L.img(idx), lay.cell);
      d.line(lay.cols === 1 ? q.x - 2 : q.x + lay.tile / 2, lay.cols === 1 ? q.y + lay.tile / 2 : q.y - 2, tx, ty, lat.c, 1.5, [4, 3]);
      d.circle(tx, ty, 8 * k, { stroke: lat.c, lw: 2.4 });
    }));
  }

  // el paseo
  const walkA = fr(S, 'walk-demo', 0.1, 0.25) * (1 - fr(S, 'generate-ae', 0, 0.2));
  if (walkOn && walkA > 0.01) d.withAlpha(walkA, () => {
    plot.clip(() => d.polyline(PATH.map(([x, y]) => [plot.X(x), plot.Y(y)] as P2), p.ink2, 1.6, { dash: [5, 5], a: 0.55 }));
    const z = explorerZ(S), x = plot.X(z[0]), y = plot.Y(z[1]), dec = L.decAE(z[0], z[1]), rd = L.readDigit(dec);
    d.line(x - 15 * k, y, x + 15 * k, y, p.ink, 1.5); d.line(x, y - 15 * k, x, y + 15 * k, p.ink, 1.5);
    d.circle(x, y, 9 * k, { fill: lat.soft, stroke: p.ink, lw: 2.6 });
    // la imagen que da ese punto
    const side = S.portrait || A.h < 250;
    const c = Math.max(4, Math.floor(Math.min(side ? A.h - 8 * k : A.h * 0.55, side ? A.w * 0.45 : A.w - 4) / 8));
    digit(S, A.x + 2, A.y + 4 * k, dec, c, { kind: 'model' });
    const tx = side ? A.x + 8 * c + 18 * k : A.x + 2, ty = side ? A.y + 4 * k : A.y + 8 * c + 16 * k;
    d.text(S.l('parece un', 'looks like a'), tx, ty, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top' });
    d.text(rd.p >= 0.5 ? String(rd.digit) : '—', tx, ty + 18 * k, { size: 34, weight: 800, color: rd.p >= 0.5 ? p.ink : p.mute, base: 'top' });
  });

  // generar con el autocodificador: puntos al azar en el recuadro
  const boxA = fr(S, 'generate-ae', 0.05, 0.2) * (1 - fr(S, 'vae-idea', 0, 1));
  if (S.on('generate-ae') && boxA > 0.01) {
    d.withAlpha(boxA, () => {
      d.rect(plot.X(B.x0), plot.Y(B.y1), plot.X(B.x1) - plot.X(B.x0), plot.Y(B.y0) - plot.Y(B.y1), { stroke: p.ink, lw: 1.8, dash: [8, 5] });
      d.text(S.l('recuadro de los códigos', 'box of the codes'), plot.X(B.x1) - 6 * k, plot.Y(B.y0) - 5 * k, { size: fs(S, 12), weight: 700, color: p.ink, align: 'right', base: 'bottom', halo: p.stage });
    });
    const sg = tone(S, 'sig'), junkOn = fr(S, 'gap-junk', 0.05, 0.25), lay = tileLayout(A, 8, { cols: S.portrait || A.h < 250 ? 8 : 4, gap: 8 * k, extraH: 16 * k, maxCell: 7, valign: 'top' });
    const dimS = 1 - 0.6 * fr(S, 'gaps', 0, 0.2);
    AE_DRAW.z.forEach(([z0, z1], i) => {
      const a = fr(S, 'generate-ae', 0.2 + 0.08 * i, 0.28 + 0.08 * i) * (1 - junkOn);
      if (a <= 0.01) return;
      d.withAlpha(a * dimS, () => {
        d.circle(plot.X(z0), plot.Y(z1), 7 * k, { fill: alpha(p.stage, 0.8), stroke: sg.c, lw: 2.2, dash: [3, 2.5] });
        d.text(String(i + 1), plot.X(z0), plot.Y(z1) - 11 * k, { size: fs(S, 12), weight: 800, color: sg.ink, align: 'center', base: 'bottom', halo: p.stage });
        const q = lay.pos(i);
        digit(S, q.x, q.y, AE_DRAW.img[i], lay.cell, { kind: 'model' });
        d.text(String(i + 1), q.x + lay.tile / 2, q.y + lay.tile + 2 * k, { size: fs(S, 12), weight: 800, color: sg.ink, align: 'center', base: 'top' });
      });
    });
    // huecos y zona apiñada
    const hA = fr(S, 'gaps', 0.25, 0.45) * (1 - fr(S, 'vae-idea', 0, 1)), cA = fr(S, 'gaps', 0.5, 0.65);
    if (hA > 0.01) d.withAlpha(hA, () => {
      const sx = Math.abs(plot.X(1) - plot.X(0)), sy = Math.abs(plot.Y(1) - plot.Y(0));
      HOLES.forEach(([hx, hy, hr], j) => {
        const rx = hr * sx, ry = hr * sy, cx = plot.X(hx), cy = plot.Y(hy);
        d.polygon(Array.from({ length: 49 }, (_, t) => [cx + rx * Math.cos((t / 48) * Math.PI * 2), cy + ry * Math.sin((t / 48) * Math.PI * 2)] as P2), { stroke: p.ink2, lw: 2, dash: [5, 4], fill: alpha(p.ink2, 0.05) });
        if (j === 0 || !S.portrait) badge(S, S.l('hueco', 'hole'), cx, cy, { size: fs(S, 12.5), a: 1 });
      });
    });
    if (cA > 0.01) { const [cx0, cy0, cr] = CROWD, rx = cr * Math.abs(plot.X(1) - plot.X(0)), ry = cr * Math.abs(plot.Y(1) - plot.Y(0)); d.withAlpha(cA * (1 - junkOn * 0.5), () => { d.polygon(Array.from({ length: 49 }, (_, t) => [plot.X(cx0) + rx * Math.cos((t / 48) * Math.PI * 2), plot.Y(cy0) + ry * Math.sin((t / 48) * Math.PI * 2)] as P2), { stroke: tone(S, 'err').c, lw: 2.2, dash: [5, 4] }); badge(S, S.l('apiñados', 'crowded'), plot.X(cx0 + cr * 1.6), plot.Y(cy0 + cr * 1.1), { tone: 'err', size: fs(S, 12.5), align: 'left' }); }); }
    // un punto en un hueco
    if (junkOn > 0.01) {
      const jx = plot.X(JUNK[0]), jy = plot.Y(JUNK[1]), er = tone(S, 'err');
      d.withAlpha(junkOn, () => {
        d.circle(jx, jy, 8 * k, { fill: er.soft, stroke: er.c, lw: 2.6 });
        const side = S.portrait || A.h < 250, c = Math.max(4, Math.floor(Math.min(side ? A.h - 8 * k : A.h * 0.55, side ? A.w * 0.45 : A.w - 4) / 8));
        digit(S, A.x + 2, A.y + 4 * k, JUNK_IMG, c, { kind: 'model', hl: 'err' });
        d.line(jx + 8 * k, jy, A.x - 2, A.y + 4 * k + 4 * c, er.c, 1.6, [4, 3]);
        const tx = side ? A.x + 8 * c + 18 * k : A.x + 2, ty = side ? A.y + 4 * k : A.y + 8 * c + 16 * k;
        d.text(S.l('no es ningún dígito', 'not any digit'), tx, ty, { size: fs(S, 13), weight: 800, color: er.ink, base: 'top', w: side ? A.x + A.w - tx : A.w, a: fr(S, 'gap-junk', 0.3, 0.45) });
      });
    }
  }
  void lut;
}
