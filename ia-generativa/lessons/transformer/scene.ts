// Escena: El transformer completo. Un transformer diminuto REAL (weights.ts, entrenado por train_tiny.py; el pase hacia delante
// de model.ts coincide con PyTorch) recorrido pieza por pieza: embedding, posición, bloque (atención con máscara causal, red,
// atajos, normalización), pila, logits, softmax y bucle; tres turnos interactivos; y la cuenta de parámetros.
import type { Frame, SceneFactory } from '../../../../../theme/kit';
import { lay, STAGES } from './data';
import { stageBar, view } from './draw';
import { vEmbed, vHook, vPos, vPosAdd, vPosWhy, vToy, vTokens } from './act-input';
import type { Lang } from './model';

/** Etapa de la tubería para la barra de arriba, según el último segmento empezado (-1: sin barra). */
const STAGE_FROM: [string, number][] = [['toy', 0], ['tokens-in', 0], ['embed', 1], ['block', 2], ['logits', 3], ['decoder-only', 2], ['params-intro', 4], ['honest-today', -1]];
function stageIdx(S: Frame): number { let k = -1; for (const [id, i] of STAGE_FROM) if (S.on(id)) k = i; return k; }

const scene: SceneFactory = () => ({
  controls: [],

  init(S) { S.st = {}; },

  update(S) { void S; },

  render(S) {
    const L = lay(S), si = stageIdx(S);
    if (si >= 0) stageBar(S, L.bar, si, STAGES[S.lang as Lang], S.reveal('toy', 0.2, 0.4));
    view(S, 'hook', 'toy', () => vHook(S, L));
    view(S, 'toy', 'tokens-in', () => vToy(S, L));
    view(S, 'tokens-in', 'embed', () => vTokens(S, L));
    view(S, 'embed', 'pos-why', () => vEmbed(S, L));
    view(S, 'pos-why', 'pos', () => vPosWhy(S, L));
    view(S, 'pos', 'pos-add', () => vPos(S, L));
    view(S, 'pos-add', 'block', () => vPosAdd(S, L));
  },
});
export default scene;
