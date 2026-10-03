// Datos y modelo de la lección «Programar o aprender».
//
// DATOS SINTÉTICOS E ILUSTRATIVOS (no son correos reales). Cada punto es [enlaces, % de mayúsculas, clase]:
// clase 0 = normal, clase 1 = spam. Se generaron una sola vez, fuera de la escena, con el rng de core/scene/math
// (semillas 190 y 191): normales independientes por clase (normal: enlaces ≈ N(1,8; 1,5), mayúsculas ≈ N(8; 3,8);
// spam: enlaces ≈ N(5,2; 2,1), mayúsculas ≈ N(19; 8)), más un 18 % de «boletines» legítimos con muchos enlaces
// y un 20 % de spam «sin enlaces y a gritos». Los enlaces se redondean a enteros y las mayúsculas a décimas.
// De 400 semillas se tomó una cuyos resultados quedan cerca de la mediana (mejor regla a mano sobre los 30 vistos
// ≈ 93 %, sobre los 60 nuevos ≈ 78–87 %; modelo aprendido ≈ 90 % y ≈ 87 %), para que lo que se ve sea típico.
// Se guardan como números fijos para que la escena sea idéntica en cualquier navegador.
//
// El modelo es de verdad: regresión logística entrenada con descenso del gradiente (η = 0,5, 300 pasos) sobre
// medidas estandarizadas. Nada del entrenamiento que se ve en pantalla está simulado.

export type Cls = 0 | 1;
export interface Pt { l: number; c: number; y: Cls }
const mk = (rows: number[][]): Pt[] => rows.map(([l, c, y]) => ({ l, c, y: y as Cls }));

/** Los 30 correos de ejemplo, con su respuesta (15 normales y 15 spam, alternados). */
export const TRAIN: Pt[] = mk([
  [0, 10.3, 0], [6, 19.5, 1], [2, 12.3, 0], [9, 9, 1], [0, 7.8, 0], [9, 30.4, 1],
  [2, 5.3, 0], [4, 22.4, 1], [3, 4.9, 0], [4, 18.2, 1], [6, 5.8, 0], [0, 24.4, 1],
  [2, 16.3, 0], [4, 18.1, 1], [3, 9.2, 0], [0, 23.6, 1], [3, 14.5, 0], [5, 13.3, 1],
  [0, 9.7, 0], [9, 36.8, 1], [3, 11.1, 0], [1, 12.4, 1], [4, 6.3, 0], [2, 25.5, 1],
  [5, 8.5, 0], [7, 21.3, 1], [0, 6.3, 0], [1, 23.9, 1], [3, 6.6, 0], [3, 19.4, 1],
]);

/** Los 60 correos nuevos (30 y 30): nunca se usan para ajustar nada, solo para comprobar. */
export const FRESH: Pt[] = mk([
  [4, 4.3, 0], [5, 20.7, 1], [4, 12.2, 0], [6, 22.4, 1], [3, 11.4, 0], [5, 6.2, 1],
  [0, 8.9, 0], [1, 33.4, 1], [1, 8, 0], [6, 22.9, 1], [2, 8.6, 0], [5, 27.5, 1],
  [4, 8.2, 0], [7, 39.1, 1], [6, 6.5, 0], [4, 25.1, 1], [1, 7.9, 0], [5, 16, 1],
  [0, 16.5, 0], [5, 26.5, 1], [1, 4.8, 0], [2, 20.3, 1], [2, 1.9, 0], [6, 11.4, 1],
  [1, 12.8, 0], [0, 27.9, 1], [0, 15.8, 0], [0, 28.5, 1], [4, 11, 0], [4, 31.7, 1],
  [4, 2.7, 0], [6, 17.5, 1], [0, 9.7, 0], [5, 34.2, 1], [0, 5.3, 0], [7, 13, 1],
  [3, 6.3, 0], [6, 31.1, 1], [4, 2.2, 0], [6, 19.8, 1], [6, 11, 0], [7, 20.1, 1],
  [7, 9.7, 0], [6, 4, 1], [3, 8.4, 0], [3, 13.5, 1], [0, 9.1, 0], [0, 40, 1],
  [2, 10.4, 0], [3, 9.6, 1], [3, 12.4, 0], [8, 14.3, 1], [3, 6.9, 0], [7, 6.6, 1],
  [2, 6.1, 0], [1, 14.7, 1], [2, 9.9, 0], [7, 12.1, 1], [2, 6.7, 0], [7, 15.6, 1],
]);

/** Índice (en TRAIN) del correo de la tarjeta del inicio: 4 enlaces y 22 % de mayúsculas. */
export const DEMO = 7;

/** Cuatro ejemplos de spam «a gritos» que, en la advertencia final, se anotan por error como normales. */
export const BAD: number[] = TRAIN.map((p, i) => (p.y === 1 && p.c >= 24 ? i : -1)).filter((i) => i >= 0);
export const TRAIN_BAD: Pt[] = TRAIN.map((p, i) => (BAD.includes(i) ? { ...p, y: 0 as Cls } : p));

// ── el correo de la tarjeta (el texto es inventado; las dos medidas salen de contar sus letras) ──
export const MAIL = {
  es: ['¡GANA YA! PREMIO GRATIS', 'Hola, fuiste elegido. RECLAMA', 'tu regalo antes de que acabe:', 'premio.example/ya', 'premio.example/vip', 'premio.example/hoy', 'premio.example/top', '¡Solo HOY!'],
  en: ['WIN NOW! FREE PRIZE', 'Hello, you were picked. CLAIM', 'your gift before the offer ends:', 'prize.example/now', 'prize.example/vip', 'prize.example/today', 'prize.example/top', 'TODAY ONLY!'],
};

/** Mide un correo (lista de líneas): enlaces (cadenas «algo.example/…») y % de letras en mayúscula. */
export function measureMail(lines: string[]) {
  const text = lines.join(' ');
  const letters = [...text].filter((ch) => /\p{L}/u.test(ch));
  const upper = letters.filter((ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase());
  const links = (text.match(/[a-z0-9-]+\.example\/[a-z0-9]+/g) ?? []).length;
  return { links, caps: (100 * upper.length) / Math.max(1, letters.length) };
}

// ── regla escrita a mano (lo que haría un programador) ──
/** «Spam si trae al menos `a` enlaces o al menos `b` % de mayúsculas.» */
export const handSpam = (a: number, b: number, p: Pt): Cls => (p.l >= a || p.c >= b ? 1 : 0);
export const handHits = (a: number, b: number, pts: Pt[]) => pts.filter((p) => handSpam(a, b, p) === p.y).length;

// ── modelo aprendido: suma ponderada  puntaje = w1·enlaces + w2·mayúsculas + b ──
export interface Model { w1: number; w2: number; b: number }
export const score = (m: Model, l: number, c: number) => m.w1 * l + m.w2 * c + m.b;
export const modelSpam = (m: Model, p: Pt): Cls => (score(m, p.l, p.c) > 0 ? 1 : 0);
export const modelHits = (m: Model, pts: Pt[]) => pts.filter((p) => modelSpam(m, p) === p.y).length;

/** Punto de partida arbitrario (en medidas estandarizadas: −0,8; 0,5; 0,6). Empieza mal a propósito. */
const INIT_Z: [number, number, number] = [-0.8, 0.5, 0.6];
const M1 = 3.5, S1 = 2.5, M2 = 14, S2 = 8;   // estandarización: (enlaces − 3,5)/2,5 y (mayúsculas − 14)/8
const z1 = (l: number) => (l - M1) / S1, z2 = (c: number) => (c - M2) / S2;
const toRaw = (w1: number, w2: number, b: number): Model => ({ w1: w1 / S1, w2: w2 / S2, b: b - (w1 * M1) / S1 - (w2 * M2) / S2 });
export const round2 = (m: Model): Model => ({ w1: Math.round(m.w1 * 100) / 100, w2: Math.round(m.w2 * 100) / 100, b: Math.round(m.b * 100) / 100 });

/**
 * Entrena de verdad: descenso del gradiente sobre el error de entropía cruzada de una regresión logística.
 * Devuelve la trayectoria de los parámetros (en unidades originales), del punto de partida al final.
 */
export function fit(pts: Pt[], steps = 300, eta = 0.5): Model[] {
  let [w1, w2, b] = INIT_Z;
  const path: Model[] = [toRaw(w1, w2, b)];
  const n = pts.length;
  for (let s = 0; s < steps; s++) {
    let g1 = 0, g2 = 0, gb = 0;
    for (const p of pts) {
      const e = 1 / (1 + Math.exp(-(w1 * z1(p.l) + w2 * z2(p.c) + b))) - p.y;
      g1 += e * z1(p.l); g2 += e * z2(p.c); gb += e;
    }
    w1 -= (eta * g1) / n; w2 -= (eta * g2) / n; b -= (eta * gb) / n;
    path.push(toRaw(w1, w2, b));
  }
  path[path.length - 1] = round2(path[path.length - 1]);   // lo que se muestra con dos decimales es lo que se usa
  return path;
}

/** Los primeros n ejemplos de cada clase (n par): así cada tamaño de muestra queda equilibrado. */
export const subset = (n: number): Pt[] => [...TRAIN.filter((p) => p.y === 0).slice(0, n / 2), ...TRAIN.filter((p) => p.y === 1).slice(0, n / 2)];
export const isUsed = (i: number, n: number): boolean => {
  const p = TRAIN[i];
  const rank = TRAIN.slice(0, i).filter((q) => q.y === p.y).length;   // posición dentro de su clase
  return rank < n / 2;
};

export const STEPS = 300;
export const PATH: Model[] = fit(TRAIN, STEPS);
export const START: Model = PATH[0];
export const FINAL: Model = PATH[STEPS];
export const SIZES = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
export const BY_N: Record<number, Model> = Object.fromEntries(SIZES.map((n) => [n, n === 30 ? FINAL : fit(subset(n), STEPS).at(-1)!]));
export const BAD_PATH: Model[] = fit(TRAIN_BAD, STEPS);
export const BAD_MODEL: Model = BAD_PATH[STEPS];

/** Modelo en el paso k del entrenamiento animado (el avance se frena: los primeros pasos son los que más cambian). */
export const stepAt = (p: number): number => Math.min(STEPS, Math.round(STEPS * Math.pow(Math.max(0, Math.min(1, p)), 3)));
