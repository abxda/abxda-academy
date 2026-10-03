import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'neurona',

  objectives: {
    es: [
      'Calcular la salida de una neurona de dos entradas: entradas por pesos, suma, sesgo y activación.',
      'Explicar por qué una neurona de dos entradas es una recta que divide el plano, y qué hace cada parámetro.',
      'Describir cómo aprende el perceptrón y reconocer hasta dónde llega la analogía con el cerebro.',
    ],
    en: [
      'Calculate the output of a two-input neuron: inputs times weights, sum, bias, and activation.',
      'Explain why a two-input neuron is a straight line that splits the plane, and what each parameter does.',
      'Describe how the perceptron learns and recognize how far the analogy with the brain goes.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Hasta ahora nuestro modelo era una recta con un peso y un sesgo. Hoy ese modelo se convierte en la pieza con la que se construyen las redes: la neurona artificial.',
      en: 'So far our model was a straight line with a weight and a bias. Today it becomes the building block of neural networks: the artificial neuron.',
    },
    {
      id: 'bio',
      es: 'La idea viene de la biología. Una neurona real recibe señales por sus dendritas, las combina en el cuerpo celular y, si son suficientes, envía un pulso por su axón.',
      en: 'The idea comes from biology. A real neuron receives signals through its dendrites, combines them in the cell body, and, if they are strong enough, sends a pulse down its axon.',
    },
    {
      id: 'mp',
      es: 'En mil novecientos cuarenta y tres, McCulloch y Pitts describieron un modelo matemático de esa idea: una unidad que se enciende solo si sus señales de entrada alcanzan un umbral.',
      en: 'In nineteen forty-three, McCulloch and Pitts described a mathematical model of that idea: a unit that turns on only if its input signals reach a threshold.',
      tts: {
        es: 'En mil novecientos cuarenta y tres, Mac Calok y Pits describieron un modelo matemático de esa idea: una unidad que se enciende solo si sus señales de entrada alcanzan un umbral.',
      },
    },
    {
      id: 'inputs',
      es: 'Armemos la neurona pieza por pieza. Primero, las entradas: números que describen un caso. Aquí, un correo con dos medidas: cuántos enlaces trae y cuánta confianza inspira quien lo envía.',
      en: 'Let’s build the neuron piece by piece. First, the inputs: numbers describing a case. Here, an email with two measurements: how many links it has and how trustworthy its sender is.',
    },
    {
      id: 'weights',
      es: 'Cada entrada tiene un peso, que dice cuánto importa y en qué sentido. Los enlaces suman sospecha, con peso positivo; la confianza la resta, con peso negativo.',
      en: 'Each input has a weight that says how much it matters and in which direction. Links add suspicion, with a positive weight; trust subtracts it, with a negative weight.',
    },
    {
      id: 'products',
      es: 'Se multiplica cada entrada por su peso. Muchos enlaces con un peso alto aportan mucho; la poca confianza, con su peso negativo, resta muy poco.',
      en: 'Each input is multiplied by its weight. Many links with a high weight contribute a lot; little trust, with its negative weight, subtracts very little.',
    },
    {
      id: 'sum',
      es: 'Luego se suman los productos. Es una suma ponderada: cada entrada cuenta según su peso, y todo queda resumido en un solo número.',
      en: 'Then the products are added. It is a weighted sum: each input counts according to its weight, and everything is condensed into a single number.',
    },
    {
      id: 'bias',
      es: 'A esa suma se le añade el sesgo, un número propio de la neurona. Fija su predisposición: con un sesgo negativo, hace falta más evidencia para activarse.',
      en: 'The bias is then added to that sum, a number that belongs to the neuron itself. It sets its predisposition: with a negative bias, more evidence is needed to activate.',
    },
    {
      id: 'activation',
      es: 'Por último, la función de activación decide qué sale. La más simple es el escalón: si el resultado llega a cero o más, sale uno; si no, cero. Aquí sale uno: sospechoso.',
      en: 'Finally, the activation function decides what comes out. The simplest is the step: if the result reaches zero or more, the output is one; otherwise, zero. Here it is one: suspicious.',
    },
    {
      id: 'formula',
      es: 'Eso es toda la neurona: multiplicar, sumar, añadir el sesgo y activar. Sus pesos y su sesgo son los parámetros que el descenso del gradiente ajusta.',
      en: 'That is the whole neuron: multiply, add, add the bias, and activate. Its weights and bias are the parameters that gradient descent adjusts.',
      note: { es: 'Neurona: y = f(w₁x₁ + w₂x₂ + b).', en: 'Neuron: y = f(w₁x₁ + w₂x₂ + b).' },
    },
    {
      id: 'try0',
      es: 'Tu turno: mueve las dos entradas y observa cómo cambia cada número, hasta lograr que la neurona deje de activarse.',
      en: 'Your turn: move the two inputs and watch how each number changes, until you get the neuron to stop firing.',
      gate: {
        id: 'off',
        prompt: { es: 'Mueve las entradas hasta que la salida sea cero.', en: 'Move the inputs until the output is zero.' },
      },
      pad: 0.4,
    },
    {
      id: 'plane',
      es: 'Con dos entradas, cada correo es un punto en un plano: los enlaces en un eje, la confianza en el otro. Este es el correo que acabamos de calcular.',
      en: 'With two inputs, each email is a point on a plane: links on one axis, trust on the other. This is the email we just calculated.',
    },
    {
      id: 'boundary',
      es: '¿Dónde cambia la respuesta de la neurona? Donde la suma más el sesgo vale cero. Esos puntos forman una recta, la frontera de decisión: de un lado sale uno; del otro, cero.',
      en: 'Where does the neuron’s answer change? Where the sum plus the bias equals zero. Those points form a straight line, the decision boundary: one on one side, zero on the other.',
      note: { es: 'Con dos entradas, la neurona traza una recta: la frontera de decisión.', en: 'With two inputs, the neuron draws a straight line: the decision boundary.' },
      pad: 0.3,
    },
    {
      id: 'data',
      es: 'Ahora, correos de ejemplo ya clasificados por una persona: círculos legítimos, cruces sospechosos. Son datos ilustrativos. Con estos pesos la neurona falla en cuatro, marcados con un aro.',
      en: 'Now, example emails already labeled by a person: circles are legitimate, crosses are suspicious. The data is illustrative. With these weights the neuron gets four wrong, marked with a ring.',
      pad: 0.3,
    },
    {
      id: 'shift',
      es: 'El sesgo desplaza la frontera sin inclinarla. Con sesgo cero, la recta pasa por el origen; al subirlo, la zona del uno crece, porque a la neurona le cuesta menos activarse.',
      en: 'The bias shifts the boundary without tilting it. With zero bias the line passes through the origin; raising it grows the zone of ones, because the neuron finds it easier to fire.',
      pad: 0.3,
    },
    {
      id: 'tilt',
      es: 'Los pesos, en cambio, inclinan la frontera. Un peso mayor vuelve más decisiva a su entrada; si es negativo, su efecto se invierte; y con peso cero, esa entrada se ignora.',
      en: 'Weights, instead, tilt the boundary. A larger weight makes its input more decisive; a negative one flips its effect; and with a weight of zero, that input is ignored.',
      note: { es: 'Los pesos inclinan la frontera; el sesgo la desplaza.', en: 'Weights tilt the boundary; the bias shifts it.' },
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: mueve los dos pesos y el sesgo hasta que ninguna marca quede del lado equivocado. También puedes tocar el plano para probar un correo nuevo.',
      en: 'Your turn: move the two weights and the bias until no mark is on the wrong side. You can also tap the plane to test a new email.',
      gate: {
        id: 'sep',
        prompt: { es: 'Mueve w₁, w₂ y b hasta acertar las 16 marcas.', en: 'Move w₁, w₂, and b until all 16 marks are right.' },
      },
      pad: 0.4,
    },
    {
      id: 'step-limit',
      es: 'El escalón tiene un defecto: es tajante. No dice cuán seguro está, y su pendiente es cero casi en todas partes, así que el descenso del gradiente no sabría hacia dónde bajar.',
      en: 'The step has a flaw: it is abrupt, it does not say how sure it is, and its slope is zero almost everywhere, so gradient descent has no direction to follow.',
      pad: 0.3,
    },
    {
      id: 'sigmoid',
      es: 'La solución es la sigmoide: suaviza el salto y convierte cualquier número en una puntuación entre cero y uno, que vale un medio justo sobre la frontera.',
      en: 'The fix is the sigmoid: it smooths the jump and turns any number into a score between zero and one, equal to one half right on the boundary.',
      note: { es: 'Sigmoide: salida suave entre 0 y 1; vale 0,5 sobre la frontera.', en: 'Sigmoid: a smooth output between 0 and 1; it is 0.5 on the boundary.' },
      pad: 0.4,
    },
    {
      id: 'sharp',
      es: 'Con pesos mayores la frontera no se mueve, pero la transición se vuelve más abrupta: la neurona se muestra más tajante. Con pesos menores, más dudosa.',
      en: 'With larger weights the boundary does not move, but the transition gets sharper: the neuron becomes more decisive. With smaller weights, more doubtful.',
      pad: 0.5,
    },
    {
      id: 'rosenblatt',
      es: 'En mil novecientos cincuenta y ocho, Frank Rosenblatt propuso una neurona de este tipo que aprende de ejemplos, corrigiendo sus errores. La llamó perceptrón.',
      en: 'In nineteen fifty-eight, Frank Rosenblatt proposed a neuron of this kind that learns from examples, correcting its mistakes. He called it the perceptron.',
      note: { es: 'Perceptrón (Rosenblatt, 1958): una neurona que aprende de sus errores.', en: 'Perceptron (Rosenblatt, 1958): a neuron that learns from its mistakes.' },
    },
    {
      id: 'mark1',
      es: 'Su equipo la construyó como máquina, el Mark I Perceptron: un ojo de cuatrocientas fotoceldas, y pesos guardados en potenciómetros, perillas que giraban motores eléctricos.',
      en: 'His team built it as a machine, the Mark I Perceptron: an eye of four hundred photocells, with the weights stored in potentiometers, knobs turned by electric motors.',
      tts: {
        es: 'Su equipo la construyó como máquina, el Mark uno Perceptron: un ojo de cuatrocientas fotoceldas, y pesos guardados en potenciómetros, perillas que giraban motores eléctricos.',
        en: 'His team built it as a machine, the Mark one Perceptron: an eye of four hundred photocells, with the weights stored in potentiometers, knobs turned by electric motors.',
      },
      pad: 0.3,
    },
    {
      id: 'rule',
      es: 'Su regla de aprendizaje es muy simple. Se le muestra un ejemplo: si la neurona acierta, no cambia nada; si falla, mueve los pesos hacia la respuesta correcta.',
      en: 'Its learning rule is very simple. It is shown an example: if the neuron gets it right, nothing changes; if it gets it wrong, it moves the weights toward the right answer.',
      note: { es: 'Regla: w ← w + η (t − y) x. Solo cambia cuando se equivoca.', en: 'Rule: w ← w + η (t − y) x. It only changes when it is wrong.' },
    },
    {
      id: 'update',
      es: 'Si debía decir uno y dijo cero, suma a los pesos una fracción de la entrada; si era al revés, la resta. La frontera se mueve hacia el ejemplo que falló.',
      en: 'If it should say one but says zero, it adds a fraction of the input to the weights; if the reverse, it subtracts. The boundary moves toward the missed example.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: pulsa «Un paso de aprendizaje» y mira cómo la frontera se corrige. También puedes tocar un punto con aro para aprender de ese ejemplo.',
      en: 'Your turn: press “One learning step” and watch the boundary correct itself. You can also tap a ringed point to learn from that example.',
      gate: {
        id: 'learn',
        prompt: { es: 'Lleva los errores a cero: acierta las 16 marcas.', en: 'Bring the errors to zero: get all 16 marks right.' },
      },
      pad: 0.4,
    },
    {
      id: 'converge',
      es: 'Hay una garantía: si existe una recta que separe los grupos, esta regla la encuentra en un número finito de pasos, aunque corregir un error a veces estropee otro.',
      en: 'There is a guarantee: if a line that separates the groups exists, this rule finds it in a finite number of steps, even though fixing one error sometimes breaks another.',
      note: { es: 'Si existe una recta que separe los datos, el perceptrón la encuentra.', en: 'If a line that separates the data exists, the perceptron finds it.' },
      pad: 0.3,
    },
    {
      id: 'limits',
      es: 'Y de la biología, ¿qué queda? Muy poco. Una neurona artificial es una fórmula: multiplica, suma y aplica una función. Una neurona real es una célula viva, con química, tiempo y energía.',
      en: 'And what is left of biology? Very little. An artificial neuron is a formula: it multiplies, adds, and applies a function. A real neuron is a living cell, with chemistry, timing, and energy.',
      note: { es: 'Una neurona artificial es una fórmula, no un cerebro.', en: 'An artificial neuron is a formula, not a brain.' },
    },
    {
      id: 'real',
      es: 'Un cerebro humano tiene unos ochenta y seis mil millones de neuronas, y un estudio de dos mil veintiuno halló que imitar a una sola neurona cortical simulada exigía una red de cinco a ocho capas.',
      en: 'A human brain has about eighty-six billion neurons, and a twenty twenty-one study found that imitating a single simulated cortical neuron took a network of five to eight layers.',
      pad: 0.4,
    },
    {
      id: 'hype',
      es: 'En mil novecientos cincuenta y ocho la prensa dijo que la Marina esperaba una máquina consciente de su existencia. La demostración fue distinguir tarjetas marcadas a la izquierda o a la derecha.',
      en: 'In nineteen fifty-eight the press said the Navy expected a machine conscious of its existence. The demonstration was telling cards marked on the left from cards marked on the right.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: una neurona multiplica, suma, añade un sesgo y activa. Con dos entradas dibuja una recta, y aprender es mover esa recta hasta que cada ejemplo quede de su lado.',
      en: 'In short: a neuron multiplies, adds, adds a bias, and activates. With two inputs it draws a straight line, and learning means moving that line until every example lands on its side.',
    },
    {
      id: 'bridge',
      es: 'Pero una recta es poco. ¿Qué pasa cuando los datos no se pueden separar con una sola?',
      en: 'But a straight line is not much. What happens when the data cannot be separated by a single one?',
      pad: 0.6,
    },
  ],

  keyIdeas: {
    es: [
      'Una neurona artificial calcula y = f(w₁x₁ + w₂x₂ + b): multiplica cada entrada por su peso, suma, añade el sesgo y aplica una función de activación.',
      'Con dos entradas, los puntos donde la suma vale cero forman una recta: la frontera de decisión. Los pesos la inclinan; el sesgo la desplaza.',
      'El escalón responde cero o uno de forma tajante y no da gradiente; la sigmoide da una puntuación suave entre cero y uno y sí lo da.',
      'El perceptrón (Rosenblatt, 1958) aprende corrigiendo los pesos solo cuando se equivoca; si existe una recta que separe los datos, la encuentra en un número finito de pasos.',
      'Una neurona artificial es una fórmula inspirada en la biología, no un modelo del cerebro: una neurona real es muchísimo más compleja.',
    ],
    en: [
      'An artificial neuron computes y = f(w₁x₁ + w₂x₂ + b): it multiplies each input by its weight, adds them, adds the bias, and applies an activation function.',
      'With two inputs, the points where the sum equals zero form a straight line: the decision boundary. Weights tilt it; the bias shifts it.',
      'The step answers zero or one abruptly and gives no gradient; the sigmoid gives a smooth score between zero and one and does give one.',
      'The perceptron (Rosenblatt, 1958) learns by correcting its weights only when it is wrong; if a line that separates the data exists, it finds it in a finite number of steps.',
      'An artificial neuron is a formula inspired by biology, not a model of the brain: a real neuron is vastly more complex.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Una neurona artificial funciona como una neurona del cerebro: es un cerebro en miniatura que «piensa».',
      en: 'An artificial neuron works like a neuron in the brain: it is a miniature brain that “thinks.”',
    },
    right: {
      es: 'Es una fórmula: multiplica, suma y aplica una función. Se inspira en la biología (McCulloch y Pitts, 1943), pero una neurona real es una célula enormemente más compleja. Lo que logran las redes surge de combinar muchísimas de estas fórmulas con parámetros ajustados con datos.',
      en: 'It is a formula: it multiplies, adds, and applies a function. It is inspired by biology (McCulloch and Pitts, 1943), but a real neuron is a vastly more complex cell. What networks achieve comes from combining very many of these formulas with parameters adjusted from data.',
    },
  },

  deeper: {
    es: `## La neurona como fórmula

Una neurona con entradas $x_1,\\dots,x_n$, pesos $w_1,\\dots,w_n$ y sesgo $b$ calcula

$$z = \\sum_{i=1}^{n} w_i x_i + b = \\mathbf{w}\\cdot\\mathbf{x} + b, \\qquad y = f(z)$$

donde $f$ es la función de activación. Con los números de la lección, $\\mathbf{x}=(0{,}8;\\,0{,}2)$, $\\mathbf{w}=(2;\\,-1{,}5)$ y $b=-0{,}5$:

$$z = 2\\cdot 0{,}8 + (-1{,}5)\\cdot 0{,}2 - 0{,}5 = 0{,}8$$

Con escalón, $y=1$. Con sigmoide, $y=\\sigma(0{,}8)\\approx 0{,}69$. Si $n=1$ y $f$ es la identidad, queda $y=wx+b$: la recta de la lección 3 es el caso más simple de neurona.

## La frontera de decisión

La neurona cambia de respuesta donde $z=0$, es decir, $w_1x_1+w_2x_2+b=0$. Es una recta cuyo vector normal es $\\mathbf{w}$. Su distancia al origen es $|b|/\\lVert\\mathbf{w}\\rVert$ y la distancia con signo de un punto a ella es $z/\\lVert\\mathbf{w}\\rVert$. En el ejemplo, $\\lVert\\mathbf{w}\\rVert=2{,}5$: la recta pasa a $0{,}2$ del origen y el correo de ejemplo queda a $0{,}8/2{,}5=0{,}32$.

Cambiar $b$ desplaza la recta; cambiar $\\mathbf{w}$ la gira (si $w_2=0$ es vertical: solo importa $x_1$). Multiplicar $\\mathbf{w}$ y $b$ por $k>0$ no mueve la recta, pero con sigmoide cambia la nitidez de la transición, porque la salida pasa a ser $\\sigma(kz)$. Con $n$ entradas, la frontera es un hiperplano.

## Dos activaciones

El escalón es $H(z)=1$ si $z\\ge 0$ y $0$ si no. La sigmoide es

$$\\sigma(z)=\\frac{1}{1+e^{-z}},\\qquad \\sigma'(z)=\\sigma(z)\\,\\bigl(1-\\sigma(z)\\bigr)$$

con pendiente máxima $1/4$ en $z=0$. La derivada del escalón es cero salvo en $z=0$, donde no existe: no le da ninguna señal al descenso del gradiente. La de la sigmoide existe en todos los puntos. Una neurona sigmoide entrenada para minimizar la entropía cruzada es la regresión logística. Hoy se usan además otras activaciones, como ReLU (lección 7).

## La regla del perceptrón

Con $t,y\\in\\{0,1\\}$ (respuesta correcta y respuesta de la neurona):

$$w_i \\leftarrow w_i + \\eta\\,(t-y)\\,x_i,\\qquad b \\leftarrow b + \\eta\\,(t-y)$$

Solo cambia cuando $t\\neq y$, y entonces $t-y=\\pm1$. El mismo ejemplo queda mejor: $\\Delta z=\\eta\\,(t-y)\\,(\\lVert\\mathbf{x}\\rVert^2+1)$ tiene el signo correcto. Es un paso de descenso del gradiente estocástico sobre la pérdida $\\max(0,-\\tilde t\\,z)$, con $\\tilde t=2t-1$: la idea de la lección 4, aplicada a otra pérdida porque la del escalón no tiene gradiente útil.

El teorema de convergencia dice: si existe un vector unitario $\\mathbf{u}$ y un margen $\\gamma>0$ con $\\tilde t_i\\,(\\mathbf{u}\\cdot\\mathbf{x}_i)\\ge\\gamma$ para todos los ejemplos (con el sesgo como una entrada más, igual a 1) y $\\lVert\\mathbf{x}_i\\rVert\\le R$, el perceptrón comete a lo sumo $(R/\\gamma)^2$ errores (Novikoff, 1962). Si los datos no se separan con una recta, no converge: los pesos no dejan de moverse.

## En código

\`\`\`python
import math

def neurona(x, w, b, activacion="escalon"):
    z = sum(wi * xi for wi, xi in zip(w, x)) + b
    if activacion == "escalon":
        return 1 if z >= 0 else 0
    return 1 / (1 + math.exp(-z))

x, w, b = [0.8, 0.2], [2.0, -1.5], -0.5
print(round(sum(wi * xi for wi, xi in zip(w, x)) + b, 2))   # z
print(neurona(x, w, b))                                      # escalón
print(round(neurona(x, w, b, "sigmoide"), 3))                # sigmoide
# 0.8
# 1
# 0.69
\`\`\`

Y la regla del perceptrón aprendiendo la función OR:

\`\`\`python
datos = [([0, 0], 0), ([0, 1], 1), ([1, 0], 1), ([1, 1], 1)]
w, b, eta = [0.0, 0.0], 0.0, 1.0

def salida(x):
    return 1 if w[0] * x[0] + w[1] * x[1] + b >= 0 else 0

for epoca in range(10):
    errores = 0
    for x, t in datos:
        y = salida(x)
        if y != t:
            w[0] += eta * (t - y) * x[0]
            w[1] += eta * (t - y) * x[1]
            b += eta * (t - y)
            errores += 1
    print(epoca, errores, w, b)
    if errores == 0:
        break
# 0 2 [0.0, 1.0] 0.0
# 1 2 [1.0, 1.0] 0.0
# 2 1 [1.0, 1.0] -1.0
# 3 0 [1.0, 1.0] -1.0
\`\`\`

## Lo que viene

Una sola neurona solo separa con una recta; la lección 6 muestra un caso que no puede (XOR). La lección 7 apila capas con activaciones no lineales, y la 8 calcula el gradiente de cada peso de la red (retropropagación).`,

    en: `## The neuron as a formula

A neuron with inputs $x_1,\\dots,x_n$, weights $w_1,\\dots,w_n$ and bias $b$ computes

$$z = \\sum_{i=1}^{n} w_i x_i + b = \\mathbf{w}\\cdot\\mathbf{x} + b, \\qquad y = f(z)$$

where $f$ is the activation function. With the lesson’s numbers, $\\mathbf{x}=(0.8,\\,0.2)$, $\\mathbf{w}=(2,\\,-1.5)$ and $b=-0.5$:

$$z = 2\\cdot 0.8 + (-1.5)\\cdot 0.2 - 0.5 = 0.8$$

With the step, $y=1$. With the sigmoid, $y=\\sigma(0.8)\\approx 0.69$. If $n=1$ and $f$ is the identity, we get $y=wx+b$: the line from lesson 3 is the simplest case of a neuron.

## The decision boundary

The neuron changes its answer where $z=0$, that is, $w_1x_1+w_2x_2+b=0$. It is a line whose normal vector is $\\mathbf{w}$. Its distance from the origin is $|b|/\\lVert\\mathbf{w}\\rVert$, and the signed distance from a point to it is $z/\\lVert\\mathbf{w}\\rVert$. In the example, $\\lVert\\mathbf{w}\\rVert=2.5$: the line passes $0.2$ from the origin and the example email sits $0.8/2.5=0.32$ away.

Changing $b$ shifts the line; changing $\\mathbf{w}$ rotates it (if $w_2=0$ it is vertical: only $x_1$ matters). Multiplying $\\mathbf{w}$ and $b$ by $k>0$ does not move the line, but with a sigmoid it changes how sharp the transition is, because the output becomes $\\sigma(kz)$. With $n$ inputs, the boundary is a hyperplane.

## Two activations

The step is $H(z)=1$ if $z\\ge 0$ and $0$ otherwise. The sigmoid is

$$\\sigma(z)=\\frac{1}{1+e^{-z}},\\qquad \\sigma'(z)=\\sigma(z)\\,\\bigl(1-\\sigma(z)\\bigr)$$

with maximum slope $1/4$ at $z=0$. The derivative of the step is zero except at $z=0$, where it does not exist: it gives gradient descent no signal at all. The sigmoid’s derivative exists everywhere. A sigmoid neuron trained to minimize cross-entropy is logistic regression. Other activations are also used today, such as ReLU (lesson 7).

## The perceptron rule

With $t,y\\in\\{0,1\\}$ (the correct answer and the neuron’s answer):

$$w_i \\leftarrow w_i + \\eta\\,(t-y)\\,x_i,\\qquad b \\leftarrow b + \\eta\\,(t-y)$$

It changes only when $t\\neq y$, and then $t-y=\\pm1$. The same example improves: $\\Delta z=\\eta\\,(t-y)\\,(\\lVert\\mathbf{x}\\rVert^2+1)$ has the right sign. It is a stochastic gradient descent step on the loss $\\max(0,-\\tilde t\\,z)$, with $\\tilde t=2t-1$: the idea of lesson 4, applied to a different loss because the step’s own loss has no useful gradient.

The convergence theorem says: if there is a unit vector $\\mathbf{u}$ and a margin $\\gamma>0$ with $\\tilde t_i\\,(\\mathbf{u}\\cdot\\mathbf{x}_i)\\ge\\gamma$ for every example (with the bias as one more input, equal to 1) and $\\lVert\\mathbf{x}_i\\rVert\\le R$, the perceptron makes at most $(R/\\gamma)^2$ mistakes (Novikoff, 1962). If the data cannot be separated by a line, it does not converge: the weights never stop moving.

## In code

\`\`\`python
import math

def neuron(x, w, b, activation="step"):
    z = sum(wi * xi for wi, xi in zip(w, x)) + b
    if activation == "step":
        return 1 if z >= 0 else 0
    return 1 / (1 + math.exp(-z))

x, w, b = [0.8, 0.2], [2.0, -1.5], -0.5
print(round(sum(wi * xi for wi, xi in zip(w, x)) + b, 2))   # z
print(neuron(x, w, b))                                       # step
print(round(neuron(x, w, b, "sigmoid"), 3))                  # sigmoid
# 0.8
# 1
# 0.69
\`\`\`

And the perceptron rule learning the OR function:

\`\`\`python
data = [([0, 0], 0), ([0, 1], 1), ([1, 0], 1), ([1, 1], 1)]
w, b, eta = [0.0, 0.0], 0.0, 1.0

def output(x):
    return 1 if w[0] * x[0] + w[1] * x[1] + b >= 0 else 0

for epoch in range(10):
    errors = 0
    for x, t in data:
        y = output(x)
        if y != t:
            w[0] += eta * (t - y) * x[0]
            w[1] += eta * (t - y) * x[1]
            b += eta * (t - y)
            errors += 1
    print(epoch, errors, w, b)
    if errors == 0:
        break
# 0 2 [0.0, 1.0] 0.0
# 1 2 [1.0, 1.0] 0.0
# 2 1 [1.0, 1.0] -1.0
# 3 0 [1.0, 1.0] -1.0
\`\`\`

## What comes next

A single neuron can only separate with a line; lesson 6 shows a case it cannot handle (XOR). Lesson 7 stacks layers with nonlinear activations, and lesson 8 computes the gradient of every weight in the network (backpropagation).`,
  },

  lens: {
    es: [
      'Cuando un proveedor hable de «neuronas» o de que su sistema «piensa como el cerebro», tradúcelo: son fórmulas con parámetros ajustados con datos. Pide saber con qué datos se entrenó y cómo se evaluó, no cuán «inteligente» parece.',
      'Una sola neurona se puede auditar: sus pesos dicen cuánto aporta cada entrada a la decisión. Con miles de millones de parámetros esa lectura directa se pierde. Si una decisión debe poder explicarse, pregunta qué explicación puede dar el sistema.',
      'Una salida entre 0 y 1 no es automáticamente una probabilidad: un 0,9 no significa «acierta nueve de cada diez veces». Compruébalo con datos propios antes de fijar umbrales de decisión (lección 33).',
      'Los pesos aprenden lo que hay en los datos: si los ejemplos ya traen un sesgo, la neurona lo reproduce. Y una neurona solo separa lo que una recta separa: pregunta si el problema, de verdad, tiene esa forma.',
    ],
    en: [
      'When a vendor talks about “neurons” or a system that “thinks like the brain,” translate it: they are formulas with parameters adjusted from data. Ask what data it was trained on and how it was evaluated, not how “intelligent” it seems.',
      'A single neuron can be audited: its weights say how much each input contributes to the decision. With billions of parameters, that direct reading is lost. If a decision must be explainable, ask what explanation the system can give.',
      'An output between 0 and 1 is not automatically a probability: a 0.9 does not mean “right nine times out of ten.” Check it with your own data before setting decision thresholds (lesson 33).',
      'Weights learn what is in the data: if the examples already carry a bias, the neuron reproduces it. And a neuron only separates what a line can separate: ask whether the problem really has that shape.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En una neurona de dos entradas, ¿qué efecto tiene cambiar solo el sesgo b?', en: 'In a two-input neuron, what effect does changing only the bias b have?' },
      options: [
        { es: 'Gira la frontera de decisión alrededor del origen.', en: 'It rotates the decision boundary around the origin.' },
        { es: 'Hace que la neurona ignore una de las entradas.', en: 'It makes the neuron ignore one of the inputs.' },
        { es: 'Desplaza la frontera de decisión sin cambiar su inclinación.', en: 'It shifts the decision boundary without changing its tilt.' },
        { es: 'Cambia la función de activación de escalón a sigmoide.', en: 'It switches the activation function from step to sigmoid.' },
      ],
      answer: 2,
      why: {
        es: 'El sesgo suma una constante a z, así que todos los puntos de la frontera (z = 0) se corren en bloque. La inclinación la fijan los pesos. Con sesgo cero, la frontera pasa por el origen.',
        en: 'The bias adds a constant to z, so every point of the boundary (z = 0) moves together. The tilt is set by the weights. With zero bias, the boundary passes through the origin.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué se prefiere la sigmoide al escalón cuando una neurona se entrena con descenso del gradiente?', en: 'Why is the sigmoid preferred over the step when a neuron is trained with gradient descent?' },
      options: [
        { es: 'Porque su pendiente no es cero y el gradiente indica cómo ajustar los pesos.', en: 'Because its slope is not zero, so the gradient shows how to adjust the weights.' },
        { es: 'Porque produce siempre salidas exactamente iguales a cero o uno.', en: 'Because it always produces outputs exactly equal to zero or one.' },
        { es: 'Porque no necesita pesos ni sesgo.', en: 'Because it needs no weights or bias.' },
        { es: 'Porque hace que la frontera de decisión deje de ser una recta.', en: 'Because it makes the decision boundary stop being a straight line.' },
      ],
      answer: 0,
      why: {
        es: 'El escalón es plano casi en todas partes: su pendiente es cero y el gradiente no dice hacia dónde mover los pesos. La sigmoide cambia gradualmente y tiene pendiente en todos los puntos. La frontera sigue siendo una recta (donde z = 0).',
        en: 'The step is flat almost everywhere: its slope is zero and the gradient does not say which way to move the weights. The sigmoid changes gradually and has a slope at every point. The boundary remains a straight line (where z = 0).',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Una neurona con escalón tiene w = (0,5; −0,5) y b = 0. Para el ejemplo x = (1; 2) debía responder 1, pero respondió 0. Con tasa η = 1, ¿cómo quedan los pesos y el sesgo tras un paso del perceptrón?',
        en: 'A neuron with a step has w = (0.5, −0.5) and b = 0. For the example x = (1, 2) it should have answered 1, but it answered 0. With rate η = 1, what are the weights and bias after one perceptron step?',
      },
      options: [
        { es: 'w = (−0,5; −2,5) y b = −1', en: 'w = (−0.5, −2.5) and b = −1' },
        { es: 'w = (1,5; 1,5) y b = 1', en: 'w = (1.5, 1.5) and b = 1' },
        { es: 'w = (0,5; −0,5) y b = 0 (no cambian)', en: 'w = (0.5, −0.5) and b = 0 (unchanged)' },
        { es: 'w = (1; 0) y b = 0,5', en: 'w = (1, 0) and b = 0.5' },
      ],
      answer: 1,
      why: {
        es: 'Se equivocó: t − y = 1 − 0 = +1. Entonces se suma la entrada a los pesos y 1 al sesgo: w = (0,5 + 1; −0,5 + 2) = (1,5; 1,5) y b = 0 + 1 = 1. Ahora z = 1,5 + 3 + 1 = 5,5 y la neurona responde 1.',
        en: 'It was wrong: t − y = 1 − 0 = +1. So the input is added to the weights and 1 to the bias: w = (0.5 + 1, −0.5 + 2) = (1.5, 1.5) and b = 0 + 1 = 1. Now z = 1.5 + 3 + 1 = 5.5 and the neuron answers 1.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor asegura que su sistema usa «neuronas que piensan como el cerebro». ¿Qué pregunta es la más útil para evaluarlo?', en: 'A vendor claims its system uses “neurons that think like the brain.” Which question is the most useful for evaluating it?' },
      options: [
        { es: '¿Cuántas neuronas tiene su sistema?', en: 'How many neurons does its system have?' },
        { es: '¿Qué tan parecido es su sistema a un cerebro humano?', en: 'How similar is its system to a human brain?' },
        { es: '¿Qué función de activación utiliza cada neurona?', en: 'Which activation function does each neuron use?' },
        { es: '¿Con qué datos se entrenó y cuánto acierta con casos que no vio?', en: 'What data was it trained on, and how accurate is it on cases it has not seen?' },
      ],
      answer: 3,
      why: {
        es: 'Una neurona artificial es una fórmula: lo que importa es con qué datos aprendió y qué tan bien funciona con casos nuevos. El número de neuronas o el parecido con un cerebro no dicen si sirve para tu caso.',
        en: 'An artificial neuron is a formula: what matters is what data it learned from and how well it works on new cases. The number of neurons or its resemblance to a brain does not say whether it fits your case.',
      },
    },
  ],

  glossary: ['neuron', 'activation', 'decision-boundary', 'perceptron', 'sigmoid', 'weight', 'bias', 'parameter', 'feature', 'prediction', 'gradient-descent', 'gradient', 'learning-rate'],

  terms: [
    {
      id: 'neuron',
      term: { es: 'Neurona artificial', en: 'Artificial neuron' },
      def: {
        es: 'Unidad de cálculo que multiplica cada entrada por un peso, suma los resultados, añade un sesgo y aplica una función de activación: y = f(w·x + b).',
        en: 'A unit of computation that multiplies each input by a weight, adds the results, adds a bias, and applies an activation function: y = f(w·x + b).',
      },
    },
    {
      id: 'activation',
      term: { es: 'Función de activación', en: 'Activation function' },
      def: {
        es: 'Función que se aplica a la suma ponderada más el sesgo para producir la salida de la neurona. Ejemplos: el escalón y la sigmoide.',
        en: 'A function applied to the weighted sum plus the bias to produce the neuron’s output. Examples: the step and the sigmoid.',
      },
    },
    {
      id: 'decision-boundary',
      term: { es: 'Frontera de decisión', en: 'Decision boundary' },
      def: {
        es: 'Conjunto de puntos donde la neurona cambia de respuesta. Con dos entradas es una recta: w₁x₁ + w₂x₂ + b = 0.',
        en: 'The set of points where the neuron changes its answer. With two inputs it is a straight line: w₁x₁ + w₂x₂ + b = 0.',
      },
    },
    {
      id: 'perceptron',
      term: { es: 'Perceptrón', en: 'Perceptron' },
      def: {
        es: 'Neurona con activación en escalón propuesta por Frank Rosenblatt en 1958, junto con una regla que corrige sus pesos cuando se equivoca.',
        en: 'A neuron with a step activation proposed by Frank Rosenblatt in 1958, together with a rule that corrects its weights when it is wrong.',
      },
    },
    {
      id: 'sigmoid',
      term: { es: 'Sigmoide', en: 'Sigmoid' },
      def: {
        es: 'Función σ(z) = 1/(1 + e⁻ᶻ): convierte cualquier número en un valor entre 0 y 1, y vale 0,5 cuando z = 0.',
        en: 'The function σ(z) = 1/(1 + e⁻ᶻ): it turns any number into a value between 0 and 1, and equals 0.5 when z = 0.',
      },
    },
  ],

  sources: [
    { title: 'A logical calculus of the ideas immanent in nervous activity', authors: 'McCulloch, W. S., Pitts, W.', year: 1943, url: 'https://doi.org/10.1007/BF02478259' },
    { title: 'The perceptron: a probabilistic model for information storage and organization in the brain', authors: 'Rosenblatt, F.', year: 1958, url: 'https://doi.org/10.1037/h0042519' },
    { title: 'On convergence proofs on perceptrons (Symposium on the Mathematical Theory of Automata, vol. 12, pp. 615–622)', authors: 'Novikoff, A. B. J.', year: 1962 },
    { title: 'Electronic Neural Network, Mark I Perceptron (objeto de colección)', authors: 'Smithsonian National Museum of American History', year: 1958, url: 'https://americanhistory.si.edu/collections/object/nmah_334414' },
    { title: 'Professor’s perceptron paved the way for AI – 60 years too soon', authors: 'Cornell Chronicle', year: 2019, url: 'https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon' },
    { title: 'New Navy Device Learns by Doing; Psychologist Shows Embryo of Computer Designed to Read and Grow Wiser', authors: 'The New York Times, 8 de julio de 1958', year: 1958 },
    { title: 'Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain', authors: 'Azevedo, F. A. C. et al.', year: 2009, url: 'https://doi.org/10.1002/cne.21974' },
    { title: 'Single cortical neurons as deep artificial neural networks', authors: 'Beniaguev, D., Segev, I., London, M.', year: 2021, url: 'https://doi.org/10.1016/j.neuron.2021.07.002' },
  ],
});
