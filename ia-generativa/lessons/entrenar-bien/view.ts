// Vista del paisaje de dos pesos: curvas de nivel, nube de ejemplos, trayectorias y flechas. Todo se dibuja en coordenadas de
// los pesos (x = w₁, y = w₂) con la misma escala en ambos ejes, de modo que las perpendiculares se vean perpendiculares.
import { Plot, alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { EX, N, exPos, grad, loss, perm, type Land, type Opt, type Run, type V2 } from './sim';

/** Tamaño de letra que respeta ≥ 12 px efectivos (la escala S.u ya multiplica `size`). */
export const FS = (S: Frame, n: number) => Math.max(n, 12.4 / S.u);

export interface LView { S: Frame; plot: Plot; land: Land; r: Rect; hw: number; hh: number; pt(p: V2): [number, number]; inside(px: number, py: number): boolean; perUnit: number }

export function landView(S: Frame, rect: Rect, land: Land, halfW = 2.95): LView {
  const u = S.u, pad = 5, w = Math.max(40, rect.w - 2 * pad * u), h = Math.max(40, rect.h - 2 * pad * u);
  const hh = (halfW * h) / w;
  const plot = new Plot(S, rect, { xr: [-halfW, halfW], yr: [-hh, hh], pad: { l: pad, r: pad, t: pad, b: pad } });
  return { S, plot, land, r: plot.r, hw: halfW, hh, perUnit: plot.r.w / (2 * halfW), pt: (p) => [plot.X(p[0]), plot.Y(p[1])], inside: (x, y) => plot.inside(x, y) };
}

const BOWL_LEVELS = [0.1, 0.4, 1, 2, 4, 7];
const CANYON_LEVELS = [0.05, 0.2, 0.6, 1.5, 3.5, 8, 16];

/** Fondo del paisaje: sombreado suave de error y curvas de nivel. */
export function drawLand(S: Frame, v: LView, a = 1) {
  const { d, pal: p } = S, err = tone(S, 'err'), land = v.land, hm = land.c > 0 ? 14 : 12, r = v.r;
  const lv = land.c > 0 ? CANYON_LEVELS : BOWL_LEVELS;
  const ramp = Array.from({ length: 24 }, (_, i) => alpha(err.c, 0.01 + 0.085 * (i / 23)));
  d.withAlpha(a, () => {
    v.plot.heat((x, y) => loss(land, x, y), (val) => ramp[Math.round(23 * Math.sqrt(clamp(val / hm)))], [44, 30]);
    v.plot.contours((x, y) => loss(land, x, y), lv, 'mute', { lw: 1.2, res: 56 });
    d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1 });
  });
}

/** Rótulos de ejes dentro del marco. */
export function drawAxisNames(S: Frame, v: LView, a = 1) {
  const { d, pal: p } = S, r = v.r, sz = FS(S, 12);
  d.withAlpha(a, () => {
    d.text(S.l('peso w₁ →', 'weight w₁ →'), r.x + r.w - 6, r.y + r.h - 5, { size: sz, weight: 700, color: p.mute, align: 'right', base: 'bottom', halo: p.stage });
    d.text(S.l('peso w₂ ↑', 'weight w₂ ↑'), r.x + 6, r.y + 5, { size: sz, weight: 700, color: p.mute, base: 'top', halo: p.stage });
  });
}

/** La nube de ejemplos: cada punto son los pesos que «prefiere» un ejemplo. `show` = cuántos (0..N) o una función de aparición. */
export function drawCloud(S: Frame, v: LView, o: { a?: number; appear?: number; batch?: { idx: ArrayLike<number>; lo: number; hi: number } | null; dim?: number } = {}) {
  const { d, pal: p } = S, dat = tone(S, 'dat'), sig = tone(S, 'sig'), s = Math.max(3, Math.round(3.4 * S.u));
  const inBatch = new Set<number>(); if (o.batch) for (let k = o.batch.lo; k < o.batch.hi; k++) inBatch.add(o.batch.idx[k]);
  const ap = o.appear ?? 1;
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < N; i++) {
      const delay = (i * 0.618) % 1 * 0.6, t = clamp((ap - delay) / 0.4); if (t <= 0) continue;
      const [x, y] = v.pt(exPos(i)), hot = inBatch.has(i);
      if (hot) continue;
      d.rect(x - s / 2, y - s / 2, s, s, { fill: alpha(dat.c, (o.dim ?? 0.62) * t) });
    }
    inBatch.forEach((i) => { const [x, y] = v.pt(exPos(i)); d.rect(x - s, y - s, s * 2, s * 2, { fill: sig.c, stroke: p.stage, lw: 1.5 }); });
  });
}

/** Marca del mínimo (el centro de la nube). */
export function drawMin(S: Frame, v: LView, a = 1, label = true) {
  const { d, pal: p } = S, [x, y] = v.pt([0, 0]), dat = tone(S, 'dat');
  d.withAlpha(a, () => {
    d.circle(x, y, 7 * S.u, { stroke: dat.ink, lw: 2.5, fill: p.stage });
    d.circle(x, y, 2.6 * S.u, { fill: dat.ink });
    if (label) d.text(S.l('mínimo', 'minimum'), x, y + 12 * S.u, { size: FS(S, 12), weight: 800, color: dat.ink, align: 'center', base: 'top', halo: p.stage });
  });
}

export type Shape = 'circle' | 'square' | 'diamond';
export interface PathStyle { tone: Tone; shape?: Shape; lw?: number; a?: number; dots?: boolean; dash?: number[]; marker?: boolean }

/** Marcador de la posición actual (la forma acompaña al color). */
export function marker(S: Frame, x: number, y: number, shape: Shape, t: Tone, size = 7) {
  const { d, pal: p } = S, c = tone(S, t).c, r = size * S.u;
  if (shape === 'circle') d.circle(x, y, r, { fill: c, stroke: p.stage, lw: 2 });
  else if (shape === 'square') d.rect(x - r, y - r, r * 2, r * 2, { fill: c, stroke: p.stage, lw: 2 });
  else d.polygon([[x, y - r * 1.3], [x + r * 1.3, y], [x, y + r * 1.3], [x - r * 1.3, y]], { fill: c, stroke: p.stage, lw: 2 });
}

/** Dibuja la trayectoria de una corrida hasta el paso k (puede ser fraccionario). Devuelve la posición actual en pantalla. */
export function drawRun(S: Frame, v: LView, run: Run, k: number, st: PathStyle): [number, number] {
  const { d } = S, c = tone(S, st.tone).c, n = clamp(Math.floor(k), 0, run.pts.length - 1), f = k - Math.floor(k);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push(v.pt(run.pts[i]));
  let cur = pts[pts.length - 1];
  if (n < run.pts.length - 1 && f > 0) { const q = v.pt(run.pts[n + 1]); cur = [cur[0] + (q[0] - cur[0]) * f, cur[1] + (q[1] - cur[1]) * f]; pts.push(cur); }
  d.withAlpha(st.a ?? 1, () => {
    d.clip(v.r.x, v.r.y, v.r.w, v.r.h, () => {
      d.polyline(pts, c, st.lw ?? 2.2, { dash: st.dash });
      if (st.dots !== false && run.steps <= 140) pts.slice(0, -1).forEach(([x, y], i) => { if (i % (run.steps > 70 ? 2 : 1) === 0) d.circle(x, y, 2.2 * S.u, { fill: c, a: 0.75 }); });
    });
    if (st.marker !== false && v.inside(cur[0], cur[1])) marker(S, cur[0], cur[1], st.shape ?? 'circle', st.tone);
  });
  return cur;
}

/** Punto de partida. */
export function drawStart(S: Frame, v: LView, p0: V2, a = 1, label?: string) {
  const { d, pal: p } = S, [x, y] = v.pt(p0), c = tone(S, 'ink');
  d.withAlpha(a, () => {
    d.circle(x, y, 6 * S.u, { stroke: c.c, lw: 2.2, fill: p.stage });
    d.line(x - 3.2 * S.u, y, x + 3.2 * S.u, y, c.c, 1.6); d.line(x, y - 3.2 * S.u, x, y + 3.2 * S.u, c.c, 1.6);
    if (label) d.text(label, x + 10 * S.u, y - 8 * S.u, { size: FS(S, 12), weight: 800, color: p.ink, base: 'bottom', halo: p.stage });
  });
}

/** Flecha «hacia dónde bajar» (−gradiente) de un conjunto de ejemplos en el punto p0. Longitud en px proporcional al gradiente, con tope. */
export function descentArrow(S: Frame, v: LView, p0: V2, g: V2, st: { tone?: Tone; color?: string; lw?: number; a?: number; scale?: number; max?: number }) {
  const { d } = S, [x0, y0] = v.pt(p0), c = st.color ?? tone(S, st.tone ?? 'err').c;
  const m = Math.hypot(g[0], g[1]) || 1, len = Math.min((st.max ?? 80) * S.u, m * (st.scale ?? 6) * S.u);
  const dx = -g[0] / m, dy = g[1] / m;                     // pantalla: y hacia abajo; el gradiente está en coordenadas de peso
  d.withAlpha(st.a ?? 1, () => d.arrow(x0, y0, x0 + dx * len, y0 + dy * len, c, st.lw ?? 2.4, 8 * Math.min(1.3, S.u + 0.2)));
  return [x0 + dx * len, y0 + dy * len] as [number, number];
}

/** Gradiente de un lote del tamaño B, tomado al azar (semilla k) en el punto p0. */
export function batchGrad(land: Land, p0: V2, B: number, k: number): V2 {
  const idx = perm(5000 + k * 31 + B);
  return grad(land, p0[0], p0[1], idx, 0, B);
}

export { EX };
export type { Opt };
