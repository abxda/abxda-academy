// Piezas de dibujo propias de la lección «RAG». El kit no trae texto con resaltado ni tarjetas de fragmento; se implementan
// aquí con las primitivas de `draw` y los tonos del tema (nunca colores literales).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { wordStem, type Chunk } from './ir';

/** Tamaño de texto que garantiza ≥ 12,5 px efectivos (el escenario escala `size` por S.u). */
/** Ampliación del texto en escenarios grandes (escritorio ancho) para aprovechar el espacio. */
export const zoom = (S: Frame) => (S.portrait ? clamp(S.H / 470, 1, 1.12) : clamp(S.H / 390, 1, 1.45));
export const fz = (S: Frame, n = 13) => Math.max(n * zoom(S), 12.5 / S.u);
export const lh = (S: Frame, size: number) => size * S.u * 1.32;

/** Fragmento → «Garantía §2». */
export const srcLabel = (c: Chunk) => `${c.title} §${c.n}`;
/** Versión corta para espacios estrechos: primera palabra del título + número de párrafo. */
export const srcShort = (c: Chunk) => `${c.title.split(' ')[0]} §${c.n}`;

// ── texto con resaltado y ajuste de línea ─────────────────────────────────
export interface Tok { t: string; color?: string; weight?: number; bg?: string; ul?: string; uld?: boolean; mono?: boolean; tag?: { fill: string; stroke: string; ink: string } }
interface Placed { k: Tok; x: number; y: number; w: number }
export interface Flow { items: Placed[]; h: number; lines: number; lh: number; size: number }
const cache = new Map<string, Flow>();

/** Coloca palabras en líneas dentro de un ancho `w`. Si pasa de `maxLines`, corta y añade «…». Se guarda en caché por `key`. */
export function flow(S: Frame, key: string, toks: Tok[], w: number, size: number, o: { weight?: number; maxLines?: number } = {}): Flow {
  const ck = `${S.lang}|${S.pal.dark ? 'd' : 'l'}|${key}|${Math.round(w)}|${size.toFixed(2)}|${S.u.toFixed(3)}|${o.weight ?? 500}|${o.maxLines ?? 0}`;
  const hit = cache.get(ck); if (hit) return hit;
  const { d } = S, weight = o.weight ?? 500, sp = d.measure(' ', { size, weight }), L = lh(S, size);
  let x = 0, line = 0; const items: Placed[] = [];
  for (const k of toks) {
    const wd = d.measure(k.t, { size, weight: k.weight ?? weight, font: k.mono ? 'mono' : undefined }) + (k.tag ? 8 * S.u : 0);
    if (x > 0 && x + wd > w) { x = 0; line++; }
    items.push({ k, x, y: line * L, w: wd }); x += wd + sp;
  }
  let lines = line + 1, out = items;
  if (o.maxLines && lines > o.maxLines) {
    out = items.filter((it) => it.y < o.maxLines! * L - 1); lines = o.maxLines;
    const ew = d.measure('…', { size, weight });
    let last = out[out.length - 1];
    while (out.length > 1 && last.x + last.w + ew > w) { out.pop(); last = out[out.length - 1]; }
    out = [...out, { k: { t: '…', color: S.pal.mute }, x: last.x + last.w + 1, y: last.y, w: ew }];
  }
  const f = { items: out, h: lines * L, lines, lh: L, size };
  if (cache.size > 400) cache.clear();
  cache.set(ck, f); return f;
}

export function drawFlow(S: Frame, f: Flow, x: number, y: number, o: { color?: string; weight?: number; a?: number } = {}) {
  const { d, pal: p } = S, weight = o.weight ?? 500;
  d.withAlpha(o.a ?? 1, () => {
    for (const it of f.items) {
      const k = it.k, ty = y + it.y + f.lh / 2;
      if (k.bg) d.rect(x + it.x - 2 * S.u, y + it.y + 1, it.w + 4 * S.u + 1, f.lh - 2, { fill: k.bg });
      if (k.tag) {
        d.rect(x + it.x, y + it.y + 2, it.w, f.lh - 4, { fill: k.tag.fill, stroke: k.tag.stroke, lw: 1, r: 3 });
        d.text(k.t, x + it.x + it.w / 2, ty, { size: f.size, weight: 800, color: k.tag.ink, align: 'center', base: 'middle', font: k.mono ? 'mono' : undefined });
      } else d.text(k.t, x + it.x, ty, { size: f.size, weight: k.weight ?? weight, color: k.color ?? o.color ?? p.ink, base: 'middle', font: k.mono ? 'mono' : undefined });
      if (k.ul) d.line(x + it.x, y + it.y + f.lh - 2, x + it.x + it.w, y + it.y + f.lh - 2, k.ul, 1.5, k.uld ? [3, 2] : undefined);
    }
  });
}

/** Palabras de un texto como fichas. Las que comparten raíz con `hit` se resaltan; las de la oración `trap` se marcan como trampa. */
export function toks(S: Frame, text: string, o: { hit?: Set<string>; trap?: string; hitTone?: Tone } = {}): Tok[] {
  const p = S.pal, ht = tone(S, o.hitTone ?? 'lat'), er = tone(S, 'err');
  const out: Tok[] = [];
  const parts = o.trap && text.includes(o.trap) ? [text.slice(0, text.indexOf(o.trap)), o.trap, text.slice(text.indexOf(o.trap) + o.trap.length)] : [text];
  parts.forEach((part, pi) => {
    const isTrap = !!o.trap && part === o.trap && pi === 1;
    for (const w of part.split(/\s+/).filter(Boolean)) {
      if (isTrap) out.push({ t: w, color: er.ink, weight: 700, bg: alpha(er.c, 0.14) });
      else if (o.hit && o.hit.has(wordStem(w, S.lang as 'es' | 'en'))) out.push({ t: w, color: ht.ink, weight: 800, ul: ht.c });
      else out.push({ t: w, color: p.ink });
    }
  });
  return out;
}

// ── tarjeta de fragmento ──────────────────────────────────────────────────
export interface CardOpts { rank?: number | string; score?: string; hit?: Set<string>; tone?: Tone; a?: number; trap?: string; dashed?: boolean; subtle?: boolean; badge?: { text: string; tone: Tone }; textColor?: string }

/** Tarjeta con encabezado (puesto, fuente, puntuación) y el texto del fragmento con las palabras coincidentes resaltadas. */
export function chunkCard(S: Frame, r: Rect, ch: Chunk, o: CardOpts = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'lat'), sz = fz(S, 13), pad = 7 * u;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: o.subtle ? alpha(t.c, 0.5) : t.c, lw: 1.5, r: 4, dash: o.dashed ? [5, 4] : undefined });
    const hh = lh(S, sz) + 2 * u, hy = r.y + pad + hh / 2 - 1;
    let hx = r.x + pad;
    if (o.rank !== undefined) {
      const rr = hh * 0.5;
      d.circle(hx + rr, hy, rr, { fill: t.c });
      d.text(String(o.rank), hx + rr, hy, { size: sz * 0.92, weight: 800, color: p.stage, align: 'center', base: 'middle' });
      hx += rr * 2 + 6 * u;
    }
    const scoreW = o.score ? d.measure(o.score, { size: sz, weight: 700, font: 'mono' }) + 6 * u : 0;
    const badgeW = o.badge ? d.measure(o.badge.text, { size: sz * 0.92, weight: 800 }) + 14 * u : 0;
    const maxTitle = r.x + r.w - pad - scoreW - badgeW - hx;
    d.text(fit(S, srcLabel(ch), maxTitle, sz, 800), hx, hy, { size: sz, weight: 800, color: t.ink, base: 'middle' });
    if (o.score) d.text(o.score, r.x + r.w - pad, hy, { size: sz, weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
    if (o.badge) {
      const bt = tone(S, o.badge.tone), bx = r.x + r.w - pad - scoreW - badgeW + 4 * u;
      d.rect(bx, hy - hh * 0.42, badgeW - 6 * u, hh * 0.84, { fill: bt.soft, stroke: bt.c, lw: 1, r: 3 });
      d.text(o.badge.text, bx + (badgeW - 6 * u) / 2, hy, { size: sz * 0.92, weight: 800, color: bt.ink, align: 'center', base: 'middle' });
    }
    const ty = r.y + pad + hh + 3 * u, avail = r.y + r.h - pad - ty, lines = Math.max(1, Math.floor(avail / lh(S, sz)));
    if (avail >= lh(S, sz) * 0.9) {
      const f = flow(S, `${ch.id}|${[...(o.hit ?? [])].sort().join(',')}|${o.trap ? 1 : 0}`, toks(S, ch.text, { hit: o.hit, trap: o.trap, hitTone: o.tone === 'err' ? 'err' : 'lat' }), r.w - 2 * pad, sz, { maxLines: lines });
      drawFlow(S, f, r.x + pad, ty, { color: o.textColor });
    }
  });
}

/** Recorta un texto con «…» para que quepa en `w`. */
export function fit(S: Frame, text: string, w: number, size: number, weight = 600, font?: 'ui' | 'mono'): string {
  const { d } = S;
  if (d.measure(text, { size, weight, font }) <= w) return text;
  let s = text; while (s.length > 1 && d.measure(s + '…', { size, weight, font }) > w) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

/** Altura de una tarjeta que muestra `lines` líneas de texto. */
export const cardH = (S: Frame, lines: number) => { const sz = fz(S, 13); return 7 * S.u * 2 + lh(S, sz) + 2 * S.u + 3 * S.u + lines * lh(S, sz); };

// ── barra de etapas (dónde estamos en el recorrido) ───────────────────────
const STAGE_ES = ['Fragmentar', 'Vectorizar', 'Indexar', 'Recuperar', 'Reordenar', 'Armar prompt', 'Generar'];
const STAGE_EN = ['Chunk', 'Vectorize', 'Index', 'Retrieve', 'Rerank', 'Build prompt', 'Generate'];
export const stageName = (S: Frame, i: number) => (S.lang === 'es' ? STAGE_ES : STAGE_EN)[i];

/** 7 puntos (los 3 primeros son «preparar», los 4 últimos «por pregunta») y el nombre de la etapa activa. Ocupa ~18·u de alto. */
export function stageBar(S: Frame, x: number, y: number, w: number, active: number, a = 1) {
  const { d, pal: p } = S, u = S.u, sz = fz(S, 13);
  d.withAlpha(a, () => {
    const gap = 6 * u, s = 9 * u; let px = x;
    for (let i = 0; i < 7; i++) {
      const t = tone(S, i < 3 ? 'dat' : 'lat'), on = i === active, done = i < active;
      if (i === 3) px += 4 * u;
      d.rect(px, y + 4 * u - (on ? 2 * u : 0), s + (on ? 4 * u : 0), s + (on ? 4 * u : 0), { fill: on || done ? t.c : p.surface2, stroke: on ? p.ink : t.c, lw: on ? 1.5 : 1 });
      px += s + (on ? 4 * u : 0) + gap;
    }
    const lab = `${active + 1}/7 · ${stageName(S, active)}`;
    d.text(fit(S, lab, Math.max(40, x + w - px - 4 * u), sz, 700), px + 4 * u, y + 9 * u, { size: sz, weight: 700, color: p.ink2, base: 'middle' });
  });
  return 18 * u;
}

/** Etiqueta con fondo para rotular partes (se apoya en d.tag). */
export function tagAt(S: Frame, text: string, x: number, y: number, o: { tone?: Tone; align?: CanvasTextAlign; a?: number; mono?: boolean } = {}) {
  const t = tone(S, o.tone ?? 'ink');
  return S.d.tag(text, x, y, { color: o.tone ? t.ink : S.pal.ink2, fill: o.tone ? t.soft : S.pal.surface, stroke: o.tone ? t.c : S.pal.line, align: o.align, a: o.a, size: fz(S, 12.5), font: o.mono ? 'mono' : 'ui' });
}

/** Texto corto con ajuste de línea; devuelve el alto usado. */
export function para(S: Frame, text: string, x: number, y: number, w: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; a?: number; max?: number } = {}) {
  const sz = o.size ?? fz(S, 13), lines = S.d.wrap(text, w, { size: sz, weight: o.weight ?? 600 });
  const use = o.max ? lines.slice(0, o.max) : lines, L = lh(S, sz);
  use.forEach((ln, i) => S.d.text(i === use.length - 1 && o.max && lines.length > o.max ? fit(S, ln + ' …', w, sz, o.weight ?? 600) : ln, o.align === 'center' ? x + w / 2 : x, y + i * L + L / 2, { size: sz, weight: o.weight ?? 600, color: o.color ?? S.pal.ink, align: o.align, base: 'middle', a: o.a }));
  return use.length * L;
}

/** Coseno → ángulo en grados (para la brújula). */
export const angleDeg = (cos: number) => (Math.acos(clamp(cos, 0, 1)) * 180) / Math.PI;

/** Área útil del escenario con márgenes; si hay barra de etapas, deja su sitio arriba. */
export function area(S: Frame, withBar: boolean): Rect {
  const m = 12 * S.u, bar = withBar ? 24 * S.u : 0;
  return { x: m, y: m + bar, w: S.W - 2 * m, h: S.H - 2 * m - bar };
}

/** Pequeña pila de páginas (un documento). `lines` rayas de texto simuladas. */
export function page(S: Frame, x: number, y: number, w: number, h: number, o: { tone?: Tone; a?: number; lines?: number; dashed?: boolean; fold?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'dat'), n = o.lines ?? 3;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: p.surface, stroke: t.c, lw: 1.5, r: 2, dash: o.dashed ? [4, 3] : undefined });
    for (let i = 0; i < n; i++) d.rect(x + w * 0.16, y + h * 0.2 + (i * h * 0.6) / Math.max(1, n), w * (i === n - 1 ? 0.4 : 0.68), Math.max(1.5, h * 0.06), { fill: alpha(t.c, 0.55) });
  });
}

/** Una caja de flujo con su nombre (y un subtítulo opcional). */
export function node(S: Frame, r: Rect, label: string, o: { tone?: Tone; a?: number; active?: number; sub?: string; dashed?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), sz = fz(S, 13);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.28 * (o.active ?? 0)), stroke: o.tone ? t.c : p.lineStrong, lw: 1.5, r: 3, dash: o.dashed ? [5, 4] : undefined });
    const cy = r.y + r.h / 2;
    d.text(fit(S, label, r.w - 8 * S.u, sz, 800), r.x + r.w / 2, o.sub ? cy - lh(S, sz) * 0.32 : cy, { size: sz, weight: 800, color: o.tone ? t.ink : p.ink, align: 'center', base: 'middle' });
    if (o.sub) d.text(fit(S, o.sub, r.w - 8 * S.u, sz * 0.94, 600), r.x + r.w / 2, cy + lh(S, sz) * 0.7, { size: sz * 0.94, weight: 600, color: p.mute, align: 'center', base: 'middle' });
  });
}

/** Flecha entre dos puntos con progreso 0..1. */
export function arrow(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; k?: number; dashed?: boolean; lw?: number; a?: number } = {}) {
  const k = clamp(o.k ?? 1); if (k <= 0) return;
  const t = tone(S, o.tone ?? 'ink'), x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => {
    if (o.dashed) S.d.line(x1, y1, x, y, t.c, o.lw ?? 2, [5, 4]); else S.d.arrow(x1, y1, x, y, t.c, o.lw ?? 2, k > 0.97 ? 8 * S.u : 0.001);
  });
}
