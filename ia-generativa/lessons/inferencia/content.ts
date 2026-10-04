import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética: siglas y cifras con letras. Se aplica sobre el texto de cada segmento, así el
// subtítulo (con «H100», «KV», «Llama 3») y lo que se dice («hache cien», «ka ve», «Llama tres») no se desincronizan.
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [[/H100/g, 'hache cien'], [/FP16/g, 'efe pe dieciséis'], [/RTX 3060/g, 'erre te equis tres mil sesenta'], [/Llama 3/g, 'Llama tres'], [/\bKV\b/g, 'ka ve'], [/\bMLP\b/g, 'eme ele pe'], [/\bthroughput\b/g, 'zruput']],
  en: [[/H100/g, 'H one hundred'], [/FP16/g, 'F P sixteen'], [/RTX 3060/g, 'R T X thirty sixty'], [/Llama 3/g, 'Llama three'], [/\bKV\b/g, 'K V'], [/\bMLP\b/g, 'M L P']],
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
      'Explicar las dos fases de una respuesta, prefill y decode, y qué hace la caché KV en cada paso.',
      'Calcular cuánta memoria ocupa la caché KV y estimar el techo de velocidad de un modelo a partir del ancho de banda de memoria.',
      'Estimar el costo de una tarea en tokens de entrada y de salida, y reconocer qué la encarece: contexto largo, lote pequeño o modelo grande.',
    ],
    en: [
      'Explain the two phases of an answer, prefill and decode, and what the KV cache does at each step.',
      'Calculate how much memory the KV cache takes and estimate a model’s speed ceiling from memory bandwidth.',
      'Estimate the cost of a task in input and output tokens, and recognize what makes it costlier: long context, small batch, or a big model.',
    ],
  },

  segments: ([
    {
      id: 'hook',
      es: 'Escribes una pregunta y pulsas Enter. Un instante después aparece la primera palabra y el resto fluye a ritmo de lectura. ¿Qué hace el modelo entre tanto, y cuánto cuesta?',
      en: 'You type a question and press Enter. A moment later the first word appears, then the rest flows at reading pace. What happens in between, and what does it cost?',
    },
    {
      id: 'serving',
      es: 'Entrenar ajusta los pesos, una vez y durante meses. Usar el modelo ya entrenado se llama inferencia, y servirlo a miles de personas a la vez es un problema de ingeniería propio.',
      en: 'Training adjusts the weights, once, over months. Using the trained model is called inference, and serving it to thousands of people at once is an engineering problem of its own.',
      note: { es: 'Servir un modelo: usar pesos ya entrenados y fijos para atender a muchas personas a la vez.', en: 'Serving a model: using trained, frozen weights to answer many people at once.' },
    },
    {
      id: 'prefill',
      es: 'Primera fase, el llenado o prefill: tu mensaje entero entra de una vez y sus tokens se procesan en paralelo, porque ya están ahí. Al terminar sale el primer token.',
      en: 'First phase, prefill: your whole message goes in at once and its tokens are processed in parallel, because they are all already there. Then the first token comes out.',
      note: { es: 'Prefill: procesa todo el mensaje en paralelo y fija la espera hasta el primer token.', en: 'Prefill: processes the whole message in parallel and sets the wait for the first token.' },
      pad: 0.4,
    },
    {
      id: 'decode',
      es: 'Segunda fase, la decodificación o decode: el modelo escribe un token por vuelta, y cada token nuevo necesita al anterior. No se pueden calcular varios a la vez.',
      en: 'Second phase, decode: the model writes one token per turn, and each new token needs the previous one. Several cannot be computed at once.',
      note: { es: 'Decode: un token por vuelta, cada uno depende del anterior.', en: 'Decode: one token per turn, each depending on the previous one.' },
      pad: 0.6,
    },
    {
      id: 'phases',
      es: 'Estimemos con una H100 y un modelo de ocho mil millones de parámetros: leer dos mil tokens toma unos ochenta milisegundos; escribir trescientos, casi un segundo y medio. Domina la salida.',
      en: 'Let’s estimate with an H100 and an eight-billion-parameter model: reading two thousand tokens takes about eighty milliseconds; writing three hundred takes almost a second and a half. The output dominates.',
      pad: 0.5,
    },
    {
      id: 'recompute',
      es: 'Hay un desperdicio. Para generar cada token, la atención necesita las claves y los valores de todos los anteriores; recalcularlos en cada vuelta repetiría trabajo ya hecho.',
      en: 'There is waste here. To generate each token, attention needs the keys and values of all the previous ones; recomputing them every turn would repeat work already done.',
      pad: 0.6,
    },
    {
      id: 'unchanged',
      es: 'Y esos valores no cambian: por la máscara causal, un token nunca mira al futuro, así que lo calculado para él queda fijo. Solo la última celda de cada fila es nueva.',
      en: 'And those values never change: because of the causal mask, a token never looks ahead, so what was computed for it stays fixed. Only the last cell of each row is new.',
      pad: 0.4,
    },
    {
      id: 'kvcache',
      es: 'La solución es guardarlos: la caché de claves y valores, o caché KV. Cada token nuevo calcula solo su propio par, lo añade a la caché y consulta todo lo guardado.',
      en: 'The fix is to store them: the key-value cache, or KV cache. Each new token computes only its own pair, adds it to the cache, and looks up everything stored.',
      note: { es: 'Caché KV: guarda las claves y valores ya calculados para no repetir trabajo.', en: 'KV cache: stores the keys and values already computed so work is not repeated.' },
      pad: 0.6,
    },
    {
      id: 'count',
      es: 'Con diez tokens de entrada y dieciséis de salida, son doscientas ochenta pasadas por el modelo sin caché y veinticinco con ella. Un transformer de juguete confirma que el resultado es idéntico.',
      en: 'With ten input tokens and sixteen output tokens, that is two hundred eighty passes through the model without a cache and twenty-five with one. A toy transformer confirms the result is identical.',
      pad: 0.6,
    },
    {
      id: 'price',
      es: 'Pero la caché tiene un precio: memoria. Por cada token se guardan una clave y un valor, en cada capa y en cada cabeza.',
      en: 'But the cache has a price: memory. For every token, one key and one value are stored, in every layer and every head.',
      pad: 0.3,
    },
    {
      id: 'llama-kv',
      es: 'En Llama 3 de ocho mil millones son ciento treinta y un mil bytes por token. A ciento veintiocho mil tokens, una sola conversación guarda casi diecisiete gigabytes: más que los pesos.',
      en: 'In Llama 3 with eight billion parameters, that is one hundred thirty-one thousand bytes per token. At one hundred twenty-eight thousand tokens, one conversation stores almost seventeen gigabytes: more than the weights.',
      pad: 0.6,
    },
    {
      id: 'gqa',
      es: 'Los diseñadores lo saben: Llama 3 comparte cada clave y valor entre cuatro cabezas de consulta, así que la caché es cuatro veces menor.',
      en: 'Designers know this: Llama 3 shares each key and value among four query heads, so the cache is four times smaller.',
      pad: 0.4,
    },
    {
      id: 'shared',
      es: 'Y cada persona simultánea trae su propia caché; los pesos, en cambio, se guardan una vez y los comparten todas. La memoria de la GPU se reparte entre ambos.',
      en: 'And each simultaneous person brings their own cache; the weights, by contrast, are stored once and shared by everyone. The GPU’s memory is split between the two.',
      pad: 0.6,
    },
    {
      id: 'try1',
      es: 'Tu turno: en una GPU de ochenta gigabytes con el modelo de ocho mil millones, busca cuántas conversaciones caben como máximo con contextos de ocho mil y de ciento veintiocho mil tokens.',
      en: 'Your turn: on an eighty-gigabyte GPU holding the eight-billion-parameter model, find how many conversations fit at most with contexts of eight thousand and one hundred twenty-eight thousand tokens.',
      gate: {
        id: 'ledger',
        prompt: {
          es: 'Encuentra el máximo de conversaciones que caben con 8 000 y con 128 000 tokens de contexto.',
          en: 'Find the most conversations that fit with 8,000 and with 128,000 tokens of context.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'read-all',
      es: 'Ahora, el cuello de botella del decode: para producir un token, la GPU lee de su memoria todos los pesos del modelo. Son dieciséis gigabytes con ocho mil millones de parámetros en FP16.',
      en: 'Now, the bottleneck of decode: to produce one token, the GPU reads every weight of the model from its memory. That is sixteen gigabytes for eight billion parameters in FP16.',
      pad: 0.6,
    },
    {
      id: 'math-little',
      es: 'Y por cada peso hace muy poca aritmética: una multiplicación y una suma. Son dieciséis mil millones de operaciones, que una H100 resuelve en unos dieciséis microsegundos.',
      en: 'And for each weight it does very little arithmetic: one multiplication and one addition. That is sixteen billion operations, which an H100 finishes in about sixteen microseconds.',
      pad: 0.5,
    },
    {
      id: 'read-slow',
      es: 'Pero leer esos dieciséis gigabytes a tres coma treinta y cinco terabytes por segundo toma casi cinco milisegundos: trescientas veces más. La GPU pasa casi todo el tiempo esperando datos.',
      en: 'But reading those sixteen gigabytes at three point three five terabytes per second takes almost five milliseconds: three hundred times longer. The GPU spends nearly all its time waiting for data.',
      note: { es: 'Decode: limitado por el ancho de banda de memoria, no por el cálculo.', en: 'Decode is limited by memory bandwidth, not by arithmetic.' },
      pad: 0.6,
    },
    {
      id: 'speed-law',
      es: 'De ahí sale una regla: los tokens por segundo no pasan del ancho de banda dividido entre los bytes leídos por token. Para esta H100, unos doscientos nueve con un solo usuario.',
      en: 'A rule follows: tokens per second cannot exceed the bandwidth divided by the bytes read per token. For this H100, about two hundred nine with a single user.',
      pad: 0.5,
    },
    {
      id: 'quant-speed',
      es: 'Por eso cuantizar acelera: con ocho bits se lee la mitad; con cuatro, un cuarto. Una RTX 3060 no aloja el modelo en dieciséis bits; con ocho da cuarenta y cinco tokens por segundo, y con cuatro, noventa.',
      en: 'That is why quantizing speeds things up: eight bits mean reading half, four bits a quarter. An RTX 3060 cannot hold the model at sixteen bits; at eight it gives forty-five tokens per second, and at four, ninety.',
      pad: 0.6,
    },
    {
      id: 'batching',
      es: 'Mientras espera a la memoria, a la GPU le sobra cálculo. El truco: atender a varias personas a la vez. Los pesos se leen una vez por vuelta y dan un token a cada una.',
      en: 'While it waits for memory, the GPU has arithmetic to spare. The trick: serve several people at once. The weights are read once per turn and yield a token for each person.',
      note: { es: 'Lote: una lectura de pesos sirve a varias personas. Sube el rendimiento del sistema (throughput); cada persona va más lenta.', en: 'Batching: one read of the weights serves several people. System throughput rises; each person gets slower.' },
      pad: 0.6,
    },
    {
      id: 'batch-limit',
      es: 'Hay un límite: cada persona tiene su propia caché, que también hay que leer en cada vuelta. Con contextos largos la caché pesa más que los pesos, y el lote deja de salir gratis.',
      en: 'There is a limit: each person has their own cache, which also has to be read on every turn. With long contexts the cache outweighs the weights, and batching stops being free.',
      pad: 0.6,
    },
    {
      id: 'trade-off',
      es: 'Aparece un equilibrio. Latencia: cuánto espera cada persona por token. Rendimiento, o throughput: cuántos tokens por segundo entrega todo el sistema. Un lote grande abarata el token, pero cada persona va más lenta.',
      en: 'A trade-off appears. Latency: how long each person waits per token. Throughput: how many tokens per second the whole system delivers. A bigger batch makes the token cheaper, but each person gets it slower.',
      pad: 0.6,
    },
    {
      id: 'try2',
      es: 'Tu turno: con contexto de ocho mil tokens, busca un lote que cueste menos de treinta centavos de dólar por millón de tokens y dé a cada persona al menos cincuenta por segundo.',
      en: 'Your turn: with an eight-thousand-token context, find a batch that costs under thirty cents per million tokens and gives each person at least fifty tokens per second.',
      gate: {
        id: 'batch',
        prompt: {
          es: 'Con 8 000 tokens de contexto: busca un lote que cueste menos de US$ 0.30 por millón de tokens y dé 50 tokens/s o más a cada persona.',
          en: 'At 8,000 tokens of context: find a batch that costs under $0.30 per million tokens and gives each person 50 tokens/s or more.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'context-hurts',
      es: 'Ahora, con treinta y dos mil tokens de contexto: cada caché pesa cuatro veces más, caben menos personas y ninguna combinación llega a la meta. El contexto largo encarece y ralentiza.',
      en: 'Now, at thirty-two thousand tokens of context: each cache weighs four times more, fewer people fit, and no combination reaches the goal. A long context makes everything costlier and slower.',
      pad: 0.6,
    },
    {
      id: 'prefill-cheap',
      es: 'No todos los tokens cuestan igual. Los de entrada se procesan juntos en el prefill y ocupan el cálculo; los de salida salen de uno en uno, mientras la GPU espera a la memoria.',
      en: 'Not all tokens cost the same. Input tokens are processed together in prefill and keep the arithmetic busy; output tokens come out one at a time, while the GPU waits on memory.',
      pad: 0.6,
    },
    {
      id: 'price-ratio',
      es: 'Por eso las API cobran aparte entrada y salida, y la salida cuesta más: cinco veces en la lista de Anthropic. Un inicio de prompt repetido, ya en caché, cuesta una décima parte o menos.',
      en: 'That is why APIs bill input and output separately, and output costs more: five times on Anthropic’s price list. A repeated prompt prefix, already cached, costs a tenth or less.',
      pad: 0.6,
    },
    {
      id: 'cost-task',
      es: 'Así, el costo de una tarea es la entrada por su precio más la salida por el suyo. Resumir un contrato largo pesa en la entrada; redactar un informe largo, en la salida.',
      en: 'So the cost of a task is the input times its price plus the output times its own. Summarizing a long contract weighs on the input; drafting a long report weighs on the output.',
      note: { es: 'Costo de una tarea = tokens de entrada × su precio + tokens de salida × su precio.', en: 'Cost of a task = input tokens × their price + output tokens × their price.' },
      pad: 0.6,
    },
    {
      id: 'try3',
      es: 'Tu turno: mueve los tokens de entrada y de salida, y activa la caché de prompt. Encuentra una tarea cuyo costo sea casi todo de entrada y otra casi todo de salida.',
      en: 'Your turn: move the input and output tokens, and switch on prompt caching. Find a task whose cost is almost all input, and another whose cost is almost all output.',
      gate: {
        id: 'task',
        prompt: {
          es: 'Encuentra una tarea con más del 80 % del costo en la entrada y otra con más del 80 % en la salida.',
          en: 'Find a task with over 80% of its cost in input and another with over 80% in output.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'moe-idea',
      es: 'Para tener un modelo enorme sin pagar todo su cálculo hay una receta: la mezcla de expertos. En cada capa, la red MLP se reemplaza por ocho, y un enrutador elige dos por token.',
      en: 'To have an enormous model without paying for all its computation, there is a recipe: mixture of experts. In each layer, the MLP network is replaced by eight, and a router picks two per token.',
      pad: 0.6,
    },
    {
      id: 'moe-numbers',
      es: 'Mixtral tiene unos cuarenta y siete mil millones de parámetros, pero cada token usa unos trece mil millones: calcula como un modelo de trece y guarda como uno de cuarenta y siete.',
      en: 'Mixtral has about forty-seven billion parameters, but each token uses about thirteen billion: it computes like a thirteen-billion model and stores like a forty-seven-billion one.',
      pad: 0.6,
    },
    {
      id: 'moe-memory',
      es: 'La trampa: los cuarenta y siete mil millones siguen en memoria, y con lotes grandes cada token elige expertos distintos, así que casi todos se leen en cada vuelta. Se ahorra cálculo, no memoria.',
      en: 'The catch: all forty-seven billion still sit in memory, and with large batches each token picks different experts, so almost all of them are read on every turn. It saves arithmetic, not memory.',
      note: { es: 'Mezcla de expertos (MoE): parámetros totales muchos, activos pocos; ahorra cálculo, no memoria.', en: 'Mixture of experts (MoE): many total parameters, few active; it saves arithmetic, not memory.' },
      pad: 0.6,
    },
    {
      id: 'spec',
      es: 'Un último truco, solo como mención: la decodificación especulativa. Un modelo pequeño propone varios tokens y el grande los verifica de una pasada. La salida sigue la misma distribución.',
      en: 'One last trick, just a mention: speculative decoding. A small model proposes several tokens and the large one checks them in a single pass. The output keeps the same distribution.',
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: el prefill lee en paralelo; el decode escribe un token por vuelta; la caché evita repetir trabajo a cambio de memoria; y el ancho de banda de memoria manda en velocidad y costo.',
      en: 'In short: prefill reads in parallel; decode writes one token per turn; the cache avoids repeated work in exchange for memory; and memory bandwidth rules both speed and cost.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Todo esto vale para un modelo ya entrenado. Pero un modelo base solo continúa texto: todavía no es un asistente. ¿Cómo se le adapta a lo que necesitas? Con el ajuste fino.',
      en: 'All of this holds for an already trained model. But a base model only continues text: it is not an assistant yet. How do we adapt it to what you need? With fine-tuning.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Una respuesta tiene dos fases: el prefill procesa todo tu mensaje en paralelo y fija la espera hasta el primer token; el decode genera un token por vuelta y fija cuánto tarda el resto.',
      'La caché KV guarda las claves y valores ya calculados: pasa de repetir cerca de N² pasadas a N, a cambio de memoria que crece con el contexto y con cada conversación simultánea.',
      'El decode está limitado por el ancho de banda de memoria: cada token exige leer todos los pesos y la caché. Tokens por segundo ≤ ancho de banda ÷ bytes leídos por token.',
      'Agrupar conversaciones en lotes reparte esa lectura y abarata el token (más rendimiento), pero cada persona va más lenta y la caché por persona limita el tamaño del lote.',
      'El costo se mide en tokens de entrada y de salida, y la salida cuesta más. La mezcla de expertos ahorra cálculo por token, no memoria.',
    ],
    en: [
      'An answer has two phases: prefill processes your whole message in parallel and sets the wait for the first token; decode generates one token per turn and sets how long the rest takes.',
      'The KV cache stores the keys and values already computed: it goes from repeating about N² passes to N, in exchange for memory that grows with context and with every simultaneous conversation.',
      'Decode is limited by memory bandwidth: every token requires reading all the weights and the cache. Tokens per second ≤ bandwidth ÷ bytes read per token.',
      'Batching conversations spreads that read and makes each token cheaper (more throughput), but each person gets slower and the cache per person limits the batch size.',
      'Cost is measured in input and output tokens, and output costs more. Mixture of experts saves arithmetic per token, not memory.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Responder es «calcular»: con una GPU de más cálculo (más FLOPS), el modelo respondería en proporción más rápido.',
      en: 'Answering is “computing”: with a GPU that has more arithmetic (more FLOPS), the model would answer proportionally faster.',
    },
    right: {
      es: 'En el decode manda el ancho de banda de memoria: la GPU espera datos, no cuentas. Con un solo usuario usa menos del uno por ciento de su cálculo. Importan los bytes por token, el contexto y el tamaño del lote, no solo los FLOPS.',
      en: 'In decode, memory bandwidth rules: the GPU waits for data, not for arithmetic. With one user it uses under one percent of its compute. What matters is bytes per token, context, and batch size, not just FLOPS.',
    },
  },

  deeper: {
    es: `## Dos fases, dos cuellos de botella

Un modelo denso con $N$ parámetros gasta unos $2N$ FLOPs por cada token que procesa (Kaplan et al., 2020; Pope et al., 2022), más un término de atención que crece con el contexto.

**Prefill** (los $L$ tokens a la vez; $n_\\ell$ capas, $d_{\\text{attn}}$ = cabezas × dimensión por cabeza):

$$\\text{FLOPs}_{\\text{prefill}}\\approx 2NL+2\\,n_\\ell\\,d_{\\text{attn}}\\,L^2$$

Son multiplicaciones de matrices grandes: la GPU trabaja cerca de su pico (la lección supone el 40 %, parecido al MFU que reporta Llama 3 al entrenar).

**Decode** ($B$ conversaciones, cada una con $L$ tokens de contexto). Cada vuelta tiene un *tiempo de memoria* y un *tiempo de cálculo* (Pope et al., §2) y manda el mayor:

$$t_{\\text{vuelta}}=\\max\\!\\left(\\frac{W+B\\,L\\,c_{kv}}{\\mathrm{BW}},\\ \\frac{B\\,(2N+4\\,n_\\ell\\,d_{\\text{attn}}\\,L)}{P}\\right)$$

con $W$ los bytes de pesos, $c_{kv}$ los bytes de caché por token, BW el ancho de banda y $P$ el cálculo útil de la GPU (la lección usa la mitad del pico). Con $B=1$ hay $2N$ FLOPs por cada $W=bN$ bytes, es decir $2/b$ FLOPs por byte: uno, en FP16. Una H100 puede hacer $989\\cdot10^{12}/3.35\\cdot10^{12}\\approx 295$ por byte, así que el decode de una persona usa cerca del 0.3 % del cálculo. Ignorando la caché, el lote con el que el cálculo alcanza a la memoria es $B^{*}\\approx P\\,b/(2\\,\\mathrm{BW})$: unos 295 con el pico de la hoja de datos y unos 148 con la mitad del pico que usa la lección; la caché de cada persona suele impedir llegar ahí.

## La caché KV por dentro

$$c_{kv}=2\\,n_\\ell\\,n_{kv}\\,d_h\\,b$$

El 2 es clave y valor; $n_{kv}$ son las cabezas de clave-valor; $d_h$ la dimensión por cabeza y $b$ los bytes por número. Llama 3 8B (Llama Team, 2024, tabla 3; la ventana de 128 000 tokens es la que el informe logra al final del preentrenamiento, partiendo de 8 000): $2\\cdot32\\cdot8\\cdot128\\cdot2=131\\,072$ bytes por token; 70B: $2\\cdot80\\cdot8\\cdot128\\cdot2=327\\,680$. Con atención multicabeza completa (32 cabezas KV en el 8B) serían $524\\,288$. La atención de consultas agrupadas (GQA, Ainslie et al., 2023) comparte cada par entre un grupo de cabezas de consulta; la de una sola cabeza (Shazeer, 2019) usa un par para todas. La misma cuenta da el valor de Kwon et al. (2023) para OPT-13B: $2\\cdot5120\\cdot40\\cdot2=819\\,200$ bytes, unos 800 KB, y 1.6 GB para 2 048 tokens.

Sin caché, generar $G$ tokens tras $P$ de entrada procesa $GP+G(G-1)/2$ posiciones; con caché, $P+G-1$. Con $P=10$ y $G=16$: $280$ frente a $25$. El juguete de la escena (2 capas, 2 cabezas, $d=16$, pesos aleatorios) cuenta esas pasadas y las multiplicaciones-sumas realizadas (unos 1.46 millones contra 135 mil), y los logits coinciden con una diferencia máxima de 0.

## Techo de velocidad, lotes y costo

$$\\text{tokens/s por persona}\\le\\frac{\\mathrm{BW}}{W+B\\,L\\,c_{kv}},\\qquad \\text{rendimiento}=\\frac{B}{t_{\\text{vuelta}}},\\qquad \\text{costo por millón}=\\frac{\\text{precio por hora}}{3600\\cdot\\text{rendimiento}}\\cdot10^{6}$$

Con el 8B en FP16 en una H100, contexto de 8 000 tokens y 2 USD por GPU-hora (supuesto): $B=1$ da 196 tokens/s y 2.84 USD por millón; $B=32$ da 67.5 tokens/s por persona, 2 161 en total y 0.26 USD por millón. Con 32 000 tokens de contexto caben 15 conversaciones y el mejor caso cuesta cerca de 0.87 USD por millón. Con $B=1$ el costo es once veces el de $B=32$ en la misma máquina: una GPU poco usada es cara por token.

Los precios de la API que aparecen en la escena (US$ 3 y 15 por millón de tokens) son un ejemplo. En la lista de Anthropic consultada el 4 de octubre de 2026, la salida cuesta cinco veces la entrada en todos los modelos listados; leer de la caché de prompt cuesta 0.1 veces el precio de entrada en casi todos (0.05 y 0.025 en dos modelos) y escribir en ella, con vigencia de cinco minutos, 1.25 veces. La escena ignora ese sobrecosto de escritura.

## Mezcla de expertos

Cada capa reemplaza la red MLP por $E$ expertos y un enrutador que elige $k$ por token:

$$N_{\\text{total}}=N_{\\text{comunes}}+E\\,n_\\ell\\,(3dh),\\qquad N_{\\text{activos}}=N_{\\text{comunes}}+k\\,n_\\ell\\,(3dh)$$

Mixtral 8x7B (Jiang et al., 2024, tabla 1): $d=4096$, $h=14\\,336$, $n_\\ell=32$, $E=8$, $k=2$. Salen 1.6 mil millones comunes (atención, embeddings, enrutadores), 45.1 de expertos y, en total, 46.7; activos, 12.9. El artículo lo dice así: el costo de cálculo es proporcional a los parámetros activos, pero «el costo de memoria para servir Mixtral es proporcional a su cantidad de parámetros dispersos, 47B», y se presta mejor a cargas con lotes. Si cada token elige sus dos expertos por igual al azar (supuesto: en la práctica el enrutamiento es desigual), la fracción de expertos que un lote de $B$ tokens consulta en una capa es $1-(1-k/E)^B$: 25 % con $B=1$, 90 % con $B=8$, 99 % con $B=16$. DeepSeek-V3 lleva la idea más lejos: 671 mil millones en total y 37 mil millones activos por token.

## En código

Caché, techo de velocidad y costo con la arquitectura de Llama 3 8B:

\`\`\`python
capas, cabezas_kv, dim_cabeza, bytes_num = 32, 8, 128, 2
kv_por_token = 2 * capas * cabezas_kv * dim_cabeza * bytes_num      # 2 = clave y valor
print(kv_por_token)                                                  # bytes por token

pesos = 8.03e9 * 2                                                   # FP16: 2 bytes por parámetro
print(round(kv_por_token * 128_000 / 1e9, 2))                        # GB de una conversación de 128 000 tokens

ancho_banda = 3.35e12                                                # H100 SXM: 3,35 TB/s
print(round(ancho_banda / pesos, 1))                                 # techo de tokens/s con un solo usuario

def servir(usuarios, contexto, usd_por_hora=2.0):
    bytes_por_vuelta = pesos + usuarios * contexto * kv_por_token    # pesos + una caché por persona
    t = bytes_por_vuelta / ancho_banda                               # segundos por vuelta
    rendimiento = usuarios / t                                       # tokens/s de todo el sistema
    return round(1 / t, 1), round(rendimiento), round(usd_por_hora / (3600 * rendimiento) * 1e6, 3)

print(servir(1, 8000))     # (tokens/s por persona, tokens/s totales, US$ por millón)
print(servir(32, 8000))
# 131072
# 16.78
# 208.6
# (195.8, 196, 2.837)
# (67.5, 2161, 0.257)
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

Parámetros totales y activos de Mixtral, desde su tabla 1:

\`\`\`python
dim, capas, d_cab, oculta, cab, cab_kv, vocab, expertos, k = 4096, 32, 128, 14336, 32, 8, 32000, 8, 2
atencion = capas * (dim * cab * d_cab * 2 + dim * cab_kv * d_cab * 2)    # Wq, Wo | Wk, Wv
comunes = atencion + 2 * vocab * dim + capas * dim * expertos            # + embeddings y enrutadores
experto = 3 * dim * oculta                                               # FFN SwiGLU: 3 matrices
total = comunes + capas * expertos * experto
activos = comunes + capas * k * experto
print(round(total / 1e9, 1), round(activos / 1e9, 1))
print([round(1 - (1 - k / expertos) ** B, 2) for B in (1, 2, 4, 8, 16)])   # supuesto: enrutamiento uniforme
# 46.7 12.9
# [0.25, 0.44, 0.68, 0.9, 0.99]
\`\`\`

## Lo que viene

Los sistemas reales añaden más piezas: PagedAttention reparte la caché en bloques para no desperdiciar memoria (vLLM: de 2 a 4 veces más rendimiento con la misma latencia que sistemas anteriores, Kwon et al., 2023), el *batching* continuo mete y saca conversaciones del lote en cada vuelta (Orca, Yu et al., 2022) y la decodificación especulativa dio aceleraciones de 2 a 3 veces en T5-XXL (Leviathan et al., 2023) y de 2 a 2.5 veces en Chinchilla 70B (Chen et al., 2023) sin cambiar la distribución de la salida. Todo esto sirve a un modelo base; convertirlo en asistente empieza con el ajuste fino, en la lección 27.`,
    en: `## Two phases, two bottlenecks

A dense model with $N$ parameters spends about $2N$ FLOPs on every token it processes (Kaplan et al., 2020; Pope et al., 2022), plus an attention term that grows with context.

**Prefill** (all $L$ tokens at once; $n_\\ell$ layers, $d_{\\text{attn}}$ = heads × head dimension):

$$\\text{FLOPs}_{\\text{prefill}}\\approx 2NL+2\\,n_\\ell\\,d_{\\text{attn}}\\,L^2$$

These are large matrix multiplications: the GPU works close to its peak (the lesson assumes 40%, similar to the MFU Llama 3 reports in training).

**Decode** ($B$ conversations, each with $L$ tokens of context). Every turn has a *memory time* and a *compute time* (Pope et al., §2), and the larger one rules:

$$t_{\\text{turn}}=\\max\\!\\left(\\frac{W+B\\,L\\,c_{kv}}{\\mathrm{BW}},\\ \\frac{B\\,(2N+4\\,n_\\ell\\,d_{\\text{attn}}\\,L)}{P}\\right)$$

with $W$ the bytes of weights, $c_{kv}$ the cache bytes per token, BW the bandwidth, and $P$ the useful compute of the GPU (the lesson uses half the peak). With $B=1$ there are $2N$ FLOPs for every $W=bN$ bytes, that is $2/b$ FLOPs per byte: one, in FP16. An H100 can do $989\\cdot10^{12}/3.35\\cdot10^{12}\\approx 295$ per byte, so single-user decode uses about 0.3% of the arithmetic. Ignoring the cache, the batch at which arithmetic catches up with memory is $B^{*}\\approx P\\,b/(2\\,\\mathrm{BW})$: about 295 with the datasheet peak and about 148 with the half-peak the lesson uses; each person’s cache usually prevents getting there.

## The KV cache, inside

$$c_{kv}=2\\,n_\\ell\\,n_{kv}\\,d_h\\,b$$

The 2 is key and value; $n_{kv}$ is the number of key-value heads; $d_h$ the dimension per head and $b$ the bytes per number. Llama 3 8B (Llama Team, 2024, table 3; the 128,000-token window is the one the report reaches at the end of pre-training, starting from 8,000): $2\\cdot32\\cdot8\\cdot128\\cdot2=131{,}072$ bytes per token; 70B: $2\\cdot80\\cdot8\\cdot128\\cdot2=327{,}680$. With full multi-head attention (32 KV heads in the 8B) it would be $524{,}288$. Grouped-query attention (GQA, Ainslie et al., 2023) shares each pair among a group of query heads; multi-query attention (Shazeer, 2019) uses one pair for all. The same count gives Kwon et al.’s (2023) value for OPT-13B: $2\\cdot5120\\cdot40\\cdot2=819{,}200$ bytes, about 800 KB, and 1.6 GB for 2,048 tokens.

Without a cache, generating $G$ tokens after $P$ input tokens processes $GP+G(G-1)/2$ positions; with a cache, $P+G-1$. With $P=10$ and $G=16$: $280$ versus $25$. The toy in the scene (2 layers, 2 heads, $d=16$, random weights) counts those passes and the multiply-adds actually performed (about 1.46 million against 135 thousand), and the logits match with a maximum difference of 0.

## Speed ceiling, batches, and cost

$$\\text{tokens/s per person}\\le\\frac{\\mathrm{BW}}{W+B\\,L\\,c_{kv}},\\qquad \\text{throughput}=\\frac{B}{t_{\\text{turn}}},\\qquad \\text{cost per million}=\\frac{\\text{price per hour}}{3600\\cdot\\text{throughput}}\\cdot10^{6}$$

With the 8B in FP16 on an H100, 8,000 tokens of context, and 2 USD per GPU-hour (assumption): $B=1$ gives 196 tokens/s and 2.84 USD per million; $B=32$ gives 67.5 tokens/s per person, 2,161 in total, and 0.26 USD per million. With 32,000 tokens of context, 15 conversations fit and the best case costs about 0.87 USD per million. At $B=1$ the cost is eleven times that of $B=32$ on the same machine: an underused GPU is expensive per token.

The API prices in the scene ($3 and $15 per million tokens) are an example. On Anthropic’s list as consulted on October 4, 2026, output costs five times input on every model listed; reading from the prompt cache costs 0.1 times the input price on almost all of them (0.05 and 0.025 on two models), and writing to it, valid for five minutes, 1.25 times. The scene ignores that write surcharge.

## Mixture of experts

Each layer replaces the MLP network with $E$ experts and a router that picks $k$ per token:

$$N_{\\text{total}}=N_{\\text{shared}}+E\\,n_\\ell\\,(3dh),\\qquad N_{\\text{active}}=N_{\\text{shared}}+k\\,n_\\ell\\,(3dh)$$

Mixtral 8x7B (Jiang et al., 2024, table 1): $d=4096$, $h=14{,}336$, $n_\\ell=32$, $E=8$, $k=2$. That gives 1.6 billion shared parameters (attention, embeddings, routers), 45.1 in experts, 46.7 in total, and 12.9 active. The paper puts it this way: compute cost is proportional to the active parameters, but “the memory costs for serving Mixtral are proportional to its sparse parameter count, 47B,” and it suits batched workloads better. If each token picks its two experts uniformly at random (assumption: real routing is uneven), the fraction of experts a batch of $B$ tokens touches in a layer is $1-(1-k/E)^B$: 25% at $B=1$, 90% at $B=8$, 99% at $B=16$. DeepSeek-V3 takes the idea further: 671 billion in total and 37 billion active per token.

## In code

Cache, speed ceiling, and cost with the Llama 3 8B architecture:

\`\`\`python
layers, kv_heads, head_dim, bytes_num = 32, 8, 128, 2
kv_per_token = 2 * layers * kv_heads * head_dim * bytes_num         # 2 = key and value
print(kv_per_token)                                                  # bytes per token

weights = 8.03e9 * 2                                                 # FP16: 2 bytes per parameter
print(round(kv_per_token * 128_000 / 1e9, 2))                        # GB of one 128,000-token conversation

bandwidth = 3.35e12                                                  # H100 SXM: 3.35 TB/s
print(round(bandwidth / weights, 1))                                 # tokens/s ceiling for a single user

def serve(users, context, usd_per_hour=2.0):
    bytes_per_turn = weights + users * context * kv_per_token        # weights + one cache per person
    t = bytes_per_turn / bandwidth                                   # seconds per turn
    throughput = users / t                                           # tokens/s of the whole system
    return round(1 / t, 1), round(throughput), round(usd_per_hour / (3600 * throughput) * 1e6, 3)

print(serve(1, 8000))      # (tokens/s per person, total tokens/s, US$ per million)
print(serve(32, 8000))
# 131072
# 16.78
# 208.6
# (195.8, 196, 2.837)
# (67.5, 2161, 0.257)
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

Mixtral’s total and active parameters, from its table 1:

\`\`\`python
dim, layers, d_head, hidden, heads, kv_heads, vocab, experts, k = 4096, 32, 128, 14336, 32, 8, 32000, 8, 2
attention = layers * (dim * heads * d_head * 2 + dim * kv_heads * d_head * 2)   # Wq, Wo | Wk, Wv
shared = attention + 2 * vocab * dim + layers * dim * experts                    # + embeddings and routers
expert = 3 * dim * hidden                                                        # SwiGLU FFN: 3 matrices
total = shared + layers * experts * expert
active = shared + layers * k * expert
print(round(total / 1e9, 1), round(active / 1e9, 1))
print([round(1 - (1 - k / experts) ** B, 2) for B in (1, 2, 4, 8, 16)])         # assumption: uniform routing
# 46.7 12.9
# [0.25, 0.44, 0.68, 0.9, 0.99]
\`\`\`

## What comes next

Real systems add more pieces: PagedAttention splits the cache into blocks so memory is not wasted (vLLM: 2 to 4 times the throughput at the same latency as earlier systems, Kwon et al., 2023), continuous batching adds and removes conversations from the batch at every turn (Orca, Yu et al., 2022), and speculative decoding gave 2 to 3 times speedups on T5-XXL (Leviathan et al., 2023) and 2 to 2.5 times on Chinchilla 70B (Chen et al., 2023) without changing the output distribution. All of this serves a base model; turning it into an assistant starts with fine-tuning, in lesson 27.`,
  },

  lens: {
    es: [
      'Costo por tarea = tokens de entrada × precio de entrada + tokens de salida × precio de salida. Pide el desglose por tipo de tarea: resumir (entrada larga, salida corta) no se parece a redactar (al revés). Estima tu volumen real en tokens antes de presupuestar.',
      'La latencia depende del contexto: la espera hasta el primer token crece con lo que envías, y cada token posterior sale más lento con contextos largos. Pide el tiempo al primer token y los tokens por segundo medidos con tu longitud de contexto, no los de la ficha comercial.',
      'Pregunta por la caché de prompt. Si el inicio de tu prompt se repite (instrucciones, un documento base), reutilizarlo baja el costo y la espera: en la lista de Anthropic, leer de caché cuesta una décima parte de la entrada o menos (escribir la primera vez cuesta algo más: 1.25 veces).',
      'Al comparar modelos o proveedores, mira más que los «parámetros»: parámetros activos (mezcla de expertos), tamaño de contexto, precio de entrada y de salida. Si alojas el modelo tú, el costo por token depende de la utilización: con los supuestos de la lección, una GPU casi vacía cuesta unas once veces más por token que una bien agrupada.',
    ],
    en: [
      'Cost per task = input tokens × input price + output tokens × output price. Ask for the breakdown by task type: summarizing (long input, short output) is nothing like drafting (the reverse). Estimate your real token volume before budgeting.',
      'Latency depends on context: the wait for the first token grows with what you send, and every later token comes out slower with long contexts. Ask for time to first token and tokens per second measured at your context length, not the ones on the spec sheet.',
      'Ask about prompt caching. If the start of your prompt repeats (instructions, a base document), reusing it cuts cost and wait: on Anthropic’s list, reading from cache costs a tenth of the input price or less (writing the first time costs a bit more: 1.25 times).',
      'When comparing models or providers, look beyond “parameters”: active parameters (mixture of experts), context size, input and output price. If you host the model yourself, cost per token depends on utilization: under the lesson’s assumptions, a nearly empty GPU costs about eleven times more per token than a well-batched one.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué hace la caché KV durante la inferencia?', en: 'What does the KV cache do during inference?' },
      options: [
        { es: 'Guarda las respuestas completas a preguntas anteriores para repetirlas.', en: 'Stores complete answers to earlier questions in order to repeat them.' },
        { es: 'Guarda las claves y los valores ya calculados de los tokens anteriores, para no recalcularlos en cada vuelta.', en: 'Stores the keys and values already computed for earlier tokens, so they are not recomputed on every turn.' },
        { es: 'Guarda los pesos más usados en una memoria más rápida.', en: 'Stores the most-used weights in faster memory.' },
        { es: 'Guarda el historial de la conversación entre sesiones.', en: 'Stores the conversation history between sessions.' },
      ],
      answer: 1,
      why: { es: 'Como un token nunca mira al futuro, sus claves y valores no cambian. Guardarlos evita repetir trabajo; el precio es memoria, que crece con el contexto y con cada conversación simultánea.', en: 'Since a token never looks at the future, its keys and values never change. Storing them avoids repeated work; the price is memory, which grows with context and with every simultaneous conversation.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué el decode está limitado por el ancho de banda de memoria y no por el cálculo?', en: 'Why is decode limited by memory bandwidth rather than by arithmetic?' },
      options: [
        { es: 'Porque cada token exige leer todos los pesos de la memoria y hace muy poca aritmética con cada uno.', en: 'Because every token requires reading all the weights from memory and does very little arithmetic with each one.' },
        { es: 'Porque las GPU multiplican matrices con lentitud.', en: 'Because GPUs multiply matrices slowly.' },
        { es: 'Porque el prefill ya gastó todo el cálculo disponible.', en: 'Because prefill already used up all the available arithmetic.' },
        { es: 'Porque el modelo escribe varias palabras a la vez.', en: 'Because the model writes several words at once.' },
      ],
      answer: 0,
      why: { es: 'Con un usuario hay unas dos operaciones por cada peso leído, y la GPU puede hacer cientos de operaciones por byte. Espera datos casi todo el tiempo, por eso los tokens por segundo se estiman como ancho de banda ÷ bytes leídos.', en: 'With one user there are about two operations per weight read, and the GPU can do hundreds of operations per byte. It waits for data almost all the time, which is why tokens per second are estimated as bandwidth ÷ bytes read.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un modelo tiene 40 capas, 8 cabezas de clave-valor de dimensión 128 y guarda la caché en FP16 (2 bytes). ¿Cuánta caché ocupa una conversación de 10 000 tokens?', en: 'A model has 40 layers, 8 key-value heads of dimension 128, and stores the cache in FP16 (2 bytes). How much cache does a 10,000-token conversation take?' },
      options: [
        { es: '0.82 GB', en: '0.82 GB' },
        { es: '3.28 GB', en: '3.28 GB' },
        { es: '16.4 GB', en: '16.4 GB' },
        { es: '1.64 GB', en: '1.64 GB' },
      ],
      answer: 3,
      why: { es: 'Por token: 2 (clave y valor) × 40 × 8 × 128 × 2 bytes = 163 840 bytes. Por 10 000 tokens son 1.64 GB. Olvidar el factor 2 de clave y valor da 0.82 GB.', en: 'Per token: 2 (key and value) × 40 × 8 × 128 × 2 bytes = 163,840 bytes. Times 10,000 tokens that is 1.64 GB. Forgetting the factor 2 for key and value gives 0.82 GB.' },
    },
    {
      kind: 'apply',
      q: { es: 'Una empresa resume contratos de 40 000 tokens en resúmenes de 400; otra redacta informes de 4 000 tokens a partir de 500 de instrucciones. Con precio de salida cinco veces el de entrada, ¿qué es correcto?', en: 'One company summarizes 40,000-token contracts into 400-token summaries; another drafts 4,000-token reports from 500 tokens of instructions. With an output price five times the input price, what is correct?' },
      options: [
        { es: 'En ambos casos domina la salida, porque cuesta más por token.', en: 'In both cases output dominates, because it costs more per token.' },
        { es: 'En ambos casos domina la entrada, porque es lo que envía el usuario.', en: 'In both cases input dominates, because it is what the user sends.' },
        { es: 'En el resumen domina la entrada y en el informe la salida; en el primero conviene reutilizar un inicio de prompt repetido (caché).', en: 'In the summary input dominates and in the report output does; in the first, reusing a repeated prompt prefix (cache) pays off.' },
        { es: 'El costo es parecido: ambas mueven un número similar de tokens.', en: 'The cost is similar: both move a similar number of tokens.' },
      ],
      answer: 2,
      why: { es: 'Resumen: 40 000 × 1 = 40 000 unidades de entrada contra 400 × 5 = 2 000 de salida (95 % entrada). Informe: 500 × 1 = 500 contra 4 000 × 5 = 20 000 (98 % salida). Donde domina la entrada, la caché de prompt ahorra más.', en: 'Summary: 40,000 × 1 = 40,000 input units against 400 × 5 = 2,000 output (95% input). Report: 500 × 1 = 500 against 4,000 × 5 = 20,000 (98% output). Where input dominates, prompt caching saves more.' },
    },
  ],

  glossary: [
    'inference', 'parameter', 'weight', 'token', 'autoregression', 'attention', 'query-key-value', 'causal-mask', 'transformer',
    'gpu', 'batch', 'flops', 'quantization', 'bandwidth', 'vram', 'fp16', 'pretraining', 'base-model',
    'inference-serving', 'kv-cache', 'prefill', 'decode', 'throughput', 'moe',
  ],

  terms: [
    { id: 'inference-serving', term: { es: 'Servicio de inferencia', en: 'Inference serving' }, def: { es: 'Operar un modelo ya entrenado para atender solicitudes reales: con los pesos fijos, a muchas personas a la vez y cuidando la latencia y el costo.', en: 'Running an already trained model to answer real requests: with frozen weights, for many people at once, while managing latency and cost.' } },
    { id: 'kv-cache', term: { es: 'Caché KV (claves y valores)', en: 'KV cache (keys and values)' }, def: { es: 'Memoria que guarda las claves y los valores ya calculados de los tokens anteriores para no recalcularlos en cada paso. Ahorra cálculo, pero ocupa memoria que crece con el contexto y con cada conversación.', en: 'Memory that stores the keys and values already computed for earlier tokens so they are not recomputed at every step. It saves arithmetic, but takes memory that grows with context and with every conversation.' } },
    { id: 'prefill', term: { es: 'Prefill (llenado)', en: 'Prefill' }, def: { es: 'Primera fase de la inferencia: se procesa todo el mensaje de entrada en paralelo y se llena la caché KV. Determina la espera hasta el primer token.', en: 'First phase of inference: the whole input message is processed in parallel and the KV cache is filled. It determines the wait for the first token.' } },
    { id: 'decode', term: { es: 'Decode (decodificación)', en: 'Decode' }, def: { es: 'Segunda fase: los tokens se generan de uno en uno, y cada uno exige una pasada por el modelo que lee todos los pesos y la caché. Suele estar limitada por el ancho de banda de memoria.', en: 'Second phase: tokens are generated one at a time, and each requires a pass through the model that reads all the weights and the cache. It is usually limited by memory bandwidth.' } },
    { id: 'throughput', term: { es: 'Rendimiento (throughput)', en: 'Throughput' }, def: { es: 'Tokens por segundo que produce el sistema completo, sumando a todas las personas atendidas. Sube con el tamaño del lote, a costa de la velocidad por persona (la latencia).', en: 'Tokens per second produced by the whole system, summed over everyone served. It rises with batch size, at the expense of per-person speed (latency).' } },
    { id: 'moe', term: { es: 'Mezcla de expertos (MoE)', en: 'Mixture of experts (MoE)' }, def: { es: 'Arquitectura en la que cada capa tiene varias redes (expertos) y un enrutador elige unas pocas para cada token. Hay muchos parámetros totales y pocos activos por token: ahorra cálculo, no memoria.', en: 'An architecture in which each layer has several networks (experts) and a router picks a few for every token. There are many total parameters and few active per token: it saves arithmetic, not memory.' } },
  ],

  sources: [
    { title: 'Efficiently Scaling Transformer Inference', authors: 'Pope, R., Douglas, S., Chowdhery, A., Devlin, J., Bradbury, J., Levskaya, A., Heek, J., Xiao, K., Agrawal, S., Dean, J.', year: 2022, url: 'https://arxiv.org/abs/2211.05102' },
    { title: 'Efficient Memory Management for Large Language Model Serving with PagedAttention', authors: 'Kwon, W., Li, Z., Zhuang, S., Sheng, Y., Zheng, L., Yu, C. H., Gonzalez, J. E., Zhang, H., Stoica, I.', year: 2023, url: 'https://arxiv.org/abs/2309.06180' },
    { title: 'Mixtral of Experts', authors: 'Jiang, A. Q., et al.', year: 2024, url: 'https://arxiv.org/abs/2401.04088' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Fast Inference from Transformers via Speculative Decoding', authors: 'Leviathan, Y., Kalman, M., Matias, Y.', year: 2023, url: 'https://arxiv.org/abs/2211.17192' },
    { title: 'Accelerating Large Language Model Decoding with Speculative Sampling', authors: 'Chen, C., Borgeaud, S., Irving, G., Lespiau, J.-B., Sifre, L., Jumper, J.', year: 2023, url: 'https://arxiv.org/abs/2302.01318' },
    { title: 'GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints', authors: 'Ainslie, J., Lee-Thorp, J., de Jong, M., Zemlyanskiy, Y., Lebrón, F., Sanghai, S.', year: 2023, url: 'https://arxiv.org/abs/2305.13245' },
    { title: 'Fast Transformer Decoding: One Write-Head is All You Need', authors: 'Shazeer, N.', year: 2019, url: 'https://arxiv.org/abs/1911.02150' },
    { title: 'Orca: A Distributed Serving System for Transformer-Based Generative Models', authors: 'Yu, G.-I., Jeong, J. S., Kim, G.-W., Kim, S., Chun, B.-G.', year: 2022, url: 'https://www.usenix.org/conference/osdi22/presentation/yu' },
    { title: 'PaLM: Scaling Language Modeling with Pathways (apéndice B, FLOPs por token)', authors: 'Chowdhery, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2204.02311' },
    { title: 'DeepSeek-V3 Technical Report', authors: 'DeepSeek-AI', year: 2024, url: 'https://arxiv.org/abs/2412.19437' },
    { title: 'NVIDIA H100 Tensor Core GPU y NVIDIA A100 80GB Tensor Core GPU: hojas de datos (memoria, ancho de banda, FLOPS)', authors: 'NVIDIA', year: 2023, url: 'https://www.nvidia.com/en-us/data-center/h100/' },
    { title: 'Scaling Laws for Neural Language Models (2N FLOPs por token en la pasada hacia delante)', authors: 'Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., Child, R., Gray, S., Radford, A., Wu, J., Amodei, D.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'GeForce RTX 3060 (ficha: 12 GB y bus de 192 bits; 360 GB/s con la memoria a 15 Gbps por pin)', authors: 'NVIDIA', year: 2021, url: 'https://www.nvidia.com/en-us/geforce/graphics-cards/30-series/rtx-3060-3060ti/' },
    { title: 'Pricing (lista de precios de la API, consultada el 4 de octubre de 2026)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
  ],
});
