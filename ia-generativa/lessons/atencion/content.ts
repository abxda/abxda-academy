import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'atencion',

  objectives: {
    es: [
      'Explicar por qué un token necesita mirar a los demás para tener sentido, y cómo la atención decide a quién mirar y cuánto.',
      'Calcular a mano, con vectores de dos números, un producto punto, los pesos de atención con softmax y la mezcla de valores.',
      'Reconocer qué resume la fórmula softmax(QKᵀ/√d)V, para qué sirven varias cabezas y qué ganan y cuestan todos los tokens a la vez.',
    ],
    en: [
      'Explain why a token needs to look at the others to make sense, and how attention decides whom to look at and how much.',
      'Compute by hand, with two-number vectors, a dot product, the attention weights with softmax, and the blend of values.',
      'Recognize what the formula softmax(QKᵀ/√d)V sums up, what several heads are for, and what all tokens at once gains and costs.',
    ],
  },

  segments: [
    // ── el problema: una palabra con dos sentidos ──
    {
      id: 'hook',
      es: 'Lee esta frase: «Me senté en el banco de mi jardín». Aquí, un banco es un asiento.',
      en: 'Read this sentence: “I sat on the bank of the river.” Here, a bank is the land along a river.',
      pad: 0.3,
    },
    {
      id: 'hook2',
      es: 'Ahora esta: «Saqué dinero del banco». La misma palabra significa otra cosa: el lugar donde se guarda el dinero.',
      en: 'Now this one: “I took money out of the bank.” The same word means something else: the place that keeps your money.',
      pad: 0.3,
    },
    {
      id: 'look',
      es: '¿Cómo lo supiste? Miraste otras palabras: «jardín» en la primera frase, «dinero» en la segunda. Para entender una palabra, hay que mirar las demás.',
      en: 'How did you know? You looked at other words: “river” in the first sentence, “money” in the second. To understand a word, you have to look at the others.',
      pad: 0.3,
    },
    {
      id: 'vector',
      es: 'El modelo lee tokens, como vimos en la lección veinte; aquí cada palabra es un token. Y cada token entra como un vector de números, su embedding, como en la lección catorce.',
      en: 'The model reads tokens, as we saw in lesson twenty; here each word is one token. And each token comes in as a vector of numbers, its embedding, as in lesson fourteen.',
      pad: 0.3,
    },
    {
      id: 'same',
      es: 'Aquí está el problema: «banco» tiene un solo vector, el mismo en las dos frases. Con esos números, por sí solos, no se sabe cuál de los dos bancos es.',
      en: 'Here is the problem: “bank” has a single vector, the same in both sentences. Those numbers alone cannot tell which of the two banks it is.',
      pad: 0.3,
    },
    {
      id: 'idea',
      es: 'La solución se llama atención: cada token mira a los demás tokens de su frase y toma algo de los que le sirven. Así, «banco» puede tomar algo de «jardín».',
      en: 'The solution is called attention: each token looks at the other tokens in its sentence and takes something from the ones that help. So “bank” can take something from “river.”',
      note: { es: 'Atención: cada token mira a los demás y toma algo de los que le sirven.', en: 'Attention: each token looks at the others and takes something from the ones that help.' },
      pad: 0.4,
    },
    // ── a quién mirar y cuánto, sin símbolos ──
    {
      id: 'who',
      es: 'La atención responde dos preguntas. La primera: ¿a quién mirar? Para «banco», «jardín» importa mucho; «el» o «mi», casi nada.',
      en: 'Attention answers two questions. The first: whom to look at? For “bank,” “river” matters a lot; “the” or “of,” almost nothing.',
      pad: 0.4,
    },
    {
      id: 'how-much',
      es: 'La segunda: ¿cuánto? Reparte cien por ciento entre todos los tokens. En este ejemplo hecho a mano: sesenta para «jardín», veinte para «senté», diez para sí mismo y dos para cada uno de los otros.',
      en: 'The second: how much? It splits one hundred percent among all the tokens. In this handmade example: sixty to “river,” twenty to “sat,” ten to itself, and two to each of the others.',
      note: { es: 'Pesos de atención: cuánto mira un token a cada uno de los otros; suman cien por ciento.', en: 'Attention weights: how much a token looks at each of the others; they add up to one hundred percent.' },
      pad: 0.5,
    },
    {
      id: 'blend',
      es: 'Con ese reparto, «banco» se mezcla con lo que aporta cada token: mucho de «jardín», algo de «senté», casi nada de los demás. Su significado se corre hacia «asiento».',
      en: 'With that split, “bank” blends in what each token brings: a lot from “river,” some from “sat,” almost nothing from the rest. Its meaning shifts toward “riverbank.”',
      pad: 0.6,
    },
    // ── consulta, clave y valor: un buscador ──
    {
      id: 'search',
      es: '¿Y cómo decide esos pesos? Piensa en un buscador, como el de TikTok. Escribes lo que buscas, «receta de tacos»: eso es la consulta.',
      en: 'So how does it decide those weights? Think of a search bar, like TikTok’s. You type what you want, “taco recipe”: that is the query.',
      pad: 0.3,
    },
    {
      id: 'key',
      es: 'Cada video trae un título y etiquetas que dicen de qué trata: esa es su clave. El buscador compara tu consulta con cada clave y ve cuáles coinciden más.',
      en: 'Each video comes with a title and tags that say what it is about: that is its key. The search compares your query with each key to see which ones match best.',
      pad: 0.5,
    },
    {
      id: 'value',
      es: 'Y lo que ves al abrir uno es el video en sí: su valor. La clave sirve para encontrarlo; el valor es lo que te llevas.',
      en: 'And what you watch when you open one is the video itself: its value. The key is for finding it; the value is what you take away.',
      pad: 0.4,
    },
    {
      id: 'fuzzy',
      es: 'La atención hace lo mismo, con una diferencia: no te da un solo video. Te da una mezcla de todos los valores, con más de los que mejor coinciden.',
      en: 'Attention does the same, with one difference: it does not hand you a single video. It gives you a blend of all the values, with more of the best matches.',
      note: { es: 'Consulta: lo que busca un token. Clave: cómo se deja encontrar. Valor: lo que entrega.', en: 'Query: what a token is looking for. Key: how it gets found. Value: what it hands over.' },
      pad: 0.6,
    },
    // ── las cuentas, pieza por pieza ──
    {
      id: 'three',
      es: 'En el modelo, cada token produce los tres: su consulta, su clave y su valor. Salen de su embedding, con tres tablas de pesos que el modelo aprende al entrenar.',
      en: 'In the model, each token produces all three: its query, its key, and its value. They come from its embedding, through three tables of weights the model learns in training.',
      pad: 0.4,
    },
    {
      id: 'toy',
      es: 'Aquí cada uno tendrá solo dos números, escritos a mano para poder seguir las cuentas. En un modelo real tienen decenas o cientos.',
      en: 'Here each one will have just two numbers, written by hand so we can follow the arithmetic. In a real model they have dozens or hundreds.',
      pad: 0.4,
    },
    {
      id: 'dot-q',
      es: 'Empecemos con «banco», que es quien pregunta. Su consulta es uno, uno. Y la clave de «jardín» es uno, cero punto ocho.',
      en: 'Let’s start with “bank,” the one asking. Its query is one, one. And the key of “river” is one, zero point eight.',
      pad: 0.4,
    },
    {
      id: 'dot-mult',
      es: 'Para ver qué tanto coinciden, se multiplican los números que ocupan el mismo lugar: uno por uno da uno; uno por cero punto ocho, cero punto ocho.',
      en: 'To see how well they match, multiply the numbers in the same position: one times one is one; one times zero point eight, zero point eight.',
      pad: 0.5,
    },
    {
      id: 'dot-sum',
      es: 'Luego se suman: uno más cero punto ocho, uno punto ocho. Esta cuenta se llama producto punto: un solo número que dice qué tanto coinciden.',
      en: 'Then add them up: one plus zero point eight, one point eight. This calculation is called the dot product: a single number that says how well they match.',
      note: { es: 'Producto punto: multiplicar lugar por lugar y sumar; dice qué tanto coinciden dos vectores.', en: 'Dot product: multiply position by position and add; it says how well two vectors match.' },
      pad: 0.5,
    },
    {
      id: 'dot-arrows',
      es: 'Es pariente del coseno de la lección catorce. Como flechas: si apuntan hacia el mismo lado, da positivo; si son perpendiculares, cero; si se oponen, negativo.',
      en: 'It is a cousin of the cosine from lesson fourteen. As arrows: pointing the same way gives a positive number; perpendicular, zero; opposite, a negative one.',
      pad: 0.6,
    },
    {
      id: 'scores',
      es: 'Lo mismo con cada token. «Jardín» saca uno punto ocho; «senté», cero punto siete; «banco», cero; y los otros cinco, menos uno punto seis. Son las puntuaciones.',
      en: 'The same for every token. “River” scores one point eight; “sat,” zero point seven; “bank,” zero; and the other five, minus one point six. Those are the scores.',
      pad: 0.6,
    },
    {
      id: 'softmax',
      es: 'Aún no son un reparto: hay negativas y no suman cien. Lo resuelve softmax, de la lección diecinueve: la exponencial vuelve todo positivo, y dividir entre la suma hace que junten cien por ciento.',
      en: 'Not a split yet: some are negative, and they do not add up to one hundred. Softmax, from lesson nineteen, fixes that: the exponential makes all positive; dividing by the sum makes one hundred percent.',
      pad: 0.6,
    },
    {
      id: 'weights',
      es: 'Resultado: sesenta por ciento para «jardín», veinte para «senté», diez para «banco» y dos para cada uno de los otros. Son los pesos de atención del principio.',
      en: 'Result: sixty percent for “river,” twenty for “sat,” ten for “bank,” and two for each of the others. Those are the attention weights from the start.',
      pad: 0.5,
    },
    {
      id: 'values',
      es: 'Falta la mezcla. Cada token trae su valor; aquí, dos números: cuánto apunta a «asiento» y cuánto a «dinero». «Jardín» trae uno y cero; «banco», cero punto cinco y cero punto cinco.',
      en: 'Now the blend. Each token brings its value; here, two numbers: how much it points to “riverbank” and how much to “money.” “River” brings one and zero; “bank,” zero point five and zero point five.',
      pad: 0.5,
    },
    {
      id: 'mix',
      es: 'Cada valor se multiplica por su peso y todo se suma: sesenta por ciento del valor de «jardín», más veinte del de «senté», más diez del de «banco». Los otros traen ceros.',
      en: 'Each value is multiplied by its weight and everything is added up: sixty percent of the value of “river,” plus twenty of “sat,” plus ten of “bank.” The others bring zeros.',
      pad: 0.6,
    },
    {
      id: 'result',
      es: 'El nuevo vector de «banco» queda en cero punto setenta y cinco de «asiento» y cero punto cero cinco de «dinero». Ya no es ambiguo: tomó su sentido de la frase.',
      en: 'The new vector for “bank” ends up at zero point seven five for “riverbank” and zero point zero five for “money.” It is no longer ambiguous: it took its meaning from the sentence.',
      pad: 0.5,
    },
    {
      id: 'flip',
      es: 'Con «Saqué dinero del banco», la misma cuenta. La consulta de «banco» no cambia, pero ahora la clave que mejor coincide es la de «dinero», y el resultado se va hacia «dinero».',
      en: 'With “I took money out of the bank,” the same arithmetic. The query of “bank” does not change, but now the best-matching key is “money,” and the result moves toward “money.”',
      pad: 0.8,
    },
    // ── todos a la vez: el mapa de atención ──
    {
      id: 'all',
      es: 'No solo «banco» pregunta: cada token hace su propia consulta, todos al mismo tiempo, y cada uno saca su propia fila de pesos.',
      en: 'It is not only “bank” that asks: every token makes its own query, all at the same time, and each gets its own row of weights.',
      pad: 0.6,
    },
    {
      id: 'map',
      es: 'Juntas forman una tabla: el mapa de atención. Cada fila es un token que mira; cada columna, un token al que se mira. Mientras más lleno el cuadro, más peso.',
      en: 'Together they make a table: the attention map. Each row is a token doing the looking; each column, a token being looked at. The fuller the square, the more weight.',
      pad: 0.5,
    },
    {
      id: 'self',
      es: 'Como consultas, claves y valores salen de la misma frase, esto se llama autoatención: la frase se mira a sí misma.',
      en: 'Because the queries, keys, and values all come from the same sentence, this is called self-attention: the sentence looks at itself.',
      note: { es: 'Autoatención: consultas, claves y valores salen de la misma frase; cada fila del mapa suma cien por ciento.', en: 'Self-attention: queries, keys, and values come from the same sentence; each row of the map adds up to one hundred percent.' },
      pad: 0.4,
    },
    {
      id: 'map-demo',
      es: 'Mira algunas filas. «Banco» mira sobre todo a «jardín», y «jardín», a «banco». «Me» mira a «senté», y «senté», a «me».',
      en: 'Look at a few rows. “Bank” looks mostly at “river,” and “river” at “bank.” “I” looks at “sat,” and “sat” at “I.”',
      pad: 1.2,
    },
    {
      id: 'try-map',
      es: 'Si quieres, elige tú otro token y mira a quién mira. Recuerda: estos pesos son de nuestro ejemplo hecho a mano.',
      en: 'If you like, pick another token yourself and see whom it looks at. Remember: these weights come from our handmade example.',
      gate: {
        id: 'tok',
        prompt: { es: 'pulsa «Otro token» o toca una fila del mapa.', en: 'press “Next token” or tap a row of the map.' },
      },
      pad: 0.4,
    },
    // ── la fórmula, como resumen; la raíz de d ──
    {
      id: 'formula',
      es: 'Todo esto cabe en una línea. Las consultas de todos los tokens se juntan en una tabla, Q; las claves, en otra, K; y los valores, en V.',
      en: 'All of this fits in one line. The queries of all the tokens are stacked into one table, Q; the keys into another, K; and the values into V.',
      tts: {
        es: 'Todo esto cabe en una línea. Las consultas de todos los tokens se juntan en una tabla, cu; las claves, en otra, ca; y los valores, en uve.',
        en: 'All of this fits in one line. The queries of all the tokens are stacked into one table, cue; the keys into another, kay; and the values into vee.',
      },
      pad: 0.4,
    },
    {
      id: 'formula2',
      es: 'Q por K traspuesta son todos los productos punto de una vez: la tabla de puntuaciones. Softmax los vuelve pesos, y multiplicar por V mezcla los valores.',
      en: 'Q times K transposed is every dot product at once: the table of scores. Softmax turns them into weights, and multiplying by V blends the values.',
      tts: {
        es: 'Cu por ca traspuesta son todos los productos punto de una vez: la tabla de puntuaciones. Softmax los vuelve pesos, y multiplicar por uve mezcla los valores.',
        en: 'Cue times kay transposed is every dot product at once: the table of scores. Softmax turns them into weights, and multiplying by vee blends the values.',
      },
      pad: 0.6,
    },
    {
      id: 'sqrt-what',
      es: 'Queda una pieza que nos saltamos: antes de softmax, cada puntuación se divide entre la raíz de d, y d es cuántos números tiene cada clave. Aquí, dos; en modelos reales, por ejemplo, sesenta y cuatro.',
      en: 'One piece we skipped: before softmax, every score is divided by the square root of d, and d is how many numbers each key has. Here, two; in real models, sixty-four, for example.',
      tts: {
        es: 'Queda una pieza que nos saltamos: antes de softmax, cada puntuación se divide entre la raíz de dé, y dé es cuántos números tiene cada clave. Aquí, dos; en modelos reales, por ejemplo, sesenta y cuatro.',
        en: 'One piece we skipped: before softmax, every score is divided by the square root of dee, and dee is how many numbers each key has. Here, two; in real models, sixty-four, for example.',
      },
      pad: 0.4,
    },
    {
      id: 'sqrt-big',
      es: '¿Para qué? El producto punto suma un término por cada lugar. Con más lugares, las puntuaciones crecen: con d igual a sesenta y cuatro, suelen ser unas ocho veces más grandes que con d igual a uno.',
      en: 'Why? The dot product adds one term for every position. With more positions the scores grow: with d equal to sixty-four, they are typically about eight times larger than with d equal to one.',
      tts: {
        es: '¿Para qué? El producto punto suma un término por cada lugar. Con más lugares, las puntuaciones crecen: con dé igual a sesenta y cuatro, suelen ser unas ocho veces más grandes que con dé igual a uno.',
        en: 'Why? The dot product adds one term for every position. With more positions the scores grow: with dee equal to sixty-four, they are typically about eight times larger than with dee equal to one.',
      },
      pad: 0.8,
    },
    {
      id: 'sqrt-spike',
      es: 'Y con puntuaciones grandes, softmax le da casi todo el peso a un solo token y casi nada a los demás. Ahí la pendiente casi desaparece, y el modelo aprende muy despacio.',
      en: 'And with large scores, softmax gives nearly all the weight to a single token and almost none to the rest. There the slope nearly vanishes, and the model learns very slowly.',
      pad: 0.6,
    },
    {
      id: 'sqrt-fix',
      es: 'Dividir entre la raíz de d, que es ocho cuando d vale sesenta y cuatro, devuelve las puntuaciones a su tamaño de siempre, y el reparto vuelve a ser suave.',
      en: 'Dividing by the square root of d, which is eight when d is sixty-four, brings the scores back to their usual size, and the split is smooth again.',
      tts: {
        es: 'Dividir entre la raíz de dé, que es ocho cuando dé vale sesenta y cuatro, devuelve las puntuaciones a su tamaño de siempre, y el reparto vuelve a ser suave.',
        en: 'Dividing by the square root of dee, which is eight when dee is sixty-four, brings the scores back to their usual size, and the split is smooth again.',
      },
      note: { es: 'Atención = softmax(QKᵀ/√d)·V. Se divide entre √d para que softmax no le dé todo a un solo token.', en: 'Attention = softmax(QKᵀ/√d)·V. We divide by √d so softmax does not give everything to a single token.' },
      pad: 1,
    },
    // ── varias cabezas, con mapas reales ──
    {
      id: 'heads',
      es: 'Una sola atención da un solo reparto por token. Por eso los modelos usan varias cabezas: varias atenciones en paralelo, cada una con sus propias tablas de pesos y su propio mapa.',
      en: 'A single attention gives each token a single split. That is why models use several heads: several attentions in parallel, each with its own tables of weights and its own map.',
      note: { es: 'Varias cabezas: varias atenciones en paralelo, cada una con su propio mapa.', en: 'Several heads: several attentions in parallel, each with its own map.' },
      pad: 0.5,
    },
    {
      id: 'bert',
      es: 'Veamos mapas reales. BERT, un modelo de Google de dos mil dieciocho, tiene doce capas con doce cabezas cada una: ciento cuarenta y cuatro. Lo pusimos a leer nuestra frase.',
      en: 'Let’s look at real maps. BERT, a Google model from twenty eighteen, has twelve layers with twelve heads each: one hundred forty-four. We had it read our sentence.',
      pad: 0.5,
    },
    {
      id: 'head-ctx',
      es: 'En esta cabeza, «banco» pone su mayor peso en «jardín». Y cuando la misma cabeza lee «Saqué dinero del banco», lo pone en «dinero». Nadie le programó esa regla.',
      en: 'In this head, “bank” puts its largest weight on “river.” And when the same head reads “I took money out of the bank,” it puts it on “money.” Nobody programmed that rule.',
      pad: 0.8,
    },
    {
      id: 'head-others',
      es: 'Otras cabezas hacen cosas muy distintas: una mira la palabra anterior; otra, la siguiente; y otra manda casi todo a las marcas que BERT agrega al inicio y al final.',
      en: 'Other heads do very different things: one looks at the previous word; another, at the next one; and another sends almost everything to the marks BERT adds at the start and the end.',
      pad: 1.4,
    },
    {
      id: 'try-heads',
      es: 'Si quieres, cambia tú de cabeza y compara los mapas. Cada una aprendió a buscar algo distinto.',
      en: 'If you like, switch heads yourself and compare the maps. Each one learned to look for something different.',
      gate: {
        id: 'head',
        prompt: { es: 'pulsa «Otra cabeza» y compara los mapas.', en: 'press “Next head” and compare the maps.' },
      },
      pad: 0.4,
    },
    {
      id: 'honest',
      es: 'Ojo: elegimos las cabezas más claras de ciento cuarenta y cuatro; muchas no muestran un patrón así. Y un mapa dice dónde mira una cabeza, no por qué el modelo responde algo.',
      en: 'A caveat: we picked the clearest heads out of one hundred forty-four; many show no pattern like these. And a map shows where a head looks, not why the model answers something.',
      pad: 0.6,
    },
    // ── todos a la vez frente a la red recurrente ──
    {
      id: 'rnn',
      es: 'Falta una ventaja. La red recurrente de la lección doce leía en fila, un token tras otro, y lo que quedaba muy atrás llegaba apagado.',
      en: 'One more advantage. The recurrent network from lesson twelve read in a line, one token after another, and whatever lay far back arrived faded.',
      pad: 1,
    },
    {
      id: 'parallel',
      es: 'La atención no espera turno: todos los tokens calculan su fila al mismo tiempo, y cualquier par se conecta en un solo paso. Eso es justo lo que una GPU hace bien.',
      en: 'Attention does not wait its turn: every token computes its row at the same time, and any pair connects in a single step. That is exactly what a GPU does well.',
      note: { es: 'Todos los tokens a la vez: sin esperar turno, y cualquier par se conecta en un paso.', en: 'All tokens at once: no waiting for a turn, and any pair connects in one step.' },
      pad: 0.6,
    },
    {
      id: 'cost',
      es: 'El precio: cada token se compara con todos los demás. Con el doble de tokens, hay cuatro veces más comparaciones. Por eso los textos largos cuestan más.',
      en: 'The price: every token is compared with all the others. With twice the tokens, there are four times as many comparisons. That is why long texts cost more.',
      pad: 0.6,
    },
    {
      id: 'history',
      es: 'La idea nació para traducir: en dos mil catorce, Bahdanau y colegas dejaron que el traductor mirara la frase original. En dos mil diecisiete, «Attention Is All You Need» dejó solo la atención.',
      en: 'The idea began in translation: in twenty fourteen, Bahdanau and colleagues let the translator look back at the source sentence. In twenty seventeen, “Attention Is All You Need” kept only attention.',
      pad: 0.5,
    },
    // ── cierre ──
    {
      id: 'recap',
      es: 'En resumen: cada token compara su consulta con las claves de todos, softmax reparte cien por ciento y se mezclan los valores. Varias cabezas, y todos los tokens a la vez.',
      en: 'In short: each token compares its query with everyone’s keys, softmax splits one hundred percent, and the values are blended. Several heads, and all tokens at once.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'La atención es una pieza. ¿Cómo se arma con ella un modelo completo, capaz de escribir? Eso es el transformer, en la siguiente lección.',
      en: 'Attention is one piece. How do you build a complete model out of it, one that can write? That is the transformer, in the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'Una palabra puede significar cosas distintas («banco»), pero entra al modelo con un solo vector. Para entenderla hay que mirar las demás: eso hace la atención.',
      'Cada token produce una consulta (lo que busca), una clave (cómo se deja encontrar) y un valor (lo que entrega). El producto punto dice qué tanto coinciden una consulta y una clave.',
      'Softmax convierte las puntuaciones en pesos de atención que suman cien por ciento, y el nuevo vector de cada token es la mezcla de los valores con esos pesos.',
      'Todo se resume en softmax(QKᵀ/√d)·V. Se divide entre √d para que, con vectores largos, softmax no le dé todo el peso a un solo token.',
      'Varias cabezas miran cosas distintas a la vez, y todos los tokens se calculan al mismo tiempo: rápido en una GPU, pero el costo crece con el cuadrado de la longitud del texto.',
    ],
    en: [
      'A word can mean different things (“bank”), yet it enters the model with a single vector. To understand it you have to look at the others: that is what attention does.',
      'Each token produces a query (what it is looking for), a key (how it gets found), and a value (what it hands over). The dot product says how well a query and a key match.',
      'Softmax turns the scores into attention weights that add up to one hundred percent, and each token’s new vector is the blend of the values with those weights.',
      'It all sums up as softmax(QKᵀ/√d)·V. We divide by √d so that, with long vectors, softmax does not give all the weight to a single token.',
      'Several heads look at different things at once, and all tokens are computed at the same time: fast on a GPU, but the cost grows with the square of the text length.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un mapa de atención muestra por qué el modelo respondió lo que respondió: lo que «miró» es su razón.',
      en: 'An attention map shows why the model answered what it answered: what it “looked at” is its reason.',
    },
    right: {
      es: 'Muestra cómo reparte sus pesos una cabeza, en una capa. Es una pista de por dónde fluye la información, pero la respuesta depende de muchas cabezas y capas, y pesos muy distintos pueden dar la misma respuesta. Si eso cuenta como explicación sigue en debate.',
      en: 'It shows how one head, in one layer, spreads its weights. It is a clue about where information flows, but the answer depends on many heads and layers, and very different weights can give the same answer. Whether that counts as an explanation is still debated.',
    },
  },

  deeper: {
    es: `## La fórmula

Para $n$ tokens, se apilan sus consultas y claves (de $d_k$ números) y sus valores (de $d_v$) en matrices $Q,K\\in\\mathbb{R}^{n\\times d_k}$ y $V\\in\\mathbb{R}^{n\\times d_v}$:

$$\\text{Atención}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V$$

Fila por fila: la puntuación del token $i$ sobre el $j$ es $s_{ij}=q_i\\cdot k_j/\\sqrt{d_k}$; el peso es $\\alpha_{ij}=e^{s_{ij}}/\\sum_l e^{s_{il}}$ (cada fila suma 1) y la salida es $o_i=\\sum_j\\alpha_{ij}\\,v_j$. Es la «atención de producto punto escalado» de Vaswani et al. (2017), que la describen como una función que lleva una consulta y un conjunto de pares clave-valor a una salida: una suma ponderada de los valores.

En la escena, la consulta de «banco» es $q=(1,1)$ y la clave de «jardín» $k=(1,0.8)$: $q\\cdot k=1\\cdot1+1\\cdot0.8=1.8$. Las puntuaciones $1.8,\\,0.7,\\,0,\\,-1.6$ dan $e^{1.8}\\approx6.0$, $e^{0.7}\\approx2.0$, $e^{0}=1$ y $e^{-1.6}\\approx0.2$; la suma es $\\approx10$, y los pesos, $60\\,\\%$, $20\\,\\%$, $10\\,\\%$ y $2\\,\\%$. La escena no divide entre $\\sqrt{2}$ para que las cuentas se sigan de cabeza; con la división, los pesos serían $46\\,\\%$, $21\\,\\%$, $13\\,\\%$ y $4\\,\\%$, y el vector nuevo, $(0.63,\\,0.06)$ en vez de $(0.75,\\,0.05)$: el mismo lado, menos marcado. Todos los números del ejemplo están escritos a mano (ver \`data.ts\`).

## De dónde salen Q, K y V

Si $X$ es la matriz de vectores de entrada (embeddings; en un transformer, más la posición), $Q=XW^Q$, $K=XW^K$ y $V=XW^V$. Esas tres matrices son los parámetros que se aprenden; los pesos $\\alpha_{ij}$ **no**: se calculan de nuevo para cada frase. En la autoatención, $Q$, $K$ y $V$ salen de la misma $X$. En la atención de Bahdanau et al. (2014), para traducir, las consultas venían del decodificador y las claves y valores del codificador, y la puntuación era una red pequeña, $e_{ij}=a(s_{i-1},h_j)$, en lugar de un producto punto; los pesos eran el mismo softmax y el resultado, la misma suma ponderada $c_i=\\sum_j\\alpha_{ij}h_j$. Los autores lo dicen así: el decodificador decide a qué partes de la frase de origen prestar atención.

## Por qué $\\sqrt{d_k}$

Si las componentes de $q$ y $k$ son independientes, con media 0 y varianza 1, el producto $q\\cdot k=\\sum_{i=1}^{d_k}q_ik_i$ tiene media 0 y varianza $d_k$ (nota 4 de Vaswani et al., 2017): su tamaño típico es $\\sqrt{d_k}$, ocho con $d_k=64$. Dividir entre $\\sqrt{d_k}$ devuelve la varianza a 1. Sin ello, el softmax se satura: si $\\alpha=\\text{softmax}(s)$, entonces $\\partial\\alpha_i/\\partial s_j=\\alpha_i(\\delta_{ij}-\\alpha_j)$, que tiende a 0 cuando un peso se acerca a 1 y los demás a 0. Es la «pendiente casi nula» de la narración. Con ocho claves al azar y $d_k=64$, el peso mayor promedia $0.89$ sin dividir y $0.36$ dividiendo (100 sorteos; el sorteo de la escena da $0.98$ y $0.35$).

## Varias cabezas

$$\\text{MultiHead}(Q,K,V)=\\text{Concat}(\\text{cabeza}_1,\\dots,\\text{cabeza}_h)\\,W^O,\\qquad \\text{cabeza}_i=\\text{Atención}(XW_i^Q,\\,XW_i^K,\\,XW_i^V)$$

Según Vaswani et al. (2017), varias cabezas permiten atender a la vez a información de distintos «subespacios» de representación; con una sola, el promedio lo impide. En su modelo base, $h=8$ y $d_k=d_v=512/8=64$, así que ocho cabezas cuestan casi lo mismo que una grande. BERT base tiene 12 capas de 12 cabezas (144) con 768 dimensiones, es decir, $768/12=64$ por cabeza (Devlin et al., 2018).

## Los mapas reales de la lección

Se calcularon con \`real-attention.py\` (en la carpeta de la lección; corre en CPU): \`bert-base-uncased\` para el inglés y \`bert-base-multilingual-cased\` para el español, ambos con licencia Apache-2.0 y revisión fijada. Son los pesos de una sola cabeza tras softmax, sin promediar; las piezas de una palabra se suman. La cabeza de «banco» se eligió así: entre las cabezas en las que el mayor peso de «banco» cae en la palabra que decide su sentido en las dos frases (jardín y dinero), la de mayor suma de esos dos pesos. Solo 4 de 144 cumplen esa condición en español (capa 1, cabeza 4: 44 % y 65 %) y 6 de 144 en inglés (capa 3, cabeza 11: 93 % y 60 %). En cambio, el mayor peso de «banco» cae en una marca ([CLS], [SEP] o el punto) en 58 de 144 cabezas en español y en 113 de 144 en inglés. Las otras tres son las de mayor peso promedio en la palabra anterior, en la siguiente y en las marcas. Clark et al. (2019) describen estos mismos tipos de cabeza en BERT: las que miran a los delimitadores, las que miran a una posición fija y las que miran a toda la frase.

## Costo

La matriz de pesos es $n\\times n$: el cómputo por capa crece como $O(n^2\\cdot d)$. Una capa recurrente cuesta $O(n\\cdot d^2)$, pero necesita $O(n)$ pasos uno tras otro, y la información entre dos posiciones recorre un camino de longitud $O(n)$; en la autoatención, ambos son $O(1)$ (tabla 1 de Vaswani et al., 2017). Por eso la atención aprovecha bien una GPU, y por eso los contextos largos son caros.

## En código

\`\`\`python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V, scale=True):
    d = K.shape[-1]
    scores = Q @ K.T                     # productos punto: qué tanto coincide cada consulta con cada clave
    if scale:
        scores = scores / np.sqrt(d)     # la pieza que la escena deja para el final
    weights = softmax(scores)            # cada fila suma 1
    return weights @ V, weights          # mezcla ponderada de los valores

# «Me senté en el banco de mi jardín»: los números de la escena (d = 2)
K = np.array([[-1.6, 0], [-0.3, 1], [-0.8, -0.8], [-0.8, -0.8],
              [0.5, -0.5], [-0.8, -0.8], [-0.8, -0.8], [1, 0.8]])
V = np.array([[0, 0], [0.5, 0], [0, 0], [0, 0],
              [0.5, 0.5], [0, 0], [0, 0], [1, 0]])     # (asiento, dinero)
q = np.array([[1.0, 1.0]])                          # la consulta de «banco»

out, w = attention(q, K, V, scale=False)
print(np.round(w, 2), np.round(out, 2))
out, w = attention(q, K, V)                          # con la división entre √2
print(np.round(w, 2), np.round(out, 2))
# [[0.02 0.2  0.02 0.02 0.1  0.02 0.02 0.6 ]] [[0.75 0.05]]
# [[0.04 0.21 0.04 0.04 0.13 0.04 0.04 0.46]] [[0.63 0.06]]
\`\`\`

Y la comprobación de $\\sqrt{d}$: la desviación típica de $q\\cdot k$ crece como $\\sqrt{d}$; al dividir, queda en 1.

\`\`\`python
rng = np.random.default_rng(0)
for d in (1, 2, 64, 512):
    q = rng.standard_normal((20000, d))
    k = rng.standard_normal((20000, d))
    s = (q * k).sum(axis=1)                         # 20 000 productos punto q·k
    print(d, round(s.std(), 1), round((s / np.sqrt(d)).std(), 2))
# 1 1.0 1.0
# 2 1.4 1.0
# 64 8.0 1.0
# 512 22.6 1.0
\`\`\`

## Lo que viene

Falta lo que la atención sola no hace: no sabe el orden de las palabras (si se barajan, cada token reparte lo mismo entre los mismos tokens), y al escribir texto cada token solo puede mirar hacia atrás (antes del softmax se pone $-\\infty$ en las puntuaciones que miran al futuro). Con una codificación de posición, esa máscara, una red por token, conexiones residuales y normalización, se apilan bloques: el transformer, en la lección 22.`,
    en: `## The formula

For $n$ tokens, their queries and keys (with $d_k$ numbers) and their values (with $d_v$) are stacked into matrices $Q,K\\in\\mathbb{R}^{n\\times d_k}$ and $V\\in\\mathbb{R}^{n\\times d_v}$:

$$\\text{Attention}(Q,K,V)=\\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}}\\right)V$$

Row by row: the score of token $i$ on token $j$ is $s_{ij}=q_i\\cdot k_j/\\sqrt{d_k}$; the weight is $\\alpha_{ij}=e^{s_{ij}}/\\sum_l e^{s_{il}}$ (each row adds up to 1) and the output is $o_i=\\sum_j\\alpha_{ij}\\,v_j$. This is the “scaled dot-product attention” of Vaswani et al. (2017), who describe attention as a function that maps a query and a set of key-value pairs to an output: a weighted sum of the values.

In the scene, the query of “bank” is $q=(1,1)$ and the key of “river” is $k=(1,0.8)$: $q\\cdot k=1\\cdot1+1\\cdot0.8=1.8$. The scores $1.8,\\,0.7,\\,0,\\,-1.6$ give $e^{1.8}\\approx6.0$, $e^{0.7}\\approx2.0$, $e^{0}=1$, and $e^{-1.6}\\approx0.2$; the sum is $\\approx10$, and the weights are $60\\%$, $20\\%$, $10\\%$, and $2\\%$. The scene does not divide by $\\sqrt{2}$ so the arithmetic can be followed in your head; with the division, the weights would be $46\\%$, $21\\%$, $13\\%$, and $4\\%$, and the new vector $(0.63,\\,0.06)$ instead of $(0.75,\\,0.05)$: the same side, less pronounced. All the numbers in the example are written by hand (see \`data.ts\`).

## Where Q, K, and V come from

If $X$ is the matrix of input vectors (embeddings; in a transformer, plus position), $Q=XW^Q$, $K=XW^K$, and $V=XW^V$. Those three matrices are the parameters that are learned; the weights $\\alpha_{ij}$ are **not**: they are computed anew for each sentence. In self-attention, $Q$, $K$, and $V$ all come from the same $X$. In the attention of Bahdanau et al. (2014), built for translation, the queries came from the decoder and the keys and values from the encoder, and the score was a small network, $e_{ij}=a(s_{i-1},h_j)$, rather than a dot product; the weights were the same softmax and the result the same weighted sum $c_i=\\sum_j\\alpha_{ij}h_j$. In the authors’ words, the decoder decides which parts of the source sentence to pay attention to.

## Why $\\sqrt{d_k}$

If the components of $q$ and $k$ are independent with mean 0 and variance 1, the product $q\\cdot k=\\sum_{i=1}^{d_k}q_ik_i$ has mean 0 and variance $d_k$ (footnote 4 of Vaswani et al., 2017): its typical size is $\\sqrt{d_k}$, eight when $d_k=64$. Dividing by $\\sqrt{d_k}$ brings the variance back to 1. Without it, softmax saturates: if $\\alpha=\\text{softmax}(s)$, then $\\partial\\alpha_i/\\partial s_j=\\alpha_i(\\delta_{ij}-\\alpha_j)$, which goes to 0 as one weight approaches 1 and the rest approach 0. That is the “slope that nearly vanishes” in the narration. With eight random keys and $d_k=64$, the largest weight averages $0.89$ unscaled and $0.36$ scaled (100 draws; the scene’s draw gives $0.98$ and $0.35$).

## Several heads

$$\\text{MultiHead}(Q,K,V)=\\text{Concat}(\\text{head}_1,\\dots,\\text{head}_h)\\,W^O,\\qquad \\text{head}_i=\\text{Attention}(XW_i^Q,\\,XW_i^K,\\,XW_i^V)$$

According to Vaswani et al. (2017), several heads let the model attend at once to information from different representation “subspaces”; with a single head, averaging inhibits this. In their base model, $h=8$ and $d_k=d_v=512/8=64$, so eight heads cost about the same as one big one. BERT base has 12 layers of 12 heads (144) with 768 dimensions, that is, $768/12=64$ per head (Devlin et al., 2018).

## The lesson’s real maps

They were computed with \`real-attention.py\` (in the lesson folder; it runs on a CPU): \`bert-base-uncased\` for English and \`bert-base-multilingual-cased\` for Spanish, both Apache-2.0 with a pinned revision. They are the weights of a single head after softmax, not averaged; the pieces of a word are added up. The “bank” head was chosen like this: among the heads in which the largest weight of “bank” falls on the word that decides its meaning in both sentences (river and money), the one with the largest sum of those two weights. Only 6 of 144 heads meet that condition in English (layer 3, head 11: 93% and 60%) and 4 of 144 in Spanish (layer 1, head 4: 44% and 65%). By contrast, the largest weight of “bank” falls on a mark ([CLS], [SEP], or the period) in 113 of 144 heads in English and 58 of 144 in Spanish. The other three are the heads with the largest average weight on the previous word, on the next word, and on the marks. Clark et al. (2019) describe these same kinds of heads in BERT: heads that attend to delimiter tokens, to a fixed positional offset, and broadly over the whole sentence.

## Cost

The weight matrix is $n\\times n$: the compute per layer grows as $O(n^2\\cdot d)$. A recurrent layer costs $O(n\\cdot d^2)$, but it needs $O(n)$ steps one after another, and information between two positions travels a path of length $O(n)$; in self-attention both are $O(1)$ (Table 1 of Vaswani et al., 2017). That is why attention makes good use of a GPU, and why long contexts are expensive.

## In code

\`\`\`python
import numpy as np

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V, scale=True):
    d = K.shape[-1]
    scores = Q @ K.T                     # dot products: how well each query matches each key
    if scale:
        scores = scores / np.sqrt(d)     # the piece the scene leaves for the end
    weights = softmax(scores)            # each row adds up to 1
    return weights @ V, weights          # weighted blend of the values

# "I sat on the bank of the river": the scene's numbers (d = 2)
K = np.array([[-1.6, 0], [-0.3, 1], [-0.8, -0.8], [-0.8, -0.8],
              [0.5, -0.5], [-0.8, -0.8], [-0.8, -0.8], [1, 0.8]])
V = np.array([[0, 0], [0.5, 0], [0, 0], [0, 0],
              [0.5, 0.5], [0, 0], [0, 0], [1, 0]])     # (riverbank, money)
q = np.array([[1.0, 1.0]])                          # the query of "bank"

out, w = attention(q, K, V, scale=False)
print(np.round(w, 2), np.round(out, 2))
out, w = attention(q, K, V)                          # with the division by √2
print(np.round(w, 2), np.round(out, 2))
# [[0.02 0.2  0.02 0.02 0.1  0.02 0.02 0.6 ]] [[0.75 0.05]]
# [[0.04 0.21 0.04 0.04 0.13 0.04 0.04 0.46]] [[0.63 0.06]]
\`\`\`

And the check of $\\sqrt{d}$: the standard deviation of $q\\cdot k$ grows as $\\sqrt{d}$; after dividing, it stays at 1.

\`\`\`python
rng = np.random.default_rng(0)
for d in (1, 2, 64, 512):
    q = rng.standard_normal((20000, d))
    k = rng.standard_normal((20000, d))
    s = (q * k).sum(axis=1)                         # 20,000 dot products q·k
    print(d, round(s.std(), 1), round((s / np.sqrt(d)).std(), 2))
# 1 1.0 1.0
# 2 1.4 1.0
# 64 8.0 1.0
# 512 22.6 1.0
\`\`\`

## What comes next

What attention alone does not do: it does not know word order (shuffle the words and each token spreads the same weights over the same tokens), and when writing text each token may only look back ($-\\infty$ is placed on the scores that look at the future, before the softmax). With a position encoding, that mask, a network per token, residual connections, and normalization, blocks are stacked: the transformer, in lesson 22.`,
  },

  lens: {
    es: [
      'Cada token se compara con todos los demás: el costo de la atención crece con el cuadrado del contexto. Duplicar el texto cuesta unas cuatro veces más comparaciones; es una de las razones por las que los contextos largos son caros (lecciones 26 y 30).',
      'Un mapa de atención no es una explicación. Si un proveedor muestra «a qué miró el modelo» como justificación de una respuesta, pide además pruebas con casos tuyos y medidas de calidad (lecciones 33 y 34).',
      'Todo lo que está en el contexto puede influir en todo lo demás: la arquitectura no distingue por sí sola entre una instrucción tuya y un documento ajeno. De ahí el riesgo de inyección de instrucciones: separa y valida lo que entra (lección 35).',
      'Más contexto no garantiza más comprensión: con más tokens, la atención se reparte entre más candidatos. Prueba con tus documentos largos y no supongas que el modelo usa todo por igual (lección 30).',
    ],
    en: [
      'Every token is compared with all the others: the cost of attention grows with the square of the context. Doubling the text costs about four times as many comparisons; it is one of the reasons long contexts are expensive (lessons 26 and 30).',
      'An attention map is not an explanation. If a vendor shows “what the model looked at” as the justification for an answer, also ask for tests with your own cases and quality measures (lessons 33 and 34).',
      'Everything in the context can influence everything else: the architecture does not tell your instruction apart from a stranger’s document on its own. Hence the risk of prompt injection: separate and validate what comes in (lesson 35).',
      'More context does not guarantee more understanding: with more tokens, attention spreads across more candidates. Test with your own long documents and do not assume the model uses everything equally (lesson 30).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En la atención, ¿qué papel cumple la clave de un token?', en: 'In attention, what role does a token’s key play?' },
      options: [
        { es: 'Es lo que el token entrega a quien lo mira.', en: 'It is what the token hands over to whoever looks at it.' },
        { es: 'Es lo que se compara con la consulta para ver qué tanto coinciden.', en: 'It is what gets compared with the query to see how well they match.' },
        { es: 'Es la posición del token dentro de la frase.', en: 'It is the token’s position within the sentence.' },
        { es: 'Es la probabilidad de que sea la siguiente palabra.', en: 'It is the probability that it is the next word.' },
      ],
      answer: 1,
      why: { es: 'La consulta se compara con cada clave mediante el producto punto, como tu búsqueda con las etiquetas de cada video. Lo que se mezcla después son los valores, no las claves.', en: 'The query is compared with each key through the dot product, like your search against each video’s tags. What gets blended afterward are the values, not the keys.' },
    },
    {
      kind: 'calc',
      q: { es: 'La consulta de un token es (2, 1) y la clave de otro es (1, 3). ¿Cuál es su producto punto?', en: 'One token’s query is (2, 1) and another token’s key is (1, 3). What is their dot product?' },
      options: [
        { es: '(2, 3)', en: '(2, 3)' },
        { es: '7', en: '7' },
        { es: '5', en: '5' },
        { es: '6', en: '6' },
      ],
      answer: 2,
      why: { es: 'Se multiplica lugar por lugar y se suma: 2 · 1 + 1 · 3 = 2 + 3 = 5. El producto punto es un solo número, no un vector.', en: 'Multiply position by position and add: 2 · 1 + 1 · 3 = 2 + 3 = 5. The dot product is a single number, not a vector.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Para qué se divide entre √d antes del softmax?', en: 'Why do we divide by √d before the softmax?' },
      options: [
        { es: 'Para que, con vectores largos, softmax no le dé casi todo el peso a un solo token.', en: 'So that, with long vectors, softmax does not give nearly all the weight to a single token.' },
        { es: 'Para que las puntuaciones sean siempre negativas.', en: 'So the scores are always negative.' },
        { es: 'Para que los pesos sumen cien por ciento.', en: 'So the weights add up to one hundred percent.' },
        { es: 'Para ahorrar memoria en la GPU.', en: 'To save memory on the GPU.' },
      ],
      answer: 0,
      why: { es: 'Con d grande, las puntuaciones crecen como √d y softmax se vuelve un «todo o nada» en el que casi no hay pendiente para aprender. Que los pesos sumen cien por ciento lo garantiza softmax por sí mismo.', en: 'With large d, the scores grow like √d and softmax turns into “all or nothing,” with almost no slope to learn from. That the weights add up to one hundred percent is guaranteed by softmax itself.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo pasa de enviar textos de 4 000 a 8 000 tokens sin cambiar nada más. ¿Qué esperar del número de comparaciones de atención?', en: 'A team goes from sending 4,000-token texts to 8,000-token texts, changing nothing else. What should it expect for the number of attention comparisons?' },
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

  glossary: ['token', 'embedding', 'vector', 'cosine-similarity', 'softmax', 'weight', 'layer', 'gradient', 'rnn', 'gpu', 'attention', 'query-key-value', 'self-attention', 'multi-head-attention'],

  terms: [
    { id: 'attention', term: { es: 'Atención', en: 'Attention' }, def: { es: 'Mecanismo con el que cada token decide cuánto mirar a los demás: compara su consulta con las claves de todos, convierte las puntuaciones en pesos con softmax y arma su nuevo vector como la mezcla de los valores con esos pesos.', en: 'A mechanism by which each token decides how much to look at the others: it compares its query with everyone’s keys, turns the scores into weights with softmax, and builds its new vector as the blend of the values with those weights.' } },
    { id: 'query-key-value', term: { es: 'Consulta, clave y valor (Q, K, V)', en: 'Query, key, and value (Q, K, V)' }, def: { es: 'Los tres vectores que produce cada token: la consulta dice qué busca, la clave cómo se le encuentra y el valor qué entrega. Salen de multiplicar su vector por tres matrices de pesos aprendidas.', en: 'The three vectors each token produces: the query says what it is looking for, the key how it gets found, and the value what it hands over. They come from multiplying its vector by three learned weight matrices.' } },
    { id: 'self-attention', term: { es: 'Autoatención', en: 'Self-attention' }, def: { es: 'Atención en la que consultas, claves y valores salen de la misma secuencia: cada token mira a los demás tokens de su propio texto, y a sí mismo.', en: 'Attention in which queries, keys, and values come from the same sequence: each token looks at the other tokens of its own text, and at itself.' } },
    { id: 'multi-head-attention', term: { es: 'Atención de varias cabezas', en: 'Multi-head attention' }, def: { es: 'Varias atenciones en paralelo, cada una (una cabeza) con sus propias matrices para Q, K y V y su propio mapa. Sus resultados se juntan y se combinan con una última matriz.', en: 'Several attentions in parallel, each one (a head) with its own matrices for Q, K, and V and its own map. Their results are joined and combined with a final matrix.' } },
  ],

  sources: [
    { title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: 'Bahdanau, D., Cho, K., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1409.0473' },
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., Polosukhin, I.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: 'Devlin, J., Chang, M.-W., Lee, K., Toutanova, K.', year: 2018, url: 'https://arxiv.org/abs/1810.04805' },
    { title: 'bert-base-uncased (ficha del modelo; Apache-2.0)', authors: 'Google; Hugging Face', year: 2018, url: 'https://huggingface.co/google-bert/bert-base-uncased' },
    { title: 'bert-base-multilingual-cased (ficha del modelo; Apache-2.0)', authors: 'Google; Hugging Face', year: 2018, url: 'https://huggingface.co/google-bert/bert-base-multilingual-cased' },
    { title: 'What Does BERT Look At? An Analysis of BERT’s Attention', authors: 'Clark, K., Khandelwal, U., Levy, O., Manning, C. D.', year: 2019, url: 'https://arxiv.org/abs/1906.04341' },
    { title: 'Attention is not Explanation', authors: 'Jain, S., Wallace, B. C.', year: 2019, url: 'https://arxiv.org/abs/1902.10186' },
    { title: 'Attention is not not Explanation', authors: 'Wiegreffe, S., Pinter, Y.', year: 2019, url: 'https://arxiv.org/abs/1908.04626' },
  ],
});
