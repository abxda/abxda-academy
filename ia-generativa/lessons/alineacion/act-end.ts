// Acto 6 · Efectos secundarios y la capa de comportamiento: la adulación (juguete con dos grupos de jueces, el estudio de Sharma et al.,
// el caso de GPT-4o), los rechazos y sus umbrales, lo que cuesta y rinde la capa (InstructGPT), quién la escribe, el resumen y el puente.
// Datos reales: cifras de Ouyang et al. (2022) y Sharma et al. (2023). Ilustrativo y rotulado: las 28 solicitudes, los grupos de jueces,
// el esquema de señales de recompensa (no son proporciones de OpenAI).
import { Plot, alpha, clamp, inset, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, card, fitText, glyph, isCompact, num, para, person, sgn, tab } from './ui';
import { phases, pct } from './board';
import { deltaOf } from './pairs';
import { st } from './state';
import { Q_REF, REQS, fitRM, tilt } from './toy';

const R = (S: Frame) => inset(S.full(), (isCompact(S) ? 8 : 14) * S.u);

export function drawEnd(S: Frame) {
  phases(S, [
    { from: 'syco', draw: drawSyco },
    { from: 'syco-evidence', draw: drawEvidence },
    { from: 'syco-case', draw: drawCase },
    { from: 'refuse', draw: drawRefuse },
    { from: 'layer', draw: drawLayer },
    { from: 'layer-pref', draw: drawPref },
    { from: 'who', draw: drawWho },
    { from: 'recap', draw: drawRecap },
    { from: 'bridge', draw: drawBridge },
  ], null);
}

// ── 1 · la adulación como efecto de lo que prefieren los jueces (juguete) ──
const picksOf = (c: ('A' | 'B')[]) => c.map((choice, pair) => ({ pair, choice }));
let judges: { truth: { w: number[]; m: number[] }; pleaser: { w: number[]; m: number[] } } | null = null;
function judgeModels() {
  if (!judges) {
    const mk = (c: ('A' | 'B')[]) => { const w = fitRM(picksOf(c).map(deltaOf)); return { w, m: tilt(1, w) }; };
    // mismas tres parejas «neutras» (capital, inflación, suma); cambian las dos que enfrentan la verdad con darle la razón (murciélagos, eslogan)
    judges = { truth: mk(['B', 'B', 'A', 'B', 'A']), pleaser: mk(['B', 'B', 'A', 'A', 'B']) };
  }
  return judges;
}

function drawSyco(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), gap = 14 * u;
  const J = judgeModels(), foot = 34 * u;
  const content = (cmp ? 36 : 56) * u + 27 * u + 14 * u + 38 * u + 16 * u + 18 * u + 22 * u;
  const ph = Math.min(content, port ? (r.h - foot - gap) / 2 : r.h - foot), top = r.y + Math.max(0, (r.h - foot - (port ? 2 * ph + gap : ph)) / 2);
  const panels: { rect: Rect; title: string; sub: string; tn: Tone; key: 'truth' | 'pleaser'; at: number }[] = [
    { rect: port ? { x: r.x, y: top, w: r.w, h: ph } : { x: r.x, y: top, w: (r.w - gap) / 2, h: ph }, title: S.l('Jueces que prefieren lo correcto', 'Judges who prefer what is right'), sub: S.l('eligen la respuesta que acierta', 'they pick the answer that is right'), tn: 'dat', key: 'truth', at: 0.2 },
    { rect: port ? { x: r.x, y: top + ph + gap, w: r.w, h: ph } : { x: r.x + (r.w - gap) / 2 + gap, y: top, w: (r.w - gap) / 2, h: ph }, title: S.l('Jueces que prefieren que les den la razón', 'Judges who prefer being agreed with'), sub: S.l('eligen la respuesta que coincide con ellos', 'they pick the answer that matches theirs'), tn: 'err', key: 'pleaser', at: 1.2 },
  ];
  panels.forEach((pn) => {
    const c = tone(S, pn.tn), P = pn.rect, m = J[pn.key], a = S.reveal('syco', pn.at, 0.5), x = P.x + 12 * u, w = P.w - 24 * u;
    d.withAlpha(a, () => {
      card(S, P, { tone: pn.tn, fill: alpha(c.c, 0.07), lw: 2 });
      fitText(S, pn.title, x, P.y + 10 * u, w, 15, { weight: 800, color: c.ink, base: 'top' });
      if (!cmp) fitText(S, pn.sub, x, P.y + 32 * u, w, 12, { weight: 600, color: p.mute, base: 'top' });
      const pc = cmp ? 2 : 3, py = P.y + (cmp ? 32 : 54) * u;
      for (let i = 0; i < 3; i++) person(S, x + i * (6 * pc + 8 * u), py, pc, 'ink');
      glyph(S, pn.key === 'truth' ? 'ok' : 'agree', x + 3 * (6 * pc + 8 * u) + 12 * u, py + 4.5 * pc, 9 * u);
    });
    // lo que aprende el modelo de recompensa y la política óptima
    const aW = S.reveal('syco', pn.at + 1.2, 0.5), aB = S.at('syco', pn.at + 1.8, pn.at + 3.0, 'out');
    const by = P.y + (cmp ? 36 : 56) * u + 27 * u + 14 * u;
    d.withAlpha(aW, () => {
      para(S, S.l('peso de «da la razón» en su modelo de recompensa', 'weight of “agrees” in their reward model'), x, by, w - 70 * u, FS(S, 12), { weight: 700, color: p.ink2, maxLines: 2 });
      d.text(sgn(S, m.w[3], 2), x + w, by, { size: FS(S, 17), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'top' });
      const bw = w - 70 * u, yy = by + 38 * u, bh = 12 * u, v = Q_REF[3] + (m.m[3] - Q_REF[3]) * aB;
      d.text(S.l('prob. de dar la razón', 'chance of agreeing'), x, yy, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
      const yb = yy + 18 * u;
      d.rect(x, yb, bw, bh, { fill: p.surface2 });
      d.rect(x, yb, bw * clamp(v), bh, { fill: tone(S, 'err').c });
      d.line(x + bw * Q_REF[3], yb - 3, x + bw * Q_REF[3], yb + bh + 3, p.ink, 2);
      d.text(pct(S, v), x + bw + 8 * u, yb + bh / 2, { size: FS(S, 14), weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'middle' });
    });
  });
  d.withAlpha(S.reveal('syco', 3.6, 0.5), () => para(S, S.l('Juguete: elecciones inventadas, presión moderada (β = 1). │ = modelo de partida.', 'Toy: invented choices, moderate pressure (β = 1). │ = starting model.'), r.x, r.y + r.h - 30 * u, r.w, FS(S, 12), { weight: 600, color: p.mute, maxLines: 2 }));
}

// ── 2 · lo que midió un estudio con cinco asistentes ──
function drawEvidence(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), et = tone(S, 'err');
  const W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2;
  const chat = !port && !cmp;
  const left: Rect = chat ? { x: X, y: r.y, w: W * 0.46, h: r.h } : { x: X, y: r.y, w: W, h: 0 };
  const right: Rect = chat ? { x: X + W * 0.46 + 16 * u, y: r.y, w: W * 0.54 - 16 * u, h: r.h } : { x: X, y: r.y + 2 * u, w: W, h: r.h };
  // cinco asistentes
  const rows = [S.l('cede ante «¿seguro?»', 'caves to “are you sure?”'), S.l('adapta su opinión a la de la persona', 'adapts its opinion to the person’s'), S.l('copia los errores de la persona', 'copies the person’s mistakes')];
  const chipW = Math.min(46 * u, (right.w - 4 * 8 * u) / 5), x0 = right.x;
  d.withAlpha(S.reveal('syco-evidence', 0, 0.5), () => {
    fitText(S, S.l('5 asistentes de IA, 2023', '5 AI assistants, 2023'), right.x, right.y + 4 * u, right.w, 17, { weight: 800, color: p.ink, base: 'top' });
    for (let i = 0; i < 5; i++) {
      const cx = x0 + i * (chipW + 8 * u), cy = right.y + 34 * u, k = S.reveal('syco-evidence', 0.3 + i * 0.15, 0.3);
      d.withAlpha(k, () => { card(S, { x: cx, y: cy, w: chipW, h: 34 * u }, { tone: 'ink', fill: p.surface }); d.text(S.l('IA', 'AI'), cx + chipW / 2, cy + 17 * u, { size: FS(S, 13), weight: 800, color: p.ink2, align: 'center', base: 'middle' }); glyph(S, 'agree', cx + chipW - 7 * u, cy - 1 * u, 6 * u, { color: et.c }); });
    }
  });
  const ry = right.y + 84 * u, rh = Math.min(40 * u, (right.y + right.h - ry - 44 * u) / 3);
  rows.forEach((t, i) => {
    const a = S.reveal('syco-evidence', 1.4 + i * 0.6, 0.5), y = ry + i * rh;
    d.withAlpha(a, () => {
      d.rect(right.x, y + 2 * u, right.w, rh - 4 * u, { fill: alpha(et.c, 0.06), stroke: p.line, lw: 1, r: 3 });
      glyph(S, 'agree', right.x + 16 * u, y + rh / 2, 8 * u);
      fitText(S, t, right.x + 34 * u, y + rh / 2, right.w - 44 * u, 15, { weight: 700, color: p.ink, base: 'middle' });
    });
  });
  d.withAlpha(S.reveal('syco-evidence', 3.4, 0.5), () => para(S, S.l('En todos, en distinto grado. Las preferencias humanas probablemente explican parte (Sharma et al., 2023).', 'In all of them, to different degrees. Human preferences likely explain part of it (Sharma et al., 2023).'), right.x, ry + 3 * rh + 6 * u, right.w, FS(S, 13), { weight: 700, color: et.ink, maxLines: 3 }));
  if (chat) {
    // diálogo ilustrativo del «¿seguro?»
    const msgs: { who: 'u' | 'a'; t: string }[] = [
      { who: 'u', t: S.l('¿Cuál es la capital de Australia?', 'What is the capital of Australia?') },
      { who: 'a', t: S.l('Canberra.', 'Canberra.') },
      { who: 'u', t: S.l('¿Seguro? Creo que es Sídney.', 'Are you sure? I think it is Sydney.') },
      { who: 'a', t: S.l('Tienes razón, es Sídney.', 'You are right, it is Sydney.') },
    ];
    const bh = Math.min(48 * u, (left.h - 60 * u) / 4);
    d.withAlpha(S.reveal('syco-evidence', 0.2, 0.4), () => tab(S, S.l('ilustrativo', 'illustrative'), left.x, left.y + 8 * u, { align: 'left' }));
    msgs.forEach((m, i) => {
      const a = S.reveal('syco-evidence', 0.8 + i * 0.7, 0.4), y = left.y + 28 * u + i * (bh + 6 * u), bw = left.w * 0.86, x = m.who === 'u' ? left.x : left.x + left.w - bw, c = tone(S, m.who === 'u' ? 'sig' : 'dat');
      d.withAlpha(a, () => {
        card(S, { x, y, w: bw, h: bh }, { tone: m.who === 'u' ? 'sig' : 'dat', fill: alpha(c.c, 0.08) });
        const wrong = i === 3;
        fitText(S, m.t, x + 10 * u, y + bh / 2, bw - 20 * u, 15, { weight: 700, color: wrong ? et.ink : p.ink, base: 'middle' });
      });
    });
  }
}

// ── 3 · el caso de GPT-4o (esquema de la mezcla de señales; no son proporciones reales) ──
function drawCase(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), et = tone(S, 'err'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2;
  const chipH = (cmp ? 32 : 40) * u, gap = 10 * u;
  const steps = [S.l('actualización de GPT-4o', 'GPT-4o update'), S.l('demasiado complaciente', 'too agreeable'), S.l('se revierte', 'rolled back')];
  const cw = port ? W : (W - 2 * 30 * u) / 3;
  const total = (port ? 3 * chipH + 2 * 14 * u : chipH) + 22 * u + 2 * (cmp ? 36 : 44) * u + 40 * u, y0 = r.y + Math.max(0, (r.h - total) / 2);
  d.withAlpha(S.reveal('syco-case', 0, 0.4), () => d.text(S.l('abril de 2025', 'April 2025'), X, y0 - 4 * u, { size: FS(S, 14), weight: 800, color: p.ink2, base: 'bottom' }));
  steps.forEach((t, i) => {
    const a = S.reveal('syco-case', 0.2 + i * 0.5, 0.4), x = port ? X : X + i * (cw + 30 * u), y = port ? y0 + i * (chipH + 14 * u) : y0, tn = i === 1 ? et : i === 2 ? dt : tone(S, 'ink');
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: chipH }, { tone: i === 1 ? 'err' : i === 2 ? 'dat' : 'ink', fill: p.surface, lw: 2 });
      fitText(S, t, x + cw / 2, y + chipH / 2, cw - 12 * u, 15, { weight: 800, color: tn.ink, align: 'center', base: 'middle' });
    });
    if (i < 2) d.withAlpha(a, () => { if (port) d.arrow(X + cw / 2, y + chipH + 2 * u, X + cw / 2, y + chipH + 12 * u, p.ink, 2, 7); else d.arrow(x + cw + 4 * u, y + chipH / 2, x + cw + 26 * u, y + chipH / 2, p.ink, 2, 8); });
  });
  // la mezcla de señales de recompensa: antes y después (esquema)
  const by = y0 + (port ? 3 * chipH + 2 * 14 * u : chipH) + 26 * u, bh = (cmp ? 30 : 38) * u, kS = S.at('syco-case', 1.8, 3.2, 'io');
  d.withAlpha(S.reveal('syco-case', 1.6, 0.5), () => {
    d.text(S.l('antes', 'before'), X, by + bh / 2, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
    d.text(S.l('después', 'after'), X, by + bh + 14 * u + bh / 2, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
  });
  const lx = X + 62 * u, lw = W - 62 * u;
  d.withAlpha(S.reveal('syco-case', 1.6, 0.5), () => {
    d.rect(lx, by, lw, bh, { fill: alpha(wt.c, 0.3), stroke: wt.c, lw: 1.8 });
    fitText(S, S.l('señal principal', 'primary signal'), lx + lw / 2, by + bh / 2, lw - 10 * u, 14, { weight: 700, color: wt.ink, align: 'center', base: 'middle' });
  });
  d.withAlpha(S.reveal('syco-case', 2.0, 0.5), () => {
    const y = by + bh + 14 * u, w1 = lw * (1 - 0.42 * kS), w2 = lw * 0.24 * kS, w3 = lw - w1 - w2;
    d.rect(lx, y, w1, bh, { fill: alpha(wt.c, 0.3), stroke: wt.c, lw: 1.8 });
    fitText(S, S.l('principal', 'primary'), lx + w1 / 2, y + bh / 2, w1 - 8 * u, 14, { weight: 700, color: wt.ink, align: 'center', base: 'middle' });
    if (w2 > 6 * u) { d.rect(lx + w1, y, w2, bh, { fill: alpha(et.c, 0.28), stroke: et.c, lw: 1.8 }); if (w2 > 60 * u) fitText(S, S.l('pulgares', 'thumbs'), lx + w1 + w2 / 2, y + bh / 2, w2 - 6 * u, 13, { weight: 700, color: et.ink, align: 'center', base: 'middle' }); }
    if (w3 > 6 * u) { d.rect(lx + w1 + w2, y, w3, bh, { fill: alpha(p.mute, 0.18), stroke: p.mute, lw: 1.5, dash: [4, 3] }); if (w3 > 50 * u) fitText(S, S.l('otros', 'others'), lx + w1 + w2 + w3 / 2, y + bh / 2, w3 - 6 * u, 13, { weight: 700, color: p.ink2, align: 'center', base: 'middle' }); }
  });
  d.withAlpha(S.reveal('syco-case', 3.4, 0.5), () => para(S, S.l('Esquema: el nuevo aporte (pulgares arriba y abajo) y otros cambios restan peso a la señal principal. No son proporciones reales; la fuente es el análisis preliminar de OpenAI.', 'Sketch: the new input (thumbs-up and thumbs-down) and other changes dilute the primary signal. Not real proportions; the source is OpenAI’s early analysis.'), X, by + 2 * bh + 24 * u, W, FS(S, 12), { weight: 600, color: p.mute, maxLines: 3 }));
}

// ── 4 · los rechazos: todo umbral cuesta algo ──
export function thrOf(S: Frame): number {
  const s = st(S);
  if (s.thrOwn) return clamp(Number(S.p.thr ?? 0.5));
  const k = S.at('refuse', 0.6, 5.2, 'lin');
  return 0.5 + 0.36 * (1 - k) * Math.sin(k * Math.PI * 2.5 + 0.0);
}

function drawRefuse(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), dt = tone(S, 'dat'), et = tone(S, 'err');
  const thr = thrOf(S), a0 = S.reveal('refuse', 0, 0.5);
  const wrong = REQS.filter((q) => !q.harmful && q.risk >= thr).length, allowed = REQS.filter((q) => q.harmful && q.risk < thr).length;
  const topH = (port ? 58 : 36) * u, foot = (cmp ? 20 : 36) * u;
  const pr: Rect = { x: r.x, y: r.y + topH, w: r.w, h: r.h - topH - foot };
  const plot = new Plot(S, pr, { xr: [0, 1], yr: [0, 1], pad: { l: 6, r: 6, t: 6, b: cmp ? 6 : 28 } });
  // contadores
  d.withAlpha(a0, () => {
    const c1x = r.x, c2x = port ? r.x : r.x + r.w / 2, y1 = r.y + 4 * u, y2 = port ? y1 + 26 * u : y1;
    d.circle(c1x + 8 * u, y1 + 10 * u, 6 * u, { fill: dt.c });
    d.text(S.l(`rechazadas sin daño: ${wrong}`, `harmless but refused: ${wrong}`), c1x + 22 * u, y1 + 10 * u, { size: FS(S, 14), weight: 800, color: dt.ink, base: 'middle' });
    const cx = c2x + 8 * u, cy = y2 + 10 * u;
    d.line(cx - 5 * u, cy - 5 * u, cx + 5 * u, cy + 5 * u, et.c, 2.6); d.line(cx - 5 * u, cy + 5 * u, cx + 5 * u, cy - 5 * u, et.c, 2.6);
    d.text(S.l(`daño permitido: ${allowed}`, `harm allowed: ${allowed}`), c2x + 22 * u, cy, { size: FS(S, 14), weight: 800, color: et.ink, base: 'middle' });
  });
  d.withAlpha(a0, () => {
    plot.axes();
    const tx = plot.X(thr);
    d.rect(tx, plot.r.y, plot.r.x + plot.r.w - tx, plot.r.h, { fill: alpha(p.ink, 0.05) });
    d.text(S.l('responde', 'answers'), plot.r.x + 6 * u, plot.r.y + 4 * u, { size: FS(S, 13), weight: 800, color: p.ink2, base: 'top' });
    d.text(S.l('rechaza', 'refuses'), plot.r.x + plot.r.w - 6 * u, plot.r.y + 4 * u, { size: FS(S, 13), weight: 800, color: p.ink2, align: 'right', base: 'top' });
    if (!cmp) d.text(S.l('riesgo que estima el modelo →', 'risk the model estimates →'), plot.r.x + plot.r.w, plot.r.y + plot.r.h + 8 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  const kd = S.at('refuse', 0.1, 1.2, 'out');
  REQS.forEach((q, i) => {
    const y = 0.14 + 0.72 * ((i * 0.618034) % 1);
    plot.datum(q.risk, y, q.harmful ? 1 : 0, { r: cmp ? 4 : 5, a: kd * (q.risk >= thr === !q.harmful ? 0.55 : 1) });
    if ((q.harmful && q.risk < thr) || (!q.harmful && q.risk >= thr)) d.withAlpha(kd, () => d.circle(plot.X(q.risk), plot.Y(y), (cmp ? 8 : 10) * u, { stroke: p.ink, lw: 1.6 }));
  });
  d.withAlpha(a0, () => { const tx = plot.X(thr); d.line(tx, plot.r.y, tx, plot.r.y + plot.r.h, p.ink, 3); d.text(S.l('umbral', 'threshold'), tx + 5 * u, plot.r.y + plot.r.h - 5 * u, { size: FS(S, 12), weight: 800, color: p.ink, align: 'left', base: 'bottom', halo: p.stage, haloW: 3 }); });
  d.withAlpha(S.reveal('refuse', 0.8, 0.5), () => para(S, S.l('Ilustrativo: 28 solicitudes inventadas; ● inofensiva, ✕ dañina; anillo = error.', 'Illustrative: 28 invented requests; ● harmless, ✕ harmful; ring = mistake.'), r.x, r.y + r.h - (cmp ? 16 : 32) * u, r.w, FS(S, 12), { weight: 600, color: p.mute, maxLines: 2 }));
}

// ── 5 · lo que cuesta la capa (InstructGPT, Ouyang et al. 2022) ──
function drawLayer(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), lt = tone(S, 'lat'), wt = tone(S, 'w');
  const W = Math.min(r.w, 720 * u), X = r.x + (r.w - W) / 2, bh = (cmp ? 40 : port ? 54 : 64) * u;
  const total = 2 * (bh + 36 * u) + 44 * u, y0 = r.y + Math.max(0, (r.h - total) / 2);
  const base = 3640, layer = 4.9 + 60;
  d.withAlpha(S.reveal('layer', 0, 0.5), () => {
    fitText(S, S.l('GPT-3 · preentrenamiento', 'GPT-3 · pretraining'), X, y0, W, 16, { weight: 800, color: lt.ink, base: 'top' });
    const k = S.at('layer', 0.2, 1.6, 'out');
    d.rect(X, y0 + 24 * u, W, bh, { fill: p.surface2 });
    d.rect(X, y0 + 24 * u, W * k, bh, { fill: alpha(lt.c, 0.85) });
    d.text(S.l('3 640 petaflops/s-día', '3,640 petaflop/s-days'), X + W - 10 * u, y0 + 24 * u + bh / 2, { size: FS(S, 16), weight: 800, font: 'mono', color: p.stage, align: 'right', base: 'middle', a: k > 0.9 ? 1 : 0 });
  });
  const y1 = y0 + bh + 36 * u + 8 * u;
  d.withAlpha(S.reveal('layer', 1.8, 0.5), () => {
    fitText(S, S.l('InstructGPT 175 mil millones · ajuste 4.9 + refuerzo 60', 'InstructGPT 175 billion · tuning 4.9 + reinforcement 60'), X, y1, W, 16, { weight: 800, color: wt.ink, base: 'top' });
    const k = S.at('layer', 2.0, 3.2, 'out'), w = W * (layer / base);
    d.rect(X, y1 + 24 * u, W, bh, { fill: p.surface2 });
    d.rect(X, y1 + 24 * u, Math.max(2, w * k), bh, { fill: wt.c });
    const t = S.l('menos del 2 %', 'under 2%');
    d.withAlpha(clamp((k - 0.6) / 0.4), () => d.text(t, X + Math.max(2, w) + 10 * u, y1 + 24 * u + bh / 2, { size: FS(S, 20), weight: 800, color: wt.ink, base: 'middle' }));
  });
  d.withAlpha(S.reveal('layer', 3.4, 0.5), () => para(S, S.l('Solo los dos entrenamientos finales de 175 mil millones. No cuenta el modelo de recompensa, los datos ni las pruebas (Ouyang et al., 2022).', 'Only the two final 175-billion-parameter training runs. Excludes the reward model, the data, and earlier experiments (Ouyang et al., 2022).'), X, y1 + 24 * u + bh + 10 * u, W, FS(S, 12), { weight: 600, color: p.mute, maxLines: 3 }));
}

// ── 6 · y la capa rindió: preferido con cien veces menos parámetros ──
function drawPref(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), lt = tone(S, 'lat'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const W = Math.min(r.w, 720 * u), X = r.x + (r.w - W) / 2, bh = (cmp ? 36 : port ? 46 : 56) * u;
  const total = 2 * (bh + 36 * u) + 70 * u, y0 = r.y + Math.max(0, (r.h - total) / 2);
  d.withAlpha(S.reveal('layer-pref', 0, 0.5), () => {
    fitText(S, S.l('GPT-3 · 175 mil millones de parámetros', 'GPT-3 · 175 billion parameters'), X, y0, W, 16, { weight: 800, color: lt.ink, base: 'top' });
    d.rect(X, y0 + 24 * u, W, bh, { fill: alpha(lt.c, 0.85) });
  });
  const y1 = y0 + bh + 36 * u + 4 * u;
  d.withAlpha(S.reveal('layer-pref', 0.8, 0.5), () => {
    fitText(S, S.l('InstructGPT · 1.3 mil millones de parámetros', 'InstructGPT · 1.3 billion parameters'), X, y1, W, 16, { weight: 800, color: wt.ink, base: 'top' });
    const w = W * (1.3 / 175);
    d.rect(X, y1 + 24 * u, W, bh, { fill: p.surface2 });
    d.rect(X, y1 + 24 * u, Math.max(3, w), bh, { fill: wt.c });
  });
  const aM = S.reveal('layer-pref', 1.8, 0.5);
  d.withAlpha(aM, () => {
    const mx = X + Math.max(3, W * (1.3 / 175)) + 22 * u, my = y1 + 24 * u + bh / 2, t = tone(S, 'dat');
    d.circle(mx, my, 13 * u, { fill: t.c });
    d.polyline([[mx - 6 * u, my], [mx - 1.5 * u, my + 5 * u], [mx + 7 * u, my - 5 * u]], p.stage, 2.8);
    d.text(S.l('preferido por quienes evaluaron', 'preferred by the raters'), mx + 20 * u, my, { size: FS(S, 16), weight: 800, color: t.ink, base: 'middle' });
  });
  d.withAlpha(S.reveal('layer-pref', 3.0, 0.5), () => {
    const yy = y1 + 24 * u + bh + 16 * u;
    para(S, S.l('Con 175 mil millones, InstructGPT se prefirió a GPT-3 en el 85 % de las comparaciones (±3).', 'At 175 billion, InstructGPT was preferred to GPT-3 in 85% of comparisons (±3).'), X, yy, W, FS(S, 14), { weight: 700, color: dt.ink, maxLines: 2 });
    d.text(S.l('Ouyang et al., 2022; las barras de parámetros van a escala.', 'Ouyang et al., 2022; parameter bars are to scale.'), X, yy + (port ? 50 : 40) * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
  });
}

// ── 7 · la capa tiene autores: decisiones de producto ──
function drawWho(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), gap = 10 * u;
  const lt = tone(S, 'lat'), wt = tone(S, 'w');
  const srcs = [
    { t: S.l('quienes escribieron los ejemplos', 'who wrote the examples'), k: 'people' as const },
    { t: S.l('quienes compararon respuestas', 'who compared answers'), k: 'people' as const },
    { t: S.l('las reglas que recibieron', 'the rules they were given'), k: 'doc' as const },
  ];
  const topH = port ? 3 * 46 * u + 2 * gap : (cmp ? 72 : 84) * u, Bh = 34 * u + 3 * 26 * u + 12 * u, botH = 24 * u + Bh;
  const yOff = Math.max(0, (r.h - topH - botH - 22 * u) / 2);
  const cw = port ? r.w : (r.w - 2 * gap) / 3;
  srcs.forEach((s, i) => {
    const a = S.reveal('who', 0.2 + i * 0.5, 0.5), rc: Rect = port ? { x: r.x, y: r.y + yOff + i * (46 * u + gap), w: cw, h: 46 * u } : { x: r.x + i * (cw + gap), y: r.y + yOff, w: cw, h: topH };
    d.withAlpha(a, () => {
      card(S, rc, { tone: 'ink', fill: p.surface });
      const pc = cmp ? 2 : 3;
      if (s.k === 'people') { person(S, rc.x + 10 * u, rc.y + (port ? 8 : 10) * u, pc, 'ink'); person(S, rc.x + 10 * u + 6 * pc + 6 * u, rc.y + (port ? 8 : 10) * u, pc, 'ink'); }
      else { const dx = rc.x + 12 * u, dy = rc.y + (port ? 8 : 10) * u; d.rect(dx, dy, 18 * u, 24 * u, { stroke: p.ink2, lw: 1.8, r: 2 }); [6, 11, 16].forEach((o) => d.line(dx + 4 * u, dy + o * u, dx + 14 * u, dy + o * u, p.ink2, 1.6)); }
      const tx = rc.x + (port ? 60 : 10) * u, ty = port ? rc.y + rc.h / 2 : rc.y + rc.h - 12 * u;
      fitText(S, s.t, tx, ty, rc.x + rc.w - tx - 8 * u, 14, { weight: 700, color: p.ink, base: port ? 'middle' : 'bottom' });
    });
  });
  // decisiones de producto
  const ay = r.y + yOff + topH + 6 * u, bh = botH;
  const aB = S.reveal('who', 2.0, 0.6);
  d.withAlpha(aB, () => {
    d.arrow(r.x + r.w / 2, ay - 4 * u, r.x + r.w / 2, ay + 14 * u, p.ink, 2.4, 9);
    const B: Rect = { x: r.x, y: ay + 18 * u, w: r.w, h: bh - 18 * u };
    card(S, B, { tone: 'lat', fill: alpha(lt.c, 0.08), lw: 2 });
    fitText(S, S.l('decisiones de producto', 'product decisions'), B.x + 12 * u, B.y + 8 * u, B.w - 24 * u, 15, { weight: 800, color: lt.ink, base: 'top' });
    const dials: [string, number][] = [[S.l('tono', 'tone'), 0.62], [S.l('longitud', 'length'), 0.42], [S.l('lo que se rechaza', 'what is refused'), 0.55]];
    const rowH = Math.min(26 * u, (B.h - 34 * u) / 3);
    const nw = Math.max(...dials.map(([t]) => d.measure(t, { size: FS(S, 13), weight: 700 }))) + 14 * u;
    dials.forEach(([t, v], i) => {
      const y = B.y + 34 * u + i * rowH + rowH / 2, x1 = B.x + 12 * u + nw, x2 = B.x + B.w - 14 * u, k = S.at('who', 2.4 + i * 0.4, 3.4 + i * 0.4, 'out');
      d.text(t, B.x + 12 * u, y, { size: FS(S, 13), weight: 700, color: p.ink, base: 'middle' });
      d.line(x1, y, x2, y, p.lineStrong, 2);
      d.circle(x1 + (x2 - x1) * (0.5 + (v - 0.5) * k), y, 7 * u, { fill: wt.c, stroke: p.stage, lw: 1.5 });
    });
  });
  d.withAlpha(S.reveal('who', 3.8, 0.5), () => d.text(S.l('Posiciones ilustrativas.', 'Illustrative positions.'), r.x, r.y + r.h, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom' }));
}

// ── 8 · resumen: conocimiento, formato, criterio ──
function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S);
  const stages: { t: string; k: string; tn: Tone; sub: string }[] = [
    { t: S.l('Preentrenamiento', 'Pretraining'), k: S.l('conocimiento', 'knowledge'), tn: 'lat', sub: S.l('predecir el siguiente token', 'predict the next token') },
    { t: S.l('Ajuste con instrucciones', 'Instruction tuning'), k: S.l('formato', 'format'), tn: 'w', sub: S.l('ejemplos de respuesta ideal', 'examples of ideal answers') },
    { t: S.l('Preferencias · RLHF o DPO', 'Preferences · RLHF or DPO'), k: S.l('criterio', 'judgment'), tn: 'dat', sub: S.l('comparar y optimizar', 'compare and optimize') },
  ];
  const gap = 24 * u, W = Math.min(r.w, 760 * u), X = r.x + (r.w - W) / 2;
  const cw = port ? W : (W - 2 * gap) / 3, ch = port ? Math.min((r.h - 60 * u - 2 * gap) / 3, 84 * u) : Math.min(r.h * 0.55, cmp ? 120 * u : 170 * u);
  const total = port ? 3 * ch + 2 * gap : ch, y0 = r.y + Math.max(0, (r.h - total - 40 * u) / 2);
  stages.forEach((s, i) => {
    const a = S.reveal('recap', 0.3 + i * 0.9, 0.5), x = port ? X : X + i * (cw + gap), y = port ? y0 + i * (ch + gap) : y0, c = tone(S, s.tn);
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: ch }, { tone: s.tn, fill: alpha(c.c, 0.1), lw: 2 });
      fitText(S, s.t, x + 12 * u, y + 12 * u, cw - 24 * u, 16, { weight: 800, color: c.ink, base: 'top' });
      if (!cmp && !port) fitText(S, s.sub, x + 12 * u, y + 38 * u, cw - 24 * u, 13, { weight: 600, color: p.ink2, base: 'top' });
      fitText(S, '→ ' + s.k, x + 12 * u, y + ch - 12 * u, cw - 24 * u, port ? 20 : 24, { weight: 800, color: p.ink, base: 'bottom' });
    });
    if (i < 2) d.withAlpha(a, () => { if (port) d.arrow(X + cw / 2, y + ch + 3 * u, X + cw / 2, y + ch + gap - 4 * u, p.ink, 2.4, 8); else d.arrow(x + cw + 4 * u, y + ch / 2, x + cw + gap - 4 * u, y + ch / 2, p.ink, 2.4, 8); });
  });
  d.withAlpha(S.reveal('recap', 3.2, 0.5), () => para(S, S.l('Cada paso moldea sobre todo cómo responde.', 'Each step mostly shapes how it responds.'), X, y0 + total + 14 * u, W, FS(S, 16), { weight: 800, color: p.ink, align: 'center', maxLines: 2 }));
}

// ── 9 · puente: ¿puede pensar antes de responder? ──
function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), lt = tone(S, 'lat'), st_ = tone(S, 'sig');
  const bw = Math.min(r.w * (port ? 0.62 : 0.3), 280 * u), bh = Math.min(r.h * 0.3, 110 * u), cx = r.x + r.w / 2, cy = r.y + r.h * (port ? 0.5 : 0.52);
  const B: Rect = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh }, al = (port ? 30 : 76) * u;
  d.withAlpha(S.reveal('bridge', 0, 0.5), () => {
    card(S, B, { tone: 'lat', fill: alpha(lt.c, 0.1), lw: 2 });
    fitText(S, S.l('Asistente', 'Assistant'), cx, cy - 8 * u, bw - 14 * u, 20, { weight: 800, color: lt.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('tono y criterio', 'tone and judgment'), cx, cy + 18 * u, bw - 14 * u, 13, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
    d.arrow(B.x - al - 4 * u, cy, B.x - 4 * u, cy, p.ink, 2.6, 10);
    d.arrow(B.x + B.w + 4 * u, cy, B.x + B.w + al + 4 * u, cy, p.ink, 2.6, 10);
    if (!port) {
      d.text(S.l('pregunta', 'question'), B.x - al / 2 - 4 * u, cy - 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
      d.text(S.l('respuesta', 'answer'), B.x + B.w + al / 2 + 4 * u, cy - 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
    }
  });
  const aQ = S.reveal('bridge', 1.4, 0.6), t = S.l('¿pensar antes de responder?', 'think before answering?'), tw = d.measure(t, { size: FS(S, 18), weight: 800 }) + 28 * u, by = B.y - 64 * u;
  d.withAlpha(aQ, () => {
    d.rect(cx - tw / 2, by - 18 * u, tw, 36 * u, { fill: p.surface, stroke: st_.c, lw: 2.2, r: 6 });
    d.text(t, cx, by, { size: FS(S, 18), weight: 800, color: st_.ink, align: 'center', base: 'middle' });
  });
  if (!cmp) {
    const sc = Math.max(3, Math.round(3 * u)), nw = 24 * sc, nh = 18 * sc, aN = S.reveal('bridge', 1.0, 0.5);
    if (port) neu(S, cx - nw / 2, B.y + B.h + 18 * u, { scale: sc, mood: 'think', a: aN });
    else {
      const nx = cx - tw / 2 - nw - 40 * u;
      neu(S, nx, by - nh / 2, { scale: sc, mood: 'think', a: aN });
      d.withAlpha(aQ, () => [0, 1, 2].forEach((i) => d.circle(nx + nw + (6 + i * 11) * u, by + (6 - i * 4) * u, (2 + i) * u, { stroke: st_.c, lw: 1.6 })));
    }
  }
}
