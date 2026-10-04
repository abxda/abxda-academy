import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'generar-distribuciones',

  objectives: {
    es: [
      'Explicar qué significa que un modelo «genere»: aprender cómo se distribuyen los datos y sortear de esa distribución.',
      'Describir cómo un autocodificador comprime una imagen en un código de pocos números y qué es el espacio latente.',
      'Distinguir un autocodificador de un VAE y predecir por qué solo el segundo permite sortear códigos de forma razonable.',
    ],
    en: [
      'Explain what it means for a model to “generate”: learn how the data is distributed and draw from that distribution.',
      'Describe how an autoencoder compresses an image into a code of a few numbers and what the latent space is.',
      'Tell an autoencoder from a VAE and predict why only the second one lets you draw codes in a sensible way.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Hasta ahora, las redes que vimos decidían: este dibujo es un siete, aquel correo es spam. ¿Y si una red pudiera dibujar un siete que nunca existió?',
      en: 'So far, the networks we met made decisions: this drawing is a seven, that email is spam. What if a network could draw a seven that never existed?',
    },
    {
      id: 'discriminate',
      es: 'Una red que discrimina recibe un dato y devuelve una etiqueta. Le basta con aprender por dónde pasa la frontera entre las clases.',
      en: 'A network that discriminates takes a data point and returns a label. All it has to learn is where the boundary between the classes runs.',
    },
    {
      id: 'generate',
      es: 'Una red que genera aprende algo más ambicioso: cómo es cada clase por dentro, dónde viven sus datos. Si lo sabe, puede ofrecer puntos nuevos que caen donde los datos suelen caer.',
      en: 'A network that generates learns something more ambitious: what each class looks like inside, where its data lives. If it knows that, it can offer new points that land where the data tends to land.',
      note: { es: 'Modelo generativo: aprende dónde viven los datos para producir datos nuevos.', en: 'Generative model: it learns where the data lives, so it can produce new data.' },
      pad: 0.6,
    },
    {
      id: 'ink',
      es: 'Veamos qué significa «dónde viven» con un solo número. Tomamos mil setecientas noventa y siete imágenes de dígitos y medimos cuánta tinta lleva cada una.',
      en: 'Let us see what “where it lives” means with a single number. We take one thousand seven hundred ninety-seven images of digits and measure how much ink each one has.',
      pad: 0.5,
    },
    {
      id: 'histogram',
      es: 'Cada barra cuenta cuántas imágenes caen en ese rango de tinta. Casi todas rondan los veinte; muy pocas llevan mucha o muy poca. Ese reparto es la distribución.',
      en: 'Each bar counts how many images fall in that range of ink. Most are near twenty; very few have a lot or very little. That pattern is the distribution.',
      note: { es: 'Distribución: qué valores son probables y cuáles son raros.', en: 'Distribution: which values are likely and which are rare.' },
      pad: 0.3,
    },
    {
      id: 'bell',
      es: 'Podemos describirla con una campana: una curva con solo dos números, dónde está su centro y qué tan ancha es. Es nuestro primer modelo de la distribución.',
      en: 'We can describe it with a bell curve: a curve with just two numbers, where its center is and how wide it is. It is our first model of the distribution.',
      pad: 0.3,
    },
    {
      id: 'score',
      es: '¿Cuál es la mejor campana? La que le da más probabilidad a los datos reales. Esa probabilidad media es una puntuación, y entrenar es subirla.',
      en: 'Which bell is best? The one that gives the most probability to the real data. That average probability is a score, and training means pushing it up.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: mueve el centro y la anchura hasta que la campana abrace los datos y la puntuación llegue a la marca de máximo.',
      en: 'Your turn: move the center and the width until the bell hugs the data and the score reaches the maximum mark.',
      gate: { id: 'fit', prompt: { es: 'Lleva la puntuación hasta la marca de máximo.', en: 'Bring the score up to the maximum mark.' } },
      pad: 0.4,
    },
    {
      id: 'sample',
      es: 'Con la campana ajustada ya podemos generar: sortear un valor siguiendo su curva. Los valores caen donde la curva es alta, igual que los datos reales.',
      en: 'With the bell fitted, we can already generate: draw a value following its curve. Values land where the curve is high, just like the real data.',
      note: { es: 'Muestrear: sortear valores siguiendo la distribución aprendida.', en: 'Sampling: drawing values by following the learned distribution.' },
      pad: 0.8,
    },
    {
      id: 'not-image',
      es: 'Pero un número de tinta no es un dígito. Para dibujar uno hay que modelar los sesenta y cuatro píxeles a la vez.',
      en: 'But a number of ink is not a digit. To draw one, we have to model all sixty-four pixels at once.',
      pad: 0.3,
    },
    {
      id: 'independent',
      es: 'Si sorteáramos cada píxel por separado, respetando cuánto suele encenderse, saldría pura estática. Los píxeles dependen unos de otros: un trazo enciende a sus vecinos.',
      en: 'If we drew each pixel separately, respecting how often it tends to light up, we would get pure static. Pixels depend on each other: a stroke lights up its neighbors.',
      note: { es: 'Los píxeles dependen unos de otros: hay que modelarlos todos juntos.', en: 'Pixels depend on each other: they must be modeled all together.' },
      pad: 0.4,
    },
    {
      id: 'space',
      es: 'Imagina todas las imágenes posibles de ocho por ocho. Casi todas son estática; los dígitos reales ocupan una franja diminuta de ese espacio.',
      en: 'Picture every possible eight-by-eight image. Almost all of them are static; real digits occupy a tiny sliver of that space.',
      pad: 0.5,
    },
    {
      id: 'compress',
      es: 'La salida es comprimir. Una red, el codificador, resume cada imagen en solo dos números: su código.',
      en: 'The way out is to compress. One network, the encoder, summarizes each image in just two numbers: its code.',
      pad: 0.3,
    },
    {
      id: 'decode',
      es: 'Otra red, el decodificador, hace el camino inverso: recibe esos dos números e intenta reconstruir la imagen original.',
      en: 'Another network, the decoder, goes the other way: it takes those two numbers and tries to rebuild the original image.',
      pad: 0.3,
    },
    {
      id: 'autoencoder',
      es: 'Las dos redes juntas forman un autocodificador. Se entrena como cualquier modelo: la pérdida es el error cuadrático entre la imagen y su reconstrucción.',
      en: 'The two networks together form an autoencoder. It is trained like any other model: the loss is the squared error between the image and its reconstruction.',
      note: { es: 'Autocodificador: comprimir y reconstruir; la pérdida es el error de reconstrucción.', en: 'Autoencoder: compress and rebuild; the loss is the reconstruction error.' },
      pad: 0.3,
    },
    {
      id: 'training',
      es: 'Al empezar, la red solo devuelve una mancha gris. Con cada paso del descenso del gradiente el error baja y los dígitos van apareciendo.',
      en: 'At the start, the network only returns a gray smudge. With every gradient descent step the error falls and the digits start to appear.',
      pad: 0.8,
    },
    {
      id: 'bottleneck',
      es: 'El tamaño del código decide cuánto se pierde. Con un número se confunden muchos dígitos; con dieciséis, casi todo se conserva. Comprimir siempre pierde algo.',
      en: 'The size of the code decides how much is lost. With one number many digits get mixed up; with sixteen, nearly everything survives. Compressing always loses something.',
      pad: 0.5,
    },
    {
      id: 'latent-map',
      es: 'Con dos números por imagen podemos dibujarlas todas como puntos en un plano: el espacio latente. Como en un embedding, lo cercano se parece, y nadie le dijo a la red qué dígito era cada uno.',
      en: 'With two numbers per image, we can draw them all as points on a plane: the latent space. As in an embedding, what is close is similar, and nobody told the network which digit was which.',
      note: { es: 'Espacio latente: el plano de los códigos; cerca significa parecido.', en: 'Latent space: the plane of codes; close means similar.' },
      pad: 0.5,
    },
    {
      id: 'walk',
      es: 'Y cada punto del plano se puede decodificar, incluso uno donde no hay ningún dato. Mover el punto es recorrer imágenes.',
      en: 'And every point on the plane can be decoded, even one where there is no data. Moving the point means walking through images.',
      pad: 0.3,
    },
    {
      id: 'try2',
      es: 'Tu turno: arrastra el punto por el plano y mira cómo cambia la imagen. Encuentra al menos tres dígitos distintos.',
      en: 'Your turn: drag the point across the plane and watch the image change. Find at least three different digits.',
      gate: { id: 'explore', prompt: { es: 'Haz que la imagen se lea como tres dígitos distintos.', en: 'Make the image read as three different digits.' } },
      pad: 0.4,
    },
    {
      id: 'mosaic',
      es: 'Si decodificamos una cuadrícula entera de puntos, aparece el mapa completo: de un dígito al siguiente, la imagen cambia poco a poco, sin saltos.',
      en: 'If we decode a whole grid of points, the full map appears: from one digit to the next, the image changes gradually, with no jumps.',
      note: { es: 'El espacio latente es continuo: puntos cercanos dan imágenes parecidas.', en: 'The latent space is continuous: nearby points give similar images.' },
      pad: 0.6,
    },
    {
      id: 'problem',
      es: 'Pero para generar hay que sortear un punto, y el autocodificador no dice dónde caer: sus códigos se reparten sin orden, apiñados en unas zonas y ausentes en otras.',
      en: 'But to generate we have to draw a point, and the autoencoder does not say where to land: its codes are scattered with no order, crowded in some areas and absent from others.',
      pad: 0.5,
    },
    {
      id: 'vae-cloud',
      es: 'El autocodificador variacional, o VAE, cambia dos cosas. Primero: el codificador no entrega un punto, sino una nube, con un centro y una dispersión.',
      en: 'The variational autoencoder, or VAE, changes two things. First: the encoder does not return a point but a cloud, with a center and a spread.',
      pad: 0.5,
    },
    {
      id: 'vae-noise',
      es: 'Al entrenar se sortea un punto dentro de esa nube y solo ese punto se decodifica. Así el decodificador aprende que puntos cercanos deben dar imágenes parecidas.',
      en: 'During training, a point is drawn inside that cloud and only that point is decoded. So the decoder learns that nearby points must give similar images.',
      pad: 0.5,
    },
    {
      id: 'vae-kl',
      es: 'Segundo: una penalización empuja todas las nubes hacia una campana estándar centrada en el origen. Así los códigos se reparten de forma conocida y sin huecos grandes.',
      en: 'Second: a penalty pushes all the clouds toward a standard bell centered at the origin. That way the codes are spread in a known way, without big gaps.',
      note: { es: 'VAE: nubes empujadas hacia una campana estándar; así se puede sortear de ella.', en: 'VAE: clouds pushed toward a standard bell, so we can draw from it.' },
      pad: 0.5,
    },
    {
      id: 'vae-sample',
      es: 'Ahora sí podemos generar: sortear un punto de la campana estándar, decodificarlo, y sale una imagen nueva.',
      en: 'Now we can generate: draw a point from the standard bell, decode it, and a new image comes out.',
      pad: 0.5,
    },
    {
      id: 'try3',
      es: 'Tu turno: sortea imágenes con cada modelo y fíjate en qué dígitos salen. ¿Cuál reparte mejor los diez dígitos?',
      en: 'Your turn: draw images with each model and look at which digits come out. Which one spreads the ten digits more evenly?',
      gate: { id: 'compare', prompt: { es: 'Sortea imágenes con el autocodificador y con el VAE, tres veces con cada uno.', en: 'Draw images with the autoencoder and with the VAE, three times each.' } },
      pad: 0.4,
    },
    {
      id: 'result',
      es: 'Sorteando en su recuadro, el autocodificador produce unos dígitos de más y otros casi nunca. El VAE reparte los diez de forma mucho más pareja, aunque no perfecta.',
      en: 'Drawing from its box, the autoencoder produces some digits too often and others almost never. The VAE spreads the ten much more evenly, though not perfectly.',
      pad: 0.5,
    },
    {
      id: 'no-collage',
      es: '¿Será un collage de dígitos guardados? Comprobémoslo: junto a cada imagen generada, el dígito de entrenamiento más parecido. Se parecen, pero no son el mismo.',
      en: 'Is it a collage of stored digits? Let us check: next to each generated image, the most similar training digit. They look alike, but they are not the same.',
      pad: 0.5,
    },
    {
      id: 'caveat',
      es: 'Con una salvedad honesta: un modelo enorme puede memorizar algunas imágenes de entrenamiento, sobre todo las repetidas, y reproducirlas casi idénticas. Ya se ha mostrado en modelos de difusión.',
      en: 'With an honest caveat: a huge model can memorize some training images, especially repeated ones, and reproduce them almost identically. This has been shown in diffusion models.',
      pad: 0.5,
    },
    {
      id: 'blurry',
      es: 'El precio es la nitidez: las imágenes del VAE salen algo borrosas, porque con el error cuadrático la red tiende a devolver un promedio de lo plausible.',
      en: 'The price is sharpness: the VAE’s images come out a bit blurry, because with squared error the network tends to return an average of what is plausible.',
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: generar es aprender una distribución y sortear de ella. El autocodificador la comprime en un espacio latente; el VAE hace posible sortear de ese espacio.',
      en: 'In short: generating means learning a distribution and drawing from it. The autoencoder compresses it into a latent space; the VAE makes it possible to draw from that space.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Hay otra forma de aprender a generar, sin comprimir ni medir probabilidades: competir. Un falsificador contra un detective.',
      en: 'There is another way to learn to generate, without compressing or measuring probabilities: competing. A forger against a detective.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo discriminativo aprende la frontera entre clases; uno generativo aprende dónde viven los datos, y por eso puede producir datos nuevos.',
      'Aprender una distribución es dar probabilidad alta a lo que se ve en los datos reales. Generar es sortear de esa distribución.',
      'Una imagen son muchos números que dependen unos de otros: los dígitos reales ocupan una franja diminuta del espacio de todas las imágenes posibles.',
      'Un autocodificador comprime cada imagen en un código de pocos números (espacio latente) y aprende a reconstruirla; cuanto más estrecho el código, más se pierde.',
      'Un VAE codifica nubes en lugar de puntos y las empuja hacia una campana estándar: así se puede sortear un código y decodificarlo. El precio son imágenes algo borrosas.',
    ],
    en: [
      'A discriminative model learns the boundary between classes; a generative one learns where the data lives, which is why it can produce new data.',
      'Learning a distribution means giving high probability to what appears in the real data. Generating means drawing from that distribution.',
      'An image is many numbers that depend on each other: real digits occupy a tiny sliver of the space of all possible images.',
      'An autoencoder compresses each image into a code of a few numbers (the latent space) and learns to rebuild it; the narrower the code, the more is lost.',
      'A VAE encodes clouds instead of points and pushes them toward a standard bell: that way you can draw a code and decode it. The price is somewhat blurry images.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA generativa recorta y pega trozos de imágenes que tiene guardadas: es un collage.',
      en: 'Generative AI cuts and pastes pieces of images it has stored: it is a collage.',
    },
    right: {
      es: 'Aprende una distribución: guarda pesos, no imágenes, y genera sorteando un punto y decodificándolo. Lo generado no es copia de ninguna imagen de entrenamiento. La excepción es la memorización (sobre todo de imágenes repetidas en los datos): un fallo que existe, se mide y se intenta evitar.',
      en: 'It learns a distribution: it stores weights, not images, and generates by drawing a point and decoding it. What it generates is not a copy of any training image. The exception is memorization (mostly of images repeated in the data): a failure that exists, is measured, and is something to avoid.',
    },
  },

  deeper: {
    es: `## Generar es aprender $p(x)$

Un modelo discriminativo aprende $p(y\\mid x)$: dado el dato, la etiqueta. Un modelo generativo aprende la distribución de los propios datos, $p_\\theta(x)$, y permite sortear $x\\sim p_\\theta(x)$. Se entrena por máxima verosimilitud:

$$\\theta^\\star=\\arg\\max_\\theta\\;\\frac1N\\sum_{i=1}^{N}\\log p_\\theta(x_i)$$

Esa media es la «puntuación» de la lección (como $x$ es continuo, $p_\\theta$ es una densidad y la puntuación puede ser negativa o positiva; lo que importa es subirla). Para la campana $p_\\theta(x)=\\mathcal N(x;\\mu,\\sigma^2)$ el máximo tiene forma cerrada:

$$\\hat\\mu=\\frac1N\\sum_i x_i,\\qquad \\hat\\sigma^2=\\frac1N\\sum_i (x_i-\\hat\\mu)^2,\\qquad \\text{puntuación}=-\\ln\\hat\\sigma-\\tfrac12\\ln 2\\pi-\\tfrac12$$

Con la tinta total (suma de los 64 píxeles, cada uno entre 0 y 1) de las 1797 imágenes: $\\hat\\mu=19{,}54$, $\\hat\\sigma=2{,}15$ y puntuación $-2{,}19$. Ninguna otra campana la supera.

## Autocodificador

Un codificador $z=E_\\phi(x)$ y un decodificador $\\hat x=D_\\theta(z)$, entrenados juntos para minimizar el error de reconstrucción:

$$\\mathcal L_{\\text{AE}}=\\lVert x-\\hat x\\rVert^2=\\sum_{j=1}^{64}(x_j-\\hat x_j)^2$$

Los modelos de la lección son diminutos: $64\\to32\\to2\\to32\\to64$ con $\\tanh$ en la capa oculta y un sigmoide a la salida (4354 parámetros), entrenados con descenso del gradiente (Adam) sobre 1500 imágenes; otras 297 se reservaron para reconstruir imágenes que la red nunca vio. Error medio por imagen reservada según el tamaño del código: 3,14 con 1 número, 2,34 con 2, 1,46 con 4, 0,95 con 8 y 0,54 con 16 (adivinar siempre la imagen media daría 4,71). Con decodificador lineal y error cuadrático, un autocodificador aprende el mismo subespacio que el PCA (Goodfellow et al., 2016, §14.1); las capas no lineales lo generalizan, y Hinton y Salakhutdinov (2006) mostraron que los autocodificadores profundos aprenden códigos que comprimen mucho mejor que el PCA.

## Autocodificador variacional (VAE)

Se postula un código con distribución previa conocida, $p(z)=\\mathcal N(0,I)$, y un decodificador $p_\\theta(x\\mid z)=\\mathcal N(D_\\theta(z),\\sigma_{\\text{obs}}^2 I)$. El codificador devuelve una nube, $q_\\phi(z\\mid x)=\\mathcal N\\big(\\mu_\\phi(x),\\operatorname{diag}\\sigma^2_\\phi(x)\\big)$, y en el entrenamiento se sortea con el truco de reparametrización, que deja pasar el gradiente:

$$z=\\mu+\\sigma\\odot\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I)$$

Lo que se maximiza es una cota inferior de $\\log p_\\theta(x)$ (la ELBO):

$$\\log p_\\theta(x)\\;\\ge\\;\\mathbb E_{q_\\phi(z\\mid x)}\\big[\\log p_\\theta(x\\mid z)\\big]-D_{\\mathrm{KL}}\\big(q_\\phi(z\\mid x)\\,\\Vert\\,p(z)\\big)$$

El primer término es el error de reconstrucción; el segundo, la penalización que acerca cada nube a la campana estándar. Para gaussianas diagonales tiene forma cerrada:

$$D_{\\mathrm{KL}}=\\tfrac12\\sum_{k}\\big(\\mu_k^2+\\sigma_k^2-\\ln\\sigma_k^2-1\\big)$$

La pérdida usada en la lección es $\\lVert x-\\hat x\\rVert^2/(2\\sigma_{\\text{obs}}^2)+D_{\\mathrm{KL}}$ con $\\sigma_{\\text{obs}}^2=0{,}1$. Los dos términos compiten: la reconstrucción separa y encoge las nubes; la penalización las junta y las ensancha. Para **generar**: $z\\sim\\mathcal N(0,I)$ y $x=D_\\theta(z)$. Con un decodificador gaussiano de varianza fija y error cuadrático, la mejor reconstrucción de un código es el promedio de las imágenes que caben en él: de ahí la borrosidad. Kingma y Welling (2019, §2.8.2) la atribuyen a que el ajuste nunca es perfecto (la cota castiga más no cubrir los datos que cubrir de más) y señalan que se atenúa con un modelo de inferencia y uno generativo más flexibles.

## En código

\`\`\`python
import numpy as np

x = np.array([18.0, 20.5, 19.0, 22.0, 17.5])   # tinta de cinco imágenes (ejemplo)
mu, sigma = x.mean(), x.std()                   # la campana que maximiza la puntuación: forma cerrada
score = np.mean(-np.log(sigma) - 0.5 * np.log(2 * np.pi) - (x - mu) ** 2 / (2 * sigma**2))
print(round(float(mu), 2), round(float(sigma), 2), round(float(score), 3))
# 19.4 1.66 -1.923

# Una nube de VAE: centro mu y desviación sigma (uno por cada número del código)
mu = np.array([0.8, -0.3])
sigma = np.array([0.5, 0.8])
kl = 0.5 * np.sum(mu**2 + sigma**2 - np.log(sigma**2) - 1)   # penalización frente a N(0, I)
print(round(float(kl), 4))
# 0.7263

epsilon = np.array([0.2, -1.0])
z = mu + sigma * epsilon                                     # un punto sorteado de la nube
print(z.round(2).tolist())
# [0.9, -1.1]
\`\`\`

## Lo que viene

Los VAE fueron propuestos de forma independiente por Kingma y Welling (2013) y por Rezende, Mohamed y Wierstra (2014). Las redes generativas adversarias (lección 16) aprenden a generar sin escribir una densidad: compitiendo. La difusión (lección 17) aprende a quitar ruido, y su versión latente trabaja dentro del espacio comprimido de un autocodificador.`,

    en: `## Generating is learning $p(x)$

A discriminative model learns $p(y\\mid x)$: given the data, the label. A generative model learns the distribution of the data itself, $p_\\theta(x)$, and lets you draw $x\\sim p_\\theta(x)$. It is trained by maximum likelihood:

$$\\theta^\\star=\\arg\\max_\\theta\\;\\frac1N\\sum_{i=1}^{N}\\log p_\\theta(x_i)$$

That average is the lesson’s “score” (since $x$ is continuous, $p_\\theta$ is a density and the score can be negative or positive; what matters is pushing it up). For the bell curve $p_\\theta(x)=\\mathcal N(x;\\mu,\\sigma^2)$ the maximum has a closed form:

$$\\hat\\mu=\\frac1N\\sum_i x_i,\\qquad \\hat\\sigma^2=\\frac1N\\sum_i (x_i-\\hat\\mu)^2,\\qquad \\text{score}=-\\ln\\hat\\sigma-\\tfrac12\\ln 2\\pi-\\tfrac12$$

With the total ink (the sum of the 64 pixels, each between 0 and 1) of the 1,797 images: $\\hat\\mu=19.54$, $\\hat\\sigma=2.15$ and score $-2.19$. No other bell beats it.

## Autoencoder

An encoder $z=E_\\phi(x)$ and a decoder $\\hat x=D_\\theta(z)$, trained together to minimize the reconstruction error:

$$\\mathcal L_{\\text{AE}}=\\lVert x-\\hat x\\rVert^2=\\sum_{j=1}^{64}(x_j-\\hat x_j)^2$$

The lesson’s models are tiny: $64\\to32\\to2\\to32\\to64$ with $\\tanh$ in the hidden layer and a sigmoid at the output (4,354 parameters), trained with gradient descent (Adam) on 1,500 images; another 297 were held back so the network could rebuild images it never saw. Mean error per held-out image by code size: 3.14 with 1 number, 2.34 with 2, 1.46 with 4, 0.95 with 8 and 0.54 with 16 (always guessing the mean image would give 4.71). With a linear decoder and squared error, an autoencoder learns the same subspace as PCA (Goodfellow et al., 2016, §14.1); nonlinear layers generalize it, and Hinton and Salakhutdinov (2006) showed that deep autoencoders learn codes that work much better than PCA.

## Variational autoencoder (VAE)

We postulate a code with a known prior, $p(z)=\\mathcal N(0,I)$, and a decoder $p_\\theta(x\\mid z)=\\mathcal N(D_\\theta(z),\\sigma_{\\text{obs}}^2 I)$. The encoder returns a cloud, $q_\\phi(z\\mid x)=\\mathcal N\\big(\\mu_\\phi(x),\\operatorname{diag}\\sigma^2_\\phi(x)\\big)$, and during training we draw with the reparameterization trick, which lets the gradient through:

$$z=\\mu+\\sigma\\odot\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I)$$

What is maximized is a lower bound on $\\log p_\\theta(x)$ (the ELBO):

$$\\log p_\\theta(x)\\;\\ge\\;\\mathbb E_{q_\\phi(z\\mid x)}\\big[\\log p_\\theta(x\\mid z)\\big]-D_{\\mathrm{KL}}\\big(q_\\phi(z\\mid x)\\,\\Vert\\,p(z)\\big)$$

The first term is the reconstruction error; the second is the penalty that pulls each cloud toward the standard bell. For diagonal Gaussians it has a closed form:

$$D_{\\mathrm{KL}}=\\tfrac12\\sum_{k}\\big(\\mu_k^2+\\sigma_k^2-\\ln\\sigma_k^2-1\\big)$$

The loss used in the lesson is $\\lVert x-\\hat x\\rVert^2/(2\\sigma_{\\text{obs}}^2)+D_{\\mathrm{KL}}$ with $\\sigma_{\\text{obs}}^2=0.1$. The two terms compete: reconstruction separates and shrinks the clouds; the penalty pulls them together and widens them. To **generate**: $z\\sim\\mathcal N(0,I)$ and $x=D_\\theta(z)$. With a fixed-variance Gaussian decoder and squared error, the best reconstruction of a code is the average of the images that fit it: hence the blur. Kingma and Welling (2019, §2.8.2) attribute it to the fit never being perfect (the bound penalizes failing to cover the data more than covering too much) and note that it eases with a sufficiently flexible inference model and generative model.

## In code

\`\`\`python
import numpy as np

x = np.array([18.0, 20.5, 19.0, 22.0, 17.5])   # ink of five images (example)
mu, sigma = x.mean(), x.std()                   # the bell that maximizes the score: closed form
score = np.mean(-np.log(sigma) - 0.5 * np.log(2 * np.pi) - (x - mu) ** 2 / (2 * sigma**2))
print(round(float(mu), 2), round(float(sigma), 2), round(float(score), 3))
# 19.4 1.66 -1.923

# A VAE cloud: center mu and standard deviation sigma (one per number in the code)
mu = np.array([0.8, -0.3])
sigma = np.array([0.5, 0.8])
kl = 0.5 * np.sum(mu**2 + sigma**2 - np.log(sigma**2) - 1)   # penalty against N(0, I)
print(round(float(kl), 4))
# 0.7263

epsilon = np.array([0.2, -1.0])
z = mu + sigma * epsilon                                     # a point drawn from the cloud
print(z.round(2).tolist())
# [0.9, -1.1]
\`\`\`

## What comes next

VAEs were proposed independently by Kingma and Welling (2013) and by Rezende, Mohamed and Wierstra (2014). Generative adversarial networks (lesson 16) learn to generate without writing down a density: by competing. Diffusion (lesson 17) learns to remove noise, and its latent version works inside the compressed space of an autoencoder.`,
  },

  lens: {
    es: [
      'Lo generado refleja la mezcla de los datos de entrenamiento, y a veces la distorsiona: en la demostración, el autocodificador casi nunca producía ciertos dígitos. Pide que midan la mezcla de lo generado, no solo que muestren ejemplos.',
      'Cinco imágenes impecables no son evidencia. Pide muestras al azar, sin selección, y una medida de calidad y de variedad (por ejemplo, cuántos de cien intentos son utilizables y cuántos se parecen entre sí).',
      '«No es un collage» es la regla, no una garantía: con modelos grandes y datos repetidos hay memorización documentada. Pregunta por la deduplicación de datos, las pruebas de memorización y el origen y la licencia de lo que se usó para entrenar.',
      'Generar es sortear: la misma instrucción da resultados distintos. Si necesitas reproducir un resultado, fija la semilla y registra la configuración; y recuerda que los datos sintéticos no traen información que no estuviera ya en los datos originales.',
    ],
    en: [
      'What is generated reflects the mix of the training data, and sometimes distorts it: in the demo, the autoencoder almost never produced certain digits. Ask them to measure the mix of what is generated, not just show examples.',
      'Five flawless images are not evidence. Ask for random samples, with no selection, and a measure of quality and variety (for example, how many of a hundred attempts are usable and how many look alike).',
      '“It is not a collage” is the rule, not a guarantee: with large models and repeated data, memorization is documented. Ask about data deduplication, memorization tests, and the origin and license of what was used for training.',
      'Generating is drawing: the same instruction gives different results. If you need to reproduce a result, fix the seed and log the configuration; and remember that synthetic data carries no information that was not already in the original data.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué distingue a un modelo generativo de uno discriminativo?', en: 'What distinguishes a generative model from a discriminative one?' },
      options: [
        { es: 'Siempre es más grande y tiene más capas.', en: 'It is always bigger and has more layers.' },
        { es: 'Memoriza los datos de entrenamiento para repetirlos.', en: 'It memorizes the training data in order to repeat it.' },
        { es: 'Aprende dónde viven los datos, no solo la frontera entre clases, y por eso puede producir datos nuevos.', en: 'It learns where the data lives, not just the boundary between classes, which is why it can produce new data.' },
        { es: 'Solo funciona con imágenes.', en: 'It only works with images.' },
      ],
      answer: 2,
      why: { es: 'El discriminativo aprende p(y | x): la etiqueta dado el dato. El generativo aprende la distribución de los datos y puede sortear de ella. El tamaño no es la diferencia, ni lo es la memorización.', en: 'The discriminative model learns p(y | x): the label given the data. The generative model learns the distribution of the data and can draw from it. Size is not the difference, and neither is memorization.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué no basta con decodificar un punto al azar del plano de un autocodificador corriente para generar?', en: 'Why is decoding a random point from an ordinary autoencoder’s plane not enough to generate?' },
      options: [
        { es: 'Porque nada define cómo se reparten los códigos: hay zonas apiñadas y vacías, y la mezcla de lo generado sale distorsionada.', en: 'Because nothing defines how the codes are spread: there are crowded and empty areas, and the mix of what is generated comes out distorted.' },
        { es: 'Porque el decodificador solo acepta puntos que estuvieron en los datos.', en: 'Because the decoder only accepts points that were in the data.' },
        { es: 'Porque el autocodificador no tiene decodificador.', en: 'Because the autoencoder has no decoder.' },
        { es: 'Porque los códigos siempre tienen cien números.', en: 'Because codes always have a hundred numbers.' },
      ],
      answer: 0,
      why: { es: 'El decodificador acepta cualquier punto, pero el autocodificador no dice de dónde sortear. En la demostración, sortear en el recuadro dio unos dígitos de más y otros casi nunca. El VAE empuja los códigos hacia una campana conocida para poder sortear de ella.', en: 'The decoder accepts any point, but the autoencoder does not say where to draw from. In the demo, drawing inside the box gave some digits too often and others almost never. The VAE pushes the codes toward a known bell so you can draw from it.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un autocodificador comprime imágenes de 28 × 28 píxeles (784 números) en un código de 16 números. ¿Cuántas veces menos números tiene el código que la imagen?', en: 'An autoencoder compresses 28 × 28 pixel images (784 numbers) into a code of 16 numbers. How many times fewer numbers does the code have than the image?' },
      options: [
        { es: '16 veces menos.', en: '16 times fewer.' },
        { es: '28 veces menos.', en: '28 times fewer.' },
        { es: '784 veces menos.', en: '784 times fewer.' },
        { es: '49 veces menos.', en: '49 times fewer.' },
      ],
      answer: 3,
      why: { es: '784 ÷ 16 = 49. Cuanto más estrecho es el código, más se comprime, y más detalle se pierde al reconstruir.', en: '784 ÷ 16 = 49. The narrower the code, the more it is compressed, and the more detail is lost when rebuilding.' },
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
      why: { es: 'Cinco ejemplos escogidos no dicen nada de la calidad promedio ni de la variedad, y los modelos grandes pueden memorizar imágenes de entrenamiento. Pide evidencia sin selección y pruebas de memorización.', en: 'Five hand-picked examples say nothing about average quality or variety, and large models can memorize training images. Ask for unselected evidence and memorization tests.' },
    },
  ],

  glossary: ['generative-model', 'distribution', 'sampling', 'autoencoder', 'latent-space', 'vae', 'pixel', 'vector', 'feature', 'loss', 'mse', 'gradient-descent', 'generalization', 'embedding', 'vector-space'],

  terms: [
    { id: 'generative-model', term: { es: 'Modelo generativo', en: 'Generative model' }, def: { es: 'Modelo que aprende cómo se distribuyen los datos (dónde viven) y por eso puede producir datos nuevos parecidos. Un modelo discriminativo, en cambio, solo aprende a separar clases.', en: 'A model that learns how the data is distributed (where it lives) and can therefore produce new, similar data. A discriminative model, by contrast, only learns to separate classes.' } },
    { id: 'distribution', term: { es: 'Distribución', en: 'Distribution' }, def: { es: 'Qué tan probable es cada valor (o cada combinación de valores) de los datos: qué es común y qué es raro. Un modelo generativo aprende una aproximación a ella.', en: 'How likely each value (or each combination of values) of the data is: what is common and what is rare. A generative model learns an approximation of it.' } },
    { id: 'sampling', term: { es: 'Muestreo', en: 'Sampling' }, def: { es: 'Sortear un dato nuevo siguiendo una distribución: los valores más probables salen más a menudo. Es la forma en que un modelo generativo genera.', en: 'Drawing a new data point by following a distribution: the likelier values come out more often. It is how a generative model generates.' } },
    { id: 'autoencoder', term: { es: 'Autocodificador', en: 'Autoencoder' }, def: { es: 'Red con un codificador, que resume cada dato en pocos números (el código), y un decodificador, que intenta reconstruirlo. Se entrena para minimizar el error de reconstrucción.', en: 'A network with an encoder, which summarizes each data point in a few numbers (the code), and a decoder, which tries to rebuild it. It is trained to minimize the reconstruction error.' } },
    { id: 'latent-space', term: { es: 'Espacio latente', en: 'Latent space' }, def: { es: 'El espacio de los códigos de un modelo: cada punto son pocos números que describen un dato comprimido. Puntos cercanos suelen ser datos parecidos.', en: 'The space of a model’s codes: each point is a few numbers describing a compressed data point. Nearby points tend to be similar data.' } },
    { id: 'vae', term: { es: 'Autocodificador variacional (VAE)', en: 'Variational autoencoder (VAE)' }, def: { es: 'Autocodificador que codifica cada dato como una nube (centro y dispersión) y penaliza que las nubes se alejen de una campana estándar, de modo que se pueda sortear un código y decodificarlo en un dato nuevo.', en: 'An autoencoder that encodes each data point as a cloud (center and spread) and penalizes clouds that stray from a standard bell, so that you can draw a code and decode it into a new data point.' } },
  ],

  sources: [
    { title: 'Auto-Encoding Variational Bayes', authors: 'Kingma, D. P., Welling, M.', year: 2013, url: 'https://arxiv.org/abs/1312.6114' },
    { title: 'Stochastic Backpropagation and Approximate Inference in Deep Generative Models', authors: 'Rezende, D. J., Mohamed, S., Wierstra, D.', year: 2014, url: 'https://arxiv.org/abs/1401.4082' },
    { title: 'Reducing the Dimensionality of Data with Neural Networks', authors: 'Hinton, G. E., Salakhutdinov, R. R.', year: 2006, url: 'https://doi.org/10.1126/science.1127647' },
    { title: 'An Introduction to Variational Autoencoders', authors: 'Kingma, D. P., Welling, M.', year: 2019, url: 'https://arxiv.org/abs/1906.02691' },
    { title: 'Deep Learning, capítulo 14 (Autoencoders) y capítulo 20 (Deep Generative Models)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/' },
    { title: 'Optical Recognition of Handwritten Digits (UCI Machine Learning Repository, CC BY 4.0)', authors: 'Alpaydin, E., Kaynak, C.', year: 1998, url: 'https://doi.org/10.24432/C50P49' },
    { title: 'Extracting Training Data from Diffusion Models', authors: 'Carlini, N., Hayes, J., Nasr, M., Jagielski, M., Sehwag, V., Tramèr, F., Balle, B., Ippolito, D., Wallace, E.', year: 2023, url: 'https://www.usenix.org/conference/usenixsecurity23/presentation/carlini' },
  ],
});
