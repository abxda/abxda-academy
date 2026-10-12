import { defineLesson } from '../../../../../core/define';

// Lección 25 · GPUs, memoria y cuantización. La memoria de la GPU (VRAM) con un ejemplo antes de la sigla; los bytes de un
// parámetro real, formato por formato; la cuenta de un modelo de setenta mil millones, paso a paso; la calculadora (con su
// demostración antes del «tu turno»); los dieciséis bytes de entrenar con Adam, pieza por pieza; el ancho de banda; los tres
// paralelismos, uno por uno; y la cuantización de pesos reales de Pythia-1.4B, con la pérdida medida del modelo entero.

export default defineLesson({
  id: 'hardware-y-memoria',

  objectives: {
    es: [
      'Calcular cuánta memoria ocupa un modelo a partir de sus parámetros y de los bytes por parámetro (FP32, FP16, INT8, INT4), y decidir en qué GPU cabe.',
      'Explicar por qué entrenar con Adam pide unos dieciséis bytes por parámetro y por qué, al escribir, el límite suele ser el ancho de banda de la memoria.',
      'Reconocer las tres formas básicas de repartir un modelo entre varias GPU y qué gana y qué arriesga la cuantización, con mediciones reales.',
    ],
    en: [
      'Calculate how much memory a model takes from its parameters and the bytes per parameter (FP32, FP16, INT8, INT4), and decide which GPU it fits in.',
      'Explain why training with Adam takes about sixteen bytes per parameter and why, when writing, the limit is usually memory bandwidth.',
      'Recognize the three basic ways to split a model across several GPUs, and what quantization gains and risks, with real measurements.',
    ],
  },

  segments: [
    // ── la memoria de la GPU ──
    {
      id: 'hook',
      es: 'En la lección anterior contamos operaciones. Hoy, una pregunta más básica: un modelo de setenta mil millones de parámetros, ¿dónde se guarda mientras trabaja?',
      en: 'In the last lesson we counted operations. Today, a more basic question: a model with seventy billion parameters, where is it kept while it works?',
    },
    {
      id: 'gpu',
      es: 'En la GPU. Recuerda la lección trece: un chip con miles de núcleos sencillos que multiplican a la vez. Este es el esquema de una H100, una GPU de NVIDIA para centros de datos.',
      en: 'In the GPU. Remember lesson thirteen: a chip with thousands of simple cores that multiply at the same time. This is a sketch of an H100, an NVIDIA GPU for data centers.',
      tts: {
        es: 'En la GPU. Recuerda la lección trece: un chip con miles de núcleos sencillos que multiplican a la vez. Este es el esquema de una ache cien, una GPU de Envidia para centros de datos.',
        en: 'In the GPU. Remember lesson thirteen: a chip with thousands of simple cores that multiply at the same time. This is a sketch of an H one hundred, an Nvidia GPU for data centers.',
      },
      pad: 0.3,
    },
    {
      id: 'vram-what',
      es: 'Junto al chip, en la misma tarjeta, va su propia memoria. Ahí esperan los números con los que trabajan los núcleos: los parámetros del modelo y los datos.',
      en: 'Next to the chip, on the same board, sits its own memory. That is where the numbers the cores work on wait: the model’s parameters and the data.',
      pad: 0.3,
    },
    {
      id: 'vram-name',
      es: 'A esa memoria se le llama VRAM, memoria de video. Es como la mesa de un taller: lo que está sobre la mesa se usa al instante; lo demás hay que ir a traerlo de lejos.',
      en: 'That memory is called VRAM, video memory. It is like a workshop bench: what is on the bench can be used instantly; anything else has to be fetched from far away.',
      note: { es: 'VRAM: la memoria propia de la GPU, junto a sus núcleos.', en: 'VRAM: the GPU’s own memory, right next to its cores.' },
    },
    {
      id: 'vram-size',
      es: 'Su tamaño se mide en gigabytes, como el de un teléfono. Una H100 trae ochenta. Una tarjeta para videojuegos, como la RTX 3060, trae doce. Aquí están a la misma escala.',
      en: 'Its size is measured in gigabytes, like a phone’s. An H100 has eighty. A gaming card, like the RTX 3060, has twelve. Here they are at the same scale.',
      tts: {
        es: 'Su tamaño se mide en gigabytes, como el de un teléfono. Una ache cien trae ochenta. Una tarjeta para videojuegos, como la erre te equis treinta sesenta, trae doce. Aquí están a la misma escala.',
        en: 'Its size is measured in gigabytes, like a phone’s. An H one hundred has eighty. A gaming card, like the R T X thirty sixty, has twelve. Here they are at the same scale.',
      },
      pad: 0.4,
    },

    // ── bytes por parámetro ──
    {
      id: 'bytes-what',
      es: '¿Y qué es un byte? Son ocho bits, ocho casillas que valen cero o uno. Combinándolas salen doscientos cincuenta y seis valores distintos. Un gigabyte son mil millones de bytes.',
      en: 'And what is a byte? It is eight bits, eight boxes that are each zero or one. Combined, they give two hundred fifty-six different values. A gigabyte is a billion bytes.',
      pad: 0.3,
    },
    {
      id: 'fp32',
      es: '¿Cuántos bytes ocupa un parámetro? Depende de cuántas cifras guardes. Este es uno real de Pythia, el modelo de la lección veintitrés. En FP32 ocupa cuatro bytes y guarda unas siete cifras.',
      en: 'How many bytes does a parameter take? It depends on how many digits you keep. This is a real one from Pythia, the model in lesson twenty-three. In FP32 it takes four bytes and keeps about seven digits.',
      tts: {
        es: '¿Cuántos bytes ocupa un parámetro? Depende de cuántas cifras guardes. Este es uno real de Pitia, el modelo de la lección veintitrés. En efe pe treinta y dos ocupa cuatro bytes y guarda unas siete cifras.',
        en: 'How many bytes does a parameter take? It depends on how many digits you keep. This is a real one from Pythia, the model in lesson twenty-three. In F P thirty-two it takes four bytes and keeps about seven digits.',
      },
    },
    {
      id: 'fp16',
      es: 'En FP16 ocupa la mitad, dos bytes, y guarda unas tres cifras. A una red casi siempre le basta: muchos modelos grandes se guardan así, con dos bytes por número.',
      en: 'In FP16 it takes half that, two bytes, and keeps about three digits. For a network that is almost always enough: many large models are stored this way, two bytes per number.',
      tts: {
        es: 'En efe pe dieciséis ocupa la mitad, dos bytes, y guarda unas tres cifras. A una red casi siempre le basta: muchos modelos grandes se guardan así, con dos bytes por número.',
        en: 'In F P sixteen it takes half that, two bytes, and keeps about three digits. For a network that is almost always enough: many large models are stored this way, two bytes per number.',
      },
    },
    {
      id: 'int8',
      es: 'En INT8 ocupa un solo byte. Ya no guarda cifras: el número se redondea a la marca más cercana de una regla con doscientas cincuenta y seis marcas, una por cada valor del byte.',
      en: 'In INT8 it takes a single byte. It no longer keeps digits: the number is rounded to the nearest mark on a ruler with two hundred fifty-six marks, one for each value of the byte.',
      tts: {
        es: 'En int ocho ocupa un solo byte. Ya no guarda cifras: el número se redondea a la marca más cercana de una regla con doscientas cincuenta y seis marcas, una por cada valor del byte.',
        en: 'In int eight it takes a single byte. It no longer keeps digits: the number is rounded to the nearest mark on a ruler with two hundred fifty-six marks, one for each value of the byte.',
      },
      pad: 0.3,
    },
    {
      id: 'int4',
      es: 'En INT4, medio byte: cuatro bits, apenas dieciséis marcas. El redondeo es más tosco: el parámetro queda en cero punto cero dos seis en lugar de cero punto cero dos cuatro.',
      en: 'In INT4, half a byte: four bits, just sixteen marks. The rounding is coarser: the parameter becomes zero point zero two six instead of zero point zero two four.',
      tts: {
        es: 'En int cuatro, medio byte: cuatro bits, apenas dieciséis marcas. El redondeo es más tosco: el parámetro queda en cero punto cero dos seis en lugar de cero punto cero dos cuatro.',
        en: 'In int four, half a byte: four bits, just sixteen marks. The rounding is coarser: the parameter becomes zero point zero two six instead of zero point zero two four.',
      },
      pad: 0.3,
    },
    {
      id: 'bytes-sum',
      es: 'En resumen: cuatro bytes, dos, uno y medio por parámetro. Menos bytes, menos memoria, pero cada número se guarda con menos detalle.',
      en: 'In short: four bytes, two, one, and a half per parameter. Fewer bytes means less memory, but each number is stored with less detail.',
      note: { es: 'Bytes por parámetro: FP32 = 4, FP16 = 2, INT8 = 1, INT4 = ½.', en: 'Bytes per parameter: FP32 = 4, FP16 = 2, INT8 = 1, INT4 = ½.' },
    },

    // ── la cuenta, despacio ──
    {
      id: 'count-n',
      es: 'Ahora, la cuenta. Tomemos un modelo de setenta mil millones de parámetros, como Llama 3.1 de setenta mil millones, de Meta.',
      en: 'Now, the math. Take a model with seventy billion parameters, like Meta’s Llama 3.1 with seventy billion.',
      tts: {
        es: 'Ahora, la cuenta. Tomemos un modelo de setenta mil millones de parámetros, como Llama tres punto uno de setenta mil millones, de Meta.',
        en: 'Now, the math. Take a model with seventy billion parameters, like Meta’s Llama three point one with seventy billion.',
      },
    },
    {
      id: 'count-b',
      es: 'En FP16, cada parámetro ocupa dos bytes. Setenta mil millones por dos: ciento cuarenta mil millones de bytes.',
      en: 'In FP16, each parameter takes two bytes. Seventy billion times two: one hundred forty billion bytes.',
      tts: {
        es: 'En efe pe dieciséis, cada parámetro ocupa dos bytes. Setenta mil millones por dos: ciento cuarenta mil millones de bytes.',
        en: 'In F P sixteen, each parameter takes two bytes. Seventy billion times two: one hundred forty billion bytes.',
      },
      pad: 0.3,
    },
    {
      id: 'count-gb',
      es: 'Recuerda: un gigabyte son mil millones de bytes. Así que ciento cuarenta mil millones de bytes son ciento cuarenta gigabytes.',
      en: 'Remember: a gigabyte is a billion bytes. So one hundred forty billion bytes is one hundred forty gigabytes.',
      pad: 0.3,
    },
    {
      id: 'count-fit',
      es: 'Una H100 tiene ochenta. No cabe: hacen falta al menos dos, y eso solo para guardar los parámetros, sin el espacio extra que pide el cálculo.',
      en: 'An H100 has eighty. It does not fit: you need at least two, and that is just to store the parameters, without the extra room the computation needs.',
      tts: {
        es: 'Una ache cien tiene ochenta. No cabe: hacen falta al menos dos, y eso solo para guardar los parámetros, sin el espacio extra que pide el cálculo.',
        en: 'An H one hundred has eighty. It does not fit: you need at least two, and that is just to store the parameters, without the extra room the computation needs.',
      },
      note: { es: 'Memoria = parámetros × bytes por parámetro: 70 mil millones en FP16 = 140 GB.', en: 'Memory = parameters × bytes per parameter: 70 billion in FP16 = 140 GB.' },
      pad: 0.3,
    },
    {
      id: 'count-prec',
      es: 'Con otros formatos: en FP32, doscientos ochenta gigabytes; en INT8, setenta, que ya cabe en una H100, aunque justo; y en INT4, treinta y cinco.',
      en: 'In other formats: in FP32, two hundred eighty gigabytes; in INT8, seventy, which now fits in an H100, if barely; and in INT4, thirty-five.',
      tts: {
        es: 'Con otros formatos: en efe pe treinta y dos, doscientos ochenta gigabytes; en int ocho, setenta, que ya cabe en una ache cien, aunque justo; y en int cuatro, treinta y cinco.',
        en: 'In other formats: in F P thirty-two, two hundred eighty gigabytes; in int eight, seventy, which now fits in an H one hundred, if barely; and in int four, thirty-five.',
      },
      pad: 0.4,
    },

    // ── la calculadora ──
    {
      id: 'calc-demo',
      es: 'Esta calculadora hace la misma cuenta. Mira el modelo de setenta mil millones en cada formato, frente a tres opciones: la RTX 3060, una H100 y un servidor con ocho H100.',
      en: 'This calculator does the same math. Watch the seventy-billion model in each format, against three options: the RTX 3060, an H100, and a server with eight H100s.',
      tts: {
        es: 'Esta calculadora hace la misma cuenta. Mira el modelo de setenta mil millones en cada formato, frente a tres opciones: la erre te equis treinta sesenta, una ache cien y un servidor con ocho ache cien.',
        en: 'This calculator does the same math. Watch the seventy-billion model in each format, against three options: the R T X thirty sixty, an H one hundred, and a server with eight H one hundreds.',
      },
      pad: 0.6,
    },
    {
      id: 'calc-demo2',
      es: 'Ahora uno más chico, de ocho mil millones. En FP16 ocupa dieciséis gigabytes y no cabe en la RTX; en INT8 ocupa ocho, y ya cabe.',
      en: 'Now a smaller one, with eight billion. In FP16 it takes sixteen gigabytes and does not fit in the RTX; in INT8 it takes eight, and now it fits.',
      tts: {
        es: 'Ahora uno más chico, de ocho mil millones. En efe pe dieciséis ocupa dieciséis gigabytes y no cabe en la erre te equis; en int ocho ocupa ocho, y ya cabe.',
        en: 'Now a smaller one, with eight billion. In F P sixteen it takes sixteen gigabytes and does not fit in the R T X; in int eight it takes eight, and now it fits.',
      },
      pad: 0.5,
    },
    {
      id: 'calc-try',
      es: 'Si quieres, elige tú otro tamaño o formato y mira dónde cabe. El más grande, de cuatrocientos cinco mil millones, en FP16 no cabe ni en ocho H100.',
      en: 'If you like, pick another size or format yourself and see where it fits. The largest, with four hundred five billion, does not fit in FP16 even on eight H100s.',
      tts: {
        es: 'Si quieres, elige tú otro tamaño o formato y mira dónde cabe. El más grande, de cuatrocientos cinco mil millones, en efe pe dieciséis no cabe ni en ocho ache cien.',
        en: 'If you like, pick another size or format yourself and see where it fits. The largest, with four hundred five billion, does not fit in F P sixteen even on eight H one hundreds.',
      },
      gate: { id: 'calc', prompt: { es: 'elige otro tamaño de modelo o de formato.', en: 'pick another model size or format.' } },
      pad: 0.4,
    },

    // ── entrenar: dieciséis bytes por parámetro ──
    {
      id: 'train-q',
      es: 'Hasta aquí, solo usar el modelo. Entrenarlo pide mucha más memoria: por cada parámetro hay que guardar otras cosas. Veámoslas una por una.',
      en: 'So far, just using the model. Training it takes much more memory: for every parameter, other things must be stored too. Let’s look at them one by one.',
    },
    {
      id: 'train-grad',
      es: 'Primero, el parámetro mismo, en FP16: dos bytes. Luego, su gradiente, la pendiente del error que calcula la retropropagación: otros dos bytes.',
      en: 'First, the parameter itself, in FP16: two bytes. Then its gradient, the slope of the error that backpropagation computes: two more bytes.',
      tts: {
        es: 'Primero, el parámetro mismo, en efe pe dieciséis: dos bytes. Luego, su gradiente, la pendiente del error que calcula la retropropagación: otros dos bytes.',
        en: 'First, the parameter itself, in F P sixteen: two bytes. Then its gradient, the slope of the error that backpropagation computes: two more bytes.',
      },
      pad: 0.3,
    },
    {
      id: 'train-adam',
      es: 'Después, Adam, el optimizador de la lección nueve, guarda por cada parámetro dos promedios: el de su pendiente y el de su tamaño. Cuatro bytes cada uno, en FP32.',
      en: 'Next, Adam, the optimizer from lesson nine, keeps two averages for each parameter: one of its slope and one of its size. Four bytes each, in FP32.',
      tts: {
        es: 'Después, Adam, el optimizador de la lección nueve, guarda por cada parámetro dos promedios: el de su pendiente y el de su tamaño. Cuatro bytes cada uno, en efe pe treinta y dos.',
        en: 'Next, Adam, the optimizer from lesson nine, keeps two averages for each parameter: one of its slope and one of its size. Four bytes each, in F P thirty-two.',
      },
      pad: 0.3,
    },
    {
      id: 'train-master',
      es: 'Y una copia del parámetro en FP32, otros cuatro bytes: los ajustes de cada paso son tan pequeños que, en FP16, se perderían al redondear.',
      en: 'And a copy of the parameter in FP32, four more bytes: each step’s adjustments are so small that, in FP16, they would be lost to rounding.',
      tts: {
        es: 'Y una copia del parámetro en efe pe treinta y dos, otros cuatro bytes: los ajustes de cada paso son tan pequeños que, en efe pe dieciséis, se perderían al redondear.',
        en: 'And a copy of the parameter in F P thirty-two, four more bytes: each step’s adjustments are so small that, in F P sixteen, they would be lost to rounding.',
      },
      pad: 0.3,
    },
    {
      id: 'train-16',
      es: 'Dos, más dos, más cuatro, más cuatro, más cuatro: dieciséis bytes por parámetro, ocho veces lo que pide usarlo. Lo medimos en una RTX 3060 con un modelo pequeño: dieciséis punto cero cinco.',
      en: 'Two, plus two, plus four, plus four, plus four: sixteen bytes per parameter, eight times what using it takes. We measured it on an RTX 3060 with a small model: sixteen point zero five.',
      tts: {
        es: 'Dos, más dos, más cuatro, más cuatro, más cuatro: dieciséis bytes por parámetro, ocho veces lo que pide usarlo. Lo medimos en una erre te equis treinta sesenta con un modelo pequeño: dieciséis punto cero cinco.',
        en: 'Two, plus two, plus four, plus four, plus four: sixteen bytes per parameter, eight times what using it takes. We measured it on an R T X thirty sixty with a small model: sixteen point zero five.',
      },
      note: { es: 'Entrenar con Adam: unos 16 bytes por parámetro, ocho veces más que usarlo.', en: 'Training with Adam: about 16 bytes per parameter, eight times more than using it.' },
      pad: 0.3,
    },
    {
      id: 'train-70',
      es: 'Con setenta mil millones: por dieciséis, mil ciento veinte gigabytes. Catorce H100 llenas, y eso sin contar las activaciones que guarda la retropropagación.',
      en: 'With seventy billion: times sixteen, eleven hundred twenty gigabytes. Fourteen full H100s, and that is without the activations that backpropagation stores.',
      tts: {
        es: 'Con setenta mil millones: por dieciséis, mil ciento veinte gigabytes. Catorce ache cien llenas, y eso sin contar las activaciones que guarda la retropropagación.',
        en: 'With seventy billion: times sixteen, eleven hundred twenty gigabytes. Fourteen full H one hundreds, and that is without the activations that backpropagation stores.',
      },
      pad: 0.4,
    },

    // ── ancho de banda ──
    {
      id: 'bw-what',
      es: 'Caber no basta. Los números tienen que viajar de la memoria a los núcleos, y eso toma tiempo. Cuántos bytes viajan por segundo se llama ancho de banda.',
      en: 'Fitting is not enough. The numbers have to travel from memory to the cores, and that takes time. How many bytes travel per second is called bandwidth.',
      pad: 0.3,
    },
    {
      id: 'bw-numbers',
      es: 'En la H100 viajan tres mil trescientos cincuenta gigabytes por segundo. En una RTX 3060 medimos unos trescientos treinta: diez veces menos.',
      en: 'In the H100, three thousand three hundred fifty gigabytes travel per second. On an RTX 3060 we measured about three hundred thirty: ten times less.',
      tts: {
        es: 'En la ache cien viajan tres mil trescientos cincuenta gigabytes por segundo. En una erre te equis treinta sesenta medimos unos trescientos treinta: diez veces menos.',
        en: 'In the H one hundred, three thousand three hundred fifty gigabytes travel per second. On an R T X thirty sixty we measured about three hundred thirty: ten times less.',
      },
      pad: 0.3,
    },
    {
      id: 'bw-token',
      es: '¿Por qué importa? Al escribir, el modelo produce un token tras otro, y por cada token lee todos sus parámetros. Un modelo de ocho mil millones en INT8: ocho gigabytes por token.',
      en: 'Why does it matter? When writing, the model produces one token after another, and for each token it reads all its parameters. An eight-billion model in INT8: eight gigabytes per token.',
      tts: {
        es: '¿Por qué importa? Al escribir, el modelo produce un token tras otro, y por cada token lee todos sus parámetros. Un modelo de ocho mil millones en int ocho: ocho gigabytes por token.',
        en: 'Why does it matter? When writing, the model produces one token after another, and for each token it reads all its parameters. An eight-billion model in int eight: eight gigabytes per token.',
      },
      pad: 0.3,
    },
    {
      id: 'bw-rate',
      es: 'En la RTX, trescientos treinta entre ocho: unos cuarenta tokens por segundo, como máximo. Por rápido que calculen sus núcleos, no van más deprisa de lo que llegan los números.',
      en: 'On the RTX, three hundred thirty divided by eight: about forty tokens per second, at most. However fast its cores compute, they cannot go faster than the numbers arrive.',
      tts: {
        es: 'En la erre te equis, trescientos treinta entre ocho: unos cuarenta tokens por segundo, como máximo. Por rápido que calculen sus núcleos, no van más deprisa de lo que llegan los números.',
        en: 'On the R T X, three hundred thirty divided by eight: about forty tokens per second, at most. However fast its cores compute, they cannot go faster than the numbers arrive.',
      },
      pad: 0.3,
    },
    {
      id: 'bw-wall',
      es: 'En la H100 pasa igual: mientras llega un parámetro, sus núcleos podrían hacer casi seiscientas operaciones, y con él solo hacen dos, multiplicar y sumar. El resto del tiempo, esperan.',
      en: 'The same happens on the H100: while one parameter arrives, its cores could do nearly six hundred operations, and with it they do only two, multiply and add. The rest of the time, they wait.',
      tts: {
        es: 'En la ache cien pasa igual: mientras llega un parámetro, sus núcleos podrían hacer casi seiscientas operaciones, y con él solo hacen dos, multiplicar y sumar. El resto del tiempo, esperan.',
        en: 'The same happens on the H one hundred: while one parameter arrives, its cores could do nearly six hundred operations, and with it they do only two, multiply and add. The rest of the time, they wait.',
      },
      note: { es: 'Al escribir, el límite suele ser el ancho de banda: traer los números, no calcular.', en: 'When writing, the limit is usually bandwidth: fetching the numbers, not computing.' },
      pad: 0.5,
    },

    // ── paralelismo ──
    {
      id: 'par-q',
      es: '¿Y si el modelo no cabe en una GPU, o en una sola tardaría siglos? Se reparte el trabajo entre muchas. Es el paralelismo, y tiene tres formas básicas.',
      en: 'And if the model does not fit in one GPU, or would take centuries on just one? The work is split across many. That is parallelism, and it has three basic forms.',
      pad: 0.3,
    },
    {
      id: 'par-data',
      es: 'Primera, el paralelismo de datos: cada GPU tiene una copia completa del modelo y estudia ejemplos distintos, como cocinas con el mismo recetario y pedidos diferentes.',
      en: 'First, data parallelism: each GPU has a full copy of the model and studies different examples, like kitchens with the same recipe book and different orders.',
      pad: 0.3,
    },
    {
      id: 'par-data2',
      es: 'Al final de cada paso juntan sus gradientes y los promedian, para que todas las copias se ajusten igual. Acelera, pero no ahorra memoria: cada copia carga el modelo entero.',
      en: 'At the end of each step they pool their gradients and average them, so every copy is adjusted the same way. It speeds things up, but saves no memory: each copy holds the whole model.',
      pad: 0.3,
    },
    {
      id: 'par-pipe',
      es: 'Segunda, el paralelismo en tubería: cada GPU guarda solo algunas capas, como en una línea de montaje. La primera hace sus capas y pasa el resultado a la siguiente.',
      en: 'Second, pipeline parallelism: each GPU holds only some of the layers, like an assembly line. The first one runs its layers and passes the result to the next.',
      pad: 0.4,
    },
    {
      id: 'par-pipe2',
      es: 'Así cada GPU carga solo un tramo del modelo. El precio: mientras el trabajo recorre la línea, algunas GPU esperan su turno sin hacer nada.',
      en: 'That way each GPU holds only one stretch of the model. The price: while the work moves down the line, some GPUs wait their turn doing nothing.',
      pad: 0.4,
    },
    {
      id: 'par-tensor',
      es: 'Tercera, el paralelismo de tensor: cada tabla de parámetros se parte en pedazos, y cada GPU hace su parte de la misma multiplicación, como repartir las columnas de una cuenta enorme.',
      en: 'Third, tensor parallelism: each table of parameters is cut into pieces, and each GPU does its part of the same multiplication, like splitting the columns of one huge sum.',
      pad: 0.4,
    },
    {
      id: 'par-tensor2',
      es: 'Pero las piezas deben juntarse en cada capa, muchísimas veces por segundo. Por eso suele hacerse dentro de un mismo servidor, entre sus ocho GPU, unidas por conexiones muy rápidas.',
      en: 'But the pieces must be combined at every layer, many times per second. That is why it is usually done within one server, among its eight GPUs, joined by very fast links.',
      pad: 0.3,
    },
    {
      id: 'par-llama',
      es: 'Para entrenar Llama 3.1 de cuatrocientos cinco mil millones, Meta combinó las tres: ocho GPU de tensor, dieciséis tramos de tubería y ciento veintiocho copias de datos.',
      en: 'To train Llama 3.1 with four hundred five billion, Meta combined all three: eight GPUs of tensor, sixteen pipeline stages, and one hundred twenty-eight data copies.',
      tts: {
        es: 'Para entrenar Llama tres punto uno de cuatrocientos cinco mil millones, Meta combinó las tres: ocho GPU de tensor, dieciséis tramos de tubería y ciento veintiocho copias de datos.',
        en: 'To train Llama three point one with four hundred five billion, Meta combined all three: eight GPUs of tensor, sixteen pipeline stages, and one hundred twenty-eight data copies.',
      },
      pad: 0.3,
    },
    {
      id: 'par-total',
      es: 'Ocho por dieciséis por ciento veintiocho: dieciséis mil trescientas ochenta y cuatro H100 trabajando juntas, cada una con su parte en sus ochenta gigabytes.',
      en: 'Eight times sixteen times one hundred twenty-eight: sixteen thousand three hundred eighty-four H100s working together, each with its share in its eighty gigabytes.',
      tts: {
        es: 'Ocho por dieciséis por ciento veintiocho: dieciséis mil trescientas ochenta y cuatro ache cien trabajando juntas, cada una con su parte en sus ochenta gigabytes.',
        en: 'Eight times sixteen times one hundred twenty-eight: sixteen thousand three hundred eighty-four H one hundreds working together, each with its share in its eighty gigabytes.',
      },
      note: { es: 'Paralelismo: datos (copias), tubería (capas en fila), tensor (tablas en pedazos). Llama 3.1: 8 × 16 × 128 H100.', en: 'Parallelism: data (copies), pipeline (layers in a row), tensor (tables in pieces). Llama 3.1: 8 × 16 × 128 H100s.' },
      pad: 0.5,
    },

    // ── cuantización ──
    {
      id: 'quant-q',
      es: 'La otra salida es achicar cada número: guardar los parámetros con menos bits, en INT8 o INT4, una vez entrenado el modelo. Eso es cuantizar.',
      en: 'The other way out is to shrink each number: store the parameters with fewer bits, in INT8 or INT4, once the model is trained. That is quantizing.',
      tts: {
        es: 'La otra salida es achicar cada número: guardar los parámetros con menos bits, en int ocho o int cuatro, una vez entrenado el modelo. Eso es cuantizar.',
        en: 'The other way out is to shrink each number: store the parameters with fewer bits, in int eight or int four, once the model is trained. That is quantizing.',
      },
      note: { es: 'Cuantizar: guardar los parámetros ya entrenados con menos bits.', en: 'Quantizing: storing the trained parameters with fewer bits.' },
      pad: 0.3,
    },
    {
      id: 'quant-img',
      es: 'Piensa en una imagen en grises: con doscientos cincuenta y seis tonos se ve perfecta; con dieciséis, casi igual; con cuatro, aún se reconoce; con dos, apenas.',
      en: 'Think of a grayscale picture: with two hundred fifty-six shades it looks perfect; with sixteen, almost the same; with four, still recognizable; with two, barely.',
      pad: 0.5,
    },
    {
      id: 'quant-ruler',
      es: 'Con los parámetros pasa lo mismo. Cada uno se redondea a la marca más cercana de su regla. Con menos bits, la regla tiene menos marcas y el redondeo es más tosco.',
      en: 'Parameters work the same way. Each one is rounded to the nearest mark on its ruler. With fewer bits, the ruler has fewer marks and the rounding is coarser.',
      pad: 0.6,
    },
    {
      id: 'quant-real',
      es: 'Hagámoslo de verdad con mil veinticuatro parámetros de Pythia. A la izquierda, los originales; a la derecha, cuantizados. Cada cuadrito es un parámetro.',
      en: 'Let’s do it for real with one thousand twenty-four parameters from Pythia. On the left, the originals; on the right, quantized. Each little square is one parameter.',
      tts: {
        es: 'Hagámoslo de verdad con mil veinticuatro parámetros de Pitia. A la izquierda, los originales; a la derecha, cuantizados. Cada cuadrito es un parámetro.',
      },
      pad: 0.3,
    },
    {
      id: 'quant-demo',
      es: 'Mira qué pasa al bajar los bits: con ocho, idénticos; con cuatro, casi iguales; con dos, la imagen se deshace y muchos parámetros quedan en cero.',
      en: 'Watch what happens as the bits go down: with eight, identical; with four, almost the same; with two, the image falls apart and many parameters become zero.',
      pad: 0.6,
    },
    {
      id: 'quant-loss',
      es: 'Lo que importa es el modelo entero. Medimos su pérdida al predecir texto: dos punto cinco ocho en FP16; dos punto seis seis con cuatro bits; con dos bits, once. Se rompe.',
      en: 'What matters is the whole model. We measured its loss predicting text: two point five eight in FP16; two point six six with four bits; with two bits, eleven. It breaks.',
      tts: {
        es: 'Lo que importa es el modelo entero. Medimos su pérdida al predecir texto: dos punto cinco ocho en efe pe dieciséis; dos punto seis seis con cuatro bits; con dos bits, once. Se rompe.',
        en: 'What matters is the whole model. We measured its loss predicting text: two point five eight in F P sixteen; two point six six with four bits; with two bits, eleven. It breaks.',
      },
      note: { es: 'Pythia cuantizado: con 8 o 4 bits la pérdida casi no cambia; con 2 bits, se rompe.', en: 'Pythia quantized: with 8 or 4 bits the loss barely changes; with 2 bits, it breaks.' },
      pad: 0.5,
    },
    {
      id: 'quant-try',
      es: 'Si quieres, mueve tú los bits y mira cómo cambian los parámetros y la pérdida medida.',
      en: 'If you like, move the bits yourself and watch how the parameters and the measured loss change.',
      gate: { id: 'quant', prompt: { es: 'mueve los bits por parámetro.', en: 'move the bits per parameter.' } },
      pad: 0.4,
    },
    {
      id: 'quant-pay',
      es: 'Por eso se cuantiza: con cuatro bits, el modelo de setenta mil millones baja de ciento cuarenta a treinta y cinco gigabytes. Cabe en una H100 y, con menos bytes que leer, escribe más rápido.',
      en: 'That is why models are quantized: with four bits, the seventy-billion model drops from one hundred forty to thirty-five gigabytes. It fits in one H100 and, with fewer bytes to read, writes faster.',
      tts: {
        es: 'Por eso se cuantiza: con cuatro bits, el modelo de setenta mil millones baja de ciento cuarenta a treinta y cinco gigabytes. Cabe en una ache cien y, con menos bytes que leer, escribe más rápido.',
        en: 'That is why models are quantized: with four bits, the seventy-billion model drops from one hundred forty to thirty-five gigabytes. It fits in one H one hundred and, with fewer bytes to read, writes faster.',
      },
      pad: 0.4,
    },
    {
      id: 'quant-caution',
      es: 'Pero no es gratis, y cada modelo lo resiste distinto. Meta notó que las pruebas estándar no detectaban fallos de su versión cuantizada. Antes de usar una, pruébala con tus propias tareas.',
      en: 'But it is not free, and every model tolerates it differently. Meta found that standard benchmarks missed failures in its quantized version. Before using one, test it on your own tasks.',
      pad: 0.3,
    },

    // ── cierre ──
    {
      id: 'recap',
      es: 'En resumen: la memoria es parámetros por bytes; entrenar pide unos dieciséis bytes por parámetro; el ancho de banda marca el paso; y si no cabe, se reparte o se cuantiza.',
      en: 'In short: memory is parameters times bytes; training takes about sixteen bytes per parameter; bandwidth sets the pace; and if it does not fit, you split it or quantize it.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Ya sabemos dónde vive un modelo entrenado y cuánto ocupa. Pero ¿qué pasa cuando alguien le pregunta algo? Es la siguiente lección: la inferencia.',
      en: 'Now we know where a trained model lives and how much room it takes. But what happens when someone asks it something? That is the next lesson: inference.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo trabaja desde la memoria de la GPU, la VRAM. Ocupa parámetros × bytes por parámetro: 70 mil millones en FP16 son 140 GB, más que los 80 de una H100.',
      'Cada formato guarda el número con más o menos detalle: FP32 (4 bytes, unas 7 cifras), FP16 (2 bytes, unas 3), INT8 (1 byte) e INT4 (½ byte), que redondean a marcas de una regla.',
      'Entrenar con Adam pide unos 16 bytes por parámetro: el parámetro y su gradiente en FP16, una copia en FP32 y los dos promedios de Adam. Ocho veces lo que pide usarlo, sin contar las activaciones.',
      'Caber no basta: al escribir, por cada token se leen todos los parámetros, y el ancho de banda de la memoria suele marcar la velocidad, no el cálculo.',
      'Si no cabe, se reparte (datos, tubería, tensor; Llama 3.1 405B usó 8 × 16 × 128 = 16 384 H100) o se cuantiza. En Pythia, 8 y 4 bits casi no cambian la pérdida; 2 bits la rompen.',
    ],
    en: [
      'A model works out of the GPU’s memory, its VRAM. It takes parameters × bytes per parameter: 70 billion in FP16 is 140 GB, more than an H100’s 80.',
      'Each format stores a number with more or less detail: FP32 (4 bytes, about 7 digits), FP16 (2 bytes, about 3), INT8 (1 byte), and INT4 (½ byte), which round to the marks of a ruler.',
      'Training with Adam takes about 16 bytes per parameter: the parameter and its gradient in FP16, a copy in FP32, and Adam’s two averages. Eight times what using it takes, not counting activations.',
      'Fitting is not enough: when writing, every token reads all the parameters, and memory bandwidth usually sets the speed, not computation.',
      'If it does not fit, you split it (data, pipeline, tensor; Llama 3.1 405B used 8 × 16 × 128 = 16,384 H100s) or quantize it. In Pythia, 8 and 4 bits barely change the loss; 2 bits break it.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Si un modelo cabe en la memoria de mi GPU, también lo puedo entrenar ahí.',
      en: 'If a model fits in my GPU’s memory, I can also train it there.',
    },
    right: {
      es: 'Usarlo pide unos 2 bytes por parámetro en FP16; entrenarlo con Adam, unos 16, más las activaciones. Un modelo que apenas cabe para usarse necesita unas ocho veces más memoria para entrenarse. Por eso se reparte entre muchas GPU, o se ajusta solo una pequeña parte de sus parámetros (lección 27).',
      en: 'Using it takes about 2 bytes per parameter in FP16; training it with Adam, about 16, plus activations. A model that barely fits for use needs about eight times more memory to train. That is why training is split across many GPUs, or only a small part of the parameters is tuned (lesson 27).',
    },
  },

  deeper: {
    es: `## Bytes por parámetro y formatos

La memoria que ocupan los pesos es una multiplicación:

$$M_{\\text{pesos}} = N \\cdot b,$$

con $N$ parámetros y $b$ bytes por parámetro. Para Llama 3.1 70B en FP16: $70\\times10^{9}\\cdot 2 = 1.4\\times10^{11}$ bytes $=140$ GB.

Los formatos con decimales (norma IEEE 754) guardan un signo, un exponente (el alcance) y una mantisa (las cifras):

| formato | bytes | signo · exponente · mantisa | cifras decimales | mayor valor |
|---|---|---|---|---|
| FP32 | 4 | 1 · 8 · 23 | $\\log_{10}2^{24}\\approx 7.2$ | $\\approx 3.4\\times10^{38}$ |
| FP16 | 2 | 1 · 5 · 10 | $\\log_{10}2^{11}\\approx 3.3$ | 65 504 |
| BF16 | 2 | 1 · 8 · 7 | $\\log_{10}2^{8}\\approx 2.4$ | el de FP32 |

BF16 (Kalamkar et al., 2019) sacrifica cifras para conservar el alcance de FP32; Llama 3 se entrenó en BF16. INT8 e INT4 no tienen exponente: guardan un entero y una **escala** compartida (ver abajo).

Un detalle de unidades: las fichas dicen «80 GB» de VRAM, pero son $80\\cdot 2^{30}$ bytes (GiB), un 7 % más que $80\\times10^{9}$. En la lección, 1 GB = $10^{9}$ bytes, como en los anchos de banda; la diferencia no cambia ninguna conclusión.

## Entrenar: dieciséis bytes por parámetro

Con Adam en precisión mixta (Micikevicius et al., 2018), por cada parámetro se guardan el peso y el gradiente en FP16 y, en FP32, una copia del peso y los dos promedios de Adam (Kingma y Ba, 2015). ZeRO (Rajbhandari et al., 2020, §3.1) lo resume así:

$$M_{\\text{entrenar}} \\approx (2 + 2 + \\underbrace{4 + 4 + 4}_{K\\,=\\,12})\\,N = 16N \\text{ bytes}.$$

La copia en FP32 existe porque el ajuste de cada paso (gradiente por tasa de aprendizaje) suele ser miles de veces menor que el peso: sumado en FP16, que tiene 10 bits de mantisa, se perdería al redondear. Lo medimos en una RTX 3060 (\`measure-memory.py\`, arquitectura de Pythia-160M con pesos al azar): **16.19** bytes por parámetro con FP32 completo y **16.05** con precisión mixta, tras el primer paso de AdamW.

Aparte quedan las **activaciones**, los resultados intermedios que la retropropagación necesita. Por capa de un transformer en 16 bits, con atención de memoria lineal, son unos $34\\,s\\,b\\,h$ bytes ($s$ = tokens por secuencia, $b$ = secuencias por lote, $h$ = dimensión; Korthikanti et al., 2022). En la misma RTX 3060 medimos 0.949 veces esa fórmula. Se reducen recalculándolas en el regreso, a cambio de más cómputo.

ZeRO y su versión en PyTorch, FSDP (la que usó Meta), reparten esos 16 bytes entre las copias de datos, para que cada GPU guarde solo una parte de los estados.

## Ancho de banda: el techo al escribir

Al generar un token a la vez, cada paso lee todos los pesos:

$$\\text{tokens por segundo} \\le \\frac{\\text{ancho de banda}}{N\\cdot b}.$$

Una H100 SXM mueve 3 350 GB/s; un modelo de 8 mil millones en FP16 (16 GB) queda por debajo de unos 209 tokens por segundo, por rápido que calcule. Su pico de cálculo en FP16 sin dispersión es de unos 989 billones de operaciones por segundo (la ficha da 1 979 «con dispersión»): $989\\times10^{12}/3.35\\times10^{12}\\approx 295$ operaciones por byte, unas 590 por cada parámetro de 2 bytes, que en un producto matriz–vector se usa en solo 2 (multiplicar y sumar).

Medido en una RTX 3060 (\`measure-memory.py\`): copiar 1 GiB, 333 GB/s; multiplicar una matriz de $16384\\times16384$ en FP16 por **un** vector, 1.57 ms, 341 GB/s y apenas 0.34 billones de operaciones por segundo; por **4 096** vectores a la vez, 27.7 billones: 81 veces más con el mismo chip, porque cada peso leído se reutiliza. Agrupar peticiones en lotes es la salida que veremos en la lección 26.

## Paralelismo

El número de GPU es el producto de los tres repartos: $G = T\\cdot P\\cdot D$ (tensor, tubería, datos).

- **Datos**: cada copia ve otro trozo del lote; al final del paso se promedian los gradientes (una suma entre todas, *all-reduce*).
- **Tubería** (GPipe, Huang et al., 2019): $K$ tramos de capas; el lote se parte en $M$ micro-lotes para que los tramos trabajen a la vez. La fracción de tiempo ociosa (la «burbuja») es del orden de $\\frac{K-1}{M+K-1}$; GPipe la encontró despreciable con $M \\ge 4K$.
- **Tensor** (Megatron-LM, Shoeybi et al., 2019): en la red de cada bloque, la primera tabla se parte por columnas y la segunda por filas, de modo que basta una suma entre GPU por bloque en cada sentido. Como ocurre en cada capa, se mantiene dentro del servidor, donde las GPU se unen por NVLink (900 GB/s en la H100).

Llama 3.1 405B (Llama Team, 2024, tabla 4): 8 de tensor × 16 de tubería × 128 de datos = 16 384 H100, con un 41 % de aprovechamiento del cálculo; en la etapa de contexto largo añadió un cuarto reparto, por contexto (8 × 16 de contexto × 16 × 8). Y para *usarlo*: en BF16 no cabe en un servidor de 8 H100 (§6.1), por eso Meta lo sirve repartido en dos servidores o cuantizado a FP8.

## Cuantización por grupos

La regla de la lección (redondeo simétrico al más cercano, sin calibración), para un grupo $g$ de 32 pesos y $b$ bits:

$$q_{\\max} = 2^{b-1}-1,\\qquad s_g = \\frac{\\max_{i\\in g}|w_i|}{q_{\\max}},\\qquad q_i = \\operatorname{clip}\\!\\Big(\\operatorname{round}\\frac{w_i}{s_g},\\,-q_{\\max},\\,q_{\\max}\\Big),\\qquad \\hat w_i = q_i\\, s_g.$$

Con 8 bits hay 255 marcas (de −127 a 127); con 4, 15. Cada grupo guarda además su escala en FP16: $16/32 = 0.5$ bits más por peso, así que «INT4» son en realidad 4.5 bits (el modelo de 70 mil millones ocupa unos 39 GB, no 35).

Medido en Pythia-1.4B (\`build-data.py\`: las 96 matrices de sus 24 capas, 1 208 millones de pesos; pérdida en nats por token sobre 287 744 tokens de WikiText-2):

| bits | FP16 | 8 | 6 | 5 | 4 | 3 | 2 |
|---|---|---|---|---|---|---|---|
| una escala por grupo de 32 | 2.5805 | 2.5806 | 2.5858 | 2.5975 | 2.6565 | 3.1589 | 11.045 |
| una escala por matriz | 2.5805 | 2.6002 | 3.2172 | 5.3017 | 10.692 | 10.445 | 21.347 |

Con **una sola escala por matriz**, el modelo se rompe ya a 4 bits: unos pocos pesos atípicos, hasta 13 veces la desviación típica en la matriz mediana, estiran la regla, y en esa matriz dos de cada tres pesos caen en la marca cero a 4 bits. Por eso se usan grupos pequeños. Los métodos de producción van más lejos: LLM.int8() (Dettmers et al., 2022) separa las dimensiones con valores atípicos y las deja en 16 bits; GPTQ (Frantar et al., 2023) corrige el redondeo con información de segundo orden y lleva modelos de 175 mil millones a 3 o 4 bits con una pérdida de precisión despreciable. Advertencia: Pythia vio Wikipedia al entrenar, así que el nivel absoluto de la pérdida es optimista; lo que se compara es la diferencia, medida con el mismo texto.

## En código

\`\`\`python
import numpy as np

def gb(params, bytes_per_param):
    return params * bytes_per_param / 1e9

for fmt, b in [("FP32", 4), ("FP16", 2), ("INT8", 1), ("INT4", 0.5)]:
    print(f"70 mil M en {fmt}: {gb(70e9, b):5.0f} GB")
print(f"entrenar con Adam (16 B): {gb(70e9, 16):.0f} GB")
print(f"techo al escribir, 8 mil M en FP16 en una H100: {3350 / gb(8e9, 2):.0f} tokens/s")

# cuantizar un grupo de 32 pesos: una regla con 2^(b-1) - 1 marcas por lado
rng = np.random.default_rng(0)
w = rng.normal(0, 0.02, 32)
for bits in (8, 4, 2):
    qmax = 2 ** (bits - 1) - 1
    s = np.abs(w).max() / qmax                     # escala del grupo
    q = np.clip(np.round(w / s), -qmax, qmax)      # los enteros que se guardan
    err = np.linalg.norm(w - q * s) / np.linalg.norm(w)
    print(f"{bits} bits: error relativo {err:.3f}, pesos en cero {np.mean(q == 0):.0%}")
\`\`\`

Salida:

\`\`\`
70 mil M en FP32:   280 GB
70 mil M en FP16:   140 GB
70 mil M en INT8:    70 GB
70 mil M en INT4:    35 GB
entrenar con Adam (16 B): 1120 GB
techo al escribir, 8 mil M en FP16 en una H100: 209 tokens/s
8 bits: error relativo 0.006, pesos en cero 0%
4 bits: error relativo 0.100, pesos en cero 19%
2 bits: error relativo 0.792, pesos en cero 84%
\`\`\`

## Qué sigue

Al usar el modelo aparece otra memoria, la **caché** de la atención, que crece con cada token de la conversación, y la forma de aprovechar el ancho de banda: atender a muchas personas a la vez. Es la lección 26, la inferencia.`,
    en: `## Bytes per parameter and formats

The memory the weights take is a multiplication:

$$M_{\\text{weights}} = N \\cdot b,$$

with $N$ parameters and $b$ bytes per parameter. For Llama 3.1 70B in FP16: $70\\times10^{9}\\cdot 2 = 1.4\\times10^{11}$ bytes $=140$ GB.

Decimal formats (the IEEE 754 standard) store a sign, an exponent (the range), and a mantissa (the digits):

| format | bytes | sign · exponent · mantissa | decimal digits | largest value |
|---|---|---|---|---|
| FP32 | 4 | 1 · 8 · 23 | $\\log_{10}2^{24}\\approx 7.2$ | $\\approx 3.4\\times10^{38}$ |
| FP16 | 2 | 1 · 5 · 10 | $\\log_{10}2^{11}\\approx 3.3$ | 65,504 |
| BF16 | 2 | 1 · 8 · 7 | $\\log_{10}2^{8}\\approx 2.4$ | same as FP32 |

BF16 (Kalamkar et al., 2019) gives up digits to keep FP32’s range; Llama 3 was trained in BF16. INT8 and INT4 have no exponent: they store an integer plus a shared **scale** (see below).

A detail about units: datasheets say “80 GB” of VRAM, but that is $80\\cdot 2^{30}$ bytes (GiB), 7% more than $80\\times10^{9}$. In this lesson, 1 GB = $10^{9}$ bytes, as with bandwidth; the difference changes no conclusion.

## Training: sixteen bytes per parameter

With Adam in mixed precision (Micikevicius et al., 2018), each parameter needs the weight and gradient in FP16 and, in FP32, a copy of the weight and Adam’s two averages (Kingma and Ba, 2015). ZeRO (Rajbhandari et al., 2020, §3.1) sums it up:

$$M_{\\text{train}} \\approx (2 + 2 + \\underbrace{4 + 4 + 4}_{K\\,=\\,12})\\,N = 16N \\text{ bytes}.$$

The FP32 copy exists because each step’s update (gradient times learning rate) is often thousands of times smaller than the weight: added in FP16, with its 10 mantissa bits, it would be lost to rounding. We measured it on an RTX 3060 (\`measure-memory.py\`, the Pythia-160M architecture with random weights): **16.19** bytes per parameter in full FP32 and **16.05** in mixed precision, after AdamW’s first step.

On top of that come the **activations**, the intermediate results backpropagation needs. Per layer of a 16-bit transformer with linear-memory attention they are about $34\\,s\\,b\\,h$ bytes ($s$ = tokens per sequence, $b$ = sequences per batch, $h$ = width; Korthikanti et al., 2022). On the same RTX 3060 we measured 0.949 times that formula. They can be reduced by recomputing them on the way back, at the cost of more compute.

ZeRO and its PyTorch version, FSDP (the one Meta used), split those 16 bytes across the data copies, so each GPU stores only part of the states.

## Bandwidth: the ceiling when writing

When generating one token at a time, every step reads all the weights:

$$\\text{tokens per second} \\le \\frac{\\text{bandwidth}}{N\\cdot b}.$$

An H100 SXM moves 3,350 GB/s; an 8-billion model in FP16 (16 GB) stays under about 209 tokens per second, however fast it computes. Its dense FP16 compute peak is about 989 trillion operations per second (the datasheet says 1,979 “with sparsity”): $989\\times10^{12}/3.35\\times10^{12}\\approx 295$ operations per byte, about 590 per 2-byte parameter, which a matrix–vector product uses for only 2 (multiply and add).

Measured on an RTX 3060 (\`measure-memory.py\`): copying 1 GiB, 333 GB/s; multiplying a $16384\\times16384$ FP16 matrix by **one** vector, 1.57 ms, 341 GB/s, and just 0.34 trillion operations per second; by **4,096** vectors at once, 27.7 trillion: 81 times more on the same chip, because each weight read is reused. Batching requests is the way out, which we will see in lesson 26.

## Parallelism

The number of GPUs is the product of the three splits: $G = T\\cdot P\\cdot D$ (tensor, pipeline, data).

- **Data**: each copy sees another slice of the batch; at the end of the step the gradients are averaged (a sum across all of them, an *all-reduce*).
- **Pipeline** (GPipe, Huang et al., 2019): $K$ stages of layers; the batch is cut into $M$ micro-batches so the stages work at the same time. The idle fraction (the “bubble”) is on the order of $\\frac{K-1}{M+K-1}$; GPipe found it negligible with $M \\ge 4K$.
- **Tensor** (Megatron-LM, Shoeybi et al., 2019): in each block’s network, the first table is split by columns and the second by rows, so one sum across GPUs per block in each direction is enough. Since it happens at every layer, it stays inside the server, where the GPUs are joined by NVLink (900 GB/s on the H100).

Llama 3.1 405B (Llama Team, 2024, table 4): 8 tensor × 16 pipeline × 128 data = 16,384 H100s, using 41% of their compute; the long-context stage added a fourth split, by context (8 × 16 context × 16 × 8). And to *use* it: in BF16 it does not fit in one 8-H100 server (§6.1), which is why Meta serves it split across two servers or quantized to FP8.

## Group quantization

The lesson’s rule (symmetric round-to-nearest, no calibration), for a group $g$ of 32 weights and $b$ bits:

$$q_{\\max} = 2^{b-1}-1,\\qquad s_g = \\frac{\\max_{i\\in g}|w_i|}{q_{\\max}},\\qquad q_i = \\operatorname{clip}\\!\\Big(\\operatorname{round}\\frac{w_i}{s_g},\\,-q_{\\max},\\,q_{\\max}\\Big),\\qquad \\hat w_i = q_i\\, s_g.$$

With 8 bits there are 255 marks (from −127 to 127); with 4, 15. Each group also stores its scale in FP16: $16/32 = 0.5$ extra bits per weight, so “INT4” is really 4.5 bits (the 70-billion model takes about 39 GB, not 35).

Measured on Pythia-1.4B (\`build-data.py\`: the 96 matrices of its 24 layers, 1.208 billion weights; loss in nats per token over 287,744 tokens of WikiText-2):

| bits | FP16 | 8 | 6 | 5 | 4 | 3 | 2 |
|---|---|---|---|---|---|---|---|
| one scale per group of 32 | 2.5805 | 2.5806 | 2.5858 | 2.5975 | 2.6565 | 3.1589 | 11.045 |
| one scale per matrix | 2.5805 | 2.6002 | 3.2172 | 5.3017 | 10.692 | 10.445 | 21.347 |

With **a single scale per matrix**, the model already breaks at 4 bits: a few outlier weights, up to 13 times the standard deviation in the median matrix, stretch the ruler, and in that matrix two out of three weights land on the zero mark at 4 bits. That is why small groups are used. Production methods go further: LLM.int8() (Dettmers et al., 2022) separates the dimensions with outliers and keeps them in 16 bits; GPTQ (Frantar et al., 2023) corrects the rounding with second-order information and brings 175-billion models to 3 or 4 bits with negligible accuracy loss. Caveat: Pythia saw Wikipedia during training, so the absolute level of the loss is optimistic; what is compared is the difference, measured on the same text.

## In code

\`\`\`python
import numpy as np

def gb(params, bytes_per_param):
    return params * bytes_per_param / 1e9

for fmt, b in [("FP32", 4), ("FP16", 2), ("INT8", 1), ("INT4", 0.5)]:
    print(f"70B in {fmt}: {gb(70e9, b):5.0f} GB")
print(f"training with Adam (16 B): {gb(70e9, 16):.0f} GB")
print(f"writing ceiling, 8B in FP16 on an H100: {3350 / gb(8e9, 2):.0f} tokens/s")

# quantize a group of 32 weights: a ruler with 2^(b-1) - 1 marks per side
rng = np.random.default_rng(0)
w = rng.normal(0, 0.02, 32)
for bits in (8, 4, 2):
    qmax = 2 ** (bits - 1) - 1
    s = np.abs(w).max() / qmax                     # the group's scale
    q = np.clip(np.round(w / s), -qmax, qmax)      # the integers that are stored
    err = np.linalg.norm(w - q * s) / np.linalg.norm(w)
    print(f"{bits} bits: relative error {err:.3f}, weights at zero {np.mean(q == 0):.0%}")
\`\`\`

Output:

\`\`\`
70B in FP32:   280 GB
70B in FP16:   140 GB
70B in INT8:    70 GB
70B in INT4:    35 GB
training with Adam (16 B): 1120 GB
writing ceiling, 8B in FP16 on an H100: 209 tokens/s
8 bits: relative error 0.006, weights at zero 0%
4 bits: relative error 0.100, weights at zero 19%
2 bits: relative error 0.792, weights at zero 84%
\`\`\`

## What comes next

When the model is used, another memory appears, the attention **cache**, which grows with every token of the conversation, along with the way to make the most of bandwidth: serving many people at once. That is lesson 26, inference.`,
  },

  lens: {
    es: [
      'Para estimar el hardware: memoria ≈ parámetros × bytes por parámetro, más un margen para el cálculo (la caché de la lección 26). Un modelo de 8 mil millones en INT8 cabe en una tarjeta de 12 GB; uno de 70 mil millones en FP16 necesita al menos dos H100.',
      'Pregunta en qué formato se sirve un modelo: el mismo nombre puede ofrecerse en FP16 o cuantizado a 4 bits, con costos, velocidad y calidad distintos.',
      'Si te proponen entrenar o ajustar un modelo completo, cuenta unos 16 bytes por parámetro antes de comprar: entrenar pide unas ocho veces más memoria que usar.',
      'Una versión cuantizada puede pasar las pruebas estándar y aun así fallar en casos raros (Meta lo vio con Llama 3). Evalúala con tus propios datos antes de cambiar.',
    ],
    en: [
      'To size hardware: memory ≈ parameters × bytes per parameter, plus a margin for computation (the cache in lesson 26). An 8-billion model in INT8 fits on a 12 GB card; a 70-billion model in FP16 needs at least two H100s.',
      'Ask what format a model is served in: the same name can be offered in FP16 or quantized to 4 bits, with different costs, speed, and quality.',
      'If someone proposes training or fully fine-tuning a model, count about 16 bytes per parameter before buying: training takes about eight times the memory of using it.',
      'A quantized version can pass standard benchmarks and still fail on rare cases (Meta saw this with Llama 3). Evaluate it on your own data before switching.',
    ],
  },

  quiz: [
    {
      kind: 'calc',
      q: {
        es: '¿Cuánta memoria ocupan los parámetros de un modelo de 13 mil millones en FP16?',
        en: 'How much memory do the parameters of a 13-billion model take in FP16?',
      },
      options: [
        { es: '13 GB', en: '13 GB' },
        { es: '26 GB', en: '26 GB' },
        { es: '52 GB', en: '52 GB' },
        { es: '6.5 GB', en: '6.5 GB' },
      ],
      answer: 1,
      why: {
        es: '13 mil millones × 2 bytes = 26 mil millones de bytes = 26 GB. No cabe en una tarjeta de 12 GB; en INT4 (½ byte por parámetro) ocuparía 6.5 GB, y en FP32 (4 bytes), 52.',
        en: '13 billion × 2 bytes = 26 billion bytes = 26 GB. It does not fit on a 12 GB card; in INT4 (½ byte per parameter) it would take 6.5 GB, and in FP32 (4 bytes), 52.',
      },
    },
    {
      kind: 'concept',
      q: {
        es: 'Entrenar con Adam en precisión mixta pide unos 16 bytes por parámetro. ¿De dónde salen?',
        en: 'Training with Adam in mixed precision takes about 16 bytes per parameter. Where do they come from?',
      },
      options: [
        { es: 'De guardar el modelo en ocho GPU a la vez, con 2 bytes en cada una.', en: 'From storing the model on eight GPUs at once, with 2 bytes on each.' },
        { es: 'De los datos de entrenamiento: unos 16 bytes por token leído.', en: 'From the training data: about 16 bytes per token read.' },
        { es: 'Del parámetro y su gradiente en FP16 (2 + 2), una copia en FP32 (4) y los dos promedios de Adam (4 + 4).', en: 'From the parameter and its gradient in FP16 (2 + 2), a copy in FP32 (4), and Adam’s two averages (4 + 4).' },
        { es: 'De usar FP32 (4 bytes) en cuatro capas a la vez.', en: 'From using FP32 (4 bytes) in four layers at once.' },
      ],
      answer: 2,
      why: {
        es: '2 + 2 + 4 + 4 + 4 = 16 (Rajbhandari et al., 2020). Son estados que viven por cada parámetro durante todo el entrenamiento; las activaciones van aparte y dependen del tamaño del lote.',
        en: '2 + 2 + 4 + 4 + 4 = 16 (Rajbhandari et al., 2020). They are states kept for every parameter throughout training; activations come on top and depend on the batch size.',
      },
    },
    {
      kind: 'concept',
      q: {
        es: 'Al escribir una respuesta token a token, ¿por qué los núcleos de una GPU pasan mucho tiempo esperando?',
        en: 'When writing an answer token by token, why do a GPU’s cores spend much of their time waiting?',
      },
      options: [
        { es: 'Porque por cada token hay que leer todos los parámetros de la memoria, y el ancho de banda no alcanza a alimentarlos.', en: 'Because every token requires reading all the parameters from memory, and the bandwidth cannot keep them fed.' },
        { es: 'Porque los núcleos se apagan para ahorrar energía entre palabra y palabra.', en: 'Because the cores switch off to save energy between words.' },
        { es: 'Porque la GPU tiene que volver a entrenar el modelo antes de cada token.', en: 'Because the GPU has to retrain the model before each token.' },
        { es: 'Porque los núcleos solo pueden sumar, no multiplicar.', en: 'Because the cores can only add, not multiply.' },
      ],
      answer: 0,
      why: {
        es: 'Con un solo token, cada parámetro leído se usa en solo dos operaciones, mientras la H100 podría hacer unas 600 en lo que tarda en llegar. El techo es ancho de banda ÷ bytes del modelo; procesar muchas peticiones a la vez reutiliza cada lectura (lección 26).',
        en: 'With a single token, each parameter read is used in just two operations, while the H100 could do about 600 in the time it takes to arrive. The ceiling is bandwidth ÷ model bytes; processing many requests at once reuses each read (lesson 26).',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Tu equipo tiene una RTX 3060 de 12 GB y quiere usar un modelo abierto de 8 mil millones de parámetros. ¿Qué es lo más razonable?',
        en: 'Your team has a 12 GB RTX 3060 and wants to use an open model with 8 billion parameters. What is the most sensible choice?',
      },
      options: [
        { es: 'Usarlo en FP16: 8 mil millones caben en 12 GB.', en: 'Use it in FP16: 8 billion fits in 12 GB.' },
        { es: 'Entrenarlo desde cero en la tarjeta para que ocupe menos.', en: 'Train it from scratch on the card so it takes less room.' },
        { es: 'Descartarlo: un modelo así solo funciona en una H100.', en: 'Rule it out: a model like that only runs on an H100.' },
        { es: 'Usar una versión cuantizada a 8 o 4 bits (unos 8 o 4 GB) y comprobar su calidad con sus propias tareas.', en: 'Use a version quantized to 8 or 4 bits (about 8 or 4 GB) and check its quality on your own tasks.' },
      ],
      answer: 3,
      why: {
        es: 'En FP16 ocupa 16 GB y no cabe. Cuantizado a 8 bits ocupa unos 8 GB y deja espacio para el cálculo; a 4 bits, unos 4. Entrenar pediría unos 128 GB. Y la calidad del modelo cuantizado se verifica con casos propios.',
        en: 'In FP16 it takes 16 GB and does not fit. Quantized to 8 bits it takes about 8 GB and leaves room for computation; at 4 bits, about 4. Training would take about 128 GB. And the quantized model’s quality is checked on your own cases.',
      },
    },
  ],

  glossary: ['vram', 'fp16', 'quantization', 'bandwidth', 'parallelism', 'gpu', 'parameter', 'gradient', 'adam', 'backpropagation', 'layer', 'token', 'loss', 'compute', 'pretraining', 'inference'],

  terms: [
    {
      id: 'vram',
      term: { es: 'VRAM (memoria de la GPU)', en: 'VRAM (GPU memory)' },
      def: {
        es: 'La memoria propia de una GPU, en la misma tarjeta que sus núcleos. Ahí deben estar los parámetros y los datos con los que calcula. Se mide en gigabytes: 80 en una H100, 12 en una RTX 3060. En las GPU de centro de datos es de un tipo muy rápido llamado HBM.',
        en: 'A GPU’s own memory, on the same board as its cores. The parameters and data it computes with must be there. It is measured in gigabytes: 80 on an H100, 12 on an RTX 3060. On data-center GPUs it is a very fast type called HBM.',
      },
    },
    {
      id: 'fp16',
      term: { es: 'FP16 (y FP32, INT8, INT4)', en: 'FP16 (and FP32, INT8, INT4)' },
      def: {
        es: 'Formatos para guardar cada número de un modelo. FP16 usa 2 bytes y guarda unas 3 cifras significativas; FP32, 4 bytes y unas 7. INT8 (1 byte) e INT4 (½ byte) guardan un entero que, multiplicado por una escala, aproxima el valor. BF16 es una variante de 2 bytes con el alcance de FP32.',
        en: 'Formats for storing each number in a model. FP16 uses 2 bytes and keeps about 3 significant digits; FP32, 4 bytes and about 7. INT8 (1 byte) and INT4 (½ byte) store an integer that, multiplied by a scale, approximates the value. BF16 is a 2-byte variant with FP32’s range.',
      },
    },
    {
      id: 'quantization',
      term: { es: 'Cuantización', en: 'Quantization' },
      def: {
        es: 'Guardar los parámetros de un modelo ya entrenado con menos bits (8 o 4 en lugar de 16), redondeando cada uno a la marca más cercana de una escala propia de su grupo. Reduce la memoria y el tiempo de lectura, con una pérdida de calidad que hay que medir.',
        en: 'Storing a trained model’s parameters with fewer bits (8 or 4 instead of 16), rounding each one to the nearest mark of a scale shared by its group. It reduces memory and read time, with a loss of quality that has to be measured.',
      },
    },
    {
      id: 'bandwidth',
      term: { es: 'Ancho de banda (de memoria)', en: 'Memory bandwidth' },
      def: {
        es: 'Cuántos bytes por segundo pueden viajar de la memoria a los núcleos: 3 350 GB/s en una H100. Al generar texto token a token suele ser el límite de velocidad, porque cada token exige leer todos los parámetros.',
        en: 'How many bytes per second can travel from memory to the cores: 3,350 GB/s on an H100. When generating text token by token it is usually the speed limit, because every token requires reading all the parameters.',
      },
    },
    {
      id: 'parallelism',
      term: { es: 'Paralelismo (de datos, de tubería, de tensor)', en: 'Parallelism (data, pipeline, tensor)' },
      def: {
        es: 'Repartir el entrenamiento o el uso de un modelo entre varias GPU: copias completas que ven datos distintos (datos), grupos de capas en fila (tubería) o cada tabla de parámetros partida en pedazos (tensor). Se combinan: Llama 3.1 405B usó 8 × 16 × 128 = 16 384 GPU.',
        en: 'Splitting the training or use of a model across several GPUs: full copies that see different data (data), groups of layers in a row (pipeline), or each table of parameters cut into pieces (tensor). They are combined: Llama 3.1 405B used 8 × 16 × 128 = 16,384 GPUs.',
      },
    },
  ],

  sources: [
    { title: 'NVIDIA H100 Tensor Core GPU: especificaciones (H100 SXM: 80 GB, 3.35 TB/s, NVLink 900 GB/s)', authors: 'NVIDIA', year: 2022, url: 'https://www.nvidia.com/en-us/data-center/h100/' },
    { title: 'NVIDIA Hopper Architecture In-Depth (16 896 núcleos FP32, 80 GB HBM3 en 5 pilas)', authors: 'Andersch, M., Palmer, G., Krashinsky, R., Stam, N., Mehta, V., Brito, G., Ramaswamy, S.', year: 2022, url: 'https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/' },
    { title: 'GeForce RTX 3060 family: especificaciones (12 GB GDDR6, bus de 192 bits)', authors: 'NVIDIA', year: 2021, url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', authors: 'Rajbhandari, S., Rasley, J., Ruwase, O., He, Y.', year: 2020, url: 'https://arxiv.org/abs/1910.02054' },
    { title: 'Mixed Precision Training', authors: 'Micikevicius, P., Narang, S., Alben, J., Diamos, G., Elsen, E., Garcia, D., et al.', year: 2018, url: 'https://arxiv.org/abs/1710.03740' },
    { title: 'Adam: A Method for Stochastic Optimization', authors: 'Kingma, D. P., Ba, J.', year: 2015, url: 'https://arxiv.org/abs/1412.6980' },
    { title: 'IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019)', authors: 'IEEE', year: 2019, url: 'https://doi.org/10.1109/IEEESTD.2019.8766229' },
    { title: 'A Study of BFLOAT16 for Deep Learning Training', authors: 'Kalamkar, D., Mudigere, D., Mellempudi, N., Das, D., Banerjee, K., Avancha, S., et al.', year: 2019, url: 'https://arxiv.org/abs/1905.12322' },
    { title: 'Reducing Activation Recomputation in Large Transformer Models', authors: 'Korthikanti, V., Casper, J., Lym, S., McAfee, L., Andersch, M., Shoeybi, M., Catanzaro, B.', year: 2022, url: 'https://arxiv.org/abs/2205.05198' },
    { title: 'GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism', authors: 'Huang, Y., Cheng, Y., Bapna, A., Firat, O., Chen, M. X., Chen, D., et al.', year: 2019, url: 'https://arxiv.org/abs/1811.06965' },
    { title: 'Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism', authors: 'Shoeybi, M., Patwary, M., Puri, R., LeGresley, P., Casper, J., Catanzaro, B.', year: 2019, url: 'https://arxiv.org/abs/1909.08053' },
    { title: 'Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM', authors: 'Narayanan, D., Shoeybi, M., Casper, J., LeGresley, P., Patwary, M., Korthikanti, V., et al.', year: 2021, url: 'https://arxiv.org/abs/2104.04473' },
    { title: 'LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale', authors: 'Dettmers, T., Lewis, M., Belkada, Y., Zettlemoyer, L.', year: 2022, url: 'https://arxiv.org/abs/2208.07339' },
    { title: 'GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers', authors: 'Frantar, E., Ashkboos, S., Hoefler, T., Alistarh, D.', year: 2023, url: 'https://arxiv.org/abs/2210.17323' },
    { title: 'Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling', authors: 'Biderman, S., Schoelkopf, H., Anthony, Q., Bradley, H., O’Brien, K., Hallahan, E., et al.', year: 2023, url: 'https://arxiv.org/abs/2304.01373' },
    { title: 'EleutherAI/pythia-1.4b (ficha del modelo, licencia Apache-2.0)', authors: 'EleutherAI', year: 2023, url: 'https://huggingface.co/EleutherAI/pythia-1.4b' },
    { title: 'Pointer Sentinel Mixture Models (presenta WikiText-2)', authors: 'Merity, S., Xiong, C., Bradbury, J., Socher, R.', year: 2016, url: 'https://arxiv.org/abs/1609.07843' },
  ],
});
