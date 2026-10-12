import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'agentes',

  objectives: {
    es: [
      'Explicar cómo un modelo que solo escribe texto llega a actuar: describe herramientas, escribe llamadas a funciones, un programa las ejecuta y el resultado vuelve a su contexto, en un bucle de pensar, actuar y observar.',
      'Calcular cómo cae el éxito de una tarea cuando sus pasos se encadenan (0.95 elevado a diez es cerca de 0.60) y cómo la revisión humana lo sube a cambio de atención.',
      'Decidir qué permisos, límites, registros y aprobaciones darle a un agente según lo reversible que sea cada acción.',
    ],
    en: [
      'Explain how a model that only writes text gets to act: it is given tool descriptions, writes function calls, a program runs them, and the result goes back into its context, in a loop of thinking, acting, and observing.',
      'Calculate how a task’s success drops when its steps are chained (0.95 to the tenth power is about 0.60) and how human review raises it in exchange for attention.',
      'Decide which permissions, limits, logs, and approvals to give an agent depending on how reversible each action is.',
    ],
  },

  segments: [
    // ── 1. Hablar no es actuar ────────────────────────────────────────────────────────────────────
    {
      id: 'hook',
      es: 'Le pides a un chatbot: «Compra dos boletos de cine para hoy en la noche, juntos, por menos de trescientos pesos». ¿Puede hacerlo?',
      en: 'You ask a chatbot: “Buy two movie tickets for tonight, seats together, for under three hundred pesos.” Can it do that?',
    },
    {
      id: 'only-text',
      es: 'Recuerda la lección diecinueve: un modelo de lenguaje recibe texto y escribe texto, un token tras otro. Escribir es lo único que sabe hacer.',
      en: 'Remember lesson nineteen: a language model takes in text and writes text, one token after another. Writing is the only thing it can do.',
    },
    {
      id: 'cant-know',
      es: 'Así que no puede saber qué funciones hay hoy: sus pesos quedaron fijos al terminar el entrenamiento. Y tampoco puede pagar: solo escribe.',
      en: 'So it cannot know which showtimes there are today: its weights were frozen when training ended. Nor can it pay: it only writes.',
      pad: 0.3,
    },

    // ── 2. Herramientas y llamadas a funciones ─────────────────────────────────────────────────────
    {
      id: 'tool-def',
      es: 'Para eso necesita herramientas. Una herramienta es una función de un programa: una tarea con nombre que recibe datos y devuelve un resultado.',
      en: 'For that it needs tools. A tool is a function in a program: a named task that takes in some data and returns a result.',
    },
    {
      id: 'tool-two',
      es: 'Aquí le damos dos. Buscar funciones recibe una fecha y devuelve la cartelera. Comprar boletos recibe la función y la cantidad, y paga.',
      en: 'Here we give it two. Find showtimes takes a date and returns the listings. Buy tickets takes the showtime and the quantity, and pays.',
      note: { es: 'Herramienta: una función de un programa que el modelo puede pedir que se ejecute.', en: 'Tool: a program function the model can ask to have run.' },
    },
    {
      id: 'tool-desc',
      es: 'El modelo no ve el código de esas funciones. Recibe una descripción de cada una, como texto, al frente de su contexto, junto a las instrucciones del sistema.',
      en: 'The model never sees the code of those functions. It gets a description of each one, as text, at the front of its context, next to the system prompt.',
      pad: 0.3,
    },
    {
      id: 'call',
      es: 'Lee tu pedido y decide que primero necesita la cartelera. Entonces escribe un texto con formato fijo: el nombre de la herramienta y sus datos.',
      en: 'It reads your request and decides it first needs the listings. So it writes a text with a fixed format: the name of the tool and its data.',
      pad: 0.3,
    },
    {
      id: 'call-name',
      es: 'Eso se llama llamada a función; en inglés, function calling. Ojo: el modelo no ejecutó nada. Solo escribió la petición.',
      en: 'That is called a function call, or function calling. Note: the model did not run anything. It only wrote the request.',
      note: { es: 'Llamada a función: el modelo escribe qué herramienta usar y con qué datos; no la ejecuta.', en: 'Function calling: the model writes which tool to use and with what data; it does not run it.' },
    },
    {
      id: 'program',
      es: 'Quien la ejecuta es el programa que rodea al modelo, la aplicación de la lección treinta. Lee la petición y corre la función de verdad.',
      en: 'What runs it is the program around the model, the app from lesson thirty. It reads the request and runs the function for real.',
      pad: 0.3,
    },
    {
      id: 'result',
      es: 'La función devuelve su resultado: la de las ocho ya está agotada; la de las nueve y media tiene catorce lugares, a noventa y cinco pesos cada uno.',
      en: 'The function returns its result: the eight o’clock show is sold out; the nine thirty has fourteen seats left, at ninety-five pesos each.',
      pad: 0.3,
    },
    {
      id: 'paste',
      es: 'El programa pega ese resultado al final del contexto, como un mensaje más, y vuelve a llamar al modelo. Pedir y usar funciones así es el uso de herramientas.',
      en: 'The program pastes that result at the end of the context, as one more message, and calls the model again. Asking for functions and using them like this is tool use.',
      pad: 0.4,
    },

    // ── 3. El bucle: un agente ─────────────────────────────────────────────────────────────────────
    {
      id: 'observe',
      es: 'El modelo lee el resultado como lee todo lo demás, y eso cambia su plan: descarta la función de las ocho y se queda con la de las nueve y media.',
      en: 'The model reads the result the way it reads everything else, and that changes its plan: it drops the eight o’clock show and picks the nine thirty.',
    },
    {
      id: 'second-call',
      es: 'Hace la cuenta: dos por noventa y cinco son ciento noventa, menos de trescientos. Y escribe otra llamada: comprar dos boletos para las nueve y media.',
      en: 'It does the math: two times ninety-five is one hundred ninety, under three hundred. And it writes another call: buy two tickets for nine thirty.',
      pad: 0.3,
    },
    {
      id: 'second-result',
      es: 'El programa la ejecuta y pega el resultado: asientos F7 y F8. Con eso, el modelo ya no pide más herramientas y escribe su respuesta final.',
      en: 'The program runs it and pastes the result: seats F7 and F8. With that, the model asks for no more tools and writes its final answer.',
      tts: {
        es: 'El programa la ejecuta y pega el resultado: asientos efe siete y efe ocho. Con eso, el modelo ya no pide más herramientas y escribe su respuesta final.',
        en: 'The program runs it and pastes the result: seats F seven and F eight. With that, the model asks for no more tools and writes its final answer.',
      },
      pad: 0.4,
    },
    {
      id: 'loop',
      es: 'Mira la forma que tuvo todo: pensar, actuar con una herramienta, observar el resultado. Y otra vez, hasta cumplir el objetivo.',
      en: 'Look at the shape of the whole thing: think, act with a tool, observe the result. And again, until the goal is met.',
      pad: 0.3,
    },
    {
      id: 'agent',
      es: 'Un modelo dentro de ese ciclo, con herramientas y un objetivo, es un agente. No es otro modelo: es el mismo, metido en un bucle.',
      en: 'A model inside that cycle, with tools and a goal, is an agent. It is not a different model: it is the same one, placed in a loop.',
      note: { es: 'Agente: un modelo en un bucle de pensar, actuar con herramientas y observar el resultado.', en: 'Agent: a model in a loop of thinking, acting with tools, and observing the result.' },
    },
    {
      id: 'react',
      es: 'Esta idea se estudió en dos mil veintidós con el nombre ReAct, de razonar y actuar: alternar los dos, para que cada resultado corrija el paso siguiente.',
      en: 'This idea was studied in two thousand twenty-two under the name ReAct, for reasoning and acting: alternate the two, so each result corrects the next step.',
      tts: {
        es: 'Esta idea se estudió en dos mil veintidós con el nombre ri-act, de razonar y actuar: alternar los dos, para que cada resultado corrija el paso siguiente.',
        en: 'This idea was studied in two thousand twenty-two under the name ree-act, for reasoning and acting: alternate the two, so each result corrects the next step.',
      },
    },

    // ── 4. Plan, memoria y un estándar para conectar ───────────────────────────────────────────────
    {
      id: 'plan',
      es: 'En tareas largas, el agente suele escribir primero un plan, una lista de pasos, y la va tachando. Ese plan también es texto en su contexto.',
      en: 'On long tasks, the agent often writes a plan first, a list of steps, and checks them off as it goes. That plan is also text in its context.',
    },
    {
      id: 'memory',
      es: 'Su memoria de trabajo es el contexto: ahí se quedan cada llamada y cada resultado. Y como viste en la lección treinta, cada vuelta lo relee todo y cuesta más.',
      en: 'Its working memory is the context: every call and every result stays there. And as you saw in lesson thirty, each round rereads all of it and costs more.',
      pad: 0.3,
    },
    {
      id: 'memory-out',
      es: 'Si la tarea ya no cabe en la ventana de contexto, el agente guarda notas fuera, en un archivo, y las vuelve a leer cuando las necesita.',
      en: 'If the task no longer fits in the context window, the agent saves notes outside, in a file, and reads them again when it needs them.',
    },
    {
      id: 'mcp-problem',
      es: 'Falta conectar. Cada aplicación de IA conectaba cada herramienta a su manera: el mismo trabajo, repetido una y otra vez.',
      en: 'Then there is the wiring. Each AI app connected each tool in its own way: the same work, repeated over and over.',
      pad: 0.3,
    },
    {
      id: 'mcp',
      es: 'En noviembre de dos mil veinticuatro, Anthropic publicó MCP, un estándar abierto que funciona como un enchufe común: una herramienta se conecta una vez y la pueden usar muchas aplicaciones.',
      en: 'In November two thousand twenty-four, Anthropic published MCP, an open standard that works like a common plug: a tool is connected once, and many apps can use it.',
      tts: {
        es: 'En noviembre de dos mil veinticuatro, Anthropic publicó eme ce pe, un estándar abierto que funciona como un enchufe común: una herramienta se conecta una vez y la pueden usar muchas aplicaciones.',
        en: 'In November two thousand twenty-four, Anthropic published M C P, an open standard that works like a common plug: a tool is connected once, and many apps can use it.',
      },
      note: { es: 'MCP: un estándar abierto para conectar herramientas y datos a las aplicaciones de IA.', en: 'MCP: an open standard for connecting tools and data to AI apps.' },
      pad: 0.4,
    },

    // ── 5. Fiabilidad: los errores se acumulan ─────────────────────────────────────────────────────
    {
      id: 'risk',
      es: 'Ahora lo delicado. Cada paso puede salir mal: el modelo elige la herramienta equivocada, escribe mal un dato o lee mal un resultado.',
      en: 'Now the tricky part. Any step can go wrong: the model picks the wrong tool, mistypes a piece of data, or misreads a result.',
    },
    {
      id: 'per-step',
      es: 'Supón que cada paso sale bien noventa y cinco de cada cien veces. En este cuadro, cada casilla es un intento: cinco de cien fallan. Parece casi perfecto.',
      en: 'Suppose each step goes right ninety-five times out of a hundred. In this grid, each square is an attempt: five out of a hundred fail. It looks almost perfect.',
    },
    {
      id: 'two-steps',
      es: 'Pero la tarea sale bien solo si todos sus pasos salen bien. Con dos pasos, a los cinco que fallan en el primero se suman casi cinco más en el segundo: quedan noventa.',
      en: 'But the task goes right only if every step does. With two steps, the five that fail on the first are joined by almost five more on the second: ninety are left.',
      pad: 0.4,
    },
    {
      id: 'sim-intro',
      es: 'Ahora, un simulador. Cada fila es un intento de una tarea de diez pasos, y cada círculo es un paso. Una cruz marca un paso que salió mal.',
      en: 'Now, a simulator. Each row is an attempt at a ten-step task, and each circle is a step. A cross marks a step that went wrong.',
      pad: 0.3,
    },
    {
      id: 'sim-run',
      es: 'Basta una cruz para arruinar el intento: todo lo que sigue parte de un error. De estos veinte intentos, solo doce terminan bien.',
      en: 'One cross is enough to ruin the attempt: everything after it builds on a mistake. Of these twenty attempts, only twelve finish right.',
      pad: 0.6,
    },
    {
      id: 'sim-formula',
      es: 'La cuenta lo confirma: diez veces cero punto noventa y cinco, multiplicados entre sí, dan cerca de cero punto sesenta. Es decir, sesenta por ciento.',
      en: 'The math agrees: ten copies of zero point nine five, multiplied together, give about zero point six. That is, sixty percent.',
      note: { es: 'Éxito de la tarea = éxito por paso, multiplicado una vez por cada paso.', en: 'Task success = per-step success, multiplied once for every step.' },
      pad: 0.3,
    },
    {
      id: 'axis-x',
      es: 'Llevémoslo a una gráfica. La línea horizontal cuenta los pasos de la tarea: uno a la izquierda, cuarenta a la derecha.',
      en: 'Let’s put it on a graph. The horizontal line counts the steps in the task: one on the left, forty on the right.',
    },
    {
      id: 'axis-y',
      es: 'La vertical es el porcentaje de intentos que salen bien de principio a fin: cien arriba, cero abajo. Primer punto: diez pasos, sesenta por ciento.',
      en: 'The vertical line is the percentage of attempts that go right from start to finish: a hundred at the top, zero at the bottom. First point: ten steps, sixty percent.',
      pad: 0.3,
    },
    {
      id: 'demo-steps',
      es: 'Ahora mira cómo cae. Con catorce pasos, ya sale bien menos de la mitad de las veces. Con veinte, treinta y seis por ciento. Con cuarenta, trece.',
      en: 'Now watch it fall. With fourteen steps, it already goes right less than half the time. With twenty, thirty-six percent. With forty, thirteen.',
      pad: 0.6,
    },
    {
      id: 'try-steps',
      es: 'Si quieres, mueve tú el número de pasos y mira cuántos de los veinte intentos llegan bien al final.',
      en: 'If you like, move the number of steps yourself and see how many of the twenty attempts make it to the end.',
      gate: { id: 'steps', prompt: { es: 'mueve los pasos y mira cuántos intentos terminan bien.', en: 'move the steps and see how many attempts finish right.' } },
      pad: 0.4,
    },
    {
      id: 'caveat',
      es: 'El simulador simplifica: supone que un error no influye en los demás. En la práctica, a veces el agente se corrige solo y a veces un error arrastra a otros. Por eso se mide.',
      en: 'The simulator simplifies: it assumes one error does not affect the others. In practice, sometimes the agent fixes itself, and sometimes one error drags others along. That is why you measure.',
    },
    {
      id: 'real',
      es: 'En τ-bench, una prueba de dos mil veinticuatro, GPT-4o resolvía el sesenta y uno por ciento de las tareas de una tienda. Pero menos de una de cada cuatro le salía bien ocho veces de ocho.',
      en: 'On τ-bench, a test from two thousand twenty-four, GPT-4o solved sixty-one percent of a store’s tasks. But fewer than one in four went right eight times out of eight.',
      tts: {
        es: 'En tau bench, una prueba de dos mil veinticuatro, ge pe te cuatro o resolvía el sesenta y uno por ciento de las tareas de una tienda. Pero menos de una de cada cuatro le salía bien ocho veces de ocho.',
        en: 'On tau bench, a test from two thousand twenty-four, G P T four o solved sixty-one percent of a store’s tasks. But fewer than one in four went right eight times out of eight.',
      },
      pad: 0.4,
    },

    // ── 6. Revisión humana ─────────────────────────────────────────────────────────────────────────
    {
      id: 'review-idea',
      es: '¿Cómo se sube el éxito? Con revisión humana. Tomemos una tarea de veinte pasos: cada cinco, una persona revisa el tramo y, si ve un error, se repite.',
      en: 'How do you raise success? With human review. Take a twenty-step task: every five steps, a person checks that stretch and, if they spot an error, it is redone.',
      pad: 0.3,
    },
    {
      id: 'review-demo',
      es: 'Sin revisión, de los veinte intentos terminan bien siete. Con ella, los errores detectados se repiten, marcados con una flecha circular, y terminan bien dieciocho.',
      en: 'Without review, seven of the twenty attempts finish right. With it, the errors that get caught are redone, marked with a circular arrow, and eighteen finish right.',
      pad: 0.6,
    },
    {
      id: 'review-cost',
      es: 'No es gratis: son unas cinco revisiones por intento, y algunos tramos se hacen dos veces. Y quien revisa también falla: aquí suponemos que se le pasa uno de cada diez errores.',
      en: 'It is not free: about five reviews per attempt, and some stretches get done twice. And reviewers miss things too: here we assume one error in ten slips past them.',
      pad: 0.3,
    },
    {
      id: 'try-review',
      es: 'Si quieres, quita y pon tú la revisión, y compara cuántos intentos terminan bien.',
      en: 'If you like, switch the review off and on yourself, and compare how many attempts finish right.',
      gate: { id: 'review', prompt: { es: 'apaga o enciende la revisión y compara.', en: 'turn the review off or on and compare.' } },
      pad: 0.4,
    },

    // ── 7. Permisos, persona en el bucle y niveles de autonomía ────────────────────────────────────
    {
      id: 'irreversible',
      es: 'Además, no todos los pasos pesan igual. Buscar funciones se puede repetir sin daño. Comprar, pagar, enviar un correo o borrar datos no se deshace.',
      en: 'Also, not all steps weigh the same. Looking up showtimes can be repeated with no harm. Buying, paying, sending an email, or deleting data cannot be undone.',
      pad: 0.3,
    },
    {
      id: 'incident',
      es: 'Y ya ha pasado. En julio de dos mil veinticinco, según contó su usuario, un agente de programación de Replit borró una base de datos de producción, aunque se le había pedido no hacer cambios.',
      en: 'And it has already happened. In July two thousand twenty-five, as its user reported, a coding agent from Replit deleted a production database, even though it had been told to make no changes.',
      tts: {
        es: 'Y ya ha pasado. En julio de dos mil veinticinco, según contó su usuario, un agente de programación de réplit borró una base de datos de producción, aunque se le había pedido no hacer cambios.',
      },
      pad: 0.3,
    },
    {
      id: 'plea',
      es: 'Por eso, escribirle al modelo «no gastes más de trescientos pesos» no basta: es un ruego. Un permiso es una regla en el programa, y se cumple haga lo que haga el modelo.',
      en: 'That is why writing “don’t spend more than three hundred pesos” to the model is not enough: it is a plea. A permission is a rule in the program, and it holds whatever the model does.',
      note: { es: 'Permiso: una regla en el programa, no un ruego en el texto.', en: 'Permission: a rule in the program, not a plea in the text.' },
      pad: 0.3,
    },
    {
      id: 'hitl',
      es: 'Una regla muy usada: antes de algo que no se deshace, o que pasa de un límite, el programa se detiene y le pregunta a una persona. Se llama persona en el bucle; en inglés, human in the loop.',
      en: 'A widely used rule: before anything that cannot be undone, or that goes over a limit, the program stops and asks a person. This is called having a human in the loop.',
      note: { es: 'Persona en el bucle: antes de lo riesgoso, el programa se detiene y espera la decisión de alguien.', en: 'Human in the loop: before the risky step, the program stops and waits for someone’s decision.' },
      pad: 0.3,
    },
    {
      id: 'hitl-demo',
      es: 'Mira. Esta vez el modelo se equivoca al escribir la cantidad y pide veinte boletos: mil novecientos pesos. Pasa del límite, así que el programa no compra: muestra la petición y espera.',
      en: 'Watch. This time the model mistypes the quantity and asks for twenty tickets: one thousand nine hundred pesos. That is over the limit, so the program does not buy: it shows the request and waits.',
      pad: 0.3,
    },
    {
      id: 'hitl-reject',
      es: 'La persona lee las cifras y rechaza. El rechazo vuelve al contexto como un resultado más; el modelo lo lee y corrige: dos boletos, ciento noventa pesos.',
      en: 'The person reads the numbers and rejects it. The rejection goes back into the context as one more result; the model reads it and corrects itself: two tickets, one hundred ninety pesos.',
      pad: 0.5,
    },
    {
      id: 'try-approve',
      es: 'Si quieres, decide tú: aprueba o rechaza la compra de veinte boletos, y mira qué pasa en cada caso.',
      en: 'If you like, decide for yourself: approve or reject the purchase of twenty tickets, and see what happens in each case.',
      gate: { id: 'decide', prompt: { es: 'aprueba o rechaza la compra de veinte boletos.', en: 'approve or reject the purchase of twenty tickets.' } },
      pad: 0.4,
    },
    {
      id: 'levels',
      es: 'La autonomía se gradúa. El agente puede solo sugerir, actuar con tu aprobación, actuar solo hasta un límite, o actuar solo del todo. Cada escalón gana rapidez y pierde control.',
      en: 'Autonomy comes in degrees. The agent can only suggest, act with your approval, act alone up to a limit, or act fully alone. Each rung gains speed and loses control.',
      pad: 0.4,
    },
    {
      id: 'start-small',
      es: 'Por eso se empieza abajo y con lo que se deshace: leer, buscar, redactar borradores. Con permisos mínimos, un registro de cada llamada y aprobación antes de lo irreversible.',
      en: 'That is why you start low, with what can be undone: reading, searching, drafting. With minimal permissions, a log of every call, and approval before anything irreversible.',
      pad: 0.4,
    },
    {
      id: 'recap',
      es: 'En resumen: un agente es un modelo en un bucle que escribe llamadas, mientras un programa las ejecuta. Sus errores se acumulan con los pasos; la revisión y los permisos los contienen.',
      en: 'In short: an agent is a model in a loop that writes calls while a program runs them. Its errors pile up with the steps; review and permissions keep them in check.',
      pad: 0.3,
    },
    {
      id: 'bridge',
      es: 'Ya sabes cómo se construye un asistente que lee y actúa. Falta lo más importante: usarlo con criterio, empezando por su error más famoso, inventar con total seguridad.',
      en: 'Now you know how an assistant that reads and acts is built. The most important part is left: using it with judgment, starting with its most famous error, making things up with total confidence.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo solo escribe texto. Para actuar recibe descripciones de herramientas y escribe llamadas a funciones (nombre y datos); el programa que lo rodea las ejecuta y pega el resultado en su contexto.',
      'Un agente es un modelo en un bucle: piensa, actúa con una herramienta, observa el resultado y repite hasta cumplir el objetivo. Su contexto es su memoria de trabajo, y cada vuelta lo relee todo.',
      'Los errores se acumulan: si cada paso sale bien el 95 % de las veces, diez pasos salen bien cerca del 60 % y veinte, cerca del 36 %. La revisión humana por tramos sube el éxito a cambio de atención, y quien revisa también falla.',
      'Una instrucción en el texto es un ruego; un permiso es una regla en el programa. Antes de lo irreversible o de lo que pasa de un límite, la persona en el bucle aprueba o rechaza, y solo protege si lee de verdad.',
      'La autonomía se gradúa (sugerir, actuar con aprobación, actuar hasta un límite, actuar solo) y se gana con evidencia: se empieza con acciones reversibles, permisos mínimos y un registro de cada llamada.',
    ],
    en: [
      'A model only writes text. To act, it is given tool descriptions and writes function calls (a name and data); the program around it runs them and pastes the result into its context.',
      'An agent is a model in a loop: it thinks, acts with a tool, observes the result, and repeats until the goal is met. Its context is its working memory, and every round rereads all of it.',
      'Errors pile up: if each step goes right 95% of the time, ten steps go right about 60% of the time and twenty, about 36%. Human review in stretches raises success in exchange for attention, and reviewers miss things too.',
      'An instruction in the text is a plea; a permission is a rule in the program. Before anything irreversible or over a limit, the human in the loop approves or rejects, and it only protects if they really read.',
      'Autonomy comes in degrees (suggest, act with approval, act up to a limit, act alone) and is earned with evidence: you start with reversible actions, minimal permissions, and a log of every call.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Un agente es un modelo más inteligente que actúa por su cuenta.',
      en: 'An agent is a smarter model that acts on its own.',
    },
    right: {
      es: 'Es el mismo modelo, que solo escribe texto, dentro de un bucle. Las acciones las ejecuta un programa con los permisos que tú defines. No es más inteligente: es más autónomo, y por eso más caro y más arriesgado.',
      en: 'It is the same model, which only writes text, inside a loop. The actions are run by a program with the permissions you define. It is not smarter: it is more autonomous, and therefore costlier and riskier.',
    },
  },

  deeper: {
    es: `## El bucle del agente

Un agente es un programa con tres piezas: un **modelo** que decide, un conjunto de **herramientas** (funciones) y un **bucle** que los conecta. En cada vuelta:

1. el modelo recibe el contexto completo (instrucciones del sistema, descripción de las herramientas, tarea e historial) y produce *o* una llamada (nombre y datos) *o* la respuesta final;
2. el programa valida la llamada, aplica los permisos y ejecuta la función;
3. el resultado se agrega al historial como un mensaje más y se vuelve al paso 1, hasta que el modelo responde o se agota un límite de pasos.

Es la idea de ReAct (Yao et al., 2022): intercalar razonamiento y acción, de modo que cada observación corrija el razonamiento siguiente. En sus pruebas, con solo uno o dos ejemplos en el prompt, ReAct superó a métodos de imitación y de aprendizaje por refuerzo por 34 y 10 puntos de tasa de éxito en dos entornos interactivos (ALFWorld y WebShop), y en preguntas con una API de Wikipedia redujo las alucinaciones frente a la sola cadena de pensamiento. Desde 2023 las interfaces de los proveedores (por ejemplo, la «llamada a funciones» que OpenAI lanzó el 13 de junio de 2023) hacen que el modelo emita la llamada en un formato estructurado. Antes, Toolformer (Schick et al., 2023) había entrenado a un modelo para decidir por sí mismo cuándo llamar a una API y con qué argumentos.

## Una llamada a función, por dentro

Una herramienta se describe con un nombre, una descripción y un esquema de sus datos de entrada (JSON Schema). Los nombres de los campos cambian de un proveedor a otro; la idea es la misma:

\`\`\`json
// lo que el modelo recibe (como texto) al frente de su contexto
{ "name": "comprar_boletos",
  "description": "Compra boletos para una función. Cobra a la tarjeta guardada. No se puede deshacer.",
  "input_schema": { "type": "object",
    "properties": { "funcion": { "type": "string" }, "cantidad": { "type": "integer", "minimum": 1 } },
    "required": ["funcion", "cantidad"] } }

// lo que el modelo escribe: una petición, no una ejecución
{ "name": "comprar_boletos", "input": { "funcion": "21:30", "cantidad": 2 } }
\`\`\`

El modelo no ejecuta nada: produce el texto de la llamada. El programa debe tratar esos datos como **entrada no confiable**: validarlos, limitarlos y registrarlos. La descripción de la herramienta (por ejemplo, «no se puede deshacer») ayuda al modelo a decidir, pero no protege: el límite de gasto vive en el código que ejecuta.

## MCP

El **Model Context Protocol** (Anthropic, 25 de noviembre de 2024) estandariza esa conexión. Una aplicación (el cliente) se conecta a un servidor MCP que ofrece herramientas; los mensajes son JSON-RPC 2.0: \`tools/list\` para descubrir las herramientas y \`tools/call\` para invocar una, y el resultado vuelve con un indicador \`isError\`. La especificación (versión 2025-06-18) dice que, por confianza y seguridad, **debería haber siempre una persona en el bucle** con la posibilidad de negar una invocación, que el cliente pida confirmación en operaciones sensibles, muestre los datos de entrada antes de llamar al servidor y registre el uso de herramientas para auditoría. El 9 de diciembre de 2025 la Linux Foundation anunció la Agentic AI Foundation, con MCP entre sus proyectos fundadores, aportado por Anthropic.

## Fiabilidad de una cadena

Si cada paso sale bien con probabilidad $p$, de forma independiente, y basta un error para arruinar la tarea, una tarea de $n$ pasos sale bien con probabilidad

$$P(n) = p^{\\,n}$$

Con $p = 0.95$: $P(2) \\approx 0.90$, $P(10)\\approx 0.60$, $P(14)\\approx 0.49$, $P(20)\\approx 0.36$ y $P(40)\\approx 0.13$. El número de pasos en que el éxito cae a la mitad es

$$n_{1/2} = \\frac{\\ln 0.5}{\\ln p} \\approx 13.5 \\quad (p = 0.95)$$

Es un modelo simplificado: supone errores independientes y que cualquier error arruina el intento. En la práctica los errores se correlacionan (un mal plan arrastra los pasos que siguen) y a veces el agente se recupera solo, al leer un mensaje de error. Por eso la tasa de éxito de principio a fin se **mide**, no se calcula. El simulador de la lección hace exactamente esa cuenta con veinte intentos (semilla fija): la muestra da 12 de 20 con diez pasos, 9 con catorce, 7 con veinte y 3 con cuarenta.

### Revisión por tramos

Un tramo de $m$ pasos sale bien con $A = p^{m}$. Al final del tramo, una persona lo revisa y detecta un error con probabilidad $q$; si lo detecta, el tramo se repite. Un intento del tramo se acepta con probabilidad $A + (1-A)(1-q)$, así que

$$s = \\frac{A}{A + (1-A)(1-q)}, \\qquad \\text{revisiones esperadas} = \\frac{1}{A + (1-A)(1-q)}$$

El éxito total es el producto de los $s$ de todos los tramos. Con $p = 0.95$, $n = 20$ y $q = 0.9$ (supuestos de la lección): sin revisar, 35.8 %; revisando cada 5 pasos, 89.1 %, con 5.0 revisiones y 25.1 pasos del agente por intento; cada 10, 87.8 % (3.1 revisiones, 31.3 pasos); solo al final, 84.8 % (2.4 revisiones, pero 47.3 pasos: se repite todo). El techo lo fija $q$: aun revisando cada paso, el éxito queda en 90.0 %, porque de cada diez errores se escapa uno.

### Medir la constancia

τ-bench (Yao, Shinn, Razavi y Narasimhan, 2024) pone a un agente con herramientas y reglas de negocio frente a un cliente simulado por otro modelo, y compara el estado final de la base de datos con el esperado. Introduce $\\text{pass}^k$: la probabilidad de que una misma tarea salga bien en los $k$ intentos. Con llamadas a funciones, GPT-4o resolvió en el primer intento el 61.2 % de las tareas de la tienda y el 35.2 % de las de la aerolínea (48.2 % en promedio), y en la tienda su $\\text{pass}^8$ bajó a menos del 25 %.

## Costo

Si cada consulta relee las instrucciones y las definiciones ($B$ tokens) más todo el historial, y cada paso agrega $g$ tokens, lo leído en $n$ pasos es

$$\\sum_{k=1}^{n}\\bigl(B + (k-1)\\,g\\bigr) = nB + g\\,\\frac{n(n-1)}{2}$$

Crece como $n^2$, como las conversaciones de la lección 30. Con supuestos ilustrativos ($B = 2\\,000$, $g = 800$): 10 pasos son 56 000 tokens; 20, 192 000; 40, 704 000. Y un intento fallido se paga igual: el costo por tarea **lograda** es el costo por intento dividido entre la probabilidad de éxito. Con $p = 0.95$ quedan cerca de 94 000, 536 000 y 5.5 millones de tokens por tarea lograda.

## Niveles de autonomía

Feng, McDonald y Zhang (2025) proponen cinco niveles según el papel de la persona: operadora, colaboradora, consultora, aprobadora y observadora, y sostienen que la autonomía es una decisión de diseño, separada de la capacidad del modelo. La lección usa una escala más corta (sugiere, actúa con aprobación, actúa hasta un límite, actúa sola) con la misma idea: más autonomía es más rapidez y menos control, y se concede acción por acción según su reversibilidad. Anthropic (2024) recomienda empezar por la solución más simple: si los pasos se conocen de antemano, un flujo fijo (*workflow*) suele bastar; un agente se justifica cuando el camino depende de lo que se observa, y su autonomía implica más costo y errores que se acumulan, así que conviene probarlo en un entorno aislado y con salvaguardas.

## En código

\`\`\`python
CARTELERA = {"20:00": {"lugares": 0, "precio": 95}, "21:30": {"lugares": 14, "precio": 95}}
LIMITE = 300   # permiso: por encima de esto, el programa pide aprobación

def buscar_funciones(fecha):
    return {hora: dict(f) for hora, f in CARTELERA.items()}

def comprar_boletos(funcion, cantidad):
    f = CARTELERA[funcion]
    if cantidad > f["lugares"]:
        raise ValueError("no hay lugares suficientes")
    f["lugares"] -= cantidad
    return {"funcion": funcion, "cantidad": cantidad, "total": cantidad * f["precio"]}

HERRAMIENTAS = {"buscar_funciones": buscar_funciones, "comprar_boletos": comprar_boletos}

def modelo(contexto):
    """Guion en lugar de un LLM: decide con lo último que hay en el contexto."""
    ult = contexto[-1]
    if ult["rol"] == "usuario":
        return {"herramienta": "buscar_funciones", "datos": {"fecha": "hoy"}}
    if ult["herramienta"] == "buscar_funciones":
        hora = next(h for h, f in ult["resultado"].items() if f["lugares"] >= 2)
        return {"herramienta": "comprar_boletos", "datos": {"funcion": hora, "cantidad": 20}}  # error: un cero de más
    if ult["resultado"] == "rechazado por la persona":
        return {"herramienta": "comprar_boletos", "datos": {"funcion": "21:30", "cantidad": 2}}
    return {"respuesta": f"Listo: {ult['resultado']}"}

def aprueba(peticion):   # la persona en el bucle (aquí, una regla que imita su decisión)
    print("¿Aprobar?", peticion["datos"])
    return peticion["datos"]["cantidad"] <= 4

def agente(pedido, max_pasos=6):
    contexto = [{"rol": "usuario", "texto": pedido}]
    for paso in range(1, max_pasos + 1):
        decision = modelo(contexto)                          # 1. pensar
        if "respuesta" in decision:
            return decision["respuesta"], paso
        nombre, datos = decision["herramienta"], decision["datos"]
        if nombre == "comprar_boletos":                      # permiso: una regla del programa
            total = datos["cantidad"] * CARTELERA[datos["funcion"]]["precio"]
            if total > LIMITE and not aprueba(decision):
                contexto.append({"rol": "resultado", "herramienta": nombre, "resultado": "rechazado por la persona"})
                continue
        try:
            resultado = HERRAMIENTAS[nombre](**datos)        # 2. actuar: lo ejecuta el programa
        except Exception as e:
            resultado = f"error: {e}"                        # un error también es una observación
        contexto.append({"rol": "resultado", "herramienta": nombre, "resultado": resultado})  # 3. observar
    return "No terminé.", max_pasos

print(agente("Compra dos boletos para hoy en la noche, por menos de 300 pesos."))

# Fiabilidad de una cadena: cada paso sale bien con p = 0.95
for n in (1, 2, 10, 14, 20, 40):
    print(n, round(0.95 ** n, 2))
\`\`\`

Salida:

\`\`\`
¿Aprobar? {'funcion': '21:30', 'cantidad': 20}
("Listo: {'funcion': '21:30', 'cantidad': 2, 'total': 190}", 4)
1 0.95
2 0.9
10 0.6
14 0.49
20 0.36
40 0.13
\`\`\`

Cambia \`modelo\` por una llamada a un LLM y tendrás el esqueleto de un agente real. Lo que añade un producto serio es lo que aquí apenas se esboza: validación de los datos, permisos por herramienta, límites de pasos y de gasto, registro de cada llamada y manejo de errores.

## Lo que viene

Un agente que lee y actúa se equivoca con aplomo: la lección 33 trata las alucinaciones. La 34 enseña a medir un sistema con tus propias tareas, y la 35, los riesgos que abre dar acceso a herramientas (por ejemplo, instrucciones escondidas en lo que el agente lee) y cómo gobernarlos.`,
    en: `## The agent loop

An agent is a program with three parts: a **model** that decides, a set of **tools** (functions), and a **loop** that connects them. On each round:

1. the model receives the full context (system prompt, tool descriptions, task, and history) and produces *either* a call (a name and data) *or* the final answer;
2. the program validates the call, applies the permissions, and runs the function;
3. the result is added to the history as one more message and we go back to step 1, until the model answers or a step limit runs out.

That is the idea behind ReAct (Yao et al., 2022): interleave reasoning and acting so that each observation corrects the next reasoning step. In their tests, with only one or two examples in the prompt, ReAct beat imitation and reinforcement-learning methods by 34 and 10 points of success rate in two interactive environments (ALFWorld and WebShop), and on questions answered with a Wikipedia API it reduced hallucination compared with chain of thought alone. Since 2023, providers’ interfaces (for example, the “function calling” OpenAI launched on June 13, 2023) make the model emit the call in a structured format. Before that, Toolformer (Schick et al., 2023) had trained a model to decide on its own when to call an API and with which arguments.

## A function call, inside

A tool is described by a name, a description, and a schema of its input data (JSON Schema). Field names vary from provider to provider; the idea is the same:

\`\`\`json
// what the model receives (as text) at the front of its context
{ "name": "buy_tickets",
  "description": "Buys tickets for a showtime. Charges the saved card. Cannot be undone.",
  "input_schema": { "type": "object",
    "properties": { "showtime": { "type": "string" }, "quantity": { "type": "integer", "minimum": 1 } },
    "required": ["showtime", "quantity"] } }

// what the model writes: a request, not an execution
{ "name": "buy_tickets", "input": { "showtime": "9:30 pm", "quantity": 2 } }
\`\`\`

The model runs nothing: it produces the text of the call. The program must treat that data as **untrusted input**: validate it, bound it, and log it. The tool description (for example, “cannot be undone”) helps the model decide, but it does not protect: the spending limit lives in the code that executes.

## MCP

The **Model Context Protocol** (Anthropic, November 25, 2024) standardizes that connection. An application (the client) connects to an MCP server that offers tools; messages are JSON-RPC 2.0: \`tools/list\` to discover the tools and \`tools/call\` to invoke one, and the result comes back with an \`isError\` flag. The specification (version 2025-06-18) says that, for trust and safety, **there should always be a human in the loop** with the ability to deny an invocation, and that the client should ask for confirmation on sensitive operations, show the inputs before calling the server, and log tool usage for audit purposes. On December 9, 2025, the Linux Foundation announced the Agentic AI Foundation, with MCP, contributed by Anthropic, among its founding projects.

## Reliability of a chain

If each step goes right with probability $p$, independently, and one error is enough to ruin the task, an $n$-step task goes right with probability

$$P(n) = p^{\\,n}$$

With $p = 0.95$: $P(2) \\approx 0.90$, $P(10)\\approx 0.60$, $P(14)\\approx 0.49$, $P(20)\\approx 0.36$, and $P(40)\\approx 0.13$. The number of steps at which success falls to one half is

$$n_{1/2} = \\frac{\\ln 0.5}{\\ln p} \\approx 13.5 \\quad (p = 0.95)$$

This is a simplified model: it assumes independent errors and that any error ruins the attempt. In practice errors correlate (a bad plan drags down the steps after it), and sometimes the agent recovers on its own by reading an error message. That is why end-to-end success is **measured**, not computed. The lesson’s simulator does exactly this calculation with twenty attempts (fixed seed): the sample gives 12 of 20 with ten steps, 9 with fourteen, 7 with twenty, and 3 with forty.

### Review in stretches

A stretch of $m$ steps goes right with $A = p^{m}$. At the end of the stretch, a person reviews it and catches an error with probability $q$; if caught, the stretch is redone. One attempt at the stretch is accepted with probability $A + (1-A)(1-q)$, so

$$s = \\frac{A}{A + (1-A)(1-q)}, \\qquad \\text{expected reviews} = \\frac{1}{A + (1-A)(1-q)}$$

Total success is the product of the $s$ of all stretches. With $p = 0.95$, $n = 20$, and $q = 0.9$ (the lesson’s assumptions): no review, 35.8%; reviewing every 5 steps, 89.1%, with 5.0 reviews and 25.1 agent steps per attempt; every 10, 87.8% (3.1 reviews, 31.3 steps); only at the end, 84.8% (2.4 reviews, but 47.3 steps: everything is redone). The ceiling is set by $q$: even reviewing every step, success stays at 90.0%, because one error in ten slips through.

### Measuring consistency

τ-bench (Yao, Shinn, Razavi, and Narasimhan, 2024) puts an agent with tools and business rules in front of a customer simulated by another model, and compares the final state of the database with the expected one. It introduces $\\text{pass}^k$: the probability that the same task goes right in all $k$ attempts. With function calling, GPT-4o solved 61.2% of the store’s tasks and 35.2% of the airline’s on the first try (48.2% on average), and in the store its $\\text{pass}^8$ fell below 25%.

## Cost

If each query rereads the instructions and the definitions ($B$ tokens) plus the whole history, and each step adds $g$ tokens, the total read over $n$ steps is

$$\\sum_{k=1}^{n}\\bigl(B + (k-1)\\,g\\bigr) = nB + g\\,\\frac{n(n-1)}{2}$$

It grows like $n^2$, like the conversations in lesson 30. With illustrative assumptions ($B = 2{,}000$, $g = 800$): 10 steps is 56,000 tokens; 20, 192,000; 40, 704,000. And a failed attempt is paid for all the same: the cost per **completed** task is the cost per attempt divided by the probability of success. With $p = 0.95$ that comes to about 94,000, 536,000, and 5.5 million tokens per completed task.

## Levels of autonomy

Feng, McDonald, and Zhang (2025) propose five levels according to the person’s role: operator, collaborator, consultant, approver, and observer, and argue that autonomy is a design decision, separate from the model’s capability. The lesson uses a shorter scale (suggests, acts with approval, acts up to a limit, acts alone) with the same idea: more autonomy means more speed and less control, and it is granted action by action according to reversibility. Anthropic (2024) recommends starting with the simplest solution: if the steps are known in advance, a fixed workflow is usually enough; an agent is justified when the path depends on what is observed, and its autonomy brings higher costs and compounding errors, so it should be tested in a sandbox with guardrails.

## In code

\`\`\`python
SHOWTIMES = {"8:00 pm": {"seats": 0, "price": 95}, "9:30 pm": {"seats": 14, "price": 95}}
LIMIT = 300   # permission: above this, the program asks for approval

def find_showtimes(date):
    return {time: dict(s) for time, s in SHOWTIMES.items()}

def buy_tickets(showtime, quantity):
    s = SHOWTIMES[showtime]
    if quantity > s["seats"]:
        raise ValueError("not enough seats")
    s["seats"] -= quantity
    return {"showtime": showtime, "quantity": quantity, "total": quantity * s["price"]}

TOOLS = {"find_showtimes": find_showtimes, "buy_tickets": buy_tickets}

def model(context):
    """A script instead of an LLM: it decides from the last thing in the context."""
    last = context[-1]
    if last["role"] == "user":
        return {"tool": "find_showtimes", "args": {"date": "today"}}
    if last["tool"] == "find_showtimes":
        time = next(t for t, s in last["result"].items() if s["seats"] >= 2)
        return {"tool": "buy_tickets", "args": {"showtime": time, "quantity": 20}}  # mistake: one zero too many
    if last["result"] == "rejected by the person":
        return {"tool": "buy_tickets", "args": {"showtime": "9:30 pm", "quantity": 2}}
    return {"answer": f"Done: {last['result']}"}

def approves(request):   # the human in the loop (here, a rule that mimics their decision)
    print("Approve?", request["args"])
    return request["args"]["quantity"] <= 4

def agent(task, max_steps=6):
    context = [{"role": "user", "text": task}]
    for step in range(1, max_steps + 1):
        decision = model(context)                            # 1. think
        if "answer" in decision:
            return decision["answer"], step
        name, args = decision["tool"], decision["args"]
        if name == "buy_tickets":                            # permission: a rule in the program
            total = args["quantity"] * SHOWTIMES[args["showtime"]]["price"]
            if total > LIMIT and not approves(decision):
                context.append({"role": "result", "tool": name, "result": "rejected by the person"})
                continue
        try:
            result = TOOLS[name](**args)                     # 2. act: the program runs it
        except Exception as e:
            result = f"error: {e}"                           # an error is also an observation
        context.append({"role": "result", "tool": name, "result": result})  # 3. observe
    return "I did not finish.", max_steps

print(agent("Buy two tickets for tonight, for under 300 pesos."))

# Reliability of a chain: each step goes right with p = 0.95
for n in (1, 2, 10, 14, 20, 40):
    print(n, round(0.95 ** n, 2))
\`\`\`

Output:

\`\`\`
Approve? {'showtime': '9:30 pm', 'quantity': 20}
("Done: {'showtime': '9:30 pm', 'quantity': 2, 'total': 190}", 4)
1 0.95
2 0.9
10 0.6
14 0.49
20 0.36
40 0.13
\`\`\`

Swap \`model\` for a call to an LLM and you have the skeleton of a real agent. What a serious product adds is what is only sketched here: input validation, per-tool permissions, step and spending limits, a log of every call, and error handling.

## What comes next

An agent that reads and acts is wrong with confidence: lesson 33 covers hallucinations. Lesson 34 teaches how to measure a system with your own tasks, and lesson 35 covers the risks that tool access opens (for example, instructions hidden in what the agent reads) and how to govern them.`,
  },

  lens: {
    es: [
      'Autonomía es permiso. Define permisos mínimos por herramienta, límites aplicados en el programa (no en el prompt), un registro de cada llamada y aprobación humana antes de lo irreversible: pagar, borrar, enviar. Pregunta: ¿qué es lo peor que podría hacer con las credenciales que tiene?',
      'Pide la tasa de éxito de principio a fin en tareas tan largas como las tuyas, medida con tus datos (lección 34), y cuántas veces sale bien si se repite. El éxito por paso engaña: 95 % por paso son 60 % en diez pasos y 36 % en veinte. Y compara el costo por tarea lograda, no por intento.',
      'Empieza por lo reversible (leer, buscar, redactar borradores) y sube de nivel solo con evidencia. En 2025, Anthropic dejó a un agente con búsqueda web, notas y un canal con clientes al frente de una pequeña tienda de oficina durante un mes, y concluyó que no lo contrataría: cometió demasiados errores.',
      '¿De verdad hace falta un agente? Si los pasos se conocen de antemano, un flujo fijo es más barato, más rápido y más fiable; el agente se justifica cuando el camino depende de lo que observa. Y todo lo que el agente lee (páginas, correos, documentos) entra a su contexto: puede traer instrucciones escondidas (lecciones 31 y 35).',
    ],
    en: [
      'Autonomy is permission. Define minimal permissions per tool, limits enforced in the program (not in the prompt), a log of every call, and human approval before anything irreversible: paying, deleting, sending. Ask: what is the worst it could do with the credentials it holds?',
      'Ask for the end-to-end success rate on tasks as long as yours, measured on your data (lesson 34), and how often it goes right when repeated. Per-step success misleads: 95% per step is 60% over ten steps and 36% over twenty. And compare cost per completed task, not per attempt.',
      'Start with the reversible (reading, searching, drafting) and move up a level only with evidence. In 2025, Anthropic put an agent with web search, notes, and a channel to customers in charge of a small office shop for a month, and concluded it would not hire it: it made too many mistakes.',
      'Do you really need an agent? If the steps are known in advance, a fixed workflow is cheaper, faster, and more reliable; an agent is justified when the path depends on what it observes. And whatever the agent reads (pages, emails, documents) enters its context: it can carry hidden instructions (lessons 31 and 35).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En una llamada a función, ¿quién ejecuta la herramienta?', en: 'In function calling, who runs the tool?' },
      options: [
        { es: 'El propio modelo, desde dentro de sus pesos.', en: 'The model itself, from inside its weights.' },
        { es: 'El programa que rodea al modelo, que luego pega el resultado en el contexto.', en: 'The program around the model, which then pastes the result into the context.' },
        { es: 'La tarjeta gráfica del proveedor, de forma automática.', en: 'The provider’s graphics card, automatically.' },
        { es: 'La persona usuaria, a mano.', en: 'The user, by hand.' },
      ],
      answer: 1,
      why: { es: 'El modelo solo escribe una petición (nombre y datos) como texto. Un programa la valida, ejecuta la función de verdad y devuelve el resultado al contexto. Por eso los permisos pueden, y deben, vivir en ese programa.', en: 'The model only writes a request (a name and data) as text. A program validates it, runs the function for real, and returns the result to the context. That is why permissions can, and should, live in that program.' },
    },
    {
      kind: 'calc',
      q: { es: 'Un agente acierta cada paso el 90 % de las veces. ¿Cuál es la probabilidad de que una tarea de siete pasos salga bien de principio a fin?', en: 'An agent gets each step right 90% of the time. What is the probability that a seven-step task goes right from start to finish?' },
      options: [
        { es: 'Cerca de 90 %', en: 'About 90%' },
        { es: 'Cerca de 70 %', en: 'About 70%' },
        { es: 'Cerca de 48 %', en: 'About 48%' },
        { es: 'Cerca de 30 %', en: 'About 30%' },
      ],
      answer: 2,
      why: { es: '0.9 multiplicado siete veces (0.9 elevado a 7) es cerca de 0.48: los éxitos de cada paso se multiplican. Los errores típicos son ignorar la cadena (90 %) o restar 10 puntos por paso (30 %).', en: '0.9 multiplied seven times (0.9 to the 7th power) is about 0.48: the success of each step multiplies. The typical mistakes are ignoring the chain (90%) or subtracting 10 points per step (30%).' },
    },
    {
      kind: 'concept',
      q: { es: 'El pedido de compra dice «no gastes más de 300 pesos». ¿Por qué eso solo no protege?', en: 'The purchase request says “don’t spend more than 300 pesos.” Why is that alone not a protection?' },
      options: [
        { es: 'Porque el modelo no puede leer números.', en: 'Because the model cannot read numbers.' },
        { es: 'Porque las instrucciones se borran después del primer paso.', en: 'Because instructions are erased after the first step.' },
        { es: 'Porque la herramienta de compra no acepta límites.', en: 'Because the purchase tool does not accept limits.' },
        { es: 'Porque es texto en el contexto: el modelo puede equivocarse o no seguirlo. Un límite en el programa se aplica siempre.', en: 'Because it is text in the context: the model can slip or not follow it. A limit in the program is always applied.' },
      ],
      answer: 3,
      why: { es: 'Una instrucción es un ruego: el modelo suele seguirla, pero puede equivocarse (como al escribir veinte boletos en lugar de dos). Un permiso es una regla en el código que ejecuta la herramienta: por encima del límite, se detiene y pide aprobación, haga lo que haga el modelo.', en: 'An instruction is a plea: the model usually follows it, but it can slip (like writing twenty tickets instead of two). A permission is a rule in the code that runs the tool: above the limit, it stops and asks for approval, whatever the model does.' },
    },
    {
      kind: 'apply',
      q: { es: 'Un equipo quiere un agente que pague facturas de proveedores. ¿Cuál es el diseño inicial más prudente?', en: 'A team wants an agent that pays supplier invoices. What is the most prudent initial design?' },
      options: [
        { es: 'El agente prepara los pagos; una persona aprueba los que superen un límite bajo; todo queda registrado y se mide el error antes de subir el límite.', en: 'The agent prepares the payments; a person approves those above a low limit; everything is logged and the error is measured before raising the limit.' },
        { es: 'Autonomía total, con una instrucción que diga «sé muy cuidadoso».', en: 'Full autonomy, with an instruction that says “be very careful.”' },
        { es: 'Darle permisos de administrador para que no falle por falta de acceso.', en: 'Give it administrator permissions so it never fails for lack of access.' },
        { es: 'Esperar a que los modelos no se equivoquen nunca.', en: 'Wait until models never make mistakes.' },
      ],
      answer: 0,
      why: { es: 'Pagar no se deshace. Se empieza con permisos mínimos, límites aplicados en el código, aprobación humana por encima del límite, registro de cada llamada y medición del error; el límite sube con evidencia. «Sé cuidadoso» es un ruego, no un control.', en: 'Paying cannot be undone. You start with minimal permissions, limits enforced in code, human approval above the limit, a log of every call, and error measurement; the limit rises with evidence. “Be careful” is a plea, not a control.' },
    },
  ],

  glossary: ['language-model', 'token', 'weight', 'context-window', 'system-prompt', 'stateless', 'rag', 'agent', 'tool-use', 'function-calling', 'mcp', 'human-in-the-loop'],

  terms: [
    { id: 'agent', term: { es: 'Agente', en: 'Agent' }, def: { es: 'Sistema que pone a un modelo de lenguaje en un bucle de pensar, actuar y observar: el modelo pide herramientas, un programa las ejecuta y el resultado vuelve a su contexto, hasta cumplir un objetivo.', en: 'A system that puts a language model in a loop of thinking, acting, and observing: the model asks for tools, a program runs them, and the result returns to its context, until a goal is met.' } },
    { id: 'tool-use', term: { es: 'Uso de herramientas', en: 'Tool use' }, def: { es: 'Capacidad de un modelo de pedir que se ejecute una función externa (consultar datos, calcular, comprar) y de usar su resultado. El modelo solo escribe la petición; la ejecuta el programa que lo rodea.', en: 'A model’s ability to ask for an external function to be run (look up data, calculate, buy) and to use its result. The model only writes the request; the program around it runs it.' } },
    { id: 'function-calling', term: { es: 'Llamada a funciones (function calling)', en: 'Function calling' }, def: { es: 'Mecanismo por el que el modelo, en lugar de texto libre, escribe una petición estructurada: el nombre de una herramienta y sus datos. El programa la valida y la ejecuta.', en: 'The mechanism by which the model, instead of free text, writes a structured request: a tool’s name and its data. The program validates and runs it.' } },
    { id: 'mcp', term: { es: 'MCP (Model Context Protocol)', en: 'MCP (Model Context Protocol)' }, def: { es: 'Estándar abierto, publicado por Anthropic en noviembre de 2024, para conectar aplicaciones de IA con herramientas y datos: un servidor las ofrece una sola vez y cualquier aplicación compatible las descubre y las usa.', en: 'An open standard, published by Anthropic in November 2024, for connecting AI applications to tools and data: a server offers them once and any compatible app discovers and uses them.' } },
    { id: 'human-in-the-loop', term: { es: 'Persona en el bucle (human in the loop)', en: 'Human in the loop' }, def: { es: 'Diseño en el que el sistema se detiene antes de ciertas acciones (irreversibles o por encima de un límite) y espera la decisión de una persona: aprobar, corregir o rechazar. Cuesta atención y solo protege si la revisión es real.', en: 'A design in which the system stops before certain actions (irreversible ones, or those over a limit) and waits for a person’s decision: approve, correct, or reject. It costs attention and only protects if the review is real.' } },
  ],

  sources: [
    { title: 'ReAct: Synergizing Reasoning and Acting in Language Models', authors: 'Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao, Y.', year: 2022, url: 'https://arxiv.org/abs/2210.03629' },
    { title: 'Introducing the Model Context Protocol (25 de noviembre de 2024)', authors: 'Anthropic', year: 2024, url: 'https://www.anthropic.com/news/model-context-protocol' },
    { title: 'Model Context Protocol, especificación 2025-06-18: Tools', authors: 'Proyecto Model Context Protocol', year: 2025, url: 'https://modelcontextprotocol.io/specification/2025-06-18/server/tools' },
    { title: 'Linux Foundation Announces the Formation of the Agentic AI Foundation (9 de diciembre de 2025)', authors: 'The Linux Foundation', year: 2025, url: 'https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation' },
    { title: 'Function calling and other API updates (13 de junio de 2023)', authors: 'OpenAI', year: 2023, url: 'https://openai.com/index/function-calling-and-other-api-updates/' },
    { title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', authors: 'Schick, T., Dwivedi-Yu, J., Dessì, R., et al.', year: 2023, url: 'https://arxiv.org/abs/2302.04761' },
    { title: 'τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains', authors: 'Yao, S., Shinn, N., Razavi, P., Narasimhan, K.', year: 2024, url: 'https://arxiv.org/abs/2406.12045' },
    { title: 'Building effective agents (19 de diciembre de 2024)', authors: 'Anthropic', year: 2024, url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { title: 'Levels of Autonomy for AI Agents', authors: 'Feng, K. J. K., McDonald, D. W., Zhang, A. X.', year: 2025, url: 'https://arxiv.org/abs/2506.12469' },
    { title: 'Replit makes vibe-y promise to stop its AI agents making vibe coding disasters (22 de julio de 2025; cobertura periodística del caso)', authors: 'The Register (Sharwood, S.)', year: 2025, url: 'https://www.theregister.com/2025/07/22/replit_saastr_response/' },
    { title: 'Project Vend: Can Claude run a small shop? (27 de junio de 2025)', authors: 'Anthropic y Andon Labs', year: 2025, url: 'https://www.anthropic.com/research/project-vend-1' },
  ],
});
