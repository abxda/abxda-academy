import type { CourseMeta } from '../../core/types';
import { IA_GENERATIVA } from './ia-generativa/curriculum';

/** Registro de cursos de la academia. Para agregar uno: crear content/courses/<id>/ y registrarlo aquí. */
export const COURSES: CourseMeta[] = [IA_GENERATIVA];

export const courseById = (id: string) => COURSES.find((c) => c.id === id);
export const lessonOf = (c: CourseMeta, id: string) => c.lessons.find((l) => l.id === id);
export const totalMinutes = (c: CourseMeta) => c.lessons.reduce((a, l) => a + l.minutes, 0);
export const execMinutes = (c: CourseMeta) => c.lessons.filter((l) => l.exec).reduce((a, l) => a + l.minutes, 0);
export const lessonsOfModule = (c: CourseMeta, n: number) => c.lessons.filter((l) => l.module === n);
