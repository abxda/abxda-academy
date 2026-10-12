/**
 * Lecciones que salen en el sitio publicado (build de producción). En desarrollo se ven todas las que tengan content.ts.
 * Una lección entra aquí SOLO cuando: pasa `check-lesson`, se revisó con `lesson-sheet` en escritorio y teléfono (claro y oscuro)
 * y sus gates se completan. Su audio puede llegar después: mientras no coincida con el texto, el reproductor avanza sin voz y avisa
 * «voz en preparación». Lo que no está aquí es borrador: se ve en desarrollo y en producción muestra «en preparación».
 */
/** Partes abiertas al público en el build de producción (en desarrollo se abren todas). Una lección sale solo si está en PUBLISHED y su parte está abierta. */
export const OPEN_PARTS: number[] = [1, 2, 3];

export const PUBLISHED: string[] = [
  // parte 1 (revisión de claridad y voces nuevas, 2026-10-11)
  'que-es-aprender',
  'datos-como-numeros',
  'modelo-y-error',
  'descenso-del-gradiente',
  'neurona',
  'limite-xor',
  'capas-y-activaciones',
  'backpropagation',
  'entrenar-bien',
  'generalizar-y-evaluar',
  'convoluciones',
  'secuencias-y-memoria',
  'big-bang-deep-learning',
  'embeddings',
  // partes 2 y 3: cada lección entra aquí en cuanto está reescrita con el criterio de «llevar de la mano»; si su audio aún no está,
  // se ve sin voz con el aviso «voz en preparación» (el dueño pidió verlas en producción mientras se graban, 2026-10-11)
  'generar-distribuciones',
  'gans',
  'difusion',
  'texto-a-imagen',
  'siguiente-palabra',
  'tokens',
  'atencion',
  'transformer',
  'preentrenamiento',
  'leyes-escala-costos',
  'hardware-y-memoria',
  'inferencia',
  'fine-tuning-lora',
  'alineacion',
  'razonamiento',
  'contexto-y-memoria',
  'rag',
  'agentes',
  'alucinaciones-y-limites',
  'evaluar',
  'riesgos-y-gobernanza',
  'estrategia',
  'mapa-completo',
];
