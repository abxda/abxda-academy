import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'capas-y-activaciones',

  objectives: {
    es: [
      'Explicar por qué apilar capas lineales equivale a una sola capa, y qué cambia cuando se añade una activación no lineal.',
      'Calcular a mano el pase hacia delante de una red diminuta, con y sin ReLU.',
      'Reconocer qué dice —y qué no dice— el teorema de aproximación universal, y por qué en la práctica se apilan capas.',
    ],
    en: [
      'Explain why stacking linear layers is equivalent to a single layer, and what changes when a nonlinear activation is added.',
      'Compute by hand the forward pass of a tiny network, with and without ReLU.',
      'Recognize what the universal approximation theorem says, and what it does not, and why layers are stacked in practice.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Una capa oculta bastó para resolver XOR. Hoy apilamos más capas, y veremos cuánto poder se gana y por qué no basta con sumar.',
      en: 'One hidden layer was enough to solve XOR. Today we stack more layers, and we will see how much power that gains and why adding is not enough.',
    },
    {
      id: 'layer',
      es: 'Un grupo de neuronas que reciben las mismas entradas forma una capa. Cada una hace su propia suma ponderada, y la capa entera lo hace a la vez.',
      en: 'A group of neurons that receive the same inputs forms a layer. Each one computes its own weighted sum, and the whole layer does it at once.',
      note: { es: 'Capa: neuronas que miran las mismas entradas.', en: 'Layer: neurons that look at the same inputs.' },
    },
    {
      id: 'forward',
      es: 'Probemos con números, y por ahora cada neurona solo suma. Entran dos y uno; la capa oculta da cuatro y cinco, y la salida, trece.',
      en: 'Let’s try numbers, and for now each neuron only sums. Two and one go in; the hidden layer gives four and five, and the output gives thirteen.',
      pad: 0.3,
    },
    {
      id: 'forward-name',
      es: 'Ese recorrido, de izquierda a derecha y capa por capa, se llama pase hacia delante.',
      en: 'That trip, from left to right and layer by layer, is called the forward pass.',
      note: { es: 'Pase hacia delante: los números avanzan capa por capa.', en: 'Forward pass: numbers move on layer by layer.' },
    },
    {
      id: 'collapse',
      es: 'Aquí hay una trampa. Si combinas los pesos de las dos capas, obtienes una sola neurona, con pesos cinco y tres.',
      en: 'Here is the catch. Combine the weights of the two layers and you get a single neuron, with weights five and three.',
      note: { es: 'Sin activación, dos capas equivalen a una.', en: 'Without activation, two layers equal one.' },
      pad: 0.3,
    },
    {
      id: 'collapse-check',
      es: 'Compruébalo: con dos y uno, la neurona única también da trece; con uno y cero, ambas dan cinco. Apilar capas lineales no aporta nada.',
      en: 'Check it: with two and one, the single neuron also gives thirteen; with one and zero, both give five. Stacking linear layers adds nothing.',
      pad: 0.3,
    },
    {
      id: 'plane',
      es: 'En el plano pasa igual: apilar capas lineales sigue dando una recta. Y ante un grupo rodeado por un anillo, la mejor recta acierta apenas el setenta por ciento.',
      en: 'In the plane it is the same: stacking linear layers still gives a straight line. And against a group surrounded by a ring, the best line is right only seventy percent of the time.',
      pad: 0.4,
    },
    {
      id: 'activations',
      es: 'Lo que falta es una activación no lineal después de cada suma. Ya conoces la sigmoide; la tangente hiperbólica es parecida, pero va de menos uno a uno.',
      en: 'What is missing is a nonlinear activation after each sum. You already know the sigmoid; the hyperbolic tangent is similar, but it runs from minus one to one.',
    },
    {
      id: 'relu',
      es: 'La más sencilla es la ReLU: si la suma es negativa, devuelve cero; si es positiva, la deja pasar igual. Una bisagra con una sola esquina.',
      en: 'The simplest is ReLU: if the sum is negative, it returns zero; if it is positive, it lets it through unchanged. A hinge with a single corner.',
      note: { es: 'ReLU: cero si es negativa, igual si es positiva.', en: 'ReLU: zero if negative, unchanged if positive.' },
    },
    {
      id: 'nonlinear',
      es: 'Cualquier función que no sea una recta es no lineal. Basta una esquina o una curva entre capa y capa para que apilar deje de colapsar.',
      en: 'Any function that is not a straight line is nonlinear. A corner or a curve between layers is enough to stop stacking from collapsing.',
      note: { es: 'No linealidad: lo que impide que las capas colapsen.', en: 'Nonlinearity: what stops layers from collapsing.' },
    },
    {
      id: 'break',
      es: 'Con ReLU el truco se rompe. Para la entrada cero y uno, la capa oculta da dos y menos uno; la ReLU borra el negativo, y la salida es cuatro, no tres.',
      en: 'With ReLU the trick breaks. For input zero and one, the hidden layer gives two and minus one; ReLU wipes out the negative, and the output is four, not three.',
      pad: 0.4,
    },
    {
      id: 'fold-problem',
      es: '¿Qué hace la ReLU en geometría? Dobla el espacio. Mira esta recta numérica: un grupo en el centro y otro a ambos lados; ningún corte único los separa.',
      en: 'What does ReLU do in geometry? It folds space. Look at this number line: one group in the middle and another on both sides; no single cut separates them.',
    },
    {
      id: 'fold-sum',
      es: 'Una capa de dos neuronas calcula dos sumas: la primera deja x igual y la segunda le cambia el signo. Los puntos pasan a un plano, pero siguen sobre una recta.',
      en: 'A two-neuron layer computes two sums: the first keeps x as it is and the second flips its sign. The points move into a plane, but still lie on one line.',
      tts: {
        es: 'Una capa de dos neuronas calcula dos sumas: la primera deja equis igual y la segunda le cambia el signo. Los puntos pasan a un plano, pero siguen sobre una recta.',
      },
    },
    {
      id: 'fold-relu',
      es: 'Ahora la ReLU borra lo negativo de cada coordenada. La recta se dobla en forma de L: un lado cae sobre un eje y el otro sobre el otro.',
      en: 'Now ReLU wipes out the negative part of each coordinate. The line bends into an L: one side lands on one axis and the other on the other.',
      tts: {
        es: 'Ahora la ReLU borra lo negativo de cada coordenada. La recta se dobla en forma de ele: un lado cae sobre un eje y el otro sobre el otro.',
      },
    },
    {
      id: 'fold-line',
      es: 'Tras el doblez, el grupo central queda junto a la esquina y el otro lejos de ella. Una recta ya los separa: primero se dobla, después se corta.',
      en: 'After the fold, the central group sits near the corner and the other one far from it. A straight line now separates them: fold first, cut afterward.',
      note: { es: 'Dobla primero, corta después.', en: 'Fold first, cut afterward.' },
      pad: 0.4,
    },
    {
      id: 'approx-start',
      es: '¿Cuánto poder da esto? Probemos a dibujar una curva cualquiera con neuronas ReLU: cada una aporta una esquina, y todas se suman.',
      en: 'How much power does that give? Let’s try to draw an arbitrary curve with ReLU neurons: each one adds a corner, and they all add up.',
    },
    {
      id: 'approx-grow',
      es: 'Con pocas neuronas el trazo es burdo; con más, sigue la forma de la curva; con muchas, el error se vuelve casi invisible.',
      en: 'With few neurons the sketch is rough; with more, it follows the shape of the curve; with many, the error becomes almost invisible.',
      pad: 0.4,
    },
    {
      id: 'approx-theorem',
      es: 'Esa es la intuición del teorema de aproximación universal. Cybenko lo demostró en mil novecientos ochenta y nueve con sigmoides, y ese mismo año Hornik y sus colegas, en un caso más general.',
      en: 'That is the intuition behind the universal approximation theorem. Cybenko proved it in nineteen eighty-nine for sigmoids, and that same year Hornik and colleagues proved a more general case.',
      note: { es: 'Aproximación universal: con suficientes neuronas, una capa oculta basta en teoría.', en: 'Universal approximation: with enough neurons, one hidden layer is enough in theory.' },
    },
    {
      id: 'approx-caveat',
      es: 'Pero el teorema solo dice que esa red existe. No dice cuántas neuronas hacen falta, ni que el entrenamiento vaya a encontrarla.',
      en: 'But the theorem only says such a network exists. It does not say how many neurons are needed, nor that training will find it.',
      pad: 0.3,
    },
    {
      id: 'try1',
      es: 'Tu turno: sube el número de neuronas y observa cómo baja el error máximo de la aproximación.',
      en: 'Your turn: raise the number of neurons and watch the maximum error of the approximation drop.',
      gate: {
        id: 'approx',
        prompt: { es: 'Lleva el error máximo por debajo de 0,05.', en: 'Bring the maximum error below 0.05.' },
      },
      pad: 0.4,
    },
    {
      id: 'depth',
      es: 'Una sola capa ancha bastaría en teoría, pero en la práctica se apilan varias. Una red con varias capas ocultas se llama red profunda.',
      en: 'One wide layer would be enough in theory, but in practice several are stacked. A network with several hidden layers is called a deep network.',
      note: { es: 'Red profunda: varias capas ocultas.', en: 'Deep network: several hidden layers.' },
    },
    {
      id: 'depth-why',
      es: '¿Para qué apilar? Cada capa dobla lo que la anterior ya dobló. Con solo dos neuronas por capa, los tramos rectos se duplican con cada capa nueva.',
      en: 'Why stack them? Each layer folds what the previous one already folded. With just two neurons per layer, the straight pieces double with every new layer.',
      pad: 0.3,
    },
    {
      id: 'depth-cost',
      es: 'Con cinco capas hay treinta y dos tramos usando diez neuronas. Una sola capa necesitaría al menos treinta y una: para funciones así, la profundidad rinde más.',
      en: 'With five layers there are thirty-two pieces using ten neurons. A single layer would need at least thirty-one: for functions like this, depth pays off.',
      pad: 0.4,
    },
    {
      id: 'depth-real',
      es: 'Los modelos reales llevan esto mucho más lejos: GPT-3 apila noventa y seis capas, cada una con miles de neuronas.',
      en: 'Real models take this much further: GPT-3 stacks ninety-six layers, each with thousands of neurons.',
      tts: {
        es: 'Los modelos reales llevan esto mucho más lejos: Ge pe te tres apila noventa y seis capas, cada una con miles de neuronas.',
        en: 'Real models take this much further: G P T three stacks ninety-six layers, each with thousands of neurons.',
      },
      pad: 0.3,
    },
    {
      id: 'pg-intro',
      es: 'Ahora, un patio de juegos. Es una red real, programada desde cero, que se entrena aquí mismo, en tu navegador. El fondo muestra lo que predice en cada punto.',
      en: 'Now, a playground. It is a real network, programmed from scratch, training right here in your browser. The background shows what it predicts at each point.',
      pad: 0.3,
    },
    {
      id: 'pg-one',
      es: 'Empecemos con una sola neurona. Su frontera es una recta, y por más que se entrena, los aciertos se quedan en la mitad: no hay recta que sirva.',
      en: 'Let’s start with a single neuron. Its boundary is a straight line, and no matter how long it trains, accuracy stays around half: no line will do.',
      pad: 0.5,
    },
    {
      id: 'pg-linear',
      es: 'Apilemos ahora tres capas de seis neuronas, pero lineales. El resultado es idéntico: una recta. Las tres capas equivalen a una sola neurona.',
      en: 'Now let’s stack three layers of six neurons, but linear. The result is identical: a straight line. The three layers equal a single neuron.',
      pad: 0.5,
    },
    {
      id: 'pg-relu',
      es: 'Con una sola capa oculta de seis neuronas y ReLU, la frontera se dobla: rodea el centro con un polígono y los aciertos suben a casi todo.',
      en: 'With a single hidden layer of six neurons and ReLU, the boundary bends: it wraps the center in a polygon and accuracy climbs to nearly everything.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: elige capas, neuronas y activación, y separa los círculos con al menos noventa y cinco por ciento de aciertos.',
      en: 'Your turn: choose layers, neurons, and activation, and separate the circles with at least ninety-five percent accuracy.',
      gate: {
        id: 'circles',
        prompt: { es: 'Separa los círculos: 95 % de aciertos o más.', en: 'Separate the circles: 95% accuracy or better.' },
      },
      pad: 0.4,
    },
    {
      id: 'shapes',
      es: 'Fíjate en la forma. Con ReLU, la frontera se arma con tramos rectos; con la tangente hiperbólica, con curvas suaves. La activación deja su huella.',
      en: 'Look at the shape. With ReLU, the boundary is built from straight pieces; with the hyperbolic tangent, from smooth curves. The activation leaves its mark.',
      pad: 0.5,
    },
    {
      id: 'spiral-intro',
      es: 'Un reto mayor: la espiral. Una sola capa de ocho neuronas se queda corta; tres capas de ocho, con la misma activación, la separan.',
      en: 'A bigger challenge: the spiral. A single layer of eight neurons falls short; three layers of eight, with the same activation, separate it.',
      pad: 0.5,
    },
    {
      id: 'try3',
      es: 'Tu turno: ahora con la espiral. Busca una configuración que llegue al noventa por ciento de aciertos o más.',
      en: 'Your turn: now with the spiral. Find a configuration that reaches ninety percent accuracy or better.',
      gate: {
        id: 'spiral',
        prompt: { es: 'Separa la espiral: 90 % de aciertos o más.', en: 'Separate the spiral: 90% accuracy or better.' },
      },
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: sin activación, las capas colapsan en una; con ella, cada capa dobla el espacio, y con suficientes neuronas una red aproxima cualquier función continua.',
      en: 'In short: without activation, layers collapse into one; with it, each layer folds space, and with enough neurons a network can approximate any continuous function.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Pero esta red ajustó sola sus pesos. ¿Cómo se reparte la culpa del error entre cientos o miles de pesos a la vez? Eso es la retropropagación.',
      en: 'But this network adjusted its own weights. How is the blame for the error shared among hundreds or thousands of weights at once? That is backpropagation.',
    },
  ],

  keyIdeas: {
    es: [
      'Una capa es un grupo de neuronas que miran las mismas entradas; el pase hacia delante calcula capa por capa, de la entrada a la salida.',
      'Sin activación, dos capas equivalen a una: el producto de dos transformaciones lineales es otra transformación lineal. Apilar no suma.',
      'La no linealidad (ReLU, tanh, sigmoide) dobla el espacio: lo que una recta no separaba, tras el doblez sí se separa.',
      'Con suficientes neuronas, una sola capa oculta puede aproximar cualquier función continua (aproximación universal), pero el teorema no dice cuántas neuronas hacen falta ni que el entrenamiento las encuentre.',
      'Apilar capas multiplica los pliegues: para ciertas funciones, una red profunda necesita muchas menos neuronas que una capa única.',
    ],
    en: [
      'A layer is a group of neurons that look at the same inputs; the forward pass computes layer by layer, from input to output.',
      'Without activation, two layers equal one: the product of two linear transformations is another linear transformation. Stacking adds nothing.',
      'Nonlinearity (ReLU, tanh, sigmoid) folds space: what a straight line could not separate becomes separable after the fold.',
      'With enough neurons, a single hidden layer can approximate any continuous function (universal approximation), but the theorem does not say how many neurons are needed nor that training will find them.',
      'Stacking layers multiplies the folds: for certain functions, a deep network needs far fewer neurons than a single layer.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Cuantas más capas tiene una red, más poderosa es, siempre.',
      en: 'The more layers a network has, the more powerful it is, always.',
    },
    right: {
      es: 'Sin una activación no lineal entre ellas, cualquier número de capas equivale a una sola. Con ella, más capas permiten más formas, pero también cuestan más de entrenar y de usar, y no garantizan un mejor resultado.',
      en: 'Without a nonlinear activation between them, any number of layers equals a single one. With it, more layers allow more shapes, but they also cost more to train and to run, and they do not guarantee a better result.',
    },
  },

  deeper: {
    es: `## Una capa, en una fórmula

Una capa con $m$ neuronas y $n$ entradas guarda una matriz de pesos $W\\in\\mathbb{R}^{m\\times n}$ (una fila por neurona) y un vector de sesgos $\\mathbf{b}\\in\\mathbb{R}^m$. Dada la entrada $\\mathbf{x}$, calcula

$$\\mathbf{h} = \\phi(W\\mathbf{x} + \\mathbf{b})$$

donde $\\phi$ es la activación, aplicada a cada componente. Un **pase hacia delante** encadena esta fórmula capa por capa. Una red densa con tamaños $n_0, n_1,\\dots,n_L$ tiene $\\sum_{l=1}^{L}(n_{l-1}+1)\\,n_l$ parámetros: por ejemplo, la red 2-8-8-8-1 del patio de juegos tiene $3\\cdot 8 + 9\\cdot 8 + 9\\cdot 8 + 9\\cdot 1 = 177$.

## El colapso lineal

Si $\\phi$ es la identidad, dos capas dan

$$W_2(W_1\\mathbf{x}+\\mathbf{b}_1)+\\mathbf{b}_2 = (W_2W_1)\\,\\mathbf{x} + (W_2\\mathbf{b}_1+\\mathbf{b}_2),$$

que es una sola capa con pesos $W_2W_1$ y sesgo $W_2\\mathbf{b}_1+\\mathbf{b}_2$. Con los números de la lección:

$$\\begin{pmatrix}2 & 1\\end{pmatrix}\\begin{pmatrix}1 & 2\\\\ 3 & -1\\end{pmatrix}=\\begin{pmatrix}5 & 3\\end{pmatrix}.$$

Por inducción, $L$ capas lineales equivalen a una. Con $\\phi=\\mathrm{ReLU}$ y la entrada $(0,1)$, la capa oculta da $(2,-1)$, la ReLU lo convierte en $(2,0)$ y la salida es $2\\cdot2+1\\cdot0=4$, no $3$: la equivalencia se rompe.

## Las activaciones

$$\\sigma(z)=\\frac{1}{1+e^{-z}},\\qquad \\tanh(z)=2\\sigma(2z)-1,\\qquad \\mathrm{ReLU}(z)=\\max(0,z).$$

Sus derivadas importan para entrenar (lección 8): $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))\\le \\tfrac14$, $\\tanh'(z)=1-\\tanh^2(z)\\le 1$ y $\\mathrm{ReLU}'(z)\\in\\{0,1\\}$. En los transformers se usan variantes suaves de la ReLU, como la GELU (Hendrycks y Gimpel, 2016).

## Aproximación universal

**Enunciado (versión de Cybenko, 1989).** Si $\\sigma$ es continua y sigmoidal, para toda función continua $f$ sobre el cubo unitario $K=[0,1]^n$ (y, cambiando la escala, sobre cualquier compacto) y todo $\\varepsilon>0$ existen $N$, $\\alpha_j$, $\\mathbf{w}_j$ y $b_j$ tales que
$$\\Big|\\sum_{j=1}^{N}\\alpha_j\\,\\sigma(\\mathbf{w}_j\\cdot\\mathbf{x}+b_j)-f(\\mathbf{x})\\Big|<\\varepsilon\\quad\\text{para todo }\\mathbf{x}\\in K.$$
Hornik, Stinchcombe y White (1989) lo probaron para funciones de aplastamiento y funciones medibles; Hornik (1991) exigió solo que la activación sea acotada y no constante, y Leshno, Lin, Pinkus y Schocken (1993) mostraron que basta con que no sea un polinomio, lo que incluye a la ReLU.

**Qué no dice.** No acota $N$ (que en general crece con la complejidad de $f$ y con el número de entradas) ni garantiza que el descenso del gradiente encuentre esos pesos.

**La construcción de la lección.** Para una función $f$ de una variable, con $n$ nudos equiespaciados $t_k$ y pendientes $s_k=\\frac{f(t_k+h)-f(t_k)}{h}$, $h=(b-a)/n$,

$$\\hat f(x)=f(a)+\\sum_{k=0}^{n-1}(s_k-s_{k-1})\\,\\mathrm{ReLU}(x-t_k),\\quad s_{-1}=0,$$

es una red con una capa oculta de $n$ neuronas ReLU que interpola a $f$ en los nudos. Si $f$ tiene segunda derivada acotada por $M$, el error máximo es a lo sumo $\\dfrac{(b-a)^2M}{8n^2}$: al duplicar las neuronas, el error se divide por cuatro. Aquí los pesos se calculan, no se entrenan.

## Profundidad: la sierra

La función tienda $g(x)=2\\,\\mathrm{ReLU}(x)-4\\,\\mathrm{ReLU}(x-\\tfrac12)$ sobre $[0,1]$ usa dos neuronas. La composición $g^{(k)}=g\\circ\\cdots\\circ g$ ($k$ capas, $2k$ neuronas) tiene $2^k$ tramos rectos. Una red de una sola capa oculta con $m$ neuronas ReLU tiene a lo sumo $m+1$ tramos en una dimensión, así que para igualarla necesita al menos $2^k-1$ neuronas. Telgarsky (2016) generaliza este argumento y prueba que ciertas funciones requieren una cantidad exponencial de neuronas si la red es poco profunda. Es un resultado sobre funciones concretas, no una ley: no dice que toda tarea real se beneficie igual.

## En código: el pase hacia delante y el colapso

\`\`\`python
import numpy as np

W1 = np.array([[1, 2],
               [3, -1]])        # capa oculta: una fila por neurona
W2 = np.array([[2, 1]])         # salida

def red(x, activacion):
    h = activacion(W1 @ x)      # pase hacia delante: capa oculta...
    return (W2 @ h)[0]          # ...y salida

lineal = lambda z: z
relu = lambda z: np.maximum(0, z)

print("W2 @ W1 =", W2 @ W1)     # la neurona única equivalente
for x in ([2, 1], [1, 0], [0, 1]):
    x = np.array(x)
    print(x, "sin activación:", red(x, lineal), "| una neurona:", (W2 @ W1 @ x)[0], "| con ReLU:", red(x, relu))
\`\`\`

Salida esperada:

\`\`\`text
W2 @ W1 = [[5 3]]
[2 1] sin activación: 13 | una neurona: 13 | con ReLU: 13
[1 0] sin activación: 5 | una neurona: 5 | con ReLU: 5
[0 1] sin activación: 3 | una neurona: 3 | con ReLU: 4
\`\`\`

## En código: una red que aprende los círculos

Es la misma idea del patio de juegos (red 2-6-1, ReLU y sigmoide de salida), con descenso del gradiente simple. Las líneas con \`dZ\` son la retropropagación, que se explica en la lección 8.

\`\`\`python
import numpy as np
rng = np.random.default_rng(0)

# Datos: un grupo central (clase 0) rodeado por un anillo (clase 1)
n = 90
a0, r0 = rng.uniform(0, 2 * np.pi, n), np.sqrt(rng.uniform(0, 1, n)) * 1.15
a1, r1 = rng.uniform(0, 2 * np.pi, n), rng.uniform(1.95, 2.8, n)
X = np.vstack([np.c_[r0 * np.cos(a0), r0 * np.sin(a0)], np.c_[r1 * np.cos(a1), r1 * np.sin(a1)]])
X = (X + 0.12 * rng.normal(size=X.shape)) / 3          # coordenadas en [-1, 1]
y = np.r_[np.zeros(n), np.ones(n)]

# Red 2 → 6 (ReLU) → 1 (sigmoide)
W1 = rng.normal(0, np.sqrt(2 / 2), (2, 6)); b1 = rng.uniform(-0.5, 0.5, 6)
W2 = rng.normal(0, np.sqrt(1 / 6), (6, 1)); b2 = np.zeros(1)
sig = lambda z: 1 / (1 + np.exp(-z))

for paso in range(1500):
    Z1 = X @ W1 + b1; H = np.maximum(0, Z1); p = sig(H @ W2 + b2).ravel()   # pase hacia delante
    dZ2 = (p - y)[:, None] / len(y)                                          # error en la salida
    dW2, db2 = H.T @ dZ2, dZ2.sum(0)
    dZ1 = (dZ2 @ W2.T) * (Z1 > 0)                                            # la culpa vuelve a la capa oculta
    dW1, db1 = X.T @ dZ1, dZ1.sum(0)
    for P, G in ((W1, dW1), (b1, db1), (W2, dW2), (b2, db2)):
        P -= 0.5 * G                                                          # descenso del gradiente
print("aciertos:", ((p > 0.5) == y).mean())
\`\`\`

Salida esperada: \`aciertos: 1.0\` (los datos son separables; con otra semilla o con menos neuronas puede quedar algo por debajo). El patio de juegos de la lección usa el optimizador Adam en lugar del descenso simple (lección 9).

## Lo que viene

Calcular el gradiente de cada peso en una red así es la retropropagación (lección 8). Cómo entrenar bien —lotes, optimizadores— es la lección 9, y la 10 muestra que acertar en los puntos de entrenamiento, como aquí, no garantiza acertar con datos nuevos.`,

    en: `## A layer, in one formula

A layer with $m$ neurons and $n$ inputs stores a weight matrix $W\\in\\mathbb{R}^{m\\times n}$ (one row per neuron) and a bias vector $\\mathbf{b}\\in\\mathbb{R}^m$. Given the input $\\mathbf{x}$, it computes

$$\\mathbf{h} = \\phi(W\\mathbf{x} + \\mathbf{b})$$

where $\\phi$ is the activation, applied component by component. A **forward pass** chains this formula layer by layer. A dense network with sizes $n_0, n_1,\\dots,n_L$ has $\\sum_{l=1}^{L}(n_{l-1}+1)\\,n_l$ parameters: for example, the 2-8-8-8-1 network of the playground has $3\\cdot 8 + 9\\cdot 8 + 9\\cdot 8 + 9\\cdot 1 = 177$.

## The linear collapse

If $\\phi$ is the identity, two layers give

$$W_2(W_1\\mathbf{x}+\\mathbf{b}_1)+\\mathbf{b}_2 = (W_2W_1)\\,\\mathbf{x} + (W_2\\mathbf{b}_1+\\mathbf{b}_2),$$

which is a single layer with weights $W_2W_1$ and bias $W_2\\mathbf{b}_1+\\mathbf{b}_2$. With the numbers of the lesson:

$$\\begin{pmatrix}2 & 1\\end{pmatrix}\\begin{pmatrix}1 & 2\\\\ 3 & -1\\end{pmatrix}=\\begin{pmatrix}5 & 3\\end{pmatrix}.$$

By induction, $L$ linear layers equal one. With $\\phi=\\mathrm{ReLU}$ and input $(0,1)$, the hidden layer gives $(2,-1)$, ReLU turns it into $(2,0)$, and the output is $2\\cdot2+1\\cdot0=4$, not $3$: the equivalence breaks.

## The activations

$$\\sigma(z)=\\frac{1}{1+e^{-z}},\\qquad \\tanh(z)=2\\sigma(2z)-1,\\qquad \\mathrm{ReLU}(z)=\\max(0,z).$$

Their derivatives matter for training (lesson 8): $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))\\le \\tfrac14$, $\\tanh'(z)=1-\\tanh^2(z)\\le 1$, and $\\mathrm{ReLU}'(z)\\in\\{0,1\\}$. Transformers use smooth variants of ReLU, such as GELU (Hendrycks and Gimpel, 2016).

## Universal approximation

**Statement (Cybenko, 1989).** If $\\sigma$ is continuous and sigmoidal, then for every continuous function $f$ on the unit cube $K=[0,1]^n$ (and, rescaling, on any compact set) and every $\\varepsilon>0$ there exist $N$, $\\alpha_j$, $\\mathbf{w}_j$ and $b_j$ such that
$$\\Big|\\sum_{j=1}^{N}\\alpha_j\\,\\sigma(\\mathbf{w}_j\\cdot\\mathbf{x}+b_j)-f(\\mathbf{x})\\Big|<\\varepsilon\\quad\\text{for all }\\mathbf{x}\\in K.$$
Hornik, Stinchcombe, and White (1989) proved it for squashing functions and measurable functions; Hornik (1991) required only that the activation be bounded and nonconstant, and Leshno, Lin, Pinkus, and Schocken (1993) showed that being non-polynomial is enough, which includes ReLU.

**What it does not say.** It does not bound $N$ (which in general grows with the complexity of $f$ and with the number of inputs), nor does it guarantee that gradient descent finds those weights.

**The construction in the lesson.** For a function $f$ of one variable, with $n$ equally spaced knots $t_k$ and slopes $s_k=\\frac{f(t_k+h)-f(t_k)}{h}$, $h=(b-a)/n$,

$$\\hat f(x)=f(a)+\\sum_{k=0}^{n-1}(s_k-s_{k-1})\\,\\mathrm{ReLU}(x-t_k),\\quad s_{-1}=0,$$

is a one-hidden-layer network with $n$ ReLU neurons that interpolates $f$ at the knots. If $f$ has second derivative bounded by $M$, the maximum error is at most $\\dfrac{(b-a)^2M}{8n^2}$: doubling the neurons divides the error by four. Here the weights are computed, not trained.

## Depth: the sawtooth

The tent function $g(x)=2\\,\\mathrm{ReLU}(x)-4\\,\\mathrm{ReLU}(x-\\tfrac12)$ on $[0,1]$ uses two neurons. The composition $g^{(k)}=g\\circ\\cdots\\circ g$ ($k$ layers, $2k$ neurons) has $2^k$ straight pieces. A network with one hidden layer of $m$ ReLU neurons has at most $m+1$ pieces in one dimension, so to match it, it needs at least $2^k-1$ neurons. Telgarsky (2016) generalizes this argument and proves that certain functions require an exponential number of neurons if the network is shallow. It is a result about specific functions, not a law: it does not say that every real task benefits equally.

## In code: the forward pass and the collapse

\`\`\`python
import numpy as np

W1 = np.array([[1, 2],
               [3, -1]])        # hidden layer: one row per neuron
W2 = np.array([[2, 1]])         # output

def net(x, activation):
    h = activation(W1 @ x)      # forward pass: hidden layer...
    return (W2 @ h)[0]          # ...and output

linear = lambda z: z
relu = lambda z: np.maximum(0, z)

print("W2 @ W1 =", W2 @ W1)     # the equivalent single neuron
for x in ([2, 1], [1, 0], [0, 1]):
    x = np.array(x)
    print(x, "no activation:", net(x, linear), "| one neuron:", (W2 @ W1 @ x)[0], "| with ReLU:", net(x, relu))
\`\`\`

Expected output:

\`\`\`text
W2 @ W1 = [[5 3]]
[2 1] no activation: 13 | one neuron: 13 | with ReLU: 13
[1 0] no activation: 5 | one neuron: 5 | with ReLU: 5
[0 1] no activation: 3 | one neuron: 3 | with ReLU: 4
\`\`\`

## In code: a network that learns the circles

It is the same idea as the playground (a 2-6-1 network, ReLU and a sigmoid output), with plain gradient descent. The lines with \`dZ\` are backpropagation, explained in lesson 8.

\`\`\`python
import numpy as np
rng = np.random.default_rng(0)

# Data: a central group (class 0) surrounded by a ring (class 1)
n = 90
a0, r0 = rng.uniform(0, 2 * np.pi, n), np.sqrt(rng.uniform(0, 1, n)) * 1.15
a1, r1 = rng.uniform(0, 2 * np.pi, n), rng.uniform(1.95, 2.8, n)
X = np.vstack([np.c_[r0 * np.cos(a0), r0 * np.sin(a0)], np.c_[r1 * np.cos(a1), r1 * np.sin(a1)]])
X = (X + 0.12 * rng.normal(size=X.shape)) / 3          # coordinates in [-1, 1]
y = np.r_[np.zeros(n), np.ones(n)]

# Network 2 → 6 (ReLU) → 1 (sigmoid)
W1 = rng.normal(0, np.sqrt(2 / 2), (2, 6)); b1 = rng.uniform(-0.5, 0.5, 6)
W2 = rng.normal(0, np.sqrt(1 / 6), (6, 1)); b2 = np.zeros(1)
sig = lambda z: 1 / (1 + np.exp(-z))

for step in range(1500):
    Z1 = X @ W1 + b1; H = np.maximum(0, Z1); p = sig(H @ W2 + b2).ravel()   # forward pass
    dZ2 = (p - y)[:, None] / len(y)                                          # error at the output
    dW2, db2 = H.T @ dZ2, dZ2.sum(0)
    dZ1 = (dZ2 @ W2.T) * (Z1 > 0)                                            # the blame flows back to the hidden layer
    dW1, db1 = X.T @ dZ1, dZ1.sum(0)
    for P, G in ((W1, dW1), (b1, db1), (W2, dW2), (b2, db2)):
        P -= 0.5 * G                                                          # gradient descent
print("accuracy:", ((p > 0.5) == y).mean())
\`\`\`

Expected output: \`accuracy: 1.0\` (the data are separable; with another seed or fewer neurons it may land somewhat lower). The lesson’s playground uses the Adam optimizer instead of plain descent (lesson 9).

## What comes next

Computing the gradient of every weight in a network like this is backpropagation (lesson 8). How to train well —batches, optimizers— is lesson 9, and lesson 10 shows that being right on the training points, as here, does not guarantee being right on new data.`,
  },

  lens: {
    es: [
      '«Más capas» no es una medida de calidad: cada capa suma costo de entrenamiento y de uso. Pide la comparación con un modelo sencillo sobre los mismos datos que ninguno vio al entrenarse, antes de aceptar que la profundidad se justifica.',
      'El teorema de aproximación universal garantiza que existe una red, no que sirva en tu caso: no dice cuántos datos, cuánto cómputo ni cuántas neuronas hacen falta. Si alguien lo invoca para vender una solución, pregunta por la evidencia en tu problema.',
      'Entrenar es sensible al punto de partida: la misma receta con otra semilla puede dar resultados distintos (pruébalo en el patio con «Reiniciar» y pocas neuronas). Pide que se repita el entrenamiento y se reporte la variabilidad, no solo la mejor corrida.',
      'Tamaño es costo: GPT-3 tiene noventa y seis capas y ciento setenta y cinco mil millones de parámetros. Cuando hablen de una «red profunda», pide el número de parámetros y el costo por tarea (lecciones 24 y 26).',
    ],
    en: [
      '“More layers” is not a quality measure: each layer adds cost to train and to run. Ask for a comparison with a simple model on the same data that neither saw during training, before accepting that depth is justified.',
      'The universal approximation theorem guarantees that a network exists, not that it works in your case: it does not say how much data, compute, or how many neurons are needed. If someone invokes it to sell a solution, ask for evidence on your problem.',
      'Training is sensitive to the starting point: the same recipe with another seed can give different results (try it in the playground with “Reset” and few neurons). Ask for the training to be repeated and the variability reported, not just the best run.',
      'Size is cost: GPT-3 has ninety-six layers and one hundred seventy-five billion parameters. When they talk about a “deep network,” ask for the parameter count and the cost per task (lessons 24 and 26).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué apilar capas lineales, sin activación, no da más poder que una sola capa?', en: 'Why does stacking linear layers, without activation, give no more power than a single layer?' },
      options: [
        { es: 'Porque cada capa lineal tiene menos pesos que la anterior.', en: 'Because each linear layer has fewer weights than the previous one.' },
        { es: 'Porque el entrenamiento no logra ajustar tantas capas.', en: 'Because training cannot adjust that many layers.' },
        { es: 'Porque una transformación lineal tras otra equivale a una sola transformación lineal.', en: 'Because one linear transformation after another equals a single linear transformation.' },
        { es: 'Porque las capas lineales solo sirven con imágenes.', en: 'Because linear layers only work with images.' },
      ],
      answer: 2,
      why: { es: 'El producto de matrices W₂W₁ es otra matriz: las dos capas equivalen a una neurona con esos pesos combinados (cinco y tres, en la lección). La no linealidad entre capas es lo que rompe esa equivalencia.', en: 'The matrix product W₂W₁ is another matrix: the two layers equal one neuron with those combined weights (five and three, in the lesson). The nonlinearity between layers is what breaks that equivalence.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué afirma, en esencia, el teorema de aproximación universal?', en: 'What does the universal approximation theorem say, in essence?' },
      options: [
        { es: 'Una red con una capa oculta y suficientes neuronas puede aproximar cualquier función continua en un intervalo acotado, con la precisión que se quiera.', en: 'A network with one hidden layer and enough neurons can approximate any continuous function on a bounded interval, to any desired precision.' },
        { es: 'El entrenamiento siempre encuentra los pesos correctos si hay datos suficientes.', en: 'Training always finds the right weights if there is enough data.' },
        { es: 'Con dos neuronas basta para aproximar cualquier función.', en: 'Two neurons are enough to approximate any function.' },
        { es: 'Una red profunda siempre supera a una de una sola capa.', en: 'A deep network always beats a single-layer one.' },
      ],
      answer: 0,
      why: { es: 'Es un resultado de existencia: dice que hay una red con esa precisión, no cuántas neuronas hacen falta ni que el entrenamiento la encuentre. Tampoco compara profundidad con anchura.', en: 'It is an existence result: it says a network with that precision exists, not how many neurons are needed nor that training will find it. It does not compare depth with width either.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una capa oculta con ReLU recibe las sumas 2 y −1. La salida las combina con pesos 2 y 1, sin sesgo. ¿Cuánto vale la salida?', en: 'A hidden layer with ReLU receives the sums 2 and −1. The output combines them with weights 2 and 1, no bias. What is the output?' },
      options: [
        { es: '3', en: '3' },
        { es: '4', en: '4' },
        { es: '5', en: '5' },
        { es: '2', en: '2' },
      ],
      answer: 1,
      why: { es: 'ReLU(2) = 2 y ReLU(−1) = 0, así que la salida es 2·2 + 1·0 = 4. Sin ReLU habría sido 2·2 + 1·(−1) = 3: esa es la diferencia que hace la activación.', en: 'ReLU(2) = 2 and ReLU(−1) = 0, so the output is 2·2 + 1·0 = 4. Without ReLU it would have been 2·2 + 1·(−1) = 3: that is the difference the activation makes.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor dice que su clasificador usa una red neuronal de veinte capas. ¿Qué pregunta aporta más para decidir si te conviene?', en: 'A vendor says its classifier uses a twenty-layer neural network. Which question helps most to decide whether it suits you?' },
      options: [
        { es: '¿En qué lenguaje de programación está escrita?', en: 'What programming language is it written in?' },
        { es: '¿Cuántas neuronas tiene cada capa?', en: 'How many neurons does each layer have?' },
        { es: '¿Usa ReLU o sigmoide?', en: 'Does it use ReLU or sigmoid?' },
        { es: '¿Cuánto mejora frente a un modelo sencillo, medido con datos que ninguno vio al entrenarse?', en: 'How much does it improve over a simple model, measured on data that neither saw during training?' },
      ],
      answer: 3,
      why: { es: 'El número de capas no dice si el modelo sirve. Lo que importa es cuánto mejora frente a una línea base sencilla con datos no vistos; las otras preguntas son detalles técnicos que no responden eso.', en: 'The number of layers does not say whether the model works. What matters is how much it improves over a simple baseline on unseen data; the other questions are technical details that do not answer that.' },
    },
  ],

  glossary: [
    'layer', 'forward-pass', 'relu', 'nonlinearity', 'universal-approximation', 'deep-network',
    'neuron', 'activation', 'sigmoid', 'hidden-layer', 'decision-boundary', 'weight', 'bias', 'parameter', 'loss',
  ],

  terms: [
    { id: 'layer', term: { es: 'Capa', en: 'Layer' }, def: { es: 'Grupo de neuronas que reciben las mismas entradas y calculan a la vez. Una red es una cadena de capas: entrada, una o más ocultas, y salida.', en: 'A group of neurons that receive the same inputs and compute at the same time. A network is a chain of layers: input, one or more hidden ones, and output.' } },
    { id: 'forward-pass', term: { es: 'Pase hacia delante', en: 'Forward pass' }, def: { es: 'Cálculo de la salida de una red: los números avanzan capa por capa, de la entrada a la salida.', en: 'Computing a network’s output: the numbers move on layer by layer, from input to output.' } },
    { id: 'relu', term: { es: 'ReLU', en: 'ReLU' }, def: { es: 'Función de activación que devuelve cero si la suma es negativa y la propia suma si es positiva: máx(0, z). Una bisagra con una sola esquina.', en: 'An activation function that returns zero if the sum is negative and the sum itself if it is positive: max(0, z). A hinge with a single corner.' } },
    { id: 'nonlinearity', term: { es: 'No linealidad', en: 'Nonlinearity' }, def: { es: 'Propiedad de una función que no es una recta. Es lo que impide que apilar capas colapse en una sola y lo que permite doblar el espacio.', en: 'The property of a function that is not a straight line. It stops stacked layers from collapsing into one and lets a network fold space.' } },
    { id: 'universal-approximation', term: { es: 'Aproximación universal', en: 'Universal approximation' }, def: { es: 'Teorema: una red con una capa oculta y suficientes neuronas puede aproximar cualquier función continua en un conjunto acotado, con la precisión que se quiera. No dice cuántas neuronas hacen falta ni que el entrenamiento las encuentre.', en: 'Theorem: a network with one hidden layer and enough neurons can approximate any continuous function on a bounded set, to any desired precision. It does not say how many neurons are needed nor that training will find them.' } },
    { id: 'deep-network', term: { es: 'Red profunda', en: 'Deep network' }, def: { es: 'Red con varias capas ocultas. Cada capa aprovecha lo que la anterior ya transformó, y así logra formas complejas con menos neuronas.', en: 'A network with several hidden layers. Each layer builds on what the previous one already transformed, reaching complex shapes with fewer neurons.' } },
  ],

  sources: [
    { title: 'Approximation by superpositions of a sigmoidal function', authors: 'Cybenko, G.', year: 1989, url: 'https://doi.org/10.1007/BF02551274' },
    { title: 'Multilayer feedforward networks are universal approximators', authors: 'Hornik, K., Stinchcombe, M., White, H.', year: 1989, url: 'https://doi.org/10.1016/0893-6080(89)90020-8' },
    { title: 'Approximation capabilities of multilayer feedforward networks', authors: 'Hornik, K.', year: 1991, url: 'https://doi.org/10.1016/0893-6080(91)90009-T' },
    { title: 'Multilayer feedforward networks with a nonpolynomial activation function can approximate any function', authors: 'Leshno, M., Lin, V. Y., Pinkus, A., Schocken, S.', year: 1993, url: 'https://doi.org/10.1016/S0893-6080(05)80131-5' },
    { title: 'Benefits of depth in neural networks', authors: 'Telgarsky, M.', year: 2016, url: 'https://proceedings.mlr.press/v49/telgarsky16.html' },
    { title: 'Language Models are Few-Shot Learners (GPT-3: 96 capas, 175 mil millones de parámetros)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Gaussian Error Linear Units (GELUs)', authors: 'Hendrycks, D., Gimpel, K.', year: 2016, url: 'https://arxiv.org/abs/1606.08415' },
    { title: 'Adam: A Method for Stochastic Optimization', authors: 'Kingma, D. P., Ba, J.', year: 2015, url: 'https://arxiv.org/abs/1412.6980' },
  ],
});
