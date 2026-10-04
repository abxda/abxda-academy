// Ayudas de dibujo propias de la lección (el kit no trae pictogramas ni garantiza tamaño mínimo de texto).
// Todo texto del lienzo respeta ≥ 12 px efectivos (FS) y los colores salen de tone()/S.pal (nunca hex).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño tipográfico (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);

export interface TOpts { size?: number; weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; w?: number; lh?: number; halo?: boolean; a?: number; t?: Tone }

/** Texto con tamaño mínimo garantizado. `t` pide el color de tinta de un tono. */
export function T(S: Frame, str: string, x: number, y: number, o: TOpts = {}) {
  const col = o.color ?? (o.t ? tone(S, o.t).ink : S.pal.ink);
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 600, font: o.font, color: col, align: o.align, base: o.base ?? 'top', w: o.w, lh: o.lh, halo: o.halo ? S.pal.stage : undefined, haloW: 4, a: o.a });
}

export function wrapLines(S: Frame, str: string, w: number, size = 13, weight = 600, font?: 'ui' | 'mono'): string[] {
  return S.d.wrap(str, w, { size: FS(S, size), weight, font });
}
export const lineH = (S: Frame, size = 13, lh = 1.3) => FS(S, size) * S.u * lh;

/** Texto que se escribe poco a poco (k de 0 a 1). Las líneas ya vienen partidas, así que el ajuste no salta. */
export function typed(S: Frame, lines: string[], x: number, y: number, k: number, o: TOpts = {}) {
  const total = lines.reduce((a, l) => a + l.length, 0);
  let left = Math.floor(clamp(k) * total);
  const lh = lineH(S, o.size ?? 13, o.lh ?? 1.3);
  lines.forEach((ln, i) => {
    const part = ln.slice(0, Math.max(0, Math.min(ln.length, left))); left -= ln.length;
    if (part) T(S, part, x, y + i * lh, { ...o, w: undefined, lh: undefined });
  });
  return lines.length * lh;
}

/** Pastilla de texto corta. */
export function pill(S: Frame, str: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; mono?: boolean; size?: number; weight?: number } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  return S.d.tag(str, x, y, { color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, size: FS(S, o.size ?? 12), font: o.mono ? 'mono' : 'ui', weight: o.weight });
}

/** Marco de un panel: borde fino del tono, relleno suave; `dash` para lo que es una petición o un supuesto. */
export function frame(S: Frame, r: Rect, o: { tone?: Tone; dash?: number[]; fill?: number; a?: number; lw?: number; r?: number } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  S.d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ? alpha(o.tone ? t.c : S.pal.ink, o.fill) : S.pal.surface, stroke: o.tone ? t.c : S.pal.lineStrong, lw: o.lw ?? 1.5, r: o.r ?? 3, dash: o.dash, a: o.a });
}

// ── pictogramas ───────────────────────────────────────────────────────────
export type GlyphKind = 'check' | 'cross' | 'person' | 'lock' | 'doc' | 'gear' | 'play' | 'warn';
/** Pictograma centrado en (x, y) de tamaño s (px). Forma y color acompañan a la etiqueta; nunca son el único canal. */
export function glyph(S: Frame, kind: GlyphKind, x: number, y: number, s: number, color: string, a = 1) {
  const d = S.d, lw = Math.max(2, s * 0.16);
  d.withAlpha(a, () => {
    if (kind === 'check') d.polyline([[x - 0.42 * s, y + 0.02 * s], [x - 0.12 * s, y + 0.34 * s], [x + 0.46 * s, y - 0.34 * s]], color, lw);
    else if (kind === 'cross') { d.line(x - 0.36 * s, y - 0.36 * s, x + 0.36 * s, y + 0.36 * s, color, lw); d.line(x - 0.36 * s, y + 0.36 * s, x + 0.36 * s, y - 0.36 * s, color, lw); }
    else if (kind === 'person') { d.circle(x, y - 0.3 * s, 0.22 * s, { fill: color }); d.polygon([[x - 0.42 * s, y + 0.5 * s], [x - 0.34 * s, y + 0.06 * s], [x + 0.34 * s, y + 0.06 * s], [x + 0.42 * s, y + 0.5 * s]], { fill: color }); }
    else if (kind === 'lock') { d.rect(x - 0.34 * s, y - 0.04 * s, 0.68 * s, 0.5 * s, { fill: color }); d.polyline([[x - 0.2 * s, y - 0.04 * s], [x - 0.2 * s, y - 0.3 * s], [x - 0.1 * s, y - 0.44 * s], [x + 0.1 * s, y - 0.44 * s], [x + 0.2 * s, y - 0.3 * s], [x + 0.2 * s, y - 0.04 * s]], color, lw * 0.8); }
    else if (kind === 'doc') { d.rect(x - 0.3 * s, y - 0.42 * s, 0.6 * s, 0.84 * s, { stroke: color, lw: lw * 0.8, fill: S.pal.surface }); [-0.2, 0, 0.2].forEach((k) => d.line(x - 0.16 * s, y + k * s, x + 0.16 * s, y + k * s, color, lw * 0.6)); }
    else if (kind === 'gear') { d.circle(x, y, 0.3 * s, { stroke: color, lw }); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; d.line(x + Math.cos(a) * 0.3 * s, y + Math.sin(a) * 0.3 * s, x + Math.cos(a) * 0.5 * s, y + Math.sin(a) * 0.5 * s, color, lw); } }
    else if (kind === 'play') d.polygon([[x - 0.3 * s, y - 0.42 * s], [x + 0.42 * s, y], [x - 0.3 * s, y + 0.42 * s]], { fill: color });
    else if (kind === 'warn') { d.polygon([[x, y - 0.46 * s], [x + 0.5 * s, y + 0.4 * s], [x - 0.5 * s, y + 0.4 * s]], { stroke: color, lw: lw * 0.8 }); d.line(x, y - 0.14 * s, x, y + 0.1 * s, color, lw * 0.8); d.circle(x, y + 0.26 * s, lw * 0.5, { fill: color }); }
  });
}

export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const nfmt = (S: Frame, x: number, digits = 0) => S.n(x, digits);

/** Número entero con separador de miles del idioma (para tokens). */
export const big = (S: Frame, x: number) => Math.round(x).toLocaleString(S.lang === 'es' ? 'es-MX' : 'en-US');
/** Porcentaje a partir de una fracción. */
export const pct = (S: Frame, f: number, digits = 0) => `${S.n(f * 100, digits)} %`;
