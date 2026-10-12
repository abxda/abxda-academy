import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'texto-a-imagen',

  objectives: {
    es: [
      'Explicar cómo CLIP entrena juntos un codificador de imágenes y uno de texto para que cada imagen quede cerca de su frase, leyendo la tabla de similitudes y su diagonal.',
      'Describir cómo el vector de la frase condiciona la difusión y predecir qué pasa con la fidelidad y la variedad al subir la escala de guiado.',
      'Reconocer los límites de estos modelos (sesgos que se amplifican, combinaciones nunca vistas, quién va con quién, contar y escribir) y los riesgos de derechos, suplantación y procedencia.',
    ],
    en: [
      'Explain how CLIP trains an image encoder and a text encoder together so each image lands close to its sentence, by reading the similarity table and its diagonal.',
      'Describe how the sentence’s vector conditions diffusion, and predict what happens to faithfulness and variety as the guidance scale goes up.',
      'Recognize the limits of these models (amplified biases, never-seen combinations, what goes with what, counting and writing) and the risks around rights, impersonation, and provenance.',
    ],
  },

  segments: [
    // ── el gancho y el mundo de juguete ──
    {
      id: 'hook',
      es: 'Escribes «un gato astronauta» y, en segundos, un programa te devuelve una imagen que nadie dibujó. ¿Cómo convierte una frase en una imagen?',
      en: 'You type “an astronaut cat” and, in seconds, a program hands you an image nobody drew. How does it turn a sentence into an image?',
    },
    {
      id: 'recall',
      es: 'En la lección diecisiete viste cómo una red convierte puro ruido en una imagen, paso a paso. Pero no eliges cuál: sale cualquier figura, de cualquier color.',
      en: 'In lesson seventeen you saw how a network turns pure noise into an image, step by step. But you do not choose which: any shape comes out, in any color.',
      pad: 0.6,
    },
    {
      id: 'world',
      es: 'Para verlo por dentro usaremos un mundo diminuto: imágenes de doce por doce píxeles con una sola figura: círculo, cuadrado, triángulo o cruz.',
      en: 'To see it from the inside, we will use a tiny world: images of twelve by twelve pixels with a single shape: a circle, a square, a triangle, or a cross.',
      pad: 0.3,
    },
    {
      id: 'colors',
      es: 'La figura es de un color y el fondo de otro, entre cinco: cian, magenta, ámbar, verde y violeta.',
      en: 'The shape is one color and the background another, out of five: cyan, magenta, amber, green, and violet.',
      pad: 0.3,
    },
    {
      id: 'pairs',
      es: 'Y cada imagen viene con una frase que la describe, en español o en inglés. Estos pares de imagen y frase son los datos de entrenamiento.',
      en: 'And each image comes with a sentence that describes it, in Spanish or in English. These image-and-sentence pairs are the training data.',
      note: { es: 'Datos: pares de imagen y frase.', en: 'Data: image-and-sentence pairs.' },
      pad: 0.3,
    },
    // ── CLIP, pieza por pieza ──
    {
      id: 'numbers',
      es: 'La red que quita el ruido solo entiende números. Hay que convertir la frase en un vector, como en la lección catorce, que diga cómo debe verse la imagen.',
      en: 'The network that removes noise only understands numbers. The sentence has to become a vector, as in lesson fourteen, one that says how the image should look.',
      pad: 0.3,
    },
    {
      id: 'img-enc',
      es: 'El truco es aprenderlo junto con las imágenes. Primera pieza: un codificador de imágenes, una red que resume los ciento cuarenta y cuatro píxeles en treinta y dos números.',
      en: 'The trick is to learn it together with the images. First piece: an image encoder, a network that sums up the one hundred forty-four pixels in thirty-two numbers.',
      pad: 0.3,
    },
    {
      id: 'txt-enc',
      es: 'Segunda pieza: un codificador de texto. Otra red, que lee la frase palabra por palabra y la resume también en treinta y dos números.',
      en: 'Second piece: a text encoder. Another network, which reads the sentence word by word and also sums it up in thirty-two numbers.',
      pad: 0.3,
    },
    {
      id: 'cosine',
      es: 'Como los dos vectores tienen el mismo tamaño, se comparan con la similitud coseno de la lección catorce. Esta imagen y su frase dan cero punto setenta y ocho.',
      en: 'Since both vectors are the same size, they can be compared with the cosine similarity from lesson fourteen. This image and its sentence give zero point seven eight.',
      pad: 0.3,
    },
    {
      id: 'goal',
      es: 'Con una frase que no le corresponde, da menos cero punto tres. Esa es la meta: cada imagen, cerca de su frase y lejos de las demás.',
      en: 'With a sentence that does not match, it gives minus zero point three. That is the goal: each image close to its own sentence and far from the others.',
      pad: 0.3,
    },
    // ── la tabla de similitudes y el entrenamiento contrastivo ──
    {
      id: 'batch',
      es: 'Así se entrena. Tomamos un lote de seis pares: sus seis frases forman las filas de una tabla y sus seis imágenes, las columnas.',
      en: 'Here is how it trains. We take a batch of six pairs: their six sentences form the rows of a table, and their six images form the columns.',
      pad: 0.4,
    },
    {
      id: 'cells',
      es: 'Cada casilla es la similitud entre una frase y una imagen: cuanto más intensa, más parecidas. Con los pesos iniciales, al azar, todavía no dicen nada.',
      en: 'Each cell is the similarity between a sentence and an image: the stronger it looks, the more alike they are. With the initial random weights, they mean nothing yet.',
      pad: 0.3,
    },
    {
      id: 'diag',
      es: 'Las parejas correctas están en la diagonal: frase uno con imagen uno, dos con dos, y así. Todas las demás casillas son parejas equivocadas.',
      en: 'The correct pairs sit on the diagonal: sentence one with image one, two with two, and so on. Every other cell is a wrong pairing.',
      pad: 0.3,
    },
    {
      id: 'push',
      es: 'Entrenar es mover los pesos para empujar en dos sentidos a la vez: subir las casillas de la diagonal y bajar las demás de su fila y de su columna.',
      en: 'Training moves the weights to push two ways at once: raise the cells on the diagonal and lower the others in their row and their column.',
      pad: 0.4,
    },
    {
      id: 'contrastive',
      es: 'Aprender así, comparando lo que va junto con lo que no, se llama aprendizaje contrastivo. Nadie etiqueta nada a mano: basta con que cada imagen traiga su frase.',
      en: 'Learning this way, by comparing what belongs together with what does not, is called contrastive learning. Nobody labels anything by hand: each image just needs its sentence.',
      note: { es: 'Aprendizaje contrastivo: acercar los pares correctos y alejar los equivocados.', en: 'Contrastive learning: pull correct pairs together and push wrong ones apart.' },
      pad: 0.3,
    },
    {
      id: 'train-demo',
      es: 'Este es el entrenamiento real de nuestro modelo diminuto. Mira la diagonal: del paso cero al dos mil quinientos se enciende, y el resto se apaga.',
      en: 'This is the real training of our tiny model. Watch the diagonal: from step zero to step two thousand five hundred it lights up, and the rest fades.',
      pad: 0.8,
    },
    {
      id: 'try-train',
      es: 'Abajo, el error del lote: empieza en tres punto uno y termina casi en cero. Si quieres, recorre tú el entrenamiento con el deslizador de pasos.',
      en: 'Below, the batch error: it starts at two point six and ends near zero. If you like, scrub through the training yourself with the steps slider.',
      gate: { id: 'train', prompt: { es: 'mueve el deslizador de pasos y mira la diagonal.', en: 'move the steps slider and watch the diagonal.' } },
      pad: 0.4,
    },
    {
      id: 'clip',
      es: 'Esta receta se llama CLIP y la presentó OpenAI en enero de dos mil veintiuno. Aprendió con unos cuatrocientos millones de pares de imagen y texto tomados de internet.',
      en: 'This recipe is called CLIP, and OpenAI introduced it in January twenty twenty-one. It learned from about four hundred million image-and-text pairs taken from the internet.',
      tts: {
        es: 'Esta receta se llama clip y la presentó OpenAI en enero de dos mil veintiuno. Aprendió con unos cuatrocientos millones de pares de imagen y texto tomados de internet.',
        en: 'This recipe is called Clip, and OpenAI introduced it in January twenty twenty-one. It learned from about four hundred million image-and-text pairs taken from the internet.',
      },
      note: { es: 'CLIP: dos codificadores que ponen cerca cada imagen y su frase.', en: 'CLIP: two encoders that put each image close to its sentence.' },
      pad: 0.3,
    },
    {
      id: 'map',
      es: 'Si aplastamos los vectores a un plano, como en la lección catorce, cada imagen cae junto a su frase. Y la frase en español, junto a la de inglés.',
      en: 'If we flatten the vectors onto a plane, as in lesson fourteen, each image lands next to its sentence. And the Spanish sentence lands next to the English one.',
      pad: 0.6,
    },
    // ── condicionar la difusión ──
    {
      id: 'denoiser',
      es: 'Volvamos a la difusión. En cada paso, la red recibe la imagen con ruido y el número de paso, y predice el ruido que debe quitar.',
      en: 'Back to diffusion. At each step, the network receives the noisy image and the step number, and predicts the noise it should remove.',
      pad: 0.3,
    },
    {
      id: 'condition',
      es: 'La novedad: una tercera entrada, el vector de la frase que sale del codificador de texto de CLIP. Darle a la red esa información extra se llama condicionar.',
      en: 'The new part: a third input, the sentence’s vector, straight from CLIP’s text encoder. Giving the network that extra information is called conditioning.',
      tts: {
        es: 'La novedad: una tercera entrada, el vector de la frase que sale del codificador de texto de clip. Darle a la red esa información extra se llama condicionar.',
        en: 'The new part: a third input, the sentence’s vector, straight from Clip’s text encoder. Giving the network that extra information is called conditioning.',
      },
      note: { es: 'Condicionar: darle a la red una entrada extra, el vector de la frase, que dirige el resultado.', en: 'Conditioning: giving the network an extra input, the sentence’s vector, that steers the result.' },
      pad: 0.4,
    },
    {
      id: 'cond-train',
      es: 'Al entrenar, cada imagen con ruido llega con el vector de su propia frase. Así la red aprende a limpiar en la dirección de lo que la frase describe.',
      en: 'During training, each noisy image arrives with the vector of its own sentence. That way the network learns to clean toward what the sentence describes.',
      pad: 0.3,
    },
    {
      id: 'latent',
      es: 'Como en la difusión latente de la lección diecisiete, nuestra red no limpia píxeles, sino un resumen de dieciséis números. Al final, el decodificador de un VAE lo vuelve imagen.',
      en: 'As in the latent diffusion of lesson seventeen, our network does not clean pixels but a summary of sixteen numbers. At the end, a VAE decoder turns it into an image.',
      pad: 0.4,
    },
    {
      id: 'gen-demo',
      es: 'Pidamos «cruz ámbar sobre fondo violeta». Se parte de dieciséis números al azar y, en cuarenta pasos guiados por la frase, aparece la cruz.',
      en: 'Let’s ask for “amber cross on violet background.” It starts from sixteen random numbers and, in forty steps guided by the sentence, the cross appears.',
      pad: 0.8,
    },
    {
      id: 'prompt',
      es: 'La frase con la que pides una imagen se llama prompt, en español, instrucción. Y el modelo solo entiende las palabras que vio al entrenar.',
      en: 'The sentence you use to ask for an image is called a prompt. And the model only understands the words it saw during training.',
      note: { es: 'Prompt: la frase con la que se le pide algo al modelo.', en: 'Prompt: the sentence you use to ask the model for something.' },
      pad: 0.3,
    },
    {
      id: 'variety',
      es: 'Con la misma frase y otro ruido inicial sale otra imagen: la misma cruz, con otro tamaño o en otro lugar. Aquí van cuatro intentos.',
      en: 'With the same sentence and different starting noise, you get a different image: the same cross, at another size or position. Here are four tries.',
      pad: 0.6,
    },
    {
      id: 'prompt-demo',
      es: 'Cambiemos de frase. La escena elige otras dos y, cada vez, el modelo genera cuatro imágenes nuevas desde el ruido, aquí mismo.',
      en: 'Let’s change the sentence. The scene picks two others and, each time, the model generates four new images from noise, right here.',
      pad: 1,
    },
    {
      id: 'try-prompt',
      es: 'Si quieres, elige tú otra frase de la lista y mira qué genera. Cada imagen se calcula en tu navegador con el modelo entrenado.',
      en: 'If you like, pick another sentence from the list and see what it generates. Each image is computed in your browser with the trained model.',
      gate: { id: 'prompt', prompt: { es: 'elige otra frase y mira las cuatro imágenes nuevas.', en: 'pick another sentence and look at the four new images.' } },
      pad: 0.4,
    },
    // ── la escala de guiado ──
    {
      id: 'two-preds',
      es: '¿Cuánto debe obedecer el modelo a la frase? Para controlarlo, en cada paso la red predice el ruido dos veces: con la frase y con la frase borrada.',
      en: 'How closely should the model obey the sentence? To control that, at each step the network predicts the noise twice: with the sentence and with it erased.',
      pad: 0.4,
    },
    {
      id: 'scale',
      es: 'La diferencia entre las dos predicciones es lo que aporta la frase. Se multiplica por un número, la escala de guiado, y se suma a la predicción sin frase.',
      en: 'The difference between the two predictions is what the sentence adds. It is multiplied by a number, the guidance scale, and added to the prediction without the sentence.',
      note: { es: 'Escala de guiado: cuánto se exagera lo que aporta la frase.', en: 'Guidance scale: how much what the sentence adds gets exaggerated.' },
      pad: 0.5,
    },
    {
      id: 'drop',
      es: 'Para tener la predicción sin frase, al entrenar se borra la frase una de cada diez veces. Es la receta de Ho y Salimans, de dos mil veintidós.',
      en: 'To get the prediction without the sentence, the sentence is erased one time in ten during training. It is the recipe of Ho and Salimans, from twenty twenty-two.',
      pad: 0.3,
    },
    {
      id: 'guide-setup',
      es: 'Probemos con una frase incompleta, como algunas de los datos: solo «círculo». Generamos veinticuatro imágenes, siempre con los mismos ruidos iniciales.',
      en: 'Let’s try an incomplete sentence, like some in the data: just “circle.” We generate twenty-four images, always from the same starting noise.',
      pad: 0.4,
    },
    {
      id: 'guide-zero',
      es: 'Con escala cero, la frase se ignora: solo once de las veinticuatro son círculos, y hay dieciocho combinaciones distintas de forma y colores.',
      en: 'At scale zero, the sentence is ignored: only eleven of the twenty-four are circles, and there are eighteen different combinations of shape and colors.',
      pad: 0.3,
    },
    {
      id: 'guide-demo',
      es: 'Con escala uno, la red sigue la frase tal como aprendió: diecinueve círculos. Con tres, la exagera: veintiuno, casi todos magenta, y solo siete combinaciones.',
      en: 'At scale one, the network follows the sentence as it learned: twenty circles. At three, it exaggerates it: twenty-three, almost all magenta, and only six combinations.',
      pad: 0.8,
    },
    {
      id: 'guide-high',
      es: 'Con escala ocho, el empuje es excesivo: algunas figuras se deforman y los círculos bajan a dieciséis.',
      en: 'At scale eight, the push is too strong: some shapes get distorted and the circles drop to thirteen.',
      pad: 0.6,
    },
    {
      id: 'tradeoff',
      es: 'Es un equilibrio: más guiado da más fidelidad a la frase y menos variedad, hasta que se pasa. En Stable Diffusion, la escala por omisión es siete punto cinco.',
      en: 'It is a balance: more guidance gives more faithfulness to the sentence and less variety, until it goes too far. In Stable Diffusion, the default scale is seven point five.',
      note: { es: 'Más guiado: más fidelidad, menos variedad; demasiado, deforma.', en: 'More guidance: more faithfulness, less variety; too much distorts.' },
      pad: 0.4,
    },
    {
      id: 'try-guide',
      es: 'Si quieres, mueve tú la escala de guiado y mira cómo cambian los dos contadores: círculos y combinaciones distintas.',
      en: 'If you like, move the guidance scale yourself and watch the two counters change: circles and different combinations.',
      gate: { id: 'guide', prompt: { es: 'lleva la escala a un valor bajo y luego a uno alto.', en: 'take the scale to a low value and then to a high one.' } },
      pad: 0.4,
    },
    // ── límites ──
    {
      id: 'bias',
      es: 'Ahora, los límites. Primero, el sesgo, que en nuestro mundo pusimos a propósito: en los datos, dos de cada tres círculos son magenta.',
      en: 'Now, the limits. First, bias, which we planted in our world on purpose: in the data, two out of three circles are magenta.',
      pad: 0.3,
    },
    {
      id: 'bias-amp',
      es: 'Con escala uno, quince de las veinticuatro figuras salen magenta, casi la proporción de los datos. Con escala tres, veintidós: el guiado amplifica el sesgo.',
      en: 'At scale one, fifteen of the twenty-four shapes come out magenta, close to the share in the data. At scale three, twenty-two: guidance amplifies the bias.',
      pad: 0.4,
    },
    {
      id: 'bias-real',
      es: 'Con personas pasa igual. En un estudio de dos mil veintitrés, noventa y nueve de cada cien programadores dibujados por Stable Diffusion salieron blancos; en Estados Unidos son cincuenta y seis.',
      en: 'The same happens with people. In a twenty twenty-three study, ninety-nine in a hundred software developers drawn by Stable Diffusion came out white; in the United States, it is fifty-six.',
      pad: 0.3,
    },
    {
      id: 'unseen',
      es: 'Segundo: lo nunca visto. «Círculo verde sobre fondo cian» no estaba en los datos, y sale bien: el modelo combina una forma y unos colores que aprendió por separado.',
      en: 'Second: the never-seen. “Green circle on cyan background” was not in the data, and it comes out right: the model combines a shape and colors it learned separately.',
      pad: 0.5,
    },
    {
      id: 'unseen-fail',
      es: 'Pero no siempre: con «triángulo violeta sobre fondo magenta» a veces dibuja un círculo. En promedio, lo nunca visto sale bien setenta y seis de cada cien veces; lo visto, ochenta y seis.',
      en: 'But not always: with “violet triangle on magenta background” it sometimes draws a circle. On average, never-seen combinations come out right seventy-six times in a hundred; seen ones, eighty-six.',
      pad: 0.5,
    },
    {
      id: 'binding',
      es: 'Tercero: quién va con quién. «Círculo magenta sobre fondo ámbar» y «círculo ámbar sobre fondo magenta» usan exactamente las mismas palabras.',
      en: 'Third: what goes with what. “Magenta circle on amber background” and “amber circle on magenta background” use exactly the same words.',
      pad: 0.3,
    },
    {
      id: 'binding-bag',
      es: 'Nuestro codificador lee el orden y las distingue. Uno que solo suma palabras, una bolsa de palabras, da el mismo número con ambas: no sabe de quién es cada color.',
      en: 'Our encoder reads word order and tells them apart. One that just adds up the words, a bag of words, gives the same number for both: it cannot tell whose color is whose.',
      pad: 0.5,
    },
    {
      id: 'never-saw',
      es: 'Y lo que nunca vio, no lo puede dibujar: nuestro modelo jamás vio dos figuras juntas ni letras. Los modelos reales también tropiezan al contar objetos y al escribir texto.',
      en: 'And what it never saw, it cannot draw: our model never saw two shapes together, or any letters. Real models also stumble at counting objects and at writing text.',
      pad: 0.5,
    },
    // ── derechos, suplantación y procedencia ──
    {
      id: 'rights',
      es: 'Esos cuatrocientos millones de pares venían de internet, de fotos e ilustraciones con autor. Si pueden usarse sin permiso para entrenar se discute hoy en decenas de demandas.',
      en: 'Those four hundred million pairs came from the internet, from photos and illustrations that have authors. Whether they can be used for training without permission is now being argued in dozens of lawsuits.',
      pad: 0.3,
    },
    {
      id: 'impersonation',
      es: 'El riesgo opuesto está en la salida: con una frase se puede fabricar la foto de una persona real haciendo algo que nunca hizo. Una imagen sola ya no prueba nada.',
      en: 'The opposite risk is in the output: with one sentence you can fabricate a photo of a real person doing something they never did. An image alone no longer proves anything.',
      pad: 0.3,
    },
    {
      id: 'provenance',
      es: 'Por eso se marcan las imágenes: con marcas de agua invisibles y con credenciales del estándar C2PA, que registran con qué herramienta se hizo una imagen y si intervino una IA.',
      en: 'That is why images get marked: with invisible watermarks and with credentials from the C2PA standard, which record what tool made an image and whether an AI was involved.',
      tts: {
        es: 'Por eso se marcan las imágenes: con marcas de agua invisibles y con credenciales del estándar ce dos pe a, que registran con qué herramienta se hizo una imagen y si intervino una i a.',
        en: 'That is why images get marked: with invisible watermarks and with credentials from the C two P A standard, which record what tool made an image and whether an A I was involved.',
      },
      note: { es: 'Procedencia: marcas de agua y credenciales C2PA dicen de dónde viene una imagen.', en: 'Provenance: watermarks and C2PA credentials say where an image comes from.' },
      pad: 0.3,
    },
    {
      id: 'recap',
      es: 'En resumen: CLIP pone imágenes y frases en un mismo espacio; el vector de la frase condiciona la difusión; y la escala de guiado elige entre fidelidad y variedad.',
      en: 'In short: CLIP puts images and sentences in one shared space; the sentence’s vector conditions the diffusion; and the guidance scale trades faithfulness for variety.',
      tts: {
        es: 'En resumen: clip pone imágenes y frases en un mismo espacio; el vector de la frase condiciona la difusión; y la escala de guiado elige entre fidelidad y variedad.',
        en: 'In short: Clip puts images and sentences in one shared space; the sentence’s vector conditions the diffusion; and the guidance scale trades faithfulness for variety.',
      },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Aquí el texto solo entraba. ¿Y si queremos que un modelo escriba? De las imágenes pasamos al lenguaje: predecir la siguiente palabra.',
      en: 'Here, text only went in. What if we want a model to write? From images we move on to language: predicting the next word.',
    },
  ],

  keyIdeas: {
    es: [
      'CLIP entrena juntos un codificador de imágenes y uno de texto. Ambos entregan vectores del mismo tamaño, que se comparan con la similitud coseno.',
      'El entrenamiento es contrastivo: en cada lote, la tabla de similitudes debe encender su diagonal (los pares correctos) y apagar el resto. No hacen falta etiquetas a mano, solo imágenes con su frase.',
      'Para generar desde texto, la red de difusión recibe una entrada extra: el vector de la frase. Eso es condicionar. El prompt es esa frase, y el modelo solo entiende las palabras que vio al entrenar.',
      'El guiado sin clasificador predice el ruido con la frase y sin ella, y exagera la diferencia según la escala de guiado: más escala, más fidelidad y menos variedad; demasiada, deforma.',
      'Los modelos heredan y amplifican los sesgos de sus datos, fallan más en lo nunca visto, pueden confundir quién va con quién y les cuesta contar y escribir. Sus datos plantean preguntas de derechos, y sus imágenes, de suplantación y procedencia.',
    ],
    en: [
      'CLIP trains an image encoder and a text encoder together. Both output vectors of the same size, compared with cosine similarity.',
      'Training is contrastive: in each batch, the similarity table must light up its diagonal (the correct pairs) and dim the rest. No hand labels are needed, just images with their sentences.',
      'To generate from text, the diffusion network gets an extra input: the sentence’s vector. That is conditioning. The prompt is that sentence, and the model only understands the words it saw during training.',
      'Classifier-free guidance predicts the noise with and without the sentence and exaggerates the difference by the guidance scale: more scale, more faithfulness and less variety; too much distorts.',
      'Models inherit and amplify the biases in their data, do worse on the never-seen, can mix up what goes with what, and struggle to count and write. Their data raises questions about rights, and their images about impersonation and provenance.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un generador de imágenes entiende la frase como una persona: si las palabras están bien escritas, dibuja exactamente lo que pediste.',
      en: 'An image generator understands the sentence the way a person does: if the words are written correctly, it draws exactly what you asked for.',
    },
    right: {
      es: 'Convierte la frase en un vector aprendido de pares de imagen y texto, y la difusión se guía por ese vector. Lo que no estaba en sus datos (palabras, combinaciones, cantidades, letras) lo maneja mal, y lo frecuente en sus datos lo repite de más.',
      en: 'It turns the sentence into a vector learned from image-and-text pairs, and diffusion is guided by that vector. Whatever was missing from its data (words, combinations, quantities, letters) it handles poorly, and whatever was frequent in its data it repeats too much.',
    },
  },

  deeper: {
    es: `## La pérdida contrastiva de CLIP

En un lote de $N$ pares, el codificador de imágenes $f$ y el de texto $g$ producen vectores unitarios $u_i = f(x_i)$ y $v_j = g(t_j)$. Su similitud coseno es $S_{ij} = u_i \\cdot v_j$. Se dividen entre una temperatura $\\tau$ (que también se aprende) y se pide, con entropía cruzada, que cada imagen elija su propia frase y que cada frase elija su propia imagen:

$$\\mathcal{L} = \\frac{1}{2N}\\sum_{i=1}^{N}\\Big[-\\ln\\frac{e^{S_{ii}/\\tau}}{\\sum_j e^{S_{ij}/\\tau}} \\; - \\ln\\frac{e^{S_{ii}/\\tau}}{\\sum_j e^{S_{ji}/\\tau}}\\Big]$$

Es la pérdida simétrica del artículo de Radford y colaboradores (figura 3): sube la diagonal de la tabla $S$ y baja el resto de su fila y de su columna. CLIP usó lotes de 32 768 pares, es decir, tablas de más de mil millones de casillas en cada paso, y unos 400 millones de pares de imagen y texto reunidos de fuentes públicas de internet. La ficha del modelo es de enero de 2021.

En nuestro juguete, el codificador de imágenes recibe 720 números (12 × 12 píxeles, cada uno con 5 casillas *one-hot* de color) y tiene una capa oculta de 96; el de texto lee 5 posiciones de palabra, cada palabra con un vector de 16 más un vector de su posición, y tiene una capa oculta de 64. Ambos entregan $D = 32$. Se entrenó 2 500 pasos con lotes de 96; la temperatura pasó de $1/\\tau \\approx 14.3$ a $22.0$. En el lote fijo de seis pares que muestra la escena, la diagonal termina entre 0.78 y 0.88. El error del lote no llega a cero con lotes de 96: muchas frases incompletas («círculo») se repiten dentro del mismo lote y no pueden distinguir a sus imágenes.

## Condicionar y guiar

La red de difusión predice el ruido $\\epsilon_\\theta(z_t, t, c)$ de un latente $z_t$ de 16 números, en el paso $t$, dado el vector $c$ de la frase. Al entrenar, la frase se sustituye por la frase vacía $\\varnothing$ el 10 % de las veces (como en Stable Diffusion v1-4). Al muestrear, con escala de guiado $s$:

$$\\hat\\epsilon = \\epsilon_\\theta(z_t, t, \\varnothing) + s\\,\\big[\\epsilon_\\theta(z_t, t, c) - \\epsilon_\\theta(z_t, t, \\varnothing)\\big]$$

Con $s = 0$ la frase no cuenta; con $s = 1$ es la red condicionada tal cual; con $s > 1$ se exagera. Es la convención de la biblioteca diffusers (escala por omisión 7.5, «activa cuando es mayor que 1»). Ho y Salimans escriben lo mismo como $(1+w)\\,\\epsilon_c - w\\,\\epsilon_\\varnothing$, con $w = s - 1$, y lo presentan como un equilibrio entre calidad de las muestras y diversidad. GLIDE (Nichol y colaboradores, 2021) ya lo usaba con texto, y los evaluadores humanos lo prefirieron al guiado con CLIP.

Nuestro muestreo sigue la receta de la lección 17: $T = 40$ pasos, $\\beta_t$ lineal de 0.02 a 0.30 y varianza del paso inverso $\\sigma_t^2 = \\beta_t$. El latente sale de un VAE de 16 números y se decodifica al final. Stable Diffusion condiciona de otra manera (atención cruzada sobre los vectores de cada palabra del codificador de texto de CLIP); aquí, para que quepa en el navegador, el vector de la frase se pega a la entrada de una red de tres capas.

## Lo que midió la escena

- Escala de guiado con «círculo» (256 ruidos iniciales): círculos 36 % con $s = 0$, 80 % con $s = 1$, 95 % con $s = 2$, 93 % con $s = 4$ y 63 % con $s = 8$. Las veinticuatro imágenes de la escena (semillas 1000 a 1023, prompt «círculo») dan 11, 19, 21 y 16 círculos con $s = 0, 1, 3, 8$, y 18, 12, 7 y 7 combinaciones distintas de forma, color y fondo (con el prompt en inglés, «circle»: 11, 20, 23 y 13 círculos; 18, 11, 6 y 8 combinaciones).
- Sesgo: en los datos, el 64.9 % de los círculos son magenta (una de cada dos imágenes lleva el color típico de su forma y la otra, uno al azar). Entre las veinticuatro imágenes, 15 son magenta con $s = 1$ y 22 con $s = 3$.
- Lo nunca visto (diez combinaciones fuera del entrenamiento, 16 ruidos por combinación, $s = 3$): 86.4 % correctas en las 70 combinaciones vistas y 75.6 % en las 10 nunca vistas. Con $s = 1$ la diferencia es mayor: 85.6 % frente a 45.6 %.
- Quién va con quién (60 parejas con los colores intercambiados, en los dos idiomas): el codificador que lee el orden elige la frase correcta el 100 % de las veces; la bolsa de palabras da exactamente el mismo vector a las dos frases (0 %: siempre empate).

Las cuentas de forma y color las hace un lector de reglas fijas, no aprendido: el fondo es el color más común en el borde, la figura es el resto, y la forma es la plantilla (círculo, cuadrado, triángulo o cruz, en varias posiciones y tamaños) que mejor se superpone; si ninguna supera 0.6 de intersección sobre unión, la imagen cuenta como «sin forma». Lee bien las 20 imágenes reales de la lección. Con los cuadrados es menos fiable: el modelo los dibuja a menudo con esquinas redondeadas y el lector los toma por círculos, por eso la escena no los usa para contar.

## En código

\`\`\`python
import numpy as np

def perdida_contrastiva(U, V, tau=0.07):
    """U, V: vectores unitarios de N imágenes y N frases (fila i = par i)."""
    S = U @ V.T / tau
    S = S - S.max(axis=1, keepdims=True)
    filas = -np.mean(np.diag(S) - np.log(np.exp(S).sum(axis=1)))
    S2 = (U @ V.T / tau).T
    S2 = S2 - S2.max(axis=1, keepdims=True)
    cols = -np.mean(np.diag(S2) - np.log(np.exp(S2).sum(axis=1)))
    return (filas + cols) / 2

rng = np.random.default_rng(0)
U = rng.normal(size=(4, 8)); U /= np.linalg.norm(U, axis=1, keepdims=True)
V_azar = rng.normal(size=(4, 8)); V_azar /= np.linalg.norm(V_azar, axis=1, keepdims=True)
V_bien = U + 0.1 * rng.normal(size=(4, 8)); V_bien /= np.linalg.norm(V_bien, axis=1, keepdims=True)
print(round(perdida_contrastiva(U, V_azar), 3), round(perdida_contrastiva(U, V_bien), 6))

def guiado(e_sin, e_con, s):
    return e_sin + s * (e_con - e_sin)

e_sin, e_con = np.array([0.2, -0.4]), np.array([0.5, 0.1])
for s in (0, 1, 3):
    print(s, guiado(e_sin, e_con, s))
# 6.064 0.000141
# 0 [ 0.2 -0.4]
# 1 [0.5 0.1]
# 3 [1.1 1.1]
\`\`\`

Con frases al azar el error es alto; con frases casi iguales a su imagen, la diagonal domina y el error cae a casi cero. La segunda función es toda la escala de guiado.

## Lo que viene

Aquí el texto solo entraba: se convertía en un vector. En la lección 19 el texto sale: un modelo de lenguaje asigna probabilidades a la siguiente palabra y escribe una palabra tras otra.`,

    en: `## CLIP’s contrastive loss

In a batch of $N$ pairs, the image encoder $f$ and the text encoder $g$ produce unit vectors $u_i = f(x_i)$ and $v_j = g(t_j)$. Their cosine similarity is $S_{ij} = u_i \\cdot v_j$. These are divided by a temperature $\\tau$ (also learned), and cross-entropy asks each image to pick its own sentence and each sentence to pick its own image:

$$\\mathcal{L} = \\frac{1}{2N}\\sum_{i=1}^{N}\\Big[-\\ln\\frac{e^{S_{ii}/\\tau}}{\\sum_j e^{S_{ij}/\\tau}} \\; - \\ln\\frac{e^{S_{ii}/\\tau}}{\\sum_j e^{S_{ji}/\\tau}}\\Big]$$

This is the symmetric loss from Radford and colleagues’ paper (Figure 3): it raises the diagonal of the table $S$ and lowers the rest of its row and column. CLIP used batches of 32,768 pairs, that is, tables of more than a billion cells at every step, and about 400 million image-and-text pairs gathered from publicly available sources on the internet. The model card is dated January 2021.

In our toy, the image encoder receives 720 numbers (12 × 12 pixels, each with 5 one-hot color slots) and has a hidden layer of 96; the text encoder reads 5 word positions, each word with a 16-number vector plus a vector for its position, and has a hidden layer of 64. Both output $D = 32$. It trained for 2,500 steps with batches of 96; the temperature went from $1/\\tau \\approx 14.3$ to $22.0$. In the fixed six-pair batch the scene shows, the diagonal ends between 0.78 and 0.88. The batch error does not reach zero with batches of 96: many incomplete sentences (“circle”) repeat within the same batch and cannot tell their images apart.

## Conditioning and guiding

The diffusion network predicts the noise $\\epsilon_\\theta(z_t, t, c)$ of a 16-number latent $z_t$, at step $t$, given the sentence vector $c$. During training, the sentence is replaced with the empty sentence $\\varnothing$ 10% of the time (as in Stable Diffusion v1-4). When sampling, with guidance scale $s$:

$$\\hat\\epsilon = \\epsilon_\\theta(z_t, t, \\varnothing) + s\\,\\big[\\epsilon_\\theta(z_t, t, c) - \\epsilon_\\theta(z_t, t, \\varnothing)\\big]$$

With $s = 0$ the sentence does not count; with $s = 1$ it is the plain conditional network; with $s > 1$ it is exaggerated. This is the convention of the diffusers library (default scale 7.5, “enabled when greater than 1”). Ho and Salimans write the same thing as $(1+w)\\,\\epsilon_c - w\\,\\epsilon_\\varnothing$, with $w = s - 1$, and present it as a trade-off between sample quality and diversity. GLIDE (Nichol and colleagues, 2021) already used it with text, and human evaluators preferred it to CLIP guidance.

Our sampler follows the lesson 17 recipe: $T = 40$ steps, $\\beta_t$ linear from 0.02 to 0.30, and reverse-step variance $\\sigma_t^2 = \\beta_t$. The latent comes from a 16-number VAE and is decoded at the end. Stable Diffusion conditions differently (cross-attention over the per-word vectors from CLIP’s text encoder); here, to fit in the browser, the sentence vector is appended to the input of a three-layer network.

## What the scene measured

- Guidance scale with “circle” (256 starting noises): circles 36% at $s = 0$, 80% at $s = 1$, 95% at $s = 2$, 93% at $s = 4$, and 63% at $s = 8$. The scene’s twenty-four images (seeds 1000 to 1023, prompt “circle”) give 11, 20, 23, and 13 circles at $s = 0, 1, 3, 8$, and 18, 11, 6, and 8 distinct combinations of shape, color, and background (with the Spanish prompt «círculo»: 11, 19, 21, and 16 circles; 18, 12, 7, and 7 combinations).
- Bias: in the data, 64.9% of circles are magenta (one image in two gets its shape’s typical color, the other a random one). Among the twenty-four images, 15 are magenta at $s = 1$ and 22 at $s = 3$.
- The never-seen (ten combinations left out of training, 16 noises per combination, $s = 3$): 86.4% correct on the 70 seen combinations and 75.6% on the 10 never-seen ones. At $s = 1$ the gap is wider: 85.6% versus 45.6%.
- What goes with what (60 pairs with swapped colors, in both languages): the encoder that reads word order picks the right sentence 100% of the time; the bag of words gives exactly the same vector to both sentences (0%: always a tie).

The shape and color counts come from a fixed-rule reader, not a learned one: the background is the most common color along the border, the shape is the rest, and the shape type is the template (circle, square, triangle, or cross, at several positions and sizes) that overlaps best; if none exceeds 0.6 intersection over union, the image counts as “no shape.” It reads all 20 real images in the lesson correctly. It is less reliable with squares: the model often draws them with rounded corners and the reader takes them for circles, so the scene does not use them for counting.

## In code

\`\`\`python
import numpy as np

def contrastive_loss(U, V, tau=0.07):
    """U, V: unit vectors of N images and N sentences (row i = pair i)."""
    S = U @ V.T / tau
    S = S - S.max(axis=1, keepdims=True)
    rows = -np.mean(np.diag(S) - np.log(np.exp(S).sum(axis=1)))
    S2 = (U @ V.T / tau).T
    S2 = S2 - S2.max(axis=1, keepdims=True)
    cols = -np.mean(np.diag(S2) - np.log(np.exp(S2).sum(axis=1)))
    return (rows + cols) / 2

rng = np.random.default_rng(0)
U = rng.normal(size=(4, 8)); U /= np.linalg.norm(U, axis=1, keepdims=True)
V_random = rng.normal(size=(4, 8)); V_random /= np.linalg.norm(V_random, axis=1, keepdims=True)
V_good = U + 0.1 * rng.normal(size=(4, 8)); V_good /= np.linalg.norm(V_good, axis=1, keepdims=True)
print(round(contrastive_loss(U, V_random), 3), round(contrastive_loss(U, V_good), 6))

def guidance(e_without, e_with, s):
    return e_without + s * (e_with - e_without)

e_without, e_with = np.array([0.2, -0.4]), np.array([0.5, 0.1])
for s in (0, 1, 3):
    print(s, guidance(e_without, e_with, s))
# 6.064 0.000141
# 0 [ 0.2 -0.4]
# 1 [0.5 0.1]
# 3 [1.1 1.1]
\`\`\`

With random sentences the error is high; with sentences almost identical to their image, the diagonal dominates and the error falls to nearly zero. The second function is the whole guidance scale.

## What comes next

Here text only went in: it was turned into a vector. In lesson 19 text comes out: a language model assigns probabilities to the next word and writes one word after another.`,
  },

  lens: {
    es: [
      'Procedencia y derechos: pregunta con qué datos se entrenó el modelo, con qué licencias y qué cubre el proveedor si hay un reclamo. La Oficina de Derechos de Autor de Estados Unidos reportó en 2025 decenas de demandas pendientes sobre el uso de obras para entrenar; la respuesta legal aún no está fijada.',
      'Suplantación: prohíbe en tu política generar imágenes de personas reales sin su consentimiento, revisa lo que se publica y no aceptes una imagen sola como prueba. Lo que tú publiques, márcalo: credenciales de contenido C2PA y, si el proveedor lo ofrece, marca de agua.',
      'Sesgos: el modelo repite y, con guiado, exagera lo frecuente en sus datos. Audita con muchas imágenes por prompt (no con una), sobre todo cuando aparecen personas, y revisa a quién representa y cómo.',
      'Control y reproducibilidad: guarda el prompt, la semilla y la escala de guiado de cada imagen que uses. Más guiado no siempre es mejor: reduce la variedad y, si se exagera, deforma.',
    ],
    en: [
      'Provenance and rights: ask what data the model was trained on, under what licenses, and what the vendor covers if there is a claim. The U.S. Copyright Office reported in 2025 dozens of pending lawsuits over using works for training; the legal answer is not settled yet.',
      'Impersonation: have your policy forbid generating images of real people without their consent, review what gets published, and never accept an image alone as proof. Mark what you publish: C2PA content credentials and, if the vendor offers it, a watermark.',
      'Bias: the model repeats, and with guidance exaggerates, whatever is frequent in its data. Audit with many images per prompt (not one), especially when people appear, and check who is shown and how.',
      'Control and reproducibility: keep the prompt, seed, and guidance scale of every image you use. More guidance is not always better: it reduces variety and, pushed too far, distorts.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué aprende CLIP durante su entrenamiento?', en: 'What does CLIP learn during training?' },
      options: [
        { es: 'A dibujar imágenes a partir de una frase.', en: 'To draw images from a sentence.' },
        { es: 'A clasificar imágenes en mil categorías escritas a mano.', en: 'To classify images into a thousand hand-written categories.' },
        { es: 'A poner el vector de cada imagen cerca del de su frase y lejos de los de las otras frases.', en: 'To put each image’s vector close to its sentence’s vector and far from the other sentences’ vectors.' },
        { es: 'A traducir frases del español al inglés.', en: 'To translate sentences from Spanish to English.' },
      ],
      answer: 2,
      why: {
        es: 'CLIP no genera imágenes: entrena un codificador de imágenes y uno de texto con una pérdida contrastiva, que enciende la diagonal de la tabla de similitudes (los pares correctos) y apaga el resto. Un generador usa después su codificador de texto para condicionarse.',
        en: 'CLIP does not generate images: it trains an image encoder and a text encoder with a contrastive loss that lights up the diagonal of the similarity table (the correct pairs) and dims the rest. A generator then uses its text encoder for conditioning.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Subes la escala de guiado de uno a tres con el mismo prompt. ¿Qué esperas?', en: 'You raise the guidance scale from one to three with the same prompt. What do you expect?' },
      options: [
        { es: 'Imágenes más fieles al prompt y menos variadas entre sí.', en: 'Images more faithful to the prompt and less varied from one another.' },
        { es: 'Imágenes más variadas y menos fieles al prompt.', en: 'Images more varied and less faithful to the prompt.' },
        { es: 'Las mismas imágenes, pero generadas más rápido.', en: 'The same images, just generated faster.' },
        { es: 'Que el modelo aprenda el prompt y lo recuerde la próxima vez.', en: 'The model learns the prompt and remembers it next time.' },
      ],
      answer: 0,
      why: {
        es: 'La escala multiplica lo que aporta la frase (con frase menos sin frase). Con «círculo», pasar de uno a tres subió los círculos y bajó las combinaciones distintas, con casi todo en magenta. Si se exagera mucho, las figuras se deforman.',
        en: 'The scale multiplies what the sentence adds (with sentence minus without). With “circle,” going from one to three raised the circles and lowered the distinct combinations, with almost everything magenta. Pushed too far, the shapes distort.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'En un paso, la red predice 0.2 sin frase y 0.5 con la frase. Con escala de guiado 3, ¿qué valor se usa?',
        en: 'At one step, the network predicts 0.2 without the sentence and 0.5 with it. With guidance scale 3, what value is used?',
      },
      options: [
        { es: '0.5', en: '0.5' },
        { es: '1.5', en: '1.5' },
        { es: '0.9', en: '0.9' },
        { es: '1.1', en: '1.1' },
      ],
      answer: 3,
      why: {
        es: 'Sin frase + escala × (con frase − sin frase) = 0.2 + 3 × 0.3 = 1.1. Multiplicar solo la predicción con frase daría 1.5; olvidar sumar la predicción sin frase, 0.9.',
        en: 'Without + scale × (with − without) = 0.2 + 3 × 0.3 = 1.1. Multiplying only the prediction with the sentence would give 1.5; forgetting to add the prediction without it, 0.9.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Tu equipo genera ilustraciones con el prompt «una enfermera atendiendo a un paciente» y casi todas muestran a una mujer joven. ¿Qué es lo más adecuado?',
        en: 'Your team generates illustrations with the prompt “a nurse caring for a patient,” and almost all of them show a young woman. What is the most appropriate response?',
      },
      options: [
        { es: 'Nada: si el modelo lo dibuja así, así es en la realidad.', en: 'Nothing: if the model draws it that way, that is how reality is.' },
        { es: 'Subir la escala de guiado para que el modelo obedezca mejor.', en: 'Raise the guidance scale so the model obeys better.' },
        { es: 'Reconocer un sesgo heredado de los datos, revisar muchas muestras antes de publicar y pedir de forma explícita la diversidad que se necesita.', en: 'Recognize a bias inherited from the data, review many samples before publishing, and explicitly ask for the diversity you need.' },
        { es: 'Cambiar de idioma el prompt, porque el sesgo solo existe en español.', en: 'Switch the prompt’s language, because the bias only exists in one language.' },
      ],
      answer: 2,
      why: {
        es: 'El modelo repite lo frecuente en sus datos y el guiado lo exagera, como el círculo magenta del juguete o los programadores del estudio de 2023. Subir la escala empeora la homogeneidad; hay que auditar con muchas muestras y pedir lo que falta.',
        en: 'The model repeats what is frequent in its data and guidance exaggerates it, like the toy’s magenta circle or the developers in the 2023 study. Raising the scale makes things more uniform; audit with many samples and ask for what is missing.',
      },
    },
  ],

  glossary: [
    'clip', 'contrastive-learning', 'prompt', 'conditioning',
    'embedding', 'cosine-similarity', 'vector-space', 'vector', 'pixel', 'training-data', 'batch', 'loss', 'weight',
    'generative-model', 'latent-space', 'vae', 'diffusion', 'denoising', 'latent-diffusion', 'guidance',
  ],

  terms: [
    {
      id: 'clip',
      term: { es: 'CLIP', en: 'CLIP' },
      def: {
        es: 'Método de OpenAI (2021) que entrena juntos un codificador de imágenes y uno de texto para que cada imagen y su descripción queden cerca en un mismo espacio de vectores. Se entrenó con unos 400 millones de pares de imagen y texto tomados de internet.',
        en: 'An OpenAI method (2021) that trains an image encoder and a text encoder together so each image and its description land close together in one shared vector space. It was trained on about 400 million image-and-text pairs taken from the internet.',
      },
    },
    {
      id: 'contrastive-learning',
      term: { es: 'Aprendizaje contrastivo', en: 'Contrastive learning' },
      def: {
        es: 'Entrenar comparando pares correctos con pares equivocados: acercar en el espacio de vectores lo que va junto y alejar el resto, sin etiquetas escritas a mano.',
        en: 'Training by comparing correct pairs with wrong ones: pulling together in vector space what belongs together and pushing the rest apart, without hand-written labels.',
      },
    },
    {
      id: 'prompt',
      term: { es: 'Prompt (instrucción)', en: 'Prompt' },
      def: {
        es: 'El texto con el que se le pide algo a un modelo generativo; en un generador de imágenes, la descripción de la imagen que se quiere.',
        en: 'The text used to ask a generative model for something; in an image generator, the description of the desired image.',
      },
    },
    {
      id: 'conditioning',
      term: { es: 'Condicionamiento', en: 'Conditioning' },
      def: {
        es: 'Darle a un modelo generativo una entrada extra (una etiqueta o el vector de una frase) que dirige lo que produce. Los generadores de imágenes se condicionan con el vector del prompt.',
        en: 'Giving a generative model an extra input (a label or a sentence’s vector) that steers what it produces. Image generators are conditioned on the prompt’s vector.',
      },
    },
  ],

  sources: [
    { title: 'Learning Transferable Visual Models From Natural Language Supervision (CLIP)', authors: 'Radford, A., Kim, J. W., Hallacy, C., Ramesh, A., Goh, G., Agarwal, S., Sastry, G., Askell, A., Mishkin, P., Clark, J., Krueger, G., Sutskever, I.', year: 2021, url: 'https://arxiv.org/abs/2103.00020' },
    { title: 'CLIP model card (Model Date: January 2021)', authors: 'OpenAI', year: 2021, url: 'https://github.com/openai/CLIP/blob/main/model-card.md' },
    { title: 'Classifier-Free Diffusion Guidance', authors: 'Ho, J., Salimans, T.', year: 2022, url: 'https://arxiv.org/abs/2207.12598' },
    { title: 'GLIDE: Towards Photorealistic Image Generation and Editing with Text-Guided Diffusion Models', authors: 'Nichol, A., Dhariwal, P., Ramesh, A., Shyam, P., Mishkin, P., McGrew, B., Sutskever, I., Chen, M.', year: 2021, url: 'https://arxiv.org/abs/2112.10741' },
    { title: 'Hierarchical Text-Conditional Image Generation with CLIP Latents (DALL·E 2), §7 Limitations and Risks', authors: 'Ramesh, A., Dhariwal, P., Nichol, A., Chu, C., Chen, M.', year: 2022, url: 'https://arxiv.org/abs/2204.06125' },
    { title: 'High-Resolution Image Synthesis with Latent Diffusion Models', authors: 'Rombach, R., Blattmann, A., Lorenz, D., Esser, P., Ommer, B.', year: 2022, url: 'https://arxiv.org/abs/2112.10752' },
    { title: 'Stable Diffusion v1-4 model card (CLIP ViT-L/14 text encoder; 10 % text-conditioning dropout)', authors: 'CompVis', year: 2022, url: 'https://huggingface.co/CompVis/stable-diffusion-v1-4' },
    { title: 'Diffusers: StableDiffusionPipeline (guidance_scale, default 7.5)', authors: 'Hugging Face', year: 2026, url: 'https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/text2img' },
    { title: 'Easily Accessible Text-to-Image Generation Amplifies Demographic Stereotypes at Large Scale (FAccT 2023)', authors: 'Bianchi, F., Kalluri, P., Durmus, E., Ladhak, F., Cheng, M., Nozza, D., Hashimoto, T., Jurafsky, D., Zou, J., Caliskan, A.', year: 2023, url: 'https://doi.org/10.1145/3593013.3594095' },
    { title: 'Copyright and Artificial Intelligence, Part 3: Generative AI Training (pre-publication version)', authors: 'U.S. Copyright Office', year: 2025, url: 'https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf' },
    { title: 'Copyright and Artificial Intelligence, Part 1: Digital Replicas', authors: 'U.S. Copyright Office', year: 2024, url: 'https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-1-Digital-Replicas-Report.pdf' },
    { title: 'C2PA and Content Credentials Explainer (version 2.2)', authors: 'Coalition for Content Provenance and Authenticity (C2PA)', year: 2025, url: 'https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html' },
    { title: 'SynthID: watermarking AI-generated content', authors: 'Google DeepMind', year: 2023, url: 'https://deepmind.google/models/synthid/' },
  ],
});
