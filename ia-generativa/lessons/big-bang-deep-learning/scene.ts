// Escena: El big bang del deep learning.
// Tres ingredientes (datos, cómputo, trucos) y una pila de acercamientos con números reales:
//  · datos: ImageNet y el error top-5 (cifras de Krizhevsky et al. 2012 y Russakovsky et al. 2015, ver facts.ts);
//  · cómputo: multiplicación de matrices con conteo ideal de pasos (rotulado), medidas reales de Raina et al. 2009;
//  · trucos: ReLU, dropout, AlexNet y, sobre todo, una pila de capas tanh con retropropagación REAL (model.ts) con y sin atajo.
// Dos turnos interactivos: la carrera CPU frente a GPU y el gradiente con y sin conexiones residuales.
// Organización: un archivo por acto (act-*.ts). Los gates se completan en ellos: S.complete('race') en act-compute.ts (raceUpdate)
// y S.complete('skip') en act-depth.ts (skipUpdate). Todo texto del lienzo es bilingüe con S.l(es, en) y cada acto se adapta
// a teléfono con S.portrait y a la zona útil con regions() (vía area()/strip() de shared.ts).
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawCores, drawMatmul, drawOccupancy, drawRace, drawRaina, raceAction, raceUpdate } from './act-compute';
import { drawComputeGrowth, drawBridge, drawRecap, drawStory } from './act-close';
import { drawMosaic, drawSizes, drawTop5 } from './act-data';
import { drawDeepProblem, drawDegradation, drawResnetWin, drawSkipBlock, drawSkipTry, drawToy, skipUpdate } from './act-depth';
import { drawThree, drawTime } from './act-history';
import { drawAlex, drawDropout, drawRelu, drawResults, drawTricks } from './act-tricks';

type Draw = (S: Frame) => void;
const GROUPS: [string, string[], Draw][] = [
  ['time', ['hook', 'quiet'], drawTime],
  ['three', ['three'], drawThree],
  ['mosaic', ['imagenet'], drawMosaic],
  ['sizes', ['ilsvrc'], drawSizes],
  ['top5', ['top5'], drawTop5],
  ['matmul', ['matmul', 'parallel'], drawMatmul],
  ['cores', ['cores'], drawCores],
  ['race', ['race-demo', 'race-try'], drawRace],
  ['occ', ['race-lesson'], drawOccupancy],
  ['raina', ['race-real'], drawRaina],
  ['tricks', ['tricks'], drawTricks],
  ['relu', ['relu'], drawRelu],
  ['dropout', ['dropout'], drawDropout],
  ['alex', ['alexnet', 'memory'], drawAlex],
  ['results', ['result', 'jump'], drawResults],
  ['deep', ['deep-problem'], drawDeepProblem],
  ['toy', ['toy', 'vanish'], drawToy],
  ['skipblock', ['skip-idea', 'skip-grad'], drawSkipBlock],
  ['skiptry', ['skip-demo', 'skip-try'], drawSkipTry],
  ['degr', ['degradation'], drawDegradation],
  ['resnet', ['resnet-win'], drawResnetWin],
  ['story', ['story-chart', 'human'], drawStory],
  ['compute', ['compute-growth'], drawComputeGrowth],
  ['recap', ['recap'], drawRecap],
  ['bridge', ['bridge'], drawBridge],
];
const ID_GROUP = new Map<string, number>();
GROUPS.forEach(([, ids], g) => ids.forEach((id) => ID_GROUP.set(id, g)));
const idsCache = new WeakMap<object, string[]>();
function groupOf(S: Frame, seg: number): number {
  let ids = idsCache.get(S.idx);
  if (!ids || ids.length !== Object.keys(S.idx).length) { ids = []; for (const [id, i] of Object.entries(S.idx)) ids[i] = id; idsCache.set(S.idx, ids); }
  return ID_GROUP.get(ids[seg] ?? '') ?? 0;
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'n', kind: 'slider', label: { es: 'Tamaño n de la matriz (n × n)', en: 'Matrix size n (n × n)' }, min: 4, max: 96, step: 4, value: 48, from: 'race-try', to: 'race-lesson', fmt: (v) => `${v} × ${v}` },
    { id: 'hw', kind: 'choice', label: { es: 'GPU', en: 'GPU' }, value: 'gtx580', from: 'race-try', to: 'race-lesson', options: [{ value: 'gtx580', label: { es: 'GTX 580 (2010)', en: 'GTX 580 (2010)' } }, { value: 'rtx3060', label: { es: 'RTX 3060 (2021)', en: 'RTX 3060 (2021)' } }] },
    { id: 'again', kind: 'button', label: { es: 'Repetir carrera', en: 'Run again' }, from: 'race-try', to: 'race-lesson' },
    { id: 'mode', kind: 'choice', label: { es: 'Red', en: 'Network' }, value: 'plain', from: 'skip-try', to: 'degradation', options: [{ value: 'plain', label: { es: 'Simple', en: 'Plain' } }, { value: 'res', label: { es: 'Con atajos', en: 'With shortcuts' } }] },
    { id: 'depth', kind: 'slider', label: { es: 'Profundidad (capas)', en: 'Depth (layers)' }, min: 1, max: 40, step: 1, value: 20, from: 'skip-try', to: 'degradation' },
  ],
  init() { /* el núcleo ya reinicia S.st; todo el estado interactivo vive ahí */ },
  update(S) {
    // demostración de los atajos: 30 capas, primero la red simple y luego con atajos (mientras nadie toque los controles)
    if (S.between('skip-demo', 'degradation')) {
      const D = Math.max(1, S.end('skip-demo') - S.start('skip-demo'));
      S.drive('depth', 30); S.drive('mode', S.on('skip-try') ? 'res' : S.since('skip-demo') < 0.5 * D ? 'plain' : 'res');
    }
    raceUpdate(S); skipUpdate(S);
  },
  action(S, id) { raceAction(S, id); },
  render(S) {
    const g = groupOf(S, S.seg), prev = groupOf(S, Math.max(0, S.seg - 1));
    const fade = g !== prev && S.seg > 0 ? clamp(S.segT / 0.45) : 1;
    S.d.withAlpha(fade, () => GROUPS[g][2](S));
  },
});

export default scene;
