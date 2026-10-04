import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'big-bang-deep-learning',

  objectives: {
    es: [
      'Explicar por qué el deep learning despegó hacia 2012: datos masivos, cómputo con GPUs y unos trucos de entrenamiento.',
      'Predecir cuándo una GPU supera a una CPU al multiplicar matrices y por qué su ventaja crece con el tamaño del problema.',
      'Explicar qué hace una conexión residual con el gradiente y por qué permite apilar muchas más capas.',
    ],
    en: [
      'Explain why deep learning took off around 2012: massive data, compute with GPUs, and a few training tricks.',
      'Predict when a GPU beats a CPU at multiplying matrices and why its advantage grows with the size of the problem.',
      'Explain what a residual connection does to the gradient and why it makes it possible to stack many more layers.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'La retropropagación se publicó en 1986 y las redes convolucionales leían códigos postales en 1989. Pero el despegue del deep learning, las redes de muchas capas, llegó en 2012. ¿Qué cambió?',
      en: 'Backpropagation was published in 1986, and convolutional networks were reading zip codes by 1989. Yet the takeoff of deep learning, networks with many layers, came only in 2012. What changed?',
      tts: {
        es: 'La retropropagación se publicó en mil novecientos ochenta y seis y las redes convolucionales leían códigos postales en mil novecientos ochenta y nueve. Pero el despegue del dip lerning, las redes de muchas capas, llegó en dos mil doce. ¿Qué cambió?',
        en: 'Backpropagation was published in nineteen eighty-six, and convolutional networks were reading zip codes by nineteen eighty-nine. Yet the takeoff of deep learning, networks with many layers, came only in twenty twelve. What changed?',
      },
    },
    {
      id: 'quiet',
      es: 'Mientras tanto, en 2010 y 2011, los ganadores del concurso de ImageNet no eran redes profundas: usaban características diseñadas a mano y clasificadores clásicos.',
      en: 'Meanwhile, in 2010 and 2011, the winners of the ImageNet contest were not deep networks: they used hand-designed features and classic classifiers.',
      tts: {
        es: 'Mientras tanto, en dos mil diez y dos mil once, los ganadores del concurso de ImageNet no eran redes profundas: usaban características diseñadas a mano y clasificadores clásicos.',
        en: 'Meanwhile, in twenty ten and twenty eleven, the winners of the ImageNet contest were not deep networks: they used hand-designed features and classic classifiers.',
      },
      pad: 0.3,
    },
    {
      id: 'three',
      es: 'Las ideas de fondo eran viejas. Lo que cambió fue la llegada, casi a la vez, de tres ingredientes: datos, cómputo (capacidad de cálculo) y unos trucos de entrenamiento.',
      en: 'The core ideas were old. What changed was the arrival, almost at once, of three ingredients: data, compute (raw calculating power), and a few training tricks.',
      note: { es: 'Tres ingredientes: datos, cómputo y trucos de entrenamiento.', en: 'Three ingredients: data, compute, and training tricks.' },
      pad: 0.5,
    },
    {
      id: 'imagenet',
      es: 'Primero, los datos. ImageNet, presentado en 2009, llegó a más de catorce millones de fotos etiquetadas por personas, en más de veintiún mil categorías.',
      en: 'First, data. ImageNet, introduced in 2009, grew to more than fourteen million photos labeled by people, in more than twenty-one thousand categories.',
      tts: {
        es: 'Primero, los datos. ImageNet, presentado en dos mil nueve, llegó a más de catorce millones de fotos etiquetadas por personas, en más de veintiún mil categorías.',
        en: 'First, data. ImageNet, introduced in two thousand nine, grew to more than fourteen million photos labeled by people, in more than twenty-one thousand categories.',
      },
      note: { es: 'ImageNet: millones de fotos etiquetadas por personas.', en: 'ImageNet: millions of photos labeled by people.' },
      pad: 0.4,
    },
    {
      id: 'ilsvrc',
      es: 'Desde 2010, el concurso ILSVRC usa mil categorías y más de un millón doscientas mil fotos de entrenamiento: más de veinte veces las de MNIST, el clásico de dígitos.',
      en: 'Since 2010, the ILSVRC contest has used one thousand categories and more than one million two hundred thousand training photos: over twenty times MNIST, the classic digit set.',
      tts: {
        es: 'Desde dos mil diez, el concurso i ele ese ve erre ce usa mil categorías y más de un millón doscientas mil fotos de entrenamiento: más de veinte veces las de em nist, el clásico de dígitos.',
        en: 'Since twenty ten, the I L S V R C contest has used one thousand categories and more than one million two hundred thousand training photos: over twenty times M N I S T, the classic digit set.',
      },
      pad: 0.4,
    },
    {
      id: 'top5',
      es: 'Cada sistema da cinco respuestas y acierta si la correcta está entre ellas. Ese es el error top-5, la vara con la que se mide toda esta historia.',
      en: 'Each system gives five answers and scores a hit if the correct one is among them. That is the top-5 error, the yardstick for this whole story.',
      tts: {
        es: 'Cada sistema da cinco respuestas y acierta si la correcta está entre ellas. Ese es el error top cinco, la vara con la que se mide toda esta historia.',
        en: 'Each system gives five answers and scores a hit if the correct one is among them. That is the top five error, the yardstick for this whole story.',
      },
      note: { es: 'Error top-5: acierta si la clase correcta está entre las cinco primeras.', en: 'Top-5 error: a hit if the correct class is among the top five.' },
      pad: 0.4,
    },
    {
      id: 'matmul',
      es: 'Segundo, el cómputo. Entrenar una red es, sobre todo, multiplicar matrices: cada capa multiplica sus pesos por los datos que recibe, una y otra vez.',
      en: 'Second, compute. Training a network is mostly multiplying matrices: every layer multiplies its weights by the data it receives, over and over.',
      pad: 0.3,
    },
    {
      id: 'parallel',
      es: 'Mira el resultado: cada celda es un producto punto que no necesita a las demás. Por eso se pueden calcular todas a la vez.',
      en: 'Look at the result: each cell is a dot product that needs none of the others. So all of them can be computed at once.',
      pad: 0.5,
    },
    {
      id: 'cores',
      es: 'Una CPU tiene pocos núcleos versátiles. Una GPU, nacida para dibujar videojuegos, tiene cientos o miles de núcleos sencillos: justo lo que pide multiplicar matrices.',
      en: 'A CPU has a few versatile cores. A GPU, born to draw video-game graphics, has hundreds or thousands of simple cores: exactly what matrix multiplication calls for.',
      note: { es: 'GPU: miles de núcleos sencillos que multiplican matrices a la vez.', en: 'GPU: thousands of simple cores that multiply matrices at once.' },
      pad: 0.5,
    },
    {
      id: 'race-try',
      es: 'Tu turno: una carrera de multiplicación de matrices. Cambia el tamaño y la GPU. Es un conteo ideal de pasos, no un cronómetro: lo medido viene después.',
      en: 'Your turn: a matrix-multiplication race. Change the size and the GPU. It is an idealized step count, not a stopwatch: real measurements come next.',
      gate: {
        id: 'race',
        prompt: {
          es: 'Corre la carrera con una matriz pequeña (8 o menos) y con una grande (64 o más) y compara la ventaja.',
          en: 'Run the race with a small matrix (8 or less) and a large one (64 or more) and compare the advantage.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'race-lesson',
      es: 'Con pocas celdas, casi todos los núcleos de la GPU se quedan sin trabajo; con muchas, trabajan todos. La ventaja crece con el tamaño del problema hasta topar con sus núcleos.',
      en: 'With few cells, most GPU cores sit idle; with many, they all work. The advantage grows with the size of the problem until it hits the core count.',
      pad: 0.4,
    },
    {
      id: 'race-real',
      es: 'No es solo un modelo. En 2009, Raina y sus colegas midieron una GPU contra una CPU de dos núcleos: entre 13 y 73 veces más rápida, y más cuanto mayor la red.',
      en: 'It is not just a model. In 2009, Raina and colleagues measured a GPU against a dual-core CPU: between 13 and 73 times faster, and more the bigger the network.',
      tts: {
        es: 'No es solo un modelo. En dos mil nueve, Raina y sus colegas midieron una ge pe u contra una ce pe u de dos núcleos: entre trece y setenta y tres veces más rápida, y más cuanto mayor la red.',
        en: 'It is not just a model. In two thousand nine, Raina and colleagues measured a G P U against a dual-core C P U: between thirteen and seventy-three times faster, and more the bigger the network.',
      },
      pad: 0.5,
    },
    {
      id: 'tricks',
      es: 'Tercero, los trucos: ReLU, dropout y, unos años después, las conexiones residuales. Ideas pequeñas que hicieron entrenable lo que antes se atascaba o memorizaba.',
      en: 'Third, the tricks: ReLU, dropout, and, a few years later, residual connections. Small ideas that made trainable what used to get stuck or memorize.',
      note: { es: 'Trucos: ReLU, dropout y conexiones residuales.', en: 'Tricks: ReLU, dropout, and residual connections.' },
      pad: 0.4,
    },
    {
      id: 'relu',
      es: 'La ReLU: una tanh saturada tiene pendiente casi cero y aprende despacio; la ReLU conserva pendiente uno. En una prueba del artículo de AlexNet, entrenó seis veces más rápido.',
      en: 'ReLU: a saturated tanh has almost zero slope and learns slowly; ReLU keeps a slope of one. In one test in the AlexNet paper, it trained six times faster.',
      tts: {
        es: 'La relu: una tanch saturada tiene pendiente casi cero y aprende despacio; la relu conserva pendiente uno. En una prueba del artículo de alex net, entrenó seis veces más rápido.',
        en: 'ReLU: a saturated tanch has almost zero slope and learns slowly; ReLU keeps a slope of one. In one test in the alex net paper, it trained six times faster.',
      },
      pad: 0.6,
    },
    {
      id: 'dropout',
      es: 'Dropout, que ya conoces: en cada paso se apaga al azar la mitad de las neuronas, y ninguna puede apoyarse en otra. AlexNet lo usó en sus dos primeras capas densas.',
      en: 'Dropout, which you know: at each step half the neurons are switched off at random, so none can lean on another. AlexNet used it in its first two dense layers.',
      tts: {
        es: 'Drop aut, que ya conoces: en cada paso se apaga al azar la mitad de las neuronas, y ninguna puede apoyarse en otra. Alex net lo usó en sus dos primeras capas densas.',
        en: 'Dropout, which you know: at each step half the neurons are switched off at random, so none can lean on another. Alex net used it in its first two dense layers.',
      },
      pad: 0.4,
    },
    {
      id: 'alexnet',
      es: 'AlexNet no fue la primera red en una GPU, pero sí de las mayores: cinco capas convolucionales, tres densas, sesenta millones de pesos y cinco o seis días en dos GPU.',
      en: 'AlexNet was not the first network on a GPU, but it was one of the largest: five convolutional layers, three dense ones, sixty million weights, five to six days on two GPUs.',
      tts: {
        es: 'Alex net no fue la primera red en una ge pe u, pero sí de las mayores: cinco capas convolucionales, tres densas, sesenta millones de pesos y cinco o seis días en dos ge pe us.',
        en: 'Alex net was not the first network on a G P U, but it was one of the largest: five convolutional layers, three dense ones, sixty million weights, five to six days on two G P Us.',
      },
      pad: 0.6,
    },
    {
      id: 'memory',
      es: 'Una sola GPU tenía tres gigabytes de memoria y la red no cabía, así que se repartió entre dos. El tamaño de la red ya dependía del hardware.',
      en: 'A single GPU had three gigabytes of memory and the network did not fit, so it was split across two. The size of the network now depended on the hardware.',
      tts: {
        es: 'Una sola ge pe u tenía tres gigabytes de memoria y la red no cabía, así que se repartió entre dos. El tamaño de la red ya dependía del hardware.',
        en: 'A single G P U had three gigabytes of memory and the network did not fit, so it was split across two. The size of the network now depended on the hardware.',
      },
      pad: 0.4,
    },
    {
      id: 'result',
      es: 'En 2012, AlexNet logró un error top-5 de 15,3 %. El segundo lugar, con métodos clásicos, quedó en 26,2 %.',
      en: 'In 2012, AlexNet reached a top-5 error of 15.3%. The runner-up, using classic methods, scored 26.2%.',
      tts: {
        es: 'En dos mil doce, alex net logró un error top cinco de quince coma tres por ciento. El segundo lugar, con métodos clásicos, quedó en veintiséis coma dos por ciento.',
        en: 'In twenty twelve, alex net reached a top five error of fifteen point three percent. The runner-up, using classic methods, scored twenty-six point two percent.',
      },
      note: { es: '2012: error top-5 de 15,3 % frente a 26,2 % del segundo lugar.', en: '2012: top-5 error of 15.3% versus the runner-up’s 26.2%.' },
      pad: 0.5,
    },
    {
      id: 'jump',
      es: 'Entre 2010 y 2011, el mejor error bajó unos dos puntos. Entre 2011 y 2012, unos diez. Al año siguiente, la gran mayoría de los equipos usaba redes convolucionales profundas.',
      en: 'Between 2010 and 2011, the best error fell by about two points. Between 2011 and 2012, by about ten. The next year, the vast majority of teams used deep convolutional networks.',
      tts: {
        es: 'Entre dos mil diez y dos mil once, el mejor error bajó unos dos puntos. Entre dos mil once y dos mil doce, unos diez. Al año siguiente, la gran mayoría de los equipos usaba redes convolucionales profundas.',
        en: 'Between twenty ten and twenty eleven, the best error fell by about two points. Between twenty eleven and twenty twelve, by about ten. The next year, the vast majority of teams used deep convolutional networks.',
      },
      pad: 0.5,
    },
    {
      id: 'deep-problem',
      es: 'Si más capas ayudan, ¿por qué no cien? Porque al retropropagar, el gradiente se multiplica por un factor en cada capa, y si ese factor es menor que uno, se desvanece.',
      en: 'If more layers help, why not a hundred? Because in backpropagation the gradient is multiplied by a factor at each layer, and if that factor is below one, it vanishes.',
      pad: 0.4,
    },
    {
      id: 'toy',
      es: 'Probémoslo en una red de juguete: dieciséis neuronas por capa, tanh y pesos aleatorios sin entrenar. Retropropagamos un gradiente de tamaño uno y medimos cuánto llega a cada capa.',
      en: 'Let’s test it on a toy network: sixteen neurons per layer, tanh, and random untrained weights. We backpropagate a gradient of size one and measure how much reaches each layer.',
      tts: {
        es: 'Probémoslo en una red de juguete: dieciséis neuronas por capa, tanch y pesos aleatorios sin entrenar. Retropropagamos un gradiente de tamaño uno y medimos cuánto llega a cada capa.',
        en: 'Let’s test it on a toy network: sixteen neurons per layer, tanch, and random untrained weights. We backpropagate a gradient of size one and measure how much reaches each layer.',
      },
      pad: 0.4,
    },
    {
      id: 'vanish',
      es: 'Con diez capas, el gradiente llega cientos de veces más pequeño; con cuarenta, miles de millones de veces. Las primeras capas casi no reciben señal para aprender.',
      en: 'After ten layers, the gradient arrives hundreds of times smaller; after forty, billions of times. The first layers get almost no signal to learn from.',
      pad: 1.0,
    },
    {
      id: 'skip-idea',
      es: 'La idea de ResNet, en 2015: que cada bloque calcule solo una corrección y se la sume a su entrada. Ese atajo, salida igual a entrada más corrección, es la conexión residual.',
      en: 'ResNet’s idea, in 2015: let each block compute only a correction and add it to its input. That shortcut, output equals input plus correction, is the residual connection.',
      tts: {
        es: 'La idea de res net, en dos mil quince: que cada bloque calcule solo una corrección y se la sume a su entrada. Ese atajo, salida igual a entrada más corrección, es la conexión residual.',
        en: 'Res net’s idea, in twenty fifteen: let each block compute only a correction and add it to its input. That shortcut, output equals input plus correction, is the residual connection.',
      },
      note: { es: 'Conexión residual: salida = entrada + F(entrada).', en: 'Residual connection: output = input + F(input).' },
      pad: 0.6,
    },
    {
      id: 'skip-grad',
      es: 'Hacia atrás, la suma reparte el gradiente por dos caminos: uno atraviesa la capa y el otro pasa intacto por el atajo, sin multiplicarse por ningún peso.',
      en: 'Going backward, the addition sends the gradient down two paths: one goes through the layer and the other passes untouched along the shortcut, multiplied by no weight.',
      pad: 0.6,
    },
    {
      id: 'skip-try',
      es: 'Tu turno: cambia entre red simple y red con atajos, y mueve la profundidad. Observa cuánto gradiente llega a la primera capa.',
      en: 'Your turn: switch between a plain network and one with shortcuts, and move the depth. Watch how much gradient reaches the first layer.',
      gate: {
        id: 'skip',
        prompt: {
          es: 'Con 30 capas o más, mira tanto la red simple como la red con atajos.',
          en: 'With 30 layers or more, look at both the plain network and the one with shortcuts.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'degradation',
      es: 'En redes reales, la normalización ya mantiene sanas las señales. Aun así, una red simple de 56 capas entrenaba peor que una de 20, incluso con los datos de entrenamiento.',
      en: 'In real networks, normalization already keeps signals healthy. Even so, a plain 56-layer network trained worse than a 20-layer one, even on the training data.',
      tts: {
        es: 'En redes reales, la normalización ya mantiene sanas las señales. Aun así, una red simple de cincuenta y seis capas entrenaba peor que una de veinte, incluso con los datos de entrenamiento.',
        en: 'In real networks, normalization already keeps signals healthy. Even so, a plain fifty-six-layer network trained worse than a twenty-layer one, even on the training data.',
      },
      pad: 0.5,
    },
    {
      id: 'resnet-win',
      es: 'Con atajos, más capas volvieron a mejorar el resultado. En 2015, un conjunto de ResNets de hasta 152 capas logró un error top-5 de 3,57 % y ganó el concurso.',
      en: 'With shortcuts, more layers improved results again. In 2015, an ensemble of ResNets with up to 152 layers reached a top-5 error of 3.57% and won the contest.',
      tts: {
        es: 'Con atajos, más capas volvieron a mejorar el resultado. En dos mil quince, un conjunto de res nets de hasta ciento cincuenta y dos capas logró un error top cinco de tres coma cincuenta y siete por ciento y ganó el concurso.',
        en: 'With shortcuts, more layers improved results again. In twenty fifteen, an ensemble of res nets with up to one hundred fifty-two layers reached a top five error of three point five seven percent and won the contest.',
      },
      pad: 0.5,
    },
    {
      id: 'story-chart',
      es: 'En seis ediciones del concurso, el error del ganador cayó de 28,2 % a 3,57 %. Las redes ganadoras pasaron de 8 capas en 2012 a 152 en 2015.',
      en: 'Across six editions of the contest, the winner’s error fell from 28.2% to 3.57%. The winning networks went from 8 layers in 2012 to 152 in 2015.',
      tts: {
        es: 'En seis ediciones del concurso, el error del ganador cayó de veintiocho coma dos por ciento a tres coma cincuenta y siete por ciento. Las redes ganadoras pasaron de ocho capas en dos mil doce a ciento cincuenta y dos en dos mil quince.',
        en: 'Across six editions of the contest, the winner’s error fell from twenty-eight point two percent to three point five seven percent. The winning networks went from eight layers in twenty twelve to one hundred fifty-two in twenty fifteen.',
      },
      pad: 0.6,
    },
    {
      id: 'human',
      es: 'Un anotador humano experto tuvo 5,1 % en una muestra; otro, 12 %. Pero esto mide una tarea concreta: mil categorías, una etiqueta por foto. No es entender escenas.',
      en: 'One expert human annotator scored 5.1% on a sample; another, 12%. But this measures one specific task: a thousand categories, one label per photo. It is not understanding scenes.',
      tts: {
        es: 'Un anotador humano experto tuvo cinco coma uno por ciento en una muestra; otro, doce por ciento. Pero esto mide una tarea concreta: mil categorías, una etiqueta por foto. No es entender escenas.',
        en: 'One expert human annotator scored five point one percent on a sample; another, twelve percent. But this measures one specific task: a thousand categories, one label per photo. It is not understanding scenes.',
      },
      pad: 0.4,
    },
    {
      id: 'compute-growth',
      es: 'Medido en operaciones, el cómputo de los mayores entrenamientos se duplicó cada 3,4 meses entre 2012 y 2018, según OpenAI: más de 300 000 veces en total.',
      en: 'Counted in operations, the compute of the largest training runs doubled every 3.4 months between 2012 and 2018, according to OpenAI: over 300,000 times in all.',
      tts: {
        es: 'Medido en operaciones, el cómputo de los mayores entrenamientos se duplicó cada tres coma cuatro meses entre dos mil doce y dos mil dieciocho, según OpenAI: más de trescientas mil veces en total.',
        en: 'Counted in operations, the compute of the largest training runs doubled every three point four months between twenty twelve and twenty eighteen, according to OpenAI: over three hundred thousand times in all.',
      },
      note: { es: 'Cómputo: se duplicó cada 3,4 meses entre 2012 y 2018 (OpenAI).', en: 'Compute: doubled every 3.4 months between 2012 and 2018 (OpenAI).' },
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: datos para no memorizar, GPUs para multiplicar matrices a la vez y trucos para entrenar redes profundas. Juntos convirtieron ideas viejas en deep learning.',
      en: 'In short: data so it does not just memorize, GPUs to multiply matrices all at once, and tricks to train deep networks. Together they turned old ideas into deep learning.',
      tts: {
        es: 'En resumen: datos para no memorizar, ge pe us para multiplicar matrices a la vez y trucos para entrenar redes profundas. Juntos convirtieron ideas viejas en dip lerning.',
        en: 'In short: data so it does not just memorize, G P Us to multiply matrices all at once, and tricks to train deep networks. Together they turned old ideas into deep learning.',
      },
    },
    {
      id: 'bridge',
      es: 'Ya sabemos enseñarle a ver. Falta algo más difícil: ¿cómo representa una máquina el significado? Eso nos lleva a los embeddings.',
      en: 'We now know how to teach it to see. Something harder remains: how does a machine represent meaning? That leads us to embeddings.',
    },
  ],

  keyIdeas: {
    es: [
      'El despegue del deep learning no vino de una idea nueva, sino de tres ingredientes que coincidieron: datos masivos, cómputo y trucos de entrenamiento.',
      'ImageNet puso millones de fotos etiquetadas al alcance de todos, y el concurso ILSVRC midió el progreso con una vara común: el error top-5.',
      'Una GPU multiplica matrices con miles de núcleos a la vez, justo el trabajo del entrenamiento; su ventaja crece con el tamaño del problema.',
      'AlexNet (2012) bajó el error top-5 del segundo lugar, 26,2 %, a 15,3 % con ReLU, dropout y dos GPU; la memoria de la GPU ya limitaba el tamaño de la red.',
      'Una conexión residual, y = x + F(x), da al gradiente un camino directo y permitió redes de más de cien capas; el cómputo de los mayores entrenamientos se duplicó cada pocos meses.',
    ],
    en: [
      'The takeoff of deep learning did not come from a new idea, but from three ingredients that coincided: massive data, compute, and training tricks.',
      'ImageNet put millions of labeled photos within everyone’s reach, and the ILSVRC contest measured progress with a common yardstick: the top-5 error.',
      'A GPU multiplies matrices with thousands of cores at once, exactly the work of training; its advantage grows with the size of the problem.',
      'AlexNet (2012) cut the top-5 error from the runner-up’s 26.2% to 15.3% with ReLU, dropout, and two GPUs; GPU memory already limited the size of the network.',
      'A residual connection, y = x + F(x), gives the gradient a direct path and made networks of more than a hundred layers possible; the compute of the largest training runs doubled every few months.',
    ],
  },

  misconception: {
    wrong: {
      es: 'El deep learning despegó en 2012 porque por fin alguien inventó una idea revolucionaria.',
      en: 'Deep learning took off in 2012 because someone finally invented a revolutionary idea.',
    },
    right: {
      es: 'La retropropagación y las convoluciones ya existían desde los años ochenta y noventa, e incluso entrenar en GPU se había probado antes. Lo que cambió fue la escala: millones de imágenes etiquetadas, GPUs y unos pocos trucos (ReLU, dropout, atajos residuales).',
      en: 'Backpropagation and convolutions already existed in the 1980s and 1990s, and training on GPUs had even been tried before. What changed was scale: millions of labeled images, GPUs, and a few tricks (ReLU, dropout, residual shortcuts).',
    },
  },

  deeper: {
    es: `## Los números de 2012

Del artículo de AlexNet (Krizhevsky, Sutskever y Hinton, 2012): ocho capas con pesos (cinco convolucionales y tres densas), unos 60 millones de parámetros, unas 650 000 neuronas, más de 1,2 millones de imágenes de entrenamiento y entre cinco y seis días en dos GPU GTX 580 de 3 GB. La entrada tiene 150 528 valores ($224\\times224\\times3$).

| Modelo en ILSVRC 2012 | Error top-5 |
|---|---|
| SIFT + vectores de Fisher (segundo lugar) | 26,2 % |
| 1 red convolucional (validación) | 18,2 % |
| 5 redes promediadas | 16,4 % |
| 7 redes, 2 de ellas preentrenadas con 15 M de imágenes | 15,3 % |

Por eso la cifra «15,3 %» viene de un conjunto de siete redes y de datos extra; con solo los datos del concurso fueron 16,4 %. Aun así, la diferencia con el segundo lugar es enorme.

## Multiplicar matrices: por qué gana la GPU

El producto $C=AB$ de dos matrices $n\\times n$ es

$$C_{ij}=\\sum_{k=1}^{n}A_{ik}B_{kj}.$$

Son $n^2$ celdas independientes y cada una cuesta $n$ multiplicaciones-suma: $n^3$ en total, es decir, $2n^3$ operaciones de coma flotante (FLOP: una suma o una multiplicación con decimales). Con $P$ núcleos que hacen una multiplicación-suma por paso, el número ideal de pasos es

$$T(n,P)=\\left\\lceil \\frac{n^2}{P}\\right\\rceil n,\\qquad \\frac{T(n,8)}{T(n,P)}\\;\\longrightarrow\\;\\frac{P}{8}\\ \\text{cuando }n^2\\gg P.$$

Con $P=512$ (GTX 580) la ventaja ideal tope es 64; con $P=3584$ (RTX 3060), 448. Es un conteo ideal: ignora el ancho de banda de memoria, el costo de mover datos a la GPU y que cada núcleo de GPU es más lento que uno de CPU. Las medidas reales de Raina, Madhavan y Ng (2009), con una GPU GTX 280 contra una CPU de dos núcleos, fueron entre 12,9 y 72,6 veces según el tamaño del modelo.

La velocidad pico de un chip es $\\text{núcleos}\\times 2\\times\\text{reloj}$: $512\\times2\\times1{,}544\\ \\text{GHz}\\approx1{,}58$ TFLOP/s para la GTX 580 (cifra que usa OpenAI) y, por la misma cuenta, unos 12,7 TFLOP/s para la RTX 3060.

## El costo de entrenar AlexNet

Según la estimación de Amodei y Hernandez (OpenAI, 2018), el pase hacia delante cuesta unos $0{,}75\\times10^{9}$ multiplicaciones-suma por imagen; entrenar incluye 2 operaciones por multiplicación-suma, el paso hacia atrás (factor 3) y unas 90 vueltas al conjunto:

$$1{,}2\\times10^{6}\\cdot 90\\cdot 0{,}75\\times10^{9}\\cdot 2\\cdot 3\\approx 4{,}9\\times10^{17}\\ \\text{FLOP}.$$

Es coherente con dos GTX 580 durante 5,5 días al 33 % de su pico, que es lo que supone OpenAI: $2\\cdot1{,}58\\times10^{12}\\cdot5{,}5\\cdot86\\,400\\cdot0{,}33\\approx5\\times10^{17}$. Entre 2012 y 2018, OpenAI midió que el cómputo de los mayores entrenamientos se duplicaba cada 3,4 meses; estimaciones posteriores (Sevilla et al., 2022) dan alrededor de 6 meses para la era del deep learning. En ambos casos, el crecimiento es exponencial.

## El gradiente a través de las capas

En una pila simple, $h_l=\\tanh(W_l h_{l-1})$ y el gradiente retrocede como

$$\\frac{\\partial L}{\\partial h_{l-1}}=W_l^{\\top}\\Big(\\tanh'(z_l)\\odot\\frac{\\partial L}{\\partial h_l}\\Big),$$

así que su norma se multiplica por un factor, cada capa, de aproximadamente $\\sigma\\cdot\\overline{\\tanh'}$. Con la inicialización «estándar» de la época, $n\\,\\mathrm{Var}[W]=1/3$ (Glorot y Bengio, 2010, ec. 15), el factor queda alrededor de 0,5; en el juguete de la lección sale ≈ 0,55 y $0{,}55^{40}\\approx 4\\times10^{-11}$.

Con atajo, $x_{l+1}=x_l+F(x_l)$ y, según He et al. (2016, ec. 5),

$$\\frac{\\partial E}{\\partial x_l}=\\frac{\\partial E}{\\partial x_L}\\Big(I+\\frac{\\partial}{\\partial x_l}\\sum_{i=l}^{L-1}F(x_i)\\Big).$$

El término $I$ lleva el gradiente de la salida a cualquier capa sin pasar por ningún peso. En el juguete, además, cada bloque suma su aporte y la norma crece un poco (entre 2 y 18 con 40 capas, según la semilla).

## Lo que el juguete no dice

La red del juguete no está entrenada, no usa normalización y todas sus capas son iguales. En redes reales, la inicialización y la normalización por lotes mantienen sanas las señales. De hecho, He et al. (2015, §4.1) argumentan que la dificultad de entrenar redes simples profundas *no* parece deberse a gradientes que se desvanecen: sus redes simples tenían gradientes de norma sana y, aun así, la de 34 capas tenía más error de entrenamiento que la de 18, y la de 56 más que la de 20 en CIFAR-10. Lo llamaron el problema de la degradación. Su hipótesis es que es más fácil que un bloque aprenda $F\\approx0$ (identidad) que ajustar una identidad con capas no lineales; los propios autores dejan esa explicación como pregunta abierta. Lo medido es claro: con atajos, las redes de 50, 101 y 152 capas mejoraron con la profundidad. La ResNet-152 (11,3 mil millones de multiplicaciones-suma) cuesta menos que una VGG-19 (19,6 mil millones); sola logró 4,49 % de error top-5 en validación, y un conjunto de seis modelos, 3,57 % en prueba.

## En código

\`\`\`python
import numpy as np

def grad_norms(depth, residual, width=16, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, np.sqrt(1/3) / np.sqrt(width), size=(depth, width, width))
    h = rng.normal(size=width)
    cache = []
    for l in range(depth):                        # pase hacia delante
        t = np.tanh(W[l] @ h)
        cache.append(t)
        h = h + t if residual else t
    g = np.ones(width) / np.sqrt(width)           # gradiente de norma 1 en la salida
    norms = [np.linalg.norm(g)]
    for l in reversed(range(depth)):              # retropropagación
        branch = W[l].T @ (g * (1 - cache[l] ** 2))
        g = g + branch if residual else branch    # con atajo, el gradiente pasa intacto y se suma la rama
        norms.append(np.linalg.norm(g))
    return norms                                  # norms[k]: norma tras k capas hacia atrás

for res in (False, True):
    n = grad_norms(40, res)
    print("con atajos" if res else "sin atajos", f"tras 10 capas: {n[10]:.2e}   tras 40: {n[40]:.2e}")
# sin atajos tras 10 capas: 5.30e-03   tras 40: 1.16e-10
# con atajos tras 10 capas: 2.51e+00   tras 40: 1.48e+01
\`\`\`

Los números exactos dependen de la semilla y del generador aleatorio (el archivo \`gradients.py\` de la lección también comprueba la retropropagación contra diferencias finitas); el orden de magnitud no. Y el conteo ideal de la carrera:

\`\`\`python
from math import ceil

def pasos(n, nucleos):          # n² celdas independientes; cada una cuesta n multiplicaciones-suma
    return ceil(n * n / nucleos) * n

print(pasos(64, 8), pasos(64, 512), pasos(64, 3584))   # CPU de 8 núcleos, GTX 580, RTX 3060
# 32768 512 128
\`\`\`

## Lo que viene

Las conexiones residuales y la normalización reaparecen en cada bloque del transformer (lección 22). La lección 14 pasa de ver a representar significado con embeddings. Las cuentas de FLOPs, datos y costo se formalizan en la lección 24, y la memoria de la GPU, que ya limitaba a AlexNet, manda en la lección 25.`,
    en: `## The 2012 numbers

From the AlexNet paper (Krizhevsky, Sutskever and Hinton, 2012): eight layers with weights (five convolutional and three dense), about 60 million parameters, about 650,000 neurons, more than 1.2 million training images, and five to six days on two GTX 580 3 GB GPUs. The input has 150,528 values ($224\\times224\\times3$).

| Model in ILSVRC 2012 | Top-5 error |
|---|---|
| SIFT + Fisher vectors (runner-up) | 26.2% |
| 1 convolutional network (validation) | 18.2% |
| 5 networks averaged | 16.4% |
| 7 networks, 2 of them pre-trained on 15 M images | 15.3% |

So the “15.3%” figure comes from an ensemble of seven networks and extra data; with only the contest data it was 16.4%. Even so, the gap to the runner-up is huge.

## Multiplying matrices: why the GPU wins

The product $C=AB$ of two $n\\times n$ matrices is

$$C_{ij}=\\sum_{k=1}^{n}A_{ik}B_{kj}.$$

That is $n^2$ independent cells, each costing $n$ multiply-adds: $n^3$ in total, or $2n^3$ floating-point operations (FLOP: one addition or multiplication with decimals). With $P$ cores doing one multiply-add per step, the ideal number of steps is

$$T(n,P)=\\left\\lceil \\frac{n^2}{P}\\right\\rceil n,\\qquad \\frac{T(n,8)}{T(n,P)}\\;\\longrightarrow\\;\\frac{P}{8}\\ \\text{when }n^2\\gg P.$$

With $P=512$ (GTX 580) the ideal ceiling on the advantage is 64; with $P=3584$ (RTX 3060), 448. It is an idealized count: it ignores memory bandwidth, the cost of moving data to the GPU, and the fact that each GPU core is slower than a CPU core. The real measurements of Raina, Madhavan and Ng (2009), with a GTX 280 GPU against a dual-core CPU, were between 12.9 and 72.6 times faster, depending on the model size.

A chip’s peak speed is $\\text{cores}\\times 2\\times\\text{clock}$: $512\\times2\\times1.544\\ \\text{GHz}\\approx1.58$ TFLOP/s for the GTX 580 (the figure OpenAI uses) and, by the same arithmetic, about 12.7 TFLOP/s for the RTX 3060.

## The cost of training AlexNet

According to the estimate by Amodei and Hernandez (OpenAI, 2018), the forward pass costs about $0.75\\times10^{9}$ multiply-adds per image; training adds 2 operations per multiply-add, the backward pass (a factor of 3), and about 90 passes over the dataset:

$$1.2\\times10^{6}\\cdot 90\\cdot 0.75\\times10^{9}\\cdot 2\\cdot 3\\approx 4.9\\times10^{17}\\ \\text{FLOP}.$$

That is consistent with two GTX 580s for 5.5 days at 33% of their peak, which is what OpenAI assumes: $2\\cdot1.58\\times10^{12}\\cdot5.5\\cdot86{,}400\\cdot0.33\\approx5\\times10^{17}$. Between 2012 and 2018, OpenAI measured the compute of the largest training runs doubling every 3.4 months; later estimates (Sevilla et al., 2022) give about 6 months for the deep learning era. Either way, growth is exponential.

## The gradient through the layers

In a plain stack, $h_l=\\tanh(W_l h_{l-1})$ and the gradient flows back as

$$\\frac{\\partial L}{\\partial h_{l-1}}=W_l^{\\top}\\Big(\\tanh'(z_l)\\odot\\frac{\\partial L}{\\partial h_l}\\Big),$$

so its norm is multiplied, at each layer, by a factor of roughly $\\sigma\\cdot\\overline{\\tanh'}$. With the era’s “standard” initialization, $n\\,\\mathrm{Var}[W]=1/3$ (Glorot and Bengio, 2010, eq. 15), the factor is about 0.5; in the lesson’s toy it comes out ≈ 0.55, and $0.55^{40}\\approx 4\\times10^{-11}$.

With a shortcut, $x_{l+1}=x_l+F(x_l)$ and, according to He et al. (2016, eq. 5),

$$\\frac{\\partial E}{\\partial x_l}=\\frac{\\partial E}{\\partial x_L}\\Big(I+\\frac{\\partial}{\\partial x_l}\\sum_{i=l}^{L-1}F(x_i)\\Big).$$

The $I$ term carries the gradient from the output to any layer without passing through any weight. In the toy, each block also adds its contribution and the norm grows a little (between 2 and 18 at 40 layers, depending on the seed).

## What the toy does not say

The toy network is untrained, uses no normalization, and all its layers are alike. In real networks, initialization and batch normalization keep signals healthy. In fact, He et al. (2015, §4.1) argue that the difficulty of training deep plain networks does *not* seem to come from vanishing gradients: their plain networks had gradients of healthy norm and still the 34-layer one had higher training error than the 18-layer one, and the 56-layer one more than the 20-layer one on CIFAR-10. They called it the degradation problem. Their hypothesis is that it is easier for a block to learn $F\\approx0$ (identity) than to fit an identity with nonlinear layers; the authors themselves leave that explanation as an open question. What was measured is clear: with shortcuts, networks of 50, 101, and 152 layers improved with depth. ResNet-152 (11.3 billion multiply-adds) costs less than VGG-19 (19.6 billion); on its own it reached 4.49% top-5 error on validation, and an ensemble of six models, 3.57% on the test set.

## In code

\`\`\`python
import numpy as np

def grad_norms(depth, residual, width=16, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, np.sqrt(1/3) / np.sqrt(width), size=(depth, width, width))
    h = rng.normal(size=width)
    cache = []
    for l in range(depth):                        # forward pass
        t = np.tanh(W[l] @ h)
        cache.append(t)
        h = h + t if residual else t
    g = np.ones(width) / np.sqrt(width)           # gradient of norm 1 at the output
    norms = [np.linalg.norm(g)]
    for l in reversed(range(depth)):              # backpropagation
        branch = W[l].T @ (g * (1 - cache[l] ** 2))
        g = g + branch if residual else branch    # with a shortcut, the gradient passes untouched and the branch is added
        norms.append(np.linalg.norm(g))
    return norms                                  # norms[k]: norm after k layers backward

for res in (False, True):
    n = grad_norms(40, res)
    print("with shortcuts" if res else "plain", f"after 10 layers: {n[10]:.2e}   after 40: {n[40]:.2e}")
# plain after 10 layers: 5.30e-03   after 40: 1.16e-10
# with shortcuts after 10 layers: 2.51e+00   after 40: 1.48e+01
\`\`\`

The exact numbers depend on the seed and the random generator (the lesson’s \`gradients.py\` file also checks backpropagation against finite differences); the order of magnitude does not. And the ideal race count:

\`\`\`python
from math import ceil

def steps(n, cores):            # n² independent cells; each costs n multiply-adds
    return ceil(n * n / cores) * n

print(steps(64, 8), steps(64, 512), steps(64, 3584))   # 8-core CPU, GTX 580, RTX 3060
# 32768 512 128
\`\`\`

## What comes next

Residual connections and normalization reappear in every block of the transformer (lesson 22). Lesson 14 moves from seeing to representing meaning with embeddings. The accounting of FLOPs, data, and cost is formalized in lesson 24, and GPU memory, which already limited AlexNet, rules in lesson 25.`,
  },

  lens: {
    es: [
      'Cuando alguien diga «nuestro modelo es mejor», pregunta qué cambió: más datos (¿de quién y con qué licencia?), más cómputo (¿cuántas horas de GPU y a qué costo?) o un mejor método. Son los tres motores del progreso moderno.',
      'Un resultado en un benchmark público describe una tarea concreta, no la tuya: un error de 3,57 % en ImageNet no dice cuánto fallará con tus fotos. Pide una prueba con tus propios datos y con el costo real de cada tipo de error.',
      'El cómputo es una partida de presupuesto y de acceso: GPUs que se compran o se alquilan por hora, con memoria limitada. Entrenar desde cero un modelo grande está fuera del alcance de casi todas las organizaciones; lo habitual es partir de uno ya preentrenado.',
      'Más profundo o más grande no es automáticamente mejor: sin las ideas adecuadas (normalización, atajos), una red profunda ni siquiera entrena bien. Pide resultados con datos no vistos, no solo el número de parámetros o de capas.',
    ],
    en: [
      'When someone says “our model is better,” ask what changed: more data (whose, and under what license?), more compute (how many GPU hours, at what cost?), or a better method. Those are the three engines of modern progress.',
      'A result on a public benchmark describes a specific task, not yours: a 3.57% error on ImageNet does not tell you how often it will fail on your photos. Ask for a test with your own data and with the real cost of each kind of error.',
      'Compute is a budget and access item: GPUs bought or rented by the hour, with limited memory. Training a large model from scratch is out of reach for almost every organization; the usual route is to start from a pre-trained one.',
      'Deeper or bigger is not automatically better: without the right ideas (normalization, shortcuts), a deep network does not even train well. Ask for results on unseen data, not just the number of parameters or layers.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué una GPU encaja tan bien con el entrenamiento de redes neuronales?', en: 'Why does a GPU fit neural-network training so well?' },
      options: [
        { es: 'Porque cada uno de sus núcleos es mucho más rápido que el de una CPU en cualquier tarea.', en: 'Because each of its cores is much faster than a CPU core at any task.' },
        { es: 'Porque multiplicar matrices se descompone en muchas operaciones independientes, y tiene miles de núcleos para hacerlas a la vez.', en: 'Because matrix multiplication breaks into many independent operations, and it has thousands of cores to do them at once.' },
        { es: 'Porque tiene más memoria que cualquier otro chip y no necesita datos.', en: 'Because it has more memory than any other chip and needs no data.' },
        { es: 'Porque evita tener que retropropagar el error.', en: 'Because it avoids having to backpropagate the error.' },
      ],
      answer: 1,
      why: {
        es: 'El producto de matrices es un enorme conjunto de productos punto independientes, y una GPU los reparte entre miles de núcleos sencillos. Cada núcleo, por separado, no es más rápido que uno de CPU: la ventaja viene del paralelismo.',
        en: 'A matrix product is an enormous set of independent dot products, and a GPU spreads them across thousands of simple cores. Each core on its own is not faster than a CPU core: the advantage comes from parallelism.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'Si cada capa reduce el gradiente a la mitad al retropropagarlo, ¿qué fracción del gradiente de la salida llega diez capas hacia atrás?', en: 'If each layer halves the gradient as it is backpropagated, what fraction of the output gradient reaches ten layers back?' },
      options: [
        { es: 'Cerca de 0,05 (un veinteavo)', en: 'About 0.05 (one twentieth)' },
        { es: 'Exactamente 0,5', en: 'Exactly 0.5' },
        { es: 'Cerca de 0,001 (un milésimo)', en: 'About 0.001 (one thousandth)' },
        { es: 'Cerca de 0,1 (un décimo)', en: 'About 0.1 (one tenth)' },
      ],
      answer: 2,
      why: {
        es: 'Se multiplica por 0,5 en cada capa: 0,5 elevado a 10 es 1/1024, casi 0,001. Por eso apilar capas sin cuidado deja casi sin señal a las primeras.',
        en: 'It is multiplied by 0.5 at every layer: 0.5 to the power of 10 is 1/1024, almost 0.001. That is why stacking layers carelessly leaves the first ones with almost no signal.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'En un bloque residual, la salida es y = x + F(x). ¿Qué ventaja da ese «+ x» al retropropagar?', en: 'In a residual block, the output is y = x + F(x). What advantage does that “+ x” give during backpropagation?' },
      options: [
        { es: 'El gradiente tiene un camino directo hacia la entrada que no se multiplica por ningún peso.', en: 'The gradient has a direct path to the input that is multiplied by no weight.' },
        { es: 'Elimina la necesidad de datos de entrenamiento.', en: 'It removes the need for training data.' },
        { es: 'Obliga a que F valga siempre cero.', en: 'It forces F to always be zero.' },
        { es: 'Hace innecesarias las funciones de activación.', en: 'It makes activation functions unnecessary.' },
      ],
      answer: 0,
      why: {
        es: 'La derivada de x + F(x) respecto de x es 1 + F′(x): el 1 deja pasar el gradiente intacto aunque F′ sea diminuta. Además, si un bloque no aporta, basta con que F tienda a cero.',
        en: 'The derivative of x + F(x) with respect to x is 1 + F′(x): the 1 lets the gradient through untouched even if F′ is tiny. Besides, if a block adds nothing, F only has to tend to zero.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor presume un error de 3,6 % en ImageNet y propone usar su modelo de visión para inspeccionar piezas de tu fábrica. ¿Qué haces primero?', en: 'A vendor boasts a 3.6% error on ImageNet and proposes using its vision model to inspect parts in your factory. What do you do first?' },
      options: [
        { es: 'Contratarlo: 3,6 % es mejor que el error de una persona.', en: 'Hire it: 3.6% beats a person’s error.' },
        { es: 'Pedirle que añada más capas al modelo.', en: 'Ask it to add more layers to the model.' },
        { es: 'Comprar más GPUs para que rinda igual en tu planta.', en: 'Buy more GPUs so it performs the same in your plant.' },
        { es: 'Probarlo con una muestra de tus propias piezas, con tu iluminación, y medir el error que a ti te importa.', en: 'Test it on a sample of your own parts, under your lighting, and measure the error that matters to you.' },
      ],
      answer: 3,
      why: {
        es: 'ImageNet mide una tarea concreta (mil categorías, una etiqueta por foto). Un buen resultado ahí no garantiza nada con tus imágenes: mide con las tuyas y con el costo real de cada error (lecciones 10 y 34).',
        en: 'ImageNet measures one specific task (a thousand categories, one label per photo). A good result there guarantees nothing on your images: measure with yours and with the real cost of each error (lessons 10 and 34).',
      },
    },
  ],

  glossary: ['backpropagation', 'gradient', 'vanishing-gradient', 'relu', 'overfitting', 'regularization', 'cnn', 'layer', 'deep-network', 'forward-pass', 'weight', 'parameter', 'gpu', 'imagenet', 'deep-learning', 'residual-connection', 'compute'],

  terms: [
    { id: 'gpu', term: { es: 'GPU', en: 'GPU' }, def: { es: 'Unidad de procesamiento gráfico: un chip con cientos o miles de núcleos sencillos, creado para dibujar gráficos y muy eficiente para multiplicar matrices en paralelo, la operación central del entrenamiento.', en: 'Graphics processing unit: a chip with hundreds or thousands of simple cores, built to draw graphics and very efficient at multiplying matrices in parallel, the central operation of training.' } },
    { id: 'imagenet', term: { es: 'ImageNet', en: 'ImageNet' }, def: { es: 'Base de más de catorce millones de imágenes etiquetadas por personas, en más de veintiún mil categorías. Su subconjunto del concurso ILSVRC (mil clases, más de 1,2 millones de fotos de entrenamiento) fue el banco de pruebas de la visión por computador.', en: 'A database of more than fourteen million images labeled by people, in more than twenty-one thousand categories. Its ILSVRC contest subset (a thousand classes, more than 1.2 million training photos) was the proving ground of computer vision.' } },
    { id: 'deep-learning', term: { es: 'Aprendizaje profundo (deep learning)', en: 'Deep learning' }, def: { es: 'Aprendizaje automático con redes neuronales de muchas capas que aprenden por sí mismas las características útiles, de bordes a objetos, a partir de grandes cantidades de datos y cómputo.', en: 'Machine learning with many-layered neural networks that learn the useful features themselves, from edges to objects, from large amounts of data and compute.' } },
    { id: 'residual-connection', term: { es: 'Conexión residual (atajo)', en: 'Residual connection (shortcut)' }, def: { es: 'Suma de la entrada de un bloque a su salida: y = x + F(x). Da al gradiente un camino directo hacia atrás y permitió apilar muchas más capas.', en: 'Adding a block’s input to its output: y = x + F(x). It gives the gradient a direct path backward and made it possible to stack many more layers.' } },
    { id: 'compute', term: { es: 'Cómputo (compute)', en: 'Compute' }, def: { es: 'Cantidad de operaciones aritméticas que exige entrenar o ejecutar un modelo. Junto con los datos y los algoritmos, es uno de los tres motores del progreso del aprendizaje automático.', en: 'The amount of arithmetic operations needed to train or run a model. Along with data and algorithms, it is one of the three engines of progress in machine learning.' } },
  ],

  sources: [
    { title: 'ImageNet Classification with Deep Convolutional Neural Networks', authors: 'Krizhevsky, A., Sutskever, I., Hinton, G. E.', year: 2012, url: 'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html' },
    { title: 'ImageNet Large Scale Visual Recognition Challenge', authors: 'Russakovsky, O., Deng, J., Su, H., et al.', year: 2015, url: 'https://doi.org/10.1007/s11263-015-0816-y' },
    { title: 'ImageNet: A Large-Scale Hierarchical Image Database', authors: 'Deng, J., Dong, W., Socher, R., Li, L.-J., Li, K., Fei-Fei, L.', year: 2009, url: 'https://doi.org/10.1109/CVPR.2009.5206848' },
    { title: 'Deep Residual Learning for Image Recognition', authors: 'He, K., Zhang, X., Ren, S., Sun, J.', year: 2015, url: 'https://arxiv.org/abs/1512.03385' },
    { title: 'Identity Mappings in Deep Residual Networks', authors: 'He, K., Zhang, X., Ren, S., Sun, J.', year: 2016, url: 'https://arxiv.org/abs/1603.05027' },
    { title: 'Understanding the difficulty of training deep feedforward neural networks', authors: 'Glorot, X., Bengio, Y.', year: 2010, url: 'https://proceedings.mlr.press/v9/glorot10a.html' },
    { title: 'Large-scale Deep Unsupervised Learning using Graphics Processors', authors: 'Raina, R., Madhavan, A., Ng, A. Y.', year: 2009, url: 'https://doi.org/10.1145/1553374.1553486' },
    { title: 'AI and Compute', authors: 'Amodei, D., Hernandez, D.', year: 2018, url: 'https://openai.com/index/ai-and-compute/' },
    { title: 'Compute Trends Across Three Eras of Machine Learning', authors: 'Sevilla, J., Heim, L., Ho, A., Besiroglu, T., Hobbhahn, M., Villalobos, P.', year: 2022, url: 'https://arxiv.org/abs/2202.05924' },
    { title: 'Improving neural networks by preventing co-adaptation of feature detectors', authors: 'Hinton, G. E., Srivastava, N., Krizhevsky, A., Sutskever, I., Salakhutdinov, R. R.', year: 2012, url: 'https://arxiv.org/abs/1207.0580' },
    { title: 'Going deeper with convolutions', authors: 'Szegedy, C., et al.', year: 2014, url: 'https://arxiv.org/abs/1409.4842' },
  ],
});
