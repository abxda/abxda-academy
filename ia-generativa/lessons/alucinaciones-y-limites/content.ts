import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'alucinaciones-y-limites',

  objectives: {
    es: [
      'Explicar por qué un modelo de lenguaje puede dar una respuesta falsa con tono seguro, a partir de su objetivo: predecir texto plausible.',
      'Distinguir tres tipos de error (inventar, desactualizar, razonar mal) y leer una curva de calibración para decidir cuándo conviene que el sistema calle.',
      'Elegir mitigaciones y un nivel de verificación proporcional al riesgo de cada uso.',
    ],
    en: [
      'Explain why a language model can give a false answer in a confident tone, starting from its objective: predicting plausible text.',
      'Tell three kinds of error apart (inventing, going stale, reasoning badly) and read a calibration curve to decide when the system should stay silent.',
      'Choose mitigations and a level of verification proportional to the risk of each use.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'En dos mil veintitrés, un tribunal de Nueva York descubrió que un escrito citaba seis casos judiciales que nunca existieron. Los había generado ChatGPT.',
      en: 'In twenty twenty-three, a New York court discovered that a legal brief cited six court cases that never existed. ChatGPT had generated them.',
      tts: {
        es: 'En dos mil veintitrés, un tribunal de Nueva York descubrió que un escrito citaba seis casos judiciales que nunca existieron. Los había generado chat ge pe te.',
        en: 'In twenty twenty-three, a New York court discovered that a legal brief cited six court cases that never existed. Chat G P T had generated them.',
      },
      pad: 0.6,
    },
    {
      id: 'ask',
      es: 'Después, el abogado le preguntó a ChatGPT si uno de esos casos era real. Respondió que sí y que estaba en Westlaw y LexisNexis, bases de datos jurídicas.',
      en: 'Then the lawyer asked ChatGPT whether one of those cases was real. It replied that yes, it existed and could be found on Westlaw and LexisNexis, legal databases.',
      tts: {
        es: 'Después, el abogado le preguntó a chat ge pe te si uno de esos casos era real. Respondió que sí y que estaba en Westlaw y LexisNexis, bases de datos jurídicas.',
        en: 'Then the lawyer asked Chat G P T whether one of those cases was real. It replied that yes, it existed and could be found on Westlaw and LexisNexis, legal databases.',
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
    {
      id: 'recall',
      es: 'Recuerda: un modelo de lenguaje da una probabilidad a cada texto posible. Veámoslo en Pythia, un modelo real y pequeño, con una pregunta que sí domina: la capital de Australia.',
      en: 'Remember: a language model gives every possible piece of text a probability. Let us see it in Pythia, a small, real model, on a question it does master: the capital of Australia.',
      tts: {
        es: 'Recuerda: un modelo de lenguaje da una probabilidad a cada texto posible. Veámoslo en Pitia, un modelo real y pequeño, con una pregunta que sí domina: la capital de Australia.',
      },
      pad: 0.4,
    },
    {
      id: 'known',
      es: '«Canberra» recibe casi setenta por ciento. Sídney, la ciudad más famosa del país, recibe casi una quinta parte. Hay duda, pero la respuesta más probable es la correcta.',
      en: '“Canberra” gets almost seventy percent. Sydney, the country’s most famous city, gets nearly a fifth. There is doubt, but the most probable answer is the right one.',
      pad: 0.5,
    },
    {
      id: 'unknown',
      es: 'Ahora un dato menos frecuente: ¿quién escribió «Pedro Páramo»? La más probable apenas llega a cinco por ciento, y más de tres cuartas partes se reparten entre cientos de opciones. El modelo no sabe.',
      en: 'Now a less common fact: who wrote “Pedro Páramo”? The top option barely reaches five percent, and more than three quarters is spread across hundreds of others. The model does not know.',
      pad: 0.5,
    },
    {
      id: 'must',
      es: 'Pero un modelo siempre debe elegir. Toma «Pablo» y después «Neruda»: nombre y apellido, con soltura, y totalmente inventado. La novela es de Juan Rulfo, que recibió una milésima.',
      en: 'But a model always has to pick something. It takes “Pablo” and then “Neruda”: first and last name, smoothly, and entirely made up. The novel is by Juan Rulfo, who got one in a thousand.',
      pad: 0.6,
    },
    {
      id: 'noidk',
      es: '¿Por qué no responde «no lo sé»? Esa frase solo saldría si fuera una continuación probable, y aquí su probabilidad es casi cero. Decir que no se sabe también hay que aprenderlo.',
      en: 'Why does it not say “I don’t know”? That phrase would only appear if it were a likely continuation, and here its probability is nearly zero. Saying you do not know is also something to be learned.',
      pad: 0.5,
    },
    {
      id: 'objective',
      es: 'La causa está en el objetivo de entrenamiento: predecir la palabra que sigue en textos reales. Eso premia lo plausible, y nada en el proceso comprueba si algo es verdad.',
      en: 'The cause is in the training objective: predicting the next word in real texts. That rewards what is plausible, and nothing in the process checks whether something is true.',
      note: { es: 'Se entrena para lo plausible; nada comprueba lo verdadero.', en: 'Trained for the plausible; nothing checks the true.' },
      pad: 0.5,
    },
    {
      id: 'rare',
      es: 'Hay un segundo motivo. El estilo y la gramática aparecen millones de veces y se aprenden bien. Un dato suelto, como el autor de un libro poco leído, quizá aparece una sola vez.',
      en: 'There is a second reason. Style and grammar appear millions of times and are learned well. A single fact, like the author of a little-read book, may appear only once.',
      pad: 0.5,
    },
    {
      id: 'bound',
      es: 'Un análisis de dos mil veinticinco lo formaliza: si una quinta parte de ciertos datos aparece una sola vez, un modelo base alucinará, se espera, al menos en esa quinta parte.',
      en: 'A twenty twenty-five analysis makes it precise: if a fifth of some kind of facts appears only once, a base model is expected to hallucinate on at least that fifth.',
      pad: 0.5,
    },
    {
      id: 'snowball',
      es: 'Y como el modelo escribe palabra tras palabra, lo que ya escribió se vuelve contexto. Tras «Neruda», describe el libro como «una colección de poemas»: coherente con Neruda, falso sobre el libro.',
      en: 'And because the model writes word after word, what it already wrote becomes context. After “Neruda,” it describes the book as “a collection of poems”: consistent with Neruda, false about the book.',
      pad: 0.6,
    },
    {
      id: 'types',
      es: 'Conviene distinguir tres familias de error, porque se corrigen distinto. Primera: inventar. El dato no está en el modelo y este lo fabrica, como el autor de Pedro Páramo o los casos de Nueva York.',
      en: 'It helps to tell three families of error apart, because each is fixed differently. First: making things up. The fact is not in the model, so it manufactures one, like the author of Pedro Páramo or the New York cases.',
      note: { es: 'Tres errores: inventar, desactualizar y razonar mal.', en: 'Three errors: inventing, going stale, and reasoning badly.' },
      pad: 0.5,
    },
    {
      id: 'stale',
      es: 'Segunda: lo desactualizado. El conocimiento se congela en el corte de conocimiento, la fecha de los datos. Y lo viejo queda: Pythia dice que la capital de Brasil es Río de Janeiro, que dejó de serlo en mil novecientos sesenta.',
      en: 'Second: out of date. Its knowledge freezes at the knowledge cutoff, the date of its data. And old facts linger: Pythia says Brazil’s capital is Rio de Janeiro, which stopped being the capital in nineteen sixty.',
      tts: {
        es: 'Segunda: lo desactualizado. El conocimiento se congela en el corte de conocimiento, la fecha de los datos. Y lo viejo queda: Pitia dice que la capital de Brasil es Río de Janeiro, que dejó de serlo en mil novecientos sesenta.',
      },
      pad: 0.5,
    },
    {
      id: 'reason',
      es: 'Tercera: el razonamiento. Los datos pueden ser correctos y fallar la cadena de pasos. Al multiplicar tres cifras por dos, Pythia falló las cuarenta veces, aunque a veces el tamaño del número es correcto.',
      en: 'Third: reasoning. The facts can be right while the chain of steps fails. Multiplying three digits by two, Pythia was wrong all forty times, though the size of the number is sometimes right.',
      tts: {
        es: 'Tercera: el razonamiento. Los datos pueden ser correctos y fallar la cadena de pasos. Al multiplicar tres cifras por dos, Pitia falló las cuarenta veces, aunque a veces el tamaño del número es correcto.',
      },
      pad: 0.5,
    },
    {
      id: 'try1',
      es: 'Un modelo suena igual sepa o invente. Tu turno: decide si cada una de estas seis afirmaciones, al estilo de un asistente, es verdadera o inventada, y qué tan seguro estás.',
      en: 'A model sounds the same whether it knows or invents. Your turn: decide whether each of these six statements, in an assistant’s style, is true or invented, and how sure you are.',
      gate: {
        id: 'game',
        prompt: { es: 'Responde las seis afirmaciones.', en: 'Answer all six statements.' },
      },
      pad: 0.4,
    },
    {
      id: 'game-after',
      es: 'Ninguna traía señal de falsedad: todas tenían nombres, fechas y tono de autoridad. Lo que las separó fue lo que sabías o pudiste comprobar; y un modelo escribe igual de seguro cuando inventa.',
      en: 'None carried a sign of falsehood: all had names, dates, and an authoritative tone. What set them apart was what you knew or could check; and a model writes just as confidently when it invents.',
      pad: 0.5,
    },
    {
      id: 'calib',
      es: 'Un sistema está calibrado si su confianza coincide con su acierto: con sesenta por ciento de confianza, acierta unas seis de cada diez veces. Midámoslo en Pythia, con cuatrocientas veinticuatro preguntas.',
      en: 'A system is calibrated if its confidence matches its accuracy: at sixty percent confidence, it is right about six times in ten. Let us measure it on Pythia, with four hundred twenty-four questions.',
      tts: {
        es: 'Un sistema está calibrado si su confianza coincide con su acierto: con sesenta por ciento de confianza, acierta unas seis de cada diez veces. Midámoslo en Pitia, con cuatrocientas veinticuatro preguntas.',
      },
      note: { es: 'Calibración: la confianza coincide con la frecuencia de acierto.', en: 'Calibration: confidence matches how often it is right.' },
      pad: 0.8,
    },
    {
      id: 'signal',
      es: 'La señal es clara: con menos de diez por ciento acierta una de cada siete; con más de noventa, las ciento siete. Los errores seguros son pocos, pero hay seis con más de la mitad.',
      en: 'The signal is clear: below ten percent it is right one time in seven; above ninety percent it got all one hundred seven. Confident errors are few, but six had more than one half.',
      pad: 0.6,
    },
    {
      id: 'hidden',
      es: 'Pero tú no ves esas probabilidades: un chat muestra solo el texto elegido. Según el informe técnico de GPT-4, el modelo preentrenado estaba bien calibrado y el ajuste posterior redujo esa calibración.',
      en: 'But you do not see those probabilities: a chat shows only the chosen text. According to the GPT-4 technical report, the pretrained model was well calibrated and the later tuning reduced that calibration.',
      tts: {
        es: 'Pero tú no ves esas probabilidades: un chat muestra solo el texto elegido. Según el informe técnico de ge pe te cuatro, el modelo preentrenado estaba bien calibrado y el ajuste posterior redujo esa calibración.',
        en: 'But you do not see those probabilities: a chat shows only the chosen text. According to the G P T four technical report, the pretrained model was well calibrated and the later tuning reduced that calibration.',
      },
      note: { es: 'La duda existe dentro del modelo, pero el chat no la muestra.', en: 'The doubt exists inside the model, but the chat does not show it.' },
      pad: 0.5,
    },
    {
      id: 'scale',
      es: '¿Se arregla con más tamaño? Ayuda mucho en estas preguntas fáciles: de cuarenta y dos por ciento con cuatrocientos diez millones de parámetros a noventa y cuatro con doce mil millones. Ninguno llega a cien.',
      en: 'Does more size fix it? It helps a lot on these easy questions: from forty-two percent at four hundred ten million parameters to ninety-four at twelve billion. None reaches one hundred.',
      pad: 0.6,
    },
    {
      id: 'abstain',
      es: 'Si conocemos la confianza, podemos exigir un mínimo: por debajo del umbral, el sistema responde «no lo sé» en lugar de adivinar.',
      en: 'If we know the confidence, we can demand a minimum: below the threshold, the system answers “I don’t know” instead of guessing.',
      pad: 0.5,
    },
    {
      id: 'cost',
      es: 'Sin umbral, Pythia responde todo y falla algo más de una de cada cuatro. Con el umbral en la mitad, falla dos y medio por ciento, pero calla ante más de cuatro de cada diez.',
      en: 'With no threshold, Pythia answers everything and is wrong a little over one time in four. With the threshold at one half, it is wrong two and a half percent of the time, but stays silent on more than four in ten.',
      pad: 0.6,
    },
    {
      id: 'try2',
      es: 'Tu turno: cada acierto suma uno, cada error resta k y callar vale cero. Elige k y mueve el umbral hasta acercarte al mejor puntaje, con dos valores de k distintos.',
      en: 'Your turn: each right answer adds one, each error subtracts k, and staying silent is worth zero. Choose k and move the threshold until you get close to the best score, with two different values of k.',
      gate: {
        id: 'thr',
        prompt: { es: 'Acércate al mejor puntaje con dos valores distintos de k.', en: 'Get close to the best score with two different values of k.' },
      },
      pad: 0.4,
    },
    {
      id: 'after-b',
      es: 'Cuanto más caro es el error, más a la derecha queda el mejor umbral. No coincide con la regla teórica, porque la probabilidad cruda no está calibrada: el umbral se mide con tus datos.',
      en: 'The costlier the error, the further right the best threshold sits. And it does not match the textbook rule, because this model’s raw probability is not calibrated: the threshold is measured on your data.',
      note: { es: 'El umbral lo fija el costo del error y se mide con datos propios.', en: 'The threshold is set by the cost of an error and measured on your own data.' },
      pad: 0.5,
    },
    {
      id: 'mit-ground',
      es: 'No se elimina, se gestiona. Primera palanca: darle el documento. Con recuperación de información, lección treinta y uno, el modelo responde con textos que le pasas y puede citarlos.',
      en: 'It cannot be eliminated, only managed. First lever: hand it the document. With retrieval, lesson thirty-one, the model answers from texts you give it and can cite them.',
      pad: 0.5,
    },
    {
      id: 'mit-tools',
      es: 'Segunda: herramientas. Una calculadora, una consulta a una base de datos, un buscador. El dato lo produce un sistema determinista; el modelo solo lo pide y lo comunica.',
      en: 'Second: tools. A calculator, a database query, a search engine. A deterministic system produces the fact; the model only asks for it and reports it.',
      pad: 0.5,
    },
    {
      id: 'mit-limit',
      es: 'Tercera: acotar la salida. Si la respuesta debe ser uno de diez códigos válidos, el modelo no puede inventar un undécimo. Y pedirle fuentes solo sirve si alguien las comprueba.',
      en: 'Third: constrain the output. If the answer must be one of ten valid codes, the model cannot invent an eleventh. And asking it for sources only helps if someone checks them.',
      pad: 0.5,
    },
    {
      id: 'mit-verify',
      es: 'Cuarta: verificación humana, proporcional al riesgo. Un borrador interno se revisa por muestreo; una cita legal o una cifra para un cliente se comprueba, una por una, contra la fuente.',
      en: 'Fourth: human verification, proportional to risk. An internal draft is spot-checked; a legal citation or a figure for a client is checked, one by one, against the source.',
      note: { es: 'Verifica en proporción al riesgo de equivocarse.', en: 'Verify in proportion to the risk of being wrong.' },
      pad: 0.6,
    },
    {
      id: 'evidence',
      es: 'Ninguna basta sola. En un estudio de dos mil veinticuatro, herramientas jurídicas con recuperación de documentos alucinaron entre diecisiete y treinta y tres por ciento: menos que un modelo solo, no cero.',
      en: 'None is enough alone. In a twenty twenty-four study, legal research tools that retrieve documents hallucinated between seventeen and thirty-three percent of the time: less than a model alone, but far from zero.',
      pad: 0.5,
    },
    {
      id: 'accountability',
      es: 'Y la responsabilidad no se delega. En dos mil veinticuatro, un tribunal de Columbia Británica ordenó a Air Canada pagar por lo que dijo su chatbot, y rechazó que este respondiera por su cuenta.',
      en: 'And accountability cannot be delegated. In twenty twenty-four, a British Columbia tribunal ordered Air Canada to pay for what its chatbot said, and rejected the idea that the bot answered for itself.',
      pad: 0.5,
    },
    {
      id: 'truthfulqa',
      es: 'TruthfulQA, de dos mil veintiuno, plantea ochocientas diecisiete preguntas que invitan a repetir falsedades populares. El mejor modelo de entonces fue veraz en cincuenta y ocho por ciento; las personas, en noventa y cuatro.',
      en: 'TruthfulQA, from twenty twenty-one, poses eight hundred seventeen questions that invite repeating popular falsehoods. The best model then was truthful on fifty-eight percent; people, on ninety-four.',
      tts: {
        es: 'Truzful cu a, de dos mil veintiuno, plantea ochocientas diecisiete preguntas que invitan a repetir falsedades populares. El mejor modelo de entonces fue veraz en cincuenta y ocho por ciento; las personas, en noventa y cuatro.',
        en: 'Truthful Q A, from twenty twenty-one, poses eight hundred seventeen questions that invite repeating popular falsehoods. The best model then was truthful on fifty-eight percent; people, on ninety-four.',
      },
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo produce lo plausible, no lo verdadero; su duda existe, pero el texto no la muestra; y la verificación debe ser proporcional al riesgo de equivocarse.',
      en: 'In short: the model produces what is plausible, not what is true; its doubt exists, but the text does not show it; and verification must be proportional to the risk of being wrong.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Pero ¿cómo sabes si un sistema sirve para tu caso? Midiéndolo con casos tuyos, no con una demostración. Esa es la siguiente lección: evaluar sistemas de IA.',
      en: 'But how do you know whether a system works for your case? By measuring it on your own cases, not on a demo. That is the next lesson: evaluating AI systems.',
      tts: {
        es: 'Pero ¿cómo sabes si un sistema sirve para tu caso? Midiéndolo con casos tuyos, no con una demostración. Esa es la siguiente lección: evaluar sistemas de i a.',
        en: 'But how do you know whether a system works for your case? By measuring it on your own cases, not on a demo. That is the next lesson: evaluating A I systems.',
      },
    },
  ],

  keyIdeas: {
    es: [
      'Una alucinación es una respuesta fluida y segura que es falsa o carece de respaldo. Es consecuencia del objetivo de entrenamiento, no una avería ocasional.',
      'El modelo se entrena para lo plausible: ninguna parte del proceso comprueba la verdad, y «no lo sé» solo aparece si el modelo aprendió a decirlo.',
      'Los datos poco frecuentes se aprenden mal: un dato visto una sola vez no se aprende de forma fiable, y un error escrito se vuelve contexto para lo que sigue.',
      'La probabilidad interna informa (acierta más cuanto más alta), pero el chat no la muestra y no siempre está calibrada: el umbral para callar se mide con datos propios.',
      'Las mitigaciones reducen, no eliminan: documentos, herramientas, salidas acotadas y verificación proporcional al riesgo. La responsabilidad sigue siendo de quien despliega el sistema.',
    ],
    en: [
      'A hallucination is a fluent, confident answer that is false or unsupported. It follows from the training objective; it is not an occasional breakdown.',
      'The model is trained for the plausible: no part of the process checks truth, and “I don’t know” only appears if the model learned to say it.',
      'Rare facts are learned badly: a fact seen only once is not learned reliably, and a written error becomes context for what follows.',
      'The internal probability is informative (it is right more often when it is higher), but the chat does not show it and it is not always calibrated: the threshold for staying silent is measured on your own data.',
      'Mitigations reduce, not eliminate: documents, tools, constrained outputs, and verification proportional to risk. Responsibility stays with whoever deploys the system.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Si el modelo da detalles y suena seguro, probablemente lo sabe; y si le preguntas si se equivocó, te lo dirá.',
      en: 'If the model gives details and sounds sure, it probably knows; and if you ask whether it was wrong, it will tell you.',
    },
    right: {
      es: 'El tono seguro y los detalles son justo lo que mejor aprende, y no informan de la verdad. Preguntarle al mismo modelo no es una verificación independiente: el abogado de Nueva York lo hizo. Se comprueba contra una fuente.',
      en: 'A confident tone and rich detail are exactly what it learns best, and they say nothing about truth. Asking the same model is not an independent check: the New York lawyer did it. You check against a source.',
    },
  },

  deeper: {
    es: `## Qué optimiza el entrenamiento

El preentrenamiento minimiza la entropía cruzada sobre texto real:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_\\theta(x_t \\mid x_{<t})$$

La pérdida baja cuando el modelo da alta probabilidad a la pieza que de verdad siguió en el texto. En la fórmula no hay ninguna variable «verdad»: si el texto contiene un error, el objetivo lo premia igual. Después, el ajuste con preferencias humanas (RLHF, lección 28) añade otra señal y puede cambiar la calibración: el informe técnico de GPT-4 (OpenAI, 2023) muestra que el modelo preentrenado estaba bien calibrado en preguntas de opción múltiple y que tras el ajuste esa calibración se reducía.

## Los datos vistos una sola vez

Kalai, Nachum, Vempala y Zhang (2025) formalizan el efecto. Sea $s_r$ la fracción de los ejemplos de entrenamiento que aparecen exactamente una vez (la «tasa de singletons», que viene del estimador de masa faltante de Good y Turing). Para hechos arbitrarios, sin un patrón que generalizar (como un cumpleaños), el error de un modelo cumple, con probabilidad al menos 99 %,

$$\\text{err} \\;\\ge\\; s_r \\;-\\; \\frac{2}{\\min_c |E_c|} \\;-\\; \\frac{35 + 6\\ln N}{\\sqrt{N}} \\;-\\; \\delta$$

donde $N$ es el número de ejemplos, $E_c$ el conjunto de respuestas erróneas plausibles para el contexto $c$ y $\\delta$ mide la descalibración. En palabras: si una quinta parte de los hechos de un tipo aparece una sola vez, se espera al menos esa quinta parte de alucinaciones sobre ellos, menos términos pequeños. Es un resultado teórico para hechos sin estructura; no predice la tasa de un modelo concreto. Kandpal et al. (2023) lo observan en la práctica: la exactitud en preguntas de datos crece con el número de documentos de preentrenamiento relacionados con la pregunta.

## Calibración y error de calibración esperado

Se reparten las $N$ respuestas en $B$ tramos por confianza. Con $n_b$ respuestas en el tramo $b$, su acierto medio $\\mathrm{acc}(b)$ y su confianza media $\\mathrm{conf}(b)$:

$$\\mathrm{ECE} = \\sum_{b=1}^{B} \\frac{n_b}{N}\\,\\bigl|\\mathrm{acc}(b) - \\mathrm{conf}(b)\\bigr|$$

(Guo et al., 2017). Con diez tramos de igual ancho, las cuatrocientas veinticuatro preguntas de la lección dan un ECE de ≈ 0,18 para Pythia-1.4B. Casi todo el error viene de la subconfianza: sus respuestas aciertan más de lo que su probabilidad indica, en parte porque la probabilidad de una cadena reparte la masa entre formas de escribir lo mismo («Cervantes», «Miguel de Cervantes»). Farquhar et al. (2024) agrupan las respuestas por significado (entropía semántica) para corregir ese efecto.

Los datos de la lección son mediciones propias, no un banco de pruebas publicado: 424 preguntas de cultura general escritas para la lección (capitales, autores, fechas, símbolos químicos…), en inglés, con cinco ejemplos resueltos en el prompt y decodificación voraz. La «confianza» es la probabilidad de la cadena completa de la respuesta. Son preguntas fáciles para un modelo de internet: con datos realmente raros, el error sería mayor.

## Responder o callar

Si acertar suma 1, fallar resta $k$ y callar vale 0, y la probabilidad de acertar es $p$, responder vale en promedio $p - k(1-p)$. Conviene responder cuando

$$p > \\frac{k}{1+k}$$

que es la regla de rechazo de Chow (1970). Con $k = 1, 3, 9, 19$ el umbral es $0{,}5;\\ 0{,}75;\\ 0{,}9;\\ 0{,}95$. La regla vale si $p$ está calibrada. Con la probabilidad cruda de Pythia los mejores umbrales medidos son menores, justamente por su subconfianza: hay que recalibrar (por ejemplo, con escalado por temperatura, Guo et al., 2017) o fijar el umbral directamente sobre datos propios, que es lo que haces en el segundo turno. Kalai et al. (2025) proponen llevar esta regla a las evaluaciones de los modelos: indicar en la instrucción un umbral de confianza $t$ y penalizar cada error con $t/(1-t)$ puntos, es decir, $k = t/(1-t)$, de modo que contestar «no lo sé» valga 0 y adivinar deje de convenir cuando la confianza es baja.

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


def mejor_umbral(conf, ok, k):
    """Responder suma 1 si acierta y resta k si falla; callar vale 0. Devuelve (umbral, puntaje)."""
    mejor = (None, float("-inf"))
    for umbral in [0.0] + sorted(conf):
        puntaje = sum(1 if o else -k for c, o in zip(conf, ok) if c >= umbral)
        if puntaje > mejor[1]:
            mejor = (umbral, puntaje)
    return mejor


conf = [0.97, 0.91, 0.83, 0.62, 0.55, 0.38, 0.31, 0.22, 0.12, 0.08]
ok   = [1,    1,    1,    1,    0,    1,    0,    0,    1,    0]
print(tramos(conf, ok))
# (0.211, [(2, 0.1, 0.5), (3, 0.3, 0.33), (1, 0.55, 0.0), (1, 0.62, 1.0), (3, 0.9, 1.0)])
print(mejor_umbral(conf, ok, k=1))   # (0.38, 4)
print(mejor_umbral(conf, ok, k=9))   # (0.62, 4)
\`\`\`

## Lo que viene

La recuperación de documentos (lección 31) ataca el origen del problema: que el dato falte en la memoria del modelo. Evaluar un sistema con casos propios, y no con una demostración, es la lección 34. Los riesgos que van más allá de la calidad (privacidad, inyección de instrucciones, responsabilidad) están en la lección 35.`,
    en: `## What training optimizes

Pretraining minimizes cross-entropy on real text:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_\\theta(x_t \\mid x_{<t})$$

The loss goes down when the model gives high probability to the piece that actually followed in the text. There is no “truth” variable in the formula: if the text contains an error, the objective rewards it all the same. Afterwards, tuning with human preferences (RLHF, lesson 28) adds another signal and can change calibration: the GPT-4 technical report (OpenAI, 2023) shows that the pretrained model was well calibrated on multiple-choice questions and that after tuning that calibration was reduced.

## Facts seen only once

Kalai, Nachum, Vempala, and Zhang (2025) formalize the effect. Let $s_r$ be the fraction of training examples that appear exactly once (the “singleton rate,” which comes from the Good–Turing missing-mass estimator). For arbitrary facts, with no pattern to generalize (like a birthday), the error of a model satisfies, with probability at least 99%,

$$\\text{err} \\;\\ge\\; s_r \\;-\\; \\frac{2}{\\min_c |E_c|} \\;-\\; \\frac{35 + 6\\ln N}{\\sqrt{N}} \\;-\\; \\delta$$

where $N$ is the number of examples, $E_c$ the set of plausible wrong answers for context $c$, and $\\delta$ measures miscalibration. In words: if a fifth of the facts of some kind appears only once, you expect at least that fifth to be hallucinated, minus small terms. It is a theoretical result for facts with no structure; it does not predict the rate of a specific model. Kandpal et al. (2023) observe it in practice: accuracy on factual questions grows with the number of pretraining documents related to the question.

## Calibration and expected calibration error

Split the $N$ answers into $B$ bins by confidence. With $n_b$ answers in bin $b$, its mean accuracy $\\mathrm{acc}(b)$ and mean confidence $\\mathrm{conf}(b)$:

$$\\mathrm{ECE} = \\sum_{b=1}^{B} \\frac{n_b}{N}\\,\\bigl|\\mathrm{acc}(b) - \\mathrm{conf}(b)\\bigr|$$

(Guo et al., 2017). With ten equal-width bins, the lesson’s four hundred twenty-four questions give an ECE of ≈ 0.18 for Pythia-1.4B. Almost all of the error is under-confidence: its answers are right more often than its probability says, partly because the probability of a string splits the mass among ways of writing the same thing (“Cervantes,” “Miguel de Cervantes”). Farquhar et al. (2024) group answers by meaning (semantic entropy) to correct that effect.

The lesson’s data are our own measurements, not a published benchmark: 424 general-knowledge questions written for the lesson (capitals, authors, dates, chemical symbols…), in English, with five solved examples in the prompt and greedy decoding. “Confidence” is the probability of the whole answer string. They are easy questions for a model trained on the internet: with truly rare facts, the error would be higher.

## Answer or stay silent

If being right adds 1, being wrong subtracts $k$, and staying silent is worth 0, and the probability of being right is $p$, answering is worth $p - k(1-p)$ on average. It pays to answer when

$$p > \\frac{k}{1+k}$$

which is Chow’s reject rule (1970). With $k = 1, 3, 9, 19$ the threshold is $0.5,\\ 0.75,\\ 0.9,\\ 0.95$. The rule holds if $p$ is calibrated. With Pythia’s raw probability the best measured thresholds are lower, precisely because of its under-confidence: you must recalibrate (for example, with temperature scaling, Guo et al., 2017) or set the threshold directly on your own data, which is what you do in the second turn. Kalai et al. (2025) propose bringing this rule into model evaluations: state a confidence threshold $t$ in the instructions and penalize each error with $t/(1-t)$ points, that is, $k = t/(1-t)$, so that answering “I don’t know” is worth 0 and guessing stops paying when confidence is low.

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


def best_threshold(conf, ok, k):
    """Answering adds 1 if right and subtracts k if wrong; silence is worth 0. Returns (threshold, score)."""
    best = (None, float("-inf"))
    for threshold in [0.0] + sorted(conf):
        score = sum(1 if o else -k for c, o in zip(conf, ok) if c >= threshold)
        if score > best[1]:
            best = (threshold, score)
    return best


conf = [0.97, 0.91, 0.83, 0.62, 0.55, 0.38, 0.31, 0.22, 0.12, 0.08]
ok   = [1,    1,    1,    1,    0,    1,    0,    0,    1,    0]
print(bins(conf, ok))
# (0.211, [(2, 0.1, 0.5), (3, 0.3, 0.33), (1, 0.55, 0.0), (1, 0.62, 1.0), (3, 0.9, 1.0)])
print(best_threshold(conf, ok, k=1))   # (0.38, 4)
print(best_threshold(conf, ok, k=9))   # (0.62, 4)
\`\`\`

## What comes next

Retrieval (lesson 31) attacks the root of the problem: the fact missing from the model’s memory. Evaluating a system on your own cases, not on a demo, is lesson 34. The risks that go beyond quality (privacy, prompt injection, accountability) are in lesson 35.`,
  },

  lens: {
    es: [
      'Clasifica cada uso por el costo de un error y la facilidad de verificarlo. Un borrador interno tolera errores; una cifra para un cliente, una cita legal o un dato médico, no. Pon la revisión humana donde el error cuesta.',
      'No aceptes «el modelo dice estar seguro» ni «le pregunté si era correcto» como verificación: la seguridad del tono no informa de la verdad. Pide fuentes que se puedan comprobar y, donde importe, revisión contra la fuente.',
      'Pregunta al proveedor: ¿qué tasa de error se midió en MIS casos?, ¿puede abstenerse y con qué umbral?, ¿cita fuentes verificables?, ¿cuál es su corte de conocimiento? Una demostración sin tasa de error no es evidencia.',
      'La responsabilidad es tuya: el caso Air Canada (2024, un tribunal de reclamos menores de Columbia Británica) muestra que una empresa responde por lo que dice su chatbot. Define un dueño, un registro de respuestas, una vía de corrección y un punto de escalamiento a una persona.',
    ],
    en: [
      'Classify each use by the cost of an error and how easy it is to verify. An internal draft tolerates errors; a figure for a client, a legal citation, or a medical fact does not. Put human review where an error is costly.',
      'Do not accept “the model says it is sure” or “I asked whether it was correct” as verification: a confident tone says nothing about truth. Ask for sources that can be checked and, where it matters, review against the source.',
      'Ask the vendor: what error rate was measured on MY cases? Can it abstain, and at what threshold? Does it cite verifiable sources? What is its knowledge cutoff? A demo without an error rate is not evidence.',
      'Accountability is yours: the Air Canada case (2024, a small-claims tribunal in British Columbia) shows that a company answers for what its chatbot says. Define an owner, a log of answers, a way to correct them, and an escalation point to a person.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué un modelo de lenguaje puede dar una respuesta falsa con tono seguro?', en: 'Why can a language model give a false answer in a confident tone?' },
      options: [
        { es: 'Porque a veces decide engañar para parecer más útil.', en: 'Because it sometimes decides to deceive in order to seem more helpful.' },
        { es: 'Porque se entrenó para producir texto plausible, y nada en ese objetivo comprueba que sea verdad.', en: 'Because it was trained to produce plausible text, and nothing in that objective checks that it is true.' },
        { es: 'Porque solo ha leído textos falsos.', en: 'Because it has only read false texts.' },
        { es: 'Porque tiene un error de programación que se corregirá en la próxima versión.', en: 'Because it has a programming bug that will be fixed in the next version.' },
      ],
      answer: 1,
      why: {
        es: 'El objetivo premia lo plausible. Cuando el dato falta o es raro, el modelo igual debe elegir una pieza de texto, y suena igual de seguro. No hay intención de engañar ni una avería puntual: es consecuencia de cómo se entrena.',
        en: 'The objective rewards the plausible. When the fact is missing or rare, the model still has to pick a piece of text, and it sounds just as sure. There is no intent to deceive and no one-off breakdown: it follows from how it is trained.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Un sistema dice tener noventa por ciento de confianza en cien respuestas y acierta sesenta. ¿Qué indica?', en: 'A system claims ninety percent confidence on one hundred answers and is right on sixty. What does that indicate?' },
      options: [
        { es: 'Que está bien calibrado.', en: 'That it is well calibrated.' },
        { es: 'Que debería responder siempre, sin umbral.', en: 'That it should always answer, with no threshold.' },
        { es: 'Que está subconfiado: acierta más de lo que cree.', en: 'That it is under-confident: it is right more often than it thinks.' },
        { es: 'Que está sobreconfiado: su confianza supera su acierto.', en: 'That it is over-confident: its confidence exceeds its accuracy.' },
      ],
      answer: 3,
      why: {
        es: 'Calibrado sería acertar cerca de noventa de cien. Aquí la confianza declarada (90 %) supera el acierto real (60 %): está sobreconfiado, y un umbral basado en esa confianza dejaría pasar demasiados errores.',
        en: 'Calibrated would be getting about ninety out of one hundred. Here the stated confidence (90%) exceeds the real accuracy (60%): it is over-confident, and a threshold based on that confidence would let too many errors through.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'Cada acierto suma 1 punto, cada error resta 9 y callar vale 0. Si la confianza calibrada de una respuesta es 80 %, ¿conviene darla?', en: 'Each right answer adds 1 point, each error subtracts 9, and staying silent is worth 0. If the calibrated confidence of an answer is 80%, should it be given?' },
      options: [
        { es: 'Sí: el puntaje esperado es +0,8.', en: 'Yes: the expected score is +0.8.' },
        { es: 'Sí, porque acierta más veces de las que falla.', en: 'Yes, because it is right more often than wrong.' },
        { es: 'No: el puntaje esperado es −1,0, peor que callar.', en: 'No: the expected score is −1.0, worse than staying silent.' },
        { es: 'Da igual: el puntaje esperado es cero.', en: 'It makes no difference: the expected score is zero.' },
      ],
      answer: 2,
      why: {
        es: 'Puntaje esperado = 0,8 × 1 + 0,2 × (−9) = 0,8 − 1,8 = −1,0. Solo conviene responder si p > k/(1 + k) = 9/10 = 90 %.',
        en: 'Expected score = 0.8 × 1 + 0.2 × (−9) = 0.8 − 1.8 = −1.0. Answering only pays if p > k/(1 + k) = 9/10 = 90%.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Tu empresa quiere un asistente que conteste a clientes sobre políticas de reembolso. ¿Qué diseño reduce más el riesgo de respuestas inventadas?', en: 'Your company wants an assistant that answers customers about refund policies. Which design most reduces the risk of invented answers?' },
      options: [
        { es: 'Recuperar la política vigente de tus documentos, exigir que la cite y añadir revisión humana en los casos de mayor monto.', en: 'Retrieve the current policy from your documents, require it to cite, and add human review for the larger amounts.' },
        { es: 'Usar el modelo más grande y pedirle que responda «solo si está seguro».', en: 'Use the largest model and ask it to answer “only if it is sure.”' },
        { es: 'Subir la temperatura para que sea más creativo.', en: 'Raise the temperature so it is more creative.' },
        { es: 'Reentrenarlo con todas las conversaciones pasadas, sin más controles.', en: 'Retrain it on all past conversations, with no other controls.' },
      ],
      answer: 0,
      why: {
        es: 'Dar el documento vigente y exigir cita reduce la dependencia de la memoria del modelo, y la revisión proporcional al riesgo cubre lo que aún falle. Pedirle que se declare seguro no se puede verificar, y reentrenar no garantiza que deje de inventar.',
        en: 'Handing over the current document and requiring a citation reduces reliance on the model’s memory, and risk-proportional review covers what still fails. Asking it to declare itself sure cannot be verified, and retraining does not guarantee it stops inventing.',
      },
    },
  ],

  glossary: ['language-model', 'autoregression', 'token', 'pretraining', 'base-model', 'rlhf', 'rag', 'grounding', 'tool-use', 'human-in-the-loop', 'hallucination', 'calibration', 'knowledge-cutoff', 'verification'],

  terms: [
    { id: 'hallucination', term: { es: 'Alucinación', en: 'Hallucination' }, def: { es: 'Respuesta fluida y segura de un modelo que es falsa o no está respaldada por ninguna fuente. Es consecuencia de predecir texto plausible, no de comprobar hechos.', en: 'A fluent, confident answer from a model that is false or backed by no source. It follows from predicting plausible text, not from checking facts.' } },
    { id: 'calibration', term: { es: 'Calibración', en: 'Calibration' }, def: { es: 'Grado en que la confianza de un sistema coincide con su frecuencia real de acierto: de las respuestas con 60 % de confianza, acierta cerca de 60 %.', en: 'How closely a system’s confidence matches how often it is actually right: of the answers with 60% confidence, it is right about 60% of the time.' } },
    { id: 'knowledge-cutoff', term: { es: 'Corte de conocimiento', en: 'Knowledge cutoff' }, def: { es: 'Fecha a partir de la cual los datos de entrenamiento no incluyen más textos. El modelo no conoce lo posterior, salvo que se le dé como contexto.', en: 'The date after which the training data includes no more text. The model does not know what came later unless it is given as context.' } },
    { id: 'verification', term: { es: 'Verificación', en: 'Verification' }, def: { es: 'Comprobar una respuesta contra una fuente independiente (un documento, una base de datos, una persona experta) antes de actuar sobre ella. Su rigor debe ser proporcional al riesgo.', en: 'Checking an answer against an independent source (a document, a database, an expert) before acting on it. Its rigor should be proportional to the risk.' } },
  ],

  sources: [
    { title: 'Why Language Models Hallucinate', authors: 'Kalai, A. T., Nachum, O., Vempala, S. S., Zhang, E.', year: 2025, url: 'https://arxiv.org/abs/2509.04664' },
    { title: 'GPT-4 Technical Report', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'Opinion and Order on Sanctions, Mata v. Avianca, Inc., No. 22-cv-1461 (PKC) (S.D.N.Y. June 22, 2023)', authors: 'Castel, P. K. (U.S. District Court, Southern District of New York)', year: 2023, url: 'https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.54.0.pdf' },
    { title: 'TruthfulQA: Measuring How Models Mimic Human Falsehoods', authors: 'Lin, S., Hilton, J., Evans, O.', year: 2021, url: 'https://arxiv.org/abs/2109.07958' },
    { title: 'Moffatt v. Air Canada, 2024 BCCRT 149', authors: 'Civil Resolution Tribunal of British Columbia', year: 2024, url: 'https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html' },
    { title: 'Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools', authors: 'Magesh, V., Surani, F., Dahl, M., Suzgun, M., Manning, C. D., Ho, D. E.', year: 2024, url: 'https://arxiv.org/abs/2405.20362' },
    { title: 'How Language Model Hallucinations Can Snowball', authors: 'Zhang, M., Press, O., Merrill, W., Liu, A., Smith, N. A.', year: 2023, url: 'https://arxiv.org/abs/2305.13534' },
    { title: 'Large Language Models Struggle to Learn Long-Tail Knowledge', authors: 'Kandpal, N., Deng, H., Roberts, A., Wallace, E., Raffel, C.', year: 2023, url: 'https://arxiv.org/abs/2211.08411' },
    { title: 'On Calibration of Modern Neural Networks', authors: 'Guo, C., Pleiss, G., Sun, Y., Weinberger, K. Q.', year: 2017, url: 'https://arxiv.org/abs/1706.04599' },
    { title: 'Detecting hallucinations in large language models using semantic entropy', authors: 'Farquhar, S., Kossen, J., Kuhn, L., Gal, Y.', year: 2024, url: 'https://doi.org/10.1038/s41586-024-07421-0' },
    { title: 'On optimum recognition error and reject tradeoff', authors: 'Chow, C. K.', year: 1970, url: 'https://doi.org/10.1109/TIT.1970.1054406' },
    { title: 'Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling', authors: 'Biderman, S. et al.', year: 2023, url: 'https://arxiv.org/abs/2304.01373' },
  ],
});
