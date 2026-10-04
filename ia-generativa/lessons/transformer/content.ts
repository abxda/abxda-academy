import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'transformer',

  objectives: {
    es: [
      'Explicar, bloque por bloque, cómo un transformer convierte un texto en probabilidades para la siguiente palabra: embeddings, posición, atención con máscara, red, atajos y normalización.',
      'Predecir qué cambia si se quita la máscara causal o la atención, a partir de los experimentos con un transformer diminuto real.',
      'Calcular cuántos parámetros tiene cada parte de un transformer y estimar su tamaño con 12 · bloques · d².',
    ],
    en: [
      'Explain, block by block, how a transformer turns a text into probabilities for the next word: embeddings, position, masked attention, network, shortcuts, and normalization.',
      'Predict what changes if the causal mask or attention is removed, based on experiments with a real tiny transformer.',
      'Compute how many parameters each part of a transformer has and estimate its size with 12 · blocks · d².',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Ya tienes las piezas: tokens, embeddings y atención. Hoy las armamos en el montaje que hay dentro de GPT y de Llama, el transformer, y lo hacemos funcionar con un modelo diminuto, pero real.',
      en: 'You already have the pieces: tokens, embeddings, and attention. Today we assemble them into the machine inside GPT and Llama, the transformer, and we run it with a tiny but real model.',
    },
    {
      id: 'toy',
      es: 'Para ver cada número usaremos un transformer diminuto que entrenamos para esta lección. Su mundo tiene doce palabras y una gramática inventada: un sujeto, un verbo y un objeto.',
      en: 'To see every number we will use a tiny transformer that we trained for this lesson. Its world has twelve words and an invented grammar: a subject, a verb, and an object.',
    },
    {
      id: 'toy-size',
      es: 'Es la misma arquitectura que GPT, a escala de juguete: ocho números por palabra, dos bloques y mil ochocientos cincuenta y seis parámetros. GPT-3 tiene ciento setenta y cinco mil millones.',
      en: 'It is the same architecture as GPT, at toy scale: eight numbers per word, two blocks, and one thousand eight hundred fifty-six parameters. GPT-3 has one hundred seventy-five billion.',
      tts: {
        es: 'Es la misma arquitectura que GPT, a escala de juguete: ocho números por palabra, dos bloques y mil ochocientos cincuenta y seis parámetros. Ge pe te tres tiene ciento setenta y cinco mil millones.',
        en: 'It is the same architecture as GPT, at toy scale: eight numbers per word, two blocks, and one thousand eight hundred fifty-six parameters. G P T three has one hundred seventy-five billion.',
      },
    },
    {
      id: 'tokens-in',
      es: 'El texto entra como tokens. «El gato bebe» son tres, y cada uno es solo un número de identificación: un lugar en el vocabulario de doce palabras.',
      en: 'Text enters as tokens. “The cat drinks” is three, and each one is just an identification number: a slot in the vocabulary of twelve words.',
    },
    {
      id: 'embed',
      es: 'Cada identificación busca su fila en la tabla de embeddings, la de la lección catorce, y se convierte en un vector: aquí, ocho números por palabra, aprendidos en el entrenamiento.',
      en: 'Each ID looks up its row in the embedding table, the one from lesson fourteen, and becomes a vector: here, eight numbers per word, learned in training.',
    },
    {
      id: 'pos-why',
      es: 'Pero ese vector no dice dónde está la palabra. Para la atención, «el gato bebe» y «bebe gato el» son el mismo montón de vectores. Hay que inyectar el orden.',
      en: 'But that vector does not say where the word sits. To attention, “the cat drinks” and “drinks cat the” are the same pile of vectors. We have to inject the order.',
    },
    {
      id: 'pos',
      es: 'La solución del artículo de 2017: a cada posición, un patrón fijo de senos y cosenos de distintas frecuencias. Es el codificador de posición: un vector distinto por cada lugar.',
      en: 'The solution from the 2017 paper: each position gets a fixed pattern of sines and cosines at different frequencies. That is the positional encoding: a different vector for every place.',
      tts: {
        es: 'La solución del artículo de dos mil diecisiete: a cada posición, un patrón fijo de senos y cosenos de distintas frecuencias. Es el codificador de posición: un vector distinto por cada lugar.',
        en: 'The solution from the twenty seventeen paper: each position gets a fixed pattern of sines and cosines at different frequencies. That is the positional encoding: a different vector for every place.',
      },
      note: { es: 'Codificador de posición: un patrón fijo por lugar, sumado al embedding.', en: 'Positional encoding: a fixed pattern per place, added to the embedding.' },
    },
    {
      id: 'pos-add',
      es: 'Se suma al embedding, número a número. Ahora cada vector dice a la vez qué palabra es y en qué lugar está, y esa suma es lo que entra al primer bloque.',
      en: 'It is added to the embedding, number by number. Now each vector says both which word it is and where it sits, and that sum is what enters the first block.',
      pad: 0.4,
    },
    {
      id: 'block',
      es: 'Esa entrada atraviesa una pila de bloques iguales en forma: eso es un transformer. Cada bloque tiene dos partes: la atención, donde las palabras se miran, y una red, donde cada una se procesa sola.',
      en: 'That input goes through a stack of identically shaped blocks: that is a transformer. Each block has two parts: attention, where words look at each other, and a network, where each is processed alone.',
      note: { es: 'Transformer: una pila de bloques; cada bloque = atención + red.', en: 'Transformer: a stack of blocks; each block = attention + network.' },
    },
    {
      id: 'attn',
      es: 'Primero, la atención de la lección anterior, ahora con pesos aprendidos. Cada palabra compara su consulta con las claves de todas, y sale una tabla de puntuaciones.',
      en: 'First, the attention from the previous lesson, now with learned weights. Each word compares its query with the keys of all words, and a table of scores comes out.',
      pad: 0.3,
    },
    {
      id: 'mask-why',
      es: 'Pero este modelo escribe, y al predecir una palabra la siguiente aún no existe. En el entrenamiento el texto completo sí está a la vista, y copiar la respuesta sería trampa.',
      en: 'But this model writes, and when it predicts a word the next one does not exist yet. In training the full text is in view, and copying the answer would be cheating.',
      pad: 0.3,
    },
    {
      id: 'mask',
      es: 'La máscara causal evita la trampa: antes de softmax, la puntuación hacia cualquier palabra futura se cambia por menos infinito, y softmax le da peso cero.',
      en: 'The causal mask prevents the cheat: before softmax, the score toward any future word is replaced by minus infinity, and softmax gives it weight zero.',
      note: { es: 'Máscara causal: cada palabra solo mira hacia atrás (−∞ antes de softmax).', en: 'Causal mask: each word only looks backward (−∞ before softmax).' },
      pad: 0.5,
    },
    {
      id: 'mask-train',
      es: 'Lo comprobamos: entrenamos dos modelos idénticos, uno sin máscara. Sin ella la pérdida cae casi a cero, pero en uso real ese modelo es peor que adivinar al azar.',
      en: 'We tested it: we trained two identical models, one without the mask. Without it the loss falls almost to zero, but in real use that model is worse than guessing at random.',
      pad: 0.8,
    },
    {
      id: 'try-mask',
      es: 'Tu turno: apaga la máscara al entrenar y observa a qué mira ahora cada palabra, y qué pasa con la pérdida.',
      en: 'Your turn: turn the mask off during training and see what each word looks at now, and what happens to the loss.',
      gate: {
        id: 'mask',
        prompt: { es: 'Apaga la máscara y observa la tabla y la pérdida unos segundos.', en: 'Turn the mask off and watch the table and the loss for a few seconds.' },
      },
      pad: 0.4,
    },
    {
      id: 'mlp',
      es: 'La segunda parte es una red de dos capas, aplicada a cada palabra por separado: de ocho números a treinta y dos, una activación parecida a la ReLU, y de vuelta a ocho.',
      en: 'The second part is a two-layer network applied to each word separately: from eight numbers to thirty-two, an activation like the ReLU, and back to eight.',
      pad: 0.3,
    },
    {
      id: 'residual',
      es: 'Primer truco: los atajos de la lección trece. Cada parte no reemplaza el vector, le suma su aporte; si no aporta nada, el vector pasa intacto y la señal atraviesa muchos bloques.',
      en: 'First trick: the shortcuts from lesson thirteen. Each part does not replace the vector, it adds its contribution; if it adds nothing the vector passes intact, and the signal survives many blocks.',
      note: { es: 'Atajos: cada parte suma su aporte al vector, no lo reemplaza.', en: 'Shortcuts: each part adds its contribution to the vector instead of replacing it.' },
      pad: 0.3,
    },
    {
      id: 'layernorm',
      es: 'Segundo truco: la normalización de capa. Antes de cada parte, cada vector se recentra en cero y se reescala a desviación uno, para que la escala no se dispare; luego una ganancia y un sesgo aprendidos lo ajustan.',
      en: 'Second trick: layer normalization. Before each part, every vector is recentered at zero and rescaled to standard deviation one, so the scale does not blow up; then a learned gain and bias adjust it.',
      note: { es: 'Normalización de capa: recentra y reescala cada vector antes de cada parte.', en: 'Layer norm: recenters and rescales each vector before each part.' },
      pad: 0.3,
    },
    {
      id: 'block-full',
      es: 'Montado: normalizar, atender, sumar; normalizar, procesar, sumar. Mira cómo cambia el vector de «bebe» en cada estación: cada parte le añade algo y ninguna lo borra.',
      en: 'All together: normalize, attend, add; normalize, process, add. Watch how the vector for “drinks” changes at each station: each part adds something and none erases it.',
      pad: 0.8,
    },
    {
      id: 'stack',
      es: 'Un bloque es una ronda de leer y de pensar. El modelo apila varios, cada uno con sus propios pesos: dos aquí, doce en el GPT-2 más pequeño, noventa y seis en GPT-3.',
      en: 'One block is a round of reading and thinking. The model stacks several, each with its own weights: two here, twelve in the smallest GPT-2, ninety-six in GPT-3.',
      tts: {
        es: 'Un bloque es una ronda de leer y de pensar. El modelo apila varios, cada uno con sus propios pesos: dos aquí, doce en el Ge pe te dos más pequeño, noventa y seis en Ge pe te tres.',
        en: 'One block is a round of reading and thinking. The model stacks several, each with its own weights: two here, twelve in the smallest G P T two, ninety-six in G P T three.',
      },
      pad: 0.3,
    },
    {
      id: 'heads-real',
      es: 'Cada cabeza dibuja su propio patrón. Estas son las cuatro de nuestro modelo con «el gato bebe»; el aro marca adónde mira «bebe». Nadie escribió esas reglas: salieron del entrenamiento.',
      en: 'Each head draws its own pattern. These are the four in our model reading “the cat drinks”; the ring marks where “drinks” looks. Nobody wrote those rules: they came out of training.',
      pad: 0.3,
    },
    {
      id: 'logits',
      es: 'Para predecir, solo importa el vector de la última palabra. Se normaliza y se compara con el embedding de cada palabra: doce productos punto, doce puntuaciones, los logits.',
      en: 'To predict, only the vector of the last word matters. It is normalized and compared with the embedding of every word: twelve dot products, twelve scores, the logits.',
      note: { es: 'Logits: una puntuación por palabra del vocabulario; softmax las vuelve probabilidades.', en: 'Logits: one score per vocabulary word; softmax turns them into probabilities.' },
      pad: 0.3,
    },
    {
      id: 'softmax-out',
      es: 'Softmax las vuelve probabilidades: «leche», setenta por ciento; «agua», treinta. Es justo lo que decía la gramática, y el modelo lo aprendió de ejemplos, no de reglas.',
      en: 'Softmax turns them into probabilities: “milk,” seventy percent; “water,” thirty. That is exactly what the grammar said, and the model learned it from examples, not rules.',
      pad: 0.4,
    },
    {
      id: 'loop',
      es: 'Se elige una palabra, se agrega al texto y el montaje corre otra vez. Así sale «el gato bebe leche.»: un pase por cada palabra nueva.',
      en: 'A word is chosen, appended to the text, and the machine runs again. That is how “the cat drinks milk.” comes out: one pass for every new word.',
      pad: 0.6,
    },
    {
      id: 'try1',
      es: 'Tu turno: elige un sujeto y un verbo y mira la predicción. Luego apaga la atención del modelo ya entrenado y compara dos sujetos con el mismo verbo.',
      en: 'Your turn: pick a subject and a verb and look at the prediction. Then switch off attention in the trained model and compare two subjects with the same verb.',
      gate: {
        id: 'attn',
        prompt: { es: 'Apaga la atención y prueba dos sujetos distintos con el mismo verbo.', en: 'Switch attention off and try two different subjects with the same verb.' },
      },
      pad: 0.4,
    },
    {
      id: 'try1-why',
      es: 'Sin atención, «come» recibe la misma predicción sea quien sea el sujeto: la red procesa cada palabra por separado y no puede ver quién come. La atención es el único canal entre palabras.',
      en: 'Without attention, “eats” gets the same prediction whoever the subject is: the network processes each word separately and cannot see who is eating. Attention is the only channel between words.',
      pad: 0.4,
    },
    {
      id: 'decoder-only',
      es: 'El artículo original tenía dos mitades, un codificador y un decodificador, para traducir. Los GPT conservan solo el decodificador, con máscara causal: son modelos solo decodificador. BERT es la otra mitad.',
      en: 'The original paper had two halves, an encoder and a decoder, for translation. The GPTs keep only the decoder, with a causal mask: decoder-only models. BERT is the other half.',
      note: { es: 'Solo decodificador: bloques con máscara causal que escriben hacia delante.', en: 'Decoder-only: blocks with a causal mask that write forward.' },
      pad: 0.4,
    },
    {
      id: 'params-intro',
      es: '¿De dónde salen los parámetros? De contar las matrices de cada parte: noventa y seis en el embedding, quinientos setenta y seis en la atención, mil ciento cuatro en las redes y ochenta en las normalizaciones.',
      en: 'Where do the parameters come from? From counting the matrices in each part: ninety-six in the embedding, five hundred seventy-six in attention, one thousand one hundred four in the networks, and eighty in the normalizations.',
      pad: 0.3,
    },
    {
      id: 'params-formula',
      es: 'En cada bloque, la atención tiene cuatro matrices de d por d y la red, dos de d por cuatro d: doce d cuadrado en total. Por eso, al duplicar d, los parámetros se cuadruplican.',
      en: 'In each block, attention has four d-by-d matrices and the network has two of d by four d: twelve d squared in all. So when you double d, the parameters quadruple.',
      tts: {
        es: 'En cada bloque, la atención tiene cuatro matrices de dé por dé y la red, dos de dé por cuatro dé: doce dé cuadrado en total. Por eso, al duplicar dé, los parámetros se cuadruplican.',
        en: 'In each block, attention has four d-by-d matrices and the network has two of d by four d: twelve d squared in all. So when you double d, the parameters quadruple.',
      },
      note: { es: 'Parámetros ≈ 12 · bloques · d².', en: 'Parameters ≈ 12 · blocks · d².' },
      pad: 0.3,
    },
    {
      id: 'try2',
      es: 'Tu turno: mueve d y el número de bloques. Busca un modelo de cien mil millones de parámetros o más, y mira qué parte del total pesa cada pieza.',
      en: 'Your turn: move d and the number of blocks. Find a model of one hundred billion parameters or more, and see how much of the total each part takes.',
      tts: {
        es: 'Tu turno: mueve dé y el número de bloques. Busca un modelo de cien mil millones de parámetros o más, y mira qué parte del total pesa cada pieza.',
        en: 'Your turn: move d and the number of blocks. Find a model of one hundred billion parameters or more, and see how much of the total each part takes.',
      },
      gate: {
        id: 'params',
        prompt: { es: 'Lleva el modelo a 100 000 millones de parámetros o más, moviendo d y los bloques.', en: 'Take the model to 100 billion parameters or more by moving d and the blocks.' },
      },
      pad: 0.4,
    },
    {
      id: 'gpt3-check',
      es: 'Comprobemos con GPT-3: noventa y seis bloques y d igual a doce mil doscientos ochenta y ocho. La cuenta da ciento setenta y cuatro mil seiscientos millones; el artículo dice ciento setenta y cinco mil. Cuadra.',
      en: 'Let’s check with GPT-3: ninety-six blocks and d equal to twelve thousand two hundred eighty-eight. The count gives one hundred seventy-four point six billion; the paper says one hundred seventy-five. It checks out.',
      tts: {
        es: 'Comprobemos con Ge pe te tres: noventa y seis bloques y dé igual a doce mil doscientos ochenta y ocho. La cuenta da ciento setenta y cuatro mil seiscientos millones; el artículo dice ciento setenta y cinco mil. Cuadra.',
        en: 'Let’s check with G P T three: ninety-six blocks and d equal to twelve thousand two hundred eighty-eight. The count gives one hundred seventy-four point six billion; the paper says one hundred seventy-five. It checks out.',
      },
      pad: 0.4,
    },
    {
      id: 'honest-today',
      es: 'Una advertencia: los modelos actuales cambian detalles. La posición, la normalización y la red no son idénticas a las de nuestro juguete, pero el esqueleto es el mismo.',
      en: 'A caveat: current models change details. The position encoding, the normalization, and the network are not identical to our toy’s, but the skeleton is the same.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: tokens, embeddings más posición, una pila de bloques con atención enmascarada y red, atajos y normalización, y al final logits, softmax y la siguiente palabra.',
      en: 'In short: tokens, embeddings plus position, a stack of blocks with masked attention and a network, shortcuts and normalization, and at the end logits, softmax, and the next word.',
    },
    {
      id: 'bridge',
      es: 'Ya conocemos la arquitectura, pero sus números empiezan al azar. ¿Qué pasa cuando se entrena con casi todo internet? Es el siguiente capítulo: el preentrenamiento.',
      en: 'We now know the architecture, but its numbers start out random. What happens when it is trained on nearly all of the internet? That is the next chapter: pretraining.',
    },
  ],

  keyIdeas: {
    es: [
      'Un transformer es una pila de bloques iguales en forma. Cada bloque suma al vector de cada palabra un aporte de la atención (entre palabras) y otro de una red (dentro de cada palabra).',
      'Los atajos y la normalización de capa permiten apilar muchos bloques: cada parte suma su aporte sin borrar el vector, y la normalización mantiene estable la escala de los números.',
      'El codificador de posición suma a cada embedding un patrón fijo por lugar. Sin él, la atención no distingue el orden de las palabras.',
      'La máscara causal impide mirar palabras futuras. Sin ella el modelo copia la respuesta al entrenar y no sirve para generar. Con ella, el transformer es un modelo solo decodificador, como GPT.',
      'El último vector se normaliza y se compara con la tabla de embeddings para dar logits; softmax los vuelve probabilidades. Los parámetros se cuentan por matrices: ≈ 12 · bloques · d².',
    ],
    en: [
      'A transformer is a stack of identically shaped blocks. Each block adds to every word’s vector a contribution from attention (between words) and one from a network (within each word).',
      'Shortcuts and layer normalization make it possible to stack many blocks: each part adds its contribution without erasing the vector, and normalization keeps the scale of the numbers stable.',
      'The positional encoding adds a fixed pattern per place to each embedding. Without it, attention cannot tell the order of the words.',
      'The causal mask blocks looking at future words. Without it the model copies the answer during training and is useless for generating. With it, the transformer is a decoder-only model, like GPT.',
      'The last vector is normalized and compared with the embedding table to give logits; softmax turns them into probabilities. Parameters are counted by matrices: ≈ 12 · blocks · d².',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un transformer lee el texto de izquierda a derecha, palabra por palabra, como una persona.',
      en: 'A transformer reads the text from left to right, word by word, like a person.',
    },
    right: {
      es: 'Todas las palabras entran a la vez y se procesan en paralelo. El orden se inyecta con el codificador de posición, y es la máscara causal la que impide que cada palabra mire hacia delante.',
      en: 'All the words enter at once and are processed in parallel. Order is injected with the positional encoding, and it is the causal mask that stops each word from looking ahead.',
    },
  },

  deeper: {
    es: `## El pase completo, ecuación por ecuación

Para una secuencia de $T$ tokens con identificadores $t_1,\\dots,t_T$ y $L$ bloques (la variante «previa a la normalización» de GPT-2, que es la de nuestro juguete):

$$x_i \\leftarrow E[t_i] + \\mathrm{PE}_i$$

y, para cada bloque, con $\\mathrm{LN}$ la normalización de capa:

$$x \\leftarrow x + \\mathrm{Atenci\\acute{o}n}\\big(\\mathrm{LN}_1(x)\\big) \\qquad x \\leftarrow x + \\mathrm{MLP}\\big(\\mathrm{LN}_2(x)\\big)$$

Al salir del último bloque, solo el vector de la última posición decide qué sigue (en entrenamiento se usan todas las posiciones a la vez):

$$z = \\mathrm{LN}_f(x_T)\\,E^\\top \\qquad p = \\mathrm{softmax}(z)$$

$E$ es **la misma** tabla de embeddings de la entrada: reutilizarla en la salida ahorra $V\\cdot d$ parámetros. Ya lo hacía el artículo de 2017 (sección 3.4) y GPT-1, y la técnica es de Press y Wolf (2017).

## Las piezas nuevas

**Red MLP** (la misma para todas las posiciones del bloque): $\\mathrm{MLP}(x)=W_2\\,\\mathrm{GELU}(W_1x+b_1)+b_2$, con $W_1\\in\\mathbb{R}^{d\\times 4d}$ y $W_2\\in\\mathbb{R}^{4d\\times d}$. El artículo original usaba ReLU; GPT-1 y GPT-2 usan GELU (Hendrycks y Gimpel, 2016), una ReLU suave: $\\mathrm{GELU}(x)=x\\,\\Phi(x)$, con $\\Phi$ la distribución normal acumulada.

**Normalización de capa** (Ba, Kiros y Hinton, 2016), sobre los $d$ números de un vector:

$$\\mathrm{LN}(x)=\\gamma\\odot\\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta,\\qquad \\mu=\\tfrac1d\\sum_j x_j,\\quad \\sigma^2=\\tfrac1d\\sum_j (x_j-\\mu)^2$$

$\\gamma$ y $\\beta$ son parámetros (ganancia y sesgo, $2d$ por normalización). El artículo de 2017 la aplicaba **después** de sumar, $\\mathrm{LN}(x+\\mathrm{Subcapa}(x))$; GPT-2 la movió a la entrada de cada subbloque y añadió una más tras el último. Xiong y colegas (2020) muestran que, con la normalización previa, los gradientes están bien comportados desde la inicialización y se puede entrenar sin la fase de calentamiento de la tasa de aprendizaje.

**Codificación de posición** (Vaswani et al., 2017, sección 3.5), con $d$ la dimensión del modelo e $i$ el índice del par de dimensiones:

$$\\mathrm{PE}_{pos,2i}=\\sin\\!\\big(pos/10000^{2i/d}\\big)\\qquad \\mathrm{PE}_{pos,2i+1}=\\cos\\!\\big(pos/10000^{2i/d}\\big)$$

Las longitudes de onda forman una progresión geométrica de $2\\pi$ a $10000\\cdot2\\pi$. Los autores probaron también posiciones aprendidas y obtuvieron resultados casi idénticos; GPT-1 aprende las suyas, y otros modelos usan variantes como la posición rotatoria (RoPE).

**Máscara causal**, con $M_{ij}=0$ si $j\\le i$ y $-\\infty$ si $j>i$:

$$\\mathrm{Att}(Q,K,V)=\\mathrm{softmax}\\!\\Big(\\frac{QK^\\top}{\\sqrt{d_h}}+M\\Big)V$$

La predicción de la posición $i$ depende solo de los tokens $\\le i$, así que en el entrenamiento las $T$ predicciones se calculan a la vez. Nuestro experimento lo confirma: con máscara, la pérdida en frases nuevas es 0.527 nats por palabra, casi la entropía de la gramática (0.526, la cota inferior). Sin máscara, la pérdida de entrenamiento cae a 0.059, pero ese mismo modelo, usado sin trampa, da 3.088, peor que elegir al azar entre doce palabras ($\\ln 12 = 2.485$).

## Contar parámetros

Con $V$ palabras de vocabulario, $d$ dimensiones, $L$ bloques, $ctx$ posiciones aprendidas y $d_{ff}=4d$:

| Parte | Parámetros | Juguete ($d=8$, $L=2$, $V=12$) |
|---|---|---|
| Embedding | $V\\,d$ | 96 |
| Posiciones (si se aprenden) | $ctx\\,d$ | 0 (sinusoidales) |
| Atención | $L\\,(4d^2+4d)$ | 576 |
| Red MLP | $L\\,(8d^2+5d)$ | 1104 |
| Normalizaciones | $(4L+2)\\,d$ | 80 |
| **Total** | $\\approx 12\\,L\\,d^2$ si $d$ es grande | **1856** |

La fórmula coincide exactamente con Hugging Face para GPT-2: 124 439 808 parámetros (12 bloques, $d=768$), 354 823 168, 774 030 080 y 1 557 611 200. Para GPT-3 (96 bloques, $d=12288$, $V=50257$, contexto 2048) da 174 604 259 328, frente a los 175.0 mil millones del artículo (0.2 % de diferencia). En modelos pequeños el embedding pesa mucho; en los grandes, los bloques.

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
print(n_params(8, 2, 12, 0, ff=32), n_params(768, 12, 50257, 1024))
# [[1.   0.   0.  ]
#  [0.25 0.75 0.  ]
#  [0.17 0.13 0.7 ]]
# 0.0 1.0
# 1856 124439808
\`\`\`

El modelo de la lección está completo en \`model.ts\` y se entrena con \`train_tiny.py\` (PyTorch, menos de un minuto): ambos viven junto a esta lección, y \`verify-forward.mts\` comprueba que el pase en TypeScript coincide con PyTorch (diferencia máxima de 7·10⁻⁶).

## Lo que viene

Un modelo con esta arquitectura empieza con parámetros al azar. La lección 23 muestra qué aprende al entrenarlo para predecir la siguiente palabra sobre texto a escala de internet, y la 24, cuánto cuesta. Los detalles de servirlo (la caché KV, que evita recalcular las palabras anteriores) llegan en la lección 26.`,

    en: `## The full pass, equation by equation

For a sequence of $T$ tokens with identifiers $t_1,\\dots,t_T$ and $L$ blocks (the “pre-normalization” variant of GPT-2, which is the one in our toy):

$$x_i \\leftarrow E[t_i] + \\mathrm{PE}_i$$

and, for each block, with $\\mathrm{LN}$ the layer normalization:

$$x \\leftarrow x + \\mathrm{Attention}\\big(\\mathrm{LN}_1(x)\\big) \\qquad x \\leftarrow x + \\mathrm{MLP}\\big(\\mathrm{LN}_2(x)\\big)$$

At the exit of the last block, only the vector at the last position decides what comes next (in training all positions are used at once):

$$z = \\mathrm{LN}_f(x_T)\\,E^\\top \\qquad p = \\mathrm{softmax}(z)$$

$E$ is **the same** embedding table as at the input: reusing it at the output saves $V\\cdot d$ parameters. The 2017 paper already did it (section 3.4), and so did GPT-1; the technique is from Press and Wolf (2017).

## The new pieces

**MLP network** (the same for every position in the block): $\\mathrm{MLP}(x)=W_2\\,\\mathrm{GELU}(W_1x+b_1)+b_2$, with $W_1\\in\\mathbb{R}^{d\\times 4d}$ and $W_2\\in\\mathbb{R}^{4d\\times d}$. The original paper used ReLU; GPT-1 and GPT-2 use GELU (Hendrycks and Gimpel, 2016), a smooth ReLU: $\\mathrm{GELU}(x)=x\\,\\Phi(x)$, with $\\Phi$ the normal cumulative distribution.

**Layer normalization** (Ba, Kiros, and Hinton, 2016), over the $d$ numbers of a vector:

$$\\mathrm{LN}(x)=\\gamma\\odot\\frac{x-\\mu}{\\sqrt{\\sigma^2+\\varepsilon}}+\\beta,\\qquad \\mu=\\tfrac1d\\sum_j x_j,\\quad \\sigma^2=\\tfrac1d\\sum_j (x_j-\\mu)^2$$

$\\gamma$ and $\\beta$ are parameters (gain and bias, $2d$ per normalization). The 2017 paper applied it **after** adding, $\\mathrm{LN}(x+\\mathrm{Sublayer}(x))$; GPT-2 moved it to the input of each sub-block and added one more after the last. Xiong and colleagues (2020) show that with the pre-normalization the gradients are well behaved at initialization, so the learning-rate warm-up stage can be dropped.

**Positional encoding** (Vaswani et al., 2017, section 3.5), with $d$ the model dimension and $i$ the index of the pair of dimensions:

$$\\mathrm{PE}_{pos,2i}=\\sin\\!\\big(pos/10000^{2i/d}\\big)\\qquad \\mathrm{PE}_{pos,2i+1}=\\cos\\!\\big(pos/10000^{2i/d}\\big)$$

The wavelengths form a geometric progression from $2\\pi$ to $10000\\cdot2\\pi$. The authors also tried learned positions and got nearly identical results; GPT-1 learns its own, and other models use variants such as rotary position (RoPE).

**Causal mask**, with $M_{ij}=0$ if $j\\le i$ and $-\\infty$ if $j>i$:

$$\\mathrm{Att}(Q,K,V)=\\mathrm{softmax}\\!\\Big(\\frac{QK^\\top}{\\sqrt{d_h}}+M\\Big)V$$

The prediction at position $i$ depends only on tokens $\\le i$, so in training all $T$ predictions are computed at once. Our experiment confirms it: with the mask, the loss on new sentences is 0.527 nats per word, almost the grammar’s entropy (0.526, the lower bound). Without the mask, the training loss falls to 0.059, but that same model, used without cheating, scores 3.088, worse than picking at random among twelve words ($\\ln 12 = 2.485$).

## Counting parameters

With $V$ vocabulary words, $d$ dimensions, $L$ blocks, $ctx$ learned positions, and $d_{ff}=4d$:

| Part | Parameters | Toy ($d=8$, $L=2$, $V=12$) |
|---|---|---|
| Embedding | $V\\,d$ | 96 |
| Positions (if learned) | $ctx\\,d$ | 0 (sinusoidal) |
| Attention | $L\\,(4d^2+4d)$ | 576 |
| MLP network | $L\\,(8d^2+5d)$ | 1,104 |
| Normalizations | $(4L+2)\\,d$ | 80 |
| **Total** | $\\approx 12\\,L\\,d^2$ when $d$ is large | **1,856** |

The formula matches Hugging Face exactly for GPT-2: 124,439,808 parameters (12 blocks, $d=768$), 354,823,168, 774,030,080, and 1,557,611,200. For GPT-3 (96 blocks, $d=12288$, $V=50257$, context 2048) it gives 174,604,259,328, against the paper’s 175.0 billion (0.2% apart). In small models the embedding weighs a lot; in large ones, the blocks.

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
print(n_params(8, 2, 12, 0, ff=32), n_params(768, 12, 50257, 1024))
# [[1.   0.   0.  ]
#  [0.25 0.75 0.  ]
#  [0.17 0.13 0.7 ]]
# 0.0 1.0
# 1856 124439808
\`\`\`

The lesson’s model is complete in \`model.ts\` and is trained with \`train_tiny.py\` (PyTorch, under a minute): both live next to this lesson, and \`verify-forward.mts\` checks that the TypeScript pass matches PyTorch (maximum difference 7·10⁻⁶).

## What comes next

A model with this architecture starts with random parameters. Lesson 23 shows what it learns when trained to predict the next word on internet-scale text, and lesson 24 what that costs. The details of serving it (the KV cache, which avoids recomputing the earlier words) arrive in lesson 26.`,
  },

  lens: {
    es: [
      'Casi todos los modelos de lenguaje de uso general comparten este esqueleto. Decir «usamos un transformer» casi no informa: pregunta por el tamaño (d y número de bloques), por el contexto y por los datos con que se entrenó.',
      'El tamaño crece con d al cuadrado y con el número de bloques. Un modelo con la mitad de bloques pero d doble tiene más parámetros, no menos. Compara los dos números, no solo el total.',
      'Cada palabra generada exige un pase por todos los bloques. Las respuestas largas cuestan más tiempo y dinero, y un modelo más profundo es más lento por palabra.',
      'Hay modelos generativos (solo decodificador, como GPT) y modelos de comprensión (solo codificador, como BERT). Para clasificar o buscar documentos no siempre hace falta uno generativo: puede ser más barato y más fácil de evaluar.',
    ],
    en: [
      'Almost all general-purpose language models share this skeleton. Saying “we use a transformer” hardly tells you anything: ask about size (d and number of blocks), context length, and the data it was trained on.',
      'Size grows with d squared and with the number of blocks. A model with half the blocks but double d has more parameters, not fewer. Compare both numbers, not just the total.',
      'Every generated word requires a pass through all the blocks. Long answers cost more time and money, and a deeper model is slower per word.',
      'There are generative models (decoder-only, like GPT) and comprehension models (encoder-only, like BERT). To classify or search documents you do not always need a generative one: it can be cheaper and easier to evaluate.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Para qué sirve la máscara causal en un transformer que genera texto?', en: 'What is the causal mask for in a transformer that generates text?' },
      options: [
        { es: 'Para que el modelo ignore las palabras poco frecuentes.', en: 'So the model ignores infrequent words.' },
        { es: 'Para reducir la cantidad de parámetros del modelo.', en: 'To reduce the number of parameters in the model.' },
        { es: 'Para que cada palabra solo atienda a las anteriores y no pueda copiar la respuesta al entrenar.', en: 'So each word only attends to the earlier ones and cannot copy the answer during training.' },
        { es: 'Para que el modelo conozca el orden de las palabras.', en: 'So the model knows the order of the words.' },
      ],
      answer: 2,
      why: { es: 'Sin la máscara, la posición que predice la palabra siguiente podría mirarla directamente. En nuestro experimento, el modelo sin máscara bajó su pérdida a casi cero, pero usado sin trampa fue peor que adivinar al azar. El orden lo da el codificador de posición, no la máscara.', en: 'Without the mask, the position predicting the next word could look straight at it. In our experiment, the model without the mask drove its loss to nearly zero, but used without cheating it was worse than guessing at random. Order comes from the positional encoding, not the mask.' },
    },
    {
      kind: 'concept',
      q: { es: 'En un bloque, ¿qué parte procesa cada palabra por separado, sin mirar a las demás?', en: 'In a block, which part processes each word separately, without looking at the others?' },
      options: [
        { es: 'La red de dos capas (MLP).', en: 'The two-layer network (MLP).' },
        { es: 'La atención.', en: 'Attention.' },
        { es: 'La máscara causal.', en: 'The causal mask.' },
        { es: 'Los atajos.', en: 'The shortcuts.' },
      ],
      answer: 0,
      why: { es: 'La red se aplica igual a cada posición, de forma independiente. La atención es el único canal entre palabras: al apagarla en el modelo entrenado, «come» recibió la misma predicción con cualquier sujeto.', en: 'The network is applied the same way to each position, independently. Attention is the only channel between words: when we switched it off in the trained model, “eats” got the same prediction with any subject.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un transformer tiene 10 bloques y d = 1000. Con la regla de 12 · bloques · d², ¿cuántos parámetros hay aproximadamente en los bloques (sin contar embeddings)?', en: 'A transformer has 10 blocks and d = 1000. With the rule of 12 · blocks · d², about how many parameters are in the blocks (not counting embeddings)?' },
      options: [
        { es: '12 millones', en: '12 million' },
        { es: '1200 millones', en: '1.2 billion' },
        { es: '10 millones', en: '10 million' },
        { es: '120 millones', en: '120 million' },
      ],
      answer: 3,
      why: { es: '12 × 10 × 1000² = 12 × 10 × 1 000 000 = 120 000 000. Atención aporta 4d² por bloque y la red 8d²; d aparece al cuadrado.', en: '12 × 10 × 1000² = 12 × 10 × 1,000,000 = 120,000,000. Attention contributes 4d² per block and the network 8d²; d appears squared.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor ofrece dos modelos: A con 24 bloques y d = 2048, y B con 12 bloques y d = 4096. ¿Cuál tiene más parámetros en los bloques?', en: 'A vendor offers two models: A with 24 blocks and d = 2048, and B with 12 blocks and d = 4096. Which has more parameters in the blocks?' },
      options: [
        { es: 'Tienen casi los mismos, porque 24 × 2048 = 12 × 4096.', en: 'About the same, because 24 × 2048 = 12 × 4096.' },
        { es: 'B tiene el doble, aunque tenga la mitad de bloques.', en: 'B has double, even though it has half the blocks.' },
        { es: 'A tiene más, porque tiene más bloques.', en: 'A has more, because it has more blocks.' },
        { es: 'No se puede saber sin conocer los datos de entrenamiento.', en: 'There is no way to know without the training data.' },
      ],
      answer: 1,
      why: { es: 'Los parámetros de los bloques son ≈ 12 · bloques · d². A: 12 × 24 × 2048² ≈ 1200 millones. B: 12 × 12 × 4096² ≈ 2400 millones. Duplicar d cuadruplica; duplicar los bloques solo duplica. Los datos no cambian la cuenta de parámetros.', en: 'Block parameters are ≈ 12 · blocks · d². A: 12 × 24 × 2048² ≈ 1.2 billion. B: 12 × 12 × 4096² ≈ 2.4 billion. Doubling d quadruples; doubling the blocks only doubles. The data does not change the parameter count.' },
    },
  ],

  glossary: ['attention', 'query-key-value', 'self-attention', 'multi-head-attention', 'softmax', 'token', 'vocabulary', 'language-model', 'autoregression', 'embedding', 'residual-connection', 'relu', 'nonlinearity', 'layer', 'parameter', 'weight', 'forward-pass', 'loss'],

  terms: [
    { id: 'transformer', term: { es: 'Transformer', en: 'Transformer' }, def: { es: 'Arquitectura de red neuronal formada por una pila de bloques iguales en forma. Cada bloque combina atención (entre palabras) y una red aplicada a cada palabra, con atajos y normalización. Se presentó en «Attention Is All You Need» (2017).', en: 'A neural-network architecture made of a stack of identically shaped blocks. Each block combines attention (between words) and a network applied to each word, with shortcuts and normalization. It was introduced in “Attention Is All You Need” (2017).' } },
    { id: 'positional-encoding', term: { es: 'Codificador de posición', en: 'Positional encoding' }, def: { es: 'Vector que se suma al embedding de cada palabra para indicar su lugar en el texto. En el artículo original es un patrón fijo de senos y cosenos; otros modelos lo aprenden o usan variantes.', en: 'A vector added to each word’s embedding to indicate its place in the text. In the original paper it is a fixed pattern of sines and cosines; other models learn it or use variants.' } },
    { id: 'causal-mask', term: { es: 'Máscara causal', en: 'Causal mask' }, def: { es: 'Máscara que, antes de softmax, cambia por menos infinito las puntuaciones hacia palabras futuras. Así cada palabra solo atiende a las anteriores y a sí misma, y el modelo no puede copiar la respuesta al entrenar.', en: 'A mask that, before softmax, replaces the scores toward future words with minus infinity. Each word then attends only to earlier words and itself, and the model cannot copy the answer during training.' } },
    { id: 'layer-norm', term: { es: 'Normalización de capa', en: 'Layer normalization' }, def: { es: 'Recentra cada vector en media cero y lo reescala a desviación uno, y luego aplica una ganancia y un sesgo aprendidos. Mantiene estable la escala de los números al apilar muchos bloques.', en: 'Recenters each vector to zero mean and rescales it to standard deviation one, then applies a learned gain and bias. It keeps the scale of the numbers stable when many blocks are stacked.' } },
    { id: 'decoder-only', term: { es: 'Solo decodificador', en: 'Decoder-only' }, def: { es: 'Transformer formado solo por bloques con máscara causal que predicen la palabra siguiente, sin una mitad codificadora aparte. Es la arquitectura de la familia GPT.', en: 'A transformer made only of blocks with a causal mask that predict the next word, with no separate encoder half. It is the architecture of the GPT family.' } },
  ],

  sources: [
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., Polosukhin, I.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'Improving Language Understanding by Generative Pre-Training (GPT-1)', authors: 'Radford, A., Narasimhan, K., Salimans, T., Sutskever, I.', year: 2018, url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Layer Normalization', authors: 'Ba, J. L., Kiros, J. R., Hinton, G. E.', year: 2016, url: 'https://arxiv.org/abs/1607.06450' },
    { title: 'On Layer Normalization in the Transformer Architecture', authors: 'Xiong, R., et al.', year: 2020, url: 'https://arxiv.org/abs/2002.04745' },
    { title: 'Using the Output Embedding to Improve Language Models', authors: 'Press, O., Wolf, L.', year: 2017, url: 'https://arxiv.org/abs/1608.05859' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: 'Devlin, J., Chang, M.-W., Lee, K., Toutanova, K.', year: 2018, url: 'https://arxiv.org/abs/1810.04805' },
  ],
});
