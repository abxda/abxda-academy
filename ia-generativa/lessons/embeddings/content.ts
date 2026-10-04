import { defineLesson } from '../../../../../core/define';

// Lección 14 · Embeddings: el significado como geometría.
// Datos: GloVe 6B de 100 dimensiones (PDDL v1.0) → data/embeddings.json (build-vectors.py); medidas propias → data/measures.json
// (measure-data.py) y data/analogy-eval.json (eval-analogies.py); puntajes del modelo moderno → data/search-eval.json (eval-search.py).
// Las cifras de la narración están verificadas contra esos archivos y contra las fuentes primarias listadas al final.

export default defineLesson({
  id: 'embeddings',

  objectives: {
    es: [
      'Explicar por qué un vector denso y aprendido representa el significado mejor que una casilla por palabra (one-hot).',
      'Calcular la similitud coseno entre dos vectores e interpretar vecinos, mapas 2D y aritmética de significados, con sus límites.',
      'Reconocer cómo los sesgos del texto viajan al espacio de vectores y cómo evaluar una búsqueda semántica con casos propios.',
    ],
    en: [
      'Explain why a dense, learned vector represents meaning better than one slot per word (one-hot).',
      'Compute the cosine similarity between two vectors and interpret neighbors, 2D maps, and meaning arithmetic, with their limits.',
      'Recognize how the biases in text travel into vector space, and how to evaluate a semantic search with your own cases.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Un cliente escribe «quiero mi dinero de vuelta», y el artículo correcto habla de «reembolso». No comparten ni una palabra. ¿Cómo puede una máquina ver que significan lo mismo?',
      en: 'A customer writes “I want my money back,” and the right article talks about a “refund.” They share not one word. How can a machine see that they mean the same thing?',
      pad: 0.3,
    },
    {
      id: 'onehot',
      es: 'Primer intento: una casilla por palabra. Con un vocabulario de ocho palabras, «gato» es un vector de ocho números, siete ceros y un uno. Se llama codificación one-hot.',
      en: 'First attempt: one slot per word. With a vocabulary of eight words, “cat” is a vector of eight numbers, seven zeros and a one. This is called one-hot encoding.',
      tts: {
        es: 'Primer intento: una casilla por palabra. Con un vocabulario de ocho palabras, «gato» es un vector de ocho números, siete ceros y un uno. Se llama codificación guan jot.',
      },
      pad: 0.3,
    },
    {
      id: 'onehot-flaw',
      es: 'Y aquí está el defecto: todas las palabras quedan igual de lejos. «Gato» no se parece más a «perro» que a «pan»: el parecido entre dos palabras distintas es siempre cero.',
      en: 'And here is the flaw: every word ends up equally far from every other. “Cat” is no closer to “dog” than to “bread”: the similarity between any two different words is always zero.',
      pad: 0.4,
    },
    {
      id: 'dense',
      es: 'La salida son vectores cortos y densos. En vez de decenas de miles de números casi todos cero, unos cien, todos con valor, colocados para que lo parecido quede cerca.',
      en: 'The way out is short, dense vectors. Instead of tens of thousands of numbers, nearly all zero, about a hundred, each with a value, placed so that similar things end up close.',
      pad: 0.3,
    },
    {
      id: 'table',
      es: 'Esos números no los escribe nadie: se aprenden. Cada palabra tiene una fila en una tabla, y esa fila es su embedding: un vector que representa algo y que ajustan los datos.',
      en: 'Nobody writes those numbers: they are learned. Each word gets a row in a table, and that row is its embedding: a vector that stands for something and is tuned by data.',
      note: { es: 'Embedding: la fila de números aprendidos que representa una palabra.', en: 'Embedding: the row of learned numbers that represents a word.' },
      pad: 0.3,
    },
    {
      id: 'context',
      es: '¿Con qué objetivo se aprenden? Con uno simple: adivinar una palabra a partir de las que la rodean. En «mi … duerme en casa» caben perro y gato, pero no pan.',
      en: 'What is the training goal? A simple one: guess a word from the words around it. In “my … sleeps at home,” dog and cat fit, but bread does not.',
      tts: {
        es: '¿Con qué objetivo se aprenden? Con uno simple: adivinar una palabra a partir de las que la rodean. En «mi, la palabra que falta, duerme en casa» caben perro y gato, pero no pan.',
        en: 'What is the training goal? A simple one: guess a word from the words around it. In “my, the missing word, sleeps at home,” dog and cat fit, but bread does not.',
      },
      pad: 0.3,
    },
    {
      id: 'learned',
      es: 'Quien aparece en los mismos contextos acaba con vectores parecidos: nadie le dice a la máquina qué es un perro. Así lo hizo word2vec, de Mikolov y su equipo, en dos mil trece.',
      en: 'Whatever appears in the same contexts ends up with similar vectors: nobody tells the machine what a dog is. That is what word2vec did, from Mikolov and his team, in twenty thirteen.',
      tts: {
        es: 'Quien aparece en los mismos contextos acaba con vectores parecidos: nadie le dice a la máquina qué es un perro. Así lo hizo guord tu vek, de Mikolov y su equipo, en dos mil trece.',
        en: 'Whatever appears in the same contexts ends up with similar vectors: nobody tells the machine what a dog is. That is what word to vec did, from Mikolov and his team, in twenty thirteen.',
      },
      pad: 0.3,
    },
    {
      id: 'glove',
      es: 'Aquí usamos GloVe, de Stanford: seis mil millones de palabras de texto en inglés, cien números por palabra. En español mostramos la traducción. Estas son las barras reales de tres palabras.',
      en: 'Here we use GloVe, from Stanford: six billion words of English text, a hundred numbers per word. These are the real bars for three words, each number drawn as one bar.',
      tts: {
        es: 'Aquí usamos glov, de Stanford: seis mil millones de palabras de texto en inglés, cien números por palabra. En español mostramos la traducción. Estas son las barras reales de tres palabras.',
        en: 'Here we use glove, from Stanford: six billion words of English text, a hundred numbers per word. These are the real bars for three words, each number drawn as one bar.',
      },
      pad: 0.4,
    },
    {
      id: 'space',
      es: 'Cada vector es una flecha desde el origen: un punto en un espacio de cien dimensiones, el espacio vectorial. No lo podemos dibujar, pero sí medir ángulos, como en un plano.',
      en: 'Each vector is an arrow from the origin: a point in a space of a hundred dimensions, the vector space. We cannot draw it, but we can measure angles in it, as on a plane.',
      note: { es: 'Espacio vectorial: donde viven los vectores; cerca significa parecido.', en: 'Vector space: where the vectors live; close means similar.' },
      pad: 0.4,
    },
    {
      id: 'cos',
      es: 'La similitud coseno mide ese ángulo: uno si las flechas apuntan igual, cero si son perpendiculares, menos uno si se oponen. Cuenta la dirección, no la longitud.',
      en: 'Cosine similarity measures that angle: one when the arrows point the same way, zero when they are perpendicular, minus one when they oppose. Direction counts, not length.',
      note: { es: 'Similitud coseno: el coseno del ángulo entre dos vectores, de −1 a 1.', en: 'Cosine similarity: the cosine of the angle between two vectors, from −1 to 1.' },
      pad: 1.2,
    },
    {
      id: 'cos-real',
      es: 'Con los vectores reales: «perro» y «gato» dan cero coma ochenta y ocho; «perro» y «pan», cero coma treinta. Cerca en los números es cerca en significado.',
      en: 'With the real vectors: “dog” and “cat” score zero point eight eight; “dog” and “bread,” zero point three. Close in the numbers means close in meaning.',
      pad: 0.4,
    },
    {
      id: 'map',
      es: 'Para ver todo el espacio a la vez lo aplastamos a dos dimensiones, con una técnica llamada t-SNE. Cada punto es una de ochocientas ochenta palabras, y se agrupan por tema.',
      en: 'To see the whole space at once, we squash it down to two dimensions with a technique called t-SNE. Each dot is one of eight hundred eighty words, and they gather by topic.',
      tts: {
        es: 'Para ver todo el espacio a la vez lo aplastamos a dos dimensiones, con una técnica llamada te ese ene e. Cada punto es una de ochocientas ochenta palabras, y se agrupan por tema.',
        en: 'To see the whole space at once, we squash it down to two dimensions with a technique called tee S N E. Each dot is one of eight hundred eighty words, and they gather by topic.',
      },
      pad: 0.8,
    },
    {
      id: 'proj',
      es: 'Pero es una proyección, y aplastar pierde información. «Cama» y «dormir» se parecen mucho y quedan lejos; «caballo» y «gatito» casi se tocan. Menos de la mitad de los vecinos reales sobreviven.',
      en: 'But it is a projection, and squashing loses information. “Bed” and “sleep” are very alike and land far apart; “horse” and “kitten” nearly touch. Fewer than half of the true neighbors survive.',
      note: { es: 'Un mapa 2D es una proyección y pierde información: sirve para explorar, no para medir.', en: 'A 2D map is a projection and loses information: use it to explore, not to measure.' },
      pad: 0.6,
    },
    {
      id: 'neighbors',
      es: 'Los vecinos reales se calculan con las cien dimensiones, no con el mapa. Los más cercanos a «perro»: gato, mascota, cachorro, caballo. Nadie le dijo que eran animales.',
      en: 'The real neighbors are computed from all hundred dimensions, not from the map. The nearest to “dog”: cat, pet, puppy, horse. Nobody told it that these are animals.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: escribe una palabra y mira a sus vecinos más cercanos. Prueba con tres distintas, y busca una que te sorprenda.',
      en: 'Your turn: type a word and see its nearest neighbors. Try three different ones, and look for one that surprises you.',
      gate: {
        id: 'knn',
        prompt: { es: 'Escribe tres palabras distintas, o pulsa «Otra palabra», y mira a sus vecinos.', en: 'Type three different words, or press “Another word,” and look at their neighbors.' },
      },
      pad: 0.4,
    },
    {
      id: 'polysemy',
      es: 'Un límite: cada palabra tiene un solo vector. «Manzana» mezcla la fruta y la empresa, y en este texto gana la empresa: sus vecinos son Microsoft, IBM e Intel.',
      en: 'A limit: every word gets a single vector. “Apple” blends the fruit and the company, and in this text the company wins: its neighbors are Microsoft, IBM, and Intel.',
      pad: 0.4,
    },
    {
      id: 'offset',
      es: 'Algo más raro: las direcciones también significan. De Francia a París hay un desplazamiento; de Alemania a Berlín, de Japón a Tokio y de Egipto a El Cairo, casi el mismo.',
      en: 'Something stranger: directions carry meaning too. From France to Paris there is an offset; from Germany to Berlin, Japan to Tokyo, and Egypt to Cairo, nearly the same one.',
      pad: 0.5,
    },
    {
      id: 'calc',
      es: 'Así que se puede sumar y restar. «Rey» menos «hombre» más «mujer» da un vector nuevo, y la palabra más cercana a él, sin contar las tres que escribimos, es «reina».',
      en: 'So we can add and subtract. “King” minus “man” plus “woman” gives a new vector, and the word closest to it, not counting the three we typed, is “queen.”',
      note: { es: 'Aritmética de significados: rey − hombre + mujer ≈ reina.', en: 'Meaning arithmetic: king − man + woman ≈ queen.' },
      pad: 0.6,
    },
    {
      id: 'exclude',
      es: 'Pero hay truco: si no se excluyen las palabras de entrada, la más cercana es «rey» mismo. El desplazamiento mueve el vector menos de lo que parece.',
      en: 'But there is a catch: if the input words are not excluded, the closest one is “king” itself. The offset moves the vector less than it seems.',
      note: { es: 'Matiz: hay que excluir las palabras de entrada, o la respuesta suele ser una de ellas.', en: 'Caveat: the input words must be excluded, or the answer is usually one of them.' },
      pad: 0.6,
    },
    {
      id: 'limits',
      es: 'Medido con GloVe: acierta cuatro de cada cinco capitales y seis de cada siete pares de género. En el artículo de Mikolov, el mejor modelo acertó dos de cada tres preguntas variadas.',
      en: 'Measured with GloVe: it gets four in five capital questions right and six in seven gender pairs. In Mikolov’s paper, the best model got two in three of a broader mix.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: escribe una operación como «rey - hombre + mujer» y apaga «excluir las palabras escritas» para ver cómo cambia la respuesta. Busca alguna que falle.',
      en: 'Your turn: type an operation like “king - man + woman” and switch off “exclude the typed words” to see how the answer changes. Look for one that fails.',
      gate: {
        id: 'arith',
        prompt: { es: 'Prueba dos operaciones y alterna «excluir las palabras escritas» al menos una vez.', en: 'Try two operations and switch “exclude the typed words” at least once.' },
      },
      pad: 0.4,
    },
    {
      id: 'bias-intro',
      es: 'Los vectores se entrenan con texto escrito por personas y heredan lo que ese texto dice, también lo injusto. Midámoslo con estos mismos vectores, sin inventar nada.',
      en: 'Vectors are trained on text written by people, and they inherit what that text says, including what is unfair. Let us measure it with these very vectors, inventing nothing.',
      note: { es: 'Los sesgos del texto viajan al espacio de vectores.', en: 'The biases in text travel into vector space.' },
      pad: 0.3,
    },
    {
      id: 'bias-axis',
      es: 'Trazamos un eje: de un lado, qué tan cerca está una palabra de «mujer, niña, madre, esposa, hermana, hija»; del otro, de sus equivalentes masculinos. Y ubicamos profesiones.',
      en: 'We draw an axis: on one side, how close a word is to “woman, girl, mother, wife, sister, daughter”; on the other, to their male counterparts. Then we place professions.',
      pad: 1.2,
    },
    {
      id: 'bias-result',
      es: 'Resultado: «jefe», «gerente», «ingeniero» y «mecánico» se inclinan hacia las palabras masculinas; «recepcionista», «niñera» y «enfermera», hacia las femeninas. Los objetos neutros casi no se mueven.',
      en: 'Result: “boss,” “manager,” “engineer,” and “mechanic” lean toward the male words; “receptionist,” “babysitter,” and “nurse,” toward the female ones. Neutral objects barely move.',
      pad: 0.6,
    },
    {
      id: 'bias-source',
      es: 'No es un error de código: es el espejo del texto. Bolukbasi y su equipo hallaron estereotipos de género en vectores de noticias; Caliskan y colegas, sesgos humanos en GloVe.',
      en: 'It is not a code bug: it is a mirror of the text. Bolukbasi and colleagues found gender stereotypes in news vectors; Caliskan and colleagues, human-like biases in GloVe.',
      pad: 0.3,
    },
    {
      id: 'bias-fix',
      es: 'Se puede intentar corregirlo quitando esa dirección. El eje queda en cero, pero adivinar de qué lado estaba cada profesión aún acierta treinta y cinco de cincuenta y dos: el sesgo sigue en otras partes.',
      en: 'People try to fix it by removing that direction. The axis drops to zero, yet guessing which side each profession was on still gets thirty-five of fifty-two right: the bias lives elsewhere too.',
      pad: 0.3,
    },
    {
      id: 'search-intro',
      es: 'Volvamos al cliente. La búsqueda semántica convierte cada artículo y cada pregunta en un vector, y devuelve los artículos más cercanos a la pregunta, no los que repiten sus palabras.',
      en: 'Back to the customer. Semantic search turns every article and every question into a vector, and returns the articles closest to the question, not the ones that repeat its words.',
      note: { es: 'Búsqueda semántica: encontrar por cercanía de vectores, no por palabras iguales.', en: 'Semantic search: find by closeness of vectors, not by identical words.' },
      pad: 0.6,
    },
    {
      id: 'search-avg',
      es: 'Con vectores de palabras, la receta más simple es promediar: un texto es la media de los vectores de sus palabras. Así «dinero» ya acerca la pregunta al artículo de reembolsos.',
      en: 'With word vectors, the simplest recipe is to average: a text is the mean of its words’ vectors. So “money” alone already pulls the question toward the refunds article.',
      pad: 0.8,
    },
    {
      id: 'search-board',
      es: 'Probamos tres métodos con treinta y seis preguntas de soporte, ilustrativas. Por palabras exactas acierta una de cada tres; promediando vectores, algo más de la mitad; un modelo moderno de oraciones, casi todas.',
      en: 'We tested three methods on thirty-six support questions, illustrative ones. By exact words it gets two in five; by averaging vectors, about three in five; a modern sentence model, nearly all.',
      pad: 0.8,
    },
    {
      id: 'try3',
      es: 'Tu turno: escribe una pregunta propia y compara los tres métodos. Busca una donde la búsqueda por palabras se quede en cero.',
      en: 'Your turn: type a question of your own and compare the three methods. Look for one where the word search comes up empty.',
      gate: {
        id: 'search',
        prompt: { es: 'Prueba tres preguntas, tuyas o de la lista, y encuentra una donde la búsqueda por palabras no halle nada.', en: 'Try three questions, yours or from the list, and find one where the word search finds nothing.' },
      },
      pad: 0.4,
    },
    {
      id: 'order',
      es: 'El promedio ignora el orden: «el perro muerde al hombre» y «el hombre muerde al perro» dan exactamente el mismo vector. Los modelos de oraciones leen la frase entera, con atención.',
      en: 'Averaging ignores order: “the dog bites the man” and “the man bites the dog” give exactly the same vector. Sentence models read the whole phrase, with attention.',
      pad: 0.6,
    },
    {
      id: 'measure',
      es: 'Ningún método acierta todo, y con treinta y seis preguntas el margen es amplio. Antes de comprar una base vectorial, arma tus propias preguntas con su respuesta correcta y cuenta aciertos.',
      en: 'No method gets everything, and with thirty-six questions the margin is wide. Before buying a vector database, build your own questions with their correct answers and count hits.',
      note: { es: 'Mide la búsqueda con tus propios casos: pregunta + documento correcto.', en: 'Measure search with your own cases: question + correct document.' },
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: pasamos de casillas aisladas a vectores aprendidos donde cerca es parecido. Eso permite medir parecidos, buscar por significado, y también heredar sesgos.',
      en: 'In short: we moved from isolated slots to learned vectors where near means similar. That lets us measure likeness, search by meaning, and also inherit biases.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Representar es la mitad del camino. Estos vectores describen lo que ya existe: ¿puede una red generar algo que nunca existió? Esa es la pregunta de la próxima lección.',
      en: 'Representing is half the road. These vectors describe what already exists: can a network generate something that never existed? That is the question of the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'Un embedding es un vector denso y aprendido: una fila de una tabla que se ajusta con los datos, en lugar de una casilla fija por palabra.',
      'Lo que aparece en contextos parecidos acaba con vectores parecidos: el significado se vuelve ángulo y distancia.',
      'La similitud coseno compara direcciones, no longitudes. Un mapa 2D es una proyección y pierde información: sirve para explorar, no para medir.',
      'La aritmética de significados es real pero frágil: hay que excluir las palabras de entrada y funciona mejor con relaciones limpias, como país y capital.',
      'Los vectores heredan los sesgos del texto. La búsqueda semántica rescata paráfrasis, y su calidad se mide con tus propios casos.',
    ],
    en: [
      'An embedding is a dense, learned vector: a row of a table tuned by data, instead of a fixed slot per word.',
      'What shows up in similar contexts ends up with similar vectors: meaning becomes angle and distance.',
      'Cosine similarity compares directions, not lengths. A 2D map is a projection and loses information: use it to explore, not to measure.',
      'Meaning arithmetic is real but fragile: the input words must be excluded, and it works best on clean relations, such as country and capital.',
      'Vectors inherit the biases of the text. Semantic search rescues paraphrases, and its quality is measured with your own cases.',
    ],
  },

  misconception: {
    wrong: {
      es: '«Rey − hombre + mujer = reina» demuestra que el modelo entiende qué es la realeza y qué es el género.',
      en: '“King − man + woman = queen” proves that the model understands what royalty and gender are.',
    },
    right: {
      es: 'Es una regularidad geométrica real, pero frágil: solo sale excluyendo las palabras de entrada, falla con muchas relaciones, y los mismos vectores arrastran los sesgos del texto. Medir no es entender.',
      en: 'It is a real geometric regularity, but a fragile one: it only comes out when the input words are excluded, it fails on many relations, and the same vectors carry the biases of the text. Measuring is not understanding.',
    },
  },

  deeper: {
    es: `## Un embedding es una fila de una matriz

Sea $V$ el tamaño del vocabulario y $d$ la dimensión de los vectores. La tabla es una matriz $E\\in\\mathbb{R}^{V\\times d}$. La palabra de índice $i$ es el vector *one-hot* $x_i\\in\\{0,1\\}^V$ (un uno en la posición $i$, ceros en el resto) y su embedding es

$$e_i = x_i^{\\top}E = E_{i,:}$$

Multiplicar por un one-hot equivale a elegir una fila: es una capa lineal sin activación (lección 7) cuyos $V\\cdot d$ pesos se aprenden. Con $V=400\\,000$ y $d=100$ son $40\\,000\\,000$ de números. En la práctica no se multiplica: se consulta la fila. El mismo mecanismo abre los modelos de lenguaje: en GPT-2 pequeño la tabla es de $50\\,257\\times 768\\approx 38{,}6$ millones de parámetros (lecciones 20 y 22).

## Similitud coseno

$$\\cos(a,b)=\\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert}=\\cos\\theta\\in[-1,1]$$

Si los dos vectores tienen longitud 1, $\\cos(a,b)=a\\cdot b$ y $\\lVert a-b\\rVert^2=2-2\\cos(a,b)$: ordenar por coseno y ordenar por distancia euclídea da el mismo orden. Ejemplo: $a=(3,4)$ y $b=(4,3)$ dan $\\cos=\\frac{12+12}{5\\cdot 5}=0{,}96$, un ángulo de unos $16^\\circ$. Con $\\cos=0{,}88$ ("perro" y "gato") el ángulo es $\\arccos 0{,}88\\approx 28^\\circ$.

## ¿De dónde salen los números?

*Skip-gram* (Mikolov et al., 2013) maximiza la probabilidad promedio de las palabras vecinas de cada palabra $w_t$, con una ventana de tamaño $c$:

$$\\frac1T\\sum_{t=1}^{T}\\;\\sum_{-c\\le j\\le c,\\;j\\ne 0}\\log p(w_{t+j}\\mid w_t),\\qquad p(o\\mid i)=\\frac{\\exp\\!\\big(v'^{\\top}_{o}\\,v_i\\big)}{\\sum_{w=1}^{V}\\exp\\!\\big(v'^{\\top}_{w}\\,v_i\\big)}$$

Cada palabra tiene un vector de entrada $v$ (su embedding) y uno de salida $v'$. El denominador recorre todo el vocabulario, y por eso el artículo propone aproximaciones, como el muestreo negativo. GloVe (Pennington et al., 2014) ajusta en cambio

$$J=\\sum_{i,j=1}^{V} f(X_{ij})\\,\\big(w_i^{\\top}\\tilde w_j+b_i+\\tilde b_j-\\log X_{ij}\\big)^2,\\qquad f(x)=\\begin{cases}(x/100)^{3/4}&x<100\\\\ 1&\\text{si no}\\end{cases}$$

donde $X_{ij}$ cuenta cuántas veces aparece $j$ cerca de $i$ en el corpus, y se entrena con AdaGrad. Dos caminos, una misma idea: las palabras que comparten contextos acaban con vectores parecidos.

## La aritmética, paso a paso

La pregunta «$a$ es a $a^*$ como $b$ es a ...» se responde con

$$x^{*}=\\arg\\max_{x\\notin\\{a,\\,a^*,\\,b\\}}\\ \\cos\\!\\big(x,\\;a^*-a+b\\big)$$

Con vectores de longitud 1, $\\lVert a^*-a+b\\rVert$ no depende de $x$, así que esto equivale a maximizar $\\cos(x,a^*)-\\cos(x,a)+\\cos(x,b)$. La exclusión no es un detalle: Linzen (2016) midió que, sin ella, la más cercana era $b$ en el 93 % de los casos y $a^*$ en el 5 %. En esta lección, con los 100 números de GloVe y eligiendo entre sus 400 000 palabras:

| Preguntas | Con exclusión | Sin exclusión | La más cercana era una de las 3 de entrada |
|---|---|---|---|
| Capital–país (342) | 80.1 % (274) | 68.1 % | 19.3 % |
| Género (90) | 85.6 % (77) | 55.6 % | 41.1 % |

Los pares los elegí yo y son relaciones limpias; el conjunto de Mikolov et al. (19 544 preguntas, 14 tipos, y solo cuenta la palabra exacta, no sinónimos) es más difícil: su mejor modelo llegó a 65.6 %. Con solo las 880 palabras de la lección el examen es mucho más fácil (94.4 % y 85.6 %): hay menos candidatos entre los que equivocarse. Linzen añade que el método mezcla la consistencia del desplazamiento con la estructura de vecindad: no mide solo «relaciones».

## Cómo se mide el sesgo en la lección

Con $F$ = {mujer, niña, madre, esposa, hermana, hija} y $M$ = {hombre, niño, padre, esposo, hermano, hijo} (en inglés en los datos), el puntaje de una palabra $w$ es

$$s(w)=\\frac{1}{|F|}\\sum_{f\\in F}\\cos(w,f)\\;-\\;\\frac{1}{|M|}\\sum_{m\\in M}\\cos(w,m)$$

Positivo es más cerca de lo femenino. Se usan conjuntos y no un par porque «man» tiene varios sentidos. Es una versión simplificada de las pruebas de asociación de Caliskan et al. (2017). Resultado con las 52 profesiones del vocabulario: de $-0{,}16$ («boss») a $+0{,}10$ («receptionist»); 26 objetos sin género (mesa, árbol, río…) quedan entre $-0{,}05$ y $+0{,}03$. La correlación de Spearman con el puntaje «she» − «he» en GloVe completo es 0.91. El puntaje mezcla género con tema (en el texto, lo femenino aparece más junto a «vestido» o «jabón»): sirve para ver la pendiente, no para dar un veredicto sobre una persona. Si a cada vector se le resta su componente en $g=\\bar F-\\bar M$ (normalizado), el puntaje en ese eje vale 0 por construcción; aun así, adivinar si cada profesión estaba por encima o por debajo de la mediana del puntaje original, con el centroide más cercano por coseno y dejando una fuera cada vez, acierta 41 de 52 antes y 35 de 52 después (azar: 26). Es un experimento mínimo, con pocas palabras, en el espíritu del de Gonen y Goldberg (2019), quienes mostraron que los métodos para «desagregar» el sesgo en gran medida lo esconden, no lo quitan.

## Búsqueda semántica

El promedio de un texto con palabras $w_1,\\dots,w_n$ es $q=\\frac1n\\sum_k e_{w_k}$; se ordenan los documentos por $\\cos(q,D_j)$. Comparar contra $N$ documentos cuesta $O(N\\cdot d)$ por consulta, y con millones se usan índices aproximados. Los vectores de oraciones (Reimers y Gurevych, 2019) se calculan una sola vez por documento: encontrar el par más parecido entre 10 000 oraciones con BERT exige unos 50 millones de inferencias (unas 65 horas); con vectores de oraciones, unos 5 segundos. La tercera columna de la escena usa \`paraphrase-multilingual-MiniLM-L12-v2\` (Apache-2.0, 384 dimensiones, más de 50 idiomas; Reimers y Gurevych, 2020), con promedio de los vectores de salida y coseno. Sus puntajes se calcularon fuera de línea para las 36 preguntas de prueba.

Con 36 preguntas, 19 aciertos son 52.8 % con un intervalo de Wilson al 95 % de 37 % a 68 %: un margen de unos ±15 puntos. Por eso la lección 34 insiste en el tamaño de la muestra.

## En código

Con vectores de juguete (números inventados) se ve el mecanismo completo:

\`\`\`python
import numpy as np

# Tabla de embeddings de juguete: una fila por palabra, 3 números cada una (inventados; un modelo real usa cientos).
palabras = ["rey", "reina", "hombre", "mujer", "pan"]
E = np.array([
    [4.0, 3.0,  1.0],   # rey
    [4.0, 0.5, -2.0],   # reina
    [4.0, 0.0,  1.0],   # hombre
    [4.0, 0.0, -1.0],   # mujer
    [0.0, 0.5,  3.0],   # pan
])
E = E / np.linalg.norm(E, axis=1, keepdims=True)   # longitud 1: el producto punto es el coseno
fila = {w: i for i, w in enumerate(palabras)}

def coseno(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def cercanas(v, excluir=()):
    pares = [(w, round(coseno(v, E[i]), 2)) for w, i in fila.items() if w not in excluir]
    return sorted(pares, key=lambda p: -p[1])[:3]

print(round(coseno(E[fila["rey"]], E[fila["reina"]]), 2))          # rey y reina
v = E[fila["rey"]] - E[fila["hombre"]] + E[fila["mujer"]]           # rey - hombre + mujer
print(cercanas(v))                                                   # sin excluir
print(cercanas(v, excluir=["rey", "hombre", "mujer"]))               # excluyendo las tres de entrada
# 0.68
# [('rey', 0.89), ('reina', 0.87), ('mujer', 0.81)]
# [('reina', 0.87), ('pan', -0.18)]
\`\`\`

Y con los vectores reales de GloVe (el archivo \`glove.6B.100d.txt\` sale de la página de Stanford, ver las fuentes; leerlo tarda unos segundos):

\`\`\`python
import numpy as np

palabras, filas = [], []
with open("glove.6B.100d.txt", encoding="utf8") as f:
    for linea in f:
        w, _, resto = linea.partition(" ")
        palabras.append(w)
        filas.append(np.asarray(resto.split(), dtype=np.float32))
E = np.stack(filas)
E /= np.linalg.norm(E, axis=1, keepdims=True)   # longitud 1: el producto punto es el coseno
idx = {w: i for i, w in enumerate(palabras)}

def cercanas(v, k=5, excluir=()):
    s = E @ (v / np.linalg.norm(v))
    for w in excluir:
        s[idx[w]] = -1
    top = np.argsort(-s)[:k]
    return [(palabras[i], round(float(s[i]), 2)) for i in top]

print(cercanas(E[idx["dog"]], 5, excluir=["dog"]))
v = E[idx["king"]] - E[idx["man"]] + E[idx["woman"]]
print(cercanas(v, 3))
print(cercanas(v, 3, excluir=["king", "man", "woman"]))
# [('cat', 0.88), ('dogs', 0.83), ('pet', 0.74), ('puppy', 0.72), ('horse', 0.71)]
# [('king', 0.84), ('queen', 0.77), ('monarch', 0.68)]
# [('queen', 0.77), ('monarch', 0.68), ('throne', 0.68)]
\`\`\`

## De dónde salen los datos de esta lección

Vectores: GloVe 6B de 100 dimensiones (Wikipedia 2014 y Gigaword 5, 6 mil millones de palabras, 400 000 de vocabulario, solo inglés), publicado por Stanford bajo la licencia *Public Domain Dedication and License v1.0*, que permite redistribuir. Se normalizan a longitud 1 y se guardan en 8 bits (error de coseno máximo 0.0095). El mapa es t-SNE (van der Maaten y Hinton, 2008) con perplejidad 20, métrica coseno y semilla 0: Wattenberg et al. (2016) advierten que en un t-SNE el tamaño de los grupos y la distancia entre ellos pueden no significar nada. Las 10 frases de soporte y las 36 preguntas de prueba las escribió el autor de la lección: son ilustrativas. Todo se regenera con los scripts de la carpeta de la lección (\`build-vectors.py\`, \`eval-search.py\`, \`eval-analogies.py\`, \`measure-data.py\`).

## Lo que viene

Los vectores de esta lección son estáticos: una palabra, un vector. La atención (lección 21) y el transformer (lección 22) producen un vector distinto para cada palabra según la frase. La lección 15 pregunta si, además de representar lo que existe, se puede generar algo nuevo; la 18 une vectores de imágenes y de texto en un mismo espacio, y la 31 usa la búsqueda semántica para dar conocimiento propio a un modelo.`,
    en: `## An embedding is a row of a matrix

Let $V$ be the vocabulary size and $d$ the dimension of the vectors. The table is a matrix $E\\in\\mathbb{R}^{V\\times d}$. The word with index $i$ is the *one-hot* vector $x_i\\in\\{0,1\\}^V$ (a one at position $i$, zeros elsewhere) and its embedding is

$$e_i = x_i^{\\top}E = E_{i,:}$$

Multiplying by a one-hot equals picking a row: it is a linear layer with no activation (lesson 7) whose $V\\cdot d$ weights are learned. With $V=400{,}000$ and $d=100$ that is $40{,}000{,}000$ numbers. In practice nothing is multiplied: the row is looked up. The same mechanism opens language models: in the smallest GPT-2 the table is $50{,}257\\times 768\\approx 38.6$ million parameters (lessons 20 and 22).

## Cosine similarity

$$\\cos(a,b)=\\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert}=\\cos\\theta\\in[-1,1]$$

If both vectors have length 1, $\\cos(a,b)=a\\cdot b$ and $\\lVert a-b\\rVert^2=2-2\\cos(a,b)$: ranking by cosine and ranking by Euclidean distance gives the same order. Example: $a=(3,4)$ and $b=(4,3)$ give $\\cos=\\frac{12+12}{5\\cdot 5}=0.96$, an angle of about $16^\\circ$. With $\\cos=0.88$ (“dog” and “cat”) the angle is $\\arccos 0.88\\approx 28^\\circ$.

## Where do the numbers come from?

*Skip-gram* (Mikolov et al., 2013) maximizes the average probability of the neighbors of each word $w_t$, with a window of size $c$:

$$\\frac1T\\sum_{t=1}^{T}\\;\\sum_{-c\\le j\\le c,\\;j\\ne 0}\\log p(w_{t+j}\\mid w_t),\\qquad p(o\\mid i)=\\frac{\\exp\\!\\big(v'^{\\top}_{o}\\,v_i\\big)}{\\sum_{w=1}^{V}\\exp\\!\\big(v'^{\\top}_{w}\\,v_i\\big)}$$

Each word has an input vector $v$ (its embedding) and an output vector $v'$. The denominator runs over the whole vocabulary, which is why the paper proposes approximations such as negative sampling. GloVe (Pennington et al., 2014) instead fits

$$J=\\sum_{i,j=1}^{V} f(X_{ij})\\,\\big(w_i^{\\top}\\tilde w_j+b_i+\\tilde b_j-\\log X_{ij}\\big)^2,\\qquad f(x)=\\begin{cases}(x/100)^{3/4}&x<100\\\\ 1&\\text{otherwise}\\end{cases}$$

where $X_{ij}$ counts how often $j$ appears near $i$ in the corpus, trained with AdaGrad. Two roads, one idea: words that share contexts end up with similar vectors.

## The arithmetic, step by step

The question “$a$ is to $a^*$ as $b$ is to ...” is answered with

$$x^{*}=\\arg\\max_{x\\notin\\{a,\\,a^*,\\,b\\}}\\ \\cos\\!\\big(x,\\;a^*-a+b\\big)$$

With length-1 vectors, $\\lVert a^*-a+b\\rVert$ does not depend on $x$, so this equals maximizing $\\cos(x,a^*)-\\cos(x,a)+\\cos(x,b)$. The exclusion is not a detail: Linzen (2016) measured that, without it, the closest word was $b$ in 93% of cases and $a^*$ in 5%. In this lesson, with GloVe’s 100 numbers and choosing among its 400,000 words:

| Questions | With exclusion | Without exclusion | The closest was one of the 3 inputs |
|---|---|---|---|
| Capital–country (342) | 80.1% (274) | 68.1% | 19.3% |
| Gender (90) | 85.6% (77) | 55.6% | 41.1% |

I picked the pairs, and they are clean relations; the Mikolov et al. set (19,544 questions, 14 types, counting only the exact word, not synonyms) is harder: their best model reached 65.6%. With only the lesson’s 880 words the exam is far easier (94.4% and 85.6%): there are fewer candidates to get wrong. Linzen adds that the method mixes the consistency of the offset with neighborhood structure: it does not measure “relations” alone.

## How the bias is measured in the lesson

With $F$ = {woman, girl, mother, wife, sister, daughter} and $M$ = {man, boy, father, husband, brother, son}, the score of a word $w$ is

$$s(w)=\\frac{1}{|F|}\\sum_{f\\in F}\\cos(w,f)\\;-\\;\\frac{1}{|M|}\\sum_{m\\in M}\\cos(w,m)$$

Positive means closer to the female words. Sets are used rather than a pair because “man” has several senses. It is a simplified version of the association tests of Caliskan et al. (2017). Result over the 52 professions in the vocabulary: from $-0.16$ (“boss”) to $+0.10$ (“receptionist”); 26 objects with no gender (table, tree, river…) fall between $-0.05$ and $+0.03$. The Spearman correlation with the “she” − “he” score in the full GloVe is 0.91. The score mixes gender with topic (in the text, the female words show up more next to “dress” or “soap”): it shows the slope, it is not a verdict about any person. If each vector has its component along $g=\\bar F-\\bar M$ (normalized) subtracted, the score on that axis is 0 by construction; even so, guessing whether each profession was above or below the median of the original score, with the nearest cosine centroid and leaving one out at a time, gets 41 of 52 right before and 35 of 52 after (chance: 26). It is a minimal experiment, with few words, in the spirit of Gonen and Goldberg (2019), who showed that methods for “debiasing” mostly hide the bias rather than remove it.

## Semantic search

The average of a text with words $w_1,\\dots,w_n$ is $q=\\frac1n\\sum_k e_{w_k}$; documents are ranked by $\\cos(q,D_j)$. Comparing against $N$ documents costs $O(N\\cdot d)$ per query, and with millions of them approximate indexes are used. Sentence vectors (Reimers and Gurevych, 2019) are computed once per document: finding the most similar pair among 10,000 sentences with BERT takes about 50 million inferences (about 65 hours); with sentence vectors, about 5 seconds. The third column of the scene uses \`paraphrase-multilingual-MiniLM-L12-v2\` (Apache-2.0, 384 dimensions, more than 50 languages; Reimers and Gurevych, 2020), with the mean of the output vectors and cosine. Its scores were computed offline for the 36 test questions.

With 36 questions, 21 hits (the vector average on the English questions) are 58.3% with a 95% Wilson interval of 42% to 73%: a margin of about ±15 points. That is why lesson 34 insists on sample size.

## In code

With toy vectors (invented numbers) the whole mechanism is visible:

\`\`\`python
import numpy as np

# Toy embedding table: one row per word, 3 numbers each (invented; a real model uses hundreds).
words = ["king", "queen", "man", "woman", "bread"]
E = np.array([
    [4.0, 3.0,  1.0],   # king
    [4.0, 0.5, -2.0],   # queen
    [4.0, 0.0,  1.0],   # man
    [4.0, 0.0, -1.0],   # woman
    [0.0, 0.5,  3.0],   # bread
])
E = E / np.linalg.norm(E, axis=1, keepdims=True)   # length 1: the dot product is the cosine
row = {w: i for i, w in enumerate(words)}

def cosine(a, b):
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def closest(v, exclude=()):
    pairs = [(w, round(cosine(v, E[i]), 2)) for w, i in row.items() if w not in exclude]
    return sorted(pairs, key=lambda p: -p[1])[:3]

print(round(cosine(E[row["king"]], E[row["queen"]]), 2))          # king and queen
v = E[row["king"]] - E[row["man"]] + E[row["woman"]]               # king - man + woman
print(closest(v))                                                   # without excluding
print(closest(v, exclude=["king", "man", "woman"]))                 # excluding the three inputs
# 0.68
# [('king', 0.89), ('queen', 0.87), ('woman', 0.81)]
# [('queen', 0.87), ('bread', -0.18)]
\`\`\`

And with the real GloVe vectors (the file \`glove.6B.100d.txt\` comes from the Stanford page, see the sources; reading it takes a few seconds):

\`\`\`python
import numpy as np

words, rows = [], []
with open("glove.6B.100d.txt", encoding="utf8") as f:
    for line in f:
        w, _, rest = line.partition(" ")
        words.append(w)
        rows.append(np.asarray(rest.split(), dtype=np.float32))
E = np.stack(rows)
E /= np.linalg.norm(E, axis=1, keepdims=True)   # length 1: the dot product is the cosine
idx = {w: i for i, w in enumerate(words)}

def closest(v, k=5, exclude=()):
    s = E @ (v / np.linalg.norm(v))
    for w in exclude:
        s[idx[w]] = -1
    top = np.argsort(-s)[:k]
    return [(words[i], round(float(s[i]), 2)) for i in top]

print(closest(E[idx["dog"]], 5, exclude=["dog"]))
v = E[idx["king"]] - E[idx["man"]] + E[idx["woman"]]
print(closest(v, 3))
print(closest(v, 3, exclude=["king", "man", "woman"]))
# [('cat', 0.88), ('dogs', 0.83), ('pet', 0.74), ('puppy', 0.72), ('horse', 0.71)]
# [('king', 0.84), ('queen', 0.77), ('monarch', 0.68)]
# [('queen', 0.77), ('monarch', 0.68), ('throne', 0.68)]
\`\`\`

## Where this lesson’s data come from

Vectors: GloVe 6B with 100 dimensions (Wikipedia 2014 and Gigaword 5, 6 billion words, 400,000 vocabulary, English only), published by Stanford under the *Public Domain Dedication and License v1.0*, which allows redistribution. They are normalized to length 1 and stored in 8 bits (maximum cosine error 0.0095). The map is t-SNE (van der Maaten and Hinton, 2008) with perplexity 20, cosine metric, and seed 0: Wattenberg et al. (2016) warn that in a t-SNE the size of clusters and the distance between them may mean nothing. The 10 support articles and the 36 test questions were written by the lesson’s author: they are illustrative. Everything can be regenerated with the scripts in the lesson folder (\`build-vectors.py\`, \`eval-search.py\`, \`eval-analogies.py\`, \`measure-data.py\`).

## What comes next

The vectors in this lesson are static: one word, one vector. Attention (lesson 21) and the transformer (lesson 22) produce a different vector for each word depending on the sentence. Lesson 15 asks whether, besides representing what exists, a network can generate something new; lesson 18 puts image and text vectors in one shared space, and lesson 31 uses semantic search to give a model knowledge of its own.`,
  },

  lens: {
    es: [
      'Búsqueda semántica y bases vectoriales: cada documento se convierte en vector una vez y cada pregunta, al momento. Pregunta qué modelo de embeddings usan, cuántas dimensiones, en qué idiomas y con qué licencia: si cambia el modelo, hay que recalcular todo el índice.',
      'Mide la calidad con tus propios casos: unas decenas de preguntas reales, cada una con su documento correcto, y cuenta cuántas veces sale primero o entre los cinco primeros. Con treinta y seis casos el margen es de unos quince puntos; con más, la comparación se afina.',
      'Los embeddings heredan los sesgos del texto. Si ordenan personas (currículos, candidatos, clientes), pide cómo se midió el sesgo con datos de ese uso; «lo corregimos» no basta, porque quitar una dirección suele esconderlo, no eliminarlo.',
      'Señales de alerta: un mapa 2D presentado como prueba de calidad, una demo con preguntas elegidas a mano, la frase «entiende el significado» sin resultados medidos, o un modelo en inglés aplicado a textos en español sin comprobarlo.',
    ],
    en: [
      'Semantic search and vector databases: every document becomes a vector once, and every question on the spot. Ask which embedding model is used, how many dimensions, in which languages, and under what license: if the model changes, the whole index must be recomputed.',
      'Measure quality with your own cases: a few dozen real questions, each with its correct document, and count how often it comes first or among the top five. With thirty-six cases the margin is about fifteen points; with more, the comparison sharpens.',
      'Embeddings inherit the biases of the text. If they rank people (résumés, candidates, customers), ask how bias was measured on data from that use; “we fixed it” is not enough, because removing one direction usually hides the bias rather than removing it.',
      'Warning signs: a 2D map presented as proof of quality, a demo with hand-picked questions, the phrase “it understands meaning” with no measured results, or an English model applied to Spanish texts without checking it.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué un vector denso y aprendido representa mejor el significado que un vector one-hot?', en: 'Why does a dense, learned vector represent meaning better than a one-hot vector?' },
      options: [
        { es: 'Porque es más corto y ocupa menos memoria; el parecido es lo de menos.', en: 'Because it is shorter and takes less memory; similarity is beside the point.' },
        { es: 'Porque los datos lo colocan de modo que lo parecido queda cerca, mientras que en one-hot todas las palabras distintas están igual de lejos.', en: 'Because the data places it so that similar things sit close, while in one-hot all different words are equally far apart.' },
        { es: 'Porque cada número del vector tiene un significado fijo, como «animal» o «comida».', en: 'Because each number in the vector has a fixed meaning, such as “animal” or “food.”' },
        { es: 'Porque un experto escribe a mano cada fila de la tabla.', en: 'Because an expert writes each row of the table by hand.' },
      ],
      answer: 1,
      why: { es: 'En one-hot dos palabras distintas siempre tienen coseno cero. En un embedding, entrenar con contextos acerca las que se usan igual. Sus números individuales no tienen un significado fijo: el significado está en las distancias y las direcciones.', en: 'In one-hot, two different words always have cosine zero. In an embedding, training on contexts pulls together the words used alike. Its individual numbers have no fixed meaning: the meaning lives in distances and directions.' },
    },
    {
      kind: 'calc',
      q: { es: 'Dos vectores son a = (3, 4) y b = (4, 3). ¿Cuánto vale su similitud coseno?', en: 'Two vectors are a = (3, 4) and b = (4, 3). What is their cosine similarity?' },
      options: [
        { es: '0.96', en: '0.96' },
        { es: '1.00', en: '1.00' },
        { es: '0.60', en: '0.60' },
        { es: '24', en: '24' },
      ],
      answer: 0,
      why: { es: 'a·b = 3·4 + 4·3 = 24 y |a| = |b| = 5, así que cos = 24 / 25 = 0.96. Es casi 1 pero no 1: no apuntan exactamente igual. 24 es el producto punto sin dividir entre las longitudes.', en: 'a·b = 3·4 + 4·3 = 24 and |a| = |b| = 5, so cos = 24 / 25 = 0.96. It is close to 1 but not 1: they do not point exactly the same way. 24 is the dot product before dividing by the lengths.' },
    },
    {
      kind: 'concept',
      q: { es: 'Un modelo entrenado con texto de la web ubica «enfermera» más cerca de las palabras femeninas que «ingeniero». ¿Cuál es la mejor explicación?', en: 'A model trained on web text places “nurse” closer to the female words than “engineer.” What is the best explanation?' },
      options: [
        { es: 'Los ingenieros que lo programaron escribieron esa regla.', en: 'The engineers who programmed it wrote that rule.' },
        { es: 'La similitud coseno favorece a las palabras femeninas.', en: 'Cosine similarity favors female words.' },
        { es: 'Refleja los patrones del texto con que se entrenó: nadie escribió esa regla, y se mide con los propios vectores.', en: 'It reflects the patterns in the text it was trained on: nobody wrote that rule, and it can be measured in the vectors themselves.' },
        { es: 'Es un efecto del mapa t-SNE y desaparece con los vectores originales.', en: 'It is an effect of the t-SNE map and disappears with the original vectors.' },
      ],
      answer: 2,
      why: { es: 'Los vectores resumen cómo se usan las palabras en el texto, y el texto trae asociaciones sociales. El puntaje se calcula con los 100 números originales, no con el mapa, y nadie programó la regla.', en: 'Vectors summarize how words are used in the text, and text carries social associations. The score is computed from the original 100 numbers, not from the map, and nobody programmed the rule.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu equipo quiere un buscador semántico para el soporte y tres proveedores prometen «entender el significado». ¿Qué haces primero?', en: 'Your team wants a semantic search for support, and three vendors promise to “understand meaning.” What do you do first?' },
      options: [
        { es: 'Elegir al que muestre el mapa 2D más ordenado.', en: 'Pick the one that shows the tidiest 2D map.' },
        { es: 'Elegir el modelo con más dimensiones, porque más números capturan más significado.', en: 'Pick the model with the most dimensions, because more numbers capture more meaning.' },
        { es: 'Confiar en la demostración del proveedor: si encontró el ejemplo, funciona.', en: 'Trust the vendor’s demo: if it found the example, it works.' },
        { es: 'Reunir unas decenas de preguntas reales con su documento correcto y medir cuántas veces cada opción lo pone primero.', en: 'Gather a few dozen real questions with their correct document and measure how often each option puts it first.' },
      ],
      answer: 3,
      why: { es: 'Solo una evaluación con tus datos dice cuál sirve para tu caso, con tu idioma y tus documentos. El mapa 2D es una proyección que pierde información, las dimensiones no garantizan calidad y una demo elegida a mano no es una medida.', en: 'Only an evaluation on your data says which one works for your case, with your language and your documents. A 2D map is a projection that loses information, dimensions do not guarantee quality, and a hand-picked demo is not a measurement.' },
    },
  ],

  glossary: ['embedding', 'cosine-similarity', 'vector-space', 'semantic-search', 'vector', 'feature', 'layer', 'weight', 'parameter', 'gradient-descent', 'training-data'],

  terms: [
    {
      id: 'embedding',
      term: { es: 'Embedding', en: 'Embedding' },
      def: {
        es: 'Vector de números, aprendido de los datos, que representa algo (una palabra, una frase, una imagen) de modo que lo parecido quede cerca. Cada palabra tiene una fila en una tabla de embeddings.',
        en: 'A vector of numbers, learned from data, that represents something (a word, a sentence, an image) so that similar things end up close. Each word has a row in an embedding table.',
      },
    },
    {
      id: 'cosine-similarity',
      term: { es: 'Similitud coseno', en: 'Cosine similarity' },
      def: {
        es: 'Coseno del ángulo entre dos vectores: 1 si apuntan igual, 0 si son perpendiculares, −1 si se oponen. Ignora la longitud y mide solo la dirección.',
        en: 'The cosine of the angle between two vectors: 1 if they point the same way, 0 if they are perpendicular, −1 if they oppose. It ignores length and measures direction only.',
      },
    },
    {
      id: 'vector-space',
      term: { es: 'Espacio vectorial', en: 'Vector space' },
      def: {
        es: 'Espacio cuyos puntos son vectores. En un espacio de embeddings, la distancia o el ángulo entre dos puntos mide cuánto se parecen sus significados.',
        en: 'A space whose points are vectors. In an embedding space, the distance or angle between two points measures how alike their meanings are.',
      },
    },
    {
      id: 'semantic-search',
      term: { es: 'Búsqueda semántica', en: 'Semantic search' },
      def: {
        es: 'Búsqueda por significado: la consulta y los documentos se convierten en vectores y se devuelven los documentos más cercanos, aunque no compartan palabras.',
        en: 'Search by meaning: the query and the documents are turned into vectors and the closest documents are returned, even if they share no words.',
      },
    },
  ],

  sources: [
    { title: 'Efficient Estimation of Word Representations in Vector Space', authors: 'Mikolov, T., Chen, K., Corrado, G., Dean, J.', year: 2013, url: 'https://arxiv.org/abs/1301.3781' },
    { title: 'Distributed Representations of Words and Phrases and their Compositionality', authors: 'Mikolov, T., Sutskever, I., Chen, K., Corrado, G., Dean, J.', year: 2013, url: 'https://arxiv.org/abs/1310.4546' },
    { title: 'Linguistic Regularities in Continuous Space Word Representations', authors: 'Mikolov, T., Yih, W., Zweig, G.', year: 2013, url: 'https://aclanthology.org/N13-1090/' },
    { title: 'GloVe: Global Vectors for Word Representation (artículo y datos, licencia PDDL v1.0)', authors: 'Pennington, J., Socher, R., Manning, C. D.', year: 2014, url: 'https://nlp.stanford.edu/projects/glove/' },
    { title: 'Visualizing Data using t-SNE', authors: 'van der Maaten, L., Hinton, G.', year: 2008, url: 'https://www.jmlr.org/papers/v9/vandermaaten08a.html' },
    { title: 'How to Use t-SNE Effectively', authors: 'Wattenberg, M., Viégas, F., Johnson, I.', year: 2016, url: 'https://distill.pub/2016/misread-tsne/' },
    { title: 'Issues in evaluating semantic spaces using word analogies', authors: 'Linzen, T.', year: 2016, url: 'https://arxiv.org/abs/1606.07736' },
    { title: 'Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings', authors: 'Bolukbasi, T., Chang, K.-W., Zou, J., Saligrama, V., Kalai, A.', year: 2016, url: 'https://arxiv.org/abs/1607.06520' },
    { title: 'Semantics derived automatically from language corpora contain human-like biases', authors: 'Caliskan, A., Bryson, J. J., Narayanan, A.', year: 2017, url: 'https://arxiv.org/abs/1608.07187' },
    { title: 'Lipstick on a Pig: Debiasing Methods Cover up Systematic Gender Biases in Word Embeddings But do not Remove Them', authors: 'Gonen, H., Goldberg, Y.', year: 2019, url: 'https://arxiv.org/abs/1903.03862' },
    { title: 'Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks', authors: 'Reimers, N., Gurevych, I.', year: 2019, url: 'https://arxiv.org/abs/1908.10084' },
    { title: 'Making Monolingual Sentence Embeddings Multilingual using Knowledge Distillation', authors: 'Reimers, N., Gurevych, I.', year: 2020, url: 'https://arxiv.org/abs/2004.09813' },
  ],
});
