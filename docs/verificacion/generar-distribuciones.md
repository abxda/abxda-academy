# generar-distribuciones · Generar es aprender una distribución

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Kingma y Welling (arXiv 1312.6114, 20 de diciembre de 2013); Rezende et al. (arXiv 1401.4082, ICML 2014; Kingma y Welling 2019 dicen que fue independiente); Goodfellow et al. §14.1 (frase sobre el decodificador lineal y el PCA, textual); Kingma y Welling 2019 §2.8.2 (borrosidad por ajuste imperfecto); Carlini et al. 2023 (más de mil ejemplos extraídos; memorización concentrada en duplicados); Hinton y Salakhutdinov, Science 313, 2006 (Crossref).
- Dígitos UCI: 1 797 imágenes de prueba, CC BY 4.0, DOI 10.24432/C50P49, bloques de 4×4 con valores 0–16.
- `train_toy.py` se corrió en una copia y `latent.json` salió idéntico (errores 3,14 / 2,34 / 1,46 / 0,95 / 0,54, referencia 4,71, 4 354 y 4 420 parámetros). Con las ocho semillas el VAE sale más parejo (AE 0,21–0,37; VAE 0,09–0,16).
- Correcciones: la nube de la imagen elegida ahora decodifica lo que la voz dice; «con un número se adivina apenas» → «se confunden muchos dígitos»; «el VAE reparte los diez como los datos» → «mucho más pareja, aunque no perfecta» (5 % a 14 %).

## No verificado o dudoso
- La diferencia con PyTorch al redondear a 3 decimales es de 0,004.
