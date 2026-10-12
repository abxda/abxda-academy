// Casos del asistente de decisión «¿prompt, RAG o ajuste fino?». ILUSTRATIVOS (así se rotulan en pantalla).
// Tres preguntas en orden: 1) ¿ya probaste (y mediste) un buen prompt?  2) ¿falta información que cambia?
// 3) ¿es una tarea estable, repetida muchísimo, con miles de ejemplos buenos?  Cada caso guarda sus respuestas y a qué herramienta llega.
export type L2 = { es: string; en: string };
export type Tool = 'prompt' | 'rag' | 'ft' | 'wait';
export interface Case { id: string; title: L2; text: L2; answers: boolean[]; tool: Tool; why: L2 }

export const CASES: Case[] = [
  {
    id: 'tone',
    title: { es: 'Tono de marca', en: 'Brand tone' },
    text: { es: 'Reescribir correos con el tono de la marca. Aún no se ha probado nada.', en: 'Rewrite emails in the brand’s tone. Nothing has been tried yet.' },
    answers: [false], tool: 'prompt',
    why: { es: 'Una instrucción con la guía de estilo y dos ejemplos suele bastar. Mídelo antes de ir más lejos.', en: 'An instruction with the style guide and two examples is often enough. Measure it before going further.' },
  },
  {
    id: 'catalog',
    title: { es: 'Catálogo semanal', en: 'Weekly catalog' },
    text: { es: 'Responder sobre un catálogo cuyos precios cambian cada semana.', en: 'Answer questions about a catalog whose prices change every week.' },
    answers: [true, true], tool: 'rag',
    why: { es: 'Los precios cambian: RAG los trae al prompt en cada pregunta, siempre al día.', en: 'Prices change: RAG brings them into the prompt for every question, always up to date.' },
  },
  {
    id: 'tickets',
    title: { es: 'Tickets a escala', en: 'Tickets at scale' },
    text: { es: 'Clasificar dos millones de tickets al mes. El prompt ya se midió y no alcanza; hay miles de ejemplos revisados.', en: 'Sort two million tickets a month. The prompt was measured and falls short; there are thousands of reviewed examples.' },
    answers: [true, false, true], tool: 'ft',
    why: { es: 'Tarea estable, repetida muchísimo y con datos buenos: aquí sí conviene ajustar.', en: 'A stable task, repeated a huge number of times, with good data: here tuning pays off.' },
  },
  {
    id: 'manual',
    title: { es: 'Manual de políticas', en: 'Policy manual' },
    text: { es: 'Responder sobre el manual de la empresa, que cambia cada trimestre, citando el párrafo.', en: 'Answer questions about the company manual, which changes every quarter, citing the paragraph.' },
    answers: [true, true], tool: 'rag',
    why: { es: 'Cambia cada trimestre y hay que citarlo: RAG, no ajuste fino.', en: 'It changes every quarter and must be cited: RAG, not fine-tuning.' },
  },
];

export const caseById = (id: unknown): Case => CASES.find((c) => c.id === id) ?? CASES[0];
