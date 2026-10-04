// Acto 2 · Ajuste con instrucciones: ejemplos escritos por personas, la máscara de pérdida, una capa pequeña,
// el turno «modelo base frente a asistente» (salidas reales) y el límite de imitar.
import { alpha, clamp, inset, link, tokenRow, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SAMPLES } from './outputs-data';
import { FS, arrowLabel, card, cursor, docLines, drawDoc, fitText, glyph, isCompact, lines, mark, para, paraH, person, smooth, tab } from './ui';
import { st } from './state';

export function drawSft(S: Frame) {
  const d = S.d, toHow = S.at('sft-how', 0, 0.8), toScale = S.at('sft-scale', 0, 0.8), toCmp = S.at('compare-intro', 0, 0.8), toLim = S.at('sft-limit', 0, 0.8);
  const aIdea = S.reveal('sft-idea', 0, 0.6) * (1 - toHow), aHow = toHow * (1 - toScale), aScale = toScale * (1 - toCmp), aCmp = toCmp * (1 - toLim);
  if (aIdea > 0.005) d.withAlpha(aIdea, () => drawIdea(S));
  if (aHow > 0.005) d.withAlpha(aHow, () => drawHow(S));
  if (aScale > 0.005) d.withAlpha(aScale, () => drawScale(S));
  if (aCmp > 0.005) d.withAlpha(aCmp, () => drawCompare(S));
  if (toLim > 0.005) d.withAlpha(toLim, () => drawLimit(S));
}

// ── ejemplos de indicación + respuesta ideal, escritos por personas ──
function examples(S: Frame) {
  return [
    { q: S.l('¿Cuántos días tiene febrero?', 'How many days does February have?'), a: S.l('28, o 29 en año bisiesto.', '28, or 29 in a leap year.') },
    { q: S.l('Traduce al inglés: «buenos días».', 'Translate into Spanish: “good morning”.'), a: S.l('Good morning.', 'Buenos días.') },
    { q: S.l('Explica qué es una hipoteca.', 'Explain what a mortgage is.'), a: S.l('Un préstamo garantizado con la propia vivienda.', 'A loan secured by the home itself.') },
  ];
}

function drawIdea(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u), port = S.portrait, cmp = isCompact(S);
  const ex = examples(S), st_ = tone(S, 'sig'), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const bs = FS(S, cmp ? 14 : 16), ts = FS(S, 12), gap = 8 * u;
  const lw1 = d.measure(S.l('indicación', 'prompt'), { size: ts, weight: 800 }), lw2 = d.measure(S.l('respuesta ideal', 'ideal answer'), { size: ts, weight: 800 }), lw = Math.max(lw1, lw2) + 12 * u;
  const modelW = port ? r.w * 0.56 : r.w * 0.24, modelH = port ? 64 * u : 120 * u;
  const cardsW = port ? r.w : r.w - modelW - 56 * u;
  const lineH = 1.25 * bs * u, ch = 18 * u + lineH * (port ? 3 : 2.4);
  const pc = Math.max(2, Math.round(2 * u)), pH = 9 * pc + 8 * u;
  const blockH = pH + 3 * ch + 2 * gap;
  const y0 = r.y + Math.max(2 * u, (r.h - blockH - (port ? modelH + 40 * u : 0)) / 2);
  d.withAlpha(S.reveal('sft-idea', 0, 0.5), () => {
    for (let i = 0; i < 3; i++) person(S, r.x + i * 6 * pc * 1.15, y0, pc, 'ink');
    d.text(S.l('personas escriben los ejemplos', 'people write the examples'), r.x + 3 * 6 * pc * 1.15 + 6 * u, y0 + 4.5 * pc, { size: FS(S, 14), weight: 700, color: p.ink2, base: 'middle' });
  });
  ex.forEach((e, i) => {
    const a = S.reveal('sft-idea', 0.5 + i * 0.5, 0.5), y = y0 + pH + i * (ch + gap) + (1 - a) * 8 * u;
    d.withAlpha(a, () => {
      const rc: Rect = { x: r.x, y, w: cardsW, h: ch };
      card(S, rc, { tone: 'ink', fill: p.surface });
      const x = rc.x + 10 * u, tw = rc.w - 20 * u - lw;
      d.text(S.l('indicación', 'prompt'), x, rc.y + 9 * u, { size: ts, weight: 800, color: st_.ink, base: 'top' });
      para(S, e.q, x + lw, rc.y + 7 * u, tw, bs, { weight: 700, maxLines: 1 });
      d.text(S.l('respuesta ideal', 'ideal answer'), x, rc.y + 9 * u + lineH + 2 * u, { size: ts, weight: 800, color: dt.ink, base: 'top' });
      para(S, e.a, x + lw, rc.y + 7 * u + lineH + 2 * u, tw, bs, { weight: 500, maxLines: 2, lh: 1.25 });
    });
  });
  // el modelo que se ajusta
  const aM = S.reveal('sft-idea', 2.2, 0.6);
  d.withAlpha(aM, () => {
    const modelR: Rect = port ? { x: r.x + (r.w - modelW) / 2, y: y0 + blockH + 34 * u, w: modelW, h: modelH } : { x: r.x + r.w - modelW, y: y0 + pH + (3 * ch + 2 * gap - modelH) / 2, w: modelW, h: modelH };
    card(S, modelR, { tone: 'lat', fill: alpha(lt.c, 0.1), lw: 2 });
    fitText(S, S.l('Modelo base', 'Base model'), modelR.x + modelR.w / 2, modelR.y + modelR.h * 0.36, modelR.w - 12 * u, 18, { weight: 800, color: lt.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('se ajusta con ellos', 'tuned on them'), modelR.x + modelR.w / 2, modelR.y + modelR.h * 0.72, modelR.w - 12 * u, 14, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
    if (port) d.arrow(modelR.x + modelR.w / 2, y0 + blockH + 4 * u, modelR.x + modelR.w / 2, modelR.y - 3 * u, p.ink, 2.5, 10);
    else d.arrow(r.x + cardsW + 6 * u, modelR.y + modelR.h / 2, modelR.x - 6 * u, modelR.y + modelR.h / 2, p.ink, 2.5, 10);
  });
}

// ── la máscara de pérdida: el error solo cuenta sobre la respuesta ──
function drawHow(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u), cmp = isCompact(S);
  const es = S.lang === 'es', pe = es ? ['¿Cuántos', 'días', 'tiene', 'febrero', '?'] : ['How', 'many', 'days', 'does', 'February', 'have', '?'];
  const re = es ? ['28', ',', 'o', '29', 'en', 'año', 'bisiesto', '.'] : ['28', ',', 'or', '29', 'in', 'a', 'leap', 'year', '.'];
  const mt = tone(S, 'mute'), lt = tone(S, 'lat'), et = tone(S, 'err');
  const ts = FS(S, cmp ? 15 : 19), th = (cmp ? 30 : 40);
  let y = r.y + (cmp ? 4 * u : Math.max(6 * u, (r.h - 280 * u) / 2));
  const aP = S.reveal('sft-how', 0, 0.5);
  d.withAlpha(aP, () => {
    fitText(S, S.l('indicación: no cuenta para el error', 'prompt: does not count toward the error'), r.x, y, r.w, 14, { weight: 800, color: mt.ink, base: 'top' });
    y += 22 * u;
    const rows = tokenRow(S, r.x, y, r.w, pe, { tone: 'mute', size: ts, h: th, gap: 6 });
    y = Math.max(...rows.map((b) => b.y + b.h)) + 18 * u;
  });
  const nShow = S.on('sft-how') ? S.at('sft-how', 0.6, 2.4, 'lin') * re.length : 0;
  let rowsR: Rect[] = [];
  if (S.on('sft-how')) {
    d.text(S.l('respuesta: aquí se mide el error', 'answer: this is where the error is measured'), r.x, y, { size: FS(S, 14), weight: 800, color: lt.ink, base: 'top', a: S.reveal('sft-how', 0.5, 0.4) });
    y += 22 * u;
    rowsR = tokenRow(S, r.x, y, r.w, re, { tone: 'lat', size: ts, h: th, gap: 6, show: nShow });
    // marcas de error bajo cada token de la respuesta (la altura es ilustrativa)
    rowsR.forEach((b, i) => {
      const a = clamp(nShow - i - 0.3); if (a <= 0) return;
      const hh = (8 + 14 * ((i * 37) % 7) / 6) * u * a;
      d.rect(b.x + b.w / 2 - 4 * u, b.y + b.h + 6 * u, 8 * u, hh, { fill: et.c });
    });
    const yb = Math.max(...rowsR.map((b) => b.y + b.h)) + 6 * u + 22 * u;
    d.withAlpha(S.reveal('sft-how', 2.6, 0.5), () => para(S, S.l('barra magenta = el error de predecir cada token (altura ilustrativa)', 'magenta bar = the error of predicting each token (height is illustrative)'), r.x, yb + 6 * u, r.w, FS(S, 12), { color: et.ink, weight: 600, maxLines: 2 }));
  }
  d.withAlpha(S.reveal('sft-how', 0.2, 0.5), () => para(S, S.l('un token por palabra, simplificado', 'one token per word, simplified'), r.x, r.y + r.h - 18 * u, r.w, FS(S, 12), { color: p.mute, weight: 600 }));
}

// ── una capa pequeña sobre una base enorme ──
function drawScale(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u), port = S.portrait, cmp = isCompact(S);
  const lt = tone(S, 'lat'), wt = tone(S, 'w');
  const W = Math.min(r.w, 640 * u), X = r.x + (r.w - W) / 2, H = Math.min(r.h - 56 * u, 330 * u), Y = r.y + Math.max(6 * u, (r.h - 56 * u - H) / 2);
  const slabH = Math.max(52 * u, H * 0.22), baseH = H - slabH - 10 * u;
  const aB = S.reveal('sft-scale', 0, 0.7), aS = S.reveal('sft-scale', 1.2, 0.7);
  d.withAlpha(aB, () => {
    const rc: Rect = { x: X, y: Y + slabH + 10 * u, w: W, h: baseH };
    card(S, rc, { tone: 'lat', fill: alpha(lt.c, 0.12), lw: 2 });
    fitText(S, S.l('Preentrenamiento', 'Pretraining'), rc.x + 14 * u, rc.y + 12 * u, rc.w - 28 * u, port ? 22 : 26, { weight: 800, color: lt.ink, base: 'top' });
    fitText(S, S.l('300 000 000 000 tokens (GPT-3)', '300,000,000,000 tokens (GPT-3)'), rc.x + 14 * u, rc.y + 12 * u + (port ? 32 : 40) * u, rc.w - 28 * u, port ? 17 : 21, { weight: 700, font: 'mono', color: p.ink, base: 'top' });
    if (!cmp) para(S, S.l('el conocimiento: lenguaje, hechos, estilos', 'the knowledge: language, facts, styles'), rc.x + 14 * u, rc.y + rc.h - 34 * u, rc.w - 28 * u, FS(S, 16), { weight: 600, color: p.ink2, maxLines: 1 });
  });
  d.withAlpha(aS, () => {
    const rc: Rect = { x: X, y: Y, w: W, h: slabH };
    card(S, rc, { tone: 'w', fill: alpha(wt.c, 0.2), lw: 2 });
    fitText(S, S.l('Ajuste con instrucciones', 'Instruction tuning'), rc.x + 12 * u, rc.y + 10 * u, rc.w - 24 * u, 19, { weight: 800, color: wt.ink, base: 'top' });
    fitText(S, S.l('≈ 13 000 ejemplos · ≈ 40 personas (InstructGPT)', '≈ 13,000 examples · ≈ 40 people (InstructGPT)'), rc.x + 12 * u, rc.y + rc.h - 10 * u, rc.w - 24 * u, 16, { weight: 600, color: p.ink, base: 'bottom' });
  });
  d.withAlpha(S.reveal('sft-scale', 2.2, 0.5), () => para(S, S.l('Alturas no a escala: las unidades son distintas (tokens frente a ejemplos).', 'Heights not to scale: the units differ (tokens versus examples).'), r.x, r.y + r.h - 34 * u, r.w, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
}

// ── turno: la misma indicación, un modelo base y su asistente (salidas reales) ──
const GLOSS: string[] = ['¿Cuál es la capital de Francia?', 'Explica en una frase qué es la inflación.', 'Escribe un correo de dos líneas para pedir una reunión.', 'Dame tres consejos para dormir mejor.'];

function drawCompare(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 12 * u), port = S.portrait, cmp = isCompact(S);
  const s = st(S), q = clamp(Math.round(Number(S.p.q ?? 1)), 0, SAMPLES.length - 1), sample = SAMPLES[q];
  const lt = tone(S, 'lat'), dt = tone(S, 'dat'), gt = tone(S, 'sig');
  // el texto se «escribe» al elegir una indicación (S.clock sigue corriendo durante el turno)
  const t = s.qClock !== undefined ? S.clock - s.qClock : S.since('compare-intro') - 0.4;
  const speed = 110;
  // indicación (arriba)
  const hasGloss = S.lang === 'es';
  const ph = (hasGloss ? 54 : 38) * u;
  const pr: Rect = { x: r.x, y: r.y, w: r.w, h: ph };
  d.withAlpha(S.reveal('compare-intro', 0, 0.5), () => {
    card(S, pr, { tone: 'sig', fill: alpha(gt.c, 0.08) });
    d.text(S.l('indicación', 'prompt'), pr.x + 10 * u, pr.y + 8 * u, { size: FS(S, 12), weight: 800, color: gt.ink, base: 'top' });
    fitText(S, sample.prompt, pr.x + 10 * u + d.measure(S.l('indicación', 'prompt'), { size: FS(S, 12), weight: 800 }) + 10 * u, pr.y + 7 * u, pr.w - 110 * u, 16, { weight: 700, base: 'top' });
    if (hasGloss) fitText(S, '(' + GLOSS[q] + ')', pr.x + 10 * u, pr.y + ph - 10 * u, pr.w - 20 * u, 13, { weight: 600, color: p.mute, base: 'bottom' });
  });
  const gap = 10 * u, foot = (cmp ? 30 : 36) * u, top = pr.y + ph + 12 * u, avail = r.y + r.h - top - foot;
  const A: Rect = port ? { x: r.x, y: top, w: r.w, h: (avail - gap) / 2 } : { x: r.x, y: top, w: (r.w - gap) / 2, h: avail };
  const B: Rect = port ? { x: r.x, y: top + (avail - gap) / 2 + gap, w: r.w, h: (avail - gap) / 2 } : { x: r.x + (r.w - gap) / 2 + gap, y: top, w: (r.w - gap) / 2, h: avail };
  const size = FS(S, port || cmp ? 14 : 17), lh = 1.3 * size * u, pad = 12 * u;
  // izquierda: documento del modelo base
  const aA = S.reveal('compare-intro', 0.4, 0.5), aB = S.reveal('compare-intro', 0.9, 0.5);
  const textRows = (R: Rect) => Math.max(2, Math.floor((R.h - 26 * u - pad) / lh));
  d.withAlpha(aA, () => {
    card(S, A, { tone: 'lat', fill: alpha(lt.c, 0.05) });
    tab(S, S.l('Modelo base', 'Base model'), A.x + 10 * u, A.y, { t: 'lat', align: 'left' });
    const ls = docLines(S, sample.prompt, sample.base, sample.baseCut, A.w - 2 * pad, size, textRows(A));
    const total = ls.reduce((a, l) => a + l.text.length + 1, 0);
    const [cx, cy] = drawDoc(S, ls, A.x + pad, A.y + 22 * u, size, clamp(t, 0, 99) * speed, { lh: 1.3 });
    if (clamp(t, 0, 99) * speed < total + 4) cursor(S, cx, cy, size, 'lat');
  });
  // derecha: el asistente
  d.withAlpha(aB, () => {
    card(S, B, { tone: 'dat', fill: alpha(dt.c, 0.06) });
    tab(S, S.l('Asistente · mismo modelo, ajustado', 'Assistant · same model, tuned'), B.x + 10 * u, B.y, { t: 'dat', align: 'left' });
    const parts = sample.chat.split('\n').map((x) => x.trim()).filter((x) => x.length > 0);
    const ls: string[] = [];
    parts.forEach((part, i) => lines(S, part + (sample.chatCut && i === parts.length - 1 ? '…' : ''), B.w - 2 * pad, size).forEach((l) => ls.push(l)));
    const maxL = textRows(B);
    let shown = ls;
    if (ls.length > maxL) { shown = ls.slice(0, maxL); let last = shown[maxL - 1]; while (last.length > 1 && d.measure(last + '…', { size, weight: 500 }) > B.w - 2 * pad) last = last.slice(0, -1); shown[maxL - 1] = last.replace(/[\s,;.…]+$/, '') + '…'; }
    let left = clamp(t - 0.3, 0, 99) * speed, cx = B.x + pad, cy = B.y + 22 * u;
    const total = shown.reduce((a, l) => a + l.length + 1, 0);
    shown.forEach((ln, i) => {
      if (left <= 0) return;
      const vis = left >= ln.length ? ln : ln.slice(0, Math.max(0, Math.floor(left))); left -= ln.length + 1;
      d.text(vis, B.x + pad, B.y + 22 * u + i * lh, { size, weight: 500, color: dt.ink, base: 'top' });
      cx = B.x + pad + d.measure(vis, { size, weight: 500 }); cy = B.y + 22 * u + i * lh;
    });
    if (clamp(t - 0.3, 0, 99) * speed < total + 4) cursor(S, cx, cy, size, 'dat');
  });
  d.withAlpha(S.reveal('compare-intro', 1.2, 0.5), () => para(S, S.l('Salidas reales de TinyLlama 1.1B, sin retoques; el asistente se ajustó con diálogos y luego con DPO. Modelo entrenado sobre todo en inglés.', 'Real outputs of TinyLlama 1.1B, unedited; the assistant was tuned on dialogues and then with DPO. A model trained mostly in English.'), r.x, r.y + r.h - foot + 6 * u, r.w, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
}

// ── el límite de imitar: escribir cuesta, comparar es fácil ──
function drawLimit(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u), port = S.portrait, cmp = isCompact(S);
  const et = tone(S, 'err'), dt = tone(S, 'dat');
  const gap = 12 * u, cw = port ? r.w : (r.w - gap) / 2, ch = port ? (r.h - gap - 24 * u) / 2 : Math.min(r.h - 24 * u, 300 * u);
  const L: Rect = { x: r.x, y: r.y + (port ? 0 : (r.h - ch - 24 * u) / 2), w: cw, h: ch };
  const R: Rect = port ? { x: r.x, y: L.y + ch + gap, w: cw, h: ch } : { x: r.x + cw + gap, y: L.y, w: cw, h: ch };
  const aL = S.reveal('sft-limit', 0, 0.6), aR = S.reveal('sft-limit', 1.6, 0.6);
  const bar = (rc: Rect, k: number, t: 'err' | 'dat', label: string) => {
    const bx = rc.x + 14 * u, bw = rc.w - 28 * u, by = rc.y + rc.h - 22 * u, c = tone(S, t);
    d.text(label, bx, by - 14 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
    d.rect(bx, by - 10 * u, bw, 10 * u, { fill: p.surface2 });
    d.rect(bx, by - 10 * u, bw * k, 10 * u, { fill: c.c });
  };
  const eff = S.l('esfuerzo (ilustrativo)', 'effort (illustrative)');
  d.withAlpha(aL, () => {
    card(S, L, { tone: 'ink', fill: p.surface });
    fitText(S, S.l('Escribir la respuesta ideal', 'Write the ideal answer'), L.x + 14 * u, L.y + 12 * u, L.w - 28 * u, 17, { weight: 800, base: 'top' });
    // líneas de texto que se «escriben»
    const nl = cmp ? 2 : 4;
    for (let i = 0; i < nl; i++) { const k = clamp(S.at('sft-limit', 0.4 + i * 0.35, 0.9 + i * 0.35, 'lin')); const w = (L.w - 28 * u) * (i === nl - 1 ? 0.55 : 1) * k; d.rect(L.x + 14 * u, L.y + 46 * u + i * 16 * u, w, 7 * u, { fill: alpha(p.ink, 0.28) }); }
    bar(L, S.at('sft-limit', 0.5, 1.6, 'out') * 0.92, 'err', eff);
  });
  d.withAlpha(aR, () => {
    card(S, R, { tone: 'ink', fill: p.surface });
    fitText(S, S.l('Elegir entre dos respuestas', 'Choose between two answers'), R.x + 14 * u, R.y + 12 * u, R.w - 28 * u, 17, { weight: 800, base: 'top' });
    const mw = (R.w - 28 * u - 14 * u) / 2, mh = cmp ? 34 * u : 48 * u, my = R.y + 46 * u;
    [0, 1].forEach((i) => {
      const x = R.x + 14 * u + i * (mw + 14 * u);
      card(S, { x, y: my, w: mw, h: mh }, { tone: i === 1 ? 'dat' : 'ink', fill: i === 1 ? alpha(dt.c, 0.1) : p.surface });
      d.text(i === 0 ? 'A' : 'B', x + 10 * u, my + mh / 2, { size: FS(S, 16), weight: 800, color: i === 1 ? dt.ink : p.ink2, base: 'middle' });
      mark(S, i === 1 ? 'yes' : 'no', x + mw - 16 * u, my + mh / 2, 8 * u, S.reveal('sft-limit', 2.4, 0.4));
    });
    bar(R, S.at('sft-limit', 2.2, 2.6, 'out') * 0.18, 'dat', eff);
  });
  d.withAlpha(S.reveal('sft-limit', 2.8, 0.5), () => para(S, S.l('Y quien imita, a lo sumo, iguala al autor del ejemplo.', 'And whoever imitates can at best match the author of the example.'), r.x, r.y + r.h - 20 * u, r.w, FS(S, 14), { weight: 700, color: p.ink2, align: 'center', maxLines: 1 }));
  void link; void glyph; void smooth; void paraH; void arrowLabel;
}
