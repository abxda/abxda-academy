// Piezas de dibujo propias de esta lección (el kit no trae cintas de texto, tablas de puntuaciones ni franjas de
// probabilidad). Todo pide roles de color a tone()/S.pal: nada de hex. Todo es puro: solo lee sus argumentos.
import { alpha, clamp, tone, Plot, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { isPunct, type Model, type Prob } from './lm';

/** Tamaño de texto con mínimo de 12 px efectivos (d.text ya multiplica por S.u). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
export const pct = (S: Frame, p: number, digits = 1) => `${S.n(p * 100, digits)} %`;
/** Cómo se rotula una pieza en barras y tablas: las palabras tal cual, los signos entre comillas. */
export const lab = (S: Frame, m: Model, w: string) => (isPunct(w) ? S.l(`«${w}»`, `“${w}”`) : m.show(w));

// ═════════════ cinta de texto ═════════════
export interface RibOpts {
  tokens: string[];
  /** Cuántas piezas finales son el contexto del modelo (se resaltan). */
  k?: number;
  /** Cuántas piezas se ven (fraccionario: la última aparece poco a poco). Por defecto, todas. */
  reveal?: number;
  cursor?: boolean;
  newest?: boolean;
  label?: string;
  /** Subraya un tramo de piezas (por ejemplo, un ciclo). */
  mark?: [number, number];
  a?: number;
  size?: number;
}
export interface RibPos { x: number; y: number; w: number; h: number }

export function ribbon(S: Frame, m: Model, r: Rect, o: RibOpts): { pos: RibPos[] } {
  const { d, pal: p } = S, u = S.u, pad = 10 * u, size = o.size ?? (S.portrait ? 19 : 23);
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), err = tone(S, 'err');
  const lh = size * 1.45 * u, labH = o.label ? fz(S, 12) * u * 1.6 : 0;
  const sp = d.measure(' ', { size, weight: 600 }), maxW = r.w - 2 * pad - 20 * u;
  const toks = o.tokens, n = toks.length;
  // composición: una pieza tras otra, con salto de línea; los signos van pegados a la palabra anterior
  const lay: { x: number; line: number; w: number; s: string }[] = [];
  let x = 0, line = 0;
  toks.forEach((t, i) => {
    const s = m.show(t, i === 0 || toks[i - 1] === '.'), w = d.measure(s, { size, weight: 600 });
    const gap = i === 0 || isPunct(t) ? 0 : sp;
    if (x + gap + w > maxW && x > 0 && !isPunct(t)) { line++; lay.push({ x: 0, line, w, s }); x = w; return; }
    lay.push({ x: x + gap, line, w, s }); x += gap + w;
  });
  const lastLine = lay.length ? lay[lay.length - 1].line : 0;
  const cap = Math.max(1, Math.floor((r.h - 2 * pad - labH) / lh)), first = Math.max(0, lastLine - cap + 1);
  const y0 = r.y + pad + labH, off = first > 0 ? 18 * u : 0;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 4 });
    if (o.label) d.text(o.label, r.x + pad, r.y + 7 * u, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
    const k = o.k ?? 0, vis = o.reveal ?? n;
    if (first > 0) d.text('…', r.x + pad, y0 + lh * 0.5, { size, weight: 600, color: p.mute, base: 'middle' });
    lay.forEach((t, i) => {
      if (t.line < first) return;
      const a = clamp(vis - i); if (a <= 0) return;
      const tx = r.x + pad + t.x + (t.line === first ? off : 0), ty = y0 + (t.line - first) * lh;
      d.withAlpha(a, () => {
        if (i >= n - k) d.rect(tx - 3 * u, ty + 1, t.w + 6 * u, lh - 3, { fill: lat.soft, stroke: alpha(lat.c, 0.8), lw: 1, r: 3 });
        if (o.newest && i === n - 1 && i > 0) d.rect(tx - 3 * u, ty + 1, t.w + 6 * u, lh - 3, { fill: dat.soft, stroke: dat.c, lw: 1.5, r: 3 });
        d.text(t.s, tx, ty + lh / 2, { size, weight: 600, color: p.ink, base: 'middle' });
      });
    });
    if (o.mark) {
      for (let i = o.mark[0]; i <= o.mark[1] && i < lay.length; i++) {
        const t = lay[i]; if (t.line < first || i >= vis) continue;
        const tx = r.x + pad + t.x + (t.line === first ? off : 0), ty = y0 + (t.line - first) * lh + lh - 1;
        d.line(tx, ty, tx + t.w, ty, err.c, 2.5, [5, 3]);
      }
    }
    if (o.cursor && lay.length) {
      const t = lay[Math.min(lay.length - 1, Math.max(0, Math.ceil(vis) - 1))];
      if (Math.sin(S.clock * 6) > -0.4 && t.line >= first) d.rect(r.x + pad + t.x + (t.line === first ? off : 0) + t.w + 6 * u, y0 + (t.line - first) * lh + 4, 2.5 * u, lh - 8, { fill: p.ink });
    }
  });
  return { pos: lay.map((t) => ({ x: r.x + pad + t.x + (t.line === first ? off : 0), y: y0 + (t.line - first) * lh, w: t.w, h: lh })) };
}

// ═════════════ barras ═════════════
export interface BarRow { label: string; v: number; txt: string; c?: number; hot?: boolean; cut?: boolean; mute?: boolean; after?: string }
export interface BarsOpts {
  /** Aparición progresiva: cuántas filas ya se ven (fraccionario). */
  show?: number;
  /** Eje: la barra llena equivale a este valor (por defecto 1 = 100 %). */
  axis?: number;
  /** Muestra la columna de cuentas (cuando las filas traen `c`). */
  counts?: boolean;
  tone?: Tone;
  a?: number;
  maxRowH?: number;
}

export function barRows(S: Frame, r: Rect, rows: BarRow[], o: BarsOpts = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'lat'), mt = tone(S, 'mute'), dt = tone(S, 'dat');
  const n = rows.length, rh = Math.min((o.maxRowH ?? 46) * u, r.h / Math.max(1, n));
  const fs = fz(S, 17), fv = fz(S, 15), hasAfter = rows.some((q) => q.after !== undefined);
  const lw = Math.min(128 * u, r.w * 0.33), cw = o.counts ? 36 * u : 0, aw = hasAfter ? 84 * u : 0, vw = 70 * u;
  const bx = r.x + lw + cw + 8 * u, bw = Math.max(20, r.x + r.w - aw - vw - bx - 6 * u), axis = o.axis ?? 1;
  rows.forEach((q, i) => {
    const y = r.y + i * rh, a = clamp((o.show ?? n) - i); if (a <= 0) return;
    const tc = q.mute ? mt : t, w = Math.max(1, bw * clamp(q.v / axis));
    d.withAlpha(a * (o.a ?? 1), () => {
      d.text(q.label, r.x + lw, y + rh / 2, { size: fs, weight: q.hot ? 800 : 600, color: q.cut ? p.mute : p.ink, align: 'right', base: 'middle' });
      if (o.counts && q.c !== undefined) d.text(String(q.c), r.x + lw + cw, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: dt.ink, align: 'right', base: 'middle' });
      d.rect(bx, y + rh * 0.16, bw, rh * 0.68, { fill: p.surface2 });
      if (q.cut) d.rect(bx, y + rh * 0.16, w, rh * 0.68, { stroke: p.mute, lw: 1.2, dash: [4, 3] });
      else d.rect(bx, y + rh * 0.16, w, rh * 0.68, { fill: q.hot ? (q.mute ? alpha(tc.c, 0.8) : tc.c) : alpha(tc.c, q.mute ? 0.45 : 0.6) });
      if (q.hot) d.rect(bx - 1.5, y + rh * 0.16 - 1.5, w + 3, rh * 0.68 + 3, { stroke: p.ink, lw: 1.5 });
      d.text(q.txt, bx + bw + 6 * u + vw - 4 * u, y + rh / 2, { size: fv, font: 'mono', weight: 600, color: q.cut ? p.mute : p.ink2, align: 'right', base: 'middle' });
      if (q.after !== undefined) d.text(q.after, r.x + r.w, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: q.cut ? p.mute : dt.ink, align: 'right', base: 'middle' });
    });
  });
  return { rowH: rh, bx, bw };
}

/** Filas de probabilidad a partir de una distribución: las `rows` más probables y una fila «otras». */
export function probRows(S: Frame, m: Model, ps: Prob[], o: { rows?: number; hot?: number; cut?: boolean; noOthers?: boolean; val?: (q: Prob) => number; fmt?: (q: Prob) => string } = {}): BarRow[] {
  const n = Math.min(o.rows ?? 6, ps.length), rest = ps.slice(n);
  const out: BarRow[] = ps.slice(0, n).map((q, i) => ({
    label: lab(S, m, q.w), v: o.val ? o.val(q) : q.p, txt: o.fmt ? o.fmt(q) : pct(S, q.p), c: q.c, hot: o.hot === i, cut: !!o.cut && !q.keep,
    after: o.cut ? (q.keep ? '→ ' + pct(S, q.q) : '—') : undefined,
  }));
  if (rest.length && !o.noOthers) {
    const sp = rest.reduce((a, x) => a + x.p, 0), sc = rest.reduce((a, x) => a + x.c, 0), sq = rest.reduce((a, x) => a + x.q, 0), kept = rest.some((x) => x.keep);
    out.push({ label: S.l(`otras (${rest.length})`, `others (${rest.length})`), v: o.val ? sc : sp, txt: o.fmt ? String(sc) : pct(S, sp), c: sc, mute: true, cut: !!o.cut && !kept, after: o.cut ? (kept ? '→ ' + pct(S, sq) : '—') : undefined });
  }
  return out;
}

/** Franja con un tramo por palabra: todas las probabilidades suman el 100 %. `marker` es el número sorteado. */
export function strip(S: Frame, r: Rect, ps: Prob[], o: { a?: number; marker?: number; prog?: number; label?: string; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat'), h = Math.min(28 * u, r.h * 0.5), y = r.y + r.h - h;
  d.withAlpha(o.a ?? 1, () => {
    let x = r.x;
    const prog = o.prog ?? 1;
    ps.forEach((q, i) => {
      const w = r.w * q.p * prog;
      if (w <= 0) return;
      d.rect(x, y, Math.max(0.5, w - 1.5), h, { fill: alpha(lat.c, o.hot === i ? 0.95 : i % 2 ? 0.34 : 0.55) });
      x += w;
    });
    d.rect(r.x - 0.5, y - 0.5, r.w + 1, h + 1, { stroke: p.lineStrong, lw: 1 });
    if (o.label) d.text(o.label, r.x, y - 5 * u, { size: fz(S, 12), weight: 700, color: p.ink2, base: 'bottom' });
    if (prog > 0.95) d.text('100 %', r.x + r.w, y - 5 * u, { size: fz(S, 12), weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'bottom' });
    if (o.marker !== undefined) {
      const mx = r.x + r.w * clamp(o.marker);
      d.polygon([[mx, y - 1], [mx - 6 * u, y - 11 * u], [mx + 6 * u, y - 11 * u]], { fill: p.ink });
      d.text(`u = ${S.n(o.marker, 2)}`, mx, y - 13 * u, { size: fz(S, 12), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'bottom', halo: p.stage });
    }
  });
}

// ═════════════ fórmulas y mando de temperatura ═════════════
/** Caja de fórmula: líneas de piezas coloreadas, en monoespaciada. */
export function formulaBox(S: Frame, r: Rect, lines: [string, string?][][], o: { a?: number; size?: number; align?: 'left' | 'center' } = {}) {
  const { d, pal: p } = S, u = S.u, size = fz(S, o.size ?? 19), lh = size * 1.5 * u, pad = 12 * u;
  const mw = (t: string) => d.measure(t, { size, weight: 700, font: 'mono' });
  const widths = lines.map((ln) => ln.reduce((a, [t]) => a + mw(t), 0));
  const w = Math.min(r.w, Math.max(...widths) + 2 * pad), h = lines.length * lh + 2 * pad - 4 * u;
  const x0 = o.align === 'left' ? r.x : r.x + (r.w - w) / 2;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x0, r.y, w, h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    lines.forEach((ln, i) => {
      let x = x0 + (w - widths[i]) / 2;
      ln.forEach(([t, c]) => { d.text(t, x, r.y + pad - 2 * u + i * lh + lh / 2, { size, weight: 700, font: 'mono', color: c ?? p.ink2, base: 'middle' }); x += mw(t); });
    });
  });
  return { w, h, x: x0 };
}

/** Mando de la temperatura: escala logarítmica de 0,1 a 3 con una perilla. */
export function tdial(S: Frame, r: Rect, T: number, a = 1) {
  const { d, pal: p } = S, u = S.u, w = tone(S, 'w'), lo = Math.log(0.1), hi = Math.log(3);
  const X = (v: number) => r.x + 8 * u + ((Math.log(clamp(v, 0.1, 3)) - lo) / (hi - lo)) * (r.w - 16 * u), y = r.y + r.h * 0.4;
  d.withAlpha(a, () => {
    d.line(r.x + 8 * u, y, r.x + r.w - 8 * u, y, p.lineStrong, 2);
    [0.1, 0.25, 0.5, 1, 2, 3].forEach((v) => {
      d.line(X(v), y - 4 * u, X(v), y + 4 * u, p.lineStrong, 1.5);
      d.text(S.n(v, v === 0.25 ? 2 : v < 1 ? 1 : 0), X(v), y + 9 * u, { size: fz(S, 11), font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
    d.circle(X(T), y, 9 * u, { fill: w.c, stroke: p.stage, lw: 2.5 });
  });
}

// ═════════════ tabla de puntuaciones ═════════════
export interface TableCols { c?: number; z?: number; zt?: number; p?: number }
/** Cada columna lleva su opacidad (0 = oculta). Devuelve la geometría de las filas. */
export function scoreTable(S: Frame, m: Model, r: Rect, ps: Prob[], T: number, cols: TableCols, o: { rows?: number; show?: number; a?: number; hot?: number } = {}) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat'), dat = tone(S, 'dat'), sg = tone(S, 'sig'), wt = tone(S, 'w');
  const nShow = Math.min(o.rows ?? 6, ps.length), rest = ps.slice(nShow), hasRest = rest.length > 0, n = nShow + (hasRest ? 1 : 0);
  const fs = fz(S, 17), fv = fz(S, 15), fh = fz(S, 13), headH = fh * u * 2;
  const rh = Math.min(42 * u, (r.h - headH) / Math.max(1, n));
  const wordW = Math.min(120 * u, r.w * 0.27), numW = Math.min(66 * u, r.w * 0.17);
  const xc = r.x + wordW + 6 * u, xz = xc + numW * 0.75, xzt = xz + numW + 4 * u;
  const xp = (cols.zt ?? 0) > 0 ? xzt + numW + 6 * u : (cols.z ?? 0) > 0 ? xz + numW + 6 * u : xc + numW * 0.75 + 6 * u;
  const pw = Math.max(40 * u, r.x + r.w - xp), bw = Math.max(10, pw - 62 * u);
  const hd = [S.l('palabra', 'word'), S.l('cuenta c', 'count c'), 'z = ln c', 'z / T', 'p'];
  d.withAlpha(o.a ?? 1, () => {
    d.text(hd[0], r.x + wordW, r.y + headH * 0.5, { size: fh, weight: 700, color: p.mute, align: 'right', base: 'middle' });
    if ((cols.c ?? 0) > 0) d.text(S.portrait ? 'c' : hd[1], xc + numW * 0.75, r.y + headH * 0.5, { size: fh, weight: 700, color: dat.ink, align: 'right', base: 'middle', a: cols.c });
    if ((cols.z ?? 0) > 0) d.text(hd[2], xz + numW, r.y + headH * 0.5, { size: fh, weight: 700, color: sg.ink, align: 'right', base: 'middle', a: cols.z });
    if ((cols.zt ?? 0) > 0) d.text(hd[3], xzt + numW, r.y + headH * 0.5, { size: fh, weight: 700, color: wt.ink, align: 'right', base: 'middle', a: cols.zt });
    if ((cols.p ?? 0) > 0) d.text(hd[4], xp, r.y + headH * 0.5, { size: fh, weight: 700, color: lat.ink, base: 'middle', a: cols.p });
    d.line(r.x, r.y + headH - 2, r.x + r.w, r.y + headH - 2, p.line, 1);
    const draw = (i: number, label: string, c: number, z: number | null, pv: number, mute: boolean, hot: boolean) => {
      const y = r.y + headH + i * rh, a = clamp((o.show ?? n) - i); if (a <= 0) return;
      d.withAlpha(a, () => {
        if (hot) d.rect(r.x - 4 * u, y + 1, r.w + 8 * u, rh - 2, { fill: alpha(lat.c, 0.1) });
        d.text(label, r.x + wordW, y + rh / 2, { size: fs, weight: i === 0 ? 800 : 600, color: p.ink, align: 'right', base: 'middle' });
        if ((cols.c ?? 0) > 0) d.text(String(c), xc + numW * 0.75, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: dat.ink, align: 'right', base: 'middle', a: cols.c });
        if ((cols.z ?? 0) > 0) d.text(z === null ? '—' : S.n(z, 2), xz + numW, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: sg.ink, align: 'right', base: 'middle', a: cols.z });
        if ((cols.zt ?? 0) > 0) d.text(z === null ? '—' : S.n(z / T, 2), xzt + numW, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: wt.ink, align: 'right', base: 'middle', a: cols.zt });
        if ((cols.p ?? 0) > 0) d.withAlpha(cols.p ?? 0, () => {
          d.rect(xp, y + rh * 0.2, bw, rh * 0.6, { fill: p.surface2 });
          d.rect(xp, y + rh * 0.2, Math.max(1, bw * clamp(pv)), rh * 0.6, { fill: alpha(mute ? p.mute : lat.c, mute ? 0.45 : i === 0 ? 0.95 : 0.6) });
          d.text(pct(S, pv), xp + pw, y + rh / 2, { size: fv, font: 'mono', weight: 700, color: p.ink, align: 'right', base: 'middle' });
        });
      });
    };
    ps.slice(0, nShow).forEach((q, i) => draw(i, lab(S, m, q.w), q.c, q.z, q.p, false, i === 0));
    if (hasRest) draw(nShow, S.l(`otras (${rest.length})`, `others (${rest.length})`), rest.reduce((a, x) => a + x.c, 0), null, rest.reduce((a, x) => a + x.p, 0), true, false);
  });
  return { rowH: rh, y0: r.y + headH, xp, bw };
}

// ═════════════ probabilidad acumulada ═════════════
export interface Curve { ps: Prob[]; tone: Tone; label: string; dash?: number[]; prog?: number }
/** Probabilidad acumulada frente al número de palabras (eje logarítmico), con la recta de p y dónde la cruza cada curva. */
export function cumChart(S: Frame, r: Rect, curves: Curve[], o: { p?: number; prog?: number; a?: number; marks?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, nmax = Math.max(...curves.map((c) => c.ps.length), 10);
  const plot = new Plot(S, r, { xr: [0, Math.log10(nmax) * 1.04], yr: [0, 1.04], xLabel: 'x', yLabel: 'y', pad: { l: S.portrait ? 40 : 46, b: 44, t: 18 } });
  const fs = fz(S, 11);
  d.withAlpha(o.a ?? 1, () => {
    // ejes propios: x en potencias de 10 (palabras), y en porcentaje
    const R = plot.r;
    d.line(R.x, R.y + R.h, R.x + R.w, R.y + R.h, p.lineStrong, 1.5);
    d.line(R.x, R.y, R.x, R.y + R.h, p.lineStrong, 1.5);
    [0, 1, 2].filter((v) => 10 ** v <= nmax * 1.05).forEach((v) => { d.line(plot.X(v), R.y + R.h, plot.X(v), R.y + R.h + 4 * u, p.lineStrong, 1.5); d.text(String(10 ** v), plot.X(v), R.y + R.h + 7 * u, { size: fs, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    [0, 0.5, 1].forEach((v) => { d.line(R.x - 4 * u, plot.Y(v), R.x, plot.Y(v), p.lineStrong, 1.5); d.text(`${S.n(v * 100, 0)}%`, R.x - 7 * u, plot.Y(v), { size: fs, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('palabras, de más a menos probable', 'words, most to least probable'), R.x + R.w, R.y + R.h + 24 * u, { size: fz(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.text(S.l('probabilidad acumulada', 'cumulative probability'), r.x + 2, R.y - 6 * u, { size: fz(S, 12), weight: 700, color: p.ink2, base: 'bottom' });
    curves.forEach((c) => {
      const pts: [number, number][] = []; let acc = 0;
      const cp = c.prog ?? o.prog ?? 1, lim = Math.max(cp > 0 ? 2 : 0, Math.ceil(cp * c.ps.length));
      for (let i = 0; i < lim && i < c.ps.length; i++) { acc += c.ps[i].p; pts.push([plot.X(Math.log10(i + 1)), plot.Y(Math.min(1, acc))]); }
      const col = tone(S, c.tone);
      plot.clip(() => d.polyline(pts, col.c, 2.6, { dash: c.dash }));
      if (pts.length > 1 && cp > 0.97) { const [lx, ly] = pts[pts.length - 1]; d.text(c.label, lx - 4 * u, ly + (c.tone === 'lat' ? 14 : -12) * u, { size: fz(S, 13), weight: 800, color: col.ink, align: 'right', base: 'middle', halo: p.stage }); }
    });
    if (o.p !== undefined) {
      const wt = tone(S, 'w');
      d.line(R.x, plot.Y(o.p), R.x + R.w, plot.Y(o.p), wt.c, 2, [6, 4]);
      d.text(`p = ${S.n(o.p * 100, 0)} %`, R.x + R.w - 2, plot.Y(o.p) + 6 * u, { size: fz(S, 13), weight: 800, font: 'mono', color: wt.ink, align: 'right', base: 'top', halo: p.stage });
      if (o.marks !== false) curves.forEach((c) => {
        let acc = 0, k = 0; for (; k < c.ps.length; k++) { acc += c.ps[k].p; if (acc >= o.p! - 1e-9) break; }
        const n = Math.min(k + 1, c.ps.length), x = plot.X(Math.log10(n)), y = plot.Y(o.p!), col = tone(S, c.tone);
        d.line(x, y, x, R.y + R.h, col.c, 1.5, [3, 3]);
        d.circle(x, y, 6 * u, { fill: col.c, stroke: p.stage, lw: 2 });
        d.text(String(n), x + 7 * u, R.y + R.h - 8 * u, { size: fz(S, 14), weight: 800, font: 'mono', color: col.ink, align: 'left', base: 'bottom', halo: p.stage });
      });
    }
  });
  return plot;
}
