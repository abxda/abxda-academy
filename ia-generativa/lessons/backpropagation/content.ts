import { defineLesson } from '../../../../../core/define';

// Lección 8 · Retropropagación. Una red diminuta (2-2-1, sigmoide, sin sesgos) recorrida con números reales:
// pase hacia delante, pérdida, culpa (gradiente) hacia atrás con la regla de la cadena y actualización.
// Los números de la escena salen de math.ts; el código de «Por dentro» es el mismo cálculo y su salida se verificó al escribirlo.
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
      es: 'Ahora, la pregunta de fondo: si movemos un peso un poco, ¿cuánto cambia la pérdida? Esa cifra es el gradiente de ese peso. Aquí la llamaremos su culpa.',
      en: 'Now the real question: if we nudge a weight a little, how much does the loss change? That number is the gradient of that weight. Here we will call it its blame.',
      note: { es: 'Meta: la culpa de cada peso, es decir, su gradiente.', en: 'Goal: the blame of each weight, that is, its gradient.' },
    },
    {
      id: 'wiggle',
      es: 'Se puede tantear: mover un peso un poquito, repetir el pase hacia delante y ver cuánto cambia la pérdida. Con seis pesos, son seis pases extra.',
      en: 'One way is to probe: nudge a weight a tiny bit, repeat the forward pass, and see how much the loss changes. With six weights, that is six extra passes.',
    },
    {
      id: 'wiggle-cost',
      es: 'Con 175 mil millones de pesos, como GPT-3, serían 175 mil millones de pases extra en cada paso de entrenamiento. Inviable.',
      en: 'With 175 billion weights, like GPT-3, that would mean 175 billion extra passes at every training step. Not feasible.',
      tts: {
        es: 'Con ciento setenta y cinco mil millones de pesos, como Ge pe te tres, serían ciento setenta y cinco mil millones de pases extra en cada paso de entrenamiento. Inviable.',
        en: 'With one hundred seventy-five billion weights, like G P T three, that would mean one hundred seventy-five billion extra passes at every training step. Not feasible.',
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
      es: 'El viaje de vuelta empieza en la pérdida. Si la predicción subiera un poco, ¿cuánto cambiaría la pérdida? Cambia la predicción menos el objetivo, que aquí es negativo: subirla ayuda.',
      en: 'The trip back starts at the loss. If the prediction rose a little, how much would the loss change? By the prediction minus the target, which is negative here: raising it helps.',
      note: { es: 'Retropropagación: la culpa viaja de la salida hacia la entrada, capa por capa.', en: 'Backpropagation: the blame travels from the output to the input, layer by layer.' },
    },
    {
      id: 'back-sig',
      es: 'Luego cruza la sigmoide de salida, que reduce la culpa según su pendiente en ese punto. Lo que queda es la culpa de la neurona de salida.',
      en: 'Then it crosses the output sigmoid, which scales the blame by its slope at that point. What remains is the blame of the output neuron.',
    },
    {
      id: 'back-w56',
      es: 'Esa culpa se reparte entre los dos pesos que llegan a la salida: se multiplica por la señal que cada uno llevaba, la activación de su neurona oculta.',
      en: 'That blame is shared between the two weights that feed the output: it is multiplied by the signal each one carried, the activation of its hidden neuron.',
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
      es: 'Por último, la culpa de cada neurona oculta se reparte entre sus pesos de entrada, multiplicándola por la entrada que cada peso recibió.',
      en: 'Finally, each hidden neuron’s blame is shared among its input weights, multiplied by the input each weight received.',
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
      es: 'Y cuesta poco: el viaje de vuelta pide aproximadamente el doble de cómputo que un pase hacia delante, sin importar cuántos pesos haya. Por eso se pueden entrenar redes enormes.',
      en: 'And it is cheap: the trip back takes roughly twice the compute of a forward pass, no matter how many weights there are. That is why huge networks can be trained.',
      note: { es: 'El viaje de vuelta cuesta del orden de un pase hacia delante, no uno por peso.', en: 'The trip back costs about one forward pass, not one per weight.' },
    },
    {
      id: 'read-sign',
      es: 'Cómo leer una culpa: si es positiva, subir ese peso sube el error, así que conviene bajarlo. Si es negativa, conviene subirlo.',
      en: 'How to read a blame: if it is positive, raising that weight raises the error, so it should go down. If it is negative, it should go up.',
    },
    {
      id: 'try1',
      es: 'Tu turno: arrastra un peso, o elígelo y súbelo o bájalo. Mira cómo cambian todas las culpas, no solo la suya, e intenta bajar la pérdida guiándote por sus signos.',
      en: 'Your turn: drag a weight, or pick one and raise or lower it. Watch how all the blames change, not just its own, and try to lower the loss by following their signs.',
      gate: {
        id: 'hand',
        prompt: {
          es: 'Baja la pérdida a 0,12 o menos moviendo pesos: sube los de culpa negativa y baja los de culpa positiva.',
          en: 'Bring the loss down to 0.12 or less by moving weights: raise those with negative blame, lower those with positive blame.',
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
      es: 'Una confusión clásica: la retropropagación no mueve ningún peso. Solo calcula las culpas. Quien corrige los pesos es el descenso del gradiente, con esas culpas.',
      en: 'A classic confusion: backpropagation does not move any weight. It only computes the blames. The one that corrects the weights is gradient descent, using those blames.',
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
      id: 'try2',
      es: 'Tu turno: da pasos de entrenamiento con el botón, cambia la tasa de aprendizaje si quieres, y mira bajar la pérdida.',
      en: 'Your turn: take training steps with the button, change the learning rate if you like, and watch the loss go down.',
      gate: {
        id: 'train',
        prompt: { es: 'Da al menos cinco pasos de entrenamiento.', en: 'Take at least five training steps.' },
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
      es: 'La idea tiene historia. En 1970 Linnainmaa describió cómo derivar hacia atrás una cadena de cálculos, y Werbos la propuso para entrenar redes en su tesis doctoral de 1974.',
      en: 'The idea has a history. In 1970 Linnainmaa described how to differentiate a chain of computations backward, and Werbos proposed it for training networks in his 1974 doctoral thesis.',
      tts: {
        es: 'La idea tiene historia. En mil novecientos setenta Linnainmaa describió cómo derivar hacia atrás una cadena de cálculos, y Werbos la propuso para entrenar redes en su tesis doctoral de mil novecientos setenta y cuatro.',
        en: 'The idea has a history. In nineteen seventy Linnainmaa described how to differentiate a chain of computations backward, and Werbos proposed it for training networks in his nineteen seventy-four doctoral thesis.',
      },
      pad: 0.3,
    },
    {
      id: 'history-b',
      es: 'En 1986, Rumelhart, Hinton y Williams mostraron en la revista Nature que servía para entrenar capas ocultas, que así aprendían representaciones internas útiles. Eso la hizo célebre.',
      en: 'In 1986, Rumelhart, Hinton, and Williams showed in Nature that it could train hidden layers, which then learned useful internal representations. That made it famous.',
      tts: {
        es: 'En mil novecientos ochenta y seis, Rumelhart, Hinton y Williams mostraron en la revista Néichur que servía para entrenar capas ocultas, que así aprendían representaciones internas útiles. Eso la hizo célebre.',
        en: 'In nineteen eighty-six, Rumelhart, Hinton, and Williams showed in Nature that it could train hidden layers, which then learned useful internal representations. That made it famous.',
      },
      pad: 0.3,
    },
    {
      id: 'limit-memory',
      es: 'Dos límites honestos. Primero, para calcular las culpas hay que recordar todos los valores del pase hacia delante, por eso entrenar gasta mucha más memoria que usar el modelo.',
      en: 'Two honest limits. First, to compute the blames you must remember every value from the forward pass, which is why training uses far more memory than using the model.',
      pad: 0.3,
    },
    {
      id: 'limit-fade',
      es: 'Segundo, la culpa se atenúa al cruzar capas. Cada sigmoide la multiplica por un cuarto o menos, así que con muchas capas puede casi desaparecer. Lo retomaremos con las redes recurrentes.',
      en: 'Second, the blame fades as it crosses layers. Each sigmoid multiplies it by one quarter or less, so with many layers it can almost vanish. We will come back to this with recurrent networks.',
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
      'Es barata (del orden de un par de pases hacia delante), pero exige guardar los valores del pase hacia delante, y la culpa puede atenuarse al cruzar muchas capas.',
    ],
    en: [
      'A network’s final error is shared among thousands of weights hidden in layers. Knowing how much blame each one carries is the credit assignment problem.',
      'The chain rule says that a weight’s total influence on the error is the product of the influence of each link along the path.',
      'Backpropagation sweeps the network from output to input, computes each neuron’s blame, and reuses it for the previous layer: it gets the whole gradient in a single trip.',
      'Backpropagation only computes the gradient. The one that corrects the weights is gradient descent: w ← w − η · blame.',
      'It is cheap (about a couple of forward passes), but it needs the values of the forward pass to be stored, and the blame can fade as it crosses many layers.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La retropropagación es el mecanismo con el que la red corrige sus pesos.',
      en: 'Backpropagation is the mechanism by which the network corrects its weights.',
    },
    right: {
      es: 'Solo calcula cuánta culpa tiene cada peso (el gradiente), con un viaje hacia atrás. Mover los pesos es trabajo del descenso del gradiente (u otro optimizador), que usa esos números.',
      en: 'It only computes how much blame each weight carries (the gradient), with one trip backward. Moving the weights is the job of gradient descent (or another optimizer), which uses those numbers.',
    },
  },

  deeper: {
    es: `## Las ecuaciones de la red

La red de la lección tiene entradas $x_1, x_2$, dos neuronas ocultas, una de salida, activación sigmoide $\\sigma(z)=1/(1+e^{-z})$ y no usa sesgos:

$$z_1 = w_1x_1 + w_2x_2,\\quad z_2 = w_3x_1 + w_4x_2,\\quad a_j=\\sigma(z_j)$$

$$z = w_5a_1 + w_6a_2,\\quad \\hat y=\\sigma(z),\\quad L=\\tfrac12(\\hat y-t)^2$$

Con $\\mathbf x=(1;\\,0{,}5)$, $t=1$ y $\\mathbf w=(0{,}6;\\,-0{,}3;\\,0{,}7;\\,0{,}5;\\,0{,}8;\\,-0{,}9)$ resulta $\\hat y\\approx 0{,}460$ y $L\\approx 0{,}146$. Los pesos de partida se eligieron de modo que cada cuenta mostrada con tres decimales se pueda repetir a mano sin discrepancias de redondeo.

## La regla de la cadena, paso a paso

Si $L$ depende de $\\hat y$, este de $z$ y este de $w_5$, la derivada de $L$ respecto de $w_5$ es el producto de las derivadas de cada eslabón:

$$\\frac{\\partial L}{\\partial w_5}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w_5}=(\\hat y-t)\\cdot\\hat y(1-\\hat y)\\cdot a_1$$

La derivada de la sigmoide es $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))$, así que se calcula con la activación que ya se guardó. Los dos primeros factores forman la **culpa de la neurona** $\\delta=\\partial L/\\partial z$. Hacia atrás, capa por capa:

$$\\delta_y=(\\hat y-t)\\,\\hat y(1-\\hat y),\\qquad \\frac{\\partial L}{\\partial w_{4+j}}=\\delta_y\\,a_j$$

$$\\delta_j=\\delta_y\\,w_{4+j}\\,a_j(1-a_j),\\qquad \\frac{\\partial L}{\\partial w}=\\delta_j\\,x_i$$

Con los números de la lección: $\\delta_y=-0{,}540\\cdot0{,}248\\approx-0{,}134$; $\\partial L/\\partial w_5=-0{,}134\\cdot0{,}611\\approx-0{,}082$; $\\delta_1=-0{,}134\\cdot0{,}8\\cdot0{,}238\\approx-0{,}026$ y $\\partial L/\\partial w_1=\\delta_1\\,x_1\\approx-0{,}026$. Como $w_6<0$, $\\delta_2$ sale con signo contrario ($+0{,}024$).

## En capas y en forma de matriz

Con $W^{(l)}$ la matriz que lleva $\\mathbf a^{(l-1)}$ a $\\mathbf z^{(l)}$, las mismas ideas se escriben para cualquier número de capas:

$$\\boldsymbol\\delta^{(l)}=\\big(W^{(l+1)\\top}\\boldsymbol\\delta^{(l+1)}\\big)\\odot\\sigma'(\\mathbf z^{(l)}),\\qquad \\frac{\\partial L}{\\partial W^{(l)}}=\\boldsymbol\\delta^{(l)}\\,\\mathbf a^{(l-1)\\top},\\qquad \\frac{\\partial L}{\\partial \\mathbf b^{(l)}}=\\boldsymbol\\delta^{(l)}$$

Cada $\\boldsymbol\\delta^{(l)}$ se calcula **una vez** a partir de la capa siguiente: eso es lo que hace barato el método. Con ReLU, $\\sigma'$ se reemplaza por $1$ si $z>0$ y $0$ en otro caso.

## Por qué es barata

Para una pérdida escalar y $N$ pesos, el modo inverso de la diferenciación automática (la retropropagación es su caso particular para redes) entrega las $N$ derivadas en un solo recorrido; el modo directo, o tantear, necesita un recorrido por peso. En redes grandes, el pase hacia atrás cuesta aproximadamente el doble que el pase hacia delante: unos $2N$ FLOPs por ejemplo hacia delante y $4N$ hacia atrás, de ahí el $\\approx 6N$ de Kaplan et al. (2020). A cambio, hay que **guardar las activaciones** del pase hacia delante hasta usarlas.

## Un límite: la culpa se atenúa

Como $\\sigma'(z)\\le \\tfrac14$, cada capa de sigmoides multiplica la culpa por a lo sumo $\\tfrac14$ (además del peso): $(\\tfrac14)^n$ tras $n$ capas. Por eso en redes profundas se prefieren otras activaciones, conexiones residuales y variantes como la LSTM, temas de las lecciones 12 y 13.

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

With $\\mathbf x=(1,\\,0.5)$, $t=1$, and $\\mathbf w=(0.6,\\,-0.3,\\,0.7,\\,0.5,\\,0.8,\\,-0.9)$ we get $\\hat y\\approx 0.460$ and $L\\approx 0.146$. The starting weights were chosen so that every calculation shown with three decimals can be repeated by hand without rounding discrepancies.

## The chain rule, step by step

If $L$ depends on $\\hat y$, which depends on $z$, which depends on $w_5$, the derivative of $L$ with respect to $w_5$ is the product of the derivatives of each link:

$$\\frac{\\partial L}{\\partial w_5}=\\frac{\\partial L}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w_5}=(\\hat y-t)\\cdot\\hat y(1-\\hat y)\\cdot a_1$$

The sigmoid’s derivative is $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))$, so it is computed from the activation that was already stored. The first two factors form the **neuron’s blame** $\\delta=\\partial L/\\partial z$. Going backward, layer by layer:

$$\\delta_y=(\\hat y-t)\\,\\hat y(1-\\hat y),\\qquad \\frac{\\partial L}{\\partial w_{4+j}}=\\delta_y\\,a_j$$

$$\\delta_j=\\delta_y\\,w_{4+j}\\,a_j(1-a_j),\\qquad \\frac{\\partial L}{\\partial w}=\\delta_j\\,x_i$$

With the lesson’s numbers: $\\delta_y=-0.540\\cdot0.248\\approx-0.134$; $\\partial L/\\partial w_5=-0.134\\cdot0.611\\approx-0.082$; $\\delta_1=-0.134\\cdot0.8\\cdot0.238\\approx-0.026$ and $\\partial L/\\partial w_1=\\delta_1\\,x_1\\approx-0.026$. Since $w_6<0$, $\\delta_2$ comes out with the opposite sign ($+0.024$).

## In layers and in matrix form

With $W^{(l)}$ the matrix that takes $\\mathbf a^{(l-1)}$ to $\\mathbf z^{(l)}$, the same ideas are written for any number of layers:

$$\\boldsymbol\\delta^{(l)}=\\big(W^{(l+1)\\top}\\boldsymbol\\delta^{(l+1)}\\big)\\odot\\sigma'(\\mathbf z^{(l)}),\\qquad \\frac{\\partial L}{\\partial W^{(l)}}=\\boldsymbol\\delta^{(l)}\\,\\mathbf a^{(l-1)\\top},\\qquad \\frac{\\partial L}{\\partial \\mathbf b^{(l)}}=\\boldsymbol\\delta^{(l)}$$

Each $\\boldsymbol\\delta^{(l)}$ is computed **once** from the next layer: that is what makes the method cheap. With ReLU, $\\sigma'$ is replaced by $1$ if $z>0$ and $0$ otherwise.

## Why it is cheap

For a scalar loss and $N$ weights, the reverse mode of automatic differentiation (backpropagation is its special case for networks) delivers all $N$ derivatives in a single sweep; the forward mode, or probing, needs one sweep per weight. In large networks the backward pass costs about twice the forward pass: roughly $2N$ FLOPs per example going forward and $4N$ going backward, hence the $\\approx 6N$ of Kaplan et al. (2020). In exchange, the **activations** of the forward pass must be stored until they are used.

## A limit: the blame fades

Since $\\sigma'(z)\\le \\tfrac14$, each layer of sigmoids multiplies the blame by at most $\\tfrac14$ (besides the weight): $(\\tfrac14)^n$ after $n$ layers. That is why deep networks favor other activations, residual connections, and variants such as the LSTM, topics of lessons 12 and 13.

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
      'Nadie programa la retropropagación a mano: PyTorch y TensorFlow la derivan automáticamente. Las preguntas útiles son qué partes se entrenan y cuáles se congelan, porque congelar capas ahorra cómputo y memoria de gradientes.',
    ],
    en: [
      'One training step costs about three forward passes: one forward and one backward that costs twice as much. Ask for the training cost per token, not just the cost of use.',
      'Training requires storing the intermediate values of the forward pass: GPU memory, not just compute, limits which model fits. Ask how much memory training needs compared with using the model.',
      'Only what is differentiable can be trained by backpropagation. A hard rule, a database lookup, or a discrete decision in the middle of the system cuts the flow of blame: other methods are needed there.',
      'Nobody codes backpropagation by hand: PyTorch and TensorFlow derive it automatically. The useful questions are which parts are trained and which are frozen, because freezing layers saves compute and gradient memory.',
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
        es: 'La retropropagación solo calcula el gradiente: cuánto cambiaría el error con cada peso. Quien actualiza los pesos, restando la tasa de aprendizaje por la culpa, es el descenso del gradiente (u otro optimizador).',
        en: 'Backpropagation only computes the gradient: how much the error would change with each weight. The one that updates the weights, subtracting the learning rate times the blame, is gradient descent (or another optimizer).',
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
        es: 'Tantear exige un pase hacia delante extra por cada peso. La retropropagación aplica la regla de la cadena capa por capa y reutiliza cada culpa: su costo es del orden de un par de pases hacia delante, sin importar cuántos pesos haya.',
        en: 'Probing needs one extra forward pass for every weight. Backpropagation applies the chain rule layer by layer and reuses each blame: its cost is about a couple of forward passes, no matter how many weights there are.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'La culpa de la neurona de salida es −0,2. Un peso de 0,5 une una neurona oculta con la salida, y la pendiente de la sigmoide de esa neurona oculta vale 0,25. ¿Cuál es la culpa de la neurona oculta?',
        en: 'The output neuron’s blame is −0.2. A weight of 0.5 connects a hidden neuron to the output, and the slope of that hidden neuron’s sigmoid is 0.25. What is the hidden neuron’s blame?',
      },
      options: [
        { es: '−0,025', en: '−0.025' },
        { es: '−0,1', en: '−0.1' },
        { es: '0,025', en: '0.025' },
        { es: '−0,05', en: '−0.05' },
      ],
      answer: 0,
      why: {
        es: 'Culpa oculta = culpa de salida × peso × pendiente = (−0,2) × 0,5 × 0,25 = −0,025. Olvidar la pendiente da −0,1; olvidar el peso, −0,05.',
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
        es: 'Algoritmo que calcula el gradiente de la pérdida respecto de todos los pesos de una red en un solo recorrido hacia atrás, aplicando la regla de la cadena capa por capa. Calcula las culpas; no mueve los pesos.',
        en: 'An algorithm that computes the gradient of the loss with respect to every weight of a network in a single backward sweep, applying the chain rule layer by layer. It computes the blames; it does not move the weights.',
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
        es: 'El problema de decidir cuánto contribuyó al error final cada peso o neurona escondido en medio de una red. La retropropagación lo resuelve de forma eficiente.',
        en: 'The problem of deciding how much each weight or neuron hidden in the middle of a network contributed to the final error. Backpropagation solves it efficiently.',
      },
    },
  ],

  sources: [
    { title: 'Learning representations by back-propagating errors', authors: 'Rumelhart, D. E., Hinton, G. E., Williams, R. J. · Nature 323, 533–536', year: 1986, url: 'https://doi.org/10.1038/323533a0' },
    { title: 'Algoritmin kumulatiivinen pyöristysvirhe yksittäisten pyöristysvirheiden Taylor-kehitelmänä (tesis de maestría, Universidad de Helsinki)', authors: 'Linnainmaa, S.', year: 1970 },
    { title: 'Taylor expansion of the accumulated rounding error · BIT 16(2), 146–160', authors: 'Linnainmaa, S.', year: 1976, url: 'https://doi.org/10.1007/BF01931367' },
    { title: 'Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences (tesis doctoral, Universidad de Harvard)', authors: 'Werbos, P. J.', year: 1974 },
    { title: 'Automatic differentiation in machine learning: a survey · JMLR 18(153), 1–43', authors: 'Baydin, A. G., Pearlmutter, B. A., Radul, A. A., Siskind, J. M.', year: 2018, url: 'https://arxiv.org/abs/1502.05767' },
    { title: 'Scaling Laws for Neural Language Models (cómputo de entrenamiento ≈ 6N por token)', authors: 'Kaplan, J., McCandlish, S., Henighan, T., et al.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'Deep Learning, sección 6.5: Back-Propagation and Other Differentiation Algorithms', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/' },
  ],
});
