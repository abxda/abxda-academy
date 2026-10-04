# evaluar · Evaluar sistemas de IA

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Hendrycks 2020 (arXiv 2009.03300): 57 temas, 15 908 preguntas, GPT-3 43,9 %, experto 89,8 % (estimación). GPT-4 Technical Report: MMLU 86,4 %, caso de BIG-bench colado en el entrenamiento, subcadenas de 50 caracteres. Gemini: 90,04 % con 32 razonamientos frente a 83,7 % con 5 ejemplos.
- Gema et al. 2024: 6,49 % de preguntas con error y 57 % en virología. Zhang et al. 2024: 1 205 problemas y caídas de hasta 8 %. Magesh et al. 2025: 17 %, 17 %, 33 % y 43 % con 202 consultas.
- Zheng et al. 2023: 85 % frente a 81 %; consistencia 65,0 / 46,2 / 23,8 %; ataque de lista repetitiva 91,3 / 91,3 / 8,7 %; defensa de intercambiar posiciones. Chiang et al. 2024: más de 240 000 votos. Ganguli et al. 2022: 38 961 ataques. Chen et al. 2023: 84,0 % a 51,1 %. Sclar et al. 2023: 76 puntos. Phan et al. 2025: 2 500 preguntas. Bowyer 2025, Miller 2024 y Gao 2022: conclusiones coinciden.
- Estadística propia: el código Python da los números de sus comentarios; `check-sim.ts` es coherente con las cifras de la voz.

## No verificado o dudoso
- Strathern 1997 y los números de página se dieron por buenos de memoria. El enlace DOI se verificó después en Crossref (título, revista y año coinciden); las páginas no se consultaron en la fuente.
- Gemini 90,04 %: la voz dice «votando entre 32 razonamientos»; el método real es «enrutamiento por incertidumbre» (voto de mayoría solo con consenso suficiente). Se precisó en «por dentro»; el segmento sigue simplificado.
- Chen et al. 2023: según Narayanan y Kapoor los números de la prueba eran todos primos; la caída 84→51 % es de comportamiento y no necesariamente de capacidad. La lección lo dice.
