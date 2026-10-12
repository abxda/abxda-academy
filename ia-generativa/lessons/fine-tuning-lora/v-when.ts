// QLoRA (base en 4 bits + adaptador), las tres herramientas (prompt → RAG → ajuste fino) con la evidencia sobre hechos nuevos,
// el asistente de decisión de tres preguntas (casos ilustrativos, cases.ts) y «datos y evaluación primero».
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { caseById, type Case, type Tool } from './cases';
import { ap, area, arrowP, card, fitText, hold, isShort, lineH, lines, mark, measure, memBar, mv, pill, provenance, txt } from './draw';
import { BASE_NF4 } from './quant';
import { getRun, STEPS } from './runs';
import { alp, drawSigned, lock, maxAbs, meter, meterH } from './ui';
import { LORA_R } from './v-toy';

// ═════════ QLoRA ═════════
export function drawQlora(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S), w = tone(S, 'w');
  const topH = A.h * (port ? 0.5 : 0.52), head = lineH(S, 13, 1.25) * 2 + 6 * u;
  const side = Math.min(topH - head, port ? A.w * 0.46 : A.w * 0.3);
  const bx = port ? A.x : A.x + A.w * 0.08, by = A.y + head;
  const a1 = ap(S, 'qlora', 0.3, 0.44), a2 = ap(S, 'qlora', 0.62, 0.76);
  const ax0 = bx + side + (port ? 18 : 60) * u, hw = ax0 - bx - 10 * u;
  // la base congelada, guardada en 4 bits: los pesos reales del modelo diminuto, cuantizados (pocos tonos)
  d.withAlpha(a1, () => {
    fitText(S, port || short ? S.l('base congelada', 'frozen base') : S.l('modelo base, congelado', 'base model, frozen'), bx, A.y + lineH(S, 13, 1.25) / 2, hw, { s: 13, weight: 800, c: p.ink });
    fitText(S, port || short ? S.l('en 4 bits (lección 25)', 'in 4 bits (lesson 25)') : S.l('guardado en 4 bits (lección 25)', 'stored in 4 bits (lesson 25)'), bx, A.y + lineH(S, 13, 1.25) * 1.5 + 2 * u, hw, { s: 12.5, weight: 700, c: p.mute });
    drawSigned(S, bx, by, BASE_NF4.W2, 32, 32, side / 32, { range: maxAbs(BASE_NF4.W2) * 0.9, neutral: true, levels: 8 });
    lock(S, bx + side - 12 * u, by + 14 * u, 18 * u);
  });
  // el adaptador: B y A reales (LoRA de rango 2), en más precisión
  const fin = getRun(LORA_R).at(STEPS), ax = ax0, aw = A.x + A.w - ax;
  d.withAlpha(a2, () => {
    txt(S, '+', bx + side + (port ? 9 : 30) * u, by + side / 2, { s: 24, weight: 800, c: p.ink2, align: 'center' });
    fitText(S, S.l('adaptador B y A', 'adapter B and A'), ax, A.y + lineH(S, 13, 1.25) / 2, aw, { s: 13, weight: 800, c: w.ink });
    fitText(S, S.l('se entrena en 16 bits', 'trained in 16 bits'), ax, A.y + lineH(S, 13, 1.25) * 1.5 + 2 * u, aw, { s: 12.5, weight: 700, c: p.mute });
    const c = Math.min(side / 32, (aw - 10 * u) / 34);
    drawSigned(S, ax, by + 3 * c, fin.B ?? [], 32, 2, c, { range: maxAbs(fin.B ?? [1]) });
    drawSigned(S, ax + 3 * c, by, fin.A ?? [], 2, 32, c, { range: maxAbs(fin.A ?? [1]) });
  });
  // qlora-result: de más de 780 GB a menos de 48 GB (65 mil millones de parámetros)
  if (S.on('qlora-result')) {
    const R: Rect = { x: A.x, y: A.y + topH + (short ? 8 : 18) * u, w: A.w, h: A.h - topH - (short ? 8 : 18) * u };
    const lh = lineH(S, 13, 1.3), labW = port ? 0 : Math.min(R.w * 0.3, 230 * u), bw = R.w - labW, bh = (port ? 14 : 18) * u, lab = port ? lineH(S, 13, 1.25) : 0;
    const aT = ap(S, 'qlora-result', 0.06, 0.18), aB1 = ap(S, 'qlora-result', 0.62, 0.74), aB2 = ap(S, 'qlora-result', 0.28, 0.42);
    fitText(S, port ? S.l('un modelo de 65 mil millones: memoria de GPU', 'a 65-billion model: GPU memory') : S.l('ajustar un modelo de 65 mil millones de parámetros: memoria de GPU', 'tuning a 65-billion-parameter model: GPU memory'), R.x, R.y + lh / 2, R.w, { s: 13, weight: 700, c: p.mute, a: aT });
    let y = R.y + lh + 6 * u;
    d.withAlpha(aB2, () => {
      fitText(S, port ? S.l('QLoRA: menos de 48 GB, una sola GPU', 'QLoRA: under 48 GB, a single GPU') : 'QLoRA', R.x, port ? y + lab / 2 : y + bh / 2, port ? R.w : labW - 8 * u, { s: 13, weight: 800, c: w.ink });
      memBar(S, R.x + labW, y + lab, bw, bh, 48 / 800, { tone: 'w' });
      if (!port) fitText(S, S.l('menos de 48 GB: una sola GPU', 'under 48 GB: a single GPU'), R.x + labW + bw * (48 / 800) + 8 * u, y + bh / 2, bw * 0.9, { s: 12.5, weight: 800, c: w.ink });
    });
    y += lab + bh + 12 * u;
    d.withAlpha(aB1, () => {
      fitText(S, port ? S.l('ajuste completo en 16 bits: más de 780 GB', 'full tuning in 16 bits: over 780 GB') : S.l('ajuste completo, 16 bits', 'full tuning, 16 bits'), R.x, port ? y + lab / 2 : y + bh / 2, port ? R.w : labW - 8 * u, { s: 13, weight: 800, c: p.ink2 });
      memBar(S, R.x + labW, y + lab, bw, bh, 780 / 800, { tone: 'err' });
      if (!port) txt(S, S.l('más de 780 GB', 'over 780 GB'), R.x + labW + bw * (780 / 800) - 8 * u, y + bh / 2, { s: 12.5, weight: 800, c: p.stage, align: 'right' });
    });
  }
  provenance(S, S.l('Dettmers et al., 2023 · tablas del modelo diminuto', 'Dettmers et al., 2023 · tiny-model tables'), a1);
  void alpha; void alp; void mv;
}

// ═════════ las tres herramientas ═════════
export function drawTools(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S);
  const items: { title: string; l1: string; l2: string; cost: number; t: Tone; a: number }[] = [
    { title: S.l('1 · Prompt', '1 · Prompt'), l1: S.l('pedirlo bien, con un par de ejemplos', 'ask well, with a couple of examples'), l2: S.l('el modelo no cambia', 'the model does not change'), cost: 1, t: 'lat', a: ap(S, 'tool-prompt', 0.42, 0.56) },
    { title: S.l('2 · RAG', '2 · RAG'), l1: S.l('traer los documentos al prompt', 'bring the documents into the prompt'), l2: S.l('lección 31', 'lesson 31'), cost: 2, t: 'lat', a: ap(S, 'tool-rag', 0.04, 0.18) },
    { title: S.l('3 · Ajuste fino', '3 · Fine-tuning'), l1: S.l('cambiar los parámetros', 'change the parameters'), l2: S.l('datos, entrenamiento y evaluación', 'data, training, and evaluation'), cost: 3, t: 'w', a: ap(S, 'tool-ft', 0.04, 0.18) },
  ];
  const head = lineH(S, 14, 1.3);
  fitText(S, S.l('¿cuándo conviene ajustar?', 'when is tuning worth it?'), A.x, A.y + head / 2, A.w, { s: 14, weight: 800, c: p.ink, a: ap(S, 'tool-prompt', 0.04, 0.16) });
  const top = A.y + head + 8 * u, evH = (port ? 2 * 62 : short ? 2 * 34 : 2 * 50) * u, ladH = A.y + A.h - evH - top - (port ? 14 * u + lineH(S, 12.5, 1.3) : 18 * u);
  const rects: Rect[] = [];
  if (port) {
    const ch = Math.min(84 * u, (ladH - 2 * 8 * u) / 3);
    for (let i = 0; i < 3; i++) rects.push({ x: A.x + (2 - i) * 0 , y: top + i * (ch + 8 * u), w: A.w, h: ch });
  } else {
    const gx = 18 * u, cw = (A.w - 2 * gx) / 3, step = Math.min(26 * u, ladH * 0.12), ch = ladH - 2 * step;
    for (let i = 0; i < 3; i++) rects.push({ x: A.x + i * (cw + gx), y: top + (2 - i) * step, w: cw, h: ch });
  }
  items.forEach((it, i) => {
    const r = rects[i], c = tone(S, it.t), pad = 12 * u;
    d.withAlpha(it.a, () => {
      card(S, r, { tone: it.t, fill: 0.07 });
      if (port || short) {
        fitText(S, it.title, r.x + pad, r.y + r.h * 0.24, r.w * 0.6, { s: 14.5, weight: 800, c: c.ink });
        fitText(S, it.l1, r.x + pad, r.y + r.h * 0.54, r.w - 2 * pad, { s: 12.5, weight: 700, c: p.ink });
        fitText(S, it.l2, r.x + pad, r.y + r.h * 0.8, r.w - 2 * pad, { s: 12, weight: 600, c: p.mute });
        costDots(S, r.x + r.w - pad, r.y + r.h * 0.24, it.cost, c.c, 'right');
      } else {
        fitText(S, it.title, r.x + pad, r.y + pad + lineH(S, 16, 1) / 2, r.w - 2 * pad, { s: 16, weight: 800, c: c.ink });
        let y = r.y + pad + lineH(S, 16, 1) + 10 * u;
        for (const ln of lines(S, it.l1, r.w - 2 * pad, { s: 13, max: 2 })) { txt(S, ln, r.x + pad, y + lineH(S, 13, 1.3) / 2, { s: 13, weight: 700, c: p.ink }); y += lineH(S, 13, 1.3); }
        for (const ln of lines(S, it.l2, r.w - 2 * pad, { s: 12.5, max: 2 })) { txt(S, ln, r.x + pad, y + lineH(S, 12.5, 1.3) / 2, { s: 12.5, weight: 600, c: p.mute }); y += lineH(S, 12.5, 1.3); }
        txt(S, S.l('costo', 'cost'), r.x + pad, r.y + r.h - pad - 6 * u, { s: 12, weight: 700, c: p.mute });
        costDots(S, r.x + pad + 44 * u, r.y + r.h - pad - 6 * u, it.cost, c.c, 'left');
      }
    });
  });
  // para qué sirve el ajuste fino (tool-ft)
  const aFor = ap(S, 'tool-ft', 0.55, 0.68);
  if (aFor > 0.01) {
    const r = rects[2], t = S.l('sirve para: un tono, un formato, una tarea repetida', 'good for: a tone, a format, a repeated task');
    if (port) fitText(S, t, r.x + r.w / 2, r.y + r.h + 4 * u + lineH(S, 12.5, 1) / 2, r.w, { s: 12.5, weight: 800, c: tone(S, 'w').ink, align: 'center', a: aFor });
    else { const pw = measure(S, t, 12.5, false, 800) + 16 * u; pill(S, t, Math.min(r.x + r.w / 2, A.x + A.w - pw / 2 - 2 * u), r.y - lineH(S, 12.5, 1) / 2 - 10 * u, { s: 12.5, tone: 'w', a: aFor }); }
  }
  // la evidencia: hechos nuevos
  const ey = A.y + A.h - evH, rowH = evH / 2;
  const ev: [string, string, number][] = [
    [S.l('Hechos nuevos: RAG funcionó mejor que ajustar con esos mismos textos.', 'New facts: RAG worked better than tuning on those same texts.'), 'Ovadia et al., 2023', ap(S, 'not-facts', 0.3, 0.44)],
    [S.l('Hechos nuevos por ajuste fino: se aprenden despacio y, luego, el modelo inventa más.', 'New facts through fine-tuning: learned slowly, and then the model makes up more.'), 'Gekhman et al., 2024', ap(S, 'halluc', 0.12, 0.26)],
  ];
  ev.forEach(([t, src, a], i) => {
    const y = ey + i * rowH;
    d.withAlpha(a, () => {
      mark(S, A.x + 10 * u, y + rowH * 0.38, i === 0, 7);
      const tw = A.w - 30 * u, ls = lines(S, t, tw, { s: 13.5, weight: 700, max: port ? 2 : 1 });
      ls.forEach((ln, k) => txt(S, ln, A.x + 28 * u, y + rowH * 0.38 + (k - (ls.length - 1) / 2) * lineH(S, 13.5, 1.25), { s: 13.5, weight: 700, c: p.ink }));
      fitText(S, src, A.x + 28 * u, y + rowH * 0.38 + (ls.length / 2) * lineH(S, 13.5, 1.25) + lineH(S, 12, 1) * 0.55, tw, { s: 12, c: p.mute });
    });
  });
  void alpha; void clamp;
}

function costDots(S: Frame, x: number, y: number, n: number, c: string, align: 'left' | 'right') {
  const u = S.u, r = 5 * u, g = 14 * u;
  for (let i = 0; i < 3; i++) {
    const cx = align === 'left' ? x + i * g : x - (2 - i) * g;
    S.d.circle(cx, y, r, { fill: i < n ? c : 'transparent', stroke: c, lw: 1.5 });
  }
}

// ═════════ el asistente de decisión ═════════
const Q: [string, string][] = [
  ['¿Ya probaste un buen prompt?', 'Tried a good prompt yet?'],
  ['¿Falta información que cambia?', 'Missing information that changes?'],
  ['¿Tarea estable y repetida, con miles de ejemplos buenos?', 'Stable, repeated task, with thousands of good examples?'],
];
const OUT: { tool: Tool; es: string; en: string; t: Tone; exit: boolean }[] = [
  { tool: 'prompt', es: 'Prompt', en: 'Prompt', t: 'lat', exit: false },     // Q1 sale con «no»
  { tool: 'rag', es: 'RAG', en: 'RAG', t: 'lat', exit: true },               // Q2 sale con «sí»
  { tool: 'ft', es: 'Ajuste fino', en: 'Fine-tuning', t: 'w', exit: true },  // Q3 sale con «sí»
];

/** Progreso (0..1) del camino del caso actual y desde cuándo se ve cada pregunta. */
function pathProgress(S: Frame): number {
  if (S.is('case-tone')) return mv(S, 'case-tone', 0.3, 0.8);
  if (S.is('case-catalog')) return mv(S, 'case-catalog', 0.08, 0.72);
  if (S.is('case-tickets')) return mv(S, 'case-tickets', 0.08, 0.85);
  const at = S.st.caseAt as number | undefined;
  return at === undefined ? 1 : clamp((S.clock - at) / 1.6);
}
const qShown = (S: Frame, i: number) => i === 0 ? ap(S, 'case-tone', 0.04, 0.16) : i === 1 ? ap(S, 'case-catalog', 0.04, 0.16) : ap(S, 'case-tickets', 0.04, 0.16);

export function drawDecide(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S);
  const cs: Case = caseById(S.p.case);
  const swapA = S.st.caseAt !== undefined && S.is('decide-try') ? clamp((S.clock - (S.st.caseAt as number)) / 0.35) : 1;
  const segA = S.is('case-catalog') ? ap(S, 'case-catalog', 0, 0.08) : S.is('case-tickets') ? ap(S, 'case-tickets', 0, 0.08) : 1;
  // la tarjeta del caso
  const cardH = (port ? 74 : short ? 48 : 64) * u, R0: Rect = { x: A.x, y: A.y, w: A.w, h: cardH };
  d.withAlpha(Math.min(swapA, segA), () => {
    card(S, R0, { tone: 'ink' });
    fitText(S, S.l(`Caso: ${cs.title.es}`, `Case: ${cs.title.en}`), R0.x + 12 * u, R0.y + 10 * u + lineH(S, 14, 1) / 2, R0.w - 24 * u, { s: 14, weight: 800, c: p.ink });
    const ls = lines(S, S.L(cs.text), R0.w - 24 * u, { s: 13, max: port ? 2 : short ? 1 : 2 });
    ls.forEach((ln, k) => txt(S, ln, R0.x + 12 * u, R0.y + 10 * u + lineH(S, 14, 1) + 6 * u + (k + 0.5) * lineH(S, 13, 1.25), { s: 13, weight: 600, c: p.ink2 }));
  });
  // el camino: preguntas y salidas del caso
  const pp = pathProgress(S) * Math.min(swapA, segA);
  const nQ = cs.answers.length, E = 2 * nQ + 1, lit = (e: number) => clamp(pp * E - e);       // e = 2i pregunta i; 2i+1 su flecha; 2nQ la salida
  const outIdx = cs.tool === 'prompt' ? 0 : cs.tool === 'rag' ? 1 : 2;
  const whyH = lineH(S, 13, 1.25) * 2 + 8 * u;
  const F: Rect = { x: A.x, y: A.y + cardH + (short ? 10 : 18) * u, w: A.w, h: A.h - cardH - (short ? 10 : 18) * u - whyH };
  const qR: Rect[] = [], oR: Rect[] = [];
  if (port) {
    const qh = Math.min(50 * u, (F.h - 2 * 22 * u) / 3), qw = A.w * 0.6, ow = A.w * 0.3;
    for (let i = 0; i < 3; i++) { const y = F.y + i * (qh + 22 * u); qR.push({ x: A.x, y, w: qw, h: qh }); oR.push({ x: A.x + A.w - ow, y: y + qh * 0.15, w: ow, h: qh * 0.7 }); }
  } else {
    const gx = 40 * u, qw = (A.w - 2 * gx) / 3, qh = Math.min((short ? 44 : 62) * u, F.h * 0.46), oh = Math.min((short ? 30 : 40) * u, F.h * 0.3);
    for (let i = 0; i < 3; i++) { const x = A.x + i * (qw + gx); qR.push({ x, y: F.y, w: qw, h: qh }); oR.push({ x: x + qw * 0.15, y: F.y + F.h - oh, w: qw * 0.7, h: oh }); }
  }
  for (let i = 0; i < 3; i++) {
    const a = S.is('decide-try') ? 1 : qShown(S, i);
    if (a <= 0.01) continue;
    const onPath = i < nQ, qa = onPath ? lit(2 * i) : 0, ans = onPath ? cs.answers[i] : undefined;
    const r = qR[i], o = oR[i], ot = tone(S, OUT[i].t);
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: qa > 0 ? alpha(tone(S, 'ink').c, 0.06 + 0.08 * qa) : p.surface, stroke: qa > 0.5 ? p.ink : p.lineStrong, lw: 1.3 + qa, r: 6 });
      const ls = lines(S, S.l(Q[i][0], Q[i][1]), r.w - 16 * u, { s: 13, weight: 700, max: 2 });
      ls.forEach((ln, k) => txt(S, ln, r.x + r.w / 2, r.y + r.h / 2 + (k - (ls.length - 1) / 2) * lineH(S, 13, 1.2), { s: 13, weight: 700, c: p.ink, align: 'center' }));
      // salida de esta pregunta
      const outLit = onPath && i === outIdx ? lit(2 * nQ) : 0;
      d.rect(o.x, o.y, o.w, o.h, { fill: alpha(ot.c, 0.07 + 0.3 * outLit), stroke: ot.c, lw: 1.3 + 1.4 * outLit, r: o.h / 2 });
      fitText(S, S.l(OUT[i].es, OUT[i].en), o.x + o.w / 2, o.y + o.h / 2, o.w - 12 * u, { s: 14, weight: 800, c: ot.ink, align: 'center' });
      const exitTxt = OUT[i].exit ? S.l('sí', 'yes') : 'no';
      const goesOut = onPath && ans === OUT[i].exit, eL = goesOut ? lit(2 * i + 1) : 0;
      if (port) {
        const y = r.y + r.h / 2;
        d.line(r.x + r.w, y, o.x, y, eL > 0 ? ot.c : p.line, 1.4 + 1.6 * eL);
        d.arrow(o.x - 10 * u, y, o.x - 1, y, eL > 0 ? ot.c : p.line, 1.4 + 1.6 * eL, 6 * u);
        txt(S, exitTxt, (r.x + r.w + o.x) / 2, y - 9 * u, { s: 12, weight: 800, c: eL > 0 ? ot.ink : p.mute, align: 'center' });
      } else {
        const x = r.x + r.w / 2;
        d.line(x, r.y + r.h, x, o.y, eL > 0 ? ot.c : p.line, 1.4 + 1.6 * eL);
        d.arrow(x, o.y - 10 * u, x, o.y - 1, eL > 0 ? ot.c : p.line, 1.4 + 1.6 * eL, 6 * u);
        txt(S, exitTxt, x + 8 * u, (r.y + r.h + o.y) / 2, { s: 12, weight: 800, c: eL > 0 ? ot.ink : p.mute });
      }
      // paso a la siguiente pregunta
      if (i < 2) {
        const nA = S.is('decide-try') ? 1 : qShown(S, i + 1), next = qR[i + 1], goesOn = onPath && ans !== OUT[i].exit, eN = goesOn ? lit(2 * i + 1) : 0;
        const lab = OUT[i].exit ? 'no' : S.l('sí', 'yes');
        d.withAlpha(nA, () => {
          if (port) {
            const x = r.x + r.w / 2;
            d.line(x, r.y + r.h, x, next.y, eN > 0 ? p.ink : p.line, 1.4 + 1.6 * eN);
            d.arrow(x, next.y - 8 * u, x, next.y - 1, eN > 0 ? p.ink : p.line, 1.4 + 1.6 * eN, 6 * u);
            txt(S, lab, x + 8 * u, (r.y + r.h + next.y) / 2, { s: 12, weight: 800, c: eN > 0 ? p.ink : p.mute });
          } else {
            const y = r.y + r.h / 2;
            d.line(r.x + r.w, y, next.x, y, eN > 0 ? p.ink : p.line, 1.4 + 1.6 * eN);
            d.arrow(next.x - 10 * u, y, next.x - 1, y, eN > 0 ? p.ink : p.line, 1.4 + 1.6 * eN, 6 * u);
            txt(S, lab, (r.x + r.w + next.x) / 2, y - 10 * u, { s: 12, weight: 800, c: eN > 0 ? p.ink : p.mute, align: 'center' });
          }
        });
      }
    });
  }
  // si la tercera es «no»: aún no ajustes
  const a3 = S.is('decide-try') ? 1 : qShown(S, 2);
  if (a3 > 0.01) {
    const r = qR[2], t = S.l('si no: sigue con prompt o RAG', 'if not: stay with prompt or RAG');
    if (port) fitText(S, t, r.x, r.y + r.h + 9 * u, A.w, { s: 12, weight: 600, c: p.mute, a: a3 });
    else fitText(S, t, oR[2].x + oR[2].w / 2, oR[2].y - 12 * u, r.w, { s: 12, weight: 600, c: p.mute, align: 'center', a: a3 * 0 });
  }
  // por qué
  const aW = lit(2 * nQ);
  const wy = A.y + A.h - whyH;
  const ls = lines(S, S.L(cs.why), A.w, { s: 13, weight: 700, max: 2 });
  ls.forEach((ln, k) => txt(S, ln, A.x, wy + (k + 0.5) * lineH(S, 13, 1.25) + 4 * u, { s: 13, weight: 700, c: tone(S, OUT[outIdx].t).ink, a: aW }));
  provenance(S, S.l('casos ilustrativos', 'illustrative cases'), ap(S, 'case-tone', 0.1, 0.2));
  void arrowP; void hold;
}

// ═════════ datos y evaluación primero ═════════
export function drawData(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S), dt = tone(S, 'dat');
  const lh = lineH(S, 13, 1.3);
  // data-first: 9 000 ejemplos bien elegidos frente a 450 000 menos adecuados
  const a0 = ap(S, 'data-first', 0.04, 0.16);
  fitText(S, S.l('datos para ajustar un chatbot (QLoRA)', 'data to tune a chatbot (QLoRA)'), A.x, A.y + lh / 2, A.w, { s: 13.5, weight: 800, c: p.ink, a: a0 });
  const labW = port ? 0 : Math.min(A.w * 0.34, 260 * u), bw = A.w - labW, bh = (port ? 14 : 18) * u, lab = port ? lineH(S, 13, 1.25) : 0;
  let y = A.y + lh + 10 * u;
  const aA = ap(S, 'data-first', 0.4, 0.52), aB = ap(S, 'data-first', 0.62, 0.74), aBest = ap(S, 'data-first', 0.82, 0.94);
  d.withAlpha(aA, () => {
    fitText(S, port ? S.l(`${S.n(9000, 0)} bien elegidos`, `${S.n(9000, 0)} well chosen`) : S.l(`${S.n(9000, 0)} ejemplos bien elegidos`, `${S.n(9000, 0)} well-chosen examples`), A.x, port ? y + lab / 2 : y + bh / 2, port ? A.w * 0.55 : labW - 8 * u, { s: 13, weight: 800, c: dt.ink });
    memBar(S, A.x + labW, y + lab, bw, bh, 9 / 450, { tone: 'dat' });
  });
  if (port) pill(S, S.l('mejor resultado', 'better result'), A.x + A.w, y + lab / 2 - 1 * u, { s: 12, tone: 'dat', align: 'right', a: aBest });
  else pill(S, S.l('mejor resultado', 'better result'), A.x + labW + bw * (9 / 450) + 12 * u, y + bh / 2, { s: 12.5, tone: 'dat', align: 'left', a: aBest });
  y += lab + bh + 12 * u;
  d.withAlpha(aB, () => {
    fitText(S, S.l(`${S.n(450000, 0)} menos adecuados`, `${S.n(450000, 0)} less suitable`), A.x, port ? y + lab / 2 : y + bh / 2, port ? A.w : labW - 8 * u, { s: 13, weight: 800, c: p.ink2 });
    memBar(S, A.x + labW, y + lab, bw, bh, 1, { tone: 'mute' });
  });
  y += lab + bh + (port ? 26 : short ? 14 : 40) * u;
  // eval: antes y después, las dos cifras del modelo diminuto
  if (S.on('eval')) {
    const fin = getRun(LORA_R).at(STEPS);
    const aE = ap(S, 'eval', 0.06, 0.18);
    fitText(S, port ? S.l('mide antes y después, con casos nuevos', 'measure before and after, on new cases') : S.l('mide antes y después, con casos que el modelo no vio', 'measure before and after, with cases the model has not seen'), A.x, y + lh / 2, A.w, { s: 13.5, weight: 800, c: p.ink, a: aE });
    y += lh + 8 * u;
    const gap = (port ? 14 : 30) * u, cw = (A.w - gap) / 2, mh = meterH(S);
    const cols: [string, number, number, number][] = [
      [port ? S.l('aciertos antes', 'accuracy before') : S.l('antes del ajuste', 'before tuning'), 0, 1, ap(S, 'eval', 0.3, 0.42)],
      [port ? S.l('aciertos después', 'accuracy after') : S.l('después (LoRA con repaso)', 'after (LoRA with replay)'), fin.newSk, fin.oldSk, ap(S, 'eval', 0.5, 0.62)],
    ];
    const lN = port ? S.l('lo nuevo', 'new part') : S.l('aciertos en lo nuevo', 'accuracy on the new part');
    const lO = port ? S.l('lo que ya sabía', 'what it knew') : S.l('aciertos en lo que ya sabía', 'accuracy on what it knew');
    cols.forEach(([h, n, o, a], i) => {
      const x = A.x + i * (cw + gap);
      d.withAlpha(a, () => {
        fitText(S, h, x, y + lh / 2, cw, { s: 12.5, weight: 800, c: p.mute });
        meter(S, { x, y: y + lh + 4 * u, w: cw }, lN, n, { tone: 'dat', hatch: true });
        meter(S, { x, y: y + lh + 4 * u + mh + 10 * u, w: cw }, lO, o, { tone: 'dat', hot: i === 1 ? ap(S, 'eval', 0.66, 0.78) : 0 });
      });
    });
    provenance(S, S.l('modelo diminuto · Dettmers et al., 2023', 'tiny model · Dettmers et al., 2023'), 1);
  } else provenance(S, S.l('Dettmers et al., 2023: OASST1 frente a FLAN v2', 'Dettmers et al., 2023: OASST1 vs. FLAN v2'), a0);
  void alp; void lock;
}
