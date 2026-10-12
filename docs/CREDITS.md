# Créditos y licencias de terceros (v2)

| Componente | Uso | Licencia |
|---|---|---|
| [Qwen3-TTS 1.7B](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base) (Alibaba Cloud / Qwen) | Voz sintética de las lecciones (generada localmente) | Apache-2.0 |
| [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo) (OpenAI) | Solo control de calidad y tiempos por palabra del audio, no se redistribuye | MIT |
| [Astro](https://astro.build) | Generador del sitio estático | MIT |
| [KaTeX](https://katex.org) | Fórmulas en «Por dentro» | MIT |
| [Pagefind](https://pagefind.app) | Búsqueda del sitio | MIT |
| [marked](https://marked.js.org) | Markdown de «Por dentro» | MIT |
| [Atkinson Hyperlegible Next](https://brailleinstitute.org/freefont) (Braille Institute) | Tipografía de texto, vía Fontsource | SIL OFL 1.1 |
| [Bitcount Prop Single](https://github.com/petrvanblokland/TYPETR-Bitcount) (Petr van Blokland) | Tipografía de marca y numerales, vía Fontsource | SIL OFL 1.1 |
| [JetBrains Mono](https://www.jetbrains.com/lp/mono/) | Números y código, vía Fontsource | SIL OFL 1.1 |
| Playwright, axe-core, Lighthouse | Solo desarrollo y verificación (capturas, accesibilidad, rendimiento) | Apache-2.0 / MPL-2.0 |

El guion, el arte, las animaciones y el audio del curso: CC BY-NC 4.0. El código del motor y las herramientas: MIT (ver `LICENSE`).

Voz sintética: las lecciones lo indican en «Acerca de». Los datos de demostración que no son reales se rotulan como «ilustrativos» dentro de cada lección.

## Datos y modelos usados en las lecciones

Licencias consultadas el 2026-10-12 en la página oficial de cada modelo o conjunto (ficha de Hugging Face, repositorio o sitio del titular). Las lecciones se numeran como en el currículo. «Se redistribuye» significa que un archivo de este repositorio contiene datos, pesos o salidas derivados del elemento; «solo cifras» significa que únicamente se publican números medidos con él. Cada lección cita sus fuentes completas en «Fuentes» y los registros de verificación están en `docs/v2/verificacion/`.

### Datos y modelos que las lecciones usan o miden

| Elemento (titular) | Lecciones | Uso | Licencia |
|---|---|---|---|
| Optical Recognition of Handwritten Digits (E. Alpaydin y C. Kaynak, 1998; UCI Machine Learning Repository), cargado con `load_digits` de scikit-learn | 15, 17 | **Se redistribuye**: las 1 797 imágenes de 8×8 píxeles (`generar-distribuciones/latent.json`, `difusion/models.json`) y los pesos de los modelos diminutos entrenados con ellas. Exige atribución e indicar que se transformaron | [CC BY 4.0](https://archive.ics.uci.edu/dataset/80/optical+recognition+of+handwritten+digits). scikit-learn (solo el cargador): [BSD-3-Clause](https://github.com/scikit-learn/scikit-learn) |
| GloVe 6B, 100 dimensiones (Pennington, Socher y Manning, 2014; Stanford NLP) | 14 | **Se redistribuye**: 880 de los 400 000 vectores, normalizados y cuantizados a 8 bits, más una proyección t-SNE (`embeddings/data/embeddings.json`). Entrenado con Wikipedia 2014 y Gigaword 5 | [PDDL v1.0](https://nlp.stanford.edu/projects/glove/) (Stanford la declara para los vectores; permite redistribuir y derivar) |
| paraphrase-multilingual-MiniLM-L12-v2 (Reimers y Gurevych; sentence-transformers) | 14 | Solo cifras: puntajes de búsqueda (`embeddings/data/search-eval.json`) | [Apache-2.0](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) |
| bert-base-uncased y bert-base-multilingual-cased (Devlin et al., Google) | 21 | Se redistribuyen mapas de atención medidos (redondeados a 2 decimales, `atencion/real-data.ts`); no los pesos | [Apache-2.0](https://huggingface.co/google-bert/bert-base-uncased), [Apache-2.0](https://huggingface.co/google-bert/bert-base-multilingual-cased) |
| Pythia 160M a 12B (Biderman et al., EleutherAI, 2023) | 23, 25, 33 (cifras de tamaño y datos también en 24) | **Se redistribuyen**: textos generados, probabilidades y aciertos medidos (`preentrenamiento/pythia-data.ts`, `alucinaciones-y-limites/real-data.ts`) y una muestra de 1 024 pesos (32×32) de una matriz de Pythia-1.4B (`hardware-y-memoria/real-data.ts`). No se incluyen los pesos completos | [Apache-2.0](https://huggingface.co/EleutherAI/pythia-1.4b) (verificada también en las fichas de 160m, 410m, 1b, 2.8b, 6.9b y 12b) |
| The Pile (Gao et al., EleutherAI, 2020), corpus con que se entrenó Pythia | 23, 33 | Solo se cita; no se redistribuye ningún dato. Pythia-1.4B se entrenó con la versión sin deduplicar | La ficha del conjunto declara [`license: other`](https://huggingface.co/datasets/EleutherAI/the_pile): sus componentes tienen licencias distintas |
| WikiText-2 (Merity et al., 2016; Salesforce), partición de prueba | 25 | Solo cifras: pérdida de Pythia-1.4B con pesos cuantizados. El texto no se incluye | [CC BY-SA](https://huggingface.co/datasets/Salesforce/wikitext): la ficha tiene etiquetas `cc-by-sa-3.0` y `gfdl`, y su texto dice CC BY-SA 4.0 |
| FLORES-200 «devtest», inglés y español (NLLB Team, Meta, 2022) | 20 | Solo cifras: totales de tokens de 1 012 frases paralelas. El texto no se incluye | [CC BY-SA 4.0](https://github.com/facebookresearch/flores) |
| tiktoken 0.14.0 con los vocabularios `gpt2`, `cl100k_base` y `o200k_base` (OpenAI) | 20 | Se redistribuyen los identificadores y piezas de unas pocas frases propias (`tokens/real-data.ts`); los vocabularios no | [MIT](https://github.com/openai/tiktoken) |
| TinyLlama-1.1B-intermediate-step-1431k-3T y TinyLlama-1.1B-Chat-v1.0 (Zhang et al., 2024) | 28 | **Se redistribuyen**: salidas generadas con cuatro indicaciones propias (`alineacion/outputs.json`, `outputs-data.ts`). La versión Chat se ajustó con UltraChat y UltraFeedback | Ambos [Apache-2.0](https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0) ([base](https://huggingface.co/TinyLlama/TinyLlama-1.1B-intermediate-step-1431k-3T)). Conjuntos de ajuste: [UltraChat 200k](https://huggingface.co/datasets/HuggingFaceH4/ultrachat_200k) y [UltraFeedback binarizado](https://huggingface.co/datasets/HuggingFaceH4/ultrafeedback_binarized), MIT |
| Qwen3.5-4B (Qwen, Alibaba Cloud, 2026) | 29 | Se redistribuyen números medidos (longitudes de pensamiento y respuestas, `razonamiento/data.ts`); los textos de las cadenas de pensamiento no se publican | [Apache-2.0](https://huggingface.co/Qwen/Qwen3.5-4B) |
| multilingual-e5-small (Wang et al., 2022; Microsoft) | 31 | Solo cifras: similitudes coseno (`rag/dense.ts`) | [MIT](https://huggingface.co/intfloat/multilingual-e5-small) |
| mmarco-mMiniLMv2-L12-H384-v1 (cross-encoder; Bonifacio et al., 2021) | 31 | Solo cifras: puntajes de reordenamiento (`rag/dense.ts`) | Modelo: [Apache-2.0](https://huggingface.co/cross-encoder/mmarco-mMiniLMv2-L12-H384-v1). Entrenado con [mMARCO](https://huggingface.co/datasets/unicamp-dl/mmarco) (Apache-2.0 según su página), traducción de MS MARCO, cuyos [términos](https://microsoft.github.io/msmarco/) son «solo investigación no comercial» (ver notas) |
| Pregunta de ejemplo de MMLU (Hendrycks et al., 2021) | 34 | Se reproduce una pregunta (`evaluar/data.ts`) | [MIT](https://github.com/hendrycks/test) |
| Textos libres que Pythia intenta recitar: preámbulo de la Constitución de EE. UU., primer párrafo del *Quijote*, «lorem ipsum» y la licencia MIT | 23 | Se reproducen fragmentos cortos (`preentrenamiento/pythia-data.ts`) | Dominio público o licencia permisiva; no se verificó en una fuente oficial |

Datos propios (código MIT; datos y textos CC BY-NC 4.0, como el resto del curso): los correos, estudiantes, series, corpus y tiendas de las lecciones 1 a 13; la mezcla de gaussianas de la 16; el mundo de formas y colores de la 18; la gramática de juguete de la 22; el modelo diminuto de la 27; el manual de la tienda ficticia de la 31; las 424 preguntas de cultura general de la 33; y las doce páginas de la 23. Todos son sintéticos o escritos para el curso, y las lecciones los rotulan como ilustrativos.

### Citados, sin redistribuir datos ni pesos

De estos materiales las lecciones solo toman cifras publicadas (con su cita) o los mencionan; el repositorio no contiene sus datos, pesos ni salidas. No se auditó su licencia, salvo las que figuran abajo.

| Elemento | Lecciones | Cita | Licencia |
|---|---|---|---|
| StyleGAN2 (NVIDIA) | 16 | Un resultado de un estudio con rostros generados; no se incluyen imágenes ni modelo | [Nvidia Source Code License-NC](https://github.com/NVlabs/stylegan2): uso solo no comercial («investigación o evaluación», sección 3.3 de la [licencia](https://nvlabs.github.io/stylegan2/license.html)) |
| Llama 2 y Llama 3.1 (Meta) | 20, 24, 25, 26, 28 y otras | Cifras de sus informes técnicos y fichas (parámetros, tokens, horas de GPU, tamaño de vocabulario) | [Llama 3.1 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE) (ficha del modelo: `license: llama3.1`). Exige, al redistribuir los modelos, incluir la licencia, mostrar «Built with Llama» y poner «Llama» al inicio del nombre de modelos derivados; pide licencia a Meta con más de 700 millones de usuarios mensuales |
| Stable Diffusion v1-4 (CompVis / Stability AI) | 17, 18, 37 | Fecha de lanzamiento y comparación de método | [CreativeML OpenRAIL-M](https://huggingface.co/CompVis/stable-diffusion-v1-4) |
| CLIP (Radford et al., OpenAI) | 18 | Se explica el método; la lección entrena su propio modelo diminuto | [MIT](https://github.com/openai/CLIP) |
| DeepSeek-R1 (DeepSeek-AI) | 29 | Cifras y descripción de su informe | [MIT](https://huggingface.co/deepseek-ai/DeepSeek-R1) |
| Resultados de artículos y fichas (Kaplan 2020, Hoffmann 2022, Brown 2020, Hendrycks 2021, Zheng 2023, Chen, Zaharia y Zou 2023, Penedo 2024, Raffel 2020 y otros) | varias | Cifras y fechas con su referencia en «Fuentes» de cada lección | Cifras citadas; no se copian tablas, figuras ni datos |
| Conjuntos y modelos mencionados: ImageNet, CIFAR-10, COCO, MNIST, GSM8k y GSM1k, TruthfulQA, GPT-2/3/4, Claude | varias | Solo mención o cifra publicada | No se consultó |

### Condiciones que conviene tener presentes

- Las licencias CC BY-SA de FLORES-200 y WikiText-2 (con su texto subyacente de Wikipedia) exigen compartir igual lo que las adapte. Hoy no se incluye texto de ninguno, solo cifras. Si algún día se incluyera, esa parte no podría mezclarse con material CC BY-NC 4.0.
- Los dígitos UCI (CC BY 4.0) sí se redistribuyen: la atribución de arriba y la cita en «Fuentes» de las lecciones 15 y 17 deben mantenerse.
- La licencia Apache-2.0 de Pythia, TinyLlama, Qwen3.5-4B, BERT y MiniLM cubre los pesos y no se extiende a sus datos de entrenamiento. No se redistribuyen pesos completos; las salidas y muestras listadas arriba son lo único derivado.
- El modelo de reordenamiento de la lección 31 declara Apache-2.0, pero se entrenó con una traducción de MS MARCO, cuyos términos limitan el uso a investigación no comercial. Solo se publican puntajes.
- Hoy no se redistribuye nada de Llama ni de StyleGAN2. Si se añadieran pesos, salidas o imágenes de ellos, aplican las condiciones de sus licencias.
- Complemento de la tabla de herramientas: el laboratorio de voces (`app/tools/tts/voice-lab.py`) diseña las voces candidatas con [Qwen3-TTS 1.7B VoiceDesign](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign) (Apache-2.0) a partir de una descripción de texto; el modelo Base las clona para narrar. Las cuatro voces del curso (español: barítono y radio; inglés: professor y radio) son voces **sintéticas diseñadas así**, a partir de una descripción escrita: no clonan la grabación de ninguna persona real.
