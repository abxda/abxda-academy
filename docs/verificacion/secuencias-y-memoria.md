# secuencias-y-memoria · Secuencias y memoria

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Pascanu et al. 2013 (λ₁ < 1/γ suficiente para desvanecer, λ₁ > 1/γ necesario para explotar; γ = 1 para tanh y ¼ para sigmoide; recorte de gradiente); Khandelwal et al. 2018 (~200 tokens de contexto en promedio; el orden importa en los ~50 más recientes); Sutskever et al. 2014; Cho et al. 2014; Wu et al. 2016 (8 capas LSTM en codificador y decodificador); Lakretz et al. 2019; Jozefowicz et al. 2015 (sesgo 1 en la compuerta de olvido); Hochreiter y Schmidhuber 1997; Gers et al. 2000.
- El modelo propio reproduce lo que dice la voz (7 % hasta «flores», 100 % en «mercado», 86 % por la cinta con f = 0,97) y los dos bloques de código dan su salida impresa.
- Correcciones: figura de traducción inglés→francés en ambos idiomas, rotulada ilustrativa; «las convoluciones nacieron en 1989» → «las redes convolucionales ya leían códigos postales en 1989» (coherente con la lección 11).

## No verificado o dudoso
- Tesis de Hochreiter 1991: no hay versión en línea; su existencia se confirmó en un registro bibliográfico. La afirmación del decaimiento exponencial depende de cómo la cita el artículo de 1997.
- Bengio et al. 1994: el matiz del dilema solo se confirmó en el resumen. Elman 1990: «predecir la siguiente palabra» se confirmó en búsquedas y resúmenes, no en el PDF.
