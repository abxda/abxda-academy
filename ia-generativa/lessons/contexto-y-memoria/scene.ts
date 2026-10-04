// Escena: Contexto y memoria. El chat que «recuerda», el modelo sin estado, el tren de contexto y su ventana,
// el costo de reenviar el historial, «perdido en el medio» (datos reales) y las funciones de memoria.
//
// REAL: tamaños de ventana (SIZES), resultados de Liu et al. 2023 (LITM). ILUSTRATIVO (rotulado): conversación, tamaños de
// mensajes en tokens, respuestas del modelo. CÁLCULO sobre supuestos editables: costo de reenviar el historial.
import { type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawAct1, drawChat, g1Of, type G1 } from './act1';
import { drawGate2, drawOverflow, drawSizes, drawWindowStory, g2Init, g2Of, g2Sync } from './act2';
import { drawCost } from './act4';
import { LITM_FROM, LITM_TO, drawLitm, litmSt } from './act5';
import { drawBridge, drawMemory, drawRecap, drawRisks } from './act6';
import { LITM, WINDOWS, addDoc, addExchange } from './model';
import { num } from './ui';

const winOpt = (v: number, es: string, en: string) => ({ value: v, label: { es: `${v.toLocaleString('es-MX').replace(/,/g, ' ')}${es}`, en: `${v.toLocaleString('en-US')}${en}` } });

const scene: SceneFactory = () => ({
  controls: [
    // gate 1
    { id: 'send-all', kind: 'button', primary: true, label: { es: 'Enviar con el historial', en: 'Send with the history' }, from: 'try-state', to: 'window' },
    { id: 'send-last', kind: 'button', label: { es: 'Enviar solo la pregunta', en: 'Send only the question' }, from: 'try-state', to: 'window' },
    // gate 2
    { id: 'send', kind: 'button', primary: true, label: { es: 'Enviar mensaje', en: 'Send message' }, from: 'try-train', to: 'cost-q' },
    { id: 'paste', kind: 'button', label: { es: 'Pegar un documento', en: 'Paste a document' }, from: 'try-train', to: 'cost-q' },
    { id: 'win', kind: 'choice', label: { es: 'Tamaño de la ventana (tokens)', en: 'Window size (tokens)' }, options: [winOpt(WINDOWS[0], ' · GPT-2', ' · GPT-2'), winOpt(WINDOWS[1], ' · GPT-3', ' · GPT-3'), winOpt(WINDOWS[2], '', '')], value: WINDOWS[0], from: 'try-train', to: 'cost-q' },
    { id: 'reset-train', kind: 'button', label: { es: 'Reiniciar', en: 'Reset' }, from: 'try-train', to: 'cost-q' },
    // costo (supuestos editables)
    { id: 'n', kind: 'slider', label: { es: 'Turnos de la conversación', en: 'Conversation turns' }, min: 1, max: 60, step: 1, value: 20, from: 'cost-sum', to: 'litm-q', fmt: (v) => String(v) },
    { id: 'm', kind: 'slider', label: { es: 'Tokens que añade cada turno (supuesto)', en: 'Tokens each turn adds (assumed)' }, min: 50, max: 500, step: 10, value: 150, from: 'cost-sum', to: 'litm-q', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US') },
    { id: 'sys', kind: 'slider', label: { es: 'Prompt del sistema (tokens)', en: 'System prompt (tokens)' }, min: 0, max: 4000, step: 100, value: 0, from: 'cost-sum', to: 'litm-q', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US') },
    { id: 'price', kind: 'slider', label: { es: 'Precio de entrada, USD por millón de tokens (supuesto)', en: 'Input price, USD per million tokens (assumed)' }, min: 0.1, max: 20, step: 0.1, value: 3, from: 'cost-sum', to: 'litm-q', fmt: (v, l) => '$' + v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
    { id: 'cache', kind: 'toggle', label: { es: 'Con caché del prefijo (supuesto: acierta en cada turno)', en: 'With prefix caching (assumed: hits on every turn)' }, value: false, from: 'cost-sum', to: 'litm-q' },
    // perdido en el medio
    { id: 'pos', kind: 'slider', label: { es: 'Posición del documento con la respuesta', en: 'Position of the document with the answer' }, min: 1, max: 20, step: 1, value: 1, from: 'try-litm', to: 'memory-q', fmt: (v) => String(v) },
    { id: 'model', kind: 'choice', label: { es: 'Modelo', en: 'Model' }, options: LITM.map((r) => ({ value: r.id, label: { es: r.name, en: r.name } })), value: 'gpt', from: 'try-litm', to: 'memory-q' },
  ],

  action(S, id) {
    if (id === 'send-all' || id === 'send-last') { const g = g1Of(S); g.mode = id === 'send-all' ? 'all' : 'last'; g.at = S.clock; g.tried[g.mode] = true; return; }
    const g = g2Of(S), prev = new Set(g.wagons.map((w) => w.id));
    if (id === 'send') { g.wagons = addExchange(g.wagons); g.sends++; g2Sync(S, g, prev); }
    else if (id === 'paste') { g.wagons = addDoc(g.wagons); g.sends++; g2Sync(S, g, prev); }
    else if (id === 'reset-train') { S.st.g2 = g2Init(); const n = g2Of(S); n.L = S.p.win ?? WINDOWS[0]; n.inside = new Set(); g2Sync(S, n, new Set(n.wagons.map((w) => w.id))); n.flips = {}; }
  },

  update(S) {
    const g1: G1 = g1Of(S);
    if (S.between('try-state', 'window') && g1.tried.all && g1.tried.last) S.complete('state');
    if (S.between('try-train', 'cost-q')) {
      const g = g2Of(S), L = S.p.win ?? WINDOWS[0];
      if (L !== g.L) { const prev = new Set(g.wagons.map((w) => w.id)); g.L = L; g2Sync(S, g, prev); }
      if (g.seenLost) S.complete('train');
    }
    if (S.between(LITM_FROM, LITM_TO) && S.on('try-litm')) {
      const st = litmSt(S), pos = S.p.pos ?? 1;
      if (pos >= 8 && pos <= 13) st.mid = true;
      if (pos >= 19 || (pos <= 2 && st.mid)) st.edge = true;
      if (st.mid && st.edge) S.complete('litm');
    }
  },

  render(S) {
    const fade = 1 - S.at('function', 0, 0.45, 'out');
    if (fade > 0.002) S.d.withAlpha(fade, () => drawChat(S));
    drawAct1(S);
    drawWindowStory(S);
    drawSizes(S);
    drawOverflow(S);
    drawGate2(S);
    drawCost(S);
    drawLitm(S);
    drawMemory(S);
    drawRisks(S);
    drawRecap(S);
    drawBridge(S);
    void num;
  },
});
export default scene;
export type { Frame };
