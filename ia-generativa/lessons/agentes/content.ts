import { defineLesson } from '../../../../../core/define';

export default defineLesson({
  id: 'agentes',

  objectives: {
    es: [
      'Explicar cómo un modelo que solo escribe texto actúa en el mundo: llamadas a funciones, un programa que ejecuta y el bucle de observar, pensar y actuar.',
      'Calcular cómo se acumulan los errores en una cadena de pasos y cómo los puntos de control suben el éxito a cambio de atención humana.',
      'Decidir qué permisos, límites y aprobaciones darle a un agente según lo reversible que sea cada acción.',
    ],
    en: [
      'Explain how a model that only writes text acts in the world: function calls, a program that executes, and the observe-think-act loop.',
      'Calculate how errors pile up along a chain of steps and how checkpoints raise success in exchange for human attention.',
      'Decide which permissions, limits, and approvals to give an agent depending on how reversible each action is.',
    ],
  },

  segments: [
    // ── 1. Un modelo que solo habla, y las herramientas que le dan manos ─────────────────────────
    {
      id: 'hook',
      es: 'Hasta ahora, un modelo de lenguaje hace una sola cosa: recibe texto y devuelve texto. No puede mirar el inventario de hoy ni enviar un pedido.',
      en: 'So far, a language model does one thing: text goes in and text comes out. It cannot look at today’s inventory or send an order.',
    },
    {
      id: 'hands',
      es: 'Para actuar necesita herramientas. Una herramienta es una función de programa con un nombre y argumentos: consultar el inventario, buscar un precio, calcular o hacer un pedido.',
      en: 'To act, it needs tools. A tool is a program function with a name and arguments: check the inventory, look up a price, calculate, or place an order.',
      note: { es: 'Herramienta: una función que el modelo puede pedir que se ejecute.', en: 'Tool: a function the model can ask to have run.' },
    },
    {
      id: 'describe',
      es: 'El modelo no ve el código de esas funciones. Solo recibe su descripción escrita, como texto dentro de su contexto, igual que cualquier otra instrucción.',
      en: 'The model never sees the code of those functions. It only receives a written description, as text inside its context, like any other instruction.',
    },
    {
      id: 'call',
      es: 'Cuando necesita una, no la ejecuta: escribe una llamada, un texto estructurado con el nombre y los argumentos. A eso se le llama llamada a funciones.',
      en: 'When it needs one, it does not run it: it writes a call, structured text with the name and the arguments. That is called function calling.',
      note: { es: 'Llamada a funciones: el modelo escribe qué herramienta usar y con qué datos.', en: 'Function calling: the model writes which tool to use and with what data.' },
    },
    {
      id: 'harness',
      es: 'Quien la ejecuta es el programa que rodea al modelo. Corre la función de verdad, toma el resultado y lo pega en el contexto como un mensaje más.',
      en: 'What runs it is the program around the model. It runs the function for real, takes the result, and pastes it into the context as one more message.',
      pad: 0.3,
    },
    {
      id: 'observe',
      es: 'El modelo lee ese resultado como lee todo lo demás y decide: pedir otra herramienta o dar la respuesta final. Observar, pensar, actuar.',
      en: 'The model reads that result like everything else and decides: ask for another tool or give the final answer. Observe, think, act.',
    },
    {
      id: 'loop',
      es: 'Ese ciclo, repetido hasta cumplir un objetivo, es un agente: un modelo en bucle, con herramientas y su contexto como memoria. En dos mil veintidós se estudió como ReAct.',
      en: 'That cycle, repeated until a goal is met, is an agent: a model in a loop, with tools and its context as memory. In two thousand twenty-two it was studied as ReAct.',
      tts: {
        es: 'Ese ciclo, repetido hasta cumplir un objetivo, es un agente: un modelo en bucle, con herramientas y su contexto como memoria. En dos mil veintidós se estudió como ri-act.',
        en: 'That cycle, repeated until a goal is met, is an agent: a model in a loop, with tools and its context as memory. In two thousand twenty-two it was studied as ree-act.',
      },
      note: { es: 'Agente: un modelo en un bucle de observar, pensar y actuar con herramientas.', en: 'Agent: a model in an observe-think-act loop with tools.' },
      pad: 0.3,
    },

    // ── 2. El agente en vivo (herramientas reales; modelo de guion) ──────────────────────────────
    {
      id: 'demo-intro',
      es: 'Veamos uno trabajar. Las herramientas de esta demostración son reales y corren en tu navegador. El «modelo» es un guion escrito a mano que decide con lo que observa.',
      en: 'Let’s watch one work. The tools in this demo are real and run in your browser. The “model” is a hand-written script that decides from what it observes.',
      pad: 0.3,
    },
    {
      id: 'task',
      es: 'La tarea: reponer las piezas que andan bajas y hacer el pedido al proveedor. Son varios pasos, y cada uno depende de lo que devolvió el anterior.',
      en: 'The task: restock the parts that are running low and place the order with the supplier. It takes several steps, and each depends on what the one before returned.',
    },
    {
      id: 'run-look',
      es: 'Primero mira el inventario. La herramienta devuelve seis filas y el agente las lee: dos piezas están por debajo de su mínimo.',
      en: 'First it looks at the inventory. The tool returns six rows and the agent reads them: two parts are below their minimum.',
      pad: 0.3,
    },
    {
      id: 'run-slip',
      es: 'Luego pide el precio de la primera pieza y, a propósito, escribe mal el código. La herramienta no adivina: devuelve un error. El agente lo lee, corrige y reintenta.',
      en: 'Then it asks for the first part’s price and, on purpose, mistypes the code. The tool does not guess: it returns an error. The agent reads it, fixes it, and retries.',
      pad: 0.6,
    },
    {
      id: 'run-calc',
      es: 'Pide el otro precio y, con los dos en el contexto, llama a una calculadora real: cuatrocientos setenta y nueve dólares con cuarenta centavos.',
      en: 'It asks for the other price and, with both in its context, calls a real calculator: four hundred seventy-nine dollars and forty cents.',
      pad: 0.6,
    },
    {
      id: 'run-order',
      es: 'El último paso es distinto. Hacer el pedido cambia el mundo y no se puede deshacer. Hasta aquí todo fue leer; esto es actuar.',
      en: 'The last step is different. Placing the order changes the world and cannot be undone. So far everything was reading; this is acting.',
      pad: 0.3,
    },
    {
      id: 'run-done',
      es: 'Con el pedido registrado, el agente decide que terminó y responde. Fueron seis llamadas a herramientas y siete consultas al modelo.',
      en: 'With the order on record, the agent decides it is done and answers. That took six tool calls and seven queries to the model.',
      pad: 0.4,
    },

    // ── 3. Lo que cuesta el bucle, el plan y la memoria, y un estándar ──────────────────────────
    {
      id: 'cost-loop',
      es: 'Cada consulta es una llamada completa: el modelo vuelve a leer todo el contexto, desde las instrucciones hasta el último resultado. Por eso cada paso cuesta más que el anterior.',
      en: 'Every query is a full call: the model rereads the whole context, from the instructions to the latest result. That is why each step costs more than the one before.',
      note: { es: 'Cada paso relee todo el contexto: el costo crece más rápido que los pasos.', en: 'Every step rereads the whole context: cost grows faster than the step count.' },
      pad: 0.4,
    },
    {
      id: 'plan-memory',
      es: 'En tareas largas el agente escribe un plan y lo va tachando. Si el contexto se llena, guarda notas fuera, en un archivo o una base de datos, y las relee.',
      en: 'On long tasks the agent writes a plan and ticks items off. If the context fills up, it saves notes outside, in a file or a database, and rereads them.',
      pad: 0.3,
    },
    {
      id: 'mcp',
      es: 'Conectar cada herramienta con cada aplicación era trabajo repetido. MCP, un estándar abierto que Anthropic publicó en noviembre de dos mil veinticuatro, permite ofrecerla una sola vez.',
      en: 'Wiring every tool into every app was repeated work. MCP, an open standard Anthropic published in November two thousand twenty-four, lets a tool be offered just once.',
      tts: {
        es: 'Conectar cada herramienta con cada aplicación era trabajo repetido. eme ce pe, un estándar abierto que Anthropic publicó en noviembre de dos mil veinticuatro, permite ofrecerla una sola vez.',
        en: 'Wiring every tool into every app was repeated work. M C P, an open standard Anthropic published in November two thousand twenty-four, lets a tool be offered just once.',
      },
      note: { es: 'MCP: un estándar abierto para conectar herramientas y datos a cualquier asistente.', en: 'MCP: an open standard for plugging tools and data into any assistant.' },
      pad: 0.4,
    },

    // ── 4. Fiabilidad: los errores se acumulan ───────────────────────────────────────────────────
    {
      id: 'chain',
      es: 'Hay un segundo riesgo, más silencioso: los errores se acumulan. Supón que cada paso sale bien el noventa y cinco por ciento de las veces. Suena casi perfecto.',
      en: 'There is a second, quieter risk: errors pile up. Suppose each step goes right ninety-five percent of the time. That sounds almost perfect.',
    },
    {
      id: 'compound',
      es: 'Pero un agente necesita que todos los pasos salgan bien. Con diez pasos, cero coma noventa y cinco multiplicado diez veces da cerca de sesenta por ciento. Con veinte, apenas treinta y seis.',
      en: 'But an agent needs every step to go right. Over ten steps, zero point nine five multiplied ten times gives about sixty percent. Over twenty, barely thirty-six.',
      note: { es: 'Éxito de la cadena = éxito por paso elevado al número de pasos.', en: 'Chain success = per-step success raised to the number of steps.' },
      pad: 0.6,
    },
    {
      id: 'grid',
      es: 'No es solo una fórmula. Aquí corremos cien veces el mismo agente, y cada cuadro es una corrida: lleva una cruz si algún paso falló. Supone errores independientes.',
      en: 'It is not just a formula. Here we run the same agent a hundred times, and each square is one run: it gets a cross if any step failed. It assumes independent errors.',
      pad: 0.6,
    },
    {
      id: 'try-rel',
      es: 'Tu turno: sube los pasos hasta que el éxito cruce la mitad, y luego baja la precisión por paso. Mira cuánto cambia.',
      en: 'Your turn: raise the steps until success crosses one half, then lower the per-step accuracy. See how much it changes.',
      gate: {
        id: 'cross',
        prompt: { es: 'Encuentra el número de pasos en que el éxito cruza el 50 %.', en: 'Find the number of steps at which success crosses 50%.' },
      },
      pad: 0.4,
    },
    {
      id: 'cost-success',
      es: 'Y hay un costo oculto. Cada intento fallido se paga igual, así que el costo por tarea lograda es el costo del intento dividido entre la probabilidad de éxito.',
      en: 'And there is a hidden cost. A failed attempt is paid for all the same, so the cost per completed task is the cost of an attempt divided by the probability of success.',
      note: { es: 'Costo por tarea lograda = costo por intento ÷ probabilidad de éxito.', en: 'Cost per completed task = cost per attempt ÷ probability of success.' },
      pad: 0.4,
    },
    {
      id: 'real',
      es: 'En τ-bench, en dos mil veinticuatro, agentes como GPT-4o resolvían menos de la mitad de las tareas; en comercio minorista, menos de una cuarta parte las resolvía ocho veces seguidas.',
      en: 'On τ-bench in two thousand twenty-four, agents like GPT-4o solved fewer than half the tasks; in retail, fewer than a quarter solved them eight times in a row.',
      tts: {
        es: 'En tau bench, en dos mil veinticuatro, agentes como ge pe te cuatro o resolvían menos de la mitad de las tareas; en comercio minorista, menos de una cuarta parte las resolvía ocho veces seguidas.',
        en: 'On tau bench in two thousand twenty-four, agents like G P T four o solved fewer than half the tasks; in retail, fewer than a quarter solved them eight times in a row.',
      },
      pad: 0.4,
    },
    {
      id: 'horizon',
      es: 'Hay buenas noticias: según METR, desde dos mil diecinueve la duración de las tareas de software que un agente completa la mitad de las veces se ha duplicado cerca de cada siete meses.',
      en: 'There is good news: according to METR, since two thousand nineteen the length of the software tasks an agent completes half the time has doubled about every seven months.',
      tts: {
        es: 'Hay buenas noticias: según meter, desde dos mil diecinueve la duración de las tareas de software que un agente completa la mitad de las veces se ha duplicado cerca de cada siete meses.',
        en: 'There is good news: according to meter, since two thousand nineteen the length of the software tasks an agent completes half the time has doubled about every seven months.',
      },
      pad: 0.4,
    },

    // ── 5. Contener el error: puntos de control, permisos y niveles de autonomía ────────────────
    {
      id: 'checkpoints',
      es: '¿Cómo se sube ese techo? Con puntos de control: cada cierto número de pasos una persona revisa el avance y, si ve un error, ese tramo se repite.',
      en: 'How do you raise that ceiling? With checkpoints: every so many steps a person reviews the progress and, if they spot an error, that stretch is redone.',
      pad: 0.6,
    },
    {
      id: 'try-chk',
      es: 'Tu turno: elige cada cuántos pasos se revisa. Busca al menos ochenta y cinco por ciento de éxito con el menor número de revisiones y de pasos repetidos.',
      en: 'Your turn: choose how often to review. Look for at least eighty-five percent success with the fewest reviews and repeated steps.',
      gate: {
        id: 'chk',
        prompt: { es: 'Logra al menos 85 % de éxito con 4 revisiones o menos y 35 pasos del agente o menos.', en: 'Reach at least 85% success with 4 reviews or fewer and 35 agent steps or fewer.' },
      },
      pad: 0.4,
    },
    {
      id: 'tradeoff',
      es: 'Revisar en cada paso apenas mejora a revisar cada cinco, con mucha más atención. El techo lo pone quien revisa: si deja pasar uno de cada diez errores, no llegas al cien por ciento.',
      en: 'Reviewing every step barely beats reviewing every fifth, and takes far more attention. The reviewer sets the ceiling: if one error in ten slips by, you never reach one hundred percent.',
      pad: 0.5,
    },
    {
      id: 'incident',
      es: 'Esto ya ocurrió. En julio de dos mil veinticinco, un agente de programación de Replit borró una base de datos de producción durante una congelación de cambios, según reportó su usuario.',
      en: 'This has already happened. In July two thousand twenty-five, a coding agent from Replit deleted a production database during a code freeze, as its user reported.',
      pad: 0.4,
    },
    {
      id: 'perm',
      es: 'Una instrucción no es un permiso. Pedirle al modelo «no gastes más de quinientos dólares» es un ruego; un permiso es una regla en el programa que no depende de su obediencia.',
      en: 'An instruction is not a permission. Asking the model “do not spend over five hundred dollars” is a plea; a permission is a rule in the program, whatever the model does.',
      note: { es: 'Permisos: reglas en el programa, no ruegos al modelo.', en: 'Permissions: rules in the program, not pleas to the model.' },
      pad: 0.4,
    },
    {
      id: 'levels',
      es: 'La autonomía se gradúa. El agente puede solo sugerir, actuar con tu aprobación, actuar hasta un límite o actuar solo. Cada escalón gana velocidad y pierde control.',
      en: 'Autonomy comes in degrees. The agent can only suggest, act with your approval, act up to a limit, or act on its own. Each rung gains speed and loses control.',
      pad: 0.5,
    },
    {
      id: 'try-agent',
      es: 'Tu turno: elige «Error de cantidad», donde el agente pide demasiadas piezas, y córrelo con el límite al máximo. Después bájalo a quinientos y decide tú.',
      en: 'Your turn: pick “Quantity slip,” where the agent orders far too many parts, and run it with the limit at maximum. Then lower it to five hundred and decide yourself.',
      gate: {
        id: 'autonomy',
        prompt: { es: 'Corre «Error de cantidad» sin límite y luego con límite de 500, y decide sobre el pedido pendiente.', en: 'Run “Quantity slip” with no limit, then with a limit of 500, and decide on the pending order.' },
      },
      pad: 0.4,
    },
    {
      id: 'hitl',
      es: 'Eso es tener una persona en el bucle: el agente se detiene antes de la acción de riesgo y espera. Cuesta atención, y solo protege si la persona lee las cifras de verdad.',
      en: 'That is a human in the loop: the agent stops before the risky action and waits. It costs attention, and it only protects if the person really reads the numbers.',
      note: { es: 'Persona en el bucle: el agente pide aprobación antes de lo riesgoso.', en: 'Human in the loop: the agent asks for approval before the risky step.' },
      pad: 0.4,
    },
    {
      id: 'start-small',
      es: 'Por eso se empieza con acciones que se puedan deshacer: leer, resumir, redactar borradores. Lo irreversible, como pagar o borrar, se gana poco a poco, con registros y aprobación.',
      en: 'That is why you start with actions that can be undone: reading, summarizing, drafting. The irreversible, like paying or deleting, is earned step by step, with logs and approval.',
      pad: 0.4,
    },
    {
      id: 'bridge',
      es: 'Ya sabes cómo se construye un asistente que lee y actúa. Falta lo más importante: usarlo con criterio, empezando por su error más famoso, la alucinación.',
      en: 'Now you know how an assistant that reads and acts is built. What is left is the most important part: using it with judgment, starting with its most famous mistake, hallucination.',
    },
  ],

  keyIdeas: {
    es: [
      'Un modelo solo escribe texto. Una herramienta es una función que un programa ejecuta cuando el modelo escribe una llamada con su nombre y sus argumentos.',
      'Un agente es un modelo en un bucle: observa un resultado, piensa, actúa con otra herramienta y repite hasta cumplir el objetivo. Su contexto es su memoria de trabajo.',
      'Cada paso relee todo el contexto, así que el costo crece más rápido que el número de pasos, y un intento fallido se paga igual: costo por tarea lograda = costo por intento ÷ probabilidad de éxito.',
      'Los errores se acumulan: con 95 % de acierto por paso, diez pasos salen bien cerca del 60 % de las veces y veinte, del 36 %. Los puntos de control suben el éxito a cambio de atención humana.',
      'La seguridad se construye en el programa, no en el prompt: permisos mínimos, límites en código, registro, aprobación antes de lo irreversible, y autonomía que sube solo con evidencia.',
    ],
    en: [
      'A model only writes text. A tool is a function that a program runs when the model writes a call with its name and arguments.',
      'An agent is a model in a loop: it observes a result, thinks, acts with another tool, and repeats until the goal is met. Its context is its working memory.',
      'Every step rereads the whole context, so cost grows faster than the number of steps, and a failed attempt is paid for all the same: cost per completed task = cost per attempt ÷ probability of success.',
      'Errors pile up: at 95% accuracy per step, ten steps go right about 60% of the time and twenty, 36%. Checkpoints raise success in exchange for human attention.',
      'Safety is built in the program, not in the prompt: minimal permissions, limits in code, logs, approval before the irreversible, and autonomy that rises only with evidence.',
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

1. el modelo recibe el contexto completo (instrucciones, descripción de las herramientas, tarea e historial) y produce *o* una llamada (nombre y argumentos) *o* la respuesta final;
2. el programa valida la llamada, aplica los permisos y ejecuta la función;
3. el resultado se agrega al historial como un mensaje más y se vuelve al paso 1, hasta que el modelo responde o se agota un límite de pasos.

Esa es la idea de ReAct (Yao et al., 2022): intercalar razonamiento y acción, de modo que cada observación corrija el siguiente razonamiento. Desde 2023 las interfaces de los proveedores (por ejemplo, la «llamada a funciones» que OpenAI lanzó en junio de 2023) hacen que el modelo emita la llamada en un formato estructurado más fiable.

## Una llamada a funciones, por dentro

Una herramienta se describe con un nombre, una descripción y un esquema de sus argumentos (JSON Schema). Los nombres de los campos cambian de un proveedor a otro; la idea es la misma:

\`\`\`json
// lo que el modelo recibe (como texto) en su contexto
{ "name": "precio", "description": "Precio unitario de una pieza.",
  "input_schema": { "type": "object", "properties": { "sku": { "type": "string" } }, "required": ["sku"] } }

// lo que el modelo escribe: una llamada, no una ejecución
{ "name": "precio", "input": { "sku": "COJ-6204" } }
\`\`\`

El modelo no ejecuta nada: produce el texto de la llamada. El programa debe tratar esos argumentos como **entrada no confiable**: validarlos, limitarlos y registrarlos.

**MCP** (Model Context Protocol) estandariza esa conexión. Los mensajes son JSON-RPC 2.0: el cliente (la aplicación) pide \`tools/list\` para descubrir las herramientas de un servidor y \`tools/call\` para invocar una, y el resultado vuelve con un indicador \`isError\`. La especificación recomienda que haya siempre una persona en el bucle, con la posibilidad de rechazar invocaciones, y que el cliente muestre las entradas antes de llamar al servidor. En diciembre de 2025 Anthropic aportó MCP a la Agentic AI Foundation, una fundación creada bajo la Linux Foundation.

## Fiabilidad de una cadena

Si cada paso sale bien con probabilidad $p$, de forma independiente, una tarea de $n$ pasos sale bien con probabilidad

$$P = p^{\\,n}$$

Con $p = 0{,}95$: $P(10)\\approx 0{,}60$, $P(20)\\approx 0{,}36$ y $P(50)\\approx 0{,}08$. El número de pasos en que el éxito cae a la mitad es

$$n_{50} = \\frac{\\ln 0{,}5}{\\ln p} \\approx 13{,}5 \\quad (p = 0{,}95)$$

Es un modelo simplificado: supone errores independientes y que cualquier error arruina la corrida. En la práctica los errores se correlacionan (un mal plan arrastra los pasos siguientes) y a veces el agente se recupera solo, como en la demostración. Por eso la tasa de éxito de extremo a extremo se **mide**, no se calcula.

### Puntos de control

Un tramo de $m$ pasos sale bien con $P = p^{m}$. Una persona lo revisa y detecta un error con probabilidad $q$; si lo detecta, el tramo se repite. Un intento termina (se acepta) con probabilidad $P + (1-P)(1-q)$, de modo que

$$s = \\frac{P}{P + (1-P)(1-q)}, \\qquad \\text{intentos esperados} = \\frac{1}{P + (1-P)(1-q)}$$

El éxito total es el producto de los $s$ de todos los tramos. Con $p = 0{,}95$, $n = 20$ y $q = 0{,}9$: sin revisar, 35,8 %; revisando cada 10 pasos, 87,8 % (3,1 revisiones y 31 pasos del agente); cada 5, 89,1 % (5,0 revisiones); en cada paso, 90,0 % (20,9 revisiones). El techo lo fija $q$: aun revisando todo, el éxito no pasa de $\\approx 100\\,\\%-n(1-p)(1-q)$.

## Costo

Si cada consulta relee las instrucciones y las definiciones ($B$ tokens) más todo el historial, y cada paso agrega $g$ tokens, el total leído en $n$ pasos es

$$\\sum_{k=1}^{n}\\bigl(B + (k-1)\\,g\\bigr) = nB + g\\,\\frac{n(n-1)}{2}$$

Crece como $n^2$. Con los supuestos de la lección ($B = 2000$, $g = 800$, US$ 3 por millón de tokens leídos): 10 pasos son 56 000 tokens (US$ 0,17), 20 pasos son 192 000 (US$ 0,58) y 40 pasos son 704 000 (US$ 2,11). Dividido entre la probabilidad de éxito, el costo por tarea lograda, con $p = 0{,}95$, es US$ 0,28, US$ 1,61 y US$ 16,43. Los proveedores cobran las lecturas de caché a una fracción del precio normal (en la documentación de Anthropic, una décima parte para la mayoría de los modelos y menos aún para algunos), pero lo repetido se sigue leyendo y se sigue pagando algo.

## Niveles de autonomía

Feng, McDonald y Zhang (2025) proponen cinco niveles según el papel de la persona: operador, colaborador, consultor, aprobador y observador, y sostienen que la autonomía es una decisión de diseño, separada de la capacidad del modelo. La lección usa una escala más corta (sugiere, aprueba, actúa hasta un límite, actúa sola) con la misma idea: más autonomía es más velocidad y menos control, y se concede acción por acción según su reversibilidad.

## En código

\`\`\`python
PRECIOS = {"COJ-6204": 8.50}

def precio(sku):
    if sku not in PRECIOS:
        raise KeyError(f"el código {sku!r} no existe")
    return PRECIOS[sku]

def multiplicar(a, b):
    return round(a * b, 2)

HERRAMIENTAS = {"precio": precio, "multiplicar": multiplicar}

def modelo(historial):
    """Guion en lugar de un LLM: decide a partir del último mensaje."""
    ult = historial[-1]
    if ult["rol"] == "usuario":                      # primera llamada, con un código mal escrito
        return {"llamada": {"herramienta": "precio", "args": {"sku": "COJ6204"}}}
    if ult["contenido"].startswith("error"):         # un error también es una observación
        return {"llamada": {"herramienta": "precio", "args": {"sku": "COJ-6204"}}}
    if ult["herramienta"] == "precio":
        return {"llamada": {"herramienta": "multiplicar", "args": {"a": 28, "b": float(ult["contenido"])}}}
    return {"respuesta": f"28 cojinetes cuestan {ult['contenido']} dólares."}

def agente(tarea, max_pasos=8):
    historial = [{"rol": "usuario", "contenido": tarea}]
    for paso in range(1, max_pasos + 1):
        decision = modelo(historial)                 # 1. pensar
        if "respuesta" in decision:
            return decision["respuesta"], paso
        c = decision["llamada"]
        try:                                         # 2. actuar: ejecuta el programa, no el modelo
            resultado = str(HERRAMIENTAS[c["herramienta"]](**c["args"]))
        except Exception as e:
            resultado = f"error: {e}"
        historial.append({"rol": "resultado", "herramienta": c["herramienta"], "contenido": resultado})  # 3. observar
    return "No terminé.", max_pasos

print(agente("¿Cuánto cuestan 28 cojinetes?"))
# ('28 cojinetes cuestan 238.0 dólares.', 4)
\`\`\`

Cambia \`modelo\` por una llamada a un LLM y tendrás el esqueleto de un agente real. Lo que añade un producto serio es lo que aquí falta: validación de argumentos, permisos, límites de pasos y de gasto, registro de cada llamada, y manejo de errores.

## Lo que viene

Un agente que lee y actúa se equivoca con aplomo: la lección 33 trata las alucinaciones. La 34 enseña a medir un sistema con tus propias tareas, y la 35, los riesgos que abre dar acceso a herramientas (por ejemplo, instrucciones escondidas en lo que el agente lee) y cómo gobernarlos.`,
    en: `## The agent loop

An agent is a program with three parts: a **model** that decides, a set of **tools** (functions), and a **loop** that connects them. On each turn:

1. the model receives the full context (instructions, tool descriptions, task, and history) and produces *either* a call (name and arguments) *or* the final answer;
2. the program validates the call, applies the permissions, and runs the function;
3. the result is added to the history as one more message and we go back to step 1, until the model answers or a step limit runs out.

That is the idea behind ReAct (Yao et al., 2022): interleave reasoning and acting so that each observation corrects the next reasoning step. Since 2023, providers’ interfaces (for example, the “function calling” OpenAI launched in June 2023) make the model emit the call in a more reliable structured format.

## A function call, inside

A tool is described by a name, a description, and a schema of its arguments (JSON Schema). Field names vary from provider to provider; the idea is the same:

\`\`\`json
// what the model receives (as text) in its context
{ "name": "get_price", "description": "Unit price of a part.",
  "input_schema": { "type": "object", "properties": { "sku": { "type": "string" } }, "required": ["sku"] } }

// what the model writes: a call, not an execution
{ "name": "get_price", "input": { "sku": "COJ-6204" } }
\`\`\`

The model runs nothing: it produces the text of the call. The program must treat those arguments as **untrusted input**: validate them, bound them, and log them.

**MCP** (Model Context Protocol) standardizes that connection. Messages are JSON-RPC 2.0: the client (the application) sends \`tools/list\` to discover a server’s tools and \`tools/call\` to invoke one, and the result comes back with an \`isError\` flag. The specification recommends that there always be a human in the loop with the ability to deny invocations, and that the client show the inputs before calling the server. In December 2025 Anthropic contributed MCP to the Agentic AI Foundation, a foundation created under the Linux Foundation.

## Reliability of a chain

If each step goes right with probability $p$, independently, a task of $n$ steps goes right with probability

$$P = p^{\\,n}$$

With $p = 0.95$: $P(10)\\approx 0.60$, $P(20)\\approx 0.36$, and $P(50)\\approx 0.08$. The number of steps at which success falls to one half is

$$n_{50} = \\frac{\\ln 0.5}{\\ln p} \\approx 13.5 \\quad (p = 0.95)$$

This is a simplified model: it assumes independent errors and that any error ruins the run. In practice errors correlate (a bad plan drags down the steps after it) and sometimes the agent recovers on its own, as in the demo. That is why end-to-end success is **measured**, not computed.

### Checkpoints

A stretch of $m$ steps goes right with $P = p^{m}$. A person reviews it and catches an error with probability $q$; if caught, the stretch is redone. An attempt ends (is accepted) with probability $P + (1-P)(1-q)$, so

$$s = \\frac{P}{P + (1-P)(1-q)}, \\qquad \\text{expected attempts} = \\frac{1}{P + (1-P)(1-q)}$$

Total success is the product of the $s$ of all stretches. With $p = 0.95$, $n = 20$, and $q = 0.9$: no review, 35.8%; reviewing every 10 steps, 87.8% (3.1 reviews and 31 agent steps); every 5, 89.1% (5.0 reviews); at every step, 90.0% (20.9 reviews). The ceiling is set by $q$: even reviewing everything, success does not exceed $\\approx 100\\,\\%-n(1-p)(1-q)$.

## Cost

If each query rereads the instructions and definitions ($B$ tokens) plus the whole history, and each step adds $g$ tokens, the total read over $n$ steps is

$$\\sum_{k=1}^{n}\\bigl(B + (k-1)\\,g\\bigr) = nB + g\\,\\frac{n(n-1)}{2}$$

It grows like $n^2$. With the lesson’s assumptions ($B = 2000$, $g = 800$, $3 per million tokens read): 10 steps is 56,000 tokens ($0.17), 20 steps is 192,000 ($0.58), and 40 steps is 704,000 ($2.11). Divided by the probability of success, the cost per completed task with $p = 0.95$ is $0.28, $1.61, and $16.43. Providers charge cache reads at a fraction of the normal price (in Anthropic’s documentation, a tenth for most models and less still for some), but what is repeated is still read and still costs something.

## Levels of autonomy

Feng, McDonald, and Zhang (2025) propose five levels according to the person’s role: operator, collaborator, consultant, approver, and observer, and argue that autonomy is a design decision, separate from the model’s capability. The lesson uses a shorter scale (suggests, approves, acts up to a limit, acts alone) with the same idea: more autonomy means more speed and less control, and it is granted action by action according to reversibility.

## In code

\`\`\`python
PRECIOS = {"COJ-6204": 8.50}

def precio(sku):
    if sku not in PRECIOS:
        raise KeyError(f"el código {sku!r} no existe")
    return PRECIOS[sku]

def multiplicar(a, b):
    return round(a * b, 2)

HERRAMIENTAS = {"precio": precio, "multiplicar": multiplicar}

def modelo(historial):
    """A script instead of an LLM: it decides from the last message."""
    ult = historial[-1]
    if ult["rol"] == "usuario":                      # first call, with a mistyped code
        return {"llamada": {"herramienta": "precio", "args": {"sku": "COJ6204"}}}
    if ult["contenido"].startswith("error"):         # an error is also an observation
        return {"llamada": {"herramienta": "precio", "args": {"sku": "COJ-6204"}}}
    if ult["herramienta"] == "precio":
        return {"llamada": {"herramienta": "multiplicar", "args": {"a": 28, "b": float(ult["contenido"])}}}
    return {"respuesta": f"28 bearings cost {ult['contenido']} dollars."}

def agente(tarea, max_pasos=8):
    historial = [{"rol": "usuario", "contenido": tarea}]
    for paso in range(1, max_pasos + 1):
        decision = modelo(historial)                 # 1. think
        if "respuesta" in decision:
            return decision["respuesta"], paso
        c = decision["llamada"]
        try:                                         # 2. act: the program runs it, not the model
            resultado = str(HERRAMIENTAS[c["herramienta"]](**c["args"]))
        except Exception as e:
            resultado = f"error: {e}"
        historial.append({"rol": "resultado", "herramienta": c["herramienta"], "contenido": resultado})  # 3. observe
    return "I did not finish.", max_pasos

print(agente("How much do 28 bearings cost?"))
# ('28 bearings cost 238.0 dollars.', 4)
\`\`\`

Swap \`modelo\` for a call to an LLM and you have the skeleton of a real agent. What a serious product adds is what is missing here: argument validation, permissions, step and spending limits, a log of every call, and error handling.

## What comes next

An agent that reads and acts is wrong with confidence: lesson 33 covers hallucinations. Lesson 34 teaches how to measure a system with your own tasks, and lesson 35 covers the risks that tool access opens (for example, instructions hidden in what the agent reads) and how to govern them.`,
  },

  lens: {
    es: [
      'Autonomía es permiso. Define permisos mínimos y límites aplicados en el programa (no en el prompt), registro de cada llamada y aprobación humana antes de lo irreversible: pagar, borrar, enviar. Pregunta: ¿qué es lo peor que podría hacer con las credenciales que tiene?',
      'Pide la tasa de éxito de extremo a extremo en tareas de la longitud de las tuyas, medida con tus datos (lección 34), y el costo por tarea lograda, no por intento. El éxito por paso engaña: 95 % por paso son 60 % en diez pasos y 36 % en veinte.',
      'Empieza por lo reversible (leer, resumir, redactar borradores) y sube de nivel solo con evidencia. En 2025 Anthropic probó un agente con búsqueda, correo y notas al frente de una tienda de oficina durante un mes y concluyó que no lo contrataría: cometió demasiados errores.',
      '¿De verdad hace falta un agente? Si los pasos son conocidos, un flujo fijo es más barato, más rápido y más fiable; el agente se justifica cuando el camino depende de lo que se observa. Y lo que el agente lee (páginas, correos, documentos) entra a su contexto: puede traer instrucciones ocultas (lección 35).',
    ],
    en: [
      'Autonomy is permission. Define minimal permissions and limits enforced in the program (not in the prompt), a log of every call, and human approval before the irreversible: paying, deleting, sending. Ask: what is the worst it could do with the credentials it holds?',
      'Ask for end-to-end success rate on tasks as long as yours, measured on your data (lesson 34), and for cost per completed task, not per attempt. Per-step success misleads: 95% per step is 60% over ten steps and 36% over twenty.',
      'Start with the reversible (reading, summarizing, drafting) and move up a level only with evidence. In 2025 Anthropic put an agent with search, email, and notes in charge of an office shop for a month and concluded it would not hire it: it made too many mistakes.',
      'Do you really need an agent? If the steps are known, a fixed workflow is cheaper, faster, and more reliable; an agent is justified when the path depends on what is observed. And whatever the agent reads (pages, emails, documents) enters its context: it can carry hidden instructions (lesson 35).',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'En una llamada a funciones, ¿quién ejecuta la herramienta?', en: 'In function calling, who runs the tool?' },
      options: [
        { es: 'El propio modelo, desde dentro de sus pesos.', en: 'The model itself, from inside its weights.' },
        { es: 'El programa que rodea al modelo, que luego pega el resultado en el contexto.', en: 'The program around the model, which then pastes the result into the context.' },
        { es: 'La GPU del proveedor, de forma automática.', en: 'The provider’s GPU, automatically.' },
        { es: 'La persona usuaria, a mano.', en: 'The user, by hand.' },
      ],
      answer: 1,
      why: { es: 'El modelo solo escribe una llamada (nombre y argumentos) como texto. Un programa la valida, ejecuta la función de verdad y devuelve el resultado al contexto. Por eso los permisos pueden y deben vivir en ese programa.', en: 'The model only writes a call (name and arguments) as text. A program validates it, runs the function for real, and returns the result to the context. That is why permissions can, and should, live in that program.' },
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
      why: { es: '0,9 elevado a 7 es cerca de 0,48: los éxitos se multiplican. Los errores típicos son ignorar la cadena (90 %) o restar 10 % por paso (30 %).', en: '0.9 raised to the 7th power is about 0.48: successes multiply. The typical mistakes are ignoring the chain (90%) or subtracting 10% per step (30%).' },
    },
    {
      kind: 'concept',
      q: { es: '¿Por qué el costo de un agente crece más rápido que su número de pasos?', en: 'Why does the cost of an agent grow faster than its number of steps?' },
      options: [
        { es: 'Cada paso usa un modelo más grande.', en: 'Every step uses a bigger model.' },
        { es: 'Las herramientas cobran más cada vez que se las llama.', en: 'Tools charge more each time they are called.' },
        { es: 'El modelo se reentrena mientras trabaja.', en: 'The model retrains while it works.' },
        { es: 'Cada paso relee todo el contexto acumulado, que es cada vez más largo.', en: 'Every step rereads the whole accumulated context, which keeps getting longer.' },
      ],
      answer: 3,
      why: { es: 'En cada consulta el modelo recibe de nuevo las instrucciones y todo el historial. Con n pasos, lo leído en total crece como n² (el caché abarata lo repetido, no lo elimina), y además los intentos fallidos se pagan igual.', en: 'On every query the model receives the instructions and the whole history again. Over n steps, the total read grows like n² (caching makes repeats cheaper, not free), and failed attempts are paid for all the same.' },
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
      why: { es: 'Pagar es irreversible. Se empieza con permisos mínimos, límites aplicados en código, aprobación humana por encima del límite, registro de cada llamada y medición del error; el límite sube con evidencia. «Sé cuidadoso» es un ruego, no un control.', en: 'Paying is irreversible. You start with minimal permissions, limits enforced in code, human approval above the limit, a log of every call, and error measurement; the limit rises with evidence. “Be careful” is a plea, not a control.' },
    },
  ],

  glossary: ['language-model', 'token', 'context-window', 'system-prompt', 'rag'],

  terms: [
    { id: 'agent', term: { es: 'Agente', en: 'Agent' }, def: { es: 'Sistema que pone a un modelo de lenguaje en un bucle de observar, pensar y actuar: el modelo elige herramientas, un programa las ejecuta y el resultado vuelve al contexto, hasta cumplir un objetivo.', en: 'A system that puts a language model in an observe-think-act loop: the model picks tools, a program runs them, and the result returns to the context, until a goal is met.' } },
    { id: 'tool-use', term: { es: 'Uso de herramientas', en: 'Tool use' }, def: { es: 'Capacidad de un modelo de pedir que se ejecute una función externa (consultar datos, calcular, enviar un correo) y de usar su resultado. El modelo solo escribe la petición; la ejecuta el programa que lo rodea.', en: 'A model’s ability to ask for an external function to be run (look up data, calculate, send an email) and to use its result. The model only writes the request; the program around it runs it.' } },
    { id: 'function-calling', term: { es: 'Llamada a funciones', en: 'Function calling' }, def: { es: 'Mecanismo por el que el modelo, en lugar de texto libre, produce una llamada estructurada: el nombre de una herramienta y sus argumentos. El programa la valida y la ejecuta.', en: 'The mechanism by which the model, instead of free text, produces a structured call: a tool’s name and its arguments. The program validates and runs it.' } },
    { id: 'mcp', term: { es: 'MCP (Model Context Protocol)', en: 'MCP (Model Context Protocol)' }, def: { es: 'Estándar abierto, publicado por Anthropic en noviembre de 2024, para conectar aplicaciones de IA con herramientas y datos: un servidor las ofrece una sola vez y cualquier cliente compatible las descubre y las usa, con mensajes JSON-RPC.', en: 'An open standard, published by Anthropic in November 2024, for connecting AI applications to tools and data: a server offers them once and any compatible client discovers and uses them, with JSON-RPC messages.' } },
    { id: 'human-in-the-loop', term: { es: 'Persona en el bucle', en: 'Human in the loop' }, def: { es: 'Diseño en el que el sistema se detiene antes de ciertas acciones y espera la decisión de una persona: aprobar, corregir o rechazar. Cuesta atención y solo protege si la revisión es real.', en: 'A design in which the system stops before certain actions and waits for a person’s decision: approve, correct, or reject. It costs attention and only protects if the review is real.' } },
  ],

  sources: [
    { title: 'ReAct: Synergizing Reasoning and Acting in Language Models', authors: 'Yao, S., Zhao, J., Yu, D., Du, N., Shafran, I., Narasimhan, K., Cao, Y.', year: 2022, url: 'https://arxiv.org/abs/2210.03629' },
    { title: 'Introducing the Model Context Protocol (25 de noviembre de 2024)', authors: 'Anthropic', year: 2024, url: 'https://www.anthropic.com/news/model-context-protocol' },
    { title: 'Model Context Protocol, especificación 2025-06-18: Tools y mensajes base', authors: 'Proyecto Model Context Protocol', year: 2025, url: 'https://modelcontextprotocol.io/specification/2025-06-18/server/tools' },
    { title: 'Building effective agents (19 de diciembre de 2024)', authors: 'Anthropic', year: 2024, url: 'https://www.anthropic.com/engineering/building-effective-agents' },
    { title: 'τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains', authors: 'Yao, S., Shinn, N., Razavi, P., Narasimhan, K.', year: 2024, url: 'https://arxiv.org/abs/2406.12045' },
    { title: 'Measuring AI Ability to Complete Long Software Tasks', authors: 'Kwa, T., West, B., Becker, J., et al. (METR)', year: 2025, url: 'https://arxiv.org/abs/2503.14499' },
    { title: 'Levels of Autonomy for AI Agents', authors: 'Feng, K. J. K., McDonald, D. W., Zhang, A. X.', year: 2025, url: 'https://arxiv.org/abs/2506.12469' },
    { title: 'Toolformer: Language Models Can Teach Themselves to Use Tools', authors: 'Schick, T., Dwivedi-Yu, J., Dessì, R., et al.', year: 2023, url: 'https://arxiv.org/abs/2302.04761' },
    { title: 'Function calling and other API updates (13 de junio de 2023)', authors: 'OpenAI', year: 2023, url: 'https://openai.com/index/function-calling-and-other-api-updates/' },
    { title: 'Not what you’ve signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection', authors: 'Greshake, K., Abdelnabi, S., Mishra, S., Endres, C., Holz, T., Fritz, M.', year: 2023, url: 'https://arxiv.org/abs/2302.12173' },
    { title: 'Project Vend: Can Claude run a small shop? (27 de junio de 2025)', authors: 'Anthropic y Andon Labs', year: 2025, url: 'https://www.anthropic.com/research/project-vend-1' },
    { title: 'Replit makes vibe-y promise to stop its AI agents making vibe coding disasters (22 de julio de 2025; cobertura periodística del caso)', authors: 'The Register', year: 2025, url: 'https://www.theregister.com/2025/07/22/replit_saastr_response/' },
    { title: 'Linux Foundation Announces the Formation of the Agentic AI Foundation (9 de diciembre de 2025)', authors: 'The Linux Foundation', year: 2025, url: 'https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation' },
    { title: 'Prompt caching (documentación de precios de lectura de caché)', authors: 'Anthropic', year: 2025, url: 'https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching' },
  ],
});
