// Escena: Convoluciones y visión. La convolución se calcula de verdad sobre una imagen de 16×16 píxeles:
// ventana de 3×3 que recorre la imagen, kernels reales (Sobel, desenfoque, nitidez), mapas de características, pooling y la pila de capas.
import {
  alpha, badge, box, clamp, digitGrid, blur, inset, lerp, link, neu, regions, tone, upscale, type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';

// ── imagen de entrada (16×16): una franja vertical y una casa ─────────────────
const N = 16, K = 3, M = N - K + 1;   // salida de 14×14
const IMG: number[][] = Array.from({ length: N }, () => new Array(N).fill(0.12));
for (let r = 2; r <= 13; r++) { IMG[r][2] = 0.95; IMG[r][3] = 0.95; }                      // franja vertical
for (let r = 8; r <= 14; r++) for (let c = 7; c <= 13; c++) IMG[r][c] = 0.72;               // cuerpo de la casa
for (let r = 3; r <= 7; r++) for (let c = 10 - (r - 3); c <= 10 + (r - 3); c++) if (c >= 6 && c <= 14) IMG[r][c] = 0.86;   // techo
for (let r = 11; r <= 14; r++) { IMG[r][9] = 0.22; IMG[r][10] = 0.22; }                      // puerta
IMG[9][12] = 0.3; IMG[10][12] = 0.3;                                                         // ventana

type KDef = { id: string; es: string; en: string; k: number[][]; signed: boolean; scale: number };
const KS: KDef[] = [
  { id: 'vert', es: 'Bordes verticales', en: 'Vertical edges', k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], signed: true, scale: 4 },
  { id: 'horiz', es: 'Bordes horizontales', en: 'Horizontal edges', k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], signed: true, scale: 4 },
  { id: 'blur', es: 'Desenfoque', en: 'Blur', k: Array.from({ length: 3 }, () => new Array(3).fill(1 / 9)), signed: false, scale: 1 },
  { id: 'sharp', es: 'Nitidez', en: 'Sharpen', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], signed: false, scale: 1 },
  { id: 'id', es: 'Identidad', en: 'Identity', k: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], signed: false, scale: 1 },
];
const kdef = (id: string) => KS.find((q) => q.id === id)!;
const conv = (img: number[][], k: number[][]) => Array.from({ length: M }, (_, i) => Array.from({ length: M }, (_, j) => { let s = 0; for (let u = 0; u < K; u++) for (let v = 0; v < K; v++) s += k[u][v] * img[i + u][j + v]; return s; }));
const OUT: Record<string, number[][]> = Object.fromEntries(KS.map((q) => [q.id, conv(IMG, q.k)]));
const pool = (m: number[][]) => Array.from({ length: Math.floor(m.length / 2) }, (_, i) => Array.from({ length: Math.floor(m.length / 2) }, (_, j) => Math.max(Math.abs(m[2 * i][2 * j]), Math.abs(m[2 * i][2 * j + 1]), Math.abs(m[2 * i + 1][2 * j]), Math.abs(m[2 * i + 1][2 * j + 1]))));

interface St { win?: { r: number; c: number }; lastPos?: number; seen: Record<string, boolean>; pick?: string }
const stOf = (S: Frame): St => (S.st.s ??= { seen: {} });

const scene: SceneFactory = () => ({
  controls: [
    { id: 'kern', kind: 'choice', label: { es: 'Kernel', en: 'Kernel' }, value: 'vert', from: 'try1', to: 'shared', options: KS.map((q) => ({ value: q.id, label: { es: q.es, en: q.en } })) },
    { id: 'pos', kind: 'slider', label: { es: 'Posición de la ventana', en: 'Window position' }, min: 0, max: M * M - 1, step: 1, value: 20, from: 'try1', to: 'shared', fmt: (v) => `${Math.floor(v / M) + 1}, ${(v % M) + 1}` },
    { id: 'guess', kind: 'choice', label: { es: 'Mi predicción', en: 'My prediction' }, value: 'none', from: 'try2', to: 'history', options: [{ value: 'vert', label: { es: 'A · bordes verticales', en: 'A · vertical edges' } }, { value: 'horiz', label: { es: 'B · bordes horizontales', en: 'B · horizontal edges' } }, { value: 'blur', label: { es: 'C · desenfoque', en: 'C · blur' } }] },
  ],
  init(S) { S.st.s = { seen: {} }; },

  update(S) {
    const st = stOf(S);
    if (S.between('try1', 'shared')) {
      const pos = S.p.pos ?? 20;
      if (st.lastPos !== pos) { st.win = { r: Math.floor(pos / M), c: pos % M }; st.lastPos = pos; }
      st.seen[S.p.kern ?? 'vert'] = true;
      if (Object.keys(st.seen).length >= 3) S.complete('kernels');
    }
    if (S.between('try2', 'history')) {
      const g = S.p.guess; st.pick = g && g !== 'none' ? g : undefined;
      if (st.pick === 'vert') S.complete('predict');
    }
  },

  pointer(S, e) {
    if (!S.between('try1', 'shared') || (e.type === 'move' && !S.ptr.down)) return;
    const L = layoutOf(S), cs = L.cs;
    const c = Math.floor((e.x - L.img.x) / cs) - 1, r = Math.floor((e.y - L.img.y) / cs) - 1;
    if (r >= 0 && c >= 0 && r < M + 0 && c < M + 0) stOf(S).win = { r: clamp(r, 0, M - 1), c: clamp(c, 0, M - 1) };
  },
  cursor(S, x, y) { if (!S.between('try1', 'shared')) return undefined; const L = layoutOf(S); return x >= L.img.x && x <= L.img.x + N * L.cs && y >= L.img.y && y <= L.img.y + N * L.cs ? 'crosshair' : undefined; },

  render(S) {
    const g = groupOf(S), prev = groupOf(S, Math.max(0, S.seg - 1));
    const fade = g !== prev && S.seg > 0 ? clamp(S.segT / 0.5) : 1;
    S.d.withAlpha(fade, () => {
      switch (g) {
        case 'cost': return drawCost(S);
        case 'conv': return drawConv(S);
        case 'shared': return drawShared(S);
        case 'maps': return drawMaps(S);
        case 'pool': return drawPool(S);
        case 'hier': return drawHier(S);
        case 'cnn': return drawCnn(S);
        case 'predict': return drawConv(S);
        case 'history': return drawHistory(S);
        case 'limits': return drawLimits(S);
        case 'recap': return drawRecap(S);
        default: return drawBridge(S);
      }
    });
  },
});

function groupOf(S: Frame, seg = S.seg) {
  const id = (k: string) => S.segIndex(k);
  if (seg < id('idea')) return 'cost';
  if (seg < id('shared')) return 'conv';
  if (seg < id('maps')) return 'shared';
  if (seg === id('maps')) return 'maps';
  if (seg === id('pooling')) return 'pool';
  if (seg === id('hierarchy')) return 'hier';
  if (seg === id('cnn')) return 'cnn';
  if (seg === id('try2')) return 'predict';
  if (seg === id('history')) return 'history';
  if (seg === id('limits')) return 'limits';
  if (seg === id('recap')) return 'recap';
  return 'bridge';
}

// ═════════ diseño de las tres zonas: imagen, kernel, salida ═════════
function layoutOf(S: Frame) {
  const R = regions(S, 1).all, u = S.u;
  if (S.portrait) {
    const cs = Math.floor(Math.min((R.w - 20 * u) / 2 / (N + 1), (R.h * 0.42) / (N + 1)));
    return { cs, img: { x: R.x, y: R.y + 4 * u }, out: { x: R.x + R.w - (M + 1) * cs, y: R.y + 4 * u }, ker: { x: R.x + R.w / 2 - 4 * u - 3 * 30 * u / 2, y: R.y + (N + 1) * cs + 40 * u }, R };
  }
  const cs = Math.floor(Math.min(R.w * 0.34 / (N + 1), (R.h - 36 * u) / (N + 1)));
  return { cs, img: { x: R.x, y: R.y + 18 * u }, out: { x: R.x + R.w - (M + 1) * cs, y: R.y + 18 * u }, ker: { x: R.x + (N + 1) * cs + (R.w - (N + 1) * cs - (M + 1) * cs) / 2 - 45 * u, y: R.y + 40 * u }, R };
}

const gray = (_S: Frame, v: number) => { const g = Math.round(255 * clamp(v)); return `rgb(${g},${g},${g})`; };   // brillo real: 0 = negro, 1 = blanco
function drawImage(S: Frame, x: number, y: number, cs: number, data: number[][], o: { kind: 'gray' | 'signed'; scale?: number; a?: number; upto?: number } = { kind: 'gray' }) {
  const { d } = S, rows = data.length, cols = data[0].length;
  d.rect(x - 1, y - 1, cols * cs + 2, rows * cs + 2, { stroke: S.pal.lineStrong, lw: 1 });
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (o.upto !== undefined && r * cols + c >= o.upto) continue;
    const v = data[r][c];
    const fill = o.kind === 'gray' ? gray(S, v) : v >= 0 ? alpha(tone(S, 'sig').c, clamp(v / (o.scale ?? 4)) * (o.a ?? 1)) : alpha(tone(S, 'err').c, clamp(-v / (o.scale ?? 4)) * (o.a ?? 1));
    d.rect(x + c * cs, y + r * cs, cs, cs, { fill });
  }
}

// ═════════ gancho: por qué no conectar todo con todo ═════════
function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const cs = Math.floor(Math.min(R.w * 0.3 / N, R.h * 0.5 / N)), ix = R.x + (S.portrait ? (R.w - N * cs) / 2 : 10 * u), iy = R.y + 10 * u;
  drawImage(S, ix, iy, cs, IMG, { kind: 'gray' });
  d.text(S.l('100 × 100 = 10 000 valores', '100 × 100 = 10,000 values'), ix, iy + N * cs + 16 * u, { size: 13, weight: 700, color: p.ink2 });
  if (S.is('hook')) {
    const a = S.at('hook', 0.6, 3.2, 'out'), nx = S.portrait ? R.x + R.w - 70 * u : R.x + R.w * 0.55, ny0 = R.y + 20 * u, rows = 10, gap = (S.portrait ? 24 : 30) * u;
    const lines = Math.floor(a * 160);
    for (let i = 0; i < lines; i++) { const sy = iy + (i * 7 % (N * cs)), ty = ny0 + ((i * 3) % rows) * gap; d.line(ix + N * cs, sy, nx, ty, alpha(tone(S, 'w').c, 0.16), 1); }
    for (let k = 0; k < rows; k++) d.circle(nx, ny0 + k * gap, 8 * u, { fill: p.surface, stroke: tone(S, 'sig').c, lw: 2 });
    d.withAlpha(S.at('hook', 2.6, 3.4), () => {
      d.text('10 000 000', S.portrait ? R.x + R.w / 2 : R.x + R.w * 0.55, S.portrait ? R.y + R.h - 90 * u : R.y + R.h - 90 * u, { size: S.portrait ? 32 : 44, weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'center' });
      d.text(S.l('pesos (10 000 entradas × 1 000 neuronas)', 'weights (10,000 inputs × 1,000 neurons)'), S.portrait ? R.x + R.w / 2 : R.x + R.w * 0.55, R.y + R.h - 62 * u, { size: 13, weight: 600, color: p.ink2, align: 'center' });
    });
  } else {
    // problem: el mismo borde en dos posiciones
    const a = S.reveal('problem', 0.2, 0.7), bx = R.x + R.w * (S.portrait ? 0.15 : 0.45), by = R.y + (S.portrait ? R.h * 0.55 : R.h * 0.2), pc = 16 * u;
    d.withAlpha(a, () => {
      [0, 1].forEach((k) => {
        const x = bx + k * (S.portrait ? R.w * 0.45 : R.w * 0.28);
        d.rect(x, by, pc * 2, pc * 4, { fill: gray(S, 0.12) }); d.rect(x + pc, by, pc, pc * 4, { fill: gray(S, 0.95) });
        d.text(S.l(`posición ${k + 1}`, `position ${k + 1}`), x + pc, by + pc * 4 + 16 * u, { size: 12, weight: 600, color: p.ink2, align: 'center' });
      });
      d.text('=', bx + (S.portrait ? R.w * 0.3 : R.w * 0.2), by + pc * 2, { size: 30, weight: 800, align: 'center', base: 'middle' });
      badge(S, S.l('¿el mismo borde? otros pesos', 'the same edge? other weights'), bx + (S.portrait ? R.w * 0.3 : R.w * 0.14), by - 26 * u, { tone: 'err' });
    });
  }
}

// ═════════ la convolución: imagen → kernel → salida ═════════
function drawConv(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layoutOf(S), cs = L.cs;
  const st = stOf(S), predict = S.is('try2');
  const kid = predict ? (st.pick && st.pick !== 'none' ? st.pick : 'vert') : S.between('try1', 'shared') ? S.p.kern ?? 'vert' : S.is('horizontal') ? 'horiz' : 'vert';
  const kd = kdef(kid), out = OUT[kid];
  const inOutputs = !S.between('idea', 'kernel') && !(predict && !st.pick);
  // posición de la ventana
  let win = { r: 0, c: 0 }, upto = M * M;
  if (S.is('idea')) { const k = S.at('idea', 0.4, 3.4, 'lin') * M * M; win = { r: Math.floor(k / M) % M, c: Math.floor(k) % M }; upto = 0; }
  else if (S.is('kernel')) { const k = S.at('kernel', 1.2, 7.0, 'lin') * (M * M - 1); win = { r: Math.floor(k / M), c: Math.floor(k) % M }; upto = Math.floor(k) + 1; }
  else if (S.between('try1', 'shared')) win = st.win ?? { r: 6, c: 6 };
  else win = S.is('vertical') ? { r: 6, c: 1 } : S.is('horizontal') ? { r: 2, c: 7 } : { r: 6, c: 6 };
  if (S.is('try2')) win = { r: 6, c: 1 };
  // etiquetas
  d.text(S.l('entrada (16×16)', 'input (16×16)'), L.img.x + cs, L.img.y - 6 * u, { size: 12, weight: 700, color: p.ink2 });
  d.text(S.l('salida (14×14)', 'output (14×14)'), L.out.x + cs, L.out.y - 6 * u, { size: 12, weight: 700, color: p.ink2 });
  // imagen y ventana
  const ix = L.img.x + cs, iy = L.img.y + cs;
  drawImage(S, ix, iy, cs, IMG, { kind: 'gray' });
  const hot = tone(S, 'w').c;
  d.rect(ix + win.c * cs, iy + win.r * cs, K * cs, K * cs, { stroke: hot, lw: 2.5, fill: alpha(hot, 0.12) });
  // salida
  const ox = L.out.x + cs, oy = L.out.y + cs;
  const showOut = S.is('idea') ? false : S.is('kernel') ? true : !predict || !!st.pick;
  if (showOut) {
    drawImage(S, ox, oy, cs, out, { kind: kd.signed ? 'signed' : 'gray', scale: kd.scale, upto: S.is('kernel') ? upto : undefined });
    d.rect(ox + win.c * cs, oy + win.r * cs, cs, cs, { stroke: hot, lw: 2.5 });
  } else d.rect(ox - 1, oy - 1, M * cs + 2, M * cs + 2, { stroke: p.line, lw: 1, dash: [4, 4] });
  void inOutputs;
  // kernel y cálculo
  const kx = L.ker.x, ky = L.ker.y, kc = (S.portrait ? 30 : 44) * u;
  if (!S.is('idea')) {
    d.text(S.l('kernel', 'kernel') + (S.between('try1', 'shared') || predict ? ` · ${S.l(kd.es, kd.en)}` : ''), kx, ky - 8 * u, { size: 12, weight: 700, color: tone(S, 'w').ink });
    kd.k.forEach((row, r) => row.forEach((v, c) => {
      d.rect(kx + c * kc, ky + r * kc, kc - 3, kc - 3, { fill: alpha(tone(S, 'w').c, 0.08 + 0.3 * Math.min(1, Math.abs(v) / 2)), stroke: tone(S, 'w').c, lw: 1 });
      d.text(kd.id === 'blur' ? '1/9' : String(v), kx + c * kc + (kc - 3) / 2, ky + r * kc + (kc - 3) / 2, { size: 13, weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'middle' });
    }));
    // parche de 3×3 bajo la ventana y su suma
    const patch = [0, 1, 2].map((r) => [0, 1, 2].map((c) => IMG[win.r + r][win.c + c]));
    let sum = 0; kd.k.forEach((row, r) => row.forEach((v, c) => (sum += v * patch[r][c])));
    const py = ky + 3 * kc + 14 * u;
    d.text(S.l('píxeles bajo la ventana', 'pixels under the window'), kx, py, { size: 11, weight: 700, color: p.mute });
    patch.forEach((row, r) => row.forEach((v, c) => { d.rect(kx + c * 22 * u, py + 6 * u + r * 22 * u, 20 * u, 20 * u, { fill: gray(S, v) }); d.text(S.n(v, 1), kx + c * 22 * u + 10 * u, py + 6 * u + r * 22 * u + 10 * u, { size: 10, font: 'mono', weight: 600, color: v > 0.5 ? 'black' : 'white', align: 'center', base: 'middle' }); }));
    const sx = kx + 3 * 22 * u + 10 * u;
    d.text('Σ =', sx, py + 6 * u + 33 * u, { size: 14, weight: 700, color: p.ink2, base: 'middle' });
    d.text(S.n(sum, 2), sx + 34 * u, py + 6 * u + 33 * u, { size: 22, weight: 800, font: 'mono', color: sum >= 0 ? tone(S, 'sig').ink : tone(S, 'err').ink, base: 'middle' });
    void link; void box; void inset;
  }
  // mensajes de segmento
  if (S.is('vertical') && S.at('vertical', 1.2, 2.0) > 0) d.withAlpha(S.at('vertical', 1.2, 2.0), () => { d.text(S.l('azul: borde que sube · rosa: borde que baja', 'blue: rising edge · pink: falling edge'), L.R.x + L.R.w / 2, L.R.y + L.R.h - 6 * u, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'bottom' }); });
  if (S.is('try2')) {
    const R = L.R, y = R.y + R.h - 10 * u;
    if (!st.pick) d.text(S.l('¿cuál resaltará mejor la franja vertical de la izquierda?', 'which will highlight the vertical stripe on the left best?'), R.x + R.w / 2, y, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'bottom', w: R.w });
    else d.text(st.pick === 'vert' ? S.l('Correcto: los bordes verticales de la franja saltan a la vista.', 'Correct: the stripe’s vertical edges leap out.') : S.l('Casi no la resalta. Mira cómo queda y prueba otro.', 'It barely highlights it. See how it looks and try another.'), R.x + R.w / 2, y, { size: 13, weight: 700, color: st.pick === 'vert' ? tone(S, 'dat').ink : tone(S, 'err').ink, align: 'center', base: 'bottom', w: R.w });
  }
}

// ═════════ pesos compartidos y kernels aprendidos ═════════
function drawShared(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  if (S.is('shared')) {
    const a = S.reveal('shared', 0.3, 0.8), cx = R.x + R.w / 2;
    d.withAlpha(a, () => {
      const bw = Math.min(R.w * 0.8, 520 * u), y = R.y + R.h * 0.2;
      d.text(S.l('totalmente conectada', 'fully connected'), cx, y, { size: 13, weight: 700, color: p.ink2, align: 'center' });
      d.rect(cx - bw / 2, y + 10 * u, bw, 26 * u, { fill: alpha(tone(S, 'w').c, 0.4), stroke: tone(S, 'w').c, r: 3 });
      d.text('10 000 000', cx - bw / 2 + 12 * u, y + 23 * u, { size: 16, weight: 800, font: 'mono', color: tone(S, 'w').ink, base: 'middle' });
      d.text(S.l('convolucional (un kernel 3×3)', 'convolutional (one 3×3 kernel)'), cx, y + 74 * u, { size: 13, weight: 700, color: p.ink2, align: 'center' });
      d.rect(cx - bw / 2, y + 84 * u, 3, 26 * u, { fill: alpha(tone(S, 'dat').c, 0.7), stroke: tone(S, 'dat').c });
      d.text('10', cx - bw / 2 + 12 * u, y + 97 * u, { size: 16, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'middle' });
      d.text(S.l('9 pesos + 1 sesgo, para cualquier tamaño de imagen', '9 weights + 1 bias, for any image size'), cx, y + 140 * u, { size: 14, weight: 700, color: p.ink, align: 'center', w: R.w - 20 * u });
    });
    return;
  }
  // learned: el kernel converge a un detector de bordes (ilustración)
  const t = S.at('learned', 0.6, 5.0, 'io'), cx = R.x + R.w / 2, kc = 52 * u, kx = cx - 1.5 * kc, ky = R.y + R.h * 0.22;
  const start = [[0.4, -0.7, 0.9], [-0.2, 0.6, -0.5], [0.8, 0.1, -0.6]], target = kdef('vert').k;
  d.text(S.l('kernel durante el entrenamiento (ilustración)', 'kernel during training (illustration)'), cx, ky - 22 * u, { size: 13, weight: 700, color: p.ink2, align: 'center' });
  target.forEach((row, r) => row.forEach((tv, c) => { const v = lerp(start[r][c], tv, t); d.rect(kx + c * kc, ky + r * kc, kc - 4, kc - 4, { fill: alpha(tone(S, 'w').c, 0.08 + 0.3 * Math.min(1, Math.abs(v) / 2)), stroke: tone(S, 'w').c }); d.text(S.n(v, 1), kx + c * kc + (kc - 4) / 2, ky + r * kc + (kc - 4) / 2, { size: 14, weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'middle' }); }));
  d.withAlpha(S.at('learned', 5.0, 5.8), () => badge(S, S.l('un detector de bordes aparece solo', 'an edge detector appears on its own'), cx, ky + 3 * kc + 28 * u, { tone: 'dat' }));
  neu(S, R.x + R.w - 72 * u, R.y + R.h - 60 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'wow', a: S.at('learned', 5.0, 5.8) });
}

// ═════════ varios kernels, varios mapas ═════════
function drawMaps(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const list = ['vert', 'horiz', 'blur', 'sharp'], cols = S.portrait ? 2 : 4, cs = Math.floor(Math.min((R.w / cols - 16 * u) / M, (R.h * (S.portrait ? 0.4 : 0.7)) / M));
  list.forEach((id, i) => {
    const a = S.reveal('maps', 0.3 + i * 0.5, 0.6), col = i % cols, row = Math.floor(i / cols), x = R.x + col * (R.w / cols) + (R.w / cols - M * cs) / 2, y = R.y + 10 * u + row * (M * cs + 40 * u), kd = kdef(id);
    d.withAlpha(a, () => { drawImage(S, x, y, cs, OUT[id], { kind: kd.signed ? 'signed' : 'gray', scale: kd.scale }); d.text(S.l(kd.es, kd.en), x + (M * cs) / 2, y + M * cs + 16 * u, { size: 12, weight: 700, color: p.ink2, align: 'center' }); });
  });
}

// ═════════ pooling ═════════
function drawPool(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, src = OUT.vert, pl = pool(src), pc = pl.length;
  const cs = Math.floor(Math.min((R.w * 0.42) / M, (R.h * (S.portrait ? 0.34 : 0.7)) / M)), x0 = S.portrait ? R.x + (R.w - M * cs) / 2 : R.x + 8 * u, y0 = R.y + 12 * u;
  const x1 = S.portrait ? R.x + (R.w - pc * cs * 2) / 2 : R.x + R.w - pc * cs * 2 - 8 * u, y1 = S.portrait ? y0 + M * cs + 56 * u : y0;
  drawImage(S, x0, y0, cs, src.map((r) => r.map((v) => Math.abs(v) / 4)), { kind: 'gray' });
  d.text(S.l('mapa 14×14', 'map 14×14'), x0, y0 - 5 * u, { size: 12, weight: 700, color: p.ink2 });
  const k = S.at('pooling', 0.6, 5.5, 'lin') * pc * pc, n = Math.floor(k);
  drawImage(S, x1, y1, cs * 2, pl.map((r, i) => r.map((v, j) => (i * pc + j < n ? v / 4 : 0))), { kind: 'gray' });
  d.text(S.l('tras el pooling 7×7', 'after pooling 7×7'), x1, y1 - 5 * u, { size: 12, weight: 700, color: p.ink2 });
  const cur = Math.min(n, pc * pc - 1), pi = Math.floor(cur / pc), pj = cur % pc;
  if (k < pc * pc) { d.rect(x0 + pj * 2 * cs, y0 + pi * 2 * cs, 2 * cs, 2 * cs, { stroke: tone(S, 'w').c, lw: 2.5 }); d.rect(x1 + pj * 2 * cs, y1 + pi * 2 * cs, 2 * cs, 2 * cs, { stroke: tone(S, 'w').c, lw: 2.5 }); }
  if (!S.portrait) d.text('→', (x0 + M * cs + x1) / 2, y0 + M * cs / 2, { size: 28, weight: 800, color: p.mute, align: 'center', base: 'middle' });
}

// ═════════ jerarquía de características ═════════
function drawHier(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const cols = S.portrait ? 1 : 3, cw = S.portrait ? R.w - 20 * u : R.w / 3 - 12 * u, ch = S.portrait ? (R.h - 64 * u) / 3 : R.h * 0.62;
  const levels = [{ es: 'Bordes', en: 'Edges', tn: 'sig' as const }, { es: 'Partes', en: 'Parts', tn: 'lat' as const }, { es: 'Objetos', en: 'Objects', tn: 'dat' as const }];
  levels.forEach((lv, i) => {
    const a = S.reveal('hierarchy', 0.3 + i * 0.9, 0.7), x = R.x + (S.portrait ? 10 * u : i * (cw + 18 * u)), y = R.y + (S.portrait ? i * (ch + 14 * u) : 20 * u), t = tone(S, lv.tn);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: t.soft, stroke: t.c, lw: 1.5, r: 3 });
      d.text(S.l(lv.es, lv.en), x + 10 * u, y + 18 * u, { size: 14, weight: 800, color: t.ink });
      const mx = x + cw / 2, my = y + ch * 0.58, s = Math.min(cw, ch) * 0.22;
      d.ctx.save(); d.ctx.strokeStyle = t.c; d.ctx.fillStyle = t.c; d.ctx.lineWidth = 3;
      if (i === 0) { [[-1, -1, 1, 1], [-1, 1, 1, -1], [-1, 0, 1, 0], [0, -1, 0, 1]].forEach(([a1, b1, a2, b2], k) => { d.ctx.beginPath(); d.ctx.moveTo(mx + (a1 - 1.2 + (k % 2) * 0.1) * s * 0.6 - s * 0.7, my + b1 * s * 0.6 - (k > 1 ? 0 : 0)); d.ctx.lineTo(mx + (a2 - 1.2) * s * 0.6 - s * 0.7, my + b2 * s * 0.6); d.ctx.stroke(); }); }
      if (i === 0) { d.ctx.beginPath(); d.ctx.moveTo(mx + s * 0.5, my - s); d.ctx.lineTo(mx + s * 0.5, my + s); d.ctx.moveTo(mx + s * 1.1, my + s * 0.4); d.ctx.lineTo(mx + s * 1.8, my + s * 0.4); d.ctx.stroke(); }
      if (i === 1) { d.ctx.beginPath(); d.ctx.arc(mx - s * 0.9, my, s * 0.7, Math.PI * 0.9, Math.PI * 2.1); d.ctx.stroke(); d.ctx.beginPath(); d.ctx.moveTo(mx + s * 0.2, my + s * 0.7); d.ctx.lineTo(mx + s * 0.2, my - s * 0.7); d.ctx.lineTo(mx + s * 1.2, my - s * 0.7); d.ctx.stroke(); d.ctx.beginPath(); d.ctx.moveTo(mx + s * 1.5, my + s * 0.7); d.ctx.lineTo(mx + s * 2, my - s * 0.2); d.ctx.lineTo(mx + s * 2.5, my + s * 0.7); d.ctx.stroke(); }
      d.ctx.restore();
      if (i === 2) { for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const house = r >= 4 || (c >= 3 - (r) + 1 && c <= 4 + (r)); const on = (r >= 4 && c >= 1 && c <= 6) || (r < 4 && c >= 3 - r && c <= 4 + r - 0 && r >= 0 && r <= 3); if (on) d.rect(mx - s * 1.4 + c * s * 0.38, my - s * 1.2 + r * s * 0.38, s * 0.36, s * 0.36, { fill: t.c }); void house; } }
    });
  });
  d.withAlpha(S.at('hierarchy', 3.2, 4.0), () => d.text(S.l('ilustrativo: en redes reales las características las descubre el entrenamiento', 'illustrative: in real networks, training discovers the features'), R.x + R.w / 2, R.y + R.h - 4 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom', w: R.w }));
}

// ═════════ la pila de una CNN ═════════
function drawCnn(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const stages = [
    { es: 'Entrada', en: 'Input', dim: '28×28×1', side: 28, ch: 1, tn: 'ink' as const },
    { es: 'Conv 3×3', en: 'Conv 3×3', dim: '26×26×8', side: 26, ch: 8, tn: 'sig' as const },
    { es: 'Pooling', en: 'Pooling', dim: '13×13×8', side: 13, ch: 8, tn: 'lat' as const },
    { es: 'Conv 3×3', en: 'Conv 3×3', dim: '11×11×16', side: 11, ch: 16, tn: 'sig' as const },
    { es: 'Pooling', en: 'Pooling', dim: '5×5×16', side: 5, ch: 16, tn: 'lat' as const },
    { es: 'Densa', en: 'Dense', dim: '400 → 10', side: 3, ch: 10, tn: 'dat' as const },
  ];
  const n = stages.length, vertical = S.portrait, sw = vertical ? R.w - 60 * u : (R.w - 10 * u) / n, sh = vertical ? (R.h - 30 * u) / n : R.h * 0.5;
  stages.forEach((s, i) => {
    const a = S.reveal('cnn', 0.2 + i * 0.7, 0.6), t = tone(S, s.tn);
    const x = vertical ? R.x + 30 * u : R.x + 5 * u + i * sw, y = vertical ? R.y + 4 * u + i * sh : R.y + R.h * 0.18;
    d.withAlpha(a, () => {
      const bw = vertical ? (sw * s.side) / 28 * 0.8 : Math.max(18 * u, (sw - 14 * u) * (0.35 + 0.65 * s.side / 28)), bh = vertical ? sh - 14 * u : sh * (0.3 + 0.7 * s.side / 28);
      for (let k = Math.min(s.ch, 4) - 1; k >= 0; k--) d.rect(x + k * 4 * u, y + (vertical ? 0 : (sh - bh) / 2) - k * 4 * u + (vertical ? 4 * u : 0), vertical ? bw : bw - 8 * u, vertical ? bh : bh, { fill: t.soft, stroke: t.c, lw: 1.5, r: 2 });
      const tx = vertical ? x + bw + 20 * u : x + 4 * u, ty = vertical ? y + bh / 2 + 4 * u : y + sh + 18 * u;
      d.text(S.l(s.es, s.en), tx, ty, { size: 12, weight: 800, color: t.ink, align: vertical ? 'left' : 'left', base: vertical ? 'bottom' : 'top' });
      d.text(s.dim, tx, ty + (vertical ? 4 * u : 16 * u), { size: 11, font: 'mono', color: p.ink2, base: 'top' });
    });
  });
  d.withAlpha(S.at('cnn', 5.2, 6.0), () => d.text(S.l('ejemplo: dígitos de 28×28 → 10 clases', 'example: 28×28 digits → 10 classes'), R.x + R.w / 2, R.y + R.h - 2 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom' }));
}

// ═════════ historia ═════════
function drawHistory(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const dg = upscale(blur(digitGrid(7)), 1), cs = Math.floor(Math.min(R.w * 0.2 / 5, R.h * 0.4 / 7));
  const a = S.reveal('history', 0.3, 0.7), x = R.x + R.w * (S.portrait ? 0.5 : 0.25) - 2.5 * cs, y = R.y + R.h * 0.18;
  d.withAlpha(a, () => {
    dg.forEach((row, r) => row.forEach((v, c) => d.rect(x + c * cs, y + r * cs, cs - 1, cs - 1, { fill: gray(S, v) })));
    d.text('→ 7', x + 5 * cs + 14 * u, y + 3.5 * cs, { size: 26, weight: 800, font: 'mono', base: 'middle' });
    d.text(S.l('códigos postales manuscritos', 'handwritten zip codes'), x + 2.5 * cs, y + 7 * cs + 18 * u, { size: 13, weight: 700, color: p.ink2, align: 'center' });
  });
  const items = [{ yr: 1989, es: 'Red convolucional entrenada con retropropagación', en: 'Convolutional net trained with backpropagation', t: 0.8 }, { yr: 1998, es: 'LeNet-5: lectura de documentos', en: 'LeNet-5: document recognition', t: 2.2 }];
  items.forEach((it, i) => { const k = S.at('history', it.t, it.t + 0.6, 'out'); if (k > 0) d.withAlpha(k, () => badge(S, `${it.yr} · ${S.l(it.es, it.en)}`, R.x + R.w / 2, R.y + R.h * (S.portrait ? 0.62 : 0.66) + i * 40 * u, { tone: i ? 'dat' : 'sig' })); });
}

// ═════════ límites ═════════
function drawLimits(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.42, 280 * u), bh = 70 * u, y = R.y + R.h * 0.2;
  const xs = S.portrait ? [R.x + (R.w - bw) / 2, R.x + (R.w - bw) / 2] : [R.x + R.w / 2 - bw - 12 * u, R.x + R.w / 2 + 12 * u], ys = S.portrait ? [y, y + bh + 30 * u] : [y, y];
  box(S, { x: xs[0], y: ys[0], w: bw, h: bh }, S.l('Lo que vemos: la forma', 'What we see: the shape'), { tone: 'dat', a: S.reveal('limits', 0.3, 0.6) });
  box(S, { x: xs[1], y: ys[1], w: bw, h: bh }, S.l('En qué se apoya la red: texturas', 'What the network leans on: textures'), { tone: 'err', a: S.reveal('limits', 1.2, 0.6) });
  d.withAlpha(S.at('limits', 2.4, 3.2), () => d.text(S.l('cambios sutiles, invisibles para una persona, pueden cambiar la respuesta', 'subtle changes, invisible to a person, can change the answer'), R.x + R.w / 2, ys[1] + bh + 36 * u, { size: 14, weight: 700, color: p.ink, align: 'center', w: R.w - 24 * u }));
  neu(S, R.x + R.w - 70 * u, R.y + R.h - 58 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: S.at('limits', 2.6, 3.2) });
}

// ═════════ resumen y puente ═════════
function drawRecap(S: Frame) {
  const R = regions(S, 1).all, u = S.u;
  const labels = [S.l('Un kernel compartido', 'A shared kernel'), S.l('Pocos pesos, mismo detector', 'Few weights, same detector'), S.l('De bordes a objetos', 'From edges to objects')];
  const tones = ['w', 'dat', 'lat'] as const, bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.3, 260 * u), bh = 70 * u;
  const pos: Rect[] = labels.map((_, i) => S.portrait ? { x: R.x + (R.w - bw) / 2, y: R.y + 10 * u + i * (bh + 34 * u), w: bw, h: bh } : { x: R.x + i * (R.w - bw) / 2, y: R.y + R.h / 2 - bh / 2, w: bw, h: bh });
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.2 + i * 0.5, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: 14 }); });
  for (let i = 0; i < 2; i++) { const a = S.at('recap', 0.7 + i * 0.5, 1.2 + i * 0.5); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
}
function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Secuencias y memoria', 'Sequences and memory'), cx, cy + 82 * u, { size: 24, weight: 800, align: 'center' });
  });
}

export default scene;
