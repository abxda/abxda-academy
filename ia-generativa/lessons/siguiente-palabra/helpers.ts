// Piezas de dibujo propias de esta lección: texto que se escribe palabra por palabra (con la caja del contexto),
// barras de probabilidad con geometría fija, la franja del sorteo, el bucle de cuatro pasos y rótulos que entran con
// desvanecido. Todo pide roles de color a tone()/S.pal (nada de colores literales) y es puro: solo lee sus argumentos.
import { alpha, clamp, inset, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Duración (s) del segmento k: las voces y los idiomas duran distinto, así que se anima por fracciones. */
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 antes de que empiece, 1 después). */
export const fr = (S: Frame, k: string, a: number, b = a + 0.08, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Escenario apaisado y muy bajo (teléfono en horizontal). */
export const isShort = (S: Frame) => !S.portrait && S.H < S.W * 0.5;
/** En escritorio y tableta (apaisado con altura) todo se dibuja un poco más grande: sobra espacio. */
export const boost = (S: Frame) => (S.portrait || isShort(S) ? 1 : clamp(S.H / 390, 1, 1.28));
/** Tamaño de texto con piso de 12 px efectivos (d.text multiplica por S.u). */
export const fz = (S: Frame, n: number) => Math.max(n * boost(S), 12 / S.u);
/** Espaciado que no se encoge por debajo de 0.9. */
export const kk = (S: Frame) => Math.max(S.u, 0.9) * boost(S);
/** Área útil del escenario. */
export const area = (S: Frame): Rect => inset(S.full(), 14 * S.u, 16 * S.u, 12 * S.u, 16 * S.u);

/** Desplazamiento vertical para centrar un bloque de alto `used` en escenarios apaisados con espacio de sobra. */
export const vshift = (S: Frame, R: Rect, used: number) => (S.portrait || isShort(S) ? 0 : Math.max(0, (R.h - used) * 0.45));
/** Porcentaje: sin decimales, salvo las mitades exactas (12.5 %), para que las barras sumen 100. */
export function pct(S: Frame, p: number): string {
  const v = p * 100, half = Math.abs(v * 2 - Math.round(v * 2)) < 1e-6 && Math.abs(v - Math.round(v)) > 1e-6;
  return `${S.n(v, half ? 1 : 0)}${S.lang === 'es' ? ' %' : '%'}`;
}
/** Número con signo menos tipográfico. */
export const num = (S: Frame, x: number, d = 1) => (Math.abs(x) < 1e-9 ? S.n(0, d) : S.n(x, d).replace('-', '−'));
/** Rótulo de una pieza: las palabras tal cual; el punto, con su nombre. */
export const wl = (S: Frame, w: string) => (w === '.' ? S.l('punto', 'period') : w);
/** Comillas del idioma. */
export const q = (S: Frame, s: string) => (S.lang === 'es' ? `«${s}»` : `“${s}”`);

// ═════════ rótulos ═════════
export function label(S: Frame, text: string, x: number, y: number, o: { a?: number; size?: number; weight?: number; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; w?: number; italic?: boolean; halo?: boolean } = {}) {
  const a = o.a ?? 1;
  if (a < 0.01) return { w: 0, h: 0 };
  return S.d.text(text, x, y, { size: o.size ?? fz(S, 13), weight: o.weight ?? 600, color: o.color ?? S.pal.ink2, align: o.align ?? 'center', base: o.base ?? 'top', w: o.w, italic: o.italic, a, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Tamaño que hace caber un texto en un ancho (sin bajar de 12 px efectivos). */
export function fitSize(S: Frame, text: string, maxW: number, size: number, weight = 600): number {
  const w = S.d.measure(text, { size, weight });
  return w <= maxW ? size : Math.max(12 / S.u, size * maxW / w);
}

// ═════════ texto que se escribe ═════════
export interface WPos { x: number; y: number; w: number; s: string; line: number }
export interface WLayout { pos: WPos[]; lh: number; lines: number; width: number; size: number; sp: number }

/** Coloca las palabras en renglones (el punto va pegado a la palabra anterior; mayúscula al empezar frase). */
export function layoutWords(S: Frame, words: string[], maxW: number, size: number, weight = 600): WLayout {
  const d = S.d, sp = d.measure(' ', { size, weight }) * 1.5, lh = size * S.u * 1.55;
  const pos: WPos[] = [];
  let x = 0, line = 0, width = 0;
  words.forEach((w, i) => {
    const cap = i === 0 || words[i - 1] === '.';
    const s = w === '.' ? '.' : cap ? w[0].toUpperCase() + w.slice(1) : w;
    const ww = d.measure(s, { size, weight });
    const gap = i === 0 ? 0 : w === '.' ? 1.5 * S.u : sp;   // el punto, pegado a la palabra
    if (x + gap + ww > maxW && x > 0 && w !== '.') { line++; x = 0; pos.push({ x: 0, y: line * lh, w: ww, s, line }); x = ww; width = Math.max(width, x); return; }
    pos.push({ x: x + gap, y: line * lh, w: ww, s, line });
    x += gap + ww; width = Math.max(width, x);
  });
  return { pos, lh, lines: line + 1, width, size, sp };
}
/** Caja de una palabra colocada (en coordenadas absolutas). */
export const wordBox = (S: Frame, L: WLayout, i: number, ox: number, oy: number): Rect => {
  const p = L.pos[i], px = Math.min(4 * S.u, L.sp * 0.4), nx = L.pos[i + 1];
  const pr = nx && nx.s === '.' && nx.line === p.line ? 0.5 * S.u : px;   // no tapar el punto que sigue
  return { x: ox + p.x - px, y: oy + p.y + L.lh * 0.08, w: p.w + px + pr, h: L.lh * 0.84 };
};
/** Final del texto (donde va el cursor o la próxima palabra). */
export function endOf(S: Frame, L: WLayout, n: number, ox: number, oy: number, nextW = 0, maxW = Infinity): [number, number] {
  n = Math.min(n, L.pos.length);
  if (n <= 0) return [ox, oy + L.lh / 2];
  const p = L.pos[n - 1], x = ox + p.x + p.w + L.sp;
  if (x + nextW - ox > maxW) return [ox, oy + p.y + L.lh * 1.5];
  return [x, oy + p.y + L.lh / 2];
}

export interface DrawWordsOpts {
  a?: number;
  /** Cuántas palabras se ven (fraccionario: la última entra con desvanecido). */
  shown?: number;
  /** Caja del contexto (la última palabra que mira el modelo), ya calculada por quien llama. */
  ctx?: Rect | null; ctxA?: number; ctxLabel?: string;
  /** Palabra recién agregada (se resalta). */
  fresh?: number; freshA?: number;
  /** Palabras atenuadas (el modelo no las mira). */
  dim?: (i: number) => number;
  /** Subrayado de un tramo [i, j]. */
  under?: [number, number]; underA?: number; underTone?: Tone;
  cursor?: boolean;
  weight?: number;
}
export function drawWords(S: Frame, L: WLayout, ox: number, oy: number, o: DrawWordsOpts = {}) {
  const { d, pal: p } = S, lat = tone(S, 'lat'), sig = tone(S, 'sig'), wt = o.weight ?? 600;
  const shown = o.shown ?? L.pos.length;
  d.withAlpha(o.a ?? 1, () => {
    if (o.ctx && (o.ctxA ?? 1) > 0.01) {
      const r = o.ctx;
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(lat.c, 0.18), stroke: lat.c, lw: 2, r: 4, a: o.ctxA ?? 1 });
      if (o.ctxLabel) {
        // en el primer renglón, encima de la caja; en los demás, a su derecha (encima taparía el renglón anterior)
        if (r.y < oy + L.lh * 0.5) label(S, o.ctxLabel, r.x + r.w / 2, r.y - 3 * S.u, { size: fz(S, 12), weight: 700, color: lat.ink, base: 'bottom', a: o.ctxA ?? 1, halo: true });
        else label(S, o.ctxLabel, r.x + r.w + 8 * S.u, r.y + r.h / 2, { size: fz(S, 12), weight: 700, color: lat.ink, base: 'middle', align: 'left', a: o.ctxA ?? 1, halo: true });
      }
    }
    if (o.fresh !== undefined && o.fresh < L.pos.length && (o.freshA ?? 1) > 0.01) {
      const r = wordBox(S, L, o.fresh, ox, oy);
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(sig.c, 0.22), r: 4, a: o.freshA ?? 1 });
    }
    L.pos.forEach((w, i) => {
      const a = clamp(shown - i) * (o.dim ? o.dim(i) : 1);
      if (a <= 0.01) return;
      d.text(w.s, ox + w.x, oy + w.y + L.lh / 2, { size: L.size, weight: wt, color: p.ink, base: 'middle', a });
    });
    if (o.under && (o.underA ?? 1) > 0.01) {
      const [i, j] = o.under, t = tone(S, o.underTone ?? 'sig');
      for (let k = i; k <= j && k < L.pos.length; k++) {
        const w = L.pos[k], nx = k < j && L.pos[k + 1]?.line === w.line ? L.pos[k + 1].x : w.x + w.w;
        const y = oy + w.y + L.lh * 0.9;
        d.line(ox + w.x, y, ox + lerp(w.x + w.w, nx, 1), y, t.c, 2.5, undefined, o.underA ?? 1);
      }
    }
    if (o.cursor && Math.floor(S.clock * 1.6) % 2 === 0) {
      const nn = Math.min(L.pos.length, Math.ceil(shown - 0.01));
      const [cx, cy] = endOf(S, L, nn, ox, oy);
      d.rect(cx - (nn > 0 ? L.sp * 0.6 : 0), cy - L.lh * 0.32, 2.5 * S.u, L.lh * 0.64, { fill: p.ink });
    }
  });
}

// ═════════ caja de texto (lo que se escribe) ═════════
export function textPanel(S: Frame, r: Rect, title: string, o: { a?: number; alt?: string; altA?: number; altTone?: Tone } = {}) {
  const { d, pal: p } = S, altA = o.alt ? o.altA ?? 0 : 0;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 6 });
    if (title) label(S, title, r.x + 2 * S.u, r.y - 4 * S.u, { size: fz(S, 12), weight: 700, color: p.mute, align: 'left', base: 'bottom', a: 1 - altA });
    // otro rótulo en el mismo sitio (se funden): así no se enciman en pantallas angostas
    if (o.alt && altA > 0.01) label(S, o.alt, r.x + 2 * S.u, r.y - 4 * S.u, { size: fz(S, 12), weight: 800, color: tone(S, o.altTone ?? 'sig').ink, align: 'left', base: 'bottom', a: altA });
  });
}

// ═════════ barras de probabilidad ═════════
export interface BarRow { label: string; p: number; a?: number; hot?: number; cut?: number; text?: string; pre?: string }
export interface BarGeom { y: number; h: number; x0: number; x1: number; lx: number; tx: number }
export function probBars(S: Frame, r: Rect, rows: BarRow[], o: { slots?: number; rowH?: number; size?: number; labelW?: number; pctW?: number; preW?: number; tone?: Tone; a?: number; max?: number } = {}): BarGeom[] {
  const { d, pal: p } = S, n = o.slots ?? rows.length, t = tone(S, o.tone ?? 'lat');
  const rh = o.rowH ?? Math.min(40 * kk(S), r.h / Math.max(1, n)), size = o.size ?? fz(S, 15);
  const lw = o.labelW ?? Math.max(...rows.map((x) => d.measure(x.label, { size, weight: 700 })), d.measure('oscuro', { size, weight: 700 })) + 12 * S.u;
  const pw = o.pctW ?? d.measure('100.0 %', { size: fz(S, 13), weight: 700, font: 'mono' }) + 8 * S.u;
  const pre = o.preW ?? 0;
  const x0 = r.x + lw + pre, x1 = r.x + r.w - pw, max = o.max ?? 1;
  const out: BarGeom[] = [];
  d.withAlpha(o.a ?? 1, () => {
    rows.forEach((row, i) => {
      const y = r.y + i * rh, a = row.a ?? 1, hot = row.hot ?? 0, cut = row.cut ?? 0;
      out.push({ y, h: rh, x0, x1, lx: r.x + lw - 8 * S.u, tx: r.x + r.w });
      if (a <= 0.01) return;
      d.withAlpha(a, () => {
        const bh = rh * 0.56, by = y + (rh - bh) / 2, bw = Math.max(0, (x1 - x0) * clamp(row.p / max));
        d.text(row.label, r.x + lw - 8 * S.u, y + rh / 2, { size, weight: hot > 0.5 ? 800 : 650, color: hot > 0.5 ? p.ink : p.ink2, align: 'right', base: 'middle', a: 1 - 0.55 * cut });
        d.rect(x0, by, x1 - x0, bh, { fill: p.surface2, r: 2, a: 1 - 0.5 * cut });
        if (bw > 0.5) d.rect(x0, by, bw, bh, { fill: alpha(t.c, (0.5 + 0.45 * hot) * (1 - 0.7 * cut)), r: 2 });
        if (hot > 0.01) d.rect(x0 - 2, by - 2, Math.max(bw, 6 * S.u) + 4, bh + 4, { stroke: p.ink, lw: 2, r: 3, a: hot });
        d.text(row.text ?? pct(S, row.p), r.x + r.w, y + rh / 2, { size: fz(S, 13), weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle', a: 1 - 0.6 * cut });
        if (cut > 0.01) {
          const tw = d.measure(row.label, { size, weight: 650 });
          d.line(r.x + lw - 10 * S.u - tw, y + rh / 2, r.x + lw - 6 * S.u, y + rh / 2, p.ink2, 2, undefined, cut);
        }
        if (row.pre) d.text(row.pre, r.x + lw + pre - 10 * S.u, y + rh / 2, { size: fz(S, 13), weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'right', base: 'middle' });
      });
    });
  });
  return out;
}

// ═════════ la franja del sorteo (de 0 a 100 %) ═════════
export function franja(S: Frame, r: Rect, items: { label: string; p: number }[], o: { a?: number; hot?: number; counts?: number[]; countsA?: number } = {}): [number, number][] {
  const { d, pal: p } = S, t = tone(S, 'lat'), out: [number, number][] = [];
  let acc = 0;
  d.withAlpha(o.a ?? 1, () => {
    items.forEach((it, i) => {
      const xa = r.x + r.w * acc, xb = r.x + r.w * (acc + it.p);
      out.push([xa, xb]);
      const hot = o.hot === i;
      d.rect(xa, r.y, xb - xa, r.h, { fill: alpha(t.c, hot ? 0.6 : [0.42, 0.28, 0.18, 0.1][i % 4]), stroke: t.c, lw: 1.5 });
      const size = fz(S, 13), lab = it.label, w = d.measure(lab, { size, weight: 700 });
      if (w + 8 * S.u < xb - xa) d.text(lab, (xa + xb) / 2, r.y + r.h / 2, { size, weight: 700, color: t.ink, align: 'center', base: 'middle' });
      else {   // no cabe dentro: debajo, en dos alturas para no encimarse
        const ly = r.y + r.h + (i % 2 ? 26 : 8) * kk(S);
        d.line((xa + xb) / 2, r.y + r.h, (xa + xb) / 2, ly, p.line, 1);
        d.text(lab, (xa + xb) / 2, ly + 2, { size, weight: 700, color: t.ink, align: 'center', base: 'top' });
      }
      acc += it.p;
    });
    // escala 0 % y 100 %
    label(S, S.lang === 'es' ? '0 %' : '0%', r.x, r.y - 4 * S.u, { size: fz(S, 12), color: p.mute, align: 'left', base: 'bottom' });
    label(S, S.lang === 'es' ? '100 %' : '100%', r.x + r.w, r.y - 4 * S.u, { size: fz(S, 12), color: p.mute, align: 'right', base: 'bottom' });
  });
  return out;
}

// ═════════ el bucle de cuatro pasos ═════════
export const LOOP_LABELS = {
  es: ['mirar la última palabra', 'sacar sus barras', 'elegir una', 'agregarla al texto'],
  en: ['look at the last word', 'pull up its bars', 'pick one', 'append it'],
};
/** Bucle: 4 nodos en ciclo. `active` resalta un paso (−1 ninguno); `shown` cuántos nodos se ven (fraccionario). */
export function loopDiagram(S: Frame, r: Rect, active: number, o: { a?: number; shown?: number; labels?: string[]; sub?: (i: number) => string | undefined } = {}) {
  const { d, pal: p } = S, k = kk(S), labels = o.labels ?? LOOP_LABELS[S.lang], shown = o.shown ?? 4, sig = tone(S, 'sig');
  const row = r.w / r.h > 2.8;
  const size = fz(S, 13);
  let nodes: Rect[];
  if (row) {
    const gap = 16 * k, w = (r.w - 3 * gap) / 4, h = Math.min(r.h * 0.62, 50 * k);
    nodes = [0, 1, 2, 3].map((i) => ({ x: r.x + i * (w + gap), y: r.y, w, h }));
  } else {
    const w = Math.min(r.w * 0.44, 190 * k), h = Math.min(r.h * 0.34, 52 * k);
    const xs = [r.x + r.w * 0.25 - w / 2, r.x + r.w * 0.75 - w / 2], ys = [r.y + r.h * 0.2 - h / 2, r.y + r.h * 0.8 - h / 2];
    nodes = [{ x: xs[0], y: ys[0], w, h }, { x: xs[1], y: ys[0], w, h }, { x: xs[1], y: ys[1], w, h }, { x: xs[0], y: ys[1], w, h }];
  }
  d.withAlpha(o.a ?? 1, () => {
    nodes.forEach((n, i) => {
      const a = clamp(shown - i); if (a <= 0.01) return;
      const on = Math.abs(active - i) < 0.5 ? 1 : 0;
      d.withAlpha(a, () => {
        d.rect(n.x, n.y, n.w, n.h, { fill: on ? alpha(sig.c, 0.22) : p.surface, stroke: on ? sig.c : p.lineStrong, lw: on ? 2.2 : 1.5, r: 5 });
        const lines = d.wrap(labels[i], n.w - 14 * S.u, { size, weight: 700 });
        const lh = size * S.u * 1.2, y0 = n.y + n.h / 2 - ((lines.length - 1) * lh) / 2;
        lines.forEach((ln, j) => d.text(ln, n.x + n.w / 2, y0 + j * lh, { size, weight: 700, color: on ? sig.ink : p.ink, align: 'center', base: 'middle' }));
        const sub = o.sub?.(i);
        if (sub) label(S, sub, n.x + n.w / 2, n.y + n.h + 4 * S.u, { size: fz(S, 12), color: tone(S, 'w').ink, weight: 700 });
      });
    });
    // flechas: 1 → 2 → 3 → 4 → 1
    const arr = (a: Rect, b: Rect, vis: number) => {
      if (vis <= 0.01) return;
      const ac = [a.x + a.w / 2, a.y + a.h / 2], bc = [b.x + b.w / 2, b.y + b.h / 2];
      const hz = Math.abs(bc[0] - ac[0]) > Math.abs(bc[1] - ac[1]);
      const gap = 5 * S.u;
      const x1 = hz ? (bc[0] > ac[0] ? a.x + a.w + gap : a.x - gap) : ac[0], y1 = hz ? ac[1] : bc[1] > ac[1] ? a.y + a.h + gap : a.y - gap;
      const x2 = hz ? (bc[0] > ac[0] ? b.x - gap : b.x + b.w + gap) : bc[0], y2 = hz ? bc[1] : bc[1] > ac[1] ? b.y - gap : b.y + b.h + gap;
      d.arrow(x1, y1, x2, y2, p.ink2, 1.8, 8 * S.u, vis);
    };
    for (let i = 0; i < 3; i++) arr(nodes[i], nodes[i + 1], clamp(shown - i - 1));
    const back = clamp(shown - 3.4);
    if (back > 0.01) {
      if (row) {   // vuelta por debajo
        const a = nodes[3], b = nodes[0], y = a.y + a.h + 14 * k;
        d.polyline([[a.x + a.w / 2, a.y + a.h + 3], [a.x + a.w / 2, y], [b.x + b.w / 2, y]], p.ink2, 1.8, { a: back });
        d.arrow(b.x + b.w / 2, y, b.x + b.w / 2, b.y + b.h + 4, p.ink2, 1.8, 8 * S.u, back);
      } else arr(nodes[3], nodes[0], back);
    }
  });
  return nodes;
}

// ═════════ chips de palabras (sorteos, dardos) ═════════
export function chip(S: Frame, x: number, y: number, text: string, o: { a?: number; tone?: Tone; size?: number; h?: number; hot?: boolean } = {}): number {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), size = o.size ?? fz(S, 13), h = (o.h ?? 26) * kk(S);
  const w = d.measure(text, { size, weight: 700 }) + 14 * S.u;
  if ((o.a ?? 1) > 0.01) d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(t.c, o.hot ? 0.45 : 0.16), stroke: t.c, lw: 1.3, r: 4 });
    d.text(text, x + w / 2, y + h / 2, { size, weight: 700, color: o.hot ? p.ink : t.ink, align: 'center', base: 'middle' });
  });
  return w;
}
/** Fila de chips con salto de renglón; devuelve la altura usada. */
export function chipRow(S: Frame, x: number, y: number, maxW: number, items: string[], o: { shown?: number; tone?: Tone; size?: number; center?: boolean } = {}): number {
  const d = S.d, size = o.size ?? fz(S, 13), h = 26 * kk(S), gap = 6 * S.u;
  const ws = items.map((t) => d.measure(t, { size, weight: 700 }) + 14 * S.u);
  const rows: number[][] = [[]]; let cx = 0;
  ws.forEach((w, i) => { if (cx + w > maxW && cx > 0) { rows.push([]); cx = 0; } rows[rows.length - 1].push(i); cx += w + gap; });
  rows.forEach((rw, j) => {
    const tot = rw.reduce((a, i) => a + ws[i] + gap, -gap);
    let xx = o.center ? x + (maxW - tot) / 2 : x;
    rw.forEach((i) => { chip(S, xx, y + j * (h + gap), items[i], { a: clamp((o.shown ?? items.length) - i), tone: o.tone, size }); xx += ws[i] + gap; });
  });
  return rows.length * (h + gap) - gap;
}
