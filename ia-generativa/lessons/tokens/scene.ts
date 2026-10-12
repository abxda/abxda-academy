// Escena: Tokens. La frase «Mi gato se llama Quetzalcóatl.» cortada por un tokenizador real (GPT-4o) y sus números;
// por qué ni letras ni palabras; BPE paso a paso sobre cinco palabras (la escena fusiona sola cada pareja); un tokenizador
// de juguete REAL (entrenado offline, build-tokenizers.mts) con su deslizador de fusiones; tamaños reales del vocabulario;
// la regla práctica y el precio; inglés frente a español (GPT-4o, FLORES-200 y el juguete entrenado de dos maneras);
// las letras y las cifras que el modelo no ve; los límites; resumen y puente a la atención.
//
// Todo lo «medido» sale de real-data.ts (measure-real.py, tiktoken 0.14.0). Las demostraciones mueven solas sus controles
// con S.drive mientras la persona no los toque; los «tu turno» son opcionales y se completan solo con lo que ella hace.
import { clamp, ease, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { MERGE_COUNT } from './data';
import { drawIntro, drawLanes } from './act-intro';
import { drawMini, drawOrigin } from './act-bpe';
import { drawSizes, drawToy } from './act-toy';
import { drawCost, drawLang, drawLangBars, drawLangOther, drawLangWhy, drawRule } from './act-lang';
import { drawBridge, drawDigits, drawLetters, drawLimits, drawRecap } from './act-end';
import { fr } from './viz';

/** Vistas de la lección: cada una vive desde el inicio de un segmento hasta el inicio de otro. */
const VIEWS: [string, string | undefined, (S: Frame) => void][] = [
  ['hook', 'letters', drawIntro],
  ['letters', 'bpe-q', drawLanes],
  ['bpe-q', 'bpe-origin', drawMini],
  ['bpe-origin', 'toy', drawOrigin],
  ['toy', 'real-sizes', drawToy],
  ['real-sizes', 'rule', drawSizes],
  ['rule', 'billing', drawRule],
  ['billing', 'lang', drawCost],
  ['lang', 'lang-avg', drawLang],
  ['lang-avg', 'lang-why', drawLangBars],
  ['lang-why', 'lang-other', drawLangWhy],
  ['lang-other', 'ask', drawLangOther],
  ['ask', 'digits', drawLetters],
  ['digits', 'limits', drawDigits],
  ['limits', 'recap', drawLimits],
  ['recap', 'bridge', drawRecap],
  ['bridge', undefined, drawBridge],
];

const scene: SceneFactory = () => ({
  controls: [
    { id: 'merges', kind: 'slider', label: { es: 'Fusiones aplicadas', en: 'Merges applied' }, min: 0, max: MERGE_COUNT, step: 1, value: 0, from: 'toy-demo', to: 'real-sizes', fmt: (v) => String(Math.round(v)) },
    {
      id: 'pair', kind: 'choice', label: { es: 'Frase', en: 'Sentence' }, value: 0, from: 'lang-demo', to: 'lang-avg',
      options: [
        { value: 0, label: { es: 'Informe', en: 'Report' } },
        { value: 1, label: { es: 'Empresa', en: 'Company' } },
        { value: 2, label: { es: 'Cliente', en: 'Customer' } },
        { value: 3, label: { es: 'Costos', en: 'Costs' } },
      ],
    },
  ],

  init(S) { S.st = {}; },

  // Demostraciones guiadas (mientras la persona no toque el control) y gates. render() solo dibuja.
  update(S) {
    // fusiones del juguete: 0 al presentarlo; de 0 a 400 en la demostración; 400 después; en «size», vuelta a 0 y otra vez a 400
    if (S.between('toy', 'real-sizes')) {
      let m = 0;
      if (S.is('toy-demo')) m = MERGE_COUNT * ease.io(fr(S, 'toy-demo', 0.08, 0.85));
      else if (S.between('toy-result', 'size')) m = MERGE_COUNT;
      else if (S.is('size')) m = fr(S, 'size', 0.05, 0.3) < 1 ? MERGE_COUNT * (1 - ease.io(fr(S, 'size', 0.05, 0.3))) : MERGE_COUNT * ease.io(fr(S, 'size', 0.36, 0.86));
      S.drive('merges', Math.round(m));
    }
    // la frase de la comparación de idiomas: la primera; en la demostración, las otras tres, una tras otra
    if (S.between('lang', 'lang-avg')) {
      let k = 0;
      if (S.is('lang-demo')) { const q = fr(S, 'lang-demo', 0, 1); k = q < 0.12 ? 0 : q < 0.42 ? 1 : q < 0.7 ? 2 : 3; }
      else if (S.is('lang-try')) k = 3;
      S.drive('pair', k);
    }
    if (S.between('toy-try', 'size') && S.touched.has('merges')) S.complete('merges');
    if (S.between('lang-try', 'lang-avg') && S.touched.has('pair')) S.complete('lang');
  },

  render(S) {
    // En escenarios grandes todo crece un poco (letra, bloques y márgenes) para aprovechar el espacio; se restablece al final.
    const u0 = S.u, z = S.portrait ? Math.min(1.18, Math.max(clamp(S.H / 440, 1, 1.12), 1 / u0)) : S.H < 300 ? Math.max(1, 1 / u0) : clamp(S.H / 380, 1, 1.3);
    S.u = u0 * z; S.d.u = S.u;
    try {
      for (const [from, to, fn] of VIEWS) {
        if (!S.on(from) && from !== 'hook') continue;
        const aIn = from === 'hook' ? 1 : ease.out(fr(S, from, 0.03, 0.11));
        const aOut = to && S.on(to) ? 1 - clamp(fr(S, to, 0, 0.05)) : 1;
        const a = aIn * aOut;
        if (a > 0.003) S.d.withAlpha(a, () => fn(S));
      }
    } finally { S.u = u0; S.d.u = u0; }
  },
});
export default scene;
