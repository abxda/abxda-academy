// Efectos secundarios y la capa de comportamiento: adulación (juguete con dos grupos de jueces; el estudio de Sharma et al.;
// el caso de GPT-4o), rechazos y su umbral (ilustrativo), cuánto cuesta y rinde la capa (InstructGPT), quién la decide, y el puente.
import { alpha, clamp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { deltaOf, PAIRS } from './pairs';
import { Q_REF, REQS, fitRM, tilt } from './toy';
import { questionBanner } from './v-pref';
import { FS, area, card, chip, fitText, fr, glyph, mark, para, paraH, pct, person, sgn, tab, tight } from './ui';

// ── 1 · adulación: lo que aprende el juez de dos grupos de jueces (juguete) ──
let judges: { truth: { w: number[]; m: number[] }; pleaser: { w: number[]; m: number[] } } | null = null;
function judgeModels() {
  if (!judges) {
    const mk = (c: ('A' | 'B')[]) => { const w = fitRM(c.map((choice, pair) => deltaOf({ pair, choice }))); return { w, m: tilt(1, w) }; };
    // mismas tres parejas «neutras» (capital, inflación, suma); cambian las dos que enfrentan la verdad con dar la razón (murciélagos, eslogan)
    judges = { truth: mk(['B', 'B', 'A', 'B', 'A']), pleaser: mk(['B', 'B', 'A', 'A', 'B']) };
  }
  return judges;
}

export function drawSyco(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), gap = 12 * u;
  const J = judgeModels(), et = tone(S, 'err');
  const qh = (cmp ? 30 : 36) * u;
  questionBanner(S, { x: r.x, y: r.y, w: r.w, h: qh }, PAIRS[3][S.lang], fr(S, 'syco', 0.02, 0.12));
  const top0 = r.y + qh + gap, H = r.y + r.h - top0;
  const pc0 = Math.max(1.6, (cmp || port ? 1.8 : 2.4) * u);
  const contentH = (cmp || port ? 30 : 36) * u + 9 * pc0 + (port ? 8 : 14) * u + (port ? 24 : 30) * u + 18 * u + 11 * u + 16 * u;
  const ph = Math.min(port ? (H - gap) / 2 : H, contentH);
  const top = top0 + Math.max(0, (H - (port ? 2 * ph + gap : ph)) / 3);
  const panels: { rect: Rect; title: string; tn: Tone; key: 'truth' | 'pleaser'; at: number; pick: string }[] = [
    { rect: port ? { x: r.x, y: top, w: r.w, h: ph } : { x: r.x, y: top, w: (r.w - gap) / 2, h: ph }, title: S.l('Jueces que prefieren lo correcto', 'Judges who prefer what is right'), tn: 'dat', key: 'truth', at: 0.3, pick: S.l('eligen: «No exactamente…»', 'they pick: “Not quite…”') },
    { rect: port ? { x: r.x, y: top + ph + gap, w: r.w, h: ph } : { x: r.x + (r.w + gap) / 2, y: top, w: (r.w - gap) / 2, h: ph }, title: S.l('Jueces que prefieren que les den la razón', 'Judges who prefer being agreed with'), tn: 'err', key: 'pleaser', at: 0.48, pick: S.l('eligen: «Sí, tienes razón»', 'they pick: “Yes, you are right”') },
  ];
  panels.forEach((pn) => {
    const c = tone(S, pn.tn), P = pn.rect, m = J[pn.key], x = P.x + 12 * u, w = P.w - 24 * u;
    d.withAlpha(fr(S, 'syco', pn.at, pn.at + 0.1), () => {
      card(S, P, { tone: pn.tn, fill: alpha(c.c, 0.07), lw: 2 });
      fitText(S, pn.title, x, P.y + 9 * u, w, 15, { weight: 800, color: c.ink, base: 'top' });
      const pc = Math.max(1.6, (cmp || port ? 1.8 : 2.4) * u), py = P.y + (cmp || port ? 30 : 36) * u;
      for (let i = 0; i < 3; i++) person(S, x + i * (6 * pc + 6 * u), py, pc, 'ink');
      fitText(S, pn.pick, x + 3 * (6 * pc + 6 * u) + 6 * u, py + 4.5 * pc, w - 3 * (6 * pc + 6 * u) - 6 * u, 13, { weight: 700, color: p.ink2, base: 'middle' });
    });
    const aW = fr(S, 'syco', pn.at + 0.14, pn.at + 0.24), kB = fr(S, 'syco', 0.74, 0.92, 'io');
    const by = P.y + (cmp || port ? 30 : 36) * u + 9 * Math.max(1.6, (cmp || port ? 1.8 : 2.4) * u) + (port ? 8 : 14) * u;
    d.withAlpha(aW, () => {
      const lab = S.l('su juez da a «da la razón»', 'their judge gives “agrees”');
      glyph(S, 'agree', x + 8 * u, by + 8 * u, 7 * u);
      fitText(S, lab, x + 22 * u, by + 8 * u, w - 22 * u - 60 * u, 13, { weight: 700, color: p.ink2, base: 'middle' });
      d.text(sgn(S, m.w[3], 1), x + w, by + 8 * u, { size: FS(S, 16), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    });
    const yy = by + (port ? 24 : 30) * u;
    if (yy + 20 * u < P.y + P.h) d.withAlpha(fr(S, 'syco', 0.7, 0.8), () => {
      const v = Q_REF[3] + (m.m[3] - Q_REF[3]) * kB, bw = w - 60 * u, bh = 11 * u;
      fitText(S, S.l('respuestas que dan la razón, tras practicar', 'answers that agree, after practice'), x, yy, w, 12, { weight: 600, color: p.mute, base: 'top' });
      const yb = yy + 18 * u;
      d.rect(x, yb, bw, bh, { fill: p.surface2 });
      d.rect(x, yb, bw * clamp(v), bh, { fill: et.c });
      d.line(x + bw * Q_REF[3], yb - 3 * u, x + bw * Q_REF[3], yb + bh + 3 * u, p.ink, 2);
      d.text(pct(S, v), x + w, yb + bh / 2, { size: FS(S, 14), weight: 800, font: 'mono', color: et.ink, align: 'right', base: 'middle' });
    });
  });
}

// ── 2 · un estudio con cinco asistentes ──
export function drawStudy(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), et = tone(S, 'err');
  const chat = !port && !cmp;
  const W = Math.min(r.w, 760 * u), X = r.x + (r.w - W) / 2;
  const left: Rect = { x: X, y: r.y, w: W * 0.44, h: r.h };
  const right: Rect = chat ? { x: X + W * 0.44 + 20 * u, y: r.y, w: W * 0.56 - 20 * u, h: r.h } : { x: X, y: r.y, w: W, h: r.h };
  d.withAlpha(fr(S, 'syco-study', 0.02, 0.12), () => fitText(S, S.l('5 asistentes de IA · 2023', '5 AI assistants · 2023'), right.x, right.y + 4 * u, right.w, 17, { weight: 800, base: 'top' }));
  const chipW = Math.min(50 * u, (right.w - 4 * 8 * u) / 5);
  for (let i = 0; i < 5; i++) {
    const cx = right.x + i * (chipW + 8 * u), cy = right.y + 32 * u;
    d.withAlpha(fr(S, 'syco-study', 0.06 + i * 0.03, 0.12 + i * 0.03), () => {
      card(S, { x: cx, y: cy, w: chipW, h: 32 * u }, { tone: 'ink', fill: p.surface });
      d.text(S.l('IA', 'AI'), cx + chipW / 2, cy + 16 * u, { size: FS(S, 13), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
    });
  }
  const rows = [S.l('cedían ante un «¿seguro?»', 'caved to an “are you sure?”'), S.l('copiaban los errores de la persona', 'copied the person’s mistakes')];
  const ry = right.y + 80 * u, rh = Math.min(42 * u, (right.y + right.h - ry - 50 * u) / 2);
  rows.forEach((t, i) => d.withAlpha(fr(S, 'syco-study', 0.4 + i * 0.12, 0.5 + i * 0.12), () => {
    const y = ry + i * rh;
    d.rect(right.x, y + 2 * u, right.w, rh - 4 * u, { fill: alpha(et.c, 0.06), stroke: p.line, lw: 1, r: 3 });
    glyph(S, 'agree', right.x + 16 * u, y + rh / 2, 7.5 * u);
    fitText(S, t, right.x + 32 * u, y + rh / 2, right.w - 40 * u, 15, { weight: 700, base: 'middle' });
  }));
  d.withAlpha(fr(S, 'syco-study', 0.78, 0.88), () => para(S, S.l('Las preferencias humanas probablemente explican parte: a veces premian que les den la razón.', 'Human preferences likely explain part of it: they sometimes reward being agreed with.'), right.x, ry + 2 * rh + 8 * u, right.w, FS(S, 13), { weight: 700, color: et.ink, maxLines: 3 }));
  if (chat) {
    const msgs: { who: 'u' | 'a'; t: string }[] = [
      { who: 'u', t: S.l('¿Cuál es la capital de Australia?', 'What is the capital of Australia?') },
      { who: 'a', t: S.l('Canberra.', 'Canberra.') },
      { who: 'u', t: S.l('¿Seguro? Creo que es Sídney.', 'Are you sure? I think it is Sydney.') },
      { who: 'a', t: S.l('Tienes razón, es Sídney.', 'You are right, it is Sydney.') },
    ];
    const bh = Math.min(42 * u, (left.h - 40 * u) / 4 - 6 * u);
    d.withAlpha(fr(S, 'syco-study', 0.1, 0.2), () => tab(S, S.l('ilustrativo', 'illustrative'), left.x, left.y + 8 * u, { align: 'left' }));
    msgs.forEach((m, i) => {
      const a = fr(S, 'syco-study', 0.14 + i * 0.08, 0.2 + i * 0.08), y = left.y + 26 * u + i * (bh + 6 * u), bw = left.w * 0.86, x = m.who === 'u' ? left.x : left.x + left.w - bw, c = tone(S, m.who === 'u' ? 'sig' : 'dat');
      d.withAlpha(a, () => {
        card(S, { x, y, w: bw, h: bh }, { tone: m.who === 'u' ? 'sig' : 'dat', fill: alpha(c.c, 0.08) });
        fitText(S, m.t, x + 10 * u, y + bh / 2, bw - 20 * u, 14, { weight: 700, color: i === 3 ? et.ink : p.ink, base: 'middle' });
      });
    });
  }
}

// ── 3 · el caso de GPT-4o (abril de 2025) ──
export function drawCase(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2, et = tone(S, 'err'), dt = tone(S, 'dat'), wt = tone(S, 'w');
  // línea de tiempo
  const ty = r.y + (port ? 30 : cmp ? 20 : Math.max(30 * u, r.h * 0.16));
  const ev = [
    { x: X + W * 0.25, d: S.l('25 abr 2025', 'Apr 25, 2025'), t: S.l('actualización de GPT-4o', 'GPT-4o update'), at: 0.06 },
    { x: X + W * 0.75, d: S.l('29 abr 2025', 'Apr 29, 2025'), t: S.l('OpenAI la retira: aduladora', 'OpenAI rolls it back: sycophantic'), at: 0.22 },
  ];
  d.withAlpha(fr(S, 'syco-case', 0.02, 0.1), () => d.line(X, ty, X + W, ty, p.lineStrong, 2));
  ev.forEach((e, i) => d.withAlpha(fr(S, 'syco-case', e.at, e.at + 0.1), () => {
    d.circle(e.x, ty, 6 * u, { fill: i ? et.c : p.ink });
    fitText(S, e.d, e.x, ty - 10 * u, W * 0.48, 13, { weight: 800, color: p.ink2, align: 'center', base: 'bottom' });
    para(S, e.t, e.x - W * 0.24, ty + 12 * u, W * 0.48, FS(S, 14), { weight: 700, color: i ? et.ink : p.ink, align: 'center', maxLines: 2 });
  }));
  // las señales: la principal se debilita al sumar otras (esquema)
  const capH0 = paraH(S, S.l('qué guiaba el entrenamiento (esquema, no son proporciones reales)', 'what guided training (a sketch, not real proportions)'), W, FS(S, 13), { weight: 700, maxLines: 2 });
  const evH = Math.max(...ev.map((e) => paraH(S, e.t, W * 0.48, FS(S, 14), { weight: 700, maxLines: 2 }))), sy = ty + 12 * u + evH + capH0 + (cmp ? 20 : 30) * u, rowH = (cmp ? 30 : 40) * u, lw = Math.min(W * 0.5, 320 * u), bw = W - lw - 16 * u;
  const capS = S.l('qué guiaba el entrenamiento (esquema, no son proporciones reales)', 'what guided training (a sketch, not real proportions)'), capH = paraH(S, capS, W, FS(S, 13), { weight: 700, maxLines: 2 });
  d.withAlpha(fr(S, 'syco-case', 0.44, 0.54), () => para(S, capS, X, sy - 6 * u - capH, W, FS(S, 13), { weight: 700, color: p.mute, maxLines: 2 }));
  const k = fr(S, 'syco-case', 0.6, 0.85, 'io');
  const rows: { t: string; v: number; tn: Tone; a: number }[] = [
    { t: S.l('señal principal (frenaba la adulación)', 'main signal (held sycophancy in check)'), v: 0.8 - 0.4 * k, tn: 'dat', a: fr(S, 'syco-case', 0.48, 0.58) },
    { t: S.l('pulgares de los usuarios (nueva)', 'users’ thumbs (new)'), v: 0.45 * k, tn: 'w', a: fr(S, 'syco-case', 0.58, 0.68) },
    { t: S.l('otros cambios', 'other changes'), v: 0.25 * k, tn: 'mute', a: fr(S, 'syco-case', 0.66, 0.76) },
  ];
  rows.forEach((row, i) => d.withAlpha(row.a, () => {
    const y = sy + i * rowH + rowH / 2, c = tone(S, row.tn);
    if (port) {
      fitText(S, row.t, X, y - 9 * u, W, 13, { weight: 700, base: 'middle' });
      d.rect(X, y + 2 * u, W, 9 * u, { fill: p.surface2 }); d.rect(X, y + 2 * u, W * row.v, 9 * u, { fill: c.c });
    } else {
      fitText(S, row.t, X, y, lw, 13, { weight: 700, base: 'middle' });
      d.rect(X + lw + 16 * u, y - 6 * u, bw, 12 * u, { fill: p.surface2 }); d.rect(X + lw + 16 * u, y - 6 * u, bw * row.v, 12 * u, { fill: c.c });
    }
  }));
  void dt; void wt; void mark;
}

// ── 4 · rechazos: una línea sobre pedidos ordenados por riesgo (ilustrativo) ──
function thrAt(S: Frame) {
  if (!S.on('refuse-cost')) return 0.5;
  const a = fr(S, 'refuse-cost', 0.06, 0.26, 'io'), b = fr(S, 'refuse-cost', 0.44, 0.64, 'io'), c = fr(S, 'refuse-cost', 0.84, 0.96, 'io');
  return 0.5 - 0.3 * a + 0.65 * b - 0.35 * c;
}
/** Fila de cada pedido: por orden de riesgo, los vecinos van a filas distintas (no se enciman). */
const RANK: number[] = (() => { const idx = REQS.map((_, i) => i).sort((a, b) => REQS[a].risk - REQS[b].risk), out: number[] = []; idx.forEach((i, k) => (out[i] = k)); return out; })();
export function drawRefuse(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), et = tone(S, 'err'), dt = tone(S, 'dat');
  const W = Math.min(r.w, 760 * u), X = r.x + (r.w - W) / 2;
  const top = r.y + (cmp ? 20 : 28) * u, rowsN = port ? 5 : 3;
  const plotH = Math.min(r.h * (port ? 0.5 : 0.48), (port ? 220 : 170) * u), y0 = top + 14 * u;
  const thr = thrAt(S), aL = fr(S, 'refuse', 0.5, 0.62);
  d.withAlpha(fr(S, 'refuse', 0.02, 0.12), () => tab(S, S.l('ilustrativo: 28 pedidos inventados', 'illustrative: 28 made-up requests'), X, r.y + 8 * u, { align: 'left' }));
  // eje de riesgo
  const ax = y0 + plotH + 8 * u;
  d.withAlpha(fr(S, 'refuse', 0.24, 0.34), () => {
    d.line(X, ax, X + W, ax, p.lineStrong, 1.5);
    fitText(S, S.l('riesgo que estima el asistente →', 'risk the assistant estimates →'), X + W, ax + 6 * u, W, 13, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  // zona de rechazo
  if (aL > 0) d.withAlpha(aL, () => {
    const lx = X + W * thr;
    d.rect(lx, y0 - 6 * u, X + W - lx, plotH + 12 * u, { fill: alpha(et.c, 0.07) });
    d.line(lx, y0 - 10 * u, lx, ax, p.ink, 2.4);
    fitText(S, S.l('rechaza', 'refuses'), lx + 6 * u, y0 - 2 * u, X + W - lx - 8 * u, 13, { weight: 800, color: et.ink, base: 'top' });
    fitText(S, S.l('responde', 'answers'), lx - 6 * u, y0 - 2 * u, lx - X - 8 * u, 13, { weight: 800, color: dt.ink, align: 'right', base: 'top' });
  });
  // los pedidos: círculo = inofensivo, cruz = dañino
  const rr = Math.min(7.5 * u, W / 70);
  REQS.forEach((q, i) => {
    const x = X + W * q.risk, y = y0 + 22 * u + (RANK[i] % rowsN) * ((plotH - 30 * u) / Math.max(1, rowsN - 1));
    const a = fr(S, 'refuse', 0.26 + (i / 28) * 0.2, 0.32 + (i / 28) * 0.2);
    const refused = aL > 0 && q.risk >= thr, wrong = refused ? !q.harmful : q.harmful && aL > 0;
    d.withAlpha(a, () => {
      if (q.harmful) { const c = wrong ? et.c : p.ink2; d.line(x - rr, y - rr, x + rr, y + rr, c, 2.4); d.line(x - rr, y + rr, x + rr, y - rr, c, 2.4); }
      else d.circle(x, y, rr, { stroke: wrong ? et.c : p.ink2, lw: 2, fill: wrong ? alpha(et.c, 0.2) : 'transparent' });
      if (wrong) d.circle(x, y, rr + 4 * u, { stroke: et.c, lw: 1.4, dash: [3, 2] });
    });
  });
  // leyenda y cuentas
  const ly = ax + (cmp ? 26 : 34) * u;
  const fp = REQS.filter((q) => !q.harmful && q.risk >= thr).length, fn = REQS.filter((q) => q.harmful && q.risk < thr).length;
  d.withAlpha(fr(S, 'refuse', 0.3, 0.4), () => {
    d.circle(X + rr, ly, rr, { stroke: p.ink2, lw: 2 });
    fitText(S, S.l('inofensivo', 'harmless'), X + 2 * rr + 6 * u, ly, W * 0.22, 13, { weight: 700, base: 'middle' });
    const x2 = X + W * 0.26;
    d.line(x2 - rr + rr, ly - rr, x2 + rr + rr, ly + rr, p.ink2, 2.4); d.line(x2 - rr + rr, ly + rr, x2 + rr + rr, ly - rr, p.ink2, 2.4);
    fitText(S, S.l('dañino', 'harmful'), x2 + 2 * rr + 6 * u, ly, W * 0.2, 13, { weight: 700, base: 'middle' });
  });
  const cy = ly + (cmp ? 24 : 34) * u;
  d.withAlpha(fr(S, 'refuse-cost', 0.02, 0.1), () => {
    const c1 = S.l(`inofensivos rechazados: ${fp}`, `harmless refused: ${fp}`), c2 = S.l(`dañinos que pasan: ${fn}`, `harmful let through: ${fn}`);
    if (port) { chip(S, c1, X, cy, 'err', { align: 'left', size: 14 }); chip(S, c2, X, cy + 30 * u, 'err', { align: 'left', size: 14 }); }
    else { chip(S, c1, X, cy, 'err', { align: 'left', size: 14 }); chip(S, c2, X + W, cy, 'err', { align: 'right', size: 14 }); }
  });
}

// ── 5 · la capa de comportamiento: lo que cuesta, lo que rinde y quién la decide ──
export function drawLayer(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const lt = tone(S, 'lat'), wt = tone(S, 'w');
  const W = Math.min(r.w, 680 * u), X = r.x + (r.w - W) / 2;
  const cmpTxt = S.l('< 2 % del cómputo (InstructGPT)', '< 2% of the compute (InstructGPT)');
  const narrow = d.measure(cmpTxt, { size: FS(S, 14), weight: 800, font: 'mono' }) + d.measure(S.l('Capa de comportamiento', 'Behavior layer'), { size: FS(S, 15), weight: 800 }) + 40 * u > W;
  const H = r.h - (cmp ? 10 : 30) * u, layerH = Math.max((narrow ? 72 : cmp ? 44 : 56) * u, H * 0.2), baseH = H - layerH - 8 * u, y0 = r.y + 4 * u;
  d.withAlpha(fr(S, 'layer', 0.04, 0.14), () => {
    const rc: Rect = { x: X, y: y0 + layerH + 8 * u, w: W, h: baseH };
    card(S, rc, { tone: 'lat', fill: alpha(lt.c, 0.12), lw: 2 });
    fitText(S, S.l('Modelo base', 'Base model'), rc.x + 14 * u, rc.y + 12 * u, rc.w - 28 * u, port ? 19 : 24, { weight: 800, color: lt.ink, base: 'top' });
    para(S, S.l('lo que sabe: lenguaje, hechos, estilos', 'what it knows: language, facts, styles'), rc.x + 14 * u, rc.y + (port ? 38 : 46) * u, rc.w - 28 * u, FS(S, 15), { weight: 600, color: p.ink2, maxLines: 2 });
    const cy = rc.y + rc.h - 22 * u;
    d.withAlpha(fr(S, 'layer', 0.6, 0.7), () => fitText(S, S.l('GPT-3: 3 640 petaflops/s-día', 'GPT-3: 3,640 petaflop/s-days'), rc.x + 14 * u, cy, rc.w - 28 * u, 15, { weight: 700, font: 'mono', base: 'middle' }));
  });
  d.withAlpha(fr(S, 'layer', 0.2, 0.32), () => {
    const rc: Rect = { x: X, y: y0, w: W, h: layerH };
    card(S, rc, { tone: 'w', fill: alpha(wt.c, 0.2), lw: 2 });
    if (narrow) {
      fitText(S, S.l('Capa de comportamiento', 'Behavior layer'), rc.x + 12 * u, rc.y + rc.h * 0.22, rc.w - 24 * u, 16, { weight: 800, color: wt.ink, base: 'middle' });
      fitText(S, S.l('ejemplos · preferencias · reglas', 'examples · preferences · rules'), rc.x + 12 * u, rc.y + rc.h * 0.5, rc.w - 24 * u, 13, { weight: 600, color: p.ink2, base: 'middle' });
      d.withAlpha(fr(S, 'layer', 0.62, 0.74), () => fitText(S, cmpTxt, rc.x + 12 * u, rc.y + rc.h * 0.78, rc.w - 24 * u, 14, { weight: 800, font: 'mono', color: wt.ink, base: 'middle' }));
    } else {
      fitText(S, S.l('Capa de comportamiento', 'Behavior layer'), rc.x + 12 * u, rc.y + rc.h * 0.32, rc.w * 0.5, 17, { weight: 800, color: wt.ink, base: 'middle' });
      fitText(S, S.l('ejemplos · preferencias · reglas', 'examples · preferences · rules'), rc.x + 12 * u, rc.y + rc.h * 0.72, rc.w * 0.55, 13, { weight: 600, color: p.ink2, base: 'middle' });
      d.withAlpha(fr(S, 'layer', 0.62, 0.74), () => fitText(S, cmpTxt, rc.x + rc.w - 12 * u, rc.y + rc.h / 2, rc.w * 0.45, 16, { weight: 800, font: 'mono', color: wt.ink, align: 'right', base: 'middle' }));
    }
  });
}

export function drawLayerPref(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const wt = tone(S, 'w'), lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2;
  const rows = [
    { t: S.l('InstructGPT', 'InstructGPT'), s: S.l('1 300 millones de parámetros · con la capa', '1.3 billion parameters · with the layer'), v: 1.3, tn: 'w' as Tone, at: 0.1 },
    { t: 'GPT-3', s: S.l('175 000 millones de parámetros · sin la capa', '175 billion parameters · without the layer'), v: 175, tn: 'lat' as Tone, at: 0.42 },
  ];
  const rowH = Math.min((cmp ? 70 : 96) * u, r.h / 2.6), y0 = r.y + (r.h - 2 * rowH) / 2 - 10 * u;
  rows.forEach((row, i) => {
    const y = y0 + i * rowH, c = tone(S, row.tn), a = fr(S, 'layer-pref', row.at, row.at + 0.1), k = fr(S, 'layer-pref', row.at + 0.04, row.at + 0.22, 'io');
    d.withAlpha(a, () => {
      fitText(S, row.t, X, y, W * 0.6, port ? 17 : 19, { weight: 800, color: c.ink, base: 'top' });
      fitText(S, row.s, X, y + (port ? 22 : 26) * u, W, 13, { weight: 600, color: p.ink2, base: 'top' });
      const by = y + (port ? 44 : 52) * u, bh = (cmp ? 12 : 16) * u, len = Math.max(3 * u, W * (row.v / 175) * k);
      d.rect(X, by, W, bh, { fill: p.surface2 });
      d.rect(X, by, len, bh, { fill: c.c });
    });
  });
  const aP = fr(S, 'layer-pref', 0.7, 0.8);
  d.withAlpha(aP, () => {
    const cy = y0 - 2 * u;
    mark(S, 'yes', X + W - 10 * u, cy + 8 * u, 10 * u);
    fitText(S, S.l('las personas la prefirieron', 'people preferred it'), X + W - 26 * u, cy + 8 * u, W * 0.45, 14, { weight: 800, color: dt.ink, align: 'right', base: 'middle' });
  });
  d.withAlpha(fr(S, 'layer-pref', 0.82, 0.92), () => para(S, S.l('Más de cien veces menos parámetros, y aun así sus respuestas ganaron.', 'Over a hundred times fewer parameters, and still its answers won.'), X, y0 + 2 * rowH + 2 * u, W, FS(S, 14), { weight: 700, color: p.ink, maxLines: 2 }));
  void wt; void lt;
}

export function drawWho(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const W = Math.min(r.w, 720 * u), X = r.x + (r.w - W) / 2, wt = tone(S, 'w');
  const pc = Math.max(1.8, (cmp ? 2.2 : 3) * u), n = port ? 6 : 9, sp = 6 * pc + (port ? 8 : 12) * u;
  const quote = S.l('Según sus autores, InstructGPT se alineó con las preferencias de un grupo concreto de personas: sobre todo quienes etiquetaron y los investigadores.', 'Its authors say InstructGPT was aligned to “the stated preferences of a specific group of people (mostly our labelers and researchers).”');
  const qs = FS(S, port ? 14 : 16), qh = paraH(S, quote, W, qs, { weight: 700, maxLines: 4 });
  const contentH = 9 * pc + 12 * u + qh + (cmp ? 18 : 30) * u + (cmp ? 52 : 64) * u + 12 * u;
  const y0 = r.y + Math.max((cmp ? 10 : 24) * u, (r.h - contentH) * 0.4);
  for (let i = 0; i < n; i++) person(S, X + i * sp, y0, pc, 'ink', fr(S, 'who', 0.04 + i * 0.02, 0.1 + i * 0.02));
  d.withAlpha(fr(S, 'who', 0.2, 0.3), () => para(S, quote, X, y0 + 9 * pc + 12 * u, W, qs, { weight: 700, color: p.ink2, maxLines: 4 }));
  const dec = [S.l('tono', 'tone'), S.l('longitud', 'length'), S.l('qué rechaza', 'what it refuses'), S.l('cuánto da la razón', 'how much it agrees')];
  const cy = y0 + 9 * pc + 12 * u + qh + (cmp ? 18 : 30) * u;
  d.withAlpha(fr(S, 'who', 0.62, 0.72), () => fitText(S, S.l('decisiones de producto:', 'product decisions:'), X, cy, W, 15, { weight: 800, base: 'middle' }));
  let x = X, y = cy + (cmp ? 26 : 32) * u;
  dec.forEach((t, i) => {
    const w = d.measure(t, { size: FS(S, 14), weight: 700 }) + 18 * u;
    if (x + w > X + W) { x = X; y += (cmp ? 26 : 32) * u; }
    d.withAlpha(fr(S, 'who', 0.7 + i * 0.05, 0.78 + i * 0.05), () => chip(S, t, x, y, 'w', { align: 'left', size: 14 }));
    x += w + 10 * u;
  });
  void wt;
}

// ── 6 · el puente ──
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const cx = r.x + r.w / 2, cy = r.y + r.h * (port ? 0.36 : 0.4);
  d.withAlpha(fr(S, 'bridge', 0.4, 0.55), () => {
    para(S, S.l('¿Puede pensar antes de responder?', 'Can it think before it answers?'), r.x, cy - 20 * u, r.w, port ? 22 : cmp ? 22 : 28, { weight: 800, align: 'center', maxLines: 2 });
    fitText(S, S.l('Lección 29 · Modelos de razonamiento', 'Lesson 29 · Reasoning models'), cx, cy + (port ? 60 : 44) * u, r.w, 15, { weight: 700, color: p.ink2, align: 'center', base: 'top' });
  });
  d.withAlpha(fr(S, 'bridge', 0.05, 0.2), () => {
    const sc = Math.max(2, Math.round((cmp ? 2 : 3) * u));
    neu(S, cx - 12 * sc, cy - 20 * u - 18 * sc - 16 * u, { scale: sc, mood: 'think' });
  });
}
