import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'alucinaciones-y-limites',

  objectives: {
    es: [
      'Explicar por qué un modelo de lenguaje puede dar una respuesta falsa con el mismo tono seguro que una verdadera, a partir de cómo se entrena.',
      'Reconocer tres familias de error (inventar, desactualizarse por el corte de conocimiento y razonar mal) y leer si la confianza de un modelo está calibrada.',
      'Elegir mitigaciones y un nivel de verificación proporcional al riesgo de cada uso.',
    ],
    en: [
      'Explain why a language model can give a false answer in the same confident tone as a true one, starting from how it is trained.',
      'Recognize three families of error (inventing, going stale because of the knowledge cutoff, and reasoning badly) and read whether a model’s confidence is calibrated.',
      'Choose mitigations and a level of verification proportional to the risk of each use.',
    ],
  },

  segments: [
    // ── 1 · el caso de Nueva York ──
    {
      id: 'hook',
      es: 'En dos mil veintitrés, unos abogados de Nueva York presentaron ante un tribunal un escrito que citaba casos anteriores, como se acostumbra. La otra parte no pudo encontrar la mayoría.',
      en: 'In twenty twenty-three, lawyers in New York filed a brief with a court that cited earlier cases, as is customary. The other side could not find most of them.',
      pad: 0.4,
    },
    {
      id: 'hook-six',
      es: 'El juez lo confirmó: seis de esos casos nunca existieron, con todo y sus citas y frases. Los había escrito ChatGPT.',
      en: 'The judge confirmed it: six of those cases never existed, citations and quotes included. ChatGPT had written them.',
      tts: {
        es: 'El juez lo confirmó: seis de esos casos nunca existieron, con todo y sus citas y frases. Los había escrito chat ge pe te.',
        en: 'The judge confirmed it: six of those cases never existed, citations and quotes included. Chat G P T had written them.',
      },
      pad: 0.5,
    },
    {
      id: 'ask',
      es: 'Uno de los abogados le preguntó a ChatGPT si uno de esos casos era real. Le respondió que sí, y que estaba en Westlaw y LexisNexis, dos bases de datos jurídicas.',
      en: 'One of the lawyers asked ChatGPT whether one of those cases was real. It said yes, and that it could be found on Westlaw and LexisNexis, two legal databases.',
      tts: {
        es: 'Uno de los abogados le preguntó a chat ge pe te si uno de esos casos era real. Le respondió que sí, y que estaba en Uéstlo y Léksis Néksis, dos bases de datos jurídicas.',
        en: 'One of the lawyers asked Chat G P T whether one of those cases was real. It said yes, and that it could be found on Westlaw and Lexis Nexis, two legal databases.',
      },
      pad: 0.5,
    },
    {
      id: 'define',
      es: 'El tribunal multó con cinco mil dólares a los dos abogados y a su despacho. A esto se le llama alucinación: una respuesta fluida y segura, pero falsa o sin respaldo.',
      en: 'The court fined the two lawyers and their firm five thousand dollars. This is called a hallucination: a fluent, confident answer that is false or unsupported.',
      note: { es: 'Alucinación: respuesta fluida y segura, pero falsa o sin respaldo.', en: 'Hallucination: a fluent, confident answer that is false or unsupported.' },
      pad: 0.5,
    },

    // ── 2 · lo que pasa dentro de un modelo real ──
    {
      id: 'recall',
      es: 'Para ver por qué pasa, recuerda la lección diecinueve: un modelo de lenguaje da una probabilidad a cada pieza de texto que podría seguir. Lo veremos en Pythia, el modelo real de la lección veintitrés.',
      en: 'To see why it happens, recall lesson nineteen: a language model gives a probability to every piece of text that could come next. We will see it in Pythia, the real model from lesson twenty-three.',
      tts: {
        es: 'Para ver por qué pasa, recuerda la lección diecinueve: un modelo de lenguaje da una probabilidad a cada pieza de texto que podría seguir. Lo veremos en Pitia, el modelo real de la lección veintitrés.',
      },
    },
    {
      id: 'aus-q',
      es: 'Como leyó sobre todo inglés, le preguntamos en inglés: «¿cuál es la capital de Australia?». El modelo debe escribir lo que sigue a «Respuesta:».',
      en: 'Since it read mostly English, we ask in English: “What is the capital of Australia?” The model has to write what comes after “Answer:”.',
      pad: 0.3,
    },
    {
      id: 'aus-bars',
      es: 'Cada barra es una pieza que podría seguir, y su largo es su probabilidad. «Can», el inicio de Canberra, recibe sesenta y nueve por ciento. Sídney, diecinueve.',
      en: 'Each bar is a piece that could come next, and its length is its probability. “Can,” the start of Canberra, gets sixty-nine percent. Sydney, nineteen.',
      pad: 0.5,
    },
    {
      id: 'aus-pick',
      es: 'El modelo toma la pieza más probable y completa: Canberra. Es correcta. Había duda, pero la respuesta más probable era la buena.',
      en: 'The model takes the most probable piece and completes it: Canberra. It is correct. There was doubt, but the most probable answer was the right one.',
      pad: 0.4,
    },
    {
      id: 'par-q',
      es: 'Segunda pregunta: «¿quién escribió Pedro Páramo?», la novela mexicana.',
      en: 'Second question: “Who wrote Pedro Páramo?”, the Mexican novel.',
      pad: 0.3,
    },
    {
      id: 'par-bars',
      es: 'Ahora ninguna barra destaca. La más alta, «Pablo», llega apenas a cinco por ciento. Y más de tres cuartas partes quedan repartidas entre cientos de piezas.',
      en: 'Now no bar stands out. The tallest, “Pablo,” barely reaches five percent. And more than three quarters is spread across hundreds of pieces.',
      pad: 0.5,
    },
    {
      id: 'par-pick',
      es: 'Pero el modelo siempre elige algo. Toma «Pablo» y después «Neruda»: nombre y apellido, con soltura. Y es falso: la novela es de Juan Rulfo.',
      en: 'But the model always picks something. It takes “Pablo,” then “Neruda”: first and last name, smoothly. And it is false: the novel is by Juan Rulfo.',
      pad: 0.5,
    },
    {
      id: 'same-tone',
      es: 'Compara las dos respuestas. Canberra salió con sesenta y nueve por ciento; Pablo Neruda, con apenas cuatro. Pero escritas en pantalla se ven igual de seguras.',
      en: 'Compare the two answers. Canberra came out at sixty-nine percent; Pablo Neruda, at barely four. But written on the screen, they look equally sure.',
      note: { es: 'La duda existe dentro del modelo, pero el texto no la muestra.', en: 'The doubt exists inside the model, but the text does not show it.' },
      pad: 0.5,
    },
    {
      id: 'no-idk',
      es: '¿Por qué no dijo «no lo sé»? Esa frase saldría solo si fuera una continuación probable. Aquí, de cada diez mil veces, saldría menos de una.',
      en: 'Why did it not say “I don’t know”? That phrase would only come out if it were a likely continuation. Here, out of every ten thousand times, it would come out less than once.',
      pad: 0.5,
    },

    // ── 3 · por qué ocurre ──
    {
      id: 'objective',
      es: 'La raíz está en el entrenamiento, el de la lección veintitrés: adivinar la pieza que sigue en textos reales. Gana puntos si coincide con el texto, no si es verdad.',
      en: 'The root is in training, the kind from lesson twenty-three: guessing the next piece of real text. It scores when it matches the text, not when it is true.',
      note: { es: 'Se entrena para lo plausible: nada comprueba si es verdad.', en: 'It is trained for the plausible: nothing checks whether it is true.' },
      pad: 0.5,
    },
    {
      id: 'rare',
      es: 'Segunda causa: lo poco frecuente. Un estudio de dos mil veintitrés midió que un modelo acierta más una pregunta cuantos más documentos de su entrenamiento hablan de ella.',
      en: 'Second cause: what is rare. A twenty twenty-three study measured that a model gets a question right more often the more documents in its training talk about it.',
      pad: 0.5,
    },
    {
      id: 'exam',
      es: 'Tercera: muchas evaluaciones califican como un examen donde dejar en blanco vale cero. Así, adivinar conviene más que decir «no lo sé», y los modelos aprenden a adivinar.',
      en: 'Third: many evaluations grade like an exam where a blank answer is worth zero. So guessing pays more than saying “I don’t know,” and models learn to guess.',
      pad: 0.5,
    },
    {
      id: 'snowball',
      es: 'Y un error arrastra otros, porque lo escrito se vuelve contexto. Si la frase dice «Pedro Páramo es una novela de Pablo Neruda», el modelo sigue: «es una colección de poemas».',
      en: 'And one error drags in others, because what is written becomes context. If the sentence says “Pedro Páramo is a novel by Pablo Neruda,” the model goes on: “it is a collection of poems.”',
      pad: 0.6,
    },

    // ── 4 · tres familias de error ──
    {
      id: 'types',
      es: 'Conviene separar tres familias de error, porque cada una se corrige distinto. La primera, inventar: el dato no está en el modelo y lo fabrica, como Neruda o los seis casos.',
      en: 'It helps to separate three families of error, because each is fixed differently. The first, inventing: the fact is not in the model, so it makes one up, like Neruda or the six cases.',
      note: { es: 'Tres familias de error: inventar, desactualizarse y razonar mal.', en: 'Three families of error: inventing, going stale, and reasoning badly.' },
      pad: 0.5,
    },
    {
      id: 'cutoff',
      es: 'La segunda, lo desactualizado. Los textos de entrenamiento terminan en una fecha: el corte de conocimiento. Los de Pythia se reunieron hasta dos mil veinte.',
      en: 'The second, being out of date. The training texts end at a date: the knowledge cutoff. Pythia’s were gathered up to twenty twenty.',
      tts: {
        es: 'La segunda, lo desactualizado. Los textos de entrenamiento terminan en una fecha: el corte de conocimiento. Los de Pitia se reunieron hasta dos mil veinte.',
      },
      pad: 0.5,
    },
    {
      id: 'cutoff-ex',
      es: 'Le preguntamos quién ganó el Mundial de futbol de dos mil veintidós. Responde «Alemania», con cuarenta y seis por ciento. Ganó Argentina, y no avisa que eso es posterior a sus datos.',
      en: 'We asked it who won the twenty twenty-two soccer World Cup. It answers “Germany,” at forty-six percent. Argentina won, and it gives no warning that this came after its data.',
      pad: 0.6,
    },
    {
      id: 'reason',
      es: 'La tercera, razonar mal: los datos están, pero falla la cadena de pasos. Pythia multiplicó cuarenta veces un número de tres cifras por uno de dos, y falló las cuarenta.',
      en: 'The third, reasoning badly: the facts are there, but the chain of steps fails. Pythia multiplied a three-digit number by a two-digit one forty times, and got all forty wrong.',
      tts: {
        es: 'La tercera, razonar mal: los datos están, pero falla la cadena de pasos. Pitia multiplicó cuarenta veces un número de tres cifras por uno de dos, y falló las cuarenta.',
      },
      pad: 0.5,
    },

    // ── 5 · ¿verdadero o inventado? ──
    {
      id: 'game-intro',
      es: '¿Se nota una invención por el tono? Pruébalo con afirmaciones al estilo de un asistente, escritas para esta lección. Unas son verdaderas y otras, inventadas.',
      en: 'Can you tell an invention by its tone? Try it with statements in an assistant’s style, written for this lesson. Some are true and others are invented.',
      pad: 0.4,
    },
    {
      id: 'game-look',
      es: 'La primera cita un caso judicial, con su número de tomo, su página, el tribunal y el año. Suena impecable. Al buscarla en los registros, no aparece: es uno de los seis casos inventados.',
      en: 'The first cites a court case, with its volume number, page, court, and year. It sounds flawless. Searched for in the records, it does not appear: it is one of the six invented cases.',
      pad: 0.6,
    },
    {
      id: 'game-check',
      es: 'La segunda tiene la misma forma: un caso de la Corte Suprema de Estados Unidos, de mil novecientos cincuenta y cuatro. Esta sí está en los registros oficiales: es verdadera.',
      en: 'The second has the same form: a case from the United States Supreme Court, from nineteen fifty-four. This one is in the official records: it is true.',
      pad: 0.6,
    },
    {
      id: 'try-game',
      es: 'Si quieres, sigue tú con las cuatro que faltan: pulsa «Verdadera» o «Inventada» en cada una, y mira después cómo se comprobó.',
      en: 'If you like, go on with the four that remain: press “True” or “Invented” for each one, and then see how it was checked.',
      gate: {
        id: 'game',
        prompt: { es: 'pulsa «Verdadera» o «Inventada» en cada afirmación.', en: 'press “True” or “Invented” for each statement.' },
      },
      pad: 0.4,
    },
    {
      id: 'game-after',
      es: 'Aquí están las seis, resueltas. Todas sonaban igual de seguras, con nombres, fechas y cifras. Lo que las separa es comprobarlas en una fuente, nunca el tono.',
      en: 'Here are all six, solved. They all sounded equally sure, with names, dates, and figures. What tells them apart is checking them against a source, never the tone.',
      pad: 0.6,
    },

    // ── 6 · confianza y calibración ──
    {
      id: 'conf',
      es: 'Volvamos dentro del modelo. Llamemos confianza a la probabilidad que dio a su propia respuesta: Canberra, sesenta y nueve por ciento; Pablo Neruda, cuatro.',
      en: 'Back inside the model. Let us call confidence the probability it gave its own answer: Canberra, sixty-nine percent; Pablo Neruda, four.',
      pad: 0.4,
    },
    {
      id: 'forecast',
      es: 'Piensa en el pronóstico del clima. Si dice setenta por ciento de lluvia, de cada diez días así debería llover en unos siete. Entonces el pronóstico está calibrado.',
      en: 'Think of a weather forecast. If it says seventy percent chance of rain, then out of ten days like that it should rain on about seven. Then the forecast is calibrated.',
      note: { es: 'Calibración: la confianza coincide con qué tan seguido acierta.', en: 'Calibration: confidence matches how often it is right.' },
      pad: 0.6,
    },
    {
      id: 'calib-x',
      es: 'Midamos a Pythia con cuatrocientas veinticuatro preguntas fáciles: capitales, autores, fechas. A lo ancho va su confianza, en cinco grupos de veinte en veinte por ciento.',
      en: 'Let us measure Pythia on four hundred twenty-four easy questions: capitals, authors, dates. Across goes its confidence, in five groups of twenty percent each.',
      tts: {
        es: 'Midamos a Pitia con cuatrocientas veinticuatro preguntas fáciles: capitales, autores, fechas. A lo ancho va su confianza, en cinco grupos de veinte en veinte por ciento.',
      },
      pad: 0.5,
    },
    {
      id: 'calib-y',
      es: 'Hacia arriba, qué parte de cada grupo acertó. Esta diagonal es lo ideal: con treinta por ciento de confianza, acertar treinta por ciento de las veces.',
      en: 'Upward, what share of each group it got right. This diagonal is the ideal: at thirty percent confidence, being right thirty percent of the time.',
      pad: 0.5,
    },
    {
      id: 'calib-bars',
      es: 'Esto pasó. Con menos de veinte por ciento de confianza, acertó diecinueve de noventa y ocho, una de cada cinco. Con más de ochenta, acertó las ciento cuarenta y ocho.',
      en: 'Here is what happened. Below twenty percent confidence, it got nineteen of ninety-eight right, one in five. Above eighty, it got all one hundred forty-eight right.',
      pad: 0.7,
    },
    {
      id: 'calib-read',
      es: 'La señal sirve: a más confianza, más aciertos. Pero no sigue la diagonal: en los grupos de en medio, acierta más de lo que su confianza dice.',
      en: 'The signal works: more confidence, more right answers. But it does not follow the diagonal: in the middle groups, it is right more often than its confidence says.',
      pad: 0.5,
    },
    {
      id: 'confident-wrong',
      es: 'Y hay errores muy seguros. ¿Quién esculpió El pensador? Pythia responde «Miguel Ángel», con setenta y dos por ciento de confianza. Es de Auguste Rodin.',
      en: 'And there are very confident errors. Who sculpted The Thinker? Pythia answers “Michelangelo,” at seventy-two percent confidence. It is by Auguste Rodin.',
      tts: {
        es: 'Y hay errores muy seguros. ¿Quién esculpió El pensador? Pitia responde «Miguel Ángel», con setenta y dos por ciento de confianza. Es de Ogust Rodán.',
      },
      pad: 0.5,
    },
    {
      id: 'hidden',
      es: 'Además, en un chat no ves ninguna probabilidad: solo el texto elegido. Y según el informe de GPT-4, el ajuste de la lección veintiocho redujo su calibración.',
      en: 'Besides, in a chat you see no probability at all: only the chosen text. And according to the GPT-4 report, the tuning from lesson twenty-eight reduced its calibration.',
      tts: {
        es: 'Además, en un chat no ves ninguna probabilidad: solo el texto elegido. Y según el informe de ge pe te cuatro, el ajuste de la lección veintiocho redujo su calibración.',
        en: 'Besides, in a chat you see no probability at all: only the chosen text. And according to the G P T four report, the tuning from lesson twenty-eight reduced its calibration.',
      },
      pad: 0.5,
    },

    // ── 7 · responder o callar ──
    {
      id: 'abstain',
      es: 'Si un sistema sí conoce su confianza, puede exigir un mínimo, un umbral. Por debajo de él, responde «no lo sé» en lugar de adivinar.',
      en: 'If a system does know its confidence, it can demand a minimum, a threshold. Below it, it answers “I don’t know” instead of guessing.',
      pad: 0.4,
    },
    {
      id: 'abstain-demo',
      es: 'Mira. Con el umbral en cero, responde las cuatrocientas veinticuatro y falla ciento once. Al subirlo a cincuenta por ciento, falla solo seis, pero calla ante ciento ochenta y tres.',
      en: 'Watch. With the threshold at zero, it answers all four hundred twenty-four and misses one hundred eleven. Raised to fifty percent, it misses only six, but stays silent on one hundred eighty-three.',
      pad: 0.8,
    },
    {
      id: 'try-thr',
      es: 'Si quieres, mueve tú el umbral y mira las tres cuentas: aciertos, errores y silencios. Quitar todos los errores cuesta muchos aciertos.',
      en: 'If you like, move the threshold yourself and watch the three counts: right, wrong, and silent. Removing every error costs a lot of right answers.',
      gate: {
        id: 'thr',
        prompt: { es: 'mueve el umbral y mira cómo cambian aciertos, errores y silencios.', en: 'move the threshold and watch right, wrong, and silent change.' },
      },
      pad: 0.4,
    },
    {
      id: 'thr-cost',
      es: '¿Dónde ponerlo? Depende de cuánto cuesta un error. Para sugerir recetas, basta un umbral bajo; para una dosis o una cita legal, conviene uno alto, medido con tus datos.',
      en: 'Where to set it? It depends on what an error costs. For suggesting recipes, a low threshold is enough; for a dose or a legal citation, a high one is better, measured on your data.',
      note: { es: 'El umbral lo fija el costo de equivocarse, y se mide con datos propios.', en: 'The threshold is set by the cost of being wrong, and measured on your own data.' },
      pad: 0.5,
    },

    // ── 8 · ¿lo arregla el tamaño? ──
    {
      id: 'scale',
      es: '¿Y un modelo más grande? En estas preguntas fáciles ayuda mucho: de cuarenta y dos por ciento de aciertos con cuatrocientos diez millones de parámetros a noventa y cuatro con doce mil millones.',
      en: 'And a bigger model? On these easy questions it helps a lot: from forty-two percent right at four hundred ten million parameters to ninety-four at twelve billion.',
      pad: 0.6,
    },
    {
      id: 'truthfulqa',
      es: 'Pero no siempre. TruthfulQA, de dos mil veintiuno, hace preguntas donde mucha gente cree algo falso. Ahí, los modelos más grandes solían ser los menos veraces.',
      en: 'But not always. TruthfulQA, from twenty twenty-one, asks questions where many people believe something false. There, the largest models were generally the least truthful.',
      tts: {
        es: 'Pero no siempre. Trúzful cu a, de dos mil veintiuno, hace preguntas donde mucha gente cree algo falso. Ahí, los modelos más grandes solían ser los menos veraces.',
        en: 'But not always. Truthful Q A, from twenty twenty-one, asks questions where many people believe something false. There, the largest models were generally the least truthful.',
      },
      pad: 0.5,
    },
    {
      id: 'truthfulqa-num',
      es: 'Repetían lo que leyeron, como que tronarse los dedos da artritis. El mejor modelo fue veraz en cincuenta y ocho por ciento de las preguntas; las personas, en noventa y cuatro.',
      en: 'They repeated what they had read, like cracking your knuckles causing arthritis. The best model was truthful on fifty-eight percent of the questions; people, on ninety-four.',
      pad: 0.6,
    },

    // ── 9 · qué hacer ──
    {
      id: 'mit-doc',
      es: 'No se elimina; se gestiona. Primera palanca: darle el documento. Con RAG, la lección treinta y uno, el modelo responde con textos que tú le pasas, y los cita.',
      en: 'It cannot be eliminated; it is managed. First lever: hand it the document. With RAG, lesson thirty-one, the model answers from texts you give it, and cites them.',
      pad: 0.5,
    },
    {
      id: 'mit-tools',
      es: 'Segunda: herramientas, como una calculadora o una base de datos. El dato lo produce un programa que calcula o consulta; el modelo solo lo pide y lo comunica.',
      en: 'Second: tools, like a calculator or a database. A program that computes or looks things up produces the fact; the model only asks for it and reports it.',
      pad: 0.5,
    },
    {
      id: 'mit-format',
      es: 'Tercera: acotar la salida. Si la respuesta debe ser uno de diez códigos válidos, el sistema rechaza cualquier otro. Y pedir fuentes sirve solo si alguien las revisa.',
      en: 'Third: constrain the output. If the answer must be one of ten valid codes, the system rejects anything else. And asking for sources only helps if someone checks them.',
      pad: 0.5,
    },
    {
      id: 'verify',
      es: 'Cuarta: verificar, es decir, comprobar la respuesta en una fuente independiente. No en el mismo modelo, como hizo el abogado de Nueva York.',
      en: 'Fourth: verify, that is, check the answer against an independent source. Not against the same model, as the New York lawyer did.',
      note: { es: 'Verificar: comprobar en una fuente independiente, no en el mismo modelo.', en: 'Verify: check against an independent source, not the same model.' },
      pad: 0.5,
    },
    {
      id: 'evidence',
      es: 'Ninguna basta sola. En un estudio de dos mil veinticuatro, herramientas jurídicas que buscan en documentos alucinaron entre diecisiete y treinta y tres por ciento de las veces.',
      en: 'None is enough on its own. In a twenty twenty-four study, legal research tools that search documents hallucinated between seventeen and thirty-three percent of the time.',
      pad: 0.5,
    },
    {
      id: 'risk',
      es: 'Por eso se verifica en proporción al riesgo. Una lluvia de ideas solo se lee; en un informe interno se revisan las cifras clave; una cita legal o una dosis, una por una, en la fuente.',
      en: 'So you verify in proportion to the risk. A brainstorm is just read; in an internal report, the key figures are checked; a legal citation or a dose, one by one, at the source.',
      note: { es: 'Verifica en proporción al riesgo de equivocarte.', en: 'Verify in proportion to the risk of being wrong.' },
      pad: 0.6,
    },
    {
      id: 'accountability',
      es: 'Y la responsabilidad no se delega. En dos mil veinticuatro, un tribunal de Canadá hizo responder a Air Canada por lo que dijo su chatbot, y rechazó que el bot respondiera por sí mismo.',
      en: 'And responsibility cannot be handed off. In twenty twenty-four, a Canadian tribunal held Air Canada liable for what its chatbot said, and rejected the idea that the bot answered for itself.',
      tts: {
        es: 'Y la responsabilidad no se delega. En dos mil veinticuatro, un tribunal de Canadá hizo responder a Er Cánada por lo que dijo su chatbot, y rechazó que el bot respondiera por sí mismo.',
      },
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo escribe lo plausible, no lo verdadero; su duda existe, pero el texto no la muestra; y se verifica en proporción al riesgo.',
      en: 'In short: the model writes what is plausible, not what is true; its doubt exists, but the text does not show it; and you verify in proportion to the risk.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Queda una pregunta: ¿cómo sabes si un sistema sirve para tu caso? Midiéndolo con casos tuyos, no con una demostración. Esa es la siguiente lección: evaluar sistemas de IA.',
      en: 'One question remains: how do you know whether a system works for your case? By measuring it on your own cases, not on a demo. That is the next lesson: evaluating AI systems.',
    },
  ],

  keyIdeas: {
    es: [
      'Una alucinación es una respuesta fluida y segura que es falsa o no tiene respaldo. No es una avería ocasional: se sigue de cómo se entrena un modelo de lenguaje.',
      'El modelo se entrena para continuar textos de forma plausible. Ninguna parte de ese objetivo comprueba la verdad, y «no lo sé» solo aparece si es una continuación probable.',
      'Hay tres familias de error: inventar lo que no sabe, desactualizarse (no conoce nada posterior a su corte de conocimiento) y razonar mal. Cada una se corrige distinto.',
      'La probabilidad interna informa (a más confianza, más aciertos), pero no siempre está calibrada y un chat no la muestra. El tono del texto no dice nada sobre la verdad.',
      'Las mitigaciones reducen, no eliminan: documentos (RAG), herramientas, salidas acotadas y verificación en una fuente independiente, proporcional al riesgo. La responsabilidad sigue siendo de quien despliega el sistema.',
    ],
    en: [
      'A hallucination is a fluent, confident answer that is false or unsupported. It is not an occasional breakdown: it follows from how a language model is trained.',
      'The model is trained to continue text plausibly. No part of that objective checks truth, and “I don’t know” only appears if it is a likely continuation.',
      'There are three families of error: inventing what it does not know, going stale (it knows nothing after its knowledge cutoff), and reasoning badly. Each is fixed differently.',
      'The internal probability is informative (more confidence, more right answers), but it is not always calibrated and a chat does not show it. The tone of the text says nothing about truth.',
      'Mitigations reduce, not eliminate: documents (RAG), tools, constrained outputs, and verification against an independent source, proportional to risk. Responsibility stays with whoever deploys the system.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Si el modelo da detalles y suena seguro, probablemente lo sabe; y si le preguntas si se equivocó, te lo dirá.',
      en: 'If the model gives details and sounds sure, it probably knows; and if you ask whether it was wrong, it will tell you.',
    },
    right: {
      es: 'El tono seguro y los detalles son justo lo que mejor aprende, y no informan de la verdad: «Pablo Neruda» salió con 4 % de probabilidad y se ve igual que «Canberra», con 69 %. Preguntarle al mismo modelo no es una verificación independiente: el abogado de Nueva York lo hizo. Se comprueba en una fuente.',
      en: 'A confident tone and rich detail are exactly what it learns best, and they say nothing about truth: “Pablo Neruda” came out at 4% probability and looks just like “Canberra,” at 69%. Asking the same model is not an independent check: the New York lawyer did it. You check against a source.',
    },
  },

  deeper: {
    es: `## Qué optimiza el entrenamiento

El preentrenamiento minimiza la entropía cruzada sobre texto real:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_\\theta(x_t \\mid x_{<t})$$

La pérdida baja cuando el modelo da alta probabilidad a la pieza que de verdad siguió en el texto. En la fórmula no hay ninguna variable «verdad»: si el texto contiene un error, el objetivo lo premia igual. Después, el ajuste con preferencias humanas (RLHF, lección 28) añade otra señal y puede cambiar la calibración: el informe técnico de GPT-4 (OpenAI, 2023) dice que el modelo preentrenado estaba muy bien calibrado y que tras el ajuste posterior la calibración se reducía.

## Los datos vistos una sola vez

Kalai, Nachum, Vempala y Zhang (2025) formalizan el efecto de lo poco frecuente. Sea $s_r$ la fracción de los hechos de entrenamiento que aparecen exactamente una vez (la «tasa de singletons», del estimador de masa faltante de Good y Turing). Para hechos arbitrarios, sin un patrón que generalizar (como un cumpleaños), el error de un modelo base cumple, con probabilidad al menos 99 %,

$$\\text{err} \\;\\ge\\; s_r \\;-\\; \\frac{2}{\\min_c |E_c|} \\;-\\; \\frac{35 + 6\\ln N}{\\sqrt{N}} \\;-\\; \\delta$$

donde $N$ es el número de ejemplos, $E_c$ el conjunto de respuestas erróneas plausibles para el contexto $c$ y $\\delta$ mide la descalibración. En palabras de los autores: si el 20 % de los cumpleaños aparece una sola vez en los datos de preentrenamiento, se espera que un modelo base alucine en al menos el 20 % de los cumpleaños. Es un resultado teórico para hechos sin estructura; no predice la tasa de un modelo concreto. Kandpal et al. (2023) lo observan en la práctica: la exactitud en preguntas de datos crece con el número de documentos de preentrenamiento relacionados con la pregunta.

## Por qué el ajuste no lo quita: los exámenes premian adivinar

Kalai et al. (2025) también explican por qué las alucinaciones sobreviven al ajuste posterior: la mayoría de las evaluaciones que dominan las tablas de clasificación califican de forma binaria (1 si acierta, 0 si no), y «no lo sé» vale 0. En un examen de opción múltiple con cuatro opciones, adivinar vale en promedio $\\tfrac14$ de punto y dejar en blanco, 0: adivinar siempre conviene. Proponen anunciar en la instrucción un umbral de confianza $t$ y penalizar cada error con $t/(1-t)$ puntos, de modo que contestar «no lo sé» valga 0 y adivinar deje de convenir cuando la confianza es baja.

## Corte de conocimiento y lo que se queda viejo

Pythia se entrenó con The Pile (Gao et al., 2020), publicado el 31 de diciembre de 2020: no puede saber nada posterior. A «Who won the 2022 FIFA World Cup?», con el mismo prompt de cinco ejemplos y decodificación voraz, Pythia-1.4B responde «Germany» con probabilidad 0.46 (ganó Argentina, según la FIFA). Responde lo mismo para 2014 (correcto) y para 2018 (falso: ganó Francia). Además, lo viejo se queda: a «What is the capital of Brazil?» responde «Rio de Janeiro» (0.53), que dejó de ser la capital el 21 de abril de 1960, cuando se inauguró Brasilia (IBGE). Mediciones: \`run-cutoff.py\` y \`run-qa.py\` en la carpeta de la lección.

## Calibración y error de calibración esperado

Se reparten las $N$ respuestas en $B$ tramos por confianza. Con $n_b$ respuestas en el tramo $b$, su acierto medio $\\mathrm{acc}(b)$ y su confianza media $\\mathrm{conf}(b)$:

$$\\mathrm{ECE} = \\sum_{b=1}^{B} \\frac{n_b}{N}\\,\\bigl|\\mathrm{acc}(b) - \\mathrm{conf}(b)\\bigr|$$

(Guo et al., 2017). Con diez tramos de igual ancho, las cuatrocientas veinticuatro preguntas de la lección dan un ECE de ≈ 0.18 para Pythia-1.4B; la escena usa cinco tramos para que se lean mejor. Casi todo el error viene de la subconfianza: sus respuestas aciertan más de lo que su probabilidad indica, en parte porque la probabilidad de una cadena reparte la masa entre formas de escribir lo mismo («Cervantes», «Miguel de Cervantes»). Farquhar et al. (2024) agrupan las respuestas por significado (entropía semántica) para corregir ese efecto.

Los datos de la lección son mediciones propias, no un banco de pruebas publicado: 424 preguntas de cultura general escritas para la lección (capitales, autores, fechas, símbolos químicos…), en inglés, con cinco ejemplos resueltos en el prompt y decodificación voraz. La «confianza» es la probabilidad de la cadena completa de la respuesta. Son preguntas fáciles para un modelo de internet: con datos realmente raros, el error sería mayor.

## Responder o callar

Si acertar suma 1, fallar resta $k$ y callar vale 0, y la probabilidad de acertar es $p$, responder vale en promedio $p - k(1-p)$. Conviene responder cuando

$$p > \\frac{k}{1+k}$$

que es la regla de rechazo de Chow (1970). Con $k = 1, 3, 9, 19$ el umbral es $0.5,\\ 0.75,\\ 0.9,\\ 0.95$. La regla vale si $p$ está calibrada. Con la probabilidad cruda de Pythia los mejores umbrales medidos son menores, justamente por su subconfianza: hay que recalibrar (por ejemplo, con escalado por temperatura, Guo et al., 2017) o fijar el umbral directamente sobre datos propios.

## TruthfulQA, con detalle

Lin, Hilton y Evans (2021) escribieron 817 preguntas en 38 categorías (salud, derecho, finanzas, política…) que algunas personas responderían mal por una creencia falsa. El mejor modelo (GPT-3 de 175 mil millones de parámetros con un prompt «servicial») fue veraz en el 58 % de las preguntas, pero solo el 21 % de sus respuestas fue a la vez veraz e informativa: «no tengo comentarios» cuenta como veraz. Las personas llegaron al 94 %. Dentro de cada familia de modelos, los más grandes solían ser los menos veraces, porque imitan mejor las falsedades de sus textos («escalamiento inverso»).

## En código

\`\`\`python
def tramos(conf, ok, n_tramos=5):
    """Agrupa por confianza (tramos de igual ancho) y devuelve (ECE, [(n, confianza media, acierto medio), ...])."""
    filas, ece = [], 0.0
    for b in range(n_tramos):
        lo, hi = b / n_tramos, (b + 1) / n_tramos
        idx = [i for i, c in enumerate(conf) if lo <= c < hi or (b == n_tramos - 1 and c == 1.0)]
        if not idx:
            continue
        c_med = sum(conf[i] for i in idx) / len(idx)
        a_med = sum(ok[i] for i in idx) / len(idx)
        ece += len(idx) / len(conf) * abs(a_med - c_med)
        filas.append((len(idx), round(c_med, 2), round(a_med, 2)))
    return round(ece, 3), filas


def umbral(conf, ok, t):
    """Responde solo si la confianza es >= t. Devuelve (aciertos, errores, silencios)."""
    resp = [o for c, o in zip(conf, ok) if c >= t]
    return sum(resp), len(resp) - sum(resp), len(conf) - len(resp)


conf = [0.97, 0.91, 0.83, 0.62, 0.55, 0.38, 0.31, 0.22, 0.12, 0.08]
ok   = [1,    1,    1,    1,    0,    1,    0,    0,    1,    0]
print(tramos(conf, ok))
# (0.211, [(2, 0.1, 0.5), (3, 0.3, 0.33), (1, 0.55, 0.0), (1, 0.62, 1.0), (3, 0.9, 1.0)])
print(umbral(conf, ok, 0.0))   # (6, 4, 0)
print(umbral(conf, ok, 0.5))   # (4, 1, 5)
\`\`\`

## Lo que viene

La recuperación de documentos (lección 31) ataca el origen del problema: que el dato falte en la memoria del modelo. Evaluar un sistema con casos propios, y no con una demostración, es la lección 34. Los riesgos que van más allá de la calidad (privacidad, inyección de instrucciones, responsabilidad) están en la lección 35.`,
    en: `## What training optimizes

Pretraining minimizes cross-entropy on real text:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_\\theta(x_t \\mid x_{<t})$$

The loss goes down when the model gives high probability to the piece that actually followed in the text. There is no “truth” variable in the formula: if the text contains an error, the objective rewards it all the same. Afterwards, tuning with human preferences (RLHF, lesson 28) adds another signal and can change calibration: the GPT-4 technical report (OpenAI, 2023) says the pretrained model was highly calibrated and that after post-training the calibration was reduced.

## Facts seen only once

Kalai, Nachum, Vempala, and Zhang (2025) formalize the effect of rarity. Let $s_r$ be the fraction of training facts that appear exactly once (the “singleton rate,” from the Good–Turing missing-mass estimator). For arbitrary facts, with no pattern to generalize (like a birthday), a base model’s error satisfies, with probability at least 99%,

$$\\text{err} \\;\\ge\\; s_r \\;-\\; \\frac{2}{\\min_c |E_c|} \\;-\\; \\frac{35 + 6\\ln N}{\\sqrt{N}} \\;-\\; \\delta$$

where $N$ is the number of examples, $E_c$ the set of plausible wrong answers for context $c$, and $\\delta$ measures miscalibration. In the authors’ words: if 20% of birthday facts appear exactly once in the pretraining data, one expects base models to hallucinate on at least 20% of birthday facts. It is a theoretical result for facts with no structure; it does not predict the rate of a specific model. Kandpal et al. (2023) observe it in practice: accuracy on factual questions grows with the number of pretraining documents related to the question.

## Why tuning does not remove it: exams reward guessing

Kalai et al. (2025) also explain why hallucinations survive post-training: most evaluations that dominate leaderboards grade in a binary way (1 if right, 0 if not), and “I don’t know” scores 0. On a four-option multiple-choice exam, guessing is worth $\\tfrac14$ of a point on average and leaving it blank, 0: guessing always pays. They propose stating a confidence threshold $t$ in the instructions and penalizing each error with $t/(1-t)$ points, so that answering “I don’t know” is worth 0 and guessing stops paying when confidence is low.

## Knowledge cutoff and what goes stale

Pythia was trained on The Pile (Gao et al., 2020), released on December 31, 2020: it cannot know anything later. Asked “Who won the 2022 FIFA World Cup?”, with the same five-example prompt and greedy decoding, Pythia-1.4B answers “Germany” with probability 0.46 (Argentina won, according to FIFA). It answers the same for 2014 (right) and for 2018 (wrong: France won). Old facts also linger: asked “What is the capital of Brazil?”, it answers “Rio de Janeiro” (0.53), which stopped being the capital on April 21, 1960, when Brasília was inaugurated (IBGE). Measurements: \`run-cutoff.py\` and \`run-qa.py\` in the lesson folder.

## Calibration and expected calibration error

Split the $N$ answers into $B$ bins by confidence. With $n_b$ answers in bin $b$, its mean accuracy $\\mathrm{acc}(b)$ and mean confidence $\\mathrm{conf}(b)$:

$$\\mathrm{ECE} = \\sum_{b=1}^{B} \\frac{n_b}{N}\\,\\bigl|\\mathrm{acc}(b) - \\mathrm{conf}(b)\\bigr|$$

(Guo et al., 2017). With ten equal-width bins, the lesson’s four hundred twenty-four questions give an ECE of ≈ 0.18 for Pythia-1.4B; the scene uses five bins so they read better. Almost all of the error is under-confidence: its answers are right more often than its probability says, partly because the probability of a string splits the mass among ways of writing the same thing (“Cervantes,” “Miguel de Cervantes”). Farquhar et al. (2024) group answers by meaning (semantic entropy) to correct that effect.

The lesson’s data are our own measurements, not a published benchmark: 424 general-knowledge questions written for the lesson (capitals, authors, dates, chemical symbols…), in English, with five solved examples in the prompt and greedy decoding. “Confidence” is the probability of the whole answer string. They are easy questions for a model trained on the internet: with truly rare facts, the error would be higher.

## Answer or stay silent

If being right adds 1, being wrong subtracts $k$, and staying silent is worth 0, and the probability of being right is $p$, answering is worth $p - k(1-p)$ on average. It pays to answer when

$$p > \\frac{k}{1+k}$$

which is Chow’s reject rule (1970). With $k = 1, 3, 9, 19$ the threshold is $0.5,\\ 0.75,\\ 0.9,\\ 0.95$. The rule holds if $p$ is calibrated. With Pythia’s raw probability the best measured thresholds are lower, precisely because of its under-confidence: you must recalibrate (for example, with temperature scaling, Guo et al., 2017) or set the threshold directly on your own data.

## TruthfulQA, in detail

Lin, Hilton, and Evans (2021) wrote 817 questions in 38 categories (health, law, finance, politics…) that some people would answer wrongly because of a false belief. The best model (175-billion-parameter GPT-3 with a “helpful” prompt) was truthful on 58% of the questions, but only 21% of its answers were both truthful and informative: “I have no comment” counts as truthful. People reached 94%. Within each model family, the largest models were generally the least truthful, because they imitate the falsehoods in their texts better (“inverse scaling”).

## In code

\`\`\`python
def bins(conf, ok, n_bins=5):
    """Group by confidence (equal-width bins) and return (ECE, [(n, mean confidence, mean accuracy), ...])."""
    rows, ece = [], 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        idx = [i for i, c in enumerate(conf) if lo <= c < hi or (b == n_bins - 1 and c == 1.0)]
        if not idx:
            continue
        c_mean = sum(conf[i] for i in idx) / len(idx)
        a_mean = sum(ok[i] for i in idx) / len(idx)
        ece += len(idx) / len(conf) * abs(a_mean - c_mean)
        rows.append((len(idx), round(c_mean, 2), round(a_mean, 2)))
    return round(ece, 3), rows


def threshold(conf, ok, t):
    """Answer only if confidence >= t. Returns (right, wrong, silent)."""
    answered = [o for c, o in zip(conf, ok) if c >= t]
    return sum(answered), len(answered) - sum(answered), len(conf) - len(answered)


conf = [0.97, 0.91, 0.83, 0.62, 0.55, 0.38, 0.31, 0.22, 0.12, 0.08]
ok   = [1,    1,    1,    1,    0,    1,    0,    0,    1,    0]
print(bins(conf, ok))
# (0.211, [(2, 0.1, 0.5), (3, 0.3, 0.33), (1, 0.55, 0.0), (1, 0.62, 1.0), (3, 0.9, 1.0)])
print(threshold(conf, ok, 0.0))   # (6, 4, 0)
print(threshold(conf, ok, 0.5))   # (4, 1, 5)
\`\`\`

## What comes next

Retrieval (lesson 31) attacks the root of the problem: the fact missing from the model’s memory. Evaluating a system on your own cases, not on a demo, is lesson 34. The risks that go beyond quality (privacy, prompt injection, accountability) are in lesson 35.`,
  },

  lens: {
    es: [
      'Clasifica cada uso por lo que cuesta un error y lo fácil que es comprobarlo. Una lluvia de ideas tolera errores; una cifra para un cliente, una cita legal o un dato médico, no. Pon la revisión humana donde el error cuesta.',
      'No aceptes «el modelo dice estar seguro» ni «le pregunté si era correcto» como verificación: el tono no informa de la verdad. Pide fuentes que se puedan comprobar y, donde importe, revísalas contra la fuente.',
      'Pregunta al proveedor: ¿qué tasa de error se midió en MIS casos?, ¿puede abstenerse y con qué umbral?, ¿cita fuentes verificables?, ¿cuál es su corte de conocimiento? Una demostración sin tasa de error no es evidencia.',
      'La responsabilidad es tuya: en el caso de Air Canada (2024), un tribunal de Columbia Británica hizo responder a la empresa por lo que dijo su chatbot. Define un dueño, un registro de respuestas, una vía de corrección y un punto de escalamiento a una persona.',
    ],
    en: [
      'Classify each use by what an error costs and how easy it is to check. A brainstorm tolerates errors; a figure for a client, a legal citation, or a medical fact does not. Put human review where an error is costly.',
      'Do not accept “the model says it is sure” or “I asked whether it was correct” as verification: tone says nothing about truth. Ask for sources that can be checked and, where it matters, check them against the source.',
      'Ask the vendor: what error rate was measured on MY cases? Can it abstain, and at what threshold? Does it cite verifiable sources? What is its knowledge cutoff? A demo without an error rate is not evidence.',
      'Accountability is yours: in the Air Canada case (2024), a British Columbia tribunal held the company liable for what its chatbot said. Define an owner, a log of answers, a way to correct them, and an escalation point to a person.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué un modelo de lenguaje puede dar una respuesta falsa con tono seguro?', en: 'Why can a language model give a false answer in a confident tone?' },
      options: [
        { es: 'Porque a veces decide engañar para parecer más útil.', en: 'Because it sometimes decides to deceive in order to seem more helpful.' },
        { es: 'Porque se entrenó para continuar textos de forma plausible, y nada en ese objetivo comprueba que sea verdad.', en: 'Because it was trained to continue text plausibly, and nothing in that objective checks that it is true.' },
        { es: 'Porque solo ha leído textos falsos.', en: 'Because it has only read false texts.' },
        { es: 'Porque tiene un error de programación que se corregirá en la próxima versión.', en: 'Because it has a programming bug that will be fixed in the next version.' },
      ],
      answer: 1,
      why: {
        es: 'El objetivo premia lo plausible. Cuando el dato falta o es raro, el modelo igual elige una pieza de texto, y el texto se ve igual de seguro: «Pablo Neruda» salió con 4 % y se lee igual que «Canberra», con 69 %. No hay intención de engañar ni una avería puntual.',
        en: 'The objective rewards the plausible. When the fact is missing or rare, the model still picks a piece of text, and the text looks just as sure: “Pablo Neruda” came out at 4% and reads just like “Canberra,” at 69%. There is no intent to deceive and no one-off breakdown.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Un sistema dice tener noventa por ciento de confianza en cien respuestas y acierta sesenta. ¿Qué indica?', en: 'A system claims ninety percent confidence on one hundred answers and is right on sixty. What does that indicate?' },
      options: [
        { es: 'Que está bien calibrado.', en: 'That it is well calibrated.' },
        { es: 'Que está sobreconfiado: su confianza supera su acierto.', en: 'That it is over-confident: its confidence exceeds its accuracy.' },
        { es: 'Que está subconfiado: acierta más de lo que cree.', en: 'That it is under-confident: it is right more often than it thinks.' },
        { es: 'Que debería responder siempre, sin umbral.', en: 'That it should always answer, with no threshold.' },
      ],
      answer: 1,
      why: {
        es: 'Calibrado sería acertar cerca de noventa de cien, como un pronóstico de 70 % de lluvia que acierta unos siete de cada diez días. Aquí la confianza (90 %) supera el acierto (60 %): está sobreconfiado, y un umbral basado en esa confianza dejaría pasar demasiados errores. Pythia, en la lección, era lo contrario: subconfiado.',
        en: 'Calibrated would be getting about ninety out of one hundred, like a 70% rain forecast that is right on about seven of ten days. Here confidence (90%) exceeds accuracy (60%): it is over-confident, and a threshold based on that confidence would let too many errors through. Pythia, in the lesson, was the opposite: under-confident.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'Un examen tiene preguntas de cuatro opciones. Acertar suma 1 punto y dejar en blanco vale 0. Si además cada error resta 1 punto, ¿conviene adivinar al azar?', en: 'An exam has four-option questions. A right answer adds 1 point and a blank is worth 0. If each wrong answer also subtracts 1 point, does guessing at random pay?' },
      options: [
        { es: 'Sí: en promedio suma 0.25 puntos.', en: 'Yes: on average it adds 0.25 points.' },
        { es: 'Da igual: en promedio vale cero.', en: 'It makes no difference: on average it is worth zero.' },
        { es: 'Sí, porque siempre hay una opción correcta.', en: 'Yes, because there is always a correct option.' },
        { es: 'No: en promedio resta 0.5 puntos, peor que dejarla en blanco.', en: 'No: on average it subtracts 0.5 points, worse than leaving it blank.' },
      ],
      answer: 3,
      why: {
        es: 'Al azar se acierta 1 de cada 4 veces: 0.25 × 1 + 0.75 × (−1) = −0.5. Sin castigo al error (como en muchas evaluaciones de modelos), adivinar daría +0.25 y siempre convendría: por eso los modelos aprenden a adivinar en vez de decir «no lo sé».',
        en: 'At random you are right 1 time in 4: 0.25 × 1 + 0.75 × (−1) = −0.5. With no penalty for errors (as in many model evaluations), guessing would give +0.25 and would always pay: that is why models learn to guess instead of saying “I don’t know.”',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Tu empresa quiere un asistente que conteste a clientes sobre políticas de reembolso. ¿Qué diseño reduce más el riesgo de respuestas inventadas?', en: 'Your company wants an assistant that answers customers about refund policies. Which design most reduces the risk of invented answers?' },
      options: [
        { es: 'Usar el modelo más grande y pedirle que responda «solo si está seguro».', en: 'Use the largest model and ask it to answer “only if it is sure.”' },
        { es: 'Subir la temperatura para que sea más creativo.', en: 'Raise the temperature so it is more creative.' },
        { es: 'Recuperar la política vigente de tus documentos, exigir que la cite y añadir revisión humana en los casos de mayor monto.', en: 'Retrieve the current policy from your documents, require it to cite, and add human review for the larger amounts.' },
        { es: 'Reentrenarlo con todas las conversaciones pasadas, sin más controles.', en: 'Retrain it on all past conversations, with no other controls.' },
      ],
      answer: 2,
      why: {
        es: 'Dar el documento vigente y exigir la cita reduce la dependencia de la memoria del modelo, y la revisión proporcional al riesgo cubre lo que aún falle. Pedirle que se declare seguro no se puede verificar, y reentrenar no garantiza que deje de inventar. Y la empresa responde por lo que diga, como en el caso de Air Canada.',
        en: 'Handing over the current document and requiring a citation reduces reliance on the model’s memory, and risk-proportional review covers what still fails. Asking it to declare itself sure cannot be verified, and retraining does not guarantee it stops inventing. And the company answers for what it says, as in the Air Canada case.',
      },
    },
  ],

  glossary: ['language-model', 'autoregression', 'token', 'pretraining', 'base-model', 'rlhf', 'rag', 'grounding', 'tool-use', 'human-in-the-loop', 'hallucination', 'calibration', 'knowledge-cutoff', 'verification'],

  terms: [
    { id: 'hallucination', term: { es: 'Alucinación', en: 'Hallucination' }, def: { es: 'Respuesta fluida y segura de un modelo que es falsa o no está respaldada por ninguna fuente. Es consecuencia de predecir texto plausible, no de comprobar hechos.', en: 'A fluent, confident answer from a model that is false or backed by no source. It follows from predicting plausible text, not from checking facts.' } },
    { id: 'calibration', term: { es: 'Calibración', en: 'Calibration' }, def: { es: 'Grado en que la confianza de un sistema coincide con su frecuencia real de acierto: de las respuestas dadas con 70 % de confianza, debería acertar cerca del 70 %, como un buen pronóstico del clima.', en: 'How closely a system’s confidence matches how often it is actually right: of the answers given at 70% confidence, it should be right about 70% of the time, like a good weather forecast.' } },
    { id: 'knowledge-cutoff', term: { es: 'Corte de conocimiento', en: 'Knowledge cutoff' }, def: { es: 'Fecha a partir de la cual los datos de entrenamiento no incluyen más textos. El modelo no conoce lo posterior, salvo que se le dé como contexto, y no siempre avisa que no lo sabe.', en: 'The date after which the training data includes no more text. The model does not know what came later unless it is given as context, and it does not always warn that it does not know.' } },
    { id: 'verification', term: { es: 'Verificación', en: 'Verification' }, def: { es: 'Comprobar una respuesta en una fuente independiente (un documento, una base de datos, una persona experta) antes de actuar sobre ella; no en el mismo modelo. Su rigor debe ser proporcional al riesgo.', en: 'Checking an answer against an independent source (a document, a database, an expert) before acting on it; not against the same model. Its rigor should be proportional to the risk.' } },
  ],

  sources: [
    { title: 'Opinion and Order on Sanctions, Mata v. Avianca, Inc., No. 22-cv-1461 (PKC) (S.D.N.Y. June 22, 2023)', authors: 'Castel, P. K. (U.S. District Court, Southern District of New York)', year: 2023, url: 'https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.54.0.pdf' },
    { title: 'Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling', authors: 'Biderman, S. et al.', year: 2023, url: 'https://arxiv.org/abs/2304.01373' },
    { title: 'The Pile: An 800GB Dataset of Diverse Text for Language Modeling', authors: 'Gao, L. et al.', year: 2020, url: 'https://arxiv.org/abs/2101.00027' },
    { title: 'Pedro Páramo: diálogos en contrapunto (1955-2005)', authors: 'Jiménez de Báez, Y., Gutiérrez de Velasco, L. (eds.), El Colegio de México y Fundación para las Letras Mexicanas', year: 2008, url: 'https://repositorio.colmex.mx/downloads/5999n424n?locale=en' },
    { title: 'Why Language Models Hallucinate', authors: 'Kalai, A. T., Nachum, O., Vempala, S. S., Zhang, E.', year: 2025, url: 'https://arxiv.org/abs/2509.04664' },
    { title: 'Large Language Models Struggle to Learn Long-Tail Knowledge', authors: 'Kandpal, N., Deng, H., Roberts, A., Wallace, E., Raffel, C.', year: 2023, url: 'https://arxiv.org/abs/2211.08411' },
    { title: 'How Language Model Hallucinations Can Snowball', authors: 'Zhang, M., Press, O., Merrill, W., Liu, A., Smith, N. A.', year: 2023, url: 'https://arxiv.org/abs/2305.13534' },
    { title: 'FIFA World Cup Qatar 2022 (final: Argentina 3–3 France, 4–2 on penalties, December 18, 2022)', authors: 'FIFA', year: 2022, url: 'https://www.fifa.com/en/tournaments/mens/worldcup/qatar2022' },
    { title: 'Distrito Federal, Brasília: aspectos históricos', authors: 'IBGE (Instituto Brasileiro de Geografia e Estatística)', year: 2001, url: 'https://biblioteca.ibge.gov.br/visualizacao/dtb/brasilia/brasilia.pdf' },
    { title: 'Brown v. Board of Education (1954), 347 U.S. 483', authors: 'U.S. National Archives (Milestone Documents)', year: 1954, url: 'https://www.archives.gov/milestone-documents/brown-v-board-of-education' },
    { title: 'Marie Curie – Facts (Nobel Prize in Physics 1903)', authors: 'NobelPrize.org', year: 1903, url: 'https://www.nobelprize.org/prizes/physics/1903/marie-curie/facts/' },
    { title: 'Marie Curie – Facts (Nobel Prize in Chemistry 1911)', authors: 'NobelPrize.org', year: 1911, url: 'https://www.nobelprize.org/prizes/chemistry/1911/marie-curie/facts/' },
    { title: 'Insanity Is Doing the Same Thing Over and Over Again and Expecting Different Results', authors: 'O’Toole, G. (Quote Investigator)', year: 2017, url: 'https://quoteinvestigator.com/2017/03/23/same/' },
    { title: 'Deep learning', authors: 'LeCun, Y., Bengio, Y., Hinton, G. (Nature 521, 436–444)', year: 2015, url: 'https://doi.org/10.1038/nature14539' },
    { title: 'The Thinker', authors: 'Musée Rodin', year: 1880, url: 'https://www.musee-rodin.fr/en/musee/collections/oeuvres/thinker' },
    { title: 'On Calibration of Modern Neural Networks', authors: 'Guo, C., Pleiss, G., Sun, Y., Weinberger, K. Q.', year: 2017, url: 'https://arxiv.org/abs/1706.04599' },
    { title: 'GPT-4 Technical Report', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'On optimum recognition error and reject tradeoff', authors: 'Chow, C. K.', year: 1970, url: 'https://doi.org/10.1109/TIT.1970.1054406' },
    { title: 'TruthfulQA: Measuring How Models Mimic Human Falsehoods', authors: 'Lin, S., Hilton, J., Evans, O.', year: 2021, url: 'https://arxiv.org/abs/2109.07958' },
    { title: 'Detecting hallucinations in large language models using semantic entropy', authors: 'Farquhar, S., Kossen, J., Kuhn, L., Gal, Y.', year: 2024, url: 'https://doi.org/10.1038/s41586-024-07421-0' },
    { title: 'Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools', authors: 'Magesh, V., Surani, F., Dahl, M., Suzgun, M., Manning, C. D., Ho, D. E.', year: 2024, url: 'https://arxiv.org/abs/2405.20362' },
    { title: 'Moffatt v. Air Canada, 2024 BCCRT 149', authors: 'Civil Resolution Tribunal of British Columbia', year: 2024, url: 'https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html' },
  ],
});
