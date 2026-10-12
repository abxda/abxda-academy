// Vistas 5–9: los modelos de razonamiento (línea de tiempo y forma de su salida), nuestro modelo pensando,
// el entrenamiento con recompensas verificables, DeepSeek-R1 y el cómputo en tiempo de prueba.
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { area, chip, chipH, chipW, fitText, flat, fr, fz, hatch, int, K, mark, note, noteH, para, paraH, win } from './ui';
import { bounds, cell, gridCells, hitsLabel, modelBox } from './parts';
import { groupBars } from './v-cot';
import { answers, B_MAX, hits, meanLen, N_TRIES, PAPERS, type L2 } from './runs';
import { pct } from './ui';

const lg = (S: Frame) => S.lang as L2;

// ═════════ 5 · modelos de razonamiento ═════════
export function drawReasoning(S: Frame) {
  const a1 = win(S, 'rm-intro', 'rm-shape'), a2 = win(S, 'rm-shape', 'rm-ours');
  if (a1 > 0.004) S.d.withAlpha(a1, () => drawTimeline(S));
  if (a2 > 0.004) S.d.withAlpha(a2, () => drawShape(S));
}

function drawTimeline(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, k = K(S);
  const ev = [
    { when: '2022', what: S.l('cadena de pensamiento: hay que pedirla', 'chain of thought: you have to ask for it'), t: 'ink' as Tone, a: fr(S, 'rm-intro', 0.04, 0.18) },
    { when: S.l('sep 2024', 'Sep 2024'), what: S.l('o1 (OpenAI): la escribe por su cuenta', 'o1 (OpenAI): writes it on its own'), t: 'lat' as Tone, a: fr(S, 'rm-intro', 0.62, 0.78) },
  ];
  const termA = fr(S, 'rm-intro', 0.82, 0.95), ws = 15 * k, ts = 14 * k;
  if (P) {
    const x = R.x + 16 * u, step = Math.min(R.h * 0.3, 120 * u), y0 = R.y + Math.max(20 * u, (R.h - step - 90 * u) / 2);
    d.withAlpha(ev[1].a, () => d.line(x, y0, x, y0 + step, p.lineStrong, 2));
    ev.forEach((e, i) => d.withAlpha(e.a, () => {
      const y = y0 + i * step;
      d.circle(x, y, 7 * u, { fill: p.surface, stroke: tone(S, e.t).c, lw: 2.5 });
      fitText(S, e.when, x + 18 * u, y, R.w - 40 * u, { size: ws, weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      d.text(e.what, x + 18 * u, y + 14 * u, { size: fz(S, ts), weight: 700, color: tone(S, e.t).ink, base: 'top', w: R.x + R.w - x - 18 * u });
    }));
    chip(S, S.l('modelo de razonamiento', 'reasoning model'), R.x + R.w / 2, y0 + step + 80 * u, 'lat', { size: 16, a: termA, maxW: R.w });
  } else {
    const y = R.y + R.h * 0.4, x0 = R.x + R.w * 0.08, x1 = R.x + R.w * 0.56;
    d.withAlpha(ev[1].a, () => d.line(x0, y, x1, y, p.lineStrong, 2));
    ev.forEach((e, i) => d.withAlpha(e.a, () => {
      const x = i === 0 ? x0 : x1, w = (i === 0 ? x1 - x0 : R.x + R.w - x1) - 16 * u;
      d.circle(x, y, 8 * u * k, { fill: p.surface, stroke: tone(S, e.t).c, lw: 2.5 });
      fitText(S, e.when, x, y - 16 * u * k, w, { size: 17 * k, weight: 800, font: 'mono', color: p.ink, base: 'bottom' });
      d.text(e.what, x, y + 18 * u * k, { size: fz(S, ts), weight: 700, color: tone(S, e.t).ink, base: 'top', w });
    }));
    chip(S, S.l('modelo de razonamiento', 'reasoning model'), x1, Math.min(y + 18 * u * k + 2 * fz(S, ts) * u * 1.3 + 30 * u * k, R.y + R.h - chipH(S, 16 * k) / 2), 'lat', { size: 16 * k, a: termA, align: 'left', maxW: R.x + R.w - x1 });
  }
}

function drawShape(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), F = flat(S), k = K(S);
  const w = Math.min(R.w, 660 * u * k), x = R.x + (R.w - w) / 2;
  const hs = 13.5 * k, ansH = Math.max(chipH(S, 16 * k), 34 * u);
  const thinkH = Math.min(R.h - ansH - 20 * u, (F ? 0.62 : 0.6) * R.h);
  const y0 = R.y + Math.max(0, (R.h - thinkH - ansH - 16 * u) / 2);
  // el pensamiento: muchas líneas que se van escribiendo
  const kk = fr(S, 'rm-shape', 0.08, 0.45, 'lin'), sum = fr(S, 'rm-shape', 0.68, 0.84), a0 = fr(S, 'rm-shape', 0.05, 0.15);
  fitText(S, S.l('pensamiento · a veces miles de tokens', 'thinking · sometimes thousands of tokens'), x, y0, w, { size: hs, weight: 700, color: p.ink2, base: 'top', a: a0 });
  const ty = y0 + fz(S, hs) * u * 1.45, th = thinkH - fz(S, hs) * u * 1.45;
  d.rect(x, ty, w, th, { fill: p.surface, stroke: p.lineStrong, lw: 1.2, r: 4, a: a0 });
  const rows = Math.max(4, Math.floor(th / (10 * u)) - 1);
  for (let i = 0; i < rows; i++) {
    const a = clamp(kk * rows - i);
    if (a <= 0) break;
    const len = 0.55 + 0.4 * ((i * 37) % 11) / 11, yy = ty + 8 * u + i * (th - 14 * u) / rows;
    d.line(x + 12 * u, yy, x + 12 * u + (w - 24 * u) * len * a, yy, alpha(p.ink2, 0.5 * (1 - 0.6 * sum)), 2);
  }
  // lo que muestran muchos servicios: un resumen
  if (sum > 0.01) {
    hatch(S, { x: x + 1, y: ty + 1, w: w - 2, h: th - 2 }, alpha(p.mute, 0.25 * sum), 7, 1);
    const msg = S.l('lo que ves: un resumen', 'what you see: a summary'), sw = Math.min(w * 0.7, 360 * u * k), sh = noteH(S, msg, sw, 15 * k);
    note(S, msg, x + w / 2, ty + th / 2 - sh / 2, sw, 'ink', { size: 15 * k, a: sum });
  }
  // la respuesta
  const ay = ty + th + 14 * u, aa = fr(S, 'rm-shape', 0.46, 0.58);
  d.withAlpha(aa, () => {
    const lw = S.d.measure(S.l('respuesta', 'answer'), { size: fz(S, hs), weight: 700 });
    fitText(S, S.l('respuesta', 'answer'), x, ay + ansH / 2, lw + 4, { size: hs, weight: 700, color: p.ink2, base: 'middle' });
    chip(S, '120', x + lw + 14 * u, ay + ansH / 2, 'dat', { size: 16 * k, align: 'left', font: 'mono' });
  });
}

// ═════════ 6 · nuestro modelo, con el pensamiento activo ═════════
export function drawOurs(S: Frame) {
  const { pal: p } = S, u = S.u, R = area(S), P = S.portrait, k = K(S);
  const on = fr(S, 'rm-ours', 0.32, 0.42), hs = 13.5 * k;
  // interruptor «pensamiento»
  const sw = toggle(S, R.x, R.y + chipH(S, hs) / 2, on, S.l('pensamiento', 'thinking'), hs);
  fitText(S, 'Qwen3.5-4B · 32 ' + S.l('intentos', 'tries'), R.x + sw + 16 * u, R.y + chipH(S, hs) / 2, R.w - sw - 16 * u, { size: hs, weight: 700, color: p.ink2, base: 'middle' });
  const top = R.y + chipH(S, hs) + 12 * u, readH = fz(S, 15 * k) * u * 1.8;
  const gr: Rect = { x: R.x, y: top, w: R.w, h: R.y + R.h - top - readH * (P ? 1.8 : 1) };
  const b0 = answers(lg(S), 0), b1 = answers(lg(S), B_MAX), cells = gridCells(S, gr, N_TRIES);
  const flip = fr(S, 'rm-ours', 0.45, 0.8, 'lin');
  cells.forEach((c, i) => {
    const f = clamp(flip * 4 - (i / N_TRIES) * 3);
    if (f < 1) cell(S, c, b0[i], { a: 1 - f, marks: 1 });
    if (f > 0) cell(S, c, b1[i], { a: f, marks: 1 });
  });
  const b = bounds(cells), ry = b.y + b.h + readH / 2 + 2 * u;
  const kk = Math.round(lerp(hits(lg(S), 0), hits(lg(S), B_MAX), flip));
  hitsLabel(S, b.x, ry, b.w * (P ? 1 : 0.4), kk, N_TRIES);
  const tk = S.l(`≈ ${int(S, meanLen(lg(S)))} tokens de pensamiento por intento`, `≈ ${int(S, meanLen(lg(S)))} thinking tokens per try`);
  fitText(S, tk, P ? b.x : b.x + b.w, P ? ry + readH * 0.75 : ry, b.w * (P ? 1 : 0.58), { size: 13 * k, weight: 700, color: tone(S, 'lat').ink, align: P ? 'left' : 'right', base: 'middle', a: fr(S, 'rm-ours', 0.5, 0.65) });
}

/** Interruptor dibujado: «pensamiento: no / sí». Devuelve su ancho. */
function toggle(S: Frame, x: number, cy: number, on: number, label: string, size: number) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat');
  const lw = d.measure(label, { size: fz(S, size), weight: 700 });
  fitText(S, label, x, cy, lw + 2, { size, weight: 700, color: p.ink, base: 'middle' });
  const tx = x + lw + 8 * u, tw = 36 * u, th = 20 * u;
  d.rect(tx, cy - th / 2, tw, th, { fill: alpha(lat.c, 0.15 + 0.6 * on), stroke: on > 0.5 ? lat.c : p.lineStrong, lw: 1.4, r: th / 2 });
  d.circle(tx + th / 2 + (tw - th) * on, cy, th / 2 - 3 * u, { fill: on > 0.5 ? p.stage : p.mute });
  const st = on > 0.5 ? S.l('sí', 'on') : S.l('no', 'off');
  fitText(S, st, tx + tw + 6 * u, cy, 40 * u, { size, weight: 800, color: on > 0.5 ? lat.ink : p.mute, base: 'middle' });
  return lw + 8 * u + tw + 6 * u + d.measure(st, { size: fz(S, size), weight: 800 });
}

// ═════════ 7 · el entrenamiento: practicar contra un juez que comprueba ═════════
export function drawRL(S: Frame) {
  const a1 = win(S, 'rl-recall', 'rl-loop'), a2 = win(S, 'rl-loop', 'r1');
  if (a1 > 0.004) S.d.withAlpha(a1, () => drawLoop(S));
  if (a2 > 0.004) S.d.withAlpha(a2, () => drawPractice(S));
}

function drawLoop(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const w = tone(S, 'w'), dat = tone(S, 'dat');
  const ver = fr(S, 'verifiable', 0.12, 0.32);
  const titleH = chipH(S, 15 * k) + 12 * u;
  const exS = 13 * k, exH = chipH(S, exS);
  // cuatro nodos en ciclo: modelo → respuesta → juez → puntos → modelo
  let nodes: Rect[], backY = 0, exY: number[] = [], exX: number[] = [];
  const ex = [S.l('¿el número final es 120?', 'is the final number 120?'), S.l('¿el programa pasa sus pruebas?', 'does the program pass its tests?')];
  if (P) {
    const bw = Math.min(R.w * 0.44, 160 * u), bh = Math.min(76 * u, R.h * 0.2), gapY = 58 * u;
    const total = titleH + 2 * bh + gapY + 12 * u + 2 * exH + 6 * u;
    const y1 = R.y + titleH + Math.max(0, (R.h - total) / 3), y2 = y1 + bh + gapY;
    nodes = [{ x: R.x, y: y1, w: bw, h: bh }, { x: R.x + R.w - bw, y: y1, w: bw, h: bh }, { x: R.x + R.w - bw, y: y2, w: bw, h: bh }, { x: R.x, y: y2, w: bw, h: bh }];
    exY = [y2 + bh + 12 * u + exH / 2, y2 + bh + 18 * u + exH * 1.5]; exX = [R.x + R.w / 2, R.x + R.w / 2];
  } else {
    const bw = Math.min(R.w * 0.2, 180 * u * k), bh = Math.min((F ? 58 : 86) * u * k, R.h * 0.34);
    const gap = (R.w - 4 * bw) / 3, drop = (F ? 22 : 40) * u * k;
    const total = titleH + bh + drop + 14 * u + (F ? exH : 2 * exH + 6 * u);
    const y = R.y + titleH + Math.max(0, (R.h - total) / 3);
    nodes = [0, 1, 2, 3].map((i) => ({ x: R.x + i * (bw + gap), y, w: bw, h: bh }));
    backY = y + bh + drop;
    const jx = nodes[2].x + nodes[2].w / 2;
    if (F) { const w0 = chipW(S, ex[0], exS), w1 = chipW(S, ex[1], exS); exY = [backY + 12 * u + exH / 2, backY + 12 * u + exH / 2]; exX = [jx - (w0 + w1 + 10 * u) / 2 + w0 / 2, jx + (w0 + w1 + 10 * u) / 2 - w1 / 2]; }
    else { exY = [backY + 14 * u + exH / 2, backY + 20 * u + exH * 1.5]; exX = [jx, jx]; }
  }
  const ap = [fr(S, 'rl-recall', 0.2, 0.3), fr(S, 'rl-recall', 0.28, 0.38), fr(S, 'rl-recall', 0.36, 0.46), fr(S, 'rl-recall', 0.44, 0.54)];
  const ls = 12.5 * k, bs = 15 * k;
  modelBox(S, nodes[0], { a: ap[0] });
  // respuesta
  const n1 = nodes[1];
  d.withAlpha(ap[1], () => {
    d.rect(n1.x, n1.y, n1.w, n1.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 5 });
    fitText(S, S.l('respuesta', 'answer'), n1.x + n1.w / 2, n1.y + n1.h * 0.3, n1.w - 10 * u, { size: ls, weight: 700, color: p.mute, align: 'center', base: 'middle' });
    fitText(S, '120', n1.x + n1.w / 2, n1.y + n1.h * 0.66, n1.w - 10 * u, { size: 19 * k, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
  });
  // juez: modelo de recompensa (opina) → regla que comprueba
  const n2 = nodes[2], jc = tone(S, ver > 0.5 ? 'dat' : 'w');
  const line3 = (a: string, b: string, c: string, col: string) => {
    const narrow = S.d.measure(b, { size: fz(S, 12), weight: 800 }) > n2.w - 10 * u;
    if (narrow) { S.d.text(b, n2.x + n2.w / 2, n2.y + n2.h * 0.42, { size: fz(S, 12), weight: 800, color: col, align: 'center', base: 'middle', w: n2.w - 10 * u, lh: 1.15 }); }
    else {
      fitText(S, a, n2.x + n2.w / 2, n2.y + n2.h * 0.24, n2.w - 10 * u, { size: ls, weight: 700, color: p.mute, align: 'center', base: 'middle' });
      fitText(S, b, n2.x + n2.w / 2, n2.y + n2.h * 0.52, n2.w - 10 * u, { size: bs, weight: 800, color: col, align: 'center', base: 'middle' });
    }
    fitText(S, c, n2.x + n2.w / 2, n2.y + n2.h * 0.79, n2.w - 10 * u, { size: ls, weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  };
  d.withAlpha(ap[2], () => {
    d.rect(n2.x, n2.y, n2.w, n2.h, { fill: alpha(jc.c, 0.1), stroke: jc.c, lw: 1.6, r: 5 });
    d.withAlpha(1 - ver, () => line3(S.l('juez', 'judge'), S.l('modelo de recompensa', 'reward model'), S.l('opina (aprendido)', 'learned opinion'), w.ink));
    d.withAlpha(ver, () => line3(S.l('juez', 'judge'), S.l('una regla', 'a rule'), S.l('comprueba', 'checks'), dat.ink));
  });
  // puntos
  const n3 = nodes[3], vn = fr(S, 'verif-name', 0.3, 0.48);
  d.withAlpha(ap[3], () => {
    d.rect(n3.x, n3.y, n3.w, n3.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 5 });
    fitText(S, S.l('puntos', 'points'), n3.x + n3.w / 2, n3.y + n3.h * 0.3, n3.w - 10 * u, { size: ls, weight: 700, color: p.mute, align: 'center', base: 'middle' });
    d.withAlpha(1 - vn, () => fitText(S, '+0.8', n3.x + n3.w / 2, n3.y + n3.h * 0.66, n3.w - 10 * u, { size: 19 * k, weight: 800, font: 'mono', color: w.ink, align: 'center', base: 'middle' }));
    d.withAlpha(vn, () => fitText(S, S.l('1 si acierta · 0 si no', '1 if right · 0 if not'), n3.x + n3.w / 2, n3.y + n3.h * 0.66, n3.w - 8 * u, { size: 14 * k, weight: 800, color: dat.ink, align: 'center', base: 'middle' }));
  });
  // flechas del ciclo
  const arr = (x1: number, y1: number, x2: number, y2: number, a: number) => d.withAlpha(a, () => d.arrow(x1, y1, x2, y2, p.lineStrong, 1.8, 7 * u));
  const A = nodes;
  if (P) {
    arr(A[0].x + A[0].w + 4 * u, A[0].y + A[0].h / 2, A[1].x - 4 * u, A[1].y + A[1].h / 2, Math.min(ap[0], ap[1]));
    arr(A[1].x + A[1].w / 2, A[1].y + A[1].h + 4 * u, A[2].x + A[2].w / 2, A[2].y - 4 * u, Math.min(ap[1], ap[2]));
    arr(A[2].x - 4 * u, A[2].y + A[2].h / 2, A[3].x + A[3].w + 4 * u, A[3].y + A[3].h / 2, Math.min(ap[2], ap[3]));
  } else for (let i = 0; i < 3; i++) arr(A[i].x + A[i].w + 4 * u, A[i].y + A[i].h / 2, A[i + 1].x - 4 * u, A[i + 1].y + A[i + 1].h / 2, Math.min(ap[i], ap[i + 1]));
  // vuelta: el modelo se ajusta
  const back = fr(S, 'rl-recall', 0.52, 0.66), adj = S.l('el modelo se ajusta', 'the model adjusts');
  if (back > 0.01) {
    d.withAlpha(back, () => {
      if (P) {
        const x = A[3].x + A[3].w / 2;
        d.arrow(x, A[3].y - 4 * u, x, A[0].y + A[0].h + 4 * u, w.c, 2, 7 * u);
        fitText(S, adj, x + 10 * u, (A[0].y + A[0].h + A[3].y) / 2, R.x + R.w / 2 - x, { size: 13, weight: 700, color: w.ink, base: 'middle' });
      } else {
        const x3 = A[3].x + A[3].w / 2, x0 = A[0].x + A[0].w / 2;
        d.polyline([[x3, A[3].y + A[3].h + 4 * u], [x3, backY], [x0, backY]], w.c, 2);
        d.arrow(x0, backY, x0, A[0].y + A[0].h + 4 * u, w.c, 2, 7 * u);
        fitText(S, adj, x0 + 10 * u, backY - 5 * u, A[1].x + A[1].w / 2 - x0, { size: 13 * k, weight: 700, color: w.ink, base: 'bottom' });
      }
    });
  }
  // «se puede engañar»
  const fool = fr(S, 'rl-recall', 0.84, 0.95) * (1 - ver);
  if (fool > 0.01) {
    const fy = P ? n2.y + n2.h + 10 * u + chipH(S, 12.5) / 2 : n2.y - chipH(S, 12.5 * k) / 2 - 8 * u;
    chip(S, S.l('se puede engañar', 'can be fooled'), n2.x + n2.w / 2, fy, 'err', { size: 12.5 * k, a: fool, maxW: n2.w + 40 * u });
  }
  // ejemplos de regla
  const exA = [fr(S, 'verifiable', 0.5, 0.64), fr(S, 'verifiable', 0.78, 0.92)];
  ex.forEach((t, i) => chip(S, t, exX[i], exY[i], 'dat', { size: exS, a: exA[i], maxW: P ? R.w : Math.min(R.w * 0.5, 2 * n2.w + 60 * u) }));
  // el nombre: recompensa verificable
  const nm = fr(S, 'verif-name', 0.04, 0.2);
  if (nm > 0.01) {
    const cx = P ? R.x + R.w / 2 : (n2.x + n3.x + n3.w) / 2;
    chip(S, S.l('recompensa verificable', 'verifiable reward'), cx, R.y + chipH(S, 15 * k) / 2, 'dat', { size: 15 * k, a: nm, maxW: P ? R.w : R.w * 0.5 });
  }
}

function drawPractice(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  const dat = tone(S, 'dat'), err = tone(S, 'err'), lat = tone(S, 'lat');
  const tries = [{ L: 0.82, v: 120 }, { L: 0.45, v: 140 }, { L: 0.95, v: 120 }, { L: 0.6, v: 163 }];
  const hs = 13.5 * k;
  const cap = S.l('nadie le dice cómo pensar; solo si acertó', 'no one tells it how to think, only whether it was right');
  const capW = Math.min(R.w, 560 * u * k), capH = F ? chipH(S, 13) : noteH(S, cap, capW, 14 * k);
  const rowH = Math.min((R.h - 2 * fz(S, hs) * u * 1.3 - capH - 16 * u) / 4, 58 * u * k), barH = Math.min(rowH * 0.5, 22 * u * k);
  const title = S.l('un problema · varios intentos, pensando cada vez (ilustrativo)', 'one problem · several tries, thinking each time (illustrative)');
  const titleH = paraH(S, title, R.w, hs, 700) + 6 * u;
  const blockH = titleH + 4 * rowH + 12 * u + capH;
  const y0 = R.y + Math.max(0, (R.h - blockH) / 2);
  para(S, title, R.x, y0, R.w, { size: hs, weight: 700, color: p.ink2, a: fr(S, 'rl-loop', 0.03, 0.15) });
  const top = y0 + titleH;
  const rightW = (P ? 150 : 260) * u * (P ? 1 : k), barW = Math.min(R.w - rightW - 20 * u, P ? R.w : 420 * u * k);
  const left = R.x + (P ? 0 : Math.max(0, (R.w - barW - rightW - 20 * u) / 2));
  tries.forEach((t, i) => {
    const a = fr(S, 'rl-loop', 0.06 + 0.07 * i, 0.14 + 0.07 * i);
    if (a <= 0.01) return;
    const y = top + i * rowH + rowH / 2, ok = t.v === 120;
    const chk = fr(S, 'rl-loop', 0.4 + 0.03 * i, 0.5 + 0.03 * i), arr = fr(S, 'rl-loop', 0.6, 0.74);
    d.withAlpha(a, () => {
      const bl = barW * t.L * clamp(a * 1.3);
      d.rect(left, y - barH / 2, bl, barH, { fill: alpha(lat.c, 0.18), stroke: lat.c, lw: 1.2, r: 2 });
      hatch(S, { x: left, y: y - barH / 2, w: bl, h: barH }, alpha(lat.c, 0.45), 6, 1);
      const ax = left + barW + 12 * u, cs = 15 * k;
      chip(S, String(t.v), ax, y, ok ? 'dat' : 'err', { size: cs, align: 'left', font: 'mono', dash: !ok });
      const cw = chipW(S, String(t.v), cs, 700, 'mono');
      d.withAlpha(chk, () => mark(S, ax + cw + 12 * u, y, ok, 6 * u * k, ok ? dat.c : err.c, 2.4));
      d.withAlpha(arr, () => fitText(S, ok ? S.l('↑ se refuerza', '↑ reinforced') : S.l('↓ se debilita', '↓ weakened'), ax + cw + 26 * u * k, y, R.x + R.w - (ax + cw + 26 * u * k), { size: 13.5 * k, weight: 800, color: ok ? dat.ink : err.ink, base: 'middle' }));
    });
  });
  const ca = fr(S, 'rl-loop', 0.84, 0.95), cy = top + 4 * rowH + 12 * u;
  if (F) chip(S, cap, R.x + R.w / 2, cy + capH / 2, 'ink', { size: 13, a: ca, maxW: R.w });
  else note(S, cap, R.x + R.w / 2, cy, capW, 'ink', { size: 14 * k, a: ca });
}

// ═════════ 8 · DeepSeek-R1 ═════════
export function drawR1(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), F = flat(S), k = K(S);
  const lat = tone(S, 'lat');
  const r1Long = S.on('r1-long');
  const barsR: Rect = { x: R.x, y: R.y, w: R.w, h: r1Long || F ? R.h * 0.42 : R.h * 0.5 };
  let y = groupBars(S, barsR, S.l('AIME 2024: examen de matemáticas de competencia · % de aciertos', 'AIME 2024: competition math exam · % correct'), [{
    name: S.l('DeepSeek-R1-Zero (solo refuerzo)', 'DeepSeek-R1-Zero (reinforcement only)'), a: fr(S, 'r1', 0.1, 0.25),
    bars: [
      { lab: S.l('al empezar el entrenamiento', 'at the start of training'), short: S.l('al empezar', 'at start'), v: PAPERS.r1Start, txt: pct(S, PAPERS.r1Start), a: fr(S, 'r1', 0.55, 0.7), solid: false },
      { lab: S.l('al terminar', 'at the end'), short: S.l('al terminar', 'at the end'), v: PAPERS.r1End, txt: pct(S, PAPERS.r1End), a: fr(S, 'r1', 0.78, 0.92), solid: true },
    ],
  }], { titleA: fr(S, 'r1', 0.04, 0.16) });
  // r1-long: pensamientos cada vez más largos y el «espera, espera»
  if (!r1Long) return;
  y = Math.max(y, R.y + R.h * 0.42) + (F ? 0 : 6 * u);
  const g = fr(S, 'r1-long', 0.1, 0.45, 'io'), a0 = fr(S, 'r1-long', 0.04, 0.14), ls = 12.5 * k;
  const lt = S.l('largo de sus pensamientos durante el entrenamiento (esquema)', 'length of its thinking during training (sketch)');
  para(S, lt, R.x, y, R.w, { size: ls, weight: 700, color: p.ink2, a: a0 });
  y += paraH(S, lt, R.w, ls, 700) + 4 * u;
  const gh = 16 * u * k, gw = R.w * 0.86, gx = gw * lerp(0.12, 1, g);
  d.withAlpha(a0, () => {
    d.rect(R.x, y, gx, gh, { fill: alpha(lat.c, 0.25), stroke: lat.c, lw: 1.2, r: 2 });
    hatch(S, { x: R.x, y, w: gx, h: gh }, alpha(lat.c, 0.5), 6, 1);
    fitText(S, S.l('cientos', 'hundreds'), R.x, y + gh + 4 * u, 120 * u, { size: 12 * k, weight: 700, color: p.mute, base: 'top' });
    d.withAlpha(g, () => fitText(S, S.l('miles de tokens', 'thousands of tokens'), R.x + gx, y + gh + 4 * u, 200 * u, { size: 12 * k, weight: 700, color: lat.ink, base: 'top', align: 'right' }));
  });
  y += gh + fz(S, 12 * k) * u * 1.4 + (F ? 4 : 12) * u;
  const qa = fr(S, 'r1-long', 0.62, 0.78);
  const q = S.l('«Wait, wait. Wait. That’s an aha moment I can flag here.»', '“Wait, wait. Wait. That’s an aha moment I can flag here.”');
  const qw = Math.min(R.w, 600 * u * k), room = R.y + R.h - y, tr = '(«Espera, espera. Espera. Este es un momento ajá que puedo señalar.»)';
  const need = noteH(S, q, qw, 13 * k) + (S.lang === 'es' ? fz(S, 12) * u * 1.4 * Math.ceil(S.d.measure(tr, { size: fz(S, 12), weight: 600 }) / qw) : 0);
  if (room > need) {
    const h = note(S, q, R.x + qw / 2, y, qw, 'lat', { size: 13 * k, a: qa });
    if (S.lang === 'es') S.d.text(tr, R.x + qw / 2, y + h + 4 * u, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', italic: true, a: qa, w: qw });
  } else chip(S, S.l('«Wait, wait. Wait.» («espera, espera, espera»)', '“Wait, wait. Wait.”'), R.x, y + chipH(S, 13) / 2, 'lat', { size: 13, a: qa, align: 'left', maxW: R.w });
}

// ═════════ 9 · cómputo en tiempo de prueba ═════════
export function drawTTC(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, k = K(S);
  const lat = tone(S, 'lat'), w = tone(S, 'w');
  const c1 = S.l('mismos pesos · solo más cálculo al responder', 'same weights · just more computation while answering');
  const term = S.lang === 'es' ? 'cómputo en tiempo de prueba (test-time compute)' : 'test-time compute';
  const foot = chipH(S, 13 * k) + chipH(S, 15 * k) + 18 * u;
  const body: Rect = { x: R.x, y: R.y, w: R.w, h: R.h - foot };
  const gap = (P ? 26 : 48) * u;
  const half = (P ? body.h - gap : body.w - gap) / 2;
  const boxes: Rect[] = P ? [{ x: body.x, y: body.y, w: body.w, h: half }, { x: body.x, y: body.y + half + gap, w: body.w, h: half }] : [{ x: body.x, y: body.y, w: half, h: body.h }, { x: body.x + half + gap, y: body.y, w: half, h: body.h }];
  const labs = [S.l('sin pensar', 'no thinking'), S.l('pensando', 'thinking')];
  const bis = [0, B_MAX], hs = 14 * k;
  boxes.forEach((b, i) => {
    const a = fr(S, 'ttc', 0.04 + 0.1 * i, 0.16 + 0.1 * i);
    d.withAlpha(a, () => {
      fitText(S, labs[i], b.x, b.y + fz(S, hs) * u * 0.6, b.w * 0.45, { size: hs, weight: 800, color: i ? lat.ink : p.ink2, base: 'middle' });
      hitsLabel(S, b.x + b.w, b.y + fz(S, hs) * u * 0.6, b.w * 0.55, hits(lg(S), bis[i]), N_TRIES, { align: 'right', size: hs });
      const g: Rect = { x: b.x, y: b.y + fz(S, hs) * u * 1.5, w: b.w, h: b.h - fz(S, hs) * u * 1.5 };
      const ans = answers(lg(S), bis[i]);
      gridCells(S, g, N_TRIES).forEach((c, j) => cell(S, c, ans[j], { marks: 1 }));
    });
  });
  // entre las dos: una flecha; al pie: mismos pesos y el nombre
  const ma = fr(S, 'ttc', 0.3, 0.45);
  d.withAlpha(ma, () => {
    if (P) { const x = R.x + R.w / 2, y = boxes[0].y + boxes[0].h + 3 * u; d.arrow(x, y, x, boxes[1].y - 3 * u, w.c, 2, 7 * u); }
    else { const x = boxes[0].x + boxes[0].w, y = body.y + body.h / 2; d.arrow(x + 6 * u, y, x + gap - 6 * u, y, w.c, 2.2, 8 * u); }
  });
  chip(S, c1, R.x + R.w / 2, R.y + R.h - chipH(S, 15 * k) - 8 * u - chipH(S, 13 * k) / 2, 'w', { size: 13 * k, a: ma, maxW: R.w });
  chip(S, term, R.x + R.w / 2, R.y + R.h - chipH(S, 15 * k) / 2, 'lat', { size: 15 * k, a: fr(S, 'ttc', 0.62, 0.78), maxW: R.w });
  void mark;
}
