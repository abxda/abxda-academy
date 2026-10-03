// Ayudas de dibujo propias de la lección «Atención» (el kit no las trae): tamaños de texto, flechas curvas entre fichas,
// celdas de vector, etiquetas que no se pisan y geometría de las vistas.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de texto para que el texto efectivo (tamaño × S.u) nunca baje de `px` píxeles. */
export const fs = (S: Frame, px: number) => px * Math.max(1, 1 / S.u);

/** Teléfono horizontal: muy bajo. */
export const isTiny = (S: Frame) => !S.portrait && S.H < 360;

export const pct = (S: Frame, x: number) => S.n(x * 100, 0);

/** Texto de un número con signo menos tipográfico y coma decimal en español (S.n usa es-MX, que escribe punto). */
export const num = (S: Frame, x: number, digits = 1) => {
  const s = S.n(x, digits).replace('-', '−');
  return S.lang === 'es' ? s.replace('.', ',') : s;
};

// ───────── flechas curvas entre fichas ─────────
export function arcBetween(S: Frame, a: Rect, b: Rect, o: { tone?: Tone; lw?: number; a?: number; dash?: number[]; head?: boolean; lift?: number; progress?: number } = {}): [number, number] {
  const c = tone(S, o.tone ?? 'sig').c, ctx = S.ctx, u = S.u;
  const sameRow = Math.abs(a.y - b.y) < a.h * 0.6;
  const ax = a.x + a.w / 2, bx = b.x + b.w / 2;
  let p0: [number, number], p1: [number, number], cp: [number, number];
  if (sameRow) {
    p0 = [ax, a.y]; p1 = [bx, b.y];
    const lift = o.lift ?? Math.min(80 * u, 16 * u + Math.abs(bx - ax) * 0.22);
    cp = [(ax + bx) / 2, a.y - lift * 2];
  } else {
    const up = b.y < a.y;
    p0 = [ax, up ? a.y : a.y + a.h]; p1 = [bx, up ? b.y + b.h : b.y];
    const side = (bx >= ax ? -1 : 1) * 36 * u;
    cp = [(ax + bx) / 2 + side, (p0[1] + p1[1]) / 2];
  }
  const k = clamp(o.progress ?? 1);
  const pt = (t: number): [number, number] => { const m = 1 - t; return [m * m * p0[0] + 2 * m * t * cp[0] + t * t * p1[0], m * m * p0[1] + 2 * m * t * cp[1] + t * t * p1[1]]; };
  if (k <= 0) return pt(0.5);
  ctx.save();
  ctx.globalAlpha *= o.a ?? 1; ctx.strokeStyle = c; ctx.lineWidth = o.lw ?? 2; ctx.lineCap = 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath(); ctx.moveTo(p0[0], p0[1]);
  const n = 28; for (let i = 1; i <= n; i++) { const q = pt((i / n) * k); ctx.lineTo(q[0], q[1]); }
  ctx.stroke(); ctx.restore();
  if (o.head !== false && k > 0.97) {
    const e = pt(1), f = pt(0.94), ang = Math.atan2(e[1] - f[1], e[0] - f[0]), hs = (7 + (o.lw ?? 2) * 0.6) * Math.max(0.9, u);
    S.d.polygon([[e[0], e[1]], [e[0] - Math.cos(ang - 0.5) * hs, e[1] - Math.sin(ang - 0.5) * hs], [e[0] - Math.cos(ang + 0.5) * hs, e[1] - Math.sin(ang + 0.5) * hs]], { fill: c, a: o.a });
  }
  return pt(0.5);
}

// ───────── celdas de un vector de dos números ─────────
/** Dos celdas con los números del vector. Devuelve el ancho total. */
export function vecCells(S: Frame, x: number, y: number, v: number[], o: { tone?: Tone; cw?: number; h?: number; a?: number; digits?: number; strong?: boolean; size?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), u = S.u;
  const cw = (o.cw ?? 32) * u, h = (o.h ?? 22) * u, gap = 2 * u;
  d.withAlpha(o.a ?? 1, () => {
    v.forEach((val, i) => {
      const cx = x + i * (cw + gap);
      d.rect(cx, y - h / 2, cw, h, { fill: alpha(t.c, o.strong ? 0.22 : 0.12), stroke: alpha(t.c, o.strong ? 0.9 : 0.55), lw: 1, r: 2 });
      d.text(num(S, val, o.digits ?? 1), cx + cw / 2, y, { size: o.size ?? fs(S, 12), font: 'mono', weight: 700, color: t.ink, align: 'center', base: 'middle' });
    });
  });
  void p;
  return v.length * cw + (v.length - 1) * gap;
}

// ───────── etiquetas que no se pisan ─────────
export interface LabelItem { x: number; y: number; r: number; text: string; prio: number; color: string; weight?: number; size?: number; ink?: string }
/** Coloca etiquetas junto a sus puntos probando varias posiciones; descarta la que no cabe sin pisar otra. Determinista. */
export function placeLabels(S: Frame, items: LabelItem[], bounds: Rect, avoid: Rect[] = []) {
  const { d } = S, placed: Rect[] = [...avoid];
  const dots = items.map((it) => ({ x: it.x - it.r - 1, y: it.y - it.r - 1, w: it.r * 2 + 2, h: it.r * 2 + 2 }));
  const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const order = items.map((_, i) => i).sort((i, j) => items[j].prio - items[i].prio);
  const out: { it: LabelItem; x: number; y: number; align: CanvasTextAlign }[] = [];
  for (const i of order) {
    const it = items[i], size = it.size ?? fs(S, 12), w = d.measure(it.text, { size, weight: it.weight ?? 700 }), h = size * S.u * 1.15, g = it.r + 3 * S.u;
    const cands: [number, number, CanvasTextAlign][] = [[g, 0, 'left'], [-g, 0, 'right'], [0, -g - h / 2, 'center'], [0, g + h / 2, 'center'], [g * 0.8, -h * 0.9, 'left'], [-g * 0.8, -h * 0.9, 'right'], [g * 0.8, h * 0.9, 'left'], [-g * 0.8, h * 0.9, 'right']];
    for (const [dx, dy, al] of cands) {
      const lx = al === 'left' ? it.x + dx : al === 'right' ? it.x + dx - w : it.x + dx - w / 2, ly = it.y + dy - h / 2;
      const r: Rect = { x: lx, y: ly, w, h };
      if (r.x < bounds.x || r.y < bounds.y || r.x + r.w > bounds.x + bounds.w || r.y + r.h > bounds.y + bounds.h) continue;
      if (placed.some((q) => hit(r, q))) continue;
      if (dots.some((q, k) => k !== i && hit(r, q))) continue;
      placed.push(r); out.push({ it, x: it.x + dx, y: it.y + dy, align: al }); break;
    }
  }
  out.forEach(({ it, x, y, align }) => d.text(it.text, x, y, { size: it.size ?? fs(S, 12), weight: it.weight ?? 700, color: it.ink ?? it.color, align, base: 'middle', halo: S.pal.stage, haloW: 4 }));
  return placed;
}

/** Rombo (los valores). */
export function diamond(S: Frame, x: number, y: number, r: number, o: { fill?: string; stroke?: string; a?: number; lw?: number } = {}) {
  S.d.polygon([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], { fill: o.fill, stroke: o.stroke, lw: o.lw, a: o.a });
}

/** Texto rotado (rótulos de columnas). */
export function textRot(S: Frame, str: string, x: number, y: number, angle: number, o: { size?: number; weight?: number; color?: string; align?: CanvasTextAlign; font?: 'ui' | 'mono' } = {}) {
  const c = S.ctx; c.save(); c.translate(x, y); c.rotate(angle);
  S.d.text(str, 0, 0, { size: o.size ?? fs(S, 12), weight: o.weight ?? 700, color: o.color ?? S.pal.ink2, align: o.align ?? 'left', base: 'middle', font: o.font });
  c.restore();
}

/** Aparece/desaparece una vista entre el inicio de `from` y el inicio de `to` (con fundidos de 0,9 s). */
export const actAlpha = (S: Frame, from: string, to?: string) => {
  if (!S.on(from)) return 0;
  const a = S.at(from, 0, 0.9), b = to ? S.at(to, 0, 0.9) : 0;
  return a * (1 - b);
};
