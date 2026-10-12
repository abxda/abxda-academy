// Escena: Contexto y memoria. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar
// la siguiente):
//  1 · el chat que «recuerda» tu nombre                                   (hook, seems)
//  2 · el modelo: contexto → token siguiente; pesos fijos; ¿dónde quedó el nombre?   (model … puzzle)
//  3 · la aplicación guarda y reenvía todo (sin estado); la prueba de enviar todo o solo la pregunta (app … not-exist) → turno «send»
//  4 · el tren de contexto: vagones = mensajes, largo = tokens; la ventana; instrucciones del sistema; la respuesta;
//      se llena y lo más viejo se desengancha                              (train … try-more) → turno «more»
//  5 · por qué hay un límite (posiciones de GPT-3) · 6 · cuánto crecieron las ventanas
//  7 · el costo de reenviar todo (barras por turno)                       (cost-setup … cost-pay)
//  8 · perdido en el medio (datos reales de Liu et al. 2023)               (litm-setup … litm-advice) → turno «litm»
//  9 · memoria = texto guardado fuera: resumen, notas, privacidad; repaso y puente a RAG.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive) o hace sola la acción; es opcional
// y solo cuenta lo que hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento.
//
// REAL: tamaños de ventana (Brown 2020, Anthropic 2023, Llama Team 2024, Gemini Team 2024) y resultados de «Lost in the
// Middle» (Liu et al. 2023, tablas 1 y 6). ILUSTRATIVO (rotulado en pantalla): la conversación, los tamaños de cada mensaje,
// la ventana de 400 tokens, las respuestas, el resumen y las notas. CÁLCULO EXACTO sobre un supuesto rotulado: el costo.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawChat, drawModel } from './v-intro';
import { drawRelay } from './v-relay';
import { drawTrain } from './v-train';
import { drawLimit, drawSizes } from './v-sizes';
import { drawCost } from './v-cost';
import { drawLitm } from './v-litm';
import { drawBridge, drawMemoryQ, drawNotes, drawPrivacy, drawRecap, drawSummary } from './v-end';
import { addTurn, demoPos, demoSend, demoTurns, movePos, reset, st, updateTrain } from './state';
import { provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'model', draw: drawChat, src: (S) => S.l('Conversación ilustrativa', 'Illustrative conversation') },
  { from: 'model', to: 'app', draw: drawModel, src: (S) => S.l('Probabilidades ilustrativas · lección 19', 'Illustrative probabilities · lesson 19') },
  {
    from: 'app', to: 'train', draw: drawRelay,
    src: (S) => (S.on('demo-send') ? S.l('Respuestas ilustrativas', 'Illustrative answers') : S.l('Así funcionan las API de chat: «sin estado» (documentación de Anthropic)', 'This is how chat APIs work: “stateless” (Anthropic documentation)')),
  },
  {
    from: 'train', to: 'why-limit', draw: drawTrain,
    src: (S) => (S.on('overflow') ? S.l('Ilustrativo. «Lo primero que entra sale primero»: así pueden manejarla los chats (documentación de Anthropic)', 'Illustrative. “First in, first out”: how chat apps can manage it (Anthropic documentation)') : S.l('Tamaños ilustrativos: ventana de juguete de 400 tokens', 'Illustrative sizes: a toy window of 400 tokens')),
  },
  { from: 'why-limit', to: 'size-gpt3', draw: drawLimit, src: (S) => S.l('GPT-3: ventana de 2 048 tokens (Brown et al., 2020); posiciones aprendidas (Radford et al., 2018)', 'GPT-3: 2,048-token window (Brown et al., 2020); learned positions (Radford et al., 2018)') },
  { from: 'size-gpt3', to: 'cost-setup', draw: drawSizes, src: (S) => S.l('Brown et al. (2020) · Anthropic (2023) · Llama Team (2024) · Gemini Team (2024)', 'Brown et al. (2020) · Anthropic (2023) · Llama Team (2024) · Gemini Team (2024)') },
  { from: 'cost-setup', to: 'litm-setup', draw: drawCost, src: (S) => S.l('Cálculo exacto con un supuesto: 100 tokens por turno', 'Exact calculation with an assumption: 100 tokens per turn') },
  { from: 'litm-setup', to: 'memory-q', draw: drawLitm, src: (S) => S.l('Liu et al. (2023), tablas 1 y 6: GPT-3.5-Turbo, 20 documentos (unos 4 000 tokens)', 'Liu et al. (2023), tables 1 and 6: GPT-3.5-Turbo, 20 documents (about 4,000 tokens)') },
  { from: 'memory-q', to: 'memory-summary', draw: drawMemoryQ, src: (S) => S.l('Ilustrativo', 'Illustrative') },
  { from: 'memory-summary', to: 'memory-notes', draw: drawSummary, src: (S) => S.l('Ilustrativo. Resumir lo viejo: la «compactación» (documentación de Anthropic)', 'Illustrative. Summarizing the old part: “compaction” (Anthropic documentation)') },
  { from: 'memory-notes', to: 'privacy', draw: drawNotes, src: (S) => S.l('Ilustrativo. Notas entre conversaciones: la herramienta de memoria (documentación de Anthropic)', 'Illustrative. Notes across conversations: the memory tool (Anthropic documentation)') },
  { from: 'privacy', to: 'recap', draw: drawPrivacy, src: (S) => S.l('Ilustrativo', 'Illustrative') },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

const scene: SceneFactory = () => ({
  controls: [
    {
      id: 'send', kind: 'choice', label: { es: 'Qué envía la aplicación', en: 'What the app sends' }, value: 'all', from: 'demo-send', to: 'not-exist',
      options: [{ value: 'all', label: { es: 'Todo el historial', en: 'The whole history' } }, { value: 'last', label: { es: 'Solo la pregunta', en: 'Only the question' } }],
    },
    { id: 'more', kind: 'button', primary: true, label: { es: 'Enviar otro mensaje', en: 'Send another message' }, from: 'fill', to: 'why-limit' },
    { id: 'turns', kind: 'slider', label: { es: 'Turnos de la conversación', en: 'Conversation turns' }, min: 1, max: 20, step: 1, value: 1, from: 'cost-bars', to: 'litm-setup', fmt: (v) => String(v) },
    {
      id: 'pos', kind: 'choice', label: { es: 'Lugar del documento con la respuesta', en: 'Place of the document with the answer' }, value: 1, from: 'litm-first', to: 'memory-q',
      options: [1, 5, 10, 15, 20].map((v) => ({ value: v, label: { es: `${v}.º`, en: v === 1 ? '1st' : `${v}th` } })),
    },
  ],

  init(S) { reset(S); },

  action(S, id) {
    if (id === 'more' && S.between('fill', 'why-limit')) addTurn(S);
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = s.lastT < 0 || Math.abs(S.t - s.lastT) > 0.35;   // salto (o captura): sin transición
    s.lastT = S.t;
    const ease = (cur: number, target: number, rate = 7) => (jump ? target : cur + (target - cur) * (1 - Math.exp(-dt * rate)));

    // ── turno 1: qué envía la aplicación ──
    if (S.between('demo-send', 'train')) {
      const v = S.on('not-exist') ? 'last' : S.drive('send', demoSend(S));
      s.send = ease(s.send, v === 'last' ? 1 : 0, 8);
      if (S.touched.has('send') && S.between('demo-send', 'not-exist')) S.complete('send');
    } else if (!S.on('demo-send')) s.send = 0;

    // ── turno 2: el tren (la historia avanza sola; la persona puede añadir turnos) ──
    if (S.between('train', 'why-limit')) {
      updateTrain(S, jump, dt);
      if (S.touched.has('more') && s.extras > 0) S.complete('more');
    }

    // ── costo: turnos de la conversación ──
    if (S.between('cost-setup', 'litm-setup')) {
      const n = S.on('cost-bars') ? Number(S.drive('turns', demoTurns(S))) : 1;
      s.turns = ease(s.turns, clamp(n, 1, 20), 6);
    }

    // ── turno 3: lugar del documento con la respuesta ──
    if (S.between('litm-setup', 'memory-q')) {
      let target = 1;
      if (S.on('litm-first')) target = Number(S.drive('pos', demoPos(S)));
      else if (S.on('litm-move') && !S.on('litm-x')) target = movePos(S);
      else if (S.on('litm-x')) target = 1;
      s.pos = ease(s.pos, target, 6);
      if (S.touched.has('pos') && S.on('litm-first')) S.complete('litm');
    }
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
