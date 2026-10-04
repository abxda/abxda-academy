// Utilidades de dibujo propias de esta lección (el kit no trae marcadores con estado de «nuevo», medidores ni la
// ecuación del modelo). Todo usa tone()/S.pal: sin colores literales. Funciones puras de lo que reciben.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { Plot } from '../../../../../theme/kit';
import type { Cls, Model } from './data';

/** Duración (s) del segmento k. Las voces y los idiomas duran distinto: se anima por fracciones del segmento. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.07, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);

/** Tamaño de texto con piso de 12 px efectivos (S.u < 1 en teléfono). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
/** Altura/espaciado que no se encoge por debajo de 0,9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);
export const pct = (S: Frame, f: number) => `${S.n(f * 100, 0)}${S.lang === 'es' ? ' %' : '%'}`;
export const num = (S: Frame, x: number, digits = 2) => S.n(x, digits).replace('-', '−');
export const signed = (S: Frame, x: number, digits = 2) => (x >= 0 ? '+' : '') + num(S, x, digits);
export const label = (S: Frame, c: Cls) => (c === 1 ? 'spam' : S.l('normal', 'legit'));
export const clsTone = (c: Cls): Tone => (c === 1 ? 'err' : 'dat');

// ── marcadores de dato: círculo = normal, cruz = spam (la forma acompaña al color) ──
export function mark(S: Frame, x: number, y: number, cls: Cls, o: { r?: number; a?: number; ring?: boolean; ringA?: number; ghost?: boolean; big?: boolean; dashRing?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, clsTone(cls)), r = (o.r ?? 5) * S.u * (o.big ? 1.35 : 1);
  d.withAlpha(o.a ?? 1, () => {
    if (cls === 0) {
      if (o.ghost) d.circle(x, y, r, { fill: alpha(p.stage, 0.9), stroke: t.c, lw: 2 });
      else d.circle(x, y, r, { fill: t.c, stroke: p.stage, lw: 1.5 });
    } else {
      const w = o.ghost ? 1.9 : 2.8;
      d.line(x - r, y - r, x + r, y + r, p.stage, w + 2.2); d.line(x - r, y + r, x + r, y - r, p.stage, w + 2.2);
      d.line(x - r, y - r, x + r, y + r, t.c, w); d.line(x - r, y + r, x + r, y - r, t.c, w);
    }
    if (o.ring) d.withAlpha(o.ringA ?? 1, () => d.circle(x, y, r + 5 * S.u, { stroke: p.ink, lw: o.dashRing ? 1.8 : 1.6, dash: o.dashRing ? [3, 3] : undefined }));
  });
}

/** Ejes de la gráfica de correos: enlaces (x) y % de mayúsculas (y). */
export function axes(S: Frame, plot: Plot, a = 1) {
  const { d, pal: p } = S, r = plot.r, u = S.u;
  d.withAlpha(a, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    [0, 2, 4, 6, 8, 10].forEach((v) => { d.line(plot.X(v), r.y + r.h, plot.X(v), r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(String(v), plot.X(v), r.y + r.h + 7 * u, { size: fz(S, 11), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    [0, 10, 20, 30, 40].forEach((v) => { d.line(r.x - 4 * u, plot.Y(v), r.x, plot.Y(v), p.lineStrong, 1.5); d.text(String(v), r.x - 7 * u, plot.Y(v), { size: fz(S, 11), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('enlaces', 'links'), r.x + r.w, r.y + r.h + 24 * u, { size: fz(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.text(S.l('% de mayúsculas', '% capital letters'), plot.outer.x + 2, r.y - 6 * u, { size: fz(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
    d.text(S.l('datos ilustrativos', 'illustrative data'), r.x + r.w, r.y - 6 * u, { size: fz(S, 12), weight: 600, italic: true, color: p.mute, align: 'right', base: 'bottom' });
  });
}

/** Recorta un polígono con el semiplano f(x, y) ≥ 0 (f afín). */
export function clipHalf(poly: [number, number][], f: (x: number, y: number) => number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A[0], A[1]), fb = f(B[0], B[1]);
    if (fa >= 0) out.push(A);
    if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); }
  }
  return out;
}

/** La recta del modelo (puntaje = 0), tintando cada lado: spam a un lado, normal al otro. */
export function drawModelLine(S: Frame, plot: Plot, m: Model, o: { a?: number; tint?: number; lw?: number; dash?: number[]; tone?: Tone; line?: boolean } = {}) {
  const { d } = S, r = plot.r, t = tone(S, o.tone ?? 'w');
  const corners: [number, number][] = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  const f = (px: number, py: number) => m.w1 * plot.iX(px) + m.w2 * plot.iY(py) + m.b;   // puntaje en unidades de datos
  d.withAlpha(o.a ?? 1, () => {
    if (o.tint) {
      const sp = clipHalf(corners, f), nm = clipHalf(corners, (x, y) => -f(x, y));
      if (sp.length > 2) d.polygon(sp, { fill: alpha(tone(S, 'err').c, o.tint) });
      if (nm.length > 2) d.polygon(nm, { fill: alpha(tone(S, 'dat').c, o.tint) });
    }
    if (o.line === false) return;
    // dos puntos de la recta fuera del recuadro y se recorta con la gráfica
    let p1: [number, number], p2: [number, number];
    if (Math.abs(m.w2) > 1e-6) { const x1 = plot.o.xr[0] - 1, x2 = plot.o.xr[1] + 1; p1 = [x1, -(m.b + m.w1 * x1) / m.w2]; p2 = [x2, -(m.b + m.w1 * x2) / m.w2]; }
    else { const x = -m.b / m.w1; p1 = [x, plot.o.yr[0] - 1]; p2 = [x, plot.o.yr[1] + 1]; }
    plot.line(p1[0], p1[1], p2[0], p2[1], o.tone ?? 'w', o.lw ?? 3, o.dash);
  });
  void t;
}

// ── pastillas, medidores y barras para la columna lateral ──
export function readout(S: Frame, x: number, y: number, name: string, value: string, tn: Tone = 'ink', w = 120) {
  const { d, pal: p } = S, k = kk(S);
  d.text(name, x, y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top', w });
  d.text(value, x, y + 15 * k, { size: fz(S, 20), weight: 700, font: 'mono', color: tn === 'ink' ? p.ink : tone(S, tn).ink, base: 'top' });
}

/** Medidor 0–100 % con marca opcional (p. ej. el azar, 50 %). Altura ≈ 30–46. */
export function gauge(S: Frame, r: Rect, name: string, f: number, text: string, tn: Tone, marks: { f: number; text: string; tone?: Tone }[] = []) {
  const { d, pal: p } = S, k = kk(S), bh = 10 * k, by = r.y + 20 * k;
  d.text(name, r.x, r.y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
  d.text(text, r.x + r.w, r.y - 1, { size: fz(S, 13), weight: 700, font: 'mono', color: tone(S, tn).ink, align: 'right', base: 'top' });
  d.rect(r.x, by, r.w, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
  d.rect(r.x, by, Math.max(0, r.w * Math.min(1, f)), bh, { fill: tone(S, tn).c });
  let last = -1e9;
  marks.forEach((m) => {
    const mx = r.x + r.w * m.f, c = m.tone ? tone(S, m.tone).c : p.ink;
    d.line(mx, by - 4 * k, mx, by + bh + 4 * k, c, 2);
    const tw = d.measure(m.text, { size: fz(S, 12), weight: 600 });
    const tx = Math.min(Math.max(mx, r.x + tw / 2), r.x + r.w - tw / 2);
    if (Math.abs(tx - last) > tw * 0.9 + 6) d.text(m.text, tx, by + bh + 6 * k, { size: fz(S, 12), weight: 600, color: p.ink2, align: 'center', base: 'top' });
    last = tx;
  });
  return 20 * k + bh + (marks.length ? 26 * k : 8 * k);
}

/** Una pastilla de parámetro (w₁, w₂, b) con su valor. */
export function chip(S: Frame, r: Rect, name: string, value: number, o: { hot?: boolean; a?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, 'w'), k = kk(S);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, o.hot ? 0.3 : 0.12), stroke: t.c, lw: o.hot ? 2.4 : 1.5, r: 3 });
    d.text(name, r.x + 7 * k, r.y + 6 * k, { size: fz(S, 12), weight: 700, color: t.ink, base: 'top' });
    d.text(num(S, value, 2), r.x + r.w - 7 * k, r.y + r.h - 6 * k, { size: fz(S, 16), weight: 700, font: 'mono', color: p.ink, align: 'right', base: 'bottom' });
  });
}

/** Candado en píxeles: los parámetros quedan fijos. */
const LOCK = ['..1111..', '.1....1.', '.1....1.', '11111111', '11222211', '11222211', '11222211', '11111111'];
export function lock(S: Frame, x: number, y: number, cell: number, a = 1) {
  S.d.withAlpha(a, () => LOCK.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') S.d.rect(x + c * cell, y + r * cell, cell, cell, { fill: ch === '1' ? S.pal.ink2 : tone(S, 'w').c }); })));
  return 8 * cell;
}

/** La ecuación del modelo, con ajuste de línea. `reveal` da la opacidad de cada término (peso de enlaces, peso de mayúsculas, número fijo). Devuelve la altura usada. */
export function equation(S: Frame, x: number, y: number, w: number, o: { a?: number; vals?: Model; reveal?: [number, number, number] } = {}) {
  const { d, pal: p } = S, size = fz(S, 14), wt = tone(S, 'w'), sg = tone(S, 'sig'), k = kk(S);
  type Tk = [string, string, number];
  const rv = o.reveal ?? [1, 1, 1];
  const f = (v: number | undefined, nm: string) => (v === undefined ? nm : num(S, v, 2));
  const groups: Tk[][] = [
    [[S.l('puntaje', 'score'), p.ink, rv[0]], [' = ', p.ink2, rv[0]], [f(o.vals?.w1, 'w₁'), wt.ink, rv[0]], [' · ', p.ink2, rv[0]], [S.l('enlaces', 'links'), sg.ink, rv[0]]],
    [[' + ', p.ink2, rv[1]], [f(o.vals?.w2, 'w₂'), wt.ink, rv[1]], [' · ', p.ink2, rv[1]], [S.l('mayúsculas', 'capitals'), sg.ink, rv[1]]],
    [[o.vals && o.vals.b < 0 ? ' − ' : ' + ', p.ink2, rv[2]], [o.vals ? num(S, Math.abs(o.vals.b), 2) : 'b', wt.ink, rv[2]]],
  ];
  const wid = (g: Tk[]) => g.reduce((s, [t]) => s + d.measure(t, { size, weight: 700, font: 'mono' }), 0);
  const lines: Tk[][] = [];
  for (const g of groups) { const last = lines[lines.length - 1]; if (last && wid(last) + wid(g) <= w) last.push(...g); else lines.push([...g]); }
  const lh = 21 * k;
  d.withAlpha(o.a ?? 1, () => lines.forEach((ln, i) => { let cx = x; ln.forEach(([t, c, a]) => { if (a > 0.01) d.text(t, cx, y + i * lh, { size, weight: 700, font: 'mono', color: c, base: 'top', a }); cx += d.measure(t, { size, weight: 700, font: 'mono' }); }); }));
  return lines.length * lh;
}

/** Leyenda de marcadores: se acomoda en una o dos columnas según el ancho. Devuelve la altura usada. */
export function legend(S: Frame, x: number, y: number, w: number, o: { fresh?: boolean; ring?: boolean; counts?: boolean } = {}) {
  const { d, pal: p } = S, k = kk(S), size = fz(S, 12);
  type Item = { draw: (cx: number, cy: number) => void; text: string };
  const items: Item[] = [
    { draw: (cx, cy) => mark(S, cx, cy, 0, { r: 4.5 }), text: S.l(`normal${o.counts ? ' · 15' : ''}`, `legit${o.counts ? ' · 15' : ''}`) },
    { draw: (cx, cy) => mark(S, cx, cy, 1, { r: 4.5 }), text: `spam${o.counts ? ' · 15' : ''}` },
  ];
  if (o.fresh) items.push({ draw: (cx, cy) => { mark(S, cx - 4 * k, cy, 0, { r: 4, ghost: true }); mark(S, cx + 8 * k, cy, 1, { r: 4, ghost: true }); }, text: S.l('nuevos', 'new') });
  if (o.ring) items.push({ draw: (cx, cy) => d.circle(cx, cy, 8 * k, { stroke: p.ink, lw: 1.6 }), text: S.l('error', 'error') });
  const cols = w > 230 * k ? 2 : 1, cw = w / cols;
  items.forEach((it, i) => {
    const cx = x + (i % cols) * cw, cy = y + 9 * k + Math.floor(i / cols) * 22 * k;
    it.draw(cx + 11 * k, cy);
    d.text(it.text, cx + 28 * k, cy, { size, weight: 600, color: p.ink2, base: 'middle' });
  });
  return Math.ceil(items.length / cols) * 22 * k;
}

/** Barras agrupadas: para cada fila (tu regla / la máquina) una barra con los vistos y otra con los nuevos. `range` (fracciones) pinta los nuevos como un rango. */
export interface BarRow { name: string; tone: Tone; seen: number; fresh: number; freshOn?: number; range?: [number, number] }
export function groupBars(S: Frame, r: Rect, rows: BarRow[], o: { seenLabel: string; freshLabel: string }) {
  const { d, pal: p } = S, k = kk(S), size = fz(S, 12), anyRange = rows.some((q) => q.range), vw = (anyRange ? 62 : 40) * k, lw = Math.min(70 * k, r.w * 0.28);
  let y = r.y;
  rows.forEach((row) => {
    const t = tone(S, row.tone);
    d.text(row.name, r.x, y, { size: fz(S, 13), weight: 800, color: t.ink, base: 'top', w: r.w });
    y += 18 * k;
    ([[o.seenLabel, row.seen, 1], [o.freshLabel, row.fresh, row.freshOn ?? 1]] as [string, number, number][]).forEach(([nm, v, on], j) => {
      const bx = r.x + lw, bw = r.w - lw - vw, bh = 12 * k;
      d.text(nm, r.x + lw - 6 * k, y + bh / 2, { size, weight: 600, color: p.ink2, align: 'right', base: 'middle' });
      d.rect(bx, y, bw, bh, { fill: p.surface2 });
      d.withAlpha(on, () => {
        if (j === 0) d.rect(bx, y, bw * v, bh, { fill: t.c });
        else if (row.range) {
          const [lo, hi] = row.range;
          d.rect(bx, y, bw * hi, bh, { fill: alpha(t.c, 0.1) });
          d.rect(bx, y, bw * lo, bh, { fill: alpha(t.c, 0.22), stroke: t.c, lw: 1.5 });
          d.line(bx + bw * hi, y - 2 * k, bx + bw * hi, y + bh + 2 * k, t.c, 2);
        } else d.rect(bx, y, bw * v, bh, { fill: alpha(t.c, 0.22), stroke: t.c, lw: 1.5 });
        const txt = j === 1 && row.range ? `${S.n(row.range[0] * 100, 0)}–${S.n(row.range[1] * 100, 0)}${S.lang === 'es' ? ' %' : '%'}` : pct(S, v);
        d.text(txt, bx + bw + 6 * k, y + bh / 2, { size, weight: 700, font: 'mono', color: p.ink, base: 'middle' });
      });
      y += 18 * k;
    });
    y += 6 * k;
  });
  return y - r.y;
}
