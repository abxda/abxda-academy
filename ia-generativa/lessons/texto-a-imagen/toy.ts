// Piezas de dibujo de esta lección: imágenes del mundo de juguete (12 × 12, cinco colores), vectores como barras,
// frases (prompts) en una caja, contadores y flechas. Los cinco colores del juguete son los cinco tonos del curso
// (tone): mismo matiz en tema claro y oscuro. El andamiaje (cajas, flechas, barras) va en tinta neutra para no
// confundirse con los colores del mundo.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { K, N } from './nn';

/** Duración (s) del segmento k: se anima por fracciones (las voces y los idiomas duran distinto). */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.08, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Tamaño de texto con piso de 12 px efectivos. */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
/** Espaciado que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9);
/** Escenario apaisado y muy bajo (teléfono en horizontal): las vistas reparten en columnas en lugar de filas. */
export const isShort = (S: Frame) => !S.portrait && S.H < S.W * 0.42;

export const TOY_TONES: Tone[] = ['sig', 'err', 'w', 'dat', 'lat'];   // cian, magenta, ámbar, verde, violeta

// ── colores RGB de los tonos (para pintar las imágenes de 12 × 12 en un lienzo pequeño, sin 144 rectángulos) ──
function rgbOf(c: string): [number, number, number] {
  c = c.trim();
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = c.match(/\(([^)]+)\)/);
  if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2]]; }
  return [128, 128, 128];
}
let palKey = '', palRgb: [number, number, number][] = [];
function toyRgb(S: Frame) {
  const key = TOY_TONES.map((t) => tone(S, t).c).join('|');
  if (key !== palKey) { palKey = key; palRgb = TOY_TONES.map((t) => rgbOf(tone(S, t).c)); imgCache.clear(); }
  return palRgb;
}
type Canvas = OffscreenCanvas | HTMLCanvasElement;
const imgCache = new Map<string, Canvas>();
function makeCanvas(): Canvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(N, N);
  const c = document.createElement('canvas'); c.width = N; c.height = N; return c;
}
/** Lienzo de 12 × 12 con la imagen (índices de color) o con probabilidades por píxel (mezcla de colores). */
function toyCanvas(S: Frame, key: string, img: ArrayLike<number> | null, probs?: Float32Array): Canvas {
  const pal = toyRgb(S);
  let c = imgCache.get(key);
  if (c) return c;
  c = makeCanvas();
  const ctx = c.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  const id = ctx.createImageData(N, N);
  for (let p = 0; p < N * N; p++) {
    let r = 0, g = 0, b = 0;
    if (probs) for (let k = 0; k < K; k++) { const w = probs[p * K + k]; r += w * pal[k][0]; g += w * pal[k][1]; b += w * pal[k][2]; }
    else { const k = img![p]; [r, g, b] = pal[k]; }
    id.data[p * 4] = r; id.data[p * 4 + 1] = g; id.data[p * 4 + 2] = b; id.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  if (imgCache.size > 1500) imgCache.clear();
  imgCache.set(key, c);
  return c;
}
const keyOf = (img: ArrayLike<number>) => { let s = ''; for (let i = 0; i < img.length; i++) s += img[i]; return s; };

/** Imagen del juguete en (x, y) con lado `size`. `probs` (opcional) pinta la mezcla de colores de cada píxel. */
export function toyImage(S: Frame, x: number, y: number, size: number, img: ArrayLike<number> | null, o: { probs?: Float32Array; probsKey?: string; a?: number; frame?: boolean; grid?: number; ring?: number } = {}) {
  const a = o.a ?? 1;
  if (a < 0.01) return;
  const c = o.probs ? toyCanvas(S, 'p' + (o.probsKey ?? ''), null, o.probs) : toyCanvas(S, 'i' + keyOf(img!), img);
  S.d.withAlpha(a, () => {
    const ctx = S.ctx; ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c as CanvasImageSource, x, y, size, size);
    ctx.restore();
    if (o.grid && o.grid > 0.01) {
      const cell = size / N;
      for (let i = 1; i < N; i++) {
        S.d.line(x + i * cell, y, x + i * cell, y + size, alpha(S.pal.stage, 0.55), 1, undefined, o.grid);
        S.d.line(x, y + i * cell, x + size, y + i * cell, alpha(S.pal.stage, 0.55), 1, undefined, o.grid);
      }
    }
    if (o.frame !== false) S.d.rect(x - 0.5, y - 0.5, size + 1, size + 1, { stroke: S.pal.lineStrong, lw: 1 });
    if (o.ring && o.ring > 0.01) S.d.rect(x - 4 * S.u, y - 4 * S.u, size + 8 * S.u, size + 8 * S.u, { stroke: S.pal.ink, lw: 2.2, a: o.ring });
  });
}

/** Un vector como barras alrededor de una línea media (arriba positivo, abajo negativo). `show` 0..1 lo hace crecer. */
export function vecBars(S: Frame, r: Rect, v: ArrayLike<number>, o: { a?: number; show?: number; max?: number; tone?: Tone; frame?: boolean } = {}) {
  const a = o.a ?? 1; if (a < 0.01) return;
  const n = v.length, gap = Math.max(1, r.w / n * 0.22), bw = (r.w - gap * (n - 1)) / n, mid = r.y + r.h / 2;
  let mx = o.max ?? 0; if (!o.max) for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(v[i]));
  mx = mx || 1;
  const col = o.tone ? tone(S, o.tone).c : S.pal.ink2, show = o.show ?? 1;
  S.d.withAlpha(a, () => {
    if (o.frame !== false) S.d.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, { fill: alpha(S.pal.surface, 0.7), stroke: S.pal.line, lw: 1, r: 3 });
    S.d.line(r.x, mid, r.x + r.w, mid, S.pal.lineStrong, 1);
    for (let i = 0; i < n; i++) {
      const k = clamp(show * n * 1.6 - i * 0.6), h = (v[i] / mx) * (r.h / 2 - 1) * k;
      if (Math.abs(h) < 0.3) continue;
      S.d.rect(r.x + i * (bw + gap), h > 0 ? mid - h : mid, bw, Math.abs(h), { fill: col });
    }
  });
}

/** Ajusta un texto a un ancho: si no cabe en `lines` líneas con el tamaño pedido, achica hasta 12 px efectivos. */
export function fitText(S: Frame, text: string, maxW: number, size: number, o: { lines?: number; font?: 'ui' | 'mono'; weight?: number } = {}) {
  const lines = o.lines ?? 2, f = o.font ?? 'ui', wt = o.weight ?? 600;
  let s = size;
  for (let i = 0; i < 8; i++) {
    const ls = S.d.wrap(text, maxW, { size: s, font: f, weight: wt });
    if (ls.length <= lines || s <= fz(S, 12) + 0.01) return { lines: ls, size: s };
    s = Math.max(fz(S, 12), s * 0.9);
  }
  return { lines: S.d.wrap(text, maxW, { size: s, font: f, weight: wt }), size: s };
}

/** La frase (prompt) en una caja con letra monoespaciada. `typed` 0..1 la escribe letra por letra. Devuelve su caja. */
export function promptBox(S: Frame, text: string, cx: number, y: number, maxW: number, o: { a?: number; typed?: number; size?: number; lines?: number; label?: string; hl?: number; align?: 'center' | 'left' } = {}) {
  const a = o.a ?? 1, k = kk(S), pad = 10 * k;
  const ft = fitText(S, `«${text}»`, maxW - 2 * pad, o.size ?? fz(S, 14), { lines: o.lines ?? 2, font: 'mono', weight: 600 });
  const lh = ft.size * S.u * 1.3;
  const w = Math.min(maxW, Math.max(...ft.lines.map((l) => S.d.measure(l, { size: ft.size, font: 'mono', weight: 600 }))) + 2 * pad);
  const h = ft.lines.length * lh + 2 * pad * 0.8;
  const x = o.align === 'left' ? cx : cx - w / 2;
  if (a > 0.01) S.d.withAlpha(a, () => {
    S.d.rect(x, y, w, h, { fill: S.pal.surface, stroke: (o.hl ?? 0) > 0.5 ? S.pal.ink : S.pal.lineStrong, lw: (o.hl ?? 0) > 0.5 ? 2.2 : 1.5, r: 4 });
    const total = ft.lines.reduce((s, l) => s + l.length, 0);
    let left = Math.round((o.typed ?? 1) * total);
    ft.lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, left)); left -= ln.length;
      S.d.text(part, x + pad, y + pad * 0.8 + i * lh, { size: ft.size, font: 'mono', weight: 600, color: S.pal.ink, base: 'top' });
    });
    if ((o.typed ?? 1) < 1) {
      const li = Math.min(ft.lines.length - 1, ft.lines.findIndex((_, i) => ft.lines.slice(0, i + 1).join('').length >= Math.round((o.typed ?? 1) * total)));
      const before = ft.lines.slice(0, Math.max(0, li)).join('').length, cur = ft.lines[Math.max(0, li)].slice(0, Math.round((o.typed ?? 1) * total) - before);
      const tx = x + pad + S.d.measure(cur, { size: ft.size, font: 'mono', weight: 600 });
      if (Math.sin(S.clock * 9) > -0.2) S.d.rect(tx + 1, y + pad * 0.8 + Math.max(0, li) * lh, 2, lh * 0.85, { fill: S.pal.ink });
    }
    if (o.label) S.d.text(o.label, x, y - 5 * k, { size: fz(S, 12), weight: 700, color: S.pal.mute, base: 'bottom' });
  });
  return { x, y, w, h };
}

/** Caja de una pieza del modelo (red) con su nombre, partido en líneas si hace falta. */
export function netBox(S: Frame, r: Rect, label: string, o: { a?: number; hl?: number; size?: number } = {}) {
  const a = o.a ?? 1; if (a < 0.01) return;
  const k = kk(S), ft = fitText(S, label, r.w - 12 * k, o.size ?? fz(S, 13), { lines: 3, weight: 700 });
  const lh = ft.size * S.u * 1.25;
  S.d.withAlpha(a, () => {
    S.d.rect(r.x, r.y, r.w, r.h, { fill: alpha(S.pal.ink, 0.06 + 0.1 * (o.hl ?? 0)), stroke: (o.hl ?? 0) > 0.5 ? S.pal.ink : S.pal.lineStrong, lw: (o.hl ?? 0) > 0.5 ? 2.2 : 1.5, r: 6 });
    const y0 = r.y + r.h / 2 - ((ft.lines.length - 1) * lh) / 2;
    ft.lines.forEach((ln, i) => S.d.text(ln, r.x + r.w / 2, y0 + i * lh, { size: ft.size, weight: 700, color: S.pal.ink, align: 'center', base: 'middle' }));
  });
}

/** Flecha neutra con progreso (0..1). */
export function flow(S: Frame, x1: number, y1: number, x2: number, y2: number, p = 1, o: { a?: number; color?: string; lw?: number } = {}) {
  const k = clamp(p); if (k <= 0.01 || (o.a ?? 1) < 0.01) return;
  const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => S.d.arrow(x1, y1, x, y, o.color ?? S.pal.ink2, o.lw ?? 2, 8 * kk(S)));
}

/** Rótulo corto (pequeño, neutro) con halo. */
export function label(S: Frame, text: string, x: number, y: number, o: { a?: number; size?: number; align?: CanvasTextAlign; base?: CanvasTextBaseline; color?: string; weight?: number; w?: number; italic?: boolean } = {}) {
  if ((o.a ?? 1) < 0.01) return { w: 0, h: 0 };
  return S.d.text(text, x, y, { size: o.size ?? fz(S, 12), weight: o.weight ?? 600, color: o.color ?? S.pal.ink2, align: o.align ?? 'center', base: o.base ?? 'top', halo: S.pal.stage, a: o.a, w: o.w, italic: o.italic });
}

/** Contador: rótulo arriba y cifra grande abajo. `hl` lo resalta (marco). */
export function counter(S: Frame, x: number, y: number, w: number, name: string, value: string, o: { a?: number; hl?: number; size?: number } = {}) {
  const a = o.a ?? 1; if (a < 0.01) return 0;
  const k = kk(S), ft = fitText(S, name, w - 16 * k, fz(S, 12), { lines: 2, weight: 700 });
  const lh = ft.size * S.u * 1.25, vs = o.size ?? fz(S, 22), h = ft.lines.length * lh + vs * S.u * 1.15 + 16 * k;
  S.d.withAlpha(a, () => {
    S.d.rect(x, y, w, h, { fill: S.pal.surface, stroke: (o.hl ?? 0) > 0.5 ? S.pal.ink : S.pal.line, lw: (o.hl ?? 0) > 0.5 ? 2.2 : 1, r: 4 });
    ft.lines.forEach((ln, i) => S.d.text(ln, x + 8 * k, y + 7 * k + i * lh, { size: ft.size, weight: 700, color: S.pal.mute, base: 'top' }));
    S.d.text(value, x + 8 * k, y + 9 * k + ft.lines.length * lh, { size: vs, weight: 800, font: 'mono', color: S.pal.ink, base: 'top' });
  });
  return h;
}

/** Marca de lectura: ✓ (cumple lo pedido) o ✗ (no cumple), dibujada con trazos. */
export function verdict(S: Frame, x: number, y: number, ok: boolean, o: { a?: number; r?: number } = {}) {
  const a = o.a ?? 1; if (a < 0.01) return;
  const r = (o.r ?? 7) * kk(S), p = S.pal;
  S.d.withAlpha(a, () => {
    S.d.circle(x, y, r + 2, { fill: p.surface, stroke: p.lineStrong, lw: 1 });
    if (ok) S.d.polyline([[x - r * 0.5, y], [x - r * 0.1, y + r * 0.45], [x + r * 0.55, y - r * 0.45]], p.ink, 2);
    else { S.d.line(x - r * 0.45, y - r * 0.45, x + r * 0.45, y + r * 0.45, p.ink, 2); S.d.line(x - r * 0.45, y + r * 0.45, x + r * 0.45, y - r * 0.45, p.ink, 2); }
  });
}
