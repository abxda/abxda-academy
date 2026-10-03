import type { LessonContent } from '../../core/types';

/** Cada lección vive en courses/<curso>/lessons/<id>/content.ts (texto, seguro en servidor) y scene.ts (escena, cliente). */
const mods = import.meta.glob<{ default: LessonContent }>('./*/lessons/*/content.ts', { eager: true });
export const CONTENT: Record<string, LessonContent> = {};
for (const [path, m] of Object.entries(mods)) {
  const course = path.split('/')[1];
  CONTENT[`${course}/${m.default.id}`] = m.default;
}
export const lessonContent = (courseId: string, lessonId: string): LessonContent | undefined => CONTENT[`${courseId}/${lessonId}`];

import type { CourseMeta, GlossaryTerm } from '../../core/types';
/** Glosario del curso: la suma de los términos que introduce cada lección. */
export function courseGlossary(course: CourseMeta): GlossaryTerm[] {
  const out: GlossaryTerm[] = [];
  for (const l of course.lessons) for (const t of lessonContent(course.id, l.id)?.terms ?? []) out.push({ ...t, lesson: l.id });
  return out;
}
