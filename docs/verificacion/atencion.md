# atencion · Atención

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Vaswani et al. 2017 (arXiv 1706.03762, PDF leído): nota 4 (q·k tiene media 0 y varianza d_k); h=8, d_model=512, d_k=d_v=64 con coste parecido al de una cabeza; tabla 1 (O(n²·d) y O(1) pasos frente a O(n·d²) y O(n) en una red recurrente); «dispensing with recurrence and convolutions».
- Bahdanau et al. (arXiv 1409.0473): puntuación a(s_{i-1}, h_j) con red feedforward, contexto como suma ponderada, codificador bidireccional.
- Datos reales de BERT: `real-attention.py` se reejecutó en un entorno aparte con las revisiones del modelo fijadas y `real-data.ts` salió idéntico byte a byte. Español: capa 10, cabeza 5, 58/144 cabezas con su mayor peso en marcas, 1/144 que gira. Inglés: capa 9, cabeza 11, 91/144 y 6/144.
- Código de «por dentro» ejecutado: pesos [.01 .23 0 .01 .58 0 .01 .05 .10], vector [.70 .23], desviaciones 1,4 / 8,0 / 22,6. Con d=64 una simulación de 20 000 sorteos da 0,87 y 0,34; la escena (100 sorteos) muestra 0,88 y 0,34.

## No verificado o dudoso
- Cifras de BERT base (12 capas × 12 cabezas) y GPT-3 (96 capas × 96 cabezas de 128) tomadas de Devlin y de Brown sin releer los artículos en esta pasada.
- Bahdanau: arXiv 2014, ICLR 2015; el curso usa 2014.
- Redacción en español «este» (se interpreta como el sustantivo más cercano); se dejó porque los datos reales de BERT se generaron con esa frase.
