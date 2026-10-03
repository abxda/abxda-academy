import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'descenso-del-gradiente',

  objectives: {
    es: [
      'Explicar cómo una máquina encuentra los pesos que minimizan el error sin ver la curva completa.',
      'Predecir qué le pasa al entrenamiento con una tasa de aprendizaje muy pequeña o muy grande.',
      'Reconocer el gradiente como la dirección cuesta arriba del error, y por qué se avanza en sentido contrario.',
    ],
    en: [
      'Explain how a machine finds the weights that minimize error without seeing the whole curve.',
      'Predict what happens to training with a very small or very large learning rate.',
      'Recognize the gradient as the uphill direction of the error, and why we step the opposite way.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Ya tenemos un modelo con un número que ajustar, el peso, y una forma de medir su error. La pregunta es cómo encontrar el peso que deja el error lo más pequeño posible.',
      en: 'We now have a model with one number to adjust, the weight, and a way to measure its error. The question is how to find the weight that makes the error as small as possible.',
      note: { es: 'Objetivo: el peso que minimiza el error.', en: 'Goal: the weight that minimizes the error.' },
    },
    {
      id: 'fog',
      es: 'El problema es que no puedes ver la curva completa. Solo sabes cuánto error hay justo donde estás, como bajar una montaña envuelto en niebla.',
      en: 'The catch is that you cannot see the whole curve. You only know how much error there is right where you stand, like walking down a mountain wrapped in fog.',
    },
    {
      id: 'question',
      es: 'Con ese único dato, ¿hacia dónde conviene mover el peso: a la izquierda o a la derecha?',
      en: 'With just that, which way should you move the weight: left or right?',
    },
    {
      id: 'slope',
      es: 'Hay que tantear el terreno. La pendiente lo dice: aquí la curva baja hacia la derecha, así que el error baja si movemos el peso a la derecha.',
      en: 'You have to feel the ground. The slope tells you: here the curve goes down to the right, so the error falls if we move the weight to the right.',
      note: { es: 'Pendiente: cuánto cambia el error al mover el peso.', en: 'Slope: how much the error changes when the weight moves.' },
    },
    {
      id: 'gradient',
      es: 'Esa pendiente es la derivada. Cuando hay muchos pesos, se reúnen en un vector, el gradiente, que apunta hacia donde el error más sube.',
      en: 'That slope is the derivative. With many weights, they are gathered into a vector, the gradient, which points to where the error rises fastest.',
      note: { es: 'Gradiente: la dirección en que el error más sube.', en: 'Gradient: the direction in which the error rises fastest.' },
    },
    {
      id: 'step',
      es: 'Así que damos un paso en sentido contrario. Su tamaño es la pendiente multiplicada por un número pequeño: la tasa de aprendizaje.',
      en: 'So we step the opposite way. The size of the step is the slope times a small number: the learning rate.',
      note: { es: 'Regla: w ← w − η · pendiente.', en: 'Rule: w ← w − η · slope.' },
    },
    {
      id: 'repeat',
      es: 'Repetimos: tantear, avanzar, tantear. En cada paso el error baja y la pendiente se aplana, hasta que casi desaparece. Llegamos al fondo.',
      en: 'We repeat: feel, step, feel. With every step the error drops and the slope flattens, until it almost disappears. We have reached the bottom.',
      note: { es: 'Repetir: el error baja y la pendiente se aplana.', en: 'Repeat: the error drops and the slope flattens.' },
      pad: 0.5,
    },
    {
      id: 'map',
      es: 'Ahora mira lo que el algoritmo nunca vio: la curva entera. Solo tanteó, paso a paso, y aun así llegó.',
      en: 'Now look at what the algorithm never saw: the whole curve. It only felt its way along, step by step, and still arrived.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: da pasos con el botón y observa cómo cambian el error y la pendiente.',
      en: 'Your turn: take steps with the button and watch how the error and the slope change.',
      gate: {
        id: 'steps',
        prompt: { es: 'Pulsa «Dar un paso» al menos cuatro veces.', en: 'Press “Take a step” at least four times.' },
      },
      pad: 0.4,
    },
    {
      id: 'lr-intro',
      es: 'Falta decidir cuánto avanzar en cada paso, y eso lo controla la tasa de aprendizaje. Veamos tres casos.',
      en: 'What is left is deciding how far to move at each step, and that is controlled by the learning rate. Let’s look at three cases.',
      note: { es: 'Tasa de aprendizaje η: el tamaño del paso.', en: 'Learning rate η: the size of the step.' },
    },
    {
      id: 'lr-small',
      es: 'Con una tasa muy pequeña avanzas sin riesgo, pero tardas una eternidad: pasos diminutos y todavía lejos del fondo.',
      en: 'With a very small learning rate you move without risk, but it takes forever: tiny steps, still far from the bottom.',
      pad: 0.3,
    },
    {
      id: 'lr-big',
      es: 'Con una tasa demasiado grande te pasas de largo: saltas de un lado a otro y, si exageras, el error sube en lugar de bajar.',
      en: 'With a rate that is too big you overshoot: you bounce from side to side and, if you overdo it, the error goes up instead of down.',
      pad: 0.5,
    },
    {
      id: 'lr-good',
      es: 'En el punto medio, la tasa baja rápido sin saltar de más. Encontrarla es parte del oficio de entrenar.',
      en: 'In the middle, the rate drops fast without overshooting. Finding it is part of the craft of training.',
      note: { es: 'Muy pequeña: lenta. Muy grande: oscila o diverge.', en: 'Too small: slow. Too big: it oscillates or diverges.' },
      pad: 0.3,
    },
    {
      id: 'try2',
      es: 'Tu turno: mueve la tasa de aprendizaje y pulsa Correr. Busca una que llegue al fondo en pocos pasos, sin oscilar.',
      en: 'Your turn: move the learning rate and press Run. Look for one that reaches the bottom in a few steps, without oscillating.',
      gate: {
        id: 'lr',
        prompt: { es: 'Encuentra una tasa que llegue al fondo en diez pasos o menos, sin oscilar.', en: 'Find a rate that reaches the bottom in ten steps or fewer, without oscillating.' },
      },
      pad: 0.4,
    },
    {
      id: 'land2d',
      es: 'Un modelo real no tiene un peso, sino muchos. Con dos, el error es un paisaje que vemos desde arriba con curvas de nivel, como en un mapa topográfico.',
      en: 'A real model has not one weight but many. With two, the error is a landscape we see from above with contour lines, like a topographic map.',
      note: { es: 'Con varios pesos, el error es un paisaje.', en: 'With several weights, the error is a landscape.' },
    },
    {
      id: 'path2d',
      es: 'El gradiente apunta cuesta arriba, perpendicular a esas curvas. Avanzamos en sentido contrario y el camino baja en zigzag hacia el centro.',
      en: 'The gradient points uphill, perpendicular to those lines. We step the opposite way and the path zigzags down toward the center.',
      pad: 0.6,
    },
    {
      id: 'scale',
      es: 'Con miles de millones de pesos pasa lo mismo: en cada paso se calcula la pendiente de cada peso y todos se ajustan a la vez. GPT-3 tiene ciento setenta y cinco mil millones.',
      en: 'With billions of weights the same thing happens: at each step the slope of every weight is computed and all of them are adjusted at once. GPT-3 has one hundred seventy-five billion.',
      tts: { es: 'Con miles de millones de pesos pasa lo mismo: en cada paso se calcula la pendiente de cada peso y todos se ajustan a la vez. Ge pe te tres tiene ciento setenta y cinco mil millones.', en: 'With billions of weights the same thing happens: at each step the slope of every weight is computed and all of them are adjusted at once. G P T three has one hundred seventy-five billion.' },
      pad: 0.4,
    },
    {
      id: 'rugged',
      es: 'Una advertencia honesta: el paisaje real es irregular, con valles, mesetas y puntos de silla. Dónde empiezas y cuánto avanzas importan, y por eso entrenar es un oficio.',
      en: 'An honest warning: real landscapes are rugged, with valleys, plateaus, and saddle points. Where you start and how far you step both matter, which is why training is a craft.',
      note: { es: 'Dónde empiezas importa: puede haber varios valles.', en: 'Where you start matters: there can be several valleys.' },
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: medir el error, tantear la pendiente, avanzar en sentido contrario y repetir. Con ese bucle aprende todo, desde una recta hasta un chatbot.',
      en: 'In short: measure the error, feel the slope, step the opposite way, and repeat. With that loop, everything learns, from a straight line to a chatbot.',
      note: { es: 'El bucle: medir, tantear, avanzar, repetir.', en: 'The loop: measure, feel, step, repeat.' },
    },
    {
      id: 'bridge',
      es: 'Para llegar más lejos necesitamos un modelo más rico que una recta. Será el siguiente protagonista: la neurona artificial.',
      en: 'To go further we need a model richer than a straight line. It will be the next protagonist: the artificial neuron.',
    },
  ],

  keyIdeas: {
    es: [
      'Entrenar un modelo es buscar los pesos que minimizan una función de error.',
      'El gradiente es la pendiente del error respecto a cada peso. Apunta cuesta arriba, así que se avanza en sentido contrario.',
      'La tasa de aprendizaje fija el tamaño del paso: demasiado pequeña es lenta; demasiado grande oscila o diverge.',
      'Nadie ve el paisaje completo: el algoritmo solo conoce la pendiente local y llega al fondo tanteando.',
      'El mismo bucle sirve desde una recta hasta modelos con cientos de miles de millones de pesos.',
    ],
    en: [
      'Training a model means searching for the weights that minimize an error function.',
      'The gradient is the slope of the error with respect to each weight. It points uphill, so we step the opposite way.',
      'The learning rate sets the size of the step: too small is slow; too large oscillates or diverges.',
      'No one sees the whole landscape: the algorithm only knows the local slope and reaches the bottom by feeling its way.',
      'The same loop works from a straight line to models with hundreds of billions of weights.',
    ],
  },

  misconception: {
    wrong: {
      es: 'La IA «ve» todo el paisaje de errores y salta directamente al mejor punto.',
      en: 'The AI “sees” the whole error landscape and jumps straight to the best point.',
    },
    right: {
      es: 'Solo conoce la pendiente justo donde está. Llega al fondo tanteando, paso a paso, y puede terminar en un valle distinto según dónde empiece.',
      en: 'It only knows the slope right where it stands. It reaches the bottom by feeling its way, step by step, and can end up in a different valley depending on where it starts.',
    },
  },

  deeper: {
    es: `## La regla de actualización

Dado un error $L(\\mathbf{w})$ y un vector de pesos $\\mathbf{w}$, el descenso del gradiente repite

$$\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta\\,\\nabla L(\\mathbf{w}_t)$$

donde $\\nabla L$ es el vector de derivadas parciales $\\partial L/\\partial w_i$ y $\\eta>0$ es la tasa de aprendizaje. El método se atribuye a Cauchy (1847).

## Por qué existe un umbral para la tasa

Para un error cuadrático de una variable, $L(w)=\\tfrac{h}{2}(w-w^*)^2 + c$ con curvatura $h>0$, el gradiente es $h\\,(w-w^*)$ y la distancia al fondo se multiplica por un factor constante en cada paso:

$$w_{t+1}-w^* = (1-\\eta h)\\,(w_t-w^*)$$

- si $0<\\eta h<1$, el peso se acerca al fondo sin cruzarlo;
- si $1<\\eta h<2$, lo cruza en cada paso pero converge (oscila);
- si $\\eta h>2$, la distancia crece en cada paso: diverge.

En la lección $h=1$. Con $\\eta=0{,}5$ cada paso reduce a la mitad la distancia al fondo; con $\\eta=1$ llegaría de un salto; con $\\eta>2$ se aleja.

## Varias dimensiones: el condicionamiento

En varias dimensiones la curvatura es la matriz hessiana $H$. Para converger hace falta $\\eta<2/\\lambda_{\\max}(H)$, pero el avance en la dirección más plana depende de $\\lambda_{\\min}$. Con el número de condición $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$ grande, el error cae despacio y el camino zigzaguea, como en la figura. Con la mejor tasa fija ($\\eta = 2/(\\lambda_{\\max}+\\lambda_{\\min})$) la distancia al fondo se reduce por un factor $(\\kappa-1)/(\\kappa+1)$ por paso.

## En código

\`\`\`python
def descenso(grad, w0, eta, pasos):
    w = w0
    historial = [w]
    for _ in range(pasos):
        w = w - eta * grad(w)
        historial.append(w)
    return historial

# error L(w) = 0.5 * (w - 2.4)**2 + 0.2  ->  gradiente: w - 2.4
print(descenso(lambda w: w - 2.4, w0=-0.6, eta=0.5, pasos=5))
# [-0.6, 0.9, 1.65, 2.025, 2.2125, 2.30625]
\`\`\`

## Lo que viene

En modelos reales el gradiente se calcula sobre un subconjunto de los datos (descenso del gradiente estocástico) y se usan optimizadores como Adam; ambos aparecen en la lección 9. El cálculo eficiente de $\\nabla L$ en redes profundas es la retropropagación (lección 8).`,
    en: `## The update rule

Given an error $L(\\mathbf{w})$ and a weight vector $\\mathbf{w}$, gradient descent repeats

$$\\mathbf{w}_{t+1} = \\mathbf{w}_t - \\eta\\,\\nabla L(\\mathbf{w}_t)$$

where $\\nabla L$ is the vector of partial derivatives $\\partial L/\\partial w_i$ and $\\eta>0$ is the learning rate. The method is credited to Cauchy (1847).

## Why there is a threshold for the rate

For a one-variable quadratic error, $L(w)=\\tfrac{h}{2}(w-w^*)^2 + c$ with curvature $h>0$, the gradient is $h\\,(w-w^*)$ and the distance to the bottom is multiplied by a constant factor at each step:

$$w_{t+1}-w^* = (1-\\eta h)\\,(w_t-w^*)$$

- if $0<\\eta h<1$, the weight approaches the bottom without crossing it;
- if $1<\\eta h<2$, it crosses at every step but converges (it oscillates);
- if $\\eta h>2$, the distance grows at every step: it diverges.

In the lesson $h=1$. With $\\eta=0.5$ each step halves the distance to the bottom; with $\\eta=1$ it would arrive in one jump; with $\\eta>2$ it moves away.

## Several dimensions: conditioning

In several dimensions the curvature is the Hessian matrix $H$. Convergence needs $\\eta<2/\\lambda_{\\max}(H)$, but progress along the flattest direction depends on $\\lambda_{\\min}$. With a large condition number $\\kappa=\\lambda_{\\max}/\\lambda_{\\min}$, the error falls slowly and the path zigzags, as in the figure. With the best fixed rate ($\\eta = 2/(\\lambda_{\\max}+\\lambda_{\\min})$) the distance to the bottom shrinks by a factor of $(\\kappa-1)/(\\kappa+1)$ per step.

## In code

\`\`\`python
def descent(grad, w0, eta, steps):
    w = w0
    history = [w]
    for _ in range(steps):
        w = w - eta * grad(w)
        history.append(w)
    return history

# error L(w) = 0.5 * (w - 2.4)**2 + 0.2  ->  gradient: w - 2.4
print(descent(lambda w: w - 2.4, w0=-0.6, eta=0.5, steps=5))
# [-0.6, 0.9, 1.65, 2.025, 2.2125, 2.30625]
\`\`\`

## What comes next

In real models the gradient is computed on a subset of the data (stochastic gradient descent) and optimizers such as Adam are used; both appear in lesson 9. The efficient computation of $\\nabla L$ in deep networks is backpropagation (lesson 8).`,
  },

  lens: {
    es: [
      'Entrenar es optimización iterativa: el costo crece con el número de pasos por el tamaño del modelo. Cada paso adicional es dinero en cómputo.',
      'Si un equipo dice que «el entrenamiento no converge», la primera pregunta es por la tasa de aprendizaje y por los datos, no por «más GPUs».',
      'El resultado depende del punto de partida y de decisiones de entrenamiento: dos corridas con la misma receta pueden dar modelos distintos. Pide que se reporte esa variabilidad.',
      'No hay garantía de haber llegado al mejor punto posible: «suficientemente bueno» se comprueba con datos que el modelo no vio (lección 10).',
    ],
    en: [
      'Training is iterative optimization: cost grows with the number of steps times the size of the model. Every extra step is compute money.',
      'If a team says “training does not converge,” the first question is about the learning rate and the data, not about “more GPUs.”',
      'The outcome depends on the starting point and on training decisions: two runs with the same recipe can yield different models. Ask for that variability to be reported.',
      'There is no guarantee of having reached the best possible point: “good enough” is checked with data the model has not seen (lesson 10).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué indica el gradiente del error respecto a los pesos?', en: 'What does the gradient of the error with respect to the weights indicate?' },
      options: [
        { es: 'La dirección en la que el error más crece.', en: 'The direction in which the error grows fastest.' },
        { es: 'La dirección en la que el error más disminuye.', en: 'The direction in which the error decreases fastest.' },
        { es: 'El valor actual del error.', en: 'The current value of the error.' },
        { es: 'La cantidad de pesos del modelo.', en: 'The number of weights in the model.' },
      ],
      answer: 0,
      why: { es: 'El gradiente apunta cuesta arriba. Por eso el descenso del gradiente avanza en el sentido contrario, restando.', en: 'The gradient points uphill. That is why gradient descent moves the opposite way, by subtracting.' },
    },
    {
      kind: 'concept',
      q: { es: 'Con una tasa de aprendizaje demasiado grande, ¿qué puede ocurrir?', en: 'With a learning rate that is too large, what can happen?' },
      options: [
        { es: 'El error puede oscilar o incluso subir en cada paso.', en: 'The error can oscillate or even rise at every step.' },
        { es: 'El entrenamiento llega siempre más rápido al fondo.', en: 'Training always reaches the bottom faster.' },
        { es: 'El modelo olvida los datos de entrenamiento.', en: 'The model forgets the training data.' },
        { es: 'Los pesos dejan de cambiar.', en: 'The weights stop changing.' },
      ],
      answer: 0,
      why: { es: 'Si el paso se pasa del fondo, cae al otro lado y puede quedar más arriba que antes. Con el paso suficientemente grande, cada salto empeora el error.', en: 'If the step overshoots the bottom, it lands on the other side and can end up higher than before. With a large enough step, every jump makes the error worse.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un peso vale 2, la pendiente del error ahí es +4 y la tasa de aprendizaje es 0,1. ¿Cuánto vale el peso después de un paso?', en: 'A weight is 2, the slope of the error there is +4, and the learning rate is 0.1. What is the weight after one step?' },
      options: [
        { es: '1,6', en: '1.6' },
        { es: '2,4', en: '2.4' },
        { es: '0,4', en: '0.4' },
        { es: '1,9', en: '1.9' },
      ],
      answer: 0,
      why: { es: 'Nuevo peso = 2 − 0,1 × 4 = 1,6. La pendiente es positiva (el error sube hacia la derecha), así que el peso baja.', en: 'New weight = 2 − 0.1 × 4 = 1.6. The slope is positive (the error rises to the right), so the weight goes down.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo informa que durante el entrenamiento el error sube y baja sin estabilizarse. ¿Cuál es la primera hipótesis razonable?', en: 'A team reports that during training the error goes up and down without settling. What is the first reasonable hypothesis?' },
      options: [
        { es: 'La tasa de aprendizaje es demasiado alta.', en: 'The learning rate is too high.' },
        { es: 'Faltan GPUs.', en: 'There are not enough GPUs.' },
        { es: 'El modelo es demasiado pequeño.', en: 'The model is too small.' },
        { es: 'Los datos están demasiado limpios.', en: 'The data is too clean.' },
      ],
      answer: 0,
      why: { es: 'La oscilación es el síntoma clásico de pasos demasiado grandes. Más cómputo no la arregla; bajar la tasa de aprendizaje, sí.', en: 'Oscillation is the classic symptom of steps that are too large. More compute does not fix it; lowering the learning rate does.' },
    },
  ],

  glossary: ['gradient', 'learning-rate', 'derivative', 'gradient-descent', 'weight', 'loss'],

  terms: [
    { id: 'gradient-descent', term: { es: 'Descenso del gradiente', en: 'Gradient descent' }, def: { es: 'Método que ajusta los pesos en pasos pequeños, siempre en sentido contrario al gradiente del error, hasta llegar a un mínimo.', en: 'A method that adjusts the weights in small steps, always opposite to the gradient of the error, until it reaches a minimum.' } },
    { id: 'gradient', term: { es: 'Gradiente', en: 'Gradient' }, def: { es: 'Vector con la pendiente del error respecto a cada peso. Apunta hacia donde el error más crece.', en: 'A vector with the slope of the error with respect to each weight. It points where the error grows fastest.' } },
    { id: 'derivative', term: { es: 'Derivada', en: 'Derivative' }, def: { es: 'La pendiente de una curva en un punto: cuánto cambia una cantidad al mover otra un poco.', en: 'The slope of a curve at a point: how much one quantity changes when another moves a little.' } },
    { id: 'learning-rate', term: { es: 'Tasa de aprendizaje', en: 'Learning rate' }, def: { es: 'Número pequeño (η) que multiplica el gradiente y fija el tamaño de cada paso. Demasiado grande oscila; demasiado pequeño tarda una eternidad.', en: 'A small number (η) that multiplies the gradient and sets the size of each step. Too large and it oscillates; too small and it takes forever.' } },
  ],

  sources: [
    { title: 'Méthode générale pour la résolution des systèmes d’équations simultanées', authors: 'Cauchy, A.', year: 1847 },
    { title: 'Optimization Methods for Large-Scale Machine Learning', authors: 'Bottou, L., Curtis, F. E., Nocedal, J.', year: 2018, url: 'https://doi.org/10.1137/16M1080173' },
    { title: 'Deep Learning, capítulo 8: Optimization for Training Deep Models', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/' },
  ],
});
