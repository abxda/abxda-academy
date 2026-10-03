// Escena: Atención. La frase y el pronombre, consultas/claves/valores con números pequeños (calculados en vivo),
// la raíz de d, el mapa de atención, varias cabezas (reales, de BERT), límites y puente hacia el transformer.
import type { SceneFactory } from '../../../../../theme/kit';
import { drawSentence } from './act-sentence';

const scene: SceneFactory = () => ({
  controls: [],
  init(S) { S.st = {}; },
  update() {},
  render(S) {
    S.d.text(S.portrait ? 'portrait' : 'land', 4, 4, { size: 12 });
    drawSentence(S);
  },
});

export default scene;
