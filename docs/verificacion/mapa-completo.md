# mapa-completo · El mapa completo

Registro de verificación. Primera versión: 2026-10-12 (lección escrita desde cero con el criterio «llevar de la mano»). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

La lección no introduce términos ni cifras nuevas: reúne lo que ya enseñaron las otras 36. Por eso casi todo se contrastó **contra las lecciones y sus registros** (que a su vez lo contrastaron con la fuente primaria) y, para las fechas de la línea de tiempo, otra vez contra la fuente, hoy.

## Verificado el 2026-10-12

### Las ideas del mapa (una frase por lección)
- Cada frase de `data.ts` (`IDEAS`) resume las ideas clave (`keyIdeas`) del `content.ts` de su lección, leídas hoy con un volcado de las 35 lecciones escritas (título, pregunta, ideas clave, lente y fuentes). No hay en ellas ningún dato que su lección no diga. Ejemplos: la 4 copia la regla «peso nuevo = peso actual − η × pendiente»; la 13, «en 2012 coincidieron datos masivos, GPUs y trucos»; la 35, «riesgo = probabilidad × impacto».
- **Lección 36 (estrategia)**: se escribía al mismo tiempo. Su frase («elegir casos de uso por frecuencia, valor y riesgo, y empezar con pilotos medidos») sale de su entrada en `CURRICULUM-MAP.md` y se contrastó con las ideas clave de su borrador de hoy (frecuencia × valor × riesgo; piloto con usuarios reales, línea base y meta medible). **Revisarla cuando se publique.**
- Títulos, módulos, orden y rutas de las lecciones salen de `curriculum.ts` (se importan; no se copiaron a mano).

### La línea de tiempo (solo fechas ya verificadas en las lecciones)
| Hito | Lección y registro | Comprobado hoy |
|---|---|---|
| McCulloch y Pitts, 1943 | 5 (`neurona.md`) | Crossref, DOI 10.1007/BF02478259: diciembre de 1943 |
| Rosenblatt, perceptrón, 1958 | 5 | Crossref, DOI 10.1037/h0042519: 1958 |
| Samuel, damas, 1959 | 1 (`que-es-aprender.md`) | Crossref, DOI 10.1147/rd.33.0210: julio de 1959 |
| Minsky y Papert, *Perceptrons*, 1969 | 6 (`limite-xor.md`, leído en la edición de 1988) | MIT Press responde 403 a herramientas; la fecha (Copyright 1969) consta en el registro de la lección 6 |
| Rumelhart, Hinton y Williams, 1986 | 8 (`backpropagation.md`) | Crossref, DOI 10.1038/323533a0: octubre de 1986 |
| Hochreiter y Schmidhuber, LSTM, 1997 | 12 | Crossref, DOI 10.1162/neco.1997.9.8.1735: noviembre de 1997 |
| AlexNet gana ImageNet con dos GPU, 2012 | 13 (`big-bang-deep-learning.md`) | página de NeurIPS 2012 (200, título coincide) |
| word2vec, 2013 | 14 | arXiv 1301.3781, publicado el 16 de enero de 2013 |
| GAN, 2014 | 16 | arXiv 1406.2661, 10 de junio de 2014 |
| Transformer, «Attention Is All You Need», 2017 | 21 y 22 | arXiv 1706.03762, 12 de junio de 2017 |
| GPT-3, 175 000 millones de parámetros, 2020 | 19 | arXiv 2005.14165, 28 de mayo de 2020 (la cifra está en el resumen, verificada en `siguiente-palabra.md`) |
| Stable Diffusion, agosto de 2022 | 17 | anuncio de Stability AI (200): `datePublished` 2022-08-22 |
| ChatGPT, 30 de noviembre de 2022 | 28 (`alineacion.md`) | openai.com da 403; copia de Wayback (`web.archive.org/web/2023id_/https://openai.com/blog/chatgpt`): «November 30, 2022», «Introducing ChatGPT» |
| o1, septiembre de 2024 | 29 (`razonamiento.md`) | openai.com da 403; copia de Wayback de «Learning to reason with LLMs»: «September 12, 2024» |
| MCP, noviembre de 2024 | 32 (`agentes.md`) | página de Anthropic (200): «Nov 25, 2024» |

- «Con otros factores, llega el primer invierno de la IA» repite la redacción prudente de la lección 6 (su registro explica por qué no se atribuye el invierno solo al libro).
- «La neurona artificial tiene más de ochenta años»: 2026 − 1943 = 83.
- Los dos tramos de `tl-gap` son una cuenta sobre la selección de hitos de esta lección (rotulado al pie: «la selección de hitos es de este curso»): 6 hitos entre 1943 y 2011 en 69 años (2012 − 1943); 7 hitos entre 2012 y 2024 en los 14 años hasta 2026. Calculado con el código de «por dentro».
- «Lo que cambió desde 2012 fue la escala: muchos más datos, más cómputo y algunos trucos» resume la idea clave 1 de la lección 13.
- «Por dentro» menciona otros hitos que la lección no narra: atención de Bahdanau y colaboradores (arXiv 1409.0473, 1 de septiembre de 2014), ResNet (arXiv 1512.03385, diciembre de 2015), DDPM (arXiv 2006.11239, junio de 2020), RAG (arXiv 2005.11401, mayo de 2020) y CLIP (arXiv 2103.00020, febrero de 2021; la lección 18 usa la fecha del anuncio, enero de 2021). Títulos y fechas comprobados hoy en la API de arXiv; todos están en `sources`.

### Las diez preguntas
- Cada pregunta sale de la lente de decisión o de las ideas clave de las lecciones que nombra (leídas hoy): 1 ← lente 1 de la lección 1; 2 ← lentes de 1 y 23; 3 ← lentes de 10 y 34; 4 ← ideas clave y lente de 33; 5 ← lentes de 23 (corte de conocimiento) y 31; 6 ← lentes de 20, 26 y 30; 7 ← lentes de 30 y 35; 8 ← lentes de 32 y 35; 9 ← lentes de 34 y 35; 10 ← lentes de 33 (Air Canada) y 35. La tabla de «por dentro» (buena respuesta y señal de alerta) también se tomó de esas lentes.
- «Pide evidencia con tus datos antes que promesas, como en la lección seis»: lente 1 de la lección 6.

### Quiz, código y enlaces
- Quiz 3: 0.95¹⁰ = 0.599 (lección 32 y su registro).
- Código de «por dentro» (es y en) ejecutado hoy con Python 3: salida `1.99`, `[0.659, 0.242, 0.099]`, `0.599`, `69 6 14 7`, idéntica a la escrita (en el primer borrador decía 1.98; se corrigió).
- `npx tsx scripts/check-sources.mts --online mapa-completo`: 20 fuentes, 0 sin enlace, 0 rotos, 0 no comprobables. Además, a mano: títulos y fechas de los nueve artículos de arXiv (API de arXiv) y de los cinco DOI (Crossref); NeurIPS, Stability AI y Anthropic responden 200 con el título correcto; OpenAI y MIT Press responden 403 a herramientas (comprobados por Wayback o por el registro de su lección).

## No verificado o dudoso
- La frase de la lección 36 depende de un borrador que otra persona escribía al mismo tiempo (ver arriba).
- La selección de hitos y el reparto de la cuenta de `tl-gap` son decisiones editoriales de esta lección, no un dato del mundo: con otra selección, los números cambian. Está rotulado en pantalla y en «por dentro».
- La edición de 1969 de *Perceptrons* no se volvió a leer hoy: la fecha se toma del registro de la lección 6 (MIT Press no responde a herramientas).
