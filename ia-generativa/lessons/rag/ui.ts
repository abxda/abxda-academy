// Ayudas de dibujo propias de la lección «RAG».
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber; lo accesorio se omite.
// · Colores solo con tone()/S.pal (nunca literales). Papeles: dat = documentos y fragmentos, lat = vectores y búsqueda,
//   sig = la pregunta, w = el modelo, err = fallas. Cada papel lleva además forma o rótulo (punteado = ilustrativo o falla).
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { wordStem, type Chunk } from './ir';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const Z = (S: Frame) => (S.portrait ? 1 : clamp(S.H / 400, 1, 1.28));
export const FS = (S: Frame, px: number) => Math.max(px * Z(S), 12.2 / S.u);
/** Alto de línea (px) para un tamaño dado. */
export const LH = (S: Frame, size: number, k = 1.3) => size * S.u * k;
/** Teléfono en horizontal, Android pequeño o escenario muy bajo. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Muy bajo (teléfono horizontal): se omite lo accesorio. */
export const tiny = (S: Frame) => S.H < 260;
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 38 : tight(S) ? 23 : 26) * S.u, (tight(S) ? 10 : 16) * S.u);

// ── texto ───────────────────────────────────────────────────────────────────────────────────────────
export function lines(S: Frame, text: string, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; maxLines?: number } = {}): string[] {
  const ls = S.d.wrap(text, Math.max(10, w), { size, weight: o.weight ?? 500, font: o.font });
  if (o.maxLines && ls.length > o.maxLines) {
    const cut = ls.slice(0, o.maxLines); let last = cut[o.maxLines - 1];
    while (last.length > 1 && S.d.measure(last + '…', { size, weight: o.weight ?? 500, font: o.font }) > w) last = last.slice(0, -1);
    cut[o.maxLines - 1] = last.replace(/[\s,;.]+$/, '') + '…';
    return cut;
  }
  return ls;
}
/** Párrafo: dibuja las líneas (base arriba) y devuelve la altura usada. */
export function para(S: Frame, text: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; maxLines?: number; lh?: number; align?: CanvasTextAlign; a?: number; italic?: boolean } = {}): number {
  const d = S.d, lh = (o.lh ?? 1.28) * size * S.u, ls = lines(S, text, w, size, o);
  ls.forEach((ln, i) => {
    const tx = o.align === 'center' ? x + w / 2 : o.align === 'right' ? x + w : x;
    d.text(ln, tx, y + i * lh, { size, weight: o.weight ?? 500, font: o.font, color: o.color ?? S.pal.ink, base: 'top', align: o.align, a: o.a, italic: o.italic });
  });
  return ls.length * lh;
}
export const paraH = (S: Frame, text: string, w: number, size: number, o: { weight?: number; maxLines?: number; lh?: number } = {}) => lines(S, text, w, size, o).length * (o.lh ?? 1.28) * size * S.u;

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
/** Texto de una línea que se encoge hasta caber (≥ 12 px); si ni así cabe, se recorta con puntos suspensivos. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number; italic?: boolean } = {}) {
  const wt = o.weight ?? 600, s = fitSize(S, str, w, size, wt, o.font);
  return S.d.text(clip(S, str, w, s, wt, o.font), x, y, { size: s, weight: wt, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a, italic: o.italic });
}

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas si hace falta y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  const u = S.u, x = (tight(S) ? 10 : 16) * u, w = S.W - 2 * x, size = FS(S, 12);
  const ls = lines(S, str, w, size, { weight: 600 });
  const lh = size * u * 1.15, n = ls.length, y0 = S.H - 4 * u - n * lh;
  if (n > (S.portrait ? 2 : 1)) return;
  ls.forEach((ln, i) => S.d.text(ln, x, y0 + i * lh, { size, weight: 600, color: S.pal.mute, base: 'top', a: a * 0.95, italic: true }));
}

/** Encabezado de una vista (gris, negritas, una línea). Devuelve el alto que ocupa. */
export function header(S: Frame, str: string, r: Rect, a = 1, t?: Tone) {
  const size = FS(S, 13), h = LH(S, size, 1.5);
  fitText(S, str, r.x, r.y + h * 0.4, r.w, size, { weight: 800, color: t ? tone(S, t).ink : S.pal.mute, a });
  return h;
}

// ── piezas ──────────────────────────────────────────────────────────────────────────────────────────
/** Tarjeta con borde del tono pedido. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: number[]; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.05 + 0.2 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? ((o.hot ?? 0) > 0.4 ? 2.4 : 1.5), r: o.r ?? 4, dash: o.dash, a: o.a });
}
/** Pastilla con borde (rótulo corto). Devuelve su caja. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; maxW?: number; weight?: number; solid?: boolean } = {}) {
  const { d } = S, c = tone(S, t), u = S.u, padX = 7 * u;
  let size = FS(S, o.size ?? 13);
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX, size, o.weight ?? 700);
  const txt = o.maxW ? clip(S, str, o.maxW - 2 * padX, size, o.weight ?? 700) : str;
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

/** ✓ o ✗ dibujados con trazos (la forma acompaña al color). */
export function mark(S: Frame, x: number, y: number, ok: boolean, size = 6, a = 1) {
  const { d } = S, s = size * S.u, t = tone(S, ok ? 'dat' : 'err');
  d.withAlpha(a, () => {
    if (ok) d.polyline([[x - s * 0.9, y], [x - s * 0.25, y + s * 0.7], [x + s, y - s * 0.8]], t.c, 2.6, { join: 'round' });
    else { d.line(x - s * 0.75, y - s * 0.75, x + s * 0.75, y + s * 0.75, t.c, 2.6); d.line(x - s * 0.75, y + s * 0.75, x + s * 0.75, y - s * 0.75, t.c, 2.6); }
  });
}

/** Pila de páginas (un documento). `lines` rayas de texto simuladas. */
export function page(S: Frame, x: number, y: number, w: number, h: number, o: { tone?: Tone; a?: number; lines?: number; dash?: boolean; fill?: string } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'dat'), n = o.lines ?? 3;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: o.fill ?? p.surface, stroke: t.c, lw: 1.3, r: 2, dash: o.dash ? [4, 3] : undefined });
    if (h > 9 && w > 7) for (let i = 0; i < n; i++) d.rect(x + w * 0.18, y + h * 0.22 + (i * h * 0.58) / Math.max(1, n), w * (i === n - 1 ? 0.4 : 0.64), Math.max(1.2, h * 0.06), { fill: alpha(t.c, 0.55) });
  });
}

/** Caja de flujo con su nombre. */
export function node(S: Frame, r: Rect, label: string, o: { tone?: Tone; a?: number; hot?: number; dash?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), size = FS(S, 13);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(o.tone ? t.c : p.ink, 0.08 + 0.3 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: (o.hot ?? 0) > 0.5 ? 2.6 : 1.5, r: 4, dash: o.dash ? [5, 4] : undefined });
    fitText(S, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 8 * S.u, size, { weight: 800, color: o.tone ? t.ink : p.ink, align: 'center' });
  });
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

/** Número en círculo (puesto o número de fuente). */
export function badgeNum(S: Frame, n: number | string, x: number, y: number, r: number, t: Tone = 'lat', o: { a?: number; hollow?: boolean } = {}) {
  const c = tone(S, t);
  S.d.withAlpha(o.a ?? 1, () => {
    S.d.circle(x, y, r, o.hollow ? { fill: S.pal.surface, stroke: c.c, lw: 1.5 } : { fill: c.c });
    S.d.text(String(n), x, y + 0.5, { size: FS(S, 12), weight: 800, color: o.hollow ? c.ink : S.pal.stage, align: 'center', base: 'middle' });
  });
}

// ── fuentes ─────────────────────────────────────────────────────────────────────────────────────────
/** Fragmento → «Garantía §2». */
export const srcLabel = (c: Chunk) => `${c.title} §${c.n}`;
/** Versión corta: primera palabra del título + número de párrafo. */
export const srcShort = (c: Chunk) => `${c.title.split(/[ ,]/)[0]} §${c.n}`;

// ── texto con palabras resaltadas y ajuste de línea ─────────────────────────────────────────────────
export interface Tok { t: string; color?: string; weight?: number; bg?: string; ul?: string; uld?: boolean }
interface Placed { k: Tok; x: number; y: number; w: number }
export interface Flow { items: Placed[]; h: number; lines: number; lh: number; size: number }
const cache = new Map<string, Flow>();

/** Coloca palabras en líneas dentro de un ancho `w`. Si pasa de `maxLines`, corta y añade «…». Se guarda en caché por `key`. */
export function flow(S: Frame, key: string, toks: Tok[], w: number, size: number, o: { weight?: number; maxLines?: number } = {}): Flow {
  const ck = `${S.lang}|${S.pal.dark ? 'd' : 'l'}|${key}|${Math.round(w)}|${size.toFixed(2)}|${S.u.toFixed(3)}|${o.weight ?? 500}|${o.maxLines ?? 0}`;
  const hit = cache.get(ck); if (hit) return hit;
  const { d } = S, weight = o.weight ?? 500, sp = d.measure(' ', { size, weight }), L = LH(S, size, 1.3);
  let x = 0, line = 0; const items: Placed[] = [];
  for (const k of toks) {
    const wd = d.measure(k.t, { size, weight: k.weight ?? weight });
    if (x > 0 && x + wd > w) { x = 0; line++; }
    items.push({ k, x, y: line * L, w: wd }); x += wd + sp;
  }
  let lines_ = line + 1, out = items;
  if (o.maxLines && lines_ > o.maxLines) {
    out = items.filter((it) => it.y < o.maxLines! * L - 1); lines_ = o.maxLines;
    const ew = d.measure('…', { size, weight });
    let last = out[out.length - 1];
    while (out.length > 1 && last.x + last.w + ew > w) { out.pop(); last = out[out.length - 1]; }
    out = [...out, { k: { t: '…', color: S.pal.mute }, x: last.x + last.w + 1, y: last.y, w: ew }];
  }
  const f = { items: out, h: lines_ * L, lines: lines_, lh: L, size };
  if (cache.size > 500) cache.clear();
  cache.set(ck, f); return f;
}

export function drawFlow(S: Frame, f: Flow, x: number, y: number, o: { color?: string; weight?: number; a?: number } = {}) {
  const { d, pal: p } = S, weight = o.weight ?? 500;
  d.withAlpha(o.a ?? 1, () => {
    for (const it of f.items) {
      const k = it.k, ty = y + it.y + f.lh / 2;
      if (k.bg) d.rect(x + it.x - 2 * S.u, y + it.y + 1, it.w + 4 * S.u + 1, f.lh - 2, { fill: k.bg });
      d.text(k.t, x + it.x, ty, { size: f.size, weight: k.weight ?? weight, color: k.color ?? o.color ?? p.ink, base: 'middle' });
      if (k.ul) d.line(x + it.x, y + it.y + f.lh - 2, x + it.x + it.w, y + it.y + f.lh - 2, k.ul, 1.5, k.uld ? [3, 2] : undefined);
    }
  });
}

/** Palabras de un texto como fichas. Las que comparten raíz con `hit` se resaltan; las de la oración `trap`, como trampa. */
export function toks(S: Frame, text: string, o: { hit?: Set<string>; trap?: string; hitTone?: Tone; color?: string } = {}): Tok[] {
  const ht = tone(S, o.hitTone ?? 'lat'), er = tone(S, 'err');
  const out: Tok[] = [];
  const parts = o.trap && text.includes(o.trap) ? [text.slice(0, text.indexOf(o.trap)), o.trap, text.slice(text.indexOf(o.trap) + o.trap.length)] : [text];
  parts.forEach((part, pi) => {
    const isTrap = !!o.trap && part === o.trap && pi === 1;
    for (const w of part.split(/[ \t\n]+/).filter(Boolean)) {
      if (isTrap) out.push({ t: w, color: er.ink, weight: 700, bg: alpha(er.c, 0.14) });
      else if (o.hit && o.hit.has(wordStem(w, S.lang as 'es' | 'en'))) out.push({ t: w, color: ht.ink, weight: 800, ul: ht.c });
      else out.push({ t: w, color: o.color ?? S.pal.ink });
    }
  });
  return out;
}

// ── tarjeta de fragmento ────────────────────────────────────────────────────────────────────────────
export interface CardOpts { rank?: number; score?: string; hit?: Set<string>; tone?: Tone; a?: number; trap?: string; dash?: boolean; dim?: boolean; tag?: { text: string; tone: Tone }; ok?: boolean | null; maxLines?: number }
/** Alto de una tarjeta que muestra `n` líneas de texto (0 = solo encabezado). */
export const cardH = (S: Frame, n: number) => { const sz = FS(S, 13); return 2 * 6 * S.u + LH(S, sz, 1.3) + (n > 0 ? 3 * S.u + n * LH(S, sz, 1.3) : 0); };
/** Tarjeta: puesto, fuente, puntuación (y una marca), y el texto del fragmento con las palabras coincidentes resaltadas. */
export function chunkCard(S: Frame, r: Rect, ch: Chunk, o: CardOpts = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'lat'), sz = FS(S, 13), pad = 6 * u, L = LH(S, sz, 1.3);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: o.dim ? alpha(p.surface, 0.6) : p.surface, stroke: o.dim ? alpha(t.c, 0.45) : t.c, lw: 1.5, r: 4, dash: o.dash ? [5, 4] : undefined });
    const hy = r.y + pad + L / 2;
    let hx = r.x + pad;
    if (o.rank !== undefined) { badgeNum(S, o.rank, hx + L * 0.42, hy, L * 0.42, o.tone ?? 'lat', { hollow: o.dim }); hx += L * 0.84 + 6 * u; }
    let right = r.x + r.w - pad;
    if (o.ok !== undefined && o.ok !== null) { mark(S, right - 6 * u, hy, o.ok, 5.5); right -= 18 * u; }
    if (o.score) { const sw = d.measure(o.score, { size: sz, weight: 700, font: 'mono' }); d.text(o.score, right, hy, { size: sz, weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle' }); right -= sw + 8 * u; }
    if (o.tag) { const tw = Math.min(chipW(S, o.tag.text, 12), (right - hx) * 0.55); const b = chip(S, o.tag.text, right, hy, o.tag.tone, { size: 12, align: 'right', maxW: tw }); right = b.x - 6 * u; }
    fitText(S, srcLabel(ch), hx, hy, Math.max(20, right - hx), sz, { weight: 800, color: o.dim ? p.ink2 : t.ink });
    const ty = r.y + pad + L + 3 * u, avail = r.y + r.h - pad - ty + 2, n = Math.min(o.maxLines ?? 99, Math.floor(avail / L));
    if (n >= 1) {
      const f = flow(S, `${ch.id}|${[...(o.hit ?? [])].sort().join(',')}|${o.trap ? 1 : 0}|${o.dim ? 1 : 0}`, toks(S, ch.text, { hit: o.hit, trap: o.trap, hitTone: 'lat', color: o.dim ? p.ink2 : undefined }), r.w - 2 * pad, sz, { maxLines: n });
      drawFlow(S, f, r.x + pad, ty);
    }
  });
}

// ── vector disperso como tira de casilleros ─────────────────────────────────────────────────────────
/** Dibuja un vector de `n` casilleros: una línea base y una barra por cada valor distinto de cero (alto ∝ peso).
 *  `pos[k]` = columna del término k; `grow` 0..1 = cuánto crecen las barras (0 = marcas mínimas). Devuelve el x de cada término. */
export function strip(S: Frame, r: Rect, vec: Map<number, number>, pos: number[], n: number, o: { tone?: Tone; grow?: number; max?: number; a?: number; base?: boolean; hot?: Set<number> } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), cw = r.w / n, max = o.max ?? 0.45, grow = clamp(o.grow ?? 1);
  const xs = new Map<number, number>();
  d.withAlpha(o.a ?? 1, () => {
    if (o.base !== false) d.rect(r.x, r.y + r.h - Math.max(2, 2 * S.u), r.w, Math.max(2, 2 * S.u), { fill: alpha(p.ink, 0.16) });
    for (const [k, w] of vec) {
      const x = r.x + pos[k] * cw, hh = Math.max(3 * S.u, r.h * (0.18 + 0.82 * grow * clamp(w / max)));
      d.rect(x, r.y + r.h - hh, Math.max(1.6, cw * 0.9), hh, { fill: o.hot?.has(k) ? t.c : alpha(t.c, 0.75) });
      xs.set(k, x + Math.max(1.6, cw * 0.9) / 2);
    }
  });
  return xs;
}
