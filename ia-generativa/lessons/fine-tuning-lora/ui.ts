// Piezas visuales propias de esta lección (no existían en el kit): marcas de zona, el mapa de respuestas del modelo diminuto,
// tablas de números como píxeles, medidores de aciertos y un candado. Todo con tone()/S.pal: sirve en claro y oscuro.
// La forma acompaña al color: cada zona tiene su marca (círculo, cruz, rombo); los errores son cuadritos de tinta.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { fitText, fz, txt } from './draw';
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

/** Tono de cada zona: 0 = arriba (círculo), 1 = abajo a la izquierda (cruz), 2 = abajo a la derecha (rombo). */
export const CLS_TONE: Tone[] = ['dat', 'err', 'sig'];

export function classMark(S: Frame, cls: number, x: number, y: number, r: number, a = 1) {
  const { d, pal: p } = S, t = tone(S, CLS_TONE[cls]);
  d.withAlpha(a, () => {
    if (cls === 0) d.circle(x, y, r, { fill: t.c, stroke: p.stage, lw: 1.2 });
    else if (cls === 1) { d.line(x - r, y - r, x + r, y + r, t.c, 2.4); d.line(x - r, y + r, x + r, y - r, t.c, 2.4); }
    else d.polygon([[x, y - r * 1.25], [x + r * 1.25, y], [x, y + r * 1.25], [x - r * 1.25, y]], { fill: t.c, stroke: p.stage, lw: 1.2 });
  });
}

/** Cuadrado más grande que cabe en `r` (alineado a la izquierda, al centro o a la derecha). */
export function squareIn(r: Rect, align: 'c' | 'l' | 'r' = 'c'): Rect {
  const s = Math.max(10, Math.min(r.w, r.h));
  const x = align === 'l' ? r.x : align === 'r' ? r.x + r.w - s : r.x + (r.w - s) / 2;
  return { x, y: r.y + (r.h - s) / 2, w: s, h: s };
}

// ── el mapa de respuestas (rejilla G×G) ─────────────────────────────────────
export interface MapOpts {
  a?: number;
  /** celdas donde la regla cambió (se rayan) */
  hatch?: Uint8Array | null;
  hatchA?: number;
  /** celdas incorrectas (cuadrito de tinta) */
  wrong?: Uint8Array | null;
  wrongA?: number;
  /** ejemplos nuevos (marcas de zona) y cuántos se ven */
  data?: Pt[];
  dataN?: number;
  /** ejemplos de repaso (cuadros huecos) y cuántos se ven */
  extra?: Pt[];
  extraN?: number;
  /** 0..1: cuántas filas se muestran (aparición de arriba abajo) */
  reveal?: number;
}

export function drawMap(S: Frame, r: Rect, pred: Uint8Array, o: MapOpts = {}) {
  const { d, ctx, pal: p } = S, u = S.u, cs = r.w / G;
  const ex = (i: number) => Math.round(r.x + i * cs), ey = (j: number) => Math.round(r.y + j * cs);
  const rows = Math.ceil(G * clamp(o.reveal ?? 1));
  const fa = p.dark ? 0.34 : 0.24;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface });
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
    if (o.hatch && (o.hatchA ?? 1) > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(o.hatchA ?? 1); ctx.beginPath();
      for (let j = 0; j < G; j++) {
        let i0 = -1;
        for (let i = 0; i <= G; i++) {
          const on = i < G && o.hatch[j * G + i] === 1;
          if (on && i0 < 0) i0 = i;
          if (!on && i0 >= 0) { ctx.rect(ex(i0), ey(j), ex(i) - ex(i0), ey(j + 1) - ey(j)); i0 = -1; }
        }
      }
      ctx.clip();
      ctx.strokeStyle = alp(p.ink, p.dark ? 0.42 : 0.36); ctx.lineWidth = 1;
      const step = 7 * u;
      ctx.beginPath();
      for (let t = -r.h; t < r.w; t += step) { ctx.moveTo(r.x + t, r.y + r.h); ctx.lineTo(r.x + t + r.h, r.y); }
      ctx.stroke();
      ctx.restore();
    }
    if (o.wrong && (o.wrongA ?? 1) > 0.01) {
      ctx.save(); ctx.globalAlpha *= clamp(o.wrongA ?? 1);
      ctx.fillStyle = alp(p.ink, 0.88);
      const s = Math.max(2.5, cs * 0.5);
      for (let j = 0; j < rows; j++) for (let i = 0; i < G; i++) if (o.wrong[j * G + i]) ctx.fillRect(r.x + (i + 0.5) * cs - s / 2, r.y + (j + 0.5) * cs - s / 2, s, s);
      ctx.restore();
    }
    if (o.data) {
      const n = Math.min(o.data.length, Math.round(o.dataN ?? o.data.length));
      for (let k = 0; k < n; k++) { const q = o.data[k]; classMark(S, q.c, r.x + ((q.x + 1) / 2) * r.w, r.y + ((1 - q.y) / 2) * r.h, 3.2 * u); }
    }
    if (o.extra) {
      const n = Math.min(o.extra.length, Math.round(o.extraN ?? o.extra.length));
      for (let k = 0; k < n; k++) {
        const q = o.extra[k], x = r.x + ((q.x + 1) / 2) * r.w, y = r.y + ((1 - q.y) / 2) * r.h, t = tone(S, CLS_TONE[q.c]);
        d.rect(x - 3.4 * u, y - 3.4 * u, 6.8 * u, 6.8 * u, { fill: p.stage, stroke: t.c, lw: 1.8 });
      }
    }
    d.rect(r.x - 0.5, r.y - 0.5, r.w + 1, r.h + 1, { stroke: p.lineStrong, lw: 1.5 });
  });
}

/** Celdas incorrectas de una predicción: según la regla nueva donde cambió, según la original en el resto. */
export function wrongCells(pred: Uint8Array, target: Uint8Array, base: Uint8Array, changed: Uint8Array, which: 'both' | 'old' | 'new' = 'both'): Uint8Array {
  const w = new Uint8Array(G * G);
  for (let k = 0; k < G * G; k++) {
    if (changed[k]) { if (which !== 'old' && pred[k] !== target[k]) w[k] = 1; }
    else if (which !== 'new' && pred[k] !== base[k]) w[k] = 1;
  }
  return w;
}

// ── tablas de números como píxeles ───────────────────────────────────────────
/** Tabla n × m como píxeles. Con signo: positivo y negativo en dos tonos (w y sig); `neutral`: tinta (lo congelado). */
export function drawSigned(S: Frame, x: number, y: number, M: ArrayLike<number>, n: number, m: number, cell: number, o: { range?: number; a?: number; frame?: boolean; neutral?: boolean; stroke?: string; levels?: number; cellH?: number } = {}) {
  const { d, ctx, pal: p } = S;
  const rng = o.range ?? 1, pos = tone(S, 'w').c, neg = tone(S, 'sig').c, ch = o.cellH ?? cell;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, m * cell, n * ch, { fill: p.surface });
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
      const v = M[i * m + j];
      let k = Math.min(1, Math.abs(v) / rng);
      if (o.levels) k = Math.round(k * (o.levels - 1)) / (o.levels - 1);
      if (k < 0.03) continue;
      ctx.fillStyle = alp(o.neutral ? p.ink : v >= 0 ? pos : neg, 0.08 + 0.8 * k);
      ctx.fillRect(Math.round(x + j * cell), Math.round(y + i * ch), Math.ceil(cell), Math.ceil(ch));
    }
    if (o.frame !== false) d.rect(x - 0.5, y - 0.5, m * cell + 1, n * ch + 1, { stroke: o.stroke ?? p.lineStrong, lw: 1.5 });
  });
}

export function maxAbs(M: ArrayLike<number>): number { let m = 1e-9; for (let i = 0; i < M.length; i++) m = Math.max(m, Math.abs(M[i])); return m; }

// ── medidores ────────────────────────────────────────────────────────────────
/** Medidor de aciertos 0..1: rótulo arriba a la izquierda, valor a la derecha, barra debajo. `hatch` lo raya como la zona nueva;
 *  `ghost` deja una marca discontinua (el valor de antes). Devuelve la altura usada. */
export function meter(S: Frame, r: { x: number; y: number; w: number }, label: string, v: number, o: { tone?: Tone; hatch?: boolean; ghost?: number; a?: number; hot?: number } = {}) {
  const { d, ctx, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'dat');
  const valS = S.n(clamp(v) * 100, 0) + S.l(' %', '%'), vw = S.d.measure(valS, { size: fz(S, 16), weight: 800, font: 'mono' });
  const lh = fz(S, 12.5) * u * 1.25, bh = Math.max(9, 11 * u), by = r.y + lh + 4 * u;
  d.withAlpha(o.a ?? 1, () => {
    if (o.hot) d.rect(r.x - 6 * u, r.y - 5 * u, r.w + 12 * u, by + bh + 6 * u - r.y, { fill: alp(t.c, 0.1 * o.hot), stroke: alp(t.c, 0.6 * o.hot), lw: 1.2, r: 4 });
    fitText(S, label, r.x, r.y + lh / 2, r.w - vw - 10 * u, { s: 12.5, weight: 700, c: p.ink2 });
    txt(S, valS, r.x + r.w, r.y + lh / 2, { s: 16, weight: 800, mono: true, c: t.ink, align: 'right' });
    d.rect(r.x, by, r.w, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
    const w = r.w * clamp(v);
    if (w > 0.5) d.rect(r.x, by, w, bh, { fill: alp(t.c, 0.72) });
    if (o.hatch && w > 3) {
      ctx.save(); ctx.beginPath(); ctx.rect(r.x, by, w, bh); ctx.clip();
      ctx.strokeStyle = alp(p.stage, 0.85); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let q = -bh; q < w; q += 5 * u) { ctx.moveTo(r.x + q, by + bh); ctx.lineTo(r.x + q + bh, by); }
      ctx.stroke(); ctx.restore();
    }
    if (o.ghost !== undefined) { const gx = r.x + r.w * clamp(o.ghost); d.line(gx, by - 4 * u, gx, by + bh + 4 * u, p.ink, 2, [3, 2]); }
  });
  return by + bh - r.y;
}
/** Alto que ocupa un medidor. */
export const meterH = (S: Frame) => fz(S, 12.5) * S.u * 1.25 + 4 * S.u + Math.max(9, 11 * S.u);

/** Candado (lo congelado). */
export function lock(S: Frame, x: number, y: number, s: number, a = 1) {
  const { d, pal: p } = S;
  d.withAlpha(a, () => {
    d.rect(x - s * 0.5, y - s * 0.05, s, s * 0.75, { fill: p.surface, stroke: p.ink2, lw: 1.6, r: 2 });
    d.polyline([[x - s * 0.28, y - s * 0.05], [x - s * 0.28, y - s * 0.42], [x + s * 0.28, y - s * 0.42], [x + s * 0.28, y - s * 0.05]], p.ink2, 1.7, { join: 'round' });
    d.circle(x, y + s * 0.3, s * 0.08, { fill: p.ink2 });
  });
}
