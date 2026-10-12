# Mapa del currículo: IA generativa, de la neurona al chatbot

Fuente de verdad de **qué enseña cada lección, qué asume, qué introduce y cómo se conecta con la siguiente**. Los ids y el orden están en `app/src/content/courses/ia-generativa/curriculum.ts`.

## Reglas del mapa

1. **Narrativa incremental**: una lección solo usa conceptos introducidos en lecciones anteriores (o los define ahí mismo). Cada lección termina con un **puente** (la pregunta que abre la siguiente).
2. **Propiedad de términos**: cada término de glosario lo define **una sola** lección (la que lo introduce). Las demás lo listan en `glossary` sin redefinirlo. La columna *Introduce* es el reparto; los ids son los de `terms`.
3. **Hechos verificables**: los datos marcados *(verificar)* deben comprobarse en una fuente primaria (artículo, informe técnico o documento oficial) antes de publicarse. Si no se puede verificar, se elimina o se matiza («alrededor de…», «según el informe técnico»). Nunca inventar cifras, citas ni URL.
4. **Ruta ejecutiva** (`exec`): las lecciones marcadas ⭐ forman la ruta ejecutiva. Su lente de decisión debe ser especialmente concreta.
5. **Interactividad con sentido**: cada lección tiene al menos un *gate* «Tu turno» donde la persona mueve algo y el resultado enseña. Las demostraciones usan datos reales o claramente rotulados como ilustrativos.

Referencia de calidad: la lección 4 (`descenso-del-gradiente`) está completa y es el modelo de forma, tono y profundidad.

---

## Módulo 1 · Aprender de los datos

### 01 · `que-es-aprender` ⭐ — Programar o aprender
- **Pregunta**: ¿qué cambia cuando una máquina aprende en lugar de seguir reglas?
- **Asume**: nada.
- **Contenido**: programar = reglas + datos → respuestas; aprender = datos + respuestas → reglas. Ejemplo concreto (clasificar correos o frutas por dos medidas): la persona intenta escribir la regla a mano y ve que es frágil; luego la máquina la encuentra a partir de ejemplos etiquetados. Entrenar vs usar (inferencia). Generalizar: acertar con casos nunca vistos. El «modelo» guarda lo aprendido en números (parámetros).
- **Introduce**: `machine-learning`, `training-data`, `model`, `generalization`, `parameter`, `inference`.
- **Interactivo**: dibujar a mano un umbral/recta sobre puntos de dos clases y comparar con el que aprende la máquina; añadir un punto nuevo para probar la generalización.
- **Hechos (verificar)**: «machine learning» acuñado por Arthur Samuel (1959, damas).
- **Lente**: ¿cuándo conviene aprender de datos (reglas desconocidas, datos abundantes, errores tolerables) y cuándo escribir reglas?
- **Puente**: ¿cómo se le dan «ejemplos» a una máquina? Con números.

### 02 · `datos-como-numeros` ⭐ — El mundo hecho de números
- **Asume**: 01.
- **Contenido**: una imagen es una cuadrícula de píxeles (0–255); el color son tres canales; el sonido son muestras en el tiempo; el texto se convierte en números (adelanto de tokens y embeddings). Vectores y características (*features*). Todo dato entra al modelo como un vector/tensor.
- **Introduce**: `pixel`, `vector`, `feature`, `tensor`.
- **Interactivo**: pintar en una cuadrícula pequeña y ver la lista de números en vivo; desenfocar; ver cómo cambia el vector; convertir una palabra corta en números.
- **Hechos (verificar)**: MNIST (28×28, 60 000 de entrenamiento y 10 000 de prueba); una foto de 12 megapíxeles tiene unos 36 millones de valores (3 canales).
- **Lente**: la calidad y la representación de los datos condicionan todo lo demás; «basura entra, basura sale».
- **Puente**: con los datos en números, necesitamos un modelo. El más simple: una recta.

### 03 · `modelo-y-error` — Un modelo y su error
- **Asume**: 01, 02.
- **Contenido**: el modelo lineal $y = wx + b$ como primer modelo; peso (pendiente) y sesgo; predicción; error por punto; por qué elevar al cuadrado (errores como cuadrados cuya área suma); función de pérdida (MSE); la mejor recta es la de menor pérdida.
- **Introduce**: `weight`, `bias`, `prediction`, `loss`, `mse`, `regression`.
- **Interactivo**: arrastrar la recta sobre puntos reales y ver cuadrados de error y el valor de la pérdida en vivo; probar «error absoluto vs cuadrático».
- **Hechos (verificar)**: mínimos cuadrados (Legendre 1805 / Gauss).
- **Puente**: ¿cómo encontrar el peso con menor pérdida sin probar todos? (→ lección 4).

### 04 · `descenso-del-gradiente` ⭐ — **COMPLETA** (modelo de referencia)
- **Introduce**: `gradient-descent`, `gradient`, `derivative`, `learning-rate`.
- **Puente**: necesitamos un modelo más rico que una recta: la neurona.

## Módulo 2 · Redes neuronales

### 05 · `neurona` ⭐ — La neurona artificial
- **Asume**: 02–04.
- **Contenido**: suma ponderada de entradas + sesgo + función de activación; la neurona como frontera de decisión (recta en 2D); perceptrón (Rosenblatt, 1958) y la regla de aprendizaje; activación escalón → sigmoide (salida suave 0–1); inspiración biológica *y* sus límites (no es un cerebro).
- **Introduce**: `neuron`, `activation`, `decision-boundary`, `perceptron`, `sigmoid`.
- **Interactivo**: ajustar $w_1, w_2, b$ y ver cómo gira y se desplaza la frontera sobre datos; entrenar con pasos del perceptrón.
- **Hechos (verificar)**: McCulloch y Pitts 1943; perceptrón de Rosenblatt 1958 (Mark I Perceptron).
- **Lente**: una «neurona» es una fórmula, no inteligencia; desmitifica antropomorfismos.
- **Puente**: ¿y si los datos no se separan con una recta?

### 06 · `limite-xor` — Lo que una neurona no puede
- **Asume**: 05.
- **Contenido**: separabilidad lineal; AND y OR se separan, XOR no; *Perceptrons* (Minsky y Papert, 1969) y el primer «invierno de la IA»; dos neuronas combinadas resuelven XOR: nace la capa oculta.
- **Introduce**: `xor`, `linear-separability`, `hidden-layer`, `ai-winter`.
- **Interactivo**: intentar separar XOR con una sola recta (imposible) y luego con dos neuronas.
- **Lente**: la historia de la IA son ciclos de expectativa y desencanto; pide evidencia, no promesas.
- **Puente**: más neuronas, en capas… ¿cuánto poder se gana?

### 07 · `capas-y-activaciones` — Capas y activaciones
- **Asume**: 05, 06.
- **Contenido**: apilar capas lineales colapsa en una sola; la no linealidad (ReLU, sigmoide, tanh) «dobla» el espacio; teorema de aproximación universal (intuición); redes profundas; pase hacia delante.
- **Introduce**: `layer`, `relu`, `nonlinearity`, `universal-approximation`, `deep-network`, `forward-pass`.
- **Interactivo**: un «patio de juegos»: datos en 2D (círculos, espiral), elegir capas y neuronas, entrenar en el navegador y ver las regiones de decisión formarse. Una MLP pequeña real, entrenada en vivo en JavaScript.
- **Hechos (verificar)**: Cybenko 1989; Hornik 1989.
- **Puente**: ¿cómo se ajustan miles de pesos a la vez?

### 08 · `backpropagation` — Retropropagación
- **Asume**: 04, 07.
- **Contenido**: el error viaja hacia atrás; regla de la cadena; reparto de la «culpa» (credit assignment); quién corrige los pesos (descenso del gradiente) frente a quién calcula la culpa (retropropagación); recorrido paso a paso de una red diminuta con números reales (pase hacia delante, pérdida, gradientes, actualización).
- **Introduce**: `backpropagation`, `chain-rule`, `credit-assignment`.
- **Interactivo**: avanzar paso a paso por una red de 2–2–1 con valores visibles; cambiar un peso y ver cómo cambian todos los gradientes.
- **Hechos (verificar)**: Rumelhart, Hinton y Williams (1986, *Nature*); antecedentes: Linnainmaa (1970), Werbos (1974).
- **Puente**: ya sabemos calcular; ahora, ¿cómo entrenar bien en la práctica?

### 09 · `entrenar-bien` — Entrenar bien: lotes, épocas y optimizadores
- **Asume**: 04, 08.
- **Contenido**: lotes (mini-batch) y épocas; descenso del gradiente estocástico (ruido útil); momento; Adam (idea intuitiva); programación de la tasa de aprendizaje (calentamiento, decaimiento); hiperparámetros.
- **Introduce**: `batch`, `epoch`, `sgd`, `optimizer`, `adam`, `hyperparameter`.
- **Interactivo**: comparar SGD, momento y Adam sobre un paisaje 2D; mover el tamaño de lote y ver el ruido del camino.
- **Hechos (verificar)**: Adam (Kingma y Ba, 2014/2015).
- **Puente**: bajar el error de entrenamiento no basta: ¿funciona con datos nuevos?

### 10 · `generalizar-y-evaluar` ⭐ — Generalizar y evaluar
- **Asume**: 03, 09.
- **Contenido**: sobreajuste y subajuste; conjuntos de entrenamiento / validación / prueba; fuga de datos; regularización (decaimiento de pesos, *dropout*, parada temprana); métricas: exactitud, precisión, exhaustividad (*recall*), matriz de confusión; tasa base y clases desbalanceadas (una prueba «99 % exacta» puede ser inútil).
- **Introduce**: `overfitting`, `underfitting`, `validation-set`, `test-set`, `data-leakage`, `regularization`, `precision`, `recall`, `confusion-matrix`, `base-rate`.
- **Interactivo**: subir el grado de un polinomio y ver el error de entrenamiento bajar mientras el de validación sube; mover un umbral y ver cómo cambian precisión, recall y la matriz de confusión.
- **Lente**: exigir evaluación con datos no vistos; la métrica debe reflejar el costo real de cada tipo de error; cuidado con fugas de datos y con evaluaciones «de demostración».
- **Puente**: con estas bases, redes especializadas: empezamos por la visión.

## Módulo 3 · Deep learning

### 11 · `convoluciones` — Convoluciones y visión
- **Asume**: 02, 07.
- **Contenido**: un kernel que recorre la imagen (bordes, desenfoque); mapas de características; compartir pesos; *pooling*; jerarquía bordes → partes → objetos; por qué una red totalmente conectada no escala en imágenes.
- **Introduce**: `convolution`, `kernel`, `feature-map`, `pooling`, `cnn`.
- **Interactivo**: elegir kernels (bordes horizontales/verticales, desenfoque, nitidez) y ver el resultado sobre una imagen en píxeles; apilar dos.
- **Hechos (verificar)**: LeCun et al. 1989 (códigos postales) y LeNet-5 (1998).
- **Puente**: las imágenes tienen vecindad; el lenguaje tiene orden.

### 12 · `secuencias-y-memoria` — Secuencias y memoria
- **Asume**: 07, 08.
- **Contenido**: datos en orden; la red recurrente y su estado oculto como memoria; el gradiente que se desvanece; LSTM y sus compuertas (qué guardar, qué olvidar); limitaciones (secuencial, memoria corta, lento) → motivan la atención.
- **Introduce**: `rnn`, `hidden-state`, `vanishing-gradient`, `lstm`, `sequence-model`.
- **Interactivo**: ver cómo la influencia de una palabra se desvanece con la distancia; mover compuertas de una LSTM y ver qué se conserva.
- **Hechos (verificar)**: Hochreiter y Schmidhuber (1997); seq2seq (2014).
- **Puente**: ¿qué hizo posible que todo esto despegara a partir de 2012?

### 13 · `big-bang-deep-learning` — El big bang del deep learning
- **Asume**: 07–12.
- **Contenido**: tres ingredientes: datos (ImageNet), cómputo (GPUs) y trucos (ReLU, *dropout*, conexiones residuales); AlexNet 2012; por qué las GPUs (miles de núcleos para multiplicar matrices); redes más profundas con conexiones residuales (ResNet).
- **Introduce**: `gpu`, `imagenet`, `deep-learning`, `residual-connection`, `compute`.
- **Interactivo**: carrera CPU vs GPU sobre una multiplicación de matrices (ilustrativa, etiquetada); activar/desactivar conexiones residuales y ver el flujo del gradiente.
- **Hechos (verificar)**: ImageNet (~14 M de imágenes; ILSVRC 1,2 M de entrenamiento y 1000 clases); AlexNet 2012: error top-5 15,3 % frente a 26,2 % del segundo; 2 GPU GTX 580 de 3 GB; ResNet 2015: 152 capas, error top-5 3,57 %.
- **Puente**: ya sabemos ver; ¿cómo representa una máquina el significado?

### 14 · `embeddings` ⭐ — Embeddings: el significado como geometría
- **Asume**: 02, 07.
- **Contenido**: *one-hot* frente a vectores densos; word2vec; palabras parecidas quedan cerca; similitud coseno; aritmética de significados (con matices); búsqueda semántica; los sesgos de los datos viajan al espacio.
- **Introduce**: `embedding`, `cosine-similarity`, `vector-space`, `semantic-search`.
- **Interactivo**: un mapa 2D de ~60 palabras (proyección real de un embedding preentrenado, rotulada como proyección); escribir una consulta y ver los vecinos más cercanos.
- **Hechos (verificar)**: word2vec (Mikolov et al., 2013).
- **Lente**: búsqueda semántica y bases vectoriales; los embeddings heredan sesgos; mide la calidad de recuperación con tus propios casos.
- **Puente**: representar es la mitad; ¿se puede *generar*?

## Módulo 4 · Generar imágenes

### 15 · `generar-distribuciones` — Generar es aprender una distribución
- **Asume**: 02, 07, 14.
- **Contenido**: discriminar vs generar; una distribución de datos; muestrear; el espacio latente; autocodificadores (comprimir y reconstruir); VAE (nubes en lugar de puntos, espacio continuo); la IA no hace collage, aprende distribuciones.
- **Introduce**: `generative-model`, `distribution`, `latent-space`, `autoencoder`, `vae`, `sampling`.
- **Interactivo**: recorrer un espacio latente 2D y ver cómo una imagen en píxeles se transforma de forma continua.
- **Hechos (verificar)**: VAE (Kingma y Welling, 2013).
- **Puente**: otra forma de aprender a generar: competir.

### 16 · `gans` — GAN: el falsificador y el detective
- **Asume**: 15.
- **Contenido**: generador y discriminador; entrenamiento adversario (juego de suma cero); modo colapso e inestabilidad; por qué la difusión tomó la delantera.
- **Introduce**: `gan`, `generator`, `discriminator`, `mode-collapse`.
- **Interactivo**: GAN de juguete en 1D: ver la distribución del generador acercarse a la real mientras el discriminador se confunde (entrenamiento en vivo).
- **Hechos (verificar)**: Goodfellow et al., 2014.
- **Puente**: una idea distinta: aprender a quitar ruido.

### 17 · `difusion` — Difusión: de ruido a imagen
- **Asume**: 15.
- **Contenido**: el proceso hacia delante (añadir ruido) y el inverso (una red aprende a predecir el ruido); muchos pasos pequeños; guiado por texto (*classifier-free guidance*); difusión latente (más barata: trabaja en el espacio latente).
- **Introduce**: `diffusion`, `denoising`, `noise-schedule`, `latent-diffusion`, `guidance`.
- **Interactivo**: deslizador de ruido sobre una imagen en píxeles; animación del proceso inverso paso a paso sobre una nube de puntos 2D.
- **Hechos (verificar)**: Sohl-Dickstein et al. 2015; DDPM (Ho et al., 2020); Stable Diffusion (agosto de 2022, Rombach et al.).
- **Puente**: ¿y cómo entiende lo que le pides con palabras?

### 18 · `texto-a-imagen` — De texto a imagen
- **Asume**: 14, 17.
- **Contenido**: CLIP (aprendizaje contrastivo imagen-texto); condicionar la difusión con texto; el prompt; la escala de guiado; límites (texto dentro de la imagen, contar objetos, sesgos); procedencia y propiedad intelectual de los datos.
- **Introduce**: `clip`, `contrastive-learning`, `prompt`, `conditioning`.
- **Interactivo**: matriz de similitud imagen-texto estilo CLIP (la diagonal se ilumina); mover el guiado y ver el equilibrio fidelidad/variedad (ilustrativo).
- **Hechos (verificar)**: CLIP (Radford et al., enero de 2021; ~400 M de pares).
- **Lente**: derechos y procedencia (marcas de agua, C2PA), riesgos de suplantación y política de uso.
- **Puente**: de las imágenes al lenguaje: predecir la siguiente palabra.

## Módulo 5 · Transformers y lenguaje

### 19 · `siguiente-palabra` ⭐ — Predecir la siguiente palabra
- **Asume**: 07, 14.
- **Contenido**: un modelo de lenguaje asigna probabilidades a la siguiente pieza de texto; autorregresión (cada palabra generada se vuelve contexto); *softmax*; muestreo: temperatura, top-k/top-p; voraz vs. aleatorio; «¿cómo escribe un ensayo algo que solo predice?»; GPT-1/2/3: mismo objetivo, más escala.
- **Introduce**: `language-model`, `autoregression`, `softmax`, `temperature`, `top-p`.
- **Interactivo**: un modelo de n-gramas diminuto (calculado sobre un texto corto incluido) con barras de probabilidad y control de temperatura; generar varias veces.
- **Hechos (verificar)**: GPT-1 (2018, 117 M), GPT-2 (2019, 1,5 mil M), GPT-3 (2020, 175 mil M).
- **Lente**: la salida es probabilística: la misma pregunta puede dar respuestas distintas; fija temperatura y valida.
- **Puente**: ¿qué «piezas» exactamente? Los tokens.

### 20 · `tokens` ⭐ — Tokens: el alfabeto del modelo
- **Asume**: 19.
- **Contenido**: el modelo no lee letras ni palabras sino tokens; BPE (fusión de pares frecuentes); tamaños de vocabulario; por qué se cobra por token; el español y otros idiomas consumen más tokens; por qué fallan contar letras o ciertas operaciones.
- **Introduce**: `token`, `tokenizer`, `bpe`, `vocabulary`.
- **Interactivo**: un tokenizador en el navegador (BPE entrenado sobre un corpus pequeño incluido) para escribir texto y ver los tokens; comparar costo en español e inglés.
- **Hechos (verificar)**: BPE para NLP (Sennrich et al., 2016); vocabularios típicos de 32 k a 200 k tokens; 1 token ≈ ¾ de palabra en inglés.
- **Lente**: costo y límites se miden en tokens; estima tu volumen real en tokens antes de presupuestar.
- **Puente**: ¿cómo decide cada token a cuáles otros mirar? Atención.

### 21 · `atencion` — Atención
- **Asume**: 14, 19, 20.
- **Contenido**: consultas (Q), claves (K) y valores (V); producto punto y softmax = a quién mirar y cuánto; $\text{softmax}(QK^\top/\sqrt{d})V$; atención de varias cabezas; todos los tokens a la vez (paralelismo, sin esperar turno como la RNN).
- **Introduce**: `attention`, `query-key-value`, `self-attention`, `multi-head-attention`.
- **Interactivo**: elegir un token y ver su mapa de atención (pesos ilustrativos, rotulados así); activar cabezas distintas.
- **Hechos (verificar)**: Bahdanau et al. 2014; Vaswani et al. 2017.
- **Puente**: ¿cómo se arma un modelo completo con esta pieza?

### 22 · `transformer` — El transformer completo
- **Asume**: 07, 14, 19–21.
- **Contenido**: el bloque (atención + red MLP + residuales + normalización); apilar N bloques; codificación de posición; máscara causal; de embeddings a *logits* a la siguiente palabra; solo decodificador (GPT); de dónde salen los parámetros.
- **Introduce**: `transformer`, `positional-encoding`, `causal-mask`, `layer-norm`, `decoder-only`.
- **Interactivo**: recorrer un pase hacia delante de un transformer diminuto sobre una frase corta; contar parámetros por parte.
- **Hechos (verificar)**: «Attention Is All You Need» (2017).
- **Puente**: ya sabemos la arquitectura; ¿qué pasa al entrenarla con casi todo internet?

## Módulo 6 · Escala

### 23 · `preentrenamiento` — Preentrenamiento
- **Asume**: 19–22.
- **Contenido**: objetivo autosupervisado sobre texto a escala web; tubería de datos (recolección, filtrado, deduplicación); qué se aprende (gramática → hechos → patrones de razonamiento); calidad vs cantidad de datos; derechos de autor, consentimiento y privacidad; un modelo base no es un asistente.
- **Introduce**: `pretraining`, `base-model`, `corpus`, `self-supervised-learning`, `deduplication`.
- **Interactivo**: curva de pérdida frente a tokens vistos con ejemplos de salida del modelo en distintos momentos (ilustrativo, rotulado).
- **Hechos (verificar)**: GPT-3 entrenado con ~300 mil M de tokens.
- **Lente**: procedencia y licencias de los datos; qué cubre el corte de conocimiento.
- **Puente**: ¿cuánto cuesta y qué se gana al hacerlo más grande?

### 24 · `leyes-escala-costos` ⭐ — Leyes de escala y costos
- **Asume**: 23.
- **Contenido**: la pérdida baja de forma predecible con más parámetros, datos y cómputo (Kaplan 2020; Chinchilla 2022: ~20 tokens por parámetro); FLOPs de entrenamiento ≈ 6·N·D; de FLOPs a horas de GPU y dinero; el debate sobre capacidades «emergentes».
- **Introduce**: `scaling-law`, `flops`, `chinchilla`, `compute-budget`.
- **Interactivo**: calculadora: parámetros × tokens → FLOPs → días de GPU → costo (precio por hora y eficiencia editables, valores por defecto rotulados como supuestos).
- **Hechos (verificar)**: Kaplan et al. 2020; Hoffmann et al. 2022 (Chinchilla: 70 mil M de parámetros, 1,4 billones de tokens).
- **Lente**: entrenar desde cero está fuera de alcance para casi todas las organizaciones; cómo leer afirmaciones de «modelo más grande = mejor».
- **Puente**: el cuello de botella real: la memoria.

### 25 · `hardware-y-memoria` — GPUs, memoria y cuantización
- **Asume**: 13, 24.
- **Contenido**: bytes por parámetro (FP32, FP16, INT8, INT4); un modelo de 70 mil M en FP16 ocupa ~140 GB; entrenar con Adam cuesta ~16 bytes por parámetro; HBM/VRAM y ancho de banda; paralelismo (datos, tensor, pipeline); cuantización (menos colores, imagen aún reconocible).
- **Introduce**: `vram`, `quantization`, `fp16`, `bandwidth`, `parallelism`.
- **Interactivo**: calculadora de memoria: tamaño × precisión → GB, y qué GPUs lo alojan (incluida una RTX 3060 de 12 GB).
- **Hechos (verificar)**: capacidad de H100 (80 GB HBM); Llama 3.1 405B entrenado con más de 16 000 H100 (informe técnico).
- **Puente**: ya entrenado, ¿qué pasa cuando alguien pregunta algo?

### 26 · `inferencia` ⭐ — Inferencia: cómo responde un modelo
- **Asume**: 22, 25.
- **Contenido**: llenado (*prefill*) y decodificación (token a token); caché KV; el límite es el ancho de banda de memoria; latencia vs rendimiento; lotes; costo por millón de tokens; mezcla de expertos (MoE): parámetros totales vs activos; decodificación especulativa (mención).
- **Introduce**: `inference-serving`, `kv-cache`, `prefill`, `decode`, `throughput`, `moe`.
- **Interactivo**: crecimiento de la caché KV con la longitud del contexto; estimador de latencia y costo.
- **Hechos (verificar)**: Mixtral 8x7B (~47 mil M de parámetros totales, ~13 mil M activos por token, 2 de 8 expertos).
- **Lente**: costo por tarea = tokens de entrada + salida × precio; la latencia depende del tamaño del contexto; pedir el desglose.
- **Puente**: un modelo base aún no es un asistente: ¿cómo se convierte?

## Módulo 7 · Del modelo al asistente

### 27 · `fine-tuning-lora` ⭐ — Ajuste fino y LoRA
- **Asume**: 08, 23.
- **Contenido**: ajuste fino supervisado sobre datos propios; olvido catastrófico; LoRA (matrices de bajo rango $\Delta W = BA$, miles de veces menos parámetros entrenables); QLoRA; **cuándo** conviene (prompt → RAG → ajuste fino) y cuándo no.
- **Introduce**: `fine-tuning`, `lora`, `low-rank`, `catastrophic-forgetting`.
- **Interactivo**: deslizador de rango y parámetros entrenables; asistente de decisión «¿prompt, RAG o ajuste fino?».
- **Hechos (verificar)**: LoRA (Hu et al., 2021; ~10 000× menos parámetros entrenables en GPT-3 175B).
- **Lente**: el ajuste fino cambia comportamiento y estilo, no es un buen modo de «meter conocimiento fresco»; calidad de datos y evaluación primero.
- **Puente**: pero ¿qué enseña a un modelo a seguir instrucciones y ser útil?

### 28 · `alineacion` ⭐ — De modelo base a asistente
- **Asume**: 23, 27.
- **Contenido**: ajuste con instrucciones; aprendizaje por refuerzo con retroalimentación humana (RLHF): preferencias, modelo de recompensa, optimización; DPO como alternativa; adulación (*sycophancy*) y rechazos; el asistente es el modelo base más una capa de comportamiento.
- **Introduce**: `instruction-tuning`, `rlhf`, `reward-model`, `dpo`, `alignment`, `sycophancy`.
- **Interactivo**: ordenar pares de respuestas (preferencias) y ver cómo se forma el modelo de recompensa; comparar respuesta base vs instruida (ilustrativo).
- **Hechos (verificar)**: InstructGPT (Ouyang et al., 2022: 1,3 mil M preferido sobre GPT-3 175B); ChatGPT (30 de noviembre de 2022); DPO (Rafailov et al., 2023).
- **Lente**: el asistente refleja las preferencias de quienes lo calibraron; las políticas de rechazo y el tono son decisiones de producto.
- **Puente**: ¿puede pensar antes de responder?

### 29 · `razonamiento` — Modelos de razonamiento
- **Asume**: 19, 28.
- **Contenido**: cadena de pensamiento; autoconsistencia; modelos entrenados con refuerzo y recompensas verificables; más cómputo al responder (*test-time compute*); equilibrio costo-latencia; límites (razonamientos plausibles pero erróneos).
- **Introduce**: `chain-of-thought`, `reasoning-model`, `test-time-compute`, `verifiable-reward`.
- **Interactivo**: deslizador de «presupuesto de pensamiento» frente a exactitud en un conjunto de problemas de juguete (ilustrativo, rotulado).
- **Hechos (verificar)**: Wei et al. 2022 (CoT); modelos de razonamiento comerciales desde 2024 (informes técnicos de OpenAI o1 y DeepSeek-R1).
- **Lente**: más pensamiento = más costo y latencia; úsalo donde el error cuesta más.
- **Puente**: ¿recuerda el modelo lo que le dices?

### 30 · `contexto-y-memoria` ⭐ — Contexto y memoria
- **Asume**: 22, 26.
- **Contenido**: la ventana de contexto; un chatbot no tiene memoria: se reenvía todo el historial en cada turno; no aprende mientras conversas (pesos congelados); «perdido en el medio»; el costo crece con el contexto; funciones de «memoria» como resumen y almacenamiento externo.
- **Introduce**: `context-window`, `stateless`, `system-prompt`, `lost-in-the-middle`.
- **Interactivo**: un tren de vagones (tokens) que se llena: ver qué se desenganchan al exceder el límite; comparar tamaños de contexto.
- **Hechos (verificar)**: GPT-3: 2048 tokens; ventanas de 128 k a más de 1 M (informes técnicos); Liu et al. 2023 («Lost in the Middle»).
- **Lente**: lo que no está en el contexto no existe para el modelo; privacidad de lo que se envía; el costo crece con cada turno.
- **Puente**: ¿cómo darle conocimiento propio sin reentrenarlo?

### 31 · `rag` ⭐ — RAG: leer antes de responder
- **Asume**: 14, 30.
- **Contenido**: recuperación + generación; fragmentar documentos (*chunking*); índice vectorial; recuperar top-k; reordenar; construir el prompt con fuentes; citar; fallos (no recupera, contradicciones, inyección vía documentos); cómo evaluarlo.
- **Introduce**: `rag`, `chunking`, `vector-database`, `retrieval`, `grounding`, `reranking`.
- **Interactivo**: un RAG de juguete sobre un conjunto pequeño de documentos incluidos: escribir una pregunta, ver los fragmentos recuperados (TF-IDF en el navegador) y la respuesta con citas.
- **Hechos (verificar)**: RAG (Lewis et al., 2020).
- **Lente**: RAG da respuestas verificables con tus propios datos; la calidad depende más de la recuperación que del modelo.
- **Puente**: ¿y si, además de leer, pudiera actuar?

### 32 · `agentes` ⭐ — Agentes y herramientas
- **Asume**: 28, 30, 31.
- **Contenido**: el bucle razonar → usar herramienta → observar; llamadas a funciones; protocolo MCP (mención); planificación y memoria; fiabilidad: los errores se acumulan en cadenas largas (0,95¹⁰ ≈ 0,60); salvaguardas, permisos y humano en el bucle; niveles de autonomía.
- **Introduce**: `agent`, `tool-use`, `function-calling`, `mcp`, `human-in-the-loop`.
- **Interactivo**: simulador de un agente con una tarea de pasos y probabilidad de fallo por paso; ver cómo cae el éxito con la longitud y cómo ayuda una verificación humana.
- **Hechos (verificar)**: ReAct (Yao et al., 2022); Model Context Protocol (Anthropic, noviembre de 2024).
- **Lente**: define permisos mínimos, registros y puntos de aprobación; empieza con acciones reversibles.
- **Puente**: ya vimos cómo se construye; ahora, usarlo con criterio.

## Módulo 8 · Usar IA con criterio

### 33 · `alucinaciones-y-limites` ⭐ — Alucinaciones y límites
- **Asume**: 19, 23, 28, 31.
- **Contenido**: por qué ocurren (el objetivo es lo plausible, no lo verdadero); tipos (inventadas, desactualizadas, errores de razonamiento); calibración; mitigaciones (RAG, herramientas, verificación, salidas estructuradas, pedir fuentes); casos reales.
- **Introduce**: `hallucination`, `calibration`, `knowledge-cutoff`, `verification`.
- **Interactivo**: juego «¿verdadero o inventado?» con afirmaciones del tipo que un modelo suele producir (rotuladas como ilustrativas) y reflexión sobre la confianza.
- **Hechos (verificar)**: caso *Mata v. Avianca* (2023, citas jurídicas inventadas); TruthfulQA (Lin et al., 2021).
- **Lente**: dónde un error es tolerable y dónde no; diseñar verificación proporcional al riesgo.
- **Puente**: ¿cómo sabes si un sistema sirve para tu caso?

### 34 · `evaluar` ⭐ — Evaluar sistemas de IA
- **Asume**: 10, 33.
- **Contenido**: benchmarks públicos y sus límites (contaminación, saturación); conjuntos de evaluación propios (casos «de oro»); LLM como juez y sus sesgos; evaluación humana; pruebas de regresión; pruebas adversarias (*red teaming*); métricas de negocio; la ley de Goodhart; tamaño de muestra e incertidumbre.
- **Introduce**: `benchmark`, `eval-set`, `contamination`, `llm-as-judge`, `red-teaming`, `confidence-interval`.
- **Interactivo**: construir una evaluación: elegir casos y ver cómo la incertidumbre de la comparación entre dos modelos cambia con el tamaño de la muestra.
- **Hechos (verificar)**: MMLU (Hendrycks et al., 2020); Zheng et al. 2023 (LLM como juez).
- **Lente**: no compres sin evaluar con tus datos; cómo pedir evidencia a un proveedor.
- **Puente**: ¿qué puede salir mal más allá de la calidad?

### 35 · `riesgos-y-gobernanza` ⭐ — Riesgos y gobernanza
- **Asume**: 31, 32, 33.
- **Contenido**: privacidad y fuga de datos; inyección de instrucciones y *jailbreaks*; sesgo; propiedad intelectual; desinformación y suplantación; seguridad de agentes; huella ambiental; regulación y estándares; responsabilidad.
- **Introduce**: `prompt-injection`, `jailbreak`, `ai-bias`, `ai-act`, `governance`, `info-leak` (`bias` y `data-leakage` ya los definen las lecciones 3 y 10).
- **Interactivo**: matriz de riesgo (probabilidad × impacto): clasificar escenarios y ver qué controles aplican.
- **Hechos (verificar)**: Reglamento de IA de la UE (en vigor desde el 1 de agosto de 2024, con aplicación escalonada); NIST AI RMF 1.0 (enero de 2023); ISO/IEC 42001 (2023).
- **Lente**: política de uso, inventario de sistemas, responsables, registro de incidentes.
- **Puente**: ¿dónde aplicarlo en tu organización y cómo empezar?

### 36 · `estrategia` ⭐ — Estrategia para organizaciones
- **Asume**: 24, 26, 27, 31, 34, 35.
- **Contenido**: elegir casos de uso (frecuencia × valor × riesgo); construir, comprar o ajustar; costo total y costo por tarea; preparación de datos; pilotos que escalan (y los que no); gestión del cambio; métricas; errores comunes (demos sin evaluación, IA en la sombra).
- **Introduce**: `use-case`, `tco`, `pilot`, `build-vs-buy`.
- **Interactivo**: calculadora de retorno (rotulada como supuestos editables) y matriz de priorización 2×2 de casos de uso.
- **Lente**: toda la lección es la lente; que termine en un plan de 90 días.
- **Puente**: ya tienes las piezas; veamos el mapa completo.

## Módulo 9 · Cierre

### 37 · `mapa-completo` ⭐ — El mapa completo
- **Asume**: todo.
- **Contenido**: el recorrido completo en un mapa interactivo (cada lección un punto, de la neurona al chatbot); línea de tiempo 1943 → hoy; las diez preguntas para hacer a cualquier equipo o proveedor de IA; cómo seguir aprendiendo.
- **Introduce**: ninguno.
- **Interactivo**: tocar un nodo del mapa para ver su idea en una frase y saltar a su lección; recorrer la línea de tiempo.
- **Lente**: la lista de diez preguntas es el producto final.
