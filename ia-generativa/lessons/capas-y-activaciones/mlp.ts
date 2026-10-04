// Una MLP diminuta REAL, en JavaScript puro, para el «patio de juegos» de la lección 7.
//
// Qué es: perceptrón multicapa (capas totalmente conectadas) con 2 entradas (x, y), de 0 a 4 capas ocultas con la
// misma anchura y una neurona de salida con sigmoide. Pérdida: entropía cruzada binaria. Entrenamiento: pasos de
// gradiente por LOTE COMPLETO con el optimizador Adam (Kingma y Ba, 2015: descenso del gradiente con pasos adaptados
// por parámetro; se explica en la lección 9). El gradiente se calcula con retropropagación (lección 8): aquí es
// una caja negra que ya funciona; la lección siguiente la abre.
//
// Reproducible: todo sale de rng(semilla) del kit (ningún azar del navegador). Mismos datos + misma configuración + mismas
// semillas => exactamente los mismos pesos tras el mismo número de pasos.
//
// Costo: un paso sobre 180 puntos con una red 2-8-8-8-1 son ~95 000 multiplicaciones-sumas (medido en Node: 0,32 ms; 0,07 ms
// con una red 2-8-1). El ritmo de pasos por fotograma lo fija la escena (según el tiempo del segmento o, en los turnos,
// según el dt del fotograma); aquí no se lee el reloj.
import { gauss, hash, rng } from '../../../../../theme/kit';

export type Act = 'linear' | 'relu' | 'tanh' | 'sigmoid';
export type DataId = 'circles' | 'spiral';

export interface Pt { x: number; y: number; c: 0 | 1 }

/** Dominio del plano (cuadrado [-R, R]²). */
export const R = 3;
const SCALE = 1 / R;            // las coordenadas entran a la red divididas entre R (quedan en [-1, 1])

// ── datos ────────────────────────────────────────────────────────────────────────────────────────────
// Se generan en el navegador, al abrir la lección, con rng() determinista (semillas fijas): son siempre los mismos puntos,
// no hay nada que descargar y no hay datos de terceros (sin licencias que atender).
// • círculos: clase 0 = disco central (radio ≤ 1,15), clase 1 = anillo (radio 1,95–2,8), con ruido gaussiano de 0,12.
// • espiral:  dos brazos entrelazados (uno por clase), radio 0,25–2,7, dos vueltas, ruido gaussiano de 0,10.
export function makeData(id: DataId, n = 90, turns = 2): Pt[] {
  const r = rng(id === 'circles' ? 11 : 23), out: Pt[] = [];
  const g = () => gauss(r);
  if (id === 'circles') {
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 1.15;
      out.push({ x: rad * Math.cos(a) + 0.12 * g(), y: rad * Math.sin(a) + 0.12 * g(), c: 0 });
    }
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, rad = 1.95 + r() * 0.85;
      out.push({ x: rad * Math.cos(a) + 0.12 * g(), y: rad * Math.sin(a) + 0.12 * g(), c: 1 });
    }
  } else {
    for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n, rad = 0.25 + f * 2.45, t = f * turns * 2 * Math.PI + k * Math.PI;
      out.push({ x: rad * Math.sin(t) + 0.1 * g(), y: rad * Math.cos(t) + 0.1 * g(), c: k as 0 | 1 });
    }
  }
  return out;
}

// ── red ──────────────────────────────────────────────────────────────────────────────────────────────
export interface Net {
  sizes: number[];                 // [2, h, h, …, 1]
  act: Act;
  W: Float64Array[];               // W[l]: (sizes[l+1] × sizes[l]), por filas
  b: Float64Array[];
  mW: Float64Array[]; vW: Float64Array[]; mb: Float64Array[]; vb: Float64Array[];   // estado de Adam
  gW: Float64Array[]; gb: Float64Array[];                                             // gradientes acumulados
  step: number;
  loss: number;                    // última pérdida (media, entropía cruzada)
  acc: number;                     // última exactitud sobre los puntos de entrenamiento (0..1)
  // espacio de trabajo
  A: Float64Array[]; D: Float64Array[];
}

export const sizesOf = (hidden: number, width: number) => [2, ...Array.from({ length: hidden }, () => width), 1];

export function makeNet(hidden: number, width: number, act: Act, seed: number): Net {
  const sizes = sizesOf(hidden, width), r = rng(Math.floor(hash(seed, 91) * 4294967295) + 1);
  const L = sizes.length - 1, z = (n: number) => new Float64Array(n);
  const W: Float64Array[] = [], b: Float64Array[] = [];
  for (let l = 0; l < L; l++) {
    const fi = sizes[l], fo = sizes[l + 1], w = z(fi * fo);
    // He para ReLU (desviación √(2/entradas)); Glorot uniforme para el resto.
    if (act === 'relu' && l < L - 1) { const s = Math.sqrt(2 / fi); for (let i = 0; i < w.length; i++) w[i] = s * gauss(r); }
    else { const s = Math.sqrt(6 / (fi + fo)); for (let i = 0; i < w.length; i++) w[i] = (r() * 2 - 1) * s; }
    // Sesgos de las capas ocultas: uniformes en ±0,5 (evita neuronas ReLU «muertas» desde el inicio); el de salida, 0.
    const bb = z(fo); if (l < L - 1) for (let i = 0; i < fo; i++) bb[i] = (r() * 2 - 1) * 0.5;
    W.push(w); b.push(bb);
  }
  const like = (a: Float64Array[]) => a.map((x) => z(x.length));
  return {
    sizes, act, W, b, mW: like(W), vW: like(W), mb: like(b), vb: like(b), gW: like(W), gb: like(b),
    step: 0, loss: Math.LN2, acc: 0.5, A: sizes.map((n) => z(n)), D: sizes.map((n) => z(n)),
  };
}

const f = (a: Act, z: number) => (a === 'relu' ? (z > 0 ? z : 0) : a === 'tanh' ? Math.tanh(z) : a === 'sigmoid' ? 1 / (1 + Math.exp(-z)) : z);
/** Derivada respecto a la suma z, escrita en función de la salida a = f(z). */
const df = (a: Act, out: number) => (a === 'relu' ? (out > 0 ? 1 : 0) : a === 'tanh' ? 1 - out * out : a === 'sigmoid' ? out * (1 - out) : 1);
const sig = (z: number) => 1 / (1 + Math.exp(-z));

/** Pase hacia delante de un punto: devuelve la probabilidad de la clase 1. Usa el espacio de trabajo de la red. */
export function forward(net: Net, x: number, y: number): number {
  const { sizes, W, b, A } = net, L = sizes.length - 1;
  A[0][0] = x * SCALE; A[0][1] = y * SCALE;
  for (let l = 0; l < L; l++) {
    const fi = sizes[l], fo = sizes[l + 1], w = W[l], bb = b[l], a0 = A[l], a1 = A[l + 1];
    for (let j = 0; j < fo; j++) {
      let s = bb[j]; const o = j * fi;
      for (let i = 0; i < fi; i++) s += w[o + i] * a0[i];
      a1[j] = l === L - 1 ? sig(s) : f(net.act, s);
    }
  }
  return A[L][0];
}

/** Un paso de Adam sobre todo el lote. Actualiza net.loss y net.acc con el estado ANTES del paso. */
export function trainStep(net: Net, data: Pt[], lr = 0.03) {
  const { sizes, W, b, A, D, gW, gb } = net, L = sizes.length - 1, n = data.length;
  for (let l = 0; l < L; l++) { gW[l].fill(0); gb[l].fill(0); }
  let loss = 0, hits = 0;
  for (let k = 0; k < n; k++) {
    const p = forward(net, data[k].x, data[k].y), y = data[k].c;
    loss -= y ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9);
    if ((p > 0.5 ? 1 : 0) === y) hits++;
    D[L][0] = p - y;                                   // d(pérdida)/d(suma de salida) con sigmoide + entropía cruzada
    for (let l = L - 1; l >= 0; l--) {
      const fi = sizes[l], fo = sizes[l + 1], w = W[l], a0 = A[l], d1 = D[l + 1], g = gW[l], gbb = gb[l];
      for (let j = 0; j < fo; j++) { const dj = d1[j]; gbb[j] += dj; const o = j * fi; for (let i = 0; i < fi; i++) g[o + i] += dj * a0[i]; }
      if (l > 0) {                                      // la «culpa» pasa a la capa anterior (retropropagación)
        const d0 = D[l];
        for (let i = 0; i < fi; i++) { let s = 0; for (let j = 0; j < fo; j++) s += w[j * fi + i] * d1[j]; d0[i] = s * df(net.act, a0[i]); }
      }
    }
  }
  net.loss = loss / n; net.acc = hits / n;
  // Adam
  const t = ++net.step, b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
  for (let l = 0; l < L; l++) {
    const upd = (p: Float64Array, g: Float64Array, m: Float64Array, v: Float64Array) => {
      for (let i = 0; i < p.length; i++) {
        const gi = g[i] / n;
        m[i] = b1 * m[i] + (1 - b1) * gi; v[i] = b2 * v[i] + (1 - b2) * gi * gi;
        p[i] -= (lr * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8);
      }
    };
    upd(W[l], gW[l], net.mW[l], net.vW[l]); upd(b[l], gb[l], net.mb[l], net.vb[l]);
  }
}

/** `n` pasos seguidos. Devuelve cuántos hizo (n). */
export function trainSteps(net: Net, data: Pt[], n: number, lr = 0.03): number {
  for (let k = 0; k < n; k++) trainStep(net, data, lr);
  return Math.max(0, n);
}

/** Exactitud y pérdida actuales (sin entrenar). */
export function evaluate(net: Net, data: Pt[]) {
  let loss = 0, hits = 0;
  for (const q of data) { const p = forward(net, q.x, q.y); loss -= q.c ? Math.log(p + 1e-9) : Math.log(1 - p + 1e-9); if ((p > 0.5 ? 1 : 0) === q.c) hits++; }
  net.loss = loss / data.length; net.acc = hits / data.length;
}

/** Rejilla n×n de probabilidades sobre el dominio [-R,R]² (fila 0 = arriba, y = +R). */
export function gridOf(net: Net, n: number, out?: Float32Array): Float32Array {
  const g = out ?? new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) g[j * n + i] = forward(net, -R + ((i + 0.5) / n) * 2 * R, R - ((j + 0.5) / n) * 2 * R);
  return g;
}

/** Para activación lineal: la red entera equivale a UNA neurona. Devuelve (w1, w2, b) del producto de matrices. */
export function collapseLinear(net: Net): [number, number, number] {
  const { sizes, W, b } = net, L = sizes.length - 1;
  // Se compone de la salida hacia la entrada: z_out = Wl…W1 x + (sesgos acumulados). La sigmoide final no cuenta como «capa oculta».
  let row = Float64Array.from(W[L - 1]);          // 1 × sizes[L-1]
  let bias = b[L - 1][0];
  for (let l = L - 2; l >= 0; l--) {
    const fi = sizes[l], fo = sizes[l + 1], w = W[l], next = new Float64Array(fi);
    for (let j = 0; j < fo; j++) { bias += row[j] * b[l][j]; for (let i = 0; i < fi; i++) next[i] += row[j] * w[j * fi + i]; }
    row = next;
  }
  return [row[0] * SCALE, row[1] * SCALE, bias];
}

export interface LineFit { angle: number; offset: number; acc: number }
/**
 * Para cada uno de 180 ángulos, la mejor recta (umbral) sobre los datos y su exactitud (se elige sola la orientación del
 * lado «1»). Fuerza bruta: 180 × O(n log n). Sirve para rotular «la mejor recta posible» y para el barrido de la lección.
 * La recta es  x·cos(angle) + y·sin(angle) = offset.
 */
export function lineSweep(data: Pt[]): LineFit[] {
  const out: LineFit[] = [], n = data.length;
  let ones = 0; for (const q of data) ones += q.c;
  for (let k = 0; k < 180; k++) {
    const a = (k / 180) * Math.PI, nx = Math.cos(a), ny = Math.sin(a);
    const proj = data.map((q) => ({ s: q.x * nx + q.y * ny, c: q.c })).sort((p, q) => p.s - q.s);
    let below1 = 0, below0 = 0, best = { acc: 0, offset: 0 };
    for (let i = 0; i <= n; i++) {
      const hit = Math.max(below0 + (ones - below1), below1 + (n - ones - below0)) / n;   // «1 arriba» o «1 abajo»
      if (hit > best.acc) best = { acc: hit, offset: i === 0 ? proj[0].s - 0.01 : i === n ? proj[n - 1].s + 0.01 : (proj[i - 1].s + proj[i].s) / 2 };
      if (i < n) { if (proj[i].c) below1++; else below0++; }
    }
    out.push({ angle: a, offset: best.offset, acc: best.acc });
  }
  return out;
}

/** Número de parámetros (pesos + sesgos) de una red densa con esas capas. */
export const paramCount = (sizes: number[]) => sizes.slice(1).reduce((s, n, l) => s + (sizes[l] + 1) * n, 0);

// ── aproximación de una curva con neuronas ReLU (construida a mano, NO entrenada) ───────────────────
// Suma de «bisagras»: f(x) ≈ f(t0) + Σ a_k · ReLU(x − t_k), con nudos t_k equiespaciados. Es exactamente una red de
// una capa oculta con n neuronas ReLU y una salida lineal; los pesos salen de la interpolación lineal por tramos.
export const AX: [number, number] = [-3, 3];
export const target = (x: number) => 0.55 * Math.sin(1.35 * x) + 0.28 * Math.cos(2.9 * x + 0.5) + 0.15;
export interface Hinge { t: number; a: number }
export function hingesFor(n: number): { c: number; hinges: Hinge[] } {
  const hs: Hinge[] = [], h = (AX[1] - AX[0]) / n;
  let prev = 0;
  for (let k = 0; k < n; k++) {
    const t0 = AX[0] + k * h, slope = (target(t0 + h) - target(t0)) / h;
    hs.push({ t: t0, a: slope - prev }); prev = slope;
  }
  return { c: target(AX[0]), hinges: hs };
}
export const hingeEval = (m: { c: number; hinges: Hinge[] }, x: number) => m.hinges.reduce((s, q) => s + q.a * Math.max(0, x - q.t), m.c);
export function approxError(n: number): number {
  const m = hingesFor(n); let e = 0;
  for (let i = 0; i <= 600; i++) { const x = AX[0] + ((AX[1] - AX[0]) * i) / 600; e = Math.max(e, Math.abs(hingeEval(m, x) - target(x))); }
  return e;
}

// ── profundidad: la «sierra» de Telgarsky (composición de la función tienda) ──────────────────────────
// g(x) = 2·ReLU(x) − 4·ReLU(x − ½) sobre [0,1] (2 neuronas ReLU); g aplicada k veces tiene 2^k tramos rectos con 2k neuronas.
export const tent = (x: number) => 2 * Math.max(0, x) - 4 * Math.max(0, x - 0.5);
export const tentK = (x: number, k: number) => { let v = x; for (let i = 0; i < k; i++) v = tent(v); return v; };
