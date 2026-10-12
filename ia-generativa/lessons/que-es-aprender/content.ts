import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'que-es-aprender',

  objectives: {
    es: [
      'Explicar la diferencia entre programar (reglas + datos → respuestas) y aprender (datos + respuestas → reglas).',
      'Distinguir entrenar de usar un modelo, e identificar en él los parámetros donde guarda lo aprendido.',
      'Reconocer por qué un modelo se juzga por lo que acierta con casos nuevos y no con los ejemplos que usó para aprender.',
    ],
    en: [
      'Explain the difference between programming (rules + data → answers) and learning (data + answers → rules).',
      'Tell training from using a model, and identify the parameters where it stores what it learned.',
      'Recognize why a model is judged by how it does on new cases, not on the examples it learned from.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Llega un correo y, en un segundo, sabes si es spam. Ahora intenta explicarle a una computadora cómo lo sabes.',
      en: 'An email arrives and, in a second, you know whether it is spam. Now try explaining to a computer how you know.',
    },
    {
      id: 'measure-links',
      es: 'Empecemos por medir. Primero contamos sus enlaces, las direcciones web que trae: este correo tiene cuatro.',
      en: 'Let’s start by measuring. First we count its links, the web addresses it contains: this email has four.',
    },
    {
      id: 'measure-caps',
      es: 'Después miramos sus letras: de cada cien, unas veintidós están en mayúsculas. Es decir, veintidós por ciento.',
      en: 'Then we look at its letters: out of every hundred, about twenty-two are capitals. That is, twenty-two percent.',
    },
    {
      id: 'features',
      es: 'Esas dos medidas son todo lo que la computadora verá del correo: ni el texto ni el remitente, solo dos números. A estas medidas se les llama características.',
      en: 'Those two measures are all the computer will see of the email: not the text, not the sender, just two numbers. Measures like these are called features.',
      note: { es: 'Característica: una medida que resume cada caso con un número.', en: 'Feature: a measure that sums up each case with a number.' },
    },
    {
      id: 'axis-x',
      es: 'Para ver muchos correos a la vez, dibujamos un plano. La línea horizontal cuenta los enlaces: cero a la izquierda, diez a la derecha.',
      en: 'To see many emails at once, we draw a plane. The horizontal line counts links: zero on the left, ten on the right.',
    },
    {
      id: 'axis-y',
      es: 'La línea vertical mide las mayúsculas: abajo, casi ninguna; arriba, cuarenta de cada cien letras. Cuanto más arriba, más grita el correo.',
      en: 'The vertical line measures capitals: at the bottom, almost none; at the top, forty out of every hundred letters. The higher up, the louder the email.',
    },
    {
      id: 'place-x',
      es: 'Ubiquemos nuestro correo. Tiene cuatro enlaces: avanzamos sobre la línea horizontal hasta el cuatro.',
      en: 'Let’s place our email. It has four links: we move along the horizontal line to four.',
    },
    {
      id: 'place-y',
      es: 'Y tiene veintidós por ciento de mayúsculas: desde ahí subimos hasta la altura del veintidós. En ese cruce queda su punto.',
      en: 'And it has twenty-two percent capitals: from there we go up to the height of twenty-two. Where the two meet is its point.',
      pad: 0.3,
    },
    {
      id: 'point-means',
      es: 'Así, un correo entero se vuelve un solo punto. Su lugar lo dice todo: más a la derecha, más enlaces; más arriba, más mayúsculas.',
      en: 'So a whole email becomes a single point. Its place says it all: further right, more links; higher up, more capitals.',
    },
    {
      id: 'labeled',
      es: 'Hacemos lo mismo con treinta correos que alguien ya revisó a mano: círculo si era normal, cruz si era spam. Son datos de entrenamiento, inventados para ilustrar.',
      en: 'We do the same with thirty emails someone already checked by hand: circle if legitimate, cross if spam. These are training data, made up for illustration.',
      note: { es: 'Datos de entrenamiento: ejemplos con su respuesta.', en: 'Training data: examples with their answer.' },
    },
    {
      id: 'pattern',
      es: 'Mira dónde cae cada tipo: los normales se juntan abajo a la izquierda, con pocos enlaces y pocas mayúsculas; el spam tiende hacia la derecha o hacia arriba.',
      en: 'Look where each kind lands: legitimate emails cluster at the bottom left, with few links and few capitals; spam leans to the right or toward the top.',
    },
    {
      id: 'rule-links',
      es: 'Así lo haría un programador: escribiendo una regla. Primera parte: si un correo trae siete enlaces o más, es spam. Es todo lo que queda a la derecha de esta línea.',
      en: 'Here is how a programmer would do it: by writing a rule. Part one: if an email has seven links or more, it is spam. That is everything to the right of this line.',
    },
    {
      id: 'rule-caps',
      es: 'Segunda parte: también es spam si tiene veintiocho por ciento de mayúsculas o más, todo lo que queda por encima. Lo sombreado es lo que la regla llama spam.',
      en: 'Part two: it is also spam if it has twenty-eight percent capitals or more, everything above this line. The shaded area is what the rule calls spam.',
    },
    {
      id: 'rule-count',
      es: 'Ahora la comparamos con las respuestas anotadas. Cada correo que la regla clasifica mal queda marcado con un anillo, y el contador dice cuántos de los treinta acierta.',
      en: 'Now we compare it with the labeled answers. Each email the rule gets wrong is marked with a ring, and the counter shows how many of the thirty it gets right.',
    },
    {
      id: 'rule-demo',
      es: 'Mira qué pasa si bajamos el umbral de mayúsculas: atrapa más spam y el contador sube. Si lo bajamos demasiado, empieza a marcar correos normales y vuelve a bajar.',
      en: 'Watch what happens as we lower the capitals threshold: it catches more spam and the counter rises. Lower it too far and it starts flagging legitimate emails, and the counter drops.',
      pad: 0.4,
    },
    {
      id: 'try-rule',
      es: 'Con siete enlaces y diecisiete por ciento, la regla acierta veintiocho de treinta. Si quieres, prueba otros valores con los deslizadores de abajo.',
      en: 'With seven links and seventeen percent, the rule gets twenty-eight of thirty right. If you like, try other values with the sliders below.',
      gate: {
        id: 'rule',
        prompt: { es: 'mueve los umbrales y mira cómo cambia el contador.', en: 'move the thresholds and watch the counter change.' },
      },
      pad: 0.4,
    },
    {
      id: 'errors',
      es: 'Aun así, ninguna regla de este tipo acierta los treinta: en el centro, correos normales y spam se mezclan.',
      en: 'Even so, no rule of this kind gets all thirty: in the middle, legitimate emails and spam mix.',
    },
    {
      id: 'unseen',
      es: 'Pero esa regla se ajustó mirando estos treinta correos. Ahora la dejamos fija y le damos sesenta correos nuevos, que nunca vio.',
      en: 'But that rule was tuned by looking at these thirty emails. Now we freeze it and give it sixty new emails it has never seen.',
      pad: 0.6,
    },
    {
      id: 'two-figures',
      es: 'Ahora tenemos dos cifras. Arriba, cuántos acierta de los treinta que vio. Abajo, cuántos acierta de los sesenta nuevos. Las dos en porcentaje, para poder compararlas.',
      en: 'Now we have two figures. On top, how many of the thirty it saw it gets right. Below, how many of the sixty new ones. Both as percentages, so we can compare them.',
      pad: 0.3,
    },
    {
      id: 'generalize',
      es: 'La que importa es la de abajo: acertar con correos nuevos, que es para lo que existe la regla. A eso se le llama generalizar.',
      en: 'The one that matters is the bottom one: getting new emails right, which is what the rule is for. That is called generalizing.',
      note: { es: 'Generalizar: acertar con casos que nunca vio.', en: 'Generalizing: getting right cases it has never seen.' },
    },
    {
      id: 'tune-trap',
      es: 'Y casi siempre la de abajo es menor. Con los correos vistos, la regla luce mejor de lo que es, porque se afinó justo para ellos.',
      en: 'And the bottom one is almost always lower. On the emails it saw, the rule looks better than it is, because it was tuned for exactly them.',
    },
    {
      id: 'programming',
      es: 'Lo que hicimos se llama programar: una persona escribe las reglas, la computadora las aplica a los datos y entrega respuestas.',
      en: 'What we just did is called programming: a person writes the rules, the computer applies them to the data and returns answers.',
      note: { es: 'Programar: reglas + datos → respuestas.', en: 'Programming: rules + data → answers.' },
    },
    {
      id: 'hand-cost',
      es: 'El límite: alguien debe conocer la regla. Con dos medidas se puede intentar; con mil por correo, o con una foto, ya no es realista.',
      en: 'The limit: someone has to know the rule. With two measures you can try; with a thousand per email, or with a photo, it is no longer realistic.',
      pad: 0.4,
    },
    {
      id: 'flip',
      es: 'Aprender invierte el flujo: la computadora recibe los datos junto con sus respuestas, y lo que produce son las reglas.',
      en: 'Learning flips the flow: the computer receives the data together with the answers, and what it produces is the rules.',
      note: { es: 'Aprender: datos + respuestas → reglas.', en: 'Learning: data + answers → rules.' },
      pad: 0.4,
    },
    {
      id: 'samuel',
      es: 'Eso es aprendizaje automático, en inglés machine learning. El término se asocia a Arthur Samuel, que en mil novecientos cincuenta y nueve describió una computadora de IBM que aprendió a jugar damas.',
      en: 'That is machine learning. The term is associated with Arthur Samuel, who in nineteen fifty-nine described an IBM computer that learned to play checkers.',
      tts: {
        es: 'Eso es aprendizaje automático, en inglés machine learning. El término se asocia a Arthur Samuel, que en mil novecientos cincuenta y nueve describió una computadora de i be eme que aprendió a jugar damas.',
        en: 'That is machine learning. The term is associated with Arthur Samuel, who in nineteen fifty-nine described an I B M computer that learned to play checkers.',
      },
    },
    {
      id: 'learn-setup',
      es: 'Volvamos a los treinta correos, ahora del lado de la máquina. Ve lo mismo que viste tú: las dos características de cada correo y su respuesta. Lo que no recibe es una regla.',
      en: 'Back to the thirty emails, now from the machine’s side. It sees what you saw: each email’s two features and its answer. What it does not get is a rule.',
    },
    {
      id: 'model-idea',
      es: 'Lo que sí recibe es una forma de regla con huecos para números: un puntaje que suma las dos medidas, cada una multiplicada por un número.',
      en: 'What it does get is a form of rule with blanks for numbers: a score that adds up the two measures, each multiplied by a number.',
    },
    {
      id: 'weights',
      es: 'Esos multiplicadores se llaman pesos. Un peso grande dice: esta medida cuenta mucho. Un peso cercano a cero dice: casi no importa.',
      en: 'Those multipliers are called weights. A large weight says: this measure counts a lot. A weight near zero says: it barely matters.',
    },
    {
      id: 'bias',
      es: 'Al final se suma un número fijo, que sube o baja todos los puntajes por igual. Esa forma, con sus tres números por llenar, es un modelo.',
      en: 'At the end, a fixed number is added, which raises or lowers every score equally. That form, with its three numbers still to fill in, is a model.',
      note: { es: 'Modelo: una forma de regla con números ajustables.', en: 'Model: a form of rule with adjustable numbers.' },
    },
    {
      id: 'score-example',
      es: 'Probemos con números sencillos: peso uno para los enlaces, un medio para las mayúsculas y menos doce de número fijo. Nuestro correo da cuatro, más once punto dos, menos doce.',
      en: 'Let’s try simple numbers: weight one for links, one half for capitals, and minus twelve as the fixed number. Our email gives four, plus eleven point two, minus twelve.',
      pad: 0.3,
    },
    {
      id: 'sign',
      es: 'El resultado es tres punto dos, un número positivo. La regla del modelo es el signo: puntaje positivo, spam; negativo, normal. Este correo sale spam.',
      en: 'The result is three point two, a positive number. The model’s rule is the sign: positive score, spam; negative, legitimate. This email comes out as spam.',
    },
    {
      id: 'boundary',
      es: 'Si hacemos esa cuenta en cada punto del plano, el lado positivo y el negativo quedan separados por una recta: justo donde el puntaje vale cero.',
      en: 'If we do that calculation at every point on the plane, the positive side and the negative side are split by a straight line: exactly where the score equals zero.',
      pad: 0.3,
    },
    {
      id: 'params',
      es: 'Cambiar esos tres números mueve la recta: los pesos la inclinan y el número fijo la desplaza. Son los parámetros del modelo: ahí guarda todo lo que sabe.',
      en: 'Changing those three numbers moves the line: the weights tilt it and the fixed number shifts it. They are the model’s parameters: everything it knows is stored there.',
      note: { es: 'Parámetros: los números donde el modelo guarda lo aprendido.', en: 'Parameters: the numbers where the model stores what it learned.' },
    },
    {
      id: 'training',
      es: 'Entrenar es buscar los mejores tres números. Se empieza con unos cualquiera, que se equivocan mucho: esta recta deja la mitad de los correos del lado equivocado.',
      en: 'Training is the search for the best three numbers. You start with arbitrary ones, which get a lot wrong: this line leaves half the emails on the wrong side.',
      note: { es: 'Entrenar: ajustar los parámetros con ejemplos.', en: 'Training: adjusting the parameters with examples.' },
    },
    {
      id: 'training-loop',
      es: 'Luego se mide cuánto se equivoca, se corrigen un poco los tres números y se repite, trescientas veces. Mira cómo la recta se acomoda sola.',
      en: 'Then you measure how wrong it is, correct the three numbers a little, and repeat, three hundred times. Watch the line settle into place on its own.',
      pad: 0.5,
    },
    {
      id: 'train-result',
      es: 'Nadie escribió esta regla: la máquina la encontró en los ejemplos, con las mismas dos características. Abajo la comparamos con la regla escrita a mano, en vistos y en nuevos.',
      en: 'Nobody wrote this rule: the machine found it in the examples, using the same two features. Below we compare it with the handwritten rule, on seen and new emails.',
      pad: 0.4,
    },
    {
      id: 'train-compare',
      es: 'Aciertan parecido: con solo dos medidas, una persona paciente puede igualar a la máquina. La ventaja de aprender aparece cuando hay muchas medidas.',
      en: 'They do about the same: with only two measures, a patient person can match the machine. The advantage of learning shows up when there are many measures.',
    },
    {
      id: 'data-demo',
      es: '¿Importa con cuántos ejemplos aprende? Mira: si solo le damos seis, acierta los seis que vio, pero la recta cambia mucho y falla más con los nuevos.',
      en: 'Does it matter how many examples it learns from? Watch: with only six, it gets all six it saw right, but the line swings a lot and does worse on the new ones.',
      pad: 0.4,
    },
    {
      id: 'try-data',
      es: 'Con los treinta vuelve a estabilizarse. Si quieres, mueve tú el deslizador de ejemplos y compara con los correos nuevos.',
      en: 'With all thirty it steadies again. If you like, move the examples slider yourself and compare on the new emails.',
      gate: {
        id: 'data',
        prompt: { es: 'baja a 8 ejemplos o menos y vuelve a subir a 26 o más.', en: 'go down to 8 examples or fewer, then back up to 26 or more.' },
      },
      pad: 0.4,
    },
    {
      id: 'more-data',
      es: 'Con pocos ejemplos, acertar todos los vistos no garantiza nada. Con más ejemplos, las dos cifras, vistos y nuevos, se acercan.',
      en: 'With few examples, getting every seen one right guarantees nothing. With more examples, the two figures, seen and new, move closer.',
      pad: 0.4,
    },
    {
      id: 'use-arrive',
      es: 'Terminado el entrenamiento, los tres números quedan fijos. Llega un correo nuevo, que el modelo nunca vio.',
      en: 'Training is over and the three numbers are frozen. A new email arrives that the model has never seen.',
    },
    {
      id: 'use-measure',
      es: 'Primero se mide igual que los treinta del entrenamiento, con las mismas dos características: es lo único que el modelo sabe leer. Tiene dos enlaces y veinticuatro por ciento.',
      en: 'First it is measured just like the thirty training emails, with the same two features: they are all the model can read. It has two links and twenty-four percent.',
    },
    {
      id: 'use-compute',
      es: 'Usarlo es solo aritmética: cada medida por su peso, se suma el número fijo y se mira el signo. Es instantáneo y no aprende nada nuevo. A esto se le llama inferencia.',
      en: 'Using it is just arithmetic: each measure times its weight, add the fixed number, look at the sign. It is instant and learns nothing new. This is called inference.',
      note: { es: 'Inferencia: usar el modelo ya entrenado, con parámetros fijos.', en: 'Inference: using the trained model, with frozen parameters.' },
    },
    {
      id: 'train-vs-use',
      es: 'En modelos grandes son dos fases: entrenar es caro y se hace pocas veces; usar cuesta poco cada vez, pero se repite sin parar.',
      en: 'In large models these are two phases: training is expensive and rare; using costs little each time but repeats nonstop.',
      pad: 0.4,
    },
    {
      id: 'try-use',
      es: 'Aquí van tres correos nuevos más, y el modelo responde al instante, sin reentrenar. Si quieres, toca el plano para poner los tuyos.',
      en: 'Here are three more new emails, and the model answers instantly, with no retraining. If you like, tap the plane to place your own.',
      gate: {
        id: 'probe',
        prompt: { es: 'toca el plano (o usa el botón) para poner correos nuevos.', en: 'tap the plane (or use the button) to place new emails.' },
      },
      pad: 0.4,
    },
    {
      id: 'garbage',
      es: 'Una advertencia: la máquina aprende lo que muestran los ejemplos. Si cuatro correos a gritos se anotan mal como normales, la recta se tuerce.',
      en: 'A warning: the machine learns what the examples show. If four shouting emails are mislabeled as legitimate, the line gets bent.',
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: programar es escribir reglas; aprender es hallarlas en ejemplos; y un modelo vale por lo que acierta con casos nuevos.',
      en: 'In short: programming is writing rules; learning is finding them in examples; and a model is worth what it gets right on new cases.',
    },
    {
      id: 'when',
      es: '¿Cuándo conviene aprender? Si la regla es difícil de escribir, hay muchos ejemplos con respuesta y algún error es tolerable. Si no, escribe la regla.',
      en: 'When does learning make sense? When the rule is hard to write, there are many labeled examples, and some errors are tolerable. If not, write the rule.',
    },
    {
      id: 'bridge',
      es: 'Queda una pregunta: ¿cómo se le dan ejemplos a una máquina? Con números. Ya convertimos un correo en dos; ahora lo haremos con una imagen.',
      en: 'One question remains: how do you give examples to a machine? With numbers. We turned an email into two; next, a whole image.',
    },
  ],

  keyIdeas: {
    es: [
      'Programar es escribir reglas: reglas + datos → respuestas. Aprender invierte el flujo: datos + respuestas → reglas.',
      'Un modelo es una forma de regla con números ajustables, los parámetros. Entrenar es buscar esos números a partir de ejemplos con respuesta.',
      'Usar un modelo ya entrenado (inferencia) es aplicar sus parámetros fijos a un caso nuevo. En ese momento no aprende nada.',
      'Lo que importa es generalizar: acertar con casos nuevos. Medir con los mismos ejemplos del entrenamiento suele dar una cifra optimista.',
      'El modelo aprende lo que muestran los ejemplos: si están mal anotados o sesgados, la regla aprendida sale torcida.',
    ],
    en: [
      'Programming is writing rules: rules + data → answers. Learning flips the flow: data + answers → rules.',
      'A model is a form of rule with adjustable numbers, the parameters. Training is the search for those numbers from examples with answers.',
      'Using a trained model (inference) means applying its frozen parameters to a new case. It learns nothing at that moment.',
      'What matters is generalizing: getting new cases right. Measuring on the very examples used for training tends to give an optimistic figure.',
      'The model learns what the examples show: if they are mislabeled or biased, the rule it learns comes out bent.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Una máquina que aprende lo hace sola: se programa a sí misma sin que nadie le diga nada.',
      en: 'A machine that learns does it on its own: it programs itself without anyone telling it anything.',
    },
    right: {
      es: 'Alguien decide qué medir, reúne y anota los ejemplos, elige la forma del modelo y comprueba el resultado con casos nuevos. La máquina solo busca los números.',
      en: 'Someone decides what to measure, gathers and labels the examples, chooses the form of the model, and checks the result on new cases. The machine only searches for the numbers.',
    },
  },

  deeper: {
    es: `## Dos flujos de información

Programar es construir una función que, dadas las reglas y los datos, produce las respuestas:

$$\\text{respuestas} = f(\\text{reglas},\\ \\text{datos})$$

Aprender invierte el papel de los datos y de las reglas: se parte de ejemplos con su respuesta y se busca la regla.

$$\\text{reglas} = g(\\text{datos},\\ \\text{respuestas})$$

Aquí «reglas» significa un **modelo** con parámetros $\\theta$, elegidos para que se equivoque lo menos posible con los ejemplos. Una definición clásica, de Tom Mitchell (1997): un programa aprende de la experiencia $E$ respecto de una clase de tareas $T$ y una medida de desempeño $P$ si su desempeño en $T$, medido con $P$, mejora con $E$. En la lección, $T$ es clasificar correos, $E$ son los treinta ejemplos con respuesta y $P$ es la exactitud con correos nuevos.

## El modelo de la lección

Cada correo se resume en dos medidas, $x_1$ (enlaces) y $x_2$ (% de mayúsculas). El modelo calcula un puntaje y decide por su signo:

$$s = w_1 x_1 + w_2 x_2 + b \\qquad \\text{spam si } s > 0$$

Los parámetros son $\\theta = (w_1, w_2, b)$ y la frontera $w_1 x_1 + w_2 x_2 + b = 0$ es una recta. Para entrenar, el puntaje se convierte en probabilidad con $p = \\sigma(s) = 1/(1+e^{-s})$ y el error se mide con la entropía cruzada sobre los $n$ ejemplos, con $y_i = 1$ para spam y $0$ para normal:

$$L(\\theta) = -\\frac{1}{n}\\sum_{i=1}^{n}\\Big[\\,y_i \\ln p_i + (1-y_i)\\ln(1-p_i)\\,\\Big]$$

Cada paso mueve los parámetros en contra del gradiente, $\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta)$ (lección 4). En la escena: $\\eta = 0.5$, 300 pasos y los 30 ejemplos, con las medidas estandarizadas, $(x_1 - 3.5)/2.5$ y $(x_2 - 14)/8$, y un punto de partida arbitrario. El resultado, en las unidades originales, es $w_1 \\approx 0.69$, $w_2 \\approx 0.53$ y $b \\approx -9.63$. La exactitud es aciertos entre total: 27 de 30 con los ejemplos y 52 de 60 con los nuevos. Los datos son sintéticos, inventados para ilustrar; no son correos reales.

La regla a mano de la lección, «spam si $x_1 \\ge a$ o $x_2 \\ge b$», tampoco es gratuita: también tiene parámetros, los dos umbrales. Aprender es dejar que los datos los fijen en lugar de ajustarlos a ojo.

## Por qué la cifra con los ejemplos engaña

La exactitud medida con los mismos ejemplos que sirvieron para ajustar es, en promedio, optimista. En la lección, la mejor de las $10 \\times 36 = 360$ reglas que permiten los deslizadores acierta 28 de los 30 ejemplos ($\\approx 93\\,\\%$); hay seis empatadas y, con los 60 correos nuevos, esas seis aciertan entre 47 y 52 ($\\approx 78\\,\\%$ a $87\\,\\%$). Entre las 84 reglas que aciertan 24 o más de los 30, 58 bajan con los nuevos, 16 suben y 10 quedan igual; el cambio medio es de $-3.2$ puntos porcentuales. Es una tendencia, no una ley: con solo 60 correos nuevos cada cifra es ruidosa, y una regla afinada con cuidado puede aguantar («enlaces $\\ge 5$ o mayúsculas $\\ge 17\\,\\%$» acierta 27 de 30 y 54 de 60). Cuantas más opciones se prueban sobre los mismos datos, más se ajusta uno al azar de esos datos.

Con pocos ejemplos pasa algo parecido. Con 4 ejemplos, el modelo acierta los 4 que vio y 48 de los 60 nuevos ($80\\,\\%$); con los 30, acierta 27 de 30 ($90\\,\\%$) y 52 de 60 ($87\\,\\%$): las dos cifras se acercan. Separar entrenamiento, validación y prueba, y medir bien, es el tema de la lección 10.

## Samuel y las damas (1959)

El nombre *machine learning* se asocia a Arthur L. Samuel, que lo usa en el título de «Some Studies in Machine Learning Using the Game of Checkers» (IBM Journal of Research and Development, vol. 3, n.º 3, julio de 1959). Su programa, en una IBM 704, elegía jugadas mirando varias jugadas por delante y puntuaba cada posición del tablero con un «polinomio lineal», en sus palabras: una suma ponderada de rasgos del tablero. En una de sus dos formas de aprendizaje (la «generalización») el programa determinaba el signo y la magnitud de los coeficientes que multiplican esos rasgos y escogía qué términos usar: la misma forma de modelo que en esta lección, aunque con otro fin (puntuar posiciones, no clasificar). En la versión que describe había 38 términos, además del de ventaja de piezas, de los que 16 estaban activos a la vez. El resumen afirma que una computadora puede programarse para aprender a jugar mejor que la persona que escribió el programa, en 8 o 10 horas de juego de la máquina y dadas solo las reglas del juego, un sentido de dirección y una lista redundante e incompleta de parámetros. Y el propio artículo plantea el objetivo: programar las computadoras para que aprendan de la experiencia «debería eliminar con el tiempo la necesidad de buena parte de este esfuerzo de programación detallada» (traducción nuestra). La frase muy repetida «el campo de estudio que da a las computadoras la capacidad de aprender sin ser programadas explícitamente» se le atribuye con frecuencia, pero no figura en ese artículo.

## Un caso real: filtrar correo basura

En 1998, Sahami, Dumais, Heckerman y Horvitz estudiaron cómo construir filtros de correo basura de forma automática. Señalan que las reglas escritas a mano suponen usuarios capaces de construirlas y deben ajustarse sin cesar a medida que cambia el correo basura, y proponen en cambio aprender de los mensajes del propio usuario. Su clasificador probabilístico (bayesiano ingenuo) combinaba el texto del mensaje con rasgos propios del problema, como el porcentaje de caracteres no alfanuméricos del asunto. Subrayan además que clasificar como basura un correo legítimo suele costar mucho más que dejar pasar uno de basura; por eso solo marcaban un mensaje como basura si su probabilidad superaba el 99.9 %.

## En código

\`\`\`python
import math

# (enlaces, % de mayúsculas, es_spam)
datos = [(0, 5, 0), (1, 8, 0), (2, 10, 0), (3, 7, 0),
         (4, 20, 1), (6, 25, 1), (7, 15, 1), (9, 30, 1)]

def puntaje(w1, w2, b, enlaces, mayus):
    return w1 * enlaces + w2 * mayus + b

w1 = w2 = b = 0.0            # parámetros: se empieza con ceros
eta = 0.1                    # tamaño del paso
for _ in range(2000):        # entrenar: muchas pasadas por los ejemplos
    g1 = g2 = gb = 0.0
    for enlaces, mayus, y in datos:
        z = puntaje(w1, w2, b, enlaces / 10, mayus / 100)  # medidas a escala 0-1
        p = 1 / (1 + math.exp(-z))                         # probabilidad de spam
        e = p - y                                          # cuánto se equivoca
        g1 += e * enlaces / 10
        g2 += e * mayus / 100
        gb += e
    n = len(datos)
    w1 -= eta * g1 / n
    w2 -= eta * g2 / n
    b -= eta * gb / n

print(round(w1, 1), round(w2, 1), round(b, 1))   # pesos en la escala 0-1 de las medidas
# usar: parámetros fijos, solo aritmética
for enlaces, mayus in [(1, 6), (8, 12), (5, 30)]:
    s = puntaje(w1, w2, b, enlaces / 10, mayus / 100)
    print((enlaces, mayus), round(s, 1), 'spam' if s > 0 else 'normal')
# 7.7 2.8 -3.3
# (1, 6) -2.3 normal
# (8, 12) 3.3 spam
# (5, 30) 1.5 spam
# Estos 8 ejemplos se separan del todo: con más pasos los pesos seguirían creciendo;
# 2000 bastan para clasificarlos bien.
\`\`\`

## Lo que viene

En la lección 2 veremos cómo cualquier dato (una imagen, un sonido, un texto) se convierte en números para poder usarse como $x_1, x_2, \\dots$; en la 3, cómo se mide el error de un modelo; y en la 4, cómo se ajustan los parámetros paso a paso (el descenso del gradiente que aquí solo se vio actuar). El modelo de esta lección, una suma ponderada que decide por su signo, es en esencia una neurona artificial (lección 5).`,

    en: `## Two flows of information

Programming means building a function that, given the rules and the data, produces the answers:

$$\\text{answers} = f(\\text{rules},\\ \\text{data})$$

Learning swaps the roles of data and rules: you start from examples with their answers and search for the rule.

$$\\text{rules} = g(\\text{data},\\ \\text{answers})$$

Here “rules” means a **model** with parameters $\\theta$, chosen so that it is wrong as rarely as possible on the examples. A classic definition, by Tom Mitchell (1997): a program learns from experience $E$ with respect to a class of tasks $T$ and a performance measure $P$ if its performance at tasks in $T$, as measured by $P$, improves with experience $E$. In the lesson, $T$ is classifying emails, $E$ is the thirty examples with answers, and $P$ is accuracy on new emails.

## The lesson’s model

Each email is summarized by two measures, $x_1$ (links) and $x_2$ (% capital letters). The model computes a score and decides by its sign:

$$s = w_1 x_1 + w_2 x_2 + b \\qquad \\text{spam if } s > 0$$

The parameters are $\\theta = (w_1, w_2, b)$ and the boundary $w_1 x_1 + w_2 x_2 + b = 0$ is a straight line. To train it, the score is turned into a probability with $p = \\sigma(s) = 1/(1+e^{-s})$ and the error is measured with cross-entropy over the $n$ examples, with $y_i = 1$ for spam and $0$ for legitimate:

$$L(\\theta) = -\\frac{1}{n}\\sum_{i=1}^{n}\\Big[\\,y_i \\ln p_i + (1-y_i)\\ln(1-p_i)\\,\\Big]$$

Each step moves the parameters against the gradient, $\\theta \\leftarrow \\theta - \\eta\\,\\nabla L(\\theta)$ (lesson 4). In the scene: $\\eta = 0.5$, 300 steps, and the 30 examples, with the measures standardized, $(x_1 - 3.5)/2.5$ and $(x_2 - 14)/8$, and an arbitrary starting point. The result, in the original units, is $w_1 \\approx 0.69$, $w_2 \\approx 0.53$ and $b \\approx -9.63$. Accuracy is hits divided by total: 27 of 30 on the examples and 52 of 60 on the new emails. The data is synthetic, made up for illustration; these are not real emails.

The hand-written rule in the lesson, “spam if $x_1 \\ge a$ or $x_2 \\ge b$”, is not free either: it also has parameters, the two thresholds. Learning means letting the data set them instead of tuning them by eye.

## Why the figure on the examples is misleading

Accuracy measured on the very examples used for tuning is, on average, optimistic. In the lesson, the best of the $10 \\times 36 = 360$ rules the sliders allow gets 28 of the 30 examples right ($\\approx 93\\,\\%$); six rules tie, and on the 60 new emails those six get between 47 and 52 right ($\\approx 78\\,\\%$ to $87\\,\\%$). Among the 84 rules that get 24 or more of the 30 right, 58 drop on the new emails, 16 rise, and 10 stay the same; the average change is $-3.2$ percentage points. That is a tendency, not a law: with only 60 new emails each figure is noisy, and a carefully tuned rule can hold up (“links $\\ge 5$ or capitals $\\ge 17\\,\\%$” gets 27 of 30 and 54 of 60). The more options you try on the same data, the more you fit the luck of that data.

Something similar happens with few examples. With 4 examples, the model gets the 4 it saw right and 48 of the 60 new ones ($80\\,\\%$); with all 30, it gets 27 of 30 ($90\\,\\%$) and 52 of 60 ($87\\,\\%$): the two figures move closer. Splitting training, validation, and test data, and measuring well, is the topic of lesson 10.

## Samuel and checkers (1959)

The name *machine learning* is associated with Arthur L. Samuel, who uses it in the title of “Some Studies in Machine Learning Using the Game of Checkers” (IBM Journal of Research and Development, vol. 3, no. 3, July 1959). His program, on an IBM 704, chose moves by looking several moves ahead and scored each board position with a “linear polynomial,” in his words: a weighted sum of board features. In one of his two forms of learning (“generalization”), the program determined the sign and magnitude of the coefficients that multiply those features and chose which terms to use: the same form of model as in this lesson, though with a different purpose (scoring positions, not classifying). In the version he describes there were 38 terms, besides the piece-advantage term, 16 of them active at any one time. The abstract states that a computer can be programmed to learn to play a better game of checkers than the person who wrote the program, in 8 or 10 hours of machine-playing time, given only the rules of the game, a sense of direction, and a redundant and incomplete list of parameters. And the paper itself states the goal: programming computers to learn from experience “should eventually eliminate the need for much of this detailed programming effort.” The oft-repeated phrase “the field of study that gives computers the ability to learn without being explicitly programmed” is frequently attributed to him, but it does not appear in that paper.

## A real case: filtering junk mail

In 1998, Sahami, Dumais, Heckerman, and Horvitz studied how to build junk-mail filters automatically. They point out that hand-written rules assume users who can build them and must be tuned constantly as junk mail changes, and they propose learning from the user’s own messages instead. Their probabilistic classifier (naive Bayes) combined the text of the message with problem-specific features, such as the percentage of non-alphanumeric characters in the subject. They also stress that classifying a legitimate email as junk usually costs far more than letting a junk one through; so they only marked a message as junk if its probability exceeded 99.9%.

## In code

\`\`\`python
import math

# (links, % capital letters, is_spam)
data = [(0, 5, 0), (1, 8, 0), (2, 10, 0), (3, 7, 0),
        (4, 20, 1), (6, 25, 1), (7, 15, 1), (9, 30, 1)]

def score(w1, w2, b, links, caps):
    return w1 * links + w2 * caps + b

w1 = w2 = b = 0.0            # parameters: start from zeros
eta = 0.1                    # step size
for _ in range(2000):        # training: many passes over the examples
    g1 = g2 = gb = 0.0
    for links, caps, y in data:
        z = score(w1, w2, b, links / 10, caps / 100)   # measures on a 0-1 scale
        p = 1 / (1 + math.exp(-z))                     # probability of spam
        e = p - y                                      # how wrong it is
        g1 += e * links / 10
        g2 += e * caps / 100
        gb += e
    n = len(data)
    w1 -= eta * g1 / n
    w2 -= eta * g2 / n
    b -= eta * gb / n

print(round(w1, 1), round(w2, 1), round(b, 1))   # weights on the 0-1 scale of the measures
# using it: frozen parameters, just arithmetic
for links, caps in [(1, 6), (8, 12), (5, 30)]:
    s = score(w1, w2, b, links / 10, caps / 100)
    print((links, caps), round(s, 1), 'spam' if s > 0 else 'legit')
# 7.7 2.8 -3.3
# (1, 6) -2.3 legit
# (8, 12) 3.3 spam
# (5, 30) 1.5 spam
# These 8 examples are perfectly separable: with more steps the weights would keep growing;
# 2000 are enough to classify them correctly.
\`\`\`

## What comes next

In lesson 2 we will see how any data (an image, a sound, a text) is turned into numbers so it can be used as $x_1, x_2, \\dots$; in lesson 3, how a model’s error is measured; and in lesson 4, how the parameters are adjusted step by step (the gradient descent we only saw at work here). This lesson’s model, a weighted sum that decides by its sign, is in essence an artificial neuron (lesson 5).`,
  },

  lens: {
    es: [
      'Aprender de datos conviene cuando la regla es difícil de escribir, hay muchos ejemplos con respuesta y algún error es tolerable. Si la ley o un procedimiento fijan la regla y un error es inaceptable, escribe la regla.',
      'Todo parte de ejemplos con respuesta: pregunta quién los anotó, cuántos son y si se parecen a los casos reales. Si están mal anotados o sesgados, el modelo aprende ese error, como vimos con cuatro etiquetas torcidas.',
      'Exige la cifra de acierto medida con casos que el modelo nunca vio, no con los datos de entrenamiento. Una demostración con los mismos datos del ajuste no dice cómo funcionará en la operación real.',
      'Separa costos y errores: entrenar es un gasto grande y poco frecuente; usar el modelo es un gasto pequeño que se repite en cada consulta. Y no todos los errores cuestan igual: marcar como spam un correo legítimo suele costar más que dejar pasar uno de spam, y así lo planteaban ya Sahami y colaboradores en 1998.',
    ],
    en: [
      'Learning from data makes sense when the rule is hard to write, there are many examples with answers, and some errors are tolerable. If a law or a procedure fixes the rule and an error is unacceptable, write the rule.',
      'It all starts with examples that have answers: ask who labeled them, how many there are, and whether they resemble real cases. If they are mislabeled or biased, the model learns that error, as we saw with four bent labels.',
      'Demand the accuracy figure measured on cases the model never saw, not on the training data. A demo on the same data used for tuning does not tell you how it will work in real operation.',
      'Separate costs and errors: training is a large, infrequent expense; using the model is a small expense repeated on every query. And not all errors cost the same: flagging a legitimate email as spam usually costs more than letting a spam email through, as Sahami and colleagues already argued in 1998.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: '¿Qué cambia cuando una máquina aprende en lugar de seguir reglas?', en: 'What changes when a machine learns instead of following rules?' },
      options: [
        { es: 'Recibe reglas y datos, y produce respuestas.', en: 'It receives rules and data, and produces answers.' },
        { es: 'Recibe datos con sus respuestas, y produce las reglas.', en: 'It receives data with their answers, and produces the rules.' },
        { es: 'Recibe respuestas y reglas, y produce datos.', en: 'It receives answers and rules, and produces data.' },
        { es: 'Ya no necesita ni datos ni reglas.', en: 'It no longer needs data or rules.' },
      ],
      answer: 1,
      why: {
        es: 'Programar es reglas + datos → respuestas. Aprender invierte el flujo: datos + respuestas → reglas, que quedan guardadas en los parámetros del modelo.',
        en: 'Programming is rules + data → answers. Learning flips the flow: data + answers → rules, which end up stored in the model’s parameters.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Un filtro de spam ya entrenado clasifica un correo nuevo. ¿Qué pasa con sus parámetros?', en: 'An already trained spam filter classifies a new email. What happens to its parameters?' },
      options: [
        { es: 'Se reajustan con ese correo antes de responder.', en: 'They are readjusted with that email before answering.' },
        { es: 'Se borran y se vuelve a entrenar desde cero.', en: 'They are erased and training starts over from scratch.' },
        { es: 'Cambian solo si el correo resulta ser spam.', en: 'They change only if the email turns out to be spam.' },
        { es: 'Quedan fijos: solo se usan para calcular el puntaje.', en: 'They stay frozen: they are only used to compute the score.' },
      ],
      answer: 3,
      why: {
        es: 'Usar el modelo (inferencia) es aritmética con parámetros fijos. Los parámetros solo cambian al entrenar, con ejemplos que traen su respuesta.',
        en: 'Using the model (inference) is arithmetic with frozen parameters. Parameters only change during training, with examples that come with their answer.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un modelo tiene w₁ = 0.5, w₂ = 0.1 y b = −4. Un correo trae 6 enlaces y 20 % de mayúsculas. ¿Qué puntaje obtiene y qué responde?',
        en: 'A model has w₁ = 0.5, w₂ = 0.1 and b = −4. An email has 6 links and 20% capital letters. What score does it get and what does the model answer?',
      },
      options: [
        { es: '+9: spam', en: '+9: spam' },
        { es: '−1: normal', en: '−1: legit' },
        { es: '+1: spam', en: '+1: spam' },
        { es: '+5: spam', en: '+5: spam' },
      ],
      answer: 2,
      why: {
        es: 'Puntaje = 0.5·6 + 0.1·20 − 4 = 3 + 2 − 4 = 1. Es positivo, así que dice spam. Olvidar el número fijo daría 5; sumarlo en vez de restarlo, 9.',
        en: 'Score = 0.5·6 + 0.1·20 − 4 = 3 + 2 − 4 = 1. It is positive, so the model says spam. Forgetting the fixed number would give 5; adding it instead of subtracting it, 9.',
      },
    },
    {
      kind: 'apply',
      q: {
        es: 'Un proveedor presume que su detector de fraude acierta 99 % en su demostración. ¿Cuál es la pregunta más importante?',
        en: 'A vendor boasts that its fraud detector is 99% accurate in its demo. What is the most important question?',
      },
      options: [
        { es: '¿Esa cifra se midió con casos que el modelo nunca vio durante el entrenamiento?', en: 'Was that figure measured on cases the model never saw during training?' },
        { es: '¿Cuántos parámetros tiene el modelo?', en: 'How many parameters does the model have?' },
        { es: '¿En qué lenguaje de programación está escrito?', en: 'What programming language is it written in?' },
        { es: '¿Cuánto tardó en entrenarse?', en: 'How long did it take to train?' },
      ],
      answer: 0,
      why: {
        es: 'Lo que importa es generalizar. Una cifra obtenida con los mismos ejemplos del entrenamiento puede ser muy optimista; hay que pedirla con casos no vistos (lección 10).',
        en: 'What matters is generalizing. A figure obtained on the very examples used for training can be very optimistic; ask for it on unseen cases (lesson 10).',
      },
    },
  ],

  glossary: ['machine-learning', 'training-data', 'model', 'generalization', 'parameter', 'inference'],

  terms: [
    { id: 'machine-learning', term: { es: 'Aprendizaje automático', en: 'Machine learning' }, def: { es: 'Enfoque en que una computadora obtiene las reglas a partir de ejemplos en lugar de que alguien las escriba. El término se asocia a Arthur Samuel (1959).', en: 'An approach in which a computer obtains the rules from examples instead of someone writing them. The term is associated with Arthur Samuel (1959).' } },
    { id: 'training-data', term: { es: 'Datos de entrenamiento', en: 'Training data' }, def: { es: 'Ejemplos, cada uno con su respuesta correcta, con los que un modelo ajusta sus parámetros.', en: 'Examples, each with its correct answer, from which a model adjusts its parameters.' } },
    { id: 'model', term: { es: 'Modelo', en: 'Model' }, def: { es: 'Una forma de regla con números ajustables. Una vez entrenado, es la regla aprendida.', en: 'A form of rule with adjustable numbers. Once trained, it is the learned rule.' } },
    { id: 'generalization', term: { es: 'Generalización', en: 'Generalization' }, def: { es: 'Acertar con casos nuevos, que no se usaron para entrenar. Es lo que de verdad se quiere de un modelo.', en: 'Getting new cases right, ones not used for training. It is what you really want from a model.' } },
    { id: 'parameter', term: { es: 'Parámetro', en: 'Parameter' }, def: { es: 'Cada uno de los números que un modelo ajusta al entrenarse y en los que guarda lo aprendido.', en: 'Each of the numbers a model adjusts while training and in which it stores what it learned.' } },
    { id: 'inference', term: { es: 'Inferencia', en: 'Inference' }, def: { es: 'Usar un modelo ya entrenado para responder ante un caso nuevo, con los parámetros fijos.', en: 'Using an already trained model to answer a new case, with frozen parameters.' } },
  ],

  sources: [
    { title: 'Some Studies in Machine Learning Using the Game of Checkers', authors: 'Samuel, A. L.', year: 1959, url: 'https://doi.org/10.1147/rd.33.0210' },
    { title: 'Machine Learning (McGraw-Hill)', authors: 'Mitchell, T. M.', year: 1997, url: 'https://www.cs.cmu.edu/~tom/mlbook.html' },
    { title: 'A Bayesian Approach to Filtering Junk E-Mail (AAAI-98 Workshop on Learning for Text Categorization, WS-98-05)', authors: 'Sahami, M., Dumais, S., Heckerman, D., Horvitz, E.', year: 1998, url: 'https://cdn.aaai.org/Workshops/1998/WS-98-05/WS98-05-009.pdf' },
    { title: 'Deep Learning, capítulo 5: Machine Learning Basics', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/ml.html' },
  ],
});
