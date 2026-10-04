// Mundo de juguete de la lección «De modelo base a asistente». Todo el cálculo es REAL (probabilidad, regresión logística,
// óptimo con penalización KL, DPO); lo ilustrativo son los números de partida, rotulados como supuestos en la escena.
//
// Una respuesta se describe con cuatro rasgos binarios (rasgos asignados a mano a cada respuesta):
//   φ = (correcta, larga, amable, complaciente)   «complaciente» = le da la razón a la persona aunque no la tenga.
// El modelo de partida (SFT) los combina al azar con probabilidades Q_REF (supuesto): 2⁴ = 16 estilos de respuesta posibles.
//
//  · Modelo de recompensa (RM): r(y) = w·φ(y). Se ajusta con la pérdida de Bradley–Terry (regresión logística sobre las diferencias
//    de rasgos entre la respuesta preferida y la rechazada), con una pequeña regularización L2.
//  · Optimización con penalización KL (RLHF): el óptimo exacto de  max E[r] − β·KL(π ‖ π_ref)  es  π(y) ∝ π_ref(y)·exp(r(y)/β)
//    (Rafailov et al., 2023, ec. 4). Como los rasgos son independientes en π_ref, el óptimo conserva esa independencia y sus marginales son
//    m_j = σ(logit q_j + w_j/β). Aquí se calcula en forma cerrada; en la práctica se aproxima con PPO.
//  · DPO: se ajusta una política de la misma familia (π_δ ∝ π_ref·exp(δ·φ)) con la pérdida DPO, calculada con log-probabilidades
//    explícitas de los 16 estilos y su normalización. Resultado: β·δ coincide con los pesos w del RM (equivalencia de DPO).

export const TRAITS = ['ok', 'long', 'warm', 'agree'] as const;
export type Phi = [number, number, number, number];

/** Modelo de partida: probabilidad de que una respuesta tenga cada rasgo (supuesto ilustrativo). */
export const Q_REF = [0.5, 0.3, 0.4, 0.2];
/** RM de juguete con dos sesgos documentados (prefiere lo largo y lo que da la razón); pesos ilustrativos. */
export const W_BIAS = [2.2, 0.5, 0.3, 0.45];
/** Calidad real (la que mediría un panel cuidadoso): premia lo correcto, castiga relleno y complacencia. Ilustrativa. */
export const G_GOLD = [3.0, -1.2, 0.3, -2.6];

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const logit = (q: number) => Math.log(q / (1 - q));
export const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

// ── óptimo con penalización KL: marginales, esperanzas y distancia ───────────────────────────────
/** Marginales del óptimo π ∝ π_ref·exp(p·w·φ), con p = 1/β. */
export const tilt = (p: number, w: number[] = W_BIAS): number[] => Q_REF.map((q, j) => sigmoid(logit(q) + p * w[j]));
export const expect = (v: number[], m: number[]) => dot(v, m);
/** KL(π ‖ π_ref) en nats (suma de las KL de cada rasgo, por independencia). */
export function klOf(m: number[]): number {
  return m.reduce((s, x, j) => { const q = Q_REF[j], a = Math.min(1 - 1e-12, Math.max(1e-12, x)); return s + a * Math.log(a / q) + (1 - a) * Math.log((1 - a) / (1 - q)); }, 0);
}
/** Mejora respecto al modelo de partida: del RM (proxy) y de la calidad real (gold). */
export function gains(p: number) {
  const m = tilt(p), m0 = Q_REF;
  return { m, kl: klOf(m), proxy: expect(W_BIAS, m) - expect(W_BIAS, m0), gold: expect(G_GOLD, m) - expect(G_GOLD, m0) };
}
/** Presión (1/β) que corresponde a la posición s∈[0,1] del control: sube despacio al principio y rápido al final. */
export const pressure = (s: number) => 8 * (Math.exp(3 * s) - 1) / (Math.exp(3) - 1);
/** Presión con la mayor calidad real, y su calidad (búsqueda fina, determinista). */
export const BEST = (() => { let bp = 0, bg = -1e9; for (let i = 0; i <= 8000; i++) { const p = i / 1000, g = gains(p).gold; if (g > bg) { bg = g; bp = p; } } return { p: bp, gold: bg }; })();
export const CURVE = Array.from({ length: 161 }, (_, i) => { const p = (i / 160) * 8, g = gains(p); return { p, ...g }; });

// ── el modelo de recompensa aprendido de las elecciones de la persona ────────────────────────────
/** Ajusta w por máxima verosimilitud de Bradley–Terry con L2: minimiza Σ −log σ(w·Δ) + (λ/2)|w|². Δ = φ(elegida) − φ(rechazada). */
export function fitRM(deltas: Phi[], lambda = 0.1, iters = 400, lr = 0.5): number[] {
  const w = [0, 0, 0, 0];
  for (let t = 0; t < iters; t++) {
    const g = w.map((wj) => lambda * wj);
    for (const d of deltas) { const c = -(1 - sigmoid(dot(w, d))); for (let j = 0; j < 4; j++) g[j] += c * d[j]; }
    for (let j = 0; j < 4; j++) w[j] -= lr * g[j];
  }
  return w;
}
/** Pérdida de Bradley–Terry media de un conjunto de preferencias. */
export const btLoss = (w: number[], deltas: Phi[]) => (deltas.length ? deltas.reduce((s, d) => s - Math.log(sigmoid(dot(w, d))), 0) / deltas.length : Math.LN2);

// ── DPO sobre la misma familia de políticas ──────────────────────────────────────────────────────
const STYLES: Phi[] = Array.from({ length: 16 }, (_, k) => [(k >> 3) & 1, (k >> 2) & 1, (k >> 1) & 1, k & 1] as Phi);
const logRef = (s: Phi) => s.reduce((a, v, j) => a + (v ? Math.log(Q_REF[j]) : Math.log(1 - Q_REF[j])), 0);
/** log Z(δ) = log Σ_s π_ref(s)·exp(δ·φ(s)): la normalización explícita sobre los 16 estilos. */
const logZ = (delta: number[]) => Math.log(STYLES.reduce((a, t) => a + Math.exp(logRef(t) + dot(delta, t)), 0));
/** log π_δ(s). */
const logPi = (delta: number[], s: Phi, lz = logZ(delta)) => logRef(s) + dot(delta, s) - lz;
/** Pérdida DPO (Rafailov et al., ec. 7) + L2 sobre δ equivalente a la del RM: (λ/2)·β²·|δ|². */
export function dpoLoss(delta: number[], pairs: { w: Phi; l: Phi }[], beta: number, lambda: number): number {
  const lz = logZ(delta);
  let L = 0;
  for (const { w, l } of pairs) {
    const margin = beta * ((logPi(delta, w, lz) - logRef(w)) - (logPi(delta, l, lz) - logRef(l)));
    L += -Math.log(sigmoid(margin));
  }
  return L + 0.5 * lambda * beta * beta * dot(delta, delta);
}
/** Descenso del gradiente (gradiente por diferencias finitas, sobre la pérdida DPO explícita). Devuelve δ. */
export function fitDPO(pairs: { w: Phi; l: Phi }[], beta = 1, lambda = 0.1, iters = 220, lr = 1.0): number[] {
  const delta = [0, 0, 0, 0], h = 1e-5;
  for (let t = 0; t < iters; t++) {
    const g = delta.map((_, j) => { const a = delta.slice(), b = delta.slice(); a[j] += h; b[j] -= h; return (dpoLoss(a, pairs, beta, lambda) - dpoLoss(b, pairs, beta, lambda)) / (2 * h); });
    for (let j = 0; j < 4; j++) delta[j] -= (lr / (beta * beta)) * g[j];
  }
  return delta;
}
/** Probabilidad de un estilo bajo la política δ y bajo la de partida. */
export const probOf = (delta: number[], s: Phi) => Math.exp(logPi(delta, s));
export const probRef = (s: Phi) => Math.exp(logRef(s));
/** Marginales de la política π_δ (probabilidad de cada rasgo). */
export const marginals = (delta: number[]) => Q_REF.map((q, j) => sigmoid(logit(q) + delta[j]));

// ── rechazos: solicitudes con riesgo observado (con ruido) y daño real ───────────────────────────
export interface Req { risk: number; harmful: boolean }
const hh = (i: number, k: number) => { let x = (Math.imul(i + 11, 374761393) + Math.imul(k + 7, 668265263)) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
/** 28 solicitudes ilustrativas. El «riesgo» que estima el modelo es una señal imperfecta del daño real: por eso ningún umbral acierta siempre. */
export const REQS: Req[] = Array.from({ length: 28 }, (_, i) => {
  const t = (i + 0.5) / 28;                                           // gravedad verdadera: de 0 a 1
  const harmful = hh(i, 1) < sigmoid((t - 0.5) * 6);                  // el daño real es probable, no seguro, al subir la gravedad
  const risk = Math.min(0.99, Math.max(0.01, t + 0.5 * (hh(i, 2) - 0.5)));
  return { risk, harmful };
});
