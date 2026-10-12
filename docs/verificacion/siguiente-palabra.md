# siguiente-palabra · Predecir la siguiente palabra

Registro de verificación (2026-10-11, reescritura completa de la lección con el criterio «llevar de la mano»). Las fuentes citadas están en `sources` del `content.ts` de la lección; aquí consta cómo se comprobó cada cosa, qué se corrigió del borrador anterior y qué quedó sin comprobar.

## Qué cambió respecto del borrador anterior
- **Corpus.** El borrador contaba sobre los capítulos I–III de *Don Quijote* (español) y de *Alice’s Adventures in Wonderland* (inglés). Como cada idioma tenía su propio texto, la voz decía cifras distintas en cada idioma («treinta y uno de treinta y ocho» frente a «siete de once») y la escena no podía decir lo mismo en los dos. Además, seis mil palabras no se pueden mostrar ni contar a la vista. Se sustituyó por un texto de **ocho frases escrito para la lección** (`lm.ts`, `CORPUS`), paralelo palabra por palabra en español e inglés (correspondencia uno a uno: el ↔ the, cielo ↔ sky, es ↔ is…). Así todas las cuentas, probabilidades, corridas sorteadas y frases generadas coinciden en los dos idiomas, y la escena puede mostrar el texto entero y contar con quien mira. Se borraron `corpus.ts`, `build-corpus.mjs` y `draw.ts`, y las dos fuentes de Project Gutenberg.
- **Orden y ritmo.** Ejemplo antes del término («el cielo es…» → barras, y solo después «modelo de lenguaje»); contar pieza por pieza (cada «es», la palabra siguiente, la cuenta, la división entre el total); autorregresión con una demostración que escribe sola; voraz frente a sortear con una franja y dardos; límites de contar → red neuronal → puntajes → softmax en dos pasos con números sencillos; temperatura con demostración automática y diez sorteos visibles; top-k y top-p; el ensayo; GPT-1/2/3. Se quitó la sección de trigramas y memorización del borrador (no cabía sin acelerar).
- **Interacción.** Dos «tu turno» opcionales y simples (un botón, un deslizador), cada uno precedido de su demostración automática; los gates cuentan solo lo que hizo la persona (`S.touched`).
- **Hechos.** GPT-1 «117 millones» ahora se atribuye a la tabla 2 del artículo de GPT-2 (el artículo de GPT-1 no da la cifra). La lente ya no afirma que «algunos proveedores advierten que con temperatura cero los resultados pueden no ser idénticos» ni que «algunos modelos ya no permiten fijarla»: no se encontró hoy una página primaria que lo diga (la documentación de la API de Anthropic no se pudo leer sin JavaScript y la de OpenAI devolvió 403). Queda una formulación prudente: bajar la temperatura vuelve la respuesta más repetible, no más veraz, y no todos los productos exponen los parámetros.

## Verificado

### Hechos externos (PDF descargados y leídos con `pdftotext`)
- **GPT-1** — Radford, Narasimhan, Salimans y Sutskever, «Improving Language Understanding by Generative Pre-Training» (PDF en cdn.openai.com). Objetivo: «we use a standard language modeling objective to maximize the following likelihood» (ecuación 1); «12-layer decoder-only transformer with masked self-attention heads (768 dimensional states…)»; datos: «BooksCorpus… over 7,000 unique unpublished books»; «bytepair encoding (BPE) vocabulary with 40,000 merges». El PDF no lleva fecha; el año 2018 consta en la referencia del artículo de GPT-2 («Improving language understanding by generative pre-training. 2018»). El artículo **no** da el número de parámetros.
- **117 millones y 1 500 millones** — Radford et al., «Language Models are Unsupervised Multitask Learners» (GPT-2, 2019), tabla 2: 117M, 345M, 762M y 1542M parámetros; «The smallest model is equivalent to the original GPT»; resumen: «a 1.5B parameter Transformer»; WebText: «slightly over 8 million documents for a total of 40 GB of text»; «The vocabulary is expanded to 50,257». La voz dice «mil quinientos millones» y el lienzo «1 500 millones» (redondeo del «1.5B» del resumen; «por dentro» da los 1 542 exactos).
- **175 000 millones** — Brown et al., «Language Models are Few-Shot Learners» (GPT-3), arXiv 2005.14165 (publicado el 28 de mayo de 2020): «an autoregressive language model with 175 billion parameters»; «We use the same model and architecture as GPT-2». La tabla 2.1 cuenta 125M para «GPT-3 Small» (12 capas, 768), de la misma forma que GPT-1; se menciona en «por dentro» como curiosidad (la diferencia cuadra con el vocabulario más grande, 40 000 fusiones frente a 50 257 piezas; es una explicación, no una cifra del artículo).
- **«Unas mil quinientas veces»** — 175 000 ÷ 117 = 1 496 (lo calcula `verify-data.ts`).
- **Los chatbots se construyen sobre modelos de lenguaje** (`lm`) — GPT-4 Technical Report, arXiv 2303.08774, resumen: «GPT-4 is a Transformer-based model pre-trained to predict the next token in a document. The post-training alignment process…»; e InstructGPT (Ouyang et al., arXiv 2203.02155), resumen: ajustan GPT-3 con demostraciones y retroalimentación humana para que siga instrucciones. La página de OpenAI «Introducing ChatGPT» devolvió 403 y no se cita.
- **Shannon (1948)** — DOI 10.1002/j.1538-7305.1948.tb01338.x comprobado en Crossref («A Mathematical Theory of Communication», Bell System Technical Journal, julio de 1948). Texto leído en una copia en PDF: «6. Second-order word approximation. The word transition probabilities are correct but no further structure is included.»
- **Bengio et al. (2003)** — página de JMLR (vol. 3, 1137–1155) y PDF: el ejemplo «The cat is walking in the bedroom» / «A dog was running in a room» y «“similar” words are expected to have a similar feature vector». Sostiene el segmento `embed` («si en otros textos “océano” se usa como “mar”, sus vectores quedan cerca y la red responde parecido»).
- **Temperatura** — Hinton, Vinyals y Dean, arXiv 1503.02531: «where T is a temperature that is normally set to 1. Using a higher value for T produces a softer probability distribution». Que la distribución de Boltzmann tiene la misma forma es matemática, no una cita.
- **Top-k** — Fan, Lewis y Dauphin, arXiv 1805.04833: «We generate stories from our models using a top-k random sampling scheme… randomly sample from the k = 10 most likely».
- **Top-p** — Holtzman et al., arXiv 1904.09751 (ICLR 2020): definición del conjunto $V^{(p)}$ como «the smallest set such that $\sum P \ge p$» (ecuación 2); resumen: «maximization-based decoding methods such as beam search lead to degeneration — output text that is bland, incoherent, or gets stuck in repetitive loops». La lección cita el año de ICLR (2020); el preprint es de abril de 2019.
- Enlaces: `npx tsx scripts/check-sources.mts --online siguiente-palabra` → 10 fuentes, 0 sin enlace, 0 rotos.

### El modelo de la escena y las cifras propias
- `verify-data.ts` (en la carpeta; `npx tsx src/content/courses/ia-generativa/lessons/siguiente-palabra/verify-data.ts` desde `app/`) sale con **0 discrepancias**, en español y en inglés:
  - el texto es paralelo (47 piezas, correspondencia uno a uno entre 15 palabras);
  - «es» aparece 8 veces; le siguen azul 4, gris 2, grande 1, oscuro 1 → 50, 25, 12.5 y 12.5 %;
  - tras «el», «cielo» 5 de 9; la tabla tiene 15 filas (se ven 6);
  - tras «azul», punto 75 % e «y» 25 %;
  - la corrida de `run` (semilla 74, 8 vueltas desde «el cielo es azul») escribe «el cielo es azul. de noche el mar es oscuro.»; esa frase no está en el texto y sus tres pedazos sí (frases 5, 2 y 7);
  - la elección voraz desde «el cielo es» repite «el cielo es azul.» tres veces;
  - los diez dardos (semilla 2) dan 5/3/1/1; las tres corridas (semillas 32, 1 y 36) son distintas;
  - puntajes $\ln c - \ln 2$ = 0.693, 0, −0.693, −0.693 (en pantalla 0.7, 0, −0.7); su exponencial es exactamente 2, 1, 0.5 y 0.5 (con los valores redondeados, $e^{0.7}\approx 2.01$ y $e^{-0.7}\approx 0.50$: «casi dos», «un medio»); suma 4; softmax = 50, 25, 12.5 y 12.5 %;
  - temperatura 0.5: azul 72.7 % («setenta y tres»); temperatura 2: azul 36.9 % y oscuro 18.5 % («treinta y siete», «dieciocho»); temperatura 0.1: azul 99.9 % y los diez sorteos (semilla 35) dan azul;
  - top-k con k = 2: 67 y 33 %; top-p con p = 70 %: azul y gris (juntan 75 %); tras «cielo», una sola palabra (100 %).
- Código de «por dentro» (es y en): ejecutado con Python 3; imprime exactamente la salida que muestra la lección.
- Escena revisada con hojas de contacto (`lesson-sheet`): escritorio claro es, escritorio oscuro en, teléfono oscuro en, teléfono pequeño claro es, teléfono horizontal oscuro es y tableta clara en; también a la mitad de cada segmento (`--at 50%`) y los dos gates con `--steps` (pulsar «Escribir otra vez» dos veces; mover la temperatura a 0.2, 2.5 y 1.6).

## Decisiones y matices
- El texto de ocho frases es propio de la lección (sin derechos de terceros) y es un ejemplo de juguete: se dice en la narración («escritas para esta lección»). El modelo sí es real: cuenta, divide, sortea y escribe de verdad.
- Los puntajes de la red en `scores` son de ejemplo y se rotulan así («elegidos para comparar»; en pantalla, «de ejemplo»): se eligieron para que softmax dé las mismas barras que el conteo.
- El mapa de embeddings de `embed` es una proyección ilustrativa (rotulada); no se midió con vectores reales.
- La partición en piezas del puente (`bridge`) es ilustrativa (rotulada); la lección 20 enseña la de verdad.
- Las semillas de las demostraciones se eligieron mirando las salidas (como se elige una toma); cada corrida es una corrida real del sorteo y se reproduce con su semilla.
- La lección dice «palabras» y avisa en el puente que los modelos reales leen tokens; «unas mil vueltas» para mil palabras es una aproximación (en tokens serían más).

## No verificado o dudoso
- Que con temperatura cero algunos proveedores no garanticen respuestas idénticas: se quitó de la lente porque no se pudo leer hoy una fuente primaria.
- Fecha exacta de GPT-1 (junio de 2018 según el blog de OpenAI, que no se consultó): la lección solo dice el año, que consta en la referencia del artículo de GPT-2.
- El audio no se generó. Conviene escuchar al generarlo: «n-gramas» (lleva `tts` con «ene gramas»), «top-k» y «top-p» (llevan `tts`), «GPT» (en el léxico y en `tts`). «softmax» y «embedding» no están en el léxico de voz: si la voz en español los lee mal, hay que agregarlos (fuera de esta carpeta).
