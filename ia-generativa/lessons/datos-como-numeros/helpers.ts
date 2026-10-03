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
/** Niveles de desenfoque 0..4: cada nivel repite el promedio una vez más. Precalculado (determinista). */
export const BLUR_LEVELS: number[][] = (() => {
  const out = [SMILE_GRAY.slice()];
  for (let i = 1; i <= 4; i++) out.push(boxBlur(out[i - 1]));
  return out.map((a) => a.map(clamp255));
})();

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

// ── sonido de juguete (ilustrativo): dos tonos sumados; ventana de 10 ms ──
export const SND = { f1: 200, f2: 500, T: 10 };
export const wave = (tms: number) => 0.62 * Math.sin((2 * Math.PI * SND.f1 * tms) / 1000) + 0.38 * Math.sin((2 * Math.PI * SND.f2 * tms) / 1000 + 0.6);
export interface Sampled { n: number; t: number[]; v: number[]; err: number }
const sampledCache = new Map<number, Sampled>();
/** Muestrea la onda a `fs` muestras por segundo en 10 ms y mide el error de unir las muestras con rectas. */
export function sample(fs: number): Sampled {
  const hit = sampledCache.get(fs); if (hit) return hit;
  const n = Math.floor((SND.T * fs) / 1000) + 1, t: number[] = [], v: number[] = [];
  for (let k = 0; k < n; k++) { t.push((1000 * k) / fs); v.push(wave((1000 * k) / fs)); }
  let err = 1;
  if (n >= 2) {
    let se = 0, ss = 0;
    const tl = t[n - 1];
    for (let i = 0; i <= 400; i++) {
      const x = (tl * i) / 400, k = Math.min(n - 2, Math.floor((x * fs) / 1000)), a = (x - t[k]) / (t[k + 1] - t[k]);
      const r = v[k] + (v[k + 1] - v[k]) * a;
      se += (r - wave(x)) ** 2; ss += wave(x) ** 2;
    }
    err = Math.sqrt(se / ss);
  }
  const out = { n, t, v, err };
  sampledCache.set(fs, out);
  return out;
}

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
