// Actos 9–13: cómo se califica (reglas, rúbrica, LLM como juez), sus sesgos y la verdad humana.
import { alpha, bars, clamp, ease, hash, lerp, link, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ARENA_VOTES, JUDGE_AGREE, POSITION, VERBOSE } from './data';
import { stag } from './act-bench';
import { fs, foot, layout, nf, tbox, tick } from './ui';
import { wilson } from './stats';

// ═════════ calificar: tres maneras ═════════
export function drawGrade(S: Frame) {
  const { d } = S, u = S.u, R = layout(S, 1, { foot: false }).all;
  const lanes = [
    { a: S.l('Respuesta cerrada', 'Closed answer'), as: S.l('«Lima»', '“Lima”'), b: S.l('Se compara', 'Compared'), bs: S.l('con la correcta', 'with the right one'), c: S.l('Exacto', 'Exact'), cs: S.l('automático', 'automatic'), t: 'dat' as const },
    { a: S.l('Código', 'Code'), as: S.l('una función', 'a function'), b: S.l('Se prueba', 'Tested'), bs: S.l('con casos de prueba', 'with test cases'), c: S.l('Exacto', 'Exact'), cs: S.l('automático', 'automatic'), t: 'dat' as const },
    { a: S.l('Texto abierto', 'Open text'), as: S.l('un resumen', 'a summary'), b: S.l('Rúbrica', 'Rubric'), bs: S.l('criterios por escrito', 'written criteria'), c: S.l('Persona o juez', 'Person or judge'), cs: S.l('requiere criterio', 'needs judgment'), t: 'lat' as const },
  ];
  const gap = 12 * u, lh = Math.min(120 * u, (R.h - 2 * gap) / 3), y0 = R.y + (R.h - (3 * lh + 2 * gap)) / 2, arrow = (S.portrait ? 22 : 46) * u, bw = (R.w - 2 * arrow) / 3;
  lanes.forEach((ln, i) => {
    const a = stag(S, 'grade', 0.08 + i * 0.28, 0.18), y = y0 + i * (lh + gap);
    const rects: Rect[] = [0, 1, 2].map((k) => ({ x: R.x + k * (bw + arrow), y, w: bw, h: lh }));
    d.withAlpha(a, () => {
      tbox(S, rects[0], ln.a, { sub: ln.as, tone: 'ink' });
      tbox(S, rects[1], ln.b, { sub: ln.bs, tone: ln.t, active: i === 2 ? 1 : 0.2 });
      tbox(S, rects[2], ln.c, { sub: ln.cs, tone: ln.t, active: i === 2 ? 0.6 : 0 });
      link(S, rects[0], rects[1], { tone: 'ink' });
      link(S, rects[1], rects[2], { tone: 'ink' });
    });
  });
}

// ═════════ tarjetas de respuesta (casi idénticas, cortas o largas) ═════════
function answerCard(S: Frame, r: Rect, name: string, tn: 'w' | 'sig', lines: number[], o: { a?: number; picked?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, tn);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: o.picked ? tone(S, 'dat').c : t.c, lw: o.picked ? 3 : 1.5, r: 3 });
    d.text(name, r.x + 9 * u, r.y + 7 * u, { size: fs(S, 12.5), weight: 800, color: t.ink, base: 'top' });
    const step = Math.min(11 * u, (r.h - 30 * u) / Math.max(lines.length, 1));
    lines.forEach((w, i) => { const yy = r.y + 28 * u + i * step; if (yy + 5 * u < r.y + r.h - 4 * u) d.rect(r.x + 9 * u, yy, (r.w - 18 * u) * w, 5 * u, { fill: alpha(p.mute, 0.45) }); });
    if (o.picked) {
      const cy = r.y + r.h - 15 * u;
      d.circle(r.x + r.w - 15 * u, cy, 11 * u, { fill: tone(S, 'dat').c });
      d.polyline([[r.x + r.w - 20.5 * u, cy], [r.x + r.w - 16 * u, cy + 4.5 * u], [r.x + r.w - 9 * u, cy - 4.5 * u]], p.stage, 2.4);
    }
  });
}

/** Barras de «valor» con título; devuelve nada. Las filas se centran en el espacio disponible. */
function barBlock(S: Frame, r: Rect, title: string, rows: { label: string; value: number; tone: 'lat' | 'dat' | 'err'; hot?: boolean }[], k: number, o: { rowH: number; labelW: number }) {
  const { d, pal: p } = S, u = S.u, th = d.wrap(title, r.w, { size: fs(S, 13.5), weight: 800 }).length * fs(S, 13.5) * 1.3 * u, total = th + 12 * u + rows.length * o.rowH + 22 * u;
  const y0 = r.y + Math.max(0, (r.h - total) / 2 - 6 * u);
  d.text(title, r.x, y0, { size: fs(S, 13.5), weight: 800, color: p.ink, base: 'top', w: r.w });
  const br: Rect = { x: r.x, y: y0 + th + 12 * u, w: r.w, h: rows.length * o.rowH };
  bars(S, br, rows.map((q) => ({ ...q, value: q.value * ease.out(k) })), { max: 1, rowH: o.rowH, labelW: o.labelW, fmt: (v) => `${Math.round(v * 100)} %`, size: fs(S, 13) });
  return br;
}

// ═════════ LLM como juez ═════════
export function drawJudge(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, S.portrait ? 0.56 : 0.58), lat = tone(S, 'lat'), m = L.main;
  const cw = m.w * 0.3, chh = Math.min(86 * u, m.h * 0.22), jw = m.w * (S.portrait ? 0.27 : 0.25), jh = Math.min(84 * u, m.h * 0.24);
  const H = 2 * chh + 14 * u, y0 = m.y + (m.h - H) / 2 + 10 * u, xj = m.x + m.w * 0.44, vr = (S.portrait ? 19 : 24) * u, xv = m.x + m.w - vr - 3 * u;
  const A: Rect = { x: m.x, y: y0, w: cw, h: chh }, B: Rect = { x: m.x, y: y0 + chh + 14 * u, w: cw, h: chh }, J: Rect = { x: xj, y: y0 + (H - jh) / 2, w: jw, h: jh };
  const aC = S.reveal('judge', 0.2, 0.5), aJ = stag(S, 'judge', 0.22, 0.1), aV = stag(S, 'judge', 0.4, 0.1);
  answerCard(S, A, S.l('Respuesta A', 'Answer A'), 'w', [0.9, 0.8, 0.6], { a: aC });
  answerCard(S, B, S.l('Respuesta B', 'Answer B'), 'sig', [0.7, 0.9, 0.5], { a: aC });
  d.withAlpha(aJ, () => {
    tbox(S, J, S.l('Juez', 'Judge'), { sub: S.l('un modelo', 'a model'), tone: 'lat', active: 0.4, size: 16 });
    d.tag(S.l('rúbrica', 'rubric'), J.x + J.w / 2, J.y - 22 * u, { size: fs(S, 12.5), color: lat.ink, fill: lat.soft, stroke: lat.c });
    d.line(J.x + J.w / 2, J.y - 13 * u, J.x + J.w / 2, J.y, lat.c, 1.6);
    d.arrow(A.x + A.w, A.y + A.h / 2, J.x - 2, J.y + J.h * 0.3, p.ink2, 1.6, 7);
    d.arrow(B.x + B.w, B.y + B.h / 2, J.x - 2, J.y + J.h * 0.7, p.ink2, 1.6, 7);
  });
  d.withAlpha(aV, () => {
    d.arrow(J.x + J.w + 2, J.y + J.h / 2, xv - vr - 4, J.y + J.h / 2, p.ink2, 1.6, 7);
    d.circle(xv, J.y + J.h / 2, vr, { fill: alpha(tone(S, 'dat').c, 0.2), stroke: tone(S, 'dat').c, lw: 2 });
    d.text('A', xv, J.y + J.h / 2, { size: fs(S, 22), weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'middle' });
  });
  const k = stag(S, 'judge', 0.5, 0.2), a = L.aside;
  d.withAlpha(k, () => {
    const br = barBlock(S, a, S.l('Concordancia con votos humanos', 'Agreement with human votes'), [
      { label: S.l('GPT-4 y personas', 'GPT-4 and people'), value: JUDGE_AGREE.gpt4 / 100, tone: 'lat', hot: true },
      { label: S.l('personas entre sí', 'people and people'), value: JUDGE_AGREE.humans / 100, tone: 'dat' },
    ], k, { rowH: (S.portrait ? 36 : 50) * u, labelW: Math.min(150 * u, a.w * 0.5) });
    const lw = Math.min(150 * u, a.w * 0.5), bx = br.x + lw + (br.w - lw - 46 * u) * 0.5;
    d.line(bx, br.y, bx, br.y + br.h, p.mute, 1.5, [4, 3]);
    d.text(S.l('azar 50 %', 'chance 50%'), bx, br.y + br.h + 4 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top' });
  });
  foot(S, S.l('Zheng et al., 2023 · MT-bench, votos sin empate', 'Zheng et al., 2023 · MT-bench, non-tied votes'), { a: k });
}

// ═════════ sesgo de posición ═════════
export function drawBias(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, S.portrait ? 0.56 : 0.58), m = L.main;
  const cw = Math.min(150 * u, m.w * 0.36), chh = Math.min(100 * u, m.h * 0.4), gap = Math.min(44 * u, m.w * 0.12);
  const x1 = m.x + (m.w - 2 * cw - gap) / 2, x2 = x1 + cw + gap, H = chh + 90 * u, y = m.y + Math.max(36 * u, (m.h - H) / 2 + 30 * u);
  const f = clamp(S.on('bias') ? (S.t - S.start('bias')) / Math.max(0.5, S.end('bias') - S.start('bias')) : 0);
  const swap = ease.io(clamp((f - 0.42) / 0.14)), pos = [lerp(x1, x2, swap), lerp(x2, x1, swap)];
  const aC = S.reveal('bias', 0.2, 0.5);
  d.withAlpha(aC, () => { d.text(S.l('primera posición', 'first position'), x1 + cw / 2, y - 26 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, align: 'center', base: 'bottom' }); d.line(x1, y - 16 * u, x1 + cw, y - 16 * u, p.mute, 2.4); });
  const first = swap < 0.5 ? 0 : 1;
  answerCard(S, { x: pos[0], y, w: cw, h: chh }, S.l('Respuesta A', 'Answer A'), 'w', [0.9, 0.8, 0.6], { a: aC, picked: first === 0 && f > 0.2 });
  answerCard(S, { x: pos[1], y, w: cw, h: chh }, S.l('Respuesta B', 'Answer B'), 'sig', [0.9, 0.8, 0.6], { a: aC, picked: first === 1 && f > 0.2 });
  d.withAlpha(stag(S, 'bias', 0.58, 0.1), () => d.text(S.l('el veredicto siguió a la posición, no al contenido', 'the verdict followed the position, not the content'), m.x + m.w / 2, y + chh + 16 * u, { size: fs(S, 14), weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'top', w: m.w }));
  const k = stag(S, 'bias', 0.5, 0.2), a = L.aside;
  d.withAlpha(k, () => barBlock(S, a, S.l('Mantiene el veredicto al invertir el orden', 'Keeps its verdict when the order is swapped'), POSITION.map((r) => ({ label: r.label, value: r.v / 100, tone: 'lat' as const, hot: r.id === 'gpt4' })), k, { rowH: (S.portrait ? 30 : 44) * u, labelW: Math.min(110 * u, a.w * 0.34) }));
  foot(S, S.l('Zheng et al., 2023, tabla 2 · dos respuestas casi idénticas', 'Zheng et al., 2023, table 2 · two nearly identical answers'), { a: k });
}

// ═════════ sesgo de longitud y defensas ═════════
export function drawBias2(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, S.portrait ? 0.56 : 0.56), m = L.main;
  const cw = Math.min(160 * u, m.w * 0.4), gap = Math.min(44 * u, m.w * 0.1), x1 = m.x + (m.w - 2 * cw - gap) / 2, x2 = x1 + cw + gap, y = m.y + 4 * u;
  const hS = Math.min(S.portrait ? 54 : 70, 70) * u, hL = (S.portrait ? 108 : 132) * u, aC = S.reveal('bias2', 0.2, 0.5);
  answerCard(S, { x: x1, y, w: cw, h: hS }, S.l('Corta', 'Short'), 'w', [0.9, 0.8, 0.7], { a: aC });
  answerCard(S, { x: x2, y, w: cw, h: hL }, S.l('Larga y repetida', 'Long and repetitive'), 'sig', [0.9, 0.8, 0.7, 0.9, 0.8, 0.7, 0.9, 0.8, 0.7], { a: aC, picked: stag(S, 'bias2', 0.25, 0.1) > 0.5 });
  d.withAlpha(stag(S, 'bias2', 0.25, 0.1), () => d.text(S.l('mismo contenido, nada nuevo', 'same content, nothing new'), m.x + m.w / 2, y + hL + 8 * u, { size: fs(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top', w: m.w }));
  const dy = y + hL + 36 * u, defs = [S.l('invertir el orden', 'swap the order'), S.l('rúbrica', 'rubric'), S.l('contrastar con humanos', 'check against humans')];
  d.withAlpha(stag(S, 'bias2', 0.65, 0.12), () => {
    d.text(S.l('Defensas', 'Defenses'), m.x, dy, { size: fs(S, 12.5), weight: 800, color: p.mute, base: 'top' });
    let x = m.x, yy = dy + 30 * u;
    defs.forEach((t) => { const w = d.measure(t, { size: fs(S, 12.5), weight: 600 }) + 24 * u; if (x + w > m.x + m.w + 2 * u) { x = m.x; yy += 28 * u; } d.tag(t, x, yy, { size: fs(S, 12.5), color: tone(S, 'dat').ink, fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, align: 'left' }); x += w + 6 * u; });
  });
  const k = stag(S, 'bias2', 0.35, 0.2), a = L.aside;
  d.withAlpha(k, () => barBlock(S, a, S.l('Prefieren la versión repetitiva', 'They prefer the repetitive version'), VERBOSE.map((r) => ({ label: r.label, value: r.v / 100, tone: 'err' as const, hot: r.id !== 'gpt4' })), k, { rowH: (S.portrait ? 30 : 44) * u, labelW: Math.min(110 * u, a.w * 0.34) }));
  foot(S, S.l('Zheng et al., 2023, tabla 3 · ataque de «lista repetitiva»', 'Zheng et al., 2023, table 3 · “repetitive list” attack'), { a: k });
}

// ═════════ personas como referencia: calibrar al juez ═════════
const N_CAL = 20, DISAGREE = new Set([4, 11, 16]);
const human = (i: number) => hash(i, 41) > 0.28;
export function drawHuman(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = layout(S, 1).all;
  const arenaH = (S.portrait ? 104 : 74) * u, lw = 66 * u, cs = (R.w - lw) / N_CAL;
  const rh = Math.min((S.portrait ? 36 : 44) * u, (R.h - arenaH - 150 * u) / 2), y1 = R.y + 38 * u, y2 = y1 + rh + 8 * u;
  const prog = clamp((S.t - S.start('human') - 0.6) / 3.0) * N_CAL, a0 = S.reveal('human', 0.1, 0.5);
  d.withAlpha(a0, () => {
    d.text(S.l('20 casos calificados a mano (ilustrativo)', '20 cases graded by hand (illustrative)'), R.x, R.y, { size: fs(S, 14), weight: 800, color: p.ink, base: 'top', w: R.w });
    d.text(S.l('Persona', 'Person'), R.x + lw - 6 * u, y1 + rh / 2, { size: fs(S, 13), weight: 700, color: p.ink, align: 'right', base: 'middle' });
    d.text(S.l('Juez', 'Judge'), R.x + lw - 6 * u, y2 + rh / 2, { size: fs(S, 13), weight: 700, color: tone(S, 'lat').ink, align: 'right', base: 'middle' });
  });
  for (let i = 0; i < N_CAL; i++) {
    const a = clamp(prog - i), cx = R.x + lw + (i + 0.5) * cs, h = human(i), j = DISAGREE.has(i) ? !h : h;
    if (a <= 0) continue;
    d.withAlpha(a, () => {
      tick(S, cx, y1 + rh / 2, Math.min(cs * 0.8, 16 * u), h);
      tick(S, cx, y2 + rh / 2, Math.min(cs * 0.8, 16 * u), j);
      if (DISAGREE.has(i)) d.rect(cx - cs / 2 + 1, y1 - 3 * u, cs - 2, 2 * rh + 14 * u, { stroke: tone(S, 'err').c, lw: 2 });
    });
  }
  const shown = Array.from({ length: Math.min(N_CAL, Math.floor(prog)) }, (_, i) => !DISAGREE.has(i)).filter(Boolean).length;
  const done = prog >= N_CAL, [lo, hi] = wilson(N_CAL - DISAGREE.size, N_CAL);
  d.withAlpha(stag(S, 'human', 0.5, 0.1), () => {
    const yy = y2 + rh + 26 * u;
    const num = `${shown} / ${N_CAL}`, nw = d.measure(num, { size: fs(S, 30), weight: 800, font: 'mono' });
    d.text(num, R.x + lw, yy, { size: fs(S, 30), weight: 800, font: 'mono', color: p.ink, base: 'top' });
    d.text(S.l('coinciden', 'agree'), R.x + lw + nw + 10 * u, yy + 16 * u, { size: fs(S, 14), weight: 700, color: p.ink2, base: 'top' });
    if (done) d.text(S.l(`Con solo 20 casos, el intervalo al 95 % va de ${nf(S, lo * 100, 0)} % a ${nf(S, hi * 100, 0)} %.`, `With only 20 cases, the 95% interval runs from ${nf(S, lo * 100, 0)}% to ${nf(S, hi * 100, 0)}%.`), R.x, yy + 50 * u, { size: fs(S, 13.5), weight: 700, color: tone(S, 'err').ink, base: 'top', w: R.w });
  });
  const k = stag(S, 'human', 0.7, 0.15), ay = R.y + R.h - arenaH;
  d.withAlpha(k, () => {
    d.rect(R.x, ay, R.w, arenaH, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    d.text('Chatbot Arena', R.x + 14 * u, ay + 10 * u, { size: fs(S, 14), weight: 800, color: p.ink, base: 'top' });
    d.text(S.l('votos de personas, por pares', 'votes from people, in pairs'), R.x + 14 * u, ay + 30 * u, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'top' });
    const nx = S.portrait ? R.x + 14 * u : R.x + R.w * 0.42, ny = S.portrait ? ay + 50 * u : ay + (arenaH - 30 * u) / 2;
    d.text(`> ${nf(S, ARENA_VOTES, 0)}`, nx, ny, { size: fs(S, 26), weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    d.text(S.l('pero no son tus preguntas', 'but they are not your questions'), S.portrait ? R.x + 190 * u : R.x + R.w * 0.72, ny + 6 * u, { size: fs(S, 13), weight: 700, color: tone(S, 'err').ink, base: 'top', w: S.portrait ? R.w - 200 * u : R.w * 0.26 });
  });
  foot(S, 'Zheng et al., 2023 · Chiang et al., 2024', { a: k });
}
