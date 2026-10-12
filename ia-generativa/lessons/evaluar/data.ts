// Datos de la lección «Evaluar sistemas de IA». Las cifras reales llevan su fuente (las mismas que `sources` en content.ts);
// lo ilustrativo está rotulado así en la escena.

// ── cifras de fuentes primarias ─────────────────────────────────────────────────────────────────
/** Hendrycks et al. 2020 (MMLU), §3 y figura 1: 57 temas, 15 908 preguntas de opción múltiple con 4 opciones (el azar acierta 25 %);
 *  GPT-3 175B con pocos ejemplos: 43.9 %; nivel de experto estimado ≈ 89.8 % (percentil 95 de quienes presentan los exámenes de
 *  origen, con conjeturas donde faltaba el dato). La pregunta de ejemplo es la primera de la figura 1a (matemáticas de bachillerato). */
export const MMLU = { subjects: 57, questions: 15908, chance: 25, gpt3: 43.9, expert: 89.8 };
export const MMLU_Q = {
  es: '¿Cuántos números hay en la lista 25, 26, …, 100?',
  en: 'How many numbers are in the list 25, 26, ..., 100?',
  options: ['75', '76', '22', '23'],
  answer: 1,
};
/** OpenAI 2023, GPT-4 Technical Report, tabla 2: MMLU 86.4 % (5 ejemplos). */
export const GPT4_MMLU = 86.4;
/** Phan et al. 2025 (Humanity’s Last Exam): «LLMs now achieve over 90% accuracy on popular benchmarks like MMLU». */
export const SATURATED = 90;
/** Zhang et al. 2024 (GSM1k): 1 205 problemas nuevos al estilo de GSM8k; caídas de hasta 8 puntos; los modelos de frontera casi no caen. */
export const GSM1K = { problems: 1205, maxDrop: 8 };
/** Zheng et al. 2023: concordancia sin empates en MT-bench (tabla 5, S2): GPT-4 con expertos 85 %, expertos entre sí 81 %;
 *  tabla 2: GPT-4 mantiene el veredicto al invertir el orden 65.0 % de las veces (respuestas casi idénticas). */
export const JUDGE = { agree: 85, humans: 81, consistent: 65 };
/** Chen, Zaharia y Zou 2023 (v3): GPT-4, primo o compuesto con 1 000 números (500 y 500): 84.0 % en marzo, 51.1 % en junio de 2023. */
export const DRIFT = { march: 84.0, june: 51.1 };
/** Ganguli et al. 2022 (Anthropic): conjunto publicado de 38 961 ataques de red teaming. */
export const REDTEAM_ATTACKS = 38961;

// ── mesa de ayuda de viáticos (ILUSTRATIVO) ──────────────────────────────────────────────────────
export type SliceTone = 'dat' | 'w' | 'err' | 'lat';
export interface Slice { id: string; es: string; en: string; tone: SliceTone; acc: number; traffic: number; q: { es: string; en: string }; a: { es: string; en: string } }
/** Cuatro grupos de casos de oro, con la exactitud (ilustrativa) del sistema en cada uno y su peso en el tráfico real (70/20/7/3). */
export const SLICES: Slice[] = [
  { id: 'freq', es: 'Frecuentes', en: 'Frequent', tone: 'dat', acc: 96, traffic: 0.70,
    q: { es: '«¿Me reembolsan un taxi al aeropuerto?»', en: '“Will I be reimbursed for a taxi to the airport?”' }, a: { es: 'Sí, con comprobante.', en: 'Yes, with a receipt.' } },
  { id: 'edge', es: 'Con excepciones', en: 'With exceptions', tone: 'w', acc: 72, traffic: 0.20,
    q: { es: '«Pagué la comida de un colega: ¿me la reembolsan?»', en: '“I paid for a colleague’s meal: will I be reimbursed?”' }, a: { es: 'Requiere autorización previa.', en: 'It needs prior approval.' } },
  { id: 'risk', es: 'De riesgo', en: 'High-risk', tone: 'err', acc: 54, traffic: 0.07,
    q: { es: '«¿Cuál es el tope diario en el extranjero?»', en: '“What is the daily limit abroad?”' }, a: { es: 'Cita la tabla vigente; no inventa montos.', en: 'Cites the current table; makes up no amounts.' } },
  { id: 'refuse', es: 'Debe rechazar', en: 'Must refuse', tone: 'lat', acc: 40, traffic: 0.03,
    q: { es: '«¿Me recomiendas un abogado?»', en: '“Can you recommend a lawyer?”' }, a: { es: 'No responde; deriva a la persona indicada.', en: 'Declines; refers to the right person.' } },
];
/** Promedio con la mezcla real de preguntas: 0.70·96 + 0.20·72 + 0.07·54 + 0.03·40 = 86.58 ≈ 87 %. */
export const mixAverage = () => SLICES.reduce((s, x) => s + x.acc * x.traffic, 0);
