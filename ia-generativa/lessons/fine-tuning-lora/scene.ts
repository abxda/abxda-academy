// Escena: Ajuste fino y LoRA. Vistas que se funden una en otra, cada una dueña de un tramo de segmentos:
//   el modelo base y tus ejemplos · la escala de datos · el modelo diminuto REAL (2 → 32 → 32 → 3) que se ajusta en el navegador:
//   ajuste completo, olvido y repaso · lo que cuesta en un modelo grande · la corrección de LoRA · la tabla de multiplicar
//   (columna × fila, rango uno y dos, B y A) · la cuenta con el deslizador de rango · el resultado en GPT-3 · B empieza en cero ·
//   adaptadores · LoRA en el modelo diminuto · QLoRA · prompt → RAG → ajuste fino · el asistente de decisión · datos y evaluación.
//
// La escena hace sola cada demostración moviendo sus controles con S.drive (el rango en rank-demo y gpt3-table; el caso en el
// asistente de decisión) mientras la persona no los toque; los dos «tu turno» son opcionales y se completan solo con lo que ella
// hace (S.touched). Todo se anima por fracciones de la duración de cada segmento (las voces y los idiomas duran distinto).
// REAL: el entrenamiento del modelo diminuto (runs.ts, tinynet.ts; datos sintéticos en task.ts, base en base.ts) y las cifras de
// los artículos citados. ILUSTRATIVO (rotulado): los pares de ejemplo, las tiras B y A del deslizador y los casos de decisión.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { CASES } from './cases';
import { ap, fr } from './draw';
import { getRun, STEPS, type Spec } from './runs';
import { drawCopies, drawCostBig } from './v-cost';
import { drawBridge, drawRecap } from './v-end';
import { drawIntro, drawScale } from './v-intro';
import { drawAdapters, drawCount, drawLoraIdea, drawPaper, drawPieces, drawZero, rankOf } from './v-lora';
import { drawToy, FULL, FULL_R, LORA_N, LORA_R } from './v-toy';
import { drawData, drawDecide, drawQlora, drawTools } from './v-when';

/** Vistas: cada una vive desde el inicio de un segmento hasta el inicio de otro. */
const VIEWS: [string, string | undefined, (S: Frame) => void][] = [
  ['hook', 'ft-small', drawIntro],
  ['ft-small', 'toy-intro', drawScale],
  ['toy-intro', 'cost-big', drawToy],
  ['cost-big', 'cost-copies', drawCostBig],
  ['cost-copies', 'lora-idea', drawCopies],
  ['lora-idea', 'mult-table', drawLoraIdea],
  ['mult-table', 'count', drawPieces],
  ['count', 'paper', drawCount],
  ['paper', 'b-zero', drawPaper],
  ['b-zero', 'adapters', drawZero],
  ['adapters', 'toy-lora', drawAdapters],
  ['toy-lora', 'qlora', drawToy],
  ['qlora', 'tool-prompt', drawQlora],
  ['tool-prompt', 'case-tone', drawTools],
  ['case-tone', 'data-first', drawDecide],
  ['data-first', 'recap', drawData],
  ['recap', 'bridge', drawRecap],
  ['bridge', undefined, drawBridge],
];

// corridas reales que la narración necesita: se calculan de a poco, en segundo plano, desde el principio
const WARM: Spec[] = [FULL, FULL_R, LORA_R, LORA_N];

const stepVal = (seq: [number, number][], f: number) => { let v = seq[0][1]; for (const [at, val] of seq) if (f >= at) v = val; return v; };
const stepStr = (seq: [number, string][], f: number) => { let v = seq[0][1]; for (const [at, val] of seq) if (f >= at) v = val; return v; };

const scene: SceneFactory = () => ({
  controls: [
    { id: 'r', kind: 'slider', label: { es: 'Rango de B y A', en: 'Rank of B and A' }, min: 1, max: 32, step: 1, value: 2, from: 'rank-demo', to: 'paper', fmt: (v) => String(v) },
    {
      id: 'case', kind: 'choice', label: { es: 'Caso', en: 'Case' }, value: 'tone', from: 'case-tone', to: 'data-first',
      options: CASES.map((c) => ({ value: c.id, label: c.title })),
    },
  ],

  init(S) { S.st = { warm: 0 }; },

  update(S) {
    const dt = Math.min(S.dt || 0.016, 0.1);
    const jumped = S.st.lastT === undefined || Math.abs(S.t - S.st.lastT) > 0.3;
    S.st.lastT = S.t;
    // calentamiento de las corridas: unos pocos pasos por fotograma (nunca bloquea el dibujo)
    const wi = (S.st.warm as number) ?? 0;
    if (wi < WARM.length) { const r = getRun(WARM[wi]); r.ensure(STEPS, 6); if (r.done) S.st.warm = wi + 1; }

    // ── el rango: 2 → 4 → 8 → 16 en la demostración; en GPT-3, baja a 2 («uno o dos bastaba») ──
    if (S.is('count')) S.drive('r', 2);
    else if (S.is('rank-demo')) S.drive('r', stepVal([[0, 2], [0.18, 4], [0.38, 8], [0.66, 16]], fr(S, 'rank-demo', 0, 1)));
    else if (S.is('rank-try')) S.drive('r', 16);
    else if (S.is('gpt3-table')) S.drive('r', stepVal([[0, 16], [0.58, 2]], fr(S, 'gpt3-table', 0, 1)));
    if (S.between('rank-try', 'paper') && S.touched.has('r')) S.complete('rank');
    if (S.between('count', 'paper')) {
      const r = rankOf(S), cur = S.st.rShow as number | undefined;
      S.st.rShow = jumped || cur === undefined ? r : cur + (r - cur) * (1 - Math.exp(-dt * 7));
      if (Math.abs((S.st.rShow as number) - r) < 0.01) S.st.rShow = r;
    }

    // ── el caso: uno por segmento de demostración; en el turno, el manual de políticas ──
    if (S.is('case-tone')) S.drive('case', 'tone');
    else if (S.is('case-catalog')) S.drive('case', 'catalog');
    else if (S.is('case-tickets')) S.drive('case', 'tickets');
    else if (S.is('decide-try')) S.drive('case', stepStr([[0, 'tickets'], [0.45, 'manual']], fr(S, 'decide-try', 0, 1)));
    if (S.between('decide-try', 'data-first') && S.touched.has('case')) S.complete('decide');
    // cuándo cambió el caso (para animar su camino en el turno); al saltar, el camino se ve completo
    if (S.p.case !== S.st.caseCur) { S.st.caseAt = jumped || S.st.caseCur === undefined ? undefined : S.clock; S.st.caseCur = S.p.case; }
  },

  render(S) {
    // En escenarios grandes todo crece un poco (letra y piezas); se restablece al final.
    const u0 = S.u, z = S.portrait ? clamp(S.H / 440, 1, 1.12) : S.H < 330 ? 1 : clamp(S.H / 400, 1, 1.25);
    S.u = u0 * z; S.d.u = S.u;
    try {
      for (const [from, to, fn] of VIEWS) {
        if (!S.on(from) && from !== 'hook') continue;
        if (to && S.on(to) && fr(S, to, 0, 0.06) >= 1) continue;
        const aIn = from === 'hook' ? 1 : ap(S, from, 0, 0.07);
        const aOut = to && S.on(to) ? 1 - fr(S, to, 0, 0.05) : 1;
        const a = clamp(aIn * aOut);
        if (a > 0.003) S.d.withAlpha(a, () => fn(S));
      }
    } finally { S.u = u0; S.d.u = u0; }
  },
});
export default scene;
