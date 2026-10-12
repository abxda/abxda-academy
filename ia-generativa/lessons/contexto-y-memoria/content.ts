import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «GPT-3.5-Turbo»,
// «Llama 3.1» o «KV», y la voz dice «ge pe te tres punto cinco turbo», «Lama tres punto uno» o «ka uve».
// (Las cifras ya van con letras en la narración.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/GPT-3\.5-Turbo/g, 'ge pe te tres punto cinco turbo'], [/GPT-3/g, 'ge pe te tres'], [/OpenAI/g, 'Open ei ai'], [/Anthropic/g, 'Anzrópic'],
    [/Llama 3\.1/g, 'Lama tres punto uno'], [/Gemini 1\.5/g, 'Yémini uno punto cinco'], [/\bClaude\b/g, 'Clod'], [/\bstateless\b/g, 'stéitles'],
    [/system prompt/g, 'sístem prompt'], [/El gran Gatsby/g, 'El gran Gátsbi']
  ],
  en: [
    [/GPT-3\.5-Turbo/g, 'G P T three point five Turbo'], [/GPT-3/g, 'G P T three'], [/OpenAI/g, 'Open A I'],
    [/Llama 3\.1/g, 'Llama three point one'], [/Gemini 1\.5/g, 'Gemini one point five'],
  ],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'contexto-y-memoria',

  objectives: {
    es: [
      'Explicar por qué un chatbot parece recordar tu conversación aunque el modelo no guarde nada: la aplicación le reenvía todo en cada turno.',
      'Reconocer qué es la ventana de contexto, qué ocupa lugar en ella y qué pasa con lo que ya no cabe.',
      'Calcular cuántos tokens se procesan al reenviar una conversación, y explicar por qué lo que queda en medio de un contexto largo se aprovecha peor.',
    ],
    en: [
      'Explain why a chatbot seems to remember your conversation even though the model stores nothing: the app resends everything on every turn.',
      'Recognize what the context window is, what takes up room in it, and what happens to whatever no longer fits.',
      'Calculate how many tokens are processed when a conversation is resent, and explain why what sits in the middle of a long context is used less well.',
    ],
  },

  segments: ([
    // ── 1 · parece memoria ──
    {
      id: 'hook',
      es: 'Le escribes a un chatbot: «me llamo Ana y trabajo en logística». Te saluda por tu nombre y platican un rato sobre envíos.',
      en: 'You write to a chatbot: “my name is Ana and I work in logistics.” It greets you by name, and you chat for a while about shipping.',
      pad: 0.4,
    },
    {
      id: 'seems',
      es: 'Luego preguntas: «¿cómo me llamo?». Y responde: «te llamas Ana». Parece que te recuerda, como una persona. ¿De verdad es así?',
      en: 'Then you ask: “what is my name?” And it answers: “your name is Ana.” It seems to remember you, the way a person would. Is that really so?',
      pad: 0.4,
    },
    // ── 2 · el modelo, con pesos fijos ──
    {
      id: 'model',
      es: 'Empecemos por lo que ya sabes. El modelo recibe un texto, su contexto, y calcula qué token sigue, como en la lección diecinueve. Así escribe, token a token.',
      en: 'Let’s start with what you already know. The model receives a text, its context, and works out which token comes next, as in lesson nineteen. That is how it writes, token by token.',
      pad: 0.3,
    },
    {
      id: 'frozen',
      es: 'Sus pesos, los números que aprendió al entrenar, quedaron fijos. Mientras conversas no cambia ninguno: el modelo no aprende de ti.',
      en: 'Its weights, the numbers it learned in training, are now fixed. While you chat, not one of them changes: the model does not learn from you.',
      note: { es: 'Pesos fijos: el modelo no aprende mientras conversas.', en: 'Fixed weights: the model does not learn while you chat.' },
      pad: 0.3,
    },
    {
      id: 'puzzle',
      es: 'Entonces, si dentro del modelo nada cambia, ¿dónde quedó tu nombre? ¿Cómo lo supo tres mensajes después?',
      en: 'So if nothing changes inside the model, where did your name go? How did it know it three messages later?',
      pad: 0.4,
    },
    // ── 3 · la aplicación reenvía todo ──
    {
      id: 'app',
      es: 'La clave está en una pieza intermedia: la aplicación, la página o app donde escribes. Ella guarda la conversación; el modelo no.',
      en: 'The key is a piece in between: the application, the web page or app where you type. It keeps the conversation; the model does not.',
      pad: 0.3,
    },
    {
      id: 'turn1',
      es: 'En el primer turno, la aplicación envía al modelo tu primer mensaje. El modelo responde, y la aplicación guarda los dos en su lista.',
      en: 'On the first turn, the app sends your first message to the model. The model replies, and the app saves both on its list.',
      pad: 0.4,
    },
    {
      id: 'turn2',
      es: 'En el segundo turno no envía solo tu mensaje nuevo. Envía la conversación entera, desde el principio, con tu mensaje nuevo al final.',
      en: 'On the second turn, it does not send just your new message. It sends the entire conversation, from the beginning, with your new message at the end.',
      pad: 0.4,
    },
    {
      id: 'turn3',
      es: 'Y así en cada turno. Cuando preguntas tu nombre, el modelo vuelve a leer «me llamo Ana» en el primer mensaje. Por eso lo sabe.',
      en: 'And so on, every turn. When you ask your name, the model reads “my name is Ana” again in the first message. That is how it knows.',
      pad: 0.4,
    },
    {
      id: 'stateless',
      es: 'A esto se le llama no tener estado, en inglés stateless: cada llamada al modelo empieza de cero. La memoria de la conversación vive en la aplicación.',
      en: 'This is called being stateless: every call to the model starts from scratch. The memory of the conversation lives in the app.',
      note: { es: 'Sin estado: cada llamada empieza de cero; la aplicación reenvía toda la conversación.', en: 'Stateless: every call starts from scratch; the app resends the whole conversation.' },
      pad: 0.3,
    },
    {
      id: 'demo-send',
      es: 'Míralo en acción. Con todo el historial, responde «te llamas Ana». Si la aplicación enviara solo la pregunta, el modelo no tendría de dónde sacarlo.',
      en: 'See it in action. With the whole history, it answers “your name is Ana.” If the app sent only the question, the model would have nowhere to get it from.',
      pad: 0.6,
    },
    {
      id: 'try-send',
      es: 'Si quieres, elige tú qué envía la aplicación y mira la respuesta. Las respuestas de esta escena son ilustrativas.',
      en: 'If you like, choose what the app sends and see the answer. The answers in this scene are illustrative.',
      gate: { id: 'send', prompt: { es: 'elige qué se envía y mira la respuesta.', en: 'choose what gets sent and see the answer.' } },
      pad: 0.4,
    },
    {
      id: 'not-exist',
      es: 'El modelo no olvidó tu nombre: nunca lo tuvo guardado. Lo que no está en el texto que recibe no existe para él.',
      en: 'The model did not forget your name: it never had it stored. Whatever is not in the text it receives does not exist for it.',
      note: { es: 'Lo que no está en el contexto no existe para el modelo.', en: 'What is not in the context does not exist for the model.' },
      pad: 0.4,
    },
    // ── 4 · el tren y la ventana ──
    {
      id: 'train',
      es: 'Ahora dibujemos lo que se envía como un tren. Cada vagón es un mensaje, y su largo es su número de tokens, las piezas de texto de la lección veinte.',
      en: 'Now let’s draw what gets sent as a train. Each car is a message, and its length is its number of tokens, the pieces of text from lesson twenty.',
      pad: 0.4,
    },
    {
      id: 'window',
      es: 'El modelo solo puede leer un tramo de largo fijo, medido en tokens. Ese tramo es su ventana de contexto: lo que cabe ahí es todo lo que ve.',
      en: 'The model can only read a stretch of fixed length, measured in tokens. That stretch is its context window: whatever fits inside is all it sees.',
      note: { es: 'Ventana de contexto: el máximo de tokens que el modelo lee de una vez.', en: 'Context window: the most tokens the model reads at once.' },
      pad: 0.4,
    },
    {
      id: 'ruler',
      es: 'Aquí la ventana es de cuatrocientos tokens, un tamaño de juguete. La regla de abajo los cuenta: este tren ocupa doscientos treinta.',
      en: 'Here the window holds four hundred tokens, a toy size. The ruler below counts them: this train takes up two hundred thirty.',
      pad: 0.4,
    },
    {
      id: 'system',
      es: 'Al frente suele ir un vagón que tú no ves: las instrucciones del sistema, en inglés system prompt. Las escribe quien hizo la aplicación: rol, tono y reglas.',
      en: 'At the front there is usually a car you never see: the system prompt, the instructions written by whoever built the app. Role, tone, and rules.',
      note: { es: 'Instrucciones del sistema (system prompt): reglas fijas al frente del contexto, que tú no ves.', en: 'System prompt: fixed instructions at the front of the context that you don’t see.' },
      pad: 0.4,
    },
    {
      id: 'system-every',
      es: 'Ese vagón viaja en cada turno y ocupa lugar como cualquier mensaje: aquí, sesenta tokens. El tren ya suma doscientos noventa.',
      en: 'That car rides along on every turn and takes up room like any message: here, sixty tokens. The train now adds up to two hundred ninety.',
      pad: 0.3,
    },
    {
      id: 'answer-space',
      es: 'La respuesta también ocupa lugar: el modelo la escribe dentro de la misma ventana, token a token. Instrucciones, historial y respuesta comparten el espacio.',
      en: 'The answer takes up room too: the model writes it inside the same window, token by token. Instructions, history, and answer share the space.',
      pad: 0.4,
    },
    // ── 5 · cuando ya no cabe ──
    {
      id: 'fill',
      es: 'Sigamos conversando. Cada mensaje nuevo engancha otro vagón al final, y el tren llega al borde: cuatrocientos de cuatrocientos.',
      en: 'Let’s keep chatting. Each new message hooks another car onto the end, and the train reaches the edge: four hundred out of four hundred.',
      pad: 0.5,
    },
    {
      id: 'overflow',
      es: '¿Y si llega otro mensaje y ya no cabe? Algunos chats sueltan lo más viejo: lo primero que entró es lo primero que sale. Las instrucciones se quedan.',
      en: 'What if another message arrives and there is no room? Some chat apps drop the oldest part: first in, first out. The instructions stay.',
      pad: 0.6,
    },
    {
      id: 'name-lost',
      es: 'Y el mensaje nuevo era «¿cómo me llamo?». Pero el vagón con tu nombre ya se desenganchó: el modelo no puede saberlo.',
      en: 'And the new message was “what is my name?” But the car with your name has already come unhooked: the model cannot know it.',
      pad: 0.5,
    },
    {
      id: 'try-more',
      es: 'Si quieres, envía tú más mensajes y mira qué vagones se sueltan. La aplicación aún los guarda, pero ya no se los envía al modelo.',
      en: 'If you like, send more messages yourself and watch which cars come loose. The app still keeps them, but no longer sends them to the model.',
      gate: { id: 'more', prompt: { es: 'envía otro mensaje y mira qué vagón se suelta.', en: 'send another message and watch which car comes loose.' } },
      pad: 0.4,
    },
    // ── 6 · por qué hay un límite, y cuánto creció ──
    {
      id: 'why-limit',
      es: '¿Por qué hay un límite? Recuerda la lección veintidós: cada lugar del texto lleva su lista de posición. GPT-3 aprendió listas para dos mil cuarenta y ocho lugares, y no tiene más.',
      en: 'Why is there a limit? Remember lesson twenty-two: each place in the text carries its position list. GPT-3 learned lists for two thousand forty-eight places, and has no more.',
      pad: 0.4,
    },
    {
      id: 'size-gpt3',
      es: 'Aun así, las ventanas crecieron mucho. En dos mil veinte, la de GPT-3 era de dos mil cuarenta y ocho tokens: unas mil quinientas palabras en inglés.',
      en: 'Even so, windows have grown a lot. In twenty twenty, GPT-3’s was two thousand forty-eight tokens: about fifteen hundred words of English.',
      pad: 0.4,
    },
    {
      id: 'size-100k',
      es: 'En dos mil veintitrés, Anthropic llevó la de Claude a cien mil tokens, unas setenta y cinco mil palabras. En su anuncio le cupo una novela entera: El gran Gatsby.',
      en: 'In twenty twenty-three, Anthropic took Claude’s to one hundred thousand tokens, about seventy-five thousand words. In its announcement, a whole novel fit: The Great Gatsby.',
      pad: 0.6,
    },
    {
      id: 'size-1m',
      es: 'En dos mil veinticuatro, Llama 3.1 llegó a ciento veintiocho mil, y Gemini 1.5 pasó del millón. A esta escala, la ventana de GPT-3 casi no se ve.',
      en: 'In twenty twenty-four, Llama 3.1 reached one hundred twenty-eight thousand, and Gemini 1.5 passed a million. At this scale, GPT-3’s window is barely visible.',
      pad: 0.6,
    },
    // ── 7 · el costo crece con cada turno ──
    {
      id: 'cost-setup',
      es: 'Pero llenar una ventana grande tiene dos problemas. El primero es el costo. Supón que cada turno agrega cien tokens, entre tu mensaje y la respuesta.',
      en: 'But filling a big window has two problems. The first is cost. Suppose each turn adds one hundred tokens, counting your message and the answer.',
      pad: 0.3,
    },
    {
      id: 'cost-bars',
      es: 'En el turno uno, el modelo procesa cien tokens: la primera barra. En el dos, doscientos: los cien de antes otra vez, más los nuevos. En el tres, trescientos.',
      en: 'On turn one, the model processes one hundred tokens: the first bar. On turn two, two hundred: the earlier hundred again, plus the new ones. On turn three, three hundred.',
      pad: 0.5,
    },
    {
      id: 'cost-total',
      es: 'Tras diez turnos, la conversación tiene mil tokens de texto. Pero el modelo procesó cinco mil quinientos: la suma de todas las barras.',
      en: 'After ten turns, the conversation holds one thousand tokens of text. But the model processed five thousand five hundred: the sum of all the bars.',
      pad: 0.5,
    },
    {
      id: 'cost-grow',
      es: 'Y la diferencia crece rápido. Con veinte turnos son dos mil tokens de texto, pero veintiún mil procesados: más de diez veces.',
      en: 'And the gap grows fast. With twenty turns, there are two thousand tokens of text, but twenty-one thousand processed: more than ten times as many.',
      pad: 0.6,
    },
    {
      id: 'cost-pay',
      es: 'Y como viste en la lección veintiséis, se paga por cada token que entra. Cada turno cuesta más que el anterior, aunque tus mensajes sean igual de cortos.',
      en: 'And as you saw in lesson twenty-six, you pay for every token that goes in. Each turn costs more than the one before, even if your messages are just as short.',
      note: { es: 'Cada turno reenvía todo: cada uno cuesta más que el anterior.', en: 'Every turn resends everything: each one costs more than the last.' },
      pad: 0.3,
    },
    // ── 8 · perdido en el medio ──
    {
      id: 'litm-setup',
      es: 'El segundo problema es leer bien. En dos mil veintitrés, un estudio dio a varios modelos una pregunta y veinte documentos. Solo uno tenía la respuesta.',
      en: 'The second problem is reading well. In twenty twenty-three, a study gave several models a question and twenty documents. Only one held the answer.',
      pad: 0.4,
    },
    {
      id: 'litm-move',
      es: 'Luego movieron ese documento: lo pusieron primero, quinto, décimo, decimoquinto y vigésimo. En cada lugar midieron qué porcentaje de preguntas acertaba.',
      en: 'Then they moved that document: they put it first, fifth, tenth, fifteenth, and twentieth. At each place they measured what percentage of questions it got right.',
      pad: 0.6,
    },
    {
      id: 'litm-x',
      es: 'Veámoslo en una gráfica. La línea horizontal es el lugar del documento con la respuesta: el primero a la izquierda, el vigésimo a la derecha.',
      en: 'Let’s see it on a chart. The horizontal line is the place of the document with the answer: first on the left, twentieth on the right.',
      pad: 0.3,
    },
    {
      id: 'litm-y',
      es: 'La línea vertical es el porcentaje de preguntas acertadas: más arriba, más aciertos. Los datos son de GPT-3.5-Turbo, un modelo de OpenAI de esa época.',
      en: 'The vertical line is the percentage of questions answered correctly: higher up, more correct. The data are for GPT-3.5-Turbo, an OpenAI model from that time.',
      pad: 0.3,
    },
    {
      id: 'litm-first',
      es: 'Con la respuesta en el primer documento, acertó el setenta y seis por ciento de las preguntas.',
      en: 'With the answer in the first document, it got seventy-six percent of the questions right.',
      pad: 0.5,
    },
    {
      id: 'litm-middle',
      es: 'Con la respuesta en el décimo, a la mitad de la fila, bajó a cincuenta y cuatro por ciento.',
      en: 'With the answer in the tenth, halfway down the row, it fell to fifty-four percent.',
      pad: 0.6,
    },
    {
      id: 'litm-last',
      es: 'Y con la respuesta en el último, el vigésimo, volvió a subir: sesenta y tres por ciento. El quinto y el decimoquinto también quedan abajo.',
      en: 'And with the answer in the last one, the twentieth, it rose again: sixty-three percent. The fifth and the fifteenth stay low as well.',
      pad: 0.6,
    },
    {
      id: 'litm-name',
      es: 'La curva tiene forma de U: el modelo aprovecha mejor lo que está al principio o al final, y peor lo del medio. Se le llama «perdido en el medio».',
      en: 'The curve is U-shaped: the model makes better use of what is at the start or the end, and worse of what is in the middle. This is called “lost in the middle.”',
      note: { es: 'Perdido en el medio: lo que queda a la mitad de un contexto largo se aprovecha peor.', en: 'Lost in the middle: what sits halfway through a long context is used less well.' },
      pad: 0.4,
    },
    {
      id: 'litm-closed',
      es: 'Y algo sorprendente: sin ningún documento, solo con lo que aprendió al entrenar, acertaba el cincuenta y seis por ciento. Con la respuesta en el medio, le fue peor.',
      en: 'And something surprising: with no documents at all, only with what it learned in training, it got fifty-six percent right. With the answer in the middle, it did worse.',
      pad: 0.5,
    },
    {
      id: 'try-litm',
      es: 'Si quieres, cambia tú de lugar el documento con la respuesta y mira cuánto acierta en cada uno.',
      en: 'If you like, move the document with the answer yourself and see how much it gets right at each place.',
      gate: { id: 'litm', prompt: { es: 'cambia de lugar el documento con la respuesta.', en: 'move the document with the answer.' } },
      pad: 0.4,
    },
    {
      id: 'litm-advice',
      es: 'Son modelos de dos mil veintitrés y una sola prueba; cada modelo tiene su propia curva. La lección práctica: lo importante, al principio o al final, y sin relleno.',
      en: 'These are twenty twenty-three models and a single test; each model has its own curve. The practical lesson: put what matters at the start or the end, and skip the filler.',
      pad: 0.3,
    },
    // ── 9 · las «memorias» de los asistentes ──
    {
      id: 'memory-q',
      es: 'Entonces, ¿qué son las funciones de «memoria» que ofrecen algunos asistentes? No es el modelo recordando: es texto guardado fuera de él, que se vuelve a enviar.',
      en: 'So what are the “memory” features some assistants offer? It is not the model remembering: it is text stored outside it that gets sent again.',
      note: { es: 'Memoria de un asistente: texto guardado fuera del modelo y vuelto a enviar en el contexto.', en: 'An assistant’s memory: text stored outside the model and sent again in the context.' },
      pad: 0.4,
    },
    {
      id: 'memory-summary',
      es: 'Una forma es el resumen: cuando el tren se acerca al borde, los vagones viejos se cambian por uno corto que los resume. Cabe más, pero se pierden detalles.',
      en: 'One way is a summary: when the train nears the edge, the old cars are swapped for one short car that sums them up. More fits, but details get lost.',
      pad: 0.6,
    },
    {
      id: 'memory-notes',
      es: 'Otra es guardar notas aparte, como «se llama Ana y trabaja en logística», y engancharlas al tren de cada conversación nueva. Así el modelo vuelve a leerlas.',
      en: 'Another is to keep notes on the side, like “her name is Ana and she works in logistics,” and hook them onto the train of each new conversation. So the model reads them again.',
      pad: 0.6,
    },
    {
      id: 'privacy',
      es: 'Y recuerda: todo lo que va en el tren, documentos y notas incluidos, se envía al proveedor del modelo en cada turno. Piensa qué datos compartes.',
      en: 'And remember: everything on the train, documents and notes included, is sent to the model’s provider on every turn. Think about what data you share.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo no recuerda, lee. En cada turno recibe un tren de tokens que cabe en su ventana, y solo eso existe para él.',
      en: 'In short: the model does not remember, it reads. On every turn it receives a train of tokens that fits in its window, and only that exists for it.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Pero ¿y si lo que necesita saber son tus documentos, miles de páginas que no caben? ¿Cómo darle conocimiento propio sin reentrenarlo? Es la siguiente lección: RAG.',
      en: 'But what if what it needs to know is your documents, thousands of pages that don’t fit? How do you give it your own knowledge without retraining it? That is the next lesson: RAG.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'El modelo no tiene estado: en cada turno la aplicación le reenvía toda la conversación. Sus pesos no cambian mientras conversas.',
      'La ventana de contexto es el máximo de tokens que el modelo lee de una vez. Instrucciones del sistema, historial, tu mensaje y la respuesta comparten ese espacio.',
      'Lo que no está en la ventana no existe para el modelo. Cuando ya no cabe, la aplicación decide: algunos chats sueltan lo más viejo; otros resumen o rechazan el mensaje.',
      'Reenviar todo hace que cada turno cueste más que el anterior: diez turnos de cien tokens procesan cinco mil quinientos, no mil.',
      'Que algo quepa no garantiza que se use bien: lo del medio se aprovecha peor. Las funciones de memoria son texto guardado fuera del modelo y vuelto a enviar.',
    ],
    en: [
      'The model is stateless: on every turn the app resends it the whole conversation. Its weights do not change while you chat.',
      'The context window is the most tokens the model reads at once. The system prompt, the history, your message, and the answer share that space.',
      'Whatever is not in the window does not exist for the model. When it no longer fits, the app decides: some chats drop the oldest part; others summarize or reject the message.',
      'Resending everything makes each turn cost more than the last: ten turns of one hundred tokens process five thousand five hundred, not one thousand.',
      'Fitting does not guarantee being used well: what sits in the middle is used less well. Memory features are text stored outside the model and sent again.',
    ],
  },

  misconception: {
    wrong: {
      es: 'El chatbot me conoce y aprende de mí conforme conversamos.',
      en: 'The chatbot knows me and learns from me as we talk.',
    },
    right: {
      es: 'En cada turno recibe otra vez la conversación, como texto. Sus pesos no cambian: si ese texto no se reenvía o no cabe en la ventana, para el modelo no existe.',
      en: 'On every turn it receives the conversation again, as text. Its weights do not change: if that text is not resent or does not fit in the window, it does not exist for the model.',
    },
  },

  deeper: {
    es: `## Sin estado: lo que realmente se envía

En una API de chat, la llamada de cada turno lleva la lista completa de mensajes; el modelo devuelve solo el mensaje nuevo, y la aplicación lo agrega a su lista antes del turno siguiente:

\`\`\`json
{
  "system": "Eres un asistente de logística. ...",
  "messages": [
    {"role": "user", "content": "Me llamo Ana y trabajo en logística."},
    {"role": "assistant", "content": "Mucho gusto, Ana. ¿En qué te ayudo?"},
    {"role": "user", "content": "¿Cómo me llamo?"}
  ]
}
\`\`\`

La documentación de Anthropic lo dice así: «la API de mensajes es sin estado: siempre se envía a la API el historial completo de la conversación» (en el original, *stateless*). Las instrucciones del sistema van en un campo aparte, \`system\`. Algunas plataformas guardan el historial en sus servidores y lo reinsertan por ti: el modelo sigue sin estado; solo cambia quién guarda el historial.

## Qué cuenta en la ventana

Según esa misma documentación, la ventana es «todo el texto al que el modelo puede referirse al generar una respuesta, incluida la propia respuesta»: las instrucciones del sistema, cada mensaje (con documentos e imágenes), las definiciones de herramientas y lo que el modelo escribe en el turno. Si la entrada sola ya excede la ventana, la API devuelve un error («prompt is too long»); qué hacer entonces lo decide la aplicación. La documentación señala que interfaces de chat como claude.ai pueden manejar la ventana como una cola, «lo primero que entra es lo primero que sale», o resumir lo viejo («compactación»).

¿Por qué hay un límite? GPT-1 usó «posiciones aprendidas» en lugar de las ondas del artículo original (lección 22), y GPT-3 conserva esa arquitectura con $n_{\\text{ctx}}=2048$ (Brown et al., 2020): aprendió una lista por lugar y no tiene listas para más. Los modelos actuales codifican la posición de otra forma, pero el largo útil sigue dependiendo de con qué largos se entrenaron, y servir contextos largos cuesta memoria: la caché KV crece con cada token (lección 26). En Llama 3 de 8 mil millones (32 bloques, 8 cabezas de clave-valor de 128 números, 2 bytes por número) son $2\\cdot 32\\cdot 8\\cdot 128\\cdot 2 = 131\\,072$ bytes por token: con 128 000 tokens, casi 17 GB.

| Modelo | Año | Ventana (tokens) | Fuente |
|---|---|---|---|
| GPT-1 | 2018 | 512 | Radford et al. |
| GPT-2 | 2019 | 1 024 | Radford et al. |
| GPT-3 | 2020 | 2 048 | Brown et al. |
| Claude | 2023 | 100 000 (≈ 75 000 palabras) | Anthropic |
| Llama 3.1 | 2024 | 128 000 | Llama Team |
| Gemini 1.5 | 2024 | más de 1 millón (hasta 10 millones en sus pruebas) | Gemini Team |

## Pesos fijos, ejemplos en el contexto

El modelo puede seguir un patrón que le muestras en el contexto (aprendizaje en contexto): Brown et al. (2020) lo evalúan «sin actualizaciones de gradiente ni ajuste fino». Es temporal: cuando esos ejemplos salen de la ventana, el comportamiento desaparece. Cambiar los pesos exige entrenar (lecciones 4, 8 y 27). El informe técnico de GPT-4 lo resume: tiene «una ventana de contexto limitada y no aprende de la experiencia».

## Cuánto cuesta reenviar la conversación

Sea $s$ el tamaño de las instrucciones del sistema y $m$ los tokens que agrega cada turno (tu mensaje $u$ más la respuesta $a$). En el turno $k$ el modelo procesa $s + k\\,m$ tokens (lee todo lo anterior y escribe lo nuevo); en $n$ turnos,

$$\\sum_{k=1}^{n} (s + k\\,m) = n\\,s + m\\,\\frac{n(n+1)}{2}.$$

Con $s=0$ y $m=100$: 5 500 tokens en 10 turnos y 21 000 en 20, frente a 1 000 y 2 000 de texto. El término $m\\,n^2/2$ domina: el total crece con el cuadrado de los turnos. Las instrucciones también se pagan en cada turno: con $s = 2\\,000$, $u = 50$, $a = 150$ y 20 turnos, la entrada suma $\\sum_k \\big(s + (k-1)m + u\\big) = 79\\,000$ tokens, y la mitad son las instrucciones repetidas.

Por eso existe la **caché del prefijo**: el proveedor guarda el trabajo hecho sobre el inicio repetido (la caché KV de la lección 26) y cobra menos por releerlo. En la documentación de Anthropic, leer de la caché cuesta $0.1\\times$ el precio base de entrada (menos en algunos modelos) y escribir en ella, $1.25\\times$ (caché de 5 minutos). Si acierta en cada turno, el ejemplo anterior baja a unos 14 628 tokens equivalentes, el 19 %. La caché cambia lo que pagas, no lo que ocupa la ventana.

## La posición importa: «Perdido en el medio»

Liu et al. (2023) dieron a cada modelo 20 documentos (unos 4 000 tokens), uno solo con la respuesta, y cambiaron su lugar. Acierto (%), valores de la tabla 6 (apéndice G); las dos últimas columnas son de la tabla 1:

| Modelo | 1.º | 5.º | 10.º | 15.º | 20.º | Sin documentos | Solo el correcto |
|---|---|---|---|---|---|---|---|
| GPT-3.5-Turbo | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 | 56.1 | 88.3 |
| Claude-1.3 | 59.9 | 55.9 | 56.8 | 57.2 | 60.1 | 48.3 | 76.1 |
| LongChat-13B (16K) | 68.6 | 57.4 | 55.3 | 52.5 | 55.0 | 35.0 | 83.4 |
| MPT-30B-Instruct | 53.7 | 51.8 | 52.2 | 52.7 | 56.3 | 31.5 | 81.9 |

Son modelos de 2023 y una sola tarea: la forma exacta cambia con el modelo y con la prueba, y los autores no encuentran que una ventana mayor, por sí sola, use mejor el contexto. RULER (Hsieh et al., 2024) amplía el hallazgo: entre los modelos que declaraban 32 000 tokens o más, solo la mitad mantenía un rendimiento satisfactorio a esa longitud. La documentación de Anthropic lo llama *context rot*: al crecer el número de tokens, la exactitud y el recuerdo se degradan.

## Memoria fuera del modelo

Las funciones de «memoria» guardan texto fuera de la ventana y lo vuelven a meter: un resumen que reemplaza los turnos viejos (la compactación de Anthropic), o archivos de notas que el modelo lee y escribe entre conversaciones (la herramienta de memoria de Anthropic; MemGPT, de Packer et al., 2023, se inspira en la jerarquía de memoria de un sistema operativo). Lo guardado puede quedar equivocado u obsoleto, y es información que sale de tu organización.

## En código

\`\`\`python
def recortar(mensajes, limite, contar):
    """Deja las instrucciones y los turnos más recientes que quepan: lo primero que entró sale primero."""
    sistema, resto = mensajes[0], mensajes[1:]
    usado, dentro = contar(sistema), []
    for m in reversed(resto):                       # de lo más nuevo a lo más viejo
        if usado + contar(m) > limite:
            break
        dentro.append(m)
        usado += contar(m)
    return [sistema] + dentro[::-1]

def procesados(turnos, s, m):
    """Tokens que procesa el modelo: en el turno k, las instrucciones s más k turnos de m tokens."""
    return sum(s + k * m for k in range(1, turnos + 1))

def entrada_con_cache(turnos, s, u, a, lectura=0.1, escritura=1.25):
    """Tokens de entrada equivalentes con caché del prefijo (supuesto: acierta en cada turno)."""
    m = u + a
    total = escritura * (s + u)                     # turno 1: se escribe todo
    for k in range(2, turnos + 1):
        prefijo = s + (k - 2) * m + u               # lo que se envió en el turno anterior
        total += lectura * prefijo + escritura * m  # se lee el prefijo y se escribe lo nuevo
    return total

contar = lambda m: len(m["texto"].split())         # aproximación: una palabra ≈ un token
historial = [
    {"rol": "sistema",   "texto": "Eres un asistente de logística."},
    {"rol": "usuario",   "texto": "Me llamo Ana y trabajo en logística."},
    {"rol": "asistente", "texto": "Mucho gusto, Ana. ¿En qué te ayudo?"},
    {"rol": "usuario",   "texto": "Dame una idea para ahorrar en envíos."},
    {"rol": "asistente", "texto": "Junta pedidos pequeños en un solo camión."},
    {"rol": "usuario",   "texto": "¿Cómo me llamo?"},
]
dentro = recortar(historial, limite=25, contar=contar)
print([m["rol"] for m in dentro])
print("¿Sigue el nombre en la ventana?", any("Ana" in m["texto"] for m in dentro))
print(procesados(10, s=0, m=100), procesados(20, s=0, m=100))
sin = sum(2000 + (k - 1) * 200 + 50 for k in range(1, 21))
con = entrada_con_cache(20, s=2000, u=50, a=150)
print(sin, round(con), f"{con / sin:.0%}")
# ['sistema', 'usuario', 'asistente', 'usuario']
# ¿Sigue el nombre en la ventana? False
# 5500 21000
# 79000 14628 19%
\`\`\`

## Lo que viene

En la lección 31 (RAG) el almacén externo se vuelve un sistema completo: buscar los fragmentos relevantes de tus documentos y ponerlos en la ventana. En la 32, los agentes usan esa misma idea, con memoria en archivos, para trabajos que duran más que una ventana.`,
    en: `## Stateless: what is really sent

In a chat API, the call for each turn carries the full list of messages; the model returns only the new message, and the app appends it to its list before the next turn:

\`\`\`json
{
  "system": "You are a logistics assistant. ...",
  "messages": [
    {"role": "user", "content": "My name is Ana and I work in logistics."},
    {"role": "assistant", "content": "Nice to meet you, Ana. How can I help?"},
    {"role": "user", "content": "What is my name?"}
  ]
}
\`\`\`

Anthropic's documentation puts it this way: “The Messages API is stateless, which means that you always send the full conversational history to the API.” The system instructions go in a separate field, \`system\`. Some platforms store the history on their servers and reinsert it for you: the model is still stateless; only who stores the history changes.

## What counts in the window

Per that same documentation, the window is “all the text a language model can reference when generating a response, including the response itself”: the system prompt, every message (with documents and images), tool definitions, and what the model writes on the turn. If the input alone already exceeds the window, the API returns an error (“prompt is too long”); what to do then is up to the app. The documentation notes that chat interfaces such as claude.ai can manage the window on a rolling “first in, first out” basis, or summarize the old part (“compaction”).

Why is there a limit? GPT-1 used “learned position embeddings” instead of the original paper's waves (lesson 22), and GPT-3 keeps that architecture with $n_{\\text{ctx}}=2048$ (Brown et al., 2020): it learned one list per place and has no lists for more. Current models encode position differently, but the usable length still depends on the lengths they were trained on, and serving long contexts costs memory: the KV cache grows with every token (lesson 26). In Llama 3 8B (32 blocks, 8 key-value heads of 128 numbers, 2 bytes per number) that is $2\\cdot 32\\cdot 8\\cdot 128\\cdot 2 = 131{,}072$ bytes per token: at 128,000 tokens, almost 17 GB.

| Model | Year | Window (tokens) | Source |
|---|---|---|---|
| GPT-1 | 2018 | 512 | Radford et al. |
| GPT-2 | 2019 | 1,024 | Radford et al. |
| GPT-3 | 2020 | 2,048 | Brown et al. |
| Claude | 2023 | 100,000 (≈ 75,000 words) | Anthropic |
| Llama 3.1 | 2024 | 128,000 | Llama Team |
| Gemini 1.5 | 2024 | over 1 million (up to 10 million in its tests) | Gemini Team |

## Fixed weights, examples in the context

The model can follow a pattern you show it inside the context (in-context learning): Brown et al. (2020) evaluate it “without any gradient updates or fine-tuning.” It is temporary: when those examples leave the window, the behavior disappears. Changing the weights takes training (lessons 4, 8, and 27). The GPT-4 technical report sums it up: it “has a limited context window, and does not learn from experience.”

## What resending the conversation costs

Let $s$ be the size of the system prompt and $m$ the tokens each turn adds (your message $u$ plus the answer $a$). On turn $k$ the model processes $s + k\\,m$ tokens (it reads everything before and writes what is new); over $n$ turns,

$$\\sum_{k=1}^{n} (s + k\\,m) = n\\,s + m\\,\\frac{n(n+1)}{2}.$$

With $s=0$ and $m=100$: 5,500 tokens in 10 turns and 21,000 in 20, against 1,000 and 2,000 of text. The $m\\,n^2/2$ term dominates: the total grows with the square of the turns. The instructions are paid for on every turn too: with $s = 2{,}000$, $u = 50$, $a = 150$, and 20 turns, the input adds up to $\\sum_k \\big(s + (k-1)m + u\\big) = 79{,}000$ tokens, and half of them are the repeated instructions.

That is why **prefix caching** exists: the provider keeps the work already done on the repeated beginning (the KV cache from lesson 26) and charges less to reread it. In Anthropic's documentation, reading from the cache costs $0.1\\times$ the base input price (less on some models) and writing to it costs $1.25\\times$ (5-minute cache). If it hits on every turn, the previous example drops to about 14,628 equivalent tokens, 19%. Caching changes what you pay, not how much of the window is used.

## Position matters: “Lost in the Middle”

Liu et al. (2023) gave each model 20 documents (about 4,000 tokens), only one with the answer, and changed its place. Accuracy (%), values from table 6 (appendix G); the last two columns come from table 1:

| Model | 1st | 5th | 10th | 15th | 20th | No documents | Only the right one |
|---|---|---|---|---|---|---|---|
| GPT-3.5-Turbo | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 | 56.1 | 88.3 |
| Claude-1.3 | 59.9 | 55.9 | 56.8 | 57.2 | 60.1 | 48.3 | 76.1 |
| LongChat-13B (16K) | 68.6 | 57.4 | 55.3 | 52.5 | 55.0 | 35.0 | 83.4 |
| MPT-30B-Instruct | 53.7 | 51.8 | 52.2 | 52.7 | 56.3 | 31.5 | 81.9 |

These are 2023 models and a single task: the exact shape changes with the model and the test, and the authors find that a larger window, by itself, does not use the context better. RULER (Hsieh et al., 2024) extends the finding: among models claiming 32,000 tokens or more, only half kept satisfactory performance at that length. Anthropic's documentation calls it *context rot*: as the number of tokens grows, accuracy and recall degrade.

## Memory outside the model

“Memory” features keep text outside the window and put it back in: a summary that replaces the old turns (Anthropic's compaction), or note files the model reads and writes across conversations (Anthropic's memory tool; MemGPT, by Packer et al., 2023, draws on an operating system's memory hierarchy). What is stored can become wrong or outdated, and it is information that leaves your organization.

## In code

\`\`\`python
def trim(messages, limit, count):
    """Keep the instructions and the most recent turns that fit: first in, first out."""
    system, rest = messages[0], messages[1:]
    used, inside = count(system), []
    for m in reversed(rest):                        # newest to oldest
        if used + count(m) > limit:
            break
        inside.append(m)
        used += count(m)
    return [system] + inside[::-1]

def processed(turns, s, m):
    """Tokens the model processes: on turn k, the instructions s plus k turns of m tokens."""
    return sum(s + k * m for k in range(1, turns + 1))

def input_with_cache(turns, s, u, a, read=0.1, write=1.25):
    """Equivalent input tokens with prefix caching (assumed: it hits on every turn)."""
    m = u + a
    total = write * (s + u)                         # turn 1: everything is written
    for k in range(2, turns + 1):
        prefix = s + (k - 2) * m + u                # what was sent on the previous turn
        total += read * prefix + write * m          # read the prefix, write what is new
    return total

count = lambda m: len(m["text"].split())           # approximation: one word ≈ one token
history = [
    {"role": "system",    "text": "You are a logistics assistant."},
    {"role": "user",      "text": "My name is Ana and I work in logistics."},
    {"role": "assistant", "text": "Nice to meet you, Ana. How can I help?"},
    {"role": "user",      "text": "Give me an idea to save on shipping."},
    {"role": "assistant", "text": "Combine small orders into one truck."},
    {"role": "user",      "text": "What is my name?"},
]
inside = trim(history, limit=25, count=count)
print([m["role"] for m in inside])
print("Is the name still in the window?", any("Ana" in m["text"] for m in inside))
print(processed(10, s=0, m=100), processed(20, s=0, m=100))
without = sum(2000 + (k - 1) * 200 + 50 for k in range(1, 21))
cached = input_with_cache(20, s=2000, u=50, a=150)
print(without, round(cached), f"{cached / without:.0%}")
# ['system', 'user', 'assistant', 'user']
# Is the name still in the window? False
# 5500 21000
# 79000 14628 19%
\`\`\`

## What comes next

In lesson 31 (RAG) the external store becomes a full system: find the relevant fragments of your documents and put them in the window. In lesson 32, agents use that same idea, with memory in files, for jobs that last longer than one window.`,
  },

  lens: {
    es: [
      'Lo que no está en el contexto no existe para el modelo: si necesita una política, un contrato o un dato de cliente, hay que ponérselo en la ventana en cada consulta. Pregunta qué se envía exactamente en cada llamada: instrucciones, historial y documentos.',
      'El costo crece con cada turno porque se reenvía todo, incluidas las instrucciones del sistema. Mide el costo por conversación, no por mensaje; acorta o resume las conversaciones largas, y pregunta si hay caché del prefijo y cuánto descuenta.',
      'La ventana anunciada no es la ventana útil: prueba con tus documentos y con el dato clave en distintos lugares. Pon lo importante al principio o al final, y no rellenes: más contexto puede rendir peor y casi siempre cuesta más.',
      'Privacidad: todo lo que se pega se envía al proveedor en cada turno, y las funciones de memoria guardan notas sobre personas. Revisa cuánto tiempo se conserva, si se usa para entrenar y cómo ver, borrar o apagar esa memoria.',
    ],
    en: [
      'What is not in the context does not exist for the model: if it needs a policy, a contract, or a customer fact, it has to be put in the window on every query. Ask what exactly is sent on each call: instructions, history, and documents.',
      'Cost grows with every turn because everything is resent, system prompt included. Measure cost per conversation, not per message; shorten or summarize long conversations, and ask whether prefix caching exists and how much it discounts.',
      'The advertised window is not the useful window: test with your own documents and with the key fact in different places. Put what matters at the start or the end, and skip the filler: more context can perform worse and almost always costs more.',
      'Privacy: everything pasted is sent to the provider on every turn, and memory features store notes about people. Check how long it is kept, whether it is used for training, and how to view, delete, or turn off that memory.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Un chatbot responde «te llamas Ana» tres turnos después de que se lo dijiste, aunque el modelo no guarda nada entre llamadas. ¿Por qué puede hacerlo?', en: 'A chatbot answers “your name is Ana” three turns after you told it, even though the model stores nothing between calls. Why can it do that?' },
      options: [
        { es: 'Porque el modelo ajusta sus pesos con cada mensaje que recibe.', en: 'Because the model adjusts its weights with every message it receives.' },
        { es: 'Porque guarda tu nombre en una memoria interna entre una llamada y otra.', en: 'Because it keeps your name in an internal memory between calls.' },
        { es: 'Porque la aplicación le reenvía toda la conversación, y el nombre viaja dentro del texto.', en: 'Because the app resends it the whole conversation, and the name travels inside the text.' },
        { es: 'Porque los modelos memorizan a cada persona durante el entrenamiento.', en: 'Because models memorize each person during training.' },
      ],
      answer: 2,
      why: { es: 'El modelo no tiene estado: en cada turno recibe toda la conversación como texto, y el nombre está en el primer mensaje. Sus pesos no cambian mientras conversas.', en: 'The model is stateless: on every turn it receives the whole conversation as text, and the name is in the first message. Its weights do not change while you chat.' },
    },
    {
      kind: 'concept',
      q: { es: 'En un contexto largo con muchos documentos, ¿dónde suele aprovechar mejor un modelo el documento que tiene la respuesta?', en: 'In a long context with many documents, where does a model tend to make the best use of the document that holds the answer?' },
      options: [
        { es: 'En cualquier lugar por igual, porque lee todo el contexto a la vez.', en: 'Anywhere equally, because it reads the whole context at once.' },
        { es: 'En el medio, porque ahí está la mayor parte del texto.', en: 'In the middle, because that is where most of the text is.' },
        { es: 'Al principio o al final, y peor en el medio.', en: 'At the start or the end, and worse in the middle.' },
        { es: 'Solo dentro de las instrucciones del sistema.', en: 'Only inside the system prompt.' },
      ],
      answer: 2,
      why: { es: 'Liu et al. (2023) midieron una curva en forma de U: con GPT-3.5-Turbo, 76 % con la respuesta en el primer documento, 54 % en el décimo y 63 % en el vigésimo. En el medio le fue peor que sin documentos (56 %).', en: 'Liu et al. (2023) measured a U-shaped curve: with GPT-3.5-Turbo, 76% with the answer in the first document, 54% in the tenth, and 63% in the twentieth. In the middle it did worse than with no documents (56%).' },
    },
    {
      kind: 'calc',
      q: { es: 'Cada turno de una conversación agrega 200 tokens, y en cada turno el modelo procesa todo lo anterior otra vez: 200 en el primero, 400 en el segundo, y así. ¿Cuántos tokens procesa en total en 5 turnos?', en: 'Each turn of a conversation adds 200 tokens, and on every turn the model processes everything before it again: 200 on the first, 400 on the second, and so on. How many tokens does it process in total over 5 turns?' },
      options: [
        { es: '1 000', en: '1,000' },
        { es: '2 000', en: '2,000' },
        { es: '5 000', en: '5,000' },
        { es: '3 000', en: '3,000' },
      ],
      answer: 3,
      why: { es: '200 + 400 + 600 + 800 + 1 000 = 3 000. El texto de la conversación son solo 1 000 tokens (5 × 200): reenviarlo todo en cada turno triplica lo que se procesa, y la diferencia crece con más turnos.', en: '200 + 400 + 600 + 800 + 1,000 = 3,000. The conversation text is only 1,000 tokens (5 × 200): resending it all on every turn triples what is processed, and the gap grows with more turns.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu equipo pega un contrato largo al inicio de un chat y conversa sobre él durante horas. Al final, el asistente responde como si no conociera una cláusula clave. ¿Qué es lo más razonable?', en: 'Your team pastes a long contract at the start of a chat and discusses it for hours. In the end, the assistant answers as if it did not know a key clause. What is the most reasonable response?' },
      options: [
        { es: 'Suponer que el modelo «olvidó» porque aprendió cosas nuevas durante la conversación, y reentrenarlo.', en: 'Assume the model “forgot” because it learned new things during the conversation, and retrain it.' },
        { es: 'Suponer que el contrato salió de la ventana o quedó perdido en el medio: volver a poner la cláusula cerca de la pregunta, o empezar una conversación nueva.', en: 'Assume the contract left the window or got lost in the middle: put the clause back near the question, or start a new conversation.' },
        { es: 'Pegar el contrato varias veces más en la misma conversación, para que lo recuerde mejor.', en: 'Paste the contract several more times into the same conversation so it remembers it better.' },
        { es: 'Concluir que el modelo nunca puede leer contratos.', en: 'Conclude that the model can never read contracts.' },
      ],
      answer: 1,
      why: { es: 'Sus pesos no cambian al conversar. Si el historial creció, el contrato pudo soltarse de la ventana, o quedar lejos de la pregunta, en el medio, donde se aprovecha peor. Pegarlo muchas veces llena la ventana y encarece cada turno.', en: 'Its weights do not change while you chat. If the history grew, the contract may have dropped out of the window, or sit far from the question, in the middle, where it is used less well. Pasting it many times fills the window and makes every turn more expensive.' },
    },
  ],

  glossary: ['token', 'language-model', 'autoregression', 'weight', 'inference', 'transformer', 'positional-encoding', 'kv-cache', 'context-window', 'stateless', 'system-prompt', 'lost-in-the-middle'],

  terms: [
    { id: 'context-window', term: { es: 'Ventana de contexto', en: 'Context window' }, def: { es: 'Número máximo de tokens que el modelo puede leer de una vez. Cuentan las instrucciones del sistema, la conversación, los documentos y la respuesta que va escribiendo. Lo que no cabe no existe para el modelo.', en: 'The maximum number of tokens the model can read at once. The system prompt, the conversation, documents, and the answer it is writing all count. Whatever does not fit does not exist for the model.' } },
    { id: 'stateless', term: { es: 'Sin estado (stateless)', en: 'Stateless' }, def: { es: 'Que cada llamada al modelo empieza de cero y no recuerda las anteriores. La memoria de una conversación vive en la aplicación, que reenvía todo el historial en cada turno.', en: 'Each call to the model starts from scratch and does not remember earlier ones. A conversation’s memory lives in the app, which resends the whole history on every turn.' } },
    { id: 'system-prompt', term: { es: 'Instrucciones del sistema (system prompt)', en: 'System prompt' }, def: { es: 'Instrucciones fijas que quien construye la aplicación pone al frente del contexto: rol, tono y reglas. Quien conversa no las ve, pero viajan y ocupan lugar en cada turno.', en: 'Fixed instructions that whoever builds the app places at the front of the context: role, tone, and rules. The person chatting does not see them, but they ride along and take up room on every turn.' } },
    { id: 'lost-in-the-middle', term: { es: 'Perdido en el medio', en: 'Lost in the middle' }, def: { es: 'Efecto medido en varios modelos: aprovechan mejor la información al principio o al final de un contexto largo que la que queda a la mitad.', en: 'An effect measured in several models: they make better use of information at the start or end of a long context than of what sits in the middle.' } },
  ],

  sources: [
    { title: 'Lost in the Middle: How Language Models Use Long Contexts (tablas 1 y 6)', authors: 'Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F., Liang, P.', year: 2023, url: 'https://arxiv.org/abs/2307.03172' },
    { title: 'Language Models are Few-Shot Learners (ventana de 2 048 tokens)', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Improving Language Understanding by Generative Pre-Training (posiciones aprendidas; secuencias de 512 tokens)', authors: 'Radford, A., Narasimhan, K., Salimans, T., Sutskever, I.', year: 2018, url: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf' },
    { title: 'Language Models are Unsupervised Multitask Learners (contexto de 1 024 tokens)', authors: 'Radford, A. et al.', year: 2019, url: 'https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf' },
    { title: 'Introducing 100K Context Windows', authors: 'Anthropic', year: 2023, url: 'https://www.anthropic.com/news/100k-context-windows' },
    { title: 'The Llama 3 Herd of Models (ventana de hasta 128K; tabla 3)', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context', authors: 'Gemini Team, Google', year: 2024, url: 'https://arxiv.org/abs/2403.05530' },
    { title: 'Using the Messages API (documentación de la API de Claude: «stateless»)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/working-with-messages' },
    { title: 'Context windows (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { title: 'Prompt caching (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching' },
    { title: 'Compaction overview (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/compaction' },
    { title: 'Memory tool (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool' },
    { title: 'GPT-4 Technical Report', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'RULER: What’s the Real Context Size of Your Long-Context Language Models?', authors: 'Hsieh, C.-P., Sun, S., Kriman, S., Acharya, S., Rekesh, D., Jia, F., Zhang, Y., Ginsburg, B.', year: 2024, url: 'https://arxiv.org/abs/2404.06654' },
    { title: 'MemGPT: Towards LLMs as Operating Systems', authors: 'Packer, C. et al.', year: 2023, url: 'https://arxiv.org/abs/2310.08560' },
  ],
});
