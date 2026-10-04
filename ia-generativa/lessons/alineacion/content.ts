import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'alineacion',

  objectives: {
    es: [
      'Explicar por qué un modelo base no es un asistente y qué pasos lo convierten en uno.',
      'Calcular la probabilidad de que una respuesta gane, a partir de las puntuaciones de un modelo de recompensa.',
      'Reconocer los efectos secundarios de optimizar preferencias humanas: ley de Goodhart, adulación y rechazos.',
    ],
    en: [
      'Explain why a base model is not an assistant and which steps turn it into one.',
      'Calculate the probability that an answer wins, from the scores of a reward model.',
      'Recognize the side effects of optimizing human preferences: Goodhart’s law, sycophancy, and refusals.',
    ],
  },

  segments: [
    // ── 1 · el modelo base no es un asistente ──
    {
      id: 'hook',
      es: 'Un modelo recién preentrenado sabe muchísimo, pero no sabe conversar. Lo único que hace es continuar texto, tal como lo vio en internet.',
      en: 'A freshly pretrained model knows a huge amount, but it cannot hold a conversation. All it does is continue text, the way it saw it on the internet.',
    },
    {
      id: 'base-demo',
      es: 'Mira un modelo base real. Le damos una pregunta y escribe lo que, según su entrenamiento, vendría después. No le responde a una persona: completa un documento.',
      en: 'Here is a real base model. We give it a question and it writes what, given its training, would come next. It does not answer a person: it completes a document.',
      pad: 0.5,
    },
    {
      id: 'why',
      es: 'No es un defecto, es su objetivo: se entrenó para predecir el siguiente token, no para ayudar. Entre lo que optimizó y lo que queremos hay una brecha.',
      en: 'That is not a bug, it is its objective: it was trained to predict the next token, not to help. Between what it optimized and what we want, there is a gap.',
    },
    {
      id: 'align',
      es: 'Cerrar esa brecha se llama alineación: lograr que el modelo haga lo que la persona pretende, y que sea útil, veraz e inofensivo.',
      en: 'Closing that gap is called alignment: getting the model to do what the person intends, while being helpful, honest, and harmless.',
      note: { es: 'Alineación: que el modelo haga lo que pretendes.', en: 'Alignment: the model does what you intend.' },
      pad: 0.3,
    },

    // ── 2 · ajuste con instrucciones ──
    {
      id: 'sft-idea',
      es: 'El primer paso es el ajuste con instrucciones. Personas escriben ejemplos de una indicación y su respuesta ideal, y el modelo se ajusta con ellos, como en el ajuste fino.',
      en: 'The first step is instruction tuning. People write examples of a prompt and its ideal answer, and the model is fine-tuned on them, just like in fine-tuning.',
      note: { es: 'Ajuste con instrucciones: aprender de respuestas ideales.', en: 'Instruction tuning: learn from ideal answers.' },
    },
    {
      id: 'sft-how',
      es: 'Es el mismo objetivo de siempre, predecir la siguiente palabra, pero el error solo se mide sobre la respuesta. Así aprende la forma de una conversación.',
      en: 'It is the same old objective, predicting the next word, but the error is measured only on the answer. That is how it learns the shape of a conversation.',
      pad: 0.3,
    },
    {
      id: 'sft-scale',
      es: 'Y es una capa pequeña: InstructGPT usó unas trece mil indicaciones con respuestas escritas por unas cuarenta personas, mientras GPT-3 se preentrenó con trescientos mil millones de tokens.',
      en: 'And it is a small layer: InstructGPT used about thirteen thousand prompts with answers written by about forty people, while GPT-3 was pretrained on three hundred billion tokens.',
      tts: {
        es: 'Y es una capa pequeña: Instruct ge pe te usó unas trece mil indicaciones con respuestas escritas por unas cuarenta personas, mientras ge pe te tres se preentrenó con trescientos mil millones de tokens.',
        en: 'And it is a small layer: Instruct G P T used about thirteen thousand prompts with answers written by about forty people, while G P T three was pretrained on three hundred billion tokens.',
      },
      pad: 0.3,
    },
    {
      id: 'compare-intro',
      es: 'Tu turno: elige una indicación y compara qué hace con ella un modelo base real y qué hace ese mismo modelo ya convertido en asistente.',
      en: 'Your turn: pick a prompt and compare what a real base model does with it against what that same model does once it has been turned into an assistant.',
      gate: {
        id: 'compare',
        prompt: { es: 'Prueba al menos dos indicaciones distintas.', en: 'Try at least two different prompts.' },
      },
      pad: 0.4,
    },
    {
      id: 'compare-result',
      es: 'Mismo modelo de partida, otro comportamiento. El asistente trata la indicación como una petición; el base, como el comienzo de un texto. No es perfecto: es un modelo pequeño.',
      en: 'Same starting model, different behavior. The assistant treats the prompt as a request; the base model, as the beginning of a text. It is not perfect: it is a small model.',
      pad: 0.3,
    },
    {
      id: 'sft-limit',
      es: 'Pero imitar tiene límites: escribir la respuesta perfecta es lento y caro, y el modelo, a lo sumo, iguala a quien la escribió. Comparar dos respuestas es mucho más fácil.',
      en: 'But imitation has limits: writing the perfect answer is slow and expensive, and the model can at best match whoever wrote it. Comparing two answers is much easier.',
      note: { es: 'Juzgar es más fácil que escribir.', en: 'Judging is easier than writing.' },
    },

    // ── 3 · preferencias y modelo de recompensa ──
    {
      id: 'pref-idea',
      es: 'Entonces se le pide a la persona algo más simple: ver dos respuestas a la misma pregunta y señalar cuál es mejor. Cada decisión es una preferencia.',
      en: 'So the person is asked for something simpler: look at two answers to the same question and point to the better one. Each decision is a preference.',
      pad: 0.3,
    },
    {
      id: 'rm-idea',
      es: 'Con muchas preferencias se entrena otro modelo, el modelo de recompensa. Lee una respuesta y devuelve un número, su puntuación: más alto cuanto más la prefieren las personas.',
      en: 'With many preferences, another model is trained: the reward model. It reads an answer and returns a number, its score: higher the more people prefer it.',
      note: { es: 'Modelo de recompensa: predice qué respuesta se prefiere.', en: 'Reward model: predicts which answer is preferred.' },
      pad: 0.3,
    },
    {
      id: 'rm-math',
      es: 'Se entrena con una regla simple: si la gente prefirió A sobre B, A debe puntuar más. La probabilidad de que A gane es la sigmoide de la diferencia de puntos.',
      en: 'It is trained with a simple rule: if people preferred A over B, A must score higher. The probability that A wins is the sigmoid of the difference in scores.',
      pad: 0.4,
    },
    {
      id: 'try-rm',
      es: 'Tu turno: elige la mejor respuesta en cinco pares. Un modelo de recompensa diminuto aprende de tus decisiones, y verás cuánto pesa para ti cada cualidad.',
      en: 'Your turn: choose the better answer in five pairs. A tiny reward model learns from your decisions, and you will see how much each quality weighs for you.',
      gate: {
        id: 'rm',
        prompt: { es: 'Elige una respuesta en los cinco pares.', en: 'Choose an answer in all five pairs.' },
      },
      pad: 0.4,
    },
    {
      id: 'rm-reveal',
      es: 'Ese es tu modelo de recompensa: un resumen numérico de lo que preferiste. No sabe qué es verdad; solo repite los gustos de quien lo entrenó.',
      en: 'That is your reward model: a numerical summary of what you preferred. It does not know what is true; it only repeats the tastes of whoever trained it.',
      pad: 0.3,
    },
    {
      id: 'rm-people',
      es: 'Y las personas no siempre coinciden. En InstructGPT, quienes etiquetaban estaban de acuerdo casi tres de cada cuatro veces, y el modelo aprende de todas esas decisiones a la vez.',
      en: 'And people do not always agree. In InstructGPT, the labelers agreed about three times out of four, and the model learns from all those decisions at once.',
      tts: {
        es: 'Y las personas no siempre coinciden. En Instruct ge pe te, quienes etiquetaban estaban de acuerdo casi tres de cada cuatro veces, y el modelo aprende de todas esas decisiones a la vez.',
        en: 'And people do not always agree. In Instruct G P T, the labelers agreed about three times out of four, and the model learns from all those decisions at once.',
      },
      pad: 0.3,
    },

    // ── 4 · refuerzo con retroalimentación humana ──
    {
      id: 'rl-idea',
      es: 'Ahora el modelo ajustado practica: escribe una respuesta, el modelo de recompensa la puntúa, y se corrige para que las respuestas bien puntuadas sean más probables.',
      en: 'Now the tuned model practices: it writes an answer, the reward model scores it, and the model corrects itself so that well-scored answers become more likely.',
      pad: 0.3,
    },
    {
      id: 'rl-name',
      es: 'Ese ciclo es el aprendizaje por refuerzo con retroalimentación humana, RLHF. Lo usó InstructGPT y, según OpenAI, también ChatGPT, presentado el treinta de noviembre de dos mil veintidós.',
      en: 'That loop is reinforcement learning from human feedback, RLHF. InstructGPT used it and, according to OpenAI, so did ChatGPT, introduced on November thirtieth, twenty twenty-two.',
      tts: {
        es: 'Ese ciclo es el aprendizaje por refuerzo con retroalimentación humana, erre ele hache efe. Lo usó Instruct ge pe te y, según Open ei ai, también Chat ge pe te, presentado el treinta de noviembre de dos mil veintidós.',
        en: 'That loop is reinforcement learning from human feedback, R L H F. Instruct G P T used it and, according to Open A I, so did Chat G P T, introduced on November thirtieth, twenty twenty-two.',
      },
      note: { es: 'RLHF: optimizar el modelo contra el modelo de recompensa.', en: 'RLHF: optimize the model against the reward model.' },
      pad: 0.3,
    },
    {
      id: 'kl',
      es: 'Hay una correa: una penalización por alejarse demasiado del modelo de partida, pensada para que no busque trucos que engañen al juez en lugar de mejorar.',
      en: 'There is a leash: a penalty for drifting too far from the starting model, meant to keep it from hunting for tricks that fool the judge instead of improving.',
      pad: 0.3,
    },
    {
      id: 'proxy',
      es: 'Pero la puntuación del modelo de recompensa es solo un sustituto. Lo que importa es la calidad real, que solo se mide con personas, y eso es caro.',
      en: 'But the reward model’s score is only a stand-in. What matters is real quality, which can only be measured with people, and that is expensive.',
      pad: 0.3,
    },
    {
      id: 'try-opt',
      es: 'Tu turno: sube la presión de optimización y mira las dos curvas. Busca el punto donde la calidad real es máxima, aunque la puntuación siga subiendo.',
      en: 'Your turn: raise the optimization pressure and watch the two curves. Find the point where real quality peaks, even while the score keeps rising.',
      gate: {
        id: 'opt',
        prompt: { es: 'Pasa del punto óptimo y vuelve a la presión con la mayor calidad real.', en: 'Go past the sweet spot, then return to the pressure with the highest real quality.' },
      },
      pad: 0.4,
    },
    {
      id: 'goodhart',
      es: 'Al apretar de más, el modelo aprende a agradar al juez, no a la gente: la puntuación sube y la calidad real cae. Es la ley de Goodhart; Gao y colaboradores la midieron con un modelo «de oro» como árbitro.',
      en: 'Squeeze too hard and the model learns to please the judge, not people: the score rises and real quality falls. That is Goodhart’s law; Gao and colleagues measured it with a “gold” model as the referee.',
      tts: {
        es: 'Al apretar de más, el modelo aprende a agradar al juez, no a la gente: la puntuación sube y la calidad real cae. Es la ley de Gud jart; Gao y colaboradores la midieron con un modelo «de oro» como árbitro.',
        en: 'Squeeze too hard and the model learns to please the judge, not people: the score rises and real quality falls. That is Goodhart’s law; Gao and colleagues measured it with a “gold” model as the referee.',
      },
      note: { es: 'Ley de Goodhart: optimizar un sustituto lo degrada.', en: 'Goodhart’s law: optimizing a proxy degrades it.' },
      pad: 0.5,
    },

    // ── 5 · DPO ──
    {
      id: 'dpo-problem',
      es: 'Este recorrido funciona, pero es complejo: un modelo de recompensa, un ciclo de refuerzo y muchas piezas que pueden volverse inestables.',
      en: 'This route works, but it is complex: a reward model, a reinforcement loop, and many pieces that can become unstable.',
      pad: 0.3,
    },
    {
      id: 'dpo-idea',
      es: 'La optimización directa de preferencias, DPO, publicada en dos mil veintitrés, usa las mismas parejas pero ajusta el modelo de forma directa, sin modelo de recompensa aparte ni refuerzo.',
      en: 'Direct preference optimization, DPO, published in twenty twenty-three, uses the same pairs but tunes the model directly, with no separate reward model and no reinforcement learning.',
      tts: {
        es: 'La optimización directa de preferencias, de pe o, publicada en dos mil veintitrés, usa las mismas parejas pero ajusta el modelo de forma directa, sin modelo de recompensa aparte ni refuerzo.',
        en: 'Direct preference optimization, D P O, published in twenty twenty-three, uses the same pairs but tunes the model directly, with no separate reward model and no reinforcement learning.',
      },
      note: { es: 'DPO: aprender de preferencias sin modelo de recompensa aparte.', en: 'DPO: learn from preferences without a separate reward model.' },
      pad: 0.4,
    },
    {
      id: 'dpo-how',
      es: 'Para cada pareja, sube la probabilidad de la respuesta preferida y baja la de la rechazada, respecto del modelo de partida. Es una pérdida de clasificación, como las de siempre.',
      en: 'For each pair, it raises the probability of the preferred answer and lowers that of the rejected one, relative to the starting model. It is a classification loss, like the usual ones.',
      pad: 0.4,
    },
    {
      id: 'dpo-secret',
      es: 'Y hay una sorpresa: ese cociente de probabilidades contiene la recompensa. El propio modelo es, en secreto, un modelo de recompensa. En este juguete, las dos rutas dan los mismos números.',
      en: 'And there is a twist: that probability ratio contains the reward. The model itself is, secretly, a reward model. In this toy, both routes give the very same numbers.',
      pad: 0.4,
    },

    // ── 6 · efectos secundarios y la capa de comportamiento ──
    {
      id: 'syco',
      es: 'Optimizar la aprobación humana puede tener un efecto secundario: la adulación. Si quienes juzgan tienden a preferir que les den la razón, el modelo puede aprender a dársela.',
      en: 'Optimizing for human approval can have a side effect: sycophancy. If judges tend to prefer being agreed with, the model can learn to agree.',
      note: { es: 'Adulación: decir lo que la persona quiere oír.', en: 'Sycophancy: telling people what they want to hear.' },
      pad: 0.3,
    },
    {
      id: 'syco-evidence',
      es: 'Un estudio de dos mil veintitrés halló adulación en cinco asistentes de IA, en distinto grado: cedían ante un «¿seguro?», adaptaban su opinión a la de la persona y copiaban sus errores.',
      en: 'A twenty twenty-three study found sycophancy in five AI assistants, to different degrees: they caved to “are you sure?”, adapted their opinion to the person’s, and copied their mistakes.',
      pad: 0.3,
    },
    {
      id: 'syco-case',
      es: 'En abril de dos mil veinticinco, OpenAI revirtió una actualización de GPT-4o por complaciente. Según su análisis preliminar, varios cambios a la vez, incluida una señal nueva de pulgares, debilitaron la principal.',
      en: 'In April twenty twenty-five, OpenAI rolled back a GPT-4o update for being too agreeable. Its early analysis says several changes together, including a new thumbs-up signal, weakened the primary one.',
      tts: {
        es: 'En abril de dos mil veinticinco, Open ei ai revirtió una actualización de ge pe te cuatro o por complaciente. Según su análisis preliminar, varios cambios a la vez, incluida una señal nueva de pulgares, debilitaron la principal.',
        en: 'In April twenty twenty-five, Open A I rolled back a G P T four o update for being too agreeable. Its early analysis says several changes together, including a new thumbs-up signal, weakened the primary one.',
      },
      pad: 0.3,
    },
    {
      id: 'refuse',
      es: 'El otro extremo es el rechazo. El asistente también aprende cuándo decir que no, y todo umbral cuesta algo: rechazar de más estorba, rechazar de menos permite daño.',
      en: 'The other extreme is refusal. The assistant also learns when to say no, and every threshold costs something: refusing too much gets in the way, refusing too little allows harm.',
      note: { es: 'Rechazos: cada umbral tiene un costo.', en: 'Refusals: every threshold has a cost.' },
      pad: 0.4,
    },
    {
      id: 'layer',
      es: 'Entonces, un asistente es el modelo base más una capa de comportamiento. En InstructGPT, entrenar esa capa costó menos del dos por ciento del cómputo de GPT-3, sin contar los datos.',
      en: 'So an assistant is the base model plus a layer of behavior. In InstructGPT, training that layer took less than two percent of the compute of GPT-3, not counting the data.',
      tts: {
        es: 'Entonces, un asistente es el modelo base más una capa de comportamiento. En Instruct ge pe te, entrenar esa capa costó menos del dos por ciento del cómputo de ge pe te tres, sin contar los datos.',
        en: 'So an assistant is the base model plus a layer of behavior. In Instruct G P T, training that layer took less than two percent of the compute of G P T three, not counting the data.',
      },
      note: { es: 'Asistente = modelo base + capa de comportamiento.', en: 'Assistant = base model + a behavior layer.' },
      pad: 0.4,
    },
    {
      id: 'layer-pref',
      es: 'Y la capa rindió: quienes evaluaron prefirieron las respuestas de un InstructGPT de mil trescientos millones de parámetros a las de GPT-3, con ciento setenta y cinco mil millones.',
      en: 'And the layer paid off: raters preferred the answers of an InstructGPT with one point three billion parameters to those of GPT-3, with one hundred seventy-five billion.',
      tts: {
        es: 'Y la capa rindió: quienes evaluaron prefirieron las respuestas de un Instruct ge pe te de mil trescientos millones de parámetros a las de ge pe te tres, con ciento setenta y cinco mil millones.',
        en: 'And the layer paid off: raters preferred the answers of an Instruct G P T with one point three billion parameters to those of G P T three, with one hundred seventy-five billion.',
      },
      pad: 0.4,
    },
    {
      id: 'who',
      es: 'Y esa capa tiene autores: quienes escribieron los ejemplos, quienes compararon respuestas y las reglas que recibieron. El tono, la longitud y lo que se rechaza son decisiones de producto.',
      en: 'And that layer has authors: whoever wrote the examples, whoever compared answers, and the rules they were given. Tone, length, and what gets refused are product decisions.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: el preentrenamiento da el conocimiento; el ajuste, el formato; las preferencias, con refuerzo o con DPO, afinan el criterio. Cada paso moldea sobre todo cómo responde.',
      en: 'In short: pretraining gives the knowledge; tuning gives the format; preferences, with reinforcement or with DPO, refine the judgment. Each step mostly shapes how it responds.',
      tts: {
        es: 'En resumen: el preentrenamiento da el conocimiento; el ajuste, el formato; las preferencias, con refuerzo o con de pe o, afinan el criterio. Cada paso moldea sobre todo cómo responde.',
        en: 'In short: pretraining gives the knowledge; tuning gives the format; preferences, with reinforcement or with D P O, refine the judgment. Each step mostly shapes how it responds.',
      },
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Un asistente ya responde con tono y criterio. Pero ¿puede pensar antes de responder? De eso trata la siguiente lección.',
      en: 'An assistant now answers with tone and judgment. But can it think before it answers? That is what the next lesson is about.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo base solo continúa texto. Para que atienda lo que la persona pide hace falta una capa de comportamiento: la alineación.',
      'El ajuste con instrucciones enseña el formato con ejemplos de respuesta ideal; las preferencias enseñan el criterio, porque comparar es más fácil que escribir.',
      'RLHF: un modelo de recompensa aprende de comparaciones humanas y el modelo se optimiza contra él, con una penalización KL que lo mantiene cerca del modelo de partida.',
      'DPO usa las mismas parejas de respuestas pero ajusta el modelo directamente: su cociente de probabilidades hace de modelo de recompensa.',
      'Optimizar un sustituto tiene costos: pasado cierto punto la puntuación sube y la calidad real cae, y la aprobación humana puede premiar la adulación.',
    ],
    en: [
      'A base model only continues text. For it to do what a person asks, it needs a layer of behavior: alignment.',
      'Instruction tuning teaches the format with examples of ideal answers; preferences teach the judgment, because comparing is easier than writing.',
      'RLHF: a reward model learns from human comparisons and the model is optimized against it, with a KL penalty that keeps it close to the starting model.',
      'DPO uses the same pairs of answers but tunes the model directly: its probability ratio acts as the reward model.',
      'Optimizing a stand-in has costs: past a certain point the score rises and real quality falls, and human approval can reward flattery.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un asistente como ChatGPT es un modelo distinto, entrenado desde cero para conversar.',
      en: 'An assistant like ChatGPT is a different model, trained from scratch to chat.',
    },
    right: {
      es: 'Es un modelo base preentrenado más una capa de comportamiento: ejemplos, preferencias y reglas. Esa capa cambia sobre todo cómo responde, y en InstructGPT entrenarla costó menos del dos por ciento del cómputo de GPT-3 (sin contar los datos).',
      en: 'It is a pretrained base model plus a layer of behavior: examples, preferences, and rules. That layer mostly changes how it responds, and in InstructGPT training it took less than two percent of the compute of GPT-3 (not counting the data).',
    },
  },

  deeper: {
    es: `## Del texto a las instrucciones: el ajuste supervisado (SFT)

Con pares (indicación $x$, respuesta ideal $y$), el ajuste con instrucciones minimiza la entropía cruzada **solo sobre los tokens de la respuesta**:

$$\\mathcal{L}_{\\text{SFT}}(\\theta) = -\\sum_{t \\in \\text{respuesta}} \\log \\pi_\\theta\\,(y_t \\mid x,\\, y_{<t})$$

Los tokens de la indicación no aportan error (la «máscara de pérdida» de la escena). Es la misma pérdida de la lección 19, con otros datos. InstructGPT usó unas 13 mil indicaciones con demostraciones escritas por unas 40 personas contratadas (Ouyang et al., 2022). Antes, FLAN (Wei et al., 2021) había convertido decenas de conjuntos de datos de PLN en instrucciones, y después LIMA (Zhou et al., 2023) ajustó un modelo de 65 mil millones de parámetros con solo mil ejemplos cuidadosamente elegidos, para argumentar que casi todo el conocimiento se aprende en el preentrenamiento y el ajuste enseña sobre todo el formato.

Un matiz: la frontera entre «base» y «asistente» se ha vuelto borrosa. El informe técnico de Qwen2.5 (2024) cuenta que su preentrenamiento ya usa datos sintéticos generados por modelos instruidos y filtros basados en modelos de recompensa. Por eso, con ese modelo base no se ve el contraste, y la escena usa otro par: TinyLlama 1.1B base (punto de control de 3 billones de tokens) y TinyLlama-1.1B-Chat-v1.0, que según su ficha se ajustó con UltraChat (diálogos sintéticos) y luego se alineó con DPO sobre UltraFeedback (64 mil indicaciones con respuestas ordenadas por GPT-4). Es un modelo pequeño, entrenado sobre todo en inglés, y su asistente es imperfecto: en la escena, el correo «de dos líneas» no sale en dos líneas.

## El modelo de recompensa (Bradley–Terry)

Si $y_w$ es la respuesta preferida y $y_l$ la rechazada para la indicación $x$, el modelo de preferencias de Bradley–Terry supone

$$P(y_w \\succ y_l \\mid x) = \\sigma\\big(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\big)$$

y el modelo de recompensa $r_\\phi$ se entrena minimizando $-\\mathbb{E}\\,\\log \\sigma\\big(r_\\phi(x,y_w) - r_\\phi(x,y_l)\\big)$. La puntuación solo importa por sus diferencias: sumarle una constante no cambia nada. En InstructGPT, quienes etiquetaban ordenaban entre 4 y 9 respuestas por indicación, lo que da $\\binom{K}{2}$ comparaciones, y el modelo de recompensa tenía 6 mil millones de parámetros, sin la última capa del modelo y con una salida escalar (el texto principal dice que partía del modelo ajustado; el apéndice C.2, que de un GPT-3 de 6 mil millones ajustado con datos públicos). La idea de aprender una recompensa a partir de comparaciones humanas viene de Christiano et al. (2017), que la usó en juegos de Atari y robots simulados con retroalimentación en menos del 1 % de las interacciones; Stiennon et al. (2020) la aplicó a resúmenes de texto, e InstructGPT, a instrucciones generales. Las preferencias tampoco tienen que venir siempre de personas: Constitutional AI (Bai et al., 2022) sustituye las etiquetas humanas sobre qué es dañino por una lista de principios escritos, de modo que el modelo critica y revisa sus respuestas y compara pares según esos principios (RLAIF); la utilidad sigue entrenándose con preferencias humanas. En la escena, $r(y)=\\mathbf{w}\\cdot\\boldsymbol{\\varphi}(y)$ con solo cuatro rasgos asignados a mano, y $\\mathbf{w}$ se ajusta con regresión logística con una pequeña regularización L2.

## Optimización con penalización KL (RLHF)

El modelo $\\pi_\\theta$ se ajusta para maximizar la recompensa sin alejarse del modelo de partida $\\pi_{\\text{ref}}$:

$$\\max_{\\pi_\\theta}\\; \\mathbb{E}_{x,\\,y\\sim\\pi_\\theta}\\big[r_\\phi(x,y)\\big] - \\beta\\, D_{\\mathrm{KL}}\\big(\\pi_\\theta(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot\\mid x)\\big)$$

Su solución exacta tiene forma cerrada:

$$\\pi^*(y\\mid x) = \\frac{1}{Z(x)}\\,\\pi_{\\text{ref}}(y\\mid x)\\,\\exp\\!\\Big(\\tfrac{1}{\\beta}\\,r(x,y)\\Big)$$

La escena calcula exactamente esa distribución (con $1/\\beta$ como «presión de optimización»); en la práctica se aproxima con algoritmos de refuerzo como PPO. InstructGPT aplicó una penalización KL por token respecto del modelo ajustado y, además, mezcló gradientes del preentrenamiento (PPO-ptx) para reducir el «impuesto de alineación», las caídas de rendimiento en algunas tareas públicas.

## Optimizar de más: la ley de Goodhart

Como $r_\\phi$ es un sustituto imperfecto, optimizarlo demasiado perjudica la calidad real. Gao, Schulman y Hilton (2022) lo midieron con un modelo «de oro» que hacía de humano: con $d=\\sqrt{D_{\\mathrm{KL}}}$, ajustaron $R_{\\text{bon}}(d)=d(\\alpha-\\beta d)$ para la selección del mejor de $n$ y $R_{\\text{RL}}(d)=d(\\alpha-\\beta\\log d)$ para el refuerzo. En su montaje de refuerzo, la penalización KL no mejoró de forma medible la frontera entre puntuación real y KL (con la salvedad de que el resultado podría ser sensible a los hiperparámetros): sirve sobre todo para decidir hasta dónde llegar. En el juguete de la escena los rasgos son independientes, y el óptimo conserva esa independencia: la probabilidad de cada rasgo pasa a ser $\\sigma(\\operatorname{logit} q_j + w_j/\\beta)$. La calidad real sube mientras domina el rasgo «correcta» y baja cuando los sesgos del modelo de recompensa («larga», «da la razón») terminan de saturarse.

## DPO: el modelo es, en secreto, un modelo de recompensa

Despejando $r$ de la solución cerrada, $r(x,y)=\\beta\\log\\frac{\\pi^*(y\\mid x)}{\\pi_{\\text{ref}}(y\\mid x)}+\\beta\\log Z(x)$. Como Bradley–Terry solo depende de diferencias, $Z(x)$ se cancela, y la pérdida pasa a depender solo del modelo (Rafailov et al., 2023):

$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}\\,\\log\\sigma\\!\\Big(\\beta\\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta\\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\Big)$$

La «recompensa implícita» es $\\hat r_\\theta=\\beta\\log(\\pi_\\theta/\\pi_{\\text{ref}})$. No hace falta muestrear del modelo durante el ajuste: se parte de un conjunto fijo de parejas. En la escena, la familia de políticas es $\\pi_\\delta\\propto\\pi_{\\text{ref}}\\,e^{\\delta\\cdot\\varphi}$, y con la misma regularización los pesos $\\beta\\,\\delta$ coinciden con los del modelo de recompensa: es un caso exacto de la equivalencia. En un modelo real es una aproximación, porque el modelo no puede representar cualquier política. Con preferencias ordenadas por otro modelo (GPT-4) en lugar de personas, Zephyr (2023) obtuvo un asistente competente sin anotación humana nueva, aunque dependió de un modelo ya alineado como maestro.

Qué publican los laboratorios: OpenAI dice que ChatGPT se entrenó con RLHF con los métodos de InstructGPT. Llama 2 usó RLHF con muestreo por rechazo y PPO (Touvron et al., 2023); Llama 3 usó ajuste supervisado, muestreo por rechazo y DPO, y explica que los algoritmos de refuerzo más complejos eran menos estables y más difíciles de escalar (Llama Team, 2024). De otros asistentes comerciales no se publica la receta completa: no la des por supuesta.

## Cuánto cuesta la capa

El «menos del 2 %» de la lección sale del propio artículo de InstructGPT: entrenar el modelo ajustado de 175 mil millones costó 4,9 petaflops/s-día, y el modelo final con PPO-ptx, 60, frente a 3 640 de GPT-3 (60 / 3 640 ≈ 1,6 %; con los 4,9, ≈ 1,8 %). No incluye el modelo de recompensa de 6 mil millones, la recolección de datos ni las pruebas previas. En esas comparaciones, las personas prefirieron las salidas del InstructGPT de 175 mil millones a las de GPT-3 en el 85 % de los casos (±3), y las del de 1,3 mil millones a las del GPT-3 de 175 mil millones.

## En código

\`\`\`python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# 1) Modelo de recompensa (Bradley–Terry): puntuaciones de la respuesta preferida y de la rechazada
r_pref, r_rech = 1.8, -1.1
p = sigmoid(r_pref - r_rech)               # probabilidad de que la preferida gane
print(round(p, 3), round(-math.log(p), 3))

# 2) Óptimo con penalización KL: pi*(y) ∝ pi_ref(y) · exp(r(y) / beta), con tres respuestas posibles
pi_ref = [0.6, 0.3, 0.1]
r = [0.0, 1.0, 3.0]
for beta in (10.0, 1.0, 0.25):
    w = [q * math.exp(ri / beta) for q, ri in zip(pi_ref, r)]
    z = sum(w)
    print(beta, [round(x / z, 3) for x in w])

# 3) DPO: la misma pérdida, pero con log-probabilidades del modelo en lugar de puntuaciones
beta = 0.1
logp_w, logp_l = -12.0, -15.0              # log pi_theta de la preferida y de la rechazada
ref_w, ref_l = -12.5, -14.0                # log pi_ref
margen = beta * ((logp_w - ref_w) - (logp_l - ref_l))
print(round(-math.log(sigmoid(margen)), 3))
\`\`\`

Salida esperada:

\`\`\`
0.948 0.054
10.0 [0.563, 0.311, 0.127]
1.0 [0.175, 0.238, 0.587]
0.25 [0.0, 0.001, 0.999]
0.621
\`\`\`

Con $\\beta$ grande el modelo casi no se mueve; con $\\beta$ pequeño casi toda la probabilidad se concentra en la respuesta mejor puntuada (pierde variedad).

## Lo que viene

Todo esto moldea el comportamiento a partir de preferencias. La siguiente lección usa la misma maquinaria de refuerzo, pero con recompensas que se pueden **verificar** (la respuesta de un problema de matemáticas es correcta o no) para enseñar al modelo a razonar antes de responder.`,
    en: `## From text to instructions: supervised fine-tuning (SFT)

With pairs (prompt $x$, ideal answer $y$), instruction tuning minimizes cross-entropy **only over the answer tokens**:

$$\\mathcal{L}_{\\text{SFT}}(\\theta) = -\\sum_{t \\in \\text{answer}} \\log \\pi_\\theta\\,(y_t \\mid x,\\, y_{<t})$$

The prompt tokens contribute no error (the “loss mask” in the scene). It is the same loss as in lesson 19, with different data. InstructGPT used about 13 thousand prompts with demonstrations written by about 40 contractors (Ouyang et al., 2022). Earlier, FLAN (Wei et al., 2021) had turned dozens of NLP datasets into instructions, and later LIMA (Zhou et al., 2023) fine-tuned a 65-billion-parameter model on only a thousand carefully chosen examples, to argue that almost all knowledge is learned in pretraining and tuning mostly teaches the format.

A caveat: the line between “base” and “assistant” has become blurry. The Qwen2.5 technical report (2024) says its pretraining already uses synthetic data generated by instruction-tuned models and filters based on reward models. That is why, with that base model, the contrast does not show, and the scene uses a different pair: TinyLlama 1.1B base (the 3-trillion-token checkpoint) and TinyLlama-1.1B-Chat-v1.0, which according to its model card was fine-tuned on UltraChat (synthetic dialogues) and then aligned with DPO on UltraFeedback (64 thousand prompts with answers ranked by GPT-4). It is a small model trained mostly on English, and its assistant is imperfect: in the scene, the “two-line” email does not come out in two lines.

## The reward model (Bradley–Terry)

If $y_w$ is the preferred answer and $y_l$ the rejected one for prompt $x$, the Bradley–Terry preference model assumes

$$P(y_w \\succ y_l \\mid x) = \\sigma\\big(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\big)$$

and the reward model $r_\\phi$ is trained by minimizing $-\\mathbb{E}\\,\\log \\sigma\\big(r_\\phi(x,y_w) - r_\\phi(x,y_l)\\big)$. The score only matters through its differences: adding a constant changes nothing. In InstructGPT, labelers ranked between 4 and 9 answers per prompt, which gives $\\binom{K}{2}$ comparisons, and the reward model had 6 billion parameters, without the model’s last layer and with a scalar output (the main text says it started from the tuned model; Appendix C.2 says from a 6-billion-parameter GPT-3 fine-tuned on public data). The idea of learning a reward from human comparisons comes from Christiano et al. (2017), who used it in Atari games and simulated robots with feedback on under 1% of the interactions; Stiennon et al. (2020) applied it to text summaries, and InstructGPT to general instructions. Preferences do not always have to come from people, either: Constitutional AI (Bai et al., 2022) replaces human labels about what is harmful with a written list of principles, so the model critiques and revises its answers and compares pairs against those principles (RLAIF); helpfulness is still trained on human preferences. In the scene, $r(y)=\\mathbf{w}\\cdot\\boldsymbol{\\varphi}(y)$ with only four hand-assigned traits, and $\\mathbf{w}$ is fit by logistic regression with a small L2 penalty.

## Optimizing with a KL penalty (RLHF)

The model $\\pi_\\theta$ is tuned to maximize the reward without straying from the starting model $\\pi_{\\text{ref}}$:

$$\\max_{\\pi_\\theta}\\; \\mathbb{E}_{x,\\,y\\sim\\pi_\\theta}\\big[r_\\phi(x,y)\\big] - \\beta\\, D_{\\mathrm{KL}}\\big(\\pi_\\theta(\\cdot\\mid x)\\,\\|\\,\\pi_{\\text{ref}}(\\cdot\\mid x)\\big)$$

Its exact solution has a closed form:

$$\\pi^*(y\\mid x) = \\frac{1}{Z(x)}\\,\\pi_{\\text{ref}}(y\\mid x)\\,\\exp\\!\\Big(\\tfrac{1}{\\beta}\\,r(x,y)\\Big)$$

The scene computes exactly that distribution (with $1/\\beta$ as the “optimization pressure”); in practice it is approximated with reinforcement learning algorithms such as PPO. InstructGPT applied a per-token KL penalty relative to the tuned model and also mixed in pretraining gradients (PPO-ptx) to reduce the “alignment tax,” the performance drops on some public tasks.

## Optimizing too much: Goodhart’s law

Because $r_\\phi$ is an imperfect stand-in, optimizing it too hard hurts real quality. Gao, Schulman, and Hilton (2022) measured it with a “gold” reward model standing in for humans: with $d=\\sqrt{D_{\\mathrm{KL}}}$, they fit $R_{\\text{bon}}(d)=d(\\alpha-\\beta d)$ for best-of-$n$ sampling and $R_{\\text{RL}}(d)=d(\\alpha-\\beta\\log d)$ for reinforcement learning. In their RL setup, the KL penalty did not measurably improve the frontier between gold score and KL (with the caveat that the result could be sensitive to hyperparameters): it mainly serves to decide how far to go. In the scene’s toy the traits are independent and the optimum preserves that independence: the probability of each trait becomes $\\sigma(\\operatorname{logit} q_j + w_j/\\beta)$. Real quality rises while the “correct” trait dominates and falls once the reward model’s biases (“long,” “agrees”) finish saturating.

## DPO: the model is secretly a reward model

Solving the closed form for $r$ gives $r(x,y)=\\beta\\log\\frac{\\pi^*(y\\mid x)}{\\pi_{\\text{ref}}(y\\mid x)}+\\beta\\log Z(x)$. Since Bradley–Terry depends only on differences, $Z(x)$ cancels and the loss depends only on the model (Rafailov et al., 2023):

$$\\mathcal{L}_{\\text{DPO}} = -\\mathbb{E}\\,\\log\\sigma\\!\\Big(\\beta\\log\\frac{\\pi_\\theta(y_w\\mid x)}{\\pi_{\\text{ref}}(y_w\\mid x)} - \\beta\\log\\frac{\\pi_\\theta(y_l\\mid x)}{\\pi_{\\text{ref}}(y_l\\mid x)}\\Big)$$

The “implicit reward” is $\\hat r_\\theta=\\beta\\log(\\pi_\\theta/\\pi_{\\text{ref}})$. No sampling from the model is needed during tuning: you start from a fixed set of pairs. In the scene, the policy family is $\\pi_\\delta\\propto\\pi_{\\text{ref}}\\,e^{\\delta\\cdot\\varphi}$, and with the same regularization the weights $\\beta\\,\\delta$ coincide with the reward model’s: an exact case of the equivalence. In a real model it is an approximation, because the model cannot represent every possible policy. With preferences ranked by another model (GPT-4) instead of people, Zephyr (2023) produced a competent assistant without new human annotation, though it depended on an already aligned model as its teacher.

What the labs publish: OpenAI says ChatGPT was trained with RLHF using the same methods as InstructGPT. Llama 2 used RLHF with rejection sampling and PPO (Touvron et al., 2023); Llama 3 used supervised fine-tuning, rejection sampling, and DPO, and explains that more complex reinforcement algorithms were less stable and harder to scale (Llama Team, 2024). For other commercial assistants the full recipe is not published: do not assume it.

## What the layer costs

The lesson’s “under 2%” comes from the InstructGPT paper itself: training the 175-billion-parameter tuned model took 4.9 petaflops/s-days, and the final PPO-ptx model, 60, versus 3,640 for GPT-3 (60 / 3,640 ≈ 1.6%; with the 4.9, ≈ 1.8%). It does not include the 6-billion-parameter reward model, data collection, or earlier experiments. In those comparisons, people preferred the outputs of the 175-billion-parameter InstructGPT to those of GPT-3 in 85% of cases (±3), and those of the 1.3-billion-parameter one to those of the 175-billion-parameter GPT-3.

## In code

\`\`\`python
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

# 1) Reward model (Bradley–Terry): scores of the preferred and the rejected answer
r_pref, r_rej = 1.8, -1.1
p = sigmoid(r_pref - r_rej)                # probability that the preferred one wins
print(round(p, 3), round(-math.log(p), 3))

# 2) KL-penalized optimum: pi*(y) ∝ pi_ref(y) · exp(r(y) / beta), with three possible answers
pi_ref = [0.6, 0.3, 0.1]
r = [0.0, 1.0, 3.0]
for beta in (10.0, 1.0, 0.25):
    w = [q * math.exp(ri / beta) for q, ri in zip(pi_ref, r)]
    z = sum(w)
    print(beta, [round(x / z, 3) for x in w])

# 3) DPO: the same loss, but with the model's log-probabilities instead of scores
beta = 0.1
logp_w, logp_l = -12.0, -15.0              # log pi_theta of the preferred and the rejected answer
ref_w, ref_l = -12.5, -14.0                # log pi_ref
margin = beta * ((logp_w - ref_w) - (logp_l - ref_l))
print(round(-math.log(sigmoid(margin)), 3))
\`\`\`

Expected output:

\`\`\`
0.948 0.054
10.0 [0.563, 0.311, 0.127]
1.0 [0.175, 0.238, 0.587]
0.25 [0.0, 0.001, 0.999]
0.621
\`\`\`

With a large $\\beta$ the model barely moves; with a small $\\beta$ almost all the probability piles onto the best-scored answer (it loses variety).

## What comes next

All of this shapes behavior from preferences. The next lesson uses the same reinforcement machinery, but with rewards that can be **verified** (the answer to a math problem is right or wrong) to teach the model to reason before it answers.`,
  },

  lens: {
    es: [
      'Pregunta quién calibró el modelo. Las preferencias de quienes lo evaluaron quedan incorporadas: en InstructGPT fueron unas cuarenta personas contratadas, en su mayoría angloparlantes de Estados Unidos y el sudeste asiático, que coincidían entre sí unas tres de cada cuatro veces. Pide saber quiénes, cuántas, en qué idiomas y con qué instrucciones.',
      'Tono, longitud, grado de rechazo y complacencia son decisiones de producto, no hechos técnicos. Pide la política de comportamiento por escrito (algunas empresas la publican, como el Model Spec de OpenAI) y cómo comprueban que el modelo la cumple.',
      'Cada actualización del proveedor puede cambiar el comportamiento sin cambiar el nombre del modelo. En abril de 2025 se revirtió una actualización de GPT-4o por exceso de complacencia; según el análisis preliminar de OpenAI, influyó una combinación de cambios, entre ellos una señal de recompensa nueva. Mantén casos de prueba propios (adulación, rechazos, tono) y córrelos antes de adoptar cada versión.',
      '«Optimizado con retroalimentación humana» no garantiza veracidad: se optimizó una puntuación que aproxima el gusto de las personas. Pide evaluaciones independientes de esa puntuación (lección 34) y recuerda que alinear moldea el comportamiento, no elimina las alucinaciones (lección 33).',
    ],
    en: [
      'Ask who calibrated the model. The preferences of the people who rated it get baked in: for InstructGPT it was about forty contractors, mostly English speakers in the United States or Southeast Asia, who agreed with each other about three times out of four. Ask who they were, how many, in which languages, and with what instructions.',
      'Tone, length, degree of refusal, and agreeableness are product decisions, not technical facts. Ask for the behavior policy in writing (some companies publish theirs, like OpenAI’s Model Spec) and how they check that the model follows it.',
      'Every provider update can change behavior without changing the model’s name. In April 2025 a GPT-4o update was rolled back for being too agreeable; according to OpenAI’s early analysis, a combination of changes played a part, including a new reward signal. Keep your own test cases (sycophancy, refusals, tone) and run them before adopting each version.',
      '“Optimized with human feedback” does not guarantee truthfulness: what was optimized is a score that approximates people’s taste. Ask for evaluations independent of that score (lesson 34), and remember that alignment shapes behavior, it does not remove hallucinations (lesson 33).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué un modelo base no responde como un asistente?', en: 'Why does a base model not answer like an assistant?' },
      options: [
        { es: 'Porque no sabe suficientes datos.', en: 'Because it does not know enough facts.' },
        { es: 'Porque su arquitectura no permite conversar.', en: 'Because its architecture does not allow conversation.' },
        { es: 'Porque se entrenó para continuar texto, no para atender lo que la persona pretende.', en: 'Because it was trained to continue text, not to serve what the person intends.' },
        { es: 'Porque solo funciona con preguntas cortas.', en: 'Because it only works with short questions.' },
      ],
      answer: 2,
      why: {
        es: 'El preentrenamiento optimiza la predicción del siguiente token. Ayudar, ser veraz y no dañar son otros objetivos, y se enseñan después, con ejemplos, preferencias y reglas.',
        en: 'Pretraining optimizes next-token prediction. Being helpful, honest, and harmless are other objectives, taught afterwards with examples, preferences, and rules.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué es un modelo de recompensa?', en: 'What is a reward model?' },
      options: [
        { es: 'Un modelo que puntúa respuestas imitando cuál preferirían las personas.', en: 'A model that scores answers by imitating which one people would prefer.' },
        { es: 'El modelo que escribe las respuestas finales que ve el usuario.', en: 'The model that writes the final answers the user sees.' },
        { es: 'Una base de datos con las respuestas correctas.', en: 'A database of the correct answers.' },
        { es: 'Un filtro que borra las respuestas ofensivas.', en: 'A filter that deletes offensive answers.' },
      ],
      answer: 0,
      why: {
        es: 'Se entrena con comparaciones entre pares de respuestas y devuelve un número. Es un sustituto del juicio humano: sirve para optimizar, pero hereda los gustos y los errores de quienes compararon.',
        en: 'It is trained on comparisons between pairs of answers and returns a number. It is a stand-in for human judgment: it works for optimizing, but it inherits the tastes and mistakes of those who compared.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un modelo de recompensa puntúa la respuesta A con 2 y la B con 0. Según la regla de Bradley–Terry, ¿cuál es la probabilidad de que A sea la preferida?',
        en: 'A reward model scores answer A with 2 and answer B with 0. By the Bradley–Terry rule, what is the probability that A is the preferred one?',
      },
      options: [
        { es: '0,50', en: '0.50' },
        { es: '0,88', en: '0.88' },
        { es: '0,98', en: '0.98' },
        { es: '0,12', en: '0.12' },
      ],
      answer: 1,
      why: {
        es: 'P = σ(2 − 0) = 1 / (1 + e⁻²) ≈ 0,88. Con diferencia 0 sería 0,50; con diferencia 4 ya sería 0,98; y 0,12 es la probabilidad de que gane B.',
        en: 'P = σ(2 − 0) = 1 / (1 + e⁻²) ≈ 0.88. With a difference of 0 it would be 0.50; with a difference of 4 it would already be 0.98; and 0.12 is the probability that B wins.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Tras una actualización que añadió los «me gusta» de los usuarios como señal de entrenamiento, tu asistente interno empieza a darles la razón aunque se equivoquen. ¿Qué haces primero?',
        en: 'After an update that added users’ thumbs-up as a training signal, your in-house assistant starts agreeing with users even when they are wrong. What do you do first?',
      },
      options: [
        { es: 'Comprar más GPUs para reentrenar.', en: 'Buy more GPUs to retrain.' },
        { es: 'Subir la temperatura de muestreo.', en: 'Raise the sampling temperature.' },
        { es: 'Cambiar a un modelo con más parámetros.', en: 'Switch to a model with more parameters.' },
        { es: 'Medir la adulación con casos de prueba propios y revisar cuánto pesa la señal nueva frente a las demás.', en: 'Measure sycophancy with your own test cases and review how much the new signal weighs against the others.' },
      ],
      answer: 3,
      why: {
        es: 'Es el patrón de la ley de Goodhart: optimizar una señal que premia lo agradable puede desplazar lo veraz. Más cómputo, más temperatura o más parámetros no corrigen una señal mal ponderada; hay que medir el comportamiento y ajustar la mezcla.',
        en: 'It is the Goodhart pattern: optimizing a signal that rewards what is pleasant can displace what is true. More compute, more temperature, or more parameters do not fix a badly weighted signal; you have to measure the behavior and adjust the mix.',
      },
    },
  ],

  glossary: ['pretraining', 'base-model', 'fine-tuning', 'language-model', 'token', 'loss', 'sigmoid', 'instruction-tuning', 'alignment', 'reward-model', 'rlhf', 'dpo', 'sycophancy'],

  terms: [
    { id: 'instruction-tuning', term: { es: 'Ajuste con instrucciones', en: 'Instruction tuning' }, def: { es: 'Ajuste fino supervisado de un modelo base con pares de indicación y respuesta ideal escritos por personas, para que trate lo que se le pide como una petición y no como el comienzo de un texto.', en: 'Supervised fine-tuning of a base model on pairs of a prompt and an ideal answer written by people, so that it treats what it is asked as a request rather than as the start of a text.' } },
    { id: 'reward-model', term: { es: 'Modelo de recompensa', en: 'Reward model' }, def: { es: 'Modelo entrenado con comparaciones entre pares de respuestas que devuelve una puntuación: más alta cuanto más probable es que las personas prefieran la respuesta. Sustituye al juicio humano al optimizar.', en: 'A model trained on comparisons between pairs of answers that returns a score: higher the more likely people are to prefer the answer. It stands in for human judgment during optimization.' } },
    { id: 'rlhf', term: { es: 'RLHF (aprendizaje por refuerzo con retroalimentación humana)', en: 'RLHF (reinforcement learning from human feedback)' }, def: { es: 'Ajusta un modelo para que sus respuestas obtengan más puntuación de un modelo de recompensa entrenado con preferencias humanas, con una penalización que lo mantiene cerca del modelo de partida.', en: 'Tunes a model so that its answers earn higher scores from a reward model trained on human preferences, with a penalty that keeps it close to the starting model.' } },
    { id: 'dpo', term: { es: 'DPO (optimización directa de preferencias)', en: 'DPO (direct preference optimization)' }, def: { es: 'Método que aprende de pares de respuestas (preferida y rechazada) ajustando el modelo directamente con una pérdida de clasificación, sin entrenar un modelo de recompensa aparte ni usar refuerzo.', en: 'A method that learns from pairs of answers (preferred and rejected) by tuning the model directly with a classification loss, without training a separate reward model or using reinforcement learning.' } },
    { id: 'alignment', term: { es: 'Alineación', en: 'Alignment' }, def: { es: 'Técnicas para que un modelo haga lo que la persona pretende y sea útil, veraz e inofensivo, y no solo lo más probable según su texto de entrenamiento.', en: 'Techniques to get a model to do what the person intends and be helpful, honest, and harmless, not just whatever is most likely given its training text.' } },
    { id: 'sycophancy', term: { es: 'Adulación (sycophancy)', en: 'Sycophancy' }, def: { es: 'Tendencia de un asistente a decir lo que la persona quiere oír, como darle la razón o elogiar su trabajo aunque esté equivocada. En parte es un efecto de optimizar la aprobación humana.', en: 'An assistant’s tendency to tell people what they want to hear, such as agreeing with them or praising their work even when they are wrong. In part it is an effect of optimizing for human approval.' } },
  ],

  sources: [
    { title: 'Training language models to follow instructions with human feedback', authors: 'Ouyang, L., Wu, J., Jiang, X., et al.', year: 2022, url: 'https://arxiv.org/abs/2203.02155' },
    { title: 'Direct Preference Optimization: Your Language Model Is Secretly a Reward Model', authors: 'Rafailov, R., Sharma, A., Mitchell, E., Ermon, S., Manning, C. D., Finn, C.', year: 2023, url: 'https://arxiv.org/abs/2305.18290' },
    { title: 'Deep Reinforcement Learning from Human Preferences', authors: 'Christiano, P. F., Leike, J., Brown, T. B., Martic, M., Legg, S., Amodei, D.', year: 2017, url: 'https://arxiv.org/abs/1706.03741' },
    { title: 'Learning to Summarize from Human Feedback', authors: 'Stiennon, N., Ouyang, L., Wu, J., et al.', year: 2020, url: 'https://arxiv.org/abs/2009.01325' },
    { title: 'Scaling Laws for Reward Model Overoptimization', authors: 'Gao, L., Schulman, J., Hilton, J.', year: 2022, url: 'https://arxiv.org/abs/2210.10760' },
    { title: 'Towards Understanding Sycophancy in Language Models', authors: 'Sharma, M., Tong, M., Korbak, T., et al.', year: 2023, url: 'https://arxiv.org/abs/2310.13548' },
    { title: 'ChatGPT: Optimizing Language Models for Dialogue', authors: 'OpenAI', year: 2022, url: 'https://openai.com/index/chatgpt/' },
    { title: 'Expanding on what we missed with sycophancy', authors: 'OpenAI', year: 2025, url: 'https://openai.com/index/expanding-on-sycophancy/' },
    { title: 'Introducing the Model Spec', authors: 'OpenAI', year: 2024, url: 'https://openai.com/index/introducing-the-model-spec/' },
    { title: 'Zephyr: Direct Distillation of LM Alignment', authors: 'Tunstall, L., Beeching, E., Lambert, N., et al.', year: 2023, url: 'https://arxiv.org/abs/2310.16944' },
    { title: 'TinyLlama: An Open-Source Small Language Model', authors: 'Zhang, P., Zeng, G., Wang, T., Lu, W.', year: 2024, url: 'https://arxiv.org/abs/2401.02385' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B., Mann, B., Ryder, N., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Finetuned Language Models Are Zero-Shot Learners', authors: 'Wei, J., Bosma, M., Zhao, V. Y., et al.', year: 2021, url: 'https://arxiv.org/abs/2109.01652' },
    { title: 'LIMA: Less Is More for Alignment', authors: 'Zhou, C., Liu, P., Xu, P., et al.', year: 2023, url: 'https://arxiv.org/abs/2305.11206' },
    { title: 'Qwen2.5 Technical Report', authors: 'Qwen Team', year: 2024, url: 'https://arxiv.org/abs/2412.15115' },
    { title: 'Constitutional AI: Harmlessness from AI Feedback', authors: 'Bai, Y., Kadavath, S., Kundu, S., et al.', year: 2022, url: 'https://arxiv.org/abs/2212.08073' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: 'Touvron, H., Martin, L., Stone, K., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
  ],
});
