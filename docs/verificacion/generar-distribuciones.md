# generar-distribuciones · Generar es aprender una distribución

Registro de verificación (2026-10-04; revisado el 2026-10-11 con la reescritura para principiantes). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Kingma y Welling, «Auto-Encoding Variational Bayes» (arXiv 1312.6114): página de arXiv leída hoy; v1 del 20 de diciembre de 2013; el resumen describe la reparametrización de la cota inferior variacional y el modelo de reconocimiento (codificador).
- Rezende, Mohamed y Wierstra (arXiv 1401.4082, ICML 2014): propuesta independiente; Kingma y Welling 2019 (arXiv 1906.02691) lo dicen así. §2.8.2 de Kingma y Welling 2019: la borrosidad de los VAE se atribuye a un ajuste imperfecto y se atenúa con modelos más flexibles.
- Goodfellow, Bengio y Courville 2016, §14.1: con decodificador lineal y error cuadrático, el autocodificador aprende el mismo subespacio que el PCA (frase textual). Hinton y Salakhutdinov, Science 313, 2006 (DOI comprobado en Crossref).
- Carlini et al., «Extracting Training Data from Diffusion Models» (arXiv 2301.13188; USENIX Security 2023): resumen leído hoy («we extract over a thousand training examples from state-of-the-art models»; «diffusion models memorize individual images from their training data and emit them at generation time») y texto del PDF extraído con `pdftotext`: «These results show that duplication is a major factor behind training data extraction» (figura 5: se extrae sobre todo lo duplicado muchas veces). Sostiene el segmento `caveat` («sobre todo las muy repetidas»).
- Dígitos UCI: 1797 imágenes de 8 × 8, CC BY 4.0, DOI 10.24432/C50P49, bloques de 4 × 4 con valores 0–16 (scikit-learn `load_digits`).
- Enlaces: `npx tsx scripts/check-sources.mts --online generar-distribuciones` → 7 fuentes, 0 sin enlace, 0 rotos.
- Cifras propias: `verify-data.ts` (en la carpeta de la lección; `npx tsx` desde `app/`) recalcula con los mismos datos y pesos que ejecuta la escena todas las cifras de la voz, la escena y «por dentro», y sale con 0 discrepancias:
  - 179 sietes y 181 seises; 1500 imágenes de entrenamiento; 96 000 números en ellas; 4354 parámetros del autocodificador y 4420 del VAE.
  - El siete de ejemplo (imagen 477): tinta arriba 12 y abajo 7.75 (en pantalla 7.8); código del autocodificador (−0.539, 0.615), dicho «menos cero punto cinco y cero punto seis»; error de reconstrucción 0.836 (en pantalla 0.84).
  - Gaussiana de los sietes: μ = (10.82, 8.14), Σ = [[2.24, −0.65], [−0.65, 2.45]]; los sietes cargan más tinta arriba y los seises abajo; la frontera (análisis discriminante lineal) separa bien el 98.1 % de los 360.
  - El paseo por el plano se lee 7 → 3 → 9 → 5 → 0 → 6 → 4, como dice `walk-smooth`.
  - Los tres huecos dibujados no contienen ningún código; el punto del hueco de arriba a la izquierda da una mancha (el clasificador duda, p = 0.39).
  - Muestreo (3000 intentos, de `train_toy.py`): autocodificador 22.2 % de cuatros, 20.7 % de seises y 0.7 % de ochos; VAE entre 6.0 % y 13.7 % de cada dígito.
  - «No es collage»: el siete nuevo del principio y los cinco pares generados están a 0.76–1.13 de su imagen de entrenamiento más cercana; los dígitos reales no vistos están, en promedio, a 1.03. Ninguno es copia.
- `train_toy.py` (sin cambios en el modelo ni en `latent.json`): en la revisión del 2026-10-04 se corrió en una copia y `latent.json` salió idéntico (errores 3.14 / 2.34 / 1.46 / 0.95 / 0.54, referencia 4.71). Con las ocho semillas el VAE sale más parejo (TV del autocodificador 0.21–0.37; del VAE 0.09–0.16).
- Código de «por dentro» (ES y EN): ejecutado con Python 3 y NumPy; da exactamente `[10.84, 8.14] [[10.9, 8.0], [11.4, 7.9], [10.4, 8.5]]` y `0.7263 [0.9, -1.1]`. Las fracciones dentro de los óvalos (1 − e^(−1/2) ≈ 39 %, 1 − e^(−2) ≈ 86 %) son las de una gaussiana de dos dimensiones.
- Escena en Chrome (Playwright, escritorio): el gate `sample` se completa con tres pulsaciones del botón; el gate `walk` se completa al mover el deslizador por tres dígitos distintos; ninguno se completa solo con la demostración (cuentan `S.touched`); al retroceder se reinician.

## Corregido del texto previo
- La lección se reescribió para principiantes (criterio del 2026-10-11): la primera parte ya no usa un histograma de la tinta con una campana que hay que ajustar, sino una nube de puntos real (cada siete medido con dos números: tinta de su mitad de arriba y de su mitad de abajo) donde se ven clasificar (una frontera entre seises y sietes), la distribución (común, raro, nunca) y muestrear (puntos nuevos sacados de los óvalos ajustados, rotulado en pantalla). El autocodificador se presenta pieza por pieza, el paseo por el espacio latente tiene una demostración automática, y los huecos del autocodificador y las nubes del VAE que los rellenan tienen cada uno su segmento.
- Se quitaron afirmaciones que el nuevo hilo ya no necesita (puntuación de verosimilitud de la campana, distancias medias por tipo de imagen, porcentaje de píxeles «bien definidos»).
- «Las imágenes del VAE salen más limpias» no se afirma: con el clasificador, las muestras del VAE dudan más que las del autocodificador (33 % frente a 15 % con p < 0.6), porque son más borrosas. La comparación se limita a la mezcla de dígitos, que sí sale mucho más pareja.
- `blurry`: se evitó la causalidad histórica («por eso se inventaron otras formas»): las GAN (2014) son casi contemporáneas de los VAE (2013). Ahora dice «otras formas de generar, que veremos después, logran más nitidez».
- Registro y `train_toy.py`: los decimales con coma pasaron a punto (convención del curso).

## No verificado o dudoso
- La diferencia con PyTorch al redondear los pesos a 3 decimales es de 0.004 como máximo; las frecuencias de 3000 intentos vienen de PyTorch (pesos sin redondear) y el navegador no las recalcula.
- «Así trabajan los sistemas que crean imágenes, voces o textos» (segmento `generative`) es una afirmación general, sin cifra.
- El clasificador que etiqueta las muestras es una regresión logística sencilla; donde la imagen es ambigua, su etiqueta también lo es. La escena lo rotula («según un clasificador sencillo»).
- El audio de la lección no se generó: todos los segmentos son nuevos o reescritos y hay que regenerarlo antes de publicar.
