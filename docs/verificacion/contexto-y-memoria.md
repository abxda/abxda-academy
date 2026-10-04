# contexto-y-memoria · Contexto y memoria

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Liu et al. 2023 (arXiv 2307.03172, PDF leído): valores de la tabla 6 (apéndice G) y de la tabla 1 coinciden exactos con `model.ts`; forma de U; GPT-3.5 en el medio por debajo de 56,1 % sin documentos. RULER (arXiv 2404.06654): solo la mitad de los modelos que declaran 32K o más rinde bien a 32K.
- Ventanas: GPT-1 512 tokens, GPT-2 512–1 024, GPT-3 n_ctx 2 048 (artículos de OpenAI); Llama 3 hasta 128K; Gemini 1.5 hasta 10M en investigación; Claude 100K el 11 de mayo de 2023 (75 000 palabras, Anthropic). GPT-4 Technical Report: «ventana de contexto limitada y no aprende de la experiencia», textual. MemGPT: título y resumen.
- Documentación de Anthropic: definición de ventana de contexto textual; API de mensajes «stateless»; caché 0,1× al leer y 1,25× al escribir (5 minutos), con excepciones por modelo.
- Cálculos: 29 500 y 3 000 tokens, 6 285 con caché (21 %), 1 008 000 tokens (≈ 3,02 USD sin caché y 0,41 con ella), 5 500 del quiz. Código de Python ejecutado.

## No verificado o dudoso
- Los cuatro modelos de Liu et al. son de 2023 y de una sola tarea; la lección lo dice.
- El informe de GPT-4 no da ninguna cifra de ventana; solo se cita su frase sobre la ventana limitada.
- Los precios de la escena son un ejemplo rotulado.
