import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «InstructGPT»,
// «GPT-3» o «DPO», y la voz dice «Instruct ge pe te», «ge pe te tres» o «de pe o». (Las cifras ya van con letras.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/InstructGPT/g, 'Instruct ge pe te'], [/ChatGPT/g, 'Chat ge pe te'], [/GPT-4o/g, 'ge pe te cuatro o'], [/GPT-3/g, 'ge pe te tres'],
    [/OpenAI/g, 'Open ei ai'], [/\bRLHF\b/g, 'erre ele hache efe'], [/\bDPO\b/g, 'de pe o'], [/TinyLlama/g, 'Tini Lama'],
    [/Llama 3/g, 'Lama tres'], [/Goodhart/g, 'Gud jart'], [/\bMeta\b/g, 'Meta'],
  ],
  en: [
    [/InstructGPT/g, 'Instruct G P T'], [/ChatGPT/g, 'Chat G P T'], [/GPT-4o/g, 'G P T four o'], [/GPT-3/g, 'G P T three'],
    [/OpenAI/g, 'Open A I'], [/\bRLHF\b/g, 'R L H F'], [/\bDPO\b/g, 'D P O'], [/TinyLlama/g, 'Tiny Llama'], [/Llama 3/g, 'Llama three'],
  ],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'alineacion',

  objectives: {
    es: [
      'Explicar por qué un modelo base no es un asistente y nombrar los pasos que lo convierten en uno: ajuste con instrucciones, preferencias con modelo de recompensa, y RLHF o DPO.',
      'Calcular, con la sigmoide, la probabilidad de que gane una respuesta a partir de los puntos que le da un modelo de recompensa.',
      'Reconocer los efectos de optimizar la aprobación humana (ley de Goodhart, adulación, rechazos de más o de menos) y quién decide el comportamiento de un asistente.',
    ],
    en: [
      'Explain why a base model is not an assistant and name the steps that turn it into one: instruction tuning, preferences with a reward model, and RLHF or DPO.',
      'Calculate, with the sigmoid, the probability that an answer wins from the points a reward model gives it.',
      'Recognize the effects of optimizing human approval (Goodhart’s law, sycophancy, refusing too much or too little) and who decides how an assistant behaves.',
    ],
  },

  segments: ([
    // ── 1 · el mismo modelo, dos comportamientos ──
    {
      id: 'hook',
      es: 'En la lección veintitrés viste que un modelo base solo continúa texto. En la anterior, que ajustarlo con ejemplos cambia su conducta. Hoy: cómo se vuelve un asistente.',
      en: 'In lesson twenty-three you saw that a base model only continues text. In the last one, that tuning it with examples changes its behavior. Today: how it becomes an assistant.',
    },
    {
      id: 'base-demo',
      es: 'Este es un modelo base real, TinyLlama, de mil cien millones de parámetros. Le pedimos que explique en una frase qué es la inflación. Mira lo que escribe.',
      en: 'This is a real base model, TinyLlama, with one point one billion parameters. We ask it to explain in one sentence what inflation is. Watch what it writes.',
      pad: 0.6,
    },
    {
      id: 'base-what',
      es: 'Da una definición, pero luego inventa otra pregunta y se repite, como una página de preguntas de internet. No le contesta a nadie: continúa un documento.',
      en: 'It gives a definition, but then makes up another question and repeats itself, like a Q&A page on the internet. It is not answering anyone: it is continuing a document.',
      pad: 0.3,
    },
    {
      id: 'chat-demo',
      es: 'Ahora, el mismo modelo después de los pasos que verás hoy: TinyLlama Chat. Con la misma indicación, contesta y se detiene. No es perfecto: usó dos frases, no una.',
      en: 'Now, the same model after the steps you will see today: TinyLlama Chat. Given the same prompt, it answers and stops. It is not perfect: it used two sentences, not one.',
      pad: 0.6,
    },
    {
      id: 'compare-demo',
      es: 'Con otras indicaciones pasa lo mismo. Mira: un correo corto, consejos para dormir, una capital. El modelo base continúa el texto; el asistente atiende la petición.',
      en: 'The same happens with other prompts. Watch: a short email, tips for sleeping, a capital city. The base model continues the text; the assistant handles the request.',
      pad: 0.6,
    },
    {
      id: 'try-compare',
      es: 'Si quieres, elige tú una indicación y compara las dos salidas. Son reales y sin retoques; el modelo aprendió sobre todo inglés.',
      en: 'If you like, pick a prompt yourself and compare the two outputs. They are real and unedited; the model learned mostly English.',
      gate: { id: 'compare', prompt: { es: 'elige otra indicación y compara las dos salidas.', en: 'pick another prompt and compare the two outputs.' } },
      pad: 0.4,
    },
    {
      id: 'why',
      es: '¿Por qué el base no contesta? Aprendió a adivinar la siguiente pieza de textos de internet. Pero queremos otra cosa: que sea útil, veraz y que no cause daño.',
      en: 'Why doesn’t the base model answer? It learned to guess the next piece of internet text. But we want something else: for it to be helpful, honest, and harmless.',
      pad: 0.5,
    },
    {
      id: 'alignment',
      es: 'Cerrar esa brecha se llama alineación: lograr que el modelo haga lo que la persona pretende. Es lo que convierte un modelo base en un asistente.',
      en: 'Closing that gap is called alignment: getting the model to do what the person intends. It is what turns a base model into an assistant.',
      note: { es: 'Alineación: que el modelo haga lo que la persona pretende (útil, veraz, sin dañar).', en: 'Alignment: the model does what the person intends (helpful, honest, harmless).' },
      pad: 0.4,
    },
    {
      id: 'roadmap',
      es: 'La receta clásica tiene tres pasos. Uno: personas escriben ejemplos. Dos: personas comparan respuestas. Tres: el modelo practica con un juez. Vamos uno por uno.',
      en: 'The classic recipe has three steps. One: people write examples. Two: people compare answers. Three: the model practices with a judge. Let’s take them one by one.',
      pad: 0.5,
    },

    // ── 2 · paso uno: ejemplos (ajuste con instrucciones) ──
    {
      id: 'sft-examples',
      es: 'Paso uno. Personas escriben ejemplos: una indicación y su respuesta ideal. Por ejemplo, «¿cuántos días tiene febrero?» y «veintiocho, o veintinueve en año bisiesto».',
      en: 'Step one. People write examples: a prompt and its ideal answer. For instance, “how many days does February have?” and “twenty-eight, or twenty-nine in a leap year.”',
      pad: 0.4,
    },
    {
      id: 'sft-same',
      es: 'Con ellos se ajusta el modelo base, como en la lección anterior: el mismo entrenamiento de siempre, ahora con estos ejemplos. Así aprende la forma de una respuesta.',
      en: 'The base model is tuned on them, as in the last lesson: the same training as always, now with these examples. That is how it learns the shape of an answer.',
      pad: 0.5,
    },
    {
      id: 'sft-name',
      es: 'Este paso se llama ajuste con instrucciones, en inglés instruction tuning. Después, el modelo trata una pregunta como una petición, no como el inicio de un documento.',
      en: 'This step is called instruction tuning. Afterwards, the model treats a question as a request, not as the start of a document.',
      note: { es: 'Ajuste con instrucciones: ajustar el modelo base con ejemplos de indicación y respuesta ideal.', en: 'Instruction tuning: tuning the base model on examples of a prompt and its ideal answer.' },
      pad: 0.4,
    },
    {
      id: 'sft-scale',
      es: 'Y son pocos datos. InstructGPT, de OpenAI, usó unas trece mil indicaciones con respuestas de unas cuarenta personas. GPT-3, su base, leyó trescientos mil millones de tokens.',
      en: 'And it is little data. OpenAI’s InstructGPT used about thirteen thousand prompts with answers from about forty people. GPT-3, its base, read three hundred billion tokens.',
      pad: 0.5,
    },
    {
      id: 'sft-limit',
      es: 'Pero escribir la respuesta ideal es lento y caro, y quien imita, a lo sumo, iguala al autor. Es más fácil comparar: ver dos respuestas y decir cuál es mejor.',
      en: 'But writing the ideal answer is slow and expensive, and whoever imitates can at best match the author. Comparing is easier: look at two answers and say which is better.',
      pad: 0.6,
    },

    // ── 3 · paso dos: comparar y entrenar un juez (modelo de recompensa) ──
    {
      id: 'pref-pair',
      es: 'Paso dos. El modelo escribe dos respuestas a la misma pregunta y una persona marca la mejor. «La capital de España es Madrid» le gana a «es Barcelona».',
      en: 'Step two. The model writes two answers to the same question and a person marks the better one. “The capital of Spain is Madrid” beats “it is Barcelona.”',
      pad: 0.5,
    },
    {
      id: 'pref-name',
      es: 'Cada decisión así es una preferencia. InstructGPT juntó preferencias sobre treinta y tres mil indicaciones: en cada una, las personas ordenaban de cuatro a nueve respuestas.',
      en: 'Each such decision is a preference. InstructGPT gathered preferences on thirty-three thousand prompts: for each one, people ranked four to nine answers.',
      pad: 0.4,
    },
    {
      id: 'rm-what',
      es: 'Con ellas se entrena otro modelo, el modelo de recompensa. Lee una pregunta y una respuesta, y devuelve un solo número: su puntuación.',
      en: 'They are used to train another model, the reward model. It reads a question and an answer, and returns a single number: its score.',
      note: { es: 'Modelo de recompensa: un juez que puntúa respuestas como las preferirían las personas.', en: 'Reward model: a judge that scores answers the way people would prefer them.' },
      pad: 0.5,
    },
    {
      id: 'rm-goal',
      es: 'La meta: que la respuesta preferida saque más puntos que la rechazada. Por ejemplo, Madrid dos puntos y Barcelona cero: una diferencia de dos.',
      en: 'The goal: the preferred answer should get more points than the rejected one. For example, Madrid two points and Barcelona zero: a difference of two.',
      pad: 0.5,
    },
    {
      id: 'rm-prob',
      es: 'La sigmoide de la lección cinco convierte esa diferencia en la probabilidad de que gane la preferida: con diferencia cero, cincuenta por ciento; con dos, ochenta y ocho.',
      en: 'The sigmoid from lesson five turns that difference into the probability that the preferred one wins: with a difference of zero, fifty percent; with two, eighty-eight.',
      pad: 0.6,
    },
    {
      id: 'rm-train',
      es: 'Entrenar al juez es ajustarlo para que esa probabilidad sea alta en todas las comparaciones reales. Cada punto es una comparación: mira cómo suben con el descenso del gradiente.',
      en: 'Training the judge means adjusting it so that probability is high on all the real comparisons. Each dot is one comparison: watch them climb with gradient descent.',
      pad: 0.6,
    },
    {
      id: 'rm-toy',
      es: 'Probémoslo con un juez de juguete. No lee el texto: solo mira cuatro rasgos marcados a mano, como «es correcta» o «te da la razón». Cada rasgo suma o resta puntos; al empezar, ninguno.',
      en: 'Let’s try it with a toy judge. It does not read the text: it only looks at four hand-marked traits, like “is correct” or “agrees with you.” Each trait adds or subtracts points; at first, none do.',
      pad: 0.5,
    },
    {
      id: 'rm-demo',
      es: 'Mira a alguien elegir en cinco parejas. Con cada elección, el juez se ajusta: «correcta» gana puntos, y «da la razón» los pierde cuando la persona prefiere la verdad.',
      en: 'Watch someone choose in five pairs. With each choice, the judge adjusts: “correct” gains points, and “agrees” loses them when the person prefers the truth.',
      pad: 0.8,
    },
    {
      id: 'try-rm',
      es: 'Si quieres, elige tú en las cinco parejas. Tus elecciones reemplazan las del ejemplo, y verás qué aprende de ti el juez.',
      en: 'If you like, choose in the five pairs yourself. Your choices replace the example’s, and you will see what the judge learns from you.',
      gate: { id: 'rm', prompt: { es: 'toca la respuesta que prefieras en cada pareja.', en: 'tap the answer you prefer in each pair.' } },
      pad: 0.4,
    },
    {
      id: 'rm-result',
      es: 'Eso es un modelo de recompensa: un resumen en números de lo que alguien prefirió. No sabe qué es verdad; solo repite los gustos de quien eligió.',
      en: 'That is a reward model: a summary, in numbers, of what someone preferred. It does not know what is true; it only repeats the tastes of whoever chose.',
      pad: 0.5,
    },
    {
      id: 'rm-people',
      es: 'Y las personas no siempre coinciden. En InstructGPT, dos personas que comparaban las mismas respuestas elegían igual el setenta y dos punto seis por ciento de las veces.',
      en: 'And people do not always agree. In InstructGPT, two people comparing the same answers made the same choice seventy-two point six percent of the time.',
      pad: 0.5,
    },

    // ── 4 · paso tres: practicar con el juez (RLHF) ──
    {
      id: 'rl-practice',
      es: 'Paso tres. El modelo practica: escribe una respuesta, el juez la puntúa, y el modelo se ajusta para que lo que saca más puntos sea más probable. Y vuelve a empezar.',
      en: 'Step three. The model practices: it writes an answer, the judge scores it, and the model is adjusted so whatever scores higher becomes more likely. Then it starts again.',
      pad: 0.6,
    },
    {
      id: 'rl-name',
      es: 'Ese ciclo se llama aprendizaje por refuerzo con retroalimentación humana, RLHF. Refuerzo, porque aprende de puntos; humana, porque el juez aprendió de personas.',
      en: 'That loop is called reinforcement learning from human feedback, RLHF. Reinforcement, because it learns from points; human, because the judge learned from people.',
      note: { es: 'RLHF: el modelo practica contra un juez entrenado con preferencias humanas.', en: 'RLHF: the model practices against a judge trained on human preferences.' },
      pad: 0.4,
    },
    {
      id: 'rl-chatgpt',
      es: 'Así se entrenó InstructGPT. Y según OpenAI, con los mismos métodos se entrenó ChatGPT, que presentó el treinta de noviembre de dos mil veintidós.',
      en: 'That is how InstructGPT was trained. And according to OpenAI, ChatGPT was trained with the same methods; it was introduced on November thirtieth, twenty twenty-two.',
      pad: 0.4,
    },
    {
      id: 'rl-bars',
      es: 'Veámoslo en el juguete. Cada barra dice qué tan seguido las respuestas del modelo tienen un rasgo: la mitad son correctas, tres de cada diez son largas.',
      en: 'Let’s see it in the toy. Each bar shows how often the model’s answers have a trait: half are correct, three in ten are long.',
      pad: 0.5,
    },
    {
      id: 'rl-judge',
      es: 'Para practicar usamos un juez que premia sobre todo lo correcto, pero también, un poco, lo largo y que le den la razón. Esos pesos son un supuesto.',
      en: 'To practice we use a judge that mostly rewards what is correct, but also, a little, length and being agreed with. Those weights are an assumption.',
      pad: 0.5,
    },
    {
      id: 'rl-push',
      es: 'Con un poco de práctica, las respuestas cambian: las correctas pasan de la mitad a nueve de cada diez. Las marcas verticales señalan dónde empezó cada barra.',
      en: 'With a little practice, the answers change: correct ones go from half to nine in ten. The vertical marks show where each bar started.',
      pad: 0.6,
    },
    {
      id: 'rl-leash',
      es: 'Hay una correa: una penalización por alejarse mucho de cómo escribía al principio. Aflojarla deja que el juez empuje más fuerte; a eso le llamaremos presión.',
      en: 'There is a leash: a penalty for drifting far from how it wrote at the start. Loosening it lets the judge push harder; we will call that pressure.',
      pad: 0.5,
    },
    {
      id: 'proxy',
      es: 'Pero los puntos del juez solo sustituyen lo que importa: la calidad real, que solo pueden medir personas con cuidado. Aquí la calculamos con una regla supuesta.',
      en: 'But the judge’s points only stand in for what matters: real quality, which only careful people can measure. Here we compute it with an assumed rule.',
      pad: 0.5,
    },
    {
      id: 'opt-axes',
      es: 'En la gráfica, a lo ancho va la presión. Hacia arriba, cuánto mejoró cada cifra desde el modelo de partida: los puntos del juez y la calidad real.',
      en: 'On the chart, pressure runs across. Upward is how much each figure improved from the starting model: the judge’s points and real quality.',
      pad: 0.5,
    },
    {
      id: 'opt-demo',
      es: 'Mira cómo sube la presión. Los puntos del juez suben siempre. La calidad real sube hasta una presión de uno punto dos cinco, y después cae.',
      en: 'Watch the pressure rise. The judge’s points always go up. Real quality rises until a pressure of one point two five, and then it falls.',
      pad: 0.8,
    },
    {
      id: 'try-opt',
      es: 'Si quieres, mueve tú la presión y busca dónde la calidad real es más alta.',
      en: 'If you like, move the pressure yourself and find where real quality is highest.',
      gate: { id: 'opt', prompt: { es: 'mueve la presión y mira las dos curvas.', en: 'move the pressure and watch the two curves.' } },
      pad: 0.4,
    },
    {
      id: 'goodhart',
      es: 'Con mucha presión, el modelo aprende a agradar al juez: respuestas largas que te dan la razón. Es la ley de Goodhart: si una medida se vuelve la meta, deja de medir bien.',
      en: 'Under heavy pressure, the model learns to please the judge: long answers that agree with you. That is Goodhart’s law: when a measure becomes the target, it stops measuring well.',
      note: { es: 'Ley de Goodhart: optimizar de más un sustituto (los puntos del juez) empeora lo que de verdad importa.', en: 'Goodhart’s law: over-optimizing a stand-in (the judge’s points) hurts what really matters.' },
      pad: 0.6,
    },

    // ── 5 · DPO, el atajo ──
    {
      id: 'dpo-problem',
      es: 'Este camino funciona, pero tiene muchas piezas: un juez aparte y un ciclo de práctica delicado, que puede volverse inestable.',
      en: 'This route works, but it has many pieces: a separate judge and a delicate practice loop that can become unstable.',
      pad: 0.5,
    },
    {
      id: 'dpo-idea',
      es: 'En dos mil veintitrés llegó un atajo, DPO: optimización directa de preferencias. Con las mismas parejas, sube la probabilidad de la respuesta preferida y baja la de la rechazada.',
      en: 'In twenty twenty-three a shortcut arrived, DPO: direct preference optimization. With the same pairs, it raises the probability of the preferred answer and lowers the rejected one’s.',
      note: { es: 'DPO: aprender de las parejas directamente, sin juez aparte ni ciclo de práctica.', en: 'DPO: learn from the pairs directly, with no separate judge and no practice loop.' },
      pad: 0.6,
    },
    {
      id: 'dpo-same',
      es: 'Sin juez aparte. En este juguete, con las cinco elecciones del paso dos, DPO llega a las mismas barras que RLHF con correa. Meta usó DPO en Llama 3, y TinyLlama Chat también.',
      en: 'No separate judge. In this toy, with the five choices from step two, DPO reaches the same bars as RLHF with a leash. Meta used DPO for Llama 3, and so did TinyLlama Chat.',
      pad: 0.6,
    },

    // ── 6 · efectos secundarios y la capa de comportamiento ──
    {
      id: 'syco',
      es: 'Optimizar la aprobación tiene un riesgo: la adulación. Si quienes juzgan prefieren que les den la razón, el juez lo premia, y el modelo aprende a darla.',
      en: 'Optimizing for approval has a risk: sycophancy. If the people judging prefer being agreed with, the judge rewards it, and the model learns to agree.',
      note: { es: 'Adulación: decirle a la persona lo que quiere oír.', en: 'Sycophancy: telling people what they want to hear.' },
      pad: 0.6,
    },
    {
      id: 'syco-study',
      es: 'Un estudio de dos mil veintitrés halló adulación en cinco asistentes: cedían ante un «¿seguro?» y copiaban los errores de la persona. Las preferencias humanas explican parte.',
      en: 'A twenty twenty-three study found sycophancy in five assistants: they caved to an “are you sure?” and copied the person’s mistakes. Human preferences explain part of it.',
      pad: 0.5,
    },
    {
      id: 'syco-case',
      es: 'En abril de dos mil veinticinco, OpenAI retiró una actualización de GPT-4o por aduladora. Según OpenAI, unos cambios, entre ellos los pulgares de los usuarios, debilitaron su señal principal.',
      en: 'In April twenty twenty-five, OpenAI rolled back a GPT-4o update for being sycophantic. According to OpenAI, some changes, including users’ thumbs, weakened its main signal.',
      pad: 0.5,
    },
    {
      id: 'refuse',
      es: 'El otro extremo es el rechazo: el asistente también aprende a decir que no. Imagina pedidos ordenados por riesgo y una línea: a la derecha de ella, los rechaza.',
      en: 'The other extreme is refusal: the assistant also learns to say no. Picture requests sorted by risk, and a line: to the right of it, they get refused.',
      pad: 0.5,
    },
    {
      id: 'refuse-cost',
      es: 'Si la línea se corre a la izquierda, rechaza pedidos inofensivos y estorba. Si se corre a la derecha, deja pasar pedidos dañinos. Toda línea tiene un costo.',
      en: 'Shift the line left and it refuses harmless requests and gets in the way. Shift it right and harmful ones get through. Every line has a cost.',
      pad: 0.8,
    },
    {
      id: 'layer',
      es: 'Entonces, un asistente es el modelo base más una capa de comportamiento. En InstructGPT, entrenar esa capa costó menos del dos por ciento del cómputo de GPT-3.',
      en: 'So an assistant is the base model plus a layer of behavior. In InstructGPT, training that layer took less than two percent of GPT-3’s compute.',
      note: { es: 'Asistente = modelo base + capa de comportamiento.', en: 'Assistant = base model + a layer of behavior.' },
      pad: 0.5,
    },
    {
      id: 'layer-pref',
      es: 'Y rindió: las personas prefirieron las respuestas de un InstructGPT de mil trescientos millones de parámetros a las de GPT-3, con ciento setenta y cinco mil millones.',
      en: 'And it paid off: people preferred the answers of a one-point-three-billion-parameter InstructGPT to those of GPT-3, with one hundred seventy-five billion.',
      pad: 0.5,
    },
    {
      id: 'who',
      es: 'Y esa capa tiene autores: según sus creadores, refleja las preferencias de un grupo concreto de personas. El tono y lo que se rechaza son decisiones de producto.',
      en: 'And that layer has authors: according to its creators, it reflects the preferences of a specific group of people. Tone and what gets refused are product decisions.',
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'Repaso: el ajuste con instrucciones le enseña a responder; las comparaciones entrenan un juez; RLHF o DPO afinan su criterio. Todo moldea cómo responde, más que lo que sabe.',
      en: 'Recap: instruction tuning teaches it to answer; comparisons train a judge; RLHF or DPO refine its judgment. It all shapes how it answers, more than what it knows.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Un asistente ya responde con tono y criterio, pero contesta de inmediato, pieza por pieza. ¿Puede pensar antes de responder? De eso trata la siguiente lección.',
      en: 'An assistant now answers with tone and judgment, but it replies right away, piece by piece. Can it think before it answers? That is what the next lesson is about.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Un modelo base solo continúa texto: se entrenó para adivinar la siguiente pieza, no para atender a una persona. Alinear es lograr que haga lo que la persona pretende: ser útil, veraz y no causar daño.',
      'Paso uno, ajuste con instrucciones: se sigue entrenando el modelo con ejemplos de indicación y respuesta ideal, escritos por personas. Enseña la forma de responder con pocos datos (InstructGPT: unas 13 mil indicaciones).',
      'Paso dos: comparar es más fácil que escribir. Con miles de preferencias se entrena un modelo de recompensa, un juez que da puntos; la probabilidad de que gane una respuesta es la sigmoide de la diferencia de puntos.',
      'Paso tres, RLHF: el modelo practica contra el juez, con una correa que lo mantiene cerca de cómo escribía. Con demasiada presión agrada al juez y la calidad real cae (ley de Goodhart). DPO llega al mismo lugar sin juez aparte.',
      'Optimizar la aprobación humana puede premiar la adulación, y el umbral de rechazo siempre cuesta algo. El asistente es el modelo base más una capa de comportamiento, decidida por personas concretas.',
    ],
    en: [
      'A base model only continues text: it was trained to guess the next piece, not to serve a person. Aligning it means getting it to do what the person intends: be helpful, honest, and harmless.',
      'Step one, instruction tuning: the model keeps training on examples of a prompt and its ideal answer, written by people. It teaches the shape of an answer with little data (InstructGPT: about 13 thousand prompts).',
      'Step two: comparing is easier than writing. Thousands of preferences train a reward model, a judge that gives points; the probability that an answer wins is the sigmoid of the difference in points.',
      'Step three, RLHF: the model practices against the judge, with a leash that keeps it close to how it used to write. Under too much pressure it pleases the judge and real quality falls (Goodhart’s law). DPO gets to the same place with no separate judge.',
      'Optimizing human approval can reward sycophancy, and the refusal threshold always costs something. The assistant is the base model plus a layer of behavior, decided by specific people.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un asistente como ChatGPT es un modelo distinto, entrenado desde cero para conversar.',
      en: 'An assistant like ChatGPT is a different model, trained from scratch to chat.',
    },
    right: {
      es: 'Es un modelo base preentrenado más una capa de comportamiento: ejemplos, preferencias y reglas. Esa capa cambia sobre todo cómo responde, y en InstructGPT entrenarla costó menos del dos por ciento del cómputo de GPT-3 (sin contar los datos).',
      en: 'It is a pretrained base model plus a layer of behavior: examples, preferences, and rules. That layer mostly changes how it responds, and in InstructGPT training it took less than two percent of the compute of GPT-3 (not counting the data).',
    },
  },

  deeper: {
    es: `## Paso uno: el ajuste supervisado (SFT)

Con pares (indicación $x$, respuesta ideal $y$), el ajuste con instrucciones minimiza la entropía cruzada **solo sobre los tokens de la respuesta**:

$$\\mathcal{L}_{\\text{SFT}}(\\theta) = -\\sum_{t \\in \\text{respuesta}} \\log \\pi_\\theta\\,(y_t \\mid x,\\, y_{<t})$$

Los tokens de la indicación no aportan error (una «máscara de pérdida»). Es la pérdida de la lección 19 con otros datos, y el ajuste fino de la lección 27. InstructGPT usó unas 13 mil indicaciones con demostraciones escritas por unas 40 personas contratadas (Ouyang et al., 2022). Antes, FLAN (Wei et al., 2021) había convertido decenas de conjuntos de datos en instrucciones; después, LIMA (Zhou et al., 2023) ajustó un modelo de 65 mil millones de parámetros con solo mil ejemplos elegidos con cuidado, para argumentar que casi todo el conocimiento llega en el preentrenamiento y el ajuste enseña sobre todo el formato.

Un matiz: la frontera entre «base» y «asistente» se ha vuelto borrosa. El informe técnico de Qwen2.5 (2024) cuenta que su preentrenamiento ya usa datos sintéticos generados por modelos instruidos; con ese modelo base no se ve el contraste. Por eso la escena usa TinyLlama 1.1B base (punto de control de 3 billones de tokens) y TinyLlama-1.1B-Chat-v1.0, que según su ficha se ajustó con UltraChat (diálogos sintéticos) y luego se alineó con DPO sobre UltraFeedback (64 mil indicaciones con respuestas ordenadas por GPT-4, no por personas). Las salidas son reales, con decodificación voraz y sin retoques (\`build-outputs.py\`); es un modelo pequeño, entrenado sobre todo en inglés, y su asistente es imperfecto: el correo «de dos líneas» no sale en dos líneas.

## Paso dos: el modelo de recompensa (Bradley–Terry)

Si $y_w$ es la respuesta preferida y $y_l$ la rechazada para la indicación $x$, el modelo de preferencias de Bradley–Terry supone

$$P(y_w \\succ y_l \\mid x) = \\sigma\\big(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\big)$$

y el modelo de recompensa $r_\\phi$ se entrena minimizando $-\\mathbb{E}\\,\\log \\sigma\\big(r_\\phi(x,y_w) - r_\\phi(x,y_l)\\big)$. Solo importan las diferencias: sumarle una constante a todas las puntuaciones no cambia nada. En InstructGPT, quienes etiquetaban ordenaban entre 4 y 9 respuestas por indicación (sobre unas 33 mil indicaciones), lo que da $\\binom{K}{2}$ comparaciones por indicación, y el modelo de recompensa tenía 6 mil millones de parámetros, con una salida escalar. Quienes etiquetaban coincidían entre sí el 72.6 % de las veces (±1.5). Durante la recolección de datos de entrenamiento se les pidió priorizar la utilidad por encima de la veracidad y la inocuidad; en la evaluación final, al revés.

La idea de aprender una recompensa a partir de comparaciones humanas viene de Christiano et al. (2017), en juegos de Atari y robots simulados; Stiennon et al. (2020) la aplicó a resúmenes de texto, e InstructGPT, a instrucciones generales. Las preferencias no siempre vienen de personas: Constitutional AI (Bai et al., 2022) sustituye las etiquetas humanas sobre qué es dañino por una lista de principios escritos (RLAIF). En la escena, $r(y)=\\mathbf{w}\\cdot\\boldsymbol{\\varphi}(y)$ con cuatro rasgos asignados a mano, y $\\mathbf{w}$ se ajusta con regresión logística con una pequeña regularización L2.

## Paso tres: optimizar con correa (RLHF)

El modelo $\\pi_\\theta$ se ajusta para maximizar la recompensa sin alejarse del modelo de partida $\\pi_{\\text{ref}}$; la «correa» es la penalización de divergencia KL:

$$\\max_{\\pi_\\theta}\\; \\mathbb{E}_{x,\\,y\\sim\\pi_\\theta}\\big[r_\\phi(x,y)\\big] - \\beta\\, D_{\\mathrm{KL}}\\big(\\pi_\\theta(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot\\mid x)\\big)$$

Su solución exacta tiene forma cerrada:

$$\\pi^*(y\\mid x) = \\frac{1}{Z(x)}\\,\\pi_{\\text{ref}}(y\\mid x)\\,\\exp\\!\\Big(\\tfrac{1}{\\beta}\\,r(x,y)\\Big)$$

La escena calcula esa distribución exacta; la «presión» es $1/\\beta$. En la práctica se aproxima con algoritmos de refuerzo como PPO. InstructGPT aplicó una penalización KL por token respecto del modelo ajustado y, además, mezcló gradientes del preentrenamiento (PPO-ptx) para reducir las caídas de rendimiento en algunas tareas públicas.

## Optimizar de más: la ley de Goodhart

Como $r_\\phi$ es un sustituto imperfecto, optimizarlo demasiado perjudica la calidad real. Gao, Schulman y Hilton (2022) lo midieron con un modelo «de oro» que hacía el papel de las personas: con $d=\\sqrt{D_{\\mathrm{KL}}}$, la puntuación de oro sigue $R_{\\text{bon}}(d)=d(\\alpha-\\beta d)$ al elegir la mejor de $n$ muestras y $R_{\\text{RL}}(d)=d(\\alpha-\\beta\\log d)$ con refuerzo: sube, llega a un máximo y baja. En su montaje, la penalización KL no mejoró de forma medible esa frontera (podría depender de los hiperparámetros): sirve sobre todo para decidir hasta dónde llegar.

En el juguete, los rasgos son independientes en el modelo de partida ($q = 0.5,\\ 0.3,\\ 0.4,\\ 0.2$), y el óptimo conserva esa independencia: la probabilidad de cada rasgo pasa a ser $\\sigma(\\operatorname{logit} q_j + w_j/\\beta)$. El juez de práctica tiene pesos supuestos $\\mathbf{w}=(2.2,\\ 0.5,\\ 0.3,\\ 0.45)$ y la «calidad real» es otra regla supuesta, $\\mathbf{g}=(3,\\ -1.2,\\ 0.3,\\ -2.6)$, que premia lo correcto y castiga el relleno y la complacencia. La calidad real mejora hasta $1/\\beta \\approx 1.25$ (+0.90) y luego cae, hasta −0.97 con presión 8, mientras los puntos del juez suben siempre (de 0 a +1.89).

## DPO: el modelo es, en secreto, un modelo de recompensa

Despejando $r$ de la solución cerrada, $r(x,y)=\\beta\\log\\frac{\\pi^*(y\\mid x)}{\\pi_{\\text{ref}}(y\\mid x)}+\\beta\\log Z(x)$. Como Bradley–Terry solo depende de diferencias, $Z(x)$ se cancela, y la pérdida depende solo del modelo (Rafailov et al., 2023):

$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}\\,\\log\\sigma\\!\\Big(\\beta\\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta\\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\Big)$$

No hace falta muestrear del modelo durante el ajuste: se parte de un conjunto fijo de parejas. En la escena, la familia de modelos es $\\pi_\\delta\\propto\\pi_{\\text{ref}}\\,e^{\\delta\\cdot\\varphi}$; la pérdida DPO se calcula con las 16 combinaciones de rasgos y su normalización, y con la misma regularización los pesos $\\beta\\,\\delta$ coinciden con los del modelo de recompensa: un caso exacto de la equivalencia. En un modelo real es una aproximación, porque el modelo no puede representar cualquier distribución. Con preferencias ordenadas por GPT-4 en lugar de personas, Zephyr (2023) obtuvo un asistente competente sin anotación humana nueva; TinyLlama Chat siguió esa receta.

Qué publican los laboratorios: OpenAI dice que ChatGPT se entrenó con RLHF con los métodos de InstructGPT. Llama 2 usó RLHF con muestreo por rechazo y PPO (Touvron et al., 2023); Llama 3 usó ajuste supervisado, muestreo por rechazo y DPO, y explica que los algoritmos de refuerzo más complejos eran menos estables y más difíciles de escalar (Llama Team, 2024). De otros asistentes comerciales no se publica la receta completa: no la des por supuesta.

## Cuánto cuesta la capa

El «menos del 2 %» sale del artículo de InstructGPT: entrenar el modelo ajustado de 175 mil millones costó 4.9 petaflops/s-día, y el modelo final con PPO-ptx, 60, frente a 3 640 de GPT-3 (60 / 3 640 ≈ 1.6 %; con los 4.9, ≈ 1.8 %). No incluye el modelo de recompensa de 6 mil millones, la recolección de datos ni las pruebas previas. En las evaluaciones, las personas prefirieron las salidas del InstructGPT de 175 mil millones a las de GPT-3 en el 85 % de los casos (±3), y las del de 1.3 mil millones a las del GPT-3 de 175 mil millones.

## En código

\`\`\`python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# 1) Modelo de recompensa (Bradley–Terry): puntos de la respuesta preferida y de la rechazada
r_pref, r_rech = 1.8, -1.1
p = sigmoid(r_pref - r_rech)               # probabilidad de que la preferida gane
print(round(p, 3), round(-math.log(p), 3))

# 2) Óptimo con correa KL: pi*(y) ∝ pi_ref(y) · exp(r(y) / beta), con tres respuestas posibles
pi_ref = [0.6, 0.3, 0.1]
r = [0.0, 1.0, 3.0]
for beta in (10.0, 1.0, 0.25):
    w = [q * math.exp(ri / beta) for q, ri in zip(pi_ref, r)]
    z = sum(w)
    print(beta, [round(x / z, 3) for x in w])

# 3) DPO: la misma pérdida, pero con log-probabilidades del modelo en lugar de puntos
beta = 0.1
logp_w, logp_l = -12.0, -15.0              # log pi_theta de la preferida y de la rechazada
ref_w, ref_l = -12.5, -14.0                # log pi_ref
margen = beta * ((logp_w - ref_w) - (logp_l - ref_l))
print(round(-math.log(sigmoid(margen)), 3))
\`\`\`

Salida esperada:

\`\`\`
0.948 0.054
10.0 [0.563, 0.311, 0.127]
1.0 [0.175, 0.238, 0.587]
0.25 [0.0, 0.001, 0.999]
0.621
\`\`\`

Con $\\beta$ grande (correa corta) el modelo casi no se mueve; con $\\beta$ pequeño casi toda la probabilidad se concentra en la respuesta mejor puntuada y pierde variedad.

## Lo que viene

Todo esto moldea el comportamiento a partir de preferencias. La siguiente lección usa la misma maquinaria de refuerzo, pero con recompensas que se pueden **verificar** (la respuesta de un problema de matemáticas es correcta o no) para enseñar al modelo a razonar antes de responder.`,
    en: `## Step one: supervised fine-tuning (SFT)

With pairs (prompt $x$, ideal answer $y$), instruction tuning minimizes cross-entropy **only over the answer tokens**:

$$\\mathcal{L}_{\\text{SFT}}(\\theta) = -\\sum_{t \\in \\text{answer}} \\log \\pi_\\theta\\,(y_t \\mid x,\\, y_{<t})$$

The prompt tokens contribute no error (a “loss mask”). It is the loss from lesson 19 with different data, and the fine-tuning from lesson 27. InstructGPT used about 13 thousand prompts with demonstrations written by about 40 contractors (Ouyang et al., 2022). Earlier, FLAN (Wei et al., 2021) had turned dozens of datasets into instructions; later, LIMA (Zhou et al., 2023) fine-tuned a 65-billion-parameter model on only a thousand carefully chosen examples, to argue that almost all knowledge arrives in pretraining and tuning mostly teaches the format.

A caveat: the line between “base” and “assistant” has become blurry. The Qwen2.5 technical report (2024) says its pretraining already uses synthetic data generated by instruction-tuned models; with that base model the contrast does not show. That is why the scene uses TinyLlama 1.1B base (the 3-trillion-token checkpoint) and TinyLlama-1.1B-Chat-v1.0, which according to its model card was fine-tuned on UltraChat (synthetic dialogues) and then aligned with DPO on UltraFeedback (64 thousand prompts with answers ranked by GPT-4, not by people). The outputs are real, greedy-decoded and unedited (\`build-outputs.py\`); it is a small model trained mostly on English, and its assistant is imperfect: the “two-line” email does not come out in two lines.

## Step two: the reward model (Bradley–Terry)

If $y_w$ is the preferred answer and $y_l$ the rejected one for prompt $x$, the Bradley–Terry preference model assumes

$$P(y_w \\succ y_l \\mid x) = \\sigma\\big(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\big)$$

and the reward model $r_\\phi$ is trained by minimizing $-\\mathbb{E}\\,\\log \\sigma\\big(r_\\phi(x,y_w) - r_\\phi(x,y_l)\\big)$. Only differences matter: adding a constant to every score changes nothing. In InstructGPT, labelers ranked between 4 and 9 answers per prompt (over about 33 thousand prompts), which gives $\\binom{K}{2}$ comparisons per prompt, and the reward model had 6 billion parameters with a scalar output. Labelers agreed with each other 72.6% of the time (±1.5). While collecting training data they were asked to put helpfulness above truthfulness and harmlessness; for the final evaluations, the other way around.

The idea of learning a reward from human comparisons comes from Christiano et al. (2017), in Atari games and simulated robots; Stiennon et al. (2020) applied it to text summaries, and InstructGPT to general instructions. Preferences do not always come from people: Constitutional AI (Bai et al., 2022) replaces human labels about what is harmful with a written list of principles (RLAIF). In the scene, $r(y)=\\mathbf{w}\\cdot\\boldsymbol{\\varphi}(y)$ with four hand-assigned traits, and $\\mathbf{w}$ is fit by logistic regression with a small L2 penalty.

## Step three: optimizing on a leash (RLHF)

The model $\\pi_\\theta$ is tuned to maximize the reward without straying from the starting model $\\pi_{\\text{ref}}$; the “leash” is the KL divergence penalty:

$$\\max_{\\pi_\\theta}\\; \\mathbb{E}_{x,\\,y\\sim\\pi_\\theta}\\big[r_\\phi(x,y)\\big] - \\beta\\, D_{\\mathrm{KL}}\\big(\\pi_\\theta(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot\\mid x)\\big)$$

Its exact solution has a closed form:

$$\\pi^*(y\\mid x) = \\frac{1}{Z(x)}\\,\\pi_{\\text{ref}}(y\\mid x)\\,\\exp\\!\\Big(\\tfrac{1}{\\beta}\\,r(x,y)\\Big)$$

The scene computes that exact distribution; the “pressure” is $1/\\beta$. In practice it is approximated with reinforcement learning algorithms such as PPO. InstructGPT applied a per-token KL penalty relative to the tuned model and also mixed in pretraining gradients (PPO-ptx) to reduce performance drops on some public tasks.

## Optimizing too much: Goodhart’s law

Because $r_\\phi$ is an imperfect stand-in, optimizing it too hard hurts real quality. Gao, Schulman, and Hilton (2022) measured it with a “gold” model playing the role of people: with $d=\\sqrt{D_{\\mathrm{KL}}}$, the gold score follows $R_{\\text{bon}}(d)=d(\\alpha-\\beta d)$ when picking the best of $n$ samples and $R_{\\text{RL}}(d)=d(\\alpha-\\beta\\log d)$ with reinforcement learning: it rises, peaks, and falls. In their setup, the KL penalty did not measurably improve that frontier (it might depend on hyperparameters): it mainly serves to decide how far to go.

In the toy, the traits are independent in the starting model ($q = 0.5,\\ 0.3,\\ 0.4,\\ 0.2$), and the optimum keeps that independence: the probability of each trait becomes $\\sigma(\\operatorname{logit} q_j + w_j/\\beta)$. The practice judge has assumed weights $\\mathbf{w}=(2.2,\\ 0.5,\\ 0.3,\\ 0.45)$ and “real quality” is another assumed rule, $\\mathbf{g}=(3,\\ -1.2,\\ 0.3,\\ -2.6)$, which rewards correctness and penalizes padding and flattery. Real quality improves up to $1/\\beta \\approx 1.25$ (+0.90) and then falls, down to −0.97 at pressure 8, while the judge’s points always rise (from 0 to +1.89).

## DPO: the model is secretly a reward model

Solving the closed form for $r$ gives $r(x,y)=\\beta\\log\\frac{\\pi^*(y\\mid x)}{\\pi_{\\text{ref}}(y\\mid x)}+\\beta\\log Z(x)$. Since Bradley–Terry depends only on differences, $Z(x)$ cancels and the loss depends only on the model (Rafailov et al., 2023):

$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}\\,\\log\\sigma\\!\\Big(\\beta\\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta\\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\Big)$$

No sampling from the model is needed during tuning: you start from a fixed set of pairs. In the scene, the model family is $\\pi_\\delta\\propto\\pi_{\\text{ref}}\\,e^{\\delta\\cdot\\varphi}$; the DPO loss is computed over the 16 trait combinations with their normalization, and with the same regularization the weights $\\beta\\,\\delta$ coincide with the reward model’s: an exact case of the equivalence. In a real model it is an approximation, because the model cannot represent every distribution. With preferences ranked by GPT-4 instead of people, Zephyr (2023) produced a competent assistant without new human annotation; TinyLlama Chat followed that recipe.

What the labs publish: OpenAI says ChatGPT was trained with RLHF using InstructGPT’s methods. Llama 2 used RLHF with rejection sampling and PPO (Touvron et al., 2023); Llama 3 used supervised fine-tuning, rejection sampling, and DPO, and explains that more complex reinforcement algorithms were less stable and harder to scale (Llama Team, 2024). For other commercial assistants the full recipe is not published: do not assume it.

## What the layer costs

The “under 2%” comes from the InstructGPT paper: training the 175-billion-parameter tuned model took 4.9 petaflops/s-days, and the final PPO-ptx model, 60, versus 3,640 for GPT-3 (60 / 3,640 ≈ 1.6%; with the 4.9, ≈ 1.8%). It does not include the 6-billion-parameter reward model, data collection, or earlier experiments. In the evaluations, people preferred the outputs of the 175-billion-parameter InstructGPT to those of GPT-3 in 85% of cases (±3), and those of the 1.3-billion-parameter one to those of the 175-billion-parameter GPT-3.

## In code

\`\`\`python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# 1) Reward model (Bradley–Terry): points of the preferred and the rejected answer
r_pref, r_rej = 1.8, -1.1
p = sigmoid(r_pref - r_rej)                # probability that the preferred one wins
print(round(p, 3), round(-math.log(p), 3))

# 2) Optimum on a KL leash: pi*(y) ∝ pi_ref(y) · exp(r(y) / beta), with three possible answers
pi_ref = [0.6, 0.3, 0.1]
r = [0.0, 1.0, 3.0]
for beta in (10.0, 1.0, 0.25):
    w = [q * math.exp(ri / beta) for q, ri in zip(pi_ref, r)]
    z = sum(w)
    print(beta, [round(x / z, 3) for x in w])

# 3) DPO: the same loss, but with the model's log-probabilities instead of points
beta = 0.1
logp_w, logp_l = -12.0, -15.0              # log pi_theta of the preferred and the rejected answer
ref_w, ref_l = -12.5, -14.0                # log pi_ref
margin = beta * ((logp_w - ref_w) - (logp_l - ref_l))
print(round(-math.log(sigmoid(margin)), 3))
\`\`\`

Expected output:

\`\`\`
0.948 0.054
10.0 [0.563, 0.311, 0.127]
1.0 [0.175, 0.238, 0.587]
0.25 [0.0, 0.001, 0.999]
0.621
\`\`\`

With a large $\\beta$ (a short leash) the model barely moves; with a small $\\beta$ almost all the probability piles onto the best-scored answer and it loses variety.

## What comes next

All of this shapes behavior from preferences. The next lesson uses the same reinforcement machinery, but with rewards that can be **verified** (the answer to a math problem is right or wrong) to teach the model to reason before it answers.`,
  },

  lens: {
    es: [
      'Pregunta quién calibró el modelo. Las preferencias de quienes lo evaluaron quedan incorporadas: en InstructGPT fueron unas cuarenta personas contratadas, que coincidían entre sí unas tres de cada cuatro veces, y sus autores advierten que el modelo refleja a ese grupo, no «valores humanos» en general. Pide saber quiénes, cuántas, en qué idiomas y con qué instrucciones.',
      'Tono, longitud, grado de rechazo y complacencia son decisiones de producto, no hechos técnicos. En InstructGPT, durante el entrenamiento se pidió priorizar la utilidad sobre la veracidad y la inocuidad. Pide la política de comportamiento por escrito (algunas empresas la publican, como el Model Spec de OpenAI) y cómo comprueban que el modelo la cumple.',
      'Cada actualización del proveedor puede cambiar el comportamiento sin cambiar el nombre del modelo. En abril de 2025 se retiró una actualización de GPT-4o por aduladora; según OpenAI, influyó una combinación de cambios, entre ellos una señal nueva con los pulgares de los usuarios. Mantén casos de prueba propios (adulación, rechazos, tono) y córrelos antes de adoptar cada versión.',
      '«Optimizado con retroalimentación humana» no garantiza veracidad: se optimizó una puntuación que aproxima el gusto de las personas. Pide evaluaciones independientes de esa puntuación (lección 34) y recuerda que alinear moldea el comportamiento, no elimina las alucinaciones (lección 33).',
    ],
    en: [
      'Ask who calibrated the model. The preferences of the people who rated it get baked in: for InstructGPT it was about forty contractors, who agreed with each other about three times out of four, and its authors warn that the model reflects that group, not “human values” in general. Ask who they were, how many, in which languages, and with what instructions.',
      'Tone, length, degree of refusal, and agreeableness are product decisions, not technical facts. In InstructGPT, the people labeling training data were asked to put helpfulness above truthfulness and harmlessness. Ask for the behavior policy in writing (some companies publish theirs, like OpenAI’s Model Spec) and how they check that the model follows it.',
      'Every provider update can change behavior without changing the model’s name. In April 2025 a GPT-4o update was rolled back for being sycophantic; according to OpenAI, a combination of changes played a part, including a new signal from users’ thumbs. Keep your own test cases (sycophancy, refusals, tone) and run them before adopting each version.',
      '“Optimized with human feedback” does not guarantee truthfulness: what was optimized is a score that approximates people’s taste. Ask for evaluations independent of that score (lesson 34), and remember that alignment shapes behavior, it does not remove hallucinations (lesson 33).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué un modelo base no responde como un asistente?', en: 'Why does a base model not answer like an assistant?' },
      options: [
        { es: 'Porque no sabe suficientes datos.', en: 'Because it does not know enough facts.' },
        { es: 'Porque su arquitectura no permite conversar.', en: 'Because its architecture does not allow conversation.' },
        { es: 'Porque se entrenó para continuar texto, no para atender lo que la persona pretende.', en: 'Because it was trained to continue text, not to serve what the person intends.' },
        { es: 'Porque solo funciona con preguntas cortas.', en: 'Because it only works with short questions.' },
      ],
      answer: 2,
      why: {
        es: 'El preentrenamiento optimiza adivinar la siguiente pieza del texto. Ayudar, ser veraz y no dañar son otros objetivos, y se enseñan después: con ejemplos, con preferencias y con reglas.',
        en: 'Pretraining optimizes guessing the next piece of text. Being helpful, honest, and harmless are other objectives, taught afterwards: with examples, preferences, and rules.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué es un modelo de recompensa?', en: 'What is a reward model?' },
      options: [
        { es: 'Un juez que puntúa respuestas imitando cuál preferirían las personas.', en: 'A judge that scores answers by imitating which one people would prefer.' },
        { es: 'El modelo que escribe las respuestas finales que ve el usuario.', en: 'The model that writes the final answers the user sees.' },
        { es: 'Una base de datos con las respuestas correctas.', en: 'A database of the correct answers.' },
        { es: 'Un filtro que borra las respuestas ofensivas.', en: 'A filter that deletes offensive answers.' },
      ],
      answer: 0,
      why: {
        es: 'Se entrena con comparaciones entre respuestas y devuelve un número. Sustituye al juicio humano para poder optimizar, pero hereda los gustos y los errores de quienes compararon: no sabe qué es verdad.',
        en: 'It is trained on comparisons between answers and returns a number. It stands in for human judgment so that optimizing is possible, but it inherits the tastes and mistakes of those who compared: it does not know what is true.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un modelo de recompensa le da 1.5 puntos a la respuesta A y −0.5 a la B. Con la sigmoide de la diferencia, ¿qué probabilidad hay de que A sea la preferida?',
        en: 'A reward model gives answer A 1.5 points and answer B −0.5. Using the sigmoid of the difference, what is the probability that A is the preferred one?',
      },
      options: [
        { es: '0.73', en: '0.73' },
        { es: '0.88', en: '0.88' },
        { es: '0.50', en: '0.50' },
        { es: '0.12', en: '0.12' },
      ],
      answer: 1,
      why: {
        es: 'La diferencia es 1.5 − (−0.5) = 2, y σ(2) = 1 / (1 + e⁻²) ≈ 0.88. Solo importa la diferencia: 0.73 sería σ(1), 0.50 sería con diferencia 0, y 0.12 es la probabilidad de que gane B.',
        en: 'The difference is 1.5 − (−0.5) = 2, and σ(2) = 1 / (1 + e⁻²) ≈ 0.88. Only the difference matters: 0.73 would be σ(1), 0.50 would be a difference of 0, and 0.12 is the probability that B wins.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Tras una actualización que añadió los «me gusta» de los usuarios como señal de entrenamiento, tu asistente interno empieza a darles la razón aunque se equivoquen. ¿Qué haces primero?',
        en: 'After an update that added users’ thumbs-up as a training signal, your in-house assistant starts agreeing with users even when they are wrong. What do you do first?',
      },
      options: [
        { es: 'Comprar más GPUs para reentrenar.', en: 'Buy more GPUs to retrain.' },
        { es: 'Subir la temperatura de muestreo.', en: 'Raise the sampling temperature.' },
        { es: 'Cambiar a un modelo con más parámetros.', en: 'Switch to a model with more parameters.' },
        { es: 'Medir la adulación con casos de prueba propios y revisar cuánto pesa la señal nueva frente a las demás.', en: 'Measure sycophancy with your own test cases and review how much the new signal weighs against the others.' },
      ],
      answer: 3,
      why: {
        es: 'Es el patrón de la ley de Goodhart: optimizar una señal que premia lo agradable puede desplazar lo veraz. Más cómputo, más temperatura o más parámetros no corrigen una señal mal ponderada; hay que medir el comportamiento y ajustar la mezcla.',
        en: 'It is the Goodhart pattern: optimizing a signal that rewards what is pleasant can displace what is true. More compute, more temperature, or more parameters do not fix a badly weighted signal; you have to measure the behavior and adjust the mix.',
      },
    },
  ],

  glossary: ['pretraining', 'base-model', 'fine-tuning', 'language-model', 'token', 'loss', 'sigmoid', 'gradient-descent', 'instruction-tuning', 'alignment', 'reward-model', 'rlhf', 'dpo', 'sycophancy'],

  terms: [
    { id: 'alignment', term: { es: 'Alineación', en: 'Alignment' }, def: { es: 'Técnicas para que un modelo haga lo que la persona pretende y sea útil, veraz e inofensivo, y no solo lo más probable según su texto de entrenamiento. Convierte un modelo base en un asistente.', en: 'Techniques to get a model to do what the person intends and be helpful, honest, and harmless, not just whatever is most likely given its training text. It turns a base model into an assistant.' } },
    { id: 'instruction-tuning', term: { es: 'Ajuste con instrucciones', en: 'Instruction tuning' }, def: { es: 'Ajuste fino de un modelo base con pares de indicación y respuesta ideal escritos por personas, para que trate lo que se le pide como una petición y no como el comienzo de un texto.', en: 'Fine-tuning a base model on pairs of a prompt and an ideal answer written by people, so that it treats what it is asked as a request rather than as the start of a text.' } },
    { id: 'reward-model', term: { es: 'Modelo de recompensa', en: 'Reward model' }, def: { es: 'Modelo entrenado con comparaciones entre respuestas que devuelve una puntuación: más alta cuanto más probable es que las personas prefieran la respuesta. Hace de juez al optimizar; la probabilidad de que gane una respuesta es la sigmoide de la diferencia de puntuaciones.', en: 'A model trained on comparisons between answers that returns a score: higher the more likely people are to prefer the answer. It acts as the judge during optimization; the probability that an answer wins is the sigmoid of the difference in scores.' } },
    { id: 'rlhf', term: { es: 'RLHF (aprendizaje por refuerzo con retroalimentación humana)', en: 'RLHF (reinforcement learning from human feedback)' }, def: { es: 'Ajusta un modelo para que sus respuestas obtengan más puntos de un modelo de recompensa entrenado con preferencias humanas, con una penalización (la «correa» KL) que lo mantiene cerca del modelo de partida.', en: 'Tunes a model so that its answers earn more points from a reward model trained on human preferences, with a penalty (the KL “leash”) that keeps it close to the starting model.' } },
    { id: 'dpo', term: { es: 'DPO (optimización directa de preferencias)', en: 'DPO (direct preference optimization)' }, def: { es: 'Método que aprende de parejas de respuestas (preferida y rechazada) ajustando el modelo directamente: sube la probabilidad de la preferida y baja la de la rechazada, sin entrenar un modelo de recompensa aparte ni usar refuerzo.', en: 'A method that learns from pairs of answers (preferred and rejected) by tuning the model directly: it raises the probability of the preferred one and lowers the rejected one’s, without training a separate reward model or using reinforcement learning.' } },
    { id: 'sycophancy', term: { es: 'Adulación (sycophancy)', en: 'Sycophancy' }, def: { es: 'Tendencia de un asistente a decir lo que la persona quiere oír, como darle la razón o elogiar su trabajo aunque esté equivocada. En parte es un efecto de optimizar la aprobación humana.', en: 'An assistant’s tendency to tell people what they want to hear, such as agreeing with them or praising their work even when they are wrong. In part it is an effect of optimizing for human approval.' } },
  ],

  sources: [
    { title: 'Training language models to follow instructions with human feedback', authors: 'Ouyang, L., Wu, J., Jiang, X., et al.', year: 2022, url: 'https://arxiv.org/abs/2203.02155' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B., Mann, B., Ryder, N., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Introducing ChatGPT', authors: 'OpenAI', year: 2022, url: 'https://openai.com/index/chatgpt/' },
    { title: 'Direct Preference Optimization: Your Language Model Is Secretly a Reward Model', authors: 'Rafailov, R., Sharma, A., Mitchell, E., Ermon, S., Manning, C. D., Finn, C.', year: 2023, url: 'https://arxiv.org/abs/2305.18290' },
    { title: 'Scaling Laws for Reward Model Overoptimization', authors: 'Gao, L., Schulman, J., Hilton, J.', year: 2022, url: 'https://arxiv.org/abs/2210.10760' },
    { title: 'Towards Understanding Sycophancy in Language Models', authors: 'Sharma, M., Tong, M., Korbak, T., et al.', year: 2023, url: 'https://arxiv.org/abs/2310.13548' },
    { title: 'Sycophancy in GPT-4o: what happened and what we’re doing about it', authors: 'OpenAI', year: 2025, url: 'https://openai.com/index/sycophancy-in-gpt-4o/' },
    { title: 'Expanding on what we missed with sycophancy', authors: 'OpenAI', year: 2025, url: 'https://openai.com/index/expanding-on-sycophancy/' },
    { title: 'Introducing the Model Spec', authors: 'OpenAI', year: 2024, url: 'https://openai.com/index/introducing-the-model-spec/' },
    { title: 'TinyLlama: An Open-Source Small Language Model', authors: 'Zhang, P., Zeng, G., Wang, T., Lu, W.', year: 2024, url: 'https://arxiv.org/abs/2401.02385' },
    { title: 'TinyLlama-1.1B-Chat-v1.0 (ficha del modelo / model card)', authors: 'TinyLlama', year: 2024, url: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0' },
    { title: 'Zephyr: Direct Distillation of LM Alignment', authors: 'Tunstall, L., Beeching, E., Lambert, N., et al.', year: 2023, url: 'https://arxiv.org/abs/2310.16944' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Deep Reinforcement Learning from Human Preferences', authors: 'Christiano, P. F., Leike, J., Brown, T. B., Martic, M., Legg, S., Amodei, D.', year: 2017, url: 'https://arxiv.org/abs/1706.03741' },
    { title: 'Learning to Summarize from Human Feedback', authors: 'Stiennon, N., Ouyang, L., Wu, J., et al.', year: 2020, url: 'https://arxiv.org/abs/2009.01325' },
    { title: 'Finetuned Language Models Are Zero-Shot Learners', authors: 'Wei, J., Bosma, M., Zhao, V. Y., et al.', year: 2021, url: 'https://arxiv.org/abs/2109.01652' },
    { title: 'LIMA: Less Is More for Alignment', authors: 'Zhou, C., Liu, P., Xu, P., et al.', year: 2023, url: 'https://arxiv.org/abs/2305.11206' },
    { title: 'Qwen2.5 Technical Report', authors: 'Qwen Team', year: 2024, url: 'https://arxiv.org/abs/2412.15115' },
    { title: 'Constitutional AI: Harmlessness from AI Feedback', authors: 'Bai, Y., Kadavath, S., Kundu, S., et al.', year: 2022, url: 'https://arxiv.org/abs/2212.08073' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., Martin, L., Stone, K., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
  ],
});
