import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'generar-distribuciones',

  objectives: {
    es: [
      'Explicar la diferencia entre clasificar (trazar una frontera) y generar (conocer la distribución de los datos y sacar muestras nuevas de ella).',
      'Describir, pieza por pieza, cómo un autocodificador resume una imagen en dos números y la reconstruye, y qué es el espacio latente.',
      'Reconocer por qué el plano de un autocodificador simple tiene huecos y cómo las nubes de un VAE los rellenan para poder muestrear.',
    ],
    en: [
      'Explain the difference between classifying (drawing a boundary) and generating (knowing the distribution of the data and drawing new samples from it).',
      'Describe, piece by piece, how an autoencoder sums up an image in two numbers and rebuilds it, and what the latent space is.',
      'Recognize why a simple autoencoder’s plane has holes and how a VAE’s clouds fill them so that you can sample.',
    ],
  },

  segments: [
    // ── clasificar frente a generar, con un ejemplo concreto ──
    {
      id: 'hook',
      es: 'En la parte uno, las redes aprendieron a decidir: miran un dibujo como este y responden: es un siete.',
      en: 'In part one, networks learned to decide: they look at a drawing like this one and answer: it is a seven.',
    },
    {
      id: 'classify',
      es: 'A eso se le llama clasificar: entra una imagen y sale una etiqueta. Para lograrlo, basta con distinguir un dígito de los demás.',
      en: 'That is called classifying: an image goes in and a label comes out. To do it, the network only has to tell one digit from the others.',
    },
    {
      id: 'generate-ask',
      es: 'Ahora, el camino inverso: le pides un siete y la red lo dibuja. No uno guardado, sino uno nuevo, que nunca existió.',
      en: 'Now the reverse path: you ask for a seven and the network draws one. Not a stored one, but a new one that never existed.',
      pad: 0.4,
    },
    {
      id: 'generative',
      es: 'Una red que hace esto es un modelo generativo. Así trabajan los sistemas que crean imágenes, voces o textos.',
      en: 'A network that does this is a generative model. That is how systems that create images, voices, or text work.',
      note: { es: 'Modelo generativo: produce datos nuevos, parecidos a los reales.', en: 'Generative model: it produces new data that resembles the real data.' },
    },
    {
      id: 'question',
      es: 'Para dibujar un siete nuevo, la red tiene que saber cómo son los sietes de verdad: todos distintos, pero con algo en común.',
      en: 'To draw a new seven, the network has to know what real sevens look like: all different, yet with something in common.',
      pad: 0.3,
    },
    // ── una distribución que se ve: la nube de los sietes ──
    {
      id: 'measure-top',
      es: 'Midamos cada siete con dos números. Primero, la tinta de su mitad de arriba: cada píxel cuenta de cero, vacío, a uno, lleno. Este suma doce.',
      en: 'Let’s measure each seven with two numbers. First, the ink in its top half: each pixel counts from zero, empty, to one, full. This one adds up to twelve.',
      pad: 0.3,
    },
    {
      id: 'measure-bottom',
      es: 'Segundo, la tinta de su mitad de abajo: siete punto ocho. Los sietes cargan más tinta arriba, donde está su barra.',
      en: 'Second, the ink in its bottom half: seven point eight. Sevens carry more ink on top, where their bar is.',
      pad: 0.3,
    },
    {
      id: 'plane',
      es: 'Como en la lección uno, dos medidas forman un punto: la tinta de arriba se lee en el eje horizontal y la de abajo, en el vertical.',
      en: 'As in lesson one, two measures make a point: the top ink is read on the horizontal axis and the bottom ink on the vertical one.',
      pad: 0.4,
    },
    {
      id: 'cloud-7',
      es: 'Hacemos lo mismo con los ciento setenta y nueve sietes del conjunto de datos. Cada uno es un punto, y juntos forman una nube.',
      en: 'We do the same with all one hundred seventy-nine sevens in the dataset. Each one is a point, and together they form a cloud.',
      pad: 0.3,
    },
    {
      id: 'cloud-6',
      es: 'Y con los ciento ochenta y un seises: otra nube, en otro lugar. Los seises cargan la tinta abajo, en su vuelta redonda.',
      en: 'And with the one hundred eighty-one sixes: another cloud, somewhere else. Sixes carry their ink at the bottom, in their round loop.',
      pad: 0.3,
    },
    {
      id: 'classify-line',
      es: 'Clasificar es trazar una frontera entre las dos nubes: de un lado, seis; del otro, siete. Para eso basta con saber por dónde va la línea.',
      en: 'Classifying means drawing a boundary between the two clouds: six on one side, seven on the other. For that, knowing where the line goes is enough.',
    },
    {
      id: 'generate-shape',
      es: 'Generar pide más: conocer la nube de los sietes por dentro. Dónde se apiñan los puntos y hasta dónde llegan.',
      en: 'Generating asks for more: knowing the cloud of sevens from the inside. Where the points crowd together, and how far out they reach.',
      pad: 0.4,
    },
    {
      id: 'distribution',
      es: 'Esa forma se llama distribución: dice qué es común, qué es raro y qué no aparece nunca. Un modelo generativo aprende la distribución de sus datos.',
      en: 'That shape is called a distribution: it tells what is common, what is rare, and what never shows up. A generative model learns the distribution of its data.',
      note: { es: 'Distribución: qué es común, qué es raro y qué no aparece nunca en los datos.', en: 'Distribution: what is common, what is rare, and what never appears in the data.' },
      pad: 0.3,
    },
    {
      id: 'sample',
      es: 'Con ella se puede muestrear: sacar un punto nuevo de la nube. Mira: los puntos nuevos caen más seguido en el centro y pocas veces en las orillas.',
      en: 'With it you can sample: draw a new point from the cloud. Watch: new points land most often in the middle and only rarely near the edges.',
      note: { es: 'Muestrear: sacar un dato nuevo siguiendo la distribución.', en: 'Sampling: drawing a new data point that follows the distribution.' },
      pad: 0.6,
    },
    {
      id: 'try-sample',
      es: 'Cada punto nuevo es una mezcla creíble de tinta arriba y abajo que ningún siete real tenía exactamente. Si quieres, saca tú más con el botón.',
      en: 'Each new point is a believable mix of top and bottom ink that no real seven had exactly. If you like, draw more yourself with the button.',
      gate: { id: 'sample', prompt: { es: 'saca tres puntos nuevos con el botón.', en: 'draw three new points with the button.' } },
      pad: 0.4,
    },
    {
      id: 'not-image',
      es: 'Pero un punto aquí son solo dos medidas. Con ellas no se puede dibujar un siete: para eso hacen falta sus sesenta y cuatro píxeles.',
      en: 'But a point here is just two measures. You cannot draw a seven from them: that takes all sixty-four of its pixels.',
      pad: 0.3,
    },
    {
      id: 'independent',
      es: '¿Y si sacamos cada píxel por separado, según lo común en su lugar? Salen manchas sin forma. Los píxeles van juntos: donde hay trazo, los vecinos también tienen tinta.',
      en: 'What if we draw each pixel separately, by what is common in its spot? We get shapeless smudges. Pixels go together: where there is a stroke, the neighbors have ink too.',
      pad: 0.4,
    },
    // ── el autocodificador, pieza por pieza ──
    {
      id: 'idea',
      es: 'La salida: que una red elija ella misma dos números por imagen, pero unos con los que se pueda rehacer la imagen completa.',
      en: 'The way out: let a network choose two numbers per image by itself, but ones from which the whole image can be rebuilt.',
      pad: 0.3,
    },
    {
      id: 'encoder',
      es: 'Primera pieza: el codificador. Es una red que recibe los sesenta y cuatro píxeles y los resume en solo dos números.',
      en: 'First piece: the encoder. It is a network that takes the sixty-four pixels and sums them up in just two numbers.',
      pad: 0.3,
    },
    {
      id: 'code',
      es: 'Esos dos números son el código de la imagen. Nuestro siete quedó resumido en menos cero punto cinco y cero punto seis.',
      en: 'Those two numbers are the image’s code. Our seven was summed up as minus zero point five and zero point six.',
      pad: 0.3,
    },
    {
      id: 'decoder',
      es: 'Segunda pieza: el decodificador. Recibe solo esos dos números e intenta rehacer los sesenta y cuatro píxeles.',
      en: 'Second piece: the decoder. It gets only those two numbers and tries to rebuild the sixty-four pixels.',
      pad: 0.4,
    },
    {
      id: 'error',
      es: 'Comparamos el resultado con el original, píxel por píxel. Lo que no coincide se suma en un solo número: el error de reconstrucción.',
      en: 'We compare the result with the original, pixel by pixel. Whatever does not match is added up into a single number: the reconstruction error.',
      pad: 0.3,
    },
    {
      id: 'autoencoder',
      es: 'Las dos piezas juntas forman un autocodificador. Se entrena como en la parte uno: con descenso del gradiente, para que ese error baje.',
      en: 'Together, the two pieces form an autoencoder. It is trained as in part one: with gradient descent, so that this error goes down.',
      note: { es: 'Autocodificador: comprime cada imagen en un código corto y la reconstruye.', en: 'Autoencoder: it compresses each image into a short code and rebuilds it.' },
      pad: 0.3,
    },
    {
      id: 'training',
      es: 'Al principio, la red devuelve manchas sin forma. Paso a paso, el error baja y los dígitos aparecen, incluso en imágenes que nunca vio.',
      en: 'At first, the network returns shapeless smudges. Step by step, the error goes down and the digits appear, even in images it never saw.',
      pad: 0.8,
    },
    {
      id: 'lossy',
      es: 'No quedan idénticas: dos números no alcanzan para cada detalle. Comprimir así siempre pierde algo.',
      en: 'They do not come out identical: two numbers are not enough for every detail. Compressing like this always loses something.',
      pad: 0.3,
    },
    // ── el espacio latente y su recorrido ──
    {
      id: 'latent-plane',
      es: 'Como cada imagen quedó en dos números, también cabe en un plano: el primer número del código en el eje horizontal y el segundo, en el vertical.',
      en: 'Since each image is now two numbers, it also fits on a plane: the code’s first number on the horizontal axis and the second on the vertical one.',
      pad: 0.4,
    },
    {
      id: 'latent-all',
      es: 'Así ponemos las mil quinientas imágenes de entrenamiento. Este plano de códigos se llama espacio latente: latente quiere decir oculto.',
      en: 'That is how we place all one thousand five hundred training images. This plane of codes is called the latent space: latent means hidden.',
      note: { es: 'Espacio latente: el plano de los códigos; cada imagen es un punto.', en: 'Latent space: the plane of codes; each image is a point.' },
      pad: 0.4,
    },
    {
      id: 'latent-groups',
      es: 'Mira: los dígitos iguales quedaron juntos, y nadie le dijo a la red cuál era cuál. Como en los embeddings, cerca significa parecido.',
      en: 'Look: matching digits ended up together, and nobody told the network which was which. As with embeddings, close means similar.',
      pad: 0.3,
    },
    {
      id: 'walk-demo',
      es: 'Y cualquier punto del plano se puede decodificar, aunque ahí no haya caído ninguna imagen. Mira cómo se pasea este punto.',
      en: 'And any point on the plane can be decoded, even where no image landed. Watch this point take a walk.',
      pad: 0.3,
    },
    {
      id: 'walk-smooth',
      es: 'La imagen cambia poco a poco, sin saltos: el siete se vuelve tres, luego nueve, cinco, cero, seis y cuatro. Puntos cercanos dan imágenes parecidas.',
      en: 'The image changes little by little, with no jumps: the seven becomes a three, then a nine, a five, a zero, a six, and a four. Nearby points give similar images.',
      pad: 0.8,
    },
    {
      id: 'try-walk',
      es: 'Si quieres, recorre tú el camino con el deslizador, o arrastra el punto a cualquier lugar del plano.',
      en: 'If you like, travel the path yourself with the slider, or drag the point anywhere on the plane.',
      gate: { id: 'walk', prompt: { es: 'mueve el deslizador del recorrido y mira cómo cambia la imagen.', en: 'move the path slider and watch the image change.' } },
      pad: 0.4,
    },
    // ── los huecos del autocodificador ──
    {
      id: 'generate-ae',
      es: 'Entonces, para generar, bastaría con elegir un punto al azar en el plano y decodificarlo. Aquí van ocho intentos.',
      en: 'So, to generate, it should be enough to pick a random point on the plane and decode it. Here are eight tries.',
      pad: 0.6,
    },
    {
      id: 'gaps',
      es: 'El problema: al autocodificador solo se le pidió rehacer cada imagen desde su punto, no ordenar el plano. Así quedaron grupos apiñados y huecos grandes.',
      en: 'The problem: the autoencoder was only asked to rebuild each image from its point, not to tidy the plane. So some groups got crammed together, with big holes in between.',
      pad: 0.4,
    },
    {
      id: 'gap-junk',
      es: 'En un hueco la red nunca practicó, así que puede salir algo raro. Este punto da una mancha que no es ningún dígito.',
      en: 'The network never practiced inside a hole, so something odd can come out. This point gives a smudge that is no digit at all.',
      pad: 0.4,
    },
    // ── el VAE: nubes en lugar de puntos ──
    {
      id: 'vae-idea',
      es: 'La solución se llama autocodificador variacional, o VAE. Su idea: resumir cada imagen no en un punto, sino en una pequeña nube.',
      en: 'The fix is called a variational autoencoder, or VAE. Its idea: sum up each image not as a point, but as a small cloud.',
      pad: 0.4,
    },
    {
      id: 'vae-cloud',
      es: 'Su codificador entrega dos cosas: el centro de la nube y su tamaño. Cualquier punto de esa nube es un código posible de la imagen.',
      en: 'Its encoder returns two things: the center of the cloud and its size. Any point in that cloud is a possible code for the image.',
      pad: 0.3,
    },
    {
      id: 'vae-noise',
      es: 'Al entrenar, se saca un punto al azar de la nube y solo ese se decodifica. Así, toda la nube, no solo su centro, debe dar la misma imagen.',
      en: 'During training, a random point is drawn from the cloud and only that one is decoded. So the whole cloud, not just its center, must give the same image.',
      pad: 0.6,
    },
    {
      id: 'vae-fill',
      es: 'Las nubes de imágenes parecidas se enciman y cubren el plano. Entre un dígito y otro ya no quedan huecos: el decodificador practicó en toda esa zona.',
      en: 'The clouds of similar images overlap and cover the plane. Between one digit and the next there are no holes left: the decoder practiced across that whole area.',
      pad: 0.5,
    },
    {
      id: 'vae-center',
      es: 'Además, una penalización junta todas las nubes alrededor del centro del plano, en una zona redonda que se conoce de antemano.',
      en: 'On top of that, a penalty gathers all the clouds around the center of the plane, in a round zone that is known in advance.',
      note: { es: 'VAE: nubes en lugar de puntos, juntas en una zona conocida; así se puede muestrear.', en: 'VAE: clouds instead of points, gathered in a known zone, so you can sample.' },
      pad: 0.5,
    },
    {
      id: 'vae-sample',
      es: 'Ahora sí: se saca un punto al azar de esa zona, se decodifica, y sale un dígito nuevo. Eso es muestrear del espacio latente.',
      en: 'Now it works: draw a random point from that zone, decode it, and out comes a new digit. That is sampling from the latent space.',
      pad: 0.6,
    },
    {
      id: 'compare',
      es: 'Comparemos ocho intentos al azar con cada modelo. Arriba, el autocodificador en el recuadro de sus códigos; abajo, el VAE en su zona redonda.',
      en: 'Let’s compare eight random tries with each model. On top, the autoencoder within the box of its codes; below, the VAE within its round zone.',
      pad: 0.5,
    },
    {
      id: 'result',
      es: 'En tres mil intentos, el autocodificador saca cuatros y seises de más, y casi ningún ocho. El VAE reparte los diez dígitos mucho más parejo.',
      en: 'Over three thousand tries, the autoencoder makes too many fours and sixes, and almost no eights. The VAE spreads the ten digits far more evenly.',
      pad: 0.5,
    },
    // ── no es un collage ──
    {
      id: 'collage-q',
      es: '¿Y si en el fondo solo pegara pedazos de imágenes guardadas? Comprobémoslo: debajo de cada dígito generado va el más parecido de las mil quinientas de entrenamiento.',
      en: 'What if, deep down, it just pasted together pieces of stored images? Let’s check: under each generated digit is the most similar of the one thousand five hundred training images.',
      pad: 0.5,
    },
    {
      id: 'not-copy',
      es: 'Se parecen, pero ninguno es copia. Y el modelo no guarda las imágenes: guarda cuatro mil cuatrocientos veinte números, sus pesos.',
      en: 'They look alike, but none is a copy. And the model does not store the images: it stores four thousand four hundred twenty numbers, its weights.',
      pad: 0.3,
    },
    {
      id: 'caveat',
      es: 'Una salvedad honesta: los modelos enormes sí pueden memorizar algunas imágenes, sobre todo las muy repetidas en sus datos, y reproducirlas casi idénticas.',
      en: 'One honest caveat: huge models can memorize some images, especially ones repeated many times in their data, and reproduce them almost exactly.',
      pad: 0.3,
    },
    {
      id: 'blurry',
      es: 'Y el VAE tiene un precio: sus imágenes salen algo borrosas. Otras formas de generar, que veremos después, logran más nitidez.',
      en: 'And the VAE has a price: its images come out somewhat blurry. Other ways to generate, which we will see next, get sharper results.',
      pad: 0.3,
    },
    {
      id: 'recap',
      es: 'Así que la IA generativa no hace collage: aprende una distribución, dónde viven los datos, y saca muestras nuevas de ella.',
      en: 'So generative AI does not make collages: it learns a distribution, where the data lives, and draws new samples from it.',
      note: { es: 'Generar: aprender una distribución y sacar muestras nuevas de ella.', en: 'Generating: learning a distribution and drawing new samples from it.' },
      pad: 0.5,
    },
    {
      id: 'bridge',
      es: 'Hay otra forma de aprender a generar, sin nubes ni códigos: poner a competir a dos redes. Un falsificador contra un detective.',
      en: 'There is another way to learn to generate, with no clouds or codes: pit two networks against each other. A forger against a detective.',
    },
  ],

  keyIdeas: {
    es: [
      'Clasificar es trazar una frontera entre grupos. Generar pide más: conocer la distribución de los datos, dónde se apiñan y hasta dónde llegan, para sacar muestras nuevas.',
      'Muestrear es sacar un dato nuevo siguiendo la distribución: sale más seguido lo común y pocas veces lo raro.',
      'Los píxeles de una imagen dependen unos de otros: sacarlos por separado da manchas. Por eso se comprime cada imagen en pocos números que sí basten para rehacerla.',
      'Un autocodificador tiene dos piezas: el codificador resume la imagen en un código (aquí, dos números) y el decodificador la reconstruye. El plano de los códigos es el espacio latente.',
      'El plano de un autocodificador simple queda desordenado y con huecos. Un VAE resume cada imagen en una nube y las junta en una zona conocida: así se puede muestrear. El precio, imágenes algo borrosas.',
    ],
    en: [
      'Classifying means drawing a boundary between groups. Generating asks for more: knowing the distribution of the data, where it crowds and how far it reaches, to draw new samples.',
      'Sampling means drawing a new data point that follows the distribution: common things come out often and rare things seldom.',
      'The pixels of an image depend on each other: drawing them separately gives smudges. That is why each image is compressed into a few numbers that are enough to rebuild it.',
      'An autoencoder has two pieces: the encoder sums up the image in a code (here, two numbers) and the decoder rebuilds it. The plane of codes is the latent space.',
      'A simple autoencoder’s plane ends up untidy and full of holes. A VAE sums up each image as a cloud and gathers them in a known zone, so you can sample. The price: somewhat blurry images.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA generativa recorta y pega trozos de imágenes que tiene guardadas: es un collage.',
      en: 'Generative AI cuts and pastes pieces of images it has stored: it is a collage.',
    },
    right: {
      es: 'Aprende una distribución: guarda pesos, no imágenes, y genera sacando un punto al azar y decodificándolo. Lo generado se parece a los datos sin copiar ninguno. La excepción es la memorización (sobre todo de imágenes muy repetidas en los datos): un fallo real que se mide y se intenta evitar.',
      en: 'It learns a distribution: it stores weights, not images, and generates by drawing a random point and decoding it. What it generates resembles the data without copying any of it. The exception is memorization (mostly of images repeated many times in the data): a real failure that is measured and guarded against.',
    },
  },

  deeper: {
    es: `## Clasificar frente a generar

Un modelo que clasifica aprende $p(y\\mid x)$: dado el dato, la etiqueta; le basta la frontera. Un modelo generativo aprende la distribución de los propios datos, $p_\\theta(x)$, y permite **muestrear** $x\\sim p_\\theta(x)$. Se entrena, en general, por máxima verosimilitud:

$$\\theta^\\star=\\arg\\max_\\theta\\;\\frac1N\\sum_{i=1}^{N}\\log p_\\theta(x_i)$$

## La nube de los sietes

Cada dígito se mide con $m=(m_1,m_2)$: la tinta de su mitad de arriba y la de su mitad de abajo (cada píxel vale de 0 a 1; cada mitad tiene 32 píxeles). Los óvalos de la lección son una gaussiana en dos dimensiones ajustada por máxima verosimilitud a los 179 sietes:

$$\\hat\\mu=\\frac1N\\sum_i m_i=(10.82,\\;8.14),\\qquad \\hat\\Sigma=\\frac1N\\sum_i (m_i-\\hat\\mu)(m_i-\\hat\\mu)^\\top=\\begin{pmatrix}2.24&-0.65\\\\-0.65&2.45\\end{pmatrix}$$

El óvalo pequeño es $(m-\\hat\\mu)^\\top\\hat\\Sigma^{-1}(m-\\hat\\mu)=1$ y el grande, $=4$. En una gaussiana de dos dimensiones caen dentro $1-e^{-1/2}\\approx 39\\,\\%$ y $1-e^{-2}\\approx 86\\,\\%$ de las muestras. Para muestrear se toma $\\varepsilon\\sim\\mathcal N(0,I)$ y $m=\\hat\\mu+L\\varepsilon$, con $LL^\\top=\\hat\\Sigma$ (Cholesky). La frontera entre seises y sietes de la escena es la del análisis discriminante lineal: la recta donde las dos gaussianas, con su covarianza promedio, dan la misma densidad.

## Por qué no basta con cada píxel por separado

Sacar cada píxel de su propia distribución equivale a suponer $p(x)=\\prod_{j=1}^{64}p(x_j)$: píxeles independientes. En los dígitos es falso (un trazo enciende a sus vecinos), y por eso salen manchas. Hace falta un modelo de cómo varían juntos.

## Autocodificador

Un codificador $z=E_\\phi(x)$ y un decodificador $\\hat x=D_\\theta(z)$, entrenados juntos para minimizar el error de reconstrucción:

$$\\mathcal L_{\\text{AE}}=\\lVert x-\\hat x\\rVert^2=\\sum_{j=1}^{64}(x_j-\\hat x_j)^2$$

Los modelos de la lección son diminutos: $64\\to32\\to2\\to32\\to64$ con $\\tanh$ en la capa oculta y un sigmoide a la salida (4354 parámetros), entrenados con descenso del gradiente (Adam) sobre 1500 imágenes; otras 297 se reservaron para reconstruir imágenes que la red nunca vio. Error medio por imagen reservada según el tamaño del código: 3.14 con 1 número, 2.34 con 2, 1.46 con 4, 0.95 con 8 y 0.54 con 16 (adivinar siempre la imagen media daría 4.71). Con decodificador lineal y error cuadrático, un autocodificador aprende el mismo subespacio que el PCA (Goodfellow et al., 2016, §14.1); las capas no lineales lo generalizan, y Hinton y Salakhutdinov (2006) mostraron que los autocodificadores profundos aprenden códigos mucho mejores que el PCA.

## Autocodificador variacional (VAE)

Se postula un código con distribución previa conocida, $p(z)=\\mathcal N(0,I)$ (la «zona redonda»), y un decodificador $p_\\theta(x\\mid z)=\\mathcal N(D_\\theta(z),\\sigma_{\\text{obs}}^2 I)$. El codificador devuelve una nube, $q_\\phi(z\\mid x)=\\mathcal N\\big(\\mu_\\phi(x),\\operatorname{diag}\\sigma^2_\\phi(x)\\big)$: su centro y su tamaño. En el entrenamiento se saca un punto con el truco de reparametrización, que deja pasar el gradiente:

$$z=\\mu+\\sigma\\odot\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I)$$

Lo que se maximiza es una cota inferior de $\\log p_\\theta(x)$ (la ELBO):

$$\\log p_\\theta(x)\\;\\ge\\;\\mathbb E_{q_\\phi(z\\mid x)}\\big[\\log p_\\theta(x\\mid z)\\big]-D_{\\mathrm{KL}}\\big(q_\\phi(z\\mid x)\\,\\Vert\\,p(z)\\big)$$

El primer término es el error de reconstrucción; el segundo, la penalización que acerca cada nube a la zona estándar. Para gaussianas diagonales tiene forma cerrada:

$$D_{\\mathrm{KL}}=\\tfrac12\\sum_{k}\\big(\\mu_k^2+\\sigma_k^2-\\ln\\sigma_k^2-1\\big)$$

La pérdida usada en la lección es $\\lVert x-\\hat x\\rVert^2/(2\\sigma_{\\text{obs}}^2)+D_{\\mathrm{KL}}$ con $\\sigma_{\\text{obs}}^2=0.1$ (4420 parámetros). Los dos términos compiten: la reconstrucción separa y encoge las nubes; la penalización las junta y las ensancha. Para **generar**: $z\\sim\\mathcal N(0,I)$ y $x=D_\\theta(z)$. Con un decodificador gaussiano de varianza fija, la mejor reconstrucción de un código es el promedio de las imágenes que caben en él: de ahí la borrosidad. Kingma y Welling (2019, §2.8.2) la atribuyen a que el ajuste nunca es perfecto y señalan que se atenúa con modelos de inferencia y generativos más flexibles.

## Muestrear con cada modelo

Para el autocodificador no hay una zona definida de la cual muestrear; el recurso ingenuo es sacar puntos uniformes en el recuadro de sus códigos. Un clasificador sencillo (regresión logística entrenada con las mismas 1500 imágenes) etiquetó 3000 muestras de cada modelo: el autocodificador dio 22 % de cuatros, 21 % de seises y 0.7 % de ochos; el VAE, entre 6 % y 14 % de cada dígito (los datos reales tienen cerca de 10 % de cada uno). Con ocho semillas distintas el resultado se repite: el VAE siempre queda más parejo (véase \`train_toy.py\`).

## En código

\`\`\`python
import numpy as np

# cinco sietes medidos con (tinta arriba, tinta abajo): ejemplo
m = np.array([[12.0, 7.8], [10.4, 8.9], [11.3, 7.4], [9.6, 8.5], [10.9, 8.1]])
mu = m.mean(axis=0)                        # centro de la nube
cov = np.cov(m.T, bias=True)               # forma del óvalo (máxima verosimilitud: divide entre N)
L = np.linalg.cholesky(cov)                # L @ L.T == cov
rng = np.random.default_rng(0)
nuevos = mu + rng.standard_normal((3, 2)) @ L.T   # muestrear: tres puntos nuevos de la nube
print(mu.round(2).tolist(), nuevos.round(1).tolist())
# [10.84, 8.14] [[10.9, 8.0], [11.4, 7.9], [10.4, 8.5]]

# Una nube de VAE: centro y tamaño (uno por cada número del código)
c, s = np.array([0.8, -0.3]), np.array([0.5, 0.8])
kl = 0.5 * np.sum(c**2 + s**2 - np.log(s**2) - 1)   # penalización frente a la zona estándar N(0, I)
z = c + s * np.array([0.2, -1.0])                   # un punto sacado de la nube (truco de reparametrización)
print(round(float(kl), 4), z.round(2).tolist())
# 0.7263 [0.9, -1.1]
\`\`\`

## Lo que viene

Los VAE fueron propuestos de forma independiente por Kingma y Welling (2013) y por Rezende, Mohamed y Wierstra (2014). Las redes generativas adversarias (lección 16) aprenden a generar sin escribir una densidad: compitiendo. La difusión (lección 17) aprende a quitar ruido, y su versión latente trabaja dentro del espacio comprimido de un autocodificador.`,

    en: `## Classifying versus generating

A model that classifies learns $p(y\\mid x)$: given the data, the label; the boundary is enough. A generative model learns the distribution of the data itself, $p_\\theta(x)$, and lets you **sample** $x\\sim p_\\theta(x)$. It is usually trained by maximum likelihood:

$$\\theta^\\star=\\arg\\max_\\theta\\;\\frac1N\\sum_{i=1}^{N}\\log p_\\theta(x_i)$$

## The cloud of sevens

Each digit is measured as $m=(m_1,m_2)$: the ink in its top half and the ink in its bottom half (each pixel is worth 0 to 1; each half has 32 pixels). The lesson’s ovals are a two-dimensional Gaussian fitted by maximum likelihood to the 179 sevens:

$$\\hat\\mu=\\frac1N\\sum_i m_i=(10.82,\\;8.14),\\qquad \\hat\\Sigma=\\frac1N\\sum_i (m_i-\\hat\\mu)(m_i-\\hat\\mu)^\\top=\\begin{pmatrix}2.24&-0.65\\\\-0.65&2.45\\end{pmatrix}$$

The small oval is $(m-\\hat\\mu)^\\top\\hat\\Sigma^{-1}(m-\\hat\\mu)=1$ and the large one is $=4$. In a two-dimensional Gaussian, $1-e^{-1/2}\\approx 39\\%$ and $1-e^{-2}\\approx 86\\%$ of samples fall inside them. To sample, take $\\varepsilon\\sim\\mathcal N(0,I)$ and $m=\\hat\\mu+L\\varepsilon$, with $LL^\\top=\\hat\\Sigma$ (Cholesky). The boundary between sixes and sevens in the scene is the linear discriminant analysis one: the line where the two Gaussians, with their averaged covariance, give the same density.

## Why each pixel on its own is not enough

Drawing each pixel from its own distribution amounts to assuming $p(x)=\\prod_{j=1}^{64}p(x_j)$: independent pixels. For digits that is false (a stroke lights up its neighbors), which is why you get smudges. You need a model of how pixels vary together.

## Autoencoder

An encoder $z=E_\\phi(x)$ and a decoder $\\hat x=D_\\theta(z)$, trained together to minimize the reconstruction error:

$$\\mathcal L_{\\text{AE}}=\\lVert x-\\hat x\\rVert^2=\\sum_{j=1}^{64}(x_j-\\hat x_j)^2$$

The lesson’s models are tiny: $64\\to32\\to2\\to32\\to64$ with $\\tanh$ in the hidden layer and a sigmoid at the output (4,354 parameters), trained with gradient descent (Adam) on 1,500 images; another 297 were held back so the network could rebuild images it never saw. Mean error per held-out image by code size: 3.14 with 1 number, 2.34 with 2, 1.46 with 4, 0.95 with 8 and 0.54 with 16 (always guessing the mean image would give 4.71). With a linear decoder and squared error, an autoencoder learns the same subspace as PCA (Goodfellow et al., 2016, §14.1); nonlinear layers generalize it, and Hinton and Salakhutdinov (2006) showed that deep autoencoders learn codes that work much better than PCA.

## Variational autoencoder (VAE)

We postulate a code with a known prior, $p(z)=\\mathcal N(0,I)$ (the “round zone”), and a decoder $p_\\theta(x\\mid z)=\\mathcal N(D_\\theta(z),\\sigma_{\\text{obs}}^2 I)$. The encoder returns a cloud, $q_\\phi(z\\mid x)=\\mathcal N\\big(\\mu_\\phi(x),\\operatorname{diag}\\sigma^2_\\phi(x)\\big)$: its center and its size. During training a point is drawn with the reparameterization trick, which lets the gradient through:

$$z=\\mu+\\sigma\\odot\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I)$$

What is maximized is a lower bound on $\\log p_\\theta(x)$ (the ELBO):

$$\\log p_\\theta(x)\\;\\ge\\;\\mathbb E_{q_\\phi(z\\mid x)}\\big[\\log p_\\theta(x\\mid z)\\big]-D_{\\mathrm{KL}}\\big(q_\\phi(z\\mid x)\\,\\Vert\\,p(z)\\big)$$

The first term is the reconstruction error; the second is the penalty that pulls each cloud toward the standard zone. For diagonal Gaussians it has a closed form:

$$D_{\\mathrm{KL}}=\\tfrac12\\sum_{k}\\big(\\mu_k^2+\\sigma_k^2-\\ln\\sigma_k^2-1\\big)$$

The loss used in the lesson is $\\lVert x-\\hat x\\rVert^2/(2\\sigma_{\\text{obs}}^2)+D_{\\mathrm{KL}}$ with $\\sigma_{\\text{obs}}^2=0.1$ (4,420 parameters). The two terms compete: reconstruction separates and shrinks the clouds; the penalty pulls them together and widens them. To **generate**: $z\\sim\\mathcal N(0,I)$ and $x=D_\\theta(z)$. With a fixed-variance Gaussian decoder, the best reconstruction of a code is the average of the images that fit it: hence the blur. Kingma and Welling (2019, §2.8.2) attribute it to the fit never being perfect and note that it eases with more flexible inference and generative models.

## Sampling with each model

The autoencoder defines no zone to sample from; the naive fallback is to draw uniform points in the box of its codes. A simple classifier (logistic regression trained on the same 1,500 images) labeled 3,000 samples from each model: the autoencoder gave 22% fours, 21% sixes and 0.7% eights; the VAE, between 6% and 14% of each digit (the real data has about 10% of each). With eight different seeds the result holds: the VAE always comes out more even (see \`train_toy.py\`).

## In code

\`\`\`python
import numpy as np

# five sevens measured as (top ink, bottom ink): example
m = np.array([[12.0, 7.8], [10.4, 8.9], [11.3, 7.4], [9.6, 8.5], [10.9, 8.1]])
mu = m.mean(axis=0)                        # center of the cloud
cov = np.cov(m.T, bias=True)               # shape of the oval (maximum likelihood: divide by N)
L = np.linalg.cholesky(cov)                # L @ L.T == cov
rng = np.random.default_rng(0)
new = mu + rng.standard_normal((3, 2)) @ L.T   # sampling: three new points from the cloud
print(mu.round(2).tolist(), new.round(1).tolist())
# [10.84, 8.14] [[10.9, 8.0], [11.4, 7.9], [10.4, 8.5]]

# A VAE cloud: center and size (one per number in the code)
c, s = np.array([0.8, -0.3]), np.array([0.5, 0.8])
kl = 0.5 * np.sum(c**2 + s**2 - np.log(s**2) - 1)   # penalty against the standard zone N(0, I)
z = c + s * np.array([0.2, -1.0])                   # a point drawn from the cloud (reparameterization trick)
print(round(float(kl), 4), z.round(2).tolist())
# 0.7263 [0.9, -1.1]
\`\`\`

## What comes next

VAEs were proposed independently by Kingma and Welling (2013) and by Rezende, Mohamed and Wierstra (2014). Generative adversarial networks (lesson 16) learn to generate without writing down a density: by competing. Diffusion (lesson 17) learns to remove noise, and its latent version works inside the compressed space of an autoencoder.`,
  },

  lens: {
    es: [
      'Lo generado refleja la mezcla de los datos de entrenamiento, y a veces la distorsiona: en la demostración, el autocodificador casi nunca producía ochos. Pide que midan la mezcla de lo generado, no solo que muestren ejemplos.',
      'Cinco imágenes impecables no son evidencia. Pide muestras al azar, sin selección, y una medida de calidad y de variedad (por ejemplo, cuántos de cien intentos son utilizables y cuántos se parecen entre sí).',
      '«No es un collage» es la regla, no una garantía: con modelos grandes y datos repetidos hay memorización documentada. Pregunta por la deduplicación de datos, las pruebas de memorización y el origen y la licencia de lo que se usó para entrenar.',
      'Generar es muestrear: la misma instrucción da resultados distintos. Si necesitas reproducir un resultado, fija la semilla y registra la configuración; y recuerda que los datos sintéticos no traen información que no estuviera ya en los datos originales.',
    ],
    en: [
      'What is generated reflects the mix of the training data, and sometimes distorts it: in the demo, the autoencoder almost never produced eights. Ask them to measure the mix of what is generated, not just show examples.',
      'Five flawless images are not evidence. Ask for random samples, with no selection, and a measure of quality and variety (for example, how many of a hundred attempts are usable and how many look alike).',
      '“It is not a collage” is the rule, not a guarantee: with large models and repeated data, memorization is documented. Ask about data deduplication, memorization tests, and the origin and license of what was used for training.',
      'Generating is sampling: the same instruction gives different results. If you need to reproduce a result, fix the seed and log the configuration; and remember that synthetic data carries no information that was not already in the original data.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué distingue a un modelo generativo de uno que solo clasifica?', en: 'What distinguishes a generative model from one that only classifies?' },
      options: [
        { es: 'Siempre es más grande y tiene más capas.', en: 'It is always bigger and has more layers.' },
        { es: 'Guarda las imágenes de entrenamiento para repetirlas.', en: 'It stores the training images in order to repeat them.' },
        { es: 'Conoce la distribución de los datos, no solo la frontera entre grupos, y por eso puede sacar muestras nuevas.', en: 'It knows the distribution of the data, not just the boundary between groups, which is why it can draw new samples.' },
        { es: 'Solo funciona con imágenes.', en: 'It only works with images.' },
      ],
      answer: 2,
      why: { es: 'Para clasificar basta saber por dónde va la frontera. Para generar hay que conocer la nube por dentro: dónde se apiñan los datos y hasta dónde llegan. El tamaño no es la diferencia, y guardar imágenes no es generar.', en: 'To classify, knowing where the boundary runs is enough. To generate, you must know the cloud from the inside: where the data crowds and how far it reaches. Size is not the difference, and storing images is not generating.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué un VAE permite muestrear mejor que un autocodificador simple?', en: 'Why does a VAE allow better sampling than a simple autoencoder?' },
      options: [
        { es: 'Porque resume cada imagen en una nube y las junta en una zona conocida: el plano queda sin huecos y se sabe de dónde sacar puntos.', en: 'Because it sums up each image as a cloud and gathers them in a known zone: the plane has no holes and you know where to draw points from.' },
        { es: 'Porque su código tiene muchos más números.', en: 'Because its code has many more numbers.' },
        { es: 'Porque no necesita decodificador.', en: 'Because it needs no decoder.' },
        { es: 'Porque sus imágenes son más nítidas.', en: 'Because its images are sharper.' },
      ],
      answer: 0,
      why: { es: 'Al autocodificador solo se le pide rehacer cada imagen desde su punto: su plano queda con grupos apiñados y huecos, y no dice de dónde muestrear. El VAE obliga a que toda la nube dé la misma imagen y junta las nubes en una zona conocida. Sus imágenes, de hecho, salen algo más borrosas.', en: 'The autoencoder is only asked to rebuild each image from its point: its plane ends up with crowded groups and holes, and it does not say where to sample from. The VAE forces the whole cloud to give the same image and gathers the clouds in a known zone. Its images, in fact, come out somewhat blurrier.' },
    },
    {
      kind: 'calc',
      q: { es: 'El autocodificador de la lección resume cada imagen de 8 × 8 píxeles en un código de 2 números. ¿Cuántas veces menos números tiene el código que la imagen?', en: 'The lesson’s autoencoder sums up each 8 × 8 pixel image in a code of 2 numbers. How many times fewer numbers does the code have than the image?' },
      options: [
        { es: '8 veces menos.', en: '8 times fewer.' },
        { es: '16 veces menos.', en: '16 times fewer.' },
        { es: '64 veces menos.', en: '64 times fewer.' },
        { es: '32 veces menos.', en: '32 times fewer.' },
      ],
      answer: 3,
      why: { es: 'La imagen tiene 8 × 8 = 64 números y el código, 2: 64 ÷ 2 = 32. Por eso la reconstrucción pierde detalles: comprimir tanto siempre pierde algo.', en: 'The image has 8 × 8 = 64 numbers and the code has 2: 64 ÷ 2 = 32. That is why the reconstruction loses details: compressing that much always loses something.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor te muestra cinco imágenes sintéticas impecables de su generador para que lo compres. ¿Qué pides primero?', en: 'A vendor shows you five flawless synthetic images from their generator so that you buy it. What do you ask for first?' },
      options: [
        { es: 'Más imágenes de las mismas, en mejor resolución.', en: 'More images of the same kind, in higher resolution.' },
        { es: 'Muestras al azar, sin selección, con una medida de calidad y variedad, y qué pruebas hicieron para descartar memorización de datos de entrenamiento.', en: 'Random samples, with no selection, with a measure of quality and variety, and what tests they ran to rule out memorization of training data.' },
        { es: 'El número de parámetros del modelo.', en: 'The number of parameters in the model.' },
        { es: 'Que garantice que ninguna imagen será parecida a otra.', en: 'That they guarantee no image will look like another.' },
      ],
      answer: 1,
      why: { es: 'Cinco ejemplos escogidos no dicen nada de la calidad promedio ni de la mezcla (en la lección, el autocodificador casi nunca sacaba ochos), y los modelos grandes pueden memorizar imágenes de entrenamiento. Pide evidencia sin selección y pruebas de memorización.', en: 'Five hand-picked examples say nothing about average quality or about the mix (in the lesson, the autoencoder almost never made eights), and large models can memorize training images. Ask for unselected evidence and memorization tests.' },
    },
  ],

  glossary: ['generative-model', 'distribution', 'sampling', 'autoencoder', 'latent-space', 'vae', 'pixel', 'vector', 'feature', 'weight', 'training-data', 'loss', 'gradient-descent', 'embedding', 'vector-space'],

  terms: [
    { id: 'generative-model', term: { es: 'Modelo generativo', en: 'Generative model' }, def: { es: 'Modelo que aprende la distribución de sus datos (qué es común, qué es raro) y por eso puede producir datos nuevos parecidos. Un modelo que clasifica, en cambio, solo aprende la frontera entre grupos.', en: 'A model that learns the distribution of its data (what is common, what is rare) and can therefore produce new, similar data. A model that classifies, by contrast, only learns the boundary between groups.' } },
    { id: 'distribution', term: { es: 'Distribución', en: 'Distribution' }, def: { es: 'La forma en que se reparten los datos: qué valores (o combinaciones de valores) son comunes, cuáles raros y cuáles no aparecen nunca. En dos medidas se ve como una nube de puntos.', en: 'The way the data is spread out: which values (or combinations of values) are common, which are rare, and which never appear. With two measures it looks like a cloud of points.' } },
    { id: 'sampling', term: { es: 'Muestrear', en: 'Sampling' }, def: { es: 'Sacar un dato nuevo siguiendo una distribución: lo común sale a menudo y lo raro pocas veces. Es como genera un modelo generativo. (No confundir con las muestras de audio de la lección 2.)', en: 'Drawing a new data point that follows a distribution: common things come out often and rare things seldom. It is how a generative model generates. (Not to be confused with the audio samples of lesson 2.)' } },
    { id: 'autoencoder', term: { es: 'Autocodificador', en: 'Autoencoder' }, def: { es: 'Red de dos piezas: un codificador, que resume cada dato en pocos números (el código), y un decodificador, que intenta reconstruirlo desde el código. Se entrena para que baje el error de reconstrucción.', en: 'A two-piece network: an encoder, which sums up each data point in a few numbers (the code), and a decoder, which tries to rebuild it from the code. It is trained to bring the reconstruction error down.' } },
    { id: 'latent-space', term: { es: 'Espacio latente', en: 'Latent space' }, def: { es: 'El espacio de los códigos de un modelo («latente» significa oculto): cada dato es un punto, y los puntos cercanos suelen ser datos parecidos. Cualquier punto se puede decodificar.', en: 'The space of a model’s codes (“latent” means hidden): each data point is a point, and nearby points tend to be similar data. Any point can be decoded.' } },
    { id: 'vae', term: { es: 'Autocodificador variacional (VAE)', en: 'Variational autoencoder (VAE)' }, def: { es: 'Autocodificador que resume cada dato en una nube (centro y tamaño) en lugar de un punto, y penaliza que las nubes se alejen de una zona estándar. Así el espacio latente queda sin huecos y se puede muestrear de él.', en: 'An autoencoder that sums up each data point as a cloud (center and size) instead of a point, and penalizes clouds that stray from a standard zone. That way the latent space has no holes and you can sample from it.' } },
  ],

  sources: [
    { title: 'Optical Recognition of Handwritten Digits (UCI Machine Learning Repository, CC BY 4.0; datos de los dígitos de 8 × 8)', authors: 'Alpaydin, E., Kaynak, C.', year: 1998, url: 'https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits' },
    { title: 'Auto-Encoding Variational Bayes', authors: 'Kingma, D. P., Welling, M.', year: 2013, url: 'https://arxiv.org/abs/1312.6114' },
    { title: 'Stochastic Backpropagation and Approximate Inference in Deep Generative Models', authors: 'Rezende, D. J., Mohamed, S., Wierstra, D.', year: 2014, url: 'https://arxiv.org/abs/1401.4082' },
    { title: 'An Introduction to Variational Autoencoders', authors: 'Kingma, D. P., Welling, M.', year: 2019, url: 'https://arxiv.org/abs/1906.02691' },
    { title: 'Reducing the Dimensionality of Data with Neural Networks', authors: 'Hinton, G. E., Salakhutdinov, R. R.', year: 2006, url: 'https://doi.org/10.1126/science.1127647' },
    { title: 'Deep Learning, capítulo 14 (Autoencoders) y capítulo 20 (Deep Generative Models)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/' },
    { title: 'Optical Recognition of Handwritten Digits (UCI Machine Learning Repository, CC BY 4.0)', authors: 'Alpaydin, E., Kaynak, C.', year: 1998, url: 'https://doi.org/10.24432/C50P49' },
    { title: 'Extracting Training Data from Diffusion Models', authors: 'Carlini, N., Hayes, J., Nasr, M., Jagielski, M., Sehwag, V., Tramèr, F., Balle, B., Ippolito, D., Wallace, E.', year: 2023, url: 'https://www.usenix.org/conference/usenixsecurity23/presentation/carlini' },
  ],
});
