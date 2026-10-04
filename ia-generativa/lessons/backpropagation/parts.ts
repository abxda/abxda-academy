// Piezas de dibujo de la lección «Retropropagación»: la red con sus pesos y culpas, el cuaderno de cuentas
// (líneas de fórmula con números reales), la tabla de culpas, la cadena de factores y los paneles de cierre.
// Todo es PURO: solo lee lo que se le pasa. Los tiempos y los segmentos viven en scene.ts.
import {
  alpha, clamp, drawNet, inset, layoutNet, tone,
  type Frame, type Rect, type Tone,
} from '../../../../../theme/kit';
import { EDGE, X, asNetWeights, wName } from './math';

// ── texto: tamaño efectivo mínimo de 12 px, números con signo «−» y coma decimal en español ──────────
/**
 * Escala del cuaderno (K ≥ 1): en pantallas amplias el texto y las separaciones del cuaderno crecen.
 * scene.ts la fija una vez por fotograma (setK) antes de dibujar el cuaderno y la restablece a 1 para la red;
 * es una función determinista del tamaño del escenario, no estado de la lección.
 */
let K = 1;
export const setK = (k: number) => { K = k; };
export const getK = () => K;
/** Tamaño pedido a d.text() para que el texto efectivo (size × u) nunca baje de ~12 px. */
export const fz = (S: Frame, n = 12.5) => Math.max(n * K, 12.3 / S.u);
/** Número con el formato del curso: punto decimal en español (México) y en inglés, y signo menos «−». (Se evita S.n solo porque aquí el signo «+» y el menos tipográfico importan en las tablas.) */
export const num = (S: Frame, v: number, digits = 3, sign = false) => {
  void S;
  const s = Math.abs(v).toFixed(digits);
  const neg = v < 0 && Number(s) !== 0;
  return (neg ? '−' : sign && Number(s) !== 0 ? '+' : '') + s;
};
/** Entero grande con separador de miles: espacio duro en español (NOM-008-SCFI, como S.n), coma en inglés. */
export const big = (S: Frame, v: number) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, S.lang === 'es' ? '\u00A0' : ',');

export type Role = Tone | 'ink2';
export type Part = [string, Role, boolean?];
const roleInk = (S: Frame, r: Role) => (r === 'ink2' ? S.pal.ink2 : tone(S, r).ink);

/** Una línea de texto mono con tramos de color. Se encoge (hasta el mínimo legible) si no cabe en maxW. */
export function rich(S: Frame, x: number, y: number, parts: Part[], o: { size?: number; a?: number; maxW?: number; align?: 'left' | 'center' | 'right'; font?: 'mono' | 'ui' } = {}) {
  const d = S.d, font = o.font ?? 'mono';
  let size = fz(S, o.size ?? 13);
  const width = (sz: number) => parts.reduce((s, [t, , b]) => s + d.measure(t, { size: sz, weight: b ? 700 : 500, font }), 0);
  let tw = width(size);
  if (o.maxW && tw > o.maxW) { size = Math.max(12.3 / S.u, size * (o.maxW / tw)); tw = width(size); }
  let cx = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
  d.withAlpha(o.a ?? 1, () => {
    for (const [t, r, b] of parts) {
      d.text(t, cx, y, { size, weight: b ? 700 : 500, font, color: roleInk(S, r), base: 'middle' });
      cx += d.measure(t, { size, weight: b ? 700 : 500, font });
    }
  });
  return tw;
}

/** Panel del cuaderno: fondo y filete. Devuelve el interior. */
export function panel(S: Frame, r: Rect, a = 1): Rect {
  const u = S.u;
  S.d.withAlpha(a, () => S.d.rect(r.x, r.y, r.w, r.h, { fill: S.pal.surface, stroke: S.pal.line, lw: 1.5, r: 4 }));
  return inset(r, 10 * u, 12 * u, 8 * u, 12 * u);
}
/** Título del cuaderno; devuelve la y de su filete. */
export function title(S: Frame, r: Rect, text: string, t: Tone, a = 1, sub?: string) {
  const d = S.d, size = fz(S, 12.5), h = Math.max(20 * S.u, 12.3 * 1.6) * K;
  d.withAlpha(a, () => {
    d.text(text, r.x, r.y + h * 0.42, { size, weight: 800, color: tone(S, t).ink, base: 'middle' });
    if (sub) d.text(sub, r.x + r.w, r.y + h * 0.42, { size, weight: 600, font: 'mono', color: S.pal.mute, base: 'middle', align: 'right' });
    d.line(r.x, r.y + h, r.x + r.w, r.y + h, S.pal.line, 1);
  });
  return r.y + h;
}
/** Altura de una línea de cuaderno. */
export const LH = (S: Frame) => Math.max(19 * S.u, 12.3 * 1.55) * K;

// ── la red ──────────────────────────────────────────────────────────────────────────────────
export interface NetLay { rect: Rect; R: number; nodeR: number }
export function netLayout(S: Frame, r: Rect): NetLay {
  const u = S.u;
  const rect = inset(r, 28 * u, 34 * u, 28 * u, 30 * u);
  const R = clamp(Math.min(rect.h * 0.2, rect.w * 0.085 * Math.max(1, u)), 17, 40);
  return { rect, R, nodeR: R / u };
}
export const LAYERS = [2, 2, 1];

/** Posición (t a lo largo de la arista) de la etiqueta de cada peso: se reparten para no chocar. */
const CHIP_T = [0.5, 0.34, 0.34, 0.5, 0.5, 0.5];
export interface Chip { cx: number; cy: number; w: number; h: number }
export function chipRects(S: Frame, lay: NetLay, w: number[]): Chip[] {
  const g = layoutNet(S, lay.rect, LAYERS, lay.nodeR);
  return EDGE.map(([l, i, j], k) => {
    const A = g.nodes[l][i], B = g.nodes[l + 1][j], t = CHIP_T[k];
    const txt = num(S, w[k], 2);
    return { cx: A.x + (B.x - A.x) * t, cy: A.y + (B.y - A.y) * t, w: S.d.measure(txt, { size: fz(S, 12.5), weight: 700, font: 'mono' }) + 8 * S.u, h: 17 * S.u + 2 };
  });
}

export interface NetView {
  w: number[];
  /** visibilidad de los números dentro de los nodos de cada capa (0..1) */
  inA: number; hidA: number; outA: number;
  a1: number; a2: number; y: number;
  signal: number; blame: number;
  highlight: string[];
  /** brote de la culpa sobre cada arista (0..1) y culpa de cada peso */
  ovl: number[]; g: number[];
  /** signos «?» sobre las etiquetas (0..1) */
  qA: number;
  /** etiquetas de los pesos: visibilidad, peso activo, peso resaltado, con asa de arrastre */
  chipA: number; active: number; hot: number; grab: boolean;
  names: number; targetA: number;
  /** pulsos de culpa propios: capa y progreso */
  pulse?: { layer: 0 | 1; f: number };
  hint?: string;
  /** en el hook: una red grande desvaída en su lugar */
}

export function drawNetView(S: Frame, lay: NetLay, v: NetView) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), err = tone(S, 'err'), sg = tone(S, 'sig'), dt = tone(S, 'dat');
  // la red del kit: aristas, nodos, pulsos de señal y anillos de culpa
  const acts = [[v.inA * 0.55, v.inA * 0.3], [v.hidA * v.a1 * 0.55, v.hidA * v.a2 * 0.55], [v.outA * v.y * 0.55]];
  const g = drawNet(S, lay.rect, {
    layers: LAYERS, weights: asNetWeights(v.w), acts, nodeR: lay.nodeR,
    signal: v.signal, blame: v.blame, highlight: v.highlight, edges: 1,
  });
  const R = g.r;
  // números dentro de los nodos
  const nodeText = (px: number, py: number, s: string, a: number) => d.withAlpha(a, () => d.text(s, px, py + 0.5, { size: fz(S, 12.5), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.surface, haloW: 3.5 }));
  g.nodes[0].forEach((n, i) => nodeText(n.x, n.y, num(S, X[i], 1), v.inA));
  g.nodes[1].forEach((n, i) => nodeText(n.x, n.y, num(S, i === 0 ? v.a1 : v.a2, 3), v.hidA));
  nodeText(g.nodes[2][0].x, g.nodes[2][0].y, num(S, v.y, 3), v.outA);
  // nombres de los nodos
  d.withAlpha(v.names, () => {
    const sz = fz(S, 12.5);
    g.nodes[0].forEach((n, i) => d.text('x' + '₁₂'[i], n.x - R - 7 * u, n.y, { size: sz, weight: 700, font: 'mono', color: sg.ink, align: 'right', base: 'middle' }));
    g.nodes[1].forEach((n, i) => d.text('h' + '₁₂'[i], n.x, i === 0 ? n.y - R - 11 * u : n.y + R + 11 * u, { size: sz, weight: 700, font: 'mono', color: p.mute, align: 'center', base: 'middle' }));
    const o = g.nodes[2][0];
    d.text('ŷ', o.x + R + 7 * u, o.y, { size: sz, weight: 700, font: 'mono', color: sg.ink, align: 'left', base: 'middle' });
  });
  d.withAlpha(v.targetA, () => {
    const o = g.nodes[2][0];
    d.text(S.l('objetivo t = 1', 'target t = 1'), o.x + R + 14 * u, o.y + R + 15 * u, { size: fz(S, 12.5), weight: 700, font: 'mono', color: dt.ink, align: 'right', base: 'middle' });
  });
  // pulsos de culpa propios
  if (v.pulse && v.pulse.f > 0 && v.pulse.f < 1) {
    const l = v.pulse.layer, f = v.pulse.f;
    for (let i = 0; i < LAYERS[l]; i++) for (let j = 0; j < LAYERS[l + 1]; j++) {
      const A = g.nodes[l][i], B = g.nodes[l + 1][j];
      d.circle(B.x + (A.x - B.x) * f, B.y + (A.y - B.y) * f, 3.8 * u, { fill: err.c, stroke: p.stage, lw: 1.2 });
    }
  }
  // carril de la culpa: junto a cada arista, grosor ∝ |culpa|, crece desde el destino hacia el origen
  EDGE.forEach(([l, i, j], k) => {
    const grow = v.ovl[k];
    if (grow <= 0.001) return;
    const A = g.nodes[l][i], B = g.nodes[l + 1][j];
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const off = 6 * u, nx = -uy * off, ny = ux * off;
    const sx = B.x - ux * R + nx, sy = B.y - uy * R + ny, ex = A.x + ux * R + nx, ey = A.y + uy * R + ny;
    const lw = 1.2 + 6 * Math.min(1, Math.abs(v.g[k]) / 0.1);
    d.line(sx, sy, sx + (ex - sx) * grow, sy + (ey - sy) * grow, err.c, lw, undefined, 0.9);
  });
  // etiquetas de los pesos
  const chips = chipRects(S, lay, v.w);
  d.withAlpha(v.chipA, () => chips.forEach((c, k) => {
    const sel = v.active === k, hot = v.hot === k;
    d.rect(c.cx - c.w / 2, c.cy - c.h / 2, c.w, c.h, { fill: sel || hot ? wt.soft : p.surface, stroke: hot || (sel && v.grab) ? p.ink : wt.c, lw: sel || hot ? 2.4 : 1.4, r: 3 });
    d.text(num(S, v.w[k], 2), c.cx, c.cy + 0.5, { size: fz(S, 12.5), weight: 700, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
    if (v.grab) d.line(c.cx - c.w / 2 + 3, c.cy + c.h / 2 + 3.5, c.cx + c.w / 2 - 3, c.cy + c.h / 2 + 3.5, wt.c, 2);
  }));
  // «?» de lo que aún no se sabe
  chips.forEach((c, k) => {
    const a = v.qA * (1 - v.ovl[k]);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      const bx = c.cx + c.w / 2 + 9 * u, by = c.cy;
      d.circle(bx, by, 7.5 * u, { fill: err.soft, stroke: err.c, lw: 1.4 });
      d.text('?', bx, by + 0.5, { size: fz(S, 12.5), weight: 800, color: err.ink, align: 'center', base: 'middle' });
    });
  });
  if (v.hint) d.text(v.hint, lay.rect.x + lay.rect.w / 2, lay.rect.y + lay.rect.h + 20 * u, { size: fz(S, 12.5), weight: 700, color: p.ink2, align: 'center', base: 'middle' });
  return { g, chips };
}

// ── tabla de culpas ────────────────────────────────────────────────────────────────────────
export interface TableOpts {
  w: number[]; g: number[];
  rowA: number[];
  /** qué muestra la columna de culpa: «?», valores de tanteo o de retropropagación */
  kind: 'q' | 'probe' | 'bp';
  gA: number[];
  probe?: number[];
  active?: number;
  arrows?: number;
  nw?: number[]; nwA?: number[];
  scale?: number;
  a?: number;
}
/** Dibuja la tabla; devuelve su altura. */
export function drawTable(S: Frame, r: Rect, o: TableOpts) {
  const { d, pal: p } = S, u = S.u, err = tone(S, 'err'), wt = tone(S, 'w');
  const sz = fz(S, 12.5), headH = Math.max(18 * u, 12.3 * 1.5) * K;
  const rowH = Math.min(27 * u * K, Math.max(Math.max(20 * u, 12.3 * 1.55), (r.h - headH) / 6));
  const nameW = 28 * u * K, valW = 50 * u * K, numW = 54 * u * K, newW = o.nw ? 70 * u * K : 0, arrW = o.arrows !== undefined ? 15 * u * K : 0;
  const xv = r.x + nameW + valW, xb0 = xv + 8 * u, xnum = r.x + r.w - newW - arrW, xb1 = xnum - numW - 6 * u;
  const mid = (xb0 + xb1) / 2, half = Math.max(8, (xb1 - xb0) / 2), sc = o.scale ?? 0.12;
  d.withAlpha(o.a ?? 1, () => {
    const hy = r.y + headH / 2;
    d.text(S.l('peso', 'weight'), r.x, hy, { size: sz, weight: 700, color: p.mute, base: 'middle' });
    const head = o.kind === 'probe' ? S.l('tanteo ΔL/Δw', 'probe ΔL/Δw') : S.l('culpa ∂L/∂w', 'blame ∂L/∂w');
    d.text(head, xnum, hy, { size: sz, weight: 700, color: err.ink, align: 'right', base: 'middle' });
    if (o.nw) d.text(S.l('nuevo', 'new'), r.x + r.w, hy, { size: sz, weight: 700, color: wt.ink, align: 'right', base: 'middle' });
    for (let k = 0; k < 6; k++) {
      const a = o.rowA[k]; if (a <= 0.01) continue;
      const y = r.y + headH + k * rowH + rowH / 2;
      d.withAlpha(a, () => {
        if (o.active === k) d.rect(r.x - 4 * u, y - rowH / 2 + 1, r.w + 8 * u, rowH - 2, { fill: wt.soft, stroke: wt.c, lw: 1.2, r: 3 });
        d.text(wName(k), r.x, y, { size: sz, weight: 700, font: 'mono', color: wt.ink, base: 'middle' });
        d.text(num(S, o.w[k], 3), xv, y, { size: sz, weight: 600, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
        d.line(mid, y - rowH * 0.32, mid, y + rowH * 0.32, p.lineStrong, 1);
        const ga = o.gA[k];
        if (o.kind === 'q' || ga < 0.99) {
          const qa = o.kind === 'q' ? 1 : 1 - ga;
          d.withAlpha(qa, () => d.text('?', xnum, y, { size: sz, weight: 800, font: 'mono', color: err.ink, align: 'right', base: 'middle' }));
        }
        if (ga > 0.01 && o.kind !== 'q') {
          const val = o.kind === 'probe' ? (o.probe?.[k] ?? 0) : o.g[k];
          d.withAlpha(ga, () => {
            const bw = half * clamp(Math.abs(val) / sc) * ga, dash = o.kind === 'probe';
            if (bw > 0.5) {
              const bx = val >= 0 ? mid : mid - bw;
              if (dash) d.rect(bx, y - rowH * 0.22, bw, rowH * 0.44, { stroke: err.c, lw: 1.4, dash: [3, 2] });
              else d.rect(bx, y - rowH * 0.22, bw, rowH * 0.44, { fill: alpha(err.c, 0.75) });
            }
            d.text(num(S, val, 3, true), xnum, y, { size: sz, weight: 700, font: 'mono', color: dash ? p.ink2 : err.ink, align: 'right', base: 'middle' });
            if (o.arrows !== undefined && o.arrows > 0.01) d.withAlpha(o.arrows, () => d.text(val > 0 ? '↓' : '↑', r.x + r.w - newW, y, { size: sz + 1, weight: 800, font: 'mono', color: wt.ink, align: 'right', base: 'middle' }));
          });
        }
        if (o.nw) d.withAlpha(o.nwA?.[k] ?? 1, () => d.text(num(S, o.nw![k], 3), r.x + r.w, y, { size: sz, weight: 700, font: 'mono', color: wt.ink, align: 'right', base: 'middle' }));
      });
    }
  });
  return headH + rowH * 6;
}

// ── cadena de factores ─────────────────────────────────────────────────────────────────────
export interface Factor { sym: string; val: number | null; cap: string; tone: Tone; digits?: number }
export interface StripOpts {
  factors: Factor[]; fill: number[];
  res: { sym: string; val: number; cap: string }; resA: number; a?: number;
  bracket?: { from: number; to: number; text: string; a: number };
}
/**
 * Fila «factor × factor × … = culpa». Devuelve la altura que ocupa.
 * Si las casillas quedarían más angostas que un número («−0.134») —teléfono en horizontal—, se omite la casilla del
 * resultado: la línea de cuenta que va debajo lo muestra.
 */
export function drawStrip(S: Frame, r: Rect, o: StripOpts) {
  const { d, pal: p } = S, u = S.u, n = o.factors.length, opW = 15 * u;
  const sz = fz(S, 12.5);
  const minBox = d.measure('−0.000', { size: sz, weight: 700, font: 'mono' }) + 4 * u;
  const narrow = (r.w - n * opW) / (n + 1) < minBox;
  const cnt = narrow ? n : n + 1;
  const bw = (r.w - (cnt - 1) * opW) / cnt, bh = 30 * u * K;
  const y0 = r.y + 26 * u * K;
  const bx = (i: number) => r.x + i * (bw + opW);
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < cnt; i++) {
      const isRes = i === n, f = isRes ? null : o.factors[i];
      const t = isRes ? tone(S, 'err') : tone(S, f!.tone);
      const fa = isRes ? o.resA : o.fill[i];
      const x = bx(i);
      d.rect(x, y0, bw, bh, { fill: alpha(t.c, 0.08 + 0.2 * fa), stroke: t.c, lw: 1.5, r: 3, dash: fa < 0.5 ? [4, 3] : undefined });
      const known = isRes ? true : f!.val !== null;
      const txt = fa > 0.5 && known ? num(S, isRes ? o.res.val : f!.val!, f?.digits ?? 3, isRes) : '?';
      d.text(txt, x + bw / 2, y0 + bh / 2 + 0.5, { size: sz, weight: 700, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
      const sym = isRes ? o.res.sym : f!.sym, cap = isRes ? o.res.cap : f!.cap;
      d.text(sym, x + bw / 2, y0 + bh + 12 * u * K, { size: sz, weight: 700, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
      d.text(cap, x + bw / 2, y0 + bh + 22 * u * K, { size: fz(S, 12), weight: 500, color: p.mute, align: 'center', base: 'top', w: bw + opW - 2, lh: 1.15 });
      if (i < cnt - 1) d.text(i === n - 1 ? '=' : '×', x + bw + opW / 2, y0 + bh / 2, { size: fz(S, 14), weight: 800, font: 'mono', color: p.ink2, align: 'center', base: 'middle' });
    }
    if (o.bracket && o.bracket.a > 0.01) {
      const b = o.bracket, x1 = bx(b.from), x2 = bx(b.to) + bw, by = y0 - 4 * u;
      d.withAlpha(b.a, () => {
        d.polyline([[x1, by + 5 * u], [x1, by], [x2, by], [x2, by + 5 * u]], tone(S, 'err').c, 1.6);
        // si el rótulo es más ancho que el tramo (p. ej. sobre una sola casilla), se alinea a la izquierda para no salirse del panel
        const tw = d.measure(b.text, { size: sz, weight: 700, font: 'mono' });
        if (tw > x2 - x1) d.text(b.text, x1, by - 9 * u, { size: sz, weight: 700, font: 'mono', color: tone(S, 'err').ink, align: 'left', base: 'middle' });
        else d.text(b.text, (x1 + x2) / 2, by - 9 * u, { size: sz, weight: 700, font: 'mono', color: tone(S, 'err').ink, align: 'center', base: 'middle' });
      });
    }
  });
  return 26 * u * K + bh + 22 * u * K + 2 * 12.3 * 1.15 * K + 6 * u;
}
