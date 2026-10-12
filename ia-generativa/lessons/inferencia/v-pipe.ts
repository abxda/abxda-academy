// Vista de las dos fases: tu mensaje (arriba) → el modelo (en medio) → la respuesta (abajo), y al pie la explicación del
// paso o la línea de tiempo. Segmentos: example · autoreg · prefill · first-token · decode · one-by-one · phases-time.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { prefillTime, decodeTime } from './model';
import { WORDS, area, chip, curveArrow, fitText, fr, fz, lg, lh, para, paraH, secs, tight, tok } from './ui';

interface PL { msg: Rect[]; ans: Rect[]; model: Rect; foot: Rect; msgLab: [number, number]; ansLab: [number, number]; loopX: number; th: number }

function layout(S: Frame): PL {
  const u = S.u, R = area(S), T = tight(S);
  const cols = S.portrait ? 3 : 6, rows = 6 / cols, gap = 6 * u, loopW = 30 * u;
  const usableW = R.w - loopW;
  const sw = Math.min(118 * u, (usableW - (cols - 1) * gap) / cols);
  const labH = fz(S, 12) * u + 6 * u;
  const th = Math.max(fz(S, 13) * u + 10 * u, Math.min(44 * u, R.h * (T ? 0.075 : 0.085)));
  const rowsH = rows * th + (rows - 1) * gap;
  const mh = Math.max(fz(S, 14) * u * 2.2, Math.min(70 * u, R.h * (T ? 0.15 : 0.16)));
  const arrowGap = Math.max(24 * u, Math.min(56 * u, R.h * (T ? 0.08 : 0.1)));
  const footH = Math.max(56 * u, R.h - (labH + rowsH + arrowGap + mh + arrowGap + labH + rowsH) - 10 * u);
  const blockW = cols * sw + (cols - 1) * gap;
  const x0 = R.x + (usableW - blockW) / 2;
  // si sobra alto (escritorio), el conjunto baja un poco para quedar centrado con el pie
  const used = 2 * (labH + rowsH) + 2 * arrowGap + mh + 10 * u, footNeed = Math.max(90 * u, lh(S, 13) * 5);
  let y = R.y + labH + Math.max(0, (R.h - used - footNeed) * 0.45);
  const msg: Rect[] = [], ans: Rect[] = [];
  for (let i = 0; i < 6; i++) msg.push({ x: x0 + (i % cols) * (sw + gap), y: y + Math.floor(i / cols) * (th + gap), w: sw, h: th });
  y += rowsH + arrowGap;
  const mw = T ? blockW : Math.min(blockW, 420 * u);
  const model: Rect = { x: x0 + (blockW - mw) / 2, y, w: mw, h: mh };
  y += mh + arrowGap + labH;
  for (let i = 0; i < 6; i++) ans.push({ x: x0 + (i % cols) * (sw + gap), y: y + Math.floor(i / cols) * (th + gap), w: sw, h: th });
  y += rowsH + 10 * u;
  const foot: Rect = { x: R.x, y, w: R.w, h: Math.max(40 * u, R.y + R.h - y) };
  void footH;
  return { msg, ans, model, foot, msgLab: [x0, msg[0].y - 5 * u], ansLab: [x0, ans[0].y - 5 * u], loopX: x0 + blockW + loopW * 0.55, th };
}

/** Cuántos tokens de la respuesta se ven al final de cada momento (y el que está apareciendo). */
function answerShown(S: Frame): number {
  if (!S.on('prefill')) return 0;
  if (!S.on('decode')) return fr(S, 'prefill', 0.8, 0.92);
  if (!S.on('one-by-one')) return 1 + 3 * fr(S, 'decode', 0.2, 0.92, 'lin');
  if (!S.on('phases-time')) return 4 + 2 * fr(S, 'one-by-one', 0.68, 0.95, 'lin');
  return 6;
}

export function drawPipe(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S), W = WORDS[lg(S)];
  const lat = tone(S, 'lat'), sig = tone(S, 'sig'), dat = tone(S, 'dat');
  // ── tu mensaje ──
  const msgA = (i: number) => fr(S, 'example', 0.06 + 0.07 * i, 0.14 + 0.07 * i);
  const pulseIn = S.between('prefill', 'first-token') ? Math.sin(Math.PI * fr(S, 'prefill', 0.12, 0.42, 'lin')) : 0;
  // en la decodificación, cada vuelta «lee» todo el texto: un destello breve sobre los tokens
  let turnFlash = 0;
  if (S.between('decode', 'phases-time')) {
    const sh = answerShown(S), f = sh - Math.floor(sh);
    turnFlash = sh < 6 && f > 0.02 ? Math.sin(Math.PI * clamp(f / 0.5)) : 0;
  }
  L.msg.forEach((r, i) => tok(S, r, W.msg[i], { a: msgA(i), hot: Math.max(pulseIn, turnFlash * 0.6) }));
  d.withAlpha(fr(S, 'example', 0.5, 0.62), () => {
    fitText(S, S.l('tu mensaje · 6 tokens', 'your message · 6 tokens'), L.msgLab[0], L.msgLab[1], L.model.w, { size: 12.5, weight: 700, color: lat.ink, base: 'bottom' });
  });
  // ── el modelo ──
  const mA = fr(S, 'autoreg', 0, 0.15);
  const m = L.model;
  let sweep = -1;
  if (S.between('prefill', 'first-token')) sweep = fr(S, 'prefill', 0.42, 0.74, 'lin');
  else if (S.between('decode', 'phases-time')) { const sh = answerShown(S), f = sh - Math.floor(sh); if (sh < 6 && f > 0.02) sweep = clamp((f - 0.15) / 0.6); }
  d.withAlpha(mA, () => {
    d.rect(m.x, m.y, m.w, m.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.6, r: 5 });
    // bloques del modelo: barras finas; la pasada las recorre de arriba abajo
    const nb = 4, bx = m.x + m.w * 0.42, bw = m.w * 0.52, bh = (m.h - 14 * u) / nb;
    for (let b = 0; b < nb; b++) {
      const lit = sweep >= 0 && sweep >= b / nb && sweep < (b + 1) / nb + 0.25 ? 1 : 0;
      d.rect(bx, m.y + 7 * u + b * bh + 1.5 * u, bw, bh - 3 * u, { fill: alpha(dat.c, 0.12 + 0.55 * lit), stroke: alpha(dat.c, 0.6), lw: 1, r: 2 });
    }
    if (m.h >= fz(S, 16) * u * 2.5) {
      fitText(S, S.l('modelo', 'model'), m.x + m.w * 0.21, m.y + m.h * 0.36, m.w * 0.36, { size: 16, weight: 800, color: p.ink, align: 'center', base: 'middle' });
      fitText(S, S.l('bloques', 'blocks'), m.x + m.w * 0.21, m.y + m.h * 0.66, m.w * 0.36, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'middle' });
    } else fitText(S, S.l('modelo', 'model'), m.x + m.w * 0.21, m.y + m.h * 0.5, m.w * 0.36, { size: 15, weight: 800, color: p.ink, align: 'center', base: 'middle' });
  });
  // fase: rótulo a la izquierda arriba del modelo
  const ph1 = fr(S, 'prefill', 0, 0.1) * (1 - fr(S, 'decode', 0, 0.1)), ph2 = fr(S, 'decode', 0.02, 0.12) * (S.on('phases-time') ? 1 - fr(S, 'phases-time', 0, 0.1) : 1);
  // la fase, como leyenda sobre el borde inferior derecho del modelo (la flecha de salida nace a la izquierda)
  const phY = m.y + m.h;
  if (ph1 > 0.01) chip(S, S.l('1 · llenado (prefill)', '1 · prefill'), m.x + m.w - 6 * u, phY, 'dat', { a: ph1, align: 'right', maxW: m.w * 0.6, fill: 0.95 });
  if (ph2 > 0.01) chip(S, S.l('2 · decodificación (decode)', '2 · decode'), m.x + m.w - 6 * u, phY, 'sig', { a: ph2, align: 'right', maxW: m.w * 0.6, fill: 0.95 });
  // flechas mensaje → modelo (todas a la vez en el llenado)
  const arrowsIn = S.between('prefill', 'decode') ? fr(S, 'prefill', 0.12, 0.4) : S.on('decode') ? 1 : 0;
  if (arrowsIn > 0) {
    // en vertical el mensaje ocupa dos filas: basta una flecha por columna, desde la fila de abajo
    const srcs = S.portrait ? [3, 4, 5] : [0, 1, 2, 3, 4, 5];
    d.withAlpha(S.on('decode') ? 0.35 : 1, () => srcs.forEach((i, j) => {
      const r = L.msg[i], x1 = r.x + r.w / 2, y1 = r.y + r.h + 2 * u, x2 = m.x + m.w * (0.15 + 0.7 * (j / (srcs.length - 1))), y2 = m.y - 2 * u;
      const k = arrowsIn;
      d.arrow(x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, lat.c, 1.8, k > 0.95 ? 7 * Math.max(0.8, u) : 0.01);
    }));
  }
  // ── la respuesta ──
  const ansGhost = fr(S, 'autoreg', 0.15, 0.3);
  const shown = answerShown(S);
  d.withAlpha(fr(S, 'autoreg', 0.15, 0.3), () => fitText(S, S.l('respuesta', 'answer'), L.ansLab[0], L.ansLab[1], L.model.w, { size: 12.5, weight: 700, color: sig.ink, base: 'bottom' }));
  L.ans.forEach((r, i) => {
    const k = clamp(shown - i);
    const q = S.between('one-by-one', 'phases-time') && i >= 4 && k < 0.05 ? (i === 4 ? '?' : '') : '';
    tok(S, r, q, { ghost: true, a: ansGhost * (1 - k) });
    if (k > 0) tok(S, r, W.ans[i], { t: 'sig', a: k, hot: S.between('first-token', 'decode') && i === 0 ? fr(S, 'first-token', 0.05, 0.2) : 0 });
  });
  // flecha modelo → casilla que se está escribiendo
  const cur = Math.floor(shown), f = shown - cur;
  if (S.on('prefill') && cur < 6 && (f > 0.01 || (S.between('prefill', 'decode') && fr(S, 'prefill', 0.72, 0.8) > 0 && shown < 1))) {
    const target = L.ans[cur], k = S.between('prefill', 'decode') ? fr(S, 'prefill', 0.72, 0.82) : clamp(f / 0.35);
    const x1 = m.x + m.w * 0.3, y1 = m.y + m.h + 2 * u, x2 = target.x + target.w / 2, y2 = target.y - 3 * u;
    d.arrow(x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, sig.c, 2, k > 0.95 ? 7 * Math.max(0.8, u) : 0.01);
  }
  // bucle: cada token nuevo vuelve a entrar
  const loopA = fr(S, 'autoreg', 0.35, 0.6) * (S.on('prefill') ? 0.45 : 1);
  if (loopA > 0.01) d.withAlpha(loopA, () => {
    const lastAns = L.ans[S.portrait ? 2 : 5], yA = lastAns.y + lastAns.h / 2, x = L.loopX;
    curveArrow(S, lastAns.x + lastAns.w + 4 * u, yA, x + 10 * u, (yA + m.y + m.h / 2) / 2, m.x + m.w + 3 * u, m.y + m.h / 2, p.ink2, 1.8, fr(S, 'autoreg', 0.35, 0.6, 'lin'));
  });
  // ── el pie: una explicación a la vez ──
  const F = L.foot, fx = F.x + F.w / 2, fw = Math.min(F.w, 560 * u);
  const caption = (txt: string, a: number, t: 'ink' | 'lat' | 'sig' | 'dat' = 'ink') => {
    if (a <= 0.01) return;
    const h = paraH(S, txt, fw, 13.5, 650);
    para(S, txt, fx, F.y + Math.min(8 * u, F.h * 0.1), fw, { size: 13.5, weight: 650, align: 'center', color: t === 'ink' ? p.ink2 : tone(S, t).ink, a });
    void h;
  };
  const out = (k: string) => 1 - (S.on(k) ? fr(S, k, 0, 0.1) : 0);
  caption(S.l('una palabra = un token, para simplificar', 'one word = one token, to keep it simple'), fr(S, 'example', 0.6, 0.72) * out('autoreg'));
  caption(S.l('cada token nuevo se agrega al final y vuelve a entrar al modelo', 'each new token is added to the end and goes back into the model'), S.between('autoreg', 'prefill') ? fr(S, 'autoreg', 0.5, 0.65) : 0);
  caption(S.l('los seis tokens entran juntos: una sola pasada', 'all six tokens go in together: a single pass'), S.between('prefill', 'first-token') ? fr(S, 'prefill', 0.3, 0.42) : 0, 'dat');
  caption(S.l('la espera hasta el primer token crece con el largo de tu mensaje', 'the wait for the first token grows with the length of your message'), S.between('first-token', 'decode') ? fr(S, 'first-token', 0.25, 0.4) : 0, 'dat');
  if (S.between('decode', 'one-by-one')) {
    const k = Math.min(4, Math.max(2, Math.floor(shown) + 1));
    caption(S.l(`vuelta ${k}: otra pasada completa → 1 token`, `turn ${k}: another full pass → 1 token`), fr(S, 'decode', 0.15, 0.25), 'sig');
  }
  caption(S.l('en fila: cada token espera al anterior', 'single file: each token waits for the one before'), S.between('one-by-one', 'phases-time') ? fr(S, 'one-by-one', 0.15, 0.3) : 0, 'sig');
  // flecha «necesita el cuarto»
  if (S.between('one-by-one', 'phases-time')) {
    const a = fr(S, 'one-by-one', 0.12, 0.25) * (1 - fr(S, 'one-by-one', 0.66, 0.72));
    if (a > 0.01) d.withAlpha(a, () => {
      const r4 = L.ans[3], r5 = L.ans[4];
      d.rect(r5.x - 3 * u, r5.y - 3 * u, r5.w + 6 * u, r5.h + 6 * u, { stroke: sig.c, lw: 2, r: 4 });
      const sameRow = Math.abs(r4.y - r5.y) < 1;
      if (sameRow) curveArrow(S, r4.x + r4.w / 2, r4.y + r4.h + 3 * u, (r4.x + r5.x + r5.w) / 2, r4.y + r4.h + 22 * u, r5.x + r5.w / 2, r5.y + r5.h + 4 * u, sig.c, 1.8);
      else curveArrow(S, r4.x + r4.w + 3 * u, r4.y + r4.h / 2, r5.x + r5.w + 16 * u, (r4.y + r5.y) / 2 + r4.h / 2, r5.x + r5.w + 3 * u, r5.y + r5.h / 2, sig.c, 1.8);
    });
  }
  // ── línea de tiempo (phases-time) ──
  if (S.on('phases-time')) drawTimeline(S, F, fr(S, 'phases-time', 0.05, 0.15));
}

function drawTimeline(S: Frame, F: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat'), sig = tone(S, 'sig');
  const tp = prefillTime(2000), td = decodeTime(2000, 300), tot = tp + td;
  const bw = Math.min(F.w, 620 * u), bx = F.x + (F.w - bw) / 2, bh = Math.max(14 * u, 16 * u);
  const labS = 12.5, lh1 = fz(S, labS) * u * 1.3;
  const by = F.y + lh1 + 8 * u;
  const grow = fr(S, 'phases-time', 0.12, 0.85, 'lin');
  const wp = Math.max(3 * u, bw * tp / tot), wd = bw - wp;
  d.withAlpha(a, () => {
    d.rect(bx, by, bw, bh, { fill: p.surface2, r: 2 });
    const kp = clamp(grow / (tp / tot + 0.02)), kd = clamp((grow - tp / tot) / (1 - tp / tot));
    d.rect(bx, by, wp * kp, bh, { fill: dat.c, r: 2 });
    if (kd > 0) d.rect(bx + wp, by, wd * kd, bh, { fill: alpha(sig.c, 0.85), r: 2 });
    // rótulos: llenado arriba a la izquierda, decodificación abajo a la derecha
    const l1 = S.l(`llenado: 2 000 tokens · ≈ ${secs(S, tp)}`, `prefill: 2,000 tokens · ≈ ${secs(S, tp)}`);
    const l2 = S.l(`decodificación: 300 tokens · ≈ ${secs(S, td)}`, `decode: 300 tokens · ≈ ${secs(S, td)}`);
    d.withAlpha(kp > 0.5 ? 1 : 0, () => fitText(S, l1, bx, by - 5 * u, bw, { size: labS, weight: 700, color: dat.ink, base: 'bottom' }));
    d.withAlpha(clamp(kd * 3), () => fitText(S, l2, bx + bw, by + bh + 5 * u, bw, { size: labS, weight: 700, color: sig.ink, align: 'right', base: 'top' }));
    const est = S.l('estimación: modelo de 8 mil M de parámetros, una H100', 'estimate: 8B-parameter model, one H100');
    const ey = by + bh + 5 * u + lh1 + 4 * u;
    if (ey + lh1 < F.y + F.h + 18 * u) fitText(S, est, bx + bw / 2, ey, bw, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'top', italic: true, a: fr(S, 'phases-time', 0.5, 0.6) });
  });
}
