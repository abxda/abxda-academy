// Escena: Inferencia, cómo responde un modelo. Vistas que se funden una en otra:
//  1 · el chat, entrenar frente a usar, servir a muchas personas         (hook · inference · serving)
//  2 · las dos fases: llenado y decodificación, con su línea de tiempo    (example … phases-time)
//  3 · la caché KV: la tabla de vueltas, cuánto pesa, la memoria de la GPU (attn-recall … kv-long)    → turno 1 (largo)
//  4 · el ancho de banda marca el paso; lotes, latencia y rendimiento      (read-all … tradeoff)       → turno 2 (lote)
//  5 · lo que paga quien usa el modelo: entrada, salida y tres tareas      (api-price … try-task)      → turno 3 (tarea)
//  6 · mezcla de expertos, decodificación especulativa, resumen, lente y puente.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo que
// hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { LLAMA, bill, type TaskId } from './model';
import { drawChat, drawServing, drawTrainUse } from './v-intro';
import { drawPipe } from './v-pipe';
import { drawAttnRecall, drawGrids, drawKvBytes, drawMemory } from './v-cache';
import { drawSpeed } from './v-speed';
import { drawCost } from './v-cost';
import { drawBridge, drawLens, drawMoe, drawRecap, drawSpec } from './v-end';
import { fmtInt, fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'inference', draw: drawChat },
  { from: 'inference', to: 'serving', draw: drawTrainUse },
  { from: 'serving', to: 'example', draw: drawServing },
  { from: 'example', to: 'attn-recall', draw: drawPipe },
  { from: 'attn-recall', to: 'recompute', draw: drawAttnRecall, src: (S) => S.l('pesos de atención: lección 21', 'attention weights: lesson 21') },
  { from: 'recompute', to: 'kv-price', draw: drawGrids, src: (S) => S.l('6 tokens de entrada y 10 de salida · comprobado con un transformer de juguete (tiny.ts)', '6 input and 10 output tokens · checked with a toy transformer (tiny.ts)') },
  { from: 'kv-price', to: 'kv-demo', draw: drawKvBytes, src: (S) => S.l('Llama 3 8B: Llama Team (2024), tabla 3', 'Llama 3 8B: Llama Team (2024), table 3') },
  { from: 'kv-demo', to: 'read-all', draw: drawMemory, src: (S) => S.l('Llama 3 (2024), tabla 3 · ficha de la H100 (NVIDIA)', 'Llama 3 (2024), table 3 · H100 datasheet (NVIDIA)') },
  { from: 'read-all', to: 'api-price', draw: drawSpeed, src: (S) => S.l('ficha de la H100 · Pope et al. (2022) · precio de la GPU: supuesto', 'H100 datasheet · Pope et al. (2022) · GPU price: assumption') },
  { from: 'api-price', to: 'moe-idea', draw: drawCost, src: (S) => S.l('listas de Anthropic y Google (12 oct 2026) · esperas: estimación, modelo de 8 mil M en una H100', 'Anthropic and Google price lists (Oct 12, 2026) · waits: estimate, 8B model on one H100') },
  { from: 'moe-idea', to: 'spec', draw: drawMoe, src: (S) => S.l('Mixtral: Jiang et al. (2024) · qué expertos elige cada token: ilustrativo', 'Mixtral: Jiang et al. (2024) · which experts each token picks: illustrative') },
  { from: 'spec', to: 'recap', draw: drawSpec, src: (S) => S.l('Leviathan et al. (2023) · tokens de ejemplo', 'Leviathan et al. (2023) · example tokens') },
  { from: 'recap', to: 'lens', draw: drawRecap },
  { from: 'lens', to: 'bridge', draw: drawLens },
  { from: 'bridge', draw: drawBridge },
];

interface St { lastT: number; ctxShown: number; bShown: number; kvMin: number; kvMax: number; bMin: number; bMax: number; lastTask?: string; taskChanges: number; taskId: TaskId; taskEase?: Record<string, number> }
const fresh = (): St => ({ lastT: -1, ctxShown: 1000, bShown: 1, kvMin: Infinity, kvMax: -Infinity, bMin: Infinity, bMax: -Infinity, taskChanges: 0, taskId: 'contract' });
const stOf = (S: Frame): St => { const s = S.st as unknown as { q?: St }; return (s.q ??= fresh()); };

const scene: SceneFactory = () => ({
  controls: [
    { id: 'ctx', kind: 'slider', label: { es: 'Largo de la conversación', en: 'Conversation length' }, min: 1000, max: LLAMA.maxCtx, step: 1000, value: 1000, fmt: (v, l) => `${fmtInt(v, l)} tokens`, from: 'kv-demo', to: 'kv-many' },
    { id: 'batch', kind: 'slider', label: { es: 'Personas en el lote', en: 'People in the batch' }, min: 1, max: 60, step: 1, value: 1, fmt: (v) => String(Math.round(v)), from: 'batch-demo', to: 'api-price' },
    {
      id: 'task', kind: 'choice', label: { es: 'Tarea', en: 'Task' }, value: 'contract', from: 'task-contract', to: 'moe-idea',
      options: [
        { value: 'contract', label: { es: 'Resumir un contrato', en: 'Summarize a contract' } },
        { value: 'report', label: { es: 'Redactar un informe', en: 'Draft a report' } },
        { value: 'question', label: { es: 'Pregunta corta', en: 'Short question' } },
      ],
    },
  ],

  init(S) { (S.st as unknown as { q: St }).q = fresh(); },

  update(S) {
    const q = stOf(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = q.lastT < 0 || Math.abs(S.t - q.lastT) > 0.35;   // salto (o captura): sin transición
    q.lastT = S.t;
    const ease = (cur: number, target: number, rate = 7) => (jump ? target : cur + (target - cur) * (1 - Math.exp(-dt * rate)));

    // ── turno 1: el largo de la conversación ──
    if (S.between('kv-demo', 'kv-many')) {
      if (S.is('kv-demo')) S.drive('ctx', 1000 + 1000 * Math.round(127 * fr(S, 'kv-demo', 0.25, 0.85, 'io')));
      else S.drive('ctx', LLAMA.maxCtx);
      // el recorrido cuenta desde el valor que dejó la demostración; el turno se completa solo si lo movió la persona
      if (S.between('try-kv', 'kv-many')) {
        const v = Number(S.p.ctx ?? 1000);
        q.kvMin = Math.min(q.kvMin, v); q.kvMax = Math.max(q.kvMax, v);
        if (S.touched.has('ctx') && q.kvMax - q.kvMin >= 20000) S.complete('kv');
      }
    }
    const ctxTarget = S.between('kv-demo', 'kv-many') ? Number(S.p.ctx ?? 1000) : S.on('kv-many') ? LLAMA.maxCtx : 1000;
    q.ctxShown = ease(q.ctxShown, ctxTarget, 9);

    // ── turno 2: el tamaño del lote ──
    let bTarget = 1;
    if (S.between('batch-idea', 'batch-demo')) bTarget = S.is('batch-idea') ? 1 + 3 * Math.round(fr(S, 'batch-idea', 0.3, 0.55, 'lin')) : 4;
    if (S.between('batch-demo', 'api-price')) {
      if (S.is('batch-demo')) {
        const f = fr(S, 'batch-demo', 0.14, 0.85, 'io');
        S.drive('batch', fr(S, 'batch-demo', 0, 0.1, 'lin') < 1 ? 4 - Math.round(3 * fr(S, 'batch-demo', 0, 0.1, 'lin')) : 1 + Math.round(59 * f));
      } else if (S.is('cost-m')) S.drive('batch', fr(S, 'cost-m', 0.72, 0.8, 'lin') > 0 ? 1 + Math.round(59 * fr(S, 'cost-m', 0.72, 0.84, 'io')) : 1);
      else S.drive('batch', 60);
      bTarget = Number(S.p.batch ?? 1);
      if (S.between('try-batch', 'api-price')) {
        q.bMin = Math.min(q.bMin, bTarget); q.bMax = Math.max(q.bMax, bTarget);
        if (S.touched.has('batch') && q.bMax - q.bMin >= 8) S.complete('batch');
      }
    }
    q.bShown = ease(q.bShown, bTarget, 8);

    // ── turno 3: la tarea ──
    if (S.between('task-contract', 'moe-idea')) {
      const want: TaskId = S.is('task-contract') ? 'contract' : S.is('task-report') ? 'report' : S.is('task-wait') ? (fr(S, 'task-wait', 0.6, 0.62, 'lin') > 0 ? 'report' : 'contract') : 'report';
      S.drive('task', want);
      const cur = String(S.p.task ?? want) as TaskId;
      if (q.lastTask !== undefined && cur !== q.lastTask && S.touched.has('task') && S.between('try-task', 'moe-idea')) q.taskChanges++;
      q.lastTask = cur;
      if (q.taskChanges >= 1) S.complete('task');
      q.taskId = cur in { contract: 1, report: 1, question: 1 } ? cur : 'contract';
    }
    const b = bill(q.taskId), te = q.taskEase ?? (q.taskEase = { tin: b.tin, tout: b.tout, cin: b.cin, cout: b.cout, first: b.first, gen: b.gen });
    for (const k of ['tin', 'tout', 'cin', 'cout', 'first', 'gen'] as const) te[k] = ease(te[k], b[k], 6);

    // lo que lee render()
    S.st.ctxShown = q.ctxShown; S.st.ctxTarget = ctxTarget; S.st.bShown = q.bShown; S.st.taskId = q.taskId; S.st.taskEase = te;
  },

  render(S) {
    const d = S.d;
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      d.withAlpha(a, () => v.draw(S));
      if (v.src) provenance(S, v.src(S), a);
    }
    // portrait/regions: la escena se adapta con S.portrait en cada vista (ver ui.area y los layout() de cada archivo)
    void S.portrait;
  },
});

export default scene;
