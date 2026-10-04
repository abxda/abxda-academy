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
      es: 'Una capa oculta bastó para resolver XOR. Hoy apilamos más capas y vemos cuánto poder se gana, y por qué apilar, a secas, no basta.',
      en: 'One hidden layer was enough to solve XOR. Today we stack more layers and see how much power that gains, and why stacking, by itself, is not enough.',
    },
    {
      id: 'layer',
      es: 'Un grupo de neuronas que reciben las mismas entradas forma una capa. Cada una hace su propia suma ponderada, con los pesos que ves sobre las líneas.',
      en: 'A group of neurons that receive the same inputs forms a layer. Each one computes its own weighted sum, with the weights you see on the lines.',
      note: { es: 'Capa: neuronas que miran las mismas entradas.', en: 'Layer: neurons that look at the same inputs.' },
    },
    {
      id: 'forward',
      es: 'Probemos con números, por ahora sin sesgo ni activación: cada neurona solo suma. Entran dos y uno; la capa oculta da cuatro y cinco, y la salida, trece.',
      en: 'Let’s try numbers, for now with no bias and no activation: each neuron only sums. Two and one go in; the hidden layer gives four and five, and the output gives thirteen.',
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
      es: 'Cualquier función que no sea una recta es no lineal; en XOR, el escalón ya lo era. Basta una esquina o una curva entre capa y capa para que apilar deje de colapsar.',
      en: 'Any function that is not a straight line is nonlinear; in XOR, the step already was. A corner or a curve between layers is enough to stop stacking from collapsing.',
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
      es: 'Esa es la idea del teorema de aproximación universal. Cybenko lo probó en 1989 para sigmoides; ese año, Hornik y colegas, con otras condiciones; en 1993 se vio que vale la ReLU.',
      en: 'That is the idea behind the universal approximation theorem. Cybenko proved it in 1989 for sigmoids; that year, Hornik and colleagues, under other conditions; in 1993 it was shown that ReLU works too.',
      tts: {
        es: 'Esa es la idea del teorema de aproximación universal. Cybenko lo probó en mil novecientos ochenta y nueve para sigmoides; ese año, Hornik y colegas, con otras condiciones; en mil novecientos noventa y tres se vio que vale la ReLU.',
        en: 'That is the idea behind the universal approximation theorem. Cybenko proved it in nineteen eighty-nine for sigmoids; that year, Hornik and colleagues, under other conditions; in nineteen ninety-three it was shown that ReLU works too.',
      },
      note: { es: 'Aproximación universal: con suficientes neuronas, una capa oculta basta en teoría.', en: 'Universal approximation: with enough neurons, one hidden layer is enough in theory.' },
    },
    {
      id: 'approx-caveat',
      es: 'Pero el teorema solo dice que esa red existe, en una región acotada. No dice cuántas neuronas hacen falta, ni que el entrenamiento vaya a encontrarla.',
      en: 'But the theorem only says such a network exists, on a bounded region. It does not say how many neurons are needed, nor that training will find it.',
      pad: 0.3,
    },
    {
      id: 'try1',
      es: 'Tu turno: sube el número de neuronas y observa el error máximo de la aproximación; en general baja, aunque no siempre en cada paso.',
      en: 'Your turn: raise the number of neurons and watch the maximum error of the approximation; in general it drops, though not at every single step.',
      gate: {
        id: 'approx',
        prompt: { es: 'Lleva el error máximo por debajo de 0.05.', en: 'Bring the maximum error below 0.05.' },
      },
      pad: 0.4,
    },
    {
      id: 'depth',
      es: 'Con suficientes neuronas, una sola capa ancha bastaría en teoría; en la práctica se apilan varias. Una red con varias capas ocultas se llama red profunda.',
      en: 'With enough neurons, one wide layer would be enough in theory; in practice several are stacked. A network with several hidden layers is called a deep network.',
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
      es: 'Los modelos reales llegan mucho más lejos: GPT-3 tiene noventa y seis capas, las de un transformer que verás más adelante, y ciento setenta y cinco mil millones de parámetros.',
      en: 'Real models go much further: GPT-3 has ninety-six layers, those of a transformer you will meet later, and one hundred seventy-five billion parameters.',
      tts: {
        es: 'Los modelos reales llegan mucho más lejos: Ge pe te tres tiene noventa y seis capas, las de un transformer que verás más adelante, y ciento setenta y cinco mil millones de parámetros.',
        en: 'Real models go much further: G P T three has ninety-six layers, those of a transformer you will meet later, and one hundred seventy-five billion parameters.',
      },
      pad: 0.3,
    },
    {
      id: 'pg-intro',
      es: 'Ahora, un patio de juegos: una red real, programada desde cero, que se entrena aquí mismo, en tu navegador. Debe separar círculos de cruces; el color de fondo es su predicción.',
      en: 'Now, a playground: a real network, programmed from scratch, training right here in your browser. It must separate circles from crosses; the background color is its prediction.',
      pad: 0.3,
    },
    {
      id: 'pg-one',
      es: 'Empecemos con una sola neurona. Su frontera es una recta, y por más que se entrena acierta poco más de la mitad: ninguna recta pasa del setenta por ciento.',
      en: 'Let’s start with a single neuron. Its boundary is a straight line, and no matter how long it trains it is right only a little over half the time: no line gets past seventy percent.',
      pad: 0.5,
    },
    {
      id: 'pg-linear',
      es: 'Apilemos ahora tres capas de seis neuronas, pero lineales. El resultado es el mismo: una recta. Las tres capas equivalen a una sola neurona.',
      en: 'Now let’s stack three layers of six neurons, but linear. The result is the same: a straight line. The three layers equal a single neuron.',
      pad: 0.5,
    },
    {
      id: 'pg-relu',
      es: 'Con una capa oculta de seis neuronas y ReLU, la frontera se dobla y rodea el centro con un polígono: los aciertos suben a casi el cien por ciento, medidos sobre estos mismos puntos.',
      en: 'With one hidden layer of six neurons and ReLU, the boundary bends and wraps the center in a polygon: accuracy climbs to nearly a hundred percent, measured on these same points.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: con los controles elige capas, neuronas y activación, y separa los círculos de las cruces con al menos noventa y cinco por ciento de aciertos.',
      en: 'Your turn: with the controls choose layers, neurons, and activation, and separate the circles from the crosses with at least ninety-five percent accuracy.',
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
      es: 'Un reto mayor: la espiral. Una sola capa de ocho neuronas se queda cerca del ochenta por ciento; tres capas de ocho, con la misma activación, la separan.',
      en: 'A bigger challenge: the spiral. A single layer of eight neurons stays near eighty percent; three layers of eight, with the same activation, separate it.',
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
      es: 'En resumen: sin activación, las capas colapsan en una; con ella, cada capa dobla el espacio. En teoría una capa ancha basta; en la práctica, apilar capas rinde más.',
      en: 'In short: without activation, layers collapse into one; with it, each layer folds space. In theory one wide layer is enough; in practice, stacking layers pays off.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Pero hay una pregunta pendiente: la red ajustó sus pesos con el descenso del gradiente. ¿Cómo se reparte la culpa del error entre cientos de pesos, repartidos en capas? Eso es la retropropagación.',
      en: 'But a question is left: the network adjusted its weights with gradient descent. How is the blame for the error shared among hundreds of weights spread over layers? That is backpropagation.',
    },
  ],

  keyIdeas: {
    es: [
      'Una capa es un grupo de neuronas que miran las mismas entradas; el pase hacia delante calcula capa por capa, de la entrada a la salida.',
      'Sin activación, dos capas equivalen a una: el producto de dos transformaciones lineales es otra transformación lineal. Apilar no suma.',
      'La no linealidad (ReLU, tanh, sigmoide) dobla el espacio: lo que una recta no separaba, tras el doblez sí se separa.',
      'Con suficientes neuronas, una sola capa oculta puede aproximar cualquier función continua sobre un conjunto cerrado y acotado (aproximación universal), pero el teorema no dice cuántas neuronas hacen falta ni que el entrenamiento las encuentre.',
      'Apilar capas multiplica los pliegues: para ciertas funciones, una red profunda necesita muchas menos neuronas que una capa única.',
    ],
    en: [
      'A layer is a group of neurons that look at the same inputs; the forward pass computes layer by layer, from input to output.',
      'Without activation, two layers equal one: the product of two linear transformations is another linear transformation. Stacking adds nothing.',
      'Nonlinearity (ReLU, tanh, sigmoid) folds space: what a straight line could not separate becomes separable after the fold.',
      'With enough neurons, a single hidden layer can approximate any continuous function on a closed, bounded set (universal approximation), but the theorem does not say how many neurons are needed nor that training will find them.',
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

Sus derivadas importan para entrenar (lección 8): $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))\\le \\tfrac14$, $\\tanh'(z)=1-\\tanh^2(z)\\le 1$ y $\\mathrm{ReLU}'(z)\\in\\{0,1\\}$ (en $z=0$ no existe; por convención se toma 0). La ReLU, «unidad lineal rectificada», tiene variantes suaves, como la GELU (Hendrycks y Gimpel, 2016), que BERT usa en lugar de la ReLU (Devlin et al., 2019).

## Aproximación universal

**Qué dice (Cybenko, 1989, teorema 2).** Una función $\\sigma$ es *sigmoidal* si $\\sigma(t)\\to1$ cuando $t\\to+\\infty$ y $\\sigma(t)\\to0$ cuando $t\\to-\\infty$. Si $\\sigma$ es continua y sigmoidal, para toda función continua $f$ sobre el cubo unitario $K=[0,1]^n$ (con un cambio de escala, sobre cualquier cubo) y todo $\\varepsilon>0$ existen $N$, $\\alpha_j$, $\\mathbf{w}_j$ y $b_j$ tales que
$$\\Big|\\sum_{j=1}^{N}\\alpha_j\\,\\sigma(\\mathbf{w}_j\\cdot\\mathbf{x}+b_j)-f(\\mathbf{x})\\Big|<\\varepsilon\\quad\\text{para todo }\\mathbf{x}\\in K.$$

**Quiénes más, y con qué condiciones.** El mismo año, Hornik, Stinchcombe y White lo probaron para «funciones de aplastamiento» (no decrecientes, con límites 0 y 1, no necesariamente continuas), y para funciones medibles en un sentido más débil (aproximación en probabilidad); en una nota final reconocen el trabajo de Funahashi (1989), que llegó por su cuenta a un resultado cercano. Las hipótesis no coinciden: Cybenko no exige que $\\sigma$ sea monótona, y Hornik et al. no exigen que sea continua. Hornik (1991) mostró que basta con una activación acotada y no constante (aproximación en $L^p$; si además es continua, aproximación uniforme sobre compactos). Leshno, Lin, Pinkus y Schocken (1993) cerraron la cuestión: para una activación localmente acotada y continua a trozos, una red con una capa oculta aproxima toda función continua, uniformemente sobre cada compacto, si y solo si la activación no es un polinomio. La ReLU cumple esa condición. El teorema también necesita el sesgo (el umbral): sin él, no vale.

**Qué no dice.** Aproxima una función conocida sobre un conjunto acotado; no dice nada fuera de él ni sobre aprender de ejemplos. No acota $N$ ni dice cómo hallar los pesos. Cybenko lo reconoce en su discusión final: su artículo se limita a la existencia, y sospecha que la gran mayoría de los problemas de aproximación exigirán un número astronómico de términos, por la maldición de la dimensionalidad. Hornik et al. añaden que un fallo en la práctica puede deberse a un aprendizaje inadecuado, a pocas neuronas o a que la relación entre entrada y salida sea aleatoria.

**La construcción de la lección.** No es la demostración de Cybenko, que usa el teorema de Hahn–Banach y no construye nada. Para una función $f$ de una variable, con $n$ nudos equiespaciados $t_k$ y pendientes $s_k=\\frac{f(t_k+h)-f(t_k)}{h}$, $h=(b-a)/n$,

$$\\hat f(x)=f(a)+\\sum_{k=0}^{n-1}(s_k-s_{k-1})\\,\\mathrm{ReLU}(x-t_k),\\quad s_{-1}=0,$$

es una red con una capa oculta de $n$ neuronas ReLU que coincide con $f$ en los nudos (interpolación lineal por tramos). Si $|f''|\\le M$, el error máximo es a lo sumo $\\dfrac{(b-a)^2M}{8n^2}$: al duplicar las neuronas, la cota se divide por cuatro. Para la curva de la escena, $M\\le 3.36$; con $n=24$ la cota es 0.026 y el error medido, 0.025. La razón de errores medidos no es siempre cuatro: 2.5 al pasar de 3 a 6 neuronas, 3.0 de 6 a 12, 4.1 de 12 a 24 y 3.8 de 24 a 48. Tampoco baja en cada paso (de 1 a 2, de 4 a 5 y de 7 a 8 neuronas sube un poco, porque los nudos equiespaciados caen en otros lugares). La meta del turno, 0.05, se alcanza con 17 neuronas (0.047; con 16, 0.057). Aquí los pesos se calculan, no se entrenan.

## Profundidad: la sierra

La función tienda $g(x)=2\\,\\mathrm{ReLU}(x)-4\\,\\mathrm{ReLU}(x-\\tfrac12)$ sobre $[0,1]$ usa dos neuronas: sube de 0 a 1 en $[0,\\tfrac12]$ y baja de 1 a 0 en $[\\tfrac12,1]$. La composición $g^{(k)}=g\\circ\\cdots\\circ g$ ($k$ capas, $2k$ neuronas) tiene $2^k$ tramos rectos (comprobado numéricamente hasta $k=6$). Una red de una sola capa oculta con $m$ neuronas ReLU tiene a lo sumo $m+1$ tramos en una dimensión (cada neurona aporta una esquina), así que para igualarla necesita al menos $2^k-1$ neuronas. Telgarsky (2016) usa esta misma función y prueba algo más fuerte, para aproximar y no solo igualar: para cada $k$ existe una red ReLU con $2k^3+8$ capas y $3k^3+12$ neuronas tal que toda red ReLU con a lo sumo $k$ capas y a lo sumo $2^k$ neuronas queda a distancia $L^1$ de al menos $1/64$ sobre $[0,1]^d$. Es un resultado sobre funciones concretas, no una ley: no dice que toda tarea real se beneficie igual de la profundidad.

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

Salida esperada: \`aciertos: 1.0\`. Con 6 neuronas dio 1.0 en las diez semillas probadas (0 a 9); con 3 neuronas, entre 0.81 y 1.0; con 2, entre 0.82 y 0.89 (los números aleatorios de NumPy pueden cambiar entre versiones). Son aciertos sobre los mismos puntos con los que se entrena: acertar con datos nuevos es otra pregunta (lección 10). El patio de juegos de la lección usa el optimizador Adam en lugar del descenso simple (lección 9).

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

Their derivatives matter for training (lesson 8): $\\sigma'(z)=\\sigma(z)(1-\\sigma(z))\\le \\tfrac14$, $\\tanh'(z)=1-\\tanh^2(z)\\le 1$, and $\\mathrm{ReLU}'(z)\\in\\{0,1\\}$ (at $z=0$ it does not exist; by convention it is taken as 0). ReLU, the “rectified linear unit”, has smooth variants such as GELU (Hendrycks and Gimpel, 2016), which BERT uses instead of ReLU (Devlin et al., 2019).

## Universal approximation

**What it says (Cybenko, 1989, theorem 2).** A function $\\sigma$ is *sigmoidal* if $\\sigma(t)\\to1$ as $t\\to+\\infty$ and $\\sigma(t)\\to0$ as $t\\to-\\infty$. If $\\sigma$ is continuous and sigmoidal, then for every continuous function $f$ on the unit cube $K=[0,1]^n$ (rescaling, on any cube) and every $\\varepsilon>0$ there exist $N$, $\\alpha_j$, $\\mathbf{w}_j$ and $b_j$ such that
$$\\Big|\\sum_{j=1}^{N}\\alpha_j\\,\\sigma(\\mathbf{w}_j\\cdot\\mathbf{x}+b_j)-f(\\mathbf{x})\\Big|<\\varepsilon\\quad\\text{for all }\\mathbf{x}\\in K.$$

**Who else, and under which conditions.** The same year, Hornik, Stinchcombe, and White proved it for “squashing functions” (non-decreasing, with limits 0 and 1, not necessarily continuous), and for measurable functions in a weaker sense (approximation in probability); in a closing note they acknowledge Funahashi’s work (1989), which had reached a close result independently. The hypotheses do not coincide: Cybenko does not require $\\sigma$ to be monotone, and Hornik et al. do not require it to be continuous. Hornik (1991) showed that a bounded, nonconstant activation is enough ($L^p$ approximation; if it is also continuous, uniform approximation on compact sets). Leshno, Lin, Pinkus, and Schocken (1993) settled the question: for a locally bounded, piecewise continuous activation, a network with one hidden layer approximates every continuous function, uniformly on every compact set, if and only if the activation is not a polynomial. ReLU meets that condition. The theorem also needs the bias (the threshold): without it, it fails.

**What it does not say.** It approximates a known function on a bounded set; it says nothing outside it, nor about learning from examples. It does not bound $N$ or say how to find the weights. Cybenko admits this in his closing discussion: his paper is limited to existence, and he suspects that the vast majority of approximation problems will need an astronomical number of terms, because of the curse of dimensionality. Hornik et al. add that a failure in practice may be due to inadequate learning, too few neurons, or a random relation between input and output.

**The construction in the lesson.** It is not Cybenko’s proof, which uses the Hahn–Banach theorem and builds nothing. For a function $f$ of one variable, with $n$ equally spaced knots $t_k$ and slopes $s_k=\\frac{f(t_k+h)-f(t_k)}{h}$, $h=(b-a)/n$,

$$\\hat f(x)=f(a)+\\sum_{k=0}^{n-1}(s_k-s_{k-1})\\,\\mathrm{ReLU}(x-t_k),\\quad s_{-1}=0,$$

is a one-hidden-layer network with $n$ ReLU neurons that equals $f$ at the knots (piecewise linear interpolation). If $|f''|\\le M$, the maximum error is at most $\\dfrac{(b-a)^2M}{8n^2}$: doubling the neurons divides the bound by four. For the scene’s curve, $M\\le 3.36$; with $n=24$ the bound is 0.026 and the measured error is 0.025. The ratio of measured errors is not always four: 2.5 from 3 to 6 neurons, 3.0 from 6 to 12, 4.1 from 12 to 24, and 3.8 from 24 to 48. Nor does it drop at every step (from 1 to 2, 4 to 5, and 7 to 8 neurons it rises a little, because equally spaced knots fall in other places). The turn’s goal, 0.05, is reached with 17 neurons (0.047; with 16, 0.057). Here the weights are computed, not trained.

## Depth: the sawtooth

The tent function $g(x)=2\\,\\mathrm{ReLU}(x)-4\\,\\mathrm{ReLU}(x-\\tfrac12)$ on $[0,1]$ uses two neurons: it rises from 0 to 1 on $[0,\\tfrac12]$ and falls from 1 to 0 on $[\\tfrac12,1]$. The composition $g^{(k)}=g\\circ\\cdots\\circ g$ ($k$ layers, $2k$ neurons) has $2^k$ straight pieces (checked numerically up to $k=6$). A network with one hidden layer of $m$ ReLU neurons has at most $m+1$ pieces in one dimension (each neuron adds one corner), so to match it, it needs at least $2^k-1$ neurons. Telgarsky (2016) uses this same function and proves something stronger, for approximating and not just matching: for every $k$ there is a ReLU network with $2k^3+8$ layers and $3k^3+12$ neurons such that every ReLU network with at most $k$ layers and at most $2^k$ neurons stays at $L^1$ distance at least $1/64$ on $[0,1]^d$. It is a result about specific functions, not a law: it does not say that every real task benefits equally from depth.

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

Expected output: \`accuracy: 1.0\`. With 6 neurons it gave 1.0 on all ten seeds tried (0 to 9); with 3 neurons, between 0.81 and 1.0; with 2, between 0.82 and 0.89 (NumPy’s random numbers may change between versions). These are hits on the same points used for training: being right on new data is a different question (lesson 10). The lesson’s playground uses the Adam optimizer instead of plain descent (lesson 9).

## What comes next

Computing the gradient of every weight in a network like this is backpropagation (lesson 8). How to train well —batches, optimizers— is lesson 9, and lesson 10 shows that being right on the training points, as here, does not guarantee being right on new data.`,
  },

  lens: {
    es: [
      '«Más capas» no es una medida de calidad: cada capa suma costo de entrenamiento y de uso. Los aciertos del patio se miden sobre los mismos puntos con que se entrena; pide la comparación con un modelo sencillo sobre datos que ninguno vio, antes de aceptar que la profundidad se justifica.',
      'El teorema de aproximación universal garantiza que existe una red, no que sirva en tu caso: no dice cuántos datos, cuánto cómputo ni cuántas neuronas hacen falta. Si alguien lo invoca para vender una solución, pregunta por la evidencia en tu problema.',
      'Entrenar es sensible al punto de partida: la misma receta con otra semilla puede dar resultados distintos (pruébalo en el patio con «Reiniciar» y pocas neuronas). Pide que se repita el entrenamiento y se reporte la variabilidad, no solo la mejor corrida.',
      'Tamaño es costo: GPT-3 tiene noventa y seis capas y ciento setenta y cinco mil millones de parámetros. Cuando hablen de una «red profunda», pide el número de parámetros y el costo por tarea (lecciones 24 y 26).',
    ],
    en: [
      '“More layers” is not a quality measure: each layer adds cost to train and to run. The playground’s accuracy is measured on the same points used for training; ask for a comparison with a simple model on data that neither saw, before accepting that depth is justified.',
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
        { es: 'Una red con una capa oculta y suficientes neuronas puede aproximar cualquier función continua en un intervalo cerrado y acotado, con la precisión que se quiera.', en: 'A network with one hidden layer and enough neurons can approximate any continuous function on a closed, bounded interval, to any desired precision.' },
        { es: 'El entrenamiento siempre encuentra los pesos correctos si hay datos suficientes.', en: 'Training always finds the right weights if there is enough data.' },
        { es: 'Con dos neuronas basta para aproximar cualquier función.', en: 'Two neurons are enough to approximate any function.' },
        { es: 'Una red profunda siempre supera a una de una sola capa.', en: 'A deep network always beats a single-layer one.' },
      ],
      answer: 0,
      why: { es: 'Es un resultado de existencia: dice que hay una red con esa precisión sobre un intervalo cerrado y acotado, no cuántas neuronas hacen falta ni que el entrenamiento la encuentre. Tampoco compara profundidad con anchura.', en: 'It is an existence result: it says a network with that precision exists on a closed, bounded interval, not how many neurons are needed nor that training will find it. It does not compare depth with width either.' },
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
    { id: 'relu', term: { es: 'ReLU', en: 'ReLU' }, def: { es: 'Unidad lineal rectificada: función de activación que devuelve cero si la suma es negativa y la propia suma si es positiva, máx(0, z). Una bisagra con una sola esquina.', en: 'Rectified linear unit: an activation function that returns zero if the sum is negative and the sum itself if it is positive, max(0, z). A hinge with a single corner.' } },
    { id: 'nonlinearity', term: { es: 'No linealidad', en: 'Nonlinearity' }, def: { es: 'Propiedad de una función que no es una recta. Es lo que impide que apilar capas colapse en una sola y lo que permite doblar el espacio.', en: 'The property of a function that is not a straight line. It stops stacked layers from collapsing into one and lets a network fold space.' } },
    { id: 'universal-approximation', term: { es: 'Aproximación universal', en: 'Universal approximation' }, def: { es: 'Teorema: una red con una capa oculta y suficientes neuronas puede aproximar cualquier función continua sobre un conjunto cerrado y acotado, con la precisión que se quiera. No dice cuántas neuronas hacen falta ni que el entrenamiento las encuentre.', en: 'Theorem: a network with one hidden layer and enough neurons can approximate any continuous function on a closed, bounded set, to any desired precision. It does not say how many neurons are needed nor that training will find them.' } },
    { id: 'deep-network', term: { es: 'Red profunda', en: 'Deep network' }, def: { es: 'Red con varias capas ocultas. Cada capa aprovecha lo que la anterior ya transformó; para ciertas funciones, así logra formas complejas con muchas menos neuronas que una sola capa ancha.', en: 'A network with several hidden layers. Each layer builds on what the previous one already transformed; for certain functions, this reaches complex shapes with far fewer neurons than a single wide layer.' } },
  ],

  sources: [
    { title: 'Approximation by superpositions of a sigmoidal function', authors: 'Cybenko, G.', year: 1989, url: 'https://doi.org/10.1007/BF02551274' },
    { title: 'Multilayer feedforward networks are universal approximators', authors: 'Hornik, K., Stinchcombe, M., White, H.', year: 1989, url: 'https://doi.org/10.1016/0893-6080(89)90020-8' },
    { title: 'On the approximate realization of continuous mappings by neural networks', authors: 'Funahashi, K.', year: 1989, url: 'https://doi.org/10.1016/0893-6080(89)90003-8' },
    { title: 'Approximation capabilities of multilayer feedforward networks', authors: 'Hornik, K.', year: 1991, url: 'https://doi.org/10.1016/0893-6080(91)90009-T' },
    { title: 'Multilayer feedforward networks with a nonpolynomial activation function can approximate any function', authors: 'Leshno, M., Lin, V. Y., Pinkus, A., Schocken, S.', year: 1993, url: 'https://doi.org/10.1016/S0893-6080(05)80131-5' },
    { title: 'Benefits of depth in neural networks', authors: 'Telgarsky, M.', year: 2016, url: 'https://proceedings.mlr.press/v49/telgarsky16.html' },
    { title: 'Language Models are Few-Shot Learners (GPT-3: 96 capas, 175 mil millones de parámetros; tabla 2.1)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Gaussian Error Linear Units (GELUs)', authors: 'Hendrycks, D., Gimpel, K.', year: 2016, url: 'https://arxiv.org/abs/1606.08415' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding (usa la GELU en lugar de la ReLU)', authors: 'Devlin, J., Chang, M.-W., Lee, K., Toutanova, K.', year: 2019, url: 'https://arxiv.org/abs/1810.04805' },
    { title: 'Adam: A Method for Stochastic Optimization', authors: 'Kingma, D. P., Ba, J.', year: 2015, url: 'https://arxiv.org/abs/1412.6980' },
  ],
});
