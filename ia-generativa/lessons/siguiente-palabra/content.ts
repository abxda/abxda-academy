import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'siguiente-palabra',

  objectives: {
    es: [
      'Explicar cómo escribe un modelo de lenguaje: da una probabilidad a cada palabra que puede seguir, elige una, la agrega al contexto y repite.',
      'Calcular probabilidades a partir de cuentas y con softmax, y predecir qué hacen la temperatura, top-k y top-p con ellas.',
      'Responder con honestidad a «¿cómo escribe un ensayo algo que solo predice?», incluido lo que esa respuesta no garantiza.',
    ],
    en: [
      'Explain how a language model writes: it gives a probability to every word that can come next, picks one, adds it to the context, and repeats.',
      'Compute probabilities from counts and with softmax, and predict what temperature, top-k, and top-p do to them.',
      'Answer honestly “how can something that only predicts write an essay?”, including what that answer does not guarantee.',
    ],
  },

  segments: [
    // ── qué es un modelo de lenguaje, con un ejemplo antes del nombre ──
    {
      id: 'hook',
      es: 'Escribe «el cielo es» y detente. ¿Qué palabra sigue? Seguro pensaste en «azul». Tal vez en «gris».',
      en: 'Type “the sky is” and stop. What word comes next? You probably thought of “blue.” Maybe “gray.”',
    },
    {
      id: 'guess',
      es: 'No hay una sola respuesta: unas palabras son más probables que otras. Una máquina puede hacer esa misma apuesta, con números.',
      en: 'There is no single answer: some words are more likely than others. A machine can make that same bet, with numbers.',
    },
    {
      id: 'bars',
      es: 'Así: azul, cincuenta por ciento; gris, veinticinco; grande y oscuro, doce punto cinco cada una. Entre todas suman cien por ciento.',
      en: 'Like this: blue, fifty percent; gray, twenty-five; big and dark, twelve point five each. Together they add up to one hundred percent.',
      pad: 0.3,
    },
    {
      id: 'lm',
      es: 'Un programa que, dado un texto, da una probabilidad a cada palabra que podría seguir se llama modelo de lenguaje. Los chatbots están construidos sobre uno.',
      en: 'A program that, given some text, gives a probability to every word that could come next is called a language model. Chatbots are built on top of one.',
      note: { es: 'Modelo de lenguaje: da una probabilidad a cada palabra que puede seguir.', en: 'Language model: it gives a probability to every word that can come next.' },
    },
    // ── contar: el modelo de n-gramas, pieza por pieza ──
    {
      id: 'text',
      es: '¿De dónde salen esos números? De leer. Nuestro modelo, diminuto, leyó solo este texto: ocho frases cortas, escritas para esta lección.',
      en: 'Where do those numbers come from? From reading. Our tiny model read only this text: eight short sentences, written for this lesson.',
    },
    {
      id: 'find',
      es: 'Para saber qué sigue a «es», buscamos cada vez que aparece en el texto. Aparece ocho veces.',
      en: 'To find out what follows “is,” we look for every time it appears in the text. It appears eight times.',
      pad: 0.3,
    },
    {
      id: 'next',
      es: 'Y anotamos la palabra que viene justo después. Azul sale cuatro veces; gris, dos; grande, una; y oscuro, una.',
      en: 'And we note the word that comes right after. Blue shows up four times; gray, twice; big, once; and dark, once.',
      pad: 0.4,
    },
    {
      id: 'divide',
      es: 'Para pasar de cuentas a probabilidades, dividimos cada cuenta entre el total, ocho. Azul: cuatro entre ocho, cincuenta por ciento. Son las barras del principio.',
      en: 'To turn counts into probabilities, we divide each count by the total, eight. Blue: four out of eight, fifty percent. Those are the bars from the start.',
      note: { es: 'Probabilidad = cuenta ÷ total.', en: 'Probability = count ÷ total.' },
      pad: 0.3,
    },
    {
      id: 'ngram',
      es: 'Contar qué palabra sigue a cuál se llama modelo de n-gramas. El nuestro es el más sencillo: solo mira una palabra hacia atrás, la última.',
      en: 'Counting which word follows which is called an n-gram model. Ours is the simplest kind: it looks only one word back, the last one.',
      tts: {
        es: 'Contar qué palabra sigue a cuál se llama modelo de ene gramas. El nuestro es el más sencillo: solo mira una palabra hacia atrás, la última.',
        en: 'Counting which word follows which is called an en-gram model. Ours is the simplest kind: it looks only one word back, the last one.',
      },
    },
    {
      id: 'rows',
      es: 'Y guarda una fila de cuentas para cada palabra del texto. Tras «el» viene «cielo» cinco veces de nueve. El punto también cuenta como una pieza.',
      en: 'And it keeps a row of counts for every word in the text. After “the” comes “sky” five times out of nine. The period also counts as a piece.',
      pad: 0.3,
    },
    // ── escribir: autorregresión ──
    {
      id: 'write1',
      es: 'Ahora, a escribir. El texto de partida, «el cielo es», se llama contexto. El modelo mira su última palabra, «es», y saca su fila de barras.',
      en: 'Now, let’s write. The starting text, “the sky is,” is called the context. The model looks at its last word, “is,” and pulls up its row of bars.',
    },
    {
      id: 'pick1',
      es: 'Elige una palabra, aquí «azul», y la agrega al final del texto. Cómo elige lo veremos en un momento.',
      en: 'It picks a word, here “blue,” and adds it to the end of the text. We will see how it picks in a moment.',
      pad: 0.3,
    },
    {
      id: 'autoreg',
      es: 'Ahora la última palabra es «azul», y su fila dice: punto, setenta y cinco por ciento; «y», veinticinco. La palabra nueva se volvió el contexto.',
      en: 'Now the last word is “blue,” and its row says: period, seventy-five percent; “and,” twenty-five. The new word has become the context.',
      pad: 0.3,
    },
    {
      id: 'autoreg-name',
      es: 'Mirar la última palabra, sacar sus barras, elegir una y agregarla. Y otra vez. Eso se llama autorregresión: cada palabra escrita se vuelve contexto.',
      en: 'Look at the last word, pull up its bars, pick one, append it. And again. That is called autoregression: every word written becomes context.',
      note: { es: 'Autorregresión: cada palabra escrita se vuelve parte del contexto.', en: 'Autoregression: every word written becomes part of the context.' },
      pad: 0.3,
    },
    {
      id: 'run',
      es: 'Míralo escribir solo, palabra por palabra. En cada vuelta cambia la última palabra, y con ella cambian las barras.',
      en: 'Watch it write on its own, word by word. On every turn the last word changes, and the bars change with it.',
      pad: 4,
    },
    {
      id: 'new-sentence',
      es: 'Escribió «de noche el mar es oscuro». Esa frase no está en el texto: el modelo unió pedazos de frases distintas.',
      en: 'It wrote “at night the sea is dark.” That sentence is not in the text: the model stitched together pieces of different sentences.',
      pad: 0.4,
    },
    // ── cómo elige: voraz o sortear ──
    {
      id: 'greedy-def',
      es: '¿Y cómo elige? La forma más simple es tomar siempre la palabra más probable. A eso se le llama elección voraz.',
      en: 'So how does it pick? The simplest way is to always take the most likely word. That is called the greedy choice.',
    },
    {
      id: 'greedy',
      es: 'Mira lo que pasa: el cielo es azul, punto; el cielo es azul, punto… Cae en un ciclo y repetiría lo mismo para siempre.',
      en: 'Watch what happens: the sky is blue, period; the sky is blue, period… It falls into a loop and would repeat the same thing forever.',
      pad: 1,
    },
    {
      id: 'sample',
      es: 'La otra forma es sortear, o muestrear, como en la lección quince. Cada palabra recibe un pedazo de esta franja, tan grande como su probabilidad.',
      en: 'The other way is to draw at random, or sample, as in lesson fifteen. Each word gets a slice of this strip, as big as its probability.',
      pad: 0.3,
    },
    {
      id: 'dart',
      es: 'Es como lanzar un dardo a ciegas: azul ocupa la mitad, así que sale más o menos la mitad de las veces; oscuro, una de cada ocho.',
      en: 'It is like throwing a dart blindfolded: blue covers half the strip, so it comes up about half the time; dark, one time in eight.',
      pad: 1,
    },
    {
      id: 'sample-runs',
      es: 'Sorteando, cada corrida escribe un texto distinto. Aquí van tres, todas desde «el cielo es».',
      en: 'When it samples, every run writes a different text. Here are three, all starting from “the sky is.”',
      pad: 1.5,
    },
    {
      id: 'try-gen',
      es: 'Si quieres, pulsa «Escribir otra vez» y compara: cada vez se vuelve a sortear cada palabra.',
      en: 'If you like, press “Write again” and compare: every word is drawn again each time.',
      gate: {
        id: 'gen',
        prompt: { es: 'pulsa «Escribir otra vez» y compara los textos.', en: 'press “Write again” and compare the texts.' },
      },
      pad: 0.4,
    },
    {
      id: 'same-q',
      es: 'Por eso un chatbot puede responder distinto a la misma pregunta: en cada palabra hay un sorteo.',
      en: 'That is why a chatbot can answer the same question differently: there is a draw at every word.',
      note: { es: 'Voraz: siempre la más probable. Sortear: un texto distinto en cada corrida.', en: 'Greedy: always the most likely. Sampling: a different text on every run.' },
    },
    // ── límites de contar; la red neuronal da puntajes ──
    {
      id: 'limit-short',
      es: 'Contar tiene límites. Como nuestro modelo solo mira la última palabra, tras «el sol es» propone lo mismo que tras «el cielo es»: azul, cincuenta por ciento.',
      en: 'Counting has limits. Since our model only looks at the last word, after “the sun is” it suggests the same as after “the sky is”: blue, fifty percent.',
      pad: 0.3,
    },
    {
      id: 'limit-unseen',
      es: 'Y ante una palabra que no está en su texto, como «océano», no tiene ni una cuenta: no sabe qué decir.',
      en: 'And faced with a word that is not in its text, like “ocean,” it has not a single count: it has nothing to say.',
      pad: 0.3,
    },
    {
      id: 'network',
      es: 'Los modelos de verdad cambian la tabla de cuentas por una red neuronal, como las de la parte uno. La red lee el contexto y da un puntaje a cada palabra posible.',
      en: 'Real models swap the table of counts for a neural network, like the ones in part one. The network reads the context and gives a score to every possible word.',
      pad: 0.3,
    },
    {
      id: 'embed',
      es: 'Y lee cada palabra como un embedding, igual que en la lección catorce. Si en otros textos «océano» se usa como «mar», sus vectores quedan cerca y la red responde parecido.',
      en: 'And it reads each word as an embedding, just like in lesson fourteen. If “ocean” is used like “sea” in other texts, their vectors end up close and the network answers alike.',
      pad: 0.3,
    },
    // ── softmax, con calma ──
    {
      id: 'scores',
      es: 'Para «el cielo es», imagina que la red da estos puntajes, elegidos para comparar: azul, cero punto siete; gris, cero; grande y oscuro, menos cero punto siete.',
      en: 'For “the sky is,” imagine the network gives these scores, chosen for comparison: blue, zero point seven; gray, zero; big and dark, minus zero point seven.',
      pad: 0.3,
    },
    {
      id: 'not-probs',
      es: 'Un puntaje todavía no es una probabilidad: puede ser negativo, y estos ni siquiera suman cien por ciento. Para convertirlos se usa una función: softmax.',
      en: 'A score is not yet a probability: it can be negative, and these do not even add up to one hundred percent. To convert them we use a function: softmax.',
    },
    {
      id: 'exp',
      es: 'Primer paso: cada puntaje pasa por la función exponencial, que siempre da un número positivo. Cero punto siete se vuelve dos; cero, uno; menos cero punto siete, un medio.',
      en: 'Step one: each score goes through the exponential function, which always gives a positive number. Zero point seven becomes two; zero, one; minus zero point seven, one half.',
      pad: 0.4,
    },
    {
      id: 'sum-divide',
      es: 'Segundo paso: se suman, dos más uno más un medio más un medio, y da cuatro. Luego cada número se divide entre esa suma, cuatro.',
      en: 'Step two: add them up, two plus one plus one half plus one half, which makes four. Then each number is divided by that sum, four.',
      pad: 0.4,
    },
    {
      id: 'softmax-result',
      es: 'Resultado: cincuenta, veinticinco, doce punto cinco y doce punto cinco por ciento. Todos positivos y suman cien: son probabilidades, las mismas que contamos.',
      en: 'Result: fifty, twenty-five, twelve point five, and twelve point five percent. All positive and they add up to one hundred: probabilities, the same ones we counted.',
      note: { es: 'Softmax: convierte puntajes en probabilidades que suman uno.', en: 'Softmax: turns scores into probabilities that add up to one.' },
      pad: 0.3,
    },
    // ── temperatura ──
    {
      id: 'temp',
      es: 'Antes de softmax se puede mover una perilla: la temperatura. Cada puntaje se divide entre ella, y con temperatura uno todo queda igual.',
      en: 'Before softmax there is a dial you can turn: the temperature. Each score is divided by it, and at temperature one nothing changes.',
    },
    {
      id: 'temp-low',
      es: 'Con temperatura cero punto cinco, los puntajes se duplican y las diferencias crecen: azul sube de cincuenta a setenta y tres por ciento.',
      en: 'At temperature zero point five, the scores double and the differences grow: blue rises from fifty to seventy-three percent.',
      pad: 0.5,
    },
    {
      id: 'temp-zero',
      es: 'Ahora sorteamos diez veces con esa temperatura. Cerca de cero, la favorita se lleva casi todo y los diez dan «azul»: es la elección voraz otra vez.',
      en: 'Now we draw ten times at that temperature. Near zero, the favorite takes almost everything and all ten come up “blue”: the greedy choice again.',
      pad: 0.5,
    },
    {
      id: 'temp-high',
      es: 'Si la subimos a dos, pasa lo contrario: azul baja a treinta y siete por ciento, oscuro sube a dieciocho, y en los sorteos sale de todo.',
      en: 'Turn it up to two and the opposite happens: blue drops to thirty-seven percent, dark rises to eighteen, and the draws come out mixed.',
      pad: 0.5,
    },
    {
      id: 'temp-use',
      es: 'Temperatura baja: textos predecibles, que se repiten. Alta: más variados, hasta perder el sentido. Para resultados repetibles se usa baja, y aun así se revisa.',
      en: 'Low temperature: predictable texts that repeat. High: more varied, until they stop making sense. For repeatable results use it low, and still check them.',
      note: { es: 'Temperatura: baja = predecible; alta = variado.', en: 'Temperature: low = predictable; high = varied.' },
    },
    {
      id: 'try-temp',
      es: 'Si quieres, mueve tú la temperatura y mira cómo cambian las barras y los diez sorteos.',
      en: 'If you like, move the temperature yourself and watch the bars and the ten draws change.',
      gate: {
        id: 'temp',
        prompt: { es: 'mueve la temperatura y mira las barras y los sorteos.', en: 'move the temperature and watch the bars and the draws.' },
      },
      pad: 0.4,
    },
    // ── top-k y top-p ──
    {
      id: 'topk',
      es: 'Otra perilla quita las palabras raras antes de sortear. Top-k deja solo las k más probables: con k igual a dos, azul y gris, que se reparten el cien por ciento.',
      en: 'Another dial removes rare words before the draw. Top-k keeps only the k most likely: with k equal to two, blue and gray, which share the full hundred percent.',
      tts: {
        es: 'Otra perilla quita las palabras raras antes de sortear. Top ka deja solo las ka más probables: con ka igual a dos, azul y gris, que se reparten el cien por ciento.',
        en: 'Another dial removes rare words before the draw. Top K keeps only the K most likely: with K equal to two, blue and gray, which share the full hundred percent.',
      },
      pad: 0.5,
    },
    {
      id: 'topp',
      es: 'Top-p, en cambio, junta las más probables hasta llegar a un porcentaje, p. Con p de setenta por ciento bastan azul y gris, que juntan setenta y cinco.',
      en: 'Top-p, instead, gathers the most likely words until they reach a percentage, p. With p at seventy percent, blue and gray are enough: together, seventy-five.',
      tts: {
        es: 'Top pe, en cambio, junta las más probables hasta llegar a un porcentaje, pe. Con pe de setenta por ciento bastan azul y gris, que juntan setenta y cinco.',
        en: 'Top P, instead, gathers the most likely words until they reach a percentage, P. With P at seventy percent, blue and gray are enough: together, seventy-five.',
      },
      pad: 0.4,
    },
    {
      id: 'topp-adapt',
      es: 'Su ventaja: se adapta. Tras «cielo», «es» sola ya junta el cien por ciento, y top-p deja una sola palabra; tras «es», deja dos.',
      en: 'Its advantage: it adapts. After “sky,” “is” alone already reaches one hundred percent, so top-p keeps a single word; after “is,” it keeps two.',
      tts: {
        es: 'Su ventaja: se adapta. Tras «cielo», «es» sola ya junta el cien por ciento, y top pe deja una sola palabra; tras «es», deja dos.',
        en: 'Its advantage: it adapts. After “sky,” “is” alone already reaches one hundred percent, so top P keeps a single word; after “is,” it keeps two.',
      },
      note: { es: 'Top-k y top-p: sortear solo entre las más probables.', en: 'Top-k and top-p: sample only among the most likely.' },
      pad: 0.4,
    },
    // ── ¿cómo escribe un ensayo algo que solo predice? ──
    {
      id: 'essay-q',
      es: 'Queda la pregunta grande: si solo predice la siguiente palabra, ¿cómo escribe un ensayo entero?',
      en: 'That leaves the big question: if it only predicts the next word, how does it write a whole essay?',
    },
    {
      id: 'essay-loop',
      es: 'Primero, con este mismo bucle: un ensayo de mil palabras son unas mil vueltas. Y un modelo real no mira solo la última palabra: mira todo lo anterior, hasta cierto límite.',
      en: 'First, with this same loop: a thousand-word essay is about a thousand turns. And a real model does not look only at the last word: it looks at everything before, up to a limit.',
      pad: 0.5,
    },
    {
      id: 'essay-hard',
      es: 'Segundo, predecir bien exige mucho. Para completar «la capital de Francia es…» hace falta un dato; para continuar un argumento, seguir su lógica.',
      en: 'Second, predicting well demands a lot. To complete “the capital of France is…” you need a fact; to continue an argument, you need to follow its logic.',
      pad: 0.4,
    },
    {
      id: 'honest',
      es: 'Pero su meta es lo probable, no lo verdadero. Puede escribir algo convincente y falso. Nuestro modelo propone «el sol es azul» sin dudar.',
      en: 'But its goal is what is likely, not what is true. It can write something convincing and false. Our model suggests “the sun is blue” without hesitation.',
      note: { es: 'Predice lo probable, no lo verdadero.', en: 'It predicts what is likely, not what is true.' },
      pad: 0.3,
    },
    // ── GPT-1, 2 y 3: el mismo objetivo, más escala ──
    {
      id: 'gpt1',
      es: 'Esta receta, con una red enorme, es la de la familia GPT. GPT-1, de dos mil dieciocho, tenía ciento diecisiete millones de parámetros, los números que ajusta al aprender.',
      en: 'This recipe, with a huge network, is the one behind the GPT family. GPT-1, from twenty eighteen, had one hundred seventeen million parameters, the numbers it adjusts as it learns.',
      tts: {
        es: 'Esta receta, con una red enorme, es la de la familia ge pe te. Ge pe te uno, de dos mil dieciocho, tenía ciento diecisiete millones de parámetros, los números que ajusta al aprender.',
        en: 'This recipe, with a huge network, is the one behind the G P T family. G P T one, from twenty eighteen, had one hundred seventeen million parameters, the numbers it adjusts as it learns.',
      },
      pad: 0.3,
    },
    {
      id: 'gpt23',
      es: 'GPT-2, de dos mil diecinueve, tenía mil quinientos millones. GPT-3, de dos mil veinte, ciento setenta y cinco mil millones: unas mil quinientas veces GPT-1.',
      en: 'GPT-2, from twenty nineteen, had one and a half billion. GPT-3, from twenty twenty, one hundred seventy-five billion: about fifteen hundred times GPT-1.',
      tts: {
        es: 'Ge pe te dos, de dos mil diecinueve, tenía mil quinientos millones. Ge pe te tres, de dos mil veinte, ciento setenta y cinco mil millones: unas mil quinientas veces ge pe te uno.',
        en: 'G P T two, from twenty nineteen, had one and a half billion. G P T three, from twenty twenty, one hundred seventy-five billion: about fifteen hundred times G P T one.',
      },
      pad: 0.6,
    },
    {
      id: 'same-goal',
      es: 'Las tres se entrenaron con el mismo objetivo que nuestra tabla: predecir la siguiente palabra. Lo que creció fue la escala: la red y el texto que leyó.',
      en: 'All three were trained with the same goal as our table: predict the next word. What grew was the scale: the network and the text it read.',
      pad: 0.3,
    },
    // ── cierre ──
    {
      id: 'recap',
      es: 'En resumen: mirar el contexto, sacar las probabilidades, elegir, agregar y repetir. La temperatura, top-k y top-p solo cambian cómo se elige.',
      en: 'In short: look at the context, get the probabilities, pick, append, and repeat. Temperature, top-k, and top-p only change how the pick is made.',
      tts: {
        es: 'En resumen: mirar el contexto, sacar las probabilidades, elegir, agregar y repetir. La temperatura, top ka y top pe solo cambian cómo se elige.',
        en: 'In short: look at the context, get the probabilities, pick, append, and repeat. Temperature, top K, and top P only change how the pick is made.',
      },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Una última cosa: dijimos «palabras», pero los modelos reales leen piezas más pequeñas. ¿Qué piezas, exactamente? Los tokens.',
      en: 'One last thing: we said “words,” but real models read smaller pieces. Which pieces, exactly? Tokens.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo de lenguaje da, para un contexto, una probabilidad a cada palabra (o pieza) que puede seguir.',
      'El modelo más simple cuenta: probabilidad = cuenta ÷ total. Las redes neuronales dan puntajes, y softmax los convierte en probabilidades que suman uno.',
      'Escribe en bucle: elige una palabra, la agrega al contexto y vuelve a calcular. Eso es autorregresión.',
      'Elegir siempre la más probable (voraz) cae en repeticiones; sortear da textos distintos en cada corrida. La temperatura afila (baja) o aplana (alta) las probabilidades; top-k y top-p recortan las palabras raras.',
      'Predecir bien exige capturar mucho, pero la meta es lo probable, no lo verdadero. De GPT-1 a GPT-3 el objetivo es el mismo; cambia la escala.',
    ],
    en: [
      'A language model gives, for a context, a probability to every word (or piece) that can come next.',
      'The simplest model counts: probability = count ÷ total. Neural networks give scores, and softmax turns them into probabilities that add up to one.',
      'It writes in a loop: pick a word, add it to the context, and compute again. That is autoregression.',
      'Always taking the most likely word (greedy) falls into repetition; sampling gives a different text on every run. Temperature sharpens (low) or flattens (high) the probabilities; top-k and top-p cut off rare words.',
      'Predicting well demands capturing a lot, but the goal is the likely, not the true. From GPT-1 to GPT-3 the objective is the same; the scale changes.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Como solo predice la siguiente palabra, un modelo de lenguaje es un autocompletar que copia frases que ya vio.',
      en: 'Since it only predicts the next word, a language model is an autocomplete that copies phrases it has already seen.',
    },
    right: {
      es: 'Calcula una distribución nueva para cada contexto y puede escribir frases que nunca leyó (hasta nuestro modelo de ocho frases lo hace). Acertar a gran escala exige capturar gramática, datos y patrones de razonamiento. Eso sí: optimiza lo probable, no lo verdadero.',
      en: 'It computes a fresh distribution for every context and can write sentences it never read (even our eight-sentence model does). Getting it right at scale demands capturing grammar, facts, and patterns of reasoning. It does optimize for the likely, though, not the true.',
    },
  },

  deeper: {
    es: `## El objetivo: predecir la siguiente pieza

Por la regla de la cadena, la probabilidad de un texto $x_1,\\dots,x_n$ se descompone en predicciones de la siguiente pieza:

$$P(x_1,\\dots,x_n)=\\prod_{t=1}^{n}P(x_t\\mid x_1,\\dots,x_{t-1})$$

Un modelo de lenguaje es cualquier modelo de $P(x_t\\mid x_{<t})$. GPT-1 se entrena maximizando $\\sum_t \\ln P_\\theta(x_t\\mid x_{t-k},\\dots,x_{t-1})$ sobre un corpus, el «objetivo estándar de modelado de lenguaje» (ecuación 1 del artículo), donde $k$ es el tamaño de la ventana de contexto. Equivale a minimizar la entropía cruzada $L=-\\tfrac1n\\sum_t \\ln p_\\theta(x_t\\mid x_{<t})$. Generar es el camino inverso: $x_t\\sim P(\\cdot\\mid x_{<t})$, una pieza a la vez (autorregresión).

## Contar: el modelo de n-gramas

Con una ventana de $n-1$ piezas, la estimación de máxima verosimilitud es la frecuencia relativa:

$$P(w\\mid c)=\\frac{N(c,w)}{N(c)}$$

donde $N(c,w)$ cuenta cuántas veces $w$ siguió al contexto $c$. En la lección ($n=2$, bigramas), «es» aparece $N=8$ veces y $N(\\text{es},\\text{azul})=4$, así que $P=4/8=0.5$. Shannon (1948) ya generaba texto así: su «aproximación de segundo orden por palabras» elige cada palabra según las frecuencias de transición desde la anterior. El límite es la dispersión: con un vocabulario de tamaño $V$ hay hasta $V^{\\,n-1}$ contextos, casi todos raros o nunca vistos, y la tabla no generaliza. Bengio et al. (2003) propusieron cambiarla por una red que aprende un vector por palabra: si «perro» y «gato» tienen vectores parecidos, lo aprendido de una frase se extiende a la otra.

## Softmax y temperatura

Una red produce un puntaje $z_i$ (en inglés, *logit*) por cada pieza $i$ del vocabulario. La probabilidad es

$$p_i=\\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$$

Con $T=1$ es el softmax de siempre. Sumar la misma constante a todos los puntajes no cambia nada; por eso los puntajes de la lección, $z_i=\\ln c_i-\\ln 2$ (cuentas $4,2,1,1$; en pantalla, redondeados: $0.7,\\,0,\\,-0.7,\\,-0.7$), dan exactamente cuenta ÷ total. En general, con $z_i=\\ln c_i$ queda $p_i=c_i^{1/T}/\\sum_j c_j^{1/T}$: con $T=0.5$, azul vale $16/22\\approx0.727$; con $T=2$, $2/(2+\\sqrt2+1+1)\\approx0.369$; con $T=0.25$, $256/274\\approx0.934$. Si $T\\to0$ toda la masa va a la pieza de mayor puntaje (voraz); si $T\\to\\infty$ la distribución tiende a la uniforme. El nombre viene de la física estadística: la distribución de Boltzmann tiene esta misma forma, con la temperatura dividiendo. Con este papel aparece, por ejemplo, en la destilación de conocimiento (Hinton et al., 2015).

## Top-k y top-p

Tras el softmax se puede recortar. **Top-k** (Fan et al., 2018, que muestrean entre las $k=10$ más probables) conserva las $k$ piezas más probables. **Top-p**, o muestreo de núcleo (Holtzman et al., 2020), conserva el conjunto más pequeño $V^{(p)}$ cuya probabilidad suma al menos $p$:

$$\\sum_{x\\in V^{(p)}}P(x\\mid x_{<t})\\ge p$$

Luego se reparte de nuevo, $q_i=p_i/\\sum_{j\\in V^{(p)}}p_j$, y se sortea con $q$. Holtzman et al. observaron que los métodos que maximizan la probabilidad al generar producen texto «soso, incoherente o atrapado en ciclos repetitivos» (el ciclo voraz de la lección), y que recortar la cola poco fiable, sin llegar a lo voraz, da texto más parecido al humano.

## En código

El modelo de la lección: contar pares, softmax con temperatura, top-p y escritura voraz, con la salida que imprime:

\`\`\`python
import math
from collections import Counter, defaultdict

texto = ("el cielo es azul . el mar es azul . el cielo es gris . el sol es grande . "
         "de noche el cielo es oscuro . el cielo es azul y el sol brilla . "
         "el mar es gris . hoy el cielo es azul .")
piezas = texto.split()

# 1. Contar qué pieza sigue a cada pieza (un modelo de bigramas)
tabla = defaultdict(Counter)
for a, b in zip(piezas, piezas[1:]):
    tabla[a][b] += 1

def softmax(puntajes, T=1.0):
    z = [s / T for s in puntajes]
    m = max(z)
    e = [math.exp(v - m) for v in z]    # restar el máximo no cambia el resultado
    return [v / sum(e) for v in e]

def distribucion(contexto, T=1.0, top_p=1.0):
    palabras = [w for w, _ in tabla[contexto].most_common()]
    puntajes = [math.log(c) for _, c in tabla[contexto].most_common()]   # puntaje = ln(cuenta)
    p = softmax(puntajes, T)
    nucleo, acum = [], 0.0               # top-p: las más probables hasta juntar top_p
    for w, q in zip(palabras, p):
        nucleo.append((w, q)); acum += q
        if acum >= top_p - 1e-9: break
    total = sum(q for _, q in nucleo)
    return [(w, round(q / total, 3)) for w, q in nucleo]   # repartir de nuevo

print(dict(tabla["es"]))
for T in (1.0, 0.5, 2.0):
    print(T, distribucion("es", T))
print(distribucion("es", top_p=0.7))

# 2. Escribir: tomar siempre la más probable (voraz) y repetir
escrito = ["el", "cielo", "es"]
for _ in range(9):
    escrito.append(tabla[escrito[-1]].most_common(1)[0][0])
print(" ".join(escrito))
# {'azul': 4, 'gris': 2, 'grande': 1, 'oscuro': 1}
# 1.0 [('azul', 0.5), ('gris', 0.25), ('grande', 0.125), ('oscuro', 0.125)]
# 0.5 [('azul', 0.727), ('gris', 0.182), ('grande', 0.045), ('oscuro', 0.045)]
# 2.0 [('azul', 0.369), ('gris', 0.261), ('grande', 0.185), ('oscuro', 0.185)]
# [('azul', 0.667), ('gris', 0.333)]
# el cielo es azul . el cielo es azul . el cielo
\`\`\`

El texto es propio de la lección y sus versiones en español e inglés son paralelas palabra por palabra, así que las cuentas coinciden en los dos idiomas. La escena usa este mismo modelo (\`lm.ts\`) y lo comprueba \`verify-data.ts\`, ambos en la carpeta de la lección.

## Escala: GPT-1, GPT-2 y GPT-3

Los tres son transformers de solo decodificador entrenados con el objetivo de arriba. GPT-1 (2018) leyó BooksCorpus, más de 7 000 libros inéditos; su tamaño, 117 millones de parámetros, figura en la tabla 2 del artículo de GPT-2 («el modelo más pequeño equivale al GPT original»). GPT-2 (2019) llegó a 1 542 millones y leyó WebText, algo más de 8 millones de documentos (40 GB de texto). GPT-3 (2020) tiene 175 000 millones. Un dato curioso: el artículo de GPT-3 cuenta 125 millones para un modelo con la misma forma que GPT-1 (12 capas de 768). La diferencia cuadra con la tabla de embeddings, que crece con el vocabulario: GPT-1 usó 40 000 fusiones de BPE y GPT-2 amplió el vocabulario a 50 257 piezas.

## Lo que viene

Dijimos «palabras», pero el modelo trabaja con piezas: los tokens (lección 20). La probabilidad la calcula una red que mira todo el contexto con atención (lecciones 21 y 22), y qué significa entrenarla con casi todo internet se ve en la lección 23.`,
    en: `## The objective: predict the next piece

By the chain rule, the probability of a text $x_1,\\dots,x_n$ factors into next-piece predictions:

$$P(x_1,\\dots,x_n)=\\prod_{t=1}^{n}P(x_t\\mid x_1,\\dots,x_{t-1})$$

A language model is any model of $P(x_t\\mid x_{<t})$. GPT-1 is trained by maximizing $\\sum_t \\ln P_\\theta(x_t\\mid x_{t-k},\\dots,x_{t-1})$ over a corpus, the “standard language modeling objective” (equation 1 of the paper), where $k$ is the size of the context window. It is equivalent to minimizing the cross-entropy $L=-\\tfrac1n\\sum_t \\ln p_\\theta(x_t\\mid x_{<t})$. Generating is the reverse trip: $x_t\\sim P(\\cdot\\mid x_{<t})$, one piece at a time (autoregression).

## Counting: the n-gram model

With a window of $n-1$ pieces, the maximum-likelihood estimate is the relative frequency:

$$P(w\\mid c)=\\frac{N(c,w)}{N(c)}$$

where $N(c,w)$ counts how many times $w$ followed context $c$. In the lesson ($n=2$, bigrams), “is” appears $N=8$ times and $N(\\text{is},\\text{blue})=4$, so $P=4/8=0.5$. Shannon (1948) already generated text this way: his “second-order word approximation” picks each word according to the transition frequencies from the previous one. The limit is sparsity: with a vocabulary of size $V$ there are up to $V^{\\,n-1}$ contexts, almost all rare or never seen, and the table does not generalize. Bengio et al. (2003) proposed replacing it with a network that learns a vector per word: if “dog” and “cat” have similar vectors, what is learned from one sentence carries over to the other.

## Softmax and temperature

A network produces a score $z_i$ (a *logit*) for every piece $i$ of the vocabulary. The probability is

$$p_i=\\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$$

With $T=1$ it is the ordinary softmax. Adding the same constant to every score changes nothing; that is why the lesson’s scores, $z_i=\\ln c_i-\\ln 2$ (counts $4,2,1,1$; rounded on screen to $0.7,\\,0,\\,-0.7,\\,-0.7$), give exactly count ÷ total. In general, with $z_i=\\ln c_i$ we get $p_i=c_i^{1/T}/\\sum_j c_j^{1/T}$: with $T=0.5$, blue gets $16/22\\approx0.727$; with $T=2$, $2/(2+\\sqrt2+1+1)\\approx0.369$; with $T=0.25$, $256/274\\approx0.934$. As $T\\to0$ all the mass goes to the highest-scoring piece (greedy); as $T\\to\\infty$ the distribution tends to uniform. The name comes from statistical physics: the Boltzmann distribution has this same form, with the temperature dividing. It plays this role in, for example, knowledge distillation (Hinton et al., 2015).

## Top-k and top-p

After the softmax one can truncate. **Top-k** (Fan et al., 2018, who sample among the $k=10$ most likely) keeps the $k$ most likely pieces. **Top-p**, or nucleus sampling (Holtzman et al., 2020), keeps the smallest set $V^{(p)}$ whose probability adds up to at least $p$:

$$\\sum_{x\\in V^{(p)}}P(x\\mid x_{<t})\\ge p$$

Then it shares the probability out again, $q_i=p_i/\\sum_{j\\in V^{(p)}}p_j$, and samples with $q$. Holtzman et al. observed that decoding methods that maximize probability produce text that is “bland, incoherent, or gets stuck in repetitive loops” (the greedy loop in the lesson), and that truncating the unreliable tail, without going all the way to greedy, yields text closer to human writing.

## In code

The lesson’s model: count pairs, softmax with temperature, top-p, and greedy writing, with the output it prints:

\`\`\`python
import math
from collections import Counter, defaultdict

text = ("the sky is blue . the sea is blue . the sky is gray . the sun is big . "
        "at night the sky is dark . the sky is blue and the sun shines . "
        "the sea is gray . today the sky is blue .")
pieces = text.split()

# 1. Count which piece follows each piece (a bigram model)
table = defaultdict(Counter)
for a, b in zip(pieces, pieces[1:]):
    table[a][b] += 1

def softmax(scores, T=1.0):
    z = [s / T for s in scores]
    m = max(z)
    e = [math.exp(v - m) for v in z]    # subtracting the max does not change the result
    return [v / sum(e) for v in e]

def distribution(context, T=1.0, top_p=1.0):
    words = [w for w, _ in table[context].most_common()]
    scores = [math.log(c) for _, c in table[context].most_common()]   # score = ln(count)
    p = softmax(scores, T)
    nucleus, acc = [], 0.0               # top-p: the most likely words until they reach top_p
    for w, q in zip(words, p):
        nucleus.append((w, q)); acc += q
        if acc >= top_p - 1e-9: break
    total = sum(q for _, q in nucleus)
    return [(w, round(q / total, 3)) for w, q in nucleus]   # share it out again

print(dict(table["is"]))
for T in (1.0, 0.5, 2.0):
    print(T, distribution("is", T))
print(distribution("is", top_p=0.7))

# 2. Write: always take the most likely piece (greedy) and repeat
written = ["the", "sky", "is"]
for _ in range(9):
    written.append(table[written[-1]].most_common(1)[0][0])
print(" ".join(written))
# {'blue': 4, 'gray': 2, 'big': 1, 'dark': 1}
# 1.0 [('blue', 0.5), ('gray', 0.25), ('big', 0.125), ('dark', 0.125)]
# 0.5 [('blue', 0.727), ('gray', 0.182), ('big', 0.045), ('dark', 0.045)]
# 2.0 [('blue', 0.369), ('gray', 0.261), ('big', 0.185), ('dark', 0.185)]
# [('blue', 0.667), ('gray', 0.333)]
# the sky is blue . the sky is blue . the sky
\`\`\`

The text was written for the lesson, and its Spanish and English versions are parallel word for word, so the counts match in both languages. The scene uses this same model (\`lm.ts\`), and \`verify-data.ts\` checks it; both live in the lesson folder.

## Scale: GPT-1, GPT-2, and GPT-3

All three are decoder-only transformers trained with the objective above. GPT-1 (2018) read BooksCorpus, over 7,000 unpublished books; its size, 117 million parameters, appears in table 2 of the GPT-2 paper (“the smallest model is equivalent to the original GPT”). GPT-2 (2019) reached 1,542 million and read WebText, slightly over 8 million documents (40 GB of text). GPT-3 (2020) has 175,000 million (175 billion). A curiosity: the GPT-3 paper counts 125 million for a model with the same shape as GPT-1 (12 layers of 768). The gap fits the embedding table, which grows with the vocabulary: GPT-1 used 40,000 BPE merges and GPT-2 expanded the vocabulary to 50,257 pieces.

## What comes next

We said “words,” but the model works with pieces: tokens (lesson 20). The probability is computed by a network that looks at the whole context with attention (lessons 21 and 22), and what it means to train it on almost the whole internet is the subject of lesson 23.`,
  },

  lens: {
    es: [
      'La salida es probabilística: la misma pregunta puede dar respuestas distintas. Para tareas con una respuesta correcta (extraer datos, clasificar) busca poca variación; para ideas y borradores, la variación ayuda.',
      'Bajar la temperatura vuelve la respuesta más repetible, no más veraz: un error probable sigue siendo probable. Ningún parámetro sustituye verificar contra las fuentes.',
      'Pregunta qué parámetros de muestreo (temperatura, top-p) usa tu aplicación y si puedes fijarlos; no todos los productos los muestran.',
      'Una prueba con una sola corrida no es evidencia. Repite cada caso varias veces con la configuración real y mide cuánto varía antes de decidir.',
    ],
    en: [
      'The output is probabilistic: the same question can get different answers. For tasks with one right answer (extracting data, classifying) aim for low variation; for ideas and drafts, variation helps.',
      'Lowering the temperature makes the answer more repeatable, not more truthful: a likely error stays likely. No parameter replaces checking against sources.',
      'Ask which sampling parameters (temperature, top-p) your application uses and whether you can set them; not every product exposes them.',
      'A test with a single run is not evidence. Repeat each case several times with the real configuration and measure how much it varies before deciding.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué calcula un modelo de lenguaje en cada paso de la escritura?', en: 'What does a language model compute at each step of writing?' },
      options: [
        { es: 'La palabra correcta, que luego escribe.', en: 'The correct word, which it then writes.' },
        { es: 'Un resumen de todo el texto anterior.', en: 'A summary of all the previous text.' },
        { es: 'Una probabilidad para cada palabra que puede seguir.', en: 'A probability for every word that can come next.' },
        { es: 'La frase completa que va a escribir.', en: 'The complete sentence it is going to write.' },
      ],
      answer: 2,
      why: { es: 'Calcula una distribución sobre todas las palabras posibles; luego se elige una (voraz o sorteando), se agrega al contexto y se repite: autorregresión.', en: 'It computes a distribution over all possible words; then one is chosen (greedy or sampled), added to the context, and the loop repeats: autoregression.' },
    },
    {
      kind: 'concept',
      q: { es: 'Si subes mucho la temperatura antes del softmax, ¿qué le pasa a la distribución?', en: 'If you turn the temperature way up before the softmax, what happens to the distribution?' },
      options: [
        { es: 'Se aplana: las palabras raras ganan terreno y el texto se vuelve más variado.', en: 'It flattens: rare words gain ground and the text becomes more varied.' },
        { es: 'Se afila: la palabra favorita se lleva casi toda la probabilidad.', en: 'It sharpens: the favorite word takes almost all the probability.' },
        { es: 'No cambia: la temperatura solo afecta el entrenamiento.', en: 'It does not change: temperature only affects training.' },
        { es: 'El modelo aprende más rápido.', en: 'The model learns faster.' },
      ],
      answer: 0,
      why: { es: 'Dividir los puntajes entre una temperatura grande los acerca entre sí, y softmax reparte la probabilidad casi por igual. La temperatura actúa al escribir; no entrena nada.', en: 'Dividing the scores by a large temperature brings them closer together, and softmax spreads the probability almost evenly. Temperature acts while writing; it trains nothing.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una red da dos puntajes: 0.7 y −0.7. Como en la lección, la exponencial los vuelve 2 y 0.5. ¿Qué probabilidad da softmax a la primera palabra?', en: 'A network gives two scores: 0.7 and −0.7. As in the lesson, the exponential turns them into 2 and 0.5. What probability does softmax give the first word?' },
      options: [
        { es: '50 %', en: '50%' },
        { es: '70 %', en: '70%' },
        { es: '100 %', en: '100%' },
        { es: '80 %', en: '80%' },
      ],
      answer: 3,
      why: { es: 'Se suman, 2 + 0.5 = 2.5, y cada número se divide entre la suma: 2 ÷ 2.5 = 0.8, es decir, 80 %. La otra palabra queda con 0.5 ÷ 2.5 = 20 %; juntas suman 100 %.', en: 'Add them, 2 + 0.5 = 2.5, and divide each by the sum: 2 ÷ 2.5 = 0.8, that is, 80%. The other word gets 0.5 ÷ 2.5 = 20%; together they add up to 100%.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo usa un modelo para extraer cifras de contratos y obtiene resultados distintos en cada corrida. ¿Qué conviene revisar primero?', en: 'A team uses a model to extract figures from contracts and gets different results on each run. What should be checked first?' },
      options: [
        { es: 'Comprar más GPUs para que responda con más precisión.', en: 'Buying more GPUs so it answers more precisely.' },
        { es: 'Qué parámetros de muestreo se usan y si se pueden fijar bajos, y luego validar repitiendo cada caso varias veces.', en: 'Which sampling parameters are used and whether they can be set low, then validate by repeating each case several times.' },
        { es: 'Subir la temperatura para que explore más.', en: 'Raising the temperature so it explores more.' },
        { es: 'Entrenar un modelo propio desde cero.', en: 'Training a model from scratch.' },
      ],
      answer: 1,
      why: { es: 'La variación viene del sorteo de cada palabra. Una temperatura baja la reduce, pero no garantiza respuestas correctas: hay que medir repitiendo y verificar contra el documento.', en: 'The variation comes from the draw at every word. A low temperature reduces it, but does not guarantee correct answers: measure by repeating, and verify against the document.' },
    },
  ],

  glossary: ['language-model', 'autoregression', 'softmax', 'temperature', 'top-p', 'sampling', 'distribution', 'embedding', 'parameter', 'model', 'token'],

  terms: [
    { id: 'language-model', term: { es: 'Modelo de lenguaje', en: 'Language model' }, def: { es: 'Modelo que, dado un texto (el contexto), da una probabilidad a cada palabra o pieza que puede seguir. Escribe agregando una pieza a la vez.', en: 'A model that, given some text (the context), gives a probability to every word or piece that can come next. It writes by adding one piece at a time.' } },
    { id: 'autoregression', term: { es: 'Autorregresión', en: 'Autoregression' }, def: { es: 'Escribir una pieza a la vez usando como entrada lo ya escrito: cada palabra producida pasa a formar parte del contexto de la siguiente.', en: 'Writing one piece at a time using what has already been written as input: each word produced becomes part of the context for the next.' } },
    { id: 'softmax', term: { es: 'Softmax', en: 'Softmax' }, def: { es: 'Función que convierte puntajes cualesquiera en probabilidades positivas que suman uno: aplica la exponencial a cada puntaje y divide entre la suma.', en: 'A function that turns any scores into positive probabilities that add up to one: it applies the exponential to each score and divides by the sum.' } },
    { id: 'temperature', term: { es: 'Temperatura', en: 'Temperature' }, def: { es: 'Número que divide los puntajes antes del softmax. Baja afila la distribución (hacia la elección voraz); alta la aplana (hacia el azar).', en: 'A number that divides the scores before the softmax. Low sharpens the distribution (toward the greedy choice); high flattens it (toward chance).' } },
    { id: 'top-p', term: { es: 'Top-p (muestreo de núcleo)', en: 'Top-p (nucleus sampling)' }, def: { es: 'Sortear solo entre el grupo más pequeño de palabras más probables cuya probabilidad suma al menos p. Top-k hace lo mismo con un número fijo, k, de palabras.', en: 'Sampling only among the smallest group of most likely words whose probability adds up to at least p. Top-k does the same with a fixed number, k, of words.' } },
  ],

  sources: [
    { title: 'A Mathematical Theory of Communication', authors: 'Shannon, C. E.', year: 1948, url: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x' },
    { title: 'A Neural Probabilistic Language Model', authors: 'Bengio, Y., Ducharme, R., Vincent, P., Jauvin, C.', year: 2003, url: 'https://www.jmlr.org/papers/v3/bengio03a.html' },
    { title: 'Improving Language Understanding by Generative Pre-Training (GPT-1)', authors: 'Radford, A., Narasimhan, K., Salimans, T., Sutskever, I.', year: 2018, url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2; tabla 2: 117M y 1542M parámetros)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'GPT-4 Technical Report («pre-trained to predict the next token in a document»)', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'Training language models to follow instructions with human feedback (InstructGPT)', authors: 'Ouyang, L., et al.', year: 2022, url: 'https://arxiv.org/abs/2203.02155' },
    { title: 'Distilling the Knowledge in a Neural Network', authors: 'Hinton, G., Vinyals, O., Dean, J.', year: 2015, url: 'https://arxiv.org/abs/1503.02531' },
    { title: 'Hierarchical Neural Story Generation', authors: 'Fan, A., Lewis, M., Dauphin, Y.', year: 2018, url: 'https://arxiv.org/abs/1805.04833' },
    { title: 'The Curious Case of Neural Text Degeneration', authors: 'Holtzman, A., Buys, J., Du, L., Forbes, M., Choi, Y.', year: 2020, url: 'https://arxiv.org/abs/1904.09751' },
  ],
});
