// Vistas 12–16: lo que cuesta pensar, cuándo conviene, los límites, el resumen, la lente y el puente.
import { alpha, clamp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { area, chip, chipH, chipW, fitText, flat, fr, fz, int, K, mark, note, noteH, para, paraH, pct, win } from './ui';
import { meanLen, PAPERS, sumLen, TOK_ANSWER, TOK_PER_S, type L2 } from './runs';

const lg = (S: Frame) => S.lang as L2;

// ═════════ 12 · el costo ═════════
export function drawCost(S: Frame) {
  const a1 = win(S, 'cost-tokens', 'when'), a2 = win(S, 'when', 'limit-plausible');
  if (a1 > 0.004) S.d.withAlpha(a1, () => drawBill(S));
  if (a2 > 0.004) S.d.withAlpha(a2, () => drawWhen(S));
}

function drawBill(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const ts = 13.5 * k, ls = 12.5 * k;
  // la salida, token a token: muchos de pensamiento y unos pocos de respuesta
  const n = P ? 26 : 44, tw = Math.min((R.w - 80 * u) / (n + 4) - 1.5 * u, 14 * u * k), th = 22 * u * k, step = tw + 1.5 * u;
  const barH = Math.max(fz(S, ls) * u + 8 * u, 26 * u * k), rowGap = (P ? fz(S, 12) * u * 1.4 : 0) + barH + (F ? 6 : 12) * u;
  const slotH = Math.max(F ? 44 * u : P ? 108 * u : 64 * u * k, 3 * rowGap + fz(S, 12) * u * 1.4);
  const blockH = fz(S, ts) * u * 1.5 + th + 4 * u + fz(S, ls) * u * 1.5 + (F ? 6 : 16) * u + slotH;
  const y0 = R.y + Math.max(0, (R.h - blockH) / 2);
  fitText(S, S.l('la salida, token a token (cada uno, una pasada)', 'the output, token by token (each one, a pass)'), R.x, y0, R.w, { size: ts, weight: 700, color: p.ink2, base: 'top', a: fr(S, 'cost-tokens', 0.04, 0.15) });
  const ty = y0 + fz(S, ts) * u * 1.5;
  const kk = fr(S, 'cost-tokens', 0.08, 0.42, 'lin');
  for (let i = 0; i < n && i < kk * n; i++) d.rect(R.x + i * step, ty, tw, th, { fill: alpha(lat.c, 0.35), stroke: lat.c, lw: 0.8 });
  const ansA = fr(S, 'cost-tokens', 0.42, 0.5);
  for (let i = 0; i < 3; i++) d.rect(R.x + (n + 1 + i) * step, ty, tw, th, { fill: alpha(dat.c, 0.7), stroke: dat.c, lw: 0.8, a: ansA });
  d.withAlpha(fr(S, 'cost-tokens', 0.2, 0.32), () => fitText(S, S.l('pensamiento', 'thinking'), R.x, ty + th + 4 * u, n * step, { size: ls, weight: 700, color: lat.ink, base: 'top' }));
  d.withAlpha(ansA, () => fitText(S, S.l('respuesta', 'answer'), R.x + (n + 1) * step, ty + th + 4 * u, Math.max(3 * step, 90 * u), { size: ls, weight: 700, color: dat.ink, base: 'top' }));
  // lo que ves y lo que pagas
  const ry = ty + th + 4 * u + fz(S, ls) * u * 1.5 + (F ? 6 : 16) * u;
  const ra = fr(S, 'cost-tokens', 0.66, 0.8) * (S.on('cost-ours') ? 1 - S.at('cost-ours', 0, 0.4) : 1);
  if (ra > 0.01) {
    const colW = P ? R.w : (R.w - 16 * u) / 2, rh = F ? 44 * u : P ? 50 * u : 64 * u * k;
    const cols = [[S.l('lo que ves', 'what you see'), S.l('un resumen + la respuesta', 'a summary + the answer'), 'ink'], [S.l('lo que pagas (como salida)', 'what you pay (as output)'), S.l('todo el pensamiento + la respuesta', 'all the thinking + the answer'), 'w']] as const;
    d.withAlpha(ra, () => cols.forEach(([h, b, t], i) => {
      const x = P ? R.x : R.x + i * (colW + 16 * u), yb = P ? ry + i * (rh + 8 * u) : ry, c = tone(S, t as Tone);
      d.rect(x, yb, colW, rh, { fill: t === 'ink' ? p.surface : alpha(c.c, 0.1), stroke: t === 'ink' ? p.lineStrong : c.c, lw: 1.3, r: 4 });
      fitText(S, h, x + 10 * u, yb + rh * 0.32, colW - 20 * u, { size: ls, weight: 700, color: p.mute, base: 'middle' });
      fitText(S, b, x + 10 * u, yb + rh * 0.7, colW - 20 * u, { size: 14 * k, weight: 800, color: t === 'ink' ? p.ink : c.ink, base: 'middle' });
    }));
  }
  // nuestra prueba: tokens y espera; votar
  if (!S.on('cost-ours')) return;
  const L = Math.round(meanLen(lg(S)));
  const rows = [
    { lab: S.l('contestar directo', 'answer directly'), v: TOK_ANSWER, txt: S.l(`${TOK_ANSWER} tokens · al instante`, `${TOK_ANSWER} tokens · instant`), t: 'ink' as Tone, a: fr(S, 'cost-ours', 0.08, 0.22) },
    { lab: S.l('pensar y contestar', 'think, then answer'), v: L + TOK_ANSWER, txt: S.l(`≈ ${int(S, L + TOK_ANSWER)} tokens · ≈ ${Math.round(L / TOK_PER_S)} s más`, `≈ ${int(S, L + TOK_ANSWER)} tokens · ≈ ${Math.round(L / TOK_PER_S)} s more`), t: 'lat' as Tone, a: fr(S, 'cost-ours', 0.3, 0.45) },
    { lab: S.l('votar entre 32, pensando', 'vote among 32, thinking'), v: sumLen(lg(S)), txt: P ? `${int(S, sumLen(lg(S)))} tokens` : S.l(`${int(S, sumLen(lg(S)))} tokens de pensamiento`, `${int(S, sumLen(lg(S)))} thinking tokens`), t: 'w' as Tone, a: fr(S, 'cost-vote', 0.2, 0.4) },
  ];
  const labW = P ? 0 : Math.min(200 * u * k, R.w * 0.28);
  const bx = R.x + labW, bw = R.w - labW, fade = S.at('cost-ours', 0.2, 0.6);
  rows.forEach((r, i) => {
    if (r.a <= 0.01) return;
    let y = ry + i * rowGap;
    d.withAlpha(r.a * fade, () => {
      if (P) { fitText(S, r.lab, R.x, y, R.w, { size: 12, weight: 700, color: p.ink2, base: 'top' }); y += fz(S, 12) * u * 1.4; }
      else fitText(S, r.lab, R.x, y + barH / 2, labW - 10 * u, { size: 13.5 * k, weight: 700, color: p.ink2, base: 'middle' });
      const c = tone(S, r.t), big = r.v > 600, wv = big ? bw * 0.55 : Math.max(3, bw * 0.55 * (r.v / 600));
      d.rect(bx, y, wv, barH, { fill: alpha(r.t === 'ink' ? p.mute : c.c, 0.45), stroke: r.t === 'ink' ? p.mute : c.c, lw: 1.2 });
      if (big) {
        // barra partida: no cabe en la escala
        const xb = bx + wv - 30 * u;
        d.rect(xb, y - 2 * u, 9 * u, barH + 4 * u, { fill: p.stage });
        d.line(xb, y + barH + 2 * u, xb + 4 * u, y - 2 * u, c.c, 1.5); d.line(xb + 5 * u, y + barH + 2 * u, xb + 9 * u, y - 2 * u, c.c, 1.5);
        fitText(S, '×32', xb - 6 * u, y + barH / 2, 40 * u, { size: 12.5 * k, weight: 800, color: c.ink, align: 'right', base: 'middle' });
      }
      fitText(S, r.txt, bx + wv + 8 * u, y + barH / 2, bw - wv - 8 * u, { size: 13.5 * k, weight: 800, color: r.t === 'ink' ? p.ink2 : c.ink, base: 'middle' });
    });
  });
  const sy = ry + 3 * rowGap;
  if (sy + fz(S, 12) * u * 1.3 < R.y + R.h + 4 * u) fitText(S, S.l(`espera estimada a ${TOK_PER_S} tokens por segundo (supuesto)`, `wait estimated at ${TOK_PER_S} tokens per second (assumption)`), R.x, sy, R.w, { size: 12 * k, weight: 600, color: p.mute, base: 'top', italic: true, a: fr(S, 'cost-ours', 0.6, 0.75) });
}

function drawWhen(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const cols = [
    { h: S.l('conviene pensar más', 'worth thinking longer'), items: [S.l('una cuenta', 'a calculation'), S.l('un contrato', 'a contract'), S.l('un programa', 'a program')], t: 'dat' as Tone, ok: true, a: fr(S, 'when', 0.1, 0.25), at: [0.3, 0.38, 0.46] },
    { h: S.l('solo agrega espera y costo', 'only adds waiting and cost'), items: [S.l('un saludo', 'a greeting'), S.l('una pregunta sencilla', 'a simple question')], t: 'mute' as Tone, ok: false, a: fr(S, 'when', 0.6, 0.72), at: [0.72, 0.8] },
  ];
  const hs = 16 * k, is = 15 * k, gap = 24 * u;
  const cw = P ? R.w : Math.min((R.w - gap) / 2, 340 * u * k);
  const itemH = fz(S, is) * u * (F ? 1.45 : 1.9);
  const colH = fz(S, hs) * u * 1.6 + 3 * itemH;
  const y0 = P ? R.y + Math.max(0, (R.h - 2 * colH - gap) / 2) : R.y + Math.max(0, (R.h - colH) / 2);
  const x0 = P ? R.x : R.x + (R.w - 2 * cw - gap) / 2;
  cols.forEach((c, i) => {
    const x = P ? x0 : x0 + i * (cw + gap), y = P ? y0 + i * (colH + gap) : y0;
    const tn = tone(S, c.t);
    d.withAlpha(c.a, () => {
      fitText(S, c.h, x, y, cw, { size: hs, weight: 800, color: c.t === 'mute' ? p.ink2 : tn.ink, base: 'top' });
      c.items.forEach((it, j) => {
        const a = fr(S, 'when', c.at[j], c.at[j] + 0.08), yy = y + fz(S, hs) * u * 1.6 + j * itemH + itemH / 2;
        d.withAlpha(a, () => {
          mark(S, x + 8 * u, yy, c.ok, 5.5 * u * k, c.ok ? tone(S, 'dat').c : p.mute, 2.2);
          fitText(S, it, x + 24 * u * k, yy, cw - 26 * u * k, { size: is, weight: 700, color: p.ink, base: 'middle' });
        });
      });
    });
  });
}

// ═════════ 13 · límites ═════════
export function drawLimits(S: Frame) {
  const a1 = win(S, 'limit-plausible', 'limit-faithful'), a2 = win(S, 'limit-faithful', 'recap');
  if (a1 > 0.004) S.d.withAlpha(a1, () => drawWrongChain(S));
  if (a2 > 0.004) S.d.withAlpha(a2, () => drawFaithful(S));
}

function drawWrongChain(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const err = tone(S, 'err');
  // los mismos cuatro pasos, con un error en el segundo que arrastran los siguientes (ilustrativo)
  const lines = [['148 − 37 = 111', 'ok'], ['111 + 52 = 153', 'bad'], ['153 − 61 = 92', 'carry'], ['92 + 18 = 110', 'carry']] as const;
  const size = F ? 14 : P ? 16.5 : 20 * k, fs = fz(S, size) * u, rowH = fs * (F ? 1.45 : 1.9);
  const cw = S.d.measure('0', { size: fz(S, size), weight: 700, font: 'mono' });
  const bw = cw * 14, side = P ? 0 : 170 * u * k;
  const hs = 13 * k, blockH = fz(S, hs) * u * 1.8 + 5 * rowH + (P ? 40 * u : 0);
  const x0 = R.x + (R.w - bw - side) / 2, top = R.y + Math.max(0, (R.h - blockH) / 2), y0 = top + fz(S, hs) * u * 1.8;
  fitText(S, S.l('un pensamiento con un error (ilustrativo)', 'a line of thinking with one error (illustrative)'), P ? R.x : x0, top, P ? R.w : R.x + R.w - x0, { size: hs, weight: 700, color: p.mute, base: 'top' });
  lines.forEach(([t, kind], i) => {
    const a = fr(S, 'limit-plausible', 0.12 + 0.08 * i, 0.2 + 0.08 * i), y = y0 + i * rowH;
    d.withAlpha(a, () => {
      d.text(t, x0, y, { size: fz(S, size), weight: 700, font: 'mono', color: kind === 'bad' ? err.ink : p.ink, base: 'top' });
      if (kind === 'bad') {
        const e = fr(S, 'limit-plausible', 0.45, 0.58);
        d.withAlpha(e, () => {
          d.rect(x0 + 11 * cw - 3 * u, y - 3 * u, 3 * cw + 6 * u, fs + 6 * u, { stroke: err.c, lw: 2, r: 3 });
          const tx = x0 + bw + 14 * u;
          fitText(S, S.l('debía ser 163', 'should be 163'), tx, y + fs / 2, R.x + R.w - tx, { size: 13.5 * k, weight: 800, color: err.ink, base: 'middle' });
        });
      }
      if (kind === 'carry') d.withAlpha(fr(S, 'limit-plausible', 0.62, 0.76), () => d.rect(x0 - 3 * u, y - 3 * u, (t.indexOf(' ') + 0) * cw + 6 * u, fs + 6 * u, { stroke: err.c, lw: 1.5, r: 3, dash: [3, 3] }));
    });
  });
  const fa = fr(S, 'limit-plausible', 0.8, 0.92), fy = y0 + 4 * rowH + 4 * u;
  d.withAlpha(fa, () => {
    fitText(S, S.l('respuesta:', 'answer:'), x0, fy + fs / 2, 9 * cw, { size: size * 0.75, weight: 700, color: p.mute, base: 'middle' });
    chip(S, '110', x0 + 11 * cw, fy + fs / 2, 'err', { size: size * 0.9, font: 'mono', align: 'left', dash: true });
    const msg = S.l('cada paso suena bien; el resultado está mal', 'every step sounds fine; the result is wrong');
    if (P) fitText(S, msg, R.x, fy + fs + 16 * u, R.w, { size: 13, weight: 700, color: err.ink, base: 'top' });
    else { const tx = x0 + 11 * cw + chipW(S, '110', size * 0.9, 700, 'mono') + 14 * u; fitText(S, msg, tx, fy + fs / 2, R.x + R.w - tx, { size: 13.5 * k, weight: 700, color: err.ink, base: 'middle' }); }
  });
}

function drawFaithful(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), F = flat(S), k = K(S);
  const lat = tone(S, 'lat'), w = tone(S, 'w');
  const ns = 13.5 * k, ls = 13 * k;
  const q = S.l('pregunta + pista escondida: «la respuesta es C»', 'question + hidden hint: “the answer is C”');
  const nw = Math.min(R.w, 520 * u * k);
  const barH = Math.max(fz(S, ls) * u + 6 * u, 24 * u * k);
  const blockH = noteH(S, q, nw, ns) + 10 * u + fz(S, ls) * u * 1.4 + 30 * u + fz(S, ns) * u * 1.5 + (F ? 6 : 18) * u + fz(S, ls) * u * 1.5 + 2 * (barH + 6 * u);
  const y0 = R.y + Math.max(0, (R.h - blockH) / 2), x0 = R.x + (R.w - nw) / 2;
  // la pregunta con una pista escondida → el pensamiento no la menciona
  const h1 = note(S, q, x0 + nw / 2, y0, nw, 'w', { size: ns, a: fr(S, 'limit-faithful', 0.3, 0.42) });
  const ty = y0 + h1 + 10 * u;
  d.withAlpha(fr(S, 'limit-faithful', 0.42, 0.52), () => {
    fitText(S, S.l('su pensamiento:', 'its thinking:'), x0, ty, nw, { size: ls, weight: 700, color: p.mute, base: 'top' });
    const ly = ty + fz(S, ls) * u * 1.4;
    for (let i = 0; i < 3; i++) d.line(x0 + 6 * u, ly + 6 * u + i * 9 * u, x0 + nw * (0.6 + 0.12 * ((i * 5) % 3)), ly + 6 * u + i * 9 * u, alpha(p.ink2, 0.45), 2);
    fitText(S, S.l('…no menciona la pista; responde C', '…does not mention the hint; answers C'), x0 + 6 * u, ly + 30 * u, nw, { size: ns, weight: 700, color: w.ink, base: 'top' });
  });
  // las cifras de Chen et al. (2025)
  const by = ty + fz(S, ls) * u * 1.4 + 30 * u + fz(S, ns) * u * 1.5 + (F ? 6 : 18) * u;
  d.withAlpha(fr(S, 'limit-faithful', 0.7, 0.86), () => {
    fitText(S, S.l('veces que su pensamiento menciona la pista que usó', 'how often its thinking mentions the hint it used'), x0, by, nw, { size: ls, weight: 700, color: p.ink2, base: 'top' });
    const items = [['Claude 3.7 Sonnet', PAPERS.faithClaude], ['DeepSeek-R1', PAPERS.faithR1]] as const;
    const labW = Math.min(160 * u * k, nw * 0.36);
    items.forEach(([lab, v], i) => {
      const y = by + fz(S, ls) * u * 1.5 + i * (barH + 6 * u);
      fitText(S, lab, x0, y + barH / 2, labW - 8 * u, { size: ls, weight: 700, color: p.ink, base: 'middle' });
      const bx = x0 + labW, bw = nw - labW - 60 * u;
      d.rect(bx, y, bw, barH, { fill: p.surface2 });
      d.rect(bx, y, bw * v / 100, barH, { fill: alpha(lat.c, 0.8) });
      fitText(S, pct(S, v, 0), bx + bw + 8 * u, y + barH / 2, 52 * u, { size: 14 * k, weight: 800, font: 'mono', color: lat.ink, base: 'middle' });
    });
  });
}

// ═════════ 14–16 · resumen, lente y puente ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait;
  const items: [string, string, Tone][] = [
    [S.l('Cadena de pensamiento', 'Chain of thought'), S.l('escribir los pasos da dónde calcular', 'writing out the steps gives room to calculate'), 'lat'],
    [S.l('Recompensa verificable', 'Verifiable reward'), S.l('una regla comprueba; se refuerza lo que acierta', 'a rule checks; what is right gets reinforced'), 'dat'],
    [S.l('Cómputo al responder', 'Test-time compute'), S.l('pensar o votar más, sin tocar los pesos', 'think or vote more, without touching the weights'), 'w'],
    [S.l('Costo y límites', 'Cost and limits'), S.l('más tokens y espera; comprueba el resultado', 'more tokens and waiting; check the result'), 'err'],
  ];
  const cols = P ? 1 : 2, gap = 14 * u;
  const bw = P ? Math.min(R.w, 380 * u) : Math.min((R.w - gap) / 2, 330 * u);
  const bh = Math.min(P ? (R.h - 3 * gap) / 4 : ((R.h - gap) / 2) * 0.66, 92 * u);
  const totalH = (4 / cols) * bh + (4 / cols - 1) * gap, y0 = R.y + (R.h - totalH) / 2;
  const x0 = R.x + (R.w - (cols * bw + (cols - 1) * gap)) / 2;
  items.forEach(([t, s, tn], i) => {
    const a = fr(S, 'recap', 0.04 + 0.2 * i, 0.12 + 0.2 * i), c = tone(S, tn);
    const r: Rect = { x: x0 + (i % cols) * (bw + gap), y: y0 + Math.floor(i / cols) * (bh + gap), w: bw, h: bh };
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.08), stroke: c.c, lw: 1.5, r: 5 });
      fitText(S, t, r.x + 12 * u, r.y + r.h * 0.36, r.w - 24 * u, { size: 16, weight: 800, color: c.ink, base: 'middle' });
      fitText(S, s, r.x + 12 * u, r.y + r.h * 0.7, r.w - 24 * u, { size: 13.5, weight: 600, color: p.ink2, base: 'middle' });
    });
  });
}

export function drawLens(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), k = K(S);
  const cw = Math.min(R.w, 640 * u * k), x = R.x + (R.w - cw) / 2;
  const f1 = S.l('pensar más =', 'thinking longer =');
  const f2 = S.l('más tokens de salida + más espera', 'more output tokens + more waiting');
  const s1 = 16 * k, s2 = 14 * k, lh1 = fz(S, s1) * u * 1.5;
  const items = [S.l('úsalo donde el error cuesta más', 'use it where errors cost the most'), S.l('comprueba el resultado, no lo convincente del razonamiento', 'check the result, not how convincing the reasoning sounds')];
  const itemH = (t: string) => paraH(S, t, cw - 34 * u * k, s2, 700) + fz(S, s2) * u * 0.6;
  const blockH = 2 * lh1 + 20 * u + items.reduce((s, t) => s + itemH(t), 0);
  const y0 = R.y + Math.max(0, (R.h - blockH) / 2 - 10 * u);
  d.withAlpha(fr(S, 'lens', 0.05, 0.18), () => {
    d.rect(x, y0 - 10 * u, cw, 2 * lh1 + 16 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 5 });
    fitText(S, f1, x + cw / 2, y0, cw - 20 * u, { size: s1, weight: 700, color: p.ink2, align: 'center', base: 'top' });
    fitText(S, f2, x + cw / 2, y0 + lh1, cw - 20 * u, { size: s1, weight: 800, color: p.ink, align: 'center', base: 'top' });
  });
  items.forEach((t, i) => {
    const a = fr(S, 'lens', 0.45 + 0.22 * i, 0.55 + 0.22 * i), y = y0 + 2 * lh1 + 22 * u + items.slice(0, i).reduce((s, q) => s + itemH(q), 0);
    d.withAlpha(a, () => {
      mark(S, x + 12 * u, y + fz(S, s2) * u * 0.55, true, 5 * u * k, tone(S, 'dat').c, 2.2);
      para(S, t, x + 30 * u * k, y, cw - 34 * u * k, { size: s2, weight: 700, color: p.ink });
    });
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 90 * u, { scale: sc, mood: 'think', a: fr(S, 'bridge', 0.05, 0.2) });
  d.withAlpha(fr(S, 'bridge', 0.3, 0.45), () => fitText(S, S.l('¿recuerda lo que le dijiste?', 'does it remember what you said?'), cx, cy + 34 * u, S.W - 32 * u, { size: 15, weight: 700, color: p.ink2, align: 'center', base: 'middle' }));
  d.withAlpha(fr(S, 'bridge', 0.75, 0.9), () => {
    fitText(S, S.l('Siguiente', 'Next'), cx, cy + 62 * u, S.W - 32 * u, { size: 13, weight: 700, color: p.mute, align: 'center', base: 'middle' });
    fitText(S, S.l('Contexto y memoria', 'Context and memory'), cx, cy + 92 * u, S.W - 32 * u, { size: 24, weight: 800, color: p.ink, align: 'center', base: 'middle' });
  });
  void clamp; void chipH; void noteH;
}
