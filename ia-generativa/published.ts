/**
 * Lecciones que salen en el sitio publicado (build de producción). En desarrollo se ven todas las que tengan content.ts.
 * Una lección entra aquí SOLO cuando: pasa `check-lesson`, se revisó con `lesson-sheet` en escritorio y teléfono (claro y oscuro),
 * sus gates se completan y el audio está generado. Mientras tanto es borrador: se trabaja y se ve en desarrollo, y en producción
 * muestra «en preparación».
 */
/** Partes abiertas al público en el build de producción (en desarrollo se abren todas). Una lección sale solo si está en PUBLISHED y su parte está abierta. */
export const OPEN_PARTS: number[] = [1];

export const PUBLISHED: string[] = [
  'descenso-del-gradiente',
  'limite-xor',
  'generalizar-y-evaluar',
  'convoluciones',
  'difusion',
  'atencion',
  'agentes',
  'evaluar',
  'contexto-y-memoria',
  'entrenar-bien',
  'generar-distribuciones',
  'secuencias-y-memoria',
  'inferencia',
  'big-bang-deep-learning',
  'embeddings',
  'alucinaciones-y-limites',
  'alineacion',
  'que-es-aprender',
  'fine-tuning-lora',
  'datos-como-numeros',
  'modelo-y-error',
  'neurona',
  'capas-y-activaciones',
];
