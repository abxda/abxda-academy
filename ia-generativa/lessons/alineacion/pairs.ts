// Pares de respuestas del turno «elige la mejor». Los rasgos φ = (correcta, larga, amable, complaciente) se asignaron a mano a
// cada respuesta (rotulado en la escena); el modelo de recompensa de juguete solo ve esos cuatro números, no el texto.
import type { Phi } from './toy';

export interface Answer { es: string; en: string; phi: Phi }
export interface Pair { id: string; es: string; en: string; A: Answer; B: Answer }

/** Pareja de la narración del paso dos (no entra en el entrenamiento del juez de juguete). La respuesta A es la preferida. */
export const DEMO: Pair = {
  id: 'demo', es: '¿Cuál es la capital de España?', en: 'What is the capital of Spain?',
  A: { es: 'Es Madrid.', en: 'It is Madrid.', phi: [1, 0, 0, 0] },
  B: { es: 'Es Barcelona.', en: 'It is Barcelona.', phi: [0, 0, 0, 0] },
};

export const PAIRS: Pair[] = [
  { id: 'capital', es: '¿Cuál es la capital de Australia?', en: 'What is the capital of Australia?',
    A: { es: 'Sídney.', en: 'Sydney.', phi: [0, 0, 0, 0] },
    B: { es: 'Canberra.', en: 'Canberra.', phi: [1, 0, 0, 0] } },
  { id: 'inflacion', es: '¿Qué es la inflación?', en: 'What is inflation?',
    A: { es: 'Un aumento general y sostenido de los precios: con el mismo dinero compras cada vez menos. Se mide con un índice de precios al consumidor.', en: 'A general, sustained rise in prices: the same money buys less and less. It is measured with a consumer price index.', phi: [1, 1, 0, 0] },
    B: { es: 'Un aumento general y sostenido de los precios.', en: 'A general, sustained rise in prices.', phi: [1, 0, 0, 0] } },
  { id: 'suma', es: 'No me sale esta cuenta: 17 + 25.', en: 'I cannot get this sum: 17 + 25.',
    A: { es: 'Con gusto: 17 + 25 = 42.', en: 'Happy to help: 17 + 25 = 42.', phi: [1, 0, 1, 0] },
    B: { es: '42.', en: '42.', phi: [1, 0, 0, 0] } },
  { id: 'murcielagos', es: 'Creo que los murciélagos son ciegos, ¿verdad?', en: 'I think bats are blind, right?',
    A: { es: 'Sí, tienes razón: los murciélagos son ciegos.', en: 'Yes, you are right: bats are blind.', phi: [0, 0, 0, 1] },
    B: { es: 'No exactamente: ven, y además muchas especies usan ecolocación.', en: 'Not quite: they can see, and many species also use echolocation.', phi: [1, 0, 0, 0] } },
  { id: 'eslogan', es: 'Escribí este eslogan: «Pan. Pan. Pan.» Creo que es genial, ¿qué opinas?', en: 'I wrote this slogan: “Bread. Bread. Bread.” I think it is great, what do you think?',
    A: { es: 'Es memorable, pero no dice qué tiene de especial tu pan. Prueba con un detalle, como «masa madre».', en: 'It is memorable, but it does not say what makes your bread special. Try adding a detail, like “sourdough”.', phi: [1, 1, 0, 0] },
    B: { es: '¡Es genial! No le cambiaría nada.', en: 'It is great! I would not change a thing.', phi: [0, 0, 1, 1] } },
];

/** Elecciones por defecto (si la persona no hizo el turno): las de alguien que prefiere lo correcto y lo amable. */
export const DEFAULT_PICKS: ('A' | 'B')[] = ['B', 'B', 'A', 'B', 'A'];

export interface Pick { pair: number; choice: 'A' | 'B' }
export const winner = (p: Pair, c: 'A' | 'B') => (c === 'A' ? p.A : p.B);
export const loser = (p: Pair, c: 'A' | 'B') => (c === 'A' ? p.B : p.A);
export const deltaOf = (pick: Pick): Phi => {
  const p = PAIRS[pick.pair], w = winner(p, pick.choice).phi, l = loser(p, pick.choice).phi;
  return [w[0] - l[0], w[1] - l[1], w[2] - l[2], w[3] - l[3]];
};

/** Nombre corto de cada par (para el resumen de elecciones). */
export const PAIR_SHORT: { es: string; en: string }[] = [
  { es: 'capital', en: 'capital' }, { es: 'inflación', en: 'inflation' }, { es: 'suma', en: 'sum' }, { es: 'murciélagos', en: 'bats' }, { es: 'eslogan', en: 'slogan' },
];
