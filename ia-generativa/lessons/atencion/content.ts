import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'atencion',

  objectives: {
    es: [
      'Explicar cómo una palabra reconstruye su significado mirando a las demás, con consultas, claves y valores.',
      'Calcular a mano, con vectores de dos números, las puntuaciones, los pesos de atención y la mezcla de valores.',
      'Reconocer por qué se divide entre √d, qué aportan varias cabezas y cuánto cuesta que cada token mire a todos los demás.',
    ],
    en: [
      'Explain how a word rebuilds its meaning by looking at the other words, using queries, keys, and values.',
      'Compute by hand, with two-number vectors, the scores, the attention weights, and the blend of values.',
      'Recognize why we divide by √d, what several heads add, and what it costs for every token to look at all the others.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Mira esta frase: «El robot soltó el paquete porque este era pesado». Un pronombre no significa nada por sí solo. ¿A qué se refiere «este»?',
      en: 'Look at this sentence: “The robot dropped the package because it was heavy.” A pronoun means nothing on its own. What does “it” refer to?',
    },
    {
      id: 'fixed',
      es: 'Tú lo resuelves sin pensar: es el paquete. Pero a la entrada del modelo cada palabra es un vector fijo, como en los embeddings, y «este» tiene los mismos números en cualquier frase.',
      en: 'You solve it without thinking: the package. But at the model’s input each word is a fixed vector, as in embeddings, and “it” has the same numbers in any sentence.',
    },
    {
      id: 'flip',
      es: 'Cambia el final a «estaba cansado» y la respuesta cambia: un paquete no se cansa, así que «este» es el robot. Mismo vector, otro referente.',
      en: 'Change the ending to “was tired” and the answer flips: a package cannot get tired, so “it” is the robot. Same vector, different referent.',
    },
    {
      id: 'idea',
      es: 'Entonces el vector de «este» no puede ser fijo: debe reconstruirse mirando a las demás palabras. Eso es la atención: una mezcla de las otras palabras, con más peso en las que importan.',
      en: 'So the vector for “it” cannot be fixed: it must be rebuilt by looking at the other words. That is attention: a blend of the other words, weighted toward the ones that matter.',
      note: { es: 'Atención: cada palabra se reconstruye como una mezcla ponderada de las demás.', en: 'Attention: each word is rebuilt as a weighted blend of the others.' },
    },
    {
      id: 'roles',
      es: 'Para decidir a quién mirar, cada palabra genera tres vectores con tres matrices que el modelo aprende: consulta, clave y valor. Aquí serán de dos números, inventados a mano para seguir las cuentas.',
      en: 'To decide whom to look at, every word produces three vectors using three matrices the model learns: a query, a key, and a value. Here they will have two numbers, made up by hand so you can follow the arithmetic.',
      note: { es: 'Cada palabra produce tres vectores: consulta (q), clave (k) y valor (v).', en: 'Each word produces three vectors: query (q), key (k), and value (v).' },
    },
    {
      id: 'q',
      es: 'La consulta, q, es lo que una palabra busca. Aquí preguntará «este», que busca algo a lo que referirse; las demás palabras también tienen la suya.',
      en: 'The query, q, is what a word is looking for. Here “it” will be the one asking, searching for something to refer to; the other words have a query too.',
      tts: {
        es: 'La consulta, cu, es lo que una palabra busca. Aquí preguntará «este», que busca algo a lo que referirse; las demás palabras también tienen la suya.',
        en: 'The query, cue, is what a word is looking for. Here “it” will be the one asking, searching for something to refer to; the other words have a query too.',
      },
    },
    {
      id: 'k',
      es: 'La clave, k, es la etiqueta con la que cada palabra se deja encontrar. Cada consulta se compara con las claves de todas las palabras.',
      en: 'The key, k, is the label each word offers so it can be found. Each query is compared against the keys of all the words.',
      tts: {
        es: 'La clave, ca, es la etiqueta con la que cada palabra se deja encontrar. Cada consulta se compara con las claves de todas las palabras.',
        en: 'The key, kay, is the label each word offers so it can be found. Each query is compared against the keys of all the words.',
      },
    },
    {
      id: 'v',
      es: 'El valor, v, es lo que cada palabra entrega si la eligen. Funciona como un diccionario, pero difuso: en vez de devolver una sola entrada, mezcla varias.',
      en: 'The value, v, is what each word hands over when it is chosen. It works like a dictionary, but a fuzzy one: instead of returning a single entry, it blends several.',
      tts: {
        es: 'El valor, uve, es lo que cada palabra entrega si la eligen. Funciona como un diccionario, pero difuso: en vez de devolver una sola entrada, mezcla varias.',
        en: 'The value, vee, is what each word hands over when it is chosen. It works like a dictionary, but a fuzzy one: instead of returning a single entry, it blends several.',
      },
    },
    {
      id: 'plane',
      es: 'Dibujemos esos vectores como puntos y flechas en un plano. Las claves son los puntos violeta, y la consulta de «este», la flecha cian.',
      en: 'Let’s draw those vectors as points and arrows on a plane. The keys are the violet points, and the query of “it” is the cyan arrow.',
    },
    {
      id: 'dot',
      es: '¿Qué tan bien encaja la consulta con una clave? Se mide con el producto punto: multiplicas coordenada con coordenada y sumas. Si las flechas apuntan al mismo lado, sale un número grande.',
      en: 'How well does the query match a key? We measure it with the dot product: multiply coordinate by coordinate, then add. If the arrows point the same way, the number is large.',
      note: { es: 'Producto punto: mide cuánto coinciden dos vectores (la afinidad).', en: 'Dot product: measures how much two vectors agree (the affinity).' },
    },
    {
      id: 'scores',
      es: 'Lo mismo con las nueve palabras. Si las flechas son perpendiculares, da cero; si apuntan en sentidos opuestos, da negativo. Cada palabra recibe una puntuación.',
      en: 'The same for all nine words. Perpendicular arrows give zero; opposite directions give a negative number. Every word gets a score.',
    },
    {
      id: 'scale',
      es: 'Dividimos cada puntuación entre la raíz de d, la longitud de los vectores. Aquí d es dos, así que dividimos entre uno coma cuatro. En un momento verás por qué.',
      en: 'We divide each score by the square root of d, the length of the vectors. Here d is two, so we divide by about one point four. You will soon see why.',
      tts: {
        es: 'Dividimos cada puntuación entre la raíz de dé, la longitud de los vectores. Aquí dé es dos, así que dividimos entre uno coma cuatro. En un momento verás por qué.',
        en: 'We divide each score by the square root of d, the length of the vectors. Here d is two, so we divide by about one point four. You will soon see why.',
      },
    },
    {
      id: 'softmax',
      es: 'Ahora softmax convierte las puntuaciones en pesos: todos positivos y con suma uno. A mayor puntuación, mayor porción del reparto.',
      en: 'Now softmax turns the scores into weights: all positive, adding up to one. The higher the score, the bigger the share.',
      note: { es: 'Softmax: convierte puntuaciones en pesos positivos que suman uno.', en: 'Softmax: turns scores into positive weights that add up to one.' },
    },
    {
      id: 'mix',
      es: 'Con esos pesos mezclamos los valores: cada uno aporta según su peso. La suma ponderada es el nuevo vector de «este».',
      en: 'With those weights we blend the values: each one contributes according to its weight. The weighted sum is the new vector for “it.”',
      pad: 0.3,
    },
    {
      id: 'meaning',
      es: 'Ese vector ya no está vacío: es sobre todo paquete, con algo de robot. «Este» acaba de tomar prestado su significado de las palabras que importan.',
      en: 'That vector is no longer empty: it is mostly package, with a bit of robot. “It” has just borrowed its meaning from the words that matter.',
    },
    {
      id: 'formula',
      es: 'Apilando todas las palabras en matrices Q, K y V, todo esto cabe en una línea: softmax de Q por K traspuesta, entre raíz de d, por V.',
      en: 'Stacking all the words into matrices Q, K, and V, all of this fits in one line: softmax of Q times K transposed, divided by the square root of d, times V.',
      tts: {
        es: 'Apilando todas las palabras en matrices cu, ca y uve, todo esto cabe en una línea: softmax de cu por ca traspuesta, entre raíz de dé, por uve.',
        en: 'Stacking all the words into matrices Q, K, and V, all of this fits in one line: softmax of Q times K transposed, divided by the square root of dee, times V.',
      },
      note: { es: 'Atención = softmax(QKᵀ / √d) · V.', en: 'Attention = softmax(QKᵀ / √d) · V.' },
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: arrastra la flecha de la consulta. Predice hacia dónde moverla para que «este» mire al robot, y comprueba cuánto pesa.',
      en: 'Your turn: drag the query arrow. Predict where to move it so that “it” looks at the robot, then check how much it weighs.',
      gate: {
        id: 'q',
        prompt: { es: 'Mueve la consulta hasta que el robot reciba más de la mitad de la atención.', en: 'Move the query until the robot gets more than half of the attention.' },
      },
      pad: 0.4,
    },
    {
      id: 'sqrt-why',
      es: 'Falta explicar la raíz de d. Con vectores largos, el producto punto suma muchos términos y las puntuaciones se dispersan: su tamaño típico crece como la raíz de d.',
      en: 'One piece is still missing: the square root of d. With long vectors, the dot product adds up many terms, so the scores spread out: their typical size grows like the square root of d.',
      tts: {
        es: 'Falta explicar la raíz de dé. Con vectores largos, el producto punto suma muchos términos y las puntuaciones se dispersan: su tamaño típico crece como la raíz de dé.',
        en: 'One piece is still missing: the square root of dee. With long vectors, the dot product adds up many terms, so the scores spread out: their typical size grows like the square root of dee.',
      },
      pad: 0.5,
    },
    {
      id: 'sqrt-sat',
      es: 'Si las puntuaciones se disparan, softmax se vuelve un interruptor: casi todo el peso en una palabra. Ahí casi no queda pendiente para aprender. Dividir entre la raíz de d lo evita.',
      en: 'If the scores blow up, softmax becomes a switch: nearly all the weight on one word. There is almost no slope left to learn from. Dividing by the square root of d prevents it.',
      tts: {
        es: 'Si las puntuaciones se disparan, softmax se vuelve un interruptor: casi todo el peso en una palabra. Ahí casi no queda pendiente para aprender. Dividir entre la raíz de dé lo evita.',
        en: 'If the scores blow up, softmax becomes a switch: nearly all the weight on one word. There is almost no slope left to learn from. Dividing by the square root of d prevents it.',
      },
      note: { es: 'Se divide entre √d para que softmax no se sature con vectores largos.', en: 'We divide by √d so softmax does not saturate with long vectors.' },
      pad: 0.4,
    },
    {
      id: 'try2',
      es: 'Tu turno: sube d hasta sesenta y cuatro o más, y alterna la división entre raíz de d. Compara cómo se reparte la atención.',
      en: 'Your turn: raise d to sixty-four or more, and toggle the division by the square root of d. Compare how the attention is spread.',
      tts: {
        es: 'Tu turno: sube dé hasta sesenta y cuatro o más, y alterna la división entre raíz de dé. Compara cómo se reparte la atención.',
        en: 'Your turn: raise d to sixty-four or more, and toggle the division by the square root of d. Compare how the attention is spread.',
      },
      gate: {
        id: 'scale',
        prompt: { es: 'Sube d a 64 o más y alterna «dividir entre √d».', en: 'Raise d to 64 or more and toggle “divide by √d”.' },
      },
      pad: 0.4,
    },
    {
      id: 'all',
      es: 'Todas las palabras hacen esto a la vez. Sus consultas contra todas las claves forman una tabla de pesos, el mapa de atención. Como todo sale de la misma frase, se llama autoatención.',
      en: 'Every word does this at once. Their queries against all the keys form a table of weights, the attention map. Because everything comes from the same sentence, it is called self-attention.',
      note: { es: 'Autoatención: consultas, claves y valores salen de la misma secuencia.', en: 'Self-attention: queries, keys, and values all come from the same sequence.' },
      pad: 0.6,
    },
    {
      id: 'origin',
      es: 'La idea nació en la traducción: en 2014, Bahdanau y colegas dejaron que el decodificador mirara el texto de origen. En 2017, «Attention Is All You Need» quitó la recurrencia y dejó solo atención.',
      en: 'The idea began in translation: in 2014, Bahdanau and colleagues let the decoder look back at the source text. In 2017, “Attention Is All You Need” removed recurrence and kept only attention.',
      tts: {
        es: 'La idea nació en la traducción: en dos mil catorce, Bahdanau y colegas dejaron que el decodificador mirara el texto de origen. En dos mil diecisiete, «Attention Is All You Need» quitó la recurrencia y dejó solo atención.',
        en: 'The idea began in translation: in twenty fourteen, Bahdanau and colleagues let the decoder look back at the source text. In twenty seventeen, “Attention Is All You Need” removed recurrence and kept only attention.',
      },
      pad: 0.4,
    },
    {
      id: 'parallel',
      es: 'Sin recurrencia nadie espera turno. Una red recurrente avanza palabra por palabra; la atención calcula todas a la vez y conecta cualquier par en un paso. Justo lo que una GPU hace bien.',
      en: 'Without recurrence nobody waits for a turn. A recurrent network goes word by word; attention computes all words at once and links any pair in one step. Exactly what a GPU does well.',
      note: { es: 'Todas las palabras a la vez: sin esperar turno, y cualquier par se conecta en un paso.', en: 'All words at once: no waiting for a turn, and any pair connects in one step.' },
      pad: 0.5,
    },
    {
      id: 'cost',
      es: 'El precio: cada palabra se compara con todas, así que las comparaciones crecen con el cuadrado de la longitud. El doble de texto, cuatro veces más comparaciones.',
      en: 'The price: every word is compared with all the others, so comparisons grow with the square of the length. Twice the text, four times the comparisons.',
      pad: 0.5,
    },
    {
      id: 'heads-why',
      es: 'Con una sola mezcla, cada palabra tiene un único reparto de atención. Por eso hay varias cabezas: cada una, con sus propias matrices, calcula su mapa; al final se pegan sus resultados y se combinan.',
      en: 'With a single blend, each word gets a single spread of attention. That is why there are several heads: each, with its own matrices, computes its own map; in the end their results are joined and combined.',
      note: { es: 'Varias cabezas: cada una calcula su propio mapa, todas en paralelo.', en: 'Several heads: each computes its own map, all in parallel.' },
      pad: 0.4,
    },
    {
      id: 'heads-real',
      es: 'Estas son cuatro cabezas reales de un modelo BERT leyendo esta frase, elegidas por lo claro de su patrón. Cada una dibuja un mapa distinto; lo que ves sale de medir esta frase, no de una regla general.',
      en: 'These are four real heads of a BERT model reading this sentence, picked for how clear their pattern is. Each draws a different map; what you see comes from measuring this sentence, not from a general rule.',
      pad: 0.4,
    },
    {
      id: 'try3',
      es: 'Tu turno: cambia de cabeza y mira adónde va «este». Busca la que lo lleva al paquete. También puedes elegir otra palabra.',
      en: 'Your turn: switch heads and watch where “it” goes. Find the one that sends it to the package. You can also pick another word.',
      gate: {
        id: 'head',
        prompt: { es: 'Con «este» elegido, encuentra la cabeza que lo lleva sobre todo al paquete.', en: 'With “it” selected, find the head that sends it mostly to the package.' },
      },
      pad: 0.4,
    },
    {
      id: 'real-flip',
      es: 'Ahora el cambio de final, con números reales. Con «pesado», esa cabeza lleva a «este» sobre todo al paquete; con «cansado», al robot. Nadie programó esa regla.',
      en: 'Now the ending swap, with real numbers. With “heavy,” that head sends “it” mostly to the package; with “tired,” to the robot. Nobody programmed that rule.',
      pad: 0.5,
    },
    {
      id: 'real-few',
      es: 'Pero seamos honestos: elegimos la cabeza más legible de las ciento cuarenta y cuatro. Muy pocas giran así, y en muchas el mayor peso de «este» cae en marcas como el punto o el fin de la frase.',
      en: 'But let’s be honest: we picked the most readable of the one hundred forty-four heads. Very few swing like this, and in many the biggest weight of “it” lands on marks like the period or the end of the sentence.',
      pad: 0.5,
    },
    {
      id: 'explain',
      es: 'Un mapa de atención muestra dónde mira una cabeza; no prueba por qué el modelo respondió algo. Es una pista útil, no una explicación completa.',
      en: 'An attention map shows where one head looks; it does not prove why the model answered something. It is a useful clue, not a complete explanation.',
    },
    {
      id: 'order',
      es: 'Otra limitación: la atención sola no sabe el orden. Si barajas las palabras, cada una reparte lo mismo entre las mismas palabras; solo cambia dónde quedan. El transformer le añade la posición.',
      en: 'Another limit: attention alone does not know word order. Shuffle the words and each one spreads the same weights over the same words; only their places change. The transformer adds position on top.',
      pad: 0.4,
    },
    {
      id: 'causal',
      es: 'Y los modelos que escriben texto, como GPT, solo pueden mirar hacia atrás: tapan la parte de arriba de la tabla. Cómo se hace, en la lección del transformer.',
      en: 'And models that write text, like GPT, can only look backward: they cover the upper part of the table. How that works comes in the transformer lesson.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: cada palabra pregunta, compara con las claves, reparte atención con softmax y mezcla valores. Varias cabezas lo hacen en paralelo, y todas las palabras a la vez.',
      en: 'In short: each word asks, compares against the keys, spreads attention with softmax, and blends values. Several heads do it in parallel, and all words at once.',
    },
    {
      id: 'bridge',
      es: 'Con esta pieza podemos armar un modelo completo: atención, una red para cada palabra, atajos y una forma de saber el orden. Ese montaje es el transformer.',
      en: 'With this piece we can assemble a complete model: attention, a network for each word, shortcuts, and a way to know the order. That assembly is the transformer.',
    },
  ],

  keyIdeas: {
    es: [
      'El significado de una palabra depende de las demás: la atención reconstruye cada vector como una mezcla ponderada de los vectores de la frase.',
      'Cada palabra produce una consulta (qué busca), una clave (cómo se la encuentra) y un valor (qué aporta). El producto punto mide la afinidad y softmax la convierte en pesos que suman uno.',
      'Atención(Q, K, V) = softmax(QKᵀ/√d)·V. Se divide entre √d para que softmax no se sature cuando los vectores son largos.',
      'Los pesos de atención se calculan de nuevo con cada frase; lo que se aprende son las matrices que producen Q, K y V. Varias cabezas buscan relaciones distintas a la vez.',
      'Todas las palabras se procesan en paralelo y cualquier par se conecta en un paso, a cambio de un costo que crece con el cuadrado de la longitud.',
    ],
    en: [
      'A word’s meaning depends on the other words: attention rebuilds each vector as a weighted blend of the vectors in the sentence.',
      'Each word produces a query (what it seeks), a key (how it can be found), and a value (what it contributes). The dot product measures affinity and softmax turns it into weights that add up to one.',
      'Attention(Q, K, V) = softmax(QKᵀ/√d)·V. We divide by √d so softmax does not saturate when the vectors are long.',
      'Attention weights are computed anew for every sentence; what is learned are the matrices that produce Q, K, and V. Several heads look for different relationships at once.',
      'All words are processed in parallel and any pair connects in one step, at a cost that grows with the square of the length.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un mapa de atención muestra por qué el modelo respondió lo que respondió: lo que «miró» es su razón.',
      en: 'An attention map shows why the model answered what it answered: what it “looked at” is its reason.',
    },
    right: {
      es: 'Muestra cómo reparte una cabeza, en una capa, sus pesos de mezcla. Es una pista de por dónde fluye la información, pero pesos muy distintos pueden dar la misma respuesta y la decisión depende de muchas cabezas y capas. Si eso es una explicación sigue en debate.',
      en: 'It shows how one head, in one layer, spreads its mixing weights. It is a clue about where information flows, but very different weights can give the same answer and the decision depends on many heads and layers. Whether that counts as an explanation is still debated.',
    },
  },

  deeper: {
    es: `## La fórmula

Para $n$ palabras con vectores de dimensión $d_k$ (claves y consultas) y $d_v$ (valores), apilamos las consultas, claves y valores en matrices $Q,K\\in\\mathbb{R}^{n\\times d_k}$ y $V\\in\\mathbb{R}^{n\\times d_v}$:

$$\\text{Atención}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V$$

Fila por fila: la puntuación de la palabra $i$ sobre la $j$ es $s_{ij}=q_i\\cdot k_j/\\sqrt{d_k}$; el peso es $\\alpha_{ij}=\\dfrac{e^{s_{ij}}}{\\sum_{l}e^{s_{il}}}$ (cada fila suma 1) y la salida es $o_i=\\sum_j\\alpha_{ij}\\,v_j$. En la escena, $q$ de «este» es $(2,1)$ y la puntuación con «paquete» es $(2\\cdot 2+1\\cdot 0.5)/\\sqrt{2}\\approx 3.18$.

## De dónde salen Q, K y V

Si $X$ es la matriz de vectores de entrada (embeddings, más la posición), $Q=XW^Q$, $K=XW^K$ y $V=XW^V$. Esas tres matrices son los parámetros que se aprenden; los pesos $\\alpha_{ij}$ **no**: se calculan de nuevo para cada frase. En la autoatención $Q$, $K$ y $V$ salen de la misma $X$. En la atención de Bahdanau et al. (2014), las consultas venían del decodificador y las claves y valores del codificador, y la puntuación era una pequeña red, $e_{ij}=a(s_{i-1},h_j)$, no un producto punto; los pesos eran el mismo softmax y el resultado, la misma suma ponderada $c_i=\\sum_j\\alpha_{ij}h_j$.

## Por qué $\\sqrt{d_k}$

Si las componentes de $q$ y $k$ son independientes, con media 0 y varianza 1, el producto $q\\cdot k=\\sum_{i=1}^{d_k}q_ik_i$ tiene media 0 y varianza $d_k$ (la nota 4 de Vaswani et al., 2017). Dividir entre $\\sqrt{d_k}$ devuelve la varianza a 1. Sin ello, con $d_k$ grande, el softmax se satura: si $\\alpha=\\text{softmax}(s)$, entonces $\\partial\\alpha_i/\\partial s_j=\\alpha_i(\\delta_{ij}-\\alpha_j)$, que tiende a 0 cuando $\\alpha$ se parece a un vector «uno-caliente». La lección lo mide con 100 sorteos al azar: con $d=64$ el peso máximo medio sin escalar es ≈ 0.88; escalado, ≈ 0.34.

## Varias cabezas

$$\\text{MultiHead}(Q,K,V)=\\text{Concat}(\\text{cabeza}_1,\\dots,\\text{cabeza}_h)\\,W^O,\\qquad \\text{cabeza}_i=\\text{Atención}(XW_i^Q,\\,XW_i^K,\\,XW_i^V)$$

En el modelo base de Vaswani et al. (2017), $h=8$, $d_{\\text{modelo}}=512$ y $d_k=d_v=d_{\\text{modelo}}/h=64$: ocho cabezas pequeñas cuestan casi lo mismo que una grande. BERT base tiene 12 capas con 12 cabezas cada una (144 en total, con 768 dimensiones); GPT-3 de 175 mil millones de parámetros, 96 capas con 96 cabezas de 128 dimensiones (Devlin et al., 2018; Brown et al., 2020).

## Costo

La matriz de pesos es $n\\times n$: el cómputo por capa crece como $O(n^2\\cdot d)$. Una capa recurrente cuesta $O(n\\cdot d^2)$, pero necesita $O(n)$ pasos secuenciales y la información entre dos posiciones recorre un camino de longitud $O(n)$; en la atención ambos son $O(1)$ (tabla 1 de Vaswani et al., 2017). Por eso la atención escala bien en GPU, y por eso los contextos largos son caros.

## En código

\`\`\`python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V):
    d = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d)    # afinidad de cada consulta con cada clave
    weights = softmax(scores)        # cada fila suma 1
    return weights @ V, weights      # mezcla ponderada de los valores

# Los números de la escena: nueve palabras, d = 2
K = np.array([[-1.2, 1.4], [0.6, 2.0], [-1.9, 0.2], [-0.5, -0.7], [2.0, 0.5],
              [-1.4, -1.1], [0.2, -1.7], [0.7, -0.3], [1.5, -1.0]])
V = np.array([[0.0, 0.1], [0.1, 1.0], [0.3, 0.6], [0.1, 0.0], [1.0, 0.0],
              [0.0, 0.0], [0.0, 0.0], [0.0, 0.1], [0.9, -0.1]])
q = np.array([[2.0, 1.0]])           # la consulta de «este»

out, w = attention(q, K, V)
print(np.round(w, 2))
print(np.round(out, 2))
# [[0.01 0.23 0.   0.01 0.58 0.   0.01 0.05 0.1 ]]
# [[0.7  0.23]]
\`\`\`

Y la comprobación de $\\sqrt{d}$: la desviación típica de $q\\cdot k$ crece como $\\sqrt{d}$, y al dividir queda en 1.

\`\`\`python
rng = np.random.default_rng(0)
for d in (2, 64, 512):
    q = rng.standard_normal((20000, d))
    k = rng.standard_normal((20000, d))
    s = (q * k).sum(axis=1)                       # 20 000 productos punto q·k
    print(d, round(s.std(), 1), round((s / np.sqrt(d)).std(), 2))
# 2 1.4 1.0
# 64 8.0 1.01
# 512 22.6 1.0
\`\`\`

## Lo que viene

Falta lo que la atención no hace: no conoce el orden de las palabras (hay que sumarle una codificación de posición) y, al generar texto, cada palabra solo puede mirar a las anteriores (se pone $-\\infty$ en las puntuaciones que miran al futuro antes del softmax). Con una red por palabra, conexiones residuales y normalización, se apila todo en bloques: el transformer, en la lección 22.`,
    en: `## The formula

For $n$ words with vectors of dimension $d_k$ (keys and queries) and $d_v$ (values), we stack the queries, keys, and values into matrices $Q,K\\in\\mathbb{R}^{n\\times d_k}$ and $V\\in\\mathbb{R}^{n\\times d_v}$:

$$\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V$$

Row by row: the score of word $i$ on word $j$ is $s_{ij}=q_i\\cdot k_j/\\sqrt{d_k}$; the weight is $\\alpha_{ij}=\\dfrac{e^{s_{ij}}}{\\sum_{l}e^{s_{il}}}$ (each row adds up to 1) and the output is $o_i=\\sum_j\\alpha_{ij}\\,v_j$. In the scene, the $q$ of “it” is $(2,1)$ and its score with “package” is $(2\\cdot 2+1\\cdot 0.5)/\\sqrt{2}\\approx 3.18$.

## Where Q, K, and V come from

If $X$ is the matrix of input vectors (embeddings, plus position), $Q=XW^Q$, $K=XW^K$, and $V=XW^V$. Those three matrices are the parameters that are learned; the weights $\\alpha_{ij}$ are **not**: they are computed anew for each sentence. In self-attention, $Q$, $K$, and $V$ all come from the same $X$. In the attention of Bahdanau et al. (2014), the queries came from the decoder and the keys and values from the encoder, and the score was a small network, $e_{ij}=a(s_{i-1},h_j)$, not a dot product; the weights were the same softmax and the result the same weighted sum $c_i=\\sum_j\\alpha_{ij}h_j$.

## Why $\\sqrt{d_k}$

If the components of $q$ and $k$ are independent with mean 0 and variance 1, the product $q\\cdot k=\\sum_{i=1}^{d_k}q_ik_i$ has mean 0 and variance $d_k$ (footnote 4 of Vaswani et al., 2017). Dividing by $\\sqrt{d_k}$ brings the variance back to 1. Without it, with large $d_k$, softmax saturates: if $\\alpha=\\text{softmax}(s)$, then $\\partial\\alpha_i/\\partial s_j=\\alpha_i(\\delta_{ij}-\\alpha_j)$, which goes to 0 as $\\alpha$ approaches a one-hot vector. The lesson measures it with 100 random draws: with $d=64$ the average maximum weight is ≈ 0.88 unscaled and ≈ 0.34 scaled.

## Several heads

$$\\text{MultiHead}(Q,K,V)=\\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h)\\,W^O,\\qquad \\text{head}_i=\\text{Attention}(XW_i^Q,\\,XW_i^K,\\,XW_i^V)$$

In the base model of Vaswani et al. (2017), $h=8$, $d_{\\text{model}}=512$, and $d_k=d_v=d_{\\text{model}}/h=64$: eight small heads cost about the same as one big one. BERT base has 12 layers with 12 heads each (144 in total, with 768 dimensions); the 175-billion-parameter GPT-3 has 96 layers with 96 heads of 128 dimensions each (Devlin et al., 2018; Brown et al., 2020).

## Cost

The weight matrix is $n\\times n$: the compute per layer grows as $O(n^2\\cdot d)$. A recurrent layer costs $O(n\\cdot d^2)$, but it needs $O(n)$ sequential steps and the information between two positions travels a path of length $O(n)$; in attention both are $O(1)$ (Table 1 of Vaswani et al., 2017). That is why attention scales well on GPUs, and why long contexts are expensive.

## In code

\`\`\`python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V):
    d = K.shape[-1]
    scores = Q @ K.T / np.sqrt(d)    # affinity of each query with each key
    weights = softmax(scores)        # each row adds up to 1
    return weights @ V, weights      # weighted blend of the values

# The scene's numbers: nine words, d = 2
K = np.array([[-1.2, 1.4], [0.6, 2.0], [-1.9, 0.2], [-0.5, -0.7], [2.0, 0.5],
              [-1.4, -1.1], [0.2, -1.7], [0.7, -0.3], [1.5, -1.0]])
V = np.array([[0.0, 0.1], [0.1, 1.0], [0.3, 0.6], [0.1, 0.0], [1.0, 0.0],
              [0.0, 0.0], [0.0, 0.0], [0.0, 0.1], [0.9, -0.1]])
q = np.array([[2.0, 1.0]])           # the query of "it"

out, w = attention(q, K, V)
print(np.round(w, 2))
print(np.round(out, 2))
# [[0.01 0.23 0.   0.01 0.58 0.   0.01 0.05 0.1 ]]
# [[0.7  0.23]]
\`\`\`

And the check of $\\sqrt{d}$: the standard deviation of $q\\cdot k$ grows as $\\sqrt{d}$, and after dividing it stays at 1.

\`\`\`python
rng = np.random.default_rng(0)
for d in (2, 64, 512):
    q = rng.standard_normal((20000, d))
    k = rng.standard_normal((20000, d))
    s = (q * k).sum(axis=1)                       # 20,000 dot products q·k
    print(d, round(s.std(), 1), round((s / np.sqrt(d)).std(), 2))
# 2 1.4 1.0
# 64 8.0 1.01
# 512 22.6 1.0
\`\`\`

## What comes next

What attention does not do: it does not know the order of the words (a position encoding has to be added) and, when generating text, each word may only look at the previous ones ($-\\infty$ is placed on the scores that look at the future before the softmax). With a network per word, residual connections, and normalization, everything is stacked into blocks: the transformer, in lesson 22.`,
  },

  lens: {
    es: [
      'Cada palabra se compara con todas las demás: el costo de la atención crece con el cuadrado del contexto. Duplicar el texto cuesta cuatro veces más comparaciones, y es una de las razones por las que los contextos largos son caros (lecciones 26 y 30).',
      'Un mapa de atención no es una explicación. Si un proveedor muestra «a qué miró el modelo» como justificación de una respuesta, pide además pruebas con casos tuyos y medidas de calidad (lecciones 33 y 34).',
      'Todo lo que está en el contexto puede influir en cualquier otra parte: la arquitectura no distingue por sí sola entre una instrucción tuya y un documento ajeno. De ahí el riesgo de inyección de instrucciones: separa y valida lo que entra (lección 35).',
      'Más contexto no garantiza más comprensión: con más palabras, la atención puede repartirse entre más candidatas. Prueba con tus documentos largos y no supongas que el modelo usa todo por igual (lección 30).',
    ],
    en: [
      'Every word is compared with all the others: the cost of attention grows with the square of the context. Doubling the text costs four times as many comparisons, and it is one of the reasons long contexts are expensive (lessons 26 and 30).',
      'An attention map is not an explanation. If a vendor shows “what the model looked at” as the justification for an answer, also ask for tests with your own cases and quality measures (lessons 33 and 34).',
      'Everything in the context can influence everything else: the architecture does not tell your instruction apart from a stranger’s document on its own. Hence the risk of prompt injection: separate and validate what comes in (lesson 35).',
      'More context does not guarantee more understanding: with more words, attention can spread across more candidates. Test with your own long documents and do not assume the model uses everything equally (lesson 30).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En la atención, ¿qué papel cumple la clave (k) de una palabra?', en: 'In attention, what role does a word’s key (k) play?' },
      options: [
        { es: 'Es el contenido que la palabra entrega a quien la mira.', en: 'It is the content the word hands over to whoever looks at it.' },
        { es: 'Es la etiqueta con la que se mide su afinidad con una consulta.', en: 'It is the label used to measure its affinity with a query.' },
        { es: 'Es la posición de la palabra dentro de la frase.', en: 'It is the position of the word within the sentence.' },
        { es: 'Es la probabilidad de que sea la siguiente palabra.', en: 'It is the probability that it is the next word.' },
      ],
      answer: 1,
      why: { es: 'La consulta se compara con las claves mediante el producto punto. Lo que se mezcla después son los valores, no las claves.', en: 'The query is compared with the keys using the dot product. What gets blended afterward are the values, not the keys.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una palabra reparte su atención 0.75 y 0.25 entre dos palabras cuyos valores son (4, 0) y (0, 8). ¿Cuál es su nuevo vector?', en: 'A word spreads its attention 0.75 and 0.25 over two words whose values are (4, 0) and (0, 8). What is its new vector?' },
      options: [
        { es: '(2, 4)', en: '(2, 4)' },
        { es: '(3, 6)', en: '(3, 6)' },
        { es: '(3, 2)', en: '(3, 2)' },
        { es: '(4, 8)', en: '(4, 8)' },
      ],
      answer: 2,
      why: { es: 'Es la suma ponderada: 0.75 · (4, 0) + 0.25 · (0, 8) = (3, 0) + (0, 2) = (3, 2).', en: 'It is the weighted sum: 0.75 · (4, 0) + 0.25 · (0, 8) = (3, 0) + (0, 2) = (3, 2).' },
    },
    {
      kind: 'concept',
      q: { es: '¿Para qué se divide entre √d antes del softmax?', en: 'Why do we divide by √d before the softmax?' },
      options: [
        { es: 'Para que softmax no se sature cuando los vectores son largos.', en: 'So softmax does not saturate when the vectors are long.' },
        { es: 'Para que las puntuaciones sean siempre negativas.', en: 'So the scores are always negative.' },
        { es: 'Para que los pesos sumen uno.', en: 'So the weights add up to one.' },
        { es: 'Para ahorrar memoria en la GPU.', en: 'To save memory on the GPU.' },
      ],
      answer: 0,
      why: { es: 'Con d grande, las puntuaciones crecen como √d y softmax se parece a un interruptor, con gradientes casi nulos. Dividir devuelve la dispersión a un tamaño razonable. Que los pesos sumen uno lo garantiza el propio softmax.', en: 'With large d, the scores grow like √d and softmax behaves like a switch, with almost no gradient. Dividing brings the spread back to a reasonable size. That the weights add up to one is guaranteed by softmax itself.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo pasa de contextos de 4 000 a 8 000 tokens sin cambiar nada más. ¿Qué esperar del cómputo de las comparaciones de atención?', en: 'A team moves from 4,000-token to 8,000-token contexts, changing nothing else. What should it expect for the compute of the attention comparisons?' },
      options: [
        { es: 'Aproximadamente el doble.', en: 'About double.' },
        { es: 'Aproximadamente lo mismo.', en: 'About the same.' },
        { es: 'Aproximadamente ocho veces más.', en: 'About eight times more.' },
        { es: 'Aproximadamente cuatro veces más.', en: 'About four times more.' },
      ],
      answer: 3,
      why: { es: 'Cada token se compara con todos, así que las comparaciones son n × n: al duplicar n se multiplican por cuatro. Por eso conviene recortar lo que se envía y pedir el desglose de costos por longitud de contexto.', en: 'Every token is compared with all the others, so the comparisons are n × n: doubling n multiplies them by four. That is why it pays to trim what you send and to ask for the cost breakdown by context length.' },
    },
  ],

  glossary: ['vector', 'embedding', 'softmax', 'token', 'rnn', 'gpu', 'attention', 'query-key-value', 'self-attention', 'multi-head-attention'],

  terms: [
    { id: 'attention', term: { es: 'Atención', en: 'Attention' }, def: { es: 'Mecanismo con el que cada elemento de una secuencia decide cuánto mirar a los demás: sus puntuaciones se convierten en pesos con softmax y su vector se reconstruye como la suma ponderada de los valores.', en: 'A mechanism by which each element of a sequence decides how much to look at the others: its scores become weights through softmax and its vector is rebuilt as the weighted sum of the values.' } },
    { id: 'query-key-value', term: { es: 'Consulta, clave y valor (Q, K, V)', en: 'Query, key, and value (Q, K, V)' }, def: { es: 'Los tres vectores que produce cada token: la consulta dice qué busca, la clave cómo se le puede encontrar y el valor qué aporta. Salen de multiplicar su vector por tres matrices aprendidas.', en: 'The three vectors each token produces: the query says what it seeks, the key how it can be found, and the value what it contributes. They come from multiplying its vector by three learned matrices.' } },
    { id: 'self-attention', term: { es: 'Autoatención', en: 'Self-attention' }, def: { es: 'Atención en la que consultas, claves y valores salen de la misma secuencia: cada token mira a los demás tokens de su propio texto y a sí mismo.', en: 'Attention in which queries, keys, and values come from the same sequence: each token looks at the other tokens of its own text and at itself.' } },
    { id: 'multi-head-attention', term: { es: 'Atención de varias cabezas', en: 'Multi-head attention' }, def: { es: 'Varias atenciones en paralelo, cada una con sus propias matrices para Q, K y V (una cabeza). Sus resultados se pegan y se combinan con una última matriz.', en: 'Several attentions in parallel, each with its own matrices for Q, K, and V (a head). Their results are joined and combined with a final matrix.' } },
  ],

  sources: [
    { title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: 'Bahdanau, D., Cho, K., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1409.0473' },
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., Polosukhin, I.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: 'Devlin, J., Chang, M.-W., Lee, K., Toutanova, K.', year: 2018, url: 'https://arxiv.org/abs/1810.04805' },
    { title: 'What Does BERT Look At? An Analysis of BERT’s Attention', authors: 'Clark, K., Khandelwal, U., Levy, O., Manning, C. D.', year: 2019, url: 'https://arxiv.org/abs/1906.04341' },
    { title: 'Attention is not Explanation', authors: 'Jain, S., Wallace, B. C.', year: 2019, url: 'https://arxiv.org/abs/1902.10186' },
    { title: 'Attention is not not Explanation', authors: 'Wiegreffe, S., Pinter, Y.', year: 2019, url: 'https://arxiv.org/abs/1908.04626' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
  ],
});
