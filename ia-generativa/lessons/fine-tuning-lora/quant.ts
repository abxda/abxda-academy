// Cuantización de 4 bits tipo NF4 (Dettmers et al., 2023, §3) aplicada a la base diminuta: es la parte «Q» de QLoRA, a escala de juguete.
// Receta (la del artículo): 16 niveles = cuantiles de una normal estándar (asimétricos, con un cero exacto) normalizados a [-1, 1];
// cada bloque de 64 pesos se divide por su valor absoluto máximo y cada peso se guarda como el índice (4 bits) del nivel más cercano.
// Construcción de los niveles (como en bitsandbytes): 8 cuantiles positivos y 7 negativos de N(0,1) con desplazamiento 0,9677083, más el cero.
// Se comprobó contra la tabla NF4 publicada: coincide a 1e-7. Solo se cuantizan las matrices (W1, W2, W3); los sesgos quedan en precisión plena,
// como en QLoRA (que cuantiza las capas lineales). Aquí no hay «doble cuantización» ni optimizadores paginados: no hacen falta a este tamaño.
import { BASE } from './base';
import { copyParams, type Params } from './tinynet';

/** Función de distribución de la normal estándar (erfc por aproximación de Chebyshev, error < 1.2e-7). */
function cdf(x: number): number {
  const z = Math.abs(x) / Math.SQRT2, t = 2 / (2 + z), ty = 4 * t - 2;
  const cof = [-1.3026537197817094, 6.4196979235649026e-1, 1.9476473204185836e-2, -9.561514786808631e-3, -9.46595344482036e-4, 3.66839497852761e-4, 4.2523324806907e-5, -2.0278578112534e-5, -1.624290004647e-6, 1.303655835580e-6, 1.5626441722e-8, -8.5238095915e-8, 6.529054439e-9, 5.059343495e-9, -9.91364156e-10, -2.27365122e-10, 9.6467911e-11, 2.394038e-12, -6.886027e-12, 8.94487e-13, 3.13092e-13, -1.12708e-13, 3.81e-16, 7.106e-15, -1.523e-15, -9.4e-17, 1.21e-16, -2.8e-17];
  let d = 0, dd = 0;
  for (let j = cof.length - 1; j > 0; j--) { const tmp = d; d = ty * d - dd + cof[j]; dd = tmp; }
  const p = 0.5 * t * Math.exp(-z * z + 0.5 * (cof[0] + ty * d) - dd);
  return x >= 0 ? 1 - p : p;
}
/** Cuantil de la normal estándar (bisección sobre la cdf). */
function ppf(p: number): number { let lo = -10, hi = 10; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
const lin = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

/** Los 16 niveles de NF4, de menor a mayor. */
export const NF4: number[] = (() => {
  const offset = 0.9677083;
  const pos = lin(offset, 0.5, 9).slice(0, -1).map(ppf);
  const neg = lin(offset, 0.5, 8).slice(0, -1).map((p) => -ppf(p));
  const v = [...neg, 0, ...pos], mx = Math.max(...v.map(Math.abs));
  return v.map((x) => x / mx).sort((a, b) => a - b);
})();

/** Cuantiza y vuelve a decuantizar (lo que ve el cálculo): bloques de 64, escala = máximo absoluto del bloque. */
export function quantizeNF4(w: number[], block = 64): number[] {
  const out = new Array<number>(w.length);
  for (let s = 0; s < w.length; s += block) {
    const e = Math.min(w.length, s + block);
    let am = 1e-12; for (let i = s; i < e; i++) am = Math.max(am, Math.abs(w[i]));
    for (let i = s; i < e; i++) {
      const x = w[i] / am; let b = 0, bd = Infinity;
      for (let q = 0; q < NF4.length; q++) { const dq = Math.abs(x - NF4[q]); if (dq < bd) { bd = dq; b = q; } }
      out[i] = NF4[b] * am;
    }
  }
  return out;
}

/** La base diminuta con W1, W2 y W3 guardadas en 4 bits (decuantizadas para calcular). */
export const BASE_NF4: Params = (() => { const p = copyParams(BASE); p.W1 = quantizeNF4(p.W1); p.W2 = quantizeNF4(p.W2); p.W3 = quantizeNF4(p.W3); return p; })();
