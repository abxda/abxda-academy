// Ayudas de la lección «El mundo hecho de números»: datos de las imágenes, desenfoque, sonido de juguete y rasgos de palabras.
//
// Sobre los colores de este archivo: aquí los colores NO son de interfaz sino DATOS. Los números de un píxel
// SON su color (rojo, verde, azul), así que la escena necesita construir `rgb(r,g,b)` a partir de ellos. Todo lo
// que es interfaz (ejes, rótulos, marcos, tonos) sigue pidiéndose a tone()/S.pal en scene.ts.

export type RGB = [number, number, number];

export const colorOf = (r: number, g: number, b: number) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
export const grayCss = (v: number) => colorOf(v, v, v);
/** Color de texto legible sobre un fondo de gris `v` (0–255). */
export const textOnGray = (v: number) => (v < 130 ? colorOf(238, 238, 242) : colorOf(22, 24, 30));
/** Gris de una celda como número entero 0–255. */
export const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ── la carita: 8×8, a color; el gris sale de ella con la receta de luminancia habitual (ITU-R BT.601) ──
export const N = 8;
const PAL: Record<string, RGB> = {
  B: [12, 18, 48],    // fondo azul muy oscuro
  Y: [255, 214, 0],   // cara
  R: [224, 134, 0],   // borde anaranjado
  K: [0, 0, 0],       // ojos y boca
  W: [255, 255, 255], // brillo
};
const SMILE_MAP = [
  'BBRRRRBB',
  'BRYWYYRB',
  'RYKYYKYR',
  'RYKYYKYR',
  'RYYYYYYR',
  'RYKYYKYR',
  'BRYKKYRB',
  'BBRRRRBB',
];
export const SMILE_RGB: RGB[] = SMILE_MAP.flatMap((row) => [...row].map((ch) => PAL[ch]));
export const luma = ([r, g, b]: RGB) => clamp255(0.299 * r + 0.587 * g + 0.114 * b);
export const SMILE_GRAY: number[] = SMILE_RGB.map(luma);

const fromMap = (rows: string[], hi = 255, mid = 128) => rows.flatMap((row) => [...row].map((ch) => (ch === '1' ? hi : ch === '2' ? mid : 0)));
export const HEART = fromMap(['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000']);
export const SEVEN = fromMap(['01111110', '00000110', '00001100', '00011000', '00110000', '00110000', '00110000', '00000000']);
/** Ejemplos que se pueden cargar en el lienzo (uno por pulsación del botón «Ejemplo»). */
export const EXAMPLES: number[][] = [SMILE_GRAY, HEART, SEVEN];

// ── desenfoque: promedio de la ventana 3×3 (en los bordes, solo los vecinos que existen) ──
export function boxBlur(v: number[], n = N): number[] {
  const out: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    let s = 0, k = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) { s += v[rr * n + cc]; k++; }
    }
    out.push(s / k);
  }
  return out;
}
/** Vecindad 3×3 de un píxel (null fuera de la imagen) y su promedio. */
export function hood(v: number[], r: number, c: number, n = N) {
  const cells: (number | null)[] = [];
  let s = 0, k = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < n && cc >= 0 && cc < n) { cells.push(v[rr * n + cc]); s += v[rr * n + cc]; k++; } else cells.push(null);
  }
  return { cells, mean: s / k };
}
/** Desenfoque parcial: el nivel k (0..4) mezcla cada píxel con el promedio completo de su ventana 3×3 en una proporción k/4
 *  (0 % = imagen original, 100 % = promedio completo). Así los niveles bajos cambian TODOS los números y aun así la carita se
 *  reconoce, y el nivel 4 la borra. Precalculado (determinista) y redondeado a enteros, como lo que muestra la escena. */
export const BLUR_PCT = [0, 25, 50, 75, 100];
export const blurMix = (v: number[], pct: number): number[] => { const b = boxBlur(v); return v.map((x, i) => (1 - pct / 100) * x + (pct / 100) * b[i]); };
export const BLUR_LEVELS: number[][] = BLUR_PCT.map((pct) => blurMix(SMILE_GRAY, pct).map(clamp255));

/** Dos imágenes distintas con EXACTAMENTE el mismo desenfoque completo (100 %).
 *  La suma de una ventana 3×3 es K⊗K, con K la matriz tridiagonal de unos de 8×8; K tiene un vector nulo u = (1,−1,0,1,−1,0,1,−1)
 *  (cada tres vecinos seguidos suman cero, también en los bordes), así que cualquier imagen con una columna j sumada a ±t·u
 *  da el mismo promedio 3×3 en todos los píxeles. Aquí: columna 4 de la carita (índice 3) con ±25 en seis píxeles. */
export const NULL_U = [1, -1, 0, 1, -1, 0, 1, -1];
export const NULL_COL = 3, NULL_T = 25;
export const FACE_B: number[] = SMILE_GRAY.map((v, i) => (i % N === NULL_COL ? v + NULL_T * NULL_U[Math.floor(i / N)] : v));

// ── una imagen «con aspecto de MNIST» (28×28): ilustración, NO es un dígito del conjunto real ──
// Un «3» trazado con dos arcos, inclinado y con borde suave (anti-aliasing): una imagen de 28×28 con grises en los bordes.
export const MNIST_LIKE: number[] = (() => {
  const pts: [number, number][] = [];
  const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number) => {
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  };
  arc(13.2, 9.6, 5.0, 4.6, Math.PI * 1.1, Math.PI * 2.5, 70);
  arc(13.4, 19.0, 5.8, 5.0, Math.PI * 1.5, Math.PI * 2.9, 80);
  const sheared = pts.map(([x, y]): [number, number] => [x + (14 - y) * 0.14, y]);
  const out: number[] = [];
  for (let r = 0; r < 28; r++) for (let c = 0; c < 28; c++) {
    let dmin = 99;
    for (const [x, y] of sheared) { const d = Math.hypot(x - (c + 0.5), y - (r + 0.5)); if (d < dmin) dmin = d; }
    out.push(clamp255(Math.max(0, Math.min(1, (2.2 - dmin) / 1.3)) * 255));
  }
  return out;
})();

// ── sonido de juguete (ilustrativo): dos tonos sumados (200 y 500 ciclos por segundo), ventana de 10 ms ──
// Los dos tonos caben un número entero de veces en 10 ms (2 y 5 ciclos): la señal se repite cada 10 ms. Eso permite reconstruirla
// con interpolación trigonométrica (lo que haría un conversor ideal) a partir de N = fs/100 muestras por periodo.
export const SND = { f1: 200, f2: 500, T: 10 };
export const wave = (tms: number) => 0.62 * Math.sin((2 * Math.PI * SND.f1 * tms) / 1000) + 0.38 * Math.sin((2 * Math.PI * SND.f2 * tms) / 1000 + 0.6);
export const REC_N = 200;
export interface Sampled { n: number; t: number[]; v: number[]; rec: number[]; err: number }
const sampledCache = new Map<number, Sampled>();
/** Muestrea la onda a `fs` muestras por segundo durante 10 ms (n = fs/100 muestras), la reconstruye con interpolación
 *  trigonométrica y mide el error relativo (raíz del error cuadrático medio entre la energía de la onda). */
export function sample(fs: number): Sampled {
  const hit = sampledCache.get(fs); if (hit) return hit;
  const n = Math.max(2, Math.round((SND.T * fs) / 1000)), t: number[] = [], v: number[] = [];
  for (let k = 0; k < n; k++) { t.push((SND.T * k) / n); v.push(wave((SND.T * k) / n)); }
  const K = Math.floor((n - 1) / 2);
  const a0 = v.reduce((s, x) => s + x, 0) / n;
  const ak: number[] = [], bk: number[] = [];
  for (let k = 1; k <= K; k++) {
    let sa = 0, sb = 0;
    for (let i = 0; i < n; i++) { sa += v[i] * Math.cos((2 * Math.PI * k * i) / n); sb += v[i] * Math.sin((2 * Math.PI * k * i) / n); }
    ak.push((2 * sa) / n); bk.push((2 * sb) / n);
  }
  const nyq = n % 2 === 0 ? v.reduce((s, x, i) => s + (i % 2 ? -x : x), 0) / n : 0;   // componente justo en el límite (n/2 ciclos)
  const recAt = (x: number) => {
    const ph = (2 * Math.PI * x) / SND.T;
    let y = a0;
    for (let k = 1; k <= K; k++) y += ak[k - 1] * Math.cos(k * ph) + bk[k - 1] * Math.sin(k * ph);
    if (n % 2 === 0) y += nyq * Math.cos((n / 2) * ph);
    return y;
  };
  const rec: number[] = [];
  let se = 0, ss = 0;
  for (let i = 0; i <= REC_N; i++) { const x = (SND.T * i) / REC_N, r = recAt(x); rec.push(r); if (i < REC_N) { se += (r - wave(x)) ** 2; ss += wave(x) ** 2; } }
  const out = { n, t, v, rec, err: Math.sqrt(se / ss) };
  sampledCache.set(fs, out);
  return out;
}
/** Con esta señal (el tono más rápido sube y baja SND.f2 veces por segundo) hay que medir MÁS del doble de veces por segundo. */
export const MIN_RATE = 2 * SND.f2;

// ── texto: códigos de letra (puntos de código Unicode; los primeros 128 coinciden con ASCII) ──
export const codesOf = (s: string): number[] => [...s].map((ch) => ch.codePointAt(0) ?? 0);

// ── rasgos ilustrativos de palabras (INVENTADOS para mostrar la idea; los de un modelo real se aprenden) ──
export const FEATURES = {
  es: ['animal', 'mascota', 'grande', 'comida'],
  en: ['animal', 'pet', 'big', 'food'],
};
export const WORDS: { es: string; en: string; f: [number, number, number, number] }[] = [
  { es: 'gato', en: 'cat', f: [1, 0.9, 0.2, 0] },
  { es: 'perro', en: 'dog', f: [1, 1.0, 0.4, 0] },
  { es: 'tigre', en: 'tiger', f: [1, 0.0, 0.8, 0] },
  { es: 'pan', en: 'bread', f: [0, 0.0, 0.1, 1] },
  { es: 'queso', en: 'cheese', f: [0, 0.0, 0.1, 0.9] },
];
export const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0));
