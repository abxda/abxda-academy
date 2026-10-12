// Escena: GPUs, memoria y cuantización. Vistas que se funden una en otra, cada una dueña de un tramo de segmentos:
//   la pregunta · la GPU por partes (núcleos, memoria, VRAM, tamaños) · qué es un byte · los bytes de un parámetro real ·
//   la cuenta de 70 mil millones · la calculadora · entrenar = 16 bytes por parámetro · el ancho de banda · el muro de la
//   memoria · los tres paralelismos · Llama 3.1 405B en 16 384 H100 · cuantizar: la idea, la imagen con menos tonos, la regla,
//   el laboratorio con pesos reales de Pythia-1.4B y su pérdida medida, lo que se gana y la advertencia · resumen y puente.
//
// La escena hace sola cada demostración moviendo sus controles con S.drive (tamaño y formato en la calculadora; bits en la
// cuantización) mientras la persona no los toque; los dos «tu turno» son opcionales y se completan solo con lo que ella hace
// (S.touched). Todo se anima por fracciones de la duración de cada segmento (las voces y los idiomas duran distinto).
// Mediciones: real-data.ts (build-data.py) y measure-memory.py; hechos: ver `sources` en content.ts.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { BITS, MODELS, bitsIndex, bitsOf } from './model';
import { ap, fr } from './draw';
import { drawGpu, drawHook } from './v-gpu';
import { drawByte, drawBytes, drawCount } from './v-bytes';
import { calcTarget, drawCalc } from './v-calc';
import { drawTrain } from './v-train';
import { drawPipe, drawWall } from './v-bw';
import { drawLlama, drawPar } from './v-par';
import { drawCaution, drawImg, drawLab, drawPay, drawQuantQ, drawRuler } from './v-quant';
import { drawBridge, drawRecap } from './v-end';

/** Vistas: cada una vive desde el inicio de un segmento hasta el inicio de otro. */
const VIEWS: [string, string | undefined, (S: Frame) => void][] = [
  ['hook', 'gpu', drawHook],
  ['gpu', 'bytes-what', drawGpu],
  ['bytes-what', 'fp32', drawByte],
  ['fp32', 'count-n', drawBytes],
  ['count-n', 'calc-demo', drawCount],
  ['calc-demo', 'train-q', drawCalc],
  ['train-q', 'bw-what', drawTrain],
  ['bw-what', 'bw-wall', drawPipe],
  ['bw-wall', 'par-q', drawWall],
  ['par-q', 'par-llama', drawPar],
  ['par-llama', 'quant-q', drawLlama],
  ['quant-q', 'quant-img', drawQuantQ],
  ['quant-img', 'quant-ruler', drawImg],
  ['quant-ruler', 'quant-real', drawRuler],
  ['quant-real', 'quant-pay', drawLab],
  ['quant-pay', 'quant-caution', drawPay],
  ['quant-caution', 'recap', drawCaution],
  ['recap', 'bridge', drawRecap],
  ['bridge', undefined, drawBridge],
];

/** Formato de número para los controles (sin Frame): punto decimal; en español, espacio para los miles. */
const step = (seq: [number, string][], f: number) => { let v = seq[0][1]; for (const [at, val] of seq) if (f >= at) v = val; return v; };
const stepN = (seq: [number, number][], f: number) => { let v = seq[0][1]; for (const [at, val] of seq) if (f >= at) v = val; return v; };

const scene: SceneFactory = () => ({
  controls: [
    {
      id: 'model', kind: 'choice', label: { es: 'Tamaño del modelo', en: 'Model size' }, value: '70', from: 'calc-demo', to: 'train-q',
      options: MODELS.map((m) => ({ value: m.id, label: { es: m.es, en: m.en } })),
    },
    {
      id: 'fmt', kind: 'choice', label: { es: 'Formato de cada número', en: 'Format of each number' }, value: 'fp16', from: 'calc-demo', to: 'train-q',
      options: [
        { value: 'fp32', label: { es: 'FP32', en: 'FP32' } },
        { value: 'fp16', label: { es: 'FP16', en: 'FP16' } },
        { value: 'int8', label: { es: 'INT8', en: 'INT8' } },
        { value: 'int4', label: { es: 'INT4', en: 'INT4' } },
      ],
    },
    {
      id: 'bits', kind: 'slider', label: { es: 'Bits por parámetro', en: 'Bits per parameter' }, min: 0, max: BITS.length - 1, step: 1, value: BITS.length - 1,
      from: 'quant-ruler', to: 'quant-pay',
      fmt: (v, l) => { const b = bitsOf(v); return b >= 16 ? (l === 'es' ? '16 (FP16, el original)' : '16 (FP16, the original)') : String(b); },
    },
  ],

  init(S) { S.st = {}; },

  // Demostraciones guiadas y gates. render() solo lee S.p y S.st.
  update(S) {
    const dt = Math.min(S.dt || 0.016, 0.1);
    const jumped = S.st.lastT === undefined || Math.abs(S.t - S.st.lastT) > 0.3;
    S.st.lastT = S.t;

    // ── la calculadora: el modelo de 70 mil M en cada formato; luego uno de 8 mil M; en el turno, el de 405 mil M en FP16 ──
    if (S.is('calc-demo')) {
      S.drive('model', '70');
      S.drive('fmt', step([[0, 'fp16'], [0.22, 'fp32'], [0.42, 'fp16'], [0.58, 'int8'], [0.76, 'int4']], fr(S, 'calc-demo', 0, 1)));
    } else if (S.is('calc-demo2')) {
      S.drive('model', '8');
      S.drive('fmt', step([[0, 'fp16'], [0.62, 'int8']], fr(S, 'calc-demo2', 0, 1)));
    } else if (S.is('calc-try')) {
      S.drive('model', '405'); S.drive('fmt', 'fp16');
    }
    if (S.between('calc-try', 'train-q') && (S.touched.has('model') || S.touched.has('fmt'))) S.complete('calc');
    if (S.between('calc-demo', 'train-q')) {
      const g = calcTarget(S).gb;
      S.st.gbShow = jumped || S.st.gbShow === undefined ? g : S.st.gbShow + (g - S.st.gbShow) * (1 - Math.exp(-dt * 6));
    }

    // ── los bits: la regla (8 → 4 → 2 → 4), el laboratorio (8 → … → 2) y la pérdida (16 → 4 → 2) ──
    const B = (b: number) => bitsIndex(b);
    if (S.is('quant-ruler')) S.drive('bits', stepN([[0, B(8)], [0.4, B(4)], [0.64, B(2)], [0.86, B(4)]], fr(S, 'quant-ruler', 0, 1)));
    else if (S.is('quant-real')) S.drive('bits', B(8));
    else if (S.is('quant-demo')) S.drive('bits', stepN([[0, B(8)], [0.2, B(6)], [0.31, B(5)], [0.42, B(4)], [0.56, B(3)], [0.68, B(2)]], fr(S, 'quant-demo', 0, 1)));
    else if (S.is('quant-loss')) S.drive('bits', stepN([[0, B(16)], [0.42, B(4)], [0.66, B(2)]], fr(S, 'quant-loss', 0, 1)));
    else if (S.is('quant-try')) S.drive('bits', B(4));
    if (S.between('quant-try', 'quant-pay') && S.touched.has('bits')) S.complete('quant');
    // cuando cambian los bits, la imagen cuantizada se funde con la anterior (con el reloj continuo: sigue en pausa)
    const b = bitsOf(S.p.bits);
    if (b !== S.st.bitsCur || jumped) { S.st.bitsPrev = jumped || S.st.bitsCur === undefined ? b : S.st.bitsCur; S.st.bitsCur = b; S.st.bitsSince = jumped ? -1e9 : S.clock; }
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
        const a = aIn * aOut;
        if (a > 0.003) S.d.withAlpha(a, () => fn(S));
      }
    } finally { S.u = u0; S.d.u = u0; }
  },
});
export default scene;
