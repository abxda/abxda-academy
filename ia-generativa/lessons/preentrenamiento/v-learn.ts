// Qué aprende y en qué orden: la curva de error real de Pythia-1.4B en 25 puntos de control (eje horizontal logarítmico,
// explicado pieza por pieza) y lo que escribe en cada punto ante tres indicaciones (frase, hecho, patrón). El punto que se
// muestra lo fija el control «ckpt», que la escena mueve sola en la demostración (S.drive) mientras nadie lo toque.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, area, caption, card, fitText, fr, hold, isShort, lineH, lines, mark, measure, pct, provenance, provH, tok, txt } from './draw';
import { FINAL, LAST, LEARN_ROWS, N, RANDOM_LOSS, ROWS, flat, genAt, probAt, promptOf, rowAt } from './pythia';

const LO = 6, HI = Math.log10(ROWS[LAST].tokens) + 0.08;
const TICKS = [1e7, 1e8, 1e9, 1e10, 1e11];
const tickLabel = (S: Frame, v: number) => S.l(({ 1e7: '10 M', 1e8: '100 M', 1e9: 'mil M', 1e10: '10 mil M', 1e11: '100 mil M' } as Record<number, string>)[v], tok(S, v));
const YMAX = 12;

/** Punto de control que se muestra (índice 0..24): el del control, desde la demostración. */
export const ckptShown = (S: Frame) => clamp(Math.round(+(S.p.ckpt ?? 0)), 0, LAST);

function layout(S: Frame) {
  const A0 = area(S), P = S.portrait, short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  if (short) {
    const cw = A.w * 0.45;
    return { C: { x: A.x, y: A.y, w: cw, h: A.h }, R: { x: A.x + cw + 14, y: A.y, w: A.w - cw - 14, h: A.h } };
  }
  const ch = A.h * (P ? 0.43 : 0.5);
  return { C: { x: A.x, y: A.y, w: A.w, h: ch }, R: { x: A.x, y: A.y + ch + (P ? 10 : 14), w: A.w, h: A.h - ch - (P ? 10 : 14) } };
}

export function drawLearn(S: Frame) {
  const { C, R } = layout(S);
  drawChart(S, C);
  drawRows(S, R);
  provenance(S, S.l('medición real · Pythia-1.4B · error sobre un texto de 500 tokens escrito para la lección', 'real measurement · Pythia-1.4B · error on a 500-token text written for the lesson'), ap(S, 'learn-intro', 0, 0.15));
}

function drawChart(S: Frame, C: Rect) {
  const { d, pal: p } = S, short = isShort(S), lt = tone(S, 'lat'), er = tone(S, 'err');
  const yLabW = measure(S, '12', 12, true) + 10;
  const topH = lineH(S, 13) + 8, botH = lineH(S, 12) * 2 + 14;
  const pr: Rect = { x: C.x + yLabW, y: C.y + topH, w: C.w - yLabW - 6, h: C.h - topH - botH };
  const X = (t: number) => (t <= 0 ? pr.x : pr.x + pr.w * clamp((Math.log10(t) - LO) / (HI - LO)));
  const Y = (v: number) => pr.y + pr.h * (1 - clamp(v / YMAX));
  const aBase = ap(S, 'learn-intro', 0.02, 0.14);
  // eje horizontal (la línea) desde el inicio; marcas y rótulos en learn-x
  d.withAlpha(aBase, () => d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5));
  // rótulos de las marcas: si no caben todos, uno sí y uno no
  const tickX = TICKS.map(X), tickW = TICKS.map((v) => measure(S, tickLabel(S, v), 12, true));
  const fitsAll = tickX.every((x, i) => i === 0 || x - tickX[i - 1] > (tickW[i] + tickW[i - 1]) / 2 + 8);
  TICKS.forEach((v, i) => {
    const a = ap(S, 'learn-x', 0.12 + i * 0.1, 0.22 + i * 0.1);
    if (a <= 0.01) return;
    const x = tickX[i];
    d.withAlpha(a, () => {
      d.line(x, pr.y, x, pr.y + pr.h + 4, alpha(p.ink, 0.12), 1);
      if (fitsAll || i % 2 === 0) txt(S, tickLabel(S, v), Math.min(x, pr.x + pr.w - tickW[i] / 2), pr.y + pr.h + 6 + lineH(S, 12) / 2, { s: 12, weight: 600, mono: true, c: p.mute, align: 'center' });
    });
  });
  caption(S, S.l('tokens leídos · cada marca, 10 veces más', 'tokens read · each mark, 10 times more'), pr.x + pr.w / 2, C.y + C.h - lineH(S, 12) / 2 - 1, C.w, { align: 'center', a: ap(S, 'learn-x', 0.6, 0.75), c: p.ink2 });
  // eje vertical en learn-y
  const aY = ap(S, 'learn-y', 0.05, 0.2);
  d.withAlpha(aY, () => {
    d.line(pr.x, pr.y, pr.x, pr.y + pr.h, p.lineStrong, 1.5);
    [0, 4, 8, 12].forEach((v) => {
      d.line(pr.x - 4, Y(v), pr.x, Y(v), p.lineStrong, 1.3);
      if (v > 0) d.line(pr.x, Y(v), pr.x + pr.w, Y(v), alpha(p.ink, 0.07), 1);
      txt(S, String(v), pr.x - 6, Y(v), { s: 12, weight: 600, mono: true, c: p.mute, align: 'right' });
    });
    const yt = C.w < 420 ? S.l('error promedio', 'average error') : S.l('error promedio (más abajo, mejor)', 'average error (lower is better)');
    fitText(S, yt, C.x, C.y + topH / 2 - 2, C.w * 0.55, { s: 12.5, weight: 700, c: p.ink2 });
  });
  // adivinar al azar
  const aR = ap(S, 'learn-curve', 0.28, 0.4);
  d.withAlpha(aR, () => {
    d.line(pr.x, Y(RANDOM_LOSS), pr.x + pr.w, Y(RANDOM_LOSS), p.mute, 1.3, [5, 4]);
    txt(S, `${S.l('al azar', 'random')} ${S.n(RANDOM_LOSS, 1)}`, pr.x + pr.w, Y(RANDOM_LOSS) - lineH(S, 12) / 2 - 1, { s: 12, weight: 700, c: p.mute, align: 'right', halo: true });
  });
  // los 25 puntos de control: aparecen en el eje (learn-intro) y suben a su error (learn-curve)
  const pts: [number, number][] = [];
  ROWS.forEach((r, i) => {
    const a = ap(S, 'learn-intro', 0.3 + i * 0.018, 0.36 + i * 0.018);
    if (a <= 0.01) return;
    const rise = fr(S, 'learn-curve', 0.06 + i * 0.022, 0.16 + i * 0.022);
    const x = X(r.tokens), y = pr.y + pr.h + (Y(r.en.loss) - pr.y - pr.h) * rise;
    pts.push([x, y]);
    d.withAlpha(a, () => d.circle(x, y, short ? 3 : 3.6, { fill: lt.c, stroke: p.stage, lw: 1 }));
  });
  if (S.on('learn-curve') && pts.length > 1) d.polyline(pts, lt.c, 2.2, { a: ap(S, 'learn-curve', 0.04, 0.12) });
  const aCap = ap(S, 'learn-intro', 0.75, 0.88) * (1 - ap(S, 'learn-x', 0, 0.1));
  caption(S, S.l('25 puntos de control', '25 checkpoints'), pr.x + pr.w / 2, pr.y + pr.h - lineH(S, 12), pr.w, { align: 'center', a: aCap, c: lt.ink });
  // cifras del principio y del final
  const aV = ap(S, 'learn-curve', 0.72, 0.84);
  d.withAlpha(aV, () => {
    txt(S, S.n(ROWS[0].en.loss, 1), X(ROWS[1].tokens) + 8, Y(ROWS[0].en.loss) + lineH(S, 13) * 0.75, { s: 13, weight: 800, mono: true, c: lt.ink, halo: true });
    txt(S, S.n(ROWS[LAST].en.loss, 1), X(ROWS[LAST].tokens), Y(ROWS[LAST].en.loss) - lineH(S, 13) * 0.75, { s: 13, weight: 800, mono: true, c: lt.ink, align: 'right', halo: true });
  });
  // el punto que se lee ahora
  if (S.on('learn-noise')) {
    const a = ap(S, 'learn-noise', 0, 0.12), kS = clamp(+(S.st.kShow ?? ckptShown(S)), 0, LAST);
    const k0 = Math.floor(kS), k1 = Math.min(LAST, k0 + 1), f = kS - k0;
    const r0 = ROWS[k0], r1 = ROWS[k1];
    const x = X(r0.tokens) + (X(r1.tokens) - X(r0.tokens)) * f, y = Y(r0.en.loss) + (Y(r1.en.loss) - Y(r0.en.loss)) * f;
    const k = ckptShown(S), row = rowAt(k);
    d.withAlpha(a, () => {
      d.line(x, pr.y, x, pr.y + pr.h, er.c, 1.6, [4, 3]);
      d.circle(x, y, 6, { fill: er.c, stroke: p.stage, lw: 2 });
      const lab = `${tok(S, row.tokens)} tokens`;
      fitText(S, lab, C.x + C.w, C.y + topH / 2 - 2, C.w * 0.43, { s: 13, weight: 800, mono: true, c: er.ink, align: 'right' });
    });
  }
}

function drawRows(S: Frame, R: Rect) {
  const { d, pal: p } = S, dt = tone(S, 'dat'), er = tone(S, 'err');
  const k = ckptShown(S);
  const vis = [ap(S, 'learn-noise', 0.25, 0.4), ap(S, 'learn-fact', 0.04, 0.16), ap(S, 'learn-pattern', 0.04, 0.16)];
  const focus = [hold(S, 'learn-noise', 'learn-fact'), hold(S, 'learn-fact', 'learn-pattern'), hold(S, 'learn-pattern', 'learn-try')];
  const all = ap(S, 'learn-try', 0, 0.1);
  const gap = 8, rh = (R.h - 2 * gap) / 3;
  const headS = 12.5, bodyS = 12.5;
  const maxBody = Math.max(1, Math.min(2, Math.floor((rh - lineH(S, headS) - 10) / lineH(S, bodyS))));
  LEARN_ROWS.forEach((lr, i) => {
    if (vis[i] <= 0.01) return;
    const y = R.y + i * (rh + gap), f = Math.max(focus[i], all), a = vis[i] * (0.62 + 0.38 * f);
    const probe = lr.probe ? probAt(lr.probe, k) : null;
    const gen = flat(genAt(lr.id, k));
    const ok = probe ? probe.hit : null;
    const valStr = probe ? `${lr.answer}: ${pct(S, probe.p)}` : '';
    const rightW = probe ? measure(S, valStr, 12.5, true, 800) + 30 : 0;
    d.withAlpha(a, () => {
      card(S, { x: R.x, y, w: R.w, h: rh }, { tone: f > 0.5 ? 'lat' : undefined, fill: 0.05 });
      if (f > 0.01) d.rect(R.x, y, 4, rh, { fill: tone(S, 'lat').c, a: f });
      const tx = R.x + 12, tw = R.w - 22, hy = y + 6 + lineH(S, headS) / 2;
      const head = `${S.l(lr.label.es, lr.label.en)} · `, hw = measure(S, head, headS, false, 800);
      txt(S, head, tx, hy, { s: headS, weight: 800, c: tone(S, 'lat').ink });
      fitText(S, promptOf(lr.id), tx + hw, hy, tw - hw - rightW, { s: headS, weight: 600, mono: true, c: p.mute });
      if (probe) {
        mark(S, R.x + R.w - rightW + 8, hy, probe.hit, 6);
        txt(S, valStr, R.x + R.w - 10, hy, { s: 12.5, weight: 800, mono: true, c: probe.hit ? dt.ink : er.ink, align: 'right' });
      }
      const ls = lines(S, `→ ${gen}`, tw, { s: bodyS, mono: true, weight: 700, max: maxBody });
      ls.forEach((ln, j) => txt(S, ln, tx, y + 8 + lineH(S, headS) + j * lineH(S, bodyS) + lineH(S, bodyS) / 2, { s: bodyS, weight: 700, mono: true, c: ok === null ? p.ink : ok ? dt.ink : er.ink }));
    });
  });
}

// ═════════ lo que casi no está en el corpus, casi no se aprende ═════════
export function drawLangGap(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, dt = tone(S, 'dat'), er = tone(S, 'err');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const headH = lineH(S, 14) + 12, gap = 12;
  const cw = P ? A.w : (A.w - gap) / 2, lh = lineH(S, 13);
  const items = [
    { lang: S.l('inglés', 'English'), prompt: promptOf('fact'), gen: flat(FINAL.gen.fact), p: FINAL.probs.fact, ans: 'Paris', at: 0.15 },
    { lang: S.l('español', 'Spanish'), prompt: promptOf('es'), gen: flat(FINAL.gen.es), p: FINAL.probs.es, ans: 'París', at: 0.45 },
  ];
  const genL = items.map((it) => lines(S, `→ ${it.gen}`, cw - 24, { s: 13, mono: true, weight: 700, max: 3 }));
  const ch = 10 + (lh + 6) + (lh + 4) + Math.max(...genL.map((g) => g.length)) * lh + 10 + lh + 12;
  const groupH = headH + (P ? 2 * ch + gap : ch), oy = A.y + Math.max(0, (A.h - groupH) / 2);
  fitText(S, S.l('el mismo modelo, al final del entrenamiento', 'the same model, at the end of training'), A.x, oy + headH / 2, A.w, { s: 14, weight: 800, a: ap(S, 'lang-gap', 0.02, 0.14) });
  items.forEach((it, i) => {
    const r: Rect = P ? { x: A.x, y: oy + headH + i * (ch + gap), w: cw, h: ch } : { x: A.x + i * (cw + gap), y: oy + headH, w: cw, h: ch };
    const a = ap(S, 'lang-gap', it.at, it.at + 0.12);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      card(S, r, { tone: it.p.hit ? 'dat' : 'err', fill: 0.05 });
      const x = r.x + 12, w = r.w - 24;
      let y = r.y + 10;
      fitText(S, it.lang, x, y + lh / 2, w, { s: 13, weight: 800, c: p.ink2 }); y += lh + 6;
      fitText(S, it.prompt, x, y + lh / 2, w, { s: 13, weight: 600, mono: true, c: p.mute }); y += lh + 4;
      genL[i].forEach((ln, j) => txt(S, ln, x, y + j * lh + lh / 2, { s: 13, weight: 700, mono: true, c: it.p.hit ? dt.ink : er.ink }));
      const fy = r.y + r.h - 10 - lh / 2;
      mark(S, x + 6, fy, it.p.hit, 6);
      fitText(S, `${it.ans}: ${pct(S, it.p.p)}`, x + 20, fy, w - 20, { s: 13, weight: 800, mono: true, c: it.p.hit ? dt.ink : er.ink });
    });
  });
  provenance(S, S.l('medición real · Pythia-1.4B, último punto de control · The Pile es un corpus en inglés', 'real measurement · Pythia-1.4B, last checkpoint · The Pile is an English corpus'), ap(S, 'lang-gap', 0, 0.15));
  void N;
}
