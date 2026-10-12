// Vistas del VAE (nubes, zona conocida, muestreo), la comparación con el autocodificador, el «no es collage», la borrosidad,
// el resumen y el puente.
import { Plot, alpha, badge, box, clamp, gauss, hash, inset, lerp, link, neu, regions, rng, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import * as L from './latent';
import { axisX, axisY, digit, digTone, digitBars, ellipsePts, fr, fs, kk, lut, mark, readout, tileLayout } from './helpers';
import { EX, NEW_IMG, type P2 } from './state';

// ═════════════════════════════════════════════════════════════════════════
// 8 · el VAE: un punto se vuelve nube; las nubes rellenan el plano
// ═════════════════════════════════════════════════════════════════════════
const EXV = L.encVAE(L.img(EX)), EXV_MU: P2 = EXV.mu, EXV_S: P2 = [Math.exp(0.5 * EXV.lv[0]), Math.exp(0.5 * EXV.lv[1])];
const NOISE_EPS: P2[] = (() => { const r = rng(21); return Array.from({ length: 5 }, () => [gauss(r), gauss(r)] as P2); })();
const NOISE_Z: P2[] = NOISE_EPS.map(([a, b]) => [EXV_MU[0] + EXV_S[0] * a, EXV_MU[1] + EXV_S[1] * b]);
const NOISE_IMG = NOISE_Z.map(([a, b]) => L.decVAE(a, b));
const VAE_SUB = Array.from({ length: L.NTR }, (_, i) => i).filter((i) => hash(i, 5) < 0.26);
export const VAE_DRAW = L.drawVAE(8, 8203);

function vaeLay(S: Frame) {
  const Rg = regions(S, S.portrait ? 0.64 : 0.6), m = Rg.main, side = Math.min(m.w, m.h), sq: Rect = { x: m.x + (m.w - side) / 2, y: m.y + (m.h - side) / 2, w: side, h: side };
  // acercamiento a la nube del siete (vae-cloud, vae-noise) y vuelta al plano completo (vae-fill)
  const z = fr(S, 'vae-cloud', 0, 0.3, 'io') * (1 - fr(S, 'vae-fill', 0, 0.3, 'io'));
  const half = lerp(3.1, 0.75, z), cx = lerp(0, EXV_MU[0], z), cy = lerp(0, EXV_MU[1], z);
  const pad = { l: 34, r: 8, t: 24, b: 40 }, probe = new Plot(S, sq, { xr: [0, 1], yr: [0, 1], pad }), asp = probe.r.h / probe.r.w;
  return { Rg, z, plot: new Plot(S, sq, { xr: [cx - half, cx + half], yr: [cy - half * asp, cy + half * asp], pad }) };
}
const ellipse = (plot: Plot, cx: number, cy: number, sx: number, sy: number, n = 36) => ellipsePts(plot.X(cx), plot.Y(cy), Math.abs(plot.X(sx) - plot.X(0)), Math.abs(plot.Y(sy) - plot.Y(0)), n);

// mosaico del plano del VAE (se pinta una vez y se guarda: función pura de la geometría y el tema)
const MOS = new Map<string, HTMLCanvasElement>();
function mosaic(S: Frame, w: number, h: number, n: number): HTMLCanvasElement {
  const dpr = S.dpr, key = `${S.pal.ink}|${S.pal.surface}|${dpr}|${Math.round(w)}x${Math.round(h)}|${n}`;
  const hit = MOS.get(key); if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * dpr); cv.height = Math.ceil(h * dpr);
  const g = cv.getContext('2d')!; g.scale(dpr, dpr);
  const col = lut(S.pal.ink), gap = 2, tile = Math.floor((Math.min(w, h) - (n - 1) * gap) / n), cell = tile / 8;
  g.fillStyle = S.pal.surface2; g.fillRect(0, 0, w, h);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const z0 = -2.4 + (4.8 * i) / (n - 1), z1 = 2.4 - (4.8 * j) / (n - 1), im = L.decVAE(z0, z1), x = i * (tile + gap), y = j * (tile + gap);
    g.fillStyle = S.pal.surface; g.fillRect(x, y, tile, tile);
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { const q = Math.round(im[a * 8 + b] * 16); if (q > 0) { g.fillStyle = col[q]; g.fillRect(x + b * cell, y + a * cell, Math.ceil(cell), Math.ceil(cell)); } }
  }
  if (MOS.size > 6) MOS.delete(MOS.keys().next().value as string);
  MOS.set(key, cv);
  return cv;
}

export function drawVae(S: Frame) {
  const { d, pal: p } = S, u = S.u, k = kk(S), { Rg, z, plot } = vaeLay(S), r = plot.r, A = Rg.aside, lat = tone(S, 'lat'), sg = tone(S, 'sig'), vd = L.CODES_VAE;
  const tickA = 1 - clamp(z * 4);
  axisX(S, plot, { ticks: [-2, 0, 2], label: S.l('número 1 del código', 'code number 1'), a: fr(S, 'vae-idea', 0.02, 0.18) * tickA });
  axisY(S, plot, { ticks: [-2, 0, 2], label: S.l('número 2 del código', 'code number 2'), a: fr(S, 'vae-idea', 0.08, 0.24) * tickA });
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1, a: fr(S, 'vae-idea', 0.02, 0.18) });
  const side = S.portrait || A.h < 250;

  // nubes de muchas imágenes (vae-fill) y la zona conocida (vae-center)
  const fA = fr(S, 'vae-fill', 0.25, 0.75, 'lin');
  if (fA > 0) plot.clip(() => VAE_SUB.forEach((i, j) => {
    const a = clamp((fA * 1.3 - j / VAE_SUB.length) * 5); if (a <= 0) return;
    const t = tone(S, digTone(L.LAB[i]));
    d.polygon(ellipse(plot, vd.x[i], vd.y[i], 2 * vd.sx![i], 2 * vd.sy![i], 24), { fill: alpha(t.c, 0.035 * a), stroke: alpha(t.c, 0.3 * a), lw: 1 });
  }));
  if (fA > 0) plot.clip(() => { const rr = 2 * Math.max(0.85, u); for (let i = 0; i < L.NTR; i += 2) { const a = clamp((fA * 1.3 - hash(i, 9)) * 5); if (a > 0) mark(S, plot.X(vd.x[i]), plot.Y(vd.y[i]), L.LAB[i], rr, 0.75 * a); } });
  const cA = fr(S, 'vae-center', 0.15, 0.4);
  if (cA > 0.01) d.withAlpha(cA, () => {
    [1, 2].forEach((q) => d.polyline(ellipse(plot, 0, 0, q, q, 72), p.ink, 2.2, { dash: [7, 5] }));
    badge(S, S.l('zona conocida', 'known zone'), plot.X(0), plot.Y(2) - 12 * k, { size: fs(S, 12.5) });
  });

  // el siete: un punto que se vuelve nube
  const pA = fr(S, 'vae-idea', 0.15, 0.3) * (1 - 0.7 * fr(S, 'vae-fill', 0.1, 0.3));
  const grow = fr(S, 'vae-idea', 0.45, 0.8, 'io');
  if (pA > 0.01) d.withAlpha(pA, () => {
    if (grow > 0) d.polygon(ellipse(plot, EXV_MU[0], EXV_MU[1], 2 * EXV_S[0] * grow, 2 * EXV_S[1] * grow, 48), { fill: alpha(lat.c, 0.16), stroke: lat.c, lw: 2.4 });
    d.circle(plot.X(EXV_MU[0]), plot.Y(EXV_MU[1]), 4 * k, { fill: lat.c, stroke: p.stage, lw: 1.5 });
  });
  const iA = fr(S, 'vae-idea', 0.6, 0.75) * (1 - fr(S, 'vae-cloud', 0, 0.2));
  if (iA > 0.01) badge(S, S.l('un punto → una nube', 'a point → a cloud'), plot.X(EXV_MU[0]), plot.Y(EXV_MU[1] + 2 * EXV_S[1]) - 16 * k, { tone: 'lat', size: fs(S, 12.5), a: iA });
  // centro y tamaño
  const ctA = fr(S, 'vae-cloud', 0.3, 0.45) * (1 - fr(S, 'vae-fill', 0, 0.2)), szA = fr(S, 'vae-cloud', 0.5, 0.65) * (1 - fr(S, 'vae-fill', 0, 0.2));
  if (ctA > 0.01) badge(S, S.l('centro', 'center'), plot.X(EXV_MU[0]) - 10 * k, plot.Y(EXV_MU[1]) - 2 * k, { tone: 'lat', align: 'right', size: fs(S, 12.5), a: ctA });
  if (szA > 0.01) {
    const x0 = plot.X(EXV_MU[0]), x1 = plot.X(EXV_MU[0] + 2 * EXV_S[0]), y = plot.Y(EXV_MU[1]) + 2 * k;
    d.withAlpha(szA, () => { d.arrow(x0 + 4 * k, y, x1, y, p.ink, 2, 7); badge(S, S.l('tamaño', 'size'), x1 + 8 * k, y, { size: fs(S, 12.5), align: 'left' }); });
  }
  // la imagen de la nube en el lateral
  const ia = fr(S, 'vae-idea', 0.1, 0.25) * (1 - fr(S, 'vae-noise', 0.1, 0.3));
  if (ia > 0.01) {
    const c = Math.max(4, Math.min(9, Math.floor(Math.min(side ? A.h - 8 * k : A.w * 0.45, A.h * 0.5) / 8)));
    d.withAlpha(ia, () => {
      digit(S, A.x + 2, A.y + 4 * k, L.img(EX), c);
      const tx = side ? A.x + 8 * c + 16 * k : A.x + 2, ty = side ? A.y + 4 * k : A.y + 8 * c + 14 * k;
      d.text(S.l('nuestro siete', 'our seven'), tx, ty, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top' });
      const vA = fr(S, 'vae-cloud', 0.3, 0.5);
      if (vA > 0) {
        let y = ty + 22 * k;
        y += readout(S, tx, y, S.l('centro', 'center'), `(${S.n(EXV_MU[0], 1)}, ${S.n(EXV_MU[1], 1)})`, 'lat', { size: 16, a: vA });
        readout(S, tx, y, S.l('tamaño', 'size'), `(${S.n(EXV_S[0], 2)}, ${S.n(EXV_S[1], 2)})`, 'lat', { size: 16, a: fr(S, 'vae-cloud', 0.5, 0.65) });
      }
    });
  }
  // al entrenar: cinco puntos de la nube, cinco imágenes casi iguales
  const nA = fr(S, 'vae-noise', 0.15, 0.3) * (1 - fr(S, 'vae-fill', 0, 0.25));
  if (nA > 0.01) {
    const lay = tileLayout(A, 5, { cols: side ? 5 : 3, gap: 8 * k, extraH: 16 * k, maxCell: 8, valign: 'top' });
    NOISE_Z.forEach(([z0, z1], i) => {
      const a = fr(S, 'vae-noise', 0.2 + 0.1 * i, 0.3 + 0.1 * i) * nA; if (a <= 0.01) return;
      d.withAlpha(a, () => {
        d.circle(plot.X(z0), plot.Y(z1), 6 * k, { fill: p.stage, stroke: sg.c, lw: 2.2 });
        d.text(String(i + 1), plot.X(z0) + 8 * k, plot.Y(z1) - 6 * k, { size: fs(S, 12), weight: 800, color: sg.ink, base: 'bottom', halo: p.stage });
        const q = lay.pos(i);
        digit(S, q.x, q.y, NOISE_IMG[i], lay.cell, { kind: 'model' });
        d.text(String(i + 1), q.x + lay.tile / 2, q.y + lay.tile + 2 * k, { size: fs(S, 12), weight: 800, color: sg.ink, align: 'center', base: 'top' });
      });
    });
  }
  // el plano decodificado, sin huecos (lateral, desde vae-fill)
  const mA = fr(S, 'vae-fill', 0.55, 0.75) * (1 - fr(S, 'vae-sample', 0, 0.2));
  if (mA > 0.01) {
    const capH = 20 * k, sz = Math.max(60, Math.min(A.w - 4, A.h - capH - 6 * k)), n = sz > 200 ? 9 : 7, cv = mosaic(S, sz, sz, n);
    d.withAlpha(mA, () => {
      d.text(S.l('lo que decodifica cada zona', 'what each zone decodes to'), A.x + 2, A.y + 2, { size: fs(S, 12.5), weight: 700, color: lat.ink, base: 'top', w: A.w });
      S.ctx.drawImage(cv, A.x + 2, A.y + capH + 4 * k, sz, sz);
    });
  }
  // generar: puntos de la zona conocida → dígitos nuevos
  const gA = fr(S, 'vae-sample', 0.12, 0.25);
  if (gA > 0.01) {
    const lay = tileLayout(A, 8, { cols: side ? 8 : 4, gap: 8 * k, extraH: 16 * k, maxCell: 7, valign: 'top' });
    VAE_DRAW.z.forEach(([z0, z1], i) => {
      const a = fr(S, 'vae-sample', 0.2 + 0.08 * i, 0.28 + 0.08 * i); if (a <= 0.01) return;
      d.withAlpha(a, () => {
        d.circle(plot.X(z0), plot.Y(z1), 7 * k, { fill: alpha(p.stage, 0.8), stroke: sg.c, lw: 2.2, dash: [3, 2.5] });
        d.text(String(i + 1), plot.X(z0), plot.Y(z1) - 11 * k, { size: fs(S, 12), weight: 800, color: sg.ink, align: 'center', base: 'bottom', halo: p.stage });
        const q = lay.pos(i);
        digit(S, q.x, q.y, VAE_DRAW.img[i], lay.cell, { kind: 'model' });
        d.text(String(i + 1), q.x + lay.tile / 2, q.y + lay.tile + 2 * k, { size: fs(S, 12), weight: 800, color: sg.ink, align: 'center', base: 'top' });
      });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 9 · ocho intentos con cada modelo; la mezcla en tres mil intentos
// ═════════════════════════════════════════════════════════════════════════
const CMP_AE = L.drawAE(8, 9301), CMP_VAE = L.drawVAE(8, 9302);
export function drawCompare(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = inset(S.full(), 12 * S.u, 14 * S.u), res = fr(S, 'result', 0, 0.18, 'io');
  if (res < 1) d.withAlpha(1 - res, () => {
    const half = (R.h - 12 * k) / 2, capH = 24 * k, cols = S.portrait ? 4 : 8;
    ([[S.l('autocodificador: puntos al azar en su recuadro', 'autoencoder: random points in its box'), CMP_AE.img, 'ink'], [S.l('VAE: puntos al azar de su zona redonda', 'VAE: random points from its round zone'), CMP_VAE.img, 'lat']] as [string, Float32Array[], Tone][]).forEach(([title, imgs, t], row) => {
      const top = R.y + row * (half + 12 * k), lay = tileLayout({ x: R.x, y: top + capH, w: R.w, h: half - capH }, 8, { cols, gap: 8 * k, maxCell: 9, valign: 'center' });
      const a = fr(S, 'compare', 0.05 + 0.4 * row, 0.18 + 0.4 * row);
      d.withAlpha(a, () => {
        d.text(title, lay.x0, lay.y0 - 8 * k, { size: fs(S, 13), weight: 800, color: t === 'ink' ? p.ink : tone(S, t).ink, base: 'bottom', w: R.w });
        imgs.forEach((im, i) => { const q = lay.pos(i); digit(S, q.x, q.y, im, lay.cell, { kind: 'model', a: fr(S, 'compare', 0.1 + 0.4 * row + 0.03 * i, 0.2 + 0.4 * row + 0.03 * i) }); });
      });
    });
  });
  if (res > 0.01) d.withAlpha(res, () => {
    const N = 3000, st = L.STATS, th = (S.portrait ? 44 : 24) * k;
    d.text(S.l('Tres mil intentos con cada modelo: qué dígito parece cada imagen, según un clasificador sencillo', 'Three thousand tries with each model: which digit each image looks like, according to a simple classifier'), R.x, R.y, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top', w: R.w });
    const top = R.y + th + 14 * k, hh = R.y + R.h - top, gap = 16 * k;
    const cA: Rect = S.portrait ? { x: R.x, y: top, w: R.w, h: (hh - gap) / 2 } : { x: R.x, y: top, w: (R.w - gap) / 2, h: hh };
    const cB: Rect = S.portrait ? { x: R.x, y: top + (hh + gap) / 2, w: R.w, h: (hh - gap) / 2 } : { x: R.x + (R.w + gap) / 2, y: top, w: (R.w - gap) / 2, h: hh };
    digitBars(S, cA, st.ae_freq.map((f: number) => Math.round(f * N)), { tone: 'sig', title: S.l('Autocodificador', 'Autoencoder'), n: N, stats: true, refOutside: !S.portrait || R.w > 300, a: fr(S, 'result', 0.1, 0.25) });
    digitBars(S, cB, st.vae_freq.map((f: number) => Math.round(f * N)), { tone: 'lat', title: 'VAE', n: N, stats: true, refOutside: !S.portrait || R.w > 300, a: fr(S, 'result', 0.45, 0.6) });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 10 · ¿collage? cada generado junto al más parecido del entrenamiento
// ═════════════════════════════════════════════════════════════════════════
let _pairs: { g: Float32Array; i: number }[] | null = null;
const pairs = () => {
  if (_pairs) return _pairs;
  const D = L.drawVAE(60, 77), out: { g: Float32Array; i: number }[] = [], seen = new Set<number>();
  for (let q = 0; q < D.img.length && out.length < 5; q++) { const rd = L.readDigit(D.img[q]); if (rd.p < 0.8 || seen.has(rd.digit)) continue; seen.add(rd.digit); out.push({ g: D.img[q], i: L.nearest(D.img[q]).i }); }
  return (_pairs = out);
};
export function drawCollage(S: Frame) {
  const { d, pal: p } = S, k = kk(S), Rg = regions(S, S.portrait ? 0.58 : 0.6), m = Rg.main, A = Rg.aside, P = pairs(), lat = tone(S, 'lat');
  const capH = 22 * k, gapV = 34 * k;
  const lay = tileLayout({ x: m.x, y: m.y, w: m.w, h: (m.h - 2 * capH - gapV) / 2 }, P.length, { cols: P.length, gap: 14 * k, maxCell: 10 });
  const blockH = 2 * (lay.tile + capH) + gapV, y0 = m.y + (m.h - blockH) / 2 + capH, y1 = y0 + lay.tile + gapV + capH;
  d.text(S.l('generado por el VAE', 'generated by the VAE'), lay.x0, y0 - 6 * k, { size: fs(S, 12.5), weight: 800, color: lat.ink, base: 'bottom', a: fr(S, 'collage-q', 0.05, 0.18), w: m.w });
  d.text(S.l('el más parecido del entrenamiento', 'the most similar training image'), lay.x0, y1 - 6 * k, { size: fs(S, 12.5), weight: 800, color: p.ink2, base: 'bottom', a: fr(S, 'collage-q', 0.45, 0.58), w: m.w });
  P.forEach((q, i) => {
    const x = lay.x0 + i * (lay.tile + lay.gap);
    digit(S, x, y0, q.g, lay.cell, { kind: 'model', a: fr(S, 'collage-q', 0.1 + 0.05 * i, 0.2 + 0.05 * i) });
    digit(S, x, y1, L.img(q.i), lay.cell, { a: fr(S, 'collage-q', 0.5 + 0.06 * i, 0.6 + 0.06 * i) });
    const nA = fr(S, 'not-copy', 0.05 + 0.04 * i, 0.15 + 0.04 * i);
    if (nA > 0) {   // «distinto»: un signo igual tachado, dibujado (la fuente del sistema no siempre trae ≠)
      const cx = x + lay.tile / 2, cy = (y0 + lay.tile + y1 - capH) / 2, w = 9 * k, g = 3.5 * k;
      d.withAlpha(nA, () => { d.line(cx - w, cy - g, cx + w, cy - g, p.ink, 2.4); d.line(cx - w, cy + g, cx + w, cy + g, p.ink, 2.4); d.line(cx - 4 * k, cy + 9 * k, cx + 4 * k, cy - 9 * k, p.ink, 2.4); });
    }
  });
  // pesos frente a datos
  const sideBy = S.portrait || A.h < 250, rA = fr(S, 'not-copy', 0.35, 0.5) * (sideBy ? 1 - fr(S, 'caveat', 0, 0.15) : 1);
  if (rA > 0.01) {
    const w2 = sideBy ? A.w / 2 - 8 * k : A.w;
    const h1 = readout(S, A.x + 2, A.y + 2, S.l('pesos que guarda el modelo', 'weights the model stores'), S.n(L.N_PARAMS_VAE, 0), 'w', { size: 22, a: rA, w: w2 });
    readout(S, sideBy ? A.x + A.w / 2 + 8 * k : A.x + 2, sideBy ? A.y + 2 : A.y + h1 + 14 * k, S.l('números en las imágenes de entrenamiento', 'numbers in the training images'), S.n(L.NTR * 64, 0), 'dat', { size: 22, a: Math.min(rA, fr(S, 'not-copy', 0.5, 0.65)), w: w2 });
  }
  // la salvedad: la memorización existe en modelos enormes
  const cA = fr(S, 'caveat', 0.1, 0.25);
  if (cA > 0.01) {
    const er = tone(S, 'err'), bx = A.x + 2, bw = A.w - 4;
    const txt = S.l('Modelos enormes, imágenes muy repetidas en sus datos: pueden salir casi copiadas.', 'Huge models, images repeated many times in their data: they can come out nearly copied.');
    const src = S.l('Carlini y otros, 2023', 'Carlini et al., 2023');
    const sz = fs(S, 12.5), lines = d.wrap(txt, bw - 20 * k, { size: sz, weight: 700 }), bh = (lines.length + 1) * sz * S.u * 1.3 + 18 * k;
    const by = sideBy ? A.y + Math.max(0, (A.h - bh) / 2) : A.y + A.h - bh;
    d.withAlpha(cA, () => {
      d.rect(bx, by, bw, bh, { fill: er.soft, stroke: er.c, lw: 1.8, r: 4 });
      d.text(txt, bx + 10 * k, by + 9 * k, { size: sz, weight: 700, color: er.ink, base: 'top', w: bw - 20 * k });
      d.text(src, bx + 10 * k, by + bh - 9 * k, { size: fs(S, 12), weight: 600, color: p.mute, base: 'bottom', italic: true });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 11 · el precio: algo borrosas
// ═════════════════════════════════════════════════════════════════════════
const BLUR_REAL = Array.from({ length: 8 }, (_, i) => L.img(L.NTR + 100 + i)), BLUR_GEN = L.drawVAE(8, 91).img;
export function drawBlur(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = inset(S.full(), 14 * S.u, 16 * S.u), n = S.portrait ? 4 : 8, half = (R.h - 14 * k) / 2, capH = 26 * k;
  ([[S.l('dígitos reales', 'real digits'), BLUR_REAL, 'real', 0], [S.l('generados por el VAE: algo borrosos', 'generated by the VAE: somewhat blurry'), BLUR_GEN, 'model', 1]] as [string, Float32Array[], 'real' | 'model', number][]).forEach(([label, imgs, kind, i]) => {
    const top = R.y + i * (half + 14 * k), lay = tileLayout({ x: R.x, y: top + capH, w: R.w, h: half - capH }, n, { cols: n, gap: 10 * k, maxCell: 10, valign: 'center' });
    d.withAlpha(fr(S, 'blurry', 0.03 + 0.25 * i, 0.15 + 0.25 * i), () => {
      d.text(label, lay.x0, lay.y0 - 8 * k, { size: fs(S, 13), weight: 700, color: i ? tone(S, 'lat').ink : p.ink2, base: 'bottom', w: R.w });
      imgs.slice(0, n).forEach((im, j) => { const q = lay.pos(j); digit(S, q.x, q.y, im, lay.cell, { kind }); });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 12 · resumen y puente
// ═════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = inset(S.full(), 14 * S.u, 16 * S.u), por = S.portrait;
  // el titular: la idea de toda la lección
  const hs = fs(S, por ? 15 : 19), hA = fr(S, 'recap', 0.03, 0.15);
  const hh = d.wrap(S.l('La IA generativa no hace collage', 'Generative AI does not make collages'), R.w, { size: hs, weight: 800 }).length * hs * S.u * 1.3;
  d.text(S.l('La IA generativa no hace collage', 'Generative AI does not make collages'), R.x + R.w / 2, R.y, { size: hs, weight: 800, color: p.ink, align: 'center', base: 'top', w: R.w, a: hA });
  const top = R.y + hh + (por ? 14 : 30) * k, H = R.y + R.h - top;
  const labels = [S.l('datos reales', 'real data'), S.l('distribución aprendida', 'learned distribution'), S.l('muestrear', 'sample'), S.l('imagen nueva', 'new image')];
  const tones: Tone[] = ['dat', 'w', 'sig', 'lat'];
  const imgS = por ? Math.min(56 * k, H * 0.2) : Math.min(H * 0.36, 104 * k), cell = Math.max(4, Math.floor(imgS / 8));
  const bw = Math.min(200 * k, por ? R.w * 0.8 : R.w * 0.22), bh = (por ? 40 : 52) * k;
  const pos: Rect[] = por
    ? [0, 1, 2, 3].map((i) => ({ x: R.x + (R.w - bw) / 2, y: top + i * ((H - bh - 8 * cell - 34 * k) / 3), w: bw, h: bh }))
    : [0, 1, 2, 3].map((i) => ({ x: R.x + i * ((R.w - bw) / 3), y: top + H * 0.12, w: bw, h: bh }));
  pos.forEach((b, i) => { const a = fr(S, 'recap', 0.1 + 0.13 * i, 0.2 + 0.13 * i); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: fs(S, por ? 13.5 : 15) }); });
  for (let i = 0; i < 3; i++) { const a = fr(S, 'recap', 0.16 + 0.13 * i, 0.26 + 0.13 * i, 'io'); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  const last = pos[3], a = fr(S, 'recap', 0.62, 0.76), x = last.x + (last.w - 8 * cell) / 2, y = last.y + last.h + (por ? 8 : 18) * k;
  digit(S, x, y, NEW_IMG, cell, { kind: 'model', a });
  d.text(S.l('un siete que nunca existió', 'a seven that never existed'), x + 4 * cell, y + 8 * cell + 8 * k, { size: fs(S, 13), weight: 700, color: tone(S, 'lat').ink, align: 'center', base: 'top', a });
}
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(Math.min(6 * u, S.H / 40)));
  neu(S, cx - (24 * sc) / 2, cy - 24 * sc - 4 * u, { scale: sc, mood: 'happy', a: fr(S, 'bridge', 0.05, 0.2) });
  d.withAlpha(fr(S, 'bridge', 0.3, 0.45), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 14 * u, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center', base: 'top' });
    d.text(S.l('GAN: el falsificador y el detective', 'GANs: the forger and the detective'), cx, cy + 36 * u, { size: 20, weight: 800, align: 'center', base: 'top', w: S.W - 40 * u });
  });
}
