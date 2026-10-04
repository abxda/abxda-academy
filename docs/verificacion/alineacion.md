# alineacion · De modelo base a asistente

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- InstructGPT (Ouyang et al. 2022): 13 mil indicaciones y unas 40 personas; coincidencia entre quienes etiquetan 72,6 %; cómputo de 4,9 y 60 frente a 3 640 petaflops/s-día (menos del 2 %); 1,3 mil millones preferido sobre 175 mil millones, y 85 ± 3 % para el de 175 mil millones.
- GPT-3, ChatGPT, DPO, Gao et al. 2022, Sharma et al. 2023, TinyLlama, Qwen2.5, LIMA, FLAN y Zephyr coinciden con lo escrito. Añadidos por la revisión: Constitutional AI, Llama 2, Llama 3, Christiano 2017 y Stiennon. Solo se atribuyen prácticas publicadas (ChatGPT con RLHF según OpenAI, Llama 2 con PPO, Llama 3 con DPO).
- El código de «por dentro» da su salida. El juguete reproduce lo que dice la voz: las dos rutas coinciden (92, 13, 67 y 5 %); la calidad real sube hasta una presión de 1,25 y cae a −0,97 mientras la puntuación del modelo de recompensa sube siempre; en DPO la probabilidad de la preferida no siempre sube (en el par del eslogan baja de 0,072 a 0,037).
- Correcciones: caso GPT-4o (análisis «preliminar», varios cambios a la vez); la correa KL no mejoró la frontera en el montaje de Gao; el 2 % de cómputo cubre solo los dos entrenamientos finales.

## No verificado o dudoso
- Las páginas de openai.com no se pueden abrir con herramientas automáticas: se leyeron por Wayback y sus URL no se comprobaron en vivo.
- Zephyr «sin etiquetas humanas» significa sin anotación humana nueva (el maestro es GPT-4).
- La demografía de quienes etiquetan viene de una encuesta voluntaria de 19 personas: no se usaron porcentajes.
- El artículo de InstructGPT es inconsistente sobre la inicialización del modelo de recompensa (cuerpo: modelo ajustado; apéndice C.2: GPT-3); consta así en «por dentro».
- Las preguntas, respuestas y rasgos de las cinco parejas del turno `rm` son ilustrativos y están rotulados.
