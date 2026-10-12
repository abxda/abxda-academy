import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'preentrenamiento',

  objectives: {
    es: [
      'Explicar por qué adivinar la siguiente pieza de un texto es aprendizaje autosupervisado y qué es el preentrenamiento.',
      'Describir cómo se limpia un corpus (idioma, calidad, datos personales y duplicados) y calcular qué tanto se parecen dos textos por los trozos de cinco palabras que comparten.',
      'Reconocer, con mediciones reales de Pythia, en qué orden aprende un modelo y por qué un modelo base no es un asistente ni sabe lo que pasó después de su corte de conocimiento.',
    ],
    en: [
      'Explain why guessing the next piece of a text is self-supervised learning, and what pretraining is.',
      'Describe how a corpus is cleaned (language, quality, personal data, and duplicates) and calculate how alike two texts are from the five-word chunks they share.',
      'Recognize, with real measurements of Pythia, the order in which a model learns and why a base model is not an assistant and does not know what happened after its knowledge cutoff.',
    ],
  },

  segments: [
    // ── gancho ──
    {
      id: 'hook',
      es: 'En la lección anterior armamos un transformer, pero sus números empiezan al azar. Hoy lo vemos aprender leyendo una montaña de texto: es el preentrenamiento.',
      en: 'In the last lesson we built a transformer, but its numbers start out random. Today we watch it learn by reading a mountain of text: that is pretraining.',
    },
    // ── el objetivo: tapar la siguiente pieza ──
    {
      id: 'obj-task',
      es: 'La tarea es la de la lección diecinueve: adivinar la siguiente pieza de un texto. Toma esta frase en inglés, ya cortada en tokens como en la lección veinte.',
      en: 'The task is the one from lesson nineteen: guess the next piece of a text. Take this English sentence, already cut into tokens as in lesson twenty.',
      pad: 0.3,
    },
    {
      id: 'obj-hide',
      es: 'Tapamos una pieza, «five», cinco. Todo lo anterior es el contexto, y con él el modelo apuesta qué pieza va en el hueco.',
      en: 'We cover one piece, “five.” Everything before it is the context, and with it the model bets on which piece goes in the gap.',
      tts: {
        es: 'Tapamos una pieza, «faiv», cinco. Todo lo anterior es el contexto, y con él el modelo apuesta qué pieza va en el hueco.',
      },
      pad: 0.3,
    },
    {
      id: 'obj-check',
      es: 'Luego se destapa y se compara con su apuesta. Nadie tuvo que escribir la respuesta correcta: ya venía en el propio texto.',
      en: 'Then it is uncovered and compared with the bet. Nobody had to write down the right answer: it was already in the text itself.',
      pad: 0.3,
    },
    {
      id: 'obj-every',
      es: 'Y se puede tapar cada pieza, una tras otra, mirando solo las anteriores. Esta frase de diecinueve piezas da dieciocho ejercicios.',
      en: 'And every piece can be covered, one after another, looking only at the ones before. This nineteen-piece sentence gives eighteen exercises.',
      pad: 0.6,
    },
    {
      id: 'obj-self',
      es: 'En la lección uno, cada ejemplo traía una respuesta puesta por una persona. Aquí el texto se califica solo: eso es aprendizaje autosupervisado.',
      en: 'In lesson one, every example came with an answer a person had written. Here the text grades itself: that is self-supervised learning.',
      note: { es: 'Autosupervisado: el texto trae su propia respuesta, la pieza siguiente.', en: 'Self-supervised: the text carries its own answer, the next piece.' },
      pad: 0.4,
    },
    {
      id: 'obj-guess0',
      es: 'Veamos a un modelo real, Pythia, antes de entrenar, con sus números al azar. A «five» le da casi cero: queda en el lugar seis mil setecientos setenta y tres.',
      en: 'Let’s look at a real model, Pythia, before training, with its numbers at random. It gives “five” almost nothing: it ranks six thousand seven hundred seventy-third.',
      tts: {
        es: 'Veamos a un modelo real, Pitia, antes de entrenar, con sus números al azar. A «faiv» le da casi cero: queda en el lugar seis mil setecientos setenta y tres.',
      },
      pad: 0.4,
    },
    {
      id: 'obj-guess1',
      es: 'La misma apuesta tras leer trescientos mil millones de tokens: «five» queda cuarta, con doce por ciento. Delante van siete, seis y ocho: todas son horas.',
      en: 'The same bet after reading three hundred billion tokens: “five” comes fourth, at twelve percent. Ahead are seven, six, and eight: all of them are times.',
      tts: {
        es: 'La misma apuesta tras leer trescientos mil millones de tokens: «faiv» queda cuarta, con doce por ciento. Delante van siete, seis y ocho: todas son horas.',
      },
      pad: 0.4,
    },
    {
      id: 'obj-error',
      es: 'Cada apuesta da un error: entre menos probabilidad recibe la pieza correcta, más error. Sin entrenar, diez punto tres; tras entrenar, dos punto uno.',
      en: 'Each bet gives an error: the less probability the right piece gets, the bigger the error. Untrained, ten point three; after training, two point one.',
      pad: 0.3,
    },
    {
      id: 'pretrain-def',
      es: 'Entrenar es repetir esto miles de millones de veces sobre un gran montón de texto, el corpus, ajustando los parámetros para bajar el error. Eso es el preentrenamiento.',
      en: 'Training means repeating this billions of times over a huge pile of text, the corpus, adjusting the parameters to lower the error. That is pretraining.',
      note: { es: 'Preentrenamiento: adivinar la siguiente pieza, una y otra vez, en un corpus enorme.', en: 'Pretraining: guessing the next piece, again and again, over a huge corpus.' },
      pad: 0.4,
    },
    // ── de dónde sale el texto y cómo se limpia ──
    {
      id: 'web',
      es: '¿Cuánto texto? GPT-3 leyó unos trescientos mil millones de tokens. La mayor parte viene de la web: Common Crawl, una organización sin fines de lucro, guarda miles de millones de páginas cada mes.',
      en: 'How much text? GPT-3 read about three hundred billion tokens. Most of it comes from the web: Common Crawl, a nonprofit, saves billions of pages every month.',
      tts: {
        es: '¿Cuánto texto? Ge pe te tres leyó unos trescientos mil millones de tokens. La mayor parte viene de la web: Cómon Crol, una organización sin fines de lucro, guarda miles de millones de páginas cada mes.',
        en: 'How much text? G P T three read about three hundred billion tokens. Most of it comes from the web: Common Crawl, a nonprofit, saves billions of pages every month.',
      },
      pad: 0.4,
    },
    {
      id: 'pipe-intro',
      es: 'Pero la web cruda trae de todo, y hay que limpiarla. Veámoslo en pequeño: doce páginas que escribimos como si vinieran de la web, y una limpieza que corre de verdad.',
      en: 'But the raw web contains everything, and it has to be cleaned. Let’s see it small: twelve pages we wrote as if they came from the web, and a cleanup that really runs.',
      pad: 0.4,
    },
    {
      id: 'pipe-lang',
      es: 'Primer paso, el idioma: un programa cuenta palabras muy comunes de cada lengua. Aquí nos quedamos con español e inglés, así que sale la página en francés.',
      en: 'Step one, language: a program counts very common words from each language. Here we keep Spanish and English, so the page in French is out.',
      pad: 0.3,
    },
    {
      id: 'pipe-quality',
      es: 'Segundo, la calidad, con reglas simples: sale el menú de una tienda, que no tiene frases completas; el spam, que repite líneas, y el texto de relleno.',
      en: 'Step two, quality, with simple rules: out goes a store’s menu, which has no full sentences; the spam, which repeats lines; and the filler text.',
      pad: 0.4,
    },
    {
      id: 'pipe-pii',
      es: 'Tercero, los datos personales: los correos y las direcciones de internet se tapan. Es una protección parcial: no todo dato personal es tan fácil de reconocer.',
      en: 'Step three, personal data: email and internet addresses are masked. It is partial protection: not all personal data is that easy to spot.',
      pad: 0.3,
    },
    {
      id: 'pipe-dup',
      es: 'Cuarto, los duplicados. Quedan ocho páginas, pero tres repiten a otras: una noticia con otro título, la misma noticia editada y una receta con otro pie.',
      en: 'Step four, duplicates. Eight pages are left, but three repeat others: a news story under another headline, the same story edited, and a recipe with a new footer.',
      note: { es: 'Limpiar el corpus: idioma, calidad, datos personales y duplicados.', en: 'Cleaning the corpus: language, quality, personal data, and duplicates.' },
      pad: 0.4,
    },
    {
      id: 'near-def',
      es: 'Una copia exacta es fácil de encontrar. Pero la noticia editada cambia algunas palabras: dos mil árboles se vuelven tres mil. Es un duplicado casi idéntico.',
      en: 'An exact copy is easy to find. But the edited story changes a few words: two thousand trees become three thousand. It is a near-duplicate.',
      pad: 0.4,
    },
    {
      id: 'near-chunks',
      es: 'Para medir el parecido, cada texto se corta en trozos de cinco palabras seguidas. Esta frase de ocho palabras da cuatro trozos.',
      en: 'To measure how alike they are, each text is cut into chunks of five words in a row. This eight-word sentence gives four chunks.',
      pad: 0.5,
    },
    {
      id: 'near-share',
      es: 'Ahora la otra versión. Entre las dos frases hay seis trozos distintos, y dos están en ambas: se parecen un treinta y tres por ciento.',
      en: 'Now the other version. Between the two sentences there are six different chunks, and two appear in both: they are thirty-three percent alike.',
      pad: 0.5,
    },
    {
      id: 'near-ruler',
      es: 'Con las páginas enteras: la receta con otro pie se parece un noventa y dos por ciento; la noticia con otro título, ochenta y cuatro; la editada, cincuenta y tres.',
      en: 'With the whole pages: the recipe with a new footer is ninety-two percent alike; the story under another headline, eighty-four; the edited one, fifty-three.',
      pad: 0.4,
    },
    {
      id: 'thr-demo',
      es: 'Se fija un umbral: si una página se parece a otra al menos eso, sale. Mira cómo, al bajar el umbral, van saliendo las copias.',
      en: 'A threshold is set: if a page is at least that similar to another, it is out. Watch how, as the threshold drops, the copies go out.',
      pad: 0.8,
    },
    {
      id: 'thr-low',
      es: 'Pero si baja demasiado, sale también la receta reescrita, que dice lo mismo con otras palabras: ya no es una copia. El umbral es una decisión.',
      en: 'But if it drops too far, the rewritten recipe goes too, and it says the same thing in other words: it is no longer a copy. The threshold is a choice.',
      note: { es: 'Umbral de duplicados: muy alto deja pasar copias; muy bajo tira textos distintos.', en: 'Duplicate threshold: too high lets copies through; too low throws out different texts.' },
      pad: 0.6,
    },
    {
      id: 'thr-try',
      es: 'Si quieres, mueve tú el umbral. Como referencia, los autores de Pythia usaron ochenta y siete por ciento para una versión de sus datos sin duplicados.',
      en: 'If you like, move the threshold yourself. For reference, Pythia’s authors used eighty-seven percent for a duplicate-free version of their data.',
      tts: {
        es: 'Si quieres, mueve tú el umbral. Como referencia, los autores de Pitia usaron ochenta y siete por ciento para una versión de sus datos sin duplicados.',
      },
      gate: {
        id: 'dedup',
        prompt: { es: 'mueve el umbral y mira qué páginas salen.', en: 'move the threshold and see which pages go out.' },
      },
      pad: 0.4,
    },
    {
      id: 'recite',
      es: '¿Por qué quitar copias? Lo que se repite mucho se memoriza. La licencia MIT acompaña a muchísimos programas, y Pythia la recita palabra por palabra.',
      en: 'Why remove copies? What repeats a lot gets memorized. The MIT license comes with countless programs, and Pythia recites it word for word.',
      tts: {
        es: '¿Por qué quitar copias? Lo que se repite mucho se memoriza. La licencia eme i te acompaña a muchísimos programas, y Pitia la recita palabra por palabra.',
        en: 'Why remove copies? What repeats a lot gets memorized. The M I T license comes with countless programs, and Pythia recites it word for word.',
      },
      pad: 0.8,
    },
    {
      id: 'quality',
      es: 'Además, no todo texto vale igual. GPT-3 leyó casi tres veces y media su Wikipedia, y su copia filtrada de la web, menos de media vez: repasó más lo que juzgó mejor.',
      en: 'Also, not all text is worth the same. GPT-3 read its Wikipedia almost three and a half times, and its filtered web copy less than half a time: it went over the better text more.',
      tts: {
        es: 'Además, no todo texto vale igual. Ge pe te tres leyó casi tres veces y media su Wikipedia, y su copia filtrada de la web, menos de media vez: repasó más lo que juzgó mejor.',
        en: 'Also, not all text is worth the same. G P T three read its Wikipedia almost three and a half times, and its filtered web copy less than half a time: it went over the better text more.',
      },
      note: { es: 'Calidad antes que cantidad: el texto mejor se repasa más.', en: 'Quality over quantity: better text gets reviewed more.' },
      pad: 0.4,
    },
    // ── qué aprende y en qué orden (Pythia) ──
    {
      id: 'learn-intro',
      es: '¿Qué aprende al leer tanto, y en qué orden? Los autores de Pythia guardaron copias del modelo durante su entrenamiento: puntos de control. Medimos veinticinco.',
      en: 'What does it learn from reading so much, and in what order? Pythia’s authors saved copies of the model during its training: checkpoints. We measured twenty-five.',
      tts: {
        es: '¿Qué aprende al leer tanto, y en qué orden? Los autores de Pitia guardaron copias del modelo durante su entrenamiento: puntos de control. Medimos veinticinco.',
      },
      pad: 0.4,
    },
    {
      id: 'learn-x',
      es: 'El eje horizontal es cuánto texto llevaba leído. Crece de diez en diez: cada marca es diez veces más texto que la anterior.',
      en: 'The horizontal axis is how much text it had read. It grows by tens: each mark is ten times more text than the one before.',
      pad: 0.4,
    },
    {
      id: 'learn-y',
      es: 'El vertical es su error promedio al adivinar cada pieza de un texto que escribimos para esta lección, así que no pudo haberlo leído. Más abajo es mejor.',
      en: 'The vertical axis is its average error guessing each piece of a text we wrote for this lesson, so it could not have read it. Lower is better.',
      pad: 0.3,
    },
    {
      id: 'learn-curve',
      es: 'Así baja: empieza en once, casi lo mismo que adivinar al azar entre cincuenta mil piezas, y termina en dos punto cinco.',
      en: 'This is how it drops: it starts at eleven, about the same as guessing at random among fifty thousand pieces, and ends at two point five.',
      pad: 0.6,
    },
    {
      id: 'learn-noise',
      es: 'Ahora leamos lo que escribe en cada punto. Le damos el inicio de una frase: «el anciano caminaba despacio por la…». Al principio, solo ruido.',
      en: 'Now let’s read what it writes at each point. We give it the start of a sentence: “The old man walked slowly down the…” At first, just noise.',
      pad: 0.4,
    },
    {
      id: 'learn-freq',
      es: 'Tras unos treinta y cuatro millones de tokens, repite lo más frecuente: comas y «and», que es «y». Todavía no arma frases.',
      en: 'After about thirty-four million tokens, it repeats the most frequent things: commas and “and.” It cannot build sentences yet.',
      pad: 0.5,
    },
    {
      id: 'learn-grammar',
      es: 'Con unos dos mil millones ya escribe frases correctas: «calle. Lo siento, dijo él». La gramática llega pronto.',
      en: 'With about two billion it already writes correct sentences: “street. I’m sorry, he said.” Grammar comes early.',
      note: { es: 'Primero llega la forma: las piezas frecuentes y la gramática.', en: 'Form comes first: frequent pieces and grammar.' },
      pad: 0.5,
    },
    {
      id: 'learn-fact',
      es: 'Los hechos tardan más. A «la capital de Francia es» responde con frases bien hechas pero falsas: con unos trece mil millones, Lyon; con diecisiete mil millones, Burdeos.',
      en: 'Facts take longer. To “The capital of France is” it answers with well-formed but false sentences: at about thirteen billion, Lyon; at seventeen billion, Bordeaux.',
      tts: {
        es: 'Los hechos tardan más. A «la capital de Francia es» responde con frases bien hechas pero falsas: con unos trece mil millones, Lión; con diecisiete mil millones, Burdeos.',
      },
      pad: 0.6,
    },
    {
      id: 'learn-paris',
      es: 'Dice París a partir de unos treinta y cuatro mil millones. Y la probabilidad que le da sube, con altibajos: de treinta por ciento a sesenta y uno al final.',
      en: 'It says Paris from about thirty-four billion on. And the probability it gives it rises, with ups and downs: from thirty percent to sixty-one by the end.',
      pad: 0.6,
    },
    {
      id: 'learn-pattern',
      es: 'Los patrones también tardan. A «cat igual a gato, dog igual a perro, house igual a…» responde «casa» desde ahí, y su probabilidad sube de quince a ochenta y dos por ciento.',
      en: 'Patterns take long too. To “cat equals gato, dog equals perro, house equals…” it answers “casa” from there on, and its probability rises from fifteen to eighty-two percent.',
      tts: {
        es: 'Los patrones también tardan. A «kat igual a gato, dog igual a perro, jáus igual a…» responde «casa» desde ahí, y su probabilidad sube de quince a ochenta y dos por ciento.',
      },
      note: { es: 'Los hechos y los patrones llegan mucho después que la gramática.', en: 'Facts and patterns arrive long after grammar.' },
      pad: 0.6,
    },
    {
      id: 'learn-try',
      es: 'Si quieres, recorre tú el entrenamiento con el deslizador y lee lo que escribe en cada punto.',
      en: 'If you like, travel through the training yourself with the slider and read what it writes at each point.',
      gate: {
        id: 'scrub',
        prompt: { es: 'mueve el deslizador y lee lo que escribe.', en: 'move the slider and read what it writes.' },
      },
      pad: 0.4,
    },
    {
      id: 'lang-gap',
      es: 'Y lo que casi no está en el corpus, casi no se aprende. Pythia leyó sobre todo inglés: a «la capital de Francia es», en español, nunca contesta París.',
      en: 'And what is barely in the corpus is barely learned. Pythia read mostly English: to the Spanish “La capital de Francia es,” it never answers París.',
      tts: {
        es: 'Y lo que casi no está en el corpus, casi no se aprende. Pitia leyó sobre todo inglés: a «la capital de Francia es», en español, nunca contesta París.',
      },
      pad: 0.4,
    },
    // ── derechos, consentimiento y privacidad ──
    {
      id: 'rights-pile',
      es: '¿Y de quién es ese texto? El corpus de Pythia, The Pile, incluye Books3: libros de un sitio de descargas, sin el consentimiento de sus autores, como anota el propio artículo.',
      en: 'And whose text is it? Pythia’s corpus, The Pile, includes Books3: books from a download site, without their authors’ consent, as its own paper notes.',
      tts: {
        es: '¿Y de quién es ese texto? El corpus de Pitia, De Pail, incluye Buks tri: libros de un sitio de descargas, sin el consentimiento de sus autores, como anota el propio artículo.',
        en: 'And whose text is it? Pythia’s corpus, The Pile, includes Books three: books from a download site, without their authors’ consent, as its own paper notes.',
      },
      pad: 0.4,
    },
    {
      id: 'rights-case',
      es: 'En dos mil veinticinco, un juez de Estados Unidos revisó la demanda de unos escritores contra Anthropic: usar sus libros para entrenar fue uso legítimo; guardar copias piratas, no.',
      en: 'In twenty twenty-five, a U.S. judge reviewed a lawsuit by writers against Anthropic: using their books for training was fair use; keeping pirated copies was not.',
      pad: 0.4,
    },
    {
      id: 'rights-settle',
      es: 'En dos mil veintiséis se aprobó un acuerdo: Anthropic pagará mil quinientos millones de dólares, unos tres mil por libro. Es un caso, en un país: el debate sigue.',
      en: 'In twenty twenty-six a settlement was approved: Anthropic will pay one and a half billion dollars, about three thousand per book. It is one case, in one country: the debate goes on.',
      pad: 0.4,
    },
    {
      id: 'privacy',
      es: 'Y la privacidad: en dos mil veintiuno, un equipo sacó de GPT-2 mil ochocientos textos sospechosos. Seiscientos cuatro eran copias de lo que leyó, y había nombres y teléfonos reales.',
      en: 'And privacy: in twenty twenty-one, a team pulled eighteen hundred suspicious texts out of GPT-2. Six hundred four were copies of what it read, including real names and phone numbers.',
      tts: {
        es: 'Y la privacidad: en dos mil veintiuno, un equipo sacó de ge pe te dos mil ochocientos textos sospechosos. Seiscientos cuatro eran copias de lo que leyó, y había nombres y teléfonos reales.',
        en: 'And privacy: in twenty twenty-one, a team pulled eighteen hundred suspicious texts out of G P T two. Six hundred four were copies of what it read, including real names and phone numbers.',
      },
      pad: 0.8,
    },
    // ── el modelo base y el corte de conocimiento ──
    {
      id: 'base-def',
      es: 'Al terminar el preentrenamiento queda un modelo base: sabe continuar textos. Pero todavía no es un asistente como los chatbots que conoces.',
      en: 'When pretraining ends, what is left is a base model: it knows how to continue texts. But it is not yet an assistant like the chatbots you know.',
      note: { es: 'Modelo base: continúa textos; todavía no es un asistente.', en: 'Base model: it continues texts; it is not an assistant yet.' },
      pad: 0.3,
    },
    {
      id: 'base-q',
      es: 'Mira. Le escribimos a Pythia «¿Cuál es la capital de Francia?», en inglés. No contesta como asistente: sigue el texto como en una página de preguntas, y se repite.',
      en: 'Look. We write to Pythia, “What is the capital of France?” It does not answer like an assistant: it continues the text like a page of questions, and repeats itself.',
      tts: {
        es: 'Mira. Le escribimos a Pitia «¿Cuál es la capital de Francia?», en inglés. No contesta como asistente: sigue el texto como en una página de preguntas, y se repite.',
      },
      pad: 0.5,
    },
    {
      id: 'base-poem',
      es: 'Le pedimos «escribe un poema corto sobre el mar». No obedece: escribe «I am a sea-sick», soy un mareado, una y otra vez.',
      en: 'We ask it, “Write a short poem about the sea.” It does not obey: it writes “I am a sea-sick,” a seasick one, over and over.',
      tts: {
        es: 'Le pedimos «escribe un poema corto sobre el mar». No obedece: escribe «ai am a si sik», soy un mareado, una y otra vez.',
      },
      pad: 0.5,
    },
    {
      id: 'base-faq',
      es: 'En cambio, si le das la forma de un documento, una lista de preguntas frecuentes, la completa bien: Roma. Y sigue, inventando preguntas nuevas.',
      en: 'But if you give it the shape of a document, a list of frequently asked questions, it completes it well: Rome. And it keeps going, inventing new questions.',
      pad: 0.5,
    },
    {
      id: 'base-try',
      es: 'Si quieres, elige otra indicación y lee cómo la continúa. Convertirlo en asistente es otra etapa: la veremos en las lecciones veintisiete y veintiocho.',
      en: 'If you like, pick another prompt and read how it continues. Turning it into an assistant is another stage: we will see it in lessons twenty-seven and twenty-eight.',
      gate: {
        id: 'base',
        prompt: { es: 'elige otra indicación y lee cómo la continúa.', en: 'pick another prompt and read how it continues.' },
      },
      pad: 0.4,
    },
    {
      id: 'cutoff',
      es: 'Otra consecuencia: solo sabe lo que había en sus datos. The Pile se publicó a fines de dos mil veinte; esa frontera se llama corte de conocimiento.',
      en: 'Another consequence: it only knows what was in its data. The Pile came out at the end of twenty twenty; that boundary is called the knowledge cutoff.',
      tts: {
        es: 'Otra consecuencia: solo sabe lo que había en sus datos. De Pail se publicó a fines de dos mil veinte; esa frontera se llama corte de conocimiento.',
      },
      pad: 0.4,
    },
    {
      id: 'cutoff-demo',
      es: 'Le pedimos completar «el Mundial de dos mil veintidós lo ganó…» y escribe «Estados Unidos, que venció a Qatar». Ganó Argentina: lo que no vio, lo inventa con aplomo.',
      en: 'We ask it to finish “The 2022 FIFA World Cup was won by…” and it writes “the United States, who defeated Qatar.” Argentina won: what it never saw, it makes up with confidence.',
      tts: {
        en: 'We ask it to finish “The twenty twenty-two FIFA World Cup was won by…” and it writes “the United States, who defeated Qatar.” Argentina won: what it never saw, it makes up with confidence.',
      },
      pad: 0.5,
    },
    // ── cierre ──
    {
      id: 'recap',
      es: 'En resumen: tapar la siguiente pieza y adivinarla, con texto limpio y sin copias. Primero llega la gramática; después, hechos y patrones. El resultado es un modelo base.',
      en: 'In short: cover the next piece and guess it, over clean text without copies. Grammar comes first; facts and patterns come later. The result is a base model.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Pythia, con mil cuatrocientos millones de parámetros, leyó unos trescientos mil millones de tokens. ¿Cuánto cuesta algo así, y qué se gana al hacerlo más grande?',
      en: 'Pythia, with one point four billion parameters, read about three hundred billion tokens. What does something like that cost, and what do you gain by making it bigger?',
      tts: {
        es: 'Pitia, con mil cuatrocientos millones de parámetros, leyó unos trescientos mil millones de tokens. ¿Cuánto cuesta algo así, y qué se gana al hacerlo más grande?',
      },
    },
  ],

  keyIdeas: {
    es: [
      'El preentrenamiento repite un solo ejercicio: tapar la siguiente pieza de un texto y adivinarla. Como la respuesta ya está en el texto, no hacen falta etiquetas puestas por personas: es aprendizaje autosupervisado, y por eso puede usar cientos de miles de millones de tokens (GPT-3 leyó unos trescientos mil millones).',
      'El texto se limpia antes: idioma, reglas de calidad, datos personales tapados y duplicados fuera. Un duplicado casi idéntico se detecta midiendo qué parte de los trozos de cinco palabras comparten dos textos; el umbral es una decisión (los autores de Pythia usaron 87 %).',
      'Calidad antes que cantidad: GPT-3 repasó casi tres veces y media su Wikipedia y menos de media vez su web filtrada. Y lo que casi no está en el corpus casi no se aprende: Pythia, entrenado sobre todo con inglés, nunca contesta «París» en español.',
      'En Pythia, medido en 25 puntos de control: con unos 34 millones de tokens repite lo más frecuente; con unos 2 000 millones ya escribe frases correctas; los hechos («París») y los patrones («casa») llegan hacia los 34 000 millones y siguen afinándose hasta el final.',
      'El resultado es un modelo base: continúa textos, no obedece; no sabe nada posterior a su corte de conocimiento y lo inventa con aplomo. Lo que entra al corpus puede salir (memorización y privacidad), y de dónde viene el texto es una cuestión legal y ética abierta.',
    ],
    en: [
      'Pretraining repeats a single exercise: cover the next piece of a text and guess it. Since the answer is already in the text, no human labels are needed: it is self-supervised learning, which is why it can use hundreds of billions of tokens (GPT-3 read about three hundred billion).',
      'The text is cleaned first: language, quality rules, personal data masked, and duplicates removed. A near-duplicate is detected by measuring what share of five-word chunks two texts have in common; the threshold is a choice (Pythia’s authors used 87%).',
      'Quality over quantity: GPT-3 went over its Wikipedia almost three and a half times and its filtered web less than half a time. And what is barely in the corpus is barely learned: Pythia, trained mostly on English, never answers “París” in Spanish.',
      'In Pythia, measured at 25 checkpoints: at about 34 million tokens it repeats the most frequent pieces; at about 2 billion it already writes correct sentences; facts (“Paris”) and patterns (“casa”) arrive around 34 billion and keep sharpening until the end.',
      'The result is a base model: it continues texts, it does not obey; it knows nothing after its knowledge cutoff and makes things up with confidence. What goes into the corpus can come out (memorization and privacy), and where the text comes from is an open legal and ethical question.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un modelo preentrenado guarda internet como una base de datos y busca ahí las respuestas.',
      en: 'A pretrained model stores the internet like a database and looks up answers in it.',
    },
    right: {
      es: 'No guarda los documentos: ajusta sus parámetros para adivinar mejor la siguiente pieza. Retiene patrones y datos frecuentes, y a veces textos muy repetidos palabra por palabra (por eso importan los duplicados y la privacidad), pero no puede consultar lo que leyó, puede equivocarse con seguridad y no sabe nada posterior a su corte de conocimiento.',
      en: 'It does not store the documents: it adjusts its parameters to better guess the next piece. It retains patterns and frequent facts, and sometimes heavily repeated texts word for word (which is why duplicates and privacy matter), but it cannot look up what it read, it can be confidently wrong, and it knows nothing after its knowledge cutoff.',
    },
  },

  deeper: {
    es: `## El objetivo, en una fórmula

Para un texto de $T$ piezas $x_1,\\dots,x_T$, el modelo con parámetros $\\theta$ da, en cada lugar, una probabilidad a la pieza que de verdad sigue. El error de una apuesta es $-\\ln p$, y el preentrenamiento minimiza su promedio, la **entropía cruzada**:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T-1}\\sum_{t=2}^{T} \\ln p_\\theta(x_t \\mid x_1,\\dots,x_{t-1})$$

Con la máscara causal de la lección 22, las $T-1$ predicciones de un texto se calculan en un solo pase. Si la pieza correcta recibe $p=1$, el error es $0$; si recibe $p\\to 0$, crece sin límite. Adivinar al azar entre las $V = 50\\,254$ piezas del tokenizador de Pythia da $\\ln V \\approx 10.82$ (nats por pieza). Las cifras de la escena: «five» sin entrenar recibe $p = 3.28\\cdot10^{-5}$, error $10.33$; tras entrenar, $p = 0.1175$, error $2.14$.

## Cómo medimos a Pythia

Pythia (Biderman et al., 2023) es una familia de 16 modelos abiertos entrenados con los mismos datos, en el mismo orden, con 154 puntos de control públicos por modelo: el paso 0, los pasos 1, 2, 4, …, 512 y cada 1 000 pasos hasta el 143 000. Cada paso usa 1 024 secuencias de 2 048 tokens ($2\\,097\\,152$ tokens), así que el total es $299\\,892\\,736\\,000 \\approx 300$ mil millones. Usamos el de 1 400 millones de parámetros (1 414 647 808 en total), entrenado con The Pile **sin** quitar duplicados, en 25 de sus puntos de control. El script \`build-pythia.py\` (junto a esta lección) carga cada uno, mide y escribe \`pythia-data.ts\`; nada se retoca a mano. Todo es determinista: decodificación voraz, sin sorteo.

El «error promedio» de la curva es $\\mathcal{L}$ sobre un texto de 500 tokens en inglés escrito para esta lección en 2026 (The Pile es de 2020: no pudo leerlo). Es poco texto: sirve para ver la forma de la curva, no para comparar modelos. Desglosado por tipo de pieza, se ve que la forma llega antes que el contenido:

| Paso (tokens leídos) | Puntuación | Palabras frecuentes | Otras palabras | Nombres y mayúsculas | Promedio |
|---|---|---|---|---|---|
| 0 (0) | 11.40 | 10.86 | 11.02 | 11.32 | 11.01 |
| 16 (34 M) | 2.94 | 7.34 | 11.09 | 11.32 | 8.65 |
| 128 (268 M) | 2.40 | 4.40 | 9.70 | 10.42 | 6.77 |
| 1 000 (2 100 M) | 1.46 | 2.82 | 5.94 | 7.64 | 4.21 |
| 16 000 (33 500 M) | 0.94 | 2.00 | 3.84 | 6.33 | 2.82 |
| 143 000 (300 000 M) | 0.80 | 1.84 | 3.39 | 6.14 | 2.52 |

La puntuación baja de 11.4 a 2.9 en los primeros 34 millones de tokens; los nombres propios siguen cerca de 10 con 500 millones y, al final, son lo más difícil (6.1). Las respuestas: «Paris» aparece por primera vez en el paso 16 000 (antes dice «the capital of France», «the city of Lyon», «Bordeaux»), con $p$ de 0.30 que llega a 0.61; «casa» en el mismo paso, con $p$ de 0.15 que llega a 0.82. En cambio, contar («1, 2, 3, 4, 5,» → «6») ya sale en el paso 1 000: algunos patrones sencillos llegan pronto. En español, «París» nunca es la pieza más probable: al final recibe $p = 6.7\\cdot10^{-5}$. Para comparar idiomas sin depender del tokenizador se usan bits por byte: al final, 0.78 en inglés y 0.99 en el mismo texto traducido al español.

## Duplicados casi idénticos

Cada documento se vuelve el conjunto $A$ de sus trozos de 5 palabras seguidas (en inglés, *shingles*). El parecido de dos documentos es el índice de Jaccard:

$$J(A,B) = \\frac{|A\\cap B|}{|A\\cup B|}$$

En la frase de la escena, $|A\\cup B| = 6$ y $|A\\cap B| = 2$: $J = 0.33$. Comparar todos contra todos es imposible con miles de millones de páginas; por eso se usa **MinHash** (Broder, 1997): con una función de *hash* $h$, la probabilidad de que el trozo con menor $h$ coincida en $A$ y en $B$ es exactamente $J(A,B)$. Con muchos *hashes* agrupados en cubetas, los documentos que coinciden en una cubeta entera se marcan como duplicados. FineWeb (Penedo et al., 2024) usa 5-gramas, 112 *hashes* en 14 cubetas de 8, apuntando a documentos parecidos en al menos 75 %; Pythia tiene una versión entrenada con The Pile sin duplicados, umbral 0.87, que bajó de unos 300 000 a 207 000 millones de tokens; GPT-3 redujo así cada conjunto un 10 %, en promedio. Lee et al. (2022) encontraron en C4 una frase de 61 palabras repetida más de 60 000 veces, y con datos sin duplicados sus modelos repitieron de memoria texto del entrenamiento diez veces menos.

## Filtros de calidad y mezcla

La tubería de la escena (\`crawl.ts\`) aplica de verdad tres reglas de FineWeb: se descarta una página si a lo más el 12 % de sus líneas termina en puntuación, si al menos el 10 % de sus caracteres está en líneas repetidas, o si al menos el 67 % de sus líneas mide menos de 30 caracteres; y dos de C4 (Raffel et al., 2020): «lorem ipsum» y llaves \`{\`. Los correos y las direcciones IP se enmascaran, como en la versión pública de FineWeb. GPT-3 filtró Common Crawl con un clasificador que premiaba lo parecido a textos de referencia de calidad: de 45 TB comprimidos quedaron 570 GB. La mezcla no es proporcional al tamaño: Wikipedia (3 mil millones de tokens) pesa 3 % y se lee 3.4 veces; Common Crawl filtrado (410 mil millones) pesa 60 % y se lee 0.44 veces. FineWeb-Edu, 1.3 billones de tokens elegidos por valor educativo, iguala en MMLU a otro conjunto web con casi 10 veces menos tokens.

## En código

\`\`\`python
import math

def shingles(texto, k=5):
    w = texto.lower().split()
    return {' '.join(w[i:i + k]) for i in range(len(w) - k + 1)}

def jaccard(a, b):
    return len(a & b) / len(a | b)

A = shingles('plantarán dos mil árboles nuevos junto al río')
B = shingles('plantarán tres mil árboles nuevos junto al río')
print(len(A), len(A | B), len(A & B), round(jaccard(A, B), 2))

# error de una apuesta: −ln p de la pieza correcta
for p in (3.279e-05, 0.1175):
    print(round(-math.log(p), 2))
print(round(math.log(50254), 2))   # adivinar al azar entre 50 254 piezas
# 4 6 2 0.33
# 10.33
# 2.14
# 10.82
\`\`\`

## Derechos, consentimiento y privacidad

The Pile (Gao et al., 2020) marca en su tabla 5 qué componentes tienen consentimiento de los autores; Books3 (libros de una copia del sitio privado Bibliotik) no lo tiene. En *Bartz v. Anthropic* (Distrito Norte de California), la orden del 23 de junio de 2025 consideró uso legítimo (*fair use*) usar los libros para entrenar y digitalizar libros comprados, pero no descargar copias piratas para una biblioteca permanente; el acuerdo de 1 500 millones de dólares, unos 3 000 por obra para unas 482 000 obras, se aprobó el 20 de julio de 2026. Es una decisión de un tribunal de un país; otras demandas siguen en curso y otras jurisdicciones tienen reglas distintas. El consentimiento también se mueve: Longpre et al. (2024) estiman que, en un solo año (de abril de 2023 a abril de 2024), una cuarta parte o más de los tokens de los sitios más importantes de C4 quedaron restringidos para los rastreadores de IA en su \`robots.txt\`. Carlini et al. (2021) extrajeron de GPT-2 604 textos memorizados de 1 800 candidatos; entre ellos había nombres, teléfonos y correos, algunos presentes en un solo documento del entrenamiento.

## Lo que viene

Pythia leyó 300 mil millones de tokens con 1 400 millones de parámetros. La lección 24 muestra cómo baja el error al crecer los parámetros, los datos y el cómputo, y cuánto cuesta. Cómo se convierte un modelo base en asistente es tema de las lecciones 27 y 28.`,

    en: `## The objective, in one formula

For a text of $T$ pieces $x_1,\\dots,x_T$, the model with parameters $\\theta$ gives, at each place, a probability to the piece that really comes next. The error of a bet is $-\\ln p$, and pretraining minimizes its average, the **cross-entropy**:

$$\\mathcal{L}(\\theta) = -\\frac{1}{T-1}\\sum_{t=2}^{T} \\ln p_\\theta(x_t \\mid x_1,\\dots,x_{t-1})$$

With the causal mask from lesson 22, all $T-1$ predictions of a text are computed in one pass. If the right piece gets $p=1$, the error is $0$; as $p\\to 0$, it grows without limit. Guessing at random among the $V = 50{,}254$ pieces of Pythia’s tokenizer gives $\\ln V \\approx 10.82$ (nats per piece). The scene’s numbers: untrained, “five” gets $p = 3.28\\cdot10^{-5}$, error $10.33$; after training, $p = 0.1175$, error $2.14$.

## How we measured Pythia

Pythia (Biderman et al., 2023) is a family of 16 open models trained on the same data, in the same order, with 154 public checkpoints per model: step 0, steps 1, 2, 4, …, 512, and every 1,000 steps up to 143,000. Each step uses 1,024 sequences of 2,048 tokens ($2{,}097{,}152$ tokens), so the total is $299{,}892{,}736{,}000 \\approx 300$ billion. We used the 1.4-billion-parameter model (1,414,647,808 in total), trained on The Pile **without** deduplication, at 25 of its checkpoints. The script \`build-pythia.py\` (next to this lesson) loads each one, measures, and writes \`pythia-data.ts\`; nothing is edited by hand. Everything is deterministic: greedy decoding, no sampling.

The curve’s “average error” is $\\mathcal{L}$ on a 500-token English text written for this lesson in 2026 (The Pile is from 2020: it could not have read it). It is little text: good for seeing the shape of the curve, not for comparing models. Broken down by kind of piece, form clearly arrives before content:

| Step (tokens read) | Punctuation | Frequent words | Other words | Names and capitals | Average |
|---|---|---|---|---|---|
| 0 (0) | 11.40 | 10.86 | 11.02 | 11.32 | 11.01 |
| 16 (34M) | 2.94 | 7.34 | 11.09 | 11.32 | 8.65 |
| 128 (268M) | 2.40 | 4.40 | 9.70 | 10.42 | 6.77 |
| 1,000 (2.1B) | 1.46 | 2.82 | 5.94 | 7.64 | 4.21 |
| 16,000 (33.5B) | 0.94 | 2.00 | 3.84 | 6.33 | 2.82 |
| 143,000 (300B) | 0.80 | 1.84 | 3.39 | 6.14 | 2.52 |

Punctuation drops from 11.4 to 2.9 within the first 34 million tokens; proper names are still near 10 at 500 million and, at the end, remain the hardest (6.1). The answers: “Paris” first appears at step 16,000 (before that it says “the capital of France,” “the city of Lyon,” “Bordeaux”), with $p$ going from 0.30 to 0.61; “casa” at the same step, with $p$ going from 0.15 to 0.82. Counting (“1, 2, 3, 4, 5,” → “6”), on the other hand, already works at step 1,000: some simple patterns come early. In Spanish, “París” is never the most likely piece: at the end it gets $p = 6.7\\cdot10^{-5}$. To compare languages regardless of the tokenizer one uses bits per byte: at the end, 0.78 in English and 0.99 on the same text translated into Spanish.

## Near-duplicates

Each document becomes the set $A$ of its chunks of 5 words in a row (*shingles*). The similarity of two documents is the Jaccard index:

$$J(A,B) = \\frac{|A\\cap B|}{|A\\cup B|}$$

In the scene’s sentence, $|A\\cup B| = 6$ and $|A\\cap B| = 2$: $J = 0.33$. Comparing everything with everything is impossible with billions of pages, so **MinHash** is used (Broder, 1997): with a hash function $h$, the probability that the chunk with the lowest $h$ is the same in $A$ and in $B$ is exactly $J(A,B)$. With many hashes grouped into buckets, documents that match on a whole bucket are flagged as duplicates. FineWeb (Penedo et al., 2024) uses 5-grams and 112 hashes in 14 buckets of 8, targeting documents at least 75% similar; Pythia has a version trained on a deduplicated Pile, threshold 0.87, which went from about 300 to 207 billion tokens; GPT-3 shrank each dataset by 10% on average this way. Lee et al. (2022) found in C4 a 61-word sentence repeated more than 60,000 times, and with deduplicated data their models emitted memorized training text ten times less often.

## Quality filters and the mix

The scene’s pipeline (\`crawl.ts\`) really applies three FineWeb rules: a page is dropped if at most 12% of its lines end in punctuation, if at least 10% of its characters are in repeated lines, or if at least 67% of its lines are shorter than 30 characters; and two from C4 (Raffel et al., 2020): “lorem ipsum” and curly brackets \`{\`. Emails and IP addresses are masked, as in the public release of FineWeb. GPT-3 filtered Common Crawl with a classifier that rewarded resemblance to high-quality reference texts: 45 TB compressed became 570 GB. The mix is not proportional to size: Wikipedia (3 billion tokens) weighs 3% and is read 3.4 times; filtered Common Crawl (410 billion) weighs 60% and is read 0.44 times. FineWeb-Edu, 1.3 trillion tokens selected for educational value, matches another web dataset on MMLU with almost 10 times fewer tokens.

## In code

\`\`\`python
import math

def shingles(text, k=5):
    w = text.lower().split()
    return {' '.join(w[i:i + k]) for i in range(len(w) - k + 1)}

def jaccard(a, b):
    return len(a & b) / len(a | b)

A = shingles('plant two thousand trees along the river path')
B = shingles('plant three thousand trees along the river path')
print(len(A), len(A | B), len(A & B), round(jaccard(A, B), 2))

# error of a bet: −ln p of the right piece
for p in (3.279e-05, 0.1175):
    print(round(-math.log(p), 2))
print(round(math.log(50254), 2))   # guessing at random among 50,254 pieces
# 4 6 2 0.33
# 10.33
# 2.14
# 10.82
\`\`\`

## Rights, consent, and privacy

The Pile (Gao et al., 2020) marks in its table 5 which components have author consent; Books3 (books from a copy of the private site Bibliotik) does not. In *Bartz v. Anthropic* (Northern District of California), the order of June 23, 2025 found fair use in using the books for training and in digitizing purchased books, but not in downloading pirated copies for a permanent library; the $1.5 billion settlement, about $3,000 per work for some 482,000 works, was approved on July 20, 2026. It is one court’s decision in one country; other lawsuits are ongoing and other jurisdictions have different rules. Consent is shifting too: Longpre et al. (2024) estimate that in a single year (April 2023 to April 2024), a quarter or more of the tokens from C4’s most important sites became restricted for AI crawlers in their \`robots.txt\`. Carlini et al. (2021) extracted from GPT-2 604 memorized texts out of 1,800 candidates; among them were names, phone numbers, and emails, some present in a single training document.

## What comes next

Pythia read 300 billion tokens with 1.4 billion parameters. Lesson 24 shows how the error falls as parameters, data, and compute grow, and what that costs. How a base model becomes an assistant is the subject of lessons 27 and 28.`,
  },

  lens: {
    es: [
      'Pregunta de dónde salen los datos de un modelo: qué fuentes, con qué licencias y con qué consentimiento. Un proveedor serio documenta su corpus; si no puede decirlo, el riesgo legal y de reputación también es tuyo.',
      'Todo modelo tiene un corte de conocimiento: lo posterior no lo sabe y puede inventarlo con aplomo. Pregunta la fecha y, si tu caso depende de información reciente, combínalo con búsqueda en documentos (lección 31).',
      'Un modelo base no es un producto: continúa textos, no sigue instrucciones. Los modelos base abiertos sirven para investigar o para ajustarlos a tu tarea; para conversar hace falta la etapa de las lecciones 27 y 28.',
      'Lo que entra al corpus puede salir: un modelo puede repetir textos memorizados, incluidos datos personales. No pongas datos sensibles en datos de entrenamiento y pregunta cómo se filtraron y se quitaron duplicados.',
    ],
    en: [
      'Ask where a model’s data comes from: which sources, under which licenses, and with what consent. A serious provider documents its corpus; if it cannot tell you, the legal and reputational risk is yours too.',
      'Every model has a knowledge cutoff: it does not know what came later and may make it up with confidence. Ask for the date and, if your use case depends on recent information, combine it with document search (lesson 31).',
      'A base model is not a product: it continues texts, it does not follow instructions. Open base models are useful for research or for tuning to your task; to hold a conversation you need the stage covered in lessons 27 and 28.',
      'What goes into the corpus can come out: a model can repeat memorized text, including personal data. Do not put sensitive data in training data, and ask how it was filtered and deduplicated.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Por qué el preentrenamiento se llama aprendizaje autosupervisado?', en: 'Why is pretraining called self-supervised learning?' },
      options: [
        { es: 'Porque el modelo decide solo qué textos leer.', en: 'Because the model decides on its own which texts to read.' },
        { es: 'Porque la respuesta de cada ejercicio, la pieza siguiente, ya viene en el propio texto: nadie tiene que etiquetarla.', en: 'Because the answer to each exercise, the next piece, is already in the text itself: nobody has to label it.' },
        { es: 'Porque no usa una función de error.', en: 'Because it does not use an error function.' },
        { es: 'Porque una persona supervisa cada respuesta del modelo.', en: 'Because a person supervises each of the model’s answers.' },
      ],
      answer: 1,
      why: { es: 'Se tapa una pieza y se compara la apuesta con la pieza real, que estaba en el texto. Por eso sirve cualquier texto y se pueden usar cientos de miles de millones de tokens. El error sí existe: es lo que se baja al entrenar.', en: 'A piece is covered and the bet is compared with the real piece, which was in the text. That is why any text works and hundreds of billions of tokens can be used. There is an error: it is what training lowers.' },
    },
    {
      kind: 'concept',
      q: { es: 'En las mediciones de Pythia, ¿qué aprendió primero?', en: 'In the Pythia measurements, what did it learn first?' },
      options: [
        { es: 'Que la capital de Francia es París.', en: 'That the capital of France is Paris.' },
        { es: 'A traducir «house» como «casa» siguiendo los ejemplos.', en: 'To translate “house” as “casa” by following the examples.' },
        { es: 'A escribir frases gramaticalmente correctas.', en: 'To write grammatically correct sentences.' },
        { es: 'Todo a la vez, al final del entrenamiento.', en: 'Everything at once, at the end of training.' },
      ],
      answer: 2,
      why: { es: 'Con unos dos mil millones de tokens ya escribía frases correctas («I’m sorry, he said»), mientras seguía respondiendo Lyon o Burdeos. «París» y «casa» llegaron hacia los treinta y cuatro mil millones.', en: 'At about two billion tokens it already wrote correct sentences (“I’m sorry, he said”), while it still answered Lyon or Bordeaux. “Paris” and “casa” arrived around thirty-four billion.' },
    },
    {
      kind: 'calc',
      q: { es: 'Dos páginas suman, entre las dos, diez trozos distintos de cinco palabras, y cuatro están en ambas. Con un umbral de cincuenta por ciento, ¿qué pasa?', en: 'Between them, two pages have ten different five-word chunks, and four appear in both. With a fifty percent threshold, what happens?' },
      options: [
        { es: 'Se parecen un 40 %: las dos se quedan.', en: 'They are 40% alike: both stay.' },
        { es: 'Se parecen un 40 %: una sale.', en: 'They are 40% alike: one goes out.' },
        { es: 'Se parecen un 60 %: una sale.', en: 'They are 60% alike: one goes out.' },
        { es: 'Se parecen un 4 %: las dos se quedan.', en: 'They are 4% alike: both stay.' },
      ],
      answer: 0,
      why: { es: 'El parecido es trozos compartidos entre trozos distintos: 4 / 10 = 40 %. Una página sale solo si se parece al menos lo que marca el umbral, y 40 % no llega a 50 %.', en: 'Similarity is shared chunks over different chunks: 4 / 10 = 40%. A page goes out only if it is at least as similar as the threshold, and 40% does not reach 50%.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo descarga un modelo base recién publicado y le escribe: «Resume este contrato en tres puntos». ¿Qué es lo más probable?', en: 'A team downloads a newly released base model and writes to it: “Summarize this contract in three points.” What is most likely?' },
      options: [
        { es: 'Devuelve un resumen impecable, porque leyó muchos contratos.', en: 'It returns a flawless summary, because it read many contracts.' },
        { es: 'Se niega, porque los modelos base no leen contratos.', en: 'It refuses, because base models do not read contracts.' },
        { es: 'Pide más contexto antes de responder, como un asistente.', en: 'It asks for more context before answering, like an assistant.' },
        { es: 'Continúa el texto como seguiría en un documento, sin obedecer la orden; conviene un modelo ajustado para seguir instrucciones.', en: 'It continues the text as it would go on in a document, without obeying the order; a model tuned to follow instructions is the better choice.' },
      ],
      answer: 3,
      why: { es: 'Un modelo base solo aprendió a continuar textos. Ante «escribe un poema corto sobre el mar», Pythia escribió «I am a sea-sick» una y otra vez. Darle forma de documento ayuda, pero para seguir instrucciones hace falta la etapa de las lecciones 27 y 28.', en: 'A base model only learned to continue texts. Given “Write a short poem about the sea,” Pythia wrote “I am a sea-sick” over and over. Shaping the prompt like a document helps, but following instructions requires the stage in lessons 27 and 28.' },
    },
  ],

  glossary: ['token', 'tokenizer', 'vocabulary', 'language-model', 'transformer', 'parameter', 'loss', 'gradient-descent', 'training-data', 'machine-learning', 'knowledge-cutoff', 'hallucination', 'instruction-tuning', 'rlhf'],

  terms: [
    { id: 'pretraining', term: { es: 'Preentrenamiento', en: 'Pretraining' }, def: { es: 'Primera etapa del entrenamiento de un modelo de lenguaje: con un corpus enorme, el modelo adivina la siguiente pieza del texto una y otra vez y ajusta sus parámetros para bajar el error. El resultado es un modelo base.', en: 'The first stage of training a language model: over a huge corpus, the model guesses the next piece of text again and again and adjusts its parameters to lower the error. The result is a base model.' } },
    { id: 'self-supervised-learning', term: { es: 'Aprendizaje autosupervisado', en: 'Self-supervised learning' }, def: { es: 'Aprendizaje en el que la respuesta de cada ejemplo sale de los propios datos, sin etiquetas puestas por personas. En el texto: tapar una pieza y usar la pieza real como respuesta correcta.', en: 'Learning in which each example’s answer comes from the data itself, without labels added by people. In text: cover a piece and use the real piece as the right answer.' } },
    { id: 'corpus', term: { es: 'Corpus', en: 'Corpus' }, def: { es: 'Colección de textos con que se entrena un modelo de lenguaje, por ejemplo The Pile (825 GiB) o FineWeb (15 billones de tokens). Se arma recolectando, filtrando y quitando duplicados.', en: 'The collection of texts a language model is trained on, for example The Pile (825 GiB) or FineWeb (15 trillion tokens). It is built by collecting, filtering, and removing duplicates.' } },
    { id: 'deduplication', term: { es: 'Deduplicación', en: 'Deduplication' }, def: { es: 'Quitar del corpus los textos repetidos, también los casi idénticos. Se mide qué parte de los trozos de unas pocas palabras comparten dos textos (índice de Jaccard, estimado con MinHash) y se descarta uno si pasa de un umbral.', en: 'Removing repeated texts from the corpus, including near-identical ones. It measures what share of few-word chunks two texts have in common (Jaccard index, estimated with MinHash) and drops one if it exceeds a threshold.' } },
    { id: 'base-model', term: { es: 'Modelo base', en: 'Base model' }, def: { es: 'Modelo de lenguaje que solo pasó por el preentrenamiento: sabe continuar textos, pero no está ajustado para seguir instrucciones ni conversar como un asistente.', en: 'A language model that has only gone through pretraining: it can continue texts, but it is not tuned to follow instructions or converse like an assistant.' } },
  ],

  sources: [
    { title: 'Pythia: A Suite for Analyzing Large Language Models Across Training and Scaling', authors: 'Biderman, S., Schoelkopf, H., Anthony, Q., Bradley, H., O’Brien, K., Hallahan, E., et al.', year: 2023, url: 'https://arxiv.org/abs/2304.01373' },
    { title: 'EleutherAI/pythia-1.4b (ficha del modelo y puntos de control)', authors: 'EleutherAI', year: 2023, url: 'https://huggingface.co/EleutherAI/pythia-1.4b' },
    { title: 'The Pile: An 800GB Dataset of Diverse Text for Language Modeling', authors: 'Gao, L., Biderman, S., Black, S., Golding, L., Hoppe, T., Foster, C., et al.', year: 2020, url: 'https://arxiv.org/abs/2101.00027' },
    { title: 'Language Models are Few-Shot Learners (GPT-3)', authors: 'Brown, T. B., Mann, B., Ryder, N., Subbiah, M., et al.', year: 2020, url: 'https://arxiv.org/abs/2005.14165' },
    { title: 'Common Crawl: corpus abierto de la web', authors: 'Common Crawl Foundation', year: 2026, url: 'https://commoncrawl.org/' },
    { title: 'The FineWeb Datasets: Decanting the Web for the Finest Text Data at Scale', authors: 'Penedo, G., Kydlíček, H., Ben Allal, L., Lozhkov, A., Mitchell, M., Raffel, C., Von Werra, L., Wolf, T.', year: 2024, url: 'https://arxiv.org/abs/2406.17557' },
    { title: 'Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5, C4)', authors: 'Raffel, C., Shazeer, N., Roberts, A., Lee, K., Narang, S., et al.', year: 2020, url: 'https://arxiv.org/abs/1910.10683' },
    { title: 'On the resemblance and containment of documents', authors: 'Broder, A. Z.', year: 1997, url: 'https://doi.org/10.1109/SEQUEN.1997.666900' },
    { title: 'Deduplicating Training Data Makes Language Models Better', authors: 'Lee, K., Ippolito, D., Nystrom, A., Zhang, C., Eck, D., Callison-Burch, C., Carlini, N.', year: 2022, url: 'https://arxiv.org/abs/2107.06499' },
    { title: 'Extracting Training Data from Large Language Models', authors: 'Carlini, N., Tramèr, F., Wallace, E., Jagielski, M., Herbert-Voss, A., Lee, K., et al.', year: 2021, url: 'https://arxiv.org/abs/2012.07805' },
    { title: 'Consent in Crisis: The Rapid Decline of the AI Data Commons', authors: 'Longpre, S., Mahari, R., Lee, A., Lund, C., et al.', year: 2024, url: 'https://arxiv.org/abs/2407.14933' },
    { title: 'Bartz v. Anthropic PBC, n.º 3:24-cv-05417, Order on Fair Use (N. D. Cal., 23 de junio de 2025)', authors: 'U.S. District Court for the Northern District of California (juez W. Alsup)', year: 2025, url: 'https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0_5.pdf' },
    { title: 'Bartz v. Anthropic PBC, Order Granting Final Approval of Class Action Settlement (N. D. Cal., 20 de julio de 2026)', authors: 'U.S. District Court for the Northern District of California (jueza A. Martínez-Olguín)', year: 2026, url: 'https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.680.0_5.pdf' },
    { title: 'FIFA World Cup Qatar 2022, final: Argentina 3–3 France (Argentina won 4–2 on penalties), match centre', authors: 'FIFA', year: 2022, url: 'https://www.fifa.com/en/match-centre/match/17/255711/285077/400128145' },
  ],
});
