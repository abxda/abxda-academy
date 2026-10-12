// Escena: El mundo hecho de números.
// Una carita de 8×8 píxeles se convierte, paso a paso, en grises, en una tabla (matriz) y en una lista (vector); la escena
// pinta, desenfoca y muestrea sola mientras la voz explica (S.drive), y quien quiera puede tomar los controles. Después: el
// color como tres canales (tensor), el sonido como muestras y su reconstrucción, el texto como códigos y vectores, y la
// escala real (MNIST, una foto de doce megapíxeles, la foto reducida). Todo se anima por fracciones de cada segmento.
import {
  Plot, alpha, badge, box, callout, clamp, ease, inset, lerp, link, neu, regions, sprite, tone,
  type Frame, type PointerEvt, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import {
  BLUR_LEVELS, BLUR_PCT, FACE_B, FEATURES, HEART, MNIST_LIKE, N, REC_N, SMILE_GRAY, SMILE_RGB, SND, WORDS,
  boxBlur, clamp255, codesOf, colorOf, dist, grayCss, hood, mixRGB, sample, textOnGray, wave, type RGB,
} from './helpers';

// ── utilidades ────────────────────────────────────────────────────────────
const NC = N * N;                                              // 64 píxeles
const rowOf = (i: number) => Math.floor(i / N);
const colOf = (i: number) => i % N;
const sm = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
/** Duración (s) de un segmento: las voces y los idiomas duran distinto, así que se anima por fracciones de ella. */
const dur = (S: Frame, k: string) => Math.max(1, S.end(k) - S.start(k));
/** Progreso 0..1 entre las fracciones a y b del segmento k. */
const fr = (S: Frame, k: string, a: number, b = a + 0.07, e: 'lin' | 'out' | 'io' = 'out') => S.at(k, a * dur(S, k), b * dur(S, k), e);
/** Aparición estándar a una fracción del segmento. */
const rv = (S: Frame, k: string, a: number, d = 0.07) => fr(S, k, a, a + d, 'out');
/** El dibujo de ejemplo (un corazón) que la escena pinta sola, celda por celda. */
const HEART_ORDER = HEART.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
const demoPaint = (S: Frame): number[] => {
  const k = S.on('paint-intro') ? HEART_ORDER.length : Math.round(fr(S, 'paint-demo', 0.12, 0.82, 'lin') * HEART_ORDER.length);
  const v = Array(N * N).fill(0); HEART_ORDER.slice(0, k).forEach((i) => (v[i] = 255)); return v;
};
/** Paso de la ventana 3×3 que recorre la fila durante «blur-intro» (0..3). */
const hoodStep = (S: Frame) => Math.min(3, Math.floor(fr(S, 'blur-intro', 0.1, 0.9, 'lin') * 4));
/** Píxeles de ejemplo de «one-pixel»: uno del fondo (oscuro) y el brillo de la cara (claro). */
const PX_DARK = 1, PX_LIGHT = 1 * 8 + 3;
/** Tamaño de texto del lienzo: nunca menos de 12 px efectivos (size se multiplica por S.u). */
const T = (S: Frame, px: number) => Math.max(px, 12 / S.u);
/** Número grande con separador por idioma (espacio fino en español, coma en inglés), como en la lección de referencia. */
const big = (S: Frame, n: number) => { const s = Math.round(n).toLocaleString('en-US'); return S.lang === 'es' ? s.replace(/,/g, ' ') : s; };
const GRID_LINE = alpha(grayCss(128), 0.55);                   // borde de celdas: visible sobre negro y sobre blanco
const CH_NAME = ['R', 'G', 'B'] as const;
const MIC = ['...2222...', '..222222..', '..222222..', '..222222..', '..222222..', '1.222222.1', '1..2222..1', '.1......1.', '..111111..', '....11....', '....11....', '...1111...', '..111111..'];
const CH_COLOR: RGB[] = [[255, 60, 60], [40, 210, 80], [70, 120, 255]];  // color de cada canal (dato)
const FACE_PX = 4 * N + 3;                                    // píxel de la cara que se usa en los ejemplos de color (fila 5, columna 4)

/** Aparición de un bloque entre dos segmentos: sube al empezar a y baja al empezar b. */
function win(S: Frame, a: string, b?: string, fi = 0.5, fo = 0.4) {
  if (!S.on(a)) return 0;
  let v = S.at(a, 0, fi, 'out');
  if (b && S.on(b)) v = Math.min(v, 1 - S.at(b, 0, fo, 'lin'));
  return v;
}

// ── estado interactivo ────────────────────────────────────────────────────
interface St {
  paint: number[]; touched: boolean[]; cur: [number, number] | null; last: [number, number] | null; kb: [number, number] | null; seeded: boolean;
  lv: number;          // nivel de desenfoque mostrado (suavizado)
  bad: boolean;        // ya se vio una onda que pierde su forma
}
const newSt = (): St => ({ paint: Array(NC).fill(0), touched: Array(NC).fill(false), cur: null, last: null, kb: null, seeded: false, lv: 0, bad: false });
const D = (S: Frame): St => (S.st.d ??= newSt());
const paintOn = (S: Frame) => S.between('paint-demo', 'blur-intro');
const userPainted = (S: Frame) => D(S).touched.some(Boolean);
const brushOf = (S: Frame) => { const b = Number(S.p.brush); return Number.isFinite(b) ? b : 255; };
const blurTarget = (S: Frame) => (S.on('blur-try') ? clamp(Math.round(Number(S.p.blur ?? 1)), 0, 4) : S.on('blur-numbers') ? 1 : 0);

function paintCell(S: Frame, r: number, c: number) {
  if (r < 0 || r >= N || c < 0 || c >= N) return;
  const d = D(S), i = r * N + c;
  // el primer trazo de la persona parte del dibujo de ejemplo que ya está en pantalla (no lo borra de golpe)
  if (!d.seeded) { d.paint = demoPaint(S); d.seeded = true; }
  S.touched.add('paint');
  d.paint[i] = brushOf(S); d.touched[i] = true; d.cur = [r, c];
}
function paintLine(S: Frame, a: [number, number], b: [number, number]) {
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
  for (let k = 0; k <= n; k++) paintCell(S, Math.round(lerp(a[0], b[0], k / n)), Math.round(lerp(a[1], b[1], k / n)));
}

// ── distribución de la escena de trabajo: cuadrícula + panel lateral (o inferior en teléfono) ──
interface Lay { all: Rect; G: Rect; cell: number; A: Rect; top: number }
function lay(S: Frame): Lay {
  const u = S.u, all = inset(S.full(), 14 * u), top = 42 * u, left = 18 * u;
  if (!S.portrait) {
    const avail = all.h - top;
    const gs = Math.min(avail, (all.w - left) * 0.42);
    const cell = Math.max(16, Math.floor(gs / N)), g = cell * N;
    const gx = all.x + left, gy = all.y + top + Math.max(0, (avail - g) / 2);
    const ax = gx + g + 26 * u;
    return { all, top, cell, G: { x: gx, y: gy, w: g, h: g }, A: { x: ax, y: all.y, w: all.x + all.w - ax, h: all.h } };
  }
  const availH = all.h - top;
  const gs = Math.min(all.w - left, availH * 0.56);
  const cell = Math.max(16, Math.floor(gs / N)), g = cell * N;
  const gx = all.x + left + (all.w - left - g) / 2, gy = all.y + top;
  const ay = gy + g + 10 * u;
  return { all, top, cell, G: { x: gx, y: gy, w: g, h: g }, A: { x: all.x, y: ay, w: all.w, h: all.y + all.h - ay } };
}
const cellRect = (L: Lay, i: number): Rect => ({ x: L.G.x + colOf(i) * L.cell, y: L.G.y + rowOf(i) * L.cell, w: L.cell, h: L.cell });
const cellAt = (L: Lay, x: number, y: number): [number, number] | null => {
  const c = Math.floor((x - L.G.x) / L.cell), r = Math.floor((y - L.G.y) / L.cell);
  return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null;
};

// ── estado de la cuadrícula en este instante (función pura del tiempo y del estado) ──
interface GridState { vals: number[]; smile: boolean; grayK: number; picA: number; numA: number; lines: number; alpha: number; idxA: number }
function gridState(S: Frame): GridState {
  const dd = D(S);
  let vals = SMILE_GRAY, smile = true;
  if (S.on('color-intro')) { /* la carita, otra vez */ }
  else if (S.on('blur-intro')) {
    const lv = clamp(dd.lv, 0, 4), a = Math.floor(lv), b = Math.min(4, a + 1), f = lv - a;
    vals = BLUR_LEVELS[a].map((v, i) => lerp(v, BLUR_LEVELS[b][i], f)); smile = false;
  } else if (S.on('paint-demo')) { vals = userPainted(S) ? dd.paint : S.on('neighbors') ? SMILE_GRAY : demoPaint(S); smile = false; }
  let picA = 1;
  if (S.on('matrix')) picA = 1 - fr(S, 'matrix', 0.5, 0.8);
  if (S.on('paint-demo')) picA = fr(S, 'paint-demo', 0, 0.08);
  const grayK = fr(S, 'brightness', 0.05, 0.25) * (1 - S.at('color-intro', 0, 1.0));
  const numA = fr(S, 'matrix', 0.1, 0.35) * (1 - S.at('color-intro', 0, 0.6));
  let dip = 1;
  for (const seg of ['paint-demo', 'blur-intro', 'color-intro']) if (S.on(seg) && S.since(seg) < 0.35) dip = 0.25 + 0.75 * (S.since(seg) / 0.35);
  const hide = win(S, 'feature', 'paint-demo', 0.5, 0.15);   // en «feature» y «vector» el escenario es de la comparación
  return { vals, smile, grayK, picA, numA, lines: rv(S, 'pixels', 0.35, 0.15), alpha: dip * (1 - hide), idxA: rv(S, 'grid-size', 0.3) };
}
const cellCss = (g: GridState, i: number) => {
  const v = clamp255(g.vals[i]);
  if (g.smile && g.grayK < 0.999) { const c = mixRGB(SMILE_RGB[i], [v, v, v], g.grayK); return colorOf(c[0], c[1], c[2]); }
  return grayCss(v);
};

interface Hl { i: number; tone: 'sig' | 'err' | 'w' | 'dat' | 'lat' | 'ink'; lw?: number; dash?: number[] }

function drawGrid(S: Frame, L: Lay, g: GridState, hl: Hl[] = []) {
  const { d, pal: p } = S, { G, cell } = L, u = S.u;
  d.withAlpha(g.alpha, () => {
    for (let i = 0; i < NC; i++) {
      const r = cellRect(L, i);
      d.rect(r.x, r.y, cell, cell, { fill: p.surface });
      if (g.picA > 0.01) d.rect(r.x, r.y, cell, cell, { fill: cellCss(g, i), a: g.picA });
    }
    if (g.lines > 0.01) d.withAlpha(g.lines, () => {
      for (let k = 0; k <= N; k++) { d.line(G.x + k * cell, G.y, G.x + k * cell, G.y + G.h, GRID_LINE, 1); d.line(G.x, G.y + k * cell, G.x + G.w, G.y + k * cell, GRID_LINE, 1); }
    });
    d.rect(G.x - 0.5, G.y - 0.5, G.w + 1, G.h + 1, { stroke: p.lineStrong, lw: 1.5 });
    if (g.numA > 0.01) {
      const size = clamp(cell * 0.44, 12, 17) / u;
      for (let i = 0; i < NC; i++) {
        const r = cellRect(L, i), v = clamp255(g.vals[i]), cx = r.x + cell / 2, cy = r.y + cell / 2;
        if (g.picA > 0.01) d.text(String(v), cx, cy, { size, font: 'mono', weight: 700, color: textOnGray(v), align: 'center', base: 'middle', a: g.numA * g.picA });
        if (g.picA < 0.99) d.text(String(v), cx, cy, { size, font: 'mono', weight: 700, color: p.ink, align: 'center', base: 'middle', a: g.numA * (1 - g.picA) });
      }
    }
    // índices de fila y columna (para ubicar píxeles, también con el teclado)
    if (g.idxA > 0.01) d.withAlpha(g.idxA, () => {
      for (let k = 0; k < N; k++) {
        d.text(String(k + 1), G.x + k * cell + cell / 2, G.y - 6 * u, { size: T(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'bottom' });
        d.text(String(k + 1), G.x - 6 * u, G.y + k * cell + cell / 2, { size: T(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' });
      }
    });
    hl.forEach((h) => { const r = cellRect(L, h.i), t = tone(S, h.tone); d.rect(r.x + 1, r.y + 1, cell - 2, cell - 2, { stroke: t.c, lw: h.lw ?? 3, dash: h.dash }); });
  });
}

function gridTitle(S: Frame): string {
  if (S.on('color-intro')) return S.l('imagen en color', 'color image');
  if (S.on('blur-intro')) return S.l('matriz de brillos', 'brightness matrix');
  if (S.on('paint-demo')) return userPainted(S) ? S.l('tu dibujo: una matriz', 'your drawing: a matrix') : S.on('neighbors') ? S.l('la carita: una matriz', 'the little face: a matrix') : S.l('un dibujo: una matriz', 'a drawing: a matrix');
  if (S.on('matrix')) return S.l('matriz de números', 'matrix of numbers');
  if (S.on('brightness')) return S.l('imagen en grises', 'grayscale image');
  return S.l('imagen', 'image');
}

// ── cinta de números (el vector): las celdas en fila, una tras otra ──
interface RG { cols: number; rows: number; cw: number; ch: number; w: number; h: number; fz: number }
function rGeom(S: Frame, w: number): RG {
  let cols = 8;
  for (const c of [32, 16, 12]) if (w / c >= (c === 12 ? 23 : 24)) { cols = c; break; }
  const cw = Math.min(46, w / cols), fz = S.portrait ? 12 : clamp(cw * 0.44, 12, 15), ch = S.portrait ? 18 : Math.round(fz * 1.75);
  return { cols, rows: Math.ceil(NC / cols), cw, ch, w: cw * cols, h: Math.ceil(NC / cols) * ch, fz };
}
const rCell = (g: RG, x: number, y: number, i: number): Rect => ({ x: x + (i % g.cols) * g.cw, y: y + Math.floor(i / g.cols) * g.ch, w: g.cw, h: g.ch });

/** Una celda de la cinta: gris de dato (si picA) o neutra con la cifra en tinta. */
function ribbonCell(S: Frame, g: RG, x: number, y: number, i: number, v0: number, picA: number) {
  const { d, pal: p } = S, r = rCell(g, x, y, i), v = clamp255(v0), size = g.fz / S.u, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  d.rect(r.x, r.y, r.w, r.h, { fill: p.surface });
  if (picA > 0.01) d.rect(r.x, r.y, r.w, r.h, { fill: grayCss(v), a: picA });
  if (picA > 0.01) d.text(String(v), cx, cy, { size, font: 'mono', weight: 600, color: textOnGray(v), align: 'center', base: 'middle', a: picA });
  if (picA < 0.99) d.text(String(v), cx, cy, { size, font: 'mono', weight: 600, color: p.ink, align: 'center', base: 'middle', a: 1 - picA });
}
/** Separadores cada ocho celdas (una fila de la imagen) y marco de la cinta. */
function ribbonFrame(S: Frame, g: RG, x: number, y: number) {
  const { d, pal: p } = S;
  for (let k = 8; k < NC; k += 8) {
    const rc = rCell(g, x, y, k);
    if (k % g.cols === 0) d.line(x, rc.y, x + g.w, rc.y, p.lineStrong, 1.2); else d.line(rc.x, rc.y, rc.x, rc.y + g.ch, p.lineStrong, 1.8);
  }
  d.rect(x - 0.5, y - 0.5, g.w + 1, g.h + 1, { stroke: p.lineStrong, lw: 1.2 });
}
function drawRibbon(S: Frame, x: number, y: number, g: RG, vals: number[], o: { picA: number; a?: number; hl?: Hl[] }) {
  const { d } = S;
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < NC; i++) ribbonCell(S, g, x, y, i, vals[i], o.picA);
    ribbonFrame(S, g, x, y);
    (o.hl ?? []).forEach((h) => { const r = rCell(g, x, y, h.i), t = tone(S, h.tone); d.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, { stroke: t.c, lw: h.lw ?? 2.5 }); });
  });
}

/** Tira estrecha: 64 celdas finas, una por número (cuando no cabe la cinta con cifras). */
function drawStrip(S: Frame, x: number, y: number, w: number, h: number, vals: number[], o: { a?: number; hl?: Hl[] } = {}) {
  const { d, pal: p } = S, cw = w / NC;
  d.withAlpha(o.a ?? 1, () => {
    for (let i = 0; i < NC; i++) d.rect(x + i * cw, y, cw + 0.4, h, { fill: grayCss(clamp255(vals[i])) });
    d.rect(x - 0.5, y - 0.5, w + 1, h + 1, { stroke: p.lineStrong, lw: 1.2 });
    (o.hl ?? []).forEach((hh) => { const t = tone(S, hh.tone); d.rect(x + hh.i * cw - 1, y - 2, cw + 2, h + 4, { stroke: t.c, lw: 2 }); });
  });
}

/** Corchetes de un vector. */
function brackets(S: Frame, x0: number, x1: number, y: number, h: number, c: string, a = 1) {
  const { d } = S, k = 6 * S.u;
  d.withAlpha(a, () => {
    d.line(x0, y, x0, y + h, c, 2.5); d.line(x0, y, x0 + k, y, c, 2.5); d.line(x0, y + h, x0 + k, y + h, c, 2.5);
    d.line(x1, y, x1, y + h, c, 2.5); d.line(x1, y, x1 - k, y, c, 2.5); d.line(x1, y + h, x1 - k, y + h, c, 2.5);
  });
}

/** Línea de lectura: rótulo a la izquierda, valor en mono a la derecha. */
function stat(S: Frame, x: number, y: number, w: number, label: string, value: string, t: 'sig' | 'err' | 'w' | 'dat' | 'lat' | 'ink', a = 1) {
  const { d, pal: p } = S, tc = tone(S, t);
  d.withAlpha(a, () => {
    // si etiqueta y valor no caben juntos (teléfono pequeño), la etiqueta se achica y, si hace falta, se recorta con «…»
    const vw = d.measure(value, { size: T(S, 15), weight: 700, font: 'mono' }), room = w - vw - 8 * S.u;
    let ls = T(S, 13), lab = label;
    while (ls > T(S, 12) && d.measure(lab, { size: ls, weight: 600 }) > room) ls -= 0.5;
    while (lab.length > 4 && d.measure(lab, { size: ls, weight: 600 }) > room) lab = lab.slice(0, -2).trimEnd() + '…';
    d.text(lab, x, y, { size: ls, weight: 600, color: p.ink2, base: 'middle' });
    d.text(value, x + w, y, { size: T(S, 15), weight: 700, font: 'mono', color: tc.ink, align: 'right', base: 'middle' });
    d.line(x, y + 11 * S.u, x + w, y + 11 * S.u, p.line, 1);
  });
}
/** Globo de diálogo propio: texto de 15 px nominales (≥ 12 px efectivos) con rabito. */
function speech(S: Frame, text: string, x: number, y: number, w: number, a = 1) {
  const { d, pal: p } = S, u = S.u, size = T(S, 15), lines = d.wrap(text, w - 24 * u, { size, weight: 600 }), h = lines.length * size * 1.3 * u + 20 * u;
  d.withAlpha(a, () => {
    d.rect(x, y, w, h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 6 });
    d.polygon([[x + 22 * u, y + h], [x + 32 * u, y + h], [x + 18 * u, y + h + 10 * u]], { fill: p.surface, stroke: p.lineStrong, lw: 1.5 });
    d.rect(x + 23 * u, y + h - 1, 9 * u, 3, { fill: p.surface });
    d.text(text, x + 12 * u, y + 15 * u, { size, weight: 600, color: p.ink, w: w - 24 * u });
  });
  return { w, h };
}
/** Barras horizontales con cifras de 13 px nominales. */
function hbars(S: Frame, r: Rect, rows: { label: string; value: number; tone: 'dat' | 'lat'; hot?: boolean }[], o: { max: number; show: number; rowH: number; labelW: number; fmt: (v: number) => string }) {
  const { d, pal: p } = S, u = S.u;
  rows.forEach((row, i) => {
    const a = clamp(o.show - i); if (a <= 0) return;
    const y = r.y + i * o.rowH, t = tone(S, row.tone), valW = 52 * u, bx = r.x + o.labelW, bw = Math.max(20 * u, r.w - o.labelW - valW), len = (bw * row.value) / o.max;
    d.withAlpha(a, () => {
      d.text(row.label, bx - 8 * u, y + o.rowH / 2, { size: T(S, 15), weight: row.hot ? 800 : 600, color: row.hot ? p.ink : p.ink2, align: 'right', base: 'middle' });
      d.rect(bx, y + o.rowH * 0.18, bw, o.rowH * 0.64, { fill: p.surface2 });
      d.rect(bx, y + o.rowH * 0.18, len, o.rowH * 0.64, { fill: row.hot ? t.c : alpha(t.c, 0.55) });
      d.text(o.fmt(row.value), r.x + r.w, y + o.rowH / 2, { size: T(S, 13), font: 'mono', weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    });
  });
}
const tagText = (S: Frame, text: string, x: number, y: number, t: 'sig' | 'err' | 'w' | 'dat' | 'lat' | 'ink' | 'mute', a = 1, align: CanvasTextAlign = 'left') =>
  badge(S, text, x, y, { tone: t, a, size: T(S, 12), align });

// ═════════════════════════════════════════════════════════════════════════
// La escena
// ═════════════════════════════════════════════════════════════════════════
const scene: SceneFactory = () => ({
  controls: [
    { id: 'brush', kind: 'choice', label: { es: 'Pincel', en: 'Brush' }, value: 255, from: 'paint-intro', to: 'neighbors',
      options: [{ value: 255, label: { es: 'Blanco', en: 'White' } }, { value: 128, label: { es: 'Gris', en: 'Gray' } }, { value: 0, label: { es: 'Borrar', en: 'Erase' } }] },
    { id: 'row', kind: 'slider', label: { es: 'Teclado: fila', en: 'Keyboard: row' }, min: 1, max: 8, step: 1, value: 4, from: 'paint-intro', to: 'neighbors', fmt: (v) => String(v) },
    { id: 'col', kind: 'slider', label: { es: 'Teclado: columna', en: 'Keyboard: column' }, min: 1, max: 8, step: 1, value: 4, from: 'paint-intro', to: 'neighbors', fmt: (v) => String(v) },
    { id: 'clear', kind: 'button', label: { es: 'Limpiar', en: 'Clear' }, from: 'paint-intro', to: 'neighbors' },
    { id: 'blur', kind: 'slider', label: { es: 'Desenfoque', en: 'Blur' }, min: 0, max: 4, step: 1, value: 1, from: 'blur-try', to: 'color-intro', fmt: (v) => `${BLUR_PCT[Math.round(v)] ?? v} %` },
    { id: 'rate', kind: 'slider', label: { es: 'Muestras por segundo', en: 'Samples per second' }, min: 200, max: 4000, step: 100, value: 2000, from: 'sound-demo', to: 'sound-real', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US') },
    { id: 'word', kind: 'text', label: { es: 'Palabra', en: 'Word' }, value: 'Neu', maxLength: 8, placeholder: { es: 'escribe una palabra', en: 'type a word' }, from: 'text-codes', to: 'text-vectors' },
  ],

  init(S) { S.st.d = newSt(); },

  action(S, id) {
    const d = D(S);
    if (id === 'clear') { d.paint = Array(NC).fill(0); d.touched = Array(NC).fill(false); d.seeded = true; d.cur = null; d.last = null; }
  },

  pointer(S, e: PointerEvt) {
    if (!paintOn(S)) return;
    const L = lay(S), d = D(S), cell = cellAt(L, e.x, e.y);
    if (e.type === 'down') { if (cell) { paintCell(S, cell[0], cell[1]); d.last = cell; } }
    else if (e.type === 'move' && S.ptr.down) { if (cell) { if (d.last) paintLine(S, d.last, cell); else paintCell(S, cell[0], cell[1]); d.last = cell; } }
    else if (e.type === 'up' || e.type === 'leave') d.last = null;
  },

  cursor(S, x, y) { return paintOn(S) && cellAt(lay(S), x, y) ? 'crosshair' : undefined; },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const d = D(S);
    if (paintOn(S)) {
      // teclado: mover fila y columna pinta el camino recorrido
      const kb: [number, number] = [clamp(Math.round(Number(S.p.row ?? 4)), 1, N) - 1, clamp(Math.round(Number(S.p.col ?? 4)), 1, N) - 1];
      if (d.kb && (d.kb[0] !== kb[0] || d.kb[1] !== kb[1]) && (S.touched.has('row') || S.touched.has('col'))) paintLine(S, d.kb, kb);
      d.kb = kb;
      if (d.touched.filter(Boolean).length >= 10) S.complete('paint');
    }
    // desenfoque: la escena lo sube sola del 25 % al 100 % mientras lo explica
    if (S.between('blur-numbers', 'color-intro')) S.drive('blur', S.on('blur-try') ? Math.round(lerp(1, 4, fr(S, 'blur-try', 0.08, 0.6, 'io'))) : 1);
    // muestreo: baja de 2 000 a 600 por segundo (la onda se deforma) y vuelve a 2 000
    if (S.between('samples', 'sound-real')) {
      let rate = 2000;
      if (S.on('sound-demo')) rate = lerp(2000, 600, fr(S, 'sound-demo', 0.25, 0.6, 'io'));
      if (S.on('sound-try')) rate = lerp(600, 2000, fr(S, 'sound-try', 0.04, 0.3, 'io'));
      S.drive('rate', Math.round(rate / 100) * 100);
    }
    const tgt = blurTarget(S);
    d.lv += (tgt - d.lv) * (1 - Math.exp(-S.dt * 18));
    if (Math.abs(tgt - d.lv) < 0.004) d.lv = tgt;
    if (S.between('blur-try', 'color-intro') && S.touched.has('blur') && Number(S.p.blur ?? 1) >= 4) S.complete('blur');
    // el «tu turno» del sonido se cumple cuando la persona baja tanto las muestras que la onda reconstruida ya no coincide
    if (S.between('sound-try', 'sound-real') && S.touched.has('rate') && sample(Number(S.p.rate ?? 2000)).err > 0.05) { d.bad = true; S.complete('rate'); }
  },

  render(S) {
    const { d } = S;
    const L = lay(S);
    const toSound = S.at('sound-intro', 0, 0.9);
    if (toSound < 1) d.withAlpha(1 - toSound, () => drawWork(S, L));
    const sound = win(S, 'sound-intro', 'text-codes', 0.9, 0.9);
    if (sound > 0) d.withAlpha(sound, () => drawSound(S));
    const text = win(S, 'text-codes', 'mnist', 0.9, 0.9);
    if (text > 0) d.withAlpha(text, () => drawText(S));
    const scale1 = win(S, 'mnist', 'photo', 0.9, 0.9);
    if (scale1 > 0) d.withAlpha(scale1, () => drawMnist(S));
    const photo = win(S, 'photo', 'recap', 0.9, 0.9);
    if (photo > 0) d.withAlpha(photo, () => drawPhoto(S));
    const recap = win(S, 'recap', 'bridge', 0.9, 0.9);
    if (recap > 0) d.withAlpha(recap, () => drawRecap(S));
    const bridge = S.at('bridge', 0, 0.9);
    if (bridge > 0) d.withAlpha(bridge, () => drawBridge(S));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Acto 1: la carita (hook … tensor)
// ═════════════════════════════════════════════════════════════════════════
function drawWork(S: Frame, L: Lay) {
  const { d, pal: p } = S, u = S.u, dd = D(S);
  const g = gridState(S);
  const hl: Hl[] = [];
  const painting = paintOn(S);

  // marcas: resaltados según el segmento
  if (S.between('one-pixel', 'matrix')) { if (rv(S, 'one-pixel', 0.15) > 0.5) hl.push({ i: PX_DARK, tone: 'w', lw: 3.5 }); if (rv(S, 'one-pixel', 0.55) > 0.5) hl.push({ i: PX_LIGHT, tone: 'sig', lw: 3.5 }); }
  if (S.between('color-intro', 'tensor')) hl.push({ i: FACE_PX, tone: 'sig' });
  if (S.between('blur-intro', 'blur-numbers')) {
    const k = hoodStep(S), c = 2 + k;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) hl.push({ i: (2 + dr) * N + c + dc, tone: 'sig', lw: dr === 0 && dc === 0 ? 3.5 : 1.6 });
  }
  // pintar: celda del teclado y celda bajo el puntero
  if (painting && S.on('paint-intro')) {
    const kr = clamp(Math.round(Number(S.p.row ?? 4)), 1, N) - 1, kc = clamp(Math.round(Number(S.p.col ?? 4)), 1, N) - 1;
    hl.push({ i: kr * N + kc, tone: 'sig', lw: 2, dash: [5, 3] });
    if (S.ptr.inside && !S.coarse) { const c = cellAt(L, S.ptr.x, S.ptr.y); if (c) hl.push({ i: c[0] * N + c[1], tone: 'ink', lw: 2 }); }
  }
  // vecindad: la última celda pintada y la de abajo
  const nb = neighborPair(S);
  if (S.between('neighbors', 'blur-intro') && nb && rv(S, 'neighbors', 0.35) > 0.5) hl.push({ i: nb.a, tone: 'err', lw: 3.5 }, { i: nb.b, tone: 'dat', lw: 3.5 });

  drawGrid(S, L, g, hl);


  // rótulo de la cuadrícula
  d.withAlpha(rv(S, 'hook', 0.03) * g.alpha, () => {
    d.text(gridTitle(S), L.G.x, L.G.y - 28 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'bottom' });
  });

  // lectura numérica y panel lateral
  drawAside(S, L, g, nb);
  void dd;
}

/** Último píxel pintado (o uno por defecto) y el de abajo (o el de arriba si está en el borde). */
function neighborPair(S: Frame): { a: number; b: number } | null {
  const c = D(S).cur ?? [3, 3];
  const r = c[0], q = c[1];
  const a = r * N + q, b = (r < N - 1 ? r + 1 : r - 1) * N + q;
  return { a, b };
}

function drawAside(S: Frame, L: Lay, g: GridState, nb: { a: number; b: number } | null) {
  const A = L.A;
  const aHook = win(S, 'hook', 'pixels', 0.6, 0.4);
  if (aHook > 0) asideHook(S, A, aHook);
  const aPix = win(S, 'pixels', 'brightness', 0.6, 0.4);
  if (aPix > 0) asidePixels(S, L, aPix);
  const aBr = win(S, 'brightness', 'matrix', 0.6, 0.4);
  if (aBr > 0) asideBrightness(S, A, aBr);
  const aMat = win(S, 'matrix', 'flatten-why', 0.6, 0.4);
  if (aMat > 0) asideMatrix(S, A, aMat);
  const aWhy = win(S, 'flatten-why', 'flatten', 0.6, 0.4);
  if (aWhy > 0) asideWhy(S, A, aWhy);
  // la cinta (vector) vive desde «flatten» hasta «feature», y otra vez en la parte de pintar
  const aFlat = win(S, 'flatten', 'feature', 0.2, 0.5) * (S.on('flatten') && !S.on('feature') ? rv(S, 'flatten', 0.05) : 1);
  if (aFlat > 0) asideRibbon(S, L, g, aFlat, null, true);
  const aFeat = win(S, 'feature', 'paint-demo', 0.6, 0.4);
  if (aFeat > 0) drawFeatureAct(S, L.all, aFeat);
  const aPaint = win(S, 'paint-demo', 'blur-intro', 0.6, 0.4);
  if (aPaint > 0) asideRibbon(S, L, g, aPaint, nb, false);
  const aHood = win(S, 'blur-intro', 'blur-numbers', 0.6, 0.4);
  if (aHood > 0) asideHood(S, L, aHood);
  const aBlur = win(S, 'blur-numbers', 'blur-reflect', 0.6, 0.4);
  if (aBlur > 0) asideBlur(S, L, aBlur);
  const aKer = win(S, 'blur-reflect', 'color-intro', 0.6, 0.4);
  if (aKer > 0) asideKernel(S, L, aKer);
  const aCol = win(S, 'color-intro', 'channels', 0.6, 0.4);
  if (aCol > 0) asidePixelRGB(S, L, aCol);
  const aCh = win(S, 'channels', 'tensor', 0.6, 0.4);
  if (aCh > 0) asideChannels(S, L, aCh);
  const aTen = win(S, 'tensor', 'sound-intro', 0.6, 0.4);
  if (aTen > 0) asideTensor(S, L, aTen);
}

// ── hook: la pregunta ─────────────────────────────────────────────────────
function asideHook(S: Frame, A: Rect, a: number) {
  const u = S.u;
  const sc = S.portrait ? 4 : clamp(Math.round(A.w / 70), 5, 9), nw = 24 * sc, nh = 18 * sc;
  if (S.portrait) {
    neu(S, A.x + 8 * u, A.y + (A.h - nh) / 2, { scale: sc, mood: 'think', a });
    speech(S, S.l('¿Qué recibe el modelo?', 'What does the model receive?'), A.x + nw + 30 * u, A.y + Math.max(2, (A.h - 70 * u) / 2), Math.min(190 * u, A.w - nw - 40 * u), a);
  } else {
    const cx = A.x + A.w / 2, cy = A.y + A.h * 0.55;
    neu(S, cx - nw / 2, cy - nh / 2 + 24 * u, { scale: sc, mood: 'think', a });
    speech(S, S.l('¿Qué recibe el modelo?', 'What does the model receive?'), cx - 110 * u, cy - nh / 2 - 74 * u, 230 * u, a);
  }
}

// ── pixels: tamaño ────────────────────────────────────────────────────────
function asidePixels(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const anchorC = cellRect(L, (S.portrait ? 7 : 2) * N + 7), ax = anchorC.x + anchorC.w / 2, ay = anchorC.y + anchorC.h / 2;
  d.withAlpha(a, () => {
    if (S.portrait) {
      d.withAlpha(rv(S, 'grid-size', 0.35), () => d.text(S.l('8 × 8 = 64 píxeles', '8 × 8 = 64 pixels'), A.x + A.w / 2, A.y + A.h * 0.5, { size: 22, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' }));
    } else {
      d.withAlpha(rv(S, 'grid-size', 0.35), () => d.text('8 × 8', A.x + A.w / 2, A.y + A.h * 0.42, { size: 48, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' }));
      d.withAlpha(rv(S, 'grid-size', 0.7), () => d.text(S.l('= 64 píxeles', '= 64 pixels'), A.x + A.w / 2, A.y + A.h * 0.42 + 46 * u, { size: 20, weight: 700, color: p.ink2, align: 'center', base: 'middle' }));
    }
    const s = rv(S, 'pixels', 0.55) * (1 - S.at('grid-size', 0, 0.4));
    d.withAlpha(s, () => {
      const tx = S.portrait ? A.x + A.w - 96 * u : A.x, ty = S.portrait ? A.y - 4 * u : ay - 22 * u;
      callout(S, S.l('un píxel', 'one pixel'), tx, ty, [ax, ay], { tone: 'sig', w: 92 * u, size: T(S, 13) });
    });
  });
}

// ── brightness / gray-mid / one-pixel: la escala de grises de 0 a 255 ─────
function asideBrightness(S: Frame, A: Rect, a: number) {
  const { d, pal: p } = S, u = S.u;
  const bw = Math.min(A.w - 8 * u, 440 * u), bx = A.x + (S.portrait ? 0 : 6 * u), by = A.y + (S.portrait ? 40 * u : Math.max(56 * u, (A.h - 160 * u) * 0.35)), bh = 20 * u;
  d.withAlpha(a * rv(S, 'brightness', 0.3), () => {
    const n = 48;
    for (let k = 0; k < n; k++) d.rect(bx + (bw * k) / n, by, bw / n + 0.6, bh, { fill: grayCss(Math.round((255 * k) / (n - 1))) });
    d.rect(bx - 0.5, by - 0.5, bw + 1, bh + 1, { stroke: p.lineStrong, lw: 1.2 });
    const marks: [number, string, CanvasTextAlign, number][] = [
      [0, S.l('0 · negro', '0 · black'), 'left', rv(S, 'brightness', 0.45)],
      [1, S.l('255 · blanco', '255 · white'), 'right', rv(S, 'brightness', 0.7)],
      [128 / 255, S.l('128 · gris', '128 · gray'), 'center', rv(S, 'gray-mid', 0.6)],
    ];
    marks.forEach(([f, lbl, al, ma]) => {
      if (ma < 0.01) return;
      const x = bx + bw * f;
      d.withAlpha(ma, () => {
        d.line(x, by + bh, x, by + bh + 5 * u, p.lineStrong, 1.5);
        d.text(lbl, x, by + bh + 8 * u, { size: T(S, 13), weight: 700, font: 'mono', color: p.ink2, align: al, base: 'top' });
      });
    });
    d.text(S.l('qué tan claro es un píxel', 'how light a pixel is'), bx, by - 34 * u, { size: T(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
    // «gray-mid»: más grande = más claro
    const gm = S.between('gray-mid', 'one-pixel') ? rv(S, 'gray-mid', 0.2) : 0;
    if (gm > 0.01) { d.arrow(bx + bw * 0.2, by + bh + 40 * u, bx + bw * 0.8, by + bh + 40 * u, p.ink2, 2.5, 9, gm); d.text(S.l('número más grande = gris más claro', 'bigger number = lighter gray'), bx + bw / 2, by + bh + 48 * u, { size: T(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top', a: gm }); }
    // «one-pixel»: dónde caen en la escala los dos píxeles señalados
    if (S.on('one-pixel')) ([[PX_DARK, 0.15, 'w'], [PX_LIGHT, 0.55, 'sig']] as const).forEach(([i, f, t]) => {
      const ma = rv(S, 'one-pixel', f + 0.05), v = SMILE_GRAY[i], x = bx + (bw * v) / 255, tc = tone(S, t);
      if (ma < 0.01) return;
      d.withAlpha(ma, () => { d.polygon([[x - 7 * u, by - 12 * u], [x + 7 * u, by - 12 * u], [x, by - 2 * u]], { fill: tc.c, stroke: p.stage, lw: 1 }); });
      badge(S, String(v), x, by - 24 * u, { tone: t, a: ma, size: T(S, 13) });
    });
  });
}

// ── matrix: lo que recibe el modelo ───────────────────────────────────────
function asideMatrix(S: Frame, A: Rect, a: number) {
  const { d, pal: p } = S, u = S.u;
  d.withAlpha(a, () => {
    const cx = A.x + A.w / 2, ty = A.y + (S.portrait ? 14 * u : A.h * 0.3);
    tagText(S, S.l('lo que recibe el modelo', 'what the model receives'), cx, ty, 'dat', rv(S, 'sees-numbers', 0.1), 'center');
    const s2 = rv(S, 'matrix', 0.55);
    d.withAlpha(s2, () => {
      d.text(S.l('matriz de 8 filas y 8 columnas', 'matrix of 8 rows and 8 columns'), cx, ty + 32 * u, { size: T(S, 15), weight: 700, color: p.ink, align: 'center', base: 'top', w: A.w - 12 * u });
      if (!S.portrait) neu(S, cx - 36 * u, ty + 90 * u, { scale: Math.max(3, Math.round(3.4 * u)), mood: 'wow', a: rv(S, 'sees-numbers', 0.45) });
    });
  });
}

// ── flatten-why: en la lección 1 el modelo recibía una lista, no una tabla ──
function asideWhy(S: Frame, A: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, tD = tone(S, 'dat');
  const x = A.x + (S.portrait ? 4 : 12) * u, y = A.y + (S.portrait ? 14 * u : A.h * 0.28), cw = 64 * u, ch = 40 * u;
  d.withAlpha(a, () => {
    d.text(S.l('lección 1: un correo era una lista', 'lesson 1: an email was a list'), x, y, { size: T(S, 14), weight: 700, color: p.ink2, base: 'top', w: A.w - 16 * u });
    const y1 = y + 30 * u;
    [['4', S.l('enlaces', 'links')], ['22 %', S.l('mayúsculas', 'capitals')]].forEach(([v, l], k) => {
      const bx = x + 10 * u + k * (cw + 8 * u);
      d.rect(bx, y1, cw, ch, { fill: tD.soft, stroke: tD.c, lw: 1.5 });
      d.text(v, bx + cw / 2, y1 + ch / 2, { size: T(S, 18), weight: 800, font: 'mono', color: tD.ink, align: 'center', base: 'middle' });
      d.text(l, bx + cw / 2, y1 + ch + 4 * u, { size: T(S, 12), weight: 600, color: p.ink2, align: 'center', base: 'top' });
    });
    brackets(S, x + 2 * u, x + 18 * u + 2 * cw + 8 * u, y1 - 4 * u, ch + 8 * u, p.ink);
    const t2 = rv(S, 'flatten-why', 0.6);
    d.text(S.l('tabla de 8 × 8  →  una lista de 64', '8 × 8 table  →  one list of 64'), x, y1 + ch + 34 * u, { size: T(S, 15), weight: 800, color: p.ink, base: 'top', a: t2, w: A.w - 16 * u });
  });
}

// ── flatten y turno de pintar: la cinta (vector) ──────────────────────────
function asideRibbon(S: Frame, L: Lay, g: GridState, a: number, nb: { a: number; b: number } | null, animate: boolean) {
  const { d, pal: p } = S, A = L.A, u = S.u, dd = D(S);
  const rg = rGeom(S, A.w - 4 * u);
  const painting = paintOn(S), reading = !!nb && S.on('neighbors');
  const statH = S.portrait ? (reading ? 38 : 26) * u : (reading ? 74 : 92) * u, headH = (S.portrait ? 17 : 28) * u;
  const contentH = headH + rg.h + statH + 14 * u;
  const hy = A.y + (S.portrait ? 0 : Math.max(0, (A.h - contentH) * 0.42)), ry = hy + headH, rx = A.x + 2 * u;
  const vals = g.vals;
  d.withAlpha(a, () => {
    d.text(S.l('vector: 64 números, fila tras fila', 'vector: 64 numbers, row after row'), A.x, hy, { size: T(S, 14), weight: 700, color: p.ink2, base: 'top' });
    // vuelo de las filas desde la cuadrícula
    // las filas vuelan una tras otra entre el 10 % y el 85 % del segmento (en «unidades» de 3.6 de largo)
    const t0 = fr(S, 'flatten', 0.1, 0.85, 'lin') * 3.6;
    const fly = (i: number) => (S.on('flatten') && animate ? sm((t0 - rowOf(i) * 0.3 - colOf(i) * 0.02) / 1.0) : 1);
    d.withAlpha(0.35, () => { for (let i = 0; i < NC; i++) { const r = rCell(rg, rx, ry, i); d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1 }); } });
    for (let i = 0; i < NC; i++) if (fly(i) >= 0.999) ribbonCell(S, rg, rx, ry, i, vals[i], g.picA);
    ribbonFrame(S, rg, rx, ry);
    for (let i = 0; i < NC; i++) {
      const f = fly(i); if (f <= 0 || f >= 0.999) continue;
      const from = cellRect(L, i), to = rCell(rg, rx, ry, i), e = ease.io(f);
      const x = lerp(from.x, to.x, e), y = lerp(from.y, to.y, e), w = lerp(from.w, to.w, e), h = lerp(from.h, to.h, e);
      d.rect(x, y, w, h, { fill: p.surface, stroke: tone(S, 'dat').c, lw: 1.5 });
      d.text(String(clamp255(vals[i])), x + w / 2, y + h / 2, { size: rg.fz / u, font: 'mono', weight: 700, color: p.ink, align: 'center', base: 'middle' });
    }
    // vecindad / lectura
    const by = ry + rg.h + (S.portrait ? 6 : 14) * u;
    if (reading && nb) {
      const ta = tone(S, 'err'), tb = tone(S, 'dat');
      const ra = rCell(rg, rx, ry, nb.a), rb = rCell(rg, rx, ry, nb.b);
      const s = rv(S, 'neighbors', 0.35);
      d.withAlpha(s, () => {
        d.rect(ra.x + 1, ra.y + 1, ra.w - 2, ra.h - 2, { stroke: ta.c, lw: 3 });
        d.rect(rb.x + 1, rb.y + 1, rb.w - 2, rb.h - 2, { stroke: tb.c, lw: 3 });
        const ga = cellRect(L, nb.a), gb = cellRect(L, nb.b);
        d.line(ga.x + ga.w, ga.y + ga.h / 2, ra.x, ra.y + ra.h / 2, alpha(ta.c, 0.7), 1.5, [4, 3]);
        d.line(gb.x + gb.w, gb.y + gb.h / 2, rb.x, rb.y + rb.h / 2, alpha(tb.c, 0.7), 1.5, [4, 3]);
        const pa = nb.a + 1, pb = nb.b + 1, lh = (S.portrait ? 17 : 24) * u, fz = T(S, S.portrait ? 13 : 15);
        d.text(S.l(`posición ${pa}  →  posición ${pb}`, `position ${pa}  →  position ${pb}`), A.x, by + 4 * u, { size: fz, weight: 700, color: p.ink, base: 'top' });
        if (S.portrait) {
          d.text(S.l(`en la lista: ${Math.abs(pb - pa)} lugares · en la imagen: 1`, `in the list: ${Math.abs(pb - pa)} places · in the image: 1`), A.x, by + 4 * u + lh, { size: fz, weight: 700, color: tb.ink, base: 'top' });
        } else {
          d.text(S.l(`distancia en la lista: ${Math.abs(pb - pa)}`, `distance in the list: ${Math.abs(pb - pa)}`), A.x, by + 4 * u + lh, { size: fz, weight: 700, color: tb.ink, base: 'top' });
          d.text(S.l('distancia en la imagen: 1 píxel', 'distance in the image: 1 pixel'), A.x, by + 4 * u + 2 * lh, { size: fz, weight: 700, color: ta.ink, base: 'top' });
        }
      });
    } else if (painting) {
      const lit = vals.filter((v) => v > 0).length, mean = vals.reduce((q, v) => q + v, 0) / NC;
      const c = dd.cur, w = S.portrait ? (A.w - 8 * u) / 2 : Math.min(A.w, 380 * u);
      const lines: [string, string, 'dat' | 'w' | 'sig'][] = [
        [S.portrait ? S.l('encendidos', 'lit') : S.l('píxeles encendidos', 'lit pixels'), `${lit} / 64`, 'dat'],
        [S.l('brillo medio', 'mean brightness'), S.n(mean, 1), 'w'],
      ];
      if (c && !S.portrait) lines.push([S.l('último píxel (fila, columna)', 'last pixel (row, column)'), `(${c[0] + 1}, ${c[1] + 1}) = ${clamp255(vals[c[0] * N + c[1]])}`, 'sig']);
      lines.forEach(([l, v, t], k) => stat(S, A.x + (S.portrait ? k * (w + 8 * u) : 0), by + (S.portrait ? 10 : 18) * u + (S.portrait ? 0 : k * 28 * u), w, l, v, t, rv(S, 'paint-demo', 0.1)));
    }
  });
}

// ── feature y vector: dos medidas frente a sesenta y cuatro (ocupa todo el escenario) ──
function drawFeatureAct(S: Frame, all: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, tD = tone(S, 'dat');
  const showVec = S.on('vector') ? rv(S, 'vector', 0.05) : 0;
  const x0 = all.x + 12 * u, w = all.w - 24 * u, gx = x0 + 14 * u;
  d.withAlpha(a, () => {
    // fila 1: un correo con dos medidas (ilustrativo, como en la lección anterior); aparece cuando la narración llega a él
    d.withAlpha(rv(S, 'feature', 0.3), () => {
    const y1 = all.y + (S.portrait ? 40 : 54) * u, cw = clamp(w * 0.16, 62 * u, 96 * u), ch = 46 * u, gap = 8 * u;
    d.text(S.l('un correo', 'an email'), x0, y1 - 14 * u, { size: T(S, 15), weight: 700, color: p.ink2, base: 'bottom' });
    tagText(S, S.l('ilustrativo', 'illustrative'), x0 + w, y1 - 22 * u, 'mute', 1, 'right');
    const feats: [string, string][] = [['4', S.l('enlaces', 'links')], ['22 %', S.l('mayúsculas', 'capital letters')]];
    feats.forEach(([v, lbl], k) => {
      const x = gx + k * (cw + gap);
      d.rect(x, y1, cw, ch, { fill: tD.soft, stroke: tD.c, lw: 1.5 });
      d.text(v, x + cw / 2, y1 + ch / 2, { size: 24, weight: 800, font: 'mono', color: tD.ink, align: 'center', base: 'middle' });
      d.text(lbl, x + cw / 2, y1 + ch + 6 * u, { size: T(S, 13), weight: 600, color: p.ink2, align: 'center', base: 'top' });
    });
    const fx = gx + 2 * cw + gap;
    d.withAlpha(rv(S, 'feature', 0.6), () => d.text(S.l('2 características', '2 features'), fx + 22 * u, y1 + ch / 2, { size: T(S, 17), weight: 800, color: tD.ink, base: 'middle' }));
    brackets(S, gx - 9 * u, fx + 9 * u, y1 - 4 * u, ch + 8 * u, p.ink, showVec);
    d.withAlpha(showVec, () => tagText(S, S.l('vector de 2 números', 'vector of 2 numbers'), S.portrait ? x0 : fx + 22 * u + (S.lang === 'es' ? 150 : 120) * u, S.portrait ? y1 + ch + 36 * u : y1 + ch / 2 + 34 * u, 'w', 1, 'left'));
    });
    // fila 2: una imagen de 8 × 8, aplanada
    const y2 = S.portrait ? all.y + 176 * u : all.y + all.h * 0.56;
    const cm = S.portrait ? 12 * u : clamp(all.h * 0.12, 9 * u, 18 * u), pw = cm * N, sh = (S.portrait ? 40 : 46) * u;
    d.text(S.l('una imagen de 8 × 8', 'an 8 × 8 image'), x0, y2 - 14 * u, { size: T(S, 15), weight: 700, color: p.ink2, base: 'bottom' });
    for (let i = 0; i < NC; i++) d.rect(gx + colOf(i) * cm, y2 + rowOf(i) * cm, cm + 0.3, cm + 0.3, { fill: grayCss(SMILE_GRAY[i]) });
    d.rect(gx - 0.5, y2 - 0.5, pw + 1, pw + 1, { stroke: p.lineStrong, lw: 1.2 });
    const sx = S.portrait ? gx : gx + pw + 78 * u, sy = S.portrait ? y2 + pw + 22 * u : y2 + (pw - sh) / 2, sw = S.portrait ? w - 28 * u : all.x + all.w - sx - 14 * u;
    if (!S.portrait) { d.arrow(gx + pw + 10 * u, y2 + pw / 2, gx + pw + 56 * u, y2 + pw / 2, p.ink2, 2.5, 9); d.text(S.l('aplanar', 'flatten'), gx + pw + 33 * u, y2 + pw / 2 - 8 * u, { size: T(S, 12), weight: 700, color: p.ink2, align: 'center', base: 'bottom' }); }
    drawStrip(S, sx, sy, sw, sh, SMILE_GRAY);
    brackets(S, sx - 9 * u, sx + sw + 9 * u, sy - 4 * u, sh + 8 * u, p.ink, showVec);
    if (S.portrait) {
      const tx = gx + pw + 18 * u, tw = all.x + all.w - tx - 8 * u;
      d.withAlpha(rv(S, 'feature', 0.8), () => d.text(S.l('64 características: una por píxel', '64 features: one per pixel'), tx, y2 + pw * 0.3, { size: T(S, 16), weight: 800, color: tD.ink, base: 'middle', w: tw }));
      d.withAlpha(showVec, () => tagText(S, S.l('vector de 64 números', 'vector of 64 numbers'), tx, y2 + pw * 0.78, 'w', 1, 'left'));
    } else {
      d.withAlpha(rv(S, 'feature', 0.8), () => d.text(S.l('64 características: una por píxel', '64 features: one per pixel'), sx, sy + sh + 8 * u, { size: T(S, 17), weight: 800, color: tD.ink, base: 'top' }));
      d.withAlpha(showVec, () => tagText(S, S.l('vector de 64 números', 'vector of 64 numbers'), sx, sy + sh + 42 * u, 'w', 1, 'left'));
    }
  });
}

// ── blur-intro: la ventana 3×3 y su promedio ──────────────────────────────
function asideHood(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const k = hoodStep(S), c = 2 + k;
  const h = hood(SMILE_GRAY, 2, c), cs = clamp(Math.min(A.w * 0.2, A.h * 0.22), 28 * u, 44 * u);
  const x0 = A.x + (S.portrait ? 6 * u : A.w * 0.5 - cs * 1.5 - 60 * u), y0 = A.y + (S.portrait ? 32 * u : A.h * 0.28);
  d.withAlpha(a, () => {
    d.text(S.l('ventana de 3 × 3', '3 × 3 window'), x0, y0 - 8 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'bottom' });
    h.cells.forEach((v, i) => {
      const x = x0 + (i % 3) * cs, y = y0 + Math.floor(i / 3) * cs, t = tone(S, 'sig');
      d.rect(x, y, cs, cs, { fill: v === null ? p.surface2 : grayCss(clamp255(v)), stroke: i === 4 ? t.c : p.lineStrong, lw: i === 4 ? 3 : 1 });
      if (v !== null) d.text(String(clamp255(v)), x + cs / 2, y + cs / 2, { size: 12 / u, font: 'mono', weight: 700, color: textOnGray(clamp255(v)), align: 'center', base: 'middle' });
    });
    // = promedio
    const ex = x0 + cs * 3 + 18 * u, ey = y0 + cs * 1.5;
    d.arrow(ex - 12 * u, ey, ex + 18 * u, ey, p.ink2, 2.5, 9);
    const tx = ex + 28 * u;
    d.text(S.l('promedio', 'average'), tx, ey - 22 * u, { size: T(S, 13), weight: 700, color: p.ink2, base: 'middle' });
    const mv = clamp255(h.mean);
    d.rect(tx, ey - 12 * u, cs, cs * 0.8, { fill: grayCss(mv), stroke: tone(S, 'sig').c, lw: 3 });
    d.text(String(mv), tx + cs / 2, ey - 12 * u + cs * 0.4, { size: 14 / u, font: 'mono', weight: 800, color: textOnGray(mv), align: 'center', base: 'middle' });
  });
}

// ── blur-numbers / blur-try: original y desenfocada (listas, cifras medidas y miniaturas para ver la cara) ──
/** Miniatura en grises de 8×8 con título debajo. */
function thumb(S: Frame, x: number, y: number, cs: number, vals: number[], label: string, hl: number[] = []) {
  const { d, pal: p } = S, u = S.u;
  for (let i = 0; i < NC; i++) d.rect(x + colOf(i) * cs, y + rowOf(i) * cs, cs + 0.3, cs + 0.3, { fill: grayCss(clamp255(vals[i])) });
  d.rect(x - 0.5, y - 0.5, cs * N + 1, cs * N + 1, { stroke: p.lineStrong, lw: 1.2 });
  hl.forEach((i) => d.rect(x + colOf(i) * cs, y + rowOf(i) * cs, cs, cs, { stroke: tone(S, 'sig').c, lw: 1.6 }));
  if (label) d.text(label, x + (cs * N) / 2, y + cs * N + 4 * u, { size: T(S, 12), weight: 700, color: p.ink2, align: 'center', base: 'top' });
}
function asideBlur(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const lvl = blurTarget(S), orig = SMILE_GRAY.map(clamp255), cur = BLUR_LEVELS[lvl].map(clamp255);
  const changed = cur.map((v, i) => v !== orig[i]), nCh = changed.filter(Boolean).length;
  const mad = orig.reduce((s, v, i) => s + Math.abs(v - cur[i]), 0) / NC;
  const rg = rGeom(S, A.w - 4 * u);
  const roomy = !S.portrait && A.h > 2 * rg.h + 150 * u;
  const x = A.x + 2 * u;
  const ts = (S.portrait ? 6 : 7) * u, tw = 2 * N * ts + 10 * u;            // dos miniaturas con su separación
  d.withAlpha(a, () => {
    let y = A.y + 2 * u + (roomy ? Math.max(0, (A.h - (2 * rg.h + 330 * u)) * 0.3) : 0);
    const lab = (t: string, yy: number) => d.text(t, A.x, yy, { size: T(S, 13), weight: 700, color: p.ink2, base: 'top' });
    const pct = `${BLUR_PCT[lvl]} %`;
    if (roomy) {
      lab(S.l('original', 'original'), y); drawRibbon(S, x, y + 20 * u, rg, orig, { picA: 1 });
      y += 20 * u + rg.h + 16 * u;
      lab(S.l(`desenfocada · ${pct}`, `blurred · ${pct}`), y); drawRibbon(S, x, y + 20 * u, rg, cur, { picA: 1 });
      y += 20 * u + rg.h + 14 * u;
    } else {
      const sh = (S.portrait ? 14 : 18) * u, sw = A.w - 8 * u;
      lab(S.l('original', 'original'), y); drawStrip(S, x + 2 * u, y + 18 * u, sw, sh, orig);
      y += 18 * u + sh + 8 * u;
      lab(S.l(`desenfocada · ${pct}`, `blurred · ${pct}`), y); drawStrip(S, x + 2 * u, y + 18 * u, sw, sh, cur);
      y += 18 * u + sh + 10 * u;
    }
    const w = Math.min(A.w - tw - 14 * u, 380 * u);
    const lines: [string, string, 'err' | 'dat' | 'w'][] = [
      [S.l('números que cambiaron', 'numbers that changed'), `${nCh} / 64`, 'err'],
      [S.l('cambio medio (de 255)', 'mean change (of 255)'), S.n(mad, 1), 'w'],
      [S.l('contraste', 'contrast'), `${Math.max(...orig) - Math.min(...orig)} → ${Math.max(...cur) - Math.min(...cur)}`, 'dat'],
    ];
    lines.forEach(([l, v, t], k) => stat(S, A.x, y + 8 * u + k * (S.portrait ? 23 : 28) * u, w, l, v, t));
    // miniaturas: la misma carita, antes y después (sin cifras, para juzgar a simple vista)
    const tx = A.x + w + 14 * u + (A.w - w - 14 * u - tw) * (roomy ? 0.1 : 1), ty = y + 2 * u;
    thumb(S, tx, ty, ts, orig, S.l('antes', 'before'));
    thumb(S, tx + N * ts + 10 * u, ty, ts, cur, S.l('después', 'after'));
  });
}

// ── blur-reflect: la regla de promedio y dos imágenes distintas con el mismo desenfoque completo ──
function asideKernel(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const cs = clamp(Math.min(A.w * 0.12, A.h * 0.16), 24 * u, 40 * u), tcs = clamp(A.w * 0.012, 5, 8) * u;
  const x0 = A.x + 2 * u, y0 = A.y + (S.portrait ? 24 : 34) * u;
  const compact = S.portrait || A.w < 460 * u;   // teléfono vertical u horizontal: el demo va más junto y el rótulo debajo
  const k0 = rv(S, 'blur-reflect', 0.03), kw = Math.max(cs * 3, compact ? 120 * u : 150 * u);
  d.withAlpha(a, () => {
    // columna 1: la regla (promedio de la ventana completa)
    d.withAlpha(k0, () => {
      d.text(S.l('la regla', 'the rule'), A.x, A.y + 2 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'top' });
      for (let i = 0; i < 9; i++) {
        const x = x0 + (i % 3) * cs, y = y0 + Math.floor(i / 3) * cs;
        d.rect(x, y, cs, cs, { fill: tone(S, 'w').soft, stroke: tone(S, 'w').c, lw: 1.5 });
        d.text('1/9', x + cs / 2, y + cs / 2, { size: T(S, 12), font: 'mono', weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'middle' });
      }
      d.text(S.l('promedio de los vecinos', 'average of the neighbors'), x0, y0 + cs * 3 + 8 * u, { size: T(S, 13), weight: 600, color: p.ink2, base: 'top', w: kw });
    });
    // columna 2: dos imágenes que difieren en seis píxeles y dan el mismo resultado
    const dx = x0 + kw + (compact ? 18 : 40) * u, dw = A.x + A.w - dx;
    const ex = 0, rs = 0;   // (el ejemplo de dos imágenes con el mismo desenfoque se quitó: abrumaba)
    const th = tcs * N, gapy = (compact ? 24 : 30) * u, hlI = SMILE_GRAY.map((v, i) => (v !== FACE_B[i] ? i : -1)).filter((i) => i >= 0);
    const R = boxBlur(SMILE_GRAY), yB = y0 + th + gapy;
    const side = !compact, lblW = side ? 112 * u : 0;           // en horizontal el rótulo va a la derecha de la segunda imagen; en teléfono, debajo
    d.withAlpha(ex, () => {
      d.text(S.l('dos imágenes distintas', 'two different images'), dx, A.y + 2 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'top', w: dw });
      thumb(S, dx, y0, tcs, SMILE_GRAY, '');
      thumb(S, dx, yB, tcs, FACE_B, '', hlI);
      const tl = S.l('6 píxeles distintos', '6 different pixels');
      if (side) d.text(tl, dx + th + 8 * u, yB + th / 2, { size: T(S, 13), weight: 700, color: tone(S, 'sig').ink, base: 'middle', w: lblW });
      else d.text(tl, dx, yB + th + 4 * u, { size: T(S, 13), weight: 700, color: tone(S, 'sig').ink, base: 'top', w: dw });
    });
    d.withAlpha(rs, () => {
      const ax = dx + th + 8 * u + lblW + (side ? 10 : 8) * u, rx = Math.min(ax + 56 * u, A.x + A.w - th - 2 * u);
      const ya = y0 + th / 2, yb = yB + th / 2, yr = (ya + yb) / 2;
      d.arrow(ax, ya, rx - 8 * u, yr - 8 * u, p.ink2, 2, 8);
      d.arrow(ax, yb, rx - 8 * u, yr + 8 * u, p.ink2, 2, 8);
      thumb(S, rx, yr - th / 2, tcs, R, '');
      d.text(compact ? S.l('mismo resultado', 'same result') : S.l('con 100 %: el mismo resultado', 'at 100 %: the same result'), Math.min(rx + th / 2, A.x + A.w - 55 * u), yr + th / 2 + 4 * u, { size: T(S, 12), weight: 700, color: tone(S, 'dat').ink, align: 'center', base: 'top', w: compact ? 120 * u : 110 * u });
    });
    tagText(S, S.l('así trabaja una convolución', 'how a convolution works'), x0 + cs * 3 + 16 * u, y0 + cs * 1.5, 'mute', rv(S, 'blur-reflect', 0.45), 'left');
  });
}

// ── color-intro: tres números por píxel ───────────────────────────────────
function asidePixelRGB(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const c = SMILE_RGB[FACE_PX], pr = cellRect(L, FACE_PX);
  const sw = clamp(Math.min(A.w * 0.2, 70 * u), 44 * u, 70 * u);
  const x0 = A.x + (S.portrait ? 6 * u : 12 * u), y0 = A.y + (S.portrait ? 18 * u : A.h * 0.26);
  d.withAlpha(a, () => {
    const bx0 = x0 + sw + 20 * u;   // el rótulo va sobre las barras: así el trazo de enlace con la cuadrícula no lo cruza
    d.text(S.l(`píxel (${rowOf(FACE_PX) + 1}, ${colOf(FACE_PX) + 1})`, `pixel (${rowOf(FACE_PX) + 1}, ${colOf(FACE_PX) + 1})`), S.portrait ? bx0 : x0, y0 - 12 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'bottom' });
    d.withAlpha(rv(S, 'color-intro', 0.15), () => d.rect(x0, y0, sw, sw, { fill: colorOf(c[0], c[1], c[2]), stroke: tone(S, 'sig').c, lw: 3 }));
    // enlace con la cuadrícula
    d.withAlpha(rv(S, 'color-intro', 0.15), () => d.line(pr.x + pr.w, pr.y + pr.h / 2, x0, y0 + sw / 2, alpha(tone(S, 'sig').c, 0.7), 1.5, [4, 3]));
    const bx = x0 + sw + 20 * u, bw = Math.max(60 * u, A.x + A.w - bx - 4 * u);
    d.withAlpha(rv(S, 'color-intro', 0.45), () => CH_NAME.forEach((ch, k) => {
      const y = y0 + k * (sw / 3) + sw / 6, v = c[k];
      d.text(S.l(['rojo', 'verde', 'azul'][k], ['red', 'green', 'blue'][k]), bx, y, { size: T(S, 13), weight: 700, color: p.ink2, base: 'middle' });
      const lx = bx + 52 * u, bwid = Math.max(30 * u, bw - 52 * u - 40 * u);
      d.rect(lx, y - 6 * u, bwid, 12 * u, { fill: p.surface2 });
      d.rect(lx, y - 6 * u, (bwid * v) / 255, 12 * u, { fill: colorOf(...(CH_COLOR[k] as [number, number, number])) });
      d.text(String(v), lx + bwid + 6 * u, y, { size: T(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      void ch;
    }));
    const ty = y0 + sw + 16 * u;
    d.withAlpha(rv(S, 'color-mix', 0.6), () => {
      d.text(`[ ${c[0]}, ${c[1]}, ${c[2]} ]`, x0, ty, { size: 22, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      d.text(S.l('tres números: un vector de 3', 'three numbers: a vector of 3'), x0, ty + 32 * u, { size: T(S, 14), weight: 600, color: p.ink2, base: 'top' });
    });
  });
}

// ── channels: tres matrices ───────────────────────────────────────────────
function chanGrid(S: Frame, x: number, y: number, cs: number, ch: number, a = 1, sel = true) {
  const { d, pal: p } = S, k = cs / N;
  d.withAlpha(a, () => {
    for (let i = 0; i < NC; i++) {
      const v = SMILE_RGB[i][ch], col: [number, number, number] = [0, 0, 0]; col[ch] = v;
      d.rect(x + colOf(i) * k, y + rowOf(i) * k, k + 0.4, k + 0.4, { fill: colorOf(col[0], col[1], col[2]) });
    }
    d.rect(x - 0.5, y - 0.5, cs + 1, cs + 1, { stroke: p.lineStrong, lw: 1.2 });
    if (sel) d.rect(x + colOf(FACE_PX) * k, y + rowOf(FACE_PX) * k, k, k, { stroke: tone(S, 'sig').c, lw: 2 });
  });
}
function asideChannels(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const gap = 10 * u, cs = Math.min((A.w - 2 * gap) / 3, A.h - (S.portrait ? 60 : 90) * u, 190 * u);
  const total = 3 * cs + 2 * gap, x0 = A.x + (A.w - total) / 2, y0 = A.y + (S.portrait ? 20 * u : Math.max(34 * u, (A.h - cs - 90 * u) * 0.4));
  d.withAlpha(a, () => {
    for (let k = 0; k < 3; k++) {
      const s = rv(S, 'channels', 0.1 + k * 0.08);
      const x = x0 + k * (cs + gap);
      d.withAlpha(s, () => {
        chanGrid(S, x, y0, cs, k);
        d.text(S.l(['rojo', 'verde', 'azul'][k], ['red', 'green', 'blue'][k]), x + cs / 2, y0 - 6 * u, { size: T(S, 14), weight: 800, color: p.ink, align: 'center', base: 'bottom' });
        d.text(String(SMILE_RGB[FACE_PX][k]), x + cs / 2, y0 + cs + 6 * u, { size: T(S, 15), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      });
    }
    d.withAlpha(rv(S, 'channels-count', 0.2), () => {
      d.text(S.l('8 × 8 × 3 = 192 números', '8 × 8 × 3 = 192 numbers'), A.x + A.w / 2, y0 + cs + 34 * u, { size: T(S, 17), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
    });
  });
}

// ── tensor: la pila y la escalera de ejes ─────────────────────────────────
function asideTensor(S: Frame, L: Lay, a: number) {
  const { d, pal: p } = S, A = L.A, u = S.u;
  const off = 14 * u, lblW = 52 * u;
  const cs = clamp(Math.min(A.h * (S.portrait ? 0.5 : 0.5), S.portrait ? A.w * 0.5 - lblW - 2 * off : A.w - lblW - 2 * off - 28 * u - Math.min(210 * u, A.w * 0.42)), 56 * u, 250 * u);
  const x0 = A.x + lblW + 2 * off, y0 = A.y + (S.portrait ? 26 * u : Math.max(60 * u, (A.h - cs) * 0.35)) + 2 * off;
  d.withAlpha(a, () => {
    for (let k = 2; k >= 0; k--) {
      const f = rv(S, 'tensor', 0.02), x = x0 - k * off * f, y = y0 - k * off * f;
      chanGrid(S, x, y, cs, k, 1, false);
    }
    const f = rv(S, 'tensor', 0.06);
    d.withAlpha(f, () => {
      d.text(S.l('ancho 8', 'width 8'), x0 + cs / 2, y0 + cs + 6 * u, { size: T(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top' });
      d.text(S.l('alto 8', 'height 8'), x0 - 2 * off - 6 * u, y0 + cs / 2, { size: T(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
      d.text(S.l('canales 3', 'channels 3'), x0 - 2 * off, y0 - 2 * off - 6 * u, { size: T(S, 13), weight: 700, color: p.ink2, align: 'left', base: 'bottom' });
    });
    // escalera: ejes
    const lx = Math.max(x0 + cs + 28 * u, A.x + A.w * 0.5), ly = A.y + (S.portrait ? 12 * u : Math.max(50 * u, (A.h - 4 * 56 * u) * 0.35)), ls = (S.portrait ? 38 : 56) * u, lw = Math.max(70 * u, A.x + A.w - lx - 2 * u);
    const items: [string, string, 'ink' | 'dat' | 'w' | 'lat'][] = [
      [S.l('número', 'number'), S.l('0 ejes', '0 axes'), 'ink'], [S.l('vector', 'vector'), S.l('1 eje', '1 axis'), 'dat'],
      [S.l('matriz', 'matrix'), S.l('2 ejes', '2 axes'), 'w'], [S.l('tensor', 'tensor'), S.l('3 o más', '3 or more'), 'lat'],
    ];
    items.forEach(([n, ax, t], k) => {
      const s = rv(S, 'tensor', 0.5 + k * 0.07), y = ly + k * ls, tc = tone(S, t);
      d.withAlpha(s, () => {
        d.rect(lx, y, lw, ls - 8 * u, { fill: t === 'ink' ? p.surface2 : tc.soft, stroke: t === 'ink' ? p.lineStrong : tc.c, lw: k === 3 ? 2.5 : 1.5 });
        d.text(n, lx + 10 * u, y + (ls - 8 * u) / 2, { size: T(S, 15), weight: 800, color: t === 'ink' ? p.ink : tc.ink, base: 'middle' });
        d.text(ax, lx + lw - 8 * u, y + (ls - 8 * u) / 2, { size: T(S, 13), weight: 600, color: p.ink2, align: 'right', base: 'middle' });
      });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Acto 2: sonido
// ═════════════════════════════════════════════════════════════════════════
function drawSound(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const R = regions(S, S.portrait ? 0.62 : 0.7);
  const plot = new Plot(S, R.main, { xr: [0, SND.T], yr: [-1.3, 1.3], pad: { l: 14, b: 40, t: 22, r: 12 } });
  const axA = rv(S, 'sound-intro', 0, 0.1), rowY = plot.r.y + plot.r.h + 22 * u;   // fila bajo el eje: rótulos a la izquierda, «tiempo» a la derecha
  plot.axes(axA);
  d.withAlpha(axA, () => {
    [0, 2, 4, 6, 8, 10].forEach((v) => { d.line(plot.X(v), plot.r.y + plot.r.h, plot.X(v), plot.r.y + plot.r.h + 4 * u, p.lineStrong, 1.5); d.text(String(v), plot.X(v), plot.r.y + plot.r.h + 7 * u, { size: T(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    d.text(S.l('tiempo (ms)', 'time (ms)'), plot.r.x + plot.r.w, rowY, { size: T(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.text(S.l('señal', 'signal'), plot.r.x, plot.r.y - 6 * u, { size: T(S, 13), weight: 700, color: p.ink2, base: 'bottom' });
    tagText(S, S.l('señal de juguete · ilustrativa', 'toy signal · illustrative'), plot.r.x + plot.r.w, plot.r.y - 12 * u, 'mute', 1, 'right');
  });
  const rate = clamp(Number(S.p.rate ?? 2000), 200, 4000);
  const sp = sample(rate);
  // la onda continua
  const wv = fr(S, 'sound-intro', 0.05, 0.4, 'io');
  const faint = S.on('samples') && !S.on('sound-demo') ? 0.4 : 1;
  d.withAlpha(faint, () => plot.curve(wave, 'ink', 3, { to: SND.T * wv, n: 260 }));
  // las muestras: palitos y puntos (n = muestras por segundo / 100 en estos 10 ms)
  const k = S.on('samples') ? fr(S, 'samples', 0.1, 0.5, 'lin') : 0;
  if (k > 0) {
    const nShow = Math.floor(k * sp.n + 0.0001), nUse = S.on('sound-demo') ? sp.n : Math.max(1, nShow);
    const dt = tone(S, 'w');
    const pts: [number, number][] = [];
    for (let i = 0; i < nUse; i++) {
      const x = plot.X(sp.t[i]), y = plot.Y(sp.v[i]);
      d.line(x, plot.Y(0), x, y, alpha(dt.c, 0.6), 1.5);
      pts.push([x, y]);
    }
    // lo que reconstruiría un conversor ideal con esas muestras (la señal se repite cada 10 ms)
    if (S.on('sound-demo')) {
      const at = (x: number) => { const f = clamp((x / SND.T) * REC_N, 0, REC_N), i0 = Math.min(REC_N - 1, Math.floor(f)); return clamp(lerp(sp.rec[i0], sp.rec[i0 + 1], f - i0), -1.27, 1.27); };
      plot.curve(at, 'err', 2.4, { dash: [6, 4], n: REC_N });
    }
    pts.forEach(([x, y]) => d.circle(x, y, Math.max(2.5, Math.min(4.5, 56 / sp.n + 2)) * u, { fill: dt.c, stroke: p.stage, lw: 1 }));
    // etiquetas de los primeros valores
    const maxLbl = Math.floor(plot.r.w / (30 * u));
    if (sp.n <= maxLbl) for (let i = 0; i < nUse; i++) d.text(String(Math.round(sp.v[i] * 100)), plot.X(sp.t[i]), plot.Y(sp.v[i]) + (sp.v[i] >= 0 ? -9 : 9) * u, { size: T(S, 12), font: 'mono', weight: 700, color: dt.ink, align: 'center', base: sp.v[i] >= 0 ? 'bottom' : 'top', halo: p.stage });
  }
  // rótulos de cada momento, en la fila bajo el eje (a la izquierda; no tapan la onda)
  if (S.between('sound-intro', 'samples')) d.withAlpha(rv(S, 'sound-intro', 0.15), () => tagText(S, S.l('onda de presión', 'pressure wave'), plot.r.x, rowY + 7 * u, 'mute', 1, 'left'));
  if (S.between('samples', 'sound-demo')) d.withAlpha(rv(S, 'samples', 0.6), () => tagText(S, S.l('cada punto = una muestra', 'each dot = one sample'), plot.r.x, rowY + 7 * u, 'w', 1, 'left'));
  if (S.on('sound-demo')) d.withAlpha(rv(S, 'sound-demo', 0.2), () => {
    const fz = T(S, 13), lx = plot.r.x, ly = rowY + 7 * u, sw = 22 * u;
    d.line(lx, ly, lx + sw, ly, tone(S, 'ink').c, 3);
    d.text(S.l('original', 'original'), lx + sw + 6 * u, ly, { size: fz, weight: 700, color: p.ink2, base: 'middle' });
    const x2 = lx + sw + 6 * u + d.measure(S.l('original', 'original'), { size: fz, weight: 700 }) + 16 * u;
    d.line(x2, ly, x2 + sw, ly, tone(S, 'err').c, 2.4, [6, 4]);
    d.text(S.l('reconstruida', 'rebuilt'), x2 + sw + 6 * u, ly, { size: fz, weight: 700, color: p.ink2, base: 'middle' });
  });
  // el micrófono (solo mientras se explica la señal)
  const micA = win(S, 'sound-intro', 'samples', 0.6, 0.4) * rv(S, 'sound-intro', 0.62);
  if (micA > 0) {
    const mc = Math.max(4, Math.round(5.5 * u)), mx = R.aside.x + (S.portrait ? R.aside.w * 0.5 - 5 * mc : 14 * u), my = R.aside.y + (S.portrait ? 6 * u : 40 * u);
    sprite(S, MIC, mx, my, mc, { a: micA });
    d.withAlpha(micA, () => d.text(S.l('micrófono', 'microphone'), mx + 5 * mc, my + 13 * mc + 8 * u, { size: T(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'top' }));
  }
  drawSoundAside(S, R, sp, rate);
}

function drawSoundAside(S: Frame, R: { main: Rect; aside: Rect; all: Rect }, sp: ReturnType<typeof sample>, rate: number) {
  const { d, pal: p } = S, A = R.aside, u = S.u;
  const aSamp = win(S, 'samples', 'sound-real', 0.6, 0.5);
  if (aSamp > 0) d.withAlpha(aSamp, () => {
    const lines: [string, string, 'w' | 'err' | 'dat'][] = [
      [S.l('muestras por s', 'samples per s'), big(S, rate), 'w'],
      [S.l('muestras en 10 ms', 'samples in 10 ms'), String(sp.n), 'dat'],
    ];
    let y = A.y + (S.portrait ? 12 : 16) * u;
    const w = A.w - 4 * u;
    lines.forEach(([l, v, t], k) => stat(S, A.x, y + k * (S.portrait ? 22 : 28) * u, w, l, v, t));
    y += S.portrait ? 50 * u : 66 * u;
    // la lista de muestras (aparece cuando la narración dice «una lista»)
    d.withAlpha(S.on('samples-list') ? rv(S, 'samples-list', 0.25) : 0, () => {
      const nums = sp.v.slice(0, 9).map((v) => Math.round(v * 100)).join(', ');
      d.text(S.l('la lista que se guarda', 'the list that gets stored'), A.x, y, { size: T(S, 13), weight: 700, color: p.ink2, base: 'top' });
      d.text(`[ ${nums}${sp.n > 9 ? ', …' : ''} ]`, A.x, y + 20 * u, { size: T(S, 13), font: 'mono', weight: 600, color: p.ink, base: 'top', w: A.w - 4 * u });
    });
    y += (S.portrait ? 40 : 78) * u;
    // veredicto: ¿coincide la onda reconstruida con la original?
    if (S.on('sound-demo') && !S.on('sound-real')) {
      const lost = sp.err > 0.05, t = tone(S, lost ? 'err' : 'dat');
      d.text(lost ? S.l('Ya no coincide: se perdió información.', 'No longer matches: information was lost.') : S.l('Coincide con la original.', 'It matches the original.'), A.x, y, { size: T(S, S.portrait ? 14 : 15), weight: 800, color: t.ink, base: 'top', w: A.w - 4 * u });
    }
  });
  // el audio real: Whisper
  const aRef = win(S, 'sound-real', 'text-codes', 0.7, 0.5);
  if (aRef > 0) d.withAlpha(aRef, () => {
    const y = A.y + 8 * u, cx = A.x;
    d.text(S.l('un audio de voz para un modelo', 'a speech clip for a model'), cx, y, { size: T(S, 13), weight: 700, color: p.ink2, base: 'top', w: A.w - 4 * u });
    const y1 = y + (S.portrait ? 22 : 40) * u;
    d.withAlpha(rv(S, 'sound-real', 0.46), () => { d.text(big(S, 16000), cx, y1, { size: S.portrait ? 24 : 32, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'top' });
    d.text(S.l('muestras por segundo', 'samples per second'), cx, y1 + (S.portrait ? 28 : 40) * u, { size: T(S, 13), weight: 600, color: p.ink2, base: 'top' }); });
    const y2 = y1 + (S.portrait ? 54 : 84) * u;
    d.withAlpha(rv(S, 'sound-real', 0.78), () => { d.text(big(S, 960000), cx, y2, { size: S.portrait ? 24 : 32, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    d.text(S.l('números en un minuto', 'numbers in one minute'), cx, y2 + (S.portrait ? 28 : 40) * u, { size: T(S, 13), weight: 600, color: p.ink2, base: 'top' }); });
    if (!S.portrait) d.withAlpha(rv(S, 'sound-real', 0.22), () => tagText(S, S.l('Whisper (OpenAI, 2022)', 'Whisper (OpenAI, 2022)'), cx, y1 + 70 * u, 'mute', 1, 'left'));
    else d.withAlpha(rv(S, 'sound-real', 0.22), () => tagText(S, 'Whisper (OpenAI, 2022)', A.x + A.w, y1 + 8 * u, 'mute', 1, 'right'));
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Acto 3: texto
// ═════════════════════════════════════════════════════════════════════════
function letterRow(S: Frame, x: number, y: number, word: string, o: { cw: number; h: number; codes?: boolean; codesA?: number; eq?: number[]; a?: number; size?: number; codeSize?: number; tone?: 'lat' | 'sig' | 'err' | 'dat' }) {
  const { d, pal: p } = S, u = S.u, t = tone(S, o.tone ?? 'lat'), codes = codesOf(word);
  [...word].forEach((ch, i) => {
    const cx = x + i * o.cw;
    d.rect(cx, y, o.cw - 4 * u, o.h, { fill: t.soft, stroke: t.c, lw: 1.5, r: 3, a: o.a });
    d.text(ch, cx + (o.cw - 4 * u) / 2, y + o.h / 2, { size: o.size ?? 22, weight: 800, color: t.ink, align: 'center', base: 'middle', a: o.a });
    if (o.codes !== false && (o.codesA ?? 1) > 0.01) d.withAlpha(o.codesA ?? 1, () => {
      const same = o.eq?.[i] === codes[i];
      const cz = o.codeSize ?? T(S, 14), ch = cz * 1.55;
      if (same) d.rect(cx, y + o.h + 3 * u, o.cw - 4 * u, ch * u, { fill: tone(S, 'err').soft, stroke: tone(S, 'err').c, lw: 1.2, r: 2, a: o.a });
      d.text(String(codes[i]), cx + (o.cw - 4 * u) / 2, y + o.h + 3 * u + (ch * u) / 2, { size: cz, weight: 800, font: 'mono', color: same ? tone(S, 'err').ink : p.ink, align: 'center', base: 'middle', a: o.a });
    });
  });
}

function drawText(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const sc = clamp(Math.min(all.w / 900, all.h / 520), 0.8, 1.5);        // escala del contenido según el espacio
  // 1 · códigos de la palabra escrita
  const aCodes = win(S, 'text-codes', 'text-limit', 0.7, 0.5);
  if (aCodes > 0) d.withAlpha(aCodes, () => {
    const raw = typeof S.p.word === 'string' && S.p.word.length > 0 ? S.p.word : 'Neu', word = [...raw].slice(0, 8).join('');
    const n = [...word].length, cw = clamp((all.w * 0.78) / Math.max(n, 3), 40 * u, 120 * u), h = clamp(cw * 0.95, 48 * u, 104 * u), total = cw * n;
    const codeSz = clamp(h * 0.28, 16, 28), blockH = h + codeSz * 1.6 + 120 * u;
    const x0 = all.x + (all.w - total) / 2 + 2 * u, y0 = all.y + Math.max(8 * u, (all.h - blockH) * 0.4);
    if (!S.portrait) d.text(S.l('letras', 'letters'), all.x, y0 + h / 2, { size: T(S, 14), weight: 700, color: p.ink2, base: 'middle' });
    letterRow(S, x0, y0, word, { cw, h, size: clamp(h * 0.5, 22, 46), codeSize: codeSz, codesA: rv(S, 'text-codes', 0.3) });
    if (!S.portrait) d.withAlpha(rv(S, 'text-codes', 0.3), () => d.text(S.l('códigos', 'codes'), all.x, y0 + h + 3 * u + codeSz * 0.8 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'middle' }));
    const codes = codesOf(word), ty = y0 + h + codeSz * 1.6 * u + 34 * u;
    d.withAlpha(rv(S, 'text-codes', 0.55), () => {
      d.text(S.l('la palabra, como lista de números', 'the word, as a list of numbers'), all.x + all.w / 2, ty, { size: T(S, 15), weight: 700, color: p.ink2, align: 'center', base: 'top' });
      d.text(`[ ${codes.join(', ')} ]`, all.x + all.w / 2, ty + 30 * u, { size: Math.min(40, 22 + all.w / 36), weight: 800, font: 'mono', color: tone(S, 'lat').ink, align: 'center', base: 'top', w: all.w });
    });
    d.withAlpha(rv(S, 'text-codes', 0.35), () => tagText(S, S.l('código Unicode de cada letra', 'Unicode code of each letter'), all.x + all.w / 2, ty + 100 * u, 'mute', 1, 'center'));
  });
  // 2 · un código es una etiqueta
  const aLim = win(S, 'text-limit', 'text-vectors', 0.7, 0.5);
  if (aLim > 0) d.withAlpha(aLim, () => {
    const words = [S.l('gato', 'cat'), S.l('dato', 'car'), S.l('felino', 'feline')];
    const base = codesOf(words[0]);
    const cw = clamp((S.portrait ? all.w : Math.min(all.w * 0.5, 560 * sc)) / 6, 34 * u, 88 * u), h = clamp(cw * 0.8, 34 * u, 66 * u), codeSz = clamp(h * 0.34, 14, 22);
    const codeH = codeSz * 1.7 * u, noteH = S.portrait ? 50 * u : 0, gap = (S.portrait ? 14 : 0) * u;
    const rowTop = (k: number) => (S.portrait ? k * (h + codeH + gap) + (k >= 1 ? noteH * (k === 1 ? 1 : 2) : 0) : k * Math.min(150 * sc, (all.h - 20 * u) / 3));
    const totalH = S.portrait ? rowTop(2) + h + codeH + noteH : 3 * Math.min(150 * sc, (all.h - 20 * u) / 3);
    const y0 = all.y + Math.max(6 * u, (all.h - totalH) / 2);
    const x0 = all.x + (S.portrait ? 2 * u : 10 * u);
    words.forEach((w, k) => {
      const s = rv(S, 'text-limit', [0.02, 0.29, 0.62][k]), y = y0 + rowTop(k);
      d.withAlpha(s, () => letterRow(S, x0, y, w, { cw, h, size: clamp(h * 0.5, 18, 32), codeSize: codeSz, eq: k === 1 ? base : undefined, tone: k === 0 ? 'lat' : k === 1 ? 'err' : 'dat' }));
    });
    const nx = S.portrait ? all.x + 2 * u : x0 + 6 * cw + 36 * u, nw = S.portrait ? all.w : all.x + all.w - nx;
    const noteY = (k: number) => y0 + rowTop(k) + (S.portrait ? h + codeH + 4 * u : h * 0.15);
    const fz = S.portrait ? 14 : 17;
    d.withAlpha(rv(S, 'text-limit', 0.45), () => {
      tagText(S, S.l('casi mismos números', 'almost the same numbers'), nx, noteY(1) + 10 * u, 'err', 1, 'left');
      d.text(S.l('significado sin relación', 'unrelated meaning'), nx, noteY(1) + 28 * u, { size: T(S, fz), weight: 800, color: tone(S, 'err').ink, base: 'top', w: nw });
    });
    d.withAlpha(rv(S, 'text-limit', 0.85), () => {
      tagText(S, S.l('números sin relación', 'unrelated numbers'), nx, noteY(2) + 10 * u, 'dat', 1, 'left');
      d.text(S.l('significado cercano', 'close meaning'), nx, noteY(2) + 28 * u, { size: T(S, fz), weight: 800, color: tone(S, 'dat').ink, base: 'top', w: nw });
    });
  });
  // 3 · vectores con rasgos inventados y 4 · cercanía
  const aVec = win(S, 'text-vectors', 'mnist', 0.7, 0.5);
  if (aVec > 0) d.withAlpha(aVec, () => drawFeatureTable(S, all, sc));
}

function drawFeatureTable(S: Frame, all: Rect, sc: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'lat');
  const feats = FEATURES[S.lang];
  const labW = 70 * u, cwv = clamp((Math.min(all.w * (S.portrait ? 1 : 0.5), 520 * sc) - labW) / 4, 44 * u, 92 * u), rh = clamp((S.portrait ? 30 : 44) * sc, 28 * u, 52 * u);
  const headH = 76 * u, tableH = headH + 20 * u + WORDS.length * rh, vecH = S.portrait ? 40 * u : 0;
  const near = S.on('text-near');
  const blockH = tableH + vecH + (S.portrait && near ? 8 * 32 * u : 0);
  const x0 = all.x + 2 * u, y0 = all.y + (S.portrait ? 2 * u : Math.max(0, (all.h - tableH) * 0.4));
  void blockH;
  d.text(S.l('palabra → vector de cuatro rasgos', 'word → vector of four features'), x0, y0 + 4 * u, { size: T(S, 15), weight: 700, color: p.ink2, base: 'top' });
  tagText(S, S.l('ilustrativo: rasgos inventados', 'illustrative: made-up features'), x0, y0 + 40 * u, 'mute', 1, 'left');
  const hy = y0 + headH - 6 * u;
  feats.forEach((f, k) => d.text(f, x0 + labW + k * cwv + cwv / 2, hy, { size: T(S, 14), weight: 700, color: p.ink2, align: 'center', base: 'middle' }));
  WORDS.forEach((w, r) => {
    const s = rv(S, 'text-vectors', 0.05 + r * 0.045), y = hy + 16 * u + r * rh;
    d.withAlpha(s, () => {
      const hot = r === 0;
      if (hot && near) d.rect(x0 - 4 * u, y - 2 * u, labW + 4 * cwv + 8 * u, rh, { stroke: tone(S, 'sig').c, lw: 2.5, r: 3 });
      d.text(S.l(w.es, w.en), x0 + labW - 8 * u, y + rh / 2 - 2 * u, { size: T(S, 16), weight: hot ? 800 : 700, color: p.ink, align: 'right', base: 'middle' });
      w.f.forEach((v, k) => {
        const x = x0 + labW + k * cwv;
        d.rect(x + 1, y, cwv - 2, rh - 4 * u, { fill: alpha(t.c, 0.08 + 0.72 * v), stroke: alpha(t.c, 0.5), lw: 1 });
        d.text(S.n(v, 1), x + cwv / 2, y + (rh - 4 * u) / 2, { size: T(S, 15), weight: 700, font: 'mono', color: v > 0.6 ? p.stage : p.ink, align: 'center', base: 'middle' });
      });
    });
  });
  const tableBottom = hy + 16 * u + WORDS.length * rh;
  const gatoVec = `${S.l('gato', 'cat')} = [ ${WORDS[0].f.map((v) => S.n(v, 1)).join(', ')} ]`;
  // vector de «gato»: a la derecha en horizontal; debajo en teléfono (y desaparece cuando entran las distancias)
  const vecA = rv(S, 'text-vectors', 0.3) * (S.portrait ? 1 - S.at('text-near', 0, 0.5) : 1 - S.at('text-near', 0, 0.5));
  d.withAlpha(vecA, () => {
    if (S.portrait) d.text(gatoVec, x0, tableBottom + 14 * u, { size: Math.min(22, 13 + all.w / 40), weight: 800, font: 'mono', color: t.ink, base: 'top', w: all.w });
    else {
      const rx = x0 + labW + 4 * cwv + 40 * u, rw = all.x + all.w - rx;
      d.text(S.l('un vector de cuatro números por palabra', 'a vector of four numbers per word'), rx, y0 + headH + 30 * u, { size: T(S, 15), weight: 700, color: p.ink2, base: 'top', w: rw });
      d.text(gatoVec, rx, y0 + headH + 70 * u, { size: clamp(rw / 20, 18, 32), weight: 800, font: 'mono', color: t.ink, base: 'top', w: rw });
    }
  });
  // cercanía
  const aNear = win(S, 'text-near', 'mnist', 0.7, 0.5);
  if (aNear > 0) d.withAlpha(aNear, () => {
    const rest = WORDS.slice(1).map((w) => ({ w, dd: dist(WORDS[0].f, w.f) })).sort((a, b) => a.dd - b.dd);
    const rowBar = (S.portrait ? 30 : 44) * sc * u / u;
    const bx = S.portrait ? all.x : x0 + labW + 4 * cwv + 40 * u, by = S.portrait ? tableBottom + 34 * u : y0 + headH + 26 * u;
    const bw = S.portrait ? all.w : all.x + all.w - bx;
    d.text(S.l('distancia a «gato»', 'distance to “cat”'), bx, by - 4 * u, { size: T(S, 15), weight: 700, color: p.ink2, base: 'bottom' });
    hbars(S, { x: bx, y: by + 4 * u, w: bw, h: rest.length * rowBar }, rest.map((r, k) => ({ label: S.l(r.w.es, r.w.en), value: r.dd, tone: (k === 0 ? 'dat' : 'lat') as 'dat' | 'lat', hot: k === 0 })), { max: 2, fmt: (v) => S.n(v, 2), show: fr(S, 'text-near', 0.03, 0.17, 'lin') * rest.length + 1, rowH: rowBar, labelW: 84 * u });
    d.withAlpha(rv(S, 'text-near', 0.2), () => tagText(S, S.l('menos distancia = más parecido', 'less distance = more similar'), bx, by + 4 * u + rest.length * rowBar + 22 * u, 'dat', 1, 'left'));
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Acto 4: MNIST y una foto
// ═════════════════════════════════════════════════════════════════════════
function drawMnist(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const cell = S.portrait ? Math.max(5, Math.min(Math.floor(all.w / 28), Math.floor((all.h * 0.44) / 28))) : Math.max(5, Math.min(Math.floor((all.h - 44 * u) / 28), Math.floor((all.w * 0.46) / 28)));
  const gs = cell * 28, gx = Math.round(S.portrait ? all.x + (all.w - gs) / 2 : all.x + 8 * u), gy = Math.round(S.portrait ? all.y + 8 * u : all.y + Math.max(4 * u, (all.h - gs - 36 * u) / 2));
  d.withAlpha(rv(S, 'mnist', 0, 0.1), () => {
    for (let i = 0; i < 784; i++) d.rect(gx + (i % 28) * cell, gy + Math.floor(i / 28) * cell, cell, cell, { fill: grayCss(MNIST_LIKE[i]) });
    d.rect(gx - 0.5, gy - 0.5, gs + 1, gs + 1, { stroke: p.lineStrong, lw: 1.5 });
    tagText(S, S.l('ilustración con aspecto de MNIST', 'illustration in the style of MNIST'), gx, gy + gs + 18 * u, 'mute', 1, 'left');
  });
  const tx = S.portrait ? all.x + 4 * u : gx + gs + 40 * u, tw = S.portrait ? all.w - 8 * u : all.x + all.w - tx;
  const ty = S.portrait ? gy + gs + 34 * u : gy + 6 * u;
  d.withAlpha(rv(S, 'mnist', 0.6), () => {
    d.text('28 × 28 = 784', tx, ty, { size: S.portrait ? 26 : 42, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    d.text(S.l('números por imagen', 'numbers per image'), tx, ty + (S.portrait ? 34 : 56) * u, { size: T(S, S.portrait ? 15 : 18), weight: 700, color: p.ink2, base: 'top' });
  });
  const y2 = ty + (S.portrait ? 60 : 120) * u, rowGap = (S.portrait ? 50 : 70) * u;
  const rows: [number, string, 'dat' | 'sig', number][] = [[60000, S.l('para entrenar', 'for training'), 'dat', 1.0], [10000, S.l('para probar', 'for testing'), 'sig', 1.0 / 6]];
  rows.forEach(([n, lbl, t, f], k) => {
    const s = rv(S, 'mnist-sets', 0.1 + k * 0.33);
    d.withAlpha(s, () => {
      const y = y2 + k * rowGap, tc = tone(S, t), bw = Math.min(tw - 4 * u, 420 * u) * f;
      d.text(big(S, n), tx, y, { size: S.portrait ? 19 : 28, weight: 800, font: 'mono', color: tc.ink, base: 'top' });
      d.text(lbl, tx + (S.portrait ? 96 : 150) * u, y + (S.portrait ? 4 : 8) * u, { size: T(S, S.portrait ? 15 : 18), weight: 700, color: p.ink2, base: 'top' });
      d.rect(tx, y + (S.portrait ? 26 : 38) * u, Math.max(8 * u, bw), (S.portrait ? 12 : 16) * u, { fill: tc.c });
    });
  });
  if (S.on('mnist-sets')) d.withAlpha(rv(S, 'mnist-sets', 0.7), () => {
    const y = y2 + 2 * rowGap + (S.portrait ? 2 : 0) * u;
    d.text(S.l('las de prueba no se usan para entrenar: el modelo no las vio', 'the test ones are not used for training: the model did not see them'), tx, y, { size: T(S, S.portrait ? 13 : 15), weight: 600, color: p.ink2, base: 'top', w: tw - (S.portrait ? 0 : 84 * u) });
  });
  if (!S.portrait) neu(S, all.x + all.w - 78 * u, all.y + all.h - 70 * u, { scale: Math.max(3, Math.round(3 * u)), mood: 'happy', a: rv(S, 'mnist-sets', 0.75) });
}

function drawPhoto(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const leftW = S.portrait ? all.w : all.w * 0.44;
  const pwid = S.portrait ? Math.min(all.w * 0.4, 120 * u) : Math.min(leftW - 100 * u, 340 * u), ph = { w: pwid, h: pwid * 0.75 };
  const off = (S.portrait ? 10 : 16) * u;
  const px = (S.portrait ? all.x + (all.w - ph.w) / 2 + off : all.x + 40 * u + 2 * off), py = all.y + (S.portrait ? 34 * u : Math.max(40 * u, (all.h - ph.h) / 2)) + 2 * off - (S.portrait ? 0 : 10 * u);
  d.withAlpha(rv(S, 'photo', 0, 0.1), () => {
    for (let k = 2; k >= 0; k--) {
      const f = rv(S, 'photo', 0.38), x = px - k * off * f, y = py - k * off * f;
      d.rect(x, y, ph.w, ph.h, { fill: colorOf(CH_COLOR[k][0] * 0.5, CH_COLOR[k][1] * 0.5, CH_COLOR[k][2] * 0.5), stroke: p.lineStrong, lw: 1.5 });
    }
    d.text(S.l('por ejemplo, 4000 × 3000 píxeles', 'for example, 4000 × 3000 pixels'), px + ph.w / 2 - (S.portrait ? off : 0), py + ph.h + 10 * u, { size: T(S, S.portrait ? 13 : 14), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    d.text(S.l('12 megapíxeles · 3 canales', '12 megapixels · 3 channels'), px + ph.w / 2 - off, py - 2 * off - 10 * u, { size: T(S, 14), weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
  });
  // escalera logarítmica: la carita, MNIST, la foto y la misma foto reducida (AlexNet)
  const R = S.portrait ? { x: all.x, y: all.y + 194 * u, w: all.w, h: all.h - 194 * u } : { x: all.x + all.w * 0.5, y: all.y, w: all.w * 0.5, h: all.h };
  const items: [number, string, 'dat' | 'w' | 'err' | 'lat', string, number][] = [
    [64, S.l('carita 8 × 8', 'little face 8 × 8'), 'dat', 'photo', 0.13], [784, S.l('MNIST 28 × 28', 'MNIST 28 × 28'), 'w', 'photo', 0.2], [36000000, S.l('foto de 12 MP, en color', '12 MP color photo'), 'err', 'photo', 0.7],
    [196608, S.l('reducida a 256 × 256 (AlexNet)', 'shrunk to 256 × 256 (AlexNet)'), 'lat', 'photo-shrink', 0.4],
  ];
  const rowH = S.portrait ? 46 * u : clamp((R.h - 80 * u) / items.length, 40 * u, 84 * u), blockH = items.length * rowH + 40 * u, top = R.y + (S.portrait ? 28 * u : Math.max(40 * u, (R.h - blockH) / 2));
  const numW = (S.portrait ? 128 : 186) * u, bwMax = Math.max(60 * u, R.w - numW - 8 * u);
  const fOf = (n: number) => (Math.log10(n) - 0.5) / (7.7 - 0.5);
  d.withAlpha(rv(S, 'photo', 0.15), () => {
    d.text(S.l('números por ejemplo (escala logarítmica)', 'numbers per example (logarithmic scale)'), R.x, top - 18 * u, { size: T(S, 14), weight: 700, color: p.ink2, base: 'bottom', w: R.w });
    (bwMax * (3 / 7.2) < 78 * u ? [6] : S.portrait || bwMax * (2 / 7.2) < 84 * u ? [3, 6] : [2, 4, 6]).forEach((e) => {
      const x = R.x + bwMax * fOf(10 ** e);
      d.line(x, top - 6 * u, x, top + items.length * rowH - 6 * u, p.line, 1, [3, 4]);
      d.text(big(S, 10 ** e), x, top + items.length * rowH - 2 * u, { size: T(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' });
    });
  });
  items.forEach(([n, lbl, t, seg, delay], k) => {
    const s = rv(S, seg, delay, 0.08), y = top + k * rowH, tc = tone(S, t), len = Math.max(6 * u, bwMax * fOf(n) * s);
    d.withAlpha(s, () => {
      d.text(lbl, R.x, y, { size: T(S, S.portrait ? 13 : 15), weight: 700, color: p.ink2, base: 'top', w: R.w });
      d.rect(R.x, y + (S.portrait ? 20 : 26) * u, len, (S.portrait ? 14 : 20) * u, { fill: tc.c });
      d.text(big(S, n), R.x + len + 8 * u, y + (S.portrait ? 27 : 36) * u, { size: S.portrait ? 17 : 22, weight: 800, font: 'mono', color: tc.ink, base: 'middle' });
    });
  });
  // cuántas veces menos números: 36 000 000 / 196 608 ≈ 183
  const sh = rv(S, 'photo-shrink', 0.8);
  if (sh > 0) tagText(S, S.l('183 veces menos', '183× fewer'), R.x + R.w, top + 3 * rowH + (S.portrait ? 27 : 36) * u, 'lat', sh, 'right');
}

// ═════════════════════════════════════════════════════════════════════════
// Cierre: resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawRecap(S: Frame) {
  const { p } = { p: S.pal }, u = S.u, all = inset(S.full(), 18 * u);
  const labels = [S.l('imagen → matriz', 'image → matrix'), S.l('color → tensor', 'color → tensor'), S.l('sonido → muestras', 'sound → samples'), S.l('texto → vectores', 'text → vectors')];
  const tones = ['dat', 'sig', 'w', 'lat'] as const;
  const bw = S.portrait ? Math.min(150 * u, all.w * 0.46) : Math.min(260 * u, all.w * 0.3), bh = (S.portrait ? 52 : 62) * u;
  const src: Rect[] = [0, 1, 2, 3].map((i) => (S.portrait
    ? { x: all.x, y: all.y + 12 * u + i * (bh + 34 * u), w: bw, h: bh }
    : { x: all.x, y: all.y + 10 * u + i * ((all.h - 20 * u - bh) / 3), w: bw, h: bh }));
  const mid: Rect = S.portrait ? { x: all.x + all.w - bw * 0.95, y: all.y + 12 * u + 1.5 * (bh + 34 * u) + bh / 2 - 31 * u, w: bw * 0.95, h: 62 * u } : { x: all.x + all.w * 0.5 - bw * 0.5, y: all.y + all.h / 2 - 46 * u, w: bw, h: 92 * u };
  const out: Rect = S.portrait ? { x: mid.x + 6 * u, y: mid.y + mid.h + 44 * u, w: mid.w - 12 * u, h: 52 * u } : { x: all.x + all.w - bw * 0.85, y: all.y + all.h / 2 - 36 * u, w: bw * 0.85, h: 72 * u };
  src.forEach((r, i) => { const s = rv(S, 'recap', 0.02 + i * 0.035); if (s > 0) box(S, r, labels[i], { tone: tones[i], a: s, size: T(S, S.portrait ? 14 : 17), active: !S.reduced && Math.floor(S.clock / 1.2) % 4 === i ? 1 : 0 }); });
  const sm_ = rv(S, 'recap', 0.43);
  if (sm_ > 0) box(S, mid, S.l('vector o tensor', 'vector or tensor'), { tone: 'dat', a: sm_, size: T(S, S.portrait ? 16 : 20) });
  src.forEach((r, i) => { const a = fr(S, 'recap', 0.43 + i * 0.01, 0.51 + i * 0.01, 'io'); if (a > 0) link(S, r, mid, { tone: tones[i], progress: a, lw: 2 }); });
  const so = rv(S, 'recap', 0.69);
  if (so > 0) { box(S, out, S.l('modelo', 'model'), { tone: 'w', a: so, size: T(S, S.portrait ? 17 : 22) }); link(S, mid, out, { tone: 'ink', progress: fr(S, 'recap', 0.69, 0.75, 'io'), lw: 2.5 }); }
  void p;
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cy - 100 * u, { scale: sc, mood: 'happy', a: rv(S, 'bridge', 0.03) });
  d.withAlpha(rv(S, 'bridge', 0.1), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 40 * u, { size: T(S, 13), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Un modelo y su error', 'A model and its error'), cx, cy + 72 * u, { size: 24, weight: 800, align: 'center', w: S.W - 40 * u });
  });
}

export default scene;
