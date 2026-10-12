# entrenar-bien · Entrenar bien: lotes, épocas y optimizadores

Registro de verificación (2026-10-04; revisado el 2026-10-11 al reescribir la lección para principiantes). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- GPT-3 (Brown et al. 2020, PDF): lote 3.2 M de tokens y tasa 0.6×10⁻⁴ (tabla 2.1); Adam con β₂=0.95; calentamiento de 375 M de tokens; decaimiento coseno al 10 % en 260 mil millones; lote desde 32 k en los primeros 4 a 12 mil millones (apéndice B); 0.44 épocas del rastreo web (tabla 2.2).
- Kingma y Ba 2015 (valores por defecto, invariancia al reescalar el gradiente, paso acotado por η). Vaswani 2017 (β₂=0.98, 4 000 pasos de calentamiento). Goyal 2017 (lote 8 192, 256 GPU, una hora). SGDR (ecuación 5). McCandlish 2018 («critical batch size»). Bergstra y Bengio (JMLR 13). Robbins y Monro (1951). Polyak 1964 (DOI verificado en Crossref).
- Código de «por dentro» reejecutado: SGD [1.999; 1.033], momento [2.008; 1.043], Adam [1.993; 1.028], solución exacta [1.998; 1.042]. κ≈50 y razones 0.96 y 0.75 salen de la simulación.
- Correcciones hechas en la revisión del 2026-10-04: la lección 4 usa un solo ejemplo (el texto decía que todos); Adam «no se asienta» se matizó con Kingma y Ba; «una décima parte» del momento es una razón teórica (en el cañón de la lección la razón real es 0.02 frente a 0.07).

## Cifras que dice la voz y salen de la simulación (2026-10-11)
Recalculadas con `sim.ts` (modelo de juguete real: 256 ejemplos, SGD, momento y Adam sin atajos), las mismas corridas que dibuja la escena:
- Cuenco, tasa 0.08, desde el mismo inicio: error inicial 9.06; lotes de 256 tras 4 épocas (4 pasos): 1.33; lotes de 8, semilla 5 (128 pasos): 0.010; lotes de 1, semilla 5 (1 024 pasos): 0.27. Mediana de 12 semillas por tamaño: la mejor es lote 32 (0.0010), de ahí «aquí, cerca de treinta y dos».
- Desvío medio de la flecha de un lote respecto a la de todos (24 lotes por tamaño): lote 2: 19.8 %; 8: 10.3 %; 32: 4.1 %; 128: 1.7 %. La voz dice «un veinte», «un diez», «un cuatro» y «menos de dos».
- Cañón: las paredes se empinan 15.06 frente a 0.3 del fondo: unas 50 veces.
- SGD en el cañón: con 0.08 rebota sin divergir en 100 pasos; con 0.11 diverge en el paso 4; con 0.02 termina en 0.22 sin llegar.
- Comparación con tasas ajustadas (semilla 9, umbral 0.05): SGD 0.07 → 71 pasos; momento 0.02 → 30; Adam 0.2 → 20 (con las semillas 3, 5 y 7 el orden es el mismo: 71–74, 27–32, 20–22).
- Momento: β = 0.9 en la simulación («nueve décimas de la velocidad»). Con lotes ruidosos, el momento no se queda quieto: va y viene alrededor del fondo (errores entre 0.000 y 0.17 después del paso 60); la voz se ajustó a «va y viene un rato alrededor del fondo».
- Calendario, SGD con tasa 0.07 desde la zona empinada: tasa fija → diverge en el paso 2; solo decaimiento → diverge en el paso 2; solo calentamiento (16 pasos) → no diverge, error final 0.15; calentamiento y decaimiento → error final 0.029. Adam 0.3 con tasa fija termina en 0.0082; con decaimiento, en 0.0011.

## No verificado o dudoso
- Afirmaciones de oficio sin cita primaria: «una pérdida que se dispara al inicio apunta a tasa alta o falta de calentamiento» y «los pesos recién iniciados dan terreno empinado» (esta última rotulada como paisaje de juguete).
- «Tokens, que son trozos de texto»: simplificación (en GPT-3 son piezas BPE, a veces palabras enteras); el término se define en una lección posterior.
- Decimales: desde el 2026-10-11 la narración en español dice «punto» («cero punto cero ocho»), como pide la convención del curso.
