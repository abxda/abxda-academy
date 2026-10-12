// Escena: Estrategia para organizaciones. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale
// al empezar la siguiente):
//  1 · de las piezas a la decisión                                                               (hook)
//  2 · la lista de casos de uso de la tienda, columna por columna                                (ideas … risk)
//  3 · el cuadro de dos por dos (valor en juego × riesgo), con su «tu turno» (elegir un caso)    (axis-x … try-matrix)
//  4 · construir, comprar o ajustar                                                              (paths … bvb-rule)
//  5 · costo por tarea, costo total y retorno, con su «tu turno» (dudas al mes)                  (task-cost … try-roi)
//  6 · preparar los datos                                                                        (data)
//  7 · el piloto: plazo, meta, línea base y métricas                                             (pilot-def … metrics)
//  5'· de vuelta a la cuenta, ahora con lo medido                                                (pilot-measure, scale)
//  8 · lo que dicen los estudios (Brynjolfsson et al.; Gartner)                                  (real-study, pilots-fail)
//  9 · las personas: gestión del cambio y la frontera irregular                                  (change, jagged)
// 10 · dos errores: decidir por una demo y la IA en la sombra                                    (err-demo … shadow-stat)
// 11 · el plan de noventa días y el puente                                                       (plan-1 … bridge)
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo que
// hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento (ui.ts: fr, win).
//
// REAL (procedencia al pie): Brynjolfsson, Li y Raymond (QJE, 2025), Dell’Acqua et al. (HBS, 2023), Microsoft y LinkedIn
// (Work Trend Index, 2024), Gartner (comunicado del 29 de julio de 2024), precios de ejemplo de la lección 26.
// ILUSTRATIVO (rotulado): la tienda, sus cinco casos, sus cifras, dónde caen en el cuadro, los costos, los supuestos del
// retorno, el piloto y su medición, los documentos del manual y la evaluación de la demo.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { A } from './model';
import { drawHook, drawList, listSource } from './v-intro';
import { CASE_IDS, demoCase, drawMatrix, matrixSource } from './v-matrix';
import { drawPaths } from './v-paths';
import { costSource, drawCost } from './v-cost';
import { drawData, drawPilot, pilotSource } from './v-pilot';
import { drawPeople, drawStudies, peopleSource, studiesSource } from './v-studies';
import { drawErrors, errorsSource } from './v-errors';
import { drawBridge, drawPlan } from './v-plan';
import { CASES } from './model';
import { fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'ideas', draw: drawHook },
  { from: 'ideas', to: 'axis-x', draw: drawList, src: listSource },
  { from: 'axis-x', to: 'paths', draw: drawMatrix, src: matrixSource },
  { from: 'paths', to: 'task-cost', draw: drawPaths },
  { from: 'task-cost', to: 'data', draw: drawCost, src: costSource },
  { from: 'data', to: 'pilot-def', draw: drawData, src: pilotSource },
  { from: 'pilot-def', to: 'pilot-measure', draw: drawPilot, src: pilotSource },
  { from: 'pilot-measure', to: 'real-study', draw: drawCost, src: costSource },
  { from: 'real-study', to: 'change', draw: drawStudies, src: studiesSource },
  { from: 'change', to: 'err-demo', draw: drawPeople, src: peopleSource },
  { from: 'err-demo', to: 'plan-1', draw: drawErrors, src: errorsSource },
  { from: 'plan-1', to: 'bridge', draw: drawPlan },
  { from: 'bridge', draw: drawBridge },
];

/** Dudas al mes que muestra la demostración: dos mil; luego quinientas (se pierde) y mil (casi empate). */
function demoVol(S: Frame): number {
  if (S.on('try-roi')) return A.vol;
  const down = fr(S, 'roi-demo', 0.14, 0.38, 'io'), up = fr(S, 'roi-demo', 0.56, 0.7, 'io');
  const v = up > 0 ? 500 + 500 * up : A.vol - (A.vol - 500) * down;
  return Math.round(v / 100) * 100;
}
/** Minutos ahorrados por duda: el supuesto (seis) cede a lo medido en el piloto (cuatro). */
const demoMin = (S: Frame) => Math.round((A.min - 2 * fr(S, 'pilot-measure', 0.4, 0.6, 'io')) * 2) / 2;

interface St { caso?: string; casoAt?: number }
const st = (S: Frame): St => (S.st.es ??= {}) as St;

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: elegir un caso en el cuadro de dos por dos ──
    {
      id: 'caso', kind: 'choice', label: { es: 'Caso', en: 'Case' }, value: 'garantia', from: 'q-start', to: 'paths',
      options: CASE_IDS.map((id) => { const c = CASES.find((k) => k.id === id)!; return { value: id, label: c.short }; }),
    },
    // ── turno 2: las dudas al mes en la cuenta del retorno ──
    {
      id: 'vol', kind: 'slider', label: { es: 'Dudas al mes', en: 'Questions per month' }, min: 200, max: 3000, step: 100, value: A.vol, from: 'roi-demo', to: 'data',
      fmt: (v, l) => (l === 'es' ? Math.round(v).toLocaleString('en-US').replace(/,/g, ' ') : Math.round(v).toLocaleString('en-US')),
    },
    // ── lo medido en el piloto (sin «tu turno»: la demostración lo mueve y quien quiera puede probar) ──
    {
      id: 'min', kind: 'slider', label: { es: 'Minutos ahorrados por duda (medidos)', en: 'Minutes saved per question (measured)' }, min: 0, max: 9, step: 0.5, value: A.min, from: 'pilot-measure', to: 'real-study',
      fmt: (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)),
    },
  ],

  init(S) { S.st = {}; },

  // Estado interactivo: avanza siempre; render() solo lo lee.
  update(S) {
    const s = st(S);
    if (S.between('q-start', 'paths')) {
      const c = S.drive('caso', demoCase(S)) as string;
      if (c !== s.caso) { s.caso = c; s.casoAt = S.clock; }   // el panel del caso entra con un fundido corto
      if (S.on('try-matrix') && S.touched.has('caso')) S.complete('matrix');
    }
    if (S.between('roi-demo', 'data')) {
      S.drive('vol', demoVol(S));
      if (S.on('try-roi') && S.touched.has('vol')) S.complete('roi');
    }
    if (S.between('pilot-measure', 'real-study')) S.drive('min', demoMin(S));
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
