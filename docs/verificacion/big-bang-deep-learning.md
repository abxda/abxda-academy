# big-bang-deep-learning · El big bang del deep learning

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- AlexNet (NIPS 2012, PDF): 60 M de parámetros, 650 000 neuronas, 5 convolucionales y 3 densas; 5–6 días en 2 GTX 580; dropout 0,5; 15,3 % frente a 26,2 %; tabla 2: 18,2 % (1 red), 16,4 % (5), 15,3 % (7, 2 preentrenadas con 15 M de imágenes).
- Russakovsky et al. 2015: 14 197 122 imágenes y 21 841 synsets; 1 281 167 de entrenamiento; ganadores NEC 28,2 %, XRCE 25,8 %, Clarifai 11,74 %, GoogLeNet 6,66 %; humanos 5,1 % y 12,0 %. He et al. 2015: 3,57 %, 4,49 % con ResNet-152, 11,3 frente a 19,6 mil millones de FLOPs, degradación en CIFAR-10. GoogLeNet: 22 capas. Raina 2009: aceleraciones 12,9 / 16,2 / 68,0 / 72,6×. Glorot y Bengio: n·Var[W] = 1/3.
- OpenAI «AI and Compute» (web y copia de archive.org): doblamiento de 3,4 meses, más de 300 000×, 7× con la ley de Moore, cuenta de AlexNet. Sevilla et al. 2022: ~6 meses. He et al. 2016, ecuación 5. DOI y fechas comprobados en Crossref (ImageNet 2009, Russakovsky, Raina; arXiv 1207.0580 y 1603.05027; LeCun 1989).
- El experimento de gradientes de la escena reproduce la voz (a 10 capas el gradiente llega 539× más pequeño; a 40 capas 4,2e-11; retropropagación coincide con diferencias finitas a ~1e-9).
- Correcciones: «equipos» → «participaciones» (Russakovsky); «2012–2018» → «2012–2017» (la serie va de AlexNet a AlphaGo Zero); el 15,3 % de 2012 lleva «†» (con datos extra; 16,4 % sin ellos); cita de He et al. a «§4.1 y figura 1»; el dropout se presenta aquí porque la lección 10 solo lo cita.

## No verificado o dudoso
- 3 584 núcleos CUDA y ~12,7 TFLOP/s de la RTX 3060, y 1,544 GHz de la GTX 580: sin fuente primaria localizada (cuenta propia, de memoria).
- AlexNet: la lección escribe 4,9e17 FLOP y OpenAI imprime «470 PF» (redondeo).
- «Entre 2012 y 2017» es lectura del gráfico «AlexNet to AlphaGo Zero»; el texto de OpenAI dice solo «since 2012».
