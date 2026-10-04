// Matemática y datos de la lección «La neurona artificial». Sin dibujo: todo es determinista.
//
// Datos (ilustrativos): 16 correos descritos por dos medidas ya escaladas a 0–1.
//   x1 = enlaces que trae el correo, x2 = confianza que inspira quien lo envía.
//   t = 1 (sospechoso, cruz) o 0 (legítimo, círculo).
// Se escribieron a mano para que los dos grupos se puedan separar con una recta (margen ≈ 0,12) y para que
// la neurona de partida (w₁ = 2, w₂ = −1,5, b = −0,5) se equivoque en cuatro. `verify-data.ts` (misma carpeta) lo recalcula:
// 3263 combinaciones de la rejilla de los controles aciertan las 16 marcas, el margen máximo es 0,121 y, desde (0; −1,4; 0,1)
// con η = 0,2, la regla del perceptrón converge en nueve pasos (y en cualquier otro orden de correcciones).

export interface Pt { x: number; y: number; t: 0 | 1 }

const RAW: [number, number, 0 | 1][] = [
  [0.42, 0.62, 0], [0.42, 0.24, 1], [0.86, 0.76, 0], [0.22, 0.04, 1],
  [0.10, 0.40, 0], [0.75, 0.38, 1], [0.94, 0.88, 0], [0.96, 0.54, 1],
  [0.30, 0.88, 0], [0.60, 0.20, 1], [0.68, 0.74, 0], [0.38, 0.10, 1],
  [0.18, 0.66, 0], [0.88, 0.45, 1], [0.55, 0.92, 0], [0.56, 0.06, 1],
];
export const DATA: Pt[] = RAW.map(([x, y, t]) => ({ x, y, t }));
export const N = DATA.length;

/** El correo de ejemplo del diagrama (también es un punto del plano). */
export const EX = { x1: 0.8, x2: 0.2 };
/** Pesos y sesgo del ejemplo (y valores iniciales de los controles). */
export const BASE = { w1: 2.0, w2: -1.5, b: -0.5 };

export type Params = { w1: number; w2: number; b: number };

export const zOf = (w1: number, w2: number, b: number, x1: number, x2: number) => w1 * x1 + w2 * x2 + b;
/** Escalón: 1 si z ≥ 0. */
export const fire = (z: number) => (z >= 0 ? 1 : 0);
export const sigm = (z: number) => 1 / (1 + Math.exp(-z));
/** Mezcla de escalón (a = 0) y sigmoide (a = 1) con pendiente k. */
export const act = (z: number, a: number, k = 1) => fire(z) * (1 - a) + sigm(k * z) * a;

export const wrongOf = (w1: number, w2: number, b: number): number[] =>
  DATA.flatMap((p, i) => (fire(zOf(w1, w2, b, p.x, p.y)) !== p.t ? [i] : []));
export const hitsOf = (w1: number, w2: number, b: number) => N - wrongOf(w1, w2, b).length;

/** Extremos de la recta w₁x₁ + w₂x₂ + b = 0 dentro de la caja [x0,x1]×[y0,y1]; null si no la cruza. */
export function chord(w1: number, w2: number, b: number, box: [number, number, number, number]): [[number, number], [number, number]] | null {
  const [x0, x1, y0, y1] = box, pts: [number, number][] = [], eps = 1e-9;
  if (Math.abs(w2) > eps) for (const x of [x0, x1]) { const y = -(w1 * x + b) / w2; if (y >= y0 - eps && y <= y1 + eps) pts.push([x, y]); }
  if (Math.abs(w1) > eps) for (const y of [y0, y1]) { const x = -(w2 * y + b) / w1; if (x >= x0 - eps && x <= x1 + eps) pts.push([x, y]); }
  if (pts.length < 2) return null;
  let best: [[number, number], [number, number]] = [pts[0], pts[1]], m = -1;
  for (const p of pts) for (const q of pts) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d > m) { m = d; best = [p, q]; } }
  return best;
}

// ── el perceptrón ──────────────────────────────────────────────────────────
export const ETA = 0.2;
export const P0: Params = { w1: 0, w2: -1.4, b: 0.1 };

export interface PercState extends Params {
  steps: number;
  /** último ejemplo usado: el barrido continúa a partir de él */
  last: number;
  /** aciertos tras cada paso (el primero es el inicial) */
  hist: number[];
  /** para animar el último paso */
  from?: Params; idx?: number; t0?: number;
}

export const newPerc = (): PercState => ({ ...P0, steps: 0, last: -1, hist: [hitsOf(P0.w1, P0.w2, P0.b)] });

/** Siguiente ejemplo mal clasificado, barriendo los datos en orden. -1 si ya no hay errores. */
export function nextIdx(p: Params & { last: number }): number {
  const wrong = wrongOf(p.w1, p.w2, p.b);
  if (!wrong.length) return -1;
  return wrong.find((i) => i > p.last) ?? wrong[0];
}

/** Un paso de la regla del perceptrón con el ejemplo idx. Devuelve false si ese ejemplo ya estaba bien. */
export function learn(p: PercState, idx: number, clock: number): boolean {
  const d = DATA[idx], y = fire(zOf(p.w1, p.w2, p.b, d.x, d.y)), e = d.t - y;
  if (e === 0) return false;
  p.from = { w1: p.w1, w2: p.w2, b: p.b };
  p.w1 += ETA * e * d.x; p.w2 += ETA * e * d.y; p.b += ETA * e;
  p.steps++; p.last = idx; p.idx = idx; p.t0 = clock;
  p.hist.push(hitsOf(p.w1, p.w2, p.b));
  return true;
}

/** Recorrido de referencia: el perceptrón entrenado hasta converger, y su primer paso. */
export const PERC_REF = (() => { const p = newPerc(); let g = 0; while (nextIdx(p) >= 0 && g++ < 300) learn(p, nextIdx(p), 0); return p; })();
export const PERC_STEP1 = (() => { const p = newPerc(); const idx = nextIdx(p); learn(p, idx, 0); return { idx, from: { ...P0 }, to: { w1: p.w1, w2: p.w2, b: p.b }, hits: p.hist[1] }; })();

/** Formato numérico con signo menos tipográfico. */
export const fmtN = (x: number, lang: 'es' | 'en', d = 2, plus = false) => {
  const s = Math.abs(x).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const neg = x < 0 && +Math.abs(x).toFixed(d) !== 0;
  return (neg ? '−' : plus ? '+' : '') + s;
};
