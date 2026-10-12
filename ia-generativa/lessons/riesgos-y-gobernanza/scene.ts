// Escena: Riesgos y gobernanza. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al empezar
// la siguiente):
//  1 · un sistema que acierta también puede dañar                                                  (hook)
//  2 · el mapa del asistente de la tienda de bicicletas (lecciones 31 y 32): sus caminos; lo que sale (fuga de
//      información); lo que entra (inyección de instrucciones); la tríada letal, con su «tu turno» (quitar un
//      ingrediente); la regla de permisos                                                          (map … agent-rule)
//  3 · quien escribe: la línea de rechazo y el jailbreak                                           (jb, jb-how)
//  4 · lo que aprendió: «mecánico» en los embeddings, los currículos y Gender Shades                (bias-recall … bias-shades-2)
//  5 · de quién es el texto: lo que entra y lo que sale                                            (ip-in, ip-out)
//  6 · fuera del sistema: la llamada con voz falsa, la videollamada falsa y el otro canal          (fake-voice … fake-control)
//  7 · la huella ambiental: una consulta y el total de los centros de datos                        (env-one … env-control)
//  8 · quién responde                                                                              (accountable)
//  9 · el cuadro de probabilidad por impacto: ejes, zonas, casos, controles, «tu turno» (elegir un caso) y riesgo
//      residual                                                                                    (two-q … residual)
// 10 · gobernanza: cuatro piezas · 11 · el Reglamento de IA de la UE: niveles y calendario · 12 · NIST e ISO/IEC 42001
//      · repaso y puente                                                                           (gov-def … bridge)
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive); es opcional y solo cuenta lo que
// hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento (ui.ts: fr, win).
//
// REAL (procedencia al pie): Samsung (prensa, 2023), OWASP (2025), CVE-2025-32711, Willison (2022, 2025), Gender Shades
// (2018), Oficina de Derechos de Autor de EE. UU. (2025), FCC 24-104 (2024), Arup (The Guardian, 2024), Google (2025),
// AIE (2025), Air Canada (2024), Reglamento (UE) 2024/1689 y 2026/1744, NIST AI RMF (2023), ISO/IEC 42001 (2023).
// ILUSTRATIVO (rotulado): la tienda y su asistente, el correo con texto oculto, la línea de rechazo, las posiciones en los
// embeddings, el orden de los currículos, los cinco casos del cuadro y dónde caen, y sus controles.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { demoQuitar, drawHook, drawMap, mapSource, type Quitar } from './v-map';
import { drawBias, drawIP, drawJailbreak, riskSource } from './v-risks';
import { drawAccount, drawEnv, drawFakes, worldSource } from './v-world';
import { CASES, demoCase, drawMatrix, matrixSource } from './v-matrix';
import { drawAct, drawBridge, drawGov, drawRecap, drawStandards, rulesSource } from './v-rules';
import { provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'map', draw: drawHook },
  { from: 'map', to: 'jb', draw: drawMap, src: mapSource },
  { from: 'jb', to: 'bias-recall', draw: drawJailbreak, src: riskSource },
  { from: 'bias-recall', to: 'ip-in', draw: drawBias, src: riskSource },
  { from: 'ip-in', to: 'fake-voice', draw: drawIP, src: riskSource },
  { from: 'fake-voice', to: 'env-one', draw: drawFakes, src: worldSource },
  { from: 'env-one', to: 'accountable', draw: drawEnv, src: worldSource },
  { from: 'accountable', to: 'two-q', draw: drawAccount, src: worldSource },
  { from: 'two-q', to: 'gov-def', draw: drawMatrix, src: matrixSource },
  { from: 'gov-def', to: 'aiact', draw: drawGov, src: rulesSource },
  { from: 'aiact', to: 'standards', draw: drawAct, src: rulesSource },
  { from: 'standards', to: 'recap', draw: drawStandards, src: rulesSource },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

interface St { q: Quitar; qAt?: number; caso?: string; casoAt?: number }
const st = (S: Frame): St => (S.st.rg ??= { q: 'send' }) as St;

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: quitar un ingrediente de la tríada letal ──
    {
      id: 'quitar', kind: 'choice', label: { es: 'Quitar', en: 'Remove' }, value: 'none', from: 'trifecta-demo', to: 'agent-rule',
      options: [
        { value: 'none', label: { es: 'Nada', en: 'Nothing' } },
        { value: 'data', label: { es: 'Datos privados', en: 'Private data' } },
        { value: 'ext', label: { es: 'Correos de extraños', en: 'Strangers’ emails' } },
        { value: 'send', label: { es: 'Enviar hacia fuera', en: 'Sending out' } },
      ],
    },
    // ── turno 2: elegir un caso en el cuadro de riesgo ──
    {
      id: 'caso', kind: 'choice', label: { es: 'Caso', en: 'Case' }, value: 'garantia', from: 'place-1', to: 'gov-def',
      options: CASES.map((c) => ({ value: c.id, label: c.short })),
    },
  ],

  init(S) { S.st = {}; },

  // Estado interactivo: avanza siempre; render() solo lo lee.
  update(S) {
    const s = st(S);
    if (S.between('trifecta-demo', 'agent-rule')) {
      const q = S.drive('quitar', demoQuitar(S)) as Quitar;
      if (q !== s.q) { s.q = q; s.qAt = S.clock; }
      if (S.on('try-trifecta') && S.touched.has('quitar')) S.complete('trifecta');
    }
    if (S.between('place-1', 'gov-def')) {
      const c = S.drive('caso', demoCase(S)) as string;
      if (c !== s.caso) { s.caso = c; s.casoAt = S.clock; }   // el panel del caso entra con un fundido corto
      if (S.on('try-matrix') && S.touched.has('caso')) S.complete('matrix');
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
