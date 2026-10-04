import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'siguiente-palabra',

  objectives: {
    es: [
      'Explicar cómo un modelo de lenguaje escribe: calcula una probabilidad para cada palabra posible, elige una y repite.',
      'Predecir cómo cambian las probabilidades con la temperatura y con top-p, y calcular un softmax con temperatura.',
      'Responder con honestidad a «¿cómo escribe un ensayo algo que solo predice?», incluido lo que esa respuesta no garantiza.',
    ],
    en: [
      'Explain how a language model writes: it computes a probability for every possible word, picks one, and repeats.',
      'Predict how probabilities change with temperature and top-p, and compute a softmax with temperature.',
      'Answer honestly “how can something that only predicts write an essay?”, including what that answer does not guarantee.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Cuando escribes en el teléfono, el teclado te propone la siguiente palabra. Un modelo de lenguaje hace eso mismo, pero en grande: dado un texto, adivina lo que sigue.',
      en: 'When you type on your phone, the keyboard suggests the next word. A language model does the same thing at scale: given some text, it guesses what comes next.',
    },
    {
      id: 'bars',
      es: 'Pero no propone una sola palabra: asigna una probabilidad a cada palabra posible, y todas suman cien por ciento. Aquí, tras «don», «Quijote» recibe más del ochenta por ciento.',
      en: 'But it does not offer a single word: it assigns a probability to every possible word, and they all add up to one hundred percent. Here, after “poor,” “Alice” gets almost two thirds.',
      note: { es: 'Modelo de lenguaje: asigna una probabilidad a cada palabra que puede seguir.', en: 'Language model: it gives every possible next word a probability.' },
    },
    {
      id: 'source',
      es: '¿De dónde salen esos números? De leer. Este modelo, diminuto, leyó unas seis mil palabras de Cervantes, de dominio público, y se limitó a contar.',
      en: 'Where do those numbers come from? From reading. This tiny model read about six thousand words by Lewis Carroll, in the public domain, and simply counted.',
    },
    {
      id: 'count',
      es: 'Cada vez que aparece «don», anotamos qué palabra viene después. En treinta y ocho apariciones, treinta y una veces fue «Quijote»; tres, «que»; dos, «y».',
      en: 'Every time “poor” appears, we note the word that follows. In eleven appearances, “Alice” came seven times, “little” twice, and two other words once each.',
      pad: 0.4,
    },
    {
      id: 'divide',
      es: 'Dividimos cada cuenta entre el total: treinta y uno entre treinta y ocho, casi ochenta y dos por ciento. Es un modelo de n-gramas: la palabra anterior predice la siguiente.',
      en: 'Divide each count by the total: seven out of eleven, about sixty-four percent. This is an n-gram model: the previous word predicts the next one.',
      tts: {
        es: 'Dividimos cada cuenta entre el total: treinta y uno entre treinta y ocho, casi ochenta y dos por ciento. Es un modelo de ene gramas: la palabra anterior predice la siguiente.',
        en: 'Divide each count by the total: seven out of eleven, about sixty-four percent. This is an en-gram model: the previous word predicts the next one.',
      },
      note: { es: 'Probabilidad = cuenta ÷ total.', en: 'Probability = count ÷ total.' },
    },
    {
      id: 'pick',
      es: 'Para escribir, el modelo elige una palabra de esa distribución y la agrega al texto. Esta vez salió «Quijote».',
      en: 'To write, the model picks a word from that distribution and adds it to the text. This time it picked “Alice.”',
      pad: 0.3,
    },
    {
      id: 'autoreg',
      es: 'Y aquí está la clave: esa palabra pasa a ser contexto. El modelo recalcula, elige otra y repite. Se llama autorregresión: cada salida se convierte en la siguiente entrada.',
      en: 'And here is the key: that word becomes context. The model recalculates, picks another, and repeats. This is autoregression: every output becomes the next input.',
      note: { es: 'Autorregresión: cada palabra generada se vuelve contexto.', en: 'Autoregression: every generated word becomes context.' },
    },
    {
      id: 'run',
      es: 'Veamos el bucle en marcha. En cada vuelta cambian el contexto y las probabilidades, y por eso el texto avanza, palabra por palabra.',
      en: 'Let us watch the loop run. On every turn the context and the probabilities change, which is why the text moves forward, word by word.',
      pad: 1.0,
    },
    {
      id: 'greedy',
      es: 'Una forma de elegir es la voraz: siempre la palabra más probable. Es predecible, y mira qué pasa: cae en un ciclo y repite «y, y, y» sin parar.',
      en: 'One way to choose is greedy: always the most probable word. It is predictable, and look what happens: it falls into a loop and repeats the same phrase forever.',
      pad: 1.0,
    },
    {
      id: 'random',
      es: 'La otra forma es sortear: elegir al azar, pero con las probabilidades como pesos. «Quijote» saldrá casi siempre, pero no siempre, y cada corrida da un texto distinto.',
      en: 'The other way is to sample: pick at random, using the probabilities as weights. A likely word usually wins, but not always, and every run gives a different text.',
      pad: 0.5,
    },
    {
      id: 'try1',
      es: 'Tu turno: genera varios textos desde «don», tres en modo aleatorio y uno en modo voraz, y compara cuáles se repiten.',
      en: 'Your turn: generate several texts starting from “poor,” three in random mode and one in greedy mode, and compare which ones repeat.',
      gate: {
        id: 'gen',
        prompt: { es: 'Genera tres textos en modo aleatorio y uno en modo voraz.', en: 'Generate three texts in random mode and one in greedy mode.' },
      },
      pad: 0.4,
    },
    {
      id: 'scores',
      es: 'Tomemos un contexto con más candidatas: «aquel». Los modelos reales no calculan probabilidades de golpe: producen una puntuación por palabra. Aquí será el logaritmo natural de la cuenta.',
      en: 'Let us take a context with more candidates: “when.” Real models do not compute probabilities directly: they produce a score for every word. Here the score will be the natural logarithm of the count.',
    },
    {
      id: 'softmax',
      es: 'Para volver a probabilidades se usa softmax: se eleva e a cada puntuación y se divide entre la suma. Con estas puntuaciones, da justo cuenta entre total.',
      en: 'To turn scores back into probabilities we use softmax: raise e to each score and divide by the sum. With these scores it gives exactly count over total.',
      note: { es: 'Softmax: puntuaciones → probabilidades que suman uno.', en: 'Softmax: scores → probabilities that add up to one.' },
    },
    {
      id: 'temp',
      es: 'Ahora, una perilla: la temperatura T. Antes de aplicar softmax, cada puntuación se divide entre T. Con T igual a uno no cambia nada.',
      en: 'Now, a dial: the temperature T. Before applying softmax, every score is divided by T. With T equal to one, nothing changes.',
      tts: {
        es: 'Ahora, una perilla: la temperatura te. Antes de aplicar softmax, cada puntuación se divide entre te. Con te igual a uno no cambia nada.',
        en: 'Now, a dial: the temperature tee. Before applying softmax, every score is divided by tee. With tee equal to one, nothing changes.',
      },
      note: { es: 'Temperatura T: divide las puntuaciones; baja = favorita, alta = azar.', en: 'Temperature T: divides the scores; low = favorite, high = chance.' },
    },
    {
      id: 'cold',
      es: 'Con T baja las diferencias se amplifican y la favorita se lleva casi todo. Con T tendiendo a cero, es la elección voraz.',
      en: 'With a low T the differences are amplified and the favorite takes almost everything. As T approaches zero, it becomes the greedy choice.',
      tts: {
        es: 'Con te baja las diferencias se amplifican y la favorita se lleva casi todo. Con te tendiendo a cero, es la elección voraz.',
        en: 'With a low tee the differences are amplified and the favorite takes almost everything. As tee approaches zero, it becomes the greedy choice.',
      },
      pad: 0.5,
    },
    {
      id: 'hot',
      es: 'Con T alta pasa lo contrario: las diferencias se borran y las palabras raras ganan terreno. Con T enorme, todas serían igual de probables: puro azar.',
      en: 'With a high T the opposite happens: differences fade and rare words gain ground. With a huge T, every word would be equally likely: pure chance.',
      tts: {
        es: 'Con te alta pasa lo contrario: las diferencias se borran y las palabras raras ganan terreno. Con te enorme, todas serían igual de probables: puro azar.',
        en: 'With a high tee the opposite happens: differences fade and rare words gain ground. With a huge tee, every word would be equally likely: pure chance.',
      },
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: mueve la temperatura. Busca una T con la que la favorita pase del noventa por ciento y otra con la que ninguna llegue al veinte.',
      en: 'Your turn: move the temperature. Find a T that pushes the favorite above ninety percent, and another where no word reaches twenty.',
      tts: {
        es: 'Tu turno: mueve la temperatura. Busca una te con la que la favorita pase del noventa por ciento y otra con la que ninguna llegue al veinte.',
        en: 'Your turn: move the temperature. Find a tee that pushes the favorite above ninety percent, and another where no word reaches twenty.',
      },
      gate: {
        id: 'temp',
        prompt: {
          es: 'Encuentra una T con la que la favorita supere el 90 % y otra con la que ninguna llegue al 20 %.',
          en: 'Find a T where the favorite tops 90% and another where no word reaches 20%.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'samples',
      es: 'Mira el efecto en el texto: con T baja repite lo seguro; con T media conserva el vocabulario del original, aunque sin mucho sentido; con T alta, pura sopa de palabras.',
      en: 'See the effect on the text: a low T repeats the safe choices; a middle T keeps the vocabulary of the original, though it makes little sense; a high T is pure word soup.',
      tts: {
        es: 'Mira el efecto en el texto: con te baja repite lo seguro; con te media conserva el vocabulario del original, aunque sin mucho sentido; con te alta, pura sopa de palabras.',
        en: 'See the effect on the text: a low tee repeats the safe choices; a middle tee keeps the vocabulary of the original, though it makes little sense; a high tee is pure word soup.',
      },
      pad: 0.8,
    },
    {
      id: 'tail',
      es: 'Hay otro problema. En un contexto como «de», casi cualquier palabra puede seguir, y las palabras raras, sumadas, pesan más de la mitad.',
      en: 'There is another problem. In a context like “the,” almost any word can follow, and the rare words, added up, weigh more than half.',
      pad: 0.4,
    },
    {
      id: 'topk',
      es: 'Una solución es top-k: conservar solo las k palabras más probables, descartar el resto y repartir de nuevo la probabilidad entre las que quedan.',
      en: 'One fix is top-k: keep only the k most probable words, discard the rest, and redistribute the probability among those that remain.',
      tts: {
        es: 'Una solución es top ka: conservar solo las ka palabras más probables, descartar el resto y repartir de nuevo la probabilidad entre las que quedan.',
        en: 'One fix is top K: keep only the K most probable words, discard the rest, and redistribute the probability among those that remain.',
      },
      pad: 0.4,
    },
    {
      id: 'topp',
      es: 'Otra es top-p: conservar las palabras más probables hasta sumar p, por ejemplo noventa por ciento. El grupo se adapta: pocas palabras si hay favorita, muchas si no.',
      en: 'Another is top-p: keep the most probable words until they add up to p, say ninety percent. The group adapts: few words when there is a clear favorite, many when there is not.',
      tts: {
        es: 'Otra es top pe: conservar las palabras más probables hasta sumar pe, por ejemplo noventa por ciento. El grupo se adapta: pocas palabras si hay favorita, muchas si no.',
        en: 'Another is top P: keep the most probable words until they add up to P, say ninety percent. The group adapts: few words when there is a clear favorite, many when there is not.',
      },
      note: { es: 'Top-p: sortear solo entre las más probables que suman p.', en: 'Top-p: sample only among the most probable words that add up to p.' },
      pad: 0.5,
    },
    {
      id: 'try3',
      es: 'Tu turno: mueve p y cambia de contexto. Compara cuántas palabras entran en el grupo cuando hay una favorita y cuando no.',
      en: 'Your turn: move p and switch context. Compare how many words make the cut when there is a clear favorite and when there is not.',
      tts: {
        es: 'Tu turno: mueve pe y cambia de contexto. Compara cuántas palabras entran en el grupo cuando hay una favorita y cuando no.',
        en: 'Your turn: move P and switch context. Compare how many words make the cut when there is a clear favorite and when there is not.',
      },
      gate: {
        id: 'topp',
        prompt: { es: 'Mueve p y revisa los tres contextos.', en: 'Move p and check all three contexts.' },
      },
      pad: 0.4,
    },
    {
      id: 'context2',
      es: 'Con más contexto, mejor texto: un modelo de trigramas mira las dos palabras anteriores en lugar de una, y sus frases se sostienen durante más tiempo.',
      en: 'More context, better text: a trigram model looks at the two previous words instead of one, and its sentences hold together for longer.',
      pad: 0.6,
    },
    {
      id: 'memorize',
      es: 'Pero hay trampa: con dos palabras de contexto, en la gran mayoría de los casos solo hay una continuación posible. El modelo ya no compone: recita lo que leyó.',
      en: 'But there is a catch: with two words of context, in the vast majority of cases only one continuation exists. The model is no longer composing: it recites what it read.',
      pad: 0.4,
    },
    {
      id: 'unseen',
      es: 'Y si el contexto nunca apareció, no sabe qué decir. Tampoco sabe que «yegua» se parece a «rocín»: para la tabla, cada palabra es un símbolo aislado.',
      en: 'And if a context never appeared, it has nothing to say. It also cannot know that “hare” is close to “rabbit”: to the table, every word is an isolated symbol.',
      pad: 0.4,
    },
    {
      id: 'neural',
      es: 'Un modelo neuronal cambia la tabla por una red. Recibe los embeddings del contexto, calcula una puntuación por palabra y softmax las vuelve probabilidades. Palabras parecidas dan puntuaciones parecidas.',
      en: 'A neural model swaps the table for a network. It takes the embeddings of the context, computes a score for every word, and softmax turns them into probabilities. Similar words get similar scores.',
      pad: 0.6,
    },
    {
      id: 'essay1',
      es: '¿Cómo escribe un ensayo algo que solo predice? Primero: predecir bien exige mucho. Completar «la capital de Francia es» pide un dato; una deducción, lógica; una carta, estilo.',
      en: 'How does something that only predicts write an essay? First: predicting well demands a lot. Completing “the capital of France is” takes a fact; a deduction, logic; a letter, style.',
      pad: 0.6,
    },
    {
      id: 'essay2',
      es: 'Segundo: cada palabra se predice mirando todo el texto anterior que cabe en la ventana, incluidas las palabras del propio modelo. Un ensayo de mil palabras son mil vueltas del mismo bucle.',
      en: 'Second: every word is predicted by looking at all the earlier text that fits in the window, including the model’s own words. A thousand-word essay is a thousand turns of the same loop.',
      pad: 0.6,
    },
    {
      id: 'honest',
      es: 'La advertencia: el objetivo es predecir lo plausible, no lo verdadero. Un modelo puede sonar convincente y equivocarse. Hasta nuestra tabla imita el estilo sin comprobar nada.',
      en: 'The warning: the goal is to predict what is plausible, not what is true. A model can sound convincing and be wrong. Even our table imitates the style without checking anything.',
      note: { es: 'Predice lo plausible, no lo verdadero.', en: 'It predicts the plausible, not the true.' },
      pad: 0.4,
    },
    {
      id: 'scale',
      es: 'La receta se mantiene al crecer. De dos mil dieciocho a dos mil veinte, GPT-1 tenía ciento diecisiete millones de parámetros; GPT-2, mil quinientos millones; GPT-3, ciento setenta y cinco mil millones.',
      en: 'The recipe holds as models grow. From 2018 to 2020, GPT-1 had one hundred seventeen million parameters; GPT-2, one and a half billion; GPT-3, one hundred seventy-five billion.',
      tts: {
        es: 'La receta se mantiene al crecer. De dos mil dieciocho a dos mil veinte, ge pe te uno tenía ciento diecisiete millones de parámetros; ge pe te dos, mil quinientos millones; ge pe te tres, ciento setenta y cinco mil millones.',
        en: 'The recipe holds as models grow. From twenty eighteen to twenty twenty, G P T one had one hundred seventeen million parameters; G P T two, one and a half billion; G P T three, one hundred seventy-five billion.',
      },
      pad: 0.8,
    },
    {
      id: 'trained',
      es: 'Y esos números no se cuentan: se entrenan. La red ajusta sus parámetros, con el descenso del gradiente de la lección cuatro, para subir la probabilidad de la palabra correcta.',
      en: 'And those numbers are not counted: they are trained. The network adjusts its parameters, with the gradient descent from lesson four, to raise the probability of the correct word.',
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: texto, probabilidades, elegir, agregar, repetir. La temperatura y top-p solo cambian cómo se elige; lo que el modelo sabe vive en las probabilidades.',
      en: 'In short: text, probabilities, choose, append, repeat. Temperature and top-p only change how we choose; what the model knows lives in the probabilities.',
      tts: {
        es: 'En resumen: texto, probabilidades, elegir, agregar, repetir. La temperatura y top pe solo cambian cómo se elige; lo que el modelo sabe vive en las probabilidades.',
        en: 'In short: text, probabilities, choose, append, repeat. Temperature and top P only change how we choose; what the model knows lives in the probabilities.',
      },
      note: { es: 'El bucle: contexto, probabilidades, elegir, agregar.', en: 'The loop: context, probabilities, choose, append.' },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Hasta aquí dijimos «palabras», pero fue una simplificación. Un modelo real no lee palabras completas, sino piezas más pequeñas. ¿Cuáles? Los tokens.',
      en: 'So far we said “words,” but that was a simplification. A real model does not read whole words, but smaller pieces. Which ones? Tokens.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo de lenguaje asigna una probabilidad a cada posible siguiente pieza de texto, dado el texto anterior.',
      'Escribe en bucle: elige una pieza de esa distribución, la agrega al contexto y vuelve a calcular. Eso es autorregresión.',
      'Softmax convierte puntuaciones en probabilidades. La temperatura divide las puntuaciones antes: baja afila (tiende a lo voraz), alta aplana (tiende al azar).',
      'Top-k y top-p recortan la cola de palabras raras antes de sortear; top-p adapta el tamaño del grupo a cada contexto.',
      'Predecir bien exige capturar mucho, pero el objetivo es lo plausible, no lo verdadero. De GPT-1 a GPT-3 el objetivo es el mismo; cambia la escala.',
    ],
    en: [
      'A language model assigns a probability to every possible next piece of text, given the text before it.',
      'It writes in a loop: pick a piece from that distribution, append it to the context, and compute again. That is autoregression.',
      'Softmax turns scores into probabilities. Temperature divides the scores first: low sharpens (toward greedy), high flattens (toward chance).',
      'Top-k and top-p cut the tail of rare words before sampling; top-p adapts the size of the group to each context.',
      'Predicting well demands capturing a lot, but the goal is the plausible, not the true. From GPT-1 to GPT-3 the objective is the same; only the scale changes.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Como solo predice la siguiente palabra, un modelo de lenguaje es un autocompletar glorificado que repite frases que ya vio.',
      en: 'Since it only predicts the next word, a language model is a glorified autocomplete that repeats phrases it has already seen.',
    },
    right: {
      es: 'El objetivo es simple, pero acertar exige capturar gramática, hechos y patrones de razonamiento, y el modelo calcula una distribución nueva para cada contexto en lugar de buscar una frase guardada. Eso sí: optimiza lo plausible, no lo verdadero.',
      en: 'The objective is simple, but getting it right demands capturing grammar, facts, and patterns of reasoning, and the model computes a fresh distribution for every context instead of looking up a stored phrase. It does optimize for the plausible, though, not the true.',
    },
  },

  deeper: {
    es: `## El objetivo: predecir la siguiente pieza

Un texto $x_1,\\dots,x_n$ se puede descomponer, por la regla de la cadena, en un producto de predicciones de la siguiente pieza:

$$P(x_1,\\dots,x_n)=\\prod_{t=1}^{n}P(x_t\\mid x_1,\\dots,x_{t-1})$$

Un modelo de lenguaje es cualquier modelo de $P(x_t\\mid x_{<t})$. Se entrena maximizando $\\sum_t \\ln P_\\theta(x_t\\mid x_{t-k},\\dots,x_{t-1})$ sobre un corpus; es el «objetivo estándar de modelado de lenguaje» de GPT-1 (ecuación 1 del artículo), donde $k$ es el tamaño de la ventana de contexto. Equivale a minimizar la pérdida de entropía cruzada $L=-\\tfrac1n\\sum_t \\ln p_\\theta(x_t\\mid x_{<t})$: el $-\\ln$ de la probabilidad que el modelo dio a la pieza correcta (la curva de la lección). Generar es el recorrido inverso: $x_t\\sim P(\\cdot\\mid x_{<t})$, una pieza a la vez (autorregresión).

## Contar: el modelo de n-gramas

Con ventana de $n-1$ piezas, la estimación por máxima verosimilitud es la frecuencia relativa:

$$P(w\\mid c)=\\frac{N(c,w)}{N(c)}$$

donde $N(c,w)$ cuenta cuántas veces $w$ siguió al contexto $c$. En la lección, «don» apareció $N(c)=38$ veces y $N(\\text{don},\\text{Quijote})=31$, así que $P=31/38\\approx0.816$. Shannon (1948) ya construía texto así a mano: su «aproximación de segundo orden por palabras» elige cada palabra según las frecuencias de transición desde la anterior. El límite es la dispersión: con un vocabulario $V$ hay hasta $V^{\\,n-1}$ contextos y casi todos son raros o nunca se vieron; la tabla no generaliza.

## Softmax y temperatura

Un modelo neuronal produce una puntuación $z_i$ (*logit*) por cada pieza $i$ del vocabulario. La probabilidad es

$$p_i=\\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$$

con $T=1$ es el softmax normal (en GPT-1: $P(u)=\\operatorname{softmax}(h_nW_e^\\top)$). Si $T\\to0$ toda la masa va a la pieza de mayor puntuación (voraz); si $T\\to\\infty$ la distribución tiende a la uniforme. Con $z_i=\\ln c_i$ (la puntuación de la lección) queda una forma cerrada: $p_i=c_i^{1/T}/\\sum_j c_j^{1/T}$. Por ejemplo, en «aquel» las cuentas son $5,2,2,2,1,1,1,1,1$ (suman 16): con $T=1$ la favorita vale $5/16=0.31$; con $T=0.5$ vale $25/42\\approx0.60$; con $T=0.25$ vale $625/678\\approx0.92$. La temperatura fue tomada de la física estadística y aparece con este papel en la destilación de conocimiento (Hinton et al., 2015).

## Top-k y top-p

Tras el softmax se puede recortar. **Top-k** (Fan et al., 2018) conserva las $k$ piezas más probables. **Top-p** o muestreo por núcleo (Holtzman et al., 2020) conserva el menor conjunto $V_p$ cuya masa suma al menos $p$:

$$V_p=\\arg\\min_{S}\\;|S|\\quad\\text{con}\\quad\\sum_{i\\in S}p_i\\ge p$$

Luego se renormaliza, $q_i=p_i/\\sum_{j\\in V_p}p_j$, y se sortea con $q$. Holtzman et al. observaron que maximizar la verosimilitud al generar produce texto «soso y extrañamente repetitivo» (el ciclo voraz de la lección) y que recortar la cola, sin llegar a lo voraz, da texto más parecido al humano.

## En código

Un modelo de bigramas, softmax con temperatura, top-p y generación voraz, con la salida que imprime:

\`\`\`python
import math
from collections import Counter, defaultdict

texto = "el gato come pescado . el gato bebe leche . el perro come carne ."
piezas = texto.split()

# 1. Contar: qué pieza sigue a cada pieza (un modelo de bigramas)
tabla = defaultdict(Counter)
for a, b in zip(piezas, piezas[1:]):
    tabla[a][b] += 1

def distribucion(contexto, T=1.0, top_p=1.0):
    cuentas = tabla[contexto]
    z = {w: math.log(c) / T for w, c in cuentas.items()}   # puntuación z = ln(cuenta), dividida entre T
    m = max(z.values())
    e = {w: math.exp(v - m) for w, v in z.items()}         # softmax (restando el máximo por estabilidad)
    s = sum(e.values())
    p = sorted(((w, v / s) for w, v in e.items()), key=lambda x: -x[1])
    nucleo, acum = [], 0.0                                  # top-p: el grupo más pequeño que suma al menos top_p
    for w, q in p:
        nucleo.append((w, q)); acum += q
        if acum >= top_p - 1e-9: break
    total = sum(q for _, q in nucleo)
    return [(w, q / total) for w, q in nucleo]              # renormalizar

print(dict(tabla["el"]))
for T in (1.0, 0.5, 2.0):
    print(T, [(w, round(q, 3)) for w, q in distribucion("el", T)])
print(distribucion("el", top_p=0.6))   # el núcleo ya es una sola palabra

# 2. Generar: elegir siempre la más probable (voraz) y repetir
texto_gen = ["el"]
for _ in range(9):
    texto_gen.append(tabla[texto_gen[-1]].most_common(1)[0][0])
print(" ".join(texto_gen))
# {'gato': 2, 'perro': 1}
# 1.0 [('gato', 0.667), ('perro', 0.333)]
# 0.5 [('gato', 0.8), ('perro', 0.2)]
# 2.0 [('gato', 0.586), ('perro', 0.414)]
# [('gato', 1.0)]
# el gato come pescado . el gato come pescado .
\`\`\`

El corpus de la escena es el mismo método sobre unas seis mil palabras de dominio público (los tres primeros capítulos de *Don Quijote*); el script que lo reconstruye y el modelo están en la carpeta de la lección.

## Lo que viene

Hablamos de «palabras», pero el modelo real trabaja con piezas más pequeñas: los tokens (lección 20). En lugar de una tabla, la probabilidad la calcula una red que mira todo el contexto con atención (lecciones 21 y 22). La idea de reemplazar la tabla por una red que aprende representaciones de las palabras viene de Bengio et al. (2003). Qué significa entrenarla con casi todo internet se ve en la lección 23.`,
    en: `## The objective: predict the next piece

By the chain rule, a text $x_1,\\dots,x_n$ factors into a product of next-piece predictions:

$$P(x_1,\\dots,x_n)=\\prod_{t=1}^{n}P(x_t\\mid x_1,\\dots,x_{t-1})$$

A language model is any model of $P(x_t\\mid x_{<t})$. It is trained by maximizing $\\sum_t \\ln P_\\theta(x_t\\mid x_{t-k},\\dots,x_{t-1})$ over a corpus; this is the “standard language modeling objective” of GPT-1 (equation 1 of the paper), where $k$ is the size of the context window. It is equivalent to minimizing the cross-entropy loss $L=-\\tfrac1n\\sum_t \\ln p_\\theta(x_t\\mid x_{<t})$: the $-\\ln$ of the probability the model gave to the correct piece (the curve in the lesson). Generating is the reverse trip: $x_t\\sim P(\\cdot\\mid x_{<t})$, one piece at a time (autoregression).

## Counting: the n-gram model

With a window of $n-1$ pieces, the maximum-likelihood estimate is the relative frequency:

$$P(w\\mid c)=\\frac{N(c,w)}{N(c)}$$

where $N(c,w)$ counts how many times $w$ followed context $c$. In the lesson, “poor” appeared $N(c)=11$ times and $N(\\text{poor},\\text{Alice})=7$, so $P=7/11\\approx0.636$. Shannon (1948) built text this way by hand: his “second-order word approximation” picks each word according to the transition frequencies from the previous one. The limit is sparsity: with a vocabulary $V$ there are up to $V^{\\,n-1}$ contexts, and almost all are rare or never seen; the table does not generalize.

## Softmax and temperature

A neural model produces a score $z_i$ (a *logit*) for every piece $i$ of the vocabulary. The probability is

$$p_i=\\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$$

with $T=1$ it is the ordinary softmax (in GPT-1: $P(u)=\\operatorname{softmax}(h_nW_e^\\top)$). If $T\\to0$ all the mass goes to the highest-scoring piece (greedy); if $T\\to\\infty$ the distribution tends to uniform. With $z_i=\\ln c_i$ (the score used in the lesson) there is a closed form: $p_i=c_i^{1/T}/\\sum_j c_j^{1/T}$. For example, after “when” the counts are $7,4,3,2,2,1,1,1,1$ (they add up to 22): with $T=1$ the favorite gets $7/22\\approx0.32$; with $T=0.5$ it gets $49/86\\approx0.57$; with $T=0.25$ it gets $2401/2774\\approx0.87$. Temperature comes from statistical physics and appears in this role in knowledge distillation (Hinton et al., 2015).

## Top-k and top-p

After the softmax one can truncate. **Top-k** (Fan et al., 2018) keeps the $k$ most probable pieces. **Top-p**, or nucleus sampling (Holtzman et al., 2020), keeps the smallest set $V_p$ whose mass adds up to at least $p$:

$$V_p=\\arg\\min_{S}\\;|S|\\quad\\text{with}\\quad\\sum_{i\\in S}p_i\\ge p$$

Then it renormalizes, $q_i=p_i/\\sum_{j\\in V_p}p_j$, and samples with $q$. Holtzman et al. observed that maximizing likelihood when generating yields text that is “bland and strangely repetitive” (the greedy loop in the lesson), and that truncating the tail, without going all the way to greedy, yields text closer to human text.

## In code

A bigram model, softmax with temperature, top-p, and greedy generation, with the output it prints:

\`\`\`python
import math
from collections import Counter, defaultdict

text = "the cat eats fish . the cat drinks milk . the dog eats meat ."
pieces = text.split()

# 1. Count which piece follows each piece (a bigram model)
table = defaultdict(Counter)
for a, b in zip(pieces, pieces[1:]):
    table[a][b] += 1

def distribution(context, T=1.0, top_p=1.0):
    counts = table[context]
    z = {w: math.log(c) / T for w, c in counts.items()}    # score z = ln(count), divided by T
    m = max(z.values())
    e = {w: math.exp(v - m) for w, v in z.items()}         # softmax (subtracting the max for stability)
    s = sum(e.values())
    p = sorted(((w, v / s) for w, v in e.items()), key=lambda x: -x[1])
    nucleus, acc = [], 0.0                                  # top-p: the smallest group adding up to at least top_p
    for w, q in p:
        nucleus.append((w, q)); acc += q
        if acc >= top_p - 1e-9: break
    total = sum(q for _, q in nucleus)
    return [(w, q / total) for w, q in nucleus]             # renormalize

print(dict(table["the"]))
for T in (1.0, 0.5, 2.0):
    print(T, [(w, round(q, 3)) for w, q in distribution("the", T)])
print(distribution("the", top_p=0.6))   # the nucleus is already a single word

# 2. Generate: always pick the most probable piece (greedy) and repeat
generated = ["the"]
for _ in range(9):
    generated.append(table[generated[-1]].most_common(1)[0][0])
print(" ".join(generated))
# {'cat': 2, 'dog': 1}
# 1.0 [('cat', 0.667), ('dog', 0.333)]
# 0.5 [('cat', 0.8), ('dog', 0.2)]
# 2.0 [('cat', 0.586), ('dog', 0.414)]
# [('cat', 1.0)]
# the cat eats fish . the cat eats fish .
\`\`\`

The lesson’s corpus is the same method over about six thousand words of public-domain text (the first three chapters of *Alice’s Adventures in Wonderland*); the script that rebuilds it and the model are in the lesson folder.

## What comes next

We said “words,” but the real model works with smaller pieces: tokens (lesson 20). Instead of a table, the probability is computed by a network that looks at the whole context with attention (lessons 21 and 22). The idea of replacing the table with a network that learns representations of words comes from Bengio et al. (2003). What it means to train that network on almost the whole internet is the subject of lesson 23.`,
  },

  lens: {
    es: [
      'La salida es probabilística: la misma pregunta puede dar respuestas distintas. Para tareas con una respuesta correcta (extraer datos, clasificar) busca poca variación; para ideas y borradores, la variación ayuda.',
      'Bajar la temperatura vuelve la respuesta más repetible, no más veraz: un error probable sigue siendo probable. La verificación contra fuentes no se sustituye con un parámetro.',
      'Incluso con temperatura cero, algunos proveedores advierten que los resultados pueden no ser idénticos, y algunos modelos recientes ya no permiten fijarla. Pregunta qué parámetros de muestreo puedes controlar.',
      'Una prueba con una sola corrida no es evidencia. Repite cada caso varias veces con la configuración real y mide cuánto varía antes de decidir.',
    ],
    en: [
      'The output is probabilistic: the same question can get different answers. For tasks with one right answer (extracting data, classifying) aim for low variation; for ideas and drafts, variation helps.',
      'Lowering the temperature makes the answer more repeatable, not more truthful: a likely error stays likely. Verification against sources is not replaced by a parameter.',
      'Even at temperature zero, some providers warn that results may not be identical, and some recent models no longer let you set it. Ask which sampling parameters you can control.',
      'A test with a single run is not evidence. Repeat each case several times with the real configuration and measure how much it varies before deciding.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué calcula un modelo de lenguaje en cada paso de la generación?', en: 'What does a language model compute at each step of generation?' },
      options: [
        { es: 'La palabra correcta, que luego escribe.', en: 'The correct word, which it then writes.' },
        { es: 'Un resumen de todo el texto anterior.', en: 'A summary of all the previous text.' },
        { es: 'Una probabilidad para cada palabra posible que puede seguir.', en: 'A probability for every possible word that can follow.' },
        { es: 'La frase completa que va a escribir.', en: 'The complete sentence it is going to write.' },
      ],
      answer: 2,
      why: { es: 'Calcula una distribución sobre todas las piezas posibles; luego se elige una (voraz o sorteando) y se repite con la nueva pieza como contexto.', en: 'It computes a distribution over all the possible pieces; then one is chosen (greedy or sampled) and the loop repeats with the new piece as context.' },
    },
    {
      kind: 'concept',
      q: { es: 'Si subes mucho la temperatura T antes del softmax, ¿qué le pasa a la distribución?', en: 'If you raise the temperature T a lot before the softmax, what happens to the distribution?' },
      options: [
        { es: 'Se aplana: las palabras raras ganan terreno y el texto se vuelve más aleatorio.', en: 'It flattens: rare words gain ground and the text becomes more random.' },
        { es: 'Se afila: la palabra favorita se lleva casi toda la probabilidad.', en: 'It sharpens: the favorite word takes almost all the probability.' },
        { es: 'No cambia: la temperatura solo afecta el entrenamiento.', en: 'It does not change: temperature only affects training.' },
        { es: 'El modelo aprende más rápido.', en: 'The model learns faster.' },
      ],
      answer: 0,
      why: { es: 'Dividir las puntuaciones entre una T grande las acerca entre sí, y softmax reparte la probabilidad casi por igual. La temperatura actúa al generar; no entrena nada.', en: 'Dividing the scores by a large T brings them closer together, and softmax spreads the probability almost evenly. Temperature acts at generation time; it trains nothing.' },
    },
    {
      kind: 'calc',
      q: { es: 'Dos palabras tienen puntuaciones 2 y 0. Con T = 1 la primera vale 88 %. ¿Cuánto vale con T = 2?', en: 'Two words have scores 2 and 0. With T = 1 the first one gets 88%. What does it get with T = 2?' },
      options: [
        { es: '50 %', en: '50%' },
        { es: '73 %', en: '73%' },
        { es: '88 %', en: '88%' },
        { es: '96 %', en: '96%' },
      ],
      answer: 1,
      why: { es: 'Con T = 2 las puntuaciones pasan a 1 y 0: e¹ / (e¹ + e⁰) = 2.718 / 3.718 ≈ 0.73. Subir T aplanó la distribución, de 88 % a 73 %.', en: 'With T = 2 the scores become 1 and 0: e¹ / (e¹ + e⁰) = 2.718 / 3.718 ≈ 0.73. Raising T flattened the distribution, from 88% to 73%.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo usa un modelo para extraer cifras de contratos y obtiene resultados distintos en cada corrida. ¿Qué conviene revisar primero?', en: 'A team uses a model to extract figures from contracts and gets different results on each run. What should be checked first?' },
      options: [
        { es: 'Comprar más GPUs para que responda con más precisión.', en: 'Buying more GPUs so it answers more precisely.' },
        { es: 'Subir la temperatura para que explore más.', en: 'Raising the temperature so it explores more.' },
        { es: 'Entrenar un modelo propio desde cero.', en: 'Training a model from scratch.' },
        { es: 'Qué parámetros de muestreo se usan y si se pueden fijar bajos, y luego validar repitiendo cada caso varias veces.', en: 'Which sampling parameters are used and whether they can be set low, then validate by repeating each case several times.' },
      ],
      answer: 3,
      why: { es: 'La variación viene del muestreo. Reducirla (temperatura baja, si el modelo lo permite) la disminuye, pero no la garantiza en cero ni vuelve verdadera la respuesta: hay que medirla repitiendo y verificar contra el documento.', en: 'The variation comes from sampling. Reducing it (low temperature, if the model allows it) lowers it, but does not guarantee zero or make the answer true: measure it by repeating, and verify against the document.' },
    },
  ],

  glossary: ['language-model', 'autoregression', 'softmax', 'temperature', 'top-p', 'embedding', 'parameter', 'loss', 'gradient-descent', 'inference'],

  terms: [
    { id: 'language-model', term: { es: 'Modelo de lenguaje', en: 'Language model' }, def: { es: 'Modelo que, dado un texto, asigna una probabilidad a cada posible siguiente pieza de texto. Genera escribiendo una pieza a la vez.', en: 'A model that, given some text, assigns a probability to every possible next piece of text. It generates by writing one piece at a time.' } },
    { id: 'autoregression', term: { es: 'Autorregresión', en: 'Autoregression' }, def: { es: 'Generar una pieza a la vez usando como entrada las ya generadas: cada palabra producida pasa a formar parte del contexto de la siguiente.', en: 'Generating one piece at a time using the ones already generated as input: each word produced becomes part of the context of the next.' } },
    { id: 'softmax', term: { es: 'Softmax', en: 'Softmax' }, def: { es: 'Función que convierte puntuaciones cualesquiera en probabilidades positivas que suman uno: se eleva e a cada puntuación y se divide entre la suma.', en: 'A function that turns any scores into positive probabilities that add up to one: raise e to each score and divide by the sum.' } },
    { id: 'temperature', term: { es: 'Temperatura', en: 'Temperature' }, def: { es: 'Número T que divide las puntuaciones antes del softmax. T baja afila la distribución (hacia lo voraz); T alta la aplana (hacia el azar).', en: 'A number T that divides the scores before the softmax. Low T sharpens the distribution (toward greedy); high T flattens it (toward chance).' } },
    { id: 'top-p', term: { es: 'Top-p (muestreo por núcleo)', en: 'Top-p (nucleus sampling)' }, def: { es: 'Sortear solo entre el grupo más pequeño de palabras cuya probabilidad suma al menos p. Top-k hace lo mismo con un número fijo k de palabras.', en: 'Sampling only among the smallest group of words whose probability adds up to at least p. Top-k does the same with a fixed number k of words.' } },
  ],

  sources: [
    { title: 'A Mathematical Theory of Communication', authors: 'Shannon, C. E.', year: 1948, url: 'https://doi.org/10.1002/j.1538-7305.1948.tb01338.x' },
    { title: 'A Neural Probabilistic Language Model', authors: 'Bengio, Y., Ducharme, R., Vincent, P., Jauvin, C.', year: 2003, url: 'https://www.jmlr.org/papers/v3/bengio03a.html' },
    { title: 'Improving Language Understanding by Generative Pre-Training (GPT-1)', authors: 'Radford, A., Narasimhan, K., Salimans, T., Sutskever, I.', year: 2018, url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Distilling the Knowledge in a Neural Network', authors: 'Hinton, G., Vinyals, O., Dean, J.', year: 2015, url: 'https://arxiv.org/abs/1503.02531' },
    { title: 'Hierarchical Neural Story Generation', authors: 'Fan, A., Lewis, M., Dauphin, Y.', year: 2018, url: 'https://arxiv.org/abs/1805.04833' },
    { title: 'The Curious Case of Neural Text Degeneration', authors: 'Holtzman, A., Buys, J., Du, L., Forbes, M., Choi, Y.', year: 2020, url: 'https://arxiv.org/abs/1904.09751' },
    { title: 'Don Quijote de la Mancha, Primera parte, capítulos I–III (corpus de la escena en español; dominio público)', authors: 'Cervantes, M. de', year: 1605, url: 'https://www.gutenberg.org/ebooks/2000' },
    { title: 'Alice’s Adventures in Wonderland, chapters I–III (corpus of the English scene; public domain)', authors: 'Carroll, L.', year: 1865, url: 'https://www.gutenberg.org/ebooks/11' },
  ],
});
