import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «GPT-4», «MMLU»
// o «red teaming», y la voz dice «ge pe te cuatro», «eme eme ele u» o «red tíming». (Las cifras ya van con letras;
// «LLM» lo cubre el léxico general.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/GPT-3/g, 'ge pe te tres'], [/GPT-4/g, 'ge pe te cuatro'], [/\bMMLU\b/g, 'eme eme ele u'], [/red teaming/g, 'red tíming'],
    [/Goodhart/g, 'Gud jart'],
  ],
  en: [
    [/GPT-3/g, 'G P T three'], [/GPT-4/g, 'G P T four'], [/\bMMLU\b/g, 'M M L U'],
  ],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'evaluar',

  objectives: {
    es: [
      'Explicar qué es un benchmark y por qué su nota puede engañar: saturación y contaminación.',
      'Armar un conjunto de evaluación con casos propios y elegir cómo calificarlo: con un programa, con una rúbrica, con un LLM como juez o con personas.',
      'Interpretar el margen de una nota (su intervalo de confianza) y predecir cómo cambia con el número de casos al comparar dos sistemas.',
    ],
    en: [
      'Explain what a benchmark is and why its score can mislead: saturation and contamination.',
      'Build an evaluation set from your own cases and choose how to grade it: with a program, a rubric, an LLM as judge, or people.',
      'Interpret the margin of a score (its confidence interval) and predict how it changes with the number of cases when comparing two systems.',
    ],
  },

  segments: ([
    // ── 1 · la pregunta ──
    {
      id: 'hook',
      es: 'Un proveedor te enseña que su modelo sacó la nota más alta en un examen público famoso. Suena bien. Pero la pregunta que importa es otra: ¿sirve para tu caso?',
      en: 'A vendor shows you that its model got the top score on a famous public exam. Sounds good. But the question that matters is a different one: does it work for your case?',
    },
    {
      id: 'recall',
      es: 'En la lección anterior viste que un modelo puede inventar con toda seguridad. ¿Cuánto falla con tus preguntas? Eso no se adivina ni se cree: se mide.',
      en: 'In the last lesson you saw that a model can make things up with total confidence. How often does it fail on your questions? You don’t guess that or take it on faith: you measure it.',
      pad: 0.3,
    },
    // ── 2 · los benchmarks ──
    {
      id: 'bench',
      es: 'Empecemos por esos exámenes públicos. Se llaman benchmarks: preguntas fijas, cada una con su respuesta correcta, que se les ponen igual a todos los modelos.',
      en: 'Let’s start with those public exams. They are called benchmarks: fixed questions, each with its correct answer, given in the same way to every model.',
      note: { es: 'Benchmark: un examen público y fijo para comparar modelos.', en: 'Benchmark: a fixed public exam for comparing models.' },
    },
    {
      id: 'bench-q',
      es: 'Uno muy usado es MMLU, que ya apareció en la lección veinticuatro. Esta es una de sus preguntas: ¿cuántos números hay en la lista veinticinco, veintiséis, y así hasta cien?',
      en: 'A widely used one is MMLU, which already showed up in lesson twenty-four. Here is one of its questions: how many numbers are in the list twenty-five, twenty-six, and so on up to one hundred?',
      pad: 0.3,
    },
    {
      id: 'bench-a',
      es: 'Hay cuatro opciones, y la correcta es setenta y seis, no setenta y cinco: el veinticinco también cuenta. MMLU reúne casi dieciséis mil preguntas así, de cincuenta y siete temas.',
      en: 'There are four options, and the right one is seventy-six, not seventy-five: twenty-five counts too. MMLU gathers almost sixteen thousand questions like this, across fifty-seven subjects.',
      pad: 0.4,
    },
    {
      id: 'score',
      es: 'La nota es el porcentaje de aciertos. En esta línea va de cero, a la izquierda, a cien, a la derecha. Con cuatro opciones, contestar al azar ya da veinticinco.',
      en: 'The score is the percentage of right answers. On this line it goes from zero, on the left, to one hundred, on the right. With four options, guessing at random already gets twenty-five.',
      pad: 0.3,
    },
    {
      id: 'gpt3',
      es: 'En dos mil veinte, el modelo GPT-3 acertó el cuarenta y tres punto nueve por ciento: bastante más que el azar, pero lejos de un experto.',
      en: 'In twenty twenty, the GPT-3 model got forty-three point nine percent right: well above chance, but far from an expert.',
      pad: 0.3,
    },
    {
      id: 'gpt4',
      es: 'Tres años después, GPT-4 llegó al ochenta y seis punto cuatro. El nivel de un experto humano se estima en ochenta y nueve punto ocho.',
      en: 'Three years later, GPT-4 reached eighty-six point four. The level of a human expert is estimated at eighty-nine point eight.',
      pad: 0.3,
    },
    {
      id: 'saturation',
      es: 'Hoy los mejores modelos pasan del noventa por ciento. Cuando todos rozan el techo, un punto más o menos ya no distingue a nadie: se dice que el examen está saturado.',
      en: 'Today the best models score above ninety percent. When they all brush the ceiling, a point more or less no longer tells anyone apart: the exam is said to be saturated.',
      pad: 0.4,
    },
    // ── 3 · contaminación ──
    {
      id: 'contam',
      es: 'Hay un problema más serio. Como viste en la lección veintitrés, los modelos se entrenan con enormes cantidades de texto de internet. Y los exámenes públicos también están en internet.',
      en: 'There is a more serious problem. As you saw in lesson twenty-three, models are trained on huge amounts of text from the internet. And public exams are on the internet too.',
      pad: 0.3,
    },
    {
      id: 'contam-name',
      es: 'Si las preguntas del examen se colaron en el entrenamiento, el modelo pudo memorizarlas. Eso se llama contaminación: la fuga de datos de la lección diez, a escala de internet.',
      en: 'If the exam questions slipped into the training data, the model may have memorized them. That is called contamination: the data leakage from lesson ten, at internet scale.',
      note: { es: 'Contaminación: el examen estaba en los datos de entrenamiento.', en: 'Contamination: the exam was in the training data.' },
      pad: 0.3,
    },
    {
      id: 'contam-demo',
      es: 'Mira dos modelos. B resuelve de verdad setenta y seis de cada cien preguntas; A, solo setenta. Pero A ya vio una parte del examen, y lo que vio lo recuerda.',
      en: 'Look at two models. B truly solves seventy-six questions out of a hundred; A, only seventy. But A has already seen part of the exam, and what it saw, it remembers.',
      pad: 0.3,
    },
    {
      id: 'contam-more',
      es: 'Mientras más vio, más sube su nota, aunque no sepa más. Con una quinta parte del examen vista, A empata con B; con más, lo rebasa y queda primero en la tabla.',
      en: 'The more it saw, the higher its score, even though it knows no more. With a fifth of the exam seen, A ties with B; with more, it passes B and comes first in the table.',
      pad: 0.6,
    },
    {
      id: 'try-contam',
      es: 'Si quieres, mueve tú la parte del examen que vio A, y mira cómo cambia su nota sin que aprenda nada nuevo.',
      en: 'If you like, move the share of the exam that A saw yourself, and watch its score change without it learning anything new.',
      gate: { id: 'contam', prompt: { es: 'mueve la parte del examen que vio A.', en: 'move the share of the exam that A saw.' } },
      pad: 0.4,
    },
    {
      id: 'gsm1k',
      es: 'Y pasa de verdad. Un equipo preparó mil doscientos cinco problemas nuevos, del estilo de un examen de matemáticas famoso. Algunos modelos acertaron hasta ocho puntos menos; los mejores, casi igual.',
      en: 'And it really happens. A team put together one thousand two hundred five new problems, in the style of a famous math exam. Some models scored up to eight points lower; the best ones, about the same.',
      pad: 0.4,
    },
    {
      id: 'goodhart',
      es: 'Detrás está la ley de Goodhart, de la lección veintiocho: si una medida se vuelve la meta, deja de medir bien. Si todos compiten por un examen, el examen deja de decir quién es mejor.',
      en: 'Behind it is Goodhart’s law, from lesson twenty-eight: when a measure becomes the target, it stops measuring well. If everyone competes for one exam, the exam stops telling you who is better.',
      pad: 0.4,
    },
    // ── 4 · tus propios casos ──
    {
      id: 'gold',
      es: 'La salida es medir con tus propios casos: preguntas reales de tu trabajo, cada una con la respuesta que tus expertos aceptan. Se les llama casos de oro.',
      en: 'The way out is to measure with your own cases: real questions from your work, each with the answer your experts accept. They are called gold cases.',
      pad: 0.3,
    },
    {
      id: 'gold-ex',
      es: 'Imagina una mesa de ayuda sobre viáticos. Un caso de oro: «¿Me reembolsan un taxi al aeropuerto?». La respuesta aceptada: sí, con comprobante.',
      en: 'Picture a help desk for travel expenses. A gold case: “Will I be reimbursed for a taxi to the airport?” The accepted answer: yes, with a receipt.',
      pad: 0.3,
    },
    {
      id: 'eval-set',
      es: 'Juntos forman tu conjunto de evaluación. Como el conjunto de prueba de la lección diez, el sistema no debe haberlo visto: no se lo entregues antes al proveedor.',
      en: 'Together they form your evaluation set. Like the test set from lesson ten, the system must not have seen it: don’t hand it to the vendor beforehand.',
      note: { es: 'Conjunto de evaluación: tus casos reales, con la respuesta aceptada.', en: 'Eval set: your real cases, with the accepted answer.' },
      pad: 0.3,
    },
    {
      id: 'mix',
      es: 'Importa qué casos eliges. Además de las preguntas frecuentes, incluye casos con excepciones, casos de riesgo y peticiones que el sistema debería rechazar.',
      en: 'Which cases you choose matters. Besides frequent questions, include cases with exceptions, high-risk cases, and requests the system should refuse.',
      pad: 0.4,
    },
    {
      id: 'slices',
      es: 'Y califica cada grupo por separado. En este ejemplo, las preguntas frecuentes salen bien noventa y seis de cada cien veces; las de riesgo, solo cincuenta y cuatro.',
      en: 'And grade each group separately. In this example, frequent questions come out right ninety-six times out of a hundred; high-risk ones, only fifty-four.',
      pad: 0.4,
    },
    {
      id: 'avg',
      es: 'Pero el promedio, con la mezcla real de preguntas, da ochenta y siete por ciento: se ve bien y esconde justo dónde falla. Por eso se reporta por grupo.',
      en: 'But the average, with the real mix of questions, comes to eighty-seven percent: it looks good and hides exactly where it fails. That is why you report by group.',
      pad: 0.4,
    },
    // ── 5 · quién califica ──
    {
      id: 'grade',
      es: 'Ahora, ¿quién califica? Si la respuesta es cerrada, como un monto, una fecha o un sí, basta compararla con la aceptada. Eso lo hace un programa.',
      en: 'Now, who does the grading? If the answer is closed, like an amount, a date, or a yes, it is enough to compare it with the accepted one. A program does that.',
      pad: 0.3,
    },
    {
      id: 'rubric',
      es: 'Pero una explicación o un resumen no tienen una sola respuesta correcta. Se califican con una rúbrica: la lista de lo que debe tener una buena respuesta.',
      en: 'But an explanation or a summary has no single right answer. It is graded with a rubric: the list of what a good answer must contain.',
      pad: 0.4,
    },
    {
      id: 'judge',
      es: 'Revisar miles a mano es caro. Por eso se usa otro modelo de lenguaje como juez; se le llama LLM como juez. Lee la rúbrica y la respuesta, y pone la calificación.',
      en: 'Checking thousands by hand is expensive. So another language model is used as a judge, which is called LLM-as-a-judge. It reads the rubric and the answer, and gives the grade.',
      note: { es: 'LLM como juez: otro modelo califica con una rúbrica.', en: 'LLM-as-a-judge: another model grades with a rubric.' },
      pad: 0.4,
    },
    {
      id: 'judge-agree',
      es: 'Funciona bastante bien. En un estudio de dos mil veintitrés, GPT-4 como juez coincidió con expertos humanos ochenta y cinco de cada cien veces; dos expertos entre sí, ochenta y una.',
      en: 'It works fairly well. In a twenty twenty-three study, GPT-4 as a judge agreed with human experts eighty-five times out of a hundred; two experts with each other, eighty-one.',
      pad: 0.4,
    },
    {
      id: 'position',
      es: 'Pero el juez tiene sesgos. Dale dos respuestas casi iguales y luego las mismas en orden inverso: a veces cambia de ganadora solo porque cambió el orden.',
      en: 'But the judge has biases. Give it two nearly identical answers, then the same two in reverse order: sometimes it switches winners just because the order changed.',
      pad: 0.5,
    },
    {
      id: 'position-num',
      es: 'En ese estudio, GPT-4 mantuvo su veredicto solo sesenta y cinco de cada cien veces. La defensa: calificar en los dos órdenes; si no coincide, es empate.',
      en: 'In that study, GPT-4 kept its verdict only sixty-five times out of a hundred. The defense: grade in both orders; if they disagree, it is a tie.',
      pad: 0.4,
    },
    {
      id: 'human',
      es: 'Por eso las personas siguen siendo la referencia. Califica a mano una muestra, por ejemplo cien casos, y mide cuántas veces coincide el juez con ellas.',
      en: 'That is why people are still the reference. Grade a sample by hand, say a hundred cases, and measure how often the judge agrees with them.',
      pad: 0.4,
    },
    // ── 6 · cuánto confiar en el número ──
    {
      id: 'one-eval',
      es: 'Ahora, el número que sale. Tu sistema contesta cien casos de oro y acierta setenta y ocho. Su exactitud medida es setenta y ocho por ciento.',
      en: 'Now, the number that comes out. Your system answers a hundred gold cases and gets seventy-eight right. Its measured accuracy is seventy-eight percent.',
      tts: { es: 'Ahora, el número que sale. Tu sistema contesta cien casos de oro, y acierta setenta y ocho de ellos. Su exactitud medida es, entonces, setenta y ocho por ciento.' },
      pad: 0.4,
    },
    {
      id: 'axis',
      es: 'Pongámoslo en una línea de exactitud, de sesenta por ciento a la izquierda a cien a la derecha. Este punto es tu resultado: setenta y ocho.',
      en: 'Let’s put it on an accuracy line, from sixty percent on the left to a hundred on the right. This dot is your result: seventy-eight.',
      pad: 0.3,
    },
    {
      id: 'again',
      es: 'Pero esos cien casos son una muestra. Con otros cien casos del mismo tipo, la nota cambia: setenta y cinco, ochenta, setenta y siete.',
      en: 'But those hundred cases are a sample. With another hundred cases of the same kind, the score changes: seventy-five, eighty, seventy-seven.',
      pad: 0.5,
    },
    {
      id: 'many',
      es: 'Repite la prueba cien veces y los resultados forman una montaña alrededor de la exactitud real, la que saldría con todos los casos posibles. En esta simulación, setenta y ocho.',
      en: 'Repeat the test a hundred times and the results form a hill around the true accuracy, the one you would get with every possible case. In this simulation, seventy-eight.',
      pad: 0.5,
    },
    {
      id: 'ci',
      es: 'Noventa y cinco de los cien resultados caen a ocho puntos o menos de la real. Por eso a tu nota se le pone un margen: setenta y ocho, más o menos ocho.',
      en: 'Ninety-five of the hundred results land within eight points of the true value. That is why your score gets a margin: seventy-eight, plus or minus eight.',
      pad: 0.4,
    },
    {
      id: 'ci-name',
      es: 'Ese rango, de setenta a ochenta y seis, se llama intervalo de confianza. Dice entre qué valores está, razonablemente, la exactitud real.',
      en: 'That range, from seventy to eighty-six, is called a confidence interval. It tells you between which values the true accuracy reasonably lies.',
      note: { es: 'Intervalo de confianza: toda nota lleva un margen.', en: 'Confidence interval: every score comes with a margin.' },
      pad: 0.4,
    },
    {
      id: 'ci-400',
      es: 'Con más casos, la montaña se angosta. Con cuatrocientos, el margen baja a unos cuatro puntos: cuatro veces más casos dan la mitad de margen.',
      en: 'With more cases, the hill narrows. With four hundred, the margin drops to about four points: four times as many cases give half the margin.',
      pad: 0.6,
    },
    {
      id: 'two',
      es: 'Ahora compara dos sistemas. Supón que, en realidad, A acierta el setenta y ocho por ciento y B el setenta y cuatro. A es mejor, por cuatro puntos.',
      en: 'Now compare two systems. Suppose that, in reality, A gets seventy-eight percent right and B seventy-four. A is better, by four points.',
      pad: 0.3,
    },
    {
      id: 'two-100',
      es: 'Califica a los dos con los mismos cien casos. Cada nota lleva unos ocho puntos de margen: el doble de la diferencia que buscas. Sus intervalos se enciman.',
      en: 'Grade both on the same hundred cases. Each score carries about eight points of margin: twice the difference you are looking for. Their intervals overlap.',
      pad: 0.4,
    },
    {
      id: 'wrong',
      es: 'Repite esa comparación cien veces, con casos nuevos cada vez. En setenta y ocho gana A. En las otras veintidós, B empata o gana: ahí elegirías mal.',
      en: 'Repeat that comparison a hundred times, with new cases each time. A wins in seventy-eight. In the other twenty-two, B ties or wins: there you would choose wrong.',
      pad: 0.5,
    },
    {
      id: 'demo-n',
      es: 'Mira qué pasa al subir los casos. Con doscientos, A gana ochenta y ocho veces de cien; con cuatrocientos, noventa y seis; con mil, las cien.',
      en: 'Watch what happens as the cases go up. With two hundred, A wins eighty-eight times out of a hundred; with four hundred, ninety-six; with a thousand, all hundred.',
      pad: 0.8,
    },
    {
      id: 'try-n',
      es: 'Si quieres, mueve tú el número de casos y mira cuántas de las cien comparaciones eligen al sistema correcto.',
      en: 'If you like, move the number of cases yourself and see how many of the hundred comparisons pick the right system.',
      gate: { id: 'samplesize', prompt: { es: 'mueve los casos y mira cuántas comparaciones aciertan.', en: 'move the cases and see how many comparisons get it right.' } },
      pad: 0.4,
    },
    {
      id: 'tie',
      es: 'De ahí sale una regla práctica: si dos notas difieren menos que su margen, trátalas como empate. Entonces decide por costo, rapidez o riesgo.',
      en: 'That gives a practical rule: if two scores differ by less than their margin, treat them as a tie. Then decide on cost, speed, or risk.',
      note: { es: 'Si la diferencia es menor que el margen, es un empate.', en: 'If the difference is smaller than the margin, it is a tie.' },
      pad: 0.4,
    },
    {
      id: 'paired',
      es: 'Y usa los mismos casos para los dos, como aquí: lo difícil para ambos se cancela. Con cuatrocientos casos distintos para cada uno, A ganaría solo unas noventa veces de cien.',
      en: 'And use the same cases for both, as here: what is hard for both cancels out. With four hundred different cases for each, A would win only about ninety times in a hundred.',
      pad: 0.5,
    },
    // ── 7 · evaluar siempre ──
    {
      id: 'drift',
      es: 'Además, una nota caduca. Un estudio midió a GPT-4 en marzo y en junio de dos mil veintitrés: al decir si un número es primo, bajó del ochenta y cuatro al cincuenta y uno por ciento.',
      en: 'Besides, a score expires. A study measured GPT-4 in March and in June twenty twenty-three: at telling whether a number is prime, it fell from eighty-four to fifty-one percent.',
      pad: 0.4,
    },
    {
      id: 'regress',
      es: 'Por eso tu conjunto de oro se vuelve a correr en cada cambio, de modelo, de instrucciones o de datos, y se compara con la vez anterior. Se llama prueba de regresión.',
      en: 'That is why your gold set is run again after every change, of model, instructions, or data, and compared with the previous run. It is called a regression test.',
      note: { es: 'Prueba de regresión: repetir tu evaluación en cada cambio.', en: 'Regression test: rerun your evaluation after every change.' },
      pad: 0.5,
    },
    {
      id: 'redteam',
      es: 'Las evaluaciones miden el uso normal. Las pruebas adversarias, en inglés red teaming, buscan el peor caso: personas que atacan el sistema a propósito para hacerlo fallar.',
      en: 'Evaluations measure normal use. Adversarial testing, known as red teaming, looks for the worst case: people who attack the system on purpose to make it fail.',
      note: { es: 'Red teaming: atacar el sistema a propósito para hallar el peor caso.', en: 'Red teaming: attacking the system on purpose to find the worst case.' },
      pad: 0.4,
    },
    {
      id: 'redteam-case',
      es: 'Un equipo de Anthropic publicó casi treinta y nueve mil ataques así en dos mil veintidós. Cada falla que encuentres se vuelve un caso nuevo de tu conjunto de oro.',
      en: 'A team at Anthropic published almost thirty-nine thousand such attacks in twenty twenty-two. Every failure you find becomes a new case in your gold set.',
      pad: 0.5,
    },
    {
      id: 'business',
      es: 'Por último, la nota no es el resultado de negocio. Mide también el costo por caso resuelto, el tiempo ahorrado y las quejas, en un piloto con usuarios reales.',
      en: 'Finally, the score is not the business result. Also measure cost per resolved case, time saved, and complaints, in a pilot with real users.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: casos tuyos que nadie haya visto, calificación con rúbrica y revisión humana, un margen en cada nota, y repetir la prueba en cada cambio.',
      en: 'In short: your own cases that no one has seen, grading with a rubric and human review, a margin on every score, and rerunning the test after every change.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Pero aun con buena calidad medida, un sistema puede fallar de otras formas: filtrar datos, dejarse manipular, discriminar. Eso es riesgo, y es el siguiente tema.',
      en: 'But even with good measured quality, a system can fail in other ways: leaking data, being manipulated, discriminating. That is risk, and it is the next topic.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Un benchmark es un examen público y fijo. Sirve para comparar modelos en general, pero se satura y puede estar contaminado: su nota no dice si el sistema sirve para tu caso.',
      'Tu conjunto de evaluación son casos reales de tu trabajo, con la respuesta que aceptan tus expertos, que el sistema no haya visto. Incluye lo frecuente, lo excepcional, lo riesgoso y lo que debe rechazarse, y reporta por grupo: el promedio esconde dónde falla.',
      'Las respuestas cerradas las califica un programa; las abiertas, una rúbrica aplicada por personas o por un LLM como juez. El juez escala, pero tiene sesgos (por ejemplo, el orden de las respuestas): califica en los dos órdenes y contrástalo con personas.',
      'Toda nota lleva un margen, su intervalo de confianza: con cien casos, unos ocho puntos; cuatro veces más casos dan la mitad. Si dos sistemas difieren menos que el margen, es un empate. Compáralos con los mismos casos.',
      'Evaluar es una rutina: prueba de regresión en cada cambio, red teaming para buscar el peor caso y métricas de negocio medidas en un piloto.',
    ],
    en: [
      'A benchmark is a fixed public exam. It is useful for comparing models in general, but it saturates and can be contaminated: its score does not tell you whether the system works for your case.',
      'Your evaluation set is real cases from your work, with the answer your experts accept, that the system has not seen. Include the frequent, the exceptional, the risky, and what must be refused, and report by group: the average hides where it fails.',
      'A program grades closed answers; open ones need a rubric applied by people or by an LLM as judge. The judge scales, but it has biases (for example, the order of the answers): grade in both orders and check it against people.',
      'Every score carries a margin, its confidence interval: with a hundred cases, about eight points; four times as many cases give half. If two systems differ by less than the margin, it is a tie. Compare them on the same cases.',
      'Evaluating is a routine: a regression test after every change, red teaming to look for the worst case, and business metrics measured in a pilot.',
    ],
  },

  misconception: {
    wrong: {
      es: '«Este modelo encabeza los benchmarks públicos, así que será el mejor para mi organización».',
      en: '“This model tops the public benchmarks, so it will be the best one for my organization.”',
    },
    right: {
      es: 'Un benchmark mide un examen concreto, y su nota puede estar inflada por contaminación o ya no distinguir a nadie por saturación. Solo una evaluación con tus casos, que el sistema no haya visto y con su margen de error, dice si sirve para tu caso.',
      en: 'A benchmark measures one specific exam, and its score can be inflated by contamination or no longer tell anyone apart because of saturation. Only an evaluation on your cases, which the system has not seen and which comes with its margin of error, tells you whether it works for your case.',
    },
  },

  deeper: {
    es: `## El margen de una nota

Con $k$ aciertos en $n$ casos, la exactitud medida es $\\hat p = k/n$. Su intervalo de confianza aproximado al 95 % es

$$\\hat p \\pm 1.96\\,\\sqrt{\\frac{\\hat p\\,(1-\\hat p)}{n}}.$$

Con 78 de 100: $0.78 \\pm 1.96\\sqrt{0.78 \\cdot 0.22/100} = 0.78 \\pm 0.081$, es decir, de 70 % a 86 % (lo que usa la escena). Con 400 casos, $\\pm 0.041$. El margen depende de $1/\\sqrt n$: cuadruplicar los casos lo parte a la mitad, y en el peor caso ($\\hat p = 0.5$) vale casi exactamente $1/\\sqrt n$: 10 puntos con 100 casos, 5 con 400, 2.5 con 1 600.

La lectura correcta: si repitieras la evaluación muchas veces con casos nuevos, alrededor del 95 % de los intervalos construidos así contendría la exactitud real. Con pocos casos o con notas cerca de 0 % o de 100 % esta fórmula se queda corta; Brown, Cai y DasGupta (2001) recomiendan el intervalo de Wilson, que con 78 de 100 da de 68.9 % a 85.0 %. Bowyer, Aitchison e Ivanova (2025) muestran que, con menos de unos cientos de casos, los márgenes basados en la aproximación normal suelen salir demasiado chicos.

## Comparar dos sistemas con los mismos casos

Para cada caso $i$, sea $d_i = a_i - b_i \\in \\{-1, 0, +1\\}$ (acierto de A menos acierto de B). Si en $n_{10}$ casos acierta solo A y en $n_{01}$ solo B, la diferencia medida es $\\bar d = (n_{10}-n_{01})/n$ y su error estándar,

$$\\mathrm{EE}(\\bar d) = \\sqrt{\\frac{(n_{10}+n_{01})/n - \\bar d^{\\,2}}{n-1}}, \\qquad \\bar d \\pm 1.96\\,\\mathrm{EE}.$$

En la simulación de la lección, en cada caso ambos aciertan con probabilidad 0.66, solo A 0.12, solo B 0.08 y ninguno 0.14. La varianza de $d_i$ es $0.12 + 0.08 - 0.04^2 = 0.198$; si cada sistema se probara con casos distintos se sumarían las de cada uno, $0.78\\cdot0.22 + 0.74\\cdot0.26 = 0.364$: casi el doble. Por eso, con los mismos casos, hacen falta casi la mitad.

La probabilidad exacta de que A quede por delante (con la distribución multinomial) es 78.5 % con 100 casos, 88.4 % con 200, 95.9 % con 400 y 99.75 % con 1 000; las 100 comparaciones de la escena dan 78, 88, 96 y 100. Con casos distintos, 400 casos dan alrededor de 90 % y hacen falta unos 650 para llegar a 95 %; con los mismos casos bastan unos 360. Que A *gane* no es lo mismo que *demostrar* la diferencia: para que el intervalo de $\\bar d$ excluya el cero el 80 % de las veces hacen falta $n \\approx (1.96 + 0.84)^2 \\cdot 0.198/0.04^2 \\approx 970$ casos.

Miller (2024) resume el oficio: reportar errores estándar, comparar por pares (caso por caso), agrupar los casos que no son independientes (por ejemplo, varias preguntas sobre un mismo documento) y planificar el tamaño de la muestra antes de evaluar.

## Contaminación: la cuenta del ejemplo

Si un modelo acierta siempre lo que vio, resuelve una fracción $a$ de lo demás y vio una fracción $c$ del examen, su nota es

$$\\text{nota} = c + (1-c)\\,a.$$

Con $a = 0.70$: $c = 0.2$ da $0.2 + 0.8 \\cdot 0.7 = 0.76$, lo mismo que B, y $c = 0.4$ da $0.82$. Es un modelo simplificado: la memoria real es parcial. La contaminación se busca con coincidencias de texto entre el examen y el corpus (el informe de GPT-4 usó tres subcadenas de 50 caracteres por pregunta; así descubrió que parte de BIG-bench se había colado por accidente en el entrenamiento y estimó que una cuarta parte de HumanEval estaba en sus datos), con problemas nuevos equivalentes o midiendo cuánta probabilidad asigna el modelo a las preguntas del examen. GSM1k (Zhang et al., 2024) son 1 205 problemas escritos por personas al estilo de GSM8k: algunas familias de modelos bajaron hasta 8 puntos, con más caída cuanto más probable era que el modelo generara ejemplos de GSM8k; los modelos de frontera casi no bajaron.

## El juez automático

Zheng et al. (2023) compararon a GPT-4 como juez con expertos humanos en MT-bench: sin contar empates, coincidieron 85 % de las veces, más que los expertos entre sí (81 %). También midieron sus sesgos. **Orden**: con dos respuestas casi idénticas, el veredicto se mantuvo al invertir el orden 65.0 % de las veces con GPT-4, 46.2 % con GPT-3.5 y 23.8 % con Claude-v1. **Longitud**: al inflar 23 respuestas con una lista repetida sin información nueva, Claude-v1 y GPT-3.5 prefirieron la versión inflada en 21 de 23 (91.3 %) y GPT-4 en 2 (8.7 %). Su defensa contra el sesgo de orden: calificar dos veces, invirtiendo el orden, y declarar ganadora una respuesta solo si gana en las dos.

Para medir la coincidencia con personas sin dejarse engañar por el azar se usa la $\\kappa$ de Cohen: $\\kappa = (p_o - p_e)/(1 - p_e)$, con $p_o$ la coincidencia observada y $p_e$ la esperada por azar. La evaluación humana también se hace a gran escala: Chatbot Arena reunió más de 240 000 votos de personas que comparan respuestas a ciegas (Chiang et al., 2024), pero con preguntas que no son las tuyas.

## La nota caduca y el examen también falla

Chen, Zaharia y Zou (2023) midieron el mismo servicio en marzo y en junio de 2023 con 500 números primos y 500 compuestos: GPT-4 pasó de 84.0 % a 51.1 %, porque la versión de junio respondía «compuesto» casi siempre (99.7 %) y dejó de seguir el razonamiento paso a paso que se le pedía. Es un cambio de comportamiento más que de capacidad, pero para quien depende del servicio el efecto es el mismo, y solo se nota volviendo a medir.

Los exámenes tienen errores: Gema et al. (2024) estiman que el 6.49 % de las preguntas de MMLU tienen alguno (en virología, el 57 % de las revisadas). Y se agotan: Phan et al. (2025) construyeron un examen nuevo de 2 500 preguntas porque los mejores modelos ya pasaban del 90 % en MMLU.

## En código

\`\`\`python
import numpy as np

def margen(k, n, z=1.96):
    """Mitad del intervalo de confianza al 95 % para k aciertos de n casos."""
    p = k / n
    return z * np.sqrt(p * (1 - p) / n)

for n in (100, 400, 1600):
    print(n, round(100 * margen(0.78 * n, n), 1))
# 100 8.1
# 400 4.1
# 1600 2.0

# Dos sistemas con los mismos casos: ambos aciertan 0.66; solo A, 0.12; solo B, 0.08; ninguno, 0.14
rng = np.random.default_rng(0)
def a_por_delante(n, reps=20000):
    c = rng.multinomial(n, [0.66, 0.12, 0.08, 0.14], size=reps)   # ambos, solo A, solo B, ninguno
    return round(float(np.mean(c[:, 1] > c[:, 2])), 2)

for n in (100, 200, 400, 1000):
    print(n, a_por_delante(n))
# 100 0.78
# 200 0.88
# 400 0.96
# 1000 1.0
\`\`\`

## Lo que viene

La calidad medida es un eje; el riesgo es otro: privacidad, manipulación con instrucciones, sesgo y regulación. La lección 35 los recorre, y la 36 usa esta evaluación dentro de un piloto que escala.`,
    en: `## The margin of a score

With $k$ right answers in $n$ cases, the measured accuracy is $\\hat p = k/n$. Its approximate 95% confidence interval is

$$\\hat p \\pm 1.96\\,\\sqrt{\\frac{\\hat p\\,(1-\\hat p)}{n}}.$$

With 78 of 100: $0.78 \\pm 1.96\\sqrt{0.78 \\cdot 0.22/100} = 0.78 \\pm 0.081$, that is, from 70% to 86% (what the scene uses). With 400 cases, $\\pm 0.041$. The margin goes with $1/\\sqrt n$: quadrupling the cases halves it, and in the worst case ($\\hat p = 0.5$) it is almost exactly $1/\\sqrt n$: 10 points with 100 cases, 5 with 400, 2.5 with 1,600.

The correct reading: if you repeated the evaluation many times with fresh cases, about 95% of the intervals built this way would contain the true accuracy. With few cases, or scores near 0% or 100%, this formula falls short; Brown, Cai, and DasGupta (2001) recommend the Wilson interval, which for 78 of 100 gives 68.9% to 85.0%. Bowyer, Aitchison, and Ivanova (2025) show that with fewer than a few hundred cases, margins based on the normal approximation tend to come out too small.

## Comparing two systems on the same cases

For each case $i$, let $d_i = a_i - b_i \\in \\{-1, 0, +1\\}$ (A's hit minus B's hit). If only A is right on $n_{10}$ cases and only B on $n_{01}$, the measured difference is $\\bar d = (n_{10}-n_{01})/n$ and its standard error is

$$\\mathrm{SE}(\\bar d) = \\sqrt{\\frac{(n_{10}+n_{01})/n - \\bar d^{\\,2}}{n-1}}, \\qquad \\bar d \\pm 1.96\\,\\mathrm{SE}.$$

In the lesson's simulation, on each case both are right with probability 0.66, only A 0.12, only B 0.08, and neither 0.14. The variance of $d_i$ is $0.12 + 0.08 - 0.04^2 = 0.198$; if each system were tested on different cases, their variances would add up, $0.78\\cdot0.22 + 0.74\\cdot0.26 = 0.364$: almost double. That is why, with the same cases, you need almost half as many.

The exact probability that A comes out ahead (from the multinomial distribution) is 78.5% with 100 cases, 88.4% with 200, 95.9% with 400, and 99.75% with 1,000; the scene's 100 comparisons give 78, 88, 96, and 100. With different cases, 400 cases give about 90%, and it takes about 650 to reach 95%; with the same cases, about 360 are enough. A *winning* is not the same as *proving* the difference: for the interval of $\\bar d$ to exclude zero 80% of the time takes $n \\approx (1.96 + 0.84)^2 \\cdot 0.198/0.04^2 \\approx 970$ cases.

Miller (2024) sums up the craft: report standard errors, compare in pairs (case by case), cluster cases that are not independent (for example, several questions about the same document), and plan the sample size before evaluating.

## Contamination: the example's arithmetic

If a model always gets right what it saw, solves a fraction $a$ of the rest, and saw a fraction $c$ of the exam, its score is

$$\\text{score} = c + (1-c)\\,a.$$

With $a = 0.70$: $c = 0.2$ gives $0.2 + 0.8 \\cdot 0.7 = 0.76$, the same as B, and $c = 0.4$ gives $0.82$. It is a simplified model: real memory is partial. Contamination is searched for with text matches between the exam and the corpus (the GPT-4 report used three 50-character substrings per question; that is how it found that part of BIG-bench had slipped into training by accident, and it estimated that a quarter of HumanEval was in its data), with equivalent fresh problems, or by measuring how much probability the model assigns to the exam's questions. GSM1k (Zhang et al., 2024) is 1,205 problems written by people in the style of GSM8k: some model families dropped by up to 8 points, with bigger drops the more likely the model was to generate GSM8k examples; frontier models barely dropped.

## The automatic judge

Zheng et al. (2023) compared GPT-4 as a judge with human experts on MT-bench: not counting ties, they agreed 85% of the time, more than the experts with each other (81%). They also measured its biases. **Order**: with two nearly identical answers, the verdict held when the order was swapped 65.0% of the time with GPT-4, 46.2% with GPT-3.5, and 23.8% with Claude-v1. **Length**: when 23 answers were padded with a repeated list that added no information, Claude-v1 and GPT-3.5 preferred the padded version in 21 of 23 (91.3%), and GPT-4 in 2 (8.7%). Their defense against order bias: grade twice, swapping the order, and declare an answer the winner only if it wins both times.

To measure agreement with people without being fooled by chance, Cohen's $\\kappa$ is used: $\\kappa = (p_o - p_e)/(1 - p_e)$, where $p_o$ is the observed agreement and $p_e$ the agreement expected by chance. Human evaluation is also done at scale: Chatbot Arena gathered over 240,000 votes from people comparing answers blind (Chiang et al., 2024), but on questions that are not yours.

## Scores expire, and exams have flaws too

Chen, Zaharia, and Zou (2023) measured the same service in March and in June 2023 with 500 prime and 500 composite numbers: GPT-4 went from 84.0% to 51.1%, because the June version almost always answered “composite” (99.7%) and stopped following the step-by-step reasoning it was asked for. It is a change in behavior more than in ability, but for anyone who depends on the service the effect is the same, and you only notice by measuring again.

Exams contain errors: Gema et al. (2024) estimate that 6.49% of MMLU questions have one (57% of those reviewed in virology). And they run out: Phan et al. (2025) built a new 2,500-question exam because the best models already scored above 90% on MMLU.

## In code

\`\`\`python
import numpy as np

def margin(k, n, z=1.96):
    """Half the 95% confidence interval for k right answers out of n cases."""
    p = k / n
    return z * np.sqrt(p * (1 - p) / n)

for n in (100, 400, 1600):
    print(n, round(100 * margin(0.78 * n, n), 1))
# 100 8.1
# 400 4.1
# 1600 2.0

# Two systems on the same cases: both right 0.66; only A, 0.12; only B, 0.08; neither, 0.14
rng = np.random.default_rng(0)
def a_ahead(n, reps=20000):
    c = rng.multinomial(n, [0.66, 0.12, 0.08, 0.14], size=reps)   # both, only A, only B, neither
    return round(float(np.mean(c[:, 1] > c[:, 2])), 2)

for n in (100, 200, 400, 1000):
    print(n, a_ahead(n))
# 100 0.78
# 200 0.88
# 400 0.96
# 1000 1.0
\`\`\`

## What comes next

Measured quality is one axis; risk is another: privacy, manipulation through instructions, bias, and regulation. Lesson 35 walks through them, and lesson 36 uses this evaluation inside a pilot that scales.`,
  },

  lens: {
    es: [
      'Antes de comprar, pide la evidencia completa de cada cifra: qué examen, con qué instrucciones, qué versión del modelo, en qué fecha y cómo se descartó la contaminación. Sin eso, dos cifras no se pueden comparar.',
      'Evalúa con tus datos: unos cientos de casos reales y anonimizados, con la respuesta que aceptan tus expertos, que el proveedor no haya visto. Incluye lo frecuente, lo excepcional, lo riesgoso y lo que debe rechazarse, y pide resultados por grupo.',
      'Exige el margen de cada nota. Si dos sistemas difieren menos que el margen, trátalos como empate y decide por costo, rapidez y riesgo. Si califica un LLM como juez, pregunta cuánto coincide con personas y si se calificó en los dos órdenes.',
      'Haz de la evaluación una rutina: repítela en cada cambio de modelo, instrucciones o datos; que un equipo ataque el sistema antes del lanzamiento; y fija de antemano qué resultado de negocio justifica seguir, medido en un piloto.',
    ],
    en: [
      'Before buying, ask for the full evidence behind each figure: which exam, with what instructions, which model version, on what date, and how contamination was ruled out. Without that, two figures cannot be compared.',
      'Evaluate with your data: a few hundred real, anonymized cases, with the answer your experts accept, that the vendor has not seen. Include the frequent, the exceptional, the risky, and what must be refused, and ask for results by group.',
      'Demand the margin of every score. If two systems differ by less than the margin, treat them as a tie and decide on cost, speed, and risk. If an LLM judge does the grading, ask how often it agrees with people and whether it graded in both orders.',
      'Make evaluation a routine: rerun it after every change of model, instructions, or data; have a team attack the system before launch; and decide in advance which business result justifies going on, measured in a pilot.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué es la contaminación de un benchmark?', en: 'What is benchmark contamination?' },
      options: [
        { es: 'Que el examen tiene preguntas con la respuesta equivocada en su clave.', en: 'That the exam has questions with the wrong answer in its key.' },
        { es: 'Que las preguntas del examen estaban en los datos de entrenamiento, y la nota mide memoria más que capacidad.', en: 'That the exam’s questions were in the training data, so the score measures memory more than ability.' },
        { es: 'Que alguien alteró los resultados para subir al modelo en la tabla.', en: 'That someone altered the results to push the model up the table.' },
        { es: 'Que el modelo es demasiado grande para evaluarlo con un examen.', en: 'That the model is too large to be evaluated with an exam.' },
      ],
      answer: 1,
      why: { es: 'Es la fuga de datos de la lección diez a escala de internet: si el modelo ya vio las preguntas, puede acertarlas de memoria. Suele ser accidental, no trampa. Los errores en la clave existen, pero son otro problema.', en: 'It is the data leakage from lesson ten at internet scale: if the model already saw the questions, it can get them right from memory. It is usually accidental, not cheating. Errors in the key exist, but they are a different problem.' },
    },
    {
      kind: 'concept',
      q: { es: 'Un LLM como juez tiende a preferir la respuesta que aparece primero. ¿Qué defensa sencilla se usa?', en: 'An LLM judge tends to prefer the answer shown first. What simple defense is used?' },
      options: [
        { es: 'Usar un juez más pequeño.', en: 'Use a smaller judge.' },
        { es: 'Quitarle la rúbrica para que decida con libertad.', en: 'Take away the rubric so it can decide freely.' },
        { es: 'Calificar dos veces, invirtiendo el orden, y declarar ganadora solo a la respuesta que gana en las dos.', en: 'Grade twice, swapping the order, and declare a winner only if the same answer wins both times.' },
        { es: 'Pedirle que conteste más rápido.', en: 'Ask it to answer faster.' },
      ],
      answer: 2,
      why: { es: 'Si el veredicto cambia al invertir el orden, decidió el orden, no la calidad: se cuenta como empate. Es barato y evita que la posición elija al ganador.', en: 'If the verdict changes when the order is swapped, the order decided, not the quality: it counts as a tie. It is cheap and keeps the position from picking the winner.' },
    },
    {
      kind: 'calc',
      q: { es: 'Con cien casos, la nota de un sistema lleva un margen de unos ocho puntos. ¿Cuántos casos hacen falta, más o menos, para bajarlo a unos dos?', en: 'With a hundred cases, a system’s score carries a margin of about eight points. About how many cases does it take to bring it down to about two?' },
      options: [
        { es: '200', en: '200' },
        { es: '400', en: '400' },
        { es: '800', en: '800' },
        { es: '1 600', en: '1,600' },
      ],
      answer: 3,
      why: { es: 'Cuatro veces más casos dan la mitad de margen. De ocho a cuatro: cuatrocientos casos. De cuatro a dos: otra vez por cuatro, mil seiscientos. Es decir, dieciséis veces más casos para un margen cuatro veces menor.', en: 'Four times as many cases give half the margin. From eight to four: four hundred cases. From four to two: four times again, sixteen hundred. That is, sixteen times as many cases for a margin four times smaller.' },
    },
    {
      kind: 'apply',
      q: { es: 'Pruebas dos asistentes con los mismos 150 casos de tu operación: A acierta 81 % y B 79 %, y B cuesta la mitad. ¿Qué haces?', en: 'You test two assistants on the same 150 cases from your operation: A scores 81% and B 79%, and B costs half as much. What do you do?' },
      options: [
        { es: 'Los tratas como un empate en calidad: dos puntos es mucho menos que el margen con 150 casos. Decides por costo y riesgo, o amplías la muestra.', en: 'You treat them as a tie in quality: two points is much less than the margin with 150 cases. You decide on cost and risk, or enlarge the sample.' },
        { es: 'Eliges A: 81 es mayor que 79.', en: 'You pick A: 81 is greater than 79.' },
        { es: 'Eliges B sin más análisis, porque es más barato.', en: 'You pick B with no further analysis, because it is cheaper.' },
        { es: 'Descartas a los dos porque ninguno llega a 90 %.', en: 'You reject both because neither reaches 90%.' },
      ],
      answer: 0,
      why: { es: 'Con 150 casos, cada nota lleva un margen de unos seis puntos y la diferencia es de dos. Con estos datos no se distinguen; si la calidad empata, pesan el costo y el riesgo. Si la diferencia importa, hacen falta muchos más casos.', en: 'With 150 cases, each score carries a margin of about six points, and the difference is two. These data cannot tell them apart; if quality ties, cost and risk decide. If the difference matters, you need many more cases.' },
    },
  ],

  glossary: ['benchmark', 'contamination', 'eval-set', 'llm-as-judge', 'confidence-interval', 'red-teaming', 'hallucination', 'language-model', 'pretraining', 'training-data', 'data-leakage', 'test-set'],

  terms: [
    { id: 'benchmark', term: { es: 'Benchmark', en: 'Benchmark' }, def: { es: 'Examen público y fijo (preguntas con su respuesta correcta y una forma de calificar) que se les pone igual a todos los modelos para compararlos. Sirve como referencia general; no dice si un sistema sirve para tu caso.', en: 'A fixed public exam (questions with their correct answers and a way to grade them) given in the same way to every model to compare them. Useful as a general reference; it does not tell you whether a system works for your case.' } },
    { id: 'eval-set', term: { es: 'Conjunto de evaluación (casos de oro)', en: 'Eval set (gold cases)' }, def: { es: 'Conjunto propio de casos reales de tu trabajo, cada uno con la respuesta o el criterio que tus expertos aceptan, que el sistema no ha visto. Se usa para comparar sistemas y se vuelve a correr en cada cambio.', en: 'Your own set of real cases from your work, each with the answer or criterion your experts accept, that the system has not seen. It is used to compare systems and is rerun after every change.' } },
    { id: 'contamination', term: { es: 'Contaminación', en: 'Contamination' }, def: { es: 'Cuando las preguntas (o las respuestas) de un examen estaban en los datos con que se entrenó el modelo. Infla la nota, porque mide en parte memoria y no capacidad.', en: 'When an exam’s questions (or answers) were in the data the model was trained on. It inflates the score, because it partly measures memory rather than ability.' } },
    { id: 'llm-as-judge', term: { es: 'LLM como juez', en: 'LLM-as-a-judge' }, def: { es: 'Usar un modelo de lenguaje para calificar las respuestas de otro sistema con una rúbrica. Es barato y escala, pero tiene sesgos (el orden de las respuestas, su longitud) y debe contrastarse con calificaciones de personas.', en: 'Using a language model to grade another system’s answers against a rubric. It is cheap and scales, but it has biases (the order of the answers, their length) and must be checked against people’s grades.' } },
    { id: 'red-teaming', term: { es: 'Red teaming (pruebas adversarias)', en: 'Red teaming' }, def: { es: 'Atacar un sistema a propósito, con personas o con otros modelos, para encontrar sus fallas en el peor caso: respuestas dañinas, filtraciones, engaños. Cada falla hallada se vuelve un caso de evaluación.', en: 'Deliberately attacking a system, with people or with other models, to find its worst-case failures: harmful answers, leaks, deception. Each failure found becomes an evaluation case.' } },
    { id: 'confidence-interval', term: { es: 'Intervalo de confianza', en: 'Confidence interval' }, def: { es: 'Rango de valores razonables para una cantidad medida con una muestra, como la exactitud real de un sistema; normalmente al 95 %. Su margen baja con la raíz del número de casos: cuatro veces más casos lo parten a la mitad.', en: 'A range of reasonable values for a quantity measured on a sample, such as a system’s true accuracy; usually at 95%. Its margin shrinks with the square root of the number of cases: four times as many cases cut it in half.' } },
  ],

  sources: [
    { title: 'Measuring Massive Multitask Language Understanding (ICLR 2021): 57 temas, 15 908 preguntas, figura 1 (pregunta de ejemplo), GPT-3 43.9 %, experto ≈ 89.8 %', authors: 'Hendrycks, D., Burns, C., Basart, S., Zou, A., Mazeika, M., Song, D., Steinhardt, J.', year: 2020, url: 'https://arxiv.org/abs/2009.03300' },
    { title: 'GPT-4 Technical Report: tabla 2 (MMLU 86.4 %), nota 5 (BIG-bench) y apéndice C (contaminación)', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'Humanity’s Last Exam (más del 90 % en MMLU; examen nuevo de 2 500 preguntas)', authors: 'Phan, L., Gatti, A., Han, Z., et al.', year: 2025, url: 'https://arxiv.org/abs/2501.14249' },
    { title: 'A Careful Examination of Large Language Model Performance on Grade School Arithmetic (GSM1k, NeurIPS 2024)', authors: 'Zhang, H., Da, J., Lee, D., et al.', year: 2024, url: 'https://arxiv.org/abs/2405.00332' },
    { title: '«Improving ratings»: audit in the British University system (European Review 5(3), 305–321): la formulación «cuando una medida se vuelve meta…»', authors: 'Strathern, M.', year: 1997, url: 'https://doi.org/10.1002/(SICI)1234-981X(199707)5:3<305::AID-EURO184>3.0.CO;2-4' },
    { title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena (NeurIPS 2023): tablas 2, 3 y 5', authors: 'Zheng, L., Chiang, W.-L., Sheng, Y., et al.', year: 2023, url: 'https://arxiv.org/abs/2306.05685' },
    { title: 'Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference', authors: 'Chiang, W.-L., Zheng, L., Sheng, Y., et al.', year: 2024, url: 'https://arxiv.org/abs/2403.04132' },
    { title: 'Interval Estimation for a Binomial Proportion (Statistical Science 16(2))', authors: 'Brown, L. D., Cai, T. T., DasGupta, A.', year: 2001, url: 'https://doi.org/10.1214/ss/1009213286' },
    { title: 'Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations', authors: 'Miller, E.', year: 2024, url: 'https://arxiv.org/abs/2411.00640' },
    { title: 'Position: Don’t Use the CLT in LLM Evals With Fewer Than a Few Hundred Datapoints', authors: 'Bowyer, S., Aitchison, L., Ivanova, D. R.', year: 2025, url: 'https://arxiv.org/abs/2503.01747' },
    { title: 'How Is ChatGPT’s Behavior Changing over Time? (v3: 500 primos y 500 compuestos; GPT-4, 84.0 % en marzo y 51.1 % en junio de 2023)', authors: 'Chen, L., Zaharia, M., Zou, J.', year: 2023, url: 'https://arxiv.org/abs/2307.09009' },
    { title: 'Red Teaming Language Models to Reduce Harms: Methods, Scaling Behaviors, and Lessons Learned (38 961 ataques publicados)', authors: 'Ganguli, D., Lovitt, L., Kernion, J., et al. (Anthropic)', year: 2022, url: 'https://arxiv.org/abs/2209.07858' },
    { title: 'Are We Done with MMLU? (6.49 % de preguntas con errores)', authors: 'Gema, A. P., Leang, J. O. J., Hong, G., et al.', year: 2024, url: 'https://arxiv.org/abs/2406.04127' },
  ],
});
