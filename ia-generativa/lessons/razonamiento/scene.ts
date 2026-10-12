// Escena: Modelos de razonamiento. Vistas que se funden una en otra:
//  1 · el problema del tren; una pasada por token; contestar de inmediato           (hook … instant)
//  2 · 32 intentos reales sin pensar (Qwen3.5-4B): menos de la mitad aciertan        (tries … count0)
//  3 · paso a paso; la cadena de pensamiento: contexto y pasadas                     (by-hand … cot-name)
//  4 · Wei et al. (2022): ocho ejemplos; PaLM 540B frente a 8B                       (cot-wei … cot-small)
//  5 · modelos de razonamiento: o1, la forma de su salida; nuestro modelo pensando   (rm-intro … rm-ours)
//  6 · cómo se entrenan: un juez que comprueba (recompensa verificable); DeepSeek-R1 (rl-recall … r1-long)
//  7 · cómputo en tiempo de prueba; el presupuesto de pensamiento                    (ttc … try-budget)   → turno 1
//  8 · votar: autoconsistencia y su límite                                           (vote-idea … try-vote) → turno 2
//  9 · costo y espera; cuándo conviene; límites; resumen, lente y puente.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo
// que hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento (ui.fr).
// Los datos de los intentos son reales (data.ts, ver tools/); las cifras de artículos están en runs.ts con su fuente.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { BUDGETS, B_MAX } from './runs';
import { drawProblem, drawTries } from './v-intro';
import { drawPapers, drawSteps } from './v-cot';
import { drawOurs, drawR1, drawReasoning, drawRL, drawTTC } from './v-rl';
import { drawBudget } from './v-budget';
import { drawVote } from './v-vote';
import { drawBridge, drawCost, drawLens, drawLimits, drawRecap } from './v-end';
import { fmtInt, fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const MEASURED = (S: Frame) => S.l('medido: Qwen3.5-4B, temperatura 0.7, 32 intentos por caso (data.ts)', 'measured: Qwen3.5-4B, temperature 0.7, 32 tries per case (data.ts)');
const VIEWS: View[] = [
  { from: 'hook', to: 'tries', draw: drawProblem, src: (S) => (S.on('one-pass') ? S.l('respuesta real: primer intento de Qwen3.5-4B sin pensar', 'real answer: first try of Qwen3.5-4B without thinking') : '') },
  { from: 'tries', to: 'by-hand', draw: drawTries, src: MEASURED },
  { from: 'by-hand', to: 'cot-wei', draw: drawSteps, src: (S) => (S.on('cot-passes') ? S.l('tokens contados con el tokenizador de Qwen3.5 (cada cifra, un token)', 'tokens counted with the Qwen3.5 tokenizer (each digit, one token)') : '') },
  { from: 'cot-wei', to: 'rm-intro', draw: drawPapers, src: (S) => S.l('Wei et al. (2022), tabla 2 · GSM8K', 'Wei et al. (2022), table 2 · GSM8K') },
  { from: 'rm-intro', to: 'rm-ours', draw: drawReasoning, src: (S) => (S.on('rm-shape') ? S.l('OpenAI (2024): o1 muestra un resumen · Anthropic (2026)', 'OpenAI (2024): o1 shows a summary · Anthropic (2026)') : S.l('Wei et al. (2022) · OpenAI (2024)', 'Wei et al. (2022) · OpenAI (2024)')) },
  { from: 'rm-ours', to: 'rl-recall', draw: drawOurs, src: MEASURED },
  { from: 'rl-recall', to: 'r1', draw: drawRL, src: (S) => (S.on('rl-loop') ? S.l('intentos ilustrativos · DeepSeek-AI (2025)', 'illustrative tries · DeepSeek-AI (2025)') : S.on('verifiable') ? S.l('Lambert et al. (2024) · DeepSeek-AI (2025)', 'Lambert et al. (2024) · DeepSeek-AI (2025)') : S.l('lección 28: RLHF y modelo de recompensa', 'lesson 28: RLHF and reward model')) },
  { from: 'r1', to: 'ttc', draw: drawR1, src: (S) => S.l('DeepSeek-AI (2025): figura 1 y tabla 2', 'DeepSeek-AI (2025): figure 1 and table 2') },
  { from: 'ttc', to: 'budget', draw: drawTTC, src: MEASURED },
  { from: 'budget', to: 'vote-idea', draw: drawBudget, src: (S) => S.l('medido: Qwen3.5-4B · presupuesto forzado como en Muennighoff et al. (2025)', 'measured: Qwen3.5-4B · budget forcing as in Muennighoff et al. (2025)') },
  { from: 'vote-idea', to: 'cost-tokens', draw: drawVote, src: (S) => (S.between('sc-palm', 'vote-limit') ? S.l('Wang et al. (2023)', 'Wang et al. (2023)') : MEASURED(S)) },
  { from: 'cost-tokens', to: 'limit-plausible', draw: drawCost, src: (S) => (S.on('when') ? '' : S.l('Anthropic (2026): el pensamiento se cobra como salida · tokens: medidos · espera: supuesto', 'Anthropic (2026): thinking is billed as output · tokens: measured · wait: assumption')) },
  { from: 'limit-plausible', to: 'recap', draw: drawLimits, src: (S) => (S.on('limit-faithful') ? S.l('Chen et al. (2025), Anthropic', 'Chen et al. (2025), Anthropic') : S.l('ejemplo ilustrativo', 'illustrative example')) },
  { from: 'recap', to: 'lens', draw: drawRecap },
  { from: 'lens', to: 'bridge', draw: drawLens },
  { from: 'bridge', draw: drawBridge },
];

interface St { lastT: number; budShown: number; vbShown: number; budSeen: Set<number>; vbSeen: Set<number>; lastBud?: number; lastVb?: number }
const fresh = (): St => ({ lastT: -1, budShown: B_MAX, vbShown: 0, budSeen: new Set(), vbSeen: new Set() });
const stOf = (S: Frame): St => { const s = S.st as unknown as { q?: St }; return (s.q ??= fresh()); };
const fmtBud = (v: number, l: 'es' | 'en') => `${fmtInt(BUDGETS[Math.round(v)] ?? 0, l)} tokens`;

/** Presupuesto que muestra la demostración en cada momento (índice de BUDGETS). */
function budDemo(S: Frame) {
  if (S.is('budget')) return fr(S, 'budget', 0.56, 0.57, 'lin') > 0 ? 4 : B_MAX;
  if (S.is('axis-x') || S.is('axis-y')) return 0;
  if (S.is('demo-low')) return fr(S, 'demo-low', 0.2, 0.21, 'lin') > 0 ? 1 : 0;
  if (S.is('demo-mid')) return fr(S, 'demo-mid', 0.62, 0.63, 'lin') > 0 ? 4 : fr(S, 'demo-mid', 0.3, 0.31, 'lin') > 0 ? 3 : 2;
  if (S.is('demo-high')) return fr(S, 'demo-high', 0.72, 0.73, 'lin') > 0 ? 8 : fr(S, 'demo-high', 0.56, 0.57, 'lin') > 0 ? 7 : fr(S, 'demo-high', 0.4, 0.41, 'lin') > 0 ? 6 : 5;
  return B_MAX;
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'bud', kind: 'slider', label: { es: 'Presupuesto de pensamiento', en: 'Thinking budget' }, min: 0, max: B_MAX, step: 1, value: B_MAX, fmt: fmtBud, from: 'budget', to: 'vote-idea' },
    { id: 'vb', kind: 'slider', label: { es: 'Presupuesto para votar', en: 'Budget for voting' }, min: 0, max: B_MAX, step: 1, value: 0, fmt: fmtBud, from: 'vote-idea', to: 'cost-tokens' },
  ],

  init(S) { (S.st as unknown as { q: St }).q = fresh(); },

  update(S) {
    const q = stOf(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = q.lastT < 0 || Math.abs(S.t - q.lastT) > 0.35;   // salto (o captura): sin transición
    q.lastT = S.t;
    const ease = (cur: number, target: number, rate = 7) => (jump ? target : cur + (target - cur) * (1 - Math.exp(-dt * rate)));

    // ── turno 1: el presupuesto de pensamiento ──
    let rev = 0;
    if (S.between('budget', 'vote-idea')) {
      const want = budDemo(S);
      S.drive('bud', want);
      const v = Math.round(Number(S.p.bud ?? want));
      // puntos de la gráfica ya mostrados: los que recorrió la demostración (o todos, si la persona tomó el control)
      rev = S.touched.has('bud') || S.on('natural') ? B_MAX : S.on('demo-low') ? want : 0;
      if (S.between('try-budget', 'vote-idea') && S.touched.has('bud')) {
        q.budSeen.add(v);
        if (q.budSeen.size >= 2) S.complete('budget');
      }
      q.budShown = ease(q.budShown, v, 8);
    }
    S.st.budRev = rev;
    S.st.budShown = q.budShown;

    // ── turno 2: el presupuesto de los intentos que votan ──
    if (S.between('vote-idea', 'cost-tokens')) {
      const want = S.is('vote-limit') ? (fr(S, 'vote-limit', 0.3, 0.31, 'lin') > 0 ? 1 : 0) : S.on('try-vote') ? 1 : 0;
      S.drive('vb', want);
      const v = Math.round(Number(S.p.vb ?? want));
      if (S.between('try-vote', 'cost-tokens') && S.touched.has('vb')) {
        q.vbSeen.add(v);
        if (q.vbSeen.size >= 2) S.complete('vote');
      }
      q.vbShown = ease(q.vbShown, v, 6);
    }
    S.st.vbShown = q.vbShown;
  },

  render(S) {
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      S.d.withAlpha(a, () => v.draw(S));
      const src = v.src?.(S);
      if (src) provenance(S, src, a);
    }
    // cada vista se adapta con S.portrait (y ui.flat para el teléfono en horizontal)
    void S.portrait;
  },
});

export default scene;
