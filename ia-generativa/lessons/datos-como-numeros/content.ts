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
      es: 'En el correo bastaron dos medidas. Pero si el ejemplo es una imagen, ¿qué recibe el modelo? Una foto no es un número.',
      en: 'For the email, two measures were enough. But if the example is an image, what does the model receive? A photo is not a number.',
    },
    {
      id: 'pixels',
      es: 'Una imagen digital es una cuadrícula de píxeles. Esta tiene sesenta y cuatro, ocho por ocho, y cada uno es un cuadrito de un solo color.',
      en: 'A digital image is a grid of pixels. This one has sixty-four, eight by eight, and each is a small square of a single color.',
      note: { es: 'Píxel: el punto más pequeño de una imagen, de un solo color.', en: 'Pixel: the smallest dot of an image, a single color.' },
    },
    {
      id: 'brightness',
      es: 'Empecemos con grises. Cada píxel es un número, su brillo: de cero, negro, a doscientos cincuenta y cinco, blanco. Son los valores que caben en un byte: ocho casillas de cero o uno.',
      en: 'Let’s start with grays. Each pixel is a number, its brightness: from zero, black, to two hundred fifty-five, white. Those are the values that fit in one byte: eight boxes of zero or one.',
      tts: {
        es: 'Empecemos con grises. Cada píxel es un número, su brillo: de cero, negro, a doscientos cincuenta y cinco, blanco. Son los valores que caben en un bait: ocho casillas de cero o uno.',
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
      es: 'El modelo de los correos recibía una lista de medidas, no una tabla. Hagamos igual: las filas se leen una tras otra y se pegan en una lista de sesenta y cuatro números.',
      en: 'The email model took a list of measures, not a table. Let’s do the same: the rows are read one after another and glued into a list of sixty-four numbers.',
      pad: 0.6,
    },
    {
      id: 'feature',
      es: 'Cada número es una característica, o feature: una medida del ejemplo. Un correo tenía dos, enlaces y mayúsculas; esta imagen tiene sesenta y cuatro.',
      en: 'Each number is a feature: one measurement of the example. An email had two, links and capital letters; this image has sixty-four.',
      note: { es: 'Característica (feature): una medida de un ejemplo, como número.', en: 'Feature: one measurement of an example, as a number.' },
      pad: 0.3,
    },
    {
      id: 'vector',
      es: 'Esa lista ordenada de números se llama vector. Correo o imagen, el modelo recibe un vector por ejemplo; solo cambia su longitud: dos o sesenta y cuatro.',
      en: 'That ordered list of numbers is called a vector. Email or image, the model receives one vector per example; only the length changes: two or sixty-four.',
      note: { es: 'Vector: lista ordenada de números. Cada ejemplo es un vector.', en: 'Vector: an ordered list of numbers. Each example is a vector.' },
      pad: 0.3,
    },
    {
      id: 'paint-intro',
      es: 'Tu turno: pinta con el dedo o el ratón y mira cómo cambian la matriz y la lista. Con teclado, mueve la fila y la columna de abajo: el rastro pinta.',
      en: 'Your turn: paint with your finger or mouse and watch the matrix and the list change. With a keyboard, move the row and column below: the trail paints.',
      gate: {
        id: 'paint',
        prompt: { es: 'Pinta al menos diez píxeles, con el puntero o moviendo fila y columna.', en: 'Paint at least ten pixels, with the pointer or by moving row and column.' },
      },
      pad: 0.4,
    },
    {
      id: 'neighbors',
      es: 'La máquina solo recibe esta lista. Y aplanar esconde algo: un píxel y el de abajo son vecinos en la imagen, pero en la lista quedan a ocho lugares.',
      en: 'The machine only receives this list. And flattening hides something: a pixel and the one below it are neighbors in the image, but eight places apart in the list.',
      pad: 0.3,
    },
    {
      id: 'blur-intro',
      es: 'Volvamos a la carita y desenfoquémosla: cada píxel se acerca al promedio de sí mismo y sus ocho vecinos. Aquí, nueve números se vuelven uno.',
      en: 'Back to the little face, let’s blur it: each pixel moves toward the average of itself and its eight neighbors. Here, nine numbers become one.',
      pad: 0.5,
    },
    {
      id: 'blur-numbers',
      es: 'Con un desenfoque suave, compara las dos listas: los sesenta y cuatro números cambiaron y, aun así, sigues viendo la misma carita. Para el modelo, es otra entrada.',
      en: 'With a light blur, compare the two lists: all sixty-four numbers changed and, even so, you still see the same little face. To the model, this is a different input.',
      pad: 0.3,
    },
    {
      id: 'blur-try',
      es: 'Tu turno: sube el desenfoque poco a poco y mira cuánto se alejan los números de los originales. ¿Hasta dónde se reconoce la cara?',
      en: 'Your turn: raise the blur little by little and watch how far the numbers drift from the originals. How long is the face recognizable?',
      gate: {
        id: 'blur',
        prompt: { es: 'Lleva el desenfoque hasta el máximo (cien por ciento).', en: 'Raise the blur to the maximum (one hundred percent).' },
      },
      pad: 0.4,
    },
    {
      id: 'blur-reflect',
      es: 'Desenfocar es una operación entre números. Con el desenfoque completo, dos imágenes distintas pueden dar exactamente el mismo resultado. Combinar vecinos reaparecerá en las convoluciones.',
      en: 'Blurring is an operation on numbers. With the full blur, two different images can give exactly the same result. Combining neighbors will return in convolutions.',
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
      es: 'Tu turno: con esas muestras se reconstruye la onda, línea discontinua. Baja las muestras por segundo y mira cuándo deja de coincidir con la original.',
      en: 'Your turn: those samples rebuild the wave, dashed line. Lower the samples per second and watch when it stops matching the original.',
      gate: {
        id: 'rate',
        prompt: { es: 'Baja las muestras hasta que la onda reconstruida ya no coincida con la original.', en: 'Lower the samples until the rebuilt wave no longer matches the original.' },
      },
      pad: 0.4,
    },
    {
      id: 'sound-reflect',
      es: 'El tono más rápido sube y baja quinientas veces por segundo. Hay que medir más del doble: más de mil. Por debajo, lo que no se midió no vuelve.',
      en: 'The fastest tone goes up and down five hundred times per second. You must measure more than double: over one thousand. Below that, what was not measured does not come back.',
      pad: 0.4,
    },
    {
      id: 'sound-real',
      es: 'El audio real funciona igual. Whisper, un modelo de voz, lo convierte a dieciséis mil muestras por segundo: un minuto son novecientos sesenta mil números.',
      en: 'Real audio works the same way. Whisper, a speech model, converts it to sixteen thousand samples per second: one minute is nine hundred sixty thousand numbers.',
      tts: {
        es: 'El audio real funciona igual. uísper, un modelo de voz, lo convierte a dieciséis mil muestras por segundo: un minuto son novecientos sesenta mil números.',
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
      es: 'Pero un código es solo una etiqueta: «gato» y «dato» casi comparten códigos y no se parecen; «gato» y «felino» se parecen, y sus códigos no.',
      en: 'But a code is only a label: “cat” and “car” almost share codes and are unrelated; “cat” and “feline” are related, and their codes are not.',
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
      es: 'Ahora sí: gato y perro quedan cerca; gato y pan, lejos. Aquí los rasgos son inventados; un modelo real los aprende de los datos. Esa idea, los embeddings, tiene su lección.',
      en: 'Now it works: cat and dog land close together; cat and bread, far apart. Here the features are made up; a real model learns them from data. That idea, embeddings, has its own lesson.',
      tts: {
        es: 'Ahora sí: gato y perro quedan cerca; gato y pan, lejos. Aquí los rasgos son inventados; un modelo real los aprende de los datos. Esa idea, los embédins, tiene su lección.',
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
      id: 'photo-shrink',
      es: 'Por eso los sistemas suelen reducir las imágenes. AlexNet, en dos mil doce, las bajó a doscientos cincuenta y seis por doscientos cincuenta y seis: casi doscientos mil números.',
      en: 'That is why systems usually shrink images. AlexNet, in twenty twelve, downsized them to two hundred fifty-six by two hundred fifty-six: nearly two hundred thousand numbers.',
      tts: {
        es: 'Por eso los sistemas suelen reducir las imágenes. Álex net, en dos mil doce, las bajó a doscientos cincuenta y seis por doscientos cincuenta y seis: casi doscientos mil números.',
      },
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
      'El sonido se guarda midiendo la señal muchas veces por segundo (muestras). Si se mide menos del doble de veces por segundo que el tono más rápido, se pierde información que ningún modelo recupera después.',
      'El texto también se convierte en vectores. Un código por letra solo etiqueta; los vectores aprendidos hacen que lo cercano en números sea cercano en significado.',
      'Una imagen casi igual para ti puede ser un vector distinto para el modelo: un desenfoque suave cambia todos los números de la carita.',
    ],
    en: [
      'A model only receives numbers. A grayscale image is a table of brightness values from 0 (black) to 255 (white); in color it is three tables, one per channel (red, green, blue).',
      'Flattening the table gives a vector: an ordered list with one feature per pixel. Each example reaches the model as a vector or a tensor.',
      'A color image of height × width pixels has height × width × 3 numbers. A 12-megapixel photo has about 36 million.',
      'Sound is stored by measuring the signal many times per second (samples). If you measure fewer than twice per second the fastest tone, information is lost that no model can recover later.',
      'Text is also turned into vectors. One code per letter is only a label; learned vectors make close in numbers mean close in meaning.',
      'An image that looks nearly the same to you can be a different vector to the model: a light blur changes every number of the little face.',
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

La vecindad se pierde al aplanar: el píxel $(i,j)$ y el $(i+1,j)$ son vecinos en la imagen, pero sus posiciones en el vector difieren en $W$ (ocho, en la carita). Un modelo que trata cada componente como una medida independiente, como el de los correos de la lección 1 o una red totalmente conectada, no sabe cuáles píxeles son vecinos; las redes convolucionales (lección 11) sí lo aprovechan y reciben la imagen como matriz.

## Color, canales y tensores

Una imagen en color es un tensor $X \\in \\{0,\\dots,255\\}^{H \\times W \\times 3}$ con $3HW$ valores. Una foto de 12 megapíxeles, por ejemplo de $4000 \\times 3000$ píxeles, tiene

$$12\\,000\\,000 \\times 3 = 36\\,000\\,000 \\text{ valores}$$

es decir, unos 36 MB sin comprimir a un byte por valor. Los archivos como JPEG ocupan mucho menos, pero el modelo trabaja con los píxeles ya decodificados (o con una versión reducida: AlexNet, por ejemplo, redujo todas las imágenes de ImageNet a $256 \\times 256$ —reescalando el lado corto a 256 y recortando el centro—, o sea $256 \\times 256 \\times 3 = 196\\,608$ valores, unas 183 veces menos que la foto de 12 megapíxeles; la red recibía además recortes de $224 \\times 224 \\times 3 = 150\\,528$ valores; Krizhevsky et al., 2012). El orden de los ejes depende de la biblioteca: alto × ancho × canales, o canales × alto × ancho. En rigor, un número, un vector y una matriz también son tensores (de 0, 1 y 2 ejes).

En la lección, el gris de cada píxel sale de su color con la receta de luma de la recomendación ITU-R BT.601 (versión 7, 2011): $Y' = 0.299\\,R' + 0.587\\,G' + 0.114\\,B'$, aplicada a valores ya corregidos con gamma. Con tres canales de 8 bits hay $256^3 = 16\\,777\\,216$ colores posibles.

## Desenfoque: mezclar con los vecinos

El desenfoque de la lección mezcla cada píxel con el promedio de su ventana $3\\times 3$, en una proporción $\\lambda$:

$$y_{ij} = (1-\\lambda)\\,x_{ij} + \\lambda\\,\\frac{1}{|V_{ij}|} \\sum_{(a,b)\\in V_{ij}} x_{i+a,\\,j+b}$$

con $\\lambda = 0,\\ 0.25,\\ 0.5,\\ 0.75,\\ 1$ en los niveles 0 a 4, y $V_{ij}$ la ventana restringida a los vecinos que existen (9 píxeles en el interior, 6 en los bordes, 4 en las esquinas). Para el píxel de la fila 3, columna 3 (contando desde 1), los nueve valores son 146, 202, 255, 202, 0, 202, 202, 0 y 202, y su promedio es $\\approx 156.8$. Es un caso particular de convolución (lección 11). Medido sobre la carita (valores redondeados a enteros): en cada nivel de 1 a 4 cambian los 64 números, con un cambio medio de 15.0, 29.9, 44.9 y 59.9 niveles de gris (de 255), y el contraste (máximo menos mínimo) baja de 255 a 205, 175, 145 y 131.

Con $\\lambda < 1$ la operación se puede deshacer en teoría (la matriz es invertible; con $\\lambda = 0.75$ ya amplifica 40 veces el redondeo), pero con $\\lambda = 1$ pierde información de verdad. La suma de una ventana es $K \\otimes K$, con $K$ la matriz $8\\times 8$ tridiagonal de unos, y $K$ tiene un vector nulo, $u = (1,-1,0,1,-1,0,1,-1)$: tres vecinos seguidos siempre suman cero. Por eso el desenfoque completo tiene rango $7 \\times 7 = 49$, no 64, y desaparecen 15 direcciones. Ejemplo exacto: sumar $+25,-25,0,+25,-25,0,+25,-25$ a la columna 4 de la carita cambia seis píxeles y da otra imagen con el mismo desenfoque completo, número por número.

## Sonido: muestreo

Una señal $s(t)$ se guarda como $x[n] = s(n/f_s)$, con $f_s$ muestras por segundo. Shannon (1949, teorema 1) lo enuncia así: si una función no tiene frecuencias por encima de $W$, queda completamente determinada por sus valores en puntos separados $1/2W$ segundos; en la práctica se pide $f_s > 2B$ para una señal sin frecuencias por encima de $B$ (en el límite exacto, $f_s = 2B$, el tono de frecuencia $B$ no queda determinado, como se ve en la demostración). Shannon atribuye a Nyquist la importancia de ese intervalo. Whisper remuestrea todo el audio a $f_s = 16\\,000$ Hz (Radford et al., 2022, sección 2.2), con lo que se representan componentes de hasta 8 kHz: un minuto son $16\\,000 \\times 60 = 960\\,000$ valores. El modelo no recibe esos valores tal cual: calcula un espectrograma logarítmico de 80 canales con ventanas de 25 ms y paso de 10 ms, es decir 100 columnas por segundo, $80 \\times 100 = 8\\,000$ números por segundo.

La señal de juguete de la lección suma un tono de 200 y otro de 500 ciclos por segundo y se repite cada 10 ms; se toman $n = f_s/100$ muestras por periodo. La línea discontinua es lo que reconstruiría un conversor ideal (interpolación trigonométrica de las $n$ muestras). Se comprobó con el código de la lección: con $f_s \\ge 1\\,100$ la reconstrucción coincide con la señal sin error; con $f_s = 1\\,000$ el error relativo es 0.43 (el tono de 500 queda justo en el límite) y por debajo es aún mayor (de 0.67 a 1.65). Por eso la compuerta pide bajar a 1 000 o menos.

## Texto: de códigos a vectores

Unicode asigna un número, el *punto de código*, a cada carácter: «N» es 78, «e» es 101, «u» es 117, «ñ» es 241 (tablas de códigos del estándar Unicode). Es una etiqueta, no un significado. Los modelos de lenguaje parten el texto en *tokens* (lección 20), cada token es un entero, y una tabla de embeddings $E \\in \\mathbb{R}^{V \\times d}$ entrega a cada uno un vector $E_{\\text{id}} \\in \\mathbb{R}^{d}$, aprendido durante el entrenamiento. En GPT-3 175B la dimensión del modelo es $d_{\\text{model}} = 12\\,288$ (Brown et al., 2020, tabla 2.1). Los cuatro rasgos de la lección ($d=4$) son inventados; en un modelo real los rasgos se aprenden y no tienen nombre. La cercanía en el espacio, medida por ejemplo con la distancia euclídea $\\lVert \\mathbf{a}-\\mathbf{b}\\rVert$, se llena de significado en la lección 14. En la lección, «gato» y «perro» están a 0.22; «gato» y «tigre», a 1.08; «gato» y «pan», a 1.68.

MNIST (LeCun et al., 1998) parte de dígitos escritos por empleados de la Oficina del Censo de EE. UU. y por estudiantes de secundaria (bases NIST SD-3 y SD-1). Las imágenes originales eran en blanco y negro; al normalizarlas a una caja de $20\\times 20$ píxeles aparecieron los grises, y se centraron en un cuadro de $28\\times 28$ por el centro de masa. La imagen de la lección es una ilustración, no un dígito del conjunto.

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

# desenfoque de toda la imagen (en los bordes, solo los vecinos que existen)
def desenfoque(img):
    out = np.zeros(img.shape)
    for r in range(8):
        for c in range(8):
            out[r, c] = img[max(r - 1, 0):r + 2, max(c - 1, 0):c + 2].mean()
    return out

x = carita.astype(float)
otra = x.copy()
otra[:, 3] += [25, -25, 0, 25, -25, 0, 25, -25]    # otra imagen: seis píxeles distintos
print(int((otra != x).sum()), np.abs(desenfoque(x) - desenfoque(otra)).max())   # 6 0.0

# desenfoque suave (25 %): todos los números cambian, pero poco
suave = 0.75 * x + 0.25 * desenfoque(x)
print(round(np.abs(suave - x).mean(), 1), int((np.round(suave) != x).sum()))    # 15.0 64

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

Neighborhood is lost when flattening: pixel $(i,j)$ and pixel $(i+1,j)$ are neighbors in the image, but their positions in the vector differ by $W$ (eight, for the little face). A model that treats each component as an independent measure, like the email model of lesson 1 or a fully connected network, does not know which pixels are neighbors; convolutional networks (lesson 11) do exploit it and receive the image as a matrix.

## Color, channels, and tensors

A color image is a tensor $X \\in \\{0,\\dots,255\\}^{H \\times W \\times 3}$ with $3HW$ values. A 12-megapixel photo, for example $4000 \\times 3000$ pixels, has

$$12{,}000{,}000 \\times 3 = 36{,}000{,}000 \\text{ values}$$

that is, about 36 MB uncompressed at one byte per value. Files like JPEG are much smaller, but the model works with the decoded pixels (or with a downsized version: AlexNet, for example, downsized every ImageNet image to $256 \\times 256$ —rescaling the short side to 256 and cropping the center—, that is $256 \\times 256 \\times 3 = 196{,}608$ values, about 183 times fewer than the 12-megapixel photo; the network also took $224 \\times 224 \\times 3 = 150{,}528$-value crops; Krizhevsky et al., 2012). The order of the axes depends on the library: height × width × channels, or channels × height × width. Strictly, a number, a vector, and a matrix are also tensors (with 0, 1, and 2 axes).

In the lesson, the gray of each pixel comes from its color with the luma recipe of Recommendation ITU-R BT.601 (version 7, 2011): $Y' = 0.299\\,R' + 0.587\\,G' + 0.114\\,B'$, applied to gamma-corrected values. With three 8-bit channels there are $256^3 = 16{,}777{,}216$ possible colors.

## Blur: mixing with the neighbors

The lesson’s blur mixes each pixel with the average of its $3\\times 3$ window, in a proportion $\\lambda$:

$$y_{ij} = (1-\\lambda)\\,x_{ij} + \\lambda\\,\\frac{1}{|V_{ij}|} \\sum_{(a,b)\\in V_{ij}} x_{i+a,\\,j+b}$$

with $\\lambda = 0,\\ 0.25,\\ 0.5,\\ 0.75,\\ 1$ at levels 0 to 4, and $V_{ij}$ the window restricted to the neighbors that exist (9 pixels in the interior, 6 on the borders, 4 at the corners). For the pixel in row 3, column 3 (counting from 1), the nine values are 146, 202, 255, 202, 0, 202, 202, 0, and 202, and their average is $\\approx 156.8$. It is a special case of convolution (lesson 11). Measured on the little face (values rounded to integers): at each level from 1 to 4 all 64 numbers change, with a mean change of 15.0, 29.9, 44.9, and 59.9 gray levels (out of 255), and the contrast (maximum minus minimum) drops from 255 to 205, 175, 145, and 131.

With $\\lambda < 1$ the operation can be undone in theory (the matrix is invertible; at $\\lambda = 0.75$ it already amplifies rounding 40 times), but with $\\lambda = 1$ it really loses information. The sum over a window is $K \\otimes K$, with $K$ the $8\\times 8$ tridiagonal matrix of ones, and $K$ has a null vector, $u = (1,-1,0,1,-1,0,1,-1)$: three consecutive neighbors always sum to zero. So the full blur has rank $7 \\times 7 = 49$, not 64, and 15 directions vanish. Exact example: adding $+25,-25,0,+25,-25,0,+25,-25$ to column 4 of the little face changes six pixels and gives another image with the same full blur, number by number.

## Sound: sampling

A signal $s(t)$ is stored as $x[n] = s(n/f_s)$, with $f_s$ samples per second. Shannon (1949, theorem 1) states it like this: if a function contains no frequencies higher than $W$, it is completely determined by its values at points spaced $1/2W$ seconds apart; in practice one asks for $f_s > 2B$ for a signal with no frequencies above $B$ (at the exact limit, $f_s = 2B$, the tone of frequency $B$ is not determined, as the demonstration shows). Shannon credits Nyquist with the importance of that interval. Whisper resamples all audio to $f_s = 16{,}000$ Hz (Radford et al., 2022, section 2.2), which represents components up to 8 kHz: one minute is $16{,}000 \\times 60 = 960{,}000$ values. The model does not receive those values as they are: it computes an 80-channel log-magnitude spectrogram with 25 ms windows and a 10 ms stride, that is 100 columns per second, $80 \\times 100 = 8{,}000$ numbers per second.

The lesson’s toy signal adds a tone of 200 and one of 500 cycles per second and repeats every 10 ms; $n = f_s/100$ samples are taken per period. The dashed line is what an ideal converter would rebuild (trigonometric interpolation of the $n$ samples). It was checked with the lesson’s code: with $f_s \\ge 1{,}100$ the reconstruction matches the signal with no error; with $f_s = 1{,}000$ the relative error is 0.43 (the 500 tone sits right at the limit) and below that it is larger still (0.67 to 1.65). That is why the gate asks you to lower it to 1,000 or less.

## Text: from codes to vectors

Unicode assigns a number, the *code point*, to each character: “N” is 78, “e” is 101, “u” is 117, “ñ” is 241 (Unicode Standard code charts). It is a label, not a meaning. Language models split text into *tokens* (lesson 20), each token is an integer, and an embedding table $E \\in \\mathbb{R}^{V \\times d}$ gives each one a vector $E_{\\text{id}} \\in \\mathbb{R}^{d}$, learned during training. In GPT-3 175B the model dimension is $d_{\\text{model}} = 12{,}288$ (Brown et al., 2020, table 2.1). The four features in the lesson ($d=4$) are made up; in a real model the features are learned and have no names. Closeness in the space, measured for example with the Euclidean distance $\\lVert \\mathbf{a}-\\mathbf{b}\\rVert$, gets filled with meaning in lesson 14. In the lesson, “cat” and “dog” are 0.22 apart; “cat” and “tiger”, 1.08; “cat” and “bread”, 1.68.

MNIST (LeCun et al., 1998) starts from digits written by US Census Bureau employees and by high-school students (NIST databases SD-3 and SD-1). The original images were black and white; normalizing them into a $20\\times 20$ pixel box introduced the grays, and they were centered in a $28\\times 28$ field by center of mass. The image in the lesson is an illustration, not a digit from the set.

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

# blur of the whole image (at the borders, only the neighbors that exist)
def blur(img):
    out = np.zeros(img.shape)
    for r in range(8):
        for c in range(8):
            out[r, c] = img[max(r - 1, 0):r + 2, max(c - 1, 0):c + 2].mean()
    return out

x = face.astype(float)
other = x.copy()
other[:, 3] += [25, -25, 0, 25, -25, 0, 25, -25]   # another image: six different pixels
print(int((other != x).sum()), np.abs(blur(x) - blur(other)).max())   # 6 0.0

# light blur (25 %): every number changes, but only a little
light = 0.75 * x + 0.25 * blur(x)
print(round(np.abs(light - x).mean(), 1), int((np.round(light) != x).sum()))    # 15.0 64

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
      'Lo que un modelo puede aprender tiene un techo: lo que sobrevive en los números. Resolución, compresión, frecuencia de muestreo y calidad de la transcripción fijan ese techo, y ninguna IA recupera con certeza lo que no se midió (puede inventar algo plausible). Pregunta a qué calidad se captura lo que vas a usar.',
      'Más números por ejemplo significan más memoria y más cómputo. Una foto de 12 megapíxeles son unos 36 millones de valores, por eso los sistemas suelen reducir las imágenes antes de procesarlas (AlexNet las bajó a 256 × 256 en 2012). Pregunta qué versión ve realmente el modelo y cuánto detalle pierde.',
      '«Basura entra, basura sale»: otra cámara, otro micrófono o otro escáner producen números distintos aunque a ti te parezca lo mismo (como el desenfoque suave de la lección, que cambia los 64 números de la carita). Prueba el sistema con muestras de tu operación real, no solo con la demostración.',
      'Si con esos números se puede identificar a alguien, siguen siendo datos personales: el RGPD europeo (art. 4) llama datos personales a cualquier información sobre una persona identificable, y biométricos a los que resultan de procesar técnicamente sus rasgos físicos para identificarla, como las imágenes faciales. Trata la representación numérica con las mismas reglas de privacidad que el original.',
    ],
    en: [
      'What a model can learn has a ceiling: what survives in the numbers. Resolution, compression, sampling rate, and transcription quality set that ceiling, and no AI recovers with certainty what was never measured (it may invent something plausible). Ask at what quality the data you will use is captured.',
      'More numbers per example mean more memory and more compute. A 12-megapixel photo is about 36 million values, which is why systems usually shrink images before processing them (AlexNet brought them down to 256 × 256 in 2012). Ask which version the model actually sees and how much detail it loses.',
      '“Garbage in, garbage out”: a different camera, microphone, or scanner produces different numbers even if it looks the same to you (like the lesson’s light blur, which changes all 64 numbers of the little face). Test the system with samples from your real operation, not only with the demo.',
      'If those numbers can identify someone, they are still personal data: the EU’s GDPR (art. 4) calls personal data any information about an identifiable person, and biometric data what results from technical processing of their physical features to identify them, such as facial images. Treat the numeric representation under the same privacy rules as the original.',
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
      q: { es: 'Desenfocas una imagen apenas un poco y a simple vista sigue siendo la misma. ¿Qué ocurre con el vector que recibe el modelo?', en: 'You blur an image just slightly and at a glance it still looks the same. What happens to the vector the model receives?' },
      options: [
        { es: 'Cambian muchos de sus números, aunque la imagen siga reconociéndose.', en: 'Many of its numbers change, even though the image is still recognizable.' },
        { es: 'No cambia: el modelo ve lo mismo que tú.', en: 'It does not change: the model sees what you see.' },
        { es: 'Se acorta, porque hay menos detalle que guardar.', en: 'It gets shorter, because there is less detail to store.' },
        { es: 'Conserva los mismos números, pero en otro orden.', en: 'It keeps the same numbers, but in a different order.' },
      ],
      answer: 0,
      why: { es: 'Cada píxel se mezcla con sus vecinos, así que casi todos los números cambian, aunque sea poco. Para una persona la imagen es «la misma»; para el modelo es otra entrada.', en: 'Each pixel is mixed with its neighbors, so almost every number changes, even if only a little. To a person the image is “the same”; to the model it is a different input.' },
    },
    {
      kind: 'apply',
      q: { es: 'Una empresa transcribe llamadas con IA. Para ahorrar espacio, guarda el audio con muy pocas muestras por segundo. ¿Cuál es el riesgo principal?', en: 'A company transcribes calls with AI. To save space, it stores the audio with very few samples per second. What is the main risk?' },
      options: [
        { es: 'El modelo necesitará más GPUs para transcribirlo.', en: 'The model will need more GPUs to transcribe it.' },
        { es: 'Ninguno: un modelo grande reconstruye lo que falte.', en: 'None: a large model rebuilds whatever is missing.' },
        { es: 'El audio ocupará más espacio en disco.', en: 'The audio will take up more disk space.' },
        { es: 'Se pierde información del sonido que ningún modelo podrá recuperar.', en: 'Information in the sound is lost that no model will be able to recover.' },
      ],
      answer: 3,
      why: { es: 'Lo que no se midió no vuelve. Con muy pocas muestras se pierden los detalles rápidos de la voz, y ningún modelo, por grande que sea, puede reconstruirlos con certeza después; solo puede adivinar.', en: 'What was not measured does not come back. With very few samples the fast details of the voice are lost, and no model, however large, can rebuild them with certainty afterward; it can only guess.' },
    },
  ],

  glossary: ['pixel', 'vector', 'feature', 'tensor', 'training-data', 'model', 'convolution', 'embedding'],

  terms: [
    { id: 'pixel', term: { es: 'Píxel', en: 'Pixel' }, def: { es: 'El punto más pequeño de una imagen digital. En escala de grises es un número de 0 (negro) a 255 (blanco); en color son tres números (rojo, verde y azul).', en: 'The smallest dot of a digital image. In grayscale it is a number from 0 (black) to 255 (white); in color it is three numbers (red, green, and blue).' } },
    { id: 'vector', term: { es: 'Vector', en: 'Vector' }, def: { es: 'Lista ordenada de números. En aprendizaje automático, cada ejemplo llega al modelo como un vector.', en: 'An ordered list of numbers. In machine learning, each example reaches the model as a vector.' } },
    { id: 'feature', term: { es: 'Característica (feature)', en: 'Feature' }, def: { es: 'Una medida de un ejemplo expresada como número: el número de enlaces de un correo, el brillo de un píxel. Las características de un ejemplo forman su vector.', en: 'One measurement of an example expressed as a number: the number of links in an email, the brightness of a pixel. The features of an example make up its vector.' } },
    { id: 'tensor', term: { es: 'Tensor', en: 'Tensor' }, def: { es: 'Arreglo de números con cualquier cantidad de ejes: un vector tiene uno, una matriz dos, una imagen en color tres (alto, ancho y canales).', en: 'An array of numbers with any number of axes: a vector has one, a matrix has two, a color image has three (height, width, and channels).' } },
  ],

  sources: [
    { title: 'The MNIST database of handwritten digits (copia archivada de la página de LeCun, Cortes y Burges; la página en vivo ya solo lista los archivos)', authors: 'LeCun, Y., Cortes, C., Burges, C. J. C.', year: 1998, url: 'http://web.archive.org/web/20230111040356/http://yann.lecun.com/exdb/mnist/' },
    { title: 'Gradient-based learning applied to document recognition (origen y tamaño de MNIST, sección III-A)', authors: 'LeCun, Y., Bottou, L., Bengio, Y., Haffner, P.', year: 1998, url: 'https://doi.org/10.1109/5.726791' },
    { title: 'Robust Speech Recognition via Large-Scale Weak Supervision (Whisper), sección 2.2', authors: 'Radford, A., Kim, J. W., Xu, T., Brockman, G., McLeavey, C., Sutskever, I.', year: 2022, url: 'https://arxiv.org/abs/2212.04356' },
    { title: 'Communication in the Presence of Noise (teorema 1: muestreo)', authors: 'Shannon, C. E.', year: 1949, url: 'https://doi.org/10.1109/JRPROC.1949.232969' },
    { title: 'Language Models are Few-Shot Learners (GPT-3), tabla 2.1', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'ImageNet Classification with Deep Convolutional Neural Networks (AlexNet), sección 2: imágenes reducidas a 256 × 256', authors: 'Krizhevsky, A., Sutskever, I., Hinton, G. E.', year: 2012, url: 'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html' },
    { title: 'Recommendation ITU-R BT.601-7: Studio encoding parameters of digital television for standard 4:3 and wide-screen 16:9 aspect ratios (la receta de luma del gris)', authors: 'ITU-R (Unión Internacional de Telecomunicaciones)', year: 2011, url: 'https://www.itu.int/rec/R-REC-BT.601' },
    { title: 'The Unicode Standard, Version 18.0: código de cada carácter (C0 Controls and Basic Latin)', authors: 'The Unicode Consortium', year: 2026, url: 'https://www.unicode.org/charts/PDF/U0000.pdf' },
    { title: 'The Unicode Standard, Version 18.0: código de «ñ» (C1 Controls and Latin-1 Supplement)', authors: 'The Unicode Consortium', year: 2026, url: 'https://www.unicode.org/charts/PDF/U0080.pdf' },
    { title: 'Regulation (EU) 2016/679 (GDPR), art. 4: datos personales y datos biométricos', authors: 'Parlamento Europeo y Consejo de la UE', year: 2016, url: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj' },
  ],
});
