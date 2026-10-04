import type { CourseMeta, LessonMeta, ModuleMeta, PartMeta } from '../../../core/types';

/** Fuente de verdad del currículo: módulos, orden, rutas y títulos. El contenido vive en lessons/<id>/. */

export const MODULES: ModuleMeta[] = [
  { n: 1, id: 'aprender', title: { es: 'Aprender de los datos', en: 'Learning from data' },
    blurb: { es: 'Qué significa que una máquina aprenda, cómo se mide un error y cómo se corrige.', en: 'What it means for a machine to learn, how error is measured, and how it gets corrected.' } },
  { n: 2, id: 'redes', title: { es: 'Redes neuronales', en: 'Neural networks' },
    blurb: { es: 'De una neurona a una red profunda: capas, retropropagación y el arte de entrenar bien.', en: 'From one neuron to a deep network: layers, backpropagation, and the craft of training well.' } },
  { n: 3, id: 'deep-learning', title: { es: 'Deep learning', en: 'Deep learning' },
    blurb: { es: 'Visión, secuencias, GPUs y la representación del significado como geometría.', en: 'Vision, sequences, GPUs, and meaning represented as geometry.' } },
  { n: 4, id: 'imagenes', title: { es: 'Generar imágenes', en: 'Generating images' },
    blurb: { es: 'Aprender una distribución para poder muestrearla: VAE, GAN y difusión.', en: 'Learning a distribution so you can sample from it: VAEs, GANs, and diffusion.' } },
  { n: 5, id: 'transformers', title: { es: 'Transformers y lenguaje', en: 'Transformers and language' },
    blurb: { es: 'Predecir la siguiente palabra, partir el texto en tokens y mirar con atención.', en: 'Predicting the next word, splitting text into tokens, and looking with attention.' } },
  { n: 6, id: 'escala', title: { es: 'Escala', en: 'Scale' },
    blurb: { es: 'Preentrenar, escalar, pagar la cuenta de cómputo y servir el modelo.', en: 'Pretraining, scaling, paying the compute bill, and serving the model.' } },
  { n: 7, id: 'asistentes', title: { es: 'Del modelo al asistente', en: 'From model to assistant' },
    blurb: { es: 'Ajuste fino, alineación, razonamiento, memoria, recuperación y agentes.', en: 'Fine-tuning, alignment, reasoning, memory, retrieval, and agents.' } },
  { n: 8, id: 'criterio', title: { es: 'Usar IA con criterio', en: 'Using AI with judgment' },
    blurb: { es: 'Alucinaciones, evaluación, riesgos y cómo decidir dónde aplicarla.', en: 'Hallucinations, evaluation, risks, and how to decide where to apply it.' } },
  { n: 9, id: 'cierre', title: { es: 'Cierre', en: 'Wrap-up' },
    blurb: { es: 'El mapa completo, de la neurona al chatbot.', en: 'The complete map, from neuron to chatbot.' } },
];

type Row = [id: string, module: number, minutes: number, exec: boolean, slugEs: string, slugEn: string, titleEs: string, titleEn: string, qEs: string, qEn: string];

const ROWS: Row[] = [
  // ── Módulo 1 · Aprender de los datos
  ['que-es-aprender', 1, 8, true, 'programar-vs-aprender', 'programming-vs-learning', 'Programar o aprender', 'Programming or learning',
    '¿Qué cambia cuando una máquina aprende en lugar de seguir reglas?', 'What changes when a machine learns instead of following rules?'],
  ['datos-como-numeros', 1, 9, true, 'el-mundo-hecho-de-numeros', 'the-world-as-numbers', 'El mundo hecho de números', 'The world as numbers',
    '¿Cómo ve una máquina una imagen, un sonido o un texto?', 'How does a machine see an image, a sound, or a text?'],
  ['modelo-y-error', 1, 8, false, 'un-modelo-y-su-error', 'a-model-and-its-error', 'Un modelo y su error', 'A model and its error',
    '¿Cómo se mide qué tan equivocado está un modelo?', 'How do you measure how wrong a model is?'],
  ['descenso-del-gradiente', 1, 5, true, 'descenso-del-gradiente', 'gradient-descent', 'Descenso del gradiente', 'Gradient descent',
    '¿Cómo encuentra una máquina los números correctos sin que nadie se los diga?', 'How does a machine find the right numbers without being told?'],
  // ── Módulo 2 · Redes neuronales
  ['neurona', 2, 10, true, 'la-neurona-artificial', 'the-artificial-neuron', 'La neurona artificial', 'The artificial neuron',
    '¿Qué hace exactamente una neurona artificial?', 'What exactly does an artificial neuron do?'],
  ['limite-xor', 2, 5, false, 'lo-que-una-neurona-no-puede', 'what-a-neuron-cannot-do', 'Lo que una neurona no puede', 'What a neuron cannot do',
    '¿Por qué una sola neurona no basta?', 'Why is a single neuron not enough?'],
  ['capas-y-activaciones', 2, 9, false, 'capas-y-activaciones', 'layers-and-activations', 'Capas y activaciones', 'Layers and activations',
    '¿Cómo ganan poder las redes al apilar capas?', 'How do networks gain power by stacking layers?'],
  ['backpropagation', 2, 8, false, 'retropropagacion', 'backpropagation', 'Retropropagación', 'Backpropagation',
    '¿Cómo se reparte la culpa del error entre miles de pesos?', 'How is the blame for an error shared among thousands of weights?'],
  ['entrenar-bien', 2, 9, false, 'entrenar-bien', 'training-well', 'Entrenar bien: lotes, épocas y optimizadores', 'Training well: batches, epochs, and optimizers',
    '¿Qué decisiones de entrenamiento separan una red que aprende de una que no?', 'Which training decisions separate a network that learns from one that does not?'],
  ['generalizar-y-evaluar', 2, 7, true, 'generalizar-y-evaluar', 'generalizing-and-evaluating', 'Generalizar y evaluar', 'Generalizing and evaluating',
    '¿Cómo sabes si un modelo funciona de verdad?', 'How do you know whether a model really works?'],
  // ── Módulo 3 · Deep learning
  ['convoluciones', 3, 5, false, 'convoluciones-y-vision', 'convolutions-and-vision', 'Convoluciones y visión', 'Convolutions and vision',
    '¿Cómo aprende una red a ver bordes, formas y objetos?', 'How does a network learn to see edges, shapes, and objects?'],
  ['secuencias-y-memoria', 3, 10, false, 'secuencias-y-memoria', 'sequences-and-memory', 'Secuencias y memoria', 'Sequences and memory',
    '¿Cómo procesa una red algo que ocurre en orden, como una frase?', 'How does a network process something that happens in order, like a sentence?'],
  ['big-bang-deep-learning', 3, 9, false, 'el-big-bang-del-deep-learning', 'the-deep-learning-big-bang', 'El big bang del deep learning', 'The deep learning big bang',
    '¿Por qué funcionó en 2012 lo que no funcionaba en 1990?', 'Why did in 2012 what did not work in 1990?'],
  ['embeddings', 3, 10, true, 'embeddings-significado-como-geometria', 'embeddings-meaning-as-geometry', 'Embeddings: el significado como geometría', 'Embeddings: meaning as geometry',
    '¿Cómo convierte una máquina el significado en distancias?', 'How does a machine turn meaning into distances?'],
  // ── Módulo 4 · Generar imágenes
  ['generar-distribuciones', 4, 9, false, 'generar-es-aprender-una-distribucion', 'generating-is-learning-a-distribution', 'Generar es aprender una distribución', 'Generating is learning a distribution',
    '¿Qué significa que una red "genere" algo nuevo?', 'What does it mean for a network to "generate" something new?'],
  ['gans', 4, 6, false, 'redes-generativas-adversarias', 'generative-adversarial-networks', 'GAN: el falsificador y el detective', 'GANs: the forger and the detective',
    '¿Cómo aprende un generador compitiendo contra un crítico?', 'How does a generator learn by competing against a critic?'],
  ['difusion', 4, 6, false, 'modelos-de-difusion', 'diffusion-models', 'Difusión: de ruido a imagen', 'Diffusion: from noise to image',
    '¿Cómo se crea una imagen quitando ruido paso a paso?', 'How is an image created by removing noise step by step?'],
  ['texto-a-imagen', 4, 7, false, 'de-texto-a-imagen', 'from-text-to-image', 'De texto a imagen', 'From text to image',
    '¿Cómo entiende el modelo lo que le pides con palabras?', 'How does the model understand what you ask for in words?'],
  // ── Módulo 5 · Transformers y lenguaje
  ['siguiente-palabra', 5, 8, true, 'predecir-la-siguiente-palabra', 'predicting-the-next-word', 'Predecir la siguiente palabra', 'Predicting the next word',
    '¿Cómo puede escribir un ensayo algo que solo predice palabras?', 'How can something that only predicts words write an essay?'],
  ['tokens', 5, 7, true, 'tokens', 'tokens', 'Tokens: el alfabeto del modelo', 'Tokens: the model’s alphabet',
    '¿Qué lee realmente un modelo de lenguaje, y por qué importa?', 'What does a language model actually read, and why does it matter?'],
  ['atencion', 5, 10, false, 'atencion', 'attention', 'Atención', 'Attention',
    '¿Cómo decide una palabra a cuáles otras mirar?', 'How does a word decide which other words to look at?'],
  ['transformer', 5, 9, false, 'el-transformer', 'the-transformer', 'El transformer completo', 'The complete transformer',
    '¿Qué hay dentro de un LLM, bloque por bloque?', 'What is inside an LLM, block by block?'],
  // ── Módulo 6 · Escala
  ['preentrenamiento', 6, 8, false, 'preentrenamiento', 'pretraining', 'Preentrenamiento', 'Pretraining',
    '¿Qué aprende un modelo al leer medio internet?', 'What does a model learn from reading half the internet?'],
  ['leyes-escala-costos', 6, 8, true, 'leyes-de-escala-y-costos', 'scaling-laws-and-costs', 'Leyes de escala y costos', 'Scaling laws and costs',
    '¿Cuánto cuesta un modelo y qué se obtiene al hacerlo más grande?', 'How much does a model cost and what do you get by making it bigger?'],
  ['hardware-y-memoria', 6, 8, false, 'gpus-memoria-y-cuantizacion', 'gpus-memory-and-quantization', 'GPUs, memoria y cuantización', 'GPUs, memory, and quantization',
    '¿Por qué la memoria de la GPU manda sobre todo lo demás?', 'Why does GPU memory rule over everything else?'],
  ['inferencia', 6, 10, true, 'inferencia-como-responde-un-modelo', 'inference-how-a-model-answers', 'Inferencia: cómo responde un modelo', 'Inference: how a model answers',
    '¿Qué pasa, y cuánto cuesta, entre que escribes y que aparece la respuesta?', 'What happens, and what does it cost, between typing and the answer appearing?'],
  // ── Módulo 7 · Del modelo al asistente
  ['fine-tuning-lora', 7, 8, true, 'ajuste-fino-y-lora', 'fine-tuning-and-lora', 'Ajuste fino y LoRA', 'Fine-tuning and LoRA',
    '¿Cuándo conviene adaptar un modelo y cómo se hace barato?', 'When should you adapt a model, and how is it done cheaply?'],
  ['alineacion', 7, 9, true, 'alineacion-de-asistentes', 'aligning-assistants', 'De modelo base a asistente', 'From base model to assistant',
    '¿Qué convierte a un predictor de texto en un asistente útil?', 'What turns a text predictor into a useful assistant?'],
  ['razonamiento', 7, 8, false, 'modelos-de-razonamiento', 'reasoning-models', 'Modelos de razonamiento', 'Reasoning models',
    '¿Por qué pensar más antes de responder mejora la respuesta?', 'Why does thinking longer before answering improve the answer?'],
  ['contexto-y-memoria', 7, 9, true, 'contexto-y-memoria', 'context-and-memory', 'Contexto y memoria', 'Context and memory',
    '¿Recuerda el modelo lo que le dijiste? ¿Aprende mientras conversas?', 'Does the model remember what you said? Does it learn while you chat?'],
  ['rag', 7, 8, true, 'rag-leer-antes-de-responder', 'rag-read-before-answering', 'RAG: leer antes de responder', 'RAG: read before answering',
    '¿Cómo se le da conocimiento propio a un modelo sin reentrenarlo?', 'How do you give a model your own knowledge without retraining it?'],
  ['agentes', 7, 10, true, 'agentes-y-herramientas', 'agents-and-tools', 'Agentes y herramientas', 'Agents and tools',
    '¿Qué cambia cuando un modelo puede actuar, no solo hablar?', 'What changes when a model can act, not just talk?'],
  // ── Módulo 8 · Usar IA con criterio
  ['alucinaciones-y-limites', 8, 7, true, 'alucinaciones-y-limites', 'hallucinations-and-limits', 'Alucinaciones y límites', 'Hallucinations and limits',
    '¿Por qué se equivoca con tanta seguridad, y qué se puede hacer?', 'Why is it wrong with such confidence, and what can be done?'],
  ['evaluar', 8, 10, true, 'evaluar-sistemas-de-ia', 'evaluating-ai-systems', 'Evaluar sistemas de IA', 'Evaluating AI systems',
    '¿Cómo compruebas que un sistema de IA sirve para tu caso?', 'How do you check that an AI system works for your case?'],
  ['riesgos-y-gobernanza', 8, 8, true, 'riesgos-y-gobernanza', 'risks-and-governance', 'Riesgos y gobernanza', 'Risks and governance',
    '¿Qué puede salir mal y quién responde cuando sale mal?', 'What can go wrong, and who is accountable when it does?'],
  ['estrategia', 8, 9, true, 'estrategia-para-organizaciones', 'strategy-for-organizations', 'Estrategia para organizaciones', 'Strategy for organizations',
    '¿Dónde aplicar IA generativa en tu organización y cómo empezar?', 'Where to apply generative AI in your organization, and how to start?'],
  // ── Módulo 9 · Cierre
  ['mapa-completo', 9, 6, true, 'el-mapa-completo', 'the-complete-map', 'El mapa completo', 'The complete map',
    '¿Cómo encajan todas las piezas, de la neurona al chatbot?', 'How do all the pieces fit together, from neuron to chatbot?'],
];

export const LESSONS: LessonMeta[] = ROWS.map(([id, module, minutes, exec, sEs, sEn, tEs, tEn, qEs, qEn], i) => ({
  id, n: i + 1, module, minutes, exec,
  slug: { es: sEs, en: sEn },
  title: { es: tEs, en: tEn },
  question: { es: qEs, en: qEn },
}));

/** El curso se libera en tres partes, en orden: la 3 asume la 2 y la 2 asume la 1. */
export const PARTS: PartMeta[] = [
  { n: 1, id: 'como-aprende', modules: [1, 2, 3],
    title: { es: 'Cómo aprende una máquina', en: 'How a machine learns' },
    blurb: { es: 'De los datos a las redes profundas: error, neuronas, retropropagación, visión, secuencias y el significado como geometría.', en: 'From data to deep networks: error, neurons, backpropagation, vision, sequences, and meaning as geometry.' } },
  { n: 2, id: 'generar', modules: [4, 5, 6],
    title: { es: 'Generar: imágenes y lenguaje', en: 'Generating: images and language' },
    blurb: { es: 'Autocodificadores, GAN y difusión; después tokens, atención, el transformer, la escala y cómo responde un modelo.', en: 'Autoencoders, GANs, and diffusion; then tokens, attention, the transformer, scale, and how a model answers.' } },
  { n: 3, id: 'asistente-y-decision', modules: [7, 8, 9],
    title: { es: 'Del modelo al asistente y a la decisión', en: 'From model to assistant to decision' },
    blurb: { es: 'Ajuste fino, alineación, razonamiento, memoria, RAG y agentes; luego alucinaciones, evaluación, riesgos y estrategia.', en: 'Fine-tuning, alignment, reasoning, memory, RAG, and agents; then hallucinations, evaluation, risks, and strategy.' } },
];

export const IA_GENERATIVA: CourseMeta = {
  id: 'ia-generativa',
  slug: { es: 'ia-generativa', en: 'generative-ai' },
  title: { es: 'IA generativa: de la neurona al chatbot', en: 'Generative AI: from neuron to chatbot' },
  tagline: { es: 'Cómo funciona la IA generativa, desde cero.', en: 'How generative AI actually works, from scratch.' },
  lede: {
    es: 'Un curso completo y gratuito. Cada lección se construye paso a paso, con voz, animación y piezas que puedes mover para entender de verdad.',
    en: 'A complete, free course. Every lesson builds up step by step, with voice, animation, and pieces you can move so you really understand.',
  },
  description: {
    es: 'Curso gratuito de IA generativa en español: de la neurona artificial al chatbot, con animaciones interactivas, voz y una capa para quien decide.',
    en: 'Free course on generative AI: from the artificial neuron to the chatbot, with interactive animations, voice, and a layer for decision makers.',
  },
  modules: MODULES,
  parts: PARTS,
  lessons: LESSONS,
};
