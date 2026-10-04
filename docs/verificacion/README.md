# Verificación de fuentes y hechos

Cada lección cita sus fuentes en `sources` de su `content.ts` (autores, año, enlace) y el lector las ve al final de la lección. Aquí consta lo que se comprobó contra qué y lo que no se pudo comprobar.

## Qué hay
- `<lección>.md`: registro de verificación de esa lección (qué se contrastó con la fuente primaria, qué se corrigió, qué queda dudoso). Existe para las lecciones revisadas desde el 2026-10-04.
- Los datos propios (modelos, corpus, proyecciones) se generan con scripts dentro de la carpeta de cada lección y se comprobó que reproducen lo que afirma la voz.

## Auditoría de enlaces
`npm run check:sources -- --online` (en `app/`) revisa todas las fuentes de las lecciones publicadas: autores, año y enlace, y si el enlace responde. Un 403 de un editor no es un enlace roto: los DOI se verifican en Crossref. Estado a 2026-10-04: 17 lecciones, 170 fuentes, 0 enlaces rotos, 2 sin enlace (Cauchy 1847; tesis de Hochreiter 1991, sin versión en línea) y 1 que el editor bloquea a los robots (CanLII, Moffatt v. Air Canada; leída de una copia local).
Los enlaces añadidos después de la redacción se comprobaron antes de usarlos: estado 200 y título o DOI coincidentes en Crossref, arXiv, JMLR, NeurIPS y MIT Press.

## Pendiente
- Lecciones 04, 06, 10, 11 y 17 (las primeras en publicarse): su registro de verificación no se conservó y sus listas de fuentes son cortas (3 o 4). Conviene una pasada de reauditoría de referencias.
- Las lecciones en borrador (01, 02, 03, 05, 07, 08, 19, 20, 24 y las que faltan) se verifican al revisarlas, y cada autor deja aquí su registro antes de que se publiquen.
