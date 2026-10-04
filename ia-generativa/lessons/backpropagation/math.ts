// Matemática de la lección «Retropropagación»: una red 2-2-1 real, con todo calculado de verdad.
//
//   entradas x₁, x₂  →  ocultas h₁, h₂ (sigmoide)  →  salida ŷ (sigmoide);  pérdida L = ½(ŷ − t)²
//   pesos (sin sesgos, para que todo quepa en pantalla):
//     w₁: x₁→h₁   w₂: x₂→h₁   w₃: x₁→h₂   w₄: x₂→h₂   w₅: h₁→ŷ   w₆: h₂→ŷ
//
// Nada aquí es «ilustrativo»: la escena muestra exactamente lo que devuelven estas funciones.
// La comprobación independiente (diferencias finitas) está en numGrad().

export const X = [1.0, 0.5];
export const TARGET = 1.0;
/** Pesos de partida del ejemplo. Con ellos cada cuenta mostrada con tres decimales se puede repetir a mano, con las cifras ya redondeadas, sin discrepancias de redondeo (lo comprueba verify-data.ts). */
export const W0 = [0.6, -0.3, 0.7, 0.5, 0.8, -0.9];
export const W_MAX = 2.5;

export const sigma = (z: number) => 1 / (1 + Math.exp(-z));
export const clampW = (v: number) => Math.max(-W_MAX, Math.min(W_MAX, v));

export interface Fwd { z1: number; z2: number; a1: number; a2: number; z: number; y: number; L: number }
export interface Bwd {
  /** ∂L/∂ŷ = ŷ − t */
  eY: number;
  /** pendiente de la sigmoide de salida, ŷ(1 − ŷ) */
  spY: number;
  /** culpa de la neurona de salida, δ_y = ∂L/∂z */
  dY: number;
  /** pendientes de las sigmoides ocultas, aⱼ(1 − aⱼ) */
  sp1: number; sp2: number;
  /** culpa de cada neurona oculta, δⱼ = ∂L/∂zⱼ */
  d1: number; d2: number;
  /** gradiente de los seis pesos, ∂L/∂wₖ */
  g: number[];
}

export function forward(w: number[]): Fwd {
  const [w1, w2, w3, w4, w5, w6] = w;
  const z1 = w1 * X[0] + w2 * X[1], z2 = w3 * X[0] + w4 * X[1];
  const a1 = sigma(z1), a2 = sigma(z2);
  const z = w5 * a1 + w6 * a2, y = sigma(z);
  return { z1, z2, a1, a2, z, y, L: 0.5 * (y - TARGET) ** 2 };
}

export function backward(w: number[], f: Fwd = forward(w)): Bwd {
  const [, , , , w5, w6] = w;
  const eY = f.y - TARGET, spY = f.y * (1 - f.y), dY = eY * spY;
  const sp1 = f.a1 * (1 - f.a1), sp2 = f.a2 * (1 - f.a2);
  const d1 = dY * w5 * sp1, d2 = dY * w6 * sp2;
  const g = [d1 * X[0], d1 * X[1], d2 * X[0], d2 * X[1], dY * f.a1, dY * f.a2];
  return { eY, spY, dY, sp1, sp2, d1, d2, g };
}

/** Gradiente «por tanteo»: mueve el peso k un poco (eps) y repite el pase hacia delante. Un pase extra por peso. */
export function numGrad(w: number[], k: number, eps = 1e-4): number {
  const w2 = w.slice(); w2[k] += eps;
  return (forward(w2).L - forward(w).L) / eps;
}

/** Un paso de descenso del gradiente. */
export const stepW = (w: number[], g: number[], eta: number) => w.map((v, k) => clampW(v - eta * g[k]));

/** Etiquetas de los seis pesos: w₁…w₆. */
export const SUB = ['₁', '₂', '₃', '₄', '₅', '₆'];
export const wName = (k: number) => 'w' + SUB[k];

/** Aristas de drawNet para cada peso: [capa, origen, destino]. */
export const EDGE: [number, number, number][] = [[0, 0, 0], [0, 1, 0], [0, 0, 1], [0, 1, 1], [1, 0, 0], [1, 1, 0]];
/** Pesos en el formato de drawNet: weights[capa][origen][destino]. */
export const asNetWeights = (w: number[]) => [[[w[0], w[2]], [w[1], w[3]]], [[w[4]], [w[5]]]];
