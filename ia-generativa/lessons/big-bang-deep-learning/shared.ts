// Ayudas compartidas de la escena «El big bang del deep learning»: formato de números, la tira de tres ingredientes,
// cuadrículas de celdas por tiras (una sola llamada de dibujo por fila) y pictogramas.
import { alpha, clamp, ease, hash, regions, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ── números con el formato del idioma (el kit ya da S.n, pero en es-MX usa punto decimal; la narración dice «coma») ──
export function fmtInt(S: Frame, n: number): string {
  const s = String(Math.round(n));
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, S.lang === 'es' ? ' ' : ',');
}
export function dec(S: Frame, x: number, d = 1): string {
  const s = x.toFixed(d);
  return s;
}
export const pct = (S: Frame, x: number, d = 1) => (S.lang === 'es' ? `${dec(S, x, d)} %` : `${dec(S, x, d)}%`);
/** Notación científica corta: 1,4e-3. Para valores entre 0,1 y 1000 usa decimales normales. */
export function sci(S: Frame, x: number, d = 1): string {
  if (!(x > 0)) return '0';
  if (x >= 0.1 && x < 1000) return dec(S, x, x < 10 ? 2 : 1);
  let e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  if (Number(m.toFixed(d)) >= 10) { m /= 10; e += 1; }
  return `${dec(S, m, d)}e${e}`;
}

/** Área útil de la escena (con márgenes). */
export const area = (S: Frame): Rect => regions(S, 1).all;

// ── tira de los tres ingredientes (arriba, desde «imagenet» hasta «recap») ──
export function strip(S: Frame, active: number, a = 1): Rect {
  const R = area(S), u = S.u, h = 26 * u, gap = 8 * u, w = (R.w - 2 * gap) / 3, p = S.pal;
  const labels = [S.l('1 · Datos', '1 · Data'), S.l('2 · Cómputo', '2 · Compute'), S.l('3 · Trucos', '3 · Tricks')];
  S.d.withAlpha(a, () => labels.forEach((lb, i) => {
    const x = R.x + i * (w + gap), on = i === active;
    S.d.rect(x, R.y, w, h, { fill: on ? p.ink : p.surface, stroke: on ? p.ink : p.lineStrong, lw: 1.5, r: 3 });
    S.d.text(lb, x + w / 2, R.y + h / 2, { size: 13, weight: 700, color: on ? p.stage : p.mute, align: 'center', base: 'middle' });
  }));
  const top = R.y + h + 10 * u;
  return { x: R.x, y: top, w: R.w, h: R.y + R.h - top };
}

// ── cuadrículas por tiras: cada fila es UNA línea discontinua gruesa (sin una llamada por celda) ──
/** Una fila de `count` celdas cuadradas de lado `cell` (con hueco `gap`) que empieza en (x, y = borde superior). */
export function cellRow(S: Frame, x: number, y: number, count: number, cell: number, gap: number, color: string, a = 1) {
  if (count <= 0) return;
  const w = count * cell;
  if (gap < 0.5) S.d.rect(x, y, w, cell, { fill: color, a });
  else S.d.line(x, y + cell / 2, x + w - 0.01, y + cell / 2, color, cell - gap, [cell - gap, gap], a);
}
/** Rellena las celdas con índice en [from, to) de una cuadrícula de `cols` columnas (orden por filas). */
export function cellRange(S: Frame, x0: number, y0: number, cols: number, cell: number, gap: number, from: number, to: number, color: string, a = 1) {
  if (to <= from) return;
  const r0 = Math.floor(from / cols), r1 = Math.floor((to - 1) / cols);
  for (let r = r0; r <= r1; r++) {
    const c0 = r === r0 ? from % cols : 0, c1 = r === r1 ? ((to - 1) % cols) + 1 : cols;
    cellRow(S, x0 + c0 * cell, y0 + r * cell, c1 - c0, cell, gap, color, a);
  }
}
/** Rejilla de `n` núcleos que llena un rectángulo; devuelve la geometría. Los núcleos con índice < busy se pintan «ocupados». */
export function coreGrid(S: Frame, r: Rect, n: number, t: Tone, o: { busy?: number; a?: number; gap?: number; maxCell?: number } = {}) {
  const cols = Math.max(1, Math.round(Math.sqrt((n * r.w) / Math.max(1, r.h))));
  const rows = Math.ceil(n / cols);
  let cell = Math.min(r.w / cols, r.h / rows);
  if (o.maxCell) cell = Math.min(cell, o.maxCell);
  const gap = o.gap ?? (cell >= 6 ? 1.5 : cell >= 3 ? 1 : 0.6);
  const w = cols * cell, x0 = r.x + (r.w - w) / 2, y0 = r.y + (r.h - rows * cell) / 2, tc = tone(S, t);
  const busy = o.busy ?? n;
  cellRange(S, x0, y0, cols, cell, gap, 0, Math.min(n, busy), tc.c, o.a ?? 1);
  cellRange(S, x0, y0, cols, cell, gap, Math.min(n, busy), n, alpha(tc.c, 0.2), o.a ?? 1);
  return { cols, rows, cell, x0, y0, w, h: rows * cell };
}

// ── «fotos» ilustrativas: una cuadrícula de iconos de píxel (no son imágenes reales de ImageNet) ──
const PIC_TONES: Tone[] = ['dat', 'sig', 'w', 'lat', 'err'];
/** Dibuja la «foto» k en (x, y) con lado s: fondo claro y una forma simple que depende de hash(k). */
export function miniPic(S: Frame, x: number, y: number, s: number, k: number, a = 1) {
  const d = S.d, p = S.pal, kind = Math.floor(hash(k, 11) * 7), t = tone(S, PIC_TONES[Math.floor(hash(k, 5) * PIC_TONES.length)]);
  d.withAlpha(a, () => {
    d.rect(x, y, s, s, { fill: p.surface2 });
    const c = t.c, m = s * 0.2, q = s - 2 * m;
    switch (kind) {
      case 0: d.circle(x + s / 2, y + s / 2, q / 2, { fill: c }); break;
      case 1: d.rect(x + m, y + m, q, q, { fill: c }); break;
      case 2: d.polygon([[x + s / 2, y + m], [x + s - m, y + s - m], [x + m, y + s - m]], { fill: c }); break;
      case 3: d.rect(x + s * 0.4, y + m, s * 0.2, q, { fill: c }); d.rect(x + m, y + s * 0.4, q, s * 0.2, { fill: c }); break;
      case 4: for (let i = 0; i < 3; i++) d.rect(x + m, y + m + i * q * 0.4, q, q * 0.2, { fill: c }); break;
      case 5: d.circle(x + s / 2, y + s / 2, q / 2, { stroke: c, lw: Math.max(1.5, s * 0.1) }); break;
      default: d.polygon([[x + s / 2, y + m], [x + s - m, y + s / 2], [x + s / 2, y + s - m], [x + m, y + s / 2]], { fill: c });
    }
  });
}

// ── pictogramas de los tres ingredientes ──
export function glyph(S: Frame, kind: 'data' | 'compute' | 'relu' | 'drop' | 'skip', cx: number, cy: number, size: number, a = 1) {
  const d = S.d, p = S.pal;
  d.withAlpha(a, () => {
    if (kind === 'data') {
      const c = size / 3;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) miniPic(S, cx - size / 2 + j * c + 0.5, cy - size / 2 + i * c + 0.5, c - 1.5, i * 3 + j + 3);
    } else if (kind === 'compute') {
      coreGrid(S, { x: cx - size / 2, y: cy - size / 2, w: size, h: size }, 36, 'dat');
    } else if (kind === 'relu') {
      // bisagra: plana a la izquierda, recta creciente a la derecha, con ejes
      const t = tone(S, 'sig').c, h = size / 2, y0 = cy + h * 0.45;
      d.line(cx - h, y0, cx + h, y0, p.line, 1.5);
      d.line(cx, cy + h, cx, cy - h, p.line, 1.5);
      d.polyline([[cx - h, y0], [cx, y0], [cx + h, cy - h * 0.85]], t, 4);
    } else if (kind === 'drop') {
      const t = tone(S, 'w').c, r = size * 0.17;
      [[-0.28, -0.26], [0.28, -0.26], [-0.28, 0.26], [0.28, 0.26]].forEach(([dx, dy], i) => {
        const x = cx + dx * size, y = cy + dy * size;
        if (i === 1 || i === 2) { d.circle(x, y, r, { stroke: t, lw: 1.8, dash: [3, 3], fill: p.stage }); d.line(x - r * 0.6, y - r * 0.6, x + r * 0.6, y + r * 0.6, t, 1.8); d.line(x - r * 0.6, y + r * 0.6, x + r * 0.6, y - r * 0.6, t, 1.8); }
        else d.circle(x, y, r, { fill: t });
      });
    } else {
      // atajo: caja F, suma y un arco por encima
      const t = tone(S, 'err').c, w = size * 0.5, bw = size * 0.3, bh = size * 0.26, y0 = cy + size * 0.12, r = size * 0.1;
      d.line(cx - w, y0, cx - w + (w - bw / 2), y0, p.ink2, 1.8);
      d.rect(cx - bw / 2 - w * 0.1, y0 - bh / 2, bw, bh, { stroke: p.lineStrong, lw: 1.8, r: 2, fill: p.stage });
      d.line(cx + bw / 2 - w * 0.1, y0, cx + w * 0.62 - r, y0, p.ink2, 1.8);
      d.circle(cx + w * 0.62, y0, r, { stroke: p.ink, lw: 1.8, fill: p.stage });
      d.line(cx + w * 0.62 - r * 0.5, y0, cx + w * 0.62 + r * 0.5, y0, p.ink, 1.5); d.line(cx + w * 0.62, y0 - r * 0.5, cx + w * 0.62, y0 + r * 0.5, p.ink, 1.5);
      d.polyline([[cx - w * 0.85, y0], [cx - w * 0.85, y0 - size * 0.34], [cx + w * 0.62, y0 - size * 0.34], [cx + w * 0.62, y0 - r]], t, 2.4);
    }
  });
}

/** Marca de acierto (círculo con visto) o de fallo (cruz): la forma acompaña al color. */
export function mark(S: Frame, kind: 'hit' | 'miss', x: number, y: number, r: number, a = 1) {
  const d = S.d, t = tone(S, kind === 'hit' ? 'dat' : 'err').c;
  d.withAlpha(a, () => {
    if (kind === 'hit') { d.circle(x, y, r, { stroke: t, lw: 2 }); d.polyline([[x - r * 0.5, y], [x - r * 0.1, y + r * 0.45], [x + r * 0.55, y - r * 0.4]], t, 2.4); }
    else { d.line(x - r * 0.7, y - r * 0.7, x + r * 0.7, y + r * 0.7, t, 2.6); d.line(x - r * 0.7, y + r * 0.7, x + r * 0.7, y - r * 0.7, t, 2.6); }
  });
}

// ── tiempo relativo: las voces duran distinto en cada idioma, así que lo que depende de «cuándo se dice» se ancla a fracciones del segmento ──
export type EaseName = keyof typeof ease;
export const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso de aparición entre las fracciones f0 y f1 de la duración del segmento k. */
export function fa(S: Frame, k: string, f0: number, f1 = f0 + 0.1, e: EaseName = 'out'): number {
  const D = dur(S, k);
  return S.at(k, f0 * D, f1 * D, e);
}
