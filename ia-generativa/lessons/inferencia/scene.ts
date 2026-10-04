// Escena: Inferencia. Cuatro bloques que se funden uno en otro:
//  A · las dos fases (chat, entrenar vs servir, prefill → decode, duración real)
//  B · la caché KV (pasadas con y sin caché, bytes por token, el reparto de la memoria de la GPU)  → turno 1
//  C · el ancho de banda manda (leer vs calcular, techo de velocidad, cuantización, lotes)         → turno 2
//  D · el costo (entrada y salida, factura de una tarea), la mezcla de expertos y el cierre         → turno 3
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawChat, drawFlow, drawPhases, drawServing } from './act1';
import { drawGrids, drawKvBytes, drawLedger, updateLedger } from './act2';
import { drawBatch, drawBw, drawGate2, drawQuant, updateBatch } from './act3';
import { drawGate3, drawLanes, drawPrices, drawTasks, lg, updateTask } from './act4';
import { drawBridge, drawMoeIdea, drawMoeMemory, drawMoeNumbers, drawRecap, drawSpec, updateMoe } from './act5';
import { tok } from './model';
import { fadeFor, show } from './ui';

interface Sc { from: string; to?: string; draw: (S: Frame) => void }
const SCENES: Sc[] = [
  { from: 'hook', to: 'serving', draw: drawChat },
  { from: 'serving', to: 'prefill', draw: drawServing },
  { from: 'prefill', to: 'phases', draw: drawFlow },
  { from: 'phases', to: 'recompute', draw: drawPhases },
  { from: 'recompute', to: 'price', draw: drawGrids },
  { from: 'price', to: 'shared', draw: drawKvBytes },
  { from: 'shared', to: 'read-all', draw: drawLedger },
  { from: 'read-all', to: 'quant-speed', draw: drawBw },
  { from: 'quant-speed', to: 'batching', draw: drawQuant },
  { from: 'batching', to: 'try2', draw: drawBatch },
  { from: 'try2', to: 'prefill-cheap', draw: drawGate2 },
  { from: 'prefill-cheap', to: 'price-ratio', draw: drawLanes },
  { from: 'price-ratio', to: 'cost-task', draw: drawPrices },
  { from: 'cost-task', to: 'try3', draw: drawTasks },
  { from: 'try3', to: 'moe-idea', draw: drawGate3 },
  { from: 'moe-idea', to: 'moe-numbers', draw: drawMoeIdea },
  { from: 'moe-numbers', to: 'moe-memory', draw: drawMoeNumbers },
  { from: 'moe-memory', to: 'spec', draw: drawMoeMemory },
  { from: 'spec', to: 'recap', draw: drawSpec },
  { from: 'recap', to: 'bridge', draw: drawRecap },
  { from: 'bridge', draw: drawBridge },
];

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: el reparto de la memoria ──
    { id: 'ctx1', kind: 'choice', label: { es: 'Contexto por persona', en: 'Context per person' }, options: [{ value: 8000, label: { es: '8 000', en: '8,000' } }, { value: 32000, label: { es: '32 000', en: '32,000' } }, { value: 128000, label: { es: '128 000', en: '128,000' } }], value: 8000, from: 'try1', to: 'read-all' },
    { id: 'users1', kind: 'slider', label: { es: 'Conversaciones simultáneas', en: 'Simultaneous conversations' }, min: 1, max: 64, step: 1, value: 1, fmt: (v) => String(v), from: 'try1', to: 'read-all' },
    // ── turno 2: el lote ──
    { id: 'bsize', kind: 'slider', label: { es: 'Personas en el lote', en: 'People in the batch' }, min: 1, max: 64, step: 1, value: 1, fmt: (v) => String(v), from: 'try2', to: 'context-hurts' },
    { id: 'ctx2', kind: 'choice', label: { es: 'Contexto por persona', en: 'Context per person' }, options: [{ value: 8000, label: { es: '8 000', en: '8,000' } }, { value: 32000, label: { es: '32 000', en: '32,000' } }], value: 8000, from: 'try2', to: 'context-hurts' },
    // ── turno 3: la factura de una tarea ──
    { id: 'lgin', kind: 'slider', label: { es: 'Tokens de entrada', en: 'Input tokens' }, min: 2, max: 5.08, step: 0.02, value: 3.7, fmt: (v, l) => tok(lg(v), l), from: 'try3', to: 'moe-idea' },
    { id: 'lgout', kind: 'slider', label: { es: 'Tokens de salida', en: 'Output tokens' }, min: 1.7, max: 3.9, step: 0.02, value: 2.7, fmt: (v, l) => tok(lg(v), l), from: 'try3', to: 'moe-idea' },
    { id: 'pcache', kind: 'toggle', label: { es: 'Caché de prompt (90 % de la entrada repetida)', en: 'Prompt cache (90% of the input repeated)' }, value: false, from: 'try3', to: 'moe-idea' },
    // ── mezcla de expertos: exploración libre ──
    { id: 'moeB', kind: 'slider', label: { es: 'Tokens en el lote', en: 'Tokens in the batch' }, min: 1, max: 32, step: 1, value: 1, fmt: (v) => String(v), from: 'moe-memory', to: 'spec' },
  ],
  update(S) {
    if (updateLedger(S)) S.complete('ledger');
    if (updateBatch(S)) S.complete('batch');
    if (updateTask(S)) S.complete('task');
    updateMoe(S);
  },
  render(S) {
    for (const sc of SCENES) show(S, fadeFor(S, sc.from, sc.to), () => sc.draw(S));
  },
});

export default scene;
