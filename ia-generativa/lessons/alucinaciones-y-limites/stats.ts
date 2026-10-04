// Estadísticas sobre las mediciones reales de Pythia (ver real-data.ts). Funciones puras y baratas: se llaman en cada fotograma.
import { QA } from './real-data';

export const N = QA.n;
const CONF = QA.conf;
const OK = [...QA.ok].map((c) => c === '1');

/** Cuenta, para un umbral θ: respondidas (confianza ≥ θ), aciertos y errores entre ellas, y calladas. */
export interface Outcome { answered: number; correct: number; wrong: number; silent: number; errRate: number; coverage: number }
const memo = new Map<number, Outcome>();
export function outcome(theta: number): Outcome {
  const key = Math.round(theta * 10000);
  const hit = memo.get(key); if (hit) return hit;
  let correct = 0, wrong = 0;
  for (let i = 0; i < N; i++) if (CONF[i] >= theta - 1e-9) { if (OK[i]) correct++; else wrong++; }
  const answered = correct + wrong;
  const o = { answered, correct, wrong, silent: N - answered, errRate: answered ? wrong / answered : 0, coverage: answered / N };
  memo.set(key, o);
  return o;
}

/** Puntaje: cada acierto suma 1, cada error resta k, callar vale 0. */
export const score = (theta: number, k: number) => { const o = outcome(theta); return o.correct - k * o.wrong; };

/** Mejor umbral para un costo k (el más bajo entre los empatados) y su puntaje. Se recorre cada confianza observada. */
const bestMemo = new Map<number, { theta: number; score: number; lo: number; hi: number }>();
export function best(k: number) {
  const hit = bestMemo.get(k); if (hit) return hit;
  const cands = [0, ...[...new Set(CONF)].sort((a, b) => a - b), 1.0001];
  let bs = -Infinity, bt = 0, lo = 0, hi = 0;
  for (const t of cands) {
    const s = score(t, k);
    if (s > bs + 1e-9) { bs = s; bt = t; lo = t; hi = t; } else if (Math.abs(s - bs) < 1e-9) hi = t;
  }
  // el máximo se alcanza en el intervalo [bt, siguiente confianza): se informa el punto medio de ese tramo
  const nxt = cands.find((t) => t > bt + 1e-9) ?? 1;
  const r = { theta: Math.min(1, (bt + nxt) / 2), score: bs, lo: bt, hi: nxt };
  bestMemo.set(k, r);
  return r;
}

/** Regla teórica: responder si la confianza supera k/(k+1) (vale para una confianza calibrada). */
export const rule = (k: number) => k / (k + 1);

/** Diagrama de fiabilidad: `nb` tramos de igual ancho de confianza. */
export interface Bin { lo: number; hi: number; n: number; acc: number; conf: number }
export function reliability(nb = 10): Bin[] {
  const bins: Bin[] = [];
  for (let b = 0; b < nb; b++) {
    const lo = b / nb, hi = (b + 1) / nb;
    let n = 0, ok = 0, c = 0;
    for (let i = 0; i < N; i++) if (CONF[i] >= lo && (CONF[i] < hi || (b === nb - 1 && CONF[i] <= 1))) { n++; if (OK[i]) ok++; c += CONF[i]; }
    bins.push({ lo, hi, n, acc: n ? ok / n : 0, conf: n ? c / n : (lo + hi) / 2 });
  }
  return bins;
}
/** Error de calibración esperado (ECE) con `nb` tramos de igual ancho. */
export const ece = (nb = 10) => reliability(nb).reduce((s, b) => s + (b.n / N) * Math.abs(b.acc - b.conf), 0);

export const accuracy = () => OK.filter(Boolean).length / N;
/** Exactitud entre las respuestas con confianza dentro de [lo, hi). */
export function accIn(lo: number, hi: number) {
  let n = 0, ok = 0;
  for (let i = 0; i < N; i++) if (CONF[i] >= lo && CONF[i] < hi) { n++; if (OK[i]) ok++; }
  return { n, ok, acc: n ? ok / n : 0 };
}
