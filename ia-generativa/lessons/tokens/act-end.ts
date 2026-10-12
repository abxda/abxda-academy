// Actos 7 y 8: lo que el modelo no ve (las letras dentro de un token, las cifras en bloques de tres),
// los límites en tokens, el resumen y el puente a la atención.
import { alpha, badge, box, clamp, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REAL, type Lg } from './data';
import { ap, area, caption, drawBlocks, fitBlocks, fitText, fr, isShort, mv, note, textBox } from './viz';

// ═════════ ¿cuántas erres? ═════════
export function drawLetters(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, A = area(S), short = isShort(S), er = tone(S, 'err'), lat = tone(S, 'lat');
  const W = REAL.word[L], word = W.text.trim(), letters = [...word];
  const k = mv(S, 'one-number', 0.08, 0.38);   // las letras se juntan en un solo token
  // la pregunta
  fitText(S, REAL.ask[L].text, A.x + A.w / 2, A.y, A.w, { size: short ? 14 : 17, weight: 700, color: p.ink, align: 'center', a: ap(S, 'ask', 0.03, 0.15) });
  // la palabra, letra por letra
  const size = Math.min(short ? 24 : 32, (A.w * 0.7) / (letters.length * 0.62 + 2) / u);
  const cw = d.measure('m', { size, weight: 700, font: 'mono' });
  const sp = lerp(12 * u, 0, k), wordW = letters.length * cw + (letters.length - 1) * sp;
  const yW = A.y + (short ? 26 : 40) * u, bh = size * 1.3 * u, x0 = A.x + (A.w - wordW) / 2;
  const aW = ap(S, 'ask', 0.25, 0.4), hiR = ap(S, 'ask', 0.5, 0.65) * (1 - k);
  if (aW > 0) d.withAlpha(aW, () => {
    if (k > 0) { const pad = 12 * u; d.rect(x0 - pad, yW - 4 * u, wordW + 2 * pad, bh + 8 * u, { fill: alpha(lat.c, 0.22 * k), stroke: lat.c, lw: 1.6, r: 4, a: k }); }
    letters.forEach((c, i) => {
      const x = x0 + i * (cw + sp);
      if (c === 'r' && hiR > 0) d.rect(x - 2 * u, yW - 2 * u, cw + 4 * u, bh + 4 * u, { fill: alpha(er.c, 0.18), stroke: er.c, lw: 1.4, r: 3, a: hiR });
      d.text(c, x + cw / 2, yW + bh / 2, { size, weight: 700, font: 'mono', color: c === 'r' && hiR > 0.5 ? er.ink : k > 0.5 ? lat.ink : p.ink, align: 'center', base: 'middle' });
    });
    const aC = ap(S, 'ask', 0.6, 0.75) * (1 - ap(S, 'one-number', 0.05, 0.2));
    if (aC > 0) { const room = A.x + A.w - (x0 + wordW + 14 * u); if (room > 64 * u) badge(S, S.l('3 erres', '3 r’s'), x0 + wordW + 14 * u, yW + bh / 2, { tone: 'err', align: 'left', a: aC }); else badge(S, S.l('3 erres', '3 r’s'), A.x + A.w / 2, yW + bh + 22 * u, { tone: 'err', a: aC }); }
  });
  // un solo número
  const yId = yW + bh + 12 * u, aId = ap(S, 'one-number', 0.38, 0.52);
  const capH = d.wrap(S.l('1 token: al modelo le llega un solo número (GPT-4o)', '1 token: the model gets a single number (GPT-4o)'), A.w, { size: 12, weight: 600 }).length * 15.6 * u;
  if (aId > 0) d.withAlpha(aId, () => {
    d.text(String(W.ids[0]), A.x + A.w / 2, yId, { size: short ? 16 : 20, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
    note(S, S.l('1 token: al modelo le llega un solo número (GPT-4o)', '1 token: the model gets a single number (GPT-4o)'), A.x + A.w / 2, yId + (short ? 20 : 26) * u, A.w, { align: 'center' });
  });
  // deletreada: una pieza por letra
  const aS = ap(S, 'spell', 0.35, 0.5);
  if (aS > 0) {
    const sp2 = REAL.spell[L], labels = sp2.pieces.map((s) => s.trim()), ids = sp2.ids.map(String), rid = ids[labels.indexOf('r')];
    const msg = S.l(`deletreada: ${labels.length} tokens; la «r» llega tres veces, siempre como ${rid}`, `spelled out: ${labels.length} tokens; “r” arrives three times, always as ${rid}`);
    const y = yId + (short ? 20 : 26) * u + capH + (short ? 6 : 12) * u, mh = d.wrap(msg, A.w, { size: 12, weight: 600 }).length * 15.6 * u;
    const r: Rect = { x: A.x, y: y + mh + 4 * u, w: A.w, h: A.y + A.h - y - mh - 4 * u };
    const lay = fitBlocks(S, labels, r, { size: short ? 14 : 18, minSize: 12, ids, center: true });
    const hiS = ap(S, 'spell', 0.6, 0.75);
    d.withAlpha(aS, () => {
      note(S, msg, A.x + A.w / 2, y, A.w, { align: 'center', color: p.ink2 });
      drawBlocks(S, labels, r, { ids, center: true, hi: (i) => (labels[i] === 'r' ? hiS : 0) }, lay);
    });
  }
}

// ═════════ las cifras en bloques de tres ═════════
export function drawDigits(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const N = REAL.num, digits = [...N.text];
  const size = short ? 22 : 30, cw = d.measure('0', { size, weight: 700, font: 'mono' }) + 9 * u, bh = size * 1.25 * u + 8 * u;
  const W = cw * digits.length, x0 = A.x + (A.w - W) / 2;
  const gapR = (short ? 34 : 54) * u;
  const y1 = A.y + (short ? 20 : 30) * u, y2 = y1 + bh + gapR;
  // grupos: los del tokenizador (123 · 456 · 7) y los nuestros (1 · 234 · 567)
  const groupsT: [number, number][] = []; let at = 0; for (const s of N.pieces) { groupsT.push([at, at + s.length]); at += s.length; }
  const groupsH: [number, number][] = [[0, 1], [1, 4], [4, 7]];
  const row = (y: number, groups: [number, number][], c: ReturnType<typeof tone>, a: number, ids?: readonly number[]) => d.withAlpha(a, () => {
    groups.forEach(([g0, g1], gi) => {
      const x = x0 + g0 * cw + 2 * u, w = (g1 - g0) * cw - 4 * u;
      d.rect(x, y, w, bh, { fill: alpha(c.c, 0.16 + 0.1 * (gi % 2)), stroke: c.c, lw: 1.5, r: 4 });
      for (let i = g0; i < g1; i++) d.text(digits[i], x0 + i * cw + cw / 2, y + bh / 2, { size, weight: 700, font: 'mono', color: c.ink, align: 'center', base: 'middle' });
      if (ids) d.text(String(ids[gi]), x + w / 2, y + bh + 3 * u, { size: 12, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    });
  });
  const a1 = ap(S, 'digits', 0.04, 0.16), aT = ap(S, 'digits', 0.55, 0.7);
  caption(S, aT > 0 ? S.l('GPT-4o: bloques de tres cifras desde la izquierda', 'GPT-4o: blocks of three digits from the left') : S.l('el número', 'the number'), A.x + A.w / 2, A.y, A.w, { align: 'center', a: a1 });
  if (aT < 1) d.withAlpha(a1 * (1 - aT), () => digits.forEach((c, i) => d.text(c, x0 + i * cw + cw / 2, y1 + bh / 2, { size, weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' })));
  if (aT > 0) row(y1, groupsT, lat, aT, N.ids);
  const aH = ap(S, 'digits-why', 0.04, 0.18);
  if (aH > 0) {
    caption(S, S.l('como lo leemos nosotros', 'how we read it'), A.x + A.w / 2, y2 - 18 * u, A.w, { align: 'center', a: aH });
    row(y2, groupsH, dat, aH);
    const names = [S.l('millón', 'million'), S.l('miles', 'thousands'), S.l('unidades', 'units')];
    d.withAlpha(ap(S, 'digits-why', 0.15, 0.3), () => groupsH.forEach(([g0, g1], i) => d.text(names[i], i === 0 ? x0 + g1 * cw - 2 * u : x0 + ((g0 + g1) / 2) * cw, y2 + bh + 4 * u, { size: 12, weight: 700, color: dat.ink, align: i === 0 ? 'right' : 'center', base: 'top' })));
    const aC = ap(S, 'digits-why', 0.62, 0.76);
    if (aC > 0) {
      const bw = Math.min(A.w, 290 * u), by = y2 + bh + (short ? 22 : 30) * u;
      if (by + 30 * u <= A.y + A.h + 4 * u) textBox(S, A.x + (A.w - bw) / 2, by, bw, S.l('cuentas exactas: una calculadora', 'exact math: a calculator'), 'dat', { a: aC });
    }
  }
}

// ═════════ los límites también se miden en tokens ═════════
export function drawLimits(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const bh = (short ? 22 : 30) * u, g = (short ? 26 : 44) * u, bw = A.w * 0.86, x = A.x;
  const y1 = A.y + (short ? 18 : 26) * u, y2 = y1 + bh + g;
  const bar = (y: number, label: string, fill: number, limitAt: number, c: ReturnType<typeof tone>, a: number) => d.withAlpha(a, () => {
    fitText(S, label, x, y - 18 * u, A.w, { size: 13, weight: 800, color: c.ink });
    d.rect(x, y, bw * limitAt, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
    d.rect(x, y, bw * limitAt * fill, bh, { fill: alpha(c.c, 0.55), stroke: c.c, lw: 1.2 });
    const lx = x + bw * limitAt;
    d.line(lx, y - 6 * u, lx, y + bh + 6 * u, p.ink, 2.5);
    fitText(S, S.l('límite', 'limit'), lx + 6 * u, y + bh / 2 - 8 * u, A.x + A.w - lx - 6 * u, { size: 12, weight: 800, color: p.ink });
  });
  bar(y1, S.l('lo que puede leer de una vez (tokens)', 'what it can read at once (tokens)'), mv(S, 'limits', 0.06, 0.4), 1, sig, ap(S, 'limits', 0.02, 0.12));
  bar(y2, S.l('lo que puede escribir (tokens)', 'what it can write (tokens)'), mv(S, 'limits', 0.3, 0.55), 0.35, lat, ap(S, 'limits', 0.25, 0.35));
  const aT = ap(S, 'limits', 0.6, 0.72);
  if (aT > 0) {
    const y = y2 + bh + (short ? 14 : 30) * u, w = Math.min(A.w, 420 * u);
    textBox(S, A.x + (A.w - w) / 2, y, w, S.l('antes de presupuestar: cuenta tokens con tus textos', 'before budgeting: count tokens on your texts'), 'w', { a: aT });
  }
  if (!short) note(S, S.l('ilustrativo: cada modelo publica sus límites en tokens', 'illustrative: each model publishes its limits in tokens'), A.x, A.y + A.h, A.w, { a: ap(S, 'limits', 0.4, 0.5), bottom: true });
}

// ═════════ resumen ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), land = !S.portrait;
  const labels = [S.l('texto', 'text'), S.l('tokenizador (BPE)', 'tokenizer (BPE)'), S.l('tokens', 'tokens'), S.l('números', 'numbers'), S.l('modelo', 'model')];
  const tones = ['ink', 'lat', 'lat', 'lat', 'ink'] as const;
  const gap = (short ? 18 : 24) * u, bh = (short ? 32 : 42) * u;
  const pos: Rect[] = labels.map((_, i) => {
    if (land) { const bw = (A.w - 4 * gap) / 5; return { x: A.x + i * (bw + gap), y: A.y + (short ? 6 : 24) * u, w: bw, h: bh }; }
    const bw = Math.min(230 * u, A.w), hh = 32 * u, gg = 12 * u; return { x: A.x + (A.w - bw) / 2, y: A.y + i * (hh + gg), w: bw, h: hh };
  });
  pos.forEach((r, i) => { const a = ap(S, 'recap', 0.03 + i * 0.07, 0.12 + i * 0.07); if (a > 0) box(S, r, labels[i], { tone: tones[i], a, size: land && A.w < 700 * u ? 12 : 13 }); });
  for (let i = 0; i < 4; i++) {
    const a = ap(S, 'recap', 0.1 + i * 0.07, 0.16 + i * 0.07); if (a <= 0) continue;
    const P = pos[i], Q = pos[i + 1];
    if (land) d.arrow(P.x + P.w + 2 * u, P.y + P.h / 2, Q.x - 3 * u, Q.y + Q.h / 2, p.ink2, 1.6, 7, a);
    else d.arrow(P.x + P.w / 2, P.y + P.h + 1 * u, Q.x + Q.w / 2, Q.y - 2 * u, p.ink2, 1.6, 6, a);
  }
  const last = pos[4], ty = land ? last.y + last.h + (short ? 22 : 50) * u : last.y + last.h + 22 * u;
  const tags = [
    { l: S.l('lo común: una pieza, barato', 'common: one piece, cheap'), t: 'dat' as const, a: ap(S, 'recap', 0.55, 0.65) },
    { l: S.l('lo raro y lo poco visto: más piezas, más caro', 'rare or little seen: more pieces, costlier'), t: 'err' as const, a: ap(S, 'recap', 0.72, 0.82) },
  ];
  tags.forEach((tg, i) => { if (tg.a > 0) badge(S, tg.l, A.x + A.w / 2, ty + i * (short ? 26 : 34) * u, { tone: tg.t, a: tg.a, size: 13 }); });
}

// ═════════ puente: ¿a cuáles otros mirar? ═════════
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, A = area(S), short = isShort(S), lat = tone(S, 'lat');
  const labels = REAL.sent[L].pieces.map((s) => s.trim());
  const r: Rect = { x: A.x, y: A.y + A.h * (short ? 0.28 : 0.4), w: A.w, h: A.h * 0.3 };
  const lay = fitBlocks(S, labels, r, { size: short ? 15 : 18, minSize: 12, center: true, maxRows: 2, breakAt: 4 });
  const B = drawBlocks(S, labels, r, { center: true, show: fr(S, 'bridge', 0.03, 0.25) * labels.length }, lay);
  const last = B.boxes[B.boxes.length - 1], aArc = ap(S, 'bridge', 0.3, 0.5);
  if (last && aArc > 0) B.boxes.slice(0, -1).forEach((b, i) => {
    if (Math.abs(b.y - last.y) > 4) return;
    const x1 = last.x + last.w / 2, x2 = b.x + b.w / 2, h = Math.min(short ? 26 * u : 50 * u, 10 * u + Math.abs(x1 - x2) * (short ? 0.08 : 0.2)), yb = b.y + b.h + 3 * u;
    const pts: [number, number][] = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([lerp(x1, x2, t), yb + Math.sin(Math.PI * t) * h]); }
    d.polyline(pts, lat.c, 1.4, { a: aArc * (0.25 + 0.5 * clamp(1 - i / B.boxes.length)) });
  });
  fitText(S, S.l('¿a cuáles otros mirar?', 'which others to look at?'), A.x + A.w / 2, A.y + A.h * (short ? 0.04 : 0.12), A.w, { size: short ? 17 : 22, weight: 800, color: lat.ink, align: 'center', a: ap(S, 'bridge', 0.45, 0.6) });
  const aN = ap(S, 'bridge', 0.7, 0.82);
  if (aN > 0) d.withAlpha(aN, () => {
    if (short) fitText(S, S.l('Siguiente: Atención', 'Next: Attention'), A.x + A.w / 2, A.y + A.h - 18 * u, A.w, { size: 16, weight: 800, align: 'center', color: p.ink });
    else {
      caption(S, S.l('Siguiente', 'Next'), A.x + A.w / 2, A.y + A.h - 50 * u, A.w, { align: 'center' });
      fitText(S, S.l('Atención', 'Attention'), A.x + A.w / 2, A.y + A.h - 32 * u, A.w, { size: 24, weight: 800, align: 'center', color: p.ink });
    }
  });
  if (!short && !S.portrait) neu(S, A.x + A.w - 70 * u, A.y + A.h - 60 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: ap(S, 'bridge', 0.5, 0.7) });
}
