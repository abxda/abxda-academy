import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'evaluar',

  objectives: {
    es: [
      'Explicar por qué un benchmark público no basta para decidir (saturación, contaminación, protocolo) y qué aporta una evaluación propia.',
      'Calcular e interpretar un intervalo de confianza y estimar cuántos casos hacen falta para distinguir dos sistemas.',
      'Diseñar una evaluación: casos reales por segmento, calificación (rúbrica, juez automático, personas), pruebas de regresión, red teaming y métricas de negocio.',
    ],
    en: [
      'Explain why a public benchmark is not enough to decide (saturation, contamination, protocol) and what your own evaluation adds.',
      'Compute and interpret a confidence interval and estimate how many cases it takes to tell two systems apart.',
      'Design an evaluation: real cases by segment, grading (rubric, automatic judge, people), regression tests, red teaming, and business metrics.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Un proveedor te muestra que su modelo saca una nota altísima en un examen público. La pregunta de esta lección es otra: ¿sirve para tu caso?',
      en: 'A vendor shows you that its model scores sky-high on a public exam. The question in this lesson is a different one: does it work for your case?',
    },
    {
      id: 'claim',
      es: 'Algunos proveedores de IA jurídica aseguraban evitar las alucinaciones. Una evaluación independiente, con más de 200 consultas, las encontró entre el 17 % y el 33 % de las veces.',
      en: 'Some legal AI vendors said their tools avoided hallucinations. An independent evaluation, with over 200 queries, found them between 17% and 33% of the time.',
      tts: {
        es: 'Algunos proveedores de IA jurídica aseguraban evitar las alucinaciones. Una evaluación independiente, con más de doscientas consultas, las encontró entre el diecisiete y el treinta y tres por ciento de las veces.',
        en: 'Some legal AI vendors said their tools avoided hallucinations. An independent evaluation, with over two hundred queries, found them between seventeen and thirty-three percent of the time.',
      },
      pad: 0.4,
    },
    {
      id: 'bench',
      es: 'Los benchmarks son exámenes públicos: preguntas fijas, respuestas conocidas y una métrica. MMLU, de los más usados, tiene casi 16 000 preguntas de opción múltiple sobre 57 temas.',
      en: 'Benchmarks are public exams: fixed questions, known answers, and a metric. MMLU, one of the most used, has almost 16,000 multiple-choice questions across 57 subjects.',
      tts: {
        es: 'Los benchmarks son exámenes públicos: preguntas fijas, respuestas conocidas y una métrica. eme eme ele u, de los más usados, tiene casi dieciséis mil preguntas de opción múltiple sobre cincuenta y siete temas.',
        en: 'Benchmarks are public exams: fixed questions, known answers, and a metric. M M L U, one of the most used, has almost sixteen thousand multiple-choice questions across fifty-seven subjects.',
      },
      note: { es: 'Benchmark: examen público para comparar modelos.', en: 'Benchmark: a public exam to compare models.' },
      pad: 0.3,
    },
    {
      id: 'saturation',
      es: 'En 2020, GPT-3 acertó el 43.9 % de MMLU; el azar da 25 %. En 2023, GPT-4 llegó al 86.4 %. El nivel de un experto humano se estima en 89.8 %.',
      en: 'In 2020, GPT-3 scored 43.9% on MMLU; chance is 25%. In 2023, GPT-4 reached 86.4%. Expert human level is estimated at 89.8%.',
      tts: {
        es: 'En dos mil veinte, ge pe te tres acertó el cuarenta y tres coma nueve por ciento de eme eme ele u; el azar da veinticinco por ciento. En dos mil veintitrés, ge pe te cuatro llegó al ochenta y seis coma cuatro por ciento. El nivel de un experto humano se estima en ochenta y nueve coma ocho por ciento.',
        en: 'In twenty twenty, G P T three scored forty-three point nine percent on M M L U; chance is twenty-five percent. In twenty twenty-three, G P T four reached eighty-six point four percent. Expert human level is estimated at eighty-nine point eight percent.',
      },
      pad: 0.5,
    },
    {
      id: 'ceiling',
      es: 'Cuando los mejores rozan el techo, un punto más o menos ya no distingue nada. Y el examen mismo falla: se estima que el 6.49 % de las preguntas de MMLU contiene errores.',
      en: 'When the best models touch the ceiling, a point more or less distinguishes nothing. And the exam itself has flaws: an estimated 6.49% of MMLU questions contain errors.',
      tts: {
        es: 'Cuando los mejores rozan el techo, un punto más o menos ya no distingue nada. Y el examen mismo falla: se estima que el seis coma cuarenta y nueve por ciento de las preguntas de eme eme ele u contiene errores.',
        en: 'When the best models touch the ceiling, a point more or less distinguishes nothing. And the exam itself has flaws: an estimated six point four nine percent of M M L U questions contain errors.',
      },
      pad: 0.5,
    },
    {
      id: 'protocol',
      es: 'También importa cómo se pregunta. Gemini Ultra sacó 83.7 % con cinco ejemplos y 90.04 % votando entre 32 razonamientos. Solo la segunda cifra supera el nivel de los expertos.',
      en: 'How you ask matters too. Gemini Ultra scored 83.7% with five examples and 90.04% by voting among 32 reasoning attempts. Only the second figure beats the expert level.',
      tts: {
        es: 'También importa cómo se pregunta. Gemini Ultra sacó ochenta y tres coma siete por ciento con cinco ejemplos y noventa coma cero cuatro por ciento votando entre treinta y dos razonamientos. Solo la segunda cifra supera el nivel de los expertos.',
        en: 'How you ask matters too. Gemini Ultra scored eighty-three point seven percent with five examples and ninety point zero four percent by voting among thirty-two reasoning attempts. Only the second figure beats the expert level.',
      },
      pad: 0.5,
    },
    {
      id: 'contam',
      es: 'Peor es la contaminación: si las preguntas del examen estaban en los datos de preentrenamiento, el modelo pudo memorizarlas. Es la fuga de datos de siempre, a escala de internet.',
      en: 'Worse is contamination: if the exam questions were in the pretraining data, the model may have memorized them. It is the usual data leakage, at internet scale.',
      note: { es: 'Contaminación: el examen estaba en el entrenamiento.', en: 'Contamination: the exam was in the training data.' },
      pad: 0.4,
    },
    {
      id: 'gsm1k',
      es: 'Se ha medido. Un equipo escribió 1205 problemas de matemáticas nuevos, del estilo de un examen famoso. Algunos modelos acertaron hasta 8 % menos que en el original; los mejores casi no cayeron.',
      en: 'It has been measured. A team wrote 1,205 new math problems in the style of a famous exam. Some models scored up to 8% lower than on the original; the best barely dropped.',
      tts: {
        es: 'Se ha medido. Un equipo escribió mil doscientos cinco problemas de matemáticas nuevos, del estilo de un examen famoso. Algunos modelos acertaron hasta ocho por ciento menos que en el original; los mejores casi no cayeron.',
        en: 'It has been measured. A team wrote one thousand two hundred five new math problems in the style of a famous exam. Some models scored up to eight percent lower than on the original; the best barely dropped.',
      },
      pad: 0.5,
    },
    {
      id: 'try1',
      es: 'Tu turno: sube la parte del examen que el modelo A vio al entrenarse. Su capacidad real no cambia; mira qué pasa con la tabla.',
      en: 'Your turn: raise the share of the exam that model A saw during training. Its real ability does not change; watch what happens to the table.',
      gate: {
        id: 'contam',
        prompt: { es: 'Sube la contaminación de A hasta que supere a B en la tabla.', en: 'Raise A’s contamination until it beats B in the table.' },
      },
      pad: 0.4,
    },
    {
      id: 'contam-after',
      es: 'La capacidad real no cambió: B sigue siendo mejor. Y puede ser accidental: los autores de GPT-4 hallaron que parte de BIG-bench se había colado en su entrenamiento y la excluyeron.',
      en: 'Real ability did not change: B is still better. And it can be accidental: the GPT-4 authors found that part of BIG-bench had slipped into training, and they excluded it.',
      tts: {
        es: 'La capacidad real no cambió: B sigue siendo mejor. Y puede ser accidental: los autores de ge pe te cuatro hallaron que parte de big bench se había colado en su entrenamiento y la excluyeron.',
        en: 'Real ability did not change: B is still better. And it can be accidental: the G P T four authors found that part of big bench had slipped into training, and they excluded it.',
      },
      pad: 0.4,
    },
    {
      id: 'goodhart',
      es: 'Hay un principio más general, la ley de Goodhart: cuando una medida se vuelve meta, deja de ser buena medida. Si todos optimizan para el examen, deja de medir lo que querías.',
      en: 'There is a more general principle, Goodhart’s law: when a measure becomes a target, it ceases to be a good measure. If everyone optimizes for the exam, it stops measuring what you wanted.',
      note: { es: 'Ley de Goodhart: la meta deja de medir.', en: 'Goodhart’s law: the target stops measuring.' },
      pad: 0.5,
    },
    {
      id: 'gold',
      es: 'La alternativa es una evaluación propia: un conjunto de casos reales de tu operación, cada uno con la respuesta que tus expertos aceptan. Son los casos de oro.',
      en: 'The alternative is your own evaluation: a set of real cases from your operation, each with the answer your experts accept. These are the gold cases.',
      note: { es: 'Conjunto de evaluación: casos reales y su respuesta aceptada.', en: 'Eval set: real cases and their accepted answer.' },
      pad: 0.4,
    },
    {
      id: 'mix',
      es: 'No basta con juntar casos: importa la mezcla. Hay preguntas frecuentes y fáciles, casos con excepciones, casos de riesgo y peticiones que el sistema debería rechazar.',
      en: 'Collecting cases is not enough: the mix matters. There are frequent easy questions, cases with exceptions, high-risk cases, and requests the system should refuse.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: juega a ser el proveedor. Sube la proporción de casos fáciles hasta llegar a 93 %; luego pon la mezcla real, con 70 % de fáciles.',
      en: 'Your turn: play the vendor. Raise the share of easy cases until the score reaches 93%; then set the real mix, with 70% easy.',
      tts: {
        es: 'Tu turno: juega a ser el proveedor. Sube la proporción de casos fáciles hasta llegar a noventa y tres por ciento; luego pon la mezcla real, con setenta por ciento de fáciles.',
        en: 'Your turn: play the vendor. Raise the share of easy cases until the score reaches ninety-three percent; then set the real mix, with seventy percent easy.',
      },
      gate: {
        id: 'mix',
        prompt: { es: 'Llega a 93 % con casos fáciles y luego fija 70 % (la mezcla real).', en: 'Reach 93% with easy cases, then set 70% (the real mix).' },
      },
      pad: 0.4,
    },
    {
      id: 'slices',
      es: 'El mismo sistema saca entre 65 % y 96 % según el conjunto; con el tráfico real, 87 %. Por eso se reporta también por segmento: el promedio esconde dónde está el riesgo.',
      en: 'The same system scores between 65% and 96% depending on the set; with real traffic, 87%. That is why you also report by segment: the average hides where the risk is.',
      tts: {
        es: 'El mismo sistema saca entre sesenta y cinco y noventa y seis por ciento según el conjunto; con el tráfico real, ochenta y siete por ciento. Por eso se reporta también por segmento: el promedio esconde dónde está el riesgo.',
        en: 'The same system scores between sixty-five and ninety-six percent depending on the set; with real traffic, eighty-seven percent. That is why you also report by segment: the average hides where the risk is.',
      },
      note: { es: 'La mezcla de casos decide la nota: reporta por segmento.', en: 'The case mix decides the score: report by segment.' },
      pad: 0.5,
    },
    {
      id: 'grade',
      es: 'Calificar es otra decisión. Una respuesta cerrada se compara con la correcta y el código se prueba. Un resumen necesita una rúbrica y alguien que la aplique: una persona o un modelo.',
      en: 'Grading is another decision. A closed answer is compared with the right one, and code is tested. A summary needs a rubric and someone to apply it: a person or a model.',
      pad: 0.5,
    },
    {
      id: 'judge',
      es: 'Una opción que escala es el LLM como juez: un modelo que califica con una rúbrica. En un estudio, GPT-4 coincidió con humanos más del 80 % de las veces, como ellos entre sí.',
      en: 'One option that scales is LLM-as-a-judge: a model that grades against a rubric. In one study, GPT-4 agreed with humans over 80% of the time, as much as they agree with each other.',
      tts: {
        es: 'Una opción que escala es el ele ele eme como juez: un modelo que califica con una rúbrica. En un estudio, ge pe te cuatro coincidió con humanos más de ochenta por ciento de las veces, como ellos entre sí.',
        en: 'One option that scales is L L M as a judge: a model that grades against a rubric. In one study, G P T four agreed with humans over eighty percent of the time, as much as they agree with each other.',
      },
      note: { es: 'LLM como juez: escala, pero con sesgos.', en: 'LLM-as-a-judge: it scales, but it has biases.' },
      pad: 0.5,
    },
    {
      id: 'bias',
      es: 'Pero el juez tiene sesgos. Con dos respuestas casi idénticas, GPT-4 mantuvo su veredicto al invertir el orden solo el 65 % de las veces; otro juez del estudio, el 24 %.',
      en: 'But the judge has biases. With two nearly identical answers, GPT-4 kept its verdict after swapping the order only 65% of the time; another judge in the study, 24%.',
      tts: {
        es: 'Pero el juez tiene sesgos. Con dos respuestas casi idénticas, ge pe te cuatro mantuvo su veredicto al invertir el orden solo el sesenta y cinco por ciento de las veces; otro juez del estudio, el veinticuatro por ciento.',
        en: 'But the judge has biases. With two nearly identical answers, G P T four kept its verdict after swapping the order only sixty-five percent of the time; another judge in the study, twenty-four percent.',
      },
      pad: 0.5,
    },
    {
      id: 'bias2',
      es: 'También premia lo largo: una versión repetitiva y más extensa engañó a dos de los tres jueces el 91 % de las veces. Defensas: invertir el orden, usar rúbricas y contrastar con humanos.',
      en: 'It also rewards length: a longer, repetitive version fooled two of the three judges 91% of the time. Defenses: swap the order, use rubrics, and check against humans.',
      tts: {
        es: 'También premia lo largo: una versión repetitiva y más extensa engañó a dos de los tres jueces el noventa y uno por ciento de las veces. Defensas: invertir el orden, usar rúbricas y contrastar con humanos.',
        en: 'It also rewards length: a longer, repetitive version fooled two of the three judges ninety-one percent of the time. Defenses: swap the order, use rubrics, and check against humans.',
      },
      pad: 0.5,
    },
    {
      id: 'human',
      es: 'Las personas son la referencia: califica cien casos a mano y mide cuánto coincide el juez. Chatbot Arena reunió más de 240 000 votos humanos, pero sobre preguntas que no son las tuyas.',
      en: 'People are the reference: grade a hundred cases by hand and measure how often the judge agrees. Chatbot Arena gathered over 240,000 human votes, but on questions that are not yours.',
      tts: {
        es: 'Las personas son la referencia: califica cien casos a mano y mide cuánto coincide el juez. Chatbot Arena reunió más de doscientos cuarenta mil votos humanos, pero sobre preguntas que no son las tuyas.',
        en: 'People are the reference: grade a hundred cases by hand and measure how often the judge agrees. Chatbot Arena gathered over two hundred forty thousand human votes, but on questions that are not yours.',
      },
      pad: 0.5,
    },
    {
      id: 'noise',
      es: 'Ahora, el número. Si tu sistema acierta 78 de 100 casos, ¿su exactitud es 78 %? Con otros 100 casos podría salir 72 u 84. Una nota sin margen de error es una opinión.',
      en: 'Now, the number. If your system gets 78 of 100 cases right, is its accuracy 78%? On another 100 cases it could come out 72 or 84. A score without a margin of error is an opinion.',
      tts: {
        es: 'Ahora, el número. Si tu sistema acierta setenta y ocho de cien casos, ¿su exactitud es setenta y ocho por ciento? Con otros cien casos podría salir setenta y dos u ochenta y cuatro. Una nota sin margen de error es una opinión.',
        en: 'Now, the number. If your system gets seventy-eight of a hundred cases right, is its accuracy seventy-eight percent? On another hundred cases it could come out seventy-two or eighty-four. A score without a margin of error is an opinion.',
      },
      pad: 0.5,
    },
    {
      id: 'ci',
      es: 'Ese rango es el intervalo de confianza. Con 100 casos, una nota de 78 % lleva unos 8 puntos de margen; con 400, unos 4. Reducir el margen a la mitad cuesta cuatro veces más casos.',
      en: 'That range is the confidence interval. With 100 cases, a 78% score carries about 8 points of margin; with 400, about 4. Halving the margin costs four times as many cases.',
      tts: {
        es: 'Ese rango es el intervalo de confianza. Con cien casos, una nota de setenta y ocho por ciento lleva unos ocho puntos de margen; con cuatrocientos, unos cuatro. Reducir el margen a la mitad cuesta cuatro veces más casos.',
        en: 'That range is the confidence interval. With a hundred cases, a seventy-eight percent score carries about eight points of margin; with four hundred, about four. Halving the margin costs four times as many cases.',
      },
      note: { es: 'Intervalo de confianza: toda nota lleva un margen.', en: 'Confidence interval: every score carries a margin.' },
      pad: 0.5,
    },
    {
      id: 'compare',
      es: 'Comparar dos sistemas es más exigente. A acierta 78 % y B 74 %: la diferencia real es de 4 puntos, pero cada evaluación la mide con ruido.',
      en: 'Comparing two systems is more demanding. A scores 78% and B 74%: the real difference is 4 points, but each evaluation measures it with noise.',
      tts: {
        es: 'Comparar dos sistemas es más exigente. A acierta setenta y ocho por ciento y B setenta y cuatro: la diferencia real es de cuatro puntos, pero cada evaluación la mide con ruido.',
        en: 'Comparing two systems is more demanding. A scores seventy-eight percent and B seventy-four: the real difference is four points, but each evaluation measures it with noise.',
      },
      pad: 0.5,
    },
    {
      id: 'try3',
      es: 'Tu turno: cambia el tamaño de la muestra y repite la evaluación. ¿Cuántos casos hacen falta para no equivocarte de ganador?',
      en: 'Your turn: change the sample size and repeat the evaluation. How many cases does it take to avoid picking the wrong winner?',
      gate: {
        id: 'samplesize',
        prompt: { es: 'Encuentra el menor tamaño de muestra con el que A queda por delante en al menos 95 de cada 100 evaluaciones.', en: 'Find the smallest sample size where A comes out ahead in at least 95 of every 100 evaluations.' },
      },
      pad: 0.4,
    },
    {
      id: 'paired',
      es: 'Con unos 400 casos, el ganador casi siempre sale bien. Y si ambos se prueban con los mismos casos, los errores compartidos se cancelan: con casos distintos hacen falta unos 750.',
      en: 'With about 400 cases, the winner almost always comes out right. And if both are tested on the same cases, shared errors cancel out: with different cases you need about 750.',
      tts: {
        es: 'Con unos cuatrocientos casos, el ganador casi siempre sale bien. Y si ambos se prueban con los mismos casos, los errores compartidos se cancelan: con casos distintos hacen falta unos setecientos cincuenta.',
        en: 'With about four hundred cases, the winner almost always comes out right. And if both are tested on the same cases, shared errors cancel out: with different cases you need about seven hundred fifty.',
      },
      note: { es: 'Mismos casos para ambos: el ruido compartido se cancela.', en: 'Same cases for both: shared noise cancels out.' },
      pad: 0.5,
    },
    {
      id: 'prove',
      es: 'Elegir al ganador no es demostrar la diferencia: para que el intervalo suela excluir el cero hacen falta unos 1000 casos. Por eso se reporta el intervalo, no solo la nota.',
      en: 'Picking the winner is not proving the difference: for the interval to usually exclude zero takes about 1,000 cases. That is why you report the interval, not just the score.',
      tts: {
        es: 'Elegir al ganador no es demostrar la diferencia: para que el intervalo suela excluir el cero hacen falta unos mil casos. Por eso se reporta el intervalo, no solo la nota.',
        en: 'Picking the winner is not proving the difference: for the interval to usually exclude zero takes about one thousand cases. That is why you report the interval, not just the score.',
      },
      pad: 0.6,
    },
    {
      id: 'drift',
      es: 'Los modelos cambian. En una prueba con números primos, GPT-4 pasó de acertar el 84 % en marzo de 2023 al 51 % en junio, según un estudio académico. Su comportamiento cambió.',
      en: 'Models change. On a test of prime numbers, GPT-4 went from 84% accuracy in March 2023 to 51% in June, according to an academic study. Its behavior changed.',
      tts: {
        es: 'Los modelos cambian. En una prueba con números primos, ge pe te cuatro pasó de acertar el ochenta y cuatro por ciento en marzo de dos mil veintitrés al cincuenta y uno por ciento en junio, según un estudio académico. Su comportamiento cambió.',
        en: 'Models change. On a test of prime numbers, G P T four went from eighty-four percent accuracy in March twenty twenty-three to fifty-one percent in June, according to an academic study. Its behavior changed.',
      },
      pad: 0.5,
    },
    {
      id: 'regress',
      es: 'Por eso tu conjunto de oro se corre en cada cambio de modelo, de instrucciones o de datos, y se compara con la corrida anterior. Es una prueba de regresión.',
      en: 'That is why your gold set runs on every change of model, instructions, or data, and is compared with the previous run. It is a regression test.',
      note: { es: 'Regresión: repite tu evaluación en cada cambio.', en: 'Regression: rerun your evaluation on every change.' },
      pad: 0.5,
    },
    {
      id: 'redteam',
      es: 'Las evaluaciones miden el uso típico; el red teaming busca el peor caso. Un equipo ataca el sistema a propósito: un estudio reunió 38 961 ataques. Cada falla hallada se vuelve un caso nuevo.',
      en: 'Evaluations measure typical use; red teaming looks for the worst case. A team attacks the system on purpose: one study collected 38,961 attacks. Each failure found becomes a new case.',
      tts: {
        es: 'Las evaluaciones miden el uso típico; el red tíming busca el peor caso. Un equipo ataca el sistema a propósito: un estudio reunió treinta y ocho mil novecientos sesenta y un ataques. Cada falla hallada se vuelve un caso nuevo.',
        en: 'Evaluations measure typical use; red teaming looks for the worst case. A team attacks the system on purpose: one study collected thirty-eight thousand nine hundred sixty-one attacks. Each failure found becomes a new case.',
      },
      note: { es: 'Red teaming: buscar el peor caso a propósito.', en: 'Red teaming: deliberately hunt for the worst case.' },
      pad: 0.5,
    },
    {
      id: 'business',
      es: 'Por último, la nota del conjunto no es el resultado de negocio. Mide costo por caso resuelto, tiempo ahorrado y quejas, y confírmalo en un piloto con usuarios reales.',
      en: 'Finally, the set’s score is not the business result. Measure cost per resolved case, time saved, and complaints, and confirm it in a pilot with real users.',
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: casos reales, criterios claros, un intervalo en cada nota, repetir en cada cambio, atacar el sistema y medir el resultado de negocio. Así se comprueba que algo sirve.',
      en: 'In short: real cases, clear criteria, an interval on every score, repeat on every change, attack the system, and measure the business result. That is how you check that something works.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Aun con buena calidad medida, un sistema puede fallar de otras formas: filtrar datos, ser manipulado, discriminar. Eso es riesgo, y hay que gobernarlo. Es el siguiente tema.',
      en: 'Even with good measured quality, a system can fail in other ways: leaking data, being manipulated, discriminating. That is risk, and it has to be governed. That is the next topic.',
    },
  ],

  keyIdeas: {
    es: [
      'Un benchmark público compara modelos con un examen común, pero se satura, tiene errores, depende del protocolo con que se pregunta y puede estar contaminado: no dice si sirve para tu caso.',
      'Una evaluación propia, con casos reales de tu organización y la respuesta que aceptan tus expertos, es la que mide tu caso. La mezcla de casos decide la nota, así que se reporta por segmento.',
      'Calificar respuestas abiertas exige rúbricas. Un modelo como juez escala, pero tiene sesgos (de posición, de longitud) y debe contrastarse con etiquetas humanas.',
      'Toda nota lleva un intervalo de confianza: su margen baja con la raíz del número de casos. Distinguir dos sistemas exige cientos o miles de casos, y menos si ambos se prueban con los mismos.',
      'Evaluar no es un acto único: pruebas de regresión en cada cambio, red teaming para el peor caso y métricas de negocio confirmadas en un piloto.',
    ],
    en: [
      'A public benchmark compares models on a shared exam, but it saturates, has errors, depends on the protocol used to ask, and can be contaminated: it does not tell you whether it works for your case.',
      'Your own evaluation, with real cases from your organization and the answer your experts accept, is the one that measures your case. The case mix decides the score, so you report by segment.',
      'Grading open answers requires rubrics. A model as judge scales, but it has biases (position, length) and must be checked against human labels.',
      'Every score carries a confidence interval: its margin shrinks with the square root of the number of cases. Telling two systems apart takes hundreds or thousands of cases, and fewer if both are tested on the same ones.',
      'Evaluating is not a one-off act: regression tests on every change, red teaming for the worst case, and business metrics confirmed in a pilot.',
    ],
  },

  misconception: {
    wrong: {
      es: '«Este modelo lidera los benchmarks públicos, así que será el mejor para mi organización».',
      en: '“This model leads the public benchmarks, so it will be the best for my organization.”',
    },
    right: {
      es: 'Un benchmark mide un examen concreto y su cifra depende de cómo se preguntó, de si el examen se filtró al entrenamiento y de cuántos modelos ya lo saturan. Solo una evaluación con tus casos reales, con intervalo de confianza, dice si sirve para tu caso.',
      en: 'A benchmark measures one specific exam and its figure depends on how it was asked, on whether the exam leaked into training, and on how many models already saturate it. Only an evaluation with your real cases, with a confidence interval, tells you whether it works for your case.',
    },
  },

  deeper: {
    es: `## Qué es (y qué no es) un intervalo de confianza

Con $k$ aciertos en $n$ casos, la nota es $\\hat p = k/n$. Su margen aproximado al 95 % es

$$\\hat p \\pm 1.96\\sqrt{\\hat p\\,(1-\\hat p)/n}$$

que en el peor caso ($\\hat p = 0.5$) vale $\\approx 1/\\sqrt{n}$: unos 10 puntos con 100 casos, 5 con 400 y 2.5 con 1600. Con pocos casos, o con notas cerca de 0 % o de 100 %, se prefiere el intervalo de Wilson (1927), que es el que usa la escena:

$$\\frac{\\hat p + \\dfrac{z^2}{2n} \\pm z\\sqrt{\\dfrac{\\hat p(1-\\hat p)}{n} + \\dfrac{z^2}{4n^2}}}{1 + z^2/n}, \\qquad z = 1.96.$$

La lectura correcta: si repitieras la evaluación muchas veces con casos nuevos, el 95 % de los intervalos construidos así contendría la exactitud real. Bowyer et al. (2025) advierten que con menos de unos cientos de casos los intervalos basados en la aproximación normal subestiman la incertidumbre.

## Comparar dos sistemas con los mismos casos

Para cada caso, $d_i = a_i - b_i \\in \\{-1, 0, +1\\}$. Si $b$ casos los acierta solo A y $c$ casos los acierta solo B, la diferencia es $\\bar d = (b-c)/n$ y su error estándar,

$$\\mathrm{ET}(\\bar d) = \\sqrt{\\frac{(b+c)/n - \\bar d^{\\,2}}{n-1}}, \\qquad \\bar d \\pm 1.96\\,\\mathrm{ET}.$$

Probar cada sistema con casos distintos suma las varianzas: $p_A(1-p_A)/n + p_B(1-p_B)/n$. En la lección eso es $0.364/n$ frente a $0.198/n$ con los mismos casos: casi la mitad. Con una diferencia real $\\delta = 0.04$, el tamaño necesario es $n \\approx (z_\\alpha + z_\\beta)^2\\,\\sigma_d^2/\\delta^2$:

- que A quede por delante el 95 % de las veces ($z = 1.645$): $n \\approx 1.645^2 \\cdot 0.198 / 0.04^2 \\approx 335$ (en la cuadrícula de la escena, 400);
- que el intervalo excluya el cero el 80 % de las veces ($z = 1.96 + 0.84$): $n \\approx 2.8^2 \\cdot 0.198/0.04^2 \\approx 970$.

La prueba de McNemar usa $z = (b-c)/\\sqrt{b+c}$. Miller (2024) resume el oficio: reporta errores estándar, compara por pares, agrupa casos que no son independientes y planifica el tamaño de la muestra antes de evaluar.

## Contaminación: la aritmética

Si el modelo acierta siempre lo que vio, tiene capacidad real $a$ en lo demás y una fracción $c$ del examen estaba en su entrenamiento, la nota medida es

$$\\text{nota} = c + (1-c)\\,a.$$

Con $a = 0.70$ y $c = 0.25$ sale $0.775$. Un modelo B con $a = 0.76$ y $c = 0$ queda detrás de A en cuanto $c > (0.76 - 0.70)/(1 - 0.70) = 0.20$. Es un modelo simplificado: la memoria real es parcial. Se detecta con coincidencias de texto entre examen y corpus (el informe de GPT-4 usó subcadenas de 50 caracteres, con falsos negativos si hay pequeñas diferencias), con problemas nuevos equivalentes (GSM1k) o comparando la probabilidad que el modelo asigna a los ejemplos del examen.

## El juez automático y el protocolo

Zheng et al. (2023) midieron sesgo de posición, sesgo de longitud, una posible preferencia por las respuestas propias (no confirmada) y límites de razonamiento al calificar. Dos medidas útiles: la *consistencia* (porcentaje de veces que el veredicto se mantiene al invertir el orden) y la concordancia $p_o$ con personas. Para descontar el azar, $\\kappa = (p_o - p_e)/(1 - p_e)$. También el protocolo mueve la cifra: Sclar et al. (2023) hallaron diferencias de hasta 76 puntos de exactitud solo por cambiar el formato del *prompt* en un modelo abierto con pocos ejemplos. Y los benchmarks se agotan: Phan et al. (2025) construyeron un examen nuevo de 2500 preguntas porque los modelos ya superan el 90 % en MMLU.

La cifra de 90.04 % de Gemini Ultra usa 32 razonamientos por pregunta con un criterio de «enrutamiento por incertidumbre»: si los razonamientos coinciden lo suficiente gana la mayoría, y si no se usa la respuesta directa del modelo. Con cinco ejemplos y respuesta directa la misma familia saca 83.7 % (Gemini Team, 2023).

## Deriva: ¿capacidad o comportamiento?

Chen, Zaharia y Zou (2023) midieron el mismo servicio en marzo y en junio de 2023. Narayanan y Kapoor (2023) señalaron que los números de la prueba de primos eran todos primos: el modelo de marzo casi siempre respondía «primo» y el de junio casi siempre «compuesto». Es un cambio de comportamiento, no necesariamente de capacidad; para quien depende del servicio el efecto práctico es el mismo, porque lo que funcionaba dejó de funcionar y solo se nota volviendo a medir.

## En código

\`\`\`python
import numpy as np

def wilson(k, n, z=1.96):
    """Intervalo de Wilson al 95 % para k aciertos de n casos."""
    p = k / n
    centro = (p + z**2 / (2 * n)) / (1 + z**2 / n)
    mitad = z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / (1 + z**2 / n)
    return round(float(centro - mitad), 3), round(float(centro + mitad), 3)

for n in (25, 100, 400, 1600):
    print(n, wilson(round(0.78 * n), n))
# 25 (0.609, 0.911)
# 100 (0.689, 0.85)
# 400 (0.737, 0.818)
# 1600 (0.759, 0.8)

# Dos sistemas con los mismos casos: ambos aciertan 0,66; solo A, 0,12; solo B, 0,08; ninguno, 0,14
rng = np.random.default_rng(0)
def p_a_por_delante(n, reps=20000, q=(0.66, 0.12, 0.08, 0.14)):
    c = rng.multinomial(n, q, size=reps)       # columnas: ambos, solo A, solo B, ninguno
    return round(float(np.mean(c[:, 1] > c[:, 2])), 3)

for n in (100, 400, 1000):
    print(n, p_a_por_delante(n))
# 100 0.776
# 400 0.959
# 1000 0.997
\`\`\`

## Lo que viene

La calidad medida es un eje; el riesgo es otro: privacidad, manipulación de instrucciones, sesgo y regulación. La lección 35 los recorre y la 36 usa esta evaluación como parte de un piloto que escala.`,
    en: `## What a confidence interval is (and is not)

With $k$ correct answers in $n$ cases, the score is $\\hat p = k/n$. Its approximate 95% margin is

$$\\hat p \\pm 1.96\\sqrt{\\hat p\\,(1-\\hat p)/n}$$

which in the worst case ($\\hat p = 0.5$) is $\\approx 1/\\sqrt{n}$: about 10 points with 100 cases, 5 with 400, and 2.5 with 1,600. With few cases, or scores near 0% or 100%, the Wilson interval (1927) is preferred, and it is the one the scene uses:

$$\\frac{\\hat p + \\dfrac{z^2}{2n} \\pm z\\sqrt{\\dfrac{\\hat p(1-\\hat p)}{n} + \\dfrac{z^2}{4n^2}}}{1 + z^2/n}, \\qquad z = 1.96.$$

The correct reading: if you repeated the evaluation many times with fresh cases, 95% of the intervals built this way would contain the true accuracy. Bowyer et al. (2025) warn that with fewer than a few hundred cases, intervals based on the normal approximation underestimate uncertainty.

## Comparing two systems on the same cases

For each case, $d_i = a_i - b_i \\in \\{-1, 0, +1\\}$. If $b$ cases are got right only by A and $c$ cases only by B, the difference is $\\bar d = (b-c)/n$ and its standard error is

$$\\mathrm{SE}(\\bar d) = \\sqrt{\\frac{(b+c)/n - \\bar d^{\\,2}}{n-1}}, \\qquad \\bar d \\pm 1.96\\,\\mathrm{SE}.$$

Testing each system on different cases adds the variances: $p_A(1-p_A)/n + p_B(1-p_B)/n$. In the lesson that is $0.364/n$ versus $0.198/n$ with the same cases: almost half. With a true difference $\\delta = 0.04$, the required size is $n \\approx (z_\\alpha + z_\\beta)^2\\,\\sigma_d^2/\\delta^2$:

- for A to come out ahead 95% of the time ($z = 1.645$): $n \\approx 1.645^2 \\cdot 0.198 / 0.04^2 \\approx 335$ (400 on the scene’s grid);
- for the interval to exclude zero 80% of the time ($z = 1.96 + 0.84$): $n \\approx 2.8^2 \\cdot 0.198/0.04^2 \\approx 970$.

McNemar’s test uses $z = (b-c)/\\sqrt{b+c}$. Miller (2024) sums up the craft: report standard errors, compare in pairs, cluster cases that are not independent, and plan the sample size before evaluating.

## Contamination: the arithmetic

If the model always gets right what it saw, has real ability $a$ on the rest, and a fraction $c$ of the exam was in its training data, the measured score is

$$\\text{score} = c + (1-c)\\,a.$$

With $a = 0.70$ and $c = 0.25$ you get $0.775$. A model B with $a = 0.76$ and $c = 0$ falls behind A as soon as $c > (0.76 - 0.70)/(1 - 0.70) = 0.20$. It is a simplified model: real memory is partial. It is detected with text matches between exam and corpus (the GPT-4 report used 50-character substrings, with false negatives when there are small differences), with equivalent fresh problems (GSM1k), or by comparing the probability the model assigns to the exam’s examples.

## The automatic judge and the protocol

Zheng et al. (2023) measured position bias, length bias, a possible preference for a model’s own answers (not confirmed), and limits in reasoning when grading. Two useful measures: *consistency* (the share of times the verdict holds when the order is swapped) and agreement $p_o$ with people. To discount chance, $\\kappa = (p_o - p_e)/(1 - p_e)$. The protocol also moves the figure: Sclar et al. (2023) found differences of up to 76 accuracy points just from changing the *prompt* format in an open model with few-shot examples. And benchmarks run out: Phan et al. (2025) built a new 2,500-question exam because models already exceed 90% on MMLU.

Gemini Ultra’s 90.04% figure uses 32 reasoning attempts per question with an “uncertainty-routed” rule: if the attempts agree enough the majority wins, and if not the model’s direct answer is used. With five examples and a direct answer the same model family scores 83.7% (Gemini Team, 2023).

## Drift: ability or behavior?

Chen, Zaharia, and Zou (2023) measured the same service in March and in June 2023. Narayanan and Kapoor (2023) pointed out that the numbers in the prime test were all primes: the March model almost always answered “prime” and the June one almost always “composite.” That is a change in behavior, not necessarily in ability; for someone who depends on the service the practical effect is the same, because what worked stopped working and you only notice by measuring again.

## In code

\`\`\`python
import numpy as np

def wilson(k, n, z=1.96):
    """95% Wilson interval for k correct answers out of n cases."""
    p = k / n
    center = (p + z**2 / (2 * n)) / (1 + z**2 / n)
    half = z * np.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / (1 + z**2 / n)
    return round(float(center - half), 3), round(float(center + half), 3)

for n in (25, 100, 400, 1600):
    print(n, wilson(round(0.78 * n), n))
# 25 (0.609, 0.911)
# 100 (0.689, 0.85)
# 400 (0.737, 0.818)
# 1600 (0.759, 0.8)

# Two systems on the same cases: both right 0.66; only A, 0.12; only B, 0.08; neither, 0.14
rng = np.random.default_rng(0)
def p_a_ahead(n, reps=20000, q=(0.66, 0.12, 0.08, 0.14)):
    c = rng.multinomial(n, q, size=reps)       # columns: both, only A, only B, neither
    return round(float(np.mean(c[:, 1] > c[:, 2])), 3)

for n in (100, 400, 1000):
    print(n, p_a_ahead(n))
# 100 0.776
# 400 0.959
# 1000 0.997
\`\`\`

## What comes next

Measured quality is one axis; risk is another: privacy, instruction hijacking, bias, and regulation. Lesson 35 walks through them, and lesson 36 uses this evaluation as part of a pilot that scales.`,
  },

  lens: {
    es: [
      'Antes de comprar, pide el protocolo completo de cada cifra: instrucciones, número de ejemplos, número de muestras, versión del modelo y fecha. Sin eso, dos cifras no se pueden comparar y una podría estar contaminada.',
      'Evalúa con tus datos: reúne unos cientos de casos reales y anonimizados, con la respuesta que tus expertos aceptan, que el proveedor no haya visto. Incluye lo frecuente, lo difícil, lo riesgoso y lo que debe rechazarse, y reporta por segmento.',
      'Exige intervalos de confianza. Si dos sistemas difieren menos que el margen, trátalos como empate y decide por costo, latencia y riesgo. Si se usa un juez automático, pide su concordancia con etiquetas humanas.',
      'Haz de la evaluación una rutina: repítela en cada cambio de modelo, instrucciones o datos; que un equipo ataque el sistema antes del lanzamiento; y fija de antemano qué resultado de negocio justifica seguir, confirmado en un piloto.',
    ],
    en: [
      'Before buying, ask for the full protocol behind each figure: instructions, number of examples, number of samples, model version, and date. Without it, two figures cannot be compared and one may be contaminated.',
      'Evaluate with your data: gather a few hundred real, anonymized cases, with the answer your experts accept, that the vendor has not seen. Include the frequent, the hard, the risky, and what must be refused, and report by segment.',
      'Demand confidence intervals. If two systems differ by less than the margin, treat them as a tie and decide on cost, latency, and risk. If an automatic judge is used, ask for its agreement with human labels.',
      'Make evaluation a routine: repeat it on every change of model, instructions, or data; have a team attack the system before launch; and set in advance which business result justifies continuing, confirmed in a pilot.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué es la contaminación de un benchmark?', en: 'What is benchmark contamination?' },
      options: [
        { es: 'Que el examen contiene preguntas con errores en su clave de respuestas.', en: 'That the exam contains questions with errors in its answer key.' },
        { es: 'Que las preguntas o respuestas del examen estaban en los datos de entrenamiento, y la nota mide memoria.', en: 'That the exam’s questions or answers were in the training data, and the score measures memory.' },
        { es: 'Que alguien manipuló los resultados para subir al modelo en el ranking.', en: 'That someone tampered with the results to push the model up the ranking.' },
        { es: 'Que el modelo es demasiado grande para evaluarlo con un examen.', en: 'That the model is too large to evaluate with an exam.' },
      ],
      answer: 1,
      why: { es: 'Es una fuga de datos a escala de internet: lo que se mide es memoria, no capacidad. Los errores en la clave son otro problema, que también se mide, pero aparte. Y suele ser accidental, no manipulación.', en: 'It is data leakage at internet scale: what is measured is memory, not ability. Errors in the key are a different problem, measured separately. And it is often accidental, not tampering.' },
    },
    {
      kind: 'concept',
      q: { es: 'Un juez automático tiende a preferir la respuesta que aparece primero. ¿Qué defensa sencilla propone el estudio de Zheng et al.?', en: 'An automatic judge tends to prefer the answer shown first. What simple defense does the Zheng et al. study propose?' },
      options: [
        { es: 'Usar un juez más pequeño.', en: 'Use a smaller judge.' },
        { es: 'Quitar la rúbrica para que decida con libertad.', en: 'Remove the rubric so it can decide freely.' },
        { es: 'Calificar dos veces invirtiendo el orden y declarar ganadora solo la respuesta preferida en ambos.', en: 'Grade twice with the order swapped and declare a winner only if the same answer is preferred in both.' },
        { es: 'Pedirle que responda más rápido.', en: 'Ask it to answer faster.' },
      ],
      answer: 2,
      why: { es: 'Si el veredicto cambia al invertir el orden, el sesgo de posición decidió, no la calidad: se declara empate. Es un enfoque conservador y barato que evita que la posición decida el resultado.', en: 'If the verdict changes when the order is swapped, position bias decided, not quality: call it a tie. It is a conservative, cheap approach that keeps position from deciding the result.' },
    },
    {
      kind: 'calc',
      q: { es: 'Con 100 casos, la nota de un sistema lleva un margen de unos 8 puntos. ¿Cuántos casos hacen falta, aproximadamente, para bajar el margen a unos 2?', en: 'With 100 cases, a system’s score carries a margin of about 8 points. About how many cases are needed to bring the margin down to about 2?' },
      options: [
        { es: '200', en: '200' },
        { es: '400', en: '400' },
        { es: '800', en: '800' },
        { es: '1600', en: '1,600' },
      ],
      answer: 3,
      why: { es: 'El margen baja con la raíz del número de casos. Para dividirlo entre 4 (de 8 a 2) hay que multiplicar los casos por 16: 100 × 16 = 1600.', en: 'The margin shrinks with the square root of the number of cases. To divide it by 4 (from 8 to 2) you must multiply the cases by 16: 100 × 16 = 1,600.' },
    },
    {
      kind: 'apply',
      q: { es: 'Compruebas dos asistentes con los mismos 150 casos de tu operación: A acierta 81 % y B 79 %, y B cuesta la mitad. ¿Qué haces?', en: 'You test two assistants on the same 150 cases from your operation: A scores 81% and B 79%, and B costs half as much. What do you do?' },
      options: [
        { es: 'Los tratas como equivalentes en calidad: 2 puntos es menos que el margen con 150 casos; decides por costo y riesgo, o amplías la muestra.', en: 'You treat them as equal in quality: 2 points is less than the margin with 150 cases; you decide on cost and risk, or enlarge the sample.' },
        { es: 'Eliges A: 81 es mayor que 79.', en: 'You pick A: 81 is greater than 79.' },
        { es: 'Eliges B sin más análisis porque es más barato.', en: 'You pick B with no further analysis because it is cheaper.' },
        { es: 'Descartas ambos porque ninguno llega a 90 %.', en: 'You reject both because neither reaches 90%.' },
      ],
      answer: 0,
      why: { es: 'Con 150 casos cada nota lleva un margen de unos 6 puntos, y aun comparando caso por caso el intervalo de la diferencia incluye el cero. Con estos datos no se distinguen; si la calidad empata, pesan el costo y el riesgo.', en: 'With 150 cases each score carries a margin of about 6 points, and even comparing case by case the interval of the difference includes zero. These data cannot tell them apart; if quality ties, cost and risk decide.' },
    },
  ],

  glossary: ['hallucination', 'pretraining', 'data-leakage', 'test-set'],

  terms: [
    { id: 'benchmark', term: { es: 'Benchmark', en: 'Benchmark' }, def: { es: 'Examen público y fijo (preguntas, respuestas conocidas y una métrica) para comparar modelos con la misma vara. Sirve como referencia general; no sustituye medir tu caso.', en: 'A public, fixed exam (questions, known answers, and a metric) to compare models with the same yardstick. Useful as a general reference; it does not replace measuring your case.' } },
    { id: 'eval-set', term: { es: 'Conjunto de evaluación (casos de oro)', en: 'Eval set (gold cases)' }, def: { es: 'Conjunto propio de casos reales de tu operación, cada uno con la respuesta o el criterio que tus expertos aceptan. Se usa para comparar sistemas y se repite en cada cambio.', en: 'Your own set of real cases from your operation, each with the answer or criterion your experts accept. It is used to compare systems and is rerun on every change.' } },
    { id: 'contamination', term: { es: 'Contaminación', en: 'Contamination' }, def: { es: 'Cuando las preguntas (o respuestas) de un examen estaban en los datos con que se entrenó el modelo. Infla la nota porque mide memoria, no capacidad.', en: 'When an exam’s questions (or answers) were in the data the model was trained on. It inflates the score because it measures memory, not ability.' } },
    { id: 'llm-as-judge', term: { es: 'LLM como juez', en: 'LLM-as-a-judge' }, def: { es: 'Usar un modelo de lenguaje para calificar las respuestas de otro sistema con una rúbrica. Es barato y escala, pero tiene sesgos (de posición, de longitud) y debe contrastarse con etiquetas humanas.', en: 'Using a language model to grade another system’s answers against a rubric. It is cheap and scales, but it has biases (position, length) and must be checked against human labels.' } },
    { id: 'red-teaming', term: { es: 'Red teaming', en: 'Red teaming' }, def: { es: 'Atacar un sistema a propósito, con personas o con otros modelos, para encontrar fallas en el peor caso: respuestas dañinas, filtraciones, engaños.', en: 'Deliberately attacking a system, with people or with other models, to find worst-case failures: harmful answers, leaks, deception.' } },
    { id: 'confidence-interval', term: { es: 'Intervalo de confianza', en: 'Confidence interval' }, def: { es: 'Rango de valores plausibles para una cantidad medida con una muestra (por ejemplo, la exactitud real de un sistema), normalmente al 95 %. Se estrecha con la raíz del número de casos.', en: 'A range of plausible values for a quantity measured on a sample (for example, a system’s true accuracy), usually at 95%. It narrows with the square root of the number of cases.' } },
  ],

  sources: [
    { title: 'Measuring Massive Multitask Language Understanding', authors: 'Hendrycks, D., Burns, C., Basart, S., Zou, A., Mazeika, M., Song, D., Steinhardt, J.', year: 2020, url: 'https://arxiv.org/abs/2009.03300' },
    { title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena', authors: 'Zheng, L., Chiang, W.-L., Sheng, Y., et al.', year: 2023, url: 'https://arxiv.org/abs/2306.05685' },
    { title: 'A Careful Examination of Large Language Model Performance on Grade School Arithmetic', authors: 'Zhang, H., Da, J., Lee, D., et al.', year: 2024, url: 'https://arxiv.org/abs/2405.00332' },
    { title: 'Are We Done with MMLU?', authors: 'Gema, A. P., Leang, J. O. J., Hong, G., et al.', year: 2024, url: 'https://arxiv.org/abs/2406.04127' },
    { title: 'GPT-4 Technical Report', authors: 'OpenAI', year: 2023, url: 'https://arxiv.org/abs/2303.08774' },
    { title: 'Gemini: A Family of Highly Capable Multimodal Models', authors: 'Gemini Team, Google', year: 2023, url: 'https://arxiv.org/abs/2312.11805' },
    { title: 'Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools', authors: 'Magesh, V., Surani, F., Dahl, M., Suzgun, M., Manning, C. D., Ho, D. E.', year: 2025, url: 'https://doi.org/10.1111/jels.12413' },
    { title: 'Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations', authors: 'Miller, E.', year: 2024, url: 'https://arxiv.org/abs/2411.00640' },
    { title: 'How is ChatGPT’s behavior changing over time?', authors: 'Chen, L., Zaharia, M., Zou, J.', year: 2023, url: 'https://arxiv.org/abs/2307.09009' },
    { title: 'Is GPT-4 getting worse over time?', authors: 'Narayanan, A., Kapoor, S.', year: 2023, url: 'https://www.normaltech.ai/p/is-gpt-4-getting-worse-over-time' },
    { title: 'Red Teaming Language Models to Reduce Harms: Methods, Scaling Behaviors, and Lessons Learned', authors: 'Ganguli, D., Lovitt, L., Kernion, J., et al.', year: 2022, url: 'https://arxiv.org/abs/2209.07858' },
    { title: 'Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference', authors: 'Chiang, W.-L., Zheng, L., Sheng, Y., et al.', year: 2024, url: 'https://arxiv.org/abs/2403.04132' },
    { title: 'Scaling Laws for Reward Model Overoptimization', authors: 'Gao, L., Schulman, J., Hilton, J.', year: 2022, url: 'https://arxiv.org/abs/2210.10760' },
    { title: '«Improving ratings»: audit in the British University system (European Review 5, 305–321)', authors: 'Strathern, M.', year: 1997, url: 'https://doi.org/10.1002/(SICI)1234-981X(199707)5:3<305::AID-EURO184>3.0.CO;2-4' },
    { title: 'Interval Estimation for a Binomial Proportion', authors: 'Brown, L. D., Cai, T. T., DasGupta, A.', year: 2001, url: 'https://doi.org/10.1214/ss/1009213286' },
    { title: 'Don’t Use the CLT in LLM Evals With Fewer Than a Few Hundred Datapoints', authors: 'Bowyer, S., Aitchison, L., Ivanova, D. R.', year: 2025, url: 'https://arxiv.org/abs/2503.01747' },
    { title: 'Quantifying Language Models’ Sensitivity to Spurious Features in Prompt Design', authors: 'Sclar, M., Choi, Y., Tsvetkov, Y., Suhr, A.', year: 2023, url: 'https://arxiv.org/abs/2310.11324' },
    { title: 'Humanity’s Last Exam', authors: 'Phan, L., Gatti, A., Han, Z., et al.', year: 2025, url: 'https://arxiv.org/abs/2501.14249' },
  ],
});
