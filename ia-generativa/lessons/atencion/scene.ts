// Escena: Atención. Dos frases con «banco» (el problema), a quién mirar y cuánto (sin símbolos), un buscador como
// analogía de consulta/clave/valor, las cuentas con números pequeños (ejemplo hecho a mano, calculado en vivo), el mapa
// de atención, la fórmula como resumen y la raíz de d, varias cabezas con mapas reales de BERT, todos a la vez frente a
// la red recurrente, y el cierre. La escena hace sola cada demostración (recorre tokens y cabezas con setTok/setHead
// mientras nadie toque); los «tu turno» son opcionales y solo cuentan lo que hace la persona (S.touched).
// Todo se anima por fracciones de cada segmento (fr), así sigue a la voz en cualquier idioma. Cada vista se adapta al
// teléfono vertical (S.portrait), al teléfono en horizontal (isShort) y al escritorio.
import { type Frame, type PointerEvt, type SceneFactory } from '../../../../../theme/kit';
import { A, type Lang } from './data';
import { freshSt, setHead, setTok, stOf } from './state';
import { dur, fr } from './ui';
import { drawSent } from './v-sent';
import { drawSearch } from './v-search';
import { drawCalc } from './v-calc';
import { drawMap, mapGeo } from './v-map';
import { drawForm } from './v-form';
import { drawHeads, hitThumb } from './v-heads';
import { drawFlow } from './v-flow';
import { drawClose } from './v-close';

/** Vistas: cada una empieza en un segmento y dura hasta que empieza la siguiente. */
const VIEWS: [string, (S: Frame) => void][] = [
  ['hook', drawSent], ['search', drawSearch], ['three', drawCalc], ['all', drawMap],
  ['formula', drawForm], ['heads', drawHeads], ['rnn', drawFlow], ['recap', drawClose],
];

/** Fracción transcurrida del segmento k (0..1). */
const frac = (S: Frame, k: string) => Math.max(0, Math.min(1, (S.t - S.start(k)) / dur(S, k)));
const inMap = (S: Frame) => S.between('map-demo', 'formula');
const inHeads = (S: Frame) => S.between('head-others', 'rnn');

/** Fila del mapa (o ficha de la frase) bajo el puntero. */
function hitTok(S: Frame, x: number, y: number): number {
  const M = mapGeo(S), G = M.G;
  const row = Math.floor((y - G.y) / G.cs);
  if (row >= 0 && row < G.n && x >= G.x - G.lw && x <= G.x + G.m * G.cs) return row;
  return M.chips.findIndex((r) => x >= r.x - 3 && x <= r.x + r.w + 3 && y >= r.y - 6 && y <= r.y + r.h + 6);
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'tok', kind: 'button', primary: true, label: { es: 'Otro token', en: 'Next token' }, from: 'map-demo', to: 'formula' },
    { id: 'head', kind: 'button', primary: true, label: { es: 'Otra cabeza', en: 'Next head' }, from: 'head-others', to: 'rnn' },
  ],

  init(S) { S.st.a = freshSt(); },

  action(S, id) {
    const st = stOf(S);
    if (id === 'tok') { setTok(S, (st.tok + 1) % A[S.lang as Lang].tok.length); st.tokSeen.add(st.tok); }
    if (id === 'head') { setHead(S, (st.head + 1) % 4); st.headSeen.add(st.head); }
  },

  pointer(S, e: PointerEvt) {
    if (e.type !== 'down') return;
    const st = stOf(S);
    if (inMap(S)) { const i = hitTok(S, e.x, e.y); if (i >= 0) { S.touched.add('tok'); setTok(S, i); st.tokSeen.add(i); } }
    if (inHeads(S)) { const i = hitThumb(S, e.x, e.y); if (i >= 0) { S.touched.add('head'); setHead(S, i); st.headSeen.add(i); } }
  },

  cursor(S, x, y) {
    if (inMap(S) && hitTok(S, x, y) >= 0) return 'pointer';
    if (inHeads(S) && hitThumb(S, x, y) >= 0) return 'pointer';
    return undefined;
  },

  // Demostraciones guiadas (la escena elige token y cabeza mientras la persona no toque) y comprobación de los «tu turno».
  update(S) {
    const st = stOf(S);
    if (S.between('all', 'formula') && !S.touched.has('tok')) {
      let t = 4;   // «banco»
      if (S.on('map-demo')) { const f = frac(S, 'map-demo'); t = f < 0.22 ? 4 : f < 0.47 ? 7 : f < 0.72 ? 0 : 1; }   // banco → jardín → me → senté
      if (S.on('try-map')) t = 1;
      setTok(S, t);
    }
    if (S.between('try-map', 'formula') && S.touched.has('tok') && st.tokSeen.size > 0) S.complete('tok');
    if (S.between('heads', 'rnn') && !S.touched.has('head')) {
      let h = 0;   // la cabeza de «banco»
      if (S.on('head-others')) { const f = frac(S, 'head-others'); h = f < 0.12 ? 0 : f < 0.42 ? 1 : f < 0.7 ? 2 : 3; }   // anterior → siguiente → marcas
      if (S.on('try-heads')) h = 3;
      if (S.on('honest')) h = 0;
      setHead(S, h);
    }
    if (S.between('try-heads', 'rnn') && S.touched.has('head') && st.headSeen.size > 0) S.complete('head');
  },

  render(S) {
    for (let i = 0; i < VIEWS.length; i++) {
      const [start, draw] = VIEWS[i], next = VIEWS[i + 1]?.[0];
      if (!S.on(start)) break;
      const aIn = i === 0 ? 1 : fr(S, start, 0, 0.07), aOut = next ? 1 - fr(S, next, 0, 0.05) : 1;
      const a = aIn * aOut;
      if (a > 0.01) S.d.withAlpha(a, () => draw(S));
    }
  },
});

export default scene;
