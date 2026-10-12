// Escena: Generar es aprender una distribución.
// Clasificar frente a generar con un siete concreto; la nube de los sietes medidos con dos números (tinta arriba y abajo)
// para ver qué es una distribución y qué es muestrear; un autocodificador y un VAE REALES (diminutos, entrenados offline
// con train_toy.py; aquí solo se ejecutan) presentados pieza por pieza; el paseo por el espacio latente; los huecos del
// autocodificador y las nubes del VAE que los rellenan; la comparación del muestreo y el «no es collage».
// La escena hace sola cada demostración (saca puntos nuevos, recorre el plano moviendo su deslizador con S.drive): quien
// solo mira entiende todo; quien quiere, toma el control. Todo se anima por fracciones de cada segmento (fr).
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import * as L from './latent';
import { fr } from './helpers';
import { explorerZ, resetSt, stOf } from './state';
import { drawCloud, drawIntro, drawPix, drawSevens } from './views1';
import { drawAE, drawMap, drawTrain, mapLayout } from './views2';
import { drawBlur, drawBridge, drawCollage, drawCompare, drawRecap, drawVae } from './views3';

/** Vistas de la escena y el segmento con el que empieza cada una. */
const VIEWS: [string, string, (S: Frame) => void][] = [
  ['intro', 'hook', drawIntro], ['sevens', 'question', drawSevens], ['cloud', 'measure-top', drawCloud], ['pix', 'independent', drawPix],
  ['ae', 'idea', drawAE], ['train', 'training', drawTrain], ['map', 'latent-plane', drawMap], ['vae', 'vae-idea', drawVae],
  ['compare', 'compare', drawCompare], ['collage', 'collage-q', drawCollage], ['blur', 'blurry', drawBlur], ['recap', 'recap', drawRecap], ['bridge', 'bridge', drawBridge],
];
const viewAt = (S: Frame, seg: number) => { let v = 0; VIEWS.forEach(([, id], i) => { if (seg >= S.segIndex(id)) v = i; }); return v; };
const canWalk = (S: Frame) => S.between('walk-demo', 'generate-ae');

const scene: SceneFactory = () => ({
  controls: [
    { id: 'more', kind: 'button', primary: true, label: { es: 'Sacar un punto nuevo', en: 'Draw a new point' }, from: 'sample', to: 'not-image' },
    { id: 'walk', kind: 'slider', label: { es: 'Recorrido por el plano', en: 'Walk across the plane' }, min: 0, max: 100, step: 1, value: 0, from: 'walk-demo', to: 'generate-ae', fmt: (v) => `${Math.round(v)} %` },
  ],

  init(S) { resetSt(S); },

  action(S, id) {
    if (id !== 'more') return;
    const st = stOf(S);
    st.presses.push(S.clock);
    if (st.presses.length >= 3) S.complete('sample');
  },

  // Demostración guiada del paseo (mueve el deslizador mientras nadie lo toque) y comprobación del «tu turno».
  update(S) {
    const st = stOf(S);
    if (S.between('latent-plane', 'generate-ae')) {
      let v = 0;
      if (S.on('walk-demo')) v = 3 * fr(S, 'walk-demo', 0.35, 1, 'io');
      if (S.on('walk-smooth')) v = 3 + 97 * fr(S, 'walk-smooth', 0.02, 0.9, 'lin');
      st.wf = v;
      S.drive('walk', Math.round(v));
    }
    if (canWalk(S)) {
      const byHand = S.touched.has('walk') || S.touched.has('walkdrag');
      if (S.touched.has('walk') && S.p.walk !== st.lastWalk) { if (st.lastWalk >= 0) st.z = null; st.lastWalk = S.p.walk; }
      if (byHand) {
        const z = explorerZ(S), key = `${z[0].toFixed(2)},${z[1].toFixed(2)}`;
        if (key !== st.lastSeen) { st.lastSeen = key; const rd = L.readDigit(L.decAE(z[0], z[1])); if (rd.p >= 0.8) st.found[rd.digit] = true; }
        if (st.found.filter(Boolean).length >= 3) S.complete('walk');
      }
    }
  },

  // Arrastrar el punto por el plano (opcional; en táctil, solo con el «tu turno» abierto para no estorbar al desplazarse).
  pointer(S, e) {
    if (!canWalk(S) || (S.coarse && !S.free)) return;
    const st = stOf(S), { plot } = mapLayout(S), r = plot.r, h = S.hitR, B = L.AE_BOX;
    const inside = e.x >= r.x - h && e.x <= r.x + r.w + h && e.y >= r.y - h && e.y <= r.y + r.h + h;
    if (e.type === 'down' && inside) { st.drag = true; S.touched.add('walkdrag'); }
    if ((e.type === 'down' || e.type === 'move') && st.drag) st.z = [clamp(plot.iX(e.x), B.x0, B.x1), clamp(plot.iY(e.y), B.y0, B.y1)];
    if (e.type === 'up' || e.type === 'leave') st.drag = false;
  },
  cursor(S, x, y) {
    if (!canWalk(S)) return undefined;
    const st = stOf(S), r = mapLayout(S).plot.r;
    if (st.drag) return 'grabbing';
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h ? 'crosshair' : undefined;
  },

  render(S) {
    const v = viewAt(S, S.seg), first = VIEWS[v][1];
    const f = S.seg > 0 && S.seg === S.segIndex(first) ? fr(S, first, 0, 0.12, 'io') : 1;
    if (f < 1) { const pv = viewAt(S, S.seg - 1); if (pv !== v) S.d.withAlpha(1 - f, () => VIEWS[pv][2](S)); }
    S.d.withAlpha(f, () => VIEWS[v][2](S));
  },
});

export default scene;
