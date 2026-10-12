import { defineLesson } from '../../../../../core/define';

// Lección 8 · Retropropagación. Una red diminuta (2-2-1, sigmoide, sin sesgos) recorrida con números reales:
// pase hacia delante, pérdida, culpa (gradiente) hacia atrás con la regla de la cadena y actualización.
// Los números de la escena salen de math.ts; verify-data.ts (misma carpeta) los recalcula de forma independiente,
// compara con diferencias finitas y ejecuta el código de «Por dentro». Registro: docs/v2/verificacion/backpropagation.md
export default defineLesson({
  id: 'backpropagation',

  objectives: {
    es: [
      'Calcular, paso a paso y con números reales, el pase hacia delante, la pérdida y las culpas (gradientes) de una red pequeña.',
      'Explicar la regla de la cadena como multiplicar la influencia de cada eslabón, y por qué la culpa de una capa se reutiliza hacia atrás.',
      'Distinguir lo que calcula la retropropagación (el gradiente) de lo que hace el descenso del gradiente (mover los pesos).',
    ],
    en: [
      'Compute, step by step and with real numbers, the forward pass, the loss, and the blames (gradients) of a small network.',
      'Explain the chain rule as multiplying the influence of each link, and why one layer’s blame is reused going backward.',
      'Tell apart what backpropagation computes (the gradient) from what gradient descent does (moves the weights).',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Ya sabemos corregir un peso restándole su pendiente. Pero una red tiene miles de pesos, en capas, y casi ninguno toca la salida. ¿Cómo sabe cada uno cuánto error le toca?',
      en: 'We know how to fix a weight: subtract its slope. But a network has thousands of weights, in layers, and almost none of them touch the output. How does each one know how much of the error is its fault?',
    },
    {
      id: 'tiny',
      es: 'Para ver la idea con números reales usaremos una red diminuta: dos entradas, dos neuronas ocultas y una salida. Son solo seis pesos, y sin sesgos, para que todo quepa en pantalla.',
      en: 'To see the idea with real numbers we will use a tiny network: two inputs, two hidden neurons, and one output. That is just six weights, and no biases, so everything fits on screen.',
    },
    {
      id: 'example',
      es: 'Le damos un solo ejemplo: una entrada vale uno, la otra vale un medio, y la respuesta correcta, el objetivo, es uno.',
      en: 'We give it a single example: one input is one, the other is one half, and the correct answer, the target, is one.',
    },
    {
      id: 'fwd-h',
      es: 'Primero, hacia delante. Cada neurona oculta suma sus entradas multiplicadas por sus pesos y aplica la sigmoide, que aplasta el resultado entre cero y uno.',
      en: 'First, forward. Each hidden neuron adds up its inputs times their weights and applies the sigmoid, which squashes the result between zero and one.',
    },
    {
      id: 'fwd-out',
      es: 'La neurona de salida hace lo mismo con lo que recibe de las ocultas. La predicción sale por debajo de la mitad, cuando debía acercarse a uno.',
      en: 'The output neuron does the same with what it receives from the hidden ones. The prediction comes out below one half, when it should be close to one.',
    },
    {
      id: 'loss',
      es: 'Medimos el error con la pérdida: la mitad del cuadrado de la diferencia entre la predicción y el objetivo. La mitad solo simplifica la derivada.',
      en: 'We measure the error with the loss: half the square of the difference between the prediction and the target. The half just simplifies the derivative.',
    },
    {
      id: 'question',
      es: 'Ahora, la pregunta de fondo: si movemos un peso un poco, ¿cuánto cambia la pérdida? Esa tasa de cambio es la derivada de ese peso; las seis juntas forman el gradiente. Aquí la llamaremos su culpa.',
      en: 'Now the real question: if we nudge a weight a little, how much does the loss change? That rate of change is that weight’s derivative; the six together form the gradient. Here we will call it its blame.',
      note: { es: 'Meta: la culpa de cada peso, es decir, su derivada (juntas, el gradiente).', en: 'Goal: the blame of each weight, that is, its derivative (together, the gradient).' },
    },
    {
      id: 'wiggle',
      es: 'Se puede tantear: mover un peso un poquito, repetir el pase hacia delante y ver cuánto cambia la pérdida. Con seis pesos, son seis pases extra.',
      en: 'One way is to probe: nudge a weight a tiny bit, repeat the forward pass, and see how much the loss changes. With six weights, that is six extra passes.',
    },
    {
      id: 'wiggle-cost',
      es: 'Con ciento setenta y cinco mil millones de pesos, como GPT-3, serían ciento setenta y cinco mil millones de pases extra en cada paso de entrenamiento. Imposible en la práctica.',
      en: 'With one hundred seventy-five billion weights, like GPT-3, that would mean one hundred seventy-five billion extra passes at every training step. Impossible in practice.',
      tts: {
        es: 'Con ciento setenta y cinco mil millones de pesos, como Ge pe te tres, serían ciento setenta y cinco mil millones de pases extra en cada paso de entrenamiento. Imposible en la práctica.',
        en: 'With one hundred seventy-five billion weights, like G P T three, that would mean one hundred seventy-five billion extra passes at every training step. Impossible in practice.',
      },
    },
    {
      id: 'chain',
      es: 'Aquí entra la regla de la cadena. Si B cambia el doble que A, y C el triple que B, entonces C cambia seis veces lo que A: las influencias se multiplican.',
      en: 'Here the chain rule comes in. If B changes twice as much as A, and C three times as much as B, then C changes six times as much as A: influences multiply.',
      note: { es: 'Regla de la cadena: la influencia total es el producto de la de cada eslabón.', en: 'Chain rule: the total influence is the product of each link’s influence.' },
      pad: 0.3,
    },
    {
      id: 'chain-w5',
      es: 'En la red, el peso cinco llega a la pérdida por tres eslabones: la suma de la neurona de salida, su sigmoide y la pérdida. Multiplicamos cuánto influye cada uno.',
      en: 'In the network, weight five reaches the loss through three links: the output neuron’s sum, its sigmoid, and the loss. We multiply how much each one matters.',
    },
    {
      id: 'back-err',
      es: 'El viaje de vuelta empieza en la pérdida. Si la predicción subiera un poco, la pérdida cambiaría a razón de la predicción menos el objetivo: aquí es negativo, así que subirla ayuda.',
      en: 'The trip back starts at the loss. If the prediction rose a little, the loss would change at a rate of the prediction minus the target: here it is negative, so raising it helps.',
      note: { es: 'Retropropagación: la culpa viaja de la salida hacia la entrada, capa por capa.', en: 'Backpropagation: the blame travels from the output to the input, layer by layer.' },
    },
    {
      id: 'back-sig',
      es: 'Luego cruza la sigmoide de salida, que reduce la culpa según su pendiente en ese punto. Lo que queda es la culpa de la neurona de salida.',
      en: 'Then it crosses the output sigmoid, which scales the blame by its slope at that point. What remains is the blame of the output neuron.',
    },
    {
      id: 'back-w56',
      es: 'Esa culpa llega a los dos pesos que alimentan la salida: cada uno la recibe multiplicada por la señal que llevaba, la activación de su neurona oculta. No se parte en trozos que suman.',
      en: 'That blame reaches the two weights that feed the output: each gets it multiplied by the signal it carried, the activation of its hidden neuron. It is not split into pieces that add up.',
      note: { es: 'Culpa de un peso = culpa de la neurona a la que llega × señal que llevaba.', en: 'A weight’s blame = blame of the neuron it feeds × the signal it carried.' },
      pad: 0.3,
    },
    {
      id: 'back-hidden',
      es: 'La culpa sigue hacia atrás por los mismos cables. Cada neurona oculta recibe la culpa de la salida, multiplicada por el peso que las une y por la pendiente de su propia sigmoide.',
      en: 'The blame keeps going backward along the same wires. Each hidden neuron receives the output’s blame, multiplied by the weight that connects them and by the slope of its own sigmoid.',
      pad: 0.3,
    },
    {
      id: 'sign',
      es: 'Fíjate en el signo: el peso seis es negativo, así que esa neurona recibe la culpa invertida. Si se activara más, la salida bajaría y el error subiría.',
      en: 'Notice the sign: weight six is negative, so that neuron receives the blame flipped. If it fired more, the output would drop and the error would rise.',
    },
    {
      id: 'back-w14',
      es: 'Por último, la culpa de cada neurona oculta llega a sus pesos de entrada, multiplicada por la entrada que cada peso recibió.',
      en: 'Finally, each hidden neuron’s blame reaches its input weights, multiplied by the input each weight received.',
      pad: 0.3,
    },
    {
      id: 'reuse',
      es: 'Mira qué pasó: para llegar al peso uno reutilizamos la culpa de la salida, ya calculada. Cada culpa se calcula una sola vez y la aprovechan todos los pesos de atrás.',
      en: 'Look at what happened: to reach weight one we reused the output’s blame, already computed. Each blame is computed once and used by every weight behind it.',
      note: { es: 'Cada culpa se calcula una vez y la reutilizan todos los pesos de atrás.', en: 'Each blame is computed once and reused by every weight behind it.' },
      pad: 0.3,
    },
    {
      id: 'all-six',
      es: 'Con un solo viaje de vuelta tenemos las seis culpas. Eso es la retropropagación: el gradiente de todos los pesos, calculado de una vez. Y coincide con el que obtuvimos tanteando.',
      en: 'With a single trip back we have all six blames. That is backpropagation: the gradient of every weight, computed at once. And it matches what we got by probing.',
      pad: 0.3,
    },
    {
      id: 'cost',
      es: 'Y cuesta poco: en redes grandes, el viaje de vuelta pide del orden del doble de cómputo que un pase hacia delante, sin importar cuántos pesos haya. Por eso se pueden entrenar redes enormes.',
      en: 'And it is cheap: in large networks, the trip back takes on the order of twice the compute of a forward pass, no matter how many weights there are. That is why huge networks can be trained.',
      note: { es: 'El viaje de vuelta cuesta del orden de dos pases hacia delante, no uno por peso.', en: 'The trip back costs about two forward passes, not one per weight.' },
    },
    {
      id: 'read-sign',
      es: 'Cómo leer una culpa: si es positiva, subir ese peso sube el error, así que conviene bajarlo. Si es negativa, conviene subirlo.',
      en: 'How to read a blame: if it is positive, raising that weight raises the error, so it should go down. If it is negative, it should go up.',
    },
    {
      id: 'hand-demo',
      es: 'Probemos con el peso cinco: su culpa es negativa, así que lo subimos un poco, y otra vez. La pérdida baja… y todas las culpas cambian, no solo la suya.',
      en: 'Let’s try weight five: its blame is negative, so we raise it a little, and again. The loss drops… and all the blames change, not just its own.',
      pad: 0.5,
    },
    {
      id: 'try1',
      es: 'Si quieres, sigue tú: arrastra un peso, o elígelo y súbelo o bájalo, guiándote por el signo de su culpa.',
      en: 'If you like, carry on yourself: drag a weight, or pick one and raise or lower it, following the sign of its blame.',
      gate: {
        id: 'hand',
        prompt: {
          es: 'baja la pérdida a 0.10 o menos: sube los pesos de culpa negativa y baja los de culpa positiva.',
          en: 'bring the loss down to 0.10 or less: raise weights with negative blame, lower those with positive blame.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'reset-ex',
      es: 'Lo que acabas de hacer a mano es, en esencia, el descenso del gradiente. Volvamos a los pesos de partida y dejemos que lo haga la regla.',
      en: 'What you just did by hand is, in essence, gradient descent. Let us go back to the starting weights and let the rule do it.',
      pad: 0.3,
    },
    {
      id: 'who',
      es: 'Una confusión frecuente: hoy se llama retropropagación solo al cálculo de las culpas; no mueve ningún peso. Quien los corrige es el descenso del gradiente, con esas culpas.',
      en: 'A common confusion: today backpropagation names only the computation of the blames; it does not move any weight. The one that corrects the weights is gradient descent, using those blames.',
      note: { es: 'La retropropagación calcula el gradiente; el descenso del gradiente corrige los pesos.', en: 'Backpropagation computes the gradient; gradient descent corrects the weights.' },
    },
    {
      id: 'update',
      es: 'La regla de la lección cuatro: cada peso se mueve en sentido contrario a su culpa, un paso del tamaño de la culpa por la tasa de aprendizaje. Aquí la tasa vale uno.',
      en: 'The rule from lesson four: each weight moves opposite to its blame, by a step equal to the blame times the learning rate. Here the rate is one.',
      pad: 0.3,
    },
    {
      id: 'after',
      es: 'Repetimos el pase hacia delante con los pesos nuevos. La predicción se acerca al objetivo y la pérdida baja. Eso fue un paso completo de entrenamiento.',
      en: 'We repeat the forward pass with the new weights. The prediction moves closer to the target and the loss drops. That was one complete training step.',
      pad: 0.3,
    },
    {
      id: 'train-demo',
      es: 'Ahora dejemos que la regla lo haga sola: paso tras paso, la pérdida sigue bajando y la predicción se acerca al objetivo.',
      en: 'Now let the rule do it on its own: step after step, the loss keeps falling and the prediction gets closer to the target.',
      pad: 0.6,
    },
    {
      id: 'try2',
      es: 'Si quieres, da tú más pasos con el botón, o cambia la tasa de aprendizaje y mira qué pasa.',
      en: 'If you like, take more steps with the button, or change the learning rate and see what happens.',
      gate: {
        id: 'train',
        prompt: { es: 'da al menos cinco pasos de entrenamiento.', en: 'take at least five training steps.' },
      },
      pad: 0.4,
    },
    {
      id: 'loop',
      es: 'En resumen, cada paso repite cuatro tiempos: pase hacia delante, pérdida, retropropagación para las culpas y descenso del gradiente para los pesos. Ese bucle, repetido muchísimas veces, es entrenar.',
      en: 'In short, every step repeats four beats: forward pass, loss, backpropagation for the blames, and gradient descent for the weights. That loop, repeated an enormous number of times, is training.',
      note: { es: 'Un paso: hacia delante, pérdida, hacia atrás, actualizar.', en: 'One step: forward, loss, backward, update.' },
      pad: 0.3,
    },
    {
      id: 'history-a',
      es: 'La idea tiene historia: en los años setenta ya se sabía recorrer un cálculo hacia atrás, y a principios de los ochenta se propuso usarlo para entrenar redes.',
      en: 'The idea has a history: by the nineteen-seventies people knew how to run a computation backward, and in the early eighties it was proposed for training networks.',
      pad: 0.3,
    },
    {
      id: 'history-b',
      es: 'En mil novecientos ochenta y seis, Rumelhart, Hinton y Williams publicaron la versión que la hizo célebre: mostraron que las capas ocultas aprenden solas representaciones útiles.',
      en: 'In nineteen eighty-six, Rumelhart, Hinton, and Williams published the version that made it famous: they showed that hidden layers learn useful representations on their own.',
      tts: {
        es: 'En mil novecientos ochenta y seis, Rúmeljart, Hinton y Williams publicaron la versión que la hizo célebre: mostraron que las capas ocultas aprenden solas representaciones útiles.',
      },
      pad: 0.3,
    },
    {
      id: 'limit-memory',
      es: 'Dos límites honestos. Primero, para calcular las culpas hay que recordar los valores del pase hacia delante; es una de las razones por las que entrenar gasta mucha más memoria que usar el modelo.',
      en: 'Two honest limits. First, to compute the blames you must remember the values from the forward pass; that is one of the reasons training uses far more memory than using the model.',
      pad: 0.3,
    },
    {
      id: 'limit-fade',
      es: 'Segundo, la culpa puede atenuarse al cruzar capas. La pendiente de una sigmoide es un cuarto o menos, así que con muchas capas el producto puede casi desaparecer. Lo retomaremos con las redes recurrentes.',
      en: 'Second, the blame can fade as it crosses layers. A sigmoid’s slope is one quarter or less, so with many layers the product can almost vanish. We will come back to this with recurrent networks.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Ya sabemos calcular la culpa de cada peso y corregirlo. Pero usamos un solo ejemplo. ¿Cómo se entrena bien con millones de ejemplos y miles de millones de pesos?',
      en: 'We now know how to compute each weight’s blame and correct it. But we used a single example. How do you train well with millions of examples and billions of weights?',
    },
  ],

  keyIdeas: {
    es: [
      'El error final de una red se reparte entre miles de pesos escondidos en capas. Saber cuánta culpa tiene cada uno es el problema de la asignación de crédito.',
      'La regla de la cadena dice que la influencia total de un peso sobre el error es el producto de la influencia de cada eslabón del camino.',
      'La retropropagación recorre la red de la salida hacia la entrada, calcula la culpa de cada neurona y la reutiliza para la capa anterior: obtiene todo el gradiente en un solo viaje.',
      'La retropropagación solo calcula el gradiente. Quien corrige los pesos es el descenso del gradiente: w ← w − η · culpa.',
      'Es barata (en redes grandes, del orden de un par de pases hacia delante), pero exige guardar los valores del pase hacia delante, y la culpa puede atenuarse al cruzar muchas capas.',
    ],
    en: [
      'A network’s final error is shared among thousands of weights hidden in layers. Knowing how much blame each one carries is the credit assignment problem.',
      'The chain rule says that a weight’s total influence on the error is the product of the influence of each link along the path.',
      'Backpropagation sweeps the network from output to input, computes each neuron’s blame, and reuses it for the previous layer: it gets the whole gradient in a single trip.',
      'Backpropagation only computes the gradient. The one that corrects the weights is gradient descent: w ← w − η · blame.',
      'It is cheap (in large networks, on the order of a couple of forward passes), but it needs the values of the forward pass to be stored, and the blame can fade as it crosses many layers.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La retropropagación es el mecanismo con el que la red corrige sus pesos.',
      en: 'Backpropagation is the mechanism by which the network corrects its weights.',
    },
    right: {
      es: 'En el uso actual, solo calcula cuánta culpa tiene cada peso (el gradiente), con un viaje hacia atrás. Mover los pesos es trabajo del descenso del gradiente (u otro optimizador), que usa esos números.',
      en: 'In current usage, it only computes how much blame each weight carries (the gradient), with one trip backward. Moving the weights is the job of gradient descent (or another optimizer), which uses those numbers.',
    },
  },

  deeper: {
    es: `## Las ecuaciones de la red

La red de la lección tiene entradas $x_1, x_2$, dos neuronas ocultas, una de salida, activación sigmoide $\\sigma(z)=1/(1+e^{-z})$ y no usa sesgos:

$$z_1 = w_1x_1 + w_2x_2,\\quad z_2 = w_3x_1 + w_4x_2,\\quad a_j=\\sigma(z_j)$$

$$z = w_5a_1 + w_6a_2,\\quad \\hat y=\\sigma(z),\\quad L=\\tfrac12(\\hat y-t)^2$$

Con $\\mathbf x=(1,\\,0.5)$, $t=1$ y $\\mathbf w=(0.6,\\,-0.3,\\,0.7,\\,0.5,\\,0.8,\\,-0.9)$ resulta $\\hat y\\approx 0.460$ y $L\\approx 0.146$. Los pesos de partida se eligieron de modo que cada cuenta mostrada con tres decimales se pueda repetir a mano, con las cifras ya redondeadas, sin discrepancias (el script \`verify-data.ts\` de la lección lo comprueba, y compara el gradiente con diferencias finitas).

## La regla de la cadena, paso a paso

Si $L$ depende de $\\hat y$, este de $z$ y este de $w_5$, la derivada de $L$ respecto de $w_5$ es el producto de las derivadas de cada eslabón:

$$\\frac{\\partial L}{\\partial w_5}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w_5}=(\\hat y-t)\\cdot\\hat y(1-\\hat y)\\cdot a_1$$

La derivada de la sigmoide es $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))$, así que se calcula con la activación que ya se guardó. Los dos primeros factores forman la **culpa de la neurona** $\\delta=\\partial L/\\partial z$. Hacia atrás, capa por capa:

$$\\delta_y=(\\hat y-t)\\,\\hat y(1-\\hat y),\\qquad \\frac{\\partial L}{\\partial w_{4+j}}=\\delta_y\\,a_j$$

$$\\delta_j=\\delta_y\\,w_{4+j}\\,a_j(1-a_j),\\qquad \\frac{\\partial L}{\\partial w}=\\delta_j\\,x_i$$

Con los números de la lección: $\\delta_y=-0.540\\cdot0.248\\approx-0.134$; $\\partial L/\\partial w_5=-0.134\\cdot0.611\\approx-0.082$; $\\delta_1=-0.134\\cdot0.8\\cdot0.238\\approx-0.026$ y $\\partial L/\\partial w_1=\\delta_1\\,x_1\\approx-0.026$. Como $w_6<0$, $\\delta_2$ sale con signo contrario ($+0.024$). Observa que las culpas $\\partial L/\\partial w_5$ y $\\partial L/\\partial w_6$ no suman $\\delta_y$: cada peso recibe la culpa de la neurona multiplicada por su propia señal, no una parte de ella.

## En capas y en forma de matriz

Con $W^{(l)}$ la matriz que lleva $\\mathbf a^{(l-1)}$ a $\\mathbf z^{(l)}$, las mismas ideas se escriben para cualquier número de capas:

$$\\boldsymbol\\delta^{(l)}=\\big(W^{(l+1)\\top}\\boldsymbol\\delta^{(l+1)}\\big)\\odot\\sigma'(\\mathbf z^{(l)}),\\qquad \\frac{\\partial L}{\\partial W^{(l)}}=\\boldsymbol\\delta^{(l)}\\,\\mathbf a^{(l-1)\\top},\\qquad \\frac{\\partial L}{\\partial \\mathbf b^{(l)}}=\\boldsymbol\\delta^{(l)}$$

Cada $\\boldsymbol\\delta^{(l)}$ se calcula **una vez** a partir de la capa siguiente: eso es lo que hace barato el método. Con ReLU, $\\sigma'$ se reemplaza por $1$ si $z>0$ y $0$ en otro caso.

## Por qué es barata

Para una pérdida escalar y $N$ pesos, el modo inverso de la diferenciación automática (las técnicas para derivar programas de forma exacta; la retropropagación es su caso particular para redes) entrega las $N$ derivadas en un solo recorrido hacia atrás. El modo directo, o tantear con diferencias finitas, necesita un recorrido por peso. El gradiente completo cuesta una constante pequeña por el costo de evaluar la función: Baydin et al. (2018), citando a Griewank y Walther (2008), dan $c<6$ y típicamente entre 2 y 3, y Griewank (2012) lo llama el «principio del gradiente barato».

En un transformer grande, Kaplan et al. (2020) cuentan unos $2N$ FLOPs por token hacia delante, con $N$ los parámetros sin contar los de embeddings, y observan que el pase hacia atrás cuesta aproximadamente el doble: de ahí su $\\approx 6N$ FLOPs por token de entrenamiento. A cambio, hay que **guardar las activaciones** del pase hacia delante hasta usarlas: el propio artículo de 1986 señala que las salidas de las capas intermedias del pase hacia delante hacen falta para el pase hacia atrás.

## Un límite: la culpa puede atenuarse

Como $\\sigma'(z)\\le \\tfrac14$, cada capa de sigmoides aporta un factor de a lo sumo $\\tfrac14$ a la culpa: $(\\tfrac14)^n$ tras $n$ capas. Los pesos también multiplican en cada capa y podrían compensarlo, pero con pesos moderados el producto se encoge de forma exponencial. Por eso en redes profundas se prefieren otras activaciones, conexiones residuales y variantes como la LSTM, temas de las lecciones 12 y 13.

## De dónde viene, con cuidado

El nombre y la fama son de 1986, pero la idea es más vieja y tuvo varios descubridores:
- **Linnainmaa.** Su tesis de maestría (Universidad de Helsinki, 1970, en finés; resultados en inglés en *BIT*, 1976) estudia cómo se acumula el error de redondeo de un algoritmo y propone lo que hoy se llama modo inverso. Según Griewank (2012), él no lo presentó como un método para obtener gradientes de forma barata.
- **Werbos.** Su tesis doctoral en estadística (Harvard, agosto de 1974) desarrolla las «derivadas ordenadas» y la «retroalimentación dinámica» para modelos de predicción. Él mismo cuenta (Werbos, 2006) que de las redes neuronales solo escribió unas palabras en el capítulo 5; Goodfellow et al. (2016) fechan en 1981 su propuesta de aplicarlo a entrenar redes neuronales.
- **Rumelhart, Hinton y Williams (*Nature*, 1986).** Usan la misma matemática de esta lección: error $\\tfrac12\\sum(y-d)^2$, sigmoide, un pase hacia delante y uno hacia atrás que «propaga derivadas». Reconocen que David Parker y Yann LeCun descubrieron variantes de forma independiente. En el artículo, «back-propagation» nombra todo el procedimiento de aprendizaje (con la actualización $\\Delta w=-\\varepsilon\\,\\partial E/\\partial w$ y una variante con término de aceleración, lo que hoy se llama momento); la distinción de hoy, retropropagación para el gradiente y otro algoritmo para aprender con él, es la que explican Goodfellow et al. (2016). Los autores cierran diciendo que el procedimiento, «en su forma actual, no es un modelo plausible del aprendizaje en los cerebros».

## En código

\`\`\`python
import math

def sigma(z):
    return 1 / (1 + math.exp(-z))

X, T = (1.0, 0.5), 1.0

def forward(w):
    a1 = sigma(w[0] * X[0] + w[1] * X[1])
    a2 = sigma(w[2] * X[0] + w[3] * X[1])
    y = sigma(w[4] * a1 + w[5] * a2)
    return a1, a2, y, 0.5 * (y - T) ** 2

def backward(w):
    a1, a2, y, loss = forward(w)
    d_y = (y - T) * y * (1 - y)            # culpa de la neurona de salida
    d_1 = d_y * w[4] * a1 * (1 - a1)       # culpa de la oculta 1
    d_2 = d_y * w[5] * a2 * (1 - a2)       # culpa de la oculta 2
    grad = [d_1 * X[0], d_1 * X[1], d_2 * X[0], d_2 * X[1], d_y * a1, d_y * a2]
    return loss, grad

w = [0.6, -0.3, 0.7, 0.5, 0.8, -0.9]
loss, grad = backward(w)
print(round(loss, 3), [round(g, 3) for g in grad])
# 0.146 [-0.026, -0.013, 0.024, 0.012, -0.082, -0.097]

# comprobación: tantear cada peso (un pase hacia delante extra por peso)
eps = 1e-6
check = []
for k in range(6):
    w2 = w.copy()
    w2[k] += eps
    check.append((forward(w2)[3] - loss) / eps)
print([round(c, 3) for c in check])
# [-0.026, -0.013, 0.024, 0.012, -0.082, -0.097]

# un paso de descenso del gradiente: lo da el descenso, no la retropropagación
eta = 1.0
w = [wk - eta * g for wk, g in zip(w, grad)]
print(round(forward(w)[3], 3))
# 0.129
\`\`\`

## Lo que viene

Con datos reales el gradiente se calcula sobre un lote de ejemplos y no sobre uno solo, y optimizadores como el momento o Adam transforman ese gradiente antes de mover los pesos. Todos reciben el gradiente de la retropropagación. Es el tema de la lección 9.`,
    en: `## The network’s equations

The lesson’s network has inputs $x_1, x_2$, two hidden neurons, one output neuron, a sigmoid activation $\\sigma(z)=1/(1+e^{-z})$, and no biases:

$$z_1 = w_1x_1 + w_2x_2,\\quad z_2 = w_3x_1 + w_4x_2,\\quad a_j=\\sigma(z_j)$$

$$z = w_5a_1 + w_6a_2,\\quad \\hat y=\\sigma(z),\\quad L=\\tfrac12(\\hat y-t)^2$$

With $\\mathbf x=(1,\\,0.5)$, $t=1$, and $\\mathbf w=(0.6,\\,-0.3,\\,0.7,\\,0.5,\\,0.8,\\,-0.9)$ we get $\\hat y\\approx 0.460$ and $L\\approx 0.146$. The starting weights were chosen so that every calculation shown with three decimals can be repeated by hand, using the already-rounded figures, without discrepancies (the lesson’s \`verify-data.ts\` script checks it, and compares the gradient with finite differences).

## The chain rule, step by step

If $L$ depends on $\\hat y$, which depends on $z$, which depends on $w_5$, the derivative of $L$ with respect to $w_5$ is the product of the derivatives of each link:

$$\\frac{\\partial L}{\\partial w_5}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w_5}=(\\hat y-t)\\cdot\\hat y(1-\\hat y)\\cdot a_1$$

The sigmoid’s derivative is $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))$, so it is computed from the activation that was already stored. The first two factors form the **neuron’s blame** $\\delta=\\partial L/\\partial z$. Going backward, layer by layer:

$$\\delta_y=(\\hat y-t)\\,\\hat y(1-\\hat y),\\qquad \\frac{\\partial L}{\\partial w_{4+j}}=\\delta_y\\,a_j$$

$$\\delta_j=\\delta_y\\,w_{4+j}\\,a_j(1-a_j),\\qquad \\frac{\\partial L}{\\partial w}=\\delta_j\\,x_i$$

With the lesson’s numbers: $\\delta_y=-0.540\\cdot0.248\\approx-0.134$; $\\partial L/\\partial w_5=-0.134\\cdot0.611\\approx-0.082$; $\\delta_1=-0.134\\cdot0.8\\cdot0.238\\approx-0.026$ and $\\partial L/\\partial w_1=\\delta_1\\,x_1\\approx-0.026$. Since $w_6<0$, $\\delta_2$ comes out with the opposite sign ($+0.024$). Note that the blames $\\partial L/\\partial w_5$ and $\\partial L/\\partial w_6$ do not add up to $\\delta_y$: each weight gets the neuron’s blame multiplied by its own signal, not a share of it.

## In layers and in matrix form

With $W^{(l)}$ the matrix that takes $\\mathbf a^{(l-1)}$ to $\\mathbf z^{(l)}$, the same ideas are written for any number of layers:

$$\\boldsymbol\\delta^{(l)}=\\big(W^{(l+1)\\top}\\boldsymbol\\delta^{(l+1)}\\big)\\odot\\sigma'(\\mathbf z^{(l)}),\\qquad \\frac{\\partial L}{\\partial W^{(l)}}=\\boldsymbol\\delta^{(l)}\\,\\mathbf a^{(l-1)\\top},\\qquad \\frac{\\partial L}{\\partial \\mathbf b^{(l)}}=\\boldsymbol\\delta^{(l)}$$

Each $\\boldsymbol\\delta^{(l)}$ is computed **once** from the next layer: that is what makes the method cheap. With ReLU, $\\sigma'$ is replaced by $1$ if $z>0$ and $0$ otherwise.

## Why it is cheap

For a scalar loss and $N$ weights, the reverse mode of automatic differentiation (the techniques for differentiating programs exactly; backpropagation is its special case for networks) delivers all $N$ derivatives in a single backward sweep. The forward mode, or probing with finite differences, needs one sweep per weight. The whole gradient costs a small constant times the cost of evaluating the function: Baydin et al. (2018), citing Griewank and Walther (2008), give $c<6$ and typically between 2 and 3, and Griewank (2012) calls it the “cheap gradient principle”.

In a large transformer, Kaplan et al. (2020) count about $2N$ FLOPs per token going forward, with $N$ the parameters excluding embeddings, and note that the backward pass costs approximately twice as much: hence their $\\approx 6N$ FLOPs per training token. In exchange, the **activations** of the forward pass must be stored until they are used: the 1986 paper itself points out that the outputs of the intermediate layers in the forward pass are needed for the backward pass.

## A limit: the blame can fade

Since $\\sigma'(z)\\le \\tfrac14$, each layer of sigmoids contributes a factor of at most $\\tfrac14$ to the blame: $(\\tfrac14)^n$ after $n$ layers. The weights also multiply at every layer and could compensate, but with moderate weights the product shrinks exponentially. That is why deep networks favor other activations, residual connections, and variants such as the LSTM, topics of lessons 12 and 13.

## Where it comes from, carefully

The name and the fame date from 1986, but the idea is older and had several discoverers:
- **Linnainmaa.** His master’s thesis (University of Helsinki, 1970, in Finnish; results in English in *BIT*, 1976) studies how the rounding error of an algorithm accumulates and proposes what is now called reverse mode. According to Griewank (2012), he did not present it as a way to get gradients cheaply.
- **Werbos.** His doctoral thesis in statistics (Harvard, August 1974) develops “ordered derivatives” and “dynamic feedback” for prediction models. He himself says (Werbos, 2006) that he wrote only a few words about neural networks, in chapter 5; Goodfellow et al. (2016) date to 1981 his proposal to apply it to training neural networks.
- **Rumelhart, Hinton, and Williams (*Nature*, 1986).** They use the same mathematics as this lesson: error $\\tfrac12\\sum(y-d)^2$, sigmoid, one forward pass and one backward pass that “propagates derivatives”. They acknowledge that David Parker and Yann LeCun discovered variants independently. In the paper, “back-propagation” names the whole learning procedure (with the update $\\Delta w=-\\varepsilon\\,\\partial E/\\partial w$ and a variant with an acceleration term, what is now called momentum); today’s distinction, backpropagation for the gradient and another algorithm to learn with it, is the one Goodfellow et al. (2016) explain. The authors close by saying that the procedure, “in its current form, is not a plausible model of learning in brains”.

## In code

\`\`\`python
import math

def sigma(z):
    return 1 / (1 + math.exp(-z))

X, T = (1.0, 0.5), 1.0

def forward(w):
    a1 = sigma(w[0] * X[0] + w[1] * X[1])
    a2 = sigma(w[2] * X[0] + w[3] * X[1])
    y = sigma(w[4] * a1 + w[5] * a2)
    return a1, a2, y, 0.5 * (y - T) ** 2

def backward(w):
    a1, a2, y, loss = forward(w)
    d_y = (y - T) * y * (1 - y)            # blame of the output neuron
    d_1 = d_y * w[4] * a1 * (1 - a1)       # blame of hidden 1
    d_2 = d_y * w[5] * a2 * (1 - a2)       # blame of hidden 2
    grad = [d_1 * X[0], d_1 * X[1], d_2 * X[0], d_2 * X[1], d_y * a1, d_y * a2]
    return loss, grad

w = [0.6, -0.3, 0.7, 0.5, 0.8, -0.9]
loss, grad = backward(w)
print(round(loss, 3), [round(g, 3) for g in grad])
# 0.146 [-0.026, -0.013, 0.024, 0.012, -0.082, -0.097]

# check: probe each weight (one extra forward pass per weight)
eps = 1e-6
check = []
for k in range(6):
    w2 = w.copy()
    w2[k] += eps
    check.append((forward(w2)[3] - loss) / eps)
print([round(c, 3) for c in check])
# [-0.026, -0.013, 0.024, 0.012, -0.082, -0.097]

# one gradient descent step: gradient descent does this, not backpropagation
eta = 1.0
w = [wk - eta * g for wk, g in zip(w, grad)]
print(round(forward(w)[3], 3))
# 0.129
\`\`\`

## What comes next

With real data the gradient is computed on a batch of examples rather than on a single one, and optimizers such as momentum or Adam transform that gradient before moving the weights. All of them receive the gradient from backpropagation. That is the topic of lesson 9.`,
  },

  lens: {
    es: [
      'Un paso de entrenamiento cuesta del orden de tres pases hacia delante: uno hacia delante y uno hacia atrás que cuesta el doble. Pide el costo por token de entrenamiento, no solo el de uso.',
      'Entrenar exige guardar los valores intermedios del pase hacia delante: la memoria de la GPU, no solo el cómputo, limita qué modelo cabe. Pregunta cuánta memoria pide entrenar frente a usar.',
      'Por retropropagación solo se entrena lo que es derivable. Una regla dura, una búsqueda en una base de datos o una decisión discreta en medio del sistema cortan el flujo de la culpa: ahí hacen falta otros métodos.',
      'Casi nadie programa la retropropagación a mano: PyTorch y TensorFlow la derivan automáticamente. Las preguntas útiles son qué partes se entrenan y cuáles se congelan, porque congelar capas ahorra cómputo y memoria de gradientes.',
    ],
    en: [
      'One training step costs about three forward passes: one forward and one backward that costs twice as much. Ask for the training cost per token, not just the cost of use.',
      'Training requires storing the intermediate values of the forward pass: GPU memory, not just compute, limits which model fits. Ask how much memory training needs compared with using the model.',
      'Only what is differentiable can be trained by backpropagation. A hard rule, a database lookup, or a discrete decision in the middle of the system cuts the flow of blame: other methods are needed there.',
      'Almost nobody codes backpropagation by hand: PyTorch and TensorFlow derive it automatically. The useful questions are which parts are trained and which are frozen, because freezing layers saves compute and gradient memory.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: {
        es: 'Un compañero dice: «la retropropagación corrige los pesos de la red». ¿Qué es más exacto?',
        en: 'A colleague says: “backpropagation corrects the network’s weights.” What is more accurate?',
      },
      options: [
        { es: 'Mueve cada peso en sentido contrario a su culpa y así reduce el error.', en: 'It moves each weight opposite to its blame and so reduces the error.' },
        { es: 'Calcula cuánta culpa tiene cada peso; el descenso del gradiente usa esos números para moverlos.', en: 'It computes how much blame each weight carries; gradient descent uses those numbers to move them.' },
        { es: 'Calcula la predicción de la red a partir de los pesos.', en: 'It computes the network’s prediction from the weights.' },
        { es: 'Elige cuántas capas y neuronas debe tener la red.', en: 'It chooses how many layers and neurons the network should have.' },
      ],
      answer: 1,
      why: {
        es: 'En el uso actual, la retropropagación solo calcula el gradiente: cuánto cambiaría el error con cada peso. Quien actualiza los pesos, restando la tasa de aprendizaje por la culpa, es el descenso del gradiente (u otro optimizador).',
        en: 'In current usage, backpropagation only computes the gradient: how much the error would change with each weight. The one that updates the weights, subtracting the learning rate times the blame, is gradient descent (or another optimizer).',
      },
    },
    {
      kind: 'concept',
      q: {
        es: '¿Por qué la retropropagación es mucho más barata que tantear los pesos uno por uno?',
        en: 'Why is backpropagation much cheaper than probing the weights one by one?',
      },
      options: [
        { es: 'Porque usa menos pesos que el método de tantear.', en: 'Because it uses fewer weights than the probing method.' },
        { es: 'Porque solo corrige los pesos de la última capa.', en: 'Because it only corrects the weights of the last layer.' },
        { es: 'Porque descarta las capas que no cambian la salida.', en: 'Because it discards the layers that do not change the output.' },
        { es: 'Porque reutiliza la culpa ya calculada de una capa para la anterior y obtiene todas en un solo viaje hacia atrás.', en: 'Because it reuses each layer’s already computed blame for the previous one and gets them all in a single trip backward.' },
      ],
      answer: 3,
      why: {
        es: 'Tantear exige un pase hacia delante extra por cada peso. La retropropagación aplica la regla de la cadena capa por capa y reutiliza cada culpa: en redes grandes su costo es del orden de un par de pases hacia delante, sin importar cuántos pesos haya.',
        en: 'Probing needs one extra forward pass for every weight. Backpropagation applies the chain rule layer by layer and reuses each blame: in large networks its cost is about a couple of forward passes, no matter how many weights there are.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'La culpa de la neurona de salida es −0.2. Un peso de 0.5 une una neurona oculta con la salida, y la pendiente de la sigmoide de esa neurona oculta vale 0.25. ¿Cuál es la culpa de la neurona oculta?',
        en: 'The output neuron’s blame is −0.2. A weight of 0.5 connects a hidden neuron to the output, and the slope of that hidden neuron’s sigmoid is 0.25. What is the hidden neuron’s blame?',
      },
      options: [
        { es: '−0.025', en: '−0.025' },
        { es: '−0.1', en: '−0.1' },
        { es: '0.025', en: '0.025' },
        { es: '−0.05', en: '−0.05' },
      ],
      answer: 0,
      why: {
        es: 'Culpa oculta = culpa de salida × peso × pendiente = (−0.2) × 0.5 × 0.25 = −0.025. Olvidar la pendiente da −0.1; olvidar el peso, −0.05.',
        en: 'Hidden blame = output blame × weight × slope = (−0.2) × 0.5 × 0.25 = −0.025. Forgetting the slope gives −0.1; forgetting the weight, −0.05.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un equipo nota que entrenar un modelo ocupa mucha más memoria de GPU que usarlo, con el mismo tamaño. ¿Qué parte se debe a la retropropagación?',
        en: 'A team notices that training a model takes much more GPU memory than using it, at the same size. What part is due to backpropagation?',
      },
      options: [
        { es: 'Necesita ver todo el conjunto de datos a la vez.', en: 'It needs to see the whole dataset at once.' },
        { es: 'Duplica los pesos del modelo en cada paso.', en: 'It doubles the model’s weights at every step.' },
        { es: 'Debe guardar los valores intermedios del pase hacia delante para usarlos al calcular las culpas.', en: 'It must store the forward pass’s intermediate values to use them when computing the blames.' },
        { es: 'Prueba cada peso por separado, uno tras otro.', en: 'It tests each weight separately, one after another.' },
      ],
      answer: 2,
      why: {
        es: 'Para derivar hacia atrás hacen falta los valores que se calcularon hacia delante, así que se guardan. Esa memoria, más la de los gradientes y la del optimizador, hace que entrenar pida mucha más que usar el modelo.',
        en: 'Differentiating backward needs the values computed going forward, so they are stored. That memory, plus the memory for gradients and the optimizer, is why training needs far more than using the model.',
      },
    },
  ],

  glossary: ['gradient', 'gradient-descent', 'derivative', 'learning-rate', 'weight', 'loss', 'forward-pass', 'hidden-layer', 'sigmoid', 'activation', 'neuron', 'layer', 'relu', 'backpropagation', 'chain-rule', 'credit-assignment'],

  terms: [
    {
      id: 'backpropagation',
      term: { es: 'Retropropagación', en: 'Backpropagation' },
      def: {
        es: 'Algoritmo que calcula el gradiente de la pérdida respecto de todos los pesos de una red en un solo recorrido hacia atrás, aplicando la regla de la cadena capa por capa. Calcula las culpas; no mueve los pesos (en el artículo de 1986, el nombre abarcaba todo el procedimiento de aprendizaje).',
        en: 'An algorithm that computes the gradient of the loss with respect to every weight of a network in a single backward sweep, applying the chain rule layer by layer. It computes the blames; it does not move the weights (in the 1986 paper, the name covered the whole learning procedure).',
      },
    },
    {
      id: 'chain-rule',
      term: { es: 'Regla de la cadena', en: 'Chain rule' },
      def: {
        es: 'Si una cantidad depende de otra a través de una cadena de pasos, su influencia total es el producto de la influencia de cada paso. Es la base de la retropropagación.',
        en: 'If a quantity depends on another through a chain of steps, its total influence is the product of the influence of each step. It is the basis of backpropagation.',
      },
    },
    {
      id: 'credit-assignment',
      term: { es: 'Asignación de crédito (reparto de la culpa)', en: 'Credit assignment (sharing the blame)' },
      def: {
        es: 'El problema de decidir cuánto contribuyó al resultado final cada decisión, peso o neurona escondido en medio de un sistema (Minsky lo planteó así en 1961, para el aprendizaje por refuerzo). En una red derivable, la retropropagación lo resuelve de forma eficiente.',
        en: 'The problem of deciding how much each decision, weight, or neuron hidden in the middle of a system contributed to the final outcome (Minsky posed it this way in 1961, for reinforcement learning). In a differentiable network, backpropagation solves it efficiently.',
      },
    },
  ],

  sources: [
    { title: 'Learning representations by back-propagating errors', authors: 'Rumelhart, D. E., Hinton, G. E., Williams, R. J. · Nature 323, 533–536', year: 1986, url: 'https://doi.org/10.1038/323533a0' },
    { title: 'Who invented the reverse mode of differentiation? · Documenta Mathematica, Extra Volume ISMP, 389–400', authors: 'Griewank, A.', year: 2012, url: 'https://doi.org/10.4171/dms/6/38' },
    { title: 'Taylor expansion of the accumulated rounding error · BIT 16(2), 146–160 (versión en inglés de resultados de su tesis de maestría de 1970, Universidad de Helsinki)', authors: 'Linnainmaa, S.', year: 1976, url: 'https://doi.org/10.1007/BF01931367' },
    { title: 'Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences (tesis doctoral, Universidad de Harvard; copia escaneada)', authors: 'Werbos, P. J.', year: 1974, url: 'https://gwern.net/doc/ai/nn/1974-werbos.pdf' },
    { title: 'Backwards differentiation in AD and neural nets: past links and new opportunities · en Automatic Differentiation: Applications, Theory, and Implementations, LNCSE 50, 15–34', authors: 'Werbos, P. J.', year: 2006, url: 'https://doi.org/10.1007/3-540-28438-9_2' },
    { title: 'Deep Learning, secciones 6.5 (Back-Propagation and Other Differentiation Algorithms) y 6.6 (Historical Notes)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/mlp.html' },
    { title: 'Automatic differentiation in machine learning: a survey · JMLR 18(153), 1–43', authors: 'Baydin, A. G., Pearlmutter, B. A., Radul, A. A., Siskind, J. M.', year: 2018, url: 'https://arxiv.org/abs/1502.05767' },
    { title: 'Scaling Laws for Neural Language Models (cómputo de entrenamiento ≈ 6N por token; pase hacia atrás ≈ el doble que el de ida)', authors: 'Kaplan, J., McCandlish, S., Henighan, T., et al.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'Language Models are Few-Shot Learners (GPT-3: 175 mil millones de parámetros)', authors: 'Brown, T. B., Mann, B., Ryder, N., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Steps toward Artificial Intelligence · Proceedings of the IRE 49(1), 8–30 (§ «The basic credit-assignment problem for complex reinforcement learning systems»)', authors: 'Minsky, M.', year: 1961, url: 'https://doi.org/10.1109/JRPROC.1961.287775' },
  ],
});
