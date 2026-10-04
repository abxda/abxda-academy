// Escena: Ajuste fino y LoRA. Un modelo diminuto REAL (2→32→32→3) que se ajusta en el navegador: ajuste completo, olvido, y LoRA sobre su capa central.
import type { Frame, SceneFactory } from '../../../../../theme/kit';
import { drawConcept, drawCopies, drawToy } from './act-intro';
import { drawAreas, drawFreeze, drawGpt3, drawOuter, drawPaper, drawRankSum, drawSvd, drawTwoPath } from './act-lora';
import { getRun, STEPS, type Spec } from './runs';

// corridas que las partes narradas necesitan: se calientan de a poco, en segundo plano, mientras suena la introducción
const WARM: Spec[] = [
  { mode: 'full', replay: false, rule: 'A' },
  { mode: 2, replay: false, rule: 'A' }, { mode: 1, replay: false, rule: 'A' }, { mode: 8, replay: false, rule: 'A' },
  { mode: 2, replay: true, rule: 'A' }, { mode: 2, replay: true, rule: 'B' },
];

const scene: SceneFactory = () => ({
  controls: [
    { id: 'r', kind: 'slider', label: { es: 'Rango r', en: 'Rank r' }, min: 1, max: 32, step: 1, value: 2, from: 'try-rank', to: 'gpt3-scale', fmt: (v) => String(v) },
  ],

  init(S) { S.st = { warm: 0 }; },

  update(S) {
    // calentamiento: unos pocos pasos por fotograma (nunca bloquea el dibujo)
    const st = S.st;
    st.warm ??= 0;
    if (S.between('try-rank', 'gpt3-scale') && (S.p.r ?? 2) >= 16) S.complete('rank');
    if (st.warm < WARM.length) { const r = getRun(WARM[st.warm]); r.ensure(STEPS, 5); if (r.done) st.warm++; }
  },

  render(S) {
    const vis = (a: string, b?: string) => S.at(a, 0, 0.7) * (b ? 1 - S.at(b, 0, 0.5) : 1);
    drawConcept(S, vis('hook', 'toy-intro'));
    drawToy(S, S.at('toy-intro', 0, 0.7));
    drawCopies(S, 1 - S.at('insight', 0, 0.5));
    drawSvd(S, S.at('insight', 0, 0.7) * (1 - S.at('freeze', 0, 0.5)));
    drawFreeze(S, S.at('freeze', 0, 0.7) * (1 - S.at('outer', 0, 0.5)));
    drawOuter(S, S.at('outer', 0, 0.7) * (1 - S.at('count', 0, 0.5)));
    drawRankSum(S, 1);
    drawAreas(S, 1);
    drawGpt3(S, 1);
    drawTwoPath(S, 1);
    drawPaper(S, 1);
  },
});

export default scene;
void ({} as Frame);
