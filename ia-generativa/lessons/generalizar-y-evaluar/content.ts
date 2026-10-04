import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'generalizar-y-evaluar',

  objectives: {
    es: [
      'Distinguir subajuste de sobreajuste y detectarlos comparando el error de entrenamiento con el de validación.',
      'Explicar para qué sirven los conjuntos de entrenamiento, validación y prueba, y qué es una fuga de datos.',
      'Calcular e interpretar precisión, exhaustividad y la matriz de confusión, incluido el efecto de la tasa base.',
    ],
    en: [
      'Tell underfitting from overfitting and detect them by comparing training error with validation error.',
      'Explain what the training, validation, and test sets are for, and what data leakage is.',
      'Compute and interpret precision, recall, and the confusion matrix, including the effect of the base rate.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Un modelo que acierta todos sus ejemplos de entrenamiento puede fallar con los casos nuevos. Medir bien es medir con datos que el modelo nunca vio.',
      en: 'A model that gets all its training examples right can still fail on new cases. Measuring well means measuring with data the model has never seen.',
    },
    {
      id: 'data',
      es: 'Veamos un caso pequeño. Doce mediciones con algo de ruido siguen una curva que el modelo no conoce. Esos son los datos de entrenamiento.',
      en: 'Let us look at a small case. Twelve noisy measurements follow a curve the model does not know. Those are the training data.',
    },
    {
      id: 'underfit',
      es: 'Primer modelo: una recta. Es demasiado simple para esta curva y falla incluso con los datos que ya vio. Es el subajuste.',
      en: 'First model: a straight line. It is too simple for this curve and fails even on the data it has seen. That is underfitting.',
      note: { es: 'Subajuste: el modelo es demasiado simple.', en: 'Underfitting: the model is too simple.' },
    },
    {
      id: 'good',
      es: 'Con un polinomio de grado cuatro, la curva sigue la señal sin perseguir el ruido.',
      en: 'With a degree-four polynomial, the curve follows the signal without chasing the noise.',
    },
    {
      id: 'overfit',
      es: 'Con grado diez, la curva pasa casi por cada punto: el error de entrenamiento es casi cero. Pero ahora serpentea entre los puntos y persigue el ruido. Es el sobreajuste.',
      en: 'With degree ten, the curve passes almost through every point: training error is almost zero. But now it wiggles between the points and chases the noise. That is overfitting.',
      note: { es: 'Sobreajuste: aprende el ruido, no la señal.', en: 'Overfitting: it learns the noise, not the signal.' },
      pad: 0.4,
    },
    {
      id: 'val',
      es: '¿Cómo se detecta? Con datos de validación: ochenta mediciones nuevas que el modelo no usó para ajustarse. Aquí el error sí delata el problema.',
      en: 'How do you detect it? With validation data: eighty new measurements the model did not use to fit itself. Here the error does expose the problem.',
      pad: 0.4,
    },
    {
      id: 'try1',
      es: 'Tu turno: mueve el grado del polinomio y busca el que dé el menor error de validación.',
      en: 'Your turn: move the polynomial degree and look for the one that gives the lowest validation error.',
      gate: {
        id: 'degree',
        prompt: { es: 'Prueba varios grados y quédate con el de menor error de validación.', en: 'Try several degrees and settle on the one with the lowest validation error.' },
      },
      pad: 0.4,
    },
    {
      id: 'gap',
      es: 'Mira las dos curvas de error. El de entrenamiento baja siempre al complicar el modelo; el de validación baja y luego sube. La brecha entre ambos es la señal de alarma.',
      en: 'Look at the two error curves. Training error always falls as the model gets more complex; validation error falls and then rises. The gap between them is the warning sign.',
      note: { es: 'Brecha entre entrenamiento y validación = sobreajuste.', en: 'Gap between training and validation = overfitting.' },
      pad: 0.5,
    },
    {
      id: 'split',
      es: 'Por eso los datos se reparten en tres: entrenamiento para aprender, validación para elegir entre modelos, y prueba, que se usa una sola vez al final para informar el resultado.',
      en: 'That is why data is split in three: training to learn, validation to choose between models, and test, used only once at the end to report the result.',
      note: { es: 'Tres conjuntos: entrenar, validar, probar.', en: 'Three sets: train, validate, test.' },
      pad: 0.4,
    },
    {
      id: 'leak',
      es: 'Cuidado con la fuga de datos: si información del examen se cuela en el entrenamiento, el resultado parece mejor de lo que es. Una revisión de 2023 la encontró en al menos 294 artículos científicos de 17 disciplinas.',
      en: 'Beware of data leakage: if information from the exam slips into training, the result looks better than it is. A 2023 review found it in at least 294 scientific papers across 17 fields.',
      tts: {
        es: 'Cuidado con la fuga de datos: si información del examen se cuela en el entrenamiento, el resultado parece mejor de lo que es. Una revisión de dos mil veintitrés la encontró en al menos doscientos noventa y cuatro artículos científicos de diecisiete disciplinas.',
        en: 'Beware of data leakage: if information from the exam slips into training, the result looks better than it is. A twenty twenty-three review found it in at least two hundred ninety-four scientific papers across seventeen fields.',
      },
      note: { es: 'Fuga de datos: el examen se cuela en el entrenamiento.', en: 'Data leakage: the exam slips into training.' },
      pad: 0.4,
    },
    {
      id: 'reg',
      es: 'Otra defensa es la regularización: penalizar los pesos grandes para que el modelo prefiera curvas suaves. Un parámetro, lambda, controla cuánto castigo.',
      en: 'Another defense is regularization: penalizing large weights so the model prefers smooth curves. One parameter, lambda, controls how much penalty.',
      note: { es: 'Regularización: castigar los pesos grandes.', en: 'Regularization: penalizing large weights.' },
    },
    {
      id: 'try2',
      es: 'Tu turno: con grado diez fijo, sube lambda y mira cómo la curva se domestica y baja el error de validación.',
      en: 'Your turn: with degree ten fixed, raise lambda and watch the curve tame itself and the validation error drop.',
      gate: {
        id: 'reg',
        prompt: { es: 'Sube lambda hasta que el error de validación quede cerca del mejor que viste.', en: 'Raise lambda until the validation error is close to the best you saw.' },
      },
      pad: 0.4,
    },
    {
      id: 'early',
      es: 'Una tercera defensa es parar a tiempo. Al entrenar con descenso del gradiente, el error de validación llega a un mínimo y luego sube, mientras el de entrenamiento sigue bajando. Se conserva el modelo de ese mínimo.',
      en: 'A third defense is to stop in time. When training with gradient descent, validation error reaches a minimum and then rises, while training error keeps falling. The model from that minimum is kept.',
      note: { es: 'Parada temprana: quedarse con el mínimo de validación.', en: 'Early stopping: keep the validation minimum.' },
      pad: 0.5,
    },
    {
      id: 'metric',
      es: 'Medir bien también es elegir bien la métrica. Imagina una prueba para una enfermedad que afecta a una persona de cada cien.',
      en: 'Measuring well also means choosing the right metric. Imagine a test for a disease that affects one person in a hundred.',
    },
    {
      id: 'trap',
      es: 'Un clasificador que siempre responde «sano» acierta el noventa y nueve por ciento. Su exactitud es altísima y no detecta a nadie.',
      en: 'A classifier that always answers “healthy” is right ninety-nine percent of the time. Its accuracy is sky-high and it detects no one.',
      note: { es: 'Exactitud alta no es lo mismo que servir.', en: 'High accuracy is not the same as being useful.' },
      pad: 0.4,
    },
    {
      id: 'confusion',
      es: 'Para ver el cuadro completo se usa la matriz de confusión: los aciertos y los errores de cada tipo. Verdaderos positivos, falsos positivos, falsos negativos y verdaderos negativos.',
      en: 'To see the whole picture we use the confusion matrix: hits and mistakes of each kind. True positives, false positives, false negatives, and true negatives.',
      pad: 0.5,
    },
    {
      id: 'pr',
      es: 'De ahí salen dos medidas. La precisión: de lo que marcaste como positivo, cuánto era cierto. La exhaustividad, o recall: de todos los positivos reales, cuántos encontraste.',
      en: 'Two measures come from it. Precision: of what you flagged as positive, how much was true. Recall: of all the real positives, how many you found.',
      note: { es: 'Precisión: de lo marcado, ¿cuánto era cierto? Recall: de lo real, ¿cuánto encontré?', en: 'Precision: of what I flagged, how much was true? Recall: of what is real, how much did I find?' },
      pad: 0.4,
    },
    {
      id: 'try3',
      es: 'Tu turno: mueve el umbral. Busca uno que encuentre al menos el ochenta y cinco por ciento de los casos con una precisión de al menos sesenta por ciento.',
      en: 'Your turn: move the threshold. Look for one that finds at least eighty-five percent of the cases with a precision of at least sixty percent.',
      gate: {
        id: 'threshold',
        prompt: { es: 'Recall ≥ 85 % y precisión ≥ 60 % a la vez.', en: 'Recall ≥ 85% and precision ≥ 60% at the same time.' },
      },
      pad: 0.4,
    },
    {
      id: 'cost',
      es: 'No todos los errores cuestan igual. Perder un caso grave no es lo mismo que molestar a alguien con una falsa alarma. El umbral correcto es una decisión de negocio, no solo técnica.',
      en: 'Not all errors cost the same. Missing a serious case is not the same as bothering someone with a false alarm. The right threshold is a business decision, not just a technical one.',
      note: { es: 'El umbral depende del costo de cada error.', en: 'The threshold depends on the cost of each error.' },
      pad: 0.5,
    },
    {
      id: 'base',
      es: 'Y hay una trampa más: la tasa base. Con una enfermedad rara, incluso una prueba bastante buena puede dar más falsas alarmas que aciertos.',
      en: 'And there is one more trap: the base rate. With a rare disease, even a fairly good test can give more false alarms than hits.',
    },
    {
      id: 'base2',
      es: 'Imagina dos mil personas, veinte enfermas, y una prueba que acierta el noventa y cinco por ciento en sanos y en enfermos. Detecta a diecinueve enfermos, pero marca por error a noventa y nueve sanos: solo alrededor de uno de cada seis positivos está realmente enfermo.',
      en: 'Imagine two thousand people, twenty sick, and a test that is right ninety-five percent of the time for both healthy and sick people. It detects nineteen sick people, but wrongly flags ninety-nine healthy ones: only about one in six positives is truly sick.',
      note: { es: 'Tasa base baja: muchas falsas alarmas.', en: 'Low base rate: many false alarms.' },
      pad: 0.6,
    },
    {
      id: 'recap',
      es: 'En resumen: mide con datos que el modelo no vio, vigila la brecha entre entrenamiento y validación, elige la métrica según el costo de cada error y no olvides la tasa base.',
      en: 'In short: measure with data the model has not seen, watch the gap between training and validation, choose the metric by the cost of each error, and do not forget the base rate.',
    },
    {
      id: 'bridge',
      es: 'Con esas bases podemos mirar redes especializadas. Empezamos por la visión: cómo una red aprende a ver bordes, formas y objetos.',
      en: 'With those foundations we can look at specialized networks. We start with vision: how a network learns to see edges, shapes, and objects.',
    },
  ],

  keyIdeas: {
    es: [
      'Bajar el error de entrenamiento no basta: lo que importa es el error con datos que el modelo no vio.',
      'Subajuste = modelo demasiado simple; sobreajuste = aprende el ruido. Una brecha grande entre error de entrenamiento y de validación es la señal.',
      'Entrenamiento para aprender, validación para elegir, prueba para informar (una sola vez). Si el examen se filtra al entrenamiento, hay fuga de datos.',
      'Se frena el sobreajuste con más datos, modelos más simples, regularización y parada temprana.',
      'La exactitud engaña con clases desbalanceadas: mira precisión, exhaustividad y la matriz de confusión, y recuerda que la tasa base manda.',
    ],
    en: [
      'Lowering training error is not enough: what matters is error on data the model has not seen.',
      'Underfitting = the model is too simple; overfitting = it learns the noise. A large gap between training and validation error is the signal.',
      'Train to learn, validate to choose, test to report (only once). If the exam leaks into training, that is data leakage.',
      'Overfitting is curbed with more data, simpler models, regularization, and early stopping.',
      'Accuracy misleads with imbalanced classes: look at precision, recall, and the confusion matrix, and remember the base rate rules.',
    ],
  },

  misconception: {
    wrong: {
      es: '«El modelo acierta el 99 % en las pruebas, así que funciona muy bien».',
      en: '“The model is 99% accurate in tests, so it works very well.”',
    },
    right: {
      es: 'Depende de con qué datos se midió y de la tasa base. Con datos que el modelo ya vio, la cifra no dice nada de lo nuevo; y con eventos raros, un 99 % puede ser inútil.',
      en: 'It depends on which data it was measured on and on the base rate. On data the model already saw, the number says nothing about new cases; and with rare events, 99% can be useless.',
    },
  },

  deeper: {
    es: `## Sesgo, varianza y ruido

Para un modelo $\\hat f$ entrenado con un conjunto aleatorio, el error esperado en un punto nuevo se descompone en

$$\\mathbb{E}\\big[(y-\\hat f(x))^2\\big] = \\underbrace{\\big(\\mathbb{E}[\\hat f(x)]-f(x)\\big)^2}_{\\text{sesgo}^2} + \\underbrace{\\mathrm{Var}\\big(\\hat f(x)\\big)}_{\\text{varianza}} + \\underbrace{\\sigma^2}_{\\text{ruido irreducible}}.$$

Es la forma estándar con error cuadrático (Hastie, Tibshirani y Friedman, ec. 7.9). El subajuste es sesgo alto (modelo demasiado rígido); el sobreajuste es varianza alta (el modelo cambia mucho con cada muestra). En la lección el ruido es $\\sigma = 0.2$: en promedio, ningún modelo puede bajar de ese error en datos nuevos (en una muestra concreta de 80 puntos puede quedar un poco por encima o por debajo), y el mejor grado (4) llega a $\\approx 0.22$ en la validación de la escena.

Esto se comprobó simulando 4 000 conjuntos de entrenamiento con la misma receta de datos (\`verify-data.ts\`): la suma $\\sigma^2+\\text{sesgo}^2+\\text{varianza}$ coincide con el error simulado en puntos nuevos. Con grado 1: sesgo² ≈ 0.066 y varianza ≈ 0.007 (el error es de sesgo). Con grado 4: 0.001 y 0.017. Con grado 10: sesgo² ≈ 0 y varianza ≈ 1.6, sobre todo hacia los extremos del intervalo (el error es de varianza). Con grado 10 y $\\lambda = 0.03$: 0.005 y 0.018; la regularización cambia varianza por un poco de sesgo.

## Regularización ridge

El ajuste polinómico con castigo $\\lambda$ a los pesos (regresión *ridge*, o decaimiento de pesos, *weight decay*) minimiza $\\lVert y - Xw\\rVert^2 + \\lambda \\lVert w\\rVert^2$, con solución cerrada

$$\\hat w = (X^\\top X + \\lambda I)^{-1} X^\\top y.$$

Con $\\lambda = 0$ se recupera el ajuste libre; al subir $\\lambda$ los pesos se encogen y la curva se suaviza (en la escena, la norma de los pesos de grado 10 baja de ≈ 327 con $\\lambda = 0$ a ≈ 0.19 con $\\lambda = 10$). Dos precisiones. El término constante no se penaliza (como en la escena y en scikit-learn; Hastie et al., §3.4.1), y las entradas conviene normalizarlas antes (la escena pasa $x\\in[0,1]$ a $[-1,1]$). Y con $\\lambda$ demasiado grande el modelo vuelve a subajustar: con grado 10, el error de validación de la escena baja hasta $\\lambda \\approx 0.02$ (≈ 0.24) y luego sube (≈ 0.44 con $\\lambda = 10$, peor que la recta).

La parada temprana del descenso del gradiente actúa de forma parecida a una regularización: detener antes limita cuánto crecen los pesos. Para un modelo lineal con error cuadrático y descenso del gradiente simple equivale, con una aproximación cuadrática, a una regularización $L^2$ (Goodfellow, Bengio y Courville, §7.8). Otras defensas: más datos (reales o aumentados, §7.4) y, en redes neuronales, el *dropout*: apagar unidades al azar durante el entrenamiento (Srivastava et al., 2014).

## Métricas de clasificación

Con verdaderos positivos $TP$, falsos positivos $FP$, falsos negativos $FN$ y verdaderos negativos $TN$:

$$\\text{exactitud}=\\frac{TP+TN}{TP+FP+FN+TN},\\quad \\text{precisión}=\\frac{TP}{TP+FP},\\quad \\text{recall}=\\frac{TP}{TP+FN},\\quad F_1=\\frac{2\\,P\\,R}{P+R}.$$

Si no se marca a nadie ($TP+FP=0$) la precisión es $0/0$: por convención (la de la escena) se toma 1, de modo que un detector que dice «sano» siempre tiene precisión perfecta y recall 0, y por eso hay que mirar las dos (Goodfellow et al., §11.1). El $F_1$ es la media armónica de precisión y recall.

## El umbral y los costos

Si un falso negativo cuesta $c_{FN}$ y un falso positivo $c_{FP}$ (los aciertos no cuestan), la decisión de menor costo esperado es marcar «positivo» cuando

$$P(\\text{enfermo}\\mid \\text{puntuación}) \\ge \\frac{c_{FP}}{c_{FP}+c_{FN}}\\qquad\\text{(Elkan, 2001)}.$$

Con costos iguales el corte de probabilidad es 0.5; si perder un caso cuesta 10 veces más, baja a $1/11\\approx 0.09$. En la escena (dos campanas y 10 % de enfermas) eso da los umbrales de puntuación óptimos 2.23 (costos iguales), 1.46 (perder un caso cuesta 10) y 3.00 (la falsa alarma cuesta 10).

## La tasa base (teorema de Bayes)

Con prevalencia $p$, sensibilidad $s$ (= recall) y especificidad $c$, la probabilidad de estar enfermo dado un positivo es

$$P(\\text{enfermo}\\mid +)=\\frac{s\\,p}{s\\,p+(1-c)(1-p)}.$$

Con $p=0.01$ y $s=c=0.95$: $\\dfrac{0.0095}{0.0095+0.0495}\\approx 0.16$, el «uno de cada seis» de la lección. Con $s=c=0.95$ hay más falsas alarmas que aciertos mientras la prevalencia sea menor que 5 %.

Presentar el cálculo en frecuencias («de 2 000 personas, 20 enfermas, 19 detectadas…») en lugar de probabilidades ayuda a razonar: Gigerenzer y Hoffrage (1995) muestran que los algoritmos bayesianos son computacionalmente más simples en ese formato y que, con él, personas sin formación estadística siguieron algoritmos bayesianos hasta en el 50 % de sus inferencias. Es el formato que usa la lección.

## En código

\`\`\`python
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge

f = lambda x: 0.6 * np.sin(2 * np.pi * x) + 0.2          # la señal verdadera
rng = np.random.default_rng(0)
x_tr = ((np.arange(12) + 0.5) / 12)[:, None]              # 12 mediciones repartidas en [0, 1]
y_tr = f(x_tr[:, 0]) + 0.2 * rng.normal(size=12)
x_va = rng.uniform(0, 1, 80)[:, None]                     # 80 mediciones nuevas
y_va = f(x_va[:, 0]) + 0.2 * rng.normal(size=80)

for grado in (1, 4, 10):
    for lam in (1e-9, 3e-2):                              # 1e-9 hace de λ = 0
        m = make_pipeline(PolynomialFeatures(grado, include_bias=False), Ridge(alpha=lam)).fit(2 * x_tr - 1, y_tr)
        rmse = lambda a, b: float(np.sqrt(np.mean((m.predict(2 * a - 1) - b) ** 2)))
        print(grado, lam, round(rmse(x_tr, y_tr), 3), round(rmse(x_va, y_va), 3))   # entrenamiento y validación

# Con esa semilla: grado 1 → 0.302 y 0.339 (subajuste); grado 4 → 0.093 y 0.221 (mejor validación);
# grado 10 → 0.006 y 0.251 con λ ≈ 0 (sobreajuste) y 0.103 y 0.237 con λ = 0.03.
# Son datos nuevos con la misma receta que la escena: no repiten sus números exactos.

def ppv(prev, sens, spec):          # valor predictivo positivo
    tp, fp = prev * sens, (1 - prev) * (1 - spec)
    return tp / (tp + fp)

print(round(ppv(0.01, 0.95, 0.95), 3))   # 0.161
\`\`\`

## Lo que viene

Para imágenes, una red totalmente conectada no escala. La lección 11 muestra la idea de las convoluciones. La lección 34 retoma la evaluación para sistemas de IA generativa, donde medir bien es más difícil.`,
    en: `## Bias, variance, and noise

For a model $\\hat f$ trained on a random set, the expected error at a new point decomposes into

$$\\mathbb{E}\\big[(y-\\hat f(x))^2\\big] = \\underbrace{\\big(\\mathbb{E}[\\hat f(x)]-f(x)\\big)^2}_{\\text{bias}^2} + \\underbrace{\\mathrm{Var}\\big(\\hat f(x)\\big)}_{\\text{variance}} + \\underbrace{\\sigma^2}_{\\text{irreducible noise}}.$$

This is the standard form for squared error (Hastie, Tibshirani, and Friedman, eq. 7.9). Underfitting is high bias (a model that is too rigid); overfitting is high variance (the model changes a lot with each sample). In the lesson the noise is $\\sigma = 0.2$: on average, no model can go below that error on new data (on one particular 80-point sample it can land a little above or below), and the best degree (4) reaches $\\approx 0.22$ on the scene's validation set.

This was checked by simulating 4,000 training sets with the same data recipe (\`verify-data.ts\`): the sum $\\sigma^2+\\text{bias}^2+\\text{variance}$ matches the simulated error at new points. With degree 1: bias² ≈ 0.066 and variance ≈ 0.007 (the error is bias). With degree 4: 0.001 and 0.017. With degree 10: bias² ≈ 0 and variance ≈ 1.6, mostly toward the ends of the interval (the error is variance). With degree 10 and $\\lambda = 0.03$: 0.005 and 0.018; regularization trades variance for a little bias.

## Ridge regularization

Polynomial fitting with a penalty $\\lambda$ on the weights minimizes $\\lVert y - Xw\\rVert^2 + \\lambda \\lVert w\\rVert^2$, with closed-form solution

$$\\hat w = (X^\\top X + \\lambda I)^{-1} X^\\top y.$$

With $\\lambda = 0$ you recover the free fit; as $\\lambda$ grows the weights shrink and the curve smooths out (in the scene, the norm of the degree-10 weights drops from ≈ 327 at $\\lambda = 0$ to ≈ 0.19 at $\\lambda = 10$). Two caveats. The constant term is not penalized (as in the scene and in scikit-learn; Hastie et al., §3.4.1), and inputs should be normalized first (the scene maps $x\\in[0,1]$ to $[-1,1]$). And with $\\lambda$ too large the model underfits again: at degree 10, the scene's validation error falls until $\\lambda \\approx 0.02$ (≈ 0.24) and then rises (≈ 0.44 at $\\lambda = 10$, worse than the line).

Early stopping in gradient descent acts similarly to regularization: stopping earlier limits how large the weights can grow. For a linear model with squared error and plain gradient descent it is equivalent, under a quadratic approximation, to $L^2$ regularization (Goodfellow, Bengio, and Courville, §7.8). Other defenses: more data (real or augmented, §7.4) and, in neural networks, *dropout*: randomly switching off units during training (Srivastava et al., 2014).

## Classification metrics

With true positives $TP$, false positives $FP$, false negatives $FN$, and true negatives $TN$:

$$\\text{accuracy}=\\frac{TP+TN}{TP+FP+FN+TN},\\quad \\text{precision}=\\frac{TP}{TP+FP},\\quad \\text{recall}=\\frac{TP}{TP+FN},\\quad F_1=\\frac{2\\,P\\,R}{P+R}.$$

If nobody is flagged ($TP+FP=0$) precision is $0/0$: by convention (the scene’s) it is taken as 1, so a detector that always says “healthy” has perfect precision and recall 0, which is why you have to look at both (Goodfellow et al., §11.1). $F_1$ is the harmonic mean of precision and recall.

## The threshold and the costs

If a false negative costs $c_{FN}$ and a false positive costs $c_{FP}$ (hits cost nothing), the lowest-expected-cost decision is to flag “positive” when

$$P(\\text{sick}\\mid \\text{score}) \\ge \\frac{c_{FP}}{c_{FP}+c_{FN}}\\qquad\\text{(Elkan, 2001)}.$$

With equal costs the probability cutoff is 0.5; if missing a case costs 10 times more, it drops to $1/11\\approx 0.09$. In the scene (two bell curves and 10% sick) that gives the optimal score thresholds 2.23 (equal costs), 1.46 (missing a case costs 10), and 3.00 (a false alarm costs 10).

## The base rate (Bayes’ theorem)

With prevalence $p$, sensitivity $s$ (= recall), and specificity $c$, the probability of being sick given a positive result is

$$P(\\text{sick}\\mid +)=\\frac{s\\,p}{s\\,p+(1-c)(1-p)}.$$

With $p=0.01$ and $s=c=0.95$: $\\dfrac{0.0095}{0.0095+0.0495}\\approx 0.16$, the “one in six” of the lesson. With $s=c=0.95$ there are more false alarms than hits as long as the prevalence is below 5%.

Presenting the calculation in frequencies (“out of 2,000 people, 20 sick, 19 detected…”) instead of probabilities helps reasoning: Gigerenzer and Hoffrage (1995) show that Bayesian algorithms are computationally simpler in that format and that, with it, people without statistical training followed Bayesian algorithms in up to 50% of their inferences. It is the format the lesson uses.

## In code

\`\`\`python
import numpy as np
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge

f = lambda x: 0.6 * np.sin(2 * np.pi * x) + 0.2          # the true signal
rng = np.random.default_rng(0)
x_tr = ((np.arange(12) + 0.5) / 12)[:, None]              # 12 measurements spread over [0, 1]
y_tr = f(x_tr[:, 0]) + 0.2 * rng.normal(size=12)
x_va = rng.uniform(0, 1, 80)[:, None]                     # 80 new measurements
y_va = f(x_va[:, 0]) + 0.2 * rng.normal(size=80)

for degree in (1, 4, 10):
    for lam in (1e-9, 3e-2):                              # 1e-9 stands in for λ = 0
        m = make_pipeline(PolynomialFeatures(degree, include_bias=False), Ridge(alpha=lam)).fit(2 * x_tr - 1, y_tr)
        rmse = lambda a, b: float(np.sqrt(np.mean((m.predict(2 * a - 1) - b) ** 2)))
        print(degree, lam, round(rmse(x_tr, y_tr), 3), round(rmse(x_va, y_va), 3))   # training and validation

# With that seed: degree 1 → 0.302 and 0.339 (underfitting); degree 4 → 0.093 and 0.221 (best validation);
# degree 10 → 0.006 and 0.251 with λ ≈ 0 (overfitting) and 0.103 and 0.237 with λ = 0.03.
# These are new data from the same recipe as the scene: they do not repeat its exact numbers.

def ppv(prev, sens, spec):          # positive predictive value
    tp, fp = prev * sens, (1 - prev) * (1 - spec)
    return tp / (tp + fp)

print(round(ppv(0.01, 0.95, 0.95), 3))   # 0.161
\`\`\`

## What comes next

For images, a fully connected network does not scale. Lesson 11 shows the idea of convolutions. Lesson 34 returns to evaluation for generative AI systems, where measuring well is harder.`,
  },

  lens: {
    es: [
      'Pide siempre que el rendimiento se reporte sobre datos que el modelo no vio, y que el equipo explique cómo evitó fugas de datos.',
      'Una sola cifra de exactitud no basta: pide precisión y exhaustividad, y la matriz de confusión con los costos reales de cada tipo de error.',
      'Con eventos raros (fraude, fallas, enfermedades) manda la tasa base: calcula cuántas falsas alarmas puede absorber tu operación antes de aprobar un sistema.',
      'El umbral de decisión es una palanca de negocio: ajústalo según el costo de un falso negativo frente a un falso positivo y revísalo cuando cambie el entorno.',
    ],
    en: [
      'Always ask for performance to be reported on data the model has not seen, and for the team to explain how it avoided data leakage.',
      'A single accuracy number is not enough: ask for precision and recall, and the confusion matrix with the real cost of each type of error.',
      'With rare events (fraud, failures, disease) the base rate rules: work out how many false alarms your operation can absorb before approving a system.',
      'The decision threshold is a business lever: adjust it to the cost of a false negative versus a false positive and revisit it when the environment changes.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Un modelo tiene error de entrenamiento muy bajo y error de validación alto. ¿Qué indica?', en: 'A model has very low training error and high validation error. What does it indicate?' },
      options: [
        { es: 'Subajuste: el modelo es demasiado simple.', en: 'Underfitting: the model is too simple.' },
        { es: 'Que los datos de validación están mal etiquetados.', en: 'That the validation data is mislabeled.' },
        { es: 'Sobreajuste: aprendió el ruido del entrenamiento.', en: 'Overfitting: it learned the noise in training.' },
        { es: 'Que el modelo está listo para producción.', en: 'That the model is ready for production.' },
      ],
      answer: 2,
      why: { es: 'Una brecha grande entre el error de entrenamiento (bajo) y el de validación (alto) es la firma del sobreajuste.', en: 'A large gap between training error (low) and validation error (high) is the signature of overfitting.' },
    },
    {
      kind: 'concept',
      q: { es: '¿Para qué sirve el conjunto de prueba?', en: 'What is the test set for?' },
      options: [
        { es: 'Para informar el rendimiento final, usándolo una sola vez.', en: 'To report the final performance, using it only once.' },
        { es: 'Para elegir el mejor grado o los mejores hiperparámetros.', en: 'To choose the best degree or hyperparameters.' },
        { es: 'Para entrenar más rápido.', en: 'To train faster.' },
        { es: 'Para aumentar los datos de entrenamiento.', en: 'To increase the training data.' },
      ],
      answer: 0,
      why: { es: 'Elegir con el conjunto de prueba lo contamina: dejaría de ser un examen con datos nuevos. Para elegir se usa validación.', en: 'Choosing with the test set contaminates it: it would stop being an exam with new data. Validation is for choosing.' },
    },
    {
      kind: 'calc',
      q: { es: 'Una enfermedad afecta al 1 % de la población. Una prueba tiene 90 % de sensibilidad y 90 % de especificidad. Entre quienes dan positivo, ¿qué fracción está realmente enferma?', en: 'A disease affects 1% of the population. A test has 90% sensitivity and 90% specificity. Among those who test positive, what fraction is truly sick?' },
      options: [
        { es: 'Alrededor del 90 %', en: 'About 90%' },
        { es: 'Alrededor del 50 %', en: 'About 50%' },
        { es: 'Alrededor del 8 %', en: 'About 8%' },
        { es: 'Alrededor del 99 %', en: 'About 99%' },
      ],
      answer: 2,
      why: { es: 'De 1000 personas: 10 enfermas → 9 positivos verdaderos; 990 sanas → 99 falsos positivos. Precisión = 9 / (9 + 99) ≈ 8 %.', en: 'Of 1,000 people: 10 sick → 9 true positives; 990 healthy → 99 false positives. Precision = 9 / (9 + 99) ≈ 8%.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor presume «98 % de exactitud» en detección de fraude, donde el fraude es el 1 % de las transacciones. ¿Qué haces?', en: 'A vendor boasts “98% accuracy” in fraud detection, where fraud is 1% of transactions. What do you do?' },
      options: [
        { es: 'Lo apruebas: 98 % es casi perfecto.', en: 'You approve it: 98% is almost perfect.' },
        { es: 'Pides que lo prueben con más GPUs.', en: 'You ask them to test it with more GPUs.' },
        { es: 'Exiges que suba la exactitud al 100 %.', en: 'You demand that accuracy go up to 100%.' },
        { es: 'Pides recall, precisión y la matriz de confusión sobre datos nuevos, con tus costos de falsa alarma y de fraude no detectado.', en: 'You ask for recall, precision, and the confusion matrix on new data, with your costs of a false alarm and of undetected fraud.' },
      ],
      answer: 3,
      why: { es: 'Con 1 % de fraude, un sistema que nunca detecta nada ya tendría 99 % de exactitud. Lo que importa es cuánto fraude encuentra, cuántas falsas alarmas genera y qué cuesta cada error.', en: 'With 1% fraud, a system that never detects anything would already have 99% accuracy. What matters is how much fraud it finds, how many false alarms it generates, and what each error costs.' },
    },
  ],

  glossary: ['overfitting', 'underfitting', 'validation-set', 'test-set', 'data-leakage', 'regularization', 'precision', 'recall', 'confusion-matrix', 'base-rate'],

  terms: [
    { id: 'overfitting', term: { es: 'Sobreajuste', en: 'Overfitting' }, def: { es: 'Cuando un modelo aprende el ruido de sus datos de entrenamiento y por eso falla con datos nuevos. Se detecta con una brecha grande entre error de entrenamiento y de validación.', en: 'When a model learns the noise in its training data and therefore fails on new data. It shows as a large gap between training and validation error.' } },
    { id: 'underfitting', term: { es: 'Subajuste', en: 'Underfitting' }, def: { es: 'Cuando un modelo es demasiado simple para captar la señal: falla incluso con los datos de entrenamiento.', en: 'When a model is too simple to capture the signal: it fails even on the training data.' } },
    { id: 'validation-set', term: { es: 'Conjunto de validación', en: 'Validation set' }, def: { es: 'Datos que el modelo no usa para ajustarse y que sirven para elegir entre modelos o hiperparámetros.', en: 'Data the model does not use to fit itself, used to choose between models or hyperparameters.' } },
    { id: 'test-set', term: { es: 'Conjunto de prueba', en: 'Test set' }, def: { es: 'Datos reservados que se usan una sola vez al final para informar el rendimiento esperado con casos nuevos.', en: 'Held-out data used once at the end to report the expected performance on new cases.' } },
    { id: 'data-leakage', term: { es: 'Fuga de datos', en: 'Data leakage' }, def: { es: 'Información de los datos de evaluación que se cuela en el entrenamiento, inflando el resultado medido.', en: 'Information from the evaluation data that slips into training, inflating the measured result.' } },
    { id: 'regularization', term: { es: 'Regularización', en: 'Regularization' }, def: { es: 'Cualquier cambio en el aprendizaje pensado para reducir el error con datos nuevos, aunque no baje el de entrenamiento. La más simple penaliza la complejidad del modelo (por ejemplo, los pesos grandes); la parada temprana y el dropout son otras formas.', en: 'Any change to learning meant to reduce the error on new data, even if it does not lower the training error. The simplest penalizes model complexity (for example, large weights); early stopping and dropout are other forms.' } },
    { id: 'precision', term: { es: 'Precisión', en: 'Precision' }, def: { es: 'De todo lo que el modelo marcó como positivo, la fracción que realmente lo era: TP / (TP + FP).', en: 'Of everything the model flagged as positive, the fraction that really was: TP / (TP + FP).' } },
    { id: 'recall', term: { es: 'Exhaustividad (recall)', en: 'Recall' }, def: { es: 'De todos los positivos reales, la fracción que el modelo encontró: TP / (TP + FN).', en: 'Of all real positives, the fraction the model found: TP / (TP + FN).' } },
    { id: 'confusion-matrix', term: { es: 'Matriz de confusión', en: 'Confusion matrix' }, def: { es: 'Tabla con los aciertos y errores de cada tipo: verdaderos y falsos positivos, verdaderos y falsos negativos.', en: 'A table with the hits and mistakes of each kind: true and false positives, true and false negatives.' } },
    { id: 'base-rate', term: { es: 'Tasa base', en: 'Base rate' }, def: { es: 'La frecuencia real de un evento en la población (por ejemplo, el 1 % de transacciones fraudulentas). Condiciona cuántas falsas alarmas genera un detector.', en: 'The actual frequency of an event in the population (for example, 1% of transactions being fraud). It conditions how many false alarms a detector generates.' } },
  ],

  sources: [
    { title: 'The Elements of Statistical Learning (2.ª ed.), cap. 3 (§3.4.1, regresión ridge) y cap. 7 (§7.1–7.3: reparto en entrenamiento, validación y prueba; sesgo y varianza)', authors: 'Hastie, T., Tibshirani, R., Friedman, J.', year: 2009, url: 'https://web.stanford.edu/~hastie/ElemStatLearn/' },
    { title: 'Deep Learning, cap. 5 (§5.2 capacidad, sobreajuste y subajuste; §5.3 conjuntos de validación)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/ml.html' },
    { title: 'Deep Learning, cap. 7 (§7.1.1 decaimiento de pesos, §7.4 aumento de datos, §7.8 parada temprana, §7.12 dropout)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/regularization.html' },
    { title: 'Deep Learning, cap. 11 (§11.1 métricas de rendimiento: precisión, recall, F)', authors: 'Goodfellow, I., Bengio, Y., Courville, A.', year: 2016, url: 'https://www.deeplearningbook.org/contents/guidelines.html' },
    { title: 'Leakage and the reproducibility crisis in machine-learning-based science (Patterns 4(9), 100804)', authors: 'Kapoor, S., Narayanan, A.', year: 2023, url: 'https://doi.org/10.1016/j.patter.2023.100804' },
    { title: 'Dropout: A Simple Way to Prevent Neural Networks from Overfitting (JMLR 15, 1929–1958)', authors: 'Srivastava, N., Hinton, G., Krizhevsky, A., Sutskever, I., Salakhutdinov, R.', year: 2014, url: 'https://jmlr.org/papers/v15/srivastava14a.html' },
    { title: 'The Foundations of Cost-Sensitive Learning (IJCAI 2001)', authors: 'Elkan, C.', year: 2001, url: 'https://cseweb.ucsd.edu/~elkan/rescale.pdf' },
    { title: 'How to improve Bayesian reasoning without instruction: Frequency formats (Psychological Review 102(4), 684–704)', authors: 'Gigerenzer, G., Hoffrage, U.', year: 1995, url: 'https://doi.org/10.1037/0033-295X.102.4.684' },
  ],
});
