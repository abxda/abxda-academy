import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «Qwen», «o1»
// o «R1», y la voz dice «Kuen», «o uno» o «erre uno». (Las cifras ya van con letras en la narración.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/Qwen/g, 'Kuen'], [/\bo1\b/g, 'o uno'], [/\bR1\b/g, 'erre uno'], [/DeepSeek/g, 'Dip Sik'], [/OpenAI/g, 'Open ei ai'],
    [/Google/g, 'Gúgol'], [/Anthropic/g, 'Anzrópic'], [/PaLM/g, 'Palm'], [/chain of thought/g, 'chein of zot'],
    [/self-consistency/g, 'self consístensi'], [/test-time compute/g, 'test taim compiut'],
  ],
  en: [[/Qwen/g, 'Kwen'], [/\bo1\b/g, 'o one'], [/\bR1\b/g, 'R one'], [/OpenAI/g, 'Open A I'], [/PaLM/g, 'Palm']],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'razonamiento',

  objectives: {
    es: [
      'Explicar por qué escribir los pasos intermedios (la cadena de pensamiento) ayuda a un modelo que escribe un token a la vez.',
      'Describir cómo se entrena un modelo de razonamiento: muchos intentos, una regla que comprueba la respuesta (recompensa verificable) y refuerzo de los intentos que aciertan.',
      'Predecir qué gana y qué cuesta pensar más o votar entre varias respuestas, y reconocer sus límites: errores que se repiten y razonamientos convincentes pero equivocados.',
    ],
    en: [
      'Explain why writing out the intermediate steps (the chain of thought) helps a model that writes one token at a time.',
      'Describe how a reasoning model is trained: many tries, a rule that checks the answer (a verifiable reward), and reinforcement of the tries that get it right.',
      'Predict what thinking longer or voting among several answers gains and costs, and recognize their limits: errors that repeat and reasoning that is convincing but wrong.',
    ],
  },

  segments: ([
    // ── 1 · un problema de lápiz y papel ──
    {
      id: 'hook',
      es: '¿Puede un modelo pensar antes de responder? Pongámoslo a prueba con un problema de lápiz y papel. Un tren sale con ciento cuarenta y ocho pasajeros.',
      en: 'Can a model think before it answers? Let’s test it with a pencil-and-paper problem. A train leaves with one hundred forty-eight passengers.',
      pad: 0.3,
    },
    {
      id: 'train',
      es: 'En la primera parada bajan treinta y siete y suben cincuenta y dos. En la segunda, bajan sesenta y uno y suben dieciocho.',
      en: 'At the first stop, thirty-seven get off and fifty-two get on. At the second, sixty-one get off and eighteen get on.',
      pad: 0.3,
    },
    {
      id: 'ask',
      es: '¿Cuántos van a bordo al final? Se lo preguntamos a un modelo de lenguaje real, y le pedimos que conteste solo con el número.',
      en: 'How many are on board at the end? We asked a real language model, and told it to reply with only the number.',
      pad: 0.3,
    },
    {
      id: 'one-pass',
      es: 'Recuerda la lección diecinueve: el modelo escribe un token a la vez, y cada token sale de una pasada por el modelo. Aquí, cada cifra es un token.',
      en: 'Remember lesson nineteen: the model writes one token at a time, and each token comes from one pass through the model. Here, each digit is a token.',
      pad: 0.4,
    },
    {
      id: 'instant',
      es: 'Si contesta de inmediato, no escribe ningún paso intermedio: la cuenta entera tiene que resolverse por dentro, en esas tres pasadas. Y en este intento, falló.',
      en: 'If it answers right away, it writes no intermediate step: the whole calculation has to happen inside, in those three passes. And on this try, it got it wrong.',
      pad: 0.4,
    },
    {
      id: 'tries',
      es: 'El modelo es Qwen tres punto cinco: abierto y pequeño, de cuatro mil millones de parámetros. Le hicimos la misma pregunta treinta y dos veces.',
      en: 'The model is Qwen three point five: open and small, with four billion parameters. We asked it the same question thirty-two times.',
      pad: 0.3,
    },
    {
      id: 'sampling',
      es: 'Como viste en la lección diecinueve, elige cada token al azar según sus probabilidades. Por eso cada intento puede dar un número distinto.',
      en: 'As you saw in lesson nineteen, it picks each token at random according to its probabilities. That is why each try can give a different number.',
      pad: 0.4,
    },
    {
      id: 'count0',
      es: 'La respuesta correcta es ciento veinte. Marcamos los intentos que aciertan: contestando de inmediato, acertó en menos de la mitad de los treinta y dos.',
      en: 'The correct answer is one hundred twenty. We mark the tries that got it right: answering right away, it was right on fewer than half of the thirty-two.',
      pad: 0.4,
    },
    // ── 2 · paso a paso: la cadena de pensamiento ──
    {
      id: 'by-hand',
      es: '¿Cómo lo resuelves tú? Paso a paso. Ciento cuarenta y ocho menos treinta y siete son ciento once. Más cincuenta y dos, ciento sesenta y tres.',
      en: 'How do you solve it? Step by step. One hundred forty-eight minus thirty-seven is one hundred eleven. Plus fifty-two, one hundred sixty-three.',
      pad: 0.3,
    },
    {
      id: 'by-hand-2',
      es: 'Menos sesenta y uno, ciento dos. Más dieciocho, ciento veinte. Cada resultado queda escrito, y el paso siguiente parte de él.',
      en: 'Minus sixty-one, one hundred two. Plus eighteen, one hundred twenty. Each result is written down, and the next step starts from it.',
      pad: 0.4,
    },
    {
      id: 'cot-idea',
      es: 'Un modelo puede hacer lo mismo: escribir los pasos antes de la respuesta. Lo que escribe se vuelve parte del texto, y el siguiente token puede leerlo.',
      en: 'A model can do the same: write the steps before the answer. What it writes becomes part of the text, and the next token can read it.',
      pad: 0.5,
    },
    {
      id: 'cot-passes',
      es: 'Y cada token escrito es una pasada más por el modelo. Con la respuesta sola, eran tres pasadas. Con los cuatro pasos escritos, son unas cincuenta.',
      en: 'And each written token is one more pass through the model. With the answer alone, it was three passes. With the four steps written out, it is about fifty.',
      pad: 0.5,
    },
    {
      id: 'cot-name',
      es: 'Escribir los pasos intermedios antes de responder se llama cadena de pensamiento; en inglés, chain of thought.',
      en: 'Writing out the intermediate steps before answering is called a chain of thought.',
      note: { es: 'Cadena de pensamiento: escribir los pasos intermedios antes de la respuesta. Cada paso escrito es contexto y una pasada más de cálculo.', en: 'Chain of thought: writing out the intermediate steps before the answer. Each written step is context and one more pass of computation.' },
      pad: 0.3,
    },
    {
      id: 'cot-wei',
      es: 'En dos mil veintidós, un equipo de Google lo probó con PaLM, un modelo enorme: antes de la pregunta, le mostraban ocho problemas resueltos paso a paso.',
      en: 'In twenty twenty-two, a team at Google tried it with PaLM, a huge model: before the question, they showed it eight problems solved step by step.',
      pad: 0.4,
    },
    {
      id: 'cot-gsm',
      es: 'En un examen de problemas escolares de matemáticas, PaLM acertó diecisiete punto nueve por ciento contestando directo, y cincuenta y seis punto nueve con la cadena de pensamiento.',
      en: 'On a test of grade-school math problems, PaLM got seventeen point nine percent right answering directly, and fifty-six point nine with a chain of thought.',
      pad: 0.5,
    },
    {
      id: 'cot-small',
      es: 'Pero su versión pequeña, de ocho mil millones de parámetros, empeoró: bajó de cuatro punto nueve a cuatro punto uno por ciento. Escribía pasos fluidos, pero sin lógica.',
      en: 'But its small version, with eight billion parameters, got worse: it fell from four point nine to four point one percent. It wrote fluent steps, but illogical ones.',
      pad: 0.5,
    },
    // ── 3 · modelos de razonamiento ──
    {
      id: 'rm-intro',
      es: 'La siguiente idea fue entrenar a los modelos para pensar así por su cuenta, sin pedírselo. En septiembre de dos mil veinticuatro, OpenAI presentó o1, un modelo de razonamiento.',
      en: 'The next idea was to train models to think this way on their own, without being asked. In September twenty twenty-four, OpenAI introduced o1, a reasoning model.',
      note: { es: 'Modelo de razonamiento: entrenado para escribir su propio pensamiento, a veces muy largo, antes de responder.', en: 'Reasoning model: trained to write out its own thinking, sometimes very long, before answering.' },
      pad: 0.4,
    },
    {
      id: 'rm-shape',
      es: 'Un modelo de razonamiento primero escribe su pensamiento, a veces de miles de tokens, y después la respuesta. Muchos servicios solo te muestran un resumen del pensamiento.',
      en: 'A reasoning model first writes out its thinking, sometimes thousands of tokens long, and then the answer. Many services only show you a summary of that thinking.',
      pad: 0.5,
    },
    {
      id: 'rm-ours',
      es: 'El Qwen de nuestra prueba también piensa así; antes se lo habíamos desactivado. Con el pensamiento activo, escribió unos quinientos tokens y acertó los treinta y dos intentos.',
      en: 'The Qwen in our test thinks this way too; we had turned it off before. With thinking on, it wrote about five hundred tokens and got all thirty-two tries right.',
      pad: 0.5,
    },
    // ── 4 · cómo se entrena: refuerzo y recompensas verificables ──
    {
      id: 'rl-recall',
      es: '¿Cómo se le enseña? Recuerda la lección anterior: el modelo practica, un juez puntúa y el modelo se ajusta. Ese juez era un modelo de recompensa: opinaba, y se podía engañar.',
      en: 'How is it taught? Remember the last lesson: the model practices, a judge scores, and the model adjusts. That judge was a reward model: it gave opinions, and it could be fooled.',
      pad: 0.5,
    },
    {
      id: 'verifiable',
      es: 'En matemáticas o en programación hay un juez mejor: una regla que comprueba. ¿El número final es ciento veinte? ¿El programa pasa sus pruebas?',
      en: 'In math or programming there is a better judge: a rule that checks. Is the final number one hundred twenty? Does the program pass its tests?',
      pad: 0.4,
    },
    {
      id: 'verif-name',
      es: 'Eso es una recompensa verificable: un punto si la respuesta se comprueba correcta, cero si no. No opina; comprueba.',
      en: 'That is a verifiable reward: one point if the answer checks out as correct, zero if not. It does not give an opinion; it checks.',
      note: { es: 'Recompensa verificable: una regla comprueba la respuesta (uno si es correcta, cero si no), en vez de un juez que opina.', en: 'Verifiable reward: a rule checks the answer (one if correct, zero if not), instead of a judge giving an opinion.' },
      pad: 0.3,
    },
    {
      id: 'rl-loop',
      es: 'En cada problema, el modelo hace varios intentos, pensando cada vez. Los que aciertan se refuerzan y los que fallan se debilitan. Nadie le dice cómo pensar; solo si acertó.',
      en: 'For each problem, the model makes several tries, thinking each time. The right ones are reinforced and the wrong ones weakened. No one tells it how to think, only whether it was right.',
      pad: 0.6,
    },
    {
      id: 'r1',
      es: 'Así entrenó DeepSeek su modelo R1, en dos mil veinticinco. En un examen de matemáticas de competencia, su primera versión pasó de quince punto seis a setenta y siete punto nueve por ciento de aciertos.',
      en: 'That is how DeepSeek trained its R1 model in twenty twenty-five. On a competition math exam, its first version went from fifteen point six to seventy-seven point nine percent correct.',
      pad: 0.5,
    },
    {
      id: 'r1-long',
      es: 'Nadie le pidió pensar más, pero sus pensamientos se alargaron solos, de cientos a miles de tokens. Hasta empezó a revisarse: escribía «espera, espera» y volvía sobre sus pasos.',
      en: 'No one asked it to think longer, yet its thinking grew on its own, from hundreds to thousands of tokens. It even began to check itself: it wrote “wait, wait” and went back over its steps.',
      pad: 0.5,
    },
    // ── 5 · cómputo al responder: el presupuesto de pensamiento ──
    {
      id: 'ttc',
      es: 'Fíjate: nuestro modelo acertó más sin cambiar ni un peso, solo calculando más al responder. Se llama cómputo en tiempo de prueba; en inglés, test-time compute.',
      en: 'Notice: our model got more right without changing a single weight, just by spending more computation while answering. That is called test-time compute.',
      note: { es: 'Cómputo en tiempo de prueba: gastar más cálculo al responder (pensar más, votar), sin cambiar los pesos.', en: 'Test-time compute: spending more computation while answering (thinking longer, voting), without changing the weights.' },
      pad: 0.4,
    },
    {
      id: 'budget',
      es: 'Midámoslo. Le damos al modelo un presupuesto: un máximo de tokens para pensar. Si se le acaba, cortamos el pensamiento ahí y le pedimos la respuesta.',
      en: 'Let’s measure it. We give the model a budget: a maximum number of tokens for thinking. If it runs out, we cut the thinking off there and ask for the answer.',
      pad: 0.6,
    },
    {
      id: 'axis-x',
      es: 'En la gráfica, a lo ancho va el presupuesto, de cero a cuatro mil noventa y seis tokens. Desde treinta y dos, cada marca es el doble de la anterior.',
      en: 'On the chart, the width shows the budget, from zero to four thousand ninety-six tokens. From thirty-two on, each mark is double the one before.',
      pad: 0.4,
    },
    {
      id: 'axis-y',
      es: 'Hacia arriba, cuántos de los treinta y dos intentos aciertan. El primer punto ya lo conoces: con presupuesto cero, contestando de inmediato, menos de la mitad.',
      en: 'Upward, how many of the thirty-two tries are right. You already know the first point: with a budget of zero, answering right away, fewer than half.',
      pad: 0.4,
    },
    {
      id: 'demo-low',
      es: 'Ahora mira. Con treinta y dos tokens, acierta todavía menos que sin pensar: un pensamiento cortado tan pronto le estorba más de lo que le ayuda.',
      en: 'Now watch. With thirty-two tokens, it gets even fewer right than without thinking: a thought cut off that early gets in the way more than it helps.',
      pad: 0.5,
    },
    {
      id: 'demo-mid',
      es: 'Con sesenta y cuatro y con ciento veintiocho, los aciertos suben y bajan. Con doscientos cincuenta y seis tokens, ya acierta la gran mayoría.',
      en: 'With sixty-four and one hundred twenty-eight, the hits go up and down. With two hundred fifty-six tokens, it already gets the vast majority right.',
      pad: 0.6,
    },
    {
      id: 'demo-high',
      es: 'Y desde quinientos doce tokens, acierta los treinta y dos intentos. Con más presupuesto, ya no cambia nada.',
      en: 'And from five hundred twelve tokens on, it gets all thirty-two tries right. With a bigger budget, nothing changes anymore.',
      pad: 0.6,
    },
    {
      id: 'natural',
      es: '¿Por qué ya no cambia? Porque este modelo termina de pensar por su cuenta, hacia los quinientos tokens. El presupuesto es un tope, no una obligación.',
      en: 'Why does nothing change? Because this model finishes thinking on its own, around five hundred tokens. The budget is a ceiling, not a requirement.',
      pad: 0.4,
    },
    {
      id: 'try-budget',
      es: 'Si quieres, mueve tú el presupuesto y mira cuántos de los treinta y dos intentos aciertan.',
      en: 'If you like, move the budget yourself and see how many of the thirty-two tries are right.',
      gate: { id: 'budget', prompt: { es: 'mueve el presupuesto y mira cuántos aciertan.', en: 'move the budget and see how many are right.' } },
      pad: 0.4,
    },
    // ── 6 · votar: autoconsistencia ──
    {
      id: 'vote-idea',
      es: 'Hay otra forma de gastar más cálculo al responder: pedir varias respuestas y quedarse con la que más se repite. Como una votación.',
      en: 'There is another way to spend more computation while answering: ask for several answers and keep the one that repeats most. Like a vote.',
      pad: 0.4,
    },
    {
      id: 'vote-demo',
      es: 'Mira los treinta y dos intentos sin pensar, apilados por respuesta. El ciento veinte forma la fila más larga; ningún error se repite más de tres veces.',
      en: 'Look at the thirty-two tries without thinking, stacked by answer. One hundred twenty makes the longest row; no wrong answer repeats more than three times.',
      pad: 0.6,
    },
    {
      id: 'vote-why',
      es: 'Los errores se reparten entre muchos números; los aciertos coinciden en uno solo. Por eso la votación elige ciento veinte, aunque cada intento suela fallar.',
      en: 'The errors spread across many numbers; the right answers agree on one. That is why the vote picks one hundred twenty, even though each try usually fails.',
      pad: 0.4,
    },
    {
      id: 'sc-name',
      es: 'Votar entre varias cadenas de pensamiento se llama autoconsistencia; en inglés, self-consistency.',
      en: 'Voting among several chains of thought is called self-consistency.',
      note: { es: 'Autoconsistencia: pedir varias cadenas de pensamiento y quedarse con la respuesta que más se repite.', en: 'Self-consistency: ask for several chains of thought and keep the answer that repeats most.' },
      pad: 0.3,
    },
    {
      id: 'sc-palm',
      es: 'En el examen escolar de antes, PaLM acertaba cerca del cincuenta y siete por ciento con una sola cadena, y setenta y cuatro punto cuatro votando entre cuarenta.',
      en: 'On the grade-school test from before, PaLM got about fifty-seven percent right with a single chain, and seventy-four point four voting among forty.',
      pad: 0.5,
    },
    {
      id: 'vote-limit',
      es: 'Pero votar no arregla un error que se repite. Con treinta y dos tokens de presupuesto, la mayoría de los intentos dio el mismo número equivocado, y la votación lo eligió.',
      en: 'But voting does not fix an error that repeats. With a thirty-two-token budget, most tries gave the same wrong number, and the vote picked it.',
      pad: 0.6,
    },
    {
      id: 'try-vote',
      es: 'Si quieres, mueve el presupuesto y mira qué número gana la votación.',
      en: 'If you like, move the budget and see which number wins the vote.',
      gate: { id: 'vote', prompt: { es: 'mueve el presupuesto y mira qué número gana.', en: 'move the budget and see which number wins.' } },
      pad: 0.4,
    },
    // ── 7 · lo que cuesta pensar ──
    {
      id: 'cost-tokens',
      es: 'Pensar no es gratis. Cada token de pensamiento es una pasada más del modelo, como en la lección veintiséis, y se cobra como salida, aunque solo veas un resumen.',
      en: 'Thinking is not free. Each thinking token is one more pass of the model, as in lesson twenty-six, and it is billed as output, even if you only see a summary.',
      note: { es: 'Pensar cuesta: los tokens de pensamiento se escriben uno a uno (más espera) y se cobran como salida.', en: 'Thinking costs: thinking tokens are written one by one (more waiting) and billed as output.' },
      pad: 0.5,
    },
    {
      id: 'cost-ours',
      es: 'En nuestra prueba, contestar directo eran tres tokens; pensar, unos quinientos más. A cien tokens por segundo, un supuesto, son unos cinco segundos más de espera.',
      en: 'In our test, answering directly took three tokens; thinking, about five hundred more. At a hundred tokens per second, an assumption, that is about five more seconds of waiting.',
      pad: 0.5,
    },
    {
      id: 'cost-vote',
      es: 'Y votar multiplica la cuenta: treinta y dos intentos pensando suman más de quince mil tokens.',
      en: 'And voting multiplies the bill: thirty-two tries with thinking add up to more than fifteen thousand tokens.',
      pad: 0.5,
    },
    {
      id: 'when',
      es: 'Por eso conviene pensar más donde equivocarse cuesta caro: una cuenta, un contrato, un programa. Para un saludo o una pregunta sencilla, solo agrega espera y costo.',
      en: 'So it pays to think longer where a mistake is costly: a calculation, a contract, a program. For a greeting or a simple question, it only adds waiting and cost.',
      pad: 0.5,
    },
    // ── 8 · límites ──
    {
      id: 'limit-plausible',
      es: 'Y tiene límites. Un pensamiento puede sonar bien y estar mal: basta un error en un paso para que todo lo que sigue lo arrastre, con la misma seguridad.',
      en: 'And it has limits. A line of thinking can sound right and be wrong: one error in one step is enough, and everything after it carries it along, just as confidently.',
      pad: 0.6,
    },
    {
      id: 'limit-faithful',
      es: 'Además, el pensamiento escrito no siempre cuenta la razón real. En un estudio de Anthropic, los modelos usaban una pista escondida y la mencionaban menos de cuatro de cada diez veces.',
      en: 'Also, the written thinking does not always tell the real reason. In a study by Anthropic, models used a hidden hint and mentioned it fewer than four times out of ten.',
      pad: 0.6,
    },
    // ── 9 · cierre ──
    {
      id: 'recap',
      es: 'En resumen: escribir los pasos le da al modelo dónde calcular; el refuerzo con respuestas comprobables le enseña a hacerlo solo; y pensar más cuesta tokens y espera.',
      en: 'In short: writing out the steps gives the model room to calculate; reinforcement with checkable answers teaches it to do so on its own; and thinking longer costs tokens and waiting.',
      pad: 0.4,
    },
    {
      id: 'lens',
      es: 'Para quien decide: el pensamiento se paga en tokens de salida y en espera. Úsalo donde el error cuesta más, y comprueba el resultado, no lo convincente del razonamiento.',
      en: 'For decision-makers: thinking is paid for in output tokens and in waiting. Use it where errors cost the most, and check the result, not how convincing the reasoning sounds.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Hasta aquí, cada pregunta empezaba de cero. Pero en una conversación larga, ¿recuerda el modelo lo que le dijiste antes? De eso trata la siguiente lección.',
      en: 'So far, every question started from scratch. But in a long conversation, does the model remember what you told it earlier? That is the next lesson.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Un modelo de lenguaje escribe un token por pasada. Si contesta de inmediato, toda la cuenta debe ocurrir por dentro; si escribe los pasos (cadena de pensamiento), cada resultado queda como contexto y cada token añade una pasada de cálculo.',
      'Pedir los pasos solo ayudó a modelos grandes (PaLM de 540 mil M: de 17.9 a 56.9 % en GSM8K; el de 8 mil M empeoró). Los modelos de razonamiento (o1 en 2024, DeepSeek-R1 en 2025) se entrenan para pensar por su cuenta.',
      'Se entrenan con refuerzo y recompensas verificables: una regla comprueba la respuesta (¿es el número correcto?, ¿pasa las pruebas?) y se refuerzan los intentos que aciertan. Nadie les dicta cómo pensar.',
      'Cómputo en tiempo de prueba: pensar más o votar entre varias respuestas mejora sin tocar los pesos. En nuestra medición, Qwen3.5-4B pasó de 14 de 32 aciertos sin pensar a 32 de 32 con unos 500 tokens de pensamiento; cortarlo a 32 tokens lo empeoró.',
      'Todo eso cuesta: los tokens de pensamiento se cobran como salida y hacen esperar, y votar multiplica el gasto. Votar no corrige un error que se repite, y un razonamiento convincente puede estar mal o no contar su razón real.',
    ],
    en: [
      'A language model writes one token per pass. If it answers right away, the whole calculation must happen inside; if it writes out the steps (a chain of thought), each result stays as context and each token adds a pass of computation.',
      'Asking for steps only helped large models (540B PaLM: from 17.9 to 56.9% on GSM8K; the 8B one got worse). Reasoning models (o1 in 2024, DeepSeek-R1 in 2025) are trained to think on their own.',
      'They are trained with reinforcement learning and verifiable rewards: a rule checks the answer (is it the right number? does it pass the tests?) and the tries that get it right are reinforced. No one dictates how they should think.',
      'Test-time compute: thinking longer or voting among several answers improves results without touching the weights. In our measurement, Qwen3.5-4B went from 14 of 32 right without thinking to 32 of 32 with about 500 thinking tokens; cutting it at 32 tokens made it worse.',
      'All of that costs: thinking tokens are billed as output and add waiting, and voting multiplies the spend. Voting does not fix an error that repeats, and convincing reasoning can be wrong or hide its real reason.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Si el modelo muestra un razonamiento largo y ordenado, la respuesta es confiable: el razonamiento explica cómo llegó a ella.',
      en: 'If the model shows a long, orderly line of reasoning, the answer is reliable: the reasoning explains how it got there.',
    },
    right: {
      es: 'El pensamiento escrito ayuda a calcular, pero no garantiza nada: un error en un paso arrastra a los siguientes con la misma seguridad, y el texto no siempre refleja la razón real (en el estudio de Chen et al., los modelos mencionaban la pista que usaban en el 25 % y el 39 % de los casos). Comprueba el resultado con algo externo: una cuenta, una prueba, una fuente.',
      en: 'Written thinking helps with calculating, but it guarantees nothing: an error in one step carries into the next ones just as confidently, and the text does not always reflect the real reason (in Chen et al.’s study, models mentioned the hint they used in 25% and 39% of cases). Check the result against something external: a calculation, a test, a source.',
    },
  },

  deeper: {
    es: `## La cadena de pensamiento, en una fórmula

Un modelo autorregresivo genera cada token condicionado a todo lo anterior: $y_t \\sim p_\\theta(\\cdot \\mid x, y_{<t})$. Si responde directo, la respuesta $a$ sale de $p_\\theta(a \\mid x)$ en unas pocas pasadas. Con cadena de pensamiento, primero escribe $c = (c_1, \\dots, c_m)$ y luego responde condicionado a ella:

$$p_\\theta(a \\mid x) = \\sum_{c} p_\\theta(c \\mid x)\\, p_\\theta(a \\mid x, c)$$

Cada token de $c$ cuesta una pasada completa, unas $2N$ operaciones para un modelo de $N$ parámetros (lecciones 24 y 26): con $N = 4\\cdot 10^9$ y $m \\approx 500$ son unos $4\\cdot10^{12}$ cálculos más, y $m$ vueltas más de decodificación. Wei et al. (2022) lo dicen así: la cadena permite descomponer un problema en pasos, de modo que «se puede asignar cómputo adicional a los problemas que requieren más pasos».

Con 8 ejemplos resueltos en la indicación, en GSM8K (problemas escolares de matemáticas): PaLM 540B pasó de 17.9 a 56.9 %, PaLM 62B de 9.6 a 29.9 % y PaLM 8B bajó de 4.9 a 4.1 % (Wei et al., tabla 2). Los autores observaron que los modelos pequeños producían cadenas «fluidas pero ilógicas». Kojima et al. (2022) mostraron que basta añadir «Let's think step by step»: con text-davinci-002, GSM8K subió de 10.4 a 40.7 %. En la escena, los 3 y 51 tokens se contaron con el tokenizador de Qwen3.5, que separa cada cifra en un token.

## Recompensas verificables

En la lección 28, RLHF maximiza los puntos de un modelo de recompensa $r_\\phi$ sin alejarse demasiado del modelo de partida:

$$\\max_\\theta\\ \\mathbb{E}_{x,\\ y \\sim \\pi_\\theta(\\cdot\\mid x)}\\big[r(x,y)\\big] - \\beta\\, \\mathrm{KL}\\big(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}}\\big)$$

El refuerzo con recompensas verificables (RLVR, nombre de Lambert et al., 2024) usa el mismo objetivo pero cambia el juez por una función que comprueba: $r(x,y) = \\alpha\\cdot\\mathbb{1}[\\,\\text{verificar}(x,y)\\,]$, por ejemplo «la respuesta final coincide con la correcta» o «el código pasa las pruebas». DeepSeek-R1-Zero (DeepSeek-AI, 2025) muestrea 16 respuestas por pregunta y compara cada recompensa con la del grupo (GRPO): $A_i = (r_i - \\text{media}(r))/\\text{desv}(r)$. Su recompensa es exactitud + formato; evitaron los modelos de recompensa neuronales porque son «susceptibles al *reward hacking*». En AIME 2024 su exactitud pasó de 15.6 a 77.9 % (una muestra) y a 86.7 % votando entre 16. La longitud media de sus respuestas creció durante el entrenamiento, y apareció el «momento ajá» («Wait, wait. Wait.»). OpenAI describe o1 (2024) como «entrenado con aprendizaje por refuerzo a gran escala para razonar usando cadena de pensamiento»; no publicó su receta.

## Autoconsistencia

Con $k$ respuestas muestreadas $a_1, \\dots, a_k$, se elige la más repetida:

$$\\hat a = \\arg\\max_{a} \\sum_{i=1}^{k} \\mathbb{1}[a_i = a]$$

Wang et al. (2023) votaron entre 40 cadenas: PaLM 540B pasó de 56.5 a 74.4 % en GSM8K (su medición de la cadena sola es 56.5 %; la de Wei et al., 56.9 %). OpenAI informó que o1 resolvía el 74 % de AIME 2024 con una muestra y el 83 % con consenso entre 64 (GPT-4o: 12 %). Votar ayuda cuando los errores se dispersan; si el modelo se equivoca siempre igual, la votación confirma el error.

## Nuestra medición

Qwen3.5-4B (Qwen, 2026; Apache-2.0), cuantizado a fp8 y ejecutado con vLLM en una RTX 3060. Para cada idioma, 32 cadenas de pensamiento completas (hasta 4 096 tokens) con temperatura 0.7, top-p 0.95 y top-k 20. Presupuesto forzado, como el *budget forcing* de Muennighoff et al. (2025): si la cadena terminó sola en $L \\le B$ tokens, se usa su respuesta; si no, se corta en $B$ tokens, se cierra el pensamiento con una frase fija y se pide la respuesta. $B = 0$ es el modo sin pensar del modelo. La comprobación de la respuesta (¿es 120?) es la misma regla que usaría una recompensa verificable.

| presupuesto (tokens) | 0 | 32 | 64 | 128 | 256 | 512 | 1 024 – 4 096 |
|---|---|---|---|---|---|---|---|
| aciertos, pregunta en español | 14 | 0 | 4 | 3 | 30 | 32 | 32 |
| aciertos, pregunta en inglés | 10 | 7 | 31 | 21 | 27 | 32 | 32 |

Las cadenas completas midieron entre 470 y 628 tokens (media 529) en español y entre 400 y 714 (media 498) en inglés. Con presupuestos cortos el resultado sube y baja; desde 512 no cambia. Es un solo problema con 32 intentos y un modelo pequeño: ilustra el fenómeno, no lo mide en general.

## En código

\`\`\`python
from collections import Counter
import random

correcta = 120
sin_pensar = [140, 142, 120, 120, 148, 130, 136, 120, 170, 140, 148, 120, 138, 120, 120, 120,
              138, 143, 164, 160, 141, 120, 142, 120, 148, 120, 120, 134, 120, 142, 120, 120]
corte_32 = [180] * 32                  # presupuesto de 32 tokens: los 32 intentos dijeron 180
largo = [543, 509, 517, 509, 507, 514, 495, 470, 513, 545, 521, 508, 585, 486, 608, 531,
         529, 530, 538, 545, 549, 515, 512, 532, 628, 571, 521, 504, 517, 530, 518, 515]  # tokens que pensó cada intento

def aciertos(resp):
    return sum(r == correcta for r in resp)

def votacion(resp):                    # la respuesta que más se repite y sus votos
    return Counter(resp).most_common(1)[0]

print(aciertos(sin_pensar), votacion(sin_pensar))
print(Counter(r for r in sin_pensar if r != correcta).most_common(1))   # el error más repetido
print(aciertos(corte_32), votacion(corte_32))

# ¿qué tan seguido acierta la votación si votan k intentos tomados al azar?
rng = random.Random(0)
for k in (1, 5, 15):
    bien = sum(votacion(rng.choices(sin_pensar, k=k))[0] == correcta for _ in range(10_000))
    print(k, bien / 10_000)

# tokens de pensamiento con presupuesto B (si el modelo termina antes, se detiene solo)
for B in (0, 256, 512, 4096):
    print(B, round(sum(min(l, B) for l in largo) / len(largo), 1))
# 14 (120, 14)
# [(142, 3)]
# 0 (180, 32)
# 1 0.4375
# 5 0.6854
# 15 0.9501
# 0 0.0
# 256 256.0
# 512 508.6
# 4096 528.6
\`\`\`

(En un empate, \`most_common\` se queda con la respuesta que apareció primero.)

## Costo y espera

$$\\text{costo} = T_{\\text{entrada}}\\, p_{\\text{entrada}} + \\big(T_{\\text{pensamiento}} + T_{\\text{salida}}\\big)\\, p_{\\text{salida}},\\qquad t \\approx t_{\\text{primer token}} + \\frac{T_{\\text{pensamiento}} + T_{\\text{salida}}}{\\text{tokens por segundo}}$$

Anthropic, por ejemplo, cobra los tokens de pensamiento como salida, y cobra el pensamiento completo aunque solo muestre un resumen. Votar entre $k$ multiplica por $k$ los tokens generados (en nuestra prueba, 32 intentos pensando suman 16 915 tokens en español y 15 942 en inglés). Los 100 tokens por segundo de la escena son un supuesto.

## Límites

Wei et al. revisaron 50 cadenas que terminaban en una respuesta equivocada: el 46 % estaban casi bien, salvo un error menor (una cuenta, un símbolo o un paso faltante). Chen et al. (2025) dieron a los modelos una pista escondida en la pregunta y midieron si su pensamiento la mencionaba cuando la usaban: Claude 3.7 Sonnet lo hizo en el 25 % de los casos y DeepSeek-R1 en el 39 %. El pensamiento escrito ayuda a calcular y a revisar, pero no es una explicación fiel garantizada.

## Lo que viene

Cada pregunta de esta lección fue independiente. En una conversación, todo lo anterior también ocupa la ventana del modelo (y el pensamiento, también tokens): eso es la lección 30, contexto y memoria.`,
    en: `## Chain of thought, in one formula

An autoregressive model generates each token conditioned on everything before it: $y_t \\sim p_\\theta(\\cdot \\mid x, y_{<t})$. If it answers directly, the answer $a$ comes from $p_\\theta(a \\mid x)$ in a few passes. With a chain of thought, it first writes $c = (c_1, \\dots, c_m)$ and then answers conditioned on it:

$$p_\\theta(a \\mid x) = \\sum_{c} p_\\theta(c \\mid x)\\, p_\\theta(a \\mid x, c)$$

Each token of $c$ costs a full pass, about $2N$ operations for an $N$-parameter model (lessons 24 and 26): with $N = 4\\cdot 10^9$ and $m \\approx 500$ that is about $4\\cdot10^{12}$ more operations, and $m$ more decode turns. Wei et al. (2022) put it this way: the chain lets a problem be decomposed into steps, so that “additional computation can be allocated to problems that require more reasoning steps.”

With 8 worked examples in the prompt, on GSM8K (grade-school math problems): PaLM 540B went from 17.9 to 56.9%, PaLM 62B from 9.6 to 29.9%, and PaLM 8B dropped from 4.9 to 4.1% (Wei et al., table 2). The authors observed that smaller models produced “fluent but illogical” chains. Kojima et al. (2022) showed that adding “Let's think step by step” is enough: with text-davinci-002, GSM8K rose from 10.4 to 40.7%. In the scene, the 3 and 51 tokens were counted with the Qwen3.5 tokenizer, which splits every digit into its own token.

## Verifiable rewards

In lesson 28, RLHF maximizes a reward model’s points $r_\\phi$ without drifting too far from the starting model:

$$\\max_\\theta\\ \\mathbb{E}_{x,\\ y \\sim \\pi_\\theta(\\cdot\\mid x)}\\big[r(x,y)\\big] - \\beta\\, \\mathrm{KL}\\big(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}}\\big)$$

Reinforcement learning with verifiable rewards (RLVR, a name from Lambert et al., 2024) uses the same objective but swaps the judge for a function that checks: $r(x,y) = \\alpha\\cdot\\mathbb{1}[\\,\\text{verify}(x,y)\\,]$, for example “the final answer matches the correct one” or “the code passes the tests.” DeepSeek-R1-Zero (DeepSeek-AI, 2025) samples 16 answers per question and compares each reward with the group’s (GRPO): $A_i = (r_i - \\text{mean}(r))/\\text{std}(r)$. Its reward is accuracy + format; they avoided neural reward models because they are “susceptible to reward hacking.” On AIME 2024 its accuracy rose from 15.6 to 77.9% (one sample) and to 86.7% voting among 16. The average length of its responses grew during training, and the “aha moment” appeared (“Wait, wait. Wait.”). OpenAI describes o1 (2024) as “trained with large-scale reinforcement learning to reason using chain of thought”; it did not publish its recipe.

## Self-consistency

With $k$ sampled answers $a_1, \\dots, a_k$, pick the most repeated one:

$$\\hat a = \\arg\\max_{a} \\sum_{i=1}^{k} \\mathbb{1}[a_i = a]$$

Wang et al. (2023) voted among 40 chains: PaLM 540B went from 56.5 to 74.4% on GSM8K (their measurement of the single chain is 56.5%; Wei et al.’s, 56.9%). OpenAI reported that o1 solved 74% of AIME 2024 with one sample and 83% with consensus among 64 (GPT-4o: 12%). Voting helps when errors scatter; if the model is always wrong the same way, the vote confirms the error.

## Our measurement

Qwen3.5-4B (Qwen, 2026; Apache-2.0), quantized to fp8 and run with vLLM on an RTX 3060. For each language, 32 complete chains of thought (up to 4,096 tokens) at temperature 0.7, top-p 0.95, and top-k 20. Forced budget, like the budget forcing of Muennighoff et al. (2025): if the chain finished on its own in $L \\le B$ tokens, its answer is used; if not, it is cut at $B$ tokens, the thinking is closed with a fixed phrase, and the answer is requested. $B = 0$ is the model’s no-thinking mode. Checking the answer (is it 120?) is the same rule a verifiable reward would use.

| budget (tokens) | 0 | 32 | 64 | 128 | 256 | 512 | 1,024 – 4,096 |
|---|---|---|---|---|---|---|---|
| right, question in Spanish | 14 | 0 | 4 | 3 | 30 | 32 | 32 |
| right, question in English | 10 | 7 | 31 | 21 | 27 | 32 | 32 |

Complete chains ran between 470 and 628 tokens (mean 529) in Spanish and between 400 and 714 (mean 498) in English. With short budgets the result goes up and down; from 512 on it does not change. It is a single problem with 32 tries and a small model: it illustrates the phenomenon, it does not measure it in general.

## In code

\`\`\`python
from collections import Counter
import random

correct = 120
no_thinking = [125, 165, 200, 125, 120, 150, 170, 120, 170, 120, 174, 125, 120, 123, 166, 145,
               135, 143, 164, 160, 181, 120, 202, 120, 143, 145, 120, 135, 120, 182, 120, 120]
cut_at_32 = [120, 125, 120, 125, 125, 125, 125, 120, 120, 125, 120, 125, 125, 125, 125, 125,
             125, 125, 125, 125, 125, 125, 120, 125, 120, 125, 125, 125, 125, 125, 125, 125]
length = [566, 532, 560, 477, 609, 486, 562, 531, 714, 567, 560, 417, 490, 475, 494, 401,
          493, 525, 501, 479, 457, 401, 473, 400, 468, 460, 484, 485, 474, 474, 466, 461]  # tokens each try thought

def hits(answers):
    return sum(a == correct for a in answers)

def vote(answers):                     # the most repeated answer and its votes
    return Counter(answers).most_common(1)[0]

print(hits(no_thinking), vote(no_thinking))
print(Counter(a for a in no_thinking if a != correct).most_common(1))   # the most repeated error
print(hits(cut_at_32), vote(cut_at_32))

# how often is the vote right if k tries, picked at random, vote?
rng = random.Random(0)
for k in (1, 5, 15):
    right = sum(vote(rng.choices(no_thinking, k=k))[0] == correct for _ in range(10_000))
    print(k, right / 10_000)

# thinking tokens with budget B (if the model finishes earlier, it stops on its own)
for B in (0, 256, 512, 4096):
    print(B, round(sum(min(l, B) for l in length) / len(length), 1))
# 10 (120, 10)
# [(125, 3)]
# 7 (125, 25)
# 1 0.3133
# 5 0.5068
# 15 0.8167
# 0 0.0
# 256 256.0
# 512 479.2
# 4096 498.2
\`\`\`

(On a tie, \`most_common\` keeps the answer that appeared first.)

## Cost and waiting

$$\\text{cost} = T_{\\text{input}}\\, p_{\\text{input}} + \\big(T_{\\text{thinking}} + T_{\\text{output}}\\big)\\, p_{\\text{output}},\\qquad t \\approx t_{\\text{first token}} + \\frac{T_{\\text{thinking}} + T_{\\text{output}}}{\\text{tokens per second}}$$

Anthropic, for example, bills thinking tokens as output, and bills the full thinking even when it shows only a summary. Voting among $k$ multiplies the generated tokens by $k$ (in our test, 32 tries with thinking add up to 16,915 tokens in Spanish and 15,942 in English). The scene’s 100 tokens per second is an assumption.

## Limits

Wei et al. reviewed 50 chains that ended in a wrong answer: 46% were almost right, except for a minor error (a calculation, a symbol, or a missing step). Chen et al. (2025) gave models a hint hidden in the question and measured whether their thinking mentioned it when they used it: Claude 3.7 Sonnet did so in 25% of cases and DeepSeek-R1 in 39%. Written thinking helps with calculating and checking, but it is not a guaranteed faithful explanation.

## What comes next

Every question in this lesson was independent. In a conversation, everything that came before also takes up the model’s window (and the thinking takes tokens too): that is lesson 30, context and memory.`,
  },

  lens: {
    es: [
      'Pensar se paga dos veces: en tokens de salida (el pensamiento completo se cobra aunque solo veas un resumen) y en espera. Pide al proveedor cuántos tokens de pensamiento consume tu tarea típica y fija un tope.',
      'Úsalo donde el error cuesta más: cálculos, contratos, código, análisis con varios pasos. Para preguntas simples, clasificar o redactar algo corto, un modelo sin pensamiento extendido suele bastar y responde antes.',
      'Votar entre varias respuestas mejora cuando los errores se dispersan, pero multiplica el costo por el número de votos y no corrige un error que el modelo comete siempre igual.',
      'No confíes en lo convincente del razonamiento: comprueba el resultado con algo externo (una cuenta, pruebas automáticas, una fuente). Donde puedas definir una regla que verifique, úsala también para evaluar.',
    ],
    en: [
      'Thinking is paid for twice: in output tokens (the full thinking is billed even if you only see a summary) and in waiting. Ask the provider how many thinking tokens your typical task uses, and set a cap.',
      'Use it where errors cost the most: calculations, contracts, code, multi-step analysis. For simple questions, classifying, or drafting something short, a model without extended thinking is usually enough and answers sooner.',
      'Voting among several answers helps when errors scatter, but it multiplies cost by the number of votes and does not fix an error the model always makes the same way.',
      'Do not trust how convincing the reasoning sounds: check the result against something external (a calculation, automated tests, a source). Wherever you can define a rule that verifies, use it for evaluation too.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué escribir los pasos intermedios puede ayudar a un modelo de lenguaje a resolver un problema de varios pasos?', en: 'Why can writing out the intermediate steps help a language model solve a multi-step problem?' },
      options: [
        { es: 'Porque al escribir los pasos el modelo cambia sus pesos y aprende el problema.', en: 'Because writing out the steps changes the model’s weights and it learns the problem.' },
        { es: 'Porque cada resultado escrito queda como contexto para el siguiente token, y cada token escrito es una pasada más de cálculo.', en: 'Because each written result stays as context for the next token, and each written token is one more pass of computation.' },
        { es: 'Porque los pasos escritos se envían a una calculadora externa.', en: 'Because the written steps are sent to an external calculator.' },
        { es: 'Porque las respuestas largas siempre son correctas.', en: 'Because long answers are always correct.' },
      ],
      answer: 1,
      why: { es: 'Los pesos no cambian al responder. Lo que cambia es el texto: el modelo es autorregresivo, así que lo que escribió lo lee el siguiente token, y cada token cuesta una pasada completa. Más pasos escritos, más cálculo antes de comprometerse con la respuesta.', en: 'The weights do not change while answering. What changes is the text: the model is autoregressive, so what it wrote is read by the next token, and every token costs a full pass. More written steps, more computation before committing to the answer.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué es una recompensa verificable?', en: 'What is a verifiable reward?' },
      options: [
        { es: 'La puntuación que da un modelo entrenado con las preferencias de personas.', en: 'The score given by a model trained on people’s preferences.' },
        { es: 'Un pago que recibe quien etiqueta los datos.', en: 'A payment made to whoever labels the data.' },
        { es: 'Una puntuación que da una regla que comprueba la respuesta, por ejemplo si el número final es el correcto o si el código pasa sus pruebas.', en: 'A score given by a rule that checks the answer, for example whether the final number is correct or whether the code passes its tests.' },
        { es: 'Los «me gusta» que dan los usuarios a cada respuesta.', en: 'The “likes” users give each answer.' },
      ],
      answer: 2,
      why: { es: 'La recompensa verificable no opina: comprueba (uno si acierta, cero si no). Por eso es difícil de engañar, a diferencia de un modelo de recompensa aprendido. A cambio, solo sirve donde existe una regla para comprobar: matemáticas, código, formatos.', en: 'A verifiable reward does not give an opinion: it checks (one if right, zero if not). That makes it hard to fool, unlike a learned reward model. In exchange, it only works where a rule to check exists: math, code, formats.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un modelo piensa unos 500 tokens por respuesta y escribe a 100 tokens por segundo. Si votas entre 8 respuestas, ¿cuántos tokens de pensamiento pagas y cuánto tarda si las genera una tras otra?', en: 'A model thinks about 500 tokens per answer and writes at 100 tokens per second. If you vote among 8 answers, how many thinking tokens do you pay for, and how long does it take if it generates them one after another?' },
      options: [
        { es: 'Unos 500 tokens y 5 segundos: votar no cuesta más.', en: 'About 500 tokens and 5 seconds: voting costs nothing extra.' },
        { es: 'Unos 4 000 tokens y unos 40 segundos.', en: 'About 4,000 tokens and about 40 seconds.' },
        { es: 'Unos 4 000 tokens y 5 segundos.', en: 'About 4,000 tokens and 5 seconds.' },
        { es: 'Unos 800 tokens y 8 segundos.', en: 'About 800 tokens and 8 seconds.' },
      ],
      answer: 1,
      why: { es: 'Cada voto es un intento completo: 8 × 500 = 4 000 tokens, cobrados como salida. Uno tras otro, a 100 tokens por segundo, son 40 segundos. En paralelo la espera baja, pero los tokens que pagas son los mismos.', en: 'Each vote is a complete try: 8 × 500 = 4,000 tokens, billed as output. One after another, at 100 tokens per second, that is 40 seconds. In parallel the wait drops, but the tokens you pay for are the same.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu equipo quiere activar el pensamiento extendido en todas las consultas de un asistente interno: saludos, búsquedas rápidas y, de vez en cuando, el cálculo de una cotización. ¿Qué recomiendas?', en: 'Your team wants to turn on extended thinking for every query to an internal assistant: greetings, quick lookups and, now and then, calculating a quote. What do you recommend?' },
      options: [
        { es: 'Activarlo en todo: pensar más nunca empeora la respuesta.', en: 'Turn it on everywhere: thinking longer never makes the answer worse.' },
        { es: 'No usarlo nunca: los modelos de razonamiento son más lentos.', en: 'Never use it: reasoning models are slower.' },
        { es: 'Activarlo solo en las cotizaciones, con un tope de tokens, y comprobar el resultado con una regla (la suma de las partidas), no con lo convincente del razonamiento.', en: 'Turn it on only for quotes, with a token cap, and check the result with a rule (the sum of the line items), not with how convincing the reasoning sounds.' },
        { es: 'Activarlo en todo y votar entre 32 respuestas para estar seguros.', en: 'Turn it on everywhere and vote among 32 answers to be sure.' },
      ],
      answer: 2,
      why: { es: 'El pensamiento se paga en tokens de salida y en espera: conviene donde el error cuesta, como una cotización, y sobra en un saludo. Un tope limita el gasto, y una regla que verifica atrapa los razonamientos que suenan bien pero están mal. Votar entre 32 multiplica el costo por 32 y no corrige errores que se repiten.', en: 'Thinking is paid for in output tokens and in waiting: it pays off where errors are costly, like a quote, and is wasted on a greeting. A cap limits spending, and a rule that verifies catches reasoning that sounds right but is wrong. Voting among 32 multiplies the cost by 32 and does not fix errors that repeat.' },
    },
  ],

  glossary: [
    'language-model', 'token', 'autoregression', 'sampling', 'temperature', 'parameter', 'inference', 'compute', 'decode',
    'reward-model', 'rlhf', 'alignment',
    'chain-of-thought', 'reasoning-model', 'test-time-compute', 'verifiable-reward',
  ],

  terms: [
    { id: 'chain-of-thought', term: { es: 'Cadena de pensamiento (chain of thought)', en: 'Chain of thought' }, def: { es: 'Los pasos intermedios que un modelo escribe antes de su respuesta final. Cada paso escrito queda como contexto para los siguientes tokens y añade cálculo; puede pedirse en la indicación o salir de un modelo entrenado para razonar.', en: 'The intermediate steps a model writes before its final answer. Each written step stays as context for the following tokens and adds computation; it can be requested in the prompt or come from a model trained to reason.' } },
    { id: 'reasoning-model', term: { es: 'Modelo de razonamiento', en: 'Reasoning model' }, def: { es: 'Modelo de lenguaje entrenado (sobre todo con aprendizaje por refuerzo) para escribir por su cuenta un pensamiento, a veces de miles de tokens, antes de responder. Ejemplos: o1 de OpenAI (2024) y DeepSeek-R1 (2025).', en: 'A language model trained (mainly with reinforcement learning) to write out its own thinking, sometimes thousands of tokens long, before answering. Examples: OpenAI’s o1 (2024) and DeepSeek-R1 (2025).' } },
    { id: 'test-time-compute', term: { es: 'Cómputo en tiempo de prueba (test-time compute)', en: 'Test-time compute' }, def: { es: 'Cálculo que se gasta al responder, no al entrenar: pensar más tokens, generar varias respuestas y votar, o revisarlas. Mejora la respuesta sin cambiar los pesos, a cambio de más costo y espera.', en: 'Computation spent while answering rather than while training: thinking for more tokens, generating several answers and voting, or checking them. It improves the answer without changing the weights, at the cost of more money and waiting.' } },
    { id: 'verifiable-reward', term: { es: 'Recompensa verificable', en: 'Verifiable reward' }, def: { es: 'Recompensa que da una regla que comprueba la respuesta (¿coincide con la correcta?, ¿pasa las pruebas?) en vez de un juez aprendido. Base del aprendizaje por refuerzo con recompensas verificables (RLVR) con el que se entrenan modelos de razonamiento.', en: 'A reward given by a rule that checks the answer (does it match the correct one? does it pass the tests?) instead of a learned judge. The basis of reinforcement learning with verifiable rewards (RLVR), used to train reasoning models.' } },
  ],

  sources: [
    { title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (NeurIPS 2022; tabla 2: GSM8K con PaLM 8B, 62B y 540B)', authors: 'Wei, J., Wang, X., Schuurmans, D., Bosma, M., Ichter, B., Xia, F., Chi, E., Le, Q., Zhou, D.', year: 2022, url: 'https://arxiv.org/abs/2201.11903' },
    { title: 'Large Language Models are Zero-Shot Reasoners («Let’s think step by step»)', authors: 'Kojima, T., Gu, S. S., Reid, M., Matsuo, Y., Iwasawa, Y.', year: 2022, url: 'https://arxiv.org/abs/2205.11916' },
    { title: 'Self-Consistency Improves Chain of Thought Reasoning in Language Models (ICLR 2023)', authors: 'Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E., Narang, S., Chowdhery, A., Zhou, D.', year: 2023, url: 'https://arxiv.org/abs/2203.11171' },
    { title: 'Learning to Reason with LLMs (presentación de o1, 12 de septiembre de 2024; AIME 2024: 12 %, 74 % y 83 % con consenso de 64)', authors: 'OpenAI', year: 2024, url: 'https://openai.com/index/learning-to-reason-with-llms/' },
    { title: 'OpenAI o1 System Card', authors: 'OpenAI', year: 2024, url: 'https://arxiv.org/abs/2412.16720' },
    { title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (v2; publicado en Nature 645, 633–638, 2025)', authors: 'DeepSeek-AI (Guo, D., et al.)', year: 2025, url: 'https://arxiv.org/abs/2501.12948' },
    { title: 'Tülu 3: Pushing Frontiers in Open Language Model Post-Training (§6: Reinforcement Learning with Verifiable Rewards)', authors: 'Lambert, N., Morrison, J., Pyatkin, V., Huang, S., Ivison, H., Brahman, F., et al.', year: 2024, url: 'https://arxiv.org/abs/2411.15124' },
    { title: 's1: Simple test-time scaling (budget forcing)', authors: 'Muennighoff, N., Yang, Z., Shi, W., Li, X. L., Fei-Fei, L., Hajishirzi, H., Zettlemoyer, L., Liang, P., Candès, E., Hashimoto, T.', year: 2025, url: 'https://arxiv.org/abs/2501.19393' },
    { title: 'Reasoning Models Don’t Always Say What They Think', authors: 'Chen, Y., Benton, J., Radhakrishnan, A., Uesato, J., Denison, C., Schulman, J., et al. (Anthropic)', year: 2025, url: 'https://arxiv.org/abs/2505.05410' },
    { title: 'Qwen3.5-4B (ficha del modelo: 4 mil millones de parámetros, modo de pensamiento activable, licencia Apache-2.0)', authors: 'Qwen Team, Alibaba', year: 2026, url: 'https://huggingface.co/Qwen/Qwen3.5-4B' },
    { title: 'Steering thinking: pricing (los tokens de pensamiento se cobran como salida; se cobra el pensamiento completo, no el resumen; consultada el 12 de octubre de 2026)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/thinking-steering-and-cost' },
  ],
});
