// Datos derivados de las mediciones reales de Pythia-1.4B (pythia-data.ts, generado por build-pythia.py). Aquí no se
// inventa nada: solo se eligen filas, se limpian saltos de línea para dibujar y se calculan índices.
import { clamp } from '../../../../../theme/kit';
import { PYTHIA, type PythiaRow } from './pythia-data';

export const ROWS: PythiaRow[] = PYTHIA.rows;
export const N = ROWS.length;
export const LAST = N - 1;
/** Índice (0..24) del punto de control con ese paso de entrenamiento. */
export const idxOf = (step: number) => { const i = ROWS.findIndex((r) => r.step === step); if (i < 0) throw new Error(`sin punto de control ${step}`); return i; };
export const rowAt = (k: number) => ROWS[clamp(Math.round(k), 0, LAST)];
export const FINAL = ROWS[LAST];

/** La frase del objetivo: las 19 primeras piezas del texto de prueba («…Marta is usually there by five.»). */
export const SENT: string[] = PYTHIA.passage_pieces.slice(0, 19);
export const TARGET = SENT.findIndex((t) => t === PYTHIA.guess.truth);          // « five»
export const GUESS0 = PYTHIA.guess.steps['0'];
export const GUESS1 = PYTHIA.guess.steps['143000'];
/** Error (−ln p) de la pieza correcta antes y después de entrenar. */
export const ERR0 = -Math.log(GUESS0.p_true);
export const ERR1 = -Math.log(GUESS1.p_true);
/** Pérdida de adivinar al azar entre todas las piezas del vocabulario. */
export const RANDOM_LOSS = Math.log(PYTHIA.vocab);

/** Texto generado, listo para dibujar en una línea: los saltos de línea se ven como «↵». */
export function flat(t: string): string {
  const s = t.replace(/\n+/g, (m) => ` ${'↵'.repeat(Math.min(3, m.length))} `).replace(/[ \t]+/g, ' ').trim();
  return s || '↵';
}
/** Texto generado en líneas reales (para documentos): sin líneas vacías repetidas. */
export const docLines = (t: string): string[] => t.replace(/^\n+/, '').split('\n').filter((ln, i, a) => ln.trim() !== '' || (i > 0 && a[i - 1].trim() !== ''));

/** Las tres indicaciones del recorrido del entrenamiento. */
export const LEARN_ROWS = [
  { id: 'walk', label: { es: 'Frase', en: 'Sentence' }, probe: null as string | null, answer: '' },
  { id: 'fact', label: { es: 'Hecho', en: 'Fact' }, probe: 'fact', answer: 'Paris' },
  { id: 'pattern', label: { es: 'Patrón', en: 'Pattern' }, probe: 'pattern', answer: 'casa' },
];
export const promptOf = (id: string) => PYTHIA.prompts[id];
export const genAt = (id: string, k: number) => rowAt(k).gen[id];
export const probAt = (probe: string, k: number) => rowAt(k).probs[probe];

/** Indicaciones del modelo base (solo en el último punto de control). */
export const BASE_IDS = ['chat_capital', 'chat_poem', 'doc_list', 'chat_es'] as const;
export type BaseId = typeof BASE_IDS[number];
export const BASE_PROMPT = (id: BaseId) => PYTHIA.base_prompts[id];
export const BASE_OUT = (id: BaseId) => FINAL.final?.[id] ?? '';

/** Memorización: el comienzo de la licencia MIT y el texto original que sigue. */
export const MIT = { prompt: PYTHIA.mem_prompts.mit, truth: PYTHIA.mem_truth.mit, row: FINAL.mem.mit };
