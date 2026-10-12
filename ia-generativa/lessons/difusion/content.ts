import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'difusion',

  objectives: {
    es: [
      'Explicar el proceso hacia delante (mezclar una imagen con ruido, paso a paso, hasta que solo queda estática) y por qué deshacerlo de un salto es imposible y en muchos pasos pequeños, no.',
      'Describir, pieza por pieza, qué recibe y qué entrega la red de un modelo de difusión (imagen con ruido y paso → ruido estimado) y cómo se genera partiendo de estática pura.',
      'Reconocer qué hacen el guiado sin clasificador (exagerar la pista, a cambio de variedad) y la difusión latente (difundir en un espacio de códigos, mucho más barato).',
    ],
    en: [
      'Explain the forward process (mixing an image with noise, step by step, until only static is left) and why undoing it in one jump is impossible but in many small steps is not.',
      'Describe, piece by piece, what the network in a diffusion model takes in and returns (noisy image and step → estimated noise) and how generation starts from pure static.',
      'Recognize what classifier-free guidance does (exaggerating the hint, at the cost of variety) and what latent diffusion does (diffusing in a space of codes, which is far cheaper).',
    ],
  },

  segments: [
    // ── gancho y repaso ──
    {
      id: 'hook',
      es: 'Esto es estática: sesenta y cuatro píxeles al azar. Mira con calma: en unos segundos, una red diminuta la convierte en un siete que nunca existió.',
      en: 'This is static: sixty-four random pixels. Watch closely: in a few seconds, a tiny network turns it into a seven that never existed.',
      pad: 0.8,
    },
    {
      id: 'recall',
      es: 'En la lección quince, generar era aprender la distribución de los datos y sacar muestras nuevas. La difusión lo logra con una idea curiosa: aprender a destruir.',
      en: 'In lesson fifteen, generating meant learning the distribution of the data and drawing new samples. Diffusion gets there with a curious idea: learning to destroy.',
      pad: 0.3,
    },
    // ── qué es el ruido ──
    {
      id: 'destroy',
      es: 'Empecemos por destruir. Este es un siete real de ocho por ocho píxeles, el mismo de la lección quince. Cada píxel es un número: cero, vacío; uno, tinta llena.',
      en: 'Let’s start by destroying. This is a real seven, eight by eight pixels, the same one from lesson fifteen. Each pixel is a number: zero, empty; one, full ink.',
      pad: 0.3,
    },
    {
      id: 'noise-what',
      es: 'El ruido es otra cuadrícula igual, pero de números al azar: unos positivos, otros negativos, la mayoría cerca de cero. Más tinta, positivo; menos tinta, negativo.',
      en: 'Noise is another grid just like it, but of random numbers: some positive, some negative, most close to zero. More ink means positive; less ink, negative.',
      pad: 0.3,
    },
    {
      id: 'add-little',
      es: 'Sumamos al siete un poco de ese ruido, píxel por píxel: donde el ruido es positivo, el píxel gana tinta; donde es negativo, pierde. Se ensucia, pero se reconoce.',
      en: 'We add a little of that noise to the seven, pixel by pixel: where the noise is positive, the pixel gains ink; where it is negative, it loses some. It gets dirty, but you can tell.',
      pad: 0.3,
    },
    // ── el proceso hacia delante ──
    {
      id: 'steps',
      es: 'Y repetimos: en cada paso se mezcla con un poco más de ruido nuevo, cincuenta veces. A esto se le llama proceso hacia delante.',
      en: 'And we repeat: at each step it gets mixed with a bit more fresh noise, fifty times. This is called the forward process.',
      note: { es: 'Proceso hacia delante: mezclar con ruido, paso a paso, hasta que solo queda estática.', en: 'Forward process: mix in noise, step by step, until only static is left.' },
      pad: 0.5,
    },
    {
      id: 'fwd-demo',
      es: 'Mira el deslizador avanzar solo. A medio camino, el siete apenas se adivina; al final, en el paso cincuenta, solo queda estática.',
      en: 'Watch the slider move on its own. Halfway there, you can barely make out the seven; at the end, at step fifty, only static is left.',
      pad: 0.5,
    },
    {
      id: 'mix-bar',
      es: 'Esta barra dice qué parte de la mezcla todavía es imagen y qué parte es ruido. Mírala mientras el paso vuelve a avanzar.',
      en: 'This bar tells how much of the mix is still image and how much is noise. Watch it as the step moves forward again.',
      pad: 0.5,
    },
    {
      id: 'schedule',
      es: 'Cuánto ruido entra en cada paso está fijado de antemano, igual para todas las imágenes: es el calendario de ruido. Aquí nadie aprende nada.',
      en: 'How much noise goes in at each step is fixed in advance, the same for every image: that is the noise schedule. Nobody learns anything here.',
      note: { es: 'Calendario de ruido: cuánto ruido entra en cada paso; fijo de antemano.', en: 'Noise schedule: how much noise goes in at each step; fixed in advance.' },
      pad: 0.4,
    },
    {
      id: 'try-fwd',
      es: 'En el paso veinticinco, la mezcla es mitad imagen y mitad ruido. Si quieres, mueve tú el deslizador y mira cuánto queda del siete.',
      en: 'At step twenty-five, the mix is half image and half noise. If you like, move the slider yourself and see how much of the seven is left.',
      gate: { id: 'fwd', prompt: { es: 'lleva el deslizador del paso hasta el final.', en: 'take the step slider all the way to the end.' } },
      pad: 0.4,
    },
    {
      id: 'same-end',
      es: 'Con cualquier dígito pasa lo mismo: un tres, un cero y un ocho terminan en la misma clase de estática. Y fabricar estática nueva es facilísimo.',
      en: 'The same happens with any digit: a three, a zero, and an eight all end up as the same kind of static. And making fresh static is effortless.',
      pad: 0.5,
    },
    // ── por qué no de un salto ──
    {
      id: 'jump-q',
      es: 'Ahora, el regreso. ¿Se puede ir de la estática al dibujo de un salto? Esta estática pudo salir de un tres, de un cero o de cualquier otro dígito.',
      en: 'Now, the way back. Can you go from static to the drawing in one jump? This static could have come from a three, a zero, or any other digit.',
      pad: 0.3,
    },
    {
      id: 'jump-blur',
      es: 'De un salto, lo que menos se equivoca en promedio es adivinar el promedio de todos los dígitos: esta mancha, que no es ninguno.',
      en: 'In one jump, the guess that is least wrong on average is the average of all the digits: this smudge, which is none of them.',
      pad: 0.3,
    },
    {
      id: 'small-step',
      es: 'En cambio, un paso pequeño sí se puede deshacer: entre el paso veinte y el diecinueve la imagen casi no cambia, y lo que sobra se puede estimar.',
      en: 'A small step, though, can be undone: between step twenty and step nineteen the image barely changes, and what is extra can be estimated.',
      note: { es: 'De un salto es imposible; en muchos pasos pequeños, sí.', en: 'In one jump it is impossible; in many small steps, it works.' },
      pad: 0.3,
    },
    // ── la red que estima el ruido, pieza por pieza ──
    {
      id: 'net-in1',
      es: 'Para cada paso pequeño se usa una red neuronal. Su primera entrada es la imagen con ruido: aquí, el siete en el paso veinte.',
      en: 'Each small step uses a neural network. Its first input is the noisy image: here, the seven at step twenty.',
      pad: 0.3,
    },
    {
      id: 'net-in2',
      es: 'La segunda entrada es el número del paso, que dice cuánto ruido tiene la imagen. Con eso, la red sabe si debe quitar mucho o poco.',
      en: 'The second input is the step number, which says how much noise the image has. With it, the network knows whether to remove a lot or a little.',
      pad: 0.3,
    },
    {
      id: 'net-out',
      es: 'Lo que sale es su estimación del ruido: una cuadrícula con lo que, según la red, ensucia cada píxel.',
      en: 'What comes out is its estimate of the noise: a grid with what, according to the network, is dirtying each pixel.',
      pad: 0.4,
    },
    {
      id: 'net-step',
      es: 'Se resta una parte de esa estimación y queda una imagen un poco más limpia, la del paso diecinueve. Es quitar ruido, en inglés denoising.',
      en: 'Part of that estimate is subtracted, leaving a slightly cleaner image, the one for step nineteen. That is removing noise, or denoising.',
      pad: 0.4,
    },
    {
      id: 'train-idea',
      es: '¿Cómo aprende a estimarlo? Tomamos un dígito real, elegimos un paso al azar y le sumamos ruido. Ese ruido lo fabricamos nosotros: conocemos la respuesta.',
      en: 'How does it learn to estimate it? We take a real digit, pick a random step, and add noise. We made that noise ourselves: we know the answer.',
      pad: 0.3,
    },
    {
      id: 'train-loss',
      es: 'La red da su estimación, se compara píxel por píxel con el ruido verdadero, y el error se reduce con descenso del gradiente, como en la parte uno.',
      en: 'The network gives its estimate, it is compared pixel by pixel with the true noise, and the error is reduced with gradient descent, as in part one.',
      note: { es: 'La red aprende a estimar el ruido: imagen con ruido + paso → ruido estimado.', en: 'The network learns to estimate the noise: noisy image + step → estimated noise.' },
      pad: 0.3,
    },
    {
      id: 'train-free',
      es: 'Como el ruido se fabrica al azar, los ejemplos con respuesta no se acaban. Esta red practicó con casi ocho millones de versiones con ruido de mil quinientos dígitos.',
      en: 'Since the noise is made at random, examples with answers never run out. This network practiced on almost eight million noisy versions of fifteen hundred digits.',
      pad: 0.4,
    },
    // ── el regreso completo, en píxeles ──
    {
      id: 'reverse-pixels',
      es: 'Ahora, el regreso completo: partimos de estática pura y repetimos el paso pequeño cincuenta veces. Mira el contador: el siete aparece poco a poco.',
      en: 'Now, the whole way back: we start from pure static and repeat the small step fifty times. Watch the counter: the seven appears little by little.',
      note: { es: 'Generar: partir de estática y quitar un poco de ruido, cincuenta veces.', en: 'Generating: start from static and remove a little noise, fifty times.' },
      pad: 0.8,
    },
    {
      id: 'reverse-new',
      es: 'Con otra estática de partida sale otro siete, distinto, que no estaba guardado en ningún lado. ¿Por qué siempre un siete? Hay una pista escondida.',
      en: 'Different starting static gives a different seven, one that was not stored anywhere. Why always a seven? There is a hidden hint.',
      pad: 0.4,
    },
    // ── el proceso inverso en un plano ──
    {
      id: 'plane-intro',
      es: 'Para ver qué hace cada paso, pasemos a un plano. Estos mil quinientos puntos son los códigos del VAE de la lección quince: cada uno resume un dígito.',
      en: 'To see what each step does, let’s move to a plane. These fifteen hundred points are the codes from lesson fifteen’s VAE: each one sums up a digit.',
      pad: 0.4,
    },
    {
      id: 'plane-groups',
      es: 'Los dígitos iguales quedaron juntos: aquí los ceros, aquí los cuatros, aquí los sietes. Esa forma, con sus grupos, es la distribución que hay que imitar.',
      en: 'Matching digits ended up together: the zeros here, the fours here, the sevens here. That shape, with its groups, is the distribution to imitate.',
      pad: 0.3,
    },
    {
      id: 'plane-fwd',
      es: 'Con la misma receta de cincuenta pasos, el ruido deshace la nube: los grupos se borran y queda una mancha redonda, sin forma.',
      en: 'With the same fifty-step recipe, noise undoes the cloud: the groups fade away, leaving a round, shapeless blob.',
      pad: 0.6,
    },
    {
      id: 'plane-start',
      es: 'Para generar, partimos de doscientos puntos nuevos, de pura estática, sacados de esa mancha redonda. Ninguno es un dato.',
      en: 'To generate, we start from two hundred new points of pure static, drawn from that round blob. None of them is a data point.',
      pad: 0.3,
    },
    {
      id: 'plane-arrows',
      es: 'La red estima el ruido de cada punto, y quitarlo lo mueve un poco. Cada flecha muestra hacia dónde irá su punto en este paso.',
      en: 'The network estimates each point’s noise, and removing it moves the point a little. Each arrow shows where its point will go in this step.',
      pad: 0.4,
    },
    {
      id: 'plane-rev-demo',
      es: 'Mira el deslizador avanzar paso a paso: los puntos se reparten y se van juntando en grupos, justo donde estaban los datos.',
      en: 'Watch the slider advance step by step: the points spread out and gather into groups, right where the data was.',
      pad: 0.8,
    },
    {
      id: 'try-rev',
      es: 'Si quieres, recorre tú los pasos con el deslizador, hacia delante y hacia atrás, y fíjate en qué paso aparecen los grupos.',
      en: 'If you like, go through the steps yourself with the slider, forward and back, and notice at which step the groups appear.',
      gate: { id: 'rev', prompt: { es: 'lleva el deslizador del regreso de un extremo al otro.', en: 'move the reverse-step slider from one end to the other.' } },
      pad: 0.4,
    },
    {
      id: 'plane-match',
      es: 'Al final, los puntos nuevos caen donde viven los datos, que se ven en tenue, y ninguno es copia de uno real: es muestrear de la distribución.',
      en: 'In the end, the new points land where the data lives, shown faintly, and none is a copy of a real one: this is sampling from the distribution.',
      pad: 0.3,
    },
    {
      id: 'plane-decode',
      es: 'Y como cada punto es un código, el decodificador del VAE lo dibuja. Estos seis puntos nuevos dan dígitos de varios tipos.',
      en: 'And since each point is a code, the VAE’s decoder draws it. These six new points give digits of several kinds.',
      pad: 0.4,
    },
    // ── la pista: guiado sin clasificador ──
    {
      id: 'hint-q',
      es: 'Ahora, la pista escondida. Sin ella, cada punto cae en cualquier grupo. La red de píxeles dibujaba sietes porque recibía una tercera entrada: la etiqueta.',
      en: 'Now, the hidden hint. Without it, each point lands in any group. The pixel network drew sevens because it got a third input: the label.',
      pad: 0.3,
    },
    {
      id: 'hint-train',
      es: 'Al entrenar, cada dígito llega con su etiqueta, pero quince de cada cien veces se la ocultamos. Así, la misma red aprende con pista y sin pista.',
      en: 'During training, each digit comes with its label, but fifteen times out of a hundred we hide it. That way, one network learns with and without the hint.',
      pad: 0.3,
    },
    {
      id: 'hint-two',
      es: 'Al generar, en cada paso se le pregunta dos veces por cada punto: sin pista, y con la pista «siete». Salen dos flechas distintas.',
      en: 'When generating, at each step it is asked twice about each point: without a hint, and with the hint “seven.” Two different arrows come out.',
      pad: 0.4,
    },
    {
      id: 'hint-amp',
      es: 'La diferencia entre las dos apunta hacia los sietes. El truco es exagerarla: multiplicarla por un número, la escala de guiado. Aquí, por tres.',
      en: 'The difference between them points toward the sevens. The trick is to exaggerate it: multiply it by a number, the guidance scale. Here, by three.',
      pad: 0.4,
    },
    {
      id: 'cfg-name',
      es: 'Se llama guiado sin clasificador, en inglés classifier-free guidance: no hace falta otra red que juzgue; basta la misma, con y sin pista.',
      en: 'This is called classifier-free guidance: no second network is needed to judge the result; the same one, with and without the hint, is enough.',
      note: { es: 'Guiado: exagerar la diferencia entre la estimación con pista y la estimación sin pista.', en: 'Guidance: exaggerate the difference between the estimate with the hint and the one without it.' },
      pad: 0.3,
    },
    {
      id: 'scale-demo',
      es: 'Mira la escala moverse sola. Con cero, la pista no cuenta: salen dígitos de todo tipo. Con uno, casi solo sietes. Con cinco, solo sietes, amontonados en una orilla.',
      en: 'Watch the scale move on its own. At zero, the hint does not count: all kinds of digits come out. At one, almost only sevens. At five, only sevens, crowded at one edge.',
      pad: 0.8,
    },
    {
      id: 'trade',
      es: 'El precio: con escala cinco, casi todos los sietes reales se quedan sin ningún punto nuevo cerca, y los nuevos se parecen mucho entre sí. Más fidelidad, menos variedad.',
      en: 'The price: at scale five, almost every real seven is left with no new point nearby, and the new ones look very much alike. More fidelity, less variety.',
      pad: 0.4,
    },
    {
      id: 'try-scale',
      es: 'Si quieres, mueve tú la escala de guiado y mira cómo cambian los puntos, la fila de dígitos y los sietes que quedan sin cubrir.',
      en: 'If you like, move the guidance scale yourself and watch the points, the row of digits, and the uncovered sevens change.',
      gate: { id: 'scale', prompt: { es: 'prueba una escala baja y una alta.', en: 'try a low scale and a high one.' } },
      pad: 0.4,
    },
    // ── difusión latente ──
    {
      id: 'latent-what',
      es: 'Fíjate en lo que hicimos: la difusión ocurrió en el plano de códigos, y solo al final el decodificador dibujó los píxeles. Eso es difusión latente.',
      en: 'Notice what we did: diffusion happened on the plane of codes, and only at the end did the decoder draw the pixels. That is latent diffusion.',
      note: { es: 'Difusión latente: difundir en el espacio de códigos y decodificar al final.', en: 'Latent diffusion: diffuse in the space of codes and decode at the end.' },
      pad: 0.4,
    },
    {
      id: 'latent-cost',
      es: 'La ventaja es el costo: cada paso trabajó con dos números en lugar de sesenta y cuatro píxeles. Con fotos grandes, la diferencia es enorme.',
      en: 'The advantage is cost: each step worked with two numbers instead of sixty-four pixels. With large photos, the difference is huge.',
      pad: 0.4,
    },
    {
      id: 'sd',
      es: 'Así funciona Stable Diffusion, liberado en agosto de dos mil veintidós: una foto de quinientos doce por quinientos doce, casi ochocientos mil números, se vuelve un código de unos dieciséis mil.',
      en: 'Stable Diffusion, released in August twenty twenty-two, works this way: a five-hundred-twelve-pixel square photo, almost eight hundred thousand numbers, becomes a code of about sixteen thousand.',
      pad: 0.5,
    },
    // ── historia y costo ──
    {
      id: 'history',
      es: 'La idea de generar deshaciendo el ruido paso a paso se publicó en dos mil quince. En dos mil veinte, el método DDPM la llevó a imágenes de gran calidad.',
      en: 'The idea of generating by undoing noise step by step was published in twenty fifteen. In twenty twenty, the DDPM method brought it to high-quality images.',
      tts: {
        es: 'La idea de generar deshaciendo el ruido paso a paso se publicó en dos mil quince. En dos mil veinte, el método de de pe eme la llevó a imágenes de gran calidad.',
        en: 'The idea of generating by undoing noise step by step was published in twenty fifteen. In twenty twenty, the D D P M method brought it to high-quality images.',
      },
      pad: 0.4,
    },
    {
      id: 'steps-cost',
      es: 'Su precio es el tiempo: cada imagen pide muchos pasos de la red. DDPM usaba mil y esta lección, cincuenta; métodos como DDIM aceleran de diez a cincuenta veces.',
      en: 'Its price is time: each image needs many network steps. DDPM used a thousand and this lesson, fifty; methods like DDIM speed it up ten to fifty times.',
      tts: {
        es: 'Su precio es el tiempo: cada imagen pide muchos pasos de la red. De de pe eme usaba mil y esta lección, cincuenta; métodos como de de i eme aceleran de diez a cincuenta veces.',
        en: 'Its price is time: each image needs many network steps. D D P M used a thousand and this lesson, fifty; methods like D D I M speed it up ten to fifty times.',
      },
      pad: 0.4,
    },
    // ── cierre ──
    {
      id: 'recap',
      es: 'En resumen: destruir con ruido es fácil; una red aprende a estimar ese ruido; y generar es quitarlo poco a poco desde estática pura, con una pista que guía.',
      en: 'In short: destroying with noise is easy; a network learns to estimate that noise; and generating is removing it bit by bit from pure static, with a hint to steer.',
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'En los sistemas reales, la pista es una frase, como «un gato astronauta». ¿Cómo entiende el modelo lo que le pides con palabras? Lo veremos en la siguiente lección.',
      en: 'In real systems, the hint is a sentence, like “an astronaut cat.” How does the model understand what you ask for in words? We will see in the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'El proceso hacia delante mezcla una imagen con ruido, paso a paso, según un calendario fijo, hasta que solo queda estática. No aprende nada, y al final toda imagen termina en la misma clase de estática, fácil de fabricar.',
      'Deshacer el ruido de un salto es imposible: la misma estática pudo venir de cualquier imagen y lo mejor que se puede adivinar es un promedio borroso. Un paso pequeño, en cambio, sí se puede estimar.',
      'La red recibe la imagen con ruido y el número del paso, y estima el ruido. Se entrena con ejemplos que nunca se acaban: el ruido lo fabricamos nosotros, así que conocemos la respuesta.',
      'Generar es partir de estática pura y quitar un poco del ruido estimado, muchas veces. Con otra estática sale otro resultado: nada estaba guardado.',
      'El guiado sin clasificador exagera la diferencia entre la estimación con pista y sin pista: más fidelidad, menos variedad. La difusión latente hace todo esto en un espacio de códigos mucho más pequeño y decodifica al final; así funciona Stable Diffusion.',
    ],
    en: [
      'The forward process mixes an image with noise, step by step, on a fixed schedule, until only static is left. It learns nothing, and in the end every image ends up as the same kind of static, which is easy to make.',
      'Undoing the noise in one jump is impossible: the same static could have come from any image, and the best possible guess is a blurry average. A small step, by contrast, can be estimated.',
      'The network takes the noisy image and the step number, and estimates the noise. It is trained on examples that never run out: we make the noise ourselves, so we know the answer.',
      'Generating means starting from pure static and removing a little of the estimated noise, many times. Different static gives a different result: nothing was stored.',
      'Classifier-free guidance exaggerates the difference between the estimate with the hint and without it: more fidelity, less variety. Latent diffusion does all of this in a much smaller space of codes and decodes at the end; that is how Stable Diffusion works.',
    ],
  },

  misconception: {
    wrong: { es: 'La red «limpia» una imagen que ya estaba escondida en la estática: solo la descubre.', en: 'The network “cleans up” an image that was already hidden in the static: it just uncovers it.' },
    right: { es: 'En la estática no hay ninguna imagen. Paso a paso, la red va decidiendo qué dibujo es plausible según lo que aprendió de los datos; con otra estática, o con otra pista, sale otro dibujo distinto.', en: 'There is no image in the static. Step by step, the network decides what drawing is plausible given what it learned from the data; with different static, or a different hint, a different drawing comes out.' },
  },

  deeper: {
    es: `## El proceso hacia delante

Con un calendario de ruido $\\beta_1,\\dots,\\beta_T$, sea $\\alpha_t = 1-\\beta_t$ y $\\bar\\alpha_t = \\prod_{s\\le t}\\alpha_s$. Cada paso es $q(x_t\\mid x_{t-1}) = \\mathcal N\\big(\\sqrt{\\alpha_t}\\,x_{t-1},\\ \\beta_t I\\big)$, y al encadenarlos sale una fórmula cerrada para cualquier paso:

$$x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I).$$

La barra de la lección muestra $\\bar\\alpha_t$ (la parte de la «energía» de la mezcla que todavía es imagen) y $1-\\bar\\alpha_t$ (la que es ruido). La lección usa $T = 50$ y el calendario coseno de Nichol y Dhariwal (2021), $\\bar\\alpha(t) \\propto \\cos^2\\!\\big(\\tfrac{t/T + s}{1+s}\\cdot\\tfrac{\\pi}{2}\\big)$ con $s = 0.008$, recortando cada $\\beta_t$ a 0.35 como máximo (con tan pocos pasos, los últimos $\\beta$ del coseno se acercan a 1). Así $\\bar\\alpha$ vale 0.899 en el paso 10, 0.494 en el 25, 0.094 en el 40 y 0.003 en el 50. Los píxeles se pasan antes a la escala $-1\\ldots 1$; en pantalla se recorta a $0\\ldots 1$.

## Por qué no de un salto

La red se entrena con error cuadrático, y lo que minimiza el error cuadrático es el promedio condicionado $\\mathbb E[x_0\\mid x_t]$. Cuando $t = T$ la estática casi no conserva información, así que $\\mathbb E[x_0\\mid x_T]\\approx \\mathbb E[x_0]$: el promedio de todos los dígitos, la mancha de la lección. En cambio, si cada $\\beta_t$ es pequeño, el paso inverso $q(x_{t-1}\\mid x_t)$ es casi gaussiano, con la misma forma que el paso hacia delante (Sohl-Dickstein et al., 2015, que citan a Feller, 1949): basta estimar su media.

## Qué aprende la red y cómo se entrena

La red $\\varepsilon_\\theta(x_t, t, c)$ estima el ruido. La pérdida simplificada de Ho et al. (2020) es

$$L(\\theta) = \\mathbb E_{x_0,\\,t,\\,\\varepsilon}\\big[\\,\\lVert \\varepsilon - \\varepsilon_\\theta(\\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\ t)\\rVert^2\\,\\big].$$

Gracias a la fórmula cerrada no hace falta recorrer los pasos al entrenar: se salta directo a un $t$ al azar. La red de píxeles de la lección tiene 53 056 parámetros (tres capas de 128 neuronas con conexiones residuales y SiLU; entradas: los 64 píxeles, 16 números que codifican el paso y la etiqueta en 11 casillas, la última para «sin pista») y se entrenó 30 000 rondas con lotes de 256 imágenes: 7 680 000 versiones con ruido de los 1500 dígitos de entrenamiento de la lección 15. Con la imagen del siete en el paso 20, su estimación del ruido tiene un error cuadrático medio de 0.135 por píxel; si dijera «no hay ruido», el error sería 0.864.

## El muestreo

El muestreo original de DDPM parte de $x_T\\sim\\mathcal N(0,I)$ y, para $t=T,\\dots,1$, calcula

$$x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\Big(x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar\\alpha_t}}\\,\\hat\\varepsilon\\Big) + \\sqrt{\\beta_t}\\, z,\\qquad z\\sim\\mathcal N(0,I),$$

con un poco de ruido nuevo $z$ en cada paso (salvo el último). La escena usa la variante determinista de Song et al. (2021), DDIM con $\\eta = 0$, con la misma red entrenada como en DDPM:

$$\\hat x_0 = \\frac{x_t - \\sqrt{1-\\bar\\alpha_t}\\,\\hat\\varepsilon}{\\sqrt{\\bar\\alpha_t}},\\qquad x_{t-1} = \\sqrt{\\bar\\alpha_{t-1}}\\,\\hat x_0 + \\sqrt{1-\\bar\\alpha_{t-1}}\\,\\hat\\varepsilon .$$

Es decir: con la estimación del ruido se calcula la imagen limpia que implica y se vuelve a mezclar con la parte de ruido que le toca al paso anterior. Sin ruido nuevo, cada punto del plano sigue exactamente su flecha y la misma estática da siempre el mismo resultado; con otra estática sale otro.

## Guiado sin clasificador

Se entrena una sola red con la etiqueta $c$ y, con probabilidad 0.15, sin ella ($\\varnothing$). Al muestrear se combina

$$\\hat\\varepsilon = \\varepsilon_\\theta(x_t,\\varnothing) + s\\,\\big(\\varepsilon_\\theta(x_t,c)-\\varepsilon_\\theta(x_t,\\varnothing)\\big).$$

Con $s=0$ es la estimación sin pista (la pista se ignora); con $s=1$, la condicional, que sigue la pista tal cual; con $s>1$ se exagera la dirección de la pista. Es la misma convención de la lección 18. Ho y Salimans (2022) escriben lo mismo con $w = s-1$: $\\tilde\\varepsilon = (1+w)\\,\\varepsilon_\\theta(x_t,c) - w\\,\\varepsilon_\\theta(x_t)$. Cada paso guiado cuesta dos evaluaciones de la red. En el plano de la lección, con la pista «siete» y doscientos puntos (lector: la regresión logística de la lección 15), se leen como siete 26 con $s = 0$, 199 con $s = 1$ y 200 con $s = 5$. A la vez, los sietes reales que se quedan sin ningún punto nuevo a menos de 0.3 son 4 de 154 con $s = 1$, 48 con $s = 2$, 95 con $s = 3$ y 144 con $s = 5$: los puntos se amontonan en la orilla del grupo más alejada de los demás dígitos. La red de píxeles genera sus sietes con $s = 3$.

## Difusión latente

Un autocodificador comprime la imagen a un código $z=E(x)$; la difusión ocurre en $z$ y al final se decodifica $x=D(z)$ (Rombach et al., 2022). En la lección, $z$ son los dos números del VAE de la lección 15, multiplicados por 1.6 antes de difundir (Stable Diffusion también reescala sus códigos con un factor fijo), y la red del plano tiene 10 370 parámetros. En Stable Diffusion v1, el autocodificador reduce cada lado 8 veces y entrega 4 canales: una imagen de $512\\times512\\times3 = 786\\,432$ números se vuelve un código de $64\\times64\\times4 = 16\\,384$, 48 veces menos.

## En código

\`\`\`python
import numpy as np

T, s = 50, 0.008
f = lambda t: np.cos((t / T + s) / (1 + s) * np.pi / 2) ** 2
a_full = f(np.arange(T + 1)) / f(0)
betas = np.clip(1 - a_full[1:] / a_full[:-1], 1e-4, 0.35)   # calendario de ruido
alphas = 1 - betas
abar = np.cumprod(alphas)
print('imagen en la mezcla (%):', [round(float(100 * abar[t - 1]), 1) for t in (10, 25, 40, 50)])

# Datos de juguete: un solo número que vale -1 o +1. Para ellos, el mejor
# estimador del ruido se puede escribir a mano (en la lección lo aprende una red).
def ruido_estimado(x, i):
    a, b = np.sqrt(abar[i]), np.sqrt(1 - abar[i])
    x0 = np.tanh(a * x / b**2)          # promedio de x0 dado x_t
    return (x - a * x0) / b

rng = np.random.default_rng(0)
x = rng.standard_normal(10_000)        # estática pura
for i in reversed(range(T)):           # cincuenta pasos de regreso (DDPM)
    e = ruido_estimado(x, i)
    x = (x - betas[i] / np.sqrt(1 - abar[i]) * e) / np.sqrt(alphas[i])
    if i > 0:
        x += np.sqrt(betas[i]) * rng.standard_normal(x.size)

print('a menos de 0.1 de -1 o de +1:', round(float(np.mean(np.abs(np.abs(x) - 1) < 0.1)), 3))
print('fracción en +1:', round(float(np.mean(x > 0)), 3))
# imagen en la mezcla (%): [89.9, 49.4, 9.4, 0.3]
# a menos de 0.1 de -1 o de +1: 1.0
# fracción en +1: 0.499
\`\`\`

## Lo que viene

La lección 18 muestra cómo una frase se convierte en la pista que guía la difusión (CLIP y el condicionamiento por texto). Más adelante, el transformer (lecciones 21 y 22) reemplaza a la red convolucional en muchos modelos de difusión modernos.`,
    en: `## The forward process

With a noise schedule $\\beta_1,\\dots,\\beta_T$, let $\\alpha_t = 1-\\beta_t$ and $\\bar\\alpha_t = \\prod_{s\\le t}\\alpha_s$. Each step is $q(x_t\\mid x_{t-1}) = \\mathcal N\\big(\\sqrt{\\alpha_t}\\,x_{t-1},\\ \\beta_t I\\big)$, and chaining them gives a closed form for any step:

$$x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I).$$

The lesson’s bar shows $\\bar\\alpha_t$ (the share of the mix’s “energy” that is still image) and $1-\\bar\\alpha_t$ (the share that is noise). The lesson uses $T = 50$ and the cosine schedule of Nichol and Dhariwal (2021), $\\bar\\alpha(t) \\propto \\cos^2\\!\\big(\\tfrac{t/T + s}{1+s}\\cdot\\tfrac{\\pi}{2}\\big)$ with $s = 0.008$, clipping each $\\beta_t$ to at most 0.35 (with so few steps, the last cosine $\\beta$ values approach 1). So $\\bar\\alpha$ is 0.899 at step 10, 0.494 at 25, 0.094 at 40, and 0.003 at 50. Pixels are first mapped to the range $-1\\ldots 1$; on screen they are clipped to $0\\ldots 1$.

## Why not in one jump

The network is trained with squared error, and what minimizes squared error is the conditional mean $\\mathbb E[x_0\\mid x_t]$. At $t = T$ the static keeps almost no information, so $\\mathbb E[x_0\\mid x_T]\\approx \\mathbb E[x_0]$: the average of all the digits, the lesson’s smudge. By contrast, if each $\\beta_t$ is small, the reverse step $q(x_{t-1}\\mid x_t)$ is nearly Gaussian, with the same form as the forward step (Sohl-Dickstein et al., 2015, citing Feller, 1949): estimating its mean is enough.

## What the network learns and how it is trained

The network $\\varepsilon_\\theta(x_t, t, c)$ estimates the noise. The simplified loss of Ho et al. (2020) is

$$L(\\theta) = \\mathbb E_{x_0,\\,t,\\,\\varepsilon}\\big[\\,\\lVert \\varepsilon - \\varepsilon_\\theta(\\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\ t)\\rVert^2\\,\\big].$$

Thanks to the closed form, training does not need to walk through the steps: it jumps straight to a random $t$. The lesson’s pixel network has 53,056 parameters (three layers of 128 neurons with residual connections and SiLU; inputs: the 64 pixels, 16 numbers encoding the step, and the label in 11 slots, the last one meaning “no hint”) and was trained for 30,000 rounds with batches of 256 images: 7,680,000 noisy versions of lesson 15’s 1,500 training digits. With the seven at step 20, its noise estimate has a mean squared error of 0.135 per pixel; if it said “there is no noise,” the error would be 0.864.

## Sampling

DDPM’s original sampler starts from $x_T\\sim\\mathcal N(0,I)$ and, for $t=T,\\dots,1$, computes

$$x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\Big(x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar\\alpha_t}}\\,\\hat\\varepsilon\\Big) + \\sqrt{\\beta_t}\\, z,\\qquad z\\sim\\mathcal N(0,I),$$

with a little fresh noise $z$ at each step (except the last). The scene uses the deterministic variant of Song et al. (2021), DDIM with $\\eta = 0$, with the same network trained as in DDPM:

$$\\hat x_0 = \\frac{x_t - \\sqrt{1-\\bar\\alpha_t}\\,\\hat\\varepsilon}{\\sqrt{\\bar\\alpha_t}},\\qquad x_{t-1} = \\sqrt{\\bar\\alpha_{t-1}}\\,\\hat x_0 + \\sqrt{1-\\bar\\alpha_{t-1}}\\,\\hat\\varepsilon .$$

That is: the noise estimate gives the clean image it implies, which is then mixed again with the share of noise that belongs to the previous step. With no fresh noise, each point on the plane follows its arrow exactly and the same static always gives the same result; different static gives a different one.

## Classifier-free guidance

A single network is trained with the label $c$ and, with probability 0.15, without it ($\\varnothing$). When sampling, they are combined:

$$\\hat\\varepsilon = \\varepsilon_\\theta(x_t,\\varnothing) + s\\,\\big(\\varepsilon_\\theta(x_t,c)-\\varepsilon_\\theta(x_t,\\varnothing)\\big).$$

With $s=0$ it is the estimate without the hint (the hint is ignored); with $s=1$, the conditional, which follows the hint as is; with $s>1$ the hint’s direction is exaggerated. It is the same convention as in lesson 18. Ho and Salimans (2022) write the same with $w = s-1$: $\\tilde\\varepsilon = (1+w)\\,\\varepsilon_\\theta(x_t,c) - w\\,\\varepsilon_\\theta(x_t)$. Each guided step costs two network evaluations. On the lesson’s plane, with the hint “seven” and two hundred points (reader: lesson 15’s logistic regression), 26 are read as sevens with $s = 0$, 199 with $s = 1$, and 200 with $s = 5$. At the same time, the real sevens left with no new point within 0.3 number 4 of 154 with $s = 1$, 48 with $s = 2$, 95 with $s = 3$, and 144 with $s = 5$: the points crowd onto the edge of the group farthest from the other digits. The pixel network generates its sevens with $s = 3$.

## Latent diffusion

An autoencoder compresses the image into a code $z=E(x)$; diffusion happens in $z$ and at the end $x=D(z)$ is decoded (Rombach et al., 2022). In the lesson, $z$ is the two numbers of lesson 15’s VAE, multiplied by 1.6 before diffusing (Stable Diffusion also rescales its codes by a fixed factor), and the plane network has 10,370 parameters. In Stable Diffusion v1, the autoencoder shrinks each side 8 times and outputs 4 channels: a $512\\times512\\times3 = 786{,}432$-number image becomes a $64\\times64\\times4 = 16{,}384$-number code, 48 times fewer.

## In code

\`\`\`python
import numpy as np

T, s = 50, 0.008
f = lambda t: np.cos((t / T + s) / (1 + s) * np.pi / 2) ** 2
a_full = f(np.arange(T + 1)) / f(0)
betas = np.clip(1 - a_full[1:] / a_full[:-1], 1e-4, 0.35)   # noise schedule
alphas = 1 - betas
abar = np.cumprod(alphas)
print('image share of the mix (%):', [round(float(100 * abar[t - 1]), 1) for t in (10, 25, 40, 50)])

# Toy data: a single number that is -1 or +1. For it, the best possible
# noise estimator can be written by hand (in the lesson a network learns it).
def estimated_noise(x, i):
    a, b = np.sqrt(abar[i]), np.sqrt(1 - abar[i])
    x0 = np.tanh(a * x / b**2)          # mean of x0 given x_t
    return (x - a * x0) / b

rng = np.random.default_rng(0)
x = rng.standard_normal(10_000)        # pure static
for i in reversed(range(T)):           # fifty steps back (DDPM)
    e = estimated_noise(x, i)
    x = (x - betas[i] / np.sqrt(1 - abar[i]) * e) / np.sqrt(alphas[i])
    if i > 0:
        x += np.sqrt(betas[i]) * rng.standard_normal(x.size)

print('within 0.1 of -1 or +1:', round(float(np.mean(np.abs(np.abs(x) - 1) < 0.1)), 3))
print('share at +1:', round(float(np.mean(x > 0)), 3))
# image share of the mix (%): [89.9, 49.4, 9.4, 0.3]
# within 0.1 of -1 or +1: 1.0
# share at +1: 0.499
\`\`\`

## What comes next

Lesson 18 shows how a sentence becomes the hint that guides diffusion (CLIP and text conditioning). Later on, the transformer (lessons 21 and 22) replaces the convolutional network in many modern diffusion models.`,
  },

  lens: {
    es: [
      'El costo de generar es pasos × evaluaciones de la red × imágenes. El guiado sin clasificador duplica las evaluaciones por paso: para campañas masivas, estima el volumen y compara configuraciones con menos pasos o menor resolución.',
      'La escala de guiado es una perilla de negocio: más alta da resultados más fieles a lo pedido, pero más parecidos entre sí. Prueba varias escalas con tus propios casos antes de fijarla.',
      'La calidad aparente engaña: revisa detalles (texto dentro de la imagen, manos, logotipos) y mantén revisión humana antes de publicar.',
      'Estos modelos aprenden de grandes colecciones de imágenes reales: pregunta al proveedor de dónde vienen los datos, qué licencias cubren y qué política de uso y de etiquetado de imágenes sintéticas ofrece.',
    ],
    en: [
      'The cost of generating is steps × network evaluations × images. Classifier-free guidance doubles the evaluations per step: for large campaigns, estimate the volume and compare setups with fewer steps or lower resolution.',
      'The guidance scale is a business dial: higher gives results more faithful to the request, but more alike. Try several scales on your own cases before settling on one.',
      'Apparent quality is deceiving: check details (text inside the image, hands, logos) and keep human review before publishing.',
      'These models learn from large collections of real images: ask the vendor where the data comes from, what licenses cover it, and what usage and synthetic-image labeling policy it offers.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué aprende la red de un modelo de difusión?', en: 'What does the network in a diffusion model learn?' },
      options: [
        { es: 'A guardar las imágenes de entrenamiento para recortarlas después.', en: 'To store the training images so it can cut them up later.' },
        { es: 'A añadir ruido a las imágenes, paso a paso.', en: 'To add noise to images, step by step.' },
        { es: 'A estimar el ruido de una imagen ruidosa, sabiendo en qué paso va.', en: 'To estimate the noise in a noisy image, knowing which step it is at.' },
        { es: 'A clasificar imágenes por categoría.', en: 'To classify images by category.' },
      ],
      answer: 2,
      why: { es: 'Añadir ruido es una receta fija que no se aprende. La red recibe la imagen con ruido y el número del paso y estima el ruido; restando un poco de esa estimación, muchas veces, se pasa de estática a imagen.', en: 'Adding noise is a fixed recipe that is not learned. The network takes the noisy image and the step number and estimates the noise; subtracting a little of that estimate, many times, goes from static to image.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué no se quita todo el ruido de un solo salto?', en: 'Why not remove all the noise in a single jump?' },
      options: [
        { es: 'Porque la misma estática pudo venir de cualquier imagen: de un salto, lo mejor que se puede adivinar es un promedio borroso.', en: 'Because the same static could have come from any image: in one jump, the best possible guess is a blurry average.' },
        { es: 'Porque las computadoras no pueden restar tantos números a la vez.', en: 'Because computers cannot subtract that many numbers at once.' },
        { es: 'Porque el calendario de ruido lo prohíbe.', en: 'Because the noise schedule forbids it.' },
        { es: 'Porque la red solo tiene una capa.', en: 'Because the network has only one layer.' },
      ],
      answer: 0,
      why: { es: 'Un salto grande tiene muchísimas respuestas posibles, y lo que menos se equivoca en promedio es su promedio: una mancha. Entre un paso y el anterior la imagen casi no cambia, y eso sí se puede estimar bien.', en: 'A big jump has a huge number of possible answers, and the guess that is least wrong on average is their average: a smudge. Between one step and the previous one the image barely changes, and that can be estimated well.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un sistema genera cada imagen con 50 pasos y guiado sin clasificador. Cada evaluación de la red tarda 0.02 s. ¿Cuánto tarda una imagen, sin contar la decodificación?', en: 'A system generates each image with 50 steps and classifier-free guidance. Each network evaluation takes 0.02 s. How long does one image take, not counting decoding?' },
      options: [
        { es: '1 s', en: '1 s' },
        { es: '0.04 s', en: '0.04 s' },
        { es: '100 s', en: '100 s' },
        { es: '2 s', en: '2 s' },
      ],
      answer: 3,
      why: { es: 'Con guiado, en cada paso se evalúa la red dos veces (con pista y sin pista): 50 × 2 × 0.02 s = 2 s. Olvidar la doble evaluación da 1 s.', en: 'With guidance, the network is evaluated twice per step (with and without the hint): 50 × 2 × 0.02 s = 2 s. Forgetting the double evaluation gives 1 s.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo de marketing sube mucho la escala de guiado para que las imágenes se parezcan más a lo que pide. ¿Qué debe esperar?', en: 'A marketing team turns the guidance scale way up so the images match the request more closely. What should it expect?' },
      options: [
        { es: 'Imágenes más fieles y además más variadas.', en: 'Images that are more faithful and also more varied.' },
        { es: 'Imágenes más fieles a lo pedido, pero más parecidas entre sí; conviene probar varias escalas.', en: 'Images more faithful to the request, but more alike; it is worth trying several scales.' },
        { es: 'Que cada imagen tarde diez veces menos.', en: 'Each image taking ten times less time.' },
        { es: 'Ningún cambio: la escala solo afecta al entrenamiento.', en: 'No change: the scale only affects training.' },
      ],
      answer: 1,
      why: { es: 'Exagerar la pista empuja los resultados hacia lo más típico de lo pedido: ganan fidelidad y pierden variedad. La escala se usa al generar, no al entrenar, y no cambia el número de pasos.', en: 'Exaggerating the hint pushes results toward the most typical version of the request: they gain fidelity and lose variety. The scale is used when generating, not training, and it does not change the number of steps.' },
    },
  ],

  glossary: ['generative-model', 'distribution', 'sampling', 'autoencoder', 'latent-space', 'vae', 'pixel', 'loss', 'mse', 'gradient-descent', 'training-data', 'diffusion', 'denoising', 'noise-schedule', 'latent-diffusion', 'guidance'],

  terms: [
    { id: 'diffusion', term: { es: 'Modelo de difusión', en: 'Diffusion model' }, def: { es: 'Modelo generativo que aprende a deshacer un proceso fijo que mezcla los datos con ruido paso a paso (el proceso hacia delante). Genera partiendo de estática pura y quitando un poco de ruido estimado, muchas veces.', en: 'A generative model that learns to undo a fixed process that mixes data with noise step by step (the forward process). It generates by starting from pure static and removing a little estimated noise, many times.' } },
    { id: 'denoising', term: { es: 'Quitar ruido (denoising)', en: 'Denoising' }, def: { es: 'La tarea de la red en un modelo de difusión: recibe una imagen con ruido y el número del paso, y estima el ruido para poder restarlo.', en: 'The task of the network in a diffusion model: it takes a noisy image and the step number, and estimates the noise so it can be subtracted.' } },
    { id: 'noise-schedule', term: { es: 'Calendario de ruido', en: 'Noise schedule' }, def: { es: 'La receta fija de cuánto ruido se mezcla en cada paso del proceso hacia delante; determina qué parte de la mezcla sigue siendo imagen en cada paso.', en: 'The fixed recipe for how much noise is mixed in at each step of the forward process; it determines how much of the mix is still image at each step.' } },
    { id: 'latent-diffusion', term: { es: 'Difusión latente', en: 'Latent diffusion' }, def: { es: 'Hacer la difusión en el espacio de códigos de un autocodificador, mucho más pequeño que la imagen, y decodificar al final. Es más barata; así funciona Stable Diffusion.', en: 'Doing diffusion in the code space of an autoencoder, much smaller than the image, and decoding at the end. It is cheaper; that is how Stable Diffusion works.' } },
    { id: 'guidance', term: { es: 'Guiado sin clasificador', en: 'Classifier-free guidance' }, def: { es: 'Al generar, se calcula la estimación del ruido con la pista (una etiqueta o un texto) y sin ella, y se exagera su diferencia con la escala de guiado: más fidelidad a la pista, menos variedad.', en: 'When generating, the noise estimate is computed with the hint (a label or a text) and without it, and their difference is exaggerated by the guidance scale: more fidelity to the hint, less variety.' } },
  ],

  sources: [
    { title: 'Optical Recognition of Handwritten Digits (UCI Machine Learning Repository, CC BY 4.0; datos de los dígitos de 8 × 8)', authors: 'Alpaydin, E., Kaynak, C.', year: 1998, url: 'https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits' },
    { title: 'Deep Unsupervised Learning using Nonequilibrium Thermodynamics (ICML 2015)', authors: 'Sohl-Dickstein, J., Weiss, E. A., Maheswaranathan, N., Ganguli, S.', year: 2015, url: 'https://arxiv.org/abs/1503.03585' },
    { title: 'Denoising Diffusion Probabilistic Models (NeurIPS 2020)', authors: 'Ho, J., Jain, A., Abbeel, P.', year: 2020, url: 'https://arxiv.org/abs/2006.11239' },
    { title: 'Improved Denoising Diffusion Probabilistic Models (ICML 2021)', authors: 'Nichol, A., Dhariwal, P.', year: 2021, url: 'https://arxiv.org/abs/2102.09672' },
    { title: 'Denoising Diffusion Implicit Models (ICLR 2021)', authors: 'Song, J., Meng, C., Ermon, S.', year: 2021, url: 'https://arxiv.org/abs/2010.02502' },
    { title: 'Classifier-Free Diffusion Guidance', authors: 'Ho, J., Salimans, T.', year: 2022, url: 'https://arxiv.org/abs/2207.12598' },
    { title: 'High-Resolution Image Synthesis with Latent Diffusion Models (CVPR 2022)', authors: 'Rombach, R., Blattmann, A., Lorenz, D., Esser, P., Ommer, B.', year: 2022, url: 'https://arxiv.org/abs/2112.10752' },
    { title: 'Stable Diffusion Public Release (anuncio, 22 de agosto de 2022)', authors: 'Stability AI', year: 2022, url: 'https://stability.ai/news-updates/stable-diffusion-public-release' },
    { title: 'Stable Diffusion v1-4 Model Card', authors: 'CompVis', year: 2022, url: 'https://huggingface.co/CompVis/stable-diffusion-v1-4' },
    { title: 'Optical Recognition of Handwritten Digits (UCI Machine Learning Repository)', authors: 'Alpaydin, E., Kaynak, C.', year: 1998, url: 'https://doi.org/10.24432/C50P49' },
  ],
});
