import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'datos-como-numeros',

  objectives: {
    es: [
      'Explicar cómo una imagen, un sonido y un texto se convierten en listas de números que un modelo puede recibir.',
      'Calcular cuántos números tiene una imagen, en grises o en color, a partir de su tamaño.',
      'Predecir qué ocurre con los números de una imagen cuando se desenfoca, aunque a simple vista parezca igual.',
    ],
    en: [
      'Explain how an image, a sound, and a text become lists of numbers that a model can receive.',
      'Calculate how many numbers an image has, in grayscale or in color, from its size.',
      'Predict what happens to the numbers of an image when it is blurred, even if it looks the same at a glance.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Una máquina aprende de ejemplos. Pero si el ejemplo es una imagen, ¿qué recibe el modelo? Una imagen no es un número.',
      en: 'A machine learns from examples. But if the example is an image, what does the model receive? An image is not a number.',
    },
    {
      id: 'pixels',
      es: 'Una imagen digital es una cuadrícula de píxeles. Esta tiene sesenta y cuatro, ocho por ocho, y cada uno es un cuadrito de un solo color.',
      en: 'A digital image is a grid of pixels. This one has sixty-four, eight by eight, and each is a small square of a single color.',
      note: { es: 'Píxel: el punto más pequeño de una imagen, de un solo color.', en: 'Pixel: the smallest dot of an image, a single color.' },
    },
    {
      id: 'brightness',
      es: 'Empecemos con grises. Cada píxel es un número, su brillo: de cero, negro, a doscientos cincuenta y cinco, blanco. Eso es lo que cabe en un byte.',
      en: 'Let’s start with grays. Each pixel is a number, its brightness: from zero, black, to two hundred fifty-five, white. That is what fits in one byte.',
      tts: {
        es: 'Empecemos con grises. Cada píxel es un número, su brillo: de cero, negro, a doscientos cincuenta y cinco, blanco. Eso es lo que cabe en un bait.',
      },
      pad: 0.3,
    },
    {
      id: 'matrix',
      es: 'Todos los brillos juntos forman una matriz: una tabla de números. Para el modelo, la imagen es solo esto: nunca «ve» el dibujo, ve números.',
      en: 'All the brightness values together form a matrix: a table of numbers. To the model, the image is only this: it never “sees” the picture, it sees numbers.',
      note: { es: 'El modelo no ve la imagen: recibe una matriz de números.', en: 'The model does not see the image: it receives a matrix of numbers.' },
      pad: 0.3,
    },
    {
      id: 'flatten',
      es: 'Un modelo recibe una lista, no una tabla. Así que las filas se leen una tras otra y se pegan: una lista de sesenta y cuatro números.',
      en: 'A model takes a list, not a table. So the rows are read one after another and glued together: a list of sixty-four numbers.',
      pad: 0.6,
    },
    {
      id: 'feature',
      es: 'Cada número es una característica, o feature: una medida del ejemplo. Una fruta tiene dos, como peso y dulzor; esta imagen, sesenta y cuatro.',
      en: 'Each number is a feature: one measurement of the example. A fruit has two, like weight and sweetness; this image has sixty-four.',
      note: { es: 'Característica (feature): una medida de un ejemplo, como número.', en: 'Feature: one measurement of an example, as a number.' },
      pad: 0.3,
    },
    {
      id: 'vector',
      es: 'Esa lista ordenada de números se llama vector. Fruta o imagen, el modelo siempre recibe un vector por ejemplo; solo cambia su longitud.',
      en: 'That ordered list of numbers is called a vector. Fruit or image, the model always receives one vector per example; only the length changes.',
      note: { es: 'Vector: lista ordenada de números. Cada ejemplo es un vector.', en: 'Vector: an ordered list of numbers. Each example is a vector.' },
      pad: 0.3,
    },
    {
      id: 'paint-intro',
      es: 'Tu turno: pinta con el dedo o el ratón y mira cómo cambian la matriz y la lista. Con teclado, mueve la fila y la columna: el rastro pinta.',
      en: 'Your turn: paint with your finger or mouse and watch the matrix and the list change. With a keyboard, move the row and column: the trail paints.',
      gate: {
        id: 'paint',
        prompt: { es: 'Pinta al menos diez píxeles, con el puntero o moviendo fila y columna.', en: 'Paint at least ten pixels, with the pointer or by moving row and column.' },
      },
      pad: 0.4,
    },
    {
      id: 'neighbors',
      es: 'La máquina solo recibe esta lista. Y aplanar pierde algo: un píxel y el de abajo son vecinos en la imagen, pero en la lista quedan a ocho lugares.',
      en: 'The machine only receives this list. And flattening loses something: a pixel and the one below it are neighbors in the image, but eight places apart in the list.',
      pad: 0.3,
    },
    {
      id: 'blur-intro',
      es: 'Ahora desenfoquemos: cada píxel se reemplaza por el promedio de sí mismo y sus ocho vecinos. Aquí, nueve números se vuelven uno.',
      en: 'Now let’s blur: each pixel is replaced by the average of itself and its eight neighbors. Here, nine numbers become one.',
      pad: 0.5,
    },
    {
      id: 'blur-numbers',
      es: 'Compara las dos listas: cada número cambió y, aun así, sigues viendo la misma carita. Para el modelo, es otra entrada.',
      en: 'Compare the two lists: every number changed and, even so, you still see the same little face. To the model, this is a different input.',
      pad: 0.3,
    },
    {
      id: 'blur-try',
      es: 'Tu turno: sube el desenfoque poco a poco y mira cuánto se alejan los números de los originales. ¿Hasta dónde se reconoce la cara?',
      en: 'Your turn: raise the blur little by little and watch how far the numbers drift from the originals. How long is the face recognizable?',
      gate: {
        id: 'blur',
        prompt: { es: 'Lleva el desenfoque hasta el nivel cuatro.', en: 'Raise the blur to level four.' },
      },
      pad: 0.4,
    },
    {
      id: 'blur-reflect',
      es: 'Desenfocar es una operación entre números, y el detalle mezclado no se recupera con exactitud. Combinar vecinos reaparecerá en las convoluciones.',
      en: 'Blurring is an operation on numbers, and the detail that got mixed cannot be recovered exactly. Combining neighbors will return in convolutions.',
      pad: 0.3,
    },
    {
      id: 'color-intro',
      es: '¿Y el color? Un número no alcanza: cada píxel guarda tres, cuánto rojo, verde y azul, de cero a doscientos cincuenta y cinco. Son los canales RGB.',
      en: 'And color? One number is not enough: each pixel stores three, how much red, green, and blue, from zero to two hundred fifty-five. These are the RGB channels.',
      tts: {
        es: '¿Y el color? Un número no alcanza: cada píxel guarda tres, cuánto rojo, verde y azul, de cero a doscientos cincuenta y cinco. Son los canales erre ge be.',
        en: 'And color? One number is not enough: each pixel stores three, how much red, green, and blue, from zero to two hundred fifty-five. These are the R G B channels.',
      },
      pad: 0.3,
    },
    {
      id: 'channels',
      es: 'Así, una imagen en color son tres matrices apiladas, una por canal, y la pantalla suma sus luces. Esta carita ya son ciento noventa y dos números.',
      en: 'So a color image is three matrices stacked together, one per channel, and the screen adds their lights. This little face is already one hundred ninety-two numbers.',
      pad: 0.3,
    },
    {
      id: 'tensor',
      es: 'Esta pila de alto, ancho y canales es un tensor: un arreglo de números con cualquier cantidad de ejes. Vector, un eje; matriz, dos; esta pila, tres.',
      en: 'This stack of height, width, and channels is a tensor: an array of numbers with any number of axes. Vector, one axis; matrix, two; this stack, three.',
      note: { es: 'Tensor: arreglo de números con cualquier cantidad de ejes.', en: 'Tensor: an array of numbers with any number of axes.' },
      pad: 0.4,
    },
    {
      id: 'sound-intro',
      es: 'El sonido es una onda de presión en el aire que cambia con el tiempo. Un micrófono la convierte en una señal eléctrica.',
      en: 'Sound is a pressure wave in the air that changes over time. A microphone turns it into an electrical signal.',
      pad: 0.3,
    },
    {
      id: 'samples',
      es: 'Para guardarla, se mide la señal muchas veces por segundo. Cada medida es un número, una muestra: el sonido queda como lista en orden de tiempo.',
      en: 'To store it, the signal is measured many times per second. Each measurement is a number, a sample: the sound becomes a list in time order.',
      note: { es: 'Sonido: una muestra, un número, por cada instante medido.', en: 'Sound: one sample, one number, for each instant measured.' },
      pad: 0.4,
    },
    {
      id: 'sound-try',
      es: 'Tu turno: baja las muestras por segundo y mira cuándo la onda guardada deja de parecerse a la original. Luego súbelas otra vez.',
      en: 'Your turn: lower the samples per second and watch when the stored wave stops resembling the original. Then raise them again.',
      gate: {
        id: 'rate',
        prompt: { es: 'Baja las muestras hasta que la onda guardada pierda su forma.', en: 'Lower the samples until the stored wave loses its shape.' },
      },
      pad: 0.4,
    },
    {
      id: 'sound-reflect',
      es: 'Lo que no se midió no vuelve. Los modelos de voz como Whisper usan dieciséis mil muestras por segundo: un minuto son casi un millón de números.',
      en: 'What was not measured does not come back. Speech models such as Whisper use sixteen thousand samples per second: one minute is nearly a million numbers.',
      tts: {
        es: 'Lo que no se midió no vuelve. Los modelos de voz como uísper usan dieciséis mil muestras por segundo: un minuto son casi un millón de números.',
      },
      pad: 0.4,
    },
    {
      id: 'text-codes',
      es: 'El texto también se vuelve números. Lo más simple es dar un código a cada letra, como hace tu computadora. Puedes escribir otra palabra abajo.',
      en: 'Text becomes numbers too. The simplest way is to give each letter a code, as your computer does. You can type a different word below.',
      pad: 0.3,
    },
    {
      id: 'text-limit',
      es: 'Pero un código es solo una etiqueta: «gato» y «pato» casi comparten códigos y no se parecen; «gato» y «felino» se parecen, y sus códigos no.',
      en: 'But a code is only a label: “cat” and “car” almost share codes and are unrelated; “cat” and “kitten” are related, and their codes are not.',
      pad: 0.4,
    },
    {
      id: 'text-vectors',
      es: 'Los modelos modernos hacen algo mejor: convierten cada palabra en un vector que describe su significado. Aquí, un adelanto con cuatro rasgos inventados.',
      en: 'Modern models do something better: they turn each word into a vector that describes its meaning. Here is a preview with four made-up features.',
      pad: 0.3,
    },
    {
      id: 'text-near',
      es: 'Ahora sí: gato y perro quedan cerca; gato y pan, lejos. Cerca en los números es cerca en significado. Esa idea, los embeddings, tiene su lección.',
      en: 'Now it works: cat and dog land close together; cat and bread, far apart. Close in the numbers means close in meaning. That idea, embeddings, has its own lesson.',
      tts: {
        es: 'Ahora sí: gato y perro quedan cerca; gato y pan, lejos. Cerca en los números es cerca en significado. Esa idea, los embédins, tiene su lección.',
      },
      note: { es: 'Texto: vectores donde cerca en números es cerca en significado.', en: 'Text: vectors where close in numbers means close in meaning.' },
      pad: 0.4,
    },
    {
      id: 'mnist',
      es: 'MNIST son dígitos escritos a mano. Cada imagen mide veintiocho por veintiocho píxeles: setecientos ochenta y cuatro números.',
      en: 'MNIST is a set of handwritten digits. Each image is twenty-eight by twenty-eight pixels: seven hundred eighty-four numbers.',
      tts: {
        es: 'Eme nist son dígitos escritos a mano. Cada imagen mide veintiocho por veintiocho píxeles: setecientos ochenta y cuatro números.',
        en: 'M nist is a set of handwritten digits. Each image is twenty-eight by twenty-eight pixels: seven hundred eighty-four numbers.',
      },
      pad: 0.3,
    },
    {
      id: 'mnist-sets',
      es: 'Hay sesenta mil imágenes para entrenar y diez mil, que el modelo no vio al entrenar, para probar.',
      en: 'There are sixty thousand images for training and ten thousand, which the model did not see in training, for testing.',
      pad: 0.4,
    },
    {
      id: 'photo',
      es: 'Una foto de doce megapíxeles tiene doce millones de píxeles; con tres canales, unos treinta y seis millones de números. Y es una sola foto.',
      en: 'A twelve-megapixel photo has twelve million pixels; with three channels, about thirty-six million numbers. And that is a single photo.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: imágenes, sonidos y texto llegan por caminos distintos al mismo lugar: vectores y tensores de números. El modelo no ve ni oye; calcula.',
      en: 'In short: images, sounds, and text arrive by different paths at the same place: vectors and tensors of numbers. The model neither sees nor hears; it computes.',
      note: { es: 'Todo dato entra al modelo como un vector o un tensor.', en: 'All data enters the model as a vector or a tensor.' },
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Con los datos en números, hace falta un modelo que los transforme. El más sencillo es una recta, y es lo que viene.',
      en: 'With the data in numbers, we need a model to transform them. The simplest is a straight line, and that is what comes next.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo solo recibe números. Una imagen en grises es una tabla de brillos de 0 (negro) a 255 (blanco); en color son tres tablas, una por canal (rojo, verde, azul).',
      'Aplanar la tabla da un vector: una lista ordenada con una característica (feature) por píxel. Cada ejemplo llega al modelo como un vector o un tensor.',
      'Una imagen en color de alto × ancho píxeles tiene alto × ancho × 3 números. Una foto de 12 megapíxeles tiene unos 36 millones.',
      'El sonido se guarda midiendo la señal muchas veces por segundo (muestras). Con pocas muestras se pierde información que ningún modelo recupera después.',
      'El texto también se convierte en vectores. Un código por letra solo etiqueta; los vectores aprendidos hacen que lo cercano en números sea cercano en significado.',
    ],
    en: [
      'A model only receives numbers. A grayscale image is a table of brightness values from 0 (black) to 255 (white); in color it is three tables, one per channel (red, green, blue).',
      'Flattening the table gives a vector: an ordered list with one feature per pixel. Each example reaches the model as a vector or a tensor.',
      'A color image of height × width pixels has height × width × 3 numbers. A 12-megapixel photo has about 36 million.',
      'Sound is stored by measuring the signal many times per second (samples). With too few samples, information is lost that no model can recover later.',
      'Text is also turned into vectors. One code per letter is only a label; learned vectors make close in numbers mean close in meaning.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA «ve» una foto como nosotros y reconoce lo que hay en ella por lo que ve.',
      en: 'The AI “sees” a photo the way we do and recognizes what is in it by what it sees.',
    },
    right: {
      es: 'Recibe una tabla de números (brillos o colores) y nada más: dentro del modelo no hay «foto». Reconocer es encontrar patrones en esos números, y los aprende de ejemplos.',
      en: 'It receives a table of numbers (brightness values or colors) and nothing else: there is no “photo” inside the model. Recognizing means finding patterns in those numbers, which it learns from examples.',
    },
  },

  deeper: {
    es: `## De la imagen al vector

Una imagen en escala de grises es una matriz $X \\in \\{0,\\dots,255\\}^{H \\times W}$. Aplanarla, fila por fila, da el vector $\\mathbf{x} \\in \\mathbb{R}^{HW}$ con

$$x_{iW+j} = X_{ij} \\qquad (i = 0,\\dots,H-1;\\ j = 0,\\dots,W-1)$$

La carita de la lección tiene $H = W = 8$, así que $\\mathbf{x}$ tiene 64 componentes. Cada valor cabe en un byte: $2^8 = 256$ niveles. Antes de entrenar es habitual normalizar, $x' = x/255 \\in [0,1]$.

La vecindad se pierde al aplanar: el píxel $(i,j)$ y el $(i+1,j)$ son vecinos en la imagen, pero sus posiciones en el vector difieren en $W$ (ocho, en la carita). Las redes totalmente conectadas ignoran esa estructura; las convolucionales (lección 11) la aprovechan.

## Color, canales y tensores

Una imagen en color es un tensor $X \\in \\{0,\\dots,255\\}^{H \\times W \\times 3}$ con $3HW$ valores. Una foto de 12 megapíxeles, por ejemplo de $4000 \\times 3000$ píxeles, tiene

$$12\\,000\\,000 \\times 3 = 36\\,000\\,000 \\text{ valores}$$

es decir, unos 36 MB sin comprimir a un byte por valor. Los archivos como JPEG ocupan mucho menos, pero el modelo trabaja con los píxeles ya decodificados (o con una versión reducida). El orden de los ejes depende de la biblioteca: alto × ancho × canales, o canales × alto × ancho.

En la lección, el gris de cada píxel sale de su color con una receta habitual de luminancia (ITU-R BT.601): $Y = 0{,}299\\,R + 0{,}587\\,G + 0{,}114\\,B$. Con tres canales de 8 bits hay $256^3 = 16\\,777\\,216$ colores posibles.

## Desenfoque: promediar vecinos

El desenfoque de la lección reemplaza cada píxel por el promedio de su ventana $3\\times 3$:

$$y_{ij} = \\frac{1}{9} \\sum_{a=-1}^{1} \\sum_{b=-1}^{1} x_{i+a,\\,j+b}$$

En los bordes se promedia solo con los vecinos que existen. Para el píxel de la fila 3, columna 3 (contando desde 1), los nueve valores son 146, 202, 255, 202, 0, 202, 202, 0 y 202, y su promedio es $\\approx 156{,}8$. Es un caso particular de convolución (lección 11).

## Sonido: muestreo

Una señal $s(t)$ se guarda como $x[n] = s(n/f_s)$, con $f_s$ muestras por segundo. El teorema de muestreo (Nyquist–Shannon; Shannon, 1949) dice que una señal sin frecuencias por encima de $B$ queda determinada por sus muestras si $f_s > 2B$. A $f_s = 16\\,000$ Hz, que es la frecuencia a la que Whisper remuestrea todo el audio (Radford et al., 2022), se representan componentes de hasta 8 kHz. Un minuto son $16\\,000 \\times 60 = 960\\,000$ valores. Un CD de audio usa 44 100 muestras por segundo con 16 bits por muestra (estándar «Red Book»).

En la demostración se unen las muestras con rectas para mostrar «lo que quedó guardado»; un conversor real reconstruye mejor, pero la información de una señal con frecuencias por encima de $f_s/2$ no se puede recuperar.

## Texto: de códigos a vectores

Unicode asigna un número, el *punto de código*, a cada carácter: «N» es 78, «e» es 101, «u» es 117, «ñ» es 241. Es una etiqueta, no un significado. Los modelos de lenguaje parten el texto en *tokens* (lección 20), cada token es un entero, y una tabla de embeddings $E \\in \\mathbb{R}^{V \\times d}$ entrega a cada uno un vector $E_{\\text{id}} \\in \\mathbb{R}^{d}$, aprendido durante el entrenamiento. En GPT-3 175B la dimensión del modelo es $d_{\\text{model}} = 12\\,288$ (Brown et al., 2020, tabla 2.1). Los cuatro rasgos de la lección ($d=4$) son inventados; en un modelo real los rasgos se aprenden y no tienen nombre. Cercanía en el espacio, medida por ejemplo con la distancia euclídea $\\lVert \\mathbf{a}-\\mathbf{b}\\rVert$, se llena de significado en la lección 14.

## En código

\`\`\`python
import numpy as np

# la carita en grises (8x8), la misma de la lección
carita = np.array([
    [ 20,  20, 146, 146, 146, 146,  20,  20],
    [ 20, 146, 202, 255, 202, 202, 146,  20],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [146, 202, 202, 202, 202, 202, 202, 146],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [ 20, 146, 202,   0,   0, 202, 146,  20],
    [ 20,  20, 146, 146, 146, 146,  20,  20],
], dtype=np.uint8)

vector = carita.flatten()               # de tabla a lista, fila por fila
print(carita.shape, vector.shape)       # (8, 8) (64,)

# un píxel y el de abajo: vecinos en la imagen, lejos en el vector
i, j = 2, 2
print(i * 8 + j, (i + 1) * 8 + j)       # 18 26

# desenfoque de un píxel: promedio de su ventana 3x3
ventana = carita[i - 1:i + 2, j - 1:j + 2]
print(ventana.mean())                   # 156.77777777777777

# una foto de 12 megapíxeles en color (4000 x 3000 píxeles, 3 canales)
foto = np.zeros((3000, 4000, 3), dtype=np.uint8)
print(foto.shape, foto.size)            # (3000, 4000, 3) 36000000

# texto: el código de cada letra
print([ord(c) for c in "Neu"])          # [78, 101, 117]
\`\`\`

## Lo que viene

Con los datos ya en vectores, la lección 3 pone el primer modelo encima: una recta $y = wx + b$ y su error. Más adelante, las convoluciones (lección 11) recuperan la vecindad de los píxeles, los embeddings (lección 14) dan geometría al significado y los tokens (lección 20) explican qué «piezas» de texto lee de verdad un modelo de lenguaje.`,
    en: `## From image to vector

A grayscale image is a matrix $X \\in \\{0,\\dots,255\\}^{H \\times W}$. Flattening it, row by row, gives the vector $\\mathbf{x} \\in \\mathbb{R}^{HW}$ with

$$x_{iW+j} = X_{ij} \\qquad (i = 0,\\dots,H-1;\\ j = 0,\\dots,W-1)$$

The little face in the lesson has $H = W = 8$, so $\\mathbf{x}$ has 64 components. Each value fits in one byte: $2^8 = 256$ levels. Before training it is common to normalize, $x' = x/255 \\in [0,1]$.

Neighborhood is lost when flattening: pixel $(i,j)$ and pixel $(i+1,j)$ are neighbors in the image, but their positions in the vector differ by $W$ (eight, for the little face). Fully connected networks ignore that structure; convolutional ones (lesson 11) exploit it.

## Color, channels, and tensors

A color image is a tensor $X \\in \\{0,\\dots,255\\}^{H \\times W \\times 3}$ with $3HW$ values. A 12-megapixel photo, for example $4000 \\times 3000$ pixels, has

$$12{,}000{,}000 \\times 3 = 36{,}000{,}000 \\text{ values}$$

that is, about 36 MB uncompressed at one byte per value. Files like JPEG are much smaller, but the model works with the decoded pixels (or with a downsized version). The order of the axes depends on the library: height × width × channels, or channels × height × width.

In the lesson, the gray of each pixel comes from its color with a common luminance recipe (ITU-R BT.601): $Y = 0.299\\,R + 0.587\\,G + 0.114\\,B$. With three 8-bit channels there are $256^3 = 16{,}777{,}216$ possible colors.

## Blur: averaging neighbors

The lesson’s blur replaces each pixel with the average of its $3\\times 3$ window:

$$y_{ij} = \\frac{1}{9} \\sum_{a=-1}^{1} \\sum_{b=-1}^{1} x_{i+a,\\,j+b}$$

At the borders, only the neighbors that exist are averaged. For the pixel in row 3, column 3 (counting from 1), the nine values are 146, 202, 255, 202, 0, 202, 202, 0, and 202, and their average is $\\approx 156.8$. It is a special case of convolution (lesson 11).

## Sound: sampling

A signal $s(t)$ is stored as $x[n] = s(n/f_s)$, with $f_s$ samples per second. The sampling theorem (Nyquist–Shannon; Shannon, 1949) says a signal with no frequencies above $B$ is fully determined by its samples if $f_s > 2B$. At $f_s = 16{,}000$ Hz, the rate to which Whisper resamples all audio (Radford et al., 2022), components up to 8 kHz can be represented. One minute is $16{,}000 \\times 60 = 960{,}000$ values. An audio CD uses 44,100 samples per second at 16 bits per sample (the “Red Book” standard).

In the demonstration the samples are joined with straight lines to show “what got stored”; a real converter reconstructs better, but information in a signal above $f_s/2$ cannot be recovered.

## Text: from codes to vectors

Unicode assigns a number, the *code point*, to each character: “N” is 78, “e” is 101, “u” is 117, “ñ” is 241. It is a label, not a meaning. Language models split text into *tokens* (lesson 20), each token is an integer, and an embedding table $E \\in \\mathbb{R}^{V \\times d}$ gives each one a vector $E_{\\text{id}} \\in \\mathbb{R}^{d}$, learned during training. In GPT-3 175B the model dimension is $d_{\\text{model}} = 12{,}288$ (Brown et al., 2020, table 2.1). The four features in the lesson ($d=4$) are made up; in a real model the features are learned and have no names. Closeness in the space, measured for example with the Euclidean distance $\\lVert \\mathbf{a}-\\mathbf{b}\\rVert$, gets filled with meaning in lesson 14.

## In code

\`\`\`python
import numpy as np

# the little face in grayscale (8x8), the same one from the lesson
face = np.array([
    [ 20,  20, 146, 146, 146, 146,  20,  20],
    [ 20, 146, 202, 255, 202, 202, 146,  20],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [146, 202, 202, 202, 202, 202, 202, 146],
    [146, 202,   0, 202, 202,   0, 202, 146],
    [ 20, 146, 202,   0,   0, 202, 146,  20],
    [ 20,  20, 146, 146, 146, 146,  20,  20],
], dtype=np.uint8)

vector = face.flatten()                 # from table to list, row by row
print(face.shape, vector.shape)         # (8, 8) (64,)

# a pixel and the one below it: neighbors in the image, far apart in the vector
i, j = 2, 2
print(i * 8 + j, (i + 1) * 8 + j)       # 18 26

# blur of one pixel: average of its 3x3 window
window = face[i - 1:i + 2, j - 1:j + 2]
print(window.mean())                    # 156.77777777777777

# a 12-megapixel color photo (4000 x 3000 pixels, 3 channels)
photo = np.zeros((3000, 4000, 3), dtype=np.uint8)
print(photo.shape, photo.size)          # (3000, 4000, 3) 36000000

# text: the code of each letter
print([ord(c) for c in "Neu"])          # [78, 101, 117]
\`\`\`

## What comes next

With the data in vectors, lesson 3 puts the first model on top: a line $y = wx + b$ and its error. Later, convolutions (lesson 11) recover pixel neighborhood, embeddings (lesson 14) give meaning a geometry, and tokens (lesson 20) explain which text “pieces” a language model really reads.`,
  },

  lens: {
    es: [
      'Lo que un modelo puede aprender tiene un techo: lo que sobrevive en los números. Resolución, compresión, frecuencia de muestreo y calidad de la transcripción fijan ese techo, y ninguna IA recupera lo que no se midió. Pregunta a qué calidad se captura lo que vas a usar.',
      'Más números por ejemplo significan más memoria y más cómputo. Una foto de 12 megapíxeles son unos 36 millones de valores, por eso los sistemas suelen reducir las imágenes antes de procesarlas. Pregunta qué versión ve realmente el modelo y cuánto detalle pierde.',
      '«Basura entra, basura sale»: otra cámara, otro micrófono o otro escáner producen números distintos aunque a ti te parezca lo mismo (como el desenfoque de la lección). Prueba el sistema con muestras de tu operación real, no solo con la demostración.',
      'Los números derivados de un rostro, una voz o un texto personal pueden seguir siendo datos personales. Trata la representación numérica con las mismas reglas de privacidad que el original.',
    ],
    en: [
      'What a model can learn has a ceiling: what survives in the numbers. Resolution, compression, sampling rate, and transcription quality set that ceiling, and no AI recovers what was never measured. Ask at what quality the data you will use is captured.',
      'More numbers per example mean more memory and more compute. A 12-megapixel photo is about 36 million values, which is why systems usually shrink images before processing them. Ask which version the model actually sees and how much detail it loses.',
      '“Garbage in, garbage out”: a different camera, microphone, or scanner produces different numbers even if it looks the same to you (like the lesson’s blur). Test the system with samples from your real operation, not only with the demo.',
      'Numbers derived from a face, a voice, or personal text can still be personal data. Treat the numeric representation under the same privacy rules as the original.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué recibe un modelo cuando le muestras una foto?', en: 'What does a model receive when you show it a photo?' },
      options: [
        { es: 'La imagen completa, tal como la ve una persona.', en: 'The whole image, just as a person sees it.' },
        { es: 'Una tabla de números con el brillo o el color de cada píxel.', en: 'A table of numbers with the brightness or color of each pixel.' },
        { es: 'Una descripción en palabras de lo que contiene la imagen.', en: 'A description in words of what the image contains.' },
        { es: 'Solo los bordes y las formas más importantes.', en: 'Only the edges and the most important shapes.' },
      ],
      answer: 1,
      why: { es: 'Dentro del modelo no hay «foto»: hay números. Reconocer una imagen es encontrar patrones en esa tabla, y eso se aprende de ejemplos.', en: 'There is no “photo” inside the model: there are numbers. Recognizing an image means finding patterns in that table, and that is learned from examples.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una imagen en color de 100 × 100 píxeles tiene tres canales. ¿Cuántos números la describen?', en: 'A color image of 100 × 100 pixels has three channels. How many numbers describe it?' },
      options: [
        { es: '10 000', en: '10,000' },
        { es: '300', en: '300' },
        { es: '30 000', en: '30,000' },
        { es: '3 000', en: '3,000' },
      ],
      answer: 2,
      why: { es: '100 × 100 = 10 000 píxeles, y cada uno guarda tres números (rojo, verde, azul): 10 000 × 3 = 30 000.', en: '100 × 100 = 10,000 pixels, and each one stores three numbers (red, green, blue): 10,000 × 3 = 30,000.' },
    },
    {
      kind: 'concept',
      q: { es: 'Desenfocas una imagen y a simple vista casi no cambia. ¿Qué ocurre con el vector que recibe el modelo?', en: 'You blur an image and at a glance it barely changes. What happens to the vector the model receives?' },
      options: [
        { es: 'Cambian muchos de sus números, aunque la imagen siga reconociéndose.', en: 'Many of its numbers change, even though the image is still recognizable.' },
        { es: 'No cambia: el modelo ve lo mismo que tú.', en: 'It does not change: the model sees what you see.' },
        { es: 'Se acorta, porque hay menos detalle que guardar.', en: 'It gets shorter, because there is less detail to store.' },
        { es: 'Conserva los mismos números, pero en otro orden.', en: 'It keeps the same numbers, but in a different order.' },
      ],
      answer: 0,
      why: { es: 'Cada píxel pasa a ser el promedio de sus vecinos, así que casi todos los números cambian. Para una persona la imagen es «la misma»; para el modelo es otra entrada.', en: 'Each pixel becomes the average of its neighbors, so almost every number changes. To a person the image is “the same”; to the model it is a different input.' },
    },
    {
      kind: 'apply',
      q: { es: 'Una empresa transcribe llamadas con IA. Para ahorrar espacio, guarda el audio con muy pocas muestras por segundo. ¿Cuál es el riesgo principal?', en: 'A company transcribes calls with AI. To save space, it stores the audio with very few samples per second. What is the main risk?' },
      options: [
        { es: 'El modelo necesitará más GPUs para transcribirlo.', en: 'The model will need more GPUs to transcribe it.' },
        { es: 'La transcripción saldrá en otro idioma.', en: 'The transcript will come out in another language.' },
        { es: 'El audio ocupará más espacio en disco.', en: 'The audio will take up more disk space.' },
        { es: 'Se pierde información del sonido que ningún modelo podrá recuperar.', en: 'Information in the sound is lost that no model will be able to recover.' },
      ],
      answer: 3,
      why: { es: 'Lo que no se midió no vuelve. Con pocas muestras se pierden los detalles rápidos de la voz, y ningún modelo, por grande que sea, puede reconstruirlos después.', en: 'What was not measured does not come back. With few samples the fast details of the voice are lost, and no model, however large, can rebuild them afterward.' },
    },
  ],

  glossary: ['pixel', 'vector', 'feature', 'tensor', 'training-data', 'model'],

  terms: [
    { id: 'pixel', term: { es: 'Píxel', en: 'Pixel' }, def: { es: 'El punto más pequeño de una imagen digital. En escala de grises es un número de 0 (negro) a 255 (blanco); en color son tres números (rojo, verde y azul).', en: 'The smallest dot of a digital image. In grayscale it is a number from 0 (black) to 255 (white); in color it is three numbers (red, green, and blue).' } },
    { id: 'vector', term: { es: 'Vector', en: 'Vector' }, def: { es: 'Lista ordenada de números. En aprendizaje automático, cada ejemplo llega al modelo como un vector.', en: 'An ordered list of numbers. In machine learning, each example reaches the model as a vector.' } },
    { id: 'feature', term: { es: 'Característica (feature)', en: 'Feature' }, def: { es: 'Una medida de un ejemplo expresada como número: el peso de una fruta, el brillo de un píxel. Las características de un ejemplo forman su vector.', en: 'One measurement of an example expressed as a number: the weight of a fruit, the brightness of a pixel. The features of an example make up its vector.' } },
    { id: 'tensor', term: { es: 'Tensor', en: 'Tensor' }, def: { es: 'Arreglo de números con cualquier cantidad de ejes: un vector tiene uno, una matriz dos, una imagen en color tres (alto, ancho y canales).', en: 'An array of numbers with any number of axes: a vector has one, a matrix has two, a color image has three (height, width, and channels).' } },
  ],

  sources: [
    { title: 'The MNIST database of handwritten digits', authors: 'LeCun, Y., Cortes, C., Burges, C. J. C.', year: 1998, url: 'http://yann.lecun.com/exdb/mnist/' },
    { title: 'Gradient-based learning applied to document recognition', authors: 'LeCun, Y., Bottou, L., Bengio, Y., Haffner, P.', year: 1998, url: 'https://doi.org/10.1109/5.726791' },
    { title: 'Robust Speech Recognition via Large-Scale Weak Supervision (Whisper)', authors: 'Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., Sutskever, I.', year: 2022, url: 'https://arxiv.org/abs/2212.04356' },
    { title: 'Communication in the Presence of Noise', authors: 'Shannon, C. E.', year: 1949, url: 'https://doi.org/10.1109/JRPROC.1949.232969' },
    { title: 'Language Models are Few-Shot Learners (GPT-3), tabla 2.1', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
  ],
});
