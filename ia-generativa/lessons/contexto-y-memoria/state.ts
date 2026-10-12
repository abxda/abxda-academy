// Estado interactivo de la escena (S.st). update() lo avanza; render() solo lo lee.
// · El tren: qué vagones hay (paso de la historia + turnos que añadió la persona) y dónde se dibuja cada uno (posición
//   suavizada en tokens, para que nada salte de lugar). Al saltar en la línea de tiempo, todo va directo a su sitio.
// · Lo que envía la aplicación (todo el historial o solo la pregunta), los turnos de la gráfica de costo y el lugar del
//   documento con la respuesta: valores mostrados que siguen con suavidad al valor del control.
import { clamp, type Frame } from '../../../../../theme/kit';
import { STEP_MAX, WINDOW, fitWindow, trainAt, type Wagon } from './model';
import { fr } from './ui';

export interface Disp { off: number; len: number; drop: number; a: number; role: Wagon['role']; name?: boolean; tokens: number; seen: number }
export interface St {
  lastT: number;
  // tren
  disp: Record<string, Disp>;
  order: string[];
  extras: number;
  frozen: number | null;
  // envío (0 = todo el historial, 1 = solo la pregunta)
  send: number;
  // costo: turnos mostrados
  turns: number;
  // perdido en el medio: lugar mostrado del documento con la respuesta
  pos: number;
}
const fresh = (): St => ({ lastT: -1, disp: {}, order: [], extras: 0, frozen: null, send: 0, turns: 1, pos: 1 });
export const st = (S: Frame): St => (S.st.cm ??= fresh()) as St;
export const reset = (S: Frame) => { S.st.cm = fresh(); };

// ── el tren ─────────────────────────────────────────────────────────────────────────────────────────
/** Paso de la historia según el tiempo (cada paso entra en una fracción fija de su segmento). */
export function storyStep(S: Frame): number {
  if (S.on('name-lost') && fr(S, 'name-lost', 0.3, 0.31) > 0) return 5;
  if (S.on('overflow') && fr(S, 'overflow', 0.3, 0.31) > 0) return 4;
  if (S.on('fill') && fr(S, 'fill', 0.25, 0.26) > 0) return 3;
  if (S.on('answer-space') && fr(S, 'answer-space', 0.3, 0.31) > 0) return 2;
  if (S.on('system') && fr(S, 'system', 0.15, 0.16) > 0) return 1;
  return 0;
}
/** Paso efectivo: si la persona ya añadió turnos, la historia se queda donde estaba. */
export const stepNow = (S: Frame) => { const s = st(S); return s.frozen ?? storyStep(S); };
export const wagonsNow = (S: Frame) => trainAt(stepNow(S), st(S).extras);

/** Objetivo de cada vagón: dentro de la ventana, en fila desde el frente; fuera, en la vía de abajo (los más viejos primero). */
function targets(w: Wagon[]) {
  const inside = fitWindow(w, WINDOW), out: Record<string, { off: number; drop: number }> = {};
  let a = 0, b = 0;
  for (const x of w) {
    if (inside.has(x.id)) { out[x.id] = { off: a, drop: 0 }; a += x.tokens; }
    else { out[x.id] = { off: b, drop: 1 }; b += x.tokens; }
  }
  return { out, inside };
}

export function updateTrain(S: Frame, jump: boolean, dt: number) {
  const s = st(S), w = wagonsNow(S), { out } = targets(w);
  const k = jump ? 1 : 1 - Math.exp(-dt * 5.5);
  const ids = new Set(w.map((x) => x.id));
  for (const x of w) {
    const t = out[x.id];
    let d = s.disp[x.id];
    if (!d) {
      // entra: las instrucciones desde la izquierda; la persona desde la derecha; la IA crece token a token
      d = { off: x.role === 'sys' ? -x.tokens : t.off + (x.role === 'user' ? 40 : 0), len: x.role === 'ai' ? 0 : x.tokens, drop: t.drop, a: 0, role: x.role, name: x.name, tokens: x.tokens, seen: S.clock };
      if (jump) { d.off = t.off; d.len = x.tokens; d.a = 1; }
      s.disp[x.id] = d;
    }
    const ka = jump ? 1 : 1 - Math.exp(-dt * (x.role === 'ai' ? 2.6 : 5.5));
    d.off += (t.off - d.off) * k;
    d.drop += (t.drop - d.drop) * k;
    d.len += (x.tokens - d.len) * ka;
    d.a += (1 - d.a) * k;
  }
  for (const id of Object.keys(s.disp)) if (!ids.has(id)) delete s.disp[id];
  s.order = w.map((x) => x.id);
}

/** La persona pulsó «Enviar otro mensaje». */
export function addTurn(S: Frame) {
  const s = st(S);
  if (s.frozen === null) s.frozen = storyStep(S);
  s.extras = Math.min(s.extras + 1, 40);
}

// ── demostraciones ──────────────────────────────────────────────────────────────────────────────────
/** Qué envía la aplicación durante la demostración: primero todo el historial, luego solo la pregunta. */
export const demoSend = (S: Frame) => (S.on('try-send') || fr(S, 'demo-send', 0.48, 0.49) > 0 ? 'last' : 'all');
/** Turnos de la gráfica de costo: 1 → 3 (barras), 3 → 10 (total), 10 → 20 (crece). */
export function demoTurns(S: Frame): number {
  if (S.on('cost-pay')) return 20;
  if (S.on('cost-grow')) return Math.round(10 + 10 * fr(S, 'cost-grow', 0.08, 0.6, 'io'));
  if (S.on('cost-total')) return Math.round(3 + 7 * fr(S, 'cost-total', 0.05, 0.55, 'io'));
  if (S.on('cost-bars')) return fr(S, 'cost-bars', 0.62, 0.63) > 0 ? 3 : fr(S, 'cost-bars', 0.3, 0.31) > 0 ? 2 : 1;
  return 1;
}
/** Lugar del documento con la respuesta en la demostración. */
export function demoPos(S: Frame): number {
  if (S.on('try-litm')) return 10;
  if (S.on('litm-closed')) return 10;
  if (S.on('litm-last')) return 20;
  if (S.on('litm-middle')) return 10;
  return 1;
}
/** Recorrido del documento en «litm-move»: 1 → 5 → 10 → 15 → 20 (y de vuelta al 1 para empezar la gráfica). */
export function movePos(S: Frame): number {
  const f = fr(S, 'litm-move', 0, 1, 'lin');
  const stops = [1, 5, 10, 15, 20];
  const i = clamp(Math.floor((f - 0.12) / 0.15), -1, 4);
  return i < 0 ? 1 : stops[i];
}
void STEP_MAX;
