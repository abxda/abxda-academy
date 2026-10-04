// Acto 5 · DPO: el recorrido largo (preferencias → modelo de recompensa → refuerzo), el atajo, la «ventaja» de la respuesta preferida
// sobre la rechazada medida contra el modelo de partida, y la equivalencia exacta de las dos rutas en el juguete.
// Todos los números salen de toy.ts / state.ts (ajuste real de la pérdida DPO con las 16 combinaciones de rasgos).
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, card, fitText, isCompact, num, para, sgn } from './ui';
import { answerCard, compareTable, phases } from './board';
import { DEFAULT_PICKS, PAIRS, loser, winner } from './pairs';
import { effective, st } from './state';
import { Q_REF, probOf, probRef, sigmoid, tilt } from './toy';

const R = (S: Frame) => inset(S.full(), (isCompact(S) ? 8 : 14) * S.u);

export function drawDpo(S: Frame) {
  phases(S, [
    { from: 'dpo-problem', draw: drawPipe },
    { from: 'dpo-how', draw: drawHow },
    { from: 'dpo-secret', draw: drawSecret },
  ], 'syco');
}

// ── 1 · el recorrido largo y el atajo ──
function drawPipe(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S);
  const dt = tone(S, 'dat'), et = tone(S, 'err');
  const topH = (cmp ? 30 : 46) * u, botH = (port ? 54 : 52) * u, gap = (port ? 28 : 26) * u, side = port ? 44 * u : 0;
  const area: Rect = { x: r.x, y: r.y + topH, w: r.w - side, h: r.h - topH - botH };
  const bw = port ? area.w : (area.w - 3 * gap) / 4, bh = port ? Math.min((area.h - 3 * gap) / 4, 58 * u) : Math.min(area.h * 0.5, 110 * u);
  const startY = port ? area.y + (area.h - (4 * bh + 3 * gap)) / 2 : area.y + (area.h - bh) / 2 + 12 * u;
  const box = (i: number): Rect => (port ? { x: area.x, y: startY + i * (bh + gap), w: bw, h: bh } : { x: area.x + i * (bw + gap), y: startY, w: bw, h: bh });
  const names: { t: string; s: string; k: Tone; tn: ReturnType<typeof tone> }[] = ([
    { t: S.l('Preferencias', 'Preferences'), s: S.l('parejas de respuestas', 'pairs of answers'), k: 'dat' },
    { t: S.l('Modelo de recompensa', 'Reward model'), s: S.l('se entrena aparte', 'trained separately'), k: 'w' },
    { t: S.l('Ciclo de refuerzo', 'Reinforcement loop'), s: S.l('muchas piezas', 'many moving parts'), k: 'err' },
    { t: S.l('Modelo', 'Model'), s: S.l('el asistente', 'the assistant'), k: 'lat' },
  ] as { t: string; s: string; k: Tone }[]).map((n) => ({ ...n, tn: tone(S, n.k) }));
  const kDpo = S.at('dpo-idea', 0.2, 1.4, 'io'), wob = (i: number) => (i === 1 || i === 2) && S.on('dpo-problem') && !S.on('dpo-idea') ? Math.sin(S.clock * 11 + i) * 1.4 * u * S.at('dpo-problem', 2.6, 3.2) : 0;
  names.forEach((nm, i) => {
    const b = box(i), fade = i === 1 || i === 2 ? 1 - 0.8 * kDpo : 1, a = S.reveal('dpo-problem', i * 0.55, 0.5) * fade;
    d.withAlpha(a, () => {
      const bb = { x: b.x + wob(i), y: b.y, w: b.w, h: b.h };
      card(S, bb, { tone: nm.k, fill: alpha(nm.tn.c, 0.1), lw: 2, dash: kDpo > 0.5 && (i === 1 || i === 2) ? [5, 4] : undefined });
      fitText(S, nm.t, bb.x + bb.w / 2, bb.y + bb.h * (cmp || port ? 0.4 : 0.38), bb.w - 12 * u, port ? 16 : 16, { weight: 800, color: nm.tn.ink, align: 'center', base: 'middle' });
      if (!cmp) fitText(S, nm.s, bb.x + bb.w / 2, bb.y + bb.h * (port ? 0.74 : 0.68), bb.w - 12 * u, 12, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
    });
    if (i < 3) {
      const k = S.at('dpo-problem', i * 0.55 + 0.4, i * 0.55 + 0.9, 'out'), fadeA = 1 - 0.8 * kDpo;
      if (k > 0) d.withAlpha(fadeA, () => {
        if (port) { const x = b.x + b.w / 2, y1 = b.y + b.h + 3 * u, y2 = y1 + (gap - 6 * u) * k; d.arrow(x, y1, x, y2, p.ink, 2.4, k > 0.97 ? 9 : 0.001); }
        else { const y = b.y + b.h / 2, x1 = b.x + b.w + 3 * u, x2 = x1 + (gap - 6 * u) * k; d.arrow(x1, y, x2, y, p.ink, 2.4, k > 0.97 ? 9 : 0.001); }
      });
    }
  });
  // lo complejo
  d.withAlpha(S.reveal('dpo-problem', 2.9, 0.5) * (1 - kDpo), () => {
    const b1 = box(1), b2 = box(2);
    const x = port ? b1.x : b1.x, y = port ? b2.y + b2.h + 8 * u : b1.y + b1.h + 12 * u, w = port ? bw : b2.x + b2.w - b1.x;
    if (!port) { d.line(b1.x, y - 4 * u, b2.x + b2.w, y - 4 * u, et.c, 2); }
    fitText(S, S.l('complejo y, a veces, inestable (Rafailov et al., 2023)', 'complex and often unstable (Rafailov et al., 2023)'), x, y + (port ? 0 : 4 * u), w, 13, { weight: 700, color: et.ink, base: 'top' });
  });
  // el atajo
  const kS = S.at('dpo-idea', 1.0, 2.2, 'io');
  if (kS > 0) {
    const b0 = box(0), b3 = box(3);
    let pts: [number, number][];
    if (port) { const x0 = b0.x + b0.w + 6 * u, x1 = x0 + 28 * u; pts = [[x0, b0.y + b0.h / 2], [x1, b0.y + b0.h / 2], [x1, b3.y + b3.h / 2], [x0, b3.y + b3.h / 2]]; }
    else { const y0 = b0.y - 8 * u, y1 = y0 - 22 * u; pts = [[b0.x + b0.w / 2, y0], [b0.x + b0.w / 2, y1], [b3.x + b3.w / 2, y1], [b3.x + b3.w / 2, y0]]; }
    const tot = pts.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
    let acc = 0; const cut: [number, number][] = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + l <= kS * tot) { cut.push(pts[i]); acc += l; } else { const f = (kS * tot - acc) / l; cut.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); break; } }
    d.polyline(cut, dt.c, 4);
    if (kS > 0.98) { const a = pts[pts.length - 2], b = pts[pts.length - 1]; d.arrow(a[0], a[1], b[0], b[1], dt.c, 4, 12); }
    if (kS > 0.6) d.withAlpha(clamp((kS - 0.6) / 0.4), () => {
      const t = 'DPO', tw = d.measure(t, { size: FS(S, 18), weight: 800 }) + 22 * u, mx = port ? pts[1][0] : (pts[1][0] + pts[2][0]) / 2, my = port ? (pts[1][1] + pts[2][1]) / 2 : pts[1][1];
      d.rect(mx - tw / 2, my - 15 * u, tw, 30 * u, { fill: p.surface, stroke: dt.c, lw: 2, r: 3 });
      d.text(t, mx, my, { size: FS(S, 18), weight: 800, color: dt.ink, align: 'center', base: 'middle' });
    });
  }
  // título
  const aT = S.reveal('dpo-idea', 0.3, 0.5);
  d.withAlpha(1 - S.at('dpo-idea', 0, 0.4), () => fitText(S, S.l('El camino de RLHF tiene muchas piezas', 'The RLHF route has many pieces'), r.x, r.y + 6 * u, r.w, 17, { weight: 700, color: p.ink2, base: 'top' }));
  d.withAlpha(aT, () => {
    d.text('DPO · 2023', r.x, r.y + 2 * u, { size: cmp ? 22 : 28, weight: 800, color: p.ink, base: 'top' });
    const tw = d.measure('DPO · 2023', { size: cmp ? 22 : 28, weight: 800 }) + 12 * u;
    fitText(S, S.l('mismas parejas, sin modelo de recompensa aparte ni refuerzo', 'same pairs, no separate reward model, no reinforcement learning'), r.x + tw, r.y + (cmp ? 10 : 14) * u, r.w - tw, 14, { weight: 600, color: p.ink2, base: 'top' });
  });
}

// ── 2 · la ventaja de la preferida sobre la rechazada, medida contra el modelo de partida ──
export function demoPick(S: Frame) {
  const e = effective(st(S)), idx = 3, pk = e.picks.find((q) => q.pair === idx) ?? { pair: idx, choice: DEFAULT_PICKS[idx] };
  const pair = PAIRS[idx], win = winner(pair, pk.choice), lose = loser(pair, pk.choice);
  const rw = Math.log(probOf(e.delta, win.phi) / probRef(win.phi)), rl = Math.log(probOf(e.delta, lose.phi) / probRef(lose.phi));
  return { e, pair, win, lose, pw0: probRef(win.phi), pw1: probOf(e.delta, win.phi), pl0: probRef(lose.phi), pl1: probOf(e.delta, lose.phi), rw, rl, margin: rw - rl };
}

function drawHow(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), dt = tone(S, 'dat'), et = tone(S, 'err');
  const m = demoPick(S), gap = 14 * u;
  const L: Rect = port ? { x: r.x, y: r.y, w: r.w, h: r.h * 0.34 } : { x: r.x, y: r.y, w: r.w * 0.42, h: r.h };
  const C: Rect = port ? { x: r.x, y: r.y + r.h * 0.36, w: r.w, h: r.h * 0.64 } : { x: r.x + r.w * 0.42 + gap, y: r.y, w: r.w * 0.58 - gap, h: r.h };
  // la pareja
  const ch = port ? (L.h - gap / 2) / 2 : Math.min((L.h - 40 * u - gap) / 2, 120 * u), y0 = port ? L.y : L.y + (L.h - 2 * ch - gap - 28 * u) / 2 + 28 * u;
  d.withAlpha(S.reveal('dpo-how', 0, 0.5), () => { if (!port) fitText(S, m.pair[S.lang], L.x, y0 - 24 * u, L.w, 15, { weight: 700, color: p.ink2, base: 'top' }); });
  answerCard(S, { x: L.x, y: y0, w: L.w, h: ch }, m.win, { label: S.l('P', 'P'), size: FS(S, port ? 13 : 14), state: 'yes', a: S.reveal('dpo-how', 0, 0.5), maxLines: port ? 2 : 3, traits: !cmp });
  answerCard(S, { x: L.x, y: y0 + ch + gap / 2, w: L.w, h: ch }, m.lose, { label: S.l('R', 'R'), size: FS(S, port ? 13 : 14), state: 'no', a: S.reveal('dpo-how', 0.3, 0.5), maxLines: port ? 2 : 3, traits: !cmp });
  // las barras de «cuánto cambió respecto del modelo de partida» (log del cociente), divergentes
  const aC = S.reveal('dpo-how', 0.8, 0.5), k = S.at('dpo-how', 1.0, 2.4, 'out');
  const scale = Math.max(2, Math.abs(m.rw), Math.abs(m.rl)) * 1.12;
  d.withAlpha(aC, () => {
    card(S, C, { tone: 'ink', fill: p.surface });
    const x = C.x + 12 * u, w = C.w - 24 * u;
    fitText(S, S.l('Cuánto cambió cada respuesta', 'How much each answer changed'), x, C.y + 10 * u, w, 16, { weight: 800, color: p.ink, base: 'top' });
    fitText(S, S.l('respecto del modelo de partida (log del cociente de probabilidades)', 'versus the starting model (log of the probability ratio)'), x, C.y + 32 * u, w, 12, { weight: 600, color: p.mute, base: 'top' });
    const cx = x + w / 2, half = w / 2 - 54 * u, rowH = Math.min(44 * u, (C.h - 150 * u) / 2), ry = C.y + 56 * u;
    d.line(cx, ry - 4 * u, cx, ry + 2 * rowH + 4 * u, p.lineStrong, 1.5);
    const rows: [string, number, number, number, 'dat' | 'err'][] = [[S.l('P · preferida', 'P · preferred'), m.rw, m.pw0, m.pw1, 'dat'], [S.l('R · rechazada', 'R · rejected'), m.rl, m.pl0, m.pl1, 'err']];
    rows.forEach(([lab, v, p0, p1, tn], i) => {
      const y = ry + i * rowH + rowH / 2, c = tone(S, tn), len = clamp(Math.abs(v) / scale) * half * k, bh = Math.min(16 * u, rowH * 0.42);
      d.text(lab, x, y - bh / 2 - 7 * u, { size: FS(S, 12), weight: 700, color: c.ink, base: 'bottom' });
      if (v >= 0) d.rect(cx, y - bh / 2, len, bh, { fill: c.c }); else d.rect(cx - len, y - bh / 2, len, bh, { fill: alpha(c.c, 0.2), stroke: c.c, lw: 1.8, dash: [4, 3] });
      d.text(sgn(S, v * k, 2), v >= 0 ? cx + len + 6 * u : cx - len - 6 * u, y, { size: FS(S, 14), weight: 800, font: 'mono', color: c.ink, base: 'middle', align: v >= 0 ? 'left' : 'right' });
      d.text(`${num(S, p0 * 100, 1)} % → ${num(S, p1 * 100, 1)} %`, x + w, y - bh / 2 - 7 * u, { size: FS(S, 12), weight: 600, font: 'mono', color: p.mute, align: 'right', base: 'bottom' });
    });
    // la ventaja
    const aM = S.reveal('dpo-how', 2.4, 0.5), by = ry + 2 * rowH + 10 * u;
    d.withAlpha(aM, () => {
      const t = tone(S, 'w');
      d.rect(x, by, w, 30 * u, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 1.8, r: 3 });
      fitText(S, S.l(`ventaja de P sobre R: ${sgn(S, m.margin, 2)}`, `advantage of P over R: ${sgn(S, m.margin, 2)}`), x + 10 * u, by + 15 * u, w - 20 * u, 15, { weight: 800, color: t.ink, base: 'middle' });
    });
    d.withAlpha(S.reveal('dpo-how', 3.2, 0.5), () => {
      const loss = -Math.log(sigmoid(m.margin));
      fitText(S, S.l(`pérdida = −log σ(ventaja) = ${num(S, loss, 3)}`, `loss = −log σ(advantage) = ${num(S, loss, 3)}`), x, by + 40 * u, w, 14, { weight: 700, font: 'mono', color: p.ink2, base: 'top' });
    });
    if (!m.e.own) d.withAlpha(S.reveal('dpo-how', 3.4, 0.5), () => d.text(S.l('(con elecciones de ejemplo; β = 1)', '(with example choices; β = 1)'), x, C.y + C.h - 8 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom' }));
    else d.withAlpha(S.reveal('dpo-how', 3.4, 0.5), () => d.text(S.l('(con tus elecciones; β = 1)', '(with your choices; β = 1)'), x, C.y + C.h - 8 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom' }));
  });
}

// ── 3 · las dos rutas dan los mismos números ──
function drawSecret(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, dt = tone(S, 'dat');
  const e = effective(st(S)), rl = tilt(1, e.w), dp = e.marg, mix = (v: number, i: number, k: number) => Q_REF[i] + (v - Q_REF[i]) * k;
  const T = compareTable(S, r, {
    heads: [
      { title: S.l('RLHF', 'RLHF'), sub: S.l('recompensa, luego óptimo con correa', 'reward, then optimum with leash'), t: 'w', a: S.reveal('dpo-secret', 0, 0.5) },
      { title: S.l('DPO', 'DPO'), sub: S.l('directo, sin modelo de recompensa', 'direct, no reward model'), t: 'dat', a: S.reveal('dpo-secret', 1.4, 0.5) },
    ],
    cols: [rl.map((v, i) => mix(v, i, S.at('dpo-secret', 0.4, 1.6, 'out'))), dp.map((v, i) => mix(v, i, S.at('dpo-secret', 1.6, 2.8, 'out')))],
    aNames: S.reveal('dpo-secret', 0, 0.5), gap: 22, foot: port ? 78 : 56,
  });
  // ghost: al principio las barras parten del valor del modelo de partida; aquí se muestran ya completas por columna
  const x = (T.col(0) + T.bw + 46 * u + T.col(1)) / 2 - 10 * u;
  d.withAlpha(S.reveal('dpo-secret', 2.8, 0.5), () => d.text('=', x, T.y0 + T.head + 2 * T.rowH, { size: 34, weight: 800, color: dt.ink, align: 'center', base: 'middle' }));
  d.withAlpha(S.reveal('dpo-secret', 3.2, 0.5), () => {
    const t = S.l('Mismos números: aquí, la pérdida de DPO y la de la recompensa son la misma función.', 'Same numbers: here, the DPO loss and the reward loss are the same function.');
    para(S, t, T.X, T.bottom + 8 * u, T.W, FS(S, 14), { weight: 800, color: dt.ink, maxLines: 2 });
    para(S, S.l('Juguete exacto (β = 1). En un modelo real es una aproximación.', 'Exact toy (β = 1). In a real model it is an approximation.'), T.X, T.bottom + (port ? 46 : 40) * u, T.W, FS(S, 12), { weight: 600, color: p.mute, maxLines: 2 });
  });
}
