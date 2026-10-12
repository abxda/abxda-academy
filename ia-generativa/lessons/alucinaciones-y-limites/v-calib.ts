// Vista 6 · confianza y calibración (conf … hidden).
//  · conf: la probabilidad conjunta de cada respuesta de Pythia-1.4B (real-data.ts).
//  · forecast: ejemplo del pronóstico del clima (ilustrativo: diez días con 70 % de lluvia, llueve en siete).
//  · calib-*: diagrama de fiabilidad REAL con las 424 preguntas de la lección, en cinco tramos de 20 % (stats.ts).
//  · confident-wrong: el error más seguro con respuesta de una persona conocida (The Thinker → Michelangelo, 0.72; es de Rodin).
//  · hidden: un chat no muestra la probabilidad; informe técnico de GPT-4 (OpenAI, 2023): la calibración bajó tras el ajuste.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CONFIDENT_WRONG, DIST, QA } from './real-data';
import { reliability } from './stats';
import { FS, LH, area, card, chip, chipH, fitText, fr, mark, para, paraH, pct, smooth, tight } from './ui';

const AUS = DIST[0], PAR = DIST[2];
const THINKER = CONFIDENT_WRONG.find((c) => c.q.includes('Thinker'))!;
const BINS = reliability(5);

export function drawCalib(S: Frame) {
  const A = area(S);
  const parts: [string, string | undefined, (S: Frame, A: Rect) => void][] = [
    ['conf', 'forecast', drawConf], ['forecast', 'calib-x', drawForecast], ['calib-x', 'hidden', drawPlot], ['hidden', undefined, drawHidden],
  ];
  for (const [from, to, fn] of parts) {
    if (!S.on(from)) continue;
    const a = smooth(fr(S, from, 0, 0.08)) * (to ? 1 - smooth(fr(S, to, 0, 0.08)) : 1);
    if (a > 0.01) S.d.withAlpha(a, () => fn(S, A));
  }
}

/** Confianza = probabilidad que el modelo dio a su propia respuesta. */
function drawConf(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const h0 = fr(S, 'conf', 0.05, 0.2);
  const hh = para(S, S.l('Confianza: la probabilidad que el modelo dio a su propia respuesta', 'Confidence: the probability the model gave its own answer'), A.x, A.y, A.w, FS(S, 15), { weight: 800, a: h0, maxLines: 3 });
  const rows = [{ ans: 'Canberra', c: AUS.p, ok: true, at: 0.35 }, { ans: 'Pablo Neruda', c: PAR.p, ok: false, at: 0.62 }];
  const rh = Math.min((A.y + A.h - (A.y + hh + 20 * u)) / 2, 100 * u), top = S.portrait ? A.y + hh + 20 * u : Math.max(A.y + hh + 20 * u, A.y + (A.h - 2 * rh) / 2);
  rows.forEach((r, i) => {
    const a = fr(S, 'conf', r.at, r.at + 0.12), y = top + i * rh;
    d.withAlpha(a, () => {
      fitText(S, r.ans, A.x, y + 14 * u, A.w * 0.6, S.portrait ? 20 : 24, { weight: 800 });
      mark(S, A.x + A.w - 10 * u, y + 14 * u, r.ok, 6.5);
      const my = y + 36 * u, mw = A.w - 80 * u, mh = 16 * u;
      d.rect(A.x, my, mw, mh, { fill: alpha(p.ink, 0.06), stroke: p.line, lw: 1, r: 2 });
      d.rect(A.x, my, mw * r.c * smooth(a), mh, { fill: tone(S, 'lat').c, r: 2 });
      fitText(S, pct(S, r.c, 0), A.x + A.w, my + mh / 2, 74 * u, 20, { weight: 800, font: 'mono', align: 'right', color: tone(S, 'lat').ink });
    });
  });
}

/** Un pronóstico calibrado: de diez días con 70 % de lluvia, llueve en siete. */
function drawForecast(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const h0 = fr(S, 'forecast', 0.04, 0.16);
  const hh = para(S, S.l('Pronóstico para cada uno de estos días: 70 % de lluvia', 'Forecast for each of these days: 70% chance of rain'), A.x, A.y, A.w, FS(S, 15), { weight: 800, a: h0, maxLines: 2 });
  const cols = vert ? 5 : 10, rows = vert ? 2 : 1, gap = 8 * u;
  const cw = Math.min((A.w - gap * (cols - 1)) / cols, 96 * u), ch = cw * 1.1;
  const gx = A.x + (A.w - (cols * cw + (cols - 1) * gap)) / 2, gy = S.portrait ? A.y + hh + 22 * u : Math.max(A.y + hh + 22 * u, A.y + (A.h - ch - 60 * u) / 2);
  const rainDays = new Set([0, 1, 3, 4, 6, 7, 9]);   // siete de diez (orden ilustrativo)
  for (let i = 0; i < 10; i++) {
    const c = i % cols, r = Math.floor(i / cols), x = gx + c * (cw + gap), y = gy + r * (ch + gap);
    const a = fr(S, 'forecast', 0.2 + i * 0.03, 0.26 + i * 0.03), res = fr(S, 'forecast', 0.5 + i * 0.025, 0.56 + i * 0.025);
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: ch }, { fill: p.surface });
      fitText(S, S.l(`día ${i + 1}`, `day ${i + 1}`), x + cw / 2, y + 11 * u, cw - 6 * u, 12, { weight: 600, color: p.mute, align: 'center' });
      const cx = x + cw / 2, cy = y + ch * 0.58, s = Math.min(cw, ch) * 0.2;
      if (res > 0.01) d.withAlpha(res, () => {
        if (rainDays.has(i)) {
          d.circle(cx - s * 0.6, cy - s * 0.2, s * 0.7, { fill: alpha(tone(S, 'lat').c, 0.35) });
          d.circle(cx + s * 0.4, cy - s * 0.35, s * 0.85, { fill: alpha(tone(S, 'lat').c, 0.35) });
          for (let k = -1; k <= 1; k++) d.line(cx + k * s * 0.7, cy + s * 0.6, cx + k * s * 0.7 - s * 0.25, cy + s * 1.25, tone(S, 'lat').c, 2);
        } else {
          d.circle(cx, cy, s * 0.6, { stroke: tone(S, 'w').c, lw: 2 });
          for (let k = 0; k < 8; k++) { const an = (k * Math.PI) / 4; d.line(cx + Math.cos(an) * s * 0.85, cy + Math.sin(an) * s * 0.85, cx + Math.cos(an) * s * 1.15, cy + Math.sin(an) * s * 1.15, tone(S, 'w').c, 1.6); }
        }
      });
    });
  }
  const ry = gy + rows * (ch + gap) + 12 * u, k = fr(S, 'forecast', 0.8, 0.9);
  if (ry + 30 * u < A.y + A.h) d.withAlpha(k, () => {
    const w = para(S, S.l('Llovió en 7 de 10: el pronóstico está calibrado.', 'It rained on 7 of 10: the forecast is calibrated.'), A.x, ry, A.w, FS(S, 15), { weight: 800, color: tone(S, 'dat').ink, align: 'center', maxLines: 2 });
    void w;
  });
  if (A.y + A.h - (ry + 40 * u) > 20 * u) para(S, S.l('Ilustrativo', 'Illustrative'), A.x, A.y + A.h - LH(S, FS(S, 12), 1.2), A.w, FS(S, 12), { color: p.mute, italic: true, align: 'center' });
}

/** Diagrama de fiabilidad de Pythia: confianza (a lo ancho) frente a qué parte acertó (hacia arriba). */
function drawPlot(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, small = tight(S);
  const padL = 36 * u, padB = (small ? 48 : 54) * u, padT = 26 * u;
  const pr: Rect = { x: A.x + padL, y: A.y + padT, w: A.w - padL - 8 * u, h: A.h - padT - padB };
  const X = (v: number) => pr.x + v * pr.w, Y = (v: number) => pr.y + pr.h - v * pr.h;
  const ax = fr(S, 'calib-x', 0.1, 0.3), ay = fr(S, 'calib-y', 0.05, 0.25), diag = fr(S, 'calib-y', 0.45, 0.7, 'lin');
  const ts = FS(S, 12);
  // eje horizontal: confianza, cinco grupos
  d.withAlpha(ax, () => {
    d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5);
    for (let i = 0; i <= 5; i++) {
      const x = X(i / 5);
      d.line(x, pr.y + pr.h, x, pr.y + pr.h + 4 * u, p.lineStrong, 1.5);
      d.text(String(i * 20), x, pr.y + pr.h + 6 * u, { size: ts, font: 'mono', color: p.mute, align: i === 0 ? 'left' : i === 5 ? 'right' : 'center', base: 'top' });
    }
    fitText(S, S.l('confianza del modelo en su respuesta (%) →', 'model’s confidence in its answer (%) →'), pr.x + pr.w, pr.y + pr.h + 8 * u + ts * u * 1.5, pr.w, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
    // cada pregunta, una marquita en su confianza (424)
    const strip = fr(S, 'calib-x', 0.3, 0.7, 'lin');
    const n = Math.round(QA.n * strip);
    for (let i = 0; i < n; i++) d.rect(X(QA.conf[i]) - 0.6, pr.y + pr.h - 9 * u, 1.2, 7 * u, { fill: alpha(tone(S, 'lat').c, 0.55) });
    // número de preguntas por grupo (hasta que crecen las columnas)
    const k = fr(S, 'calib-x', 0.65, 0.8) * (1 - fr(S, 'calib-bars', 0, 0.1));
    BINS.forEach((b, i) => fitText(S, S.d.measure(S.l(`${b.n} preguntas`, `${b.n} questions`), { size: FS(S, 12), weight: 700 }) < pr.w / 5 - 6 * u ? S.l(`${b.n} preguntas`, `${b.n} questions`) : String(b.n), X((i + 0.5) / 5), pr.y + pr.h - 22 * u, pr.w / 5 - 6 * u, 12, { weight: 700, color: tone(S, 'lat').ink, align: 'center', a: k }));
  });
  // eje vertical: qué parte acertó
  d.withAlpha(ay, () => {
    d.line(pr.x, pr.y, pr.x, pr.y + pr.h, p.lineStrong, 1.5);
    for (const v of [0, 0.5, 1]) { d.line(pr.x - 4 * u, Y(v), pr.x, Y(v), p.lineStrong, 1.5); d.text(String(v * 100), pr.x - 7 * u, Y(v), { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
    fitText(S, S.l('acertó (%)', 'right (%)'), pr.x - padL + 2 * u, pr.y - 14 * u, padL + 80 * u, 12.5, { weight: 700, color: p.ink2 });
  });
  // diagonal ideal
  if (diag > 0.01) {
    d.line(X(0), Y(0), X(diag), Y(diag), p.ink2, 1.8, [6, 5]);
    if (diag > 0.9) fitText(S, S.l('ideal: calibrado', 'ideal: calibrated'), X(0.62), Y(0.62) + 2 * u, pr.w * 0.36, 12.5, { weight: 700, color: p.ink2, base: 'top', halo: true });
  }
  // columnas (calib-bars), una por una
  const bw = pr.w / 5;
  BINS.forEach((b, i) => {
    const g = fr(S, 'calib-bars', 0.08 + i * 0.12, 0.2 + i * 0.12);
    if (g <= 0.01) return;
    const hot = S.on('calib-read') && (i === 1 || i === 2) ? fr(S, 'calib-read', 0.3, 0.45) * (1 - fr(S, 'confident-wrong', 0, 0.1)) : 0;
    const x = X(i / 5) + 5 * u, w = bw - 10 * u, h = pr.h * b.acc * smooth(g);
    d.rect(x, pr.y + pr.h - h, w, h, { fill: alpha(tone(S, 'dat').c, 0.35 + 0.35 * hot), stroke: tone(S, 'dat').c, lw: hot > 0.5 ? 2.2 : 1.2 });
    const ok = Math.round(b.acc * b.n);
    let lab = S.l(`${ok} de ${b.n}`, `${ok} of ${b.n}`);
    if (S.d.measure(lab, { size: FS(S, 12.5), weight: 800 }) > bw - 2 * u) lab = `${ok}/${b.n}`;
    fitText(S, lab, x + w / 2, pr.y + pr.h - h - 9 * u, bw - 2 * u, 12.5, { weight: 800, color: tone(S, 'dat').ink, align: 'center', a: clamp(g * 2 - 1), halo: true });
  });
  // lectura: en medio, acierta más de lo que dice
  const rd = fr(S, 'calib-read', 0.4, 0.55) * (1 - fr(S, 'confident-wrong', 0, 0.1));
  if (rd > 0.01) {
    const b = BINS[1], x = X(0.3), y1 = Y(0.3), y2 = Y(b.acc);
    d.withAlpha(rd, () => {
      d.arrow(x, y1 - 2 * u, x, y2 + 4 * u, tone(S, 'sig').c, 2, 7 * u);
      chip(S, S.l('acierta más de lo que dice', 'right more often than it says'), Math.min(X(0.05), x), Math.max(pr.y + 12 * u, y2 - 28 * u), 'sig', { align: 'left', size: 12.5, maxW: pr.w * 0.7 });
    });
  }
  // el error muy seguro: El pensador
  const cw = fr(S, 'confident-wrong', 0.15, 0.3);
  if (cw > 0.01) {
    const x = X(THINKER.p), y = Y(0.0) - 2 * u;
    d.withAlpha(cw, () => {
      d.circle(x, y - 4 * u, 5 * u, { fill: tone(S, 'err').c, stroke: p.stage, lw: 1.5 });
      const lines2 = [S.l('¿Quién esculpió El pensador?', 'Who sculpted The Thinker?'), S.l(`«Miguel Ángel» · ${pct(S, THINKER.p, 0)}`, `“Michelangelo” · ${pct(S, THINKER.p, 0)}`), S.l('es de Auguste Rodin', 'it is by Auguste Rodin')];
      const bwid = Math.min(pr.w * 0.58, 250 * u), bh = 3 * LH(S, FS(S, 13), 1.3) + 14 * u;
      const bx = pr.x + 8 * u, by = pr.y + 4 * u;
      d.rect(bx, by, bwid, bh, { fill: S.pal.surface, stroke: tone(S, 'err').c, lw: 1.6, r: 4 });
      d.polyline([[bx + bwid, by + bh * 0.6], [x, by + bh * 0.6], [x, y - 9 * u]], tone(S, 'err').c, 1.4, { dash: [3, 3] });
      lines2.forEach((t, i) => fitText(S, t, bx + 10 * u, by + 7 * u + (i + 0.5) * LH(S, FS(S, 13), 1.3), bwid - 34 * u, 13, { weight: i === 1 ? 800 : 600, color: i === 2 ? tone(S, 'dat').ink : i === 1 ? tone(S, 'err').ink : p.ink }));
      mark(S, bx + bwid - 14 * u, by + 7 * u + 1.5 * LH(S, FS(S, 13), 1.3), false, 6);
    });
  }
}

/** En un chat no se ve la probabilidad; y el ajuste de la lección 28 bajó la calibración de GPT-4. */
function drawHidden(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const a1 = fr(S, 'hidden', 0.05, 0.18), a2 = fr(S, 'hidden', 0.18, 0.3), gh = fr(S, 'hidden', 0.32, 0.45), q = fr(S, 'hidden', 0.55, 0.7);
  const chatW = vert ? A.w : A.w * 0.5, sz = FS(S, 15);
  const bub = (str: string, x: number, y: number, w: number, t: 'sig' | 'lat', a: number) => {
    const pad = 10 * u, h = paraH(S, str, w - 2 * pad, sz) + 2 * pad;
    d.withAlpha(a, () => { d.rect(x, y, w, h, { fill: tone(S, t).soft, stroke: tone(S, t).c, lw: 1.4, r: 6 }); para(S, str, x + pad, y + pad, w - 2 * pad, sz, { weight: 600 }); });
    return h;
  };
  const bw = Math.min(chatW * 0.86, 300 * u);
  const h1 = bub(S.l('¿Quién esculpió El pensador?', 'Who sculpted The Thinker?'), A.x + chatW - bw, A.y, bw, 'sig', a1);
  const y2 = A.y + h1 + 10 * u, h2 = bub(S.l('Miguel Ángel.', 'Michelangelo.'), A.x, y2, bw * 0.8, 'lat', a2);
  // la probabilidad que no se muestra
  d.withAlpha(gh, () => {
    const x = A.x + bw * 0.8 + 14 * u, y = y2 + h2 / 2;
    fitText(S, pct(S, THINKER.p, 0), x, y, 70 * u, 18, { weight: 800, font: 'mono', color: p.mute });
    const tw = S.d.measure(pct(S, THINKER.p, 0), { size: FS(S, 18), weight: 800, font: 'mono' });
    d.line(x - 2 * u, y + 8 * u, x + tw + 2 * u, y - 8 * u, tone(S, 'err').c, 2.2);
    fitText(S, S.l('no se muestra', 'not shown'), x, y + 20 * u, Math.max(80 * u, chatW - (x - A.x)), 12, { weight: 700, color: p.mute });
  });
  // informe de GPT-4
  const qx = vert ? A.x : A.x + chatW + 18 * u, qy = vert ? y2 + h2 + 46 * u : A.y, qw = vert ? A.w : A.w - chatW - 18 * u, qh = vert ? A.y + A.h - qy : Math.min(A.h, 200 * u);
  const qtxt = S.l('El modelo preentrenado estaba muy bien calibrado. Tras el ajuste posterior, su calibración se redujo.', 'The pretrained model was highly calibrated. After post-training, its calibration was reduced.');
  const qneed = 12 * u * 2 + 22 * u + paraH(S, qtxt, qw - 24 * u, FS(S, 15)) + 6 * u;
  if (qh > 70 * u) d.withAlpha(q, () => {
    const hh = Math.min(qh, qneed);
    card(S, { x: qx, y: qy, w: qw, h: hh }, { tone: 'w' });
    const pad = 12 * u;
    fitText(S, S.l('Informe técnico de GPT-4 (2023)', 'GPT-4 technical report (2023)'), qx + pad, qy + pad + 6 * u, qw - 2 * pad, 12.5, { weight: 800, color: tone(S, 'w').ink });
    para(S, qtxt, qx + pad, qy + pad + 22 * u, qw - 2 * pad, FS(S, 15), { weight: 600, maxLines: Math.max(2, Math.floor((hh - pad * 2 - 22 * u) / LH(S, FS(S, 15), 1.28))) });
  });
  void chipH;
}
