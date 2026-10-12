// Escena: Embeddings. De la casilla por palabra (one-hot) a vectores aprendidos; flechas, ángulo y coseno; un mapa 2D (proyección) con vecinos reales;
// aritmética de significados con sus matices; sesgos medidos con los mismos vectores; búsqueda semántica y cómo evaluarla.
// Todo sale de vectores reales (GloVe 6B, 100 d) y de casos de búsqueda ilustrativos; ver los comentarios de los scripts .py de esta carpeta.
import type { PointerEvt, SceneFactory } from '../../../../../theme/kit';
import { drawContext, drawDense, drawGlove, drawHook, drawOneHot } from './act-slots';
import { drawGeom } from './act-geom';
import { cursorMap, drawMap, pointerMap } from './act-map';
import { drawArith, drawLimits, drawTry2 } from './act-arith';
import { drawBias } from './act-bias';
import { drawBoard, drawMeasure, drawOrder, drawSearchAvg, drawSearchIntro, drawTry3 } from './act-search';
import { drawBridge, drawRecap } from './act-close';
import { actionArith, actionKnn, actionSearch, arOf, knnOf, seOf, updateArith, updateKnn, updateSearch } from './logic';
import { PRESETS, QUERIES } from './search';

void PRESETS; void QUERIES;

const scene: SceneFactory = () => ({
  controls: [
    { id: 'w', kind: 'text', label: { es: 'Una palabra', en: 'A word' }, value: '', placeholder: { es: 'perro, pan, rey, médico…', en: 'dog, bread, king, doctor…' }, maxLength: 40, from: 'try1', to: 'polysemy' },
    { id: 'nextW', kind: 'button', label: { es: 'Otra palabra', en: 'Another word' }, from: 'try1', to: 'polysemy' },
    { id: 'expr', kind: 'text', label: { es: 'Operación', en: 'Operation' }, value: '', placeholder: { es: 'rey - hombre + mujer', en: 'king - man + woman' }, maxLength: 60, from: 'try2', to: 'bias-intro' },
    { id: 'excl', kind: 'toggle', label: { es: 'Excluir las palabras escritas', en: 'Exclude the typed words' }, value: true, from: 'try2', to: 'bias-intro' },
    { id: 'nextE', kind: 'button', label: { es: 'Otro ejemplo', en: 'Another example' }, from: 'try2', to: 'bias-intro' },
    { id: 'qry', kind: 'text', label: { es: 'Tu pregunta', en: 'Your question' }, value: '', placeholder: { es: 'quiero mi dinero de vuelta', en: 'I want my money back' }, maxLength: 90, from: 'try3', to: 'order' },
    { id: 'nextQ', kind: 'button', label: { es: 'Otra pregunta de la lista', en: 'Another question from the list' }, from: 'try3', to: 'order' },
  ],

  action(S, id) { actionKnn(S, id); actionArith(S, id); actionSearch(S, id); },

  pointer(S, e: PointerEvt) { pointerMap(S, e); },
  cursor(S, x, y) { return cursorMap(S, x, y); },

  // El estado interactivo avanza siempre, aunque el escenario no se vea; render() solo dibuja.
  update(S) {
    // mientras la persona no escriba ni pulse nada, la escena muestra sola tres ejemplos de la lista en cada «tu turno»
    const cycle = (seg: string) => Math.min(2, Math.floor(((S.t - S.start(seg)) / Math.max(1, S.end(seg) - S.start(seg))) * 3));
    if (S.is('try1') && !S.touched.has('w') && !S.touched.has('nextW')) knnOf(S).k = cycle('try1');
    if (S.is('try2') && !S.touched.has('expr') && !S.touched.has('nextE') && !S.touched.has('excl')) arOf(S).k = cycle('try2');
    if (S.is('try3') && !S.touched.has('qry') && !S.touched.has('nextQ')) seOf(S).k = cycle('try3');
    if (S.between('try1', 'polysemy')) updateKnn(S);
    if (S.between('try2', 'bias-intro')) updateArith(S);
    if (S.between('try3', 'order')) updateSearch(S);
  },

  render(S) {
    drawHook(S);
    drawOneHot(S);
    drawDense(S);
    drawContext(S);
    drawGlove(S);
    drawGeom(S);
    drawMap(S);
    drawArith(S);
    drawLimits(S);
    drawTry2(S);
    drawBias(S);
    drawSearchIntro(S);
    drawSearchAvg(S);
    drawBoard(S);
    drawTry3(S);
    drawOrder(S);
    drawMeasure(S);
    drawRecap(S);
    drawBridge(S);
  },
});

export default scene;
