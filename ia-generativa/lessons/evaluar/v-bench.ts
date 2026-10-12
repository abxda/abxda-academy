// Vistas 1–3: la pregunta y los benchmarks.
//  · drawIntro  (hook, recall): la tabla del examen público frente a «tus casos», que se miden.
//  · drawBench  (bench, bench-q, bench-a): qué es un benchmark; una pregunta real de MMLU (figura 1 de Hendrycks et al., 2020).
//  · drawScale  (score … saturation): la línea de 0 a 100, el azar, GPT-3, GPT-4, el experto y el techo.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { GPT4_MMLU, MMLU, MMLU_Q, SATURATED } from './data';
import { FS, area, card, chip, chipH, fitText, fr, glyph, growArrow, hold, mark, para, paraH, pct, tight } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La pregunta: el examen público y tus casos
// ════════════════════════════════════════════════════════════════════════════════════════════════
const MEASURED: ('ok' | 'bad')[] = ['ok', 'ok', 'bad', 'ok', 'ok', 'ok', 'bad', 'ok', 'ok', 'bad'];

export function drawIntro(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait, gap = 18 * u;
  const L: Rect = port ? { x: A.x, y: A.y, w: A.w, h: (A.h - gap) * 0.5 } : { x: A.x, y: A.y + A.h * 0.08, w: (A.w - gap) / 2, h: A.h * 0.84 };
  const R: Rect = port ? { x: A.x, y: L.y + L.h + gap, w: A.w, h: L.h } : { x: L.x + L.w + gap, y: L.y, w: L.w, h: L.h };
  const pad = (tight(S) ? 8 : 14) * u;
  // ── el examen público: una tabla con el proveedor en primer lugar ──
  const aL = fr(S, 'hook', 0.02, 0.16);
  d.withAlpha(aL, () => {
    card(S, L, { tone: 'w' });
    fitText(S, S.l('examen público', 'public exam'), L.x + pad, L.y + pad, L.w - 2 * pad, 15, { weight: 800, base: 'top', color: tone(S, 'w').ink });
    const rows = [S.l('su modelo', 'their model'), S.l('otro modelo', 'another model'), S.l('otro más', 'yet another')];
    const top = L.y + pad + FS(S, 15) * u + 12 * u, rh = Math.min(40 * u, (L.h - (top - L.y) - pad) / 3), lw = Math.min(L.w * 0.42, 150 * u);
    rows.forEach((r, i) => {
      const y = top + i * rh, a = fr(S, 'hook', 0.1 + i * 0.06, 0.2 + i * 0.06), first = i === 0;
      d.withAlpha(a, () => {
        fitText(S, `${i + 1}. ${r}`, L.x + pad, y + rh / 2, lw - 8 * u, 13, { weight: first ? 800 : 600, base: 'middle', color: first ? p.ink : p.ink2 });
        const bx = L.x + pad + lw, bw = (L.w - 2 * pad - lw) * (first ? 0.92 : 0.8 - i * 0.06);
        d.rect(bx, y + rh * 0.25, bw, rh * 0.5, { fill: first ? tone(S, 'w').c : alpha(tone(S, 'w').c, 0.35), r: 2 });
      });
    });
  });
  // ── tus casos: primero un signo de interrogación; luego se miden ──
  const aR = fr(S, 'hook', 0.62, 0.76);
  d.withAlpha(aR, () => {
    card(S, R, { tone: 'dat', dash: S.on('recall') ? undefined : [6, 4] });
    fitText(S, S.l('tus casos', 'your cases'), R.x + pad, R.y + pad, R.w - 2 * pad, 15, { weight: 800, base: 'top', color: tone(S, 'dat').ink });
    const q = 1 - fr(S, 'recall', 0.5, 0.62);
    const cy = R.y + pad + FS(S, 15) * u + (R.h - pad - FS(S, 15) * u) / 2;
    if (q > 0.01) d.text('?', R.x + R.w / 2, cy, { size: FS(S, 44), weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'middle', a: q });
    if (S.on('recall')) {
      const s = Math.min((R.w - 2 * pad) / 10, 34 * u, (R.h - 3 * pad - FS(S, 15) * u - FS(S, 13) * u) * 0.8), gx = R.x + (R.w - 10 * s) / 2, gy = cy - s / 2 - 6 * u;
      MEASURED.forEach((m, i) => {
        const a = fr(S, 'recall', 0.55 + i * 0.025, 0.62 + i * 0.025);
        mark(S, gx + i * s, gy, s, m, a);
      });
      fitText(S, S.l('se mide, caso por caso', 'measured, case by case'), R.x + R.w / 2, gy + s + 10 * u, R.w - 2 * pad, 13, { weight: 700, align: 'center', base: 'top', color: p.ink2, a: fr(S, 'recall', 0.82, 0.92) });
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Qué es un benchmark; una pregunta de MMLU
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawBench(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  // ── bench: una hoja de examen, la misma para tres modelos ──
  const a0 = S.on('bench-q') ? 1 - fr(S, 'bench-q', 0, 0.12) : 1;
  if (a0 > 0.01) d.withAlpha(a0, () => {
    const sw = Math.min(port ? 150 * u : 190 * u, A.w * (port ? 0.4 : 0.22)), sh = sw * 1.25;
    const chipsH = 3 * (chipH(S, 13) + 8 * u);
    const sx = port ? A.x + A.w / 2 - sw / 2 : A.x + A.w * 0.08, sy = port ? A.y + 4 * u : A.y + (A.h - sh) / 2;
    // la hoja
    d.withAlpha(fr(S, 'bench', 0.05, 0.18), () => {
      card(S, { x: sx, y: sy, w: sw, h: sh }, { fill: p.surface });
      fitText(S, S.l('examen', 'exam'), sx + sw / 2, sy + 12 * u, sw - 12 * u, 13, { weight: 800, align: 'center', base: 'top' });
      for (let i = 0; i < 5; i++) {
        const y = sy + 40 * u + i * (sh - 56 * u) / 5;
        d.rect(sx + 12 * u, y, sw * (0.55 + 0.25 * ((i * 7) % 3) / 2), 4 * u, { fill: alpha(p.ink2, 0.35), r: 2 });
        glyph(S, 'check', sx + sw - 18 * u, y + 2 * u, 10 * u, tone(S, 'dat').ink, fr(S, 'bench', 0.45, 0.55));
      }
    });
    // tres modelos reciben la misma hoja
    const models = ['A', 'B', 'C'];
    const mw = Math.min(port ? 70 * u : 104 * u, (port ? A.w : A.w * 0.36) / 3.2), mh = mw * 0.7;
    models.forEach((m, i) => {
      const a = fr(S, 'bench', 0.6 + i * 0.05, 0.7 + i * 0.05);
      const mx = port ? A.x + A.w / 2 + (i - 1) * mw * 1.5 - mw / 2 : A.x + A.w * 0.44, my = port ? sy + sh + 40 * u : A.y + A.h / 2 + (i - 1) * mh * 1.6 - mh / 2;
      d.withAlpha(a, () => {
        const from: [number, number] = port ? [sx + sw / 2, sy + sh + 4 * u] : [sx + sw + 6 * u, sy + sh / 2];
        const to: [number, number] = port ? [mx + mw / 2, my - 4 * u] : [mx - 6 * u, my + mh / 2];
        growArrow(S, from[0], from[1], to[0], to[1], fr(S, 'bench', 0.6 + i * 0.05, 0.72 + i * 0.05), p.lineStrong, 1.8);
        card(S, { x: mx, y: my, w: mw, h: mh }, { tone: 'lat' });
        d.text(S.l(`modelo ${m}`, `model ${m}`), mx + mw / 2, my + mh / 2, { size: fitSizeLocal(S, S.l(`modelo ${m}`, `model ${m}`), mw - 6 * u, 13), weight: 700, color: tone(S, 'lat').ink, align: 'center', base: 'middle' });
      });
    });
    // propiedades
    const props = [S.l('preguntas fijas', 'fixed questions'), S.l('con su respuesta correcta', 'each with its right answer'), S.l('iguales para todos', 'the same for everyone')];
    const px = port ? A.x : A.x + A.w * 0.44 + mw + 40 * u, pw = port ? A.w : A.x + A.w - px;
    const py0 = port ? A.y + A.h - chipsH : A.y + A.h / 2 - chipsH / 2;
    props.forEach((t, i) => {
      const a = fr(S, 'bench', 0.3 + i * 0.15, 0.42 + i * 0.15);
      const cx = port ? A.x + A.w / 2 : px + 4 * u;
      chip(S, t, cx, py0 + i * (chipH(S, 13) + 8 * u) + chipH(S, 13) / 2, 'w', { a, align: port ? 'center' : 'left', maxW: pw - 8 * u, size: port ? 13 : 14.5 });
    });
  });

  // ── bench-q / bench-a: la pregunta de MMLU ──
  if (!S.on('bench-q')) return;
  const a1 = fr(S, 'bench-q', 0.08, 0.22);
  const cw = Math.min(A.w, port ? A.w : 640 * u), cx = A.x + (A.w - cw) / 2, pad = (tight(S) ? 10 : 14) * u;
  const qSize = FS(S, port ? 16 : 19), optH = (tight(S) ? 30 : port ? 40 : 50) * u, oSize = port || tight(S) ? 15 : 18;
  const head = S.l('MMLU · matemáticas de bachillerato', 'MMLU · high school mathematics');
  const qText = S.l(MMLU_Q.es, MMLU_Q.en);
  const qh = paraH(S, qText, cw - 2 * pad, qSize, { weight: 700 });
  const ch = pad + FS(S, 12.5) * u + 10 * u + qh + 12 * u + 2 * optH + 8 * u + pad;
  const countsH = (tight(S) ? 34 : 56) * u;
  const cy = A.y + Math.max(0, (A.h - ch - countsH) / 2);
  d.withAlpha(a1, () => {
    card(S, { x: cx, y: cy, w: cw, h: ch }, { fill: p.surface });
    fitText(S, head, cx + pad, cy + pad, cw - 2 * pad, 12.5, { weight: 700, base: 'top', color: p.mute });
    let y = cy + pad + FS(S, 12.5) * u + 10 * u;
    para(S, qText, cx + pad, y, cw - 2 * pad, qSize, { weight: 700 });
    y += qh + 12 * u;
    const ow = (cw - 2 * pad - 10 * u) / 2;
    MMLU_Q.options.forEach((o, i) => {
      const ox = cx + pad + (i % 2) * (ow + 10 * u), oy = y + Math.floor(i / 2) * (optH + 8 * u);
      const ok = i === MMLU_Q.answer, k = ok ? fr(S, 'bench-a', 0.08, 0.2) : 0, wrong75 = i === 0 ? hold(S, 'bench-a', undefined, 0.2, 0.32) : 0;
      d.withAlpha(fr(S, 'bench-q', 0.2 + i * 0.05, 0.3 + i * 0.05), () => {
        card(S, { x: ox, y: oy, w: ow, h: optH }, { tone: ok && k > 0.05 ? 'dat' : undefined, hot: k, fill: ok && k > 0.05 ? alpha(tone(S, 'dat').c, 0.12 + 0.18 * k) : p.stage });
        const lab = `(${'ABCD'[i]})  ${o}`;
        d.text(lab, ox + 12 * u, oy + optH / 2, { size: FS(S, oSize), weight: 700, font: 'mono', color: ok && k > 0.5 ? tone(S, 'dat').ink : p.ink, base: 'middle' });
        if (ok) glyph(S, 'check', ox + ow - 18 * u, oy + optH / 2, 16 * u, tone(S, 'dat').ink, k);
        if (i === 0 && wrong75 > 0.01) glyph(S, 'cross', ox + ow - 18 * u, oy + optH / 2, 14 * u, tone(S, 'err').c, wrong75);
      });
    });
  });
  // la cuenta y el tamaño del examen
  const yb = cy + ch + (tight(S) ? 8 : 14) * u;
  const k1 = fr(S, 'bench-a', 0.22, 0.34), k2 = fr(S, 'bench-a', 0.6, 0.72), k3 = fr(S, 'bench-a', 0.78, 0.9);
  if (k1 > 0.01 && !tight(S)) fitText(S, S.l('del 25 al 100 hay 100 − 25 + 1 = 76 números', 'from 25 to 100 there are 100 − 25 + 1 = 76 numbers'), A.x + A.w / 2, yb, A.w, 13, { weight: 600, font: 'mono', align: 'center', base: 'top', color: p.ink2, a: k1 * (1 - k2) });
  const c1 = S.l(`${S.n(MMLU.questions, 0)} preguntas`, `${S.n(MMLU.questions, 0)} questions`), c2 = S.l(`${MMLU.subjects} temas`, `${MMLU.subjects} subjects`);
  const cyy = yb + chipH(S, 14) / 2 + (tight(S) ? 0 : 4 * u);
  const w1 = S.d.measure(c1, { size: FS(S, 14), weight: 800 }) + 14 * u, w2 = S.d.measure(c2, { size: FS(S, 14), weight: 800 }) + 14 * u, gapc = 12 * u;
  const x0 = A.x + A.w / 2 - (w1 + w2 + gapc) / 2;
  chip(S, c1, x0, cyy, 'lat', { a: k2, align: 'left', size: 14, weight: 800 });
  chip(S, c2, x0 + w1 + gapc, cyy, 'lat', { a: k3, align: 'left', size: 14, weight: 800 });
}
function fitSizeLocal(S: Frame, str: string, w: number, size: number) {
  let s = FS(S, size); const min = 12.2 / S.u;
  while (s > min && S.d.measure(str, { size: s, weight: 700 }) > w) s -= 0.5;
  return Math.max(s, min);
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La línea de 0 a 100: azar, GPT-3, GPT-4, experto, techo
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawScale(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const x0 = A.x + 14 * u, x1 = A.x + A.w - 14 * u, ay = A.y + A.h * (port ? 0.52 : 0.56);
  const X = (v: number) => x0 + (v / 100) * (x1 - x0);
  const aAx = fr(S, 'score', 0.05, 0.25);
  // título del eje
  fitText(S, S.l('aciertos en MMLU', 'right answers on MMLU'), A.x, A.y + 4 * u, A.w, 14, { weight: 800, base: 'top', color: p.ink2, a: aAx });
  // banda del techo (saturación): rótulo de dos renglones arriba a la derecha; la banda baja hasta el eje
  const aSat = fr(S, 'saturation', 0.08, 0.25);
  const s1 = FS(S, 13.5), labTop = A.y + 4 * u, bandTop = labTop + 2 * s1 * u * 1.3 + 6 * u;
  if (aSat > 0.01) d.withAlpha(aSat, () => {
    d.rect(X(SATURATED), bandTop, X(100) - X(SATURATED), ay + 6 * u - bandTop, { fill: alpha(tone(S, 'err').c, 0.12), stroke: alpha(tone(S, 'err').c, 0.5), lw: 1, dash: [4, 3] });
    fitText(S, S.l('hoy: más de 90', 'today: above 90'), X(100), labTop, A.w * 0.5, 13.5, { weight: 800, align: 'right', base: 'top', color: tone(S, 'err').ink });
    fitText(S, S.l('el examen está saturado', 'the exam is saturated'), X(100), labTop + s1 * u * 1.3, A.w * 0.5, 13.5, { weight: 800, align: 'right', base: 'top', color: tone(S, 'err').ink, a: fr(S, 'saturation', 0.7, 0.85) });
  });
  // el eje
  d.withAlpha(aAx, () => {
    d.line(x0, ay, x1, ay, p.lineStrong, 2);
    [0, 25, 50, 75, 100].forEach((v) => { d.line(X(v), ay - 5 * u, X(v), ay + 5 * u, p.lineStrong, 1.5); });
    [50].forEach((v) => d.text(S.n(v, 0), X(v), ay + 10 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }));
  });
  // marcas
  const labH = (FS(S, 13) + FS(S, 14.5)) * u * 1.25 + 4 * u;
  const up = Math.min((port ? 0.62 : 0.5) * (ay - A.y - 40 * u), ay - bandTop - labH - 8 * u), dn = Math.min(A.h * 0.24, A.y + A.h - ay - 20 * u - labH);
  marker(S, X, MMLU.chance, ay, 'down', dn * 0.55, [S.l('azar', 'chance'), pct(S, MMLU.chance)], 'mute', fr(S, 'score', 0.7, 0.85), x0, x1);
  marker(S, X, MMLU.gpt3, ay, 'up', up * 0.7, ['GPT-3 · 2020', pct(S, MMLU.gpt3, 1)], 'lat', fr(S, 'gpt3', 0.2, 0.35), x0, x1);
  marker(S, X, GPT4_MMLU, ay, 'up', up, ['GPT-4 · 2023', pct(S, GPT4_MMLU, 1)], 'lat', fr(S, 'gpt4', 0.08, 0.24), x0, x1);
  marker(S, X, MMLU.expert, ay, 'down', dn, [S.l('experto humano', 'human expert'), S.l(`(estimado) ${pct(S, MMLU.expert, 1)}`, `(estimated) ${pct(S, MMLU.expert, 1)}`)], 'sig', fr(S, 'gpt4', 0.55, 0.7), x0, x1);
  // extremos del eje, encima de las líneas guía
  const big = FS(S, 15);
  d.withAlpha(aAx, () => {
    d.text(pct(S, 0), X(0), ay + 10 * u, { size: big, weight: 800, font: 'mono', color: p.ink, align: 'left', base: 'top', a: fr(S, 'score', 0.25, 0.37), halo: p.stage, haloW: 5 });
    d.text(pct(S, 100), X(100), ay + 10 * u, { size: big, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'top', a: fr(S, 'score', 0.4, 0.52), halo: p.stage, haloW: 5 });
  });
}

/** Marca sobre el eje: punto, línea guía y dos renglones de rótulo, arriba o abajo; el rótulo no se sale de [x0, x1]. */
function marker(S: Frame, X: (v: number) => number, v: number, ay: number, side: 'up' | 'down', len: number, lab: string[], t: 'mute' | 'lat' | 'sig', a: number, x0: number, x1: number) {
  if (a <= 0.01) return;
  const { d, pal: p } = S, u = S.u, c = tone(S, t), x = X(v);
  d.withAlpha(a, () => {
    const yEnd = side === 'up' ? ay - len : ay + len;
    d.line(x, ay, x, yEnd, alpha(c.c, 0.8), 1.5, [3, 3]);
    d.circle(x, ay, 6 * u, { fill: c.c, stroke: p.stage, lw: 2 });
    const s1 = FS(S, 13), s2 = FS(S, 14.5), wMax = Math.min(220 * u, (x1 - x0) * 0.6);
    const w = Math.max(...lab.map((l, i) => d.measure(l, { size: i ? s2 : s1, weight: 800, font: i ? 'mono' : 'ui' })));
    const tw = Math.min(w, wMax), tx = clamp(x - tw / 2, x0, x1 - tw);
    const h = (s1 + s2) * u * 1.25;
    const ty = side === 'up' ? yEnd - h - 2 * u : yEnd + 4 * u;
    fitText(S, lab[0], tx + tw / 2, ty, wMax, 13, { weight: 800, align: 'center', base: 'top', color: t === 'mute' ? p.ink2 : c.ink, halo: true });
    fitText(S, lab[1], tx + tw / 2, ty + s1 * u * 1.25, wMax, 14.5, { weight: 800, font: 'mono', align: 'center', base: 'top', color: t === 'mute' ? p.ink2 : c.ink, halo: true });
  });
}
