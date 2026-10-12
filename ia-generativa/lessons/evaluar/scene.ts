// Escena: Evaluar sistemas de IA. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar
// la siguiente):
//  1 · la pregunta: el examen público frente a tus casos                                   (hook, recall)
//  2 · qué es un benchmark; una pregunta real de MMLU                                      (bench … bench-a)
//  3 · la línea de 0 a 100: azar, GPT-3, GPT-4, experto, techo                              (score … saturation)
//  4 · contaminación: internet → entrenamiento → modelo                                    (contam, contam-name)
//  5 · el examen de A y la tabla; «tu turno»: la parte del examen que vio A               (contam-demo … try-contam)
//  6 · GSM1k (esquema) · 7 · Goodhart (ilustrativo)                                         (gsm1k; goodhart)
//  8 · un caso de oro y el conjunto de evaluación · 9 · la mezcla y la nota por grupo     (gold … eval-set; mix … avg)
// 10 · quién califica: programa, rúbrica, LLM como juez · 11 · cuánto coincide con expertos (grade … judge; judge-agree)
// 12 · sesgo de orden · 13 · personas como referencia                                      (position, position-num; human)
// 14 · tu nota y su margen: la montaña de 100 resultados, ± 8 y ± 4                        (one-eval … ci-400)
// 15 · dos sistemas: márgenes que se enciman, 100 comparaciones; «tu turno»: los casos    (two … try-n)
// 16 · la regla del empate · 17 · mismos casos o distintos                                 (tie; paired)
// 18 · la nota caduca · 19 · regresión · 20 · red teaming · 21 · negocio · repaso y puente.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo que hizo
// la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento (ui.ts: fr).
//
// REAL: MMLU (Hendrycks et al. 2020), GPT-4 (OpenAI 2023), Phan et al. 2025, GSM1k (Zhang et al. 2024), Zheng et al. 2023,
//       Chen, Zaharia y Zou 2023, Ganguli et al. 2022.
// SIMULACIÓN REAL con supuestos rotulados (stats.ts): exactitud real 78 % (A) y 74 % (B), mismos casos, 100 repeticiones.
// ILUSTRATIVO (rotulado): la tabla del proveedor, el modelo A que memorizó, la mesa de ayuda de viáticos, la rúbrica, la
// regresión, los ataques de ejemplo.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { N_IDX_100, N_STEPS } from './stats';
import { drawBench, drawIntro, drawScale } from './v-bench';
import { drawGoodhart, drawGsm, drawLeak, drawSeen } from './v-contam';
import { drawGold, drawMix } from './v-gold';
import { drawAgree, drawGrade, drawHuman, drawPosition } from './v-judge';
import { drawOne, drawPaired, drawTie, drawTwo } from './v-uncert';
import { drawBridge, drawBusiness, drawDrift, drawRecap, drawRedteam, drawRegress } from './v-ops';
import { fr, provenance, win } from './ui';

interface St { lastT: number; seenNow: number; seenPrev: number; seenK: number; idx: number; prevIdx: number; idxK: number }
const fresh = (): St => ({ lastT: -1, seenNow: 0, seenPrev: 0, seenK: 1, idx: N_IDX_100, prevIdx: N_IDX_100, idxK: 1 });
const st = (S: Frame): St => (S.st.ev ??= fresh()) as St;

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'bench', draw: drawIntro, src: (S) => S.l('Ilustrativo', 'Illustrative') },
  { from: 'bench', to: 'score', draw: drawBench, src: (S) => (S.on('bench-q') ? S.l('MMLU: Hendrycks y colaboradores (2020), figura 1', 'MMLU: Hendrycks and colleagues (2020), figure 1') : S.l('Esquema', 'Diagram')) },
  { from: 'score', to: 'contam', draw: drawScale, src: (S) => (S.on('saturation') ? S.l('Hendrycks et al. (2020) · OpenAI (2023) · Phan et al. (2025)', 'Hendrycks et al. (2020) · OpenAI (2023) · Phan et al. (2025)') : S.l('Hendrycks et al. (2020) · OpenAI (2023)', 'Hendrycks et al. (2020) · OpenAI (2023)')) },
  { from: 'contam', to: 'contam-demo', draw: drawLeak, src: (S) => S.l('Esquema', 'Diagram') },
  { from: 'contam-demo', to: 'gsm1k', draw: (S) => { const s = st(S); drawSeen(S, s.seenNow, s.seenPrev, s.seenK); }, src: (S) => S.l('Ejemplo ilustrativo: lo que A vio lo acierta siempre', 'Illustrative example: whatever A saw, it always gets right') },
  { from: 'gsm1k', to: 'goodhart', draw: drawGsm, src: (S) => S.l('Esquema · cifras: Zhang et al. (2024), GSM1k', 'Diagram · figures: Zhang et al. (2024), GSM1k') },
  { from: 'goodhart', to: 'gold', draw: drawGoodhart, src: (S) => S.l('Curvas ilustrativas', 'Illustrative curves') },
  { from: 'gold', to: 'mix', draw: drawGold, src: (S) => S.l('Ejemplo ilustrativo', 'Illustrative example') },
  { from: 'mix', to: 'grade', draw: drawMix, src: (S) => S.l('Ilustrativo · mezcla real: 70, 20, 7 y 3 de cada 100', 'Illustrative · real mix: 70, 20, 7, and 3 of every 100') },
  { from: 'grade', to: 'judge-agree', draw: drawGrade, src: (S) => S.l('Ejemplo ilustrativo', 'Illustrative example') },
  { from: 'judge-agree', to: 'position', draw: drawAgree, src: (S) => S.l('Zheng et al. (2023), tabla 5', 'Zheng et al. (2023), table 5') },
  { from: 'position', to: 'human', draw: drawPosition, src: (S) => (S.on('position-num') ? S.l('Zheng et al. (2023), tabla 2: respuestas casi idénticas', 'Zheng et al. (2023), table 2: nearly identical answers') : S.l('Ejemplo ilustrativo', 'Illustrative example')) },
  { from: 'human', to: 'one-eval', draw: drawHuman, src: (S) => S.l('Ejemplo ilustrativo', 'Illustrative example') },
  { from: 'one-eval', to: 'two', draw: drawOne, src: (S) => S.l('Simulación: exactitud real del 78 %', 'Simulation: true accuracy of 78%') },
  { from: 'two', to: 'tie', draw: (S) => { const s = st(S); drawTwo(S, { idx: s.idx, prev: s.prevIdx, k: s.idxK }); }, src: (S) => S.l('Simulación: A 78 % y B 74 % reales, mismos casos', 'Simulation: A 78% and B 74% true, same cases') },
  { from: 'tie', to: 'paired', draw: drawTie, src: (S) => S.l('Margen del intervalo de confianza al 95 %', 'Margin of the 95% confidence interval') },
  { from: 'paired', to: 'drift', draw: drawPaired, src: (S) => S.l('Simulación: 100 comparaciones de 400 casos', 'Simulation: 100 comparisons of 400 cases') },
  { from: 'drift', to: 'regress', draw: drawDrift, src: (S) => S.l('Chen, Zaharia y Zou (2023): 500 primos y 500 compuestos', 'Chen, Zaharia, and Zou (2023): 500 primes, 500 composites') },
  { from: 'regress', to: 'redteam', draw: drawRegress, src: (S) => S.l('Ejemplo ilustrativo', 'Illustrative example') },
  { from: 'redteam', to: 'business', draw: drawRedteam, src: (S) => (S.on('redteam-case') ? S.l('Ganguli et al. (2022) · ataques de ejemplo ilustrativos', 'Ganguli et al. (2022) · illustrative example attacks') : S.l('Ataques de ejemplo ilustrativos', 'Illustrative example attacks')) },
  { from: 'business', to: 'recap', draw: drawBusiness, src: (S) => S.l('Ilustrativo', 'Illustrative') },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

/** Parte del examen que vio A durante la demostración: 0 → 10 → 20 (empate) → 30 → 40. */
function demoSeen(S: Frame): number {
  if (S.on('try-contam')) return 40;
  return fr(S, 'contam-more', 0.72, 0.73) > 0 ? 40 : fr(S, 'contam-more', 0.6, 0.61) > 0 ? 30 : fr(S, 'contam-more', 0.36, 0.37) > 0 ? 20 : fr(S, 'contam-more', 0.2, 0.21) > 0 ? 10 : 0;
}
/** Casos por comparación durante la demostración: 100 → 200 → 400 → 1 000 (índices de N_STEPS). */
function demoIdx(S: Frame): number {
  if (S.on('try-n')) return 5;
  return fr(S, 'demo-n', 0.74, 0.75) > 0 ? 5 : fr(S, 'demo-n', 0.5, 0.51) > 0 ? 4 : fr(S, 'demo-n', 0.22, 0.23) > 0 ? 3 : N_IDX_100;
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'seen', kind: 'slider', label: { es: 'Parte del examen que vio A', en: 'Share of the exam A saw' }, min: 0, max: 40, step: 10, value: 0, from: 'contam-more', to: 'gsm1k', fmt: (v, l) => (l === 'es' ? `${v} %` : `${v}%`) },
    { id: 'nidx', kind: 'slider', label: { es: 'Casos en cada comparación', en: 'Cases in each comparison' }, min: 0, max: N_STEPS.length - 1, step: 1, value: N_IDX_100, from: 'demo-n', to: 'tie', fmt: (v, l) => { const n = N_STEPS[clamp(Math.round(v), 0, N_STEPS.length - 1)]; return l === 'es' ? n.toLocaleString('en-US').replace(/,/g, ' ') : n.toLocaleString('en-US'); } },
  ],

  init(S) { S.st.ev = fresh(); },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = s.lastT < 0 || Math.abs(S.t - s.lastT) > 0.35;   // salto (o captura): sin transición
    s.lastT = S.t;

    // ── contaminación: la parte del examen que vio A ──
    let seen = 0;
    if (S.between('contam-more', 'gsm1k')) {
      seen = clamp(Math.round(Number(S.drive('seen', demoSeen(S))) / 10) * 10, 0, 40);
      if (S.touched.has('seen')) S.complete('contam');
    }
    if (seen !== s.seenNow) { s.seenPrev = s.seenNow; s.seenNow = seen; s.seenK = jump ? 1 : 0; }
    s.seenK = jump ? 1 : Math.min(1, s.seenK + dt / 0.35);

    // ── dos sistemas: casos en cada comparación ──
    let idx = N_IDX_100;
    if (S.between('demo-n', 'tie')) {
      idx = clamp(Math.round(Number(S.drive('nidx', demoIdx(S)))), 0, N_STEPS.length - 1);
      if (S.touched.has('nidx')) S.complete('samplesize');
    }
    if (idx !== s.idx) { s.prevIdx = s.idx; s.idx = idx; s.idxK = jump ? 1 : 0; }
    s.idxK = jump ? 1 : Math.min(1, s.idxK + dt / 0.45);
  },

  render(S) {
    const d = S.d;
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      d.withAlpha(a, () => v.draw(S));
      if (v.src) provenance(S, v.src(S), a);
    }
  },
});

export default scene;
