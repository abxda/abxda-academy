// Piezas de lectura de la escena de «Entrenar bien»: baraja de ejemplos, curvas de error y de tasa, barras, perillas y fichas.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { N, type Run } from './sim';
import { FS } from './view';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/** Reparto del lateral: en horizontal, arriba un cuadrado para la baraja y debajo la lectura; en vertical, a la izquierda la baraja y a la derecha la lectura. */
export function asideSplit(S: Frame, aside: Rect): { deck: Rect; info: Rect } {
  const g = 10 * S.u;
  // en vertical, y también en un escenario muy apaisado y bajo (teléfono en horizontal), la baraja va a la izquierda de la lectura
  if (S.portrait || S.W / S.H > 2.6) { const s = Math.min(aside.h, aside.w * 0.4); return { deck: { x: aside.x, y: aside.y, w: s, h: s }, info: { x: aside.x + s + g, y: aside.y, w: aside.w - s - g, h: aside.h } }; }
  const s = Math.min(aside.w, aside.h * 0.5);
  return { deck: { x: aside.x, y: aside.y, w: s, h: s }, info: { x: aside.x, y: aside.y + s + g, w: aside.w, h: aside.h - s - g } };
}

/** La baraja de ejemplos: 16×16 casillas. state(i): 0 sin usar · 1 ya visto en esta época · 2 en el lote actual. */
export function deck(S: Frame, r: Rect, o: { state?: (i: number) => 0 | 1 | 2; a?: number; visible?: number; frame?: boolean } = {}) {
  const { d, pal: p } = S, dat = tone(S, 'dat'), sig = tone(S, 'sig'), cols = 16;
  const cell = Math.floor(Math.min(r.w, r.h) / cols * 10) / 10, gw = cell * cols, x0 = r.x + (r.w - gw) / 2, y0 = r.y + (r.h - gw) / 2;
  const vis = o.visible ?? N;
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < Math.min(N, vis); i++) {
      const st = o.state ? o.state(i) : 1, x = x0 + (i % cols) * cell, y = y0 + Math.floor(i / cols) * cell, g = Math.max(1, cell * 0.14);
      if (st === 2) d.rect(x + g / 2, y + g / 2, cell - g, cell - g, { fill: sig.c });
      else if (st === 1) d.rect(x + g / 2, y + g / 2, cell - g, cell - g, { fill: alpha(dat.c, 0.62) });
      else d.rect(x + g / 2, y + g / 2, cell - g, cell - g, { fill: alpha(dat.c, 0.1), stroke: alpha(dat.c, 0.35), lw: 1 });
    }
    if (o.frame) d.rect(x0 - 3, y0 - 3, gw + 6, gw + 6, { stroke: p.line, lw: 1 });
  });
  return { x: x0, y: y0, w: gw, h: gw };
}

/** Contador con rótulo (como el del kit, pero con el rótulo siempre ≥ 12 px efectivos). */
function readout(S: Frame, x: number, y: number, label: string, value: string, o: { tone?: Tone; size?: number } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  S.d.text(label, x, y, { size: FS(S, 12), weight: 700, color: S.pal.mute });
  S.d.text(value, x, y + 6 * S.u, { size: o.size ?? 26, weight: 700, font: 'mono', color: o.tone ? t.ink : S.pal.ink, base: 'top' });
}

/** Caja con rótulo y subtítulo (como `box` del kit, pero el subtítulo es ≥ 12 px efectivos y se parte en dos líneas si no cabe). */
export function boxS(S: Frame, r: Rect, label: string, o: { tone?: Tone; sub?: string; a?: number; size?: number; font?: 'ui' | 'mono' } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'ink'), ls = FS(S, o.size ?? 14), ss = FS(S, 12), cx = r.x + r.w / 2;
  let lines: string[] = o.sub ? [o.sub] : [];
  if (o.sub && d.measure(o.sub, { size: ss }) > r.w - 10 * u) {
    const w = o.sub.split(' '); let best = 1, bw = Infinity;
    for (let i = 1; i < w.length; i++) { const m = Math.max(d.measure(w.slice(0, i).join(' '), { size: ss }), d.measure(w.slice(i).join(' '), { size: ss })); if (m < bw) { bw = m; best = i; } }
    lines = [w.slice(0, best).join(' '), w.slice(best).join(' ')];
  }
  const lhL = ls * u * 1.2, lhS = ss * u * 1.25, total = lhL + (lines.length ? 3 * u + lines.length * lhS : 0), y0 = r.y + (r.h - total) / 2;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1), stroke: o.tone ? t.c : p.lineStrong, lw: 1.5, r: 3 });
    d.text(label, cx, y0 + lhL / 2, { size: ls, weight: 700, color: o.tone ? t.ink : p.ink, align: 'center', base: 'middle', font: o.font });
    lines.forEach((ln, i) => d.text(ln, cx, y0 + lhL + 3 * u + i * lhS + lhS / 2, { size: ss, color: p.mute, align: 'center', base: 'middle' }));
  });
}

/** Lecturas numéricas en una cuadrícula. */
export function readouts(S: Frame, r: Rect, items: { l: string; v: string; t?: Tone; on?: boolean }[], cols = 2, o: { rowH?: number; size?: number; a?: number } = {}) {
  const vis = items.filter((i) => i.on !== false), rowH = (o.rowH ?? 48) * S.u, cw = r.w / cols;
  S.d.withAlpha(o.a ?? 1, () => vis.forEach((it, i) => readout(S, r.x + (i % cols) * cw, r.y + Math.floor(i / cols) * rowH + 12 * S.u, it.l, it.v, { tone: it.t ?? 'ink', size: o.size ?? (S.portrait ? 19 : 22) })));
  return Math.ceil(vis.length / cols) * rowH;
}

const LY0 = -3, LY1 = 1.9;     // eje del error: de 0,001 a ~80 en escala logarítmica
const ly = (v: number) => Math.log10(Math.max(1e-3, v));

export interface Series { run: Run; k: number; tone: Tone; dash?: number[]; a?: number; lw?: number }

/** Curva de error (escala logarítmica) frente al paso, con la línea del umbral. */
export function lossChart(S: Frame, r: Rect, series: Series[], o: { T: number; thr?: number; a?: number; title?: string; small?: boolean } = { T: 100 }) {
  const { d, pal: p } = S, u = S.u, small = o.small ?? r.h < 120 * u;
  const pl = (small ? 30 : 38) * u, pr = 12 * u, pt = (o.title ? 24 : 6) * u, pb = (small ? 16 : 22) * u;
  const c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (t: number) => c.x + (t / o.T) * c.w, Y = (v: number) => c.y + c.h - ((ly(v) - LY0) / (LY1 - LY0)) * c.h;
  d.withAlpha(o.a ?? 1, () => {
    if (o.title) d.text(o.title, r.x, r.y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
    const ticks = small ? [0.01, 1] : [0.001, 0.01, 0.1, 1, 10];
    ticks.forEach((v) => { d.line(c.x - 3 * u, Y(v), c.x, Y(v), p.lineStrong, 1.2); d.line(c.x, Y(v), c.x + c.w, Y(v), p.line, 1); d.text(S.n(v, v < 0.01 ? 3 : v < 0.1 ? 2 : v < 1 ? 1 : 0), c.x - 5 * u, Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    const xt = o.T >= 150 ? [0, 50, 100, 150] : [0, 50, 100];
    xt.forEach((t) => { if (t <= o.T) d.text(String(t), X(t), c.y + c.h + 4 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    if (!small) d.text(S.l('pasos', 'steps'), c.x + c.w, c.y + c.h + 4 * u + FS(S, 11) * u + 2, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top' });
    if (o.thr) { d.line(c.x, Y(o.thr), c.x + c.w, Y(o.thr), tone(S, 'dat').c, 1.6, [5, 4]); }
    d.clip(c.x, c.y - 2, c.w, c.h + 4, () => series.forEach((s) => {
      const n = Math.min(s.run.loss.length - 1, Math.floor(s.k)), pts: [number, number][] = [];
      const stride = Math.max(1, Math.floor(n / 220));
      for (let i = 0; i <= n; i += stride) pts.push([X(i), Y(s.run.loss[i])]);
      if (n % stride) pts.push([X(n), Y(s.run.loss[n])]);
      if (pts.length > 1) d.polyline(pts, tone(S, s.tone).c, s.lw ?? 2, { dash: s.dash, a: s.a });
    }));
  });
  return c;
}

/** Curva de la tasa de aprendizaje frente al paso. */
export function etaChart(S: Frame, r: Rect, series: { etas: number[]; tone: Tone; k?: number; dash?: number[]; a?: number }[], o: { T: number; max: number; a?: number; title?: string; cursor?: number } = { T: 100, max: 0.1 }) {
  const { d, pal: p } = S, u = S.u, small = r.h < 120 * u;
  const pl = (small ? 30 : 38) * u, pr = 6 * u, pt = (o.title ? 24 : 6) * u, pb = (small ? 16 : 22) * u;
  const c: Rect = { x: r.x + pl, y: r.y + pt, w: r.w - pl - pr, h: r.h - pt - pb };
  const X = (t: number) => c.x + (t / o.T) * c.w, Y = (v: number) => c.y + c.h - (v / o.max) * c.h;
  d.withAlpha(o.a ?? 1, () => {
    if (o.title) d.text(o.title, r.x, r.y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.line(c.x, c.y + c.h, c.x + c.w, c.y + c.h, p.lineStrong, 1.5); d.line(c.x, c.y, c.x, c.y + c.h, p.lineStrong, 1.5);
    [0, o.max].forEach((v) => d.text(S.n(v, v >= 0.1 ? 2 : 3), c.x - 5 * u, Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }));
    const xt = o.T >= 150 ? [0, 50, 100, 150] : [0, 50, 100];
    xt.forEach((t) => { if (t <= o.T) d.text(String(t), X(t), c.y + c.h + 4 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    series.forEach((s) => {
      const n = Math.min(s.etas.length - 1, Math.floor(s.k ?? s.etas.length)), pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) pts.push([X(i), Y(s.etas[i])]);
      if (pts.length > 1) d.polyline(pts, tone(S, s.tone).c, 2.2, { dash: s.dash, a: s.a });
    });
    if (o.cursor !== undefined) d.line(X(o.cursor), c.y, X(o.cursor), c.y + c.h, p.mute, 1, [3, 3]);
  });
  return c;
}

/** Barras horizontales con rótulo (valores libres). */
export function hbars(S: Frame, r: Rect, rows: { label: string; value: number; text: string; tone: Tone; a?: number }[], o: { max: number; labelW?: number; a?: number; rowH?: number } = { max: 1 }) {
  const { d, pal: p } = S, u = S.u, rh = (o.rowH ?? Math.min(34 * u, r.h / rows.length)), lw = (o.labelW ?? Math.min(120, r.w * 0.4)) * (o.labelW ? u : 1);
  d.withAlpha(o.a ?? 1, () => rows.forEach((row, i) => {
    const y = r.y + i * rh, t = tone(S, row.tone), bw = Math.max(2, (r.w - lw - 62 * u) * clamp(row.value / o.max));
    d.withAlpha(row.a ?? 1, () => {
      d.text(row.label, r.x + lw - 8 * u, y + rh / 2, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
      d.rect(r.x + lw, y + rh * 0.2, r.w - lw - 56 * u, rh * 0.6, { fill: p.surface2 });
      d.rect(r.x + lw, y + rh * 0.2, bw, rh * 0.6, { fill: t.c });
      d.text(row.text, r.x + lw + bw + 6 * u, y + rh / 2, { size: FS(S, 12), font: 'mono', weight: 700, color: t.ink, base: 'middle' });
    });
  }));
}

/** Perilla: un ajuste que gira (hiperparámetro). */
export function dial(S: Frame, cx: number, cy: number, rad: number, v01: number, label: string, value: string, t: Tone, a = 1) {
  const { d, pal: p } = S, c = tone(S, t), a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, ang = lerp(a0, a1, clamp(v01));
  d.withAlpha(a, () => {
    d.circle(cx, cy, rad, { fill: p.surface, stroke: c.c, lw: 2.2 });
    for (let i = 0; i <= 10; i++) { const q = lerp(a0, a1, i / 10); d.line(cx + Math.cos(q) * (rad + 3), cy + Math.sin(q) * (rad + 3), cx + Math.cos(q) * (rad + 7), cy + Math.sin(q) * (rad + 7), p.lineStrong, 1.3); }
    d.line(cx, cy, cx + Math.cos(ang) * rad * 0.78, cy + Math.sin(ang) * rad * 0.78, c.c, 3);
    d.circle(cx, cy, rad * 0.14, { fill: c.c });
    d.text(label, cx, cy + rad + 14 * S.u, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'top' });
    d.text(value, cx, cy + rad + 14 * S.u + FS(S, 13) * S.u * 1.25, { size: FS(S, 12), font: 'mono', weight: 700, color: c.ink, align: 'center', base: 'top' });
  });
}

/** Ficha clave/valor (receta). */
export function kvCard(S: Frame, r: Rect, rows: { k: string; v: string; t?: Tone }[], o: { title?: string; foot?: string; a?: number; show?: number } = {}) {
  const { d, pal: p } = S, u = S.u, pad = 14 * u, tsz = FS(S, 14), vsz = FS(S, 14.5);
  const titleH = o.title ? 26 * u : 0, footH = o.foot ? 22 * u : 0, rh = (r.h - pad * 2 - titleH - footH) / rows.length;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    if (o.title) d.text(o.title, r.x + pad, r.y + pad, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' });
    rows.forEach((row, i) => {
      const a = clamp((o.show ?? rows.length) - i); if (a <= 0) return;
      const y = r.y + pad + titleH + i * rh, t = tone(S, row.t ?? 'ink');
      d.withAlpha(a, () => {
        if (i > 0) d.line(r.x + pad, y, r.x + r.w - pad, y, p.line, 1);
        d.text(row.k, r.x + pad, y + rh / 2, { size: tsz, weight: 700, color: p.ink2, base: 'middle' });
        d.text(row.v, r.x + r.w - pad, y + rh / 2, { size: vsz, font: 'mono', weight: 700, color: t.ink, align: 'right', base: 'middle' });
      });
    });
    if (o.foot) d.text(o.foot, r.x + pad, r.y + r.h - pad * 0.6, { size: FS(S, 12), color: p.mute, base: 'bottom' });
  });
}
