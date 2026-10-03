// Ayudas de dibujo propias de la lección (el kit no trae ejes con tamaño mínimo garantizado ni «chips» de calculadora).
// Todo texto respeta ≥ 12 px efectivos (FS) y los colores salen de tone()/S.pal (nunca hex).
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { Plot } from '../../../../../theme/kit';

/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);

/** Dibuja texto que se encoge hasta caber en `w` (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: string } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo });
}

/** Tarjeta de calculadora: rótulo arriba, valor abajo. `assume` = borde punteado (supuesto ilustrativo). */
export function chip(S: Frame, r: Rect, label: string, value: string, t: Tone, o: { assume?: boolean; a?: number; hot?: number; vsize?: number } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, t), hot = o.hot ?? 0;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.07 + 0.3 * hot), stroke: c.c, lw: hot > 0.3 ? 2.2 : 1.4, r: 3, dash: o.assume ? [5, 3] : undefined });
    fitText(S, label, r.x + r.w / 2, r.y + 4 * u, r.w - 8 * u, 12, { weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, value, r.x + r.w / 2, r.y + r.h - 5 * u, r.w - 8 * u, o.vsize ?? 16, { weight: 700, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
  });
}

/** Operador entre tarjetas (×, ÷, =). */
export function op(S: Frame, x: number, y: number, ch: string, a = 1) {
  S.d.text(ch, x, y, { size: FS(S, 17), weight: 700, font: 'mono', color: S.pal.mute, align: 'center', base: 'middle', a });
}

/** Exponente tipográfico: 10 elevado a n. */
export const pow10 = (n: number) => '10' + sup(n);
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');

/** Ejes de una gráfica con texto ≥ 12 px. Usa las coordenadas del Plot del kit (X, Y, r). */
export function axes(S: Frame, pl: Plot, o: { xTicks: number[]; yTicks: number[]; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel?: string; yLabel?: string; grid?: boolean; xStep?: number; a?: number }) {
  const { d, pal: p } = S, u = S.u, r = pl.r, a = o.a ?? 1;
  d.withAlpha(a, () => {
    if (o.grid) {
      o.xTicks.forEach((v) => d.line(pl.X(v), r.y, pl.X(v), r.y + r.h, p.line, 1));
      o.yTicks.forEach((v) => d.line(r.x, pl.Y(v), r.x + r.w, pl.Y(v), p.line, 1));
    }
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    const ts = FS(S, 11.5);
    o.xTicks.forEach((v) => { const x = pl.X(v); if (x < r.x - 1 || x > r.x + r.w + 1) return; d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(o.xFmt(v), x, r.y + r.h + 7 * u, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    o.yTicks.forEach((v) => { const y = pl.Y(v); if (y < r.y - 1 || y > r.y + r.h + 1) return; d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5); d.text(o.yFmt(v), r.x - 7 * u, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    if (o.xLabel) d.text(o.xLabel, r.x + r.w, r.y + r.h + 7 * u + ts * u + 5 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    if (o.yLabel) d.text(o.yLabel, pl.outer.x + 2, r.y - 4 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
  });
}

/** Etiqueta con halo del color del escenario (legible sobre líneas). */
export function tagText(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; base?: CanvasTextBaseline; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; w?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 700, color: o.t ? c.ink : S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, halo: S.pal.stage, haloW: 4, a: o.a, w: o.w });
}

export const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
export const log10 = Math.log10;
