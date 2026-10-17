import { defineLesson } from '../../../../../core/define';

// Lección 3 · Un modelo y su error.
// Datos de la escena: diez estudiantes ficticios (horas de estudio → calificación), ilustrativos; ver helpers.ts.
// Cada cifra que dicen la voz, la escena, «por dentro», la lente y el quiz la comprueba build-data.ts.
export default defineLesson({
  id: 'modelo-y-error',

  objectives: {
    es: [
      'Leer una recta por sus dos parámetros, el peso (cuánto sube por cada unidad de la entrada) y el sesgo (su altura cuando la entrada vale cero), y calcular con ellos una predicción.',
      'Calcular el error de un punto y explicar por qué se eleva al cuadrado antes de promediar: los signos dejan de cancelarse y los errores grandes pesan más.',
      'Calcular la pérdida (MSE) de unos pocos puntos y reconocer que aprender es elegir los parámetros que la dejan lo más baja posible.',
    ],
    en: [
      'Read a straight line through its two parameters, the weight (how much it rises per unit of input) and the bias (its height when the input is zero), and use them to compute a prediction.',
      'Calculate the error of a point and explain why it is squared before averaging: signs stop canceling and big errors weigh more.',
      'Calculate the loss (MSE) of a few points and recognize that learning means choosing the parameters that make it as low as possible.',
    ],
  },

  segments: [
    // ── los datos y el plano ──
    {
      id: 'hook',
      es: 'Ya sabes que un modelo es una regla con números ajustables. Construyamos el más sencillo con un caso inventado: diez estudiantes, las horas que estudió cada uno y la calificación que sacó.',
      en: 'You already know a model is a rule with adjustable numbers. Let’s build the simplest one with a made-up case: ten students, the hours each one studied, and the grade each one got.',
    },
    {
      id: 'axis-x',
      es: 'Para verlos todos a la vez dibujamos un plano, como en la primera lección. La línea horizontal mide las horas de estudio: cero a la izquierda, diez a la derecha.',
      en: 'To see them all at once we draw a plane, as in the first lesson. The horizontal line measures hours of study: zero on the left, ten on the right.',
    },
    {
      id: 'axis-y',
      es: 'La línea vertical mide la calificación: cero abajo y cien arriba. Cuanto más alto queda un punto, mejor fue la nota.',
      en: 'The vertical line measures the grade: zero at the bottom and a hundred at the top. The higher a point sits, the better the grade.',
    },
    {
      id: 'place',
      es: 'Ubiquemos a quien estudió cinco horas y sacó setenta y dos: avanzamos hasta el cinco y, desde ahí, subimos hasta el setenta y dos. Ahí queda su punto.',
      en: 'Let’s place the student who studied five hours and scored seventy-two: we move right to five and, from there, go up to seventy-two. That is where their point goes.',
      pad: 0.3,
    },
    {
      id: 'all-points',
      es: 'Hacemos lo mismo con los diez: cada estudiante es un punto. Y se ve un patrón: quien estudia más suele sacar más.',
      en: 'We do the same with all ten: each student is a point. And a pattern shows up: those who study more tend to score higher.',
    },
    {
      id: 'regression',
      es: 'Queremos una regla que, dadas unas horas, prediga la nota; por ejemplo, con siete horas, que nadie estudió. Predecir un número, y no una categoría como «spam», se llama regresión.',
      en: 'We want a rule that, given some hours, predicts the grade; for example, for seven hours, which nobody studied. Predicting a number, rather than a category like “spam,” is called regression.',
      note: { es: 'Regresión: predecir un número a partir de datos.', en: 'Regression: predicting a number from data.' },
    },
    // ── la recta, pieza por pieza ──
    {
      id: 'line-idea',
      es: 'El modelo más sencillo es una recta: una línea derecha que sube, o baja, siempre al mismo ritmo. Aquí hay una y, junto a ella, la nota que predice para cada hora.',
      en: 'The simplest model is a straight line: a line that rises, or falls, always at the same pace. Here is one and, next to it, the grade it predicts for each hour.',
    },
    {
      id: 'steps',
      es: 'Mira sus escalones: cada vez que avanzas una hora a la derecha, la recta sube lo mismo, cinco puntos. Eso es subir a ritmo constante.',
      en: 'Look at its steps: each time you move one hour to the right, the line rises by the same amount, five points. That is rising at a constant pace.',
      pad: 0.3,
    },
    {
      id: 'weight',
      es: 'Ese ritmo, cuántos puntos sube la predicción por cada hora, se llama peso, o pendiente. En esta recta, el peso vale cinco. Es la misma idea que un taxímetro: cuánto sube la cuenta por cada kilómetro.',
      en: 'That pace, how many points the prediction rises for each hour, is called the weight, or slope. On this line, the weight is five. It is the same idea as a taxi meter: how much the fare rises for each kilometer.',
      note: { es: 'Peso (pendiente): cuánto sube la predicción por cada hora.', en: 'Weight (slope): how much the prediction rises per hour.' },
    },
    {
      id: 'weight-demo',
      es: 'Si el peso crece, la recta se empina: con diez, sube diez puntos por hora. Con cero queda plana, y con un peso negativo bajaría.',
      en: 'If the weight grows, the line gets steeper: with ten, it rises ten points per hour. With zero it goes flat, and with a negative weight it would go down.',
      pad: 0.3,
    },
    {
      id: 'bias',
      es: 'La otra pieza es la altura de la recta cuando las horas valen cero, justo sobre el eje vertical. Se llama sesgo: aquí vale cuarenta, la nota que predice para quien no estudió nada.',
      en: 'The other piece is the line’s height when hours are zero, right on the vertical axis. It is called the bias: here it is forty, the grade it predicts for someone who did not study.',
      note: { es: 'Sesgo: la altura de la recta cuando la entrada vale cero.', en: 'Bias: the height of the line when the input is zero.' },
    },
    {
      id: 'bias-demo',
      es: 'Si cambiamos el sesgo, la recta entera sube o baja sin inclinarse: los escalones siguen siendo de cinco. El sesgo decide la altura.',
      en: 'If we change the bias, the whole line moves up or down without tilting: the steps are still five points. The bias sets the height.',
      pad: 0.3,
    },
    {
      id: 'two-numbers',
      es: 'Así, cada recta queda descrita por dos números: el peso, que la inclina, y el sesgo, que la sube o la baja. Son sus parámetros, los números que se ajustan.',
      en: 'So every line is described by two numbers: the weight, which tilts it, and the bias, which moves it up or down. They are its parameters, the numbers that get adjusted.',
    },
    // ── la predicción y la fórmula ──
    {
      id: 'predict-read',
      es: 'Ahora usémosla. ¿Qué nota predice para siete horas? Subimos desde el siete hasta tocar la recta y leemos su altura: setenta y cinco.',
      en: 'Now let’s use it. What grade does it predict for seven hours? We go up from seven until we touch the line and read its height: seventy-five.',
      pad: 0.3,
    },
    {
      id: 'predict-calc',
      es: 'La misma respuesta sale con una cuenta: el peso por las horas, cinco por siete, treinta y cinco; más el sesgo, cuarenta. Total: setenta y cinco. Eso es la predicción.',
      en: 'The same answer comes from arithmetic: the weight times the hours, five times seven, thirty-five; plus the bias, forty. Total: seventy-five. That is the prediction.',
      note: { es: 'Predicción: lo que el modelo responde para una entrada.', en: 'Prediction: what the model answers for an input.' },
      pad: 0.3,
    },
    {
      id: 'formula',
      es: 'Con letras, esa cuenta es la fórmula de la recta: la predicción es w por x, más b. Es la suma ponderada de la primera lección, con una sola entrada.',
      en: 'In letters, that arithmetic is the formula of the line: the prediction is w times x, plus b. It is the weighted sum from the first lesson, with a single input.',
      tts: { es: 'Con letras, esa cuenta es la fórmula de la recta: la predicción es doble ve por equis, más be. Es la suma ponderada de la primera lección, con una sola entrada.' },
    },
    {
      id: 'formula-letters',
      es: 'Cada letra está en la gráfica: x son las horas, sobre el eje horizontal; w es el peso, la subida de cada escalón; y b es el sesgo, donde la recta corta el eje vertical.',
      en: 'Each letter is on the graph: x is the hours, along the horizontal axis; w is the weight, the rise of each step; and b is the bias, where the line crosses the vertical axis.',
      tts: { es: 'Cada letra está en la gráfica: equis son las horas, sobre el eje horizontal; doble ve es el peso, la subida de cada escalón; y be es el sesgo, donde la recta corta el eje vertical.' },
      pad: 0.3,
    },
    // ── el error de un punto ──
    {
      id: 'reality',
      es: 'Ahora comparemos con la realidad. Quien estudió cinco horas sacó setenta y dos, pero la recta le predice sesenta y cinco.',
      en: 'Now let’s compare with reality. The student who studied five hours scored seventy-two, but the line predicts sixty-five.',
    },
    {
      id: 'error-one',
      es: 'La distancia vertical entre su punto y la recta es el error de ese punto: lo real menos lo predicho, setenta y dos menos sesenta y cinco. Siete puntos.',
      en: 'The vertical distance between the point and the line is that point’s error: the real value minus the prediction, seventy-two minus sixty-five. Seven points.',
      note: { es: 'Error de un punto: lo real menos la predicción.', en: 'Error of a point: the real value minus the prediction.' },
    },
    {
      id: 'error-sign',
      es: 'Si el punto queda arriba de la recta, el error es positivo. Si queda abajo, es negativo: este estudiante, de seis horas y media, tiene menos dieciséis punto cinco.',
      en: 'If the point sits above the line, the error is positive. If it sits below, it is negative: this student, at six and a half hours, has minus sixteen point five.',
    },
    {
      id: 'all-errors',
      es: 'Cada estudiante tiene su propio error, unos positivos y otros negativos. ¿Cómo los resumimos en un solo número que diga qué tan mala es la recta?',
      en: 'Every student has an error of their own, some positive and some negative. How do we sum them up in a single number that says how bad the line is?',
    },
    // ── de muchos errores a un número: el cuadrado y la pérdida ──
    {
      id: 'sum-flat',
      es: 'Sumarlos no sirve: los positivos cancelan a los negativos. Esta recta plana siempre predice el promedio; es mala, y aun así sus errores suman cero.',
      en: 'Adding them up does not work: the positives cancel the negatives. This flat line always predicts the average; it is a bad line, and yet its errors add up to zero.',
      pad: 0.3,
    },
    {
      id: 'square-idea',
      es: 'La salida es elevar cada error al cuadrado, es decir, multiplicarlo por sí mismo. Un error de dos cuenta cuatro; uno de cuatro cuenta dieciséis.',
      en: 'The way out is to square each error, that is, multiply it by itself. An error of two counts as four; an error of four counts as sixteen.',
    },
    {
      id: 'square-neg',
      es: 'Así, el doble de error cuenta cuatro veces más. Y un error de menos tres cuenta nueve, igual que uno de tres: menos por menos da más, y nada se cancela.',
      en: 'So twice the error counts four times as much. And an error of minus three counts nine, just like three: minus times minus is plus, and nothing cancels.',
    },
    {
      id: 'square-draw',
      es: 'Por eso se dibuja así: sobre cada error, un cuadrado cuyo lado es el error. Su área es el error al cuadrado, y los errores grandes dan cuadrados enormes.',
      en: 'That is why we draw it like this: on each error, a square whose side is the error. Its area is the squared error, and big errors make huge squares.',
      pad: 0.4,
    },
    {
      id: 'loss',
      es: 'Ahora sí, un solo número: sumamos las diez áreas y dividimos entre diez. Para la recta plana, ese promedio da doscientos cuarenta y cuatro.',
      en: 'Now we have a single number: add up the ten areas and divide by ten. For the flat line, that average comes to two hundred forty-four.',
      pad: 0.3,
    },
    {
      id: 'loss-name',
      es: 'Ese promedio se llama error cuadrático medio, o MSE por sus siglas en inglés. Es la pérdida del modelo: cuanto más baja, mejor se ajusta la recta a los datos.',
      en: 'That average is called the mean squared error, or MSE. It is the model’s loss: the lower it is, the better the line fits the data.',
      tts: {
        es: 'Ese promedio se llama error cuadrático medio, o eme ese e por sus siglas en inglés. Es la pérdida del modelo: cuanto más baja, mejor se ajusta la recta a los datos.',
        en: 'That average is called the mean squared error, or M S E. It is the model’s loss: the lower it is, the better the line fits the data.',
      },
      note: { es: 'Pérdida (MSE): el promedio de los errores al cuadrado.', en: 'Loss (MSE): the average of the squared errors.' },
    },
    // ── buscar la mejor recta ──
    {
      id: 'back-line',
      es: 'Volvamos a la recta de peso cinco y sesgo cuarenta. Sus cuadrados son mucho más chicos, y su pérdida baja a cuarenta y cinco punto ocho.',
      en: 'Back to the line with weight five and bias forty. Its squares are much smaller, and its loss drops to forty-five point eight.',
      pad: 0.3,
    },
    {
      id: 'demo-w',
      es: 'Si la empinamos de más, los cuadrados crecen y la pérdida sube. Si la aplanamos, también sube. El mejor peso está en algún punto intermedio.',
      en: 'If we make it too steep, the squares grow and the loss goes up. If we flatten it, it goes up too. The best weight is somewhere in between.',
      pad: 0.4,
    },
    {
      id: 'demo-b',
      es: 'Con el sesgo pasa lo mismo: si subimos la recta de más, o la bajamos de más, la pérdida crece. Hay que dar con la combinación justa de los dos.',
      en: 'The same goes for the bias: raise the line too much, or lower it too much, and the loss grows. We have to find the right combination of the two.',
      pad: 0.4,
    },
    {
      id: 'goal',
      es: 'Ahora aprender tiene un sentido preciso: encontrar el peso y el sesgo que dejan la pérdida lo más baja posible.',
      en: 'Now learning has a precise meaning: finding the weight and the bias that make the loss as low as possible.',
      note: { es: 'Aprender: elegir el peso y el sesgo que minimizan la pérdida.', en: 'Learning: choosing the weight and bias that minimize the loss.' },
    },
    {
      id: 'try1',
      es: 'Si quieres, mueve tú el peso y el sesgo con los deslizadores, y busca la pérdida más baja. Los cuadrados te muestran qué puntos fallan más.',
      en: 'If you like, move the weight and the bias yourself with the sliders, and look for the lowest loss. The squares show which points miss the most.',
      gate: {
        id: 'fit',
        prompt: { es: 'mueve el peso y el sesgo hasta que la pérdida baje de 43.5.', en: 'move the weight and the bias until the loss drops below 43.5.' },
      },
      pad: 0.4,
    },
    {
      id: 'floor',
      es: 'Cerca del mejor valor, la pérdida deja de bajar: cualquier movimiento la hace subir. Ese fondo marca la mejor recta, con una pérdida de cuarenta y dos punto cinco.',
      en: 'Near the best value, the loss stops going down: any move pushes it up. That floor marks the best line, with a loss of forty-two point five.',
    },
    {
      id: 'not-zero',
      es: 'Ni la mejor recta acierta todo: su pérdida no es cero, que sería acertarle a cada punto. Diez puntos así no caben sobre una misma línea.',
      en: 'Not even the best line gets everything right: its loss is not zero, which would mean hitting every point. Ten points like these do not fit on a single line.',
    },
    {
      id: 'best-line',
      es: 'Para una recta, la mejor tiene fórmula: el método de mínimos cuadrados. Legendre lo publicó en mil ochocientos cinco, y Gauss dijo que lo usaba desde mil setecientos noventa y cinco.',
      en: 'For a straight line, the best one has a formula: the method of least squares. Legendre published it in eighteen oh-five, and Gauss said he had used it since seventeen ninety-five.',
    },
    // ── el estudiante atípico: el cuadrado es una decisión ──
    {
      id: 'outlier',
      es: 'Mira el cuadrado más grande: es de un solo estudiante, el de seis horas y media que sacó cincuenta y seis. Él solo aporta más de tres cuartas partes de la pérdida.',
      en: 'Look at the biggest square: it belongs to one student, the one who studied six and a half hours and scored fifty-six. That student alone adds over three quarters of the loss.',
    },
    {
      id: 'absolute',
      es: 'Hay otra forma de quitar el signo: usar solo la distancia, sin elevarla al cuadrado. Se llama error absoluto, y con él ese estudiante aportaría casi la mitad.',
      en: 'There is another way to drop the sign: use just the distance, without squaring it. It is called the absolute error, and with it that student would add almost half.',
    },
    {
      id: 'compare',
      es: 'Cada forma de medir tiene su propia mejor recta. La continua minimiza los cuadrados; la punteada, los errores absolutos. Por ahora se parecen.',
      en: 'Each way of measuring has its own best line. The solid one minimizes the squares; the dashed one, the absolute errors. For now they look alike.',
    },
    {
      id: 'outlier-demo',
      es: 'Bajemos la nota del estudiante atípico. La recta de los cuadrados lo persigue y se tuerce; la de errores absolutos casi no se mueve.',
      en: 'Let’s lower the outlier’s grade. The squares line chases it and bends; the absolute-error line barely moves.',
      pad: 0.4,
    },
    {
      id: 'try2',
      es: 'Si quieres, mueve tú la nota de ese estudiante, hacia arriba o hacia abajo, y mira cuál de las dos rectas lo sigue.',
      en: 'If you like, move that student’s grade yourself, up or down, and watch which of the two lines follows it.',
      gate: {
        id: 'outlier',
        prompt: { es: 'mueve la nota del estudiante atípico al menos 30 puntos.', en: 'move the outlier’s grade at least 30 points.' },
      },
      pad: 0.4,
    },
    {
      id: 'after-try2',
      es: 'Elevar al cuadrado es una decisión, no una ley: castiga mucho los errores grandes. Conviene si un error grande cuesta caro, pero un solo dato raro puede torcer la recta.',
      en: 'Squaring is a choice, not a law: it punishes big errors heavily. That helps when a big error is costly, but a single odd point can bend the line.',
      note: { es: 'Elevar al cuadrado castiga los errores grandes y es sensible a los atípicos.', en: 'Squaring punishes big errors and is sensitive to outliers.' },
    },
    // ── límites y puente ──
    {
      id: 'limits',
      es: 'Una advertencia: una pérdida baja no garantiza un buen modelo. Los datos llegan a nueve horas; con doce, la recta predeciría más de cien, más que la nota máxima.',
      en: 'One warning: a low loss does not guarantee a good model. The data stop at nine hours; at twelve, the line would predict more than a hundred, above the top grade.',
    },
    {
      id: 'curve',
      es: 'Un último experimento: dejamos el sesgo fijo y movemos solo el peso. Cada peso da una recta distinta, y cada recta, su propia pérdida.',
      en: 'One last experiment: we keep the bias fixed and move only the weight. Each weight gives a different line, and each line its own loss.',
      pad: 0.4,
    },
    {
      id: 'valley',
      es: 'Juntas, esas pérdidas dibujan un valle. En el fondo está el mejor peso: si te mueves a la izquierda o a la derecha, la pérdida sube.',
      en: 'Together, those losses trace a valley. At the bottom sits the best weight: move left or right, and the loss goes up.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Con una recta basta una fórmula. Con miles de millones de pesos no existe ninguna. ¿Cómo bajar al fondo del valle sin probarlos todos? Es la siguiente lección.',
      en: 'For one line, a formula is enough. With billions of weights, there is none. How do we reach the bottom of the valley without trying them all? That is the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'Una recta sube (o baja) a ritmo constante. Su peso w, la pendiente, es cuánto sube la predicción por cada unidad de la entrada; su sesgo b es la altura cuando la entrada vale cero. La predicción es w·x + b.',
      'El error de un punto es lo real menos lo predicho: la distancia vertical entre el punto y la recta. Sumar los errores con su signo falla, porque los positivos y los negativos se cancelan.',
      'Elevar cada error al cuadrado quita el signo y hace pesar más los errores grandes: un error de 2 cuenta 4; uno de 4, 16. La pérdida MSE es el promedio de esos cuadrados.',
      'Aprender es elegir el peso y el sesgo que dejan la pérdida lo más baja posible. Para una recta hay fórmula (mínimos cuadrados, Legendre y Gauss), pero ni así la pérdida llega a cero.',
      'Elevar al cuadrado es una decisión: un punto atípico puede torcer la recta, mientras que el error absoluto casi no lo escucha.',
    ],
    en: [
      'A straight line rises (or falls) at a constant pace. Its weight w, the slope, is how much the prediction rises per unit of input; its bias b is the height when the input is zero. The prediction is w·x + b.',
      'The error of a point is the real value minus the prediction: the vertical distance between the point and the line. Adding errors with their signs fails, because positives and negatives cancel.',
      'Squaring each error removes the sign and makes big errors weigh more: an error of 2 counts 4; one of 4, 16. The MSE loss is the average of those squares.',
      'Learning means choosing the weight and bias that make the loss as low as possible. A straight line has a formula (least squares, Legendre and Gauss), but even then the loss does not reach zero.',
      'Squaring is a decision: an unusual point can bend the line, whereas the absolute error barely listens to it.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un buen modelo es el que pasa por todos los puntos: su pérdida debería ser cero.',
      en: 'A good model is one that passes through every point: its loss should be zero.',
    },
    right: {
      es: 'Con datos reales siempre hay ruido, y una recta no puede pasar por todos los puntos: incluso la mejor tiene pérdida mayor que cero. Un modelo con pérdida cero en los datos de entrenamiento suele haber memorizado el ruido, y falla con casos nuevos (lección 10).',
      en: 'Real data always carry noise, and a straight line cannot pass through every point: even the best one has a loss above zero. A model with zero loss on its training data has usually memorized the noise, and fails on new cases (lesson 10).',
    },
  },

  deeper: {
    es: `## La recta, pieza por pieza

Una recta es la gráfica de $\\hat y = wx + b$ (se lee «y gorro»: la predicción). El peso $w$ es la **pendiente**: si la entrada aumenta en $\\Delta x$, la predicción aumenta en $w\\,\\Delta x$, así que $w = \\Delta \\hat y / \\Delta x$, lo que sube entre lo que avanza. El sesgo $b$ es la **ordenada al origen**: $\\hat y(0) = b$. En la lección, $w = 5$ y $b = 40$: con 7 horas, $\\hat y = 5\\cdot 7 + 40 = 75$.

## El modelo y la pérdida

Con varias características (lección 2) la entrada es un vector $\\mathbf{x}$ y la predicción es $\\hat y = \\mathbf{w}\\cdot\\mathbf{x} + b$: un peso por característica y un solo sesgo. Los diez estudiantes de la lección son inventados.

El error de un punto es $e_i = y_i - \\hat y_i$. Con $n$ puntos, las dos pérdidas de la lección son

$$\\mathrm{MAE}=\\frac1n\\sum_{i=1}^{n}|e_i| \\qquad\\qquad L(w,b)=\\mathrm{MSE}=\\frac1n\\sum_{i=1}^{n}\\bigl(y_i-wx_i-b\\bigr)^2$$

El MSE se mide en puntos al cuadrado. Su raíz, $\\sqrt{L}$, vuelve a puntos: con la mejor recta de la lección, $\\sqrt{42.5}\\approx 6.5$ puntos de error típico. La recta de ejemplo ($w = 5$, $b = 40$) tiene $L = 45.775$; la recta plana del promedio, $L = 244.04$.

## Por qué el cuadrado

- **Es suave.** $L(w,b)$ es un paraboloide: tiene un único fondo y una pendiente definida en todas partes, lo que permitirá bajar por ella (lección 4). El valor absoluto tiene un pico en cero.
- **Tiene fórmula.** Al igualar a cero las derivadas parciales de $L$ se obtiene un sistema lineal, las *ecuaciones normales*.
- **Tiene una justificación probabilística.** Si $y_i = wx_i+b+\\varepsilon_i$ con ruido normal $\\varepsilon_i\\sim\\mathcal N(0,\\sigma^2)$, la verosimilitud es máxima justo donde el MSE es mínimo (Goodfellow et al., 2016, sec. 5.5.1, que lo llama un criterio introducido «más o menos arbitrariamente» antes de justificarlo así). Gauss lo planteó en 1809 (*Theoria motus*, arts. 175–179): si los errores siguen la curva normal, el sistema de valores más probable es el de menor suma de cuadrados. Con ruido de Laplace, de colas más pesadas, el criterio equivalente es el error absoluto.
- **Es sensible a los atípicos.** Con un solo parámetro (predecir una constante), el MSE se minimiza con la **media** y el error absoluto con la **mediana**. En los datos de la lección, la media es 64.4 y la mediana 59.5 (con diez datos, cualquier valor entre 57 y 62 minimiza el error absoluto; se toma el punto medio).

## Un poco de historia

Legendre presentó los mínimos cuadrados en 1805, en un apéndice, como el principio que, a su juicio, es el «más general, más exacto y de aplicación más fácil», y que establece entre los errores «una especie de equilibrio» que impide a los extremos prevalecer. Gauss escribió en 1809 que lo usaba desde 1795 (*Theoria motus*, art. 186) y que, de todas las potencias pares del error, el cuadrado era «el más simple»; la prioridad se discutió (Plackett, 1972; Stigler, 1981).

En ese mismo artículo Gauss cuenta que Laplace usaba el error absoluto, propuesto antes por Boscovich. Observa que con él la recta pasa, en general, por dos de los puntos y que otro dato cualquiera podría haberse observado sin cambiar la solución, con tal de quedar del mismo lado: es lo que viste con el atípico, cuya recta absoluta no se movió al bajarle la nota. Entre los dos extremos existen pérdidas híbridas, como la de Huber (1964): cuadrática para errores pequeños y lineal para los grandes.

## La mejor recta

$$w^*=\\frac{\\sum_i (x_i-\\bar x)(y_i-\\bar y)}{\\sum_i (x_i-\\bar x)^2}=\\frac{\\operatorname{cov}(x,y)}{\\operatorname{var}(x)}\\qquad\\qquad b^*=\\bar y-w^*\\bar x$$

Con $\\bar x = 4.55$ y $\\bar y = 64.4$ resultan $w^*\\approx 5.26$ y $b^*\\approx 40.45$, con pérdida mínima $L_{\\min}\\approx 42.5$. La mejor recta siempre pasa por el punto promedio $(\\bar x,\\bar y)$. En forma matricial son las ecuaciones normales, $\\mathbf{w}^*=(X^\\top X)^{-1}X^\\top\\mathbf{y}$ (en $X$, una columna de unos se encarga del sesgo).

Si dejamos $b=b^*$ y movemos solo $w$, la pérdida es exactamente una parábola:

$$L(w)=L_{\\min}+\\overline{x^2}\\,(w-w^*)^2,\\qquad \\overline{x^2}\\approx 28.0$$

Es el valle de la última escena. El nombre «regresión» viene de Galton. En su estudio de 1886 sobre la estatura (930 hijos adultos de 205 familias) halló que la desviación de estatura de los hijos es, en promedio, dos tercios de la de sus padres: los hijos de padres muy altos tienden a ser menos altos, y los de padres muy bajos, más altos. Lo llamó «regresión hacia la mediocridad», es decir, hacia el promedio.

## En código

\`\`\`python
# diez estudiantes inventados para la lección
horas = [0.5, 1.5, 2, 3, 4, 5, 6, 6.5, 8, 9]
nota = [43, 49, 52, 57, 62, 72, 73, 56, 87, 93]
n = len(horas)
mx, my = sum(horas) / n, sum(nota) / n

# mínimos cuadrados: w = cov(x, y) / var(x),  b = media(y) - w * media(x)
w = sum((x - mx) * (y - my) for x, y in zip(horas, nota)) / sum((x - mx) ** 2 for x in horas)
b = my - w * mx

def perdida(w, b):  # error cuadrático medio (MSE)
    return sum((y - (w * x + b)) ** 2 for x, y in zip(horas, nota)) / n

print(round(w, 2), round(b, 2))   # 5.26 40.45   (mejor peso y sesgo)
print(round(perdida(w, b), 1))    # 42.5         (pérdida mínima)
print(round(perdida(0, my), 1))   # 244.0        (recta plana: predecir el promedio)
print(round(perdida(5, 40), 1))   # 45.8         (la recta de ejemplo: peso 5, sesgo 40)
\`\`\`

## Lo que viene

La fórmula cerrada sirve para una recta. En una red con miles de millones de pesos no existe, y el fondo se busca paso a paso: es el descenso del gradiente (lección 4). Y bajar la pérdida en los datos de entrenamiento no basta: hay que medirla con datos que el modelo no vio (lección 10).`,
    en: `## The line, piece by piece

A straight line is the graph of $\\hat y = wx + b$ (read “y-hat”: the prediction). The weight $w$ is the **slope**: if the input grows by $\\Delta x$, the prediction grows by $w\\,\\Delta x$, so $w = \\Delta \\hat y / \\Delta x$, rise over run. The bias $b$ is the **intercept**: $\\hat y(0) = b$. In the lesson, $w = 5$ and $b = 40$: with 7 hours, $\\hat y = 5\\cdot 7 + 40 = 75$.

## The model and the loss

With several features (lesson 2) the input is a vector $\\mathbf{x}$ and the prediction is $\\hat y = \\mathbf{w}\\cdot\\mathbf{x} + b$: one weight per feature and a single bias. The ten students in the lesson are invented.

The error of a point is $e_i = y_i - \\hat y_i$. With $n$ points, the two losses in the lesson are

$$\\mathrm{MAE}=\\frac1n\\sum_{i=1}^{n}|e_i| \\qquad\\qquad L(w,b)=\\mathrm{MSE}=\\frac1n\\sum_{i=1}^{n}\\bigl(y_i-wx_i-b\\bigr)^2$$

The MSE is measured in squared points. Its root, $\\sqrt{L}$, goes back to points: with the best line in the lesson, $\\sqrt{42.5}\\approx 6.5$ points of typical error. The example line ($w = 5$, $b = 40$) has $L = 45.775$; the flat line at the average, $L = 244.04$.

## Why the square

- **It is smooth.** $L(w,b)$ is a paraboloid: it has a single bottom and a well-defined slope everywhere, which will let us slide down it (lesson 4). The absolute value has a kink at zero.
- **It has a formula.** Setting the partial derivatives of $L$ to zero gives a linear system, the *normal equations*.
- **It has a probabilistic justification.** If $y_i = wx_i+b+\\varepsilon_i$ with normal noise $\\varepsilon_i\\sim\\mathcal N(0,\\sigma^2)$, the likelihood is highest exactly where the MSE is lowest (Goodfellow et al., 2016, sec. 5.5.1, which calls it a criterion introduced “more or less arbitrarily” before justifying it this way). Gauss set this out in 1809 (*Theoria motus*, arts. 175–179): if the errors follow the normal curve, the most probable system of values is the one with the smallest sum of squares. With Laplace noise, which has heavier tails, the matching criterion is the absolute error.
- **It is sensitive to outliers.** With a single parameter (predicting a constant), the MSE is minimized by the **mean** and the absolute error by the **median**. In the lesson’s data, the mean is 64.4 and the median 59.5 (with ten data points, any value between 57 and 62 minimizes the absolute error; the midpoint is taken).

## A little history

Legendre presented least squares in 1805, in an appendix, as the principle that in his judgment is the “most general, most exact and of easiest application”, and that sets up among the errors “a sort of equilibrium” that keeps the extremes from prevailing. Gauss wrote in 1809 that he had used it since 1795 (*Theoria motus*, art. 186) and that, among all even powers of the error, the square was “the most simple”; the priority was disputed (Plackett, 1972; Stigler, 1981).

In the same article Gauss reports that Laplace used the absolute error, proposed earlier by Boscovich. He notes that with it the line generally passes through two of the points, and that any other value could have been observed for another point without changing the solution, provided it stays on the same side: it is what you saw with the outlier, whose absolute line did not move when its grade was lowered. Between the two extremes there are hybrid losses, such as Huber’s (1964): quadratic for small errors and linear for large ones.

## The best line

$$w^*=\\frac{\\sum_i (x_i-\\bar x)(y_i-\\bar y)}{\\sum_i (x_i-\\bar x)^2}=\\frac{\\operatorname{cov}(x,y)}{\\operatorname{var}(x)}\\qquad\\qquad b^*=\\bar y-w^*\\bar x$$

With $\\bar x = 4.55$ and $\\bar y = 64.4$ we get $w^*\\approx 5.26$ and $b^*\\approx 40.45$, with minimum loss $L_{\\min}\\approx 42.5$. The best line always passes through the mean point $(\\bar x,\\bar y)$. In matrix form these are the normal equations, $\\mathbf{w}^*=(X^\\top X)^{-1}X^\\top\\mathbf{y}$ (in $X$, a column of ones takes care of the bias).

If we keep $b=b^*$ and move only $w$, the loss is exactly a parabola:

$$L(w)=L_{\\min}+\\overline{x^2}\\,(w-w^*)^2,\\qquad \\overline{x^2}\\approx 28.0$$

It is the valley in the last scene. The name “regression” comes from Galton. In his 1886 study of stature (930 adult children from 205 families) he found that the children’s height deviation is, on average, two thirds of their parents’: the children of very tall parents tend to be less tall, and those of very short parents, taller. He called it “regression towards mediocrity”, that is, towards the average.

## In code

\`\`\`python
# ten invented students for the lesson
hours = [0.5, 1.5, 2, 3, 4, 5, 6, 6.5, 8, 9]
grade = [43, 49, 52, 57, 62, 72, 73, 56, 87, 93]
n = len(hours)
mx, my = sum(hours) / n, sum(grade) / n

# least squares: w = cov(x, y) / var(x),  b = mean(y) - w * mean(x)
w = sum((x - mx) * (y - my) for x, y in zip(hours, grade)) / sum((x - mx) ** 2 for x in hours)
b = my - w * mx

def loss(w, b):  # mean squared error (MSE)
    return sum((y - (w * x + b)) ** 2 for x, y in zip(hours, grade)) / n

print(round(w, 2), round(b, 2))   # 5.26 40.45   (best weight and bias)
print(round(loss(w, b), 1))       # 42.5         (minimum loss)
print(round(loss(0, my), 1))      # 244.0        (flat line: always predict the mean)
print(round(loss(5, 40), 1))      # 45.8         (the example line: weight 5, bias 40)
\`\`\`

## What comes next

The closed formula works for a straight line. In a network with billions of weights there is none, and the bottom is found step by step: that is gradient descent (lesson 4). And lowering the loss on the training data is not enough: it has to be measured on data the model has not seen (lesson 10).`,
  },

  lens: {
    es: [
      'La función de pérdida es una decisión de negocio, no un detalle técnico. Elevar al cuadrado dice que un error grande cuesta mucho más que varios pequeños. Pregunta si eso refleja tu costo real: no es lo mismo equivocarse mucho una vez que poco muchas veces.',
      'Pide siempre una línea base. Aquí, predecir el promedio daba una pérdida de 244 y la mejor recta, 42.5. Un modelo complejo solo se justifica si supera a la base por un margen que pague su costo. Y pregunta en qué unidades está la métrica: el MSE está al cuadrado.',
      'Los datos atípicos se deciden antes de entrenar: ¿son errores de captura, que se corrigen o se descartan, o casos reales que importan? Con pérdida cuadrática, un solo caso raro puede torcer el modelo. Pide que se reporte cuánto cambia el resultado sin él.',
      'Una pérdida baja no garantiza un buen modelo: se midió con los mismos datos con que se ajustó, y fuera del rango visto el modelo extrapola (con doce horas, esta recta predice más de cien). La lección 10 explica cómo evaluar con datos nuevos.',
    ],
    en: [
      'The loss function is a business decision, not a technical detail. Squaring says that one big error costs far more than several small ones. Ask whether that reflects your real cost: being very wrong once is not the same as being slightly wrong many times.',
      'Always ask for a baseline. Here, predicting the average gave a loss of 244 and the best line 42.5. A complex model is only justified if it beats the baseline by a margin that pays for its cost. And ask what units the metric is in: the MSE is squared.',
      'Outliers are decided before training: are they data-entry errors, which get fixed or dropped, or real cases that matter? With a squared loss, a single odd case can bend the model. Ask for a report of how much the result changes without it.',
      'A low loss does not guarantee a good model: it was measured on the same data it was fit to, and outside the range it has seen the model extrapolates (with twelve hours, this line predicts more than a hundred). Lesson 10 explains how to evaluate on new data.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: {
        es: 'Una recta predice la nota con predicción = 4 · horas + 30. ¿Qué dice el 4?',
        en: 'A line predicts the grade with prediction = 4 · hours + 30. What does the 4 tell you?',
      },
      options: [
        { es: 'Que con cero horas predice una nota de 4.', en: 'That with zero hours it predicts a grade of 4.' },
        { es: 'Que el error de la recta es de 4 puntos.', en: 'That the line’s error is 4 points.' },
        { es: 'Que cada hora más suma 4 puntos a la predicción.', en: 'That each extra hour adds 4 points to the prediction.' },
        { es: 'Que la recta corta el eje vertical en 4.', en: 'That the line crosses the vertical axis at 4.' },
      ],
      answer: 2,
      why: {
        es: 'El 4 es el peso (la pendiente): un escalón de una hora a la derecha sube 4 puntos. El 30 es el sesgo: la nota que predice con cero horas, donde la recta corta el eje vertical.',
        en: 'The 4 is the weight (the slope): a one-hour step to the right rises 4 points. The 30 is the bias: the grade it predicts with zero hours, where the line crosses the vertical axis.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué no basta con sumar los errores con su signo para medir qué tan mal está una recta?', en: 'Why is it not enough to add up the errors with their signs to measure how bad a line is?' },
      options: [
        { es: 'Porque la suma siempre da un número demasiado grande.', en: 'Because the sum always comes out too large.' },
        { es: 'Porque los errores positivos y negativos se cancelan, y una recta mala puede sumar cero.', en: 'Because positive and negative errors cancel out, and a bad line can add up to zero.' },
        { es: 'Porque las computadoras no pueden restar números negativos.', en: 'Because computers cannot subtract negative numbers.' },
        { es: 'Porque el signo del error nunca importa.', en: 'Because the sign of the error never matters.' },
      ],
      answer: 1,
      why: {
        es: 'Los errores por encima y por debajo de la recta se compensan: la recta plana del promedio suma exactamente cero y, sin embargo, ignora las horas. Por eso se eleva al cuadrado (o se usa el valor absoluto), y así nada se cancela.',
        en: 'Errors above and below the line offset each other: the flat line at the average adds up to exactly zero and yet it ignores the hours. That is why we square (or take the absolute value), so nothing cancels.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'Un modelo predice 70 y 60 para dos estudiantes que sacaron 82 y 55. ¿Cuál es la pérdida (MSE)?', en: 'A model predicts 70 and 60 for two students who scored 82 and 55. What is the loss (MSE)?' },
      options: [
        { es: '169', en: '169' },
        { es: '3.5', en: '3.5' },
        { es: '8.5', en: '8.5' },
        { es: '84.5', en: '84.5' },
      ],
      answer: 3,
      why: {
        es: 'Los errores son 82 − 70 = 12 y 55 − 60 = −5. Al cuadrado: 144 y 25. Promedio: (144 + 25) / 2 = 84.5. El 169 es la suma sin dividir; el 3.5 es el promedio con signo, que se cancela; el 8.5 es el promedio de los valores absolutos.',
        en: 'The errors are 82 − 70 = 12 and 55 − 60 = −5. Squared: 144 and 25. Average: (144 + 25) / 2 = 84.5. The 169 is the sum without dividing; 3.5 is the signed average, which cancels; 8.5 is the average of the absolute values.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor te muestra un modelo que predice ventas con una pérdida (MSE) de 120. ¿Qué necesitas para saber si es bueno?', en: 'A vendor shows you a model that predicts sales with a loss (MSE) of 120. What do you need to know whether it is good?' },
      options: [
        { es: 'Nada más: 120 es un número bajo.', en: 'Nothing else: 120 is a low number.' },
        { es: 'Cuántos parámetros tiene el modelo.', en: 'How many parameters the model has.' },
        { es: 'La pérdida de una línea base sencilla, como predecir siempre el promedio, y las unidades del MSE.', en: 'The loss of a simple baseline, such as always predicting the average, and the units of the MSE.' },
        { es: 'Que la pérdida sea exactamente cero.', en: 'That the loss is exactly zero.' },
      ],
      answer: 2,
      why: {
        es: 'Una pérdida suelta no dice nada: depende de la escala de los datos, y el MSE está en unidades al cuadrado. Hay que compararla con una línea base. En la lección, predecir el promedio daba 244 y la mejor recta 42.5; ahí se ve cuánto aporta el modelo. Y con datos reales no llega a cero.',
        en: 'A loss on its own says nothing: it depends on the scale of the data, and the MSE is in squared units. It has to be compared with a baseline. In the lesson, predicting the average gave 244 and the best line 42.5; that shows how much the model adds. And with real data it never reaches zero.',
      },
    },
  ],

  glossary: ['model', 'parameter', 'feature', 'training-data', 'weight', 'bias', 'prediction', 'loss', 'mse', 'regression'],

  terms: [
    { id: 'weight', term: { es: 'Peso (w)', en: 'Weight (w)' }, def: { es: 'En un modelo lineal, el número que multiplica a la entrada: la pendiente de la recta. Indica cuánto sube la predicción por cada unidad que aumenta la entrada.', en: 'In a linear model, the number that multiplies the input: the slope of the line. It tells how much the prediction rises for each unit the input grows.' } },
    { id: 'bias', term: { es: 'Sesgo (b)', en: 'Bias (b)' }, def: { es: 'El término que se suma al final del modelo: la predicción cuando la entrada vale cero, es decir, la altura a la que la recta corta el eje vertical. No es el sesgo de los datos o de un modelo injusto, que es otro concepto.', en: 'The term added at the end of the model: the prediction when the input is zero, that is, the height at which the line crosses the vertical axis. It is not the bias of data or of an unfair model, which is a different concept.' } },
    { id: 'prediction', term: { es: 'Predicción (ŷ)', en: 'Prediction (ŷ)' }, def: { es: 'El número que el modelo entrega para una entrada dada. Al compararlo con el valor real se obtiene el error.', en: 'The number the model returns for a given input. Comparing it with the real value gives the error.' } },
    { id: 'loss', term: { es: 'Función de pérdida', en: 'Loss function' }, def: { es: 'Un único número que resume qué tan equivocado está un modelo con sus datos. Entrenar es buscar los parámetros que lo hacen lo más pequeño posible.', en: 'A single number that summarizes how wrong a model is on its data. Training is the search for the parameters that make it as small as possible.' } },
    { id: 'mse', term: { es: 'Error cuadrático medio (MSE)', en: 'Mean squared error (MSE)' }, def: { es: 'Pérdida que promedia los errores elevados al cuadrado. Castiga mucho más los errores grandes que los pequeños y se mide en las unidades de la salida, al cuadrado.', en: 'A loss that averages the squared errors. It punishes big errors far more than small ones and is measured in the units of the output, squared.' } },
    { id: 'regression', term: { es: 'Regresión', en: 'Regression' }, def: { es: 'Tarea de predecir un número (un precio, una calificación, una temperatura) en lugar de elegir una categoría. La regresión lineal usa una recta.', en: 'The task of predicting a number (a price, a grade, a temperature) rather than choosing a category. Linear regression uses a straight line.' } },
  ],

  sources: [
    { title: 'Nouvelles méthodes pour la détermination des orbites des comètes (apéndice «Sur la méthode des moindres quarrés», pp. 72–73 para la cita)', authors: 'Legendre, A.-M.', year: 1805, url: 'https://archive.org/details/nouvellesmthode00legegoog' },
    { title: 'Theoria motus corporum coelestium in sectionibus conicis solem ambientium (libro II, sección 3, arts. 175–186; traducción inglesa de C. H. Davis, 1857)', authors: 'Gauss, C. F.', year: 1809, url: 'https://archive.org/details/theoryofmotionof00gausuoft' },
    { title: 'Studies in the History of Probability and Statistics. XXIX: The discovery of the method of least squares', authors: 'Plackett, R. L.', year: 1972, url: 'https://doi.org/10.1093/biomet/59.2.239' },
    { title: 'Gauss and the Invention of Least Squares', authors: 'Stigler, S. M.', year: 1981, url: 'https://doi.org/10.1214/aos/1176345451' },
    { title: 'Robust Estimation of a Location Parameter', authors: 'Huber, P. J.', year: 1964, url: 'https://doi.org/10.1214/aoms/1177703732' },
    { title: 'Regression towards mediocrity in hereditary stature', authors: 'Galton, F.', year: 1886, url: 'https://galton.org/essays/1880-1889/galton-1886-jaigi-regression-stature.pdf' },
    { title: 'Deep Learning, cap. 5, secciones 5.1.4 (Example: Linear Regression) y 5.5.1 (Conditional Log-Likelihood and Mean Squared Error)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/ml.html' },
  ],
});
