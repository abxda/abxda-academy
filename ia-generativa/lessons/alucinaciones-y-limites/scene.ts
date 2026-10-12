// Escena: Alucinaciones y límites. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar la
// siguiente):
//  1 · el caso de Nueva York: seis casos que no existen, la pregunta al propio ChatGPT, la multa y la definición  (hook … define)
//  2 · dentro de un modelo real (Pythia-1.4B): Australia (sabe) y Pedro Páramo (no sabe, pero elige), la duda que el texto
//      no muestra y por qué no dice «no lo sé»                                                                  (recall … no-idk)
//  3 · por qué ocurre: gana lo que coincide con el texto, lo poco frecuente, los exámenes que premian adivinar y la
//      bola de nieve                                                                                          (objective … snowball)
//  4 · tres familias de error: inventar, desactualizarse (corte de conocimiento) y razonar mal                 (types … reason)
//  5 · ¿verdadero o inventado?: la escena resuelve dos afirmaciones y la persona, si quiere, cuatro más       (game-intro … game-after)
//  6 · confianza y calibración: el pronóstico del clima y el diagrama de fiabilidad real de Pythia            (conf … hidden)
//  7 · responder o callar: el umbral (demostración con S.drive y «tu turno» de un deslizador)                 (abstain … thr-cost)
//  8 · ¿lo arregla el tamaño?: siete Pythia y TruthfulQA                                                      (scale … truthfulqa-num)
//  9 · qué hacer: cuatro palancas, la evidencia, verificar según el riesgo, la responsabilidad, resumen y puente (mit-doc … bridge)
// Cada «tu turno» va precedido de una demostración; es opcional y solo cuenta lo que hizo la persona (botones o S.touched).
// Las animaciones van por fracciones de la duración de cada segmento (ui.ts: fr, win).
//
// REAL: todas las probabilidades, respuestas y cuentas de Pythia (real-data.ts, cutoff-data.ts; scripts run-*.py).
// ILUSTRATIVO (rotulado en pantalla): las seis afirmaciones del juego, el pronóstico del clima, la curva de «lo poco frecuente»,
// la calificación de un texto al entrenar, los diagramas de las palancas y dónde poner el umbral según el uso.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawCase } from './v-case';
import { drawProbs } from './v-probs';
import { drawWhy } from './v-why';
import { drawTypes } from './v-types';
import { BUTTONS, answer, drawGame, turnDone } from './v-game';
import { drawCalib } from './v-calib';
import { demoThr, drawThresh } from './v-thresh';
import { drawScale } from './v-scale';
import { drawEnd } from './v-end';
import { provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const PYTHIA = (S: Frame) => S.l('Mediciones reales de Pythia-1.4B · cinco preguntas resueltas antes de cada pregunta · respuesta voraz', 'Real measurements of Pythia-1.4B · five solved questions before each question · greedy answer');
const VIEWS: View[] = [
  { from: 'hook', to: 'recall', draw: drawCase, src: (S) => S.l('Mata v. Avianca: sentencia sobre sanciones, tribunal federal de Nueva York (22 de junio de 2023)', 'Mata v. Avianca: opinion on sanctions, federal court in New York (June 22, 2023)') },
  { from: 'recall', to: 'objective', draw: drawProbs, src: (S) => (S.on('aus-q') ? PYTHIA(S) : '') },
  {
    from: 'objective', to: 'types', draw: drawWhy,
    src: (S) => (S.on('snowball') ? S.l('Continuación real de Pythia-1.4B (voraz) · la novela se publicó en 1955', 'Real continuation by Pythia-1.4B (greedy) · the novel came out in 1955')
      : S.on('exam') ? S.l('Kalai et al. (2025): las evaluaciones que califican así premian adivinar', 'Kalai et al. (2025): evaluations graded this way reward guessing')
        : S.on('rare') ? S.l('Ilustrativo · la tendencia la midieron Kandpal et al. (2023)', 'Illustrative · the trend was measured by Kandpal et al. (2023)') : ''),
  },
  {
    from: 'types', to: 'game-intro', draw: drawTypes,
    src: (S) => (S.on('reason') ? PYTHIA(S) : S.on('cutoff-ex') ? S.l('Pythia-1.4B, medido · sus textos (The Pile) se publicaron en diciembre de 2020 · ganó Argentina (FIFA)', 'Pythia-1.4B, measured · its texts (The Pile) were released in December 2020 · Argentina won (FIFA)')
      : S.on('cutoff') ? S.l('The Pile, los textos de Pythia, se publicó el 31 de diciembre de 2020', 'The Pile, Pythia’s texts, was released on December 31, 2020') : PYTHIA(S)),
  },
  { from: 'game-intro', to: 'conf', draw: drawGame, src: (S) => S.l('Afirmaciones escritas para esta lección; cada una comprobada en la fuente que se indica', 'Statements written for this lesson; each checked against the source shown') },
  {
    from: 'conf', to: 'abstain', draw: drawCalib,
    src: (S) => (S.on('hidden') ? S.l('OpenAI (2023), informe técnico de GPT-4', 'OpenAI (2023), GPT-4 technical report')
      : S.on('calib-x') ? S.l('424 preguntas escritas para la lección · Pythia-1.4B', '424 questions written for the lesson · Pythia-1.4B')
        : S.on('forecast') ? '' : PYTHIA(S)),
  },
  { from: 'abstain', to: 'scale', draw: drawThresh, src: (S) => (S.on('thr-cost') ? S.l('Cuentas reales de Pythia-1.4B · dónde poner el umbral en cada uso: ilustrativo', 'Real counts from Pythia-1.4B · where to set the threshold for each use: illustrative') : S.l('Las mismas 424 preguntas · Pythia-1.4B · cuentas reales', 'The same 424 questions · Pythia-1.4B · real counts')) },
  {
    from: 'scale', to: 'mit-doc', draw: drawScale,
    src: (S) => (S.on('truthfulqa') ? S.l('Lin, Hilton y Evans (2021), TruthfulQA', 'Lin, Hilton, and Evans (2021), TruthfulQA') : S.l('Siete modelos Pythia: mismas preguntas, misma receta', 'Seven Pythia models: same questions, same recipe')),
  },
  {
    from: 'mit-doc', draw: drawEnd,
    src: (S) => (S.on('recap') ? '' : S.on('accountability') ? 'Moffatt v. Air Canada, 2024 BCCRT 149' : S.on('risk') ? ''
      : S.on('evidence') ? S.l('Magesh et al. (2024): Lexis+ AI, Westlaw AI-Assisted Research y Ask Practical Law AI', 'Magesh et al. (2024): Lexis+ AI, Westlaw AI-Assisted Research, and Ask Practical Law AI')
        : S.l('Ilustrativo', 'Illustrative')),
  },
];

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: verdadera o inventada (una pulsación por afirmación) ──
    { id: 'g-true', kind: 'button', label: { es: 'Verdadera', en: 'True' }, from: 'game-intro', to: 'game-after' },
    { id: 'g-false', kind: 'button', label: { es: 'Inventada', en: 'Invented' }, from: 'game-intro', to: 'game-after' },
    // ── turno 2: el umbral de confianza ──
    { id: 'thr', kind: 'slider', label: { es: 'Umbral de confianza', en: 'Confidence threshold' }, min: 0, max: 1, step: 0.02, value: 0, from: 'abstain', to: 'scale', fmt: (v, l) => `${Math.round(v * 100)}${l === 'es' ? ' %' : '%'}` },
  ],

  init(S) { S.st = {}; },

  action(S, id) { if (BUTTONS.includes(id)) answer(S, id); },

  // Estado interactivo: avanza siempre; render() solo lo lee.
  update(S) {
    if (S.between('abstain', 'scale')) {
      S.drive('thr', demoThr(S));
      if (S.on('try-thr') && S.touched.has('thr')) S.complete('thr');
    }
    if (S.on('try-game') && turnDone(S)) S.complete('game');
  },

  render(S) {
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      S.d.withAlpha(a, () => v.draw(S));
      const src = v.src?.(S);
      if (src) provenance(S, src, a);
    }
  },
});

export default scene;
