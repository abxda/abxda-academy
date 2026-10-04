# alucinaciones-y-limites · Alucinaciones y límites

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Mata v. Avianca (orden de comparecencia del 4 de mayo y sanciones del 22 de junio de 2023, PDF de los autos); Moffatt v. Air Canada 2024 BCCRT 149 (texto del fallo; 812,02 dólares canadienses confirmado con búsqueda web); Magesh et al. 2024 (texto completo); Kalai et al. 2025 (teorema 2 y propuesta de puntaje); GPT-4 Technical Report (texto sobre calibración); TruthfulQA (817 preguntas, 38 categorías, 58 % y 94 %); Kandpal (ICML 2023), Zhang et al. 2023, Guo 2017, Farquhar 2024, Chow 1970.
- Datos de Pythia regenerados con scripts reproducibles: 160M, 410M, 1B y 1.4B idénticos en GPU; 2.8B misma exactitud (83,0 %); 6.9B y 12B confirmados con una muestra de 24 preguntas en CPU.
- Errores del autor anterior corregidos: la exactitud de 410 M a 12 000 M de parámetros sube de 42 a 94 % (la voz decía 55 %); «ninguna opción pasa del 5 %» era falso (5,1 %); «miles de opciones» eran cientos (402 piezas cubren el 90 %); la probabilidad de «no sé» incluía la de «Juan Rulfo»; Czech crown mal calificada (1.4B: 73,8 %, 313 de 424); la cronología de Mata era la versión del abogado; la multa de 5 000 dólares se impuso a los dos abogados y a su despacho.

## No verificado o dudoso
- CanLII responde 403 a los robots: el fallo se leyó de una copia local descargada.
- El texto exacto de la respuesta de ChatGPT del apéndice B de Mata son imágenes: se muestra como paráfrasis rotulada.
- No se pudieron comprobar los datos de la figura 8 del informe de GPT-4, solo su texto.
- Las 424 preguntas son cultura general escrita por el autor, no un benchmark publicado (se dice en «por dentro»). Para 6.9B y 12B no se repitieron las 424 completas.
