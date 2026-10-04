// Los cuatro casos del turno «¿prompt, RAG o ajuste fino?». ILUSTRATIVOS (así se rotulan en pantalla): cifras inventadas para el ejercicio.
// Criterio (el de la lección): primero medir con lo barato; la información que cambia o debe citarse va a RAG; el ajuste fino es para
// comportamiento estable, con datos buenos y una línea base medida que no alcanza.
export type L2 = { es: string; en: string };
export interface Case {
  title: L2;
  text: L2;
  /** 0 = prompt, 1 = RAG, 2 = ajuste fino */
  answer: 0 | 1 | 2;
  /** Por qué es la respuesta (se muestra al acertar). */
  why: L2;
  /** Pista al elegir mal, por opción (la de la respuesta correcta queda vacía). */
  hint: [L2, L2, L2];
}

export const OPTIONS: L2[] = [{ es: 'Prompt', en: 'Prompt' }, { es: 'RAG', en: 'RAG' }, { es: 'Ajuste fino', en: 'Fine-tuning' }];

const none: L2 = { es: '', en: '' };

export const CASES: Case[] = [
  {
    title: { es: 'Tono de marca', en: 'Brand tone' },
    text: { es: 'Reescribir correos internos con el tono de la marca. Tienes una guía de media página y aún no has probado nada.', en: 'Rewrite internal emails in the brand’s tone. You have a half-page style guide and have not tried anything yet.' },
    answer: 0,
    why: { es: 'Una instrucción con la guía y dos o tres ejemplos suele bastar, y es lo más barato. Mide primero; ajusta solo si no alcanza.', en: 'An instruction with the guide and two or three examples is often enough, and it is the cheapest. Measure first; tune only if it falls short.' },
    hint: [none, { es: 'La guía mide media página: cabe en el prompt, no hace falta ir a buscarla.', en: 'The guide is half a page: it fits in the prompt, no need to retrieve it.' }, { es: 'Sin una línea base medida, ajustar es apostar a ciegas, y cuesta mucho más.', en: 'Without a measured baseline, tuning is a blind bet, and it costs far more.' }],
  },
  {
    title: { es: 'Catálogo semanal', en: 'Weekly catalog' },
    text: { es: 'Responder preguntas sobre un catálogo de 8 000 productos cuyos precios cambian cada semana.', en: 'Answer questions about a catalog of 8,000 products whose prices change every week.' },
    answer: 1,
    why: { es: 'Son hechos que cambian: RAG los trae al prompt en cada consulta y permite citar la fuente. Ajustarlos los dejaría viejos.', en: 'These are facts that change: RAG brings them into the prompt on every query and lets you cite the source. Tuning them in would leave them stale.' },
    hint: [{ es: 'Ocho mil productos no caben en cada consulta, y pagarlos cada vez sería caro.', en: 'Eight thousand products do not fit in every query, and paying for them each time would be costly.' }, none, { es: 'Ajustar fija hechos en los pesos: con precios semanales quedarían viejos y sin cita.', en: 'Tuning bakes facts into the weights: with weekly prices they would go stale and carry no citation.' }],
  },
  {
    title: { es: 'Tickets a escala', en: 'Tickets at scale' },
    text: { es: 'Clasificar dos millones de tickets al mes en 12 etiquetas propias. Tienes 5 000 ejemplos revisados; prompt y RAG ya se midieron: 81 % y necesitas 95 %.', en: 'Classify two million tickets a month into 12 labels of your own. You have 5,000 reviewed examples; prompt and RAG were already measured: 81% and you need 95%.' },
    answer: 2,
    why: { es: 'Tarea estrecha, repetida a gran escala, con datos buenos y una línea base medida que no alcanza: ahí sí se justifica ajustar.', en: 'A narrow task, repeated at scale, with good data and a measured baseline that falls short: that is where tuning pays off.' },
    hint: [{ es: 'Ya se midió: 81 % frente a 95 %. Más prompt no cierra esa brecha, y se paga en cada ticket.', en: 'Already measured: 81% versus 95%. A longer prompt does not close that gap, and you pay for it on every ticket.' }, { es: 'Ya se midió con RAG: 81 %. No falta información, falta un comportamiento estable.', en: 'Already measured with RAG: 81%. Information is not missing; a stable behavior is.' }, none],
  },
  {
    title: { es: 'Facturas a JSON', en: 'Invoices to JSON' },
    text: { es: 'Extraer cinco campos de facturas y devolverlos como JSON. Tienes 20 facturas de prueba y todavía no has medido nada.', en: 'Extract five fields from invoices and return them as JSON. You have 20 test invoices and have not measured anything yet.' },
    answer: 0,
    why: { es: 'Un prompt con el esquema y ejemplos, medido en tus 20 facturas, es tu línea base. Si no alcanza, sabrás cuánto falta.', en: 'A prompt with the schema and examples, measured on your 20 invoices, is your baseline. If it falls short, you will know by how much.' },
    hint: [none, { es: 'No falta conocimiento externo: los campos están en la propia factura.', en: 'No outside knowledge is missing: the fields are in the invoice itself.' }, { es: 'Con 20 facturas y sin línea base, ajustar es prematuro: prueba antes un prompt con el esquema.', en: 'With 20 invoices and no baseline, tuning is premature: first try a prompt with the schema.' }],
  },
];
