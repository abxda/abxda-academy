// Escena: De modelo base a asistente. Seis actos que se funden uno en otro:
//  1 · el modelo base (un documento que se completa) y la brecha         2 · ajuste con instrucciones (SFT) y el turno «base frente a asistente»
//  3 · preferencias y modelo de recompensa (turno: elige la mejor)       4 · refuerzo con retroalimentación humana, KL y Goodhart (turno: presión)
//  5 · DPO                                                               6 · adulación, rechazos y la capa de comportamiento
// Tres turnos: comparar un modelo base real con su asistente, entrenar un modelo de recompensa de juguete con tus elecciones
// y subir la presión de optimización hasta ver caer la calidad real.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawBase } from './act-base';
import { drawSft } from './act-sft';
import { st } from './state';

/** Funde un acto con el siguiente: visible desde `from` hasta `next`. */
const win = (S: Frame, from: string | null, next: string | null) => (from ? S.at(from, 0, 0.9) : 1) * (next ? 1 - S.at(next, 0, 0.9) : 1);

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: base frente a asistente ──
    { id: 'q', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, value: 1, from: 'compare-intro', to: 'compare-result',
      options: [{ value: 0, label: { es: 'Capital', en: 'Capital' } }, { value: 1, label: { es: 'Inflación', en: 'Inflation' } }, { value: 2, label: { es: 'Correo', en: 'Email' } }, { value: 3, label: { es: 'Dormir', en: 'Sleep' } }] },
  ],

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S);
    if (S.on('compare-intro')) {
      const q = clamp(Math.round(Number(S.p.q ?? 1)), 0, 3);
      if (s.q !== q) { s.q = q; s.qClock = S.clock; }
      if (!s.viewed.includes(q)) s.viewed.push(q);
      if (s.viewed.length >= 2) S.complete('compare');
    }
  },

  render(S) {
    const d = S.d;
    const aBase = win(S, null, 'sft-idea'), aSft = win(S, 'sft-idea', 'pref-idea');
    if (aBase > 0.005) d.withAlpha(aBase, () => drawBase(S));
    if (aSft > 0.005) d.withAlpha(aSft, () => drawSft(S));
  },
});

export default scene;
