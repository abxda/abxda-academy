import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'descenso-del-gradiente',

  objectives: {
    es: [
      'Explicar qué es la pendiente de la curva de error en un punto (su derivada) y qué indica su signo.',
      'Calcular un paso del descenso del gradiente con la regla peso nuevo = peso actual − tasa × pendiente.',
      'Predecir el efecto de una tasa de aprendizaje muy pequeña o muy grande, y reconocer el gradiente como la lista de pendientes, una por peso.',
    ],
    en: [
      'Explain what the slope of the error curve at a point is (its derivative) and what its sign tells you.',
      'Compute one step of gradient descent with the rule new weight = current weight − rate × slope.',
      'Predict the effect of a very small or very large learning rate, and recognize the gradient as the list of slopes, one per weight.',
    ],
  },

  segments: [
    // ── la curva de error, pieza por pieza ──
    {
      id: 'hook',
      es: 'Ya tenemos un modelo con un número por ajustar, el peso, y una forma de medir cuánto se equivoca. Falta lo central: ¿cómo encontrar el peso que se equivoca menos?',
      en: 'We now have a model with one number to adjust, the weight, and a way to measure how wrong it is. The key part is still missing: how do we find the weight that is least wrong?',
    },
    {
      id: 'axis-x',
      es: 'Para verlo, dibujamos un plano. La línea horizontal es el peso: cada posición es un valor distinto, de menos dos a ocho.',
      en: 'To see it, we draw a plane. The horizontal line is the weight: each position is a different value, from minus two to eight.',
    },
    {
      id: 'axis-y',
      es: 'La línea vertical es el error que comete el modelo con ese peso, la pérdida de la lección anterior. Abajo, poco error; arriba, mucho.',
      en: 'The vertical line is the error the model makes with that weight, the loss from the last lesson. Low means little error; high means a lot.',
    },
    {
      id: 'curve',
      es: 'Calculamos el error de varios pesos y marcamos cada uno con un punto: con menos uno, nueve; con cero, cinco punto cinco. Unidos, forman una curva.',
      en: 'We compute the error for several weights and mark each one with a point: minus one gives nine; zero gives five point five. Joined up, they form a curve.',
      pad: 0.3,
    },
    {
      id: 'goal',
      es: 'Tiene forma de valle. Su punto más bajo es el mejor peso: aquí, tres, con error uno. Es lo que queremos encontrar.',
      en: 'It is shaped like a valley. Its lowest point is the best weight: here, three, with an error of one. That is what we want to find.',
      note: { es: 'Curva de error: el error de cada peso. Su fondo es el mejor peso.', en: 'Error curve: the error for each weight. Its bottom is the best weight.' },
    },
    {
      id: 'start',
      es: 'Empecemos con un peso cualquiera: menos uno. Lo ubicamos en la línea horizontal y subimos hasta la curva: ahí, el error es nueve.',
      en: 'Let’s start with an arbitrary weight: minus one. We find it on the horizontal line and go up to the curve: there, the error is nine.',
      pad: 0.3,
    },
    // ── la pendiente, desde cero ──
    {
      id: 'slope-what',
      es: '¿Hacia dónde mover el peso para que el error baje? Lo dice la pendiente de la curva: qué tan inclinada está justo en ese punto, y hacia qué lado.',
      en: 'Which way should we move the weight so the error drops? The slope of the curve tells us: how steep it is right at that point, and which way it tilts.',
    },
    {
      id: 'slope-nudge',
      es: 'Para medirla, movemos el peso un poquito: una décima a la derecha, a menos cero punto nueve. El error baja de nueve a unos ocho punto seis.',
      en: 'To measure it, we move the weight a tiny bit: one tenth to the right, to minus zero point nine. The error drops from nine to about eight point six.',
      pad: 0.3,
    },
    {
      id: 'slope-value',
      es: 'Bajó casi cuatro décimas, unas cuatro veces lo que movimos el peso. Esa proporción es la pendiente: aquí vale menos cuatro. El signo menos dice que el error baja.',
      en: 'It dropped almost four tenths, about four times as much as we moved the weight. That ratio is the slope: here it is minus four. The minus sign says the error goes down.',
      note: { es: 'Pendiente: cuánto cambia el error por cada pequeño movimiento del peso.', en: 'Slope: how much the error changes for each tiny move of the weight.' },
    },
    {
      id: 'slope-tangent',
      es: 'Visto muy de cerca, ese pedazo de curva parece recto. La recta que toca la curva en el punto se llama tangente: por cada paso a la derecha, baja cuatro.',
      en: 'Seen up close, that bit of curve looks straight. The line that touches the curve at that point is called the tangent: for each step to the right, it drops four.',
      pad: 0.3,
    },
    {
      id: 'slope-sign',
      es: 'Del otro lado del valle, en el peso seis, la tangente sube: tres por cada paso a la derecha. Ahí la pendiente es más tres, positiva: cuesta arriba.',
      en: 'On the other side of the valley, at weight six, the tangent rises: three for each step to the right. There the slope is plus three, positive: uphill.',
      pad: 0.3,
    },
    {
      id: 'slope-zero',
      es: 'Y en el fondo, en el tres, la tangente queda plana: pendiente cero. En resumen: negativa, baja hacia la derecha; positiva, sube; cero, es el fondo.',
      en: 'And at the bottom, at three, the tangent lies flat: slope zero. In short: negative, it goes down to the right; positive, it goes up; zero, it is the bottom.',
      note: { es: 'Pendiente negativa: baja hacia la derecha. Positiva: sube. Cero: el fondo.', en: 'Negative slope: down to the right. Positive: up. Zero: the bottom.' },
      pad: 0.3,
    },
    {
      id: 'derivative',
      es: 'En matemáticas, la pendiente en un punto se llama derivada. No hay más misterio: es cuánto cambia el error por cada pequeño movimiento del peso.',
      en: 'In mathematics, the slope at a point is called the derivative. There is no more mystery to it: it is how much the error changes for each tiny move of the weight.',
      note: { es: 'Derivada: el nombre matemático de la pendiente en un punto.', en: 'Derivative: the mathematical name for the slope at a point.' },
    },
    // ── la regla, símbolo por símbolo ──
    {
      id: 'rule-dir',
      es: 'Con eso basta para decidir. Pendiente negativa: el error baja hacia la derecha, así que avanzamos. Positiva: retrocedemos. Siempre en contra de la pendiente.',
      en: 'That is enough to decide. Negative slope: the error goes down to the right, so we move forward. Positive: we move back. Always against the slope.',
      pad: 0.3,
    },
    {
      id: 'rule-words',
      es: 'Escrito como regla: el peso nuevo es igual al peso actual, menos un número pequeño multiplicado por la pendiente.',
      en: 'Written as a rule: the new weight equals the current weight, minus a small number multiplied by the slope.',
      note: { es: 'Regla: peso nuevo = peso actual − η × pendiente.', en: 'Rule: new weight = current weight − η × slope.' },
    },
    {
      id: 'rule-eta',
      es: 'Ese número pequeño se llama tasa de aprendizaje y se escribe con la letra griega eta. Decide el tamaño del paso. Por ahora vale un medio.',
      en: 'That small number is called the learning rate, and it is written with the Greek letter eta. It sets the size of the step. For now it is one half.',
    },
    {
      id: 'rule-minus',
      es: '¿Y el signo menos? Restar una pendiente negativa es sumar: el peso avanza. Restar una positiva lo hace retroceder. En los dos casos, cuesta abajo.',
      en: 'And the minus sign? Subtracting a negative slope means adding: the weight moves forward. Subtracting a positive one moves it back. Either way, downhill.',
      pad: 0.3,
    },
    // ── en la niebla, paso a paso ──
    {
      id: 'fog',
      es: 'Ahora, la trampa: la máquina no ve esta curva. Para dibujarla tendría que calcular el error con cada peso posible, y con millones de pesos eso es imposible.',
      en: 'Now the catch: the machine cannot see this curve. To draw it, it would have to compute the error for every possible weight, and with millions of weights that is impossible.',
    },
    {
      id: 'fog-local',
      es: 'Solo sabe dos cosas: el error donde está y la pendiente ahí mismo, como quien baja un cerro con niebla tanteando el piso con el pie. Para la regla, basta.',
      en: 'It knows only two things: the error where it stands and the slope right there, like walking down a hill in fog, feeling the ground with your foot. For the rule, that is enough.',
    },
    {
      id: 'first-step',
      es: 'Hagamos la cuenta: menos uno, menos un medio por menos cuatro. Eso da menos uno más dos: el peso nuevo es uno, y el error baja de nueve a tres.',
      en: 'Let’s do the math: minus one, minus one half times minus four. That gives minus one plus two: the new weight is one, and the error drops from nine to three.',
      pad: 0.3,
    },
    {
      id: 'second-step',
      es: 'En uno, la pendiente es menos dos, más suave. Por eso el paso es más corto, de uno: el peso llega a dos y el error, a uno punto cinco.',
      en: 'At one, the slope is minus two, gentler. So the step is shorter, just one: the weight reaches two and the error, one point five.',
      pad: 0.3,
    },
    {
      id: 'repeat',
      es: 'Y otra vez: medir la pendiente, dar el paso. Como la pendiente se aplana al acercarse al fondo, los pasos se acortan solos. El error sigue bajando.',
      en: 'And again: measure the slope, take the step. Because the slope flattens near the bottom, the steps get shorter on their own. The error keeps dropping.',
      pad: 0.5,
    },
    {
      id: 'bottom',
      es: 'Cerca del fondo la pendiente es casi cero, y el paso también: el peso casi no se mueve. El error quedó en uno, el mínimo.',
      en: 'Near the bottom the slope is almost zero, and so is the step: the weight barely moves. The error has settled at one, the minimum.',
    },
    {
      id: 'map',
      es: 'Quitemos la niebla. La máquina nunca vio la curva: solo midió la pendiente donde estaba, paso a paso, y aun así llegó al fondo.',
      en: 'Let’s lift the fog. The machine never saw the curve: it only measured the slope where it was, step by step, and still reached the bottom.',
      pad: 0.3,
    },
    {
      id: 'name',
      es: 'Este método se llama descenso del gradiente: bajar paso a paso, siempre en contra de la pendiente. Enseguida veremos de dónde sale la palabra gradiente.',
      en: 'This method is called gradient descent: going down step by step, always against the slope. In a moment we will see where the word gradient comes from.',
    },
    {
      id: 'try1',
      es: 'Si quieres, vuelve a empezar desde menos uno y da tú los pasos con el botón. Fíjate cómo cada paso es más corto que el anterior.',
      en: 'If you like, start again from minus one and take the steps yourself with the button. Notice how each step is shorter than the one before.',
      gate: {
        id: 'steps',
        prompt: { es: 'pulsa «Dar un paso» tres veces y mira cómo se acortan los pasos.', en: 'press “Take a step” three times and watch the steps get shorter.' },
      },
      pad: 0.4,
    },
    // ── la tasa de aprendizaje ──
    {
      id: 'lr-intro',
      es: 'Falta una decisión: el valor de la tasa, el tamaño del paso. Con un medio funcionó bien. Veamos qué pasa con otros valores, de muy pequeño a muy grande.',
      en: 'One decision is left: the value of the rate, the size of the step. One half worked well. Let’s see what happens with other values, from very small to very large.',
    },
    {
      id: 'lr-small',
      es: 'Con una tasa muy pequeña, cinco centésimas, los pasos son diminutos: tras doce pasos, sigue lejos del fondo. No se pasa, pero tarda muchísimo.',
      en: 'With a very small rate, zero point zero five, the steps are tiny: after twelve steps it is still far from the bottom. It never overshoots, but it takes forever.',
      pad: 0.4,
    },
    {
      id: 'lr-osc',
      es: 'Con una tasa grande, uno punto siete, se pasa de largo: cae del otro lado del valle y rebota de un lado a otro, aunque poco a poco se acerca.',
      en: 'With a large rate, one point seven, it overshoots: it lands on the other side of the valley and bounces back and forth, though it slowly gets closer.',
      pad: 0.4,
    },
    {
      id: 'lr-diverge',
      es: 'Y si es demasiado grande, aquí más de dos, cada salto cae más arriba que el anterior: el error crece en lugar de bajar. A eso se le llama divergir.',
      en: 'And if it is far too large, here more than two, each jump lands higher than the last: the error grows instead of shrinking. This is called diverging.',
      pad: 0.4,
    },
    {
      id: 'lr-good',
      es: 'Entre esos extremos, una tasa como cero punto ocho llega en pocos pasos y sin rebotar. Encontrar una buena tasa es parte del oficio de entrenar.',
      en: 'Between those extremes, a rate like zero point eight gets there in a few steps, without bouncing. Finding a good rate is part of the craft of training.',
      note: { es: 'Tasa muy pequeña: lenta. Muy grande: rebota o diverge.', en: 'Rate too small: slow. Too large: it bounces or diverges.' },
      pad: 0.3,
    },
    {
      id: 'try2',
      es: 'Si quieres, mueve tú la tasa con el deslizador: cada vez que la cambies, la bolita vuelve a bajar desde menos uno. Busca una que llegue sin rebotar.',
      en: 'If you like, move the rate yourself with the slider: each time you change it, the ball starts again from minus one. Look for one that gets there without bouncing.',
      gate: {
        id: 'lr',
        prompt: { es: 'busca una tasa que llegue al fondo en diez pasos o menos, sin rebotar.', en: 'find a rate that reaches the bottom in ten steps or fewer, without bouncing.' },
      },
      pad: 0.4,
    },
    // ── muchos pesos: el gradiente ──
    {
      id: 'two-weights',
      es: 'Un modelo real tiene muchos pesos. Con solo dos, cada pareja de valores tiene su propio error, y juntos ya no forman una curva, sino un paisaje.',
      en: 'A real model has many weights. With just two, every pair of values has its own error, and together they no longer form a curve, but a landscape.',
    },
    {
      id: 'contours',
      es: 'Lo vemos desde arriba, como un mapa de montaña: cada línea une los puntos con el mismo error, y más color es más error. El fondo del valle está en el centro.',
      en: 'We see it from above, like a hiking map: each line joins points with the same error, and more color means more error. The bottom of the valley is in the middle.',
      pad: 0.3,
    },
    {
      id: 'two-slopes',
      es: 'En cada punto hay ahora dos pendientes: una si mueves solo el primer peso y otra si mueves solo el segundo. Cada flecha señala hacia dónde sube el error.',
      en: 'At each point there are now two slopes: one if you move only the first weight, another if you move only the second. Each arrow points to where the error rises.',
      pad: 0.3,
    },
    {
      id: 'gradient',
      es: 'La lista de esas pendientes, una por peso, se llama gradiente. Juntas forman esta flecha, que apunta hacia donde el error sube más rápido.',
      en: 'The list of those slopes, one per weight, is called the gradient. Together they form this arrow, which points to where the error rises fastest.',
      note: { es: 'Gradiente: la lista de pendientes, una por peso. Apunta cuesta arriba.', en: 'Gradient: the list of slopes, one per weight. It points uphill.' },
      pad: 0.3,
    },
    {
      id: 'path2d',
      es: 'Para bajar, se va al revés de la flecha, con la misma regla para cada peso. Como este valle es alargado, el camino baja en zigzag hasta el fondo.',
      en: 'To go down, you go against the arrow, with the same rule for each weight. Because this valley is long and narrow, the path zigzags down to the bottom.',
      pad: 0.6,
    },
    {
      id: 'scale',
      es: 'Con miles de millones de pesos es igual: el gradiente trae una pendiente por peso, y en cada paso todos se ajustan a la vez. GPT-3 tiene ciento setenta y cinco mil millones.',
      en: 'With billions of weights it is the same: the gradient holds one slope per weight, and at each step all of them are adjusted at once. GPT-3 has one hundred seventy-five billion.',
      tts: {
        es: 'Con miles de millones de pesos es igual: el gradiente trae una pendiente por peso, y en cada paso todos se ajustan a la vez. Ge pe te tres tiene ciento setenta y cinco mil millones.',
        en: 'With billions of weights it is the same: the gradient holds one slope per weight, and at each step all of them are adjusted at once. G P T three has one hundred seventy-five billion.',
      },
      pad: 0.4,
    },
    // ── honestidad: varios valles ──
    {
      id: 'rugged',
      es: 'Una advertencia honesta: el paisaje real es irregular, con varios valles. Pongamos dos bolitas en puntos de partida distintos, con la misma regla y la misma tasa.',
      en: 'An honest warning: real landscapes are irregular, with several valleys. Let’s put two balls at different starting points, with the same rule and the same rate.',
    },
    {
      id: 'valleys',
      es: 'Cada una baja al valle más cercano, y no son igual de profundos. Nada garantiza llegar al mejor: dónde empiezas importa, y por eso entrenar es un oficio.',
      en: 'Each one goes down into the nearest valley, and they are not equally deep. Nothing guarantees reaching the best one: where you start matters, which is why training is a craft.',
      note: { es: 'Dónde empiezas importa: puede haber varios valles.', en: 'Where you start matters: there can be several valleys.' },
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: medir el error, calcular la pendiente, dar un paso en contra y repetir. Con ese bucle y sus variantes se entrena desde una recta hasta un chatbot.',
      en: 'In short: measure the error, compute the slope, take a step against it, and repeat. With that loop, and its variants, models are trained from a straight line to a chatbot.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Pero una recta solo sabe dibujar rectas. Para llegar más lejos hace falta un modelo más rico: la neurona artificial, protagonista de la siguiente lección.',
      en: 'But a straight line can only draw straight lines. To go further we need a richer model: the artificial neuron, the star of the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'Entrenar es buscar el peso que deja el error más bajo. La máquina no ve la curva completa: solo conoce el error y la pendiente donde está.',
      'La pendiente, o derivada, dice cuánto cambia el error al mover un poco el peso. Negativa: baja hacia la derecha. Positiva: sube. Cero: es el fondo.',
      'La regla es peso nuevo = peso actual − η × pendiente. El signo menos lleva cuesta abajo desde cualquier lado, y los pasos se acortan solos al aplanarse la pendiente.',
      'La tasa de aprendizaje η fija el tamaño del paso: muy pequeña es lenta; muy grande rebota o diverge.',
      'Con muchos pesos, el gradiente es la lista de pendientes, una por peso. El mismo bucle, con variantes como Adam, entrena modelos de cientos de miles de millones de pesos, sin garantía de llegar al mejor valle.',
    ],
    en: [
      'Training means searching for the weight that leaves the error lowest. The machine cannot see the whole curve: it only knows the error and the slope where it stands.',
      'The slope, or derivative, says how much the error changes when the weight moves a little. Negative: it goes down to the right. Positive: it goes up. Zero: it is the bottom.',
      'The rule is new weight = current weight − η × slope. The minus sign leads downhill from either side, and the steps shorten on their own as the slope flattens.',
      'The learning rate η sets the size of the step: too small is slow; too large bounces or diverges.',
      'With many weights, the gradient is the list of slopes, one per weight. The same loop, with variants such as Adam, trains models with hundreds of billions of weights, with no guarantee of reaching the best valley.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA «ve» todo el paisaje de errores y salta directamente al mejor punto.',
      en: 'The AI “sees” the whole error landscape and jumps straight to the best point.',
    },
    right: {
      es: 'Solo conoce la pendiente justo donde está. Llega al fondo tanteando, paso a paso, y puede terminar en un valle distinto según dónde empiece.',
      en: 'It only knows the slope right where it stands. It reaches the bottom by feeling its way, step by step, and can end up in a different valley depending on where it starts.',
    },
  },

  deeper: {
    es: `## La pendiente y la derivada

Para medir la pendiente de una curva $L(w)$ en un punto se mueve el peso una cantidad pequeña $\\varepsilon$ y se divide el cambio del error entre ese movimiento:

$$\\frac{L(w+\\varepsilon)-L(w)}{\\varepsilon}$$

La **derivada** $L'(w)$ es el valor al que se acerca ese cociente cuando $\\varepsilon$ se hace cada vez más pequeño. Por eso $L(w+\\varepsilon)\\approx L(w)+\\varepsilon\\,L'(w)$: la derivada dice por cuánto hay que multiplicar un cambio pequeño del peso para obtener el cambio del error, y es la pendiente de la recta tangente en ese punto (Goodfellow et al., 2016, §4.3).

En la lección, $L(w)=\\tfrac12(w-3)^2+1$, así que $L'(w)=w-3$. En $w=-1$, con $\\varepsilon=0.1$ el error pasa de 9 a 8.605 y el cociente es $-0.395/0.1=-3.95$; con $\\varepsilon=0.01$, $-3.995$; en el límite, $-4$. En esta curva el cociente vale exactamente $(w-3)+\\varepsilon/2$. En el peso 6 la derivada es $+3$ y en el 3, el fondo, es $0$.

Ojo con el nombre: en la lección 3, el peso $w$ era la pendiente de la *recta del modelo*. Aquí la pendiente es otra: la de la *curva del error* respecto al peso. Y en la práctica no se tantea con un $\\varepsilon$: la derivada se calcula con fórmulas exactas y, en una red profunda, con la retropropagación (lección 8).

## La regla de actualización

Con un peso, el descenso del gradiente repite

$$w_{t+1} = w_t - \\eta\\,L'(w_t)$$

donde $\\eta>0$ es la tasa de aprendizaje. Como $L(w-\\varepsilon\\,\\text{signo}(L'(w)))$ es menor que $L(w)$ si $\\varepsilon$ es suficientemente pequeño, moverse en pasos pequeños con el signo contrario al de la derivada hace bajar el error (Goodfellow et al., 2016, §4.3). En la lección, con $\\eta=0.5$: $-1 \\to 1 \\to 2 \\to 2.5 \\to 2.75 \\to \\dots$ La distancia al fondo se reduce a la mitad en cada paso y los pasos (2, 1, 0.5, 0.25, …) se acortan solos porque la pendiente se aplana.

Con muchos pesos, $\\mathbf{w}=(w_1,\\dots,w_n)$, cada **derivada parcial** $\\partial L/\\partial w_i$ mide cómo cambia el error cuando solo aumenta $w_i$, y el **gradiente** es el vector que las contiene todas:

$$\\nabla L(\\mathbf{w}) = \\Big(\\frac{\\partial L}{\\partial w_1},\\dots,\\frac{\\partial L}{\\partial w_n}\\Big),\\qquad \\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta\\,\\nabla L(\\mathbf{w}_t)$$

El gradiente apunta cuesta arriba porque, entre todas las direcciones de longitud 1, es la que más hace crecer a $L$; por eso se resta (Goodfellow et al., 2016, §4.3).

El método se atribuye a Cauchy, que lo expuso en la sesión del 18 de octubre de 1847 de la Academia de Ciencias de París para resolver sistemas de ecuaciones: cambiaba el sistema por una sola ecuación, la suma de los cuadrados igualada a cero, y hacía bajar esa función paso a paso. El tamaño del paso lo fijaba resolviendo una ecuación de una variable o tomando un valor «suficientemente pequeño» (Cauchy, 1847; Lemaréchal, 2012).

## Por qué existe un umbral para la tasa

Para un error cuadrático de una variable, $L(w)=\\tfrac{h}{2}(w-w^*)^2 + c$ con curvatura $h>0$, el gradiente es $h\\,(w-w^*)$ y la distancia al fondo se multiplica por un factor constante en cada paso:

$$w_{t+1}-w^* = (1-\\eta h)\\,(w_t-w^*)$$

- si $0<\\eta h<1$, el peso se acerca al fondo sin cruzarlo;
- si $\\eta h=1$, llega al fondo de un salto;
- si $1<\\eta h<2$, lo cruza en cada paso pero converge (oscila);
- si $\\eta h=2$, rebota entre dos puntos a la misma distancia del fondo, sin acercarse;
- si $\\eta h>2$, la distancia crece en cada paso: diverge.

Es el análisis clásico de LeCun et al. (1998, §5.1): la tasa óptima de una variable es $1/h$, y se diverge si la tasa pasa del doble de la óptima. En la lección $h=1$. Las cuatro tasas de la escena son un caso lento (0.05: tras 12 pasos sigue a 2.16 del fondo, que estaba a 4), uno que oscila (1.7: cruza el fondo en cada paso, pero se acerca), uno que diverge (2.05: cada salto cae más lejos y el error pasa de 9 a 12.82 en 4 pasos) y uno bueno (0.8: a 0.03 del fondo en 3 pasos). El turno interactivo pide llegar a menos de 0.08 del fondo en diez pasos o menos sin cruzarlo: lo cumplen las tasas de 0.33 a 1.

Una tasa muy pequeña no es del todo inocua en una red real: además de lenta, puede dejar el entrenamiento atascado con un error alto, un efecto que no ocurriría con una función convexa y que se entiende poco (Goodfellow et al., 2016, §11.4.1).

## Varias dimensiones: el condicionamiento

En varias dimensiones la curvatura es la matriz hessiana $H$. En una cuadrática, $\\mathbf{w}_{t+1}-\\mathbf{w}^*=(I-\\eta H)(\\mathbf{w}_t-\\mathbf{w}^*)$: en cada dirección propia la distancia se multiplica por $1-\\eta\\lambda_i$. Para converger hace falta $\\eta<2/\\lambda_{\\max}(H)$ (LeCun et al., 1998), pero el avance en la dirección más plana depende de $\\lambda_{\\min}$. Con el número de condición $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$ grande, el error cae despacio y el camino zigzaguea, como en la figura. Con la mejor tasa fija ($\\eta = 2/(\\lambda_{\\max}+\\lambda_{\\min})$) la distancia al fondo se reduce por un factor $(\\kappa-1)/(\\kappa+1)$ por paso (Goh, 2017).

En la figura, $\\lambda_{\\min}=1$ y $\\lambda_{\\max}=7$ ($\\kappa=7$), y $\\eta=0.2$: en la dirección plana la distancia se multiplica por $0.8$ en cada paso, y en la empinada por $-0.4$ (cambia de lado: el zigzag). La mejor tasa fija sería $0.25$, con factor $0.75$. En el punto de partida, $(-1, 0)$, las dos pendientes son $-6.24$ y $7.80$: el gradiente $(-6.24,\\ 7.80)$ apunta arriba a la izquierda, cuesta arriba, y el camino sale hacia abajo a la derecha.

## Paisajes reales

Las curvas de la lección son de juguete: $L(w)=\\tfrac12(w-3)^2+1$, el cuenco de dos pesos con curvaturas 1 y 7, y $R(w)=0.08w^4-0.6w^2+0.25w+2$, con dos valles de errores mínimos 0.38 y 1.35. El error de una red real no es convexo: tiene mínimos locales, mesetas y puntos de silla (gradiente cero, pero baja en una dirección y sube en otra). En redes grandes se sospecha hoy que la mayoría de los mínimos locales tienen un error cercano al mejor y que las mesetas y los puntos de silla estorban más que los malos mínimos (Goodfellow et al., 2016, §8.2; Dauphin et al., 2014). El punto de partida importa: puede decidir si el entrenamiento converge, a qué costo y con qué capacidad de generalizar (Goodfellow et al., 2016, §8.4), y cambiar solo la semilla aleatoria puede dar resultados muy distintos, como al ajustar BERT (Dodge et al., 2020).

## En código

\`\`\`python
def descenso(pendiente, w0, eta, pasos):
    w = w0
    historial = [w]
    for _ in range(pasos):
        w = w - eta * pendiente(w)   # peso nuevo = peso actual − tasa × pendiente
        historial.append(w)
    return historial

# error L(w) = 0.5 * (w - 3)**2 + 1  ->  pendiente (derivada): w - 3
print(descenso(lambda w: w - 3, w0=-1.0, eta=0.5, pasos=5))
# [-1.0, 1.0, 2.0, 2.5, 2.75, 2.875]
\`\`\`

## Lo que viene

En modelos reales el gradiente se calcula sobre un subconjunto de los datos (descenso del gradiente estocástico; Bottou et al., 2018) y se usan optimizadores como Adam (Kingma y Ba, 2015); ambos aparecen en la lección 9. Así se entrenó GPT-3 (175 mil millones de pesos): con Adam, lotes de hasta 3.2 millones de tokens y, en el modelo grande, una tasa de aprendizaje de $6\\times 10^{-5}$ con calentamiento y caída gradual (Brown et al., 2020, tabla 2.1 y apéndice B). El cálculo eficiente de $\\nabla L$ en redes profundas es la retropropagación (lección 8).`,
    en: `## The slope and the derivative

To measure the slope of a curve $L(w)$ at a point, you move the weight by a small amount $\\varepsilon$ and divide the change in the error by that move:

$$\\frac{L(w+\\varepsilon)-L(w)}{\\varepsilon}$$

The **derivative** $L'(w)$ is the value that ratio approaches as $\\varepsilon$ gets smaller and smaller. That is why $L(w+\\varepsilon)\\approx L(w)+\\varepsilon\\,L'(w)$: the derivative says how to scale a small change in the weight to get the change in the error, and it is the slope of the tangent line at that point (Goodfellow et al., 2016, §4.3).

In the lesson, $L(w)=\\tfrac12(w-3)^2+1$, so $L'(w)=w-3$. At $w=-1$, with $\\varepsilon=0.1$ the error goes from 9 to 8.605 and the ratio is $-0.395/0.1=-3.95$; with $\\varepsilon=0.01$, $-3.995$; in the limit, $-4$. On this curve the ratio is exactly $(w-3)+\\varepsilon/2$. At weight 6 the derivative is $+3$, and at 3, the bottom, it is $0$.

A word on names: in lesson 3, the weight $w$ was the slope of the *model’s line*. Here the slope is a different one: that of the *error curve* with respect to the weight. And in practice nobody probes with an $\\varepsilon$: the derivative is computed with exact formulas and, in a deep network, with backpropagation (lesson 8).

## The update rule

With one weight, gradient descent repeats

$$w_{t+1} = w_t - \\eta\\,L'(w_t)$$

where $\\eta>0$ is the learning rate. Since $L(w-\\varepsilon\\,\\text{sign}(L'(w)))$ is less than $L(w)$ for small enough $\\varepsilon$, moving in small steps with the opposite sign of the derivative brings the error down (Goodfellow et al., 2016, §4.3). In the lesson, with $\\eta=0.5$: $-1 \\to 1 \\to 2 \\to 2.5 \\to 2.75 \\to \\dots$ The distance to the bottom halves at every step, and the steps (2, 1, 0.5, 0.25, …) shorten on their own because the slope flattens.

With many weights, $\\mathbf{w}=(w_1,\\dots,w_n)$, each **partial derivative** $\\partial L/\\partial w_i$ measures how the error changes when only $w_i$ increases, and the **gradient** is the vector that contains them all:

$$\\nabla L(\\mathbf{w}) = \\Big(\\frac{\\partial L}{\\partial w_1},\\dots,\\frac{\\partial L}{\\partial w_n}\\Big),\\qquad \\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta\\,\\nabla L(\\mathbf{w}_t)$$

The gradient points uphill because, among all directions of length 1, it is the one that makes $L$ grow fastest; that is why we subtract it (Goodfellow et al., 2016, §4.3).

The method is credited to Cauchy, who presented it at the 18 October 1847 session of the Paris Academy of Sciences to solve systems of equations: he replaced the system with a single equation, the sum of the squares set to zero, and made that function go down step by step. He set the step size by solving an equation in one variable or by taking a “sufficiently small” value (Cauchy, 1847; Lemaréchal, 2012).

## Why there is a threshold for the rate

For a one-variable quadratic error, $L(w)=\\tfrac{h}{2}(w-w^*)^2 + c$ with curvature $h>0$, the gradient is $h\\,(w-w^*)$ and the distance to the bottom is multiplied by a constant factor at each step:

$$w_{t+1}-w^* = (1-\\eta h)\\,(w_t-w^*)$$

- if $0<\\eta h<1$, the weight approaches the bottom without crossing it;
- if $\\eta h=1$, it reaches the bottom in one jump;
- if $1<\\eta h<2$, it crosses at every step but converges (it oscillates);
- if $\\eta h=2$, it bounces between two points at the same distance from the bottom, without getting closer;
- if $\\eta h>2$, the distance grows at every step: it diverges.

This is the classic analysis of LeCun et al. (1998, §5.1): the optimal one-variable rate is $1/h$, and it diverges if the rate exceeds twice the optimal one. In the lesson $h=1$. The four rates in the scene are a slow case (0.05: after 12 steps it is still 2.16 from the bottom, which was 4 away), one that oscillates (1.7: it crosses the bottom at every step but gets closer), one that diverges (2.05: each jump lands farther away and the error goes from 9 to 12.82 in 4 steps), and a good one (0.8: within 0.03 of the bottom in 3 steps). The interactive turn asks you to get within 0.08 of the bottom in ten steps or fewer without crossing it: rates from 0.33 to 1 do it.

A very small rate is not entirely harmless in a real network: besides being slow, it can leave training stuck at a high error, an effect that would not happen with a convex function and that is poorly understood (Goodfellow et al., 2016, §11.4.1).

## Several dimensions: conditioning

In several dimensions the curvature is the Hessian matrix $H$. For a quadratic, $\\mathbf{w}_{t+1}-\\mathbf{w}^*=(I-\\eta H)(\\mathbf{w}_t-\\mathbf{w}^*)$: along each eigendirection the distance is multiplied by $1-\\eta\\lambda_i$. Convergence needs $\\eta<2/\\lambda_{\\max}(H)$ (LeCun et al., 1998), but progress along the flattest direction depends on $\\lambda_{\\min}$. With a large condition number $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$, the error falls slowly and the path zigzags, as in the figure. With the best fixed rate ($\\eta = 2/(\\lambda_{\\max}+\\lambda_{\\min})$) the distance to the bottom shrinks by a factor of $(\\kappa-1)/(\\kappa+1)$ per step (Goh, 2017).

In the figure, $\\lambda_{\\min}=1$ and $\\lambda_{\\max}=7$ ($\\kappa=7$), and $\\eta=0.2$: along the flat direction the distance is multiplied by $0.8$ at every step, and along the steep one by $-0.4$ (it switches sides: the zigzag). The best fixed rate would be $0.25$, with factor $0.75$. At the starting point, $(-1, 0)$, the two slopes are $-6.24$ and $7.80$: the gradient $(-6.24,\\ 7.80)$ points up and to the left, uphill, and the path heads down and to the right.

## Real landscapes

The curves in the lesson are toys: $L(w)=\\tfrac12(w-3)^2+1$, the two-weight bowl with curvatures 1 and 7, and $R(w)=0.08w^4-0.6w^2+0.25w+2$, with two valleys whose minimum errors are 0.38 and 1.35. The error of a real network is not convex: it has local minima, plateaus, and saddle points (zero gradient, but it goes down in one direction and up in another). In large networks it is now suspected that most local minima have an error close to the best one, and that plateaus and saddle points get in the way more than bad minima do (Goodfellow et al., 2016, §8.2; Dauphin et al., 2014). The starting point matters: it can decide whether training converges, at what cost, and with what ability to generalize (Goodfellow et al., 2016, §8.4), and changing only the random seed can give very different results, as when fine-tuning BERT (Dodge et al., 2020).

## In code

\`\`\`python
def descent(slope, w0, eta, steps):
    w = w0
    history = [w]
    for _ in range(steps):
        w = w - eta * slope(w)   # new weight = current weight − rate × slope
        history.append(w)
    return history

# error L(w) = 0.5 * (w - 3)**2 + 1  ->  slope (derivative): w - 3
print(descent(lambda w: w - 3, w0=-1.0, eta=0.5, steps=5))
# [-1.0, 1.0, 2.0, 2.5, 2.75, 2.875]
\`\`\`

## What comes next

In real models the gradient is computed on a subset of the data (stochastic gradient descent; Bottou et al., 2018) and optimizers such as Adam are used (Kingma and Ba, 2015); both appear in lesson 9. This is how GPT-3 (175 billion weights) was trained: with Adam, batches of up to 3.2 million tokens and, for the large model, a learning rate of $6\\times 10^{-5}$ with warm-up and gradual decay (Brown et al., 2020, table 2.1 and appendix B). The efficient computation of $\\nabla L$ in deep networks is backpropagation (lesson 8).`,
  },

  lens: {
    es: [
      'Entrenar es optimización iterativa: el cómputo crece con el número de pasos, el tamaño del modelo y el tamaño del lote. Cada paso adicional es dinero en cómputo.',
      'Si un equipo dice que «el entrenamiento no converge», la primera pregunta es por la tasa de aprendizaje (quizá el hiperparámetro más importante) y por los datos, no por «más GPUs».',
      'El resultado depende del punto de partida y de decisiones de entrenamiento: dos corridas con la misma receta pueden dar modelos distintos. Pide que se reporte esa variabilidad.',
      'No hay garantía de haber llegado al mejor punto posible: «suficientemente bueno» se comprueba con datos que el modelo no vio (lección 10).',
    ],
    en: [
      'Training is iterative optimization: compute grows with the number of steps, the size of the model, and the batch size. Every extra step is compute money.',
      'If a team says “training does not converge,” the first question is about the learning rate (perhaps the most important hyperparameter) and the data, not about “more GPUs.”',
      'The outcome depends on the starting point and on training decisions: two runs with the same recipe can yield different models. Ask for that variability to be reported.',
      'There is no guarantee of having reached the best possible point: “good enough” is checked with data the model has not seen (lesson 10).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En el peso actual, la pendiente del error es negativa. ¿Qué hace el descenso del gradiente con el peso?', en: 'At the current weight, the slope of the error is negative. What does gradient descent do with the weight?' },
      options: [
        { es: 'Lo baja, porque la pendiente es negativa.', en: 'It lowers it, because the slope is negative.' },
        { es: 'Lo deja igual hasta que la pendiente sea cero.', en: 'It leaves it alone until the slope is zero.' },
        { es: 'Lo sube: el error baja hacia la derecha.', en: 'It raises it: the error goes down to the right.' },
        { es: 'Depende solo de la tasa de aprendizaje.', en: 'It depends only on the learning rate.' },
      ],
      answer: 2,
      why: { es: 'Pendiente negativa significa que el error baja al mover el peso hacia la derecha. La regla resta η × pendiente; restar un número negativo es sumar, así que el peso sube.', en: 'A negative slope means the error goes down when the weight moves to the right. The rule subtracts η × slope; subtracting a negative number means adding, so the weight goes up.' },
    },
    {
      kind: 'concept',
      q: { es: 'En un modelo con muchos pesos, ¿qué es el gradiente?', en: 'In a model with many weights, what is the gradient?' },
      options: [
        { es: 'La lista de las pendientes del error, una por peso; apunta hacia donde el error más sube.', en: 'The list of the slopes of the error, one per weight; it points to where the error rises fastest.' },
        { es: 'El valor actual del error.', en: 'The current value of the error.' },
        { es: 'El tamaño del paso que da cada peso.', en: 'The size of the step each weight takes.' },
        { es: 'La cantidad de pesos del modelo.', en: 'The number of weights in the model.' },
      ],
      answer: 0,
      why: { es: 'El gradiente reúne una pendiente (una derivada parcial) por cada peso. Apunta cuesta arriba; por eso el descenso del gradiente avanza en sentido contrario, restando.', en: 'The gradient gathers one slope (a partial derivative) for each weight. It points uphill; that is why gradient descent moves the opposite way, by subtracting.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un peso vale 2, la pendiente del error ahí es +4 y la tasa de aprendizaje es 0.1. ¿Cuánto vale el peso después de un paso?', en: 'A weight is 2, the slope of the error there is +4, and the learning rate is 0.1. What is the weight after one step?' },
      options: [
        { es: '2.4', en: '2.4' },
        { es: '1.6', en: '1.6' },
        { es: '0.4', en: '0.4' },
        { es: '1.9', en: '1.9' },
      ],
      answer: 1,
      why: { es: 'Peso nuevo = 2 − 0.1 × 4 = 1.6. La pendiente es positiva (el error sube hacia la derecha), así que el peso retrocede. Sumar en lugar de restar daría 2.4.', en: 'New weight = 2 − 0.1 × 4 = 1.6. The slope is positive (the error rises to the right), so the weight moves back. Adding instead of subtracting would give 2.4.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo informa que durante el entrenamiento el error sube y baja sin estabilizarse. ¿Cuál es la primera hipótesis razonable?', en: 'A team reports that during training the error goes up and down without settling. What is the first reasonable hypothesis?' },
      options: [
        { es: 'Faltan GPUs.', en: 'There are not enough GPUs.' },
        { es: 'El modelo es demasiado pequeño.', en: 'The model is too small.' },
        { es: 'Los datos están demasiado limpios.', en: 'The data is too clean.' },
        { es: 'La tasa de aprendizaje es demasiado alta.', en: 'The learning rate is too high.' },
      ],
      answer: 3,
      why: { es: 'Rebotar de un lado a otro es el síntoma clásico de pasos demasiado grandes. Más cómputo no lo arregla; bajar la tasa de aprendizaje, sí.', en: 'Bouncing back and forth is the classic symptom of steps that are too large. More compute does not fix it; lowering the learning rate does.' },
    },
  ],

  glossary: ['gradient-descent', 'gradient', 'derivative', 'learning-rate', 'weight', 'loss', 'model', 'parameter'],

  terms: [
    { id: 'gradient-descent', term: { es: 'Descenso del gradiente', en: 'Gradient descent' }, def: { es: 'Método que ajusta los pesos paso a paso, siempre en contra de la pendiente del error (el gradiente), hasta llegar a un fondo.', en: 'A method that adjusts the weights step by step, always against the slope of the error (the gradient), until it reaches a bottom.' } },
    { id: 'gradient', term: { es: 'Gradiente', en: 'Gradient' }, def: { es: 'La lista de las pendientes del error, una por cada peso. Vista como flecha, apunta hacia donde el error sube más rápido.', en: 'The list of the slopes of the error, one for each weight. Seen as an arrow, it points to where the error rises fastest.' } },
    { id: 'derivative', term: { es: 'Derivada', en: 'Derivative' }, def: { es: 'El nombre matemático de la pendiente de una curva en un punto: cuánto cambia una cantidad por cada pequeño cambio de otra.', en: 'The mathematical name for the slope of a curve at a point: how much one quantity changes for each small change in another.' } },
    { id: 'learning-rate', term: { es: 'Tasa de aprendizaje', en: 'Learning rate' }, def: { es: 'Número (η) que multiplica la pendiente y fija el tamaño de cada paso. Muy pequeño es lento; muy grande rebota o diverge.', en: 'A number (η) that multiplies the slope and sets the size of each step. Too small is slow; too large bounces or diverges.' } },
  ],

  sources: [
    { title: 'Méthode générale pour la résolution des systèmes d’équations simultanées (Comptes rendus de l’Académie des sciences, t. 25, pp. 536–538; sesión del 18 de octubre de 1847)', authors: 'Cauchy, A.', year: 1847, url: 'https://archive.org/details/comptes-rendus-hebdomadaires-academie-des-sciences_1847-10-18_25_16' },
    { title: 'Cauchy and the gradient method (Documenta Mathematica, Extra Volume ISMP, pp. 251–254)', authors: 'Lemaréchal, C.', year: 2012, url: 'https://doi.org/10.4171/DMS/6/27' },
    { title: 'Efficient BackProp (Neural Networks: Tricks of the Trade, LNCS 1524, pp. 9–50; §5.1: convergencia del descenso del gradiente)', authors: 'LeCun, Y., Bottou, L., Orr, G. B., Müller, K.-R.', year: 1998, url: 'http://yann.lecun.com/exdb/publis/pdf/lecun-98b.pdf' },
    { title: 'Why Momentum Really Works (Distill 2(4); mejor tasa fija y factor (κ−1)/(κ+1) en una cuadrática)', authors: 'Goh, G.', year: 2017, url: 'https://distill.pub/2017/momentum/' },
    { title: 'Deep Learning, capítulo 4: Numerical Computation (§4.3: la derivada como pendiente, el gradiente y el descenso del gradiente)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/numerical.html' },
    { title: 'Deep Learning, capítulo 8: Optimization for Training Deep Models (§8.2: mínimos locales, mesetas y puntos de silla; §8.4: inicialización)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/optimization.html' },
    { title: 'Deep Learning, capítulo 11: Practical Methodology (§11.4.1: la tasa de aprendizaje)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/guidelines.html' },
    { title: 'Identifying and attacking the saddle point problem in high-dimensional non-convex optimization', authors: 'Dauphin, Y., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1406.2572' },
    { title: 'Fine-Tuning Pretrained Language Models: Weight Initializations, Data Orders, and Early Stopping', authors: 'Dodge, J., Ilharco, G., Schwartz, R., Farhadi, A., Hajishirzi, H., Smith, N.', year: 2020, url: 'https://arxiv.org/abs/2002.06305' },
    { title: 'Optimization Methods for Large-Scale Machine Learning', authors: 'Bottou, L., Curtis, F. E., Nocedal, J.', year: 2018, url: 'https://doi.org/10.1137/16M1080173' },
    { title: 'Adam: A Method for Stochastic Optimization', authors: 'Kingma, D. P., Ba, J.', year: 2015, url: 'https://arxiv.org/abs/1412.6980' },
    { title: 'Language Models are Few-Shot Learners (GPT-3: 175 mil millones de parámetros; tabla 2.1 y apéndice B)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'The Llama 3 Herd of Models (el mayor, de 405 mil millones de parámetros)', authors: 'Grattafiori, A., et al. (Llama Team, Meta)', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Scaling Laws for Neural Language Models (el cómputo de entrenamiento ≈ 6·N·B·S)', authors: 'Kaplan, J., McCandlish, S., Henighan, T., et al.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
  ],
});
