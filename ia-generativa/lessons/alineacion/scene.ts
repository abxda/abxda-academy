// Escena: De modelo base a asistente. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar la siguiente):
//  1 · lo que ya sabes; el mismo modelo antes y después (salidas REALES de TinyLlama)     (hook … try-compare)   → turno «compare»
//  2 · la brecha y la alineación; el recorrido de tres pasos                                (why … roadmap)
//  3 · paso uno: ejemplos (ajuste con instrucciones), cuántos datos, escribir frente a comparar   (sft-examples … sft-limit)
//  4 · paso dos: preferencias, el juez (modelo de recompensa), la sigmoide, el juez de juguete     (pref-pair … rm-people) → turno «rm»
//  5 · paso tres: practicar con el juez (RLHF), correa, presión, calidad real y Goodhart           (rl-practice … goodhart) → turno «opt»
//  6 · DPO; adulación, rechazos, la capa de comportamiento, repaso y puente.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive) o hace sola la acción; es opcional y solo
// cuenta lo que hizo la persona (S.touched / sus propias elecciones). Las animaciones van por fracciones de la duración de cada segmento.
//
// REAL: las salidas de TinyLlama (outputs-data.ts, build-outputs.py), las cifras de InstructGPT (Ouyang et al. 2022), del estudio de
// adulación (Sharma et al. 2023) y del caso de GPT-4o (OpenAI 2025), y todo el cálculo del juguete (regresión logística de Bradley–Terry
// con su descenso del gradiente, óptimo exacto con correa KL, DPO). ILUSTRATIVO (rotulado en pantalla): los rasgos asignados a mano,
// los pesos del juez de práctica y la regla de «calidad real», los 28 pedidos de los rechazos y el esquema de señales del caso GPT-4o.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawCompare, drawGap, drawHook, drawSteps } from './v-intro';
import { drawLimit, drawScale, drawSft } from './v-sft';
import { boardHit, boardPointer, drawBoard, drawPair, drawPeople, drawRm, drawSig } from './v-pref';
import { drawLoop, drawOpt } from './v-rl';
import { drawDpoPipe, drawDpoSame } from './v-dpo';
import { drawBridge, drawCase, drawLayer, drawLayerPref, drawRefuse, drawStudy, drawSyco, drawWho } from './v-end';
import { choose, demoPress, demoQ, pressure, st } from './state';
import { provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'base-demo', draw: drawHook },
  { from: 'base-demo', to: 'why', draw: drawCompare, src: (S) => S.l('Salidas reales de TinyLlama 1.1B (base) y TinyLlama 1.1B Chat, sin retoques', 'Real outputs of TinyLlama 1.1B (base) and TinyLlama 1.1B Chat, unedited') },
  { from: 'why', to: 'roadmap', draw: drawGap },
  { from: 'roadmap', to: 'sft-examples', draw: (S) => drawSteps(S, 'road'), src: (S) => S.l('Receta de InstructGPT: Ouyang et al. (2022)', 'InstructGPT’s recipe: Ouyang et al. (2022)') },
  { from: 'sft-examples', to: 'sft-scale', draw: drawSft, src: (S) => S.l('Ejemplos ilustrativos', 'Illustrative examples') },
  { from: 'sft-scale', to: 'sft-limit', draw: drawScale, src: (S) => S.l('Ouyang et al. (2022) · Brown et al. (2020)', 'Ouyang et al. (2022) · Brown et al. (2020)') },
  { from: 'sft-limit', to: 'pref-pair', draw: drawLimit },
  { from: 'pref-pair', to: 'rm-what', draw: drawPair, src: (S) => S.l('Cifras: Ouyang et al. (2022)', 'Figures: Ouyang et al. (2022)') },
  { from: 'rm-what', to: 'rm-prob', draw: drawRm },
  { from: 'rm-prob', to: 'rm-toy', draw: drawSig, src: (S) => S.l('Regla de Bradley–Terry · sigmoide: lección 5', 'Bradley–Terry rule · sigmoid: lesson 5') },
  { from: 'rm-toy', to: 'rm-people', draw: drawBoard, src: (S) => S.l('Juguete: rasgos marcados a mano; el ajuste del juez es real (regresión logística)', 'Toy: hand-marked traits; the judge’s fit is real (logistic regression)') },
  { from: 'rm-people', to: 'rl-practice', draw: drawPeople, src: (S) => S.l('72.6 %: Ouyang et al. (2022)', '72.6%: Ouyang et al. (2022)') },
  { from: 'rl-practice', to: 'rl-bars', draw: drawLoop, src: (S) => S.l('Ouyang et al. (2022) · OpenAI (2022)', 'Ouyang et al. (2022) · OpenAI (2022)') },
  { from: 'rl-bars', to: 'dpo-problem', draw: drawOpt, src: (S) => (S.on('goodhart') ? S.l('Juguete ilustrativo. Gao et al. (2022) midieron este patrón en modelos de lenguaje reales.', 'Illustrative toy. Gao et al. (2022) measured this pattern in real language models.') : S.l('Juguete: rasgos, juez y calidad real son supuestos; el cálculo con correa es exacto', 'Toy: traits, judge, and real quality are assumed; the leash calculation is exact')) },
  { from: 'dpo-problem', to: 'dpo-same', draw: drawDpoPipe, src: (S) => S.l('Rafailov et al. (2023)', 'Rafailov et al. (2023)') },
  { from: 'dpo-same', to: 'syco', draw: drawDpoSame, src: (S) => S.l('Juguete: cálculo exacto · Llama Team (2024) · ficha de TinyLlama Chat', 'Toy: exact calculation · Llama Team (2024) · TinyLlama Chat model card') },
  { from: 'syco', to: 'syco-study', draw: drawSyco, src: (S) => S.l('Juguete: elecciones inventadas, presión 1', 'Toy: made-up choices, pressure 1') },
  { from: 'syco-study', to: 'syco-case', draw: drawStudy, src: (S) => S.l('Sharma et al. (2023)', 'Sharma et al. (2023)') },
  { from: 'syco-case', to: 'refuse', draw: drawCase, src: (S) => S.l('OpenAI (29 abr y 2 may 2025)', 'OpenAI (Apr 29 and May 2, 2025)') },
  { from: 'refuse', to: 'layer', draw: drawRefuse, src: (S) => S.l('Sus autores advierten el riesgo de rechazar pedidos inofensivos (Ouyang et al., 2022)', 'Its authors warn of the risk of refusing harmless requests (Ouyang et al., 2022)') },
  { from: 'layer', to: 'layer-pref', draw: drawLayer, src: (S) => S.l('Ouyang et al. (2022): 4.9 + 60 frente a 3 640 petaflops/s-día', 'Ouyang et al. (2022): 4.9 + 60 versus 3,640 petaflop/s-days') },
  { from: 'layer-pref', to: 'who', draw: drawLayerPref, src: (S) => S.l('Ouyang et al. (2022)', 'Ouyang et al. (2022)') },
  { from: 'who', to: 'recap', draw: drawWho, src: (S) => S.l('Ouyang et al. (2022)', 'Ouyang et al. (2022)') },
  { from: 'recap', to: 'bridge', draw: (S) => drawSteps(S, 'recap') },
  { from: 'bridge', draw: drawBridge },
];

const scene: SceneFactory = () => ({
  controls: [
    {
      id: 'q', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, value: 1, from: 'compare-demo', to: 'why',
      options: [{ value: 0, label: { es: 'Capital', en: 'Capital' } }, { value: 1, label: { es: 'Inflación', en: 'Inflation' } }, { value: 2, label: { es: 'Correo', en: 'Email' } }, { value: 3, label: { es: 'Dormir', en: 'Sleep' } }],
    },
    { id: 'pickA', kind: 'button', primary: true, label: { es: 'Prefiero A', en: 'I prefer A' }, from: 'rm-demo', to: 'rm-result' },
    { id: 'pickB', kind: 'button', primary: true, label: { es: 'Prefiero B', en: 'I prefer B' }, from: 'rm-demo', to: 'rm-result' },
    {
      id: 'press', kind: 'slider', label: { es: 'Presión de optimización', en: 'Optimization pressure' }, min: 0, max: 1, step: 0.01, value: 0, from: 'rl-push', to: 'dpo-problem',
      fmt: (v, l) => { const s = pressure(v).toFixed(2); return (l === 'es' ? 'presión ' : 'pressure ') + s; },
    },
  ],

  init(S) { S.st = {}; },

  action(S, id) {
    if (id === 'pickA') choose(S, 'A');
    else if (id === 'pickB') choose(S, 'B');
  },

  pointer(S, e) { boardPointer(S, e.type, e.x, e.y); },
  cursor(S, x, y) { return boardHit(S, x, y) ? 'pointer' : undefined; },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = s.lastT < 0 || Math.abs(S.t - s.lastT) > 0.35;   // salto (o captura): sin transición
    s.lastT = S.t;
    const ease = (cur: number, target: number, rate = 9) => (jump ? target : cur + (target - cur) * (1 - Math.exp(-dt * rate)));

    // ── turno 1: la indicación (demostración: correo, dormir, capital) ──
    if (S.between('compare-demo', 'why')) {
      const want = S.drive('q', demoQ(S));
      if (S.touched.has('q')) {
        const q = clamp(Math.round(Number(want)), 0, 3);
        if (!s.qOwn || q !== s.q) { s.q = q; s.qClock = S.clock; s.qOwn = true; }
        if (S.on('try-compare')) S.complete('compare');
      }
    }

    // ── turno 2: el juez de juguete (las elecciones las registra choose()); los pesos mostrados siguen a los aprendidos ──
    for (let i = 0; i < 4; i++) s.wShown[i] = ease(s.wShown[i], s.w[i], 8);

    // ── turno 3: la presión de optimización ──
    if (S.between('rl-push', 'dpo-problem')) {
      const v = clamp(Number(S.drive('press', demoPress(S))));
      s.sShown = ease(s.sShown, v, 10);
      if (S.on('opt-demo')) s.ext = Math.max(s.ext, s.sShown);
      if (S.touched.has('press') && S.between('try-opt', 'dpo-problem')) {
        s.sMin = Math.min(s.sMin, v); s.sMax = Math.max(s.sMax, v);
        if (s.sMax - s.sMin >= 0.25) S.complete('opt');
      }
    } else if (!S.on('rl-push')) { s.sShown = 0; s.ext = 0; }
  },

  render(S) {
    const d = S.d;
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      d.withAlpha(a, () => v.draw(S));
      if (v.src) provenance(S, v.src(S), a);
    }
    void S.portrait;
  },
});

export default scene;
