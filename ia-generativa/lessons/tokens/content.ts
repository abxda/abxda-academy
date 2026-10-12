import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'tokens',

  objectives: {
    es: [
      'Explicar qué recibe de verdad un modelo de lenguaje: tokens, piezas de texto de un vocabulario fijo, convertidas en números.',
      'Describir cómo BPE arma el vocabulario contando las parejas de piezas vecinas y fusionando la más frecuente, una y otra vez.',
      'Estimar el costo de un texto en tokens y anticipar cuándo cuesta más: palabras raras, otros idiomas, otro tokenizador.',
    ],
    en: [
      'Explain what a language model really receives: tokens, pieces of text from a fixed vocabulary, turned into numbers.',
      'Describe how BPE builds the vocabulary by counting pairs of neighboring pieces and merging the most frequent one, again and again.',
      'Estimate the cost of a text in tokens and anticipate when it costs more: rare words, other languages, another tokenizer.',
    ],
  },

  segments: [
    // ── 1. Lo que recibe el modelo ─────────────────────────────────────────
    {
      id: 'hook',
      es: 'En la lección anterior dijimos que el modelo predice la siguiente palabra. Era una simplificación. Veamos qué recibe de verdad cuando le escribes esta frase.',
      en: 'In the last lesson we said the model predicts the next word. That was a simplification. Let’s see what it really receives when you type this sentence.',
    },
    {
      id: 'cut',
      es: 'Antes de llegar al modelo, un programa la corta en piezas. «Mi», «gato», «se» y «llama» quedan enteras; el nombre raro se parte en cinco trozos.',
      en: 'Before it reaches the model, a program cuts it into pieces. “My”, “cat”, “is” and “named” stay whole; the rare name breaks into five chunks.',
      pad: 0.3,
    },
    {
      id: 'ids',
      es: 'Cada pieza tiene un número fijo, su lugar en una lista. Como en la lección dos, el texto se vuelve números: al modelo solo le llega esta fila.',
      en: 'Each piece has a fixed number, its place on a list. As in lesson two, text becomes numbers: only this row reaches the model.',
      pad: 0.3,
    },
    {
      id: 'token',
      es: 'Esas piezas se llaman tokens. Un token puede ser una palabra completa, un trozo de palabra o un signo, como el punto.',
      en: 'These pieces are called tokens. A token can be a whole word, a chunk of a word, or a symbol, like the period.',
      note: { es: 'Token: una pieza de texto; puede ser palabra, trozo o signo.', en: 'Token: a piece of text; a word, a chunk, or a symbol.' },
      pad: 0.3,
    },
    {
      id: 'tokenizer',
      es: 'El programa que hace los cortes se llama tokenizador. Se prepara una sola vez, antes de entrenar al modelo, y después ya no cambia.',
      en: 'The program that makes the cuts is called a tokenizer. It is built once, before the model is trained, and then it never changes.',
    },
    {
      id: 'vocab',
      es: 'La lista de todas las piezas que conoce, cada una con su número, es su vocabulario. El de GPT-4o tiene unas doscientas mil piezas.',
      en: 'The list of every piece it knows, each with its number, is its vocabulary. GPT-4o’s has about two hundred thousand pieces.',
      tts: {
        es: 'La lista de todas las piezas que conoce, cada una con su número, es su vocabulario. El de ge pe te cuatro o tiene unas doscientas mil piezas.',
        en: 'The list of every piece it knows, each with its number, is its vocabulary. G P T four oh’s has about two hundred thousand pieces.',
      },
      note: { es: 'Tokenizador: corta el texto. Vocabulario: su lista de piezas, cada una con su número.', en: 'Tokenizer: cuts the text. Vocabulary: its list of pieces, each with its number.' },
      pad: 0.3,
    },

    // ── 2. Ni letras ni palabras ───────────────────────────────────────────
    {
      id: 'letters',
      es: '¿Por qué no leer letra por letra? La lista sería cortísima, pero esta frase ya serían treinta piezas, y el modelo trabaja pieza por pieza: todo sería más lento y caro.',
      en: 'Why not read letter by letter? The list would be tiny, but this sentence alone would be twenty-nine pieces, and the model works piece by piece: everything would be slower and costlier.',
      pad: 0.3,
    },
    {
      id: 'words',
      es: '¿Y palabra por palabra? La frase queda en solo cinco piezas. Pero la lista tendría que traer cada palabra del idioma, con todos sus plurales y conjugaciones.',
      en: 'And word by word? The sentence shrinks to just five pieces. But the list would need every word in the language, with all its plurals and verb forms.',
      pad: 0.3,
    },
    {
      id: 'words-new',
      es: 'Y siempre aparecen palabras nuevas: nombres, marcas, errores de dedo. Lo que no está en la lista no se podría leer, y Quetzalcóatl se quedaría fuera.',
      en: 'And new words keep appearing: names, brands, typos. Anything not on the list couldn’t be read, and Quetzalcoatl would be left out.',
      tts: {
        es: 'Y siempre aparecen palabras nuevas: nombres, marcas, errores de dedo. Lo que no está en la lista no se podría leer, y Quetzalcóatl se quedaría fuera.',
        en: 'And new words keep appearing: names, brands, typos. Anything not on the list couldn’t be read, and Ketsalkoatl would be left out.',
      },
    },
    {
      id: 'middle',
      es: 'Los tokens son el punto medio: lo común es una sola pieza y lo raro se arma con trozos. Así la lista es finita y, aun así, nada queda fuera.',
      en: 'Tokens are the middle ground: common things are a single piece and rare things are built from chunks. So the list is finite, and still nothing is left out.',
      note: { es: 'Lo común, una pieza; lo raro, varios trozos.', en: 'Common: one piece. Rare: several chunks.' },
      pad: 0.3,
    },

    // ── 3. BPE, en pequeño ──────────────────────────────────────────────────
    {
      id: 'bpe-q',
      es: '¿Y quién decide qué trozos entran en la lista? Nadie los elige a mano: los encuentra un algoritmo que cuenta en mucho texto. Se llama BPE.',
      en: 'And who decides which chunks go on the list? Nobody picks them by hand: an algorithm finds them by counting over lots of text. It’s called BPE.',
      tts: {
        es: '¿Y quién decide qué trozos entran en la lista? Nadie los elige a mano: los encuentra un algoritmo que cuenta en mucho texto. Se llama be pe e.',
        en: 'And who decides which chunks go on the list? Nobody picks them by hand: an algorithm finds them by counting over lots of text. It’s called B P E.',
      },
    },
    {
      id: 'corpus',
      es: 'Veámoslo en pequeño. Este es todo nuestro texto de entrenamiento: cinco palabras, con las veces que aparece cada una. Al principio, cada palabra se parte en letras.',
      en: 'Let’s see it on a small scale. This is our entire training text: five words, with how many times each appears. At first, every word is split into letters.',
      pad: 0.4,
    },
    {
      id: 'count',
      es: 'Ahora se cuentan las parejas de piezas vecinas, sumando las veces que aparece cada palabra. La pareja «a», «t» está en todas: suma quince.',
      en: 'Now we count pairs of neighboring pieces, adding up how often each word appears. The pair “a”, “t” is in every word: it adds up to fifteen.',
      pad: 0.5,
    },
    {
      id: 'merge1',
      es: 'Es la pareja más frecuente, así que se fusiona: «a» y «t» se vuelven una sola pieza, «at», que entra a la lista. Cada palabra tiene ahora una pieza menos.',
      en: 'It’s the most frequent pair, so it gets merged: “a” and “t” become a single piece, “at”, which joins the list. Every word now has one piece fewer.',
      pad: 0.5,
    },
    {
      id: 'merge2',
      es: 'Y se repite con la pieza nueva. Se cuentan otra vez las parejas: ahora gana «at» seguida de «o», catorce veces, y nace la pieza «ato».',
      en: 'And it repeats with the new piece. The pairs are counted again: now “c” followed by “at” wins, nine times, and the piece “cat” is born.',
      pad: 0.5,
    },
    {
      id: 'merge-run',
      es: 'Fusión tras fusión, las piezas crecen. Mira cómo gato, pato, gatos y patos terminan siendo, cada una, una sola pieza.',
      en: 'Merge after merge, the pieces grow. Watch cat, hat, cats and hats each end up as a single piece.',
      pad: 1.2,
    },
    {
      id: 'rare-stays',
      es: '«Gatita» apareció una sola vez. Sus parejas nunca son las más frecuentes, así que se queda en trozos: lo raro se arma con piezas pequeñas.',
      en: '“Catnip” appeared only once. Its pairs are never the most frequent, so it stays in chunks: rare words are built from small pieces.',
      pad: 0.3,
    },
    {
      id: 'bpe-rule',
      es: 'Eso es todo BPE: contar las parejas vecinas y fusionar la más frecuente, una y otra vez. No sabe gramática: solo cuenta.',
      en: 'That’s all there is to BPE: count neighboring pairs and merge the most frequent, again and again. It knows no grammar: it just counts.',
      tts: {
        es: 'Eso es todo be pe e: contar las parejas vecinas y fusionar la más frecuente, una y otra vez. No sabe gramática: solo cuenta.',
        en: 'That’s all there is to B P E: count neighboring pairs and merge the most frequent, again and again. It knows no grammar: it just counts.',
      },
      note: { es: 'BPE: fusionar, una y otra vez, la pareja más frecuente.', en: 'BPE: merge the most frequent pair, again and again.' },
    },
    {
      id: 'bpe-origin',
      es: 'La idea nació en mil novecientos noventa y cuatro, para comprimir archivos. En dos mil dieciséis, Rico Sennrich y su equipo la usaron para partir palabras raras al traducir.',
      en: 'The idea was born in nineteen ninety-four, to compress files. In twenty sixteen, Rico Sennrich and his team used it to split rare words in translation.',
      pad: 0.4,
    },

    // ── 4. Un tokenizador de juguete, en grande ─────────────────────────────
    {
      id: 'toy',
      es: 'Ahora, en grande: el mismo algoritmo, entrenado con unas mil setecientas palabras que escribimos, la mayoría en inglés. Así parte nuestra frase antes de fusionar nada.',
      en: 'Now at full size: the same algorithm, trained on about seventeen hundred words we wrote, mostly in English. Here is our sentence before any merge.',
    },
    {
      id: 'toy-base',
      es: 'La lista arranca con doscientas cincuenta y seis piezas básicas: los códigos con que la computadora escribe cualquier letra, signo o emoji. Por eso nada queda fuera.',
      en: 'The list starts with two hundred fifty-six basic pieces: the codes a computer uses to write any letter, symbol or emoji. That’s why nothing is left out.',
      pad: 0.3,
    },
    {
      id: 'toy-readouts',
      es: 'Fíjate en dos cifras: las piezas que tiene la lista, doscientas cincuenta y seis, y los tokens que usa la frase, treinta y uno.',
      en: 'Look at two figures: the pieces on the list, two hundred fifty-six, and the tokens the sentence uses, twenty-nine.',
      pad: 0.4,
    },
    {
      id: 'toy-demo',
      es: 'Mira qué pasa al subir las fusiones de cero a cuatrocientas: con cada fusión la lista gana una pieza, y la frase necesita cada vez menos tokens.',
      en: 'Watch what happens as merges go from zero to four hundred: each merge adds one piece to the list, and the sentence needs fewer and fewer tokens.',
      pad: 1.0,
    },
    {
      id: 'toy-result',
      es: 'Con cuatrocientas fusiones, la lista tiene seiscientas cincuenta y seis piezas y la frase usa quince tokens. «Gato» y «llama» ya son una pieza; el nombre raro, no.',
      en: 'With four hundred merges, the list has six hundred fifty-six pieces and the sentence uses fifteen tokens. “Cat” and “named” are one piece now; the rare name is not.',
      pad: 0.3,
    },
    {
      id: 'toy-try',
      es: 'Si quieres, mueve tú las fusiones y mira en qué momento cada palabra se vuelve una sola pieza.',
      en: 'If you like, move the merges yourself and watch when each word turns into a single piece.',
      gate: {
        id: 'merges',
        prompt: { es: 'mueve las fusiones y mira cómo se arma la frase.', en: 'move the merges and watch the sentence come together.' },
      },
      pad: 0.4,
    },
    {
      id: 'size',
      es: '¿Por qué no fusionar sin parar? Cada pieza nueva acorta los textos, pero necesita su propio embedding, el vector de la lección catorce, y el modelo crece.',
      en: 'Why not keep merging forever? Each new piece shortens texts, but it needs its own embedding, the vector from lesson fourteen, and the model grows.',
      tts: {
        es: '¿Por qué no fusionar sin parar? Cada pieza nueva acorta los textos, pero necesita su propio embédin, el vector de la lección catorce, y el modelo crece.',
        en: 'Why not keep merging forever? Each new piece shortens texts, but it needs its own embedding, the vector from lesson fourteen, and the model grows.',
      },
      pad: 0.4,
    },
    {
      id: 'real-sizes',
      es: 'Por eso se busca un punto medio. Las listas reales van de treinta y dos mil piezas, en Llama dos, a unas doscientas mil, en GPT-4o. La nuestra, de juguete, casi no se ve.',
      en: 'So a middle ground is chosen. Real lists range from thirty-two thousand pieces, in Llama 2, to about two hundred thousand, in GPT-4o. Our toy one barely shows.',
      tts: {
        es: 'Por eso se busca un punto medio. Las listas reales van de treinta y dos mil piezas, en Llama dos, a unas doscientas mil, en ge pe te cuatro o. La nuestra, de juguete, casi no se ve.',
        en: 'So a middle ground is chosen. Real lists range from thirty-two thousand pieces, in Llama two, to about two hundred thousand, in G P T four oh. Our toy one barely shows.',
      },
      pad: 0.6,
    },

    // ── 5. Lo que cuesta ────────────────────────────────────────────────────
    {
      id: 'rule',
      es: 'Para el inglés hay una regla práctica: un token equivale a unas tres cuartas partes de una palabra. Cien tokens son unas setenta y cinco palabras.',
      en: 'For English there’s a rule of thumb: a token is about three quarters of a word. One hundred tokens are about seventy-five words.',
      note: { es: 'Inglés: 100 tokens ≈ 75 palabras.', en: 'English: 100 tokens ≈ 75 words.' },
      pad: 0.4,
    },
    {
      id: 'billing',
      es: 'Los tokens son también la moneda: los servicios de IA cobran por token. El trabajo del modelo crece con cada token que lee, y escribe su respuesta token por token.',
      en: 'Tokens are also the currency: AI services charge per token. The model’s work grows with every token it reads, and it writes its answer token by token.',
      pad: 0.6,
    },
    {
      id: 'price',
      es: 'El precio se da por millón de tokens, y los que el modelo escribe suelen costar varias veces más que los que lee. Más tokens, más dinero.',
      en: 'Prices are quoted per million tokens, and the ones the model writes usually cost several times more than the ones it reads. More tokens, more money.',
      note: { es: 'Costo = tokens × precio por token; escribir cuesta más que leer.', en: 'Cost = tokens × price per token; writing costs more than reading.' },
      pad: 0.4,
    },

    // ── 6. El idioma importa ────────────────────────────────────────────────
    {
      id: 'lang',
      es: 'Ahora, algo que nos toca de cerca. Aquí está el mismo mensaje en inglés y en español, cortado por el mismo tokenizador, el de GPT-4o.',
      en: 'Now, something close to home. Here is the same message in English and in Spanish, cut by the same tokenizer, GPT-4o’s.',
      tts: {
        es: 'Ahora, algo que nos toca de cerca. Aquí está el mismo mensaje en inglés y en español, cortado por el mismo tokenizador, el de ge pe te cuatro o.',
        en: 'Now, something close to home. Here is the same message in English and in Spanish, cut by the same tokenizer, G P T four oh’s.',
      },
      pad: 0.4,
    },
    {
      id: 'lang-count',
      es: 'En inglés son diez tokens; en español, quince. Para decir lo mismo, el español usa un cincuenta por ciento más de tokens, y cuesta un cincuenta por ciento más.',
      en: 'In English it’s ten tokens; in Spanish, fifteen. To say the same thing, Spanish uses fifty percent more tokens, so it costs fifty percent more.',
    },
    {
      id: 'lang-demo',
      es: 'Mira otras tres frases. La diferencia cambia: a veces es pequeña, y en una los dos idiomas empatan. Por eso no basta con una sola frase.',
      en: 'Look at three more sentences. The difference varies: sometimes it’s small, and in one the two languages tie. That’s why one sentence isn’t enough.',
      pad: 1.2,
    },
    {
      id: 'lang-try',
      es: 'Si quieres, elige tú una frase abajo y compara los dos conteos.',
      en: 'If you like, pick a sentence below and compare the two counts.',
      gate: {
        id: 'lang',
        prompt: { es: 'elige una frase y compara los tokens de cada idioma.', en: 'pick a sentence and compare the tokens in each language.' },
      },
      pad: 0.4,
    },
    {
      id: 'lang-avg',
      es: 'Para medir en serio usamos mil doce frases traducidas. Con el tokenizador de GPT-4o, el español usó un tercio más de tokens que el inglés.',
      en: 'To measure properly we used one thousand twelve translated sentences. With GPT-4o’s tokenizer, Spanish used a third more tokens than English.',
      tts: {
        es: 'Para medir en serio usamos mil doce frases traducidas. Con el tokenizador de ge pe te cuatro o, el español usó un tercio más de tokens que el inglés.',
        en: 'To measure properly we used one thousand twelve translated sentences. With G P T four oh’s tokenizer, Spanish used a third more tokens than English.',
      },
      pad: 0.4,
    },
    {
      id: 'lang-old',
      es: 'Con el de GPT-4, la mitad más; con el de GPT-2, de dos mil diecinueve, casi el doble. Los tokenizadores nuevos acortan la brecha, pero no la borran.',
      en: 'With GPT-4’s, fifty percent more; with GPT-2’s, from twenty nineteen, almost double. Newer tokenizers narrow the gap, but don’t close it.',
      tts: {
        es: 'Con el de ge pe te cuatro, la mitad más; con el de ge pe te dos, de dos mil diecinueve, casi el doble. Los tokenizadores nuevos acortan la brecha, pero no la borran.',
        en: 'With G P T four’s, fifty percent more; with G P T two’s, from twenty nineteen, almost double. Newer tokenizers narrow the gap, but don’t close it.',
      },
      pad: 0.5,
    },
    {
      id: 'lang-why',
      es: '¿Por qué? Un tokenizador reparte sus piezas según el texto con que se entrenó: lo que vio mucho recibe piezas enteras; lo que vio poco, lo parte más.',
      en: 'Why? A tokenizer hands out its pieces according to the text it was trained on: what it saw a lot gets whole pieces; what it saw little gets cut up more.',
    },
    {
      id: 'lang-toy',
      es: 'Lo comprobamos con nuestro juguete. Entrenado solo con inglés, las cuatro frases en español usan dos tercios más de tokens. Con los dos idiomas por igual, casi los mismos.',
      en: 'We checked it with our toy. Trained on English only, the four Spanish sentences use two thirds more tokens. Trained on both languages equally, almost the same.',
      note: { es: 'Lo que el tokenizador vio poco cuesta más tokens.', en: 'What the tokenizer saw little of costs more tokens.' },
      pad: 0.6,
    },
    {
      id: 'lang-other',
      es: 'Y entre otros idiomas la diferencia puede ser enorme: un estudio de dos mil veintitrés encontró que el mismo texto, traducido, podía usar hasta quince veces más tokens.',
      en: 'And between other languages the difference can be huge: a twenty twenty-three study found the same text, translated, could take up to fifteen times more tokens.',
      pad: 0.4,
    },

    // ── 7. Lo que el modelo no ve ───────────────────────────────────────────
    {
      id: 'ask',
      es: 'Una consecuencia curiosa. Pregúntale a un modelo cuántas erres tiene «carretera». Tú las ves enseguida: tres.',
      en: 'A curious consequence. Ask a model how many r’s are in “strawberry.” You see them right away: three.',
      pad: 0.3,
    },
    {
      id: 'one-number',
      es: 'Pero al modelo no le llegan letras. Con el tokenizador de GPT-4o, «carretera» es un solo token: le llega un único número, con las erres escondidas dentro.',
      en: 'But letters never reach the model. With GPT-4o’s tokenizer, “strawberry” is a single token: it gets one number, with the r’s hidden inside.',
      tts: {
        es: 'Pero al modelo no le llegan letras. Con el tokenizador de ge pe te cuatro o, «carretera» es un solo token: le llega un único número, con las erres escondidas dentro.',
        en: 'But letters never reach the model. With G P T four oh’s tokenizer, “strawberry” is a single token: it gets one number, with the r’s hidden inside.',
      },
      note: { es: 'El modelo ve tokens, no letras: contar letras le cuesta.', en: 'The model sees tokens, not letters: counting letters is hard for it.' },
      pad: 0.4,
    },
    {
      id: 'spell',
      es: 'Para contarlas tendría que recordar cómo se escribe cada pieza. Ayuda pedirle que deletree: separadas por espacios, cada letra es su propio token.',
      en: 'To count them it would have to remember how each piece is spelled. Asking it to spell helps: separated by spaces, each letter is its own token.',
      pad: 0.4,
    },
    {
      id: 'digits',
      es: 'Con los números pasa algo parecido: un millón doscientos treinta y cuatro mil quinientos sesenta y siete llega en bloques de tres cifras, contados desde la izquierda.',
      en: 'Numbers behave similarly: one million two hundred thirty-four thousand five hundred sixty-seven arrives in blocks of three digits, counted from the left.',
      pad: 0.3,
    },
    {
      id: 'digits-why',
      es: 'Esos bloques no coinciden con millones, miles y unidades, y las cuentas le salen torpes. No es descuido: es su alfabeto. Para cuentas exactas, mejor una calculadora.',
      en: 'Those blocks don’t line up with millions, thousands and units, so its arithmetic gets clumsy. It’s not carelessness: it’s its alphabet. For exact math, use a calculator.',
      pad: 0.3,
    },

    // ── 8. Cierre ───────────────────────────────────────────────────────────
    {
      id: 'limits',
      es: 'Los límites también se miden en tokens: cuánto texto puede leer el modelo de una vez y cuánto puede escribir. Antes de presupuestar, cuenta tokens con tus propios textos.',
      en: 'Limits are measured in tokens too: how much text the model can read at once and how much it can write. Before budgeting, count tokens on your own texts.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo lee tokens, piezas que BPE arma fusionando las parejas más frecuentes. Lo común sale barato; lo raro, y lo que el tokenizador vio poco, más caro.',
      en: 'In short: the model reads tokens, pieces that BPE builds by merging the most frequent pairs. Common things are cheap; rare things, and what the tokenizer saw little of, cost more.',
      tts: {
        es: 'En resumen: el modelo lee tokens, piezas que be pe e arma fusionando las parejas más frecuentes. Lo común sale barato; lo raro, y lo que el tokenizador vio poco, más caro.',
        en: 'In short: the model reads tokens, pieces that B P E builds by merging the most frequent pairs. Common things are cheap; rare things, and what the tokenizer saw little of, cost more.',
      },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Ya sabemos qué lee el modelo: una fila de tokens. Pero ¿cómo decide cada token a cuáles otros mirar para entender la frase? Eso es la atención.',
      en: 'Now we know what the model reads: a row of tokens. But how does each token decide which others to look at to make sense of the sentence? That’s attention.',
      pad: 0.4,
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo de lenguaje no lee letras ni palabras: un tokenizador corta el texto en tokens, piezas de un vocabulario fijo, y al modelo solo le llega el número de cada pieza.',
      'BPE arma el vocabulario contando las parejas de piezas vecinas en mucho texto y fusionando la más frecuente, una y otra vez. Lo frecuente acaba en una sola pieza; lo raro se arma con trozos.',
      'Más piezas acortan los textos pero agrandan el modelo: los vocabularios reales tienen de unas treinta y dos mil a unas doscientas mil piezas. En inglés, cien tokens son unas setenta y cinco palabras.',
      'Se cobra, y se limita, por token. El mismo contenido en español necesita más tokens que en inglés: en mil doce frases medidas, un tercio más con el tokenizador de GPT-4o y casi el doble con el de GPT-2.',
      'Como el modelo ve tokens y no letras, contar letras o hacer cuentas con cifras largas le resulta torpe. Deletrear o usar una herramienta suele ayudar.',
    ],
    en: [
      'A language model reads neither letters nor words: a tokenizer cuts text into tokens, pieces from a fixed vocabulary, and only each piece’s number reaches the model.',
      'BPE builds the vocabulary by counting pairs of neighboring pieces over lots of text and merging the most frequent one, again and again. Frequent things end up as a single piece; rare ones are built from chunks.',
      'More pieces shorten texts but enlarge the model: real vocabularies have from about thirty-two thousand to about two hundred thousand pieces. In English, one hundred tokens are about seventy-five words.',
      'You are billed, and limited, per token. The same content in Spanish needs more tokens than in English: on one thousand twelve measured sentences, a third more with GPT-4o’s tokenizer and almost double with GPT-2’s.',
      'Because the model sees tokens rather than letters, counting letters or doing arithmetic with long numbers is clumsy for it. Spelling things out or using a tool often helps.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un token es una palabra, y el modelo lee el texto como nosotros: palabra por palabra o letra por letra.',
      en: 'A token is a word, and the model reads text the way we do: word by word or letter by letter.',
    },
    right: {
      es: 'Un token es una pieza de tamaño variable: una palabra común puede ser uno, una rara se parte en varios, y a veces es una sola letra o un código básico. Al modelo no le llega el texto, solo los números de las piezas.',
      en: 'A token is a piece of variable size: a common word may be one, a rare word splits into several, and sometimes it is a single letter or a basic code. The model never receives the text, only the numbers of the pieces.',
    },
  },

  deeper: {
    es: `## BPE paso a paso

Sea un corpus de palabras con frecuencias $f(w)$ y un alfabeto inicial $V_0$. En cada vuelta se cuenta cuántas veces aparece cada pareja de piezas vecinas $(a,b)$, pesando por la frecuencia de la palabra:

$$\\operatorname{cuenta}(a,b)=\\sum_{w} f(w)\\cdot \\#\\{\\text{apariciones de }(a,b)\\text{ en }w\\}$$

Se elige $(a^*,b^*)=\\arg\\max_{(a,b)}\\operatorname{cuenta}(a,b)$, se sustituye esa pareja por una pieza nueva en todo el corpus y se añade al vocabulario: $V_{t+1}=V_t\\cup\\{a^*b^*\\}$. Tras $M$ fusiones, $|V|=|V_0|+M$. Para tokenizar un texto nuevo se aplican las fusiones en el orden en que se aprendieron. La idea viene de un algoritmo de compresión (Gage, 1994) que reemplazaba la pareja de bytes más frecuente por un byte sin usar; Sennrich, Haddow y Birch (2016) la adaptaron para partir las palabras raras en traducción automática, fusionando letras en lugar de bytes. No es el único método para armar un vocabulario, pero es el que usan GPT-2, Llama 2 y los tokenizadores de OpenAI (tiktoken es un tokenizador BPE).

En el ejemplo pequeño de la escena (gato ×5, gatos ×3, pato ×4, patos ×2, gatita ×1), la pareja «a t» suma $5+3+4+2+1=15$ y gana; después «at o» suma $14$; luego nacen gato (8), pato (6), gatos (3) y patos (2). «Gatita» se queda en g · at · i · t · a porque ninguna de sus parejas llega a aparecer dos veces.

## Bytes: por qué nada queda fuera

Los tokenizadores de GPT-2 en adelante parten de los $256$ valores posibles de un byte. En la codificación UTF-8, una letra sin acento ocupa un byte, una letra con acento como «ó» o «ñ» ocupa dos y muchos emojis ocupan cuatro, así que cualquier texto se puede escribir con esas $256$ piezas: lo que el vocabulario no cubre baja a bytes sueltos. Por eso, en la escena, la «ó» de Quetzalcóatl aparece al principio como dos piezas (los bytes 195 y 179) unidas por un borde punteado. Antes de fusionar, GPT-2 corta el texto en trozos (una palabra con su espacio inicial, un número, unos signos) y las fusiones nunca cruzan de un trozo a otro, para no llenar el vocabulario de variantes como «dog.», «dog!» y «dog?». Por eso muchas piezas llevan pegado el espacio de delante: « gato» y «gato» son tokens distintos. En la escena omitimos ese espacio al dibujar los cortes de GPT-4o, para que se lean mejor.

El tokenizador de juguete de la lección es un BPE a nivel de bytes con esa misma pretokenización, entrenado con unas mil setecientas palabras escritas para el curso (casi todas en inglés): $|V_0|=256$ y $M=400$, así que $|V|=656$. GPT-2 usa $256$ bytes, $50\\,000$ fusiones y un símbolo especial de fin de texto: $256+50\\,000+1=50\\,257$, la cifra que da su artículo.

## Tamaño del vocabulario

Cada pieza necesita una fila en la tabla de embeddings $E\\in\\mathbb{R}^{|V|\\times d}$, es decir, $|V|\\cdot d$ parámetros, y la capa final del modelo produce una puntuación por pieza. Con $|V|=50\\,257$ y $d=768$ (el GPT-2 más pequeño), la tabla tiene $50\\,257\\times 768\\approx 38.6$ millones de parámetros. A cambio, un vocabulario mayor comprime más: el informe de Llama 3 dice que su vocabulario de 128 mil piezas (frente a las 32 mil de Llama 2) sube de 3.17 a 3.94 los caracteres por token en una muestra de inglés.

## Costo

Con precios por millón de tokens distintos para entrada ($p_{\\text{ent}}$) y salida ($p_{\\text{sal}}$):

$$\\text{costo}=\\frac{n_{\\text{ent}}\\,p_{\\text{ent}}+n_{\\text{sal}}\\,p_{\\text{sal}}}{10^{6}}$$

Para inglés, $n\\approx \\text{palabras}/0.75$. Ejemplo con un precio supuesto de 2 dólares por millón: un informe de 3 000 palabras son unos 4 000 tokens; mil informes, 4 millones de tokens y 8 dólares. En la lista de precios de Anthropic (consultada en octubre de 2026), los tokens de salida cuestan cinco veces los de entrada en todos los modelos de la tabla.

## El idioma, medido

Con las 1 012 frases paralelas en inglés y español del conjunto FLORES-200 (devtest), contadas con tiktoken 0.14.0:

| tokenizador | inglés | español | razón |
|---|---|---|---|
| GPT-2 (\`gpt2\`) | 27 044 | 53 578 | 1.98 |
| GPT-4 (\`cl100k_base\`) | 27 182 | 41 974 | 1.54 |
| GPT-4o (\`o200k_base\`) | 26 873 | 35 415 | 1.32 |

Parte de la diferencia es que la traducción al español usa más palabras (26 081 frente a 21 901); el resto, que cada palabra en español se parte en más piezas. En inglés salen 0.81 palabras por token, cerca de la regla práctica de ¾. Petrov et al. (2023) midieron diferencias de hasta quince veces entre idiomas para un mismo texto traducido. Las cuatro frases del «tu turno» las escribimos nosotros: sirven para ilustrar, no para presupuestar.

## Por qué fallan las letras y las cifras

El modelo recibe identificadores, no caracteres: tiene que haber aprendido de los datos cómo se escribe cada pieza. Con el tokenizador de GPT-4o, « carretera» y « strawberry» (con su espacio inicial, como aparecen dentro de una pregunta) son un solo token cada uno. Edman, Schmid y Fraser (2024) encontraron que la mayoría de los modelos parecen conocer la ortografía de sus tokens, pero no la usan bien para manipular texto. Con los números, GPT-3.5 y GPT-4 tienen tokens para cada número de una, dos y tres cifras y cortan de izquierda a derecha; Singh y Strouse (2024) encontraron que forzar el corte de derecha a izquierda (separando los miles con comas) mejora mucho la aritmética. Llama 2, en cambio, parte todos los números en cifras sueltas.

## En código

Un BPE completo en veinte líneas de Python, sobre el corpus de la animación:

\`\`\`python
from collections import Counter

def entrenar_bpe(palabras, max_fusiones):
    """palabras: {palabra: frecuencia}. Devuelve las fusiones (a, b, cuenta) y cómo queda cada palabra."""
    piezas = {w: list(w) for w in palabras}
    fusiones = []
    for _ in range(max_fusiones):
        cuentas = Counter()
        for w, p in piezas.items():
            for a, b in zip(p, p[1:]):
                cuentas[(a, b)] += palabras[w]          # pesa por la frecuencia de la palabra
        if not cuentas or max(cuentas.values()) < 2:
            break
        a, b = min(cuentas, key=lambda par: (-cuentas[par], par))   # la más frecuente; empate: orden alfabético
        fusiones.append((a, b, cuentas[(a, b)]))
        for p in piezas.values():
            i = 0
            while i < len(p) - 1:
                if p[i] == a and p[i + 1] == b:
                    p[i:i + 2] = [a + b]
                else:
                    i += 1
    return fusiones, piezas

corpus = {"gato": 5, "gatos": 3, "pato": 4, "patos": 2, "gatita": 1}
fusiones, piezas = entrenar_bpe(corpus, 10)
for a, b, n in fusiones:
    print(f"{a} + {b} -> {a + b}  ({n} veces)")
print(piezas["gatos"], piezas["gatita"])
# a + t -> at  (15 veces)
# at + o -> ato  (14 veces)
# g + ato -> gato  (8 veces)
# p + ato -> pato  (6 veces)
# gato + s -> gatos  (3 veces)
# pato + s -> patos  (2 veces)
# ['gatos'] ['g', 'at', 'i', 't', 'a']
\`\`\`

Y con un tokenizador real (\`pip install tiktoken\`; salida medida con la versión 0.14.0):

\`\`\`python
import tiktoken

enc = tiktoken.get_encoding("o200k_base")          # el tokenizador de GPT-4o
for texto in ["Mi gato se llama Quetzalcóatl.", "¿Cuántas erres tiene carretera?", "1234567"]:
    ids = enc.encode(texto)
    print(len(ids), ids, [enc.decode([i]) for i in ids])
print(enc.n_vocab)
# 10 [28716, 99767, 458, 69693, 3106, 21156, 27187, 531, 69282, 13] ['Mi', ' gato', ' se', ' llama', ' Qu', 'etz', 'alc', 'ó', 'atl', '.']
# 8 [102091, 41826, 288, 1111, 430, 10647, 96244, 30] ['¿Cu', 'ánt', 'as', ' er', 'res', ' tiene', ' carretera', '?']
# 3 [7633, 19354, 22] ['123', '456', '7']
# 200019
\`\`\`

## Lo que viene

Cada número de token selecciona una fila de la tabla de embeddings (lección 14); a partir de ahí el modelo solo ve vectores. En la lección 21 veremos cómo cada token decide a cuáles otros mirar (atención). El costo de generar token por token vuelve en la lección 26 (inferencia), y el tamaño del contexto, también medido en tokens, en la lección 30.`,
    en: `## BPE step by step

Take a corpus of words with frequencies $f(w)$ and an initial alphabet $V_0$. On each round we count how many times each pair of neighboring pieces $(a,b)$ appears, weighted by the frequency of the word:

$$\\operatorname{count}(a,b)=\\sum_{w} f(w)\\cdot \\#\\{\\text{occurrences of }(a,b)\\text{ in }w\\}$$

We pick $(a^*,b^*)=\\arg\\max_{(a,b)}\\operatorname{count}(a,b)$, replace that pair with a new piece throughout the corpus, and add it to the vocabulary: $V_{t+1}=V_t\\cup\\{a^*b^*\\}$. After $M$ merges, $|V|=|V_0|+M$. To tokenize new text, the merges are applied in the order they were learned. The idea comes from a compression algorithm (Gage, 1994) that replaced the most frequent pair of bytes with an unused byte; Sennrich, Haddow and Birch (2016) adapted it to split rare words in machine translation, merging characters instead of bytes. It is not the only way to build a vocabulary, but it is the one used by GPT-2, Llama 2 and OpenAI’s tokenizers (tiktoken is a BPE tokenizer).

In the scene’s small example (cat ×5, cats ×3, hat ×4, hats ×2, catnip ×1), the pair “a t” adds up to $5+3+4+2+1=15$ and wins; then “c at” adds up to $9$; then hat (6), cats (3) and hats (2) are born. “Catnip” stays as cat · n · i · p because none of its remaining pairs appears twice.

## Bytes: why nothing is left out

Tokenizers from GPT-2 onward start from the $256$ possible values of a byte. In UTF-8 encoding, an unaccented letter takes one byte, an accented letter such as “ó” or “ñ” takes two, and many emojis take four, so any text can be written with those $256$ pieces: whatever the vocabulary does not cover falls back to single bytes. That is why, in the Spanish version of the scene, the “ó” in Quetzalcóatl first appears as two pieces (bytes 195 and 179) joined by a dashed border. Before merging, GPT-2 splits the text into chunks (a word with its leading space, a number, some punctuation) and merges never cross from one chunk to another, so the vocabulary does not fill up with variants like “dog.”, “dog!” and “dog?”. That is why many pieces carry the space in front of them: “ cat” and “cat” are different tokens. The scene leaves that space out when drawing GPT-4o’s cuts, to keep them readable.

The lesson’s toy tokenizer is a byte-level BPE with that same pre-tokenization, trained on about seventeen hundred words written for the course (mostly English): $|V_0|=256$ and $M=400$, so $|V|=656$. GPT-2 uses $256$ bytes, $50{,}000$ merges and one special end-of-text symbol: $256+50{,}000+1=50{,}257$, the figure given in its paper.

## Vocabulary size

Every piece needs a row in the embedding table $E\\in\\mathbb{R}^{|V|\\times d}$, that is, $|V|\\cdot d$ parameters, and the model’s final layer produces one score per piece. With $|V|=50{,}257$ and $d=768$ (the smallest GPT-2), the table has $50{,}257\\times 768\\approx 38.6$ million parameters. In exchange, a larger vocabulary compresses more: the Llama 3 report says its 128-thousand-piece vocabulary (versus Llama 2’s 32 thousand) raises characters per token from 3.17 to 3.94 on a sample of English.

## Cost

With different per-million-token prices for input ($p_{\\text{in}}$) and output ($p_{\\text{out}}$):

$$\\text{cost}=\\frac{n_{\\text{in}}\\,p_{\\text{in}}+n_{\\text{out}}\\,p_{\\text{out}}}{10^{6}}$$

For English, $n\\approx \\text{words}/0.75$. Example with an assumed price of 2 dollars per million: a 3,000-word report is about 4,000 tokens; a thousand reports, 4 million tokens and 8 dollars. In Anthropic’s price list (checked in October 2026), output tokens cost five times as much as input tokens for every model in the table.

## Language, measured

With the 1,012 parallel English and Spanish sentences of the FLORES-200 dataset (devtest), counted with tiktoken 0.14.0:

| tokenizer | English | Spanish | ratio |
|---|---|---|---|
| GPT-2 (\`gpt2\`) | 27,044 | 53,578 | 1.98 |
| GPT-4 (\`cl100k_base\`) | 27,182 | 41,974 | 1.54 |
| GPT-4o (\`o200k_base\`) | 26,873 | 35,415 | 1.32 |

Part of the difference is that the Spanish translation uses more words (26,081 versus 21,901); the rest is that each Spanish word is cut into more pieces. English comes out at 0.81 words per token, close to the ¾ rule of thumb. Petrov et al. (2023) measured differences of up to fifteen times between languages for the same translated text. The four sentences in the “your turn” step were written by us: they illustrate, they are not a basis for budgeting.

## Why letters and digits fail

The model receives identifiers, not characters: it must have learned from data how each piece is spelled. With GPT-4o’s tokenizer, “ strawberry” and “ carretera” (with their leading space, as they appear inside a question) are a single token each. Edman, Schmid and Fraser (2024) found that most models seem to know the spelling of their tokens but fail to use it well to manipulate text. With numbers, GPT-3.5 and GPT-4 have tokens for every one-, two- and three-digit number and cut from left to right; Singh and Strouse (2024) found that forcing a right-to-left cut (separating thousands with commas) greatly improves arithmetic. Llama 2, by contrast, splits all numbers into single digits.

## In code

A complete BPE in twenty lines of Python, on the animation’s corpus:

\`\`\`python
from collections import Counter

def train_bpe(words, max_merges):
    """words: {word: frequency}. Returns the merges (a, b, count) and how each word ends up."""
    pieces = {w: list(w) for w in words}
    merges = []
    for _ in range(max_merges):
        counts = Counter()
        for w, p in pieces.items():
            for a, b in zip(p, p[1:]):
                counts[(a, b)] += words[w]              # weight by the word's frequency
        if not counts or max(counts.values()) < 2:
            break
        a, b = min(counts, key=lambda pair: (-counts[pair], pair))   # most frequent; ties: alphabetical
        merges.append((a, b, counts[(a, b)]))
        for p in pieces.values():
            i = 0
            while i < len(p) - 1:
                if p[i] == a and p[i + 1] == b:
                    p[i:i + 2] = [a + b]
                else:
                    i += 1
    return merges, pieces

corpus = {"cat": 5, "cats": 3, "hat": 4, "hats": 2, "catnip": 1}
merges, pieces = train_bpe(corpus, 10)
for a, b, n in merges:
    print(f"{a} + {b} -> {a + b}  ({n} times)")
print(pieces["cats"], pieces["catnip"])
# a + t -> at  (15 times)
# c + at -> cat  (9 times)
# h + at -> hat  (6 times)
# cat + s -> cats  (3 times)
# hat + s -> hats  (2 times)
# ['cats'] ['cat', 'n', 'i', 'p']
\`\`\`

And with a real tokenizer (\`pip install tiktoken\`; output measured with version 0.14.0):

\`\`\`python
import tiktoken

enc = tiktoken.get_encoding("o200k_base")          # GPT-4o's tokenizer
for text in ["My cat is named Quetzalcoatl.", "How many r's are in strawberry?", "1234567"]:
    ids = enc.encode(text)
    print(len(ids), ids, [enc.decode([i]) for i in ids])
print(enc.n_vocab)
# 10 [5444, 9059, 382, 11484, 3106, 21156, 280, 1191, 69282, 13] ['My', ' cat', ' is', ' named', ' Qu', 'etz', 'al', 'co', 'atl', '.']
# 8 [5299, 1991, 428, 885, 553, 306, 101830, 30] ['How', ' many', ' r', "'s", ' are', ' in', ' strawberry', '?']
# 3 [7633, 19354, 22] ['123', '456', '7']
# 200019
\`\`\`

## What comes next

Each token number selects a row of the embedding table (lesson 14); from there on the model only sees vectors. In lesson 21 we will see how each token decides which others to look at (attention). The cost of generating token by token returns in lesson 26 (inference), and the size of the context, also measured in tokens, in lesson 30.`,
  },

  lens: {
    es: [
      'El costo y los límites se miden en tokens, no en palabras ni en páginas. Antes de presupuestar, cuenta los tokens de tus propios documentos con el tokenizador del proveedor, y calcula entrada y salida por separado: la salida suele costar varias veces más por token.',
      'Tu idioma importa. En mil doce frases traducidas, el español necesitó un tercio más de tokens que el inglés con el tokenizador de GPT-4o, y casi el doble con el de GPT-2. Mide con mensajes reales en tu idioma, no con ejemplos en inglés.',
      'El tokenizador cambia entre modelos y versiones, y con él la factura. Anthropic documenta que el tokenizador de sus modelos Claude 4.7 y posteriores produce alrededor de un treinta por ciento más tokens para el mismo texto.',
      'Señales de alerta: precios «por palabra» o «por página» sin decir cómo se convierten a tokens, y confiar en el modelo para contar letras, comparar cifras largas o hacer cuentas sin verificar. Pide que deletree o que use una herramienta de cálculo.',
    ],
    en: [
      'Cost and limits are measured in tokens, not in words or pages. Before budgeting, count the tokens of your own documents with the provider’s tokenizer, and compute input and output separately: output usually costs several times more per token.',
      'Your language matters. On one thousand twelve translated sentences, Spanish needed a third more tokens than English with GPT-4o’s tokenizer, and almost double with GPT-2’s. Measure with real messages in your language, not with English examples.',
      'The tokenizer changes between models and versions, and so does the bill. Anthropic documents that the tokenizer of its Claude 4.7 and later models produces about thirty percent more tokens for the same text.',
      'Warning signs: prices “per word” or “per page” without saying how they convert to tokens, and trusting the model to count letters, compare long numbers or do arithmetic without checking. Ask it to spell things out or to use a calculation tool.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué es un token?', en: 'What is a token?' },
      options: [
        { es: 'Siempre una palabra completa.', en: 'Always a whole word.' },
        { es: 'Siempre una sola letra.', en: 'Always a single letter.' },
        { es: 'Una pieza de texto del vocabulario: una palabra, un trozo de palabra, un signo o incluso un código básico.', en: 'A piece of text from the vocabulary: a word, a chunk of a word, a symbol, or even a basic code.' },
        { es: 'Una oración completa.', en: 'A whole sentence.' },
      ],
      answer: 2,
      why: { es: 'Los tokens son piezas de tamaño variable. Las palabras comunes suelen ser un token; las raras se parten en varios, y lo que el vocabulario no cubre baja a sus códigos básicos (bytes).', en: 'Tokens are pieces of variable size. Common words are usually one token; rare ones split into several, and whatever the vocabulary does not cover falls back to its basic codes (bytes).' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué hace BPE en cada paso al construir el vocabulario?', en: 'What does BPE do at each step when building the vocabulary?' },
      options: [
        { es: 'Elimina las palabras menos frecuentes del texto.', en: 'Removes the least frequent words from the text.' },
        { es: 'Fusiona en una pieza nueva la pareja de piezas vecinas más frecuente.', en: 'Merges the most frequent pair of neighboring pieces into a new piece.' },
        { es: 'Traduce cada pieza al inglés.', en: 'Translates each piece into English.' },
        { es: 'Parte cada palabra en sílabas.', en: 'Splits each word into syllables.' },
      ],
      answer: 1,
      why: { es: 'Cuenta las parejas vecinas (sumando las veces que aparece cada palabra), fusiona la más frecuente y repite. No usa reglas del idioma: solo cuenta.', en: 'It counts neighboring pairs (adding up how often each word appears), merges the most frequent one and repeats. It uses no language rules: it just counts.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un informe en inglés tiene 3 000 palabras. Con la regla de un token por cada tres cuartas partes de palabra y un precio supuesto de 2 dólares por millón de tokens, ¿cuánto cuesta procesar 1 000 informes?', en: 'An English report has 3,000 words. With the rule of one token per three quarters of a word and an assumed price of 2 dollars per million tokens, how much does it cost to process 1,000 reports?' },
      options: [
        { es: '0.80 dólares', en: '$0.80' },
        { es: '80 dólares', en: '$80' },
        { es: '6 dólares', en: '$6' },
        { es: '8 dólares', en: '$8' },
      ],
      answer: 3,
      why: { es: 'Tokens por informe ≈ 3 000 ÷ 0.75 = 4 000. Mil informes son 4 millones de tokens, y 4 × 2 = 8 dólares. Contar un token por palabra daría 6 dólares: subestimarías el costo en una cuarta parte.', en: 'Tokens per report ≈ 3,000 ÷ 0.75 = 4,000. A thousand reports is 4 million tokens, and 4 × 2 = $8. Counting one token per word would give $6: you would underestimate the cost by a quarter.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu empresa presupuestó un asistente para clientes en español usando pruebas de costo hechas en inglés. ¿Qué conviene hacer?', en: 'Your company budgeted a customer assistant in Spanish using cost tests run in English. What is the sensible thing to do?' },
      options: [
        { es: 'Contar los tokens de mensajes reales en español con el tokenizador del modelo que se usará y presupuestar con esos conteos.', en: 'Count the tokens of real Spanish messages with the tokenizer of the model that will be used, and budget with those counts.' },
        { es: 'Mantener el presupuesto: el mismo contenido usa los mismos tokens en todos los idiomas.', en: 'Keep the budget: the same content uses the same tokens in every language.' },
        { es: 'Esperar a ver la factura del primer mes.', en: 'Wait to see the first month’s bill.' },
        { es: 'Multiplicar siempre por dos, porque el español cuesta el doble.', en: 'Always multiply by two, because Spanish costs double.' },
      ],
      answer: 0,
      why: { es: 'El número de tokens de un mismo contenido depende del idioma y del tokenizador: en las mil doce frases medidas fue un tercio más con el de GPT-4o y casi el doble con el de GPT-2. No hay un factor universal; lo fiable es medir con tus textos y tu modelo.', en: 'The number of tokens for the same content depends on the language and the tokenizer: on the one thousand twelve measured sentences it was a third more with GPT-4o’s and almost double with GPT-2’s. There is no universal factor; what is reliable is measuring with your texts and your model.' },
    },
  ],

  glossary: ['token', 'tokenizer', 'bpe', 'vocabulary', 'language-model', 'autoregression', 'embedding', 'vector'],

  terms: [
    { id: 'token', term: { es: 'Token', en: 'Token' }, def: { es: 'Pieza de texto (una palabra, un trozo de palabra, un signo o un código básico) tomada del vocabulario. Es la unidad que el modelo lee y genera, y por la que se cobra.', en: 'A piece of text (a word, a word fragment, a symbol, or a basic code) taken from the vocabulary. It is the unit the model reads and generates, and the unit you are billed for.' } },
    { id: 'tokenizer', term: { es: 'Tokenizador', en: 'Tokenizer' }, def: { es: 'Programa que corta el texto en tokens y da a cada uno su número (y hace el camino de vuelta). Se construye antes de entrenar el modelo y queda fijo.', en: 'A program that cuts text into tokens and gives each one its number (and goes back the other way). It is built before the model is trained and stays fixed.' } },
    { id: 'bpe', term: { es: 'BPE (codificación por pares de bytes)', en: 'BPE (byte pair encoding)' }, def: { es: 'Algoritmo que arma el vocabulario fusionando, una y otra vez, la pareja de piezas vecinas más frecuente en un texto de entrenamiento. Nació como técnica de compresión (Gage, 1994) y se adaptó al lenguaje (Sennrich et al., 2016).', en: 'An algorithm that builds the vocabulary by merging, again and again, the most frequent pair of neighboring pieces in a training text. It began as a compression technique (Gage, 1994) and was adapted to language (Sennrich et al., 2016).' } },
    { id: 'vocabulary', term: { es: 'Vocabulario', en: 'Vocabulary' }, def: { es: 'Lista de todas las piezas (tokens) que un tokenizador puede producir, cada una con su número. Los reales tienen de unas treinta y dos mil a unas doscientas mil; el de juguete de la lección, 656.', en: 'The list of all the pieces (tokens) a tokenizer can produce, each with its number. Real ones have from about thirty-two thousand to about two hundred thousand; the lesson’s toy one, 656.' } },
  ],

  sources: [
    { title: 'Neural Machine Translation of Rare Words with Subword Units (ACL 2016)', authors: 'Sennrich, R., Haddow, B., Birch, A.', year: 2016, url: 'https://arxiv.org/abs/1508.07909' },
    { title: 'A New Algorithm for Data Compression (The C Users Journal, 12(2), 23–38; copia archivada del artículo)', authors: 'Gage, P.', year: 1994, url: 'https://jacobfilipp.com/DrDobbs/articles/CUJ/1994/9402/gage/gage.htm' },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'The Llama 3 Herd of Models', authors: 'Grattafiori, A., et al. (Llama Team, AI @ Meta)', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'tiktoken: tokenizadores de OpenAI (gpt2, cl100k_base para GPT-4, o200k_base para GPT-4o); versión 0.14.0 usada para todas las mediciones', authors: 'OpenAI', year: 2022, url: 'https://github.com/openai/tiktoken' },
    { title: 'What are tokens and how to count them? (OpenAI Help Center): 1 token ≈ ¾ de palabra en inglés', authors: 'OpenAI', year: 2025, url: 'https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them' },
    { title: 'Pricing (documentación de la plataforma de Claude): precios por millón de tokens de entrada y de salida; tokenizador de Claude 4.7 y posteriores', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
    { title: 'No Language Left Behind: Scaling Human-Centered Machine Translation (conjunto FLORES-200, CC BY-SA 4.0)', authors: 'NLLB Team, Costa-jussà, M. R., et al.', year: 2022, url: 'https://arxiv.org/abs/2207.04672' },
    { title: 'Language Model Tokenizers Introduce Unfairness Between Languages (NeurIPS 2023)', authors: 'Petrov, A., La Malfa, E., Torr, P. H. S., Bibi, A.', year: 2023, url: 'https://arxiv.org/abs/2305.15425' },
    { title: 'CUTE: Measuring LLMs’ Understanding of Their Tokens (EMNLP 2024)', authors: 'Edman, L., Schmid, H., Fraser, A.', year: 2024, url: 'https://arxiv.org/abs/2409.15452' },
    { title: 'Tokenization counts: the impact of tokenization on arithmetic in frontier LLMs', authors: 'Singh, A. K., Strouse, D. J.', year: 2024, url: 'https://arxiv.org/abs/2402.14903' },
  ],
});
