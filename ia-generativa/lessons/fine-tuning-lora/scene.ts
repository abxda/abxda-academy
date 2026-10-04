// Escena: Ajuste fino y LoRA. Un modelo diminuto REAL (2→32→32→3) que se ajusta en el navegador: ajuste completo, olvido, y LoRA sobre su capa central.
// Actos (cada uno vive en su archivo y se funde con el siguiente):
//  1 · el problema: modelo base + tus ejemplos + el bucle (act-intro)      2 · el modelo diminuto: ajuste completo y olvido (act-intro)
//  3 · la idea de LoRA: bajo rango, W = W₀ + B·A, la cuenta de parámetros, GPT-3 (act-lora)          [turno `rank`: sube r hasta que deje de ahorrar]
//  4 · LoRA en el modelo diminuto: rangos, repaso, un adaptador por cliente (act-tune)               [turno `train`: logra 85 % / 96 %]
//  5 · memoria y QLoRA (act-mem)      6 · cuándo sí y cuándo no, evidencia, resumen y puente (act-decide)   [turno `decide`: cuatro casos]
// REAL: todo el entrenamiento (runs.ts), la cuantización a 4 bits (quant.ts) y las cifras de los artículos citados. ILUSTRATIVO (rotulado en pantalla):
// los casos del turno final, las barras de línea base y los esquemas de «prompt largo → corto». Datos y base: build-base.ts, task.ts; verificación: check-claims.ts.
import type { SceneFactory } from '../../../../../theme/kit';
import { drawConcept, drawCopies, drawToy } from './act-intro';
import { drawAreas, drawFreeze, drawGpt3, drawOuter, drawPaper, drawRankSum, drawSvd, drawTwoPath } from './act-lora';
import { drawLoraDemo, drawRanks, drawReplay, drawSwap, drawTrain } from './act-tune';
import { drawMemory, drawQlora } from './act-mem';
import { decideHit, drawBridge, drawDecide, drawEvidence, drawLadder, drawRecap } from './act-decide';
import { getRun, STEPS, type Spec } from './runs';
import { pick, startTrial, st, stepTrial } from './state';

// corridas que las partes narradas necesitan: se calientan de a poco, en segundo plano, mientras suena la introducción
const WARM: Spec[] = [
  { mode: 'full', replay: false, rule: 'A' },
  { mode: 2, replay: false, rule: 'A' }, { mode: 1, replay: false, rule: 'A' }, { mode: 8, replay: false, rule: 'A' },
  { mode: 2, replay: true, rule: 'A' }, { mode: 2, replay: true, rule: 'B' }, { mode: 2, replay: true, rule: 'A', q: true },
];

const scene: SceneFactory = () => ({
  controls: [
    { id: 'r', kind: 'slider', label: { es: 'Rango r', en: 'Rank r' }, min: 1, max: 32, step: 1, value: 2, from: 'try-rank', to: 'gpt3-scale', fmt: (v) => String(v) },
    // turno `train`: rango, repaso y entrenar
    { id: 'tr', kind: 'slider', label: { es: 'Rango r del adaptador', en: 'Adapter rank r' }, min: 1, max: 32, step: 1, value: 2, from: 'try-train', to: 'replay', fmt: (v) => String(v) },
    { id: 'rp', kind: 'toggle', label: { es: 'Mezclar ejemplos originales', en: 'Mix in original examples' }, value: false, from: 'try-train', to: 'replay' },
    { id: 'go', kind: 'button', primary: true, label: { es: 'Entrenar adaptador', en: 'Train adapter' }, from: 'try-train', to: 'replay' },
    // turno `decide`: la misma elección que los botones del lienzo, para teclado
    { id: 'opt0', kind: 'button', primary: true, label: { es: 'Prompt', en: 'Prompt' }, from: 'try-decide', to: 'evidence-first' },
    { id: 'opt1', kind: 'button', primary: true, label: { es: 'RAG', en: 'RAG' }, from: 'try-decide', to: 'evidence-first' },
    { id: 'opt2', kind: 'button', primary: true, label: { es: 'Ajuste fino', en: 'Fine-tuning' }, from: 'try-decide', to: 'evidence-first' },
  ],

  init(S) { S.st = {}; st(S); },

  action(S, id) {
    if (id === 'go') startTrial(S);
    else if (id.startsWith('opt')) pick(S, Number(id.slice(3)));
  },
  pointer(S, e) { if (e.type === 'down') { const o = decideHit(S, e.x, e.y); if (o >= 0) pick(S, o); } },
  cursor(S, x, y) { return decideHit(S, x, y) >= 0 ? 'pointer' : undefined; },

  update(S) {
    const s = st(S);
    // turno `rank`: llegar a un rango en el que B y A ocupan tanto como la matriz completa
    if (S.between('try-rank', 'gpt3-scale') && (S.p.r ?? 2) >= 16) S.complete('rank');
    // turno `train`: el ensayo avanza solo (y completa el gate al cumplir las dos metas)
    stepTrial(S);
    // calentamiento: unos pocos pasos por fotograma (nunca bloquea el dibujo)
    if (s.warm < WARM.length) { const r = getRun(WARM[s.warm]); r.ensure(STEPS, 5); if (r.done) s.warm++; }
  },

  render(S) {
    // visibilidad de un acto: aparece al empezar su segmento y se funde al empezar el siguiente
    const win = (a: string, b?: string) => S.at(a, 0, 0.5) * (b ? 1 - S.at(b, 0, 0.5) : 1);
    const vis = (a: string, b?: string) => S.at(a, 0, 0.7) * (b ? 1 - S.at(b, 0, 0.5) : 1);
    drawConcept(S, vis('hook', 'toy-intro'));
    drawToy(S, S.at('toy-intro', 0, 0.7));
    drawCopies(S, 1 - S.at('insight', 0, 0.5));
    drawSvd(S, S.at('insight', 0, 0.7) * (1 - S.at('freeze', 0, 0.5)));
    drawFreeze(S, S.at('freeze', 0, 0.7) * (1 - S.at('outer', 0, 0.5)));
    drawOuter(S, S.at('outer', 0, 0.7) * (1 - S.at('count', 0, 0.5)));
    drawRankSum(S, 1);
    drawAreas(S, 1);
    drawGpt3(S, 1);
    drawTwoPath(S, 1);
    drawPaper(S, 1);
    drawLoraDemo(S, win('demo-lora', 'rank-demo'));
    drawRanks(S, win('rank-demo', 'try-train'));
    drawTrain(S, win('try-train', 'replay'));
    drawReplay(S, win('replay', 'swap'));
    drawSwap(S, win('swap', 'memory'));
    drawMemory(S, win('memory', 'qlora'));
    drawQlora(S, win('qlora', 'ladder'));
    drawLadder(S, win('ladder', 'try-decide'));
    drawDecide(S, win('try-decide', 'evidence-first'));
    drawEvidence(S, win('evidence-first', 'recap'));
    drawRecap(S, win('recap', 'bridge'));
    drawBridge(S, win('bridge'));
  },
});

export default scene;
