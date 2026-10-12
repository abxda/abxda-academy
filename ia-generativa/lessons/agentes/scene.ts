// Escena: Agentes y herramientas. Vistas que se funden una en otra (cada una entra al empezar su segmento y sale al
// empezar la siguiente):
//  1 · hablar no es actuar: el pedido de boletos, el modelo que solo escribe            (hook … cant-know)
//  2 · el agente por dentro: herramientas, descripción en el contexto, llamada a función, el programa que ejecuta y
//      pega el resultado, la segunda vuelta, el bucle con nombre, el agente y ReAct      (tool-def … react)
//  3 · plan y memoria: el plan en el contexto, lo que relee cada vuelta, notas fuera     (plan … memory-out)
//  4 · MCP: de 3 × 4 conexiones a la medida a un estándar común                          (mcp-problem, mcp)
//  5 · los errores se acumulan: la compra en pasos; cien intentos con uno y dos pasos    (risk … two-steps)
//  6 · el simulador: veinte intentos, el contador, la gráfica 0.95ⁿ; «tu turno» con los pasos (sim-intro … caveat)
//  7 · τ-bench (real) · 8 · revisión humana cada cinco pasos; «tu turno» con la revisión  (real; review-idea … try-review)
//  9 · lo que no se deshace · 10 · el caso Replit · 11 · ruego o permiso, persona en el bucle y la compra equivocada;
//      «tu turno»: aprobar o rechazar · 12 · niveles de autonomía · 13 · cómo empezar · repaso y puente.
// Cada «tu turno» va precedido de una demostración que mueve sola el control (S.drive) o hace sola la acción; es opcional
// y solo cuenta lo que hizo la persona (S.touched). Las animaciones van por fracciones de la duración de cada segmento.
//
// REAL: ReAct (Yao et al. 2022), MCP (Anthropic 2024), τ-bench (Yao et al. 2024), el caso Replit (The Register 2025).
// SIMULACIÓN REAL con supuestos rotulados (sim.ts): 95 % por paso, errores independientes, quien revisa detecta 9 de 10.
// ILUSTRATIVO (rotulado): la compra de boletos, las herramientas, la cartelera, las respuestas, las conexiones de MCP.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { MAXN } from './sim';
import { drawIntro } from './v-intro';
import { drawAgent } from './v-agent';
import { drawBridge, drawMcp, drawMemory, drawRecap } from './v-end';
import { drawReal, drawReview, drawSim, drawSteps } from './v-chain';
import { drawIncident, drawIrreversible, drawLevels, drawPerm, drawStart, permButtons } from './v-safety';
import { fr, provenance, win } from './ui';

interface View { from: string; to?: string; draw: (S: Frame) => void; src?: (S: Frame) => string }
const VIEWS: View[] = [
  { from: 'hook', to: 'tool-def', draw: drawIntro, src: (S) => S.l('Respuesta ilustrativa', 'Illustrative answer') },
  { from: 'tool-def', to: 'plan', draw: drawAgent, src: (S) => (S.on('react') ? S.l('ReAct: Yao y colaboradores (2022) · ejemplo ilustrativo', 'ReAct: Yao and colleagues (2022) · illustrative example') : S.l('Ejemplo ilustrativo: herramientas, cartelera y respuestas inventadas', 'Illustrative example: made-up tools, listings, and answers')) },
  { from: 'plan', to: 'mcp-problem', draw: drawMemory, src: (S) => S.l('Ilustrativo · largos proporcionales al texto de cada mensaje', 'Illustrative · lengths proportional to each message’s text') },
  { from: 'mcp-problem', to: 'risk', draw: drawMcp, src: (S) => (S.on('mcp') ? S.l('MCP: Anthropic (25 de noviembre de 2024) · conexiones ilustrativas', 'MCP: Anthropic (November 25, 2024) · illustrative connections') : S.l('Ilustrativo', 'Illustrative')) },
  { from: 'risk', to: 'sim-intro', draw: drawSteps, src: (S) => S.l('Supuesto ilustrativo: cada paso sale bien el 95 % de las veces', 'Illustrative assumption: each step goes right 95% of the time') },
  { from: 'sim-intro', to: 'real', draw: drawSim, src: (S) => S.l('Simulación con supuestos: 95 % por paso, errores independientes', 'Simulation with assumptions: 95% per step, independent errors') },
  { from: 'real', to: 'review-idea', draw: drawReal, src: (S) => S.l('Yao, Shinn, Razavi y Narasimhan (2024), τ-bench: tabla 2 y texto', 'Yao, Shinn, Razavi, and Narasimhan (2024), τ-bench: table 2 and text') },
  { from: 'review-idea', to: 'irreversible', draw: drawReview, src: (S) => S.l('Simulación: 95 % por paso; quien revisa detecta 9 de cada 10 errores (supuestos)', 'Simulation: 95% per step; the reviewer catches 9 errors in 10 (assumptions)') },
  { from: 'irreversible', to: 'incident', draw: drawIrreversible },
  { from: 'incident', to: 'plea', draw: drawIncident, src: (S) => S.l('The Register, 22 de julio de 2025: relato del usuario y respuesta de Replit', 'The Register, July 22, 2025: the user’s account and Replit’s response') },
  { from: 'plea', to: 'levels', draw: drawPerm, src: (S) => S.l('Ejemplo ilustrativo', 'Illustrative example') },
  { from: 'levels', to: 'start-small', draw: drawLevels, src: (S) => S.l('Escala simplificada a partir de Feng, McDonald y Zhang (2025)', 'Scale simplified from Feng, McDonald, and Zhang (2025)') },
  { from: 'start-small', to: 'recap', draw: drawStart, src: (S) => S.l('Especificación de MCP (2025) · Anthropic, «Building effective agents» (2024)', 'MCP specification (2025) · Anthropic, “Building effective agents” (2024)') },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

interface St { lastT: number; nShown: number; maxN: number; rev: number; seen: number[]; dec?: 'approve' | 'reject'; decAt?: number }
const fresh = (): St => ({ lastT: -1, nShown: 10, maxN: 10, rev: 0, seen: [] });
const st = (S: Frame): St => (S.st.ag ??= fresh()) as St;

/** Pasos durante la demostración: 10 → 14 → 20 → 40, de entero en entero. */
function demoSteps(S: Frame): number {
  if (S.on('try-steps')) return MAXN;
  const a = fr(S, 'demo-steps', 0.12, 0.24, 'io'), b = fr(S, 'demo-steps', 0.4, 0.52, 'io'), c = fr(S, 'demo-steps', 0.68, 0.84, 'io');
  return Math.round(c > 0 ? 20 + 20 * c : b > 0 ? 14 + 6 * b : 10 + 4 * a);
}
/** La revisión se enciende sola a un tercio de «review-demo». */
const demoReview = (S: Frame) => S.on('review-demo') && fr(S, 'review-demo', 0.32, 0.33) > 0;

function decide(S: Frame, which: 'approve' | 'reject') {
  const s = st(S);
  s.dec = which; s.decAt = S.clock;
  if (S.between('hitl-demo', 'levels')) S.complete('decide');
}

const scene: SceneFactory = () => ({
  controls: [
    { id: 'steps', kind: 'slider', label: { es: 'Pasos de la tarea', en: 'Steps in the task' }, min: 1, max: MAXN, step: 1, value: 10, from: 'demo-steps', to: 'real', fmt: (v) => String(v) },
    { id: 'review', kind: 'toggle', label: { es: 'Revisión humana cada 5 pasos', en: 'Human review every 5 steps' }, value: false, from: 'review-demo', to: 'irreversible' },
    { id: 'approve', kind: 'button', label: { es: 'Aprobar la compra', en: 'Approve the purchase' }, from: 'hitl-demo', to: 'levels' },
    { id: 'reject', kind: 'button', label: { es: 'Rechazar la compra', en: 'Reject the purchase' }, from: 'hitl-demo', to: 'levels' },
  ],

  init(S) { S.st.ag = fresh(); },

  action(S, id) {
    if ((id === 'approve' || id === 'reject') && S.between('hitl-demo', 'levels')) decide(S, id);
  },

  pointer(S, e) {
    if (e.type !== 'down' || !S.between('hitl-demo', 'levels') || fr(S, 'hitl-demo', 0.7, 0.85) < 0.5) return;
    const B = permButtons(S);
    if (!B) return;
    const inR = (r: { x: number; y: number; w: number; h: number }) => e.x >= r.x && e.x <= r.x + r.w && e.y >= r.y && e.y <= r.y + r.h;
    if (inR(B.approve)) { S.touched.add('approve'); decide(S, 'approve'); }
    else if (inR(B.reject)) { S.touched.add('reject'); decide(S, 'reject'); }
  },

  cursor(S, x, y) {
    if (!S.between('hitl-demo', 'levels') || fr(S, 'hitl-demo', 0.7, 0.85) < 0.5) return undefined;
    const B = permButtons(S);
    if (B && [B.approve, B.reject].some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) return 'pointer';
    return undefined;
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const s = st(S), dt = Math.min(S.dt || 0.016, 0.1);
    const jump = s.lastT < 0 || Math.abs(S.t - s.lastT) > 0.35;   // salto (o captura): sin transición
    s.lastT = S.t;
    const ease = (cur: number, target: number, rate = 7) => (jump ? target : cur + (target - cur) * (1 - Math.exp(-dt * rate)));

    // ── el simulador: pasos de la tarea ──
    if (S.between('demo-steps', 'real')) {
      const n = clamp(Math.round(Number(S.drive('steps', demoSteps(S)))), 1, MAXN);
      s.nShown = ease(s.nShown, n, 6);
      s.maxN = Math.max(s.maxN, n);
      if (S.touched.has('steps')) {
        if (!s.seen.includes(n)) s.seen.push(n);
        if (s.seen.length >= 2) S.complete('steps');
      }
    } else if (!S.on('demo-steps')) { s.nShown = 10; s.maxN = 10; }

    // ── la revisión humana ──
    if (S.between('review-idea', 'irreversible')) {
      const on = Boolean(S.drive('review', demoReview(S)));
      s.rev = ease(s.rev, on ? 1 : 0, 4);
      if (S.touched.has('review') && S.on('review-demo')) S.complete('review');
    } else if (!S.on('review-idea')) s.rev = 0;
  },

  render(S) {
    const d = S.d;
    for (const v of VIEWS) {
      const a = win(S, v.from, v.to);
      if (a <= 0.004) continue;
      d.withAlpha(a, () => v.draw(S));
      if (v.src) provenance(S, v.src(S), a);
    }
  },
});

export default scene;
