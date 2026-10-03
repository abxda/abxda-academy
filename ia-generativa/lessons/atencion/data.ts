// Datos y matemática de la lección «Atención».
//
// 1) El juguete (ilustrativo, hecho a mano): nueve palabras, vectores de DOS números para consulta (q), clave (k)
//    y valor (v). Los números NO salen de un modelo entrenado: los elegimos para que la geometría se vea. Lo que
//    sí es real es el cálculo que se hace con ellos (producto punto, softmax, suma ponderada), que la escena
//    ejecuta en vivo. El plano del valor tiene dos ejes con nombre («cosa» y «agente») solo para poder leerlo;
//    en un modelo real las dimensiones no tienen un significado tan limpio.
// 2) La demostración de √d: vectores gaussianos con semilla fija; se calcula en vivo (ver `demo`).
// 3) Los datos reales de BERT están en real-data.ts (generado por real-attention.py).
import { gauss, rng } from '../../../../../theme/kit';

export type V2 = [number, number];
export type Lang = 'es' | 'en';

// ── frase: «El robot soltó el paquete porque este era pesado» ─────────────────────────────────────────────
export const TOK: Record<Lang, string[]> = {
  es: ['El', 'robot', 'soltó', 'el', 'paquete', 'porque', 'este', 'era', 'pesado'],
  en: ['The', 'robot', 'dropped', 'the', 'package', 'because', 'it', 'was', 'heavy'],
};
/** Final alternativo (cambia solo las dos últimas palabras): «… este estaba cansado» */
export const TOK_TIRED: Record<Lang, string[]> = {
  es: ['El', 'robot', 'soltó', 'el', 'paquete', 'porque', 'este', 'estaba', 'cansado'],
  en: ['The', 'robot', 'dropped', 'the', 'package', 'because', 'it', 'was', 'tired'],
};
export const N = 9;
/** Posiciones con significado en la frase. */
export const I = { robot: 1, pkg: 4, it: 6, adj: 8 } as const;

// Vector de entrada de «este/it» (embedding, ilustrativo): el mismo en cualquier frase.
export const X_IT: V2 = [0.4, -0.2];

// ── el juguete: d = 2 ──────────────────────────────────────────────────────────────────────────────────────
export const D = 2;
/** Claves k_j (dónde «vive» cada palabra en el plano de coincidencia). */
export const K: V2[] = [[-1.2, 1.4], [0.6, 2.0], [-1.9, 0.2], [-0.5, -0.7], [2.0, 0.5], [-1.4, -1.1], [0.2, -1.7], [0.7, -0.3], [1.5, -1.0]];
/** Valores v_j: (cosa, agente). «este» no aporta nada propio: es un vector vacío. */
export const V: V2[] = [[0.0, 0.1], [0.1, 1.0], [0.3, 0.6], [0.1, 0.0], [1.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.1], [0.9, -0.1]];
/** Consultas q_i de las nueve palabras (la de «este» es la de partida del turno). */
export const Q: V2[] = [[0.5, 2.5], [-1.5, 1.0], [1.5, 1.5], [2.5, 0.5], [-2.0, 0.0], [-1.5, -0.5], [2.0, 1.0], [0.5, -2.5], [1.0, -1.5]];
export const Q_IT: V2 = Q[I.it];
export const QR = 3;   // el plano de la consulta va de −3 a 3

export const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
export function softmax(a: number[]): number[] {
  const m = Math.max(...a), e = a.map((x) => Math.exp(x - m)), s = e.reduce((p, c) => p + c, 0);
  return e.map((x) => x / s);
}

export interface Att { raw: number[]; scaled: number[]; w: number[]; out: V2 }
/** Atención de UNA consulta contra las nueve claves: puntuación, escala, softmax y suma ponderada de valores. */
export function attend(q: V2): Att {
  const raw = K.map((k) => dot(q, k));
  const scaled = raw.map((s) => s / Math.sqrt(D));
  const w = softmax(scaled);
  const out: V2 = [0, 0];
  w.forEach((wi, j) => { out[0] += wi * V[j][0]; out[1] += wi * V[j][1]; });
  return { raw, scaled, w, out };
}
export const ATT_IT = attend(Q_IT);
/** Mapa de atención de toda la frase (fila i = lo que mira la palabra i). */
export const MAP: number[][] = Q.map((q) => attend(q).w);

/** Ajusta una consulta a la rejilla de 0,5 y al rango del plano. */
export const snapQ = (x: number, y: number): V2 => {
  const f = (t: number) => Math.max(-QR, Math.min(QR, Math.round(t * 2) / 2));
  return [f(x), f(y)];
};

// ── por qué √d ─────────────────────────────────────────────────────────────────────────────────────────────
export const DIMS = [2, 4, 8, 16, 32, 64, 128, 256, 512];
const DEMO_KEYS = 9;
let base: { q: number[]; K: number[][] } | null = null;
function baseDraw() {
  if (base) return base;
  const r = rng(9 * 7919);   // semilla elegida entre 12 por mostrar el caso típico (ver el promedio, que no depende de ella)
  const q = Array.from({ length: 512 }, () => gauss(r));
  const K2 = Array.from({ length: DEMO_KEYS }, () => Array.from({ length: 512 }, () => gauss(r)));
  return (base = { q, K: K2 });
}
export interface Demo { raw: number[]; scaled: number[]; wRaw: number[]; wScaled: number[]; avgMaxRaw: number; avgMaxScaled: number; sens: [number, number] }
const demoCache = new Map<number, Demo>();
/**
 * Una consulta y nueve claves gaussianas de dimensión d (las d primeras componentes de un mismo sorteo de 512,
 * así que al subir d las puntuaciones se mueven de forma continua). Además, el peso máximo medio sobre 100 sorteos
 * independientes, con y sin escalar: es el dato que no depende de la suerte de un solo sorteo.
 */
export function demo(d: number): Demo {
  const hit = demoCache.get(d); if (hit) return hit;
  const b = baseDraw();
  const raw = b.K.map((k) => { let s = 0; for (let i = 0; i < d; i++) s += b.q[i] * k[i]; return s; });
  const scaled = raw.map((x) => x / Math.sqrt(d));
  const wRaw = softmax(raw), wScaled = softmax(scaled);
  let a = 0, c = 0; const T = 100;
  for (let t = 0; t < T; t++) {
    const r = rng(99991 + t * 13 + d), q = Array.from({ length: d }, () => gauss(r));
    const sc = Array.from({ length: DEMO_KEYS }, () => { let s = 0; for (let i = 0; i < d; i++) s += q[i] * gauss(r); return s; });
    a += Math.max(...softmax(sc)); c += Math.max(...softmax(sc.map((x) => x / Math.sqrt(d))));
  }
  // sensibilidad del reparto = Σ w(1−w): 0 si es casi todo o nada, ~0,89 si es uniforme
  const sens = (w: number[]): number => w.reduce((s, x) => s + x * (1 - x), 0);
  const out: Demo = { raw, scaled, wRaw, wScaled, avgMaxRaw: a / T, avgMaxScaled: c / T, sens: [sens(wRaw), sens(wScaled)] };
  demoCache.set(d, out);
  return out;
}
