// Datos y matemática de la lección «Un modelo y su error». Todo es puro y determinista.
//
// DATOS (ilustrativos, sintéticos): diez estudiantes ficticios, escritos a mano para esta lección.
//   x = horas de estudio, y = calificación (0–100). No provienen de ninguna encuesta real.
//   Reglas de diseño del conjunto:
//     · una tendencia clara (≈ 5 puntos por hora, ≈ 40 puntos sin estudiar) con poco ruido;
//     · un estudiante atípico (6,5 h → 56), para ver cómo el error cuadrático lo «escucha» más que el absoluto.
//   Cifras que la narración y el contenido dan por buenas (se comprueban con el código de «Por dentro»):
//     recta plana (promedio)  y = 64,4          → pérdida 244,0 (MSE), suma de errores 0
//     mejor recta (mínimos cuadrados) w = 5,2637, b = 40,4503 → pérdida mínima 42,5
//     el atípico aporta 81,9 % de la pérdida mínima con cuadrados y 49,8 % con valores absolutos
//     con 12 h de estudio la mejor recta predice 103,6 (más que el máximo posible, 100)
import type { Frame } from '../../../../../theme/kit';

export const XS = [0.5, 1.5, 2, 3, 4, 5, 6, 6.5, 8, 9];
export const YS = [43, 49, 52, 57, 62, 72, 73, 56, 87, 93];
export const N = XS.length;
/** Índice del estudiante atípico (6,5 h) y su calificación original. */
export const OUT = 7;
export const YO = YS[OUT];
/** Índice del estudiante de cinco horas, que se usa para explicar el error de un punto. */
export const FIVE = 5;
/** Horas que se usan en la predicción de ejemplo (nadie del conjunto estudió siete horas). */
export const X_NEW = 7;

export interface Line { w: number; b: number }
export const yAt = (l: Line, x: number) => l.w * x + l.b;
export const lerpLine = (a: Line, b: Line, t: number): Line => ({ w: a.w + (b.w - a.w) * t, b: a.b + (b.b - a.b) * t });

/** Estudiantes con la calificación del atípico cambiada (para arrastrarlo). */
export const withOutlier = (yo: number): number[] => { const ys = YS.slice(); ys[OUT] = yo; return ys; };

/** Errores (real − predicción) de cada estudiante. */
export const errsOf = (l: Line, ys: number[] = YS): number[] => XS.map((x, i) => ys[i] - yAt(l, x));
export const sumSq = (l: Line, ys: number[] = YS) => errsOf(l, ys).reduce((a, e) => a + e * e, 0);
export const sumAbs = (l: Line, ys: number[] = YS) => errsOf(l, ys).reduce((a, e) => a + Math.abs(e), 0);
/** Pérdida: error cuadrático medio (MSE). */
export const mse = (l: Line, ys: number[] = YS) => sumSq(l, ys) / N;

/** Mínimos cuadrados (fórmula cerrada). */
export function lsFit(ys: number[] = YS): Line {
  const mx = XS.reduce((a, x) => a + x, 0) / N, my = ys.reduce((a, y) => a + y, 0) / N;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < N; i++) { sxy += (XS[i] - mx) * (ys[i] - my); sxx += (XS[i] - mx) ** 2; }
  const w = sxy / sxx;
  return { w, b: my - w * mx };
}

/** Mínimo error absoluto: el óptimo pasa por dos de los puntos, así que basta probar todos los pares (exacto). */
const ladMemo = new Map<number, Line>();
export function ladFit(yo: number): Line {
  const key = Math.round(yo * 20);
  const hit = ladMemo.get(key); if (hit) return hit;
  const ys = withOutlier(yo);
  let best: Line = { w: 0, b: 0 }, bestV = Infinity;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    if (XS[i] === XS[j]) continue;
    const w = (ys[j] - ys[i]) / (XS[j] - XS[i]), l = { w, b: ys[i] - w * XS[i] }, v = sumAbs(l, ys);
    if (v < bestV - 1e-9) { bestV = v; best = l; }
  }
  ladMemo.set(key, best);
  return best;
}

export const MY = YS.reduce((a, y) => a + y, 0) / N;          // media de y
/** Recta plana: predecir siempre el promedio. Es la línea base. */
export const FLAT: Line = { w: 0, b: MY };
/** Recta con la que arranca la narración (w = 2, b = 45). */
export const START: Line = { w: 2, b: 45 };
/** La mejor recta y su pérdida mínima. */
export const BEST = lsFit();
export const LMIN = mse(BEST);
/** «Cerca del mínimo» = a menos de 8 % de la pérdida mínima. */
export const THR = LMIN * 1.08;

/** Aporte de cada estudiante a la suma (cuadrados o absolutos), como fracción del total. */
export function shares(l: Line, kind: 'sq' | 'abs'): number[] {
  const e = errsOf(l).map((v) => (kind === 'sq' ? v * v : Math.abs(v))), s = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / s);
}

// ── formato ──────────────────────────────────────────────────────────────
/** Número con formato del idioma (coma decimal en español, como el texto de la lección), sin separador de miles y con el signo menos tipográfico. */
export const nf = (S: Frame, x: number, d = 1) => {
  const t = S.n(x, d).replace(/,(?=\d{3}(\D|$))/g, '').replace('-', '−');
  return S.lang === 'es' ? t.replace('.', ',') : t;
};
/** Con signo explícito (+17 / −3). */
export const sg = (S: Frame, x: number, d = 0) => (x > 0.00001 ? '+' : '') + nf(S, Math.abs(x) < 0.5 * 10 ** -d ? 0 : x, d);

// ── tiempo ───────────────────────────────────────────────────────────────
/** Interpolación por tramos: puntos [tiempo, valor] con suavizado entre ellos. */
export function keyframes(t: number, pts: [number, number][]): number {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const k = (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]), e = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
      return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * e;
    }
  }
  return pts[pts.length - 1][1];
}
