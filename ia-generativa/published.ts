/**
 * Lecciones que salen en el sitio publicado (build de producción). En desarrollo se ven todas las que tengan content.ts.
 * Una lección entra aquí SOLO cuando: pasa `check-lesson`, se revisó con `lesson-sheet` en escritorio y teléfono (claro y oscuro),
 * sus gates se completan y el audio está generado. Mientras tanto es borrador: se trabaja y se ve en desarrollo, y en producción
 * muestra «en preparación».
 */
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
];
