# Verificación de fuentes y hechos

Cada lección cita sus fuentes en `sources` de su `content.ts` (autores, año, enlace) y el lector las ve al final de la lección. Aquí consta lo que se comprobó contra qué y lo que no se pudo comprobar.

## Qué hay
- `<lección>.md`: registro de verificación de esa lección (qué se contrastó con la fuente primaria, qué se corrigió, qué queda dudoso). Existe para las lecciones revisadas desde el 2026-10-04.
- Los datos propios (modelos, corpus, proyecciones) se generan con scripts dentro de la carpeta de cada lección y se comprobó que reproducen lo que afirma la voz.

## Auditoría de enlaces
`npm run check:sources -- --online` (en `app/`) revisa todas las fuentes de las lecciones publicadas: autores, año y enlace, y si el enlace responde. Un 403 de un editor no es un enlace roto: los DOI se verifican en Crossref. Estado a 2026-10-04: 17 lecciones, 170 fuentes, 0 enlaces rotos, 2 sin enlace (Cauchy 1847; tesis de Hochreiter 1991, sin versión en línea) y 1 que el editor bloquea a los robots (CanLII, Moffatt v. Air Canada; leída de una copia local).
Los enlaces añadidos después de la redacción se comprobaron antes de usarlos: estado 200 y título o DOI coincidentes en Crossref, arXiv, JMLR, NeurIPS y MIT Press.

## Pendiente
- Lecciones 4, 6, 10 y 11 reauditadas el 2026-10-04 (ajustes de narración en 04, 10 y 11: su audio se regenera). La 17 se reaudita con la parte 2.
- Las lecciones en borrador (08, 19, 20, 24, 22, 31 y las que faltan) se verifican al revisarlas, y cada autor deja aquí su registro antes de que se publiquen.
