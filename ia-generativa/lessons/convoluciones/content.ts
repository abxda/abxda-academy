import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'convoluciones',

  objectives: {
    es: [
      'Explicar qué hace un kernel de convolución y calcular a mano un valor de salida de un kernel de tres por tres.',
      'Entender por qué compartir pesos hace posible procesar imágenes con muy pocos parámetros.',
      'Describir cómo las capas apiladas pasan de bordes a partes y a objetos, y qué limita a estas redes.',
    ],
    en: [
      'Explain what a convolution kernel does and compute by hand one output value of a three-by-three kernel.',
      'Understand why sharing weights makes it possible to process images with very few parameters.',
      'Describe how stacked layers go from edges to parts to objects, and what limits these networks.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Una imagen de cien por cien píxeles tiene diez mil valores. Conectar cada uno a mil neuronas exige diez millones de pesos, solo en la primera capa.',
      en: 'A one-hundred-by-one-hundred pixel image has ten thousand values. Connecting each one to a thousand neurons takes ten million weights, in the first layer alone.',
      note: { es: 'Conectarlo todo con todo no escala en imágenes.', en: 'Connecting everything to everything does not scale for images.' },
    },
    {
      id: 'problem',
      es: 'Además, esa red no sabe que los píxeles vecinos se parecen, ni que un borde es el mismo borde esté donde esté. Habría que aprenderlo todo desde cero, posición por posición.',
      en: 'Besides, that network does not know that neighboring pixels look alike, or that an edge is the same edge wherever it is. It would have to learn everything from scratch, position by position.',
    },
    {
      id: 'idea',
      es: 'La idea de las convoluciones: una ventana pequeña que recorre la imagen buscando el mismo patrón en todas partes.',
      en: 'The idea of convolutions: a small window that sweeps across the image looking for the same pattern everywhere.',
      note: { es: 'Convolución: una ventana que busca el mismo patrón en toda la imagen.', en: 'Convolution: a window that looks for the same pattern across the image.' },
    },
    {
      id: 'kernel',
      es: 'Esa ventana se llama kernel y es una cuadrícula de pesos. En cada posición multiplica cada píxel por su peso, suma todo, y el resultado es un píxel nuevo.',
      en: 'That window is called a kernel and it is a grid of weights. At each position it multiplies each pixel by its weight, adds everything up, and the result is a new pixel.',
      pad: 0.5,
    },
    {
      id: 'vertical',
      es: 'Este kernel, con pesos negativos a la izquierda y positivos a la derecha, responde donde el brillo cambia de izquierda a derecha: detecta bordes verticales.',
      en: 'This kernel, with negative weights on the left and positive weights on the right, responds where brightness changes from left to right: it detects vertical edges.',
      note: { es: 'Kernel de bordes verticales: negativos a la izquierda, positivos a la derecha.', en: 'Vertical-edge kernel: negatives on the left, positives on the right.' },
      pad: 0.5,
    },
    {
      id: 'horizontal',
      es: 'Si giramos el kernel, detecta bordes horizontales. El mismo mecanismo, otro patrón.',
      en: 'If we rotate the kernel, it detects horizontal edges. The same mechanism, another pattern.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: elige distintos kernels y mueve la ventana sobre la imagen para ver cómo se calcula cada píxel de salida.',
      en: 'Your turn: pick different kernels and move the window over the image to see how each output pixel is computed.',
      gate: {
        id: 'kernels',
        prompt: { es: 'Prueba al menos tres kernels distintos y toca la imagen para mover la ventana.', en: 'Try at least three different kernels and touch the image to move the window.' },
      },
      pad: 0.4,
    },
    {
      id: 'shared',
      es: 'Lo importante es que el mismo kernel se usa en toda la imagen. Nueve pesos y un sesgo bastan, sin importar si la imagen es pequeña o enorme.',
      en: 'What matters is that the same kernel is used across the whole image. Nine weights and a bias are enough, no matter whether the image is small or huge.',
      note: { es: 'Pesos compartidos: un kernel de 3×3 son 10 parámetros, sin importar el tamaño de la imagen.', en: 'Shared weights: a 3×3 kernel is 10 parameters, whatever the image size.' },
      pad: 0.5,
    },
    {
      id: 'learned',
      es: 'Y en una red, esos nueve números no se eligen a mano: se aprenden con retropropagación, como cualquier otro peso. Las primeras capas suelen aprender detectores de bordes y de color.',
      en: 'And in a network, those nine numbers are not chosen by hand: they are learned with backpropagation, like any other weight. The first layers usually learn edge and color detectors.',
      pad: 0.5,
    },
    {
      id: 'maps',
      es: 'Una capa tiene muchos kernels a la vez, y cada uno produce su propio mapa de características: uno resalta bordes verticales, otro horizontales, otro zonas claras.',
      en: 'A layer has many kernels at once, and each produces its own feature map: one highlights vertical edges, another horizontal ones, another bright areas.',
      note: { es: 'Mapa de características: la salida de un kernel.', en: 'Feature map: the output of a kernel.' },
      pad: 0.5,
    },
    {
      id: 'pooling',
      es: 'Luego viene el pooling: de cada bloque de dos por dos se conserva solo el valor más alto. La imagen se encoge y la red se vuelve menos sensible a pequeños desplazamientos.',
      en: 'Then comes pooling: from each two-by-two block only the highest value is kept. The image shrinks and the network becomes less sensitive to small shifts.',
      note: { es: 'Pooling: resume cada bloque con su máximo.', en: 'Pooling: summarizes each block by its maximum.' },
      pad: 0.5,
    },
    {
      id: 'hierarchy',
      es: 'Al apilar capas, lo simple se combina en lo complejo: bordes, luego esquinas y partes, luego objetos enteros. Nadie programó esa jerarquía: emerge del entrenamiento.',
      en: 'By stacking layers, the simple combines into the complex: edges, then corners and parts, then whole objects. Nobody programmed that hierarchy: it emerges from training.',
      note: { es: 'Jerarquía: bordes → partes → objetos.', en: 'Hierarchy: edges → parts → objects.' },
      pad: 0.6,
    },
    {
      id: 'cnn',
      es: 'Una red convolucional repite convolución, activación y pooling. El mapa se achica y los canales crecen, hasta unas capas finales que deciden la clase.',
      en: 'A convolutional network repeats convolution, activation, and pooling. The map shrinks and the channels grow, up to some final layers that decide the class.',
      pad: 0.6,
    },
    {
      id: 'try2',
      es: 'Tu turno, ahora al revés: observa la franja vertical de la imagen y predice cuál de estos kernels la resaltará más.',
      en: 'Your turn, now the other way around: look at the vertical stripe in the image and predict which of these kernels will highlight it most.',
      gate: {
        id: 'predict',
        prompt: { es: 'Elige un kernel; después comprueba el resultado.', en: 'Pick a kernel; then check the result.' },
      },
      pad: 0.4,
    },
    {
      id: 'history',
      es: 'Esta idea es antigua. En 1989, Yann LeCun y su equipo entrenaron una red convolucional para leer códigos postales manuscritos; en 1998 llegó LeNet-5.',
      en: 'This idea is old. In 1989, Yann LeCun and his team trained a convolutional network to read handwritten zip codes; in 1998 came LeNet-5.',
      tts: {
        es: 'Esta idea es antigua. En mil novecientos ochenta y nueve, Yann LeCun y su equipo entrenaron una red convolucional para leer códigos postales manuscritos; en mil novecientos noventa y ocho llegó LeNet cinco.',
        en: 'This idea is old. In nineteen eighty-nine, Yann LeCun and his team trained a convolutional network to read handwritten zip codes; in nineteen ninety-eight came LeNet five.',
      },
      note: { es: '1989: códigos postales. 1998: LeNet-5.', en: '1989: zip codes. 1998: LeNet-5.' },
      pad: 0.4,
    },
    {
      id: 'limits',
      es: 'Conviene ser honestos con los límites: las redes entrenadas con ImageNet se apoyan más en texturas que en formas, y cambios sutiles e invisibles para una persona pueden hacerlas fallar. Ver bien no es entender la escena.',
      en: 'It is worth being honest about the limits: ImageNet-trained networks lean more on textures than on shapes, and subtle changes that a person cannot see can make them fail. Seeing well is not understanding the scene.',
      note: { es: 'Límite: apoyo en texturas y fragilidad ante cambios sutiles.', en: 'Limit: reliance on textures and fragility to subtle changes.' },
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: un kernel compartido que recorre la imagen detecta patrones con muy pocos pesos, y las capas apiladas construyen de bordes a objetos.',
      en: 'In short: a shared kernel sweeping across the image detects patterns with very few weights, and stacked layers build from edges to objects.',
    },
    {
      id: 'bridge',
      es: 'Las imágenes tienen vecindad; el lenguaje tiene orden. Ahora veamos cómo una red procesa algo que ocurre en secuencia.',
      en: 'Images have neighborhood; language has order. Now let us see how a network processes something that happens in sequence.',
    },
  ],

  keyIdeas: {
    es: [
      'Conectar cada píxel con cada neurona no escala: una imagen pequeña ya exige millones de pesos.',
      'Un kernel es una cuadrícula pequeña de pesos que recorre la imagen; en cada posición multiplica, suma y produce un píxel de salida.',
      'El mismo kernel se reutiliza en toda la imagen (pesos compartidos): pocos parámetros y el mismo detector en cualquier posición.',
      'Los valores del kernel se aprenden con retropropagación; una capa tiene muchos kernels y cada uno produce un mapa de características.',
      'Apilar capas construye una jerarquía de bordes a partes y a objetos. Las redes entrenadas con ImageNet tienden a apoyarse en texturas, y las redes de visión pueden ser frágiles ante cambios sutiles.',
    ],
    en: [
      'Connecting every pixel to every neuron does not scale: a small image already needs millions of weights.',
      'A kernel is a small grid of weights that sweeps across the image; at each position it multiplies, adds, and produces an output pixel.',
      'The same kernel is reused across the image (shared weights): few parameters and the same detector at any position.',
      'Kernel values are learned with backpropagation; a layer has many kernels, and each produces a feature map.',
      'Stacking layers builds a hierarchy from edges to parts to objects. ImageNet-trained networks tend to lean on textures, and vision networks can be fragile to subtle changes.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Una red de visión «ve» la imagen como una persona: reconoce objetos y entiende la escena.',
      en: 'A vision network “sees” the image like a person: it recognizes objects and understands the scene.',
    },
    right: {
      es: 'Detecta patrones estadísticos en números de píxeles. Es muy buena con lo que vio en el entrenamiento, pero tiende a apoyarse en texturas y puede equivocarse con cambios que una persona ni nota.',
      en: 'It detects statistical patterns in pixel numbers. It is very good at what it saw in training, but it tends to lean on textures and can be wrong with changes a person would not even notice.',
    },
  },

  deeper: {
    es: `## La operación

Dada una imagen $I$ y un kernel $K$ de tamaño $k\\times k$, la salida (sin relleno) en la posición $(i,j)$ es

$$O[i,j] = b + \\sum_{u=0}^{k-1}\\sum_{v=0}^{k-1} K[u,v]\\; I[i+u,\\,j+v].$$

Técnicamente esto es una *correlación cruzada*; la convolución matemática voltea el kernel, pero en deep learning el kernel se aprende y la distinción no importa (Goodfellow et al., 2016, cap. 9). Con una imagen de $n\\times n$, sin relleno ($p=0$) y zancada 1, la salida mide $n-k+1$ por lado; con zancada (*stride*) $s$ y relleno $p$ (filas y columnas de ceros alrededor): $\\lfloor (n+2p-k)/s \\rfloor + 1$ (Dumoulin y Visin, 2016). Ejemplo del quiz: $28\\times28$ con $k=3$ da $26\\times26$; con $p=1$ el tamaño se conserva en $28\\times28$.

## Parámetros: conectado frente a convolucional

Una capa totalmente conectada de $10^4$ entradas a $10^3$ neuronas tiene $10^7$ pesos (más sesgos). Una capa convolucional con $C_{out}$ kernels de $k\\times k$ sobre $C_{in}$ canales tiene

$$C_{out}\\,(k^2\\,C_{in} + 1)$$

parámetros, independientes del tamaño de la imagen. Con $C_{in}=1$, $k=3$ y 16 kernels: $16\\cdot(9+1)=160$.

La comparación del gancho (10 millones frente a 10) pone un solo kernel frente a mil neuronas, y un kernel produce un solo mapa. Con 1 000 kernels de $3\\times3$ sobre la misma imagen de $100\\times100$ (sin relleno) hay $1\\,000\\cdot(9+1)=10\\,000$ parámetros, mil veces menos que $10^7$; pero la salida son 1 000 mapas de $98\\times98$ (9 604 000 valores) y $98^2\\cdot 9\\cdot 1\\,000\\approx 86$ millones de multiplicaciones, más que las 10 millones de la capa densa. Compartir pesos ahorra parámetros (y datos para ajustarlos), no operaciones: no cambia el orden del tiempo de cómputo de la pasada hacia delante, solo la memoria de los parámetros (Goodfellow et al., 2016, §9.2).

## De dónde viene la idea

El neocognitrón de Fukushima (1980) ya combinaba capas de detectores de rasgos locales con capas tolerantes a desplazamientos, pero se entrenaba con una regla autoorganizada, sin supervisión: no tenía un algoritmo supervisado de extremo a extremo como la retropropagación (LeCun, Bengio y Hinton, 2015; Goodfellow et al., 2016, §9.10). LeCun et al. (1989) entrenaron con retropropagación una red con pesos compartidos para reconocer dígitos de códigos postales manuscritos que les dio el Servicio Postal de EE. UU.: 9 298 dígitos ya segmentados (7 291 para entrenar, 2 007 para probar) en imágenes de $16\\times16$. Sus 64 660 conexiones se controlaban con 9 760 parámetros independientes, y el error fue 0.14 % en entrenamiento (10 errores) y 5.0 % en prueba (102 errores); una red totalmente conectada con 40 neuronas ocultas, probada como comparación, llegó a 8.1 % en prueba. Esa red no usaba pooling, sino convoluciones que saltaban de dos en dos píxeles. LeNet-5 (LeCun et al., 1998) tiene 7 capas, entrada de $32\\times32$, kernels de $5\\times5$, 340 908 conexiones y unos 60 000 parámetros libres; su «submuestreo» promedia cada bloque de $2\\times2$ (con un coeficiente y un sesgo entrenables) en lugar de tomar el máximo.

## El kernel de la lección

Los kernels de bordes de la escena son los del operador de Sobel (documentación de OpenCV, «Sobel Derivatives»). El de bordes verticales es

$$K_x=\\begin{pmatrix}-1&0&1\\\\-2&0&2\\\\-1&0&1\\end{pmatrix},\\qquad K_y=K_x^\\top.$$

Su magnitud $\\sqrt{(K_x * I)^2 + (K_y * I)^2}$ estima la intensidad de los bordes (la misma fuente). Aquí los kernels se eligen a mano para ver la operación; en una red entrenada los aprende el entrenamiento, y en las primeras capas suelen parecerse a detectores de bordes orientados y de manchas de color (Krizhevsky et al., 2012, fig. 3; Yosinski et al., 2014).

## Campo receptivo y jerarquía

Cada capa ve una zona mayor de la imagen original. Con $r_L=1$ en la última capa, el campo receptivo cumple $r_{l-1}=s_l\\,r_l+(k_l-s_l)$ (Araujo, Norris y Sim, 2019): dos convoluciones de $3\\times3$ seguidas «ven» $5\\times5$; con un *pooling* de $2\\times2$ en medio ($3\\times3$, pooling, $3\\times3$) ven $8\\times8$, y una unidad de la red de ejemplo de la escena, tras sus dos pooling, ve $10\\times10$ píxeles. Por eso las primeras capas detectan patrones locales (bordes, colores) y las profundas, combinaciones amplias.

En una red de tipo AlexNet, Zeiler y Fergus (2014) visualizaron qué excita a cada capa: la 2 responde a esquinas y combinaciones de borde y color; la 3, a texturas y patrones más complejos; la 4, a partes propias de una clase (caras de perro); la 5, a objetos enteros con mucha variación de pose. LeCun, Bengio y Hinton (2015) lo resumen como bordes, motivos, partes y objetos, y subrayan que esas capas de rasgos no las diseñan ingenieros: se aprenden de los datos. Lo que sí diseña una persona es la arquitectura (cuántas capas, qué tamaño de kernel, dónde va el pooling).

## Pooling y desplazamientos

El pooling máximo de $2\\times2$ con paso 2 reduce el mapa a la mitad por lado y vuelve la salida aproximadamente invariante a desplazamientos pequeños (Goodfellow et al., 2016, §9.3; LeCun, Bengio y Hinton, 2015). Es solo aproximado: en la escena, desplazar la imagen un píxel cambia un 56 % el mapa de bordes (suma de diferencias absolutas entre suma de valores absolutos) y tras el pooling un 19 %; con 400 imágenes de franjas al azar, el cambio medio baja de 0.97 a 0.50 y en 50 de las 400 el pooling no lo reduce (script verify-data.ts). Azulay y Weiss (2019) muestran que en redes completas desplazar o escalar un poco la imagen puede cambiar mucho la predicción. En la escena el pooling toma el máximo del valor absoluto; en una red real la activación (por ejemplo ReLU) va antes.

## Los límites, con números

- **Texturas.** Geirhos et al. (2019) mostraron a redes entrenadas con ImageNet imágenes con la forma de un objeto y la textura de otro. Al elegir, ResNet-50 respondió según la textura el 77.9 % de las veces (VGG-16, 82.8 %; GoogLeNet, 68.8 %; AlexNet, 57.1 %); las personas eligieron la forma en el 95.9 % de sus decisiones correctas. Con la misma arquitectura, entrenar con una versión «estilizada» de ImageNet cambió ese sesgo: depende de los datos y de la tarea, no solo de la convolución.
- **Cambios casi invisibles.** Szegedy et al. (2014) hallaron perturbaciones apenas perceptibles que cambian la clase que predice la red. Goodfellow, Shlens y Szegedy (2015) pasaron la respuesta de GoogLeNet ante la foto de un panda de «panda» (57.7 % de confianza) a «gibón» (99.3 %) sumando una perturbación de magnitud 0.007, el bit más pequeño de una imagen de 8 bits.
- **Datos distintos de los de entrenamiento.** Recht et al. (2019) rehicieron con el mismo procedimiento los conjuntos de prueba de ImageNet y la exactitud de los modelos bajó entre 11 % y 14 %. Beery et al. (2018): con cámaras trampa de fauna, buen rendimiento donde se entrenó y mala generalización a lugares nuevos. Hendrycks y Dietterich (2019): ImageNet-C aplica 75 alteraciones (15 tipos en 5 intensidades, entre ellas brillo, contraste, niebla y ruido), y la robustez relativa casi no mejoró de AlexNet a ResNet.
- **Escenas.** Goodfellow et al. (2016, §9.10) señalan que el sistema visual humano hace mucho más que reconocer objetos (entiende escenas completas, relaciones entre objetos y geometría 3D) y que las aplicaciones de las redes convolucionales a esos problemas estaban entonces en su infancia.

## Reutilizar un modelo ya entrenado

Yosinski et al. (2014) midieron qué se puede reutilizar: los rasgos de la primera capa (como los de Gabor y las manchas de color) no dependen de la tarea ni de los datos, y los de las últimas capas sí. He, Girshick y Dollár (2018, informe técnico) compararon, en detección de objetos con COCO, partir de un modelo preentrenado en ImageNet frente a entrenar desde cero: el preentrenamiento acelera la convergencia, pero con suficientes iteraciones entrenar desde cero igualó la exactitud, incluso con el 10 % de los datos; solo con muy pocos datos (menos de unas 10 000 imágenes de COCO) el preentrenamiento mejoró claramente el resultado.

## En código

\`\`\`python
import numpy as np

def conv2d(img, K, b=0.0):
    k = K.shape[0]
    h, w = img.shape[0] - k + 1, img.shape[1] - k + 1
    out = np.zeros((h, w))
    for i in range(h):
        for j in range(w):
            out[i, j] = b + np.sum(K * img[i:i + k, j:j + k])
    return out

Kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
img = np.zeros((6, 6)); img[:, 3:] = 1          # mitad oscura, mitad clara: un borde vertical
print(conv2d(img, Kx))                           # valores 4 en las columnas del borde, 0 en el resto
\`\`\`

## Lo que viene

La retropropagación de la lección 8 entrena los kernels igual que cualquier peso. Las redes convolucionales pasaron a dominar la visión a partir de 2012 (lección 13); LeCun, Bengio y Hinton (2015) las describen como el enfoque dominante para casi todas las tareas de reconocimiento y detección. Para datos en secuencia, como el lenguaje, hace falta otra idea (lección 12).`,
    en: `## The operation

Given an image $I$ and a $k\\times k$ kernel $K$, the output (without padding) at position $(i,j)$ is

$$O[i,j] = b + \\sum_{u=0}^{k-1}\\sum_{v=0}^{k-1} K[u,v]\\; I[i+u,\\,j+v].$$

Technically this is *cross-correlation*; mathematical convolution flips the kernel, but in deep learning the kernel is learned and the distinction does not matter (Goodfellow et al., 2016, ch. 9). With an $n\\times n$ image, no padding ($p=0$), and stride 1, the output is $n-k+1$ per side; with stride $s$ and padding $p$ (rows and columns of zeros around the border): $\\lfloor (n+2p-k)/s \\rfloor + 1$ (Dumoulin and Visin, 2016). Quiz example: $28\\times28$ with $k=3$ gives $26\\times26$; with $p=1$ the size stays $28\\times28$.

## Parameters: fully connected versus convolutional

A fully connected layer from $10^4$ inputs to $10^3$ neurons has $10^7$ weights (plus biases). A convolutional layer with $C_{out}$ kernels of $k\\times k$ over $C_{in}$ channels has

$$C_{out}\\,(k^2\\,C_{in} + 1)$$

parameters, independent of the image size. With $C_{in}=1$, $k=3$ and 16 kernels: $16\\cdot(9+1)=160$.

The hook’s comparison (10 million versus 10) sets a single kernel against a thousand neurons, and one kernel produces a single map. With 1,000 $3\\times3$ kernels on the same $100\\times100$ image (no padding) there are $1{,}000\\cdot(9+1)=10{,}000$ parameters, a thousand times fewer than $10^7$; but the output is 1,000 maps of $98\\times98$ (9,604,000 values) and $98^2\\cdot 9\\cdot 1{,}000\\approx 86$ million multiplications, more than the dense layer’s 10 million. Sharing weights saves parameters (and the data needed to fit them), not operations: it does not change the order of the forward-pass running time, only the memory for the parameters (Goodfellow et al., 2016, §9.2).

## Where the idea comes from

Fukushima’s neocognitron (1980) already combined layers of local feature detectors with layers tolerant to shifts, but it was trained with a self-organizing rule, without supervision: it lacked an end-to-end supervised algorithm such as backpropagation (LeCun, Bengio, and Hinton, 2015; Goodfellow et al., 2016, §9.10). LeCun et al. (1989) trained with backpropagation a network with shared weights to recognize handwritten zip code digits provided by the U.S. Postal Service: 9,298 already-segmented digits (7,291 for training, 2,007 for testing) in $16\\times16$ images. Its 64,660 connections were controlled by 9,760 independent parameters, and the error was 0.14% on the training set (10 mistakes) and 5.0% on the test set (102 mistakes); a fully connected network with 40 hidden units, tried as a comparison, reached 8.1% on the test set. That network did not use pooling, but convolutions that jumped two pixels at a time. LeNet-5 (LeCun et al., 1998) has 7 layers, a $32\\times32$ input, $5\\times5$ kernels, 340,908 connections, and about 60,000 free parameters; its “sub-sampling” averages each $2\\times2$ block (with a trainable coefficient and bias) instead of taking the maximum.

## The lesson’s kernel

The lesson’s edge kernels are those of the Sobel operator (OpenCV documentation, “Sobel Derivatives”). The vertical-edge kernel is

$$K_x=\\begin{pmatrix}-1&0&1\\\\-2&0&2\\\\-1&0&1\\end{pmatrix},\\qquad K_y=K_x^\\top.$$

Its magnitude $\\sqrt{(K_x * I)^2 + (K_y * I)^2}$ estimates edge strength (same source). Here the kernels are chosen by hand to show the operation; in a trained network they are learned, and in the first layers they tend to resemble oriented-edge detectors and color blobs (Krizhevsky et al., 2012, fig. 3; Yosinski et al., 2014).

## Receptive field and hierarchy

Each layer sees a larger region of the original image. With $r_L=1$ at the last layer, the receptive field satisfies $r_{l-1}=s_l\\,r_l+(k_l-s_l)$ (Araujo, Norris, and Sim, 2019): two stacked $3\\times3$ convolutions “see” $5\\times5$; with a $2\\times2$ pooling in between ($3\\times3$, pooling, $3\\times3$) they see $8\\times8$, and a unit of the lesson’s example network, after its two poolings, sees $10\\times10$ pixels. That is why early layers detect local patterns (edges, colors) and deep layers detect broad combinations.

In an AlexNet-type network, Zeiler and Fergus (2014) visualized what excites each layer: layer 2 responds to corners and edge/color conjunctions; layer 3, to textures and more complex patterns; layer 4, to class-specific parts (dog faces); layer 5, to whole objects with significant pose variation. LeCun, Bengio, and Hinton (2015) summarize it as edges, motifs, parts, and objects, and stress that these layers of features are not designed by human engineers: they are learned from data. What a person does design is the architecture (how many layers, what kernel size, where the pooling goes).

## Pooling and shifts

$2\\times2$ max pooling with stride 2 halves the map per side and makes the output approximately invariant to small shifts (Goodfellow et al., 2016, §9.3; LeCun, Bengio, and Hinton, 2015). It is only approximate: in the scene, shifting the image by one pixel changes the edge map by 56% (sum of absolute differences over the sum of absolute values) and after pooling by 19%; with 400 random-stripe images, the mean change drops from 0.97 to 0.50 and in 50 of the 400 pooling does not reduce it (script verify-data.ts). Azulay and Weiss (2019) show that in full networks shifting or rescaling the image a little can change the prediction a lot. In the scene, pooling takes the maximum of the absolute value; in a real network the activation (for example ReLU) comes first.

## The limits, with numbers

- **Textures.** Geirhos et al. (2019) showed ImageNet-trained networks images with the shape of one object and the texture of another. When forced to choose, ResNet-50 answered by texture 77.9% of the time (VGG-16, 82.8%; GoogLeNet, 68.8%; AlexNet, 57.1%); people chose shape in 95.9% of their correct decisions. With the same architecture, training on a “stylized” version of ImageNet changed that bias: it depends on the data and the task, not only on convolution.
- **Nearly invisible changes.** Szegedy et al. (2014) found hardly perceptible perturbations that change the class a network predicts. Goodfellow, Shlens, and Szegedy (2015) took GoogLeNet’s answer on a photo of a panda from “panda” (57.7% confidence) to “gibbon” (99.3%) by adding a perturbation of magnitude 0.007, the smallest bit of an 8-bit image.
- **Data unlike the training data.** Recht et al. (2019) rebuilt ImageNet test sets with the same procedure and model accuracy dropped by 11% to 14%. Beery et al. (2018): with wildlife camera traps, good performance where it was trained and poor generalization to new places. Hendrycks and Dietterich (2019): ImageNet-C applies 75 alterations (15 types at 5 intensities, including brightness, contrast, fog, and noise), and relative robustness barely improved from AlexNet to ResNet.
- **Scenes.** Goodfellow et al. (2016, §9.10) note that the human visual system does much more than recognize objects (it understands entire scenes, relationships between objects, and 3D geometry) and that applications of convolutional networks to those problems were then in their infancy.

## Reusing an already trained model

Yosinski et al. (2014) measured what can be reused: first-layer features (such as Gabor filters and color blobs) do not depend on the task or the data, while last-layer features do. He, Girshick, and Dollár (2018, technical report) compared, in object detection on COCO, starting from a model pre-trained on ImageNet versus training from scratch: pre-training speeds up convergence, but with enough iterations training from scratch matched the accuracy, even with 10% of the data; only with very little data (fewer than about 10,000 COCO images) did pre-training clearly improve the result.

## In code

\`\`\`python
import numpy as np

def conv2d(img, K, b=0.0):
    k = K.shape[0]
    h, w = img.shape[0] - k + 1, img.shape[1] - k + 1
    out = np.zeros((h, w))
    for i in range(h):
        for j in range(w):
            out[i, j] = b + np.sum(K * img[i:i + k, j:j + k])
    return out

Kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
img = np.zeros((6, 6)); img[:, 3:] = 1          # half dark, half bright: a vertical edge
print(conv2d(img, Kx))                           # values 4 in the edge columns, 0 elsewhere
\`\`\`

## What comes next

Backpropagation from lesson 8 trains the kernels like any other weight. Convolutional networks came to dominate vision from 2012 on (lesson 13); LeCun, Bengio, and Hinton (2015) describe them as the dominant approach for almost all recognition and detection tasks. For sequential data such as language, another idea is needed (lesson 12).`,
  },

  lens: {
    es: [
      'Un sistema de visión rinde bien con imágenes parecidas a las del entrenamiento: pide que lo prueben con tus cámaras, tu iluminación y tus casos reales.',
      'Si el proveedor habla de «exactitud del 99 %», pregunta en qué conjunto de imágenes y con qué variedad: el rendimiento cae cuando cambian las condiciones.',
      'Estas redes pueden fallar de formas que una persona no entiende (cambios mínimos, fondos, texturas). Para decisiones críticas, diseña revisión humana y casos de prueba adversarios.',
      'Partir de un modelo de visión ya entrenado suele acelerar el entrenamiento y ayuda sobre todo cuando tienes pocos datos propios; con muchos datos, entrenar desde cero puede igualarlo. Pregunta si usan uno preentrenado y cómo lo ajustaron.',
    ],
    en: [
      'A vision system performs well on images similar to its training data: ask for it to be tested with your cameras, your lighting, and your real cases.',
      'If the vendor talks about “99% accuracy,” ask on which set of images and with what variety: performance drops when conditions change.',
      'These networks can fail in ways a person does not understand (tiny changes, backgrounds, textures). For critical decisions, design human review and adversarial test cases.',
      'Starting from an already trained vision model usually speeds up training and helps most when you have little data of your own; with lots of data, training from scratch can match it. Ask whether they use a pretrained one and how they adapted it.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué ventaja principal tiene compartir el mismo kernel en toda la imagen?', en: 'What is the main advantage of sharing the same kernel across the whole image?' },
      options: [
        { es: 'Garantiza que el modelo nunca se equivoque.', en: 'It guarantees the model is never wrong.' },
        { es: 'Elimina la necesidad de entrenar.', en: 'It removes the need to train.' },
        { es: 'Necesita muy pocos parámetros y detecta el mismo patrón en cualquier posición.', en: 'It needs very few parameters and detects the same pattern at any position.' },
        { es: 'Hace la imagen más nítida.', en: 'It makes the image sharper.' },
      ],
      answer: 2,
      why: { es: 'Con pesos compartidos, un kernel de nueve pesos sirve para toda la imagen, sin importar su tamaño, y el patrón se detecta donde aparezca.', en: 'With shared weights, a nine-weight kernel serves the whole image, no matter its size, and the pattern is detected wherever it appears.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una imagen de 28 × 28 se convoluciona con un kernel de 3 × 3, sin relleno y con zancada 1. ¿Qué tamaño tiene el mapa de salida?', en: 'A 28 × 28 image is convolved with a 3 × 3 kernel, no padding, stride 1. What size is the output map?' },
      options: [
        { es: '28 × 28', en: '28 × 28' },
        { es: '26 × 26', en: '26 × 26' },
        { es: '25 × 25', en: '25 × 25' },
        { es: '14 × 14', en: '14 × 14' },
      ],
      answer: 1,
      why: { es: 'El tamaño es n − k + 1 = 28 − 3 + 1 = 26 por lado.', en: 'The size is n − k + 1 = 28 − 3 + 1 = 26 per side.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué hace el pooling máximo de 2 × 2?', en: 'What does 2 × 2 max pooling do?' },
      options: [
        { es: 'Conserva el valor más alto de cada bloque de 2 × 2, reduciendo el mapa a la mitad por lado.', en: 'It keeps the highest value of each 2 × 2 block, halving the map per side.' },
        { es: 'Suma todos los píxeles de la imagen.', en: 'It adds all the pixels of the image.' },
        { es: 'Aprende nuevos kernels.', en: 'It learns new kernels.' },
        { es: 'Multiplica el tamaño del mapa por dos.', en: 'It doubles the size of the map.' },
      ],
      answer: 0,
      why: { es: 'Resume cada bloque con su máximo: el mapa se encoge y el resultado suele cambiar menos si el patrón se desplaza un píxel (la invariancia es solo aproximada).', en: 'It summarizes each block with its maximum: the map shrinks and the result usually changes less if the pattern shifts by one pixel (the invariance is only approximate).' },
    },
    {
      kind: 'apply',
      q: { es: 'Un sistema de inspección de calidad funciona en el laboratorio, pero en la fábrica, con otra iluminación, falla mucho. ¿Cuál es la explicación más probable?', en: 'A quality-inspection system works in the lab, but in the factory, with different lighting, it fails a lot. What is the most likely explanation?' },
      options: [
        { es: 'Faltan GPUs en la fábrica.', en: 'The factory lacks GPUs.' },
        { es: 'Las imágenes de la fábrica difieren de las del entrenamiento y la red no generaliza bien a esas condiciones nuevas.', en: 'The factory images differ from the training ones and the network does not generalize well to those new conditions.' },
        { es: 'El kernel es demasiado grande.', en: 'The kernel is too large.' },
        { es: 'El pooling está desactivado.', en: 'Pooling is turned off.' },
      ],
      answer: 1,
      why: { es: 'Es un cambio de distribución: los datos nuevos no se parecen a los de entrenamiento, y los modelos de visión suelen rendir peor en lugares o condiciones que no vieron (Beery et al., 2018; Hendrycks y Dietterich, 2019). La solución es reunir imágenes de las condiciones reales y reentrenar o ajustar, y medir ahí.', en: 'It is a distribution shift: the new data does not resemble the training data, and vision models tend to do worse in places or conditions they did not see (Beery et al., 2018; Hendrycks and Dietterich, 2019). The fix is to gather images from real conditions and retrain or adapt, and measure there.' },
    },
  ],

  glossary: ['pixel', 'convolution', 'kernel', 'feature-map', 'pooling', 'cnn', 'overfitting'],

  terms: [
    { id: 'convolution', term: { es: 'Convolución', en: 'Convolution' }, def: { es: 'Operación en la que un kernel pequeño recorre una imagen y, en cada posición, multiplica y suma píxeles por pesos para producir un píxel de salida.', en: 'An operation in which a small kernel sweeps an image and, at each position, multiplies and sums pixels by weights to produce an output pixel.' } },
    { id: 'kernel', term: { es: 'Kernel (filtro)', en: 'Kernel (filter)' }, def: { es: 'La cuadrícula pequeña de pesos de una convolución. En una red convolucional, sus valores se aprenden durante el entrenamiento.', en: 'The small grid of weights of a convolution. In a convolutional network, its values are learned during training.' } },
    { id: 'feature-map', term: { es: 'Mapa de características', en: 'Feature map' }, def: { es: 'La imagen de salida de un kernel: muestra dónde aparece el patrón que ese kernel detecta.', en: 'The output image of a kernel: it shows where the pattern that kernel detects appears.' } },
    { id: 'pooling', term: { es: 'Pooling', en: 'Pooling' }, def: { es: 'Reducción de tamaño que resume cada bloque de un mapa (por ejemplo, con su valor máximo).', en: 'A size reduction that summarizes each block of a map (for example, with its maximum value).' } },
    { id: 'cnn', term: { es: 'Red convolucional (CNN)', en: 'Convolutional network (CNN)' }, def: { es: 'Red neuronal que usa convoluciones, activaciones y pooling para procesar datos con estructura de cuadrícula, como imágenes.', en: 'A neural network that uses convolutions, activations, and pooling to process grid-structured data such as images.' } },
  ],

  sources: [
    { title: 'Backpropagation Applied to Handwritten Zip Code Recognition (Neural Computation 1(4), 541–551)', authors: 'LeCun, Y., Boser, B., Denker, J. S., Henderson, D., Howard, R. E., Hubbard, W., Jackel, L. D.', year: 1989, url: 'https://doi.org/10.1162/neco.1989.1.4.541' },
    { title: 'Gradient-Based Learning Applied to Document Recognition (Proceedings of the IEEE 86(11), 2278–2324; sección II: LeNet-5)', authors: 'LeCun, Y., Bottou, L., Bengio, Y., Haffner, P.', year: 1998, url: 'https://doi.org/10.1109/5.726791' },
    { title: 'Neocognitron: A self-organizing neural network model for a mechanism of pattern recognition unaffected by shift in position (Biological Cybernetics 36(4), 193–202)', authors: 'Fukushima, K.', year: 1980, url: 'https://doi.org/10.1007/BF00344251' },
    { title: 'Deep learning (Nature 521, 436–444; sección «Convolutional neural networks»)', authors: 'LeCun, Y., Bengio, Y., Hinton, G.', year: 2015, url: 'https://doi.org/10.1038/nature14539' },
    { title: 'Deep Learning, cap. 9: Convolutional Networks (§9.2 parámetros compartidos, §9.3 pooling, §9.10 base neurocientífica, §9.11 historia)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/convnets.html' },
    { title: 'ImageNet Classification with Deep Convolutional Neural Networks (fig. 3 y §6.1: los kernels aprendidos de la primera capa)', authors: 'Krizhevsky, A., Sutskever, I., Hinton, G. E.', year: 2012, url: 'https://papers.nips.cc/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html' },
    { title: 'How transferable are features in deep neural networks?', authors: 'Yosinski, J., Clune, J., Bengio, Y., Lipson, H.', year: 2014, url: 'https://arxiv.org/abs/1411.1792' },
    { title: 'Visualizing and Understanding Convolutional Networks (ECCV 2014)', authors: 'Zeiler, M. D., Fergus, R.', year: 2014, url: 'https://arxiv.org/abs/1311.2901' },
    { title: 'A guide to convolution arithmetic for deep learning', authors: 'Dumoulin, V., Visin, F.', year: 2016, url: 'https://arxiv.org/abs/1603.07285' },
    { title: 'Computing Receptive Fields of Convolutional Neural Networks (Distill 4(11))', authors: 'Araujo, A., Norris, W., Sim, J.', year: 2019, url: 'https://doi.org/10.23915/distill.00021' },
    { title: 'Sobel Derivatives (tutorial de la documentación de OpenCV 4.x, consultada en 2026: kernels de Sobel y magnitud del gradiente)', authors: 'OpenCV (autora original del tutorial: Huamán, A.)', year: 2026, url: 'https://docs.opencv.org/4.x/d2/d2c/tutorial_sobel_derivatives.html' },
    { title: 'Why do deep convolutional networks generalize so poorly to small image transformations? (JMLR 20(184), 2019)', authors: 'Azulay, A., Weiss, Y.', year: 2019, url: 'https://arxiv.org/abs/1805.12177' },
    { title: 'ImageNet-trained CNNs are biased towards texture; increasing shape bias improves accuracy and robustness', authors: 'Geirhos, R., Rubisch, P., Michaelis, C., Bethge, M., Wichmann, F. A., Brendel, W.', year: 2019, url: 'https://arxiv.org/abs/1811.12231' },
    { title: 'Intriguing properties of neural networks', authors: 'Szegedy, C., Zaremba, W., Sutskever, I., Bruna, J., Erhan, D., Goodfellow, I., Fergus, R.', year: 2014, url: 'https://arxiv.org/abs/1312.6199' },
    { title: 'Explaining and Harnessing Adversarial Examples', authors: 'Goodfellow, I. J., Shlens, J., Szegedy, C.', year: 2015, url: 'https://arxiv.org/abs/1412.6572' },
    { title: 'Do ImageNet Classifiers Generalize to ImageNet?', authors: 'Recht, B., Roelofs, R., Schmidt, L., Shankar, V.', year: 2019, url: 'https://arxiv.org/abs/1902.10811' },
    { title: 'Recognition in Terra Incognita (ECCV 2018)', authors: 'Beery, S., Van Horn, G., Perona, P.', year: 2018, url: 'https://arxiv.org/abs/1807.04975' },
    { title: 'Benchmarking Neural Network Robustness to Common Corruptions and Perturbations (ICLR 2019)', authors: 'Hendrycks, D., Dietterich, T.', year: 2019, url: 'https://arxiv.org/abs/1903.12261' },
    { title: 'Rethinking ImageNet Pre-training (informe técnico en arXiv)', authors: 'He, K., Girshick, R., Dollár, P.', year: 2018, url: 'https://arxiv.org/abs/1811.08883' },
  ],
});
