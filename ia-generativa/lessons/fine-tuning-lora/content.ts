import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'fine-tuning-lora',

  objectives: {
    es: [
      'Explicar qué es el ajuste fino, por qué mover todos los pesos con datos estrechos puede borrar habilidades previas y qué lo hace costoso.',
      'Calcular cuántos parámetros entrena LoRA frente a la matriz completa, dado el rango, y reconocer cuándo deja de ahorrar.',
      'Decidir con criterio entre prompt, RAG y ajuste fino para un caso, y saber qué evidencia exigir antes de ajustar.',
    ],
    en: [
      'Explain what fine-tuning is, why moving every weight on narrow data can erase earlier skills, and what makes it expensive.',
      'Calculate how many parameters LoRA trains compared with the full matrix, given the rank, and recognize when it stops saving.',
      'Decide with judgment among prompt, RAG, and fine-tuning for a case, and know what evidence to demand before tuning.',
    ],
  },

  segments: [
    // ── 1 · El problema: un modelo base no conoce tu caso ─────────────────────
    {
      id: 'hook',
      es: 'Un modelo base ya leyó casi todo internet, pero no sabe nada de tu empresa, de tu tono ni de tus formatos. ¿Cómo se adapta sin entrenarlo desde cero otra vez?',
      en: 'A base model has read most of the internet, yet it knows nothing about your company, your tone, or your formats. How do you adapt it without training it from scratch again?',
    },
    {
      id: 'ft-def',
      es: 'El ajuste fino (fine-tuning) sigue entrenando ese modelo, pero con ejemplos tuyos: una entrada y la respuesta que quieres. Es el mismo bucle de siempre; solo cambian los datos.',
      en: 'Fine-tuning keeps training that model, but on your own examples: an input and the answer you want. It is the same loop as always; only the data changes.',
      note: { es: 'Ajuste fino: seguir entrenando con tus ejemplos.', en: 'Fine-tuning: keep training on your own examples.' },
    },
    {
      id: 'scale-diff',
      es: 'Y los datos son pocos. GPT-3 se preentrenó con trescientos mil millones de tokens; LIMA ajustó un modelo de sesenta y cinco mil millones con solo mil ejemplos muy bien escogidos.',
      en: 'And the data is small. GPT-3 was pretrained on three hundred billion tokens; LIMA tuned a sixty-five-billion-parameter model with just one thousand carefully curated examples.',
      tts: {
        es: 'Y los datos son pocos. Ge pe te tres se preentrenó con trescientos mil millones de tokens; lima ajustó un modelo de sesenta y cinco mil millones con solo mil ejemplos muy bien escogidos.',
        en: 'And the data is small. G P T three was pretrained on three hundred billion tokens; Lima tuned a sixty-five-billion-parameter model with just one thousand carefully curated examples.',
      },
    },

    // ── 2 · Un modelo diminuto real: ajuste completo y olvido ─────────────────
    {
      id: 'toy-intro',
      es: 'Para verlo funcionar de verdad usaremos un modelo diminuto, preentrenado de antemano. Recibe un punto del plano y responde una de tres clases. Tiene mil doscientos cincuenta y un parámetros.',
      en: 'To watch it work for real we will use a tiny model, pretrained beforehand. It takes a point on the plane and answers one of three classes. It has one thousand two hundred fifty-one parameters.',
    },
    {
      id: 'company-rule',
      es: 'Tu empresa define dos fronteras de otro modo, rayadas aquí, y aporta pocos ejemplos de una franja estrecha. El modelo base ignora la regla nueva: solo conoce la original.',
      en: 'Your company draws two borders differently, hatched here, and brings a few examples from one narrow strip. The base model ignores the new rule: it only knows the original.',
      pad: 0.3,
    },
    {
      id: 'full-ft',
      es: 'Primero, el ajuste completo: los mil doscientos cincuenta y un parámetros se entrenan con esos ejemplos, con el mismo descenso del gradiente y la misma retropropagación de antes.',
      en: 'First, full fine-tuning: all one thousand two hundred fifty-one parameters train on those examples, with the same gradient descent and backpropagation as before.',
      pad: 0.6,
    },
    {
      id: 'full-result',
      es: 'Funciona: en las zonas donde la regla cambió, el modelo ahora acierta casi siempre. Pero mira qué pasó con lo que ya sabía.',
      en: 'It works: where the rule changed, the model now gets it right almost every time. But look at what happened to what it already knew.',
      pad: 0.3,
    },
    {
      id: 'forget-name',
      es: 'Los puntos oscuros son aciertos perdidos, casi todos en zonas sin ejemplos: los mismos pesos sirven a todo el plano. Es el olvido catastrófico, descrito en mil novecientos ochenta y nueve.',
      en: 'The dark dots are lost answers, almost all in zones with no examples: the same weights serve the whole plane. This is catastrophic forgetting, described back in nineteen eighty-nine.',
      note: { es: 'Olvido catastrófico: aprender lo nuevo pisa lo viejo.', en: 'Catastrophic forgetting: learning the new overwrites the old.' },
      pad: 0.3,
    },
    {
      id: 'cost-copies',
      es: 'Hay un segundo costo: cada cliente o tarea exige su propia copia completa del modelo. En GPT-3, trescientos cincuenta gigabytes cada una.',
      en: 'There is a second cost: every customer or task needs its own full copy of the model. For GPT-3, that is three hundred fifty gigabytes each.',
      tts: {
        es: 'Hay un segundo costo: cada cliente o tarea exige su propia copia completa del modelo. En ge pe te tres, trescientos cincuenta gigabytes cada una.',
        en: 'There is a second cost: every customer or task needs its own full copy of the model. For G P T three, that is three hundred fifty gigabytes each.',
      },
    },

    // ── 3 · La idea de LoRA: bajo rango ───────────────────────────────────────
    {
      id: 'insight',
      es: 'Mira el cambio real que dejó el ajuste completo en la capa central: mil veinticuatro números. Descompuesto en direcciones, casi todo cabe en cuatro; el resto pesa muy poco.',
      en: 'Look at the real change full fine-tuning left in the middle layer: one thousand twenty-four numbers. Broken into directions, almost all of it fits in four; the rest weighs very little.',
      note: { es: 'El cambio de un ajuste fino tiene bajo rango.', en: 'The change from fine-tuning has low rank.' },
      pad: 0.4,
    },
    {
      id: 'lowrank-claim',
      es: 'En modelos grandes pasa algo parecido: un estudio de dos mil veinte mostró que ajustar un modelo de lenguaje necesita muy pocas dimensiones efectivas. LoRA aprovecha esa idea.',
      en: 'Large models behave similarly: a twenty twenty study showed that fine-tuning a language model needs very few effective dimensions. LoRA builds on that idea.',
    },
    {
      id: 'freeze',
      es: 'LoRA congela la matriz original y aprende solo la corrección, escrita como el producto de dos matrices delgadas, B y A. La matriz final es la original más B por A.',
      en: 'LoRA freezes the original matrix and learns only the correction, written as the product of two thin matrices, B and A. The final matrix is the original plus B times A.',
      tts: {
        en: 'LoRA freezes the original matrix and learns only the correction, written as the product of two thin matrices, B and ay. The final matrix is the original plus B times ay.',
      },
      note: { es: 'LoRA: W = W₀ + B·A, con W₀ congelada.', en: 'LoRA: W = W₀ + B·A, with W₀ frozen.' },
      pad: 0.3,
    },
    {
      id: 'outer',
      es: '¿Qué es el rango? Una matriz de rango uno es una columna multiplicada por una fila: seis números fabrican nueve. Cada celda es el producto de dos de ellos.',
      en: 'What is rank? A rank-one matrix is a column times a row: six numbers make nine. Each cell is the product of two of them.',
      pad: 0.4,
    },
    {
      id: 'rank-sum',
      es: 'El rango r cuenta cuántas de esas piezas se suman. Con dos ya se dibujan patrones que una sola no puede. B tiene r columnas, y A tiene r filas.',
      en: 'The rank r counts how many of those pieces are added. With two you can draw patterns that one alone cannot. B has r columns, and A has r rows.',
      tts: {
        en: 'The rank r counts how many of those pieces are added. With two you can draw patterns that one alone cannot. B has r columns, and ay has r rows.',
      },
      pad: 0.4,
    },
    {
      id: 'count',
      es: 'La matriz completa guarda filas por columnas números. La corrección guarda solo el rango por filas más columnas: aquí, ciento veintiocho en vez de mil veinticuatro, ocho veces menos.',
      en: 'The full matrix stores rows times columns numbers. The correction stores only the rank times rows plus columns: here, one hundred twenty-eight instead of one thousand twenty-four, eight times fewer.',
      note: { es: 'Parámetros: r·(filas + columnas), no filas·columnas.', en: 'Parameters: r·(rows + columns), not rows·columns.' },
      pad: 0.4,
    },
    {
      id: 'try-rank',
      es: 'Tu turno: sube el rango y observa cuánto espacio ocupan B y A frente a la matriz completa. ¿En qué rango dejan de ahorrar?',
      en: 'Your turn: raise the rank and watch how much room B and A take compared with the full matrix. At what rank do they stop saving?',
      tts: {
        en: 'Your turn: raise the rank and watch how much room B and ay take compared with the full matrix. At what rank do they stop saving?',
      },
      gate: {
        id: 'rank',
        prompt: { es: 'Sube el rango hasta que B y A ocupen tanto como la matriz completa.', en: 'Raise the rank until B and A take as much room as the full matrix.' },
      },
      pad: 0.4,
    },
    {
      id: 'gpt3-scale',
      es: 'Una matriz de atención de GPT-3 mide doce mil doscientos ochenta y ocho por lado. Con rango ocho, la corrección tiene unos ciento noventa y siete mil números, no ciento cincuenta y un millones.',
      en: 'A GPT-3 attention matrix is twelve thousand two hundred eighty-eight on each side. With rank eight, the correction has about one hundred ninety-seven thousand numbers, not one hundred fifty-one million.',
      tts: {
        es: 'Una matriz de atención de ge pe te tres mide doce mil doscientos ochenta y ocho por lado. Con rango ocho, la corrección tiene unos ciento noventa y siete mil números, no ciento cincuenta y un millones.',
        en: 'A G P T three attention matrix is twelve thousand two hundred eighty-eight on each side. With rank eight, the correction has about one hundred ninety-seven thousand numbers, not one hundred fifty-one million.',
      },
      pad: 0.4,
    },
    {
      id: 'init-zero',
      es: 'Al empezar, B vale cero, así que la corrección es cero y el modelo arranca idéntico al original. Entrenar solo mueve B y A; la matriz original no se toca.',
      en: 'At the start, B is zero, so the correction is zero and the model begins identical to the original. Training only moves B and A; the original matrix is never touched.',
      tts: {
        en: 'At the start, B is zero, so the correction is zero and the model begins identical to the original. Training only moves B and ay; the original matrix is never touched.',
      },
      pad: 0.4,
    },
    {
      id: 'paper',
      es: 'En GPT-3, el artículo de LoRA redujo los parámetros entrenables unas diez mil veces y la memoria de la GPU unas tres, con calidad igual o mejor que el ajuste completo en sus pruebas.',
      en: 'On GPT-3, the LoRA paper cut trainable parameters about ten thousand times and GPU memory about three times, with quality on par with or better than full fine-tuning in its tests.',
      tts: {
        es: 'En ge pe te tres, el artículo de lora redujo los parámetros entrenables unas diez mil veces y la memoria de la ge pe u unas tres, con calidad igual o mejor que el ajuste completo en sus pruebas.',
        en: 'On G P T three, the low-rah paper cut trainable parameters about ten thousand times and G P U memory about three times, with quality on par with or better than full fine-tuning in its tests.',
      },
      pad: 0.3,
    },

    // ── 4 · LoRA en el modelo diminuto ────────────────────────────────────────
    {
      id: 'demo-lora',
      es: 'Probémoslo en el modelo diminuto: LoRA con rango dos sobre la capa central. Se entrenan ciento veintiocho números, no mil doscientos cincuenta y uno, y la corrección empieza en blanco.',
      en: 'Let’s try it on the tiny model: LoRA with rank two on the middle layer. It trains one hundred twenty-eight numbers, not one thousand two hundred fifty-one, and the correction starts blank.',
      pad: 0.6,
    },
    {
      id: 'rank-demo',
      es: 'Aquí hay dos cambios independientes: con rango uno aprende una parte; con rango dos, casi todo; con rango ocho, apenas mejora. El rango que necesitas depende de la tarea.',
      en: 'Here there are two independent changes: with rank one it learns part of them; with rank two, nearly all; with rank eight, it barely improves. The rank you need depends on the task.',
      note: { es: 'El rango necesario depende de la tarea; más rango rinde cada vez menos.', en: 'The rank you need depends on the task; more rank pays off less and less.' },
      pad: 0.4,
    },
    {
      id: 'try-train',
      es: 'Tu turno: entrena tu adaptador. Logra al menos ochenta y cinco por ciento en la regla nueva sin bajar de noventa y seis en la original. Prueba rangos y la mezcla de ejemplos originales.',
      en: 'Your turn: train your adapter. Reach at least eighty-five percent on the new rule without dropping below ninety-six on the original. Try ranks and mixing in original examples.',
      gate: {
        id: 'train',
        prompt: { es: 'Logra ≥ 85 % en la regla nueva y ≥ 96 % en la original.', en: 'Reach ≥ 85 % on the new rule and ≥ 96 % on the original.' },
      },
      pad: 0.4,
    },
    {
      id: 'replay',
      es: 'La receta es de sentido común: mezclar unos pocos ejemplos originales con los nuevos, para que los pesos sigan viendo lo viejo. Las zonas oscuras casi desaparecen y lo nuevo se conserva.',
      en: 'The remedy is plain common sense: mix a few original examples in with the new ones, so the weights keep seeing the old. The dark zones nearly vanish and the new skill stays.',
      note: { es: 'Remedio: mezclar ejemplos originales con los nuevos.', en: 'Remedy: mix original examples in with the new ones.' },
      pad: 0.4,
    },
    {
      id: 'swap',
      es: 'Y como la matriz original nunca cambió, quitar el adaptador devuelve el modelo base, exacto. Un modelo base y muchos adaptadores pequeños, uno por cliente.',
      en: 'And since the original matrix never changed, removing the adapter returns the base model, exactly. One base model and many small adapters, one per customer.',
      pad: 0.5,
    },

    // ── 5 · Memoria y QLoRA ───────────────────────────────────────────────────
    {
      id: 'memory',
      es: 'El otro cuello de botella es la memoria. Con LoRA no hay que guardar gradientes ni estados de Adam para los pesos congelados: en GPT-3, de uno coma dos terabytes a trescientos cincuenta gigabytes.',
      en: 'The other bottleneck is memory. With LoRA there is no need to store gradients or Adam states for the frozen weights: on GPT-3, from one point two terabytes down to three hundred fifty gigabytes.',
      tts: {
        es: 'El otro cuello de botella es la memoria. Con lora no hay que guardar gradientes ni estados de Adam para los pesos congelados: en ge pe te tres, de uno coma dos terabytes a trescientos cincuenta gigabytes.',
        en: 'The other bottleneck is memory. With low-rah there is no need to store gradients or Adam states for the frozen weights: on G P T three, from one point two terabytes down to three hundred fifty gigabytes.',
      },
      pad: 0.4,
    },
    {
      id: 'qlora',
      es: 'QLoRA va más lejos: guarda la base congelada en cuatro bits y entrena el adaptador en mayor precisión. Sus autores ajustaron así un modelo de sesenta y cinco mil millones en una GPU de cuarenta y ocho gigabytes.',
      en: 'QLoRA goes further: it stores the frozen base in four bits and trains the adapter in higher precision. Its authors tuned a sixty-five-billion-parameter model that way on a single forty-eight-gigabyte GPU.',
      tts: {
        es: 'Cu lora va más lejos: guarda la base congelada en cuatro bits y entrena el adaptador en mayor precisión. Sus autores ajustaron así un modelo de sesenta y cinco mil millones en una ge pe u de cuarenta y ocho gigabytes.',
        en: 'Cue low-rah goes further: it stores the frozen base in four bits and trains the adapter in higher precision. Its authors tuned a sixty-five-billion-parameter model that way on a single forty-eight-gigabyte G P U.',
      },
      pad: 0.5,
    },

    // ── 6 · Cuándo sí y cuándo no ─────────────────────────────────────────────
    {
      id: 'ladder',
      es: 'Lo difícil no es cómo ajustar, sino cuándo. Regla práctica: empieza por lo barato. Primero el prompt; si falta información, RAG, que pone documentos en el prompt; el ajuste fino, al final.',
      en: 'The hard part is not how to fine-tune but when. Rule of thumb: start cheap. Prompt first; if information is missing, RAG, which puts documents into the prompt; fine-tuning last.',
      pad: 0.4,
    },
    {
      id: 'fit-for',
      es: 'El ajuste fino cambia comportamiento: tono, formato, vocabulario o una tarea estrecha repetida a gran escala. Puede acortar el prompt, porque lo que antes pedías largo queda en los pesos.',
      en: 'Fine-tuning changes behavior: tone, format, vocabulary, or a narrow task repeated at scale. It can shorten the prompt, because what you used to spell out at length now lives in the weights.',
      pad: 0.3,
    },
    {
      id: 'not-facts',
      es: 'No sirve para meter hechos nuevos. En una comparación controlada, RAG superó al ajuste fino con texto crudo para incorporar conocimiento, y aprender hechos nuevos así puede aumentar las alucinaciones.',
      en: 'It is a poor way to add new facts. In a controlled comparison, RAG beat fine-tuning on raw text at injecting knowledge, and learning new facts this way can increase hallucinations.',
      note: { es: 'Hechos nuevos: RAG; comportamiento: ajuste fino.', en: 'New facts: RAG; behavior: fine-tuning.' },
      pad: 0.4,
    },
    {
      id: 'try-decide',
      es: 'Tu turno: cuatro casos típicos. Para cada uno, elige si basta con un prompt, si conviene RAG o si vale la pena ajustar el modelo.',
      en: 'Your turn: four typical cases. For each one, choose whether a prompt is enough, RAG fits, or fine-tuning is worth it.',
      gate: {
        id: 'decide',
        prompt: { es: 'Resuelve los cuatro casos.', en: 'Solve the four cases.' },
      },
      pad: 0.4,
    },
    {
      id: 'evidence-first',
      es: 'Antes de ajustar, ordena tres cosas: pocos ejemplos pero buenos, una evaluación propia y una línea base con prompt o RAG. Sin evaluación, ajustar cambia el modelo sin demostrar que mejoró.',
      en: 'Before tuning, line up three things: a few good examples, your own evaluation, and a baseline with a prompt or RAG. Without evaluation, tuning changes the model without proving it improved.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: ajustar es seguir entrenando; LoRA entrena solo una corrección de bajo rango, cuesta una fracción y se puede quitar; y se usa para cambiar comportamiento, no para meter hechos frescos.',
      en: 'In short: tuning is more training; LoRA trains only a low-rank correction, costs a fraction, and can be removed; and it is for changing behavior, not for stuffing in fresh facts.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Ajustar con ejemplos ya cambia el comportamiento. Pero ¿qué ejemplos y qué señal convierten un modelo que solo completa texto en un asistente que sigue instrucciones, ayuda y sabe negarse?',
      en: 'Tuning on examples already changes behavior. But which examples, and which signal, turn a model that only completes text into an assistant that follows instructions, helps, and knows when to decline?',
    },
  ],

  keyIdeas: {
    es: [
      'El ajuste fino sigue entrenando un modelo preentrenado con ejemplos propios: el mismo descenso del gradiente, con pocos datos y pasos pequeños.',
      'Mover todos los pesos con datos estrechos puede borrar habilidades previas (olvido catastrófico). Mezclar ejemplos originales y evaluar lo anterior es la defensa básica.',
      'LoRA congela los pesos originales y entrena una corrección ΔW = B·A de bajo rango: r·(filas + columnas) números en vez de filas·columnas. En GPT-3, unas diez mil veces menos parámetros entrenables.',
      'Como la base no se toca, el adaptador se puede quitar o cambiar: un modelo base y muchos adaptadores de megabytes. QLoRA añade una base en cuatro bits para ajustar modelos enormes en una sola GPU.',
      'El ajuste fino cambia comportamiento y estilo; para conocimiento que cambia, empieza por RAG. Como regla práctica, se prueba primero el prompt y RAG, y el ajuste fino queda para lo que siga fallando, con evaluación propia en cada paso.',
    ],
    en: [
      'Fine-tuning keeps training a pretrained model on your own examples: the same gradient descent, with little data and small steps.',
      'Moving every weight on narrow data can erase earlier skills (catastrophic forgetting). Mixing in original examples and testing what came before is the basic defense.',
      'LoRA freezes the original weights and trains a low-rank correction ΔW = B·A: r·(rows + columns) numbers instead of rows·columns. On GPT-3, about ten thousand times fewer trainable parameters.',
      'Because the base is untouched, the adapter can be removed or swapped: one base model and many megabyte-sized adapters. QLoRA adds a four-bit base to tune huge models on a single GPU.',
      'Fine-tuning changes behavior and style; for knowledge that changes, start with RAG. As a rule of thumb, try the prompt and RAG first and leave fine-tuning for what keeps failing, with your own evaluation at every step.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Para que el modelo conozca los documentos de mi empresa, hay que ajustarlo (fine-tuning) con ellos.',
      en: 'For the model to know my company’s documents, I have to fine-tune it on them.',
    },
    right: {
      es: 'El ajuste fino cambia cómo se comporta el modelo (tono, formato, tarea), pero es un mal modo de incorporar hechos: los difumina en los pesos y puede aumentar las alucinaciones. Para conocimiento propio que cambia, empieza por RAG; LoRA lo abarata, pero no cambia esto.',
      en: 'Fine-tuning changes how the model behaves (tone, format, task), but it is a poor way to add facts: it blurs them into the weights and can increase hallucinations. For your own knowledge that changes, start with RAG; LoRA makes tuning cheaper, but it does not change this.',
    },
  },

  deeper: {
    es: `## Qué se minimiza en el ajuste fino supervisado

Dado un modelo con pesos $\\theta$ y ejemplos $(x_i, y_i)$ (una entrada y la respuesta deseada), el ajuste fino supervisado sigue minimizando la entropía cruzada,

$$L(\\theta) = -\\frac{1}{N}\\sum_{i=1}^{N} \\log p_\\theta(y_i \\mid x_i)$$

con el mismo descenso del gradiente de la lección 4 y los gradientes de la retropropagación de la lección 8. En un modelo de lenguaje, $y_i$ es una secuencia de tokens y la suma corre sobre los tokens de la respuesta. Se parte de los pesos preentrenados $\\theta_0$ (lección 23), con tasas de aprendizaje mucho menores que en el preentrenamiento y pocas pasadas por los datos.

## LoRA: la matemática

Para una matriz de pesos preentrenada $W_0\\in\\mathbb{R}^{d\\times k}$, LoRA la congela y escribe la actualización como

$$W = W_0 + \\frac{\\alpha}{r}\\,BA,\\qquad B\\in\\mathbb{R}^{d\\times r},\\; A\\in\\mathbb{R}^{r\\times k},\\; r\\ll\\min(d,k)$$

El pase hacia delante es $h = W_0x + \\tfrac{\\alpha}{r}B(Ax)$. $A$ se inicia con una gaussiana y $B$ con ceros, así que $\\Delta W = 0$ al empezar (Hu et al., 2021); solo $A$ y $B$ reciben gradiente. Como $\\partial L/\\partial A$ es proporcional a $B$, en el primer paso solo se mueve $B$.

Parámetros entrenables: $r\\,(d+k)$ en vez de $dk$. Solo ahorra si $r < \\dfrac{dk}{d+k}$; en una matriz cuadrada, $r<d/2$. Con $d=k=32$ (el modelo de la lección), $r=16$ empata: $16\\cdot 64 = 1\\,024$.

Una vez entrenado se puede fusionar, $W = W_0 + \\tfrac{\\alpha}{r}BA$, y la inferencia cuesta lo mismo que la del modelo original; o dejar el adaptador aparte para cambiarlo por otro.

Con GPT-3 175B ($d_{\\text{model}}=12\\,288$, 96 capas), adaptar solo $W_q$ y $W_v$ con $r=4$ da $96\\cdot 2\\cdot 4\\cdot(12\\,288+12\\,288)=18\\,874\\,368$ parámetros entrenables: unas 9 300 veces menos que 175 mil millones (el artículo dice «unas 10 000 veces»; en FP16 son unas decenas de MB frente a 350 GB).

## Por qué el cambio es de bajo rango

Si $M=\\sum_i \\sigma_i u_i v_i^\\top$ es la descomposición en valores singulares, el teorema de Eckart y Young dice que la mejor matriz de rango $r$ (en norma de Frobenius) es la suma de los $r$ primeros términos, y su error es $\\sum_{i>r}\\sigma_i^2$. En la lección, el cambio que deja el ajuste completo en la capa de 32×32 tiene valores singulares que caen rápido: los cuatro primeros reúnen alrededor de 97 % de $\\sum\\sigma_i^2$. Eso es lo que LoRA supone y aprovecha. No es una ley: Hu et al. no esperan que un rango pequeño sirva para cualquier tarea (por ejemplo, un idioma distinto del preentrenamiento), y en nuestro modelo, con dos cambios independientes, el rango uno no alcanza. En modelos grandes, Biderman et al. (2024) midieron que, en programación y matemáticas, el ajuste completo aprende cambios de un rango 10 a 100 veces mayor que las configuraciones típicas de LoRA, lo que puede explicar parte de su peor rendimiento allí.

## Olvido, repaso y qué dice la evidencia

Con datos estrechos, mover pesos compartidos desplaza lo que esos datos no cubren. Mezclar ejemplos del comportamiento original («repaso») es la defensa básica. En modelos grandes, Biderman et al. (2024) hallaron que, en programación y matemáticas, LoRA aprende menos que el ajuste completo pero olvida menos fuera del dominio. En el modelo diminuto de esta lección (70 ejemplos nuevos, 300 pasos, una sola corrida con semillas fijas) el ajuste completo llega a 98 % en la regla nueva y baja de 100 a 93 % en la original: poco, pero es el mismo mecanismo que da nombre al olvido «catastrófico». LoRA de rango 2 sin repaso llega a 91 % y 87 %: aquí olvida más que el ajuste completo. Con 30 ejemplos originales de repaso llega a 93 % y 98 %. Moraleja: el olvido es un riesgo en ambos métodos, y se mide con datos que el ajuste no vio.

## Memoria: de dieciséis bytes por parámetro a menos

Entrenar con Adam en precisión mixta guarda por parámetro: pesos FP16 (2 bytes), gradientes FP16 (2) y, en FP32, copia de los pesos, momento y varianza ($4+4+4$): $2+2+12=16$ bytes (Rajbhandari et al., 2019). Con LoRA, los pesos congelados solo necesitan su copia (2 bytes en FP16) y los 16 bytes se pagan solo por $A$ y $B$. QLoRA guarda además la base en 4 bits (formato NF4, con «doble cuantización» de las constantes) y entrena el adaptador en 16 bits. Cuenta propia para un modelo de 7 mil millones, sin activaciones: ajuste completo $7\\cdot 16=112$ GB; base en FP16, 14 GB; base en 4 bits, unos 3,5 GB, más adaptador y activaciones.

Las cifras de los artículos no salen de esta cuenta, porque dependen de qué se guarde y cómo se reparta: el de LoRA da, para GPT-3 175B, de 1,2 TB a 350 GB (con 16 bytes por parámetro serían unos 2,8 TB; el texto no detalla su configuración), y el de QLoRA cuenta más de 780 GB para ajustar 65 mil millones en 16 bits (unos 12 bytes por parámetro). Compara siempre bajo la misma cuenta.

En el modelo diminuto se puede medir la parte «Q»: con las tres matrices en 4 bits (NF4, bloques de 64), el mapa de decisión cambia en 22 de 1 600 celdas y LoRA de rango 2 con repaso llega a 91 % en la regla nueva y 98 % en la original, frente a 93 % y 98 % con la base en 16 bits. Es un juguete: no demuestra nada sobre modelos grandes, solo reproduce la idea.

## En código

\`\`\`python
import numpy as np

# 1) la cuenta: una matriz de GPT-3 (12288 x 12288) y rango 8
d = k = 12288
r = 8
completa = d * k
lora = r * (d + k)
print(completa, lora, completa // lora)    # 150994944 196608 768

# 2) la corrección arranca en cero (B = 0): el modelo no cambia
rng = np.random.default_rng(0)
W0 = rng.normal(size=(6, 6))               # matriz congelada (diminuta)
A = rng.normal(size=(2, 6))                # r = 2, gaussiana
B = np.zeros((6, 2))                       # ceros
x = rng.normal(size=6)
h = W0 @ x + B @ (A @ x)                   # alfa/r = 1
print(np.allclose(h, W0 @ x))              # True

# 3) tras entrenar, B deja de ser cero: la corrección tiene rango <= 2
B = rng.normal(size=(6, 2)) * 0.1
print(np.linalg.matrix_rank(B @ A))        # 2
\`\`\`

## Lo que viene

Ajustar con pares de entrada y salida cambia formato, estilo y tarea. Convertir un modelo que solo completa texto en un asistente usa ese mismo mecanismo, pero la pregunta es qué pares y qué señal: el ajuste con instrucciones y el aprendizaje por refuerzo con retroalimentación humana (lección 28). Y es práctico: con QLoRA se ajustó con instrucciones la familia Guanaco (Dettmers et al., 2023), y esos autores hallaron que la calidad de los datos pesa mucho más que su cantidad (9 mil ejemplos de OASST1 superaron a 450 mil de FLAN v2).`,

    en: `## What supervised fine-tuning minimizes

Given a model with weights $\\theta$ and examples $(x_i, y_i)$ (an input and the desired answer), supervised fine-tuning keeps minimizing the cross-entropy,

$$L(\\theta) = -\\frac{1}{N}\\sum_{i=1}^{N} \\log p_\\theta(y_i \\mid x_i)$$

with the same gradient descent from lesson 4 and the backpropagation gradients from lesson 8. In a language model, $y_i$ is a sequence of tokens and the sum runs over the answer tokens. It starts from the pretrained weights $\\theta_0$ (lesson 23), with much smaller learning rates than in pretraining and only a few passes over the data.

## LoRA: the math

For a pretrained weight matrix $W_0\\in\\mathbb{R}^{d\\times k}$, LoRA freezes it and writes the update as

$$W = W_0 + \\frac{\\alpha}{r}\\,BA,\\qquad B\\in\\mathbb{R}^{d\\times r},\\; A\\in\\mathbb{R}^{r\\times k},\\; r\\ll\\min(d,k)$$

The forward pass is $h = W_0x + \\tfrac{\\alpha}{r}B(Ax)$. $A$ starts as a Gaussian and $B$ as zeros, so $\\Delta W = 0$ at the start (Hu et al., 2021); only $A$ and $B$ receive gradients. Since $\\partial L/\\partial A$ is proportional to $B$, only $B$ moves on the first step.

Trainable parameters: $r\\,(d+k)$ instead of $dk$. It saves only if $r < \\dfrac{dk}{d+k}$; for a square matrix, $r<d/2$. With $d=k=32$ (the lesson’s model), $r=16$ is a tie: $16\\cdot 64 = 1{,}024$.

Once trained it can be merged, $W = W_0 + \\tfrac{\\alpha}{r}BA$, and inference costs the same as the original model; or the adapter can stay separate to swap it for another.

For GPT-3 175B ($d_{\\text{model}}=12{,}288$, 96 layers), adapting only $W_q$ and $W_v$ with $r=4$ gives $96\\cdot 2\\cdot 4\\cdot(12{,}288+12{,}288)=18{,}874{,}368$ trainable parameters: about 9,300 times fewer than 175 billion (the paper says “roughly 10,000×”; in FP16 that is a few tens of MB versus 350 GB).

## Why the change has low rank

If $M=\\sum_i \\sigma_i u_i v_i^\\top$ is the singular value decomposition, the Eckart–Young theorem says the best rank-$r$ matrix (in Frobenius norm) is the sum of the first $r$ terms, and its error is $\\sum_{i>r}\\sigma_i^2$. In the lesson, the change that full fine-tuning leaves in the 32×32 layer has singular values that fall quickly: the first four gather about 97% of $\\sum\\sigma_i^2$. That is what LoRA assumes and exploits. It is not a law: Hu et al. do not expect a small rank to work for every task (for example, a language different from the pretraining one), and in our model, with two independent changes, rank one is not enough. In large models, Biderman et al. (2024) measured that, in programming and math, full fine-tuning learns changes whose rank is 10 to 100 times higher than typical LoRA configurations, which may explain part of LoRA’s weaker performance there.

## Forgetting, replay, and what the evidence says

With narrow data, moving shared weights shifts whatever that data does not cover. Mixing in examples of the original behavior (“replay”) is the basic defense. In large models, Biderman et al. (2024) found that, in programming and math, LoRA learns less than full fine-tuning but forgets less outside the domain. In this lesson’s tiny model (70 new examples, 300 steps, a single run with fixed seeds) full fine-tuning reaches 98% on the new rule and drops from 100 to 93% on the original: a little, but it is the same mechanism that gives “catastrophic” forgetting its name. Rank-2 LoRA without replay reaches 91% and 87%: here it forgets more than full fine-tuning. With 30 original examples of replay it reaches 93% and 98%. Moral: forgetting is a risk with both methods, and you measure it with data the tuning did not see.

## Memory: from sixteen bytes per parameter to less

Training with Adam in mixed precision stores, per parameter: FP16 weights (2 bytes), FP16 gradients (2) and, in FP32, a copy of the weights, momentum, and variance ($4+4+4$): $2+2+12=16$ bytes (Rajbhandari et al., 2019). With LoRA, frozen weights only need their copy (2 bytes in FP16) and the 16 bytes are paid only for $A$ and $B$. QLoRA also stores the base in 4 bits (NF4 format, with “double quantization” of the constants) and trains the adapter in 16 bits. Our own count for a 7-billion-parameter model, without activations: full fine-tuning $7\\cdot 16=112$ GB; FP16 base, 14 GB; 4-bit base, about 3.5 GB, plus the adapter and activations.

The papers’ figures do not come out of this count, because they depend on what is stored and how it is split: the LoRA paper gives, for GPT-3 175B, from 1.2 TB to 350 GB (at 16 bytes per parameter it would be about 2.8 TB; the text does not detail its setup), and the QLoRA paper counts more than 780 GB to fine-tune 65 billion parameters in 16 bits (about 12 bytes per parameter). Always compare under the same count.

The “Q” part can be measured in the tiny model: with all three matrices in 4 bits (NF4, blocks of 64), the decision map changes in 22 of 1,600 cells and rank-2 LoRA with replay reaches 91% on the new rule and 98% on the original, versus 93% and 98% with the 16-bit base. It is a toy: it proves nothing about large models, it only reproduces the idea.

## In code

\`\`\`python
import numpy as np

# 1) the count: one GPT-3 matrix (12288 x 12288) and rank 8
d = k = 12288
r = 8
full = d * k
lora = r * (d + k)
print(full, lora, full // lora)            # 150994944 196608 768

# 2) the correction starts at zero (B = 0): the model does not change
rng = np.random.default_rng(0)
W0 = rng.normal(size=(6, 6))               # frozen matrix (tiny)
A = rng.normal(size=(2, 6))                # r = 2, Gaussian
B = np.zeros((6, 2))                       # zeros
x = rng.normal(size=6)
h = W0 @ x + B @ (A @ x)                   # alpha/r = 1
print(np.allclose(h, W0 @ x))              # True

# 3) after training, B is no longer zero: the correction has rank <= 2
B = rng.normal(size=(6, 2)) * 0.1
print(np.linalg.matrix_rank(B @ A))        # 2
\`\`\`

## What comes next

Tuning on input-output pairs changes format, style, and task. Turning a model that only completes text into an assistant uses that same mechanism, but the question is which pairs and which signal: instruction tuning and reinforcement learning from human feedback (lesson 28). And it is practical: QLoRA was used to instruction-tune the Guanaco family (Dettmers et al., 2023), and those authors found that data quality matters far more than quantity (9 thousand OASST1 examples beat 450 thousand from FLAN v2).`,
  },

  lens: {
    es: [
      'Exige la línea base antes del ajuste: ¿qué logra un buen prompt? ¿y RAG? Si el equipo no muestra esos números sobre casos tuyos, ajustar es una apuesta a ciegas.',
      'El ajuste fino cambia comportamiento y estilo, no es un buen modo de «meter conocimiento fresco». Para precios, políticas o catálogos que cambian, RAG se actualiza sin reentrenar y permite citar la fuente.',
      'Pregunta por los datos y la evaluación primero: cuántos ejemplos, quién los revisó, con qué conjunto de prueba se mide la mejora y cómo se comprueba lo que el modelo pudo olvidar.',
      'LoRA abarata entrenar y guardar (adaptadores de megabytes, no copias de cientos de gigabytes), pero cada adaptador debe seguir al modelo base que lo recibió: pide quién lo mantiene, y trata los datos de ajuste como sensibles.',
    ],
    en: [
      'Demand the baseline before tuning: what does a good prompt achieve? And RAG? If the team cannot show those numbers on your own cases, tuning is a blind bet.',
      'Fine-tuning changes behavior and style; it is not a good way to “stuff in fresh knowledge.” For prices, policies, or catalogs that change, RAG updates without retraining and lets you cite the source.',
      'Ask about data and evaluation first: how many examples, who reviewed them, which test set measures the improvement, and how you check what the model may have forgotten.',
      'LoRA makes training and storage cheap (megabyte adapters, not hundred-gigabyte copies), but each adapter must follow the base model that received it: ask who maintains it, and treat tuning data as sensitive.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué entrena LoRA?', en: 'What does LoRA train?' },
      options: [
        { es: 'Todos los pesos del modelo, pero con menos datos.', en: 'All the model’s weights, but with less data.' },
        { es: 'Solo un par de matrices delgadas que se suman a algunas matrices de pesos; las originales quedan congeladas.', en: 'Only a pair of thin matrices added to some weight matrices; the original ones stay frozen.' },
        { es: 'Solo la última capa del modelo.', en: 'Only the model’s last layer.' },
        { es: 'El prompt, no los pesos.', en: 'The prompt, not the weights.' },
      ],
      answer: 1,
      why: {
        es: 'LoRA escribe la corrección como el producto de dos matrices de bajo rango, B y A, y solo esas reciben gradiente. Por eso se entrenan miles de veces menos parámetros y el adaptador se puede quitar.',
        en: 'LoRA writes the correction as the product of two low-rank matrices, B and A, and only those receive gradients. That is why thousands of times fewer parameters train and the adapter can be removed.',
      },
    },
    {
      kind: 'concept',
      q: {
        es: 'Ajustas un modelo solo con ejemplos de tu área: mejora ahí, pero empeora en tareas que antes hacía bien. ¿Qué pasó y qué ayuda?',
        en: 'You fine-tune a model only on examples from your area: it improves there but gets worse at tasks it used to do well. What happened, and what helps?',
      },
      options: [
        { es: 'Alucinación; bajar la temperatura.', en: 'Hallucination; lowering the temperature.' },
        { es: 'Fuga de datos; separar mejor los conjuntos.', en: 'Data leakage; splitting the sets better.' },
        { es: 'Subajuste; entrenar más épocas con los mismos ejemplos.', en: 'Underfitting; training more epochs on the same examples.' },
        { es: 'Olvido catastrófico; mezclar ejemplos originales con los nuevos y evaluar también lo anterior.', en: 'Catastrophic forgetting; mixing original examples in with the new ones and also testing what came before.' },
      ],
      answer: 3,
      why: {
        es: 'Los mismos pesos sirven a todas las tareas; moverlos con datos estrechos desplaza lo que esos datos no cubren. Mezclar ejemplos originales y medir lo anterior es la defensa básica. Más épocas con los mismos datos no lo arregla y suele empeorarlo.',
        en: 'The same weights serve every task; moving them with narrow data shifts what that data does not cover. Mixing in original examples and measuring what came before is the basic defense. More epochs on the same data does not fix it and tends to make it worse.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Una matriz de 4096 por 4096 se adapta con LoRA de rango 8. ¿Cuántos números tienen B y A en total?',
        en: 'A 4096 by 4096 matrix is adapted with rank-8 LoRA. How many numbers do B and A have in total?',
      },
      options: [
        { es: '65 536', en: '65,536' },
        { es: '32 768', en: '32,768' },
        { es: '131 072', en: '131,072' },
        { es: '16 777 216', en: '16,777,216' },
      ],
      answer: 0,
      why: {
        es: 'B es de 4096×8 y A es de 8×4096: r·(d+k) = 8 · (4096 + 4096) = 65 536. La matriz completa tendría 4096 · 4096 = 16 777 216, es decir, 256 veces más.',
        en: 'B is 4096×8 and A is 8×4096: r·(d+k) = 8 · (4096 + 4096) = 65,536. The full matrix would have 4096 · 4096 = 16,777,216, which is 256 times more.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un equipo propone ajustar el modelo con el manual de políticas de la empresa para que «se lo aprenda». El manual cambia cada trimestre y las respuestas deben citar el párrafo. ¿Qué respondes?',
        en: 'A team proposes fine-tuning the model on the company policy manual so it “learns it.” The manual changes every quarter and answers must cite the paragraph. What do you answer?',
      },
      options: [
        { es: 'Sí, el ajuste fino es la forma más rápida de que el modelo sepa los datos.', en: 'Yes, fine-tuning is the fastest way for the model to know the data.' },
        { es: 'Ajustar con LoRA de rango muy alto, para que no olvide nada.', en: 'Fine-tune with a very high LoRA rank, so it forgets nothing.' },
        { es: 'Primero RAG con el manual: se actualiza sin reentrenar y permite citar el párrafo; el ajuste fino sería para tono o formato.', en: 'RAG with the manual first: it updates without retraining and can cite the paragraph; fine-tuning would be for tone or format.' },
        { es: 'Entrenar un modelo nuevo desde cero con el manual.', en: 'Train a new model from scratch on the manual.' },
      ],
      answer: 2,
      why: {
        es: 'Es conocimiento que cambia y que debe citarse: ese es el terreno de RAG. Los hechos ajustados en los pesos se difuminan, no se actualizan sin reentrenar y no dan cita. El ajuste fino queda para comportamiento: tono, formato o una tarea estrecha.',
        en: 'It is knowledge that changes and must be cited: that is RAG territory. Facts tuned into the weights blur, do not update without retraining, and give no citation. Fine-tuning is left for behavior: tone, format, or a narrow task.',
      },
    },
  ],

  glossary: ['fine-tuning', 'lora', 'low-rank', 'catastrophic-forgetting', 'parameter', 'weight', 'gradient-descent', 'backpropagation', 'adam', 'pretraining', 'base-model', 'quantization', 'rag', 'validation-set'],

  terms: [
    {
      id: 'fine-tuning',
      term: { es: 'Ajuste fino', en: 'Fine-tuning' },
      def: {
        es: 'Seguir entrenando un modelo ya preentrenado con un conjunto pequeño de ejemplos propios (entrada y respuesta deseada) para cambiar su comportamiento, sin empezar de cero.',
        en: 'Continuing to train an already pretrained model on a small set of your own examples (input and desired answer) to change its behavior, without starting from scratch.',
      },
    },
    {
      id: 'lora',
      term: { es: 'LoRA (adaptación de bajo rango)', en: 'LoRA (low-rank adaptation)' },
      def: {
        es: 'Técnica de ajuste fino que congela los pesos originales y entrena solo una corrección ΔW = B·A, producto de dos matrices delgadas, con miles de veces menos parámetros entrenables.',
        en: 'A fine-tuning technique that freezes the original weights and trains only a correction ΔW = B·A, the product of two thin matrices, with thousands of times fewer trainable parameters.',
      },
    },
    {
      id: 'low-rank',
      term: { es: 'Bajo rango', en: 'Low rank' },
      def: {
        es: 'Propiedad de una matriz que se escribe como suma de pocas piezas «columna × fila». El rango dice cuántas piezas hacen falta; una matriz de rango bajo se describe con muchos menos números que filas por columnas.',
        en: 'A property of a matrix that can be written as a sum of a few “column × row” pieces. The rank says how many pieces are needed; a low-rank matrix is described with far fewer numbers than rows times columns.',
      },
    },
    {
      id: 'catastrophic-forgetting',
      term: { es: 'Olvido catastrófico', en: 'Catastrophic forgetting' },
      def: {
        es: 'Pérdida de habilidades previas cuando un modelo sigue entrenándose con datos de un solo tipo: los mismos pesos sirven a todo, y moverlos para lo nuevo desplaza lo viejo.',
        en: 'Loss of earlier skills when a model keeps training on data of a single kind: the same weights serve everything, and moving them for the new shifts the old.',
      },
    },
  ],

  sources: [
    { title: 'LoRA: Low-Rank Adaptation of Large Language Models', authors: 'Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., Chen, W.', year: 2021, url: 'https://arxiv.org/abs/2106.09685' },
    { title: 'QLoRA: Efficient Finetuning of Quantized LLMs', authors: 'Dettmers, T., Pagnoni, A., Holtzman, A., Zettlemoyer, L.', year: 2023, url: 'https://arxiv.org/abs/2305.14314' },
    { title: 'Intrinsic Dimensionality Explains the Effectiveness of Language Model Fine-Tuning', authors: 'Aghajanyan, A., Zettlemoyer, L., Gupta, S.', year: 2020, url: 'https://arxiv.org/abs/2012.13255' },
    { title: 'LoRA Learns Less and Forgets Less', authors: 'Biderman, D., Portes, J., Gonzalez Ortiz, J. J., Paul, M., Greengard, P., Jennings, C., King, D., Havens, S., Chiley, V., Frankle, J., Blakeney, C., Cunningham, J. P.', year: 2024, url: 'https://arxiv.org/abs/2405.09673' },
    { title: 'Catastrophic Interference in Connectionist Networks: The Sequential Learning Problem (Psychology of Learning and Motivation 24, 109–165)', authors: 'McCloskey, M., Cohen, N. J.', year: 1989, url: 'https://doi.org/10.1016/S0079-7421(08)60536-8' },
    { title: 'Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs', authors: 'Ovadia, O., Brief, M., Mishaeli, M., Elisha, O.', year: 2023, url: 'https://arxiv.org/abs/2312.05934' },
    { title: 'Does Fine-Tuning LLMs on New Knowledge Encourage Hallucinations?', authors: 'Gekhman, Z., Yona, G., Aharoni, R., Eyal, M., Feder, A., Reichart, R., Herzig, J.', year: 2024, url: 'https://arxiv.org/abs/2405.05904' },
    { title: 'LIMA: Less Is More for Alignment', authors: 'Zhou, C., Liu, P., Xu, P., Iyer, S., Sun, J., Mao, Y., Ma, X., Efrat, A., Yu, P., Yu, L., Zhang, S., Ghosh, G., Lewis, M., Zettlemoyer, L., Levy, O.', year: 2023, url: 'https://arxiv.org/abs/2305.11206' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', authors: 'Rajbhandari, S., Rasley, J., Ruwase, O., He, Y.', year: 2019, url: 'https://arxiv.org/abs/1910.02054' },
    { title: 'The approximation of one matrix by another of lower rank (Psychometrika 1, 211–218)', authors: 'Eckart, C., Young, G.', year: 1936, url: 'https://doi.org/10.1007/BF02288367' },
  ],
});
