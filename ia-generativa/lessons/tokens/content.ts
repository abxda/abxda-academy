import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'tokens',

  objectives: {
    es: [
      'Explicar por qué un modelo de lenguaje lee tokens, ni letras ni palabras, y qué lista de piezas (vocabulario) los define.',
      'Describir cómo BPE arma el vocabulario fusionando una y otra vez el par de piezas más frecuente.',
      'Estimar el costo de un texto en tokens y anticipar cuándo cuesta más: lo raro, otros idiomas, las cifras largas.',
    ],
    en: [
      'Explain why a language model reads tokens, neither letters nor words, and which list of pieces (the vocabulary) defines them.',
      'Describe how BPE builds the vocabulary by merging the most frequent pair of pieces again and again.',
      'Estimate the cost of a text in tokens and anticipate when it costs more: rare words, other languages, long numbers.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Dijimos que el modelo predice la siguiente palabra. En realidad no lee palabras ni letras: lee tokens, y de ellos depende lo que cuesta usarlo.',
      en: 'We said the model predicts the next word. In truth it reads neither words nor letters: it reads tokens, and what it costs to use depends on them.',
    },
    {
      id: 'letters',
      es: 'Podría leer letra por letra. El alfabeto es diminuto, pero cada letra es un paso del modelo, y cada paso cuesta cómputo.',
      en: 'It could read letter by letter. The alphabet is tiny, but every letter is a step for the model, and every step costs compute.',
    },
    {
      id: 'words',
      es: 'O palabra por palabra. Las secuencias se acortan, pero el vocabulario sería inmenso, y un nombre propio o un error de tipeo no estarían en la lista.',
      en: 'Or word by word. Sequences get shorter, but the vocabulary would be huge, and a proper name or a typo would not be on the list.',
    },
    {
      id: 'middle',
      es: 'El punto medio son piezas de tamaño variable: las palabras frecuentes son una sola pieza y las raras se parten en fragmentos. Esas piezas son los tokens.',
      en: 'The middle ground is pieces of variable size: frequent words are one piece and rare ones split into fragments. Those pieces are the tokens.',
      note: { es: 'Token: una pieza de texto, ni letra ni palabra.', en: 'Token: a piece of text, neither letter nor word.' },
    },
    {
      id: 'vocab',
      es: 'Todas las piezas permitidas forman el vocabulario, y el tokenizador es el programa que parte el texto en ellas. Cada pieza tiene un número, y solo ese número llega al modelo.',
      en: 'All the allowed pieces form the vocabulary, and the tokenizer is the program that splits text into them. Each piece has a number, and only that number reaches the model.',
      note: { es: 'Vocabulario: la lista de piezas. Tokenizador: quien parte el texto.', en: 'Vocabulary: the list of pieces. Tokenizer: what splits the text.' },
    },
    {
      id: 'bpe-q',
      es: '¿Quién decide las piezas? Un algoritmo sencillo, BPE: empieza con piezas mínimas y fusiona, una y otra vez, el par vecino más frecuente. Veámoslo con un corpus diminuto.',
      en: 'Who decides the pieces? A simple algorithm, BPE: start from tiny pieces and keep merging the most frequent neighboring pair. Let’s watch it on a tiny corpus.',
      tts: { es: '¿Quién decide las piezas? Un algoritmo sencillo, be pe e: empieza con piezas mínimas y fusiona, una y otra vez, el par vecino más frecuente. Veámoslo con un corpus diminuto.', en: 'Who decides the pieces? A simple algorithm, B P E: start from tiny pieces and keep merging the most frequent neighboring pair. Let’s watch it on a tiny corpus.' },
      note: { es: 'BPE: fusionar, una y otra vez, el par más frecuente.', en: 'BPE: merge the most frequent pair, again and again.' },
    },
    {
      id: 'bpe-merge',
      es: 'Se cuentan los pares vecinos, pesados por la frecuencia de cada palabra. El más frecuente, «a t», aparece quince veces: se funde en una pieza nueva, «at», que entra al vocabulario.',
      en: 'Neighboring pairs are counted, weighted by each word’s frequency. The most frequent, “a t”, appears fifteen times: it is merged into a new piece, “at”, which joins the vocabulary.',
      pad: 0.6,
    },
    {
      id: 'bpe-more',
      es: 'Se repite con las piezas nuevas. Cada fusión construye una pieza más larga a partir de dos más cortas, y las palabras frecuentes se van volviendo una sola pieza.',
      en: 'It repeats with the new pieces. Each merge builds a longer piece out of two shorter ones, and frequent words gradually become a single piece.',
      pad: 0.6,
    },
    {
      id: 'bpe-loop',
      es: 'Se detiene al alcanzar el tamaño de vocabulario que se quiera. Lo raro queda en fragmentos. No hay lingüística aquí: es estadística pura sobre un corpus.',
      en: 'It stops when the vocabulary reaches the size you want. Rare things stay in fragments. There is no linguistics here: it is pure statistics over a corpus.',
      pad: 0.4,
    },
    {
      id: 'train-intro',
      es: 'Este tokenizador de juguete parte de los doscientos cincuenta y seis bytes posibles y aprendió de un corpus corto, un conjunto de textos en inglés y español. Tú decides cuántas fusiones aplicar.',
      en: 'This toy tokenizer starts from the two hundred fifty-six possible bytes and learned from a short corpus, a set of texts in English and Spanish. You decide how many merges to apply.',
    },
    {
      id: 'try-merges',
      es: 'Tu turno: mueve el control de fusiones y observa la frase. Haz que «gato» sea un solo token y fíjate en cuántas fusiones hicieron falta.',
      en: 'Your turn: move the merges control and watch the sentence. Make “cat” a single token and notice how many merges it took.',
      gate: {
        id: 'merges',
        prompt: { es: 'Haz que «gato» sea un solo token.', en: 'Make “cat” a single token.' },
      },
      pad: 0.4,
    },
    {
      id: 'merges-after',
      es: 'Las palabras más comunes se fusionan antes y las raras, después. Y un nombre como Quetzalcóatl nunca llega a ser una sola pieza: sigue en fragmentos.',
      en: 'The most common words merge first and rarer ones later. And a name like Quetzalcoatl never becomes a single piece: it stays in fragments.',
      tts: { es: 'Las palabras más comunes se fusionan antes y las raras, después. Y un nombre como Quetzalcóatl nunca llega a ser una sola pieza: sigue en fragmentos.', en: 'The most common words merge first and rarer ones later. And a name like Ketsalkoatl never becomes a single piece: it stays in fragments.' },
      note: { es: 'Lo frecuente se fusiona pronto; lo raro queda partido.', en: 'The frequent merges early; the rare stays split.' },
    },
    {
      id: 'size',
      es: 'Cuántas fusiones hacer fija el tamaño del vocabulario. Más piezas acortan los textos, pero agrandan la tabla de embeddings y la capa final que elige entre todas las piezas.',
      en: 'How many merges to make sets the vocabulary size. More pieces shorten texts, but they enlarge the embedding table and the final layer that chooses among all the pieces.',
    },
    {
      id: 'real-sizes',
      es: 'Los tokenizadores reales son enormes: GPT-2 tiene cincuenta mil doscientas cincuenta y siete piezas, y los recientes de cien mil a doscientas mil. El de esta lección tiene unos centenares: es de juguete.',
      en: 'Real tokenizers are huge: GPT-2 has fifty thousand two hundred fifty-seven pieces, and recent ones have one hundred thousand to two hundred thousand. This lesson’s has a few hundred: it is a toy.',
      tts: { es: 'Los tokenizadores reales son enormes: ge pe te dos tiene cincuenta mil doscientas cincuenta y siete piezas, y los recientes de cien mil a doscientas mil. El de esta lección tiene unos centenares: es de juguete.', en: 'Real tokenizers are huge: G P T two has fifty thousand two hundred fifty-seven pieces, and recent ones have one hundred thousand to two hundred thousand. This lesson’s has a few hundred: it is a toy.' },
      pad: 0.5,
    },
    {
      id: 'rule',
      es: 'Una regla práctica para el inglés: un token son unos cuatro caracteres, o tres cuartas partes de una palabra. Cien tokens son unas setenta y cinco palabras.',
      en: 'A practical rule for English: a token is about four characters, or three quarters of a word. One hundred tokens are about seventy-five words.',
      note: { es: 'Regla práctica (inglés): 1 token ≈ ¾ de palabra.', en: 'Rule of thumb (English): 1 token ≈ ¾ of a word.' },
    },
    {
      id: 'space-case',
      es: 'Dos detalles. El espacio inicial forma parte del token, y las mayúsculas cuentan: «gato», « gato» y «Gato» son piezas distintas, con números distintos.',
      en: 'Two details. The leading space is part of the token, and capitals count: “cat”, “ cat”, and “Cat” are different pieces, with different numbers.',
      tts: { es: 'Dos detalles. El espacio inicial forma parte del token, y las mayúsculas cuentan: gato, espacio gato, y Gato, son piezas distintas, con números distintos.', en: 'Two details. The leading space is part of the token, and capitals count: cat, space cat, and Cat are different pieces, with different numbers.' },
    },
    {
      id: 'bytes',
      es: 'Y si aparece algo que nunca vio, como una letra rara o un emoji, no se rinde: baja a los bytes. Por eso no existe la «palabra desconocida».',
      en: 'And if something it never saw shows up, like a rare letter or an emoji, it does not give up: it falls back to bytes. That is why there is no “unknown word”.',
    },
    {
      id: 'billing',
      es: 'Por eso se cobra por token. Cada token de entrada se procesa, y cada token de salida exige una pasada completa por el modelo, como al predecir palabra tras palabra.',
      en: 'That is why you pay per token. Every input token gets processed, and every output token takes a full pass through the model, as when predicting word after word.',
      pad: 0.4,
    },
    {
      id: 'price',
      es: 'El proveedor fija un precio por millón de tokens, casi siempre distinto para entrada y salida. Costo es tokens por precio. Aquí el precio es un supuesto que puedes cambiar.',
      en: 'The provider sets a price per million tokens, usually different for input and output. Cost is tokens times price. Here the price is an assumption you can change.',
      note: { es: 'Costo ≈ tokens × precio por token.', en: 'Cost ≈ tokens × price per token.' },
    },
    {
      id: 'play-intro',
      es: 'Prueba con tu propio texto. Cada token aparece como un bloque, con el conteo y una estimación del costo mensual debajo.',
      en: 'Try your own text. Each token appears as a block, with the count and an estimated monthly cost below.',
    },
    {
      id: 'try-rare',
      es: 'Tu turno: escribe una palabra rara o inventada y logra que se parta en cinco tokens o más. Compárala con una palabra común.',
      en: 'Your turn: type a rare or invented word and get it split into five or more tokens. Compare it with a common word.',
      gate: {
        id: 'rare',
        prompt: { es: 'Escribe una palabra que se parta en cinco tokens o más.', en: 'Type a word that splits into five or more tokens.' },
      },
      pad: 0.4,
    },
    {
      id: 'lang-intro',
      es: 'Si lo raro cuesta más, ¿qué pasa con un idioma entero que el tokenizador vio poco? Aquí está la misma frase en inglés y en español.',
      en: 'If the rare costs more, what happens to a whole language the tokenizer saw little of? Here is the same sentence in English and in Spanish.',
    },
    {
      id: 'try-lang',
      es: 'Tu turno: predice cuál usará más tokens. Luego cambia el corpus de entrenamiento y mira qué pasa con la brecha.',
      en: 'Your turn: predict which will use more tokens. Then change the training corpus and see what happens to the gap.',
      gate: {
        id: 'lang',
        prompt: { es: 'Haz tu predicción y cambia el corpus de entrenamiento.', en: 'Make your prediction and change the training corpus.' },
      },
      pad: 0.4,
    },
    {
      id: 'lang-why',
      es: 'La brecha viene de los datos: un tokenizador entrenado sobre todo con inglés gasta sus piezas en inglés. Además, las letras con acento ocupan dos bytes.',
      en: 'The gap comes from the data: a tokenizer trained mostly on English spends its pieces on English. Also, accented letters take two bytes.',
      note: { es: 'Lo que el tokenizador vio poco cuesta más tokens.', en: 'What the tokenizer saw little of costs more tokens.' },
    },
    {
      id: 'lang-real',
      es: 'Con tokenizadores reales pasa igual. La brecha se achica con vocabularios más grandes y multilingües, pero no desaparece, y entre algunos idiomas se ha medido hasta quince veces.',
      en: 'Real tokenizers behave the same way. The gap narrows with larger, multilingual vocabularies but does not vanish, and between some languages researchers measured up to fifteen times.',
      pad: 0.5,
    },
    {
      id: 'fail-letters',
      es: 'Como el modelo recibe números de tokens y no letras, contar letras o invertir una palabra le cuesta más de lo que esperarías. De «frambuesa» le llegan cuatro números; las erres no se ven.',
      en: 'Because the model receives token numbers rather than letters, counting letters or reversing a word is harder for it than you would expect. “Strawberry” reaches it as a single number; the r’s are not visible.',
      note: { es: 'El modelo ve tokens, no letras: contar letras es difícil.', en: 'The model sees tokens, not letters: counting letters is hard.' },
    },
    {
      id: 'fail-math',
      es: 'Con los números pasa algo parecido: muchos tokenizadores los cortan en bloques de tres cifras desde la izquierda, que no coinciden con los miles, y la aritmética se vuelve torpe.',
      en: 'Numbers are similar: many tokenizers cut them into blocks of three digits from the left, which do not line up with the thousands, so arithmetic gets clumsy.',
    },
    {
      id: 'fail-fix',
      es: 'No es un descuido: es el alfabeto con el que trabaja. Suele ayudar pedirle que deletree paso a paso, o dejar las cuentas a una herramienta de cálculo.',
      en: 'It is not carelessness: it is the alphabet it works with. It often helps to ask it to spell things out step by step, or to leave the arithmetic to a calculation tool.',
    },
    {
      id: 'limits',
      es: 'También los límites se miden en tokens: cuánto puede leer de una vez, cuánto puede responder y cuánto se factura. Pensar en palabras o páginas lleva a errores de cálculo.',
      en: 'Limits are measured in tokens too: how much it can read at once, how much it can answer, and how much you are billed. Thinking in words or pages leads to miscalculations.',
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo lee tokens, piezas que BPE arma fusionando los pares más frecuentes. Lo común sale barato, lo raro sale caro, y el costo y los límites se miden en tokens.',
      en: 'In short: the model reads tokens, pieces that BPE builds by merging the most frequent pairs. The common is cheap, the rare is expensive, and cost and limits are measured in tokens.',
      tts: { es: 'En resumen: el modelo lee tokens, piezas que be pe e arma fusionando los pares más frecuentes. Lo común sale barato, lo raro sale caro, y el costo y los límites se miden en tokens.', en: 'In short: the model reads tokens, pieces that B P E builds by merging the most frequent pairs. The common is cheap, the rare is expensive, and cost and limits are measured in tokens.' },
    },
    {
      id: 'bridge',
      es: 'Ya sabemos qué lee el modelo: una fila de tokens. Falta saber cómo decide cada token a cuáles otros mirar. Eso se llama atención.',
      en: 'We now know what the model reads: a row of tokens. What is left is how each token decides which others to look at. That is called attention.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo de lenguaje no lee letras ni palabras: lee tokens, piezas de texto de un vocabulario fijo, y de cada una solo recibe su número.',
      'BPE construye el vocabulario fusionando, una y otra vez, el par de piezas vecinas más frecuente de un corpus. Lo frecuente se vuelve una sola pieza; lo raro queda en fragmentos.',
      'Los tokenizadores reales tienen de unas treinta mil a unas doscientas mil piezas. En inglés, un token son unos cuatro caracteres o tres cuartas partes de una palabra.',
      'Se cobra, y se limita la longitud, por token. Lo raro, los nombres, las cifras largas y los idiomas poco vistos por el tokenizador necesitan más tokens para decir lo mismo.',
      'Como el modelo ve tokens y no letras, contar letras o hacer aritmética con cifras largas le resulta torpe. Deletrear o usar una herramienta suele ayudar.',
    ],
    en: [
      'A language model reads neither letters nor words: it reads tokens, pieces of text from a fixed vocabulary, and of each one it only receives its number.',
      'BPE builds the vocabulary by merging, again and again, the most frequent pair of neighboring pieces in a corpus. The frequent becomes a single piece; the rare stays in fragments.',
      'Real tokenizers have from about thirty thousand to about two hundred thousand pieces. In English, a token is about four characters or three quarters of a word.',
      'You are billed, and length is limited, per token. Rare words, names, long numbers and languages the tokenizer saw little of need more tokens to say the same thing.',
      'Because the model sees tokens and not letters, counting letters or doing arithmetic with long numbers is clumsy for it. Spelling things out or using a tool often helps.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un token es una palabra, y el modelo lee el texto como nosotros: palabra por palabra o letra por letra.',
      en: 'A token is a word, and the model reads text the way we do: word by word or letter by letter.',
    },
    right: {
      es: 'Un token es una pieza de tamaño variable: una palabra común puede ser uno, una rara se parte en varios, y a veces es una letra o un byte. Al modelo no le llega el texto, solo los números de las piezas.',
      en: 'A token is a piece of variable size: a common word may be one, a rare word splits into several, and sometimes it is a letter or a byte. The model never receives the text, only the numbers of the pieces.',
    },
  },

  deeper: {
    es: `## BPE paso a paso

Sea un corpus de palabras con frecuencias $f(w)$ y un alfabeto inicial $V_0$ (en la versión a nivel de bytes, los 256 valores posibles de un byte). En cada vuelta se cuenta cuántas veces aparece cada par de piezas vecinas $(a,b)$, pesando por la frecuencia de la palabra:

$$\\operatorname{cuenta}(a,b)=\\sum_{w} f(w)\\cdot \\#\\{\\text{apariciones de }(a,b)\\text{ en }w\\}$$

Se elige $(a^*,b^*)=\\arg\\max_{(a,b)}\\operatorname{cuenta}(a,b)$, se sustituye ese par por una pieza nueva en todo el corpus y se añade al vocabulario: $V_{t+1}=V_t\\cup\\{a^*b^*\\}$. Tras $M$ fusiones, $|V|=|V_0|+M$. Para tokenizar un texto nuevo se aplican las fusiones en el orden en que se crearon. El artículo de Sennrich, Haddow y Birch (2016) adaptó a las palabras raras de la traducción automática esta idea de compresión de datos de Gage (1994).

El tokenizador de la lección usa $|V_0|=256$ y $M=400$, así que $|V|=656$. GPT-2 usa 256 bytes más 50 000 fusiones más un símbolo especial de fin de texto: $256+50\\,000+1=50\\,257$, la cifra que da el artículo de GPT-2 y que se confirma contando con tiktoken.

## Bytes y pretokenización

Trabajar con bytes (UTF-8) permite escribir cualquier texto con solo 256 piezas base: una letra ASCII ocupa un byte, una letra con acento como «á» o «ñ» ocupa dos y muchos emojis ocupan cuatro. Por eso nada es «desconocido»: lo que el vocabulario no cubre baja a bytes sueltos. Antes de fusionar, el texto se parte en trozos (palabra con su espacio inicial, número, signos) y las fusiones nunca cruzan de un trozo al siguiente; GPT-2 lo hace así para que «dog», «dog.» y «dog!» no llenen el vocabulario con variantes, con una excepción para los espacios.

## Tamaño del vocabulario

Cada pieza necesita una fila en la tabla de embeddings $E\\in\\mathbb{R}^{|V|\\times d}$, es decir $|V|\\cdot d$ parámetros, y la capa final produce un valor por cada pieza. Con $|V|=50\\,257$ y $d=768$ (el GPT-2 más pequeño), la tabla tiene $50\\,257\\times 768\\approx 38{,}6$ millones de parámetros. A cambio, un vocabulario mayor comprime más: el informe técnico de Llama 3 reporta que su tokenizador de 128 mil piezas mejora la compresión frente al de Llama 2 (32 mil piezas): de 3,17 a 3,94 caracteres por token en una muestra de inglés.

## Costo

Con precios por millón de tokens distintos para entrada y salida:

$$\\text{costo}=\\frac{n_{\\text{ent}}\\,p_{\\text{ent}}+n_{\\text{sal}}\\,p_{\\text{sal}}}{10^{6}}$$

Para inglés, $n\\approx \\text{palabras}/0{,}75$. Ejemplo con un precio supuesto de 2 dólares por millón: un informe de 3 000 palabras son unos 4 000 tokens; mil informes, 4 millones de tokens y 8 dólares. El mismo contenido en otro idioma puede necesitar más tokens: con cuatro frases medidas con tiktoken, el español usó 1,82 veces los tokens del inglés con el tokenizador de GPT-2, 1,32 con el de GPT-4 y 1,15 con el de GPT-4o (muestra muy pequeña: sirve para ilustrar, no para presupuestar).

## Por qué fallan las letras y las cifras

El modelo recibe identificadores, no caracteres: debe haber aprendido, de los datos, cómo se escribe cada pieza. Con tiktoken, « strawberry» (con su espacio inicial, como aparece en una frase) es un solo token en los tokenizadores de GPT-4 y GPT-4o: el modelo recibe un único número y las erres no están a la vista; y « frambuesa» llega en cuatro trozos. Edman, Schmid y Fraser (2024) midieron que la mayoría de los modelos parecen conocer la ortografía de sus tokens pero fallan al usarla para manipular texto. Con números, Singh y Strouse (2024) encontraron que tokenizar de derecha a izquierda (separando miles con comas) mejora la aritmética frente a la partición habitual de izquierda a derecha, y que la brecha se reduce con modelos más grandes. Deletrear (una letra por token) pone las letras a la vista del modelo.

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
        a, b = min(cuentas, key=lambda par: (-cuentas[par], par))   # el más frecuente; empate: orden alfabético
        fusiones.append((a, b, cuentas[(a, b)]))
        for p in piezas.values():
            i = 0
            while i < len(p) - 1:
                if p[i] == a and p[i + 1] == b:
                    p[i:i + 2] = [a + b]
                else:
                    i += 1
    return fusiones, piezas

corpus = {"gato": 5, "gatos": 3, "pato": 4, "patos": 2, "gatito": 1}
fusiones, piezas = entrenar_bpe(corpus, 10)
for a, b, n in fusiones:
    print(f"{a} + {b} -> {a + b}  ({n} veces)")
print(piezas["gatos"], piezas["gatito"])
# a + t -> at  (15 veces)
# at + o -> ato  (14 veces)
# g + ato -> gato  (8 veces)
# p + ato -> pato  (6 veces)
# gato + s -> gatos  (3 veces)
# pato + s -> patos  (2 veces)
# ['gatos'] ['g', 'at', 'i', 't', 'o']
\`\`\`

Y con un tokenizador real (\`pip install tiktoken\`; resultado medido con la versión 0.14.0):

\`\`\`python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
for texto in [" strawberry", " frambuesa", "1234567"]:
    ids = enc.encode(texto)
    print(texto, ids, [enc.decode([i]) for i in ids])
print(len(enc.encode("My cat is named Luna.")), len(enc.encode("Mi gato se llama Luna.")))
#  strawberry [73700] [' strawberry']
#  frambuesa [1448, 3042, 1157, 64] [' fr', 'amb', 'ues', 'a']
# 1234567 [4513, 10961, 22] ['123', '456', '7']
# 6 7
\`\`\`

## Lo que viene

Cada identificador de token selecciona una fila de la tabla de embeddings (lección 14); a partir de ahí, el modelo solo ve vectores. En la lección 21 veremos cómo cada token decide a cuáles otros mirar (atención). El costo de generar token a token se retoma en la lección 26 (inferencia) y la medida del contexto, también en tokens, en la lección 30.`,
    en: `## BPE step by step

Take a corpus of words with frequencies $f(w)$ and an initial alphabet $V_0$ (in the byte-level version, the 256 possible values of a byte). On each round we count how many times each pair of neighboring pieces $(a,b)$ appears, weighted by the frequency of the word:

$$\\operatorname{count}(a,b)=\\sum_{w} f(w)\\cdot \\#\\{\\text{occurrences of }(a,b)\\text{ in }w\\}$$

We pick $(a^*,b^*)=\\arg\\max_{(a,b)}\\operatorname{count}(a,b)$, replace that pair by a new piece throughout the corpus, and add it to the vocabulary: $V_{t+1}=V_t\\cup\\{a^*b^*\\}$. After $M$ merges, $|V|=|V_0|+M$. To tokenize new text, the merges are applied in the order they were created. Sennrich, Haddow and Birch (2016) adapted this data-compression idea by Gage (1994) to the rare words of machine translation.

The lesson's tokenizer uses $|V_0|=256$ and $M=400$, so $|V|=656$. GPT-2 uses 256 bytes plus 50,000 merges plus one special end-of-text symbol: $256+50{,}000+1=50{,}257$, the figure given in the GPT-2 paper and confirmed by counting with tiktoken.

## Bytes and pre-tokenization

Working with bytes (UTF-8) lets you write any text with just 256 base pieces: an ASCII letter takes one byte, an accented letter such as “á” or “ñ” takes two, and many emojis take four. That is why nothing is “unknown”: whatever the vocabulary does not cover falls back to single bytes. Before merging, the text is split into chunks (a word with its leading space, a number, punctuation) and merges never cross from one chunk to the next; GPT-2 does this so that “dog”, “dog.” and “dog!” do not fill the vocabulary with variants, with an exception for spaces.

## Vocabulary size

Every piece needs a row in the embedding table $E\\in\\mathbb{R}^{|V|\\times d}$, that is, $|V|\\cdot d$ parameters, and the final layer produces one value per piece. With $|V|=50{,}257$ and $d=768$ (the smallest GPT-2), the table has $50{,}257\\times 768\\approx 38.6$ million parameters. In exchange, a larger vocabulary compresses more: the Llama 3 technical report states that its 128-thousand-piece tokenizer improves compression over Llama 2’s (32 thousand pieces): from 3.17 to 3.94 characters per token on a sample of English.

## Cost

With different per-million-token prices for input and output:

$$\\text{cost}=\\frac{n_{\\text{in}}\\,p_{\\text{in}}+n_{\\text{out}}\\,p_{\\text{out}}}{10^{6}}$$

For English, $n\\approx \\text{words}/0.75$. Example with an assumed price of 2 dollars per million: a 3,000-word report is about 4,000 tokens; a thousand reports, 4 million tokens and 8 dollars. The same content in another language can need more tokens: on four sentences measured with tiktoken, Spanish used 1.82 times the tokens of English with GPT-2’s tokenizer, 1.32 with GPT-4’s and 1.15 with GPT-4o’s (a very small sample: good for illustration, not for budgeting).

## Why letters and digits fail

The model receives identifiers, not characters: it must have learned from data how each piece is spelled. With tiktoken, “ strawberry” (with its leading space, as it appears in a sentence) is a single token in the GPT-4 and GPT-4o tokenizers: the model receives one number and the r’s are not in sight; and “ frambuesa” arrives in four chunks. Edman, Schmid and Fraser (2024) measured that most models seem to know the spelling of their tokens but fail to use it to manipulate text. With numbers, Singh and Strouse (2024) found that tokenizing right to left (separating thousands with commas) improves arithmetic compared with the usual left-to-right split, and that the gap shrinks with larger models. Spelling out (one letter per token) puts the letters in the model’s sight.

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

corpus = {"gato": 5, "gatos": 3, "pato": 4, "patos": 2, "gatito": 1}   # Spanish: cat, cats, duck, ducks, kitten
merges, pieces = train_bpe(corpus, 10)
for a, b, n in merges:
    print(f"{a} + {b} -> {a + b}  ({n} times)")
print(pieces["gatos"], pieces["gatito"])
# a + t -> at  (15 times)
# at + o -> ato  (14 times)
# g + ato -> gato  (8 times)
# p + ato -> pato  (6 times)
# gato + s -> gatos  (3 times)
# pato + s -> patos  (2 times)
# ['gatos'] ['g', 'at', 'i', 't', 'o']
\`\`\`

And with a real tokenizer (\`pip install tiktoken\`; result measured with version 0.14.0):

\`\`\`python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
for text in [" strawberry", " frambuesa", "1234567"]:
    ids = enc.encode(text)
    print(text, ids, [enc.decode([i]) for i in ids])
print(len(enc.encode("My cat is named Luna.")), len(enc.encode("Mi gato se llama Luna.")))
#  strawberry [73700] [' strawberry']
#  frambuesa [1448, 3042, 1157, 64] [' fr', 'amb', 'ues', 'a']
# 1234567 [4513, 10961, 22] ['123', '456', '7']
# 6 7
\`\`\`

## What comes next

Each token identifier selects a row of the embedding table (lesson 14); from there on, the model only sees vectors. In lesson 21 we will see how each token decides which others to look at (attention). The cost of generating token by token returns in lesson 26 (inference), and the measure of context, also in tokens, in lesson 30.`,
  },

  lens: {
    es: [
      'El costo y los límites se miden en tokens, no en palabras ni en páginas. Antes de presupuestar, cuenta los tokens de tus propios documentos con el tokenizador del proveedor, y calcula entrada y salida por separado: la salida suele costar más por token.',
      'Tu idioma importa. El mismo contenido puede necesitar más tokens en español que en inglés, y la diferencia depende del modelo. Pide al proveedor el conteo en tu idioma y mídelo con mensajes reales, no con ejemplos en inglés.',
      'El tokenizador cambia entre modelos y versiones: el mismo texto puede dar otro conteo y otra factura al cambiar de modelo. Un proveedor lo documenta: su tokenizador más reciente produce alrededor de un treinta por ciento más tokens para el mismo texto.',
      'Señal de alerta: promesas de precio «por palabra» o «por página» sin decir cómo se convierten a tokens. Otra: confiar en el modelo para contar letras, comparar cifras largas o hacer aritmética sin verificar; pide que deletree o usa una herramienta.',
    ],
    en: [
      'Cost and limits are measured in tokens, not in words or pages. Before budgeting, count the tokens of your own documents with the provider’s tokenizer, and compute input and output separately: output usually costs more per token.',
      'Your language matters. The same content can need more tokens in Spanish than in English, and the difference depends on the model. Ask the provider for the count in your language and measure it with real messages, not with English examples.',
      'The tokenizer changes between models and versions: the same text can give a different count and a different bill when you switch models. One provider documents it: its newest tokenizer produces about thirty percent more tokens for the same text.',
      'Warning sign: prices “per word” or “per page” without saying how they convert to tokens. Another: trusting the model to count letters, compare long numbers or do arithmetic without checking; ask it to spell things out or use a tool.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué es un token?', en: 'What is a token?' },
      options: [
        { es: 'Siempre una palabra completa.', en: 'Always a whole word.' },
        { es: 'Siempre una sola letra.', en: 'Always a single letter.' },
        { es: 'Una pieza de texto del vocabulario: una palabra, un fragmento o incluso un byte.', en: 'A piece of text from the vocabulary: a word, a fragment, or even a byte.' },
        { es: 'Una oración completa.', en: 'A whole sentence.' },
      ],
      answer: 2,
      why: { es: 'Los tokens son piezas de tamaño variable. Las palabras muy comunes suelen ser un token; las raras se parten en varios, y lo que el vocabulario no cubre baja a bytes.', en: 'Tokens are pieces of variable size. Very common words are usually one token; rare ones split into several, and whatever the vocabulary does not cover falls back to bytes.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué hace BPE en cada paso al construir el vocabulario?', en: 'What does BPE do at each step when building the vocabulary?' },
      options: [
        { es: 'Elimina las palabras menos frecuentes del corpus.', en: 'Removes the least frequent words from the corpus.' },
        { es: 'Fusiona el par de piezas vecinas más frecuente en una pieza nueva.', en: 'Merges the most frequent pair of neighboring pieces into a new piece.' },
        { es: 'Traduce cada pieza al inglés.', en: 'Translates each piece into English.' },
        { es: 'Parte cada palabra en sílabas.', en: 'Splits each word into syllables.' },
      ],
      answer: 1,
      why: { es: 'Cuenta los pares vecinos (pesados por la frecuencia de cada palabra), fusiona el más frecuente y repite. No usa reglas de idioma: solo estadística del corpus.', en: 'It counts neighboring pairs (weighted by each word’s frequency), merges the most frequent one and repeats. It uses no language rules: only the corpus statistics.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un informe en inglés tiene 3 000 palabras. Con la regla de un token por cada tres cuartas partes de palabra y un precio supuesto de 2 dólares por millón de tokens, ¿cuánto cuesta procesar 1 000 informes?', en: 'An English report has 3,000 words. With the rule of one token per three quarters of a word and an assumed price of 2 dollars per million tokens, how much does it cost to process 1,000 reports?' },
      options: [
        { es: '0,80 dólares', en: '$0.80' },
        { es: '80 dólares', en: '$80' },
        { es: '6 dólares', en: '$6' },
        { es: '8 dólares', en: '$8' },
      ],
      answer: 3,
      why: { es: 'Tokens por informe ≈ 3 000 ÷ 0,75 = 4 000. Para mil informes son 4 millones de tokens, y 4 × 2 = 8 dólares. Si contaras un token por palabra saldrían 6 dólares: subestimarías el costo en una cuarta parte.', en: 'Tokens per report ≈ 3,000 ÷ 0.75 = 4,000. For a thousand reports that is 4 million tokens, and 4 × 2 = $8. If you counted one token per word you would get $6: you would underestimate the cost by a quarter.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu empresa presupuestó un asistente para clientes en español usando pruebas de costo hechas en inglés. ¿Qué conviene hacer?', en: 'Your company budgeted a customer assistant in Spanish using cost tests run in English. What is the sensible thing to do?' },
      options: [
        { es: 'Mantener el presupuesto: los textos usan los mismos tokens en todos los idiomas.', en: 'Keep the budget: texts use the same tokens in every language.' },
        { es: 'Contar los tokens de mensajes reales en español con el tokenizador del proveedor y presupuestar con esos conteos.', en: 'Count the tokens of real Spanish messages with the provider’s tokenizer and budget with those counts.' },
        { es: 'Esperar a ver la factura del primer mes.', en: 'Wait to see the first month’s bill.' },
        { es: 'Multiplicar siempre por dos, porque el español cuesta el doble.', en: 'Always multiply by two, because Spanish costs double.' },
      ],
      answer: 1,
      why: { es: 'El número de tokens para un mismo contenido depende del idioma y del tokenizador, y no hay un factor universal. Lo fiable es medirlo con tus textos y con el modelo que vas a usar.', en: 'The number of tokens for the same content depends on the language and the tokenizer, and there is no universal factor. What is reliable is to measure it with your texts and the model you will use.' },
    },
  ],

  glossary: ['token', 'tokenizer', 'bpe', 'vocabulary', 'language-model', 'autoregression', 'embedding', 'vector'],

  terms: [
    { id: 'token', term: { es: 'Token', en: 'Token' }, def: { es: 'Pieza de texto (una palabra, un fragmento de palabra, un signo o un byte) tomada del vocabulario. Es la unidad que el modelo lee y genera, y por la que se cobra.', en: 'A piece of text (a word, a word fragment, a symbol, or a byte) taken from the vocabulary. It is the unit the model reads and generates, and the unit you are billed for.' } },
    { id: 'tokenizer', term: { es: 'Tokenizador', en: 'Tokenizer' }, def: { es: 'Programa que convierte texto en una lista de tokens (con su número) y de vuelta. Se construye antes de entrenar el modelo y queda fijo.', en: 'A program that converts text into a list of tokens (with their numbers) and back. It is built before the model is trained and stays fixed.' } },
    { id: 'bpe', term: { es: 'BPE (codificación por pares de bytes)', en: 'BPE (byte pair encoding)' }, def: { es: 'Algoritmo que arma el vocabulario fusionando, una y otra vez, el par de piezas vecinas más frecuente de un corpus. Nació como técnica de compresión (Gage, 1994) y se adaptó al lenguaje (Sennrich et al., 2016).', en: 'An algorithm that builds the vocabulary by merging, again and again, the most frequent pair of neighboring pieces in a corpus. It began as a compression technique (Gage, 1994) and was adapted to language (Sennrich et al., 2016).' } },
    { id: 'vocabulary', term: { es: 'Vocabulario', en: 'Vocabulary' }, def: { es: 'Lista de todas las piezas (tokens) que un tokenizador puede producir. Los reales tienen de unas treinta mil a unas doscientas mil; el de la lección, 656.', en: 'The list of all the pieces (tokens) a tokenizer can produce. Real ones have from about thirty thousand to about two hundred thousand; the lesson’s has 656.' } },
  ],

  sources: [
    { title: 'Neural Machine Translation of Rare Words with Subword Units', authors: 'Sennrich, R., Haddow, B., Birch, A.', year: 2016, url: 'https://arxiv.org/abs/1508.07909' },
    { title: 'A new algorithm for data compression (The C Users Journal, 12(2), 23–38)', authors: 'Gage, P.', year: 1994 },
    { title: 'Language Models are Unsupervised Multitask Learners (GPT-2)', authors: 'Radford, A., Wu, J., Child, R., Luan, D., Amodei, D., Sutskever, I.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Language Model Tokenizers Introduce Unfairness Between Languages', authors: 'Petrov, A., La Malfa, E., Torr, P. H. S., Bibi, A.', year: 2023, url: 'https://arxiv.org/abs/2305.15425' },
    { title: 'Do All Languages Cost the Same? Tokenization in the Era of Commercial Language Models', authors: 'Ahia, O., Kumar, S., Gonen, H., Kasai, J., Mortensen, D. R., Smith, N. A., Tsvetkov, Y.', year: 2023, url: 'https://arxiv.org/abs/2305.13707' },
    { title: 'CUTE: Measuring LLMs’ Understanding of Their Tokens', authors: 'Edman, L., Schmid, H., Fraser, A.', year: 2024, url: 'https://arxiv.org/abs/2409.15452' },
    { title: 'Tokenization counts: the impact of tokenization on arithmetic in frontier LLMs', authors: 'Singh, A. K., Strouse, D. J.', year: 2024, url: 'https://arxiv.org/abs/2402.14903' },
    { title: 'tiktoken (biblioteca de tokenización de OpenAI, licencia MIT; versión 0.14.0 usada para las mediciones)', authors: 'OpenAI', year: 2022, url: 'https://github.com/openai/tiktoken' },
    { title: 'Pricing (documentación de la plataforma Claude): precio por millón de tokens y regla práctica de tokens por palabra', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
  ],
});
