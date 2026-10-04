import { defineLesson } from '../../../../../core/define';

// Lección 24 · Leyes de escala y costos. Las cifras y fórmulas están verificadas contra los artículos originales
// (ver `sources` y los comentarios de model.ts). Todo valor de la calculadora es un SUPUESTO ilustrativo.
export default defineLesson({
  id: 'leyes-escala-costos',

  objectives: {
    es: [
      'Explicar por qué la pérdida baja de forma predecible al crecer los parámetros, los datos y el cómputo, y por qué los rendimientos decrecen.',
      'Calcular los FLOPs de un entrenamiento (6·N·D), los días de GPU y el costo, y qué cambia al duplicar las GPU.',
      'Predecir cómo repartir un presupuesto fijo entre parámetros y datos (≈ 20 tokens por parámetro) y leer con criterio «modelo más grande = mejor».',
    ],
    en: [
      'Explain why the loss falls predictably as parameters, data, and compute grow, and why returns diminish.',
      'Calculate a training run’s FLOPs (6·N·D), GPU-days, and cost, and what changes when you double the GPUs.',
      'Predict how to split a fixed budget between parameters and data (≈ 20 tokens per parameter) and read “bigger model = better” with judgment.',
    ],
  },

  segments: [
    // ── Acto 1 · la curva ─────────────────────────────────────────────────────────────
    {
      id: 'hook',
      es: 'Entrenar un modelo grande cuesta muchísimo. La pregunta de esta lección: ¿cuánto mejora el modelo a cambio, y se puede saber antes de gastar?',
      en: 'Training a big model costs a great deal. The question of this lesson: how much better does the model get in return, and can we know before spending?',
    },
    {
      id: 'levers',
      es: 'Hay tres palancas para mejorarlo: más parámetros, N; más datos de entrenamiento, D, contados en tokens; y más cómputo, C, el total de operaciones. Las tres cuestan dinero.',
      en: 'There are three levers to improve it: more parameters, N; more training data, D, counted in tokens; and more compute, C, the total number of operations. All three cost money.',
      note: { es: 'Tres palancas: parámetros N, tokens D y cómputo C.', en: 'Three levers: parameters N, tokens D, and compute C.' },
    },
    {
      id: 'kaplan',
      es: 'En 2020, Jared Kaplan y su equipo de OpenAI entrenaron modelos de unos cientos a mil quinientos millones de parámetros y midieron su pérdida, el error al predecir la siguiente palabra.',
      en: 'In 2020, Jared Kaplan and his OpenAI team trained models from a few hundred to one and a half billion parameters and measured their loss, the error in predicting the next word.',
      tts: {
        es: 'En dos mil veinte, Jared Kaplan y su equipo de Open A I entrenaron modelos de unos cientos a mil quinientos millones de parámetros y midieron su pérdida, el error al predecir la siguiente palabra.',
        en: 'In twenty twenty, Jared Kaplan and his Open A I team trained models from a few hundred to one and a half billion parameters and measured their loss, the error in predicting the next word.',
      },
    },
    {
      id: 'flat',
      es: 'En ejes normales la curva se aplana: los primeros parámetros ayudan muchísimo y los siguientes cada vez menos. Son los rendimientos decrecientes.',
      en: 'On ordinary axes the curve flattens: the first parameters help a lot and each new batch helps less. These are diminishing returns.',
      pad: 0.3,
    },
    {
      id: 'loglog',
      es: 'Cambiemos a escala logarítmica en los dos ejes, donde cada marca vale diez veces la anterior. La curva se endereza y queda una recta.',
      en: 'Let’s switch to a logarithmic scale on both axes, where each tick is ten times the previous one. The curve straightens into a line.',
      pad: 0.6,
    },
    {
      id: 'powerlaw',
      es: 'Una recta en escala logarítmica es una ley de potencia: la pérdida es proporcional a N elevado a menos cero coma cero siete seis. Kaplan la ajustó con sus modelos.',
      en: 'A straight line on log axes is a power law: the loss is proportional to N raised to the power minus zero point zero seven six. Kaplan fitted it to his models.',
      note: { es: 'Ley de escala: la pérdida cae como una potencia de N, D o C.', en: 'Scaling law: the loss falls as a power of N, D, or C.' },
    },
    {
      id: 'times10',
      es: 'Regla práctica: cada vez que multiplicas los parámetros por diez, la pérdida se multiplica por cero coma ochenta y cuatro. Baja un dieciséis por ciento, siempre en la misma proporción.',
      en: 'Rule of thumb: every time you multiply the parameters by ten, the loss gets multiplied by zero point eight four. It drops sixteen percent, always in the same proportion.',
      note: { es: '×10 en parámetros: la pérdida baja ≈ 16 %, pero el costo se multiplica.', en: '×10 in parameters: the loss drops ≈ 16 %, but the cost multiplies.' },
      pad: 0.3,
    },
    {
      id: 'three',
      es: 'Los datos y el cómputo tienen su propia recta: diez veces más datos multiplican la pérdida por cero coma ochenta; diez veces más cómputo, por cero coma ochenta y nueve.',
      en: 'Data and compute have their own lines: ten times more data multiplies the loss by zero point eight zero; ten times more compute, by zero point eight nine.',
      pad: 0.3,
    },
    {
      id: 'predict',
      es: 'Lo valioso es que la recta predice. Entrenas modelos pequeños, la prolongas, y estimas la pérdida de uno cien veces mayor antes de pagarlo. Es extrapolar, con sus riesgos.',
      en: 'The valuable part is that the line predicts. Train small models, extend the line, and estimate the loss of one a hundred times bigger before paying for it. It is extrapolation, with its risks.',
      pad: 0.5,
    },

    // ── Acto 2 · cuánto cómputo: 6·N·D ────────────────────────────────────────────────
    {
      id: 'flops',
      es: 'Pero ¿cuánto cuesta cada punto de la recta? Se mide en FLOPs: operaciones de coma flotante, cada una una suma o una multiplicación con decimales.',
      en: 'But what does each point on the line cost? It is measured in FLOPs: floating-point operations, each one an addition or a multiplication with decimals.',
      pad: 0.3,
    },
    {
      id: 'fwd',
      es: 'Cada token que atraviesa el modelo pasa por todos sus parámetros, y cada parámetro hace una multiplicación y una suma. Con N parámetros, son dos N operaciones.',
      en: 'Each token that goes through the model passes every parameter, and each parameter does one multiplication and one addition. With N parameters, that is two N operations.',
      pad: 0.3,
    },
    {
      id: 'bwd',
      es: 'Luego viene la retropropagación, que cuesta el doble que el pase hacia delante: cuatro N más. En total, seis N operaciones por cada token.',
      en: 'Then comes backpropagation, which costs twice as much as the forward pass: four N more. In total, six N operations for every token.',
      pad: 0.3,
    },
    {
      id: 'sixnd',
      es: 'Con D tokens de entrenamiento, el total es seis por N por D. Es una aproximación: Hoffmann y colegas la contrastaron con sus modelos y quedó dentro de un diez por ciento.',
      en: 'With D training tokens, the total is six times N times D. It is an approximation: Hoffmann and colleagues checked it against their models and it held within ten percent.',
      tts: {
        es: 'Con D tokens de entrenamiento, el total es seis por N por D. Es una aproximación: Jofman y colegas la contrastaron con sus modelos y quedó dentro de un diez por ciento.',
        en: 'With D training tokens, the total is six times N times D. It is an approximation: Hoffmann and colleagues checked it against their models and it held within ten percent.',
      },
      note: { es: 'Cómputo de entrenamiento: C ≈ 6 · N · D FLOPs.', en: 'Training compute: C ≈ 6 · N · D FLOPs.' },
      pad: 0.3,
    },
    {
      id: 'check',
      es: 'Comprobémoslo. GPT-3 da 3.15 × 10²³ y su informe reporta 3.14. Llama 3.1, con 405 mil millones de parámetros y 15.6 billones de tokens, da 3.8 × 10²⁵.',
      en: 'Let’s check. GPT-3 gives 3.15 × 10²³ and its report says 3.14. Llama 3.1, with 405 billion parameters and 15.6 trillion tokens, gives 3.8 × 10²⁵.',
      tts: {
        es: 'Comprobémoslo. Ge pe te tres da tres coma quince por diez a la veintitrés, y su informe reporta tres coma catorce. Lama tres punto uno, con cuatrocientos cinco mil millones de parámetros y quince coma seis billones de tokens, da tres coma ocho por diez a la veinticinco.',
        en: 'Let’s check. G P T three gives three point one five times ten to the twenty-third, and its report says three point one four. Llama three point one, with four hundred five billion parameters and fifteen point six trillion tokens, gives three point eight times ten to the twenty-fifth.',
      },
      pad: 0.4,
    },

    // ── Acto 3 · de FLOPs a días y dinero: la calculadora ──────────────────────────────
    {
      id: 'mfu',
      es: 'Falta pasar de operaciones a tiempo. Una GPU nunca rinde su pico: la fracción que aprovecha se llama MFU, y en entrenamientos publicados va de una quinta parte a casi la mitad.',
      en: 'Now to turn operations into time. A GPU never delivers its peak: the fraction it uses is called MFU, and in published training runs it ranges from a fifth to nearly half.',
      tts: {
        es: 'Falta pasar de operaciones a tiempo. Una ge pe u nunca rinde su pico: la fracción que aprovecha se llama eme efe u, y en entrenamientos publicados va de una quinta parte a casi la mitad.',
        en: 'Now to turn operations into time. A G P U never delivers its peak: the fraction it uses is called M F U, and in published training runs it ranges from a fifth to nearly half.',
      },
      pad: 0.4,
    },
    {
      id: 'chain',
      es: 'La cadena completa: los FLOPs entre lo que rinden todas tus GPU dan segundos; los segundos, días; y las horas de GPU por su precio dan dinero.',
      en: 'The whole chain: FLOPs divided by what all your GPUs deliver gives seconds; seconds become days; and GPU-hours times their price give money.',
      pad: 0.5,
    },
    {
      id: 'calc-out',
      es: 'Esta calculadora es real. Con supuestos ilustrativos, no precios de mercado, siete mil millones de parámetros y ciento cuarenta mil millones de tokens salen en unas dieciséis horas y ocho mil dólares.',
      en: 'This calculator is real. With illustrative assumptions, not market prices, seven billion parameters and one hundred forty billion tokens come out at about sixteen hours and eight thousand dollars.',
      pad: 0.4,
    },
    {
      id: 'try-calc',
      es: 'Tu turno: lleva N y D a los de GPT-3, ciento setenta y cinco mil millones y trescientos mil millones. Luego duplica las GPU y mira qué cambia.',
      en: 'Your turn: set N and D to GPT-3’s, one hundred seventy-five billion and three hundred billion. Then double the GPUs and see what changes.',
      tts: {
        es: 'Tu turno: lleva N y D a los de Ge pe te tres, ciento setenta y cinco mil millones y trescientos mil millones. Luego duplica las ge pe u y mira qué cambia.',
        en: 'Your turn: set N and D to G P T three’s, one hundred seventy-five billion and three hundred billion. Then double the G P Us and see what changes.',
      },
      gate: {
        id: 'calc',
        prompt: { es: 'Pon N ≈ 175 mil M y D ≈ 300 mil M; después duplica las GPU.', en: 'Set N ≈ 175B and D ≈ 300B; then double the GPUs.' },
      },
      pad: 0.4,
    },
    {
      id: 'more-gpus',
      es: 'Más GPU acortan los días, pero no abaratan el entrenamiento: pagas las mismas horas de GPU, solo que en paralelo. Lo que sí lo abarata es un mejor MFU o un precio por hora menor.',
      en: 'More GPUs shorten the days but do not make training cheaper: you pay for the same GPU-hours, just in parallel. What does make it cheaper is a better MFU or a lower price per hour.',
      tts: {
        es: 'Más ge pe u acortan los días, pero no abaratan el entrenamiento: pagas las mismas horas de ge pe u, solo que en paralelo. Lo que sí lo abarata es un mejor eme efe u o un precio por hora menor.',
        en: 'More G P Us shorten the days but do not make training cheaper: you pay for the same G P U hours, just in parallel. What does make it cheaper is a better M F U or a lower price per hour.',
      },
      note: { es: 'Costo ≈ FLOPs ÷ (pico × MFU) × precio por hora de GPU.', en: 'Cost ≈ FLOPs ÷ (peak × MFU) × price per GPU-hour.' },
      pad: 0.4,
    },

    // ── Acto 4 · el reparto: Chinchilla ───────────────────────────────────────────────
    {
      id: 'budget-intro',
      es: 'Ahora invierte la pregunta: ya tienes un presupuesto de cómputo, una cifra fija. Como C es seis N D, si subes N tienes que bajar D. ¿Cómo repartirlo?',
      en: 'Now flip the question: you already have a compute budget, a fixed number. Since C is six N D, raising N means lowering D. How should you split it?',
      pad: 0.3,
    },
    {
      id: 'kaplan-says',
      es: 'Kaplan sugería gastar casi todo el aumento en modelos mayores. Así se entrenaron GPT-3 y Gopher: enormes, pero con unos trescientos mil millones de tokens cada uno.',
      en: 'Kaplan suggested spending most of any increase on bigger models. That is how GPT-3 and Gopher were trained: huge, but with about three hundred billion tokens each.',
      tts: {
        es: 'Kaplan sugería gastar casi todo el aumento en modelos mayores. Así se entrenaron Ge pe te tres y Gófer: enormes, pero con unos trescientos mil millones de tokens cada uno.',
        en: 'Kaplan suggested spending most of any increase on bigger models. That is how G P T three and Gopher were trained: huge, but with about three hundred billion tokens each.',
      },
      pad: 0.3,
    },
    {
      id: 'chinchilla',
      es: 'En 2022, DeepMind midió más de cuatrocientos modelos y probó otra receta: Chinchilla, setenta mil millones de parámetros, un billón cuatrocientos mil millones de tokens y el mismo cómputo que Gopher.',
      en: 'In 2022, DeepMind measured over four hundred models and tried another recipe: Chinchilla, seventy billion parameters, one point four trillion tokens, and the same compute as Gopher.',
      tts: {
        es: 'En dos mil veintidós, Dip Maind midió más de cuatrocientos modelos y probó otra receta: Chinchilla, setenta mil millones de parámetros, un billón cuatrocientos mil millones de tokens y el mismo cómputo que Gófer.',
        en: 'In twenty twenty-two, DeepMind measured over four hundred models and tried another recipe: Chinchilla, seventy billion parameters, one point four trillion tokens, and the same compute as Gopher.',
      },
      pad: 0.4,
    },
    {
      id: 'outcome',
      es: 'Chinchilla, cuatro veces más pequeño que Gopher, le ganó en casi todas las pruebas. Mismo cómputo de entrenamiento, mejor modelo y más barato de usar después.',
      en: 'Chinchilla, four times smaller than Gopher, beat it on most benchmarks. Same training compute, a better model, and cheaper to run afterwards.',
      tts: {
        es: 'Chinchilla, cuatro veces más pequeño que Gófer, le ganó en casi todas las pruebas. Mismo cómputo de entrenamiento, mejor modelo y más barato de usar después.',
        en: 'Chinchilla, four times smaller than Gopher, beat it on most benchmarks. Same training compute, a better model, and cheaper to run afterwards.',
      },
      pad: 0.4,
    },
    {
      id: 'ratio',
      es: 'La regla que dejó: unos veinte tokens de entrenamiento por parámetro. Si duplicas el tamaño del modelo, duplica también los datos.',
      en: 'The rule it left behind: about twenty training tokens per parameter. If you double the model, double the data too.',
      note: { es: 'Chinchilla: ≈ 20 tokens de entrenamiento por parámetro.', en: 'Chinchilla: ≈ 20 training tokens per parameter.' },
      pad: 0.4,
    },
    {
      id: 'try-budget',
      es: 'Tu turno: con el presupuesto fijo, desliza el tamaño del modelo y observa la pérdida. Encuentra el mínimo y mira cuántos tokens por parámetro tiene.',
      en: 'Your turn: with the budget fixed, slide the model size and watch the loss. Find the minimum and see how many tokens per parameter it has.',
      gate: {
        id: 'budget',
        prompt: { es: 'Encuentra el tamaño de modelo con la menor pérdida para este presupuesto.', en: 'Find the model size with the lowest loss for this budget.' },
      },
      pad: 0.4,
    },
    {
      id: 'both-grow',
      es: 'Cuando el presupuesto crece, el óptimo crece en las dos direcciones: con cien veces más cómputo, unas diez veces más parámetros y unas diez veces más datos.',
      en: 'When the budget grows, the optimum grows in both directions: with a hundred times more compute, about ten times more parameters and about ten times more data.',
      pad: 0.5,
    },
    {
      id: 'rule',
      es: 'Pero veinte es una regla empírica, no una ley. Depende de los datos: con su propio ajuste, Meta obtuvo unos cuarenta tokens por parámetro para Llama 3.',
      en: 'But twenty is an empirical rule, not a law. It depends on the data: with its own fit, Meta found about forty tokens per parameter for Llama 3.',
      tts: {
        es: 'Pero veinte es una regla empírica, no una ley. Depende de los datos: con su propio ajuste, Meta obtuvo unos cuarenta tokens por parámetro para Lama tres.',
        en: 'But twenty is an empirical rule, not a law. It depends on the data: with its own fit, Meta found about forty tokens per parameter for Llama three.',
      },
      pad: 0.4,
    },

    // ── Acto 5 · el debate de las habilidades emergentes ───────────────────────────────
    {
      id: 'emergent',
      es: 'Pero la pérdida no es lo que tú usas. En 2022, Wei y colegas describieron habilidades «emergentes»: casi nulas en modelos pequeños y, pasado cierto tamaño, de pronto buenas.',
      en: 'But loss is not what you use. In 2022, Wei and colleagues described “emergent” abilities: near zero in small models and, past a certain size, suddenly good.',
      tts: {
        es: 'Pero la pérdida no es lo que tú usas. En dos mil veintidós, Uei y colegas describieron habilidades «emergentes»: casi nulas en modelos pequeños y, pasado cierto tamaño, de pronto buenas.',
        en: 'But loss is not what you use. In twenty twenty-two, Wei and colleagues described “emergent” abilities: near zero in small models and, past a certain size, suddenly good.',
      },
      pad: 0.5,
    },
    {
      id: 'mirage',
      es: 'En 2023, Schaeffer y colegas respondieron que gran parte del salto viene de la métrica: «todo o nada» convierte una mejora gradual en un escalón. Con una métrica gradual, la curva es suave.',
      en: 'In 2023, Schaeffer and colleagues replied that much of the jump comes from the metric: “all or nothing” turns gradual improvement into a step. With a gradual metric, the curve is smooth.',
      tts: {
        es: 'En dos mil veintitrés, Sheifer y colegas respondieron que gran parte del salto viene de la métrica: «todo o nada» convierte una mejora gradual en un escalón. Con una métrica gradual, la curva es suave.',
        en: 'In twenty twenty-three, Schaeffer and colleagues replied that much of the jump comes from the metric: “all or nothing” turns gradual improvement into a step. With a gradual metric, the curve is smooth.',
      },
      pad: 0.5,
    },
    {
      id: 'try-metric',
      es: 'Tu turno: cambia la métrica y acorta la respuesta. ¿Cuándo desaparece el escalón?',
      en: 'Your turn: change the metric and shorten the answer. When does the step disappear?',
      gate: {
        id: 'metric',
        prompt: { es: 'Cambia a puntaje parcial, o acorta la respuesta a uno o dos tokens.', en: 'Switch to partial score, or shorten the answer to one or two tokens.' },
      },
      pad: 0.4,
    },
    {
      id: 'verdict',
      es: 'Moraleja matizada: la pérdida se predice bien; qué tarea concreta pasará de fallar a servir, mucho menos. El debate sigue abierto, así que prueba con tus propias tareas.',
      en: 'A nuanced moral: loss is predicted well; which specific task will go from failing to working is much harder to say. The debate is still open, so test your own tasks.',
      note: { es: 'La pérdida es predecible; las habilidades concretas, mucho menos.', en: 'Loss is predictable; specific abilities, much less so.' },
      pad: 0.4,
    },

    // ── Acto 6 · qué decides tú ───────────────────────────────────────────────────────
    {
      id: 'from-scratch',
      es: 'Casi ninguna organización entrena desde cero. Llama 3.1 usó hasta dieciséis mil GPU a la vez, y la calculadora no incluye datos, personal, ensayos ni corridas fallidas.',
      en: 'Almost no organization trains from scratch. Llama 3.1 used up to sixteen thousand GPUs at once, and the calculator leaves out data, staff, experiments, and failed runs.',
      tts: {
        es: 'Casi ninguna organización entrena desde cero. Lama tres punto uno usó hasta dieciséis mil ge pe u a la vez, y la calculadora no incluye datos, personal, ensayos ni corridas fallidas.',
        en: 'Almost no organization trains from scratch. Llama three point one used up to sixteen thousand G P Us at once, and the calculator leaves out data, staff, experiments, and failed runs.',
      },
      pad: 0.4,
    },
    {
      id: 'instead',
      es: 'Lo que sí decides es otra cosa: qué modelo usar, si ajustarlo con tus datos, si darle tus documentos y cuánto costará servirlo. Ajustar cuesta una fracción del preentrenamiento.',
      en: 'What you do decide is something else: which model to use, whether to adjust it with your data, whether to feed it your documents, and what it will cost to serve. Adjusting costs a fraction of pretraining.',
      note: { es: 'Casi nadie entrena desde cero: se elige, se ajusta y se sirve.', en: 'Almost no one trains from scratch: you choose, adjust, and serve.' },
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'El cómputo cuenta cuántas operaciones hacen falta, pero el cuello de botella real suele ser otro: que el modelo quepa en la memoria de la GPU. De eso sigue.',
      en: 'Compute counts how many operations are needed, but the real bottleneck is often something else: whether the model fits in the GPU’s memory. That comes next.',
      tts: {
        es: 'El cómputo cuenta cuántas operaciones hacen falta, pero el cuello de botella real suele ser otro: que el modelo quepa en la memoria de la ge pe u. De eso sigue.',
        en: 'Compute counts how many operations are needed, but the real bottleneck is often something else: whether the model fits in the G P U’s memory. That comes next.',
      },
    },
  ],

  keyIdeas: {
    es: [
      'La pérdida de un modelo de lenguaje baja de forma predecible, como una ley de potencia, al crecer los parámetros, los datos o el cómputo (Kaplan et al., 2020).',
      'Cada ×10 en parámetros multiplica la pérdida por ≈ 0.84: la mejora relativa es constante, pero el costo se multiplica por diez. Son rendimientos decrecientes.',
      'El cómputo de entrenamiento es C ≈ 6·N·D FLOPs. Con las GPU, el MFU y el precio por hora salen los días y el dinero.',
      'Más GPU acortan el calendario, no el costo: el costo lo fijan los FLOPs, el MFU y el precio por hora de GPU.',
      'Con un presupuesto fijo, parámetros y datos deben crecer a la par (≈ 20 tokens por parámetro, Chinchilla). Y las habilidades «emergentes» dependen en parte de cómo se mida.',
    ],
    en: [
      'A language model’s loss falls predictably, as a power law, as parameters, data, or compute grow (Kaplan et al., 2020).',
      'Each ×10 in parameters multiplies the loss by ≈ 0.84: the relative gain is constant, but the cost multiplies by ten. These are diminishing returns.',
      'Training compute is C ≈ 6·N·D FLOPs. With the GPUs, the MFU, and the hourly price you get the days and the money.',
      'More GPUs shorten the calendar, not the cost: cost is set by the FLOPs, the MFU, and the price per GPU-hour.',
      'With a fixed budget, parameters and data should grow together (≈ 20 tokens per parameter, Chinchilla). And “emergent” abilities depend partly on how they are measured.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un modelo con más parámetros siempre es mejor: basta con hacerlo más grande.',
      en: 'A model with more parameters is always better: just make it bigger.',
    },
    right: {
      es: 'Con un presupuesto fijo, uno más pequeño entrenado con más datos puede ganar: Chinchilla (70 mil millones) superó a Gopher (280 mil millones) con el mismo cómputo. Y cada ×10 de tamaño baja la pérdida una proporción fija, pero cuesta unas diez veces más.',
      en: 'With a fixed budget, a smaller one trained on more data can win: Chinchilla (70 billion) beat Gopher (280 billion) with the same compute. And each ×10 in size lowers the loss by a fixed proportion, but costs about ten times more.',
    },
  },

  deeper: {
    es: `## La ley de potencia

Kaplan et al. (2020) entrenaron modelos de 768 a 1 500 millones de parámetros y ajustaron la pérdida $L$ (entropía cruzada, en nats por token) frente al número de parámetros $N$, sin contar los embeddings:

$$L(N)=\\left(\\frac{N_c}{N}\\right)^{\\alpha_N},\\qquad \\alpha_N\\approx 0.076,\\quad N_c\\approx 8.8\\cdot 10^{13}$$

Eso vale para modelos que convergen con datos de sobra. Con un modelo enorme y datos limitados, $L(D)=(D_c/D)^{\\alpha_D}$ con $\\alpha_D\\approx 0.095$; y con el cómputo repartido de forma óptima, $L(C_{\\min})\\propto C_{\\min}^{-0.050}$. Multiplicar $N$ por $k$ multiplica $L$ por $k^{-\\alpha_N}$: por 2, 0.95; por 10, 0.84. Las constantes dependen del vocabulario y de los datos («no tienen un significado fundamental», dicen los autores), y fuera del rango medido todo es extrapolación.

## El reparto óptimo (Chinchilla)

Hoffmann et al. (2022) proponen para la pérdida, en función de parámetros y tokens,

$$\\hat L(N,D)=E+\\frac{A}{N^{\\alpha}}+\\frac{B}{D^{\\beta}}$$

$E$ es la pérdida irreducible (la entropía del texto); el segundo término es lo que falta por tener un modelo finito, y el tercero, por haber visto datos finitos. Con $C\\approx 6ND$ fijo, minimizar $\\hat L$ da

$$N_{\\mathrm{opt}}=G\\left(\\tfrac{C}{6}\\right)^{a},\\quad D_{\\mathrm{opt}}=G^{-1}\\left(\\tfrac{C}{6}\\right)^{b},\\quad a=\\tfrac{\\beta}{\\alpha+\\beta},\\ b=\\tfrac{\\alpha}{\\alpha+\\beta},\\ G=\\left(\\tfrac{\\alpha A}{\\beta B}\\right)^{\\frac{1}{\\alpha+\\beta}}$$

Una advertencia honesta sobre las constantes. Las que imprime el artículo ($E=1.69$, $A=406.4$, $B=410.7$, $\\alpha=0.34$, $\\beta=0.28$) dan, para el presupuesto de Gopher, un modelo óptimo de unos 40 mil millones de parámetros, distinto de los ≈ 67 mil millones que obtienen los otros dos métodos del propio artículo. Besiroglu et al. (2024, Epoch AI) re-estimaron las cinco constantes con los datos de la figura 4 y obtuvieron $E=1.8172$, $A=482.01$, $B=2085.43$, $\\alpha=0.3478$, $\\beta=0.3658$, coherentes con los otros métodos. La lección usa estas, con la forma de Hoffmann: dan $a\\approx 0.51$, $b\\approx 0.49$ y, con $5.76\\cdot 10^{23}$ FLOPs, $N\\approx 7.2\\cdot 10^{10}$ y $D\\approx 1.3\\cdot 10^{12}$, unos 18 tokens por parámetro. Son un ajuste a esos datos: sirven para ver la forma, no para predecir tu modelo.

Kaplan había encontrado $N_{\\mathrm{opt}}\\propto C^{0.73}$. Porian et al. (2024) mostraron que la diferencia con Chinchilla se explica por el costo de la última capa, la duración del calentamiento y el ajuste del optimizador.

## De FLOPs a días y dinero

Un paso hacia delante cuesta unas $2N$ operaciones (una multiplicación y una suma por parámetro) y el paso hacia atrás, unas dos veces eso. De ahí

$$C\\approx 6ND$$

La aproximación ignora el término de atención que depende del contexto, pequeño cuando $d_{\\text{modelo}}\\gg n_{\\text{ctx}}/12$ (Kaplan et al.). Hoffmann et al. compararon su conteo exacto con $6ND$ en modelos de 73 M a 6.8 mil M de parámetros: la razón fue de 0.99 a 1.10. Para GPT-3, $6\\cdot 175\\cdot 10^{9}\\cdot 300\\cdot 10^{9}=3.15\\cdot 10^{23}$; el artículo reporta $3.14\\cdot 10^{23}$ (tabla D.1).

Con $G$ GPU de pico $P$ (FLOP/s) y una fracción de aprovechamiento $\\mathrm{MFU}$ (Chowdhery et al., 2022: rendimiento observado entre el máximo teórico),

$$t=\\frac{6ND}{G\\,P\\,\\mathrm{MFU}},\\qquad H=\\frac{G\\,t}{3600},\\qquad \\text{costo}=H\\cdot\\text{precio por GPU-hora}$$

Como $H=6ND/(3600\\,P\\,\\mathrm{MFU})$ no depende de $G$, duplicar las GPU reduce $t$ a la mitad y deja el costo igual, mientras el MFU se mantenga. En clústeres enormes cae: Llama 3 405B reporta un MFU de 38 a 43 % y 466 interrupciones en 54 días de entrenamiento.

Verificación con un entrenamiento real: Llama 2 70B usó 1 720 320 horas de GPU A100 con 2 billones de tokens (Touvron et al., 2023, tabla 2). Con $6ND=8.4\\cdot 10^{23}$ eso implica $1.36\\cdot 10^{14}$ FLOP/s por GPU, el 43.5 % del pico de 312 teraFLOPS de la A100 (BF16, denso): un MFU parecido al de Llama 3. Para la H100, la ficha de NVIDIA da 1 979 teraFLOPS con esparsidad, es decir, unos 989 sin ella: el valor de partida de la calculadora.

## En código

\`\`\`python
def entrenamiento(n, d, gpus=256, pico_tflops=989, mfu=0.40, precio_hora=2.0):
    flops = 6 * n * d
    segundos = flops / (gpus * pico_tflops * 1e12 * mfu)
    horas_gpu = gpus * segundos / 3600
    return flops, segundos / 86400, horas_gpu * precio_hora

def optimo(c, E=1.8172, A=482.01, B=2085.43, alfa=0.3478, beta=0.3658):
    a, b = beta / (alfa + beta), alfa / (alfa + beta)
    g = (alfa * A / (beta * B)) ** (1 / (alfa + beta))
    n = g * (c / 6) ** a
    return n, c / (6 * n)

f, dias, costo = entrenamiento(175e9, 300e9)            # GPT-3, 256 GPU
print(f"{f:.2e} FLOPs, {dias:.0f} días, US$ {costo:,.0f}")
f, dias, costo = entrenamiento(175e9, 300e9, gpus=512)  # el doble de GPU
print(f"{f:.2e} FLOPs, {dias:.0f} días, US$ {costo:,.0f}")
n, d = optimo(5.76e23)                                  # presupuesto de Gopher
print(f"N = {n:.2e}, D = {d:.2e}, tokens por parámetro = {d / n:.1f}")
# 3.15e+23 FLOPs, 36 días, US$ 442,366
# 3.15e+23 FLOPs, 18 días, US$ 442,366
# N = 7.22e+10, D = 1.33e+12, tokens por parámetro = 18.4
\`\`\`

Las 256 GPU, los 989 teraFLOPS, el 40 % de MFU y los 2 dólares por GPU-hora son **supuestos ilustrativos**, no precios de mercado; la cifra solo cubre la corrida final.

## Lo que viene

La memoria de la GPU (lección 25) decide qué modelo cabe y cómo se reparte el trabajo. La inferencia (lección 26) tiene su propio costo, que pesa más cuanto más se use el modelo: Sardana et al. (2024) muestran que con mucha demanda conviene entrenar modelos más pequeños durante más tokens que el óptimo de Chinchilla. Y el ajuste fino (lección 27) reutiliza un modelo base en vez de repetir esta cuenta.`,
    en: `## The power law

Kaplan et al. (2020) trained models from 768 to 1.5 billion parameters and fitted the loss $L$ (cross-entropy, in nats per token) against the number of parameters $N$, not counting embeddings:

$$L(N)=\\left(\\frac{N_c}{N}\\right)^{\\alpha_N},\\qquad \\alpha_N\\approx 0.076,\\quad N_c\\approx 8.8\\cdot 10^{13}$$

That holds for models that converge with plenty of data. With a huge model and limited data, $L(D)=(D_c/D)^{\\alpha_D}$ with $\\alpha_D\\approx 0.095$; and with compute allocated optimally, $L(C_{\\min})\\propto C_{\\min}^{-0.050}$. Multiplying $N$ by $k$ multiplies $L$ by $k^{-\\alpha_N}$: by 2, 0.95; by 10, 0.84. The constants depend on the vocabulary and the data (“they do not have a fundamental meaning,” say the authors), and outside the measured range everything is extrapolation.

## The optimal split (Chinchilla)

Hoffmann et al. (2022) propose, for the loss as a function of parameters and tokens,

$$\\hat L(N,D)=E+\\frac{A}{N^{\\alpha}}+\\frac{B}{D^{\\beta}}$$

$E$ is the irreducible loss (the entropy of text); the second term is what is missing for having a finite model, and the third for having seen finite data. With $C\\approx 6ND$ fixed, minimizing $\\hat L$ gives

$$N_{\\mathrm{opt}}=G\\left(\\tfrac{C}{6}\\right)^{a},\\quad D_{\\mathrm{opt}}=G^{-1}\\left(\\tfrac{C}{6}\\right)^{b},\\quad a=\\tfrac{\\beta}{\\alpha+\\beta},\\ b=\\tfrac{\\alpha}{\\alpha+\\beta},\\ G=\\left(\\tfrac{\\alpha A}{\\beta B}\\right)^{\\frac{1}{\\alpha+\\beta}}$$

An honest warning about the constants. The ones printed in the paper ($E=1.69$, $A=406.4$, $B=410.7$, $\\alpha=0.34$, $\\beta=0.28$) give, for Gopher’s budget, an optimal model of about 40 billion parameters, different from the ≈ 67 billion that the paper’s own other two methods produce. Besiroglu et al. (2024, Epoch AI) re-estimated all five constants from the data in figure 4 and got $E=1.8172$, $A=482.01$, $B=2085.43$, $\\alpha=0.3478$, $\\beta=0.3658$, consistent with the other methods. The lesson uses these, with Hoffmann’s form: they give $a\\approx 0.51$, $b\\approx 0.49$ and, at $5.76\\cdot 10^{23}$ FLOPs, $N\\approx 7.2\\cdot 10^{10}$ and $D\\approx 1.3\\cdot 10^{12}$, about 18 tokens per parameter. They are a fit to those data: good for seeing the shape, not for predicting your model.

Kaplan had found $N_{\\mathrm{opt}}\\propto C^{0.73}$. Porian et al. (2024) showed that the gap with Chinchilla is explained by the cost of the last layer, the warmup duration, and optimizer tuning.

## From FLOPs to days and dollars

A forward pass costs about $2N$ operations (one multiplication and one addition per parameter) and the backward pass about twice that. Hence

$$C\\approx 6ND$$

The approximation ignores the context-dependent attention term, small when $d_{\\text{model}}\\gg n_{\\text{ctx}}/12$ (Kaplan et al.). Hoffmann et al. compared their exact count with $6ND$ for models from 73M to 6.8B parameters: the ratio was 0.99 to 1.10. For GPT-3, $6\\cdot 175\\cdot 10^{9}\\cdot 300\\cdot 10^{9}=3.15\\cdot 10^{23}$; the paper reports $3.14\\cdot 10^{23}$ (table D.1).

With $G$ GPUs of peak $P$ (FLOP/s) and a utilization fraction $\\mathrm{MFU}$ (Chowdhery et al., 2022: observed throughput divided by the theoretical maximum),

$$t=\\frac{6ND}{G\\,P\\,\\mathrm{MFU}},\\qquad H=\\frac{G\\,t}{3600},\\qquad \\text{cost}=H\\cdot\\text{price per GPU-hour}$$

Since $H=6ND/(3600\\,P\\,\\mathrm{MFU})$ does not depend on $G$, doubling the GPUs halves $t$ and leaves the cost unchanged, as long as MFU holds. In huge clusters it drops: Llama 3 405B reports an MFU of 38 to 43% and 466 interruptions in 54 days of training.

A check against a real run: Llama 2 70B used 1,720,320 A100 GPU-hours on 2 trillion tokens (Touvron et al., 2023, table 2). With $6ND=8.4\\cdot 10^{23}$ that implies $1.36\\cdot 10^{14}$ FLOP/s per GPU, 43.5% of the A100’s 312-teraFLOPS peak (BF16, dense): an MFU similar to Llama 3’s. For the H100, NVIDIA’s datasheet gives 1,979 teraFLOPS with sparsity, that is, about 989 without it: the calculator’s starting value.

## In code

\`\`\`python
def training(n, d, gpus=256, peak_tflops=989, mfu=0.40, price_hour=2.0):
    flops = 6 * n * d
    seconds = flops / (gpus * peak_tflops * 1e12 * mfu)
    gpu_hours = gpus * seconds / 3600
    return flops, seconds / 86400, gpu_hours * price_hour

def optimum(c, E=1.8172, A=482.01, B=2085.43, alpha=0.3478, beta=0.3658):
    a, b = beta / (alpha + beta), alpha / (alpha + beta)
    g = (alpha * A / (beta * B)) ** (1 / (alpha + beta))
    n = g * (c / 6) ** a
    return n, c / (6 * n)

f, days, cost = training(175e9, 300e9)            # GPT-3, 256 GPUs
print(f"{f:.2e} FLOPs, {days:.0f} days, \${cost:,.0f}")
f, days, cost = training(175e9, 300e9, gpus=512)  # double the GPUs
print(f"{f:.2e} FLOPs, {days:.0f} days, \${cost:,.0f}")
n, d = optimum(5.76e23)                           # Gopher's budget
print(f"N = {n:.2e}, D = {d:.2e}, tokens per parameter = {d / n:.1f}")
# 3.15e+23 FLOPs, 36 days, $442,366
# 3.15e+23 FLOPs, 18 days, $442,366
# N = 7.22e+10, D = 1.33e+12, tokens per parameter = 18.4
\`\`\`

The 256 GPUs, the 989 teraFLOPS, the 40% MFU, and the 2 dollars per GPU-hour are **illustrative assumptions**, not market prices; the figure covers only the final run.

## What comes next

GPU memory (lesson 25) decides which model fits and how the work is split. Inference (lesson 26) has its own cost, which weighs more the more the model is used: Sardana et al. (2024) show that with heavy demand it pays to train smaller models on more tokens than the Chinchilla optimum. And fine-tuning (lesson 27) reuses a base model instead of repeating this arithmetic.`,
  },

  lens: {
    es: [
      'Entrenar desde cero está fuera de alcance para casi todas las organizaciones. Hasta la corrida final de Llama 3.1 405B usó hasta 16 384 GPU, sin contar datos, personal ni ensayos. Tu decisión real: qué modelo usar, si ajustarlo (lección 27) y cuánto cuesta servirlo (lección 26).',
      'Lee «más grande = mejor» con una pregunta: ¿con cuántos tokens y cuánto cómputo se entrenó? Con el mismo cómputo, Chinchilla (70 mil millones) superó a Gopher (280 mil millones). Pide resultados en tus tareas, no solo promedios de pruebas públicas.',
      'Los rendimientos decrecen: cada ×10 de cómputo cuesta diez veces más y baja la pérdida una proporción fija (≈ 11 %). Pregunta cuánto vale esa mejora en tu caso antes de pagar el siguiente ×10; y recuerda que predecir la pérdida no predice una habilidad concreta.',
      'Ante un presupuesto de entrenamiento, pide el desglose: FLOPs (6·N·D), horas de GPU, MFU supuesto y precio por hora. Duplicar las GPU acorta el calendario, no el costo, y los clústeres grandes pierden eficiencia (Llama 3: 466 interrupciones en 54 días).',
    ],
    en: [
      'Training from scratch is out of reach for almost every organization. Even Llama 3.1 405B’s final run used up to 16,384 GPUs, not counting data, staff, or experiments. Your real decision: which model to use, whether to adjust it (lesson 27), and what it costs to serve (lesson 26).',
      'Read “bigger = better” with one question: how many tokens and how much compute was it trained with? With the same compute, Chinchilla (70 billion) beat Gopher (280 billion). Ask for results on your tasks, not just public-benchmark averages.',
      'Returns diminish: each ×10 of compute costs ten times more and lowers the loss by a fixed proportion (≈ 11%). Ask what that improvement is worth in your case before paying for the next ×10; and remember that predicting loss does not predict a specific ability.',
      'Faced with a training budget, ask for the breakdown: FLOPs (6·N·D), GPU-hours, assumed MFU, and hourly price. Doubling the GPUs shortens the calendar, not the cost, and large clusters lose efficiency (Llama 3: 466 interruptions in 54 days).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: {
        es: 'En la gráfica logarítmica de la lección, la pérdida frente al tamaño del modelo es una recta. ¿Qué significa en la práctica?',
        en: 'On the lesson’s logarithmic chart, loss versus model size is a straight line. What does that mean in practice?',
      },
      options: [
        { es: 'Cada parámetro adicional reduce la pérdida en la misma cantidad.', en: 'Each additional parameter reduces the loss by the same amount.' },
        { es: 'Con suficientes parámetros la pérdida llega a cero.', en: 'With enough parameters the loss reaches zero.' },
        { es: 'Cada vez que multiplicas los parámetros por el mismo factor, la pérdida baja en la misma proporción.', en: 'Every time you multiply the parameters by the same factor, the loss drops by the same proportion.' },
        { es: 'Los parámetros dejan de ayudar pasado un tamaño fijo.', en: 'Parameters stop helping past a fixed size.' },
      ],
      answer: 2,
      why: {
        es: 'Una recta en escala logarítmica es una ley de potencia: ×10 en parámetros multiplica la pérdida por ≈ 0.84 cada vez. Por eso cada mejora cuesta diez veces más que la anterior. Y no llega a cero: hay una pérdida irreducible.',
        en: 'A straight line on log axes is a power law: ×10 in parameters multiplies the loss by ≈ 0.84 every time. That is why each improvement costs ten times more than the last. And it never reaches zero: there is an irreducible loss.',
      },
    },
    {
      kind: 'concept',
      q: {
        es: 'Con un presupuesto de cómputo fijo, ¿qué concluyeron Hoffmann y colegas con Chinchilla?',
        en: 'With a fixed compute budget, what did Hoffmann and colleagues conclude with Chinchilla?',
      },
      options: [
        { es: 'Conviene el modelo más grande posible, aunque vea pocos datos.', en: 'The biggest possible model is best, even if it sees little data.' },
        { es: 'Parámetros y datos deben crecer a la par: unos veinte tokens por parámetro.', en: 'Parameters and data should grow together: about twenty tokens per parameter.' },
        { es: 'Los datos importan y el tamaño del modelo casi no.', en: 'Data matters and model size hardly does.' },
        { es: 'Conviene repetir los mismos datos muchas veces.', en: 'It pays to repeat the same data many times.' },
      ],
      answer: 1,
      why: {
        es: 'Midieron más de cuatrocientos modelos: por cada duplicación del modelo, conviene duplicar los tokens. Chinchilla (70 mil millones, 1.4 billones de tokens) superó a Gopher (280 mil millones, 300 mil millones de tokens) con el mismo cómputo.',
        en: 'They measured over four hundred models: for every doubling of the model, double the tokens. Chinchilla (70 billion, 1.4 trillion tokens) beat Gopher (280 billion, 300 billion tokens) with the same compute.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un modelo de 7 mil millones de parámetros se entrena con 140 mil millones de tokens. Con C ≈ 6·N·D, ¿cuántos FLOPs necesita?',
        en: 'A 7-billion-parameter model is trained on 140 billion tokens. With C ≈ 6·N·D, how many FLOPs does it need?',
      },
      options: [
        { es: '9.8 × 10²⁰', en: '9.8 × 10²⁰' },
        { es: '5.9 × 10²⁰', en: '5.9 × 10²⁰' },
        { es: '5.9 × 10²²', en: '5.9 × 10²²' },
        { es: '5.9 × 10²¹', en: '5.9 × 10²¹' },
      ],
      answer: 3,
      why: {
        es: '6 × 7×10⁹ × 1.4×10¹¹ = 5.88×10²¹. El 9.8×10²⁰ olvida el factor 6: el costo de ida (2N) y vuelta (4N) de cada token.',
        en: '6 × 7×10⁹ × 1.4×10¹¹ = 5.88×10²¹. The 9.8×10²⁰ forgets the factor 6: the cost of the forward (2N) and backward (4N) pass for every token.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un proveedor presume que su modelo es mejor «porque tiene 500 mil millones de parámetros». ¿Qué le pides primero?',
        en: 'A vendor boasts that its model is better “because it has 500 billion parameters.” What do you ask for first?',
      },
      options: [
        { es: 'Con cuántos tokens y cuánto cómputo se entrenó, y sus resultados en tus propias tareas.', en: 'How many tokens and how much compute it was trained with, and its results on your own tasks.' },
        { es: 'Que lo entrene con más GPU.', en: 'That it be trained with more GPUs.' },
        { es: 'El número de capas.', en: 'The number of layers.' },
        { es: 'Nada: más parámetros siempre es mejor.', en: 'Nothing: more parameters is always better.' },
      ],
      answer: 0,
      why: {
        es: 'El tamaño solo no dice nada sin los tokens, el cómputo y la evaluación en tu caso: con el mismo cómputo, Chinchilla (70 mil millones) superó a Gopher (280 mil millones).',
        en: 'Size alone says nothing without the tokens, the compute, and an evaluation on your case: with the same compute, Chinchilla (70 billion) beat Gopher (280 billion).',
      },
    },
  ],

  glossary: ['scaling-law', 'flops', 'chinchilla', 'compute-budget', 'parameter', 'loss', 'token', 'gpu', 'compute', 'pretraining', 'language-model'],

  terms: [
    { id: 'scaling-law', term: { es: 'Ley de escala', en: 'Scaling law' }, def: { es: 'Relación empírica y predecible, normalmente una ley de potencia, entre la pérdida de un modelo y su número de parámetros, sus datos o su cómputo de entrenamiento.', en: 'An empirical, predictable relationship, usually a power law, between a model’s loss and its number of parameters, its data, or its training compute.' } },
    { id: 'flops', term: { es: 'FLOPs', en: 'FLOPs' }, def: { es: 'Operaciones de coma flotante: sumas y multiplicaciones con decimales. El cómputo de entrenar un modelo se mide en FLOPs totales (≈ 6·N·D); la velocidad de un chip, en FLOP/s.', en: 'Floating-point operations: additions and multiplications with decimals. A model’s training compute is measured in total FLOPs (≈ 6·N·D); a chip’s speed, in FLOP/s.' } },
    { id: 'chinchilla', term: { es: 'Chinchilla', en: 'Chinchilla' }, def: { es: 'Modelo de DeepMind (70 mil millones de parámetros, 1.4 billones de tokens) y la regla que dejó: con un presupuesto fijo, parámetros y datos deben crecer a la par, unos 20 tokens por parámetro.', en: 'A DeepMind model (70 billion parameters, 1.4 trillion tokens) and the rule it left: with a fixed budget, parameters and data should grow together, about 20 tokens per parameter.' } },
    { id: 'compute-budget', term: { es: 'Presupuesto de cómputo', en: 'Compute budget' }, def: { es: 'Cantidad total de FLOPs que se decide gastar en entrenar un modelo. Como C ≈ 6·N·D, fija cuánto se puede repartir entre tamaño del modelo y cantidad de datos.', en: 'The total number of FLOPs you decide to spend on training a model. Since C ≈ 6·N·D, it fixes how much can be split between model size and amount of data.' } },
  ],

  sources: [
    { title: 'Scaling Laws for Neural Language Models', authors: 'Kaplan, J., McCandlish, S., Henighan, T., Brown, T. B., Chess, B., Child, R., Gray, S., Radford, A., Wu, J., Amodei, D.', year: 2020, url: 'https://arxiv.org/abs/2001.08361' },
    { title: 'Training Compute-Optimal Large Language Models', authors: 'Hoffmann, J., Borgeaud, S., Mensch, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2203.15556' },
    { title: 'Chinchilla Scaling: A replication attempt', authors: 'Besiroglu, T., Erdil, E., Barnett, M., You, J.', year: 2024, url: 'https://arxiv.org/abs/2404.10102' },
    { title: 'Resolving Discrepancies in Compute-Optimal Scaling of Language Models', authors: 'Porian, T., Wortsman, M., Jitsev, J., Schmidt, L., Carmon, Y.', year: 2024, url: 'https://arxiv.org/abs/2406.19146' },
    { title: 'Emergent Abilities of Large Language Models', authors: 'Wei, J., Tay, Y., Bommasani, R., et al.', year: 2022, url: 'https://arxiv.org/abs/2206.07682' },
    { title: 'Are Emergent Abilities of Large Language Models a Mirage?', authors: 'Schaeffer, R., Miranda, B., Koyejo, S.', year: 2023, url: 'https://arxiv.org/abs/2304.15004' },
    { title: 'Language Models are Few-Shot Learners (tabla D.1: cómputo de GPT-3)', authors: 'Brown, T. B., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'The Llama 3 Herd of Models', authors: 'Llama Team, AI @ Meta', year: 2024, url: 'https://arxiv.org/abs/2407.21783' },
    { title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models (tabla 2: horas de GPU)', authors: 'Touvron, H., et al.', year: 2023, url: 'https://arxiv.org/abs/2307.09288' },
    { title: 'PaLM: Scaling Language Modeling with Pathways (definición de MFU)', authors: 'Chowdhery, A., et al.', year: 2022, url: 'https://arxiv.org/abs/2204.02311' },
    { title: 'Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws', authors: 'Sardana, N., Portes, J., Doubov, S., Frankle, J.', year: 2024, url: 'https://arxiv.org/abs/2401.00448' },
  ],
});
