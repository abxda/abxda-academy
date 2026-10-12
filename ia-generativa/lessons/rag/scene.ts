// Escena: RAG, leer antes de responder. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al
// empezar la siguiente):
//  1 · el chat de la tienda: el modelo nunca leyó el manual y adivina (respuesta ilustrativa)        (hook … guess)
//  2 · pegarlo todo no cabe; buscar primero y pegar solo lo que responde                          (paste, idea)
//  3 · el nombre RAG y el artículo de Lewis et al. (2020)                                         (rag-name, rag-paper)
//  4 · los dos tiempos: preparar una vez · con cada pregunta                                      (two-times)
//  5 · el manual ficticio y sus 25 fragmentos                                                     (manual, chunk)
//  6 · el tamaño del fragmento (demostración con S.drive y «tu turno» de un deslizador)           (size-small … try-chunk)
//  7 · un fragmento → su vector TF-IDF → el índice → la base de datos vectorial                   (vector … vector-db)
//  8 · la pregunta → vector → coseno con los 25 → ordenar → los k = 3 primeros                    (ask … topk-read)
//  9 · el prompt con fuentes numeradas → la respuesta con su cita → anclaje                       (prompt-system … grounding)
// 10 · otras preguntas (demostración y «tu turno»: elegir o escribir una pregunta)               (demo-ask … try-ask)
// 11 · cuántos fragmentos pegar (demostración y «tu turno» del deslizador k)                     (k-one … try-k)
// 12 · el reordenador                                                                            (rerank, rerank-demo)
// 13–16 · tres fallas y las defensas · 17 · evaluar con preguntas propias · 18 · resumen · 19 · puente a agentes.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo que
// hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento.
//
// REAL: la búsqueda TF-IDF y el coseno (ir.ts, en el navegador); las puntuaciones de embeddings (multilingual-e5-small) y
// del reordenador (mmarco-mMiniLMv2) medidas aparte (build-dense.py → dense.ts); los datos de Lewis et al. (2020).
// INVENTADO Y ROTULADO: el manual de la tienda, la garantía vieja, la reseña con la trampa; ILUSTRATIVO: la respuesta del
// modelo sin documentos y la que daría si obedece la trampa. La respuesta «con citas» la arma un generador de juguete que
// copia frases de la mejor fuente (rotulado en pantalla y en la narración).
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { chunkDemo, EXAMPLES, lang } from './model';
import { drawBridge, drawChat, drawName, drawPages, drawPipe } from './v-intro';
import { drawManual, drawSize, drawVec, gNow } from './v-prep';
import { boardQ, drawBoard, drawK, drawPrompt, drawRerank, drawSearch, kNow } from './v-search';
import { drawConflict, drawEval, drawGuard, drawMiss, drawTrap } from './v-fail';
import { fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const MANUAL = (S: Frame) => S.l('Manual ficticio, escrito para esta lección', 'Made-up manual, written for this lesson');
const VIEWS: View[] = [
  { from: 'hook', to: 'paste', draw: drawChat, src: (S) => (S.on('guess') ? S.l('Respuesta ilustrativa', 'Illustrative answer') : '') },
  { from: 'paste', to: 'rag-name', draw: drawPages, src: (S) => S.l('Ilustrativo', 'Illustrative') },
  { from: 'rag-name', to: 'two-times', draw: drawName, src: (S) => (S.on('rag-paper') ? S.l('Lewis et al. (2020): Wikipedia de diciembre de 2018', 'Lewis et al. (2020): Wikipedia, December 2018') : '') },
  { from: 'two-times', to: 'manual', draw: (S) => drawPipe(S, 'two') },
  { from: 'manual', to: 'size-small', draw: drawManual, src: (S) => S.l('Manual ficticio, escrito para esta lección: no describe ninguna tienda real', 'Made-up manual, written for this lesson: it describes no real shop') },
  { from: 'size-small', to: 'vector', draw: drawSize, src: (S) => S.l('Coseno TF-IDF real con la pregunta, calculado en tu navegador', 'Real TF-IDF cosine with the question, computed in your browser') },
  { from: 'vector', to: 'ask', draw: drawVec, src: (S) => S.l('Vectores TF-IDF reales del manual ficticio', 'Real TF-IDF vectors of the made-up manual') },
  { from: 'ask', to: 'prompt-system', draw: drawSearch, src: (S) => S.l('Búsqueda TF-IDF real, calculada en tu navegador', 'Real TF-IDF search, computed in your browser') },
  { from: 'prompt-system', to: 'demo-ask', draw: drawPrompt, src: (S) => (S.on('generate') ? S.l('Generador de juguete: copia frases de la mejor fuente', 'Toy generator: it copies sentences from the best source') : MANUAL(S)) },
  { from: 'demo-ask', to: 'k-one', draw: drawBoard, src: (S) => S.l('Búsqueda real · respuesta de un generador de juguete que copia frases', 'Real search · answer from a toy generator that copies sentences') },
  { from: 'k-one', to: 'rerank', draw: drawK, src: (S) => S.l('Búsqueda TF-IDF real sobre el manual ficticio', 'Real TF-IDF search over the made-up manual') },
  { from: 'rerank', to: 'fail-miss', draw: drawRerank, src: (S) => S.l('Reordenador real: mmarco-mMiniLMv2, puntuaciones medidas aparte', 'Real reranker: mmarco-mMiniLMv2, scores measured offline') },
  { from: 'fail-miss', to: 'fail-conflict', draw: drawMiss, src: (S) => S.l('Embeddings reales: multilingual-e5-small, medidos aparte', 'Real embeddings: multilingual-e5-small, measured offline') },
  { from: 'fail-conflict', to: 'fail-trap', draw: drawConflict, src: (S) => S.l('Versión vieja inventada para la demostración · búsqueda real', 'Old version made up for the demo · real search') },
  { from: 'fail-trap', to: 'fail-guard', draw: drawTrap, src: (S) => S.l('Reseña inventada · búsqueda real · la respuesta del modelo es ilustrativa', 'Made-up review · real search · the model’s answer is illustrative') },
  { from: 'fail-guard', to: 'eval-gold', draw: drawGuard },
  { from: 'eval-gold', to: 'recap', draw: drawEval, src: (S) => S.l('Medición real: TF-IDF, multilingual-e5-small y mmarco-mMiniLMv2 sobre 10 preguntas', 'Real measurement: TF-IDF, multilingual-e5-small, and mmarco-mMiniLMv2 on 10 questions') },
  { from: 'recap', to: 'bridge', draw: (S) => drawPipe(S, 'recap') },
  { from: 'bridge', draw: drawBridge },
];

/** Tamaño del fragmento en la demostración: oraciones sueltas → dos → la garantía entera. */
function demoG(S: Frame) {
  if (S.on('size-big')) return fr(S, 'size-big', 0.1, 0.11) > 0 ? 8 : 2;
  if (S.on('size-two')) return fr(S, 'size-two', 0.1, 0.11) > 0 ? 2 : 1;
  return 1;
}
/** Pregunta de la demostración: batería → cancelar → horario del taller → costo del envío; Lima en «nope». */
function demoEx(S: Frame) {
  if (S.on('nope')) return 4;
  const f = (a: number) => fr(S, 'demo-ask', a, a + 0.01) > 0;
  return f(0.55) ? 3 : f(0.36) ? 2 : f(0.15) ? 1 : 0;
}
/** k de la demostración: 1 → 2 → 3. */
function demoK(S: Frame) {
  if (S.on('try-k')) return 3;
  if (S.on('k-demo')) return fr(S, 'k-demo', 0.42, 0.43) > 0 ? 3 : fr(S, 'k-demo', 0.18, 0.19) > 0 ? 2 : 1;
  return 1;
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'g', kind: 'slider', label: { es: 'Oraciones por fragmento', en: 'Sentences per chunk' }, min: 1, max: 8, step: 1, value: 1, from: 'size-small', to: 'vector', fmt: (v) => String(v) },
    { id: 'ex', kind: 'choice', label: { es: 'Pregunta', en: 'Question' }, value: 0, from: 'demo-ask', to: 'k-one', options: EXAMPLES.es.map((e, i) => ({ value: i, label: { es: e.label, en: EXAMPLES.en[i].label } })) },
    { id: 'q', kind: 'text', label: { es: 'O escribe tu pregunta', en: 'Or type your question' }, value: '', maxLength: 120, placeholder: { es: 'por ejemplo: ¿la garantía cubre las llantas?', en: 'for example: does the warranty cover the tires?' }, from: 'demo-ask', to: 'k-one' },
    { id: 'k', kind: 'slider', label: { es: 'k: fragmentos que se pegan', en: 'k: chunks pasted' }, min: 1, max: 5, step: 1, value: 1, from: 'k-one', to: 'rerank', fmt: (v) => String(v) },
  ],

  init(S) { S.st = { lastT: -1, gx: undefined, qx: undefined, kShown: 1, src: 'ex', lastEx: 0, lastQ: '' }; },

  // Estado interactivo: avanza siempre; render() solo lo lee.
  update(S) {
    const st = S.st, dt = Math.min(S.dt || 0.016, 0.1), jump = st.lastT < 0 || Math.abs(S.t - st.lastT) > 0.35;
    st.lastT = S.t;
    const l = lang(S);

    // ── tamaño del fragmento ──
    if (S.between('size-small', 'vector')) {
      S.drive('g', demoG(S));
      const g = gNow(S);
      if (!st.gx || jump) st.gx = { cur: g, prev: g, t0: -99 };
      else if (st.gx.cur !== g) st.gx = { cur: g, prev: st.gx.cur, t0: S.clock };
      if (S.on('try-chunk') && S.touched.has('g') && chunkDemo(l, g).ok) S.complete('chunk');
    }

    // ── otras preguntas: la escena elige; la persona puede elegir o escribir ──
    if (S.between('demo-ask', 'k-one')) {
      S.drive('ex', demoEx(S));
      const typed = String(S.p.q ?? '').trim();
      if (S.touched.has('ex') && S.p.ex !== st.lastEx) st.src = 'ex';
      if (S.touched.has('q') && typed !== st.lastQ) st.src = typed ? 'q' : 'ex';
      st.lastEx = S.p.ex; st.lastQ = typed;
      const q = boardQ(S);
      if (!st.qx || jump) st.qx = { cur: q, prev: q, t0: -99 };
      else if (st.qx.cur !== q) st.qx = { cur: q, prev: st.qx.cur, t0: S.clock };
      if (S.on('try-ask') && (S.touched.has('ex') || (S.touched.has('q') && typed))) S.complete('ask');
    }

    // ── k ──
    if (S.between('k-one', 'rerank')) {
      S.drive('k', demoK(S));
      const k = kNow(S);
      st.kShown = jump ? k : st.kShown + (k - st.kShown) * (1 - Math.exp(-dt * 7));
      if (S.on('try-k') && S.touched.has('k') && k >= 3) S.complete('k');
    }
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
void clamp;
