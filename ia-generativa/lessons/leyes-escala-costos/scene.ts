// Escena: Leyes de escala y costos. Seis actos que se funden uno en otro:
//  1 · la curva (ley de potencia, log-log)  2 · C ≈ 6·N·D  3 · la calculadora real (FLOPs → días → costo)
//  4 · el reparto de un presupuesto fijo (Chinchilla)  5 · ¿habilidades emergentes?  6 · qué decides tú.
// Tres turnos: la calculadora, buscar el balance Chinchilla y cambiar la métrica de una «habilidad emergente».
import { regions, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { count, nf, sci } from './model';
import { drawAct1 } from './act1';
import { drawAct2 } from './act2';
import { drawAct3, updateCalc } from './act3';
import { drawAct4, updateBudget } from './act4';
import { drawAct5, updateMetric } from './act5';
import { drawAct6 } from './act6';

/** Índice del acto vigente según el segmento en curso. */
const act = (S: Frame) => (S.on('from-scratch') ? 5 : S.on('emergent') ? 4 : S.on('budget-intro') ? 3 : S.on('mfu') ? 2 : S.on('flops') ? 1 : 0);

const gpuFmt = (v: number, l: 'es' | 'en') => nf(Math.round(2 ** v), 0, l);

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: la calculadora ──
    { id: 'logN', kind: 'slider', label: { es: 'Parámetros N', en: 'Parameters N' }, min: 8, max: 12.3, step: 0.01, value: 9.845, fmt: (v, l) => count(10 ** v, l), from: 'try-calc', to: 'budget-intro' },
    { id: 'logD', kind: 'slider', label: { es: 'Tokens de entrenamiento D', en: 'Training tokens D' }, min: 9, max: 13.7, step: 0.01, value: 11.146, fmt: (v, l) => count(10 ** v, l), from: 'try-calc', to: 'budget-intro' },
    { id: 'logG', kind: 'slider', label: { es: 'GPUs (supuesto)', en: 'GPUs (assumption)' }, min: 3, max: 15.6, step: 0.25, value: 8, fmt: (v, l) => gpuFmt(v, l), from: 'try-calc', to: 'budget-intro' },
    { id: 'peak', kind: 'slider', label: { es: 'Pico por GPU, teraFLOPS (supuesto)', en: 'Peak per GPU, teraFLOPS (assumption)' }, min: 100, max: 2000, step: 10, value: 989, fmt: (v, l) => nf(v, 0, l), from: 'try-calc', to: 'budget-intro' },
    { id: 'mfu', kind: 'slider', label: { es: 'MFU (supuesto)', en: 'MFU (assumption)' }, min: 5, max: 65, step: 1, value: 40, fmt: (v, l) => `${nf(v, 0, l)} %`, from: 'try-calc', to: 'budget-intro' },
    { id: 'price', kind: 'slider', label: { es: 'Precio por GPU-hora (supuesto)', en: 'Price per GPU-hour (assumption)' }, min: 0.5, max: 8, step: 0.1, value: 2, fmt: (v, l) => (l === 'es' ? `US$ ${nf(v, 2, l)}` : `$${nf(v, 2, l)}`), from: 'try-calc', to: 'budget-intro' },
    // ── turno 2: el balance con un presupuesto fijo ──
    { id: 'n2', kind: 'slider', label: { es: 'Tamaño del modelo N', en: 'Model size N' }, min: 9, max: 12, step: 0.01, value: 11, fmt: (v, l) => count(10 ** v, l), from: 'try-budget', to: 'both-grow' },
    { id: 'c2', kind: 'slider', label: { es: 'Presupuesto de cómputo C, FLOPs (supuesto)', en: 'Compute budget C, FLOPs (assumption)' }, min: 22, max: 24.6, step: 0.02, value: 23.76, fmt: (v, l) => sci(10 ** v, l, 1), from: 'try-budget', to: 'both-grow' },
    // ── turno 3: la métrica ──
    { id: 'metric', kind: 'choice', label: { es: 'Métrica', en: 'Metric' }, options: [{ value: 'exact', label: { es: 'Todo o nada', en: 'All or nothing' } }, { value: 'partial', label: { es: 'Puntaje parcial', en: 'Partial score' } }], value: 'exact', from: 'try-metric', to: 'verdict' },
    { id: 'kk', kind: 'slider', label: { es: 'Longitud de la respuesta (tokens)', en: 'Answer length (tokens)' }, min: 1, max: 12, step: 1, value: 10, fmt: (v, l) => nf(v, 0, l), from: 'try-metric', to: 'verdict' },
  ],

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    if (updateCalc(S)) S.complete('calc');        // turno 1: N, D de GPT-3 y luego el doble de GPU
    if (updateBudget(S)) S.complete('budget');    // turno 2: el tamaño con menor pérdida para el presupuesto
    if (updateMetric(S)) S.complete('metric');    // turno 3: puntaje parcial o respuesta corta
  },

  render(S) {
    const d = S.d;
    // cada acto se funde con el siguiente (como en la lección de referencia)
    const t2 = S.at('flops', 0, 0.9), t3 = S.at('mfu', 0, 0.9), t4 = S.at('budget-intro', 0, 0.9), t5 = S.at('emergent', 0, 0.9), t6 = S.at('from-scratch', 0, 0.9);
    const R = regions(S, 0.68);
    const a1 = 1 - t2, a2 = t2 * (1 - t3), a3 = t3 * (1 - t4), a4 = t4 * (1 - t5), a5 = t5 * (1 - t6);
    if (a1 > 0.005) d.withAlpha(a1, () => drawAct1(S, R));
    if (a2 > 0.005) d.withAlpha(a2, () => drawAct2(S, R));
    if (a3 > 0.005) d.withAlpha(a3, () => drawAct3(S));
    if (a4 > 0.005) d.withAlpha(a4, () => drawAct4(S));
    if (a5 > 0.005) d.withAlpha(a5, () => drawAct5(S));
    if (t6 > 0.005) d.withAlpha(t6, () => drawAct6(S));
    // fuente de cada acto, en una línea al pie
    const src = S.l(
      ['Kaplan et al., 2020 · WebText2', 'Kaplan · Hoffmann · Brown · Llama 3 (2020–24)', 'Supuestos ilustrativos · MFU: PaLM, Llama 3', 'Hoffmann 2022 · constantes: Besiroglu 2024', 'Wei 2022 · Schaeffer 2023 · modelo sintético', 'Llama 3 (2024) · supuestos ilustrativos'][act(S)],
      ['Kaplan et al., 2020 · WebText2', 'Kaplan · Hoffmann · Brown · Llama 3 (2020–24)', 'Illustrative assumptions · MFU: PaLM, Llama 3', 'Hoffmann 2022 · constants: Besiroglu 2024', 'Wei 2022 · Schaeffer 2023 · synthetic model', 'Llama 3 (2024) · illustrative assumptions'][act(S)],
    );
    if (!S.on('bridge')) d.text(src, 14 * S.u, S.H - 3 * S.u, { size: Math.max(11, 12.2 / S.u), weight: 600, color: S.pal.mute, base: 'bottom', a: 0.9 });
  },
});

export default scene;
