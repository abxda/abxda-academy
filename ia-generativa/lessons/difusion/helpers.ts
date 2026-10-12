// Ayudas locales de la lección: tiempo por fracciones del segmento, tamaños con piso legible, imágenes de 8×8 como píxeles
// (tinta, ruido centrado en gris), etiquetas que se achican si no caben, puntos en lote y una barra «imagen / ruido».
// Todo usa tone()/S.pal (tema claro y oscuro); nada de colores literales.
import { alpha, clamp, tone, type Frame, type Plot, type Tone } from '../../../../../theme/kit';

/** Duración (s) del segmento k. Las voces y los idiomas duran distinto: se anima por fracciones del segmento. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Tamaño de texto con piso de 12 px efectivos. */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
/** Escala de espaciados que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);
/** Opacidad de algo que vive desde el segmento a hasta el b (entra y sale con desvanecido). */
export const live = (S: Frame, a: string, b?: string, fin = 0.1, fout = 0.1) => fr(S, a, 0, fin) * (b ? 1 - fr(S, b, 0, fout) : 1);
export const pct = (S: Frame, f: number) => `${S.n(f * 100, 0)}${S.lang === 'es' ? ' %' : '%'}`;

/** Tamaño de letra (sin multiplicar por S.u) que hace caber `text` en `maxW`, con piso legible. */
export function fit(S: Frame, text: string, maxW: number, size: number, weight = 700, font: 'ui' | 'mono' = 'ui') {
  let s = fz(S, size);
  const min = 12 / S.u;
  while (s > min && S.d.measure(text, { size: s, weight, font }) > maxW) s -= 0.5;
  return Math.max(min, s);
}
/** Rótulo centrado que se achica para caber; si aun así no cabe, se parte en líneas. */
export function label(S: Frame, text: string, x: number, y: number, maxW: number, o: { size?: number; weight?: number; color?: string; a?: number; base?: CanvasTextBaseline; align?: CanvasTextAlign; font?: 'ui' | 'mono' } = {}) {
  const size = fit(S, text, maxW, o.size ?? 13, o.weight ?? 700, o.font ?? 'ui');
  const tooWide = S.d.measure(text, { size, weight: o.weight ?? 700, font: o.font }) > maxW;
  // si se parte en líneas, las de más crecen hacia arriba (base «bottom») o hacia los dos lados (base «middle»)
  const extra = tooWide ? (S.d.wrap(text, maxW, { size, weight: o.weight ?? 700, font: o.font }).length - 1) * size * S.u * 1.2 : 0;
  const yy = o.base === 'bottom' ? y - extra : o.base === 'middle' ? y - extra / 2 : y;
  return S.d.text(text, x, yy, { size, weight: o.weight ?? 700, color: o.color ?? S.pal.ink2, align: o.align ?? 'center', base: o.base ?? 'top', a: o.a, font: o.font, w: tooWide ? maxW : undefined, lh: 1.2 });
}

// ── imágenes de 8×8 ───────────────────────────────────────────────────────────
const lutCache = new Map<string, string[]>();
function lut(color: string): string[] {
  let l = lutCache.get(color);
  if (!l) { l = Array.from({ length: 33 }, (_, i) => alpha(color, i / 32)); lutCache.set(color, l); if (lutCache.size > 24) lutCache.delete(lutCache.keys().next().value as string); }
  return l;
}
export interface PixOpts { a?: number; kind?: 'real' | 'model' | 'plain'; hl?: Tone; noFrame?: boolean }
/** Imagen de 8×8 con tinta 0..1. Marco continuo = dato real; punteado = lo hizo un modelo. `cell` se redondea a entero para que se vea nítida. */
export function pix(S: Frame, x: number, y: number, v: ArrayLike<number>, cell: number, o: PixOpts = {}) {
  const ctx = S.ctx, p = S.pal, c = Math.max(1, Math.floor(cell)), w = 8 * c, col = lut(p.ink);
  x = Math.round(x); y = Math.round(y);
  ctx.save();
  if (o.a !== undefined) ctx.globalAlpha *= clamp(o.a);
  ctx.fillStyle = p.surface; ctx.fillRect(x, y, w, w);
  for (let r = 0; r < 8; r++) for (let q = 0; q < 8; q++) {
    const k = Math.round(clamp(v[r * 8 + q]) * 32);
    if (k > 0) { ctx.fillStyle = col[k]; ctx.fillRect(x + q * c, y + r * c, c, c); }
  }
  ctx.restore();
  if (!o.noFrame) S.d.rect(x - 0.5, y - 0.5, w + 1, w + 1, { stroke: o.hl ? tone(S, o.hl).c : p.lineStrong, lw: o.hl ? 2.5 : 1.2, dash: o.kind === 'model' ? [3, 2.5] : undefined, a: o.a });
  return w;
}
/** Ruido (números alrededor de cero) sobre gris medio: más tinta = positivo, menos tinta = negativo. `gain` atenúa («un poco de ruido»). */
export function noisePix(S: Frame, x: number, y: number, e: ArrayLike<number>, cell: number, o: PixOpts & { gain?: number } = {}) {
  const g = o.gain ?? 1, v = Float32Array.from({ length: 64 }, (_, i) => clamp(0.5 + 0.25 * g * e[i]));
  return pix(S, x, y, v, cell, o);
}
/** Lado entero de celda para que una imagen de 8×8 quepa en `size` px. */
export const cellFor = (size: number, max = 40) => Math.max(2, Math.min(max, Math.floor(size / 8)));

// ── barra «imagen / ruido» ───────────────────────────────────────────────────
/** Barra horizontal: parte izquierda = imagen (sólida), derecha = ruido (rayada). Rótulos con el porcentaje de cada parte. */
export function mixBar(S: Frame, x: number, y: number, w: number, share: number, o: { a?: number } = {}) {
  const { d, pal: p } = S, k = kk(S), h = 16 * k, xi = x + w * clamp(share), dat = tone(S, 'dat'), sz = fz(S, 12);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface2 });
    d.rect(x, y, xi - x, h, { fill: alpha(dat.c, 0.75) });
    // ruido: rayas diagonales (la forma acompaña al color)
    d.clip(xi, y, x + w - xi, h, () => { for (let sx = xi - h; sx < x + w; sx += 6 * k) d.line(sx, y + h, sx + h, y, p.ink2, 1.2); });
    d.rect(x, y, w, h, { stroke: p.lineStrong, lw: 1 });
    const ti = `${S.l('imagen', 'image')} ${pct(S, share)}`, tn = `${S.l('ruido', 'noise')} ${pct(S, 1 - share)}`;
    d.text(ti, x, y + h + 5 * k, { size: sz, weight: 700, color: dat.ink, base: 'top' });
    d.text(tn, x + w, y + h + 5 * k, { size: sz, weight: 700, color: p.ink2, base: 'top', align: 'right' });
  });
  return h + 5 * k + sz * S.u * 1.2;
}

// ── puntos en el plano ───────────────────────────────────────────────────────
/** Dibuja n puntos (x, y intercalados) en un solo trazo. `idx` limita a esos índices. */
export function dots(S: Frame, plot: Plot, xy: ArrayLike<number>, n: number, r: number, color: string, a = 1, idx?: ArrayLike<number>) {
  const ctx = S.ctx, R = plot.r, rr = r * S.u;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.fillStyle = color;
  ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
  ctx.beginPath();
  const m = idx ? idx.length : n;
  for (let j = 0; j < m; j++) { const i = idx ? idx[j] : j, px = plot.X(xy[2 * i]), py = plot.Y(xy[2 * i + 1]); ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, Math.PI * 2); }
  ctx.fill(); ctx.restore();
}
