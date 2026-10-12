// La zona lateral (escritorio) o inferior (teléfono): los dos jugadores como una tubería
//   sorteo z → [generador] → dato x → [discriminador] → respuesta (0 a 1)
// En horizontal (columna lateral) la tubería va de arriba abajo; en vertical (franja inferior), de izquierda a derecha.
// Después, durante la partida, la misma zona muestra las lecturas (paso, promedios del detective, conteos).
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { fit, fz, kk, num } from './helpers';

export type PipeMode = 'column' | 'row' | 'compact';
export interface Pipe { bell: Rect; G: Rect; chip: Rect; D: Rect; gauge: Rect; mode: PipeMode; vertical: boolean }

/** Geometría de la tubería dentro de r: columna (escritorio y tablet), fila (teléfono vertical) o compacta (teléfono horizontal, muy bajo). */
export function pipeGeom(S: Frame, r: Rect): Pipe {
  const k = kk(S);
  if (!S.portrait && r.h >= 250 * k) {
    const cx = r.x + r.w / 2, bw = Math.min(r.w - 24 * k, 176 * k);
    const hs = [50 * k, 46 * k, 28 * k, 46 * k, 30 * k];
    const sum = hs.reduce((a, b) => a + b, 0), g = clamp((r.h * 0.9 - sum) / 4, 12 * k, 34 * k);
    let y = r.y + Math.max(0, (r.h - sum - 4 * g) / 2);
    const ws = [Math.min(bw, 120 * k), bw, Math.min(bw, 86 * k), bw, Math.min(bw, 130 * k)];
    const rs = hs.map((h, i) => { const o = { x: cx - ws[i] / 2, y, w: ws[i], h }; y += h + g; return o; });
    return { bell: rs[0], G: rs[1], chip: rs[2], D: rs[3], gauge: rs[4], mode: 'column', vertical: true };
  }
  if (!S.portrait) {
    // compacta (teléfono horizontal): sorteo → generador ↓ dato ↓ discriminador → respuesta
    // así queda libre la izquierda del discriminador (entran los reales) y la derecha del generador (vuelve la respuesta)
    const g = 8 * k, hb = Math.min(32 * k, r.h * 0.27), hc = Math.min(24 * k, r.h * 0.2), wB = 48 * k, wGa = 46 * k;
    const wBox = Math.max(70 * k, Math.min(130 * k, r.w - wB - wGa - 2 * g - 6 * k));
    const x0 = r.x + Math.max(0, (r.w - (wB + wBox + wGa + 2 * g)) / 2), y0 = r.y + Math.max(0, (r.h - (2 * hb + hc + 2 * g)) / 2);
    const bell = { x: x0, y: y0, w: wB, h: hb }, G = { x: x0 + wB + g, y: y0, w: wBox, h: hb };
    const chip = { x: G.x + (wBox - 52 * k) / 2, y: y0 + hb + g, w: 52 * k, h: hc };
    const D = { x: G.x, y: chip.y + hc + g, w: wBox, h: hb }, gauge = { x: D.x + wBox + g, y: D.y, w: wGa, h: hb };
    return { bell, G, chip, D, gauge, mode: 'compact', vertical: false };
  }
  // teléfono vertical: una fila; deja abajo espacio para la flecha de respuesta
  const g = 7 * k, h = Math.min(46 * k, r.h * 0.42);
  const wb = 46 * k, wc = 42 * k, wg = 46 * k, wbox = Math.max(56 * k, (r.w - wb - wc - wg - 4 * g) / 2);
  const total = wb + wc + wg + 2 * wbox + 4 * g;
  let x = r.x + (r.w - total) / 2;
  const y = r.y + Math.max(18 * k, r.h * 0.2);
  const mk = (w: number) => { const o = { x, y, w, h }; x += w + g; return o; };
  const bell = mk(wb), G = mk(wbox), chip = mk(wc), D = mk(wbox), gauge = mk(wg);
  return { bell, G, chip, D, gauge, mode: 'row', vertical: false };
}

const mid = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];

/** Flecha de la salida de a a la entrada de b: hacia abajo si b está debajo de a; si no, hacia la derecha. */
export function flow(S: Frame, P: Pipe, a: Rect, b: Rect, o: { tone?: Tone; a?: number; label?: string } = {}) {
  if ((o.a ?? 1) < 0.01) return;
  const k = kk(S), c = o.tone ? tone(S, o.tone).c : S.pal.lineStrong;
  const [ax, ay] = mid(a), [bx, by] = mid(b);
  if (b.y >= a.y + a.h - 1) S.d.arrow(ax, a.y + a.h + 2 * k, bx, b.y - 2 * k, c, 2, 7 * k, o.a ?? 1);
  else S.d.arrow(a.x + a.w + 2 * k, ay, b.x - 2 * k, by, c, 2, 7 * k, o.a ?? 1);
}

/** Caja de un jugador: nombre técnico arriba y apodo debajo (el texto se achica si no cabe). */
export function playerBox(S: Frame, r: Rect, name: string, nick: string, t: Tone, o: { a?: number; hot?: number } = {}) {
  const { d, pal: p } = S, tc = tone(S, t), k = kk(S);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tc.c, 0.1 + 0.3 * (o.hot ?? 0)), stroke: tc.c, lw: 1.5 + 1.5 * (o.hot ?? 0), r: 4 });
    // si el nombre no cabe ni en 12 px, se aligera la letra; el apodo se omite si no cabe
    const avail = r.w - 6 * k, w1 = d.measure(name, { size: 12 / S.u, weight: 700 }) > avail ? 600 : 700;
    const s1 = fit(S, name, avail, 14, w1), s2 = fit(S, nick, avail, 12, 600);
    const two = r.h >= (s1 + s2) * S.u * 1.15 && d.measure(nick, { size: s2, weight: 600 }) <= avail;
    if (two) {
      d.text(name, r.x + r.w / 2, r.y + r.h / 2 - 1 * k, { size: s1, weight: w1, color: tc.ink, align: 'center', base: 'bottom' });
      d.text(nick, r.x + r.w / 2, r.y + r.h / 2 + 2 * k, { size: s2, weight: 600, color: p.ink2, align: 'center', base: 'top' });
    } else d.text(name, r.x + r.w / 2, r.y + r.h / 2, { size: s1, weight: w1, color: tc.ink, align: 'center', base: 'middle' });
  });
}

/** Campana estándar en miniatura, con un punto opcional en z. */
export function bellGlyph(S: Frame, r: Rect, o: { a?: number; z?: number | null; zA?: number; zText?: string; many?: number; label?: string; labelA?: number } = {}) {
  const { d, pal: p } = S, lt = tone(S, 'lat'), k = kk(S);
  d.withAlpha(o.a ?? 1, () => {
    const x0 = r.x + 4 * k, x1 = r.x + r.w - 4 * k, base = r.y + r.h - 6 * k, top = r.y + 8 * k;
    const X = (z: number) => lerp(x0, x1, (z + 3) / 6), Y = (z: number) => lerp(base, top, Math.exp(-z * z / 2));
    const pts: [number, number][] = []; for (let i = 0; i <= 40; i++) { const z = -3 + (6 * i) / 40; pts.push([X(z), Y(z)]); }
    d.polygon([[x0, base], ...pts, [x1, base]], { fill: alpha(lt.c, 0.14) });
    d.polyline(pts, lt.c, 2);
    d.line(x0, base, x1, base, p.lineStrong, 1.2);
    if (o.many) for (let i = 0; i < 24; i++) { const z = -2.2 + (4.4 * (i + 0.5)) / 24; d.circle(X(z), base - 3 * k, 1.8 * k, { fill: lt.c, a: o.many }); }
    if (o.z != null && (o.zA ?? 0) > 0.01) {
      d.line(X(o.z), base, X(o.z), Y(o.z), lt.c, 2, undefined, o.zA);
      d.circle(X(o.z), Y(o.z), 4.5 * k, { fill: lt.c, stroke: p.stage, lw: 1.5, a: o.zA });
      // el valor sorteado: a la derecha del punto en la columna lateral; debajo de la campana en el teléfono
      if (o.zText) {
        if (S.portrait) d.text(o.zText, X(o.z), base + 3 * k, { size: fz(S, 12), weight: 800, font: 'mono', color: lt.ink, align: 'center', base: 'top', a: o.zA });
        else d.text(o.zText, X(o.z) + 8 * k, Y(o.z) - 2 * k, { size: fz(S, 12), weight: 800, font: 'mono', color: lt.ink, base: 'bottom', a: o.zA });
      }
    }
    if (o.label) d.text(o.label, (x0 + x1) / 2, r.y - 1 * k, { size: fz(S, 12), weight: 700, color: lt.ink, align: 'center', base: 'bottom', a: o.labelA ?? 1 });
  });
}

/** Ficha con un número (el dato que viaja por la tubería). */
export function chip(S: Frame, r: Rect, text: string, o: { a?: number; tone?: Tone; caption?: string; below?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), k = kk(S);
  d.withAlpha(o.a ?? 1, () => {
    const h = Math.min(r.h, 28 * k), y = r.y + (r.h - h) / 2;
    d.rect(r.x, y, r.w, h, { fill: p.surface, stroke: t.c, lw: 1.5, r: 3 });
    d.text(text, r.x + r.w / 2, y + h / 2, { size: fit(S, text, r.w - 6 * k, 14, 700, 'mono'), weight: 700, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
    if (o.caption) d.text(o.caption, r.x + r.w / 2, o.below ? y + h + 3 * k : y - 3 * k, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: o.below ? 'top' : 'bottom' });
  });
}

/** Medidor 0–1 de la respuesta del detective, con marca en 0.5. */
export function gaugeGlyph(S: Frame, r: Rect, v: number | null, o: { a?: number; caption?: string; below?: boolean } = {}) {
  const { d, pal: p } = S, sg = tone(S, 'sig'), k = kk(S);
  d.withAlpha(o.a ?? 1, () => {
    const h = Math.min(r.h, 30 * k), y = r.y + (r.h - h) / 2, bh = 8 * k, by = y + h - bh - 2 * k;
    d.rect(r.x, by, r.w, bh, { fill: p.surface2, stroke: p.line, lw: 1, r: 2 });
    d.line(r.x + r.w / 2, by - 3 * k, r.x + r.w / 2, by + bh + 3 * k, p.mute, 1.2);
    if (v != null) {
      d.rect(r.x, by, r.w * clamp(v), bh, { fill: sg.c, r: 2 });
      const s = num(S, v, 2);
      d.text(s, r.x + r.w / 2, by - 4 * k, { size: fit(S, s, r.w, 14, 800, 'mono'), weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'bottom' });
    } else d.text('?', r.x + r.w / 2, by - 4 * k, { size: 14, weight: 800, font: 'mono', color: p.mute, align: 'center', base: 'bottom' });
    if (o.caption) d.text(o.caption, r.x + r.w / 2, o.below === false ? y - 3 * k : by + bh + 4 * k, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: o.below === false ? 'bottom' : 'top' });
  });
}

/** Barra horizontal 0–1 con su rótulo completo y el valor (lecturas del detective durante la partida). */
export function meter(S: Frame, x: number, y: number, w: number, name: string, v: number, t: Tone, o: { a?: number } = {}) {
  const { d, pal: p } = S, tc = tone(S, t), k = kk(S), bh = 9 * k;
  d.withAlpha(o.a ?? 1, () => {
    const vs = num(S, v, 2), vw = d.measure(vs, { size: 14, weight: 800, font: 'mono' }) + 8 * k;
    d.text(name, x, y, { size: fit(S, name, w - vw, 12.5, 700), weight: 700, color: p.ink2, base: 'top' });
    d.text(vs, x + w, y, { size: 14, weight: 800, font: 'mono', color: tc.ink, align: 'right', base: 'top' });
    const by = y + 18 * k;
    d.rect(x, by, w, bh, { fill: p.surface2, stroke: p.line, lw: 1, r: 2 });
    d.rect(x, by, w * clamp(v), bh, { fill: alpha(tc.c, 0.85), r: 2 });
    d.line(x + w / 2, by - 3 * k, x + w / 2, by + bh + 3 * k, p.ink, 1.5);
  });
  return 18 * k + bh + 12 * k;
}

