// Números de la lección «Estrategia para organizaciones». Todo es ILUSTRATIVO (la tienda de bicicletas eléctricas de las
// lecciones 31 y 35 y sus supuestos), salvo los precios de ejemplo por millón de tokens, que son los de la lección 26
// (3 y 15 dólares, iguales a una tarifa pública real de Anthropic). Las cuentas de la narración salen de aquí y las
// comprueba `verify-model.ts` (npx tsx …/estrategia/verify-model.ts); «por dentro» repite las mismas fórmulas en Python.
import type { L10n } from '../../../../../core/types';

// ── los cinco casos de uso de la tienda ─────────────────────────────────────────────────────────────
export type CaseId = 'garantia' | 'diagnostico' | 'catalogo' | 'redes' | 'curriculos';
export type Risk = 'low' | 'mid' | 'high';
export interface UseCase {
  id: CaseId;
  name: L10n;
  short: L10n;
  /** veces al mes */
  freq: number;
  /** minutos de trabajo que ahorra cada vez */
  min: number;
  /** riesgo como en la lección 35 (probabilidad × impacto) */
  risk: Risk;
  /** posición en el cuadro 2×2 (0..1): x = valor en juego (ordinal, no a escala), y = riesgo (0 abajo, 1 arriba) */
  x: number;
  y: number;
  /** y con los controles de la lección 35 (solo cambia la de las dudas de garantía) */
  y2?: number;
}
export const CASES: UseCase[] = [
  { id: 'garantia', name: { es: 'Contestar dudas de garantía', en: 'Answering warranty questions' }, short: { es: 'Dudas de garantía', en: 'Warranty questions' }, freq: 2000, min: 6, risk: 'mid', x: 0.84, y: 0.5, y2: 0.31 },
  { id: 'diagnostico', name: { es: 'Apoyar diagnósticos en el taller', en: 'Helping with workshop diagnoses' }, short: { es: 'Diagnóstico en el taller', en: 'Workshop diagnoses' }, freq: 300, min: 30, risk: 'high', x: 0.75, y: 0.68 },
  { id: 'catalogo', name: { es: 'Redactar el catálogo', en: 'Writing the catalog' }, short: { es: 'Catálogo', en: 'Catalog' }, freq: 40, min: 15, risk: 'low', x: 0.36, y: 0.37 },
  { id: 'redes', name: { es: 'Ideas para redes sociales', en: 'Social media ideas' }, short: { es: 'Ideas para redes', en: 'Social media ideas' }, freq: 20, min: 15, risk: 'low', x: 0.17, y: 0.27 },
  { id: 'curriculos', name: { es: 'Filtrar currículos', en: 'Screening résumés' }, short: { es: 'Filtrar currículos', en: 'Screening résumés' }, freq: 20, min: 6, risk: 'high', x: 0.16, y: 0.68 },
];
export const caseById = (id: string) => CASES.find((c) => c.id === id) ?? CASES[0];
/** Valor en juego: horas de trabajo al mes = veces al mes × minutos de cada vez ÷ 60. */
export const hoursOf = (c: UseCase) => (c.freq * c.min) / 60;

// ── costo por tarea (lección 26) ────────────────────────────────────────────────────────────────────
export const TOK = { tin: 3500, tout: 300, pin: 3, pout: 15 };   // tokens por duda y dólares por millón de tokens
export const costIn = (TOK.tin * TOK.pin) / 1e6;     // 0.0105
export const costOut = (TOK.tout * TOK.pout) / 1e6;  // 0.0045
export const perTask = costIn + costOut;             // 0.015 dólares: un centavo y medio

// ── costo total y retorno del primer año (supuestos editables) ──────────────────────────────────────
export const A = {
  /** costo de una hora de trabajo, dólares */
  h: 10,
  /** una vez: construir e integrar; preparar datos y casos de oro */
  build: 4000, prep: 2000,
  /** cada mes: servicio y monitoreo; personas que revisan una muestra y mantienen el manual (40 h × 10 dólares) */
  svc: 70, people: 400,
  /** dudas al mes y minutos ahorrados por duda (valores de partida) */
  vol: 2000, min: 6,
};
export const ONCE = A.build + A.prep;      // 6 000
export const MONTHLY = A.svc + A.people;   // 470

export interface Year1 {
  /** beneficio del primer año */
  benefit: number;
  /** partes del costo total del primer año */
  build: number; prep: number; svc: number; people: number; tokens: number;
  tco: number;
  /** retorno neto = beneficio − costo total */
  ret: number;
  /** mes en que se recupera la inversión inicial (Infinity si no se recupera) */
  payback: number;
}
export function year1(vol: number, min: number): Year1 {
  const perMonthBenefit = vol * (min / 60) * A.h;
  const tokensMonth = vol * perTask;
  const benefit = 12 * perMonthBenefit;
  const tokens = 12 * tokensMonth, svc = 12 * A.svc, people = 12 * A.people;
  const tco = A.build + A.prep + svc + people + tokens;
  const net = perMonthBenefit - tokensMonth - MONTHLY;
  return { benefit, build: A.build, prep: A.prep, svc, people, tokens, tco, ret: benefit - tco, payback: net > 0 ? ONCE / net : Infinity };
}
/** Dudas al mes con las que el primer año queda en cero (con `min` minutos ahorrados). */
export const breakEvenVol = (min: number) => (ONCE / 12 + MONTHLY) / ((min / 60) * A.h - perTask);
/** Minutos ahorrados por duda con los que el primer año queda en cero (con `vol` dudas al mes). */
export const breakEvenMin = (vol: number) => (60 / A.h) * ((ONCE / 12 + MONTHLY) / vol + perTask);
