// Acto 2 · La caché KV: pasadas con y sin caché (con un transformer de juguete real), bytes por token y el reparto
// de la memoria de una GPU entre pesos y cachés. Termina con el turno 1 («¿cuántas conversaciones caben?»).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { H100, LLAMA3_8B, denseParams, gb, kvBytesPerToken, nf, tok } from './model';
import { runDemo, type Demo } from './tiny';
import { FS, brace, chip, fitText, holds, lang, lerpRect, mark, op, pad, pill, show, tagText } from './ui';

const A8 = LLAMA3_8B, W8 = denseParams(A8) * 2, KV8 = kvBytesPerToken(A8), CAP = H100.mem;
const P = 10, G = 16, COLS = P + G - 1, ROWS = G;

// ═════════════ pasadas con y sin caché ═════════════
let DEMO: Demo | null = null;
/** Transformer de juguete (tiny.ts) sobre una secuencia de 26 identificadores sin significado: solo mide y compara. */
export const demo = (): Demo => (DEMO ??= runDemo(Array.from({ length: P + G }, (_, i) => (i * 7 + 3) % 30), P, 30));

interface GridOpts { title: string; mode: 'nocache' | 'cache'; rows: number; repeated: number; colHi: boolean; counter: boolean; legend: 'repeat' | 'cache' | null }
function drawGrid(S: Frame, R: Rect, o: GridOpts, foot: number) {
  const { d, pal: p } = S, u = S.u, dm = demo(), dt = tone(S, 'dat'), lt = tone(S, 'lat'), mt = tone(S, 'mute');
  const titleH = 22 * u, braceH = 24 * u, footH = foot, gx = R.x + 22 * u, gy = R.y + titleH + braceH, gw = R.w - 22 * u, gh = R.h - titleH - braceH - footH;
  const cw = gw / COLS, ch = gh / ROWS;
  fitText(S, o.title, R.x, R.y, R.w, 16, { weight: 800, base: 'top' });
  brace(S, gx + 1, gx + cw * P - 2, gy - 8 * u, S.l('entrada', 'input'), 'sig', { up: true });
  brace(S, gx + cw * P + 1, gx + gw - 1, gy - 8 * u, S.l('salida', 'output'), 'lat', { up: true });
  d.text('1', gx - 5 * u, gy + ch / 2, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  d.text('16', gx - 5 * u, gy + gh - ch / 2, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  let count = 0;
  for (let j = 0; j < ROWS; j++) {
    const a = clamp(o.rows - j); if (a <= 0) continue;
    const n = o.mode === 'nocache' ? dm.rowsNoCache[j] : dm.rowsCache[j], first = o.mode === 'nocache' ? 0 : (j === 0 ? 0 : P + j - 1), upto = P + j - 1;
    count += n * a;
    d.withAlpha(a, () => {
      for (let i = 0; i <= upto; i++) {
        const x = gx + i * cw, y = gy + j * ch, isNew = j === 0 || i === upto;
        if (o.mode === 'nocache') {
          if (isNew) d.rect(x, y, cw - 1, ch - 1, { fill: dt.c });
          else { d.rect(x, y, cw - 1, ch - 1, { fill: alpha(dt.c, 0.9 * (1 - o.repeated)) }); if (o.repeated > 0) d.rect(x, y, cw - 1, ch - 1, { fill: alpha(mt.c, 0.42 * o.repeated) }); }
        } else if (i >= first && (j === 0 || i === upto)) d.rect(x, y, cw - 1, ch - 1, { fill: dt.c });
        else d.rect(x, y, cw - 1, ch - 1, { fill: alpha(lt.c, 0.3) });
      }
    });
  }
  if (o.colHi) { const x = gx + 3 * cw; d.rect(x - 1, gy + ch - 1, cw + 1, gh - ch + 2, { stroke: p.ink, lw: 1.8, dash: [4, 3] }); }
  d.rect(gx - 0.5, gy - 0.5, gw + 1, gh + 1, { stroke: p.line, lw: 1 });
  // pie: contador y leyenda
  if (o.counter) {
    fitText(S, S.l('pasadas por el modelo: ', 'passes through the model: ') + nf(Math.round(count), 0, lang(S)), R.x, R.y + R.h - footH + 14 * u, R.w, 15, { weight: 700, font: 'mono', color: dt.ink, base: 'middle' });
  }
  const sw = 11 * u;
  const items: [string, string][] = o.legend === 'repeat' ? [['dat', S.l('nuevo', 'new')], ['mute', S.l('repetido', 'repeated')]] : o.legend === 'cache' ? [['dat', S.l('calculado ahora', 'computed now')], ['lat', S.l('leído de la caché', 'read from the cache')]] : [];
  let lx = R.x;
  items.forEach(([t, lab]) => {
    const c = tone(S, t as 'dat'), w = d.measure(lab, { size: FS(S, 12), weight: 600 });
    d.rect(lx, R.y + R.h - footH + 32 * u, sw, sw, { fill: t === 'lat' ? alpha(c.c, 0.3) : t === 'mute' ? alpha(c.c, 0.42) : c.c, stroke: c.c, lw: 1 });
    d.text(lab, lx + sw + 5 * u, R.y + R.h - footH + 32 * u + sw / 2, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle' });
    lx += sw + 5 * u + w + 14 * u;
  });
  return Math.round(count);
}

export function drawGrids(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), dm = demo(), l = lang(S);
  // `room`: franja extra bajo las gráficas para el rótulo «la misma columna» (para que no pise la leyenda).
  const banner = (S.portrait ? 46 : 28) * u * S.reveal('count', 0.3, 0.6), room = (S.portrait ? 30 : 20) * u * (S.on('unchanged') ? S.reveal('unchanged', 1.5, 0.6) : 0), foot = (S.portrait ? 50 : 56) * u;
  const body: Rect = { x: A.x, y: A.y, w: A.w, h: A.h - banner - (banner > 0 ? 6 * u : 0) };
  // posiciones: solo (una gráfica) → pareja (con y sin caché)
  const k = S.at('kvcache', 0, 0.9, 'io');
  const soloW = S.portrait ? body.w : Math.min(body.w * 0.64, 680 * u);
  const solo: Rect = { x: body.x + (body.w - soloW) / 2, y: body.y, w: soloW, h: body.h };
  const gap = (S.portrait ? 12 : 22) * u;
  const pairA: Rect = S.portrait ? { x: body.x, y: body.y, w: body.w, h: (body.h - gap) / 2 } : { x: body.x, y: body.y, w: (body.w - gap) / 2, h: body.h };
  const pairB: Rect = S.portrait ? { x: body.x, y: body.y + (body.h - gap) / 2 + gap, w: body.w, h: (body.h - gap) / 2 } : { x: body.x + (body.w - gap) / 2 + gap, y: body.y, w: (body.w - gap) / 2, h: body.h };
  const rA = lerpRect(solo, pairA, k);
  const rowsA = S.on('kvcache') ? ROWS : S.at('recompute', 0.8, 7.2, 'lin') * ROWS;
  const rep = S.reveal('unchanged', 0.2, 1.4);
  const colHi = S.on('unchanged') && S.at('unchanged', 2.0, 2.5) > 0.5;
  const nA = drawGrid(S, rA, { title: S.l('Sin caché: se repite todo', 'No cache: everything repeats'), mode: 'nocache', rows: rowsA, repeated: S.on('unchanged') ? rep : 0, colHi: colHi, counter: S.on('count') || S.on('kvcache') || S.on('recompute'), legend: S.on('unchanged') ? 'repeat' : null }, (S.portrait && k > 0.5 ? foot * 0.8 : foot) + room);
  void nA;
  if (colHi) {
    const gx = rA.x + 22 * u, cwA = (rA.w - 22 * u) / COLS;
    show(S, S.reveal('unchanged', 2.2, 0.5), () => pill(S, S.l('la misma columna, una y otra vez', 'the same column, over and over'), Math.min(rA.x + rA.w - 4 * u, Math.max(rA.x + 140 * u, gx + 3.5 * cwA)), rA.y + rA.h - (S.portrait ? 8 : 12) * u, { t: 'ink', align: 'center' }));
  }
  if (S.on('kvcache')) {
    show(S, S.reveal('kvcache', 0.1, 0.6), () => {
      const rowsB = S.at('kvcache', 0.8, 6.8, 'lin') * ROWS;
      drawGrid(S, pairB, { title: S.l('Con caché KV: cada token, una vez', 'With KV cache: each token, once'), mode: 'cache', rows: S.on('count') ? ROWS : rowsB, repeated: 0, colHi: false, counter: true, legend: 'cache' }, (S.portrait ? foot * 0.8 : foot) + room);
    });
  }
  // el cierre: 280 frente a 25, mismo resultado
  if (S.on('count')) {
    show(S, S.reveal('count', 0.3, 0.6), () => {
      const ratio = dm.passesNoCache / dm.passesCache, by = A.y + A.h - banner + banner / 2;
      d.rect(A.x, A.y + A.h - banner + 2 * u, A.w, banner - 4 * u, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.4, r: 3 });
      const nv = nf(dm.passesNoCache, 0, l), md = dm.maxDiff === 0 ? '0' : dm.maxDiff.toExponential(0), rr = nf(ratio, 0, l);
      if (S.portrait) {   // en el teléfono el aviso va en dos renglones
        fitText(S, S.l(`${nv} ÷ ${dm.passesCache} ≈ ${rr} veces menos · mismo resultado`, `${nv} ÷ ${dm.passesCache} ≈ ${rr}× fewer · same result`), A.x + A.w / 2, by - 9 * u, A.w - 14 * u, 13, { weight: 700, color: p.ink, align: 'center', base: 'middle' });
        fitText(S, S.l(`diferencia máxima ${md} · transformer de juguete real`, `max difference ${md} · real toy transformer`), A.x + A.w / 2, by + 9 * u, A.w - 14 * u, 13, { weight: 700, color: p.ink, align: 'center', base: 'middle' });
      } else fitText(S, S.l(`${nv} ÷ ${dm.passesCache} ≈ ${rr} veces menos · mismo resultado (diferencia máxima ${md}) · transformer de juguete real`, `${nv} ÷ ${dm.passesCache} ≈ ${rr}× fewer · same result (max difference ${md}) · real toy transformer`), A.x + A.w / 2, by, A.w - 14 * u, 13, { weight: 700, color: p.ink, align: 'center', base: 'middle' });
    });
  }
}

// ═════════════ bytes por token ═════════════
export function drawKvBytes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S);
  const parts: { v: string; lab: [string, string]; t: 'sig' | 'w' | 'lat' | 'dat'; at: string; delay: number }[] = [
    { v: '2', lab: ['clave y valor', 'key and value'], t: 'lat', at: 'price', delay: 0.5 },
    { v: '32', lab: ['capas', 'layers'], t: 'w', at: 'price', delay: 2.8 },
    { v: '8', lab: ['cabezas KV', 'KV heads'], t: 'w', at: 'price', delay: 5.0 },
    { v: '128', lab: ['dim. por cabeza', 'dim. per head'], t: 'w', at: 'llama-kv', delay: 0.4 },
    { v: '2', lab: ['bytes (FP16)', 'bytes (FP16)'], t: 'dat', at: 'llama-kv', delay: 1.0 },
  ];
  const resT = S.reveal('llama-kv', 2.0, 0.6), res = nf(KV8, 0, l);
  const cols = S.portrait ? 3 : 6, rowsN = S.portrait ? 2 : 1;
  const opw = 20 * u, chH = 54 * u, chW = S.portrait ? (A.w - 2 * opw) / 3 : (A.w - 5 * opw) / (5 + 1.45);
  const y0 = A.y + 4 * u + clamp((A.h - 300 * u) * 0.35, 0, 90 * u);   // baja un poco la escena para no dejar medio escenario vacío
  const narrow = chW < 125 * u, short: Record<string, [string, string]> = { 'clave y valor': ['clave+valor', 'key+value'], 'dim. por cabeza': ['dim. cabeza', 'head dim.'], 'bytes (FP16)': ['bytes', 'bytes'] };   // en chips estrechos las etiquetas largas no caben
  const place = (i: number): Rect => {
    if (S.portrait) { const row = i < 3 ? 0 : 1, c = i < 3 ? i : i - 3; return { x: A.x + c * (chW + opw), y: y0 + row * (chH + 12 * u), w: i === 5 ? chW : chW, h: chH }; }
    return { x: A.x + i * (chW + opw), y: y0, w: i === 5 ? chW * 1.45 : chW, h: chH };
  };
  void cols; void rowsN;
  parts.forEach((q, i) => {
    const a = S.reveal(q.at, q.delay, 0.5), r = place(i);
    if (a <= 0) return;
    const lb = narrow && short[q.lab[0]] ? short[q.lab[0]] : q.lab;
    chip(S, r, S.l(lb[0], lb[1]), q.v, q.t, { a });
    if (i > 0) { const pr = place(i - 1); if (S.portrait && i === 3) op(S, A.x - 0, r.y + r.h / 2, '', a); else op(S, (pr.x + pr.w + r.x) / 2, r.y + r.h / 2, '×', a); }
  });
  if (resT > 0) { const r = place(5), pr = place(4); op(S, (pr.x + pr.w + r.x) / 2, r.y + r.h / 2, '=', resT); chip(S, r, S.l('por token', 'per token'), `${res} B`, 'lat', { a: resT, hot: 0.5, vsize: S.portrait ? 15 : 17 }); }
  const lowY = place(5).y + chH + (S.portrait ? 26 : 36) * u;
  // comparación: pesos frente a la caché de una conversación de 128 000 tokens
  const bars = S.reveal('llama-kv', 4.0, 0.7) * (1 - S.reveal('gqa', 0.2, 0.7));
  show(S, bars, () => {
    const lw = Math.min(150 * u, A.w * 0.34), bx = A.x + lw + 8 * u, bw = A.w - lw - 8 * u - 70 * u, bh = 36 * u, max = Math.max(W8, KV8 * 128000);
    const rows: [string, number, 'w' | 'lat', string][] = [[S.l('pesos del modelo', 'model weights'), W8, 'w', gb(W8, l, 1)], [S.l('caché de una conversación de 128 000 tokens', 'cache of one 128,000-token conversation'), KV8 * 128000, 'lat', gb(KV8 * 128000, l, 1)]];
    rows.forEach(([lab, v, t, txt], i) => {
      const y = lowY + i * (bh + 22 * u), c = tone(S, t), a = i === 0 ? 1 : S.reveal('llama-kv', 5.6, 0.7);
      d.withAlpha(a, () => {
        d.rect(bx, y, bw, bh, { fill: p.surface2 });
        d.rect(bx, y, bw * (v / max), bh, { fill: c.c });
        d.text(lab, bx - 8 * u, y + bh / 2, { size: FS(S, 12), weight: 700, color: c.ink, align: 'right', base: 'middle', w: lw });
        d.text(txt, bx + bw * (v / max) + 6 * u, y + bh / 2, { size: FS(S, 14), weight: 700, font: 'mono', color: p.ink, base: 'middle' });
      });
    });
  });
  // la solución de los diseñadores: cabezas de consulta agrupadas (GQA)
  show(S, S.reveal('gqa', 0.4, 0.7), () => drawGqa(S, { x: A.x, y: lowY - 6 * u, w: A.w, h: A.y + A.h - lowY + 6 * u }));
}

function drawGqa(S: Frame, R: Rect) {
  const { d, pal: p } = S, u = S.u, l = lang(S), sg = tone(S, 'sig'), lt = tone(S, 'lat');
  const lw = Math.min(138 * u, R.w * 0.34), x0 = R.x + lw + 6 * u, w = R.w - lw - 6 * u, n = 32, g = 8, sz = Math.min(w / (n + 1.2), 20 * u), pitch = w / n;
  const y1 = R.y + 10 * u, y2 = y1 + Math.min(74 * u, R.h * 0.42);
  const at = (t: number, delay: number) => S.reveal('gqa', delay, t);
  d.text(S.l('consultas', 'queries'), R.x + lw, y1 + sz / 2, { size: FS(S, 12), weight: 700, color: sg.ink, align: 'right', base: 'middle' });
  d.text(S.l('claves y valores', 'keys and values'), R.x + lw, y2 + sz / 2, { size: FS(S, 12), weight: 700, color: lt.ink, align: 'right', base: 'middle', w: lw });
  for (let i = 0; i < n; i++) {
    const x = x0 + i * pitch + (pitch - sz) / 2, gi = Math.floor(i / 4), cx = x0 + (gi * 4 + 1.5) * pitch + pitch / 2;
    d.withAlpha(at(0.5, 0.2 + i * 0.015), () => { d.rect(x, y1, sz, sz, { fill: alpha(sg.c, 0.55), stroke: sg.c, lw: 1 }); d.line(x + sz / 2, y1 + sz, cx, y2, alpha(lt.c, 0.5), 1); });
  }
  for (let q = 0; q < g; q++) {
    const cx = x0 + (q * 4 + 1.5) * pitch + pitch / 2, s2 = sz * 1.5;
    d.withAlpha(at(0.6, 0.9 + q * 0.08), () => d.rect(cx - s2 / 2, y2, s2, s2, { fill: lt.c, stroke: p.stage, lw: 1 }));
  }
  const ty = y2 + sz * 1.5 + 16 * u;
  show(S, S.reveal('gqa', 2.6, 0.6), () => {
    d.text(S.l(`32 cabezas de consulta comparten 8 de clave y valor: ${nf(KV8, 0, 'es')} B por token en lugar de ${nf(KV8 * 4, 0, 'es')}`, `32 query heads share 8 key-value heads: ${nf(KV8, 0, 'en')} B per token instead of ${nf(KV8 * 4, 0, 'en')}`), R.x + R.w / 2, ty, { size: FS(S, 14), weight: 700, align: 'center', base: 'top', color: p.ink, w: R.w });
    void l;
  });
}

// ═════════════ el reparto de la memoria de una GPU (y el turno 1) ═════════════
export const CTX1 = [8000, 32000, 128000];
export const maxFit = (ctx: number) => Math.floor((CAP - W8) / (ctx * KV8));

export function updateLedger(S: Frame): boolean {
  if (!S.between('try1', 'read-all')) return false;
  const st = (S.st.ledger ??= { seen: {} as Record<number, boolean> });
  const ctx = Number(S.p.ctx1 ?? 8000), users = Math.round(S.p.users1 ?? 1);
  if (holds(S, `ledger${ctx}`, users === maxFit(ctx))) st.seen[ctx] = true;   // hay que detenerse en el máximo, no pasar de largo
  return !!st.seen[8000] && !!st.seen[128000];
}

export function drawLedger(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w'), lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const demoMode = !S.on('try1');
  const ctx = demoMode ? 32000 : Number(S.p.ctx1 ?? 8000);
  const users = demoMode ? clamp(Math.floor((S.since('shared') - 1.0) / 0.9) + 1, 0, 5) : Math.round(S.p.users1 ?? 1);
  const per = ctx * KV8, free = CAP - W8, used = W8 + users * per, fits = used <= CAP, mx = maxFit(ctx);
  const barH = clamp(A.h * 0.17, 46 * u, 86 * u), by = A.y + clamp(A.h * 0.2, 34 * u, 86 * u), bx = A.x, bw = A.w;
  const a0 = S.reveal('shared', 0.1, 0.5);
  show(S, a0, () => {
    fitText(S, S.l('Memoria de una GPU de 80 GB', 'Memory of an 80 GB GPU'), A.x, A.y + 6 * u, A.w, 17, { weight: 800, base: 'top' });
    d.rect(bx, by, bw, barH, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5 });
    // pesos (una sola vez)
    const ww = bw * (W8 / CAP);
    d.rect(bx, by, ww * S.reveal('shared', 0.3, 0.6), barH, { fill: wt.c });
    // cachés, una por persona
    d.clip(bx, by, bw, barH, () => {
      for (let i = 0; i < users; i++) {
        const x = bx + ww + i * bw * (per / CAP), w = bw * (per / CAP), a = demoMode ? S.reveal('shared', 1.0 + i * 0.9, 0.5) : 1;
        d.withAlpha(a, () => { d.rect(x, by, Math.max(1, w - (w > 5 ? 1.5 : 0)), barH, { fill: alpha(lt.c, i % 2 ? 0.78 : 0.55) }); if (w > 38 * u && users <= 12) d.text(String(i + 1), x + w / 2, by + barH / 2, { size: FS(S, 13), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' }); });
      }
    });
    if (!fits) { d.rect(bx - 1, by - 1, bw + 2, barH + 2, { stroke: er.c, lw: 3 }); d.dither(bx + bw * 0.86, by, bw * 0.14, barH, er.c, 0.5, 2); }
    // escala
    [0, 20, 40, 60, 80].forEach((g) => { const x = bx + bw * (g / 80); d.line(x, by + barH, x, by + barH + 5 * u, p.lineStrong, 1.5); d.text(g === 80 ? '80 GB' : String(g), x, by + barH + 8 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: g === 0 ? 'left' : g === 80 ? 'right' : 'center', base: 'top' }); });
    // leyenda
    const ly = by - 12 * u;
    d.rect(bx, ly - 14 * u, 11 * u, 11 * u, { fill: wt.c }); d.text(S.l(`pesos del modelo, una vez (${gb(W8, 'es', 1)})`, `model weights, once (${gb(W8, 'en', 1)})`), bx + 16 * u, ly - 8.5 * u, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle' });
  });
  show(S, S.reveal('shared', 1.0, 0.5), () => {
    const ly = by + barH + 34 * u;
    d.rect(bx, ly, 11 * u, 11 * u, { fill: alpha(lt.c, 0.65) });
    d.text(S.l('caché de cada persona', 'each person’s cache'), bx + 16 * u, ly + 5.5 * u, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle' });
  });
  // lecturas
  const cy = by + barH + (S.portrait ? 68 : 86) * u, gap = 8 * u, chH = (S.portrait ? 46 : 54) * u, rowsH = S.portrait ? 2 * chH + gap : chH;   // teléfono: tarjetas en 2×2
  show(S, a0, () => {
    const n = S.portrait ? 2 : 4, cwid = (A.w - gap * (n - 1)) / n;
    const rows: [string, string, 'lat' | 'w' | 'dat' | 'err'][] = [
      [S.l('contexto por persona', 'context per person'), tok(ctx, l), 'lat'],
      [S.l('conversaciones', 'conversations'), String(users), 'lat'],
      [S.l('caché de una', 'one cache'), gb(per, l, 1), 'lat'],
      [fits ? S.l('libre', 'free') : S.l('faltan', 'missing'), gb(Math.abs(CAP - used), l, 1), fits ? 'dat' : 'err'],
    ];
    rows.forEach(([lab, v, t], i) => chip(S, { x: A.x + (i % n) * (cwid + gap), y: cy + Math.floor(i / n) * (chH + gap), w: cwid, h: chH }, lab, v, t, { vsize: S.portrait ? 15 : 17 }));
    // estado
    const sy = cy + rowsH + 20 * u;
    mark(S, A.x + 10 * u, sy, fits, { r: 8 });
    const msg = !fits ? S.l('No cabe: la memoria se desborda', 'Does not fit: memory overflows') : !demoMode && users === mx ? S.l('Es el máximo: una más ya no cabe', 'That is the maximum: one more will not fit') : S.l('Cabe', 'Fits');
    tagText(S, msg, A.x + 26 * u, sy, { t: fits ? 'dat' : 'err', align: 'left', size: 15 });
    void dt;
  });
  if (!demoMode) show(S, S.reveal('try1', 0.3, 0.5), () => {
    const st = (S.st.ledger ??= { seen: {} as Record<number, boolean> }), y = cy + rowsH + (S.portrait ? 52 : 20) * u;   // teléfono: bajo el mensaje de estado
    [8000, 128000].forEach((c, i) => {
      const x = A.x + A.w - (i === 0 ? 150 : 0) * u - (i === 0 ? 0 : 0);
      void x;
    });
    const items = [8000, 128000];
    let rx = A.x + A.w;
    items.slice().reverse().forEach((c) => {
      const lab = tok(c, l), w = d.measure(lab, { size: FS(S, 13), weight: 700, font: 'mono' }) + 38 * u;
      const ok = !!st.seen[c];
      rx -= w + 8 * u;
      d.rect(rx, y - 12 * u, w, 24 * u, { fill: ok ? dt.soft : p.surface, stroke: ok ? dt.c : p.line, lw: ok ? 2 : 1.2, r: 3, dash: ok ? undefined : [4, 3] });
      d.text(lab, rx + 8 * u, y, { size: FS(S, 13), weight: 700, font: 'mono', color: ok ? dt.ink : p.mute, base: 'middle' });
      if (ok) mark(S, rx + w - 14 * u, y, true, { r: 6 }); else d.circle(rx + w - 14 * u, y, 4 * u, { stroke: p.mute, lw: 1.5 });
    });
  });
  void fitText; void brace;
}
