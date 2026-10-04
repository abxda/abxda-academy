// Historia y límites: Rosenblatt (1958) y el Mark I Perceptron, neurona real vs. artificial, la promesa de 1958, el resumen y el puente al XOR.
import { Plot, alpha, clamp, lerp, link, neu, tone, upscale, textGrid, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { drawBio } from './intro';
import { arrow, fit, fs, parts, tag, tau, tr, txt } from './ui';

// ═════════════════════════════════════════════════════════════════════════
// 1958: el ojo de fotoceldas y las perillas
// ═════════════════════════════════════════════════════════════════════════
const RETINA = (() => {
  const g = upscale(textGrid('A'), 2), out: number[][] = Array.from({ length: 20 }, () => Array(20).fill(0));
  g.forEach((row, r) => row.forEach((v, c) => { out[r + 3][c + 5] = v; }));
  return out;
})();

function knob(S: Frame, cx: number, cy: number, r: number, ang: number) {
  const { d, pal: p } = S, wt = tone(S, 'w');
  d.circle(cx, cy, r, { fill: alpha(wt.c, 0.12), stroke: wt.c, lw: 2 });
  for (let i = 0; i <= 8; i++) { const a = -Math.PI * 0.75 + (i / 8) * Math.PI * 1.5 - Math.PI / 2; d.line(cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 1.12, cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, p.lineStrong, 1.2); }
  const a = ang - Math.PI / 2;
  d.line(cx, cy, cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, wt.ink, 3);
  d.circle(cx, cy, r * 0.16, { fill: wt.ink });
}

export function drawRosenblatt(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, sg = tone(S, 'sig'), wt = tone(S, 'w');
  const aY = S.reveal('rosenblatt', 0.1, 0.6);
  const head = (port ? 78 : 92) * u;
  d.withAlpha(aY, () => {
    d.text('1958', D.x + 4 * u, D.y, { size: fs(S, port ? 34 : 42), font: 'pixel', weight: 700, color: p.ink, base: 'top' });
    txt(S, 'Frank Rosenblatt', D.x + (port ? 150 : 190) * u, D.y + 6 * u, { size: port ? 15 : 17, weight: 800, color: p.ink, base: 'top' });
    txt(S, 'Cornell Aeronautical Laboratory', D.x + (port ? 150 : 190) * u, D.y + (port ? 26 : 30) * u, { size: 13, weight: 600, color: p.ink2, base: 'top', w: D.w - (port ? 156 : 196) * u });
  });
  const area: Rect = { x: D.x, y: D.y + head, w: D.w, h: D.h - head };
  const mk = S.at('mark1', 0, 0.8, 'io');
  const cell = clamp(Math.min((area.h - 54 * u) / 20, (port ? area.w * 0.42 : area.w * 0.32) / 20), 4 * u, 12 * u);
  const rx = area.x + 8 * u, ry = area.y + (area.h - 54 * u - cell * 20) / 2 + 4 * u;
  // retina de 20 × 20
  const aR = S.reveal('rosenblatt', 0.5, 0.7);
  d.withAlpha(aR, () => {
    for (let r = 0; r < 20; r++) for (let c = 0; c < 20; c++) d.rect(rx + c * cell, ry + r * cell, cell - 0.8, cell - 0.8, { fill: RETINA[r][c] ? alpha(sg.c, 0.9) : p.surface2 });
    d.rect(rx - 1, ry - 1, cell * 20 + 1.6, cell * 20 + 1.6, { stroke: p.lineStrong, lw: 1.5 });
    d.withAlpha(1 - mk, () => tag(S, S.l('400 entradas', '400 inputs'), rx + cell * 10, ry + cell * 20 + 20 * u, { tone: 'sig' }));
    d.withAlpha(mk, () => tag(S, S.l('400 fotoceldas', '400 photocells'), rx + cell * 10, ry + cell * 20 + 20 * u, { tone: 'sig' }));
  });
  // destino: neurona (1958) o panel de perillas (Mark I)
  const tx = area.x + area.w * (port ? 0.76 : 0.74), ty = ry + cell * 10;
  const aN = S.reveal('rosenblatt', 1.1, 0.7);
  // abanico de conexiones con peso (ámbar)
  d.withAlpha(aN, () => {
    const n = 14, target = { x: tx - (mk > 0.5 ? (port ? 42 : 66) * u : 30 * u), y: ty };
    for (let i = 0; i < n; i++) { const y0 = ry + 6 * u + (i / (n - 1)) * (cell * 20 - 12 * u); d.line(rx + cell * 20 + 2, y0, target.x, ty + (i / (n - 1) - 0.5) * (mk > 0.5 ? 50 * u : 24 * u), alpha(wt.c, 0.5), 1 + 1.4 * ((i * 7) % 5) / 4, i % 4 === 3 ? [5, 4] : undefined); }
  });
  if (mk < 1) d.withAlpha(aN * (1 - mk), () => {
    const R = (port ? 28 : 34) * u;
    d.circle(tx, ty, R, { fill: alpha(sg.c, 0.14), stroke: sg.c, lw: 2.5 });
    d.text('Σ f', tx, ty, { size: fs(S, 18), weight: 800, color: sg.ink, align: 'center', base: 'middle' });
    arrow(S, tx + R, ty, tx + R + (port ? 14 : 26) * u, ty, p.ink2, 2, 8);
    tag(S, S.l('perceptrón simple', 'simple perceptron'), tx, ty + R + 20 * u, { tone: 'sig' });
  });
  if (mk > 0) d.withAlpha(mk, () => {
    // panel de potenciómetros: cada perilla es un peso
    const cols = port ? 3 : 4, rows = port ? 3 : 2, kr = (port ? 13 : 17) * u, gx = kr * 3.1, gy = kr * 3.3;
    const px0 = tx - (cols * gx) / 2 + gx / 2 + (port ? 10 : 22) * u, py0 = ty - ((rows - 1) * gy) / 2;
    d.rect(px0 - gx * 0.62, py0 - gy * 0.7, cols * gx + gx * 0.24, rows * gy + gy * 0.15, { fill: alpha(p.surface, 0.7), stroke: p.lineStrong, lw: 1.5, r: 6 * u });
    const T = S.reduced ? 0 : S.clock;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c; knob(S, px0 + c * gx, py0 + r * gy, kr, Math.sin(T * 0.9 + i * 1.7) * 1.9 + (i % 3 - 1) * 0.3); }
    tag(S, S.l('512 potenciómetros', '512 potentiometers'), px0 + ((cols - 1) * gx) / 2, py0 + rows * gy - gy * 0.2 + 12 * u, { tone: 'w' });
    tag(S, S.l('pesos girados por motores', 'weights turned by motors'), px0 + ((cols - 1) * gx) / 2, py0 + rows * gy - gy * 0.2 + 38 * u, { size: 12 });
    tag(S, S.l('conexiones al azar', 'random wiring'), (rx + cell * 20 + px0 - gx * 0.62) / 2, ry - 12 * u, { size: 12 });
  });
  d.withAlpha(S.reveal('rosenblatt', 1.6, 0.6) * (1 - mk), () => tag(S, S.l('esquema simplificado', 'simplified sketch'), area.x + area.w / 2, area.y + area.h - 8 * u, { size: 12 }));
  d.withAlpha(S.reveal('mark1', 0.6, 0.6), () => tag(S, 'Mark I Perceptron', area.x + area.w / 2, area.y + area.h - 8 * u, { tone: 'w', size: 13 }));
}

// ═════════════════════════════════════════════════════════════════════════
// Neurona artificial frente a neurona real
// ═════════════════════════════════════════════════════════════════════════
/** La neurona artificial en miniatura: dos entradas, el cuerpo «Σ f» y una salida. */
function miniNeuron(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), wt = tone(S, 'w');
  const cy = r.y + r.h / 2, ix = r.x + r.w * 0.16, bx = r.x + r.w * 0.5, ox = r.x + r.w * 0.84, br = Math.min(26 * u, r.h * 0.3), ir = Math.min(12 * u, r.h * 0.14), dy = Math.min(r.h * 0.3, 34 * u);
  [-1, 1].forEach((k, i) => {
    d.line(ix + ir, cy + k * dy, bx - br * 0.9, cy + k * dy * 0.35, wt.c, 2.2, i === 1 ? [6, 4] : undefined);
    d.circle(ix, cy + k * dy, ir, { fill: alpha(sg.c, 0.14), stroke: sg.c, lw: 2 });
    txt(S, i === 0 ? 'x₁' : 'x₂', ix, cy + k * dy, { size: 12, weight: 700, color: sg.ink, align: 'center', base: 'middle' });
  });
  d.circle(bx, cy, br, { fill: alpha(sg.c, 0.14), stroke: sg.c, lw: 2.5 });
  d.text('Σ f', bx, cy, { size: fs(S, 18), weight: 800, color: sg.ink, align: 'center', base: 'middle' });
  arrow(S, bx + br, cy, ox - ir - 2, cy, p.ink2, 2, 8);
  d.circle(ox, cy, ir, { fill: alpha(sg.c, 0.7), stroke: sg.c, lw: 2 });
  txt(S, 'y', ox, cy, { size: 12, weight: 800, color: p.stage, align: 'center', base: 'middle' });
}

export function drawLimits(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, sg = tone(S, 'sig'), wt = tone(S, 'w');
  const gap = 14 * u, H = D.h * (port ? 1 : 0.86), oy = D.y + (D.h - H) / 2;
  const L: Rect = port ? { x: D.x, y: oy, w: D.w, h: H * 0.5 - gap / 2 } : { x: D.x, y: oy, w: D.w * 0.5 - gap / 2, h: H };
  const R: Rect = port ? { x: D.x, y: oy + H * 0.5 + gap / 2, w: D.w, h: H * 0.5 - gap / 2 } : { x: D.x + D.w * 0.5 + gap / 2, y: oy, w: D.w * 0.5 - gap / 2, h: H };
  const panel = (r: Rect, a: number, tone_: 'sig' | 'w') => d.withAlpha(a, () => d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.surface, 0.55), stroke: tone(S, tone_).c, lw: 1.5, r: 10 * u }));
  const a1 = S.reveal('limits', 0.1, 0.6), a2 = tr(tau(S, 'limits'), 0.5, 0.62);
  // izquierda: artificial = fórmula
  panel(L, a1, 'w');
  d.withAlpha(a1, () => {
    tag(S, S.l('Neurona artificial', 'Artificial neuron'), L.x + L.w / 2, L.y + 22 * u, { tone: 'w', size: 13 });
    miniNeuron(S, { x: L.x + 12 * u, y: L.y + 36 * u, w: L.w - 24 * u, h: L.h * (port ? 0.40 : 0.36) });
    parts(S, [['y', sg.ink, true], [' = f(', p.ink2], ['w₁', wt.ink, true], ['x₁', sg.ink, true], [' + ', p.ink2], ['w₂', wt.ink, true], ['x₂', sg.ink, true], [' + ', p.ink2], ['b', wt.ink, true], [')', p.ink2]], L.x + L.w / 2, L.y + L.h * (port ? 0.66 : 0.64), { size: port ? 15 : 17 });
    const chips = [S.l('multiplicar', 'multiply'), S.l('sumar', 'add'), S.l('activar', 'activate')];
    const cw = L.w / 3, cyy = L.y + L.h * (port ? 0.86 : 0.84);
    chips.forEach((c, i) => tag(S, c, L.x + cw * (i + 0.5), cyy, { tone: 'w', size: 12 }));
  });
  // derecha: real = célula viva
  panel(R, a2, 'sig');
  d.withAlpha(a2, () => {
    tag(S, S.l('Neurona real', 'Real neuron'), R.x + R.w / 2, R.y + 22 * u, { tone: 'sig', size: 13 });
    drawBio(S, { x: R.x + 8 * u, y: R.y + 36 * u, w: R.w - 16 * u, h: R.h * (port ? 0.60 : 0.58) }, { labels: 0, a: 1 });
    const chips = [S.l('química', 'chemistry'), S.l('tiempo', 'timing'), S.l('energía', 'energy')];
    const cw = R.w / 3, cyy = R.y + R.h * (port ? 0.90 : 0.86);
    chips.forEach((c, i) => tag(S, c, R.x + cw * (i + 0.5), cyy, { tone: 'sig', size: 12 }));
  });
}

export function drawReal(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const cards: { v: string; l: string; src: string; t: 'w' | 'sig' | 'lat' }[] = [
    { v: '3', l: S.l('parámetros en nuestra neurona', 'parameters in our neuron'), src: S.l('esta lección', 'this lesson'), t: 'w' },
    { v: S.l('86 000 000 000', '86,000,000,000'), l: S.l('neuronas en un cerebro humano adulto (promedio de varones, ± 8 mil millones)', 'neurons in an adult human brain (male average, ± 8 billion)'), src: 'Azevedo et al., 2009', t: 'sig' },
    { v: S.l('5 a 8', '5 to 8'), l: S.l('capas de una red artificial para imitar un modelo detallado de una neurona piramidal de la corteza', 'layers of an artificial network to imitate a detailed model of one cortical pyramidal neuron'), src: 'Beniaguev et al., 2021', t: 'lat' },
  ];
  const gap = 12 * u, n = cards.length, H = port ? D.h : D.h * 0.62, oy = D.y + (D.h - H) / 2;
  cards.forEach((c, i) => {
    const r: Rect = port ? { x: D.x, y: oy + i * ((H - gap * (n - 1)) / n + gap), w: D.w, h: (H - gap * (n - 1)) / n } : { x: D.x + i * ((D.w - gap * (n - 1)) / n + gap), y: oy, w: (D.w - gap * (n - 1)) / n, h: H };
    const tR = tau(S, 'real'), a = i === 0 ? S.reveal('real', 0.2, 0.6) : tr(tR, i === 1 ? 0.08 : 0.5, i === 1 ? 0.2 : 0.62), t = tone(S, c.t);
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.07), stroke: t.c, lw: 1.5, r: 10 * u });
      const maxW = r.w - 24 * u;
      let size = 40; while (size > 18 && d.measure(c.v, { size: fs(S, size), weight: 800, font: 'mono' }) > maxW) size -= 1;
      d.text(c.v, r.x + 14 * u, r.y + (port ? 12 : 20) * u, { size: fs(S, size), weight: 800, font: 'mono', color: t.ink, base: 'top' });
      const vy = r.y + (port ? 12 : 20) * u + fs(S, size) * u * 1.25;
      txt(S, c.l, r.x + 14 * u, vy + 8 * u, { size: 15, weight: 600, color: p.ink, base: 'top', w: r.w - 28 * u });
      txt(S, c.src, r.x + 14 * u, r.y + r.h - 10 * u, { size: 12, color: p.mute, base: 'bottom' });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 1958: lo que dijo la prensa y lo que se demostró
// ═════════════════════════════════════════════════════════════════════════
export function drawHype(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, er = tone(S, 'err'), dt = tone(S, 'dat');
  const gap = 14 * u, H = port ? D.h : D.h * (D.h > 420 ? 0.6 : 0.74), oy = D.y + (D.h - H) / 2;
  const A: Rect = port ? { x: D.x, y: oy, w: D.w, h: H * 0.5 - gap / 2 } : { x: D.x, y: oy, w: D.w * 0.5 - gap / 2, h: H };
  const B: Rect = port ? { x: D.x, y: oy + H * 0.5 + gap / 2, w: D.w, h: H * 0.5 - gap / 2 } : { x: D.x + D.w * 0.5 + gap / 2, y: oy, w: D.w * 0.5 - gap / 2, h: H };
  const a1 = S.reveal('hype', 0.2, 0.6), a2 = S.reveal('demo', 0.2, 0.6);
  const pad = 14 * u, qs = port ? 15 : 18;
  d.withAlpha(a1, () => {
    d.rect(A.x, A.y, A.w, A.h, { fill: alpha(p.surface, 0.7), stroke: er.c, lw: 1.5, r: 8 * u });
    tag(S, S.l('Lo que dijo la prensa', 'What the press said'), A.x + pad, A.y + 22 * u, { tone: 'err', align: 'left', size: 12 });
    const dl = S.l('The New York Times (UPI) · 8 de julio de 1958', 'The New York Times (UPI) · July 8, 1958');
    const wraps = d.measure(dl, { size: fs(S, 12), weight: 600 }) > A.w - 2 * pad;
    txt(S, dl, A.x + pad, A.y + 46 * u, { size: 12, weight: 600, color: p.mute, base: 'top', w: A.w - 2 * pad });
    const q = S.l('«…que espera que sea capaz de caminar, hablar, ver, escribir, reproducirse y ser consciente de su existencia.»', '“…that it expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence.”');
    txt(S, q, A.x + pad, A.y + (wraps ? 92 : 74) * u, { size: qs, weight: 600, color: p.ink, base: 'top', w: A.w - 2 * pad, lh: 1.35 });
    if (S.lang === 'es') txt(S, '(traducción)', A.x + pad, A.y + A.h - 10 * u, { size: 12, color: p.mute, base: 'bottom' });
  });
  d.withAlpha(a2, () => {
    d.rect(B.x, B.y, B.w, B.h, { fill: alpha(p.surface, 0.7), stroke: dt.c, lw: 1.5, r: 8 * u });
    tag(S, S.l('Lo que se demostró', 'What was demonstrated'), B.x + pad, B.y + 22 * u, { tone: 'dat', align: 'left', size: 12 });
    const q = S.l('Tras 50 ensayos, un IBM 704 aprendió a distinguir tarjetas marcadas a la izquierda de las marcadas a la derecha.', 'After 50 trials, an IBM 704 learned to tell cards marked on the left from cards marked on the right.');
    txt(S, 'Cornell Chronicle · 2019', B.x + pad, B.y + 46 * u, { size: 12, weight: 600, color: p.mute, base: 'top', w: B.w - 2 * pad });
    txt(S, q, B.x + pad, B.y + 74 * u, { size: qs, weight: 600, color: p.ink, base: 'top', w: B.w - 2 * pad, lh: 1.35 });
    // dos tarjetas: marca a la izquierda y a la derecha
    const cw = Math.min(58 * u, B.w * 0.17), ch = cw * 0.64, cy = B.y + B.h - ch - (port ? 12 : 28) * u, cx0 = B.x + B.w / 2 - cw - 16 * u;
    [0, 1].forEach((k) => {
      const x = cx0 + k * (cw + 32 * u);
      d.rect(x, cy, cw, ch, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 3 });
      d.rect(k === 0 ? x + 5 * u : x + cw - 5 * u - 12 * u, cy + ch / 2 - 6 * u, 12 * u, 12 * u, { fill: dt.c });
    });
    txt(S, S.l('izquierda', 'left'), cx0 + cw / 2, cy - 6 * u, { size: 12, color: p.mute, align: 'center', base: 'bottom' });
    txt(S, S.l('derecha', 'right'), cx0 + cw + 32 * u + cw / 2, cy - 6 * u, { size: 12, color: p.mute, align: 'center', base: 'bottom' });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Resumen y puente
// ═════════════════════════════════════════════════════════════════════════
/** Caja de un paso del bucle: título y subtítulo, ambos de ≥ 12 px. */
function stepBox(S: Frame, r: Rect, title: string, sub: string, tn: Tone, a: number, active: number) {
  const { d, pal: p } = S, t = tone(S, tn), u = S.u;
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.28 * active), stroke: t.c, lw: 1.5, r: 3 });
    txt(S, title, r.x + r.w / 2, r.y + r.h * 0.36, { size: 15, weight: 700, color: t.ink, align: 'center', base: 'middle' });
    txt(S, sub, r.x + r.w / 2, r.y + r.h * 0.70, { size: 12, weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w - 12 * u });
  });
}

export function drawRecap(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const items = [
    { l: S.l('1 · Multiplicar', '1 · Multiply'), s: S.l('entradas × pesos', 'inputs × weights'), t: 'w' as const },
    { l: S.l('2 · Sumar', '2 · Add'), s: S.l('Σ + sesgo b', 'Σ + bias b'), t: 'dat' as const },
    { l: S.l('3 · Activar', '3 · Activate'), s: S.l('f(z): escalón o sigmoide', 'f(z): step or sigmoid'), t: 'sig' as const },
    { l: S.l('4 · Corregir', '4 · Correct'), s: S.l('ajustar w y b con los errores', 'adjust w and b from errors'), t: 'err' as const },
  ];
  const bw = port ? Math.min(250 * u, D.w - 76 * u) : Math.min(236 * u, D.w * 0.38), bh = 62 * u;
  const pos: Rect[] = port
    ? items.map((_, i) => ({ x: D.x + 8 * u, y: D.y + 6 * u + i * (bh + (D.h - 4 * bh - 12 * u) / 3), w: bw, h: bh }))
    : [{ x: D.x + D.w * 0.5 - bw - 36 * u, y: D.y + D.h * 0.16, w: bw, h: bh }, { x: D.x + D.w * 0.5 + 36 * u, y: D.y + D.h * 0.16, w: bw, h: bh }, { x: D.x + D.w * 0.5 + 36 * u, y: D.y + D.h * 0.6, w: bw, h: bh }, { x: D.x + D.w * 0.5 - bw - 36 * u, y: D.y + D.h * 0.6, w: bw, h: bh }];
  const hot = Math.floor(S.clock / 1.2) % 4;
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.2 + i * 0.4, 0.5); if (a > 0) stepBox(S, b, items[i].l, items[i].s, items[i].t, a, !S.reduced && i === hot ? 1 : 0); });
  const nLinks = port ? 3 : 4;
  for (let i = 0; i < nLinks; i++) { const a = S.at('recap', 0.7 + i * 0.4, 1.2 + i * 0.4); if (a > 0) link(S, pos[i], pos[(i + 1) % 4], { tone: 'ink', progress: a }); }
  if (port) {
    // en vertical, el regreso del paso 4 al 1 rodea las cajas por la derecha
    const a = S.at('recap', 0.7 + 3 * 0.4, 1.2 + 3 * 0.4);
    if (a > 0) {
      const b4 = pos[3], b1 = pos[0], x0 = b4.x + b4.w, x1 = x0 + 26 * u, y4 = b4.y + b4.h / 2, y1 = b1.y + b1.h / 2;
      d.withAlpha(a, () => { d.polyline([[x0, y4], [x1, y4], [x1, y1]], p.ink, 2); arrow(S, x1, y1, x0, y1, p.ink, 2, 8); });
    }
  }
  neu(S, port ? D.x + D.w - 62 * u : D.x + D.w / 2 - 36 * u, D.y + D.h * (port ? 0.42 : 0.36) + (port ? 0 : 6 * u), { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 2.2, 0.5) });
}

const XOR: { x: number; y: number; t: 0 | 1 }[] = [{ x: 0, y: 0, t: 0 }, { x: 1, y: 1, t: 0 }, { x: 0, y: 1, t: 1 }, { x: 1, y: 0, t: 1 }];
const XLINES: [number, number, number][] = [[0, 1, -0.5], [1, 0, -0.5], [1, 1, -0.99]];

export function drawBridge(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, er = tone(S, 'err');
  const pr: Rect = port ? fit({ x: D.x, y: D.y, w: D.w, h: D.h * 0.56 }, 1) : fit({ x: D.x + D.w * 0.02, y: D.y, w: D.w * 0.46, h: D.h }, 1);
  const plot = new Plot(S, pr, { xr: [-0.35, 1.35], yr: [-0.35, 1.35], pad: { l: 0, r: 0, t: 0, b: 0 } }), r = plot.r;
  const a = S.reveal('bridge', 0.1, 0.6);
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 1.5 });
    const k = S.reduced ? 0 : Math.floor(Math.max(0, S.since('bridge') - 1.2) / 1.5) % XLINES.length;
    const [w1, w2, b] = XLINES[k];
    const pts: [number, number][] = [];
    if (Math.abs(w2) > 1e-9) { pts.push([-0.35, -(w1 * -0.35 + b) / w2], [1.35, -(w1 * 1.35 + b) / w2]); } else { pts.push([-b / w1, -0.35], [-b / w1, 1.35]); }
    const q = clamp(S.since('bridge') - 0.8, 0, 1);
    d.line(plot.X(pts[0][0]), plot.Y(pts[0][1]), lerp(plot.X(pts[0][0]), plot.X(pts[1][0]), q), lerp(plot.Y(pts[0][1]), plot.Y(pts[1][1]), q), p.ink, 3, [8, 6]);
    XOR.forEach((s) => {
      plot.datum(s.x, s.y, s.t, { r: 7 });
      const pred = w1 * s.x + w2 * s.y + b >= 0 ? 1 : 0;
      if (pred !== s.t && S.since('bridge') > 1.3) d.circle(plot.X(s.x), plot.Y(s.y), 17 * u, { stroke: er.c, lw: 2.5 });
    });
  });
  // título
  const tx = port ? D.x + D.w / 2 : D.x + D.w * 0.56, tw = port ? D.w - 16 * u : D.w * 0.42, ty = port ? D.y + D.h * 0.64 : D.y + D.h * 0.34;
  d.withAlpha(S.reveal('bridge', 1.0, 0.6), () => {
    txt(S, S.l('Siguiente', 'Next'), tx, ty, { size: 13, weight: 700, color: p.mute, align: port ? 'center' : 'left', base: 'top' });
    txt(S, S.l('Lo que una neurona no puede', 'What a neuron cannot do'), tx, ty + 24 * u, { size: port ? 24 : 28, weight: 800, align: port ? 'center' : 'left', base: 'top', w: tw });
  });
  neu(S, port ? D.x + D.w / 2 - 36 * u : D.x + D.w * 0.56, port ? D.y + D.h * 0.86 : D.y + D.h * 0.68, { scale: Math.max(3, Math.round(3.2 * u)), mood: 'think', a: S.reveal('bridge', 1.6, 0.6) });
}
