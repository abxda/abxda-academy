import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «H100», «KV» o
// «prefill», y la voz dice «ache cien», «ka uve» o «prifil». (Las cifras ya van con letras en la narración.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/H100/g, 'ache cien'], [/\bKV\b/g, 'ka uve'], [/Llama 3/g, 'Lama tres'], [/\bprefill\b/g, 'prifil'], [/\bdecode\b/g, 'dicoud'],
    [/\bthroughput\b/g, 'zrúput'], [/\bEnter\b/g, 'énter'], [/Anthropic/g, 'Anzrópic'], [/Google/g, 'Gúgol'], [/Mistral AI/g, 'Mistral ei ai'],
  ],
  en: [[/H100/g, 'H one hundred'], [/\bKV\b/g, 'K V'], [/Llama 3/g, 'Llama three'], [/Mistral AI/g, 'Mistral A I']],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'inferencia',

  objectives: {
    es: [
      'Explicar las dos fases de una respuesta: el llenado, que lee tu mensaje de una vez, y la decodificación, que escribe un token por vuelta.',
      'Describir qué guarda la caché KV, qué trabajo ahorra y por qué ocupa más memoria cuanto más larga es la conversación.',
      'Estimar el costo de una tarea con sus tokens de entrada y de salida, y reconocer qué la encarece o la hace esperar: contexto largo, salida larga, lote pequeño.',
    ],
    en: [
      'Explain the two phases of an answer: prefill, which reads your message all at once, and decode, which writes one token per turn.',
      'Describe what the KV cache keeps, what work it saves, and why it takes more memory the longer the conversation is.',
      'Estimate the cost of a task from its input and output tokens, and recognize what makes it costlier or slower: long context, long output, small batch.',
    ],
  },

  segments: ([
    // ── 1 · qué pasa al pulsar Enter ──
    {
      id: 'hook',
      es: 'Escribes una pregunta y pulsas Enter. Un instante después aparece la primera palabra, y luego las demás, una tras otra. ¿Qué hace el modelo en ese rato? ¿Y cuánto cuesta?',
      en: 'You type a question and press Enter. A moment later the first word appears, then the rest, one after another. What is the model doing all that time? And what does it cost?',
    },
    {
      id: 'inference',
      es: 'Desde la lección uno sabes que usar un modelo ya entrenado, con sus parámetros fijos, se llama inferencia. Hoy la miramos por dentro, en un modelo de lenguaje.',
      en: 'Since lesson one you know that using an already trained model, with its parameters fixed, is called inference. Today we look inside it, in a language model.',
    },
    {
      id: 'serving',
      es: 'Entrenar se hace una vez. La inferencia se repite con cada pregunta, de millones de personas. Tener el modelo atendiéndolas a todas se llama servir el modelo.',
      en: 'Training happens once. Inference repeats with every question, from millions of people. Keeping the model answering all of them is called serving the model.',
      note: { es: 'Servir un modelo: tenerlo funcionando, con pesos fijos, para muchas personas a la vez.', en: 'Serving a model: keeping it running, with fixed weights, for many people at once.' },
      pad: 0.3,
    },
    // ── 2 · las dos fases ──
    {
      id: 'example',
      es: 'Sigamos un mensaje: «Resume este contrato en tres puntos». Son seis tokens; para simplificar, aquí cada palabra es un token, como en la lección veintidós.',
      en: 'Let’s follow one message: “Summarize this contract in three points.” That is six tokens; to keep it simple, each word here is one token, as in lesson twenty-two.',
      pad: 0.3,
    },
    {
      id: 'autoreg',
      es: 'Y recuerda la lección diecinueve: la respuesta se escribe un token a la vez. Cada token nuevo se agrega al final, y con todo ese texto se predice el siguiente.',
      en: 'And remember lesson nineteen: the answer is written one token at a time. Each new token is added to the end, and the whole text is used to predict the next one.',
      pad: 0.3,
    },
    {
      id: 'prefill',
      es: 'Primera fase: el llenado, en inglés prefill. Los seis tokens de tu mensaje ya están ahí, así que entran juntos al modelo, en una sola pasada por todos sus bloques.',
      en: 'First phase: prefill. The six tokens of your message are already there, so they go into the model together, in a single pass through all of its blocks.',
      pad: 0.5,
    },
    {
      id: 'first-token',
      es: 'Al terminar esa pasada sale el primer token de la respuesta. La espera hasta verlo crece con el largo de tu mensaje: hay más tokens que leer.',
      en: 'When that pass ends, the first token of the answer comes out. The wait to see it grows with the length of your message: there are more tokens to read.',
      note: { es: 'Llenado (prefill): tu mensaje entra de una vez; de él depende la espera hasta el primer token.', en: 'Prefill: your message goes in all at once; the wait until the first token depends on it.' },
      pad: 0.3,
    },
    {
      id: 'decode',
      es: 'Segunda fase: la decodificación, en inglés decode. El modelo escribe un token por vuelta, y cada vuelta es otra pasada completa por el modelo.',
      en: 'Second phase: decoding, or decode. The model writes one token per turn, and each turn is another full pass through the model.',
      pad: 0.5,
    },
    {
      id: 'one-by-one',
      es: 'Aquí no se puede adelantar trabajo: para escribir el quinto token hace falta el cuarto, que aún no existe. Esta fase va en fila, de uno en uno.',
      en: 'Here no work can be done ahead of time: to write the fifth token, the model needs the fourth, which does not exist yet. This phase goes in single file, one by one.',
      note: { es: 'Decodificación (decode): un token por vuelta; cada uno necesita el anterior.', en: 'Decode: one token per turn; each one needs the one before.' },
      pad: 0.5,
    },
    {
      id: 'phases-time',
      es: 'Con cifras estimadas: un modelo de ocho mil millones de parámetros en una GPU H100 lee dos mil tokens de entrada en unos ochenta milisegundos, y escribe trescientos en casi un segundo y medio.',
      en: 'With estimated figures: an eight-billion-parameter model on an H100 GPU reads two thousand input tokens in about eighty milliseconds, and writes three hundred in almost a second and a half.',
      pad: 0.5,
    },
    // ── 3 · la caché KV ──
    {
      id: 'attn-recall',
      es: 'Ahora, un desperdicio escondido. Recuerda la atención, de la lección veintiuno: el token nuevo compara su consulta con las claves de todos los anteriores y mezcla sus valores.',
      en: 'Now, some hidden waste. Remember attention, from lesson twenty-one: the new token compares its query with the keys of all the earlier tokens and mixes their values.',
      pad: 0.4,
    },
    {
      id: 'recompute',
      es: 'Mira esta tabla: cada fila es una vuelta; cada casilla, un token cuya clave y valor se calculan. Si no se guarda nada, cada vuelta recalcula todos los anteriores.',
      en: 'Look at this table: each row is a turn; each cell, a token whose key and value get computed. If nothing is kept, every turn recomputes all the earlier ones.',
      pad: 0.6,
    },
    {
      id: 'unchanged',
      es: 'Y es trabajo repetido: por la máscara causal de la lección veintidós, un token solo mira hacia atrás, así que su clave y su valor nunca cambian.',
      en: 'And it is repeated work: because of the causal mask from lesson twenty-two, a token only looks back, so its key and its value never change.',
      pad: 0.4,
    },
    {
      id: 'kvcache',
      es: 'La solución es guardarlos: la caché de claves y valores, o caché KV. En cada vuelta solo se calcula el par del token nuevo, y se agrega a la caché.',
      en: 'The fix is to keep them: the key-value cache, or KV cache. Each turn computes only the new token’s pair and adds it to the cache.',
      note: { es: 'Caché KV: guarda las claves y los valores ya calculados para no repetir trabajo.', en: 'KV cache: keeps the keys and values already computed so work is not repeated.' },
      pad: 0.6,
    },
    {
      id: 'count',
      es: 'En este ejemplo, con seis tokens de entrada y diez de salida, son ciento cinco casillas sin caché y quince con ella. Un transformer de juguete confirma que la respuesta es idéntica.',
      en: 'In this example, with six input tokens and ten output tokens, that is one hundred five cells without a cache and fifteen with it. A toy transformer confirms the answer is identical.',
      pad: 0.4,
    },
    {
      id: 'kv-price',
      es: 'Pero guardar ocupa memoria. Por cada token se guardan una clave y un valor en cada bloque del modelo, y ahí se quedan mientras dure la conversación.',
      en: 'But keeping them takes memory. For every token, one key and one value are stored in every block of the model, and they stay there as long as the conversation lasts.',
      pad: 0.5,
    },
    {
      id: 'kv-llama',
      es: 'En Llama 3, de ocho mil millones de parámetros y treinta y dos bloques, eso suma unos ciento treinta y un mil bytes por token: algo más de una décima de megabyte.',
      en: 'In Llama 3, with eight billion parameters and thirty-two blocks, that adds up to about one hundred thirty-one thousand bytes per token: a bit over a tenth of a megabyte.',
      pad: 0.5,
    },
    {
      id: 'kv-demo',
      es: 'Ahora mira la memoria de una H100, ochenta gigabytes. Los pesos del modelo ocupan dieciséis, siempre. La caché crece con cada token de la conversación.',
      en: 'Now look at the memory of an H100, eighty gigabytes. The model’s weights always take sixteen. The cache grows with every token of the conversation.',
      pad: 0.6,
    },
    {
      id: 'kv-big',
      es: 'Con ciento veintiocho mil tokens, lo más largo que acepta este modelo, una sola conversación guarda casi diecisiete gigabytes de caché: más que el modelo entero.',
      en: 'At one hundred twenty-eight thousand tokens, the longest this model accepts, a single conversation keeps almost seventeen gigabytes of cache: more than the whole model.',
      pad: 0.4,
    },
    {
      id: 'try-kv',
      es: 'Si quieres, mueve tú el largo de la conversación y mira cómo crece o se encoge la caché.',
      en: 'If you like, move the length of the conversation yourself and watch the cache grow or shrink.',
      gate: { id: 'kv', prompt: { es: 'mueve el largo de la conversación y mira la caché.', en: 'move the conversation length and watch the cache.' } },
      pad: 0.4,
    },
    {
      id: 'kv-many',
      es: 'Y cada persona trae su propia caché; los pesos, en cambio, se guardan una sola vez para todas. Con conversaciones de ocho mil tokens, en esta GPU caben unas sesenta.',
      en: 'And each person brings their own cache; the weights, by contrast, are stored once for everyone. With eight-thousand-token conversations, about sixty fit on this GPU.',
      pad: 0.6,
    },
    {
      id: 'kv-long',
      es: 'Con conversaciones de ciento veintiocho mil tokens, solo caben tres. Por eso un contexto largo, todo el texto que el modelo tiene a la vista, sale caro.',
      en: 'With conversations of one hundred twenty-eight thousand tokens, only three fit. That is why a long context, all the text the model has in view, is expensive.',
      pad: 0.6,
    },
    // ── 4 · la memoria marca el paso ──
    {
      id: 'read-all',
      es: 'Ahora sí: ¿por qué escribir es lo lento? En cada vuelta, la GPU lee de su memoria todos los pesos del modelo, dieciséis gigabytes, para producir un solo token.',
      en: 'Now then: why is writing the slow part? On every turn, the GPU reads all of the model’s weights from its memory, sixteen gigabytes, to produce a single token.',
      pad: 0.6,
    },
    {
      id: 'bw-recall',
      es: 'En la lección anterior viste el ancho de banda: cuántos bytes por segundo puede leer la GPU de su memoria. La H100 lee tres punto tres cinco terabytes por segundo.',
      en: 'In the last lesson you saw bandwidth: how many bytes per second the GPU can read from its memory. The H100 reads three point three five terabytes per second.',
      pad: 0.3,
    },
    {
      id: 'bw-math',
      es: 'Leer dieciséis gigabytes a ese ritmo toma unos cinco milisegundos por vuelta. Así que, con una sola persona, salen como mucho unos doscientos tokens por segundo.',
      en: 'Reading sixteen gigabytes at that rate takes about five milliseconds per turn. So, with a single person, it produces at most about two hundred tokens per second.',
      note: { es: 'Decodificación: la limita el ancho de banda. Tokens por segundo ≤ ancho de banda ÷ bytes leídos por vuelta.', en: 'Decode is limited by bandwidth. Tokens per second ≤ bandwidth ÷ bytes read per turn.' },
      pad: 0.5,
    },
    {
      id: 'bw-idle',
      es: 'El cálculo casi no influye: por cada peso leído hace solo dos operaciones, y podría hacer cientos. Usa menos del uno por ciento de su cálculo; el resto del tiempo espera datos.',
      en: 'Arithmetic barely matters: for each weight it reads, it does just two operations, and it could do hundreds. It uses under one percent of its compute; the rest of the time it waits for data.',
      pad: 0.5,
    },
    // ── 5 · lotes: latencia y rendimiento ──
    {
      id: 'batch-idea',
      es: 'Como al cálculo le sobra tiempo, hay un truco: atender a varias personas en la misma vuelta. Los pesos se leen una vez y dan un token a cada una. Es un lote, como en la lección nueve.',
      en: 'Since arithmetic has time to spare, there is a trick: serve several people in the same turn. The weights are read once and yield one token for each person. It is a batch, as in lesson nine.',
      pad: 0.6,
    },
    {
      id: 'latency',
      es: 'Para comparar hay dos cifras. La primera mira a cada persona: cuántos tokens por segundo le llegan. Si le llegan pocos, espera más: eso es la latencia.',
      en: 'To compare, there are two figures. The first looks at each person: how many tokens per second reach them. If few arrive, they wait longer: that is latency.',
      pad: 0.3,
    },
    {
      id: 'throughput',
      es: 'La segunda mira a la GPU: cuántos tokens por segundo entrega sumando a todas las personas. Se llama rendimiento, en inglés throughput.',
      en: 'The second looks at the GPU: how many tokens per second it delivers, adding up everyone. It is called throughput.',
      note: { es: 'Latencia: lo que espera cada persona. Rendimiento (throughput): tokens por segundo de todo el sistema.', en: 'Latency: how long each person waits. Throughput: tokens per second for the whole system.' },
      pad: 0.3,
    },
    {
      id: 'batch-demo',
      es: 'Mira las dos cifras mientras el lote crece de una a sesenta personas, con conversaciones de ocho mil tokens: el rendimiento se multiplica, y a cada persona le llegan menos tokens por segundo.',
      en: 'Watch both figures as the batch grows from one to sixty people, with eight-thousand-token conversations: throughput multiplies, and each person gets fewer tokens per second.',
      pad: 0.6,
    },
    {
      id: 'cost-m',
      es: 'Y el costo. Si la hora de GPU cuesta dos dólares, un supuesto, un millón de tokens sale en unos dos dólares con ochenta centavos con una persona, y en unos veintidós centavos con sesenta.',
      en: 'And the cost. If a GPU hour costs two dollars, an assumption, a million tokens comes to about two dollars and eighty cents with one person, and about twenty-two cents with sixty.',
      pad: 0.5,
    },
    {
      id: 'try-batch',
      es: 'Si quieres, mueve tú el número de personas en el lote y mira cómo cambian las tres cifras.',
      en: 'If you like, move the number of people in the batch yourself and watch the three figures change.',
      gate: { id: 'batch', prompt: { es: 'cambia el número de personas en el lote.', en: 'change the number of people in the batch.' } },
      pad: 0.4,
    },
    {
      id: 'tradeoff',
      es: '¿Por qué cada persona va más lenta? En cada vuelta también se lee la caché de cada una. Lote grande: token barato, pero más espera. Y el contexto largo empeora las dos cosas.',
      en: 'Why does each person slow down? On every turn, each person’s cache is read too. Big batch: cheap tokens, but more waiting. And a long context makes both worse.',
      pad: 0.5,
    },
    // ── 6 · lo que pagas tú ──
    {
      id: 'api-price',
      es: 'Si usas el modelo de un proveedor, te cobra por millón de tokens, y cobra aparte la entrada y la salida. En las listas de Anthropic y de Google, la salida cuesta cinco veces más, o aún más.',
      en: 'If you use a provider’s model, it charges per million tokens, and it bills input and output separately. On Anthropic’s and Google’s price lists, output costs five times as much, or even more.',
      pad: 0.4,
    },
    {
      id: 'why-output',
      es: 'Ya sabes por qué: los tokens de tu mensaje entran juntos, en una pasada. Los de la respuesta salen de uno en uno, y cada uno exige leer de nuevo toda la memoria.',
      en: 'You already know why: the tokens of your message go in together, in one pass. The answer’s tokens come out one by one, and each one requires reading all the memory again.',
      pad: 0.5,
    },
    {
      id: 'cost-formula',
      es: 'Así, el costo de una tarea es: tokens de entrada por su precio, más tokens de salida por el suyo. Usaremos precios de ejemplo: tres dólares por millón de entrada y quince de salida.',
      en: 'So the cost of a task is: input tokens times their price, plus output tokens times theirs. We will use example prices: three dollars per million for input and fifteen for output.',
      note: { es: 'Costo de una tarea = tokens de entrada × su precio + tokens de salida × su precio.', en: 'Cost of a task = input tokens × their price + output tokens × their price.' },
      pad: 0.4,
    },
    {
      id: 'task-contract',
      es: 'Primera tarea: resumir un contrato de cuarenta mil tokens en cuatrocientos. Aunque la salida es más cara, el noventa y cinco por ciento del costo se va en la entrada.',
      en: 'First task: summarize a forty-thousand-token contract in four hundred tokens. Even though output is pricier, ninety-five percent of the cost goes to the input.',
      pad: 0.5,
    },
    {
      id: 'task-report',
      es: 'Segunda tarea: redactar un informe de cuatro mil tokens a partir de quinientos de instrucciones. Ahora el noventa y ocho por ciento del costo es la salida.',
      en: 'Second task: draft a four-thousand-token report from five hundred tokens of instructions. Now ninety-eight percent of the cost is output.',
      pad: 0.5,
    },
    {
      id: 'task-wait',
      es: 'La espera también cambia; la estimamos con el modelo de antes. En el contrato, el primer token tarda casi tres segundos. En el informe sale al instante, pero terminar toma unos veinte.',
      en: 'The wait changes too; we estimate it with the model from before. For the contract, the first token takes almost three seconds. For the report it comes out at once, but finishing takes about twenty.',
      pad: 0.6,
    },
    {
      id: 'try-task',
      es: 'Si quieres, elige tú otra tarea, como una pregunta corta, y mira de dónde salen su costo y su espera.',
      en: 'If you like, pick another task yourself, such as a short question, and see where its cost and its wait come from.',
      gate: { id: 'task', prompt: { es: 'elige otra tarea.', en: 'pick another task.' } },
      pad: 0.4,
    },
    // ── 7 · mezcla de expertos y un truco más ──
    {
      id: 'moe-idea',
      es: 'Una forma de tener un modelo enorme sin pagar todo su cálculo: la mezcla de expertos. En cada bloque hay varias redes, llamadas expertos, y un enrutador elige unas pocas para cada token.',
      en: 'One way to have an enormous model without paying for all its arithmetic: mixture of experts. Each block has several networks, called experts, and a router picks a few for each token.',
      pad: 0.6,
    },
    {
      id: 'moe-total',
      es: 'Por ejemplo, Mixtral, de la empresa Mistral AI, tiene ocho expertos por bloque y usa dos por token. En total guarda unos cuarenta y siete mil millones de parámetros.',
      en: 'For example, Mixtral, from the company Mistral AI, has eight experts per block and uses two per token. In total it stores about forty-seven billion parameters.',
      pad: 0.4,
    },
    {
      id: 'moe-active',
      es: 'Pero cada token pasa solo por unos trece mil millones: sus parámetros activos. Por cada token, calcula como un modelo de trece mil millones.',
      en: 'But each token passes through only about thirteen billion: its active parameters. For each token, it computes like a thirteen-billion-parameter model.',
      note: { es: 'Mezcla de expertos: muchos parámetros en total, pocos activos por token.', en: 'Mixture of experts: many parameters in total, few active per token.' },
      pad: 0.4,
    },
    {
      id: 'moe-memory',
      es: 'La trampa: los cuarenta y siete mil millones tienen que estar en memoria, y en un lote cada token elige expertos distintos, así que casi todos se leen. Ahorra cálculo, no memoria.',
      en: 'The catch: all forty-seven billion have to sit in memory, and in a batch each token picks different experts, so almost all of them get read. It saves arithmetic, not memory.',
      pad: 0.6,
    },
    {
      id: 'spec',
      es: 'Un último truco, solo como mención: la decodificación especulativa. Un modelo pequeño adivina varios tokens y el grande los revisa en una sola vuelta. En su artículo, fue de dos a tres veces más rápido.',
      en: 'One last trick, just a mention: speculative decoding. A small model guesses several tokens and the big one checks them all in one turn. In its paper, it ran two to three times faster.',
      pad: 0.6,
    },
    // ── 8 · cierre ──
    {
      id: 'recap',
      es: 'En resumen: el llenado lee tu mensaje de una vez; la decodificación escribe un token por vuelta; la caché KV ahorra trabajo a cambio de memoria; y leer la memoria marca la velocidad y el costo.',
      en: 'In short: prefill reads your message all at once; decode writes one token per turn; the KV cache saves work in exchange for memory; and reading memory sets both speed and cost.',
      pad: 0.4,
    },
    {
      id: 'lens',
      es: 'Para quien decide: el costo de una tarea es la entrada por su precio más la salida por el suyo. Pide ese desglose, y mide la espera con textos del largo de los tuyos.',
      en: 'For decision-makers: the cost of a task is input times its price plus output times its own. Ask for that breakdown, and measure the wait with texts as long as yours.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Aquí termina la parte dos: ya sabes cómo se entrena un modelo y cómo responde. Pero un modelo base solo continúa texto; aún no es un asistente. ¿Cómo se adapta? Con el ajuste fino.',
      en: 'This is the end of part two: you know how a model is trained and how it answers. But a base model only continues text; it is not an assistant yet. How is it adapted? With fine-tuning.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Una respuesta tiene dos fases. El llenado (prefill) procesa todo tu mensaje de una vez y fija la espera hasta el primer token; la decodificación (decode) escribe un token por vuelta y fija cuánto tarda el resto.',
      'La caché KV guarda las claves y los valores de los tokens anteriores, que nunca cambian, para no recalcularlos: en el ejemplo, 15 casillas en lugar de 105. A cambio ocupa memoria que crece con cada token y con cada conversación.',
      'En cada vuelta la GPU lee todos los pesos (y las cachés) de su memoria y hace muy poca aritmética: el ancho de banda marca el paso. Tokens por segundo ≤ ancho de banda ÷ bytes leídos por vuelta.',
      'Atender a varias personas en un lote reparte esa lectura: sube el rendimiento (throughput) y baja el costo por token, pero cada persona recibe menos tokens por segundo (más latencia).',
      'Costo de una tarea = entrada × su precio + salida × su precio, y la salida cuesta varias veces más. La mezcla de expertos ahorra cálculo por token, no memoria.',
    ],
    en: [
      'An answer has two phases. Prefill processes your whole message at once and sets the wait until the first token; decode writes one token per turn and sets how long the rest takes.',
      'The KV cache keeps the keys and values of earlier tokens, which never change, so they are not recomputed: in the example, 15 cells instead of 105. In exchange it takes memory that grows with every token and every conversation.',
      'On every turn the GPU reads all the weights (and the caches) from its memory and does very little arithmetic: bandwidth sets the pace. Tokens per second ≤ bandwidth ÷ bytes read per turn.',
      'Serving several people in a batch shares that read: throughput rises and the cost per token falls, but each person gets fewer tokens per second (more latency).',
      'Cost of a task = input × its price + output × its price, and output costs several times more. Mixture of experts saves arithmetic per token, not memory.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Responder es «calcular»: con una GPU que haga el doble de operaciones por segundo, el modelo escribiría el doble de rápido.',
      en: 'Answering is “computing”: with a GPU that does twice as many operations per second, the model would write twice as fast.',
    },
    right: {
      es: 'Al escribir, la GPU espera datos, no cuentas: con una persona usa menos del uno por ciento de su cálculo. Manda el ancho de banda de memoria, junto con los bytes que hay que leer por vuelta (pesos y cachés), el largo del contexto y el tamaño del lote.',
      en: 'When writing, the GPU waits for data, not for arithmetic: with one person it uses under one percent of its compute. Memory bandwidth rules, together with the bytes to read per turn (weights and caches), the context length, and the batch size.',
    },
  },

  deeper: {
    es: `## Dos fases, dos cuellos de botella

Un modelo denso con $N$ parámetros hace unas $2N$ operaciones por cada token que procesa (una multiplicación y una suma por parámetro; Kaplan et al., 2020; Pope et al., 2022), más un término de atención que crece con el contexto.

**Llenado** (los $L$ tokens del mensaje a la vez; $n_\\ell$ bloques, $d_{\\text{at}}$ = cabezas × dimensión por cabeza):

$$\\text{FLOPs}_{\\text{llenado}}\\approx 2NL+2\\,n_\\ell\\,d_{\\text{at}}\\,L^2$$

Son multiplicaciones de matrices grandes: la GPU trabaja cerca de su pico. La lección supone el 40 % del pico (Llama 3 reporta entre 38 y 43 % al entrenar; Pope et al. llegan a 76 % en el llenado con lotes grandes). Con el modelo de 8 mil M y 2 000 tokens: $3.3\\cdot10^{13}$ FLOPs ÷ $(0.4\\cdot 989\\cdot10^{12})$ ≈ 84 ms.

**Decodificación** ($B$ conversaciones de $L$ tokens de contexto cada una). Cada vuelta tiene un *tiempo de memoria* y un *tiempo de cálculo* (Pope et al., §2), y manda el mayor:

$$t_{\\text{vuelta}}=\\max\\!\\left(\\frac{W+B\\,L\\,c_{kv}}{\\mathrm{BW}},\\ \\frac{B\\,(2N+4\\,n_\\ell\\,d_{\\text{at}}\\,L)}{P}\\right)$$

con $W$ los bytes de los pesos, $c_{kv}$ los bytes de caché por token, BW el ancho de banda y $P$ el cálculo útil (la lección usa la mitad del pico). Con $B=1$ hay $2N$ operaciones por cada $W=bN$ bytes, es decir $2/b$ operaciones por byte: una, en FP16. La H100 puede hacer $989\\cdot10^{12}/3.35\\cdot10^{12}\\approx 295$ por byte, así que la decodificación de una persona usa cerca del 0.3 % del cálculo. Pope et al. lo dicen así: con lotes y secuencias cortas domina el tiempo de cargar los pesos; con lotes grandes y secuencias largas, el de cargar la caché.

## La caché KV por dentro

$$c_{kv}=2\\,n_\\ell\\,n_{kv}\\,d_h\\,b$$

El 2 es clave y valor; $n_{kv}$ las cabezas de clave-valor; $d_h$ la dimensión por cabeza y $b$ los bytes por número. Llama 3 8B (Llama Team, 2024, tabla 3): $2\\cdot32\\cdot8\\cdot128\\cdot2=131\\,072$ bytes por token (en la escena, $8\\cdot128=1\\,024$ números por clave y por bloque). Con atención multicabeza completa (32 cabezas KV) serían $524\\,288$: Llama 3 usa atención de consultas agrupadas (GQA, Ainslie et al., 2023), que comparte cada par entre cuatro cabezas de consulta, «para reducir el tamaño de las cachés de clave-valor durante la decodificación». La misma cuenta da el valor de Kwon et al. (2023) para OPT-13B: $2\\cdot5\\,120\\cdot40\\cdot2=819\\,200$ bytes, unos 800 KB por token.

Sin caché, generar $G$ tokens tras $P$ de entrada procesa $GP+G(G-1)/2$ posiciones; con caché, $P+G-1$. Con $P=6$ y $G=10$: $105$ frente a $15$. El transformer de juguete de la escena (2 bloques, 2 cabezas, $d=16$, pesos al azar con semilla fija; \`tiny.ts\`) recorre los dos caminos: cuenta 105 y 15 pasadas, 498 240 y 72 960 multiplicaciones-sumas, y sus *logits* coinciden con una diferencia máxima de 0.

## Techo de velocidad, lotes y costo

$$\\text{tokens/s por persona}\\le\\frac{\\mathrm{BW}}{W+B\\,L\\,c_{kv}},\\qquad \\text{rendimiento}=\\frac{B}{t_{\\text{vuelta}}},\\qquad \\text{costo por millón}=\\frac{\\text{precio por hora}}{3\\,600\\cdot\\text{rendimiento}}\\cdot10^{6}$$

Con el 8B en FP16 en una H100, 8 000 tokens de contexto y 2 USD por hora de GPU (supuesto): $B=1$ da 196 tokens/s y 2.84 USD por millón; $B=60$, el máximo que cabe, da 42 tokens/s por persona, 2 545 en total y 0.22 USD por millón: unas trece veces más barato en la misma máquina. Con 128 000 tokens de contexto solo caben 3 conversaciones.

## Lo que paga quien usa una API

En las listas consultadas el 12 de octubre de 2026, la salida cuesta cinco veces la entrada en todos los modelos de Anthropic, y de cinco a más de ocho veces en los de Google. Los precios de la escena (US$ 3 y 15 por millón) son un ejemplo con esa proporción. Si el inicio de tu mensaje se repite (instrucciones, un documento base), la caché de *prompt* lo cobra mucho más barato: en la lista de Anthropic, leer de ella cuesta 0.1 veces el precio de entrada (0.05 o 0.025 en algunos modelos) y escribir en ella, con vigencia de cinco minutos, 1.25 veces.

Las esperas de la escena son estimaciones con el modelo de 8 mil M en una H100 y una sola persona: llenado al 40 % del pico, y cada vuelta de escritura con el tiempo de memoria de arriba.

## Mezcla de expertos

Cada bloque reemplaza su red por $E$ expertos y un enrutador que elige $k$ por token:

$$N_{\\text{total}}=N_{\\text{comunes}}+E\\,n_\\ell\\,(3dh),\\qquad N_{\\text{activos}}=N_{\\text{comunes}}+k\\,n_\\ell\\,(3dh)$$

Mixtral 8x7B (Jiang et al., 2024, tabla 1): $d=4\\,096$, $h=14\\,336$, $n_\\ell=32$, $E=8$, $k=2$. Salen 46.7 mil millones en total y 12.9 activos. El artículo lo dice así: el cálculo es proporcional a los parámetros activos, pero «el costo de memoria para servir Mixtral es proporcional a su cantidad de parámetros dispersos, 47B». Si cada token eligiera sus dos expertos al azar (supuesto: en la práctica el reparto es desigual), un lote de $B$ tokens tocaría en cada bloque una fracción $1-(1-k/E)^B$ de los expertos: 25 % con $B=1$, 90 % con $B=8$, 99 % con $B=16$.

## En código

Caché, techo de velocidad y costo con la arquitectura de Llama 3 8B:

\`\`\`python
capas, cabezas_kv, dim_cabeza, bytes_num = 32, 8, 128, 2
kv_por_token = 2 * capas * cabezas_kv * dim_cabeza * bytes_num      # 2 = clave y valor
print(kv_por_token)                                                  # bytes por token

pesos = 8.03e9 * 2                                                   # FP16: 2 bytes por parámetro
print(round(kv_por_token * 128_000 / 1e9, 2))                        # GB de una conversación de 128 000 tokens

ancho_banda = 3.35e12                                                # H100 SXM: 3.35 TB/s
print(round(ancho_banda / pesos, 1))                                 # techo de tokens/s con una persona

def servir(personas, contexto, usd_por_hora=2.0):
    bytes_por_vuelta = pesos + personas * contexto * kv_por_token    # pesos + una caché por persona
    t = bytes_por_vuelta / ancho_banda                               # segundos por vuelta
    rendimiento = personas / t                                       # tokens/s de todo el sistema
    return round(1 / t, 1), round(rendimiento), round(usd_por_hora / (3600 * rendimiento) * 1e6, 3)

print(servir(1, 8000))     # (tokens/s por persona, tokens/s totales, US$ por millón)
print(servir(60, 8000))
# 131072
# 16.78
# 208.6
# (195.8, 196, 2.837)
# (42.4, 2545, 0.218)
\`\`\`

La caché no cambia el resultado: atención de una cabeza con y sin caché.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
d = 8
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
x = rng.normal(size=(6, d))                          # 6 tokens (ya convertidos en vectores)

def atencion_sin_cache(x):                           # recalcula K y V de todos los tokens
    q, k, v = x @ Wq, x @ Wk, x @ Wv
    s = q @ k.T / np.sqrt(d)
    s = np.where(np.tril(np.ones_like(s)) == 1, s, -np.inf)       # máscara causal
    w = np.exp(s - s.max(1, keepdims=True)); w /= w.sum(1, keepdims=True)
    return w @ v

K, V, salida = [], [], []                            # con caché: un token por vuelta
for t in range(len(x)):
    q = x[t] @ Wq
    K.append(x[t] @ Wk); V.append(x[t] @ Wv)         # solo el par nuevo entra a la caché
    s = np.array(K) @ q / np.sqrt(d)
    w = np.exp(s - s.max()); w /= w.sum()
    salida.append(w @ np.array(V))

print(np.allclose(atencion_sin_cache(x), np.array(salida)))
# True
\`\`\`

## Lo que viene

Los sistemas reales añaden más piezas: PagedAttention reparte la caché en bloques para no desperdiciar memoria (vLLM: de 2 a 4 veces más rendimiento con la misma latencia que sistemas anteriores, Kwon et al., 2023); el *batching* continuo mete y saca conversaciones del lote en cada vuelta (Orca, Yu et al., 2022); y la decodificación especulativa dio de 2 a 3 veces más velocidad en T5-XXL «con salidas idénticas» (Leviathan et al., 2023) y de 2 a 2.5 veces en Chinchilla 70B (Chen et al., 2023). Todo esto sirve a un modelo base; convertirlo en asistente empieza con el ajuste fino, en la lección 27.`,
    en: `## Two phases, two bottlenecks

A dense model with $N$ parameters does about $2N$ operations for every token it processes (one multiplication and one addition per parameter; Kaplan et al., 2020; Pope et al., 2022), plus an attention term that grows with context.

**Prefill** (the message’s $L$ tokens at once; $n_\\ell$ blocks, $d_{\\text{at}}$ = heads × head dimension):

$$\\text{FLOPs}_{\\text{prefill}}\\approx 2NL+2\\,n_\\ell\\,d_{\\text{at}}\\,L^2$$

These are large matrix multiplications: the GPU works close to its peak. The lesson assumes 40% of peak (Llama 3 reports 38 to 43% in training; Pope et al. reach 76% in prefill with large batches). With the 8B model and 2,000 tokens: $3.3\\cdot10^{13}$ FLOPs ÷ $(0.4\\cdot 989\\cdot10^{12})$ ≈ 84 ms.

**Decode** ($B$ conversations of $L$ context tokens each). Every turn has a *memory time* and a *compute time* (Pope et al., §2), and the larger one rules:

$$t_{\\text{turn}}=\\max\\!\\left(\\frac{W+B\\,L\\,c_{kv}}{\\mathrm{BW}},\\ \\frac{B\\,(2N+4\\,n_\\ell\\,d_{\\text{at}}\\,L)}{P}\\right)$$

with $W$ the bytes of weights, $c_{kv}$ the cache bytes per token, BW the bandwidth, and $P$ the useful compute (the lesson uses half the peak). With $B=1$ there are $2N$ operations for every $W=bN$ bytes, that is $2/b$ operations per byte: one, in FP16. The H100 can do $989\\cdot10^{12}/3.35\\cdot10^{12}\\approx 295$ per byte, so one person’s decode uses about 0.3% of the compute. Pope et al. put it this way: at small batch sizes and sequence lengths, loading the weights dominates; at large batches and long sequences, loading the KV cache does.

## The KV cache, inside

$$c_{kv}=2\\,n_\\ell\\,n_{kv}\\,d_h\\,b$$

The 2 is key and value; $n_{kv}$ the number of key-value heads; $d_h$ the head dimension and $b$ the bytes per number. Llama 3 8B (Llama Team, 2024, table 3): $2\\cdot32\\cdot8\\cdot128\\cdot2=131{,}072$ bytes per token (in the scene, $8\\cdot128=1{,}024$ numbers per key per block). With full multi-head attention (32 KV heads) it would be $524{,}288$: Llama 3 uses grouped-query attention (GQA, Ainslie et al., 2023), which shares each pair among four query heads, “to reduce the size of key-value caches during decoding.” The same count gives Kwon et al.’s (2023) value for OPT-13B: $2\\cdot5{,}120\\cdot40\\cdot2=819{,}200$ bytes, about 800 KB per token.

Without a cache, generating $G$ tokens after $P$ input tokens processes $GP+G(G-1)/2$ positions; with a cache, $P+G-1$. With $P=6$ and $G=10$: $105$ versus $15$. The toy transformer in the scene (2 blocks, 2 heads, $d=16$, random weights with a fixed seed; \`tiny.ts\`) runs both paths: it counts 105 and 15 passes, 498,240 and 72,960 multiply-adds, and its logits match with a maximum difference of 0.

## Speed ceiling, batches, and cost

$$\\text{tokens/s per person}\\le\\frac{\\mathrm{BW}}{W+B\\,L\\,c_{kv}},\\qquad \\text{throughput}=\\frac{B}{t_{\\text{turn}}},\\qquad \\text{cost per million}=\\frac{\\text{price per hour}}{3{,}600\\cdot\\text{throughput}}\\cdot10^{6}$$

With the 8B in FP16 on an H100, 8,000 tokens of context, and 2 USD per GPU hour (assumption): $B=1$ gives 196 tokens/s and 2.84 USD per million; $B=60$, the most that fit, gives 42 tokens/s per person, 2,545 in total, and 0.22 USD per million: about thirteen times cheaper on the same machine. With 128,000 tokens of context only 3 conversations fit.

## What an API user pays

On the lists consulted on October 12, 2026, output costs five times the input price on every Anthropic model, and five to more than eight times on Google’s. The scene’s prices ($3 and $15 per million) are an example with that ratio. If the start of your message repeats (instructions, a base document), prompt caching charges much less for it: on Anthropic’s list, reading from the cache costs 0.1 times the input price (0.05 or 0.025 on some models), and writing to it, valid for five minutes, 1.25 times.

The waits in the scene are estimates with the 8B model on one H100 and a single person: prefill at 40% of peak, and every writing turn with the memory time above.

## Mixture of experts

Each block replaces its network with $E$ experts and a router that picks $k$ per token:

$$N_{\\text{total}}=N_{\\text{shared}}+E\\,n_\\ell\\,(3dh),\\qquad N_{\\text{active}}=N_{\\text{shared}}+k\\,n_\\ell\\,(3dh)$$

Mixtral 8x7B (Jiang et al., 2024, table 1): $d=4{,}096$, $h=14{,}336$, $n_\\ell=32$, $E=8$, $k=2$. That gives 46.7 billion in total and 12.9 active. The paper puts it this way: compute is proportional to the active parameters, but “the memory costs for serving Mixtral are proportional to its sparse parameter count, 47B.” If each token picked its two experts at random (assumption: real routing is uneven), a batch of $B$ tokens would touch a fraction $1-(1-k/E)^B$ of the experts in each block: 25% at $B=1$, 90% at $B=8$, 99% at $B=16$.

## In code

Cache, speed ceiling, and cost with the Llama 3 8B architecture:

\`\`\`python
layers, kv_heads, head_dim, bytes_num = 32, 8, 128, 2
kv_per_token = 2 * layers * kv_heads * head_dim * bytes_num         # 2 = key and value
print(kv_per_token)                                                  # bytes per token

weights = 8.03e9 * 2                                                 # FP16: 2 bytes per parameter
print(round(kv_per_token * 128_000 / 1e9, 2))                        # GB of one 128,000-token conversation

bandwidth = 3.35e12                                                  # H100 SXM: 3.35 TB/s
print(round(bandwidth / weights, 1))                                 # tokens/s ceiling for one person

def serve(people, context, usd_per_hour=2.0):
    bytes_per_turn = weights + people * context * kv_per_token       # weights + one cache per person
    t = bytes_per_turn / bandwidth                                   # seconds per turn
    throughput = people / t                                          # tokens/s of the whole system
    return round(1 / t, 1), round(throughput), round(usd_per_hour / (3600 * throughput) * 1e6, 3)

print(serve(1, 8000))      # (tokens/s per person, total tokens/s, US$ per million)
print(serve(60, 8000))
# 131072
# 16.78
# 208.6
# (195.8, 196, 2.837)
# (42.4, 2545, 0.218)
\`\`\`

The cache does not change the result: single-head attention with and without a cache.

\`\`\`python
import numpy as np

rng = np.random.default_rng(0)
d = 8
Wq, Wk, Wv = (rng.normal(size=(d, d)) for _ in range(3))
x = rng.normal(size=(6, d))                          # 6 tokens (already turned into vectors)

def attention_no_cache(x):                           # recomputes K and V for every token
    q, k, v = x @ Wq, x @ Wk, x @ Wv
    s = q @ k.T / np.sqrt(d)
    s = np.where(np.tril(np.ones_like(s)) == 1, s, -np.inf)       # causal mask
    w = np.exp(s - s.max(1, keepdims=True)); w /= w.sum(1, keepdims=True)
    return w @ v

K, V, out = [], [], []                               # with a cache: one token per turn
for t in range(len(x)):
    q = x[t] @ Wq
    K.append(x[t] @ Wk); V.append(x[t] @ Wv)         # only the new pair enters the cache
    s = np.array(K) @ q / np.sqrt(d)
    w = np.exp(s - s.max()); w /= w.sum()
    out.append(w @ np.array(V))

print(np.allclose(attention_no_cache(x), np.array(out)))
# True
\`\`\`

## What comes next

Real systems add more pieces: PagedAttention splits the cache into blocks so memory is not wasted (vLLM: 2 to 4 times the throughput at the same latency as earlier systems, Kwon et al., 2023); continuous batching adds and removes conversations from the batch at every turn (Orca, Yu et al., 2022); and speculative decoding gave 2 to 3 times the speed on T5-XXL “with identical outputs” (Leviathan et al., 2023) and 2 to 2.5 times on Chinchilla 70B (Chen et al., 2023). All of this serves a base model; turning it into an assistant starts with fine-tuning, in lesson 27.`,
  },

  lens: {
    es: [
      'Costo por tarea = tokens de entrada × precio de entrada + tokens de salida × precio de salida. Pide el desglose por tipo de tarea: resumir (entrada larga, salida corta) no se parece a redactar (al revés). Estima tu volumen real en tokens antes de presupuestar.',
      'La espera depende del largo del contexto: el primer token tarda más cuanto más texto envías, y cada token posterior sale más lento con contextos largos. Pide el tiempo hasta el primer token y los tokens por segundo medidos con textos del largo de los tuyos, no los de la ficha comercial.',
      'Pregunta por la caché de prompt. Si el inicio de tus mensajes se repite (instrucciones, un documento base), reutilizarlo baja el costo y la espera: en la lista de Anthropic, leer de esa caché cuesta una décima parte del precio de entrada o menos (escribir la primera vez cuesta algo más: 1.25 veces).',
      'Al comparar modelos o proveedores, mira más que los «parámetros»: parámetros activos (mezcla de expertos), largo del contexto, precio de entrada y de salida. Si alojas tú el modelo, el costo por token depende de cuánto llenes la GPU: con los supuestos de la lección, atender a una persona sola cuesta unas trece veces más por token que un lote lleno.',
    ],
    en: [
      'Cost per task = input tokens × input price + output tokens × output price. Ask for the breakdown by task type: summarizing (long input, short output) is nothing like drafting (the reverse). Estimate your real token volume before budgeting.',
      'The wait depends on context length: the first token takes longer the more text you send, and every later token comes out slower with long contexts. Ask for time to first token and tokens per second measured with texts as long as yours, not the ones on the spec sheet.',
      'Ask about prompt caching. If the start of your messages repeats (instructions, a base document), reusing it cuts cost and wait: on Anthropic’s list, reading from that cache costs a tenth of the input price or less (writing it the first time costs a bit more: 1.25 times).',
      'When comparing models or providers, look beyond “parameters”: active parameters (mixture of experts), context length, input and output price. If you host the model yourself, the cost per token depends on how full you keep the GPU: under the lesson’s assumptions, serving one person alone costs about thirteen times more per token than a full batch.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué hace la caché KV durante la inferencia?', en: 'What does the KV cache do during inference?' },
      options: [
        { es: 'Guarda respuestas completas a preguntas anteriores para repetirlas.', en: 'It stores complete answers to earlier questions in order to repeat them.' },
        { es: 'Guarda las claves y los valores ya calculados de los tokens anteriores, para no recalcularlos en cada vuelta.', en: 'It keeps the keys and values already computed for earlier tokens, so they are not recomputed on every turn.' },
        { es: 'Guarda los pesos más usados en una memoria más rápida.', en: 'It stores the most-used weights in faster memory.' },
        { es: 'Guarda el historial de tus conversaciones entre sesiones.', en: 'It stores your conversation history between sessions.' },
      ],
      answer: 1,
      why: { es: 'Por la máscara causal, un token nunca mira hacia adelante, así que su clave y su valor no cambian. Guardarlos evita repetir trabajo; el precio es memoria, que crece con cada token y con cada conversación.', en: 'Because of the causal mask, a token never looks ahead, so its key and value never change. Keeping them avoids repeated work; the price is memory, which grows with every token and every conversation.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué la decodificación la limita la memoria y no el cálculo?', en: 'Why is decode limited by memory rather than by arithmetic?' },
      options: [
        { es: 'Porque en cada vuelta hay que leer todos los pesos de la memoria, y con cada uno se hacen muy pocas operaciones.', en: 'Because every turn requires reading all the weights from memory, and very few operations are done with each one.' },
        { es: 'Porque las GPU multiplican matrices con lentitud.', en: 'Because GPUs multiply matrices slowly.' },
        { es: 'Porque el llenado ya gastó todo el cálculo disponible.', en: 'Because prefill already used up all the available arithmetic.' },
        { es: 'Porque el modelo escribe varias palabras a la vez.', en: 'Because the model writes several words at once.' },
      ],
      answer: 0,
      why: { es: 'Con una persona hay dos operaciones por cada peso leído, y la H100 podría hacer cientos por byte: espera datos casi todo el tiempo. Por eso los tokens por segundo se estiman como ancho de banda ÷ bytes leídos por vuelta.', en: 'With one person there are two operations per weight read, and the H100 could do hundreds per byte: it waits for data almost all the time. That is why tokens per second are estimated as bandwidth ÷ bytes read per turn.' },
    },
    {
      kind: 'calc',
      q: { es: 'Llama 3 de 8 mil millones guarda unos 131 000 bytes de caché por token. ¿Cuánta caché ocupa una conversación de 64 000 tokens?', en: 'Llama 3 8B keeps about 131,000 bytes of cache per token. How much cache does a 64,000-token conversation take?' },
      options: [
        { es: 'Unos 0.84 GB', en: 'About 0.84 GB' },
        { es: 'Unos 84 GB', en: 'About 84 GB' },
        { es: 'Unos 8.4 GB', en: 'About 8.4 GB' },
        { es: 'Unos 16 GB, lo mismo que los pesos', en: 'About 16 GB, the same as the weights' },
      ],
      answer: 2,
      why: { es: '131 000 × 64 000 ≈ 8 400 millones de bytes, unos 8.4 GB: la mitad de lo que ocupa la caché con 128 000 tokens (casi 17 GB), porque crece en proporción a los tokens.', en: '131,000 × 64,000 ≈ 8.4 billion bytes, about 8.4 GB: half of the cache at 128,000 tokens (almost 17 GB), because it grows in proportion to the tokens.' },
    },
    {
      kind: 'apply',
      q: { es: 'Una empresa resume contratos de 40 000 tokens en resúmenes de 400; otra redacta informes de 4 000 tokens a partir de 500 de instrucciones. Si la salida cuesta cinco veces la entrada, ¿qué es correcto?', en: 'One company summarizes 40,000-token contracts into 400-token summaries; another drafts 4,000-token reports from 500 tokens of instructions. If output costs five times the input, what is correct?' },
      options: [
        { es: 'En los dos casos domina la salida, porque cuesta más por token.', en: 'In both cases output dominates, because it costs more per token.' },
        { es: 'En los dos casos domina la entrada, porque es lo que envía el usuario.', en: 'In both cases input dominates, because it is what the user sends.' },
        { es: 'El costo es parecido: las dos mueven una cantidad parecida de tokens.', en: 'The cost is similar: both move a similar number of tokens.' },
        { es: 'En el resumen domina la entrada y en el informe, la salida; el resumen además tarda más en dar su primer token.', en: 'In the summary input dominates and in the report output does; the summary also takes longer to give its first token.' },
      ],
      answer: 3,
      why: { es: 'Resumen: 40 000 × 1 = 40 000 unidades de entrada contra 400 × 5 = 2 000 de salida (95 % entrada). Informe: 500 × 1 = 500 contra 4 000 × 5 = 20 000 (98 % salida). Y el primer token espera a que se lea toda la entrada: con 40 000 tokens, segundos; con 500, casi nada.', en: 'Summary: 40,000 × 1 = 40,000 input units against 400 × 5 = 2,000 output (95% input). Report: 500 × 1 = 500 against 4,000 × 5 = 20,000 (98% output). And the first token waits for the whole input to be read: with 40,000 tokens, seconds; with 500, almost nothing.' },
    },
  ],

  glossary: [
    'inference', 'parameter', 'weight', 'language-model', 'token', 'autoregression', 'attention', 'query-key-value', 'causal-mask', 'transformer',
    'gpu', 'batch', 'flops', 'bandwidth', 'vram', 'fp16', 'quantization', 'base-model',
    'inference-serving', 'kv-cache', 'prefill', 'decode', 'throughput', 'moe',
  ],

  terms: [
    { id: 'inference-serving', term: { es: 'Servir un modelo (servicio de inferencia)', en: 'Inference serving' }, def: { es: 'Tener un modelo ya entrenado funcionando para atender solicitudes reales: con los pesos fijos, a muchas personas a la vez y cuidando la espera y el costo.', en: 'Running an already trained model to answer real requests: with fixed weights, for many people at once, while managing wait time and cost.' } },
    { id: 'kv-cache', term: { es: 'Caché KV (claves y valores)', en: 'KV cache (keys and values)' }, def: { es: 'Memoria que guarda las claves y los valores ya calculados de los tokens anteriores para no recalcularlos en cada vuelta. Ahorra cálculo, pero ocupa memoria que crece con el contexto y con cada conversación.', en: 'Memory that keeps the keys and values already computed for earlier tokens so they are not recomputed on every turn. It saves arithmetic, but takes memory that grows with the context and with every conversation.' } },
    { id: 'prefill', term: { es: 'Llenado (prefill)', en: 'Prefill' }, def: { es: 'Primera fase de la inferencia: todo el mensaje de entrada se procesa de una vez y se llena la caché KV. De ella depende la espera hasta el primer token.', en: 'First phase of inference: the whole input message is processed at once and the KV cache is filled. The wait until the first token depends on it.' } },
    { id: 'decode', term: { es: 'Decodificación (decode)', en: 'Decode' }, def: { es: 'Segunda fase: los tokens se generan de uno en uno, y cada uno exige una vuelta completa por el modelo que lee todos los pesos y la caché. Suele estar limitada por el ancho de banda de memoria.', en: 'Second phase: tokens are generated one at a time, and each one requires a full turn through the model that reads all the weights and the cache. It is usually limited by memory bandwidth.' } },
    { id: 'throughput', term: { es: 'Rendimiento (throughput)', en: 'Throughput' }, def: { es: 'Tokens por segundo que entrega el sistema completo, sumando a todas las personas atendidas. Sube con el tamaño del lote, a costa de la velocidad que recibe cada persona (la latencia).', en: 'Tokens per second delivered by the whole system, summed over everyone served. It rises with batch size, at the expense of the speed each person gets (latency).' } },
    { id: 'moe', term: { es: 'Mezcla de expertos (MoE)', en: 'Mixture of experts (MoE)' }, def: { es: 'Arquitectura en la que cada bloque tiene varias redes (expertos) y un enrutador elige unas pocas para cada token. Hay muchos parámetros en total y pocos activos por token: ahorra cálculo, no memoria.', en: 'An architecture in which each block has several networks (experts) and a router picks a few for every token. There are many parameters in total and few active per token: it saves arithmetic, not memory.' } },
  ],

  sources: [
    { title: 'Efficiently Scaling Transformer Inference', authors: 'Pope, R., Douglas, S., Chowdhery, A., Devlin, J., Bradbury, J., Levskaya, A., Heek, J., Xiao, K., Agrawal, S., Dean, J.', year: 2022, url: 'https://arxiv.org/abs/2211.05102' },
    { title: 'The Llama 3 Herd of Models (tabla 3: arquitectura de 8B; GQA con 8 cabezas de clave-valor; contexto de hasta 128K)', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'NVIDIA H100 Tensor Core GPU (ficha: 80 GB, 3.35 TB/s; FLOPS «con dispersión»)', authors: 'NVIDIA', year: 2023, url: 'https://www.nvidia.com/en-us/data-center/h100/' },
    { title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention', authors: 'Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Yu, C. H., Gonzalez, J. E., Zhang, H., Stoica, I.', year: 2023, url: 'https://arxiv.org/abs/2309.06180' },
    { title: 'Mixtral of Experts', authors: 'Jiang, A. Q., Sablayrolles, A., Roux, A., Mensch, A., Savary, B., et al.', year: 2024, url: 'https://arxiv.org/abs/2401.04088' },
    { title: 'Fast Inference from Transformers via Speculative Decoding', authors: 'Leviathan, Y., Kalman, M., Matias, Y.', year: 2023, url: 'https://arxiv.org/abs/2211.17192' },
    { title: 'Accelerating Large Language Model Decoding with Speculative Sampling', authors: 'Chen, C., Borgeaud, S., Irving, G., Lespiau, J.-B., Sifre, L., Jumper, J.', year: 2023, url: 'https://arxiv.org/abs/2302.01318' },
    { title: 'Scaling Laws for Neural Language Models (2N operaciones por token en la pasada hacia delante)', authors: 'Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., Child, R., Gray, S., Radford, A., Wu, J., Amodei, D.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'PaLM: Scaling Language Modeling with Pathways (apéndice B: FLOPs de la atención por token)', authors: 'Chowdhery, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2204.02311' },
    { title: 'GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints', authors: 'Ainslie, J., Lee-Thorp, J., de Jong, M., Zemlyanskiy, Y., Lebrón, F., Sanghai, S.', year: 2023, url: 'https://arxiv.org/abs/2305.13245' },
    { title: 'Orca: A Distributed Serving System for Transformer-Based Generative Models', authors: 'Yu, G.-I., Jeong, J. S., Kim, G.-W., Kim, S., Chun, B.-G.', year: 2022, url: 'https://www.usenix.org/conference/osdi22/presentation/yu' },
    { title: 'Pricing (lista de precios de la API, consultada el 12 de octubre de 2026)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
    { title: 'Gemini Developer API pricing (consultada el 12 de octubre de 2026)', authors: 'Google', year: 2026, url: 'https://ai.google.dev/gemini-api/docs/pricing' },
  ],
});
