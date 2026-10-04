// Acto D (all): el mapa de atención de toda la frase y la autoatención. La rejilla `mapGrid` también la usa «causal».
// Los pesos son los del juguete (MAP en data.ts, calculados con el mismo `attend` de la escena): ilustrativos.
import { alpha, badge, clamp, inset, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { I, MAP, N, TOK } from './data';
import { actAlpha, fs, pct, textBlock, textRot } from './ui';

export interface GridOpts {
  words: string[]; M: number[][];
  hotRow?: number;
  /** transparencia de cada fila (para aparecer una a una); por defecto 1 */
  rowA?: (i: number) => number;
  /** celdas con j > i tapadas (máscara causal), con progreso 0..1 */
  mask?: number;
  /** muestra el porcentaje en las celdas con al menos este peso */
  minNum?: number;
  /** anillo en la celda (i, j) */
  ring?: [number, number];
  /** etiquetas de columna (palabras miradas) */
  colLabels?: boolean;
}
export interface GridGeom { x: number; y: number; cs: number; n: number; labW: number }

/** Geometría de la rejilla (la misma para dibujar y para atender el puntero). */
export function gridGeom(S: Frame, r: Rect, words: string[]): GridGeom {
  const u = S.u, n = words.length, size = fs(S, 12);
  const labW = Math.max(...words.map((w) => S.d.measure(w, { size, weight: 700 }))) + 8 * u;
  const cs = Math.max(8, Math.min((r.w - labW) / n, (r.h - labW) / n));
  return { x: r.x + labW + Math.max(0, (r.w - labW - cs * n) / 2), y: r.y + labW + Math.max(0, (r.h - labW - cs * n) / 2), cs, n, labW };
}

/** Rejilla de pesos: filas = la palabra que mira, columnas = la palabra mirada. Cada celda se rellena en cian según el peso. */
export function mapGrid(S: Frame, r: Rect, o: GridOpts): GridGeom {
  const { d, pal: p } = S, u = S.u, n = o.words.length, size = fs(S, 12), sig = tone(S, 'sig');
  const G = gridGeom(S, r, o.words), { cs, labW } = G, gx = G.x, gy = G.y;
  const gw = cs * n;
  // etiquetas
  o.words.forEach((w, i) => {
    const hot = o.hotRow === i;
    d.text(w, gx - 6 * u, gy + i * cs + cs / 2, { size, weight: hot ? 800 : 600, color: hot ? sig.ink : p.ink2, align: 'right', base: 'middle' });
    if (o.colLabels !== false) textRot(S, w, gx + i * cs + cs / 2, gy - 6 * u, -Math.PI / 2, { size, weight: 600, color: p.ink2, align: 'left' });
  });
  for (let i = 0; i < n; i++) {
    const ra = o.rowA ? o.rowA(i) : 1;
    for (let j = 0; j < n; j++) {
      const w = o.M[i][j], x = gx + j * cs, y = gy + i * cs;
      d.rect(x, y, cs - 1.5, cs - 1.5, { fill: p.surface2, a: ra * 0.9 });
      if (w > 0.002) d.rect(x, y, cs - 1.5, cs - 1.5, { fill: alpha(sig.c, 0.08 + 0.88 * Math.min(1, w)), a: ra });
      if (w >= (o.minNum ?? 0.1) && ra > 0.5 && cs >= 22 * u) d.text(pct(S, w), x + (cs - 1.5) / 2, y + (cs - 1.5) / 2, { size: fs(S, 12), weight: 700, font: 'mono', color: w > 0.5 ? p.stage : p.ink, align: 'center', base: 'middle', a: ra });
    }
  }
  // máscara causal: lo que está en el futuro queda tapado
  if ((o.mask ?? 0) > 0) {
    const m = clamp(o.mask ?? 0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const x = gx + j * cs, y = gy + i * cs;
      d.rect(x, y, cs - 1.5, cs - 1.5, { fill: p.surface, stroke: alpha(p.ink2, 0.5), lw: 1, a: m });
      d.line(x + 3, y + cs - 4.5, x + cs - 4.5, y + 3, p.ink2, 1.2, undefined, 0.55 * m);
    }
  }
  if (o.hotRow !== undefined) d.rect(gx - 2, gy + o.hotRow * cs - 1, gw + 4, cs + 1, { stroke: sig.c, lw: 2.5, r: 3 });
  if (o.ring) d.rect(gx + o.ring[1] * cs - 2, gy + o.ring[0] * cs - 2, cs + 2, cs + 2, { stroke: p.ink, lw: 2.5 });
  return G;
}

/** Vista de «all»: el mapa de atención de toda la frase y, al lado, de dónde salen Q, K y V (autoatención). */
export function drawAll(S: Frame) {
  const A = actAlpha(S, 'all', 'origin'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), words = TOK[S.lang];
  const sig = tone(S, 'sig'), lat = tone(S, 'lat'), dat = tone(S, 'dat');
  d.withAlpha(A, () => {
    const diagH = S.portrait ? 62 * u : 0, gap = 10 * u;
    const badgeH = 26 * u;
    const gr: Rect = S.portrait ? { x: all.x, y: all.y + diagH + gap, w: all.w, h: all.h - diagH - gap - badgeH } : { x: all.x, y: all.y, w: Math.round(all.w * 0.56), h: all.h - badgeH };
    // las nueve filas aparecen a la vez: todas las palabras preguntan al mismo tiempo
    const fill = S.reveal('all', 0.15, 1.1);
    mapGrid(S, gr, { words, M: MAP.map((row) => row.map((w) => w * fill)), hotRow: I.it, rowA: () => S.reveal('all', 0, 0.5) });
    d.withAlpha(S.reveal('all', 1.6, 0.6), () => {
      badge(S, S.l('mapa de atención: cada fila suma 100 %', 'attention map: each row adds up to 100 %'), gr.x + gr.w / 2, gr.y + gr.h + 14 * u, { tone: 'sig', size: fs(S, 12) });
    });
    // autoatención: Q, K y V salen de la misma frase
    const aD = S.reveal('all', 3.2, 0.8);
    d.withAlpha(aD, () => {
      const r: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: diagH } : { x: gr.x + gr.w + 18 * u, y: all.y, w: all.w - gr.w - 18 * u, h: all.h };
      const bw = Math.min(S.portrait ? 74 * u : 92 * u, (r.w - 24 * u) / 3), bh = (S.portrait ? 26 : 36) * u;
      const top = S.portrait ? r.y + 2 * u : r.y + r.h * 0.18;
      const fw = S.portrait ? Math.min(r.w * 0.5, 150 * u) : Math.min(r.w, 230 * u), fx = r.x + (r.w - fw) / 2;
      d.rect(fx, top, fw, bh, { fill: lat.soft, stroke: lat.c, lw: 1.5, r: 3 });
      d.text(S.l('la misma frase', 'the same sentence'), fx + fw / 2, top + bh / 2, { size: fs(S, 13), weight: 700, color: lat.ink, align: 'center', base: 'middle' });
      const ys = top + bh + (S.portrait ? 16 : 40) * u, gapB = (r.w - 3 * bw) / 4;
      [['Q', sig], ['K', lat], ['V', dat]].forEach(([nm, t], i) => {
        const tc = t as ReturnType<typeof tone>, bx = r.x + gapB + i * (bw + gapB);
        d.line(fx + fw / 2, top + bh, bx + bw / 2, ys, p.lineStrong, 1.5);
        d.rect(bx, ys, bw, bh, { fill: alpha(tc.c, 0.14), stroke: tc.c, lw: 1.5, r: 3 });
        d.text(nm as string, bx + bw / 2, ys + bh / 2, { size: fs(S, 16), weight: 800, font: 'mono', color: tc.ink, align: 'center', base: 'middle' });
      });
      if (!S.portrait) {
        const ty = ys + bh + 22 * u;
        badge(S, S.l('autoatención', 'self-attention'), r.x + r.w / 2, ty, { tone: 'sig', size: fs(S, 13) });
        textBlock(S, S.l('consultas, claves y valores de la misma secuencia', 'queries, keys, and values of the same sequence'), r.x + r.w / 2, ty + 44 * u, r.w - 8 * u, { size: fs(S, 13), align: 'center', lh: 1.25 });
        textBlock(S, S.l('Pesos ilustrativos: se calculan con los números de antes.', 'Illustrative weights: computed with the numbers from before.'), r.x + r.w / 2, r.y + r.h - 22 * u, r.w - 8 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', lh: 1.2 });
      } else {
        badge(S, S.l('autoatención', 'self-attention'), fx + fw + 8 * u, top + bh / 2, { tone: 'sig', align: 'left', size: fs(S, 12) });
      }
    });
  });
  void N;
}
