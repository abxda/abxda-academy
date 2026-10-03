// Acto 3 · De FLOPs a días y dinero: el MFU y la calculadora real (N × D → FLOPs → días de GPU → costo).
// Todos los valores de partida son SUPUESTOS ilustrativos (borde punteado), no precios de mercado.
import { alpha, clamp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REF, calc, count, duration, gpuHours, money, nf, sci, sig, type CalcOut, type Cluster } from './model';
import { FS, chip, fitText, op, pow10, tagText, log10 } from './ui';

/** Parámetros de la calculadora a partir de los controles (con los valores de partida si aún no existen). */
export function params(S: Frame): { N: number; D: number; cl: Cluster; out: CalcOut } {
  const N = 10 ** (S.p.logN ?? 9.845), D = 10 ** (S.p.logD ?? 11.146);
  const cl: Cluster = { gpus: Math.round(2 ** (S.p.logG ?? 8)), peakTflops: S.p.peak ?? 989, mfu: (S.p.mfu ?? 40) / 100, price: S.p.price ?? 2 };
  return { N, D, cl, out: calc(N, D, cl) };
}

export function drawAct3(S: Frame) {
  const aMfu = S.at('mfu', 0, 0.6) * (1 - S.at('chain', 0, 0.7));
  const aCalc = S.at('chain', 0, 0.7);
  const R = regions(S, 0.68);
  if (aMfu > 0.01) S.d.withAlpha(aMfu, () => drawMfu(S, R.all));
  if (aCalc > 0.01) S.d.withAlpha(aCalc, () => drawCalc(S, R));
}

// ── MFU: la fracción del pico que realmente se usa ──────────────────────────────
function drawMfu(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat');
  // barra grande: el pico y lo aprovechado
  const demoH = 40 * u, y0 = r.y + 24 * u, bx = r.x, bw = r.w;
  const fill = S.at('mfu', 0.5, 2.2, 'io') * 0.4;
  d.text(S.l('Pico de la GPU = 100 %', 'GPU peak = 100%'), bx, r.y + 2 * u, { size: FS(S, 14), weight: 700, color: p.ink2, base: 'top', a: S.reveal('mfu', 0, 0.5) });
  d.withAlpha(S.reveal('mfu', 0.1, 0.6), () => {
    d.rect(bx, y0, bw, demoH, { stroke: p.lineStrong, lw: 1.6, fill: p.surface2 });
    d.rect(bx, y0, bw * fill, demoH, { fill: alpha(dat.c, 0.85) });
  });
  if (S.at('mfu', 2.2, 2.8) > 0) {
    const a = S.reveal('mfu', 2.3, 0.5), fx = bx + bw * 0.4;
    d.withAlpha(a, () => {
      d.text(S.l('MFU ≈ 40 %', 'MFU ≈ 40%'), fx - 8 * u, y0 + demoH / 2, { size: FS(S, 17), weight: 800, font: 'mono', color: p.stage, align: 'right', base: 'middle' });
      d.text(S.l('lo que sobra se pierde en esperas y comunicación', 'the rest is lost to waiting and communication'), fx + 10 * u, y0 + demoH / 2, { size: FS(S, 12.5), weight: 600, color: p.ink2, base: 'middle', w: bw - fx + bx - 14 * u });
    });
  }
  // entrenamientos publicados
  const rows: { name: string; v: number; v2?: number; label: string }[] = [
    { name: 'GPT-3', v: REF.mfu.gpt3, label: `${S.n(REF.mfu.gpt3 * 100, 1)} %` },
    { name: 'Gopher', v: REF.mfu.gopher, label: `${S.n(REF.mfu.gopher * 100, 1)} %` },
    { name: 'Llama 3 405B', v: REF.mfu.llama3[0], v2: REF.mfu.llama3[1], label: `${REF.mfu.llama3[0] * 100}–${REF.mfu.llama3[1] * 100} %` },
    { name: 'PaLM 540B', v: REF.mfu.palm, label: `${S.n(REF.mfu.palm * 100, 1)} %` },
  ];
  const top = y0 + demoH + 26 * u, rowH = Math.min(46 * u, (r.y + r.h - top - 22 * u) / rows.length);
  d.text(S.l('En entrenamientos publicados', 'In published training runs'), bx, top - 8 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom', a: S.reveal('mfu', 3.0, 0.5) });
  rows.forEach((row, i) => {
    const a = S.reveal('mfu', 3.2 + i * 0.5, 0.5), y = top + i * rowH;
    d.withAlpha(a, () => {
      d.text(row.name, bx, y + 2 * u, { size: FS(S, 13.5), weight: 700, color: p.ink, base: 'top' });
      d.text(row.label, bx + bw, y + 2 * u, { size: FS(S, 13.5), weight: 700, font: 'mono', color: dat.ink, align: 'right', base: 'top' });
      const ty = y + 22 * u, th = Math.max(8 * u, rowH - 28 * u);
      d.rect(bx, ty, bw, th, { fill: p.surface2 });
      d.rect(bx, ty, bw * row.v, th, { fill: alpha(dat.c, 0.8) });
      if (row.v2) d.rect(bx + bw * row.v, ty, bw * (row.v2 - row.v), th, { fill: alpha(dat.c, 0.4) });
    });
  });
  d.text(S.l('PaLM (Chowdhery et al., 2022) · Llama 3 (2024)', 'PaLM (Chowdhery et al., 2022) · Llama 3 (2024)'), bx, r.y + r.h, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom', a: S.reveal('mfu', 5.0, 0.5) });
}

// ── la calculadora ──────────────────────────────────────────────────────────────
interface Cell { label: string; value: string; t: 'w' | 'lat' | 'dat' | 'ink' | 'sig' | 'err'; assume?: boolean; hot?: number }
interface Row { title: string; inputs: Cell[]; ops: string[]; result: Cell; at: number }

function drawCalc(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, lang = S.lang;
  const { N, D, cl, out } = params(S);
  const port = S.portrait, short = S.H < 380;
  const area = port ? R.all : R.main;

  const rows: Row[] = [
    { title: S.l('1 · Cómputo', '1 · Compute'), at: 0.3, ops: ['×', '×'], inputs: [
      { label: S.l('ida + vuelta', 'fwd + bwd'), value: '6', t: 'ink' },
      { label: S.l('parámetros N', 'parameters N'), value: count(N, lang), t: 'w' },
      { label: S.l('tokens D', 'tokens D'), value: count(D, lang), t: 'lat' }],
      result: { label: S.l('FLOPs de entrenamiento', 'training FLOPs'), value: sci(out.C, lang), t: 'dat' } },
    { title: S.l('2 · Clúster', '2 · Cluster'), at: 1.7, ops: ['×', '×'], inputs: [
      { label: 'GPUs', value: nf(cl.gpus, 0, lang), t: 'dat', assume: true },
      { label: S.l('pico, teraFLOPS', 'peak, teraFLOPS'), value: nf(cl.peakTflops, 0, lang), t: 'dat', assume: true },
      { label: 'MFU', value: `${nf(cl.mfu * 100, 0, lang)} %`, t: 'dat', assume: true }],
      result: { label: S.l('petaFLOP/s efectivos', 'effective petaFLOP/s'), value: sig(out.rate / 1e15, lang), t: 'dat' } },
    { title: S.l('3 · Tiempo', '3 · Time'), at: 3.1, ops: ['÷'], inputs: [
      { label: 'FLOPs', value: sci(out.C, lang, 1), t: 'dat' },
      { label: S.l('FLOP/s efectivos', 'effective FLOP/s'), value: sci(out.rate, lang, 1), t: 'dat' }],
      result: { label: S.l('tiempo', 'time'), value: duration(out.sec, lang), t: 'ink' } },
    { title: S.l('4 · Costo', '4 · Cost'), at: 4.5, ops: ['×'], inputs: [
      { label: S.l('horas de GPU', 'GPU-hours'), value: gpuHours(out.gpuHours, lang), t: 'dat' },
      { label: S.l('por GPU-hora', 'per GPU-hour'), value: lang === 'es' ? `US$ ${nf(cl.price, 2, lang)}` : `$${nf(cl.price, 2, lang)}`, t: 'dat', assume: true }],
      result: { label: S.l('costo de la corrida', 'cost of the run'), value: money(out.cost, lang), t: 'ink' } },
  ];

  // cabecera: leyenda de supuestos
  const hy = area.y + 2 * u;
  const aHead = S.reveal('chain', 0.1, 0.5);
  d.withAlpha(aHead, () => {
    const t = tone(S, 'ink');
    d.rect(area.x, hy + 2 * u, 22 * u, 14 * u, { stroke: t.c, lw: 1.4, dash: [4, 3], r: 2 });
    fitText(S, S.l('supuesto ilustrativo, no un precio de mercado', 'illustrative assumption, not a market price'), area.x + 30 * u, hy + 9 * u, area.w - 34 * u, 12.5, { weight: 700, color: p.ink2, base: 'middle' });
  });

  // geometría de filas
  const lineN = (i: number) => (port && i < 2 ? 2 : 1);
  const totalLines = rows.reduce((a, _, i) => a + lineN(i), 0);
  const titleH = short ? 0 : 17 * u, gapRow = (short ? 6 : 9) * u, gapLine = 5 * u;
  const bottomReserve = port && S.on('more-gpus') ? 74 * u : 0;
  const availH = area.h - 26 * u - bottomReserve - titleH * 4 - gapRow * 3 - gapLine * (totalLines - 4);
  const chH = clamp(availH / totalLines, 34 * u, 50 * u);
  let y = area.y + 24 * u;
  rows.forEach((row, i) => {
    const a = S.reveal('chain', row.at, 0.6), lines = lineN(i);
    const nIn = row.inputs.length, opW = 18 * u;
    // en vertical, las filas 1 y 2 reparten tres entradas arriba y el resultado debajo
    const perLine = lines === 2 ? nIn : nIn + 1;
    const cw = (area.w - opW * (perLine - 1)) / perLine;
    const hot = (S.between('chain', 'calc-out') ? (S.t - S.start('chain') > row.at && S.t - S.start('chain') < row.at + 1.4 ? 1 : 0) : 0) + (S.on('calc-out') && !S.on('try-calc') && i >= 2 ? 0.7 + 0.3 * Math.sin(S.clock * 4) : 0);
    d.withAlpha(a, () => {
      if (!short) d.text(row.title, area.x, y + 1 * u, { size: FS(S, 12.5), weight: 800, color: p.mute, base: 'top' });
      const cy = y + titleH;
      row.inputs.forEach((c, k) => {
        const x = area.x + k * (cw + opW);
        chip(S, { x, y: cy, w: cw, h: chH }, c.label, c.value, c.t, { assume: c.assume });
        if (k < nIn - 1) op(S, x + cw + opW / 2, cy + chH / 2, row.ops[k]);
      });
      if (lines === 1) {
        const x = area.x + nIn * (cw + opW);
        op(S, x - opW / 2, cy + chH / 2, '=');
        chip(S, { x, y: cy, w: cw, h: chH }, row.result.label, row.result.value, row.result.t, { hot: clamp(hot), vsize: 17 });
      } else {
        const ry = cy + chH + gapLine, rw = Math.min(area.w * 0.78, area.w - opW * 2);
        op(S, area.x + opW / 2, ry + chH / 2, '=');
        chip(S, { x: area.x + opW + 2 * u, y: ry, w: rw - opW, h: chH }, row.result.label, row.result.value, row.result.t, { hot: clamp(hot), vsize: 17 });
      }
    });
    y += titleH + chH * lines + gapLine * (lines - 1) + gapRow;
  });

  // lateral: regla de FLOPs o comparación de GPU
  const aSide = S.on('calc-out') ? S.reveal('calc-out', 0.2, 0.7) : 0;
  if (!port && aSide > 0) {
    const side = R.aside;
    if (S.on('more-gpus')) d.withAlpha(S.reveal('more-gpus', 0.3, 0.7), () => doubleCompare(S, { x: side.x, y: side.y, w: side.w, h: side.h }, N, D, cl));
    else d.withAlpha(aSide * (1 - S.at('more-gpus', 0, 0.4)), () => ruler(S, side, out.C));
  }
  if (port && S.on('more-gpus')) d.withAlpha(S.reveal('more-gpus', 0.3, 0.7), () => doubleCompare(S, { x: area.x, y: area.y + area.h - 70 * u, w: area.w, h: 68 * u }, N, D, cl));
  if (port && S.between('try-calc', 'budget-intro')) checklist(S, { x: area.x + area.w * 0.35, y: area.y - 2 * u, w: area.w * 0.65, h: 20 * u }, true);
  if (!port && S.between('try-calc', 'more-gpus')) checklist(S, { x: R.aside.x, y: R.aside.y + R.aside.h - 64 * u, w: R.aside.w, h: 64 * u }, false);
}

/** Regla vertical de cómputo (log10 FLOPs): GPT-3, Llama 3.1 y tu configuración. */
function ruler(S: Frame, r: Rect, C: number) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat');
  const top = r.y + 22 * u, bot = r.y + r.h - (S.between('try-calc', 'more-gpus') ? 74 : 8) * u, ax = r.x + 40 * u;
  const Y = (v: number) => bot - ((clamp(v, 20, 26) - 20) / 6) * (bot - top);
  d.text(S.l('cómputo (FLOPs)', 'compute (FLOPs)'), r.x, r.y + 2 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
  d.line(ax, top, ax, bot, p.lineStrong, 1.5);
  for (let v = 20; v <= 26; v++) { d.line(ax - 4 * u, Y(v), ax, Y(v), p.lineStrong, 1.5); d.text(pow10(v), ax - 8 * u, Y(v), { size: FS(S, 11.5), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
  const marks = [
    { v: log10(REF.gpt3.reported), label: 'GPT-3', t: 'lat' as const },
    { v: log10(REF.llama31.reported), label: 'Llama 3.1 405B', t: 'lat' as const },
  ];
  marks.forEach((m) => { const y = Y(m.v); d.line(ax, y, ax + 12 * u, y, tone(S, m.t).c, 2.5); d.circle(ax + 14 * u, y, 4 * u, { fill: tone(S, m.t).c, stroke: p.stage, lw: 1.5 }); tagText(S, m.label, ax + 24 * u, y, { align: 'left', t: 'ink', size: 13 }); });
  // tu configuración
  const y = Y(S.st.calcView?.v ?? log10(C));
  d.polygon([[ax + 2 * u, y], [ax + 14 * u, y - 7 * u], [ax + 26 * u, y], [ax + 14 * u, y + 7 * u]], { fill: dat.c, stroke: p.stage, lw: 1.5 });
  tagText(S, S.l('tu modelo', 'your model'), ax + 32 * u, y - 9 * u, { align: 'left', t: 'dat', size: 13 });
  tagText(S, sci(C, S.lang, 1), ax + 32 * u, y + 9 * u, { align: 'left', t: 'dat', size: 12.5, font: 'mono' });
}

function doubleCompare(S: Frame, r: Rect, N: number, D: number, cl: Cluster) {
  const { d, pal: p } = S, u = S.u, lang = S.lang;
  const a = calc(N, D, cl), b = calc(N, D, { ...cl, gpus: cl.gpus * 2 });
  const port = S.portrait, gap = 8 * u, ch = port ? r.h : Math.min(88 * u, (r.h - gap * 2 - 28 * u) / 2);
  const same = Math.abs(a.cost - b.cost) / a.cost < 1e-9;
  d.text(S.l(`${nf(cl.gpus, 0, lang)} GPU → ${nf(cl.gpus * 2, 0, lang)} GPU`, `${nf(cl.gpus, 0, lang)} GPUs → ${nf(cl.gpus * 2, 0, lang)} GPUs`), r.x, r.y + 2 * u, { size: FS(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'top', a: port ? 0 : 1 });
  const items: { label: string; value: string; t: 'ink' | 'err' | 'dat'; tag: string }[] = [
    { label: S.l('tiempo', 'time'), value: `${duration(a.sec, lang)} → ${duration(b.sec, lang)}`, t: 'dat', tag: S.l('la mitad', 'half') },
    { label: S.l('costo', 'cost'), value: `${money(a.cost, lang)} → ${money(b.cost, lang)}`, t: 'ink', tag: same ? S.l('igual', 'same') : '' },
  ];
  items.forEach((it, i) => {
    const rect: Rect = port ? { x: r.x + i * ((r.w + gap) / 2), y: r.y, w: (r.w - gap) / 2, h: ch } : { x: r.x, y: r.y + 28 * u + i * (ch + gap), w: r.w, h: ch };
    chip(S, rect, it.tag ? `${it.label} · ${it.tag}` : it.label, it.value, it.t, { hot: i === 1 ? 0.5 : 0, vsize: port ? 14 : 16 });
  });
}

/** Lista de comprobación del primer turno. */
function checklist(S: Frame, r: Rect, compact: boolean) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat');
  const st = S.st.calcGate ?? { hit: false, moved: false };
  const items = [
    { ok: st.hit, label: compact ? S.l('N, D de GPT-3', 'N, D of GPT-3') : S.l('N ≈ 175 mil M y D ≈ 300 mil M', 'N ≈ 175B and D ≈ 300B') },
    { ok: st.moved, label: compact ? S.l('GPU ×2', 'GPUs ×2') : S.l('duplicar las GPU', 'double the GPUs') },
  ];
  const lh = 22 * u;
  items.forEach((it, i) => {
    const x = compact ? r.x + i * (r.w / 2) : r.x, y = compact ? r.y + r.h / 2 : r.y + 6 * u + i * lh + lh / 2;
    d.rect(x, y - 7 * u, 14 * u, 14 * u, { stroke: it.ok ? dat.c : p.lineStrong, lw: 1.8, fill: it.ok ? alpha(dat.c, 0.25) : undefined, r: 2 });
    if (it.ok) { d.line(x + 3 * u, y, x + 6 * u, y + 3 * u, dat.ink, 2.2); d.line(x + 6 * u, y + 3 * u, x + 11 * u, y - 4 * u, dat.ink, 2.2); }
    fitText(S, it.label, x + 20 * u, y, (compact ? r.w / 2 : r.w) - 24 * u, 12.5, { weight: 700, color: it.ok ? dat.ink : p.ink2, base: 'middle' });
  });
}

/** Estado interactivo de la calculadora (corre aunque el escenario no se vea). */
/** Devuelve true cuando el turno se cumplió (N, D de GPT-3 y luego el doble de GPU). */
export function updateCalc(S: Frame): boolean {
  const { N, D, out } = params(S);
  const v = log10(out.C), st = S.st.calcView ?? (S.st.calcView = { v });
  st.v += (v - st.v) * (1 - Math.exp(-S.dt * 10));
  if (S.between('try-calc', 'budget-intro')) {
    const g = S.st.calcGate ?? (S.st.calcGate = { hit: false, moved: false, g0: 0 });
    const hit = Math.abs(log10(N / REF.gpt3.N)) < 0.045 && Math.abs(log10(D / REF.gpt3.D)) < 0.045;
    const lg = S.p.logG ?? 8;
    if (hit && !g.hit) { g.hit = true; g.g0 = lg; }
    else if (!hit) { g.hit = false; g.moved = false; }
    if (g.hit && Math.abs(lg - g.g0) >= 0.9) g.moved = true;
    return g.hit && g.moved;
  }
  return false;
}
