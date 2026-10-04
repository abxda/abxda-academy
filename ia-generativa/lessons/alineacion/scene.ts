// Escena: De modelo base a asistente. Seis actos que se funden uno en otro:
//  1 · el modelo base (un documento que se completa) y la brecha         2 · ajuste con instrucciones (SFT) y el turno «base frente a asistente»
//  3 · preferencias y modelo de recompensa (turno: elige la mejor)       4 · refuerzo con retroalimentación humana, KL y Goodhart (turno: presión)
//  5 · DPO                                                               6 · adulación, rechazos y la capa de comportamiento
// Tres turnos: comparar un modelo base real con su asistente, entrenar un modelo de recompensa de juguete con tus elecciones
// y subir la presión de optimización hasta ver caer la calidad real. Cada turno se completa con S.complete(): 'compare', 'rm', 'opt'.
//
// REAL: las salidas de TinyLlama (outputs-data.ts), las cifras de InstructGPT (Ouyang et al. 2022) y del estudio de adulación (Sharma et al. 2023),
// y todo el cálculo del juguete (regresión logística de Bradley–Terry, óptimo con penalización KL, DPO). ILUSTRATIVO (rotulado en pantalla):
// los cuatro rasgos asignados a mano a cada respuesta, los pesos de partida, las 28 solicitudes de los rechazos y el esquema del caso de GPT-4o.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawBase } from './act-base';
import { drawSft } from './act-sft';
import { boardHit, drawPref } from './act-pref';
import { drawRl } from './act-rl';
import { drawDpo } from './act-dpo';
import { drawEnd } from './act-end';
import { phases } from './board';
import { S_BEST, choose, gains, pressure, resetPicks, st } from './state';

const HIT_TOL = 0.06;     // tolerancia (en posición del control) para «volver al máximo»
const OVERSHOT = 0.25;    // cuánto hay que pasarse del máximo para que cuente como «pasar del punto óptimo»

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: base frente a asistente ──
    { id: 'q', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, value: 1, from: 'compare-intro', to: 'compare-result',
      options: [{ value: 0, label: { es: 'Capital', en: 'Capital' } }, { value: 1, label: { es: 'Inflación', en: 'Inflation' } }, { value: 2, label: { es: 'Correo', en: 'Email' } }, { value: 3, label: { es: 'Dormir', en: 'Sleep' } }] },
    // ── turno 2: elegir la mejor respuesta (también se puede tocar la tarjeta) ──
    { id: 'pickA', kind: 'button', primary: true, label: { es: 'Elegir A', en: 'Choose A' }, from: 'try-rm', to: 'rm-reveal' },
    { id: 'pickB', kind: 'button', primary: true, label: { es: 'Elegir B', en: 'Choose B' }, from: 'try-rm', to: 'rm-reveal' },
    { id: 'again', kind: 'button', label: { es: 'Empezar de nuevo', en: 'Start over' }, from: 'try-rm', to: 'rm-reveal' },
    // ── turno 3: presión de optimización ──
    { id: 'press', kind: 'slider', label: { es: 'Presión de optimización', en: 'Optimization pressure' }, min: 0, max: 1, step: 0.01, value: 0, from: 'try-opt', to: 'dpo-problem',
      fmt: (v, l) => (l === 'es' ? 'presión ' : 'pressure ') + pressure(v).toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    // ── rechazos: el umbral ──
    { id: 'thr', kind: 'slider', label: { es: 'Umbral de rechazo (riesgo)', en: 'Refusal threshold (risk)' }, min: 0, max: 1, step: 0.01, value: 0.5, from: 'refuse', to: 'layer',
      fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  ],

  init(S) { S.st = {}; },

  action(S, id) {
    if (id === 'pickA') choose(S, 'A');
    else if (id === 'pickB') choose(S, 'B');
    else if (id === 'again') resetPicks(S);
  },

  pointer(S, e) {
    if (e.type !== 'down') return;
    const c = boardHit(S, e.x, e.y);
    if (c) choose(S, c);
  },
  cursor(S, x, y) { return boardHit(S, x, y) ? 'pointer' : undefined; },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S);
    // turno 1: ver al menos dos indicaciones distintas
    if (S.on('compare-intro')) {
      const q = clamp(Math.round(Number(S.p.q ?? 1)), 0, 3);
      if (s.q !== q) { s.q = q; s.qClock = S.clock; }
      if (!s.viewed.includes(q)) s.viewed.push(q);
      if (s.viewed.length >= 2) S.complete('compare');
    }
    // turno 2: los pesos mostrados siguen a los aprendidos (la elección en sí la registra choose())
    const k = 1 - Math.exp(-Math.min(0.1, S.dt) * 9);
    for (let i = 0; i < 4; i++) s.wShown[i] += (s.w[i] - s.wShown[i]) * (S.dt > 0 ? k : 1);
    if (S.dt === 0) for (let i = 0; i < 4; i++) s.wShown[i] = s.w[i];
    // turno 3: pasarse del punto óptimo y volver a él
    if (S.on('try-opt')) {
      const target = clamp(Number(S.p.press ?? 0));
      s.sShown += (target - s.sShown) * (S.dt > 0 ? 1 - Math.exp(-Math.min(0.1, S.dt) * 12) : 1);
      if (S.dt === 0) s.sShown = target;
      s.sMax = Math.max(s.sMax, s.sShown);
      const gold = gains(pressure(target)).gold;
      s.goldBest = Math.max(s.goldBest, gold);
      if (target >= S_BEST + OVERSHOT) s.overshot = true;
      if (s.overshot && Math.abs(target - S_BEST) <= HIT_TOL) { s.bestHit = true; S.complete('opt'); }
    }
    // rechazos: ¿la persona movió el umbral?
    if (S.on('refuse') && Math.abs(Number(S.p.thr ?? 0.5) - 0.5) > 1e-6) s.thrOwn = true;
  },

  render(S: Frame) {
    phases(S, [
      { from: 'hook', draw: drawBase },
      { from: 'sft-idea', draw: drawSft },
      { from: 'pref-idea', draw: drawPref },
      { from: 'rl-idea', draw: drawRl },
      { from: 'dpo-problem', draw: drawDpo },
      { from: 'syco', draw: drawEnd },
    ], null, 0.9);
  },
});

export default scene;
