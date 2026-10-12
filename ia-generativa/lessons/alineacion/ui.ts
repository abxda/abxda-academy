// Ayudas de dibujo propias de la lección «De modelo base a asistente».
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). Los rasgos tienen siempre la misma forma Y el mismo color:
//   correcta = visto, larga = renglones, amable = sonrisa, da la razón = «=».
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto, en segundos fijos: es una transición). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);
/** Teléfono en horizontal (muy bajo) o escenario casi cuadrado. */
export const isCompact = (S: Frame) => !S.portrait && S.H < 360;
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 36 : tight(S) ? 20 : 26) * S.u, (tight(S) ? 10 : 16) * S.u);

// ── texto ───────────────────────────────────────────────────────────────────────────────────────────
/** Líneas de un párrafo (con ajuste de línea) recortadas a `maxLines` con puntos suspensivos. */
export function lines(S: Frame, text: string, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; maxLines?: number } = {}): string[] {
  const ls = S.d.wrap(text, w, { size, weight: o.weight ?? 500, font: o.font });
  if (o.maxLines && ls.length > o.maxLines) {
    const cut = ls.slice(0, o.maxLines); let last = cut[o.maxLines - 1];
    while (last.length > 1 && S.d.measure(last + '…', { size, weight: o.weight ?? 500, font: o.font }) > w) last = last.slice(0, -1);
    cut[o.maxLines - 1] = last.replace(/[\s,;.]+$/, '') + '…';
    return cut;
  }
  return ls;
}

/** Párrafo: dibuja las líneas y devuelve la altura usada. */
export function para(S: Frame, text: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; maxLines?: number; lh?: number; align?: CanvasTextAlign; a?: number; halo?: boolean } = {}): number {
  const d = S.d, lh = (o.lh ?? 1.28) * size * S.u, ls = lines(S, text, w, size, o);
  ls.forEach((ln, i) => {
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(ln, tx, y + i * lh, { size, weight: o.weight ?? 500, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 3 });
  });
  return ls.length * lh;
}
/** Altura (px) que ocuparía un párrafo. */
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; maxLines?: number; lh?: number } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.28) * size * S.u;

/** Tamaño que hace caber `str` en `w` px sin bajar de 12 px efectivos. */
export function fitSize(S: Frame, str: string, w: number, size: number, weight = 600, font?: 'ui' | 'mono') {
  const minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && S.d.measure(str, { size: s, weight, font }) > w) s -= 0.5;
  return s;
}
/** Texto de una sola línea que se encoge hasta caber (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number; italic?: boolean } = {}) {
  const s = fitSize(S, str, w, size, o.weight ?? 600, o.font);
  // si ni al tamaño mínimo cabe, se recorta con puntos suspensivos (nunca se sale de su caja)
  if (S.d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w && str.length > 2) {
    let t = str;
    while (t.length > 1 && S.d.measure(t + '…', { size: s, weight: o.weight ?? 600, font: o.font }) > w) t = t.slice(0, -1);
    str = t.replace(/[\s,;.·]+$/, '') + '…';
  }
  return S.d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base, halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a, italic: o.italic });
}
/** ¿Cabe `str` en `w` al tamaño mínimo legible? */
export const fits = (S: Frame, str: string, w: number, weight = 600) => S.d.measure(str, { size: FS(S, 12), weight }) <= w;

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas si hace falta y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  const u = S.u, x = (tight(S) ? 10 : 16) * u, w = S.W - 2 * x, size = FS(S, 12);
  const ls = lines(S, str, w, size, { weight: 600 });
  const lh = size * u * 1.15, n = Math.min(2, ls.length), y0 = S.H - 4 * u - n * lh;
  if (ls.length > 2) return;
  ls.forEach((ln, i) => S.d.text(ln, x, y0 + i * lh, { size, weight: 600, color: S.pal.mute, base: 'top', a: a * 0.95, italic: true }));
}
/** Alto que ocupa la procedencia (para no encimar). */
export const provH = (S: Frame, str: string) => { const u = S.u, w = S.W - 2 * (tight(S) ? 10 : 16) * u, n = lines(S, str, w, FS(S, 12), { weight: 600 }).length; return n > 2 ? 0 : n * FS(S, 12) * u * 1.15 + 6 * u; };

// ── piezas ──────────────────────────────────────────────────────────────────────────────────────────
/** Tarjeta con borde del tono pedido. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: number[]; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.04 + 0.2 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? (o.hot && o.hot > 0.4 ? 2.4 : 1.5), r: o.r ?? 4, dash: o.dash, a: o.a });
}
/** Cabecera diminuta sobre el borde de una tarjeta («Modelo base», «ilustrativo»…). */
export function tab(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; a?: number; maxW?: number } = {}) {
  const c = tone(S, o.t ?? 'mute');
  let s = FS(S, 12);
  if (o.maxW) s = fitSize(S, str, o.maxW - 12 * S.u, s, 600);
  return S.d.tag(str, x, y, { color: c.ink, fill: S.pal.stage, stroke: o.t ? c.c : S.pal.line, size: s, align: o.align, a: o.a, pad: 5 });
}
/** Pastilla con borde (rótulo corto). `dash` = supuesto o ilustrativo. Devuelve su caja. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; maxW?: number; weight?: number } = {}) {
  const { d } = S, c = tone(S, t), u = S.u, padX = 7 * u;
  let size = FS(S, o.size ?? 13);
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX, size, o.weight ?? 700);
  const tw = d.measure(str, { size, weight: o.weight ?? 700 }), h = size * u + 10 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: o.weight ?? 700, color: t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
export const chipW = (S: Frame, str: string, size = 13, weight = 700) => S.d.measure(str, { size: FS(S, size), weight }) + 14 * S.u;

/** Rótulo del paso del recorrido («Paso 1 · ejemplos»), arriba a la izquierda. Devuelve su alto. */
export function stepChip(S: Frame, r: Rect, n: number, label: string, a = 1) {
  const str = S.l(`Paso ${n} · ${label}`, `Step ${n} · ${label}`);
  const b = chip(S, str, r.x, r.y + (FS(S, 13) * S.u + 10 * S.u) / 2, 'ink', { align: 'left', a, size: 13, maxW: r.w });
  return b.h;
}

export type TraitKey = 'ok' | 'long' | 'warm' | 'agree';
export const TRAIT_KEYS: TraitKey[] = ['ok', 'long', 'warm', 'agree'];
export const traitTone = (k: TraitKey): Tone => (k === 'ok' ? 'dat' : k === 'long' ? 'lat' : k === 'warm' ? 'w' : 'err');
export const traitName = (S: Frame, k: TraitKey) => (k === 'ok' ? S.l('correcta', 'correct') : k === 'long' ? S.l('larga', 'long') : k === 'warm' ? S.l('amable', 'friendly') : S.l('da la razón', 'agrees'));

/** Glifo de un rasgo: la forma lo identifica aunque no se vea el color. */
export function glyph(S: Frame, k: TraitKey, cx: number, cy: number, r: number, o: { a?: number; color?: string } = {}) {
  const d = S.d, c = o.color ?? tone(S, traitTone(k)).c, lw = Math.max(1.6, r * 0.2);
  d.withAlpha(o.a ?? 1, () => {
    if (k === 'ok') { d.circle(cx, cy, r, { stroke: c, lw }); d.polyline([[cx - r * 0.45, cy], [cx - r * 0.1, cy + r * 0.38], [cx + r * 0.5, cy - r * 0.35]], c, lw); }
    else if (k === 'long') { [-0.5, 0, 0.5].forEach((dy, i) => d.line(cx - r * (i === 2 ? 0.45 : 0.9), cy + dy * r * 0.95, cx + r * 0.9, cy + dy * r * 0.95, c, lw)); }
    else if (k === 'warm') {
      d.circle(cx, cy, r, { stroke: c, lw }); d.circle(cx - r * 0.35, cy - r * 0.2, r * 0.1, { fill: c }); d.circle(cx + r * 0.35, cy - r * 0.2, r * 0.1, { fill: c });
      const ctx = S.ctx; ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(cx, cy + r * 0.05, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); ctx.restore();
    } else { d.line(cx - r * 0.8, cy - r * 0.32, cx + r * 0.8, cy - r * 0.32, c, lw); d.line(cx - r * 0.8, cy + r * 0.32, cx + r * 0.8, cy + r * 0.32, c, lw); }
  });
}

/** Marca de «elegida» (visto en círculo lleno) o «rechazada» (cruz): la forma acompaña al color. */
export function mark(S: Frame, kind: 'yes' | 'no', cx: number, cy: number, r: number, a = 1) {
  const d = S.d, t = tone(S, kind === 'yes' ? 'dat' : 'err'), lw = Math.max(2, r * 0.22);
  d.withAlpha(a, () => {
    d.circle(cx, cy, r, { fill: t.c });
    const k = S.pal.stage;
    if (kind === 'yes') d.polyline([[cx - r * 0.45, cy], [cx - r * 0.1, cy + r * 0.38], [cx + r * 0.5, cy - r * 0.35]], k, lw);
    else { d.line(cx - r * 0.38, cy - r * 0.38, cx + r * 0.38, cy + r * 0.38, k, lw); d.line(cx - r * 0.38, cy + r * 0.38, cx + r * 0.38, cy - r * 0.38, k, lw); }
  });
}

/** Persona en píxeles (quien escribe o compara). Ocupa 6·sc × 9·sc. */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'ink', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

/** Barra horizontal 0..1 con marca de referencia opcional (│). */
export function probBar(S: Frame, x: number, y: number, w: number, h: number, v: number, t: Tone, o: { ghost?: number; a?: number } = {}) {
  const { d, pal: p } = S, c = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface2 });
    d.rect(x, y, Math.max(0, w * clamp(v)), h, { fill: c.c });
    if (o.ghost !== undefined) { const gx = x + w * clamp(o.ghost); d.line(gx, y - 3, gx, y + h + 3, p.ink, 2); }
  });
}

/** Flecha que crece de (x1,y1) a (x2,y2) según `k`. */
export function growArrow(S: Frame, x1: number, y1: number, x2: number, y2: number, k: number, color: string, lw = 2.4) {
  if (k <= 0) return;
  S.d.arrow(x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, color, lw, k > 0.97 ? 9 * Math.max(0.85, S.u) : 0.001);
}

// ── números ─────────────────────────────────────────────────────────────────────────────────────────
export const num = (S: Frame, v: number, digits = 1) => S.n(v, digits);
export const sgn = (S: Frame, v: number, digits = 1) => (v >= -0.5 * 10 ** -digits ? '+' : '−') + S.n(Math.abs(v), digits);
export const pct = (S: Frame, v: number, digits = 0) => S.n(v * 100, digits) + ' %';

// ── documento: la indicación seguida de lo que escribe el modelo ───────────────────────────────────
export interface DocLine { text: string; kind: 'p' | 'c'; hl?: boolean }
/** Líneas de «documento»: la indicación (kind p) y su continuación (kind c), con ajuste de línea y tope de líneas.
 *  `hl`: subcadenas de la continuación cuyas líneas se resaltan. */
export function docLines(S: Frame, prompt: string | null, cont: string, cut: boolean, w: number, size: number, maxLines: number, hl: string[] = []): DocLine[] {
  const out: DocLine[] = [];
  if (prompt) lines(S, prompt, w, size, { weight: 700 }).forEach((t) => out.push({ text: t, kind: 'p' }));
  const parts = cont.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  parts.forEach((part, i) => {
    const h = hl.some((x) => part.startsWith(x));
    lines(S, part + (cut && i === parts.length - 1 ? '…' : ''), w, size).forEach((t) => out.push({ text: t, kind: 'c', hl: h }));
  });
  if (out.length > maxLines) {
    const cutLines = out.slice(0, maxLines), last = cutLines[maxLines - 1];
    let t = last.text.replace(/…$/, '');
    while (t.length > 1 && S.d.measure(t + '…', { size, weight: 500 }) > w) t = t.slice(0, -1);
    cutLines[maxLines - 1] = { ...last, text: t.replace(/[\s,;.]+$/, '') + '…' };
    return cutLines;
  }
  return out;
}
export const docChars = (ls: DocLine[]) => ls.reduce((a, l) => a + l.text.length + 1, 0);
/** Dibuja líneas de documento mostrando solo `chars` caracteres (efecto de escritura). Devuelve la posición del cursor. */
export function drawDoc(S: Frame, ls: DocLine[], x: number, y: number, size: number, chars: number, o: { contTone?: Tone; lh?: number; hlA?: number; w?: number } = {}): [number, number] {
  const { d, pal: p } = S, lh = (o.lh ?? 1.3) * size * S.u, ct = tone(S, o.contTone ?? 'lat'), et = tone(S, 'err');
  let left = chars, cx = x, cy = y;
  ls.forEach((ln, i) => {
    if (left <= 0) return;
    const vis = left >= ln.text.length ? ln.text : ln.text.slice(0, Math.max(0, Math.floor(left)));
    left -= ln.text.length + 1;
    const yy = y + i * lh, wt = ln.kind === 'p' ? 700 : 500;
    if (ln.hl && (o.hlA ?? 0) > 0) d.rect(x - 4 * S.u, yy - 2 * S.u, (o.w ?? d.measure(ln.text, { size, weight: wt })) + 8 * S.u, lh, { fill: alpha(et.c, 0.16 * (o.hlA ?? 0)), stroke: alpha(et.c, 0.9 * (o.hlA ?? 0)), lw: 1.2, r: 2 });
    d.text(vis, x, yy, { size, weight: wt, color: ln.kind === 'p' ? p.ink : ct.ink, base: 'top' });
    cx = x + d.measure(vis, { size, weight: wt }); cy = yy;
  });
  return [cx, cy];
}
/** Cursor parpadeante (bloque). */
export function cursor(S: Frame, x: number, y: number, size: number, t: Tone = 'ink') {
  if (Math.floor(S.clock * 2.2) % 2 === 0) S.d.rect(x + 2, y + 1, 0.55 * size * S.u, size * S.u * 1.1, { fill: tone(S, t).c });
}
