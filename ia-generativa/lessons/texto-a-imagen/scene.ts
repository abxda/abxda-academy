// Escena: De texto a imagen. Un modelo de texto a imagen diminuto, entrenado de verdad (train_toy.py → model.ts) y
// ejecutado aquí mismo (nn.ts): CLIP de juguete (dos codificadores y su tabla de similitudes, con las instantáneas reales
// de su entrenamiento), difusión latente condicionada por el vector de la frase y guiado sin clasificador.
// La escena hace sola cada demostración (recorre el entrenamiento, cambia de prompt, mueve la escala de guiado) con
// S.drive; los «tu turno» son opcionales y solo cuentan lo que hace la persona (S.touched).
// Las animaciones se reparten por fracciones de cada segmento (fr): así siguen a la voz en cualquier idioma.
// Vista vertical (S.portrait): cada vista reacomoda sus piezas en columna; ver regions/área en views*.ts.
import { clamp, lerp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { caption } from './nn';
import { CLIP_STEPS, PROMPTS, freshSt, stOf, warm } from './state';
import { fr } from './toy';
import { drawEnc, drawIntro, drawMap, drawMatrix, drawWorld } from './views1';
import { drawCfg, drawCond, drawGrid, drawResults, gsOf } from './views2';
import { drawBias, drawBinding, drawBridge, drawNever, drawRecap, drawRights, drawUnseen } from './views3';

/** Vistas: cada una empieza en un segmento y dura hasta que empieza la siguiente. */
const VIEWS: [string, (S: Frame) => void][] = [
  ['hook', drawIntro], ['world', drawWorld], ['numbers', drawEnc], ['batch', drawMatrix], ['map', drawMap],
  ['denoiser', drawCond], ['variety', drawResults], ['two-preds', drawCfg], ['guide-setup', drawGrid], ['bias', drawBias],
  ['unseen', drawUnseen], ['binding', drawBinding], ['never-saw', drawNever], ['rights', drawRights], ['recap', drawRecap], ['bridge', drawBridge],
];

const fmtStep = (v: number, l: string) => { const n = CLIP_STEPS[Math.round(v)] ?? 0, s = n.toLocaleString('en-US'); return l === 'es' ? `paso ${s.replace(/,/g, ' ')}` : `step ${s}`; };
const fmtScale = (v: number) => v.toFixed(1);

const scene: SceneFactory = () => ({
  controls: [
    { id: 'step', kind: 'slider', label: { es: 'Pasos de entrenamiento', en: 'Training steps' }, min: 0, max: CLIP_STEPS.length - 1, step: 1, value: 0, from: 'train-demo', to: 'clip', fmt: fmtStep },
    {
      id: 'pr', kind: 'choice', label: { es: 'Prompt', en: 'Prompt' }, value: 0, from: 'prompt-demo', to: 'two-preds',
      options: PROMPTS.map((c, i) => ({ value: i, label: { es: caption(c[0], c[1], c[2], 'es'), en: caption(c[0], c[1], c[2], 'en') } })),
    },
    { id: 'gs', kind: 'slider', label: { es: 'Escala de guiado', en: 'Guidance scale' }, min: 0, max: 8, step: 0.5, value: 0, from: 'guide-setup', to: 'bias', fmt: fmtScale },
  ],

  init(S) { S.st.q = freshSt(); },

  // Demostraciones guiadas (la escena mueve los controles mientras nadie los toque) y comprobación de los «tu turno».
  update(S) {
    const q = stOf(S);
    warm(S, 3);   // precalcula, poco a poco, las imágenes de la cuadrícula del guiado y de los resultados
    // pasos del entrenamiento de CLIP: 0 → 2 500 en «train-demo»; al final, en «try-train»
    if (S.between('batch', 'clip')) {
      let idx = 0;
      if (S.on('train-demo')) idx = Math.round(lerp(0, CLIP_STEPS.length - 1, fr(S, 'train-demo', 0.1, 0.86, 'lin')));
      if (S.on('try-train')) idx = CLIP_STEPS.length - 1;
      S.drive('step', idx);
    }
    if (S.between('train-demo', 'clip') && S.touched.has('step')) {
      q.stepSeen.add(Math.round(S.p.step ?? 0));
      if (q.stepSeen.size >= 3) S.complete('train');
    }
    // prompt: la demostración cambia a la segunda y luego a la tercera frase
    if (S.between('gen-demo', 'two-preds')) {
      let pr = 0;
      if (S.on('prompt-demo')) pr = fr(S, 'prompt-demo', 0.15, 0.16, 'lin') < 1 ? 0 : fr(S, 'prompt-demo', 0.55, 0.56, 'lin') < 1 ? 1 : 2;
      if (S.on('try-prompt')) pr = 2;
      S.drive('pr', pr);
    }
    if (S.between('prompt-demo', 'two-preds') && S.touched.has('pr')) {
      const v = Math.round(S.p.pr ?? 0);
      if (v !== q.prLast) { q.prLast = v; q.prClock = S.clock; q.prUser = true; S.complete('prompt'); }
    }
    // escala de guiado: 0 → 1 → 3 → 8 → 3
    if (S.between('guide-setup', 'bias')) {
      let s = 0;
      if (S.on('guide-demo')) s = lerp(0, 1, fr(S, 'guide-demo', 0.04, 0.16, 'io')) + lerp(0, 2, fr(S, 'guide-demo', 0.46, 0.6, 'io'));
      if (S.on('guide-high')) s = lerp(3, 8, fr(S, 'guide-high', 0.06, 0.36, 'io'));
      if (S.on('tradeoff')) s = lerp(8, 3, fr(S, 'tradeoff', 0.62, 0.82, 'io'));
      if (S.on('try-guide')) s = 3;
      S.drive('gs', clamp(Math.round(s * 2) / 2, 0, 8));
    }
    if (S.between('guide-setup', 'bias') && S.touched.has('gs')) {
      const s = gsOf(S);
      if (s <= 1) q.gsLow = true;
      if (s >= 5) q.gsHigh = true;
      if (q.gsLow && q.gsHigh) S.complete('guide');
    }
    // al volver a un prompt dado por la demostración, la animación vuelve a ser la de la demostración
    if (!S.touched.has('pr')) q.prUser = false;
  },

  render(S) {
    for (let i = 0; i < VIEWS.length; i++) {
      const [start, draw] = VIEWS[i], next = VIEWS[i + 1]?.[0];
      if (!S.on(start)) break;
      const aIn = i === 0 ? 1 : fr(S, start, 0.04, 0.12), aOut = next ? 1 - fr(S, next, 0, 0.05) : 1;
      const a = aIn * aOut;
      if (a > 0.01) S.d.withAlpha(a, () => draw(S));
    }
  },
});

export default scene;
