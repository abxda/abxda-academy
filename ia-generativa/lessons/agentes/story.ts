// El ejemplo de la lección (ILUSTRATIVO, rotulado en pantalla): un agente que compra boletos de cine con dos
// herramientas inventadas. Los textos de cada mensaje del contexto, en los dos idiomas, y cuándo entra cada uno.
// Las cifras coinciden con la narración: 20:00 agotada; 21:30 con 14 lugares a 95 pesos; 2 × 95 = 190 < 300;
// asientos F7 y F8. En la parte de permisos, el modelo escribe 20 en lugar de 2 (1 900 pesos > límite de 300).
import type { Frame } from '../../../../../theme/kit';
import type { Tone } from '../../../../../theme/kit';

export type Role = 'sys' | 'tools' | 'user' | 'call' | 'result' | 'answer';
export interface Msg { id: string; role: Role; es: string; en: string; mono?: boolean }

export const LIMIT = 300;
export const PRICE = 95;

export const hourL = (S: Frame, h: '20' | '21') => (h === '20' ? S.l('20:00', '8:00 pm') : S.l('21:30', '9:30 pm'));

export const MSGS: Msg[] = [
  { id: 'sys', role: 'sys', es: 'Eres un asistente que compra boletos de cine.', en: 'You are an assistant that buys movie tickets.' },
  { id: 'tools', role: 'tools', es: 'buscar_funciones(fecha) · comprar_boletos(función, cantidad)', en: 'find_showtimes(date) · buy_tickets(showtime, quantity)', mono: true },
  { id: 'user', role: 'user', es: 'Compra 2 boletos para hoy en la noche, juntos, por menos de 300 pesos.', en: 'Buy 2 tickets for tonight, seats together, for under 300 pesos.' },
  { id: 'call1', role: 'call', es: 'buscar_funciones(fecha="hoy")', en: 'find_showtimes(date="today")', mono: true },
  { id: 'res1', role: 'result', es: '20:00 agotada · 21:30: 14 lugares, 95 pesos c/u', en: '8:00 pm sold out · 9:30 pm: 14 seats, 95 pesos each' },
  { id: 'call2', role: 'call', es: 'comprar_boletos(función="21:30", cantidad=2)', en: 'buy_tickets(showtime="9:30 pm", quantity=2)', mono: true },
  { id: 'res2', role: 'result', es: 'listo: asientos F7 y F8 · total 190 pesos', en: 'done: seats F7 and F8 · total 190 pesos' },
  { id: 'answer', role: 'answer', es: 'Compré 2 boletos para las 21:30: asientos F7 y F8, 190 pesos.', en: 'I bought 2 tickets for 9:30 pm: seats F7 and F8, 190 pesos.' },
];
export const msg = (id: string) => MSGS.find((m) => m.id === id)!;
export const txt = (S: Frame, m: Msg) => m[S.lang];

export const ROLE_TONE: Record<Role, Tone> = { sys: 'ink', tools: 'dat', user: 'sig', call: 'lat', result: 'dat', answer: 'lat' };
export function roleName(S: Frame, r: Role, short = false): string {
  if (short) return r === 'sys' ? S.l('instr.', 'sys.') : r === 'tools' ? S.l('herr.', 'tools') : r === 'user' ? S.l('tú', 'you') : r === 'call' ? S.l('IA', 'AI') : r === 'result' ? S.l('res.', 'res.') : S.l('IA', 'AI');
  return r === 'sys' ? S.l('instrucciones', 'system') : r === 'tools' ? S.l('herramientas', 'tools') : r === 'user' ? S.l('tú', 'you') : r === 'call' ? S.l('IA: llamada', 'AI: call') : r === 'result' ? S.l('resultado', 'result') : S.l('IA: respuesta', 'AI: answer');
}

// Las herramientas, tal como se dibujan (nombre y datos de entrada).
export const TOOLS = [
  { id: 'find', name: { es: 'buscar_funciones', en: 'find_showtimes' }, args: { es: '(fecha)', en: '(date)' }, kind: { es: 'consulta', en: 'looks up' } },
  { id: 'buy', name: { es: 'comprar_boletos', en: 'buy_tickets' }, args: { es: '(función, cantidad)', en: '(showtime, quantity)' }, kind: { es: 'paga', en: 'pays' } },
] as const;

// La compra equivocada de la parte de permisos.
export const BAD_CALL = { es: 'comprar_boletos(función="21:30", cantidad=20)', en: 'buy_tickets(showtime="9:30 pm", quantity=20)' };
export const GOOD_CALL = { es: 'comprar_boletos(función="21:30", cantidad=2)', en: 'buy_tickets(showtime="9:30 pm", quantity=2)' };
