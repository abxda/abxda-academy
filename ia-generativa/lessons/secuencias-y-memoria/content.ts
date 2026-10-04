import { defineLesson } from '../../../../../core/define';

// Lección 12 · Secuencias y memoria. Una RNN diminuta (6 unidades, pesos al azar) leída con números reales: el estado que se arrastra,
// el empujón que se apaga (jacobiano exacto) y, después, una celda LSTM de juguete con tres compuertas que se pueden mover.
// Los números de la escena salen de model.ts; el código de «Por dentro» se ejecutó al escribirlo y su salida es la que aparece.
export default defineLesson({
  id: 'secuencias-y-memoria',

  objectives: {
    es: [
      'Explicar cómo una red recurrente lee una secuencia paso a paso y qué guarda su estado oculto.',
      'Predecir qué le pasa a la culpa del error al retroceder por muchos pasos, y por qué se apaga o se vuelve errática.',
      'Describir qué hacen las compuertas de una LSTM (olvidar, escribir, leer) y qué límites siguen en pie.',
    ],
    en: [
      'Explain how a recurrent network reads a sequence step by step and what its hidden state holds.',
      'Predict what happens to the blame for the error when it travels back through many steps, and why it fades or turns erratic.',
      'Describe what the gates of an LSTM do (forget, write, read) and which limits still stand.',
    ],
  },

  segments: [
    {
      id: 'hook',
      es: 'Mira esta frase: «Las flores que compré en el mercado están marchitas». Para acertar con «están» y no «está», hay que recordar «flores», que quedó seis palabras atrás.',
      en: 'Look at this sentence: “The flowers I bought at the market are wilted.” To get “are” and not “is,” you have to remember “flowers,” which is six words back.',
    },
    {
      id: 'order',
      es: 'En una secuencia el orden importa: «el perro mordió al niño» no dice lo mismo que «el niño mordió al perro». Las mismas palabras, otro sentido.',
      en: 'In a sequence, order matters: “the dog bit the boy” does not say the same as “the boy bit the dog.” Same words, different meaning.',
      note: { es: 'Secuencia: datos donde el orden cambia el significado.', en: 'Sequence: data where order changes the meaning.' },
      pad: 0.3,
    },
    {
      id: 'uses',
      es: 'Texto, audio, lecturas de un sensor: todo lo que llega en orden y con largo variable es una secuencia, y los modelos que lo procesan son modelos de secuencia.',
      en: 'Text, audio, sensor readings: anything that arrives in order and with variable length is a sequence, and the models that process it are sequence models.',
      pad: 0.3,
    },
    {
      id: 'reader',
      es: 'Las redes que conocemos piden entradas de tamaño fijo. Para una frase de cualquier largo, la leemos palabra por palabra, con una misma celda.',
      en: 'The networks we know take inputs of a fixed size. For a sentence of any length, we read it word by word, with one and the same cell.',
      pad: 0.3,
    },
    {
      id: 'state',
      es: 'Entre palabra y palabra la celda lleva una memoria: un vector de números, el estado oculto. Aquí son seis, empiezan en cero y se reescriben en cada paso, con pesos al azar, sin entrenar.',
      en: 'Between one word and the next, the cell carries a memory: a vector of numbers, the hidden state. Here there are six; they start at zero and get rewritten at every step, using random, untrained weights.',
      note: { es: 'Estado oculto: la memoria de la red, un vector que se reescribe en cada paso.', en: 'Hidden state: the network’s memory, a vector rewritten at every step.' },
      pad: 0.3,
    },
    {
      id: 'recipe',
      es: 'La regla no cambia: el estado nuevo sale de la palabra actual y del estado anterior. Se combinan con pesos y una tanh los aprieta entre menos uno y uno.',
      en: 'The rule never changes: the new state comes from the current word and the previous state. They are combined with weights, and a tanh squeezes them between minus one and one.',
      tts: {
        es: 'La regla no cambia: el estado nuevo sale de la palabra actual y del estado anterior. Se combinan con pesos y una tangente hiperbólica los aprieta entre menos uno y uno.',
        en: 'The rule never changes: the new state comes from the current word and the previous state. They are combined with weights, and a hyperbolic tangent squeezes them between minus one and one.',
      },
      pad: 0.3,
    },
    {
      id: 'loop',
      es: 'Dibujada así, la celda tiene un lazo: su salida vuelve a entrar en el paso siguiente. Es una red recurrente, o RNN; Elman usó una en 1990 para predecir la siguiente palabra.',
      en: 'Drawn this way, the cell has a loop: its output feeds back in at the next step. That is a recurrent network, or RNN; Elman used one in 1990 to predict the next word.',
      tts: {
        es: 'Dibujada así, la celda tiene un lazo: su salida vuelve a entrar en el paso siguiente. Es una red recurrente, o erre ene ene; Elman usó una en mil novecientos noventa para predecir la siguiente palabra.',
        en: 'Drawn this way, the cell has a loop: its output feeds back in at the next step. That is a recurrent network, or R N N; Elman used one in nineteen ninety to predict the next word.',
      },
      pad: 0.3,
    },
    {
      id: 'unroll',
      es: 'Si desenrollamos el lazo en el tiempo, queda una cadena de copias de la misma celda, con los mismos pesos en cada paso. Como el kernel recorría la imagen, la celda recorre la frase.',
      en: 'Unrolled in time, the loop becomes a chain of copies of the same cell, with the same weights at every step. Like the kernel sweeping an image, the cell sweeps the sentence.',
      note: { es: 'RNN: la misma celda en cada paso, pasándose un estado.', en: 'RNN: the same cell at every step, passing a state along.' },
      pad: 0.4,
    },
    {
      id: 'predict',
      es: 'Tu turno: tras «flores», el estado pasa por cinco celdas más. Predice cuánto de un cambio en «flores» llega todavía al final.',
      en: 'Your turn: after “flowers,” the state passes through five more cells. Predict how much of a change in “flowers” still reaches the end.',
      gate: {
        id: 'guess',
        prompt: { es: 'Elige una opción: casi todo, cerca de la mitad o casi nada.', en: 'Pick one: almost all, about half, or almost nothing.' },
      },
      pad: 0.4,
    },
    {
      id: 'wiggle',
      es: 'Lo medimos como en la retropropagación: movemos un poco el estado en «flores» y vemos cuánto se mueve el de cada celda siguiente.',
      en: 'We measure it the way backpropagation does: nudge the state at “flowers” a little and see how far each following cell moves.',
      pad: 0.5,
    },
    {
      id: 'fade',
      es: 'Al final llega un siete por ciento. Cada paso multiplica el empujón por un número menor que uno, y cinco multiplicaciones seguidas casi lo apagan.',
      en: 'Only seven percent arrives. Each step multiplies the nudge by a number below one, and five multiplications in a row nearly wipe it out.',
      pad: 0.4,
    },
    {
      id: 'strip',
      es: 'Si repetimos el empujón en cada palabra, las últimas pesan mucho y las primeras casi nada. «Mercado», singular, pesa cien por ciento; «flores», el plural que importa, siete.',
      en: 'Repeat the nudge at every word: the last ones weigh a lot and the first ones almost nothing. “Market,” singular, counts for one hundred percent; “flowers,” the plural that matters, seven.',
      pad: 0.5,
    },
    {
      id: 'bptt',
      es: 'Entrenar es retropropagar el error, como en la lección ocho, pero a través del tiempo. La frase desenrollada es una red de siete capas con los mismos pesos.',
      en: 'Training means backpropagating the error, as in lesson eight, but through time. The unrolled sentence is a network seven layers deep, all with the same weights.',
      pad: 0.4,
    },
    {
      id: 'vanish',
      es: 'Y ahí está el problema: la culpa del error final viaja hacia atrás por esas mismas multiplicaciones y llega apagada a las palabras tempranas. Es el gradiente que se desvanece.',
      en: 'And there lies the problem: the blame for the final error travels backward through those same multiplications and reaches the early words nearly extinguished. This is the vanishing gradient.',
      note: { es: 'Gradiente que se desvanece: la culpa se apaga al retroceder por muchos pasos.', en: 'Vanishing gradient: the blame fades as it travels back through many steps.' },
      pad: 0.5,
    },
    {
      id: 'regimes',
      es: 'Hochreiter lo analizó en 1991: la culpa cambia de forma exponencial con el tamaño de los pesos. Pesos pequeños la apagan; pesos grandes la disparan o la vuelven errática, y saturan el estado.',
      en: 'Hochreiter analyzed it in 1991: the blame changes exponentially with the size of the weights. Small weights extinguish it; large weights make it blow up or turn erratic, and they saturate the state.',
      tts: {
        es: 'Hochreiter lo analizó en mil novecientos noventa y uno: la culpa cambia de forma exponencial con el tamaño de los pesos. Pesos pequeños la apagan; pesos grandes la disparan o la vuelven errática, y saturan el estado.',
        en: 'Hochreiter analyzed it in nineteen ninety-one: the blame changes exponentially with the size of the weights. Small weights extinguish it; large weights make it blow up or turn erratic, and they saturate the state.',
      },
      pad: 0.5,
    },
    {
      id: 'try-g',
      es: 'Tu turno: sube el tamaño de los pesos recurrentes e intenta que, a diez pasos de distancia, todavía llegue la mitad de la culpa. Fíjate en lo que cuesta.',
      en: 'Your turn: raise the size of the recurrent weights and try to keep half of the blame alive ten steps away. Notice what it costs.',
      gate: {
        id: 'g',
        prompt: { es: 'Mueve g hasta que la línea gruesa llegue a ×0.5 a diez pasos.', en: 'Move g until the thick line reaches ×0.5 at ten steps.' },
      },
      pad: 0.4,
    },
    {
      id: 'trade',
      es: 'Se puede, pero a un precio: una buena parte del estado se satura y la culpa varía enormemente de una frase a otra. Cambiar el tamaño de los pesos solo cambia un problema por otro.',
      en: 'You can, but at a price: a good share of the state saturates and the blame varies enormously from one sentence to the next. Resizing the weights only trades one problem for another.',
      pad: 0.4,
    },
    {
      id: 'lstm-idea',
      es: 'La falla es de diseño: la celda reescribe todo el estado en cada paso. En 1997, Hochreiter y Schmidhuber propusieron la LSTM: una cinta de memoria aparte, donde lo guardado no se reescribe.',
      en: 'The flaw is in the design: the cell rewrites the whole state at every step. In 1997, Hochreiter and Schmidhuber proposed the LSTM: a separate memory belt where stored information is not rewritten.',
      tts: {
        es: 'La falla es de diseño: la celda reescribe todo el estado en cada paso. En mil novecientos noventa y siete, Hochreiter y Schmidhuber propusieron la ele ese te eme: una cinta de memoria aparte, donde lo guardado no se reescribe.',
        en: 'The flaw is in the design: the cell rewrites the whole state at every step. In nineteen ninety-seven, Hochreiter and Schmidhuber proposed the L S T M: a separate memory belt where stored information is not rewritten.',
      },
      note: { es: 'LSTM: una cinta de memoria aparte que viaja sin reescribirse.', en: 'LSTM: a separate memory belt that travels without being rewritten.' },
      pad: 0.4,
    },
    {
      id: 'gate-forget',
      es: 'Sobre la cinta hay compuertas, valores entre cero y uno. La de olvido multiplica lo que ya hay: uno lo conserva, cero lo borra. Con cero coma seis, la pista de «flores» se apaga rápido.',
      en: 'On the belt sit gates, values between zero and one. The forget gate multiplies what is already there: one keeps it, zero erases it. At zero point six, the “flowers” cue fades fast.',
      pad: 0.5,
    },
    {
      id: 'gate-input',
      es: 'La compuerta de entrada decide cuánto de cada palabra nueva se escribe. Muy abierta, «mercado» borra la pista de plural; casi cerrada para lo que no importa, «flores» se conserva.',
      en: 'The input gate decides how much of each new word gets written. Wide open, “market” wipes out the plural cue; nearly closed for what does not matter, “flowers” survives.',
      pad: 0.5,
    },
    {
      id: 'gate-output',
      es: 'La compuerta de salida decide cuánto de la cinta se lee: es lo que la celda muestra hacia fuera como estado. Cerrada, la memoria existe, pero nadie puede consultarla.',
      en: 'The output gate decides how much of the belt is read: it is what the cell shows outward as its state. Closed, the memory exists, but nobody can consult it.',
      pad: 0.5,
    },
    {
      id: 'gate-learn',
      es: 'Las compuertas no se fijan a mano: son sigmoides que la red calcula con la palabra y el estado anterior, y que aprende con retropropagación. Por eso pueden abrirse con «flores» y cerrarse con el resto.',
      en: 'The gates are not set by hand: they are sigmoids that the network computes from the word and the previous state, and learns with backpropagation. That is how they can open for “flowers” and close for the rest.',
      note: { es: 'Compuertas: valores entre cero y uno que deciden qué olvidar, escribir y leer.', en: 'Gates: values between zero and one that decide what to forget, write, and read.' },
      pad: 0.5,
    },
    {
      id: 'gradient',
      es: 'Así se arregla lo otro: por la cinta, la culpa solo se multiplica por la compuerta de olvido. Con cero coma noventa y siete llega a «flores» casi intacta: ochenta y seis por ciento, contra siete en la RNN.',
      en: 'That is how the other problem is fixed: along the belt, the blame is only multiplied by the forget gate. At zero point nine seven it reaches “flowers” nearly intact: eighty-six percent, against seven in the RNN.',
      note: { es: 'Con la compuerta de olvido cerca de uno, la culpa llega casi intacta por la cinta.', en: 'With the forget gate near one, the blame reaches back almost intact along the belt.' },
      pad: 0.5,
    },
    {
      id: 'try-gates',
      es: 'Tu turno: mueve a mano las tres compuertas de esta celda de juguete para que, al final, recuerde «plural» y la red elija «están». Cuidado con «mercado».',
      en: 'Your turn: move by hand the three gates of this toy cell so that, at the end, it remembers “plural” and the network picks “are.” Watch out for “market.”',
      gate: {
        id: 'gates',
        prompt: { es: 'Logra una lectura final «plural» (al menos el 60 % de la ideal).', en: 'Get a final “plural” reading (at least 60% of the ideal).' },
      },
      pad: 0.4,
    },
    {
      id: 'success',
      es: 'Funcionó. En 2014, Sutskever, Vinyals y Le tradujeron del inglés al francés con una LSTM que lee la frase y la comprime en un vector, y otra que la escribe en francés.',
      en: 'It worked. In 2014, Sutskever, Vinyals, and Le translated English into French with one LSTM that reads the sentence and compresses it into a vector, and another that writes it out in French.',
      tts: {
        es: 'Funcionó. En dos mil catorce, Sutskever, Vinyals y Le tradujeron del inglés al francés con una ele ese te eme que lee la frase y la comprime en un vector, y otra que la escribe en francés.',
        en: 'It worked. In twenty fourteen, Sutskever, Vinyals, and Le translated English into French with one L S T M that reads the sentence and compresses it into a vector, and another that writes it out in French.',
      },
      pad: 0.5,
    },
    {
      id: 'limit-seq',
      es: 'Aun así, tiene límites. Primero, va en fila: para calcular el paso diez hay que terminar el nueve, así que los pasos de una frase no se pueden hacer a la vez y las frases largas tardan.',
      en: 'Even so, it has limits. First, it runs in a line: step ten needs step nine finished, so the steps of a sentence cannot be done at once, and long sentences take long.',
      pad: 0.5,
    },
    {
      id: 'limit-bottleneck',
      es: 'Segundo, todo lo leído se comprime en un vector de tamaño fijo. Cho y colegas mostraron en 2014 que estos traductores empeoran con rapidez cuando la frase se alarga.',
      en: 'Second, everything read is squeezed into a vector of fixed size. Cho and colleagues showed in 2014 that these translators get worse quickly as the sentence gets longer.',
      tts: {
        es: 'Segundo, todo lo leído se comprime en un vector de tamaño fijo. Cho y colegas mostraron en dos mil catorce que estos traductores empeoran con rapidez cuando la frase se alarga.',
        en: 'Second, everything read is squeezed into a vector of fixed size. Cho and colleagues showed in twenty fourteen that these translators get worse quickly as the sentence gets longer.',
      },
      pad: 0.5,
    },
    {
      id: 'limit-short',
      es: 'Tercero, la memoria sigue siendo corta. Un estudio de 2018 con modelos de lenguaje LSTM halló que usan unas doscientas palabras de contexto, y que solo notan el orden en las últimas cincuenta.',
      en: 'Third, the memory is still short. A 2018 study of LSTM language models found that they use about two hundred words of context, and notice word order only in the last fifty.',
      tts: {
        es: 'Tercero, la memoria sigue siendo corta. Un estudio de dos mil dieciocho con modelos de lenguaje ele ese te eme halló que usan unas doscientas palabras de contexto, y que solo notan el orden en las últimas cincuenta.',
        en: 'Third, the memory is still short. A twenty eighteen study of L S T M language models found that they use about two hundred words of context, and notice word order only in the last fifty.',
      },
      note: { es: 'Límites de la LSTM: va en fila, comprime en un vector y su memoria sigue siendo corta.', en: 'LSTM limits: it runs in a line, squeezes everything into one vector, and its memory is still short.' },
      pad: 0.5,
    },
    {
      id: 'recap',
      es: 'En resumen: la RNN lleva un estado de paso en paso, pero la culpa se apaga; la LSTM lo protege con compuertas y llega más lejos, aunque va en fila y su memoria sigue siendo corta.',
      en: 'In short: an RNN carries a state from step to step, but the blame fades; the LSTM protects it with gates and reaches farther, though it runs in a line and its memory is still short.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Las redes convolucionales ya leían códigos postales en 1989 y la LSTM nació en 1997, y aun así el despegue llegó hacia 2012. ¿Qué cambió para que todo esto, por fin, funcionara a gran escala?',
      en: 'Convolutional networks were already reading zip codes in 1989 and the LSTM dates from 1997, yet the takeoff came around 2012. What changed so that all this finally worked at scale?',
      tts: {
        es: 'Las redes convolucionales ya leían códigos postales en mil novecientos ochenta y nueve y la ele ese te eme nació en mil novecientos noventa y siete, y aun así el despegue llegó hacia dos mil doce. ¿Qué cambió para que todo esto, por fin, funcionara a gran escala?',
        en: 'Convolutional networks were already reading zip codes in nineteen eighty-nine and the L S T M dates from nineteen ninety-seven, yet the takeoff came around twenty twelve. What changed so that all this finally worked at scale?',
      },
    },
  ],

  keyIdeas: {
    es: [
      'Una secuencia es un dato cuyo orden importa y cuyo largo varía. Una red recurrente la lee paso a paso con la misma celda y pasa de un paso al siguiente un estado oculto: su memoria.',
      'Desenrollada en el tiempo, una RNN es una red profunda con una capa por paso y los mismos pesos en todas. Entrenarla es retropropagar a través del tiempo.',
      'La culpa del error se multiplica por un factor en cada paso que retrocede. Con factores menores que uno se desvanece y lo lejano no se aprende; con pesos grandes se vuelve errática y el estado se satura.',
      'La LSTM agrega una cinta de memoria y tres compuertas aprendidas (olvido, entrada y salida, con valores entre cero y uno). Con la de olvido cerca de uno, la culpa viaja casi intacta por la cinta.',
      'Aun así, la LSTM va en fila (los pasos no se calculan a la vez), comprime todo en un vector de tamaño fijo y su memoria útil sigue siendo corta: esos límites motivan la atención.',
    ],
    en: [
      'A sequence is data whose order matters and whose length varies. A recurrent network reads it step by step with the same cell and passes a hidden state, its memory, from one step to the next.',
      'Unrolled in time, an RNN is a deep network with one layer per step and the same weights in all of them. Training it means backpropagating through time.',
      'The blame for the error is multiplied by a factor at every step it travels back. With factors below one it vanishes and what is far away is not learned; with large weights it turns erratic and the state saturates.',
      'The LSTM adds a memory belt and three learned gates (forget, input, and output, with values between zero and one). With the forget gate near one, the blame travels almost intact along the belt.',
      'Even so, the LSTM runs in a line (steps are not computed at once), squeezes everything into one fixed-size vector, and its useful memory is still short: those limits motivate attention.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Una red recurrente recuerda toda la frase palabra por palabra, como un cuaderno.',
      en: 'A recurrent network remembers the whole sentence word by word, like a notebook.',
    },
    right: {
      es: 'Guarda un resumen de tamaño fijo, un puñado de números que se reescribe en cada paso, y lo temprano se desvanece. La LSTM alarga esa memoria con compuertas, pero sigue siendo corta.',
      en: 'It keeps a fixed-size summary, a handful of numbers rewritten at every step, and what came early fades. The LSTM stretches that memory with gates, but it stays short.',
    },
  },

  deeper: {
    es: `## La celda recurrente

Con una entrada $x_t\\in\\mathbb{R}^{D}$ y un estado $h_{t-1}\\in\\mathbb{R}^{H}$, la RNN de Elman calcula

$$h_t=\\tanh\\!\\left(W_x\\,x_t+W_h\\,h_{t-1}+b\\right),\\qquad h_0=\\mathbf 0,$$

con $W_x\\in\\mathbb{R}^{H\\times D}$, $W_h\\in\\mathbb{R}^{H\\times H}$ y $b\\in\\mathbb{R}^{H}$. Son $H(H+D)+H$ parámetros, **los mismos en todos los pasos**: no crecen con el largo de la frase. Para predecir la palabra siguiente se agrega una capa de salida, $\\hat y_t=\\mathrm{softmax}(W_y h_t)$ (lección 19). En la lección, $H=6$, $D=4$, sin sesgo ($60$ parámetros) y con pesos al azar sin entrenar: solo se ve la mecánica.

## La culpa a través del tiempo

La pérdida total es $L=\\sum_t L_t$. La culpa que llega al estado $h_k$ desde el paso $T$ es la regla de la cadena (lección 8) aplicada a lo largo del tiempo:

$$\\frac{\\partial L_T}{\\partial h_k}=\\frac{\\partial L_T}{\\partial h_T}\\prod_{t=k+1}^{T}\\frac{\\partial h_t}{\\partial h_{t-1}},\\qquad \\frac{\\partial h_t}{\\partial h_{t-1}}=\\mathrm{diag}\\!\\left(1-h_t^{2}\\right)W_h .$$

Es un producto de $T-k$ matrices. La escena muestra el tamaño de ese producto, $\\|\\partial h_T/\\partial h_k\\|_F/\\sqrt{H}$ (la ganancia típica ante un empujón en una dirección al azar; $1$ = no se pierde nada). Como $|1-h^2|\\le 1$, si la norma de $W_h$ (su mayor valor singular) es $g<1$, el producto cae como una exponencial: $\\|\\partial h_T/\\partial h_k\\|\\le g^{\\,T-k}$. Con una sigmoide el techo de la derivada es $1/4$ y todo cae más rápido (lección 8). En general, Pascanu, Mikolov y Bengio (2013) muestran, para una no linealidad con $|\\sigma'|\\le\\gamma$ ($\\gamma=1$ para tanh, $\\tfrac14$ para sigmoide), que $\\lambda_1<1/\\gamma$ **basta** para que la contribución lejana se desvanezca y que $\\lambda_1>1/\\gamma$ es **necesario** para que explote ($\\lambda_1$: el autovalor mayor en valor absoluto de $W_h$).

Con $\\lambda_1>1/\\gamma$ no hay garantía de explosión: la tanh se satura ($1-h^2\\approx0$) y apaga unidades, como se ve en la escena, donde con pesos grandes la culpa se vuelve errática, enorme en unas frases y casi nula en otras. Dos remedios clásicos: recortar la norma del gradiente contra la explosión (Pascanu et al., 2013) y rediseñar la celda contra el desvanecimiento. Bengio, Simard y Frasconi (1994) añaden un dilema: para guardar un dato de forma estable ante el ruido hace falta que la dinámica contraiga, y eso hace que los gradientes de largo plazo se desvanezcan.

## La LSTM

Con compuertas $f_t,i_t,o_t\\in(0,1)^H$, un candidato $\\tilde c_t$ y el producto elemento a elemento $\\odot$:

$$\\begin{aligned}
f_t&=\\sigma(W_f[h_{t-1},x_t]+b_f), & i_t&=\\sigma(W_i[h_{t-1},x_t]+b_i),\\\\
o_t&=\\sigma(W_o[h_{t-1},x_t]+b_o), & \\tilde c_t&=\\tanh(W_c[h_{t-1},x_t]+b_c),\\\\
c_t&=f_t\\odot c_{t-1}+i_t\\odot\\tilde c_t, & h_t&=o_t\\odot\\tanh(c_t).
\\end{aligned}$$

La cinta $c_t$ se actualiza por **suma**, no por reescritura. A lo largo de ella, $\\partial c_t/\\partial c_{t-1}=\\mathrm{diag}(f_t)$ (más caminos indirectos por $h$), de modo que la culpa se multiplica solo por la compuerta de olvido: con $f\\approx1$ llega casi intacta, el «carrusel de error constante» del artículo de 1997. La LSTM original tenía compuertas de entrada y de salida; la de olvido la añadieron Gers, Schmidhuber y Cummins (2000). Un truco práctico: iniciar el sesgo $b_f$ cerca de $1$ para que la cinta empiece abierta (Jozefowicz et al., 2015). Una capa tiene $4H(H+D)+4H$ parámetros: cuatro veces los de la RNN. Con $H=D=1000$ son $8\\,004\\,000$. Las LSTM apiladas llegaron lejos: el sistema de traducción neuronal de Google (Wu et al., 2016) usaba ocho capas LSTM en el codificador y ocho en el decodificador, con atención y conexiones residuales.

En la lección las compuertas son números fijos y hay una sola celda: $c_t=f\\,c_{t-1}+i_t\\tanh(v_t)$, $h_t=o\\tanh(c_t)$, donde $v_t$ son pistas de número gramatical **ilustrativas** (plural para «flores», singular para «mercado») y $i_t=1$ en la palabra clave. Una red entrenada calcula $f_t$ e $i_t$ de la palabra y del estado. En 2019, Lakretz et al. hallaron que, en una LSTM entrenada como modelo de lenguaje, la información de número de largo alcance la manejan sobre todo dos «unidades de número», justo lo que hace nuestra celda de juguete.

## En código

\`\`\`python
import numpy as np

def influencia(g, pasos):
    """Cuánto de un empujón en el estado inicial sobrevive tras \`pasos\` pasos (RNN de 2 unidades con tanh)."""
    c, s = np.cos(0.8), np.sin(0.8)
    Wh = g * np.array([[c, -s], [s, c]])        # un giro de 0,8 rad, escalado por g
    x = np.array([0.5, -0.3])                   # la «palabra» que llega en cada paso
    h, P = np.zeros(2), np.eye(2)
    for _ in range(pasos):
        h = np.tanh(Wh @ h + x)
        P = ((1 - h**2)[:, None] * Wh) @ P      # P = J_t · P, con J_t = diag(1 − h²) · Wh
    return np.linalg.norm(P) / np.sqrt(2)

for g in (0.5, 0.9, 1.5, 2.0):
    print(g, [round(float(influencia(g, n)), 4) for n in (1, 5, 10, 20)])
# 0.5 [0.4266, 0.0083, 0.0001, 0.0]
# 0.9 [0.7679, 0.0989, 0.0152, 0.0004]
# 1.5 [1.2798, 0.8562, 1.218, 1.154]
# 2.0 [1.7064, 2.2703, 2.4696, 1.3574]
\`\`\`

Con $g=0{,}5$ o $0{,}9$ el empujón se apaga; con $g=2$ se amplifica; en torno a $g=1{,}5$ y con esta entrada fija hay una ventana estrecha en que se mantiene. Basta moverse un poco para salir de ella.

\`\`\`python
import math

pistas = [0, 1.2, 0.3, -0.5, 0.2, -0.1, -0.9]    # pista de número de cada palabra (ilustrativa)

def celda(f, i, o):
    c = 0.0
    for t, v in enumerate(pistas, start=1):
        entrada = 1.0 if t == 2 else i               # «flores» abre la compuerta de entrada
        c = f * c + entrada * math.tanh(v)           # la cinta: olvidar un poco, escribir un poco
    return o * math.tanh(c)                          # lo que se lee al final (positivo = plural)

print(round(celda(0.6, 0.8, 1.0), 3))    # -0.5   (la pista se pierde y gana «mercado»: singular)
print(round(celda(1.0, 0.1, 1.0), 3))    # 0.638  (plural)
print(round(0.97 ** 5, 2))                # 0.86   (culpa que llega a «flores» por la cinta)
\`\`\`

## Lo que viene

La RNN y la LSTM leen en fila y comprimen todo en un vector; la atención (lección 21) deja que cada palabra mire directamente a las demás, en paralelo. Antes, la lección 13 cuenta por qué el deep learning despegó hacia 2012: datos, GPUs y algunos trucos, entre ellos las conexiones residuales, que en profundidad cumplen un papel parecido al de la cinta de la LSTM.`,
    en: `## The recurrent cell

Given an input $x_t\\in\\mathbb{R}^{D}$ and a state $h_{t-1}\\in\\mathbb{R}^{H}$, Elman’s RNN computes

$$h_t=\\tanh\\!\\left(W_x\\,x_t+W_h\\,h_{t-1}+b\\right),\\qquad h_0=\\mathbf 0,$$

with $W_x\\in\\mathbb{R}^{H\\times D}$, $W_h\\in\\mathbb{R}^{H\\times H}$, and $b\\in\\mathbb{R}^{H}$. That is $H(H+D)+H$ parameters, **the same at every step**: they do not grow with the length of the sentence. To predict the next word, an output layer is added, $\\hat y_t=\\mathrm{softmax}(W_y h_t)$ (lesson 19). In the lesson, $H=6$, $D=4$, with no bias ($60$ parameters) and random, untrained weights: only the mechanics are on display.

## Blame through time

The total loss is $L=\\sum_t L_t$. The blame that reaches state $h_k$ from step $T$ is the chain rule (lesson 8) applied along time:

$$\\frac{\\partial L_T}{\\partial h_k}=\\frac{\\partial L_T}{\\partial h_T}\\prod_{t=k+1}^{T}\\frac{\\partial h_t}{\\partial h_{t-1}},\\qquad \\frac{\\partial h_t}{\\partial h_{t-1}}=\\mathrm{diag}\\!\\left(1-h_t^{2}\\right)W_h .$$

It is a product of $T-k$ matrices. The scene shows the size of that product, $\\|\\partial h_T/\\partial h_k\\|_F/\\sqrt{H}$ (the typical gain for a nudge in a random direction; $1$ = nothing is lost). Since $|1-h^2|\\le 1$, if the norm of $W_h$ (its largest singular value) is $g<1$, the product falls like an exponential: $\\|\\partial h_T/\\partial h_k\\|\\le g^{\\,T-k}$. With a sigmoid the ceiling of the derivative is $1/4$ and everything falls faster (lesson 8). In general, Pascanu, Mikolov, and Bengio (2013) show, for a nonlinearity with $|\\sigma'|\\le\\gamma$ ($\\gamma=1$ for tanh, $\\tfrac14$ for sigmoid), that $\\lambda_1<1/\\gamma$ is **sufficient** for the far contribution to vanish, and that $\\lambda_1>1/\\gamma$ is **necessary** for it to explode ($\\lambda_1$: the largest eigenvalue of $W_h$ in absolute value).

With $\\lambda_1>1/\\gamma$ an explosion is not guaranteed: tanh saturates ($1-h^2\\approx0$) and switches units off, as the scene shows, where with large weights the blame turns erratic, huge in some sentences and nearly zero in others. Two classic remedies: clip the gradient norm against explosion (Pascanu et al., 2013) and redesign the cell against vanishing. Bengio, Simard, and Frasconi (1994) add a dilemma: to store a datum stably against noise the dynamics must contract, and that makes long-term gradients vanish.

## The LSTM

With gates $f_t,i_t,o_t\\in(0,1)^H$, a candidate $\\tilde c_t$, and the elementwise product $\\odot$:

$$\\begin{aligned}
f_t&=\\sigma(W_f[h_{t-1},x_t]+b_f), & i_t&=\\sigma(W_i[h_{t-1},x_t]+b_i),\\\\
o_t&=\\sigma(W_o[h_{t-1},x_t]+b_o), & \\tilde c_t&=\\tanh(W_c[h_{t-1},x_t]+b_c),\\\\
c_t&=f_t\\odot c_{t-1}+i_t\\odot\\tilde c_t, & h_t&=o_t\\odot\\tanh(c_t).
\\end{aligned}$$

The belt $c_t$ is updated by **addition**, not by rewriting. Along it, $\\partial c_t/\\partial c_{t-1}=\\mathrm{diag}(f_t)$ (plus indirect paths through $h$), so the blame is multiplied only by the forget gate: with $f\\approx1$ it arrives nearly intact, the “constant error carousel” of the 1997 paper. The original LSTM had input and output gates; the forget gate was added by Gers, Schmidhuber, and Cummins (2000). A practical trick: initialize the bias $b_f$ near $1$ so the belt starts open (Jozefowicz et al., 2015). A layer has $4H(H+D)+4H$ parameters: four times those of the RNN. With $H=D=1000$ that is $8{,}004{,}000$. Stacked LSTMs went far: Google’s neural machine translation system (Wu et al., 2016) used eight LSTM layers in the encoder and eight in the decoder, with attention and residual connections.

In the lesson the gates are fixed numbers and there is a single cell: $c_t=f\\,c_{t-1}+i_t\\tanh(v_t)$, $h_t=o\\tanh(c_t)$, where $v_t$ are **illustrative** grammatical-number cues (plural for “flowers,” singular for “market”) and $i_t=1$ at the key word. A trained network computes $f_t$ and $i_t$ from the word and the state. In 2019, Lakretz et al. found that, in an LSTM trained as a language model, long-distance number information is largely managed by two “number units,” just what our toy cell does.

## In code

\`\`\`python
import numpy as np

def influence(g, steps):
    """How much of a nudge to the initial state survives after \`steps\` steps (2-unit RNN with tanh)."""
    c, s = np.cos(0.8), np.sin(0.8)
    Wh = g * np.array([[c, -s], [s, c]])        # a 0.8 rad rotation, scaled by g
    x = np.array([0.5, -0.3])                   # the “word” that arrives at every step
    h, P = np.zeros(2), np.eye(2)
    for _ in range(steps):
        h = np.tanh(Wh @ h + x)
        P = ((1 - h**2)[:, None] * Wh) @ P      # P = J_t · P, with J_t = diag(1 − h²) · Wh
    return np.linalg.norm(P) / np.sqrt(2)

for g in (0.5, 0.9, 1.5, 2.0):
    print(g, [round(float(influence(g, n)), 4) for n in (1, 5, 10, 20)])
# 0.5 [0.4266, 0.0083, 0.0001, 0.0]
# 0.9 [0.7679, 0.0989, 0.0152, 0.0004]
# 1.5 [1.2798, 0.8562, 1.218, 1.154]
# 2.0 [1.7064, 2.2703, 2.4696, 1.3574]
\`\`\`

With $g=0.5$ or $0.9$ the nudge dies out; with $g=2$ it is amplified; around $g=1.5$ and with this fixed input there is a narrow window where it holds. A small move takes you out of it.

\`\`\`python
import math

cues = [0, 1.2, 0.3, -0.5, 0.2, -0.1, -0.9]      # number cue for each word (illustrative)

def cell(f, i, o):
    c = 0.0
    for t, v in enumerate(cues, start=1):
        gate_in = 1.0 if t == 2 else i               # “flowers” opens the input gate
        c = f * c + gate_in * math.tanh(v)           # the belt: forget a little, write a little
    return o * math.tanh(c)                          # what is read at the end (positive = plural)

print(round(cell(0.6, 0.8, 1.0), 3))    # -0.5   (the cue is lost and “market” wins: singular)
print(round(cell(1.0, 0.1, 1.0), 3))    # 0.638  (plural)
print(round(0.97 ** 5, 2))               # 0.86   (blame reaching “flowers” along the belt)
\`\`\`

## What comes next

The RNN and the LSTM read in a line and squeeze everything into one vector; attention (lesson 21) lets each word look directly at the others, in parallel. Before that, lesson 13 tells why deep learning took off around 2012: data, GPUs, and a few tricks, among them residual connections, which in depth play a role similar to the LSTM’s belt.`,
  },

  lens: {
    es: [
      'Memoria teórica no es memoria útil. Cuando un proveedor diga que su modelo «recuerda todo el contexto», pide una prueba con textos tan largos como los tuyos: en modelos de lenguaje LSTM se midió que usaban unas doscientas palabras de contexto.',
      'Lo que va en fila cuesta tiempo. Una arquitectura recurrente procesa los pasos de una secuencia uno tras otro: el tiempo de entrenamiento y de respuesta crece con el largo del texto y la GPU se aprovecha mal. Pregunta cómo escala la latencia con la longitud.',
      'Los modelos de secuencia siguen siendo razonables en problemas chicos: series de tiempo cortas, sensores, equipos con poco cómputo. Si te proponen una LSTM, pregunta por qué esa y no otra arquitectura, y con qué datos se comparó.',
      'El síntoma de una memoria corta es acertar lo reciente y fallar lo que dependía de algo lejano: concordancias, referencias, una cláusula del inicio. Diseña pruebas que pongan el dato clave lejos de la pregunta.',
    ],
    en: [
      'Theoretical memory is not useful memory. When a vendor says its model “remembers the whole context,” ask for a test with texts as long as yours: LSTM language models were measured using only about two hundred words of context.',
      'What runs in a line costs time. A recurrent architecture processes the steps of a sequence one after another: training and response time grow with the length of the text, and the GPU is poorly used. Ask how latency scales with length.',
      'Sequence models remain reasonable for small problems: short time series, sensors, low-compute devices. If someone proposes an LSTM, ask why that one and not another architecture, and what data it was compared on.',
      'The symptom of a short memory is getting the recent right and missing what depended on something far away: agreement, references, a clause from the beginning. Design tests that put the key fact far from the question.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Una red recurrente lee una frase palabra por palabra. ¿Qué es su estado oculto?', en: 'A recurrent network reads a sentence word by word. What is its hidden state?' },
      options: [
        { es: 'La palabra que se va a predecir.', en: 'The word that is about to be predicted.' },
        { es: 'La memoria de lo leído: un vector de números que se reescribe en cada paso.', en: 'The memory of what was read: a vector of numbers rewritten at every step.' },
        { es: 'El conjunto de pesos que se aprende en el entrenamiento.', en: 'The set of weights learned during training.' },
        { es: 'El error medido al final de la frase.', en: 'The error measured at the end of the sentence.' },
      ],
      answer: 1,
      why: {
        es: 'El estado oculto es el resumen que la red lleva de un paso al siguiente y cambia con cada palabra. Los pesos, en cambio, son los mismos en todos los pasos y solo cambian al entrenar.',
        en: 'The hidden state is the summary the network carries from one step to the next, and it changes with every word. The weights, by contrast, are the same at every step and only change during training.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué se desvanece el gradiente en una RNN que lee secuencias largas?', en: 'Why does the gradient vanish in an RNN that reads long sequences?' },
      options: [
        { es: 'Porque la red va olvidando sus pesos con el tiempo.', en: 'Because the network gradually forgets its weights over time.' },
        { es: 'Porque las frases largas tienen menos datos de entrenamiento.', en: 'Because long sentences have less training data.' },
        { es: 'Porque la tanh guarda demasiada información.', en: 'Because the tanh stores too much information.' },
        { es: 'Porque la culpa se multiplica por un factor menor que uno en cada paso, y muchas multiplicaciones la dejan casi en cero.', en: 'Because the blame is multiplied by a factor below one at each step, and many multiplications leave it almost at zero.' },
      ],
      answer: 3,
      why: {
        es: 'La culpa que llega a un paso lejano es un producto con tantos factores como pasos de distancia. Si cada factor es menor que uno, el producto cae de forma exponencial.',
        en: 'The blame reaching a distant step is a product with as many factors as steps of distance. If each factor is below one, the product falls exponentially.',
      },
    },
    {
      kind: 'calc',
      q: { es: 'En cada paso la culpa se multiplica por 0.8. ¿Cuánto queda tras diez pasos?', en: 'At each step the blame is multiplied by 0.8. How much is left after ten steps?' },
      options: [
        { es: 'Cerca del 11 %.', en: 'About 11%.' },
        { es: 'Cerca del 80 %.', en: 'About 80%.' },
        { es: 'Cerca del 20 %.', en: 'About 20%.' },
        { es: 'Cerca del 2 %.', en: 'About 2%.' },
      ],
      answer: 0,
      why: {
        es: '0.8 multiplicado por sí mismo diez veces da 0.107, es decir, cerca del 11 %. Un factor que parece suave deja poco más de una décima en diez pasos y cerca del 1 % en veinte.',
        en: '0.8 multiplied by itself ten times gives 0.107, about 11%. A factor that looks mild leaves little more than a tenth after ten steps and about 1% after twenty.',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un proveedor propone una red recurrente para revisar contratos de cientos de páginas y dice que «recuerda todo el documento». ¿Qué conviene pedirle?', en: 'A vendor proposes a recurrent network to review contracts hundreds of pages long and says it “remembers the whole document.” What should you ask for?' },
      options: [
        { es: 'Más capas apiladas: cada capa extra suma memoria de largo plazo.', en: 'More stacked layers: each extra layer adds long-term memory.' },
        { es: 'Más épocas de entrenamiento: así la culpa deja de desvanecerse.', en: 'More training epochs: that way the blame stops vanishing.' },
        { es: 'Pruebas con documentos tan largos como los tuyos: la memoria útil suele ser mucho menor que el largo del texto.', en: 'Tests with documents as long as yours: the useful memory is usually much shorter than the text.' },
        { es: 'Cambiar la tanh por otra activación: con eso desaparece el problema.', en: 'Swapping the tanh for another activation: that makes the problem disappear.' },
      ],
      answer: 2,
      why: {
        es: 'La memoria teórica y la útil no coinciden: un estudio con modelos de lenguaje LSTM halló que usaban unas doscientas palabras de contexto. Ni más capas, ni más épocas, ni otra activación bastan; hay que medirlo con tus propios documentos.',
        en: 'Theoretical and useful memory do not match: a study of LSTM language models found they used about two hundred words of context. More layers, more epochs, or another activation are not enough; you have to measure it on your own documents.',
      },
    },
  ],

  glossary: ['sequence-model', 'rnn', 'hidden-state', 'vanishing-gradient', 'lstm', 'backpropagation', 'chain-rule', 'gradient', 'sigmoid', 'activation', 'weight', 'vector', 'forward-pass', 'layer', 'kernel'],

  terms: [
    { id: 'sequence-model', term: { es: 'Modelo de secuencia', en: 'Sequence model' }, def: { es: 'Modelo que procesa datos cuyo orden importa y cuyo largo varía, como texto, audio o series de tiempo, normalmente leyéndolos paso a paso.', en: 'A model that processes data whose order matters and whose length varies, such as text, audio, or time series, usually by reading it step by step.' } },
    { id: 'rnn', term: { es: 'Red recurrente (RNN)', en: 'Recurrent neural network (RNN)' }, def: { es: 'Red que procesa una secuencia paso a paso con la misma celda: en cada paso recibe la entrada actual y el estado oculto anterior, y produce un estado nuevo.', en: 'A network that processes a sequence step by step with the same cell: at each step it receives the current input and the previous hidden state, and produces a new state.' } },
    { id: 'hidden-state', term: { es: 'Estado oculto', en: 'Hidden state' }, def: { es: 'Vector de números que una red recurrente lleva de un paso al siguiente: su memoria de lo leído hasta ahora. Se reescribe en cada paso.', en: 'The vector of numbers a recurrent network carries from one step to the next: its memory of what it has read so far. It is rewritten at every step.' } },
    { id: 'vanishing-gradient', term: { es: 'Gradiente que se desvanece', en: 'Vanishing gradient' }, def: { es: 'Fenómeno por el que el gradiente (la culpa) se multiplica por factores menores que uno al retroceder por muchos pasos o capas y llega casi a cero, de modo que lo lejano no se aprende. Con factores mayores que uno ocurre lo contrario: el gradiente explota.', en: 'The phenomenon in which the gradient (the blame) is multiplied by factors below one as it travels back through many steps or layers and ends up near zero, so what is far away is not learned. With factors above one the opposite happens: the gradient explodes.' } },
    { id: 'lstm', term: { es: 'LSTM (memoria larga a corto plazo)', en: 'LSTM (long short-term memory)' }, def: { es: 'Celda recurrente con una cinta de memoria (estado de la celda) y tres compuertas aprendidas, de olvido, de entrada y de salida, que deciden qué se conserva, qué se escribe y qué se lee. Propuesta en 1997 por Hochreiter y Schmidhuber; la compuerta de olvido se añadió en 2000.', en: 'A recurrent cell with a memory belt (the cell state) and three learned gates, forget, input, and output, that decide what is kept, what is written, and what is read. Proposed in 1997 by Hochreiter and Schmidhuber; the forget gate was added in 2000.' } },
  ],

  sources: [
    { title: 'Finding structure in time', authors: 'Elman, J. L.', year: 1990, url: 'https://doi.org/10.1207/s15516709cog1402_1' },
    { title: 'Untersuchungen zu dynamischen neuronalen Netzen (tesis de diploma)', authors: 'Hochreiter, S.', year: 1991 },
    { title: 'Learning long-term dependencies with gradient descent is difficult', authors: 'Bengio, Y., Simard, P., Frasconi, P.', year: 1994, url: 'https://doi.org/10.1109/72.279181' },
    { title: 'Long short-term memory', authors: 'Hochreiter, S., Schmidhuber, J.', year: 1997, url: 'https://doi.org/10.1162/neco.1997.9.8.1735' },
    { title: 'Learning to forget: continual prediction with LSTM', authors: 'Gers, F. A., Schmidhuber, J., Cummins, F.', year: 2000, url: 'https://doi.org/10.1162/089976600300015015' },
    { title: 'On the difficulty of training recurrent neural networks', authors: 'Pascanu, R., Mikolov, T., Bengio, Y.', year: 2013, url: 'https://arxiv.org/abs/1211.5063' },
    { title: 'Sequence to sequence learning with neural networks', authors: 'Sutskever, I., Vinyals, O., Le, Q. V.', year: 2014, url: 'https://arxiv.org/abs/1409.3215' },
    { title: 'On the properties of neural machine translation: encoder-decoder approaches', authors: 'Cho, K., van Merriënboer, B., Bahdanau, D., Bengio, Y.', year: 2014, url: 'https://arxiv.org/abs/1409.1259' },
    { title: 'An empirical exploration of recurrent network architectures', authors: 'Jozefowicz, R., Zaremba, W., Sutskever, I.', year: 2015, url: 'https://proceedings.mlr.press/v37/jozefowicz15.html' },
    { title: 'Google’s neural machine translation system: bridging the gap between human and machine translation', authors: 'Wu, Y., Schuster, M., Chen, Z., Le, Q. V., Norouzi, M., et al.', year: 2016, url: 'https://arxiv.org/abs/1609.08144' },
    { title: 'Sharp nearby, fuzzy far away: how neural language models use context', authors: 'Khandelwal, U., He, H., Qi, P., Jurafsky, D.', year: 2018, url: 'https://arxiv.org/abs/1805.04623' },
    { title: 'The emergence of number and syntax units in LSTM language models', authors: 'Lakretz, Y., Kruszewski, G., Desbordes, T., Hupkes, D., Dehaene, S., Baroni, M.', year: 2019, url: 'https://arxiv.org/abs/1903.07435' },
  ],
});
