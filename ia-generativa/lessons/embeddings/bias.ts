// Medida de sesgo de género de la lección, calculada con los mismos vectores (measure-data.py la reproduce y la contrasta con «she»−«he» de GloVe completo).
//   puntaje(w) = media del coseno con F − media del coseno con M     (positivo = más cerca de lo femenino)
// «Quitar la dirección»: g = media(F) − media(M), longitud 1; a cada vector se le resta su componente en g y se renormaliza.
import { DIM, N, V, idOf } from './vectors';

export const FEM = ['woman', 'girl', 'mother', 'wife', 'sister', 'daughter'].map(idOf);
export const MAS = ['man', 'boy', 'father', 'husband', 'brother', 'son'].map(idOf);

const dotRows = (A: Float32Array, i: number, B: Float32Array, j: number) => { let s = 0; for (let k = 0; k < DIM; k++) s += A[i * DIM + k] * B[j * DIM + k]; return s; };
const scoreIn = (M: Float32Array, i: number) => FEM.reduce((s, f) => s + dotRows(M, i, M, f), 0) / FEM.length - MAS.reduce((s, m) => s + dotRows(M, i, M, m), 0) / MAS.length;

/** Puntaje de género de la palabra `i` con los vectores originales. */
export const genderScore = (i: number): number => scoreIn(V, i);

let debiased: Float32Array | null = null;
function debiasedVectors(): Float32Array {
  if (debiased) return debiased;
  const g = new Float32Array(DIM);
  for (const f of FEM) for (let k = 0; k < DIM; k++) g[k] += V[f * DIM + k] / FEM.length;
  for (const m of MAS) for (let k = 0; k < DIM; k++) g[k] -= V[m * DIM + k] / MAS.length;
  let n = 0; for (let k = 0; k < DIM; k++) n += g[k] * g[k]; n = Math.sqrt(n); for (let k = 0; k < DIM; k++) g[k] /= n;
  const out = new Float32Array(N * DIM);
  for (let i = 0; i < N; i++) {
    let c = 0; for (let k = 0; k < DIM; k++) c += V[i * DIM + k] * g[k];
    let s = 0; for (let k = 0; k < DIM; k++) { const x = V[i * DIM + k] - c * g[k]; out[i * DIM + k] = x; s += x * x; }
    s = 1 / Math.sqrt(s || 1); for (let k = 0; k < DIM; k++) out[i * DIM + k] *= s;
  }
  return (debiased = out);
}
/** Puntaje tras quitar la dirección de género (≈ 0 por construcción). */
export const debiasedScore = (i: number): number => scoreIn(debiasedVectors(), i);

export const OBJECTS = 'table tree river stone chair window door bottle apple banana car bus train bicycle mountain cloud rain sun moon star book pencil paper hammer bridge road'.split(' ');
