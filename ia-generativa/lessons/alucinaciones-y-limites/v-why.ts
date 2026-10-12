// Vista 3 · por qué ocurre (objective, rare, exam, snowball).
//  · objective: ILUSTRATIVO. Dos textos de entrenamiento, uno con un error: en ambos gana puntos la pieza que coincide con el texto.
//  · rare: ILUSTRATIVO (curva y cantidades inventadas); la tendencia la midieron Kandpal et al. (2023).
//  · exam: aritmética de un examen de cuatro opciones (Kalai et al., 2025: las evaluaciones binarias premian adivinar).
//  · snowball: continuación REAL de Pythia-1.4B, voraz (real-data.ts, SNOW). La novela es de 1955 (El Colegio de México) y no es poesía.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SNOW } from './real-data';
import { FS, LH, area, card, chip, chipH, fitText, fr, mark, para, paraH, smooth, tight } from './ui';

export function drawWhy(S: Frame) {
  const A = area(S);
  const parts: [string, string | undefined, (S: Frame, A: Rect) => void][] = [
    ['objective', 'rare', drawObjective], ['rare', 'exam', drawRare], ['exam', 'snowball', drawExam], ['snowball', undefined, drawSnow],
  ];
  for (const [from, to, fn] of parts) {
    if (!S.on(from)) continue;
    const a = smooth(fr(S, from, 0, 0.08)) * (to ? 1 - smooth(fr(S, to, 0, 0.08)) : 1);
    if (a > 0.01) S.d.withAlpha(a, () => fn(S, A));
  }
}

/** Gana puntos lo que coincide con el texto. Si el texto se equivoca, se premia el error igual. */
function drawObjective(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const sz = FS(S, 15), gap = 12 * u;
  const rowsData = [
    { txt: S.l('«…la capital de Australia es', '“…the capital of Australia is'), word: 'Canberra', truth: true, at: 0.1 },
    { txt: S.l('«…la capital de Australia es', '“…the capital of Australia is'), word: S.l('Sídney', 'Sydney'), truth: false, at: 0.42 },
  ];
  const head = fr(S, 'objective', 0.03, 0.12);
  // encabezados de columna (horizontal) o rótulos en línea (vertical)
  const colW = vert ? A.w : A.w / 3;
  const rh = vert ? Math.min((A.h - 40 * u) / 2, 190 * u) : Math.min(A.h * 0.36, 130 * u);
  const y0 = A.y + (vert ? 4 * u : 30 * u);
  if (!vert) d.withAlpha(head, () => {
    fitText(S, S.l('texto de entrenamiento', 'training text'), A.x, A.y + 10 * u, colW - 10 * u, 13, { weight: 800, color: p.mute });
    fitText(S, S.l('¿coincide con el texto?', 'does it match the text?'), A.x + colW, A.y + 10 * u, colW - 10 * u, 13, { weight: 800, color: p.mute });
    fitText(S, S.l('¿es verdad?', 'is it true?'), A.x + 2 * colW, A.y + 10 * u, colW - 10 * u, 13, { weight: 800, color: p.mute });
  });
  rowsData.forEach((r, i) => {
    const a = fr(S, 'objective', r.at, r.at + 0.1), b = fr(S, 'objective', r.at + 0.12, r.at + 0.22), c = fr(S, 'objective', 0.72, 0.84);
    const y = y0 + i * (rh + gap);
    const box: Rect = vert ? { x: A.x, y, w: A.w, h: rh } : { x: A.x, y, w: A.w, h: rh };
    d.withAlpha(a, () => {
      card(S, box, { fill: p.surface });
      const tx = box.x + 12 * u, tw = vert ? box.w - 24 * u : colW - 24 * u;
      fitText(S, i === 0 ? S.l('Un texto correcto', 'A correct text') : S.l('Un texto con un error', 'A text with an error'), tx, box.y + 16 * u, tw, 12, { weight: 700, color: i === 0 ? tone(S, 'dat').ink : tone(S, 'err').ink });
      const ty = box.y + 16 * u + LH(S, FS(S, 12), 1.1);
      const h = para(S, r.txt, tx, ty, tw, sz, { weight: 600, maxLines: 2 });
      const wy = ty + h + 2 * u;
      chip(S, `${r.word}»`.replace('»', S.lang === 'es' ? '»' : '”'), tx, wy + chipH(S, 15) / 2, 'lat', { align: 'left', size: 15, a: b });
    });
    // columna 2: coincide → +1 punto
    const c2x = vert ? A.x + 12 * u : A.x + colW + 6 * u, c2y = vert ? box.y + rh - 56 * u : box.y + rh / 2;
    d.withAlpha(b, () => {
      mark(S, c2x + 8 * u, c2y, true, 7);
      fitText(S, S.l('coincide: +1 punto', 'matches: +1 point'), c2x + 24 * u, c2y, (vert ? A.w : colW) - 40 * u, 15, { weight: 800, color: tone(S, 'dat').ink });
    });
    // columna 3: ¿verdad? — no se mide
    const c3x = vert ? A.x + 12 * u : A.x + 2 * colW + 6 * u, c3y = vert ? box.y + rh - 24 * u : c2y;
    d.withAlpha(c, () => {
      d.rect(c3x, c3y - 13 * u, (vert ? A.w - 24 * u : colW - 18 * u), 26 * u, { stroke: p.lineStrong, lw: 1.4, dash: [4, 3], r: 3 });
      fitText(S, vert ? S.l('¿es verdad? no se mide', 'true? not measured') : S.l('no se mide', 'not measured'), c3x + 10 * u, c3y, (vert ? A.w - 44 * u : colW - 38 * u), 14, { weight: 700, color: p.mute });
    });
  });
  const fy = y0 + 2 * (rh + gap);
  if (fy + 20 * u < A.y + A.h) d.withAlpha(fr(S, 'objective', 0.82, 0.92), () => para(S, S.l('Ilustrativo: así se califica cada pieza al entrenar.', 'Illustrative: this is how each piece is scored in training.'), A.x, fy, A.w, FS(S, 12), { color: p.mute, italic: true, maxLines: 2 }));
  void alpha; void clamp;
}

/** Más documentos que hablan de un dato → más aciertos (curva ilustrativa). */
function drawRare(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const ax = fr(S, 'rare', 0.12, 0.25), curve = fr(S, 'rare', 0.35, 0.75, 'lin'), lab = fr(S, 'rare', 0.7, 0.85);
  const padL = 34 * u, padB = (tight(S) ? 44 : 56) * u, top = 46 * u;
  const pr: Rect = { x: A.x + padL, y: A.y + top, w: A.w - padL - 10 * u, h: A.h - top - padB };
  d.withAlpha(fr(S, 'rare', 0.02, 0.12), () => para(S, S.l('Un modelo acierta más cuantos más documentos hablan del dato', 'A model is right more often the more documents talk about the fact'), A.x, A.y, A.w, FS(S, 14), { weight: 800, maxLines: 2 }));
  d.withAlpha(ax, () => {
    d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5);
    d.line(pr.x, pr.y, pr.x, pr.y + pr.h, p.lineStrong, 1.5);
    fitText(S, S.l('aciertos', 'right answers'), pr.x + 6 * u, pr.y + 4 * u, pr.w * 0.5, 12.5, { weight: 700, color: p.ink2, base: 'top' });
    fitText(S, S.l('documentos de entrenamiento sobre el dato →', 'training documents about the fact →'), pr.x + pr.w, pr.y + pr.h + 34 * u, pr.w, 12.5, { weight: 700, color: p.ink2, align: 'right' });
    // pilas de documentos: pocos a la izquierda, muchos a la derecha
    const stack = (x: number, n: number) => { for (let i = 0; i < n; i++) { const yy = pr.y + pr.h + 8 * u + 0, xx = x + i * 5 * u; d.rect(xx, yy, 10 * u, 13 * u, { fill: p.surface, stroke: tone(S, 'dat').c, lw: 1 }); } };
    stack(pr.x + 8 * u, 1); stack(pr.x + pr.w * 0.45, 4); stack(pr.x + pr.w - 70 * u, 12);
  });
  // curva creciente (ilustrativa)
  const f = (x: number) => 0.06 + 0.86 / (1 + Math.exp(-7 * (x - 0.45)));
  const pts: [number, number][] = [];
  const n = 60, m = Math.max(2, Math.round(n * curve));
  for (let i = 0; i <= m; i++) { const x = i / n; pts.push([pr.x + x * pr.w, pr.y + pr.h - f(x) * pr.h]); }
  if (curve > 0.01) d.polyline(pts, tone(S, 'dat').c, 3, { dash: [7, 4] });
  d.withAlpha(lab, () => {
    chip(S, S.l('dato raro: adivina', 'rare fact: guesses'), pr.x + 10 * u, pr.y + pr.h - f(0.08) * pr.h - 30 * u, 'err', { align: 'left', size: 12.5, maxW: pr.w * 0.62 });
    chip(S, S.l('dato frecuente: acierta', 'common fact: right'), pr.x + pr.w, pr.y + pr.h - f(0.95) * pr.h + 30 * u, 'dat', { align: 'right', size: 12.5, maxW: pr.w * 0.62 });
  });
}

/** Un examen donde dejar en blanco vale cero: adivinar siempre conviene. */
function drawExam(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const sheet = fr(S, 'exam', 0.05, 0.18), left = fr(S, 'exam', 0.25, 0.38), right = fr(S, 'exam', 0.42, 0.55), win = fr(S, 'exam', 0.68, 0.8);
  const sw = vert ? A.w : Math.min(A.w * 0.42, 340 * u), sh = vert ? Math.min(A.h * 0.46, 220 * u) : Math.min(A.h, 280 * u);
  const sr: Rect = { x: A.x, y: A.y + (vert ? 0 : (A.h - sh) / 2), w: sw, h: sh };
  const sz = FS(S, 14);
  d.withAlpha(sheet, () => {
    card(S, sr, { fill: p.surface });
    const pad = 12 * u;
    fitText(S, S.l('Examen · pregunta 7', 'Exam · question 7'), sr.x + pad, sr.y + pad + 6 * u, sr.w - 2 * pad, 12.5, { weight: 700, color: p.mute });
    fitText(S, S.l('acierto: 1 punto · en blanco: 0', 'right: 1 point · blank: 0'), sr.x + pad, sr.y + pad + 6 * u + LH(S, FS(S, 12.5), 1.3), sr.w - 2 * pad, 12.5, { weight: 800, color: tone(S, 'w').ink });
    const qy = sr.y + pad + 12 * u + LH(S, FS(S, 12.5), 2.3);
    const qh = para(S, S.l('¿Quién escribió esta novela?', 'Who wrote this novel?'), sr.x + pad, qy, sr.w - 2 * pad, sz, { weight: 700, maxLines: 2 });
    const oy = qy + 6 * u + qh, oh = Math.min(28 * u, (sr.y + sr.h - pad - oy) / 4);
    ['A', 'B', 'C', 'D'].forEach((o, i) => {
      const y = oy + i * oh + oh / 2;
      d.rect(sr.x + pad, y - 7 * u, 14 * u, 14 * u, { stroke: p.lineStrong, lw: 1.4, r: 2 });
      fitText(S, `${o})  ${S.l('opción', 'option')} ${o}`, sr.x + pad + 22 * u, y, sr.w - 2 * pad - 22 * u, 13, { weight: 600, color: p.ink2 });
    });
  });
  // dos estrategias
  const cx = vert ? A.x : sr.x + sr.w + 18 * u, cw = vert ? A.w : A.x + A.w - cx;
  const cy = vert ? sr.y + sr.h + 12 * u : sr.y, ch = vert ? A.y + A.h - cy : sr.h;
  const half = (ch - 10 * u) / 2;
  const strat = (i: number, title: string, line: string, val: string, t: 'mute' | 'lat', a: number) => d.withAlpha(a, () => {
    const r: Rect = { x: cx, y: cy + i * (half + 10 * u), w: cw, h: half };
    card(S, r, { tone: t === 'mute' ? undefined : 'lat', hot: i === 1 ? 0.3 * win : 0 });
    const pad = 12 * u;
    fitText(S, title, r.x + pad, r.y + pad + 6 * u, r.w * 0.6, 14, { weight: 800 });
    if (r.h > 60 * u) para(S, line, r.x + pad, r.y + pad + 20 * u, r.w * 0.62 - pad, FS(S, 12.5), { color: p.ink2, maxLines: 2 });
    fitText(S, val, r.x + r.w - pad, r.y + r.h / 2, r.w * 0.36, 26, { weight: 800, font: 'mono', align: 'right', color: t === 'mute' ? p.ink2 : tone(S, 'lat').ink });
  });
  strat(0, S.l('Dejar en blanco', 'Leave it blank'), S.l('equivale a decir «no lo sé»', 'same as saying “I don’t know”'), '0', 'mute', left);
  strat(1, S.l('Adivinar', 'Guess'), S.l('acierta 1 de cada 4 veces: en promedio', 'right 1 time in 4: on average'), `+${S.n(0.25, 2)}`, 'lat', right);
  if (win > 0.01) chip(S, S.l('adivinar gana', 'guessing wins'), cx + cw - 12 * u, cy + half + 10 * u + 18 * u, 'lat', { align: 'right', a: win, solid: true, size: 13 });
}

/** Lo escrito se vuelve contexto: tras «Pablo Neruda», el modelo sigue con «una colección de poemas». */
function drawSnow(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const s = SNOW[0];
  const given = fr(S, 'snowball', 0.12, 0.25), typed = fr(S, 'snowball', 0.42, 0.78, 'lin'), hl = fr(S, 'snowball', 0.8, 0.9);
  const sz = FS(S, 15), pad = 12 * u;
  // frase dada (inglés, lo que leyó el modelo) y su traducción
  const pre = s.prefix, cont = s.cont.split('\n')[0].replace(/ and is considered.*$/, '…').trim();
  const prEs = '«Pedro Páramo es una novela de Pablo Neruda, publicada por primera vez en…»';
  const contEs = '«…español en 1947. Es una colección de poemas…»';
  const r1: Rect = { x: A.x, y: A.y, w: A.w, h: 0 };
  const h1 = paraH(S, pre, A.w - 2 * pad, sz, { font: 'mono' }) + 2 * pad + 18 * u;
  r1.h = h1;
  d.withAlpha(given, () => {
    card(S, r1, { dash: true });
    fitText(S, S.l('lo que ya está escrito', 'what is already written'), r1.x + pad, r1.y + pad + 4 * u, r1.w - 2 * pad, 12, { weight: 700, color: p.mute });
    para(S, pre, r1.x + pad, r1.y + pad + 16 * u, r1.w - 2 * pad, sz, { font: 'mono', weight: 600 });
  });
  const y2 = r1.y + r1.h + 14 * u;
  // continuación: aparece palabra por palabra; «1947» y «collection of poems» se marcan como falsos
  const words = cont.split(' ');
  const nShow = Math.round(words.length * typed);
  const shown = words.slice(0, nShow).join(' ');
  const h2 = paraH(S, cont, A.w - 2 * pad, sz, { font: 'mono' }) + 2 * pad + 18 * u;
  const r2: Rect = { x: A.x, y: y2, w: A.w, h: h2 };
  d.withAlpha(clamp(typed * 6), () => {
    card(S, r2, { tone: 'lat' });
    fitText(S, S.l('lo que escribe Pythia', 'what Pythia writes'), r2.x + pad, r2.y + pad + 4 * u, r2.w - 2 * pad, 12, { weight: 700, color: tone(S, 'lat').ink });
    // resaltes detrás del texto (se calculan sobre las líneas ya partidas)
    const ls = d.wrap(shown, r2.w - 2 * pad, { size: sz, weight: 600, font: 'mono' }), lh = LH(S, sz, 1.28);
    ls.forEach((ln, i) => {
      const y = r2.y + pad + 16 * u + i * lh;
      for (const bad of ['1947', 'a collection of poems']) {
        const k = ln.indexOf(bad);
        if (k >= 0 && hl > 0.01) {
          const x0 = d.measure(ln.slice(0, k), { size: sz, weight: 600, font: 'mono' }), w = d.measure(bad, { size: sz, weight: 600, font: 'mono' });
          d.rect(r2.x + pad + x0 - 2 * u, y, w + 4 * u, lh, { fill: alpha(tone(S, 'err').c, 0.18 * hl) });
          d.line(r2.x + pad + x0, y + lh - 1, r2.x + pad + x0 + w * hl, y + lh - 1, tone(S, 'err').c, 2);
        }
      }
      d.text(ln, r2.x + pad, y, { size: sz, weight: 600, font: 'mono', base: 'top' });
    });
  });
  // traducción y desenlace
  const y3 = r2.y + r2.h + 12 * u, room = A.y + A.h - y3, gs = FS(S, 13);
  let gy = y3;
  if (S.lang === 'es' && room > LH(S, gs, 2.4)) {
    const h1 = paraH(S, prEs, A.w, gs, { maxLines: 2 }), h2 = paraH(S, contEs, A.w, gs, { maxLines: 2 });
    para(S, prEs, A.x, gy, A.w, gs, { color: p.ink2, maxLines: 2, a: given });
    gy += h1 + 4 * u;
    if (room - h1 > h2 + chipH(S, 13)) { para(S, contEs, A.x, gy, A.w, gs, { color: tone(S, 'lat').ink, a: hl, maxLines: 2 }); gy += h2; }
  }
  const ty = gy + 8 * u + chipH(S, 13) / 2;
  if (hl > 0.01 && ty + chipH(S, 13) / 2 < A.y + A.h) chip(S, S.l('falso: es una novela de 1955', 'false: it is a novel from 1955'), A.x, ty, 'err', { align: 'left', a: hl, size: 13, maxW: A.w });
}
