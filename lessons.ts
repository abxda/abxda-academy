import type { CourseMeta, LessonContent } from '../../core/types';
import { courseById, partOfLesson } from './index';

/** Cada lección vive en courses/<curso>/lessons/<id>/content.ts (texto, seguro en servidor) y scene.ts (escena, cliente). */
const mods = import.meta.glob<{ default: LessonContent }>('./*/lessons/*/content.ts', { eager: true });
/** Por curso, qué lecciones están publicadas (./<curso>/published.ts). Sin archivo, todas. */
const lists = import.meta.glob<{ PUBLISHED: string[]; OPEN_PARTS?: number[] }>('./*/published.ts', { eager: true });
const published = (course: string): Set<string> | undefined => {
  const l = lists[`./${course}/published.ts`];
  return l ? new Set(l.PUBLISHED) : undefined;
};
/** Partes abiertas por curso (./<curso>/published.ts → OPEN_PARTS). Sin lista, todas. */
const openParts = (course: string): Set<number> | undefined => {
  const l = lists[`./${course}/published.ts`];
  return l?.OPEN_PARTS ? new Set(l.OPEN_PARTS) : undefined;
};
/** En desarrollo (o con PUBLIC_SHOW_DRAFTS=1) se ve todo: borradores y partes cerradas; el build de producción solo publica lo revisado de las partes abiertas. */
const showDrafts = import.meta.env.DEV || import.meta.env.PUBLIC_SHOW_DRAFTS === '1';
const partClosed = (courseId: string, lessonId: string): boolean => {
  if (showDrafts) return false;
  const open = openParts(courseId), c = courseById(courseId), l = c?.lessons.find((x) => x.id === lessonId);
  const part = c && l ? partOfLesson(c, l) : undefined;
  return !!(open && part && !open.has(part.n));
};
export const CONTENT: Record<string, LessonContent> = {};
for (const [path, m] of Object.entries(mods)) {
  const course = path.split('/')[1];
  const pub = published(course);
  if (!showDrafts && pub && !pub.has(m.default.id)) continue;
  if (partClosed(course, m.default.id)) continue;
  CONTENT[`${course}/${m.default.id}`] = m.default;
}
export const lessonContent = (courseId: string, lessonId: string): LessonContent | undefined => CONTENT[`${courseId}/${lessonId}`];

import type { GlossaryTerm } from '../../core/types';
/** Glosario del curso: la suma de los términos que introduce cada lección. */
export function courseGlossary(course: CourseMeta): GlossaryTerm[] {
  const out: GlossaryTerm[] = [];
  for (const l of course.lessons) for (const t of lessonContent(course.id, l.id)?.terms ?? []) out.push({ ...t, lesson: l.id });
  return out;
}

/** Estado de una lección: open (publicada), prep (su parte está abierta pero la lección aún no) o soon (su parte está cerrada: no tiene página). */
export type LessonState = 'open' | 'prep' | 'soon';
export function lessonState(courseId: string, lessonId: string): LessonState {
  if (partClosed(courseId, lessonId)) return 'soon';
  return CONTENT[`${courseId}/${lessonId}`] ? 'open' : 'prep';
}
export function partState(courseId: string, n: number): 'open' | 'soon' {
  const open = openParts(courseId);
  return showDrafts || !open || open.has(n) ? 'open' : 'soon';
}
/** Lecciones que el público puede ver (o ver «en preparación») en esta compilación. */
export const availableLessons = (c: CourseMeta) => c.lessons.filter((l) => lessonState(c.id, l.id) !== 'soon');
