import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'gans',

  objectives: {
    es: [
      'Explicar qué hace el generador (convierte un número sorteado en un dato falso) y qué hace el discriminador (estima qué tan probable es que un dato sea real).',
      'Describir el entrenamiento adversario como un juego por turnos y reconocer su final ideal: el discriminador responde 0.5 porque ya no distingue.',
      'Reconocer el colapso de modo y la inestabilidad en un entrenamiento real, y explicar por qué la difusión tomó la delantera en imágenes.',
    ],
    en: [
      'Explain what the generator does (turns a randomly drawn number into a fake data point) and what the discriminator does (estimates how likely a data point is to be real).',
      'Describe adversarial training as a turn-based game and recognize its ideal end: the discriminator answers 0.5 because it can no longer tell.',
      'Recognize mode collapse and instability in a real training run, and explain why diffusion took the lead in images.',
    ],
  },

  segments: [
    // ── el falsificador y el detective ──
    {
      id: 'hook',
      es: 'Un falsificador pinta billetes falsos y un detective intenta descubrirlos. Cada vez que el detective lo atrapa, el falsificador aprende a pintar mejor.',
      en: 'A forger paints fake bills and a detective tries to spot them. Every time the detective catches one, the forger learns to paint better.',
    },
    {
      id: 'idea',
      es: 'Esa es la idea de las GAN, siglas en inglés de redes generativas adversarias, que propusieron Ian Goodfellow y sus colegas en dos mil catorce: dos redes que aprenden compitiendo.',
      en: 'That is the idea behind GANs, generative adversarial networks, proposed by Ian Goodfellow and his colleagues in twenty fourteen: two networks that learn by competing.',
      tts: {
        es: 'Esa es la idea de las GAN, siglas en inglés de redes generativas adversarias, que propusieron Ian Gudfélou y sus colegas en dos mil catorce: dos redes que aprenden compitiendo.',
      },
      note: { es: 'GAN: dos redes que compiten; una produce datos falsos y la otra intenta descubrirlos.', en: 'GAN: two competing networks; one produces fake data, the other tries to catch it.' },
    },
    // ── los datos reales ──
    {
      id: 'axis',
      es: 'Para verlo en pequeño, cada dato será un solo número: un punto sobre esta recta, que va de menos tres a tres.',
      en: 'To see it at a small scale, each data point will be a single number: a point on this line, which runs from minus three to three.',
    },
    {
      id: 'real-dots',
      es: 'Estos son datos reales. Fíjate dónde caen: casi todos cerca de menos uno punto cinco o cerca de uno punto cinco, y muy pocos en medio.',
      en: 'These are real data. Notice where they land: almost all near minus one point five or near one point five, and very few in between.',
      pad: 0.3,
    },
    {
      id: 'hist',
      es: 'Con ochocientos datos reales contamos cuántos caen en cada tramo de la recta. La altura de cada barra es esa cuenta, y se forman dos montañas.',
      en: 'With eight hundred real data points, we count how many fall in each stretch of the line. Each bar’s height is that count, and two mountains appear.',
      pad: 0.3,
    },
    {
      id: 'goal',
      es: 'Como en la lección anterior, esa forma es la distribución de los datos. La meta: una red que invente números nuevos con la misma forma, dos montañas y un valle casi vacío.',
      en: 'As in the previous lesson, that shape is the data’s distribution. The goal: a network that invents new numbers with the same shape, two mountains and a nearly empty valley.',
    },
    // ── el falsificador (generador) ──
    {
      id: 'g-intro',
      es: 'Primer jugador: el falsificador. Su nombre técnico es generador. Es una red pequeña que recibe un número y devuelve otro número.',
      en: 'First player: the forger. Its technical name is the generator. It is a small network that takes in one number and returns another.',
      note: { es: 'Generador: la red que convierte un número sorteado en un dato falso.', en: 'Generator: the network that turns a randomly drawn number into a fake data point.' },
    },
    {
      id: 'g-noise',
      es: '¿Qué número recibe? Uno sorteado de la campana estándar de la lección anterior, casi siempre entre menos dos y dos. Es puro azar: no trae información.',
      en: 'Which number does it get? One drawn from the standard bell of the previous lesson, almost always between minus two and two. It is pure chance: it carries no information.',
    },
    {
      id: 'g-example',
      es: 'Por ejemplo: sorteamos cero punto ocho, lo pasamos por la red y sale cero punto cero siete. Ese número es un dato falso.',
      en: 'For example: we draw zero point eight, pass it through the network, and out comes zero point zero seven. That number is a fake data point.',
      pad: 0.4,
    },
    {
      id: 'g-many',
      es: 'Hacemos lo mismo con ochocientos sorteos y contamos los falsos igual que los reales. Al principio, los pesos de la red son números al azar.',
      en: 'We do the same with eight hundred draws and count the fakes just like the real ones. At first, the network’s weights are random numbers.',
      pad: 0.3,
    },
    {
      id: 'g-spike',
      es: 'Resultado: setecientos noventa y cinco de los ochocientos falsos caen en un solo tramo, junto al cero, justo en el valle. Es un falsificador novato.',
      en: 'The result: seven hundred ninety-five of the eight hundred fakes land in a single stretch, right by zero, in the valley. It is a beginner forger.',
    },
    // ── el detective (discriminador) ──
    {
      id: 'd-intro',
      es: 'Segundo jugador: el detective, cuyo nombre técnico es discriminador. Otra red pequeña: recibe un número, real o falso, y responde qué tan probable es que sea real.',
      en: 'Second player: the detective, whose technical name is the discriminator. Another small network: it takes in a number, real or fake, and answers how likely it is to be real.',
      note: { es: 'Discriminador: la red que estima qué tan probable es que un dato sea real.', en: 'Discriminator: the network that estimates how likely a data point is to be real.' },
    },
    {
      id: 'd-scale',
      es: 'Responde entre cero y uno, como la sigmoide de la lección cinco: uno es «seguro que es real»; cero, «seguro que es falso»; y cero punto cinco, «no sé».',
      en: 'It answers between zero and one, like the sigmoid from lesson five: one means “surely real,” zero means “surely fake,” and zero point five means “I can’t tell.”',
      pad: 0.3,
    },
    {
      id: 'd-flat',
      es: 'Abajo dibujamos lo que respondería a cada número de la recta. Sin entrenar, dice casi cero punto cinco a todo: todavía no sabe nada.',
      en: 'Below, we draw what it would answer for each number on the line. Untrained, it says almost zero point five to everything: it knows nothing yet.',
      pad: 0.3,
    },
    {
      id: 'd-train',
      es: 'Lo entrenamos a él solo contra el falsificador novato: le mostramos reales y falsos, y cuando se equivoca corregimos sus pesos con el descenso del gradiente.',
      en: 'We train it alone against the beginner forger: we show it real and fake numbers, and when it is wrong we correct its weights with gradient descent.',
      pad: 0.5,
    },
    {
      id: 'd-test-real',
      es: 'Tras mil pasos, su curva sube donde hay reales y se hunde junto al cero. Probemos con uno punto seis, un número real: responde cero punto nueve cinco.',
      en: 'After a thousand steps, its curve rises where the real data are and sinks next to zero. Let’s try one point six, a real number: it answers zero point nine five.',
      pad: 0.3,
    },
    {
      id: 'd-test-fake',
      es: 'Y al falso de antes, cero punto cero siete, le responde cero punto cero cinco: casi seguro de que es falso. Lo descubrió.',
      en: 'And to the earlier fake, zero point zero seven, it answers zero point zero five: almost sure it is fake. It caught it.',
      pad: 0.3,
    },
    {
      id: 'try-probe',
      es: 'Si quieres, mueve tú el número con el deslizador y mira qué responde el detective en cada parte de la recta.',
      en: 'If you like, move the number yourself with the slider and see what the detective answers along the line.',
      gate: {
        id: 'probe',
        prompt: { es: 'busca un número con respuesta mayor que 0.9 y otro con respuesta menor que 0.1.', en: 'find a number answered above 0.9 and another answered below 0.1.' },
      },
      pad: 0.4,
    },
    // ── el juego ──
    {
      id: 'game',
      es: 'Ahora los juntamos, los dos otra vez sin entrenar, en un juego por turnos que se repite dos mil veces.',
      en: 'Now we put them together, both untrained again, in a turn-based game repeated two thousand times.',
    },
    {
      id: 'turn-d',
      es: 'Turno del detective: ve un lote de reales y un lote de falsos, como los lotes de la lección nueve, y ajusta sus pesos para distinguirlos mejor.',
      en: 'The detective’s turn: it sees a batch of real numbers and a batch of fakes, like the batches of lesson nine, and adjusts its weights to tell them apart better.',
      pad: 0.3,
    },
    {
      id: 'turn-g',
      es: 'Turno del falsificador: ajusta sus pesos para que el detective diga «real» a sus falsos. Nunca ve un dato real: solo la respuesta del detective.',
      en: 'The forger’s turn: it adjusts its weights so the detective says “real” to its fakes. It never sees a real data point: only the detective’s answer.',
      note: { es: 'Entrenamiento adversario: el detective aprende a distinguir y el falsificador, a engañarlo.', en: 'Adversarial training: the detective learns to tell apart, and the forger learns to fool it.' },
      pad: 0.3,
    },
    {
      id: 'arms',
      es: 'Cuando el falsificador mejora, el detective tiene que mejorar, y al revés. Lo que gana uno lo pierde el otro: por eso se llama entrenamiento adversario.',
      en: 'When the forger improves, the detective has to improve, and vice versa. What one gains, the other loses: that is why it is called adversarial training.',
    },
    // ── la partida en vivo ──
    {
      id: 'live-start',
      es: 'Veamos la partida completa, con dos redes entrenadas de verdad para esta lección. Arriba, los falsos frente a los reales; abajo, la curva del detective.',
      en: 'Let’s watch the whole match, with two networks truly trained for this lesson. Above, the fakes against the real data; below, the detective’s curve.',
    },
    {
      id: 'live-push',
      es: 'Al principio el detective sospecha del centro. Las flechas muestran hacia dónde se mueve cada falso: hacia donde la curva sube, donde el detective dice «más real».',
      en: 'At first the detective suspects the center. The arrows show where each fake moves: toward where the curve rises, where the detective says “more real.”',
      pad: 0.5,
    },
    {
      id: 'live-spread',
      es: 'Los falsos se abren tanto que, hacia el paso quinientos, se pasan de largo: llegan hasta las orillas, donde casi no hay datos reales.',
      en: 'The fakes spread so far that, by step five hundred, they overshoot: they reach the edges, where there are almost no real data.',
      pad: 0.5,
    },
    {
      id: 'live-settle',
      es: 'Después regresan y, hacia el paso dos mil, se acomodan en las dos montañas. La curva del detective se aplana cerca de cero punto cinco.',
      en: 'Then they come back and, by step two thousand, settle into the two mountains. The detective’s curve flattens out near zero point five.',
      pad: 0.6,
    },
    {
      id: 'live-share',
      es: 'Contemos. De los falsos, cuarenta y seis por ciento cae cerca de la montaña izquierda y cuarenta y ocho, cerca de la derecha. De los reales, cuarenta y ocho y cuarenta y ocho.',
      en: 'Let’s count. Of the fakes, forty-six percent land near the left mountain and forty-eight near the right. Of the real data, forty-eight and forty-eight.',
      pad: 0.3,
    },
    {
      id: 'live-detective',
      es: 'Y sobre las dos montañas, el detective responde cero punto cinco: ya no distingue. En promedio, da cero punto cinco a los reales y cero punto cinco a los falsos.',
      en: 'And over both mountains, the detective answers zero point five: it can no longer tell. On average, it gives zero point five to the real data and zero point five to the fakes.',
      note: { es: 'Final ideal: el detective responde 0.5, porque ya no distingue reales de falsos.', en: 'Ideal end: the detective answers 0.5, because it can no longer tell real from fake.' },
      pad: 0.3,
    },
    {
      id: 'live-valley',
      es: 'Solo en el valle todavía sospecha: ahí responde cero punto tres. El falsificador deja un puente delgado de falsos entre las montañas, y los reales casi no pasan por ahí.',
      en: 'Only in the valley is it still suspicious: there it answers zero point three. The forger leaves a thin bridge of fakes between the mountains, and real data almost never land there.',
      pad: 0.3,
    },
    {
      id: 'live-narrow',
      es: 'Tampoco es perfecto: sus montañas salieron más angostas y más altas que las reales. Este detective, tan pequeño, no alcanzó a notarlo.',
      en: 'It is not perfect either: its mountains came out narrower and taller than the real ones. This detective, being so small, did not manage to notice.',
      pad: 0.3,
    },
    {
      id: 'try-live',
      es: 'Si quieres, mueve el deslizador de pasos y recorre la partida a tu ritmo, hacia atrás y hacia delante.',
      en: 'If you like, move the step slider and go through the match at your own pace, backward and forward.',
      gate: {
        id: 'live',
        prompt: { es: 'vuelve a antes del paso 300 y luego ve más allá del paso 1 500.', en: 'go back before step 300, then past step 1,500.' },
      },
      pad: 0.4,
    },
    {
      id: 'g-map',
      es: 'Así quedó el falsificador: los sorteos negativos los lleva a la montaña izquierda y los positivos, a la derecha. Convirtió una campana en dos montañas.',
      en: 'Here is how the forger ended up: it sends negative draws to the left mountain and positive ones to the right. It turned one bell into two mountains.',
      pad: 0.5,
    },
    // ── colapso de modo ──
    {
      id: 'b-setup',
      es: 'Pero el juego no siempre sale así. Cambiemos una regla: ahora el detective da cinco pasos de entrenamiento por cada paso del falsificador.',
      en: 'But the game does not always go this way. Let’s change one rule: now the detective takes five training steps for every step the forger takes.',
    },
    {
      id: 'b-run',
      es: 'Mira esta partida. El detective, mucho más entrenado, castiga fuerte a los falsos, y casi todos se van a la montaña izquierda, la más cercana.',
      en: 'Watch this match. The detective, trained much more, punishes the fakes hard, and almost all of them move to the left mountain, the nearest one.',
      pad: 0.5,
    },
    {
      id: 'b-stay',
      es: 'Y ahí se quedan, paso tras paso, hasta el dos mil. La montaña derecha se queda vacía: el falsificador nunca vuelve a cruzar el valle.',
      en: 'And there they stay, step after step, until two thousand. The right mountain stays empty: the forger never crosses the valley again.',
      pad: 0.5,
    },
    {
      id: 'b-name',
      es: 'A cada montaña se le llama modo. Esto es colapso de modo: el falsificador encuentra una clase de falso que funciona y abandona la variedad de los datos.',
      en: 'Each mountain is called a mode. This is mode collapse: the forger finds one kind of fake that works and abandons the variety of the data.',
      note: { es: 'Colapso de modo: el generador produce solo una parte de la variedad de los datos.', en: 'Mode collapse: the generator produces only part of the variety in the data.' },
    },
    {
      id: 'b-detective',
      es: 'El detective sí nota el hueco: a la montaña derecha le responde casi uno, porque ahí solo ve reales. Aun así, el falsificador no se mueve hacia ella.',
      en: 'The detective does notice the gap: to the right mountain it answers almost one, because it only sees real data there. Even so, the forger does not move toward it.',
      pad: 0.3,
    },
    {
      id: 'b-wobble',
      es: 'Y el juego nunca se calma. Mira de nuevo la segunda mitad, fijándote en el valle: el detective cambia de opinión una y otra vez.',
      en: 'And the game never settles. Watch the second half again, focusing on the valley: the detective changes its mind again and again.',
      pad: 0.8,
    },
    {
      id: 'count-intro',
      es: '¿Fue mala suerte? Repetimos el experimento cuarenta veces, cambiando solo el azar del inicio: veinte partidas con un paso del detective y veinte con cinco.',
      en: 'Was it bad luck? We repeated the experiment forty times, changing only the randomness at the start: twenty matches with one detective step and twenty with five.',
      pad: 0.4,
    },
    {
      id: 'count-result',
      es: 'Con un paso, las veinte cubren las dos montañas. Con cinco, cuatro de las veinte colapsan en una sola montaña, y una más deja la otra casi vacía.',
      en: 'With one step, all twenty cover both mountains. With five, four of the twenty collapse onto a single mountain, and one more leaves the other nearly empty.',
      pad: 0.3,
    },
    {
      id: 'instability',
      es: 'Esa es la inestabilidad de las GAN: cada jugador mejora en su turno, pero puede deshacer el avance del otro, y un ajuste o la suerte del inicio cambian el resultado.',
      en: 'That is the instability of GANs: each player improves on its turn, but it can undo the other’s progress, and one setting or the luck of the start changes the outcome.',
      note: { es: 'Inestabilidad: el juego puede oscilar o colapsar según los ajustes y el azar.', en: 'Instability: the game can oscillate or collapse depending on settings and chance.' },
    },
    // ── en el mundo real ──
    {
      id: 'faces',
      es: 'Aun así, con redes enormes las GAN llegaron lejos. En dos mil veintidós, trescientas quince personas intentaron distinguir rostros reales de rostros hechos con una GAN.',
      en: 'Even so, with huge networks GANs went far. In twenty twenty-two, three hundred fifteen people tried to tell real faces from faces made with a GAN.',
    },
    {
      id: 'faces-result',
      es: 'Acertaron el cuarenta y ocho punto dos por ciento de las veces, casi lo mismo que lanzar una moneda. Las personas, como nuestro detective, se quedaron en «no sé».',
      en: 'They were right forty-eight point two percent of the time, about the same as flipping a coin. People, like our detective, were left at “I can’t tell.”',
      pad: 0.3,
    },
    {
      id: 'diffusion',
      es: 'Pero en dos mil veintiuno, Prafulla Dhariwal y Alex Nichol mostraron que los modelos de difusión superaban a las mejores GAN en calidad de imagen.',
      en: 'But in twenty twenty-one, Prafulla Dhariwal and Alex Nichol showed that diffusion models beat the best GANs at image quality.',
      tts: {
        es: 'Pero en dos mil veintiuno, Prafula Dariwal y Alex Níkol mostraron que los modelos de difusión superaban a las mejores GAN en calidad de imagen.',
      },
    },
    {
      id: 'why-gan',
      es: 'Ellos mismos señalan los puntos débiles de las GAN: cubren menos variedad y son difíciles de entrenar; colapsan si los ajustes no se eligen con cuidado. Justo lo que vimos.',
      en: 'They point out the weak spots of GANs themselves: they cover less variety and are hard to train; they collapse unless settings are chosen carefully. Exactly what we saw.',
    },
    {
      id: 'why-diffusion',
      es: 'La difusión no compite contra nadie: su meta de entrenamiento no cambia, y cubre mejor la variedad. Su precio: genera en muchos pasos; una GAN, en una sola pasada.',
      en: 'Diffusion competes against no one: its training goal stays fixed, and it covers the variety better. Its price: it generates in many steps; a GAN, in a single pass.',
      note: { es: 'La difusión tomó la delantera: entrenamiento estable y más variedad, a cambio de generar más lento.', en: 'Diffusion took the lead: stable training and more variety, at the cost of slower generation.' },
    },
    {
      id: 'recap',
      es: 'En resumen: el generador convierte azar en datos; el discriminador los juzga; compiten hasta que el detective ya no distingue. Los riesgos: colapso de modo e inestabilidad.',
      en: 'In short: the generator turns chance into data; the discriminator judges them; they compete until the detective can no longer tell. The risks: mode collapse and instability.',
    },
    {
      id: 'bridge',
      es: 'En la siguiente lección, una idea distinta: en lugar de competir, aprender a quitar ruido, paso a paso.',
      en: 'In the next lesson, a different idea: instead of competing, learning to remove noise, step by step.',
    },
  ],

  keyIdeas: {
    es: [
      'Una GAN son dos redes que compiten: el generador convierte un número sorteado en un dato falso; el discriminador estima qué tan probable es que un dato sea real.',
      'El generador nunca ve los datos reales: aprende solo a través de la respuesta del discriminador, moviendo sus falsos hacia donde este dice «más real».',
      'El final ideal es un empate: el discriminador responde 0.5 a todo porque ya no distingue. En la GAN de la lección se llega cerca, aunque no del todo.',
      'El colapso de modo (producir solo una parte de la variedad) y la inestabilidad son sus problemas típicos: con un solo ajuste distinto, cuatro de veinte partidas colapsaron.',
      'La difusión tomó la delantera en imágenes (Dhariwal y Nichol, 2021) porque se entrena de forma estable y cubre mejor la variedad; las GAN siguen siendo más rápidas al generar.',
    ],
    en: [
      'A GAN is two competing networks: the generator turns a randomly drawn number into a fake data point; the discriminator estimates how likely a data point is to be real.',
      'The generator never sees the real data: it learns only through the discriminator’s answer, moving its fakes toward where the discriminator says “more real.”',
      'The ideal end is a tie: the discriminator answers 0.5 to everything because it can no longer tell. The lesson’s GAN gets close, though not all the way.',
      'Mode collapse (producing only part of the variety) and instability are its typical problems: with one setting changed, four of twenty matches collapsed.',
      'Diffusion took the lead in images (Dhariwal and Nichol, 2021) because it trains stably and covers the variety better; GANs are still faster at generating.',
    ],
  },

  misconception: {
    wrong: {
      es: 'El generador de una GAN aprende copiando los datos reales que le muestran.',
      en: 'A GAN’s generator learns by copying the real data it is shown.',
    },
    right: {
      es: 'El generador nunca ve un dato real. Solo recibe números al azar y la respuesta del discriminador, y ajusta sus pesos para que esa respuesta sea «real». Los datos reales solo los ve el discriminador.',
      en: 'The generator never sees a real data point. It only receives random numbers and the discriminator’s answer, and adjusts its weights so that answer becomes “real.” Only the discriminator sees the real data.',
    },
  },

  deeper: {
    es: `## El juego en una fórmula

El generador $G$ recibe ruido $z \\sim p_z$ (en la lección, la campana estándar) y produce $G(z)$. El discriminador $D$ devuelve $D(x) \\in (0, 1)$, la probabilidad que asigna a que $x$ venga de los datos. Goodfellow et al. (2014) plantean un juego de dos jugadores de tipo minimax:

$$\\min_G \\max_D \\; V(D, G) = \\mathbb{E}_{x \\sim p_{\\text{datos}}}\\big[\\log D(x)\\big] + \\mathbb{E}_{z \\sim p_z}\\big[\\log\\big(1 - D(G(z))\\big)\\big]$$

$D$ sube $V$ diciendo «1» a los reales y «0» a los falsos (es la entropía cruzada de un clasificador binario, con signo cambiado); $G$ la baja haciendo que $D(G(z))$ se acerque a 1. Lo que gana uno lo pierde el otro: es un juego de suma cero.

## El mejor detective posible y el empate

Con $G$ fijo, el discriminador óptimo es

$$D^*(x) = \\frac{p_{\\text{datos}}(x)}{p_{\\text{datos}}(x) + p_g(x)}$$

donde $p_g$ es la distribución de los falsos. Si en una zona hay dos falsos por cada real, lo mejor que puede responder ahí es $1/3$. Es lo que se mide en la partida que colapsa: en la montaña izquierda (todos los falsos y la mitad de los reales) el detective responde entre 0.32 y 0.35; en la derecha, donde no hay falsos, 1.00. El artículo demuestra que el juego tiene su óptimo global en $p_g = p_{\\text{datos}}$, con $D = \\tfrac12$ en todas partes. Ahí la pérdida del detective vale $2\\ln 2 \\approx 1.386$ y la del generador (versión no saturante, abajo) $\\ln 2 \\approx 0.693$; en los últimos doscientos pasos de la partida sana de la lección promedian 1.384 y 0.702.

## El truco no saturante y los $k$ pasos

Al principio, $D$ rechaza los falsos con mucha seguridad y $\\log(1 - D(G(z)))$ se satura: casi no da gradiente. Por eso el mismo artículo propone que $G$ maximice $\\log D(G(z))$, que tiene el mismo punto fijo y gradientes más fuertes al inicio. Es lo que usa la lección. El gradiente que corrige a $G$ pasa por $D$ (retropropagación a través de las dos redes, lección 8): para cada falso, $\\partial \\log D / \\partial x$ dice hacia dónde moverlo. Las flechas de la escena son esa derivada, calculada con la curva real del detective.

El Algoritmo 1 alterna $k$ pasos de $D$ con uno de $G$; los autores usaron $k = 1$. En la lección, $k$ es el único hiperparámetro que cambia: con $k = 1$, las 20 semillas cubren las dos montañas; con $k = 5$, 15 las cubren, 4 colapsan (una montaña recibe menos de 5 % de los falsos) y una queda a medias (48 % y 6 %). El artículo advierte del desequilibrio contrario, entrenar demasiado a $G$ sin actualizar a $D$, que llama «el escenario Helvetica»: $G$ manda demasiados valores de $z$ al mismo $x$. En los dos sentidos, el equilibrio entre los jugadores importa.

## La GAN de la lección

- **Datos**: mezcla 50/50 de $\\mathcal N(-1.5,\\ 0.4^2)$ y $\\mathcal N(1.5,\\ 0.4^2)$. Los 800 reales de la escena son cuantiles de cada campana, y los 800 sorteos del generador, cuantiles de $\\mathcal N(0, 1)$: así cada histograma es reproducible.
- **Redes**: $G$ y $D$ son iguales, $1 \\to 10\\ \\tanh \\to 10\\ \\tanh \\to 1$ (141 parámetros cada una). Adam con tasa $5 \\times 10^{-4}$ y $\\beta_1 = 0.5$, lotes de 256, 2000 pasos del generador. Los pesos se exportaron cuantizados a 16 bits y el navegador ejecuta las redes (solo la pasada hacia delante); los scripts \`train_gan.py\` y \`train_detective.py\` están en la carpeta de la lección.
- **El detective solo**: para presentarlo aparte, se entrenó el detective inicial de la partida sana durante 1000 pasos contra el falsificador inicial congelado (todo cerca de 0). Responde 0.95 a 1.6 y 0.05 a 0.07.
- **«Cerca de una montaña»**: a menos de 0.8 de su centro. Los reales: 47.75 % en cada una. Los falsos al final de la partida sana: 46.4 % y 48.1 %.
- **Lo que no salió perfecto**: las montañas falsas son más angostas (la más alta junta 337 de 800 falsos en un tramo de 0.25; la real, 98), y queda un puente de falsos en el valle. El puente es inevitable con este diseño: $G$ es una función continua de un solo número, así que los $z$ cercanos a 0 caen entre las dos montañas. Ahí $D(0) \\approx 0.30$. El detective, pequeño y entrenado al mismo ritmo, no detecta lo angosto.

## En código

\`\`\`python
import torch, torch.nn as nn
torch.manual_seed(0)

def red():   # 1 → 10 → 10 → 1, con tanh: 141 parámetros
    return nn.Sequential(nn.Linear(1, 10), nn.Tanh(), nn.Linear(10, 10), nn.Tanh(), nn.Linear(10, 1))

def reales(n):   # mezcla 50/50 de N(−1.5, 0.4²) y N(+1.5, 0.4²)
    signo = torch.randint(0, 2, (n, 1)) * 2 - 1
    return 1.5 * signo + 0.4 * torch.randn(n, 1)

G, D = red(), red()               # falsificador y detective
opt_G = torch.optim.Adam(G.parameters(), lr=5e-4, betas=(0.5, 0.999))
opt_D = torch.optim.Adam(D.parameters(), lr=5e-4, betas=(0.5, 0.999))
bce = nn.BCEWithLogitsLoss()      # aplica la sigmoide y calcula −log
uno, cero = torch.ones(256, 1), torch.zeros(256, 1)

for paso in range(2000):
    # turno del detective: a los reales debe decir 1; a los falsos, 0
    falsos = G(torch.randn(256, 1)).detach()
    perdida_D = bce(D(reales(256)), uno) + bce(D(falsos), cero)
    opt_D.zero_grad(); perdida_D.backward(); opt_D.step()
    # turno del falsificador: que el detective diga «real» a sus falsos
    perdida_G = bce(D(G(torch.randn(256, 1))), uno)
    opt_G.zero_grad(); perdida_G.backward(); opt_G.step()

with torch.no_grad():
    x = G(torch.randn(10000, 1))
    izq = ((x + 1.5).abs() < 0.8).float().mean().item()
    der = ((x - 1.5).abs() < 0.8).float().mean().item()
    print(f'falsos cerca de cada montaña: {izq:.2f} y {der:.2f}')
    dr, df = torch.sigmoid(D(reales(10000))).mean().item(), torch.sigmoid(D(x)).mean().item()
    print(f'detective, en promedio: reales {dr:.2f}, falsos {df:.2f}')
# falsos cerca de cada montaña: 0.47 y 0.48
# detective, en promedio: reales 0.50, falsos 0.50
\`\`\`

(PyTorch 2.11 en CPU; otra versión puede dar cifras algo distintas.)

## Lo que viene

Las GAN dominaron la generación de imágenes de alta calidad hasta que Dhariwal y Nichol (2021) mostraron que los modelos de difusión las superaban. Ellos mismos señalan que las GAN capturan menos variedad y son difíciles de entrenar, «colapsando sin hiperparámetros y regularizadores cuidadosamente elegidos», mientras que la difusión ofrece cobertura de la distribución, un objetivo de entrenamiento estacionario (no depende de un rival que cambia) y facilidad para escalar; su desventaja es que genera más lento, en muchos pasos de quitar ruido. Eso es la lección 17.`,

    en: `## The game in one formula

The generator $G$ takes noise $z \\sim p_z$ (in the lesson, the standard bell) and produces $G(z)$. The discriminator $D$ returns $D(x) \\in (0, 1)$, the probability it assigns to $x$ coming from the data. Goodfellow et al. (2014) set up a two-player minimax game:

$$\\min_G \\max_D \\; V(D, G) = \\mathbb{E}_{x \\sim p_{\\text{data}}}\\big[\\log D(x)\\big] + \\mathbb{E}_{z \\sim p_z}\\big[\\log\\big(1 - D(G(z))\\big)\\big]$$

$D$ raises $V$ by saying “1” to real data and “0” to fakes (it is the cross-entropy of a binary classifier, with the sign flipped); $G$ lowers it by pushing $D(G(z))$ toward 1. What one gains, the other loses: it is a zero-sum game.

## The best possible detective, and the tie

With $G$ fixed, the optimal discriminator is

$$D^*(x) = \\frac{p_{\\text{data}}(x)}{p_{\\text{data}}(x) + p_g(x)}$$

where $p_g$ is the distribution of the fakes. If a region holds two fakes for every real point, the best answer there is $1/3$. That is what the collapsing match measures: on the left mountain (all the fakes and half the real data) the detective answers between 0.32 and 0.35; on the right, where there are no fakes, 1.00. The paper proves the game’s global optimum is at $p_g = p_{\\text{data}}$, with $D = \\tfrac12$ everywhere. There the detective’s loss equals $2\\ln 2 \\approx 1.386$ and the generator’s (non-saturating version, below) $\\ln 2 \\approx 0.693$; over the last two hundred steps of the lesson’s healthy match they average 1.384 and 0.702.

## The non-saturating trick and the $k$ steps

Early on, $D$ rejects fakes with high confidence and $\\log(1 - D(G(z)))$ saturates: it gives almost no gradient. So the same paper proposes that $G$ maximize $\\log D(G(z))$ instead, which has the same fixed point and stronger gradients early on. The lesson uses it. The gradient that corrects $G$ flows through $D$ (backpropagation through both networks, lesson 8): for each fake, $\\partial \\log D / \\partial x$ says which way to move it. The arrows in the scene are that derivative, computed from the detective’s real curve.

Algorithm 1 alternates $k$ steps of $D$ with one of $G$; the authors used $k = 1$. In the lesson, $k$ is the only hyperparameter that changes: with $k = 1$, all 20 seeds cover both mountains; with $k = 5$, 15 cover them, 4 collapse (one mountain gets under 5% of the fakes), and one ends up halfway (48% and 6%). The paper warns about the opposite imbalance, training $G$ too much without updating $D$, which it calls “the Helvetica scenario”: $G$ sends too many values of $z$ to the same $x$. Either way, the balance between the players matters.

## The lesson’s GAN

- **Data**: a 50/50 mix of $\\mathcal N(-1.5,\\ 0.4^2)$ and $\\mathcal N(1.5,\\ 0.4^2)$. The scene’s 800 real points are quantiles of each bell, and the generator’s 800 draws are quantiles of $\\mathcal N(0, 1)$, so every histogram is reproducible.
- **Networks**: $G$ and $D$ are identical, $1 \\to 10\\ \\tanh \\to 10\\ \\tanh \\to 1$ (141 parameters each). Adam with rate $5 \\times 10^{-4}$ and $\\beta_1 = 0.5$, batches of 256, 2,000 generator steps. The weights were exported quantized to 16 bits and the browser runs the networks (forward pass only); the scripts \`train_gan.py\` and \`train_detective.py\` are in the lesson folder.
- **The detective alone**: to present it separately, the healthy match’s initial detective was trained for 1,000 steps against the frozen initial forger (everything near 0). It answers 0.95 to 1.6 and 0.05 to 0.07.
- **“Near a mountain”**: within 0.8 of its center. Real data: 47.75% in each. Fakes at the end of the healthy match: 46.4% and 48.1%.
- **What did not come out perfect**: the fake mountains are narrower (the tallest packs 337 of the 800 fakes into one 0.25-wide stretch; the real one, 98), and a bridge of fakes remains in the valley. The bridge is unavoidable with this design: $G$ is a continuous function of a single number, so the $z$ values near 0 land between the two mountains. There $D(0) \\approx 0.30$. The detective, small and trained at the same pace, does not detect the narrowness.

## In code

\`\`\`python
import torch, torch.nn as nn
torch.manual_seed(0)

def net():   # 1 → 10 → 10 → 1, with tanh: 141 parameters
    return nn.Sequential(nn.Linear(1, 10), nn.Tanh(), nn.Linear(10, 10), nn.Tanh(), nn.Linear(10, 1))

def real(n):   # 50/50 mix of N(−1.5, 0.4²) and N(+1.5, 0.4²)
    sign = torch.randint(0, 2, (n, 1)) * 2 - 1
    return 1.5 * sign + 0.4 * torch.randn(n, 1)

G, D = net(), net()               # forger and detective
opt_G = torch.optim.Adam(G.parameters(), lr=5e-4, betas=(0.5, 0.999))
opt_D = torch.optim.Adam(D.parameters(), lr=5e-4, betas=(0.5, 0.999))
bce = nn.BCEWithLogitsLoss()      # applies the sigmoid and computes −log
one, zero = torch.ones(256, 1), torch.zeros(256, 1)

for step in range(2000):
    # detective’s turn: it should say 1 to real data and 0 to fakes
    fakes = G(torch.randn(256, 1)).detach()
    loss_D = bce(D(real(256)), one) + bce(D(fakes), zero)
    opt_D.zero_grad(); loss_D.backward(); opt_D.step()
    # forger’s turn: make the detective say “real” to its fakes
    loss_G = bce(D(G(torch.randn(256, 1))), one)
    opt_G.zero_grad(); loss_G.backward(); opt_G.step()

with torch.no_grad():
    x = G(torch.randn(10000, 1))
    left = ((x + 1.5).abs() < 0.8).float().mean().item()
    right = ((x - 1.5).abs() < 0.8).float().mean().item()
    print(f'fakes near each mountain: {left:.2f} and {right:.2f}')
    dr, df = torch.sigmoid(D(real(10000))).mean().item(), torch.sigmoid(D(x)).mean().item()
    print(f'detective, on average: real {dr:.2f}, fakes {df:.2f}')
# fakes near each mountain: 0.47 and 0.48
# detective, on average: real 0.50, fakes 0.50
\`\`\`

(PyTorch 2.11 on CPU; another version may give slightly different figures.)

## What comes next

GANs dominated high-quality image generation until Dhariwal and Nichol (2021) showed that diffusion models beat them. They themselves point out that GANs capture less diversity and are hard to train, “collapsing without carefully selected hyperparameters and regularizers,” while diffusion offers distribution coverage, a stationary training objective (it does not depend on a changing rival), and easy scalability; its drawback is slower generation, in many noise-removal steps. That is lesson 17.`,
  },

  lens: {
    es: [
      'El ojo humano ya no es un detector confiable: en el estudio de Nightingale y Farid (2022), 315 personas acertaron 48.2 % al separar rostros reales de rostros hechos con StyleGAN2, y con entrenamiento y retroalimentación llegaron solo a 59.0 %. Verificar autenticidad exige procedencia y herramientas, no intuición.',
      'Si un proveedor genera datos sintéticos (para entrenar o para probar), pregunta cómo midió la variedad: el colapso de modo puede borrar justo los casos raros que más importan, sin que las muestras «se vean mal».',
      'Entrenar una GAN es frágil: pide resultados de varias corridas y semillas, no una sola demostración. En la lección, cambiar un ajuste hizo colapsar cuatro de veinte partidas.',
      'Elige por el uso: la difusión da más calidad y variedad pero genera en muchos pasos; una GAN genera en una sola pasada, útil cuando la velocidad manda (tiempo real, dispositivos pequeños).',
    ],
    en: [
      'The human eye is no longer a reliable detector: in Nightingale and Farid’s study (2022), 315 people were right 48.2% of the time when separating real faces from faces made with StyleGAN2, and with training and feedback they reached only 59.0%. Verifying authenticity takes provenance and tools, not intuition.',
      'If a vendor generates synthetic data (for training or testing), ask how they measured variety: mode collapse can erase exactly the rare cases that matter most, without the samples “looking bad.”',
      'Training a GAN is fragile: ask for results across several runs and seeds, not a single demo. In the lesson, changing one setting made four of twenty matches collapse.',
      'Choose by use: diffusion gives more quality and variety but generates in many steps; a GAN generates in a single pass, useful when speed rules (real time, small devices).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Durante el entrenamiento de una GAN, ¿qué recibe el generador?', en: 'During GAN training, what does the generator receive?' },
      options: [
        { es: 'Los datos reales, para copiarlos lo mejor posible.', en: 'The real data, so it can copy them as well as possible.' },
        { es: 'Números al azar, y la respuesta del discriminador a sus falsos.', en: 'Random numbers, and the discriminator’s answer to its fakes.' },
        { es: 'Las etiquetas «real» o «falso» de cada dato del conjunto.', en: 'The “real” or “fake” labels of every data point in the set.' },
        { es: 'Los pesos del discriminador, que copia en cada turno.', en: 'The discriminator’s weights, which it copies on every turn.' },
      ],
      answer: 1,
      why: {
        es: 'El generador nunca ve un dato real: transforma números sorteados en falsos y ajusta sus pesos según lo que el discriminador responde a esos falsos (el gradiente pasa a través del discriminador). Los datos reales solo los ve el discriminador.',
        en: 'The generator never sees a real data point: it turns drawn numbers into fakes and adjusts its weights according to what the discriminator answers to those fakes (the gradient flows through the discriminator). Only the discriminator sees the real data.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'En el final ideal de una GAN, ¿qué responde el discriminador a cualquier dato?', en: 'At the ideal end of a GAN, what does the discriminator answer to any data point?' },
      options: [
        { es: '1, porque aprendió a reconocer todos los datos reales.', en: '1, because it learned to recognize all the real data.' },
        { es: '0, porque descubre todos los falsos.', en: '0, because it catches all the fakes.' },
        { es: '0.5, porque los falsos ya no se distinguen de los reales.', en: '0.5, because the fakes can no longer be told apart from the real data.' },
        { es: 'Depende: 1 a los reales y 0 a los falsos.', en: 'It depends: 1 to real data and 0 to fakes.' },
      ],
      answer: 2,
      why: {
        es: 'Goodfellow et al. (2014) muestran que el óptimo del juego es que los falsos sigan la misma distribución que los reales; entonces el mejor discriminador responde ½ en todas partes. En la lección, al final, promedia 0.50 con los reales y 0.50 con los falsos.',
        en: 'Goodfellow et al. (2014) show that the game’s optimum is for the fakes to follow the same distribution as the real data; then the best discriminator answers ½ everywhere. In the lesson, at the end, it averages 0.50 on the real data and 0.50 on the fakes.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'En la partida que colapsó, en la montaña izquierda hay dos falsos por cada dato real. Si el detective solo puede guiarse por el lugar donde cae un número, ¿qué es lo mejor que puede responder ahí?',
        en: 'In the match that collapsed, the left mountain holds two fakes for every real data point. If the detective can only go by where a number lands, what is the best it can answer there?',
      },
      options: [
        { es: '0.5', en: '0.5' },
        { es: '0.67', en: '0.67' },
        { es: '1', en: '1' },
        { es: '0.33', en: '0.33' },
      ],
      answer: 3,
      why: {
        es: 'De cada tres números que caen ahí, uno es real: la probabilidad de que sea real es 1 / 3 ≈ 0.33. En la escena, el detective de esa partida responde entre 0.32 y 0.35 en la montaña izquierda, y casi 1 en la derecha, donde no hay falsos.',
        en: 'Out of every three numbers that land there, one is real: the probability that it is real is 1 / 3 ≈ 0.33. In the scene, that match’s detective answers between 0.32 and 0.35 on the left mountain, and almost 1 on the right, where there are no fakes.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Una fábrica quiere usar una GAN para generar fotos de defectos raros y así entrenar su sistema de inspección. Las fotos generadas se ven muy realistas. ¿Qué conviene revisar antes de usarlas?',
        en: 'A factory wants to use a GAN to generate photos of rare defects to train its inspection system. The generated photos look very realistic. What should be checked before using them?',
      },
      options: [
        { es: 'Nada más: si se ven realistas, el generador aprendió bien.', en: 'Nothing else: if they look realistic, the generator learned well.' },
        { es: 'Que cubran todos los tipos de defecto, en proporciones parecidas a las reales, y que el resultado se repita con varias corridas.', en: 'That they cover every defect type, in proportions similar to the real ones, and that the result holds across several runs.' },
        { es: 'Que el discriminador termine respondiendo 1 a todas las fotos generadas.', en: 'That the discriminator ends up answering 1 to all the generated photos.' },
        { es: 'Que la GAN tenga más parámetros que el sistema de inspección.', en: 'That the GAN has more parameters than the inspection system.' },
      ],
      answer: 1,
      why: {
        es: 'Con colapso de modo, cada foto puede verse realista y aun así faltar tipos enteros de defecto: lo que se ve bien no garantiza variedad. Y por la inestabilidad, una sola corrida no basta como evidencia.',
        en: 'With mode collapse, every photo can look realistic while entire defect types are missing: looking good does not guarantee variety. And because of instability, a single run is not enough evidence.',
      },
    },
  ],

  glossary: [
    'gan', 'generator', 'discriminator', 'mode-collapse',
    'generative-model', 'distribution', 'sampling', 'sigmoid', 'gradient-descent', 'backpropagation', 'batch', 'hyperparameter', 'loss', 'weight', 'diffusion',
  ],

  terms: [
    { id: 'gan', term: { es: 'GAN (red generativa adversaria)', en: 'GAN (generative adversarial network)' }, def: { es: 'Modelo generativo formado por dos redes que se entrenan compitiendo: un generador que produce datos falsos y un discriminador que intenta distinguirlos de los reales (Goodfellow et al., 2014).', en: 'A generative model made of two networks trained by competing: a generator that produces fake data and a discriminator that tries to tell it apart from real data (Goodfellow et al., 2014).' } },
    { id: 'generator', term: { es: 'Generador', en: 'Generator' }, def: { es: 'En una GAN, la red que convierte un número (o un vector) sorteado al azar en un dato falso. Nunca ve los datos reales: aprende con la respuesta del discriminador.', en: 'In a GAN, the network that turns a randomly drawn number (or vector) into a fake data point. It never sees the real data: it learns from the discriminator’s answer.' } },
    { id: 'discriminator', term: { es: 'Discriminador', en: 'Discriminator' }, def: { es: 'En una GAN, la red que recibe un dato y estima, entre 0 y 1, qué tan probable es que sea real y no del generador. En el empate ideal responde 0.5.', en: 'In a GAN, the network that receives a data point and estimates, between 0 and 1, how likely it is to be real rather than from the generator. At the ideal tie it answers 0.5.' } },
    { id: 'mode-collapse', term: { es: 'Colapso de modo', en: 'Mode collapse' }, def: { es: 'Falla típica de las GAN: el generador produce solo una parte de la variedad de los datos (por ejemplo, una sola de varias «montañas» o un solo tipo de imagen).', en: 'A typical GAN failure: the generator produces only part of the variety in the data (for example, just one of several “mountains” or a single kind of image).' } },
  ],

  sources: [
    { title: 'Generative Adversarial Networks (arXiv 1406.2661; NeurIPS 2014)', authors: 'Goodfellow, I. J., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1406.2661' },
    { title: 'NIPS 2016 Tutorial: Generative Adversarial Networks (arXiv 1701.00160)', authors: 'Goodfellow, I.', year: 2016, url: 'https://arxiv.org/abs/1701.00160' },
    { title: 'Diffusion Models Beat GANs on Image Synthesis (arXiv 2105.05233; NeurIPS 2021)', authors: 'Dhariwal, P., Nichol, A.', year: 2021, url: 'https://arxiv.org/abs/2105.05233' },
    { title: 'AI-synthesized faces are indistinguishable from real faces and more trustworthy (PNAS 119(8), e2120481119)', authors: 'Nightingale, S. J., Farid, H.', year: 2022, url: 'https://doi.org/10.1073/pnas.2120481119' },
    { title: 'Analyzing and Improving the Image Quality of StyleGAN (arXiv 1912.04958; CVPR 2020)', authors: 'Karras, T., Laine, S., Aittala, M., Hellsten, J., Lehtinen, J., Aila, T.', year: 2020, url: 'https://arxiv.org/abs/1912.04958' },
  ],
});
