// Vistas 1 y 2: la pregunta (¿dónde se guardan setenta mil millones de números?) y la GPU por partes: el chip con sus núcleos,
// la memoria junto al chip, su nombre (VRAM) y su tamaño, a la misma escala para una H100 y una RTX 3060.
// El esquema de la H100 no está a escala: 256 cuadros de núcleos (cada uno ≈ 66 de sus 16 896) y 5 pilas de memoria de 16 GB.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { PATCH } from './real-data';
import { H100 } from './model';
import { ap, area, fitText, fz, hold, isShort, lineH, measure, memBar, provenance, splitArea, txt } from './draw';

// ═════════ la pregunta ═════════
export function drawHook(S: Frame) {
  const { pal: p } = S, A = area(S), u = S.u, w = tone(S, 'w');
  const cx = A.x + A.w / 2, y0 = A.y + A.h * (S.portrait ? 0.3 : 0.32);
  const big = S.n(70e9, 0), bs = Math.min(fz(S, S.portrait ? 30 : 44), (A.w * 0.92) / Math.max(1, measure(S, big, 10, true, 800) / 10));
  const a1 = ap(S, 'hook', 0, 0.12);
  txt(S, big, cx, y0, { s: bs, weight: 800, mono: true, c: w.ink, align: 'center', a: a1 });
  txt(S, S.l('parámetros', 'parameters'), cx, y0 + lineH(S, bs, 0.5) + 14 * u, { s: 15, weight: 700, c: p.ink2, align: 'center', a: a1 });
  // los parámetros son números: una franja de valores reales de Pythia que se desliza
  const a2 = ap(S, 'hook', 0.12, 0.3), rows = isShort(S) ? 2 : 3, rh = lineH(S, 13, 1.6), top = y0 + lineH(S, bs, 0.5) + 44 * u;
  S.d.withAlpha(a2, () => S.d.clip(A.x, top - rh / 2, A.w, rows * rh, () => {
    for (let r = 0; r < rows; r++) {
      const vals = PATCH[r + 3], step = measure(S, '−0.0000', 13, true) + 14 * u, shift = ((S.clock * 22 * (r % 2 ? -1 : 1)) % step + step) % step;
      for (let k = -1; k * step < A.w + step; k++) {
        const v = vals[(k + 64) % vals.length], x = A.x + k * step + shift - (r % 2) * step * 0.5;
        const edge = clamp(Math.min(x - A.x, A.x + A.w - x) / (A.w * 0.18));
        txt(S, (v < 0 ? '−' : '') + S.n(Math.abs(v), 4), x, top + r * rh, { s: 13, mono: true, c: p.mute, a: 0.9 * edge });
      }
    }
  }));
  txt(S, S.l('¿Dónde se guardan mientras el modelo trabaja?', 'Where are they kept while the model works?'), cx, top + rows * rh + 22 * u, { s: 17, weight: 800, align: 'center', a: ap(S, 'hook', 0.55, 0.7), w: A.w });
  provenance(S, S.l('Valores reales de parámetros de Pythia-1.4B', 'Real parameter values from Pythia-1.4B'), a2);
}

// ═════════ la GPU, pieza por pieza ═════════
interface Board { x: number; y: number; w: number; h: number; chip: Rect; stacks: Rect[] }
function boardGeom(S: Frame, r: Rect): Board {
  const bw = Math.min(r.w, r.h * 1.35), bh = bw / 1.35, x = r.x + (r.w - bw) / 2, y = r.y + (r.h - bh) / 2;
  const chip = { x: x + bw * 0.3, y: y + bh * 0.18, w: bw * 0.4, h: bh * 0.64 };
  const sw = bw * 0.17, gap = bh * 0.03, stacks: Rect[] = [];
  for (let k = 0; k < 3; k++) stacks.push({ x: x + bw * 0.07, y: chip.y + k * (chip.h + gap) / 3, w: sw, h: chip.h / 3 - gap });
  for (let k = 0; k < 2; k++) stacks.push({ x: chip.x + chip.w + bw * 0.06, y: chip.y + k * (chip.h + gap) / 2, w: sw, h: chip.h / 2 - gap });
  return { x, y, w: bw, h: bh, chip, stacks };
}

export function drawGpu(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, dat = tone(S, 'dat'), wt = tone(S, 'w'), sg = tone(S, 'sig');
  const [main, side] = splitArea(S, A, S.portrait ? 0.5 : 0.56, 18);
  const B = boardGeom(S, main);
  const aBoard = ap(S, 'gpu', 0, 0.12), aMem = ap(S, 'vram-what', 0.04, 0.2), hotName = hold(S, 'vram-name', 'vram-size');
  // tarjeta y chip
  d.withAlpha(aBoard, () => {
    d.rect(B.x, B.y, B.w, B.h, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5, r: 8 });
    txt(S, 'H100', B.x + 10 * u, B.y + 12 * u, { s: 13, weight: 800, c: p.ink2 });
    const c = B.chip;
    d.rect(c.x, c.y, c.w, c.h, { fill: p.surface, stroke: p.ink2, lw: 2, r: 3 });
    const n = 16, g = Math.max(1, c.w * 0.012), cw = (c.w - g * (n + 1)) / n, ch = (c.h - g * (n + 1)) / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const lit = 0.5 + 0.5 * Math.sin(S.clock * 3 - (i + j) * 0.5);
      d.rect(c.x + g + i * (cw + g), c.y + g + j * (ch + g), cw, ch, { fill: alpha(dat.c, 0.16 + 0.6 * lit) });
    }
  });
  // la memoria, junto al chip
  d.withAlpha(aMem, () => {
    B.stacks.forEach((s) => {
      d.rect(s.x, s.y, s.w, s.h, { fill: alpha(wt.c, 0.16 + 0.3 * hotName), stroke: wt.c, lw: 1.5 + hotName, r: 2 });
      for (let k = 1; k < 4; k++) d.line(s.x + 2, s.y + (s.h * k) / 4, s.x + s.w - 2, s.y + (s.h * k) / 4, alpha(wt.c, 0.55), 1);
    });
    // los números viajan de la memoria a los núcleos
    B.stacks.forEach((s, k) => {
      const left = s.x < B.chip.x, x0 = left ? s.x + s.w : s.x, x1 = left ? B.chip.x : B.chip.x + B.chip.w, y = s.y + s.h / 2;
      for (let q = 0; q < 3; q++) {
        const t = (S.clock * 0.9 + q / 3 + k * 0.17) % 1;
        d.circle(x0 + (x1 - x0) * t, y, 2.2 * u, { fill: sg.c, a: Math.sin(Math.PI * t) });
      }
    });
  });
  // la columna que acompaña: núcleos, memoria, su nombre y su tamaño
  const rowH = lineH(S, 14, 1.25), sub = lineH(S, 12, 1.25), gap = (isShort(S) ? 6 : 12) * u;
  let y = side.y + (S.portrait ? 2 : Math.max(0, side.h * 0.06));
  const icon = (x: number, yy: number, kind: 'core' | 'mem', a: number) => d.withAlpha(a, () => {
    const s = 14 * u;
    if (kind === 'core') for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) d.rect(x + i * s / 3, yy - s / 2 + j * s / 3, s / 3 - 1.5, s / 3 - 1.5, { fill: alpha(dat.c, 0.75) });
    else { d.rect(x, yy - s / 2, s * 0.8, s, { fill: alpha(wt.c, 0.3), stroke: wt.c, lw: 1.3, r: 1.5 }); d.line(x + 1, yy, x + s * 0.8 - 1, yy, wt.c, 1); }
  });
  const twoLine = !isShort(S) && !S.portrait;
  const item = (aa: number, kind: 'core' | 'mem', head: string, body: string, short1 = '') => {
    icon(side.x, y + rowH / 2, kind, aa);
    const tx = side.x + 22 * u;
    if (twoLine) {
      fitText(S, head, tx, y + rowH / 2, side.w - 22 * u, { s: 14, weight: 800, a: aa });
      fitText(S, body, tx, y + rowH + sub / 2, side.w - 22 * u, { s: 12.5, c: p.ink2, a: aa });
      y += rowH + sub + gap;
    } else {
      fitText(S, short1 ? `${head} · ${short1}` : head, tx, y + rowH / 2, side.w - 22 * u, { s: 13.5, weight: 700, a: aa });
      y += rowH + gap * 0.7;
    }
  };
  item(ap(S, 'gpu', 0.3, 0.45), 'core', S.l('Núcleos: calculan', 'Cores: they compute'), S.l(`${S.n(H100.cores, 0)} en la H100`, `${S.n(H100.cores, 0)} in the H100`), S.l(`${S.n(H100.cores, 0)} en la H100`, `${S.n(H100.cores, 0)} in the H100`));
  item(aMem, 'mem', S.l('Memoria: guarda los números', 'Memory: it holds the numbers'), S.l('los parámetros y los datos', 'the parameters and the data'));
  // VRAM
  const aV = ap(S, 'vram-name', 0, 0.14);
  if (aV > 0) {
    const vs = isShort(S) || S.portrait ? 18 : 24, vw = measure(S, 'VRAM', vs, false, 800) + 18 * u, vh = lineH(S, vs, 1) + 10 * u;
    d.withAlpha(aV, () => {
      d.rect(side.x, y, vw, vh, { fill: alpha(wt.c, 0.14), stroke: wt.c, lw: 1.6, r: 4 });
      txt(S, 'VRAM', side.x + vw / 2, y + vh / 2 + 0.5, { s: vs, weight: 800, c: wt.ink, align: 'center' });
      fitText(S, S.l('memoria de video', 'video memory'), side.x + vw + 10 * u, y + vh * (twoLine ? 0.3 : 0.5), side.w - vw - 10 * u, { s: 13.5, weight: 700 });
      if (twoLine) fitText(S, S.l('la mesa del taller', 'the workshop bench'), side.x + vw + 10 * u, y + vh * 0.78, side.w - vw - 10 * u, { s: 12.5, c: p.ink2, a: ap(S, 'vram-name', 0.3, 0.45) });
    });
    y += vh + gap * 1.3;
  }
  // tamaños, a la misma escala
  const aS = ap(S, 'vram-size', 0.1, 0.25);
  if (aS > 0) {
    const bh = Math.max(12 * u, Math.min(22 * u, (side.y + side.h - y) / 4 - lineH(S, 13, 1.1)));
    const row = (label: string, gb: number, at: number, blocks: number) => {
      const a = ap(S, 'vram-size', at, at + 0.14);
      txt(S, label, side.x, y + lineH(S, 13, 0.6), { s: 13, weight: 800, a });
      y += lineH(S, 13, 1.25);
      const W = side.w * (gb / 80), grow = clamp(ap(S, 'vram-size', at + 0.05, at + 0.3));
      d.withAlpha(a, () => {
        for (let k = 0; k < blocks; k++) {
          const bw = W / blocks, f = clamp(grow * blocks - k);
          d.rect(side.x + k * bw + 1, y, bw - 2, bh, { fill: alpha(wt.c, 0.12 + 0.6 * f), stroke: wt.c, lw: 1.3, r: 2 });
        }
      });
      y += bh + gap;
    };
    row(S.l('H100: 80 GB', 'H100: 80 GB'), 80, 0.1, 5);
    row(S.l('RTX 3060: 12 GB', 'RTX 3060: 12 GB'), 12, 0.42, 1);
  }
  void memBar;
  provenance(S, S.l('Esquema de una H100, no a escala (cada cuadro ≈ 66 núcleos) · fichas de NVIDIA', 'Sketch of an H100, not to scale (each square ≈ 66 cores) · NVIDIA datasheets'), aBoard);
}
