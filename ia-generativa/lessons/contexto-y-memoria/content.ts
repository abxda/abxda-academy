import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'contexto-y-memoria',

  objectives: {
    es: [
      'Explicar por qué un asistente parece recordar tu conversación aunque el modelo no guarde nada entre un turno y el siguiente.',
      'Calcular cuánto texto se reenvía y se paga en una conversación de n turnos, y por qué ese total crece con el cuadrado.',
      'Reconocer qué ocurre cuando el historial excede la ventana de contexto y por qué un dato en el medio se aprovecha peor.',
    ],
    en: [
      'Explain why an assistant seems to remember your conversation even though the model stores nothing from one turn to the next.',
      'Calculate how much text is resent and paid for in an n-turn conversation, and why that total grows with the square.',
      'Recognize what happens when the history exceeds the context window and why a fact in the middle is used less well.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Le dices tu nombre a un chatbot y le pides una idea. La conversación fluye, como con alguien que escucha.',
      en: 'You tell a chatbot your name and ask it for an idea. The conversation flows, like talking to someone who listens.',
    },
    {
      id: 'seems',
      es: 'Y entonces preguntas cómo te llamas, y lo sabe. Parece memoria, como la de una persona. Veamos qué ocurre de verdad.',
      en: 'Then you ask what your name is, and it knows. It looks like memory, the kind a person has. Let’s see what really happens.',
      pad: 0.3,
    },
    {
      id: 'function',
      es: 'Por dentro, el modelo es una función: entra texto y sale la probabilidad de la siguiente pieza. Sus pesos quedaron fijos al terminar el entrenamiento; nada de lo que escribes los cambia.',
      en: 'Inside, the model is a function: text goes in, and the probability of the next piece comes out. Its weights froze when training ended; nothing you type changes them.',
    },
    {
      id: 'stateless-q',
      es: 'Entonces, ¿cómo sabe tu nombre? Porque en cada turno la aplicación manda toda la conversación, desde el primer mensaje, y el modelo la lee otra vez como si fuera nueva.',
      en: 'So how does it know your name? Because at every turn the app sends the entire conversation, from the first message, and the model reads it again as if it were new.',
      pad: 0.5,
    },
    {
      id: 'stateless-def',
      es: 'A eso se le llama no tener estado: cada llamada empieza de cero. El historial vive en la aplicación, que lo guarda y lo reenvía. El modelo no guarda nada.',
      en: 'That is called being stateless: every call starts from zero. The history lives in the app, which stores it and resends it. The model stores nothing.',
      note: { es: 'Sin estado: cada llamada empieza de cero; la app reenvía el historial.', en: 'Stateless: every call starts from zero; the app resends the history.' },
      pad: 0.3,
    },
    {
      id: 'try-state',
      es: 'Tu turno: envía la pregunta «¿cómo me llamo?» con todo el historial y después sola. Antes de pulsar, adivina qué responderá cada vez.',
      en: 'Your turn: send the question “what is my name?” with the whole history and then on its own. Before you press, guess what it will answer each time.',
      gate: {
        id: 'state',
        prompt: { es: 'Envía la pregunta de las dos maneras y compara las respuestas.', en: 'Send the question both ways and compare the answers.' },
      },
      pad: 0.4,
    },
    {
      id: 'state-after',
      es: 'Sola, la pregunta no le dice nada. No es que el modelo lo haya olvidado: nunca lo vio. Lo que no está en el contexto no existe para él.',
      en: 'On its own, the question tells it nothing. The model didn’t forget: it never saw it. What isn’t in the context doesn’t exist for it.',
      note: { es: 'Lo que no está en el contexto no existe para el modelo.', en: 'What isn’t in the context doesn’t exist for the model.' },
    },
    {
      id: 'window',
      es: 'Imagina el contexto como un tren, con un vagón por mensaje. El modelo solo ve el tramo que cabe en su ventana, de largo fijo y medido en tokens: la ventana de contexto.',
      en: 'Picture the context as a train, one wagon per message. The model only sees the stretch that fits in its window, of fixed length and measured in tokens: the context window.',
      note: { es: 'Ventana de contexto: el máximo de tokens que el modelo lee a la vez.', en: 'Context window: the most tokens the model reads at once.' },
      pad: 0.4,
    },
    {
      id: 'contents',
      es: 'En la ventana caben juntas las instrucciones, el historial, tu pregunta y la respuesta que el modelo va escribiendo, token a token. Todo comparte el mismo presupuesto.',
      en: 'The window holds the instructions, the history, your question, and the answer the model writes token by token, all together. It all shares one budget.',
      pad: 0.4,
    },
    {
      id: 'system',
      es: 'El primer vagón suele ser el prompt del sistema: instrucciones de quien creó la aplicación sobre rol, tono y reglas. Tú no lo ves, pero el modelo lo lee primero, en cada turno.',
      en: 'The first wagon is usually the system prompt: instructions from whoever built the app about role, tone, and rules. You never see it, but the model reads it first, every turn.',
      note: { es: 'Prompt del sistema: instrucciones fijas al inicio del contexto.', en: 'System prompt: fixed instructions at the start of the context.' },
      pad: 0.3,
    },
    {
      id: 'sizes',
      es: 'Esa ventana ha crecido muchísimo: de quinientos doce tokens en GPT-1 a más de un millón en Gemini 1.5. Cien mil tokens ya son una novela entera.',
      en: 'That window has grown enormously: from five hundred twelve tokens in GPT-1 to over a million in Gemini 1.5. A hundred thousand tokens is already an entire novel.',
      tts: {
        es: 'Esa ventana ha crecido muchísimo: de quinientos doce tokens en ge pe te uno a más de un millón en Yémini uno punto cinco. Cien mil tokens ya son una novela entera.',
        en: 'That window has grown enormously: from five hundred twelve tokens in G P T one to over a million in Jem-ih-nye one point five. A hundred thousand tokens is already an entire novel.',
      },
      pad: 1.2,
    },
    {
      id: 'overflow',
      es: '¿Y si no cabe? La aplicación decide: recorta lo más viejo, lo resume o rechaza el mensaje. Si recorta, esos vagones salen de la ventana y dejan de existir para el modelo.',
      en: 'What if it doesn’t fit? The app decides: it trims the oldest, summarizes it, or rejects the message. If it trims, those wagons leave the window and stop existing for the model.',
      pad: 0.8,
    },
    {
      id: 'try-train',
      es: 'Tu turno: envía mensajes y pega documentos hasta que el primero salga de la ventana. Mira qué responde el modelo cuando le preguntas cómo te llamas.',
      en: 'Your turn: send messages and paste documents until the first one leaves the window. See what the model answers when you ask it your name.',
      gate: {
        id: 'train',
        prompt: { es: 'Llena la ventana hasta que se salga el mensaje con tu nombre.', en: 'Fill the window until the message with your name falls out.' },
      },
      pad: 0.4,
    },
    {
      id: 'train-after',
      es: 'Fíjate: la aplicación todavía guarda esos mensajes. Con una ventana mayor, los reenviaría y el modelo volvería a verlos. La memoria nunca estuvo en el modelo.',
      en: 'Notice: the app still stores those messages. With a bigger window it would resend them and the model would see them again. The memory was never in the model.',
    },
    {
      id: 'cost-q',
      es: 'Hay otra consecuencia. Como se reenvía todo, cada turno procesa más texto que el anterior, y el proveedor cobra por cada token de entrada.',
      en: 'There is another consequence. Since everything is resent, each turn processes more text than the last, and the provider charges for every input token.',
      pad: 0.5,
    },
    {
      id: 'cost-sum',
      es: 'Si cada turno añade ciento cincuenta tokens, veinte turnos no procesan tres mil: procesan casi treinta mil, casi diez veces más. El total crece con el cuadrado de los turnos.',
      en: 'If each turn adds one hundred fifty tokens, twenty turns don’t process three thousand: they process almost thirty thousand, nearly ten times more. The total grows with the square of the turns.',
      note: { es: 'El costo de una conversación crece con el cuadrado de sus turnos.', en: 'A conversation’s cost grows with the square of its turns.' },
      pad: 0.8,
    },
    {
      id: 'cost-play',
      es: 'Mueve los turnos y su tamaño, y mira el costo. Un prompt del sistema largo se paga en cada turno, y una caché del prefijo lo abarata mucho, pero no del todo.',
      en: 'Move the turns and their size and watch the cost. A long system prompt is paid for on every turn, and prefix caching makes it much cheaper, but not free.',
      pad: 0.8,
    },
    {
      id: 'litm-q',
      es: 'Y que algo quepa en la ventana no garantiza que el modelo lo use bien. En 2023, un estudio escondió la respuesta en distintos lugares de una fila de veinte documentos.',
      en: 'And fitting in the window doesn’t guarantee the model uses it well. In 2023, a study hid the answer at different places in a row of twenty documents.',
      tts: {
        es: 'Y que algo quepa en la ventana no garantiza que el modelo lo use bien. En dos mil veintitrés, un estudio escondió la respuesta en distintos lugares de una fila de veinte documentos.',
        en: 'And fitting in the window doesn’t guarantee the model uses it well. In twenty twenty-three, a study hid the answer at different places in a row of twenty documents.',
      },
      pad: 1.0,
    },
    {
      id: 'litm-u',
      es: 'El resultado tiene forma de U: acierta más con el dato al principio o al final, y menos en el medio. Con GPT-3.5-Turbo, de casi setenta y seis por ciento a casi cincuenta y cuatro.',
      en: 'The result is U-shaped: it does better with the fact at the start or at the end, and worse in the middle. With GPT-3.5-Turbo, from nearly seventy-six percent to nearly fifty-four.',
      tts: {
        es: 'El resultado tiene forma de U: acierta más con el dato al principio o al final, y menos en el medio. Con ge pe te tres punto cinco turbo, de casi setenta y seis por ciento a casi cincuenta y cuatro.',
        en: 'The result is U-shaped: it does better with the fact at the start or at the end, and worse in the middle. With G P T three point five Turbo, from nearly seventy-six percent to nearly fifty-four.',
      },
      note: { es: 'Perdido en el medio: lo que queda en la mitad del contexto se usa peor.', en: 'Lost in the middle: what sits in the middle of the context is used less well.' },
      pad: 1.0,
    },
    {
      id: 'litm-closed',
      es: 'Peor aún: con la respuesta en el medio acertó menos que sin recibir ningún documento, que daba cincuenta y seis por ciento. Tenerla a mano no bastó.',
      en: 'Worse still: with the answer in the middle it did worse than with no documents at all, which scored fifty-six percent. Having it at hand wasn’t enough.',
      pad: 0.6,
    },
    {
      id: 'try-litm',
      es: 'Tu turno: mueve el documento con la respuesta por la fila y cambia de modelo. Busca dónde falla más cada uno.',
      en: 'Your turn: slide the document with the answer along the row and switch models. Find where each one fails most.',
      gate: {
        id: 'litm',
        prompt: { es: 'Prueba una posición del medio y una de los extremos.', en: 'Try a position in the middle and one at the edges.' },
      },
      pad: 0.4,
    },
    {
      id: 'litm-after',
      es: 'No todos caen igual, pero en los cuatro el medio rinde menos que el principio. Que algo quepa en la ventana no significa que se aproveche.',
      en: 'They don’t all fall equally, but in all four the middle does worse than the start. Fitting in the window doesn’t mean being used.',
    },
    {
      id: 'litm-ruler',
      es: 'Y no es solo de 2023: en 2024, la prueba RULER halló que solo la mitad de los modelos con treinta y dos mil tokens o más rendía bien a esa longitud. Conviene menos contexto, y más relevante.',
      en: 'And it isn’t just 2023: in 2024, the RULER benchmark found that only half of the models with thirty-two thousand tokens or more did well at that length. Send less context, and more relevant.',
      tts: {
        es: 'Y no es solo de dos mil veintitrés: en dos mil veinticuatro, la prueba rúler halló que solo la mitad de los modelos con treinta y dos mil tokens o más rendía bien a esa longitud. Conviene menos contexto, y más relevante.',
        en: 'And it isn’t just twenty twenty-three: in twenty twenty-four, the ruler benchmark found that only half of the models with thirty-two thousand tokens or more did well at that length. Send less context, and more relevant.',
      },
    },
    {
      id: 'memory-q',
      es: 'Entonces, ¿qué son las funciones de memoria de los asistentes? No es el modelo recordando: es texto guardado fuera de él y vuelto a pegar en el contexto.',
      en: 'So what are the memory features of assistants? It isn’t the model remembering: it is text stored outside it and pasted back into the context.',
      note: { es: 'Memoria: texto guardado fuera del modelo y reinsertado en el contexto.', en: 'Memory: text stored outside the model and reinserted into the context.' },
      pad: 0.5,
    },
    {
      id: 'memory-summary',
      es: 'Una técnica es el resumen: al acercarse al tope, se resume lo más viejo y el resumen ocupa su lugar. Cabe más conversación, pero se pierden detalles.',
      en: 'One technique is summarizing: near the cap, the oldest part is summarized and the summary takes its place. More conversation fits, but details are lost.',
      pad: 0.6,
    },
    {
      id: 'memory-store',
      es: 'Otra es el almacén externo: notas y documentos fuera de la ventana, de donde se trae solo lo relevante. Es la idea de MemGPT, inspirada en la jerarquía de memoria de un sistema operativo.',
      en: 'Another is external storage: notes and documents outside the window, from which only what is relevant is fetched. It is the idea behind MemGPT, inspired by an operating system’s memory hierarchy.',
      tts: {
        es: 'Otra es el almacén externo: notas y documentos fuera de la ventana, de donde se trae solo lo relevante. Es la idea de mem ge pe te, inspirada en la jerarquía de memoria de un sistema operativo.',
        en: 'Another is external storage: notes and documents outside the window, from which only what is relevant is fetched. It is the idea behind Mem G P T, inspired by an operating system’s memory hierarchy.',
      },
      pad: 0.6,
    },
    {
      id: 'memory-risk',
      es: 'Cada vía tiene su costo: el resumen pierde detalle, una nota puede quedar equivocada u obsoleta, y lo que se envía o se guarda es información que sale de tu organización.',
      en: 'Each route has a cost: a summary loses detail, a note can be wrong or outdated, and whatever is sent or stored is information that leaves your organization.',
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: el modelo no recuerda, lee. En cada turno recibe una ventana con instrucciones, historial y pregunta, y solo eso existe para él.',
      en: 'In short: the model doesn’t remember, it reads. At every turn it receives a window with instructions, history, and question, and only that exists for it.',
      note: { es: 'El modelo no recuerda: en cada turno lee su ventana.', en: 'The model doesn’t remember: at every turn it reads its window.' },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Pero ¿y si lo que necesita saber es tuyo, como tus contratos o tus políticas, y no cabe? ¿Cómo darle conocimiento propio sin reentrenarlo? Esa es la siguiente lección: RAG.',
      en: 'But what if what it needs to know is yours, like your contracts or your policies, and doesn’t fit? How do you give it your own knowledge without retraining it? That is the next lesson: RAG.',
    },
  ],

  keyIdeas: {
    es: [
      'El modelo no tiene estado: cada llamada empieza de cero y la aplicación reenvía el historial completo en cada turno.',
      'Sus pesos están congelados: no aprende de tu conversación. Lo que parece aprendizaje es texto dentro del contexto.',
      'La ventana de contexto es el máximo de tokens que lee a la vez; instrucciones, historial, pregunta y respuesta comparten ese presupuesto.',
      'Reenviar todo hace que el costo crezca con el cuadrado de los turnos, y que algo quepa no significa que se aproveche: el medio rinde peor.',
      'Las funciones de memoria son texto guardado fuera del modelo (resúmenes, notas, almacenes) que se vuelve a pegar en el contexto.',
    ],
    en: [
      'The model is stateless: every call starts from zero and the app resends the whole history on every turn.',
      'Its weights are frozen: it does not learn from your conversation. What looks like learning is text inside the context.',
      'The context window is the most tokens it reads at once; instructions, history, question, and answer share that budget.',
      'Resending everything makes cost grow with the square of the turns, and fitting does not mean being used: the middle does worse.',
      'Memory features are text stored outside the model (summaries, notes, stores) that gets pasted back into the context.',
    ],
  },

  misconception: {
    wrong: {
      es: 'El chatbot me conoce y aprende de mí conforme conversamos.',
      en: 'The chatbot knows me and learns from me as we talk.',
    },
    right: {
      es: 'En cada turno recibe el historial otra vez, como texto. Sus pesos no cambian: si ese texto no se reenvía o no cabe en la ventana, para el modelo no existe.',
      en: 'At every turn it receives the history again, as text. Its weights do not change: if that text is not resent or does not fit in the window, it does not exist for the model.',
    },
  },

  deeper: {
    es: `## Sin estado: lo que realmente se envía

En una API de chat, la llamada del turno $k$ lleva la lista completa de mensajes. El modelo devuelve solo el mensaje nuevo y la aplicación lo agrega a su lista antes del turno siguiente:

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

La documentación de la API de mensajes de Anthropic habla de «conversaciones de varios turnos sin estado» y ubica las instrucciones del sistema en un parámetro aparte. Algunas plataformas guardan el historial en sus servidores y lo reinsertan por ti; el modelo sigue sin estado: solo cambia quién guarda el historial.

La ventana incluye también la respuesta: según esa misma documentación, el contexto comprende «todo el texto al que el modelo puede referirse al generar una respuesta, incluida la propia respuesta». GPT-3 tenía $n_{\\text{ctx}}=2048$ tokens (Brown et al., 2020).

## Pesos congelados, ejemplos en el contexto

El modelo puede seguir un patrón que le muestras dentro del contexto (aprendizaje en contexto): Brown et al. (2020) lo evalúan «sin actualizaciones de gradiente ni ajuste fino». Es temporal: cuando esos ejemplos salen de la ventana, el comportamiento desaparece. Cambiar los pesos exige entrenar (lecciones 4, 8 y 27). El informe técnico de GPT-4 lo resume así: tiene una ventana de contexto limitada y no aprende de la experiencia.

## Cuánto cuesta reenviar el historial

Sea $S$ el prompt del sistema, $m$ los tokens que añade cada turno (mensaje y respuesta) y $u$ el tamaño del mensaje nuevo. El turno $k$ envía

$$T_k = S + (k-1)\\,m + u$$

y en $n$ turnos se procesan

$$\\sum_{k=1}^{n} T_k = nS + m\\,\\frac{n(n-1)}{2} + nu .$$

Con $S=0$, $m=150$, $u=50$ y $n=20$ son $29\\,500$ tokens de entrada; si cada token se procesara una sola vez serían $S+nm = 3\\,000$. El término dominante es $m\\,n^2/2$: el costo crece con el cuadrado de los turnos.

Con caché del prefijo (suponiendo que acierta en cada turno), el turno 1 escribe todo y los siguientes leen el prefijo y escriben solo lo nuevo. La documentación de Anthropic fija la lectura en $0{,}1\\times$ el precio base de entrada (con excepciones por modelo) y la escritura de 5 minutos en $1{,}25\\times$:

$$C = 1{,}25\\,T_1 + \\sum_{k=2}^{n}\\left(0{,}1\\,T_{k-1} + 1{,}25\\,m\\right)$$

En el ejemplo, $C = 6\\,285$ tokens equivalentes, el 21 % de $29\\,500$. Con $S=2\\,000$, $m=500$, $u=50$ y $n=60$ el total es $1\\,008\\,000$ tokens: a un precio supuesto de 3 USD por millón, unos 3 USD por conversación sin caché y unos 0,41 USD con ella. No se incluyen los tokens de salida (se pagan aparte y crecen de forma lineal).

Además de pagarlo, procesar un contexto de $n$ tokens exige cómputo de atención que crece como $n^2$ (Vaswani et al., 2017, tabla 1), y la caché KV crece de forma lineal con $n$ (lección 26).

## La posición importa: «Perdido en el medio»

Liu et al. (2023) dieron a cada modelo 20 documentos (≈ 4 mil tokens), uno solo con la respuesta, y movieron su posición. Acierto (%), valores leídos de la figura 5 con precisión de ±0,1 punto; las dos últimas columnas son de la tabla 1:

| Modelo | 1.º | 5.º | 10.º | 15.º | 20.º | Sin documentos | Solo el correcto |
|---|---|---|---|---|---|---|---|
| GPT-3.5-Turbo | 75,8 | 57,2 | 53,8 | 55,4 | 63,2 | 56,1 | 88,3 |
| Claude-1.3 | 59,9 | 55,9 | 56,8 | 57,2 | 60,1 | 48,3 | 76,1 |
| LongChat-13B (16K) | 68,6 | 57,4 | 55,3 | 52,5 | 55,0 | 35,0 | 83,4 |
| MPT-30B-Instruct | 53,7 | 51,8 | 52,2 | 52,7 | 56,3 | 31,5 | 81,9 |

Son modelos de 2023 y una sola tarea: la forma exacta cambia con el modelo y la prueba, y los autores no encuentran que una ventana mayor, por sí sola, use mejor el contexto. RULER (Hsieh et al., 2024) amplía el hallazgo: entre los modelos que declaraban 32 mil tokens o más, solo la mitad mantenía un rendimiento satisfactorio a 32 mil.

## En código

\`\`\`python
def recortar(mensajes, limite, contar):
    """Deja el mensaje de sistema y los mensajes más recientes que quepan."""
    sistema, resto = mensajes[0], mensajes[1:]
    usado, dentro = contar(sistema), []
    for m in reversed(resto):                    # de lo más nuevo a lo más viejo
        if usado + contar(m) > limite:
            break
        dentro.append(m)
        usado += contar(m)
    return [sistema] + dentro[::-1]

def entrada_total(turnos, s, m, u):
    """Tokens de entrada procesados en \`turnos\` turnos: el turno k envía s + (k-1)*m + u."""
    return sum(s + (k - 1) * m + u for k in range(1, turnos + 1))

contar = lambda m: len(m["texto"].split())      # aproximación: una palabra ≈ un token
historial = [
    {"rol": "sistema",   "texto": "Eres un asistente de logística."},
    {"rol": "usuario",   "texto": "Me llamo Ana y trabajo en logística."},
    {"rol": "asistente", "texto": "Mucho gusto, Ana. ¿En qué te ayudo?"},
    {"rol": "usuario",   "texto": "Dame una idea para ahorrar en fletes."},
    {"rol": "asistente", "texto": "Consolida envíos y renegocia rutas."},
    {"rol": "usuario",   "texto": "¿Cómo me llamo?"},
]
dentro = recortar(historial, limite=25, contar=contar)
print([m["rol"] for m in dentro])
print("¿Sigue el nombre en la ventana?", any("Ana" in m["texto"] for m in dentro))
print(entrada_total(turnos=20, s=0, m=150, u=50))
# ['sistema', 'usuario', 'asistente', 'usuario']
# ¿Sigue el nombre en la ventana? False
# 29500
\`\`\`

## Lo que viene

La caché KV y el costo por token de salida están en la lección 26. En la 31 (RAG) el almacén externo se vuelve un sistema completo: recuperar fragmentos relevantes y pegarlos en la ventana. En la 32 los agentes usan esa misma idea, con memoria en archivos, para trabajos que duran más que una ventana.`,
    en: `## Stateless: what is really sent

In a chat API, the call for turn $k$ carries the full list of messages. The model returns only the new message, and the app appends it to its list before the next turn:

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

Anthropic's Messages API documentation speaks of “stateless multi-turn conversations” and puts the system instructions in a separate parameter. Some platforms store the history on their servers and reinsert it for you; the model is still stateless: only who stores the history changes.

The window includes the answer too: per that same documentation, the context is “all the text a language model can reference when generating a response, including the response itself.” GPT-3 had $n_{\\text{ctx}}=2048$ tokens (Brown et al., 2020).

## Frozen weights, examples in the context

The model can follow a pattern you show it inside the context (in-context learning): Brown et al. (2020) evaluate it “without any gradient updates or fine-tuning.” It is temporary: when those examples leave the window, the behavior disappears. Changing the weights takes training (lessons 4, 8, and 27). The GPT-4 technical report puts it this way: it has a limited context window and does not learn from experience.

## What resending the history costs

Let $S$ be the system prompt, $m$ the tokens each turn adds (message and reply), and $u$ the size of the new message. Turn $k$ sends

$$T_k = S + (k-1)\\,m + u$$

and over $n$ turns the model processes

$$\\sum_{k=1}^{n} T_k = nS + m\\,\\frac{n(n-1)}{2} + nu .$$

With $S=0$, $m=150$, $u=50$, and $n=20$ that is $29{,}500$ input tokens; if each token were processed only once it would be $S+nm = 3{,}000$. The dominant term is $m\\,n^2/2$: cost grows with the square of the turns.

With prefix caching (assuming it hits on every turn), turn 1 writes everything and the following turns read the prefix and write only what is new. Anthropic's documentation sets reads at $0.1\\times$ the base input price (with per-model exceptions) and 5-minute writes at $1.25\\times$:

$$C = 1.25\\,T_1 + \\sum_{k=2}^{n}\\left(0.1\\,T_{k-1} + 1.25\\,m\\right)$$

In the example, $C = 6{,}285$ equivalent tokens, 21% of $29{,}500$. With $S=2{,}000$, $m=500$, $u=50$, and $n=60$ the total is $1{,}008{,}000$ tokens: at an assumed price of USD 3 per million, about USD 3 per conversation without caching and about USD 0.41 with it. Output tokens are not included (they are billed separately and grow linearly).

Besides paying for it, processing a context of $n$ tokens takes attention compute that grows like $n^2$ (Vaswani et al., 2017, table 1), and the KV cache grows linearly with $n$ (lesson 26).

## Position matters: “Lost in the Middle”

Liu et al. (2023) gave each model 20 documents (≈ 4 thousand tokens), only one containing the answer, and moved its position. Accuracy (%), values read from figure 5 with ±0.1 point precision; the last two columns come from table 1:

| Model | 1st | 5th | 10th | 15th | 20th | No documents | Only the right one |
|---|---|---|---|---|---|---|---|
| GPT-3.5-Turbo | 75.8 | 57.2 | 53.8 | 55.4 | 63.2 | 56.1 | 88.3 |
| Claude-1.3 | 59.9 | 55.9 | 56.8 | 57.2 | 60.1 | 48.3 | 76.1 |
| LongChat-13B (16K) | 68.6 | 57.4 | 55.3 | 52.5 | 55.0 | 35.0 | 83.4 |
| MPT-30B-Instruct | 53.7 | 51.8 | 52.2 | 52.7 | 56.3 | 31.5 | 81.9 |

These are 2023 models and a single task: the exact shape changes with the model and the test, and the authors find that a larger window, by itself, does not use the context better. RULER (Hsieh et al., 2024) extends the finding: among models claiming 32 thousand tokens or more, only half kept satisfactory performance at 32 thousand.

## In code

\`\`\`python
def trim(messages, limit, count):
    """Keep the system message and the most recent messages that fit."""
    system, rest = messages[0], messages[1:]
    used, inside = count(system), []
    for m in reversed(rest):                     # newest to oldest
        if used + count(m) > limit:
            break
        inside.append(m)
        used += count(m)
    return [system] + inside[::-1]

def total_input(turns, s, m, u):
    """Input tokens processed over \`turns\` turns: turn k sends s + (k-1)*m + u."""
    return sum(s + (k - 1) * m + u for k in range(1, turns + 1))

count = lambda m: len(m["text"].split())        # approximation: one word ≈ one token
history = [
    {"role": "system",    "text": "You are a logistics assistant."},
    {"role": "user",      "text": "My name is Ana and I work in logistics."},
    {"role": "assistant", "text": "Nice to meet you, Ana. How can I help?"},
    {"role": "user",      "text": "Give me one idea to save on freight."},
    {"role": "assistant", "text": "Consolidate shipments and renegotiate routes."},
    {"role": "user",      "text": "What is my name?"},
]
inside = trim(history, limit=25, count=count)
print([m["role"] for m in inside])
print("Is the name still in the window?", any("Ana" in m["text"] for m in inside))
print(total_input(turns=20, s=0, m=150, u=50))
# ['system', 'user', 'assistant', 'user']
# Is the name still in the window? False
# 29500
\`\`\`

## What comes next

The KV cache and the cost per output token are in lesson 26. In lesson 31 (RAG) the external store becomes a full system: retrieve relevant fragments and paste them into the window. In lesson 32, agents use that same idea, with memory in files, for jobs that last longer than one window.`,
  },

  lens: {
    es: [
      'Lo que no está en el contexto no existe para el modelo: si necesita una política, un contrato o un dato de cliente, hay que ponérselo en la ventana en cada consulta. Pregunta qué se envía exactamente en cada llamada.',
      'El costo crece con cada turno porque se reenvía el historial. Pide el costo por conversación, no por mensaje; limita su longitud o resúmela; y pregunta si hay caché del prefijo y cuánto descuenta.',
      'La ventana anunciada no es la ventana útil: prueba con tus propios documentos y con el dato clave en distintas posiciones. Más contexto puede rendir peor, y casi siempre cuesta más.',
      'Privacidad: todo lo que se pega se envía al proveedor, y las funciones de memoria guardan notas sobre personas o la empresa. Revisa retención, si se usa para entrenar y cómo ver, borrar o desactivar esa memoria.',
    ],
    en: [
      'What isn’t in the context doesn’t exist for the model: if it needs a policy, a contract, or a customer fact, it has to be put in the window on every query. Ask what exactly is sent on each call.',
      'Cost grows with every turn because the history is resent. Ask for the cost per conversation, not per message; limit its length or summarize it; and ask whether prefix caching exists and how much it discounts.',
      'The advertised window is not the useful window: test with your own documents and with the key fact in different positions. More context can perform worse, and almost always costs more.',
      'Privacy: everything pasted is sent to the provider, and memory features store notes about people or the company. Check retention, whether it is used for training, and how to view, delete, or turn off that memory.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Un chatbot responde «Te llamas Ana» tres turnos después de que se lo dijiste, aunque el modelo no guarda nada entre llamadas. ¿Por qué puede hacerlo?', en: 'A chatbot answers “Your name is Ana” three turns after you told it, even though the model stores nothing between calls. Why can it do that?' },
      options: [
        { es: 'Porque el modelo ajusta sus pesos con cada mensaje que recibe.', en: 'Because the model adjusts its weights with every message it receives.' },
        { es: 'Porque guarda tu nombre en una memoria interna entre una llamada y otra.', en: 'Because it keeps your name in an internal memory between calls.' },
        { es: 'Porque la aplicación reenvía el historial completo y el nombre viaja dentro del texto.', en: 'Because the app resends the whole history and the name travels inside the text.' },
        { es: 'Porque los modelos recientes memorizan a cada usuario durante el entrenamiento.', en: 'Because recent models memorize each user during training.' },
      ],
      answer: 2,
      why: { es: 'El modelo no tiene estado: en cada turno recibe todo el historial como texto, y el nombre está en el primer mensaje. Sus pesos no cambian durante la conversación.', en: 'The model is stateless: at every turn it receives the whole history as text, and the name is in the first message. Its weights do not change during the conversation.' },
    },
    {
      kind: 'concept',
      q: { es: 'En un contexto largo con muchos documentos, ¿dónde suele aprovechar mejor un modelo el dato que contiene la respuesta?', en: 'In a long context with many documents, where does a model tend to make the best use of the fact that holds the answer?' },
      options: [
        { es: 'En cualquier lugar por igual, porque lee todo el contexto a la vez.', en: 'Anywhere equally, because it reads the whole context at once.' },
        { es: 'Al principio o al final del contexto, y peor en el medio.', en: 'At the start or the end of the context, and worse in the middle.' },
        { es: 'Solo en el prompt del sistema.', en: 'Only in the system prompt.' },
        { es: 'En el medio, porque ahí está la mayor parte del texto.', en: 'In the middle, because that is where most of the text is.' },
      ],
      answer: 1,
      why: { es: 'Liu et al. (2023) midieron una curva en forma de U: el acierto es mayor con la información al principio o al final y cae cuando está en el medio.', en: 'Liu et al. (2023) measured a U-shaped curve: accuracy is higher with the information at the start or the end and drops when it is in the middle.' },
    },
    {
      kind: 'calc',
      q: { es: 'En cada turno el modelo recibe todo lo anterior más el mensaje nuevo: 100 tokens en el primer turno, 200 en el segundo, 300 en el tercero, y así. ¿Cuántos tokens de entrada se procesan en total en 10 turnos?', en: 'At every turn the model receives everything before plus the new message: 100 tokens on the first turn, 200 on the second, 300 on the third, and so on. How many input tokens are processed in total over 10 turns?' },
      options: [
        { es: '1 000', en: '1,000' },
        { es: '5 000', en: '5,000' },
        { es: '5 500', en: '5,500' },
        { es: '10 000', en: '10,000' },
      ],
      answer: 2,
      why: { es: 'La suma es 100 × (1 + 2 + … + 10) = 100 × 55 = 5 500. Si cada token se procesara una sola vez serían solo 1 000: reenviar el historial multiplica el costo por 5,5.', en: 'The sum is 100 × (1 + 2 + … + 10) = 100 × 55 = 5,500. If each token were processed only once it would be just 1,000: resending the history multiplies the cost by 5.5.' },
    },
    {
      kind: 'apply',
      q: { es: 'Tu equipo diseña un asistente interno con un prompt del sistema de 3 000 tokens y conversaciones de unos 30 turnos. ¿Qué conviene preguntar al proveedor antes de presupuestar?', en: 'Your team is designing an internal assistant with a 3,000-token system prompt and conversations of about 30 turns. What should you ask the provider before budgeting?' },
      options: [
        { es: 'Si ofrece caché del prefijo y cuánto cuesta leer de ella, porque el prompt y el historial se reenvían en cada turno.', en: 'Whether it offers prefix caching and how much reading from it costs, because the prompt and history are resent on every turn.' },
        { es: 'Cuántas GPU usa el modelo para responder.', en: 'How many GPUs the model uses to answer.' },
        { es: 'Si el modelo recuerda al usuario entre conversaciones sin guardar nada.', en: 'Whether the model remembers the user between conversations without storing anything.' },
        { es: 'Cuántos parámetros tiene el modelo.', en: 'How many parameters the model has.' },
      ],
      answer: 0,
      why: { es: 'Con 3 000 tokens de sistema y 30 turnos, buena parte de lo que pagas es texto repetido. La caché del prefijo lo abarata; el número de GPU o de parámetros no cambia tu factura por token.', en: 'With 3,000 system tokens and 30 turns, a large share of what you pay for is repeated text. Prefix caching makes it cheaper; the number of GPUs or parameters does not change your per-token bill.' },
    },
  ],

  glossary: ['token', 'language-model', 'autoregression', 'inference', 'weight', 'transformer', 'prefill', 'kv-cache', 'context-window', 'stateless', 'system-prompt', 'lost-in-the-middle'],

  terms: [
    { id: 'context-window', term: { es: 'Ventana de contexto', en: 'Context window' }, def: { es: 'Número máximo de tokens que el modelo puede leer a la vez, contando las instrucciones, el historial, la pregunta y la respuesta que va generando.', en: 'The maximum number of tokens the model can read at once, counting the instructions, the history, the question, and the answer it is generating.' } },
    { id: 'stateless', term: { es: 'Sin estado', en: 'Stateless' }, def: { es: 'Que cada llamada al modelo empieza de cero y no recuerda las anteriores. La memoria de una conversación vive en la aplicación, que reenvía el historial en cada turno.', en: 'Each call to the model starts from zero and does not remember earlier ones. A conversation’s memory lives in the app, which resends the history on every turn.' } },
    { id: 'system-prompt', term: { es: 'Prompt del sistema', en: 'System prompt' }, def: { es: 'Instrucciones fijas que quien construye la aplicación coloca al inicio del contexto (rol, tono, reglas). La persona usuaria no las ve, pero cuentan en cada turno.', en: 'Fixed instructions that whoever builds the app places at the start of the context (role, tone, rules). The user does not see them, but they count on every turn.' } },
    { id: 'lost-in-the-middle', term: { es: 'Perdido en el medio', en: 'Lost in the middle' }, def: { es: 'Efecto medido en varios modelos: aprovechan mejor la información al principio o al final de un contexto largo que la que queda en el medio.', en: 'An effect measured in several models: they make better use of information at the start or end of a long context than of what sits in the middle.' } },
  ],

  sources: [
    { title: 'Lost in the Middle: How Language Models Use Long Contexts', authors: 'Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F., Liang, P.', year: 2023, url: 'https://arxiv.org/abs/2307.03172' },
    { title: 'RULER: What’s the Real Context Size of Your Long-Context Language Models?', authors: 'Hsieh, C.-P., Sun, S., Kriman, S., Acharya, S., Rekesh, D., Jia, F., Zhang, Y., Ginsburg, B.', year: 2024, url: 'https://arxiv.org/abs/2404.06654' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'GPT-4 Technical Report', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'Language Models are Unsupervised Multitask Learners', authors: 'Radford, A. et al.', year: 2019 },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context', authors: 'Gemini Team, Google', year: 2024, url: 'https://arxiv.org/abs/2403.05530' },
    { title: 'Introducing 100K Context Windows', authors: 'Anthropic', year: 2023, url: 'https://www.anthropic.com/news/100k-context-windows' },
    { title: 'Context windows (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { title: 'Prompt caching (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching' },
    { title: 'Memory tool (documentación de la API de Claude)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool' },
    { title: 'MemGPT: Towards LLMs as Operating Systems', authors: 'Packer, C. et al.', year: 2023, url: 'https://arxiv.org/abs/2310.08560' },
    { title: 'Attention Is All You Need', authors: 'Vaswani, A. et al.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
  ],
});
