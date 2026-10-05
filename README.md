# abxda academy · contenido

Contenido abierto de **abxda academy**: cursos gratuitos para entender la tecnología de verdad, en **español (México) e inglés**. Este repositorio guarda lo que se enseña (textos, guiones, escenas, datos, preguntas y fuentes); el sitio que lo publica en `abxda.com/academy` se construye aparte.

El primer curso es **«IA generativa: de la neurona al chatbot»** (37 lecciones en tres partes). Cada lección es una explicación narrada y animada que se construye por pasos —una frase, un cambio en pantalla—, con piezas que se mueven («Tu turno»), una capa «Por dentro» con fórmulas y código, y una lente de decisión para quien gestiona. **Todo dato lleva su fuente primaria.**

| Parte | Lecciones | Estado |
|---|---|---|
| 1 · Cómo aprende una máquina | 1–14 | revisada |
| 2 · Generar: imágenes y lenguaje | 15–26 | en preparación (borradores) |
| 3 · Del modelo al asistente y a la decisión | 27–37 | en preparación (borradores) |

## Cómo está organizado

```
ia-generativa/               un curso (hay una carpeta por curso, en la raíz)
├── curriculum.ts            orden, módulos, partes, títulos y rutas
├── published.ts             qué lecciones y qué partes están abiertas al público
└── lessons/<id>/
    ├── content.ts           texto: narración (es/en), ideas clave, quiz, «Por dentro», fuentes
    ├── scene.ts …           la escena animada y sus datos
    └── *.py / *.ts          scripts que reproducen los datos y modelos de juguete
docs/
├── LESSON-AUTHORING.md      guía para escribir una lección
├── CURRICULUM-MAP.md        mapa del currículo y qué término introduce cada lección
├── verificacion/            un registro por lección: qué se contrastó con qué fuente
└── CREDITS.md               licencias de datos y materiales de terceros
```

## Cómo ayudar

Se agradece que se señalen errores, se propongan mejores explicaciones o se aporten fuentes. Lee **[CONTRIBUTING.md](CONTRIBUTING.md)**: explica qué se puede cambiar, cómo citar fuentes y qué cambios implican regenerar la voz.

## Licencia

Este contenido se publica bajo **[CC BY-NC 4.0](LICENSE)**: puedes compartirlo y adaptarlo (por ejemplo, traducirlo) citando la autoría, indicando los cambios y sin fines comerciales. Los datos y materiales de terceros conservan su licencia (ver [`docs/CREDITS.md`](docs/CREDITS.md)).

---
Potenciado por Inteligencia Artificial · Aguascalientes, Aguascalientes, México
