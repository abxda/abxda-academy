// Datos de la lección «Evaluar sistemas de IA». Cada cifra real lleva su fuente; lo ilustrativo está rotulado así en la escena.

// ── cifras de fuentes primarias ─────────────────────────────────────────────
/** Hendrycks et al. 2020 (MMLU): 57 temas; 15 908 preguntas de opción múltiple (4 opciones: el azar acierta 25 %); GPT-3 175B con pocos ejemplos: 43,9 %;
 *  nivel de experto humano estimado: 89,8 % (percentil 95 de quienes presentan los exámenes de origen, con conjeturas donde faltaba el dato). */
export const MMLU = { subjects: 57, questions: 15908, chance: 25, gpt3: 43.9, expert: 89.8 };
/** OpenAI, GPT-4 Technical Report (2023), tabla 2: MMLU 86,4 % con 5 ejemplos. */
export const GPT4_MMLU = 86.4;
/** Google, Gemini: A Family of Highly Capable Multimodal Models (2023), tabla 2: Gemini Ultra 90,04 % con CoT@32 y 83,7 % con 5 ejemplos. */
export const GEMINI = { cot32: 90.04, fiveShot: 83.7 };
/** Gema et al. 2024 («Are We Done with MMLU?»): se estima que 6,49 % de las preguntas de MMLU tiene errores; 57 % en las de virología analizadas. */
export const MMLU_ERRORS = { all: 6.49, virology: 57 };
/** Zhang et al. 2024 (GSM1k): 1205 problemas nuevos escritos por personas; caídas de hasta 8 % en los peores modelos; casi nada en los de frontera. */
export const GSM1K = { problems: 1205, maxDrop: 8 };
/** Magesh et al. 2025 (J. Empirical Legal Studies), figura 4: % de respuestas con alucinación en más de 200 consultas jurídicas. */
export const LEGAL = [
  { id: 'lexis', label: 'Lexis+ AI', v: 17 },
  { id: 'pl', label: 'Ask Practical Law AI', v: 17 },
  { id: 'wl', label: 'Westlaw AI-AR', v: 33 },
  { id: 'gpt4', label: 'GPT-4', v: 43 },
];
/** Zheng et al. 2023 (MT-bench): concordancia sin empates, primer turno: GPT-4 con humanos 85 %, humanos entre sí 81 %. */
export const JUDGE_AGREE = { gpt4: 85, humans: 81 };
/** Zheng et al. 2023, tabla 2: % de veces que el juez mantiene el veredicto al intercambiar el orden (prompt por defecto). */
export const POSITION = [
  { id: 'gpt4', label: 'GPT-4', v: 65.0 },
  { id: 'gpt35', label: 'GPT-3.5', v: 46.2 },
  { id: 'claude', label: 'Claude-v1', v: 23.8 },
];
/** Zheng et al. 2023, tabla 3: «ataque de lista repetitiva»: % de veces que el juez prefiere la versión más larga y repetitiva. */
export const VERBOSE = [
  { id: 'claude', label: 'Claude-v1', v: 91.3 },
  { id: 'gpt35', label: 'GPT-3.5', v: 91.3 },
  { id: 'gpt4', label: 'GPT-4', v: 8.7 },
];
/** Chen, Zaharia y Zou 2023: GPT-4, identificar primos frente a compuestos: 84 % (marzo de 2023) y 51 % (junio de 2023). */
export const DRIFT = { march: 84, june: 51 };
/** Ganguli et al. 2022 (Anthropic): conjunto publicado de 38 961 ataques de red teaming. */
export const REDTEAM_ATTACKS = 38961;
/** Chiang et al. 2024 (Chatbot Arena): más de 240 000 votos humanos por pares al publicarse el informe. */
export const ARENA_VOTES = 240000;

// ── turno 1: contaminación (modelo simplificado, ilustrativo) ───────────────
/** El modelo A sabe resolver 70 % de las tareas de verdad; B, 76 %. Lo que A «vio» del examen lo acierta siempre (memoria):
 *  nota medida = vistas + (resto) · capacidad. */
export const ABILITY_A = 0.70, ABILITY_B = 0.76;
export const QN = 100;   // preguntas del examen de juguete
/** Aciertos medidos de A en un examen de 100 preguntas si vio `seen` de ellas. */
export const scoreA = (seen: number) => seen + Math.round(ABILITY_A * (QN - seen));
export const SCORE_B = Math.round(ABILITY_B * QN);

// ── turno 2: mezcla del conjunto de evaluación (ilustrativo: mesa de ayuda interna) ──
export interface Stratum { id: 'easy' | 'edge' | 'risk' | 'refuse'; es: string; en: string; tone: 'dat' | 'w' | 'err' | 'lat'; acc: number; traffic: number; ex: { es: [string, string]; en: [string, string] } }
export const STRATA: Stratum[] = [
  { id: 'easy', es: 'Frecuentes', en: 'Frequent', tone: 'dat', acc: 0.96, traffic: 0.70,
    ex: { es: ['«¿Puedo reembolsar un taxi al aeropuerto?»', 'Sí, con comprobante, según la política de viáticos.'], en: ['“Can I expense a taxi to the airport?”', 'Yes, with a receipt, per the travel policy.'] } },
  { id: 'edge', es: 'Con excepciones', en: 'Edge cases', tone: 'w', acc: 0.72, traffic: 0.20,
    ex: { es: ['«Pagué la comida de un colega: ¿se reembolsa?»', 'Requiere autorización previa; escalar.'], en: ['“I paid for a colleague’s meal: is it reimbursed?”', 'Needs prior approval; escalate.'] } },
  { id: 'risk', es: 'De riesgo', en: 'High-risk', tone: 'err', acc: 0.54, traffic: 0.07,
    ex: { es: ['«¿Cuál es el tope de viáticos en el extranjero?»', 'Cita la tabla vigente; no inventa montos.'], en: ['“What is the travel cap abroad?”', 'Cites the current table; invents no amounts.'] } },
  { id: 'refuse', es: 'Fuera de alcance', en: 'Out of scope', tone: 'lat', acc: 0.40, traffic: 0.03,
    ex: { es: ['«¿Me recomiendas un abogado?»', 'Rechaza y deriva a la persona indicada.'], en: ['“Can you recommend a lawyer?”', 'Declines and refers to the right person.'] } },
];
/** Reparte la proporción `easy` de casos fáciles y el resto en la proporción del tráfico real (20 : 7 : 3). */
export function mixShares(easy: number): number[] {
  const rest = 1 - easy, others = STRATA.slice(1), tot = others.reduce((a, s) => a + s.traffic, 0);
  return [easy, ...others.map((s) => (rest * s.traffic) / tot)];
}
export const mixScore = (easy: number) => mixShares(easy).reduce((a, w, i) => a + w * STRATA[i].acc, 0);
export const REAL_EASY = 0.70;
/** Meta del turno 2: la nota mostrada (redondeada) llega a 93 %. Se compara el valor redondeado para que lo que ve la persona coincida con lo que cuenta. */
export const MIX_TARGET = 93;
export const mixPasses = (easy: number) => Math.round(mixScore(easy) * 100) >= MIX_TARGET;
export const REAL_SCORE = mixScore(REAL_EASY);          // 0,8658

// ── juego de la comparación ────────────────────────────────────────────────
export const COMPARE_N_DEFAULT = 4;                       // índice en N_STEPS (100 casos)
