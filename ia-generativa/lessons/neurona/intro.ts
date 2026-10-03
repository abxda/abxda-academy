// Apertura: de la recta del modelo anterior a la neurona; la neurona biológica; el modelo de McCulloch y Pitts (1943).
import { alpha, clamp, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { arrow, fit, fs, lerpRect, parts, tag, tau, tr, txt } from './ui';

// ── la recta del modelo anterior (lección 3) ─────────────────────────────
const LINE_PTS: [number, number][] = [[0.08, 0.2], [0.2, 0.21], [0.3, 0.39], [0.42, 0.39], [0.52, 0.53], [0.65, 0.54], [0.78, 0.72], [0.9, 0.75]];

export function drawHook(S: Frame, D: Rect) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), sg = tone(S, 'sig');
  const port = S.portrait;
  // plot a la izquierda (escritorio) o arriba (teléfono)
  const pr = port
    ? fit({ x: D.x + D.w * 0.12, y: D.y + 6 * u, w: D.w * 0.76, h: D.h * 0.40 }, 1.45)
    : fit({ x: D.x + D.w * 0.02, y: D.y + D.h * 0.10, w: D.w * 0.46, h: D.h * 0.62 }, 1.25);
  const a1 = S.reveal('hook', 0.1, 0.6);
  const X = (v: number) => pr.x + 22 * u + v * (pr.w - 34 * u), Y = (v: number) => pr.y + pr.h - 16 * u - v * (pr.h - 30 * u);
  d.withAlpha(a1, () => {
    d.line(X(0), Y(0), X(1.02), Y(0), p.lineStrong, 1.5); d.line(X(0), Y(0), X(0), Y(1.02), p.lineStrong, 1.5);
    txt(S, 'x', X(1.02), Y(0) + 4 * u, { size: 13, weight: 700, color: p.ink2, align: 'right', base: 'top' });
    txt(S, 'y', X(0) - 6 * u, Y(1.02), { size: 13, weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  LINE_PTS.forEach(([x, y], i) => {
    const a = S.reveal('hook', 0.5 + i * 0.1, 0.4);
    d.withAlpha(a, () => d.circle(X(x), Y(y), 4.2 * u, { fill: tone(S, 'dat').c, stroke: p.stage, lw: 1.5 }));
  });
  const th = tau(S, 'hook'), aL = tr(th, 0.12, 0.3, 'io');
  if (aL > 0) d.line(X(0), Y(0.14), lerp(X(0), X(1), aL), lerp(Y(0.14), Y(0.84), aL), p.ink, 3);
  // fórmula y = w·x + b
  const fy = port ? pr.y + pr.h + 22 * u : pr.y + pr.h + 30 * u;
  const aF = tr(th, 0.3, 0.4);
  if (aF > 0) parts(S, [['y', sg.ink, true], [' = ', p.ink2], ['w', wt.ink, true], ['·x + ', p.ink2], ['b', wt.ink, true]], pr.x + pr.w / 2, fy, { size: 20, a: aF });

  // flecha y Neu
  const aA = tr(th, 0.5, 0.62, 'io');
  const nsc = Math.max(4, Math.round((port ? 5.2 : 6.4) * u));
  const nw = 24 * nsc, nh = 18 * nsc;
  const nx = port ? D.x + D.w / 2 - nw / 2 : D.x + D.w * 0.76 - nw / 2, ny = port ? D.y + D.h * 0.64 : D.y + D.h * 0.30;
  if (aA > 0) {
    if (port) arrow(S, D.x + D.w / 2, fy + 18 * u, D.x + D.w / 2, lerp(fy + 18 * u, ny - 8 * u, aA), p.ink2, 3, 10);
    else arrow(S, pr.x + pr.w + 14 * u, pr.y + pr.h * 0.45, lerp(pr.x + pr.w + 14 * u, nx - 14 * u, aA), pr.y + pr.h * 0.45 + (ny + nh / 2 - (pr.y + pr.h * 0.45)) * aA, p.ink2, 3, 10);
  }
  neu(S, nx, ny, { scale: nsc, mood: th > 0.8 ? 'happy' : 'think', a: tr(th, 0.58, 0.7) });
  d.withAlpha(tr(th, 0.78, 0.9), () => tag(S, S.l('neurona artificial', 'artificial neuron'), nx + nw / 2, ny + nh + 22 * u, { tone: 'sig', size: 14 }));
}

// ── la neurona biológica (esquema) ──────────────────────────────────────
// Coordenadas de diseño 100 × 50. Las dendritas van de la punta al cuerpo (para animar la señal hacia adentro).
const SOMA = { x: 42, y: 25, r: 7 };
const DEND: [number, number][][] = [
  [[4, 6], [11, 10], [19, 12], [27, 16], [35, 22]],
  [[12, 2], [16, 6], [19, 12]],
  [[2, 23], [10, 23], [20, 24], [29, 25], [35, 25]],
  [[6, 32], [14, 28], [20, 24]],
  [[5, 44], [12, 40], [20, 36], [28, 32], [35, 28]],
  [[14, 48], [18, 42], [20, 36]],
];
const AX = { x0: 49, x1: 90, y: 25 };

function along(pts: [number, number][], t: number): [number, number] {
  const L: number[] = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let dd = clamp(t) * tot;
  for (let i = 0; i < L.length; i++) { if (dd <= L[i] || i === L.length - 1) { const k = L[i] ? dd / L[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } dd -= L[i]; }
  return pts[pts.length - 1];
}

/** Dibuja la neurona biológica dentro de r. `a` = opacidad; `labels` = opacidad de los rótulos; `alive` anima los pulsos. */
export function drawBio(S: Frame, r: Rect, o: { a?: number; labels?: number; alive?: boolean; compact?: boolean; sketch?: number } = {}) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), wt = tone(S, 'w');
  const box = fit(r, 2), sc = box.w / 100;
  const X = (v: number) => box.x + v * sc, Y = (v: number) => box.y + v * sc;
  const T = 3.6, c = o.alive === false || S.reduced ? 2.0 : (S.clock % T);
  const fill = clamp((c - 0.5) / 1.0) * (1 - clamp((c - 2.6) / 0.8));
  d.withAlpha(o.a ?? 1, () => {
    // dendritas
    DEND.forEach((pl) => d.polyline(pl.map(([x, y]) => [X(x), Y(y)] as [number, number]), alpha(sg.c, 0.85), Math.max(1.5, 0.45 * sc)));
    // pulsos entrantes
    if (c < 1.6) DEND.forEach((pl, i) => { const q = clamp((c - 0.15 * (i % 3)) / 1.3); if (q > 0 && q < 1) { const [x, y] = along(pl, q); d.circle(X(x), Y(y), Math.max(2.2, 0.5 * sc), { fill: sg.c, stroke: p.stage, lw: 1 }); } });
    // cuerpo
    d.circle(X(SOMA.x), Y(SOMA.y), SOMA.r * sc, { fill: alpha(sg.c, 0.12 + 0.6 * fill), stroke: sg.c, lw: Math.max(2, 0.5 * sc) });
    d.circle(X(SOMA.x), Y(SOMA.y), 2.4 * sc, { stroke: alpha(p.ink, 0.45), lw: 1.2 });
    // axón con vainas de mielina
    d.line(X(AX.x0), Y(AX.y), X(AX.x1), Y(AX.y), wt.c, Math.max(2, 0.5 * sc));
    [58, 69, 80].forEach((cx) => d.rect(X(cx - 4.2), Y(AX.y - 2.4), 8.4 * sc, 4.8 * sc, { fill: alpha(wt.c, 0.2), stroke: wt.c, lw: 1.2, r: 2 * sc }));
    [[96, 19], [97.5, 25], [96, 31]].forEach(([x, y]) => { d.line(X(AX.x1), Y(AX.y), X(x), Y(y), wt.c, Math.max(1.5, 0.4 * sc)); d.circle(X(x), Y(y), 1.5 * sc, { fill: wt.c }); });
    // pulso saliente
    if (c > 1.5 && c < 2.6) { const q = (c - 1.5) / 1.1, x = lerp(AX.x0, AX.x1, q); d.circle(X(x), Y(AX.y), Math.max(3, 0.8 * sc), { fill: wt.c, stroke: p.stage, lw: 1.5 }); }
  });
  const la = o.labels ?? 1;
  if (la > 0) d.withAlpha(la * (o.a ?? 1), () => {
    tag(S, S.l('dendritas', 'dendrites'), X(15), Y(o.compact ? 17.5 : 18), { tone: 'sig' });
    tag(S, S.l('cuerpo', 'cell body'), X(SOMA.x), Y(SOMA.y + SOMA.r + 6.5), { tone: 'sig' });
    tag(S, S.l('axón', 'axon'), X(69), Y(AX.y - 8), { tone: 'w' });
  });
  if (o.sketch && la > 0) d.withAlpha(o.sketch * (o.a ?? 1), () => tag(S, S.l('esquema simplificado', 'simplified sketch'), box.x + box.w / 2, box.y + box.h + 18 * u, { size: 12 }));
  return box;
}

// ── la unidad de McCulloch y Pitts ───────────────────────────────────────
export function drawMP(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), wt = tone(S, 'w');
  const port = S.portrait;
  d.withAlpha(a, () => {
    const cx = r.x + r.w / 2;
    // título: año
    const ty = r.y + (port ? 4 : 0) * u;
    d.text('1943', cx, ty, { size: fs(S, port ? 26 : 30), font: 'pixel', weight: 700, color: p.ink, align: 'center', base: 'top' });
    const inner: Rect = { x: r.x, y: ty + (port ? 36 : 44) * u, w: r.w, h: r.h - (port ? 36 : 44) * u };
    const vals = [1, 0, 1], n = vals.length;
    const nr = Math.min(17 * u, inner.h / 9, inner.w / 12);
    const ux = inner.x + inner.w * 0.5, uy = inner.y + inner.h * 0.5, ur = nr * 1.9;
    const ix = inner.x + inner.w * 0.12, ox = inner.x + inner.w * 0.88;
    const iy = (i: number) => uy + (i - (n - 1) / 2) * Math.min(inner.h * 0.28, nr * 3.2);
    const t = S.reveal('mp', 0.3, 0.8);
    vals.forEach((v, i) => {
      const y = iy(i);
      d.line(ix + nr, y, ux - ur, uy + (i - 1) * ur * 0.35, v ? sg.c : p.line, v ? 2.5 : 1.5, v ? undefined : [4, 4], t);
      d.withAlpha(t, () => {
        d.circle(ix, y, nr, { fill: v ? alpha(sg.c, 0.85) : p.surface, stroke: sg.c, lw: 2 });
        d.text(String(v), ix, y, { size: fs(S, 15), weight: 800, font: 'mono', color: v ? p.stage : sg.ink, align: 'center', base: 'middle' });
      });
    });
    d.withAlpha(S.reveal('mp', 0.9, 0.7), () => {
      d.circle(ux, uy, ur, { fill: alpha(sg.c, 0.2), stroke: sg.c, lw: 2.5 });
      d.text('Σ ≥ 2', ux, uy, { size: fs(S, 17), weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
      d.line(ux + ur, uy, ox - nr, uy, wt.c, 2.5);
      d.circle(ox, uy, nr, { fill: alpha(sg.c, 0.85), stroke: sg.c, lw: 2 });
      d.text('1', ox, uy, { size: fs(S, 15), weight: 800, font: 'mono', color: p.stage, align: 'center', base: 'middle' });
      tag(S, S.l('umbral', 'threshold'), ux, uy - ur - 14 * u, { tone: 'w' });
      tag(S, S.l('señales 0 o 1', 'signals 0 or 1'), ix + nr * 0.6, iy(n - 1) + nr + 18 * u, { align: 'center' });
      tag(S, S.l('sale 1', 'outputs 1'), ox, uy + nr + 16 * u, { tone: 'sig' });
    });
  });
}

/** Composición de «bio» y «mp»: el esquema biológico se desplaza y aparece el modelo matemático. */
export function drawBioMp(S: Frame, D: Rect) {
  const port = S.portrait;
  const full: Rect = { x: D.x + D.w * 0.02, y: D.y + D.h * (port ? 0.18 : 0.12), w: D.w * 0.96, h: D.h * (port ? 0.60 : 0.76) };
  const part: Rect = port ? { x: D.x, y: D.y + D.h * 0.02, w: D.w, h: D.h * 0.42 } : { x: D.x, y: D.y + D.h * 0.10, w: D.w * 0.54, h: D.h * 0.80 };
  const k = S.at('mp', 0, 0.9, 'io');
  const r = lerpRect(full, part, k);
  drawBio(S, r, { a: S.reveal('bio', 0, 0.6), labels: S.reveal('bio', 0.7, 0.6), compact: port, sketch: (1 - k) * S.reveal('bio', 1.2, 0.6) });
  if (k > 0) {
    const r2: Rect = port ? { x: D.x + D.w * 0.04, y: D.y + D.h * 0.47, w: D.w * 0.92, h: D.h * 0.51 } : { x: D.x + D.w * 0.57, y: D.y + D.h * 0.10, w: D.w * 0.41, h: D.h * 0.80 };
    // flecha «se inspira en»
    if (!port) arrow(S, part.x + part.w * 0.97, D.y + D.h * 0.5, r2.x - 4 * S.u, D.y + D.h * 0.5, S.pal.mute, 2, 8, k);
    drawMP(S, r2, k);
  }
}
