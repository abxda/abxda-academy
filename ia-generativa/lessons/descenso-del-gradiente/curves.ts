// Las curvas de juguete de la lección y los caminos que recorre el descenso del gradiente sobre ellas.
// Todo es cálculo exacto (sin datos ni azar); verify-data.ts lo recalcula de forma independiente.

// ── 1 · la curva de error de un peso: L(w) = ½(w − 3)² + 1 (curvatura h = 1) ──
// Números elegidos para que se lean fácil: el mejor peso es 3 (error 1), se parte de −1 (error 9, pendiente −4)
// y, con tasa ½, cada paso recorre la mitad de lo que falta: −1 → 1 → 2 → 2.5 → 2.75 …
export const WS = 3, W0 = -1, LMIN = 1;
export const L = (w: number) => 0.5 * (w - WS) ** 2 + LMIN;
/** La pendiente (derivada) de L en w. */
export const dL = (w: number) => w - WS;
export const traj = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dL(a[i])); return a; };

/** Tasa de la demostración principal. */
export const ETA = 0.5;
export const MAIN = traj(W0, ETA, 8);
/** El «poquito» con que se mide la pendiente: una décima. */
export const NUDGE = 0.1;
/** Pesos de muestra con que se dibuja la curva: con −1, 9; con 0, 5.5; … */
export const SAMPLES = [-1, 0, 1, 2, 3, 4, 5, 6, 7];
/** Peso del otro lado del valle (pendiente +3) que se usa para mostrar una pendiente positiva. */
export const WR = 6;

// tasas de las cuatro demostraciones (todas desde −1) y cuántos pasos se muestran
export const DEMOS = {
  small: { eta: 0.05, n: 12 },
  osc: { eta: 1.7, n: 8 },
  div: { eta: 2.05, n: 4 },
  good: { eta: 0.8, n: 3 },   // se detiene al llegar (3 pasos), igual que el veredicto
} as const;
/** «Llegó al fondo»: a menos de esta distancia del mejor peso. */
export const TOL = 0.08;
/** Pasos que da el turno de la tasa cuando la persona la cambia. */
export const RUN_STEPS = 15;

export type Verdict = 'ok' | 'slow' | 'osc' | 'bounce' | 'div';
/** Qué le pasa al descenso con la tasa η (desde −1): llega en ≤ 10 pasos sin cruzar, lento, oscila, rebota sin acercarse o diverge. */
export function verdictOf(eta: number): { v: Verdict; k: number } {
  const e = Math.round(eta * 100) / 100;
  if (e > 2) return { v: 'div', k: -1 };
  if (e === 2) return { v: 'bounce', k: -1 };
  if (e > 1) return { v: 'osc', k: -1 };
  const p = traj(W0, e, 40), k = p.findIndex((w) => Math.abs(w - WS) < TOL);
  return k > 0 && k <= 10 ? { v: 'ok', k } : { v: 'slow', k };
}

// ── 2 · el paisaje de dos pesos: un cuenco alargado y girado (curvaturas 1 y 7) ──
export const C2: [number, number] = [1.2, -0.4], ANG = 0.5, H2: [number, number] = [1, 7];
const rot = (x: number, y: number) => { const dx = x - C2[0], dy = y - C2[1]; return [dx * Math.cos(ANG) + dy * Math.sin(ANG), -dx * Math.sin(ANG) + dy * Math.cos(ANG)]; };
export const L2 = (x: number, y: number) => { const [u, v] = rot(x, y); return 0.5 * (H2[0] * u * u + H2[1] * v * v); };
/** El gradiente de L2: las dos pendientes (una por peso). */
export const g2 = (x: number, y: number): [number, number] => {
  const [u, v] = rot(x, y), gu = H2[0] * u, gv = H2[1] * v;
  return [gu * Math.cos(ANG) - gv * Math.sin(ANG), gu * Math.sin(ANG) + gv * Math.cos(ANG)];
};
export const START2: [number, number] = [-1, 0], ETA2 = 0.2, STEPS2 = 16;
export const PATH2 = (() => { const a: [number, number][] = [START2]; for (let i = 0; i < STEPS2; i++) { const [x, y] = a[i], [gx, gy] = g2(x, y); a.push([x - ETA2 * gx, y - ETA2 * gy]); } return a; })();

// ── 3 · un paisaje irregular con dos valles: misma regla, otro punto de partida, otro valle ──
export const R = (w: number) => 0.08 * w ** 4 - 0.6 * w ** 2 + 0.25 * w + 2.0;
export const dR = (w: number) => 0.32 * w ** 3 - 1.2 * w + 0.25;
const rpath = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dR(a[i])); return a; };
export const RSTEPS = 40, RETA = 0.12;
export const PATH_A = rpath(-0.9, RETA, RSTEPS), PATH_B = rpath(0.9, RETA, RSTEPS);
