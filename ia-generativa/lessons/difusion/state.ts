// Estado interactivo y cálculos compartidos por la escena y sus vistas. Los muestreos del plano son caros (≈ 0.15–0.3 s cada uno):
// update() los adelanta por partes en los segmentos previos y los termina justo cuando hacen falta; render() solo los lee.
import { clamp, gauss, rng, type Frame } from '../../../../../theme/kit';
import { CODES, LAB, NCODES, NULL, T, latJob, latMove, readDigit, vaeDec, type LatJob } from './models';
import { DEMO } from './demo';
import { fr } from './helpers';

export interface St {
  fwdHi: boolean;                 // gate «fwd»: la persona llevó el paso al final
  revLo: boolean; revHi: boolean; // gate «rev»: recorrió el regreso de un extremo al otro
  scLo: boolean; scHi: boolean;   // gate «scale»: probó una escala baja y una alta
  lastScale: number; regenAt: number;
}
export const newSt = (): St => ({ fwdHi: false, revLo: false, revHi: false, scLo: false, scHi: false, lastScale: -1, regenAt: -99 });
export const stOf = (S: Frame): St => (S.st.s ??= newSt()) as St;

/** Muestreo sin pista (la nube del regreso). */
export const unc = (): LatJob => latJob(DEMO.planeSeed, DEMO.nPts, NULL, 0);
/** Muestreo con la pista «siete» y escala s (con s = 0 es el mismo que sin pista: misma estática, mismo azar). */
export const guidedJob = (s: number): LatJob => (s === 0 ? unc() : latJob(DEMO.planeSeed, DEMO.nPts, 7, s));
export const SCALE_DEMO = [0, 1, 5];
/** Fases de la demostración de la escala dentro de «scale-demo» (fracción en que empieza cada valor). */
export const SCALE_PHASE = [0, 0.32, 0.62];

/** Valor de la escala que se ve y cuántos pasos del regreso mostrar (se regenera la nube al cambiarla). */
export function scaleView(S: Frame): { s: number; k: number } {
  const st = stOf(S), s = S.p.scale ?? 0;
  if (S.touched.has('scale')) return { s, k: Math.round(T * clamp((S.clock - st.regenAt) / 0.9)) };
  if (S.is('scale-demo')) {
    let ph = 0; SCALE_PHASE.forEach((a, i) => { if (fr(S, 'scale-demo', a, a + 0.001) > 0) ph = i; });
    const k = ph === 0 ? T : Math.round(T * fr(S, 'scale-demo', SCALE_PHASE[ph], SCALE_PHASE[ph] + 0.16, 'io'));
    return { s: SCALE_DEMO[ph], k };
  }
  return { s, k: T };
}
/** Puntos del muestreo guiado que se muestran (o null si aún no están calculados). */
export function guidedPts(S: Frame): Float32Array | null {
  const { s, k } = scaleView(S), j = guidedJob(s), n = j.traj.length - 1;
  return j.traj[Math.min(n, k)] ?? null;
}

// ── selecciones deterministas (se calculan una vez) ───────────────────────────
let six: number[] | null = null;
/** Seis puntos del muestreo sin pista que se decodifican en dígitos distintos. */
export function sixPoints(): number[] {
  if (six) return six;
  const j = unc().finish(), q = j.traj[T], seen = new Set<number>(), out: number[] = [];
  for (let p = 0; p < DEMO.nPts && out.length < 6; p++) { const d = readDigit(vaeDec(q[2 * p], q[2 * p + 1])); if (!seen.has(d)) { seen.add(d); out.push(p); } }
  six = out;
  return out;
}
let star: { p: number; x: number; y: number; u: [number, number]; c: [number, number] } | null = null;
/** El punto de las dos flechas (sin pista / con la pista «siete»): a media trayectoria, donde las dos estimaciones más difieren. */
export const STAR_K = 22;
export function starPoint() {
  if (star) return star;
  const q = unc().finish().traj[STAR_K], i = T - 1 - STAR_K;
  let best = -1, bd = -1, bu: [number, number] = [0, 0], bc: [number, number] = [0, 0];
  for (let p = 0; p < DEMO.nPts; p++) {
    const x = q[2 * p], y = q[2 * p + 1];
    if (x > 1.2 || Math.hypot(x, y) > 2.6) continue;        // lejos del grupo de los sietes y dentro del plano
    const u = latMove(x, y, i, NULL, 0), c = latMove(x, y, i, 7, 1), dd = Math.hypot(c[0] - u[0], c[1] - u[1]);
    if (dd > bd) { bd = dd; best = p; bu = u; bc = c; }
  }
  star = { p: best, x: q[2 * best], y: q[2 * best + 1], u: bu, c: bc };
  return star;
}
/** Índices de los sietes reales. */
export const SEVENS_IDX: number[] = (() => { const o: number[] = []; for (let i = 0; i < NCODES; i++) if (LAB[i] === 7) o.push(i); return o; })();
const coverMemo = new Map<number, number[]>();
/** Sietes reales sin ningún punto nuevo a menos de 0.3 (para la escala s, con el muestreo terminado). */
export function uncovered(s: number): number[] | null {
  const j = guidedJob(s);
  if (!j.done) return null;
  let u = coverMemo.get(s);
  if (u) return u;
  const q = j.traj[T]; u = [];
  for (const i of SEVENS_IDX) {
    const a = CODES[2 * i], b = CODES[2 * i + 1];
    let ok = false;
    for (let p = 0; p < DEMO.nPts && !ok; p++) if ((q[2 * p] - a) ** 2 + (q[2 * p + 1] - b) ** 2 < 0.09) ok = true;
    if (!ok) u.push(i);
  }
  coverMemo.set(s, u);
  return u;
}
const sevMemo = new Map<number, number>();
/** Cuántos de los puntos guiados (terminados) se leen como siete. */
export function sevensCount(s: number): number | null {
  const j = guidedJob(s);
  if (!j.done) return null;
  let c = sevMemo.get(s);
  if (c === undefined) { const q = j.traj[T]; c = 0; for (let p = 0; p < DEMO.nPts; p++) if (readDigit(vaeDec(q[2 * p], q[2 * p + 1])) === 7) c++; sevMemo.set(s, c); }
  return c;
}
/** Ruido fijo de cada dato para deshacer la nube en el proceso hacia delante. */
export const DATA_EPS = (() => { const r = rng(DEMO.dataNoiseSeed); return Float32Array.from({ length: NCODES * 2 }, () => gauss(r)); })();
