// Datos de la lección «El mapa completo». Nada se genera: todo sale de lo que ya enseñaron las lecciones del curso.
//
// · IDEAS: la idea de cada lección en una frase. Cada una resume las «ideas clave» (keyIdeas) del content.ts de su
//   lección, leídas el 2026-10-12 (no se inventa nada que la lección no diga). La 36 (estrategia) se escribía al mismo
//   tiempo que esta: su frase sale de su entrada en docs/v2/CURRICULUM-MAP.md y se contrastó con las ideas clave de su
//   borrador del 2026-10-12 (frecuencia × valor × riesgo; piloto con meta medible). Revisarla cuando se publique.
// · SHORT: títulos cortos para el lienzo cuando el título del currículo no cabe (los completos vienen de curriculum.ts).
// · EVENTS: la línea de tiempo. Solo fechas ya verificadas en las lecciones y en sus registros de docs/v2/verificacion/
//   (lección entre paréntesis): McCulloch y Pitts 1943 (5), Rosenblatt 1958 (5), Samuel 1959 (1), Minsky y Papert 1969 (6),
//   Rumelhart, Hinton y Williams 1986 (8), LSTM 1997 (12), AlexNet 2012 (13), word2vec 2013 (14), GAN 2014 (16),
//   transformer 2017 (21, 22), GPT-3 2020 (19), Stable Diffusion 22 de agosto de 2022 (17), ChatGPT 30 de noviembre de 2022
//   (28), o1 12 de septiembre de 2024 (29), MCP 25 de noviembre de 2024 (32). La selección de hitos es de este curso.
// · QUESTIONS: las diez preguntas, con las lecciones de las que salen (sus lentes de decisión y sus ideas clave).
import type { L10n } from '../../../../../core/types';

/** Lecciones por módulo (1–8), en orden. La 37 (esta) cierra el camino con un marcador. */
export const MOD_SIZES = [4, 6, 4, 4, 4, 4, 6, 4];
/** Módulo (1–8) de la lección n (1–36). */
export const moduleOf = (n: number) => { let k = 0; for (let m = 0; m < MOD_SIZES.length; m++) { k += MOD_SIZES[m]; if (n <= k) return m + 1; } return 8; };
/** Primera lección del módulo m (1–8). */
export const firstOf = (m: number) => 1 + MOD_SIZES.slice(0, m - 1).reduce((a, b) => a + b, 0);

/** Nombre corto de cada módulo, por si el del currículo no cabe. */
export const MOD_SHORT: L10n[] = [
  { es: 'Aprender', en: 'Learning' }, { es: 'Redes', en: 'Networks' }, { es: 'Deep learning', en: 'Deep learning' },
  { es: 'Imágenes', en: 'Images' }, { es: 'Lenguaje', en: 'Language' }, { es: 'Escala', en: 'Scale' },
  { es: 'Asistentes', en: 'Assistants' }, { es: 'Criterio', en: 'Judgment' },
];

/** Título corto por lección (1–37). */
export const SHORT: L10n[] = [
  { es: 'Programar o aprender', en: 'Programming or learning' }, { es: 'Datos como números', en: 'Data as numbers' },
  { es: 'Modelo y error', en: 'Model and error' }, { es: 'Descenso del gradiente', en: 'Gradient descent' },
  { es: 'La neurona', en: 'The neuron' }, { es: 'El límite del XOR', en: 'The XOR limit' },
  { es: 'Capas y activaciones', en: 'Layers and activations' }, { es: 'Retropropagación', en: 'Backpropagation' },
  { es: 'Entrenar bien', en: 'Training well' }, { es: 'Generalizar y evaluar', en: 'Generalize and evaluate' },
  { es: 'Convoluciones', en: 'Convolutions' }, { es: 'Secuencias y memoria', en: 'Sequences and memory' },
  { es: 'El big bang', en: 'The big bang' }, { es: 'Embeddings', en: 'Embeddings' },
  { es: 'Distribuciones', en: 'Distributions' }, { es: 'GAN', en: 'GANs' },
  { es: 'Difusión', en: 'Diffusion' }, { es: 'Texto a imagen', en: 'Text to image' },
  { es: 'Siguiente palabra', en: 'Next word' }, { es: 'Tokens', en: 'Tokens' },
  { es: 'Atención', en: 'Attention' }, { es: 'Transformer', en: 'Transformer' },
  { es: 'Preentrenamiento', en: 'Pretraining' }, { es: 'Leyes de escala', en: 'Scaling laws' },
  { es: 'GPUs y memoria', en: 'GPUs and memory' }, { es: 'Inferencia', en: 'Inference' },
  { es: 'Ajuste fino', en: 'Fine-tuning' }, { es: 'Alineación', en: 'Alignment' },
  { es: 'Razonamiento', en: 'Reasoning' }, { es: 'Contexto', en: 'Context' },
  { es: 'RAG', en: 'RAG' }, { es: 'Agentes', en: 'Agents' },
  { es: 'Alucinaciones', en: 'Hallucinations' }, { es: 'Evaluar', en: 'Evaluating' },
  { es: 'Riesgos', en: 'Risks' }, { es: 'Estrategia', en: 'Strategy' },
  { es: 'El mapa completo', en: 'The complete map' },
];

/** La idea de cada lección (1–36) en una frase, resumida de sus ideas clave. */
export const IDEAS: L10n[] = [
  { es: 'Programar es escribir reglas; aprender es que la máquina las saque de ejemplos con respuesta.', en: 'Programming is writing rules; learning is the machine working them out from examples with answers.' },
  { es: 'Un modelo solo recibe números: imágenes, sonidos y textos se vuelven vectores.', en: 'A model only takes numbers: images, sounds, and text become vectors.' },
  { es: 'El error se mide con la pérdida, el promedio de los errores al cuadrado; aprender es bajarla.', en: 'Error is measured by the loss, the average of the squared errors; learning means lowering it.' },
  { es: 'Paso a paso cuesta abajo: peso nuevo = peso actual − η × pendiente.', en: 'Step by step downhill: new weight = current weight − η × slope.' },
  { es: 'Una neurona multiplica sus entradas por sus pesos, suma, añade el sesgo y aplica una activación.', en: 'A neuron multiplies its inputs by its weights, adds them up with a bias, and applies an activation.' },
  { es: 'Una neurona separa con una recta y el XOR no se separa con una: hace falta una capa oculta.', en: 'A neuron separates with a straight line, and XOR can’t be split by one: it takes a hidden layer.' },
  { es: 'Apilar capas solo da poder con una no linealidad entre ellas, que dobla el espacio.', en: 'Stacking layers only adds power with a nonlinearity between them, which folds the space.' },
  { es: 'La culpa del error viaja de la salida a la entrada y da el gradiente de todos los pesos en un viaje.', en: 'The blame for the error travels from output to input and gives every weight’s gradient in one trip.' },
  { es: 'Lotes, épocas, optimizador y tasa: decisiones humanas que separan una red que aprende de una que no.', en: 'Batches, epochs, optimizer, and rate: human choices that separate a network that learns from one that doesn’t.' },
  { es: 'Lo que importa es el error con datos que el modelo no vio; la exactitud sola puede engañar.', en: 'What matters is the error on data the model never saw; accuracy alone can fool you.' },
  { es: 'Un kernel pequeño recorre la imagen con los mismos pesos: de bordes a partes y a objetos.', en: 'A small kernel slides over the image with the same weights: from edges to parts to objects.' },
  { es: 'Una red recurrente lee en orden con un estado oculto como memoria, pero lo lejano se le desvanece.', en: 'A recurrent network reads in order with a hidden state as memory, but distant things fade.' },
  { es: 'En 2012 coincidieron datos masivos, GPUs y trucos de entrenamiento: AlexNet.', en: 'In 2012, massive data, GPUs, and training tricks came together: AlexNet.' },
  { es: 'Lo que aparece en contextos parecidos queda cerca: el significado se vuelve distancia.', en: 'What shows up in similar contexts ends up close together: meaning becomes distance.' },
  { es: 'Generar es saber dónde se apiñan los datos para sacar muestras nuevas; el espacio latente los resume.', en: 'Generating means knowing where the data cluster so you can draw new samples; the latent space sums them up.' },
  { es: 'Un generador aprende a falsificar compitiendo contra un discriminador que distingue lo real.', en: 'A generator learns to forge by competing against a discriminator that tells real from fake.' },
  { es: 'Se parte de ruido puro y se le quita, poco a poco, el ruido que estima una red.', en: 'You start from pure noise and remove, little by little, the noise a network estimates.' },
  { es: 'CLIP pone frases e imágenes en el mismo espacio, y el vector de la frase guía la difusión.', en: 'CLIP puts sentences and images in the same space, and the sentence’s vector guides diffusion.' },
  { es: 'Un modelo de lenguaje da probabilidades a la siguiente pieza y escribe en bucle, una a la vez.', en: 'A language model gives probabilities to the next piece and writes in a loop, one at a time.' },
  { es: 'El modelo no lee letras sino tokens, y por tokens se cobra y se limita.', en: 'The model reads tokens, not letters, and tokens are what you pay for and what limits it.' },
  { es: 'Cada token decide a cuáles otros mirar y cuánto, con consultas, claves y valores.', en: 'Each token decides which others to look at, and how much, with queries, keys, and values.' },
  { es: 'Una pila de bloques de atención y red, con posición y máscara causal, que termina en probabilidades.', en: 'A stack of attention-and-network blocks, with position and a causal mask, ending in probabilities.' },
  { es: 'Adivinar la siguiente pieza en cientos de miles de millones de tokens da un modelo base: continúa, no obedece.', en: 'Guessing the next piece over hundreds of billions of tokens gives a base model: it continues, it doesn’t obey.' },
  { es: 'La pérdida baja de forma predecible con más parámetros, datos y cómputo, cada vez con menos ganancia.', en: 'Loss falls predictably with more parameters, data, and compute, with smaller gains each time.' },
  { es: 'El modelo debe caber en la memoria de la GPU; si no cabe, se reparte o se cuantiza.', en: 'The model has to fit in GPU memory; if it doesn’t, it is split up or quantized.' },
  { es: 'Responder es leer tu mensaje y escribir token a token; se paga por la entrada y por la salida.', en: 'Answering means reading your message and writing token by token; you pay for input and output.' },
  { es: 'Seguir entrenando con tus ejemplos cambia el comportamiento; LoRA lo hace barato.', en: 'Further training on your examples changes behavior; LoRA makes it cheap.' },
  { es: 'Ejemplos de instrucciones y preferencias humanas convierten un modelo base en un asistente.', en: 'Instruction examples and human preferences turn a base model into an assistant.' },
  { es: 'Escribir los pasos antes de responder mejora la respuesta, pero cuesta tokens y espera.', en: 'Writing out the steps before answering improves the answer, but costs tokens and waiting.' },
  { es: 'El modelo no recuerda: en cada turno se le reenvía la conversación, y lo que no cabe no existe.', en: 'The model doesn’t remember: each turn the conversation is sent again, and what doesn’t fit doesn’t exist.' },
  { es: 'Busca en tus documentos y pega lo que encuentra en el prompt, para responder citando.', en: 'It searches your documents and pastes what it finds into the prompt, so it can answer with citations.' },
  { es: 'Un modelo en un bucle que usa herramientas: los errores se acumulan y los permisos protegen.', en: 'A model in a loop that uses tools: errors pile up, and permissions protect.' },
  { es: 'Busca lo plausible, no lo verdadero: se equivoca con aplomo, y se verifica según el riesgo.', en: 'It aims for the plausible, not the true: it’s wrong with confidence, so you verify in proportion to the risk.' },
  { es: 'Se evalúa con tus propios casos, que no haya visto, y cada nota lleva su margen.', en: 'You evaluate with your own cases, ones it hasn’t seen, and every score carries its margin.' },
  { es: 'Riesgo = probabilidad × impacto; alguien con nombre decide los controles y los vigila.', en: 'Risk = likelihood × impact; someone with a name decides the controls and watches over them.' },
  { es: 'Elegir casos de uso por frecuencia, valor y riesgo, y empezar con pilotos medidos.', en: 'Choose use cases by frequency, value, and risk, and start with measured pilots.' },
];

/** Un hito de la línea de tiempo: año y lo que pasó, con la lección donde se vio. */
export interface Ev { year: number; items: { es: string; en: string; n: number }[] }
export const EVENTS: Ev[] = [
  { year: 1943, items: [{ es: 'McCulloch y Pitts: la neurona como fórmula de todo o nada', en: 'McCulloch and Pitts: the neuron as an all-or-nothing formula', n: 5 }] },
  { year: 1958, items: [{ es: 'Rosenblatt: el perceptrón aprende de ejemplos', en: 'Rosenblatt: the perceptron learns from examples', n: 5 }] },
  { year: 1959, items: [{ es: 'Samuel: un programa de damas que aprende jugando', en: 'Samuel: a checkers program that learns by playing', n: 1 }] },
  { year: 1969, items: [{ es: 'Minsky y Papert, «Perceptrons»: lo que una neurona no puede', en: 'Minsky and Papert, “Perceptrons”: what one neuron can’t do', n: 6 }] },
  { year: 1986, items: [{ es: 'Rumelhart, Hinton y Williams difunden la retropropagación', en: 'Rumelhart, Hinton, and Williams popularize backpropagation', n: 8 }] },
  { year: 1997, items: [{ es: 'Hochreiter y Schmidhuber: la LSTM, una red con memoria', en: 'Hochreiter and Schmidhuber: the LSTM, a network with memory', n: 12 }] },
  { year: 2012, items: [{ es: 'AlexNet gana ImageNet con dos GPU', en: 'AlexNet wins ImageNet with two GPUs', n: 13 }] },
  { year: 2013, items: [{ es: 'word2vec: las palabras se vuelven vectores', en: 'word2vec: words become vectors', n: 14 }] },
  { year: 2014, items: [{ es: 'Goodfellow y sus colegas: las GAN', en: 'Goodfellow and colleagues: GANs', n: 16 }] },
  { year: 2017, items: [{ es: '«Attention Is All You Need»: el transformer', en: '“Attention Is All You Need”: the transformer', n: 22 }] },
  { year: 2020, items: [{ es: 'GPT-3, con 175 000 millones de parámetros', en: 'GPT-3, with 175 billion parameters', n: 19 }] },
  { year: 2022, items: [{ es: 'Agosto: Stable Diffusion', en: 'August: Stable Diffusion', n: 17 }, { es: '30 de noviembre: ChatGPT', en: 'November 30: ChatGPT', n: 28 }] },
  { year: 2024, items: [{ es: 'Septiembre: o1, un modelo que razona', en: 'September: o1, a reasoning model', n: 29 }, { es: 'Noviembre: MCP, para conectar herramientas', en: 'November: MCP, for connecting tools', n: 32 }] },
];
export const YEAR0 = 1943;
export const YEAR1 = 2026;   // hoy (la lección se escribió en octubre de 2026)
/** Índice del último hito con año ≤ y (−1 si ninguno). */
export const eventAt = (y: number) => { let k = -1; EVENTS.forEach((e, i) => { if (e.year <= y) k = i; }); return k; };

/** Las diez preguntas: texto corto para el lienzo y las lecciones de las que salen. */
export const QUESTIONS: { q: L10n; ls: number[] }[] = [
  { q: { es: '¿Por qué IA y no reglas escritas?', en: 'Why AI and not written rules?' }, ls: [1] },
  { q: { es: '¿Con qué datos aprendió, y con qué permiso?', en: 'What data trained it, with what permission?' }, ls: [1, 23] },
  { q: { es: '¿Cuánto acierta con mis casos nuevos?', en: 'How often is it right on my unseen cases?' }, ls: [10, 34] },
  { q: { es: '¿Cómo falla, y cómo lo voy a notar?', en: 'How does it fail, and how will I notice?' }, ls: [33] },
  { q: { es: '¿De dónde saca lo que dice?', en: 'Where does what it says come from?' }, ls: [23, 31] },
  { q: { es: '¿Cuánto cuesta cada tarea completa?', en: 'What does each full task cost?' }, ls: [20, 26, 30] },
  { q: { es: '¿A dónde van mis datos?', en: 'Where does my data go?' }, ls: [30, 35] },
  { q: { es: '¿Qué puede hacer solo, y quién aprueba?', en: 'What can it do alone, and who approves?' }, ls: [32, 35] },
  { q: { es: '¿Funciona igual para todos?', en: 'Does it work equally well for everyone?' }, ls: [34, 35] },
  { q: { es: '¿Quién responde si falla?', en: 'Who answers for it when it fails?' }, ls: [33, 35] },
];
