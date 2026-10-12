import { defineLesson } from '../../../../../core/define';

// Lección 9 · Entrenar bien. Los lotes, las épocas y los optimizadores (SGD, momento, Adam) corren de verdad sobre un modelo de
// juguete de dos pesos y 256 ejemplos (sim.ts); lo único inventado es la forma del paisaje, y se rotula así en la escena.
// Cifras reales verificadas en fuente primaria: Kingma y Ba (2015), Goyal et al. (2017), Brown et al. (2020, GPT-3: Tabla 2.1,
// Tabla 2.2 y Apéndice B), Vaswani et al. (2017), Loshchilov y Hutter (2017). El código de «Por dentro» se ejecutó para obtener su salida.
export default defineLesson({
  id: 'entrenar-bien',

  objectives: {
    es: [
      'Explicar qué es un lote y por qué se entrena con lotes al azar en lugar de usar todos los ejemplos, y calcular cuántos pasos tiene una época.',
      'Distinguir qué hace cada optimizador (SGD, momento y Adam) y por qué cada uno necesita su propia tasa de aprendizaje.',
      'Predecir qué hacen el calentamiento y el decaimiento de la tasa, y reconocer qué ajustes son hiperparámetros.',
    ],
    en: [
      'Explain what a batch is and why we train on random batches instead of using every example, and compute how many steps an epoch has.',
      'Tell what each optimizer (SGD, momentum, and Adam) does and why each one needs its own learning rate.',
      'Predict what warmup and decay of the rate do, and recognize which settings are hyperparameters.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'En la lección ocho corregimos los pesos con un solo ejemplo. Un modelo real aprende de millones. ¿Cuántos ejemplos conviene mirar antes de dar cada paso?',
      en: 'In lesson eight we corrected the weights using a single example. A real model learns from millions. How many examples should it look at before each step?',
    },
    {
      id: 'deck',
      es: 'Para verlo usaremos un conjunto pequeño: doscientos cincuenta y seis ejemplos. Cada casilla de esta cuadrícula es uno de ellos.',
      en: 'To see it we will use a small set: two hundred fifty-six examples. Each square in this grid is one of them.',
    },
    {
      id: 'toy',
      es: 'El modelo es de juguete: solo tiene dos pesos. Como en la lección cuatro, lo dibujamos en un plano: el primer peso a lo ancho y el segundo a lo alto.',
      en: 'The model is a toy: it has only two weights. As in lesson four, we draw it on a plane: the first weight runs across and the second runs up.',
    },
    {
      id: 'map',
      es: 'Cada pareja de pesos tiene su error. Lo vemos desde arriba, como un mapa de montaña: cada línea une puntos con el mismo error, y más color es más error.',
      en: 'Each pair of weights has its own error. We see it from above, like a mountain map: each line joins points with the same error, and more color means more error.',
    },
    {
      id: 'dots',
      es: 'Cada ejemplo, por sí solo, preferiría unos pesos distintos. Marcamos esa preferencia con un punto: uno por casilla, doscientos cincuenta y seis en total.',
      en: 'Each example, on its own, would prefer different weights. We mark that preference with a dot: one per square, two hundred fifty-six in all.',
      pad: 0.3,
    },
    {
      id: 'average',
      es: 'El error total es el promedio de los errores de todos los ejemplos. Por eso el fondo del valle, el mínimo, cae justo en el centro de la nube.',
      en: 'The total error is the average of the errors of all the examples. That is why the bottom of the valley, the minimum, sits right at the center of the cloud.',
      pad: 0.3,
    },
    {
      id: 'full',
      es: 'Partimos de unos pesos cualquiera. Con los doscientos cincuenta y seis ejemplos, el descenso del gradiente de la lección cuatro da esta flecha, que apunta justo cuesta abajo.',
      en: 'We start from some arbitrary weights. Using all two hundred fifty-six examples, the gradient descent from lesson four gives this arrow, which points straight downhill.',
      pad: 0.3,
    },
    {
      id: 'full-cost',
      es: 'Damos un paso, y otro. El camino llega al fondo, pero cada paso exige revisar los doscientos cincuenta y seis ejemplos. Con millones, sería lentísimo.',
      en: 'We take a step, and another. The path reaches the bottom, but every step means going through all two hundred fifty-six examples. With millions, it would be painfully slow.',
      pad: 0.4,
    },
    {
      id: 'batch',
      es: 'La salida es tomar una muestra: unos pocos ejemplos al azar, por ejemplo ocho de los doscientos cincuenta y seis. A esa muestra se le llama lote.',
      en: 'The way out is to take a sample: a few examples picked at random, say eight of the two hundred fifty-six. That sample is called a batch.',
      note: { es: 'Lote: unos pocos ejemplos al azar con los que se calcula cada paso.', en: 'Batch: a few random examples used to compute each step.' },
      pad: 0.3,
    },
    {
      id: 'batch-arrow',
      es: 'Con esos ocho calculamos la pendiente. La flecha del lote sale parecida a la de todos, pero algo desviada: ocho ejemplos no representan del todo a los demás.',
      en: 'From those eight we compute the slope. The batch’s arrow comes out close to the one from all examples, but a little off: eight examples do not fully represent the rest.',
      pad: 0.3,
    },
    {
      id: 'noisy',
      es: 'Otro lote de ocho da otra flecha. Con muchos lotes, las flechas se reparten alrededor de la de todos y, en promedio, la aciertan.',
      en: 'Another batch of eight gives another arrow. With many batches, the arrows scatter around the one from all examples and, on average, they get it right.',
      note: { es: 'Un lote da una flecha con ruido, pero bien orientada en promedio.', en: 'A batch gives a noisy arrow, but one that points the right way on average.' },
      pad: 0.4,
    },
    {
      id: 'bigger',
      es: 'Un lote más grande desvía menos la flecha. Con lotes de dos ejemplos, el desvío medio es de un veinte por ciento; con lotes de ocho, de un diez por ciento.',
      en: 'A bigger batch bends the arrow less. With batches of two examples, the arrow is off by about twenty percent on average; with batches of eight, by about ten percent.',
      pad: 0.4,
    },
    {
      id: 'bigger-rule',
      es: 'O sea, reducir el desvío a la mitad pidió un lote cuatro veces mayor. Con lotes de treinta y dos baja a un cuatro por ciento; con ciento veintiocho, a menos de dos.',
      en: 'In other words, halving the error took a batch four times as large. With batches of thirty-two it drops to about four percent; with one hundred twenty-eight, to under two.',
      pad: 0.4,
    },
    {
      id: 'sgd',
      es: 'Bajar así, con un lote nuevo al azar en cada paso, se llama descenso del gradiente estocástico, o SGD. «Estocástico» quiere decir que interviene el azar.',
      en: 'Going downhill like this, with a new random batch at each step, is called stochastic gradient descent, or SGD. “Stochastic” means that chance is involved.',
      tts: {
        es: 'Bajar así, con un lote nuevo al azar en cada paso, se llama descenso del gradiente estocástico, o ese ge de. «Estocástico» quiere decir que interviene el azar.',
        en: 'Going downhill like this, with a new random batch at each step, is called stochastic gradient descent, or S G D. “Stochastic” means that chance is involved.',
      },
      note: { es: 'SGD: cada paso usa la pendiente de un lote al azar.', en: 'SGD: each step uses the slope of a random batch.' },
      pad: 0.3,
    },
    {
      id: 'sgd-path',
      es: 'El camino tiembla, porque cada flecha está algo desviada. Pero cada paso cuesta solo ocho ejemplos, y aun así el camino se acerca al fondo.',
      en: 'The path wobbles, because every arrow is a little off. But each step costs only eight examples, and the path still gets close to the bottom.',
      pad: 0.4,
    },
    {
      id: 'epoch',
      es: 'Los ejemplos se barajan y se usan por turnos, sin repetir: las casillas rellenas ya se usaron. Cuando se acaban, se completó una época.',
      en: 'The examples are shuffled and used in turns, with no repeats: the filled squares have already been used. When they run out, one epoch is complete.',
      note: { es: 'Época: un recorrido completo por todos los ejemplos.', en: 'Epoch: one full pass over all the examples.' },
      pad: 0.4,
    },
    {
      id: 'epoch-count',
      es: '¿Cuántos pasos tiene una época? Doscientos cincuenta y seis ejemplos entre lotes de ocho: treinta y dos pasos. Luego se baraja otra vez y empieza la segunda época.',
      en: 'How many steps are in an epoch? Two hundred fifty-six examples in batches of eight: thirty-two steps. Then everything is shuffled again and the second epoch begins.',
      pad: 0.5,
    },
    {
      id: 'cheap',
      es: 'Comparemos con el mismo trabajo: mil veinticuatro ejemplos revisados, o sea, cuatro épocas. Con lotes de doscientos cincuenta y seis, eso alcanza para solo cuatro pasos.',
      en: 'Let us compare with the same amount of work: one thousand twenty-four examples, that is, four epochs. With batches of two hundred fifty-six, that buys only four steps.',
      pad: 0.4,
    },
    {
      id: 'cheap-8',
      es: 'Con lotes de ocho, el mismo trabajo alcanza para ciento veintiocho pasos. Cada uno va peor orientado, pero juntos llegan mucho más cerca del fondo.',
      en: 'With batches of eight, the same work buys one hundred twenty-eight steps. Each one is aimed worse, but together they get much closer to the bottom.',
      pad: 0.5,
    },
    {
      id: 'batch-demo',
      es: 'Probemos tres tamaños con ese mismo trabajo de cuatro épocas: lotes de doscientos cincuenta y seis, de ocho y de uno. Mira dónde termina cada camino.',
      en: 'Let us try three sizes with that same work of four epochs: batches of two hundred fifty-six, of eight, and of one. Watch where each path ends.',
      pad: 1.2,
    },
    {
      id: 'batch-read',
      es: 'Error tras cuatro épocas: con lote de doscientos cincuenta y seis, uno punto treinta y tres; con lote de uno, que tiembla mucho, cero punto veintisiete; con lote de ocho, cero punto cero uno.',
      en: 'Error after four epochs: with a batch of two hundred fifty-six, one point three three; with a batch of one, which wobbles a lot, zero point two seven; with a batch of eight, zero point zero one.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Si quieres, mueve tú el tamaño del lote y pulsa Entrenar. Cada intento usa el mismo trabajo: cuatro épocas.',
      en: 'If you like, move the batch size yourself and press Train. Every run gets the same work: four epochs.',
      gate: {
        id: 'batch',
        prompt: { es: 'elige un tamaño de lote y pulsa Entrenar.', en: 'pick a batch size and press Train.' },
      },
      pad: 0.4,
    },
    {
      id: 'tradeoff',
      es: 'Con muchos intentos sale este patrón. Lotes enormes: pocos pasos. Lotes de uno: pasos muy ruidosos. Lo mejor queda en medio; aquí, cerca de treinta y dos.',
      en: 'With many runs, this pattern appears. Huge batches: few steps. Batches of one: very noisy steps. The best sits in the middle; here, around thirty-two.',
      note: { es: 'Lote grande: pocos pasos limpios. Lote chico: muchos pasos ruidosos. Lo mejor suele estar en medio.', en: 'Big batch: few clean steps. Small batch: many noisy steps. The best is usually in between.' },
      pad: 0.5,
    },
    {
      id: 'real-batch',
      es: 'A escala real los lotes son enormes. GPT-3 los medía en tokens, que son trozos de texto: empezó con lotes más chicos y los agrandó hasta tres millones doscientos mil tokens.',
      en: 'At real scale, batches are huge. GPT-3 measured them in tokens, which are chunks of text: it started with smaller batches and grew them to three point two million tokens.',
      tts: {
        es: 'A escala real los lotes son enormes. Ge pe te tres los medía en tokens, que son trozos de texto: empezó con lotes más chicos y los agrandó hasta tres millones doscientos mil tokens.',
        en: 'At real scale, batches are huge. G P T three measured them in tokens, which are chunks of text: it started with smaller batches and grew them to three point two million tokens.',
      },
      pad: 0.5,
    },
    {
      id: 'canyon',
      es: 'Ahora cambiemos la forma del valle. Este es un cañón: muy empinado de pared a pared, y casi plano a lo largo del fondo.',
      en: 'Now let us change the shape of the valley. This one is a canyon: very steep from wall to wall, and almost flat along the bottom.',
      pad: 0.4,
    },
    {
      id: 'canyon-why',
      es: 'Las paredes son unas cincuenta veces más empinadas que el fondo. Eso complica el tamaño del paso: cada dirección pide uno distinto.',
      en: 'The walls are about fifty times steeper than the bottom. That makes the step size tricky: each direction wants a different one.',
      pad: 0.4,
    },
    {
      id: 'optimizer',
      es: 'La regla que convierte la pendiente en un paso se llama optimizador. La más simple es la de la lección cuatro: el paso es la tasa por la pendiente. Eso es SGD.',
      en: 'The rule that turns the slope into a step is called the optimizer. The simplest is the one from lesson four: the step is the rate times the slope. That is SGD.',
      tts: {
        es: 'La regla que convierte la pendiente en un paso se llama optimizador. La más simple es la de la lección cuatro: el paso es la tasa por la pendiente. Eso es ese ge de.',
        en: 'The rule that turns the slope into a step is called the optimizer. The simplest is the one from lesson four: the step is the rate times the slope. That is S G D.',
      },
      note: { es: 'Optimizador: la regla que convierte la pendiente en un paso.', en: 'Optimizer: the rule that turns the slope into a step.' },
      pad: 0.3,
    },
    {
      id: 'sgd-big',
      es: 'Con una tasa grande, cero punto cero ocho, SGD rebota de pared a pared. Con una apenas mayor, cero punto once, diverge: sale disparado del valle.',
      en: 'With a large rate, zero point zero eight, SGD bounces from wall to wall. With a slightly larger one, zero point one one, it diverges: it shoots out of the valley.',
      tts: {
        es: 'Con una tasa grande, cero punto cero ocho, ese ge de rebota de pared a pared. Con una apenas mayor, cero punto once, diverge: sale disparado del valle.',
        en: 'With a large rate, zero point zero eight, S G D bounces from wall to wall. With a slightly larger one, zero point one one, it diverges: it shoots out of the valley.',
      },
      pad: 0.6,
    },
    {
      id: 'sgd-small',
      es: 'Con una tasa pequeña, cero punto cero dos, ya no rebota, pero avanza muy despacio por el fondo, donde casi no hay pendiente.',
      en: 'With a small rate, zero point zero two, it no longer bounces, but it crawls along the bottom, where there is hardly any slope.',
      pad: 0.5,
    },
    {
      id: 'momentum',
      es: 'El momento le da inercia al paso, como a una pelota que rueda: cada paso conserva nueve décimas de la velocidad que traía.',
      en: 'Momentum gives the step inertia, like a rolling ball: each step keeps nine tenths of the velocity it already had.',
      note: { es: 'Momento: el paso conserva parte de su velocidad, como una pelota que rueda.', en: 'Momentum: the step keeps part of its velocity, like a rolling ball.' },
      pad: 0.4,
    },
    {
      id: 'momentum-why',
      es: 'Así, los empujones de una pared y de la otra se cancelan, y el avance a lo largo del fondo se acumula. Mira cómo el momento se adelanta a SGD.',
      en: 'That way, the pushes from one wall and the other cancel out, and the progress along the bottom adds up. Watch momentum pull ahead of SGD.',
      tts: {
        es: 'Así, los empujones de una pared y de la otra se cancelan, y el avance a lo largo del fondo se acumula. Mira cómo el momento se adelanta a ese ge de.',
        en: 'That way, the pushes from one wall and the other cancel out, and the progress along the bottom adds up. Watch momentum pull ahead of S G D.',
      },
      pad: 0.5,
    },
    {
      id: 'momentum-cost',
      es: 'El precio: como una pelota, se pasa de largo y va y viene un rato alrededor del fondo.',
      en: 'The price: like a ball, it overshoots and swings back and forth around the bottom for a while.',
      pad: 0.6,
    },
    {
      id: 'adam-idea',
      es: 'Adam da un paso más: cada peso recibe su propio tamaño de paso. Si su pendiente suele ser grande, da pasos cortos; si suele ser pequeña, pasos más largos.',
      en: 'Adam goes one step further: each weight gets its own step size. If its slope is usually large, it takes short steps; if it is usually small, longer ones.',
      pad: 0.5,
    },
    {
      id: 'adam-how',
      es: 'Para eso guarda, por cada peso, dos promedios: el de su pendiente, que hace de momento, y el de su tamaño. El paso divide el primero entre el segundo.',
      en: 'To do that it keeps two averages for each weight: one of its slope, which acts as momentum, and one of its size. The step divides the first by the second.',
      note: { es: 'Adam: momento más un tamaño de paso propio para cada peso.', en: 'Adam: momentum plus a step size of its own for each weight.' },
      pad: 0.4,
    },
    {
      id: 'adam-honest',
      es: 'No es magia: con una tasa fija, Adam también sigue temblando cerca del fondo. Y, como los otros dos, necesita que alguien elija su tasa.',
      en: 'It is not magic: with a fixed rate, Adam also keeps jittering near the bottom. And, like the other two, it needs someone to choose its rate.',
      pad: 0.5,
    },
    {
      id: 'race-demo',
      es: 'Comparemos a los tres, cada uno con su tasa ya ajustada. Salen del mismo punto, y contamos cuántos pasos tarda cada uno en llegar al fondo.',
      en: 'Let us compare the three, each with its rate already tuned. They start from the same point, and we count how many steps each one takes to reach the bottom.',
      pad: 1.2,
    },
    {
      id: 'race-read',
      es: 'SGD tardó setenta y un pasos; el momento, treinta; Adam, veinte. Y cada uno usó una tasa distinta: no se comparan con la misma.',
      en: 'SGD took seventy-one steps; momentum, thirty; Adam, twenty. And each one used a different rate: you cannot compare them at the same one.',
      tts: {
        es: 'Ese ge de tardó setenta y un pasos; el momento, treinta; Adam, veinte. Y cada uno usó una tasa distinta: no se comparan con la misma.',
        en: 'S G D took seventy-one steps; momentum, thirty; Adam, twenty. And each one used a different rate: you cannot compare them at the same one.',
      },
      pad: 0.4,
    },
    {
      id: 'try2',
      es: 'Si quieres, elige tú un optimizador, mueve su tasa y pulsa Entrenar. Verás si llega antes, si rebota o si sale disparado.',
      en: 'If you like, pick an optimizer yourself, move its rate, and press Train. You will see whether it arrives sooner, bounces, or shoots off.',
      gate: {
        id: 'race',
        prompt: { es: 'elige un optimizador y una tasa, y pulsa Entrenar.', en: 'pick an optimizer and a rate, and press Train.' },
      },
      pad: 0.4,
    },
    {
      id: 'decay',
      es: 'Falta una pieza: la tasa no tiene por qué ser fija. Si al final la bajamos poco a poco, el temblor se calma y el camino se asienta. Eso es el decaimiento.',
      en: 'One piece is missing: the rate does not have to stay fixed. If we lower it gradually toward the end, the jitter calms down and the path settles. That is decay.',
      pad: 0.6,
    },
    {
      id: 'warm-problem',
      es: 'Al principio puede pasar lo contrario. Si los pesos arrancan en una zona muy empinada, una tasa alta da un salto enorme y el modelo sale disparado.',
      en: 'At the start, the opposite can happen. If the weights begin in a very steep area, a high rate makes a huge jump and the model shoots off.',
      pad: 0.5,
    },
    {
      id: 'warmup',
      es: 'El calentamiento empieza con una tasa pequeña y la sube poco a poco durante los primeros pasos. Así el primer salto no lo lanza lejos.',
      en: 'Warmup starts with a small rate and raises it gradually over the first steps. That way the first jump does not throw the model far away.',
      note: { es: 'Calendario: la tasa sube al inicio (calentamiento) y baja al final (decaimiento).', en: 'Schedule: the rate rises at the start (warmup) and falls at the end (decay).' },
      pad: 0.5,
    },
    {
      id: 'sched-demo',
      es: 'Mira la misma tasa alta dos veces. Sin calendario, explota en el segundo paso. Con calentamiento y decaimiento, baja con calma y se asienta en el fondo.',
      en: 'Watch the same high rate twice. With no schedule, it blows up on the second step. With warmup and decay, it comes down calmly and settles at the bottom.',
      pad: 1.2,
    },
    {
      id: 'try3',
      es: 'Si quieres, elige tú el calendario y pulsa Entrenar. Prueba solo el calentamiento: ya no explota, pero ¿se asienta?',
      en: 'If you like, choose the schedule yourself and press Train. Try warmup alone: it no longer blows up, but does it settle?',
      gate: {
        id: 'sched',
        prompt: { es: 'elige un calendario y pulsa Entrenar.', en: 'choose a schedule and press Train.' },
      },
      pad: 0.4,
    },
    {
      id: 'hyper',
      es: 'Tamaño del lote, tasa, optimizador, número de épocas y calendario: ninguno se aprende con gradientes. Los elige una persona, y se llaman hiperparámetros.',
      en: 'Batch size, rate, optimizer, number of epochs, and schedule: none of them is learned with gradients. A person chooses them, and they are called hyperparameters.',
      note: { es: 'Hiperparámetros: los elige una persona; los pesos, en cambio, se aprenden.', en: 'Hyperparameters: a person chooses them; the weights, in contrast, are learned.' },
      pad: 0.5,
    },
    {
      id: 'search',
      es: 'Elegirlos cuesta caro, porque cada prueba es un entrenamiento completo. Aquí, probar seis tasas para Adam costó seis entrenamientos.',
      en: 'Choosing them is expensive, because every trial is a full training run. Here, trying six rates for Adam cost six training runs.',
      pad: 0.6,
    },
    {
      id: 'real',
      es: 'GPT-3 combinó todo: usó Adam, un calentamiento en sus primeros trescientos setenta y cinco millones de tokens y luego un decaimiento coseno, que baja la tasa en curva suave.',
      en: 'GPT-3 combined it all: it used Adam, a warmup over its first three hundred seventy-five million tokens, and then cosine decay, which lowers the rate along a smooth curve.',
      tts: {
        es: 'Ge pe te tres combinó todo: usó Adam, un calentamiento en sus primeros trescientos setenta y cinco millones de tokens y luego un decaimiento coseno, que baja la tasa en curva suave.',
        en: 'G P T three combined it all: it used Adam, a warmup over its first three hundred seventy-five million tokens, and then cosine decay, which lowers the rate along a smooth curve.',
      },
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: el lote abarata cada paso, el optimizador convierte la pendiente en un paso y el calendario ajusta la tasa con el tiempo. Todo eso lo decide quien entrena.',
      en: 'In short: the batch makes each step cheaper, the optimizer turns the slope into a step, and the schedule adjusts the rate over time. All of that is decided by whoever trains.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Pero bajar el error de entrenamiento no basta: el modelo solo ha visto esos ejemplos. ¿Funcionará con datos que nunca vio?',
      en: 'But lowering the training error is not enough: the model has only seen those examples. Will it work on data it has never seen?',
    },
  ],

  keyIdeas: {
    es: [
      'Con muchos ejemplos no se calcula la pendiente con todos: se estima con un lote al azar (en la lección, 8 de 256). Su flecha sale algo desviada, pero en promedio apunta bien. Eso es el descenso del gradiente estocástico (SGD).',
      'Una época es un recorrido completo por los datos: con N ejemplos y lotes de B, tiene N/B pasos (256 / 8 = 32). Con el mismo trabajo, un lote chico da muchos pasos baratos y ruidosos, y uno grande, pocos pasos exactos; lo mejor suele quedar en medio.',
      'El optimizador convierte la pendiente en un paso. SGD la usa tal cual; el momento suma inercia; Adam además da a cada peso su propio tamaño de paso. Cada uno pide su propia tasa.',
      'La tasa puede cambiar durante el entrenamiento: un calentamiento al inicio evita el salto que lanza el modelo lejos, y un decaimiento al final calma el temblor para que se asiente en el fondo.',
      'Tamaño del lote, tasa, optimizador y calendario son hiperparámetros: los elige una persona, no se aprenden con gradientes, y probarlos cuesta entrenamientos completos.',
    ],
    en: [
      'With many examples the slope is not computed from all of them: it is estimated from a random batch (in the lesson, 8 of 256). Its arrow is a little off, but on average it points the right way. That is stochastic gradient descent (SGD).',
      'An epoch is one full pass over the data: with N examples and batches of B, it has N/B steps (256 / 8 = 32). For the same work, a small batch gives many cheap, noisy steps and a large one gives a few exact steps; the best is usually in between.',
      'The optimizer turns the slope into a step. SGD uses it as is; momentum adds inertia; Adam also gives each weight its own step size. Each one wants its own rate.',
      'The rate can change during training: a warmup at the start avoids the jump that throws the model far away, and a decay at the end calms the jitter so it settles at the bottom.',
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

Es un estimador sin sesgo. Su varianza es $\\frac{N-B}{N-1}\\,\\frac{\\sigma^2}{B}$, con $\\sigma^2$ la varianza del gradiente de un ejemplo: el error cae como $1/\\sqrt{B}$, mientras que el costo del paso crece como $B$. Por eso, para reducir el ruido a la mitad hace falta un lote unas cuatro veces mayor. En la lección, el desvío medio de la flecha (medido con 24 lotes de cada tamaño) fue de 20 %, 10 %, 4 % y 1.7 % con lotes de 2, 8, 32 y 128: cae algo más rápido que $1/\\sqrt{B}$ porque el factor $\\frac{N-B}{N-1}$ pesa cuando el lote es una parte grande de los 256 ejemplos. Una época tiene $\\lceil N/B\\rceil$ pasos y tras $t$ pasos se han visto $tB$ ejemplos. La idea de actualizar con ruido viene de Robbins y Monro (1951).

Cerca de un mínimo con curvatura $h$, el ruido del gradiente (varianza $s^2=\\sigma^2/B$) deja un suelo de error: $\\mathbb{E}[L]\\approx \\eta\\,s^2/4$ cuando $\\eta h\\ll 1$. Es proporcional a $\\eta/B$: bajar la tasa o subir el lote lo baja. Por eso el decaimiento de la tasa ayuda a asentarse.

## Momento

$$\\mathbf{v}_{t+1}=\\beta\\,\\mathbf{v}_t+\\mathbf{g}_t,\\qquad \\mathbf{w}_{t+1}=\\mathbf{w}_t-\\eta\\,\\mathbf{v}_{t+1}$$

Con $\\beta=0.9$ y un gradiente constante, $\\mathbf{v}\\to \\mathbf{g}/(1-\\beta)$: el paso efectivo es diez veces mayor; a igual paso efectivo, la tasa del momento sería unas diez veces menor que la de SGD (en la práctica la razón es menor: en el cañón de la lección, 0.02 frente a 0.07). En un cuadrático con curvaturas $\\lambda_{\\min}\\le h\\le\\lambda_{\\max}$ y número de condición $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$, la mejor tasa fija de SGD reduce la distancia al fondo por paso en un factor $\\frac{\\kappa-1}{\\kappa+1}$, y el momento bien ajustado en $\\frac{\\sqrt\\kappa-1}{\\sqrt\\kappa+1}$ (Polyak, 1964). En el cañón de la lección, cerca del fondo, $\\kappa\\approx 50$: unos $0.96$ por paso frente a $0.75$ (en teoría, sin ruido).

## Adam

$$\\mathbf{m}_t=\\beta_1\\mathbf{m}_{t-1}+(1-\\beta_1)\\mathbf{g}_t,\\qquad \\mathbf{s}_t=\\beta_2\\mathbf{s}_{t-1}+(1-\\beta_2)\\,\\mathbf{g}_t^{2}$$

$$\\hat{\\mathbf{m}}_t=\\frac{\\mathbf{m}_t}{1-\\beta_1^{\\,t}},\\quad \\hat{\\mathbf{s}}_t=\\frac{\\mathbf{s}_t}{1-\\beta_2^{\\,t}},\\qquad \\mathbf{w}_t=\\mathbf{w}_{t-1}-\\eta\\,\\frac{\\hat{\\mathbf{m}}_t}{\\sqrt{\\hat{\\mathbf{s}}_t}+\\varepsilon}$$

Todo es por peso (el cuadrado y la raíz actúan componente a componente). Los valores por defecto de Kingma y Ba (2015) son $\\eta=0.001$, $\\beta_1=0.9$, $\\beta_2=0.999$ y $\\varepsilon=10^{-8}$. Las correcciones de sesgo compensan que $\\mathbf{m}$ y $\\mathbf{s}$ empiezan en cero. En el primer paso $\\hat{\\mathbf{m}}/\\sqrt{\\hat{\\mathbf{s}}}=\\operatorname{signo}(\\mathbf{g})$, así que cada peso se mueve $\\eta$; en régimen normal el paso de cada peso es del orden de $\\eta$ como máximo. Dos consecuencias: el método es invariante al reescalar cada gradiente por separado (lo dicen sus autores), y cerca de un óptimo la señal frente al ruido baja y los pasos se encogen solos, un «recocido automático» según Kingma y Ba. Con gradientes de lotes ruidosos eso no basta: en la simulación de la lección, con $\\eta$ constante el camino sigue sacudiéndose alrededor del fondo, con una amplitud que crece con $\\eta$, y bajar $\\eta$ al final lo calma.

## Calendarios de la tasa

$$\\eta_t=\\eta_{\\max}\\min\\!\\Big(1,\\frac{t+1}{T_w}\\Big)\\quad\\text{(calentamiento lineal)}$$

$$\\eta_t=\\eta_{\\min}+\\tfrac12(\\eta_{\\max}-\\eta_{\\min})\\Big(1+\\cos\\pi\\,\\frac{t-T_w}{T-T_w}\\Big)\\quad\\text{(decaimiento coseno, de Loshchilov y Hutter, 2017)}$$

Dos recetas reales: el transformer original (Vaswani et al., 2017) usó Adam con $\\beta_2=0.98$ y calentó durante 4000 pasos; GPT-3 (Brown et al., 2020) usó Adam con $\\beta_2=0.95$, calentamiento lineal durante los primeros 375 millones de tokens y decaimiento coseno hasta el 10 % del valor máximo a lo largo de 260 mil millones de tokens. Además, su lote creció de 32 mil tokens hasta el valor final (3.2 millones en el modelo de 175 mil millones de parámetros) durante los primeros 4 a 12 mil millones de tokens, según el tamaño del modelo, y de su texto del rastreo web vio solo 0.44 épocas (tabla 2.2). Al aumentar el lote, Goyal et al. (2017) proponen multiplicar la tasa por el mismo factor y calentar: con esa regla entrenaron ResNet-50 con lotes de 8192 imágenes en 256 GPU, en una hora, sin pérdida de exactitud.

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

It is an unbiased estimator. Its variance is $\\frac{N-B}{N-1}\\,\\frac{\\sigma^2}{B}$, where $\\sigma^2$ is the variance of one example’s gradient: the error falls as $1/\\sqrt{B}$, while the cost of the step grows as $B$. That is why cutting the noise in half takes a batch about four times larger. In the lesson, the arrow’s average error (measured over 24 batches of each size) was 20 %, 10 %, 4 %, and 1.7 % for batches of 2, 8, 32, and 128: it falls a bit faster than $1/\\sqrt{B}$ because the factor $\\frac{N-B}{N-1}$ matters when the batch is a large share of the 256 examples. An epoch has $\\lceil N/B\\rceil$ steps, and after $t$ steps $tB$ examples have been seen. The idea of updating with noise goes back to Robbins and Monro (1951).

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

Two real recipes: the original transformer (Vaswani et al., 2017) used Adam with $\\beta_2=0.98$ and warmed up for 4000 steps; GPT-3 (Brown et al., 2020) used Adam with $\\beta_2=0.95$, a linear warmup over the first 375 million tokens, and cosine decay down to 10 % of the peak value over 260 billion tokens. Its batch also grew from 32 thousand tokens to the final value (3.2 million for the 175-billion-parameter model) over the first 4 to 12 billion tokens, depending on model size, and it saw only 0.44 epochs of its web-crawl text (Table 2.2). When the batch grows, Goyal et al. (2017) propose multiplying the rate by the same factor and warming up: with that rule they trained ResNet-50 with batches of 8192 images on 256 GPUs, in one hour, with no loss of accuracy.

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
        { es: 'Porque la pendiente de un lote es exacta y la de todos los ejemplos no.', en: 'Because a batch’s slope is exact and the slope from all the examples is not.' },
        { es: 'Porque es una estimación barata y con ruido que, en promedio, apunta como la flecha calculada con todos los ejemplos.', en: 'Because it is a cheap, noisy estimate that, on average, points like the arrow computed from all the examples.' },
        { es: 'Porque así el modelo ve menos datos y nunca se equivoca con los nuevos.', en: 'Because the model sees less data and never gets new data wrong.' },
        { es: 'Porque con lotes ya no hace falta una tasa de aprendizaje.', en: 'Because with batches a learning rate is no longer needed.' },
      ],
      answer: 1,
      why: {
        es: 'La pendiente de un lote es una estimación sin sesgo de la de todos los ejemplos: ruidosa, pero barata. Con el mismo trabajo da muchos más pasos (en la lección, 128 pasos con lotes de 8 frente a 4 con lotes de 256). La tasa de aprendizaje sigue haciendo falta.',
        en: 'A batch’s slope is an unbiased estimate of the slope from all the examples: noisy, but cheap. For the same work it takes many more steps (in the lesson, 128 steps with batches of 8 versus 4 with batches of 256). The learning rate is still needed.',
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
        { es: 'Ajusta el tamaño de paso de cada peso según lo grande que suele ser su pendiente.', en: 'It adjusts each weight’s step size according to how large its slope usually is.' },
        { es: 'Calcula siempre el gradiente exacto con todos los ejemplos.', en: 'It always computes the exact gradient from all the examples.' },
        { es: 'Elimina la necesidad de elegir una tasa de aprendizaje.', en: 'It removes the need to choose a learning rate.' },
        { es: 'Solo funciona con lotes de un ejemplo.', en: 'It only works with batches of one example.' },
      ],
      answer: 0,
      why: {
        es: 'Adam divide el avance de cada peso entre el tamaño habitual de su pendiente (la raíz de un promedio móvil de su cuadrado). Sigue necesitando una tasa de aprendizaje (con una fija, sigue temblando cerca del fondo) y funciona con lotes de cualquier tamaño.',
        en: 'Adam divides each weight’s progress by the usual size of its slope (the root of a moving average of its square). It still needs a learning rate (with a fixed one it keeps jittering near the bottom) and works with batches of any size.',
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
