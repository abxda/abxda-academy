// La nube de la primera parte: cada dígito medido con DOS números, la tinta de su mitad de arriba (filas 1–4) y la de su mitad
// de abajo (filas 5–8). Cada píxel vale de 0 (vacío) a 1 (lleno), así que cada medida va de 0 a 32. Se calcula aquí, al cargar,
// a partir de las mismas 1797 imágenes de latent.json (dígitos UCI, CC BY 4.0). Nada es ilustrativo salvo lo que se rotula.
// Los óvalos son una gaussiana 2D ajustada por máxima verosimilitud a los 179 sietes; la frontera es la del análisis
// discriminante lineal entre seises y sietes (covarianza promedio). Los puntos «nuevos» se sacan de esa gaussiana (rng fijo).
import { gauss, rng } from '../../../../../theme/kit';
import { IMGS, LAB, N_ALL } from './latent';

export type P2 = [number, number];
export const TOP = new Float64Array(N_ALL), BOT = new Float64Array(N_ALL);
for (let i = 0; i < N_ALL; i++) {
  let a = 0, b = 0;
  for (let j = 0; j < 32; j++) a += IMGS[i * 64 + j];
  for (let j = 32; j < 64; j++) b += IMGS[i * 64 + j];
  TOP[i] = a; BOT[i] = b;
}
/** Tinta de cada fila (para contar «fila por fila» en la escena). */
export const rowInk = (i: number, r: number) => { let s = 0; for (let c = 0; c < 8; c++) s += IMGS[i * 64 + r * 8 + c]; return s; };

const idxOf = (d: number) => { const o: number[] = []; for (let i = 0; i < N_ALL; i++) if (LAB[i] === d) o.push(i); return o; };
export const SEVENS = idxOf(7), SIXES = idxOf(6);          // 179 y 181 imágenes

export interface Gauss2 { mu: P2; cov: [number, number, number]; L: [number, number, number] }   // cov = [sxx, sxy, syy]; L = Cholesky [l11, l21, l22]
function fit(ids: number[]): Gauss2 {
  const n = ids.length; let mx = 0, my = 0;
  for (const i of ids) { mx += TOP[i]; my += BOT[i]; }
  mx /= n; my /= n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const i of ids) { const a = TOP[i] - mx, b = BOT[i] - my; sxx += a * a; sxy += a * b; syy += b * b; }
  sxx /= n; sxy /= n; syy /= n;                            // máxima verosimilitud: divide entre N
  const l11 = Math.sqrt(sxx), l21 = sxy / l11, l22 = Math.sqrt(Math.max(1e-9, syy - l21 * l21));
  return { mu: [mx, my], cov: [sxx, sxy, syy], L: [l11, l21, l22] };
}
export const G7 = fit(SEVENS), G6 = fit(SIXES);

/** Contorno de la gaussiana a distancia de Mahalanobis k (k = 1: óvalo pequeño; k = 2: grande). */
export function oval(g: Gauss2, k: number, n = 72): P2[] {
  const [l11, l21, l22] = g.L;
  return Array.from({ length: n + 1 }, (_, i) => { const t = (i / n) * Math.PI * 2, a = k * Math.cos(t), b = k * Math.sin(t); return [g.mu[0] + l11 * a, g.mu[1] + l21 * a + l22 * b] as P2; });
}
/** Punto de la gaussiana para un ε dado (muestrear = μ + L·ε). */
export const fromEps = (g: Gauss2, e: P2): P2 => [g.mu[0] + g.L[0] * e[0], g.mu[1] + g.L[1] * e[0] + g.L[2] * e[1]];

/** Puntos nuevos de la nube de los sietes: los primeros los saca la escena sola; los demás, la persona con el botón. */
export const NEW7: P2[] = (() => { const r = rng(17); return Array.from({ length: 240 }, () => fromEps(G7, [gauss(r), gauss(r)])); })();

// frontera del análisis discriminante lineal: w·m = c
export const LDA = (() => {
  const sxx = (G6.cov[0] + G7.cov[0]) / 2, sxy = (G6.cov[1] + G7.cov[1]) / 2, syy = (G6.cov[2] + G7.cov[2]) / 2, det = sxx * syy - sxy * sxy;
  const dx = G7.mu[0] - G6.mu[0], dy = G7.mu[1] - G6.mu[1];
  const w: P2 = [(syy * dx - sxy * dy) / det, (-sxy * dx + sxx * dy) / det];
  const c = w[0] * (G6.mu[0] + G7.mu[0]) / 2 + w[1] * (G6.mu[1] + G7.mu[1]) / 2;
  let ok = 0;
  for (const i of SEVENS) if (w[0] * TOP[i] + w[1] * BOT[i] > c) ok++;
  for (const i of SIXES) if (w[0] * TOP[i] + w[1] * BOT[i] <= c) ok++;
  return { w, c, acc: ok / (SEVENS.length + SIXES.length) };
})();
