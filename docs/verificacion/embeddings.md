# embeddings · Embeddings: el significado como geometría

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Mikolov et al. 2013 (8 869 preguntas semánticas y 10 675 sintácticas; se descartan las palabras de entrada; 65,6 % en la tabla 6); GloVe (Pennington et al. 2014); skip-gram (NIPS 2013); Linzen 2016 (sin exclusión la respuesta es la palabra de entrada en el 93 % de los casos); Bolukbasi 2016; Caliskan 2017; Gonen y Goldberg 2019; Sentence-BERT (Reimers y Gurevych 2019 y 2020); t-SNE (van der Maaten y Hinton 2008) y Wattenberg et al. 2016.
- Datos: `build-vectors.py` reproduce `embeddings.json` byte a byte (incluido t-SNE con su semilla) y el SHA-256 del zip de GloVe coincide; GloVe 6B es PDDL v1.0 (página de Stanford) y MiniLM es Apache-2.0 (ficha). `eval-search.py` reproduce `search-eval.json` (español 34/36, inglés 33/36). Cifras propias con scripts: `eval-analogies.py` y `measure-data.py` (capitales 80,1 %, género 85,6 %; sesgo con Spearman 0,91; vecindad del mapa 47,6 %).

## No verificado o dudoso
- Los 10 artículos y las 36 preguntas de la búsqueda los escribió el autor anterior: van rotulados «ilustrativo».
- Los vectores se entrenaron con texto en inglés; las etiquetas en español son traducciones (declarado en el lienzo y en la narración).
- El 65,6 % de Mikolov es de un modelo de 1 000 dimensiones; no es el GloVe de 100 dimensiones de la escena.
