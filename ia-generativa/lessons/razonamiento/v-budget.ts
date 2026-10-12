// Vista 10: el presupuesto de pensamiento. Primero un intento con su tope; luego la gráfica de aciertos (de 32) frente al
// presupuesto, con los 32 intentos al lado. Todo es lo medido (runs.ts). El control `bud` es el índice del presupuesto.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { area, chip, chipH, chipW, fitText, flat, fr, fz, hatch, int, K, note, noteH } from './ui';
import { attempts, bounds, hitsLabel } from './parts';
import { answers, BUDGETS, B_MAX, hits, lengths, meanLen, N_TRIES, usedMean, type L2 } from './runs';

const lg = (S: Frame) => S.lang as L2;

/** Reparto: principal (tope o gráfica) + lateral (lecturas y los 32 intentos). */
function layout(S: Frame) {
  const u = S.u, R = area(S), P = S.portrait, F = flat(S);
  if (P) {
    const mh = R.h * 0.5;
    return { R, main: { x: R.x, y: R.y, w: R.w, h: mh } as Rect, side: { x: R.x, y: R.y + mh + 10 * u, w: R.w, h: R.h - mh - 10 * u } as Rect };
  }
  const mw = R.w * (F ? 0.54 : 0.57);
  return { R, main: { x: R.x, y: R.y, w: mw, h: R.h } as Rect, side: { x: R.x + mw + 20 * u, y: R.y, w: R.w - mw - 20 * u, h: R.h } as Rect };
}

export function drawBudget(S: Frame) {
  const { d } = S, L = layout(S);
  const bi = Math.round(Number(S.p.bud ?? B_MAX)), shown = Number(S.st.budShown ?? bi);
  const barA = S.on('axis-x') ? 1 - S.at('axis-x', 0, 0.45) : 1;
  if (barA > 0.01) d.withAlpha(barA, () => drawCut(S, L.main, bi));
  if (S.on('axis-x')) d.withAlpha(S.at('axis-x', 0, 0.5), () => drawPlot(S, L.main, bi, shown));
  drawSide(S, L.side, bi);
}

// ── un intento y su tope ──
function drawCut(S: Frame, r: Rect, bi: number) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat'), w = tone(S, 'w'), k = K(S), F = flat(S);
  const L = lengths(lg(S))[0], B = BUDGETS[bi], MAXT = 640;
  const x0 = r.x + 4 * u, bw = r.w - 60 * u, X = (t: number) => x0 + bw * Math.min(t, MAXT) / MAXT;
  const bh = Math.min(34 * u * k, r.h * 0.14), ts = 13.5 * k, ls = 12 * k;
  const msgH = noteH(S, 'x', 300 * u, 13 * k);
  const blockH = fz(S, ts) * u * 1.4 + 28 * u * k + bh + 10 * u + 2 * fz(S, ls) * u * 1.3 + 14 * u + msgH;
  const top = r.y + Math.max(0, (r.h - blockH) / 2) + (F ? 0 : 10 * u);
  const cy = top + fz(S, ts) * u * 1.4 + 28 * u * k + bh / 2;
  const a = fr(S, 'budget', 0.06, 0.2);
  d.withAlpha(a, () => {
    fitText(S, S.l('un intento: su pensamiento, token a token', 'one try: its thinking, token by token'), x0, top, r.w, { size: ts, weight: 700, color: p.ink2, base: 'top' });
    // escala
    const sy = cy + bh / 2 + 10 * u;
    d.line(x0, sy, x0 + bw, sy, p.lineStrong, 1);
    [0, 200, 400, 600].forEach((t) => { d.line(X(t), sy - 3 * u, X(t), sy + 3 * u, p.lineStrong, 1); fitText(S, String(t), X(t), sy + 6 * u, 40 * u, { size: ls, font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' }); });
    fitText(S, 'tokens', x0 + bw, sy + 6 * u + fz(S, ls) * u * 1.3, 80 * u, { size: ls, weight: 600, color: p.mute, align: 'right', base: 'top' });
  });
  const grow = fr(S, 'budget', 0.12, 0.42, 'lin');
  const full = L * grow, cut = Math.min(full, B);
  d.withAlpha(a, () => {
    d.rect(x0, cy - bh / 2, X(cut) - x0, bh, { fill: alpha(lat.c, 0.22), stroke: lat.c, lw: 1.3, r: 2 });
    hatch(S, { x: x0, y: cy - bh / 2, w: X(cut) - x0, h: bh }, alpha(lat.c, 0.5), 6, 1);
    // lo que ya no se piensa: punteado
    if (full > B) d.rect(X(B), cy - bh / 2, X(L) - X(B), bh, { stroke: p.mute, lw: 1.2, dash: [4, 3], r: 2 });
  });
  // el tope
  const ta = fr(S, 'budget', 0.3, 0.42);
  d.withAlpha(ta, () => {
    const tx = X(B), over = B > MAXT;
    d.line(tx, cy - bh / 2 - 10 * u, tx, cy + bh / 2 + 6 * u, w.c, 2.5, over ? [4, 3] : undefined);
    fitText(S, S.l(`tope: ${int(S, B)}`, `cap: ${int(S, B)}`) + (over ? ' →' : ''), Math.min(tx, x0 + bw), cy - bh / 2 - 12 * u, 140 * u, { size: 13.5 * k, weight: 800, color: w.ink, align: over ? 'right' : 'center', base: 'bottom' });
  });
  // qué pasa: terminó solo, o lo cortamos y le pedimos la respuesta
  if (grow >= 0.999) {
    const msg = L <= B ? S.l(`terminó solo en ${L} tokens → responde`, `finished on its own at ${L} tokens → answers`) : S.l('cortado aquí → «responde ya»', 'cut off here → “answer now”');
    const my = cy + bh / 2 + 10 * u + 6 * u + 2 * fz(S, ls) * u * 1.3 + 10 * u;
    const mw = Math.min(r.w, 400 * u * k);
    note(S, msg, x0 + mw / 2, my, mw, L <= B ? 'dat' : 'w', { size: 13 * k });
  }
}

// ── la gráfica: aciertos (de 32) frente al presupuesto ──
function drawPlot(S: Frame, r: Rect, bi: number, shown: number) {
  const { d, pal: p } = S, u = S.u, F = flat(S), dat = tone(S, 'dat'), w = tone(S, 'w');
  const padL = 30 * u, padB = (F ? 30 : 40) * u, padT = fz(S, 12.5) * u * 1.5 + 4 * u, padR = 12 * u;
  const pr: Rect = { x: r.x + padL, y: r.y + padT, w: r.w - padL - padR, h: r.h - padT - padB };
  const X = (i: number) => pr.x + (i / B_MAX) * pr.w, Y = (k: number) => pr.y + pr.h - (k / N_TRIES) * pr.h;
  // eje horizontal: el presupuesto
  const ax = fr(S, 'axis-x', 0.12, 0.3);
  d.withAlpha(ax, () => d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5));
  const labs = BUDGETS.map((b) => int(S, b));
  const step = pr.w / B_MAX, every = labs.every((t) => S.d.measure(t, { size: fz(S, 12), font: 'mono' }) < step - 4 * u) ? 1 : 2;
  BUDGETS.forEach((_, i) => {
    const a = fr(S, 'axis-x', 0.2 + 0.05 * i, 0.26 + 0.05 * i);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      d.line(X(i), pr.y + pr.h, X(i), pr.y + pr.h + 5 * u, p.lineStrong, 1.5);
      if (i % every === 0 || i === B_MAX) fitText(S, labs[i], X(i), pr.y + pr.h + 7 * u, step * every, { size: 12, font: 'mono', weight: 600, color: i === bi ? p.ink : p.mute, align: 'center', base: 'top' });
    });
  });
  // «cada marca es el doble»
  const dbl = fr(S, 'axis-x', 0.72, 0.86) * (1 - fr(S, 'axis-y', 0.05, 0.2));
  if (dbl > 0.01) for (let i = 1; i < B_MAX; i++) fitText(S, '×2', (X(i) + X(i + 1)) / 2, pr.y + pr.h - 4 * u, step, { size: 12, weight: 800, color: w.ink, align: 'center', base: 'bottom', a: dbl });
  if (!F) fitText(S, S.l('presupuesto de pensamiento (tokens)', 'thinking budget (tokens)'), pr.x + pr.w, pr.y + pr.h + 7 * u + fz(S, 12) * u * 1.35, pr.w, { size: 12.5, weight: 700, color: p.ink2, align: 'right', base: 'top', a: fr(S, 'axis-x', 0.1, 0.25) });
  // eje vertical: aciertos
  const ay = fr(S, 'axis-y', 0.04, 0.2);
  d.withAlpha(ay, () => {
    d.line(pr.x, pr.y, pr.x, pr.y + pr.h, p.lineStrong, 1.5);
    [0, 16, 32].forEach((k) => { d.line(pr.x - 4 * u, Y(k), pr.x, Y(k), p.lineStrong, 1.5); fitText(S, String(k), pr.x - 7 * u, Y(k), padL - 8 * u, { size: 12, font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' }); });
    d.line(pr.x, Y(32), pr.x + pr.w, Y(32), alpha(p.lineStrong, 0.5), 1, [3, 4]);
    fitText(S, S.l('aciertos (de 32)', 'right (out of 32)'), pr.x - 4 * u, pr.y - 6 * u, pr.w * 0.7, { size: 12.5, weight: 700, color: p.ink2, base: 'bottom' });
  });
  // los puntos medidos: se revelan con la demostración
  const rev = Number(S.st.budRev ?? 0);
  const pts: [number, number][] = [];
  for (let i = 0; i <= B_MAX; i++) {
    if (i > rev + 1e-6) break;
    const a = i === 0 ? fr(S, 'axis-y', 0.55, 0.7) : 1;
    if (a <= 0.01) continue;
    pts.push([X(i), Y(hits(lg(S), i))]);
  }
  if (pts.length > 1) d.polyline(pts, dat.c, 2.2);
  pts.forEach(([x, y], i) => d.circle(x, y, (i === bi ? 5 : 3.6) * u, { fill: dat.c, stroke: p.stage, lw: 1.5, a: i === 0 ? fr(S, 'axis-y', 0.55, 0.7) : 1 }));
  if (S.is('axis-y')) {
    const a = fr(S, 'axis-y', 0.65, 0.8);
    chip(S, S.l('sin pensar', 'no thinking'), X(0) + 8 * u, Y(hits(lg(S), 0)) - 16 * u, 'ink', { size: 12, align: 'left', a });
  }
  // el presupuesto actual: línea guía y anillo
  if (S.on('demo-low')) {
    const xs = X(shown);
    d.line(xs, pr.y, xs, pr.y + pr.h, alpha(w.c, 0.8), 1.5, [4, 3]);
    if (bi <= rev + 1e-6) d.circle(X(bi), Y(hits(lg(S), bi)), 8 * u, { stroke: p.ink, lw: 1.8 });
  }
  // natural: termina solo hacia los quinientos tokens
  const na = fr(S, 'natural', 0.3, 0.45);
  if (na > 0.01) {
    const m = meanLen(lg(S)), xi = 5 + Math.log2(m / 512);
    d.withAlpha(na, () => {
      const cy = pr.y + pr.h * 0.72;
      d.line(X(xi), pr.y + 6 * u, X(xi), pr.y + pr.h, tone(S, 'lat').c, 2, [2, 3]);
      const lab = S.l(`termina solo ≈ ${int(S, m)}`, `stops on its own ≈ ${int(S, m)}`), right = X(xi) + chipW(S, lab, 12) + 10 * u > pr.x + pr.w;
      chip(S, lab, X(xi) + (right ? -6 : 6) * u, cy, 'lat', { size: 12, align: right ? 'right' : 'left' });
    });
  }
}

// ── al lado: presupuesto, tokens pensados y los 32 intentos ──
function drawSide(S: Frame, r: Rect, bi: number) {
  const { d, pal: p } = S, u = S.u, P = S.portrait, k = K(S), w = tone(S, 'w'), lat = tone(S, 'lat');
  const B = BUDGETS[bi], s1 = 15 * k, s2 = 13 * k;
  const l1 = fz(S, s1) * u * 1.4, l2 = fz(S, s2) * u * 1.4;
  d.withAlpha(fr(S, 'budget', 0.3, 0.42), () => fitText(S, S.l(`presupuesto: ${int(S, B)} tokens`, `budget: ${int(S, B)} tokens`), r.x, r.y + l1 / 2, r.w, { size: s1, weight: 800, color: w.ink, base: 'middle' }));
  const gridA = fr(S, 'axis-y', 0.25, 0.4);
  if (gridA <= 0.01) return;
  const used = usedMean(lg(S), B), nat = fr(S, 'natural', 0.55, 0.7);
  d.withAlpha(gridA, () => {
    const str = S.l(`pensó en promedio: ${int(S, used)}`, `thought on average: ${int(S, used)}`);
    const ux = r.x, uy = r.y + l1 + l2 / 2, al: CanvasTextAlign = 'left', mw = r.w;
    fitText(S, str, ux, uy, mw, { size: s2, weight: 700, color: nat > 0.5 ? lat.ink : p.ink2, align: al, base: 'middle' });
    if (nat > 0.01) {
      const tw = Math.min(mw, S.d.measure(str, { size: fz(S, s2), weight: 700 }));
      d.withAlpha(nat, () => d.line(ux, uy + l2 * 0.42, ux + tw, uy + l2 * 0.42, lat.c, 2));
    }
    const gy = r.y + l1 + l2 + 6 * u, readH = fz(S, 15 * k) * u * 1.7;
    const gr: Rect = { x: r.x, y: gy, w: r.w, h: r.y + r.h - gy - readH };
    const cells = attempts(S, gr, answers(lg(S), bi), { marks: 1 });
    const b = bounds(cells);
    hitsLabel(S, b.x, b.y + b.h + readH / 2 + 2 * u, b.w, hits(lg(S), bi), N_TRIES);
  });
}
