// Ayudas de dibujo propias de la lección «Alucinaciones y límites».
// Todo texto respeta ≥ 12 px efectivos (FS) y los colores salen de tone()/S.pal (nunca hex). El kit no trae sellos, burbujas de chat
// ni barras de probabilidad con tamaño mínimo garantizado, así que se implementan aquí.
import { alpha, clamp, ease, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);

export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

/** Número con el formato del texto de la lección: 1 234,5 (es: coma decimal y espacio de miles) / 1,234.5 (en). */
export const num = (S: Frame, v: number, digits = 0) => {
  const s = v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return S.lang === 'es' ? s.replace(/,/g, '\u00a0').replace('.', ',') : s;
};
/** Porcentaje con el formato del idioma: 73,6 % (es) / 73.6% (en). */
export const pct = (S: Frame, v: number, digits = 0) => `${num(S, v * 100, digits)}${S.lang === 'es' ? '\u00a0%' : '%'}`;

/** Porcentaje de una barra: los valores minúsculos se muestran como «< 0,1 %». */
export const pctP = (S: Frame, v: number) => (v > 0 && v < 0.001 ? `<\u00a0${num(S, 0.1, 1)}${S.lang === 'es' ? '\u00a0%' : '%'}` : pct(S, v, v < 0.1 ? 1 : 0));

/** Texto que se encoge hasta caber en `w` (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: string; a?: number } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo, a: o.a });
}

/** Párrafo con ajuste de línea. Devuelve el alto usado (px). */
export function para(S: Frame, str: string, x: number, y: number, w: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; font?: 'ui' | 'mono'; lh?: number; halo?: string; a?: number; italic?: boolean } = {}) {
  const size = FS(S, o.size ?? 14);
  const r = S.d.text(str, o.align === 'center' ? x + w / 2 : x, y, { size, weight: o.weight ?? 600, color: o.color ?? S.pal.ink, w, align: o.align, base: 'top', font: o.font, lh: o.lh ?? 1.3, halo: o.halo, a: o.a, italic: o.italic });
  return r.h;
}

/** Cuántas líneas ocupa un texto (para reservar espacio). */
export function lines(S: Frame, str: string, w: number, size = 14, weight = 600, font?: 'ui' | 'mono') {
  return S.d.wrap(str, w, { size: FS(S, size), weight, font }).length;
}

/** Etiqueta con halo del color del escenario (legible sobre líneas). */
export function tagText(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; base?: CanvasTextBaseline; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; w?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 700, color: o.t ? c.ink : S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, halo: S.pal.stage, haloW: 4, a: o.a, w: o.w });
}

/** Tarjeta: rectángulo con borde del tono; `hot` la resalta; `dash` la marca como supuesto o ilustrativo. */
export function card(S: Frame, r: Rect, t: Tone, o: { a?: number; hot?: number; dash?: boolean; fill?: number } = {}) {
  const c = tone(S, t), hot = o.hot ?? 0;
  S.d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, (o.fill ?? 0.06) + 0.14 * hot), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: hot > 0.4 ? 2.2 : 1.4, r: 3, dash: o.dash ? [5, 3] : undefined, a: o.a });
}

/** Sello rotado: «NO EXISTE», «INVENTADA»… La forma (borde doble) acompaña al color. */
export function stamp(S: Frame, str: string, cx: number, cy: number, t: Tone, o: { angle?: number; a?: number; size?: number; pop?: number } = {}) {
  const { ctx } = S, c = tone(S, t), size = FS(S, o.size ?? 14), pop = o.pop ?? 1;
  const w = S.d.measure(str, { size, weight: 800 }) + 18 * S.u, h = size * S.u * 1.2 + 10 * S.u;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(o.angle ?? -0.12); ctx.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);
  S.d.withAlpha((o.a ?? 1) * clamp(pop * 1.4), () => {
    S.d.rect(-w / 2, -h / 2, w, h, { fill: alpha(S.pal.stage, 0.86), stroke: c.c, lw: 2.4, r: 2 });
    S.d.rect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, { stroke: c.c, lw: 1, r: 1 });
    S.d.text(str, 0, 0, { size, weight: 800, color: c.ink, align: 'center', base: 'middle' });
  });
  ctx.restore();
}

/** Marca de verificación (✓) o de error (✗) dibujada con trazos: no depende de la tipografía ni del color. */
export function mark(S: Frame, x: number, y: number, kind: 'ok' | 'no' | 'dash', r: number, o: { a?: number; lw?: number } = {}) {
  const t = tone(S, kind === 'ok' ? 'dat' : kind === 'no' ? 'err' : 'mute'), lw = o.lw ?? 2.6, d = S.d;
  d.withAlpha(o.a ?? 1, () => {
    if (kind === 'ok') d.polyline([[x - r * 0.7, y + r * 0.05], [x - r * 0.2, y + r * 0.55], [x + r * 0.8, y - r * 0.6]], t.c, lw);
    else if (kind === 'no') { d.line(x - r * 0.65, y - r * 0.65, x + r * 0.65, y + r * 0.65, t.c, lw); d.line(x - r * 0.65, y + r * 0.65, x + r * 0.65, y - r * 0.65, t.c, lw); }
    else d.line(x - r * 0.6, y, x + r * 0.6, y, t.c, lw);
  });
}

/** Burbuja de chat. `who`: 'user' alinea a la derecha, 'bot' a la izquierda. Devuelve el rectángulo. */
export function bubble(S: Frame, str: string, x: number, y: number, w: number, who: 'user' | 'bot', o: { a?: number; tag?: string; size?: number; mono?: boolean; t?: Tone } = {}): Rect {
  const { d, pal: p } = S, u = S.u, size = FS(S, o.size ?? 14), pad = 9 * u, tx = o.t ?? (who === 'user' ? 'sig' : 'lat');
  const c = tone(S, tx), ls = d.wrap(str, w - pad * 2, { size, weight: 600, font: o.mono ? 'mono' : 'ui' });
  const h = ls.length * size * u * 1.3 + pad * 2 + (o.tag ? 14 * u : 0);
  const rx = who === 'user' ? x + 0 : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(rx, y, w, h, { fill: alpha(c.c, 0.1), stroke: c.c, lw: 1.5, r: 6 });
    if (o.tag) d.text(o.tag, rx + pad, y + pad * 0.7, { size: FS(S, 11), weight: 700, color: c.ink, base: 'top' });
    d.text(str, rx + pad, y + pad + (o.tag ? 14 * u : 0), { size, weight: 600, color: p.ink, w: w - pad * 2, base: 'top', font: o.mono ? 'mono' : 'ui' });
  });
  return { x: rx, y, w, h };
}

/**
 * Barras horizontales de probabilidad con tamaño mínimo de texto. Cada fila: etiqueta, barra sobre un eje 0–max y valor.
 * `hot`: resalta; `ghost`: barra rayada (masa repartida, «otras»); `a`: aparición por fila.
 */
export interface BarRow { label: string; value: number; t?: Tone; hot?: boolean; ghost?: boolean; a?: number; sub?: string }
export function probBars(S: Frame, r: Rect, rows: BarRow[], o: { max?: number; labelW?: number; fmt?: (v: number) => string; rowH?: number; size?: number } = {}) {
  const { d, pal: p } = S, u = S.u, n = rows.length, rh = o.rowH ?? Math.min(34 * u, r.h / Math.max(1, n)), max = o.max ?? 1;
  const size = o.size ?? 13, lw = o.labelW ?? Math.min(130 * u, r.w * 0.34);
  const vw = Math.max(46 * u, d.measure('< 0,1 %', { size: FS(S, 12), weight: 600, font: 'mono' }) + 6 * u);
  const bx = r.x + lw, bw = r.w - lw - vw;
  rows.forEach((row, i) => {
    const a = row.a ?? 1; if (a <= 0.003) return;
    const y = r.y + i * rh, c = tone(S, row.t ?? 'lat'), h = rh * 0.66, by = y + (rh - h) / 2, len = Math.max(row.value > 0 ? 2 : 0, (bw * clamp(row.value / max)) * smooth(a));
    d.withAlpha(clamp(a * 1.5), () => {
      {
        const lwid = lw - 10 * u, fsz = FS(S, size), opt = { weight: row.hot ? 800 : 600 };
        if (d.measure(row.label, { size: Math.max(FS(S, 12), 12.2 / u), ...opt }) > lwid && rh > 30 * u) {
          const ls = d.wrap(row.label, lwid, { size: FS(S, 12), ...opt }), lhh = FS(S, 12) * u * 1.15;
          ls.slice(0, 2).forEach((ln, k) => d.text(ln, bx - 8 * u, y + rh / 2 + (k - (Math.min(ls.length, 2) - 1) / 2) * lhh, { size: FS(S, 12), weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle' }));
        } else fitText(S, row.label, bx - 8 * u, y + rh / 2, lwid, Math.min(size, fsz), { weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle' });
      }
      d.rect(bx, by, bw, h, { fill: p.surface2 });
      if (row.ghost) {
        d.dither(bx, by, len, h, c.c, 0.4, 2);
        d.rect(bx, by, len, h, { stroke: alpha(c.c, 0.7), lw: 1.2 });
      } else d.rect(bx, by, len, h, { fill: row.hot ? c.c : alpha(c.c, 0.55) });
      d.text((o.fmt ?? ((v) => pctP(S, v)))(row.value), r.x + r.w, y + rh / 2, { size: FS(S, 12), font: 'mono', weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle' });
    });
  });
}

/** Ejes con texto ≥ 12 px sobre un Plot del kit. */
import type { Plot } from '../../../../../theme/kit';
export function axes(S: Frame, pl: Plot, o: { xTicks: number[]; yTicks: number[]; xFmt: (v: number) => string; yFmt: (v: number) => string; xLabel?: string; yLabel?: string; grid?: boolean; a?: number }) {
  const { d, pal: p } = S, u = S.u, r = pl.r, a = o.a ?? 1;
  d.withAlpha(a, () => {
    if (o.grid) {
      o.xTicks.forEach((v) => d.line(pl.X(v), r.y, pl.X(v), r.y + r.h, p.line, 1));
      o.yTicks.forEach((v) => d.line(r.x, pl.Y(v), r.x + r.w, pl.Y(v), p.line, 1));
    }
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    const ts = FS(S, 11.5);
    o.xTicks.forEach((v) => { const x = pl.X(v); d.line(x, r.y + r.h, x, r.y + r.h + 4 * u, p.lineStrong, 1.5); d.text(o.xFmt(v), x, r.y + r.h + 7 * u, { size: ts, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    o.yTicks.forEach((v) => { const y = pl.Y(v); d.line(r.x - 4 * u, y, r.x, y, p.lineStrong, 1.5); d.text(o.yFmt(v), r.x - 7 * u, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    if (o.xLabel) d.text(o.xLabel, r.x + r.w, r.y + r.h + 7 * u + ts * u + 5 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    if (o.yLabel) d.text(o.yLabel, pl.outer.x + 2, r.y - 11 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
  });
}

/** Lectura numérica: rótulo y valor, con tamaño mínimo de texto. */
export function stat(S: Frame, x: number, y: number, label: string, value: string, t: Tone = 'ink', o: { size?: number; align?: CanvasTextAlign; w?: number; a?: number } = {}) {
  const c = tone(S, t), align = o.align;
  S.d.withAlpha(o.a ?? 1, () => {
    fitText(S, label, x, y, o.w ?? 400, 12, { weight: 700, color: S.pal.mute, align, base: 'top' });
    fitText(S, value, x, y + FS(S, 12) * S.u * 1.25, o.w ?? 400, o.size ?? 22, { weight: 700, font: 'mono', color: t === 'ink' ? S.pal.ink : c.ink, align, base: 'top' });
  });
}

/** Pie de figura con la fuente de lo que se muestra (abajo a la izquierda; ocupa varias líneas si hace falta, creciendo hacia arriba). */
export function source(S: Frame, str: string, a = 1) {
  const size = FS(S, 11.5), w = S.W - 28 * S.u, n = S.d.wrap(str, w, { size, weight: 600 }).length, lh = 1.3 * size * S.u;
  S.d.text(str, 14 * S.u, S.H - 3 * S.u - (n - 1) * lh, { size, weight: 600, color: S.pal.mute, base: 'bottom', a: 0.92 * a, w, lh: 1.3 });
}

/** Alto (px) que ocupa el pie de figura: para reservar espacio abajo. */
export function sourceH(S: Frame, str: string) {
  const size = FS(S, 11.5);
  return (S.d.wrap(str, S.W - 28 * S.u, { size, weight: 600 }).length * 1.3 * size + 6) * S.u;
}

/** Aparición de un acto entre su primer segmento y el primero del siguiente (fundido corto). */
export function fadeFor(S: Frame, from: string, to?: string, dur = 0.5): number {
  if (!S.on(from)) return 0;
  const a = S.at(from, 0, dur, 'out'), b = to ? S.at(to, 0, dur * 0.8, 'out') : 0;
  return a * (1 - b);
}

/** Dibuja `fn` con la opacidad dada, solo si es visible. */
export const show = (S: Frame, a: number, fn: () => void) => { if (a > 0.004) S.d.withAlpha(a, fn); };

/** Verdadero cuando `cond` se ha cumplido sin interrupción durante `secs` segundos: el gate se completa al detenerse en la respuesta, no al pasar de largo. */
export function holds(S: Frame, key: string, cond: boolean, secs = 0.5): boolean {
  const st = (S.st.hold ??= {} as Record<string, number>);
  st[key] = cond ? (st[key] ?? 0) + S.dt : 0;
  return st[key] >= secs;
}

/** Área útil con márgenes. */
export const area = (S: Frame, m = 14): Rect => ({ x: m * S.u, y: m * S.u, w: S.W - 2 * m * S.u, h: S.H - 2 * m * S.u });

/** Progreso 0→1 entre las fracciones a y b de la duración del segmento `id` (sincroniza una imagen con la frase de la voz, sea cual sea el idioma). */
export function fr(S: Frame, id: string, a: number, b: number, e: 'out' | 'io' | 'lin' = 'out'): number {
  if (!S.on(id)) return 0;
  const s = S.start(id), L = Math.max(1, S.end(id) - s);
  return ease[e](clamp((S.t - s - a * L) / Math.max(1e-6, (b - a) * L)));
}
