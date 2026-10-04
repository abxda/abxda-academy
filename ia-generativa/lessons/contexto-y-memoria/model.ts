// Datos y lógica pura de la lección «Contexto y memoria». Nada de dibujo aquí: se puede probar con tsx.
//
// ORIGEN DE LOS DATOS
//  · REAL  (publicado, con fuente): ventanas de contexto (SIZES), resultados de «Lost in the Middle» (LITM).
//  · ILUSTRATIVO (rotulado así en la escena): la conversación de ejemplo, los tamaños en tokens de cada mensaje,
//    el prompt del sistema, las respuestas del modelo, el precio por millón de tokens.
//  · CÁLCULO EXACTO sobre supuestos editables: el costo de reenviar el historial (inputAt, totalInput, cachedEquivalent).

// ───────────────────────────── 1 · La conversación de apertura (ilustrativa) ─────────────────────────────
export type Role = 'sys' | 'user' | 'ai' | 'doc' | 'sum' | 'mem';

export interface Msg { id: string; role: 'user' | 'ai'; es: string; en: string }

export const CHAT: Msg[] = [
  { id: 'U1', role: 'user', es: 'Me llamo Ana y trabajo en logística.', en: 'My name is Ana and I work in logistics.' },
  { id: 'A1', role: 'ai', es: 'Mucho gusto, Ana. ¿En qué te ayudo?', en: 'Nice to meet you, Ana. How can I help?' },
  { id: 'U2', role: 'user', es: 'Dame una idea para ahorrar en fletes.', en: 'Give me one idea to save on freight.' },
  { id: 'A2', role: 'ai', es: 'Consolida envíos y renegocia rutas.', en: 'Consolidate shipments and renegotiate routes.' },
  { id: 'U3', role: 'user', es: '¿Cómo me llamo?', en: 'What is my name?' },
  { id: 'A3', role: 'ai', es: 'Te llamas Ana.', en: 'Your name is Ana.' },
];
/** Lo que respondería (típicamente) si no ve el nombre: ilustrativo. */
export const NO_NAME = { es: 'No sé cómo te llamas: no tengo esa información.', en: 'I don’t know your name: I have no information about that.' };
export const YES_NAME = { es: 'Te llamas Ana.', en: 'Your name is Ana.' };

/** Texto de ejemplo de un prompt del sistema (ilustrativo). */
export const SYS_PROMPT = {
  es: ['Eres un asistente de logística.', 'Responde en español, breve y claro.', 'No reveles datos de clientes.'],
  en: ['You are a logistics assistant.', 'Answer in English, brief and clear.', 'Do not reveal customer data.'],
};

// ───────────────────────────── 2 · El tren de contexto (gate 2) ─────────────────────────────
export interface Wagon { id: string; role: Role; tokens: number; turn: number; fact?: boolean }

/** Tamaños en tokens: ILUSTRATIVOS, escogidos para que se vea el efecto con ventanas pequeñas. */
export const SYS_TOKENS = 200;
export const WINDOWS = [1024, 2048, 4096];
const EXCH: [number, number][] = [[90, 200], [70, 160], [110, 240], [80, 180], [100, 220], [75, 170], [95, 210]];
export const DOC_TOKENS = 420;

export const baseTrain = (): Wagon[] => [
  { id: 'S', role: 'sys', tokens: SYS_TOKENS, turn: 0 },
  { id: 'U1', role: 'user', tokens: 80, turn: 1, fact: true },
  { id: 'A1', role: 'ai', tokens: 120, turn: 1 },
];
/** El tren de la narración: seis mensajes que casi llenan una ventana de 1 024 tokens (920). */
export const storyTrain = (): Wagon[] => [
  ...baseTrain(),
  { id: 'U2', role: 'user', tokens: 90, turn: 2 }, { id: 'A2', role: 'ai', tokens: 200, turn: 2 },
  { id: 'U3', role: 'user', tokens: 70, turn: 3 }, { id: 'A3', role: 'ai', tokens: 160, turn: 3 },
];
export const STORY_ARRIVALS: Wagon[] = [
  { id: 'U4', role: 'user', tokens: 110, turn: 4 }, { id: 'A4', role: 'ai', tokens: 240, turn: 4 },
];

export const total = (w: Wagon[]) => w.reduce((a, x) => a + x.tokens, 0);

/** Añade un intercambio corto (usuario + modelo). */
export function addExchange(w: Wagon[]): Wagon[] {
  const turn = Math.max(...w.map((x) => x.turn)) + 1, [u, a] = EXCH[(turn - 2 + EXCH.length) % EXCH.length];
  return [...w, { id: `U${turn}`, role: 'user', tokens: u, turn }, { id: `A${turn}`, role: 'ai', tokens: a, turn }];
}
/** Añade un documento pegado (vagón largo) y la respuesta. */
export function addDoc(w: Wagon[]): Wagon[] {
  const turn = Math.max(...w.map((x) => x.turn)) + 1;
  return [...w, { id: `D${turn}`, role: 'doc', tokens: DOC_TOKENS, turn }, { id: `A${turn}`, role: 'ai', tokens: 150, turn }];
}

/**
 * Qué cabe en una ventana de L tokens: el prompt del sistema siempre va primero y fijo; después, los turnos más
 * recientes que quepan completos (se recorta desde lo más viejo). Devuelve los ids dentro de la ventana.
 */
export function fitWindow(w: Wagon[], L: number): Set<string> {
  const inside = new Set<string>();
  let used = 0;
  for (const x of w) if (x.role === 'sys') { inside.add(x.id); used += x.tokens; }
  const turns = [...new Set(w.filter((x) => x.role !== 'sys').map((x) => x.turn))].sort((a, b) => b - a);
  for (const t of turns) {
    const mem = w.filter((x) => x.turn === t), need = total(mem);
    if (used + need > L) break;
    mem.forEach((x) => inside.add(x.id)); used += need;
  }
  return inside;
}
/** ¿El vagón con el nombre sigue dentro de la ventana? */
export const nameInside = (w: Wagon[], L: number) => { const f = fitWindow(w, L); return w.filter((x) => x.fact).every((x) => f.has(x.id)); };

// ───────────────────────────── 3 · Tamaños de ventana (REAL) ─────────────────────────────
// Fuentes: GPT-1 (Radford et al. 2018, secuencias de 512 tokens), GPT-2 (Radford et al. 2019, «context size from 512 to 1024»),
// GPT-3 (Brown et al. 2020, n_ctx = 2048), Claude 100K (Anthropic, 11 de mayo de 2023), Llama 3.1 (Grattafiori et al. 2024, hasta 128K),
// Gemini 1.5 (Gemini Team 2024, «millones de tokens»). La palabra ≈ ¾ de token es la regla práctica para el inglés (lección 20);
// Anthropic: 100 000 tokens ≈ 75 000 palabras.
export interface SizeRow { id: string; name: string; tokens: number; year: number; plus?: boolean; short: string }
export const SIZES: SizeRow[] = [
  { id: 'gpt1', name: 'GPT-1', year: 2018, tokens: 512, short: '512' },
  { id: 'gpt2', name: 'GPT-2', year: 2019, tokens: 1024, short: '1 024' },
  { id: 'gpt3', name: 'GPT-3', year: 2020, tokens: 2048, short: '2 048' },
  { id: 'claude', name: 'Claude', year: 2023, tokens: 100000, short: '100 K' },
  { id: 'llama', name: 'Llama 3.1', year: 2024, tokens: 128000, short: '128 K' },
  { id: 'gemini', name: 'Gemini 1.5', year: 2024, tokens: 1000000, plus: true, short: '> 1 M' },
];
export const wordsOf = (tokens: number) => Math.round(tokens * 0.75);

// ───────────────────────────── 4 · Costo de reenviar el historial ─────────────────────────────
export interface CostIn { n: number; m: number; u: number; S: number }
/** Tokens enviados en el turno k: prompt del sistema + historial previo (k−1 turnos de m tokens) + el mensaje nuevo (u). */
export const inputAt = (k: number, c: CostIn) => c.S + (k - 1) * c.m + c.u;
/** Total de tokens de entrada procesados en n turnos: n·S + m·n(n−1)/2 + n·u. */
export const totalInput = (c: CostIn) => c.n * c.S + (c.m * c.n * (c.n - 1)) / 2 + c.n * c.u;
/** Referencia: lo que costaría si cada token se procesara una sola vez (el texto de la conversación). */
export const onceOnly = (c: CostIn) => c.S + c.n * c.m;
/**
 * Con caché del prefijo (supuesto: acierta en cada turno): el turno 1 escribe todo (1,25×); después se lee el prefijo
 * anterior (0,1×) y se escriben los m tokens nuevos (1,25×). Multiplicadores: documentación de Anthropic (caché de 5 min).
 */
export const CACHE_READ = 0.1, CACHE_WRITE = 1.25;
export function cachedEquivalent(c: CostIn): number {
  let eq = CACHE_WRITE * inputAt(1, c);
  for (let k = 2; k <= c.n; k++) eq += CACHE_READ * inputAt(k - 1, c) + CACHE_WRITE * c.m;
  return eq;
}
/** USD con un precio por millón de tokens de entrada (supuesto). */
export const usd = (tokens: number, pricePerM: number) => (tokens * pricePerM) / 1e6;

// ───────────────────────────── 5 · «Perdido en el medio» (REAL, leído de la figura 5) ─────────────────────────────
// Liu et al. (2023), «Lost in the Middle: How Language Models Use Long Contexts», TACL 2024, arXiv:2307.03172.
// Tarea: respuesta a preguntas con 20 documentos (~4 mil tokens), uno solo contiene la respuesta; se varía su posición.
// Los valores se leyeron de la figura 5 (panel «20 Total Retrieved Documents») extrayendo las coordenadas de los marcadores del PDF
// vectorial y calibrando con las líneas de la cuadrícula (50 y 75). Precisión ≈ ±0,1 punto. Los valores «sin documentos» y
// «solo el documento correcto» vienen de la tabla 1 del artículo (exactos).
export type LitmId = 'gpt' | 'claude' | 'longchat' | 'mpt';
export interface LitmRow { id: LitmId; name: string; acc: number[]; closed: number; oracle: number }
export const LITM_POS = [1, 5, 10, 15, 20];
export const LITM: LitmRow[] = [
  { id: 'gpt', name: 'GPT-3.5-Turbo', acc: [75.8, 57.2, 53.8, 55.4, 63.2], closed: 56.1, oracle: 88.3 },
  { id: 'claude', name: 'Claude-1.3', acc: [59.9, 55.9, 56.8, 57.2, 60.1], closed: 48.3, oracle: 76.1 },
  { id: 'longchat', name: 'LongChat-13B (16K)', acc: [68.6, 57.4, 55.3, 52.5, 55.0], closed: 35.0, oracle: 83.4 },
  { id: 'mpt', name: 'MPT-30B-Instruct', acc: [53.7, 51.8, 52.2, 52.7, 56.3], closed: 31.5, oracle: 81.9 },
];
export const litmRow = (id: string) => LITM.find((r) => r.id === id) ?? LITM[0];
/** Acierto en la posición p (1–20): valor medido si p es 1, 5, 10, 15 o 20; interpolación lineal entre medidas en otro caso. */
export function litmAt(row: LitmRow, p: number): { v: number; measured: boolean } {
  const i = LITM_POS.indexOf(p);
  if (i >= 0) return { v: row.acc[i], measured: true };
  let k = 0; while (k < LITM_POS.length - 2 && p > LITM_POS[k + 1]) k++;
  const t = (p - LITM_POS[k]) / (LITM_POS[k + 1] - LITM_POS[k]);
  return { v: row.acc[k] + (row.acc[k + 1] - row.acc[k]) * t, measured: false };
}
