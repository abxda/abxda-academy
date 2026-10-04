// Prompts de la lección (se usan en la escena y en build-llm.py): la instrucción de sistema, el formato de las fuentes
// numeradas y las preguntas de las demostraciones. Mantenerlos en un solo sitio garantiza que lo que se muestra en el
// lienzo es EXACTAMENTE lo que se le envió al modelo en la medición offline.
import type { Lang } from './corpus';
import type { Chunk } from './ir';

export const SYSTEM_ROLE: Record<Lang, string> = {
  es: 'Eres el asistente de atención al cliente de una tienda de bicicletas eléctricas.',
  en: 'You are the customer support assistant of an electric bicycle store.',
};
export const SYSTEM_RAG: Record<Lang, string> = {
  es: 'Eres el asistente de atención al cliente de una tienda de bicicletas eléctricas. Responde solo con la información de las fuentes. Cita la fuente con su número entre corchetes, como [1]. Si las fuentes no contienen la respuesta, di que no la tienes.',
  en: 'You are the customer support assistant of an electric bicycle store. Answer only with the information in the sources. Cite the source with its number in square brackets, like [1]. If the sources do not contain the answer, say you do not have it.',
};
const LABEL: Record<Lang, { src: string; q: string }> = { es: { src: 'Fuentes', q: 'Pregunta' }, en: { src: 'Sources', q: 'Question' } };

/** Texto que se pega en el mensaje de la persona usuaria: fuentes numeradas + pregunta. */
export function userMessage(l: Lang, chunks: Chunk[], q: string): string {
  const src = chunks.map((c, i) => `[${i + 1}] (${c.title}) ${c.text}`).join('\n');
  return `${LABEL[l].src}:\n${src}\n\n${LABEL[l].q}: ${q}`;
}

/** Preguntas de las demostraciones con modelo real. */
export const DEMO_Q: Record<Lang, { battery: string; refund: string; nope: string }> = {
  es: { battery: '¿Cuánto dura la garantía de la batería?', refund: '¿Cuánto tarda el reembolso si cancelo mi compra?', nope: '¿Tienen sucursal en Lima?' },
  en: { battery: 'How long is the battery warranty?', refund: 'How long does the refund take if I cancel my purchase?', nope: 'Do you have a branch in Lima?' },
};
