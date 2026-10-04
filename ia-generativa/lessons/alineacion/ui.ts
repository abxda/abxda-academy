// Ayudas de dibujo propias de la lección «De modelo base a asistente».
// Todo texto respeta ≥ 12 px efectivos (FS) y los colores salen de tone()/S.pal (nunca hex). Los rasgos tienen siempre
// la misma forma Y el mismo color (la forma acompaña al color): correcta = visto, larga = barras, amable = sonrisa, complaciente = «=».
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);
/** Teléfono en horizontal: muy bajo. */
export const isCompact = (S: Frame) => !S.portrait && S.H < 360;
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

export type TraitKey = 'ok' | 'long' | 'warm' | 'agree';
export const TRAIT_KEYS: TraitKey[] = ['ok', 'long', 'warm', 'agree'];
export const traitTone = (k: TraitKey): Tone => (k === 'ok' ? 'dat' : k === 'long' ? 'lat' : k === 'warm' ? 'w' : 'err');
export const traitName = (S: Frame, k: TraitKey) => (k === 'ok' ? S.l('correcta', 'correct') : k === 'long' ? S.l('larga', 'long') : k === 'warm' ? S.l('amable', 'friendly') : S.l('da la razón', 'agrees'));
export const traitNameShort = (S: Frame, k: TraitKey) => (k === 'ok' ? S.l('correcta', 'correct') : k === 'long' ? S.l('larga', 'long') : k === 'warm' ? S.l('amable', 'friendly') : S.l('complaciente', 'flattering'));

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

/** Párrafo: dibuja las líneas y devuelve la altura usada. `chars` (opcional) limita los caracteres visibles (efecto de escritura). */
export function para(S: Frame, text: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; maxLines?: number; lh?: number; chars?: number; align?: CanvasTextAlign; a?: number; halo?: boolean } = {}): number {
  const d = S.d, lh = (o.lh ?? 1.3) * size * S.u, ls = lines(S, text, w, size, o);
  let left = o.chars ?? Infinity;
  ls.forEach((ln, i) => {
    if (left <= 0) return;
    const vis = left >= ln.length ? ln : ln.slice(0, Math.max(0, Math.floor(left)));
    left -= ln.length + 1;
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(vis, tx, y + i * lh, { size, weight: o.weight ?? 500, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 3 });
  });
  return ls.length * lh;
}

/** Altura (px) que ocuparía un párrafo. */
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; maxLines?: number; lh?: number } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.3) * size * S.u;

/** Texto de una sola línea que se encoge hasta caber (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a });
}

/** Tarjeta con borde del tono pedido. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: number[]; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.04 + 0.2 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? (o.hot && o.hot > 0.4 ? 2.4 : 1.5), r: o.r ?? 4, dash: o.dash, a: o.a });
}

/** Cabecera diminuta sobre una tarjeta («ILUSTRATIVO», «salida real»…). */
export function tab(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; a?: number } = {}) {
  const c = tone(S, o.t ?? 'mute');
  return S.d.tag(str, x, y, { color: c.ink, fill: S.pal.stage, stroke: o.t ? c.c : S.pal.line, size: FS(S, 12), align: o.align, a: o.a, pad: 5 });
}

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

/** Persona en píxeles (quien escribe o compara). */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'ink', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

/** Barra horizontal con valor (probabilidad 0..1), con marca fantasma de referencia. */
export function probBar(S: Frame, x: number, y: number, w: number, h: number, v: number, t: Tone, o: { ghost?: number; a?: number } = {}) {
  const { d, pal: p } = S, c = tone(S, t);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface2 });
    d.rect(x, y, Math.max(0, w * clamp(v)), h, { fill: c.c });
    if (o.ghost !== undefined) { const gx = x + w * clamp(o.ghost); d.line(gx, y - 2, gx, y + h + 2, p.ink, 2); }
  });
}

/** Flecha entre dos puntos con rótulo opcional en el medio. */
export function arrowLabel(S: Frame, x1: number, y1: number, x2: number, y2: number, label: string, t: Tone = 'ink', o: { a?: number; progress?: number; size?: number; dash?: number[] } = {}) {
  const { d } = S, c = tone(S, t), k = clamp(o.progress ?? 1);
  if (k <= 0) return;
  const tx = x1 + (x2 - x1) * k, ty = y1 + (y2 - y1) * k;
  d.withAlpha(o.a ?? 1, () => {
    if (o.dash) d.line(x1, y1, tx, ty, c.c, 2, o.dash); else d.arrow(x1, y1, tx, ty, c.c, 2.2, k > 0.97 ? 9 : 0.001);
    if (label && k > 0.85) fitText(S, label, (x1 + x2) / 2, (y1 + y2) / 2 - 6, Math.hypot(x2 - x1, y2 - y1) - 10, o.size ?? 13, { weight: 700, color: c.ink, align: 'center', base: 'bottom', halo: true });
  });
}

/** Número con coma decimal según idioma. */
export const num = (S: Frame, v: number, digits = 1) => S.n(v, digits);
export const sgn = (S: Frame, v: number, digits = 1) => (v >= 0 ? '+' : '−') + S.n(Math.abs(v), digits);

// ── documento del modelo base: la indicación seguida de lo que continúa ─────────────────────────────
export interface DocLine { text: string; kind: 'p' | 'c' }
/** Líneas de «documento»: la indicación (kind p) y su continuación (kind c), con ajuste de línea y tope de líneas. */
export function docLines(S: Frame, prompt: string, cont: string, cut: boolean, w: number, size: number, maxLines: number): DocLine[] {
  const out: DocLine[] = [];
  lines(S, prompt, w, size, { weight: 700 }).forEach((t) => out.push({ text: t, kind: 'p' }));
  const parts = cont.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  parts.forEach((part, i) => lines(S, part + (cut && i === parts.length - 1 ? '…' : ''), w, size).forEach((t) => out.push({ text: t, kind: 'c' })));
  if (out.length > maxLines) {
    const cutLines = out.slice(0, maxLines), last = cutLines[maxLines - 1];
    let t = last.text.replace(/…$/, '');
    while (t.length > 1 && S.d.measure(t + '…', { size, weight: 500 }) > w) t = t.slice(0, -1);
    cutLines[maxLines - 1] = { text: t.replace(/[\s,;.]+$/, '') + '…', kind: last.kind };
    return cutLines;
  }
  return out;
}
/** Dibuja líneas de documento mostrando solo `chars` caracteres (efecto de escritura). Devuelve la posición del cursor. */
export function drawDoc(S: Frame, ls: DocLine[], x: number, y: number, size: number, chars: number, o: { contTone?: Tone; lh?: number } = {}): [number, number] {
  const { d, pal: p } = S, lh = (o.lh ?? 1.32) * size * S.u, ct = tone(S, o.contTone ?? 'lat');
  let left = chars, cx = x, cy = y;
  ls.forEach((ln, i) => {
    if (left <= 0) return;
    const vis = left >= ln.text.length ? ln.text : ln.text.slice(0, Math.max(0, Math.floor(left)));
    left -= ln.text.length + 1;
    const yy = y + i * lh;
    d.text(vis, x, yy, { size, weight: ln.kind === 'p' ? 700 : 500, color: ln.kind === 'p' ? p.ink : ct.ink, base: 'top' });
    cx = x + d.measure(vis, { size, weight: ln.kind === 'p' ? 700 : 500 }); cy = yy;
  });
  return [cx, cy];
}
/** Cursor parpadeante (bloque). */
export function cursor(S: Frame, x: number, y: number, size: number, t: Tone = 'ink') {
  if (Math.floor(S.clock * 2.2) % 2 === 0) S.d.rect(x + 2, y + 1, 0.55 * size * S.u, size * S.u * 1.1, { fill: tone(S, t).c });
}
