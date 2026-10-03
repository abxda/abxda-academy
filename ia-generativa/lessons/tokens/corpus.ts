// Corpus de entrenamiento del tokenizador de juguete de la lección «Tokens».
//
// Procedencia y licencia: todo el texto de este archivo fue escrito expresamente para esta lección (no se copió de
// ningún libro, web ni conjunto de datos), así que se redistribuye bajo la misma licencia que el resto del contenido
// del curso (CC BY-NC-ND 4.0). Son párrafos cotidianos y paralelos: la versión en español dice lo mismo que la
// versión en inglés. Es adrede muy pequeño (unos cuantos miles de caracteres por idioma): sirve para ver el algoritmo
// funcionar, no para competir con un tokenizador real.
//
// Reglas que se respetaron al escribirlo (la escena y el validador dependen de ellas):
//  · No contiene la palabra «Quetzalcóatl» ni «Quetzalcoatl», ni «pingüino» / «penguin», ni la «ü» en ningún sitio:
//    son las palabras raras y el carácter raro que la lección usa para mostrar cómo se parte lo desconocido.
//  · Las palabras de las frases de ejemplo de la lección (gato/cat, llama/named, etc.) sí aparecen.
//
// Reproducir: `npx tsx src/content/courses/ia-generativa/lessons/tokens/build-tokenizers.mts`

export const EN: string[] = [
  "Every morning, Maria walks to the market near her house. She buys fresh bread, a few tomatoes and a bottle of water. The seller knows her name and always asks about her family. They talk about the weather, the prices and the football match from last night.",
  "The city is waking up. The buses are full, the streets are noisy, and people are hurrying to work. Some of them read the news on their phones, others listen to music. It's going to be a long day, but the coffee helps.",
  "At the office, the team is preparing the monthly report. The manager asks for the numbers from the last quarter and a short summary for the meeting. Nobody wants to be late, so everyone is working carefully. The results are better than expected, and the customers are happy.",
  "Learning something new takes time. You read, you practice, you make mistakes and you try again. A good teacher explains the idea with simple examples and then asks you to solve a problem by yourself. After a few weeks, the difficult things become easy.",
  "Cooking is a good way to relax. First, you chop the onions and the garlic. Then you heat the oil, add the vegetables and wait until they are soft. A little salt, some pepper and a lot of patience make the dinner taste better.",
  "Computers can store and process huge amounts of information. A program receives data, follows a set of instructions and returns an answer. Today, some programs learn from examples instead of following fixed rules. They find patterns in the data and use them to make predictions about new cases.",
  "The weather was terrible during our trip to the mountains. It rained for 3 days, and the roads were closed. We stayed in a small hotel, played cards and talked about everything. On the fourth morning the sun finally appeared, and the view was unforgettable.",
  "Doctors recommend sleeping eight hours, drinking enough water and walking every day. Healthy habits are simple, but they are not always easy. If you feel tired all the time, you should talk to a specialist. Prevention is cheaper and better than treatment.",
  "My brother plays the guitar in a band. They practice twice a week in a garage and have a concert next month. He says the hardest part is not the music, but finding a day when everyone is free.",
  "Travelling by train is slower than flying, but it's more comfortable. You can look through the window, read a book or just think. The ticket is cheaper if you buy it early, and the stations are usually in the center of the city.",
  "Our company is starting a new project with artificial intelligence. First, we need to understand the problem and collect good data. Then we can train a model, test it with real examples and measure the results. The decision to use it must be based on evidence, not on promises.",
  "Children ask many questions: why is the sky blue, where does the rain come from, how do birds fly? The best answers are honest and short. When we don't know something, it is fine to say so and to look for the answer together.",
  "The football match began at 9 o'clock. In the first half there were no goals, but the second half was exciting. The home team scored twice in 10 minutes, and the stadium was shaking. The fans sang until midnight.",
  "Money is a tool, not a goal. A simple budget helps you know what you earn, what you spend and what you can save. Small decisions repeated every month are more important than one big decision.",
  "My grandmother lives in a small house near the river. In the afternoon she sits in the garden with her cat, drinks tea and tells stories about the old days. The cat sleeps on her legs and never listens, but she says it understands everything.",
  "The library is open from Monday to Friday. Students come to study, borrow books and use the computers. It is quiet, warm and full of ideas. The librarian says that a good book is the best friend a person can have.",
  "When we travel, we try to learn a few words of the local language. People are always happy when you say hello, thank you or please in their own words. Even a bad accent opens doors, and mistakes make everybody laugh.",
  "I'm learning to cook, to swim and to speak another language. It isn't easy, and I'm not very good yet, but every week I understand a little more. My friends say that the secret is to practice a little every single day.",
  "Many people use their phones to read, to pay and to talk with their families. The phone is also a camera, a map and a notebook. We carry in our pockets what once filled a whole room.",
  "The restaurant on the corner serves rice, beans, soup and fresh fruit. The owner cooks every day and knows most of the customers. On Sundays the place is full, so it is better to arrive early and wait with a coffee.",
  "A good question is often more useful than a quick answer. It shows what we don't understand and where we should look. Scientists, engineers and students all begin in the same way: with a question and some curiosity.",
  "The new school has twenty classrooms, a library and a large yard. Teachers and parents worked together for years to build it. On the first day, the children arrived early, and everybody was a little nervous.",
  "Hello! How are you today? I'm fine, thank you. And you? I'm good too. Hello, my name is Ana, and I live in Mexico City. Nice to meet you.",
  "My cat is named Luna. My cat is named Max. My neighbor says that my cat is the laziest cat in the building, and she is probably right. My cat sleeps all day and eats all night.",
  "Please send me the email with the contract before the meeting. Thank you for your help, and please call me if you have any questions. The price of the project is in the document.",
  "A token is a piece of text. Words, letters, numbers and signs are all pieces of text. The model reads the text, one piece after another, and predicts the next word.",
  "We need to translate the report into three languages: English, Spanish and French. The translator reads each sentence, thinks about the meaning and writes a new sentence. Some words are easy to translate, others are impossible.",
  "The customer wrote a long message to the company. He said that the product arrived late, that the box was broken and that nobody answered the phone. The company apologized, sent a new product and gave him a discount.",
  "Today is Monday, tomorrow is Tuesday, and the weekend is still far away. I have a meeting in the morning, a call in the afternoon and a lot of emails to answer before going home.",
  "The best way to learn a language is to read, to listen and to speak every day. You don't need a perfect accent or a big vocabulary to begin. You need time, patience and people who are happy to talk with you.",
  "In the future, many jobs will use artificial intelligence as a tool. A doctor, a teacher or an engineer can use it to read documents, write drafts and find information faster. But the final decision will still belong to a person.",
  "The museum opens at 10 in the morning and closes at 6 in the evening. On Sundays the tickets are free, so the lines are long. Inside, there are paintings, statues and old maps of the city.",
  "A small team can do big things when everyone knows the goal. They share information, ask for help and celebrate every success. When something goes wrong, they look for the cause and not for a culprit.",
  "Water is essential for life. We drink it, we cook with it and we use it to wash. In many places it is scarce, so we should not waste it. Closing the tap while we brush our teeth is a small habit with a big effect.",
  "My sister is named Clara. She has a dog named Rocky, and the dog is bigger than the sofa. Hello, Clara! Hello, Rocky! How are you today? How is the family? They are fine, and they say hello.",
  "Hello, and welcome! How can I help you? I would like to know the price of the ticket, please. How much is it? How long is the trip? Thank you very much, and have a nice day.",
];

export const ES: string[] = [
  "Cada mañana, María camina al mercado que está cerca de su casa. Compra pan fresco, unos tomates y una botella de agua. El vendedor sabe su nombre y siempre le pregunta por su familia. Hablan del clima, de los precios y del partido de fútbol de anoche.",
  "La ciudad se está despertando. Los autobuses van llenos, las calles están ruidosas y la gente se apura para llegar al trabajo. Algunos leen las noticias en el teléfono, otros escuchan música. Va a ser un día largo, pero el café ayuda.",
  "En la oficina, el equipo prepara el informe mensual. El gerente pide las cifras del último trimestre y un resumen corto para la reunión. Nadie quiere llegar tarde, así que todos trabajan con cuidado. Los resultados son mejores de lo esperado y los clientes están contentos.",
  "Aprender algo nuevo toma tiempo. Lees, practicas, te equivocas y vuelves a intentarlo. Un buen maestro explica la idea con ejemplos sencillos y después te pide que resuelvas un problema por ti mismo. Después de unas semanas, lo difícil se vuelve fácil.",
  "Cocinar es una buena manera de relajarse. Primero se pica la cebolla y el ajo. Luego se calienta el aceite, se agregan las verduras y se espera a que estén suaves. Un poco de sal, algo de pimienta y mucha paciencia hacen que la cena sepa mejor.",
  "Las computadoras pueden guardar y procesar enormes cantidades de información. Un programa recibe datos, sigue un conjunto de instrucciones y devuelve una respuesta. Hoy, algunos programas aprenden de ejemplos en lugar de seguir reglas fijas. Encuentran patrones en los datos y los usan para hacer predicciones sobre casos nuevos.",
  "El clima fue terrible durante nuestro viaje a las montañas. Llovió durante 3 días y las carreteras estuvieron cerradas. Nos quedamos en un hotel pequeño, jugamos a las cartas y hablamos de todo. En la cuarta mañana por fin salió el sol y la vista fue inolvidable.",
  "Los médicos recomiendan dormir ocho horas, tomar suficiente agua y caminar todos los días. Los hábitos saludables son sencillos, pero no siempre son fáciles. Si te sientes cansado todo el tiempo, debes hablar con un especialista. Prevenir es más barato y mejor que curar.",
  "Mi hermano toca la guitarra en una banda. Practican dos veces por semana en un garaje y tienen un concierto el próximo mes. Dice que lo más difícil no es la música, sino encontrar un día en que todos estén libres.",
  "Viajar en tren es más lento que volar, pero es más cómodo. Puedes mirar por la ventana, leer un libro o simplemente pensar. El boleto sale más barato si lo compras con tiempo, y las estaciones suelen estar en el centro de la ciudad.",
  "Nuestra empresa está empezando un proyecto nuevo con inteligencia artificial. Primero necesitamos entender el problema y reunir buenos datos. Después podemos entrenar un modelo, probarlo con ejemplos reales y medir los resultados. La decisión de usarlo debe basarse en evidencia, no en promesas.",
  "Los niños hacen muchas preguntas: por qué el cielo es azul, de dónde viene la lluvia, cómo vuelan los pájaros. Las mejores respuestas son honestas y breves. Cuando no sabemos algo, está bien decirlo y buscar la respuesta juntos.",
  "El partido de fútbol empezó a las 9 en punto. En el primer tiempo no hubo goles, pero el segundo fue emocionante. El equipo local anotó dos veces en 10 minutos y el estadio temblaba. Los aficionados cantaron hasta la medianoche.",
  "El dinero es una herramienta, no una meta. Un presupuesto sencillo te ayuda a saber cuánto ganas, cuánto gastas y cuánto puedes ahorrar. Las decisiones pequeñas que se repiten cada mes importan más que una sola decisión grande.",
  "Mi abuela vive en una casa pequeña cerca del río. Por la tarde se sienta en el jardín con su gato, toma té y cuenta historias de los viejos tiempos. El gato duerme sobre sus piernas y nunca escucha, pero ella dice que lo entiende todo.",
  "La biblioteca está abierta de lunes a viernes. Los estudiantes vienen a estudiar, a pedir libros prestados y a usar las computadoras. Es un lugar tranquilo, cálido y lleno de ideas. La bibliotecaria dice que un buen libro es el mejor amigo que una persona puede tener.",
  "Cuando viajamos, tratamos de aprender algunas palabras del idioma local. La gente siempre se alegra cuando dices hola, gracias o por favor en sus propias palabras. Incluso un mal acento abre puertas, y los errores hacen reír a todos.",
  "Estoy aprendiendo a cocinar, a nadar y a hablar otro idioma. No es fácil y todavía no soy muy bueno, pero cada semana entiendo un poco más. Mis amigos dicen que el secreto es practicar un poco todos los días.",
  "Mucha gente usa el teléfono para leer, para pagar y para hablar con su familia. El teléfono también es una cámara, un mapa y una libreta. Llevamos en el bolsillo lo que antes llenaba un cuarto entero.",
  "El restaurante de la esquina sirve arroz, frijoles, sopa y fruta fresca. El dueño cocina todos los días y conoce a casi todos los clientes. Los domingos el lugar se llena, así que es mejor llegar temprano y esperar con un café.",
  "Una buena pregunta suele ser más útil que una respuesta rápida. Muestra lo que no entendemos y dónde debemos buscar. Los científicos, los ingenieros y los estudiantes empiezan igual: con una pregunta y un poco de curiosidad.",
  "La escuela nueva tiene veinte salones, una biblioteca y un patio grande. Los maestros y los padres trabajaron juntos durante años para construirla. El primer día, los niños llegaron temprano y todos estaban un poco nerviosos.",
  "¡Hola! ¿Cómo estás hoy? Estoy bien, gracias. ¿Y tú? Yo también estoy bien. Hola, me llamo Ana y vivo en la Ciudad de México. Mucho gusto.",
  "Mi gato se llama Luna. Mi gato se llama Max. Mi vecina dice que mi gato es el más flojo del edificio, y probablemente tiene razón. Mi gato duerme todo el día y come toda la noche.",
  "Por favor, envíame el correo con el contrato antes de la reunión. Gracias por tu ayuda, y por favor llámame si tienes alguna pregunta. El precio del proyecto está en el documento.",
  "Un token es un pedazo de texto. Las palabras, las letras, los números y los signos son pedazos de texto. El modelo lee el texto, un pedazo tras otro, y predice la siguiente palabra.",
  "Necesitamos traducir el informe a tres idiomas: inglés, español y francés. El traductor lee cada oración, piensa en el significado y escribe una oración nueva. Algunas palabras son fáciles de traducir, otras son imposibles.",
  "El cliente escribió un mensaje largo a la empresa. Dijo que el producto llegó tarde, que la caja venía rota y que nadie contestaba el teléfono. La empresa se disculpó, envió un producto nuevo y le dio un descuento.",
  "Hoy es lunes, mañana es martes y el fin de semana todavía está lejos. Tengo una reunión en la mañana, una llamada en la tarde y muchos correos que contestar antes de irme a casa.",
  "La mejor manera de aprender un idioma es leer, escuchar y hablar todos los días. No necesitas un acento perfecto ni un vocabulario enorme para empezar. Necesitas tiempo, paciencia y personas a las que les dé gusto hablar contigo.",
  "En el futuro, muchos trabajos usarán la inteligencia artificial como herramienta. Un médico, una maestra o un ingeniero pueden usarla para leer documentos, escribir borradores y encontrar información más rápido. Pero la decisión final seguirá siendo de una persona.",
  "El museo abre a las 10 de la mañana y cierra a las 6 de la tarde. Los domingos la entrada es gratis, así que las filas son largas. Adentro hay pinturas, estatuas y mapas antiguos de la ciudad.",
  "Un equipo pequeño puede hacer cosas grandes cuando todos conocen la meta. Comparten información, piden ayuda y celebran cada logro. Cuando algo sale mal, buscan la causa y no un culpable.",
  "El agua es esencial para la vida. La bebemos, cocinamos con ella y la usamos para lavar. En muchos lugares escasea, así que no debemos desperdiciarla. Cerrar la llave mientras nos cepillamos los dientes es un hábito pequeño con un gran efecto.",
  "Mi hermana se llama Clara. Tiene un perro que se llama Rocky, y el perro es más grande que el sofá. ¡Hola, Clara! ¡Hola, Rocky! ¿Cómo estás hoy? ¿Cómo está la familia? Están bien y te mandan saludos.",
  "¡Hola, y bienvenido! ¿Cómo puedo ayudarte? Me gustaría saber el precio del boleto, por favor. ¿Cuánto cuesta? ¿Cuánto dura el viaje? Muchas gracias y que tengas un buen día.",
];

/**
 * Variantes de corpus con las que se entrena (todas con el mismo presupuesto de fusiones).
 *  · «solo inglés»: únicamente `EN`.
 *  · «mayormente inglés»: `EN` + `ES_CORE` (8 párrafos de español, algo menos de una tercera parte).
 *  · «equilibrado»: `EN` + todo `ES`.
 * `ES[i]` traduce `EN[i]`; `ES_CORE` son los párrafos de `ES` con estos índices.
 */
const CORE = new Set([10, 11, 14, 22, 23, 24, 34, 35]);
export const ES_CORE: string[] = ES.filter((_, i) => CORE.has(i));
