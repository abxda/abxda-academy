import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «GPT-3», «ChatGPT»,
// «word2vec», «o1» o «MCP», y la voz dice «ge pe te tres», «chat ge pe te», «uord tu vec», «o uno» o «eme ce pe».
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/ChatGPT/g, 'chat ge pe te'], [/GPT-3/g, 'ge pe te tres'], [/word2vec/g, 'uord tu vec'], [/\bo1\b/g, 'o uno'], [/\bMCP\b/g, 'eme ce pe'],
    [/«Attention Is All You Need»/g, '«Atenshon is ol iu nid»'], [/Stable Diffusion/g, 'Stéibol Difiúshon'], [/Papert/g, 'Pápert'],
    [/OpenAI/g, 'Open ei ai'], [/\bRAG\b/g, 'rag'],
  ],
  en: [
    [/ChatGPT/g, 'Chat G P T'], [/GPT-3/g, 'G P T three'], [/word2vec/g, 'word to vec'], [/\bo1\b/g, 'o one'], [/\bMCP\b/g, 'M C P'],
    [/OpenAI/g, 'Open A I'],
  ],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'mapa-completo',

  objectives: {
    es: [
      'Recorrer el camino completo del curso, de los datos a la estrategia, y decir en una frase la idea de cada módulo y de cada lección.',
      'Ubicar en una línea de tiempo los hitos principales, de la neurona de 1943 a ChatGPT y los agentes, y explicar por qué el despegue llegó con la escala.',
      'Usar diez preguntas concretas ante cualquier equipo o proveedor de IA, y reconocer de qué lección sale cada una.',
    ],
    en: [
      'Walk the course’s whole path, from data to strategy, and state in one sentence the idea of each module and each lesson.',
      'Place the main milestones on a timeline, from the 1943 neuron to ChatGPT and agents, and explain why the takeoff came with scale.',
      'Use ten concrete questions with any AI team or vendor, and recognize which lesson each one comes from.',
    ],
  },

  segments: ([
    // ── 1 · el final del camino ──
    {
      id: 'hook',
      es: 'En la primera lección te pedimos explicarle a una computadora cómo sabes si un correo es spam. Treinta y seis lecciones después, sabes cómo escribe un chatbot.',
      en: 'In the first lesson, we asked you to explain to a computer how you know an email is spam. Thirty-six lessons later, you know how a chatbot writes.',
      pad: 0.3,
    },
    {
      id: 'plan',
      es: 'Esta última lección junta todo: el camino completo en un mapa, cuándo pasó cada cosa, y diez preguntas para usar lo aprendido en la vida real.',
      en: 'This last lesson puts it all together: the whole path on one map, when each thing happened, and ten questions to use what you learned in real life.',
      pad: 0.3,
    },

    // ── 2 · el mapa, módulo por módulo ──
    {
      id: 'map-dots',
      es: 'Empecemos por el mapa. Cada punto es una lección, con su número: del uno, programar o aprender, al treinta y seis, estrategia. El marcador del final es esta lección.',
      en: 'Let’s start with the map. Each dot is a lesson, with its number: from one, programming or learning, to thirty-six, strategy. The marker at the end is this lesson.',
      pad: 0.5,
    },
    {
      id: 'map-groups',
      es: 'Las lecciones se agrupan en ocho módulos, cada uno con su nombre. Se recorren en orden, como se lee: de izquierda a derecha y de arriba abajo.',
      en: 'The lessons are grouped into eight modules, each with its name. You go through them in order, the way you read: left to right, top to bottom.',
      note: { es: 'El curso: 36 lecciones en 8 módulos, de los datos al criterio.', en: 'The course: 36 lessons in 8 modules, from data to judgment.' },
      pad: 0.5,
    },
    {
      id: 'm1',
      es: 'Módulo uno, aprender de los datos. Todo se vuelve números; un modelo se equivoca, el error se mide, y el descenso del gradiente lo baja paso a paso.',
      en: 'Module one, learning from data. Everything becomes numbers; a model makes mistakes, the error gets measured, and gradient descent lowers it step by step.',
      pad: 0.3,
    },
    {
      id: 'm2',
      es: 'Módulo dos, redes neuronales. Una neurona suma y decide; sola no basta, en capas sí. La retropropagación reparte la culpa, y se evalúa con datos nunca vistos.',
      en: 'Module two, neural networks. A neuron adds up and decides; alone it isn’t enough, in layers it is. Backpropagation shares out the blame, and you test on unseen data.',
      pad: 0.3,
    },
    {
      id: 'm3',
      es: 'Módulo tres, deep learning. Convoluciones para ver, memoria para leer en orden, GPUs para crecer, y embeddings: el significado como distancia.',
      en: 'Module three, deep learning. Convolutions to see, memory to read in order, GPUs to grow, and embeddings: meaning as distance.',
      pad: 0.3,
    },
    {
      id: 'm4',
      es: 'Módulo cuatro, generar imágenes. Generar es aprender cómo se reparten los datos y sacar muestras nuevas: con un espacio latente, compitiendo o quitando ruido.',
      en: 'Module four, generating images. Generating is learning how the data are spread out and drawing new samples: with a latent space, by competing, or by removing noise.',
      pad: 0.3,
    },
    {
      id: 'm5',
      es: 'Módulo cinco, transformers y lenguaje. Un modelo predice el siguiente token; la atención decide a qué mirar, y el transformer apila esos bloques.',
      en: 'Module five, transformers and language. A model predicts the next token; attention decides what to look at, and the transformer stacks those blocks.',
      pad: 0.3,
    },
    {
      id: 'm6',
      es: 'Módulo seis, escala. Leer medio internet, pagar el cómputo, caber en la memoria de la GPU, y responder token a token, pagando por cada uno.',
      en: 'Module six, scale. Reading half the internet, paying for the compute, fitting in GPU memory, and answering token by token, paying for each one.',
      pad: 0.3,
    },
    {
      id: 'm7',
      es: 'Módulo siete, del modelo al asistente. Ajuste fino, preferencias humanas, pensar antes de responder, contexto, leer tus documentos y actuar con herramientas.',
      en: 'Module seven, from model to assistant. Fine-tuning, human preferences, thinking before answering, context, reading your documents, and acting with tools.',
      pad: 0.3,
    },
    {
      id: 'm8',
      es: 'Y módulo ocho, usar IA con criterio. Se equivoca con aplomo, se evalúa con tus casos, sus riesgos se gobiernan, y la estrategia decide dónde usarla.',
      en: 'And module eight, using AI with judgment. It is wrong with confidence, you test it with your own cases, its risks are governed, and strategy decides where to use it.',
      pad: 0.3,
    },
    {
      id: 'thread',
      es: 'Fíjate en el hilo: cada lección nació de un límite. Una neurona no podía con el XOR, y nacieron las capas. Las redes que leen en orden olvidaban, y llegó la atención.',
      en: 'Notice the thread: each lesson grew out of a limit. One neuron couldn’t handle XOR, so layers were born. Networks that read in order forgot, so attention arrived.',
      note: { es: 'Cada lección nace de lo que otra no podía.', en: 'Each lesson grows out of what another one couldn’t do.' },
      pad: 0.6,
    },

    // ── 3 · la línea de tiempo ──
    {
      id: 'tl-axis',
      es: 'Ahora, el mismo camino en el tiempo. La línea horizontal son los años: a la izquierda, mil novecientos cuarenta y tres; a la derecha, hoy, dos mil veintiséis.',
      en: 'Now, the same path in time. The horizontal line is the years: on the left, nineteen forty-three; on the right, today, twenty twenty-six.',
      pad: 0.4,
    },
    {
      id: 'tl-1943',
      es: 'Mil novecientos cuarenta y tres: McCulloch y Pitts describen la neurona como una fórmula de todo o nada. Todavía no aprende. Es la lección cinco.',
      en: 'Nineteen forty-three: McCulloch and Pitts describe the neuron as an all-or-nothing formula. It doesn’t learn yet. That’s lesson five.',
      pad: 0.3,
    },
    {
      id: 'tl-1958',
      es: 'Mil novecientos cincuenta y ocho: el perceptrón de Rosenblatt ya aprende de ejemplos. Un año después, Arthur Samuel describe un programa de damas que aprende jugando.',
      en: 'Nineteen fifty-eight: Rosenblatt’s perceptron learns from examples. A year later, Arthur Samuel describes a checkers program that learns by playing.',
      pad: 0.3,
    },
    {
      id: 'tl-1969',
      es: 'Mil novecientos sesenta y nueve: el libro Perceptrons, de Minsky y Papert, muestra lo que una sola neurona no puede. Con otros factores, llega el primer invierno de la IA.',
      en: 'Nineteen sixty-nine: the book Perceptrons, by Minsky and Papert, shows what a single neuron can’t do. Along with other factors, the first AI winter sets in.',
      pad: 0.3,
    },
    {
      id: 'tl-1986',
      es: 'Mil novecientos ochenta y seis: Rumelhart, Hinton y Williams difunden la retropropagación. En mil novecientos noventa y siete nace la LSTM, una red con memoria.',
      en: 'Nineteen eighty-six: Rumelhart, Hinton, and Williams popularize backpropagation. In nineteen ninety-seven, the LSTM is born, a network with memory.',
      pad: 0.3,
    },
    {
      id: 'tl-2012',
      es: 'Dos mil doce: AlexNet gana el concurso de ImageNet con dos GPU. Datos, cómputo y trucos coinciden: es el big bang del deep learning.',
      en: 'Twenty twelve: AlexNet wins the ImageNet contest with two GPUs. Data, compute, and tricks come together: the deep learning big bang.',
      pad: 0.3,
    },
    {
      id: 'tl-2014',
      es: 'Desde ahí, todo se acelera. Dos mil trece: word2vec convierte palabras en vectores. Dos mil catorce: las GAN generan imágenes compitiendo.',
      en: 'From there, everything speeds up. Twenty thirteen: word2vec turns words into vectors. Twenty fourteen: GANs generate images by competing.',
      pad: 0.3,
    },
    {
      id: 'tl-2017',
      es: 'Dos mil diecisiete: llega el transformer, con el artículo «Attention Is All You Need». Dos mil veinte: GPT-3, con ciento setenta y cinco mil millones de parámetros.',
      en: 'Twenty seventeen: the transformer arrives, with the paper “Attention Is All You Need.” Twenty twenty: GPT-3, with one hundred seventy-five billion parameters.',
      pad: 0.3,
    },
    {
      id: 'tl-2022',
      es: 'Dos mil veintidós: en agosto se publica Stable Diffusion, que genera imágenes a partir de texto, y el treinta de noviembre OpenAI presenta ChatGPT.',
      en: 'Twenty twenty-two: in August, Stable Diffusion is released, generating images from text, and on November thirtieth, OpenAI introduces ChatGPT.',
      pad: 0.3,
    },
    {
      id: 'tl-2024',
      es: 'Dos mil veinticuatro: llegan modelos que piensan antes de responder, como o1, y el protocolo MCP para conectar herramientas. Y llegamos a hoy.',
      en: 'Twenty twenty-four: models that think before answering arrive, like o1, along with the MCP protocol for connecting tools. And we arrive at today.',
      pad: 0.5,
    },
    {
      id: 'tl-gap',
      es: 'Mira cómo se reparten los hitos. Seis caben en los sesenta y nueve años que van de mil novecientos cuarenta y tres a dos mil doce. Los otros siete, en los últimos catorce.',
      en: 'Look at how the milestones are spread out. Six fit into the sixty-nine years from nineteen forty-three to twenty twelve. The other seven, into the last fourteen.',
      pad: 0.5,
    },
    {
      id: 'tl-scale',
      es: 'Las ideas de fondo son viejas: la neurona artificial tiene más de ochenta años. Lo que cambió desde dos mil doce fue la escala: muchos más datos, más cómputo y algunos trucos.',
      en: 'The core ideas are old: the artificial neuron is more than eighty years old. What changed after twenty twelve was scale: far more data, more compute, and a few tricks.',
      note: { es: 'Las ideas tienen décadas; desde 2012 lo nuevo es la escala: datos, cómputo y trucos.', en: 'The ideas are decades old; since 2012, what’s new is scale: data, compute, and tricks.' },
      pad: 0.5,
    },
    {
      id: 'try-tl',
      es: 'Si quieres, mueve el año y mira qué pasó y en qué lección lo viste.',
      en: 'If you like, move the year and see what happened and which lesson covered it.',
      gate: { id: 'timeline', prompt: { es: 'mueve el año y mira qué pasó.', en: 'move the year and see what happened.' } },
      pad: 0.4,
    },

    // ── 4 · las diez preguntas ──
    {
      id: 'q-intro',
      es: 'Lo más útil que te llevas no es una fecha: son preguntas. Estas diez sirven ante cualquier equipo o proveedor de IA, y cada una sale de lecciones que ya viste.',
      en: 'The most useful thing you take with you isn’t a date: it’s questions. These ten work with any AI team or vendor, and each one comes from lessons you’ve already seen.',
      note: { es: 'Diez preguntas para cualquier equipo o proveedor de IA.', en: 'Ten questions for any AI team or vendor.' },
      pad: 0.4,
    },
    {
      id: 'q1',
      es: 'Uno: ¿por qué con IA y no con reglas escritas? Aprender de datos conviene si la regla es difícil de escribir, hay ejemplos y algún error se tolera. Lección uno.',
      en: 'One: why AI and not written rules? Learning from data makes sense if the rule is hard to write, there are examples, and some error is tolerable. Lesson one.',
      pad: 0.3,
    },
    {
      id: 'q2',
      es: 'Dos: ¿con qué datos aprendió, de dónde salieron y con qué permiso? Un modelo aprende lo que muestran sus datos, sesgos incluidos. Lecciones uno y veintitrés.',
      en: 'Two: what data did it learn from, where did they come from, and with what permission? A model learns what its data show, biases included. Lessons one and twenty-three.',
      pad: 0.3,
    },
    {
      id: 'q3',
      es: 'Tres: ¿qué tanto acierta con casos míos que nunca vio, y con qué margen? Una demostración no es evidencia. Lecciones diez y treinta y cuatro.',
      en: 'Three: how often is it right on my own cases, ones it has never seen, and with what margin? A demo is not evidence. Lessons ten and thirty-four.',
      pad: 0.3,
    },
    {
      id: 'q4',
      es: 'Cuatro: ¿cómo falla, y cómo lo voy a notar? Se equivoca con aplomo, porque busca lo plausible y no lo verdadero. Lección treinta y tres.',
      en: 'Four: how does it fail, and how will I notice? It is wrong with confidence, because it aims for the plausible, not the true. Lesson thirty-three.',
      pad: 0.3,
    },
    {
      id: 'q5',
      es: 'Cinco: ¿de dónde saca lo que dice, y puede citarlo? No sabe nada posterior a su corte; con RAG puede responder desde tus documentos. Lecciones veintitrés y treinta y uno.',
      en: 'Five: where does it get what it says, and can it cite it? It knows nothing after its cutoff; with RAG it can answer from your documents. Lessons twenty-three and thirty-one.',
      pad: 0.3,
    },
    {
      id: 'q6',
      es: 'Seis: ¿cuánto cuesta cada tarea completa? Se paga por tokens de entrada y de salida, y cada turno de una charla cuesta más. Lecciones veinte, veintiséis y treinta.',
      en: 'Six: how much does each complete task cost? You pay for input and output tokens, and each turn of a chat costs more. Lessons twenty, twenty-six, and thirty.',
      pad: 0.3,
    },
    {
      id: 'q7',
      es: 'Siete: ¿a dónde van mis datos? Lo que se pega viaja al proveedor: pregunta dónde se guarda, cuánto tiempo y si se usa para entrenar. Lecciones treinta y treinta y cinco.',
      en: 'Seven: where does my data go? Whatever you paste travels to the provider: ask where it’s stored, for how long, and whether it’s used for training. Lessons thirty and thirty-five.',
      pad: 0.3,
    },
    {
      id: 'q8',
      es: 'Ocho: ¿qué puede hacer solo, y quién aprueba lo que no se deshace? Permisos mínimos, y una persona antes de pagar, borrar o enviar. Lecciones treinta y dos y treinta y cinco.',
      en: 'Eight: what can it do on its own, and who approves what can’t be undone? Minimal permissions, and a person before paying, deleting, or sending. Lessons thirty-two and thirty-five.',
      pad: 0.3,
    },
    {
      id: 'q9',
      es: 'Nueve: ¿funciona igual para todos? El promedio esconde dónde falla: pide el error medido por grupo de personas. Lecciones treinta y cuatro y treinta y cinco.',
      en: 'Nine: does it work equally well for everyone? The average hides where it fails: ask for the error measured by group of people. Lessons thirty-four and thirty-five.',
      pad: 0.3,
    },
    {
      id: 'q10',
      es: 'Y diez: ¿quién responde si falla? El modelo no firma nada: responde quien lo pone a funcionar, con un responsable con nombre. Lecciones treinta y tres y treinta y cinco.',
      en: 'And ten: who answers for it when it fails? The model signs nothing: whoever puts it to work answers, with an owner who has a name. Lessons thirty-three and thirty-five.',
      pad: 0.4,
    },
    {
      id: 'q-use',
      es: 'No hace falta programar para hacerlas. Si una respuesta es vaga, pide evidencia con tus datos antes que promesas, como en la lección seis.',
      en: 'You don’t need to code to ask them. If an answer is vague, ask for evidence with your own data before promises, as in lesson six.',
      note: { es: 'Ante una respuesta vaga: evidencia con tus datos, no promesas.', en: 'Faced with a vague answer: evidence with your data, not promises.' },
      pad: 0.6,
    },

    // ── 5 · cómo seguir aprendiendo ──
    {
      id: 'learn-1',
      es: '¿Cómo seguir aprendiendo? Primero, repasa. Cada lección tiene su sección «por dentro», con las fórmulas y un código que funciona, y su lista de fuentes con enlace.',
      en: 'How do you keep learning? First, review. Every lesson has its “under the hood” section, with the formulas and code that runs, and its list of linked sources.',
      pad: 0.3,
    },
    {
      id: 'learn-2',
      es: 'Segundo, lee una fuente original. Un buen comienzo es el artículo del transformer, de dos mil diecisiete: ya conoces sus piezas principales.',
      en: 'Second, read an original source. A good start is the transformer paper, from twenty seventeen: you already know its main pieces.',
      pad: 0.3,
    },
    {
      id: 'learn-3',
      es: 'Tercero, practica: escribe diez casos de tu trabajo con su respuesta correcta, y pruébalos en cualquier asistente, como en la lección treinta y cuatro.',
      en: 'Third, practice: write ten cases from your work with their right answer, and try them on any assistant, as in lesson thirty-four.',
      note: { es: 'Para seguir: repasa, lee una fuente original y prueba con tus propios casos.', en: 'To keep going: review, read an original source, and test with your own cases.' },
      pad: 0.4,
    },

    // ── 6 · el mapa queda abierto ──
    {
      id: 'map-back',
      es: 'Y cuando algo no quede claro, vuelve al mapa. Cada punto guarda la idea de su lección en una frase. Mira: el cuatro, descenso del gradiente.',
      en: 'And when something isn’t clear, come back to the map. Each dot holds its lesson’s idea in one sentence. Look: four, gradient descent.',
      pad: 0.5,
    },
    {
      id: 'map-demo',
      es: 'Otro: el veintiuno, atención. Debajo de cada idea, un botón abre esa lección, por si quieres repasarla con calma.',
      en: 'Another: twenty-one, attention. Below each idea, a button opens that lesson, in case you want to go over it calmly.',
      pad: 0.5,
    },
    {
      id: 'try-map',
      es: 'Si quieres, toca un punto del mapa o mueve el selector, y lee su idea. El botón te lleva a esa lección.',
      en: 'If you like, tap a dot on the map or move the selector, and read its idea. The button takes you to that lesson.',
      gate: { id: 'map', prompt: { es: 'toca un punto o mueve el selector y lee su idea.', en: 'tap a dot or move the selector and read its idea.' } },
      pad: 0.4,
    },

    // ── 7 · cierre ──
    {
      id: 'recap',
      es: 'En resumen: una máquina aprende bajando un error con datos. Con capas, escala y mucho texto, eso se vuelve un chatbot. Y usarlo bien es preguntar, medir y gobernar.',
      en: 'In short: a machine learns by lowering an error with data. With layers, scale, and lots of text, that becomes a chatbot. And using it well means asking, measuring, and governing.',
      note: { es: 'Aprender es bajar un error; usarlo bien es preguntar, medir y gobernar.', en: 'Learning is lowering an error; using it well is asking, measuring, and governing.' },
      pad: 0.6,
    },
    {
      id: 'end',
      es: 'Ese es el mapa completo, de la neurona al chatbot. Gracias por recorrerlo. Queda abierto: vuelve a él cuando lo necesites.',
      en: 'That’s the complete map, from neuron to chatbot. Thank you for walking it. It stays open: come back to it whenever you need.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'El curso es un solo camino: aprender es bajar un error con datos (módulos 1 a 3); generar es aprender cómo se reparten los datos y muestrearlos (4 y 5); la escala y la alineación vuelven al modelo un asistente (6 y 7); usarlo bien es cuestión de criterio (8).',
      'Cada lección nació del límite de otra: el XOR pidió capas ocultas; la memoria corta de las redes que leen en orden pidió atención; el modelo base, que solo continúa texto, pidió alineación.',
      'Las ideas de fondo son viejas: la neurona artificial es de 1943 y la retropropagación se difundió en 1986. Lo que cambió desde 2012 fue la escala: datos masivos, GPUs y trucos de entrenamiento.',
      'Diez preguntas sirven ante cualquier equipo o proveedor: por qué IA, con qué datos, qué acierto con tus casos, cómo falla, de dónde saca lo que dice, cuánto cuesta, a dónde van tus datos, qué puede hacer solo, si funciona igual para todos y quién responde.',
      'Para seguir aprendiendo: repasa «por dentro», lee una fuente original y prueba cualquier sistema con tus propios casos.',
    ],
    en: [
      'The course is a single path: learning is lowering an error with data (modules 1 to 3); generating is learning how data are spread out and sampling from them (4 and 5); scale and alignment turn the model into an assistant (6 and 7); using it well is a matter of judgment (8).',
      'Each lesson grew out of another’s limit: XOR called for hidden layers; the short memory of networks that read in order called for attention; the base model, which only continues text, called for alignment.',
      'The core ideas are old: the artificial neuron dates from 1943, and backpropagation spread in 1986. What changed after 2012 was scale: massive data, GPUs, and training tricks.',
      'Ten questions work with any team or vendor: why AI, which data, how accurate on your cases, how it fails, where what it says comes from, what it costs, where your data goes, what it can do alone, whether it works equally for everyone, and who answers for it.',
      'To keep learning: review “under the hood,” read an original source, and test any system with your own cases.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA generativa es una tecnología nueva que apareció de golpe con ChatGPT.',
      en: 'Generative AI is a brand-new technology that appeared out of nowhere with ChatGPT.',
    },
    right: {
      es: 'ChatGPT (2022) se apoya en ideas de décadas: la neurona (1943), la retropropagación (1986), la atención (2014) y el transformer (2017). Lo nuevo fue juntar esas piezas a gran escala, con datos masivos, GPUs y ajustes con preferencias humanas.',
      en: 'ChatGPT (2022) rests on ideas that are decades old: the neuron (1943), backpropagation (1986), attention (2014), and the transformer (2017). What was new was putting those pieces together at large scale, with massive data, GPUs, and tuning with human preferences.',
    },
  },

  deeper: {
    es: `## El curso en ocho fórmulas

Cada fórmula viene de una lección; aquí solo se juntan para ver el hilo.

1. **Un modelo y su error** (lección 3). Una recta predice $\\hat y = wx + b$ y la pérdida es el promedio de los errores al cuadrado: $L = \\frac{1}{n}\\sum_i (y_i - \\hat y_i)^2$.
2. **Descenso del gradiente** (lección 4): $w \\leftarrow w - \\eta \\, \\frac{\\partial L}{\\partial w}$.
3. **La neurona** (lección 5): $y = f(w_1x_1 + w_2x_2 + b)$, con $f$ una activación (escalón, sigmoide, ReLU).
4. **Retropropagación** (lección 8): la regla de la cadena, $\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y}\\,\\frac{\\partial y}{\\partial z}\\,\\frac{\\partial z}{\\partial w}$, aplicada de la salida hacia la entrada.
5. **Siguiente pieza y atención** (lecciones 19 y 21): $p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$ y $\\text{softmax}\\!\\left(QK^\\top/\\sqrt{d}\\right)V$.
6. **Escala** (lecciones 24 y 25): cómputo de entrenamiento $C \\approx 6ND$ (parámetros por tokens) y memoria $\\approx$ parámetros × bytes por parámetro.
7. **Costo de una respuesta** (lección 26): entrada × su precio + salida × su precio.
8. **Usarlo con criterio** (lecciones 32, 34 y 35): una cadena de $n$ pasos que salen bien con probabilidad $p$ sale completa con $p^n$; el margen de una nota se encoge como $1/\\sqrt{n}$ casos; el riesgo es $R = P \\times I$.

## Las diez preguntas, con lo que cuenta como buena respuesta

| # | Pregunta | Lecciones | Buena respuesta | Señal de alerta |
|---|---|---|---|---|
| 1 | ¿Por qué IA y no reglas escritas? | 1 | La regla es difícil de escribir, hay ejemplos con respuesta y el error se tolera | «Porque todos usan IA» |
| 2 | ¿Con qué datos aprendió, y con qué permiso? | 1, 23 | Fuentes, licencias y fecha de corte documentadas | «Es confidencial» sin más |
| 3 | ¿Cuánto acierta con mis casos nuevos? | 10, 34 | Una cifra medida con tus casos no vistos, con su margen | Solo un benchmark público o una demostración |
| 4 | ¿Cómo falla, y cómo lo voy a notar? | 33 | Tasa de error medida, tipos de error y cómo se verifica | «No se equivoca» |
| 5 | ¿De dónde saca lo que dice? | 23, 31 | Cita fuentes que puedes revisar; dice su corte de conocimiento | Respuestas sin fuente sobre datos tuyos o recientes |
| 6 | ¿Cuánto cuesta cada tarea completa? | 20, 26, 30 | Desglose en tokens de entrada y salida por tipo de tarea | Precio «por usuario» sin volumen ni tokens |
| 7 | ¿A dónde van mis datos? | 30, 35 | Dónde se guardan, cuánto tiempo y si se usan para entrenar, por contrato | «Están seguros» sin contrato |
| 8 | ¿Qué puede hacer solo, y quién aprueba? | 32, 35 | Permisos mínimos, registro de cada acción y aprobación humana antes de lo irreversible | Acceso total «para que sea útil» |
| 9 | ¿Funciona igual para todos? | 34, 35 | Error medido por grupo de personas | Solo el promedio |
| 10 | ¿Quién responde si falla? | 33, 35 | Un responsable con nombre, un registro de incidentes y una vía de corrección | «Es culpa del modelo» |

## La línea de tiempo, con sus fuentes

McCulloch y Pitts (1943), la neurona de todo o nada; Rosenblatt (1958), el perceptrón; Samuel (1959), damas que aprende; Minsky y Papert (1969), *Perceptrons*; Rumelhart, Hinton y Williams (1986), retropropagación; Hochreiter y Schmidhuber (1997), LSTM; Krizhevsky, Sutskever y Hinton (2012), AlexNet; Mikolov y colaboradores (2013), word2vec; Goodfellow y colaboradores (2014), GAN; Vaswani y colaboradores (2017), el transformer; Brown y colaboradores (2020), GPT-3; Stability AI (22 de agosto de 2022), Stable Diffusion; OpenAI (30 de noviembre de 2022), ChatGPT; OpenAI (12 de septiembre de 2024), o1; Anthropic (25 de noviembre de 2024), MCP. Cada fecha se verificó en la lección que la cuenta. La selección de hitos es de este curso: hay muchos otros (la atención de Bahdanau y colaboradores en 2014, ResNet en 2015, la difusión de Ho y colaboradores en 2020, RAG en 2020, CLIP en 2021).

## En código

\`\`\`python
import math

# 1) lecciones 3 y 4: ajustar y = w·x con descenso del gradiente
xs, ys = [1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8]
w, eta = 0.0, 0.01
for paso in range(200):
    grad = sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)
    w -= eta * grad
print(round(w, 3))

# 2) lección 19: de puntajes a probabilidades con softmax
def softmax(z, T=1.0):
    e = [math.exp(v / T) for v in z]
    s = sum(e)
    return [round(v / s, 3) for v in e]
print(softmax([2.0, 1.0, 0.1]))

# 3) lección 32: diez pasos que salen bien el 95 % de las veces
print(round(0.95 ** 10, 3))

# 4) esta lección: cómo se reparten los hitos de la línea de tiempo
hitos = [1943, 1958, 1959, 1969, 1986, 1997, 2012, 2013, 2014, 2017, 2020, 2022, 2024]
antes = [a for a in hitos if a < 2012]
print(2012 - 1943, len(antes), 2026 - 2012, len(hitos) - len(antes))
\`\`\`

Salida:

\`\`\`
1.99
[0.659, 0.242, 0.099]
0.599
69 6 14 7
\`\`\`

## Lo que viene

No hay lección treinta y ocho. Lo que sigue depende de ti: vuelve al mapa cuando algo no quede claro, lee una fuente original y prueba lo que uses con tus propios casos.`,
    en: `## The course in eight formulas

Each formula comes from a lesson; here they are simply gathered so you can see the thread.

1. **A model and its error** (lesson 3). A line predicts $\\hat y = wx + b$, and the loss is the average of the squared errors: $L = \\frac{1}{n}\\sum_i (y_i - \\hat y_i)^2$.
2. **Gradient descent** (lesson 4): $w \\leftarrow w - \\eta \\, \\frac{\\partial L}{\\partial w}$.
3. **The neuron** (lesson 5): $y = f(w_1x_1 + w_2x_2 + b)$, with $f$ an activation (step, sigmoid, ReLU).
4. **Backpropagation** (lesson 8): the chain rule, $\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y}\\,\\frac{\\partial y}{\\partial z}\\,\\frac{\\partial z}{\\partial w}$, applied from the output back to the input.
5. **Next piece and attention** (lessons 19 and 21): $p_i = \\frac{e^{z_i/T}}{\\sum_j e^{z_j/T}}$ and $\\text{softmax}\\!\\left(QK^\\top/\\sqrt{d}\\right)V$.
6. **Scale** (lessons 24 and 25): training compute $C \\approx 6ND$ (parameters times tokens) and memory $\\approx$ parameters × bytes per parameter.
7. **The cost of an answer** (lesson 26): input × its price + output × its price.
8. **Using it with judgment** (lessons 32, 34, and 35): a chain of $n$ steps, each going right with probability $p$, succeeds end to end with $p^n$; a score’s margin shrinks like $1/\\sqrt{n}$ cases; risk is $R = P \\times I$.

## The ten questions, and what counts as a good answer

| # | Question | Lessons | Good answer | Red flag |
|---|---|---|---|---|
| 1 | Why AI and not written rules? | 1 | The rule is hard to write, there are examples with answers, and errors are tolerable | “Because everyone is using AI” |
| 2 | What data trained it, with what permission? | 1, 23 | Documented sources, licenses, and knowledge cutoff | “It’s confidential,” full stop |
| 3 | How often is it right on my unseen cases? | 10, 34 | A figure measured on your unseen cases, with its margin | Only a public benchmark or a demo |
| 4 | How does it fail, and how will I notice? | 33 | A measured error rate, types of error, and how they are checked | “It doesn’t make mistakes” |
| 5 | Where does what it says come from? | 23, 31 | It cites sources you can check and states its knowledge cutoff | Unsourced answers about your data or recent events |
| 6 | What does each full task cost? | 20, 26, 30 | A breakdown in input and output tokens per type of task | A “per user” price with no volume or tokens |
| 7 | Where does my data go? | 30, 35 | Where it is stored, for how long, and whether it is used for training, in the contract | “It’s safe,” with no contract |
| 8 | What can it do alone, and who approves? | 32, 35 | Minimal permissions, a log of every action, and human approval before anything irreversible | Full access “so it can be useful” |
| 9 | Does it work equally well for everyone? | 34, 35 | Error measured by group of people | Only the average |
| 10 | Who answers for it when it fails? | 33, 35 | An owner with a name, an incident log, and a way to correct things | “It’s the model’s fault” |

## The timeline, with its sources

McCulloch and Pitts (1943), the all-or-nothing neuron; Rosenblatt (1958), the perceptron; Samuel (1959), checkers that learns; Minsky and Papert (1969), *Perceptrons*; Rumelhart, Hinton, and Williams (1986), backpropagation; Hochreiter and Schmidhuber (1997), LSTM; Krizhevsky, Sutskever, and Hinton (2012), AlexNet; Mikolov and colleagues (2013), word2vec; Goodfellow and colleagues (2014), GANs; Vaswani and colleagues (2017), the transformer; Brown and colleagues (2020), GPT-3; Stability AI (August 22, 2022), Stable Diffusion; OpenAI (November 30, 2022), ChatGPT; OpenAI (September 12, 2024), o1; Anthropic (November 25, 2024), MCP. Each date was verified in the lesson that tells it. The choice of milestones is this course’s: there are many others (Bahdanau and colleagues’ attention in 2014, ResNet in 2015, Ho and colleagues’ diffusion in 2020, RAG in 2020, CLIP in 2021).

## In code

\`\`\`python
import math

# 1) lessons 3 and 4: fit y = w·x with gradient descent
xs, ys = [1, 2, 3, 4], [2.1, 3.9, 6.2, 7.8]
w, eta = 0.0, 0.01
for step in range(200):
    grad = sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)
    w -= eta * grad
print(round(w, 3))

# 2) lesson 19: from scores to probabilities with softmax
def softmax(z, T=1.0):
    e = [math.exp(v / T) for v in z]
    s = sum(e)
    return [round(v / s, 3) for v in e]
print(softmax([2.0, 1.0, 0.1]))

# 3) lesson 32: ten steps that each go right 95% of the time
print(round(0.95 ** 10, 3))

# 4) this lesson: how the timeline’s milestones are spread out
milestones = [1943, 1958, 1959, 1969, 1986, 1997, 2012, 2013, 2014, 2017, 2020, 2022, 2024]
before = [a for a in milestones if a < 2012]
print(2012 - 1943, len(before), 2026 - 2012, len(milestones) - len(before))
\`\`\`

Output:

\`\`\`
1.99
[0.659, 0.242, 0.099]
0.599
69 6 14 7
\`\`\`

## What comes next

There is no lesson thirty-eight. What follows is up to you: come back to the map when something isn’t clear, read an original source, and test whatever you use with your own cases.`,
  },

  lens: {
    es: [
      'Usa las diez preguntas como lista de verificación antes de comprar o aprobar un proyecto de IA: pide cada respuesta por escrito y con evidencia (cifras medidas con tus casos, cláusulas del contrato, registros), no con una demostración.',
      'Si una respuesta es vaga («es muy preciso», «tus datos están seguros»), vuelve en el mapa a la lección de origen y haz la pregunta concreta: ¿con cuántos casos y qué margen?, ¿dónde se guardan y cuánto tiempo?, ¿quién aprueba?',
      'Ante el anuncio de un «avance», pregunta qué cambió, como en la lección trece: más datos (¿de quién y con qué licencia?), más cómputo (¿a qué costo?) o un mejor método. Cada uno trae costos y riesgos distintos.',
      'Empieza en pequeño y con medición: un piloto reversible, evaluado con tus propios casos (lección 34) y con un responsable con nombre (lección 35). Decide con números si sigue.',
    ],
    en: [
      'Use the ten questions as a checklist before buying or approving an AI project: ask for each answer in writing and with evidence (figures measured on your cases, contract clauses, logs), not with a demo.',
      'If an answer is vague (“it’s very accurate,” “your data is safe”), go back on the map to the lesson it comes from and ask the concrete question: with how many cases and what margin? where is it stored and for how long? who approves?',
      'When a “breakthrough” is announced, ask what changed, as in lesson thirteen: more data (whose, under which license?), more compute (at what cost?), or a better method. Each brings different costs and risks.',
      'Start small and measured: a reversible pilot, evaluated with your own cases (lesson 34) and with a named owner (lesson 35). Decide with numbers whether it continues.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Una red que lee una frase palabra por palabra va olvidando lo lejano. ¿Qué pieza del curso nació, sobre todo, de ese límite?', en: 'A network that reads a sentence word by word gradually forgets what came far back. Which piece of the course grew mainly out of that limit?' },
      options: [
        { es: 'La convolución', en: 'Convolution' },
        { es: 'La cuantización', en: 'Quantization' },
        { es: 'La atención', en: 'Attention' },
        { es: 'El descenso del gradiente', en: 'Gradient descent' },
      ],
      answer: 2,
      why: {
        es: 'Las redes recurrentes y la LSTM leen en fila y comprimen todo en un vector de tamaño fijo: su memoria útil es corta (lección 12). La atención deja que cada token mire directamente a todos los demás (lección 21). La convolución nació para imágenes, y el descenso del gradiente y la cuantización resuelven otros problemas.',
        en: 'Recurrent networks and the LSTM read in a line and squeeze everything into a fixed-size vector: their useful memory is short (lesson 12). Attention lets each token look directly at all the others (lesson 21). Convolution was born for images, and gradient descent and quantization solve other problems.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Según la línea de tiempo del curso, ¿qué hizo despegar el deep learning hacia 2012?', en: 'According to the course timeline, what made deep learning take off around 2012?' },
      options: [
        { es: 'Que coincidieron datos masivos, GPUs y trucos de entrenamiento.', en: 'Massive data, GPUs, and training tricks came together.' },
        { es: 'Que ese año se inventó la neurona artificial.', en: 'The artificial neuron was invented that year.' },
        { es: 'Que ese año se inventó la retropropagación.', en: 'Backpropagation was invented that year.' },
        { es: 'Que apareció el transformer.', en: 'The transformer appeared.' },
      ],
      answer: 0,
      why: {
        es: 'La neurona es de 1943 y la retropropagación se difundió en 1986; el transformer llegó en 2017. En 2012 AlexNet ganó ImageNet porque se juntaron muchos datos etiquetados, el cómputo de las GPUs y trucos como ReLU y dropout (lección 13).',
        en: 'The neuron dates from 1943 and backpropagation spread in 1986; the transformer came in 2017. In 2012 AlexNet won ImageNet because lots of labeled data, GPU compute, and tricks like ReLU and dropout came together (lesson 13).',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un agente acierta el 95 % de las veces en cada paso, y una tarea tiene diez pasos encadenados. Si los errores son independientes, ¿cerca de qué porcentaje de las tareas sale bien de principio a fin?',
        en: 'An agent gets each step right 95% of the time, and a task has ten chained steps. If errors are independent, about what percentage of tasks go right from start to finish?',
      },
      options: [
        { es: '95 %', en: '95%' },
        { es: '60 %', en: '60%' },
        { es: '50 %', en: '50%' },
        { es: '5 %', en: '5%' },
      ],
      answer: 1,
      why: {
        es: 'Hay que acertar los diez pasos: 0.95 multiplicado por sí mismo diez veces, 0.95¹⁰ ≈ 0.599, cerca del 60 % (lección 32). Quedarse en 95 % olvida que los errores se acumulan; 50 % sale de restar cinco puntos por paso, y 5 % es solo la probabilidad de fallar un paso.',
        en: 'All ten steps must go right: 0.95 multiplied by itself ten times, 0.95¹⁰ ≈ 0.599, about 60% (lesson 32). Staying at 95% forgets that errors pile up; 50% comes from subtracting five points per step, and 5% is just the chance of failing one step.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor te muestra una demostración impecable de su asistente y asegura que «acierta el 98 %». ¿Cuál de las diez preguntas conviene hacer primero?', en: 'A vendor shows you a flawless demo of their assistant and claims it is “98% accurate.” Which of the ten questions should you ask first?' },
      options: [
        { es: '¿Cuántos parámetros tiene el modelo?', en: 'How many parameters does the model have?' },
        { es: '¿Pueden mostrarme otra demostración?', en: 'Can you show me another demo?' },
        { es: '¿Es el modelo más grande del mercado?', en: 'Is it the biggest model on the market?' },
        { es: '¿Cuánto acierta con casos míos que nunca vio, y con qué margen?', en: 'How often is it right on my own cases it has never seen, and with what margin?' },
      ],
      answer: 3,
      why: {
        es: 'Una demostración elige sus casos y un 98 % sin decir con qué se midió no dice nada de tu operación. Lo que importa es el acierto con tus casos no vistos y su margen (lecciones 10 y 34). El tamaño del modelo no lo garantiza.',
        en: 'A demo picks its own cases, and 98% without saying what it was measured on says nothing about your operation. What matters is accuracy on your unseen cases and its margin (lessons 10 and 34). Model size doesn’t guarantee it.',
      },
    },
  ],

  glossary: [
    'machine-learning', 'model', 'parameter', 'training-data', 'loss', 'gradient-descent', 'neuron', 'perceptron', 'xor', 'hidden-layer',
    'ai-winter', 'backpropagation', 'lstm', 'gpu', 'imagenet', 'deep-learning', 'embedding', 'latent-space', 'gan', 'diffusion', 'transformer', 'attention',
    'language-model', 'token', 'pretraining', 'base-model', 'knowledge-cutoff', 'scaling-law', 'fine-tuning', 'alignment', 'reasoning-model',
    'context-window', 'rag', 'agent', 'mcp', 'hallucination', 'eval-set', 'confidence-interval', 'ai-bias', 'governance', 'human-in-the-loop', 'use-case', 'pilot',
  ],

  terms: [],

  sources: [
    { title: 'A logical calculus of the ideas immanent in nervous activity', authors: 'McCulloch, W. S., Pitts, W.', year: 1943, url: 'https://doi.org/10.1007/BF02478259' },
    { title: 'The perceptron: a probabilistic model for information storage and organization in the brain', authors: 'Rosenblatt, F.', year: 1958, url: 'https://doi.org/10.1037/h0042519' },
    { title: 'Some Studies in Machine Learning Using the Game of Checkers', authors: 'Samuel, A. L.', year: 1959, url: 'https://doi.org/10.1147/rd.33.0210' },
    { title: 'Perceptrons: An Introduction to Computational Geometry (1969; edición ampliada de 1988)', authors: 'Minsky, M., Papert, S.', year: 1969, url: 'https://mitpress.mit.edu/9780262631112/perceptrons/' },
    { title: 'Learning representations by back-propagating errors (Nature 323, 533–536)', authors: 'Rumelhart, D. E., Hinton, G. E., Williams, R. J.', year: 1986, url: 'https://doi.org/10.1038/323533a0' },
    { title: 'Long short-term memory', authors: 'Hochreiter, S., Schmidhuber, J.', year: 1997, url: 'https://doi.org/10.1162/neco.1997.9.8.1735' },
    { title: 'ImageNet Classification with Deep Convolutional Neural Networks (AlexNet)', authors: 'Krizhevsky, A., Sutskever, I., Hinton, G. E.', year: 2012, url: 'https://papers.nips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html' },
    { title: 'Efficient Estimation of Word Representations in Vector Space (word2vec)', authors: 'Mikolov, T., Chen, K., Corrado, G., Dean, J.', year: 2013, url: 'https://arxiv.org/abs/1301.3781' },
    { title: 'Generative Adversarial Networks', authors: 'Goodfellow, I. J., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1406.2661' },
    { title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: 'Bahdanau, D., Cho, K., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1409.0473' },
    { title: 'Deep Residual Learning for Image Recognition (ResNet)', authors: 'He, K., Zhang, X., Ren, S., Sun, J.', year: 2015, url: 'https://arxiv.org/abs/1512.03385' },
    { title: 'Attention Is All You Need', authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł., Polosukhin, I.', year: 2017, url: 'https://arxiv.org/abs/1706.03762' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., Mann, B., Ryder, N., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Denoising Diffusion Probabilistic Models', authors: 'Ho, J., Jain, A., Abbeel, P.', year: 2020, url: 'https://arxiv.org/abs/2006.11239' },
    { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (RAG)', authors: 'Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.11401' },
    { title: 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)', authors: 'Radford, A., Kim, J. W., Hallacy, C., Ramesh, A., Goh, G., Agarwal, S., et al.', year: 2021, url: 'https://arxiv.org/abs/2103.00020' },
    { title: 'Stable Diffusion Public Release (anuncio, 22 de agosto de 2022)', authors: 'Stability AI', year: 2022, url: 'https://stability.ai/news-updates/stable-diffusion-public-release' },
    { title: 'Introducing ChatGPT (30 de noviembre de 2022)', authors: 'OpenAI', year: 2022, url: 'https://openai.com/index/chatgpt/' },
    { title: 'Learning to Reason with LLMs (presentación de o1, 12 de septiembre de 2024)', authors: 'OpenAI', year: 2024, url: 'https://openai.com/index/learning-to-reason-with-llms/' },
    { title: 'Introducing the Model Context Protocol (25 de noviembre de 2024)', authors: 'Anthropic', year: 2024, url: 'https://www.anthropic.com/news/model-context-protocol' },
  ],
});
