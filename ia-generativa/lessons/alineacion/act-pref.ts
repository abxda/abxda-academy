// Acto 3 · Preferencias y modelo de recompensa: comparar dos respuestas, el modelo que puntúa, la sigmoide de Bradley–Terry,
// el turno «elige la mejor» (un modelo de recompensa diminuto aprende de tus decisiones), su resumen y el desacuerdo entre personas.
import { Plot, alpha, clamp, contains, inset, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, card, fitText, glyph, isCompact, lines, mark, num, para, person, sgn, tab, traitName } from './ui';
import { answerCard, phases, pct, splitBar, weightRows } from './board';
import { DEMO, PAIRS, PAIR_SHORT, loser, winner } from './pairs';
import { curPair, effective, probA, scoreOf, st } from './state';
import { sigmoid, TRAITS } from './toy';

const R = (S: Frame) => inset(S.full(), (isCompact(S) ? 8 : 14) * S.u);

export function drawPref(S: Frame) {
  phases(S, [
    { from: 'pref-idea', draw: drawPrefIdea },
    { from: 'rm-idea', draw: drawRmIdea },
    { from: 'rm-math', draw: drawRmMath },
    { from: 'try-rm', draw: drawBoard },
    { from: 'rm-reveal', draw: drawReveal },
    { from: 'rm-people', draw: drawPeople },
  ], 'rl-idea');
}

/** Banner con la pregunta (arriba de cada pareja). */
function questionBanner(S: Frame, r: Rect, text: string, a = 1) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'sig');
  d.withAlpha(a, () => {
    card(S, r, { tone: 'sig', fill: alpha(t.c, 0.08) });
    const lab = S.l('pregunta', 'question'), lw = d.measure(lab, { size: FS(S, 12), weight: 800 });
    d.text(lab, r.x + 10 * u, r.y + r.h / 2, { size: FS(S, 12), weight: 800, color: t.ink, base: 'middle' });
    const tx = r.x + 10 * u + lw + 10 * u, tw = r.x + r.w - tx - 10 * u;
    if (d.measure(text, { size: FS(S, 16), weight: 700 }) <= tw) fitText(S, text, tx, r.y + r.h / 2, tw, 16, { weight: 700, color: p.ink, base: 'middle' });
    else {   // pregunta larga: dos líneas más pequeñas
      const sz = FS(S, 13), n = lines(S, text, tw, sz, { weight: 700 }).length, lh = 1.12 * sz * u;
      para(S, text, tx, r.y + (r.h - Math.min(n, 2) * lh) / 2, tw, sz, { weight: 700, color: p.ink, maxLines: 2, lh: 1.12 });
    }
  });
}

// ── 1 · una persona compara dos respuestas: cada decisión es una preferencia ──
function drawPrefIdea(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S);
  const qh = (cmp ? 28 : 36) * u, gap = 12 * u, foot = (cmp ? 56 : 74) * u;
  const availH = r.h - qh - 12 * u - foot - 8 * u;
  const ch = port ? Math.min(96 * u, (availH - gap) / 2) : Math.min(cmp ? 96 * u : 140 * u, availH);
  const total = qh + 12 * u + (port ? 2 * ch + gap : ch) + 8 * u + foot, y0 = r.y + Math.max(0, (r.h - total) / 2), cy = y0 + qh + 12 * u;
  const A: Rect = port ? { x: r.x, y: cy, w: r.w, h: ch } : { x: r.x, y: cy, w: (r.w - gap) / 2, h: ch };
  const B: Rect = port ? { x: r.x, y: cy + ch + gap, w: r.w, h: ch } : { x: r.x + (r.w + gap) / 2, y: cy, w: (r.w - gap) / 2, h: ch };
  const fy = (port ? B.y + ch : cy + ch) + 8 * u;
  questionBanner(S, { x: r.x, y: y0, w: r.w, h: qh }, DEMO[S.lang], S.reveal('pref-idea', 0, 0.5));
  const sA = S.reveal('pref-idea', 2.0, 0.4);
  answerCard(S, A, DEMO.A, { label: 'A', a: S.reveal('pref-idea', 0.3, 0.5), state: 'yes', stateA: sA, hot: sA * 0.5 });
  answerCard(S, B, DEMO.B, { label: 'B', a: S.reveal('pref-idea', 0.6, 0.5), state: 'no', stateA: sA });
  // la persona
  const pc = cmp ? 2 : 3, aP = S.reveal('pref-idea', 1.1, 0.5);
  d.withAlpha(aP, () => {
    person(S, r.x + 4 * u, fy, pc, 'ink');
    d.text(S.l('una persona compara y elige', 'a person compares and chooses'), r.x + 4 * u + 6 * pc + 10 * u, fy + 4.5 * pc, { size: FS(S, 14), weight: 700, color: p.ink2, base: 'middle' });
  });
  const aT = S.reveal('pref-idea', 3.0, 0.5);
  d.withAlpha(aT, () => {
    const t = tone(S, 'dat');
    d.tag(S.l('preferencia: A mejor que B', 'preference: A over B'), r.x + r.w / 2, fy + 9 * pc + 22 * u, { color: t.ink, stroke: t.c, size: FS(S, 14), weight: 800, pad: 7 });
  });
}

// ── 2 · el modelo de recompensa lee una respuesta y devuelve un número ──
function flow3(S: Frame, r: Rect) {
  const u = S.u, port = S.portrait, gap = 12 * u;
  if (!port) {
    const ch = Math.min(r.h * 0.3, 104 * u), cw = r.w * 0.36, mw = r.w * 0.2, sw = r.w * 0.2, cy0 = r.y + (r.h - 2 * ch - gap) / 2;
    const A: Rect = { x: r.x, y: cy0, w: cw, h: ch }, B: Rect = { x: r.x, y: cy0 + ch + gap, w: cw, h: ch };
    const M: Rect = { x: r.x + cw + r.w * 0.1, y: cy0, w: mw, h: 2 * ch + gap };
    const SA: Rect = { x: r.x + r.w - sw, y: A.y + ch * 0.1, w: sw, h: ch * 0.8 }, SB: Rect = { x: r.x + r.w - sw, y: B.y + ch * 0.1, w: sw, h: ch * 0.8 };
    return { A, B, M, SA, SB, port };
  }
  const cw = (r.w - gap) / 2, ch = Math.min(r.h * 0.24, 92 * u), arrow = 30 * u, mh = 60 * u, sh = 62 * u;
  const total = ch + arrow + mh + arrow + sh, y0 = r.y + Math.max(0, (r.h - total) / 2);
  const A: Rect = { x: r.x, y: y0, w: cw, h: ch }, B: Rect = { x: r.x + cw + gap, y: y0, w: cw, h: ch };
  const M: Rect = { x: r.x, y: y0 + ch + arrow, w: r.w, h: mh };
  const SA: Rect = { x: r.x, y: M.y + mh + arrow, w: cw, h: sh }, SB: Rect = { x: r.x + cw + gap, y: M.y + mh + arrow, w: cw, h: sh };
  return { A, B, M, SA, SB, port };
}

function scoreChip(S: Frame, r: Rect, v: number, a: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'w'), max = 3.2;
  d.withAlpha(a, () => {
    card(S, r, { tone: 'w', fill: alpha(t.c, 0.08), lw: 2 });
    d.text(S.l('puntuación', 'score'), r.x + 10 * u, r.y + 8 * u, { size: FS(S, 12), weight: 700, color: t.ink, base: 'top' });
    d.text(num(S, v, 2), r.x + r.w - 10 * u, r.y + r.h * 0.5, { size: S.portrait ? 22 : 26, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
    const bx = r.x + 10 * u, bw = r.w - 20 * u, by = r.y + r.h - 12 * u;
    d.rect(bx, by - 4 * u, bw, 7 * u, { fill: p.surface2 });
    d.rect(bx, by - 4 * u, bw * clamp(v / max), 7 * u, { fill: t.c });
  });
}

function drawRmIdea(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), L = flow3(S, r), t = tone(S, 'w');
  const e = effective(st(S)), rA = scoreOf(e.w, DEMO.A.phi), rB = scoreOf(e.w, DEMO.B.phi);
  answerCard(S, L.A, DEMO.A, { label: 'A', size: FS(S, 14), a: S.reveal('rm-idea', 0, 0.4) });
  answerCard(S, L.B, DEMO.B, { label: 'B', size: FS(S, 14), a: S.reveal('rm-idea', 0, 0.4) });
  const aM = S.reveal('rm-idea', 0.4, 0.6);
  d.withAlpha(aM, () => {
    card(S, L.M, { tone: 'w', fill: alpha(t.c, 0.12), lw: 2.2 });
    const cx = L.M.x + L.M.w / 2, big = !L.port;
    fitText(S, S.l('Modelo de recompensa', 'Reward model'), cx, L.M.y + L.M.h * (big ? 0.42 : 0.38), L.M.w - 14 * u, big ? 17 : 17, { weight: 800, color: t.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('ilustrativo', 'illustrative'), cx, L.M.y + L.M.h * (big ? 0.58 : 0.72), L.M.w - 14 * u, 12, { weight: 600, color: p.mute, align: 'center', base: 'middle' });
  });
  const kA = S.at('rm-idea', 1.0, 1.8, 'out');
  const arr = (x1: number, y1: number, x2: number, y2: number) => { if (kA > 0) d.arrow(x1, y1, x1 + (x2 - x1) * kA, y1 + (y2 - y1) * kA, p.ink, 2.4, kA > 0.97 ? 9 : 0.001); };
  const sA = S.reveal('rm-idea', 2.0, 0.5), sB = S.reveal('rm-idea', 2.4, 0.5);
  if (!L.port) {
    arr(L.A.x + L.A.w + 6 * u, L.A.y + L.A.h / 2, L.M.x - 6 * u, L.A.y + L.A.h / 2);
    arr(L.B.x + L.B.w + 6 * u, L.B.y + L.B.h / 2, L.M.x - 6 * u, L.B.y + L.B.h / 2);
    const k2 = S.at('rm-idea', 1.8, 2.6, 'out');
    if (k2 > 0) { [L.SA, L.SB].forEach((c, i) => { const y = c.y + c.h / 2, x1 = L.M.x + L.M.w + 6 * u, x2 = c.x - 6 * u; d.arrow(x1, y, x1 + (x2 - x1) * k2, y, p.ink, 2.4, k2 > 0.97 ? 9 : 0.001); void i; }); }
  } else {
    arr(L.A.x + L.A.w / 2, L.A.y + L.A.h + 4 * u, L.A.x + L.A.w / 2, L.M.y - 4 * u);
    arr(L.B.x + L.B.w / 2, L.B.y + L.B.h + 4 * u, L.B.x + L.B.w / 2, L.M.y - 4 * u);
    const k2 = S.at('rm-idea', 1.8, 2.6, 'out');
    if (k2 > 0) { [L.SA, L.SB].forEach((c) => { const x = c.x + c.w / 2, y1 = L.M.y + L.M.h + 4 * u, y2 = c.y - 4 * u; d.arrow(x, y1, x, y1 + (y2 - y1) * k2, p.ink, 2.4, k2 > 0.97 ? 9 : 0.001); }); }
  }
  scoreChip(S, L.SA, rA, sA);
  scoreChip(S, L.SB, rB, sB);
}

// ── 3 · la regla de Bradley–Terry: la probabilidad de que A gane es la sigmoide de la diferencia ──
function drawRmMath(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), t = tone(S, 'w'), dt = tone(S, 'dat');
  const e = effective(st(S)), rA = scoreOf(e.w, DEMO.A.phi), rB = scoreOf(e.w, DEMO.B.phi), dif = rA - rB, prob = sigmoid(dif);
  const pr: Rect = port ? { x: r.x, y: r.y, w: r.w, h: r.h * 0.56 } : { x: r.x, y: r.y, w: r.w * 0.58, h: r.h };
  const tr: Rect = port ? { x: r.x, y: r.y + r.h * 0.58, w: r.w, h: r.h * 0.42 } : { x: r.x + r.w * 0.62, y: r.y, w: r.w * 0.38, h: r.h };
  const plot = new Plot(S, pr, { xr: [-6, 6], yr: [0, 1], pad: { l: 12, r: 12, t: 26, b: 34 } });
  const a0 = S.reveal('rm-math', 0, 0.5);
  d.withAlpha(a0, () => {
    plot.axes();
    d.text(S.l('probabilidad de que A gane', 'probability that A wins'), pr.x + 2 * u, plot.r.y - 8 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
    d.text(S.l('puntos de A menos puntos de B →', 'A’s score minus B’s score →'), plot.r.x + plot.r.w, plot.r.y + plot.r.h + 8 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.line(plot.r.x, plot.Y(0.5), plot.r.x + plot.r.w, plot.Y(0.5), p.line, 1.5, [4, 4]);
    d.text('50 %', plot.r.x + 4 * u, plot.Y(0.5) - 3 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom' });
    d.text('0', plot.X(0) + 4 * u, plot.r.y + plot.r.h - 3 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom' });
  });
  const kC = S.at('rm-math', 0.3, 2.3, 'io');
  if (kC > 0) plot.curve((x) => sigmoid(x), 'w', 3.2, { to: -6 + 12 * kC });
  // el punto de este par
  const aP = S.reveal('rm-math', 2.4, 0.5);
  if (aP > 0) d.withAlpha(aP, () => {
    plot.line(dif, 0, dif, prob, 'dat', 1.8, [5, 4]);
    plot.line(-6, prob, dif, prob, 'dat', 1.8, [5, 4]);
    plot.dot(dif, prob, 6, 'dat');
    d.text(pct(S, prob), plot.X(-6) + 4 * u, plot.Y(prob) - 4 * u, { size: FS(S, 14), weight: 800, color: dt.ink, base: 'bottom', halo: p.stage, haloW: 4 });
    d.text(sgn(S, dif, 2), plot.X(dif), plot.r.y + plot.r.h - 4 * u, { size: FS(S, 13), weight: 800, color: dt.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
  });
  // la fórmula
  const x = tr.x, w = tr.w, fs = port ? 16 : cmp ? 15 : 17;
  let y = tr.y + (port ? 4 : Math.max(8 * u, (tr.h - 190 * u) / 2)) * 1;
  d.withAlpha(S.reveal('rm-math', 0.5, 0.5), () => { fitText(S, 'σ(x) = 1 / (1 + e⁻ˣ)', x, y, w, 15, { weight: 600, font: 'mono', color: p.mute, base: 'top' }); });
  y += 28 * u;
  d.withAlpha(S.reveal('rm-math', 1.0, 0.5), () => { fitText(S, 'P(A) = σ( r(A) − r(B) )', x, y, w, fs, { weight: 800, font: 'mono', color: t.ink, base: 'top' }); });
  y += 30 * u;
  d.withAlpha(S.reveal('rm-math', 2.5, 0.5), () => {
    fitText(S, `= σ( ${num(S, rA, 2)} − ${num(S, rB, 2)} )`, x, y, w, fs, { weight: 700, font: 'mono', color: p.ink, base: 'top' });
    y += 30 * u;
    fitText(S, `= ${num(S, prob, 2)}`, x, y, w, fs + 5, { weight: 800, font: 'mono', color: dt.ink, base: 'top' });
  });
  y += 44 * u;
  d.withAlpha(S.reveal('rm-math', 3.2, 0.5), () => para(S, S.l('Se entrena subiendo esa probabilidad en cada preferencia.', 'It is trained by raising that probability on each preference.'), x, y, w, FS(S, 14), { color: p.ink2, weight: 600, maxLines: 3 }));
}

// ── 4 · el turno: elige la mejor respuesta; un modelo de recompensa diminuto aprende de ti ──
export function boardLayout(S: Frame) {
  const u = S.u, port = S.portrait, cmp = isCompact(S), r = inset(S.full(), (cmp ? 8 : 12) * u), gap = (cmp ? 8 : 12) * u;
  if (!port) {
    const lw = r.w * 0.6, ph = 18 * u, qh = 38 * u, predH = (cmp ? 38 : 48) * u;
    const chMax = r.h - ph - 6 * u - qh - 8 * u - 8 * u - predH, ch = Math.min(chMax, (cmp ? 130 : 180) * u);
    const H1 = ph + 6 * u + qh + 8 * u + ch + 8 * u + predH, y0 = r.y + Math.max(0, (r.h - H1) / 2);
    const left: Rect = { x: r.x, y: y0, w: lw, h: H1 }, panel: Rect = { x: r.x + lw + gap, y: y0, w: r.w - lw - gap, h: H1 };
    const prog: Rect = { x: left.x, y: left.y, w: left.w, h: ph }, q: Rect = { x: left.x, y: prog.y + ph + 6 * u, w: left.w, h: qh };
    const cy = q.y + qh + 8 * u, predY = cy + ch + 8 * u, cw = (left.w - gap) / 2;
    return { port, cmp, prog, q, A: { x: left.x, y: cy, w: cw, h: ch }, B: { x: left.x + cw + gap, y: cy, w: cw, h: ch }, pred: { x: left.x, y: predY, w: left.w, h: predH }, panel, fb: null as Rect | null };
  }
  const ph = 16 * u, qh = 34 * u, predH = 38 * u, panelH = 22 * u + 4 * 19 * u + 4 * u;
  const prog: Rect = { x: r.x, y: r.y, w: r.w, h: ph }, q: Rect = { x: r.x, y: prog.y + ph + 4 * u, w: r.w, h: qh };
  const panelY = r.y + r.h - panelH, predY = panelY - 6 * u - predH, cy = q.y + qh + 6 * u, ch = (predY - cy - 6 * u - gap) / 2;
  return { port, cmp, prog, q, A: { x: r.x, y: cy, w: r.w, h: ch }, B: { x: r.x, y: cy + ch + gap, w: r.w, h: ch }, pred: { x: r.x, y: predY, w: r.w, h: predH }, panel: { x: r.x, y: panelY, w: r.w, h: panelH }, fb: prog };
}

/** Cuál de las dos tarjetas está bajo el puntero (para el clic y el cursor). */
export function boardHit(S: Frame, x: number, y: number): 'A' | 'B' | null {
  const s = st(S);
  if (!S.between('try-rm', 'rm-reveal') || s.picks.length >= PAIRS.length) return null;
  const L = boardLayout(S);
  return contains(L.A, x, y) ? 'A' : contains(L.B, x, y) ? 'B' : null;
}

function progressDots(S: Frame, r: Rect, n: number) {
  const { d, pal: p } = S, u = S.u, dt = tone(S, 'dat');
  for (let i = 0; i < PAIRS.length; i++) {
    const cx = r.x + 8 * u + i * 20 * u, cy = r.y + r.h / 2;
    if (i < n) { d.circle(cx, cy, 6.5 * u, { fill: dt.c }); d.polyline([[cx - 3 * u, cy], [cx - 0.8 * u, cy + 2.4 * u], [cx + 3.4 * u, cy - 2.4 * u]], p.stage, 1.8 * u); }
    else d.circle(cx, cy, 6.5 * u, { stroke: i === n ? p.ink : p.lineStrong, lw: i === n ? 2.4 : 1.5 });
  }
  return r.x + 8 * u + PAIRS.length * 20 * u;
}

function feedback(S: Frame, r: Rect, short = false) {
  const { d, pal: p } = S, u = S.u, s = st(S);
  if (!s.last) return;
  const hit = s.last.pChosen > 0.5, tie = Math.abs(s.last.pChosen - 0.5) < 1e-6, a = clamp((S.clock - s.lastClock) / 0.3);
  d.withAlpha(a, () => {
    const x = r.x + 4 * u, cy = r.y + r.h / 2;
    if (!tie) mark(S, hit ? 'yes' : 'no', x + 7 * u, cy, 7 * u);
    else d.circle(x + 7 * u, cy, 7 * u, { stroke: p.mute, lw: 2, dash: [3, 3] });
    const txt = tie ? S.l('Aún no sabía nada: daba 50 % a tu elección', 'It knew nothing yet: it gave 50% to your choice') : S.l(`Daba ${pct(S, s.last!.pChosen)} a tu elección: ${hit ? 'lo esperaba' : 'no lo esperaba'}`, `It gave ${pct(S, s.last!.pChosen)} to your choice: ${hit ? 'expected' : 'a surprise'}`);
    if (short) fitText(S, tie ? S.l('Aún no sabía nada: 50 %', 'It knew nothing yet: 50%') : S.l(`Daba ${pct(S, s.last!.pChosen)} a tu elección`, `It gave ${pct(S, s.last!.pChosen)} to your choice`), x + 20 * u, cy, r.w - 24 * u, 12, { weight: 700, color: p.ink2, base: 'middle' });
    else para(S, txt, x + 20 * u, r.y + 2 * u, r.w - 24 * u, FS(S, 12), { weight: 700, color: p.ink2, maxLines: 2, lh: 1.2 });
  });
}

/** Resumen de las cinco elecciones: nombre del par, letra elegida y rasgos de la respuesta elegida. */
function summary(S: Frame, r: Rect, a = 1, kReveal = 1) {
  const { d, pal: p } = S, u = S.u, e = effective(st(S)), n = e.picks.length, rowH = Math.min(38 * u, r.h / Math.max(1, n));
  d.withAlpha(a, () => {
    e.picks.forEach((pk, i) => {
      const k = clamp(kReveal * (n + 1) - i), y = r.y + i * rowH;
      if (k <= 0) return;
      d.withAlpha(k, () => {
        d.rect(r.x, y + 2 * u, r.w, rowH - 4 * u, { fill: alpha(p.ink, 0.04), stroke: p.line, lw: 1, r: 3 });
        d.text(PAIR_SHORT[pk.pair][S.lang], r.x + 10 * u, y + rowH / 2, { size: FS(S, 14), weight: 700, color: p.ink, base: 'middle' });
        const ans = winner(PAIRS[pk.pair], pk.choice);
        const gx = r.x + r.w - 10 * u;
        d.text(S.l('elegiste ', 'you chose ') + pk.choice, gx - 4 * 24 * u + 8 * u, y + rowH / 2, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
        const traits = (['ok', 'long', 'warm', 'agree'] as const).filter((_, j) => ans.phi[j]);
        traits.forEach((tk, j) => glyph(S, tk, gx - (traits.length - 1 - j) * 24 * u - 8 * u, y + rowH / 2, 8 * u));
        void loser;
      });
    });
  });
}

function drawBoard(S: Frame) {
  const { d, pal: p } = S, u = S.u, s = st(S), L = boardLayout(S), t = tone(S, 'w');
  const n = s.picks.length, done = n >= PAIRS.length, a0 = S.reveal('try-rm', 0, 0.5);
  const pair = PAIRS[curPair(s)] ?? PAIRS[PAIRS.length - 1];
  d.withAlpha(a0, () => {
    const dotsEnd = progressDots(S, L.prog, n);
    d.text(done ? S.l('5 de 5', '5 of 5') : S.l(`${n + 1} de 5`, `${n + 1} of 5`), dotsEnd + 6 * u, L.prog.y + L.prog.h / 2, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
    if (L.fb) feedback(S, { x: dotsEnd + 52 * u, y: L.prog.y, w: L.prog.w - (dotsEnd - L.prog.x) - 54 * u, h: L.prog.h }, true);
  });
  const port = L.port, size = FS(S, port ? 13 : 15);
  if (!done) {
    questionBanner(S, L.q, pair[S.lang], a0);
    const fresh = clamp((S.clock - s.lastClock) / 0.25), hov = (r: Rect) => (S.ptr.inside && !S.coarse && contains(r, S.ptr.x, S.ptr.y) ? 0.6 : 0);
    answerCard(S, L.A, pair.A, { label: 'A', size, a: a0 * (n === 0 ? 1 : fresh), hot: hov(L.A), maxLines: port ? 3 : undefined });
    answerCard(S, L.B, pair.B, { label: 'B', size, a: a0 * (n === 0 ? 1 : fresh), hot: hov(L.B), maxLines: port ? 3 : undefined });
    // lo que espera el modelo de recompensa antes de que elijas
    const pA = probA(s.wShown, curPair(s));
    d.withAlpha(a0, () => {
      fitText(S, n === 0 ? S.l('Tu modelo de recompensa aún no sabe nada', 'Your reward model knows nothing yet') : S.l('Tu modelo de recompensa espera, antes de que elijas:', 'Your reward model expects, before you choose:'), L.pred.x, L.pred.y, L.pred.w, 13, { weight: 700, color: t.ink, base: 'top' });
      splitBar(S, { x: L.pred.x, y: L.pred.y + L.pred.h - 22 * u, w: L.pred.w, h: 22 * u }, pA);
    });
  } else {
    questionBanner(S, L.q, S.l('Listo: elegiste en las cinco parejas', 'Done: you chose in all five pairs'), a0);
    const r: Rect = { x: L.A.x, y: L.A.y, w: L.B.x + L.B.w - L.A.x, h: L.B.y + L.B.h - L.A.y };
    summary(S, port ? r : { x: r.x, y: r.y, w: r.w, h: r.h }, a0);
    d.withAlpha(a0, () => para(S, S.l('Cada fila: lo que preferiste, como rasgos. El modelo de recompensa aprendió de ellas.', 'Each row: what you preferred, as traits. The reward model learned from them.'), L.pred.x, L.pred.y, L.pred.w, FS(S, 13), { color: p.ink2, weight: 600, maxLines: 2 }));
  }
  // panel del modelo de recompensa
  const P = L.panel;
  d.withAlpha(a0, () => {
    if (!port) card(S, P, { tone: 'w', fill: alpha(t.c, 0.06) });
    const x = P.x + (port ? 0 : 10 * u), w = P.w - (port ? 0 : 20 * u);
    fitText(S, S.l('Tu modelo de recompensa', 'Your reward model'), x, P.y + (port ? 2 : 10) * u, w, 16, { weight: 800, color: t.ink, base: 'top' });
    let y = P.y + (port ? 22 : 32) * u;
    if (!port) { const hh = para(S, S.l('4 rasgos asignados a mano (ilustrativo)', '4 hand-assigned traits (illustrative)'), x, y - 2 * u, w, FS(S, 12), { weight: 600, color: p.mute, maxLines: 2, lh: 1.15 }); y += Math.max(22 * u, hh + 4 * u); }
    const rowH = Math.min(port ? 19 * u : (L.cmp ? 28 : 44) * u, (P.y + P.h - y - (port ? 0 : 40 * u)) / 4);
    weightRows(S, { x, y, w, h: rowH * 4 }, s.wShown, { rowH });
    if (!port) feedback(S, { x, y: y + rowH * 4 + 6 * u, w, h: 34 * u });
  });
}

// ── 5 · el resumen: tu modelo de recompensa ──
function drawReveal(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), t = tone(S, 'w');
  const e = effective(st(S)), gap = 14 * u;
  const sumRow = (port ? 30 : cmp ? 30 : 38) * u, wRow = (port ? 30 : cmp ? 28 : 40) * u;
  const sH = 28 * u + 5 * sumRow, wH = (port ? 46 : 62) * u + 4 * wRow + (port ? 34 : 44) * u;
  const rs: Rect = port ? { x: r.x, y: r.y + Math.max(0, (r.h - sH - wH - gap) / 2), w: r.w, h: sH } : { x: r.x, y: r.y + Math.max(0, (r.h - Math.max(sH, wH)) / 2), w: r.w * 0.46, h: sH };
  const rw: Rect = port ? { x: r.x, y: rs.y + sH + gap, w: r.w, h: wH } : { x: r.x + r.w * 0.46 + gap, y: rs.y, w: r.w * 0.54 - gap, h: Math.max(sH, wH) };
  d.withAlpha(S.reveal('rm-reveal', 0, 0.5), () => {
    fitText(S, e.own ? S.l('Tus elecciones', 'Your choices') : S.l('Elecciones de ejemplo', 'Example choices'), rs.x, rs.y + 2 * u, rs.w, 16, { weight: 800, color: p.ink, base: 'top' });
  });
  summary(S, { x: rs.x, y: rs.y + 28 * u, w: rs.w, h: 5 * sumRow }, 1, S.at('rm-reveal', 0.2, 1.4, 'lin'));
  d.withAlpha(S.reveal('rm-reveal', 0.6, 0.5), () => {
    if (!port) card(S, rw, { tone: 'w', fill: alpha(t.c, 0.07), lw: 2 });
    const x = rw.x + (port ? 0 : 12 * u), w = rw.w - (port ? 0 : 24 * u);
    fitText(S, e.own ? S.l('Tu modelo de recompensa', 'Your reward model') : S.l('Modelo de recompensa de ejemplo', 'Example reward model'), x, rw.y + (port ? 0 : 12 * u), w, 17, { weight: 800, color: t.ink, base: 'top' });
    para(S, S.l('cuánto suma o resta cada rasgo (ilustrativo)', 'how much each trait adds or subtracts (illustrative)'), x, rw.y + (port ? 24 : 36) * u, w, FS(S, 12), { weight: 600, color: p.mute, maxLines: 2 });
  });
  const y0 = rw.y + (port ? 46 : 62) * u;
  weightRows(S, { x: rw.x + (port ? 0 : 12 * u), y: y0, w: rw.w - (port ? 0 : 24 * u), h: wRow * 4 }, e.w, { rowH: wRow, k: S.at('rm-reveal', 0.7, 2.0, 'out'), a: S.reveal('rm-reveal', 0.6, 0.4) });
  d.withAlpha(S.reveal('rm-reveal', 3.0, 0.5), () => para(S, S.l('Solo suma rasgos: no sabe qué es verdad.', 'It only adds up traits: it does not know what is true.'), rw.x + (port ? 0 : 12 * u), y0 + wRow * 4 + 8 * u, rw.w - (port ? 0 : 24 * u), FS(S, 14), { weight: 800, color: p.ink, maxLines: 2 }));
  void tab; void TRAITS; void traitName;
}

// ── 6 · las personas no siempre coinciden ──
function drawPeople(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), gap = 12 * u;
  const pair = PAIRS[2];
  const ch = Math.min((cmp ? 60 : 78) * u, r.h * 0.2), cw = port ? (r.w - gap) / 2 : Math.min(r.w * 0.3, 300 * u);
  const blockH = ch + 12 * u + 22 * u + (cmp ? 58 : 76) * u + 14 * u + (cmp ? 56 : 66) * u;
  const y0 = r.y + Math.max(0, (r.h - blockH) / 2);
  const cx = r.x + r.w / 2;
  const A: Rect = port ? { x: r.x, y: y0, w: cw, h: ch } : { x: cx - cw - gap / 2, y: y0, w: cw, h: ch }, B: Rect = port ? { x: r.x + cw + gap, y: y0, w: cw, h: ch } : { x: cx + gap / 2, y: y0, w: cw, h: ch };
  answerCard(S, A, pair.A, { label: 'A', size: FS(S, 14), a: S.reveal('rm-people', 0, 0.4), traits: false, maxLines: 2 });
  answerCard(S, B, pair.B, { label: 'B', size: FS(S, 14), a: S.reveal('rm-people', 0.1, 0.4), traits: false, maxLines: 2 });
  // cuatro personas, cuatro decisiones (ilustrativo)
  const picks: ('A' | 'B')[] = ['A', 'B', 'A', 'A'], pc = cmp ? 2 : 3, py = y0 + ch + 12 * u + 22 * u + (cmp ? 30 : 34) * u, spacing = Math.min(70 * u, r.w / 5);
  const x0 = cx - (3 * spacing) / 2;
  d.withAlpha(S.reveal('rm-people', 0.5, 0.4), () => tab(S, S.l('ilustrativo: cuatro personas', 'illustrative: four people'), cx, y0 + ch + 12 * u + 12 * u, { align: 'center' }));
  picks.forEach((c, i) => {
    const a = S.reveal('rm-people', 0.9 + i * 0.4, 0.4), px = x0 + i * spacing - 3 * pc, ay = S.reveal('rm-people', 1.2 + i * 0.4, 0.4);
    person(S, px, py, pc, 'ink', a);
    d.withAlpha(ay, () => {
      const t = tone(S, c === 'A' ? 'dat' : 'lat'), by = py - 12 * u;
      d.circle(px + 3 * pc, by, 10 * u, { fill: alpha(t.c, 0.18), stroke: t.c, lw: 2 });
      d.text(c, px + 3 * pc, by + 0.5, { size: FS(S, 14), weight: 800, color: t.ink, align: 'center', base: 'middle' });
    });
  });
  // el dato real
  const gy = py + 9 * pc + 18 * u, gh = cmp ? 56 * u : 66 * u, gt = tone(S, 'sig');
  const aG = S.reveal('rm-people', 3.0, 0.5);
  d.withAlpha(aG, () => {
    const gw = Math.min(r.w, 560 * u), gx = cx - gw / 2;
    fitText(S, S.l('Coincidencia entre quienes etiquetaban en InstructGPT', 'Agreement between labelers in InstructGPT'), gx, gy, gw, 14, { weight: 700, color: p.ink2, base: 'top' });
    const by = gy + 22 * u, bh = 18 * u, k = S.at('rm-people', 3.2, 4.4, 'out') * 0.726;
    d.rect(gx, by, gw, bh, { fill: p.surface2, stroke: gt.c, lw: 1.5 });
    d.rect(gx, by, gw * k, bh, { fill: alpha(gt.c, 0.85) });
    d.text(num(S, k * 100, 1) + ' %', gx + gw * k + 6 * u, by + bh / 2, { size: FS(S, 16), weight: 800, color: gt.ink, base: 'middle', font: 'mono' });
    d.text(S.l('dato real (Ouyang et al., 2022)', 'real figure (Ouyang et al., 2022)'), gx, by + bh + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
  });
  void gh;
}
