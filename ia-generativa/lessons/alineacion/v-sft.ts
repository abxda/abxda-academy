// Paso uno: ajuste con instrucciones. Ejemplos escritos por personas, el mismo entrenamiento de siempre, el nombre del paso,
// cuántos datos usó InstructGPT frente al preentrenamiento de GPT-3, y por qué comparar es más fácil que escribir.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, area, card, chip, fitText, fr, growArrow, mark, para, person, stepChip, tight } from './ui';

export const examples = (S: Frame) => [
  { q: S.l('¿Cuántos días tiene febrero?', 'How many days does February have?'), a: S.l('28, o 29 en año bisiesto.', '28, or 29 in a leap year.') },
  { q: S.l('Di «gracias» en inglés.', 'Say “thank you” in Spanish.'), a: S.l('Thank you.', 'Gracias.') },
  { q: S.l('¿Cuánto es 7 × 8?', 'What is 7 × 8?'), a: S.l('56.', '56.') },
];

// ── ejemplos → el modelo se ajusta → «ajuste con instrucciones» ──
export function drawSft(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const sig = tone(S, 'sig'), dt = tone(S, 'dat'), lt = tone(S, 'lat'), wt = tone(S, 'w');
  const chipH = stepChip(S, r, 1, S.l('ejemplos', 'examples'), fr(S, 'sft-examples', 0, 0.08));
  const top = r.y + chipH + (cmp ? 6 : 10) * u;
  const ex = examples(S);
  const bs = FS(S, cmp ? 13 : 15), ts = FS(S, 12), lineH = 1.25 * bs * u;
  const labW = Math.max(d.measure(S.l('indicación', 'prompt'), { size: ts, weight: 800 }), d.measure(S.l('respuesta ideal', 'ideal answer'), { size: ts, weight: 800 })) + 12 * u;
  const gap = (cmp ? 6 : 8) * u, ch = 14 * u + 2 * lineH + 4 * u;
  const modelW = port ? r.w * 0.7 : r.w * 0.27, modelH = port ? (cmp ? 52 : 64) * u : Math.min(140 * u, r.h * 0.42);
  const cardsW = port ? r.w : r.w - modelW - 60 * u;
  const pc = Math.max(1.6, (cmp ? 1.8 : 2.4) * u), pH = 9 * pc + 6 * u;
  const blockH = pH + 3 * ch + 2 * gap;
  const avail = r.y + r.h - top;
  const y0 = top + Math.max(0, (avail - blockH - (port ? modelH + 34 * u + 30 * u : 0)) / (port ? 3 : 2));
  // quienes escriben
  d.withAlpha(fr(S, 'sft-examples', 0.06, 0.16), () => {
    for (let i = 0; i < 3; i++) person(S, r.x + i * 7 * pc, y0, pc, 'ink');
    fitText(S, S.l('personas escriben ejemplos', 'people write examples'), r.x + 21 * pc + 8 * u, y0 + 4.5 * pc, cardsW - 21 * pc - 8 * u, 14, { weight: 700, color: p.ink2, base: 'middle' });
  });
  const at = [0.3, 0.84, 0.92];
  ex.forEach((e, i) => {
    const a = fr(S, 'sft-examples', at[i], at[i] + 0.08), y = y0 + pH + i * (ch + gap);
    const aAns = i === 0 ? fr(S, 'sft-examples', 0.62, 0.72) : a;
    d.withAlpha(a, () => {
      const rc: Rect = { x: r.x, y, w: cardsW, h: ch };
      card(S, rc, { tone: 'ink', fill: p.surface, hot: i === 0 && S.is('sft-examples') ? 0.3 : 0 });
      const x = rc.x + 10 * u, tw = rc.w - 20 * u - labW;
      d.text(S.l('indicación', 'prompt'), x, rc.y + 7 * u + (bs - ts) * u * 0.4, { size: ts, weight: 800, color: sig.ink, base: 'top' });
      fitText(S, e.q, x + labW, rc.y + 7 * u, tw, bs, { weight: 700, base: 'top' });
      d.withAlpha(aAns, () => {
        d.text(S.l('respuesta ideal', 'ideal answer'), x, rc.y + 7 * u + lineH + 2 * u + (bs - ts) * u * 0.4, { size: ts, weight: 800, color: dt.ink, base: 'top' });
        fitText(S, e.a, x + labW, rc.y + 7 * u + lineH + 2 * u, tw, bs, { weight: 500, color: dt.ink, base: 'top' });
      });
    });
  });
  // el modelo que se ajusta
  const M: Rect = port ? { x: r.x + (r.w - modelW) / 2, y: y0 + blockH + 34 * u, w: modelW, h: modelH } : { x: r.x + r.w - modelW, y: y0 + pH + (3 * ch + 2 * gap - modelH) / 2, w: modelW, h: modelH };
  const aM = fr(S, 'sft-same', 0.04, 0.14), kArr = fr(S, 'sft-same', 0.18, 0.34, 'io'), kTrain = fr(S, 'sft-same', 0.4, 0.8, 'io'), kTuned = fr(S, 'sft-same', 0.78, 0.9);
  d.withAlpha(aM, () => {
    card(S, M, { tone: kTuned > 0.5 ? 'w' : 'lat', fill: alpha((kTuned > 0.5 ? wt : lt).c, 0.1), lw: 2 });
    const t1 = S.l('Modelo base', 'Base model'), t2 = S.l('Modelo ajustado', 'Tuned model');
    const ty = M.y + M.h * (port ? 0.38 : 0.3);
    d.withAlpha(1 - kTuned, () => fitText(S, t1, M.x + M.w / 2, ty, M.w - 16 * u, 18, { weight: 800, color: lt.ink, align: 'center', base: 'middle' }));
    d.withAlpha(kTuned, () => fitText(S, t2, M.x + M.w / 2, ty, M.w - 16 * u, 18, { weight: 800, color: wt.ink, align: 'center', base: 'middle' }));
    // el error baja: el mismo entrenamiento de siempre
    if (!port || !cmp) {
      const bx = M.x + 14 * u, bw = M.w - 28 * u, by = M.y + M.h * (port ? 0.66 : 0.58), bh = 9 * u;
      d.withAlpha(fr(S, 'sft-same', 0.36, 0.46), () => {
        d.text(S.l('error', 'error'), bx, by - 4 * u, { size: FS(S, 12), weight: 700, color: tone(S, 'err').ink, base: 'bottom' });
        d.rect(bx, by, bw, bh, { fill: p.surface2 });
        d.rect(bx, by, bw * (0.92 - 0.72 * kTrain), bh, { fill: tone(S, 'err').c });
      });
    }
  });
  if (kArr > 0) {
    if (port) growArrow(S, M.x + M.w / 2, y0 + blockH + 4 * u, M.x + M.w / 2, M.y - 4 * u, kArr, p.ink, 2.6);
    else growArrow(S, r.x + cardsW + 8 * u, M.y + M.h / 2, M.x - 8 * u, M.y + M.h / 2, kArr, p.ink, 2.6);
  }
  // el nombre del paso y lo que cambia
  const aN = fr(S, 'sft-name', 0.04, 0.16);
  if (aN > 0) {
    const label = S.l('ajuste con instrucciones', 'instruction tuning');
    if (port) d.withAlpha(aN, () => { const x = M.x + M.w / 2 + 14 * u; chip(S, label, x, (y0 + blockH + M.y) / 2, 'w', { align: 'left', size: 14, maxW: r.x + r.w - x }); });
    else d.withAlpha(aN, () => chip(S, label, M.x + M.w / 2, M.y - 20 * u, 'w', { size: 14, maxW: modelW + 50 * u }));
    const aC = fr(S, 'sft-name', 0.5, 0.62);
    const ln1 = S.l('pregunta → la trata como petición', 'question → treated as a request');
    if (!port) d.withAlpha(aC, () => para(S, ln1, M.x, M.y + M.h + 10 * u, M.w, FS(S, 14), { weight: 700, color: wt.ink, align: 'center', maxLines: 3 }));
    else if (M.y + M.h + 22 * u < r.y + r.h + 18 * u) d.withAlpha(aC, () => fitText(S, ln1, r.x + r.w / 2, M.y + M.h + 12 * u, r.w, 14, { weight: 700, color: wt.ink, align: 'center', base: 'top' }));
  }
}

// ── pocos datos: una capa delgada sobre una base enorme ──
export function drawScale(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const lt = tone(S, 'lat'), wt = tone(S, 'w');
  const chipH = stepChip(S, r, 1, S.l('ejemplos', 'examples'));
  const W = Math.min(r.w, 680 * u), X = r.x + (r.w - W) / 2, top = r.y + chipH + 10 * u, H = r.y + r.h - top - (cmp ? 20 : 30) * u;
  const slabH = Math.max((cmp ? 50 : 62) * u, H * 0.26), baseH = H - slabH - 10 * u;
  const aS = fr(S, 'sft-scale', 0.08, 0.2), aB = fr(S, 'sft-scale', 0.6, 0.72);
  d.withAlpha(aS, () => {
    const rc: Rect = { x: X, y: top, w: W, h: slabH };
    card(S, rc, { tone: 'w', fill: alpha(wt.c, 0.18), lw: 2 });
    fitText(S, S.l('Ajuste con instrucciones · InstructGPT', 'Instruction tuning · InstructGPT'), rc.x + 12 * u, rc.y + 9 * u, rc.w - 24 * u, 17, { weight: 800, color: wt.ink, base: 'top' });
    fitText(S, S.l('≈ 13 000 indicaciones · ≈ 40 personas', '≈ 13,000 prompts · ≈ 40 people'), rc.x + 12 * u, rc.y + rc.h - 9 * u, rc.w - 24 * u, 17, { weight: 700, font: 'mono', color: p.ink, base: 'bottom' });
  });
  d.withAlpha(aB, () => {
    const rc: Rect = { x: X, y: top + slabH + 10 * u, w: W, h: baseH };
    card(S, rc, { tone: 'lat', fill: alpha(lt.c, 0.12), lw: 2 });
    fitText(S, S.l('Preentrenamiento · GPT-3, su base', 'Pretraining · GPT-3, its base'), rc.x + 12 * u, rc.y + 12 * u, rc.w - 24 * u, port ? 18 : 22, { weight: 800, color: lt.ink, base: 'top' });
    fitText(S, S.l('300 000 000 000 tokens', '300,000,000,000 tokens'), rc.x + 12 * u, rc.y + rc.h / 2 + 8 * u, rc.w - 24 * u, port ? 20 : 26, { weight: 800, font: 'mono', color: p.ink, base: 'middle' });
  });
  d.withAlpha(fr(S, 'sft-scale', 0.75, 0.85), () => para(S, S.l('Unidades distintas (indicaciones frente a tokens): las alturas no están a escala.', 'Different units (prompts versus tokens): heights are not to scale.'), X, r.y + r.h - (cmp ? 16 : 24) * u, W, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
}

// ── escribir cuesta; comparar es fácil ──
export function drawLimit(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const dt = tone(S, 'dat');
  const chipH = stepChip(S, r, 1, S.l('ejemplos', 'examples'));
  const top = r.y + chipH + 10 * u, H = r.y + r.h - top;
  const gap = 12 * u, cw = port ? r.w : (r.w - gap) / 2, ch = port ? (H - gap) / 2 : Math.min(H, 280 * u);
  const L: Rect = { x: r.x, y: top + (port ? 0 : (H - ch) / 2), w: cw, h: ch };
  const R: Rect = port ? { x: r.x, y: L.y + ch + gap, w: cw, h: ch } : { x: r.x + cw + gap, y: L.y, w: cw, h: ch };
  const bar = (rc: Rect, k: number, t: 'err' | 'dat') => {
    const bx = rc.x + 14 * u, bw = rc.w - 28 * u, by = rc.y + rc.h - 14 * u - 10 * u, c = tone(S, t);
    d.text(S.l('esfuerzo (ilustrativo)', 'effort (illustrative)'), bx, by - 4 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
    d.rect(bx, by, bw, 10 * u, { fill: p.surface2 });
    d.rect(bx, by, bw * clamp(k), 10 * u, { fill: c.c });
  };
  d.withAlpha(fr(S, 'sft-limit', 0.02, 0.12), () => {
    card(S, L, { tone: 'ink', fill: p.surface });
    fitText(S, S.l('Escribir la respuesta ideal', 'Write the ideal answer'), L.x + 14 * u, L.y + 12 * u, L.w - 28 * u, 17, { weight: 800, base: 'top' });
    const nl = cmp || port ? 3 : 4;
    for (let i = 0; i < nl; i++) { const k = fr(S, 'sft-limit', 0.06 + i * 0.07, 0.13 + i * 0.07, 'lin'); d.rect(L.x + 14 * u, L.y + 42 * u + i * 13 * u, (L.w - 28 * u) * (i === nl - 1 ? 0.55 : 1) * k, 6 * u, { fill: alpha(p.ink, 0.28) }); }
    const ny = L.y + 42 * u + nl * 13 * u + 6 * u;
    if (ny + 40 * u < L.y + L.h - 30 * u) d.withAlpha(fr(S, 'sft-limit', 0.3, 0.42), () => para(S, S.l('quien imita, a lo sumo, iguala al autor', 'an imitator can at best match the author'), L.x + 14 * u, ny, L.w - 28 * u, FS(S, 13), { weight: 700, color: p.ink2, maxLines: 2 }));
    bar(L, fr(S, 'sft-limit', 0.08, 0.4, 'out') * 0.92, 'err');
  });
  d.withAlpha(fr(S, 'sft-limit', 0.58, 0.68), () => {
    card(S, R, { tone: 'dat', fill: alpha(dt.c, 0.05) });
    fitText(S, S.l('Comparar dos respuestas', 'Compare two answers'), R.x + 14 * u, R.y + 12 * u, R.w - 28 * u, 17, { weight: 800, color: dt.ink, base: 'top' });
    const mw = (R.w - 28 * u - 14 * u) / 2, mh = Math.min(48 * u, R.h - 100 * u), my = R.y + 42 * u;
    if (mh > 18 * u) [0, 1].forEach((i) => {
      const x = R.x + 14 * u + i * (mw + 14 * u);
      card(S, { x, y: my, w: mw, h: mh }, { tone: i === 0 ? 'dat' : 'ink', fill: i === 0 ? alpha(dt.c, 0.12) : p.surface });
      d.text(i === 0 ? 'A' : 'B', x + 10 * u, my + mh / 2, { size: FS(S, 16), weight: 800, color: p.ink2, base: 'middle' });
      mark(S, i === 0 ? 'yes' : 'no', x + mw - 14 * u, my + mh / 2, 8 * u, fr(S, 'sft-limit', 0.78, 0.86));
    });
    bar(R, fr(S, 'sft-limit', 0.7, 0.85, 'out') * 0.15, 'dat');
  });
}
