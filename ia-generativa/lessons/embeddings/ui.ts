// Ayudas de dibujo propias de la lección «Embeddings» (el kit no las trae): tamaños de texto, números con coma, franjas de vector
// (una barra por dimensión), etiquetas que no se pisan, filtro de visibilidad por acto y un autovalor mínimo para la PCA.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { label, type Lg } from './vectors';

/** Tamaño de texto para que el texto efectivo (tamaño × S.u) nunca baje de `px` píxeles. */
export const fs = (S: Frame, px: number) => px * Math.max(1, 1 / S.u);
/** Teléfono horizontal: muy bajo. */
export const isTiny = (S: Frame) => !S.portrait && S.H < 360;
export const lg = (S: Frame): Lg => S.lang as Lg;
export const word = (S: Frame, i: number) => label(lg(S), i);
/** Área útil con márgenes. */
export const area = (S: Frame): Rect => inset(S.full(), 12 * S.u);

/** Número con signo menos tipográfico y coma decimal en español (S.n usa es-MX, que escribe punto). */
export const num = (S: Frame, x: number, digits = 2) => {
  const s = S.n(x, digits).replace('-', '−');
  return s;
};
/** Entero con separador de miles que no se confunde con decimales (espacio fino). */
export const big = (S: Frame, x: number) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const pct = (S: Frame, x: number, d = 0) => num(S, x * 100, d) + (S.lang === 'es' ? ' %' : '%');

/** Opacidad de un acto: aparece al empezar `from` y se desvanece al empezar `to` (si lo hay). */
export function actAlpha(S: Frame, from: string, to?: string): number {
  if (!S.on(from)) return 0;
  const a = S.at(from, 0, 0.55, 'out');
  const b = to ? S.at(to, 0, 0.45, 'out') : 0;
  return a * (1 - b);
}

/** Recorta un texto con puntos suspensivos para que quepa en `maxW` píxeles. */
export function fit(S: Frame, text: string, maxW: number, size: number, weight = 600): string {
  const d = S.d;
  if (d.measure(text, { size, weight }) <= maxW) return text;
  let t = text;
  while (t.length > 2 && d.measure(t + '…', { size, weight }) > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

/** Franja de un vector: una barra por dimensión, hacia arriba si es positiva y hacia abajo si es negativa. */
export function strip(S: Frame, r: Rect, vals: ArrayLike<number>, o: { tone?: Tone; max?: number; a?: number; baseline?: boolean; reveal?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), n = vals.length, bw = r.w / n, mid = r.y + r.h / 2;
  let mx = o.max ?? 0; if (!o.max) for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(vals[i])); mx ||= 1;
  const upto = Math.ceil(n * clamp(o.reveal ?? 1));
  d.withAlpha(o.a ?? 1, () => {
    if (o.baseline !== false) d.line(r.x, mid, r.x + r.w, mid, p.line, 1);
    for (let i = 0; i < upto; i++) {
      const h = (vals[i] / mx) * (r.h / 2 - 1);
      const x = r.x + i * bw, w = Math.max(1, bw - (bw > 3 ? 1 : 0.4));
      d.rect(x, h >= 0 ? mid - h : mid, w, Math.max(1, Math.abs(h)), { fill: t.c });
    }
  });
}

/** Etiqueta pequeña con fondo (rótulos cortos sobre el diagrama). */
export function chip(S: Frame, text: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; size?: number; mono?: boolean; strike?: boolean; weight?: number } = {}) {
  const { d } = S, t = tone(S, o.tone ?? 'ink'), size = o.size ?? fs(S, 12);
  const box = d.tag(text, x, y, { color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, size, font: o.mono ? 'mono' : 'ui', weight: o.weight });
  if (o.strike) d.withAlpha(o.a ?? 1, () => d.line(box.x + 3, box.y + box.h / 2, box.x + box.w - 3, box.y + box.h / 2, tone(S, 'err').c, 2));
  return box;
}

// ───────── etiquetas que no se pisan ─────────
export interface LabelItem { x: number; y: number; r: number; text: string; prio: number; color: string; weight?: number; size?: number }
/** Coloca etiquetas junto a sus puntos probando varias posiciones; descarta la que no cabe sin pisar otra. Determinista. */
export function placeLabels(S: Frame, items: LabelItem[], bounds: Rect, avoid: Rect[] = []) {
  const { d, pal: p } = S, placed: Rect[] = [...avoid];
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const dots = items.map((it) => ({ x: it.x - it.r - 1, y: it.y - it.r - 1, w: it.r * 2 + 2, h: it.r * 2 + 2 }));
  const order = items.map((_, i) => i).sort((i, j) => items[j].prio - items[i].prio);
  const out: { it: LabelItem; x: number; y: number; align: CanvasTextAlign }[] = [];
  for (const i of order) {
    const it = items[i], size = it.size ?? fs(S, 12), w = d.measure(it.text, { size, weight: it.weight ?? 700 }), h = size * S.u * 1.15, g = it.r + 3 * S.u;
    const cands: [number, number, CanvasTextAlign][] = [[g, 0, 'left'], [-g, 0, 'right'], [0, -g - h / 2, 'center'], [0, g + h / 2, 'center'], [g * 0.8, -h * 0.9, 'left'], [-g * 0.8, -h * 0.9, 'right'], [g * 0.8, h * 0.9, 'left'], [-g * 0.8, h * 0.9, 'right']];
    for (const [dx, dy, al] of cands) {
      const lx = al === 'left' ? it.x + dx : al === 'right' ? it.x + dx - w : it.x + dx - w / 2, ly = it.y + dy - h / 2;
      const box: Rect = { x: lx - 1, y: ly - 1, w: w + 2, h: h + 2 };
      if (box.x < bounds.x || box.y < bounds.y || box.x + box.w > bounds.x + bounds.w || box.y + box.h > bounds.y + bounds.h) continue;
      if (placed.some((q) => hit(q, box)) || dots.some((q, j) => j !== i && hit(q, box))) continue;
      placed.push(box); out.push({ it, x: it.x + dx, y: it.y + dy, align: al });
      break;
    }
  }
  for (const o of out) d.text(o.it.text, o.x, o.y, { size: o.it.size ?? fs(S, 12), weight: o.it.weight ?? 700, color: o.it.color, align: o.align, base: 'middle', halo: p.stage, haloW: 4 });
  return placed;
}

/** Flecha entre dos puntos con una etiqueta opcional al medio. */
export function arrowLabel(S: Frame, x1: number, y1: number, x2: number, y2: number, color: string, text?: string, o: { lw?: number; a?: number; size?: number; offset?: number } = {}) {
  const { d, pal: p } = S;
  d.withAlpha(o.a ?? 1, () => {
    d.arrow(x1, y1, x2, y2, color, o.lw ?? 2.4, 9);
    if (text) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, ang = Math.atan2(y2 - y1, x2 - x1), off = o.offset ?? 12 * S.u;
      d.text(text, mx - Math.sin(ang) * off, my + Math.cos(ang) * off, { size: o.size ?? fs(S, 12), weight: 700, color, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
    }
  });
}

/** Barras horizontales de coseno con una fila resaltable. Devuelve la altura usada. */
export function cosBars(S: Frame, r: Rect, rows: { label: string; value: number; tone?: Tone; hot?: boolean; tag?: string; dim?: boolean }[], o: { size?: number; rowH?: number; show?: number; max?: number } = {}) {
  const { d, pal: p } = S, size = o.size ?? fs(S, 13), rh = o.rowH ?? Math.min(30 * S.u, r.h / Math.max(1, rows.length));
  const lw = Math.min(r.w * 0.44, Math.max(...rows.map((x) => d.measure(x.label, { size, weight: 700 })), 40) + 10 * S.u);
  const valW = d.measure('−0,00', { size: fs(S, 12), weight: 700, font: 'mono' }) + 6 * S.u;
  const bx = r.x + lw + 6 * S.u, bw = Math.max(20, r.w - lw - 6 * S.u - valW);
  rows.forEach((row, i) => {
    const a = clamp((o.show ?? rows.length) - i); if (a <= 0) return;
    const y = r.y + i * rh, t = tone(S, row.tone ?? 'lat'), v = clamp(row.value / (o.max ?? 1), -1, 1);
    d.withAlpha(a * (row.dim ? 0.5 : 1), () => {
      d.text(row.label, r.x + lw, y + rh / 2, { size, weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle' });
      d.rect(bx, y + rh * 0.2, bw, rh * 0.6, { fill: p.surface2 });
      if (v >= 0) d.rect(bx, y + rh * 0.2, bw * v, rh * 0.6, { fill: row.hot ? t.c : alpha(t.c, 0.55) });
      else d.rect(bx, y + rh * 0.2, bw * 0.02, rh * 0.6, { fill: alpha(t.c, 0.55) });
      d.text(num(S, row.value, 2), r.x + r.w, y + rh / 2, { size: fs(S, 12), font: 'mono', weight: 700, color: p.ink2, align: 'right', base: 'middle' });
      if (row.tag) d.text(row.tag, bx + 4 * S.u, y + rh / 2, { size: fs(S, 11), weight: 700, color: p.ink, base: 'middle' });
    });
  });
  return rows.length * rh;
}

// ───────── PCA mínima de unas pocas palabras (para dibujar desplazamientos sin pretender más de lo que son) ─────────
/** Diagonaliza una matriz simétrica pequeña con el método de Jacobi. Devuelve valores y vectores propios (columnas). */
function jacobi(A: number[][]): { val: number[]; vec: number[][] } {
  const n = A.length, a = A.map((r) => r.slice()), v: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] * a[i][j];
    if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(a[p][q]) < 1e-30) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
    }
  }
  return { val: a.map((r, i) => r[i]), vec: v };
}

export interface Pca2 { pts: [number, number][]; project: (v: ArrayLike<number>) => [number, number]; explained: number }
/** PCA a 2 ejes de las filas `rows` (vectores de longitud DIM). `up`: parejas [i, j] cuyo desplazamiento medio i→j debe quedar hacia arriba. */
export function pca2(rows: ArrayLike<number>[], up?: [number, number][]): Pca2 {
  const n = rows.length, D = rows[0].length, mean = new Float64Array(D);
  for (const r of rows) for (let k = 0; k < D; k++) mean[k] += r[k] / n;
  const X = rows.map((r) => Array.from({ length: D }, (_, k) => r[k] - mean[k]));
  const G = X.map((a) => X.map((b) => { let s = 0; for (let k = 0; k < D; k++) s += a[k] * b[k]; return s; }));
  const { val, vec } = jacobi(G), ord = val.map((_, i) => i).sort((i, j) => val[j] - val[i]);
  const total = val.reduce((s, x) => s + Math.max(0, x), 0) || 1;
  const axes = ord.slice(0, 2).map((c) => { const ax = new Float64Array(D); for (let i = 0; i < n; i++) for (let k = 0; k < D; k++) ax[k] += vec[i][c] * X[i][k]; const nn = Math.hypot(...ax) || 1; for (let k = 0; k < D; k++) ax[k] /= nn; return ax; });
  let proj = (v: ArrayLike<number>): [number, number] => { let x = 0, y = 0; for (let k = 0; k < D; k++) { x += (v[k] - mean[k]) * axes[0][k]; y += (v[k] - mean[k]) * axes[1][k]; } return [x, y]; };
  if (up?.length) { // gira el plano para que el desplazamiento medio apunte hacia arriba (es solo una rotación dentro del mismo plano)
    let dx = 0, dy = 0; const P = rows.map((r) => proj(r)); for (const [i, j] of up) { dx += P[j][0] - P[i][0]; dy += P[j][1] - P[i][1]; }
    const ang = Math.PI / 2 - Math.atan2(dy, dx), c = Math.cos(ang), s = Math.sin(ang), base = proj;
    proj = (v) => { const [x, y] = base(v); return [x * c - y * s, x * s + y * c]; };
  }
  return { pts: rows.map((r) => proj(r)), project: proj, explained: (val[ord[0]] + val[ord[1]]) / total };
}
