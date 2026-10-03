// Dibujo del plano de datos: región de decisión pixelada (plot.heat), frontera y puntos con forma por clase.
import { Plot, alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { R, type Pt } from './mlp';
import { fs } from './shared';

const K = 33;                         // niveles de la paleta de la región
const LUTS = new Map<string, string[]>();

/** Colores de la región: clase 0 (círculo) = tono «dat», clase 1 (cruz) = tono «err». Más seguro → más intenso.
 *  Siempre hay un tinte mínimo: la región es la clase que PREDICE la red, aunque dude. Se memoiza por tema. */
function lut(S: Frame): string[] {
  const key = `${S.pal.dat}|${S.pal.err}|${S.pal.dark ? 'd' : 'l'}`;
  let l = LUTS.get(key);
  if (l) return l;
  l = [];
  for (let i = 0; i < K; i++) { const q = i / (K - 1); l.push(alpha(q < 0.5 ? S.pal.dat : S.pal.err, 0.1 + 0.3 * Math.abs(2 * q - 1))); }
  LUTS.set(key, l);
  return l;
}

/** Plano de datos cuadrado, sin ejes, dominio [-R, R]². */
export function fieldPlot(S: Frame, rect: Rect): Plot {
  return new Plot(S, rect, { xr: [-R, R], yr: [-R, R], pad: { l: 0, r: 0, t: 0, b: 0 } });
}

/** Región de decisión: grid[j*n+i] = probabilidad de la clase 1 (fila 0 = arriba). Cada celda es un «píxel». */
export function drawRegion(S: Frame, plot: Plot, grid: Float32Array, n: number, a = 1) {
  const L = lut(S), [x0, x1] = plot.o.xr, [y0, y1] = plot.o.yr;
  plot.heat((x, y) => {
    const i = clamp(Math.floor(((x - x0) / (x1 - x0)) * n), 0, n - 1), j = clamp(Math.floor(((y1 - y) / (y1 - y0)) * n), 0, n - 1);
    return grid[j * n + i];
  }, (v) => L[Math.round(clamp(v) * (K - 1))], [n, n], a);
}

/** Frontera (p = 0.5) trazada sobre la rejilla con interpolación bilineal. */
export function drawBoundary(S: Frame, plot: Plot, grid: Float32Array, n: number, a = 1) {
  const f = (x: number, y: number) => {
    const gx = clamp(((x + R) / (2 * R)) * n - 0.5, 0, n - 1.001), gy = clamp(((R - y) / (2 * R)) * n - 0.5, 0, n - 1.001);
    const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    const a0 = grid[j * n + i] * (1 - fx) + grid[j * n + i + 1] * fx, a1 = grid[(j + 1) * n + i] * (1 - fx) + grid[(j + 1) * n + i + 1] * fx;
    return a0 * (1 - fy) + a1 * fy;
  };
  S.d.withAlpha(a, () => plot.contours(f, [0.5], 'ink', { res: Math.min(64, n * 2), lw: 2.4 }));
}

/** Puntos de datos: círculo (clase 0) o cruz (clase 1). `frac` = fracción visible (aparición escalonada, orden por hash). */
export function drawPoints(S: Frame, plot: Plot, pts: Pt[], o: { frac?: number; r?: number; a?: number; order?: number[] } = {}) {
  const frac = o.frac ?? 1, ord = o.order;
  if (frac <= 0) return;
  const r = o.r ?? Math.max(3.2, Math.min(5, plot.r.w / 80));
  for (let i = 0; i < pts.length; i++) {
    const rank = ord ? ord[i] : i / pts.length;
    if (rank > frac) continue;
    const q = pts[i];
    plot.datum(q.x, q.y, q.c, { r, a: o.a });
  }
}

/** Orden de aparición pseudoaleatorio pero fijo (rank en 0..1 por punto). */
export function revealOrder(n: number, seed = 5): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  // permutación determinista (Fisher–Yates con un generador congruencial)
  let s = seed * 2654435761 >>> 0;
  for (let i = n - 1; i > 0; i--) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const j = s % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const rank = new Array<number>(n);
  idx.forEach((p, k) => { rank[p] = (k + 1) / n; });
  return rank;
}

/** Leyenda de clases en dos esquinas del plano (donde no hay datos). */
export function drawLegend(S: Frame, plot: Plot, a = 1) {
  const { d, pal: p } = S, u = S.u, r = plot.r, dt = tone(S, 'dat'), er = tone(S, 'err');
  d.withAlpha(a, () => {
    const y = r.y + 15 * u, sz = fs(S, 12);
    const t0 = S.l('círculos', 'circles'), t1 = S.l('cruces', 'crosses');
    const w0 = d.measure(t0, { size: sz, weight: 700 }) + 30 * u, w1 = d.measure(t1, { size: sz, weight: 700 }) + 30 * u;
    d.rect(r.x + 6 * u, y - 11 * u, w0, 22 * u, { fill: p.surface, stroke: dt.c, lw: 1.2, r: 3 });
    d.circle(r.x + 17 * u, y, 4.5 * u, { fill: dt.c, stroke: p.stage, lw: 1.2 });
    d.text(t0, r.x + 27 * u, y, { size: sz, weight: 700, color: dt.ink, base: 'middle' });
    const x1 = r.x + r.w - w1 - 6 * u;
    d.rect(x1, y - 11 * u, w1, 22 * u, { fill: p.surface, stroke: er.c, lw: 1.2, r: 3 });
    d.line(x1 + 12 * u, y - 4.5 * u, x1 + 21 * u, y + 4.5 * u, er.c, 2.4); d.line(x1 + 12 * u, y + 4.5 * u, x1 + 21 * u, y - 4.5 * u, er.c, 2.4);
    d.text(t1, x1 + 27 * u, y, { size: sz, weight: 700, color: er.ink, base: 'middle' });
  });
}

/** Marco del plano. */
export function drawFrame(S: Frame, plot: Plot, a = 1) {
  const r = plot.r;
  S.d.withAlpha(a, () => S.d.rect(r.x, r.y, r.w, r.h, { stroke: S.pal.lineStrong, lw: 1.5 }));
}
