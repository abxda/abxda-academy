// Escena: Agentes y herramientas.
//  Acto 1 · anatomía: contexto → modelo → programa → herramientas (hook … loop)
//  Acto 2 · la consola de un agente en vivo, con herramientas reales y un «modelo» de guion (demo-intro … run-done)
//  Acto 3 · costo del bucle, plan y memoria, MCP · Acto 4 · fiabilidad de una cadena (chain … horizon)
//  Acto 5 · contener el error: puntos de control, permisos, niveles y persona en el bucle (checkpoints … hitl) · cierre
// Tres turnos: encontrar dónde el éxito cruza el 50 %, colocar puntos de control, y correr el agente con distintos permisos.
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawAnatomy } from './anatomy';
import { approvalHit, conAction, conUpdate, drawConsole, viewOfNarration, viewOfState } from './console';
import { drawBridge, drawCost, drawHitl, drawHorizon, drawIncident, drawLevels, drawMcp, drawPerm, drawPlan, drawReal, drawStart } from './acts';
import { drawChain, drawChk, drawRel } from './lab';
import { n50, stats } from './rel';

type Group = 'anatomy' | 'console' | 'cost' | 'plan' | 'mcp' | 'chain' | 'lab' | 'real' | 'horizon' | 'chk' | 'incident' | 'perm' | 'levels' | 'agent' | 'hitl' | 'start' | 'bridge';

function groupOf(S: Frame): Group {
  const i = (k: string) => S.segIndex(k);
  const s = S.seg;
  if (s < i('demo-intro')) return 'anatomy';
  if (s < i('cost-loop')) return 'console';
  if (s < i('plan-memory')) return 'cost';
  if (s < i('mcp')) return 'plan';
  if (s < i('chain')) return 'mcp';
  if (s < i('grid')) return 'chain';
  if (s < i('real')) return 'lab';
  if (s < i('horizon')) return 'real';
  if (s < i('checkpoints')) return 'horizon';
  if (s < i('incident')) return 'chk';
  if (s < i('perm')) return 'incident';
  if (s < i('levels')) return 'perm';
  if (s < i('try-agent')) return 'levels';
  if (s < i('hitl')) return 'agent';
  if (s < i('start-small')) return 'hitl';
  if (s < i('bridge')) return 'start';
  return 'bridge';
}

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: ¿cuántos pasos hasta que el éxito cruza la mitad? ──
    { id: 'pstep', kind: 'slider', label: { es: 'Acierto por paso', en: 'Accuracy per step' }, min: 80, max: 99, step: 1, value: 95, from: 'try-rel', to: 'real', fmt: (v) => `${v} %` },
    { id: 'nsteps', kind: 'slider', label: { es: 'Pasos de la tarea', en: 'Steps in the task' }, min: 1, max: 40, step: 1, value: 10, from: 'try-rel', to: 'real', fmt: (v) => String(v) },
    // ── turno 2: puntos de control ──
    { id: 'chk', kind: 'choice', label: { es: 'Revisar', en: 'Review' }, value: 0, from: 'try-chk', to: 'incident', options: [
      { value: 0, label: { es: 'Nunca', en: 'Never' } }, { value: 20, label: { es: 'Solo al final', en: 'Only at the end' } }, { value: 10, label: { es: 'Cada 10', en: 'Every 10' } },
      { value: 5, label: { es: 'Cada 5', en: 'Every 5' } }, { value: 4, label: { es: 'Cada 4', en: 'Every 4' } }, { value: 2, label: { es: 'Cada 2', en: 'Every 2' } }, { value: 1, label: { es: 'Cada 1', en: 'Every 1' } }] },
    { id: 'qrev', kind: 'slider', label: { es: 'Errores que detecta quien revisa', en: 'Errors the reviewer catches' }, min: 50, max: 100, step: 5, value: 90, from: 'try-chk', to: 'incident', fmt: (v) => `${v} %` },
    // ── turno 3: el agente con permisos distintos ──
    { id: 'scenario', kind: 'choice', label: { es: 'Escenario', en: 'Scenario' }, value: 'slip', from: 'try-agent', to: 'hitl', options: [
      { value: 'normal', label: { es: 'Normal', en: 'Normal' } }, { value: 'none', label: { es: 'Nada que reponer', en: 'Nothing to restock' } },
      { value: 'outage', label: { es: 'Falla el servicio de precios', en: 'Price service down' } }, { value: 'slip', label: { es: 'Error de cantidad', en: 'Quantity slip' } }] },
    { id: 'limit', kind: 'slider', label: { es: 'Límite de gasto sin pedir aprobación', en: 'Spending limit without asking approval' }, min: 0, max: 3000, step: 50, value: 3000, from: 'try-agent', to: 'hitl', fmt: (v, l) => (v >= 3000 ? (l === 'es' ? 'sin límite' : 'no limit') : v <= 0 ? (l === 'es' ? 'siempre pide aprobación' : 'always asks approval') : (l === 'es' ? 'US$ ' : '$') + v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US')) },
    { id: 'run', kind: 'button', primary: true, label: { es: 'Correr el agente', en: 'Run the agent' }, from: 'try-agent', to: 'hitl' },
    { id: 'approve', kind: 'button', label: { es: 'Aprobar el pedido', en: 'Approve the order' }, from: 'try-agent', to: 'hitl' },
    { id: 'reject', kind: 'button', label: { es: 'Rechazar el pedido', en: 'Reject the order' }, from: 'try-agent', to: 'hitl' },
  ],
  action(S, id) { conAction(S, id); },
  pointer(S, e) {
    if (e.type !== 'down') return;
    const h = approvalHit(), inR = (r: { x: number; y: number; w: number; h: number }) => e.x >= r.x && e.x <= r.x + r.w && e.y >= r.y && e.y <= r.y + r.h;
    if (h && S.between('try-agent', 'hitl')) { if (inR(h.approve)) conAction(S, 'approve'); else if (inR(h.reject)) conAction(S, 'reject'); }
  },
  cursor(S, x, y) {
    const h = approvalHit();
    if (h && S.between('try-agent', 'hitl') && [h.approve, h.reject].some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)) return 'pointer';
    return undefined;
  },
  init(S) { S.st = {}; },
  update(S) {
    if (S.between('try-rel', 'cost-success')) {
      const pp = clamp((S.p.pstep ?? 95) / 100, 0.5, 0.995), n = Math.round(S.p.nsteps ?? 10);
      if (Math.abs(n - n50(pp)) <= 1) S.complete('cross');
    }
    if (S.between('try-chk', 'tradeoff')) {
      const k = Math.round(S.p.chk ?? 0), st = stats(0.95, 20, k, clamp((S.p.qrev ?? 90) / 100));
      if (k > 0 && st.success >= 0.85 && st.reviews <= 4 && st.steps <= 35) S.complete('chk');
    }
    if (S.between('try-agent', 'hitl') && conUpdate(S)) S.complete('autonomy');
  },
  render(S) {
    const g = groupOf(S);
    S.d.withAlpha(1, () => {
      switch (g) {
        case 'anatomy': return drawAnatomy(S);
        case 'console': return drawConsole(S, viewOfNarration(S));
        case 'agent': return drawConsole(S, viewOfState(S));
        case 'cost': return drawCost(S);
        case 'plan': return drawPlan(S);
        case 'mcp': return drawMcp(S);
        case 'chain': return drawChain(S);
        case 'lab': return drawRel(S);
        case 'real': return drawReal(S);
        case 'horizon': return drawHorizon(S);
        case 'chk': return drawChk(S);
        case 'incident': return drawIncident(S);
        case 'perm': return drawPerm(S);
        case 'levels': return drawLevels(S);
        case 'hitl': return drawHitl(S);
        case 'start': return drawStart(S);
        case 'bridge': return drawBridge(S);
      }
    });
  },
});

export default scene;
