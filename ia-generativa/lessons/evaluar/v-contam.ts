// Vistas 4–7: contaminación y la ley de Goodhart.
//  · drawLeak     (contam, contam-name): internet → entrenamiento → modelo; el examen también está en internet y se cuela.
//  · drawSeen     (contam-demo … try-contam): el examen de A (100 preguntas) y la tabla A contra B; «tu turno» con la parte vista.
//  · drawGsm      (gsm1k): esquema de GSM1k (Zhang et al., 2024).
//  · drawGoodhart (goodhart): la nota sube, lo que sabe no tanto (ilustrativo).
import { alpha, clamp, hash, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { GSM1K } from './data';
import { ABILITY_A, ABILITY_B, scoreA } from './stats';
import { FS, area, card, chip, chipH, chipW, fitText, fr, gridGeom, growArrow, mark, para, pct } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Internet → entrenamiento → modelo
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawLeak(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const net: Rect = port ? { x: A.x, y: A.y + 4 * u, w: A.w, h: A.h * 0.46 } : { x: A.x, y: A.y + A.h * 0.1, w: A.w * 0.48, h: A.h * 0.78 };
  const mw = Math.min(150 * u, port ? A.w * 0.5 : A.w * 0.24), mh = Math.min(96 * u, port ? A.h * 0.2 : A.h * 0.34);
  const model: Rect = port ? { x: A.x + (A.w - mw) / 2, y: A.y + A.h - mh - 8 * u, w: mw, h: mh } : { x: A.x + A.w - mw - 6 * u, y: net.y + (net.h - mh) / 2, w: mw, h: mh };
  const pad = 12 * u;
  // internet: renglones de texto y, entre ellos, hojas de examen
  const aNet = fr(S, 'contam', 0.22, 0.36);
  const exams = [[0.1, 0.12], [0.58, 0.18], [0.82, 0.72]] as const;
  d.withAlpha(aNet, () => {
    card(S, net, { tone: 'dat' });
    fitText(S, S.l('texto de internet', 'text from the internet'), net.x + pad, net.y + pad, net.w - 2 * pad, 14, { weight: 800, base: 'top', color: tone(S, 'dat').ink });
    const top = net.y + pad + FS(S, 14) * u + 10 * u, rows = Math.max(4, Math.floor((net.h - (top - net.y) - pad) / (12 * u)));
    for (let i = 0; i < rows; i++) {
      const y = top + i * (net.h - (top - net.y) - pad) / rows;
      let x = net.x + pad;
      while (x < net.x + net.w - pad - 20 * u) {
        const w = (18 + 50 * hash(i, Math.round(x))) * u, ww = Math.min(w, net.x + net.w - pad - x);
        d.rect(x, y, ww, 4 * u, { fill: alpha(p.ink2, 0.22), r: 2 });
        x += w + 8 * u;
      }
    }
  });
  // las hojas del examen, dentro de internet
  const aEx = fr(S, 'contam', 0.78, 0.9);
  const ew = Math.min(46 * u, net.w * 0.16), eh = ew * 1.25;
  const into = S.on('contam-name') ? fr(S, 'contam-name', 0.08, 0.42, 'io') : 0;
  exams.forEach(([fx, fy], i) => {
    const x0 = net.x + fx * (net.w - ew), y0 = net.y + 34 * u + fy * (net.h - eh - 44 * u);
    const sc = 0.55, tx = model.x + model.w / 2 - (ew * sc) / 2 + (i - 1) * ew * 0.45, ty = model.y + FS(S, 14) * u + 18 * u;
    const k = clamp(into * 1.3 - i * 0.15);
    const x = lerp(x0, tx, k), y = lerp(y0, ty, k), a = aEx, w = ew * lerp(1, sc, k), h = eh * lerp(1, sc, k);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      d.rect(x, y, w, h, { fill: p.surface, stroke: tone(S, 'lat').c, lw: 1.8, r: 2 });
      for (let j = 0; j < 3; j++) d.rect(x + w * 0.14, y + h * 0.22 + j * h * 0.22, w * 0.72, Math.max(2, 3 * u * lerp(1, sc, k)), { fill: alpha(tone(S, 'lat').c, 0.6), r: 1 });
    });
  });
  if (aEx > 0.01) {
    const [fx, fy] = exams[0];
    const x0 = net.x + fx * (net.w - ew), y0 = net.y + 34 * u + fy * (net.h - eh - 44 * u);
    chip(S, S.l('examen público', 'public exam'), x0, y0 + eh + 14 * u, 'lat', { a: aEx * (1 - into), size: 12.5, align: 'left' });
  }
  // flecha del entrenamiento y el modelo
  const aArr = fr(S, 'contam', 0.4, 0.55);
  if (port) growArrow(S, A.x + A.w / 2, net.y + net.h + 6 * u, A.x + A.w / 2, model.y - 8 * u, aArr, p.lineStrong, 2.4);
  else growArrow(S, net.x + net.w + 8 * u, net.y + net.h / 2, model.x - 8 * u, model.y + model.h / 2, aArr, p.lineStrong, 2.4);
  const mid = port ? [A.x + A.w / 2 + 10 * u, (net.y + net.h + model.y) / 2] : [(net.x + net.w + model.x) / 2, net.y + net.h / 2 - 14 * u];
  fitText(S, S.l('entrenamiento', 'training'), mid[0], mid[1], port ? A.w / 2 - 20 * u : model.x - net.x - net.w - 16 * u, 12.5, { weight: 700, color: p.ink2, align: port ? 'left' : 'center', base: port ? 'middle' : 'bottom', a: aArr });
  d.withAlpha(aArr, () => {
    card(S, model, { tone: 'lat', hot: into > 0.9 ? 0.4 : 0 });
    fitText(S, S.l('modelo', 'model'), model.x + model.w / 2, model.y + 12 * u, model.w - 12 * u, 14, { weight: 800, align: 'center', base: 'top', color: tone(S, 'lat').ink });
  });
  // contaminación
  const aName = fr(S, 'contam-name', 0.5, 0.62);
  if (aName > 0.01) {
    const bx = port ? A.x + A.w / 2 : model.x + model.w / 2, by = port ? model.y - chipH(S, 15) / 2 - 8 * u : model.y - chipH(S, 15) / 2 - 10 * u;
    chip(S, S.l('contaminación', 'contamination'), port ? A.x + 4 * u : bx, port ? net.y + net.h + 22 * u : by, 'err', { a: aName, size: 15, weight: 800, align: port ? 'left' : 'center' });
    const sub = S.l('= fuga de datos (lección 10)', '= data leakage (lesson 10)');
    const sy = port ? net.y + net.h + 22 * u + chipH(S, 15) / 2 + 6 * u : model.y + model.h + 10 * u;
    if (port) para(S, sub, A.x + 4 * u, sy, A.w / 2 - 14 * u, FS(S, 12.5), { weight: 700, color: tone(S, 'err').ink, a: fr(S, 'contam-name', 0.72, 0.84), maxLines: 2 });
    else fitText(S, sub, bx, sy, model.w + 60 * u, 12.5, { weight: 700, align: 'center', base: 'top', color: tone(S, 'err').ink, a: fr(S, 'contam-name', 0.72, 0.84) });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// El examen de A y la tabla
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Qué preguntas sabe resolver A de verdad (70 de 100) y en qué orden las «vio»: cada bloque de 10 vistas trae 7 que ya sabía
 *  resolver y 3 que no. Así la nota es exactamente vistas + 70 % del resto, y al ver más ninguna casilla cambia de acierto a fallo. */
const ORDER: number[] = [], SOLVES = new Set<number>();
(() => {
  const ids = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a, 31) - hash(b, 31));
  ids.slice(0, ABILITY_A).forEach((i) => SOLVES.add(i));
  const yes = ids.slice(0, ABILITY_A).sort((a, b) => hash(a, 57) - hash(b, 57)), no = ids.slice(ABILITY_A).sort((a, b) => hash(a, 57) - hash(b, 57));
  for (let k = 0; k < 10; k++) ORDER.push(...yes.slice(k * 7, k * 7 + 7), ...no.slice(k * 3, k * 3 + 3));
})();
const RANK = new Map(ORDER.map((q, i) => [q, i]));

export function drawSeen(S: Frame, seenNow: number, seenPrev: number, mixK: number) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const gR: Rect = port ? { x: A.x, y: A.y + FS(S, 13.5) * u + 10 * u, w: A.w, h: A.h * 0.5 } : { x: A.x, y: A.y + FS(S, 13.5) * u + 10 * u, w: A.w * 0.44, h: A.h - FS(S, 13.5) * u - 10 * u - 46 * u };
  const g = gridGeom(gR, 10, 10, 34 * u);
  const a0 = fr(S, 'contam-demo', 0.02, 0.16);
  // título y cuadrícula
  fitText(S, S.l('examen de A: 100 preguntas', 'A’s exam: 100 questions'), g.x, A.y, port ? A.w : gR.w, 13.5, { weight: 800, base: 'top', color: p.ink2, a: a0 });
  const seenAt = (n: number, q: number) => (RANK.get(q) ?? 99) < n;
  for (let q = 0; q < 100; q++) {
    const x = g.x + (q % 10) * g.s, y = g.y + Math.floor(q / 10) * g.s;
    const base = SOLVES.has(q) ? 'ok' : 'bad';
    const a = a0 * clamp(fr(S, 'contam-demo', 0.05, 0.3) * 1.4 - (q / 100) * 0.4);
    const sNow = seenAt(seenNow, q), sPrev = seenAt(seenPrev, q);
    if (sNow === sPrev) mark(S, x, y, g.s, sNow ? 'seen' : base, a, 'dat');
    else { mark(S, x, y, g.s, sPrev ? 'seen' : base, a * (1 - mixK), 'dat'); mark(S, x, y, g.s, sNow ? 'seen' : base, a * mixK, 'dat'); }
  }
  // leyenda bajo la cuadrícula (horizontal) o a la derecha de las barras (vertical)
  const legA = fr(S, 'contam-demo', 0.3, 0.42), legS = fr(S, 'contam-demo', 0.8, 0.92);
  const lg = (x: number, y: number, m: 'ok' | 'bad' | 'seen', t: string, a: number, w: number) => { const s = 16 * u; mark(S, x, y - s / 2, s, m, a); fitText(S, t, x + s + 6 * u, y, w - s - 6 * u, 12.5, { weight: 600, base: 'middle', a, color: p.ink2 }); };
  const ly = g.y + g.h + 16 * u;
  if (port) {
    const lw = A.w / 3;
    lg(A.x, ly, 'ok', S.l('la resuelve', 'solves it'), legA, lw); lg(A.x + lw, ly, 'bad', S.l('falla', 'misses'), legA, lw); lg(A.x + 2 * lw, ly, 'seen', S.l('la vio', 'saw it'), legS, lw);
  } else {
    const lw = gR.w / 3;
    lg(gR.x, ly, 'ok', S.l('la resuelve', 'solves it'), legA, lw); lg(gR.x + lw, ly, 'bad', S.l('falla', 'misses'), legA, lw); lg(gR.x + 2 * lw, ly, 'seen', S.l('la vio', 'saw it'), legS, lw);
  }
  // la tabla: nota de A y de B
  const T: Rect = port ? { x: A.x, y: ly + 22 * u, w: A.w, h: A.y + A.h - ly - 22 * u } : { x: A.x + A.w * 0.5, y: A.y + A.h * 0.12, w: A.w * 0.5, h: A.h * 0.76 };
  const aT = fr(S, 'contam-demo', 0.12, 0.26);
  const sA = scoreA(seenNow) * mixK + scoreA(seenPrev) * (1 - mixK), sB = ABILITY_B;
  const rows = [{ k: 'A', v: sA, real: ABILITY_A, t: 'lat' as const }, { k: 'B', v: sB, real: ABILITY_B, t: 'w' as const }];
  const head = FS(S, 13.5) * u + 10 * u, rh = Math.min(64 * u, (T.h - head - 30 * u) / 2.2), lab = 30 * u, numW = 50 * u + chipW(S, S.l('1.º', '1st'), 12) + 8 * u;
  const bx = T.x + lab, bw = T.w - lab - numW, X = (v: number) => bx + (v / 100) * bw;
  d.withAlpha(aT, () => {
    fitText(S, S.l('nota en el examen', 'score on the exam'), T.x, T.y, T.w, 13.5, { weight: 800, base: 'top', color: p.ink2 });
    const lead = sA > sB + 0.25 ? 'A' : sB > sA + 0.25 ? 'B' : '=';
    rows.forEach((r, i) => {
      const y = T.y + head + i * rh, c = tone(S, r.t), bh = Math.min(26 * u, rh * 0.5);
      d.text(r.k, T.x + 4 * u, y + rh / 2, { size: FS(S, 18), weight: 800, font: 'mono', color: c.ink, base: 'middle' });
      d.rect(bx, y + (rh - bh) / 2, bw, bh, { fill: p.surface2, r: 2 });
      const real = Math.min(r.v, r.real);
      d.rect(bx, y + (rh - bh) / 2, X(real) - bx, bh, { fill: alpha(c.c, 0.75), r: 2 });
      if (r.v > r.real + 0.01) d.rect(X(r.real), y + (rh - bh) / 2, X(r.v) - X(r.real), bh, { fill: alpha(tone(S, 'lat').c, 0.25), stroke: tone(S, 'lat').c, lw: 1.4, dash: [4, 3] });
      d.text(S.n(r.v, 0), bx + bw + 8 * u, y + rh / 2, { size: FS(S, 18), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      // primero en la tabla
      const first = lead === r.k;
      if (first) chip(S, S.l('1.º', '1st'), bx + bw + 8 * u + S.d.measure(S.n(r.v, 0), { size: FS(S, 18), weight: 800, font: 'mono' }) + 8 * u, y + rh / 2, 'sig', { size: 12, align: 'left', a: fr(S, 'contam-demo', 0.2, 0.3) });
    });
    if (lead === '=') chip(S, S.l('empate', 'tie'), bx + bw + 8 * u, T.y + head + rh, 'w', { size: 12, align: 'left' });
    // capacidad real
    const ry = T.y + head + 2 * rh + 6 * u;
    if (ry + 30 * u < T.y + T.h + 10 * u) para(S, S.l(`lo que resuelven de verdad: A ${ABILITY_A} · B ${ABILITY_B}`, `what they truly solve: A ${ABILITY_A} · B ${ABILITY_B}`), T.x, ry, T.w, 12.5, { weight: 700, color: p.ink2, maxLines: 2 });
    if (seenNow > 0 || mixK < 1) {
      const vy = ry + 2 * FS(S, 12.5) * u * 1.3 + 6 * u;
      if (vy + 16 * u < T.y + T.h + 16 * u) {
        const s = 14 * u; d.rect(T.x, vy, s * 1.6, s * 0.8, { fill: alpha(tone(S, 'lat').c, 0.25), stroke: tone(S, 'lat').c, lw: 1.4, dash: [4, 3] });
        fitText(S, S.l('lo que sube por memoria', 'what memory adds'), T.x + s * 1.6 + 8 * u, vy + s * 0.4, T.w - s * 2, 12.5, { weight: 600, base: 'middle', color: p.ink2 });
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// GSM1k: problemas nuevos (esquema)
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawGsm(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const a0 = fr(S, 'gsm1k', 0.02, 0.15);
  fitText(S, S.l(`${S.n(GSM1K.problems, 0)} problemas nuevos, al estilo de GSM8k`, `${S.n(GSM1K.problems, 0)} new problems, in the style of GSM8k`), A.x, A.y + 4 * u, A.w, 14, { weight: 800, base: 'top', color: p.ink2, a: a0 });
  const groups = [
    { lab: S.l('algunos modelos', 'some models'), drop: 0.1, note: S.l(`hasta −${GSM1K.maxDrop} puntos`, `up to −${GSM1K.maxDrop} points`), at: 0.62, t: 'err' as const },
    { lab: S.l('los mejores', 'the best ones'), drop: 0.015, note: S.l('casi igual', 'about the same'), at: 0.86, t: 'dat' as const },
  ];
  const top = A.y + FS(S, 14) * u + 30 * u, bot = A.y + A.h - (2 * FS(S, 12) * 1.15 + FS(S, 13.5) + 24) * u, H = bot - top;
  const gw = A.w / 2, bwid = Math.min(port ? 70 * u : 90 * u, gw * 0.3);
  groups.forEach((g, i) => {
    const cx = A.x + gw * (i + 0.5), a = fr(S, 'gsm1k', g.at - 0.3, g.at - 0.18);
    d.withAlpha(a, () => {
      const h1 = H * 0.86, h2 = H * 0.86 * (1 - g.drop);
      const x1 = cx - bwid - 6 * u, x2 = cx + 6 * u;
      d.rect(x1, bot - h1, bwid, h1, { fill: alpha(tone(S, 'ink').c, 0.18), stroke: p.lineStrong, lw: 1.2 });
      d.rect(x2, bot - h2, bwid, h2, { fill: alpha(tone(S, g.t).c, 0.35), stroke: tone(S, g.t).c, lw: 1.6 });
      d.line(cx - gw * 0.42, bot, cx + gw * 0.42, bot, p.lineStrong, 1.5);
      const lw = bwid + 10 * u, ls = FS(S, 12);
      para(S, S.l('examen famoso', 'famous exam'), x1 + bwid / 2 - lw / 2, bot + 6 * u, lw, ls, { weight: 600, align: 'center', color: p.ink2, maxLines: 2, lh: 1.15 });
      para(S, S.l('problemas nuevos', 'new problems'), x2 + bwid / 2 - lw / 2, bot + 6 * u, lw, ls, { weight: 600, align: 'center', color: p.ink2, maxLines: 2, lh: 1.15 });
      fitText(S, g.lab, cx, bot + 10 * u + 2 * ls * u * 1.15 + 6 * u, gw - 10 * u, 13.5, { weight: 800, align: 'center', base: 'top' });
      // nota de la diferencia
      const k = fr(S, 'gsm1k', g.at - 0.12, g.at);
      d.withAlpha(k, () => {
        if (g.drop > 0.05) d.line(x2 - 2 * u, bot - h1, x2 + bwid + 6 * u, bot - h1, tone(S, 'err').c, 1.5, [3, 3]);
        fitText(S, g.note, cx, bot - h1 - 10 * u, gw - 10 * u, 14, { weight: 800, align: 'center', base: 'bottom', color: tone(S, g.t).ink, halo: true });
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Goodhart: la nota sube; lo que sabe, mucho menos (ilustrativo)
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawGoodhart(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const law = S.l('si una medida se vuelve la meta, deja de medir bien', 'when a measure becomes the target, it stops measuring well');
  const lawH = (port ? 3 : 2) * FS(S, 15) * u * 1.3;
  const P: Rect = { x: A.x + 26 * u, y: A.y + lawH + 22 * u, w: A.w - 40 * u, h: A.h - lawH - 22 * u - 34 * u };
  const a0 = fr(S, 'goodhart', 0.05, 0.2);
  d.withAlpha(fr(S, 'goodhart', 0.25, 0.4), () => para(S, law, A.x, A.y + 4 * u, A.w, FS(S, 15), { weight: 800, color: tone(S, 'err').ink, maxLines: port ? 3 : 2 }));
  d.withAlpha(a0, () => {
    d.line(P.x, P.y + P.h, P.x + P.w, P.y + P.h, p.lineStrong, 1.6);
    d.line(P.x, P.y, P.x, P.y + P.h, p.lineStrong, 1.6);
    fitText(S, S.l('tiempo: todos entrenan para el examen →', 'time: everyone trains for the exam →'), P.x + P.w, P.y + P.h + 8 * u, P.w, 12.5, { weight: 700, align: 'right', base: 'top', color: p.ink2 });
  });
  const sweep = fr(S, 'goodhart', 0.5, 0.9, 'io');
  const curve = (f: (x: number) => number, t: 'err' | 'dat', dash?: number[]) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) { const x = i / 60; if (x > sweep) break; pts.push([P.x + x * P.w, P.y + P.h - f(x) * P.h]); }
    d.polyline(pts, tone(S, t).c, 3, { dash });
  };
  const score = (x: number) => 0.3 + 0.62 * (1 - Math.exp(-3 * x)), know = (x: number) => 0.3 + 0.2 * (1 - Math.exp(-2 * x));
  curve(score, 'err'); curve(know, 'dat', [6, 4]);
  const k = fr(S, 'goodhart', 0.85, 0.97);
  d.withAlpha(k, () => {
    fitText(S, S.l('la nota en el examen', 'the score on the exam'), P.x + P.w, P.y + P.h - score(1) * P.h - 8 * u, P.w * 0.7, 13, { weight: 800, align: 'right', base: 'bottom', color: tone(S, 'err').ink, halo: true });
    fitText(S, S.l('lo que de verdad sabe', 'what it really knows'), P.x + P.w, P.y + P.h - know(1) * P.h + 8 * u, P.w * 0.7, 13, { weight: 800, align: 'right', base: 'top', color: tone(S, 'dat').ink, halo: true });
  });
  void pct;
}
