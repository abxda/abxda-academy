// Simulación REAL de la lección «Entrenar bien»: un modelo de juguete con DOS pesos (x, y) y N = 256 ejemplos, y los
// optimizadores SGD, SGD con momento y Adam implementados tal cual (sin atajos). Todo es analítico y determinista: los
// lotes salen de barajar con un generador con semilla (sin Math.random).
//
// El modelo de juguete (lo único «inventado» es la forma del paisaje; el entrenamiento sobre él es de verdad):
//   en las coordenadas del valle (u a lo largo del fondo, v a través de las paredes) cada ejemplo i tiene su propio error
//        ℓᵢ(u,v) = ½·H1·(u − aᵢ)² + ½·H2·(v − bᵢ)² + ¼·c·(v − bᵢ)⁴
//   es decir, «prefiere» los pesos (aᵢ, bᵢ). Los 256 puntos preferidos son 128 pares simétricos (aᵢ,bᵢ) y (−aᵢ,−bᵢ), de modo que
//   su media y su tercer momento son exactamente cero. El error total (el promedio de los 256 errores) es entonces, salvo una
//   constante,
//        L(u,v) = ½·H1·u² + ½·(H2 + 3c·m₂)·v² + ¼·c·v⁴        con m₂ = promedio de bᵢ²,
//   con el mínimo exacto en (0, 0). El gradiente de un lote es el promedio de los gradientes de SUS ejemplos: exactamente
//   lo que calcularía SGD. El término de cuarto grado hace que las paredes se empinen al alejarse del fondo (como en una red
//   recién iniciada, donde la superficie es mucho más empinada al principio): sirve para mostrar por qué existe el calentamiento.
//   La rotación ANG gira el valle respecto a los dos pesos (x, y), que son los ejes de la pantalla.
import { gauss, rng } from '../../../../../core/scene/math';

export type V2 = [number, number];

export const N = 256;                        // ejemplos de entrenamiento
export const ANG = 0.12;                     // giro del valle respecto a los ejes de los pesos (rad)
export const SIG_A = 0.5, SIG_B = 0.45;      // dispersión de los puntos preferidos de los ejemplos

/** Paisaje: curvatura a lo largo del fondo (H1), curvatura de las paredes (H2) y empinamiento extra de las paredes (c). */
export interface Land { H1: number; H2: number; c: number }
export const BOWL: Land = { H1: 2.2, H2: 4.5, c: 0 };         // cuenco casi redondo (fase de los lotes)
export const CANYON: Land = { H1: 0.3, H2: 6, c: 15 };        // cañón: empinado a los lados, casi plano a lo largo

const ca = Math.cos(ANG), sa = Math.sin(ANG);
export function toUV(x: number, y: number): V2 { return [x * ca + y * sa, -x * sa + y * ca]; }
export function toXY(u: number, v: number): V2 { return [u * ca - v * sa, u * sa + v * ca]; }
export const START_BOWL: V2 = toXY(-2.3, 1.2);
export const START_NEAR: V2 = toXY(-2.5, 0.55);     // cañón: punto de partida cerca del fondo (comparar optimizadores)
export const START_HIGH: V2 = toXY(-2.5, 1.3);      // cañón: punto de partida alto en la pared (donde la superficie es más empinada)
export const startOf = (L: Land): V2 => (L.c > 0 ? START_NEAR : START_BOWL);

// ── los N ejemplos: 128 pares simétricos ───────────────────────────────────
export const EX: { a: number; b: number }[] = (() => {
  const r = rng(20150), out: { a: number; b: number }[] = [];
  for (let i = 0; i < N / 2; i++) { const a = SIG_A * gauss(r), b = SIG_B * gauss(r); out.push({ a, b }, { a: -a, b: -b }); }
  // se baraja para que los pares no queden contiguos (los lotes toman trozos consecutivos de una permutación, pero esto
  // además hace que la nube dibujada no dependa del orden)
  const s = rng(77); for (let i = N - 1; i > 0; i--) { const j = Math.floor(s() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
})();
export const M2B = EX.reduce((s, e) => s + e.b * e.b, 0) / N;      // promedio de bᵢ²

/** Curvatura efectiva de las paredes en el error total. */
export const h2eff = (L: Land) => L.H2 + 3 * L.c * M2B;

/** Error total (promedio sobre los N ejemplos, sin la constante). */
export function loss(L: Land, x: number, y: number): number {
  const [u, v] = toUV(x, y);
  return 0.5 * L.H1 * u * u + 0.5 * h2eff(L) * v * v + 0.25 * L.c * v ** 4;
}

/** Gradiente de un conjunto de ejemplos en (x,y): el promedio de sus gradientes. `idx` ausente = los N ejemplos. */
export function grad(L: Land, x: number, y: number, idx?: ArrayLike<number>, lo = 0, hi = idx ? idx.length : N): V2 {
  const [u, v] = toUV(x, y);
  let ma = 0, m1 = 0, m2 = 0, m3 = 0, n = 0;
  if (!idx) { m2 = M2B; n = N; }
  else {
    for (let k = lo; k < hi; k++) { const e = EX[idx[k]]; ma += e.a; m1 += e.b; m2 += e.b * e.b; m3 += e.b * e.b * e.b; n++; }
    ma /= n; m1 /= n; m2 /= n; m3 /= n;
  }
  const gu = L.H1 * (u - ma), gv = L.H2 * (v - m1) + L.c * (v * v * v - 3 * v * v * m1 + 3 * v * m2 - m3);
  return [gu * ca - gv * sa, gu * sa + gv * ca];
}

/** Gradiente de UN ejemplo. */
export const gradOne = (L: Land, x: number, y: number, i: number): V2 => grad(L, x, y, [i]);

/** Centro de los ejemplos de un lote en el plano de los pesos (lo que «cree» el lote que es el fondo). */
export function batchCenter(idx: ArrayLike<number>, lo: number, hi: number): V2 {
  let ma = 0, m1 = 0; for (let k = lo; k < hi; k++) { ma += EX[idx[k]].a; m1 += EX[idx[k]].b; }
  const n = Math.max(1, hi - lo); return toXY(ma / n, m1 / n);
}
/** Posición en el plano de los pesos de los puntos preferidos de cada ejemplo. */
export const exPos = (i: number): V2 => toXY(EX[i].a, EX[i].b);

// ── lotes y épocas ────────────────────────────────────────────────────────
/** Permutación de 0..N−1 con semilla (Fisher–Yates). */
export function perm(seed: number): Int16Array {
  const r = rng(seed), p = new Int16Array(N); for (let i = 0; i < N; i++) p[i] = i;
  for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  return p;
}

/** Fuente de lotes: baraja al empezar cada época y reparte en trozos consecutivos de tamaño B. */
export function batchStream(B: number, seed: number) {
  let epoch = -1, p = perm(seed), pos = N;   // pos = N fuerza el primer barajado
  return {
    next(): { idx: Int16Array; lo: number; hi: number; epoch: number } {
      if (pos >= N) { epoch++; p = perm(seed * 7919 + epoch * 104729 + 13); pos = 0; }
      const lo = pos, hi = Math.min(N, pos + B); pos = hi;
      return { idx: p, lo, hi, epoch };
    },
  };
}

// ── optimizadores ─────────────────────────────────────────────────────────
export type Opt = 'sgd' | 'mom' | 'adam';
export const BETA = 0.9;                                  // momento (Polyak)
export const B1 = 0.9, B2 = 0.999, EPS = 1e-8;            // Adam: valores por defecto de Kingma y Ba (2015)
export const BIG = 60;                                    // tope de lo que se dibuja del error (más allá es «diverge»)
export const LIM = 12;                                    // si un peso sale de ±LIM se considera divergido

/** Calendario de la tasa. null = constante. `warm` pasos de subida lineal; `decay` = coseno hasta `floor`·η al paso `total`. */
export interface Sched { warm: number; decay: boolean; total: number; floor: number }
export function etaAt(eta: number, t: number, s: Sched | null): number {
  if (!s) return eta;
  const lr = s.warm > 0 && t < s.warm ? eta * ((t + 1) / s.warm) : eta;
  if (!s.decay) return lr;
  const k = Math.min(1, Math.max(0, (t - s.warm) / Math.max(1, s.total - s.warm)));
  return lr * (s.floor + (1 - s.floor) * 0.5 * (1 + Math.cos(Math.PI * k)));
}

export interface Run {
  opt: Opt; B: number; eta: number; pts: V2[]; loss: number[]; etas: number[];
  /** Paso en que el error cae por debajo de `thr` (−1 si nunca). */
  hit: number;
  /** Paso en el que se salió de los límites (−1 si no divergió). */
  divAt: number;
  steps: number;
  /** Centro de cada lote (para dibujarlo). */
  centers: V2[];
}

/** Entrena `steps` pasos desde `start` con el optimizador `opt`. Mismos lotes para la misma (B, seed). */
export function train(L: Land, opt: Opt, eta: number, B: number, seed: number, steps: number, o: { start?: V2; sched?: Sched | null; full?: boolean; thr?: number } = {}): Run {
  const start = o.start ?? startOf(L), stream = batchStream(B, seed), thr = o.thr ?? 0.05;
  let x = start[0], y = start[1], vx = 0, vy = 0, mx = 0, my = 0, sx = 0, sy = 0, divAt = -1, hit = -1;
  const pts: V2[] = [[x, y]], ls = [Math.min(BIG, loss(L, x, y))], etas: number[] = [], centers: V2[] = [];
  if (ls[0] < thr) hit = 0;
  for (let t = 0; t < steps; t++) {
    let g: V2;
    if (o.full) { g = grad(L, x, y); centers.push([0, 0]); }
    else { const b = stream.next(); g = grad(L, x, y, b.idx, b.lo, b.hi); centers.push(batchCenter(b.idx, b.lo, b.hi)); }
    const lr = etaAt(eta, t, o.sched ?? null); etas.push(lr);
    if (opt === 'sgd') { x -= lr * g[0]; y -= lr * g[1]; }
    else if (opt === 'mom') { vx = BETA * vx + g[0]; vy = BETA * vy + g[1]; x -= lr * vx; y -= lr * vy; }
    else {
      mx = B1 * mx + (1 - B1) * g[0]; my = B1 * my + (1 - B1) * g[1];
      sx = B2 * sx + (1 - B2) * g[0] * g[0]; sy = B2 * sy + (1 - B2) * g[1] * g[1];
      const c1 = 1 - Math.pow(B1, t + 1), c2 = 1 - Math.pow(B2, t + 1);
      x -= (lr * (mx / c1)) / (Math.sqrt(sx / c2) + EPS); y -= (lr * (my / c1)) / (Math.sqrt(sy / c2) + EPS);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > LIM || Math.abs(y) > LIM) {
      divAt = t + 1;
      x = Math.max(-LIM, Math.min(LIM, Number.isFinite(x) ? x : LIM)); y = Math.max(-LIM, Math.min(LIM, Number.isFinite(y) ? y : LIM));
      pts.push([x, y]); ls.push(BIG);
      for (let k = t + 1; k < steps; k++) { pts.push([x, y]); ls.push(BIG); etas.push(lr); centers.push(centers[centers.length - 1]); }
      break;
    }
    pts.push([x, y]); const l = loss(L, x, y); ls.push(Math.min(BIG, l));
    if (hit < 0 && l < thr) hit = t + 1;
  }
  return { opt, B: o.full ? N : Math.min(B, N), eta, pts, loss: ls, etas, hit, divAt, steps, centers };
}

/** Estado de un optimizador que avanza paso a paso (para código y para comprobar `train`). */
export function nextStepVector(opt: Opt, g: V2, st: { vx: number; vy: number; mx: number; my: number; sx: number; sy: number; t: number }, lr: number): V2 {
  if (opt === 'sgd') return [lr * g[0], lr * g[1]];
  if (opt === 'mom') { st.vx = BETA * st.vx + g[0]; st.vy = BETA * st.vy + g[1]; return [lr * st.vx, lr * st.vy]; }
  st.mx = B1 * st.mx + (1 - B1) * g[0]; st.my = B1 * st.my + (1 - B1) * g[1];
  st.sx = B2 * st.sx + (1 - B2) * g[0] * g[0]; st.sy = B2 * st.sy + (1 - B2) * g[1] * g[1];
  const c1 = 1 - Math.pow(B1, st.t + 1), c2 = 1 - Math.pow(B2, st.t + 1); st.t++;
  return [(lr * (st.mx / c1)) / (Math.sqrt(st.sx / c2) + EPS), (lr * (st.my / c1)) / (Math.sqrt(st.sy / c2) + EPS)];
}

// ── orden de los ejemplos en cada época (para dibujar qué ejemplos usa cada lote) ─────────────
const orderCache = new Map<string, { perm: Int16Array; pos: Int16Array }>();
/** Orden en que `batchStream(B, seed)` recorre los ejemplos en la época e, y la posición de cada ejemplo en ese orden. */
export function epochOrder(seed: number, e: number): { perm: Int16Array; pos: Int16Array } {
  const key = `${seed},${e}`; let r = orderCache.get(key);
  if (!r) { const p = perm(seed * 7919 + e * 104729 + 13), pos = new Int16Array(N); for (let i = 0; i < N; i++) pos[p[i]] = i; r = { perm: p, pos }; orderCache.set(key, r); }
  return r;
}

// ── memoria de corridas (son funciones puras: misma entrada, misma salida) ─────────────────
const cache = new Map<string, Run>();
export function cachedTrain(L: Land, opt: Opt, eta: number, B: number, seed: number, steps: number, o: { start?: V2; sched?: Sched | null; full?: boolean; thr?: number } = {}): Run {
  const s = o.sched ? `${o.sched.warm},${o.sched.decay ? 1 : 0},${o.sched.total},${o.sched.floor}` : '-';
  const key = `${L.H1},${L.H2},${L.c}|${opt}|${eta}|${B}|${seed}|${steps}|${s}|${o.full ? 1 : 0}|${o.thr ?? ''}|${o.start ? o.start.join(',') : ''}`;
  let r = cache.get(key);
  if (!r) { r = train(L, opt, eta, B, seed, steps, o); if (cache.size > 400) cache.clear(); cache.set(key, r); }
  return r;
}
