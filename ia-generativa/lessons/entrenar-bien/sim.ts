// Simulación REAL de la lección «Entrenar bien»: un paisaje de error 2D analítico (valle alargado, girado y curvo)
// construido a partir de N ejemplos, y los optimizadores SGD, SGD con momento y Adam implementados tal cual.
//
// El modelo de juguete:
//   cada ejemplo i tiene su propio error  ℓᵢ(u,v) = ½·H1·(u − aᵢ)² + ½·H2·(v − κu² − bᵢ)²
//   en las coordenadas del valle (u a lo largo del fondo, v a través de las paredes).
//   Los «puntos preferidos» (aᵢ, bᵢ) se generan con una semilla fija y se centran (media exacta cero), de modo que
//   el error total (el promedio de los N errores) es, salvo una constante,
//        L(u,v) = ½·H1·u² + ½·H2·(v − κu²)²        (mínimo en u = v = 0, valor 0)
//   El gradiente de un lote es el promedio de los gradientes de sus ejemplos: es exactamente lo que haría SGD.
//   Todo es determinista: los lotes salen de barajar con un generador con semilla (sin Math.random).
import { gauss, rng } from '../../../../../core/scene/math';

export type V2 = [number, number];

export const N = 256;                       // ejemplos de entrenamiento
export const ANG = 0.4;                     // giro del valle respecto a los ejes de la pantalla (rad)
export const C: V2 = [0.5, -0.15];          // posición del mínimo en el plano de los pesos (w₁, w₂)
export const H1 = 1;                        // curvatura a lo largo del fondo del valle (suave)
export const H2 = 12;                       // curvatura a través de las paredes (empinada)
export const KAPPA = 0.15;                 // cuánto se curva el fondo
export const SIG_A = 0.5, SIG_B = 0.6;      // dispersión de los puntos preferidos de los ejemplos

const ca = Math.cos(ANG), sa = Math.sin(ANG);
export function toUV(x: number, y: number): V2 { const dx = x - C[0], dy = y - C[1]; return [dx * ca + dy * sa, -dx * sa + dy * ca]; }
export function toXY(u: number, v: number): V2 { return [C[0] + u * ca - v * sa, C[1] + u * sa + v * ca]; }
export const START: V2 = toXY(-2.3, KAPPA * 2.3 * 2.3 + 0.9);   // punto de partida (en la ladera, lejos del fondo)

// ── los N ejemplos ────────────────────────────────────────────────────────
export const EX: { a: number; b: number }[] = (() => {
  const r = rng(20150), raw = Array.from({ length: N }, () => ({ a: SIG_A * gauss(r), b: SIG_B * gauss(r) }));
  const ma = raw.reduce((s, e) => s + e.a, 0) / N, mb = raw.reduce((s, e) => s + e.b, 0) / N;
  return raw.map((e) => ({ a: e.a - ma, b: e.b - mb }));
})();

/** Error total (promedio sobre todos los ejemplos, sin la constante). */
export function loss(x: number, y: number): number {
  const [u, v] = toUV(x, y), w = v - KAPPA * u * u;
  return 0.5 * H1 * u * u + 0.5 * H2 * w * w;
}

/** Gradiente de un conjunto de ejemplos (índices) en (x,y): el promedio de sus gradientes. `idx` vacío = todos. */
export function grad(x: number, y: number, idx?: ArrayLike<number>, lo = 0, hi = idx ? idx.length : N): V2 {
  const [u, v] = toUV(x, y);
  let sa_ = 0, sb = 0, n = 0;
  if (!idx) { for (let i = 0; i < N; i++) { sa_ += EX[i].a; sb += EX[i].b; } n = N; }
  else for (let k = lo; k < hi; k++) { const e = EX[idx[k]]; sa_ += e.a; sb += e.b; n++; }
  const ma = sa_ / n, mb = sb / n, w = v - KAPPA * u * u - mb;
  const gu = H1 * (u - ma) - 2 * KAPPA * u * H2 * w, gv = H2 * w;
  return [gu * ca - gv * sa, gu * sa + gv * ca];
}

/** Gradiente de UN ejemplo. */
export function gradOne(x: number, y: number, i: number): V2 { return grad(x, y, [i]); }

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

export interface Run { opt: Opt; pts: V2[]; loss: number[]; diverged: boolean; steps: number; examples: number }

/** Aplicación de η(t): horario de la tasa. `sched` = null → constante. */
export interface Sched { warm: number; decay: boolean; total: number; floor: number }
export function etaAt(eta: number, t: number, s: Sched | null): number {
  if (!s) return eta;
  const lr = s.warm > 0 && t < s.warm ? eta * ((t + 1) / s.warm) : eta;
  if (!s.decay) return lr;
  const k = Math.min(1, Math.max(0, (t - s.warm) / Math.max(1, s.total - s.warm)));
  return lr * (s.floor + (1 - s.floor) * 0.5 * (1 + Math.cos(Math.PI * k)));
}

/** Entrena `steps` pasos desde `start` con el optimizador `opt`. Mismos lotes para la misma (B, seed). */
export function train(opt: Opt, eta: number, B: number, seed: number, steps: number, o: { start?: V2; sched?: Sched | null; full?: boolean } = {}): Run {
  const start = o.start ?? START, stream = batchStream(B, seed);
  let x = start[0], y = start[1], vx = 0, vy = 0, mx = 0, my = 0, sx = 0, sy = 0, diverged = false;
  const pts: V2[] = [[x, y]], ls = [loss(x, y)];
  for (let t = 0; t < steps; t++) {
    let g: V2;
    if (o.full) g = grad(x, y);
    else { const b = stream.next(); g = grad(x, y, b.idx, b.lo, b.hi); }
    const lr = etaAt(eta, t, o.sched ?? null);
    if (opt === 'sgd') { x -= lr * g[0]; y -= lr * g[1]; }
    else if (opt === 'mom') { vx = BETA * vx + g[0]; vy = BETA * vy + g[1]; x -= lr * vx; y -= lr * vy; }
    else {
      mx = B1 * mx + (1 - B1) * g[0]; my = B1 * my + (1 - B1) * g[1];
      sx = B2 * sx + (1 - B2) * g[0] * g[0]; sy = B2 * sy + (1 - B2) * g[1] * g[1];
      const c1 = 1 - Math.pow(B1, t + 1), c2 = 1 - Math.pow(B2, t + 1);
      x -= (lr * (mx / c1)) / (Math.sqrt(sx / c2) + EPS); y -= (lr * (my / c1)) / (Math.sqrt(sy / c2) + EPS);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 40 || Math.abs(y) > 40) { diverged = true; x = Math.max(-40, Math.min(40, Number.isFinite(x) ? x : 40)); y = Math.max(-40, Math.min(40, Number.isFinite(y) ? y : 40)); }
    pts.push([x, y]); ls.push(loss(x, y));
    if (diverged) { for (let k = t + 1; k < steps; k++) { pts.push([x, y]); ls.push(loss(x, y)); } break; }
  }
  return { opt, pts, loss: ls, diverged, steps, examples: steps * (o.full ? N : Math.min(B, N)) };
}
