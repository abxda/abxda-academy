// Datos y matemática de la lección «Atención».
//
// 1) El ejemplo hecho a mano (ILUSTRATIVO): la frase «Me senté en el banco de mi jardín» / "I sat on the bank of the
//    river" (ocho tokens en los dos idiomas, en el mismo orden de papeles) y «Saqué dinero del banco» / "I took money
//    out of the bank". Consultas, claves y valores de DOS números, escritos a mano para que las cuentas se puedan seguir
//    de cabeza; no salen de un modelo entrenado. Lo que sí es real es el cálculo que la escena hace con ellos
//    (producto punto, softmax y suma ponderada). Los dos números del valor tienen nombre («asiento» y «dinero»; en
//    inglés, "riverbank" y "money") solo para poder leerlos: en un modelo real las dimensiones no significan algo tan limpio.
//    Las claves se eligieron para que la consulta de «banco», (1, 1), dé puntuaciones 1.8, 0.7, 0 y −1.6: tras softmax,
//    60 %, 20 %, 10 % y 2 % (exp(1.8) ≈ 6, exp(0.7) ≈ 2, exp(0) = 1, exp(−1.6) ≈ 0.2; suma ≈ 10).
//    Esta parte NO divide entre √d: la lección presenta esa división después, como la pieza que faltaba.
// 2) La demostración de √d: vectores gaussianos con semilla fija, calculada en vivo (ver `demo`).
// 3) Los mapas reales de BERT están en real-data.ts (generado por real-attention.py).
import { gauss, rng } from '../../../../../theme/kit';

export type V2 = [number, number];
export type Lang = 'es' | 'en';

export const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
export function softmax(a: number[]): number[] {
  const m = Math.max(...a), e = a.map((x) => Math.exp(x - m)), s = e.reduce((p, c) => p + c, 0);
  return e.map((x) => x / s);
}

/** Una frase del ejemplo: sus tokens (por idioma), claves, valores y consultas. */
export interface Toy { tok: string[]; K: V2[]; V: V2[]; Q?: V2[]; q: number; ctx: number }

const FN: V2 = [-0.8, -0.8];          // clave de las palabras pequeñas (en, el, de, mi…): se oponen a lo que busca «banco»
const SUBJ: V2 = [-1.6, 0];           // clave de «me» / "I"
const VERB: V2 = [-0.3, 1];           // clave de «senté» / «saqué»
const BANK_K: V2 = [0.5, -0.5];       // clave de «banco»: perpendicular a su propia consulta
const BANK_V: V2 = [0.5, 0.5];        // valor de «banco»: mitad asiento, mitad dinero (ambiguo)
export const Q_BANK: V2 = [1, 1];     // consulta de «banco»: la misma en las dos frases
const Z: V2 = [0, 0];

/** Frase A (asiento / riverbank). Mismos números en los dos idiomas: solo cambian las palabras. */
export const A: Record<Lang, Toy> = {
  es: { tok: ['Me', 'senté', 'en', 'el', 'banco', 'de', 'mi', 'jardín'], K: [], V: [], q: 4, ctx: 7 },
  en: { tok: ['I', 'sat', 'on', 'the', 'bank', 'of', 'the', 'river'], K: [], V: [], q: 4, ctx: 7 },
};
const KA: V2[] = [SUBJ, VERB, FN, FN, BANK_K, FN, FN, [1, 0.8]];
const VA: V2[] = [Z, [0.5, 0], Z, Z, BANK_V, Z, Z, [1, 0]];
/** Consultas de todos los tokens de A (para el mapa; ilustrativas): me→senté, senté→me, en/el→banco, banco→jardín, de/mi→jardín, jardín→banco. */
const QA: V2[] = [[-1, 2.5], [-2, 1], [2.5, -2.5], [2, -2.5], Q_BANK, [1.5, 1.2], [1.2, 1.5], [2, -1.5]];
for (const l of ['es', 'en'] as Lang[]) Object.assign(A[l], { K: KA, V: VA, Q: QA });

/** Frase B (dinero / money). */
export const B: Record<Lang, Toy> = {
  es: { tok: ['Saqué', 'dinero', 'del', 'banco'], K: [VERB, [0.8, 1], FN, BANK_K], V: [[0, 0.5], [0, 1], Z, BANK_V], q: 3, ctx: 1 },
  en: { tok: ['I', 'took', 'money', 'out', 'of', 'the', 'bank'], K: [SUBJ, VERB, [0.8, 1], FN, FN, FN, BANK_K], V: [Z, [0, 0.5], [0, 1], Z, Z, Z, BANK_V], q: 6, ctx: 2 },
};

/** Las dos frases completas, como se leen (con punto). */
export const SENT: Record<'A' | 'B', Record<Lang, string[]>> = {
  A: { es: A.es.tok, en: A.en.tok },
  B: { es: B.es.tok, en: B.en.tok },
};
/** Nombre de los dos números del valor (los dos sentidos de «banco»). */
export const DIM: Record<Lang, [string, string]> = { es: ['asiento', 'dinero'], en: ['riverbank', 'money'] };

export interface Att { s: number[]; e: number[]; w: number[]; out: V2 }
/** Atención de UNA consulta sobre una frase del ejemplo: puntuación (producto punto), exponencial, peso y mezcla. */
export function attend(T: Toy, q: V2): Att {
  const s = T.K.map((k) => dot(q, k));
  const w = softmax(s), e = s.map((x) => Math.exp(x));
  const out: V2 = [0, 0];
  w.forEach((wi, j) => { out[0] += wi * T.V[j][0]; out[1] += wi * T.V[j][1]; });
  return { s, e, w, out };
}
export const ATT_A: Record<Lang, Att> = { es: attend(A.es, Q_BANK), en: attend(A.en, Q_BANK) };
export const ATT_B: Record<Lang, Att> = { es: attend(B.es, Q_BANK), en: attend(B.en, Q_BANK) };
/** Mapa de la frase A (fila i = a quién mira el token i). */
export const MAP_A: number[][] = QA.map((q) => attend(A.es, q).w);

// ── por qué √d ─────────────────────────────────────────────────────────────────────────────────────────────
export const DIMS = [1, 2, 4, 8, 16, 32, 64];
export const DEMO_KEYS = 8;
let base: { q: number[]; K: number[][] } | null = null;
function baseDraw() {
  if (base) return base;
  // Semilla 51: de 60 semillas probadas, la que deja el peso mayor más cerca del promedio de 100 sorteos con d = 1, 8 y 64
  // (este sorteo: 0.26; 0.65 y 0.32; 0.98 y 0.35 — promedios: 0.29; 0.65 y 0.36; 0.89 y 0.36). Es un caso típico, no uno extremo.
  const r = rng(51 * 7919);
  const q = Array.from({ length: 64 }, () => gauss(r));
  const K = Array.from({ length: DEMO_KEYS }, () => Array.from({ length: 64 }, () => gauss(r)));
  return (base = { q, K });
}
export interface Demo { d: number; raw: number[]; scaled: number[]; wRaw: number[]; wScaled: number[] }
/**
 * Una consulta y ocho claves gaussianas (componentes con media 0 y varianza 1) de dimensión d: las d primeras
 * componentes de un mismo sorteo de 64, así que al subir d las puntuaciones cambian de forma continua.
 * x ∈ [0, 6] recorre DIMS (1 … 64) en escala logarítmica; entre dos dimensiones vecinas se interpola.
 */
export function demoAt(x: number): Demo {
  const b = baseDraw();
  const t = Math.max(0, Math.min(DIMS.length - 1, x)), i = Math.min(DIMS.length - 2, Math.floor(t)), f = t - i;
  const part = (n: number) => b.K.map((k) => { let s = 0; for (let j = 0; j < n; j++) s += b.q[j] * k[j]; return s; });
  const r0 = part(DIMS[i]), r1 = part(DIMS[i + 1]);
  const raw = r0.map((v, k) => v + (r1[k] - v) * f);
  const d = Math.exp(Math.log(DIMS[i]) + (Math.log(DIMS[i + 1]) - Math.log(DIMS[i])) * f);
  const scaled = raw.map((s) => s / Math.sqrt(d));
  return { d, raw, scaled, wRaw: softmax(raw), wScaled: softmax(scaled) };
}
/** Promedio, sobre 100 sorteos, del peso mayor con y sin dividir entre √d (para «por dentro» y el registro). */
export function avgMax(d: number, T = 100): [number, number] {
  let a = 0, c = 0;
  for (let t = 0; t < T; t++) {
    const r = rng(99991 + t * 13 + d), q = Array.from({ length: d }, () => gauss(r));
    const sc = Array.from({ length: DEMO_KEYS }, () => { let s = 0; for (let i = 0; i < d; i++) s += q[i] * gauss(r); return s; });
    a += Math.max(...softmax(sc)); c += Math.max(...softmax(sc.map((x) => x / Math.sqrt(d))));
  }
  return [a / T, c / T];
}
