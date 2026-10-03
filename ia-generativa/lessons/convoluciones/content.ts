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
      note: { es: 'Pesos compartidos: 10 parámetros en vez de millones.', en: 'Shared weights: 10 parameters instead of millions.' },
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
      es: 'Luego viene el pooling: de cada bloque de dos por dos se conserva solo el valor más alto. La imagen se encoge y la red tolera pequeños desplazamientos.',
      en: 'Then comes pooling: from each two-by-two block only the highest value is kept. The image shrinks and the network tolerates small shifts.',
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
      es: 'Conviene ser honestos con los límites: estas redes se apoyan mucho en texturas, y cambios sutiles e invisibles para una persona pueden hacerlas fallar. Ver bien no es entender la escena.',
      en: 'It is worth being honest about the limits: these networks lean heavily on textures, and subtle changes that a person cannot see can make them fail. Seeing well is not understanding the scene.',
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
      'Apilar capas construye una jerarquía de bordes a partes y a objetos. Estas redes dependen de texturas y pueden ser frágiles ante cambios sutiles.',
    ],
    en: [
      'Connecting every pixel to every neuron does not scale: a small image already needs millions of weights.',
      'A kernel is a small grid of weights that sweeps across the image; at each position it multiplies, adds, and produces an output pixel.',
      'The same kernel is reused across the image (shared weights): few parameters and the same detector at any position.',
      'Kernel values are learned with backpropagation; a layer has many kernels, and each produces a feature map.',
      'Stacking layers builds a hierarchy from edges to parts to objects. These networks rely on textures and can be fragile to subtle changes.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Una red de visión «ve» la imagen como una persona: reconoce objetos y entiende la escena.',
      en: 'A vision network “sees” the image like a person: it recognizes objects and understands the scene.',
    },
    right: {
      es: 'Detecta patrones estadísticos en números de píxeles. Es muy buena con lo que vio en el entrenamiento, pero se apoya en texturas y puede equivocarse con cambios que una persona ni nota.',
      en: 'It detects statistical patterns in pixel numbers. It is very good at what it saw in training, but it leans on textures and can be wrong with changes a person would not even notice.',
    },
  },

  deeper: {
    es: `## La operación

Dada una imagen $I$ y un kernel $K$ de tamaño $k\\times k$, la salida (sin relleno) en la posición $(i,j)$ es

$$O[i,j] = b + \\sum_{u=0}^{k-1}\\sum_{v=0}^{k-1} K[u,v]\\; I[i+u,\\,j+v].$$

Técnicamente esto es una *correlación cruzada*; la convolución matemática voltea el kernel, pero en deep learning el kernel se aprende y la distinción no importa. Con una imagen de $n\\times n$ y relleno cero, la salida mide $n-k+1$ por lado; con zancada (*stride*) $s$ y relleno $p$: $\\lfloor (n+2p-k)/s \\rfloor + 1$.

## Parámetros: conectado frente a convolucional

Una capa totalmente conectada de $10^4$ entradas a $10^3$ neuronas tiene $10^7$ pesos (más sesgos). Una capa convolucional con $C_{out}$ kernels de $k\\times k$ sobre $C_{in}$ canales tiene

$$C_{out}\\,(k^2\\,C_{in} + 1)$$

parámetros, independientes del tamaño de la imagen. Con $C_{in}=1$, $k=3$ y 16 kernels: $16\\cdot(9+1)=160$.

## El kernel de la lección

El kernel de bordes verticales (tipo Sobel) es

$$K_x=\\begin{pmatrix}-1&0&1\\\\-2&0&2\\\\-1&0&1\\end{pmatrix},\\qquad K_y=K_x^\\top.$$

Su magnitud $\\sqrt{(K_x * I)^2 + (K_y * I)^2}$ estima la intensidad de los bordes.

## Campo receptivo y jerarquía

Cada capa ve una zona mayor de la imagen original: dos convoluciones de $3\\times3$ seguidas «ven» $5\\times5$; con *pooling* el campo crece más rápido. Por eso las primeras capas detectan patrones locales (bordes, colores) y las profundas, combinaciones amplias (partes y objetos).

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

La retropropagación de la lección 8 entrena los kernels igual que cualquier peso. Las redes convolucionales dominaron la visión a partir de 2012 (lección 13). Para datos en secuencia, como el lenguaje, hace falta otra idea (lección 12).`,
    en: `## The operation

Given an image $I$ and a $k\\times k$ kernel $K$, the output (without padding) at position $(i,j)$ is

$$O[i,j] = b + \\sum_{u=0}^{k-1}\\sum_{v=0}^{k-1} K[u,v]\\; I[i+u,\\,j+v].$$

Technically this is *cross-correlation*; mathematical convolution flips the kernel, but in deep learning the kernel is learned and the distinction does not matter. With an $n\\times n$ image and no padding, the output is $n-k+1$ per side; with stride $s$ and padding $p$: $\\lfloor (n+2p-k)/s \\rfloor + 1$.

## Parameters: fully connected versus convolutional

A fully connected layer from $10^4$ inputs to $10^3$ neurons has $10^7$ weights (plus biases). A convolutional layer with $C_{out}$ kernels of $k\\times k$ over $C_{in}$ channels has

$$C_{out}\\,(k^2\\,C_{in} + 1)$$

parameters, independent of the image size. With $C_{in}=1$, $k=3$ and 16 kernels: $16\\cdot(9+1)=160$.

## The lesson’s kernel

The vertical-edge kernel (Sobel type) is

$$K_x=\\begin{pmatrix}-1&0&1\\\\-2&0&2\\\\-1&0&1\\end{pmatrix},\\qquad K_y=K_x^\\top.$$

Its magnitude $\\sqrt{(K_x * I)^2 + (K_y * I)^2}$ estimates edge strength.

## Receptive field and hierarchy

Each layer sees a larger region of the original image: two stacked $3\\times3$ convolutions “see” $5\\times5$; with pooling the field grows faster. That is why early layers detect local patterns (edges, colors) and deep layers detect broad combinations (parts and objects).

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

Backpropagation from lesson 8 trains the kernels like any other weight. Convolutional networks dominated vision from 2012 on (lesson 13). For sequential data such as language, another idea is needed (lesson 12).`,
  },

  lens: {
    es: [
      'Un sistema de visión rinde bien con imágenes parecidas a las del entrenamiento: pide que lo prueben con tus cámaras, tu iluminación y tus casos reales.',
      'Si el proveedor habla de «precisión del 99 %», pregunta en qué conjunto de imágenes y con qué variedad: el rendimiento cae cuando cambian las condiciones.',
      'Estas redes pueden fallar de formas que una persona no entiende (cambios mínimos, fondos, texturas). Para decisiones críticas, diseña revisión humana y casos de prueba adversarios.',
      'Reutilizar un modelo ya entrenado en visión suele ser mucho más barato que entrenar desde cero: pregunta si usan uno preentrenado y cómo lo ajustaron.',
    ],
    en: [
      'A vision system performs well on images similar to its training data: ask for it to be tested with your cameras, your lighting, and your real cases.',
      'If the vendor talks about “99% accuracy,” ask on which set of images and with what variety: performance drops when conditions change.',
      'These networks can fail in ways a person does not understand (tiny changes, backgrounds, textures). For critical decisions, design human review and adversarial test cases.',
      'Reusing an already trained vision model is usually far cheaper than training from scratch: ask whether they use a pretrained one and how they adapted it.',
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
      why: { es: 'Resume cada bloque con su máximo: el mapa se encoge y el resultado cambia poco si el patrón se desplaza un píxel.', en: 'It summarizes each block with its maximum: the map shrinks and the result changes little if the pattern shifts by one pixel.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un sistema de inspección de calidad funciona en el laboratorio, pero en la fábrica, con otra iluminación, falla mucho. ¿Cuál es la explicación más probable?', en: 'A quality-inspection system works in the lab, but in the factory, with different lighting, it fails a lot. What is the most likely explanation?' },
      options: [
        { es: 'Faltan GPUs en la fábrica.', en: 'The factory lacks GPUs.' },
        { es: 'Las imágenes de la fábrica difieren de las del entrenamiento y la red se apoya en rasgos como texturas o brillo.', en: 'The factory images differ from the training ones and the network leans on features such as textures or brightness.' },
        { es: 'El kernel es demasiado grande.', en: 'The kernel is too large.' },
        { es: 'El pooling está desactivado.', en: 'Pooling is turned off.' },
      ],
      answer: 1,
      why: { es: 'Es un cambio de distribución: los datos nuevos no se parecen a los de entrenamiento. La solución es reunir imágenes de las condiciones reales y reentrenar o ajustar, y medir ahí.', en: 'It is a distribution shift: the new data does not resemble the training data. The fix is to gather images from real conditions and retrain or adapt, and measure there.' },
    },
  ],

  glossary: ['pixel', 'convolution', 'kernel', 'feature-map', 'pooling', 'cnn', 'overfitting'],

  terms: [
    { id: 'convolution', term: { es: 'Convolución', en: 'Convolution' }, def: { es: 'Operación en la que un kernel pequeño recorre una imagen y, en cada posición, multiplica y suma píxeles por pesos para producir un píxel de salida.', en: 'An operation in which a small kernel sweeps an image and, at each position, multiplies and sums pixels by weights to produce an output pixel.' } },
    { id: 'kernel', term: { es: 'Kernel (filtro)', en: 'Kernel (filter)' }, def: { es: 'La cuadrícula pequeña de pesos de una convolución. Sus valores se aprenden durante el entrenamiento.', en: 'The small grid of weights of a convolution. Its values are learned during training.' } },
    { id: 'feature-map', term: { es: 'Mapa de características', en: 'Feature map' }, def: { es: 'La imagen de salida de un kernel: muestra dónde aparece el patrón que ese kernel detecta.', en: 'The output image of a kernel: it shows where the pattern that kernel detects appears.' } },
    { id: 'pooling', term: { es: 'Pooling', en: 'Pooling' }, def: { es: 'Reducción de tamaño que resume cada bloque de un mapa (por ejemplo, con su valor máximo).', en: 'A size reduction that summarizes each block of a map (for example, with its maximum value).' } },
    { id: 'cnn', term: { es: 'Red convolucional (CNN)', en: 'Convolutional network (CNN)' }, def: { es: 'Red neuronal que usa convoluciones, activaciones y pooling para procesar datos con estructura de cuadrícula, como imágenes.', en: 'A neural network that uses convolutions, activations, and pooling to process grid-structured data such as images.' } },
  ],

  sources: [
    { title: 'Backpropagation Applied to Handwritten Zip Code Recognition', authors: 'LeCun, Y., Boser, B., Denker, J. S., Henderson, D., Howard, R. E., Hubbard, W., Jackel, L. D.', year: 1989 },
    { title: 'Gradient-Based Learning Applied to Document Recognition', authors: 'LeCun, Y., Bottou, L., Bengio, Y., Haffner, P.', year: 1998 },
    { title: 'ImageNet Classification with Deep Convolutional Neural Networks', authors: 'Krizhevsky, A., Sutskever, I., Hinton, G. E.', year: 2012 },
    { title: 'ImageNet-trained CNNs are biased towards texture; increasing shape bias improves accuracy and robustness', authors: 'Geirhos, R., Rubisch, P., Michaelis, C., Bethge, M., Wichmann, F. A., Brendel, W.', year: 2019 },
  ],
});
