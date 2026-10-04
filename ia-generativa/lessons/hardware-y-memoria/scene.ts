// Escena: GPUs, memoria y cuantización. Seis actos que se funden uno en otro:
//  1 · ¿cabe? (GPU, VRAM, bytes por parámetro, calculadora)  2 · entrenar = 16 B por parámetro  3 · ancho de banda y el muro de la memoria
//  4 · repartir entre GPU (datos, pipeline, tensor)  5 · cuantización con pesos reales  6 · resumen y puente.
// Tres turnos: la calculadora de memoria, repartir el entrenamiento de un modelo de 70 mil M y romper/arreglar la cuantización.
import { regions, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { BITS_LIST, count, nf } from './model';
import { drawAct1, updateCalc } from './act1';
import { drawAct2 } from './act2';
import { drawAct3 } from './act3';
import { drawAct4, updateSplit } from './act4';
import { drawAct5, updateQuant } from './act5';
import { drawAct6 } from './act6';
import { phases } from './ui';

const pow2 = (v: number, l: 'es' | 'en') => nf(2 ** v, 0, l);

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: la calculadora de memoria ──
    { id: 'logN', kind: 'slider', label: { es: 'Parámetros del modelo', en: 'Model parameters' }, min: 9, max: 12.7, step: 0.01, value: 9.845, fmt: (v, l) => count(10 ** v, l), from: 'try-calc', to: 'train-q' },
    { id: 'prec', kind: 'choice', label: { es: 'Precisión', en: 'Precision' }, options: [{ value: 'fp32', label: { es: 'FP32', en: 'FP32' } }, { value: 'fp16', label: { es: 'FP16', en: 'FP16' } }, { value: 'int8', label: { es: 'INT8', en: 'INT8' } }, { value: 'int4', label: { es: 'INT4', en: 'INT4' } }], value: 'fp16', from: 'try-calc', to: 'train-q' },
    // ── turno 2: repartir el entrenamiento ──
    { id: 'tp', kind: 'slider', label: { es: 'Tensor (GPU por capa)', en: 'Tensor (GPUs per layer)' }, min: 0, max: 3, step: 1, value: 0, fmt: (v, l) => pow2(v, l), from: 'try-split', to: 'quant-idea' },
    { id: 'pp', kind: 'slider', label: { es: 'Pipeline (tramos de capas)', en: 'Pipeline (layer stages)' }, min: 0, max: 4, step: 1, value: 0, fmt: (v, l) => pow2(v, l), from: 'try-split', to: 'quant-idea' },
    { id: 'dp', kind: 'slider', label: { es: 'Datos (réplicas)', en: 'Data (replicas)' }, min: 0, max: 6, step: 1, value: 0, fmt: (v, l) => pow2(v, l), from: 'try-split', to: 'quant-idea' },
    // ── turno 3: cuantizar pesos reales ──
    { id: 'qbits', kind: 'slider', label: { es: 'Bits por peso', en: 'Bits per weight' }, min: 0, max: BITS_LIST.length - 1, step: 1, value: BITS_LIST.length - 1, fmt: (v) => String(BITS_LIST[Math.round(v)]), from: 'try-quant', to: 'payoff' },
    { id: 'qscheme', kind: 'choice', label: { es: 'Escala', en: 'Scale' }, options: [{ value: 'tensor', label: { es: 'Una por matriz', en: 'One per matrix' } }, { value: 'group', label: { es: 'Una por grupo de 32', en: 'One per group of 32' } }], value: 'tensor', from: 'try-quant', to: 'payoff' },
  ],

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    if (updateCalc(S)) S.complete('calc');        // turno 1: un modelo de ~13 mil M cabe, con margen, en la RTX 3060
    if (updateSplit(S)) S.complete('split');      // turno 2: cabe con tensor ≤ 8 y hay al menos dos réplicas de datos
    if (updateQuant(S)) S.complete('quant');      // turno 3: una escala por matriz a ≤ 4 bits se rompe; una por grupo lo arregla
  },

  render(S) {
    const d = S.d, R = regions(S, S.portrait ? 0.7 : 0.66);
    const [a1, a2, a3, a4, a5, a6] = phases(S, ['hook', 'train-q', 'bandwidth', 'no-fit', 'quant-idea', 'recap']);
    if (a1 > 0.005) d.withAlpha(a1, () => drawAct1(S, R));
    if (a2 > 0.005) d.withAlpha(a2, () => drawAct2(S, R.all));
    if (a3 > 0.005) d.withAlpha(a3, () => drawAct3(S, R.all));
    if (a4 > 0.005) d.withAlpha(a4, () => drawAct4(S, R));
    if (a5 > 0.005) d.withAlpha(a5, () => drawAct5(S, R));
    if (a6 > 0.005) d.withAlpha(a6, () => drawAct6(S, R.all));
    // fuente de cada acto, en una línea al pie
    if (!S.on('bridge')) {
      const act = S.on('recap') ? 5 : S.on('quant-idea') ? 4 : S.on('no-fit') ? 3 : S.on('bandwidth') ? 2 : S.on('train-q') ? 1 : 0;
      const src = S.l(
        ['Fichas de NVIDIA y GeForce · bits reales de un peso de Pythia-1.4B', 'ZeRO (2020) · Korthikanti (2022) · medido en una RTX 3060', 'Fichas de NVIDIA · Llama 3 (2024) · medido en una RTX 3060', 'Llama 3 (2024), tabla 4 · Narayanan (2021) · límites: supuestos ilustrativos', 'Pythia-1.4B + WikiText-2 · redondeo simple · Llama 3 (2024), §6.2', 'Resumen de la lección'][act],
        ['NVIDIA and GeForce datasheets · real bits of a Pythia-1.4B weight', 'ZeRO (2020) · Korthikanti (2022) · measured on an RTX 3060', 'NVIDIA datasheets · Llama 3 (2024) · measured on an RTX 3060', 'Llama 3 (2024), table 4 · Narayanan (2021) · limits: illustrative assumptions', 'Pythia-1.4B + WikiText-2 · simple rounding · Llama 3 (2024), §6.2', 'Lesson summary'][act],
      );
      d.text(src, 14 * S.u, S.H - 3 * S.u, { size: Math.max(11, 12.2 / S.u), weight: 600, color: S.pal.mute, base: 'bottom', a: 0.9 });
    }
  },
});

export default scene;
