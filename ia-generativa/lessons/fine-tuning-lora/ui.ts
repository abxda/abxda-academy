// Piezas visuales de la lección (locales: no existían en el kit): marcas de clase, mapa de decisión por celdas, matrices con signo,
// medidores de habilidad, curva de pérdida, y utilidades de maquetación. Todo con tone()/S.pal: sirve en claro y oscuro.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { G } from './task';
import type { Pt } from './tinynet';

// ── color con caché (alpha() analiza la cadena cada vez) ─────────────────────
const CACHE = new Map<string, string>();
export function alp(c: string, a: number): string {
  const q = Math.round(clamp(a) * 40) / 40, k = c + '|' + q;
  let v = CACHE.get(k);
  if (!v) { v = alpha(c, q); CACHE.set(k, v); }
  return v;
}

/** Tono de cada clase (la forma acompaña al color: círculo, cruz, rombo). */
export const CLS_TONE: Tone[] = ['dat', 'err', 'sig'];

export function classMark(S: Frame, cls: number, x: number, y: number, r: number, a = 1) {
  const { d, pal: p } = S, t = tone(S, CLS_TONE[cls]);
  d.withAlpha(a, () => {
    if (cls === 0) d.circle(x, y, r, { fill: t.c, stroke: p.stage, lw: 1.2 });
    else if (cls === 1) { d.line(x - r, y - r, x + r, y + r, t.c, 2.4); d.line(x - r, y + r, x + r, y - r, t.c, 2.4); }
    else d.polygon([[x, y - r * 1.25], [x + r * 1.25, y], [x, y + r * 1.25], [x - r * 1.25, y]], { fill: t.c, stroke: p.stage, lw: 1.2 });
  });
}

/** Cuadrado más grande que cabe en `r`, dejando margen arriba y abajo. */
export function squareIn(r: Rect, top = 0, bottom = 0, align: 'c' | 'l' | 'r' = 'c'): Rect {
  const h = r.h - top - bottom, s = Math.max(10, Math.min(r.w, h));
  const x = align === 'l' ? r.x : align === 'r' ? r.x + r.w - s : r.x + (r.w - s) / 2;
  return { x, y: r.y + top + (h - s) / 2, w: s, h: s };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── el mapa de decisión (rejilla G×G) ────────────────────────────────────────
export interface MapOpts {
  a?: number;
  /** celdas donde la regla cambió (se rayan) */
  hatch?: Uint8Array | null;
  /** celdas incorrectas (se marcan con un punto oscuro) */
  wrong?: Uint8Array | null;
  /** ejemplos de ajuste (marcas de clase sobre el mapa) */
  data?: Pt[];
  dataA?: number;
  /** repaso: ejemplos originales (marcas huecas) */
  extra?: Pt[];
  frame?: boolean;
  /** 0..1: cuántas filas se muestran (aparición progresiva de arriba abajo) */
  reveal?: number;
}

export function drawMap(S: Frame, r: Rect, pred: Uint8Array, o: MapOpts = {}) {
  const { d, ctx, pal: p } = S, u = S.u, cs = r.w / G;
  const ex = (i: number) => Math.round(r.x + i * cs), ey = (j: number) => Math.round(r.y + j * cs);
  const rows = Math.ceil(G * clamp(o.reveal ?? 1));
  const fa = p.dark ? 0.34 : 0.24;
  d.withAlpha(o.a ?? 1, () => {
    for (let j = 0; j < rows; j++) {
      let i0 = 0;
      for (let i = 1; i <= G; i++) {
        if (i === G || pred[j * G + i] !== pred[j * G + i0]) {
          ctx.fillStyle = alp(tone(S, CLS_TONE[pred[j * G + i0]]).c, fa);
          ctx.fillRect(ex(i0), ey(j), ex(i) - ex(i0), ey(j + 1) - ey(j));
          i0 = i;
        }
      }
    }
    if (o.hatch) {
      ctx.save(); ctx.beginPath();
      for (let j = 0; j < rows; j++) {
        let i0 = -1;
        for (let i = 0; i <= G; i++) {
          const on = i < G && o.hatch[j * G + i] === 1;
          if (on && i0 < 0) i0 = i;
          if (!on && i0 >= 0) { ctx.rect(ex(i0), ey(j), ex(i) - ex(i0), ey(j + 1) - ey(j)); i0 = -1; }
        }
      }
      ctx.clip();
      ctx.strokeStyle = alp(p.ink, p.dark ? 0.4 : 0.34); ctx.lineWidth = 1;
      const step = 7 * u;
      ctx.beginPath();
      for (let t = -r.h; t < r.w; t += step) { ctx.moveTo(r.x + t, r.y + r.h); ctx.lineTo(r.x + t + r.h, r.y); }
      ctx.stroke();
      ctx.restore();
    }
    if (o.wrong) {
      ctx.fillStyle = alp(p.ink, 0.88);
      const s = Math.max(2.5, cs * 0.46);
      for (let j = 0; j < rows; j++) for (let i = 0; i < G; i++) if (o.wrong[j * G + i]) ctx.fillRect(r.x + (i + 0.5) * cs - s / 2, r.y + (j + 0.5) * cs - s / 2, s, s);
    }
    if (o.data) {
      d.withAlpha(o.dataA ?? 1, () => {
        for (const q of o.data!) classMark(S, q.c, r.x + ((q.x + 1) / 2) * r.w, r.y + ((1 - q.y) / 2) * r.h, 3.4 * u);
      });
    }
    if (o.extra) {
      d.withAlpha(o.dataA ?? 1, () => {
        for (const q of o.extra!) {
          const x = r.x + ((q.x + 1) / 2) * r.w, y = r.y + ((1 - q.y) / 2) * r.h, t = tone(S, CLS_TONE[q.c]);
          d.rect(x - 3 * u, y - 3 * u, 6 * u, 6 * u, { fill: p.stage, stroke: t.c, lw: 1.5 });
        }
      });
    }
    if (o.frame !== false) d.rect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1, { stroke: p.lineStrong, lw: 1.5 });
  });
}

/** Celdas incorrectas de una predicción: según la regla nueva en las celdas que cambiaron, según la original en las demás. */
export function wrongCells(pred: Uint8Array, target: Uint8Array, base: Uint8Array, changed: Uint8Array, which: 'both' | 'old' | 'new' = 'both'): Uint8Array {
  const w = new Uint8Array(G * G);
  for (let k = 0; k < G * G; k++) {
    if (changed[k]) { if (which !== 'old' && pred[k] !== target[k]) w[k] = 1; }
    else if (which !== 'new' && pred[k] !== base[k]) w[k] = 1;
  }
  return w;
}

// ── matrices con signo ───────────────────────────────────────────────────────
/** n filas × m columnas. Positivo = ámbar, negativo = cian (con la leyenda aparte); `neutral`: tinta, sin signo (la matriz congelada). */
export function drawSigned(S: Frame, x: number, y: number, M: ArrayLike<number>, n: number, m: number, cell: number, o: { range?: number; a?: number; frame?: boolean; neutral?: boolean; stroke?: string } = {}) {
  const { d, ctx, pal: p } = S;
  const rng = o.range ?? 1, pos = tone(S, 'w').c, neg = tone(S, 'sig').c;
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const v = M[i * m + j], k = Math.min(1, Math.abs(v) / rng);
      if (k < 0.03) continue;
      ctx.fillStyle = alp(o.neutral ? p.ink : v >= 0 ? pos : neg, 0.1 + 0.85 * k);
      ctx.fillRect(Math.round(x + j * cell), Math.round(y + i * cell), Math.ceil(cell), Math.ceil(cell));
    }
    if (o.frame !== false) d.rect(x - 0.5, y - 0.5, m * cell + 1, n * cell + 1, { stroke: o.stroke ?? p.lineStrong, lw: 1.5 });
  });
}

export function maxAbs(M: ArrayLike<number>): number { let m = 1e-9; for (let i = 0; i < M.length; i++) m = Math.max(m, Math.abs(M[i])); return m; }

// ── medidores y curvas ───────────────────────────────────────────────────────
/** Barra horizontal 0..1 con rótulo y valor. `hatch` la raya como las zonas que cambian; `mark` es una marca de umbral. */
export function meter(S: Frame, r: Rect, label: string, v: number, o: { tone?: Tone; hatch?: boolean; mark?: number; a?: number; ghost?: number } = {}) {
  const { d, ctx, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'dat');
  d.withAlpha(o.a ?? 1, () => {
    d.text(label, r.x, r.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
    d.text(S.n(v * 100, 0) + ' %', r.x + r.w, r.y - 1, { size: 15, weight: 700, font: 'mono', color: t.ink, align: 'right', base: 'top' });
    const by = r.y + 18 * u, bh = Math.max(8, 11 * u);
    d.rect(r.x, by, r.w, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
    const w = r.w * clamp(v);
    d.rect(r.x, by, w, bh, { fill: alp(t.c, 0.7) });
    if (o.hatch && w > 3) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, by, w, bh); ctx.clip();
      ctx.strokeStyle = alp(p.stage, 0.85); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let q = -bh; q < w; q += 5 * u) { ctx.moveTo(r.x + q, by + bh); ctx.lineTo(r.x + q + bh, by); }
      ctx.stroke(); ctx.restore();
    }
    if (o.ghost !== undefined) d.line(r.x + r.w * clamp(o.ghost), by - 3, r.x + r.w * clamp(o.ghost), by + bh + 3, p.mute, 1.5, [3, 2]);
    if (o.mark !== undefined) { const mx = r.x + r.w * o.mark; d.line(mx, by - 4, mx, by + bh + 4, p.ink, 2); }
  });
}

/** Curva de pérdida en un rectángulo. */
export function miniLoss(S: Frame, r: Rect, losses: number[], upto: number, total: number, o: { a?: number; maxY?: number; label?: string } = {}) {
  const { d, pal: p } = S, t = tone(S, 'err'), maxY = o.maxY ?? 1.6;
  d.withAlpha(o.a ?? 1, () => {
    if (o.label) d.text(o.label, r.x, r.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
    const top = r.y + (o.label ? 16 * S.u : 0), h = r.h - (top - r.y);
    if (h < 14) return;
    d.line(r.x, top + h, r.x + r.w, top + h, p.lineStrong, 1.5);
    d.line(r.x, top, r.x, top + h, p.lineStrong, 1.5);
    const pts: [number, number][] = [];
    const n = Math.min(losses.length, Math.floor(upto) + 1);
    const stride = Math.max(1, Math.floor(n / 90));
    for (let i = 0; i < n; i += stride) pts.push([r.x + (i / total) * r.w, top + h - clamp(losses[i] / maxY) * h]);
    if (n > 0 && (n - 1) % stride !== 0) pts.push([r.x + ((n - 1) / total) * r.w, top + h - clamp(losses[n - 1] / maxY) * h]);
    d.polyline(pts, t.c, 2);
    if (pts.length) { const q = pts[pts.length - 1]; d.circle(q[0], q[1], 3 * S.u, { fill: t.c }); }
  });
}

// ── texto y cajas ────────────────────────────────────────────────────────────
/** Etiqueta corta con fondo, que devuelve su caja. */
export function chip(S: Frame, text: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; size?: number; dashed?: boolean; mono?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), size = o.size ?? 12, pad = 7 * S.u;
  const w = d.measure(text, { size, weight: 700, font: o.mono ? 'mono' : 'ui' }) + pad * 2, h = size * S.u * 1.3 + pad * 1.1;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.tone ? t.soft : p.surface, stroke: o.tone ? t.c : p.lineStrong, lw: 1.3, r: 3, dash: o.dashed ? [4, 3] : undefined });
    d.text(text, x0 + w / 2, y, { size, weight: 700, color: o.tone ? t.ink : p.ink2, align: 'center', base: 'middle', font: o.mono ? 'mono' : 'ui' });
  });
  return { x: x0, y: y - h / 2, w, h };
}

/** Texto con ajuste de línea que devuelve su altura. */
export function para(S: Frame, text: string, x: number, y: number, w: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; a?: number; lh?: number; base?: CanvasTextBaseline } = {}) {
  return S.d.text(text, x, y, { size: o.size ?? 13, weight: o.weight ?? 600, color: o.color ?? S.pal.ink2, w, align: o.align, a: o.a, lh: o.lh ?? 1.3, base: o.base ?? 'top' });
}

export const thousands = (S: Frame, n: number) => S.n(n, 0);

/** Candado (matriz congelada). */
export function lock(S: Frame, x: number, y: number, s: number, a = 1) {
  const { d, pal: p } = S;
  d.withAlpha(a, () => {
    d.rect(x - s * 0.5, y - s * 0.05, s, s * 0.75, { fill: p.surface, stroke: p.ink2, lw: 1.5, r: 2 });
    d.polyline([[x - s * 0.28, y - s * 0.05], [x - s * 0.28, y - s * 0.42], [x + s * 0.28, y - s * 0.42], [x + s * 0.28, y - s * 0.05]], p.ink2, 1.6, { join: 'round' });
    d.circle(x, y + s * 0.3, s * 0.08, { fill: p.ink2 });
  });
}

// ── esquema de Falk: A arriba, B a la izquierda, ΔW = B·A al centro ─────────────
export function drawFalk(S: Frame, x: number, y: number, cs: number, B: ArrayLike<number>, A: ArrayLike<number>, r: number, o: { dW?: ArrayLike<number>; a?: number; range?: number; gap?: number } = {}) {
  const u = S.u, gap = o.gap ?? 7 * u, range = o.range ?? 1;
  const ax = x + r * cs + gap, ay = y, bx = x, by = y + r * cs + gap, dx = ax, dy = by;
  drawSigned(S, bx, by, B, 32, r, cs, { range, a: o.a });
  drawSigned(S, ax, ay, A, r, 32, cs, { range, a: o.a });
  if (o.dW) drawSigned(S, dx, dy, o.dW, 32, 32, cs, { range: Math.max(1e-6, maxAbs(o.dW)) * 1.1 > 0 ? (o.range ?? maxAbs(o.dW)) * 1 : 1, a: o.a });
  else S.d.rect(dx - 0.5, dy - 0.5, 32 * cs + 1, 32 * cs + 1, { stroke: S.pal.lineStrong, lw: 1.5, dash: [4, 3], a: o.a });
  return { A: { x: ax, y: ay, w: 32 * cs, h: r * cs }, B: { x: bx, y: by, w: r * cs, h: 32 * cs }, dW: { x: dx, y: dy, w: 32 * cs, h: 32 * cs }, w: r * cs + gap + 32 * cs, h: r * cs + gap + 32 * cs };
}

const SV = new WeakMap<object, number[]>();
/** Valores singulares de una matriz 32×32 con memoria (por identidad del arreglo). */
export function svOf(M: number[], f: (m: number[]) => number[]): number[] { let v = SV.get(M); if (!v) { v = f(M); SV.set(M, v); } return v; }
