// Vistas finales: la difusión latente (lo que hicimos en el plano, y por qué sale más barato), Stable Diffusion en números,
// la historia y el costo en pasos, el resumen y el puente a la lección 18.
import { alpha, box, link, neu, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { T, vaeDec } from './models';
import { guidedJob } from './state';
import { fr, fz, kk, label, pix } from './helpers';

// ═════════ difusión latente ═════════
export function drawLatent(S: Frame) {
  const c = fr(S, 'latent-cost', 0.02, 0.16, 'io');
  if (c < 1) S.d.withAlpha(1 - c, () => drawPipeline(S));
  if (c > 0) S.d.withAlpha(c, () => drawCost64(S));
}
function drawPipeline(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, P = S.portrait, j = guidedJob(1);
  const q0 = j.traj[0], qT = j.traj[T] ?? j.traj[j.traj.length - 1];
  const num = (q: Float32Array) => `${S.n(q[0], 2)} · ${S.n(q[1], 2)}`.replace(/-/g, '−');
  const n = 5, gapL = P ? 20 * k : 26 * k;
  const bw = P ? Math.min(R.w * 0.8, 260 * k) : (R.w - (n - 1) * gapL) / n, bh = P ? Math.min(46 * k, (R.h - (n - 1) * gapL - 40 * k) / n) : 64 * k;
  const pos: Rect[] = Array.from({ length: n }, (_, i) => P ? { x: R.x + (R.w - bw) / 2, y: R.y + 4 * k + i * (bh + gapL), w: bw, h: bh } : { x: R.x + i * (bw + gapL), y: R.y + R.h * 0.42 - bh / 2, w: bw, h: bh });
  const labels = [S.l('2 números al azar', '2 random numbers'), S.l('50 pasos de regreso', '50 steps back'), S.l('código', 'code'), S.l('decodificador', 'decoder'), ''];
  const subs = [num(q0), S.l('la red del plano', 'the plane network'), qT ? num(qT) : '', S.l('del VAE', 'from the VAE'), ''];
  const tones = ['ink', 'w', 'lat', 'lat', 'ink'] as const;
  pos.forEach((b, i) => {
    const a = fr(S, 'latent-what', 0.08 + i * 0.1, 0.18 + i * 0.1);
    if (a <= 0.01) return;
    if (i < 4) {
      d.withAlpha(a, () => d.rect(b.x, b.y, b.w, b.h, { fill: alpha(tone(S, tones[i]).c, 0.1), stroke: tone(S, tones[i]).c, lw: 1.5, r: 3 }));
      label(S, labels[i], b.x + b.w / 2, b.y + b.h * 0.28, b.w - 8 * k, { size: 13, weight: 800, color: tone(S, tones[i]).ink, base: 'middle', a });
      label(S, subs[i], b.x + b.w / 2, b.y + b.h * 0.7, b.w - 8 * k, { size: 12, weight: 600, font: i === 0 || i === 2 ? 'mono' : 'ui', base: 'middle', a });
    } else if (qT) {
      const cell = Math.max(2, Math.floor(Math.min(b.h, b.w) / 8)), w = cell * 8;
      pix(S, b.x + (b.w - w) / 2, b.y + (b.h - w) / 2, vaeDec(qT[0], qT[1]), cell, { a, kind: 'model' });
    }
    if (i > 0) link(S, pos[i - 1], b, { tone: 'ink', progress: fr(S, 'latent-what', 0.06 + i * 0.1, 0.14 + i * 0.1) });
  });
  const ba = fr(S, 'latent-what', 0.62, 0.76);
  if (!P && ba > 0.01) {
    const x0 = pos[0].x, x1 = pos[2].x + pos[2].w, y = pos[0].y + bh + 18 * k;
    d.withAlpha(ba, () => { d.line(x0, y, x1, y, tone(S, 'lat').c, 2); d.line(x0, y - 5 * k, x0, y + 5 * k, tone(S, 'lat').c, 2); d.line(x1, y - 5 * k, x1, y + 5 * k, tone(S, 'lat').c, 2); });
    label(S, S.l('todo en el plano de códigos', 'all on the plane of codes'), (x0 + x1) / 2, y + 8 * k, x1 - x0, { size: 13, weight: 800, color: tone(S, 'lat').ink, a: ba });
    label(S, S.l('píxeles solo al final', 'pixels only at the end'), pos[3].x + (pos[4].x + pos[4].w - pos[3].x) / 2, y + 8 * k, pos[4].x + pos[4].w - pos[3].x, { size: 13, weight: 700, a: ba });
  }
  void p;
}
function drawCost64(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, P = S.portrait, gap = 3 * k;
  const sq = Math.max(5, Math.floor(Math.min(P ? R.w * 0.6 : R.w * 0.3, R.h * (P ? 0.36 : 0.55)) / 8 - gap)), gw = 8 * sq + 7 * gap;
  const Ax = P ? R.x + (R.w - gw) / 2 : R.x + R.w * 0.27 - gw / 2, Ay = P ? R.y + 26 * k : R.y + (R.h - gw) / 2;
  const Bx = P ? R.x + R.w / 2 - sq - gap / 2 : R.x + R.w * 0.73 - sq - gap / 2, By = P ? Ay + gw + 70 * k : Ay + (gw - sq) / 2;
  const a1 = fr(S, 'latent-cost', 0.15, 0.3), a2 = fr(S, 'latent-cost', 0.4, 0.55), dat = tone(S, 'dat'), lat = tone(S, 'lat');
  for (let i = 0; i < 64; i++) { const e = a1 * fr(S, 'latent-cost', 0.15 + i * 0.003, 0.2 + i * 0.003); d.rect(Ax + (i % 8) * (sq + gap), Ay + Math.floor(i / 8) * (sq + gap), sq, sq, { fill: alpha(dat.c, 0.55), stroke: dat.c, lw: 1, a: e }); }
  for (let i = 0; i < 2; i++) d.rect(Bx + i * (sq + gap), By, sq, sq, { fill: alpha(lat.c, 0.55), stroke: lat.c, lw: 1, a: a2 });
  label(S, S.l('en píxeles: 64 números por paso', 'in pixels: 64 numbers per step'), Ax + gw / 2, Ay - 8 * k, P ? R.w : R.w * 0.46, { size: 13, weight: 800, color: dat.ink, base: 'bottom', a: a1 });
  label(S, S.l('en el plano: 2 números por paso', 'on the plane: 2 numbers per step'), Bx + sq + gap / 2, By - 8 * k, P ? R.w : R.w * 0.46, { size: 13, weight: 800, color: lat.ink, base: 'bottom', a: a2 });
  label(S, S.l('con fotos grandes, la diferencia es enorme', 'with large photos, the difference is huge'), R.x + R.w / 2, R.y + R.h - 6 * k, R.w, { size: 13, weight: 700, color: p.ink, base: 'bottom', a: fr(S, 'latent-cost', 0.7, 0.82) });
}

// ═════════ Stable Diffusion en números ═════════
export function drawSD(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all, P = S.portrait, labH = 40 * k;
  const big = Math.min(P ? R.w * 0.62 : R.w * 0.38, (P ? R.h * 0.5 : R.h - 2 * labH - 30 * k)), sm = big / Math.sqrt(48);
  const bx = P ? R.x + (R.w - big) / 2 : R.x + R.w * 0.3 - big / 2, by = P ? R.y + labH : R.y + (R.h - big) / 2 + 6 * k;
  const sx = P ? R.x + (R.w - sm) / 2 : R.x + R.w * 0.76 - sm / 2, sy = P ? by + big + labH + 34 * k : by + (big - sm) / 2;
  const a1 = fr(S, 'sd', 0.3, 0.42), a2 = fr(S, 'sd', 0.6, 0.72), dat = tone(S, 'dat'), lat = tone(S, 'lat');
  d.rect(bx, by, big, big, { fill: alpha(dat.c, 0.18), stroke: dat.c, lw: 1.5, a: a1 });
  d.rect(sx, sy, sm, sm, { fill: alpha(lat.c, 0.45), stroke: lat.c, lw: 1.5, a: a2 });
  const loc = S.lang === 'es' ? 'es' : 'en';
  label(S, S.l('foto: 512 × 512 píxeles × 3 colores', 'photo: 512 × 512 pixels × 3 colors'), bx + big / 2, by - 8 * k, P ? R.w : R.w * 0.5, { size: 13, weight: 800, color: dat.ink, base: 'bottom', a: a1 });
  label(S, S.l(`${S.n(786432, 0)} números`, `${S.n(786432, 0)} numbers`), bx + big / 2, by + big / 2, big - 8 * k, { size: 16, weight: 800, font: 'mono', color: p.ink, base: 'middle', a: a1 });
  const lx = P ? sx + sm / 2 : sx + sm / 2, lw = P ? R.w : R.w * 0.4;
  label(S, S.l('código: 64 × 64 × 4', 'code: 64 × 64 × 4'), lx, sy - 8 * k, lw, { size: 13, weight: 800, color: lat.ink, base: 'bottom', a: a2 });
  label(S, S.l(`${S.n(16384, 0)} números`, `${S.n(16384, 0)} numbers`), lx, sy + sm + 6 * k, lw, { size: 14, weight: 800, font: 'mono', color: p.ink, a: a2 });
  const ea = fr(S, 'sd', 0.8, 0.9);
  label(S, S.l('48 veces menos', '48 times fewer'), lx, sy + sm + 30 * k, lw, { size: 14, weight: 800, color: lat.ink, a: ea });
  label(S, S.l('Stable Diffusion · agosto de 2022', 'Stable Diffusion · August 2022'), R.x + R.w / 2, R.y + 2 * k, R.w, { size: 12, weight: 600, color: p.mute, a: fr(S, 'sd', 0.05, 0.2) * (P ? 0 : 1) });
  void loc;
}

// ═════════ historia y costo ═════════
export function drawHist(S: Frame) {
  const { d, pal: p } = S, k = kk(S), R = regions(S, 1).all;
  const short = !S.portrait && R.h < 330 * k;
  const y = short ? R.y + R.h * 0.4 : R.y + R.h * 0.24, x0 = R.x + R.w * (short ? 0.03 : 0.1), x1 = R.x + R.w * (short ? 0.55 : 0.9), la = fr(S, 'history', 0.05, 0.2);
  d.line(x0, y, x1, y, p.lineStrong, 2, undefined, la);
  const evs = [
    { yr: '2015', t: S.l('la idea: aprender a deshacer el ruido', 'the idea: learn to undo noise'), who: 'Sohl-Dickstein et al.', at: 0.12 },
    { yr: '2020', t: S.l('DDPM: imágenes de gran calidad', 'DDPM: high-quality images'), who: 'Ho et al.', at: 0.55 },
    { yr: '2022', t: S.l('difusión latente: Stable Diffusion', 'latent diffusion: Stable Diffusion'), who: 'Rombach et al.', at: 0.8 },
  ];
  const cw = (x1 - x0) / 3;
  let bottom = y;
  evs.forEach((e, i) => {
    const a = i < 2 ? fr(S, 'history', e.at, e.at + 0.1) : fr(S, 'history', 0.82, 0.92), x = x0 + cw * (i + 0.5);
    if (a <= 0.01) return;
    d.circle(x, y, 6 * k, { fill: tone(S, 'w').c, stroke: p.stage, lw: 2, a });
    d.text(e.yr, x, y - 12 * k, { size: fz(S, 16), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'bottom', a });
    const h = label(S, e.t, x, y + 12 * k, cw - 10 * k, { size: 12, weight: 700, a }).h;
    const h2 = label(S, e.who, x, y + 16 * k + h, cw - 10 * k, { size: 12, weight: 500, color: p.mute, a }).h;
    bottom = Math.max(bottom, y + 16 * k + h + h2);
  });
  // pasos por imagen
  const ca = fr(S, 'steps-cost', 0.15, 0.3);
  if (ca > 0.01) {
    const bw = short ? R.w * 0.36 : R.w * 0.66, bx = short ? R.x + R.w * 0.61 : R.x + (R.w - bw) / 2, bh = 20 * k, er = tone(S, 'err'), sg = tone(S, 'sig');
    const by = short ? R.y + R.h * 0.3 : Math.max(R.y + R.h * 0.6, bottom + 64 * k), bcx = bx + bw / 2, bW = short ? bw : R.w;
    label(S, S.l('pasos de la red por imagen', 'network steps per image'), bcx, by - 30 * k, bW, { size: 13, weight: 800, color: p.ink, base: 'bottom', a: ca });
    const rows = [{ t: S.l('DDPM: 1 000', 'DDPM: 1,000'), v: 1000, tn: er, a: ca }, { t: S.l('esta lección: 50', 'this lesson: 50'), v: 50, tn: sg, a: fr(S, 'steps-cost', 0.4, 0.55) }];
    rows.forEach((r, i) => {
      const yy = by + i * (bh + 30 * k), w = Math.max(3, (bw * r.v) / 1000);
      d.rect(bx, yy, w, bh, { fill: alpha(r.tn.c, 0.5), stroke: r.tn.c, lw: 1.2, a: r.a });
      d.text(r.t, bx, yy - 4 * k, { size: fz(S, 12), weight: 700, color: r.tn.ink, base: 'bottom', a: r.a });
    });
    label(S, S.l('DDIM: de 10 a 50 veces más rápido', 'DDIM: 10 to 50 times faster'), bcx, by + 2 * (bh + 30 * k) - 8 * k, bW, { size: 13, weight: 700, a: fr(S, 'steps-cost', 0.7, 0.82) });
  }
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame) {
  const k = kk(S), R = regions(S, 1).all, P = S.portrait;
  const items = [
    S.l('1 · destruir con ruido: fácil y fijo', '1 · destroying with noise: easy and fixed'),
    S.l('2 · una red aprende a estimar el ruido', '2 · a network learns to estimate the noise'),
    S.l('3 · generar: quitarlo poco a poco desde estática', '3 · generating: remove it bit by bit from static'),
    S.l('4 · una pista guía; en el espacio de códigos, más barato', '4 · a hint steers; in code space, cheaper'),
  ];
  const tones = ['err', 'w', 'sig', 'lat'] as const, gap = 16 * k;
  const bw = P ? Math.min(R.w, 300 * k) : Math.min((R.w - gap) / 2, 340 * k), bh = P ? Math.min(58 * k, (R.h - 3 * gap) / 4) : 66 * k;
  items.forEach((t, i) => {
    const a = fr(S, 'recap', 0.06 + i * 0.2, 0.16 + i * 0.2), col = P ? 0 : i % 2, row = P ? i : Math.floor(i / 2);
    const x = P ? R.x + (R.w - bw) / 2 : R.x + R.w / 2 + (col ? gap / 2 : -bw - gap / 2), y = R.y + (R.h - (P ? 4 * bh + 3 * gap : 2 * bh + gap)) / 2 + row * (bh + gap);
    if (a <= 0.01) return;
    S.d.withAlpha(a, () => S.d.rect(x, y, bw, bh, { fill: alpha(tone(S, tones[i]).c, 0.1), stroke: tone(S, tones[i]).c, lw: 1.5, r: 3 }));
    label(S, t, x + bw / 2, y + bh / 2, bw - 14 * k, { size: 13, weight: 700, color: tone(S, tones[i]).ink, base: 'middle', a });
  });
}
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, k = kk(S), cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(5 * S.u));
  neu(S, cx - 12 * sc, cy - 26 * sc - 30 * k, { scale: sc, mood: 'think', a: fr(S, 'bridge', 0.05, 0.2) });
  const qa = fr(S, 'bridge', 0.15, 0.3);
  if (qa > 0.01) d.tag(S.l('«un gato astronauta»', '“an astronaut cat”'), cx, cy + 6 * k, { size: fz(S, 15), color: tone(S, 'lat').ink, fill: tone(S, 'lat').soft, stroke: tone(S, 'lat').c, a: qa });
  const ba = fr(S, 'bridge', 0.6, 0.75);
  label(S, S.l('Siguiente', 'Next'), cx, cy + 44 * k, S.W - 32 * k, { size: 13, color: p.mute, a: ba });
  label(S, S.l('De texto a imagen', 'From text to image'), cx, cy + 64 * k, S.W - 32 * k, { size: 24, weight: 800, color: p.ink, a: ba });
  void box;
}
