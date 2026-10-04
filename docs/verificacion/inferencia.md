# inferencia · Inferencia: cómo responde un modelo

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- Mixtral (arXiv 2401.04088, tabla 1: 47B/13B activos); Llama 3 (arXiv 2407.21783, tabla 3: 32/80 capas y 8 cabezas KV; MFU 38–43 %; ventana de 8K a 128K); Kwon et al. (arXiv 2309.06180: 800 KB por token en OPT-13B, 1,6 GB para 2 048 tokens, 2–4×); decodificación especulativa (Leviathan 2X–3X; Chen 2–2,5×); Pope et al. (arXiv 2211.05102: 2N FLOPs por token, 76 % de MFU); PaLM (arXiv 2204.02311); GQA y Shazeer; DeepSeek-V3 (671B totales, 37B activos); Orca.
- NVIDIA: H100 80 GB, 3,35 TB/s; A100 80 GB SXM, 2 039 GB/s y 312 TFLOPS densos. Lista de precios de Anthropic del 4 de octubre de 2026 (salida a 5× la entrada; lectura de caché 0,1× salvo 0,05× y 0,025× en algunos modelos; escritura de 5 minutos 1,25×); la lección no nombra modelos.
- Los tres bloques de Python y el modelo dan los números impresos.

## No verificado o dudoso
- Los 360 GB/s de la RTX 3060 se derivan de 192 bits × 15 Gbps ÷ 8: la ficha de NVIDIA solo da 12 GB y 192 bits y los 15 Gbps salen de prensa del lanzamiento. Señalado en la fuente.
- Los precios de la escena (US$ 3 y 15 por millón) son un ejemplo rotulado, no la lista vigente.
- Las páginas de openai.com y otras con bloqueo a robots se confirmaron por búsqueda o copia, no en vivo.
