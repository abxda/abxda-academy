import { defineLesson } from '../../../../../core/define';
import type { Lang, Segment } from '../../../../../core/types';

// Pronunciación para la voz sintética. Se aplica sobre el texto de cada segmento: el subtítulo conserva «Gartner»,
// «Microsoft» o «LinkedIn», y la voz dice «gártner», «máicrosoft» o «línkedin». (Las cifras van con letras.)
const SAY: Record<Lang, [RegExp, string][]> = {
  es: [
    [/Gartner/g, 'Gártner'], [/Microsoft/g, 'Máicrosoft'], [/LinkedIn/g, 'Línkedin'], [/Samsung/g, 'Sámsung'],
    [/total cost of ownership/g, 'tótal cost of óunership'],
  ],
  en: [],
};
const say = (s: Segment): Segment => {
  const tts: Partial<Record<Lang, string>> = {};
  (['es', 'en'] as Lang[]).forEach((l) => { let t = s[l]; for (const [re, r] of SAY[l]) t = t.replace(re, r); if (t !== s[l]) tts[l] = t; });
  return Object.keys(tts).length ? { ...s, tts: { ...tts, ...s.tts } } : s;
};

export default defineLesson({
  id: 'estrategia',

  objectives: {
    es: [
      'Ordenar casos de uso por frecuencia, valor de cada vez y riesgo, y ubicarlos en un cuadro de dos por dos para elegir por cuál empezar.',
      'Calcular el costo total de un caso de uso (no solo los tokens) y su retorno del primer año, con los supuestos a la vista.',
      'Explicar cómo se elige entre comprar, construir o ajustar, y cómo un piloto con línea base y meta medible decide si un proyecto se amplía, se corrige o se cierra.',
    ],
    en: [
      'Rank use cases by frequency, value per occurrence, and risk, and place them on a two-by-two grid to choose where to start.',
      'Calculate the total cost of a use case (not just the tokens) and its first-year return, with the assumptions in plain view.',
      'Explain how to choose between buying, building, or fine-tuning, and how a pilot with a baseline and a measurable goal decides whether a project expands, gets fixed, or shuts down.',
    ],
  },

  segments: ([
    // ── 1 · la pregunta de quien dirige ──
    {
      id: 'hook',
      es: 'Ya sabes cómo aprende un modelo, cuánto cuesta usarlo, cómo se evalúa y qué puede salir mal. Falta la pregunta de quien dirige: ¿dónde conviene usarlo, y por dónde empezar?',
      en: 'You now know how a model learns, what it costs to use, how it is evaluated, and what can go wrong. One question is left for whoever leads: where is it worth using, and where do you start?',
      pad: 0.3,
    },
    {
      id: 'ideas',
      es: 'Volvamos a la tienda de bicicletas eléctricas. Su dueña anotó cinco ideas: dudas de garantía, diagnósticos en el taller, el catálogo, ideas para redes y filtrar currículos.',
      en: 'Back to the electric bike shop. Its owner wrote down five ideas: warranty questions, workshop diagnoses, the catalog, social media ideas, and screening résumés.',
      pad: 0.5,
    },
    {
      id: 'use-case',
      es: 'Cada idea es un caso de uso: una tarea concreta, que alguien hace cierto número de veces y que la IA podría cambiar. «Usar IA en ventas» no lo es; «contestar dudas de garantía», sí.',
      en: 'Each idea is a use case: a specific task that someone does a certain number of times and that AI could change. “Use AI in sales” is not one; “answer warranty questions” is.',
      note: { es: 'Caso de uso: una tarea concreta, quién la hace, cuántas veces y qué cambiaría la IA.', en: 'Use case: a specific task, who does it, how often, and what AI would change.' },
      pad: 0.5,
    },

    // ── 2 · tres preguntas: frecuencia, valor y riesgo ──
    {
      id: 'freq',
      es: 'Para elegir hay tres preguntas. Primera, la frecuencia: cuántas veces pasa al mes. Las dudas de garantía llegan unas dos mil veces; los currículos, unas veinte.',
      en: 'To choose, there are three questions. First, frequency: how many times it happens per month. Warranty questions come in about two thousand times; résumés, about twenty.',
      pad: 0.4,
    },
    {
      id: 'value-each',
      es: 'Segunda, cuánto vale cada vez. Aquí lo medimos en minutos de trabajo que se ahorran: unos seis por cada duda de garantía y unos treinta por cada diagnóstico en el taller.',
      en: 'Second, how much each one is worth. Here we measure it in minutes of work saved: about six per warranty question and about thirty per diagnosis in the workshop.',
      pad: 0.4,
    },
    {
      id: 'value-year',
      es: 'Frecuencia por minutos da el valor en juego. Las dudas suman doscientas horas al mes; los diagnósticos, ciento cincuenta, aunque cada uno ahorra cinco veces más.',
      en: 'Frequency times minutes gives the value at stake. The questions add up to two hundred hours a month; the diagnoses, one hundred fifty, even though each one saves five times more.',
      note: { es: 'Valor en juego = cuántas veces pasa × cuánto vale cada vez.', en: 'Value at stake = how often it happens × what each one is worth.' },
      pad: 0.6,
    },
    {
      id: 'risk',
      es: 'Tercera, el riesgo, como en la lección treinta y cinco. Filtrar currículos queda en alto, y el diagnóstico también: una batería mal revisada es peligrosa. Las dudas, en medio; el resto, bajo.',
      en: 'Third, risk, as in lesson thirty-five. Screening résumés comes out high, and so does diagnosis: a badly checked battery is dangerous. The questions, medium; the rest, low.',
      pad: 0.5,
    },

    // ── 3 · el cuadro de dos por dos ──
    {
      id: 'axis-x',
      es: 'Ahora juntamos las respuestas en un cuadro de dos por dos. La línea horizontal es el valor en juego: a la izquierda, poco; a la derecha, mucho.',
      en: 'Now we bring the answers together on a two-by-two grid. The horizontal line is the value at stake: on the left, little; on the right, a lot.',
      pad: 0.4,
    },
    {
      id: 'axis-y',
      es: 'La vertical es el riesgo: abajo, bajo; arriba, alto. Las líneas del centro parten el cuadro en cuatro zonas, y cada zona pide una decisión distinta.',
      en: 'The vertical line is risk: at the bottom, low; at the top, high. The lines through the middle split the grid into four zones, and each zone calls for a different decision.',
      pad: 0.4,
    },
    {
      id: 'q-start',
      es: 'Abajo a la derecha, mucho valor y poco riesgo: ahí se empieza. Ahí caen las dudas de garantía, cerca de la línea: con los controles de la lección treinta y cinco, su riesgo baja.',
      en: 'Bottom right, lots of value and little risk: that is where you start. Warranty questions land there, near the line: with the controls from lesson thirty-five, their risk comes down.',
      note: { es: 'Se empieza donde hay mucho valor y poco riesgo.', en: 'You start where there is lots of value and little risk.' },
      pad: 0.6,
    },
    {
      id: 'q-later',
      es: 'Arriba a la derecha, mucho valor y riesgo alto: vale la pena, pero después, con controles fuertes y experiencia ganada. Ahí va el diagnóstico en el taller.',
      en: 'Top right, lots of value and high risk: worth it, but later, with strong controls and some experience gained. Workshop diagnosis goes there.',
      pad: 0.5,
    },
    {
      id: 'q-free',
      es: 'Abajo a la izquierda, poco valor y poco riesgo: no merece un proyecto. Bastan herramientas aprobadas y la política de uso. Ahí caen el catálogo y las ideas para redes.',
      en: 'Bottom left, little value and little risk: not worth a project. Approved tools and the usage policy are enough. The catalog and the social media ideas land there.',
      pad: 0.5,
    },
    {
      id: 'q-drop',
      es: 'Arriba a la izquierda, poco valor y riesgo alto: no se hace. Filtrar currículos pasa pocas veces, y un error puede discriminar a personas, como viste con el sesgo.',
      en: 'Top left, little value and high risk: you don’t do it. Screening résumés happens rarely, and a mistake can discriminate against people, as you saw with bias.',
      pad: 0.5,
    },
    {
      id: 'try-matrix',
      es: 'Si quieres, elige tú un caso de la lista y mira su valor, su riesgo y en qué zona cae.',
      en: 'If you like, pick a case from the list and see its value, its risk, and which zone it lands in.',
      gate: {
        id: 'matrix',
        prompt: { es: 'elige un caso y mira en qué zona cae.', en: 'pick a case and see which zone it lands in.' },
      },
      pad: 0.4,
    },

    // ── 4 · construir, comprar o ajustar ──
    {
      id: 'paths',
      es: 'Elegido el primer caso, las dudas de garantía, falta decidir cómo hacerlo. Hay cuatro caminos, de menos a más esfuerzo, y ya conoces casi todos.',
      en: 'With the first case chosen, the warranty questions, you still have to decide how to do it. There are four paths, from least to most effort, and you already know most of them.',
      pad: 0.4,
    },
    {
      id: 'buy',
      es: 'Comprar: un producto ya hecho, como un chat de atención que se paga cada mes. Se pone en marcha rápido, pero tú te adaptas a él, y tus datos pasan por el proveedor.',
      en: 'Buy: a ready-made product, like a customer service chat you pay for every month. It is quick to launch, but you adapt to it, and your data goes through the provider.',
      pad: 0.4,
    },
    {
      id: 'build',
      es: 'Construir: tu equipo arma el sistema sobre el modelo de un proveedor, con un buen prompt y RAG sobre tu manual, como en la lección treinta y uno. Más trabajo, más control.',
      en: 'Build: your team puts the system together on a provider’s model, with a good prompt and RAG over your manual, as in lesson thirty-one. More work, more control.',
      pad: 0.4,
    },
    {
      id: 'tune',
      es: 'Ajustar: además, entrenar el modelo con tus ejemplos, como en la lección veintisiete. Solo si el prompt y RAG no alcanzan, y la tarea es estable y se repite muchísimo.',
      en: 'Fine-tune: on top of that, train the model on your examples, as in lesson twenty-seven. Only if the prompt and RAG fall short, and the task is stable and repeated a huge number of times.',
      pad: 0.4,
    },
    {
      id: 'scratch',
      es: 'Y entrenar un modelo desde cero. En la lección veinticuatro viste que cuesta decenas de millones de dólares: casi ninguna organización lo necesita.',
      en: 'And training a model from scratch. In lesson twenty-four you saw that it costs tens of millions of dollars: almost no organization needs it.',
      pad: 0.4,
    },
    {
      id: 'bvb-rule',
      es: 'Esta elección se llama construir o comprar. La regla: compra lo que es igual para todos, como transcribir reuniones; construye lo que usa tus datos. La tienda construye.',
      en: 'This choice is called build versus buy. The rule: buy what is the same for everyone, like transcribing meetings; build what uses your own data. The shop builds.',
      note: { es: 'Construir o comprar: compra lo común, construye lo que usa tus datos, ajusta solo si no alcanza.', en: 'Build versus buy: buy what is common, build what uses your data, fine-tune only if that falls short.' },
      pad: 0.6,
    },

    // ── 5 · costo por tarea y costo total ──
    {
      id: 'task-cost',
      es: '¿Cuánto cuesta? Empieza por el costo por tarea de la lección veintiséis: los tokens de entrada por su precio, más los tokens de salida por el suyo.',
      en: 'What does it cost? Start with the cost per task from lesson twenty-six: input tokens times their price, plus output tokens times theirs.',
      pad: 0.4,
    },
    {
      id: 'task-cost-ex',
      es: 'Una duda con RAG lleva unos tres mil quinientos tokens de entrada y trescientos de salida. Con los precios de ejemplo de esa lección, cuesta un centavo y medio de dólar.',
      en: 'A question with RAG takes about three thousand five hundred input tokens and three hundred output tokens. At that lesson’s example prices, it costs a cent and a half.',
      pad: 0.5,
    },
    {
      id: 'tco-def',
      es: 'Por dos mil dudas al mes, treinta dólares. Pero eso es solo una parte. Sumar todo lo que cuesta tener el sistema da el costo total, en inglés total cost of ownership.',
      en: 'For two thousand questions a month, thirty dollars. But that is only one part. Adding up everything it takes to own the system gives the total cost of ownership.',
      note: { es: 'Costo total: lo que se paga una vez más lo que se paga cada mes, no solo los tokens.', en: 'Total cost of ownership: what you pay once plus what you pay every month, not just the tokens.' },
      pad: 0.4,
    },
    {
      id: 'tco-once',
      es: 'Lo que se paga una vez: construir el sistema y conectarlo con los de la tienda, y preparar los datos y los casos de oro. En este ejemplo, seis mil dólares.',
      en: 'What you pay once: building the system and connecting it to the shop’s systems, and preparing the data and the gold cases. In this example, six thousand dollars.',
      pad: 0.5,
    },
    {
      id: 'tco-month',
      es: 'Lo que se paga cada mes: el servicio y el monitoreo, y sobre todo las personas que revisan una muestra y mantienen el manual al día. Aquí, cuatrocientos setenta dólares.',
      en: 'What you pay every month: hosting and monitoring, and above all the people who check a sample and keep the manual up to date. Here, four hundred seventy dollars.',
      pad: 0.5,
    },
    {
      id: 'tco-year',
      es: 'En el primer año suman doce mil dólares. Los tokens, trescientos sesenta, son apenas el tres por ciento. Aquí lo caro no es el modelo: es el trabajo de las personas.',
      en: 'In the first year, it adds up to twelve thousand dollars. The tokens, three hundred sixty, are just three percent. What is expensive here is not the model: it is people’s work.',
      pad: 0.6,
    },

    // ── 6 · el retorno ──
    {
      id: 'roi-benefit',
      es: 'Ahora, el beneficio. Si una hora de trabajo cuesta diez dólares, un supuesto, cada duda que ahorra seis minutos vale un dólar. Dos mil al mes, veinticuatro mil al año.',
      en: 'Now, the benefit. If an hour of work costs ten dollars, an assumption, each question that saves six minutes is worth one dollar. Two thousand a month is twenty-four thousand a year.',
      pad: 0.5,
    },
    {
      id: 'roi-return',
      es: 'Beneficio menos costo total: veinticuatro mil menos doce mil, doce mil dólares de retorno en el primer año. La inversión inicial se recupera en el cuarto mes.',
      en: 'Benefit minus total cost: twenty-four thousand minus twelve thousand, twelve thousand dollars of return in the first year. The upfront investment is paid back in the fourth month.',
      pad: 0.6,
    },
    {
      id: 'roi-demo',
      es: 'Mira qué pasa con menos dudas. Con quinientas al mes, el beneficio ya no cubre el costo: se pierde dinero. Con unas mil, apenas se empata. La frecuencia pesa mucho.',
      en: 'Watch what happens with fewer questions. At five hundred a month, the benefit no longer covers the cost: you lose money. At about a thousand, you barely break even. Frequency matters a lot.',
      pad: 0.8,
    },
    {
      id: 'try-roi',
      es: 'Si quieres, mueve tú las dudas al mes. Los demás números son supuestos y quedan a la vista: en tu caso, cámbialos por los tuyos.',
      en: 'If you like, move the questions per month yourself. The other numbers are assumptions, and they stay in plain view: for your own case, swap in yours.',
      gate: {
        id: 'roi',
        prompt: { es: 'mueve las dudas al mes y mira el retorno del primer año.', en: 'move the questions per month and watch the first-year return.' },
      },
      pad: 0.4,
    },

    // ── 7 · los datos ──
    {
      id: 'data',
      es: 'Antes de construir, revisa los datos. RAG solo responde bien si el manual está completo, al día y sin versiones que se contradigan, como la garantía de doce y de dieciocho meses.',
      en: 'Before you build, check the data. RAG only answers well if the manual is complete, up to date, and free of versions that contradict each other, like the twelve- and eighteen-month warranties.',
      pad: 0.6,
    },

    // ── 8 · el piloto ──
    {
      id: 'pilot-def',
      es: 'Con los datos listos, no se lanza para todos de golpe. Primero, seis semanas, solo con las dudas que llegan por correo, y una persona revisa cada respuesta. Eso es un piloto.',
      en: 'With the data ready, you don’t launch for everyone at once. First, six weeks, only with the questions that arrive by email, and a person checks every answer. That is a pilot.',
      note: { es: 'Piloto: una prueba pequeña, con usuarios reales, plazo fijo y una meta medible.', en: 'Pilot: a small test, with real users, a fixed time frame, and a measurable goal.' },
      pad: 0.5,
    },
    {
      id: 'pilot-goal',
      es: 'Un piloto tiene usuarios reales, un plazo y una meta medible. Aquí: ahorrar al menos tres minutos por duda, lo justo para no perder dinero, sin más quejas que hoy.',
      en: 'A pilot has real users, a deadline, and a measurable goal. Here: save at least three minutes per question, just enough not to lose money, with no more complaints than today.',
      pad: 0.5,
    },
    {
      id: 'baseline',
      es: 'Y algo clave: medir antes de empezar. Cuánto tarda hoy cada duda y cuántos clientes se quejan. Sin ese punto de partida, la línea base, no sabrás si algo mejoró.',
      en: 'And one key thing: measure before you start. How long each question takes today, and how many customers complain. Without that starting point, the baseline, you won’t know if anything improved.',
      pad: 0.5,
    },
    {
      id: 'metrics',
      es: 'Durante el piloto se miden tres cosas cada semana: la calidad, con los casos de oro de la lección treinta y cuatro; el negocio, minutos y quejas; y el costo por duda.',
      en: 'During the pilot, three things are measured every week: quality, with the gold cases from lesson thirty-four; the business, minutes and complaints; and the cost per question.',
      pad: 0.5,
    },
    {
      id: 'pilot-measure',
      es: 'Al terminar, los supuestos se cambian por lo medido. Si el piloto midió cuatro minutos ahorrados por duda, no seis, el retorno del primer año baja de doce mil a cuatro mil dólares.',
      en: 'At the end, the assumptions give way to what was measured. If the pilot measured four minutes saved per question, not six, the first-year return drops from twelve thousand to four thousand dollars.',
      pad: 0.8,
    },
    {
      id: 'scale',
      es: 'Cuatro minutos superan la meta de tres: se amplía a todos, con un responsable con nombre. Si no la superara, se corrige o se cierra. Cerrar a tiempo también es un buen resultado.',
      en: 'Four minutes beats the goal of three: it expands to everyone, with a named owner. If it fell short, you fix it or shut it down. Shutting down in time is a good outcome too.',
      pad: 0.5,
    },
    {
      id: 'real-study',
      es: 'Un caso real: con un asistente de IA, más de cinco mil agentes de atención resolvieron quince por ciento más consultas por hora. Los menos experimentados, treinta; los expertos, casi igual.',
      en: 'A real case: with an AI assistant, more than five thousand customer support agents resolved fifteen percent more issues per hour. The least experienced, thirty; the experts, about the same.',
      pad: 0.6,
    },
    {
      id: 'pilots-fail',
      es: 'Muchos proyectos se quedan en la prueba. En dos mil veinticuatro, Gartner predijo que al menos tres de cada diez de IA generativa se abandonarían ahí: por datos, riesgos, costos o valor.',
      en: 'Many projects stall at the test. In twenty twenty-four, Gartner predicted that at least three in ten generative AI projects would be abandoned there: over data, risk, costs, or value.',
      pad: 0.6,
    },

    // ── 9 · las personas ──
    {
      id: 'change',
      es: 'La otra mitad es la gente, y se llama gestión del cambio: quien contestaba dudas ahora revisa, atiende lo difícil y avisa si la IA falla. Hay que explicarlo y capacitar.',
      en: 'The other half is people, and it is called change management: whoever answered questions now reviews, handles the hard ones, and flags when the AI fails. That takes explaining, and training.',
      pad: 0.5,
    },
    {
      id: 'jagged',
      es: 'Capacitar incluye saber cuándo no usarla. Con setecientos cincuenta y ocho consultores, la IA aceleró veinticinco por ciento las tareas a su alcance; en una fuera de él, acertaron menos.',
      en: 'Training includes knowing when not to use it. With seven hundred fifty-eight consultants, AI made tasks within its reach twenty-five percent faster; on one beyond it, they got it right less often.',
      pad: 0.7,
    },

    // ── 10 · dos errores comunes ──
    {
      id: 'err-demo',
      es: 'Dos errores comunes. Primero, decidir por una demostración: una demo enseña los casos que salen bien. Sin evaluar con tus casos de oro, no sabes cuántos salen mal.',
      en: 'Two common mistakes. First, deciding based on a demo: a demo shows the cases that go well. Without evaluating on your gold cases, you don’t know how many go wrong.',
      pad: 0.6,
    },
    {
      id: 'err-shadow',
      es: 'Segundo, la IA en la sombra: si no hay herramientas aprobadas, la gente usa las suyas, sin avisar y con datos de la empresa, como el código de Samsung en la lección treinta y cinco.',
      en: 'Second, shadow AI: if there are no approved tools, people use their own, without telling anyone and with company data, like the Samsung code in lesson thirty-five.',
      note: { es: 'IA en la sombra: herramientas que se usan sin aprobación. Se previene con herramientas aprobadas, reglas claras y capacitación.', en: 'Shadow AI: tools used without approval. Prevent it with approved tools, clear rules, and training.' },
      pad: 0.5,
    },
    {
      id: 'shadow-stat',
      es: 'En una encuesta de Microsoft y LinkedIn de dos mil veinticuatro, tres de cada cuatro trabajadores del conocimiento usaban IA, y casi ocho de cada diez de ellos, con herramientas propias.',
      en: 'In a twenty twenty-four Microsoft and LinkedIn survey, three out of four knowledge workers were using AI, and nearly eight in ten of them were bringing their own tools.',
      pad: 0.6,
    },

    // ── 11 · el plan de noventa días ──
    {
      id: 'plan-1',
      es: 'Juntemos todo en un plan de noventa días. Días uno a treinta: inventario y política de uso, la lista de casos, el cuadro de dos por dos, y elegir uno, con su línea base.',
      en: 'Let’s put it all together in a ninety-day plan. Days one to thirty: inventory and usage policy, the list of cases, the two-by-two grid, and choosing one, with its baseline.',
      note: { es: 'Plan de noventa días: elegir y medir; construir y probar; decidir con datos.', en: 'Ninety-day plan: choose and measure; build and test; decide with data.' },
      pad: 0.5,
    },
    {
      id: 'plan-2',
      es: 'Días treinta y uno a sesenta: preparar los datos, armar los casos de oro, construir lo mínimo y lanzar el piloto con un grupo pequeño, midiendo cada semana.',
      en: 'Days thirty-one to sixty: prepare the data, put together the gold cases, build the minimum, and launch the pilot with a small group, measuring every week.',
      pad: 0.5,
    },
    {
      id: 'plan-3',
      es: 'Días sesenta y uno a noventa: comparar con la línea base, recalcular el retorno con lo medido y decidir: ampliar, corregir o cerrar. Después, el siguiente caso del cuadro.',
      en: 'Days sixty-one to ninety: compare against the baseline, recalculate the return with what was measured, and decide: expand, fix, or shut down. Then, the next case on the grid.',
      pad: 0.6,
    },
    {
      id: 'bridge',
      es: 'Ya tienes todas las piezas, de una neurona a un plan para tu organización. En la última lección las ponemos juntas: el mapa completo.',
      en: 'You now have all the pieces, from a single neuron to a plan for your organization. In the last lesson we put them together: the complete map.',
    },
  ] as Segment[]).map(say),

  keyIdeas: {
    es: [
      'Un caso de uso es una tarea concreta, no «usar IA». Se ordena con tres preguntas: cuántas veces pasa, cuánto vale cada vez y qué tan riesgoso es. Lo pequeño y frecuente puede valer más que lo grande y raro.',
      'En un cuadro de valor por riesgo: se empieza con mucho valor y poco riesgo; lo valioso y riesgoso va después, con controles; lo de poco valor y poco riesgo no merece proyecto, y lo de poco valor y riesgo alto no se hace.',
      'Construir o comprar: compra lo común, construye lo que usa tus datos (prompt y RAG), ajusta solo si eso no alcanza y casi nunca entrenes desde cero.',
      'El costo total suma lo que se paga una vez y lo que se paga cada mes. En el ejemplo, los tokens eran el 3 % del primer año; lo caro era el trabajo de las personas. El retorno se calcula con supuestos a la vista y se recalcula con lo medido.',
      'Un piloto tiene usuarios reales, plazo, línea base y meta medible, y termina en una decisión: ampliar, corregir o cerrar. Dos errores comunes: decidir por una demo y dejar crecer la IA en la sombra.',
    ],
    en: [
      'A use case is a specific task, not “use AI.” It is ranked with three questions: how often it happens, what each one is worth, and how risky it is. Something small and frequent can be worth more than something big and rare.',
      'On a value-by-risk grid: start with lots of value and little risk; valuable but risky goes later, with controls; little value and little risk is not worth a project; and little value with high risk is not done.',
      'Build versus buy: buy what is common, build what uses your data (prompt and RAG), fine-tune only if that falls short, and almost never train from scratch.',
      'Total cost of ownership adds what you pay once and what you pay every month. In the example, tokens were 3% of the first year; the expensive part was people’s work. The return is calculated with the assumptions in view and recalculated with what was measured.',
      'A pilot has real users, a deadline, a baseline, and a measurable goal, and it ends in a decision: expand, fix, or shut down. Two common mistakes: deciding based on a demo, and letting shadow AI grow.',
    ],
  },

  misconception: {
    wrong: {
      es: 'Si el precio por token es bajo, el proyecto de IA sale barato.',
      en: 'If the price per token is low, the AI project will be cheap.',
    },
    right: {
      es: 'El precio por token es solo una parte del costo total. También cuestan construir e integrar, preparar datos y casos de oro, monitorear y, sobre todo, las personas que revisan y mantienen. En el ejemplo de la tienda, los tokens eran el 3 % del primer año.',
      en: 'The price per token is only one part of the total cost. Building and integrating, preparing data and gold cases, monitoring and, above all, the people who review and maintain the system also cost money. In the bike shop example, tokens were 3% of the first year.',
    },
  },

  deeper: {
    es: `## Las cuentas de la lección

Todas las cifras de la tienda son **ilustrativas**: sirven para ver cómo se arma la cuenta, no para copiarlas. Lo que importa es la forma de las fórmulas y que cada supuesto quede a la vista.

**Valor en juego.** Con $f$ veces al mes y $m$ minutos ahorrados cada vez, las horas de trabajo en juego al mes son

$$H = \\frac{f \\cdot m}{60}.$$

Dudas de garantía: $2\\,000 \\times 6 / 60 = 200$ h; diagnósticos: $300 \\times 30 / 60 = 150$ h; currículos: $20 \\times 6 / 60 = 2$ h. Si el valor no es tiempo (ventas, calidad, menos errores), se usa la unidad que tenga sentido, pero siempre multiplicada por la frecuencia.

**Costo por tarea** (lección 26). Con $t_e$ tokens de entrada a $p_e$ dólares por millón y $t_s$ de salida a $p_s$:

$$c = \\frac{t_e\\, p_e + t_s\\, p_s}{10^6} = \\frac{3\\,500 \\times 3 + 300 \\times 15}{10^6} = 0.0105 + 0.0045 = 0.015 \\text{ dólares}.$$

Aunque la salida tiene menos de una décima de los tokens, aporta el 30 % del costo de cada duda: cada token de salida cuesta cinco veces más.

**Costo total del primer año.** Con un costo inicial $I$ (construir e integrar, 4 000; preparar datos y casos de oro, 2 000), un costo fijo mensual $F$ (servicio y monitoreo, 70; personas, 40 h × 10 = 400) y $V$ dudas al mes:

$$\\text{TCO}_1 = I + 12\\,(F + V c) = 6\\,000 + 12\\,(470 + 30) = 12\\,000.$$

Los tokens son $12 \\times 30 = 360$, el 3 %.

**Beneficio y retorno.** Con un costo de $h$ dólares por hora de trabajo:

$$B_1 = 12\\, V\\, \\frac{m}{60}\\, h, \\qquad R_1 = B_1 - \\text{TCO}_1, \\qquad \\text{ROI}_1 = \\frac{R_1}{\\text{TCO}_1}.$$

Con $V = 2\\,000$, $m = 6$ y $h = 10$: $B_1 = 24\\,000$, $R_1 = 12\\,000$ y $\\text{ROI}_1 = 100\\,\\%$. La inversión inicial se recupera en

$$k = \\frac{I}{V\\left(\\frac{m}{60} h - c\\right) - F} = \\frac{6\\,000}{2\\,000 \\times 0.985 - 470} = 4 \\text{ meses}.$$

**Puntos de equilibrio.** Despejando $R_1 = 0$:

$$V^* = \\frac{I/12 + F}{\\frac{m}{60} h - c} \\approx 985 \\text{ dudas al mes}, \\qquad m^* = \\frac{60}{h}\\left(\\frac{I/12 + F}{V} + c\\right) = 3 \\text{ minutos}.$$

Por eso la meta del piloto es «al menos tres minutos»: por debajo, el primer año pierde dinero. Con los cuatro minutos medidos, $R_1 = 16\\,000 - 12\\,000 = 4\\,000$.

## Qué le falta a esta cuenta

Es un modelo de primer orden. No descuenta el dinero en el tiempo, no cuenta los costos de salida (cambiar de proveedor), ni el riesgo residual de la lección 35 (lo que cuesta un incidente por su probabilidad), ni que los precios por token cambian. Tampoco supone que el tiempo ahorrado se convierta solo en dinero: si nadie usa esas horas para otra cosa, el beneficio no aparece en la contabilidad. Por eso el piloto mide y la cuenta se rehace con lo medido.

## El cuadro de dos por dos

Combina tres factores en dos ejes: el horizontal es $f \\times v$ (el valor en juego) y el vertical, el riesgo $P \\times I$ de la lección 35. Las posiciones de la lección son **ordinales** (el orden importa, la distancia no). Una alternativa es una puntuación, por ejemplo $\\text{prioridad} = f \\cdot v \\cdot (1 - r)$ con $r \\in [0, 1]$, pero una sola cifra esconde por qué un caso quedó arriba o abajo; el cuadro obliga a decir las dos razones. Un caso de riesgo alto puede bajar con controles (aprobación humana, respuestas con fuente, permisos mínimos) y moverse de zona, como las dudas de garantía.

En la Unión Europea, filtrar solicitudes de empleo está en el anexo III del Reglamento de IA (alto riesgo); según el Reglamento (UE) 2026/1744, esas obligaciones se aplican desde el 2 de diciembre de 2027.

## Construir, comprar o ajustar

| Camino | Qué es | Cuándo |
|---|---|---|
| Comprar | producto hecho, pago por mes o por usuario | tareas comunes: transcribir, redactar, resumir |
| Construir | tu sistema sobre el modelo de un proveedor: prompt, RAG, herramientas | tareas que usan tus datos o tus procesos |
| Ajustar | además, ajuste fino o LoRA con tus ejemplos (lección 27) | tarea estable, muy repetida, con miles de ejemplos buenos, si el prompt y RAG no alcanzan |
| Desde cero | preentrenar un modelo propio (lecciones 23 y 24) | casi nunca: decenas de millones de dólares |

Antes de comprar o construir, evalúa con tus casos de oro (lección 34): la elección se compara con el mismo conjunto y el mismo costo total.

## Lo que dicen los estudios

- **Brynjolfsson, Li y Raymond (2025)**, *Quarterly Journal of Economics*: 5 172 agentes de atención al cliente, con un asistente de IA que se introdujo de forma escalonada. Las consultas resueltas por hora subieron 15 % en promedio y 30 % en los trabajadores menos hábiles y menos experimentados; en los más experimentados el efecto en productividad fue pequeño y su calidad bajó un poco. (La versión de trabajo de 2023 daba 14 % y 34 %.)
- **Dell’Acqua y colaboradores (2023)**, Harvard Business School y BCG: 758 consultores en un experimento preregistrado. En 18 tareas dentro del alcance de GPT-4, quienes la usaron terminaron 12.2 % más tareas, 25.1 % más rápido y con mayor calidad; en una tarea elegida para quedar fuera de su alcance, tuvieron 19 % menos probabilidad de dar con la solución correcta que quienes no la usaron. Los autores llaman a eso una «frontera tecnológica irregular» (*jagged frontier*).
- **Microsoft y LinkedIn (Work Trend Index, 8 de mayo de 2024)**: encuesta a 31 000 personas en 31 países. El 75 % de los trabajadores del conocimiento usaba IA generativa en el trabajo; el 78 % de quienes la usaban llevaba sus propias herramientas; solo el 39 % había recibido capacitación de su empresa.
- **Gartner (29 de julio de 2024)**: predijo que al menos el 30 % de los proyectos de IA generativa se abandonarían tras la prueba de concepto para fines de 2025, por datos de mala calidad, controles de riesgo insuficientes, costos crecientes o valor de negocio poco claro. Es una predicción de una consultora, no una medición.

## En código

\`\`\`python
H_COSTO = 10                        # dólares por hora de trabajo (supuesto)
C_TAREA = (3500 * 3 + 300 * 15) / 1e6   # dólares por duda (lección 26)
INICIAL, FIJO = 6000, 470           # una vez; cada mes (supuestos)

def primer_anio(dudas, minutos):
    beneficio = 12 * dudas * minutos / 60 * H_COSTO
    costo_total = INICIAL + 12 * (FIJO + dudas * C_TAREA)
    return round(beneficio), round(costo_total), round(beneficio - costo_total)

print(C_TAREA)
for dudas, minutos in [(2000, 6), (500, 6), (1000, 6), (2000, 4)]:
    print(dudas, minutos, primer_anio(dudas, minutos))

ahorro_neto = 6 / 60 * H_COSTO - C_TAREA          # dólares por duda, ya sin tokens
print(round((INICIAL / 12 + FIJO) / ahorro_neto))  # dudas al mes para no perder
print(INICIAL / (2000 * ahorro_neto - FIJO))       # meses para recuperar lo invertido
\`\`\`

Salida:

\`\`\`
0.015
2000 6 (24000, 12000, 12000)
500 6 (6000, 11730, -5730)
1000 6 (12000, 11820, 180)
2000 4 (16000, 12000, 4000)
985
4.0
\`\`\`

## Lo que viene

La lección 37 junta todo el curso en un mapa: de la neurona al chatbot, y de ahí a las preguntas que conviene hacerle a cualquier equipo o proveedor de IA.`,
    en: `## The lesson’s arithmetic

All of the shop’s figures are **illustrative**: they show how the calculation is put together, not numbers to copy. What matters is the shape of the formulas and that every assumption stays in view.

**Value at stake.** With $f$ occurrences a month and $m$ minutes saved each time, the hours of work at stake per month are

$$H = \\frac{f \\cdot m}{60}.$$

Warranty questions: $2{,}000 \\times 6 / 60 = 200$ h; diagnoses: $300 \\times 30 / 60 = 150$ h; résumés: $20 \\times 6 / 60 = 2$ h. If the value is not time (sales, quality, fewer errors), use whatever unit makes sense, but always multiplied by frequency.

**Cost per task** (lesson 26). With $t_i$ input tokens at $p_i$ dollars per million and $t_o$ output tokens at $p_o$:

$$c = \\frac{t_i\\, p_i + t_o\\, p_o}{10^6} = \\frac{3{,}500 \\times 3 + 300 \\times 15}{10^6} = 0.0105 + 0.0045 = 0.015 \\text{ dollars}.$$

Even though output is less than a tenth of the tokens, it accounts for 30% of each question’s cost: each output token costs five times as much.

**First-year total cost of ownership.** With an upfront cost $I$ (building and integrating, 4,000; preparing data and gold cases, 2,000), a fixed monthly cost $F$ (hosting and monitoring, 70; people, 40 h × 10 = 400), and $V$ questions a month:

$$\\text{TCO}_1 = I + 12\\,(F + V c) = 6{,}000 + 12\\,(470 + 30) = 12{,}000.$$

Tokens are $12 \\times 30 = 360$, or 3%.

**Benefit and return.** With a cost of $h$ dollars per hour of work:

$$B_1 = 12\\, V\\, \\frac{m}{60}\\, h, \\qquad R_1 = B_1 - \\text{TCO}_1, \\qquad \\text{ROI}_1 = \\frac{R_1}{\\text{TCO}_1}.$$

With $V = 2{,}000$, $m = 6$, and $h = 10$: $B_1 = 24{,}000$, $R_1 = 12{,}000$, and $\\text{ROI}_1 = 100\\%$. The upfront investment is paid back in

$$k = \\frac{I}{V\\left(\\frac{m}{60} h - c\\right) - F} = \\frac{6{,}000}{2{,}000 \\times 0.985 - 470} = 4 \\text{ months}.$$

**Break-even points.** Solving $R_1 = 0$:

$$V^* = \\frac{I/12 + F}{\\frac{m}{60} h - c} \\approx 985 \\text{ questions a month}, \\qquad m^* = \\frac{60}{h}\\left(\\frac{I/12 + F}{V} + c\\right) = 3 \\text{ minutes}.$$

That is why the pilot’s goal is “at least three minutes”: below that, the first year loses money. With the four minutes measured, $R_1 = 16{,}000 - 12{,}000 = 4{,}000$.

## What this calculation leaves out

It is a first-order model. It does not discount money over time, count exit costs (switching providers), include the residual risk from lesson 35 (what an incident costs times its likelihood), or allow for token prices changing. Nor does time saved turn into money on its own: if nobody uses those hours for something else, the benefit never shows up in the books. That is why the pilot measures, and the calculation is redone with what was measured.

## The two-by-two grid

It combines three factors on two axes: the horizontal one is $f \\times v$ (the value at stake) and the vertical one is the risk $P \\times I$ from lesson 35. The positions in the lesson are **ordinal** (order matters, distance does not). An alternative is a score, for example $\\text{priority} = f \\cdot v \\cdot (1 - r)$ with $r \\in [0, 1]$, but a single number hides why a case ended up high or low; the grid forces you to state both reasons. A high-risk case can come down with controls (human approval, answers with sources, minimal permissions) and move to another zone, like the warranty questions.

In the European Union, screening job applications is in Annex III of the AI Act (high risk); under Regulation (EU) 2026/1744, those obligations apply from December 2, 2027.

## Build, buy, or fine-tune

| Path | What it is | When |
|---|---|---|
| Buy | a ready-made product, paid per month or per user | common tasks: transcribing, drafting, summarizing |
| Build | your system on a provider’s model: prompt, RAG, tools | tasks that use your data or your processes |
| Fine-tune | on top of that, fine-tuning or LoRA with your examples (lesson 27) | a stable, highly repeated task with thousands of good examples, if the prompt and RAG fall short |
| From scratch | pretraining your own model (lessons 23 and 24) | almost never: tens of millions of dollars |

Before buying or building, evaluate with your gold cases (lesson 34): compare the options on the same set and the same total cost.

## What the studies say

- **Brynjolfsson, Li, and Raymond (2025)**, *Quarterly Journal of Economics*: 5,172 customer support agents, with an AI assistant introduced in stages. Issues resolved per hour rose 15% on average and 30% among the less skilled and less experienced workers; among the most experienced, the productivity effect was small and their quality dipped slightly. (The 2023 working paper reported 14% and 34%.)
- **Dell’Acqua and colleagues (2023)**, Harvard Business School and BCG: 758 consultants in a preregistered experiment. On 18 tasks within GPT-4’s reach, those who used it completed 12.2% more tasks, 25.1% faster, and with higher quality; on a task chosen to fall outside its reach, they were 19% less likely to reach the correct solution than those who did not use it. The authors call this a “jagged technological frontier.”
- **Microsoft and LinkedIn (Work Trend Index, May 8, 2024)**: a survey of 31,000 people in 31 countries. 75% of knowledge workers were using generative AI at work; 78% of those users were bringing their own tools; only 39% had received training from their company.
- **Gartner (July 29, 2024)**: predicted that at least 30% of generative AI projects would be abandoned after proof of concept by the end of 2025, due to poor data quality, inadequate risk controls, escalating costs, or unclear business value. It is a consulting firm’s prediction, not a measurement.

## In code

\`\`\`python
HOURLY = 10                          # dollars per hour of work (assumption)
TASK_COST = (3500 * 3 + 300 * 15) / 1e6   # dollars per question (lesson 26)
UPFRONT, FIXED = 6000, 470           # once; every month (assumptions)

def first_year(questions, minutes):
    benefit = 12 * questions * minutes / 60 * HOURLY
    total_cost = UPFRONT + 12 * (FIXED + questions * TASK_COST)
    return round(benefit), round(total_cost), round(benefit - total_cost)

print(TASK_COST)
for questions, minutes in [(2000, 6), (500, 6), (1000, 6), (2000, 4)]:
    print(questions, minutes, first_year(questions, minutes))

net_saving = 6 / 60 * HOURLY - TASK_COST          # dollars per question, after tokens
print(round((UPFRONT / 12 + FIXED) / net_saving))  # questions a month to break even
print(UPFRONT / (2000 * net_saving - FIXED))       # months to pay back the investment
\`\`\`

Output:

\`\`\`
0.015
2000 6 (24000, 12000, 12000)
500 6 (6000, 11730, -5730)
1000 6 (12000, 11820, 180)
2000 4 (16000, 12000, 4000)
985
4.0
\`\`\`

## What comes next

Lesson 37 brings the whole course together on a map: from the neuron to the chatbot, and from there to the questions worth asking any AI team or vendor.`,
  },

  lens: {
    es: [
      'Haz la lista de casos de uso con tres columnas: cuántas veces pasa al mes, cuánto vale cada vez y qué riesgo tiene (lección 35). Empieza por uno con mucho valor y poco riesgo; deja lo valioso y riesgoso para después, con controles.',
      'Pide el costo total, no el precio por token: construir e integrar, preparar datos y casos de oro, servicio, monitoreo y las personas que revisan. Exige que los supuestos del retorno estén escritos, y recalcula con lo que mida el piloto.',
      'Antes de ampliar, un piloto: usuarios reales, plazo fijo, línea base medida antes, una meta que diga cuánto hace falta para no perder dinero y un responsable con nombre. Al final, ampliar, corregir o cerrar; cerrar a tiempo también es éxito.',
      'Contra la IA en la sombra no basta prohibir: ofrece herramientas aprobadas, una política de uso clara y capacitación, que incluya cuándo no usarla. En la encuesta de Microsoft y LinkedIn de 2024, solo el 39 % de quienes usaban IA en el trabajo había recibido capacitación de su empresa.',
    ],
    en: [
      'Make the list of use cases with three columns: how often it happens per month, what each one is worth, and how risky it is (lesson 35). Start with one that has lots of value and little risk; leave the valuable but risky ones for later, with controls.',
      'Ask for the total cost of ownership, not the price per token: building and integrating, preparing data and gold cases, hosting, monitoring, and the people who review. Insist that the return’s assumptions be written down, and recalculate with what the pilot measures.',
      'Before expanding, a pilot: real users, a fixed time frame, a baseline measured beforehand, a goal that says how much is needed not to lose money, and a named owner. At the end, expand, fix, or shut down; shutting down in time is success too.',
      'Banning is not enough against shadow AI: offer approved tools, a clear usage policy, and training, including when not to use it. In the 2024 Microsoft and LinkedIn survey, only 39% of people using AI at work had received training from their company.',
    ],
  },

  quiz: [
    {
      kind: 'concept',
      q: { es: 'Un caso de uso tiene mucho valor en juego y riesgo alto, como apoyar diagnósticos de baterías en el taller. ¿Qué conviene?', en: 'A use case has a lot of value at stake and high risk, like helping with battery diagnoses in the workshop. What makes sense?' },
      options: [
        { es: 'Empezar por él: es el de más valor.', en: 'Start with it: it has the most value.' },
        { es: 'Descartarlo para siempre.', en: 'Drop it for good.' },
        { es: 'Dejarlo para después, con controles fuertes y la experiencia de un primer caso de menos riesgo.', en: 'Leave it for later, with strong controls and the experience of a first, lower-risk case.' },
        { es: 'Dejar que cada mecánico use la herramienta que quiera.', en: 'Let each mechanic use whatever tool they like.' },
      ],
      answer: 2,
      why: {
        es: 'Arriba a la derecha del cuadro (mucho valor, riesgo alto) vale la pena, pero no como primer paso: primero se gana experiencia con un caso de mucho valor y poco riesgo, y luego se aborda este con controles como la revisión humana.',
        en: 'The top right of the grid (lots of value, high risk) is worth it, but not as a first step: you first gain experience with a high-value, low-risk case, and then take this one on with controls such as human review.',
      },
    },
    {
      kind: 'concept',
      q: { es: '¿Qué incluye el costo total de un sistema con IA?', en: 'What does the total cost of ownership of an AI system include?' },
      options: [
        { es: 'Solo los tokens o la licencia.', en: 'Only the tokens or the license.' },
        { es: 'Lo que se paga una vez (construir, integrar, preparar datos y casos de oro) y lo que se paga cada mes (tokens, servicio, monitoreo y las personas que revisan).', en: 'What you pay once (building, integrating, preparing data and gold cases) and what you pay every month (tokens, hosting, monitoring, and the people who review).' },
        { es: 'Solo el costo de entrenar el modelo.', en: 'Only the cost of training the model.' },
        { es: 'Lo que cobre el proveedor el primer mes.', en: 'Whatever the provider charges in the first month.' },
      ],
      answer: 1,
      why: {
        es: 'El costo total suma todo lo que cuesta tener el sistema durante un periodo. En el ejemplo de la tienda, los tokens eran 360 de 12 000 dólares del primer año: el 3 %.',
        en: 'Total cost of ownership adds up everything it takes to own the system over a period. In the shop example, tokens were 360 of the 12,000 dollars in the first year: 3%.',
      },
    },
    {
      kind: 'calc',
      q: {
        es: 'Un caso ahorra 4 minutos en cada una de 3 000 tareas al mes, y una hora de trabajo cuesta 10 dólares. Construirlo cuesta 8 000 dólares una vez y mantenerlo, 600 al mes (con tokens). ¿Cuál es el retorno del primer año?',
        en: 'A case saves 4 minutes on each of 3,000 tasks a month, and an hour of work costs 10 dollars. Building it costs 8,000 dollars once, and running it costs 600 a month (tokens included). What is the first-year return?',
      },
      options: [
        { es: '24 000 dólares', en: '24,000 dollars' },
        { es: '16 800 dólares', en: '16,800 dollars' },
        { es: '8 800 dólares', en: '8,800 dollars' },
        { es: '1 400 dólares', en: '1,400 dollars' },
      ],
      answer: 2,
      why: {
        es: 'Beneficio: 3 000 × 4 / 60 = 200 horas al mes × 10 = 2 000 al mes, 24 000 al año. Costo total: 8 000 + 12 × 600 = 15 200. Retorno: 24 000 − 15 200 = 8 800. Los errores típicos son olvidar todos los costos (24 000), olvidar el costo inicial (16 800) o calcular un solo mes (1 400).',
        en: 'Benefit: 3,000 × 4 / 60 = 200 hours a month × 10 = 2,000 a month, 24,000 a year. Total cost: 8,000 + 12 × 600 = 15,200. Return: 24,000 − 15,200 = 8,800. The typical mistakes are forgetting all the costs (24,000), forgetting the upfront cost (16,800), or working out a single month (1,400).',
      },
    },
    {
      kind: 'apply',
      q: { es: 'Un piloto de seis semanas tenía la meta de ahorrar al menos 3 minutos por duda, sin más quejas. Midió 2 minutos, con la calidad bien. ¿Qué haces?', en: 'A six-week pilot had the goal of saving at least 3 minutes per question, with no more complaints. It measured 2 minutes, with quality fine. What do you do?' },
      options: [
        { es: 'Ampliarlo a todos: ya está construido.', en: 'Expand it to everyone: it is already built.' },
        { es: 'Bajar la meta a 2 minutos para que cumpla.', en: 'Lower the goal to 2 minutes so it passes.' },
        { es: 'Ampliarlo, porque la demo se veía muy bien.', en: 'Expand it, because the demo looked great.' },
        { es: 'Buscar por qué no ahorra más (datos, flujo, capacitación) y volver a medir, o cerrarlo si no tiene arreglo.', en: 'Find out why it doesn’t save more (data, workflow, training) and measure again, or shut it down if it can’t be fixed.' },
      ],
      answer: 3,
      why: {
        es: 'La meta decía cuánto hace falta para no perder dinero; con 2 minutos, el primer año pierde. Lo que se ha gastado no justifica ampliarlo, y mover la meta para que cumpla es engañarse. Se corrige y se vuelve a medir, o se cierra: cerrar a tiempo también es un buen resultado.',
        en: 'The goal said how much is needed not to lose money; at 2 minutes, the first year loses. What has already been spent doesn’t justify expanding it, and moving the goal so it passes is fooling yourself. You fix it and measure again, or shut it down: shutting down in time is a good outcome too.',
      },
    },
  ],

  glossary: ['use-case', 'tco', 'pilot', 'build-vs-buy', 'prompt', 'rag', 'fine-tuning', 'token', 'pretraining', 'eval-set', 'human-in-the-loop', 'governance', 'ai-bias', 'info-leak'],

  terms: [
    { id: 'use-case', term: { es: 'Caso de uso', en: 'Use case' }, def: { es: 'Una tarea concreta que la IA podría cambiar, con quién la hace, cuántas veces y con qué datos. Se compara con otros por su frecuencia, el valor de cada vez y su riesgo. «Usar IA en ventas» no es un caso de uso; «contestar dudas de garantía por correo», sí.', en: 'A specific task that AI could change, with who does it, how often, and with what data. It is compared with others by frequency, value per occurrence, and risk. “Use AI in sales” is not a use case; “answer warranty questions by email” is.' } },
    { id: 'tco', term: { es: 'Costo total de propiedad (TCO)', en: 'Total cost of ownership (TCO)' }, def: { es: 'Todo lo que cuesta tener un sistema durante un periodo: lo que se paga una vez (construir, integrar, preparar datos y casos de oro) y lo que se paga cada mes (tokens o licencias, servicio y monitoreo, personas que revisan y mantienen). El precio por token es solo una parte.', en: 'Everything it costs to own a system over a period: what you pay once (building, integrating, preparing data and gold cases) and what you pay every month (tokens or licenses, hosting and monitoring, the people who review and maintain it). The price per token is only one part.' } },
    { id: 'pilot', term: { es: 'Piloto', en: 'Pilot' }, def: { es: 'Prueba de un caso de uso en pequeño, con usuarios reales, plazo fijo, una línea base medida antes y una meta medible. Termina en una decisión con datos: ampliar, corregir o cerrar.', en: 'A small-scale test of a use case, with real users, a fixed time frame, a baseline measured beforehand, and a measurable goal. It ends in a data-based decision: expand, fix, or shut down.' } },
    { id: 'build-vs-buy', term: { es: 'Construir o comprar', en: 'Build versus buy' }, def: { es: 'La decisión de cómo hacer un caso de uso: comprar un producto hecho, construir sobre el modelo de un proveedor (prompt y RAG), ajustar un modelo con tus ejemplos o, casi nunca, entrenar uno desde cero. Regla práctica: compra lo común; construye lo que usa tus datos.', en: 'The decision about how to carry out a use case: buy a ready-made product, build on a provider’s model (prompt and RAG), fine-tune a model on your examples, or, almost never, train one from scratch. Rule of thumb: buy what is common; build what uses your data.' } },
  ],

  sources: [
    { title: 'Generative AI at Work, The Quarterly Journal of Economics 140(2), 889–942', authors: 'Brynjolfsson, E., Li, D., Raymond, L.', year: 2025, url: 'https://doi.org/10.1093/qje/qjae044' },
    { title: 'Generative AI at Work (NBER Working Paper 31161, versión de 2023)', authors: 'Brynjolfsson, E., Li, D., Raymond, L. R.', year: 2023, url: 'https://www.nber.org/papers/w31161' },
    { title: 'Navigating the Jagged Technological Frontier: Field Experimental Evidence of the Effects of AI on Knowledge Worker Productivity and Quality (HBS Working Paper 24-013)', authors: 'Dell’Acqua, F., McFowland III, E., Mollick, E. R., Lifshitz-Assaf, H., Kellogg, K., Rajendran, S., Krayer, L., Candelon, F., Lakhani, K. R.', year: 2023, url: 'https://doi.org/10.2139/ssrn.4573321' },
    { title: '2024 Work Trend Index Annual Report: AI at Work Is Here. Now Comes the Hard Part (8 de mayo de 2024)', authors: 'Microsoft y LinkedIn', year: 2024, url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part' },
    { title: 'Gartner Predicts 30% of Generative AI Projects Will Be Abandoned After Proof of Concept By End of 2025 (comunicado, 29 de julio de 2024)', authors: 'Gartner', year: 2024, url: 'https://www.gartner.com/en/newsroom/press-releases/2024-07-29-gartner-predicts-30-percent-of-generative-ai-projects-will-be-abandoned-after-proof-of-concept-by-end-of-2025' },
    { title: '30% of Generative AI Projects Will Be Abandoned After Proof of Concept By End of 2025 (29 de julio de 2024; cobertura del comunicado)', authors: 'MH&L (Material Handling & Logistics)', year: 2024, url: 'https://mhlnews.com/technology-automation/article/55129131/30-of-generative-ai-projects-will-be-abandoned-after-proof-of-concept-by-end-of-2025' },
    { title: 'Pricing (lista de precios de la API: 3 y 15 dólares por millón de tokens de entrada y salida en Claude Sonnet 4.5 y 4.6; consultada el 12 de octubre de 2026)', authors: 'Anthropic', year: 2026, url: 'https://platform.claude.com/docs/en/about-claude/pricing' },
    { title: 'Artificial Intelligence Risk Management Framework (AI RMF 1.0), NIST AI 100-1', authors: 'National Institute of Standards and Technology', year: 2023, url: 'https://doi.org/10.6028/NIST.AI.100-1' },
    { title: 'Reglamento (UE) 2024/1689 por el que se establecen normas armonizadas en materia de inteligencia artificial (anexo III: empleo)', authors: 'Parlamento Europeo y Consejo de la Unión Europea', year: 2024, url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' },
    { title: 'Regulation (EU) 2026/1744 amending Regulation (EU) 2024/1689 (Digital Omnibus on AI), OJ L, 24 July 2026', authors: 'European Parliament and Council of the European Union', year: 2026, url: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj' },
  ],
});
