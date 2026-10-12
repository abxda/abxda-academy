// Lo que cuesta mover todo en un modelo grande: la cuenta de la lección 25 (16 bytes por parámetro × 70 mil millones = 1 120 GB,
// 14 H100 de 80 GB) y una copia completa por cliente o tarea (GPT-3: 350 GB cada una, cifra de Hu et al., 2021).
import { alpha, tone, type Frame } from '../../../../../theme/kit';
import { BASE } from './base';
import { ap, area, fitSize, fitText, gpuBox, isShort, lineH, memBar, mv, pill, provenance, txt } from './draw';
import { drawSigned, maxAbs } from './ui';

export function drawCostBig(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S), w = tone(S, 'w'), e = tone(S, 'err');
  // fila 1: dieciséis bytes por parámetro
  const a1 = ap(S, 'cost-big', 0.2, 0.32);
  const y1 = A.y + lineH(S, 13, 1.3) / 2;
  fitText(S, S.l('al entrenar con Adam: 16 bytes por parámetro (lección 25)', 'training with Adam: 16 bytes per parameter (lesson 25)'), A.x, y1, A.w, { s: 13, weight: 700, c: p.ink2, a: a1 });
  const sq = Math.min((A.w - 15 * 3 * u) / 16, (short ? 18 : 26) * u), yq = y1 + lineH(S, 13, 1.3) / 2 + 6 * u;
  for (let i = 0; i < 16; i++) {
    const a = a1 * ap(S, 'cost-big', 0.22 + i * 0.008, 0.26 + i * 0.008), x = A.x + i * (sq + 3 * u);
    d.withAlpha(a, () => d.rect(x, yq, sq, sq, { fill: alpha(w.c, 0.55), stroke: w.c, lw: 1.2, r: 2 }));
  }
  // fila 2: la cuenta
  const a2 = ap(S, 'cost-big', 0.4, 0.52), y2 = yq + sq + (short ? 16 : 28) * u;
  const eq = S.l(`× ${S.n(70e9, 0)} parámetros = ${S.n(1120, 0)} GB`, `× ${S.n(70e9, 0)} parameters = ${S.n(1120, 0)} GB`);
  const s2 = fitSize(S, eq, A.w, port ? 18 : 24, true, 800);
  d.text(eq, A.x, y2 + lineH(S, 20, 1) / 2, { size: s2, weight: 800, font: 'mono', color: p.ink, base: 'middle', a: a2 });
  // fila 3: catorce H100 llenas
  const y3 = y2 + lineH(S, 20, 1) + (short ? 18 : 30) * u + lineH(S, 13, 1) + 10 * u, cols = 7, rows = 2, gx = (port ? 8 : 14) * u, gy = (port ? 8 : 12) * u;
  const bw = (A.w - gx * (cols - 1)) / cols, bh = Math.min((A.y + A.h - y3 - gy * rows) / rows, bw * 0.9, (short ? 40 : 90) * u);
  for (let k = 0; k < 14; k++) {
    const a = ap(S, 'cost-big', 0.58 + k * 0.022, 0.62 + k * 0.022), x = A.x + (k % cols) * (bw + gx), y = y3 + Math.floor(k / cols) * (bh + gy);
    d.withAlpha(a, () => {
      gpuBox(S, { x, y, w: bw, h: bh }, '');
      memBar(S, x + 5 * u, y + 5 * u, bw - 10 * u, bh - 10 * u, mv(S, 'cost-big', 0.6 + k * 0.022, 0.66 + k * 0.022), { tone: 'w' });
    });
  }
  const aT = ap(S, 'cost-big', 0.86, 0.96);
  pill(S, S.l('14 H100 de 80 GB, llenas', '14 H100s of 80 GB, full'), A.x, y3 - lineH(S, 13, 1) / 2 - 8 * u, { s: 13, tone: 'w', align: 'left', a: aT });
  provenance(S, S.l('cuenta de la lección 25: 70 mil millones × 16 bytes · Rajbhandari et al., 2019', 'count from lesson 25: 70 billion × 16 bytes · Rajbhandari et al., 2019'), a1);
  void txt;
}

export function drawCopies(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait;
  const n = 3, gap = (port ? 12 : 26) * u, side = Math.min((A.w - gap * (n - 1)) / n, A.h * 0.5, 200 * u);
  const x0 = A.x + (A.w - (n * side + (n - 1) * gap)) / 2, y0 = A.y + A.h * (port ? 0.18 : 0.14);
  const names = [S.l('cliente A', 'customer A'), S.l('cliente B', 'customer B'), S.l('cliente C', 'customer C')];
  const rng0 = maxAbs(BASE.W2) * 0.9;
  for (let i = 0; i < n; i++) {
    const a = ap(S, 'cost-copies', 0.1 + i * 0.12, 0.22 + i * 0.12), x = x0 + i * (side + gap);
    d.withAlpha(a, () => {
      const M = BASE.W2.map((v, k) => v * (1 + 0.35 * Math.sin(k * 0.37 + i * 2.1)));
      drawSigned(S, x, y0, M, 32, 32, side / 32, { range: rng0, neutral: true });
      pill(S, names[i], x + side / 2, y0 - lineH(S, 13, 1) - 2 * u, { s: 13, tone: 'ink' });
      const s = fitSize(S, '350 GB', side, port ? 18 : 24, true, 800);
      d.text('350 GB', x + side / 2, y0 + side + 10 * u, { size: s, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
    });
  }
  const a2 = ap(S, 'cost-copies', 0.55, 0.7), yT = y0 + side + 10 * u + lineH(S, 24, 1) + 18 * u;
  fitText(S, S.l('GPT-3: una copia completa por cliente o tarea', 'GPT-3: one full copy per customer or task'), A.x + A.w / 2, yT, A.w, { s: 14, weight: 700, c: p.ink2, align: 'center', a: a2 });
  provenance(S, S.l('Hu et al., 2021 (GPT-3, 175 mil millones de parámetros)', 'Hu et al., 2021 (GPT-3, 175 billion parameters)'), ap(S, 'cost-copies', 0.1, 0.25));
}
