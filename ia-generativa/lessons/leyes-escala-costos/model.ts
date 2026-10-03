// Matemática pura de la lección «Leyes de escala y costos». Sin dibujo, sin DOM, determinista.
//
// ── De dónde sale cada número ─────────────────────────────────────────────────────────────────────
// 1) Ley de potencia de Kaplan et al. (2020), arXiv:2001.08361, ecuación (1.1):
//      L(N) = (Nc / N)^αN,  αN ≈ 0,076,  Nc ≈ 8,8·10¹³ (parámetros sin embeddings; pérdida en nats por token,
//      WebText2). También (1.2) L(D) con αD ≈ 0,095 y (1.3) L(Cmin) con αC ≈ 0,050.
//    Su rango medido: de 768 a 1 500 M de parámetros. Más allá de eso es extrapolación (la lección lo rotula).
// 2) Forma funcional de Hoffmann et al. (2022), arXiv:2203.15556, ecuación (2):
//      L(N, D) = E + A / N^α + B / D^β        con la restricción de cómputo  C ≈ 6·N·D (Kaplan 2020).
//    Las constantes ORIGINALES del artículo (E=1,69, A=406,4, B=410,7, α=0,34, β=0,28) dan un óptimo distinto
//    del que el propio artículo observó (≈ 40 mil M a 5,76·10²³ FLOPs; los métodos 1 y 2 dan ≈ 67 mil M).
//    Besiroglu et al. (2024, Epoch AI), arXiv:2404.10102, re-estimaron las cinco constantes a partir de los
//    datos de la figura 4 y obtuvieron E=1,8172, A=482,01, B=2085,43, α=0,3478, β=0,3658, coherentes con
//    los métodos 1 y 2 (≈ 20 tokens por parámetro). Esas son las que usa la lección (FIT), con la forma de Hoffmann.
//    Son un AJUSTE para sus datos (MassiveText); sirve para ver la forma, no para predecir tu modelo.
// 3) Óptimo bajo presupuesto fijo (Hoffmann et al., ec. 4), minimizando L̂ con 6ND = C:
//      N_opt = G·(C/6)^a,  D_opt = G⁻¹·(C/6)^b,  a = β/(α+β),  b = α/(α+β),  G = (αA/βB)^(1/(α+β)).
// 4) Calculadora: C = 6·N·D;  FLOP/s efectivos = GPUs · pico · MFU;  tiempo = C / FLOP/s;
//    horas de GPU = GPUs · tiempo / 3600;  costo = horas de GPU · precio por GPU-hora.
//    Los valores por defecto de la calculadora son SUPUESTOS ilustrativos (no precios de mercado).

export const KAPLAN = { aN: 0.076, Nc: 8.8e13, aD: 0.095, Dc: 5.4e13, aC: 0.05 };
export const Lkaplan = (N: number) => (KAPLAN.Nc / N) ** KAPLAN.aN;

export const FIT = { E: 1.8172, A: 482.01, B: 2085.43, al: 0.3478, be: 0.3658 };
export const Lhat = (N: number, D: number) => FIT.E + FIT.A / N ** FIT.al + FIT.B / D ** FIT.be;

const a_ = FIT.be / (FIT.al + FIT.be), b_ = FIT.al / (FIT.al + FIT.be);
const G_ = ((FIT.al * FIT.A) / (FIT.be * FIT.B)) ** (1 / (FIT.al + FIT.be));
export const A_EXP = a_, B_EXP = b_;
/** Tamaño de modelo óptimo (parámetros) para un presupuesto C (FLOPs). */
export const Nopt = (C: number) => G_ * (C / 6) ** a_;
/** Tokens óptimos para un presupuesto C. */
export const Dopt = (C: number) => (1 / G_) * (C / 6) ** b_;

export const flops = (N: number, D: number) => 6 * N * D;

// ── calculadora ─────────────────────────────────────────────────────────────────────────────────
export interface Cluster { gpus: number; peakTflops: number; mfu: number; price: number }
export interface CalcOut { C: number; rate: number; sec: number; days: number; gpuHours: number; cost: number }
export function calc(N: number, D: number, cl: Cluster): CalcOut {
  const C = flops(N, D), rate = cl.gpus * cl.peakTflops * 1e12 * cl.mfu;
  const sec = C / rate, gpuHours = (cl.gpus * sec) / 3600;
  return { C, rate, sec, days: sec / 86400, gpuHours, cost: gpuHours * cl.price };
}

/** Datos reales de la lección (todos de fuentes primarias; ver `sources` en content.ts). */
export const REF = {
  gpt3: { N: 175e9, D: 300e9, reported: 3.14e23 },           // Brown et al. 2020, tabla D.1
  gopher: { N: 280e9, D: 300e9 },                              // Hoffmann et al. 2022
  chinchilla: { N: 70e9, D: 1.4e12 },                          // Hoffmann et al. 2022
  gopherBudget: 5.76e23,                                       // FLOPs de Gopher y de Chinchilla (Hoffmann et al.)
  llama31: { N: 405e9, D: 15.6e12, reported: 3.8e25, gpus: 16384 }, // Llama Team 2024
  llama3Opt: { N: 402e9, D: 16.55e12 },                        // ajuste propio de Meta (§3.2.1)
  mfu: { gpt3: 0.213, gopher: 0.325, llama3: [0.38, 0.43] as [number, number], palm: 0.462 }, // PaLM tabla 3; Llama 3 tabla 4
  mmlu: { gopher: 60.0, chinchilla: 67.6 },                    // Hoffmann et al. 2022, tabla 6
};

// ── el ejemplo sintético de «emergencia» (Schaeffer et al. 2023): ILUSTRATIVO, no son datos de modelos reales ──
// Pérdida por token que cae como ley de potencia; p = probabilidad de acertar un token = exp(−CE).
// Coincidencia exacta de k tokens = p^k (todo o nada). Puntaje parcial = p (promedio por token).
const N0 = 6e7, ALPHA = 0.3;
export const ceTok = (N: number) => (N / N0) ** -ALPHA;
export const pTok = (N: number) => Math.exp(-ceTok(N));
export const exactMatch = (N: number, k: number) => pTok(N) ** k;

// ── formato de números (mismos locales que Frame.n: es-MX → punto decimal; en-US) ─────────────────────
type Lang = 'es' | 'en';
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');
const loc = (lang: Lang) => (lang === 'es' ? 'es-MX' : 'en-US');
export const nf = (x: number, digits: number, lang: Lang) => x.toLocaleString(loc(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits });
const decSep = (lang: Lang) => (1.5).toLocaleString(loc(lang)).replace(/\d/g, '')[0];
/** Número con 3 cifras significativas aprox., sin ceros finales. */
export function sig(x: number, lang: Lang): string {
  const ax = Math.abs(x), d = ax >= 100 ? 0 : ax >= 10 ? 1 : 2;
  const s = nf(x, d, lang), sep = decSep(lang);
  return d > 0 && s.includes(sep) ? s.replace(new RegExp(`\\${sep}?0+$`), '') : s;
}
const plural = (v: string, one: string, many: string) => (v === '1' ? one : many);
/** Conteos grandes (parámetros, tokens). */
export function count(x: number, lang: Lang): string {
  if (x < 1e6) return nf(Math.round(x), 0, lang);
  if (lang === 'es') {
    if (x < 1e9) return `${sig(x / 1e6, lang)} M`;
    if (x < 1e12) return `${sig(x / 1e9, lang)} mil M`;
    const v = sig(x / 1e12, lang);
    return `${v} ${plural(v, 'billón', 'billones')}`;
  }
  if (x < 1e9) return `${sig(x / 1e6, lang)}M`;
  if (x < 1e12) return `${sig(x / 1e9, lang)}B`;
  return `${sig(x / 1e12, lang)}T`;
}
/** Notación científica: 5.9 × 10²³ */
export function sci(x: number, lang: Lang, digits = 2): string {
  if (x === 0) return '0';
  let e = Math.floor(Math.log10(x)), m = x / 10 ** e;
  if (Math.round(m * 10 ** digits) / 10 ** digits >= 10) { m /= 10; e += 1; }
  return `${nf(m, digits, lang)} × 10${sup(e)}`;
}
export function duration(sec: number, lang: Lang): string {
  const es = lang === 'es';
  if (sec < 90) return `${sig(sec, lang)} s`;
  if (sec < 5400) return `${sig(sec / 60, lang)} min`;
  if (sec < 172800) return `${sig(sec / 3600, lang)} h`;
  if (sec < 86400 * 400) return `${sig(sec / 86400, lang)} ${es ? 'días' : 'days'}`;
  const v = sig(sec / (86400 * 365.25), lang);
  return `${v} ${es ? plural(v, 'año', 'años') : plural(v, 'year', 'years')}`;
}
export function money(x: number, lang: Lang): string {
  const es = lang === 'es';
  if (x < 1e3) return `${es ? 'US$ ' : '$'}${sig(x, lang)}`;
  if (x < 1e6) return es ? `US$ ${sig(x / 1e3, lang)} mil` : `$${sig(x / 1e3, lang)}K`;
  if (x < 1e9) { const v = sig(x / 1e6, lang); return es ? `US$ ${v} ${plural(v, 'millón', 'millones')}` : `$${v}M`; }
  return es ? `US$ ${sig(x / 1e9, lang)} mil M` : `$${sig(x / 1e9, lang)}B`;
}
/** Horas de GPU: entero con separador de miles, o «26.6 M» para millones. */
export function gpuHours(x: number, lang: Lang): string {
  return x < 1e6 ? nf(Math.round(x), 0, lang) : `${sig(x / 1e6, lang)} M`;
}
