import type { LessonContent } from '../../core/types';

/** Cada lección vive en courses/<curso>/lessons/<id>/content.ts (texto, seguro en servidor) y scene.ts (escena, cliente). */
const mods = import.meta.glob<{ default: LessonContent }>('./*/lessons/*/content.ts', { eager: true });
/** Por curso, qué lecciones están publicadas (./<curso>/published.ts). Sin archivo, todas. */
const lists = import.meta.glob<{ PUBLISHED: string[] }>('./*/published.ts', { eager: true });
const published = (course: string): Set<string> | undefined => {
  const l = lists[`./${course}/published.ts`];
  return l ? new Set(l.PUBLISHED) : undefined;
};
/** En desarrollo (o con PUBLIC_SHOW_DRAFTS=1) se ven también los borradores; el build de producción solo publica lo revisado. */
const showDrafts = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === '1';
export const CONTENT: Record<string, LessonContent> = {};
for (const [path, m] of Object.entries(mods)) {
  const course = path.split('/')[1];
  const pub = published(course);
  if (!showDrafts && pub && !pub.has(m.default.id)) continue;
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
