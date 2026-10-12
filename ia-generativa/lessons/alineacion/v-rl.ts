// Paso tres: el modelo practica con el juez (RLHF). El ciclo y su nombre; luego el juguete: qué tan seguido tienen las respuestas
// cada rasgo, el juez de práctica (pesos supuestos), la correa y la presión, los puntos del juez frente a la calidad real y la ley de Goodhart.
// Todo número sale de toy.ts: el óptimo exacto con correa KL, π ∝ π_ref·exp(presión·r). Lo supuesto se rotula.
import { Plot, alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { G_GOLD, Q_REF, W_BIAS, gains, pressure } from './toy';
import { S_BEST, S_ONE, sOf, st } from './state';
import { FS, TRAIT_KEYS, area, card, chip, fits, fitText, fr, glyph, growArrow, num, para, pct, person, sgn, stepChip, tight, traitName, traitTone } from './ui';

const STEP3 = (S: Frame) => S.l('practicar', 'practice');

// ── 1 · el ciclo: escribe, el juez puntúa, se ajusta, y otra vez ──
export function drawLoop(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const lt = tone(S, 'lat'), wt = tone(S, 'w'), sg = tone(S, 'sig');
  const chipH = stepChip(S, r, 3, STEP3(S), fr(S, 'rl-practice', 0, 0.08));
  const top = r.y + chipH + 8 * u;
  const nameH = (port ? (cmp ? 142 : 150) : (cmp ? 92 : 104)) * u;
  const loopA: Rect = { x: r.x, y: top, w: r.w, h: r.y + r.h - top - nameH };
  const bw = Math.min(loopA.w * (port ? 0.33 : 0.28), 220 * u), bh = Math.max(36 * u, Math.min(loopA.h * 0.5, loopA.h - 60 * u, (cmp ? 70 : 104) * u));
  const cy = loopA.y + bh / 2 + 4 * u;
  const M: Rect = { x: loopA.x + (port ? 0 : loopA.w * 0.06), y: cy - bh / 2, w: bw, h: bh };
  const J: Rect = { x: loopA.x + loopA.w - bw - (port ? 0 : loopA.w * 0.06), y: cy - bh / 2, w: bw, h: bh };
  d.withAlpha(fr(S, 'rl-practice', 0.06, 0.16), () => {
    card(S, M, { tone: 'lat', fill: alpha(lt.c, 0.1), lw: 2 });
    fitText(S, S.l('Modelo', 'Model'), M.x + M.w / 2, M.y + M.h * 0.38, M.w - 12 * u, 17, { weight: 800, color: lt.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('escribe', 'writes'), M.x + M.w / 2, M.y + M.h * 0.7, M.w - 12 * u, 13, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
  d.withAlpha(fr(S, 'rl-practice', 0.3, 0.4), () => {
    card(S, J, { tone: 'w', fill: alpha(wt.c, 0.1), lw: 2 });
    fitText(S, S.l('Juez', 'Judge'), J.x + J.w / 2, J.y + J.h * 0.38, J.w - 12 * u, 17, { weight: 800, color: wt.ink, align: 'center', base: 'middle' });
    if (fits(S, S.l('modelo de recompensa', 'reward model'), J.w - 12 * u)) fitText(S, S.l('modelo de recompensa', 'reward model'), J.x + J.w / 2, J.y + J.h * 0.7, J.w - 12 * u, 13, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
  // ida: la respuesta
  const x1 = M.x + M.w + 8 * u, x2 = J.x - 8 * u;
  growArrow(S, x1, cy, x2, cy, fr(S, 'rl-practice', 0.18, 0.3, 'io'), p.ink, 2.6);
  d.withAlpha(fr(S, 'rl-practice', 0.22, 0.32), () => fitText(S, S.l('una respuesta', 'an answer'), (x1 + x2) / 2, cy - 7 * u, x2 - x1 - 6 * u, 13, { weight: 700, color: p.ink2, align: 'center', base: 'bottom' }));
  // puntos
  d.withAlpha(fr(S, 'rl-practice', 0.42, 0.52), () => chip(S, S.l('puntos: +1.6', 'points: +1.6'), J.x + J.w / 2, J.y + J.h + 16 * u, 'w', { size: 13, maxW: J.w + 30 * u }));
  // vuelta: se ajusta
  const ry = Math.max(J.y + J.h + 34 * u, Math.min(loopA.y + loopA.h - 22 * u, J.y + J.h + 44 * u));
  const back: [number, number][] = [[J.x + J.w / 2, J.y + J.h + 30 * u], [J.x + J.w / 2, ry], [M.x + M.w / 2, ry], [M.x + M.w / 2, M.y + M.h + 6 * u]];
  const kB = fr(S, 'rl-practice', 0.52, 0.72, 'io');
  if (kB > 0) {
    const segs = back.slice(1).map((q, i) => Math.hypot(q[0] - back[i][0], q[1] - back[i][1])), tot = segs.reduce((a, b) => a + b, 0);
    let left = kB * tot; const pts: [number, number][] = [back[0]];
    for (let i = 0; i < segs.length && left > 0; i++) { const f = Math.min(1, left / segs[i]); pts.push([back[i][0] + (back[i + 1][0] - back[i][0]) * f, back[i][1] + (back[i + 1][1] - back[i][1]) * f]); left -= segs[i]; }
    d.polyline(pts, sg.c, 2.6);
    if (kB > 0.98) d.arrow(back[2][0], back[2][1], back[3][0], back[3][1], sg.c, 2.6, 9 * u);
  }
  d.withAlpha(fr(S, 'rl-practice', 0.66, 0.78), () => fitText(S, S.l('se ajusta: lo que saca más puntos, más probable', 'adjusts: whatever scores higher, more likely'), (M.x + J.x + J.w) / 2, ry + 7 * u, J.x + J.w - M.x - 10 * u, 13, { weight: 700, color: sg.ink, align: 'center', base: 'top' }));
  // y vuelve a empezar: un pulso recorre el ciclo
  if (fr(S, 'rl-practice', 0.84, 0.86) > 0) {
    const loop: [number, number][] = [[x1, cy], [x2, cy], [J.x + J.w / 2, J.y + J.h + 30 * u], back[1], back[2], back[3]];
    const segs = loop.slice(1).map((q, i) => Math.hypot(q[0] - loop[i][0], q[1] - loop[i][1])), tot = segs.reduce((a, b) => a + b, 0);
    let f = ((S.clock * 0.25) % 1) * tot, i = 0;
    while (i < segs.length - 1 && f > segs[i]) { f -= segs[i]; i++; }
    const k = Math.min(1, f / segs[i]), px = loop[i][0] + (loop[i + 1][0] - loop[i][0]) * k, py = loop[i][1] + (loop[i + 1][1] - loop[i][1]) * k;
    if (i !== 1) d.circle(px, py, 5 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });   // el tramo que cruza al juez no se dibuja
  }
  // el nombre: RLHF, y quién lo usó
  const ny = loopA.y + loopA.h + 4 * u, aN = fr(S, 'rl-name', 0.04, 0.16);
  d.withAlpha(aN, () => {
    const big = port || cmp ? 22 : 28;
    d.text('RLHF', r.x, ny, { size: big, weight: 800, base: 'top' });
    const bw2 = d.measure('RLHF', { size: big, weight: 800 }) + 14 * u;
    const l1 = S.l('aprendizaje por refuerzo', 'reinforcement learning'), l2 = S.l('con retroalimentación humana', 'from human feedback');
    const x = r.x + bw2, xw = r.x + r.w - x, one = fits(S, l1 + ' ' + l2, xw, 700);
    if (one) fitText(S, l1 + ' ' + l2, x, ny + 4 * u, xw, 15, { weight: 700, color: p.ink2, base: 'top' });
    else { fitText(S, l1, x, ny, xw, 14, { weight: 700, color: p.ink2, base: 'top' }); fitText(S, l2, x, ny + 17 * u, xw, 14, { weight: 700, color: p.ink2, base: 'top' }); }
    const y1 = ny + Math.max(big * 1.15, one ? 24 : 36) * u + 2 * u;
    d.withAlpha(fr(S, 'rl-name', 0.4, 0.5), () => fitText(S, S.l('refuerzo: aprende de puntos', 'reinforcement: learns from points'), r.x, y1, port ? r.w : r.w * 0.5, 13, { weight: 600, color: wt.ink, base: 'top' }));
    d.withAlpha(fr(S, 'rl-name', 0.66, 0.76), () => fitText(S, S.l('humana: el juez aprendió de personas', 'human: the judge learned from people'), port ? r.x : r.x + r.w * 0.5, port ? y1 + 18 * u : y1, port ? r.w : r.w * 0.5, 13, { weight: 600, color: tone(S, 'dat').ink, base: 'top' }));
  });
  const cyC = r.y + r.h - 14 * u;
  const dt = tone(S, 'dat');
  const c2 = S.l('ChatGPT · 30 nov 2022 · según OpenAI', 'ChatGPT · Nov 30, 2022 · per OpenAI');
  const w1 = d.measure('InstructGPT · 2022', { size: FS(S, 13), weight: 700 }) + 30 * u, oneRow = w1 + d.measure(c2, { size: FS(S, 13), weight: 700 }) + 16 * u <= r.w;
  d.withAlpha(fr(S, 'rl-chatgpt', 0.04, 0.16), () => chip(S, 'InstructGPT · 2022', r.x, oneRow ? cyC : cyC - 28 * u, 'dat', { align: 'left', size: 13 }));
  d.withAlpha(fr(S, 'rl-chatgpt', 0.42, 0.54), () => chip(S, c2, oneRow ? r.x + w1 : r.x, cyC, 'dat', { align: 'left', size: 13, maxW: oneRow ? r.w - w1 : r.w }));
  void dt; void person;
}

// ── 2 · el juguete: rasgos, juez, correa, presión, calidad real y Goodhart ──
const yMin = -1.3, yMax = 2.2;
function optLayout(S: Frame) {
  const u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const chipH = FS(S, 13) * u + 10 * u + 8 * u, top = r.y + chipH, H = r.y + r.h - top, gap = (cmp ? 8 : 14) * u;
  const bars: Rect = port ? { x: r.x, y: top, w: r.w, h: H * 0.42 } : { x: r.x, y: top, w: r.w * 0.42, h: H };
  const chart: Rect = port ? { x: r.x, y: top + H * 0.42 + gap, w: r.w, h: H * 0.58 - gap } : { x: r.x + r.w * 0.42 + gap * 1.5, y: top, w: r.w * 0.58 - gap * 1.5, h: H };
  return { r, port, cmp, bars, chart };
}

/** Estado vigente del control de presión (suavizado en update) y hasta dónde se han trazado las curvas. */
const pressNow = (S: Frame) => { const s = st(S); return { sv: clamp(s.sShown), ext: clamp(s.ext) }; };

export function drawOpt(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = optLayout(S), { port, cmp } = L;
  const wt = tone(S, 'w'), dt = tone(S, 'dat'), et = tone(S, 'err');
  stepChip(S, L.r, 3, STEP3(S));
  const { sv, ext } = pressNow(S), g = gains(pressure(sv));
  // ── los rasgos de las respuestas ──
  const Bx = L.bars, aB = fr(S, 'rl-bars', 0.04, 0.16);
  const title = S.l('Respuestas del modelo: qué tan seguido tienen cada rasgo', 'The model’s answers: how often they have each trait');
  const judgeW = 46 * u, aJ = fr(S, 'rl-judge', 0.08, 0.2);
  const th = para(S, title, Bx.x, Bx.y, Bx.w - judgeW - 4 * u, FS(S, 13), { weight: 700, color: p.ink2, maxLines: 2, a: aB });
  const rowsTop = Bx.y + th + 6 * u, leashH = (cmp ? 30 : 40) * u;
  const rowH = Math.min((port ? 24 : cmp ? 26 : 34) * u, (Bx.y + Bx.h - rowsTop - leashH - 8 * u) / 4);
  const size = FS(S, 13), nameW = Math.max(...TRAIT_KEYS.map((k) => d.measure(traitName(S, k), { size, weight: 700 }))) + 4 * u;
  const pctW = d.measure('100 %', { size, weight: 700, font: 'mono' }) + 6 * u;
  const barX = Bx.x + 22 * u + nameW, barW = Bx.x + Bx.w - judgeW - pctW - 6 * u - barX;
  const hiG = fr(S, 'goodhart', 0.18, 0.3);
  d.withAlpha(aB, () => {
    if (aJ > 0) d.withAlpha(aJ, () => fitText(S, S.l('juez', 'judge'), Bx.x + Bx.w - judgeW / 2, rowsTop - 2 * u, judgeW, 12, { weight: 700, color: wt.ink, align: 'center', base: 'bottom' }));
    TRAIT_KEYS.forEach((k, i) => {
      const y = rowsTop + i * rowH + rowH / 2, c = tone(S, traitTone(k)), v = g.m[i], bh = Math.min(12 * u, rowH * 0.45);
      if (hiG > 0 && (i === 1 || i === 3)) d.rect(Bx.x - 2 * u, y - rowH / 2 + 1, Bx.w + 4 * u, rowH - 2, { stroke: et.c, lw: 2, dash: [5, 3], r: 3, a: hiG });
      glyph(S, k, Bx.x + 8 * u, y, 7 * u);
      d.text(traitName(S, k), Bx.x + 20 * u, y, { size, weight: 700, base: 'middle' });
      d.rect(barX, y - bh / 2, barW, bh, { fill: p.surface2 });
      d.rect(barX, y - bh / 2, barW * clamp(v), bh, { fill: c.c });
      const gx = barX + barW * Q_REF[i];
      d.line(gx, y - bh / 2 - 3 * u, gx, y + bh / 2 + 3 * u, p.ink, 2);
      d.text(pct(S, v), barX + barW + pctW, y, { size, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
      if (aJ > 0) d.withAlpha(aJ, () => d.text(sgn(S, W_BIAS[i], 1), Bx.x + Bx.w - judgeW / 2, y, { size, weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle' }));
    });
  });
  // las marcas de inicio, y la correa: cuánto se alejó
  const ly = rowsTop + 4 * rowH + 8 * u;
  d.withAlpha(fr(S, 'rl-push', 0.72, 0.84), () => fitText(S, S.l('│ = dónde empezó', '│ = where it started'), Bx.x, ly + 6 * u, Bx.w * 0.5, 12, { weight: 600, color: p.mute, base: 'middle' }));
  d.withAlpha(fr(S, 'rl-leash', 0.06, 0.18), () => {
    const lx = Bx.x + Bx.w * 0.5, lw = Bx.w * 0.5, k = clamp(g.kl / 3.4);
    fitText(S, S.l('cuánto se alejó (la correa)', 'how far it drifted (the leash)'), lx, ly + 6 * u, lw, 12, { weight: 700, color: p.ink2, base: 'middle' });
    d.rect(lx, ly + 16 * u, lw, 8 * u, { fill: p.surface2 });
    d.rect(lx, ly + 16 * u, lw * k, 8 * u, { fill: alpha(p.ink, 0.55) });
  });
  // ── puntos del juez frente a calidad real ──
  const C = L.chart, aP = fr(S, 'proxy', 0.06, 0.18);
  const legendRow = (y: number, label: string, val: number, t: Tone, dash: number[] | undefined, a: number) => d.withAlpha(a, () => {
    const c = tone(S, t);
    d.line(C.x, y, C.x + 18 * u, y, c.c, 3, dash);
    fitText(S, label, C.x + 24 * u, y, C.w - 24 * u - 70 * u, 14, { weight: 700, color: c.ink, base: 'middle' });
    d.text(sgn(S, val, 2), C.x + C.w, y, { size: FS(S, 16), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
  });
  const lg1 = C.y + 9 * u, lg2 = lg1 + (cmp ? 18 : 22) * u;
  legendRow(lg1, S.l('puntos del juez', 'judge’s points'), g.proxy, 'w', [7, 4], aP);
  legendRow(lg2, S.l('calidad real (regla supuesta)', 'real quality (assumed rule)'), g.gold, 'dat', undefined, fr(S, 'proxy', 0.36, 0.48));
  const pr: Rect = { x: C.x, y: lg2 + 14 * u, w: C.w, h: C.y + C.h - lg2 - 14 * u };
  const plot = new Plot(S, pr, { xr: [0, 1], yr: [yMin, yMax], pad: { l: 8, r: 8, t: 4, b: cmp ? 30 : 34 } });
  const aX = fr(S, 'opt-axes', 0.04, 0.16), aY = fr(S, 'opt-axes', 0.32, 0.44);
  const R = plot.r;
  d.withAlpha(aX, () => {
    d.line(R.x, R.y + R.h, R.x + R.w, R.y + R.h, p.lineStrong, 1.5);
    [0, 1, 2, 4, 8].forEach((pv) => { const x = plot.X(sOf(pv)); d.line(x, R.y + R.h, x, R.y + R.h + 4 * u, p.lineStrong, 1.5); d.text(S.n(pv, 0), x, R.y + R.h + 6 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    fitText(S, S.l('presión →', 'pressure →'), R.x + R.w, R.y + R.h + (cmp ? 18 : 20) * u, R.w * 0.6, 13, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  d.withAlpha(aY, () => {
    d.line(R.x, R.y, R.x, R.y + R.h, p.lineStrong, 1.5);
    d.line(R.x, plot.Y(0), R.x + R.w, plot.Y(0), p.mute, 1.4, [5, 4]);
    fitText(S, S.l('modelo de partida', 'starting model'), R.x + 4 * u, plot.Y(0) + 4 * u, R.w * 0.5, 12, { weight: 600, color: p.mute, base: 'top' });
    fitText(S, S.l('↑ mejora', '↑ improvement'), R.x + 4 * u, R.y + 2 * u, R.w * 0.4, 12, { weight: 700, color: p.ink2, base: 'top' });
  });
  // zona de Goodhart
  const aZ = fr(S, 'goodhart', 0.04, 0.16);
  if (aZ > 0) d.withAlpha(aZ, () => {
    const zx = plot.X(S_BEST);
    d.rect(zx, R.y, R.x + R.w - zx, R.h, { fill: alpha(et.c, 0.08) });
    d.line(zx, R.y, zx, R.y + R.h, et.c, 1.6, [5, 4]);
    const tx = Math.max(zx + 6 * u, plot.X(0.62));
    para(S, S.l('puntos ↑, calidad real ↓', 'points ↑, real quality ↓'), tx, plot.Y(1.25), R.x + R.w - tx - 4 * u, FS(S, 13), { weight: 800, color: et.ink, maxLines: 2, halo: true });
  });
  // curvas: lo explorado
  if (ext > 0.002) {
    const n = Math.max(2, Math.round(ext * 120)), ptsP: [number, number][] = [], ptsG: [number, number][] = [];
    for (let i = 0; i <= n; i++) { const q = (i / n) * ext, c = gains(pressure(q)); ptsP.push([plot.X(q), plot.Y(c.proxy)]); ptsG.push([plot.X(q), plot.Y(c.gold)]); }
    d.clip(R.x, R.y - 2, R.w, R.h + 4, () => { d.polyline(ptsP, wt.c, 3, { dash: [7, 4] }); d.polyline(ptsG, dt.c, 3.4); });
  }
  if (S.on('opt-demo') && ext >= S_BEST) {
    const pk = gains(pressure(S_BEST)), a = S.is('opt-demo') ? fr(S, 'opt-demo', 0.55, 0.65) : 1;
    d.withAlpha(a, () => { d.circle(plot.X(S_BEST), plot.Y(pk.gold), 8 * u, { stroke: dt.c, lw: 2.4 }); fitText(S, S.l('máximo: ', 'peak: ') + S.n(1.25, 2), plot.X(S_BEST), plot.Y(pk.gold) - 14 * u, 120 * u, 12, { weight: 700, color: dt.ink, align: 'center', base: 'bottom', halo: true }); });
  }
  // el punto actual
  if (S.on('opt-axes')) d.withAlpha(fr(S, 'opt-axes', 0.5, 0.62), () => {
    const x = plot.X(sv);
    d.line(x, R.y, x, R.y + R.h, p.ink, 1.4);
    d.circle(x, plot.Y(g.proxy), 5.5 * u, { fill: wt.c, stroke: p.stage, lw: 1.5 });
    d.circle(x, plot.Y(g.gold), 6 * u, { fill: dt.c, stroke: p.stage, lw: 1.5 });
  });
  void G_GOLD; void S_ONE; void num; void person; void growArrow;
}
