import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'que-es-aprender',
  objectives: { es: ['Distinguir programar de aprender.', 'Explicar qué es generalizar.'], en: ['Tell programming from learning.', 'Explain what generalizing means.'] },
  segments: [
    { id: 'intro', es: 'Programar es escribir reglas. Aprender es encontrarlas a partir de ejemplos.', en: 'Programming is writing rules. Learning is finding them from examples.', note: { es: 'Programar: reglas + datos → respuestas.', en: 'Programming: rules + data → answers.' } },
    { id: 'rules', es: 'Con reglas, tú decides cada caso. Con ejemplos, la máquina descubre el patrón.', en: 'With rules, you decide every case. With examples, the machine discovers the pattern.', gate: { id: 'try', prompt: { es: 'Mueve el control y observa.', en: 'Move the control and watch.' } }, pad: 1 },
    { id: 'end', es: 'Eso es todo por ahora.', en: 'That is all for now.' },
  ],
  keyIdeas: { es: ['Idea uno.', 'Idea dos.'], en: ['Idea one.', 'Idea two.'] },
  deeper: { es: 'Fórmula: $y = wx + b$.\n\n$$L = \\frac{1}{n}\\sum_i (y_i-\\hat y_i)^2$$', en: 'Formula: $y = wx + b$.\n\n$$L = \\frac{1}{n}\\sum_i (y_i-\\hat y_i)^2$$' },
  lens: { es: ['Pregunta qué datos hay.'], en: ['Ask what data exists.'] },
  quiz: [{ kind: 'concept', q: { es: '¿Qué es aprender?', en: 'What is learning?' }, options: [{ es: 'Escribir reglas', en: 'Writing rules' }, { es: 'Hallar reglas en ejemplos', en: 'Finding rules in examples' }], answer: 1, why: { es: 'Porque sí.', en: 'Because.' } }],
  glossary: [],
});
