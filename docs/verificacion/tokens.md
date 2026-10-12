# tokens · Tokens: el alfabeto del modelo

Registro de verificación (2026-10-11). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa, qué se corrigió del borrador anterior y qué quedó sin comprobar.

## Verificado
- **Sennrich, Haddow y Birch (arXiv 1508.07909 v5, ACL 2016; PDF leído)**: adaptan BPE «(Gage, 1994), a compression algorithm» a la segmentación de palabras, fusionando caracteres en lugar de bytes; citan Gage 1994, *C Users J.* 12(2):23–38, febrero.
- **Gage 1994**: leída en la copia archivada del artículo (jacobfilipp.com, archivo de Dr. Dobb's / *The C Users Journal*, febrero de 1994): reemplaza la pareja de bytes más frecuente por un byte sin usar. El sitio de Dr. Dobb's ya no resuelve; no hay versión oficial en línea, por eso el enlace apunta a la copia archivada (rotulada así en `sources`).
- **GPT-2 (PDF leído)**: BPE como «practical middle ground between character and word level»; base de 256 bytes; vocabulario de 50 257; tabla 2 (117M: 12 capas, d_model 768); WebText sin páginas en otros idiomas («we deliberately removed non-English webpages»).
- **Llama 2 (arXiv 2307.09288, PDF leído)**: BPE de SentencePiece, números partidos en cifras sueltas, bytes para caracteres desconocidos, «total vocabulary size is 32k tokens».
- **Llama 3 (arXiv 2407.21783, HTML leído)**: «vocabulary with 128K tokens» (100K de tiktoken + 28K para otros idiomas); compresión de 3.17 a 3.94 caracteres por token en una muestra de inglés frente al tokenizador de Llama 2.
- **Petrov et al. 2023 (arXiv 2305.15425, NeurIPS 2023)**: el mismo texto traducido puede tener longitudes de tokenización muy distintas, «with differences up to 15 times in some cases» (resumen).
- **Edman, Schmid y Fraser 2024, CUTE (arXiv 2409.15452, EMNLP 2024)**: la mayoría de los modelos parecen conocer la ortografía de sus tokens pero no la usan bien para manipular texto (resumen).
- **Singh y Strouse 2024 (arXiv 2402.14903)**: GPT-3.5 y GPT-4 tienen tokens para cada número de 1, 2 y 3 cifras; forzar el corte de derecha a izquierda (comas) mejora mucho la aritmética (resumen).
- **OpenAI Help Center, «What are tokens and how to count them?»**: el enlace devuelve 403 a los robots; se leyó la copia de Wayback Machine del 2025-12-28 (`web/20251228034447`): «1 token ≈ 4 characters», «1 token ≈ ¾ of a word», «100 tokens ≈ 75 words», y que el texto que no está en inglés suele producir más tokens por carácter.
- **Anthropic, Pricing (platform.claude.com, leído el 2026-10-11)**: precios por millón de tokens (MTok) de entrada y de salida; en todas las filas de la tabla la salida cuesta cinco veces la entrada (p. ej. 3 y 15 dólares, usado como ejemplo rotulado en la escena); «Claude 4.7 and later models … use a newer tokenizer … approximately 30% more tokens for the same text» (lente).
- **tiktoken 0.14.0 (OpenAI, MIT)**: README: «a fast BPE tokeniser»; `encoding_for_model`: gpt-2 → `gpt2`, gpt-4 → `cl100k_base`, gpt-4o → `o200k_base`; `n_vocab` 50 257 / 100 277 / 200 019.
- **FLORES-200 (NLLB Team 2022, arXiv 2207.04672; datos CC BY-SA 4.0 según el repositorio facebookresearch/flores)**: descargado de `dl.fbaipublicfiles.com/nllb/flores200_dataset.tar.gz` (SHA-256 `b8b0b767…44011f6`); se usaron las 1 012 frases de `devtest` en `eng_Latn` y `spa_Latn`. Solo se publican totales, no el texto.

## Cifras propias (reproducibles)
- `measure-real.py` (CPU, tiktoken 0.14.0) escribe `real-data.ts`: cortes de GPT-4o de la frase del gato (10 tokens en los dos idiomas; el nombre raro, 5 trozos), las cuatro parejas del «tu turno» (10/15, 8/10, 8/9, 9/9), « carretera» y « strawberry» como un solo token (96244 y 101830, con su espacio inicial, como aparecen dentro de la pregunta), el deletreo con la «r» = 428 tres veces, «1234567» → 123 · 456 · 7, la petición y su respuesta de la escena del costo, y los totales de FLORES-200: GPT-2 27 044 / 53 578 (×1.98), GPT-4 27 182 / 41 974 (×1.54), GPT-4o 26 873 / 35 415 (×1.32); 0.81 palabras por token en inglés.
- Tokenizador de juguete: `build-tokenizers.mts` sobre `corpus.ts` (texto escrito para el curso) → `merges.ts`; variante «mix» = 1 450 palabras en inglés + 290 en español (1 740, 83 % inglés). Frase del gato: 31 tokens (es) / 29 (en) sin fusiones, 15 con 400; lista de 656 piezas. Las cuatro frases: solo inglés 77 / 128 (+66 %), equilibrado 88 / 93 (+6 %).
- Corpus diminuto de la animación (gato ×5, gatos ×3, pato ×4, patos ×2, gatita ×1; en inglés cat, cats, hat, hats, catnip): fusiones at (15), ato (14), gato (8), pato (6), gatos (3), patos (2); en inglés at (15), cat (9), hat (6), cats (3), hats (2). Coinciden la escena (`trace` de `bpe.ts`) y el código de «por dentro», ejecutado.
- El segundo fragmento de «por dentro» (tiktoken) se ejecutó y su salida es la que se muestra.

## Corregido respecto del borrador
- «gatito» se cambió por «gatita»: con «gatito» las parejas «a t» y «t o» empataban a 15 en la primera vuelta y el desempate alfabético era confuso para principiantes.
- La comparación de idiomas ya no se basa en cuatro frases medidas (que daban ×1.15 con GPT-4o y podían leerse como una regla): ahora usa 1 012 frases de FLORES-200 y muestra que con GPT-4o algunas frases cortas empatan; el «tu turno» deja elegir entre cuatro frases ya escritas, sin texto libre.
- Se quitó «cada token de salida exige una pasada completa por el modelo» como explicación del precio (impreciso para la entrada); ahora: el trabajo crece con cada token leído y la respuesta se escribe token por token.
- El «tokenizador más reciente de un proveedor produce un 30 % más de tokens» del borrador se comprobó en la página de Anthropic y se atribuye con nombre.
- «frambuesa» (4 trozos) se cambió por «carretera», que con GPT-4o es un solo token y tiene tres erres, como «strawberry» en inglés.

## No verificado o dudoso
- «Los tokens que el modelo escribe suelen costar varias veces más que los que lee»: comprobado solo en la lista de Anthropic (5×); no se revisaron otros proveedores en esta pasada.
- Las parejas de frases del «tu turno» son nuestras y no son representativas por sí solas (se dice en la narración y en «por dentro»).
- La explicación causal de la brecha entre idiomas en tokenizadores reales («lo que vio poco, lo parte más») se demuestra con el juguete; de GPT-4o no se publican los datos con que se entrenó su tokenizador.
- La escena omite el espacio inicial pegado a muchas piezas de GPT-4o para que se lean mejor (se explica en «por dentro»).
