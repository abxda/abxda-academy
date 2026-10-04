// Acto 4 · El costo: por qué no todos los tokens cuestan igual, la lista de precios, la factura de una tarea y el
// turno 3 («una tarea que cuesta casi todo por la entrada y otra casi todo por la salida»).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CACHE_READ, H100, LLAMA3_8B, MFU_PREFILL, PRICE_IN, PRICE_OUT, bill, denseParams, nf, prefillTime, secs, serve, tok, usd } from './model';
import { FS, brace, chip, fitText, hbar, lang, mark, noteUp, pad, pill, show, tagText } from './ui';

const A8 = LLAMA3_8B;

// ═════════════ entrada y salida no cuestan igual ═════════════
export function drawLanes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), dt = tone(S, 'dat'), wt = tone(S, 'w');
  const gap = 12 * u, lh = (A.h - gap) / 2;
  const rateIn = 2000 / prefillTime(A8, H100, 2000), s1 = serve(A8, H100, 2, 1, 2000), s16 = serve(A8, H100, 2, 16, 8000);
  const lane = (y: number, t: 'dat' | 'w', title: string, at: number, kind: 'in' | 'out') => {
    const a = S.reveal('prefill-cheap', at, 0.6), r: Rect = { x: A.x, y, w: A.w, h: lh }, c = tone(S, t);
    show(S, a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 4 });
      pill(S, title, r.x + 10 * u, r.y + 16 * u, { align: 'left', t });
      const split = S.portrait ? 0 : 0.56, vis: Rect = S.portrait ? { x: r.x + 12 * u, y: r.y + 34 * u, w: r.w - 24 * u, h: lh * 0.34 } : { x: r.x + 12 * u, y: r.y + 38 * u, w: r.w * split - 24 * u, h: lh - 52 * u };
      const mt: Rect = S.portrait ? { x: r.x + 12 * u, y: vis.y + vis.h + 10 * u, w: r.w - 24 * u, h: r.y + r.h - (vis.y + vis.h + 10 * u) - 8 * u } : { x: r.x + r.w * split + 6 * u, y: r.y + 38 * u, w: r.w * (1 - split) - 18 * u, h: lh - 52 * u };
      // visual: muchos tokens a la vez, o uno a uno
      const cols = S.portrait ? 16 : 22, rows = kind === 'in' ? 3 : 1, cs = Math.min(vis.w / cols, vis.h / (kind === 'in' ? 3 : 2), 30 * u), gx = vis.x, gy = vis.y + (kind === 'in' ? 0 : vis.h * 0.2);
      const pulse = Math.max(0, Math.sin(S.clock * 2.4));
      const lit = kind === 'out' ? Math.floor((S.clock * 2.6) % (cols + 5)) : cols;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const on = kind === 'in' ? 0.25 + 0.6 * pulse : i < lit ? (i === lit - 1 ? 0.95 : 0.5) : 0.07;
        d.rect(gx + i * cs, gy + j * cs, cs - 2, cs - 2, { fill: alpha(c.c, on) });
      }
      tagText(S, kind === 'in' ? S.l('una pasada para todos', 'one pass for all of them') : S.l('un token por vuelta', 'one token per turn'), gx, gy + rows * cs + 16 * u, { t, align: 'left', base: 'middle' });
      // medidor del cálculo + ritmo
      d.text(S.l('uso del cálculo de la GPU', 'GPU arithmetic in use'), mt.x, mt.y + 2 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
      const use = kind === 'in' ? MFU_PREFILL : s1.compUse, by = mt.y + 22 * u;
      hbar(S, { x: mt.x, y: by, w: mt.w - 70 * u, h: 18 * u }, kind === 'in' ? use : Math.max(use, 0.008), t, { stroke: true });
      d.text(`${nf(use * 100, kind === 'in' ? 0 : 1, l)} %`, mt.x + mt.w, by + 9 * u, { size: FS(S, 15), weight: 700, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
      d.text(kind === 'in' ? S.l('supuesto: 40 % del pico', 'assumption: 40% of peak') : S.l(`una persona; con 16, ${nf(s16.compUse * 100, 0, 'es')} %`, `one person; with 16, ${nf(s16.compUse * 100, 0, 'en')}%`), mt.x, by + 26 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: mt.w });
      const rt = kind === 'in' ? `≈ ${tok(Math.round(rateIn / 1000) * 1000, l)}` : `≈ ${tok(Math.round(s1.perUser / 5) * 5, l)}`;
      d.text(rt, mt.x, by + 60 * u, { size: FS(S, 22), weight: 800, font: 'mono', color: c.ink, base: 'middle' });
      d.text(S.l('tokens/s por GPU', 'tokens/s per GPU') + (kind === 'out' ? S.l(' (un usuario)', ' (one user)') : ''), mt.x + d.measure(rt, { size: FS(S, 22), weight: 800, font: 'mono' }) + 8 * u, by + 60 * u, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle' });
    });
  };
  lane(A.y, 'dat', S.l('Entrada · prefill', 'Input · prefill'), 0.2, 'in');
  lane(A.y + lh + gap, 'w', S.l('Salida · decode', 'Output · decode'), 3.4, 'out');
  void wt; void dt;
}

// ═════════════ la lista de precios ═════════════
export function drawPrices(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S);
  const rows: { lab: string; v: number; t: 'sig' | 'lat'; at: number; hot?: boolean }[] = [
    { lab: S.l('entrada', 'input'), v: PRICE_IN, t: 'sig', at: 0.3 },
    { lab: S.l('salida', 'output'), v: PRICE_OUT, t: 'lat', at: 1.8 },
    { lab: S.l('entrada ya en caché', 'input already cached'), v: PRICE_IN * CACHE_READ, t: 'sig', at: 5.6, hot: true },
  ];
  const lw = Math.min(170 * u, A.w * 0.3), bx = A.x + lw + 8 * u, bw = A.w - lw - 8 * u - 96 * u, bh = clamp(A.h * 0.1, 30 * u, 54 * u), y0 = A.y + clamp(A.h * 0.18, 36 * u, 90 * u), pitch = bh + clamp(A.h * 0.1, 28 * u, 56 * u);
  show(S, S.reveal('price-ratio', 0.1, 0.5), () => fitText(S, S.l('Precio por millón de tokens (de ejemplo)', 'Price per million tokens (example)'), A.x, A.y + 6 * u, A.w, 17, { weight: 800, base: 'top' }));
  rows.forEach((r, i) => {
    const a = S.reveal('price-ratio', r.at, 0.7), c = tone(S, r.t), y = y0 + i * pitch, w = bw * (r.v / PRICE_OUT);
    show(S, a, () => {
      d.text(r.lab, bx - 8 * u, y + bh / 2, { size: FS(S, 14), weight: 700, color: c.ink, align: 'right', base: 'middle', w: lw });
      d.rect(bx, y, bw, bh, { fill: p.surface2 });
      d.rect(bx, y, Math.max(3, w * a), bh, { fill: r.t === 'sig' ? c.c : c.c });
      if (r.t === 'lat') for (let k = 0; k < 14; k++) d.line(bx + 8 * u + k * 22 * u, y + bh, bx + 8 * u + k * 22 * u + 14 * u, y, alpha(p.stage, 0.45), 2);
      d.text(usd(r.v, l), bx + Math.max(3, w) + 8 * u, y + bh / 2, { size: FS(S, 16), weight: 700, font: 'mono', color: p.ink, base: 'middle' });
    });
  });
  show(S, S.reveal('price-ratio', 3.2, 0.7), () => {
    const x = bx + bw * (PRICE_IN / PRICE_OUT) + 80 * u, ya = y0 + bh / 2, yb = y0 + pitch + bh / 2;
    pill(S, S.l('× 5', '× 5'), Math.min(bx + bw - 30 * u, x), (ya + yb) / 2, { t: 'lat' });
    d.line(bx + bw * (PRICE_IN / PRICE_OUT) + 14 * u, y0 + bh + 2 * u, bx + bw * (PRICE_IN / PRICE_OUT) + 14 * u, y0 + pitch - 2 * u, p.lineStrong, 1.3, [3, 3]);
  });
  show(S, S.reveal('price-ratio', 6.8, 0.7), () => pill(S, S.l('× 0,1', '× 0.1'), bx + bw * 0.3, y0 + 2 * pitch + bh + 20 * u, { t: 'sig' }));
  show(S, S.reveal('price-ratio', 8.0, 0.8), () => noteUp(S, S.l('Cifras de ejemplo. En la lista de Anthropic (octubre de 2026) la salida cuesta 5 veces la entrada y leer de caché, una décima parte o menos.', 'Example figures. On Anthropic’s list (October 2026) output costs 5 times input, and reading from cache a tenth or less.'), A.x, A.y + A.h - 2 * u, A.w));
}

// ═════════════ la factura de tres tareas ═════════════
interface TaskRow { es: string; en: string; tin: number; tout: number; at: number }
const TASKS: TaskRow[] = [
  { es: 'Chat corto', en: 'Short chat', tin: 300, tout: 300, at: 1.4 },
  { es: 'Resumir un contrato largo', en: 'Summarize a long contract', tin: 50000, tout: 500, at: 5.4 },
  { es: 'Redactar un informe largo', en: 'Draft a long report', tin: 1000, tout: 4000, at: 8.6 },
];
export function drawTasks(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), sg = tone(S, 'sig'), lt = tone(S, 'lat');
  show(S, S.reveal('cost-task', 0.1, 0.5), () => {
    fitText(S, S.l('costo = entrada × precio + salida × precio', 'cost = input × price + output × price'), A.x, A.y + 4 * u, A.w, 18, { weight: 800, base: 'top', font: 'mono' });
    tagText(S, S.portrait ? S.l('ejemplo: US$ 3 y 15 por millón', 'example: $3 and $15 per million') : S.l('precios de ejemplo: US$ 3 y US$ 15 por millón', 'example prices: $3 and $15 per million'), A.x, A.y + 32 * u, { t: 'mute', align: 'left', base: 'top', weight: 600, size: 12 });
    // leyenda (en el teléfono baja a la fila del subtítulo para no pisar el título)
    const lx = A.x + A.w, y = A.y + (S.portrait ? 39 : 14) * u;
    const sw = 11 * u, w2 = d.measure(S.l('salida', 'output'), { size: FS(S, 12), weight: 700 }), w1 = d.measure(S.l('entrada', 'input'), { size: FS(S, 12), weight: 700 });
    d.rect(lx - w2 - sw - 6 * u, y - sw / 2, sw, sw, { fill: lt.c }); d.text(S.l('salida', 'output'), lx, y, { size: FS(S, 12), weight: 700, color: lt.ink, align: 'right', base: 'middle' });
    const x1 = lx - w2 - sw - 22 * u; d.rect(x1 - w1 - sw - 6 * u, y - sw / 2, sw, sw, { fill: sg.c }); d.text(S.l('entrada', 'input'), x1, y, { size: FS(S, 12), weight: 700, color: sg.ink, align: 'right', base: 'middle' });
  });
  const top = A.y + clamp(A.h * 0.17, 56 * u, 90 * u), rh = (A.y + A.h - top) / 3, bl = 56 * u, bh = clamp(rh * 0.26, 18 * u, 30 * u);
  TASKS.forEach((t, i) => {
    const a = S.reveal('cost-task', t.at, 0.7), b = bill({ tin: t.tin, tout: t.tout, cached: false }), y = top + i * rh, tokIn = t.tin / (t.tin + t.tout);
    show(S, a, () => {
      fitText(S, S.l(t.es, t.en), A.x, y, A.w, 15, { weight: 800, base: 'top' });
      const bars: [string, number][] = [[S.l('tokens', 'tokens'), tokIn], [S.l('costo', 'cost'), b.shareIn]];
      bars.forEach(([lab, f], k) => {
        const by = y + 24 * u + k * (bh + 8 * u), bx = A.x + bl, bw = A.w - bl;
        d.text(lab, A.x + bl - 8 * u, by + bh / 2, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'middle' });
        d.rect(bx, by, bw * f, bh, { fill: sg.c }); d.rect(bx + bw * f, by, bw * (1 - f), bh, { fill: lt.c });
        if (f > 0.1) d.text(`${nf(f * 100, 0, l)} %`, bx + bw * f - 6 * u, by + bh / 2, { size: FS(S, 12), weight: 800, font: 'mono', color: p.stage, align: 'right', base: 'middle' });
        if (1 - f > 0.1) d.text(`${nf((1 - f) * 100, 0, l)} %`, bx + bw * f + 6 * u, by + bh / 2, { size: FS(S, 12), weight: 800, font: 'mono', color: p.stage, align: 'left', base: 'middle' });
      });
    });
  });
  void brace; void usd;
}

// ═════════════ turno 3: una tarea que se paga por la entrada, otra por la salida ═════════════
export const lg = (v: number) => { const t = 10 ** v; return t >= 1000 ? Math.round(t / 100) * 100 : Math.round(t / 10) * 10; };
export const taskOf = (S: Frame) => ({ tin: lg(Number(S.p.lgin ?? 3.7)), tout: lg(Number(S.p.lgout ?? 2.7)), cached: !!S.p.pcache });
export function updateTask(S: Frame): boolean {
  if (!S.between('try3', 'moe-idea')) return false;
  const st = (S.st.task ??= { inp: false, out: false }), b = bill(taskOf(S));
  if (b.shareIn >= 0.8) st.inp = true;
  if (b.shareIn <= 0.2) st.out = true;
  return st.inp && st.out;
}

export function drawGate3(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), sg = tone(S, 'sig'), lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const t = taskOf(S), b = bill(t), st = (S.st.task ??= { inp: false, out: false });
  const left: Rect = S.portrait ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.62 } : { x: A.x, y: A.y, w: A.w * 0.6, h: A.h };
  const right: Rect = S.portrait ? { x: A.x, y: A.y + A.h * 0.64, w: A.w, h: A.h * 0.36 } : { x: A.x + A.w * 0.6 + 16 * u, y: A.y, w: A.w * 0.4 - 16 * u, h: A.h };
  // factura
  const bh = clamp(left.h * 0.14, 30 * u, 52 * u), y1 = left.y + 40 * u;
  fitText(S, S.l('Costo de la tarea', 'Cost of the task'), left.x, left.y + 4 * u, left.w, 16, { weight: 800, base: 'top' });
  d.rect(left.x, y1, left.w, bh, { fill: p.surface2 });
  d.rect(left.x, y1, left.w * b.shareIn, bh, { fill: sg.c }); d.rect(left.x + left.w * b.shareIn, y1, left.w * (1 - b.shareIn), bh, { fill: lt.c });
  if (b.shareIn > 0.12) d.text(`${nf(b.shareIn * 100, 0, l)} %`, left.x + left.w * b.shareIn - 8 * u, y1 + bh / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: p.stage, align: 'right', base: 'middle' });
  if (1 - b.shareIn > 0.12) d.text(`${nf((1 - b.shareIn) * 100, 0, l)} %`, left.x + left.w * b.shareIn + 8 * u, y1 + bh / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: p.stage, align: 'left', base: 'middle' });
  const ly = y1 + bh + 8 * u;
  d.text(`${S.l('entrada', 'input')} ${usd(b.costIn, l)}`, left.x, ly, { size: FS(S, 14), weight: 700, font: 'mono', color: sg.ink, base: 'top' });
  d.text(`${S.l('salida', 'output')} ${usd(b.costOut, l)}`, left.x + left.w, ly, { size: FS(S, 14), weight: 700, font: 'mono', color: lt.ink, align: 'right', base: 'top' });
  d.text(usd(b.total, l), left.x + left.w / 2, ly + 30 * u, { size: FS(S, 28), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
  d.text(S.l('por tarea', 'per task'), left.x + left.w / 2, ly + 30 * u + 34 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top' });
  // tiempo
  const ty = ly + (S.portrait ? 92 : 112) * u;
  fitText(S, S.l('Tiempo estimado', 'Estimated time'), left.x, ty, left.w, 16, { weight: 800, base: 'top' });
  const tb = ty + 28 * u, wf = b.ttft / b.time;
  d.rect(left.x, tb, left.w, 22 * u, { fill: p.surface2 });
  d.rect(left.x, tb, Math.max(3, left.w * wf), 22 * u, { fill: dt.c }); d.rect(left.x + Math.max(3, left.w * wf), tb, left.w - Math.max(3, left.w * wf), 22 * u, { fill: lt.c });
  d.text(`${S.l('hasta el 1.er token', 'to the 1st token')} ${secs(b.ttft, l)}`, left.x, tb + 30 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: dt.ink, base: 'top' });
  d.text(`${S.l('escribir', 'writing')} ${secs(b.gen, l)}`, left.x + left.w, tb + 30 * u, { size: FS(S, 13), weight: 700, font: 'mono', color: lt.ink, align: 'right', base: 'top' });
  noteUp(S, S.portrait ? S.l('H100 · lote de 16 · estimación', 'H100 · batch of 16 · estimate') : S.l('modelo de 8 mil M, H100, hasta 16 conversaciones en lote (estimación)', '8B model, H100, up to 16 conversations batched (estimate)'), left.x, left.y + left.h - 2 * u, left.w);
  // lecturas y metas
  const cg = 8 * u, cw = (right.w - cg) / 2, ch = 54 * u;
  chip(S, { x: right.x, y: right.y, w: cw, h: ch }, S.l('entrada', 'input'), tok(t.tin, l), 'sig', { vsize: S.portrait ? 14 : 16 });
  chip(S, { x: right.x + cw + cg, y: right.y, w: cw, h: ch }, S.l('salida', 'output'), tok(t.tout, l), 'lat', { vsize: S.portrait ? 14 : 16 });
  chip(S, { x: right.x, y: right.y + ch + cg, w: cw, h: ch }, S.l('por 1 000 tareas', 'per 1,000 tasks'), usd(b.total * 1000, l), 'ink' as 'sig', { vsize: S.portrait ? 14 : 16 });
  chip(S, { x: right.x + cw + cg, y: right.y + ch + cg, w: cw, h: ch }, S.l('entrada que pagas', 'input you pay for'), t.cached ? S.l('con caché', 'cached') : S.l('completa', 'full'), t.cached ? 'dat' : 'sig', { vsize: S.portrait ? 13 : 15 });
  const gy = right.y + 2 * (ch + cg) + 12 * u, goals: [string, boolean][] = [[S.l('más del 80 % del costo en la entrada', 'over 80% of the cost in input'), st.inp], [S.l('más del 80 % del costo en la salida', 'over 80% of the cost in output'), st.out]];
  goals.forEach(([lab, ok], i) => {
    const y = gy + i * 28 * u;
    if (ok) mark(S, right.x + 9 * u, y, true, { r: 7 }); else d.circle(right.x + 9 * u, y, 6 * u, { stroke: p.mute, lw: 1.8 });
    d.text(lab, right.x + 26 * u, y, { size: FS(S, 13), weight: 700, color: ok ? dt.ink : p.ink2, base: 'middle', w: right.w - 28 * u });
  });
  void pill; void denseParams;
}
