import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'transformer',

  objectives: {
    es: [
      'Seguir el camino completo de una frase dentro de un transformer: tokens, números, embeddings, bloques, puntajes, softmax y la siguiente palabra.',
      'Explicar qué hace cada pieza de un bloque (atención, red, conexión residual y normalización de capa) y por qué hacen falta la codificación de posición y la máscara causal.',
      'Calcular cuántos parámetros tiene cada parte de un transformer pequeño y reconocer dónde está casi todo el tamaño de un modelo real como GPT-3.',
    ],
    en: [
      'Follow the full path of a sentence inside a transformer: tokens, numbers, embeddings, blocks, scores, softmax, and the next word.',
      'Explain what each piece of a block does (attention, network, residual connection, and layer normalization) and why positional encoding and the causal mask are needed.',
      'Calculate how many parameters each part of a small transformer has and recognize where almost all the size of a real model like GPT-3 lives.',
    ],
  },

  segments: [
    // ── las piezas y el modelo de juguete ──
    {
      id: 'hook',
      es: 'Ya conoces las piezas: tokens, embeddings, atención y la predicción de la siguiente palabra. Hoy las armamos en una sola máquina: el transformer, la que está dentro de GPT.',
      en: 'You already know the pieces: tokens, embeddings, attention, and next-word prediction. Today we put them together into one machine: the transformer, the one inside GPT.',
    },
    {
      id: 'toy',
      es: 'Para verla por dentro entrenamos un transformer diminuto. Solo conoce doce palabras y frases sencillas, como «el gato come pescado» o «el loro bebe agua».',
      en: 'To see inside it, we trained a tiny transformer. It knows only twelve words and simple sentences, like “the cat eats fish” or “the parrot drinks water.”',
    },
    {
      id: 'toy-task',
      es: 'Su tarea es la de la lección diecinueve: recibe el principio de una frase y da una probabilidad a cada palabra que podría seguir. Le daremos «el gato come».',
      en: 'Its task is the one from lesson nineteen: it gets the start of a sentence and gives a probability to every word that could come next. We will give it “the cat eats.”',
    },
    // ── el camino completo, despacio ──
    {
      id: 'path-tokens',
      es: 'Primer paso, de la lección veinte: el texto se corta en tokens. En nuestro modelo cada palabra es un token: «el», «gato» y «come».',
      en: 'Step one, from lesson twenty: the text is cut into tokens. In our model each word is one token: “the,” “cat,” and “eats.”',
    },
    {
      id: 'path-ids',
      es: 'Cada token se cambia por su número en el vocabulario: «el» es el uno, «gato» el dos y «come» el seis. Al modelo solo le llegan esos números.',
      en: 'Each token is swapped for its number in the vocabulary: “the” is one, “cat” is two, and “eats” is six. Only those numbers reach the model.',
    },
    {
      id: 'path-embed',
      es: 'Cada número saca su fila de la tabla de embeddings, como en la lección catorce: una lista de ocho números por token, que el modelo aprendió al entrenar.',
      en: 'Each number pulls its row from the embedding table, as in lesson fourteen: a list of eight numbers per token, which the model learned in training.',
      pad: 0.3,
    },
    {
      id: 'path-blocks',
      es: 'Esas tres listas entran a los bloques del transformer. Ahí cada token mira a los demás, con la atención de la lección veintiuno, y sus números cambian.',
      en: 'Those three lists go into the transformer’s blocks. There, each token looks at the others, with the attention from lesson twenty-one, and its numbers change.',
      pad: 0.3,
    },
    {
      id: 'path-last',
      es: 'Al salir, solo nos importa la lista del último token, «come». Ya no dice solo «come»: también lleva información de quién come.',
      en: 'On the way out, we only care about the list for the last token, “eats.” It no longer says just “eats”: it also carries who is eating.',
    },
    {
      id: 'path-scores',
      es: 'Esa lista se compara con cada palabra del vocabulario y da doce puntajes, uno por palabra. «Pescado» saca el más alto, y «hueso», el segundo.',
      en: 'That list is compared with every word in the vocabulary, giving twelve scores, one per word. “Fish” gets the highest, and “bone” the second.',
      pad: 0.3,
    },
    {
      id: 'path-softmax',
      es: 'Softmax, de la lección diecinueve, vuelve esos puntajes probabilidades: pescado, noventa por ciento; hueso, diez; las otras diez palabras, casi cero.',
      en: 'Softmax, from lesson nineteen, turns those scores into probabilities: fish, ninety percent; bone, ten; the other ten words, almost zero.',
      note: { es: 'Camino: tokens → números → embeddings → bloques → puntajes → softmax.', en: 'Path: tokens → numbers → embeddings → blocks → scores → softmax.' },
      pad: 0.3,
    },
    {
      id: 'path-loop',
      es: 'Se elige una palabra, se agrega al final y el camino entero se repite para la siguiente. Es la autorregresión: así sale «el gato come pescado».',
      en: 'A word is chosen, added to the end, and the whole path runs again for the next one. That is autoregression: that is how “the cat eats fish” comes out.',
      pad: 0.3,
    },
    // ── demostración y «tu turno»: cambiar el sujeto ──
    {
      id: 'pass-demo',
      es: 'Mira qué pasa si cambiamos el sujeto. Con «el perro come», gana hueso, setenta por ciento. Con «el loro come», semillas, ochenta y cinco.',
      en: 'Watch what happens if we change the subject. With “the dog eats,” bone wins, seventy percent. With “the parrot eats,” seeds, eighty-five.',
      pad: 0.6,
    },
    {
      id: 'pass-try',
      es: 'Si quieres, elige tú el sujeto y mira cómo recorre el camino y cambia la predicción.',
      en: 'If you like, pick the subject yourself and watch it travel the path and change the prediction.',
      gate: {
        id: 'subject',
        prompt: { es: 'elige otro sujeto y mira la predicción.', en: 'pick another subject and watch the prediction.' },
      },
      pad: 0.4,
    },
    {
      id: 'pass-why',
      es: 'La última palabra es «come» en los tres casos. Entonces, ¿cómo llegó «perro» o «loro» hasta la lista de «come»? Pasa dentro de los bloques. Abramos uno.',
      en: 'The last word is “eats” in all three cases. So how did “dog” or “parrot” get into the list for “eats”? It happens inside the blocks. Let’s open one.',
      pad: 0.3,
    },
    // ── el bloque, pieza por pieza ──
    {
      id: 'block-parts',
      es: 'Un bloque tiene dos partes. Primero, la atención: los tokens se miran entre sí. Después, una red: cada token se procesa por su cuenta.',
      en: 'A block has two parts. First, attention: the tokens look at each other. Then, a network: each token is processed on its own.',
      note: { es: 'Bloque = atención (entre tokens) + red (cada token solo).', en: 'Block = attention (between tokens) + network (each token alone).' },
      pad: 0.3,
    },
    {
      id: 'attn',
      es: 'La atención es la de la lección veintiuno. En el primer bloque, una de sus cabezas hace que «come» mire sobre todo a «gato»: le da el cincuenta y seis por ciento de su atención.',
      en: 'Attention is the one from lesson twenty-one. In the first block, one of its heads makes “eats” look mostly at “cat”: it gives it fifty-six percent of its attention.',
      pad: 0.3,
    },
    {
      id: 'attn-off',
      es: 'Lo comprobamos: si apagamos la atención, el gato, el perro y el loro reciben exactamente la misma predicción. La atención es el único camino entre tokens.',
      en: 'We checked: if we switch attention off, the cat, the dog, and the parrot get exactly the same prediction. Attention is the only path between tokens.',
      pad: 0.6,
    },
    {
      id: 'mlp',
      es: 'La segunda parte es una red como las de la lección siete: de ocho números a treinta y dos y de vuelta a ocho, con una activación en medio. Cada token pasa solo por ella.',
      en: 'The second part is a network like the ones in lesson seven: from eight numbers to thirty-two and back to eight, with an activation in between. Each token goes through it alone.',
      pad: 0.3,
    },
    {
      id: 'residual',
      es: 'Ahora, dos detalles que permiten apilar muchos bloques. El primero: ninguna parte reemplaza la lista del token. Calcula un aporte y lo suma a lo que ya traía.',
      en: 'Now, two details that make it possible to stack many blocks. First: no part replaces the token’s list. It computes a contribution and adds it to what was already there.',
      pad: 0.3,
    },
    {
      id: 'residual-demo',
      es: 'Mira los ocho números de «come»: lo que traía, más el aporte de la atención, da la lista nueva. Número por número, una suma.',
      en: 'Look at the eight numbers for “eats”: what it had, plus attention’s contribution, gives the new list. Number by number, a sum.',
      pad: 0.6,
    },
    {
      id: 'residual-name',
      es: 'Si una parte no aporta nada útil, la lista pasa intacta. Es la conexión residual de la lección trece: el atajo que permitió entrenar redes muy profundas.',
      en: 'If a part adds nothing useful, the list passes through intact. It is the residual connection from lesson thirteen: the shortcut that made very deep networks trainable.',
      note: { es: 'Conexión residual: cada parte suma su aporte, no reemplaza.', en: 'Residual connection: each part adds its contribution instead of replacing.' },
      pad: 0.5,
    },
    {
      id: 'norm-why',
      es: 'El segundo detalle: con cada suma, los ocho números de una lista cambian de centro y de tamaño. En un modelo con muchos bloques pueden crecer mucho, y eso estorba al entrenar.',
      en: 'The second detail: with each sum, a list’s eight numbers shift their center and their size. In a model with many blocks they can grow a lot, and that gets in the way of training.',
      pad: 0.3,
    },
    {
      id: 'norm-mean',
      es: 'Por eso, antes de cada parte, la lista se normaliza. Primero se calcula el promedio de sus ocho números y se le resta a cada uno: quedan repartidos alrededor de cero.',
      en: 'So before each part, the list is normalized. First, the average of its eight numbers is computed and subtracted from each one: they end up spread around zero.',
      pad: 0.5,
    },
    {
      id: 'norm-scale',
      es: 'Luego cada número se divide entre la desviación estándar, una medida de qué tan dispersos están. Así la lista queda de un tamaño parecido, venga como venga.',
      en: 'Then each number is divided by the standard deviation, a measure of how spread out they are. That way the list ends up a similar size, however it arrived.',
      pad: 0.5,
    },
    {
      id: 'norm-name',
      es: 'Eso es la normalización de capa. Al final, dos ajustes que también se aprenden afinan el resultado. Así cada parte recibe siempre números en una escala estable.',
      en: 'That is layer normalization. At the end, two adjustments that are also learned fine-tune the result. So every part always receives numbers on a steady scale.',
      note: { es: 'Normalización de capa: restar el promedio y dividir entre la desviación estándar.', en: 'Layer normalization: subtract the average and divide by the standard deviation.' },
      pad: 0.3,
    },
    {
      id: 'block-full',
      es: 'El bloque completo: normalizar, atención y sumar; normalizar, red y sumar. Mira cómo cambia la lista de «come» en cada paso.',
      en: 'The full block: normalize, attention, and add; normalize, network, and add. Watch the list for “eats” change at each step.',
      pad: 0.8,
    },
    {
      id: 'stack',
      es: 'Un transformer apila varios bloques con la misma forma, cada uno con sus propios números. El nuestro tiene dos; GPT-3, noventa y seis.',
      en: 'A transformer stacks several blocks with the same shape, each with its own numbers. Ours has two; GPT-3 has ninety-six.',
      tts: {
        es: 'Un transformer apila varios bloques con la misma forma, cada uno con sus propios números. El nuestro tiene dos; ge pe te tres, noventa y seis.',
        en: 'A transformer stacks several blocks with the same shape, each with its own numbers. Ours has two; G P T three has ninety-six.',
      },
      note: { es: 'Transformer: una pila de bloques con la misma forma.', en: 'Transformer: a stack of blocks with the same shape.' },
      pad: 0.4,
    },
    // ── el orden: codificación de posición ──
    {
      id: 'pos-why',
      es: 'Falta una pieza. La atención sola no sabe el orden: si barajas los tokens, cada uno mira a los mismos con los mismos pesos. Solo importa quién está, no dónde.',
      en: 'One piece is missing. Attention alone does not know order: if you shuffle the tokens, each one looks at the same ones with the same weights. Only who is there matters, not where.',
      pad: 0.6,
    },
    {
      id: 'pos-add',
      es: 'Pero el orden cambia el sentido. La solución: a cada lugar le toca su propia lista de ocho números, la codificación de posición, que se suma al embedding.',
      en: 'But order changes the meaning. The fix: each place gets its own list of eight numbers, the positional encoding, which is added to the embedding.',
      note: { es: 'Codificación de posición: una lista por lugar, sumada al embedding.', en: 'Positional encoding: one list per place, added to the embedding.' },
      pad: 0.5,
    },
    {
      id: 'pos-waves',
      es: 'En el artículo original esas listas salen de ondas de distintas frecuencias; GPT, en cambio, las aprende al entrenar. Nuestro juguete usa las ondas.',
      en: 'In the original paper those lists come from waves of different frequencies; GPT, instead, learns them in training. Our toy uses the waves.',
      pad: 0.5,
    },
    // ── no mirar el futuro: la máscara causal ──
    {
      id: 'mask-train',
      es: 'Otro problema aparece al entrenar. El modelo aprende con frases completas, como «el gato come pescado», y en cada lugar adivina el token que sigue.',
      en: 'Another problem shows up in training. The model learns from whole sentences, like “the cat eats fish,” and at each place it guesses the next token.',
      pad: 0.3,
    },
    {
      id: 'mask-cheat',
      es: 'Pero en la atención cada token puede mirar a todos, también a los que vienen después. Para adivinar lo que sigue a «come», bastaría mirar «pescado» y copiar.',
      en: 'But in attention every token can look at all the others, including the ones that come later. To guess what follows “eats,” it could just look at “fish” and copy.',
      pad: 0.3,
    },
    {
      id: 'mask-table',
      es: 'Esta es la tabla de atención de un modelo que entrenamos así. Cada fila es un token que mira; cada columna, uno mirado. Y «come» mira a «pescado»: ochenta y ocho por ciento.',
      en: 'This is the attention table of a model we trained that way. Each row is a token that looks; each column, one being looked at. And “eats” looks at “fish”: eighty-eight percent.',
      pad: 0.4,
    },
    {
      id: 'mask-cover',
      es: 'La máscara causal lo impide: tapa las casillas del futuro, a la derecha de la diagonal. Su puntuación se cambia por menos infinito, y softmax les da peso cero.',
      en: 'The causal mask prevents this: it covers the future cells, to the right of the diagonal. Their score is replaced with minus infinity, and softmax gives them zero weight.',
      note: { es: 'Máscara causal: cada token solo mira hacia atrás y a sí mismo.', en: 'Causal mask: each token only looks back and at itself.' },
      pad: 0.5,
    },
    {
      id: 'mask-masked',
      es: 'Con la máscara, cada token reparte su atención solo entre sí mismo y los anteriores. Esta es la tabla de nuestro modelo: la mitad de arriba queda vacía.',
      en: 'With the mask, each token spreads its attention only over itself and the earlier ones. This is our model’s table: the upper half stays empty.',
      pad: 0.4,
    },
    {
      id: 'mask-test',
      es: '¿Y el modelo que copiaba? Al entrenar casi no falla: su error baja a cero punto cero seis. El nuestro, con máscara, se queda en cero punto cinco tres.',
      en: 'And the model that copied? In training it almost never misses: its error drops to zero point zero six. Ours, with the mask, stays at zero point five three.',
      pad: 0.4,
    },
    {
      id: 'mask-real',
      es: 'Pero al escribir no hay futuro que copiar: su error sube a tres punto cero nueve, peor que adivinar al azar, dos punto cuatro ocho. El nuestro sigue en cero punto cinco tres.',
      en: 'But when writing there is no future to copy: its error jumps to three point zero nine, worse than guessing at random, two point four eight. Ours stays at zero point five three.',
      pad: 0.5,
    },
    // ── solo decodificador ──
    {
      id: 'enc-dec',
      es: 'El artículo de dos mil diecisiete que presentó el transformer lo usaba para traducir, con dos mitades: un codificador que lee la frase original y un decodificador que escribe la traducción.',
      en: 'The twenty seventeen paper that introduced the transformer used it to translate, with two halves: an encoder that reads the original sentence and a decoder that writes the translation.',
      pad: 0.3,
    },
    {
      id: 'decoder-only',
      es: 'Solo la mitad que escribe lleva máscara. GPT se queda únicamente con esa mitad: por eso se llama un modelo solo decodificador. Nuestro juguete es uno.',
      en: 'Only the half that writes has a mask. GPT keeps just that half: that is why it is called a decoder-only model. Our toy is one.',
      note: { es: 'Solo decodificador: una pila de bloques con máscara causal, como GPT.', en: 'Decoder-only: a stack of blocks with a causal mask, like GPT.' },
      pad: 0.4,
    },
    // ── de dónde salen los parámetros ──
    {
      id: 'params-emb',
      es: '¿De dónde salen los parámetros, los números que se ajustan al entrenar? Contemos los del juguete. La tabla de embeddings: doce palabras por ocho números, noventa y seis.',
      en: 'Where do the parameters come from, the numbers adjusted in training? Let’s count the toy’s. The embedding table: twelve words times eight numbers, ninety-six.',
      pad: 0.3,
    },
    {
      id: 'params-attn',
      es: 'La atención de cada bloque tiene cuatro tablas de ocho por ocho, de sesenta y cuatro números, más treinta y dos sesgos: doscientos ochenta y ocho. Por dos bloques, quinientos setenta y seis.',
      en: 'Each block’s attention has four eight-by-eight tables of sixty-four numbers, plus thirty-two biases: two hundred eighty-eight. Times two blocks, five hundred seventy-six.',
      pad: 0.3,
    },
    {
      id: 'params-mlp',
      es: 'La red de cada bloque va de ocho a treinta y dos y vuelve: dos tablas de doscientos cincuenta y seis, más cuarenta sesgos. Por dos bloques, mil ciento cuatro.',
      en: 'Each block’s network goes from eight to thirty-two and back: two tables of two hundred fifty-six, plus forty biases. Times two blocks, one thousand one hundred four.',
      pad: 0.3,
    },
    {
      id: 'params-total',
      es: 'Las normalizaciones suman ochenta. En total, mil ochocientos cincuenta y seis parámetros, y casi todos viven en la red y en la atención de los bloques.',
      en: 'The normalizations add eighty. In total, one thousand eight hundred fifty-six parameters, and almost all of them live in the blocks’ networks and attention.',
      pad: 0.3,
    },
    {
      id: 'params-real',
      es: 'Ahora un modelo real, GPT-3: noventa y seis bloques y listas de doce mil doscientos ochenta y ocho números. La misma cuenta da unos ciento setenta y cinco mil millones.',
      en: 'Now a real model, GPT-3: ninety-six blocks and lists of twelve thousand two hundred eighty-eight numbers. The same count gives about one hundred seventy-five billion.',
      tts: {
        es: 'Ahora un modelo real, ge pe te tres: noventa y seis bloques y listas de doce mil doscientos ochenta y ocho números. La misma cuenta da unos ciento setenta y cinco mil millones.',
        en: 'Now a real model, G P T three: ninety-six blocks and lists of twelve thousand two hundred eighty-eight numbers. The same count gives about one hundred seventy-five billion.',
      },
      note: { es: 'Parámetros: casi todos en las tablas de atención y de la red de cada bloque.', en: 'Parameters: almost all in the attention and network tables of each block.' },
      pad: 0.4,
    },
    {
      id: 'params-demo',
      es: 'Mira cuánto pesa el embedding en cada modelo: en el juguete, el cinco por ciento; en GPT-3 pequeño, de doce bloques, un tercio; en GPT-3, menos del uno por ciento.',
      en: 'See how much the embedding weighs in each model: in the toy, five percent; in GPT-3 Small, with twelve blocks, a third; in GPT-3, less than one percent.',
      tts: {
        es: 'Mira cuánto pesa el embedding en cada modelo: en el juguete, el cinco por ciento; en ge pe te tres pequeño, de doce bloques, un tercio; en ge pe te tres, menos del uno por ciento.',
        en: 'See how much the embedding weighs in each model: in the toy, five percent; in G P T three Small, with twelve blocks, a third; in G P T three, less than one percent.',
      },
      pad: 0.6,
    },
    {
      id: 'params-try',
      es: 'Si quieres, elige tú un modelo y compara cuánto pesa cada parte.',
      en: 'If you like, pick a model yourself and compare how much each part weighs.',
      gate: {
        id: 'model',
        prompt: { es: 'elige un modelo y compara sus partes.', en: 'pick a model and compare its parts.' },
      },
      pad: 0.4,
    },
    // ── cierre ──
    {
      id: 'today',
      es: 'Los modelos actuales cambian detalles: otra forma de marcar la posición, otra normalización, otra activación. Pero el esqueleto es este mismo.',
      en: 'Current models change details: another way to mark position, another normalization, another activation. But the skeleton is this same one.',
      pad: 0.3,
    },
    {
      id: 'recap',
      es: 'En resumen: tokens, números, embeddings más posición; bloques de atención con máscara y red, con sumas y normalización; y al final puntajes, softmax y la siguiente palabra.',
      en: 'In short: tokens, numbers, embeddings plus position; blocks of masked attention and a network, with sums and normalization; and at the end scores, softmax, and the next word.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Ya conocemos la arquitectura, pero sus números empiezan al azar. ¿Qué pasa al entrenarla con casi todo internet? Es la siguiente lección: el preentrenamiento.',
      en: 'We now know the architecture, but its numbers start out random. What happens when it is trained on nearly all of the internet? That is the next lesson: pretraining.',
    },
  ],

  keyIdeas: {
    es: [
      'Un transformer recorre siempre el mismo camino: tokens, números, embeddings más posición, una pila de bloques y, con la lista del último token, doce puntajes (uno por palabra) que softmax vuelve probabilidades.',
      'Cada bloque tiene dos partes: la atención, el único camino por el que un token recibe información de los demás, y una red que procesa cada token por separado.',
      'Ninguna parte reemplaza la lista de un token: le suma su aporte (conexión residual). Antes de cada parte, la normalización de capa le resta su promedio y la divide entre su desviación estándar.',
      'La atención sola no sabe el orden: por eso se suma la codificación de posición. La máscara causal impide mirar el futuro; sin ella, el modelo aprende a copiar y no sirve para escribir.',
      'Los parámetros se cuentan por tablas. En un modelo grande casi todos están en la atención y en la red de los bloques: en GPT-3, el embedding es menos del uno por ciento.',
    ],
    en: [
      'A transformer always follows the same path: tokens, numbers, embeddings plus position, a stack of blocks, and, from the last token’s list, one score per word that softmax turns into probabilities.',
      'Each block has two parts: attention, the only path by which a token receives information from the others, and a network that processes each token separately.',
      'No part replaces a token’s list: it adds its contribution (residual connection). Before each part, layer normalization subtracts the list’s average and divides it by its standard deviation.',
      'Attention alone does not know order, so a positional encoding is added. The causal mask blocks looking at the future; without it, the model learns to copy and is useless for writing.',
      'Parameters are counted table by table. In a large model almost all of them are in the blocks’ attention and network: in GPT-3, the embedding is less than one percent.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un transformer lee el texto de izquierda a derecha, palabra por palabra, como una persona.',
      en: 'A transformer reads the text from left to right, word by word, like a person.',
    },
    right: {
      es: 'Todos los tokens entran a la vez y cada bloque los procesa en paralelo. El orden se lo da la codificación de posición, y es la máscara causal la que impide que cada token mire hacia delante. Lo que sí va palabra por palabra es la escritura: un pase completo por cada token nuevo.',
      en: 'All the tokens go in at once and each block processes them in parallel. Order comes from the positional encoding, and it is the causal mask that stops each token from looking ahead. What does go word by word is the writing: one full pass for each new token.',
    },
  },

  deeper: {
    es: `## El pase completo, ecuación por ecuación

Para una secuencia de $T$ tokens con números $t_1,\\dots,t_T$, una tabla de embeddings $E$ (una fila de $d$ números por palabra del vocabulario) y $L$ bloques, en la variante «con normalización previa» de GPT-2, que es la de nuestro juguete ($d=8$, $L=2$):

$$x_i \\leftarrow E[t_i] + \\mathrm{PE}_i$$

y, en cada bloque, con $\\mathrm{LN}$ la normalización de capa:

$$x \\leftarrow x + \\mathrm{Atenci\\acute{o}n}\\big(\\mathrm{LN}_1(x)\\big) \\qquad x \\leftarrow x + \\mathrm{MLP}\\big(\\mathrm{LN}_2(x)\\big)$$

Esas dos sumas son las conexiones residuales: cada parte suma su aporte a $x$. Al salir del último bloque, la lista del último token da los puntajes (en inglés, *logits*) y softmax las probabilidades:

$$z = \\mathrm{LN}_f(x_T)\\,E^\\top \\qquad p = \\mathrm{softmax}(z)$$

«Comparar con cada palabra del vocabulario» es exactamente esto: un producto punto con cada fila de $E$, **la misma** tabla de la entrada. Reutilizarla ahorra $V\\cdot d$ parámetros; ya lo hacía el artículo de 2017 (sección 3.4) y la técnica se estudia en Press y Wolf (2017). Al entrenar se usan las $T$ posiciones a la vez: cada una predice el token siguiente.

## La atención con máscara

Con $Q$, $K$ y $V$ como en la lección 21 y la máscara $M_{ij}=0$ si $j\\le i$ y $-\\infty$ si $j>i$:

$$\\mathrm{Atenci\\acute{o}n}(Q,K,V)=\\mathrm{softmax}\\!\\Big(\\frac{QK^\\top}{\\sqrt{d_h}}+M\\Big)V$$

Como $e^{-\\infty}=0$, el futuro recibe peso cero. Así lo describe el artículo original para el decodificador: se pone en $-\\infty$ toda entrada de softmax que corresponda a una conexión «ilegal», para preservar la propiedad autorregresiva (sección 3.2.3). Nuestro juguete tiene dos cabezas de $d_h=4$ números por bloque; la tabla de la escena es una cabeza del segundo bloque.

**El experimento.** Entrenamos dos modelos idénticos (misma semilla, mismos datos, 4 000 pasos) y a uno le quitamos la máscara. Con frases nuevas, el modelo con máscara tiene una pérdida de 0.527 nats por palabra, casi la entropía de la gramática (0.526, el mínimo posible). El modelo sin máscara baja su pérdida de entrenamiento a 0.059 copiando, pero usado como se usa al escribir (con máscara, sin futuro) da 3.088, peor que repartir por igual entre doce palabras: $\\ln 12 = 2.485$.

## La red de cada bloque

$\\mathrm{MLP}(x)=W_2\\,\\mathrm{GELU}(W_1x+b_1)+b_2$, con $W_1$ de $d\\times 4d$ y $W_2$ de $4d\\times d$, la misma para todas las posiciones del bloque («aplicada a cada posición por separado y de forma idéntica», sección 3.3 del artículo). El artículo original usaba ReLU; GPT-1 y GPT-2 usan GELU (Hendrycks y Gimpel, 2016), una ReLU suave: $\\mathrm{GELU}(x)=x\\,\\Phi(x)$, con $\\Phi$ la distribución normal acumulada.

## Normalización de capa

Sobre los $d$ números de una lista (Ba, Kiros y Hinton, 2016):

$$\\mathrm{LN}(x)=\\gamma\\odot\\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta,\\qquad \\mu=\\tfrac1d\\sum_j x_j,\\quad \\sigma^2=\\tfrac1d\\sum_j (x_j-\\mu)^2$$

$\\gamma$ y $\\beta$ son los «dos ajustes que también se aprenden» (ganancia y sesgo, $2d$ parámetros por normalización). El artículo de 2017 normalizaba **después** de sumar, $\\mathrm{LN}(x+\\mathrm{Subcapa}(x))$; GPT-2 la movió a la entrada de cada parte y añadió una más tras el último bloque. Xiong y colegas (2020) muestran que, con la normalización previa, los gradientes están bien comportados desde el inicio y se puede entrenar sin la fase de calentamiento de la tasa de aprendizaje. En la escena, la lista de «come» al entrar al segundo bloque tiene promedio 1.10 y desviación estándar 0.78.

## Codificación de posición

La del artículo de 2017 (sección 3.5), con $pos$ el lugar e $i$ el índice del par de números:

$$\\mathrm{PE}_{pos,2i}=\\sin\\!\\big(pos/10000^{2i/d}\\big)\\qquad \\mathrm{PE}_{pos,2i+1}=\\cos\\!\\big(pos/10000^{2i/d}\\big)$$

Las longitudes de onda van de $2\\pi$ a $10000\\cdot2\\pi$. Los autores probaron también posiciones aprendidas y obtuvieron resultados casi idénticos; GPT-1 aprende las suyas. «La atención sola no sabe el orden» es exacto para la atención sin máscara: si se permutan los tokens, sus salidas se permutan igual. Con máscara causal la cosa es más sutil: Haviv y colegas (2022) muestran que un modelo de lenguaje causal sin codificación de posición aprende una noción implícita de posición, gracias a la propia máscara. Aun así, casi todos los modelos usan alguna. En la escena, el cálculo «sin posición» usa una cabeza real de nuestro modelo sobre los embeddings solos y sin máscara.

## Contar parámetros

Con $V$ palabras, $d$ números por lista, $L$ bloques, $ctx$ posiciones aprendidas y una red de $d\\to4d\\to d$:

| Parte | Parámetros | Juguete ($V{=}12$, $d{=}8$, $L{=}2$) |
|---|---|---|
| Embeddings (y posiciones aprendidas) | $V d + ctx\\,d$ | 96 (posición con ondas: 0) |
| Atención | $L\\,(4d^2+4d)$ | 576 |
| Red | $L\\,(8d^2+5d)$ | 1 104 |
| Normalizaciones | $(4L+2)\\,d$ | 80 |
| **Total** | $\\approx 12\\,L\\,d^2$ si $d$ es grande | **1 856** |

La aproximación $N\\approx 12\\,L\\,d^2$ es la de Kaplan y colegas (2020, ecuación 2.1), sin contar embeddings. Con el vocabulario de GPT-2 (50 257) y $ctx=2048$, la tabla da 125 226 240 para 12 bloques con $d=768$ y 174 604 259 328 para 96 bloques con $d=12\\,288$; el artículo de GPT-3 (tabla 2.1) lista 125 millones para «GPT-3 Small» y 175.0 mil millones para GPT-3. El reparto por partes de la escena es nuestro cálculo con esta tabla. Para GPT-2 pequeño (contexto 1 024) da 124 439 808, lo mismo que cuenta la biblioteca Hugging Face Transformers (comprobado en \`train_tiny.py\`); el artículo de GPT-2 decía 117 millones.

## En código

\`\`\`python
import numpy as np

def softmax(z):
    e = np.exp(z - z.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)

def causal_attention(Q, K, V):
    T, d = Q.shape
    scores = Q @ K.T / np.sqrt(d)
    scores[np.triu_indices(T, k=1)] = -np.inf      # máscara causal: nada de mirar al futuro
    w = softmax(scores)
    return w, w @ V

def layer_norm(x, g, b, eps=1e-5):
    return g * (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps) + b

def n_params(d, L, V, ctx, ff=None):
    ff = ff or 4 * d
    return V*d + ctx*d + L*(4*d*d + 4*d) + L*(2*d*ff + ff + d) + (4*L + 2)*d

rng = np.random.default_rng(0)
Q = K = V = rng.normal(size=(3, 4))
w, out = causal_attention(Q, K, V)
print(np.round(w, 2))
x = rng.normal(2.0, 3.0, size=8)
y = layer_norm(x, np.ones(8), np.zeros(8))
print(round(y.mean(), 3), round(y.std(), 3))
print(n_params(8, 2, 12, 0), n_params(12288, 96, 50257, 2048))
# [[1.   0.   0.  ]
#  [0.25 0.75 0.  ]
#  [0.17 0.13 0.7 ]]
# 0.0 1.0
# 1856 174604259328
\`\`\`

El modelo de la lección está completo en \`model.ts\` y se entrena con \`train_tiny.py\` (PyTorch, en CPU, menos de un minuto): ambos viven junto a esta lección, y \`verify-forward.mts\` comprueba que el pase en TypeScript coincide con PyTorch (diferencia máxima de 7·10⁻⁶).

## Lo que viene

Un modelo con esta arquitectura empieza con parámetros al azar. La lección 23 muestra qué aprende al entrenarlo para predecir la siguiente palabra con texto a escala de internet, y la 24, cuánto cuesta. Cómo se sirve (la caché KV, que evita recalcular los tokens anteriores) llega en la lección 26.`,

    en: `## The full pass, equation by equation

For a sequence of $T$ tokens with numbers $t_1,\\dots,t_T$, an embedding table $E$ (one row of $d$ numbers per vocabulary word), and $L$ blocks, in GPT-2’s “pre-normalization” variant, which is the one our toy uses ($d=8$, $L=2$):

$$x_i \\leftarrow E[t_i] + \\mathrm{PE}_i$$

and, in each block, with $\\mathrm{LN}$ the layer normalization:

$$x \\leftarrow x + \\mathrm{Attention}\\big(\\mathrm{LN}_1(x)\\big) \\qquad x \\leftarrow x + \\mathrm{MLP}\\big(\\mathrm{LN}_2(x)\\big)$$

Those two sums are the residual connections: each part adds its contribution to $x$. At the exit of the last block, the last token’s list gives the scores (*logits*) and softmax the probabilities:

$$z = \\mathrm{LN}_f(x_T)\\,E^\\top \\qquad p = \\mathrm{softmax}(z)$$

“Comparing with every vocabulary word” is exactly this: a dot product with each row of $E$, **the same** table as at the input. Reusing it saves $V\\cdot d$ parameters; the 2017 paper already did it (section 3.4), and the technique is studied in Press and Wolf (2017). In training all $T$ positions are used at once: each one predicts the next token.

## Masked attention

With $Q$, $K$, and $V$ as in lesson 21 and the mask $M_{ij}=0$ if $j\\le i$ and $-\\infty$ if $j>i$:

$$\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}\\!\\Big(\\frac{QK^\\top}{\\sqrt{d_h}}+M\\Big)V$$

Since $e^{-\\infty}=0$, the future gets zero weight. That is how the original paper describes the decoder: every softmax input that corresponds to an “illegal” connection is set to $-\\infty$ to preserve the auto-regressive property (section 3.2.3). Our toy has two heads of $d_h=4$ numbers per block; the table in the scene is one head of the second block.

**The experiment.** We trained two identical models (same seed, same data, 4,000 steps) and removed the mask from one. On new sentences, the masked model has a loss of 0.527 nats per word, almost the grammar’s entropy (0.526, the lowest possible). The unmasked model drives its training loss down to 0.059 by copying, but used the way it is used when writing (masked, with no future) it scores 3.088, worse than spreading evenly over twelve words: $\\ln 12 = 2.485$.

## Each block’s network

$\\mathrm{MLP}(x)=W_2\\,\\mathrm{GELU}(W_1x+b_1)+b_2$, with $W_1$ of $d\\times 4d$ and $W_2$ of $4d\\times d$, the same for every position in the block (“applied to each position separately and identically,” section 3.3 of the paper). The original paper used ReLU; GPT-1 and GPT-2 use GELU (Hendrycks and Gimpel, 2016), a smooth ReLU: $\\mathrm{GELU}(x)=x\\,\\Phi(x)$, with $\\Phi$ the normal cumulative distribution.

## Layer normalization

Over the $d$ numbers of a list (Ba, Kiros, and Hinton, 2016):

$$\\mathrm{LN}(x)=\\gamma\\odot\\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta,\\qquad \\mu=\\tfrac1d\\sum_j x_j,\\quad \\sigma^2=\\tfrac1d\\sum_j (x_j-\\mu)^2$$

$\\gamma$ and $\\beta$ are the “two adjustments that are also learned” (gain and bias, $2d$ parameters per normalization). The 2017 paper normalized **after** adding, $\\mathrm{LN}(x+\\mathrm{Sublayer}(x))$; GPT-2 moved it to the input of each part and added one more after the last block. Xiong and colleagues (2020) show that with pre-normalization the gradients are well behaved from the start, so the learning-rate warm-up stage can be dropped. In the scene, the list for “eats” entering the second block has an average of 1.10 and a standard deviation of 0.78.

## Positional encoding

The 2017 paper’s (section 3.5), with $pos$ the place and $i$ the index of the pair of numbers:

$$\\mathrm{PE}_{pos,2i}=\\sin\\!\\big(pos/10000^{2i/d}\\big)\\qquad \\mathrm{PE}_{pos,2i+1}=\\cos\\!\\big(pos/10000^{2i/d}\\big)$$

The wavelengths run from $2\\pi$ to $10000\\cdot2\\pi$. The authors also tried learned positions and got nearly identical results; GPT-1 learns its own. “Attention alone does not know order” is exact for unmasked attention: if the tokens are permuted, their outputs are permuted the same way. With a causal mask it is subtler: Haviv and colleagues (2022) show that a causal language model without positional encoding learns an implicit notion of position, thanks to the mask itself. Even so, almost every model uses one. In the scene, the “no position” calculation uses a real head of our model on the embeddings alone, without the mask.

## Counting parameters

With $V$ words, $d$ numbers per list, $L$ blocks, $ctx$ learned positions, and a $d\\to4d\\to d$ network:

| Part | Parameters | Toy ($V{=}12$, $d{=}8$, $L{=}2$) |
|---|---|---|
| Embeddings (and learned positions) | $V d + ctx\\,d$ | 96 (wave positions: 0) |
| Attention | $L\\,(4d^2+4d)$ | 576 |
| Network | $L\\,(8d^2+5d)$ | 1,104 |
| Normalizations | $(4L+2)\\,d$ | 80 |
| **Total** | $\\approx 12\\,L\\,d^2$ when $d$ is large | **1,856** |

The approximation $N\\approx 12\\,L\\,d^2$ is Kaplan and colleagues’ (2020, equation 2.1), not counting embeddings. With GPT-2’s vocabulary (50,257) and $ctx=2048$, the table gives 125,226,240 for 12 blocks with $d=768$ and 174,604,259,328 for 96 blocks with $d=12{,}288$; the GPT-3 paper (table 2.1) lists 125 million for “GPT-3 Small” and 175.0 billion for GPT-3. The split by parts in the scene is our calculation with this table. For the smallest GPT-2 (context 1,024) it gives 124,439,808, the same count as the Hugging Face Transformers library (checked in \`train_tiny.py\`); the GPT-2 paper said 117 million.

## In code

\`\`\`python
import numpy as np

def softmax(z):
    e = np.exp(z - z.max(-1, keepdims=True))
    return e / e.sum(-1, keepdims=True)

def causal_attention(Q, K, V):
    T, d = Q.shape
    scores = Q @ K.T / np.sqrt(d)
    scores[np.triu_indices(T, k=1)] = -np.inf      # causal mask: no peeking at the future
    w = softmax(scores)
    return w, w @ V

def layer_norm(x, g, b, eps=1e-5):
    return g * (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + eps) + b

def n_params(d, L, V, ctx, ff=None):
    ff = ff or 4 * d
    return V*d + ctx*d + L*(4*d*d + 4*d) + L*(2*d*ff + ff + d) + (4*L + 2)*d

rng = np.random.default_rng(0)
Q = K = V = rng.normal(size=(3, 4))
w, out = causal_attention(Q, K, V)
print(np.round(w, 2))
x = rng.normal(2.0, 3.0, size=8)
y = layer_norm(x, np.ones(8), np.zeros(8))
print(round(y.mean(), 3), round(y.std(), 3))
print(n_params(8, 2, 12, 0), n_params(12288, 96, 50257, 2048))
# [[1.   0.   0.  ]
#  [0.25 0.75 0.  ]
#  [0.17 0.13 0.7 ]]
# 0.0 1.0
# 1856 174604259328
\`\`\`

The lesson’s model is complete in \`model.ts\` and is trained with \`train_tiny.py\` (PyTorch, on CPU, under a minute): both live next to this lesson, and \`verify-forward.mts\` checks that the TypeScript pass matches PyTorch (maximum difference 7·10⁻⁶).

## What comes next

A model with this architecture starts with random parameters. Lesson 23 shows what it learns when trained to predict the next word on internet-scale text, and lesson 24 what that costs. How it is served (the KV cache, which avoids recomputing the earlier tokens) arrives in lesson 26.`,
  },

  lens: {
    es: [
      'Casi todos los modelos de lenguaje de uso general comparten este esqueleto. Decir «usamos un transformer» casi no informa: pregunta por el tamaño (número de bloques y largo de las listas), por cuánto texto puede leer de una vez y por los datos con que se entrenó.',
      'El tamaño crece con el cuadrado del largo de las listas y con el número de bloques: duplicar el largo cuadruplica los parámetros de cada bloque. Compara los dos números, no solo el total.',
      'Cada token que el modelo escribe exige un pase por todos los bloques. Las respuestas largas cuestan más tiempo y dinero, y un modelo más profundo tarda más por token.',
      'Hay modelos que escriben (solo decodificador, como GPT) y modelos que solo leen (solo codificador, como BERT). Para clasificar o buscar documentos no siempre hace falta uno que escriba: puede ser más barato y más fácil de evaluar.',
    ],
    en: [
      'Almost all general-purpose language models share this skeleton. Saying “we use a transformer” tells you very little: ask about size (number of blocks and length of the lists), how much text it can read at once, and the data it was trained on.',
      'Size grows with the square of the list length and with the number of blocks: doubling the length quadruples each block’s parameters. Compare both numbers, not just the total.',
      'Every token the model writes requires a pass through all the blocks. Long answers cost more time and money, and a deeper model takes longer per token.',
      'There are models that write (decoder-only, like GPT) and models that only read (encoder-only, like BERT). To classify or search documents you do not always need one that writes: it can be cheaper and easier to evaluate.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Para qué sirve la máscara causal en un transformer que escribe texto?', en: 'What is the causal mask for in a transformer that writes text?' },
      options: [
        { es: 'Para que el modelo ignore las palabras poco frecuentes.', en: 'So the model ignores infrequent words.' },
        { es: 'Para reducir la cantidad de parámetros del modelo.', en: 'To reduce the number of parameters in the model.' },
        { es: 'Para que cada token solo mire a los anteriores y no pueda copiar la respuesta al entrenar.', en: 'So each token only looks at the earlier ones and cannot copy the answer during training.' },
        { es: 'Para que el modelo conozca el orden de las palabras.', en: 'So the model knows the order of the words.' },
      ],
      answer: 2,
      why: { es: 'Sin la máscara, el token que debe adivinar lo que sigue puede mirarlo directamente. En nuestro experimento, el modelo sin máscara bajó su error de entrenamiento a cero punto cero seis, pero al escribir de verdad fue peor que adivinar al azar. El orden lo da la codificación de posición, no la máscara.', en: 'Without the mask, the token that must guess what comes next can look straight at it. In our experiment, the unmasked model brought its training error down to zero point zero six, but when it really wrote it was worse than guessing at random. Order comes from the positional encoding, not the mask.' },
    },
    {
      kind: 'concept',
      q: { es: 'En un bloque, ¿qué parte procesa cada token por separado, sin mirar a los demás?', en: 'In a block, which part processes each token separately, without looking at the others?' },
      options: [
        { es: 'La red (de ocho a treinta y dos números y de vuelta).', en: 'The network (from eight to thirty-two numbers and back).' },
        { es: 'La atención.', en: 'Attention.' },
        { es: 'La máscara causal.', en: 'The causal mask.' },
        { es: 'La conexión residual.', en: 'The residual connection.' },
      ],
      answer: 0,
      why: { es: 'La red se aplica igual a cada token, por separado. La atención es el único camino entre tokens: al apagarla en nuestro modelo, el gato, el perro y el loro recibieron exactamente la misma predicción.', en: 'The network is applied the same way to each token, separately. Attention is the only path between tokens: when we switched it off in our model, the cat, the dog, and the parrot got exactly the same prediction.' },
    },
    {
      kind: 'calc',
      q: { es: 'En un bloque con listas de diez números, la atención tiene cuatro tablas de diez por diez (consultas, claves, valores y salida). Sin contar los sesgos, ¿cuántos parámetros suman esas tablas?', en: 'In a block with lists of ten numbers, attention has four ten-by-ten tables (queries, keys, values, and output). Not counting biases, how many parameters do those tables add up to?' },
      options: [
        { es: '40', en: '40' },
        { es: '100', en: '100' },
        { es: '1 000', en: '1,000' },
        { es: '400', en: '400' },
      ],
      answer: 3,
      why: { es: 'Cada tabla de diez por diez tiene cien números, y son cuatro: 4 × 100 = 400. Es la misma cuenta que en el juguete: cuatro tablas de ocho por ocho, 4 × 64 = 256.', en: 'Each ten-by-ten table has one hundred numbers, and there are four: 4 × 100 = 400. It is the same count as in the toy: four eight-by-eight tables, 4 × 64 = 256.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo arma un modelo con atención sin máscara para clasificar reseñas y, por error, olvida la codificación de posición. ¿Qué problema es de esperar?', en: 'A team builds a model with unmasked attention to classify reviews and, by mistake, leaves out the positional encoding. What problem should they expect?' },
      options: [
        { es: 'El modelo tendrá el doble de parámetros.', en: 'The model will have twice as many parameters.' },
        { es: 'No podrá distinguir dos reseñas con las mismas palabras en distinto orden, como «no es bueno, es malo» y «no es malo, es bueno».', en: 'It will not be able to tell apart two reviews with the same words in a different order, like “it’s not good, it’s bad” and “it’s not bad, it’s good.”' },
        { es: 'Copiará la respuesta mirando el futuro.', en: 'It will copy the answer by looking at the future.' },
        { es: 'Ya no podrá usar softmax.', en: 'It will no longer be able to use softmax.' },
      ],
      answer: 1,
      why: { es: 'La atención sin máscara no sabe el orden: si barajas los tokens, cada uno mira a los mismos con los mismos pesos. Esas dos reseñas tienen exactamente las mismas palabras; sin posición, el modelo las ve como el mismo montón.', en: 'Unmasked attention does not know order: if you shuffle the tokens, each one looks at the same ones with the same weights. Those two reviews have exactly the same words; without position, the model sees them as the same pile.' },
    },
  ],

  glossary: ['token', 'vocabulary', 'embedding', 'language-model', 'autoregression', 'softmax', 'attention', 'query-key-value', 'self-attention', 'multi-head-attention', 'layer', 'relu', 'nonlinearity', 'forward-pass', 'residual-connection', 'parameter', 'weight', 'bias', 'loss'],

  terms: [
    { id: 'transformer', term: { es: 'Transformer', en: 'Transformer' }, def: { es: 'Arquitectura de red neuronal formada por una pila de bloques con la misma forma. Cada bloque combina atención (entre tokens) y una red aplicada a cada token, con conexiones residuales y normalización. Se presentó en «Attention Is All You Need» (2017).', en: 'A neural-network architecture made of a stack of blocks with the same shape. Each block combines attention (between tokens) and a network applied to each token, with residual connections and normalization. It was introduced in “Attention Is All You Need” (2017).' } },
    { id: 'positional-encoding', term: { es: 'Codificación de posición', en: 'Positional encoding' }, def: { es: 'Lista de números propia de cada lugar del texto que se suma al embedding de cada token para que el modelo sepa en qué orden están. En el artículo original sale de ondas de distintas frecuencias; GPT la aprende al entrenar, y otros modelos usan variantes.', en: 'A list of numbers specific to each place in the text, added to each token’s embedding so the model knows their order. In the original paper it comes from waves of different frequencies; GPT learns it in training, and other models use variants.' } },
    { id: 'causal-mask', term: { es: 'Máscara causal', en: 'Causal mask' }, def: { es: 'En la atención, cambia por menos infinito las puntuaciones hacia tokens futuros antes de softmax, que entonces les da peso cero. Así cada token solo mira a los anteriores y a sí mismo, y el modelo no puede copiar la respuesta al entrenar.', en: 'In attention, it replaces the scores toward future tokens with minus infinity before softmax, which then gives them zero weight. Each token then looks only at earlier tokens and itself, and the model cannot copy the answer during training.' } },
    { id: 'layer-norm', term: { es: 'Normalización de capa', en: 'Layer normalization' }, def: { es: 'A la lista de números de un token le resta su promedio y la divide entre su desviación estándar; después aplica dos ajustes aprendidos (ganancia y sesgo). Mantiene estable la escala de los números al apilar muchos bloques.', en: 'Subtracts the average from a token’s list of numbers and divides it by its standard deviation, then applies two learned adjustments (gain and bias). It keeps the scale of the numbers stable when many blocks are stacked.' } },
    { id: 'decoder-only', term: { es: 'Solo decodificador', en: 'Decoder-only' }, def: { es: 'Transformer formado solo por bloques con máscara causal que predicen el token siguiente, sin la mitad codificadora del artículo original. Es la arquitectura de la familia GPT.', en: 'A transformer made only of blocks with a causal mask that predict the next token, without the original paper’s encoder half. It is the architecture of the GPT family.' } },
  ],

  sources: [
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., Polosukhin, I.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'Improving Language Understanding by Generative Pre-Training (GPT-1)', authors: 'Radford, A., Narasimhan, K., Salimans, T., Sutskever, I.', year: 2018, url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., Mann, B., Ryder, N., Subbiah, M., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Scaling Laws for Neural Language Models', authors: 'Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'Layer Normalization', authors: 'Ba, J. L., Kiros, J. R., Hinton, G. E.', year: 2016, url: 'https://arxiv.org/abs/1607.06450' },
    { title: 'Deep Residual Learning for Image Recognition', authors: 'He, K., Zhang, X., Ren, S., Sun, J.', year: 2015, url: 'https://arxiv.org/abs/1512.03385' },
    { title: 'On Layer Normalization in the Transformer Architecture', authors: 'Xiong, R., Yang, Y., He, D., Zheng, K., et al.', year: 2020, url: 'https://arxiv.org/abs/2002.04745' },
    { title: 'Gaussian Error Linear Units (GELUs)', authors: 'Hendrycks, D., Gimpel, K.', year: 2016, url: 'https://arxiv.org/abs/1606.08415' },
    { title: 'Using the Output Embedding to Improve Language Models', authors: 'Press, O., Wolf, L.', year: 2017, url: 'https://arxiv.org/abs/1608.05859' },
    { title: 'Transformer Language Models without Positional Encodings Still Learn Positional Information', authors: 'Haviv, A., Ram, O., Press, O., Izsak, P., Levy, O.', year: 2022, url: 'https://arxiv.org/abs/2203.16634' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., Martin, L., Stone, K., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: 'Devlin, J., Chang, M.-W., Lee, K., Toutanova, K.', year: 2018, url: 'https://arxiv.org/abs/1810.04805' },
  ],
});
