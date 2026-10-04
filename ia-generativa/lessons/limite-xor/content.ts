import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'limite-xor',

  objectives: {
    es: [
      'Explicar por qué una sola neurona no puede resolver XOR, con un argumento geométrico.',
      'Describir qué hace una capa oculta: crear señales nuevas hasta que una recta basta.',
      'Situar el límite del perceptrón en su contexto histórico sin exagerarlo.',
    ],
    en: [
      'Explain why a single neuron cannot solve XOR, with a geometric argument.',
      'Describe what a hidden layer does: it creates new signals until one line is enough.',
      'Place the perceptron’s limit in its historical context without overstating it.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Una neurona de dos entradas traza una recta y reparte el plano en dos lados. La pregunta es si una recta siempre alcanza.',
      en: 'A neuron with two inputs draws a line and splits the plane into two sides. The question is whether one line is always enough.',
    },
    {
      id: 'recall',
      es: 'Recuerda cómo decide: calcula una suma ponderada de las entradas más un sesgo, y según el signo del resultado responde uno o cero.',
      en: 'Recall how it decides: it computes a weighted sum of the inputs plus a bias, and depending on the sign of the result it answers one or zero.',
      note: { es: 'Una neurona = una recta que separa dos regiones.', en: 'A neuron = a line that splits two regions.' },
    },
    {
      id: 'or',
      es: 'Con la función lógica «o» alcanza. Un único punto vale cero, los otros tres valen uno, y una recta deja cada grupo de su lado.',
      en: 'With the logical OR it is enough. One point is zero, the other three are one, and a single line leaves each group on its own side.',
    },
    {
      id: 'and',
      es: 'Con la función «y» también: ahora solo un punto vale uno. Basta mover la recta al otro extremo.',
      en: 'With AND as well: now only one point is one. It is enough to move the line to the other end.',
    },
    {
      id: 'xor-def',
      es: 'XOR es distinto: vale uno solo cuando las dos entradas son diferentes. Los unos quedan en esquinas opuestas, y los ceros, en las otras dos.',
      en: 'XOR is different: it is one only when the two inputs differ. The ones sit in opposite corners, and the zeros in the other two.',
      note: { es: 'XOR vale uno solo si las entradas difieren.', en: 'XOR is one only when the inputs differ.' },
    },
    {
      id: 'try1',
      es: 'Tu turno: gira y desplaza la recta e intenta dejar los unos de un lado y los ceros del otro.',
      en: 'Your turn: rotate and shift the line and try to leave the ones on one side and the zeros on the other.',
      gate: {
        id: 'tries',
        prompt: { es: 'Prueba al menos ocho posiciones distintas y fíjate en tu mejor resultado.', en: 'Try at least eight different positions and watch your best score.' },
      },
      pad: 0.4,
    },
    {
      id: 'proof',
      es: 'No es mala suerte. Este mapa recorre todas las rectas posibles, y en ninguna se acierta con las cuatro esquinas: el máximo es tres.',
      en: 'It is not bad luck. This map sweeps every possible line, and none gets all four corners right: the maximum is three.',
      note: { es: 'Ninguna recta separa XOR: el máximo es 3 de 4.', en: 'No line separates XOR: the maximum is 3 of 4.' },
      pad: 0.5,
    },
    {
      id: 'diagonals',
      es: 'La razón es geométrica. Las dos diagonales se cruzan en el centro, y una recta no puede dejar a la vez en lados opuestos dos segmentos que se cortan.',
      en: 'The reason is geometric. The two diagonals cross at the center, and a line cannot put two crossing segments on opposite sides at once.',
      pad: 0.4,
    },
    {
      id: 'history',
      es: 'En 1969, Minsky y Papert analizaron estos límites en su libro «Perceptrons». Junto con otros factores, el desencanto enfrió la financiación: fue el primer invierno de la IA.',
      en: 'In 1969, Minsky and Papert analyzed these limits in their book “Perceptrons.” Together with other factors, the disillusion cooled funding: the first AI winter.',
      note: { es: 'Primer invierno de la IA: años setenta.', en: 'First AI winter: the 1970s.' },
      tts: { es: 'En mil novecientos sesenta y nueve, Minsky y Papert analizaron estos límites en su libro «Perceptrons». Junto con otros factores, el desencanto enfrió la financiación: fue el primer invierno de la IA.', en: 'In nineteen sixty-nine, Minsky and Papert analyzed these limits in their book “Perceptrons.” Together with other factors, the disillusion cooled funding: the first AI winter.' },
      pad: 0.4,
    },
    {
      id: 'nuance',
      es: 'Conviene ser justos con la historia: el libro trataba sobre todo neuronas solas. Dudó de las redes con varias capas, pero no probó que fueran inútiles.',
      en: 'It is worth being fair to history: the book dealt mostly with single neurons. It doubted multi-layer networks, but it did not prove them useless.',
    },
    {
      id: 'fix',
      es: 'La salida es usar más de una neurona. Una recta separa un par de esquinas, otra recta separa el resto, y los unos quedan en la franja del medio.',
      en: 'The way out is to use more than one neuron. One line separates a pair of corners, another line separates the rest, and the ones fall in the band between.',
      pad: 0.4,
    },
    {
      id: 'hidden',
      es: 'Cada recta es una neurona que emite una señal nueva. Una neurona de salida combina esas señales. Las neuronas intermedias forman la capa oculta.',
      en: 'Each line is a neuron that emits a new signal. An output neuron combines those signals. The intermediate neurons form the hidden layer.',
      note: { es: 'Capa oculta: neuronas intermedias que crean señales nuevas.', en: 'Hidden layer: intermediate neurons that create new signals.' },
    },
    {
      id: 'compute',
      es: 'Veamos los números. La neurona de arriba pregunta si alguna entrada vale uno; la de abajo, si valen uno las dos. La salida dice sí a la primera y no a la segunda.',
      en: 'Let us look at the numbers. The top neuron asks whether any input is one; the bottom one, whether both are one. The output says yes to the first and no to the second.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: elige una de las cuatro entradas y observa cómo viaja la señal por la red hasta la salida.',
      en: 'Your turn: pick one of the four inputs and watch how the signal travels through the network to the output.',
      gate: {
        id: 'corners',
        prompt: { es: 'Prueba las cuatro entradas.', en: 'Try all four inputs.' },
      },
      pad: 0.4,
    },
    {
      id: 'space',
      es: 'Mira el truco: la capa oculta traduce cada punto a coordenadas nuevas, y en ese plano nuevo una sola recta ya separa los unos de los ceros.',
      en: 'Here is the trick: the hidden layer translates each point into new coordinates, and in that new plane a single line already separates the ones from the zeros.',
      note: { es: 'Las capas ocultas transforman el espacio hasta que una recta basta.', en: 'Hidden layers transform the space until one line is enough.' },
      pad: 0.6,
    },
    {
      id: 'limit',
      es: 'Queda un detalle práctico: estos pesos los elegimos a mano. En redes grandes hay que aprenderlos, y durante años no hubo un método ampliamente adoptado para entrenar capas ocultas.',
      en: 'One practical detail remains: we chose these weights by hand. In big networks they must be learned, and for years there was no widely adopted method for training hidden layers.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: una neurona separa con una recta, XOR muestra el límite de esa idea, y una capa oculta lo supera combinando rectas.',
      en: 'In short: one neuron separates with a line, XOR shows the limit of that idea, and a hidden layer overcomes it by combining lines.',
      note: { es: 'Más neuronas, en capas, superan el límite de la recta.', en: 'More neurons, in layers, overcome the limit of the line.' },
    },
    {
      id: 'bridge',
      es: 'Antes de aprender esos pesos, veamos qué poder se gana al apilar capas, y por qué no basta con sumar.',
      en: 'Before learning those weights, let us see what power stacking layers brings, and why adding is not enough.',
    },
  ],

  keyIdeas: {
    es: [
      'Una neurona separa el plano con una recta: solo resuelve problemas linealmente separables.',
      'XOR no es linealmente separable: sus dos diagonales se cruzan, así que ninguna recta acierta las cuatro esquinas.',
      'Una capa oculta crea señales nuevas (aquí, «alguna entrada» y «las dos»); en ese espacio nuevo, una recta sí separa.',
      'El límite de XOR era de la neurona sola: una capa oculta lo supera. Minsky y Papert dudaron de las redes de varias capas, pero lo dejaron como problema abierto; faltaba un método práctico para entrenar las capas ocultas.',
      'La historia de la IA tiene ciclos de entusiasmo y desencanto; los factores son varios, no solo un libro.',
    ],
    en: [
      'One neuron splits the plane with a line: it only solves linearly separable problems.',
      'XOR is not linearly separable: its two diagonals cross, so no line gets all four corners right.',
      'A hidden layer creates new signals (here, “some input” and “both”); in that new space, a line does separate.',
      'The XOR limit belonged to the single neuron: a hidden layer overcomes it. Minsky and Papert doubted multi-layer networks but left it as an open problem; what was missing was a practical method to train hidden layers.',
      'The history of AI has cycles of enthusiasm and disillusion; the causes are several, not just one book.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Minsky y Papert demostraron que las redes neuronales no podían funcionar y por eso se abandonaron.',
      en: 'Minsky and Papert proved that neural networks could not work, and that is why they were abandoned.',
    },
    right: {
      es: 'Mostraron límites reales de las neuronas solas. Dudaron de las redes con varias capas, pero lo dejaron como problema abierto: no probaron que fueran inútiles. El desencanto de los setenta tuvo además otras causas, como el informe Lighthill, publicado en 1973.',
      en: 'They showed real limits of single neurons. They doubted multi-layer networks, but left it as an open problem: they did not prove them useless. The disillusion of the 1970s also had other causes, such as the Lighthill report, published in 1973.',
    },
  },

  deeper: {
    es: `## Por qué XOR no es linealmente separable

Una neurona de dos entradas responde $f(x,y)=1$ si $w_1x+w_2y+b>0$ y $0$ en otro caso. Para XOR haría falta, a la vez:

$$b\\le 0,\\qquad w_1+b>0,\\qquad w_2+b>0,\\qquad w_1+w_2+b\\le 0.$$

Sumando las dos desigualdades del medio: $w_1+w_2+2b>0$, es decir, $w_1+w_2+b>-b\\ge 0$, lo que contradice la última. No existen pesos que funcionen: es el mismo argumento geométrico de las diagonales, en álgebra. Es también el argumento con que Minsky y Papert demuestran en *Perceptrons* (§2.1) que la equivalencia $x\\equiv y$, el complemento de XOR, no la calcula una sola neurona; el libro anota (§1.4) que, de las 16 funciones booleanas de dos variables, son las únicas dos con esa limitación. Lo comprobamos por fuerza bruta: con una rejilla fina de $(w_1,w_2,b)$ se alcanzan 14 de las 16 tablas de verdad, y las dos que faltan son XOR y su complemento.

## La solución con una capa oculta

Con la función escalón $H$ (vale 1 si el argumento es positivo y 0 si no), estos pesos resuelven XOR:

$$h_1=H(x+y-0.5),\\qquad h_2=H(x+y-1.5),\\qquad \\text{salida}=H(h_1-h_2-0.5).$$

$h_1$ es OR, $h_2$ es AND, y la salida es «OR y no AND», que es XOR. En el plano $(h_1,h_2)$ los cuatro puntos pasan a $(0,0)$, $(1,0)$, $(1,0)$ y $(1,1)$: los unos se funden en $(1,0)$ y una recta ya separa las clases.

## Qué probaron Minsky y Papert, y qué no

En *Perceptrons* (1969), un perceptrón «de orden $k$» es una neurona de umbral cuyas entradas son predicados, cada uno de los cuales depende como máximo de $k$ entradas. Entre otros resultados, probaron que la paridad de $n$ bits tiene orden $n$ (teorema 3.1.1): hace falta al menos un predicado que mire todas las entradas. Con $n=2$ la paridad es XOR.

Sobre las redes de varias capas, el libro dice (§13.2) que consideraron las «máquinas de Gamba», «dos capas de perceptrón», y que no encontraron otra clase multicapa realmente interesante; y añade que «es un problema de investigación importante dilucidar (o rechazar) nuestro juicio intuitivo de que la extensión es estéril» (traducción nuestra). Lo presentan como una conjetura por comprobar, no como un teorema.

## En código

\`\`\`python
import numpy as np

H = lambda z: (z > 0).astype(int)       # escalón

def xor_net(x, y):
    h1 = H(x + y - 0.5)                  # OR
    h2 = H(x + y - 1.5)                  # AND
    return H(h1 - h2 - 0.5)              # OR y no AND

for x in (0, 1):
    for y in (0, 1):
        print(x, y, "->", int(xor_net(np.array(x), np.array(y))))
# 0 0 -> 0 | 0 1 -> 1 | 1 0 -> 1 | 1 1 -> 0
\`\`\`

## Lo que viene

Los pesos de este ejemplo se eligieron a mano. En una red real se aprenden con el descenso del gradiente, que necesita el gradiente de cada peso, incluidos los de las capas ocultas: eso lo resuelve la retropropagación (lección 8), que Rumelhart, Hinton y Williams describieron en 1986 mostrando cómo las unidades ocultas llegan a representar características nuevas de la tarea. Antes, la lección 7 muestra por qué las capas necesitan una función de activación no lineal.`,
    en: `## Why XOR is not linearly separable

A two-input neuron answers $f(x,y)=1$ if $w_1x+w_2y+b>0$ and $0$ otherwise. For XOR we would need all of these at once:

$$b\\le 0,\\qquad w_1+b>0,\\qquad w_2+b>0,\\qquad w_1+w_2+b\\le 0.$$

Adding the two middle inequalities: $w_1+w_2+2b>0$, that is, $w_1+w_2+b>-b\\ge 0$, which contradicts the last one. No weights work: it is the same geometric argument about the diagonals, in algebra. It is also the argument Minsky and Papert use in *Perceptrons* (§2.1) to show that the equivalence $x\\equiv y$, the complement of XOR, cannot be computed by a single neuron; the book notes (§1.4) that, of the 16 Boolean functions of two variables, these are the only two with that limitation. We checked it by brute force: over a fine grid of $(w_1,w_2,b)$, 14 of the 16 truth tables are reachable, and the two missing ones are XOR and its complement.

## The solution with a hidden layer

With the step function $H$ (1 if the argument is positive, 0 otherwise), these weights solve XOR:

$$h_1=H(x+y-0.5),\\qquad h_2=H(x+y-1.5),\\qquad \\text{output}=H(h_1-h_2-0.5).$$

$h_1$ is OR, $h_2$ is AND, and the output is “OR and not AND,” which is XOR. In the $(h_1,h_2)$ plane the four points become $(0,0)$, $(1,0)$, $(1,0)$, and $(1,1)$: the ones merge at $(1,0)$ and a line now separates the classes.

## What Minsky and Papert proved, and what they did not

In *Perceptrons* (1969), a perceptron “of order $k$” is a threshold neuron whose inputs are predicates, each of which depends on at most $k$ inputs. Among other results, they proved that the parity of $n$ bits has order $n$ (theorem 3.1.1): at least one predicate that looks at all the inputs is required. With $n=2$, parity is XOR.

On multi-layer networks, the book says (§13.2) that they considered “Gamba machines,” described as “two layers of perceptron,” and found no other really interesting class of multilayered machine; and it adds: “we consider it to be an important research problem to elucidate (or reject) our intuitive judgment that the extension is sterile.” They present it as a conjecture to be tested, not as a theorem.

## In code

\`\`\`python
import numpy as np

H = lambda z: (z > 0).astype(int)       # step

def xor_net(x, y):
    h1 = H(x + y - 0.5)                  # OR
    h2 = H(x + y - 1.5)                  # AND
    return H(h1 - h2 - 0.5)              # OR and not AND

for x in (0, 1):
    for y in (0, 1):
        print(x, y, "->", int(xor_net(np.array(x), np.array(y))))
# 0 0 -> 0 | 0 1 -> 1 | 1 0 -> 1 | 1 1 -> 0
\`\`\`

## What comes next

The weights in this example were chosen by hand. In a real network they are learned with gradient descent, which needs the gradient of every weight, including those of hidden layers: backpropagation solves that (lesson 8), which Rumelhart, Hinton, and Williams described in 1986, showing how hidden units come to represent new features of the task. First, lesson 7 shows why layers need a nonlinear activation function.`,
  },

  lens: {
    es: [
      'Los ciclos de entusiasmo y desencanto son parte de la historia de la IA: pide evidencia con tus datos antes que promesas.',
      'Si un proveedor habla de un modelo «lineal» o «de una sola capa» (sin capa oculta), pregunta si tu problema tiene interacciones entre variables que ese modelo no puede capturar.',
      'Las capas ocultas capturan interacciones como XOR, pero suelen necesitar más datos y un entrenamiento cuidadoso: más capacidad también trae más riesgo de errores.',
      'Cuando alguien diga «eso la IA no puede hacerlo», pregunta con qué método: muchos límites eran de una arquitectura concreta, no de la idea general.',
    ],
    en: [
      'Cycles of enthusiasm and disillusion are part of AI’s history: ask for evidence with your data before promises.',
      'If a vendor talks about a “linear” or “single-layer” model (no hidden layer), ask whether your problem has interactions between variables that such a model cannot capture.',
      'Hidden layers capture interactions like XOR, but they usually need more data and careful training: more capacity also brings more risk of mistakes.',
      'When someone says “AI cannot do that,” ask with which method: many limits belonged to a specific architecture, not to the general idea.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué ninguna recta separa los cuatro puntos de XOR?', en: 'Why does no line separate the four XOR points?' },
      options: [
        { es: 'Porque faltan datos de entrenamiento.', en: 'Because there is not enough training data.' },
        { es: 'Porque sus dos diagonales se cruzan, y una recta no puede dejar en lados opuestos dos segmentos que se cortan.', en: 'Because its two diagonals cross, and a line cannot put two crossing segments on opposite sides.' },
        { es: 'Porque la neurona no tiene sesgo.', en: 'Because the neuron has no bias.' },
        { es: 'Porque XOR tiene tres entradas.', en: 'Because XOR has three inputs.' },
      ],
      answer: 1,
      why: { es: 'Los unos están en una diagonal y los ceros en la otra; las diagonales se cruzan en el centro. Con más datos o con sesgo, sigue siendo imposible para una sola recta.', en: 'The ones lie on one diagonal and the zeros on the other; the diagonals cross at the center. With more data or a bias, it is still impossible for a single line.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué hace la capa oculta en el ejemplo de XOR?', en: 'What does the hidden layer do in the XOR example?' },
      options: [
        { es: 'Memoriza las cuatro respuestas.', en: 'It memorizes the four answers.' },
        { es: 'Aumenta la tasa de aprendizaje.', en: 'It increases the learning rate.' },
        { es: 'Elimina el ruido de las entradas.', en: 'It removes noise from the inputs.' },
        { es: 'Traduce las entradas a señales nuevas en las que una recta sí separa las clases.', en: 'It translates the inputs into new signals in which a line does separate the classes.' },
      ],
      answer: 3,
      why: { es: 'La capa oculta calcula «OR» y «AND». En ese plano nuevo, los dos unos coinciden en un punto y una recta separa los grupos.', en: 'The hidden layer computes “OR” and “AND.” In that new plane the two ones coincide at one point and a line separates the groups.' },
    },
    {
      kind: 'calc',
      q: { es: 'Con h₁ = OR(x, y) y h₂ = AND(x, y), ¿qué valores toma la capa oculta para la entrada (1, 0)?', en: 'With h₁ = OR(x, y) and h₂ = AND(x, y), what values does the hidden layer take for the input (1, 0)?' },
      options: [
        { es: '(h₁, h₂) = (0, 0)', en: '(h₁, h₂) = (0, 0)' },
        { es: '(h₁, h₂) = (1, 1)', en: '(h₁, h₂) = (1, 1)' },
        { es: '(h₁, h₂) = (1, 0)', en: '(h₁, h₂) = (1, 0)' },
        { es: '(h₁, h₂) = (0, 1)', en: '(h₁, h₂) = (0, 1)' },
      ],
      answer: 2,
      why: { es: 'Para (1, 0): OR es 1 (hay una entrada en uno) y AND es 0 (no valen uno las dos).', en: 'For (1, 0): OR is 1 (one input is one) and AND is 0 (not both are one).' },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor afirma que su modelo «de una sola capa» (sin capa oculta) resuelve cualquier problema de clasificación. ¿Qué respuesta es la más sólida?', en: 'A vendor claims its “single-layer” model (no hidden layer) solves any classification problem. Which response is the soundest?' },
      options: [
        { es: 'Aceptarlo: los modelos de una capa son los más fiables.', en: 'Accept it: single-layer models are the most reliable.' },
        { es: 'Pedir evidencia con tus datos y preguntar cómo capta relaciones no lineales, porque una frontera lineal falla en casos como XOR.', en: 'Ask for evidence on your data and how it captures nonlinear relationships, because a linear boundary fails in cases like XOR.' },
        { es: 'Exigir que use más GPUs.', en: 'Demand that it use more GPUs.' },
        { es: 'Pedir que reduzca el número de entradas.', en: 'Ask it to reduce the number of inputs.' },
      ],
      answer: 1,
      why: { es: 'Una sola capa lineal solo traza fronteras rectas. Si tus datos tienen interacciones no lineales, necesitas no linealidad o más capas; la evidencia con tus propios datos lo confirma.', en: 'A single linear layer only draws straight boundaries. If your data has nonlinear interactions, you need nonlinearity or more layers; evidence on your own data confirms it.' },
    },
  ],

  glossary: ['neuron', 'decision-boundary', 'xor', 'linear-separability', 'hidden-layer', 'ai-winter'],

  terms: [
    { id: 'linear-separability', term: { es: 'Separabilidad lineal', en: 'Linear separability' }, def: { es: 'Propiedad de un conjunto de puntos de dos clases que se puede separar con una recta (o un plano, en más dimensiones).', en: 'The property of a set of two-class points that can be separated by a line (or a plane, in more dimensions).' } },
    { id: 'xor', term: { es: 'XOR (o exclusivo)', en: 'XOR (exclusive or)' }, def: { es: 'Función que vale uno solo cuando sus dos entradas son diferentes. Es el ejemplo clásico de problema no linealmente separable.', en: 'A function that is one only when its two inputs differ. It is the classic example of a problem that is not linearly separable.' } },
    { id: 'hidden-layer', term: { es: 'Capa oculta', en: 'Hidden layer' }, def: { es: 'Capa de neuronas entre la entrada y la salida. Crea señales intermedias que la salida combina; su valor no se observa directamente.', en: 'A layer of neurons between input and output. It creates intermediate signals that the output combines; its values are not observed directly.' } },
    { id: 'ai-winter', term: { es: 'Invierno de la IA', en: 'AI winter' }, def: { es: 'Periodo de menor financiación e interés por la inteligencia artificial tras expectativas incumplidas. El primero ocurrió en los años setenta.', en: 'A period of reduced funding and interest in artificial intelligence after unmet expectations. The first took place in the 1970s.' } },
  ],

  sources: [
    { title: 'The perceptron: a probabilistic model for information storage and organization in the brain', authors: 'Rosenblatt, F.', year: 1958, url: 'https://doi.org/10.1037/h0042519' },
    { title: 'Perceptrons: An Introduction to Computational Geometry (1969; texto leído en la edición ampliada de 1988: §1.4, §2.1, teorema 3.1.1 y §13.2)', authors: 'Minsky, M., Papert, S.', year: 1969, url: 'https://mitpress.mit.edu/9780262631112/perceptrons/' },
    { title: 'A Sociological Study of the Official History of the Perceptrons Controversy (Social Studies of Science 26(3), 611–659)', authors: 'Olazaran, M.', year: 1996, url: 'https://doi.org/10.1177/030631296026003005' },
    { title: 'Learning representations by back-propagating errors (Nature 323, 533–536)', authors: 'Rumelhart, D. E., Hinton, G. E., Williams, R. J.', year: 1986, url: 'https://doi.org/10.1038/323533a0' },
    { title: 'Artificial Intelligence: A General Survey (informe Lighthill, Science Research Council)', authors: 'Lighthill, J.', year: 1973, url: 'http://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm' },
    { title: 'What is science for? The Lighthill report on artificial intelligence reinterpreted (The British Journal for the History of Science 53(3), 289–310)', authors: 'Agar, J.', year: 2020, url: 'https://doi.org/10.1017/S0007087420000230' },
  ],
});
