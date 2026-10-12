// Utilidades de dibujo propias de esta lección: tiempo por fracciones de segmento, ejes que se presentan uno por uno,
// tangente, escalón, lupa, niebla e historial del error. Todo usa tone()/S.pal (sin colores literales) y es puro.
import { Plot, alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { L, dL } from './curves';

// ── tiempo: las voces y los idiomas duran distinto, así que se anima por fracciones de cada segmento ──
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.08, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Sube con la entrada del segmento a y baja con la del b (fracciones de cada uno). */
export const span = (S: Frame, a: string, b: string | null, ia = [0, 0.15], ib = [0, 0.15]) =>
  fr(S, a, ia[0], ia[1]) * (b ? 1 - fr(S, b, ib[0], ib[1]) : 1);

// ── tamaños ──
/** Tamaño de texto con piso de 12 px efectivos (S.u < 1 en teléfono). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
/** Espaciado que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);

// ── números (punto decimal; signo menos tipográfico) ──
export const sn = (S: Frame, x: number, d = 2) => S.n(Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d).replace('-', '−');
export const sg = (S: Frame, x: number, d = 2) => (x > 0.5 * 10 ** -d ? '+' : '') + sn(S, x, d);
/** Número corto: sin decimales si es entero, si no con los necesarios (hasta 3). */
export const nice = (S: Frame, x: number) => {
  const r = Math.round(x * 1000) / 1000, d = Number.isInteger(r) ? 0 : Number.isInteger(r * 10) ? 1 : Number.isInteger(r * 100) ? 2 : 3;
  return sn(S, r, d);
};

const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ═════════════════════════════════════════════════════════════════════════
// La gráfica de un peso
// ═════════════════════════════════════════════════════════════════════════
export const XR: [number, number] = [-2.3, 8.3], YR: [number, number] = [0, 14.6];
export const plot1 = (S: Frame, r: Rect) => new Plot(S, r, { xr: XR, yr: YR, pad: { l: 36, r: 10, t: 26, b: 42 } });
/** Píxeles por unidad de peso y por unidad de error. */
export const kxy = (pl: Plot) => ({ kx: pl.r.w / (pl.o.xr[1] - pl.o.xr[0]), ky: pl.r.h / (pl.o.yr[1] - pl.o.yr[0]) });

/** Ejes: primero la línea horizontal (el peso) y luego la vertical (el error), cada una con su opacidad. */
export function axes1(S: Frame, pl: Plot, ax: number, ay: number) {
  const { d, pal: p } = S, r = pl.r, k = kk(S), ts = fz(S, 11.5);
  if (ax > 0.01) d.withAlpha(ax, () => {
    const by = r.y + r.h;
    d.line(r.x, by, r.x + r.w, by, p.lineStrong, 1.5);
    const dense = pl.X(1) - pl.X(0) < d.measure('−2', { size: ts, font: 'mono' }) + 10 * k;
    for (let v = -2; v <= 8; v++) {
      d.line(pl.X(v), by, pl.X(v), by + 4 * k, p.lineStrong, 1.5);
      if (!dense || v % 2 === 0) d.text(sn(S, v, 0), pl.X(v), by + 7 * k, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    }
    d.text(S.l('peso w', 'weight w'), r.x + r.w, by + 25 * k, { size: fz(S, 13), weight: 700, color: tone(S, 'w').ink, align: 'right', base: 'top' });
  });
  if (ay > 0.01) d.withAlpha(ay, () => {
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    [0, 3, 6, 9, 12].forEach((v) => {
      d.line(r.x - 4 * k, pl.Y(v), r.x, pl.Y(v), p.lineStrong, 1.5);
      d.text(String(v), r.x - 7 * k, pl.Y(v), { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    });
    d.text('error', pl.outer.x + 2, r.y - 8 * k, { size: fz(S, 13), weight: 700, color: tone(S, 'err').ink, base: 'bottom' });
  });
}

/** La bolita: el peso actual sobre la curva. */
export function ball(S: Frame, x: number, y: number, a = 1, hollow = false) {
  const t = tone(S, 'w'), r = 8 * kk(S);
  S.d.withAlpha(a, () => {
    if (hollow) S.d.circle(x, y, r * 0.85, { fill: alpha(S.pal.stage, 0.85), stroke: t.c, lw: 2.5 });
    else S.d.circle(x, y, r, { fill: t.c, stroke: S.pal.stage, lw: 2.5 });
  });
}

/** Tangente a la curva en w: una recta que toca la curva en ese punto con su misma inclinación. `px` = media longitud en píxeles. */
export function tangent(S: Frame, pl: Plot, w: number, o: { px?: number; minRun?: number; a?: number; lw?: number; tone?: Tone } = {}) {
  const { kx, ky } = kxy(pl), m = dL(w), px = o.px ?? clamp(pl.r.w * 0.14, 46, 96);
  const h = Math.max(o.minRun ?? 0, px / Math.hypot(kx, m * ky));
  pl.line(w - h, L(w) - m * h, w + h, L(w) + m * h, o.tone ?? 'err', o.lw ?? 2.5, undefined, o.a ?? 1);
}

/** Escalón sobre la tangente: un paso de `run` a la derecha y lo que sube o baja. */
export function stepOnTangent(S: Frame, pl: Plot, w: number, a: number, aV = a, run = 1) {
  if (a < 0.01) return;
  const { d, pal: p } = S, k = kk(S), m = dL(w), y0 = L(w), er = tone(S, 'err'), wt = tone(S, 'w');
  const x0 = pl.X(w), x1 = pl.X(w + run), Y0 = pl.Y(y0), Y1 = pl.Y(y0 + m * run);
  d.withAlpha(a, () => {
    d.line(x0, Y0, x1, Y0, wt.c, 2.5);
    d.text(`+${run}`, (x0 + x1) / 2, m < 0 ? Y0 - 6 * k : Y0 + 6 * k, { size: fz(S, 13), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: m < 0 ? 'bottom' : 'top', halo: p.stage });
  });
  if (aV > 0.01 && Math.abs(m) > 1e-6) d.withAlpha(aV, () => {
    d.arrow(x1, Y0, x1, lerp(Y0, Y1, aV), er.c, 2.5, 9 * k);
    d.text(sg(S, m * run, 0), x1 + 7 * k, (Y0 + Y1) / 2, { size: fz(S, 13), weight: 800, font: 'mono', color: er.ink, base: 'middle', halo: p.stage });
  });
}

/**
 * Lupa: amplía la curva alrededor de w para ver un movimiento de una décima. De cerca, el pedazo de curva parece recto.
 * `aStep` muestra el escalón (avance y cambio del error); `aTan`, la recta que coincide con ese pedazo (la tangente).
 */
export function lupa(S: Frame, pl: Plot, w: number, dw: number, a: number, aStep: number, aTan = 0) {
  if (a < 0.01) return;
  const { d, pal: p } = S, k = kk(S), r = pl.r, { kx, ky } = kxy(pl);
  const rad = Math.min(r.h * 0.27, r.w * 0.2, 82 * k);
  const cx = Math.max(pl.X(w) + rad + 26 * k, pl.X(2.5)), cy = Math.max(pl.Y(10.4), r.y + rad + 4 * k);
  // escala: el avance de una décima ocupa poco más de la mitad del radio; se conserva la inclinación visible de la gráfica
  const sx = (0.55 * rad) / dw, sy = sx * (ky / kx), wc = w + dw / 2, lc = (L(w) + L(w + dw)) / 2;
  const X = (v: number) => cx + (v - wc) * sx, Y = (v: number) => cy - (v - lc) * sy;
  const bx = pl.X(w), by = pl.Y(L(w)), ang = Math.atan2(by - cy, bx - cx);
  d.withAlpha(a, () => {
    // aro alrededor del punto y línea hacia la lupa
    d.circle(bx, by, 13 * k, { stroke: p.ink2, lw: 1.5 });
    d.line(bx - Math.cos(ang) * 13 * k, by - Math.sin(ang) * 13 * k, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, p.ink2, 1.5);
    d.circle(cx, cy, rad, { fill: p.stage, stroke: p.lineStrong, lw: 2.5 });
    S.ctx.save(); S.ctx.beginPath(); S.ctx.arc(cx, cy, rad - 1, 0, Math.PI * 2); S.ctx.clip();
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) { const v = wc + ((i / 40) * 2 - 1) * (rad / sx); pts.push([X(v), Y(L(v))]); }
    d.polyline(pts, p.ink, 3);
    const x0 = X(w), y0 = Y(L(w)), x1 = X(w + dw), y1 = Y(L(w + dw));
    if (aTan > 0.01) { const m = -dL(w) * (sy / sx), t = rad * 1.2; d.line(x0 - t, y0 - m * t, x0 + t, y0 + m * t, tone(S, 'err').c, 2.5, [7, 5], aTan); }
    S.ctx.restore();
    const wt = tone(S, 'w'), er = tone(S, 'err');
    if (aStep > 0.01) d.withAlpha(aStep, () => {
      d.line(x0, y0, x1, y0, wt.c, 2.5);
      d.arrow(x1, y0, x1, y1, er.c, 2.5, 8 * k);
      d.text(`+${S.n(dw, 1)}`, (x0 + x1) / 2, y0 - 6 * k, { size: fz(S, 12), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'bottom', halo: p.stage });
      d.text(sn(S, L(w + dw) - L(w), 3), x1 + 6 * k, (y0 + y1) / 2, { size: fz(S, 12), weight: 800, font: 'mono', color: er.ink, base: 'middle', halo: p.stage });
      ball(S, x1, y1, 1, true);
    });
    ball(S, x0, y0);
    d.text(S.l('lupa', 'zoom'), cx, cy + rad + 5 * k, { size: fz(S, 12), weight: 700, color: p.mute, align: 'center', base: 'top' });
  });
}

/** Niebla: tapa la gráfica salvo una ventana alrededor del peso actual (tramado de 8 bits). */
export function fog(S: Frame, pl: Plot, x: number, f: number, rad: number) {
  if (f < 0.01) return;
  // columnas en píxeles enteros y solapadas 1 px: sin rendijas por donde se asome la curva
  const r = pl.r, col = S.pal.stage, step = 4, x0 = Math.ceil(r.x + 2), x1 = Math.floor(r.x + r.w), y0 = Math.floor(r.y), h = Math.ceil(r.h - 1);
  for (let px = x0; px < x1; px += step) {
    const dist = Math.abs(px + step / 2 - x), a = f * smooth((dist - rad) / (rad * 0.7));
    if (a > 0.01) S.d.dither(px, y0, Math.min(step + 1, x1 - px), h, col, a, 2);
  }
}

/** Historial del error: un punto por paso. Devuelve la altura usada. */
export function hist(S: Frame, x: number, y: number, w: number, vals: number[], o: { n: number; max: number; title: string; a?: number; h?: number }) {
  const { d, pal: p } = S, k = kk(S), h = o.h ?? 54 * k, er = tone(S, 'err');
  d.withAlpha(o.a ?? 1, () => {
    d.text(o.title, x, y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
    const top = y + 18 * k, bx = x + 2, bw = w - 8 * k, bh = h - 22 * k;
    d.line(bx, top + bh, bx + bw, top + bh, p.line, 1);
    d.line(bx, top, bx, top + bh, p.line, 1);
    const X = (i: number) => bx + (i / Math.max(1, o.n)) * bw, Y = (v: number) => top + bh - clamp(v / o.max) * bh;
    const pts: [number, number][] = vals.map((v, i) => [X(i), Y(v)]);
    d.clip(bx - 4, top - 4, bw + 8, bh + 8, () => {
      d.polyline(pts, er.c, 2);
      pts.forEach(([px, py]) => d.circle(px, py, 2.6 * k, { fill: er.c }));
    });
  });
  return h;
}

/** Rótulo con fondo para el lienzo, legible sobre líneas. */
export function label(S: Frame, text: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; size?: number; mono?: boolean } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  return S.d.tag(text, x, y, { color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, size: o.size ?? fz(S, 12), font: o.mono ? 'mono' : 'ui', weight: 700 });
}
