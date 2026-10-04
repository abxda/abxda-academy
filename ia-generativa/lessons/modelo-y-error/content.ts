import { defineLesson } from '../../../../../core/define';

// Lección 3 · Un modelo y su error.
// Datos de la escena: diez estudiantes ficticios (horas de estudio → calificación), ilustrativos; ver helpers.ts.
export default defineLesson({
  id: 'modelo-y-error',

  objectives: {
    es: [
      'Calcular la predicción y el error de un modelo lineal para un punto.',
      'Explicar por qué el error se eleva al cuadrado y qué consecuencias tiene: los errores grandes dominan y los atípicos pesan.',
      'Reconocer que aprender es elegir los parámetros que minimizan la pérdida, y calcular el MSE de unos pocos puntos.',
    ],
    en: [
      'Calculate the prediction and the error of a linear model for a single point.',
      'Explain why the error is squared and what follows from it: big errors dominate and outliers pull hard.',
      'Recognize that learning means choosing the parameters that minimize the loss, and compute the MSE of a few points.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Ya sabemos que los datos son números y que un modelo es una regla con números ajustables. Construyamos el más simple con un caso: diez estudiantes, las horas que estudió cada uno y la calificación que sacó.',
      en: 'We know that data are numbers and that a model is a rule with adjustable numbers. Let’s build the simplest one with a single case: ten students, the hours each studied, and the grade each got.',
    },
    {
      id: 'pattern',
      es: 'A simple vista hay un patrón: quien estudia más suele sacar más. Queremos que una máquina lo capture y, dadas unas horas de estudio, prediga la calificación.',
      en: 'At a glance there is a pattern: those who study more tend to score higher. We want a machine to capture it and, given some hours of study, predict the grade.',
    },
    {
      id: 'regression',
      es: 'Cuando lo que se predice es un número, como una calificación o un precio, y no una categoría como «spam», el problema se llama regresión. Es la tarea más sencilla para estudiar cómo aprende un modelo.',
      en: 'When what we predict is a number, such as a grade or a price, rather than a category like “spam”, the problem is called regression. It is the simplest task for studying how a model learns.',
      note: { es: 'Regresión: predecir un número a partir de datos.', en: 'Regression: predicting a number from data.' },
    },
    {
      id: 'line',
      es: 'El modelo más simple es una recta. Trazamos una cualquiera: para cada cantidad de horas nos da una calificación, que es su predicción.',
      en: 'The simplest model is a straight line. We draw any one: for every number of hours it gives a grade, and that grade is its prediction.',
    },
    {
      id: 'formula',
      es: 'Su fórmula es corta: la predicción es w por x, más b, la suma ponderada de la primera lección con una sola entrada. La entrada x son las horas; w y b son dos números que deciden qué recta es.',
      en: 'Its formula is short: the prediction is w times x, plus b, the weighted sum from the first lesson with a single input. The input x is the hours; w and b are two numbers that decide which line it is.',
      tts: { es: 'Su fórmula es corta: la predicción es doble ve por equis, más be, la suma ponderada de la primera lección con una sola entrada. La entrada equis son las horas; doble ve y be son dos números que deciden qué recta es.' },
    },
    {
      id: 'weight',
      es: 'El peso w es la pendiente: cuántos puntos suma la predicción por cada hora extra de estudio. Mientras mayor es w, más empinada es la recta.',
      en: 'The weight w is the slope: how many points the prediction gains for each extra hour of study. The larger w is, the steeper the line.',
      tts: { es: 'El peso doble ve es la pendiente: cuántos puntos suma la predicción por cada hora extra de estudio. Mientras mayor es doble ve, más empinada es la recta.' },
      note: { es: 'Peso w: la pendiente, puntos por cada hora.', en: 'Weight w: the slope, points per hour.' },
    },
    {
      id: 'bias',
      es: 'El sesgo b es el número fijo que se suma al final: la altura de la recta cuando x vale cero, lo que el modelo predice para quien no estudió nada. Cambiarlo sube o baja la recta entera.',
      en: 'The bias b is the fixed number added at the end: the height of the line when x is zero, what the model predicts for someone who never studied. Changing it moves the whole line up or down.',
      tts: { es: 'El sesgo be es el número fijo que se suma al final: la altura de la recta cuando equis vale cero, lo que el modelo predice para quien no estudió nada. Cambiarlo sube o baja la recta entera.' },
      note: { es: 'Sesgo b: la altura de la recta en x = 0.', en: 'Bias b: the height of the line at x = 0.' },
    },
    {
      id: 'prediction',
      es: 'Con w igual a dos y b igual a cuarenta y cinco, quien estudia siete horas recibe esta predicción: dos por siete, más cuarenta y cinco, igual a cincuenta y nueve.',
      en: 'With w equal to two and b equal to forty-five, someone who studies seven hours gets this prediction: two times seven, plus forty-five, equals fifty-nine.',
      tts: { es: 'Con doble ve igual a dos y be igual a cuarenta y cinco, quien estudia siete horas recibe esta predicción: dos por siete, más cuarenta y cinco, igual a cincuenta y nueve.' },
      note: { es: 'Predicción: lo que el modelo responde para una entrada.', en: 'Prediction: what the model answers for an input.' },
    },
    {
      id: 'reality',
      es: 'Ahora comparemos con la realidad. Quien estudió cinco horas sacó setenta y dos, pero la recta dice cincuenta y cinco. El error es lo real menos lo predicho: diecisiete.',
      en: 'Now let’s compare with reality. The student who studied five hours scored seventy-two, but the line says fifty-five. The error is the real value minus the predicted one: seventeen.',
      note: { es: 'Error de un punto: real − predicción.', en: 'Error of one point: real − prediction.' },
    },
    {
      id: 'all-errors',
      es: 'Cada estudiante tiene su propio error. Los que quedan por encima de la recta tienen error positivo; los que quedan por debajo, negativo.',
      en: 'Every student has an error of their own. Points above the line have a positive error; points below it, a negative one.',
    },
    {
      id: 'sum-problem',
      es: '¿Cómo resumirlos en un solo número? Sumarlos falla: los positivos cancelan a los negativos. Esta recta plana, que ignora las horas, tiene una suma de errores igual a cero.',
      en: 'How do we boil them down to a single number? Adding them fails: positives cancel negatives. This flat line, which ignores the hours, has a total error of exactly zero.',
    },
    {
      id: 'absolute',
      es: 'Hay que quitarles el signo. Una opción: el error absoluto, la distancia al punto sin importar de qué lado quede. Así nada se cancela, y la recta plana ya no obtiene cero.',
      en: 'We have to remove the sign. One option: the absolute error, the distance to the point, whichever side it is on. Now nothing cancels, and the flat line no longer scores zero.',
    },
    {
      id: 'square',
      es: 'La otra opción es elevar cada error al cuadrado. Geométricamente, dibujamos un cuadrado cuyo lado es el error; su área es el error al cuadrado.',
      en: 'The other option is to square each error. Geometrically, we draw a square whose side is the error; its area is the squared error.',
      pad: 0.3,
    },
    {
      id: 'big-weighs',
      es: 'Fíjate en cuánto pesa cada punto. El doble de error da un cuadrado de cuatro veces el área; cuatro veces, dieciséis. Aquí, 28,6 contra 7,4: casi cuatro veces el error y unas quince veces el área.',
      en: 'Look at how much each point weighs. Twice the error gives a square with four times the area; four times, sixteen. Here, 28.6 against 7.4: almost four times the error and about fifteen times the area.',
      tts: {
        es: 'Fíjate en cuánto pesa cada punto. El doble de error da un cuadrado de cuatro veces el área; cuatro veces, dieciséis. Aquí, veintiocho coma seis contra siete coma cuatro: casi cuatro veces el error y unas quince veces el área.',
        en: 'Look at how much each point weighs. Twice the error gives a square with four times the area; four times, sixteen. Here, twenty-eight point six against seven point four: almost four times the error and about fifteen times the area.',
      },
    },
    {
      id: 'loss',
      es: 'La función de pérdida promedia esas áreas: suma de cuadrados entre número de puntos. Es el error cuadrático medio, o MSE. Cuanto menor, mejor se ajusta el modelo a los datos.',
      en: 'The loss function averages those areas: the sum of the squares divided by the number of points. It is the mean squared error, or MSE. The lower, the better the model fits the data.',
      tts: {
        es: 'La función de pérdida promedia esas áreas: suma de cuadrados entre número de puntos. Es el error cuadrático medio, o eme ese e. Cuanto menor, mejor se ajusta el modelo a los datos.',
        en: 'The loss function averages those areas: the sum of the squares divided by the number of points. It is the mean squared error, or M S E. The lower, the better the model fits the data.',
      },
      note: { es: 'Pérdida (MSE): promedio de los errores al cuadrado.', en: 'Loss (MSE): the average of the squared errors.' },
    },
    {
      id: 'goal',
      es: 'Ahora «aprender» tiene un sentido preciso: encontrar los valores de w y b que dejan la pérdida lo más baja posible.',
      en: 'Now “learning” has a precise meaning: finding the values of w and b that make the loss as low as possible.',
      tts: { es: 'Ahora «aprender» tiene un sentido preciso: encontrar los valores de doble ve y be que dejan la pérdida lo más baja posible.' },
      note: { es: 'Aprender: elegir w y b que minimicen la pérdida.', en: 'Learning: choosing the w and b that minimize the loss.' },
    },
    {
      id: 'try1',
      es: 'Tu turno: arrastra las dos asas de la recta, o usa los botones, y baja la pérdida todo lo que puedas. Los cuadrados te muestran qué puntos fallan más.',
      en: 'Your turn: drag the two handles on the line, or use the buttons, and push the loss down as far as you can. The squares show which points miss the most.',
      gate: {
        id: 'fit',
        prompt: {
          es: 'Baja la pérdida todo lo que puedas; te avisaremos al llegar cerca del mínimo. Guíate por tu mejor marca.',
          en: 'Push the loss down as far as you can; we will tell you when you are close to the minimum. Follow your best score.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'floor',
      es: 'Si llegaste cerca, notaste que hay un fondo: un punto donde cualquier movimiento de la recta hace subir la pérdida. Ahí está la mejor recta.',
      en: 'If you got close, you noticed there is a floor: a point where any move of the line pushes the loss up. That is where the best line sits.',
      pad: 0.3,
    },
    {
      id: 'not-zero',
      es: 'Ni siquiera la mejor recta acierta todo: su pérdida no es cero. Los datos reales traen ruido, y diez puntos así no caen sobre una misma recta.',
      en: 'Even the best line does not hit everything: its loss is not zero. Real data carry noise, and ten points like these do not fall on a single straight line.',
    },
    {
      id: 'best-line',
      es: 'Para una recta, la mejor tiene una fórmula directa: es el método de mínimos cuadrados. Legendre lo publicó en 1805, y Gauss afirmó que lo usaba desde 1795.',
      en: 'For a straight line, the best fit has a direct formula: the method of least squares. Legendre published it in 1805, and Gauss claimed he had used it since 1795.',
      tts: {
        es: 'Para una recta, la mejor tiene fórmula: es el método de mínimos cuadrados. Legendre lo publicó en mil ochocientos cinco, y Gauss afirmó que lo usaba desde mil setecientos noventa y cinco.',
        en: 'For a straight line, the best fit has a formula: the method of least squares. Legendre published it in eighteen oh five, and Gauss claimed he had used it since seventeen ninety-five.',
      },
    },
    {
      id: 'outlier',
      es: 'Mira el cuadrado más grande: es de un solo estudiante atípico, el que estudió seis horas y media y sacó cincuenta y seis. Aporta más de tres cuartas partes de la pérdida.',
      en: 'Look at the biggest square: it belongs to one outlier, the student who studied six and a half hours and scored fifty-six. It contributes over three quarters of the loss.',
    },
    {
      id: 'why-big',
      es: 'Con valores absolutos, ese mismo estudiante aportaría casi la mitad. Elevar al cuadrado es una decisión, no una ley natural: prefiere varios errores pequeños a uno enorme, y eso tiene sentido si un error grande cuesta mucho más.',
      en: 'With absolute values, that same student would add almost half. Squaring is a design choice, not a law of nature: it prefers several small errors to one huge one, which makes sense when a big error costs far more.',
    },
    {
      id: 'compare',
      es: 'Pero tiene un costo: un punto atípico puede torcer la recta. Comparemos dos criterios: la recta que minimiza los cuadrados y la que minimiza los errores absolutos.',
      en: 'But it has a cost: a single outlier can bend the line. Let’s compare two criteria: the line that minimizes the squares and the line that minimizes the absolute errors.',
    },
    {
      id: 'try2',
      es: 'Tu turno: arrastra al estudiante atípico hacia arriba y hacia abajo. Antes de moverlo, predice: ¿cuál de las dos rectas lo va a seguir?',
      en: 'Your turn: drag the outlier up and down. Before you move it, predict: which of the two lines will follow it?',
      gate: {
        id: 'outlier',
        prompt: {
          es: 'Mueve al estudiante atípico al menos treinta puntos y observa cuál recta lo sigue.',
          en: 'Move the outlier at least thirty points and watch which line follows.',
        },
      },
      pad: 0.4,
    },
    {
      id: 'after-try2',
      es: 'La recta cuadrática persigue al atípico; la absoluta casi no se mueve. Gauss ya lo notó en 1809: ese criterio solo mira de qué lado queda un punto, no a qué distancia.',
      en: 'The squared line chases the outlier; the absolute one barely moves. Gauss noticed this in 1809: that criterion only sees which side a point is on, not how far away.',
      tts: {
        es: 'La recta cuadrática persigue al atípico; la absoluta casi no se mueve. Gauss ya lo notó en mil ochocientos nueve: ese criterio solo mira de qué lado queda un punto, no a qué distancia.',
        en: 'The squared line chases the outlier; the absolute one barely moves. Gauss noticed this in eighteen oh nine: that criterion only sees which side a point is on, not how far away.',
      },
      note: { es: 'Cuadrático: sensible a atípicos. Absoluto: más robusto.', en: 'Squared: sensitive to outliers. Absolute: more robust.' },
    },
    {
      id: 'gauss',
      es: 'Gauss dio además una razón de probabilidad: si los errores de medición siguen una curva de campana, la normal, la recta de mínimos cuadrados es la más probable.',
      en: 'Gauss also gave a reason from probability: if measurement errors follow a bell curve, the normal, the least-squares line is the most probable one.',
    },
    {
      id: 'limits',
      es: 'Una advertencia: una pérdida baja no garantiza un buen modelo. La recta no sabe doblarse, y con doce horas de estudio predice más de cien puntos, algo imposible.',
      en: 'One warning: a low loss does not guarantee a good model. The line cannot bend, and with twelve hours of study it predicts more than a hundred points, which is impossible.',
    },
    {
      id: 'curve',
      es: 'Dejemos b en su mejor valor y movamos solo w. Cada peso es una recta distinta, y cada recta tiene su pérdida. Juntas dibujan una parábola con un fondo.',
      en: 'Let’s keep b at its best value and move only w. Each weight gives a different line, and each line has its own loss. Together they draw a parabola with a floor.',
      tts: { es: 'Dejemos be en su mejor valor y movamos solo doble ve. Cada peso es una recta distinta, y cada recta tiene su pérdida. Juntas dibujan una parábola con un fondo.' },
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Con una recta basta una fórmula. Con miles de millones de pesos no existe ninguna. ¿Cómo encontrar el peso de menor pérdida sin probarlos todos? Esa es la siguiente lección.',
      en: 'For a straight line, a formula is enough. With billions of weights there is none. How do we find the lowest-loss weight without trying them all? That is the next lesson.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo lineal predice con ŷ = w·x + b: el peso w es la pendiente y el sesgo b es la altura en x = 0. Son sus parámetros.',
      'El error de un punto es lo real menos lo predicho. Sumar los errores con signo falla: los positivos y los negativos se cancelan.',
      'La pérdida (MSE) es el promedio de los errores al cuadrado: cada error se vuelve un cuadrado y la pérdida es el área media. Los errores grandes pesan mucho más.',
      'Aprender es elegir los parámetros que minimizan la pérdida. Para una recta hay fórmula (mínimos cuadrados, Legendre y Gauss), pero ni así la pérdida llega a cero.',
      'Elevar al cuadrado es una decisión: un punto atípico puede torcer la recta, mientras que el error absoluto casi no lo escucha.',
    ],
    en: [
      'A linear model predicts with ŷ = w·x + b: the weight w is the slope and the bias b is the height at x = 0. They are its parameters.',
      'The error of a point is the real value minus the predicted one. Adding errors with their signs fails: positives and negatives cancel.',
      'The loss (MSE) is the average of the squared errors: each error becomes a square and the loss is the mean area. Big errors weigh far more.',
      'Learning means choosing the parameters that minimize the loss. A straight line has a formula (least squares, Legendre and Gauss), but even then the loss does not reach zero.',
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
    es: `## El modelo y la pérdida

Para una entrada $x$, el modelo lineal predice $\\hat y = wx + b$. Con varias características (lección 2) la entrada es un vector $\\mathbf{x}$ y la predicción es $\\hat y = \\mathbf{w}\\cdot\\mathbf{x} + b$: un peso por característica y un solo sesgo.

El error de un punto es $e_i = y_i - \\hat y_i$. Con $n$ puntos, las dos pérdidas de la lección son

$$\\mathrm{MAE}=\\frac1n\\sum_{i=1}^{n}|e_i| \\qquad\\qquad L(w,b)=\\mathrm{MSE}=\\frac1n\\sum_{i=1}^{n}\\bigl(y_i-wx_i-b\\bigr)^2$$

El MSE se mide en puntos al cuadrado. Su raíz, $\\sqrt{L}$, vuelve a puntos: con la mejor recta de la lección, $\\sqrt{42{,}5}\\approx 6{,}5$ puntos de error típico.

## Por qué el cuadrado

- **Es suave.** $L(w,b)$ es un paraboloide: tiene un único fondo y una pendiente definida en todas partes, lo que permitirá bajar por ella (lección 4). El valor absoluto tiene un pico en cero.
- **Tiene fórmula.** Al igualar a cero las derivadas parciales de $L$ se obtiene un sistema lineal, las *ecuaciones normales*.
- **Tiene una justificación probabilística.** Si $y_i = wx_i+b+\\varepsilon_i$ con ruido normal $\\varepsilon_i\\sim\\mathcal N(0,\\sigma^2)$, la verosimilitud es máxima justo donde el MSE es mínimo. Gauss lo planteó en 1809. Con ruido de Laplace, de colas más pesadas, el criterio equivalente es el error absoluto.
- **Es sensible a los atípicos.** Con un solo parámetro (predecir una constante), el MSE se minimiza con la **media** y el error absoluto con la **mediana**. En los datos de la lección, la media es 64,4 y la mediana 59,5.

El error absoluto ya lo usaban Boscovich y Laplace antes de que Legendre publicara los mínimos cuadrados. Entre los dos extremos existen pérdidas híbridas, como la de Huber (1964): cuadrática para errores pequeños y lineal para los grandes.

## La mejor recta

$$w^*=\\frac{\\sum_i (x_i-\\bar x)(y_i-\\bar y)}{\\sum_i (x_i-\\bar x)^2}=\\frac{\\operatorname{cov}(x,y)}{\\operatorname{var}(x)}\\qquad\\qquad b^*=\\bar y-w^*\\bar x$$

Con $\\bar x = 4{,}55$ y $\\bar y = 64{,}4$ resultan $w^*\\approx 5{,}26$ y $b^*\\approx 40{,}45$, con pérdida mínima $L_{\\min}\\approx 42{,}5$. La mejor recta siempre pasa por el punto promedio $(\\bar x,\\bar y)$. En forma matricial son las ecuaciones normales, $\\mathbf{w}^*=(X^\\top X)^{-1}X^\\top\\mathbf{y}$.

Si dejamos $b=b^*$ y movemos solo $w$, la pérdida es exactamente una parábola:

$$L(w)=L_{\\min}+\\overline{x^2}\\,(w-w^*)^2,\\qquad \\overline{x^2}\\approx 28{,}0$$

Es la curva de la última escena. El nombre «regresión» viene de Galton (1886), que observó que los hijos de padres muy altos tienden a ser menos altos que ellos: regresan hacia el promedio.

## En código

\`\`\`python
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
print(round(perdida(2, 45), 1))   # 226.1        (la recta con que arranca la lección)
\`\`\`

## Lo que viene

La fórmula cerrada sirve para una recta. En una red con miles de millones de pesos no existe, y el fondo se busca paso a paso: es el descenso del gradiente (lección 4). Y bajar la pérdida en los datos de entrenamiento no basta: hay que medirla con datos que el modelo no vio (lección 10).`,
    en: `## The model and the loss

For an input $x$, the linear model predicts $\\hat y = wx + b$. With several features (lesson 2) the input is a vector $\\mathbf{x}$ and the prediction is $\\hat y = \\mathbf{w}\\cdot\\mathbf{x} + b$: one weight per feature and a single bias.

The error of a point is $e_i = y_i - \\hat y_i$. With $n$ points, the two losses in the lesson are

$$\\mathrm{MAE}=\\frac1n\\sum_{i=1}^{n}|e_i| \\qquad\\qquad L(w,b)=\\mathrm{MSE}=\\frac1n\\sum_{i=1}^{n}\\bigl(y_i-wx_i-b\\bigr)^2$$

The MSE is measured in squared points. Its root, $\\sqrt{L}$, goes back to points: with the best line in the lesson, $\\sqrt{42.5}\\approx 6.5$ points of typical error.

## Why the square

- **It is smooth.** $L(w,b)$ is a paraboloid: it has a single bottom and a well-defined slope everywhere, which will let us slide down it (lesson 4). The absolute value has a kink at zero.
- **It has a formula.** Setting the partial derivatives of $L$ to zero gives a linear system, the *normal equations*.
- **It has a probabilistic justification.** If $y_i = wx_i+b+\\varepsilon_i$ with normal noise $\\varepsilon_i\\sim\\mathcal N(0,\\sigma^2)$, the likelihood is highest exactly where the MSE is lowest. Gauss set this out in 1809. With Laplace noise, which has heavier tails, the matching criterion is the absolute error.
- **It is sensitive to outliers.** With a single parameter (predicting a constant), the MSE is minimized by the **mean** and the absolute error by the **median**. In the lesson’s data, the mean is 64.4 and the median 59.5.

The absolute error was already used by Boscovich and Laplace before Legendre published least squares. Between the two extremes there are hybrid losses, such as Huber’s (1964): quadratic for small errors and linear for large ones.

## The best line

$$w^*=\\frac{\\sum_i (x_i-\\bar x)(y_i-\\bar y)}{\\sum_i (x_i-\\bar x)^2}=\\frac{\\operatorname{cov}(x,y)}{\\operatorname{var}(x)}\\qquad\\qquad b^*=\\bar y-w^*\\bar x$$

With $\\bar x = 4.55$ and $\\bar y = 64.4$ we get $w^*\\approx 5.26$ and $b^*\\approx 40.45$, with minimum loss $L_{\\min}\\approx 42.5$. The best line always passes through the mean point $(\\bar x,\\bar y)$. In matrix form these are the normal equations, $\\mathbf{w}^*=(X^\\top X)^{-1}X^\\top\\mathbf{y}$.

If we keep $b=b^*$ and move only $w$, the loss is exactly a parabola:

$$L(w)=L_{\\min}+\\overline{x^2}\\,(w-w^*)^2,\\qquad \\overline{x^2}\\approx 28.0$$

It is the curve in the last scene. The name “regression” comes from Galton (1886), who observed that the children of very tall parents tend to be less tall than they are: they regress toward the average.

## In code

\`\`\`python
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
print(round(loss(2, 45), 1))      # 226.1        (the line the lesson starts with)
\`\`\`

## What comes next

The closed formula works for a straight line. In a network with billions of weights there is none, and the bottom is found step by step: that is gradient descent (lesson 4). And lowering the loss on the training data is not enough: it has to be measured on data the model has not seen (lesson 10).`,
  },

  lens: {
    es: [
      'La función de pérdida es una decisión de negocio, no un detalle técnico. Elevar al cuadrado dice que un error grande cuesta mucho más que varios pequeños. Pregunta si eso refleja tu costo real: no es lo mismo equivocarse mucho una vez que poco muchas veces.',
      'Pide siempre una línea base. Aquí, predecir el promedio daba una pérdida de 244 y la mejor recta, 42,5. Un modelo complejo solo se justifica si supera a la base por un margen que pague su costo. Y pregunta en qué unidades está la métrica: el MSE está al cuadrado.',
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
      q: { es: '¿Por qué no basta con sumar los errores con su signo para medir qué tan mal está una recta?', en: 'Why is it not enough to add up the errors with their signs to measure how bad a line is?' },
      options: [
        { es: 'Porque la suma siempre da un número demasiado grande.', en: 'Because the sum always comes out too large.' },
        { es: 'Porque los errores positivos y negativos se cancelan, y una recta mala puede sumar cero.', en: 'Because positive and negative errors cancel out, and a bad line can add up to zero.' },
        { es: 'Porque las computadoras no pueden restar números negativos.', en: 'Because computers cannot subtract negative numbers.' },
        { es: 'Porque el signo del error nunca importa.', en: 'Because the sign of the error never matters.' },
      ],
      answer: 1,
      why: {
        es: 'Los errores por encima y por debajo de la recta se compensan: la recta plana del promedio suma exactamente cero y, sin embargo, ignora las horas. Por eso se usa el valor absoluto o el cuadrado, que no se cancelan.',
        en: 'Errors above and below the line offset each other: the flat line at the average adds up to exactly zero and yet it ignores the hours. That is why we use the absolute value or the square, which do not cancel.',
      },
    },
    {
      kind: 'concept',
      q: { es: 'Un estudiante atípico queda muy lejos de la tendencia. ¿Qué pasa con la recta de mínimos cuadrados frente a la de error absoluto?', en: 'One student, an outlier, sits far from the trend. What happens to the least-squares line compared with the absolute-error line?' },
      options: [
        { es: 'Las dos se mueven exactamente igual.', en: 'Both move by exactly the same amount.' },
        { es: 'La de error absoluto se mueve más, porque suma distancias.', en: 'The absolute-error line moves more, because it adds up distances.' },
        { es: 'Ninguna se mueve: una recta no depende de los datos.', en: 'Neither moves: a line does not depend on the data.' },
        { es: 'La de mínimos cuadrados se mueve más, porque un error grande pesa al cuadrado.', en: 'The least-squares line moves more, because a big error counts squared.' },
      ],
      answer: 3,
      why: {
        es: 'Elevar al cuadrado hace que un error grande pese muchísimo: uno cuatro veces mayor cuenta dieciséis veces más. El error absoluto solo cuenta la distancia, así que el atípico lo mueve mucho menos.',
        en: 'Squaring makes a big error weigh a lot: one four times larger counts sixteen times more. The absolute error only counts distance, so the outlier moves it far less.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'Un modelo predice 70 y 60 para dos estudiantes que sacaron 82 y 55. ¿Cuál es la pérdida (MSE)?', en: 'A model predicts 70 and 60 for two students who scored 82 and 55. What is the loss (MSE)?' },
      options: [
        { es: '84,5', en: '84.5' },
        { es: '169', en: '169' },
        { es: '3,5', en: '3.5' },
        { es: '8,5', en: '8.5' },
      ],
      answer: 0,
      why: {
        es: 'Los errores son 82 − 70 = 12 y 55 − 60 = −5. Al cuadrado: 144 y 25. Promedio: (144 + 25) / 2 = 84,5. El 169 es la suma sin dividir; el 3,5 es el promedio con signo, que se cancela; el 8,5 es el promedio de los valores absolutos.',
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
        es: 'Una pérdida suelta no dice nada: depende de la escala de los datos, y el MSE está en unidades al cuadrado. Hay que compararla con una línea base. En la lección, predecir el promedio daba 244 y la mejor recta 42,5; ahí se ve cuánto aporta el modelo. Y con datos reales no llega a cero.',
        en: 'A loss on its own says nothing: it depends on the scale of the data, and the MSE is in squared units. It has to be compared with a baseline. In the lesson, predicting the average gave 244 and the best line 42.5; that shows how much the model adds. And with real data it never reaches zero.',
      },
    },
  ],

  glossary: ['model', 'parameter', 'feature', 'training-data', 'weight', 'bias', 'prediction', 'loss', 'mse', 'regression'],

  terms: [
    { id: 'weight', term: { es: 'Peso (w)', en: 'Weight (w)' }, def: { es: 'En un modelo lineal, el número que multiplica a la entrada: la pendiente de la recta. Indica cuánto cambia la predicción por cada unidad de la entrada.', en: 'In a linear model, the number that multiplies the input: the slope of the line. It tells how much the prediction changes per unit of input.' } },
    { id: 'bias', term: { es: 'Sesgo (b)', en: 'Bias (b)' }, def: { es: 'El término que se suma al final del modelo: la predicción cuando la entrada vale cero, es decir, la altura de la recta. No es el sesgo de los datos o de un modelo injusto, que es otro concepto.', en: 'The term added at the end of the model: the prediction when the input is zero, that is, the height of the line. It is not the bias of data or of an unfair model, which is a different concept.' } },
    { id: 'prediction', term: { es: 'Predicción (ŷ)', en: 'Prediction (ŷ)' }, def: { es: 'El número que el modelo entrega para una entrada dada. Al compararlo con el valor real se obtiene el error.', en: 'The number the model returns for a given input. Comparing it with the real value gives the error.' } },
    { id: 'loss', term: { es: 'Función de pérdida', en: 'Loss function' }, def: { es: 'Un único número que resume qué tan equivocado está un modelo con sus datos. Entrenar es buscar los parámetros que lo hacen lo más pequeño posible.', en: 'A single number that summarizes how wrong a model is on its data. Training is the search for the parameters that make it as small as possible.' } },
    { id: 'mse', term: { es: 'Error cuadrático medio (MSE)', en: 'Mean squared error (MSE)' }, def: { es: 'Pérdida que promedia los errores elevados al cuadrado. Castiga mucho más los errores grandes que los pequeños y se mide en las unidades de la salida, al cuadrado.', en: 'A loss that averages the squared errors. It punishes big errors far more than small ones and is measured in the units of the output, squared.' } },
    { id: 'regression', term: { es: 'Regresión', en: 'Regression' }, def: { es: 'Tarea de predecir un número (un precio, una calificación, una temperatura) en lugar de elegir una categoría. La regresión lineal usa una recta.', en: 'The task of predicting a number (a price, a grade, a temperature) rather than choosing a category. Linear regression uses a straight line.' } },
  ],

  sources: [
    { title: 'Nouvelles méthodes pour la détermination des orbites des comètes', authors: 'Legendre, A.-M.', year: 1805 },
    { title: 'Theoria motus corporum coelestium in sectionibus conicis solem ambientium', authors: 'Gauss, C. F.', year: 1809 },
    { title: 'Studies in the History of Probability and Statistics. XXIX: The discovery of the method of least squares', authors: 'Plackett, R. L.', year: 1972, url: 'https://doi.org/10.1093/biomet/59.2.239' },
    { title: 'Gauss and the Invention of Least Squares', authors: 'Stigler, S. M.', year: 1981, url: 'https://doi.org/10.1214/aos/1176345451' },
    { title: 'Robust Estimation of a Location Parameter', authors: 'Huber, P. J.', year: 1964, url: 'https://doi.org/10.1214/aoms/1177703732' },
    { title: 'Regression towards mediocrity in hereditary stature', authors: 'Galton, F.', year: 1886 },
    { title: 'Deep Learning, sección 5.1.4: Example: Linear Regression', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/' },
  ],
});
