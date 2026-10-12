// Escena: El mapa completo. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar la
// siguiente):
//  1 · del correo de la lección 1 al chatbot; las tres partes de esta lección                     (hook, plan)
//  2 · el mapa: 36 puntos, 8 módulos y el hilo; cada módulo se enciende mientras la voz lo resume (map-dots … thread)
//  3 · la línea de tiempo de 1943 a hoy: el cursor recorre solo los hitos (S.drive del control «anio»); los dos tramos
//      (antes y después de 2012); qué cambió; «tu turno»: mover el año                        (tl-axis … try-tl)
//  4 · las diez preguntas, una por segmento, con las lecciones de las que salen                   (q-intro … q-use)
//  5 · cómo seguir aprendiendo                                                                   (learn-1 … learn-3)
//  6 · el mapa abierto: la escena elige sola dos puntos (S.drive del control «leccion»), cada uno con su idea en una
//      frase y un botón que abre su lección (S.navigate, solo tras un toque o un clic); «tu turno»: tocar un punto;
//      repaso y cierre. El mapa queda abierto al terminar                                     (map-back … end)
// Cada «tu turno» va precedido de una demostración que mueve sola el control; es opcional y solo cuenta lo que hizo la
// persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento (ui.ts: fr, win).
//
// REAL (procedencia al pie): títulos, módulos y orden del currículo; fechas verificadas en la lección de cada hito; ideas y
// preguntas resumidas de las ideas clave y las lentes de decisión de cada lección (data.ts).
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { lessonUrl } from '../../../../../core/routes';
import { IA_GENERATIVA, LESSONS } from '../../curriculum';
import { SHORT, YEAR0, eventAt, EVENTS } from './data';
import { cardLayout, drawMapOpen, drawMapWalk, hitNode, mapLayout, mapPanes } from './v-map';
import { demoYear, drawTime, type TimeSt } from './v-time';
import { drawHook, drawLearn, drawQuestions } from './v-other';
import { fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'map-dots', draw: drawHook },
  { from: 'map-dots', to: 'tl-axis', draw: drawMapWalk, src: (S) => S.l('Títulos, módulos y orden: currículo del curso', 'Titles, modules, and order: the course curriculum') },
  { from: 'tl-axis', to: 'q-intro', draw: (S) => drawTime(S, st(S).tm), src: (S) => S.l('Fechas verificadas en la lección de cada hito · la selección de hitos es de este curso', 'Dates verified in each milestone’s lesson · the choice of milestones is this course’s') },
  { from: 'q-intro', to: 'learn-1', draw: drawQuestions, src: (S) => S.l('Preguntas reunidas de las lentes de decisión de las lecciones', 'Questions gathered from the lessons’ decision lenses') },
  { from: 'learn-1', to: 'map-back', draw: drawLearn },
  { from: 'map-back', draw: (S) => drawMapOpen(S, st(S).sel, st(S).selAt, cardIn(S)), src: (S) => S.l('Cada idea resume las ideas clave de su lección', 'Each idea sums up its lesson’s key ideas') },
];

// tap: punto que la persona tocó en el lienzo (0 = ninguno); user: la persona eligió un punto (con el dedo o el deslizador)
interface St { lastT: number; tm: TimeSt; seenEv: number[]; sel: number; selAt: number; tap: number; user: boolean }
const fresh = (): St => ({ lastT: -1, tm: { year: YEAR0, shown: YEAR0, marks: {}, evAt: -1, ev: -1, forceEv: false }, seenEv: [], sel: 4, selAt: -1, tap: 0, user: false });
const st = (S: Frame): St => (S.st.mc ??= fresh()) as St;

/** Lección que la demostración elige: la 4 en «map-back»; en «map-demo», paso a paso hasta la 21. */
function demoLesson(S: Frame): number {
  if (S.on('try-map')) return 21;
  if (S.on('map-demo')) return Math.round(4 + 17 * fr(S, 'map-demo', 0.04, 0.3, 'io'));
  return 4;
}
/** La tarjeta de la idea entra cuando la voz dice «Mira: el cuatro» (o en cuanto la persona elige un punto). */
const cardIn = (S: Frame) => (S.touched.has('leccion') || st(S).user ? 1 : fr(S, 'map-back', 0.6, 0.72));
/** ¿Se puede tocar la tarjeta? (visible y sin el repaso encima) */
const cardLive = (S: Frame) => S.on('map-back') && cardIn(S) > 0.5 && (!S.on('recap') || S.on('end'));

function openLesson(S: Frame, n: number) {
  const meta = LESSONS[clamp(n, 1, 36) - 1];
  if (meta) S.navigate(lessonUrl(S.lang, IA_GENERATIVA, meta));
}
const inR = (r: { x: number; y: number; w: number; h: number }, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: recorrer la línea de tiempo ──
    { id: 'anio', kind: 'slider', label: { es: 'Año', en: 'Year' }, min: YEAR0, max: 2026, step: 1, value: YEAR0, from: 'tl-axis', to: 'q-intro', fmt: (v) => String(v) },
    // ── turno 2: elegir un punto del mapa y abrir su lección (se queda al terminar) ──
    { id: 'leccion', kind: 'slider', label: { es: 'Lección', en: 'Lesson' }, min: 1, max: 36, step: 1, value: 4, from: 'map-back', fmt: (v, l) => `${v} · ${SHORT[v - 1][l]}` },
    { id: 'abrir', kind: 'button', label: { es: 'Abrir esta lección', en: 'Open this lesson' }, from: 'map-back' },
  ],

  init(S) { S.st.mc = fresh(); },

  action(S, id) {
    if (id === 'abrir' && S.on('map-back')) openLesson(S, st(S).sel);
  },

  pointer(S, e) {
    if (e.type !== 'down' || !S.on('map-back')) return;
    const s = st(S);
    if (cardLive(S)) {
      const C = cardLayout(S, s.sel);
      if (inR({ x: C.bx, y: C.by, w: C.bw, h: C.bh }, e.x, e.y)) { S.touched.add('abrir'); openLesson(S, s.sel); return; }
    }
    const n = hitNode(mapLayout(S, mapPanes(S).main), e.x, e.y, S.hitR);
    // El toque elige el punto sin marcar el deslizador como «tocado»: así la escena lo mueve (S.drive) y la interfaz lo refleja.
    if (n) { S.touched.delete('leccion'); S.touched.add('mapa'); s.tap = n; s.user = true; S.p.leccion = n; if (n !== s.sel) { s.sel = n; s.selAt = S.clock; } }
  },

  cursor(S, x, y) {
    if (!S.on('map-back')) return undefined;
    const s = st(S);
    if (cardLive(S)) { const C = cardLayout(S, s.sel); if (inR({ x: C.bx, y: C.by, w: C.bw, h: C.bh }, x, y)) return 'pointer'; }
    return hitNode(mapLayout(S, mapPanes(S).main), x, y, S.hitR) ? 'pointer' : undefined;
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = s.lastT < 0 || Math.abs(S.t - s.lastT) > 0.35;   // salto (o captura): sin transición
    s.lastT = S.t;

    // ── la línea de tiempo ──
    if (S.between('tl-axis', 'q-intro')) {
      const tm = s.tm, y = clamp(Math.round(Number(S.drive('anio', demoYear(S)))), YEAR0, 2026);
      tm.year = y;
      tm.shown = jump ? y : tm.shown + (y - tm.shown) * (1 - Math.exp(-dt * 12));
      tm.forceEv = S.touched.has('anio');
      if (S.on('tl-1943')) EVENTS.forEach((e, i) => { if (e.year <= y && tm.marks[i] === undefined) tm.marks[i] = jump ? -1 : S.clock; });
      const ev = eventAt(y);
      if (ev !== tm.ev) { tm.ev = ev; tm.evAt = jump ? -1 : S.clock; }
      if (S.on('try-tl') && S.touched.has('anio')) {
        if (!s.seenEv.includes(ev)) s.seenEv.push(ev);
        if (s.seenEv.length >= 2) S.complete('timeline');
      }
    }

    // ── el mapa abierto ──
    if (S.on('map-back')) {
      if (S.touched.has('leccion')) { s.tap = 0; s.user = true; }   // si mueve el deslizador, manda el deslizador
      const n = clamp(Math.round(Number(S.drive('leccion', s.tap || demoLesson(S)))), 1, 36);
      if (n !== s.sel) { s.sel = n; s.selAt = jump ? -1 : S.clock; }
      if (S.on('try-map') && s.user) S.complete('map');
    }
  },

  render(S) {
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      S.d.withAlpha(a, () => v.draw(S));
      const src = v.src?.(S);
      if (src) provenance(S, src, a);
    }
  },
});

export default scene;
