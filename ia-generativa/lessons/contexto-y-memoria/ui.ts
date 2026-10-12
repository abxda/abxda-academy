// Ayudas de dibujo propias de la lección «Contexto y memoria».
// · Tiempo por FRACCIONES de la duración de cada segmento (las voces y los idiomas duran distinto): fr(), win().
// · Texto con piso de 12 px efectivos (FS), que se achica (fitText) o se parte (para) para caber.
// · Colores solo con tone()/S.pal (nunca hex). Cada papel del tren lleva además su rótulo y su forma:
//   tú = vagón liso, IA = vagón con franja, instrucciones = vagón con renglones, resumen y notas = borde punteado.
import { alpha, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { Role } from './model';

// ── tiempo ──────────────────────────────────────────────────────────────────────────────────────────
/** Duración (s) del segmento k. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.12, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Opacidad de una vista que entra al empezar `from` y sale al empezar `to` (fundido corto: es una transición). */
export const win = (S: Frame, from: string, to?: string) => (!S.on(from) ? 0 : S.at(from, 0, 0.5, 'out') * (to ? 1 - S.at(to, 0, 0.45, 'out') : 1));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

// ── tamaños ─────────────────────────────────────────────────────────────────────────────────────────
/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);
/** Teléfono en horizontal o escenario muy bajo. */
export const tight = (S: Frame) => S.H < 360 || (S.portrait && S.H < S.W * 1.15);
/** Área de trabajo con márgenes y una franja al pie para la procedencia. */
export const area = (S: Frame): Rect => inset(S.full(), (tight(S) ? 8 : 14) * S.u, (tight(S) ? 10 : 16) * S.u, (S.portrait ? 38 : tight(S) ? 22 : 28) * S.u, (tight(S) ? 10 : 16) * S.u);

// ── texto ───────────────────────────────────────────────────────────────────────────────────────────
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
/** Texto de una línea que se encoge hasta caber (≥ 12 px); si ni así cabe, se recorta con puntos suspensivos. */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: boolean; a?: number; italic?: boolean } = {}) {
  const wt = o.weight ?? 600, s = fitSize(S, str, w, size, wt, o.font);
  if (S.d.measure(str, { size: s, weight: wt, font: o.font }) > w && str.length > 2) {
    let t = str;
    while (t.length > 1 && S.d.measure(t + '…', { size: s, weight: wt, font: o.font }) > w) t = t.slice(0, -1);
    str = t.replace(/[\s,;.·]+$/, '') + '…';
  }
  return S.d.text(str, x, y, { size: s, weight: wt, font: o.font, color: o.color ?? S.pal.ink, align: o.align, base: o.base, halo: o.halo ? S.pal.stage : undefined, haloW: 3, a: o.a, italic: o.italic });
}
export const fits = (S: Frame, str: string, w: number, size = 12, weight = 600) => S.d.measure(str, { size: FS(S, size), weight }) <= w;

/** Rótulo de procedencia al pie (pequeño, gris, en cursiva; se parte en dos líneas si hace falta y se omite si no cabe). */
export function provenance(S: Frame, str: string, a = 1) {
  const u = S.u, x = (tight(S) ? 10 : 16) * u, w = S.W - 2 * x, size = FS(S, 12);
  const ls = lines(S, str, w, size, { weight: 600 });
  const lh = size * u * 1.15, n = Math.min(2, ls.length), y0 = S.H - 4 * u - n * lh;
  if (ls.length > 2) return;
  ls.forEach((ln, i) => S.d.text(ln, x, y0 + i * lh, { size, weight: 600, color: S.pal.mute, base: 'top', a: a * 0.95, italic: true }));
}

// ── piezas ──────────────────────────────────────────────────────────────────────────────────────────
/** Tarjeta con borde del tono pedido. */
export function card(S: Frame, r: Rect, o: { tone?: Tone; fill?: string; a?: number; lw?: number; dash?: number[]; hot?: number; r?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? alpha(o.tone ? t.c : p.ink, 0.05 + 0.2 * (o.hot ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: o.lw ?? (o.hot && o.hot > 0.4 ? 2.4 : 1.5), r: o.r ?? 4, dash: o.dash, a: o.a });
}
/** Pastilla con borde (rótulo corto). Devuelve su caja. */
export function chip(S: Frame, str: string, x: number, y: number, t: Tone, o: { size?: number; a?: number; align?: CanvasTextAlign; dash?: boolean; maxW?: number; weight?: number; solid?: boolean } = {}) {
  const { d } = S, c = tone(S, t), u = S.u, padX = 7 * u;
  let size = FS(S, o.size ?? 13);
  if (o.maxW) size = fitSize(S, str, o.maxW - 2 * padX, size, o.weight ?? 700);
  const tw = d.measure(str, { size, weight: o.weight ?? 700 }), h = size * u + 10 * u, w = tw + 2 * padX;
  const al = o.align ?? 'center', x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, y - h / 2, w, h, { fill: o.solid ? c.c : t === 'ink' ? S.pal.surface : alpha(c.c, 0.13), stroke: t === 'ink' ? S.pal.lineStrong : c.c, lw: 1.4, r: 3, dash: o.dash ? [4, 3] : undefined });
    d.text(str, x0 + w / 2, y + 0.5, { size, weight: o.weight ?? 700, color: o.solid ? S.pal.stage : t === 'ink' ? S.pal.ink : c.ink, align: 'center', base: 'middle' });
  });
  return { x: x0, y: y - h / 2, w, h };
}
export const chipW = (S: Frame, str: string, size = 13, weight = 700) => S.d.measure(str, { size: FS(S, size), weight }) + 14 * S.u;

/** Globo de chat: el de la persona a la derecha, el del modelo a la izquierda. Devuelve su alto. */
export function bubble(S: Frame, text: string, who: 'user' | 'ai', x: number, y: number, maxW: number, size: number, o: { a?: number; hot?: number; measureOnly?: boolean; dash?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, who === 'user' ? 'sig' : 'lat'), pad = (tight(S) ? 6 : 9) * u;
  const ls = lines(S, text, maxW - 2 * pad, size, { weight: 600 });
  const tw = Math.max(...ls.map((l) => d.measure(l, { size, weight: 600 }))), w = Math.min(maxW, tw + 2 * pad), lh = size * u * 1.25, h = ls.length * lh + 2 * pad - 4 * u;
  if (o.measureOnly) return h;
  const bx = who === 'user' ? x + maxW - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(bx, y, w, h, { fill: alpha(t.c, 0.12 + 0.2 * (o.hot ?? 0)), stroke: t.c, lw: (o.hot ?? 0) > 0.4 ? 2.4 : 1.4, r: 8 * u, dash: o.dash ? [5, 4] : undefined });
    ls.forEach((l, i) => d.text(l, bx + pad, y + pad - 2 * u + i * lh, { size, weight: 600, color: p.ink, base: 'top' }));
  });
  return h;
}

/** Candado en píxeles: los pesos quedan fijos. Ocupa 8·cell de lado. */
const LOCK = ['..1111..', '.1....1.', '.1....1.', '11111111', '11222211', '11222211', '11222211', '11111111'];
export function lock(S: Frame, x: number, y: number, cell: number, a = 1) {
  S.d.withAlpha(a, () => LOCK.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') S.d.rect(x + c * cell, y + r * cell, cell, cell, { fill: ch === '1' ? S.pal.ink2 : tone(S, 'w').c }); })));
}

/** Persona en píxeles. Ocupa 6·sc × 9·sc. */
export function person(S: Frame, x: number, y: number, sc: number, t: Tone = 'sig', a = 1) {
  const c = tone(S, t).c;
  S.d.withAlpha(a, () => S.d.sprite(['..oo..', '.oooo.', '.oooo.', '..oo..', '.oooo.', 'oooooo', 'oooooo', 'oo..oo', 'oo..oo'], { o: c }, x, y, sc));
}

/** El modelo: caja con un pequeño tablero de pesos y, si `locked`, un candado. */
export function modelBox(S: Frame, r: Rect, o: { a?: number; locked?: number; label?: string; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w');
  d.withAlpha(o.a ?? 1, () => {
    card(S, r, { tone: 'w', hot: o.hot ?? 0.15 });
    const lab = o.label ?? S.l('modelo', 'model'), ls = FS(S, 13);
    fitText(S, lab, r.x + r.w / 2, r.y + 8 * u, r.w - 12 * u, ls, { weight: 800, align: 'center', base: 'top', color: wt.ink });
    // tablero de pesos (fijo: misma semilla siempre)
    const top = r.y + 8 * u + ls * u + 8 * u, gh = r.y + r.h - top - 8 * u, cols = 6, rows = 4;
    const cell = Math.max(3, Math.min((r.w - 24 * u) / cols, gh / rows));
    const gw = cols * cell, gx = r.x + (r.w - gw) / 2, gy = top + Math.max(0, (gh - rows * cell) / 2);
    if (gh > 10 * u) for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const v = 0.25 + 0.6 * (((i * 7 + j * 13) % 10) / 10);
      d.rect(gx + j * cell + 1, gy + i * cell + 1, cell - 2, cell - 2, { fill: alpha(wt.c, v) });
    }
    if ((o.locked ?? 0) > 0.01) { const c = Math.max(2, Math.round(2.6 * u)); lock(S, r.x + r.w - 8 * c - 6 * u, r.y + 6 * u, c, o.locked); }
    void p;
  });
}

// ── vagones ─────────────────────────────────────────────────────────────────────────────────────────
export const ROLE_TONE: Record<Role, Tone> = { sys: 'ink', user: 'sig', ai: 'lat', sum: 'dat', note: 'dat' };
export function roleName(S: Frame, r: Role, size: 'long' | 'short' = 'long'): string {
  if (size === 'short') return r === 'sys' ? S.l('sis.', 'sys.') : r === 'user' ? S.l('tú', 'you') : r === 'ai' ? S.l('IA', 'AI') : r === 'sum' ? S.l('res.', 'sum.') : S.l('notas', 'notes');
  return r === 'sys' ? S.l('instrucciones', 'instructions') : r === 'user' ? S.l('tú', 'you') : r === 'ai' ? S.l('IA', 'AI') : r === 'sum' ? S.l('resumen', 'summary') : S.l('notas', 'notes');
}

/**
 * Un vagón: cuerpo con relleno suave y borde del papel, ruedas y un rótulo si cabe.
 * La forma acompaña al color: la IA lleva una franja; las instrucciones, renglones; resumen y notas, borde punteado.
 */
export function wagon(S: Frame, r: Rect, role: Role, o: { a?: number; hot?: number; dash?: boolean; label?: string | null; wheels?: boolean; ghost?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, ROLE_TONE[role]), u = S.u;
  if (r.w < 1 || r.h < 1) return;
  d.withAlpha(o.a ?? 1, () => {
    const dash = o.dash || role === 'sum' || role === 'note' ? [4, 3] : undefined;
    d.rect(r.x, r.y, r.w, r.h, { fill: o.ghost ? alpha(p.stage, 0.6) : alpha(t.c, 0.16 + 0.3 * (o.hot ?? 0)), stroke: role === 'sys' ? p.ink2 : t.c, lw: (o.hot ?? 0) > 0.4 ? 2.6 : 1.5, r: 3 * u, dash });
    if (role === 'ai' && r.w > 6 * u) d.rect(r.x + 2 * u, r.y + 3 * u, r.w - 4 * u, 3 * u, { fill: alpha(t.c, 0.6) });
    if (role === 'sys' && r.w > 10 * u) [0.3, 0.5, 0.7].forEach((f) => d.line(r.x + 4 * u, r.y + r.h * f, r.x + r.w - 4 * u, r.y + r.h * f, alpha(p.ink2, 0.35), 1));
    if (o.wheels !== false) {
      const wr = Math.max(2, 2.6 * u), wy = r.y + r.h + wr * 0.6;
      if (r.w > 5 * wr) { d.circle(r.x + r.w * 0.22, wy, wr, { fill: p.lineStrong }); d.circle(r.x + r.w * 0.78, wy, wr, { fill: p.lineStrong }); }
      else d.circle(r.x + r.w / 2, wy, wr, { fill: p.lineStrong });
    }
    const label = o.label === undefined ? roleName(S, role) : o.label;
    if (label) {
      const size = FS(S, 12.5), cand = [label, roleName(S, role, 'short')];
      const pick = cand.find((s) => d.measure(s, { size, weight: 700 }) + 6 * u <= r.w);
      if (pick && size * u + 4 <= r.h) d.text(pick, r.x + r.w / 2, r.y + r.h / 2 + (role === 'ai' ? 1.5 * u : 0), { size, weight: 700, color: role === 'sys' ? p.ink : t.ink, align: 'center', base: 'middle' });
      else if (role === 'user' && r.w >= 9 * u) {
        // sin espacio para el rótulo: una personita (la forma dice «tú» aunque no se vea el color)
        const sc = Math.max(1, Math.min(Math.floor(r.w / 9), Math.floor((r.h - 4) / 11), Math.round(1.8 * u)));
        person(S, r.x + r.w / 2 - 3 * sc, r.y + r.h / 2 - 4.5 * sc, sc, 'sig');
      } else if ((role === 'note' || role === 'sum') && r.w >= 10 * u) {
        [0.38, 0.5, 0.62].forEach((f, i) => d.line(r.x + r.w * 0.28, r.y + r.h * f, r.x + r.w * (i === 2 ? 0.55 : 0.72), r.y + r.h * f, t.c, 1.6));
      }
    }
  });
}

/** Marco de la ventana alrededor de una vía horizontal (x0..x1), con regla de tokens debajo. Devuelve el rectángulo del marco. */
export function windowFrame(S: Frame, x0: number, x1: number, y: number, h: number, limit: number, o: { a?: number; label?: string; ruler?: number; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, m = 6 * u, a = o.a ?? 1;
  const fr0: Rect = { x: x0 - m, y: y - m, w: x1 - x0 + 2 * m, h: h + 2 * m + 6 * u };
  d.withAlpha(a, () => {
    d.rect(fr0.x, fr0.y, fr0.w, fr0.h, { fill: alpha(tone(S, 'lat').c, 0.04 + 0.06 * (o.hot ?? 0)), stroke: p.ink2, lw: 2 + (o.hot ?? 0), r: 5 * u });
    if (o.label) fitText(S, o.label, fr0.x, fr0.y - 5 * u, fr0.w, 13, { weight: 800, color: p.ink, base: 'bottom' });
    const ra = (o.ruler ?? 0);
    if (ra > 0.01) d.withAlpha(ra, () => {
      const ry = fr0.y + fr0.h + 5 * u, n = 4, size = FS(S, 12);
      d.line(x0, ry, x1, ry, p.lineStrong, 1.5);
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        d.line(x, ry, x, ry + 5 * u, p.lineStrong, 1.5);
        const lab = S.n((limit * i) / n, 0);
        d.text(lab, x, ry + 7 * u, { size, font: 'mono', weight: 600, color: p.mute, align: i === 0 ? 'left' : i === n ? 'right' : 'center', base: 'top' });
      }
    });
  });
  return fr0;
}

/** Barra de ocupación «usado / límite». */
export function gauge(S: Frame, r: Rect, used: number, limit: number, o: { tone?: Tone; a?: number; over?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), k = clamp(used / limit);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface2, stroke: p.line, lw: 1, r: 2 });
    d.rect(r.x, r.y, r.w * k, r.h, { fill: o.over ? tone(S, 'err').c : alpha(t.c, 0.75), r: 2 });
  });
}

/** Flecha que crece de (x1,y1) a (x2,y2) según `k`. */
export function growArrow(S: Frame, x1: number, y1: number, x2: number, y2: number, k: number, color: string, lw = 2.2) {
  if (k <= 0) return;
  S.d.arrow(x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, color, lw, k > 0.97 ? 8 * Math.max(0.85, S.u) : 0.001);
}

/** Documento en miniatura (hoja con renglones). `mark`: lleva la respuesta (visto). */
export function doc(S: Frame, r: Rect, o: { a?: number; mark?: boolean; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.mark ? 'dat' : 'mute');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: o.mark ? alpha(t.c, 0.22 + 0.2 * (o.hot ?? 0)) : p.surface, stroke: o.mark ? t.c : p.lineStrong, lw: o.mark ? 2 : 1, r: 2 });
    const n = Math.max(1, Math.floor((r.h - 6 * u) / (5 * u)));
    if (r.w > 8 * u) for (let i = 0; i < Math.min(n, 4); i++) d.line(r.x + 3 * u, r.y + 5 * u + i * 5 * u, r.x + r.w - 3 * u, r.y + 5 * u + i * 5 * u, alpha(p.ink2, 0.3), 1);
    if (o.mark) {
      const c = Math.min(r.w, r.h) * 0.32, cx = r.x + r.w / 2, cy = r.y + r.h - c - 3 * u;
      d.circle(cx, cy, c, { fill: t.c });
      d.polyline([[cx - c * 0.45, cy], [cx - c * 0.1, cy + c * 0.38], [cx + c * 0.5, cy - c * 0.35]], p.stage, Math.max(1.5, c * 0.25));
    }
  });
}
