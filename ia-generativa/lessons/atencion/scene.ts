// Escena: Atención. La frase y el pronombre, consultas/claves/valores con números pequeños (calculados en vivo),
// la raíz de d, el mapa de atención, varias cabezas (reales, de BERT), límites y puente hacia el transformer.
import { clamp, type PointerEvt, type SceneFactory } from '../../../../../theme/kit';
import { drawSentence } from './act-sentence';
import { drawQKV, newQState, qLayout, qPlot, type QState } from './act-qkv';
import { drawAll } from './act-map';
import { drawCost, drawOrigin, drawParallel } from './act-flow';
import { HEAD_ORDER, drawFew, drawFlip, drawHeadsMaps, drawHeadsWhy, headsLayout, newHeadsState, type HeadsState } from './act-heads';
import { gridGeom } from './act-map';
import { REAL } from './real-data';
import { drawBridge, drawRecap } from './act-close';
import { drawCausal, drawExplain, drawOrder } from './act-limits';
import { drawSqrt, newSqrtState, updateSqrt } from './act-sqrt';
import { DIMS, attend, I, snapQ, warmDemo, type V2 } from './data';

const qOf = (S: import('../../../../../theme/kit').Frame): QState => (S.st.q ??= newQState());
const hdOf = (S: import('../../../../../theme/kit').Frame): HeadsState => (S.st.hd ??= newHeadsState());
/** Cambia de cabeza (con un fundido corto del mapa grande). */
function pickHead(S: import('../../../../../theme/kit').Frame, i: number) { const hd = hdOf(S); hd.touched = true; if (i === hd.head) return; hd.prev = hd.head; hd.head = i; hd.t0 = S.clock; }
const inTry1 = (S: import('../../../../../theme/kit').Frame) => S.between('try1', 'sqrt-why');

const scene: SceneFactory = () => ({
  controls: [
    { id: 'qL', kind: 'button', label: { es: 'Consulta ←', en: 'Query ←' }, from: 'try1', to: 'sqrt-why' },
    { id: 'qR', kind: 'button', label: { es: 'Consulta →', en: 'Query →' }, from: 'try1', to: 'sqrt-why' },
    { id: 'qU', kind: 'button', label: { es: 'Consulta ↑', en: 'Query ↑' }, from: 'try1', to: 'sqrt-why' },
    { id: 'qD', kind: 'button', label: { es: 'Consulta ↓', en: 'Query ↓' }, from: 'try1', to: 'sqrt-why' },
    { id: 'qReset', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try1', to: 'sqrt-why' },
    { id: 'dIdx', kind: 'slider', label: { es: 'Dimensión d', en: 'Dimension d' }, min: 1, max: 9, step: 1, value: 3, from: 'try2', to: 'all', fmt: (v) => String(DIMS[Math.round(v) - 1]) },
    { id: 'div', kind: 'toggle', label: { es: 'Dividir entre √d', en: 'Divide by √d' }, value: true, from: 'try2', to: 'all' },
    { id: 'hPrev', kind: 'button', label: { es: '← Cabeza', en: '← Head' }, from: 'try3', to: 'real-flip' },
    { id: 'hNext', kind: 'button', label: { es: 'Cabeza →', en: 'Head →' }, from: 'try3', to: 'real-flip' },
    { id: 'wPrev', kind: 'button', label: { es: '← Palabra', en: '← Word' }, from: 'try3', to: 'real-flip' },
    { id: 'wNext', kind: 'button', label: { es: 'Palabra →', en: 'Word →' }, from: 'try3', to: 'real-flip' },
  ],

  init(S) { S.st.q = newQState(); S.st.sq = newSqrtState(); S.st.hd = newHeadsState(); warmDemo(); },

  action(S, id) {
    if (id === 'hPrev' || id === 'hNext' || id === 'wPrev' || id === 'wNext') {
      const hd = hdOf(S);
      if (id[0] === 'h') pickHead(S, (hd.head + (id === 'hNext' ? 1 : 3)) % 4); else { hd.word = (hd.word + (id === 'wNext' ? 1 : 11)) % 12; hd.touched = true; }
      return;
    }
    const st = qOf(S);
    if (id === 'qReset') { S.st.q = newQState(); return; }
    const dx = id === 'qL' ? -0.5 : id === 'qR' ? 0.5 : 0, dy = id === 'qD' ? -0.5 : id === 'qU' ? 0.5 : 0;
    st.q = snapQ(st.q[0] + dx, st.q[1] + dy); st.moved = true;
  },

  pointer(S, e: PointerEvt) {
    if (S.between('try3', 'real-flip')) {
      if (e.type !== 'down') return;
      const L = headsLayout(S), hd = hdOf(S), hit = L.thumbs.findIndex((r) => e.x >= r.x - 6 && e.x <= r.x + r.w + 6 && e.y >= r.y - 6 && e.y <= r.y + r.h + L.lab);
      if (hit >= 0) { pickHead(S, hit); return; }
      const G = gridGeom(S, L.map, REAL[S.lang].words.heavy), row = Math.floor((e.y - G.y) / G.cs);
      if (e.x >= L.map.x && e.x <= G.x + G.n * G.cs + 4 && row >= 0 && row < G.n) { hd.word = row; hd.touched = true; }
      return;
    }
    if (!inTry1(S)) return;
    const st = qOf(S), plot = qPlot(S, qLayout(S));
    if (e.type === 'down') {
      if (plot.inside(e.x, e.y)) { st.drag = true; st.moved = true; st.q = snapQ(plot.iX(e.x), plot.iY(e.y)); }
    } else if (e.type === 'move') {
      if (st.drag) st.q = snapQ(plot.iX(clamp(e.x, plot.r.x, plot.r.x + plot.r.w)), plot.iY(clamp(e.y, plot.r.y, plot.r.y + plot.r.h)));
    } else st.drag = false;
  },

  cursor(S, x, y) {
    if (S.between('try3', 'real-flip')) {
      const L = headsLayout(S), G = gridGeom(S, L.map, REAL[S.lang].words.heavy);
      if (L.thumbs.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) return 'pointer';
      return x >= L.map.x && x <= G.x + G.n * G.cs && y >= G.y && y <= G.y + G.n * G.cs ? 'pointer' : undefined;
    }
    if (!inTry1(S)) return undefined;
    const st = qOf(S), plot = qPlot(S, qLayout(S));
    if (st.drag) return 'grabbing';
    return plot.inside(x, y) ? (Math.hypot(x - plot.X(st.qs[0]), y - plot.Y(st.qs[1])) < S.hitR + 6 ? 'grab' : 'crosshair') : undefined;
  },

  // El estado interactivo avanza siempre, aunque el escenario no se vea; render() solo dibuja.
  update(S) {
    const st = qOf(S);
    const k = 1 - Math.exp(-S.dt * 14);
    st.qs = [st.qs[0] + (st.q[0] - st.qs[0]) * k, st.qs[1] + (st.q[1] - st.qs[1]) * k] as V2;
    if (inTry1(S) && attend(st.q).w[I.robot] > 0.5) S.complete('q');
    updateSqrt(S);
    const hd = hdOf(S);
    if (S.between('try3', 'real-flip') && hd.word === REAL[S.lang].query && HEAD_ORDER[hd.head] === 'ref') S.complete('head');
  },

  render(S) {
    drawSentence(S);
    drawQKV(S);
    drawSqrt(S);
    drawAll(S);
    drawOrigin(S);
    drawParallel(S);
    drawCost(S);
    drawHeadsWhy(S);
    drawHeadsMaps(S);
    drawFlip(S);
    drawFew(S);
    drawExplain(S);
    drawOrder(S);
    drawCausal(S);
    drawRecap(S);
    drawBridge(S);
  },
});

export default scene;
