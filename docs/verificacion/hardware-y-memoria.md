# hardware-y-memoria · GPUs, memoria y cuantización

Registro de verificación (2026-10-12). La lección no tenía narración: se escribió completa (50 segmentos) con el criterio «llevar de la mano», sobre una escena en borrador de otro momento (seis actos, tres turnos complejos) que se rehízo. Las fuentes citadas están en `sources` del `content.ts`; aquí consta cómo se comprobó cada cosa, qué cambió respecto del borrador y qué quedó sin comprobar. Todos los enlaces se abrieron el 2026-10-12 (`check-sources --online`: 18 fuentes, 0 rotas). Los PDF de arXiv se descargaron y se leyeron con `pdftotext`; los autores de los artículos se tomaron de la API de arXiv.

## Qué cambió respecto del borrador
- **Narración nueva**, en este orden: la pregunta (¿dónde se guardan setenta mil millones de números?) → la GPU por partes (núcleos de la lección 13, la memoria junto al chip, el nombre VRAM con la analogía de la mesa del taller, sus tamaños a la misma escala) → qué es un byte → los bytes de un parámetro real en FP32, FP16, INT8 e INT4 («cuántas cifras guardas»; en INT8 e INT4, la regla con marcas) → la cuenta de 70 mil millones en tres pasos (× 2 bytes; mil millones de bytes = 1 GB; frente a los 80 GB de una H100) → la calculadora → los 16 bytes de entrenar, pieza por pieza → el ancho de banda (qué es, cuánto, por qué limita al escribir, el «muro») → los tres paralelismos, dos segmentos cada uno, con su analogía → Llama 3.1 405B en 8 × 16 × 128 H100 → cuantizar (la idea, una imagen con menos tonos, la regla, los pesos reales y la pérdida medida, lo que se gana, la advertencia) → resumen y puente a la lección 26.
- **Interacción simplificada.** Quedan dos «tu turno» opcionales, cada uno precedido de su demostración automática (`S.drive`): la calculadora (elegir un tamaño o un formato; la escena recorre antes el modelo de 70 mil M en cada formato, luego el de 8 mil M en FP16 e INT8, y en el turno muestra el de 405 mil M en FP16) y la cuantización (un solo deslizador de bits; la escena baja de 8 a 2 y muestra la pérdida en FP16, 4 y 2 bits). Los gates cuentan solo `S.touched`. Se quitaron el turno de «repartir el entrenamiento de 70 mil M» (tres deslizadores a la vez) y el de «romper y arreglar» la cuantización (dos controles); la comparación «una escala por matriz frente a una por grupo» pasó a «por dentro».
- **Se quitaron del lienzo** las cifras que la voz no explica (escalera de GPU de 405B con estimaciones propias, enlaces PCIe y red entre servidores, burbuja numérica de la tubería, activaciones de Llama 3 8B); las que siguen siendo útiles están en «por dentro».

## Verificado

### Hardware
- **NVIDIA H100 (página de producto, abierta hoy)**: H100 SXM, «GPU Memory 80GB», «GPU Memory Bandwidth 3.35TB/s», «FP16 Tensor Core 1,979 teraFLOPS» con la nota «* With sparsity», «NVIDIA NVLink: 900GB/s». La cifra sin dispersión es la mitad, unos 989 billones de operaciones por segundo; de ahí las «casi seiscientas operaciones» de `bw-wall`: 989·10¹² ÷ 3.35·10¹² ≈ 295 operaciones por byte, ≈ 590 por parámetro de 2 bytes.
- **NVIDIA Hopper Architecture In-Depth (blog técnico, 22 de marzo de 2022; autores leídos en la página)**: H100 SXM5 con «16896 FP32 CUDA Cores per GPU», «132 SMs», «80 GB HBM3, 5 HBM3 stacks». Sostiene el rótulo «16 896 núcleos» y las cinco pilas de memoria del esquema (que se rotula «no a escala»).
- **GeForce RTX 3060 (página de la familia, abierta hoy)**: «12 GB GDDR6 / 8 GB GDDR6», interfaz de 192 / 128 bits. La lección usa la versión de 12 GB. La página **no** da el ancho de banda; por eso la voz dice «medimos unos trescientos treinta» (ver «cifras propias»), no la cifra teórica de 360 GB/s de los fabricantes de tarjetas.

### Llama 3 (Llama Team, AI @ Meta, 2024; arXiv 2407.21783, PDF leído)
- §3.3.1: «Llama 3 405B is trained on up to 16K H100 GPUs, each running at 700W TDP with 80GB HBM3»; «Each server is equipped with eight GPUs … Within a server, the eight GPUs are connected via NVLink».
- Tabla 4: 16 384 GPU con TP = 8, CP = 1, PP = 16, DP = 128 (MFU 41 %); la etapa de contexto largo usa TP 8, CP 16, PP 16, DP 8 (`par-llama`, `par-total`, «por dentro»).
- §3.3.2: la dimensión más interna (tensor) «requires the highest network bandwidth and lowest latency, and hence is usually constrained to within the same server» (`par-tensor2`: «suele hacerse dentro de un mismo servidor»). Usan FSDP para el paralelismo de datos («por dentro»).
- Tabla 3: modelos de 8B, 70B y 405B (tamaños nominales de la calculadora).
- §6.1: «When using a BF16 number representation for the model parameters, Llama 3 405B does not fit in the GPU memory of a single machine with 8 Nvidia H100 GPUs» (`calc-try`: «en FP16 no cabe ni en ocho H100»; FP16 y BF16 ocupan lo mismo).
- §6.2: «Evaluations on standard benchmarks often suggest that FP8 inference performs on par with BF16 inference even without these mitigations. However, we find that such benchmarks do not adequately reflect the effects of FP8 quantization. When scaling factors are not upper bounded, the model occasionally produces corrupted responses even though the benchmark performance is strong» (`quant-caution`); también «row-wise quantization … works better than a tensor-wise quantization approach».

### Entrenar: 16 bytes por parámetro
- **Rajbhandari et al. 2020, ZeRO (arXiv 1910.02054, PDF leído)**, §3.1: «Mixed precision training of a model with Ψ parameters using Adam requires enough memory to hold an fp16 copy of the parameters and the gradients, with memory requirements of 2Ψ and 2Ψ bytes respectively. In addition, it needs to hold the optimizer states: an fp32 copy of the parameters, momentum and variance, with memory requirements of 4Ψ, 4Ψ, and 4Ψ bytes … 2Ψ + 2Ψ + KΨ = 16Ψ bytes» (`train-grad` a `train-16`).
- **Micikevicius et al. 2018, Mixed Precision Training (arXiv 1710.03740, PDF leído)**, §3.1: la copia maestra en FP32 hace falta porque «updates (weight gradients multiplied by the learning rate) become too small to be represented in FP16» y porque al sumarse a un peso 2 048 veces mayor el ajuste se pierde (`train-master`: «se perderían al redondear»).
- **Kingma y Ba 2015, Adam (arXiv 1412.6980)**: estimaciones del primer y segundo momento del gradiente; la voz las nombra como en la lección 9 («el promedio de su pendiente y el de su tamaño»).
- **Korthikanti et al. 2022 (arXiv 2205.05198)**: activaciones por capa ≈ 34·s·b·h bytes con atención de memoria lineal (solo «por dentro»).

### Paralelismo
- **GPipe (Huang et al., 2019; arXiv 1811.06965, PDF leído)**: «partitioning introduces some idle time per accelerator, which we refer to as the bubble overhead. This bubble time is O((K−1)/(M+K−1)) … negligible when M ≥ 4 × K» (`par-pipe2`: «algunas GPU esperan su turno»; fórmula en «por dentro»).
- **Megatron-LM (Shoeybi et al., 2019; arXiv 1909.08053, PDF leído)**, §3: la primera matriz del MLP se parte por columnas y la segunda por filas, con un solo *all-reduce* hacia delante y otro hacia atrás («por dentro»; `par-tensor`: «repartir las columnas»).
- **Narayanan et al. 2021 (arXiv 2104.04473)**: combinación de los tres paralelismos (PTD-P). Fuente de contexto; la combinación concreta citada es la de Llama 3.

### Formatos de número
- **IEEE 754-2019** (DOI 10.1109/IEEESTD.2019.8766229, comprobado en Crossref: «IEEE Standard for Floating-Point Arithmetic»): binario32 = 1 + 8 + 23 bits (24 de precisión, ≈ 7.2 cifras decimales); binario16 = 1 + 5 + 10 (11 de precisión, ≈ 3.3 cifras; máximo 65 504). De ahí «unas siete cifras» y «unas tres cifras».
- **Kalamkar et al. 2019, BF16 (arXiv 1905.12322)**: 1 + 8 + 7 bits, el alcance de FP32 con menos cifras («por dentro» y glosario).

### Cuantización (literatura)
- **LLM.int8() (Dettmers et al., 2022; arXiv 2208.07339, resumen leído)**: separa las dimensiones con valores atípicos en una multiplicación de 16 bits mientras más del 99.9 % de los valores se multiplican en 8 bits.
- **GPTQ (Frantar et al., 2023; arXiv 2210.17323, resumen leído)**: modelos de 175 mil millones de parámetros a 3 o 4 bits por peso «with negligible accuracy degradation». Ambos solo en «por dentro».

## Cifras propias (reproducibles)
- **Pesos reales de Pythia-1.4B** (`real-data.ts`, generado por `build-data.py` el 2026-10-04 en GPU; Apache-2.0). No se regeneró (la GPU está ocupada con la voz). Comprobación del 2026-10-12 en CPU (4 hilos, pesos ya descargados, `verify-sample.py` en la carpeta de la lección): matriz `gpt_neox.layers.13.attention.dense.weight` (2048 × 2048), σ = 0.021313, máx |w| = 0.28589, cociente 13.41 = mediana de las 96 matrices (mín 6.01, máx 111.22), 1 207 959 552 pesos cuantizados; primeros pesos de la muestra −0.01741, −0.01595, 0.02405, −0.03278, 0.04495 (idénticos al archivo); error relativo y fracción en cero de la matriz entera iguales a los del archivo (p. ej., grupos de 32 a 4 bits: 0.09714 y 13.3 %; una escala por matriz a 4 bits: 0.5503 y 66.7 %).
- **El parámetro de ejemplo** (`fp32` a `int4`, `quant-q`): fila 1, columna 3 de la muestra, 0.02405 (su valor FP16 exacto es 0.0240478515625; FP32 lo muestra como 0.02404785). Su grupo de 32 tiene máximo 0.04495: en INT8 queda en la marca 68 (0.02407) y en INT4 en la marca 4 (0.02569, «cero punto cero dos seis»). Los bits que se dibujan son los reales (IEEE 754 y complemento a dos).
- **Pérdida del modelo entero** (`quant-loss`, «por dentro»): nats por token sobre 287 744 tokens de la partición de prueba de WikiText-2, con las 96 matrices cuantizadas: FP16 2.5805; grupos de 32: 8 bits 2.5806, 6 → 2.5858, 5 → 2.5975, 4 → 2.6565, 3 → 3.1589, 2 → 11.045; una escala por matriz: 8 → 2.6002, 6 → 3.2172, 5 → 5.3017, 4 → 10.692, 3 → 10.445, 2 → 21.347. Es la medición del 2026-10-04; no se repitió (requiere GPU). Pythia vio Wikipedia al entrenar: el nivel absoluto es optimista; la lección compara diferencias.
- **Mediciones en una GeForce RTX 3060 de 12 GB** (`measure-memory.py`, corrida del 2026-10-04 con la GPU libre; los resultados están en el docstring del script): copiar 1 GiB, 333 GB/s («unos trescientos treinta», `bw-numbers`, `bw-rate`); matriz–vector de 16384² en FP16, 1.57 ms, 341 GB/s, 0.34 billones de operaciones por segundo, y 27.7 con 4 096 vectores; entrenar la arquitectura de Pythia-160M con AdamW: 16.19 bytes por parámetro en FP32 y 16.05 en precisión mixta («dieciséis punto cero cinco», `train-16`); activaciones medidas / 34·s·b·h·L = 0.949. No se repitieron (GPU ocupada).
- **Cuentas de la voz**: 70·10⁹ × 2 = 1.4·10¹¹ bytes = 140 GB; × 4 = 280; × 1 = 70; × ½ = 35; × 16 = 1 120 GB = 14 H100; 8·10⁹ × 1 = 8 GB; 330 ÷ 8 ≈ 41 tokens por segundo («unos cuarenta»); 405·10⁹ × 2 = 810 GB > 640 GB; 8 × 16 × 128 = 16 384. El código de «por dentro» se ejecutó y su salida es la que se muestra.
- **Imagen de «menos tonos»**: generada por fórmula (`model.ts`), rotulada «ilustrativa».

## Simplificaciones a sabiendas
- `int8` dice «una regla con doscientas cincuenta y seis marcas, una por cada valor del byte»: es lo que cabe en un byte. El esquema simétrico de la lección usa 255 (de −127 a 127) y, en 4 bits, 15 de las 16; «por dentro» lo aclara.
- «Por cada token lee todos sus parámetros» vale al escribir de a una petición (lote de 1); la lección 26 trata los lotes y la caché.
- 1 GB = 10⁹ bytes en toda la lección; las capacidades de VRAM de las fichas son GiB (7 % más). Dicho en «por dentro».
- «INT4 = 35 GB» no cuenta las escalas por grupo (unos 39 GB con grupos de 32); dicho en el rótulo de `quant-pay` y en «por dentro».

## No verificado o dudoso
- El ancho de banda teórico de la RTX 3060 (360 GB/s) no aparece en la página de NVIDIA; la lección solo usa el valor medido.
- Las mediciones propias (memoria, ancho de banda y pérdida) son de una sola corrida del 2026-10-04 y no se repitieron hoy (la GPU está ocupada generando voz); la muestra de pesos sí se recomprobó en CPU.
- `par-q` dice que en una sola GPU el entrenamiento «tardaría siglos»: se apoya en la cuenta de la lección 24 (unos tres mil años para Llama 3.1 405B en una sola GPU), no en una fuente propia de esta lección.
