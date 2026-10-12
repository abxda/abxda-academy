// Vistas 3 y 4: resolverlo paso a paso, la cadena de pensamiento (contexto y pasadas) y lo que midieron Wei et al.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { area, chip, chipH, curveArrow, fitText, flat, fr, fz, K, para, paraH, pct, win } from './ui';
import { modelBox, track } from './parts';
import { PAPERS, TOK_ANSWER, TOK_STEPS } from './runs';

const STEPS = [['148', '−', '37', '111'], ['111', '+', '52', '163'], ['163', '−', '61', '102'], ['102', '+', '18', '120']];
/** Tokens de cada renglón según el tokenizador de Qwen3.5 (cada cifra, un token; el salto de línea cuenta con el renglón siguiente). Suman TOK_STEPS. */
const TOK_LINE = [12, 13, 13, 13];

/** Geometría del bloque de pasos dentro de `r`; `shift` 0 = centrado, 1 = deja sitio al modelo (izquierda o arriba). */
function stepsLayout(S: Frame, r: Rect, shift: number) {
  const u = S.u, P = S.portrait, F = flat(S), k = K(S);
  const size = F ? 14 : P ? 16.5 : 19 * k;
  const fs = fz(S, size) * u, cw = S.d.measure('0', { size: fz(S, size), weight: 700, font: 'mono' });
  const lineW = cw * 14, rowH = fs * (F ? 1.75 : 2.0);
  const blockH = rowH * 5;
  const modelW = Math.min(140 * u * k, r.w * 0.2), modelH = Math.max(40 * u, Math.min(64 * u * k, r.h * 0.2));
  let x0: number, y0: number;
  if (P) {
    x0 = r.x + (r.w - lineW) / 2;
    const yC = r.y + (r.h - blockH) / 2, yS = Math.min(r.y + modelH + 34 * u, r.y + r.h - blockH);
    y0 = lerp(yC, Math.max(yC, yS), shift);
  } else {
    const xC = r.x + (r.w - lineW) / 2, xS = r.x + modelW + 70 * u;
    x0 = lerp(xC, Math.min(xC, xS), shift);
    y0 = r.y + (r.h - blockH) / 2 + rowH * 0.35;
  }
  const model: Rect = P ? { x: r.x + (r.w - modelW) / 2, y: r.y, w: modelW, h: modelH } : { x: r.x, y: y0 + rowH * 1.4 - modelH / 2, w: modelW, h: modelH };
  return { size, fs, cw, lineW, rowH, x0, y0, model };
}

export function drawSteps(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const stripH = 30 * u;
  track(S, { x: R.x, y: R.y, w: Math.min(R.w, 520 * u), h: stripH }, { start: 1, stop1: 1, stop2: 1, end: 1 });
  const body: Rect = { x: R.x, y: R.y + stripH + 8 * u, w: R.w, h: R.h - stripH - 8 * u };
  const shift = fr(S, 'cot-idea', 0.02, 0.3, 'io');
  const L = stepsLayout(S, body, shift);
  const lat = tone(S, 'lat'), w = tone(S, 'w');
  const reveal = [fr(S, 'by-hand', 0.3, 0.42), fr(S, 'by-hand', 0.72, 0.84), fr(S, 'by-hand-2', 0.02, 0.14), fr(S, 'by-hand-2', 0.22, 0.34)];
  const link = fr(S, 'by-hand-2', 0.5, 0.75) * (1 - fr(S, 'cot-idea', 0, 0.2));
  const modelA = fr(S, 'cot-idea', 0.05, 0.25);
  // panel «lo que escribe el modelo»
  const panel: Rect = { x: L.x0 - 12 * u, y: L.y0 - L.rowH * 0.35, w: L.lineW + 24 * u, h: L.rowH * 5 };
  d.withAlpha(modelA, () => {
    d.rect(panel.x, panel.y, panel.w, panel.h, { fill: alpha(lat.c, 0.06), stroke: lat.c, lw: 1.3, r: 5 });
    fitText(S, S.l('lo que escribe el modelo', 'what the model writes'), panel.x + 6 * u, panel.y - 4 * u, panel.w, { size: 12 * k, weight: 700, color: lat.ink, base: 'bottom' });
  });
  modelBox(S, L.model, { a: modelA });
  if (modelA > 0.01) {
    // el modelo escribe → el texto vuelve a entrar como contexto
    const m = L.model, back = fr(S, 'cot-idea', 0.6, 0.8);
    const ctx = S.l('vuelve como contexto', 'comes back as context');
    if (P) {
      d.withAlpha(modelA, () => d.arrow(m.x + m.w * 0.3, m.y + m.h + 2 * u, m.x + m.w * 0.3, panel.y - 3 * u - fz(S, 12) * u * 1.3, w.c, 1.8, 7 * u));
      const ex = Math.min(panel.x + panel.w * 0.9, R.x + R.w - 10 * u);
      curveArrow(S, ex, panel.y - fz(S, 12) * u * 1.3, ex, m.y + m.h / 2, m.x + m.w + 3 * u, m.y + m.h / 2, lat.c, 1.8, back);
      d.withAlpha(back, () => fitText(S, ctx, m.x + m.w + 8 * u, m.y + m.h / 2 - 5 * u, Math.max(40 * u, ex - m.x - m.w - 14 * u), { size: 12, weight: 700, color: lat.ink, base: 'bottom' }));
    } else {
      d.withAlpha(modelA, () => d.arrow(m.x + m.w + 3 * u, m.y + m.h * 0.4, panel.x - 4 * u, m.y + m.h * 0.4, w.c, 1.8, 7 * u));
      const py = panel.y + panel.h * 0.8;
      curveArrow(S, panel.x - 4 * u, py, m.x + m.w / 2, py + 8 * u, m.x + m.w / 2, m.y + m.h + 4 * u, lat.c, 1.8, back);
      d.withAlpha(back, () => fitText(S, ctx, m.x, py + 14 * u, Math.max(m.w, panel.x - m.x - 10 * u), { size: 12 * k, weight: 700, color: lat.ink, base: 'top' }));
    }
  }
  // los cuatro renglones
  STEPS.forEach((st, i) => {
    const a = reveal[i];
    if (a <= 0.01) return;
    const y = L.y0 + i * L.rowH;
    d.withAlpha(a, () => {
      d.text(`${st[0]} ${st[1]} ${st[2]} = ${st[3]}`, L.x0, y, { size: fz(S, L.size), weight: 700, font: 'mono', color: p.ink, base: 'top' });
      // el resultado y el número con el que empieza el renglón siguiente: el mismo, enmarcado
      if (link > 0.01) {
        const rx = L.x0 + 11 * L.cw;
        d.withAlpha(link, () => d.rect(rx - 3 * u, y - 3 * u, 3 * L.cw + 6 * u, L.fs + 6 * u, { stroke: w.c, lw: 1.6, r: 3 }));
        if (i < 3) {
          const ny = y + L.rowH;
          d.withAlpha(link * reveal[i + 1], () => {
            d.rect(L.x0 - 3 * u, ny - 3 * u, 3 * L.cw + 6 * u, L.fs + 6 * u, { stroke: w.c, lw: 1.6, r: 3 });
            d.arrow(rx + 0.5 * L.cw, y + L.fs + 4 * u, L.x0 + 2.5 * L.cw, ny - 5 * u, w.c, 1.5, 6 * u);
          });
        }
      }
      // cot-passes: una marca por token, debajo de cada renglón
      const tk = fr(S, 'cot-passes', 0.45 + 0.08 * i, 0.55 + 0.08 * i);
      if (tk > 0.01) {
        const n = TOK_LINE[i], gw = L.lineW / n;
        for (let j = 0; j < n * tk; j++) d.rect(L.x0 + j * gw + gw * 0.2, y + L.fs + (F ? 2.5 : 5) * u, Math.max(2, gw * 0.6), F ? 2.5 : Math.max(3, 4 * u), { fill: w.c });
      }
    });
  });
  // la respuesta, al final
  const ansA = fr(S, 'cot-idea', 0.35, 0.5);
  const ay = L.y0 + 4 * L.rowH;
  d.withAlpha(ansA, () => {
    fitText(S, S.l('respuesta:', 'answer:'), L.x0, ay + L.fs / 2, 9 * L.cw, { size: L.size * 0.75, weight: 700, color: p.mute, base: 'middle' });
    chip(S, '120', L.x0 + 11 * L.cw, ay + L.fs / 2, 'dat', { size: L.size * 0.9, font: 'mono', align: 'left' });
  });
  // a la derecha del panel (o debajo, en vertical): primero la cuenta de pasadas, luego el nombre
  const sx = P ? R.x : panel.x + panel.w + 22 * u, sw = P ? R.w : R.x + R.w - sx;
  const sy = P ? panel.y + panel.h + 10 * u : panel.y + panel.h * 0.3;
  const nm = fr(S, 'cot-name', 0.06, 0.26);
  if (S.on('cot-passes')) {
    const a1 = fr(S, 'cot-passes', 0.22, 0.36), a2 = fr(S, 'cot-passes', 0.78, 0.92), ch = chipH(S, 13 * k);
    const rows = [[S.l(`respuesta sola: ${TOK_ANSWER} pasadas`, `answer alone: ${TOK_ANSWER} passes`), a1, 'ink'], [S.l(`con los 4 pasos: ${TOK_STEPS} pasadas más`, `with the 4 steps: ${TOK_STEPS} more passes`), a2, 'w']] as const;
    rows.forEach(([t, a, tn], i) => chip(S, t, sx, sy + i * (ch + 8 * u) + ch / 2, tn, { size: 13 * k, align: 'left', a: a * (1 - nm), maxW: sw }));
  }
  if (nm > 0.01) {
    const lab = S.l('cadena de pensamiento', 'chain of thought');
    d.withAlpha(nm, () => {
      if (!P) {
        const bx = panel.x + panel.w + 6 * u, top = L.y0 - 2 * u, bot = L.y0 + 3 * L.rowH + L.fs + 2 * u;
        d.line(bx, top, bx + 6 * u, top, lat.c, 2); d.line(bx + 6 * u, top, bx + 6 * u, bot, lat.c, 2); d.line(bx, bot, bx + 6 * u, bot, lat.c, 2);
        const mid = (top + bot) / 2, tw = R.x + R.w - bx - 14 * u;
        fitText(S, lab, bx + 14 * u, mid - (S.lang === 'es' ? 9 * u * k : 0), tw, { size: 16 * k, weight: 800, color: lat.ink, base: 'middle' });
        if (S.lang === 'es') fitText(S, 'chain of thought', bx + 14 * u, mid + 13 * u * k, tw, { size: 12.5 * k, weight: 600, color: p.mute, base: 'middle', italic: true });
      } else {
        chip(S, S.lang === 'es' ? `${lab} (chain of thought)` : lab, R.x + R.w / 2, sy + chipH(S, 14) / 2, 'lat', { size: 14, maxW: R.w });
      }
    });
  }
  void clamp;
}

// ═════════ 4 · Wei et al. (2022): ocho ejemplos y lo que pasó ═════════
export function drawPapers(S: Frame) {
  const a1 = win(S, 'cot-wei', 'cot-gsm'), a2 = win(S, 'cot-gsm', 'rm-intro');
  if (a1 > 0.004) S.d.withAlpha(a1, () => drawFewShot(S));
  if (a2 > 0.004) S.d.withAlpha(a2, () => drawGsm(S));
}

function drawFewShot(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const lat = tone(S, 'lat');
  // ocho tarjetas resueltas, una pregunta nueva, el modelo
  const cardW = Math.min(130 * u * k, P ? R.w * 0.42 : R.w * 0.2), cardH = cardW * 0.62;
  const kk = fr(S, 'cot-wei', 0.45, 0.8, 'lin');
  const stack = (x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      const a = clamp(kk * 8 - i);
      if (a <= 0) continue;
      const ox = x + i * 3.4 * u, oy = y + i * 3.4 * u;
      d.withAlpha(a, () => {
        d.rect(ox, oy, cardW, cardH, { fill: p.surface, stroke: p.lineStrong, lw: 1.2, r: 3 });
        for (let j = 0; j < 3; j++) d.line(ox + 8 * u, oy + cardH * (0.28 + 0.2 * j), ox + cardW * (j === 2 ? 0.5 : 0.85), oy + cardH * (0.28 + 0.2 * j), j === 2 ? lat.c : p.line, 2);
      });
    }
  };
  const lab8 = S.l('8 problemas resueltos paso a paso', '8 problems solved step by step');
  const newQ = S.l('pregunta nueva', 'new question');
  const qa = fr(S, 'cot-wei', 0.75, 0.88), ma = fr(S, 'cot-wei', 0.2, 0.35), la = fr(S, 'cot-wei', 0.45, 0.6);
  const mw = Math.min(170 * u * k, R.w * 0.3), mh = 64 * u * k;
  if (P) {
    const stackH = cardH + 8 * 3.4 * u, ch = chipH(S, 13);
    const total = fz(S, 13) * u * 1.4 + stackH + 24 * u + ch + 24 * u + mh;
    const y0 = R.y + Math.max(0, (R.h - total) / 2);
    fitText(S, lab8, R.x + R.w / 2, y0, R.w, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'top', a: la });
    stack(R.x + (R.w - cardW - 24 * u) / 2, y0 + fz(S, 13) * u * 1.4 + 4 * u);
    const qy = y0 + fz(S, 13) * u * 1.4 + stackH + 24 * u + ch / 2;
    chip(S, '+ ' + newQ, R.x + R.w / 2, qy, 'ink', { size: 13, a: qa });
    const m: Rect = { x: R.x + (R.w - mw) / 2, y: qy + ch / 2 + 24 * u, w: mw, h: mh };
    d.withAlpha(qa, () => d.arrow(R.x + R.w / 2, qy + ch / 2 + 2 * u, R.x + R.w / 2, m.y - 3 * u, p.lineStrong, 1.6, 7 * u));
    palmBox(S, m, ma);
  } else {
    const cy = R.y + R.h * 0.52, x = R.x + 10 * u, y = cy - (cardH + 8 * 3.4 * u) / 2;
    fitText(S, lab8, x, y - 8 * u, Math.max(cardW + 80 * u, R.w * 0.3), { size: 13 * k, weight: 700, color: p.ink2, base: 'bottom', a: la });
    stack(x, y);
    const qx = x + cardW + 8 * 3.4 * u + (F ? 30 : 50) * u, qs = 13 * k;
    const qw = S.d.measure('+ ' + newQ, { size: fz(S, qs), weight: 700 }) + 14 * u;
    chip(S, '+ ' + newQ, qx, cy, 'ink', { size: qs, align: 'left', a: qa });
    const m: Rect = { x: Math.min(qx + qw + 50 * u, R.x + R.w - mw - 10 * u), y: cy - mh / 2, w: mw, h: mh };
    d.withAlpha(qa, () => d.arrow(qx + qw + 4 * u, cy, m.x - 4 * u, cy, p.lineStrong, 1.6, 7 * u));
    palmBox(S, m, ma);
  }
}
function palmBox(S: Frame, m: Rect, a: number) {
  const { d } = S, c = tone(S, 'w'), u = S.u, k = K(S);
  d.withAlpha(a, () => {
    d.rect(m.x, m.y, m.w, m.h, { fill: alpha(c.c, 0.12), stroke: c.c, lw: 1.6, r: 5 });
    fitText(S, 'PaLM', m.x + m.w / 2, m.y + m.h / 2 - 9 * u * k, m.w - 10 * u, { size: 17 * k, weight: 800, color: c.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('540 mil M de parámetros', '540B parameters'), m.x + m.w / 2, m.y + m.h / 2 + 12 * u * k, m.w - 8 * u, { size: 12 * k, weight: 600, color: S.pal.mute, align: 'center', base: 'middle' });
  });
}

/** Barras agrupadas: un rótulo por grupo y, por barra, su rótulo a la izquierda, la barra y su cifra. */
export function groupBars(S: Frame, r: Rect, title: string, groups: { name: string; a: number; bars: { lab: string; short: string; v: number; txt: string; a: number; solid: boolean }[] }[], o: { titleA?: number } = {}) {
  const { d, pal: p } = S, u = S.u, F = flat(S), k = K(S), lat = tone(S, 'lat');
  const ts = 13 * k, gs = 13.5 * k, ls = 12.5 * k;
  para(S, title, r.x, r.y, r.w, { size: ts, weight: 700, color: p.ink2, a: o.titleA ?? 1 });
  const tH = paraH(S, title, r.w, ts, 700);
  const barH = Math.max(fz(S, ls) * u + 8 * u, (F ? 18 : 24) * u * k), gapB = 6 * u;
  const nameH = fz(S, gs) * u * 1.45, gapG = (F ? 6 : 16) * u * k;
  const nBars = groups.reduce((s, g) => s + g.bars.length, 0);
  const totalH = tH + fz(S, ts) * u * 0.3 + groups.length * (nameH + gapG) + nBars * (barH + gapB);
  let y = r.y + tH + fz(S, ts) * u * 0.3 + Math.max(0, (r.h - totalH) / 2) * 0.6;
  const valW = 64 * u * k;
  const fullLabW = Math.max(...groups.flatMap((g) => g.bars.map((b) => S.d.measure(b.lab, { size: fz(S, ls), weight: 700 })))) + 12 * u;
  const useFull = fullLabW < r.w * 0.42;
  const labW = useFull ? fullLabW : Math.max(...groups.flatMap((g) => g.bars.map((b) => S.d.measure(b.short, { size: fz(S, ls), weight: 700 })))) + 12 * u;
  const bx = r.x + labW, bw = r.w - labW - valW;
  groups.forEach((g) => {
    if (g.a > 0.01) d.withAlpha(g.a, () => fitText(S, g.name, r.x, y, r.w, { size: gs, weight: 800, color: p.ink, base: 'top' }));
    y += nameH;
    g.bars.forEach((b) => {
      if (b.a > 0.01) d.withAlpha(b.a, () => {
        fitText(S, useFull ? b.lab : b.short, r.x, y + barH / 2, labW - 10 * u, { size: ls, weight: 700, color: b.solid ? lat.ink : p.ink2, base: 'middle' });
        d.rect(bx, y, bw, barH, { fill: p.surface2 });
        const wv = Math.max(2, bw * (b.v / 100) * clamp(b.a * 1.2));
        if (b.solid) d.rect(bx, y, wv, barH, { fill: alpha(lat.c, 0.85) });
        else d.rect(bx, y, wv, barH, { fill: alpha(p.mute, 0.25), stroke: p.mute, lw: 1.2, dash: [3, 3] });
        fitText(S, b.txt, bx + bw + 8 * u, y + barH / 2, valW - 8 * u, { size: 14 * k, weight: 800, font: 'mono', color: b.solid ? lat.ink : p.ink2, base: 'middle' });
      });
      y += barH + gapB;
    });
    y += gapG;
  });
  return y;
}

function drawGsm(S: Frame) {
  const R = area(S), k = K(S), u = S.u;
  const direct = S.l('contestando directo', 'answering directly'), chain = S.l('con cadena de pensamiento', 'with a chain of thought');
  const sd = S.l('directo', 'direct'), sc = S.l('con cadena', 'with chain');
  const g = (name: string, v: readonly number[], seg: string, t: [number, number, number]) => ({
    name, a: fr(S, seg, t[0], t[0] + 0.14),
    bars: [
      { lab: direct, short: sd, v: v[0], txt: pct(S, v[0]), a: fr(S, seg, t[1], t[1] + 0.14), solid: false },
      { lab: chain, short: sc, v: v[1], txt: pct(S, v[1]), a: fr(S, seg, t[2], t[2] + 0.16), solid: true },
    ],
  });
  const y = groupBars(S, R, S.l('GSM8K: problemas escolares de matemáticas · % de aciertos', 'GSM8K: grade-school math problems · % correct'), [
    g(S.l('PaLM · 540 mil millones de parámetros', 'PaLM · 540 billion parameters'), PAPERS.palm540, 'cot-gsm', [0.04, 0.3, 0.66]),
    g(S.l('PaLM · 8 mil millones de parámetros', 'PaLM · 8 billion parameters'), PAPERS.palm8, 'cot-small', [0.06, 0.24, 0.42]),
  ]);
  const na = fr(S, 'cot-small', 0.75, 0.9);
  if (na > 0.01 && y + chipH(S, 13 * k) / 2 < R.y + R.h + 6 * u) chip(S, S.l('pasos fluidos, pero sin lógica', 'fluent steps, but illogical'), R.x + R.w / 2, Math.min(y, R.y + R.h - chipH(S, 13 * k) / 2), 'err', { size: 13 * k, a: na, maxW: R.w });
}
