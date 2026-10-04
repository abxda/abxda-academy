// Escena: RAG. Un recuperador REAL (TF-IDF + similitud coseno, ir.ts) sobre el manual de una tienda ficticia (corpus.ts),
// fragmentación por oraciones, el ranking en vivo, el prompt con fuentes, un generador de juguete extractivo (rotulado),
// y mediciones reales hechas offline con un modelo de embeddings, un reordenador y un LLM local (dense.ts, llm.ts).
// Tres turnos: tamaño de fragmento, tu pregunta, y el valor de k.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawBoard } from './act-board';
import { drawChunk } from './act-chunk';
import { drawIndex, drawVectorize } from './act-vec';
import { drawPaste, drawPipe, drawProblem } from './act-intro';
import { chunkDemo, exampleQs, hardQ, lang, userQuery } from './model';
import { area, stageBar } from './ui';

type View = [from: string, to: string | undefined, fn: (S: Frame) => void, stage: number | null];

const VIEWS: View[] = [
  ['hook', 'paste', drawProblem, null],
  ['paste', 'idea', drawPaste, null],
  ['idea', 'chunk', (S) => drawPipe(S, 'idea'), null],
  ['chunk', 'vectorize', drawChunk, 0],
  ['vectorize', 'index', drawVectorize, 1],
  ['index', 'ask', drawIndex, 2],
  ['ask', 'prompt', drawBoard, 3],
  ['recap', 'bridge', (S) => drawPipe(S, 'recap'), null],
];

const viewAlpha = (S: Frame, from: string, to?: string) => S.at(from, 0, 0.45, 'out') * (1 - (to ? S.at(to, 0, 0.35, 'out') : 0));

const scene: SceneFactory = () => ({
  controls: [
    { id: 'g', kind: 'slider', label: { es: 'Oraciones por fragmento', en: 'Sentences per chunk' }, min: 1, max: 8, step: 1, value: 1, from: 'try-chunk', to: 'chunk-big', fmt: (v) => String(v) },
    { id: 'ex', kind: 'choice', label: { es: 'Pregunta de ejemplo', en: 'Example question' }, value: 0, from: 'try-ask', to: 'abstain', options: [0, 1, 2, 3, 4, 5].map((i) => ({ value: i, label: { es: exampleQs('es')[i].q, en: exampleQs('en')[i].q } })) },
    { id: 'q', kind: 'text', label: { es: 'O escribe tu pregunta', en: 'Or type your question' }, value: '', maxLength: 120, placeholder: { es: 'por ejemplo: ¿cuánto tarda el reembolso?', en: 'for example: how long does a refund take?' }, from: 'try-ask', to: 'abstain' },
    { id: 'k', kind: 'slider', label: { es: 'k: fragmentos que se pegan', en: 'k: chunks pasted' }, min: 1, max: 5, step: 1, value: 1, from: 'try-k', to: 'rerank', fmt: (v) => String(v) },
  ],

  init(S) { S.st = { sawBad: false, yes: false, no: false, lastQ: '' }; },

  update(S) {
    const l = lang(S);
    if (S.between('try-chunk', 'chunk-big')) {
      const c = chunkDemo(l, Number(S.p.g ?? 1));
      if (!c.ok) S.st.sawBad = true;
      if (c.ok && S.st.sawBad) S.complete('chunk');
    }
    if (S.between('try-ask', 'abstain')) {
      const q = userQuery(S);
      S.st.lastQ = q;
    }
    void hardQ;
  },

  render(S) {
    for (const [from, to, fn, stage] of VIEWS) {
      const a = viewAlpha(S, from, to);
      if (a <= 0.002) continue;
      S.d.withAlpha(a, () => {
        if (stage !== null) stageBar(S, area(S, false).x, area(S, false).y, area(S, false).w, stage);
        fn(S);
      });
    }
  },
});
export default scene;
void clamp;

void exampleQs;
