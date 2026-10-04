// Agente de juguete para la lección «Agentes y herramientas».
//
// Qué es real y qué no (la escena lo rotula así):
//  · REAL: las cuatro herramientas son funciones que se ejecutan de verdad en el navegador sobre un mundo de juguete
//    (una tabla de inventario, una lista de precios, una calculadora con su propio analizador sintáctico y una bandeja de
//    pedidos). Devuelven resultados y errores reales (por ejemplo, un código mal escrito produce un error con una
//    sugerencia calculada por distancia de edición).
//  · REAL: el bucle del arnés (programa que rodea al modelo): pedir una decisión, ejecutar la herramienta, pegar el
//    resultado en el historial, y aplicar los permisos (el límite de gasto) en código, no en el «prompt».
//  · ILUSTRATIVO: el «modelo» es un guion escrito a mano (`decide`) que decide a partir de lo que observó. No hay ningún
//    LLM aquí. En el escenario «error de cantidad» el guion se equivoca a propósito (280 en lugar de 28), y en todos
//    los escenarios se equivoca una vez al escribir un código, para que se vea cómo un error se vuelve una observación.
//  Todo es determinista: sin azar ni relojes.

export type Lang = 'es' | 'en';
export interface LS { es: string; en: string }
export type ToolId = 'inventory' | 'price' | 'calc' | 'order';
export type Scenario = 'normal' | 'none' | 'outage' | 'slip';

export interface Item { sku: string; es: string; en: string; stock: number; min: number; target: number; price: number }
/** Mundo de juguete. Los precios son inventados; «target» es la existencia a la que se repone. */
export const ITEMS: Item[] = [
  { sku: 'COJ-6204', es: 'Cojinete 6204', en: 'Bearing 6204', stock: 12, min: 20, target: 40, price: 8.5 },
  { sku: 'FIL-A15', es: 'Filtro de aire A15', en: 'Air filter A15', stock: 3, min: 10, target: 20, price: 14.2 },
  { sku: 'BAN-V32', es: 'Banda V32', en: 'V-belt V32', stock: 25, min: 10, target: 30, price: 6.75 },
  { sku: 'JUN-45', es: 'Junta 45 mm', en: 'Gasket 45 mm', stock: 40, min: 15, target: 40, price: 2.3 },
  { sku: 'ACE-1L', es: 'Aceite 1 L', en: 'Oil 1 L', stock: 60, min: 30, target: 80, price: 5.9 },
  { sku: 'TOR-M6', es: 'Tornillo M6 (caja)', en: 'M6 screw (box)', stock: 9, min: 8, target: 20, price: 3.4 },
];

export interface Line { sku: string; qty: number; unit: number }
export interface Order { n: number; lines: Line[]; total: number; byPerson: boolean }
export interface World { stock: Record<string, number>; down: boolean; orders: Order[] }
export interface Row { sku: string; stock: number; min: number }

export function newWorld(scn: Scenario): World {
  const stock: Record<string, number> = {};
  ITEMS.forEach((i) => (stock[i.sku] = i.stock));
  if (scn === 'none') { stock['COJ-6204'] = 26; stock['FIL-A15'] = 14; }
  return { stock, down: scn === 'outage', orders: [] };
}

export const money = (x: number, l: Lang) => (l === 'es' ? 'US$ ' : '$') + x.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (x: number) => Math.round(x * 100) / 100;
export const orderId = (n: number, l: Lang) => (l === 'es' ? 'PED-' : 'ORD-') + String(n).padStart(4, '0');

// ── herramientas reales ──────────────────────────────────────────────────
export type Res<T> = { ok: true; value: T } | { ok: false; code: 'unknown' | 'down' | 'syntax' | 'mismatch' | 'rejected'; suggest?: string; msg: LS };

function lev(a: string, b: string) {
  const m = a.length, n = b.length, d: number[][] = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export function toolInventory(w: World): Res<Row[]> {
  return { ok: true, value: ITEMS.map((i) => ({ sku: i.sku, stock: w.stock[i.sku], min: i.min })) };
}

export function toolPrice(w: World, sku: string): Res<number> {
  if (w.down) return { ok: false, code: 'down', msg: { es: 'servicio de precios no disponible', en: 'price service unavailable' } };
  const it = ITEMS.find((i) => i.sku === sku);
  if (it) return { ok: true, value: it.price };
  const near = ITEMS.map((i) => [lev(i.sku, sku), i.sku] as const).sort((a, b) => a[0] - b[0])[0];
  const suggest = near[0] <= 2 ? near[1] : undefined;
  return {
    ok: false, code: 'unknown', suggest,
    msg: { es: `el código «${sku}» no existe${suggest ? `. ¿Quisiste decir «${suggest}»?` : ''}`, en: `code “${sku}” does not exist${suggest ? `. Did you mean “${suggest}”?` : ''}` },
  };
}

/** Calculadora: + − × ÷, paréntesis, decimales y menos unario. Analizador descendente; no usa eval. */
export function toolCalc(expr: string): Res<number> {
  const bad = (es: string, en: string): Res<number> => ({ ok: false, code: 'syntax', msg: { es, en } });
  const toks = expr.match(/\d+\.?\d*|\.\d+|[()+\-*/]|\S/g) ?? [];
  let pos = 0;
  const peek = () => toks[pos], next = () => toks[pos++];
  let fail: Res<number> | null = null;
  const num = (): number => {
    const t = next();
    if (t === undefined) { fail ??= bad('expresión incompleta', 'incomplete expression'); return 0; }
    if (t === '(') { const v = sum(); if (next() !== ')') fail ??= bad('falta un paréntesis', 'missing parenthesis'); return v; }
    if (t === '-') return -num();
    if (/^\d|^\./.test(t)) return parseFloat(t);
    fail ??= bad(`símbolo no válido «${t}»`, `invalid symbol “${t}”`); return 0;
  };
  const prod = (): number => { let v = num(); while (peek() === '*' || peek() === '/') { const o = next(); const r = num(); if (o === '*') v *= r; else if (r === 0) { fail ??= bad('división entre cero', 'division by zero'); } else v /= r; } return v; };
  const sum = (): number => { let v = prod(); while (peek() === '+' || peek() === '-') { const o = next(); const r = prod(); v = o === '+' ? v + r : v - r; } return v; };
  const v = sum();
  if (!fail && pos < toks.length) fail = bad(`sobra «${toks[pos]}»`, `unexpected “${toks[pos]}”`);
  if (fail) return fail;
  return { ok: true, value: Math.round(v * 1e8) / 1e8 };
}

export function toolOrder(w: World, lines: Line[], total: number, byPerson: boolean): Res<{ n: number }> {
  const sum = r2(lines.reduce((a, l) => a + l.qty * l.unit, 0));
  if (!lines.length || Math.abs(sum - total) > 0.005) return { ok: false, code: 'mismatch', msg: { es: 'el total no coincide con las líneas', en: 'the total does not match the lines' } };
  const n = w.orders.length + 1;
  w.orders.push({ n, lines, total: r2(total), byPerson });
  return { ok: true, value: { n } };
}

// ── el arnés y el «modelo» ───────────────────────────────────────────────
export interface Call { tool: ToolId; es: string; en: string }
export interface Obs { ok: boolean; es: string; en: string; code?: string }
export interface Pending { lines: Line[]; total: number }
export interface Turn { think: LS; call?: Call; obs?: Obs; final?: LS; short: LS; wait?: boolean }
interface Mem { inv?: Row[]; prices: Record<string, number>; typo: boolean; down: number; lines?: Line[]; total?: number; calcExpr?: string; orderN?: number; rejected: boolean; lastErr?: { code: string; suggest?: string; sku?: string } }
export type Verdict = 'none' | 'outage' | 'ok-auto' | 'ok-approved' | 'wrong-auto' | 'wrong-approved' | 'rejected-wrong' | 'rejected-ok';
export interface Run {
  scenario: Scenario; limit: number; world: World; turns: Turn[]; mem: Mem;
  status: 'running' | 'awaiting' | 'done';
  pending?: Pending; decision?: 'approved' | 'rejected'; verdict?: Verdict;
}

export const newRun = (scenario: Scenario, limit: number): Run => ({ scenario, limit, world: newWorld(scenario), turns: [], mem: { prices: {}, typo: false, down: 0, rejected: false }, status: 'running' });

/** Lo que el programa exige a la persona: el permiso vive aquí, en código. */
export const needsApproval = (total: number, limit: number) => limit <= 0 || total > limit;

/** Total correcto de reposición (existencia → objetivo) con los datos reales del mundo. */
export const correctTotal = (w: World) => r2(ITEMS.filter((i) => w.stock[i.sku] < i.min).reduce((a, i) => a + (i.target - w.stock[i.sku]) * i.price, 0));

const sq = (s: string) => `«${s}»`;
const typoOf = (sku: string) => sku.replace('-', '');   // el desliz del guion: olvida el guion

interface Decision { think: LS; short: LS; final?: LS; tool?: ToolId; sku?: string; expr?: string; lines?: Line[]; total?: number }

/** El «modelo»: una función de lo que ha observado (mem). Es un guion, no un LLM. */
function decide(run: Run): Decision {
  const m = run.mem, scn = run.scenario;
  const l10 = (es: string, en: string): LS => ({ es, en });
  if (!m.inv) return { tool: 'inventory', think: l10('Primero necesito saber qué piezas están por debajo de su mínimo.', 'First I need to know which parts are below their minimum.'), short: l10('inventario → qué falta', 'inventory → what is low') };
  const low = m.inv.filter((r) => r.stock < r.min);
  if (!low.length) {
    return { think: l10('Todas las piezas están sobre su mínimo: no hay nada que pedir.', 'Every part is above its minimum: there is nothing to order.'), final: l10('Revisé el inventario y todo está sobre el mínimo. No hice ningún pedido.', 'I checked the inventory and everything is above the minimum. I placed no order.'), short: l10('respuesta: nada que pedir', 'answer: nothing to order') };
  }
  const names = low.map((r) => r.sku).join(' y ');
  const namesEn = low.map((r) => r.sku).join(' and ');
  if (m.rejected) {
    return { think: l10('La persona rechazó el pedido. No lo repito sin instrucciones nuevas.', 'The person rejected the order. I will not retry without new instructions.'), final: l10(`El pedido no se envió porque la persona lo rechazó. Siguen pendientes ${names}.`, `The order was not sent because the person rejected it. ${namesEn} are still pending.`), short: l10('respuesta: pedido rechazado', 'answer: order rejected') };
  }
  if (m.orderN !== undefined) {
    const lines = m.lines!, tot = m.total!;
    const txt = (l: Lang) => lines.map((x) => `${x.qty} × ${x.sku}`).join(l === 'es' ? ' y ' : ' and ');
    return { think: l10('El pedido quedó registrado. Ya cumplí el objetivo.', 'The order is on record. The goal is met.'), final: l10(`Pedido ${orderId(m.orderN, 'es')} enviado al proveedor: ${txt('es')}, total ${money(tot, 'es')}.`, `Order ${orderId(m.orderN, 'en')} sent to the supplier: ${txt('en')}, total ${money(tot, 'en')}.`), short: l10('respuesta: pedido enviado', 'answer: order sent') };
  }
  const missing = low.filter((r) => m.prices[r.sku] === undefined);
  if (missing.length) {
    const e = m.lastErr;
    if (e?.code === 'down') {
      if (m.down >= 2) {
        return { think: l10('Sigue sin responder. Sin precios no puedo calcular el pedido, y no voy a inventarlos.', 'It still does not respond. Without prices I cannot compute the order, and I will not make them up.'), final: l10(`No pude hacer el pedido: el servicio de precios no responde. Siguen bajo el mínimo ${names}.`, `I could not place the order: the price service is not responding. ${namesEn} are still below minimum.`), short: l10('respuesta: no pude, aviso', 'answer: could not, reporting') };
      }
      return { tool: 'price', sku: e.sku, think: l10('El servicio falló. Reintento una vez.', 'The service failed. I will try once more.'), short: l10(`precio(${e.sku}) de nuevo`, `price(${e.sku}) again`) };
    }
    if (e?.code === 'unknown' && e.suggest) {
      return { tool: 'price', sku: e.suggest, think: l10(`Escribí mal el código. La herramienta sugiere ${e.suggest}: reintento.`, `I mistyped the code. The tool suggests ${e.suggest}: trying again.`), short: l10(`precio(${e.suggest}) corregido`, `price(${e.suggest}) fixed`) };
    }
    const sku = missing[0].sku;
    const first = Object.keys(m.prices).length === 0 && !m.typo && !m.lastErr;
    const arg = first ? typoOf(sku) : sku;
    const think = first ? l10(`Bajo el mínimo: ${names}. Necesito el precio de cada una.`, `Below minimum: ${namesEn}. I need the price of each.`) : l10(`Ya tengo el precio de ${Object.keys(m.prices)[0]}. Falta el de ${sku}.`, `I have the price of ${Object.keys(m.prices)[0]}. ${sku} is missing.`);
    return { tool: 'price', sku: arg, think, short: l10(`precio(${arg})`, `price(${arg})`) };
  }
  if (m.total === undefined) {
    const lines: Line[] = low.map((r) => {
      const it = ITEMS.find((i) => i.sku === r.sku)!;
      let qty = it.target - r.stock;
      if (scn === 'slip' && r.sku === 'COJ-6204') qty *= 10;   // el desliz del guion: un cero de más
      return { sku: r.sku, qty, unit: m.prices[r.sku] };
    });
    const expr = lines.map((x) => `${x.qty}*${x.unit}`).join(' + ');
    const cnt = (l: Lang) => lines.map((x) => `${x.qty} ${l === 'es' ? 'de' : 'of'} ${x.sku}`).join(l === 'es' ? ' y ' : ' and ');
    m.lines = lines; m.calcExpr = expr;
    return { tool: 'calc', expr, think: l10(`Reponer hasta el objetivo: ${cnt('es')}. Calculo el total.`, `Restock to target: ${cnt('en')}. Computing the total.`), short: l10('calcular → total', 'calculate → total') };
  }
  return { tool: 'order', lines: m.lines, total: m.total, think: l10(`El total es ${money(m.total, 'es')}. Hago el pedido.`, `The total is ${money(m.total, 'en')}. Placing the order.`), short: l10('pedido → enviar', 'order → send') };
}

const argTxt = (l: Lang, lines: Line[], total: number) => `${lines.map((x) => `${x.qty}×${x.sku}`).join(', ')}, ${total}`;
const tname: Record<ToolId, LS> = { inventory: { es: 'inventario', en: 'get_inventory' }, price: { es: 'precio', en: 'get_price' }, calc: { es: 'calcular', en: 'calculate' }, order: { es: 'hacer_pedido', en: 'place_order' } };
export const toolName = (t: ToolId, l: Lang) => tname[t][l];

function exec(run: Run, turn: Turn, d: Decision, approved?: boolean) {
  const m = run.mem, w = run.world, t = d.tool!;
  const callTxt = (l: Lang) => `${tname[t][l]}(${t === 'inventory' ? '' : t === 'price' ? `"${d.sku}"` : t === 'calc' ? `"${d.expr}"` : argTxt(l, d.lines!, d.total!)})`;
  if (!turn.call) turn.call = { tool: t, es: callTxt('es'), en: callTxt('en') };
  m.lastErr = undefined;
  if (t === 'inventory') {
    const r = toolInventory(w) as { ok: true; value: Row[] };
    m.inv = r.value;
    const rows = r.value.map((x) => `${x.sku} ${x.stock}/${x.min}`).join(' · ');
    turn.obs = { ok: true, es: `existencias/mínimo: ${rows}`, en: `stock/minimum: ${rows}` };
  } else if (t === 'price') {
    const r = toolPrice(w, d.sku!);
    if (r.ok) { m.prices[d.sku!] = r.value; turn.obs = { ok: true, es: `precio: ${r.value.toFixed(2)}`, en: `price: ${r.value.toFixed(2)}` }; }
    else {
      turn.obs = { ok: false, code: r.code, es: `error: ${r.msg.es}`, en: `error: ${r.msg.en}` };
      m.typo = true; m.lastErr = { code: r.code, suggest: r.suggest, sku: d.sku };
      if (r.code === 'down') m.down++;
    }
  } else if (t === 'calc') {
    const r = toolCalc(d.expr!);
    if (r.ok) { m.total = r.value; turn.obs = { ok: true, es: `${r.value}`, en: `${r.value}` }; }
    else turn.obs = { ok: false, code: r.code, es: `error: ${r.msg.es}`, en: `error: ${r.msg.en}` };
  } else {
    if (approved === undefined && needsApproval(d.total!, run.limit)) { run.status = 'awaiting'; run.pending = { lines: d.lines!, total: d.total! }; turn.wait = true; return; }
    if (approved === false) { turn.obs = { ok: false, code: 'rejected', es: 'rechazado por la persona: no se envió', en: 'rejected by the person: not sent' }; m.rejected = true; return; }
    const r = toolOrder(w, d.lines!, d.total!, approved === true);
    if (r.ok) { m.orderN = r.value.n; turn.obs = { ok: true, es: `pedido ${orderId(r.value.n, 'es')} registrado`, en: `order ${orderId(r.value.n, 'en')} recorded` }; }
    else turn.obs = { ok: false, code: r.code, es: `error: ${r.msg.es}`, en: `error: ${r.msg.en}` };
  }
}

/** Un paso del bucle: el modelo decide, el arnés ejecuta y pega la observación. */
export function stepRun(run: Run): Turn | null {
  if (run.status !== 'running') return null;
  const d = decide(run);
  const turn: Turn = { think: d.think, short: d.short };
  run.turns.push(turn);
  (turn as any)._d = d;
  if (d.final) { turn.final = d.final; run.status = 'done'; finish(run); return turn; }
  exec(run, turn, d);
  return turn;
}

/** La persona decide sobre el pedido pendiente. */
export function resolve(run: Run, approve: boolean) {
  if (run.status !== 'awaiting') return;
  const turn = run.turns[run.turns.length - 1], d = (turn as any)._d as Decision;
  turn.wait = false; run.decision = approve ? 'approved' : 'rejected'; run.pending = undefined; run.status = 'running';
  exec(run, turn, d, approve);
}

function finish(run: Run) {
  const o = run.world.orders[0], good = correctTotal(run.world);
  const low = run.mem.inv?.some((r) => r.stock < r.min);
  if (!low) run.verdict = 'none';
  else if (!o) run.verdict = run.mem.rejected ? (run.scenario === 'slip' ? 'rejected-wrong' : 'rejected-ok') : 'outage';
  else {
    const wrong = Math.abs(o.total - good) > 0.005;
    run.verdict = o.byPerson ? (wrong ? 'wrong-approved' : 'ok-approved') : (wrong ? 'wrong-auto' : 'ok-auto');
  }
}

export function runAll(scn: Scenario, limit: number): Run {
  const r = newRun(scn, limit);
  for (let i = 0; i < 20 && r.status === 'running'; i++) stepRun(r);
  return r;
}

// ── lo que el modelo tiene que releer en cada llamada (estimación) ─────────
export const TASK_MSG: LS = { es: 'Repón las piezas con poco inventario y haz el pedido al proveedor.', en: 'Restock the parts that are running low and place the order with the supplier.' };
export const SYSTEM_MSG: LS = { es: 'Eres un asistente de compras. Usa las herramientas; no inventes datos. Los pedidos que superen el límite requieren aprobación.', en: 'You are a purchasing assistant. Use the tools; do not make up data. Orders above the limit require approval.' };
export const TOOL_DEFS: Record<Lang, string[]> = {
  es: [
    '{"nombre":"inventario","descripcion":"Lista cada pieza con su existencia y su mínimo.","parametros":{}}',
    '{"nombre":"precio","descripcion":"Precio unitario de una pieza según su código.","parametros":{"sku":"texto"}}',
    '{"nombre":"calcular","descripcion":"Evalúa una expresión aritmética.","parametros":{"expresion":"texto"}}',
    '{"nombre":"hacer_pedido","descripcion":"Envía un pedido al proveedor. No se puede deshacer.","parametros":{"lineas":"lista","total":"número"}}',
  ],
  en: [
    '{"name":"get_inventory","description":"Lists each part with its stock and its minimum.","parameters":{}}',
    '{"name":"get_price","description":"Unit price of a part by its code.","parameters":{"sku":"string"}}',
    '{"name":"calculate","description":"Evaluates an arithmetic expression.","parameters":{"expression":"string"}}',
    '{"name":"place_order","description":"Sends an order to the supplier. It cannot be undone.","parameters":{"lines":"list","total":"number"}}',
  ],
};
/** Estimación gruesa: un token ≈ cuatro caracteres. Es una aproximación didáctica, no el conteo de un proveedor. */
export const estTokens = (s: string) => Math.ceil(s.length / 4);
export const turnText = (t: Turn, l: Lang) => [t.think[l], t.call?.[l] ?? '', t.obs?.[l] ?? '', t.final?.[l] ?? ''].join(' ');

export interface ReadRow { base: number; hist: number; fresh: number; wrote: number }
/** Tokens que el modelo lee y escribe en cada consulta (una por turno). */
export function readLedger(turns: Turn[], l: Lang): ReadRow[] {
  const base = estTokens(SYSTEM_MSG[l]) + estTokens(TOOL_DEFS[l].join('')) + estTokens(TASK_MSG[l]);
  let acc = 0, prev = 0;
  return turns.map((t) => {
    const row = { base, hist: acc, fresh: prev, wrote: estTokens(t.think[l] + (t.call?.[l] ?? '') + (t.final?.[l] ?? '')) };
    const used = estTokens(turnText(t, l));
    acc += prev; prev = used;
    return row;
  });
}
