// Paso dos: comparar y entrenar un juez (modelo de recompensa).
//  · una persona compara dos respuestas (preferencia) y cuántas juntó InstructGPT
//  · el juez lee una respuesta y devuelve un número; la diferencia de puntos y la sigmoide (Bradley–Terry)
//  · entrenar al juez: cinco comparaciones suben por la sigmoide con descenso del gradiente REAL (toy.ts, misma pérdida y paso)
//  · el juez de juguete con cuatro rasgos: la demostración elige en cinco parejas; luego, si quiere, la persona
//  · las personas no siempre coinciden (dato real de InstructGPT)
import { Plot, alpha, clamp, contains, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DEMO, PAIRS, PAIR_SHORT, winner, type Answer, type Pair } from './pairs';
import { PICK_AT, choose, deltasOf, demoProgress, demoWeights, effective, scoreOf, st } from './state';
import { dot, sigmoid, type Phi } from './toy';
import { DEFAULT_PICKS } from './pairs';
import {
  FS, TRAIT_KEYS, area, card, chip, fitText, fr, glyph, growArrow, lines, mark, num, para, pct, person, sgn, stepChip, tab, tight, traitName, traitTone,
} from './ui';

const STEP2 = (S: Frame) => S.l('comparar', 'compare');

/** Pregunta en una franja (arriba de cada pareja). */
export function questionBanner(S: Frame, r: Rect, text: string, a = 1) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'sig');
  d.withAlpha(a, () => {
    card(S, r, { tone: 'sig', fill: alpha(t.c, 0.08) });
    const lab = S.l('pregunta', 'question'), ls = FS(S, 12), lw = d.measure(lab, { size: ls, weight: 800 });
    d.text(lab, r.x + 10 * u, r.y + r.h / 2, { size: ls, weight: 800, color: t.ink, base: 'middle' });
    const tx = r.x + 10 * u + lw + 10 * u, tw = r.x + r.w - tx - 10 * u, sz = FS(S, 15);
    if (d.measure(text, { size: sz, weight: 700 }) <= tw) d.text(text, tx, r.y + r.h / 2, { size: sz, weight: 700, color: p.ink, base: 'middle' });
    else {
      const s2 = FS(S, 13), n = Math.min(2, lines(S, text, tw, s2, { weight: 700 }).length), lh = 1.12 * s2 * u;
      para(S, text, tx, r.y + (r.h - n * lh) / 2, tw, s2, { weight: 700, maxLines: 2, lh: 1.12 });
    }
  });
}

/** Tarjeta con una respuesta: letra, texto, rasgos (glifos) y, opcionalmente, marca (elegida/rechazada) y puntos del juez. */
export function answerCard(S: Frame, r: Rect, ans: Answer, o: { label?: string; size?: number; state?: 'yes' | 'no' | null; stateA?: number; hot?: number; a?: number; traits?: boolean; traitsA?: number; score?: number; scoreA?: number; maxLines?: number } = {}) {
  const { d, pal: p } = S, u = S.u, pad = 8 * u;
  const size = o.size ?? FS(S, 14), lh = 1.25 * size * u;
  const showT = o.traits !== false, tH = showT ? 20 * u : 0;
  d.withAlpha(o.a ?? 1, () => {
    card(S, r, { tone: o.state === 'yes' ? 'dat' : o.state === 'no' ? 'err' : 'ink', fill: p.surface, hot: o.hot, lw: o.state ? 2.2 : 1.5 });
    const lr = 9 * u;
    if (o.label) {
      d.circle(r.x + pad + lr, r.y + pad + lr, lr, { stroke: p.ink2, lw: 1.5 });
      d.text(o.label, r.x + pad + lr, r.y + pad + lr + 0.5, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle' });
    }
    const tx = r.x + pad + (o.label ? 2 * lr + 7 * u : 0), tw = r.x + r.w - pad - tx - (o.state ? 22 * u : 0);
    const maxLines = o.maxLines ?? Math.max(1, Math.floor((r.h - 2 * pad - tH) / lh));
    para(S, ans[S.lang], tx, r.y + pad, tw, size, { weight: 600, maxLines, lh: 1.25 });
    if (showT) d.withAlpha(o.traitsA ?? 1, () => {
      const y = r.y + r.h - pad - 7 * u;
      let x = r.x + pad + 8 * u, n = 0;
      TRAIT_KEYS.forEach((k, i) => { if (ans.phi[i]) { glyph(S, k, x, y, 7 * u); x += 20 * u; n++; } });
      if (!n) d.text(S.l('sin rasgos', 'no traits'), r.x + pad, y, { size: FS(S, 12), weight: 600, color: p.mute, base: 'middle' });
    });
    if (o.state) mark(S, o.state, r.x + r.w - pad - 9 * u, r.y + pad + 9 * u, 9 * u, o.stateA ?? 1);
    if (o.score !== undefined) {
      const t = tone(S, 'w');
      d.withAlpha(o.scoreA ?? 1, () => d.tag(S.l('puntos ', 'points ') + sgn(S, o.score!, 1), r.x + r.w - pad, r.y + r.h - pad - 7 * u, { color: t.ink, stroke: t.c, fill: S.pal.stage, size: FS(S, 12), align: 'right', weight: 700, pad: 5 }));
    }
  });
}

/** Los cuatro pesos del juez: glifo, nombre, barra divergente desde el cero (continua = suma, punteada = resta) y valor. */
export function weightRows(S: Frame, r: Rect, w: number[], o: { a?: number; max?: number; rowH?: number; hot?: number[] } = {}) {
  const { d, pal: p } = S, u = S.u, rowH = o.rowH ?? r.h / 4, max = o.max ?? 3;
  const size = FS(S, 14);
  const nameW = Math.max(...TRAIT_KEYS.map((t) => d.measure(traitName(S, t), { size, weight: 700 })));
  const valW = d.measure('−0.0', { size, weight: 700, font: 'mono' });
  const gx = r.x + 9 * u, nx = r.x + 24 * u;
  const bx0 = nx + nameW + 10 * u, bx1 = r.x + r.w - valW - 10 * u;
  const cx = (bx0 + bx1) / 2, half = Math.max(10, (bx1 - bx0) / 2);
  d.withAlpha(o.a ?? 1, () => {
    d.line(cx, r.y + 2 * u, cx, r.y + 4 * rowH - 2 * u, p.lineStrong, 1.5);
    TRAIT_KEYS.forEach((t, i) => {
      const y = r.y + i * rowH + rowH / 2, c = tone(S, traitTone(t)), v = w[i] ?? 0, len = clamp(Math.abs(v) / max) * half, bh = Math.min(13 * u, rowH * 0.5);
      if (o.hot?.[i]) d.rect(r.x, y - rowH / 2 + 1, r.w, rowH - 2, { fill: alpha(c.c, 0.12 * o.hot[i]), r: 3 });
      glyph(S, t, gx, y, 7.5 * u);
      d.text(traitName(S, t), nx, y, { size, weight: 700, color: p.ink, base: 'middle' });
      if (v >= 0) d.rect(cx, y - bh / 2, len, bh, { fill: c.c });
      else d.rect(cx - len, y - bh / 2, len, bh, { fill: alpha(c.c, 0.18), stroke: c.c, lw: 1.8, dash: [4, 3] });
      d.text(sgn(S, v, 1), r.x + r.w - 2 * u, y, { size, weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    });
  });
}

// ── 1 · una persona compara: cada decisión es una preferencia ──
export function drawPair(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const chipH = stepChip(S, r, 2, STEP2(S), fr(S, 'pref-pair', 0, 0.08));
  const top = r.y + chipH + 10 * u;
  const leftW = port ? r.w : r.w * 0.56, gap = 10 * u;
  const qh = (cmp ? 30 : 36) * u;
  const ch = port ? (cmp ? 44 : 50) * u : Math.min((cmp ? 40 : 92) * u, (r.y + r.h - top - qh - 90 * u) / 2);
  const Q: Rect = { x: r.x, y: top, w: leftW, h: qh };
  const A: Rect = port ? { x: r.x, y: top + qh + gap, w: (leftW - gap) / 2, h: ch } : { x: r.x, y: top + qh + gap, w: leftW, h: ch };
  const B: Rect = port ? { x: r.x + (leftW + gap) / 2, y: A.y, w: (leftW - gap) / 2, h: ch } : { x: r.x, y: A.y + ch + gap, w: leftW, h: ch };
  questionBanner(S, Q, DEMO[S.lang], fr(S, 'pref-pair', 0.06, 0.16));
  const sA = fr(S, 'pref-pair', 0.68, 0.78);
  answerCard(S, A, DEMO.A, { label: 'A', a: fr(S, 'pref-pair', 0.14, 0.22), state: sA > 0 ? 'yes' : null, stateA: sA, hot: sA * 0.5, traits: false, maxLines: 1 });
  answerCard(S, B, DEMO.B, { label: 'B', a: fr(S, 'pref-pair', 0.2, 0.28), state: sA > 0 ? 'no' : null, stateA: sA, traits: false, maxLines: 1 });
  const by = (port ? A.y + ch : B.y + ch) + 12 * u, pc = Math.max(1.8, (cmp ? 2 : 2.6) * u);
  d.withAlpha(fr(S, 'pref-pair', 0.4, 0.5), () => {
    person(S, r.x + 2 * u, by, pc, 'ink');
    fitText(S, S.l('una persona compara y marca la mejor', 'a person compares and marks the better one'), r.x + 6 * pc + 12 * u, by + 4.5 * pc, leftW - 6 * pc - 14 * u, 14, { weight: 700, color: p.ink2, base: 'middle' });
  });
  const dt = tone(S, 'dat');
  d.withAlpha(fr(S, 'pref-name', 0.02, 0.14), () => chip(S, S.l('preferencia: A mejor que B', 'preference: A over B'), r.x + leftW / 2, by + 9 * pc + 22 * u, 'dat', { size: 14, maxW: leftW }));
  // cuántas: InstructGPT
  const R: Rect = port ? { x: r.x, y: by + 9 * pc + 44 * u, w: r.w, h: r.y + r.h - (by + 9 * pc + 44 * u) } : { x: r.x + leftW + 28 * u, y: top, w: r.w - leftW - 28 * u, h: r.y + r.h - top };
  const aN = fr(S, 'pref-name', 0.3, 0.42), aK = fr(S, 'pref-name', 0.62, 0.74);
  if (R.h > 40 * u) {
    d.withAlpha(aN, () => {
      fitText(S, S.l('InstructGPT (2022)', 'InstructGPT (2022)'), R.x, R.y + 4 * u, R.w, 14, { weight: 700, color: p.ink2, base: 'top' });
      fitText(S, S.l('≈ 33 000 indicaciones', '≈ 33,000 prompts'), R.x, R.y + 24 * u, R.w, port ? 18 : 22, { weight: 800, font: 'mono', color: dt.ink, base: 'top' });
    });
    const y2 = R.y + (port ? 50 : 62) * u;
    d.withAlpha(aK, () => {
      fitText(S, S.l('en cada una, de 4 a 9 respuestas ordenadas', 'for each, 4 to 9 answers ranked'), R.x, y2, R.w, 14, { weight: 700, color: p.ink2, base: 'top' });
      // una pila de cuatro respuestas con su lugar (ilustrativo)
      const n = 4, cw = Math.min(54 * u, (R.w - 3 * 8 * u) / n), chh = Math.min(40 * u, R.y + R.h - y2 - 30 * u);
      if (chh > 18 * u) for (let i = 0; i < n; i++) {
        const x = R.x + i * (cw + 8 * u), y = y2 + 24 * u, k = fr(S, 'pref-name', 0.68 + i * 0.05, 0.74 + i * 0.05);
        d.withAlpha(k, () => {
          d.rect(x, y, cw, chh, { fill: p.surface, stroke: i === 0 ? dt.c : p.lineStrong, lw: i === 0 ? 2 : 1.3, r: 3 });
          d.text(String(i + 1) + '.º', x + cw / 2, y + chh / 2, { size: FS(S, 14), weight: 800, color: i === 0 ? dt.ink : p.ink2, align: 'center', base: 'middle' });
        });
      }
    });
  }
}

// ── 2 · el juez: lee una respuesta y devuelve un número ──
export function drawRm(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), wt = tone(S, 'w');
  const chipH = stepChip(S, r, 2, STEP2(S));
  const top = r.y + chipH + 10 * u, H = r.y + r.h - top;
  const gap = 12 * u;
  // geometría: respuestas → juez → puntos
  let A: Rect, B: Rect, M: Rect, SA: Rect, SB: Rect;
  if (!port) {
    const ch = Math.min(H * 0.3, 80 * u), cw = r.w * 0.34, mw = r.w * 0.22, sw = r.w * 0.2, y0 = top + (H - 2 * ch - gap) / 2 - 10 * u;
    A = { x: r.x, y: y0, w: cw, h: ch }; B = { x: r.x, y: y0 + ch + gap, w: cw, h: ch };
    M = { x: r.x + cw + r.w * 0.08, y: y0, w: mw, h: 2 * ch + gap };
    SA = { x: r.x + r.w - sw, y: A.y + ch * 0.1, w: sw, h: ch * 0.8 }; SB = { x: r.x + r.w - sw, y: B.y + ch * 0.1, w: sw, h: ch * 0.8 };
  } else {
    const cw = (r.w - gap) / 2, ch = (cmp ? 46 : 58) * u, ar = (cmp ? 18 : 26) * u, mh = (cmp ? 46 : 56) * u, sh = (cmp ? 44 : 54) * u;
    const total = ch + ar + mh + ar + sh, y0 = top + Math.max(0, (H - total - 40 * u) / 2);
    A = { x: r.x, y: y0, w: cw, h: ch }; B = { x: r.x + cw + gap, y: y0, w: cw, h: ch };
    M = { x: r.x, y: y0 + ch + ar, w: r.w, h: mh };
    SA = { x: r.x, y: M.y + mh + ar, w: cw, h: sh }; SB = { x: r.x + cw + gap, y: M.y + mh + ar, w: cw, h: sh };
  }
  const aA = fr(S, 'rm-what', 0.06, 0.16), aM = fr(S, 'rm-what', 0.22, 0.34), kIn = fr(S, 'rm-what', 0.4, 0.55, 'io'), kOut = fr(S, 'rm-what', 0.62, 0.74, 'io');
  const aB = fr(S, 'rm-goal', 0.3, 0.4), kInB = fr(S, 'rm-goal', 0.34, 0.46, 'io'), kOutB = fr(S, 'rm-goal', 0.46, 0.56, 'io');
  answerCard(S, A, DEMO.A, { label: 'A', a: aA, traits: false, maxLines: 2 });
  answerCard(S, B, DEMO.B, { label: 'B', a: aB, traits: false, maxLines: 2 });
  d.withAlpha(aM, () => {
    card(S, M, { tone: 'w', fill: alpha(wt.c, 0.12), lw: 2.2 });
    fitText(S, S.l('Modelo de recompensa', 'Reward model'), M.x + M.w / 2, M.y + M.h * (port ? 0.38 : 0.44), M.w - 14 * u, 16, { weight: 800, color: wt.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('(el juez)', '(the judge)'), M.x + M.w / 2, M.y + M.h * (port ? 0.72 : 0.58), M.w - 14 * u, 13, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
  const arrows = (from: Rect, mid: Rect, to: Rect, k1: number, k2: number) => {
    if (!port) {
      const y = from.y + from.h / 2;
      growArrow(S, from.x + from.w + 6 * u, y, mid.x - 6 * u, y, k1, p.ink, 2.4);
      growArrow(S, mid.x + mid.w + 6 * u, y, to.x - 6 * u, y, k2, p.ink, 2.4);
    } else {
      const x = from.x + from.w / 2;
      growArrow(S, x, from.y + from.h + 4 * u, x, mid.y - 4 * u, k1, p.ink, 2.4);
      growArrow(S, x, mid.y + mid.h + 4 * u, x, to.y - 4 * u, k2, p.ink, 2.4);
    }
  };
  arrows(A, M, SA, kIn, kOut);
  arrows(B, M, SB, kInB, kOutB);
  const score = (rc: Rect, v: number | null, a: number) => d.withAlpha(a, () => {
    card(S, rc, { tone: 'w', fill: alpha(wt.c, 0.08), lw: 2 });
    d.text(S.l('puntos', 'points'), rc.x + 8 * u, rc.y + 7 * u, { size: FS(S, 12), weight: 700, color: wt.ink, base: 'top' });
    d.text(v === null ? '?' : num(S, v, 0), rc.x + rc.w - 10 * u, rc.y + rc.h * 0.55, { size: port ? 22 : 26, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
  });
  const known = fr(S, 'rm-what', 0.8, 0.9);
  score(SA, known > 0 ? 2 : null, fr(S, 'rm-what', 0.7, 0.8));
  score(SB, 0, fr(S, 'rm-goal', 0.54, 0.62));
  // la meta y la diferencia
  const aG = fr(S, 'rm-goal', 0.06, 0.18), aD = fr(S, 'rm-goal', 0.72, 0.84);
  const ly = port ? SA.y + SA.h + 18 * u : Math.max(SB.y + SB.h, B.y + B.h) + 22 * u;
  d.withAlpha(aG, () => fitText(S, S.l('meta: la preferida (A) saca más puntos', 'goal: the preferred one (A) gets more points'), r.x, ly, r.w * (port ? 1 : 0.6), 14, { weight: 700, color: p.ink2, base: 'middle' }));
  d.withAlpha(aD, () => chip(S, S.l('diferencia: 2 − 0 = 2', 'difference: 2 − 0 = 2'), port ? r.x + r.w / 2 : r.x + r.w - 4 * u, port ? ly + 24 * u : ly, 'w', { align: port ? 'center' : 'right', size: 15 }));
  d.withAlpha(fr(S, 'rm-what', 0.85, 0.95), () => fitText(S, S.l('puntos ilustrativos', 'illustrative points'), r.x + r.w, r.y + 10 * u, r.w * 0.4, 12, { weight: 600, color: p.mute, align: 'right', base: 'middle' }));
}

// ── 3 · la sigmoide: de la diferencia de puntos a la probabilidad, y el entrenamiento del juez ──
/** Trayectoria REAL del descenso del gradiente de fitRM (misma pérdida, paso y regularización) sobre las cinco comparaciones del ejemplo. */
let PATH: number[][] | null = null;
function rmPath(): number[][] {
  if (PATH) return PATH;
  const deltas = deltasOf(DEFAULT_PICKS.map((choice, pair) => ({ pair, choice })));
  const w = [0, 0, 0, 0], out: number[][] = [w.slice()], lambda = 0.1, lr = 0.5;
  for (let t = 0; t < 400; t++) {
    const g = w.map((wj) => lambda * wj);
    for (const dd of deltas) { const c = -(1 - sigmoid(dot(w, dd))); for (let j = 0; j < 4; j++) g[j] += c * dd[j]; }
    for (let j = 0; j < 4; j++) w[j] -= lr * g[j];
    out.push(w.slice());
  }
  PATH = out;
  return out;
}
const SIG_DELTAS = () => deltasOf(DEFAULT_PICKS.map((choice, pair) => ({ pair, choice })));

export function drawSig(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const chipH = stepChip(S, r, 2, STEP2(S));
  const top = r.y + chipH + 8 * u;
  const W = Math.min(r.w, 760 * u), X = r.x + (r.w - W) / 2;
  const yLab = S.l('probabilidad de que gane la preferida', 'probability that the preferred one wins');
  const xLab = S.l('diferencia de puntos: preferida − rechazada', 'difference in points: preferred − rejected');
  const pr: Rect = { x: X, y: top + 22 * u, w: W, h: r.y + r.h - top - 22 * u - (cmp ? 4 : 10) * u };
  const plot = new Plot(S, pr, { xr: [-4, 4], yr: [0, 1], pad: { l: 40, r: 12, t: 6, b: 38 }, xTicks: [-4, -2, 0, 2, 4], yTicks: [0, 0.5, 1], tickFmt: (v) => (v <= 1 && v >= 0 && pr.h > 0 && Number.isFinite(v) && (v === 0.5 || v === 1) ? pct(S, v) : S.n(v, 0)) });
  // ejes: primero el horizontal, luego el vertical
  const aX = fr(S, 'rm-prob', 0.04, 0.14), aY = fr(S, 'rm-prob', 0.14, 0.24);
  d.withAlpha(aX, () => {
    const R = plot.r;
    d.line(R.x, R.y + R.h, R.x + R.w, R.y + R.h, p.lineStrong, 1.5);
    [-4, -2, 0, 2, 4].forEach((v) => { d.line(plot.X(v), R.y + R.h, plot.X(v), R.y + R.h + 4 * u, p.lineStrong, 1.5); d.text(S.n(v, 0), plot.X(v), R.y + R.h + 7 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    fitText(S, xLab + ' →', R.x + R.w, R.y + R.h + 24 * u, R.w, 13, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  d.withAlpha(aY, () => {
    const R = plot.r;
    d.line(R.x, R.y, R.x, R.y + R.h, p.lineStrong, 1.5);
    [0, 0.5, 1].forEach((v) => { d.line(R.x - 4 * u, plot.Y(v), R.x, plot.Y(v), p.lineStrong, 1.5); d.text(v === 0 ? '0 %' : pct(S, v), R.x - 6 * u, plot.Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    fitText(S, '↑ ' + yLab, X, top + 10 * u, W, 13, { weight: 700, color: p.ink2, base: 'middle' });
    d.line(R.x, plot.Y(0.5), R.x + R.w, plot.Y(0.5), p.line, 1.2, [4, 4]);
  });
  const kC = fr(S, 'rm-prob', 0.24, 0.5, 'io');
  if (kC > 0) plot.curve((x) => sigmoid(x), 'w', 3.2, { to: -4 + 8 * kC });
  const train = S.on('rm-train');
  // dos lecturas: diferencia 0 → 50 %, diferencia 2 → 88 %
  const pt = (x: number, a: number, label: string) => d.withAlpha(a, () => {
    plot.line(x, 0, x, sigmoid(x), 'dat', 1.6, [5, 4]);
    plot.line(-4, sigmoid(x), x, sigmoid(x), 'dat', 1.6, [5, 4]);
    plot.dot(x, sigmoid(x), 6, 'dat');
    if (x === 0) d.text(label, plot.X(x) + 10 * u, plot.Y(sigmoid(x)) + 12 * u, { size: FS(S, 14), weight: 800, color: dt.ink, base: 'middle', halo: p.stage, haloW: 4 });
    else d.text(label, plot.X(x) - 10 * u, plot.Y(sigmoid(x)) - 12 * u, { size: FS(S, 14), weight: 800, color: dt.ink, align: 'right', base: 'middle', halo: p.stage, haloW: 4 });
  });
  const fadeT = 1 - fr(S, 'rm-train', 0, 0.12);
  pt(0, fr(S, 'rm-prob', 0.58, 0.68) * fadeT, S.l('diferencia 0 → 50 %', 'difference 0 → 50%'));
  pt(2, fr(S, 'rm-prob', 0.82, 0.92) * fadeT, S.l('diferencia 2 → 88 %', 'difference 2 → 88%'));
  // entrenamiento: cinco comparaciones suben por la curva
  if (train) {
    const path = rmPath(), k = fr(S, 'rm-train', 0.32, 0.88, 'lin'), it = Math.min(path.length - 1, Math.round(Math.pow(k, 1.6) * (path.length - 1)));
    const w = path[it], deltas = SIG_DELTAS();
    d.withAlpha(fr(S, 'rm-train', 0.14, 0.24), () => {
      deltas.forEach((dd: Phi, i) => {
        const x = clamp(dot(w, dd), -4, 4), y = sigmoid(dot(w, dd));
        plot.dot(x, y, 6.5, 'w');
        const dup = deltas.findIndex((o) => Math.abs(dot(w, o) - dot(w, dd)) < 0.02) < i;
        d.text(String(i + 1), plot.X(x) + (dup ? 12 : -12) * u, plot.Y(y) + (dup ? 10 : -10) * u, { size: FS(S, 12), weight: 800, color: wt.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 3 });
      });
      const avg = deltas.reduce((s, dd) => s + sigmoid(dot(w, dd)), 0) / deltas.length;
      const c1 = S.l('cada punto: una comparación', 'each dot: one comparison'), c2 = S.l(`probabilidad promedio: ${pct(S, avg)}`, `average probability: ${pct(S, avg)}`);
      const b = chip(S, c1, plot.r.x + 8 * u, plot.r.y + 14 * u, 'w', { align: 'left', size: 13, maxW: plot.r.w * 0.55 });
      chip(S, c2, plot.r.x + 8 * u, plot.r.y + 14 * u + b.h + 6 * u, 'w', { align: 'left', size: 13, maxW: plot.r.w * 0.55 });
    });
  }
}

// ── 4 · el juez de juguete con cuatro rasgos; la demostración elige; luego, si quiere, la persona ──
export function boardLayout(S: Frame) {
  const u = S.u, port = S.portrait, cmp = tight(S), r = area(S), gap = (cmp ? 7 : 10) * u;
  const chipH = (FS(S, 13) * u + 10 * u) + (cmp ? 6 : 8) * u, top = r.y + chipH;
  if (!port) {
    const lw = r.w * 0.58, ph = 16 * u, qh = (cmp ? 30 : 36) * u, avail = r.y + r.h - top;
    const ch = Math.min(avail - ph - qh - 2 * gap, (cmp ? 150 : 190) * u);
    const left: Rect = { x: r.x, y: top, w: lw, h: avail };
    const prog: Rect = { x: left.x, y: top, w: lw, h: ph }, q: Rect = { x: left.x, y: prog.y + ph + gap, w: lw, h: qh };
    const cy = q.y + qh + gap, cw = (lw - gap) / 2;
    const panel: Rect = { x: r.x + lw + 2 * gap, y: top, w: r.w - lw - 2 * gap, h: avail };
    return { r, port, cmp, prog, q, A: { x: left.x, y: cy, w: cw, h: ch }, B: { x: left.x + cw + gap, y: cy, w: cw, h: ch }, panel, list: { x: left.x, y: q.y, w: lw, h: avail - ph - gap } };
  }
  const ph = 14 * u, qh = (cmp ? 30 : 34) * u, rowH = (cmp ? 17 : 20) * u, panelH = 20 * u + 4 * rowH + 4 * u;
  const prog: Rect = { x: r.x, y: top, w: r.w, h: ph }, q: Rect = { x: r.x, y: prog.y + ph + 6 * u, w: r.w, h: qh };
  const panelY = r.y + r.h - panelH, cy = q.y + qh + 6 * u, ch = (panelY - 8 * u - cy - gap) / 2;
  return { r, port, cmp, prog, q, A: { x: r.x, y: cy, w: r.w, h: ch }, B: { x: r.x, y: cy + ch + gap, w: r.w, h: ch }, panel: { x: r.x, y: panelY, w: r.w, h: panelH }, list: { x: r.x, y: q.y, w: r.w, h: panelY - 8 * u - q.y } };
}

/** ¿Qué tarjeta está bajo el puntero? (para el clic y el cursor) */
export function boardHit(S: Frame, x: number, y: number): 'A' | 'B' | null {
  if (!S.between('rm-demo', 'rm-result')) return null;
  const L = boardLayout(S);
  return contains(L.A, x, y) ? 'A' : contains(L.B, x, y) ? 'B' : null;
}
export function boardPointer(S: Frame, type: string, x: number, y: number) {
  if (type !== 'down') return;
  const c = boardHit(S, x, y);
  if (c) choose(S, c);
}

function progressDots(S: Frame, r: Rect, n: number, cur: number) {
  const { d, pal: p } = S, u = S.u, dt = tone(S, 'dat'), rr = Math.min(6.5 * u, r.h / 2);
  for (let i = 0; i < PAIRS.length; i++) {
    const cx = r.x + rr + 2 * u + i * (2 * rr + 8 * u), cy = r.y + r.h / 2;
    if (i < n) { d.circle(cx, cy, rr, { fill: dt.c }); d.polyline([[cx - rr * 0.45, cy], [cx - rr * 0.1, cy + rr * 0.38], [cx + rr * 0.5, cy - rr * 0.35]], p.stage, 1.8); }
    else d.circle(cx, cy, rr, { stroke: i === cur ? p.ink : p.lineStrong, lw: i === cur ? 2.4 : 1.4 });
  }
  return r.x + PAIRS.length * (2 * rr + 8 * u) + 4 * u;
}

/** Lo que muestra el tablero en cada momento. */
function boardState(S: Frame) {
  const s = st(S);
  const own = s.own && S.on('rm-demo');
  if (own) {
    const n = s.picks.length, done = n >= PAIRS.length, pair = done ? PAIRS.length - 1 : n;
    const last = n ? s.picks[n - 1] : null, fresh = clamp((S.clock - s.lastClock) / 0.35);
    return { own, n, done, pair, w: s.wShown, wLabel: S.l('tus pesos', 'your weights'), mark: done && last ? last.choice : null, markA: 1, hotC: null as 'A' | 'B' | null, hotA: 0, cardA: done ? 1 : fresh, picks: s.picks };
  }
  if (S.on('try-rm')) {
    return { own: false, n: 0, done: false, pair: 0, w: demoWeights(5), wLabel: S.l('pesos del ejemplo', 'example’s weights'), mark: null, markA: 0, hotC: null, hotA: 0, cardA: 1, picks: [] };
  }
  if (!S.on('rm-demo')) return { own: false, n: 0, done: false, pair: 0, w: [0, 0, 0, 0], wLabel: S.l('pesos', 'weights'), mark: null, markA: 0, hotC: null, hotA: 0, cardA: 1, picks: [] };
  // demostración: elige en las cinco parejas, una tras otra
  const x = fr(S, 'rm-demo', 0, 1, 'lin');
  let i = 0; while (i < 4 && x > PICK_AT[i] + 0.05) i++;
  const chosen = DEFAULT_PICKS[i], at = PICK_AT[i];
  const picked = x >= at, kW = clamp((x - at) / 0.06);
  const w0 = demoWeights(i), w1 = demoWeights(i + 1), w = picked ? w0.map((v, j) => lerp(v, w1[j], kW)) : w0;
  const enter = i === 0 ? 1 : clamp((x - (PICK_AT[i - 1] + 0.05)) / 0.03);
  return {
    own: false, n: picked ? i + 1 : i, done: false, pair: i, w, wLabel: S.l('pesos', 'weights'),
    mark: picked ? chosen : null, markA: clamp((x - at) / 0.02), hotC: chosen as 'A' | 'B' | null, hotA: clamp((x - (at - 0.06)) / 0.03), cardA: enter,
    picks: DEFAULT_PICKS.slice(0, picked ? i + 1 : i).map((choice, pair) => ({ pair, choice })),
  };
}

export function drawBoard(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = boardLayout(S), wt = tone(S, 'w');
  stepChip(S, L.r, 2, STEP2(S));
  const B = boardState(S), pair: Pair = PAIRS[B.pair];
  const toResult = fr(S, 'rm-result', 0, 0.12);
  const aBoard = fr(S, 'rm-toy', 0, 0.1) * (1 - toResult);
  const size = FS(S, L.port ? 13 : 14);
  const tA = fr(S, 'rm-toy', 0.25, 0.4);
  if (aBoard > 0) d.withAlpha(aBoard, () => {
    const end = progressDots(S, L.prog, B.n, B.pair);
    const own = B.own || S.on('try-rm');
    const txt = own ? (B.done ? S.l('listo: 5 de 5 · toca A o B para otra ronda', 'done: 5 of 5 · tap A or B for another round') : S.l(`tu turno: pareja ${B.pair + 1} de 5`, `your turn: pair ${B.pair + 1} of 5`)) : S.l(`pareja ${B.pair + 1} de 5`, `pair ${B.pair + 1} of 5`);
    fitText(S, txt, end + 4 * u, L.prog.y + L.prog.h / 2, L.prog.x + L.prog.w - end - 4 * u, 13, { weight: 700, color: own ? p.ink : p.ink2, base: 'middle' });
    questionBanner(S, L.q, pair[S.lang], B.cardA);
    const score = (ans: Answer) => scoreOf(B.w, ans.phi);
    const hov = (r: Rect) => (S.ptr.inside && !S.coarse && S.between('rm-demo', 'rm-result') && contains(r, S.ptr.x, S.ptr.y) ? 0.5 : 0);
    const st_ = (c: 'A' | 'B') => (B.mark ? (B.mark === c ? 'yes' : 'no') : null);
    answerCard(S, L.A, pair.A, { label: 'A', size, a: B.cardA, hot: Math.max(hov(L.A), B.hotC === 'A' ? 0.5 * B.hotA : 0), state: st_('A'), stateA: B.markA, traitsA: tA, score: score(pair.A), scoreA: tA });
    answerCard(S, L.B, pair.B, { label: 'B', size, a: B.cardA, hot: Math.max(hov(L.B), B.hotC === 'B' ? 0.5 * B.hotA : 0), state: st_('B'), stateA: B.markA, traitsA: tA, score: score(pair.B), scoreA: tA });
    // el «dedo» de la demostración: un círculo que señala la tarjeta elegida
    if (!B.own && B.hotC && B.hotA > 0 && B.hotA < 1 && S.is('rm-demo')) {
      const rc = B.hotC === 'A' ? L.A : L.B;
      d.circle(rc.x + rc.w * 0.5, rc.y + rc.h * 0.55, (10 + 8 * (1 - B.hotA)) * u, { stroke: p.ink, lw: 2, a: 0.7 });
    }
  });
  // panel del juez: los cuatro pesos
  const P = L.panel, aP = fr(S, 'rm-toy', 0.5, 0.62);
  d.withAlpha(aP, () => {
    if (!L.port) card(S, P, { tone: 'w', fill: alpha(wt.c, 0.06) });
    const x = P.x + (L.port ? 0 : 10 * u), w = P.w - (L.port ? 0 : 20 * u);
    const title = S.l('Juez de juguete', 'Toy judge');
    fitText(S, title + ' · ' + B.wLabel, x, P.y + (L.port ? 2 : 10) * u, w, 15, { weight: 800, color: wt.ink, base: 'top' });
    let y = P.y + (L.port ? 20 : 32) * u;
    if (!L.port) { const hh = para(S, S.l('cuántos puntos suma o resta cada rasgo (rasgos marcados a mano, ilustrativo)', 'how many points each trait adds or subtracts (hand-marked traits, illustrative)'), x, y, w, FS(S, 12), { weight: 600, color: p.mute, maxLines: 3, lh: 1.15 }); y += hh + 8 * u; }
    const rowH = Math.min(L.port ? (L.cmp ? 17 : 20) * u : (L.cmp ? 26 : 38) * u, (P.y + P.h - y - 4 * u) / 4);
    const hot0 = S.is('rm-toy') ? fr(S, 'rm-toy', 0.8, 0.9) : 0;
    weightRows(S, { x, y, w, h: rowH * 4 }, B.w, { rowH, hot: [hot0, hot0, hot0, hot0] });
  });
  // el resumen: lo que aprendió
  if (toResult > 0) d.withAlpha(toResult, () => drawResult(S, L));
}

function drawResult(S: Frame, L: ReturnType<typeof boardLayout>) {
  const { d, pal: p } = S, u = S.u, e = effective(st(S)), R = L.list;
  fitText(S, e.own ? S.l('Tus elecciones', 'Your choices') : S.l('Elecciones del ejemplo', 'The example’s choices'), R.x, R.y + 2 * u, R.w, 15, { weight: 800, base: 'top' });
  const rowH = Math.min((L.cmp ? 26 : 34) * u, (R.h - 26 * u - (L.port ? 4 : 50) * u) / 5);
  e.picks.forEach((pk, i) => {
    const y = R.y + 24 * u + i * rowH, k = fr(S, 'rm-result', 0.08 + i * 0.05, 0.14 + i * 0.05);
    d.withAlpha(k, () => {
      d.rect(R.x, y + 2 * u, R.w, rowH - 4 * u, { fill: alpha(p.ink, 0.04), stroke: p.line, lw: 1, r: 3 });
      d.text(PAIR_SHORT[pk.pair][S.lang], R.x + 10 * u, y + rowH / 2, { size: FS(S, 13), weight: 700, base: 'middle' });
      const ans = winner(PAIRS[pk.pair], pk.choice);
      const traits = TRAIT_KEYS.filter((_, j) => ans.phi[j]);
      const gx = R.x + R.w - 12 * u;
      traits.forEach((tk, j) => glyph(S, tk, gx - (traits.length - 1 - j) * 20 * u, y + rowH / 2, 7 * u));
      fitText(S, S.l('eligió ', 'chose ') + pk.choice, gx - traits.length * 20 * u - 4 * u, y + rowH / 2, R.w * 0.4, 13, { weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    });
  });
  if (!L.port) d.withAlpha(fr(S, 'rm-result', 0.55, 0.68), () => para(S, S.l('No sabe qué es verdad: solo suma rasgos según lo que alguien prefirió.', 'It does not know what is true: it only adds up traits according to what someone preferred.'), R.x, R.y + 24 * u + 5 * rowH + 8 * u, R.w, FS(S, 14), { weight: 800, maxLines: 2 }));
}

// ── 5 · las personas no siempre coinciden ──
export function drawPeople(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), gap = 12 * u;
  stepChip(S, r, 2, STEP2(S));
  const pair = PAIRS[2];
  const top0 = r.y + (FS(S, 13) * u + 10 * u) + 10 * u;
  const ch = (cmp ? 48 : 60) * u, cw = port ? (r.w - gap) / 2 : Math.min(r.w * 0.32, 300 * u);
  const pc0 = Math.max(1.8, (cmp ? 2 : 2.8) * u), contentH = (cmp ? 28 : 32) * u + 8 * u + ch + (cmp ? 30 : 40) * u + 9 * pc0 + (cmp ? 12 : 22) * u + 40 * u;
  const top = top0 + Math.max(0, (r.y + r.h - top0 - contentH) * 0.4);
  const cx = r.x + r.w / 2;
  const Q: Rect = { x: port ? r.x : cx - cw - gap / 2, y: top, w: port ? r.w : 2 * cw + gap, h: (cmp ? 28 : 32) * u };
  const A: Rect = { x: port ? r.x : cx - cw - gap / 2, y: Q.y + Q.h + 8 * u, w: cw, h: ch }, B: Rect = { x: port ? r.x + cw + gap : cx + gap / 2, y: A.y, w: cw, h: ch };
  questionBanner(S, Q, pair[S.lang], fr(S, 'rm-people', 0, 0.08));
  answerCard(S, A, pair.A, { label: 'A', size: FS(S, 13), a: fr(S, 'rm-people', 0.02, 0.1), traits: false, maxLines: 2 });
  answerCard(S, B, pair.B, { label: 'B', size: FS(S, 13), a: fr(S, 'rm-people', 0.04, 0.12), traits: false, maxLines: 2 });
  // cuatro personas, cuatro decisiones (ilustrativo)
  const picks: ('A' | 'B')[] = ['A', 'B', 'A', 'B'], pc = Math.max(1.8, (cmp ? 2 : 2.8) * u), spacing = Math.min(74 * u, r.w / 5);
  const py = A.y + ch + (cmp ? 30 : 40) * u, x0 = cx - (3 * spacing) / 2;
  d.withAlpha(fr(S, 'rm-people', 0.12, 0.2), () => tab(S, S.l('ilustrativo: cuatro personas, la misma pareja', 'illustrative: four people, the same pair'), cx, A.y + ch + (cmp ? 12 : 16) * u, { align: 'center', maxW: r.w }));
  picks.forEach((c, i) => {
    const a = fr(S, 'rm-people', 0.16 + i * 0.05, 0.22 + i * 0.05), px = x0 + i * spacing - 3 * pc, ay = fr(S, 'rm-people', 0.2 + i * 0.05, 0.26 + i * 0.05);
    person(S, px, py, pc, 'ink', a);
    d.withAlpha(ay, () => {
      const t = tone(S, c === 'A' ? 'dat' : 'lat'), bx = px + 3 * pc + 16 * u;
      d.circle(bx, py + 2 * pc, 10 * u, { fill: alpha(t.c, 0.18), stroke: t.c, lw: 2 });
      d.text(c, bx, py + 2 * pc + 0.5, { size: FS(S, 13), weight: 800, color: t.ink, align: 'center', base: 'middle' });
    });
  });
  // el dato real
  const gy = py + 9 * pc + (cmp ? 12 : 22) * u, gt = tone(S, 'sig');
  d.withAlpha(fr(S, 'rm-people', 0.45, 0.55), () => {
    const gw = Math.min(r.w, 560 * u), gx = cx - gw / 2;
    fitText(S, S.l('InstructGPT: dos personas eligen igual', 'InstructGPT: two people choose the same'), gx, gy, gw, 14, { weight: 700, color: p.ink2, base: 'top' });
    const by = gy + 22 * u, bh = 16 * u, k = fr(S, 'rm-people', 0.55, 0.8, 'out') * 0.726;
    const bw = gw - 80 * u;
    d.rect(gx, by, bw, bh, { fill: p.surface2, stroke: gt.c, lw: 1.4 });
    d.rect(gx, by, bw * k, bh, { fill: alpha(gt.c, 0.85) });
    d.text(S.n(k * 100, 1) + ' %', gx + bw + 8 * u, by + bh / 2, { size: FS(S, 16), weight: 800, color: gt.ink, base: 'middle', font: 'mono' });
  });
}
