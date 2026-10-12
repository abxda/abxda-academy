// El mapa del curso: 36 puntos (uno por lección) agrupados en 8 módulos, más el marcador de esta lección (37).
// · Recorrido (map-dots … thread): aparecen los puntos, los módulos y el hilo; cada módulo se enciende mientras la voz lo
//   resume, y al lado (o debajo, en teléfono) se listan sus lecciones. En «thread», dos arcos: 6 → 7 y 12 → 21.
// · Mapa abierto (map-back … end): el punto elegido (control «leccion» o toque) muestra su idea en una frase y un botón
//   para abrir su lección. En «recap» se encienden tres tramos: aprender (1), el camino al chatbot (2–7) y el criterio (8).
// El reparto se adapta al escenario: se prueba una rejilla de módulos de 2 × 4, 4 × 2 o 1 × 8 (y una o dos filas de puntos
// por módulo) y se queda la que deja los puntos más grandes.
// REAL: títulos, módulos y orden del currículo (curriculum.ts); las ideas resumen las ideas clave de cada lección (data.ts).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { LESSONS, MODULES } from '../../curriculum';
import { IDEAS, MOD_SHORT, MOD_SIZES, SHORT, firstOf, moduleOf } from './data';
import { FS, fitText, fr, glyph, panes, para, paraH, pick, smooth, tight, win } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Reparto
// ════════════════════════════════════════════════════════════════════════════════════════════════
export interface MapNode { n: number; m: number; x: number; y: number }
export interface MapCell { m: number; x: number; y: number; w: number; lx: number; ly: number }
export interface MapLay { r: number; nodes: MapNode[]; star: { x: number; y: number }; cells: MapCell[]; lh: number; showNum: boolean; path: [number, number][]; box: Rect }

const OPTS: [number, number, number][] = [[2, 4, 6], [4, 2, 3], [2, 4, 3], [1, 8, 6], [4, 2, 6]];

/** Coloca los 36 puntos (y el 37) dentro de R. `mini`: sin rótulos de módulo ni números (salvo los resaltados). */
export function mapLayout(S: Frame, R: Rect, mini = false): MapLay {
  const u = S.u, lh = mini ? 0 : FS(S, 12.5) * u * 1.45;
  const gx = (mini ? 8 : 14) * u, gy = (mini ? 6 : 8) * u, rMax = (mini ? 8 : 16) * u;
  let best = { cols: 2, rows: 4, k: 6, cw: 0, ch: 0, r: -1, sx: 0, sy: 0, ir: 1 };
  for (const [cols, rows, k] of OPTS) {
    const cw = (R.w - (cols - 1) * gx) / cols, ch = (R.h - (rows - 1) * gy) / rows, ir = Math.ceil(6 / k);
    const sx = cw / k, sy = (ch - lh) / ir, r = Math.min(Math.min(sx, sy) * 0.38, rMax);
    // la primera opción gana los empates: una fila de puntos por módulo se lee mejor
    if (r > best.r + 0.3 * u) best = { cols, rows, k, cw, ch, r, sx, sy, ir };
  }
  const r = Math.max(2, best.r);
  const sx = Math.min(best.sx, r * 3.1), sy = Math.min(best.sy, r * 2.7);
  const need = lh + best.ir * sy + (mini ? 2 : 6) * u;
  // si sobra alto, las filas de módulos se separan un poco (hasta 22 px más): el mapa respira en tableta y escritorio
  const cwU = Math.min(best.cw, best.k * sx), chU = Math.min(best.ch, need + (mini ? 0 : Math.min(22 * u, Math.max(0, best.ch - need) * 0.5)));
  const blockW = best.cols * cwU + (best.cols - 1) * gx, blockH = best.rows * chU + (best.rows - 1) * gy;
  const ox = R.x + (R.w - blockW) / 2, oy = R.y + (R.h - blockH) / 2;
  const nodes: MapNode[] = [], cells: MapCell[] = [], path: [number, number][] = [];
  let star = { x: 0, y: 0 };
  for (let m = 1; m <= 8; m++) {
    const c = (m - 1) % best.cols, rr = Math.floor((m - 1) / best.cols);
    const cx = ox + c * (cwU + gx), cy = oy + rr * (chU + gy);
    cells.push({ m, x: cx, y: cy, w: cwU, lx: cx + sx / 2 - r, ly: cy + lh * 0.45 });
    const n0 = firstOf(m), slots = MOD_SIZES[m - 1] + (m === 8 ? 1 : 0);
    for (let j = 0; j < slots; j++) {
      const x = cx + sx * ((j % best.k) + 0.5), y = cy + lh + sy * (Math.floor(j / best.k) + 0.5);
      if (m === 8 && j === MOD_SIZES[7]) star = { x, y };
      else nodes.push({ n: n0 + j, m, x, y });
      path.push([x, y]);
    }
  }
  return { r, nodes, star, cells, lh, showNum: 2 * r * 0.78 >= 13.5, path, box: { x: ox, y: oy, w: blockW, h: blockH } };
}

/** Reparto del mapa grande con su panel. */
export function mapPanes(S: Frame) { return panes(S, 0.6, 112); }

/** Punto bajo (x, y), o 0. */
export function hitNode(L: MapLay, x: number, y: number, hitR: number): number {
  let best = 0, bd = Infinity;
  for (const nd of L.nodes) { const dd = Math.hypot(nd.x - x, nd.y - y); if (dd < Math.max(L.r * 1.35, hitR) && dd < bd) { bd = dd; best = nd.n; } }
  return best;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Piezas
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Un punto del mapa. hot: relleno pleno (0..1); warm: relleno tenue (ya recorrido); sel: anillo (elegido). */
export function dot(S: Frame, L: MapLay, x: number, y: number, n: number, o: { a?: number; hot?: number; warm?: number; sel?: number; t?: Tone; r?: number; num?: boolean } = {}) {
  const { d, pal: p } = S, a = o.a ?? 1, t = tone(S, o.t ?? 'sig'), hot = o.hot ?? 0, warm = o.warm ?? 0, r = o.r ?? L.r;
  if (a <= 0.003) return;
  d.withAlpha(a, () => {
    d.circle(x, y, r, { fill: p.surface, stroke: hot > 0.4 || warm > 0.4 ? t.c : p.lineStrong, lw: hot > 0.4 ? 2 : 1.4 });
    if (warm > 0.003) d.circle(x, y, r, { fill: alpha(t.c, 0.2 * warm) });
    if (hot > 0.003) d.circle(x, y, r, { fill: alpha(t.c, 0.92 * hot) });
    if ((o.sel ?? 0) > 0.003) d.circle(x, y, r + 4 * S.u, { stroke: t.c, lw: 2.2, a: o.sel });
    if (o.num ?? L.showNum) {
      const sz = Math.max(12.2 / S.u, Math.min(FS(S, 12), (r * 1.25) / S.u));
      d.text(String(n), x, y + 0.5, { size: sz, weight: 700, color: hot > 0.5 ? p.stage : p.ink, align: 'center', base: 'middle' });
    }
  });
}
/** El marcador de esta lección (37): un punto con doble anillo y una banderita. */
export function starDot(S: Frame, L: MapLay, a: number, hot = 0) {
  if (a <= 0.003) return;
  const { d, pal: p } = S, u = S.u, { x, y } = L.star, r = L.r, t = tone(S, 'w');
  d.withAlpha(a, () => {
    d.circle(x, y, r, { fill: alpha(t.c, 0.15 + 0.6 * hot), stroke: t.c, lw: 1.8 });
    d.circle(x, y, r + 3 * u, { stroke: t.c, lw: 1.2, dash: [3, 2] });
    if (L.showNum) d.text('37', x, y + 0.5, { size: Math.max(12.2 / u, Math.min(FS(S, 12), (r * 1.25) / u)), weight: 800, color: hot > 0.5 ? p.stage : t.ink, align: 'center', base: 'middle' });
    glyph(S, 'flag', x + r * 0.9, y - r * 1.25, Math.max(10 * u, r * 0.95), t.c);
  });
}
/** Polilínea dibujada hasta la fracción k de su largo. */
export function partial(S: Frame, pts: [number, number][], k: number, color: string, lw: number, dash?: number[]) {
  if (k <= 0 || pts.length < 2) return;
  const seg: number[] = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; }
  let rem = clamp(k) * tot; const out: [number, number][] = [pts[0]];
  for (let i = 0; i < seg.length && rem > 0; i++) {
    const f = Math.min(1, rem / (seg[i] || 1));
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]);
    rem -= seg[i];
  }
  S.d.polyline(out, color, lw, { dash, join: 'round' });
}
/** Nombre del módulo m que quepa en w (completo, o corto). */
export const modName = (S: Frame, m: number, w: number, size = 12.5, withNum = true) => {
  const full = S.L(MODULES[m - 1].title), short = S.L(MOD_SHORT[m - 1]);
  return pick(S, withNum ? [`${m} · ${full}`, `${m} · ${short}`, `${m}`] : [full, short], w, size, 700);
};
/** Título de la lección n que quepa en w (completo o corto). */
export const lessonName = (S: Frame, n: number, w: number, size = 13, weight = 600) => pick(S, [S.L(LESSONS[n - 1].title), S.L(SHORT[n - 1])], w, size, weight);

/** Fila «● n  texto» (insignia con número y rótulo). Devuelve el alto usado. */
function badgeRow(S: Frame, n: number | string, text: string, x: number, y: number, w: number, o: { size?: number; hot?: number; t?: Tone; a?: number; weight?: number; color?: string; h?: number } = {}) {
  const { d, pal: p } = S, u = S.u, size = FS(S, o.size ?? 13), t = tone(S, o.t ?? 'sig'), hot = o.hot ?? 0;
  let br = Math.max(9.5 * u, size * u * 0.72);
  if (o.h) br = Math.max(7.5, Math.min(br, o.h * 0.44));   // filas apretadas: la insignia se achica para no tocar la siguiente
  const h = o.h ?? Math.max(2 * br, size * u * 1.3) + 4 * u;
  if ((o.a ?? 1) <= 0.003) return h;
  d.withAlpha(o.a ?? 1, () => {
    d.circle(x + br, y + h / 2, br, { fill: hot > 0.4 ? t.c : p.surface, stroke: hot > 0.4 ? t.c : p.lineStrong, lw: 1.4 });
    d.text(String(n), x + br, y + h / 2 + 0.5, { size: Math.max(12.2 / u, Math.min(size, (br * 1.2) / u)), weight: 700, color: hot > 0.4 ? p.stage : p.ink, align: 'center', base: 'middle' });
    if (text) fitText(S, text, x + 2 * br + 7 * u, y + h / 2, w - 2 * br - 7 * u, o.size ?? 13, { weight: o.weight ?? 600, color: o.color ?? (hot > 0.4 ? t.ink : p.ink), base: 'middle' });
  });
  return h;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Recorrido: map-dots … thread
// ════════════════════════════════════════════════════════════════════════════════════════════════
const MODSEG = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

export function drawMapWalk(S: Frame) {
  const { d, pal: p } = S, u = S.u, P = mapPanes(S), L = mapLayout(S, P.main);
  const sig = tone(S, 'sig');
  // el hilo: se dibuja en «map-groups»
  partial(S, L.path, fr(S, 'map-groups', 0.42, 0.95, 'io'), alpha(p.ink, 0.28), 1.6);
  // el hilo en dos ejemplos: 6 → 7 (el XOR pide capas) y 12 → 21 (la memoria corta pide atención)
  if (S.on('thread')) {
    const at = (n: number) => L.nodes[n - 1];
    const arc = (a: number, b: number, k: number, bend: number) => {
      if (k <= 0) return;
      const A = at(a), B = at(b), err = tone(S, 'err');
      // curva que sale del borde de un punto y llega al borde del otro, combada hacia un lado (pasa por detrás de los rótulos)
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const [x1, y1, x2, y2] = [A.x + ux * (L.r + 2 * u), A.y + uy * (L.r + 2 * u), B.x - ux * (L.r + 3 * u), B.y - uy * (L.r + 3 * u)];
      const mx = (x1 + x2) / 2 + uy * bend, my = (y1 + y2) / 2 - ux * bend;
      const n = 24, pts: [number, number][] = [];
      for (let i = 0; i <= n * k; i++) { const t = i / n; pts.push([(1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2]); }
      d.polyline(pts, err.c, 2.2, { join: 'round' });
      if (k > 0.97) { const [ex, ey] = pts[pts.length - 1], [px, py] = pts[pts.length - 3] ?? pts[0]; d.arrow(px, py, ex, ey, err.c, 2.2, 8 * Math.max(0.85, u)); }
    };
    arc(6, 7, fr(S, 'thread', 0.32, 0.45, 'io'), L.r * 1.3);
    arc(12, 21, fr(S, 'thread', 0.66, 0.8, 'io'), -L.r * 1.6);
  }
  // rótulos de los módulos
  L.cells.forEach((c) => {
    const a = fr(S, 'map-groups', 0.06 + 0.035 * (c.m - 1), 0.16 + 0.035 * (c.m - 1));
    const act = S.on(MODSEG[c.m - 1]) ? fr(S, MODSEG[c.m - 1], 0, 0.1) * (c.m < 8 ? 1 - fr(S, MODSEG[c.m], 0, 0.1) : 1 - fr(S, 'thread', 0, 0.1)) : 0;
    if (a <= 0.003) return;
    fitText(S, modName(S, c.m, c.w - 4 * S.u), c.lx, c.ly, c.w - 4 * S.u, 12.5, { weight: act > 0.5 ? 800 : 700, color: act > 0.5 ? sig.ink : p.ink2, base: 'middle', halo: true, a });
  });
  // los puntos
  for (const nd of L.nodes) {
    const i = nd.n - 1, a = fr(S, 'map-dots', 0.04 + 0.5 * (i / 36), 0.1 + 0.5 * (i / 36));
    let hot = 0, warm = 0;
    if (S.between('map-dots', 'map-groups')) hot = nd.n === 1 ? fr(S, 'map-dots', 0.3, 0.4) : nd.n === 36 ? fr(S, 'map-dots', 0.55, 0.65) : 0;
    const m = nd.m, key = MODSEG[m - 1];
    if (S.on(key)) {
      // se encienden uno a uno mientras la voz resume el módulo; al pasar al siguiente quedan tenues (recorridos)
      const j = nd.n - firstOf(m), k = MOD_SIZES[m - 1];
      const on = fr(S, key, 0.06 + (0.7 * j) / k, 0.14 + (0.7 * j) / k);
      const next = m < 8 ? MODSEG[m] : 'thread';
      const off = fr(S, next, 0, 0.12);
      hot = on * (1 - off); warm = on * off;
    }
    if (S.on('thread')) {
      const pair = [6, 7, 12, 21].includes(nd.n);
      const k = pair ? fr(S, 'thread', nd.n <= 7 ? 0.28 : 0.62, nd.n <= 7 ? 0.4 : 0.74) : 0;
      hot = Math.max(hot * (1 - fr(S, 'thread', 0, 0.1)), k); warm = 1 - hot;
    }
    dot(S, L, nd.x, nd.y, nd.n, { a, hot, warm });
  }
  starDot(S, L, fr(S, 'map-dots', 0.8, 0.92), S.between('map-dots', 'map-groups') ? fr(S, 'map-dots', 0.82, 0.92) : 0);
  drawWalkAside(S, P.aside, L);
}

function drawWalkAside(S: Frame, R: Rect, L: MapLay) {
  const { d, pal: p } = S, u = S.u, sig = tone(S, 'sig');
  const sz = tight(S) ? 12.5 : 13.5;
  // 1 · de la primera a la última
  const a0 = win(S, 'map-dots', 'map-groups');
  if (a0 > 0.003) d.withAlpha(a0, () => {
    const rows: [number | string, string, number, Tone?][] = [
      [1, lessonName(S, 1, R.w - 40 * u, sz), fr(S, 'map-dots', 0.3, 0.42)],
      [36, lessonName(S, 36, R.w - 40 * u, sz), fr(S, 'map-dots', 0.55, 0.67)],
      [37, S.l('El mapa completo · aquí', 'The complete map · here'), fr(S, 'map-dots', 0.82, 0.94), 'w'],
    ];
    const rh = FS(S, sz) * u * 1.3 + 14 * u, gap = 6 * u, total = rows.length * rh + gap * 2 + 14 * u;
    let y = R.y + Math.max(0, (R.h - total) / 2);
    rows.forEach(([n, t, a, tn], i) => {
      badgeRow(S, n, t, R.x, y, R.w, { size: sz, hot: 1, t: tn ?? 'sig', a, weight: 700 });
      y += rh + gap;
      if (i === 0) { d.withAlpha(fr(S, 'map-dots', 0.42, 0.55), () => { for (let k = 0; k < 3; k++) d.circle(R.x + 10 * u, y - gap * 0.5 + k * 5 * u - 6 * u, 1.6 * u, { fill: p.mute }); }); y += 14 * u; }
    });
  });
  // 2 · los ocho módulos
  const a1 = win(S, 'map-groups', 'm1');
  if (a1 > 0.003) d.withAlpha(a1, () => {
    const head = S.l('8 módulos', '8 modules'), hs = FS(S, 15) * u * 1.5;
    const avail = R.h - hs, cols = avail / 8 >= FS(S, 12.5) * u * 1.25 + 8 * u ? 1 : 2;
    const perCol = Math.ceil(8 / cols), cw = (R.w - (cols - 1) * 10 * u) / cols, rh = Math.min(avail / perCol, FS(S, sz) * u * 1.3 + 12 * u);
    const total = hs + perCol * rh, y0 = R.y + Math.max(0, (R.h - total) / 2);
    fitText(S, head, R.x, y0, R.w, 15, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'map-groups', 0, 0.1) });
    for (let m = 1; m <= 8; m++) {
      const c = Math.floor((m - 1) / perCol), rr = (m - 1) % perCol, x = R.x + c * (cw + 10 * u), y = y0 + hs + rr * rh;
      const a = fr(S, 'map-groups', 0.06 + 0.035 * (m - 1), 0.16 + 0.035 * (m - 1));
      badgeRow(S, m, modName(S, m, cw - 30 * u, 12.5, false), x, y + (rh - (FS(S, sz) * u * 1.3 + 4 * u)) / 2 - 2 * u, cw, { size: cols === 2 ? 12.5 : sz, a, weight: 700, t: 'ink' });
    }
  });
  // 3 · cada módulo con sus lecciones
  for (let m = 1; m <= 8; m++) {
    const key = MODSEG[m - 1], a = win(S, key, m < 8 ? MODSEG[m] : 'thread');
    if (a <= 0.003) continue;
    d.withAlpha(a, () => {
      const k = MOD_SIZES[m - 1], n0 = firstOf(m);
      const hs1 = FS(S, 12.5) * u * 1.3, hs2 = FS(S, 15.5) * u * 1.35;
      const rh0 = FS(S, sz) * u * 1.3 + 10 * u, rh = Math.min(rh0, (R.h - hs1 - hs2 - 6 * u) / k);
      const small = rh < rh0 * 0.92;
      const total = hs1 + hs2 + 6 * u + k * rh, y0 = R.y + Math.max(0, (R.h - total) / 2);
      fitText(S, S.l(`Módulo ${m}`, `Module ${m}`), R.x, y0, R.w, 12.5, { weight: 700, color: p.mute, base: 'top' });
      fitText(S, S.L(MODULES[m - 1].title), R.x, y0 + hs1, R.w, 15.5, { weight: 800, color: sig.ink, base: 'top' });
      for (let j = 0; j < k; j++) {
        const n = n0 + j, on = fr(S, key, 0.06 + (0.7 * j) / k, 0.14 + (0.7 * j) / k);
        badgeRow(S, n, lessonName(S, n, R.w - 34 * u, small ? 12.5 : sz), R.x, y0 + hs1 + hs2 + 6 * u + j * rh, R.w, { size: small ? 12.5 : sz, hot: on, a: 0.35 + 0.65 * on, h: rh });
      }
    });
  }
  // 4 · el hilo: dos límites y lo que nació de ellos
  const a3 = win(S, 'thread', 'tl-axis');
  if (a3 > 0.003) d.withAlpha(a3, () => {
    const pairs: [number, number, string, number][] = [
      [6, 7, S.l('no separa el XOR → capas', 'can’t split XOR → layers'), 0.28],
      [12, 21, S.l('olvida lo lejano → atención', 'forgets what’s far back → attention'), 0.62],
    ];
    const fsz = FS(S, sz), br = Math.max(9.5 * u, fsz * u * 0.72), rh = Math.max(2 * br, fsz * u * 1.3) + 4 * u, whyH = FS(S, 12.5) * u * 1.3 + 4 * u;
    const hs = FS(S, 15) * u * 1.5, full = hs + pairs.length * (2 * rh + whyH + 14 * u) - 14 * u;
    const compact = full > R.h;   // poco alto (teléfono pequeño): cada pareja en un renglón, «6 → 7  no separa el XOR → capas»
    const total = compact ? hs + pairs.length * (rh + 6 * u) : full;
    let y = R.y + Math.max(0, (R.h - total) / 2);
    fitText(S, S.l('Cada lección nace de un límite', 'Each lesson grows from a limit'), R.x, y, R.w, 15, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'thread', 0.02, 0.14) });
    y += hs;
    pairs.forEach(([a, b, why, f]) => {
      const al = fr(S, 'thread', f, f + 0.12);
      if (compact) {
        const bw = 2 * br, gap = 16 * u;
        badgeRow(S, a, '', R.x, y, bw, { size: sz, hot: 1, a: al, t: 'sig' });
        d.withAlpha(al, () => d.arrow(R.x + bw + 3 * u, y + rh / 2, R.x + bw + gap - 3 * u, y + rh / 2, tone(S, 'err').c, 1.6, 5 * u));
        badgeRow(S, b, '', R.x + bw + gap, y, bw, { size: sz, hot: 1, a: fr(S, 'thread', f + 0.1, f + 0.2), t: 'sig' });
        d.withAlpha(al, () => fitText(S, why, R.x + 2 * bw + gap + 8 * u, y + rh / 2, R.w - 2 * bw - gap - 8 * u, 12.5, { weight: 700, color: tone(S, 'err').ink, base: 'middle' }));
        y += rh + 6 * u;
        return;
      }
      const h1 = badgeRow(S, a, lessonName(S, a, R.w - 34 * u, sz), R.x, y, R.w, { size: sz, hot: 1, a: al, t: 'sig' });
      d.withAlpha(al, () => fitText(S, why, R.x + 26 * u, y + h1 + 2 * u, R.w - 26 * u, 12.5, { weight: 700, color: tone(S, 'err').ink, base: 'top' }));
      const h2 = badgeRow(S, b, lessonName(S, b, R.w - 34 * u, sz), R.x, y + h1 + whyH, R.w, { size: sz, hot: 1, a: fr(S, 'thread', f + 0.1, f + 0.2), t: 'sig' });
      y += h1 + h2 + whyH + 14 * u;
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Mapa abierto: map-back … end
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Caja de la tarjeta de la lección elegida y de su botón «Abrir» (para dibujar y para el toque). */
export function cardLayout(S: Frame, n: number) {
  const u = S.u, P = mapPanes(S), R = P.aside, port = S.portrait;
  const w = port ? R.w : Math.min(R.w, 360 * u), x = R.x;
  const pad = (tight(S) ? 8 : 12) * u, tw = w - 2 * pad;
  const tsz = tight(S) ? 14 : 16, isz = tight(S) ? 12.5 : 14;
  const titleH = FS(S, tsz) * u * 1.3, metaH = tight(S) && port ? 0 : FS(S, 12) * u * 1.35;
  const btn = S.l('Abrir la lección →', 'Open the lesson →'), bh = FS(S, 13) * u + 14 * u;
  const room = R.h - 2 * pad - titleH - metaH - bh - 10 * u;
  const lineH = FS(S, isz) * u * 1.26, maxL = Math.max(1, Math.floor(room / lineH));
  const ideaH = Math.min(paraH(S, S.L(IDEAS[n - 1]), tw, FS(S, isz), { weight: 600 }), maxL * lineH);
  const h = 2 * pad + metaH + titleH + 4 * u + ideaH + 8 * u + bh;
  const y = port ? R.y : R.y + Math.max(0, (R.h - h) / 2);
  const bw = Math.min(tw, S.d.measure(btn, { size: FS(S, 13), weight: 800 }) + 24 * u);
  return { x, y, w, h, pad, tw, tsz, isz, titleH, metaH, maxL, ideaH, btn, bx: x + pad, by: y + h - pad - bh, bw, bh };
}

export function drawMapOpen(S: Frame, sel: number, selAt: number, cin = 1) {
  const { d, pal: p } = S, u = S.u, P = mapPanes(S), L = mapLayout(S, P.main), sig = tone(S, 'sig');
  const rec = S.on('recap') ? fr(S, 'recap', 0, 0.08) * (1 - fr(S, 'end', 0, 0.12)) : 0;
  // tramos del repaso: aprender (1), el camino al chatbot (2–7) y el criterio (8)
  const grp = (m: number) => (m === 1 ? fr(S, 'recap', 0.04, 0.16) : m <= 7 ? fr(S, 'recap', 0.36, 0.48) : fr(S, 'recap', 0.7, 0.82));
  partial(S, L.path, 1, alpha(p.ink, 0.28), 1.6);
  L.cells.forEach((c) => {
    const act = (c.m === moduleOf(sel) ? (1 - rec) * cin : 0) + rec * grp(c.m) * (1 - fr(S, 'end', 0, 0.12));
    fitText(S, modName(S, c.m, c.w - 4 * S.u), c.lx, c.ly, c.w - 4 * S.u, 12.5, { weight: act > 0.5 ? 800 : 700, color: act > 0.5 ? sig.ink : p.ink2, base: 'middle', halo: true });
  });
  const fresh = clamp((S.clock - selAt) / 0.25);
  for (const nd of L.nodes) {
    const isSel = nd.n === sel;
    const hot = Math.max(isSel ? (1 - rec) * cin : 0, rec * grp(nd.m));
    dot(S, L, nd.x, nd.y, nd.n, { hot, warm: 1 - hot, sel: isSel ? (1 - rec) * cin * smooth(fresh) : 0 });
  }
  starDot(S, L, 1, 0);
  // panel: la tarjeta de la lección elegida (o el repaso)
  const cA = (1 - rec) * cin;
  if (cA > 0.003) d.withAlpha(cA * (0.35 + 0.65 * smooth(fresh)), () => drawCard(S, sel));
  if (rec > 0.003) d.withAlpha(rec, () => drawRecapAside(S, P.aside, grp));
}

function drawCard(S: Frame, n: number) {
  const { d, pal: p } = S, u = S.u, C = cardLayout(S, n), sig = tone(S, 'sig'), m = moduleOf(n);
  d.rect(C.x, C.y, C.w, C.h, { fill: p.surface, stroke: sig.c, lw: 1.6, r: 6 });
  let y = C.y + C.pad;
  if (C.metaH > 0) { fitText(S, S.l(`Lección ${n} · Módulo ${m}`, `Lesson ${n} · Module ${m}`), C.x + C.pad, y, C.tw, 12, { weight: 700, color: p.mute, base: 'top' }); y += C.metaH; }
  const title = C.metaH > 0 ? lessonName(S, n, C.tw, C.tsz, 800) : `${n} · ${lessonName(S, n, C.tw - 30 * u, C.tsz, 800)}`;
  fitText(S, title, C.x + C.pad, y, C.tw, C.tsz, { weight: 800, color: sig.ink, base: 'top' });
  y += C.titleH + 4 * u;
  para(S, S.L(IDEAS[n - 1]), C.x + C.pad, y, C.tw, FS(S, C.isz), { weight: 600, color: p.ink, maxLines: C.maxL });
  // el botón (también hay un botón «Abrir esta lección» bajo el escenario, para teclado)
  d.rect(C.bx, C.by, C.bw, C.bh, { fill: sig.c, r: 4 });
  fitText(S, C.btn, C.bx + C.bw / 2, C.by + C.bh / 2 + 0.5, C.bw - 12 * u, 13, { weight: 800, color: p.stage, align: 'center', base: 'middle' });
}

function drawRecapAside(S: Frame, R: Rect, grp: (m: number) => number) {
  const { pal: p } = S, u = S.u, sz = tight(S) ? 13 : 14.5;
  const rows: [string, string, number][] = [
    [S.l('Módulo 1', 'Module 1'), S.l('Aprender: bajar un error con datos', 'Learning: lowering an error with data'), 1],
    [S.l('Módulos 2 a 7', 'Modules 2 to 7'), S.l('Capas, escala y mucho texto: un chatbot', 'Layers, scale, and lots of text: a chatbot'), 2],
    [S.l('Módulo 8', 'Module 8'), S.l('Usarlo bien: preguntar, medir, gobernar', 'Using it well: ask, measure, govern'), 8],
  ];
  const hs = FS(S, 12) * u * 1.3, bodyH = rows.map(([, t]) => paraH(S, t, R.w - 14 * u, FS(S, sz), { weight: 700 }));
  const total = rows.reduce((s, _, i) => s + hs + bodyH[i] + 12 * u, 0);
  let y = R.y + Math.max(0, (R.h - total) / 2);
  rows.forEach(([lab, t, m], i) => {
    const a = grp(m);
    S.d.withAlpha(a, () => {
      S.d.rect(R.x, y, 3 * u, hs + bodyH[i], { fill: tone(S, 'sig').c });
      fitText(S, lab, R.x + 12 * u, y, R.w - 12 * u, 12, { weight: 700, color: p.mute, base: 'top' });
      para(S, t, R.x + 12 * u, y + hs, R.w - 14 * u, FS(S, sz), { weight: 700, color: p.ink });
    });
    y += hs + bodyH[i] + 12 * u;
  });
}

