// Acto 3: la idea de LoRA. El cambio real del ajuste completo tiene bajo rango; W = W₀ + B·A; rango como piezas «columna × fila»;
// la cuenta de parámetros (con un turno para encontrar dónde deja de ahorrar); la escala de GPT-3; B = 0 al empezar; el resultado del artículo.
import { clamp, inset, pulses, tone, type Frame, type Rect, type Pt } from '../../../../../theme/kit';
import { BASE } from './base';
import { FULL_A } from './act-intro';
import { getRun, STEPS } from './runs';
import { singularValues } from './tinynet';
import { alp, chip, drawFalk, drawSigned, lock, maxAbs, para, svOf, FS } from './ui';

const fmtN = (S: Frame, n: number) => S.l(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
export { fmtN };

// ═════════════════════════════════════════════════════════════════════════════
// El cambio real, descompuesto (insight, lowrank-claim)
// ═════════════════════════════════════════════════════════════════════════════
export function drawSvd(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis; if (a < 0.01) return;
  const dW = getRun(FULL_A).at(STEPS).dW, sv = svOf(dW, singularValues), tot = sv.reduce((q, v) => q + v * v, 0);
  const top4 = sv.slice(0, 4).reduce((q, v) => q + v * v, 0) / tot;
  d.withAlpha(a, () => {
    const narrow = S.portrait || S.W < 700, gridSide = S.portrait ? Math.min(all.w * 0.5, all.h * 0.36) : Math.min(all.h * (narrow ? 0.56 : 0.7), all.w * 0.36), cs = gridSide / 32;
    const gx = all.x + (S.portrait ? (all.w - gridSide) / 2 : 6 * u), gy = all.y + (S.portrait ? 28 : 40) * u;
    const aG = S.reveal('insight', 0, 0.8);
    drawSigned(S, gx, gy, dW, 32, 32, cs, { range: maxAbs(dW) * 0.8, a: aG });
    chip(S, S.l('cambio ΔW tras el ajuste completo', 'change ΔW after full fine-tuning'), gx + gridSide / 2, gy - 17 * u, { tone: 'w', a: aG, size: FS(S, 12) });
    d.text(S.l('1 024 números · ámbar +, cian −', '1,024 numbers · amber +, cyan −'), gx + gridSide / 2, gy + gridSide + 7 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', a: aG });

    // barras de valores singulares
    const bx = S.portrait ? all.x + 6 * u : gx + gridSide + 36 * u, bw = S.portrait ? all.w - 12 * u : all.x + all.w - bx - 6 * u;
    const by = S.portrait ? gy + gridSide + 54 * u : gy, bh = S.portrait ? all.y + all.h - by - 84 * u : gridSide * 0.72;
    const nB = 32, gap = 2, w1 = (bw - gap * (nB - 1)) / nB, max = sv[0];
    d.withAlpha(S.reveal('insight', 1.0, 0.5), () => d.text(S.l('tamaño de cada dirección (valor singular)', 'size of each direction (singular value)'), bx, by - 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'bottom' }));
    d.line(bx, by + bh, bx + bw, by + bh, p.lineStrong, 1.5);
    const hot = S.at('insight', 3.6, 4.4);
    for (let i = 0; i < nB; i++) {
      const ai = S.at('insight', 1.2 + i * 0.045, 1.8 + i * 0.045, 'out');
      const h = (sv[i] / max) * bh * ai, isTop = i < 4;
      d.rect(bx + i * (w1 + gap), by + bh - h, w1, h, { fill: isTop ? alp(tone(S, 'w').c, 0.35 + 0.6 * hot) : alp(p.mute, 0.55) });
    }
    d.text(S.l('direcciones, de mayor a menor', 'directions, largest to smallest'), bx + bw, by + bh + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top', a: S.reveal('insight', 1.2, 0.5) });
    // las cuatro primeras
    if (hot > 0.01) {
      const xe = bx + 4 * (w1 + gap) - gap;
      d.withAlpha(hot, () => {
        d.polyline([[bx, by + bh + 3 * u], [bx, by + bh + 9 * u], [xe, by + bh + 9 * u], [xe, by + bh + 3 * u]], tone(S, 'w').c, 2);
        const tx = bx + (S.portrait ? 0 : 8 * u), ty = by + bh * 0.04;
        d.text(S.n(top4 * 100, 0) + ' %', tx + 4 * (w1 + gap) + 10 * u, ty, { size: S.portrait ? 26 : 34, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'top' });
        para(S, S.l('del cambio (suma de cuadrados) cabe en las 4 primeras direcciones', 'of the change (sum of squares) fits in the first 4 directions'), tx + 4 * (w1 + gap) + 10 * u, ty + (S.portrait ? 30 : 40) * u, Math.max(110 * u, bx + bw - (tx + 4 * (w1 + gap) + 10 * u)), { size: FS(S, 13), weight: 700, color: p.ink });
      });
    }
    // citas
    if (S.on('lowrank-claim')) {
      const ac = S.reveal('lowrank-claim', 0.2, 0.6), cy = all.y + all.h - 14 * u;
      d.withAlpha(ac, () => {
        const c1 = chip(S, S.l('Aghajanyan et al., 2020 · pocas dimensiones efectivas', 'Aghajanyan et al., 2020 · few effective dimensions'), all.x + 4 * u, cy - (narrow ? 30 * u : 0), { align: 'left', tone: 'lat', size: FS(S, 12) });
        chip(S, S.l('Hu et al., 2021 · LoRA: el cambio tiene bajo rango', 'Hu et al., 2021 · LoRA: the change has low rank'), narrow ? all.x + 4 * u : c1.x + c1.w + 12 * u, cy, { align: 'left', tone: 'w', size: FS(S, 12) });
      });
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// W = W₀ + B·A con las matrices reales de un LoRA de rango 2
// ═════════════════════════════════════════════════════════════════════════════
const LORA2 = { mode: 2, replay: false, rule: 'A' } as const;
export function drawFreeze(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  if (vis < 0.01) return;
  const snap = getRun(LORA2).at(STEPS), r = 2;
  d.withAlpha(vis, () => {
    const gap = 26 * u;
    const cs = Math.min((all.w - 3 * gap) / (32 + r + 32), (all.h * (S.portrait ? 0.42 : 0.56)) / 32);
    const total = 32 * cs + r * cs + 32 * cs + 3 * gap, x0 = all.x + (all.w - total) / 2, y0 = all.y + (all.h - 32 * cs) / 2 - (S.portrait ? 4 : 10) * u;
    const aW = S.reveal('freeze', 0, 0.8), aBA = S.reveal('freeze', 1.2, 0.8);
    // W0 congelada
    d.withAlpha(aW, () => {
      drawSigned(S, x0, y0, BASE.W2, 32, 32, cs, { range: maxAbs(BASE.W2) * 0.9, neutral: true });
      lock(S, x0 + 32 * cs / 2, y0 - 22 * u, 15 * u);
      chip(S, S.l('W₀ · congelada', 'W₀ · frozen'), x0 + 32 * cs / 2, y0 - 50 * u, { tone: 'ink' });
      d.text('d × k', x0 + 32 * cs / 2, y0 + 32 * cs + 8 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    });
    const bx = x0 + 32 * cs + gap, ax = bx + r * cs + gap;
    d.withAlpha(aBA, () => {
      d.text('+', x0 + 32 * cs + gap / 2, y0 + 16 * cs, { size: FS(S, 24), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      drawSigned(S, bx, y0, snap.B!, 32, r, cs, { range: Math.max(maxAbs(snap.B!), 0.1) });
      d.text('·', bx + r * cs + gap / 2, y0 + 16 * cs, { size: FS(S, 24), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      const ay = y0 + 16 * cs - r * cs / 2;
      drawSigned(S, ax, ay, snap.A!, r, 32, cs, { range: Math.max(maxAbs(snap.A!), 0.1) });
      chip(S, 'B', bx + r * cs / 2, y0 - 22 * u, { tone: 'w', mono: true });
      chip(S, 'A', ax + 32 * cs / 2, ay - 22 * u, { tone: 'w', mono: true });
      d.text('d × r', bx + r * cs / 2, y0 + 32 * cs + 8 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'top' });
      d.text('r × k', ax + 32 * cs / 2, ay + r * cs + 8 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'top' });
      chip(S, S.l('se entrenan', 'trained'), (bx + ax + 32 * cs) / 2, y0 - 50 * u, { tone: 'w' });
    });
    // fórmula
    const fa = S.reveal('freeze', 2.4, 0.6);
    d.withAlpha(fa, () => {
      const y = y0 + 32 * cs + 40 * u, s = 'W  =  W₀  +  B · A';
      const w = d.measure(s, { size: FS(S, 20), weight: 700, font: 'mono' });
      d.rect(all.x + all.w / 2 - w / 2 - 14 * u, y - 18 * u, w + 28 * u, 36 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
      d.text(s, all.x + all.w / 2, y, { size: FS(S, 20), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// El rango: piezas «columna × fila» (outer, rank-sum)
// ═════════════════════════════════════════════════════════════════════════════
const U1 = [2, 1, 3], V1 = [1, 2, -1], U2 = [1, -1, 2], V2 = [3, 0, 1];
const outerM = (u: number[], v: number[]) => u.flatMap((a) => v.map((b) => a * b));
const M1 = outerM(U1, V1), M2 = outerM(U2, V2), MS = M1.map((v, i) => v + M2[i]);

function numMat(S: Frame, x: number, y: number, M: number[], n: number, m: number, cs: number, o: { a?: number; show?: number; range?: number; plain?: boolean } = {}) {
  const { d, pal: p } = S, rng = o.range ?? 9;
  d.withAlpha(o.a ?? 1, () => {
    const cells = Math.ceil((o.show ?? 1) * n * m);
    drawSigned(S, x, y, M.map((v, k) => (k < cells ? v : 0)), n, m, cs, { range: rng, neutral: o.plain });
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) if (i * m + j < cells) d.text(String(M[i * m + j]).replace('-', '−'), x + j * cs + cs / 2, y + i * cs + cs / 2, { size: Math.min(15, Math.max(cs / S.u * 0.4, 12.2 / S.u)), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
  });
}

export function drawOuter(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  if (vis < 0.01) return;
  const gone = S.at('rank-sum', 0, 0.5);
  const a = vis * (1 - gone); if (a < 0.01) return;
  d.withAlpha(a, () => {
    const cs = Math.min(66 * u, (all.w - 80 * u) / 4.6, (all.h - 130 * u) / 4.6), W3 = cs * 3;
    const x0 = all.x + (all.w - (W3 + cs + 20 * u)) / 2 + cs + 20 * u, y0 = all.y + (all.h - (W3 + cs + 20 * u)) / 2 + cs + 20 * u - 8 * u;
    // columna u (izquierda) y fila v (arriba)
    const aU = S.reveal('outer', 0.2, 0.6), aV = S.reveal('outer', 0.9, 0.6);
    numMat(S, x0 - cs - 20 * u, y0, U1, 3, 1, cs, { a: aU });
    numMat(S, x0, y0 - cs - 20 * u, V1, 1, 3, cs, { a: aV });
    chip(S, S.l('columna', 'column'), x0 - cs / 2 - 20 * u, y0 - 22 * u, { tone: 'w', a: aU });
    chip(S, S.l('fila', 'row'), x0 + W3 + 36 * u, y0 - cs / 2 - 20 * u, { tone: 'w', a: aV });
    // producto, celda a celda
    const prog = S.at('outer', 1.8, 4.6, 'lin');
    numMat(S, x0, y0, M1, 3, 3, cs, { show: prog });
    d.withAlpha(S.reveal('outer', 1.6, 0.4), () => d.text('×', x0 - 10 * u, y0 - 10 * u, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle' }));
    d.text(S.l('3 + 3 = 6 números', '3 + 3 = 6 numbers'), x0 + W3 / 2, y0 + W3 + 14 * u, { size: FS(S, 14), weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'top', a: S.reveal('outer', 1.8, 0.5) });
    d.text(S.l('→ una matriz de 3 × 3 = 9 celdas (rango 1)', '→ a 3 × 3 = 9-cell matrix (rank 1)'), x0 + W3 / 2, y0 + W3 + 36 * u, { size: FS(S, 14), weight: 700, color: p.ink, align: 'center', base: 'top', a: S.at('outer', 4.8, 5.4, 'out') });
  });
}

export function drawRankSum(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('rank-sum', 0, 0.6) * (1 - S.at('count', 0, 0.5)); if (a < 0.01) return;
  const toggle = S.at('rank-sum', 3.4, 4.1);
  d.withAlpha(a, () => {
    const gap = 24 * u, cs = Math.min(46 * u, (all.w - 2 * gap - 4 * u) / 9, (all.h - 120 * u) / 7.2), W3 = cs * 3;
    // fila 1: M1 + M2 = S
    const rowW = W3 * 3 + gap * 2 + 22 * u, x1 = all.x + (all.w - rowW) / 2, y1 = all.y + 28 * u;
    d.withAlpha(1 - toggle * 0.0, () => {
      numMat(S, x1, y1, M1, 3, 3, cs, { a: S.reveal('rank-sum', 0.1, 0.5) });
      numMat(S, x1 + W3 + gap, y1, M2, 3, 3, cs, { a: S.reveal('rank-sum', 0.7, 0.5) });
      numMat(S, x1 + 2 * (W3 + gap) + 4 * u, y1, MS, 3, 3, cs, { a: S.reveal('rank-sum', 1.3, 0.5) });
      d.text('+', x1 + W3 + gap / 2, y1 + W3 / 2, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle', a: S.reveal('rank-sum', 0.7, 0.4) });
      d.text('=', x1 + 2 * W3 + gap * 1.5 + 2 * u, y1 + W3 / 2, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle', a: S.reveal('rank-sum', 1.3, 0.4) });
      const ly = y1 + W3 + 8 * u;
      d.text(S.l('rango 1', 'rank 1'), x1 + W3 / 2, ly, { size: FS(S, 13), weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'top', a: S.reveal('rank-sum', 0.7, 0.4) });
      d.text(S.l('rango 1', 'rank 1'), x1 + W3 + gap + W3 / 2, ly, { size: FS(S, 13), weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'top', a: S.reveal('rank-sum', 0.9, 0.4) });
      d.text(S.l('rango 2', 'rank 2'), x1 + 2 * (W3 + gap) + 4 * u + W3 / 2, ly, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'top', a: S.reveal('rank-sum', 1.5, 0.4) });
    });
    // fila 2: lo mismo como B × A
    if (toggle > 0.01) d.withAlpha(toggle, () => {
      const y2 = y1 + W3 + 52 * u, bW = cs * 2, aH = cs * 2, rowW2 = bW + gap + 3 * cs + gap + 22 * u + W3, x2 = all.x + (all.w - rowW2) / 2 + 6 * u;
      const Bm = [2, 1, 1, -1, 3, 2], Am = [1, 2, -1, 3, 0, 1];
      numMat(S, x2, y2 + aH / 2 - cs * 0.0, Bm, 3, 2, cs);
      d.text('×', x2 + bW + gap / 2, y2 + 1.5 * cs, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      numMat(S, x2 + bW + gap, y2 + cs * 0.5, Am, 2, 3, cs);
      d.text('=', x2 + bW + gap + 3 * cs + gap / 2, y2 + 1.5 * cs, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      numMat(S, x2 + bW + 2 * gap + 3 * cs + 4 * u, y2, MS, 3, 3, cs);
      chip(S, S.l('B: 2 columnas', 'B: 2 columns'), x2 + bW / 2, y2 - 14 * u, { tone: 'w', size: FS(S, 12) });
      chip(S, S.l('A: 2 filas', 'A: 2 rows'), x2 + bW + gap + 1.5 * cs, y2 + cs * 0.5 - 14 * u, { tone: 'w', size: FS(S, 12) });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// La cuenta de parámetros, con el rango como control (count, try-rank)
// ═════════════════════════════════════════════════════════════════════════════
export function drawAreas(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('count', 0, 0.6) * (1 - S.at('gpt3-scale', 0, 0.5)); if (a < 0.01) return;
  const r = Math.round(clamp(S.on('try-rank') ? (S.p.r ?? 2) : 2, 1, 32));
  const d0 = 32, full = d0 * d0, lora = r * 2 * d0, ratio = full / lora;
  d.withAlpha(a, () => {
    const gap = 26 * u, wt = tone(S, 'w');
    // geometría: ranuras fijas para que nada salte al mover r (B pegada a la × por la derecha, A por la izquierda)
    let cs: number, wx: number, wy: number, bSlotX: number, bY: number, aX: number, aY: number;
    if (S.portrait) {
      cs = Math.min((all.w - gap) / 64, (all.h - 218 * u) / 64);
      wx = all.x + (all.w - 32 * cs) / 2; wy = all.y + 22 * u;
      bSlotX = all.x + (all.w - (64 * cs + gap)) / 2; bY = wy + 32 * cs + 40 * u; aX = bSlotX + 32 * cs + gap; aY = bY;
    } else {
      cs = Math.min((all.w - 2 * gap - 16 * u) / 96, (all.h - 150 * u) / 32);
      wx = all.x + 8 * u; wy = all.y + 44 * u;
      bSlotX = wx + 32 * cs + gap; bY = wy; aX = bSlotX + 32 * cs + gap; aY = wy;
    }
    const bX = bSlotX + (32 - r) * cs;
    drawSigned(S, wx, wy, BASE.W2, 32, 32, cs, { range: maxAbs(BASE.W2) * 0.9, neutral: true });
    chip(S, S.l('matriz completa W₀: 32 × 32', 'full matrix W₀: 32 × 32'), wx + 16 * cs, wy - 17 * u, { tone: 'ink', size: FS(S, 12) });
    const aBA = S.reveal('count', 0.4, 0.7);
    d.withAlpha(aBA, () => {
      const cellRect = (x: number, y: number, w: number, h: number) => {
        d.rect(x, y, w, h, { fill: alp(wt.c, 0.34), stroke: wt.c, lw: 1.5 });
        if (cs >= 4) { for (let i = 1; i < Math.round(w / cs); i++) d.line(x + i * cs, y, x + i * cs, y + h, alp(p.stage, 0.7), 0.8); for (let j = 1; j < Math.round(h / cs); j++) d.line(x, y + j * cs, x + w, y + j * cs, alp(p.stage, 0.7), 0.8); }
      };
      cellRect(bX, bY, r * cs, 32 * cs);
      cellRect(aX, aY, 32 * cs, r * cs);
      d.text('×', bSlotX + 32 * cs + gap / 2, bY + 16 * cs, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
      chip(S, `B: 32 × ${r}`, bX + r * cs / 2, bY - 17 * u, { tone: 'w', mono: true, size: FS(S, 12) });
      chip(S, `A: ${r} × 32`, aX + 16 * cs, aY - 17 * u + (S.portrait ? 0 : 0), { tone: 'w', mono: true, size: FS(S, 12) });
    });
    // medidor: números que se entrenan frente a la matriz completa
    const gx = S.portrait ? all.x + 6 * u : bSlotX, gw = S.portrait ? all.w - 12 * u : all.x + all.w - bSlotX - 6 * u;
    const gy = S.portrait ? bY + 32 * cs + 18 * u : wy + 32 * cs + 22 * u;
    const aG = S.reveal('count', 1.0, 0.6);
    d.withAlpha(aG, () => {
      const over = lora > full, tie = lora === full, tn = tone(S, over ? 'err' : tie ? 'dat' : 'w');
      d.text(S.l('números que se entrenan', 'numbers that get trained'), gx, gy, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
      d.text(`r · (32 + 32) = ${r} · 64 = ${fmtN(S, lora)}`, gx, gy + 16 * u, { size: FS(S, 16), weight: 700, font: 'mono', color: tn.ink, base: 'top' });
      const bh = 12 * u, by = gy + 40 * u, max = Math.max(full, lora) * 1.02, sc = gw / max;
      d.rect(gx, by, gw, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
      d.rect(gx, by, lora * sc, bh, { fill: alp(tn.c, 0.75) });
      d.line(gx + full * sc, by - 6 * u, gx + full * sc, by + bh + 6 * u, p.ink, 2);
      d.text(S.l('matriz completa: 1 024', 'full matrix: 1,024'), gx + full * sc, by + bh + 8 * u, { size: FS(S, 12), weight: 700, color: p.ink, align: 'right', base: 'top' });
      const verdict = over ? S.l('más que la matriz completa: no conviene', 'more than the full matrix: not worth it')
        : tie ? S.l('r = d/2: B y A ocupan lo mismo que W₀', 'r = d/2: B and A take as much room as W₀')
          : S.l(`${S.n(ratio, ratio < 10 ? 1 : 0)} veces menos que la matriz completa`, `${S.n(ratio, ratio < 10 ? 1 : 0)} times fewer than the full matrix`);
      d.text(verdict, gx, by + bh + (S.portrait ? 26 : 8) * u, { size: FS(S, 13), weight: 800, color: tn.ink, base: 'top', w: S.portrait ? gw : gw * 0.6 });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// A escala de GPT-3 (gpt3-scale)
// ═════════════════════════════════════════════════════════════════════════════
export function drawGpt3(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('gpt3-scale', 0, 0.6) * (1 - S.at('init-zero', 0, 0.5)); if (a < 0.01) return;
  const D = 12288, R = 8, full = D * D, lora = R * 2 * D;
  d.withAlpha(a, () => {
    const side = S.portrait ? Math.min(all.w * 0.52, all.h * 0.34) : Math.min(all.h * 0.62, all.w * 0.3);
    const wx = all.x + (S.portrait ? (all.w - side) / 2 : 14 * u), wy = all.y + (S.portrait ? 30 : 40) * u;
    const aW = S.reveal('gpt3-scale', 0, 0.7);
    d.withAlpha(aW, () => {
      d.rect(wx, wy, side, side, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5 });
      d.dither(wx + 1, wy + 1, side - 2, side - 2, p.ink, 0.22, 2);
      chip(S, S.l('una matriz de atención de GPT-3', 'one GPT-3 attention matrix'), wx + side / 2, wy - 17 * u, { tone: 'ink', size: FS(S, 12) });
      d.text('12 288 × 12 288', wx + side / 2, wy + side / 2, { size: S.portrait ? 15 : 17, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.surface2, haloW: 6 });
    });
    const aBA = S.reveal('gpt3-scale', 1.4, 0.8), px = Math.max(2, (R / D) * side);
    d.withAlpha(aBA, () => {
      const tn = tone(S, 'w');
      if (!S.portrait) {
        const bx = wx + side + 56 * u, ax = bx + 40 * u;
        d.rect(bx, wy, px, side, { fill: tn.c });
        d.rect(ax, wy, side, px, { fill: tn.c });
        d.text('×', bx + 20 * u + px / 2, wy + side / 2, { size: FS(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
        chip(S, 'B', bx + px / 2, wy - 17 * u, { tone: 'w', mono: true });
        chip(S, 'A', ax + side / 2, wy - 17 * u, { tone: 'w', mono: true });
        d.text(S.l('(a escala, miden menos de un píxel de ancho)', '(to scale, they are under a pixel wide)'), bx, wy + side + 8 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: side + 60 * u });
      } else {
        const by = wy + side + 34 * u;
        d.rect(wx + side / 2 - 40 * u, by, px, 60 * u, { fill: tn.c });
        d.text('×', wx + side / 2 - 8 * u, by + 30 * u, { size: FS(S, 20), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
        d.rect(wx + side / 2 + 6 * u, by + 29 * u, 60 * u, px, { fill: tn.c });
        chip(S, 'B', wx + side / 2 - 40 * u, by - 14 * u, { tone: 'w', mono: true, size: FS(S, 12) });
        chip(S, 'A', wx + side / 2 + 36 * u, by + 29 * u - 14 * u, { tone: 'w', mono: true, size: FS(S, 12) });
      }
    });
    // números
    const nx = S.portrait ? all.x + 10 * u : wx + side + 56 * u + 40 * u + side + 34 * u;
    const nw = S.portrait ? all.w - 20 * u : all.x + all.w - nx - 6 * u;
    const ny = S.portrait ? wy + side + 104 * u : wy + 4 * u;
    d.withAlpha(S.reveal('gpt3-scale', 2.4, 0.8), () => {
      const big = S.portrait ? 20 : 22;
      d.text(S.l('matriz completa', 'full matrix'), nx, ny, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
      d.text(fmtN(S, full), nx, ny + 15 * u, { size: big, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      d.text(S.l('corrección con r = 8', 'correction with r = 8'), nx, ny + 15 * u + big * 1.6 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
      d.text(fmtN(S, lora), nx, ny + 30 * u + big * 1.6 * u, { size: big, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'top' });
      d.text(`${fmtN(S, full / lora)}× ${S.l('menos', 'fewer')}`, nx, ny + 46 * u + big * 3.2 * u, { size: S.portrait ? 24 : 30, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    });
    void nw;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// B = 0 al empezar: los dos caminos (init-zero)
// ═════════════════════════════════════════════════════════════════════════════
export function drawTwoPath(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('init-zero', 0, 0.6) * (1 - S.at('paper', 0, 0.5)); if (a < 0.01) return;
  d.withAlpha(a, () => {
    const bw = Math.min(110 * u, all.w * 0.2), bh = 40 * u;
    const xIn = all.x + 22 * u, xOut = all.x + all.w - 28 * u, cy = all.y + all.h * 0.42;
    const yTop = cy - 62 * u, yBot = cy + 62 * u;
    const xW = all.x + all.w * 0.5 - bw * 0.0 - bw / 2 + (S.portrait ? 0 : 0);
    const xA = all.x + all.w * 0.30 - bw / 2 + 24 * u, xB = all.x + all.w * 0.62 - bw / 2 + 4 * u;
    const rW: Rect = { x: all.x + all.w * 0.46 - bw / 2, y: yTop - bh / 2, w: bw, h: bh };
    const rA: Rect = { x: xA, y: yBot - bh / 2, w: bw, h: bh }, rB: Rect = { x: xB, y: yBot - bh / 2, w: bw, h: bh };
    const wt = tone(S, 'w');
    // x
    d.withAlpha(S.reveal('init-zero', 0, 0.5), () => {
      d.circle(xIn, cy, 14 * u, { fill: tone(S, 'sig').soft, stroke: tone(S, 'sig').c, lw: 2 });
      d.text('x', xIn, cy, { size: FS(S, 16), weight: 800, font: 'mono', color: tone(S, 'sig').ink, align: 'center', base: 'middle' });
    });
    // W0 (arriba) y su camino
    const aT = S.reveal('init-zero', 0.3, 0.6);
    d.withAlpha(aT, () => {
      d.rect(rW.x, rW.y, rW.w, rW.h, { fill: p.surface2, stroke: p.ink2, lw: 1.8, r: 3 });
      d.text('W₀', rW.x + rW.w / 2 + 6 * u, rW.y + rW.h / 2, { size: FS(S, 17), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
      lock(S, rW.x + 14 * u, rW.y + rW.h / 2 - 2 * u, 12 * u);
      d.polyline([[xIn + 14 * u, cy - 4 * u], [xIn + 14 * u, yTop], [rW.x, yTop]], p.ink2, 2);
      d.arrow(rW.x + rW.w, yTop, xOut - 8 * u, yTop, p.ink2, 2, 8);
      d.text(S.l('congelada', 'frozen'), rW.x + rW.w / 2, rW.y - 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'center', base: 'bottom' });
    });
    // A → B (abajo)
    const aB = S.reveal('init-zero', 1.1, 0.6);
    d.withAlpha(aB, () => {
      d.polyline([[xIn + 14 * u, cy + 4 * u], [xIn + 14 * u, yBot], [rA.x, yBot]], wt.c, 2);
      d.rect(rA.x, rA.y, rA.w, rA.h, { fill: wt.soft, stroke: wt.c, lw: 2, r: 3 });
      d.text('A', rA.x + rA.w / 2, rA.y + rA.h / 2, { size: FS(S, 17), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
      d.arrow(rA.x + rA.w, yBot, rB.x, yBot, wt.c, 2, 8);
      d.rect(rB.x, rB.y, rB.w, rB.h, { fill: wt.soft, stroke: wt.c, lw: 2, r: 3 });
      d.text('B', rB.x + rB.w / 2, rB.y + rB.h / 2, { size: FS(S, 17), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
      d.polyline([[rB.x + rB.w, yBot], [xOut, yBot], [xOut, cy + 14 * u]], wt.c, 2);
      d.text(S.l('se entrenan', 'trained'), (rA.x + rB.x + rB.w) / 2, rA.y + rA.h + 8 * u, { size: FS(S, 12), weight: 700, color: wt.ink, align: 'center', base: 'top' });
    });
    // suma y salida
    d.withAlpha(S.reveal('init-zero', 1.6, 0.5), () => {
      d.polyline([[xOut, yTop], [xOut, cy - 14 * u]], p.ink2, 2);
      d.circle(xOut, cy, 14 * u, { fill: p.surface, stroke: p.ink, lw: 2 });
      d.text('+', xOut, cy, { size: FS(S, 20), weight: 800, color: p.ink, align: 'center', base: 'middle' });
      d.text('h', xOut + 4 * u, cy - 28 * u, { size: FS(S, 16), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    });
    // B = 0 : la corrección es cero
    const aZ = S.reveal('init-zero', 2.4, 0.6);
    d.withAlpha(aZ, () => {
      chip(S, 'B = 0', rB.x + rB.w / 2, rB.y - 18 * u, { tone: 'err', mono: true, size: FS(S, 12) });
      chip(S, S.l('A: aleatoria', 'A: random'), rA.x + rA.w / 2, rA.y - 18 * u, { tone: 'ink', size: FS(S, 12) });
      d.text(S.l('B·A = 0  →  h = W₀·x', 'B·A = 0  →  h = W₀·x'), all.x + all.w / 2, yBot + bh / 2 + 44 * u, { size: FS(S, 18), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      d.text(S.l('el modelo arranca idéntico al original', 'the model starts identical to the original'), all.x + all.w / 2, yBot + bh / 2 + 72 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top' });
    });
    // pulsos de señal
    const pr = ((S.clock * 0.45) % 1);
    if (aB > 0.9) {
      pulses(S, [[xIn + 14 * u, cy - 4 * u], [xIn + 14 * u, yTop], [xOut, yTop]] as Pt[], pr, { tone: 'sig', n: 1 });
      const pts: Pt[] = [[xIn + 14 * u, cy + 4 * u], [xIn + 14 * u, yBot], [rA.x + rA.w, yBot]];
      pulses(S, pts, pr, { tone: 'sig', n: 1 });
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// El resultado del artículo (paper)
// ═════════════════════════════════════════════════════════════════════════════
export function drawPaper(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('paper', 0, 0.6) * (1 - S.at('demo-lora', 0, 0.5)); if (a < 0.01) return;
  d.withAlpha(a, () => {
    const cards: { big: string; l1: string; l2: string; t: 'w' | 'dat' | 'sig' }[] = [
      { big: '÷ 10 000', l1: S.l('parámetros entrenables', 'trainable parameters'), l2: 'GPT-3 175B', t: 'w' },
      { big: '÷ 3', l1: S.l('memoria de GPU al entrenar', 'GPU memory when training'), l2: S.l('de 1.2 TB a 350 GB', 'from 1.2 TB to 350 GB'), t: 'dat' },
      { big: S.l('≥ completo', '≥ full'), l1: S.l('calidad frente al ajuste completo', 'quality vs full fine-tuning'), l2: S.l('RoBERTa, DeBERTa, GPT-2, GPT-3 (en sus pruebas)', 'RoBERTa, DeBERTa, GPT-2, GPT-3 (in its tests)'), t: 'sig' },
    ];
    const n = 3, gap = 14 * u;
    const cw = S.portrait ? all.w : (all.w - gap * 2) / 3, ch = S.portrait ? (all.h - 70 * u - gap * 2) / 3 : Math.min(all.h * 0.52, 190 * u);
    cards.forEach((c, i) => {
      const x = S.portrait ? all.x : all.x + i * (cw + gap), y = S.portrait ? all.y + 8 * u + i * (ch + gap) : all.y + all.h * 0.12;
      const ai = S.reveal('paper', 0.2 + i * 0.5, 0.6), t = tone(S, c.t);
      d.withAlpha(ai, () => {
        d.rect(x, y, cw, ch, { fill: p.surface, stroke: t.c, lw: 1.8, r: 4 });
        d.text(c.big, x + cw / 2, y + ch * 0.34, { size: S.portrait ? 30 : 34, weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
        d.text(c.l1, x + cw / 2, y + ch * 0.58, { size: FS(S, 14), weight: 700, color: p.ink, align: 'center', base: 'top', w: cw - 20 * u });
        d.text(c.l2, x + cw / 2, y + ch * 0.58 + (S.portrait ? 18 : 40) * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', w: cw - 20 * u });
      });
    });
    d.withAlpha(S.reveal('paper', 2.0, 0.6), () => {
      d.text(S.l('Hu et al., 2021 · y guardar 100 versiones: 354 GB en lugar de 35 TB', 'Hu et al., 2021 · and storing 100 versions: 354 GB instead of 35 TB'), all.x + all.w / 2, all.y + all.h - 6 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'bottom', w: all.w });
    });
  });
  void n_unused;
}
const n_unused = 0;
