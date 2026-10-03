import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'difusion',

  objectives: {
    es: [
      'Explicar el proceso directo (añadir ruido) y el inverso (quitarlo) y qué aprende realmente la red.',
      'Describir cómo se genera una imagen: partir de ruido puro y repetir muchos pasos pequeños.',
      'Entender el guiado y la difusión latente, y sus costos y límites.',
    ],
    en: [
      'Explain the forward process (adding noise) and the reverse one (removing it), and what the network really learns.',
      'Describe how an image is generated: start from pure noise and repeat many small steps.',
      'Understand guidance and latent diffusion, and their costs and limits.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Si supieras quitar el ruido de una imagen borrosa, paso a paso, ¿podrías crear una imagen desde cero? Eso es, en esencia, la difusión.',
      en: 'If you knew how to remove noise from a blurry image, step by step, could you create an image from scratch? That is, in essence, diffusion.',
    },
    {
      id: 'tv',
      es: 'Empecemos por lo fácil, que es destruir. Tomamos una imagen y le añadimos un poco de ruido; otra vez, y otra, hasta que solo queda estática.',
      en: 'Let us start with the easy part, which is destroying. We take an image and add a little noise; again, and again, until only static is left.',
      pad: 0.5,
    },
    {
      id: 'schedule',
      es: 'En cada paso se mezcla la imagen con ruido gaussiano según un calendario. Al principio queda casi toda la señal; al final, nada de la imagen original.',
      en: 'At each step the image is mixed with Gaussian noise according to a schedule. At first almost all the signal remains; at the end, nothing of the original image.',
      note: { es: 'Proceso directo: añadir ruido hasta que no queda señal.', en: 'Forward process: add noise until no signal is left.' },
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: recorre los pasos con el control y observa cuánta señal queda en cada uno.',
      en: 'Your turn: move through the steps with the control and see how much signal remains in each.',
      gate: { id: 'noise', prompt: { es: 'Llega hasta el último paso, donde ya no queda señal.', en: 'Go all the way to the last step, where no signal is left.' } },
      pad: 0.4,
    },
    {
      id: 'reverse',
      es: 'Lo difícil es ir en sentido contrario. Una red aprende a mirar una imagen ruidosa y a predecir el ruido que contiene.',
      en: 'The hard part is going the other way. A network learns to look at a noisy image and predict the noise it contains.',
      note: { es: 'Proceso inverso: una red predice el ruido.', en: 'Reverse process: a network predicts the noise.' },
      pad: 0.4,
    },
    {
      id: 'train',
      es: 'Se entrena así: se toma una imagen real, se le añade una cantidad aleatoria de ruido, y la red intenta adivinar ese ruido. La pérdida es sencilla: la diferencia cuadrática entre el ruido real y el predicho.',
      en: 'It is trained like this: take a real image, add a random amount of noise, and the network tries to guess that noise. The loss is simple: the squared difference between the real noise and the predicted noise.',
      pad: 0.5,
    },
    {
      id: 'sample',
      es: 'Para generar, se parte de ruido puro y se repite: la red predice el ruido, se resta un poco, y la imagen emerge en muchos pasos pequeños.',
      en: 'To generate, you start from pure noise and repeat: the network predicts the noise, a little is subtracted, and the image emerges in many small steps.',
      note: { es: 'Generar: empezar en ruido y quitar un poco, muchas veces.', en: 'Generating: start from noise and remove a little, many times.' },
      pad: 0.5,
    },
    {
      id: 'toy',
      es: 'Veámoslo funcionando, con puntos en un plano en lugar de píxeles. Estos puntos forman dos lunas: son los datos que el modelo debe aprender.',
      en: 'Let us see it working, with points on a plane instead of pixels. These points form two moons: they are the data the model has to learn.',
      pad: 0.4,
    },
    {
      id: 'toy-fwd',
      es: 'Si les añadimos ruido paso a paso, las lunas se disuelven hasta ser una nube gaussiana sin forma.',
      en: 'If we add noise step by step, the moons dissolve until they are a shapeless Gaussian cloud.',
      pad: 0.5,
    },
    {
      id: 'try2',
      es: 'Tu turno: parte de una nube de ruido y avanza el proceso inverso con un modelo real, entrenado para esto. Mira cómo se ordena en dos lunas.',
      en: 'Your turn: start from a cloud of noise and advance the reverse process with a real model trained for this. Watch it arrange itself into two moons.',
      gate: { id: 'reverse', prompt: { es: 'Avanza hasta el último paso (con «Reproducir» o paso a paso).', en: 'Advance to the last step (with “Play” or step by step).' } },
      pad: 0.4,
    },
    {
      id: 'stoch',
      es: 'Si repites con otro ruido inicial, sale otro resultado: por eso el mismo modelo genera imágenes distintas cada vez.',
      en: 'If you repeat with a different starting noise, you get a different result: that is why the same model generates different images each time.',
      note: { es: 'Otro ruido inicial, otro resultado.', en: 'Other starting noise, other result.' },
      pad: 0.5,
    },
    {
      id: 'guide',
      es: 'Para dirigir el resultado se le da a la red una etiqueta y se amplifica su efecto: es el guiado sin clasificador. A más guiado, más fidelidad a la etiqueta y menos variedad.',
      en: 'To steer the result, the network is given a label and its effect is amplified: classifier-free guidance. More guidance means more fidelity to the label and less variety.',
      note: { es: 'Guiado: amplificar el efecto de la etiqueta.', en: 'Guidance: amplify the effect of the label.' },
      pad: 0.4,
    },
    {
      id: 'try3',
      es: 'Tu turno: elige una luna, genera con guiado cero y con guiado tres, y compara fidelidad y variedad.',
      en: 'Your turn: pick a moon, generate with guidance zero and with guidance three, and compare fidelity and variety.',
      gate: { id: 'guidance', prompt: { es: 'Genera con dos niveles de guiado distintos (por ejemplo 0 y 3).', en: 'Generate with two different guidance levels (for example 0 and 3).' } },
      pad: 0.4,
    },
    {
      id: 'latent',
      es: 'Hacer todo esto sobre cada píxel es carísimo. La difusión latente trabaja en un espacio comprimido, como el de la lección anterior, y solo al final decodifica a imagen. Así funciona Stable Diffusion.',
      en: 'Doing all this on every pixel is very expensive. Latent diffusion works in a compressed space, like the one in the previous lesson, and only decodes to an image at the end. That is how Stable Diffusion works.',
      note: { es: 'Difusión latente: difundir en un espacio comprimido.', en: 'Latent diffusion: diffuse in a compressed space.' },
      pad: 0.6,
    },
    {
      id: 'cost',
      es: 'El costo: cada imagen exige muchos pasos de la red. El artículo original usaba mil; hoy hay métodos que reducen los pasos a costa de algo de calidad.',
      en: 'The cost: each image takes many network steps. The original paper used a thousand; today there are methods that cut the steps at the cost of some quality.',
      pad: 0.5,
    },
    {
      id: 'limits',
      es: 'Estos modelos aprenden de imágenes reales. De ahí nacen preguntas abiertas: de dónde vienen los datos, quién tiene los derechos, y cómo saber si una imagen es sintética.',
      en: 'These models learn from real images. That raises open questions: where the data comes from, who holds the rights, and how to tell whether an image is synthetic.',
      note: { es: 'Preguntas abiertas: datos, derechos y procedencia.', en: 'Open questions: data, rights, and provenance.' },
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: se aprende a quitar ruido, y generar es quitar ruido muchas veces empezando desde la nada, con una etiqueta que guía.',
      en: 'In short: it learns to remove noise, and generating is removing noise many times starting from nothing, with a label to guide.',
    },
    {
      id: 'bridge',
      es: 'Falta saber cómo entiende el modelo una frase como «un gato astronauta». Eso lo veremos con CLIP y el condicionamiento por texto.',
      en: 'What remains is how the model understands a phrase like “an astronaut cat.” We will see that with CLIP and text conditioning.',
    },
  ],

  keyIdeas: {
    es: [
      'El proceso directo añade ruido gaussiano según un calendario hasta que no queda señal; es fácil y no requiere aprendizaje.',
      'La red aprende el proceso inverso: dada una imagen ruidosa y el paso, predice el ruido. Se entrena minimizando el error cuadrático entre el ruido real y el predicho.',
      'Generar es partir de ruido puro y repetir muchos pasos pequeños; con otro ruido inicial, otro resultado.',
      'El guiado sin clasificador amplifica el efecto de una etiqueta (o de un texto): más fidelidad, menos variedad.',
      'La difusión latente opera en un espacio comprimido para abaratar el cómputo; aun así cada imagen cuesta decenas o cientos de pasos y plantea preguntas de datos, derechos y procedencia.',
    ],
    en: [
      'The forward process adds Gaussian noise on a schedule until no signal is left; it is easy and needs no learning.',
      'The network learns the reverse process: given a noisy image and the step, it predicts the noise. It is trained by minimizing the squared error between the real and predicted noise.',
      'Generating means starting from pure noise and repeating many small steps; with different starting noise, a different result.',
      'Classifier-free guidance amplifies the effect of a label (or a text): more fidelity, less variety.',
      'Latent diffusion works in a compressed space to cut compute; still, each image costs dozens or hundreds of steps and raises questions of data, rights, and provenance.',
    ],
  },

  misconception: {
    wrong: { es: 'Un modelo de imágenes hace un collage: recorta y pega trozos de las imágenes con las que se entrenó.', en: 'An image model makes a collage: it cuts and pastes pieces of the images it was trained on.' },
    right: { es: 'Aprende la estructura estadística de los datos y genera desde ruido, paso a paso. No guarda un catálogo para recortar, aunque en casos raros (datos muy repetidos y peticiones muy específicas) puede reproducir algo muy parecido a un ejemplo.', en: 'It learns the statistical structure of the data and generates from noise, step by step. It does not keep a catalog to cut from, although in rare cases (heavily duplicated data and very specific requests) it can reproduce something very close to an example.' },
  },

  deeper: {
    es: `## El proceso directo

Con un calendario de varianzas $\\beta_1,\\dots,\\beta_T$, sea $\\alpha_t = 1-\\beta_t$ y $\\bar\\alpha_t = \\prod_{s\\le t}\\alpha_s$. Cada paso es $q(x_t\\mid x_{t-1}) = \\mathcal N\\big(\\sqrt{\\alpha_t}\\,x_{t-1},\\ \\beta_t I\\big)$, y componiéndolos se obtiene una expresión cerrada para cualquier $t$:

$$x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I).$$

Por eso al entrenar no hace falta recorrer los pasos: se salta directo a un $t$ aleatorio. En la demostración de la lección se usan $T=40$ y $\\beta$ lineal de 0,02 a 0,30.

## El objetivo de entrenamiento

La red $\\varepsilon_\\theta(x_t, t)$ predice el ruido. La pérdida simplificada de Ho et al. (2020) es

$$L(\\theta) = \\mathbb E_{x_0,\\,t,\\,\\varepsilon}\\big[\\,\\lVert \\varepsilon - \\varepsilon_\\theta(x_t,t)\\rVert^2\\,\\big].$$

## El muestreo

Partiendo de $x_T\\sim\\mathcal N(0,I)$, para $t=T,\\dots,1$:

$$x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\Big(x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar\\alpha_t}}\\,\\varepsilon_\\theta(x_t,t)\\Big) + \\sigma_t z,\\qquad z\\sim\\mathcal N(0,I),\\ \\sigma_t^2=\\beta_t$$

(sin ruido $z$ en el último paso). Con ese mismo bucle la lección genera las dos lunas en el navegador.

## Guiado sin clasificador

Se entrena una sola red con la etiqueta $c$ y, a veces (aquí 20 %), sin ella ($\\varnothing$). Al muestrear se combina

$$\\hat\\varepsilon = \\varepsilon_\\theta(x_t,\\varnothing) + s\\,\\big(\\varepsilon_\\theta(x_t,c)-\\varepsilon_\\theta(x_t,\\varnothing)\\big),\\qquad s = 1+w.$$

Con $s=1$ ($w=0$) es el condicional puro; con $s>1$ se amplifica la dirección de la etiqueta: más fidelidad y menos variedad (Ho y Salimans, 2022).

## Difusión latente

Un autocodificador (lección 15) comprime la imagen a un latente $z=E(x)$; la difusión ocurre en $z$ y al final se decodifica $x=D(z)$. El cómputo baja porque $z$ es mucho más pequeño que la imagen (Rombach et al., 2022).

## En código

\`\`\`python
import math, torch

def perdida(red, x0, T, abar):
    t = torch.randint(0, T, (x0.shape[0],))
    eps = torch.randn_like(x0)
    xt = abar[t].sqrt()[:, None] * x0 + (1 - abar[t]).sqrt()[:, None] * eps
    return ((red(xt, t) - eps) ** 2).mean()

@torch.no_grad()
def muestrear(red, n, T, betas, abar):
    alphas = 1 - betas
    x = torch.randn(n, 2)
    for i in reversed(range(T)):
        e = red(x, torch.full((n,), i))
        media = (x - betas[i] / (1 - abar[i]).sqrt() * e) / alphas[i].sqrt()
        x = media + (betas[i].sqrt() * torch.randn_like(x) if i > 0 else 0)
    return x
\`\`\`

## Lo que viene

La lección 18 muestra cómo una frase se convierte en la «etiqueta» que guía la difusión (CLIP y el condicionamiento por texto). Más adelante, el transformer (lecciones 21 y 22) reemplaza a la red convolucional en muchos modelos de difusión modernos.`,
    en: `## The forward process

With a variance schedule $\\beta_1,\\dots,\\beta_T$, let $\\alpha_t = 1-\\beta_t$ and $\\bar\\alpha_t = \\prod_{s\\le t}\\alpha_s$. Each step is $q(x_t\\mid x_{t-1}) = \\mathcal N\\big(\\sqrt{\\alpha_t}\\,x_{t-1},\\ \\beta_t I\\big)$, and composing them gives a closed form for any $t$:

$$x_t = \\sqrt{\\bar\\alpha_t}\\,x_0 + \\sqrt{1-\\bar\\alpha_t}\\,\\varepsilon,\\qquad \\varepsilon\\sim\\mathcal N(0,I).$$

That is why training does not need to walk through the steps: it jumps straight to a random $t$. The lesson’s demo uses $T=40$ and a linear $\\beta$ from 0.02 to 0.30.

## The training objective

The network $\\varepsilon_\\theta(x_t, t)$ predicts the noise. The simplified loss of Ho et al. (2020) is

$$L(\\theta) = \\mathbb E_{x_0,\\,t,\\,\\varepsilon}\\big[\\,\\lVert \\varepsilon - \\varepsilon_\\theta(x_t,t)\\rVert^2\\,\\big].$$

## Sampling

Starting from $x_T\\sim\\mathcal N(0,I)$, for $t=T,\\dots,1$:

$$x_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\Big(x_t - \\frac{\\beta_t}{\\sqrt{1-\\bar\\alpha_t}}\\,\\varepsilon_\\theta(x_t,t)\\Big) + \\sigma_t z,\\qquad z\\sim\\mathcal N(0,I),\\ \\sigma_t^2=\\beta_t$$

(no noise $z$ on the last step). With that same loop the lesson generates the two moons in the browser.

## Classifier-free guidance

A single network is trained with the label $c$ and, sometimes (here 20%), without it ($\\varnothing$). When sampling, they are combined:

$$\\hat\\varepsilon = \\varepsilon_\\theta(x_t,\\varnothing) + s\\,\\big(\\varepsilon_\\theta(x_t,c)-\\varepsilon_\\theta(x_t,\\varnothing)\\big),\\qquad s = 1+w.$$

With $s=1$ ($w=0$) it is the pure conditional; with $s>1$ the label direction is amplified: more fidelity and less variety (Ho and Salimans, 2022).

## Latent diffusion

An autoencoder (lesson 15) compresses the image to a latent $z=E(x)$; diffusion happens in $z$ and at the end $x=D(z)$ is decoded. Compute drops because $z$ is much smaller than the image (Rombach et al., 2022).

## In code

\`\`\`python
import math, torch

def loss_fn(net, x0, T, abar):
    t = torch.randint(0, T, (x0.shape[0],))
    eps = torch.randn_like(x0)
    xt = abar[t].sqrt()[:, None] * x0 + (1 - abar[t]).sqrt()[:, None] * eps
    return ((net(xt, t) - eps) ** 2).mean()

@torch.no_grad()
def sample(net, n, T, betas, abar):
    alphas = 1 - betas
    x = torch.randn(n, 2)
    for i in reversed(range(T)):
        e = net(x, torch.full((n,), i))
        mean = (x - betas[i] / (1 - abar[i]).sqrt() * e) / alphas[i].sqrt()
        x = mean + (betas[i].sqrt() * torch.randn_like(x) if i > 0 else 0)
    return x
\`\`\`

## What comes next

Lesson 18 shows how a sentence becomes the “label” that guides diffusion (CLIP and text conditioning). Later, the transformer (lessons 21 and 22) replaces the convolutional network in many modern diffusion models.`,
  },

  lens: {
    es: [
      'Pregunta por la procedencia y la licencia de los datos con que se entrenó el modelo de imágenes, y qué indemnizaciones o políticas de uso ofrece el proveedor.',
      'El costo de generar es pasos × imágenes × tiempo de GPU: para campañas masivas, estima el volumen y compara con alternativas más baratas (menos pasos, resoluciones menores).',
      'La calidad aparente engaña: revisa detalles (texto dentro de la imagen, manos, logotipos) y mantén revisión humana antes de publicar.',
      'Para distinguir lo sintético de lo real, exige credenciales de contenido (por ejemplo, el estándar C2PA) y define una política interna de etiquetado de imágenes generadas.',
    ],
    en: [
      'Ask about the provenance and license of the data the image model was trained on, and what indemnities or usage policies the vendor offers.',
      'The cost of generating is steps × images × GPU time: for massive campaigns, estimate the volume and compare with cheaper alternatives (fewer steps, lower resolutions).',
      'Apparent quality is deceiving: check details (text inside the image, hands, logos) and keep human review before publishing.',
      'To tell synthetic from real, require content credentials (for example, the C2PA standard) and define an internal policy for labeling generated images.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué aprende la red en un modelo de difusión?', en: 'What does the network learn in a diffusion model?' },
      options: [
        { es: 'A copiar las imágenes de entrenamiento.', en: 'To copy the training images.' },
        { es: 'A comprimir imágenes en un espacio latente.', en: 'To compress images into a latent space.' },
        { es: 'A clasificar imágenes por categoría.', en: 'To classify images by category.' },
        { es: 'A predecir el ruido que contiene una imagen ruidosa en un paso dado.', en: 'To predict the noise contained in a noisy image at a given step.' },
      ],
      answer: 3,
      why: { es: 'Con esa predicción se resta un poco de ruido en cada paso y, repitiendo, se pasa de ruido puro a una imagen.', en: 'With that prediction a little noise is subtracted at each step and, repeating, one goes from pure noise to an image.' },
    },
    {
      kind: 'concept',
      q: { es: 'Con el mismo modelo y la misma etiqueta, ¿por qué salen imágenes distintas?', en: 'With the same model and the same label, why do different images come out?' },
      options: [
        { es: 'Porque el ruido inicial (y el que se añade en cada paso) es distinto.', en: 'Because the starting noise (and the noise added at each step) is different.' },
        { es: 'Porque la red cambia sus pesos en cada uso.', en: 'Because the network changes its weights on every use.' },
        { es: 'Porque el modelo se equivoca al azar.', en: 'Because the model errs at random.' },
        { es: 'Porque guarda muchas imágenes y elige una.', en: 'Because it stores many images and picks one.' },
      ],
      answer: 0,
      why: { es: 'Los pesos están fijos; lo que cambia es la semilla de ruido. Con el mismo ruido inicial y los mismos ajustes, el resultado se repite.', en: 'The weights are fixed; what changes is the noise seed. With the same starting noise and settings, the result repeats.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un sistema genera cada imagen con 50 pasos y cada paso tarda 0,04 s en una GPU. ¿Cuánto tarda una imagen, sin contar la decodificación?', en: 'A system generates each image with 50 steps and each step takes 0.04 s on a GPU. How long does one image take, not counting decoding?' },
      options: [
        { es: '0,04 s', en: '0.04 s' },
        { es: '20 s', en: '20 s' },
        { es: '2 s', en: '2 s' },
        { es: '0,5 s', en: '0.5 s' },
      ],
      answer: 2,
      why: { es: '50 pasos × 0,04 s = 2 s. Por eso reducir los pasos abarata la generación.', en: '50 steps × 0.04 s = 2 s. That is why cutting steps makes generation cheaper.' },
    },
    {
      kind: 'apply',
      q: { es: 'Una marca quiere generar imágenes publicitarias con IA. ¿Qué debería revisar primero?', en: 'A brand wants to generate ad images with AI. What should it check first?' },
      options: [
        { es: 'Solo que las imágenes se vean bonitas.', en: 'Only that the images look nice.' },
        { es: 'Cuántos píxeles tiene cada imagen.', en: 'How many pixels each image has.' },
        { es: 'La procedencia y licencia de los datos del modelo, la política de uso del proveedor y un proceso de revisión humana antes de publicar.', en: 'The provenance and license of the model’s data, the vendor’s usage policy, and a human review process before publishing.' },
        { es: 'Que el modelo tenga muchos parámetros.', en: 'That the model has many parameters.' },
      ],
      answer: 2,
      why: { es: 'El riesgo principal para una marca es legal y de reputación: derechos, semejanza con obras existentes y errores visibles. La belleza o el tamaño no lo cubren.', en: 'The main risk for a brand is legal and reputational: rights, similarity to existing works, and visible errors. Beauty or size do not cover that.' },
    },
  ],

  glossary: ['generative-model', 'latent-space', 'autoencoder', 'diffusion', 'denoising', 'noise-schedule', 'latent-diffusion', 'guidance'],

  terms: [
    { id: 'diffusion', term: { es: 'Modelo de difusión', en: 'Diffusion model' }, def: { es: 'Modelo generativo que aprende a quitar ruido paso a paso; genera partiendo de ruido puro y repitiendo muchos pasos pequeños de limpieza.', en: 'A generative model that learns to remove noise step by step; it generates by starting from pure noise and repeating many small cleaning steps.' } },
    { id: 'denoising', term: { es: 'Eliminación de ruido', en: 'Denoising' }, def: { es: 'Tarea que aprende la red de un modelo de difusión: predecir el ruido contenido en una imagen ruidosa para poder restarlo.', en: 'The task a diffusion network learns: predicting the noise contained in a noisy image so it can be subtracted.' } },
    { id: 'noise-schedule', term: { es: 'Calendario de ruido', en: 'Noise schedule' }, def: { es: 'La secuencia de cantidades de ruido que se añade en cada paso del proceso directo. Determina cuánta señal queda en cada paso.', en: 'The sequence of noise amounts added at each step of the forward process. It determines how much signal remains at each step.' } },
    { id: 'latent-diffusion', term: { es: 'Difusión latente', en: 'Latent diffusion' }, def: { es: 'Variante que hace la difusión en el espacio comprimido de un autocodificador y decodifica al final, lo que reduce el costo de cómputo.', en: 'A variant that does diffusion in the compressed space of an autoencoder and decodes at the end, which reduces compute cost.' } },
    { id: 'guidance', term: { es: 'Guiado (sin clasificador)', en: 'Guidance (classifier-free)' }, def: { es: 'Técnica que amplifica el efecto de una etiqueta o un texto al muestrear, a cambio de menos variedad.', en: 'A technique that amplifies the effect of a label or text when sampling, at the cost of less variety.' } },
  ],

  sources: [
    { title: 'Deep Unsupervised Learning using Nonequilibrium Thermodynamics', authors: 'Sohl-Dickstein, J., Weiss, E., Maheswaranathan, N., Ganguli, S.', year: 2015 },
    { title: 'Denoising Diffusion Probabilistic Models', authors: 'Ho, J., Jain, A., Abbeel, P.', year: 2020, url: 'https://arxiv.org/abs/2006.11239' },
    { title: 'Classifier-Free Diffusion Guidance', authors: 'Ho, J., Salimans, T.', year: 2022, url: 'https://arxiv.org/abs/2207.12598' },
    { title: 'High-Resolution Image Synthesis with Latent Diffusion Models', authors: 'Rombach, R., Blattmann, A., Lorenz, D., Esser, P., Ommer, B.', year: 2022, url: 'https://arxiv.org/abs/2112.10752' },
  ],
});
