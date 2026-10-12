// Datos y lógica pura de la lección «Contexto y memoria». Nada de dibujo aquí: se puede probar con tsx.
//
// ORIGEN DE LOS DATOS
//  · REAL (publicado, con fuente en content.ts): tamaños de ventana (SIZES) y resultados de «Lost in the Middle» (LITM).
//  · ILUSTRATIVO (rotulado así en la escena): la conversación de Ana, el tamaño en tokens de cada mensaje, la ventana de
//    juguete de 400 tokens, las instrucciones del sistema y las respuestas del modelo.
//  · CÁLCULO EXACTO sobre un supuesto rotulado: tokens procesados al reenviar la conversación (100 tokens por turno).
import type { L10n } from '../../../../../core/types';

// ───────────────────────────── 1 · La conversación (ilustrativa) ─────────────────────────────
export type Role = 'sys' | 'user' | 'ai' | 'sum' | 'note';
export interface Msg { id: string; role: 'user' | 'ai'; text: L10n }

export const CHAT: Msg[] = [
  { id: 'U1', role: 'user', text: { es: 'Me llamo Ana y trabajo en logística.', en: 'My name is Ana and I work in logistics.' } },
  { id: 'A1', role: 'ai', text: { es: 'Mucho gusto, Ana. ¿En qué te ayudo?', en: 'Nice to meet you, Ana. How can I help?' } },
  { id: 'U2', role: 'user', text: { es: 'Dame una idea para ahorrar en envíos.', en: 'Give me an idea to save on shipping.' } },
  { id: 'A2', role: 'ai', text: { es: 'Junta pedidos pequeños en un solo camión.', en: 'Combine small orders into one truck.' } },
  { id: 'U3', role: 'user', text: { es: '¿Cómo me llamo?', en: 'What is my name?' } },
  { id: 'A3', role: 'ai', text: { es: 'Te llamas Ana.', en: 'Your name is Ana.' } },
];
export const chatMsg = (id: string) => CHAT.find((m) => m.id === id)!;
/** Respuesta típica cuando el nombre no está en lo que recibe (ilustrativa). */
export const NO_NAME: L10n = { es: 'No lo sé: no me has dicho tu nombre.', en: 'I don’t know: you haven’t told me your name.' };
export const YES_NAME: L10n = { es: 'Te llamas Ana.', en: 'Your name is Ana.' };

/** Instrucciones del sistema de ejemplo (ilustrativas). */
export const SYS_LINES: L10n<string[]> = {
  es: ['Eres un asistente de logística.', 'Responde breve y con amabilidad.', 'No compartas datos de clientes.'],
  en: ['You are a logistics assistant.', 'Answer briefly and kindly.', 'Never share customer data.'],
};

// ───────────────────────────── 2 · El tren de contexto ─────────────────────────────
/** Ventana de juguete (tokens). La narración la llama así. */
export const WINDOW = 400;
export interface Wagon { id: string; role: Role; tokens: number; turn: number; name?: boolean }

/** Tamaños ILUSTRATIVOS en tokens. Suman lo que dice la narración: 230 sin instrucciones, 290 con ellas, 320 con la
 *  respuesta, 400 al llenar; con el mensaje siguiente se suelta el primer turno (90 tokens) y quedan 340 + 30. */
const W: Record<string, Wagon> = {
  S: { id: 'S', role: 'sys', tokens: 60, turn: 0 },
  U1: { id: 'U1', role: 'user', tokens: 30, turn: 1, name: true },
  A1: { id: 'A1', role: 'ai', tokens: 60, turn: 1 },
  U2: { id: 'U2', role: 'user', tokens: 30, turn: 2 },
  A2: { id: 'A2', role: 'ai', tokens: 80, turn: 2 },
  U3: { id: 'U3', role: 'user', tokens: 30, turn: 3 },
  A3: { id: 'A3', role: 'ai', tokens: 30, turn: 3 },
  U4: { id: 'U4', role: 'user', tokens: 30, turn: 4 },
  A4: { id: 'A4', role: 'ai', tokens: 50, turn: 4 },
  U5: { id: 'U5', role: 'user', tokens: 30, turn: 5 },
  A5: { id: 'A5', role: 'ai', tokens: 30, turn: 5 },
};
/** Pasos de la historia del tren: qué vagones existen en cada paso (0: el tren de la pregunta; 1: + instrucciones;
 *  2: + respuesta; 3: un turno más, lleno; 4: llega «¿cómo me llamo?» y se suelta lo más viejo; 5: «no lo sé»). */
const STEPS: string[][] = [
  ['U1', 'A1', 'U2', 'A2', 'U3'],
  ['S', 'U1', 'A1', 'U2', 'A2', 'U3'],
  ['S', 'U1', 'A1', 'U2', 'A2', 'U3', 'A3'],
  ['S', 'U1', 'A1', 'U2', 'A2', 'U3', 'A3', 'U4', 'A4'],
  ['S', 'U1', 'A1', 'U2', 'A2', 'U3', 'A3', 'U4', 'A4', 'U5'],
  ['S', 'U1', 'A1', 'U2', 'A2', 'U3', 'A3', 'U4', 'A4', 'U5', 'A5'],
];
export const STEP_MAX = STEPS.length - 1;
/** Turnos extra que añade la persona con «Enviar otro mensaje» (tamaños ilustrativos, en ciclo). */
const EXTRA: [number, number][] = [[30, 60], [20, 70], [40, 50], [30, 80], [20, 40]];

/** Vagones del paso `step` más `extras` turnos añadidos por la persona. */
export function trainAt(step: number, extras: number): Wagon[] {
  const s = Math.max(0, Math.min(STEP_MAX, step));
  const w = STEPS[s].map((id) => ({ ...W[id] }));
  let turn = Math.max(...w.map((x) => x.turn));
  for (let i = 0; i < extras; i++) {
    turn++;
    const [u, a] = EXTRA[i % EXTRA.length];
    w.push({ id: `U${turn}`, role: 'user', tokens: u, turn }, { id: `A${turn}`, role: 'ai', tokens: a, turn });
  }
  return w;
}
export const total = (w: Wagon[]) => w.reduce((a, x) => a + x.tokens, 0);

/**
 * Qué cabe en una ventana de L tokens. Las instrucciones del sistema van siempre al frente; después, de lo más nuevo a
 * lo más viejo, entran los turnos completos que quepan («lo primero que entró es lo primero que sale»).
 * Devuelve el conjunto de ids dentro de la ventana.
 */
export function fitWindow(w: Wagon[], L = WINDOW): Set<string> {
  const inside = new Set<string>();
  let used = 0;
  for (const x of w) if (x.role === 'sys' || x.role === 'note' || x.role === 'sum') { inside.add(x.id); used += x.tokens; }
  const turns = [...new Set(w.filter((x) => x.role === 'user' || x.role === 'ai').map((x) => x.turn))].sort((a, b) => b - a);
  for (const t of turns) {
    const mem = w.filter((x) => x.turn === t && (x.role === 'user' || x.role === 'ai')), need = total(mem);
    if (used + need > L) break;
    mem.forEach((x) => inside.add(x.id)); used += need;
  }
  return inside;
}
/** ¿Sigue dentro el vagón con el nombre? */
export const nameInside = (w: Wagon[], L = WINDOW) => { const f = fitWindow(w, L); return w.some((x) => x.name && f.has(x.id)); };

// ───────────────────────────── 3 · Tamaños de ventana (REAL) ─────────────────────────────
// GPT-3: Brown et al. 2020, «All models use a context window of nctx = 2048 tokens». Claude: Anthropic, 11 de mayo de 2023,
// de 9K a 100K tokens, «around 75,000 words»; El gran Gatsby (72K tokens) cupo entero. Llama 3.1: Llama Team 2024, «context
// window of up to 128K tokens». Gemini 1.5: Gemini Team 2024, recuperación casi perfecta «up to at least 10M tokens» en sus
// pruebas: la escena dice «más de un millón». Palabras ≈ ¾ de los tokens en inglés (lección 20).
export interface SizeRow { id: string; name: string; year: number; tokens: number; plus?: boolean }
export const SIZES: SizeRow[] = [
  { id: 'gpt3', name: 'GPT-3', year: 2020, tokens: 2048 },
  { id: 'claude', name: 'Claude', year: 2023, tokens: 100000 },
  { id: 'llama', name: 'Llama 3.1', year: 2024, tokens: 128000 },
  { id: 'gemini', name: 'Gemini 1.5', year: 2024, tokens: 1000000, plus: true },
];
export const wordsOf = (tokens: number) => Math.round(tokens * 0.75);

// ───────────────────────────── 4 · Costo de reenviar la conversación ─────────────────────────────
/** Supuesto de la narración: cada turno agrega 100 tokens (tu mensaje y la respuesta). */
export const PER_TURN = 100;
/** Tokens que procesa el modelo en el turno k: todo lo anterior otra vez, más lo nuevo. */
export const turnTokens = (k: number, m = PER_TURN) => k * m;
/** Texto de la conversación tras n turnos (cada token una sola vez). */
export const textTokens = (n: number, m = PER_TURN) => n * m;
/** Tokens procesados en n turnos: m·n(n+1)/2. Con m = 100: 10 → 5 500; 20 → 21 000. */
export const processed = (n: number, m = PER_TURN) => (m * n * (n + 1)) / 2;

// ───────────────────────────── 5 · «Perdido en el medio» (REAL) ─────────────────────────────
// Liu et al. (2023), «Lost in the Middle: How Language Models Use Long Contexts», arXiv:2307.03172 (TACL).
// Preguntas con 20 documentos (unos 4 000 tokens); uno solo contiene la respuesta y se cambia de lugar.
// Valores EXACTOS de la tabla 6 (apéndice G.2; «Index 0, 4, 9, 14, 19» = lugares 1, 5, 10, 15 y 20).
// «Sin documentos» (closed-book) y «solo el documento correcto» (oracle): tabla 1. La escena muestra GPT-3.5-Turbo.
export interface LitmRow { id: string; name: string; acc: number[]; closed: number; oracle: number }
export const LITM_POS = [1, 5, 10, 15, 20];
export const LITM: LitmRow[] = [
  { id: 'gpt', name: 'GPT-3.5-Turbo', acc: [75.8, 57.2, 53.8, 55.4, 63.2], closed: 56.1, oracle: 88.3 },
  { id: 'claude', name: 'Claude-1.3', acc: [59.9, 55.9, 56.8, 57.2, 60.1], closed: 48.3, oracle: 76.1 },
  { id: 'longchat', name: 'LongChat-13B (16K)', acc: [68.6, 57.4, 55.3, 52.5, 55.0], closed: 35.0, oracle: 83.4 },
  { id: 'mpt', name: 'MPT-30B-Instruct', acc: [53.7, 51.8, 52.2, 52.7, 56.3], closed: 31.5, oracle: 81.9 },
];
export const GPT35 = LITM[0];
/** Acierto medido (%) en un lugar de LITM_POS. */
export const litmAcc = (pos: number, row = GPT35) => row.acc[Math.max(0, LITM_POS.indexOf(pos))];
