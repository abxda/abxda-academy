import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'fine-tuning-lora',

  objectives: {
    es: [
      'Explicar qué es el ajuste fino y por qué mover todos los parámetros con ejemplos de una sola zona puede hacer que el modelo olvide lo que ya sabía.',
      'Calcular cuántos números entrena LoRA con la regla rango × (filas + columnas) y compararlos con los de la tabla completa.',
      'Decidir entre prompt, RAG y ajuste fino para un caso, y saber qué datos y qué evaluación exigir antes de ajustar.',
    ],
    en: [
      'Explain what fine-tuning is and why moving every parameter with examples from a single area can make the model forget what it already knew.',
      'Calculate how many numbers LoRA trains with the rule rank × (rows + columns) and compare them with those of the full table.',
      'Decide among prompt, RAG, and fine-tuning for a case, and know what data and what evaluation to demand before tuning.',
    ],
  },

  segments: [
    // ── 1 · Qué es ajustar ─────────────────────────────────────────────────────
    {
      id: 'hook',
      es: 'La parte dos terminó con un modelo base: sabe continuar textos, pero no conoce tu caso. No sabe tu tono, ni tus formatos, ni tus categorías.',
      en: 'Part two ended with a base model: it can continue text, but it does not know your case. Not your tone, not your formats, not your categories.',
    },
    {
      id: 'ft-def',
      es: '¿Cómo se adapta sin entrenarlo desde cero? Se le sigue entrenando, pero con ejemplos tuyos. Eso es el ajuste fino, en inglés, fine-tuning.',
      en: 'How do you adapt it without training it from scratch? You keep training it, but on your own examples. That is fine-tuning.',
      note: { es: 'Ajuste fino: seguir entrenando un modelo ya entrenado, con tus ejemplos.', en: 'Fine-tuning: keep training an already trained model on your own examples.' },
    },
    {
      id: 'ft-pairs',
      es: 'Cada ejemplo es un par: una entrada y la respuesta que quieres. Por ejemplo, el mensaje de un cliente y la categoría que le toca.',
      en: 'Each example is a pair: an input and the answer you want. For instance, a customer’s message and the category it belongs to.',
      pad: 0.3,
    },
    {
      id: 'ft-loop',
      es: 'Y se entrena como en la lección ocho: el modelo responde, se mide su error, la retropropagación reparte la culpa y cada parámetro se ajusta un poco.',
      en: 'And it trains just like in lesson eight: the model answers, its error is measured, backpropagation shares out the blame, and each parameter moves a little.',
      pad: 0.4,
    },
    {
      id: 'ft-small',
      es: 'Y pide pocos datos. LIMA ajustó un modelo de sesenta y cinco mil millones de parámetros con solo mil ejemplos; su preentrenamiento había leído más de un billón de tokens.',
      en: 'And it needs little data. LIMA tuned a sixty-five-billion-parameter model with just one thousand examples; its pretraining had read more than a trillion tokens.',
      tts: {
        es: 'Y pide pocos datos. Lima ajustó un modelo de sesenta y cinco mil millones de parámetros con solo mil ejemplos; su preentrenamiento había leído más de un billón de tokens.',
        en: 'And it needs little data. Leema tuned a sixty-five-billion-parameter model with just one thousand examples; its pretraining had read more than a trillion tokens.',
      },
      pad: 0.3,
    },

    // ── 2 · Un modelo diminuto real: ajuste completo y olvido ─────────────────
    {
      id: 'toy-intro',
      es: 'Para verlo de verdad, usemos un modelo diminuto que se entrena aquí, en tu navegador. Ya viene entrenado: es nuestro modelo base, con mil doscientos cincuenta y un parámetros.',
      en: 'To see it for real, let’s use a tiny model that trains right here, in your browser. It comes already trained: it is our base model, with one thousand two hundred fifty-one parameters.',
      pad: 0.3,
    },
    {
      id: 'toy-map',
      es: 'Recibe un punto del cuadro y responde a qué zona pertenece. Hay tres: la de arriba, la de abajo a la izquierda y la de abajo a la derecha.',
      en: 'It takes a point in the square and answers which zone it belongs to. There are three: the top one, the bottom left, and the bottom right.',
      pad: 0.4,
    },
    {
      id: 'rule-new',
      es: 'Tu empresa necesita otras respuestas en la parte rayada: ahí la zona de arriba baja y la de la izquierda se estira. El modelo base acierta ahí cero por ciento.',
      en: 'Your company needs different answers in the hatched part: there the top zone reaches lower and the left zone stretches out. The base model gets zero percent right there.',
      pad: 0.4,
    },
    {
      id: 'rule-data',
      es: 'Para enseñárselo, trae setenta ejemplos, todos de esa parte del cuadro. Cada marca es un punto con la respuesta que tu empresa quiere.',
      en: 'To teach it, the company brings seventy examples, all from that part of the square. Each mark is a point with the answer the company wants.',
      pad: 0.4,
    },
    {
      id: 'meter-old',
      es: 'También mediremos el resto del cuadro, lo que ya sabía: ahí acierta cien por ciento. La meta es subir los aciertos en lo nuevo sin perder estos.',
      en: 'We will also measure the rest of the square, what it already knew: there it gets one hundred percent right. The goal is to raise accuracy on the new part without losing this.',
      pad: 0.3,
    },
    {
      id: 'full-ft',
      es: 'Primero, el ajuste completo: se mueven los mil doscientos cincuenta y un parámetros, con el descenso del gradiente de siempre. Mira la parte rayada.',
      en: 'First, full fine-tuning: all one thousand two hundred fifty-one parameters move, with the usual gradient descent. Watch the hatched part.',
      pad: 0.6,
    },
    {
      id: 'full-old',
      es: 'Lo nuevo se aprende: noventa y ocho por ciento. Pero fuera de lo rayado aparecen errores, y los aciertos en lo que ya sabía bajan de cien a noventa y tres.',
      en: 'The new part is learned: ninety-eight percent. But outside the hatching, errors appear, and accuracy on what it already knew drops from one hundred to ninety-three.',
      pad: 0.4,
    },
    {
      id: 'forget-where',
      es: 'Casi todos caen lejos de los ejemplos, donde nadie pidió cambios. Los mismos parámetros sirven a todo el cuadro: moverlos por lo nuevo desacomoda lo viejo.',
      en: 'Almost all of them land far from the examples, where nobody asked for changes. The same parameters serve the whole square: moving them for the new part disturbs the old.',
      pad: 0.4,
    },
    {
      id: 'forget-name',
      es: 'Se llama olvido catastrófico, y se describió en mil novecientos ochenta y nueve. En modelos grandes también ocurre: se midió al ajustar Llama 2 para programar.',
      en: 'It is called catastrophic forgetting, and it was described in nineteen eighty-nine. It happens in large models too: it was measured when tuning Llama 2 for programming.',
      tts: {
        es: 'Se llama olvido catastrófico, y se describió en mil novecientos ochenta y nueve. En modelos grandes también ocurre: se midió al ajustar Llama dos para programar.',
        en: 'It is called catastrophic forgetting, and it was described in nineteen eighty-nine. It happens in large models too: it was measured when tuning Llama two for programming.',
      },
      note: { es: 'Olvido catastrófico: aprender lo nuevo desacomoda lo que el modelo ya sabía.', en: 'Catastrophic forgetting: learning the new disturbs what the model already knew.' },
      pad: 0.3,
    },
    {
      id: 'replay',
      es: 'La defensa básica es el repaso: mezclar con los nuevos unos ejemplos de lo que ya sabía. Con treinta de repaso, queda en noventa y cuatro en lo nuevo y noventa y siete en lo que ya sabía.',
      en: 'The basic defense is replay: mixing in some examples of what it already knew with the new ones. With thirty for replay, it ends at ninety-four on the new part and ninety-seven on what it knew.',
      note: { es: 'Repaso: mezclar ejemplos de lo que ya sabía con los nuevos.', en: 'Replay: mix examples of what it already knew in with the new ones.' },
      pad: 0.6,
    },

    // ── 3 · Lo que cuesta mover todo en un modelo grande ─────────────────────
    {
      id: 'cost-big',
      es: 'En un modelo grande, mover todo cuesta. Recuerda la lección veinticinco: ajustar con Adam uno de setenta mil millones pide unos mil ciento veinte gigabytes, catorce H100.',
      en: 'In a large model, moving everything is costly. Recall lesson twenty-five: tuning a seventy-billion-parameter model with Adam takes about one thousand one hundred twenty gigabytes, fourteen H100s.',
      tts: {
        es: 'En un modelo grande, mover todo cuesta. Recuerda la lección veinticinco: ajustar con Adam uno de setenta mil millones pide unos mil ciento veinte gigabytes, catorce ache cien.',
        en: 'In a large model, moving everything is costly. Recall lesson twenty-five: tuning a seventy-billion-parameter model with Adam takes about one thousand one hundred twenty gigabytes, fourteen H one hundreds.',
      },
      pad: 0.4,
    },
    {
      id: 'cost-copies',
      es: 'Y cada cliente o tarea necesita su propia copia completa del modelo ajustado. En GPT-3, cada copia ocupa trescientos cincuenta gigabytes.',
      en: 'And each customer or task needs its own full copy of the tuned model. For GPT-3, each copy takes three hundred fifty gigabytes.',
      tts: {
        es: 'Y cada cliente o tarea necesita su propia copia completa del modelo ajustado. En ge pe te tres, cada copia ocupa trescientos cincuenta gigabytes.',
        en: 'And each customer or task needs its own full copy of the tuned model. For G P T three, each copy takes three hundred fifty gigabytes.',
      },
      pad: 0.4,
    },

    // ── 4 · La idea de LoRA: una corrección de bajo rango ─────────────────────
    {
      id: 'lora-idea',
      es: 'En dos mil veintiuno apareció LoRA, que hace otra cosa: congela los parámetros originales y aprende aparte una corrección, que se les suma.',
      en: 'In twenty twenty-one came LoRA, which does something else: it freezes the original parameters and learns a separate correction that is added to them.',
      note: { es: 'LoRA: congelar lo original y aprender aparte una corrección que se suma.', en: 'LoRA: freeze the original and learn a separate correction that is added on.' },
      pad: 0.4,
    },
    {
      id: 'lora-table',
      es: 'Recuerda la lección dos: una tabla de números es una matriz. Los parámetros de una capa forman una, y la corrección es otra igual de grande, sumada casilla por casilla.',
      en: 'Recall lesson two: a table of numbers is a matrix. A layer’s parameters form one, and the correction is another just as big, added cell by cell.',
      pad: 0.4,
    },
    {
      id: 'lora-big',
      es: 'Si cada casilla de la corrección fuera libre, habría que entrenar tantos números como antes. El truco de LoRA es fabricarla con muy pocos.',
      en: 'If every cell of the correction were free, you would have to train as many numbers as before. LoRA’s trick is to build it from very few.',
      pad: 0.3,
    },
    {
      id: 'mult-table',
      es: 'Piensa en una tabla de multiplicar de seis por seis. Sus treinta y seis casillas salen de solo doce números: los seis de la columna y los seis de la fila.',
      en: 'Think of a six-by-six multiplication table. Its thirty-six cells come from just twelve numbers: the six in the column and the six in the row.',
      pad: 0.5,
    },
    {
      id: 'rank1',
      es: 'Con otra columna y otra fila sale otra tabla, siempre de doce números. A una tabla hecha así, columna por fila, se le llama de rango uno.',
      en: 'With another column and another row you get another table, always from twelve numbers. A table made this way, column times row, is called rank one.',
      pad: 0.5,
    },
    {
      id: 'rank2',
      es: 'Una sola pieza es rígida. Sumando dos, sale una tabla más variada: rango dos. El rango es cuántas piezas se suman; pocas piezas, bajo rango.',
      en: 'A single piece is rigid. Adding two gives a more varied table: rank two. The rank is how many pieces are added; few pieces, low rank.',
      note: { es: 'Bajo rango: una tabla grande hecha con pocas piezas columna × fila.', en: 'Low rank: a big table built from a few column × row pieces.' },
      pad: 0.5,
    },
    {
      id: 'ba-name',
      es: 'LoRA junta esas columnas en una tabla delgada, B, y las filas en otra, A. La corrección es B por A, y se suma a la tabla congelada.',
      en: 'LoRA puts those columns together in a thin table, B, and the rows in another, A. The correction is B times A, and it is added to the frozen table.',
      tts: {
        en: 'LoRA puts those columns together in a thin table, B, and the rows in another, ay. The correction is B times ay, and it is added to the frozen table.',
      },
      pad: 0.5,
    },
    {
      id: 'count',
      es: 'La cuenta. La capa del centro del modelo diminuto mide treinta y dos por treinta y dos: mil veinticuatro casillas. Con rango dos, B y A suman ciento veintiocho números.',
      en: 'The count. The middle layer of the tiny model is thirty-two by thirty-two: one thousand twenty-four cells. With rank two, B and A add up to one hundred twenty-eight numbers.',
      tts: {
        en: 'The count. The middle layer of the tiny model is thirty-two by thirty-two: one thousand twenty-four cells. With rank two, B and ay add up to one hundred twenty-eight numbers.',
      },
      note: { es: 'LoRA entrena rango × (filas + columnas) números, no filas × columnas.', en: 'LoRA trains rank × (rows + columns) numbers, not rows × columns.' },
      pad: 0.4,
    },
    {
      id: 'rank-demo',
      es: 'Mira qué pasa al subir el rango: B y A se ensanchan. Con rango ocho son quinientos doce números; con dieciséis, mil veinticuatro, tantos como la tabla entera.',
      en: 'Watch what happens as the rank goes up: B and A get wider. With rank eight they hold five hundred twelve numbers; with sixteen, one thousand twenty-four, as many as the whole table.',
      tts: {
        en: 'Watch what happens as the rank goes up: B and ay get wider. With rank eight they hold five hundred twelve numbers; with sixteen, one thousand twenty-four, as many as the whole table.',
      },
      pad: 0.5,
    },
    {
      id: 'rank-try',
      es: 'Si quieres, mueve tú el rango y mira cuántos números guardan B y A frente a la tabla completa.',
      en: 'If you like, move the rank yourself and see how many numbers B and A hold compared with the full table.',
      tts: {
        en: 'If you like, move the rank yourself and see how many numbers B and ay hold compared with the full table.',
      },
      gate: {
        id: 'rank',
        prompt: { es: 'mueve el rango y mira cuántos números entrena LoRA.', en: 'move the rank and see how many numbers LoRA trains.' },
      },
      pad: 0.4,
    },
    {
      id: 'gpt3-table',
      es: 'En GPT-3, una de estas tablas mide doce mil doscientos ochenta y ocho por lado. Aun así, el artículo de LoRA vio que un rango de uno o dos bastaba.',
      en: 'In GPT-3, one of these tables is twelve thousand two hundred eighty-eight on each side. Even so, the LoRA paper found that a rank of one or two was enough.',
      tts: {
        es: 'En ge pe te tres, una de estas tablas mide doce mil doscientos ochenta y ocho por lado. Aun así, el artículo de lora vio que un rango de uno o dos bastaba.',
        en: 'In G P T three, one of these tables is twelve thousand two hundred eighty-eight on each side. Even so, the low-rah paper found that a rank of one or two was enough.',
      },
      pad: 0.4,
    },
    {
      id: 'paper',
      es: 'En todo GPT-3, LoRA entrenó unas diez mil veces menos parámetros que el ajuste completo y pidió tres veces menos memoria, con calidad igual o mejor en sus pruebas.',
      en: 'Across all of GPT-3, LoRA trained about ten thousand times fewer parameters than full fine-tuning and needed three times less memory, with equal or better quality in its tests.',
      tts: {
        es: 'En todo ge pe te tres, lora entrenó unas diez mil veces menos parámetros que el ajuste completo y pidió tres veces menos memoria, con calidad igual o mejor en sus pruebas.',
        en: 'Across all of G P T three, low-rah trained about ten thousand times fewer parameters than full fine-tuning and needed three times less memory, with equal or better quality in its tests.',
      },
      pad: 0.4,
    },

    // ── 5 · Empieza en cero y se puede quitar ─────────────────────────────────
    {
      id: 'b-zero',
      es: 'Un detalle: al empezar, B vale cero. La corrección es cero y el modelo arranca idéntico al original; el entrenamiento solo mueve B y A.',
      en: 'One detail: at the start, B is zero. The correction is zero and the model starts out identical to the original; training only moves B and A.',
      tts: {
        en: 'One detail: at the start, B is zero. The correction is zero and the model starts out identical to the original; training only moves B and ay.',
      },
      pad: 0.4,
    },
    {
      id: 'adapters',
      es: 'Como lo original nunca cambia, la corrección se puede quitar o cambiar por otra. Al par B y A se le llama adaptador: un modelo base y un adaptador por tarea.',
      en: 'Since the original never changes, the correction can be removed or swapped for another. The pair B and A is called an adapter: one base model and one adapter per task.',
      tts: {
        en: 'Since the original never changes, the correction can be removed or swapped for another. The pair B and ay is called an adapter: one base model and one adapter per task.',
      },
      note: { es: 'Adaptador: el par B y A; se pone, se quita o se cambia.', en: 'Adapter: the pair B and A; it can be added, removed, or swapped.' },
      pad: 0.5,
    },

    // ── 6 · LoRA en el modelo diminuto ────────────────────────────────────────
    {
      id: 'toy-lora',
      es: 'De vuelta al modelo diminuto, con LoRA de rango dos en su capa del centro: se entrenan ciento veintiocho números, y los mil doscientos cincuenta y uno originales quedan congelados.',
      en: 'Back to the tiny model, with rank-two LoRA on its middle layer: one hundred twenty-eight numbers train, and the original one thousand two hundred fifty-one stay frozen.',
      pad: 0.6,
    },
    {
      id: 'toy-lora-result',
      es: 'Con el mismo repaso, logra noventa y tres por ciento en lo nuevo y noventa y ocho en lo que ya sabía. Ojo: sin repaso, LoRA también olvida.',
      en: 'With the same replay, it reaches ninety-three percent on the new part and ninety-eight on what it already knew. Careful: without replay, LoRA forgets too.',
      pad: 0.4,
    },

    // ── 7 · QLoRA ─────────────────────────────────────────────────────────────
    {
      id: 'qlora',
      es: 'En dos mil veintitrés, QLoRA sumó la lección veinticinco: guarda el modelo base congelado en cuatro bits, y entrena el adaptador con más precisión.',
      en: 'In twenty twenty-three, QLoRA added lesson twenty-five: it stores the frozen base model in four bits and trains the adapter with more precision.',
      tts: {
        es: 'En dos mil veintitrés, cu lora sumó la lección veinticinco: guarda el modelo base congelado en cuatro bits, y entrena el adaptador con más precisión.',
        en: 'In twenty twenty-three, Q low-rah added lesson twenty-five: it stores the frozen base model in four bits and trains the adapter with more precision.',
      },
      pad: 0.4,
    },
    {
      id: 'qlora-result',
      es: 'Así, sus autores ajustaron un modelo de sesenta y cinco mil millones de parámetros en una sola GPU de cuarenta y ocho gigabytes, en vez de más de setecientos ochenta.',
      en: 'That way, its authors tuned a sixty-five-billion-parameter model on a single forty-eight-gigabyte GPU, instead of more than seven hundred eighty.',
      note: { es: 'QLoRA: base congelada en 4 bits + adaptador LoRA.', en: 'QLoRA: frozen base in 4 bits + a LoRA adapter.' },
      pad: 0.4,
    },

    // ── 8 · Cuándo sí y cuándo no ─────────────────────────────────────────────
    {
      id: 'tool-prompt',
      es: 'Ahora, lo más práctico: ¿cuándo conviene ajustar? Hay tres herramientas. La más barata es el prompt: pedirlo bien, con un par de ejemplos. El modelo no cambia.',
      en: 'Now, the most practical part: when is tuning worth it? There are three tools. The cheapest is the prompt: asking well, with a couple of examples. The model does not change.',
      pad: 0.3,
    },
    {
      id: 'tool-rag',
      es: 'La segunda es RAG: buscar, en cada pregunta, los documentos que hacen falta y ponerlos en el prompt. La verás en la lección treinta y uno.',
      en: 'The second is RAG: for each question, finding the documents it needs and putting them into the prompt. You will see it in lesson thirty-one.',
      pad: 0.3,
    },
    {
      id: 'tool-ft',
      es: 'La tercera, la más cara, es el ajuste fino: pide datos, entrenamiento y evaluación. Sirve para cambiar el comportamiento: un tono, un formato, una tarea que se repite mucho.',
      en: 'The third, the most expensive, is fine-tuning: it takes data, training, and evaluation. It is for changing behavior: a tone, a format, a task that repeats a lot.',
      note: { es: 'Ajuste fino: para comportamiento (tono, formato, tarea), no para hechos.', en: 'Fine-tuning: for behavior (tone, format, task), not for facts.' },
      pad: 0.3,
    },
    {
      id: 'not-facts',
      es: 'Para darle hechos nuevos, no es buena vía. En una comparación de dos mil veintitrés, RAG funcionó mejor que ajustar el modelo con esos mismos textos.',
      en: 'For giving it new facts, it is not a good route. In a twenty twenty-three comparison, RAG worked better than tuning the model on those same texts.',
      pad: 0.3,
    },
    {
      id: 'halluc',
      es: 'Y un estudio de dos mil veinticuatro vio que los hechos nuevos se aprenden despacio con el ajuste fino, y que, ya aprendidos, hacen que el modelo invente más.',
      en: 'And a twenty twenty-four study found that new facts are learned slowly through fine-tuning, and that, once learned, they make the model make things up more.',
      pad: 0.3,
    },
    {
      id: 'case-tone',
      es: 'Para decidir, tres preguntas en orden. Primera: ¿ya probaste un buen prompt? Para reescribir correos con el tono de la marca, aún no: empieza por ahí.',
      en: 'To decide, three questions in order. First: have you tried a good prompt yet? For rewriting emails in the brand’s tone, not yet: start there.',
      pad: 0.5,
    },
    {
      id: 'case-catalog',
      es: 'Segunda: ¿falta información que cambia? Para un catálogo con precios que cambian cada semana, sí: RAG, que la trae al prompt en cada pregunta.',
      en: 'Second: is information missing, information that changes? For a catalog whose prices change every week, yes: RAG, which brings it into the prompt for every question.',
      pad: 0.5,
    },
    {
      id: 'case-tickets',
      es: 'Tercera: ¿es una tarea estable, repetida muchísimo, con miles de ejemplos buenos? Clasificar dos millones de tickets al mes, si el prompt ya no alcanza: ajuste fino.',
      en: 'Third: is it a stable task, repeated a huge number of times, with thousands of good examples? Sorting two million tickets a month, when the prompt falls short: fine-tuning.',
      pad: 0.5,
    },
    {
      id: 'decide-try',
      es: 'Si quieres, elige otro caso y mira por qué camino pasa. Fíjate en el manual de políticas: cambia cada trimestre.',
      en: 'If you like, pick another case and see which path it takes. Look at the policy manual: it changes every quarter.',
      gate: {
        id: 'decide',
        prompt: { es: 'elige un caso y mira a qué herramienta lleva.', en: 'pick a case and see which tool it leads to.' },
      },
      pad: 0.5,
    },
    {
      id: 'data-first',
      es: 'Y si decides ajustar, cuida primero los datos. Los autores de QLoRA vieron que, para un chatbot, nueve mil ejemplos bien elegidos superaron a cuatrocientos cincuenta mil menos adecuados.',
      en: 'And if you decide to tune, take care of the data first. The QLoRA authors found that, for a chatbot, nine thousand well-chosen examples beat four hundred fifty thousand less suitable ones.',
      tts: {
        es: 'Y si decides ajustar, cuida primero los datos. Los autores de cu lora vieron que, para un chatbot, nueve mil ejemplos bien elegidos superaron a cuatrocientos cincuenta mil menos adecuados.',
        en: 'And if you decide to tune, take care of the data first. The Q low-rah authors found that, for a chatbot, nine thousand well-chosen examples beat four hundred fifty thousand less suitable ones.',
      },
      pad: 0.3,
    },
    {
      id: 'eval',
      es: 'Y mide antes y después, con casos tuyos que el modelo no vio: los aciertos en lo nuevo, y también los aciertos en lo que ya sabía, como en el modelo diminuto.',
      en: 'And measure before and after, with your own cases the model has not seen: accuracy on the new part, and also accuracy on what it already knew, as with the tiny model.',
      note: { es: 'Antes de ajustar: buenos datos y una evaluación propia, de lo nuevo y de lo que ya sabía.', en: 'Before tuning: good data and your own evaluation, of the new part and of what it already knew.' },
      pad: 0.4,
    },

    // ── 9 · Cierre ─────────────────────────────────────────────────────────────
    {
      id: 'recap',
      es: 'En resumen: ajustar es seguir entrenando con tus ejemplos; mover todo puede borrar lo viejo; LoRA entrena solo una corrección pequeña, B por A; y sirve para conducta, no para hechos.',
      en: 'In short: tuning is more training on your own examples; moving everything can erase the old; LoRA trains only a small correction, B times A; and it is for behavior, not facts.',
      tts: {
        en: 'In short: tuning is more training on your own examples; moving everything can erase the old; low-rah trains only a small correction, B times ay; and it is for behavior, not facts.',
      },
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Con pares de una instrucción y su respuesta ideal, el ajuste fino ya cambia cómo responde un modelo. Pero ¿qué ejemplos, y qué otra señal, lo vuelven un asistente útil?',
      en: 'With pairs of an instruction and its ideal answer, fine-tuning already changes how a model responds. But which examples, and what other signal, turn it into a useful assistant?',
    },
  ],

  keyIdeas: {
    es: [
      'El ajuste fino sigue entrenando un modelo ya entrenado con pares de entrada y respuesta deseada: es el mismo bucle de la lección 8 (responder, medir el error, retropropagar, ajustar), con muchos menos datos.',
      'Mover todos los parámetros con ejemplos de una sola zona desacomoda lo demás: es el olvido catastrófico. La defensa básica es el repaso (mezclar ejemplos de lo que ya sabía) y medir también lo que ya sabía.',
      'LoRA congela la tabla original y entrena una corrección ΔW = B·A de bajo rango: rango × (filas + columnas) números en vez de filas × columnas. En GPT-3, unas diez mil veces menos parámetros entrenables.',
      'B empieza en cero, así que el modelo arranca idéntico; como la base no cambia, el adaptador (B y A) se quita o se cambia: un modelo base y un adaptador por tarea. QLoRA guarda la base en 4 bits y así ajusta un modelo de 65 mil millones en una GPU de 48 GB.',
      'Primero un buen prompt; si falta información que cambia, RAG; el ajuste fino, para un comportamiento estable y repetido, con buenos datos y una evaluación propia. No es buena vía para meter hechos nuevos.',
    ],
    en: [
      'Fine-tuning keeps training an already trained model on pairs of input and desired answer: it is the same loop as in lesson 8 (answer, measure the error, backpropagate, adjust), with far less data.',
      'Moving every parameter with examples from a single area disturbs everything else: that is catastrophic forgetting. The basic defense is replay (mixing in examples of what it already knew) and also measuring what it already knew.',
      'LoRA freezes the original table and trains a low-rank correction ΔW = B·A: rank × (rows + columns) numbers instead of rows × columns. On GPT-3, about ten thousand times fewer trainable parameters.',
      'B starts at zero, so the model starts out identical; since the base never changes, the adapter (B and A) can be removed or swapped: one base model and one adapter per task. QLoRA stores the base in 4 bits and so tunes a 65-billion-parameter model on one 48 GB GPU.',
      'A good prompt first; if information that changes is missing, RAG; fine-tuning for a stable, repeated behavior, with good data and your own evaluation. It is not a good way to add new facts.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Para que el modelo conozca los documentos de mi empresa, hay que ajustarlo (fine-tuning) con ellos.',
      en: 'For the model to know my company’s documents, I have to fine-tune it on them.',
    },
    right: {
      es: 'El ajuste fino cambia cómo se comporta el modelo (tono, formato, tarea), pero es un mal modo de incorporar hechos: los aprende despacio, no los puede citar y, al aprenderlos, puede inventar más. Para conocimiento propio que cambia, empieza por RAG; LoRA abarata el ajuste, pero no cambia esto.',
      en: 'Fine-tuning changes how the model behaves (tone, format, task), but it is a poor way to add facts: it learns them slowly, cannot cite them, and, once it learns them, may make more things up. For your own knowledge that changes, start with RAG; LoRA makes tuning cheaper, but it does not change this.',
    },
  },

  deeper: {
    es: `## Qué se minimiza en el ajuste fino supervisado

Dado un modelo con pesos $\\theta$ y ejemplos $(x_i, y_i)$ (una entrada y la respuesta deseada), el ajuste fino supervisado sigue minimizando la entropía cruzada,

$$L(\\theta) = -\\frac{1}{N}\\sum_{i=1}^{N} \\log p_\\theta(y_i \\mid x_i)$$

con el mismo descenso del gradiente de la lección 4 y los gradientes de la retropropagación de la lección 8. En un modelo de lenguaje, $y_i$ es una secuencia de tokens y la suma corre solo sobre los tokens de la respuesta. Se parte de los pesos preentrenados $\\theta_0$ (lección 23), con tasas de aprendizaje mucho menores que en el preentrenamiento y pocas pasadas por los datos. LIMA (Zhou et al., 2023) usó 1 000 ejemplos, unos 750 000 tokens, sobre LLaMA de 65 mil millones de parámetros, preentrenado con 1.4 billones de tokens (Touvron et al., 2023).

## LoRA: la matemática

Para una matriz de pesos preentrenada $W_0\\in\\mathbb{R}^{d\\times k}$, LoRA la congela y escribe la actualización como

$$W = W_0 + \\frac{\\alpha}{r}\\,BA,\\qquad B\\in\\mathbb{R}^{d\\times r},\\; A\\in\\mathbb{R}^{r\\times k},\\; r\\ll\\min(d,k)$$

El pase hacia delante es $h = W_0x + \\tfrac{\\alpha}{r}B(Ax)$. $A$ se inicia con una gaussiana y $B$ con ceros, así que $\\Delta W = 0$ al empezar (Hu et al., 2021); solo $A$ y $B$ reciben gradiente. Como $\\partial L/\\partial A$ es proporcional a $B$, en el primer paso solo se mueve $B$.

Cada columna $b_j$ de $B$ y cada fila $a_j$ de $A$ forman una pieza de rango uno, $b_j a_j$ (columna por fila, como la tabla de multiplicar de la lección): $BA = \\sum_{j=1}^{r} b_j a_j$. De ahí el nombre: la corrección tiene rango a lo sumo $r$.

Parámetros entrenables: $r\\,(d+k)$ en vez de $dk$. Solo ahorra si $r < \\dfrac{dk}{d+k}$; en una matriz cuadrada, $r<d/2$. Con $d=k=32$ (la capa del centro del modelo diminuto), $r=16$ empata: $16\\cdot 64 = 1\\,024$.

Una vez entrenado se puede fusionar, $W = W_0 + \\tfrac{\\alpha}{r}BA$, y la inferencia cuesta lo mismo que la del modelo original; o dejar el adaptador aparte para cambiarlo por otro.

Con GPT-3 175B ($d_{\\text{model}}=12\\,288$, 96 capas), adaptar solo $W_q$ y $W_v$ con $r=4$ da $96\\cdot 2\\cdot 4\\cdot(12\\,288+12\\,288)=18\\,874\\,368$ parámetros entrenables: unas 9 300 veces menos que 175 mil millones (el artículo dice «unas 10 000 veces»). En FP16 el adaptador ocupa unos 35 MB frente a los 350 GB del modelo, y 100 adaptaciones ocupan unos 354 GB en vez de 35 TB (Hu et al., 2021).

## Por qué el cambio es de bajo rango

Si $M=\\sum_i \\sigma_i u_i v_i^\\top$ es la descomposición en valores singulares, el teorema de Eckart y Young dice que la mejor matriz de rango $r$ (en norma de Frobenius) es la suma de los $r$ primeros términos, y su error es $\\sum_{i>r}\\sigma_i^2$. En el modelo diminuto, el cambio que deja el ajuste completo en la capa de 32×32 tiene valores singulares que caen rápido: los cuatro primeros reúnen alrededor de 97 % de $\\sum\\sigma_i^2$. Eso es lo que LoRA supone y aprovecha; Aghajanyan et al. (2020) ya habían medido que ajustar un modelo de lenguaje necesita muy pocas dimensiones efectivas. No es una ley: Hu et al. no esperan que un rango pequeño sirva para cualquier tarea (por ejemplo, un idioma distinto del preentrenamiento), y Biderman et al. (2024) midieron que, en programación y matemáticas, el ajuste completo aprende cambios de un rango 10 a 100 veces mayor que las configuraciones típicas de LoRA.

## Olvido, repaso y qué dice la evidencia

Con datos estrechos, mover pesos compartidos desplaza lo que esos datos no cubren. En el modelo diminuto (70 ejemplos nuevos de una sola zona, 300 pasos de Adam con todo el lote, una corrida con semillas fijas):

| ajuste | se entrenan | aciertos en lo nuevo | aciertos en lo que ya sabía |
|---|---|---|---|
| ninguno (modelo base) | — | 0 % | 100 % |
| completo | 1 251 | 98 % | 93 % |
| completo + 30 de repaso | 1 251 | 94 % | 97 % |
| LoRA r = 2 | 128 | 91 % | 87 % |
| LoRA r = 2 + 30 de repaso | 128 | 93 % | 98 % |

Aquí LoRA sin repaso olvida más que el ajuste completo; en modelos grandes, Biderman et al. (2024) hallaron lo contrario en promedio (LoRA aprende menos y olvida menos), pero no que deje de olvidar. Moraleja: el olvido es un riesgo con ambos métodos, y se mide con datos que el ajuste no vio. El nombre «catastrófico» viene de McCloskey y Cohen (1989); en el juguete la pérdida es moderada.

## Memoria: de dieciséis bytes por parámetro a menos

Entrenar con Adam en precisión mixta guarda por parámetro: pesos FP16 (2 bytes), gradientes FP16 (2) y, en FP32, copia de los pesos, momento y varianza ($4+4+4$): $16$ bytes (Rajbhandari et al., 2019; lección 25). Con LoRA, los pesos congelados solo necesitan su copia (2 bytes en FP16) y los 16 bytes se pagan solo por $A$ y $B$. QLoRA guarda además la base en 4 bits (formato NF4, con «doble cuantización» de las constantes) y entrena el adaptador en 16 bits. Cuenta propia para un modelo de 7 mil millones, sin activaciones: ajuste completo $7\\cdot 16=112$ GB; base en FP16, 14 GB; base en 4 bits, unos 3.5 GB, más adaptador y activaciones.

Las cifras de los artículos no salen exactamente de esta cuenta, porque dependen de qué se guarde y cómo: el de LoRA da, para GPT-3 175B, de 1.2 TB a 350 GB, y el de QLoRA cuenta más de 780 GB para ajustar 65 mil millones en 16 bits (unos 12 bytes por parámetro). Compara siempre bajo la misma cuenta.

En el modelo diminuto se puede probar la parte «Q»: con sus tres matrices en 4 bits (NF4, bloques de 64), el mapa cambia en 22 de 1 600 celdas, y LoRA de rango 2 con repaso llega a 91 % en lo nuevo y 98 % en lo que ya sabía, frente a 93 % y 98 % con la base en 16 bits. Es un juguete: reproduce la idea, no demuestra nada sobre modelos grandes.

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

Ajustar con pares de entrada y salida cambia formato, estilo y tarea. Convertir un modelo que solo completa texto en un asistente usa ese mismo mecanismo, pero la pregunta es qué pares y qué señal: el ajuste con instrucciones y el aprendizaje por refuerzo con retroalimentación humana (lección 28). Y es práctico: con QLoRA se ajustó con instrucciones la familia Guanaco (Dettmers et al., 2023), y esos autores hallaron que la calidad de los datos pesa mucho más que su cantidad (9 mil ejemplos de OASST1 superaron a 450 mil de FLAN v2 en su prueba de chatbot).`,

    en: `## What supervised fine-tuning minimizes

Given a model with weights $\\theta$ and examples $(x_i, y_i)$ (an input and the desired answer), supervised fine-tuning keeps minimizing the cross-entropy,

$$L(\\theta) = -\\frac{1}{N}\\sum_{i=1}^{N} \\log p_\\theta(y_i \\mid x_i)$$

with the same gradient descent from lesson 4 and the backpropagation gradients from lesson 8. In a language model, $y_i$ is a sequence of tokens and the sum runs only over the answer tokens. It starts from the pretrained weights $\\theta_0$ (lesson 23), with much smaller learning rates than in pretraining and only a few passes over the data. LIMA (Zhou et al., 2023) used 1,000 examples, about 750,000 tokens, on the 65-billion-parameter LLaMA, which was pretrained on 1.4 trillion tokens (Touvron et al., 2023).

## LoRA: the math

For a pretrained weight matrix $W_0\\in\\mathbb{R}^{d\\times k}$, LoRA freezes it and writes the update as

$$W = W_0 + \\frac{\\alpha}{r}\\,BA,\\qquad B\\in\\mathbb{R}^{d\\times r},\\; A\\in\\mathbb{R}^{r\\times k},\\; r\\ll\\min(d,k)$$

The forward pass is $h = W_0x + \\tfrac{\\alpha}{r}B(Ax)$. $A$ starts as a Gaussian and $B$ as zeros, so $\\Delta W = 0$ at the start (Hu et al., 2021); only $A$ and $B$ receive gradients. Since $\\partial L/\\partial A$ is proportional to $B$, only $B$ moves on the first step.

Each column $b_j$ of $B$ and each row $a_j$ of $A$ form a rank-one piece, $b_j a_j$ (column times row, like the lesson’s multiplication table): $BA = \\sum_{j=1}^{r} b_j a_j$. Hence the name: the correction has rank at most $r$.

Trainable parameters: $r\\,(d+k)$ instead of $dk$. It saves only if $r < \\dfrac{dk}{d+k}$; for a square matrix, $r<d/2$. With $d=k=32$ (the tiny model’s middle layer), $r=16$ is a tie: $16\\cdot 64 = 1{,}024$.

Once trained it can be merged, $W = W_0 + \\tfrac{\\alpha}{r}BA$, and inference costs the same as the original model; or the adapter can stay separate to swap it for another.

For GPT-3 175B ($d_{\\text{model}}=12{,}288$, 96 layers), adapting only $W_q$ and $W_v$ with $r=4$ gives $96\\cdot 2\\cdot 4\\cdot(12{,}288+12{,}288)=18{,}874{,}368$ trainable parameters: about 9,300 times fewer than 175 billion (the paper says “roughly 10,000×”). In FP16 the adapter takes about 35 MB versus the model’s 350 GB, and 100 adaptations take about 354 GB instead of 35 TB (Hu et al., 2021).

## Why the change has low rank

If $M=\\sum_i \\sigma_i u_i v_i^\\top$ is the singular value decomposition, the Eckart–Young theorem says the best rank-$r$ matrix (in Frobenius norm) is the sum of the first $r$ terms, and its error is $\\sum_{i>r}\\sigma_i^2$. In the tiny model, the change that full fine-tuning leaves in the 32×32 layer has singular values that fall quickly: the first four gather about 97% of $\\sum\\sigma_i^2$. That is what LoRA assumes and exploits; Aghajanyan et al. (2020) had already measured that fine-tuning a language model needs very few effective dimensions. It is not a law: Hu et al. do not expect a small rank to work for every task (for example, a language different from the pretraining one), and Biderman et al. (2024) measured that, in programming and math, full fine-tuning learns changes whose rank is 10 to 100 times higher than typical LoRA configurations.

## Forgetting, replay, and what the evidence says

With narrow data, moving shared weights shifts whatever that data does not cover. In the tiny model (70 new examples from a single area, 300 full-batch Adam steps, one run with fixed seeds):

| tuning | trainable | accuracy on the new part | accuracy on what it knew |
|---|---|---|---|
| none (base model) | — | 0% | 100% |
| full | 1,251 | 98% | 93% |
| full + 30 for replay | 1,251 | 94% | 97% |
| LoRA r = 2 | 128 | 91% | 87% |
| LoRA r = 2 + 30 for replay | 128 | 93% | 98% |

Here LoRA without replay forgets more than full fine-tuning; in large models, Biderman et al. (2024) found the opposite on average (LoRA learns less and forgets less), but not that it stops forgetting. Moral: forgetting is a risk with both methods, and you measure it with data the tuning did not see. The name “catastrophic” comes from McCloskey and Cohen (1989); in the toy the loss is moderate.

## Memory: from sixteen bytes per parameter to less

Training with Adam in mixed precision stores, per parameter: FP16 weights (2 bytes), FP16 gradients (2) and, in FP32, a copy of the weights, momentum, and variance ($4+4+4$): $16$ bytes (Rajbhandari et al., 2019; lesson 25). With LoRA, frozen weights only need their copy (2 bytes in FP16) and the 16 bytes are paid only for $A$ and $B$. QLoRA also stores the base in 4 bits (NF4 format, with “double quantization” of the constants) and trains the adapter in 16 bits. Our own count for a 7-billion-parameter model, without activations: full fine-tuning $7\\cdot 16=112$ GB; FP16 base, 14 GB; 4-bit base, about 3.5 GB, plus the adapter and activations.

The papers’ figures do not come exactly out of this count, because they depend on what is stored and how: the LoRA paper gives, for GPT-3 175B, from 1.2 TB to 350 GB, and the QLoRA paper counts more than 780 GB to fine-tune 65 billion parameters in 16 bits (about 12 bytes per parameter). Always compare under the same count.

The “Q” part can be tried in the tiny model: with its three matrices in 4 bits (NF4, blocks of 64), the map changes in 22 of 1,600 cells, and rank-2 LoRA with replay reaches 91% on the new part and 98% on what it knew, versus 93% and 98% with the 16-bit base. It is a toy: it reproduces the idea, it proves nothing about large models.

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

Tuning on input-output pairs changes format, style, and task. Turning a model that only completes text into an assistant uses that same mechanism, but the question is which pairs and which signal: instruction tuning and reinforcement learning from human feedback (lesson 28). And it is practical: QLoRA was used to instruction-tune the Guanaco family (Dettmers et al., 2023), and those authors found that data quality matters far more than quantity (9 thousand OASST1 examples beat 450 thousand from FLAN v2 in their chatbot test).`,
  },

  lens: {
    es: [
      'Exige la línea base antes del ajuste: ¿qué logra un buen prompt? ¿y RAG? Si el equipo no muestra esos números sobre casos tuyos, ajustar es una apuesta a ciegas.',
      'El ajuste fino cambia comportamiento y estilo; no es un buen modo de «meter conocimiento fresco». Para precios, políticas o catálogos que cambian, RAG se actualiza sin reentrenar y permite citar la fuente.',
      'Pregunta por los datos y la evaluación primero: cuántos ejemplos, quién los revisó, con qué casos no vistos se mide la mejora y cómo se comprueba lo que el modelo pudo olvidar.',
      'LoRA abarata entrenar y guardar (adaptadores de megabytes, no copias de cientos de gigabytes), pero cada adaptador va ligado al modelo base con el que se entrenó: pregunta quién lo mantiene cuando cambie la base, y trata los datos de ajuste como sensibles.',
    ],
    en: [
      'Demand the baseline before tuning: what does a good prompt achieve? And RAG? If the team cannot show those numbers on your own cases, tuning is a blind bet.',
      'Fine-tuning changes behavior and style; it is not a good way to “stuff in fresh knowledge.” For prices, policies, or catalogs that change, RAG updates without retraining and lets you cite the source.',
      'Ask about data and evaluation first: how many examples, who reviewed them, which unseen cases measure the improvement, and how you check what the model may have forgotten.',
      'LoRA makes training and storage cheap (megabyte adapters, not hundred-gigabyte copies), but each adapter is tied to the base model it was trained on: ask who maintains it when the base changes, and treat tuning data as sensitive.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué entrena LoRA?', en: 'What does LoRA train?' },
      options: [
        { es: 'Todos los parámetros del modelo, pero con menos datos.', en: 'All of the model’s parameters, but with less data.' },
        { es: 'Solo dos tablas delgadas, B y A, cuyo producto se suma a una tabla de parámetros que queda congelada.', en: 'Only two thin tables, B and A, whose product is added to a table of parameters that stays frozen.' },
        { es: 'Solo la última capa del modelo.', en: 'Only the model’s last layer.' },
        { es: 'El prompt, no los parámetros.', en: 'The prompt, not the parameters.' },
      ],
      answer: 1,
      why: {
        es: 'LoRA escribe la corrección como el producto de dos tablas de bajo rango, B y A, y solo esas reciben gradiente. Por eso se entrenan miles de veces menos parámetros y el adaptador se puede quitar.',
        en: 'LoRA writes the correction as the product of two low-rank tables, B and A, and only those receive gradients. That is why thousands of times fewer parameters train and the adapter can be removed.',
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
        { es: 'Olvido catastrófico; mezclar ejemplos de lo que ya sabía (repaso) y medir también lo anterior.', en: 'Catastrophic forgetting; mixing in examples of what it already knew (replay) and also measuring what came before.' },
      ],
      answer: 3,
      why: {
        es: 'Los mismos parámetros sirven a todas las tareas; moverlos con datos de una sola zona desacomoda lo que esos datos no cubren. El repaso y medir lo anterior son la defensa básica. Más épocas con los mismos datos no lo arregla y suele empeorarlo.',
        en: 'The same parameters serve every task; moving them with data from a single area disturbs what that data does not cover. Replay and measuring what came before are the basic defense. More epochs on the same data does not fix it and tends to make it worse.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Una tabla de 4096 por 4096 se adapta con LoRA de rango 8. ¿Cuántos números tienen B y A en total?',
        en: 'A 4096 by 4096 table is adapted with rank-8 LoRA. How many numbers do B and A have in total?',
      },
      options: [
        { es: '65 536', en: '65,536' },
        { es: '32 768', en: '32,768' },
        { es: '131 072', en: '131,072' },
        { es: '16 777 216', en: '16,777,216' },
      ],
      answer: 0,
      why: {
        es: 'B es de 4096×8 y A es de 8×4096: rango × (filas + columnas) = 8 × (4096 + 4096) = 65 536. La tabla completa tendría 4096 × 4096 = 16 777 216 casillas, 256 veces más.',
        en: 'B is 4096×8 and A is 8×4096: rank × (rows + columns) = 8 × (4096 + 4096) = 65,536. The full table would have 4096 × 4096 = 16,777,216 cells, 256 times more.',
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
        es: 'Es información que cambia y que debe citarse: ese es el terreno de RAG. Los hechos ajustados en los parámetros se aprenden despacio, no se actualizan sin reentrenar y no dan cita. El ajuste fino queda para el comportamiento: tono, formato o una tarea estrecha.',
        en: 'It is information that changes and must be cited: that is RAG territory. Facts tuned into the parameters are learned slowly, do not update without retraining, and give no citation. Fine-tuning is left for behavior: tone, format, or a narrow task.',
      },
    },
  ],

  glossary: ['fine-tuning', 'lora', 'low-rank', 'catastrophic-forgetting', 'base-model', 'pretraining', 'parameter', 'backpropagation', 'gradient-descent', 'adam', 'quantization', 'prompt', 'rag', 'validation-set'],

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
        es: 'Técnica de ajuste fino que congela los parámetros originales y entrena solo una corrección ΔW = B·A, producto de dos tablas delgadas. Al par B y A se le llama adaptador: se puede quitar o cambiar.',
        en: 'A fine-tuning technique that freezes the original parameters and trains only a correction ΔW = B·A, the product of two thin tables. The pair B and A is called an adapter: it can be removed or swapped.',
      },
    },
    {
      id: 'low-rank',
      term: { es: 'Bajo rango', en: 'Low rank' },
      def: {
        es: 'Propiedad de una tabla (matriz) que se escribe como suma de pocas piezas «columna × fila». El rango dice cuántas piezas hacen falta; una tabla de bajo rango se describe con muchos menos números que filas × columnas.',
        en: 'A property of a table (matrix) that can be written as a sum of a few “column × row” pieces. The rank says how many pieces are needed; a low-rank table is described with far fewer numbers than rows × columns.',
      },
    },
    {
      id: 'catastrophic-forgetting',
      term: { es: 'Olvido catastrófico', en: 'Catastrophic forgetting' },
      def: {
        es: 'Pérdida de habilidades previas cuando un modelo sigue entrenándose con datos de un solo tipo: los mismos parámetros sirven a todo, y moverlos por lo nuevo desacomoda lo viejo.',
        en: 'Loss of earlier skills when a model keeps training on data of a single kind: the same parameters serve everything, and moving them for the new disturbs the old.',
      },
    },
  ],

  sources: [
    { title: 'LoRA: Low-Rank Adaptation of Large Language Models', authors: 'Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L., Chen, W.', year: 2021, url: 'https://arxiv.org/abs/2106.09685' },
    { title: 'QLoRA: Efficient Finetuning of Quantized LLMs', authors: 'Dettmers, T., Pagnoni, A., Holtzman, A., Zettlemoyer, L.', year: 2023, url: 'https://arxiv.org/abs/2305.14314' },
    { title: 'LIMA: Less Is More for Alignment', authors: 'Zhou, C., Liu, P., Xu, P., Iyer, S., Sun, J., Mao, Y., Ma, X., Efrat, A., Yu, P., Yu, L., Zhang, S., Ghosh, G., Lewis, M., Zettlemoyer, L., Levy, O.', year: 2023, url: 'https://arxiv.org/abs/2305.11206' },
    { title: 'LLaMA: Open and Efficient Foundation Language Models', authors: 'Touvron, H., Lavril, T., Izacard, G., Martinet, X., Lachaux, M.-A., Lacroix, T., Rozière, B., Goyal, N., Hambro, E., Azhar, F., Rodriguez, A., Joulin, A., Grave, E., Lample, G.', year: 2023, url: 'https://arxiv.org/abs/2302.13971' },
    { title: 'Catastrophic Interference in Connectionist Networks: The Sequential Learning Problem (Psychology of Learning and Motivation 24, 109–165)', authors: 'McCloskey, M., Cohen, N. J.', year: 1989, url: 'https://doi.org/10.1016/S0079-7421(08)60536-8' },
    { title: 'LoRA Learns Less and Forgets Less', authors: 'Biderman, D., Portes, J., Gonzalez Ortiz, J. J., Paul, M., Greengard, P., Jennings, C., King, D., Havens, S., Chiley, V., Frankle, J., Blakeney, C., Cunningham, J. P.', year: 2024, url: 'https://arxiv.org/abs/2405.09673' },
    { title: 'Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs', authors: 'Ovadia, O., Brief, M., Mishaeli, M., Elisha, O.', year: 2023, url: 'https://arxiv.org/abs/2312.05934' },
    { title: 'Does Fine-Tuning LLMs on New Knowledge Encourage Hallucinations?', authors: 'Gekhman, Z., Yona, G., Aharoni, R., Eyal, M., Feder, A., Reichart, R., Herzig, J.', year: 2024, url: 'https://arxiv.org/abs/2405.05904' },
    { title: 'Language Models are Few-Shot Learners', authors: 'Brown, T. B. et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'ZeRO: Memory Optimizations Toward Training Trillion Parameter Models', authors: 'Rajbhandari, S., Rasley, J., Ruwase, O., He, Y.', year: 2019, url: 'https://arxiv.org/abs/1910.02054' },
    { title: 'Intrinsic Dimensionality Explains the Effectiveness of Language Model Fine-Tuning', authors: 'Aghajanyan, A., Zettlemoyer, L., Gupta, S.', year: 2020, url: 'https://arxiv.org/abs/2012.13255' },
    { title: 'The approximation of one matrix by another of lower rank (Psychometrika 1, 211–218)', authors: 'Eckart, C., Young, G.', year: 1936, url: 'https://doi.org/10.1007/BF02288367' },
  ],
});
