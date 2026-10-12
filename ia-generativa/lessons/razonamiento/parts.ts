// Piezas que se repiten en varias vistas: el tren (el problema), la tira compacta del problema, la cuadrícula de los
// 32 intentos y la caja del modelo. La forma acompaña al color: acierto = casilla llena con ✓; error = borde punteado con ✗.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { chip, chipH, chipW, fitText, fz, K, mark } from './ui';
import { ANSWER } from './runs';

// ═════════ el problema del tren ═════════
export interface TrackShow { start?: number; stop1?: number; stop2?: number; end?: number; result?: number; resultOk?: boolean }
const STOPS = [
  { es: 'salida', en: 'start', ops: ['148'] },
  { es: 'parada 1', en: 'stop 1', ops: ['−37', '+52'] },
  { es: 'parada 2', en: 'stop 2', ops: ['−61', '+18'] },
  { es: 'final', en: 'end', ops: [] as string[] },
];

/** Alto que ocupa la vía completa. */
export const trackH = (S: Frame) => { const k = K(S), u = S.u; return fz(S, 12.5 * k) * u * 1.3 + 6 * u + 12 * u * k + 2 * (chipH(S, 13 * k) + 5 * u) + 4 * u; };

/** El tren: una vía con cuatro estaciones. En un rectángulo bajo (< 64 u) se dibuja en una sola fila (tira compacta). */
export function track(S: Frame, r: Rect, o: TrackShow) {
  const { d, pal: p } = S, u = S.u, compact = r.h < 64 * u, k = compact ? 1 : K(S);
  const show = [o.start ?? 0, o.stop1 ?? 0, o.stop2 ?? 0, o.end ?? 0];
  const n = 4, padX = compact ? 10 * u : Math.min(50 * u * k, r.w * 0.11);
  const xs = Array.from({ length: n }, (_, i) => r.x + padX + (i * (r.w - 2 * padX)) / (n - 1));
  const nodeR = (compact ? 4 : 6 * k) * u;
  const ly = compact ? r.y + r.h / 2 : r.y + fz(S, 12.5 * k) * u * 1.3 + 4 * u + nodeR;
  // la vía: aparece tramo a tramo con cada estación
  for (let i = 0; i < n - 1; i++) {
    const q = clamp(show[i + 1] * 1.4);
    if (q > 0) d.line(xs[i], ly, xs[i] + (xs[i + 1] - xs[i]) * q, ly, p.lineStrong, 2);
  }
  const span = xs[1] - xs[0];
  STOPS.forEach((st, i) => {
    const a = show[i];
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      d.circle(xs[i], ly, nodeR, { fill: p.surface, stroke: p.ink2, lw: 2 });
      if (!compact) fitText(S, S.l(st.es, st.en), xs[i], ly - nodeR - 5 * u, span * 0.95, { size: 12.5 * k, weight: 700, color: p.mute, align: 'center', base: 'bottom' });
      if (i === n - 1) {
        const res = o.result ?? 0, qa = 1 - clamp(res * 2);
        const big = compact ? 15 : 22 * k;
        const tx = compact ? xs[i] + nodeR + 4 * u : xs[i], ty = compact ? ly : ly + nodeR + 6 * u;
        const al = compact ? 'left' : 'center', base = compact ? 'middle' : 'top';
        if (qa > 0.01) fitText(S, '?', tx, ty, 40 * u, { size: big, weight: 800, font: 'mono', color: p.ink, align: al, base, a: qa });
        if (res > 0.01) fitText(S, String(ANSWER), tx, ty, 70 * u, { size: big, weight: 800, font: 'mono', color: o.resultOk === false ? tone(S, 'err').ink : tone(S, 'dat').ink, align: al, base, a: res });
        return;
      }
      if (compact) {
        // en fila, a la derecha de la estación
        let x = xs[i] + nodeR + 4 * u;
        st.ops.forEach((t) => { const w = chipW(S, t, 12, 700, 'mono'); chip(S, t, x, ly, 'ink', { size: 12, align: 'left', font: 'mono' }); x += w + 3 * u; });
      } else if (i === 0) {
        const ny = ly + nodeR + 6 * u;
        fitText(S, st.ops[0], xs[i], ny, 70 * u, { size: 22 * k, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
        fitText(S, S.l('pasajeros', 'passengers'), xs[i], ny + fz(S, 22 * k) * u * 1.1, span * 0.95, { size: 12 * k, weight: 600, color: p.mute, align: 'center', base: 'top' });
      } else {
        const ch = chipH(S, 13 * k);
        st.ops.forEach((t, j) => {
          const lab = j === 0 ? S.l(`bajan ${t.slice(1)}`, `${t.slice(1)} off`) : S.l(`suben ${t.slice(1)}`, `${t.slice(1)} on`);
          const wide = span * 0.92 >= chipW(S, lab, 13 * k);
          chip(S, wide ? lab : t, xs[i], ly + nodeR + 6 * u + ch / 2 + j * (ch + 5 * u), 'ink', { size: 13 * k, font: wide ? 'ui' : 'mono' });
        });
      }
    });
  });
  return { xs, ly };
}

// ═════════ la cuadrícula de los 32 intentos ═════════
export function gridCells(S: Frame, r: Rect, n = 32, cols = 8): Rect[] {
  const rows = Math.ceil(n / cols), u = S.u, gap = Math.max(3, 6 * u);
  const cw = Math.min((r.w - (cols - 1) * gap) / cols, 92 * u);
  const ch = Math.min((r.h - (rows - 1) * gap) / rows, Math.max(cw * 0.6, fz(S, 13) * u + 10 * u), 54 * u);
  const gw = cols * cw + (cols - 1) * gap, gh = rows * ch + (rows - 1) * gap;
  const x0 = r.x + (r.w - gw) / 2, y0 = r.y + (r.h - gh) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + (i % cols) * (cw + gap), y: y0 + Math.floor(i / cols) * (ch + gap), w: cw, h: ch }));
}
/** Caja que envuelve las casillas. */
export const bounds = (cells: Rect[]): Rect => {
  const x = Math.min(...cells.map((c) => c.x)), y = Math.min(...cells.map((c) => c.y));
  return { x, y, w: Math.max(...cells.map((c) => c.x + c.w)) - x, h: Math.max(...cells.map((c) => c.y + c.h)) - y };
};

/** Una casilla de intento: vacía (punteada), con su respuesta y, si `marks` > 0, marcada como acierto o error. */
export function cell(S: Frame, c: Rect, v: number | null | undefined, o: { a?: number; fill?: number; marks?: number } = {}) {
  const { d, pal: p } = S, u = S.u, ok = v === ANSWER, mk = o.marks ?? 0, fa = o.fill ?? 1;
  const dat = tone(S, 'dat'), err = tone(S, 'err');
  const size = clamp((c.h / u) * 0.42, 12, 18);
  d.withAlpha(o.a ?? 1, () => {
    if (v === undefined || fa <= 0.01) { d.rect(c.x, c.y, c.w, c.h, { stroke: p.lineStrong, lw: 1.2, r: 3, dash: [3, 3] }); return; }
    if (mk > 0.01) {
      if (ok) d.rect(c.x, c.y, c.w, c.h, { fill: alpha(dat.c, 0.22 * mk), stroke: dat.c, lw: 1.2 + 0.6 * mk, r: 3 });
      else d.rect(c.x, c.y, c.w, c.h, { fill: p.surface, stroke: err.c, lw: 1.3, r: 3, dash: [4, 3] });
      d.withAlpha(1 - mk, () => d.rect(c.x, c.y, c.w, c.h, { stroke: p.lineStrong, lw: 1.2, r: 3 }));
    } else d.rect(c.x, c.y, c.w, c.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.2, r: 3 });
    const numW = S.d.measure('000', { size: fz(S, size), weight: 700, font: 'mono' });
    const room = mk > 0.01 && c.w >= numW + 22 * u;
    const tx = room ? c.x + (c.w - 14 * u) / 2 : c.x + c.w / 2;
    const col = mk > 0.5 ? (ok ? dat.ink : err.ink) : p.ink;
    d.withAlpha(fa, () => fitText(S, v === null ? '—' : String(v), tx, c.y + c.h / 2 + 0.5, room ? c.w - 18 * u : c.w - 4 * u, { size, weight: 700, font: 'mono', color: col, align: 'center', base: 'middle' }));
    if (room) d.withAlpha(mk, () => mark(S, c.x + c.w - 9 * u, c.y + c.h / 2, ok, Math.min(4.5, size * 0.28) * u, ok ? dat.c : err.c, 1.8));
  });
}

/** Las 32 casillas. `appear`/`fill`: aparición escalonada (0..1); `marks`: marcado de aciertos (0..1). */
export function attempts(S: Frame, r: Rect, ans: (number | null)[], o: { appear?: number; fill?: number; marks?: number; a?: number } = {}) {
  const cells = gridCells(S, r, ans.length);
  const ap = o.appear ?? 1, fl = o.fill ?? 1, n = ans.length;
  cells.forEach((c, i) => {
    const a = clamp(ap * (n + 6) / 6 - i / 6 * 0.9);
    if (a <= 0.01) return;
    const f = clamp(fl * (n + 4) / 4 - i / 4 * 0.9);
    cell(S, c, f > 0.01 ? ans[i] : undefined, { a: a * (o.a ?? 1), fill: f, marks: o.marks });
  });
  return cells;
}

/** Lectura «aciertos: 14 de 32». */
export function hitsLabel(S: Frame, x: number, y: number, w: number, k: number, n: number, o: { a?: number; align?: CanvasTextAlign; size?: number } = {}) {
  const str = S.l(`aciertos: ${k} de ${n}`, `right: ${k} of ${n}`);
  return fitText(S, str, x, y, w, { size: o.size ?? 15 * K(S), weight: 800, color: tone(S, 'dat').ink, align: o.align ?? 'left', base: 'middle', a: o.a });
}

/** La caja del modelo. `active` resalta (0..1). */
export function modelBox(S: Frame, r: Rect, o: { a?: number; active?: number; sub?: string } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, 'w'), k = K(S);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.1 + 0.2 * (o.active ?? 0)), stroke: c.c, lw: 1.6, r: 5 });
    const hasSub = !!o.sub && r.h > 46 * u;
    fitText(S, S.l('modelo', 'model'), r.x + r.w / 2, r.y + r.h / 2 - (hasSub ? 9 * u * k : 0), r.w - 10 * u, { size: 15 * k, weight: 800, color: c.ink, align: 'center', base: 'middle' });
    if (hasSub) fitText(S, o.sub!, r.x + r.w / 2, r.y + r.h / 2 + 11 * u * k, r.w - 10 * u, { size: 12 * k, weight: 600, color: p.mute, align: 'center', base: 'middle' });
  });
}
