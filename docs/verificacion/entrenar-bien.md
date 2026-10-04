# entrenar-bien · Entrenar bien: lotes, épocas y optimizadores

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- GPT-3 (Brown et al. 2020, PDF): lote 3,2 M de tokens y tasa 0,6×10⁻⁴ (tabla 2.1); Adam con β₂=0,95; calentamiento de 375 M de tokens; decaimiento coseno al 10 % en 260 mil millones; lote desde 32 k en los primeros 4 a 12 mil millones (apéndice B); 0,44 épocas del rastreo web (tabla 2.2).
- Kingma y Ba 2015 (valores por defecto, invariancia al reescalar el gradiente, paso acotado por η). Vaswani 2017 (β₂=0,98, 4 000 pasos de calentamiento). Goyal 2017 (lote 8 192, 256 GPU, una hora). SGDR (ecuación 5). McCandlish 2018 («critical batch size»). Bergstra y Bengio (JMLR 13). Robbins y Monro (1951). Polyak 1964 (DOI verificado en Crossref).
- Código de «por dentro» reejecutado: SGD [1,999; 1,033], momento [2,008; 1,043], Adam [1,993; 1,028], solución exacta [1,998; 1,042]. κ≈50 y razones 0,96 y 0,75 salen de la simulación.
- Correcciones hechas en la revisión: la lección 4 usa un solo ejemplo (el texto decía que todos); Adam «no se asienta» se matizó con Kingma y Ba; «una décima parte» del momento es una razón teórica (en el cañón de la lección la razón real es 0,02 frente a 0,07).

## No verificado o dudoso
- Afirmaciones de oficio sin cita primaria: «una pérdida que se dispara al inicio apunta a tasa alta o falta de calentamiento» y «los pesos recién iniciados dan terreno empinado» (esta última rotulada como paisaje de juguete).
- Decimales: el lienzo usa punto y el texto de la voz usa coma; las demás lecciones hacen lo mismo. Pendiente una regla para todo el curso.
