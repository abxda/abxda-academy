// Ayudas de dibujo propias de la lección «Preentrenamiento». El kit no garantiza un tamaño mínimo de texto ni trae fichas
// con medición ni rótulos de procedencia; aquí se implementan en local. Todo texto respeta ≥ 12 px efectivos (FS) y los
// colores salen de tone()/S.pal/alpha() (nunca hex).
import { alpha, tone, clamp, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
/** ¿Escenario muy bajo (teléfono en horizontal)? */
export const isCompact = (S: Frame) => S.H < 360;

/** Rectángulo útil con márgenes que se achican en pantallas pequeñas. */
export function area(S: Frame, top = 0, bottom = 0): Rect {
  const m = (S.W < 480 ? 12 : S.W < 700 ? 16 : 22) * S.u;
  return { x: m, y: m * 0.8 + top, w: S.W - 2 * m, h: S.H - m * 1.6 - top - bottom };
}

/** Reparto principal + lateral (escritorio) o principal + inferior (teléfono vertical). */
export function split2(S: Frame, r: Rect, ratio: number, gap: number): [Rect, Rect] {
  if (S.portrait) { const h1 = (r.h - gap) * ratio; return [{ x: r.x, y: r.y, w: r.w, h: h1 }, { x: r.x, y: r.y + h1 + gap, w: r.w, h: r.h - h1 - gap }]; }
  const w1 = (r.w - gap) * ratio; return [{ x: r.x, y: r.y, w: w1, h: r.h }, { x: r.x + w1 + gap, y: r.y, w: r.w - w1 - gap, h: r.h }];
}

const loc = (S: Frame) => (S.lang === 'es' ? 'es-MX' : 'en-US');
export const nf = (S: Frame, x: number, d = 0) => x.toLocaleString(loc(S), { minimumFractionDigits: d, maximumFractionDigits: d });
/** Número con cifras significativas razonables y sin ceros finales. */
export function sig(S: Frame, x: number): string {
  const ax = Math.abs(x), d = ax >= 100 ? 0 : ax >= 10 ? 1 : 2;
  const s = nf(S, x, d), sep = S.lang === 'es' ? ',' : '.';
  return d > 0 && s.includes(sep) ? s.replace(new RegExp(`\\${sep}?0+$`), '') : s;
}
/** Conteos grandes: 300 mil M / 300B; 1,4 billones / 1.4T. */
export function count(S: Frame, x: number): string {
  if (x < 1e6) return nf(S, Math.round(x), 0);
  if (S.lang === 'es') {
    if (x < 1e9) return `${sig(S, x / 1e6)} M`;
    if (x < 1e12) return `${sig(S, x / 1e9)} mil M`;
    const v = sig(S, x / 1e12); return `${v} ${v === '1' ? 'billón' : 'billones'}`;
  }
  if (x < 1e9) return `${sig(S, x / 1e6)}M`;
  if (x < 1e12) return `${sig(S, x / 1e9)}B`;
  return `${sig(S, x / 1e12)}T`;
}

/** Dibuja texto que se encoge hasta caber en `w` (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: string; a?: number } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo, a: o.a });
}

/** Texto con ajuste de línea; devuelve la altura usada. */
export function para(S: Frame, str: string, x: number, y: number, w: number, o: { size?: number; weight?: number; color?: string; font?: 'ui' | 'mono'; lh?: number; a?: number; align?: CanvasTextAlign; halo?: string } = {}) {
  const sz = FS(S, o.size ?? 13);
  return S.d.text(str, x, y, { size: sz, weight: o.weight ?? 600, color: o.color ?? S.pal.ink, font: o.font, w, lh: o.lh ?? 1.3, base: 'top', a: o.a, align: o.align, halo: o.halo });
}

/** Número de líneas que ocuparía un texto con ajuste (para reservar altura). */
export function lineCount(S: Frame, str: string, w: number, size = 13, weight = 600, font?: 'ui' | 'mono') {
  return S.d.wrap(str, w, { size: FS(S, size), weight, font }).length;
}

/** Texto con halo del color del escenario (legible sobre líneas y rellenos). */
export function tagText(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; base?: CanvasTextBaseline; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; w?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 700, color: o.t ? c.ink : S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, halo: S.pal.stage, haloW: 4, a: o.a, w: o.w });
}

/** Ficha con borde del tono y relleno suave. Devuelve su rectángulo. */
export function chip(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; fill?: number; dash?: boolean; padX?: number; h?: number } = {}): Rect {
  const { d, pal: p } = S, c = tone(S, o.t ?? 'ink'), size = FS(S, o.size ?? 12.5), px = (o.padX ?? 7) * S.u;
  const tw = d.measure(str, { size, weight: o.weight ?? 700, font: o.font }), w = tw + px * 2, h = o.h ?? (size * S.u + 9 * S.u);
  const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: alpha(c.c, o.fill ?? 0.14), stroke: o.t ? c.c : p.lineStrong, lw: 1.3, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y, { size, weight: o.weight ?? 700, color: o.t ? c.ink : p.ink, align: 'center', base: 'middle', font: o.font });
  });
  return { x: x0, y: y - h / 2, w, h };
}

/** Rótulo de procedencia al pie del escenario («medición real», «ilustrativo»…). */
export function provenance(S: Frame, str: string, o: { t?: Tone; a?: number } = {}) {
  const c = tone(S, o.t ?? 'mute'), size = FS(S, 11.5), m = 12 * S.u;
  S.d.text(str, m, S.H - 4 * S.u, { size, weight: 700, color: o.t ? c.ink : S.pal.mute, base: 'bottom', a: o.a ?? 1, w: S.W - 2 * m, lh: 1.15 });
}

/** Barra horizontal con valor (0..1) y rótulos. */
export function hbar(S: Frame, r: Rect, v: number, t: Tone, o: { a?: number; dash?: boolean; track?: boolean } = {}) {
  const { d, pal: p } = S, c = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    if (o.track !== false) d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2 });
    d.rect(r.x, r.y, Math.max(0, r.w * clamp(v)), r.h, { fill: alpha(c.c, 0.78) });
    if (o.dash) d.rect(r.x, r.y, r.w, r.h, { stroke: c.c, lw: 1, dash: [3, 3] });
  });
}

/** Escala logarítmica de 1e6 a 1e12 para la posición horizontal de «tokens vistos». */
export const logPos = (tokens: number, lo = 6, hi = 11.6) => clamp((Math.log10(Math.max(tokens, 1)) - lo) / (hi - lo));

// ── fichas de tokens con ajuste de línea (el texto se mide y se reparte en renglones) ─────────────────────────────
export interface ChipPos { x: number; y: number; w: number; h: number; row: number }
export function layoutChips(S: Frame, pieces: string[], x: number, y: number, maxW: number, o: { size?: number; h?: number; gap?: number; pad?: number; rowGap?: number } = {}): { pos: ChipPos[]; h: number } {
  const d = S.d, u = S.u, size = FS(S, o.size ?? 13), h = (o.h ?? 24) * u, gap = (o.gap ?? 3) * u, pad = (o.pad ?? 5) * u, rg = (o.rowGap ?? 12) * u;
  const pos: ChipPos[] = []; let cx = x, row = 0;
  pieces.forEach((t) => {
    const lab = t.trim() || '↵';
    const w = d.measure(lab, { size, weight: 600, font: 'mono' }) + pad * 2;
    if (cx + w > x + maxW && cx > x) { cx = x; row++; }
    pos.push({ x: cx, y: y + row * (h + rg), w, h, row });
    cx += w + gap;
  });
  return { pos, h: (row + 1) * h + row * rg };
}
export const pieceLabel = (t: string) => t.replace(/\n/g, '↵').trim() || '↵';
