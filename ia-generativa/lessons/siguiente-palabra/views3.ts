// Límites de contar y la red que da puntajes; softmax paso a paso; la temperatura (con diez sorteos que la persona
// puede ver cambiar); top-k y top-p. Las probabilidades salen del mismo modelo (lm.ts): los puntajes son ln(cuenta) − ln 2,
// que en pantalla se redondean a 0.7, 0 y −0.7 (sumar una constante a todos no cambia el softmax).
import { alpha, clamp, drawNet, layoutNet, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import type { Demo } from './demo';
import { area, vshift, chipRow, drawWords, fitSize, fr, fz, isShort, kk, label, layoutWords, num, pct, probBars, q, textPanel, wl, wordBox } from './helpers';
import { choose, probs, rowsFor, softmax, truncate } from './lm';
import { textOrigin, writeGeom } from './views2';

const zOf = (c: number) => Math.log(c) - Math.log(2);
const short1 = (S: Frame, x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? S.n(x, 0) : S.n(x, 1));

// ═════════ límites de contar ═════════
export function drawLimits(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = writeGeom(S, D), k = g.k, u = S.u, W = D.W;
  const aB = fr(S, 'limit-unseen', 0, 0.1), aC = fr(S, 'network', 0, 0.1), aD = fr(S, 'embed', 0, 0.1);
  const aTop = 1 - aC;
  if (aTop > 0.01) d.withAlpha(aTop, () => {
    textPanel(S, g.strip, S.l('lo que escribes', 'what you type'));
    const [ox, oy] = textOrigin(S, g);
    // «El sol es» (solo mira «es») → «El océano» (nunca vio «océano»)
    const wa = [W.el, W.sol, W.es], wb = [W.el, W.oceano];
    const La = layoutWords(S, wa, g.tw, g.size, 650), Lb = layoutWords(S, wb, g.tw, g.size, 650);
    if (aB < 0.99) drawWords(S, La, ox, oy, { a: 1 - aB, weight: 650, ctx: wordBox(S, La, 2, ox, oy), ctxLabel: S.l('lo que mira', 'what it looks at'), dim: (i) => (i < 2 ? 1 - 0.6 * fr(S, 'limit-short', 0.3, 0.45) : 1), cursor: true });
    if (aB > 0.01) drawWords(S, Lb, ox, oy, { a: aB, weight: 650, ctx: wordBox(S, Lb, 1, ox, oy), ctxLabel: S.l('lo que mira', 'what it looks at'), cursor: true });
    // A: las mismas barras de «es»; «azul» señalado
    if (aB < 0.99) d.withAlpha(1 - aB, () => {
      label(S, S.l(`fila de ${q(S, W.es)}`, `row for ${q(S, W.es)}`), g.bars.x, g.bars.y - 22 * k, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2 });
      const hot = fr(S, 'limit-short', 0.62, 0.75);
      const geo = probBars(S, g.bars, D.esP.map((x, i) => ({ label: x.w, p: x.p, hot: i === 0 ? hot : 0 })), { slots: 4 });
      label(S, S.l(`¿${W.el} ${W.sol}, ${W.azul}?`, `the ${W.sol}, ${W.azul}?`), g.bars.x + g.bars.w, g.bars.y - 22 * k, { align: 'right', size: fz(S, 13), weight: 800, color: tone(S, 'err').ink, a: hot });
      void geo;
    });
    // B: no hay fila para «océano»
    if (aB > 0.01) d.withAlpha(aB, () => {
      const r = g.bars;
      label(S, S.l(`fila de ${q(S, W.oceano)}`, `row for ${q(S, W.oceano)}`), r.x, r.y - 22 * k, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2 });
      d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1.5, dash: [6, 5], r: 6 });
      const ea = fr(S, 'limit-unseen', 0.45, 0.6);
      label(S, S.l('no existe: cero cuentas', 'does not exist: zero counts'), r.x + r.w / 2, r.y + r.h / 2 - 12 * k, { size: fz(S, 15), weight: 800, color: p.ink, a: ea, base: 'bottom' });
      label(S, S.l('no sabe qué decir', 'it has nothing to say'), r.x + r.w / 2, r.y + r.h / 2 + 4 * k, { size: fz(S, 13), weight: 600, color: p.mute, a: fr(S, 'limit-unseen', 0.65, 0.8) });
    });
  });
  if (aC > 0.01 && aD < 0.99) d.withAlpha(aC * (1 - aD), () => drawNetwork(S, D));
  if (aD > 0.01) d.withAlpha(aD, () => drawEmbedMap(S, D));
}

function drawNetwork(S: Frame, D: Demo) {
  const { d, pal: p } = S, R = area(S), k = kk(S), u = S.u, P = S.portrait, lat = tone(S, 'lat');
  label(S, S.l('en lugar de la tabla, una red neuronal', 'instead of the table, a neural network'), R.x, R.y + 2 * k, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink, w: R.w });
  const inW = Math.max(...D.start.map((w) => d.measure(w, { size: fz(S, 14), weight: 700 }))) + 22 * u;
  const outW = Math.max(...D.esP.map((x) => d.measure(`${x.w} −0.7`, { size: fz(S, 14), weight: 700 }))) + 26 * u;
  const top = R.y + 40 * k, h = R.y + R.h - top - 30 * k;
  const net: Rect = { x: R.x + inW + 20 * u, y: top, w: R.w - inW - outW - 44 * u, h: Math.min(h, P ? 260 * k : 300 * k) };
  net.y = top + (h - net.h) / 2;
  const sig = fr(S, 'network', 0.45, 0.85, 'lin') * 3;
  const geo = layoutNet(S, net, [3, 5, 5, 4]);
  drawNet(S, net, { layers: [3, 5, 5, 4], signal: sig, reveal: 1 + 3 * fr(S, 'network', 0.15, 0.4), nodeTone: 'lat' });
  // entrada: las palabras del contexto
  D.start.forEach((w, i) => {
    const nd = geo.nodes[0][i], a = fr(S, 'network', 0.08 + 0.05 * i, 0.16 + 0.05 * i);
    const bw = inW - 10 * u, bh = 26 * k;
    d.withAlpha(a, () => {
      d.rect(net.x - bw - 14 * u, nd.y - bh / 2, bw, bh, { fill: alpha(lat.c, 0.16), stroke: lat.c, lw: 1.5, r: 4 });
      d.text(w, net.x - bw / 2 - 14 * u, nd.y, { size: fz(S, 14), weight: 700, color: lat.ink, align: 'center', base: 'middle' });
    });
  });
  label(S, S.l('contexto', 'context'), net.x - inW / 2 - 9 * u, geo.nodes[0][2].y + 22 * k, { size: fz(S, 12), weight: 800, color: lat.ink, a: fr(S, 'network', 0.2, 0.3) });
  // salida: un puntaje por palabra posible
  const oa = fr(S, 'network', 0.78, 0.92);
  D.esP.forEach((x, i) => {
    const nd = geo.nodes[3][i];
    d.text(`${x.w}`, net.x + net.w + 14 * u, nd.y, { size: fz(S, 14), weight: 700, color: p.ink, base: 'middle', a: oa });
    d.text(num(S, zOf(x.c), 1).replace(/^0\.0$/, '0'), R.x + R.w, nd.y, { size: fz(S, 14), weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'right', base: 'middle', a: oa });
  });
  label(S, S.l('un puntaje por palabra', 'a score per word'), R.x + R.w, geo.nodes[3][3].y + 22 * k, { align: 'right', size: fz(S, 12), weight: 800, color: p.mute, a: oa });
}

const MAP: Record<'es' | 'en', [string, number, number, number][]> = {
  // palabra, x, y, grupo (0 agua, 1 cielo, 2 animales) · proyección ilustrativa, no medida
  es: [['mar', 0.7, 0.58, 0], ['océano', 0.78, 0.66, 0], ['lago', 0.6, 0.76, 0], ['río', 0.54, 0.62, 0], ['cielo', 0.22, 0.26, 1], ['nube', 0.34, 0.16, 1], ['sol', 0.14, 0.44, 1], ['luna', 0.3, 0.5, 1], ['gato', 0.78, 0.18, 2], ['perro', 0.9, 0.3, 2]],
  en: [['sea', 0.7, 0.58, 0], ['ocean', 0.78, 0.66, 0], ['lake', 0.6, 0.76, 0], ['river', 0.54, 0.62, 0], ['sky', 0.22, 0.26, 1], ['cloud', 0.34, 0.16, 1], ['sun', 0.14, 0.44, 1], ['moon', 0.3, 0.5, 1], ['cat', 0.78, 0.18, 2], ['dog', 0.9, 0.3, 2]],
};
function drawEmbedMap(S: Frame, D: Demo) {
  const { d, pal: p } = S, R = area(S), k = kk(S), u = S.u, lat = tone(S, 'lat'), sig = tone(S, 'sig');
  label(S, S.l('cada palabra, un embedding (lección catorce)', 'each word, an embedding (lesson fourteen)'), R.x, R.y + 2 * k, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink, w: R.w });
  const box: Rect = { x: R.x, y: R.y + 34 * k, w: R.w, h: R.h - 34 * k - 34 * k };
  d.rect(box.x, box.y, box.w, box.h, { fill: alpha(p.surface, 0.6), stroke: p.line, lw: 1, r: 6 });
  label(S, S.l('proyección ilustrativa', 'illustrative projection'), box.x + box.w - 8 * u, box.y + 6 * u, { align: 'right', size: fz(S, 12), italic: true, color: p.mute });
  const pts = MAP[S.lang as 'es' | 'en'];
  const X = (x: number) => box.x + 30 * u + x * (box.w - 80 * u), Y = (y: number) => box.y + 24 * k + y * (box.h - 48 * k);
  const hl = fr(S, 'embed', 0.45, 0.6);
  pts.forEach(([w, x, y], i) => {
    const a = fr(S, 'embed', 0.1 + 0.025 * i, 0.18 + 0.025 * i);
    const hot = i < 2 ? hl : 0;
    d.withAlpha(a, () => {
      d.circle(X(x), Y(y), (4 + 2 * hot) * u, { fill: hot > 0.5 ? sig.c : lat.c });
      d.text(w, X(x) + 8 * u, Y(y), { size: fz(S, 14), weight: hot > 0.5 ? 800 : 600, color: p.ink, base: 'middle' });
    });
  });
  if (hl > 0.01) {
    const [a, b] = [pts[0], pts[1]];
    const cx = (X(a[1]) + X(b[1])) / 2 + 18 * u, cy = (Y(a[2]) + Y(b[2])) / 2;
    d.withAlpha(hl, () => {
      d.ctx.save(); d.ctx.beginPath(); d.ctx.ellipse(cx, cy, 70 * u, 34 * k, 0.6, 0, Math.PI * 2); d.ctx.setLineDash([5, 4]); d.ctx.strokeStyle = sig.c; d.ctx.lineWidth = 2; d.ctx.stroke(); d.ctx.restore();
    });
  }
  label(S, S.l(`${q(S, D.W.oceano)} cerca de ${q(S, D.W.mar)}: la red responde parecido`, `${q(S, D.W.oceano)} near ${q(S, D.W.mar)}: the network answers alike`), R.x + R.w / 2, box.y + box.h + 8 * k, { size: fz(S, 13), weight: 800, color: sig.ink, a: fr(S, 'embed', 0.62, 0.76), w: R.w });
}

// ═════════ softmax, paso a paso ═════════
function smGeom(S: Frame, D: Demo) {
  const { d } = S, R0 = area(S), k = kk(S), u = S.u, P = S.portrait;
  const R = { ...R0, y: R0.y + vshift(S, R0, 70 * k + 4 * 46 * k + 50 * k) };
  const size = fz(S, 15), hs = fz(S, 12);
  const wordW = Math.max(...D.esP.map((x) => d.measure(x.w, { size, weight: 700 }))) + 12 * u;
  // en vertical, las columnas miden lo que sus números (los encabezados pueden desbordar un poco sobre las flechas)
  const scoreW = Math.max(d.measure(S.l('puntaje', 'score'), { size: hs, weight: 700 }) + (P ? 4 : 16) * u, d.measure('−0.7', { size, weight: 700, font: 'mono' }) + 18 * u);
  const expW = P ? d.measure('0.5', { size, font: 'mono', weight: 700 }) + 18 * u : Math.max(d.measure(S.l('exponencial', 'exponential'), { size: hs, weight: 700 }), d.measure('0.5', { size, font: 'mono', weight: 700 })) + 14 * u;
  const arrW = (P ? 16 : 20) * u, divW = d.measure('÷ 4', { size: fz(S, 12), weight: 700, font: 'mono' }) + 14 * u;
  const x0 = R.x, xScore = x0 + wordW, xExp = xScore + scoreW + arrW, xProb = xExp + expW + divW;
  const tl = d.wrap(S.l(`puntajes de la red para ${q(S, D.start.join(' '))}`, `the network’s scores for ${q(S, D.start.join(' '))}`), R.w * 0.72, { size: fz(S, 14), weight: 800 }).length;
  const top = R.y + 18 * k + tl * fz(S, 14) * u * 1.3 + 12 * k;
  const head = top + 6 * k, rowsY = head + 24 * k;
  const rh = clamp((R.y + R.h - rowsY - 46 * k) / 4, 19 * k, 46 * k);
  return { R, k, u, P, size, hs, wordW, scoreW, expW, arrW, divW, xScore, xExp, xProb, head, rowsY, rh };
}
export function drawSoftmax(S: Frame, D: Demo) {
  const { d, pal: p } = S, g = smGeom(S, D), { R, k, u } = g, w = tone(S, 'w'), lat = tone(S, 'lat'), err = tone(S, 'err');
  const ps = D.esP, z = ps.map((x) => zOf(x.c)), e = z.map((v) => Math.exp(v)), sumE = e.reduce((a, b) => a + b, 0);
  label(S, S.l(`puntajes de la red para ${q(S, D.start.join(' '))}`, `the network’s scores for ${q(S, D.start.join(' '))}`), R.x, R.y + 2 * k, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink, w: R.w * 0.72 });
  label(S, S.l('de ejemplo', 'example'), R.x + R.w, R.y + 4 * k, { align: 'right', size: fz(S, 12), italic: true, color: p.mute });
  // encabezados de columna
  const hA = [fr(S, 'scores', 0.2, 0.3), fr(S, 'exp', 0.08, 0.2), fr(S, 'sum-divide', 0.45, 0.58)];
  label(S, S.l('puntaje', 'score'), g.xScore + g.scoreW / 2, g.head, { size: g.hs, weight: 800, color: w.ink, a: hA[0] });
  label(S, S.l('exponencial', 'exponential'), g.xExp + g.expW / 2, g.head, { size: g.hs, weight: 800, color: p.ink2, a: hA[1] });
  label(S, S.l('probabilidad', 'probability'), g.xProb, g.head, { align: 'left', size: g.hs, weight: 800, color: lat.ink, a: hA[2] });
  // «softmax»: llave sobre las dos columnas que lo forman
  const smA = fr(S, 'not-probs', 0.72, 0.86);
  if (smA > 0.01) {
    const y = g.head - 8 * k, x1 = g.xExp - 4 * u, x2 = R.x + R.w;
    d.line(x1, y, x2, y, w.c, 2, undefined, smA); d.line(x1, y, x1, y + 6 * k, w.c, 2, undefined, smA); d.line(x2, y, x2, y + 6 * k, w.c, 2, undefined, smA);
    label(S, 'softmax', (x1 + x2) / 2, y - 3 * k, { base: 'bottom', size: fz(S, 14), weight: 800, color: w.ink, a: smA, halo: true });
  }
  ps.forEach((x, i) => {
    const y = g.rowsY + i * g.rh, cy = y + g.rh / 2;
    d.text(x.w, g.xScore - 10 * u, cy, { size: g.size, weight: 700, color: p.ink, align: 'right', base: 'middle', a: fr(S, 'scores', 0.1 + 0.04 * i, 0.2 + 0.04 * i) });
    // puntaje (con su barrita alrededor del cero en pantallas anchas)
    const sa = fr(S, 'scores', 0.36 + 0.12 * i, 0.46 + 0.12 * i);
    const zt = Math.abs(z[i]) < 1e-9 ? '0' : num(S, z[i], 1);
    d.text(zt, g.xScore + g.scoreW / 2, cy, { size: g.size, weight: 800, font: 'mono', color: w.ink, align: 'center', base: 'middle', a: sa });
    // exponencial
    const ea = fr(S, 'exp', 0.38 + 0.11 * i, 0.48 + 0.11 * i);
    if (ea > 0.01) {
      d.text('→', g.xScore + g.scoreW + g.arrW / 2, cy, { size: fz(S, 14), color: p.mute, align: 'center', base: 'middle', a: ea });
      d.text(short1(S, e[i]), g.xExp + g.expW / 2, cy, { size: g.size, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', a: ea });
    }
    // dividir entre la suma → probabilidad
    const da = fr(S, 'sum-divide', 0.5 + 0.08 * i, 0.6 + 0.08 * i);
    if (da > 0.01) {
      d.text('÷ 4', g.xExp + g.expW + g.divW / 2, cy, { size: fz(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'center', base: 'middle', a: da });
      probBars(S, { x: g.xProb, y, w: R.x + R.w - g.xProb, h: g.rh }, [{ label: '', p: (e[i] / sumE) * fr(S, 'sum-divide', 0.56 + 0.08 * i, 0.72 + 0.08 * i, 'io'), text: pct(S, e[i] / sumE), hot: fr(S, 'softmax-result', 0.1, 0.25) * 0 }], { labelW: 0, rowH: g.rh, slots: 1, a: da });
    }
  });
  // sumas bajo cada columna
  const sy = g.rowsY + 4 * g.rh + 8 * k;
  const s1 = fr(S, 'not-probs', 0.28, 0.42), s2 = fr(S, 'sum-divide', 0.14, 0.3), s3 = fr(S, 'softmax-result', 0.4, 0.55);
  if (s1 > 0.01) {
    d.line(g.xScore, sy - 4 * k, g.xScore + g.scoreW, sy - 4 * k, p.lineStrong, 1.2, undefined, s1);
    label(S, `${S.l('suma', 'sum')} ${num(S, z.reduce((a, b) => a + b, 0), 1)}`, g.xScore + g.scoreW / 2, sy, { size: fz(S, 13), weight: 800, color: err.ink, a: s1 });
    label(S, S.l('no suma 100 %', 'not 100%'), g.xScore + g.scoreW / 2, sy + 20 * k, { size: fz(S, 12), weight: 700, color: err.ink, a: fr(S, 'not-probs', 0.45, 0.58) * (1 - s2) });
  }
  if (s2 > 0.01) {
    d.line(g.xExp, sy - 4 * k, g.xExp + g.expW, sy - 4 * k, p.lineStrong, 1.2, undefined, s2);
    label(S, `${S.l('suma', 'sum')} ${short1(S, sumE)}`, g.xExp + g.expW / 2, sy, { size: fz(S, 13), weight: 800, color: p.ink, a: s2 });
  }
  if (s3 > 0.01) {
    d.line(g.xProb, sy - 4 * k, R.x + R.w, sy - 4 * k, p.lineStrong, 1.2, undefined, s3);
    label(S, `${S.l('suma', 'sum')} ${pct(S, 1)}  ✓`, R.x + R.w, sy, { align: 'right', size: fz(S, 13), weight: 800, color: lat.ink, a: s3 });
    label(S, S.l('las mismas barras que contamos', 'the same bars we counted'), R.x + R.w, sy + 20 * k, { align: 'right', size: fz(S, 12), weight: 700, color: p.mute, a: fr(S, 'softmax-result', 0.7, 0.82) });
  }
}

// ═════════ temperatura ═════════
export function drawTemp(S: Frame, D: Demo) {
  let R = area(S);
  const { d, pal: p } = S, k = kk(S), u = S.u, P = S.portrait, short = isShort(S), w = tone(S, 'w');
  const T = clamp(S.p.temp ?? 1, 0.05, 5);
  const ps = D.esP, z = ps.map((x) => zOf(x.c)), pr = softmax(z, T);
  // lectura grande de la temperatura y la regla
  const ra = fr(S, 'temp', 0.05, 0.18);
  R = { ...R, y: R.y + vshift(S, R, 44 * k + 16 * k + 4 * 42 * k + 84 * k) };
  d.text(`${S.l('temperatura', 'temperature')} = ${S.n(T, 2)}`, R.x, R.y + 2 * k, { size: fz(S, P ? 18 : 20), weight: 800, color: w.ink, base: 'top', a: ra });
  const rule = S.l('puntaje ÷ temperatura → softmax', 'score ÷ temperature → softmax');
  if (P || short) label(S, rule, R.x, R.y + 30 * k, { align: 'left', size: fz(S, 13), weight: 700, color: p.mute, a: fr(S, 'temp', 0.3, 0.45) });
  else label(S, rule, R.x + R.w, R.y + 6 * k, { align: 'right', size: fz(S, 13), weight: 700, color: p.mute, a: fr(S, 'temp', 0.3, 0.45) });
  // barras con la columna «puntaje ÷ T»
  const top = R.y + (P || short ? 58 : 44) * k;
  const drawsA = fr(S, 'temp-zero', 0.02, 0.16);
  const drawsH = (P ? 96 : short ? 40 : 70) * k;
  const bh = Math.min(4 * 42 * k, R.y + R.h - top - drawsH - 16 * k);
  const preW = d.measure('−14.0', { size: fz(S, 13), weight: 700, font: 'mono' }) + 18 * u;
  const brect: Rect = short ? { x: R.x, y: top, w: R.w * 0.56, h: bh } : { x: R.x, y: top + 16 * k, w: R.w, h: bh };
  label(S, S.l('puntaje ÷ T', 'score ÷ T'), brect.x + d.measure('oscuro', { size: fz(S, 15), weight: 700 }) + 12 * u + preW - 10 * u, brect.y - 4 * k, { align: 'right', base: 'bottom', size: fz(S, 12), weight: 700, color: w.ink, a: fr(S, 'temp', 0.45, 0.6) });
  probBars(S, brect, ps.map((x, i) => ({ label: x.w, p: pr[i], pre: num(S, z[i] / T, 1).replace(/^−?0\.0$/, '0') })), { slots: 4, preW, a: fr(S, 'temp', 0.08, 0.2) });
  // diez sorteos con esta temperatura
  if (drawsA > 0.01) {
    const picks = D.draws.map((uu) => choose(probs(rowsFor(D.m, D.W.es)!, T), uu)).map((i) => ps[i].w);
    const dy = short ? top : brect.y + bh + 14 * k, dx = short ? R.x + R.w * 0.6 : R.x, dw = short ? R.w * 0.4 : R.w;
    label(S, S.l('diez sorteos con esta temperatura', 'ten draws at this temperature'), dx, dy, { align: 'left', size: fz(S, 13), weight: 800, color: p.ink2, a: drawsA, w: dw });
    d.withAlpha(drawsA, () => chipRow(S, dx, dy + (short ? 38 : 22) * k, dw, picks, { size: fz(S, 13) }));
  }
}

// ═════════ top-k y top-p ═════════
export function drawTop(S: Frame, D: Demo) {
  let R = area(S);
  const { d, pal: p } = S, k = kk(S), u = S.u, P = S.portrait, w = tone(S, 'w');
  const ps = D.esP;
  R = { ...R, y: R.y + vshift(S, R, 44 * k + 4 * 44 * k + 40 * k) };
  const aP = fr(S, 'topp', 0, 0.1), aA = fr(S, 'topp-adapt', 0, 0.1);
  const top = R.y + 44 * k, bh = Math.min(4 * 44 * k, R.h - 70 * k);
  const brect: Rect = { x: R.x, y: top, w: R.w, h: bh };
  // top-k
  if (aP < 0.99) d.withAlpha(1 - aP, () => {
    d.text(`top-k · k = 2`, R.x, R.y + 2 * k, { size: fz(S, 18), weight: 800, color: w.ink, base: 'top', a: fr(S, 'topk', 0.3, 0.42) });
    const cut = fr(S, 'topk', 0.42, 0.55), re = fr(S, 'topk', 0.6, 0.82, 'io');
    const tr = truncate(ps, { topK: 2 });
    probBars(S, brect, tr.map((x) => ({ label: x.w, p: x.keep ? lerp(x.p, x.q, re) : x.p * (1 - cut), cut: x.keep ? 0 : cut, text: pct(S, x.keep ? lerp(x.p, x.q, re) : x.p) })), { slots: 4 });
    label(S, S.l('azul y gris se reparten de nuevo el 100 %', 'blue and gray share the full 100% again'), R.x + R.w, top + bh + 8 * k, { align: 'right', size: fz(S, 13), weight: 800, color: w.ink, a: re, w: R.w });
  });
  // top-p
  if (aP > 0.01 && aA < 0.99) d.withAlpha(aP * (1 - aA), () => {
    d.text(`top-p · p = ${pct(S, 0.7)}`, R.x, R.y + 2 * k, { size: fz(S, 18), weight: 800, color: w.ink, base: 'top', a: fr(S, 'topp', 0.3, 0.42) });
    const acc = fr(S, 'topp', 0.4, 0.62), cut = fr(S, 'topp', 0.66, 0.78), re = fr(S, 'topp', 0.8, 0.95, 'io');
    const tr = truncate(ps, { topP: 0.7 });
    let s = 0;
    const preW = d.measure('87.5 %', { size: fz(S, 13), weight: 700, font: 'mono' }) + 18 * u;
    const rows = tr.map((x, i) => { s += x.p; return { label: x.w, p: x.keep ? lerp(x.p, x.q, re) : x.p * (1 - cut), cut: x.keep ? 0 : cut, text: pct(S, x.keep ? lerp(x.p, x.q, re) : x.p), pre: fr(S, 'topp', 0.4 + 0.05 * i, 0.5 + 0.05 * i) > 0.5 ? pct(S, s) : '' }; });
    const geo = probBars(S, brect, rows, { slots: 4, preW });
    label(S, S.l('juntas', 'together'), geo[0].x0 - 10 * u, top - 4 * k, { align: 'right', base: 'bottom', size: fz(S, 12), weight: 700, color: w.ink, a: acc });
    // la raya del 70 %: entre la segunda y la tercera fila
    const ly = geo[1].y + geo[1].h;
    d.line(R.x, ly, R.x + R.w, ly, w.c, 2, [6, 4], cut);
    label(S, S.l('azul y gris ya juntan 75 %, más que 70 %', 'blue and gray already reach 75%, more than 70%'), R.x + R.w, top + bh + 8 * k, { align: 'right', size: fz(S, 13), weight: 800, color: w.ink, a: cut, w: R.w });
  });
  // se adapta: tras «cielo» deja una; tras «es», dos
  if (aA > 0.01) d.withAlpha(aA, () => {
    d.text(`top-p · p = ${pct(S, 0.7)}`, R.x, R.y + 2 * k, { size: fz(S, 18), weight: 800, color: w.ink, base: 'top' });
    const two = P ? [{ x: R.x, y: top, w: R.w, h: (R.y + R.h - top) * 0.32 }, { x: R.x, y: top + (R.y + R.h - top) * 0.42, w: R.w, h: (R.y + R.h - top) * 0.58 }] : [{ x: R.x, y: top + 20 * k, w: R.w * 0.46, h: 44 * k }, { x: R.x + R.w * 0.54, y: top + 20 * k, w: R.w * 0.46, h: 4 * 40 * k }];
    const ctxs = [D.W.cielo, D.W.es];
    ctxs.forEach((c, j) => {
      const a = fr(S, 'topp-adapt', 0.12 + 0.35 * j, 0.25 + 0.35 * j);
      if (a < 0.01) return;
      const r = two[j], tr = truncate(probs(rowsFor(D.m, c)!), { topP: 0.7 });
      const kept = tr.filter((x) => x.keep).length;
      d.withAlpha(a, () => {
        label(S, S.l(`después de ${q(S, c)}: deja ${kept}`, `after ${q(S, c)}: keeps ${kept}`), r.x, r.y - 22 * k, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink });
        probBars(S, { x: r.x, y: r.y, w: r.w, h: P ? Math.min(r.h, tr.length * 36 * k) : tr.length * 40 * k }, tr.map((x) => ({ label: wl(S, x.w), p: x.p, cut: x.keep ? 0 : 1 })), { rowH: Math.min(P ? 34 * k : 40 * k, (P ? r.h : 160 * k) / Math.max(1, tr.length)) });
      });
    });
  });
  void fitSize; void alpha;
}
