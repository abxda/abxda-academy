import { defineLesson } from '../../../../../core/define';

// Lección 24 · Leyes de escala y costos. Reescrita para principiantes (criterio «llevar de la mano», 2026-10-12).
// Cifras: ver data.ts (cada una con su fuente) y docs/v2/verificacion/leyes-escala-costos.md.
// La velocidad útil por GPU (400 billones de operaciones por segundo) y el precio (2 dólares por hora) son SUPUESTOS.
export default defineLesson({
  id: 'leyes-escala-costos',

  objectives: {
    es: [
      'Explicar qué es escalar un modelo (más parámetros, más datos, más cómputo) y por qué la pérdida baja de forma predecible, pero cada vez menos.',
      'Leer una gráfica en escala logarítmica y reconocer una ley de escala: cada ×10 en parámetros multiplica la pérdida por el mismo número.',
      'Calcular el cómputo de un entrenamiento con C ≈ 6·N·D y convertirlo en horas de GPU y en dinero, distinguiendo cifras reales de supuestos.',
    ],
    en: [
      'Explain what scaling a model means (more parameters, more data, more compute) and why the loss falls predictably, but less and less.',
      'Read a chart on a logarithmic scale and recognize a scaling law: each ×10 in parameters multiplies the loss by the same number.',
      'Calculate a training run’s compute with C ≈ 6·N·D and turn it into GPU-hours and money, telling real figures from assumptions.',
    ],
  },

  segments: [
    // ── 1 · Escalar: tres perillas ──────────────────────────────────────────────────────────────
    {
      id: 'hook',
      es: 'En la lección anterior, Pythia, con mil cuatrocientos millones de parámetros, aprendió leyendo trescientos mil millones de tokens. Hoy: si lo hacemos más grande, ¿cuánto mejora? ¿Y cuánto cuesta?',
      en: 'In the last lesson, Pythia, with one point four billion parameters, learned by reading three hundred billion tokens. Today: if we make it bigger, how much better does it get? And what does it cost?',
      tts: {
        es: 'En la lección anterior, Pitia, con mil cuatrocientos millones de parámetros, aprendió leyendo trescientos mil millones de tokens. Hoy: si lo hacemos más grande, ¿cuánto mejora? ¿Y cuánto cuesta?',
      },
    },
    {
      id: 'scale',
      es: 'Hacer más grande un modelo se llama escalar, y tiene tres perillas. Veámoslas una por una.',
      en: 'Making a model bigger is called scaling, and it has three knobs. Let’s look at them one at a time.',
    },
    {
      id: 'knob-n',
      es: 'La primera: los parámetros, los números que el modelo ajusta al entrenar. En la lección veintidós contamos los de GPT-3: ciento setenta y cinco mil millones. Los llamaremos N.',
      en: 'The first: the parameters, the numbers the model adjusts as it trains. In lesson twenty-two we counted GPT-3’s: one hundred seventy-five billion. We will call them N.',
      tts: {
        es: 'La primera: los parámetros, los números que el modelo ajusta al entrenar. En la lección veintidós contamos los de ge pe te tres: ciento setenta y cinco mil millones. Los llamaremos ene.',
        en: 'The first: the parameters, the numbers the model adjusts as it trains. In lesson twenty-two we counted G P T three’s: one hundred seventy-five billion. We will call them N.',
      },
    },
    {
      id: 'knob-d',
      es: 'La segunda: los datos de entrenamiento, contados en tokens, las piezas de texto de la lección veinte. GPT-3 leyó unos trescientos mil millones. Los llamaremos D.',
      en: 'The second: the training data, counted in tokens, the pieces of text from lesson twenty. GPT-3 read about three hundred billion. We will call them D.',
      tts: {
        es: 'La segunda: los datos de entrenamiento, contados en tokens, las piezas de texto de la lección veinte. Ge pe te tres leyó unos trescientos mil millones. Los llamaremos de.',
        en: 'The second: the training data, counted in tokens, the pieces of text from lesson twenty. G P T three read about three hundred billion. We will call them D.',
      },
    },
    {
      id: 'knob-c',
      es: 'La tercera: el cómputo, cuántas operaciones hace la computadora en todo el entrenamiento. Crece con las otras dos: más parámetros o más tokens, más operaciones. Lo llamaremos C.',
      en: 'The third: the compute, how many operations the computer performs over the whole training run. It grows with the other two: more parameters or more tokens, more operations. We will call it C.',
      tts: {
        es: 'La tercera: el cómputo, cuántas operaciones hace la computadora en todo el entrenamiento. Crece con las otras dos: más parámetros o más tokens, más operaciones. Lo llamaremos ce.',
      },
      note: { es: 'Escalar: más parámetros N, más tokens de datos D, más cómputo C.', en: 'Scaling: more parameters N, more data tokens D, more compute C.' },
    },
    {
      id: 'loss',
      es: '¿Y cómo sabemos si mejora? Con la pérdida, el error promedio al predecir el token que de verdad seguía, como en la lección anterior. Menos pérdida, mejor modelo.',
      en: 'And how do we know it improves? With the loss, the average error in predicting the token that actually came next, as in the last lesson. Lower loss, better model.',
    },

    // ── 2 · La curva de Kaplan: de la escala normal a la recta ─────────────────────────────────
    {
      id: 'kaplan',
      es: 'En dos mil veinte, Jared Kaplan y un equipo de OpenAI entrenaron modelos de muchos tamaños, de menos de mil a mil quinientos millones de parámetros, y midieron la pérdida de cada uno.',
      en: 'In twenty twenty, Jared Kaplan and a team at OpenAI trained models of many sizes, from under a thousand to one and a half billion parameters, and measured each one’s loss.',
      tts: {
        es: 'En dos mil veinte, Jared Kaplan y un equipo de Open ei ai entrenaron modelos de muchos tamaños, de menos de mil a mil quinientos millones de parámetros, y midieron la pérdida de cada uno.',
        en: 'In twenty twenty, Jared Kaplan and a team at Open A I trained models of many sizes, from under a thousand to one and a half billion parameters, and measured each one’s loss.',
      },
    },
    {
      id: 'axis-x',
      es: 'Pongamos los resultados en una gráfica. El eje horizontal es el tamaño del modelo: cero parámetros a la izquierda, mil quinientos millones a la derecha.',
      en: 'Let’s put the results on a chart. The horizontal axis is model size: zero parameters on the left, one and a half billion on the right.',
    },
    {
      id: 'axis-y',
      es: 'El eje vertical es la pérdida: arriba, un modelo que predice mal; abajo, uno que predice mejor. Mejorar es bajar.',
      en: 'The vertical axis is the loss: at the top, a model that predicts badly; at the bottom, one that predicts better. Improving means going down.',
    },
    {
      id: 'curve',
      es: 'Cada punto es un tamaño de modelo, sobre la curva que Kaplan ajustó a sus mediciones. Baja en picada al principio y luego casi se aplana.',
      en: 'Each dot is a model size, on the curve Kaplan fitted to his measurements. It plunges at first and then almost flattens out.',
      pad: 0.3,
    },
    {
      id: 'diminishing',
      es: 'Dos tramos iguales: los primeros quinientos millones de parámetros bajan la pérdida de casi siete a dos punto cinco; los últimos, casi nada. Son rendimientos decrecientes.',
      en: 'Two equal stretches: the first five hundred million parameters take the loss from almost seven to two point five; the last ones, barely anything. That is diminishing returns.',
      note: { es: 'Rendimientos decrecientes: cada parámetro extra ayuda menos que el anterior.', en: 'Diminishing returns: each extra parameter helps less than the one before.' },
      pad: 0.3,
    },
    {
      id: 'squeeze',
      es: 'Y esta gráfica esconde algo: los modelos pequeños quedan apretados contra la orilla. Del más chico al de cien millones de parámetros, seis modelos caben en este hilo.',
      en: 'And this chart hides something: the small models are squeezed against the edge. From the smallest to the hundred-million-parameter one, six models fit in this sliver.',
    },
    {
      id: 'log-ruler',
      es: 'La solución es la escala logarítmica, que ya asomó en la lección anterior: cada marca vale diez veces la anterior, mil, diez mil, cien mil. Así, multiplicar por diez siempre es el mismo paso.',
      en: 'The fix is the logarithmic scale, seen in the last lesson: each mark is worth ten times the one before, a thousand, ten thousand, a hundred thousand. So multiplying by ten is always the same step.',
      pad: 0.4,
    },
    {
      id: 'log-x',
      es: 'Mira la gráfica mientras el eje horizontal cambia a escala logarítmica: los modelos pequeños se separan, y ahora se ve cada uno.',
      en: 'Watch the chart as the horizontal axis switches to a logarithmic scale: the small models spread out, and now you can see each one.',
      pad: 0.5,
    },
    {
      id: 'log-y',
      es: 'Hacemos lo mismo con el eje vertical, el de la pérdida. Y pasa algo notable: la curva se endereza. Queda una línea recta.',
      en: 'We do the same with the vertical axis, the loss. And something remarkable happens: the curve straightens out. It becomes a straight line.',
      pad: 0.5,
    },
    {
      id: 'straight',
      es: 'Una recta aquí significa algo concreto: cada vez que multiplicas los parámetros por diez, la pérdida se multiplica por el mismo número, cero punto ochenta y cuatro.',
      en: 'A straight line here means something concrete: every time you multiply the parameters by ten, the loss is multiplied by the same number, zero point eight four.',
      pad: 0.4,
    },
    {
      id: 'times10',
      es: 'Por ejemplo: de diez a cien millones de parámetros, la pérdida pasa de tres punto tres siete a dos punto ocho tres. De cien a mil millones, a dos punto tres ocho.',
      en: 'For example: from ten to a hundred million parameters, the loss goes from three point three seven to two point eight three. From a hundred million to a billion, down to two point three eight.',
      pad: 0.3,
    },
    {
      id: 'law',
      es: 'A esta regularidad se le llama ley de escala. Kaplan halló una para cada perilla: con diez veces más datos, o diez veces más cómputo, la pérdida también baja en una proporción fija.',
      en: 'This regularity is called a scaling law. Kaplan found one for each knob: with ten times more data, or ten times more compute, the loss also falls by a fixed proportion.',
      note: { es: 'Ley de escala: cada ×10 en N, D o C multiplica la pérdida por un número fijo.', en: 'Scaling law: each ×10 in N, D, or C multiplies the loss by a fixed number.' },
      pad: 0.3,
    },
    {
      id: 'try-scale',
      es: 'Si quieres, cambia tú la escala con los botones y mira cómo la misma curva se dobla y se endereza.',
      en: 'If you like, switch the scale yourself with the buttons and watch the same curve bend and straighten.',
      gate: {
        id: 'scale',
        prompt: { es: 'cambia la escala y mira la curva doblarse y enderezarse.', en: 'switch the scale and watch the curve bend and straighten.' },
      },
      pad: 0.4,
    },
    {
      id: 'predict',
      es: 'Lo valioso es que la recta predice: entrenas modelos pequeños, que son baratos, la prolongas y estimas la pérdida de uno cien veces mayor antes de pagarlo. Es extrapolar: puede fallar.',
      en: 'The valuable part: the line predicts. You train small, cheap models, extend the line, and estimate the loss of one a hundred times bigger before paying for it. It is extrapolation: it can fail.',
      pad: 0.5,
    },

    // ── 3 · ¿Cuántas operaciones? C ≈ 6·N·D ──────────────────────────────────────────────────────
    {
      id: 'flop',
      es: 'Ahora, el costo, y primero en operaciones. Un FLOP es una sola operación con decimales, una multiplicación o una suma, como dos punto cinco por cero punto tres.',
      en: 'Now the cost, first in operations. A FLOP is a single operation with decimals, a multiplication or an addition, such as two point five times zero point three.',
      tts: {
        es: 'Ahora, el costo, y primero en operaciones. Un flop es una sola operación con decimales, una multiplicación o una suma, como dos punto cinco por cero punto tres.',
        en: 'Now the cost, first in operations. A flop is a single operation with decimals, a multiplication or an addition, such as two point five times zero point three.',
      },
      pad: 0.4,
    },
    {
      id: 'per-param',
      es: 'Cuando un token atraviesa el modelo, cada parámetro hace dos: multiplica el número que le llega por su peso y suma el resultado al total. Con N parámetros, dos N por token.',
      en: 'When a token passes through the model, each parameter does two: it multiplies the number arriving by its weight and adds the result to the total. With N parameters, two N per token.',
      tts: {
        es: 'Cuando un token atraviesa el modelo, cada parámetro hace dos: multiplica el número que le llega por su peso y suma el resultado al total. Con ene parámetros, dos ene por token.',
      },
      pad: 0.3,
    },
    {
      id: 'backward',
      es: 'Eso es solo la ida. Para aprender falta el regreso, la retropropagación de la lección ocho: calcula la culpa de cada peso y la que pasa hacia atrás. Cuesta el doble: cuatro N.',
      en: 'That is only the way forward. To learn, you also need the way back, the backpropagation of lesson eight: it computes each weight’s blame and the blame passed backward. It costs twice as much: four N.',
      tts: {
        es: 'Eso es solo la ida. Para aprender falta el regreso, la retropropagación de la lección ocho: calcula la culpa de cada peso y la que pasa hacia atrás. Cuesta el doble: cuatro ene.',
      },
      pad: 0.4,
    },
    {
      id: 'six',
      es: 'Ida más regreso: dos N más cuatro N, seis N operaciones por cada token de entrenamiento. De ahí sale el seis.',
      en: 'Forward plus back: two N plus four N, six N operations for every training token. That is where the six comes from.',
      tts: {
        es: 'Ida más regreso: dos ene más cuatro ene, seis ene operaciones por cada token de entrenamiento. De ahí sale el seis.',
      },
    },
    {
      id: 'sixnd',
      es: 'Si el modelo lee D tokens, el total es seis por N por D. Ignora detalles, pero DeepMind lo comparó con un conteo exacto y la diferencia no pasó del diez por ciento.',
      en: 'If the model reads D tokens, the total is six times N times D. It ignores details, but DeepMind checked it against an exact count and the gap stayed within ten percent.',
      tts: {
        es: 'Si el modelo lee de tokens, el total es seis por ene por de. Ignora detalles, pero Dip Maind lo comparó con un conteo exacto y la diferencia no pasó del diez por ciento.',
      },
      note: { es: 'Cómputo de entrenamiento: C ≈ 6 · N · D FLOPs.', en: 'Training compute: C ≈ 6 · N · D FLOPs.' },
      pad: 0.3,
    },
    {
      id: 'gpt3',
      es: 'Con GPT-3: seis, por ciento setenta y cinco mil millones de parámetros, por trescientos mil millones de tokens. Da tres punto uno cinco por diez a la veintitrés FLOPs.',
      en: 'For GPT-3: six, times one hundred seventy-five billion parameters, times three hundred billion tokens. That gives three point one five times ten to the twenty-third FLOPs.',
      tts: {
        es: 'Con ge pe te tres: seis, por ciento setenta y cinco mil millones de parámetros, por trescientos mil millones de tokens. Da tres punto uno cinco por diez a la veintitrés flops.',
        en: 'For G P T three: six, times one hundred seventy-five billion parameters, times three hundred billion tokens. That gives three point one five times ten to the twenty-third flops.',
      },
      pad: 0.3,
    },
    {
      id: 'big-number',
      es: '¿Qué tan grande es eso? Diez a la veintitrés es un uno seguido de veintitrés ceros. Son unos trescientos quince mil trillones de operaciones.',
      en: 'How big is that? Ten to the twenty-third is a one followed by twenty-three zeros. That is about three hundred fifteen sextillion operations.',
      pad: 0.3,
    },

    // ── 4 · Presupuesto fijo: Gopher frente a Chinchilla ───────────────────────────────────────
    {
      id: 'budget',
      es: 'Ahora, la pregunta de quien paga. Fíjate: N por D es el área de un rectángulo de ancho N y alto D. El cómputo es seis veces esa área.',
      en: 'Now, the question for whoever pays. Notice: N times D is the area of a rectangle N wide and D tall. The compute is six times that area.',
      tts: {
        es: 'Ahora, la pregunta de quien paga. Fíjate: ene por de es el área de un rectángulo de ancho ene y alto de. El cómputo es seis veces esa área.',
      },
      pad: 0.3,
    },
    {
      id: 'budget-fixed',
      es: 'Con un presupuesto de cómputo fijo, el área no cambia. Puedes tener un modelo grande con pocos datos, ancho y bajo, o uno chico con muchos datos, angosto y alto.',
      en: 'With a fixed compute budget, the area stays the same. You can have a big model with little data, wide and short, or a small one with lots of data, narrow and tall.',
      pad: 0.5,
    },
    {
      id: 'kaplan-advice',
      es: 'Kaplan aconsejaba lo primero: gastar la mayor parte en un modelo más grande. Así se entrenó Gopher, de DeepMind: doscientos ochenta mil millones de parámetros y trescientos mil millones de tokens.',
      en: 'Kaplan advised the first: spend most of it on a bigger model. That is how DeepMind trained Gopher: two hundred eighty billion parameters and three hundred billion tokens.',
      tts: {
        es: 'Kaplan aconsejaba lo primero: gastar la mayor parte en un modelo más grande. Así se entrenó Gófer, de Dip Maind: doscientos ochenta mil millones de parámetros y trescientos mil millones de tokens.',
      },
      pad: 0.4,
    },
    {
      id: 'hoffmann',
      es: 'En dos mil veintidós, Jordan Hoffmann y sus colegas, también en DeepMind, entrenaron más de cuatrocientos modelos y concluyeron otra cosa: parámetros y datos deben crecer a la par.',
      en: 'In twenty twenty-two, Jordan Hoffmann and colleagues, also at DeepMind, trained over four hundred models and concluded otherwise: parameters and data should grow together.',
      tts: {
        es: 'En dos mil veintidós, Jordan Jofman y sus colegas, también en Dip Maind, entrenaron más de cuatrocientos modelos y concluyeron otra cosa: parámetros y datos deben crecer a la par.',
      },
      pad: 0.3,
    },
    {
      id: 'chinchilla',
      es: 'Para probarlo entrenaron Chinchilla, con casi el mismo cómputo que Gopher: setenta mil millones de parámetros, cuatro veces menos, y un billón cuatrocientos mil millones de tokens.',
      en: 'To test it, they trained Chinchilla with almost the same compute as Gopher: seventy billion parameters, four times fewer, and one point four trillion tokens.',
      tts: {
        es: 'Para probarlo entrenaron Chinchilla, con casi el mismo cómputo que Gófer: setenta mil millones de parámetros, cuatro veces menos, y un billón cuatrocientos mil millones de tokens.',
      },
      pad: 0.4,
    },
    {
      id: 'wins',
      es: 'Chinchilla ganó. En MMLU, un examen de cincuenta y siete materias, acertó el sesenta y siete punto seis por ciento; Gopher, el sesenta. Y por ser más chico, es más barato de usar.',
      en: 'Chinchilla won. On MMLU, an exam covering fifty-seven subjects, it scored sixty-seven point six percent; Gopher, sixty. And being smaller, it is cheaper to run.',
      tts: {
        es: 'Chinchilla ganó. En eme eme ele u, un examen de cincuenta y siete materias, acertó el sesenta y siete punto seis por ciento; Gófer, el sesenta. Y por ser más chico, es más barato de usar.',
        en: 'Chinchilla won. On M M L U, an exam covering fifty-seven subjects, it scored sixty-seven point six percent; Gopher, sixty. And being smaller, it is cheaper to run.',
      },
      pad: 0.3,
    },
    {
      id: 'twenty',
      es: 'La regla práctica que dejó: unos veinte tokens de entrenamiento por parámetro. Chinchilla: setenta mil millones por veinte, un billón cuatrocientos mil millones. Es una guía, no una ley.',
      en: 'The rule of thumb it left: about twenty training tokens per parameter. Chinchilla: seventy billion times twenty, one point four trillion. It is a guide, not a law.',
      note: { es: 'Chinchilla: con cómputo fijo, unos 20 tokens por parámetro.', en: 'Chinchilla: with fixed compute, about 20 tokens per parameter.' },
      pad: 0.3,
    },

    // ── 5 · De operaciones a tiempo y dinero ─────────────────────────────────────────────────────
    {
      id: 'gpu-speed',
      es: 'Falta pasar de operaciones a tiempo y a dinero. Una GPU para centros de datos, como la H100 de NVIDIA, hace como máximo casi mil billones de operaciones por segundo.',
      en: 'Now to turn operations into time and money. A data-center GPU, such as NVIDIA’s H100, does at most almost a thousand trillion operations per second.',
      tts: {
        es: 'Falta pasar de operaciones a tiempo y a dinero. Una ge pe u para centros de datos, como la ache cien de Envidia, hace como máximo casi mil billones de operaciones por segundo.',
        en: 'Now to turn operations into time and money. A data-center G P U, such as Nvidia’s H one hundred, does at most almost a thousand trillion operations per second.',
      },
      pad: 0.3,
    },
    {
      id: 'gpu-real',
      es: 'En la práctica rinde menos: espera datos y se coordina con las demás. Al entrenar Llama 3.1, Meta midió unos cuatrocientos billones por segundo en cada una, cerca del cuarenta por ciento.',
      en: 'In practice it delivers less: it waits for data and coordinates with the others. Training Llama 3.1, Meta measured about four hundred trillion per second on each one, around forty percent.',
      tts: {
        es: 'En la práctica rinde menos: espera datos y se coordina con las demás. Al entrenar Lama tres punto uno, Meta midió unos cuatrocientos billones por segundo en cada una, cerca del cuarenta por ciento.',
        en: 'In practice it delivers less: it waits for data and coordinates with the others. Training Llama three point one, Meta measured about four hundred trillion per second on each one, around forty percent.',
      },
      pad: 0.4,
    },
    {
      id: 'llama',
      es: 'Hagamos la cuenta completa con ese modelo: cuatrocientos cinco mil millones de parámetros y quince punto seis billones de tokens. Seis N D da unos tres punto ocho por diez a la veinticinco.',
      en: 'Let’s do the whole calculation with that model: four hundred five billion parameters and fifteen point six trillion tokens. Six N D gives about three point eight times ten to the twenty-fifth.',
      tts: {
        es: 'Hagamos la cuenta completa con ese modelo: cuatrocientos cinco mil millones de parámetros y quince punto seis billones de tokens. Seis ene de da unos tres punto ocho por diez a la veinticinco.',
      },
      pad: 0.3,
    },
    {
      id: 'hours',
      es: 'Si lo dividimos entre los cuatrocientos billones por segundo de una GPU, salen unos veintiséis millones de horas de GPU. Meta reportó treinta punto ocho millones: la cuenta se acerca.',
      en: 'Divide that by one GPU’s four hundred trillion per second, and it comes to about twenty-six million GPU-hours. Meta reported thirty point eight million: the estimate gets close.',
      tts: {
        es: 'Si lo dividimos entre los cuatrocientos billones por segundo de una ge pe u, salen unos veintiséis millones de horas de ge pe u. Meta reportó treinta punto ocho millones: la cuenta se acerca.',
        en: 'Divide that by one G P U’s four hundred trillion per second, and it comes to about twenty-six million G P U hours. Meta reported thirty point eight million: the estimate gets close.',
      },
      pad: 0.3,
    },
    {
      id: 'parallel',
      es: 'Con una sola GPU serían unos tres mil años. Por eso se usan miles a la vez: Meta usó hasta dieciséis mil, y así la cuenta da unos sesenta y siete días.',
      en: 'On a single GPU that would be about three thousand years. That is why thousands run at once: Meta used up to sixteen thousand, and then the math gives about sixty-seven days.',
      tts: {
        es: 'Con una sola ge pe u serían unos tres mil años. Por eso se usan miles a la vez: Meta usó hasta dieciséis mil, y así la cuenta da unos sesenta y siete días.',
        en: 'On a single G P U that would be about three thousand years. That is why thousands run at once: Meta used up to sixteen thousand, and then the math gives about sixty-seven days.',
      },
      pad: 0.3,
    },
    {
      id: 'money',
      es: 'Y el dinero: horas de GPU por el precio de cada hora. Si suponemos dos dólares la hora, son unos cincuenta y tres millones de dólares, ya sea con una GPU o con dieciséis mil.',
      en: 'And the money: GPU-hours times the price of each hour. If we assume two dollars an hour, that is about fifty-three million dollars, whether with one GPU or sixteen thousand.',
      tts: {
        es: 'Y el dinero: horas de ge pe u por el precio de cada hora. Si suponemos dos dólares la hora, son unos cincuenta y tres millones de dólares, ya sea con una ge pe u o con dieciséis mil.',
        en: 'And the money: G P U hours times the price of each hour. If we assume two dollars an hour, that is about fifty-three million dollars, whether with one G P U or sixteen thousand.',
      },
      note: { es: 'Costo ≈ horas de GPU × precio por hora; más GPU acortan el tiempo, no el costo.', en: 'Cost ≈ GPU-hours × hourly price; more GPUs shorten the time, not the cost.' },
      pad: 0.4,
    },
    {
      id: 'calc-demo',
      es: 'La misma cuenta con modelos más chicos: Chinchilla, unos ochocientos veinte mil dólares; GPT-3, unos cuatrocientos cuarenta mil; y Pythia, el de la lección anterior, tres mil quinientos.',
      en: 'The same math for smaller models: Chinchilla, about eight hundred twenty thousand dollars; GPT-3, about four hundred forty thousand; and Pythia, from the last lesson, three thousand five hundred.',
      tts: {
        es: 'La misma cuenta con modelos más chicos: Chinchilla, unos ochocientos veinte mil dólares; ge pe te tres, unos cuatrocientos cuarenta mil; y Pitia, el de la lección anterior, tres mil quinientos.',
        en: 'The same math for smaller models: Chinchilla, about eight hundred twenty thousand dollars; G P T three, about four hundred forty thousand; and Pythia, from the last lesson, three thousand five hundred.',
      },
      pad: 0.5,
    },
    {
      id: 'try-calc',
      es: 'Si quieres, elige tú un modelo y mira cómo cambia cada paso. La velocidad de la GPU y el precio por hora son supuestos, y quedan a la vista.',
      en: 'If you like, pick a model yourself and watch each step change. The GPU speed and the hourly price are assumptions, and they stay in view.',
      tts: {
        es: 'Si quieres, elige tú un modelo y mira cómo cambia cada paso. La velocidad de la ge pe u y el precio por hora son supuestos, y quedan a la vista.',
        en: 'If you like, pick a model yourself and watch each step change. The G P U speed and the hourly price are assumptions, and they stay in view.',
      },
      gate: {
        id: 'calc',
        prompt: { es: 'elige otro modelo y mira cómo cambia la cuenta.', en: 'pick another model and watch the calculation change.' },
      },
      pad: 0.4,
    },

    // ── 6 · ¿Habilidades emergentes? ─────────────────────────────────────────────────────────────
    {
      id: 'emergent',
      es: 'Queda una pregunta: la recta predice la pérdida, pero ¿predice qué sabrá hacer el modelo? En dos mil veintidós, Jason Wei y colegas describieron habilidades emergentes.',
      en: 'One question remains: the line predicts the loss, but does it predict what the model will be able to do? In twenty twenty-two, Jason Wei and colleagues described emergent abilities.',
      tts: {
        es: 'Queda una pregunta: la recta predice la pérdida, pero ¿predice qué sabrá hacer el modelo? En dos mil veintidós, Jason Uei y colegas describieron habilidades emergentes.',
      },
    },
    {
      id: 'emergent-ex',
      es: 'Son habilidades casi nulas en modelos pequeños que aparecen de golpe en los grandes. Por ejemplo, en sumas y restas de tres cifras, GPT-3 casi no acertaba hasta unos trece mil millones de parámetros.',
      en: 'Abilities that are near zero in small models and appear suddenly in large ones. For example, on three-digit addition and subtraction, GPT-3 barely got any right until about thirteen billion parameters.',
      tts: {
        es: 'Son habilidades casi nulas en modelos pequeños que aparecen de golpe en los grandes. Por ejemplo, en sumas y restas de tres cifras, ge pe te tres casi no acertaba hasta unos trece mil millones de parámetros.',
        en: 'Abilities that are near zero in small models and appear suddenly in large ones. For example, on three-digit addition and subtraction, G P T three barely got any right until about thirteen billion parameters.',
      },
      pad: 0.4,
    },
    {
      id: 'mirage',
      es: 'En dos mil veintitrés, Rylan Schaeffer y colegas señalaron un detalle: esas pruebas solo daban el punto si la respuesta entera era exacta. Todo o nada.',
      en: 'In twenty twenty-three, Rylan Schaeffer and colleagues pointed out a detail: those tests only gave credit if the whole answer was exact. All or nothing.',
      tts: {
        es: 'En dos mil veintitrés, Rylan Sheifer y colegas señalaron un detalle: esas pruebas solo daban el punto si la respuesta entera era exacta. Todo o nada.',
      },
      pad: 0.4,
    },
    {
      id: 'mirage-demo',
      es: 'Mira este ejemplo ilustrativo. Medida cifra por cifra, la mejora es gradual con el tamaño. Pero acertar las cinco cifras a la vez sube tarde y de golpe: parece un salto.',
      en: 'Look at this illustrative example. Measured digit by digit, the improvement is gradual with size. But getting all five digits at once rises late and suddenly: it looks like a jump.',
      pad: 0.5,
    },
    {
      id: 'verdict',
      es: 'Su conclusión: parte de lo «emergente» lo pone la forma de medir. El debate sigue abierto. Lo práctico: prueba el modelo en tus propias tareas, con una medida que tenga sentido.',
      en: 'Their conclusion: part of what looks “emergent” comes from how it is measured. The debate is still open. The practical lesson: test the model on your own tasks, with a measure that makes sense.',
      note: { es: 'La pérdida se predice bien; las habilidades concretas, mucho menos.', en: 'Loss is predictable; specific abilities, much less so.' },
      pad: 0.3,
    },

    // ── 7 · Qué decides tú ───────────────────────────────────────────────────────────────────────
    {
      id: 'lens-scratch',
      es: 'Para quien decide: solo la corrida final de un modelo grande cuesta decenas de millones de dólares. Por eso casi nadie entrena desde cero: se parte de un modelo ya entrenado.',
      en: 'For decision-makers: the final run alone of a large model costs tens of millions of dollars. That is why almost nobody trains from scratch: you start from an already trained model.',
      note: { es: 'Casi nadie entrena desde cero: se parte de un modelo ya entrenado.', en: 'Almost nobody trains from scratch: you start from an already trained model.' },
      pad: 0.3,
    },
    {
      id: 'lens-bigger',
      es: 'Y ante «más grande es mejor», pregunta con cuántos datos y cuánto cómputo se entrenó, y cómo le va en tus tareas. Chinchilla, cuatro veces más chico, le ganó a Gopher.',
      en: 'And when you hear “bigger is better,” ask how much data and compute it was trained with, and how it does on your tasks. Chinchilla, four times smaller, beat Gopher.',
      tts: {
        es: 'Y ante «más grande es mejor», pregunta con cuántos datos y cuánto cómputo se entrenó, y cómo le va en tus tareas. Chinchilla, cuatro veces más chico, le ganó a Gófer.',
      },
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Hasta aquí contamos operaciones. Pero hay otro límite: cientos de miles de millones de parámetros tienen que caber en la memoria de las GPU. Ese es el cuello de botella real, y la siguiente lección.',
      en: 'So far we have counted operations. But there is another limit: hundreds of billions of parameters have to fit in the GPUs’ memory. That is the real bottleneck, and the next lesson.',
      tts: {
        es: 'Hasta aquí contamos operaciones. Pero hay otro límite: cientos de miles de millones de parámetros tienen que caber en la memoria de las ge pe us. Ese es el cuello de botella real, y la siguiente lección.',
        en: 'So far we have counted operations. But there is another limit: hundreds of billions of parameters have to fit in the G P Us’ memory. That is the real bottleneck, and the next lesson.',
      },
    },
  ],

  keyIdeas: {
    es: [
      'Escalar un modelo es girar tres perillas: más parámetros (N), más tokens de entrenamiento (D) y más cómputo (C).',
      'La pérdida baja de forma predecible pero con rendimientos decrecientes: en escala logarítmica es una recta, y cada ×10 en parámetros la multiplica por ≈ 0.84 (Kaplan et al., 2020). A eso se le llama ley de escala.',
      'El cómputo de entrenamiento es C ≈ 6·N·D FLOPs: 2N por token de ida y 4N de regreso. Dividido entre la velocidad útil de una GPU da horas de GPU; por el precio por hora, dinero. Más GPU acortan el tiempo, no el costo.',
      'Con un presupuesto fijo conviene crecer parámetros y datos a la par: unos 20 tokens por parámetro. Chinchilla (70 mil M) superó a Gopher (280 mil M) con casi el mismo cómputo.',
      'La pérdida se predice bien; las habilidades concretas, mucho menos. Parte de lo que parece «emergente» depende de cómo se mide (Schaeffer et al., 2023).',
    ],
    en: [
      'Scaling a model means turning three knobs: more parameters (N), more training tokens (D), and more compute (C).',
      'The loss falls predictably but with diminishing returns: on a logarithmic scale it is a straight line, and each ×10 in parameters multiplies it by ≈ 0.84 (Kaplan et al., 2020). That is called a scaling law.',
      'Training compute is C ≈ 6·N·D FLOPs: 2N per token forward and 4N backward. Divided by a GPU’s useful speed it gives GPU-hours; times the hourly price, money. More GPUs shorten the time, not the cost.',
      'With a fixed budget, parameters and data should grow together: about 20 tokens per parameter. Chinchilla (70B) beat Gopher (280B) with almost the same compute.',
      'Loss is predictable; specific abilities, much less so. Part of what looks “emergent” depends on how it is measured (Schaeffer et al., 2023).',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un modelo con más parámetros siempre es mejor: basta con hacerlo más grande.',
      en: 'A model with more parameters is always better: just make it bigger.',
    },
    right: {
      es: 'Importa cómo se gasta el cómputo. Con casi el mismo presupuesto, Chinchilla (70 mil millones de parámetros, 1.4 billones de tokens) superó a Gopher (280 mil millones, 300 mil millones de tokens). Y cada ×10 de tamaño baja la pérdida una proporción fija, mientras el costo se multiplica.',
      en: 'How the compute is spent matters. With almost the same budget, Chinchilla (70 billion parameters, 1.4 trillion tokens) beat Gopher (280 billion, 300 billion tokens). And each ×10 in size lowers the loss by a fixed proportion while the cost multiplies.',
    },
  },

  deeper: {
    es: `## La ley de potencia y la escala logarítmica

Kaplan et al. (2020) entrenaron transformers de 768 a 1 500 millones de parámetros (sin contar los embeddings) con texto de WebText2 y ajustaron la pérdida $L$ (entropía cruzada, en nats por token) frente al número de parámetros $N$, con datos de sobra:

$$L(N)=\\left(\\frac{N_c}{N}\\right)^{\\alpha_N},\\qquad \\alpha_N\\approx 0.076,\\quad N_c\\approx 8.8\\cdot 10^{13}$$

Al tomar logaritmos, $\\log L=\\alpha_N\\log N_c-\\alpha_N\\log N$: una recta de pendiente $-\\alpha_N$ cuando los dos ejes están en escala logarítmica. Multiplicar $N$ por $k$ multiplica $L$ por $k^{-\\alpha_N}$: por 10, $10^{-0.076}\\approx 0.84$. Hay rectas parecidas para los datos ($\\alpha_D\\approx 0.095$, es decir ×0.80 por cada ×10) y para el cómputo bien repartido ($\\alpha_C\\approx 0.050$, ×0.89). Las constantes dependen del vocabulario y de los datos, y fuera del rango medido todo es extrapolación. La lección dibuja esta fórmula publicada, no las mediciones crudas.

## Por qué seis: $C\\approx 6ND$

En la ida, cada parámetro participa en una multiplicación y una suma por token: unos $2N$ FLOPs (Kaplan et al., ec. 2.2, ignorando el término de atención, pequeño cuando $d_{\\text{modelo}}\\gg n_{\\text{ctx}}/12$). El regreso calcula dos cosas, el gradiente respecto de los pesos y respecto de las activaciones, y cada una cuesta lo mismo que la ida (Brown et al., 2020, tabla D.1): unos $4N$. En total, $6N$ por token y

$$C\\approx 6ND$$

Hoffmann et al. (2022, tabla A4) compararon su conteo exacto con $6ND$ en modelos de 73 M a 6.8 mil M de parámetros: la razón fue de 0.99 a 1.10. Para GPT-3, $6\\cdot 175\\cdot 10^{9}\\cdot 300\\cdot 10^{9}=3.15\\cdot 10^{23}$; el artículo reporta $3.14\\cdot 10^{23}$ con $N=174.6$ mil M.

## Presupuesto fijo (Chinchilla)

Hoffmann et al. proponen para la pérdida

$$\\hat L(N,D)=E+\\frac{A}{N^{\\alpha}}+\\frac{B}{D^{\\beta}}$$

$E$ es la pérdida que no se puede quitar; el segundo término, lo que falta por tener un modelo finito; el tercero, por haber visto datos finitos. Minimizar $\\hat L$ con $6ND=C$ fijo da $N_{\\text{opt}}\\propto C^{a}$ y $D_{\\text{opt}}\\propto C^{b}$ con $a\\approx b\\approx 0.5$: parámetros y datos crecen a la par, y su tabla 3 da unos 20 tokens por parámetro (1 000 M → 20.2 mil M de tokens; 10 mil M → 205 mil M). Kaplan había encontrado $N_{\\text{opt}}\\propto C^{0.73}$: con 10 veces más cómputo, 5.5 veces más parámetros y solo 1.8 veces más datos. Besiroglu et al. (2024) reajustaron las cinco constantes con datos reconstruidos de sus gráficas: las publicadas no concordaban con los otros dos métodos del artículo, y las suyas sí (su punto central da unos 26 tokens por parámetro). Llama 3 hizo su propio ajuste y, para $3.8\\cdot 10^{25}$ FLOPs, predijo un modelo de 402 mil M con 16.55 billones de tokens.

Veinte es una guía para gastar bien el cómputo de entrenamiento, no una ley. Si el modelo se va a usar muchísimo, conviene uno más chico entrenado con más tokens, porque cada respuesta cuesta menos (Sardana et al., 2024): Llama 3.1 de 8 mil M leyó más de 15 billones de tokens.

## De FLOPs a horas y dinero

Con una velocidad pico $P$ por GPU y una fracción de aprovechamiento (MFU, *model FLOPs utilization*, Chowdhery et al., 2022),

$$H=\\frac{6ND}{3600\\cdot P\\cdot\\text{MFU}},\\qquad t=\\frac{H}{G},\\qquad \\text{costo}=H\\cdot\\text{precio por hora}$$

$H$ son las horas de GPU y $t$ el tiempo con $G$ GPU a la vez. Como $H$ no depende de $G$, duplicar las GPU reduce el tiempo a la mitad y deja el costo igual, mientras el aprovechamiento se mantenga. La ficha de la H100 da 1 979 teraFLOPS en BF16 «con dispersión»; sin ella, es la mitad (NVIDIA, 2021: la dispersión 2:4 duplica el rendimiento pico), unos 989. Llama 3 405B midió de 380 a 430 teraFLOPS por GPU, un MFU de 38 a 43 % (tabla 4), con hasta 16 384 GPU y 466 interrupciones en un periodo de 54 días. PaLM reporta 46.2 % y estima 21.3 % para GPT-3.

## En código

\`\`\`python
def entrenamiento(n, d, util=400e12, precio=2.0, gpus=16384):
    flops = 6 * n * d                  # C ≈ 6·N·D
    horas = flops / util / 3600        # horas de GPU
    return flops, horas, horas / gpus / 24, horas * precio

modelos = [("Pythia 1.4B", 1.4e9, 300e9), ("GPT-3", 175e9, 300e9),
           ("Chinchilla", 70e9, 1.4e12), ("Llama 3.1 405B", 405e9, 15.6e12)]
for nombre, n, d in modelos:
    c, h, dias, usd = entrenamiento(n, d)
    print(f"{nombre:15} C = {c:.2e}  horas = {h:9.0f}  días = {dias:5.1f}  US$ {usd:9.0f}")

print(round(10 ** -0.076, 3))          # ×10 en N: la pérdida se multiplica por esto
\`\`\`

Salida:

\`\`\`
Pythia 1.4B     C = 2.52e+21  horas =      1750  días =   0.0  US$      3500
GPT-3           C = 3.15e+23  horas =    218750  días =   0.6  US$    437500
Chinchilla      C = 5.88e+23  horas =    408333  días =   1.0  US$    816667
Llama 3.1 405B  C = 3.79e+25  horas =  26325000  días =  66.9  US$  52650000
0.839
\`\`\`

Los 400 billones de operaciones útiles por segundo, los 2 dólares por hora y las 16 384 GPU son **supuestos** (los dos primeros no son precios ni mediciones de cada modelo; GPT-3 y Chinchilla se entrenaron en otro hardware). La cifra cubre solo la corrida final: ni ensayos, ni fallas, ni datos, ni personas. Meta reportó 30.84 millones de horas de GPU H100 para Llama 3.1 405B.

## Lo que viene

La lección 25 cuenta bytes en lugar de operaciones: qué modelo cabe en la memoria de una GPU y cómo se reparte el trabajo. La 26 mide el costo de usar el modelo, que con mucha demanda pesa más que el de entrenarlo. La 27 reutiliza un modelo base en vez de repetir esta cuenta.`,
    en: `## The power law and the logarithmic scale

Kaplan et al. (2020) trained transformers from 768 to 1.5 billion parameters (not counting embeddings) on WebText2 text and fitted the loss $L$ (cross-entropy, in nats per token) against the number of parameters $N$, with plenty of data:

$$L(N)=\\left(\\frac{N_c}{N}\\right)^{\\alpha_N},\\qquad \\alpha_N\\approx 0.076,\\quad N_c\\approx 8.8\\cdot 10^{13}$$

Taking logarithms, $\\log L=\\alpha_N\\log N_c-\\alpha_N\\log N$: a straight line with slope $-\\alpha_N$ when both axes are on a logarithmic scale. Multiplying $N$ by $k$ multiplies $L$ by $k^{-\\alpha_N}$: by 10, $10^{-0.076}\\approx 0.84$. There are similar lines for data ($\\alpha_D\\approx 0.095$, that is ×0.80 per ×10) and for well-allocated compute ($\\alpha_C\\approx 0.050$, ×0.89). The constants depend on the vocabulary and the data, and outside the measured range everything is extrapolation. The lesson draws this published formula, not the raw measurements.

## Why six: $C\\approx 6ND$

On the way forward, each parameter takes part in one multiplication and one addition per token: about $2N$ FLOPs (Kaplan et al., eq. 2.2, ignoring the attention term, small when $d_{\\text{model}}\\gg n_{\\text{ctx}}/12$). The way back computes two things, the gradient with respect to the weights and with respect to the activations, and each costs about as much as the forward pass (Brown et al., 2020, table D.1): about $4N$. In total, $6N$ per token and

$$C\\approx 6ND$$

Hoffmann et al. (2022, table A4) compared their exact count with $6ND$ for models from 73M to 6.8B parameters: the ratio was 0.99 to 1.10. For GPT-3, $6\\cdot 175\\cdot 10^{9}\\cdot 300\\cdot 10^{9}=3.15\\cdot 10^{23}$; the paper reports $3.14\\cdot 10^{23}$ with $N=174.6$B.

## A fixed budget (Chinchilla)

Hoffmann et al. propose for the loss

$$\\hat L(N,D)=E+\\frac{A}{N^{\\alpha}}+\\frac{B}{D^{\\beta}}$$

$E$ is the loss that cannot be removed; the second term is what is missing from having a finite model; the third, from having seen finite data. Minimizing $\\hat L$ with $6ND=C$ fixed gives $N_{\\text{opt}}\\propto C^{a}$ and $D_{\\text{opt}}\\propto C^{b}$ with $a\\approx b\\approx 0.5$: parameters and data grow together, and their table 3 gives about 20 tokens per parameter (1B → 20.2B tokens; 10B → 205B). Kaplan had found $N_{\\text{opt}}\\propto C^{0.73}$: with 10 times more compute, 5.5 times more parameters and only 1.8 times more data. Besiroglu et al. (2024) refitted the five constants on data reconstructed from the paper’s plots: the published ones did not agree with the paper’s other two methods, and theirs do (their point estimate gives about 26 tokens per parameter). Llama 3 ran its own fit and, for $3.8\\cdot 10^{25}$ FLOPs, predicted a 402B model with 16.55 trillion tokens.

Twenty is a guide for spending training compute well, not a law. If the model will be used a lot, a smaller one trained on more tokens pays off, because each answer costs less (Sardana et al., 2024): the 8B Llama 3.1 read over 15 trillion tokens.

## From FLOPs to hours and money

With a peak speed $P$ per GPU and a utilization fraction (MFU, *model FLOPs utilization*, Chowdhery et al., 2022),

$$H=\\frac{6ND}{3600\\cdot P\\cdot\\text{MFU}},\\qquad t=\\frac{H}{G},\\qquad \\text{cost}=H\\cdot\\text{price per hour}$$

$H$ is GPU-hours and $t$ the time with $G$ GPUs at once. Since $H$ does not depend on $G$, doubling the GPUs halves the time and leaves the cost unchanged, as long as utilization holds. The H100 datasheet gives 1,979 teraFLOPS in BF16 “with sparsity”; without it, it is half (NVIDIA, 2021: 2:4 sparsity doubles peak throughput), about 989. Llama 3 405B measured 380 to 430 teraFLOPS per GPU, an MFU of 38 to 43% (table 4), with up to 16,384 GPUs and 466 interruptions over a 54-day period. PaLM reports 46.2% and estimates 21.3% for GPT-3.

## In code

\`\`\`python
def training(n, d, useful=400e12, price=2.0, gpus=16384):
    flops = 6 * n * d                  # C ≈ 6·N·D
    hours = flops / useful / 3600      # GPU-hours
    return flops, hours, hours / gpus / 24, hours * price

models = [("Pythia 1.4B", 1.4e9, 300e9), ("GPT-3", 175e9, 300e9),
          ("Chinchilla", 70e9, 1.4e12), ("Llama 3.1 405B", 405e9, 15.6e12)]
for name, n, d in models:
    c, h, days, usd = training(n, d)
    print(f"{name:15} C = {c:.2e}  hours = {h:9.0f}  days = {days:5.1f}  USD {usd:9.0f}")

print(round(10 ** -0.076, 3))          # ×10 in N: the loss is multiplied by this
\`\`\`

Output:

\`\`\`
Pythia 1.4B     C = 2.52e+21  hours =      1750  days =   0.0  USD      3500
GPT-3           C = 3.15e+23  hours =    218750  days =   0.6  USD    437500
Chinchilla      C = 5.88e+23  hours =    408333  days =   1.0  USD    816667
Llama 3.1 405B  C = 3.79e+25  hours =  26325000  days =  66.9  USD  52650000
0.839
\`\`\`

The 400 trillion useful operations per second, the 2 dollars per hour, and the 16,384 GPUs are **assumptions** (the first two are neither prices nor measurements for each model; GPT-3 and Chinchilla were trained on other hardware). The figure covers only the final run: no experiments, failures, data, or people. Meta reported 30.84 million H100 GPU-hours for Llama 3.1 405B.

## What comes next

Lesson 25 counts bytes instead of operations: which model fits in a GPU’s memory and how the work is split. Lesson 26 measures the cost of using the model, which with heavy demand outweighs the cost of training it. Lesson 27 reuses a base model instead of repeating this arithmetic.`,
  },

  lens: {
    es: [
      'Entrenar desde cero está fuera de alcance para casi todas las organizaciones: con supuestos modestos, solo la corrida final de un modelo como Llama 3.1 405B ronda las decenas de millones de dólares en cómputo, sin ensayos, fallas, datos ni personal. La decisión real es qué modelo usar, si ajustarlo (lección 27) y cuánto cuesta servirlo (lección 26).',
      'Ante «más grande = mejor», pregunta con cuántos tokens y cuánto cómputo se entrenó, y pide resultados en tus tareas. Con casi el mismo cómputo, Chinchilla (70 mil millones de parámetros) superó a Gopher (280 mil millones).',
      'Los rendimientos decrecen: cada ×10 de parámetros cuesta unas diez veces más y baja la pérdida en una proporción fija (×0.84). Antes de pagar el siguiente salto, pregunta cuánto vale esa mejora en tu caso; y recuerda que una pérdida menor no garantiza una habilidad concreta.',
      'Ante un presupuesto de entrenamiento, pide el desglose: FLOPs (6·N·D), horas de GPU, velocidad útil supuesta y precio por hora. Más GPU acortan el calendario, no el costo; y los clústeres grandes pierden tiempo en fallas (Llama 3: 466 interrupciones en 54 días).',
    ],
    en: [
      'Training from scratch is out of reach for almost every organization: with modest assumptions, the final run alone of a model like Llama 3.1 405B costs tens of millions of dollars in compute, without experiments, failures, data, or staff. The real decision is which model to use, whether to adapt it (lesson 27), and what it costs to serve (lesson 26).',
      'When you hear “bigger = better,” ask how many tokens and how much compute it was trained with, and ask for results on your tasks. With almost the same compute, Chinchilla (70 billion parameters) beat Gopher (280 billion).',
      'Returns diminish: each ×10 in parameters costs about ten times more and lowers the loss by a fixed proportion (×0.84). Before paying for the next jump, ask what that improvement is worth in your case; and remember that a lower loss does not guarantee a specific ability.',
      'Faced with a training budget, ask for the breakdown: FLOPs (6·N·D), GPU-hours, assumed useful speed, and hourly price. More GPUs shorten the calendar, not the cost; and large clusters lose time to failures (Llama 3: 466 interruptions in 54 days).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: {
        es: 'En la gráfica con los dos ejes en escala logarítmica, la pérdida frente al tamaño del modelo es una recta. ¿Qué significa en la práctica?',
        en: 'On the chart with both axes on a logarithmic scale, loss versus model size is a straight line. What does that mean in practice?',
      },
      options: [
        { es: 'Cada parámetro adicional baja la pérdida en la misma cantidad.', en: 'Each additional parameter lowers the loss by the same amount.' },
        { es: 'Cada vez que multiplicas los parámetros por diez, la pérdida se multiplica por el mismo número (≈ 0.84).', en: 'Every time you multiply the parameters by ten, the loss is multiplied by the same number (≈ 0.84).' },
        { es: 'Con suficientes parámetros, la pérdida llega a cero.', en: 'With enough parameters, the loss reaches zero.' },
        { es: 'Pasado cierto tamaño, los parámetros dejan de ayudar.', en: 'Past a certain size, parameters stop helping.' },
      ],
      answer: 1,
      why: {
        es: 'En escala logarítmica, multiplicar por diez es siempre el mismo paso; una recta dice que cada paso baja la pérdida en la misma proporción. Por eso cada mejora cuesta diez veces más que la anterior: rendimientos decrecientes.',
        en: 'On a logarithmic scale, multiplying by ten is always the same step; a straight line says each step lowers the loss by the same proportion. That is why each improvement costs ten times more than the last: diminishing returns.',
      },
    },
    {
      kind: 'concept',
      q: {
        es: 'Con un presupuesto de cómputo fijo, ¿qué mostraron Hoffmann y colegas con Chinchilla?',
        en: 'With a fixed compute budget, what did Hoffmann and colleagues show with Chinchilla?',
      },
      options: [
        { es: 'Que conviene el modelo más grande posible, aunque lea pocos datos.', en: 'That the biggest possible model is best, even if it reads little data.' },
        { es: 'Que el tamaño del modelo casi no importa.', en: 'That model size hardly matters.' },
        { es: 'Que conviene repetir los mismos datos muchas veces.', en: 'That it pays to repeat the same data many times.' },
        { es: 'Que parámetros y datos deben crecer a la par: unos veinte tokens por parámetro.', en: 'That parameters and data should grow together: about twenty tokens per parameter.' },
      ],
      answer: 3,
      why: {
        es: 'Con casi el mismo cómputo que Gopher (280 mil millones de parámetros, 300 mil millones de tokens), Chinchilla (70 mil millones, 1.4 billones de tokens) ganó: 67.6 % frente a 60.0 % en MMLU.',
        en: 'With almost the same compute as Gopher (280 billion parameters, 300 billion tokens), Chinchilla (70 billion, 1.4 trillion tokens) won: 67.6% versus 60.0% on MMLU.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un modelo de 7 mil millones de parámetros se entrena con 140 mil millones de tokens. Con C ≈ 6·N·D, ¿cuántos FLOPs necesita?',
        en: 'A 7-billion-parameter model is trained on 140 billion tokens. With C ≈ 6·N·D, how many FLOPs does it need?',
      },
      options: [
        { es: '9.8 × 10²⁰', en: '9.8 × 10²⁰' },
        { es: '5.9 × 10²¹', en: '5.9 × 10²¹' },
        { es: '5.9 × 10²²', en: '5.9 × 10²²' },
        { es: '1.96 × 10²¹', en: '1.96 × 10²¹' },
      ],
      answer: 1,
      why: {
        es: '6 × 7 × 10⁹ × 1.4 × 10¹¹ = 5.88 × 10²¹. La opción 9.8 × 10²⁰ olvida el 6; la de 1.96 × 10²¹ cuenta solo la ida (2·N·D) y olvida el regreso (4·N·D).',
        en: '6 × 7 × 10⁹ × 1.4 × 10¹¹ = 5.88 × 10²¹. The 9.8 × 10²⁰ option forgets the 6; the 1.96 × 10²¹ one counts only the forward pass (2·N·D) and forgets the backward pass (4·N·D).',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un proveedor dice que su modelo es mejor «porque tiene 500 mil millones de parámetros», y otro te ofrece entrenar el tuyo «el doble de rápido con el doble de GPU». ¿Qué respondes?',
        en: 'A vendor says its model is better “because it has 500 billion parameters,” and another offers to train yours “twice as fast with twice the GPUs.” What do you reply?',
      },
      options: [
        { es: 'Que el más grande gana y que el doble de GPU cuesta la mitad.', en: 'That the biggest wins and that twice the GPUs costs half as much.' },
        { es: 'Pido con cuántos tokens y cuánto cómputo se entrenó y su resultado en mis tareas; y sé que el doble de GPU acorta el tiempo, pero no el costo.', en: 'I ask how many tokens and how much compute it was trained with and how it does on my tasks; and I know twice the GPUs shortens the time, but not the cost.' },
        { es: 'Pido el número de capas, que es lo que decide la calidad.', en: 'I ask for the number of layers, which is what decides quality.' },
        { es: 'Nada: con más parámetros y más GPU siempre sale mejor y más barato.', en: 'Nothing: more parameters and more GPUs always come out better and cheaper.' },
      ],
      answer: 1,
      why: {
        es: 'El tamaño solo no dice nada sin los datos, el cómputo y una prueba en tu caso (Chinchilla, cuatro veces más chico, superó a Gopher). Y las horas de GPU (C ÷ velocidad útil) no cambian con el número de GPU: se pagan las mismas horas, solo que a la vez.',
        en: 'Size alone says nothing without the data, the compute, and a test on your case (Chinchilla, four times smaller, beat Gopher). And GPU-hours (C ÷ useful speed) do not change with the number of GPUs: you pay for the same hours, just at once.',
      },
    },
  ],

  glossary: ['scaling-law', 'flops', 'chinchilla', 'compute-budget', 'parameter', 'loss', 'token', 'gpu', 'compute', 'backpropagation', 'pretraining', 'base-model', 'language-model', 'model'],

  terms: [
    { id: 'scaling-law', term: { es: 'Ley de escala', en: 'Scaling law' }, def: { es: 'Regularidad medida, no una ley de la naturaleza: la pérdida de un modelo baja como una potencia de sus parámetros, sus datos o su cómputo. En escala logarítmica se ve como una recta: cada ×10 multiplica la pérdida por el mismo número.', en: 'A measured regularity, not a law of nature: a model’s loss falls as a power of its parameters, its data, or its compute. On a logarithmic scale it looks like a straight line: each ×10 multiplies the loss by the same number.' } },
    { id: 'flops', term: { es: 'FLOP, FLOPs', en: 'FLOP, FLOPs' }, def: { es: 'Operación de punto flotante: una suma o una multiplicación con decimales. El cómputo de un entrenamiento se cuenta en FLOPs totales (≈ 6·N·D); la velocidad de un chip, en FLOPs por segundo.', en: 'Floating-point operation: an addition or a multiplication with decimals. A training run’s compute is counted in total FLOPs (≈ 6·N·D); a chip’s speed, in FLOPs per second.' } },
    { id: 'chinchilla', term: { es: 'Chinchilla', en: 'Chinchilla' }, def: { es: 'Modelo de DeepMind (2022; 70 mil millones de parámetros, 1.4 billones de tokens) y la regla que dejó: con un presupuesto fijo, parámetros y datos deben crecer a la par, unos 20 tokens por parámetro.', en: 'A DeepMind model (2022; 70 billion parameters, 1.4 trillion tokens) and the rule it left: with a fixed budget, parameters and data should grow together, about 20 tokens per parameter.' } },
    { id: 'compute-budget', term: { es: 'Presupuesto de cómputo', en: 'Compute budget' }, def: { es: 'Total de FLOPs que se decide gastar en entrenar un modelo. Como C ≈ 6·N·D, fija el «área» que se reparte entre tamaño del modelo y cantidad de datos: si sube uno, baja el otro.', en: 'The total number of FLOPs you decide to spend on training a model. Since C ≈ 6·N·D, it fixes the “area” split between model size and amount of data: if one goes up, the other goes down.' } },
  ],

  sources: [
    { title: 'Scaling Laws for Neural Language Models', authors: 'Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., Child, R., Gray, S., Radford, A., Wu, J., Amodei, D.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'Training Compute-Optimal Large Language Models (Chinchilla)', authors: 'Hoffmann, J., Borgeaud, S., Mensch, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2203.15556' },
    { title: 'Scaling Language Models: Methods, Analysis & Insights from Training Gopher', authors: 'Rae, J. W., Borgeaud, S., Cai, T., et al.', year: 2021, url: 'https://arxiv.org/abs/2112.11446' },
    { title: 'Language Models are Few-Shot Learners (tabla D.1: cómputo de GPT-3)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling', authors: 'Biderman, S., Schoelkopf, H., Anthony, Q., et al.', year: 2023, url: 'https://arxiv.org/abs/2304.01373' },
    { title: 'The Llama 3 Herd of Models', authors: 'Grattafiori, A., et al. (Llama Team, AI @ Meta)', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Llama 3.1 Model Card (horas de GPU de entrenamiento)', authors: 'Meta', year: 2024, url: 'https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md' },
    { title: 'NVIDIA H100 Tensor Core GPU (especificaciones)', authors: 'NVIDIA', year: 2022, url: 'https://www.nvidia.com/en-us/data-center/h100/' },
    { title: 'Accelerating Inference with Sparsity Using the NVIDIA Ampere Architecture and NVIDIA TensorRT (tabla 1: rendimiento denso frente a disperso)', authors: 'Pool, J., Sawarkar, A., Rodge, J. (NVIDIA)', year: 2021, url: 'https://developer.nvidia.com/blog/accelerating-inference-with-sparsity-using-ampere-and-tensorrt/' },
    { title: 'PaLM: Scaling Language Modeling with Pathways (definición de MFU)', authors: 'Chowdhery, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2204.02311' },
    { title: 'Emergent Abilities of Large Language Models', authors: 'Wei, J., Tay, Y., Bommasani, R., et al.', year: 2022, url: 'https://arxiv.org/abs/2206.07682' },
    { title: 'Are Emergent Abilities of Large Language Models a Mirage?', authors: 'Schaeffer, R., Miranda, B., Koyejo, S.', year: 2023, url: 'https://arxiv.org/abs/2304.15004' },
    { title: 'Chinchilla Scaling: A replication attempt', authors: 'Besiroglu, T., Erdil, E., Barnett, M., You, J.', year: 2024, url: 'https://arxiv.org/abs/2404.10102' },
    { title: 'Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws', authors: 'Sardana, N., Portes, J., Doubov, S., Frankle, J.', year: 2024, url: 'https://arxiv.org/abs/2401.00448' },
  ],
});
