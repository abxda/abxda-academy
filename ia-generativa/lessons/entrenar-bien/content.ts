import { defineLesson } from '../../../../../core/define';

// Lección 9 · Entrenar bien. Los lotes, las épocas y los optimizadores (SGD, momento, Adam) corren de verdad sobre un modelo de
// juguete de dos pesos y 256 ejemplos (sim.ts); lo único inventado es la forma del paisaje, y se rotula así en la escena.
// Cifras reales verificadas en fuente primaria: Kingma y Ba (2015), Goyal et al. (2017), Brown et al. (2020, GPT-3: Tabla 2.1,
// Tabla 2.2 y Apéndice B), Vaswani et al. (2017), Loshchilov y Hutter (2017). El código de «Por dentro» se ejecutó para obtener su salida.
export default defineLesson({
  id: 'entrenar-bien',

  objectives: {
    es: [
      'Explicar por qué se entrena con lotes al azar en lugar de usar todos los ejemplos, y calcular cuántos pasos tiene una época.',
      'Distinguir qué aporta cada optimizador (SGD, momento, Adam) y por qué cada uno pide su propia tasa de aprendizaje.',
      'Predecir qué hacen el calentamiento y el decaimiento de la tasa, y reconocer qué ajustes son hiperparámetros.',
    ],
    en: [
      'Explain why we train on random batches instead of using every example, and compute how many steps an epoch has.',
      'Tell what each optimizer (SGD, momentum, Adam) contributes and why each one wants its own learning rate.',
      'Predict what warmup and decay of the rate do, and recognize which settings are hyperparameters.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Hasta ahora corregimos los pesos con un solo ejemplo. Un modelo real aprende de millones. ¿Cuántos ejemplos hay que mirar antes de dar cada paso?',
      en: 'So far we have corrected the weights using a single example. A real model learns from millions. How many examples should we look at before taking each step?',
    },
    {
      id: 'toy',
      es: 'Para verlo usaremos un modelo de juguete: dos pesos y doscientos cincuenta y seis ejemplos. Cada ejemplo prefiere unos pesos distintos, y lo marcamos con un punto.',
      en: 'To see it we will use a toy model: two weights and two hundred fifty-six examples. Each example prefers different weights, and we mark that preference with a dot.',
    },
    {
      id: 'average',
      es: 'El error total es el promedio de los errores de todos los ejemplos. Su mínimo, el fondo del valle, queda justo en el centro de la nube de puntos.',
      en: 'The total error is the average of the errors of all the examples. Its minimum, the bottom of the valley, sits right at the center of the cloud of dots.',
    },
    {
      id: 'full',
      es: 'Con todos los ejemplos, el descenso del gradiente de la lección cuatro calcula la pendiente del error promedio. Es exacto, pero cada paso cuesta mirar los doscientos cincuenta y seis.',
      en: 'With every example, the gradient descent from lesson four computes the slope of the average error. It is exact, but each step costs a look at all two hundred fifty-six.',
      pad: 0.3,
    },
    {
      id: 'sample',
      es: 'Con millones de ejemplos eso sería lentísimo. ¿Hace falta tanta precisión? Basta una muestra: unos pocos ejemplos al azar, un lote, y la pendiente calculada solo con ellos.',
      en: 'With millions of examples that would be painfully slow. Is that much precision needed? A sample is enough: a few examples picked at random, a batch, and the slope computed from just those.',
      note: { es: 'Lote: pocos ejemplos al azar con los que se estima la pendiente.', en: 'Batch: a few random examples used to estimate the slope.' },
    },
    {
      id: 'noisy',
      es: 'Cada lote opina algo distinto, así que su flecha sale algo desviada. Con otros lotes, las flechas se reparten alrededor de la verdadera y, en promedio, la aciertan.',
      en: 'Each batch has a slightly different opinion, so its arrow points a little off. With other batches, the arrows scatter around the true one and, on average, they get it right.',
      note: { es: 'Un lote da una pendiente con ruido, pero bien orientada en promedio.', en: 'A batch gives a noisy slope, but one that points the right way on average.' },
      pad: 0.3,
    },
    {
      id: 'bigger',
      es: 'Un lote mayor cierra el abanico, pero despacio: a grandes rasgos, reducir el ruido a la mitad exige un lote cuatro veces más grande.',
      en: 'A bigger batch tightens the fan, but slowly: roughly speaking, cutting the noise in half takes a batch four times as large.',
      pad: 0.3,
    },
    {
      id: 'sgd',
      es: 'Entrenar con lotes se llama descenso del gradiente estocástico, o SGD. «Estocástico» significa que interviene el azar, y aun así el camino llega al fondo.',
      en: 'Training with batches is called stochastic gradient descent, or SGD. “Stochastic” means chance is involved, and the path still reaches the bottom.',
      tts: {
        es: 'Entrenar con lotes se llama descenso del gradiente estocástico, o ese ge de. «Estocástico» significa que interviene el azar, y aun así el camino llega al fondo.',
        en: 'Training with batches is called stochastic gradient descent, or S G D. “Stochastic” means chance is involved, and the path still reaches the bottom.',
      },
      note: { es: 'SGD: cada paso usa el gradiente de un lote al azar. Una época recorre todos los ejemplos.', en: 'SGD: each step uses the gradient of a random batch. An epoch covers all the examples.' },
      pad: 0.3,
    },
    {
      id: 'epoch',
      es: 'Los ejemplos se barajan y se recorren por lotes, sin repetir. Un recorrido completo es una época: con lotes de ocho ejemplos, una época son treinta y dos pasos.',
      en: 'The examples are shuffled and visited in batches, with no repeats. One full pass is an epoch: with batches of eight examples, one epoch is thirty-two steps.',
      pad: 0.3,
    },
    {
      id: 'cheap',
      es: 'Con el mismo trabajo, mil veinticuatro ejemplos vistos, el lote completo da cuatro pasos y el lote de ocho da ciento veintiocho. Algo peor orientados, pero mucho más baratos.',
      en: 'For the same work, one thousand twenty-four examples seen, the full batch takes four steps and the batch of eight takes one hundred twenty-eight. Each is aimed a bit worse, but far cheaper.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: elige el tamaño del lote y pulsa Entrenar. Todos tienen el mismo presupuesto, cuatro épocas. Busca el que deje el menor error.',
      en: 'Your turn: pick the batch size and press Train. Every size gets the same budget, four epochs. Look for the one that leaves the smallest error.',
      gate: {
        id: 'batch',
        prompt: {
          es: 'Prueba al menos tres tamaños de lote y encuentra uno que termine con error menor que 0.05.',
          en: 'Try at least three batch sizes and find one that ends with an error below 0.05.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'tradeoff',
      es: 'Mira el patrón. Con lotes enormes das pocos pasos; con lotes de uno, muchos, pero muy ruidosos. Lo mejor queda en medio, y se mueve con la tasa y el presupuesto.',
      en: 'Look at the pattern. With huge batches you take few steps; with batches of one, many, but very noisy. The best sits in the middle, and it moves with the rate and the budget.',
      note: { es: 'Lote grande: pocos pasos limpios. Lote chico: muchos pasos ruidosos. Lo mejor suele estar en medio.', en: 'Big batch: few clean steps. Small batch: many noisy steps. The best is usually in between.' },
      pad: 0.4,
    },
    {
      id: 'real-batch',
      es: 'A escala real los lotes son enormes y se miden en tokens. GPT-3 terminó con lotes de tres millones doscientos mil tokens, y empezó con unos treinta y dos mil.',
      en: 'At real scale batches are enormous and are measured in tokens. GPT-3 ended with batches of three point two million tokens, and started with about thirty-two thousand.',
      tts: {
        es: 'A escala real los lotes son enormes y se miden en tokens. Ge pe te tres terminó con lotes de tres millones doscientos mil tokens, y empezó con unos treinta y dos mil.',
        en: 'At real scale batches are enormous and are measured in tokens. G P T three ended with batches of three point two million tokens, and started with about thirty-two thousand.',
      },
      pad: 0.3,
    },
    {
      id: 'canyon',
      es: 'Pasemos a la forma del paisaje. Este valle es un cañón: muy empinado a los lados y casi plano a lo largo. Cada dirección pide un paso distinto.',
      en: 'Now the shape of the landscape. This valley is a canyon: very steep on the sides and almost flat along the bottom. Each direction wants a different step.',
      pad: 0.3,
    },
    {
      id: 'sgd-big',
      es: 'La regla que convierte el gradiente en un paso es el optimizador. SGD, el más simple, rebota de pared a pared con un paso grande, y con uno mayor diverge.',
      en: 'The rule that turns the gradient into a step is the optimizer. SGD, the simplest, bounces from wall to wall with a large step, and with a larger one it diverges.',
      tts: {
        es: 'La regla que convierte el gradiente en un paso es el optimizador. Ese ge de, el más simple, rebota de pared a pared con un paso grande, y con uno mayor diverge.',
        en: 'The rule that turns the gradient into a step is the optimizer. S G D, the simplest, bounces from wall to wall with a large step, and with a larger one it diverges.',
      },
      pad: 0.5,
    },
    {
      id: 'sgd-small',
      es: 'Con un paso pequeño no rebota, pero casi no avanza por el fondo, donde la pendiente es plana. La pared fija el límite de la tasa; el fondo, la velocidad.',
      en: 'With a small step it does not bounce, but it barely moves along the bottom, where the slope is flat. The wall sets the limit on the rate; the bottom sets the speed.',
      pad: 0.4,
    },
    {
      id: 'momentum',
      es: 'El momento añade inercia: cada paso recuerda a los anteriores. Las sacudidas laterales se cancelan entre sí y el avance a lo largo del fondo se acumula.',
      en: 'Momentum adds inertia: each step remembers the previous ones. The sideways jolts cancel each other out and the progress along the bottom builds up.',
      note: { es: 'Momento: el paso recuerda a los anteriores, como una pelota que rueda.', en: 'Momentum: the step remembers earlier ones, like a rolling ball.' },
      pad: 0.4,
    },
    {
      id: 'momentum-cost',
      es: 'Como una pelota que rueda, gana velocidad en terreno parejo. El precio es que se pasa de largo y oscila un rato antes de asentarse.',
      en: 'Like a rolling ball, it gains speed on even ground. The price is that it overshoots and swings back and forth for a while before settling.',
      pad: 0.4,
    },
    {
      id: 'adam-idea',
      es: 'Adam va más lejos: cada peso recibe su propio tamaño de paso. Divide el avance entre el tamaño habitual de su gradiente, y así el peso de pendiente suave no se queda atrás.',
      en: 'Adam goes further: every weight gets its own step size. It divides the progress by the usual size of its gradient, so the weight on a gentle slope does not fall behind.',
      pad: 0.4,
    },
    {
      id: 'adam-how',
      es: 'Para eso guarda dos promedios móviles por peso: el del gradiente, que hace de momento, y el de su cuadrado, que mide cuánto suele variar.',
      en: 'To do that it keeps two moving averages per weight: one of the gradient, which acts as momentum, and one of its square, which tracks how much it usually varies.',
      note: { es: 'Adam: momento más un tamaño de paso propio para cada peso.', en: 'Adam: momentum plus a step size of its own for each weight.' },
      pad: 0.3,
    },
    {
      id: 'adam-honest',
      es: 'No es magia. Ayuda sobre todo cuando los pesos viven en escalas muy distintas, y con tasa constante suele seguir rebotando alrededor del fondo.',
      en: 'It is not magic. It helps most when weights live on very different scales, and with a constant rate it tends to keep bouncing around the bottom.',
      pad: 0.4,
    },
    {
      id: 'try2',
      es: 'Tu turno: apuesta cuál llegará primero. Luego entrena con cada optimizador y ajusta su tasa hasta que llegue al fondo en ciento veinte pasos o menos.',
      en: 'Your turn: bet on which one will arrive first. Then train with each optimizer and tune its rate until it reaches the bottom in one hundred twenty steps or fewer.',
      gate: {
        id: 'race',
        prompt: {
          es: 'Haz que SGD, momento y Adam lleguen al fondo (error menor que 0.05) en 120 pasos o menos. Cada uno pide su propia tasa.',
          en: 'Get SGD, momentum, and Adam to the bottom (error below 0.05) in 120 steps or fewer. Each one wants its own rate.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'race-result',
      es: 'Mira los números. Con la tasa bien ajustada, momento y Adam suelen llegar antes que SGD, pero cada uno pide su propia tasa: no se comparan a igual valor.',
      en: 'Look at the numbers. With the rate well tuned, momentum and Adam usually arrive before SGD, but each wants its own rate: you cannot compare them at the same value.',
      tts: {
        es: 'Mira los números. Con la tasa bien ajustada, momento y Adam suelen llegar antes que ese ge de, pero cada uno pide su propia tasa: no se comparan a igual valor.',
        en: 'Look at the numbers. With the rate well tuned, momentum and Adam usually arrive before S G D, but each wants its own rate: you cannot compare them at the same value.',
      },
      pad: 0.4,
    },
    {
      id: 'schedule',
      es: 'Falta una pieza: la tasa no tiene que ser constante. Al principio conviene avanzar fuerte, y al final dar pasos pequeños para asentarse en el fondo.',
      en: 'One piece is missing: the rate does not have to be constant. At first it pays to move fast, and at the end to take small steps so the path settles at the bottom.',
      pad: 0.5,
    },
    {
      id: 'warm-problem',
      es: 'Al comenzar puede pasar lo contrario. Con los pesos recién iniciados el terreno puede ser muy empinado, y una tasa alta lanza el modelo lejos antes de que aprenda.',
      en: 'At the start the opposite can happen. With freshly initialized weights the terrain can be very steep, and a high rate throws the model far away before it has learned anything.',
      pad: 0.5,
    },
    {
      id: 'warmup',
      es: 'El calentamiento sube la tasa poco a poco durante los primeros pasos. Subir y luego bajar es la receta típica de los modelos grandes.',
      en: 'Warmup raises the rate gradually over the first steps. Up and then down is the typical recipe for large models.',
      note: { es: 'Calendario: tasa pequeña al inicio (calentamiento) y menor al final (decaimiento).', en: 'Schedule: a small rate at the start (warmup) and a smaller one at the end (decay).' },
      pad: 0.5,
    },
    {
      id: 'try3',
      es: 'Tu turno: el entrenamiento arranca con una tasa alta. Activa el calentamiento y el decaimiento hasta que no explote y termine con un error bajo.',
      en: 'Your turn: training starts with a high rate. Switch on warmup and decay until it does not blow up and ends with a low error.',
      gate: {
        id: 'sched',
        prompt: {
          es: 'Logra un entrenamiento que no diverja y termine con error menor que 0.05.',
          en: 'Get a run that does not diverge and ends with an error below 0.05.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'hyper',
      es: 'Tamaño del lote, tasa, optimizador, épocas, calendario: nadie los aprende con gradientes. Los elige una persona, y se llaman hiperparámetros.',
      en: 'Batch size, rate, optimizer, epochs, schedule: none of them is learned with gradients. A person chooses them, and they are called hyperparameters.',
      note: { es: 'Hiperparámetros: los elige una persona; los pesos, en cambio, se aprenden.', en: 'Hyperparameters: a person chooses them; the weights, in contrast, are learned.' },
      pad: 0.4,
    },
    {
      id: 'search',
      es: 'Elegirlos es oficio y cuesta caro, porque cada prueba es un entrenamiento entero. Se prueban combinaciones con corridas cortas, a menudo al azar mejor que en cuadrícula, y se registra todo.',
      en: 'Choosing them is a craft, and it is expensive, because every trial is a whole training run. Combinations are tried on short runs, often at random rather than on a grid, and everything is logged.',
      pad: 0.4,
    },
    {
      id: 'real',
      es: 'En un modelo real todo se combina. GPT-3 usó Adam, calentamiento durante trescientos setenta y cinco millones de tokens y decaimiento coseno, y del conjunto de rastreo web no llegó a ver ni una época.',
      en: 'In a real model everything is combined. GPT-3 used Adam, a warmup over three hundred seventy-five million tokens, and cosine decay, and it never completed even one epoch of its web-crawl data.',
      tts: {
        es: 'En un modelo real todo se combina. Ge pe te tres usó Adam, calentamiento durante trescientos setenta y cinco millones de tokens y decaimiento coseno, y del conjunto de rastreo web no llegó a ver ni una época.',
        en: 'In a real model everything is combined. G P T three used Adam, a warmup over three hundred seventy-five million tokens, and cosine decay, and it never completed even one epoch of its web-crawl data.',
      },
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: el lote abarata cada paso, el optimizador convierte el gradiente en un paso y el calendario ajusta la tasa. Son decisiones de quien entrena, no algo que la red aprenda.',
      en: 'In short: the batch makes each step cheaper, the optimizer turns the gradient into a step, and the schedule adjusts the rate. They are decisions made by whoever trains, not something the network learns.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Pero bajar el error de entrenamiento no basta: el modelo solo ha visto esos ejemplos. ¿Funcionará con datos que nunca vio?',
      en: 'But lowering the training error is not enough: the model has only seen those examples. Will it work on data it has never seen?',
    },
  ],

  keyIdeas: {
    es: [
      'Con muchos ejemplos no se calcula la pendiente con todos: se estima con un lote al azar. Es ruidosa, pero en promedio apunta bien. Eso es el descenso del gradiente estocástico (SGD).',
      'Una época es un recorrido completo por los datos. Con N ejemplos y lotes de B, tiene N/B pasos. El lote reparte un presupuesto de ejemplos entre muchos pasos baratos y pocos pasos limpios.',
      'El optimizador convierte el gradiente en un paso. SGD lo usa tal cual; el momento suma inercia; Adam además da a cada peso su propio tamaño de paso. Cada uno pide su propia tasa.',
      'La tasa puede cambiar durante el entrenamiento: un calentamiento al inicio evita saltos que lancen el modelo lejos, y un decaimiento al final permite asentarse en el fondo.',
      'Tamaño del lote, tasa, optimizador y calendario son hiperparámetros: los elige una persona, no se aprenden con gradientes, y probarlos cuesta entrenamientos completos.',
    ],
    en: [
      'With many examples the slope is not computed from all of them: it is estimated from a random batch. It is noisy, but on average it points the right way. That is stochastic gradient descent (SGD).',
      'An epoch is one full pass over the data. With N examples and batches of B, it has N/B steps. The batch splits a budget of examples between many cheap steps and a few clean ones.',
      'The optimizer turns the gradient into a step. SGD uses it as is; momentum adds inertia; Adam also gives each weight its own step size. Each one wants its own rate.',
      'The rate can change during training: a warmup at the start avoids jumps that throw the model far away, and a decay at the end lets it settle at the bottom.',
      'Batch size, rate, optimizer, and schedule are hyperparameters: a person chooses them, they are not learned with gradients, and trying them costs whole training runs.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Cuanto más grande el lote, mejor: el gradiente es más exacto, así que se aprende más.',
      en: 'The bigger the batch, the better: the gradient is more exact, so it learns more.',
    },
    right: {
      es: 'Más exacto no es más eficiente. Con el mismo presupuesto de ejemplos, un lote grande da menos pasos. Y los lotes muy grandes piden reajustar la tasa y calentar para no perder calidad.',
      en: 'More exact is not more efficient. With the same budget of examples, a big batch takes fewer steps. And very large batches call for rescaling the rate and warming up so quality does not suffer.',
    },
  },

  deeper: {
    es: `## El gradiente de un lote

Con $N$ ejemplos y un error por ejemplo $\\ell_i(\\mathbf{w})$, el error total es $L(\\mathbf{w})=\\tfrac1N\\sum_i \\ell_i(\\mathbf{w})$. Un lote $\\mathcal{B}$ de $B$ ejemplos elegidos al azar da el gradiente aproximado

$$\\mathbf{g}_B=\\frac1B\\sum_{i\\in\\mathcal{B}}\\nabla\\ell_i(\\mathbf{w}),\\qquad \\mathbb{E}[\\mathbf{g}_B]=\\nabla L(\\mathbf{w})$$

Es un estimador sin sesgo. Su varianza es $\\frac{N-B}{N-1}\\,\\frac{\\sigma^2}{B}$, con $\\sigma^2$ la varianza del gradiente de un ejemplo: el error cae como $1/\\sqrt{B}$, mientras que el costo del paso crece como $B$. Por eso, para reducir el ruido a la mitad hace falta un lote unas cuatro veces mayor. Una época tiene $\\lceil N/B\\rceil$ pasos y tras $t$ pasos se han visto $tB$ ejemplos. La idea de actualizar con ruido viene de Robbins y Monro (1951).

Cerca de un mínimo con curvatura $h$, el ruido del gradiente (varianza $s^2=\\sigma^2/B$) deja un suelo de error: $\\mathbb{E}[L]\\approx \\eta\\,s^2/4$ cuando $\\eta h\\ll 1$. Es proporcional a $\\eta/B$: bajar la tasa o subir el lote lo baja. Por eso el decaimiento de la tasa ayuda a asentarse.

## Momento

$$\\mathbf{v}_{t+1}=\\beta\\,\\mathbf{v}_t+\\mathbf{g}_t,\\qquad \\mathbf{w}_{t+1}=\\mathbf{w}_t-\\eta\\,\\mathbf{v}_{t+1}$$

Con $\\beta=0{,}9$ y un gradiente constante, $\\mathbf{v}\\to \\mathbf{g}/(1-\\beta)$: el paso efectivo es diez veces mayor; a igual paso efectivo, la tasa del momento sería unas diez veces menor que la de SGD (en la práctica la razón es menor: en el cañón de la lección, 0.02 frente a 0.07). En un cuadrático con curvaturas $\\lambda_{\\min}\\le h\\le\\lambda_{\\max}$ y número de condición $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$, la mejor tasa fija de SGD reduce la distancia al fondo por paso en un factor $\\frac{\\kappa-1}{\\kappa+1}$, y el momento bien ajustado en $\\frac{\\sqrt\\kappa-1}{\\sqrt\\kappa+1}$ (Polyak, 1964). En el cañón de la lección, cerca del fondo, $\\kappa\\approx 50$: unos $0{,}96$ por paso frente a $0{,}75$ (en teoría, sin ruido).

## Adam

$$\\mathbf{m}_t=\\beta_1\\mathbf{m}_{t-1}+(1-\\beta_1)\\mathbf{g}_t,\\qquad \\mathbf{s}_t=\\beta_2\\mathbf{s}_{t-1}+(1-\\beta_2)\\,\\mathbf{g}_t^{2}$$

$$\\hat{\\mathbf{m}}_t=\\frac{\\mathbf{m}_t}{1-\\beta_1^{\\,t}},\\quad \\hat{\\mathbf{s}}_t=\\frac{\\mathbf{s}_t}{1-\\beta_2^{\\,t}},\\qquad \\mathbf{w}_t=\\mathbf{w}_{t-1}-\\eta\\,\\frac{\\hat{\\mathbf{m}}_t}{\\sqrt{\\hat{\\mathbf{s}}_t}+\\varepsilon}$$

Todo es por peso (el cuadrado y la raíz actúan componente a componente). Los valores por defecto de Kingma y Ba (2015) son $\\eta=0{,}001$, $\\beta_1=0{,}9$, $\\beta_2=0{,}999$ y $\\varepsilon=10^{-8}$. Las correcciones de sesgo compensan que $\\mathbf{m}$ y $\\mathbf{s}$ empiezan en cero. En el primer paso $\\hat{\\mathbf{m}}/\\sqrt{\\hat{\\mathbf{s}}}=\\operatorname{signo}(\\mathbf{g})$, así que cada peso se mueve $\\eta$; en régimen normal el paso de cada peso es del orden de $\\eta$ como máximo. Dos consecuencias: el método es invariante al reescalar cada gradiente por separado (lo dicen sus autores), y cerca de un óptimo la señal frente al ruido baja y los pasos se encogen solos, un «recocido automático» según Kingma y Ba. Con gradientes de lotes ruidosos eso no basta: en la simulación de la lección, con $\\eta$ constante el camino sigue sacudiéndose alrededor del fondo, con una amplitud que crece con $\\eta$, y bajar $\\eta$ al final lo calma.

## Calendarios de la tasa

$$\\eta_t=\\eta_{\\max}\\min\\!\\Big(1,\\frac{t+1}{T_w}\\Big)\\quad\\text{(calentamiento lineal)}$$

$$\\eta_t=\\eta_{\\min}+\\tfrac12(\\eta_{\\max}-\\eta_{\\min})\\Big(1+\\cos\\pi\\,\\frac{t-T_w}{T-T_w}\\Big)\\quad\\text{(decaimiento coseno, de Loshchilov y Hutter, 2017)}$$

Dos recetas reales: el transformer original (Vaswani et al., 2017) usó Adam con $\\beta_2=0{,}98$ y calentó durante 4000 pasos; GPT-3 (Brown et al., 2020) usó Adam con $\\beta_2=0{,}95$, calentamiento lineal durante los primeros 375 millones de tokens y decaimiento coseno hasta el 10 % del valor máximo a lo largo de 260 mil millones de tokens. Al aumentar el lote, Goyal et al. (2017) proponen multiplicar la tasa por el mismo factor y calentar: con esa regla entrenaron ResNet-50 con lotes de 8192 imágenes en 256 GPU, en una hora, sin pérdida de exactitud.

## Hiperparámetros

Los pesos $\\mathbf{w}$ se aprenden con $\\nabla L$; los hiperparámetros ($\\eta$, $B$, $\\beta$, $T_w$, el optimizador…) fijan cómo se aprende y no tienen gradiente a su alcance. Se eligen probando: en espacios de varias dimensiones, probar combinaciones al azar suele rendir más por prueba que recorrer una cuadrícula (Bergstra y Bengio, 2012).

## En código

\`\`\`python
import math

# Ocho ejemplos fijos de y ≈ 2x + 1. Los lotes se toman en orden para que el
# resultado sea reproducible (en la práctica se baraja en cada época).
X = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]
Y = [1.2, 1.8, 3.1, 4.1, 4.9, 6.2, 6.9, 8.1]

def grad(w, b, idx):                       # gradiente del error cuadrático medio del lote
    n = len(idx)
    gw = sum(2 * (w * X[i] + b - Y[i]) * X[i] for i in idx) / n
    gb = sum(2 * (w * X[i] + b - Y[i]) for i in idx) / n
    return [gw, gb]

def entrenar(opt, eta, B, epocas, beta=0.9, b1=0.9, b2=0.999, eps=1e-8):
    p = [0.0, 0.0]                         # pesos: w y b
    v = [0.0, 0.0]; m = [0.0, 0.0]; s = [0.0, 0.0]; t = 0
    for _ in range(epocas):                # una época = recorrer todos los lotes
        for ini in range(0, len(X), B):
            g = grad(p[0], p[1], range(ini, min(ini + B, len(X))))
            t += 1
            if opt == "sgd":
                paso = [eta * gi for gi in g]
            elif opt == "momento":
                v = [beta * vi + gi for vi, gi in zip(v, g)]
                paso = [eta * vi for vi in v]
            else:                          # Adam
                m = [b1 * mi + (1 - b1) * gi for mi, gi in zip(m, g)]
                s = [b2 * si + (1 - b2) * gi * gi for si, gi in zip(s, g)]
                paso = [eta * (mi / (1 - b1 ** t)) / (math.sqrt(si / (1 - b2 ** t)) + eps)
                        for mi, si in zip(m, s)]
            p = [pi - di for pi, di in zip(p, paso)]
    return [round(pi, 3) for pi in p]

# la solución exacta de mínimos cuadrados es [1.998, 1.042]
for opt, eta in [("sgd", 0.05), ("momento", 0.005), ("adam", 0.3)]:
    print(opt, entrenar(opt, eta, B=4, epocas=50))
# sgd [1.999, 1.033]
# momento [2.008, 1.043]
# adam [1.993, 1.028]
\`\`\`

En un problema tan pequeño y bien condicionado, SGD ya basta: las diferencias aparecen en paisajes como el cañón, y cada optimizador necesitó su propia tasa.

## Lo que viene

Bajar el error de entrenamiento no basta: hay que medir con datos que el modelo no vio. De eso trata la lección 10 (generalizar y evaluar), que añade la parada temprana y el decaimiento de pesos como formas de regularizar.`,
    en: `## The gradient of a batch

With $N$ examples and a per-example error $\\ell_i(\\mathbf{w})$, the total error is $L(\\mathbf{w})=\\tfrac1N\\sum_i \\ell_i(\\mathbf{w})$. A batch $\\mathcal{B}$ of $B$ randomly chosen examples gives the approximate gradient

$$\\mathbf{g}_B=\\frac1B\\sum_{i\\in\\mathcal{B}}\\nabla\\ell_i(\\mathbf{w}),\\qquad \\mathbb{E}[\\mathbf{g}_B]=\\nabla L(\\mathbf{w})$$

It is an unbiased estimator. Its variance is $\\frac{N-B}{N-1}\\,\\frac{\\sigma^2}{B}$, where $\\sigma^2$ is the variance of one example’s gradient: the error falls as $1/\\sqrt{B}$, while the cost of the step grows as $B$. That is why cutting the noise in half takes a batch about four times larger. An epoch has $\\lceil N/B\\rceil$ steps, and after $t$ steps $tB$ examples have been seen. The idea of updating with noise goes back to Robbins and Monro (1951).

Near a minimum with curvature $h$, gradient noise (variance $s^2=\\sigma^2/B$) leaves an error floor: $\\mathbb{E}[L]\\approx \\eta\\,s^2/4$ when $\\eta h\\ll 1$. It is proportional to $\\eta/B$: lowering the rate or raising the batch lowers it. That is why decaying the rate helps the path settle.

## Momentum

$$\\mathbf{v}_{t+1}=\\beta\\,\\mathbf{v}_t+\\mathbf{g}_t,\\qquad \\mathbf{w}_{t+1}=\\mathbf{w}_t-\\eta\\,\\mathbf{v}_{t+1}$$

With $\\beta=0.9$ and a constant gradient, $\\mathbf{v}\\to \\mathbf{g}/(1-\\beta)$: the effective step is ten times larger; for the same effective step, momentum’s rate would be about ten times smaller than SGD’s (in practice the ratio is smaller: in the lesson’s canyon, 0.02 versus 0.07). For a quadratic with curvatures $\\lambda_{\\min}\\le h\\le\\lambda_{\\max}$ and condition number $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$, the best fixed rate for SGD shrinks the distance to the bottom per step by a factor $\\frac{\\kappa-1}{\\kappa+1}$, and well-tuned momentum by $\\frac{\\sqrt\\kappa-1}{\\sqrt\\kappa+1}$ (Polyak, 1964). In the lesson’s canyon, near the bottom, $\\kappa\\approx 50$: about $0.96$ per step versus $0.75$ (in theory, without noise).

## Adam

$$\\mathbf{m}_t=\\beta_1\\mathbf{m}_{t-1}+(1-\\beta_1)\\mathbf{g}_t,\\qquad \\mathbf{s}_t=\\beta_2\\mathbf{s}_{t-1}+(1-\\beta_2)\\,\\mathbf{g}_t^{2}$$

$$\\hat{\\mathbf{m}}_t=\\frac{\\mathbf{m}_t}{1-\\beta_1^{\\,t}},\\quad \\hat{\\mathbf{s}}_t=\\frac{\\mathbf{s}_t}{1-\\beta_2^{\\,t}},\\qquad \\mathbf{w}_t=\\mathbf{w}_{t-1}-\\eta\\,\\frac{\\hat{\\mathbf{m}}_t}{\\sqrt{\\hat{\\mathbf{s}}_t}+\\varepsilon}$$

Everything is per weight (the square and the root act component by component). The defaults from Kingma and Ba (2015) are $\\eta=0.001$, $\\beta_1=0.9$, $\\beta_2=0.999$, and $\\varepsilon=10^{-8}$. The bias corrections compensate for $\\mathbf{m}$ and $\\mathbf{s}$ starting at zero. On the first step $\\hat{\\mathbf{m}}/\\sqrt{\\hat{\\mathbf{s}}}=\\operatorname{sign}(\\mathbf{g})$, so every weight moves by $\\eta$; in normal operation each weight’s step is at most on the order of $\\eta$. Two consequences: the method is invariant to rescaling each gradient separately (its authors say so), and near an optimum the signal-to-noise ratio drops and the steps shrink on their own, an “automatic annealing” in Kingma and Ba’s words. With noisy batch gradients that is not enough: in the lesson’s simulation, with a constant $\\eta$ the path keeps jittering around the bottom, with an amplitude that grows with $\\eta$, and lowering $\\eta$ at the end calms it.

## Learning-rate schedules

$$\\eta_t=\\eta_{\\max}\\min\\!\\Big(1,\\frac{t+1}{T_w}\\Big)\\quad\\text{(linear warmup)}$$

$$\\eta_t=\\eta_{\\min}+\\tfrac12(\\eta_{\\max}-\\eta_{\\min})\\Big(1+\\cos\\pi\\,\\frac{t-T_w}{T-T_w}\\Big)\\quad\\text{(cosine decay, from Loshchilov and Hutter, 2017)}$$

Two real recipes: the original transformer (Vaswani et al., 2017) used Adam with $\\beta_2=0.98$ and warmed up for 4000 steps; GPT-3 (Brown et al., 2020) used Adam with $\\beta_2=0.95$, a linear warmup over the first 375 million tokens, and cosine decay down to 10 % of the peak value over 260 billion tokens. When the batch grows, Goyal et al. (2017) propose multiplying the rate by the same factor and warming up: with that rule they trained ResNet-50 with batches of 8192 images on 256 GPUs, in one hour, with no loss of accuracy.

## Hyperparameters

The weights $\\mathbf{w}$ are learned with $\\nabla L$; hyperparameters ($\\eta$, $B$, $\\beta$, $T_w$, the optimizer…) set how learning happens and have no gradient within reach. They are chosen by trying: in spaces of several dimensions, trying random combinations often pays off more per trial than sweeping a grid (Bergstra and Bengio, 2012).

## In code

\`\`\`python
import math

# Eight fixed examples of y ≈ 2x + 1. Batches are taken in order so the
# result is reproducible (in practice you shuffle every epoch).
X = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]
Y = [1.2, 1.8, 3.1, 4.1, 4.9, 6.2, 6.9, 8.1]

def grad(w, b, idx):                       # gradient of the batch mean squared error
    n = len(idx)
    gw = sum(2 * (w * X[i] + b - Y[i]) * X[i] for i in idx) / n
    gb = sum(2 * (w * X[i] + b - Y[i]) for i in idx) / n
    return [gw, gb]

def train(opt, eta, B, epochs, beta=0.9, b1=0.9, b2=0.999, eps=1e-8):
    p = [0.0, 0.0]                         # weights: w and b
    v = [0.0, 0.0]; m = [0.0, 0.0]; s = [0.0, 0.0]; t = 0
    for _ in range(epochs):                # one epoch = go through all the batches
        for start in range(0, len(X), B):
            g = grad(p[0], p[1], range(start, min(start + B, len(X))))
            t += 1
            if opt == "sgd":
                step = [eta * gi for gi in g]
            elif opt == "momentum":
                v = [beta * vi + gi for vi, gi in zip(v, g)]
                step = [eta * vi for vi in v]
            else:                          # Adam
                m = [b1 * mi + (1 - b1) * gi for mi, gi in zip(m, g)]
                s = [b2 * si + (1 - b2) * gi * gi for si, gi in zip(s, g)]
                step = [eta * (mi / (1 - b1 ** t)) / (math.sqrt(si / (1 - b2 ** t)) + eps)
                        for mi, si in zip(m, s)]
            p = [pi - di for pi, di in zip(p, step)]
    return [round(pi, 3) for pi in p]

# the exact least-squares solution is [1.998, 1.042]
for opt, eta in [("sgd", 0.05), ("momentum", 0.005), ("adam", 0.3)]:
    print(opt, train(opt, eta, B=4, epochs=50))
# sgd [1.999, 1.033]
# momentum [2.008, 1.043]
# adam [1.993, 1.028]
\`\`\`

On a problem this small and well conditioned, SGD is already enough: the differences show up on landscapes like the canyon, and each optimizer needed its own rate.

## What comes next

Lowering the training error is not enough: you have to measure with data the model has not seen. That is lesson 10 (generalizing and evaluating), which adds early stopping and weight decay as ways to regularize.`,
  },

  lens: {
    es: [
      '«Entrenamos con la configuración por defecto» no es una respuesta suficiente. Pregunta qué tasa, lote, optimizador y calendario se usaron y cuántas pruebas hicieron para llegar a ellos: cada prueba fue un entrenamiento completo.',
      'Duplicar las GPU no siempre divide por dos el tiempo: más allá de cierto tamaño, un lote mayor ya no ahorra pasos (el «lote crítico», McCandlish et al., 2018), y obliga a reajustar la tasa y a calentar.',
      'Una pérdida que se dispara al inicio apunta a una tasa demasiado alta o a falta de calentamiento; una que oscila al final, a falta de decaimiento. Son ajustes de configuración, no motivos para comprar más cómputo.',
      'Compara optimizadores con la tasa de cada uno ajustada, no a igual valor: así se engaña con facilidad. Pide también que registren la semilla y la configuración, porque dos corridas iguales dan resultados algo distintos.',
    ],
    en: [
      '“We trained with the default settings” is not a sufficient answer. Ask which rate, batch, optimizer, and schedule were used and how many trials it took to get there: each trial was a full training run.',
      'Doubling the GPUs does not always halve the time: beyond a certain size, a bigger batch no longer saves steps (the “critical batch size,” McCandlish et al., 2018), and it forces you to rescale the rate and warm up.',
      'A loss that spikes at the start points to a rate that is too high or a missing warmup; one that oscillates at the end, to a missing decay. These are configuration fixes, not reasons to buy more compute.',
      'Compare optimizers with each one’s rate tuned, not at the same value: it is easy to mislead that way. Also ask them to record the seed and the configuration, because two identical runs give somewhat different results.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: {
        es: '¿Por qué sirve entrenar con lotes en lugar de usar todos los ejemplos en cada paso?',
        en: 'Why is it useful to train with batches instead of using every example at each step?',
      },
      options: [
        { es: 'Porque el gradiente de un lote es exacto y el de todos los ejemplos no.', en: 'Because the gradient of a batch is exact and the gradient from all the examples is not.' },
        { es: 'Porque es una estimación barata y con ruido que, en promedio, apunta como el gradiente completo.', en: 'Because it is a cheap, noisy estimate that, on average, points like the full gradient.' },
        { es: 'Porque así el modelo ve menos datos y nunca se equivoca con los nuevos.', en: 'Because the model sees less data and never gets new data wrong.' },
        { es: 'Porque con lotes ya no hace falta una tasa de aprendizaje.', en: 'Because with batches a learning rate is no longer needed.' },
      ],
      answer: 1,
      why: {
        es: 'El gradiente de un lote es un estimador sin sesgo del gradiente completo: ruidoso, pero barato. Con el mismo trabajo da muchos más pasos. La tasa de aprendizaje sigue haciendo falta.',
        en: 'The gradient of a batch is an unbiased estimator of the full gradient: noisy, but cheap. For the same work it takes many more steps. The learning rate is still needed.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un conjunto tiene 10 000 ejemplos y se entrena con lotes de 250 durante 3 épocas. ¿Cuántos pasos de actualización se dan en total?',
        en: 'A dataset has 10,000 examples and is trained with batches of 250 for 3 epochs. How many update steps are taken in total?',
      },
      options: [
        { es: '40', en: '40' },
        { es: '30', en: '30' },
        { es: '120', en: '120' },
        { es: '750', en: '750' },
      ],
      answer: 2,
      why: {
        es: 'Una época son 10 000 / 250 = 40 pasos; en 3 épocas son 40 × 3 = 120 pasos. Se ven 120 × 250 = 30 000 ejemplos (cada uno tres veces).',
        en: 'One epoch is 10,000 / 250 = 40 steps; in 3 epochs that is 40 × 3 = 120 steps. That is 120 × 250 = 30,000 examples seen (each one three times).',
      },
    },
    {
      kind: 'concept',
      q: {
        es: '¿Qué hace Adam además de llevar un momento?',
        en: 'What does Adam do besides carrying a momentum term?',
      },
      options: [
        { es: 'Ajusta el tamaño de paso de cada peso según lo grande que suele ser su gradiente.', en: 'It adjusts each weight’s step size according to how large its gradient usually is.' },
        { es: 'Calcula siempre el gradiente exacto con todos los ejemplos.', en: 'It always computes the exact gradient from all the examples.' },
        { es: 'Elimina la necesidad de elegir una tasa de aprendizaje.', en: 'It removes the need to choose a learning rate.' },
        { es: 'Solo funciona con lotes de un ejemplo.', en: 'It only works with batches of one example.' },
      ],
      answer: 0,
      why: {
        es: 'Adam divide el avance de cada peso entre la raíz de un promedio móvil de su gradiente al cuadrado. Sigue necesitando una tasa de aprendizaje (con una constante, termina rebotando) y funciona con lotes de cualquier tamaño.',
        en: 'Adam divides each weight’s progress by the root of a moving average of its squared gradient. It still needs a learning rate (with a constant one it ends up bouncing) and works with batches of any size.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un equipo duplica el lote y también la tasa, como se recomienda al escalar, pero el error se dispara en los primeros pasos. ¿Qué conviene probar primero?',
        en: 'A team doubles the batch and also the rate, as is recommended when scaling up, but the error spikes in the first steps. What should they try first?',
      },
      options: [
        { es: 'Quitar el optimizador.', en: 'Remove the optimizer.' },
        { es: 'Reducir el lote a un solo ejemplo.', en: 'Shrink the batch to a single example.' },
        { es: 'Entrenar más épocas con la misma tasa.', en: 'Train more epochs with the same rate.' },
        { es: 'Calentar: empezar con una tasa pequeña y subirla durante los primeros pasos.', en: 'Warm up: start with a small rate and raise it over the first steps.' },
      ],
      answer: 3,
      why: {
        es: 'Con lotes grandes y tasa escalada, los primeros pasos son los más frágiles. El calentamiento evita que un paso demasiado grande lance el modelo lejos (Goyal et al., 2017). Más épocas no arreglan un arranque que explota.',
        en: 'With large batches and a scaled rate, the first steps are the most fragile. Warmup keeps one oversized step from throwing the model far away (Goyal et al., 2017). More epochs do not fix a start that blows up.',
      },
    },
  ],

  glossary: ['batch', 'epoch', 'sgd', 'optimizer', 'adam', 'hyperparameter', 'gradient', 'gradient-descent', 'learning-rate', 'weight', 'loss', 'backpropagation'],

  terms: [
    { id: 'batch', term: { es: 'Lote', en: 'Batch' }, def: { es: 'Conjunto pequeño de ejemplos, tomado al azar, con el que se estima el gradiente en un paso de entrenamiento.', en: 'A small set of examples, picked at random, used to estimate the gradient in one training step.' } },
    { id: 'epoch', term: { es: 'Época', en: 'Epoch' }, def: { es: 'Un recorrido completo por todos los ejemplos de entrenamiento. Con N ejemplos y lotes de B, una época son N/B pasos.', en: 'One full pass over all the training examples. With N examples and batches of B, an epoch is N/B steps.' } },
    { id: 'sgd', term: { es: 'Descenso del gradiente estocástico (SGD)', en: 'Stochastic gradient descent (SGD)' }, def: { es: 'Descenso del gradiente en el que cada paso usa el gradiente de un lote al azar, en lugar del de todos los ejemplos.', en: 'Gradient descent in which each step uses the gradient of a random batch instead of the gradient from all the examples.' } },
    { id: 'optimizer', term: { es: 'Optimizador', en: 'Optimizer' }, def: { es: 'La regla que convierte el gradiente en un cambio de los pesos. Ejemplos: SGD, SGD con momento y Adam.', en: 'The rule that turns the gradient into a change of the weights. Examples: SGD, SGD with momentum, and Adam.' } },
    { id: 'adam', term: { es: 'Adam', en: 'Adam' }, def: { es: 'Optimizador que combina el momento con un tamaño de paso propio para cada peso, calculado con promedios móviles del gradiente y de su cuadrado (Kingma y Ba, 2015).', en: 'An optimizer that combines momentum with a step size of its own for each weight, computed from moving averages of the gradient and its square (Kingma and Ba, 2015).' } },
    { id: 'hyperparameter', term: { es: 'Hiperparámetro', en: 'Hyperparameter' }, def: { es: 'Ajuste que fija una persona para el entrenamiento (tasa, tamaño del lote, épocas, optimizador, calendario). No se aprende con gradientes.', en: 'A setting a person fixes for training (rate, batch size, epochs, optimizer, schedule). It is not learned with gradients.' } },
  ],

  sources: [
    { title: 'Adam: A Method for Stochastic Optimization', authors: 'Kingma, D. P., Ba, J.', year: 2015, url: 'https://arxiv.org/abs/1412.6980' },
    { title: 'Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour', authors: 'Goyal, P., Dollár, P., Girshick, R., et al.', year: 2017, url: 'https://arxiv.org/abs/1706.02677' },
    { title: 'Language Models are Few-Shot Learners (GPT-3): Tabla 2.1, Tabla 2.2 y Apéndice B', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'A Stochastic Approximation Method', authors: 'Robbins, H., Monro, S.', year: 1951, url: 'https://doi.org/10.1214/aoms/1177729586' },
    { title: 'Some methods of speeding up the convergence of iteration methods (USSR Computational Mathematics and Mathematical Physics 4(5): 1–17)', authors: 'Polyak, B. T.', year: 1964, url: 'https://doi.org/10.1016/0041-5553(64)90137-5' },
    { title: 'SGDR: Stochastic Gradient Descent with Warm Restarts', authors: 'Loshchilov, I., Hutter, F.', year: 2017, url: 'https://arxiv.org/abs/1608.03983' },
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., et al.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'Random Search for Hyper-Parameter Optimization', authors: 'Bergstra, J., Bengio, Y.', year: 2012, url: 'https://www.jmlr.org/papers/volume13/bergstra12a/bergstra12a.pdf' },
    { title: 'An Empirical Model of Large-Batch Training', authors: 'McCandlish, S., Kaplan, J., Amodei, D., OpenAI Dota Team', year: 2018, url: 'https://arxiv.org/abs/1812.06162' },
    { title: 'Optimization Methods for Large-Scale Machine Learning', authors: 'Bottou, L., Curtis, F. E., Nocedal, J.', year: 2018, url: 'https://arxiv.org/abs/1606.04838' },
  ],
});
