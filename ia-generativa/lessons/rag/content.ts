import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'rag',

  objectives: {
    es: [
      'Explicar el recorrido de un sistema RAG: fragmentar, vectorizar, indexar, recuperar, armar el prompt y generar con citas.',
      'Calcular con TF-IDF y similitud coseno qué fragmentos se parecen a una pregunta, y predecir cuáles entran en el prompt según k.',
      'Reconocer las tres fallas típicas (no recuperar, contradicciones, instrucciones escondidas) y medir la recuperación con preguntas propias.',
    ],
    en: [
      'Explain the path of a RAG system: chunk, vectorize, index, retrieve, build the prompt, and generate with citations.',
      'Use TF-IDF and cosine similarity to work out which chunks resemble a question, and predict which ones enter the prompt for a given k.',
      'Recognize the three typical failures (not retrieving, contradictions, hidden instructions) and measure retrieval with your own questions.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Le preguntas a un chatbot cuánto dura la garantía de la batería de una tienda de bicicletas. El modelo nunca leyó el manual de esa tienda.',
      en: 'You ask a chatbot how long the battery warranty lasts at a bike shop. The model has never read that shop’s manual.',
    },
    {
      id: 'frozen',
      es: 'Sus pesos están congelados desde el entrenamiento, y lo que sabe termina en una fecha de corte. Nada de lo que escribas en la conversación lo reentrena.',
      en: 'Its weights have been frozen since training, and what it knows ends at a cutoff date. Nothing you type in the conversation retrains it.',
    },
    {
      id: 'guess',
      es: 'Sin el manual, solo le queda adivinar con lo que vio en internet. Esto es lo que respondió un modelo real, sin documentos: nadie puede comprobarlo.',
      en: 'Without the manual, all it can do is guess from what it saw on the internet. This is what a real model answered, with no documents: no one can check it.',
    },
    {
      id: 'paste',
      es: 'Una salida es pegarle todos los documentos en el prompt. Pero una empresa tiene miles de páginas, la ventana de contexto tiene límite y cada token se paga.',
      en: 'One way out is to paste every document into the prompt. But a company has thousands of pages, the context window has a limit, and every token costs money.',
    },
    {
      id: 'idea',
      es: 'La idea de RAG, generación aumentada por recuperación: no pegar todo, sino buscar primero las pocas páginas que importan y dárselas al modelo junto con la pregunta.',
      en: 'The idea behind RAG, retrieval-augmented generation: do not paste everything. First look up the few pages that matter, and hand them to the model with the question.',
      note: { es: 'RAG: buscar primero, responder después.', en: 'RAG: look up first, answer after.' },
    },
    {
      id: 'phases',
      es: 'Funciona en dos tiempos. Una sola vez se prepara la biblioteca; y con cada pregunta se busca, se arma el prompt y se genera la respuesta.',
      en: 'It works in two stages. Once, the library is prepared; then, with every question, we search, build the prompt, and generate the answer.',
    },
    {
      id: 'chunk',
      es: 'Preparar empieza por fragmentar. Un documento largo se corta en trozos, y cada trozo, o chunk, es lo que luego se busca y se pega en el prompt.',
      en: 'Preparing starts with chunking. A long document is cut into pieces, and each piece, or chunk, is what gets searched later and pasted into the prompt.',
      tts: {
        es: 'Preparar empieza por fragmentar. Un documento largo se corta en trozos, y cada trozo, o chank, es lo que luego se busca y se pega en el prompt.',
        en: 'Preparing starts with chunking. A long document is cut into pieces, and each piece, or chunk, is what gets searched later and pasted into the prompt.',
      },
      note: { es: 'Fragmento (chunk): la unidad que se busca y se pega.', en: 'Chunk: the unit that is searched and pasted.' },
    },
    {
      id: 'chunk-small',
      es: '¿De qué tamaño? Si el corte es muy chico, un dato se separa de su condición, y el fragmento, leído solo, engaña.',
      en: 'How big should the pieces be? If the cut is too small, a fact gets separated from its condition, and the chunk, read alone, misleads.',
      pad: 0.3,
    },
    {
      id: 'try-chunk',
      es: 'Tu turno: mueve el tamaño del fragmento hasta que el dato y su condición queden juntos, sin arrastrar demasiado texto de más.',
      en: 'Your turn: move the chunk size until the fact and its condition end up together, without dragging in too much extra text.',
      gate: {
        id: 'chunk',
        prompt: {
          es: 'Encuentra un tamaño en que el mejor fragmento incluya el dato y su condición, y al menos el 40 % del fragmento sea respuesta.',
          en: 'Find a size where the best chunk includes the fact and its condition, and at least 40% of the chunk is the answer.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'chunk-big',
      es: 'Ojo: con tres oraciones vuelve a fallar, porque el corte cae justo en medio. Y con demasiado texto, la respuesta se diluye en ruido. No hay tamaño universal: se prueba.',
      en: 'Careful: with three sentences it fails again, because the cut falls right in the middle. And with too much text, the answer drowns in noise. There is no universal size: you test.',
      pad: 0.4,
    },
    {
      id: 'vectorize',
      es: 'Segundo, vectorizar. Como en la lección de embeddings, cada fragmento se vuelve un vector. El más simple cuenta cuántas veces aparece cada palabra, y es el que usamos aquí.',
      en: 'Second, vectorizing. As in the embeddings lesson, every chunk becomes a vector. The simplest one counts how often each word appears, and it is the one we use here.',
    },
    {
      id: 'idf',
      es: 'Pero no todas las palabras valen igual. «Días» aparece en muchos fragmentos y distingue poco; «cancelar» está en uno solo y dice mucho. Ese peso extra se llama TF-IDF.',
      en: 'But not every word counts the same. “Days” shows up in many chunks and tells little apart; “cancel” is in just one and says a lot. That extra weight is called TF-IDF.',
      tts: {
        es: 'Pero no todas las palabras valen igual. «Días» aparece en muchos fragmentos y distingue poco; «cancelar» está en uno solo y dice mucho. Ese peso extra se llama te efe, i de efe.',
        en: 'But not every word counts the same. “Days” shows up in many chunks and tells little apart; “cancel” is in just one and says a lot. That extra weight is called T F, I D F.',
      },
      note: { es: 'TF-IDF: las palabras raras pesan más.', en: 'TF-IDF: rare words weigh more.' },
      pad: 0.3,
    },
    {
      id: 'index',
      es: 'Todos los vectores, con su texto y su fuente, forman el índice. Una base de datos vectorial es un almacén hecho para guardar ese índice y encontrar vecinos cercanos muy rápido.',
      en: 'All the vectors, with their text and their source, make up the index. A vector database is a store built to hold that index and find nearby neighbors very fast.',
      note: { es: 'Índice vectorial: fragmentos + vectores + fuente.', en: 'Vector index: chunks + vectors + source.' },
    },
    {
      id: 'ask',
      es: 'Llega una pregunta. Se convierte en vector con la misma receta: mismas palabras, mismos pesos. Así queda en el mismo espacio que los fragmentos.',
      en: 'A question arrives. It becomes a vector with the same recipe: same words, same weights. That puts it in the same space as the chunks.',
    },
    {
      id: 'cosine',
      es: 'Se compara con cada fragmento mediante la similitud coseno de la lección catorce: cuánto apuntan los dos vectores en la misma dirección. Cada barra es un fragmento.',
      en: 'It is compared with every chunk using the cosine similarity from lesson fourteen: how much the two vectors point in the same direction. Each bar is one chunk.',
      pad: 0.3,
    },
    {
      id: 'topk',
      es: 'Se ordenan las puntuaciones y se toman las k mejores; aquí, tres. Buscar en el índice lo más parecido a la pregunta es la recuperación, o retrieval.',
      en: 'The scores are sorted and the best k are kept; here, three. Searching the index for what looks most like the question is called retrieval.',
      note: { es: 'Recuperar: los k fragmentos más parecidos.', en: 'Retrieve: the k most similar chunks.' },
      pad: 0.4,
    },
    {
      id: 'try-ask',
      es: 'Tu turno: escribe una pregunta sobre la tienda, o elige una, y mira qué fragmentos recupera. Prueba también una que el manual no responda.',
      en: 'Your turn: type a question about the shop, or pick one, and see which chunks it retrieves. Also try one that the manual does not answer.',
      gate: {
        id: 'ask',
        prompt: {
          es: 'Pregunta algo que el manual responda y algo que no responda (por ejemplo, la sucursal de Lima).',
          en: 'Ask something the manual answers and something it does not (for example, the Lima branch).',
        },
      },
      pad: 0.4,
    },
    {
      id: 'abstain',
      es: 'Cuando ningún fragmento se parece lo bastante, lo honesto es decir «no lo encuentro» en vez de inventar. Ese umbral también se calibra con pruebas.',
      en: 'When no chunk looks similar enough, the honest move is to say “I can’t find it” rather than make something up. That threshold also has to be calibrated with tests.',
      pad: 0.3,
    },
    {
      id: 'prompt',
      es: 'Los fragmentos recuperados se pegan en el prompt, numerados, junto con la pregunta y una instrucción de sistema: responde solo con estas fuentes y cítalas.',
      en: 'The retrieved chunks are pasted into the prompt, numbered, together with the question and a system instruction: answer only from these sources, and cite them.',
    },
    {
      id: 'generate',
      es: 'Ahora el modelo genera, token a token, como siempre. Cambia algo: tiene a la vista lo que necesita. Aquí el generador es de juguete: copia las frases relevantes, sin redactar.',
      en: 'Now the model generates, token by token, as always. One thing changes: what it needs is in front of it. Here the generator is a toy: it copies the relevant sentences, without rewriting.',
      pad: 0.3,
    },
    {
      id: 'ground',
      es: 'Cada afirmación lleva su cita, y la cita lleva a la fuente: quien lee puede comprobarla. Anclar la respuesta en fuentes verificables se llama grounding.',
      en: 'Every claim carries its citation, and the citation leads to the source, so the reader can check it. Anchoring the answer in verifiable sources is called grounding.',
      tts: {
        es: 'Cada afirmación lleva su cita, y la cita lleva a la fuente: quien lee puede comprobarla. Anclar la respuesta en fuentes verificables se llama graunding.',
        en: 'Every claim carries its citation, and the citation leads to the source, so the reader can check it. Anchoring the answer in verifiable sources is called grounding.',
      },
      note: { es: 'Grounding: cada afirmación con su fuente.', en: 'Grounding: every claim with its source.' },
      pad: 0.3,
    },
    {
      id: 'k-trade',
      es: '¿Cuántos fragmentos pegar? Con pocos, el correcto puede quedar fuera. Con muchos, gastas contexto, pagas más y metes ruido, justo donde el modelo se pierde en el medio.',
      en: 'How many chunks should you paste? With too few, the right one may be left out. With too many, you burn context, pay more, and add noise, right where the model gets lost in the middle.',
      pad: 0.3,
    },
    {
      id: 'try-k',
      es: 'Tu turno: con esta pregunta, sube k hasta que entre el fragmento que sí la responde. ¿Cuántos fragmentos hizo falta pegar?',
      en: 'Your turn: with this question, raise k until the chunk that actually answers it gets in. How many chunks did you need to paste?',
      gate: {
        id: 'k',
        prompt: {
          es: 'Sube k hasta que el fragmento correcto entre en el prompt.',
          en: 'Raise k until the right chunk gets into the prompt.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'rerank',
      es: 'Una mejora: pedir más candidatos y reordenarlos con un modelo más fino, el reordenador, que lee pregunta y fragmento juntos. Es más lento, así que solo se usa con unos pocos.',
      en: 'One fix: fetch more candidates and reorder them with a finer model, the reranker, which reads the question and the chunk together. It is slower, so it is used on just a few.',
      note: { es: 'Reordenar: un modelo fino reordena a los candidatos.', en: 'Rerank: a finer model reorders the candidates.' },
      pad: 0.5,
    },
    {
      id: 'fail-intro',
      es: 'RAG no es magia. Puede fallar en tres sitios: no encontrar lo correcto, encontrar documentos que se contradicen, o traer una trampa escondida en el texto.',
      en: 'RAG is not magic. It can fail in three places: not finding the right chunk, finding documents that contradict each other, or pulling in a trap hidden in the text.',
    },
    {
      id: 'fail-miss',
      es: 'Primero, no encontrar. «Si me arrepiento, ¿me regresan mi dinero?» no comparte ninguna palabra con el fragmento correcto, así que por palabras vale cero. Con embeddings sube, pero no llega primero.',
      en: 'First, not finding it. “If I change my mind, do I get my money back?” shares no word with the right chunk, so by words it scores zero. Embeddings lift it, but it still does not come first.',
      pad: 0.3,
    },
    {
      id: 'fail-conflict',
      es: 'Segundo, contradicciones. Si el índice conserva la garantía vieja de doce meses junto a la nueva de dieciocho, el modelo puede citar cualquiera con total seguridad. Los documentos necesitan fecha y versión.',
      en: 'Second, contradictions. If the index keeps the old twelve-month warranty next to the new eighteen-month one, the model can cite either with total confidence. Documents need dates and versions.',
      pad: 0.3,
    },
    {
      id: 'fail-trap',
      es: 'Tercero, una trampa. Una reseña de un desconocido puede traer una orden escondida. Si llega al prompt, el modelo puede obedecerla como si fuera instrucción. Es la inyección de instrucciones.',
      en: 'Third, a trap. A review from a stranger can carry a hidden command. If it reaches the prompt, the model may obey it as if it were an instruction. This is prompt injection.',
      pad: 0.3,
    },
    {
      id: 'fail-guard',
      es: 'No hay defensa perfecta. Se reduce el daño: tratar los documentos como datos, dar al sistema permisos mínimos, filtrar las fuentes y revisar a mano lo sensible.',
      en: 'There is no perfect defense. You reduce the damage: treat documents as data, give the system minimal permissions, filter the sources, and review sensitive things by hand.',
      pad: 0.3,
    },
    {
      id: 'eval-why',
      es: '¿Cómo sabes si tu RAG funciona? Se mide en dos partes: si recuperó el fragmento correcto, y si la respuesta se apoya en él. La primera es condición de la segunda.',
      en: 'How do you know your RAG works? You measure it in two parts: whether it retrieved the right chunk, and whether the answer relies on it. The first is a precondition for the second.',
    },
    {
      id: 'eval-gold',
      es: 'Para la primera parte armas preguntas con su fragmento correcto conocido. Aquí hay diez. Mueve k y mira en cuántas el correcto cae entre los k primeros.',
      en: 'For the first part you write questions with a known right chunk. Here are ten. Move k and see in how many of them the right chunk lands among the first k.',
      note: { es: 'Evalúa la recuperación con preguntas de oro.', en: 'Evaluate retrieval with gold questions.' },
      pad: 0.4,
    },
    {
      id: 'eval-result',
      es: 'Ninguna configuración acierta las diez. Las paráfrasis rompen la búsqueda por palabras, los embeddings ayudan, y el reordenador suele mejorar el orden, pero no rescata lo que nunca llegó.',
      en: 'No setup gets all ten. Paraphrases break word search, embeddings help, and the reranker usually improves the order, but it cannot rescue what never arrived.',
      pad: 0.3,
    },
    {
      id: 'recap',
      es: 'En resumen: se prepara una vez, fragmentando, vectorizando e indexando; y por pregunta se recupera, se reordena, se arma el prompt y se genera con citas. Y se mide la recuperación.',
      en: 'In short: prepare once, by chunking, vectorizing, and indexing; then, per question, retrieve, rerank, build the prompt, and generate with citations. And measure the retrieval.',
    },
    {
      id: 'bridge',
      es: 'Hasta aquí el modelo lee. ¿Y si, además de leer, pudiera actuar: consultar una base, calcular, escribir en tus sistemas? Eso son los agentes.',
      en: 'So far the model reads. What if, besides reading, it could act: query a database, calculate, write into your systems? That is what agents are.',
    },
  ],

  keyIdeas: {
    es: [
      'RAG no reentrena el modelo: en cada pregunta busca fragmentos de tus documentos y los pega en el prompt junto con la pregunta.',
      'Se prepara una vez (fragmentar, vectorizar, indexar) y en cada pregunta se recupera, se reordena, se arma el prompt y se genera con citas.',
      'La búsqueda compara vectores con la similitud coseno. TF-IDF cuenta palabras y pesa más las raras; los embeddings capturan significado y rescatan paráfrasis.',
      'Tamaño de fragmento, valor de k y reordenamiento son decisiones con costo: se eligen midiendo, no por intuición.',
      'Fallas típicas: no recuperar lo correcto, documentos que se contradicen e instrucciones escondidas en el texto. Se mide la recuperación con preguntas propias.',
    ],
    en: [
      'RAG does not retrain the model: for each question it looks up chunks of your documents and pastes them into the prompt with the question.',
      'It is prepared once (chunk, vectorize, index) and, for every question, you retrieve, rerank, build the prompt, and generate with citations.',
      'Search compares vectors with cosine similarity. TF-IDF counts words and weighs rare ones more; embeddings capture meaning and rescue paraphrases.',
      'Chunk size, the value of k, and reranking are decisions with a cost: you choose them by measuring, not by hunch.',
      'Typical failures: not retrieving the right chunk, documents that contradict each other, and instructions hidden in the text. Measure retrieval with your own questions.',
    ],
  },

  misconception: {
    wrong: {
      es: 'RAG «entrena» al modelo con tus documentos: después de leerlos, el modelo los sabe.',
      en: 'RAG “trains” the model on your documents: after reading them, the model knows them.',
    },
    right: {
      es: 'El modelo no aprende nada: sus pesos no cambian. En cada pregunta se buscan los fragmentos y se pegan en el prompt; si la búsqueda no los trae, el modelo no los ve.',
      en: 'The model learns nothing: its weights do not change. For each question the chunks are looked up and pasted into the prompt; if the search does not bring them, the model never sees them.',
    },
  },

  deeper: {
    es: `## TF-IDF y similitud coseno

Dado un conjunto de $N$ fragmentos, la frecuencia del término $t$ en el fragmento $d$ es $c_{t,d}$ y $\\mathrm{df}(t)$ es en cuántos fragmentos aparece. Con las variantes de la lección:

$$\\mathrm{tf}(t,d)=1+\\ln c_{t,d}\\qquad \\mathrm{idf}(t)=\\ln\\frac{N+1}{\\mathrm{df}(t)+1}+1\\qquad w_{t,d}=\\mathrm{tf}(t,d)\\cdot\\mathrm{idf}(t)$$

El vector de cada fragmento se normaliza, $\\hat{\\mathbf d}=\\mathbf d/\\lVert\\mathbf d\\rVert$, y la pregunta recibe el mismo tratamiento con los $\\mathrm{idf}$ del índice. Entonces la similitud coseno es solo un producto punto:

$$\\cos(\\mathbf q,\\mathbf d)=\\hat{\\mathbf q}\\cdot\\hat{\\mathbf d}\\in[0,1]$$

La idea de pesar por rareza es de Spärck Jones (1972): un término que aparece en pocos documentos distingue más.

## BM25, la otra puntuación léxica habitual

BM25 (Robertson y Zaragoza, 2009) puntúa a cada fragmento $D$ con una saturación de la frecuencia y una corrección por longitud:

$$\\mathrm{score}(D,Q)=\\sum_{t\\in Q}\\mathrm{idf}(t)\\,\\frac{f(t,D)\\,(k_1+1)}{f(t,D)+k_1\\,(1-b+b\\,|D|/\\mathrm{avgdl})}$$

con $k_1$ entre 1,2 y 2 y $b=0{,}75$ como valores habituales. Es un punto de partida difícil de superar por palabras, y muchos sistemas lo combinan con embeddings (búsqueda híbrida).

## Vectores densos y búsqueda aproximada

Con embeddings (lección 14) el vector tiene unas cientos de dimensiones y no hay palabras que coincidan: la similitud coseno compara significados. Buscar el más cercano comparando contra los $N$ vectores cuesta $O(N\\cdot D)$; con millones de fragmentos se usan índices aproximados, como HNSW (Malkov y Yashunin), que cambian un poco de exactitud por mucha velocidad. En el artículo que dio nombre a RAG (Lewis et al., 2020) se dividió Wikipedia en fragmentos de 100 palabras (unos 21 millones) y se indexaron con FAISS usando HNSW.

## Reordenar

Un recuperador denso (bi-encoder) codifica pregunta y fragmento por separado, así que los fragmentos se vectorizan una sola vez. Un reordenador (cross-encoder) lee pregunta y fragmento **juntos** en una pasada del modelo y devuelve una puntuación: es más preciso, pero cuesta una pasada por cada candidato, por eso solo se aplica a los primeros 20 o 50, no a todo el índice (Nogueira y Cho, 2019). En la lección, las cifras de embeddings y de reordenador se midieron aparte con \`intfloat/multilingual-e5-small\` y \`cross-encoder/mmarco-mMiniLMv2-L12-H384-v1\` (ver \`build-dense.py\`).

## Cómo se mide la recuperación

Para cada pregunta de oro se anota el fragmento correcto y su puesto $r_i$ en la lista ordenada ($r_i=0$ si no aparece). Con $Q$ preguntas:

$$\\mathrm{hit@}k=\\frac1Q\\sum_i \\mathbf 1[1\\le r_i\\le k]\\qquad \\mathrm{MRR}=\\frac1Q\\sum_i\\begin{cases}1/r_i & r_i>0\\\\ 0 & r_i=0\\end{cases}$$

Esto mide solo la primera mitad. La segunda (¿la respuesta se apoya en lo recuperado?) se evalúa con casos de oro y con revisión humana o con un modelo como juez (lección 34); marcos como Ragas separan ambas partes.

## En código

Un buscador TF-IDF completo, sin librerías. Es la misma receta de la lección, sin reducir a la raíz de las palabras:

\`\`\`python
import math, re
from collections import Counter

STOP = {"la", "el", "de", "los", "a", "en", "tu", "o", "es", "cuanto", "dura"}

def terms(text):
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP]

chunks = [
    "la bateria tiene 18 meses de garantia o 500 ciclos de carga",
    "puedes cancelar tu compra durante los 30 dias posteriores a la entrega",
    "el envio es gratis en compras mayores a 1500",
    "carga la bateria a temperatura ambiente",
]

N = len(chunks)
bags = [Counter(terms(c)) for c in chunks]
df = Counter(t for b in bags for t in b)
idf = {t: math.log((N + 1) / (df[t] + 1)) + 1 for t in df}

def vector(bag):
    v = {t: (1 + math.log(c)) * idf[t] for t, c in bag.items() if t in idf}
    norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
    return {t: x / norm for t, x in v.items()}

index = [vector(b) for b in bags]

def search(question, k=2):
    q = vector(Counter(terms(question)))
    scores = [sum(w * d.get(t, 0.0) for t, w in q.items()) for d in index]
    return sorted(enumerate(scores), key=lambda p: -p[1])[:k]

for i, s in search("cuanto dura la garantia de la bateria"):
    print(f"{s:.2f}  {chunks[i]}")
# 0.47  la bateria tiene 18 meses de garantia o 500 ciclos de carga
# 0.27  carga la bateria a temperatura ambiente
\`\`\`

## Lo que viene

Aquí el modelo solo lee. En la lección 32 puede además usar herramientas (buscar, calcular, escribir). La inyección de instrucciones se retoma en la lección 35 y la evaluación completa de sistemas, en la 34.`,
    en: `## TF-IDF and cosine similarity

Given $N$ chunks, the count of term $t$ in chunk $d$ is $c_{t,d}$ and $\\mathrm{df}(t)$ is the number of chunks it appears in. With the variants used in the lesson:

$$\\mathrm{tf}(t,d)=1+\\ln c_{t,d}\\qquad \\mathrm{idf}(t)=\\ln\\frac{N+1}{\\mathrm{df}(t)+1}+1\\qquad w_{t,d}=\\mathrm{tf}(t,d)\\cdot\\mathrm{idf}(t)$$

Each chunk vector is normalized, $\\hat{\\mathbf d}=\\mathbf d/\\lVert\\mathbf d\\rVert$, and the question gets the same treatment using the index’s $\\mathrm{idf}$ values. Cosine similarity then reduces to a dot product:

$$\\cos(\\mathbf q,\\mathbf d)=\\hat{\\mathbf q}\\cdot\\hat{\\mathbf d}\\in[0,1]$$

Weighting by rarity goes back to Spärck Jones (1972): a term that appears in few documents tells them apart better.

## BM25, the other common lexical score

BM25 (Robertson and Zaragoza, 2009) scores each chunk $D$ with a saturating term frequency and a length correction:

$$\\mathrm{score}(D,Q)=\\sum_{t\\in Q}\\mathrm{idf}(t)\\,\\frac{f(t,D)\\,(k_1+1)}{f(t,D)+k_1\\,(1-b+b\\,|D|/\\mathrm{avgdl})}$$

with $k_1$ between 1.2 and 2 and $b=0.75$ as usual values. It is a hard baseline to beat by words alone, and many systems combine it with embeddings (hybrid search).

## Dense vectors and approximate search

With embeddings (lesson 14) the vector has a few hundred dimensions and no words need to match: cosine similarity compares meanings. Finding the nearest one by comparing against all $N$ vectors costs $O(N\\cdot D)$; with millions of chunks, approximate indexes such as HNSW (Malkov and Yashunin) trade a little exactness for a lot of speed. In the paper that named RAG (Lewis et al., 2020), Wikipedia was split into 100-word chunks (about 21 million) and indexed with FAISS using HNSW.

## Reranking

A dense retriever (bi-encoder) encodes the question and the chunk separately, so chunks are vectorized only once. A reranker (cross-encoder) reads the question and the chunk **together** in one model pass and returns a score: more precise, but one pass per candidate, so it is applied only to the top 20 or 50, not to the whole index (Nogueira and Cho, 2019). In the lesson, the embedding and reranker figures were measured offline with \`intfloat/multilingual-e5-small\` and \`cross-encoder/mmarco-mMiniLMv2-L12-H384-v1\` (see \`build-dense.py\`).

## How retrieval is measured

For each gold question you record the right chunk and its position $r_i$ in the ranked list ($r_i=0$ if it does not appear). With $Q$ questions:

$$\\mathrm{hit@}k=\\frac1Q\\sum_i \\mathbf 1[1\\le r_i\\le k]\\qquad \\mathrm{MRR}=\\frac1Q\\sum_i\\begin{cases}1/r_i & r_i>0\\\\ 0 & r_i=0\\end{cases}$$

This measures only the first half. The second (does the answer rely on what was retrieved?) is evaluated with gold cases and with human review or a model as judge (lesson 34); frameworks such as Ragas keep the two parts separate.

## In code

A complete TF-IDF search, with no libraries. It is the same recipe as the lesson, without stemming:

\`\`\`python
import math, re
from collections import Counter

STOP = {"the", "has", "an", "or", "you", "can", "your", "of", "on", "is", "at", "how", "long"}

def terms(text):
    return [w for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in STOP]

chunks = [
    "the battery has an 18 month warranty or 500 charge cycles",
    "you can cancel your purchase within 30 days of delivery",
    "shipping is free on purchases over 1500",
    "charge the battery at room temperature",
]

N = len(chunks)
bags = [Counter(terms(c)) for c in chunks]
df = Counter(t for b in bags for t in b)
idf = {t: math.log((N + 1) / (df[t] + 1)) + 1 for t in df}

def vector(bag):
    v = {t: (1 + math.log(c)) * idf[t] for t, c in bag.items() if t in idf}
    norm = math.sqrt(sum(x * x for x in v.values())) or 1.0
    return {t: x / norm for t, x in v.items()}

index = [vector(b) for b in bags]

def search(question, k=2):
    q = vector(Counter(terms(question)))
    scores = [sum(w * d.get(t, 0.0) for t, w in q.items()) for d in index]
    return sorted(enumerate(scores), key=lambda p: -p[1])[:k]

for i, s in search("how long is the battery warranty"):
    print(f"{s:.2f}  {chunks[i]}")
# 0.51  the battery has an 18 month warranty or 500 charge cycles
# 0.27  charge the battery at room temperature
\`\`\`

## What comes next

Here the model only reads. In lesson 32 it can also use tools (search, calculate, write). Prompt injection comes back in lesson 35, and full system evaluation in lesson 34.`,
  },

  lens: {
    es: [
      'RAG da respuestas con tus datos y con fuentes que se pueden revisar, sin reentrenar: para actualizar el conocimiento se cambian documentos, no modelos. Pregunta cómo se actualiza el índice y cada cuánto.',
      'La calidad se decide en la recuperación: si el fragmento correcto no llega al prompt, ningún modelo puede citarlo. Pide la tasa de acierto de recuperación medida con tus preguntas, no con una demostración.',
      'Gobierna los documentos: versión, fecha, dueño y permisos. Lo que el sistema puede recuperar, puede decirlo: contradicciones viejas incluidas, y datos que no todas las personas deberían ver.',
      'Todo texto recuperado es no confiable: una reseña, una página web o un correo pueden traer instrucciones escondidas. Limita lo que el sistema puede hacer con lo que lee y registra qué fuentes usó en cada respuesta.',
    ],
    en: [
      'RAG gives answers grounded in your data, with sources that can be checked, without retraining: to update knowledge you change documents, not models. Ask how the index is updated and how often.',
      'Quality is decided at retrieval: if the right chunk never reaches the prompt, no model can cite it. Ask for the retrieval hit rate measured on your own questions, not on a demo.',
      'Govern the documents: version, date, owner, and permissions. Whatever the system can retrieve, it can say, including stale contradictions and data that not everyone should see.',
      'All retrieved text is untrusted: a review, a web page, or an email can carry hidden instructions. Limit what the system can do with what it reads, and log which sources it used for each answer.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué hace un sistema RAG antes de que el modelo responda?', en: 'What does a RAG system do before the model answers?' },
      options: [
        { es: 'Reentrena el modelo con tus documentos.', en: 'It retrains the model on your documents.' },
        { es: 'Busca en tus documentos los fragmentos relevantes y los pega en el prompt.', en: 'It searches your documents for the relevant chunks and pastes them into the prompt.' },
        { es: 'Amplía la ventana de contexto del modelo.', en: 'It enlarges the model’s context window.' },
        { es: 'Traduce la pregunta a un idioma que el modelo entienda mejor.', en: 'It translates the question into a language the model understands better.' },
      ],
      answer: 1,
      why: {
        es: 'El modelo no cambia: sus pesos siguen congelados. RAG añade un paso previo que recupera fragmentos y los incluye en el prompt, de modo que el modelo responde con esas fuentes a la vista.',
        en: 'The model does not change: its weights stay frozen. RAG adds a prior step that retrieves chunks and includes them in the prompt, so the model answers with those sources in front of it.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Si los fragmentos son demasiado pequeños, ¿qué suele pasar?', en: 'If the chunks are too small, what usually happens?' },
      options: [
        { es: 'El índice ya no cabe en memoria.', en: 'The index no longer fits in memory.' },
        { es: 'El modelo olvida la pregunta.', en: 'The model forgets the question.' },
        { es: 'Un dato queda separado de su condición y la respuesta puede engañar.', en: 'A fact ends up separated from its condition and the answer can mislead.' },
        { es: 'La similitud coseno deja de poder calcularse.', en: 'Cosine similarity can no longer be computed.' },
      ],
      answer: 2,
      why: {
        es: 'Un corte pequeño puede dejar «18 meses de garantía» en un fragmento y «solo con el cargador original» en otro. Quien recupera el primero responde sin la condición. Con fragmentos enormes ocurre lo contrario: se diluye.',
        en: 'A small cut can leave “18-month warranty” in one chunk and “only with the original charger” in another. Whoever retrieves the first one answers without the condition. With huge chunks the opposite happens: dilution.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'En diez preguntas de prueba, el puesto del fragmento correcto fue: 1, 1, 2, 1, 4, 1, no apareció, 3, 1 y 6. ¿En cuántas queda entre los tres primeros (hit@3)?',
        en: 'On ten test questions, the position of the right chunk was: 1, 1, 2, 1, 4, 1, did not appear, 3, 1, and 6. In how many does it land in the top three (hit@3)?',
      },
      options: [
        { es: '7 de 10', en: '7 out of 10' },
        { es: '5 de 10', en: '5 out of 10' },
        { es: '9 de 10', en: '9 out of 10' },
        { es: '10 de 10', en: '10 out of 10' },
      ],
      answer: 0,
      why: {
        es: 'Cuentan los puestos 1, 2 o 3: 1, 1, 2, 1, 1, 3 y 1, es decir, siete. El 4, el 6 y el que no apareció quedan fuera. Con k = 1 serían cinco.',
        en: 'Positions 1, 2, or 3 count: 1, 1, 2, 1, 1, 3, and 1, that is, seven. The 4, the 6, and the one that did not appear are out. With k = 1 it would be five.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Una aseguradora quiere un asistente que responda con base en las condiciones de sus pólizas, que cambian cada trimestre, y que muestre de dónde salió cada dato. ¿Qué conviene probar primero?',
        en: 'An insurer wants an assistant that answers from the terms of its policies, which change every quarter, and that shows where each fact came from. What should it try first?',
      },
      options: [
        { es: 'Ajuste fino del modelo con las pólizas de cada trimestre.', en: 'Fine-tuning the model on each quarter’s policies.' },
        { es: 'Un modelo más grande, sin documentos.', en: 'A bigger model, with no documents.' },
        { es: 'Pegar todas las pólizas en cada prompt.', en: 'Pasting every policy into every prompt.' },
        { es: 'RAG sobre el repositorio de pólizas vigentes, con citas y fecha de versión.', en: 'RAG over the repository of current policies, with citations and version dates.' },
      ],
      answer: 3,
      why: {
        es: 'RAG permite actualizar el conocimiento cambiando documentos, citar la fuente de cada dato y limitar lo recuperable a la versión vigente. El ajuste fino cambia comportamiento y estilo, no es un buen modo de meter datos que cambian; pegar todo no cabe ni es barato.',
        en: 'RAG lets you update knowledge by changing documents, cite the source of every fact, and restrict what can be retrieved to the current version. Fine-tuning changes behavior and style; it is not a good way to load facts that keep changing; pasting everything neither fits nor is cheap.',
      },
    },
  ],

  glossary: [
    'rag', 'chunking', 'vector-database', 'retrieval', 'grounding', 'reranking',
    'embedding', 'cosine-similarity', 'vector-space', 'semantic-search',
    'context-window', 'system-prompt', 'lost-in-the-middle', 'stateless', 'token',
  ],

  terms: [
    {
      id: 'rag',
      term: { es: 'RAG (generación aumentada por recuperación)', en: 'RAG (retrieval-augmented generation)' },
      def: {
        es: 'Técnica que, antes de generar, busca fragmentos relevantes en una colección de documentos y los incluye en el prompt, de modo que el modelo responde con esas fuentes sin reentrenarse.',
        en: 'A technique that, before generating, looks up relevant chunks in a collection of documents and includes them in the prompt, so the model answers from those sources without being retrained.',
      },
    },
    {
      id: 'chunking',
      term: { es: 'Fragmentación (chunking)', en: 'Chunking' },
      def: {
        es: 'Dividir los documentos en trozos, o fragmentos, que se indexan y se recuperan por separado. Si son muy pequeños pierden contexto; si son muy grandes, lo diluyen.',
        en: 'Splitting documents into pieces, or chunks, that are indexed and retrieved separately. If they are too small they lose context; if too large, they dilute it.',
      },
    },
    {
      id: 'vector-database',
      term: { es: 'Base de datos vectorial', en: 'Vector database' },
      def: {
        es: 'Almacén que guarda vectores junto con su texto y sus metadatos, y encuentra rápido los más cercanos a un vector de consulta, normalmente con búsqueda aproximada de vecinos.',
        en: 'A store that keeps vectors together with their text and metadata, and quickly finds the ones closest to a query vector, usually with approximate nearest-neighbor search.',
      },
    },
    {
      id: 'retrieval',
      term: { es: 'Recuperación (retrieval)', en: 'Retrieval' },
      def: {
        es: 'Paso que convierte la pregunta en un vector, lo compara con el índice y devuelve los k fragmentos más parecidos.',
        en: 'The step that turns the question into a vector, compares it with the index, and returns the k most similar chunks.',
      },
    },
    {
      id: 'grounding',
      term: { es: 'Anclaje (grounding)', en: 'Grounding' },
      def: {
        es: 'Hacer que cada afirmación de la respuesta se apoye en una fuente concreta y comprobable, citada junto a ella.',
        en: 'Making every claim in the answer rest on a specific, checkable source, cited next to it.',
      },
    },
    {
      id: 'reranking',
      term: { es: 'Reordenamiento (reranking)', en: 'Reranking' },
      def: {
        es: 'Segundo paso que reordena los candidatos de la búsqueda con un modelo más fino y más lento, que lee la pregunta y cada fragmento juntos.',
        en: 'A second step that reorders the search candidates with a finer, slower model that reads the question and each chunk together.',
      },
    },
  ],

  sources: [
    { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', authors: 'Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., Kiela, D.', year: 2020, url: 'https://arxiv.org/abs/2005.11401' },
    { title: 'Dense Passage Retrieval for Open-Domain Question Answering', authors: 'Karpukhin, V., Oğuz, B., Min, S., Lewis, P., Wu, L., Edunov, S., Chen, D., Yih, W.', year: 2020, url: 'https://arxiv.org/abs/2004.04906' },
    { title: 'A statistical interpretation of term specificity and its application in retrieval', authors: 'Spärck Jones, K.', year: 1972, url: 'https://doi.org/10.1108/eb026526' },
    { title: 'The Probabilistic Relevance Framework: BM25 and Beyond', authors: 'Robertson, S., Zaragoza, H.', year: 2009, url: 'https://doi.org/10.1561/1500000019' },
    { title: 'Passage Re-ranking with BERT', authors: 'Nogueira, R., Cho, K.', year: 2019, url: 'https://arxiv.org/abs/1901.04085' },
    { title: 'Not what you’ve signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection', authors: 'Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., Fritz, M.', year: 2023, url: 'https://arxiv.org/abs/2302.12173' },
    { title: 'Ragas: Automated Evaluation of Retrieval Augmented Generation', authors: 'Es, S., James, J., Espinosa-Anke, L., Schockaert, S.', year: 2023, url: 'https://arxiv.org/abs/2309.15217' },
  ],
});
