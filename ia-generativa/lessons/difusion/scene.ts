// Escena: Difusión, de ruido a imagen.
// Un siete de 8×8 se ensucia con ruido paso a paso (proceso hacia delante, con su barra y su calendario); por qué no se puede regresar
// de un salto y sí en pasos pequeños; la red que estima el ruido, pieza por pieza, y cómo se entrena; el regreso completo en píxeles;
// el regreso paso a paso en el plano de códigos del VAE de la lección 15 (con flechas); el guiado sin clasificador; la difusión latente.
// Dos modelos REALES diminutos (train_toy.py → models.json → models.ts) corren en el navegador: nada está simulado.
// La escena hace sola cada demostración (mueve sus deslizadores con S.drive); los «tu turno» son opcionales y solo cuentan lo que hizo
// la persona (S.touched). Todo se anima por fracciones de cada segmento (fr), para seguir a la voz en cualquier idioma.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { T } from './models';
import { fr } from './helpers';
import { SCALE_DEMO, guidedJob, newSt, stOf, unc } from './state';
import { drawEnds, drawJump, drawPixView } from './v-pixels';
import { drawNet, drawRev } from './v-net';
import { drawPlane } from './v-plane';
import { drawBridge, drawHist, drawLatent, drawRecap, drawSD } from './v-end';

/** Vistas de la escena y el segmento con el que empieza cada una. */
const VIEWS: [string, string, (S: Frame) => void][] = [
  ['pix', 'hook', drawPixView], ['ends', 'same-end', drawEnds], ['jump', 'jump-q', drawJump], ['net', 'net-in1', drawNet],
  ['rev', 'reverse-pixels', drawRev], ['plane', 'plane-intro', drawPlane], ['latent', 'latent-what', drawLatent], ['sd', 'sd', drawSD],
  ['hist', 'history', drawHist], ['recap', 'recap', drawRecap], ['bridge', 'bridge', drawBridge],
];
const viewAt = (S: Frame, seg: number) => { let v = 0; VIEWS.forEach(([, id], i) => { if (seg >= S.segIndex(id)) v = i; }); return v; };
const fmt1 = (v: number) => v.toFixed(1);

const scene: SceneFactory = () => ({
  controls: [
    { id: 'fwd', kind: 'slider', label: { es: 'Paso del ruido', en: 'Noise step' }, min: 0, max: T, step: 1, value: 0, from: 'fwd-demo', to: 'same-end', fmt: (v) => `${Math.round(v)} / ${T}` },
    { id: 'rev', kind: 'slider', label: { es: 'Paso de regreso', en: 'Step back' }, min: 0, max: T, step: 1, value: 0, from: 'plane-rev-demo', to: 'plane-match', fmt: (v) => `${Math.round(v)} / ${T}` },
    { id: 'scale', kind: 'slider', label: { es: 'Escala de guiado', en: 'Guidance scale' }, min: 0, max: 5, step: 0.5, value: 0, from: 'scale-demo', to: 'latent-what', fmt: fmt1 },
  ],

  init(S) { S.st.s = newSt(); },

  update(S) {
    const st = stOf(S);
    // ── proceso hacia delante: el deslizador avanza solo (y otra vez con la barra); en «tu turno» queda en el paso 25 ──
    if (S.between('fwd-demo', 'same-end')) {
      // viene del paso 50 (la tira): regresa al 0 con una animación corta y luego avanza
      let v = fr(S, 'fwd-demo', 0.12, 0.121) > 0 ? T * fr(S, 'fwd-demo', 0.14, 0.86, 'lin') : T * (1 - fr(S, 'fwd-demo', 0, 0.1, 'io'));
      if (S.on('mix-bar')) { const back = fr(S, 'mix-bar', 0, 0.1, 'io'), go = fr(S, 'mix-bar', 0.22, 0.92, 'lin'); v = go > 0 ? T * go : T * (1 - back); }
      if (S.on('schedule')) v = T;
      if (S.on('try-fwd')) v = T - (T - 25) * fr(S, 'try-fwd', 0.02, 0.2, 'io');
      S.drive('fwd', Math.round(v));
    }
    if (S.between('try-fwd', 'same-end') && S.touched.has('fwd') && (S.p.fwd ?? 0) >= T - 5) { st.fwdHi = true; S.complete('fwd'); }

    // ── el regreso en el plano: se calcula por partes desde antes de necesitarlo ──
    if (S.on('reverse-pixels') && !S.on('latent-what')) {
      const j = unc();
      if (S.on('plane-start')) j.finish(); else if (!j.done) j.advance(2);
    }
    if (S.between('plane-rev-demo', 'plane-match')) S.drive('rev', S.on('try-rev') ? T : Math.round(T * fr(S, 'plane-rev-demo', 0.06, 0.9, 'lin')));
    if (S.between('try-rev', 'plane-match') && S.touched.has('rev')) {
      const v = S.p.rev ?? 0;
      if (v <= 5) st.revLo = true;
      if (v >= T - 5) st.revHi = true;
      if (st.revLo && st.revHi) S.complete('rev');
    }

    // ── guiado: las nubes de la demostración (escala 0, 1 y 5) se calculan durante la explicación ──
    if (S.on('hint-q') && !S.on('latent-what')) {
      for (const s of SCALE_DEMO) { const j = guidedJob(s); if (S.on('scale-demo')) j.finish(); else if (!j.done) { j.advance(2); break; } }
    }
    if (S.between('scale-demo', 'latent-what')) {
      if (!S.touched.has('scale')) {
        let v = SCALE_DEMO[0];
        if (S.is('scale-demo')) { if (fr(S, 'scale-demo', 0.32, 0.321) > 0) v = SCALE_DEMO[1]; if (fr(S, 'scale-demo', 0.62, 0.621) > 0) v = SCALE_DEMO[2]; }
        else v = SCALE_DEMO[2];
        S.drive('scale', v);
      } else {
        const s = S.p.scale ?? 0;
        if (s !== st.lastScale) { st.lastScale = s; st.regenAt = S.clock; }
        guidedJob(s).advance(3);
        if (s <= 1) st.scLo = true;
        if (s >= 3) st.scHi = true;
        if (st.scLo && st.scHi) S.complete('scale');
      }
    }
    // la vista de la difusión latente usa el muestreo con escala 1 (ya calculado)
    if (S.on('latent-what') && !S.on('sd')) guidedJob(1).finish();
  },

  render(S) {
    const v = viewAt(S, S.seg), first = VIEWS[v][1];
    const f = S.seg > 0 && S.seg === S.segIndex(first) ? fr(S, first, 0, 0.1, 'io') : 1;
    if (f < 1) { const pv = viewAt(S, S.seg - 1); if (pv !== v) S.d.withAlpha(1 - f, () => VIEWS[pv][2](S)); }
    S.d.withAlpha(f, () => VIEWS[v][2](S));
    void S.portrait;
  },
});

export default scene;
