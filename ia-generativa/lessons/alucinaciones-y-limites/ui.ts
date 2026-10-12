// Ayudas de dibujo propias de la lección «Alucinaciones y límites».
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber; lo accesorio se omite.
// · Colores solo con tone()/S.pal (nunca literales). Papeles: lat = lo que calcula el modelo (piezas, probabilidades),
//   err = lo falso o inventado, dat = lo comprobado o correcto, sig = la pregunta o la persona, w = el umbral y las reglas.
//   Cada papel lleva además forma o rótulo (✓/✗ trazados, punteado = ilustrativo o «no se mide»).
import { alpha, clamp, ease, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
/** Paso de un estado a otro dentro de una vista: 0 antes de `k`, 1 poco después de que empieza. */
export const step = (S: Frame, k: string, a = 0, b = 0.1) => fr(S, k, a, b, 'io');
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** Escala tipográfica extra en escenarios horizontales altos (escritorio grande). */
export const Z = (S: Frame) => (S.portrait ? 1 : clamp(S.H / 420, 1, 1.25));
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px * Z(S), 12.2 / S.u);
/** Alto de línea (px) para un tamaño ya pasado por FS. */
export const LH = (S: Frame, size: number, k = 1.3) => size * S.u * k;
/** Teléfono en horizontal, Android pequeño o escenario muy bajo. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Muy bajo (teléfono horizontal): se omite lo accesorio. */
export const tiny = (S: Frame) => S.H < 300;
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 36 : tight(S) ? 22 : 26) * S.u, (tight(S) ? 10 : 16) * S.u);

// ── formato ─────────────────────────────────────────────────────────────────────────────────────────
/** Porcentaje con el formato del idioma: «73.6 %» (es) / «73.6%» (en). Punto decimal en ambos. */
export const pct = (S: Frame, v: number, digits = 0) => `${S.n(v * 100, digits)}${S.lang === 'es' ? ' %' : '%'}`;
/** Entero con separador de miles del idioma. */
export const int = (S: Frame, v: number) => S.n(Math.round(v), 0);

// ── texto ───────────────────────────────────────────────────────────────────────────────────────────
export function lines(S: Frame, text: string, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; maxLines?: number } = {}): string[] {
  const ls = S.d.wrap(text, Math.max(10, w), { size, weight: o.weight ?? 600, font: o.font });
  if (o.maxLines && ls.length > o.maxLines) {
    const cut = ls.slice(0, o.maxLines); let last = cut[o.maxLines - 1];
    while (last.length > 1 && S.d.measure(last + '…', { size, weight: o.weight ?? 600, font: o.font }) > w) last = last.slice(0, -1);
    cut[o.maxLines - 1] = last.replace(/[\s,;.]+$/, '') + '…';
    return cut;
  }
  return ls;
}
/** Párrafo: dibuja las líneas (base arriba) y devuelve la altura usada. `size` ya pasado por FS. */
export function para(S: Frame, text: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; maxLines?: number; lh?: number; align?: CanvasTextAlign; a?: number; italic?: boolean } = {}): number {
  const d = S.d, lh = (o.lh ?? 1.28) * size * S.u, ls = lines(S, text, w, size, o);
  ls.forEach((ln, i) => {
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(ln, tx, y + i * lh, { size, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, italic: o.italic });
  });
  return ls.length * lh;
}
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; maxLines?: number; lh?: number; font?: 'ui' | 'mono' } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.28) * size * S.u;

/** Tamaño que hace caber `str` en `w` px sin bajar de 12 px efectivos. */
export function fitSize(S: Frame, str: string, w: number, size: number, weight = 600, font?: 'ui' | 'mono') {
  const minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && S.d.measure(str, { size: s, weight, font }) > w) s -= 0.5;
  return s;
}
/** Recorta con «…» para que quepa en `w`. */
export function clip(S: Frame, str: string, w: number, size: number, weight = 600, font?: 'ui' | 'mono') {
  if (S.d.measure(str, { size, weight, font }) <= w) return str;
  let t = str;
  while (t.length > 1 && S.d.measure(t + '…', { size, weight, font }) > w) t = t.slice(0, -1);
  return t.replace(/[\s,;.·]+$/, '') + '…';
}
/** Texto de una línea que se encoge hasta caber (≥ 12 px); si ni así cabe, se recorta con puntos suspensivos. `size` sin FS. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number; italic?: boolean } = {}) {
  const wt = o.weight ?? 600, s = fitSize(S, str, w, FS(S, size), wt, o.font);
  return S.d.text(clip(S, str, w, s, wt, o.font), x, y, { size: s, weight: wt, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a, italic: o.italic });
}

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas si hace falta y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  const u = S.u, x = (tight(S) ? 10 : 16) * u, w = S.W - 2 * x, size = FS(S, 12) / Z(S);
  const sz = Math.max(size, 12.2 / u);
  const ls = lines(S, str, w, sz, { weight: 600 });
  const lh = sz * u * 1.15, n = ls.length, y0 = S.H - 4 * u - n * lh;
  if (n > (S.portrait ? 2 : 1)) return;
  ls.forEach((ln, i) => S.d.text(ln, x, y0 + i * lh, { size: sz, weight: 600, color: S.pal.mute, base: 'top', a: a * 0.95, italic: true }));
}

/** Encabezado de una vista (gris, negritas, una línea). Devuelve el alto que ocupa. */
export function header(S: Frame, str: string, r: Rect, a = 1, t?: Tone) {
  const size = FS(S, 13), h = LH(S, size, 1.55);
  fitText(S, str, r.x, r.y + h * 0.4, r.w, 13, { weight: 800, color: t ? tone(S, t).ink : S.pal.mute, a });
  return h;
}

// ── piezas ──────────────────────────────────────────────────────────────────────────────────────────
/** Tarjeta con borde del tono pedido; `hot` la resalta; `dash` = ilustrativo o supuesto. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: boolean; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.04 + 0.16 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? ((o.hot ?? 0) > 0.4 ? 2.2 : 1.4), r: o.r ?? 4, dash: o.dash ? [5, 4] : undefined, a: o.a });
}
/** Pastilla con borde (rótulo corto). Devuelve su caja. `size` sin FS. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; maxW?: number; weight?: number; solid?: boolean } = {}) {
  const { d } = S, c = tone(S, t), u = S.u, padX = 7 * u;
  let size = FS(S, o.size ?? 13);
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX + 0.5, size, o.weight ?? 700);
  const txt = o.maxW ? clip(S, str, o.maxW - 2 * padX + 0.5, size, o.weight ?? 700) : str;
  const tw = d.measure(txt, { size, weight: o.weight ?? 700 }), h = size * u + 10 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.solid ? c.c : t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(txt, x0 + w / 2, y + 0.5, { size, weight: o.weight ?? 700, color: o.solid ? S.pal.stage : t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
export const chipW = (S: Frame, str: string, size = 13, weight = 700) => S.d.measure(str, { size: FS(S, size), weight }) + 14 * S.u;
export const chipH = (S: Frame, size = 13) => FS(S, size) * S.u + 10 * S.u;

/** ✓ o ✗ dibujados con trazos (la forma acompaña al color). `size` en px lógicos sin escalar. */
export function mark(S: Frame, x: number, y: number, ok: boolean, size = 6, a = 1) {
  const { d } = S, s = size * S.u, t = tone(S, ok ? 'dat' : 'err');
  d.withAlpha(a, () => {
    if (ok) d.polyline([[x - s * 0.9, y], [x - s * 0.25, y + s * 0.7], [x + s, y - s * 0.8]], t.c, 2.6, { join: 'round' });
    else { d.line(x - s * 0.75, y - s * 0.75, x + s * 0.75, y + s * 0.75, t.c, 2.6); d.line(x - s * 0.75, y + s * 0.75, x + s * 0.75, y - s * 0.75, t.c, 2.6); }
  });
}

/** Sello rotado («NO EXISTEN», «INVENTADA»…). El borde doble acompaña al color. `pop` 0..1 = aparición. */
export function stamp(S: Frame, str: string, cx: number, cy: number, t: Tone, o: { angle?: number; a?: number; size?: number; pop?: number; maxW?: number } = {}) {
  const { ctx } = S, c = tone(S, t), pop = o.pop ?? 1;
  if (pop <= 0.01) return;
  let size = FS(S, o.size ?? 15);
  if (o.maxW) size = fitSize(S, str, o.maxW - 20 * S.u, size, 800);
  const w = S.d.measure(str, { size, weight: 800 }) + 18 * S.u, h = size * S.u * 1.2 + 10 * S.u;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(o.angle ?? -0.1); const k = 0.75 + 0.25 * ease.out(clamp(pop)); ctx.scale(k, k);
  S.d.withAlpha((o.a ?? 1) * clamp(pop * 1.6), () => {
    S.d.rect(-w / 2, -h / 2, w, h, { fill: alpha(S.pal.stage, 0.9), stroke: c.c, lw: 2.4, r: 2 });
    S.d.rect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, { stroke: c.c, lw: 1, r: 1 });
    S.d.text(str, 0, 0, { size, weight: 800, color: c.ink, align: 'center', base: 'middle' });
  });
  ctx.restore();
}

/** Flecha entre dos puntos con progreso 0..1. */
export function arrow(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; k?: number; dash?: boolean; lw?: number; a?: number } = {}) {
  const k = clamp(o.k ?? 1); if (k <= 0.01) return;
  const t = tone(S, o.tone ?? 'ink'), x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => {
    if (o.dash) S.d.line(x1, y1, x, y, t.c, o.lw ?? 2, [5, 4]);
    else S.d.arrow(x1, y1, x, y, t.c, o.lw ?? 2, k > 0.97 ? 7 * S.u : 0.001);
  });
}

/** Lectura numérica: rótulo arriba y valor grande debajo. Devuelve el alto usado. */
export function stat(S: Frame, x: number, y: number, label: string, value: string, t: Tone = 'ink', o: { size?: number; align?: CanvasTextAlign; w?: number; a?: number } = {}) {
  const c = tone(S, t), ls = FS(S, 12), vs = FS(S, o.size ?? 22);
  S.d.withAlpha(o.a ?? 1, () => {
    fitText(S, label, x, y, o.w ?? 400, 12, { weight: 700, color: S.pal.mute, align: o.align, base: 'top' });
    fitText(S, value, x, y + ls * S.u * 1.3, o.w ?? 400, o.size ?? 22, { weight: 800, font: 'mono', color: t === 'ink' ? S.pal.ink : c.ink, align: o.align, base: 'top' });
  });
  return ls * S.u * 1.3 + vs * S.u * 1.15;
}

/** Barras horizontales de probabilidad: etiqueta · barra 0..max · valor. `ghost` = barra punteada (masa repartida). */
export interface BarRow { label: string; value: number; t?: Tone; hot?: boolean; ghost?: boolean; a?: number; grow?: number; text?: string }
export function probBars(S: Frame, r: Rect, rows: BarRow[], o: { max?: number; labelW?: number; fmt?: (v: number) => string; rowH?: number; valueW?: number } = {}) {
  const { d, pal: p } = S, u = S.u, n = rows.length, rh = o.rowH ?? r.h / Math.max(1, n), max = o.max ?? 1;
  const sz = FS(S, 13), lw = o.labelW ?? Math.min(150 * u, r.w * 0.36);
  const lsz = !S.portrait && rh > 32 * u ? 14 : 13;
  const vw = o.valueW ?? d.measure('100 %', { size: sz, weight: 800, font: 'mono' }) + 8 * u, bx = r.x + lw, bw = Math.max(20, r.w - lw - vw);
  rows.forEach((row, i) => {
    const a = row.a ?? 1; if (a <= 0.003) return;
    const y = r.y + i * rh, c = tone(S, row.t ?? 'lat'), h = Math.min(rh * 0.64, 22 * u), by = y + (rh - h) / 2;
    const len = Math.max(row.value > 0 ? 2 : 0, bw * clamp(row.value / max) * clamp(row.grow ?? 1));
    d.withAlpha(a, () => {
      if (lw > 12 * u && row.label) fitText(S, row.label, bx - 8 * u, y + rh / 2, lw - 10 * u, lsz, { weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right' });
      d.rect(bx, by, bw, h, { fill: alpha(p.ink, 0.05) });
      if (row.ghost) { d.dither(bx, by, len, h, c.c, 0.35, 2); d.rect(bx, by, len, h, { stroke: alpha(c.c, 0.8), lw: 1.2, dash: [3, 2] }); }
      else d.rect(bx, by, len, h, { fill: row.hot ? c.c : alpha(c.c, 0.5) });
      const v = row.text ?? (o.fmt ?? ((x) => pct(S, x)))(row.value);
      d.text(v, r.x + r.w, y + rh / 2, { size: sz, font: 'mono', weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle', a: clamp(row.grow ?? 1) });
    });
  });
}

/** Pestañas de una vista por pasos («1 Inventar · 2 …»). La actual se resalta; las vistas, en gris. Devuelve el alto. */
export function tabs(S: Frame, r: Rect, items: { label: string; t: Tone; on: number; hot: number }[]) {
  const u = S.u, gap = 8 * u, h = chipH(S, 13);
  let x = r.x;
  const widths = items.map((it) => chipW(S, it.label, 13));
  const total = widths.reduce((s, w) => s + w, 0) + gap * (items.length - 1);
  const k = total > r.w ? r.w / total : 1;   // si no caben, se reparten el ancho (fitText dentro)
  items.forEach((it, i) => {
    const w = widths[i] * k;
    if (it.on > 0.01) chip(S, it.label, x, r.y + h / 2, it.hot > 0.5 ? it.t : 'ink', { align: 'left', a: it.on * (0.55 + 0.45 * it.hot), maxW: w, size: 13, solid: it.hot > 0.5 });
    x += w + gap;
  });
  return h;
}
