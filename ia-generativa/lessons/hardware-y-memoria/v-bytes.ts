// Vistas 3 y 4: qué es un byte; los bytes de un parámetro real de Pythia-1.4B en FP32, FP16, INT8 e INT4 (sus bits de verdad)
// y la regla a la que se redondea en INT8 e INT4; después, la cuenta de un modelo de 70 mil millones, paso a paso, y las barras
// de memoria frente a una H100.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { EX, FMTS, f16bits, f32bits, intBits, weightsGB } from './model';
import { ap, area, card, fitSize, fitText, fz, hold, isShort, lineH, mark, measure, mv, pill, provenance, splitArea, txt } from './draw';

// ═════════ un byte ═════════
export function drawByte(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, wt = tone(S, 'w');
  const cs = Math.min(40 * u, (A.w * 0.8) / 8), w = cs * 8, x0 = A.x + (A.w - w) / 2, y0 = A.y + A.h * (isShort(S) ? 0.26 : 0.3);
  const a = ap(S, 'bytes-what', 0, 0.12);
  // cuenta en binario: lento al principio, rápido después
  const k = fr2(S), v = Math.min(255, Math.floor(255 * k * k));
  const bits = v.toString(2).padStart(8, '0');
  d.withAlpha(a, () => {
    for (let i = 0; i < 8; i++) {
      const on = bits[i] === '1', x = x0 + i * cs;
      d.rect(x + 2, y0, cs - 4, cs - 4, { fill: on ? alpha(wt.c, 0.85) : alpha(wt.c, 0.07), stroke: wt.c, lw: 1.4, r: 2 });
      txt(S, on ? '1' : '0', x + cs / 2, y0 + (cs - 4) / 2, { s: Math.min(18, cs / u * 0.45), weight: 800, mono: true, c: on ? p.stage : wt.ink, align: 'center' });
    }
    d.rect(x0 - 4 * u, y0 - 4 * u, w + 8 * u, cs + 4 * u, { stroke: p.ink2, lw: 1.6, r: 4 });
  });
  // rótulos: un bit, un byte
  const aBit = ap(S, 'bytes-what', 0.08, 0.2), aByte = ap(S, 'bytes-what', 0.2, 0.32);
  txt(S, S.l('1 bit: 0 o 1', '1 bit: 0 or 1'), x0 + cs / 2, y0 - 16 * u, { s: 13, weight: 700, c: p.ink2, align: 'left', base: 'bottom', a: aBit });
  txt(S, S.l('1 byte = 8 bits', '1 byte = 8 bits'), x0 + w, y0 - 16 * u, { s: 15, weight: 800, align: 'right', base: 'bottom', a: aByte });
  const yv = y0 + cs + 26 * u;
  txt(S, S.l(`valor: ${v}`, `value: ${v}`), A.x + A.w / 2, yv, { s: 15, weight: 700, mono: true, c: wt.ink, align: 'center', a: ap(S, 'bytes-what', 0.3, 0.42) });
  txt(S, S.l('256 valores posibles, de 0 a 255', '256 possible values, from 0 to 255'), A.x + A.w / 2, yv + lineH(S, 15, 1.4), { s: 13.5, weight: 700, c: p.ink2, align: 'center', a: ap(S, 'bytes-what', 0.42, 0.55), w: A.w });
  const aGB = ap(S, 'bytes-what', 0.72, 0.84), yg = yv + lineH(S, 15, 1.4) + lineH(S, 13.5, 1.3) + (isShort(S) ? 14 : 28) * u;
  if (aGB > 0) {
    const t = S.l(`1 gigabyte (GB) = ${S.n(1e9, 0)} bytes`, `1 gigabyte (GB) = ${S.n(1e9, 0)} bytes`), s = fitSize(S, t, A.w - 20 * u, 16, true, 800), tw = S.d.measure(t, { size: s, weight: 800, font: 'mono' });
    card(S, { x: A.x + (A.w - tw) / 2 - 14 * u, y: yg - lineH(S, 16, 0.5) - 8 * u, w: tw + 28 * u, h: lineH(S, 16, 1) + 16 * u }, { tone: 'w', a: aGB });
    txt(S, t, A.x + A.w / 2, yg, { s, weight: 800, mono: true, c: wt.ink, align: 'center', a: aGB });
  }
  provenance(S, S.l('Un byte cuenta de 0 a 255 en binario', 'A byte counts from 0 to 255 in binary'), a);
}
const fr2 = (S: Frame) => clamp(((S.t - S.start('bytes-what')) / Math.max(0.6, S.end('bytes-what') - S.start('bytes-what')) - 0.32) / 0.4);

// ═════════ los bytes de un parámetro, formato por formato ═════════
const ROWS = [
  { seg: 'fp32', name: 'FP32', bytes: 4, bits: () => f32bits(EX.f16), val: (S: Frame) => S.n(EX.f16, 8), note: { es: 'unas 7 cifras', en: 'about 7 digits' } },
  { seg: 'fp16', name: 'FP16', bytes: 2, bits: () => f16bits(EX.f16), val: (S: Frame) => S.n(EX.f16, 5), note: { es: 'unas 3 cifras', en: 'about 3 digits' } },
  { seg: 'int8', name: 'INT8', bytes: 1, bits: () => intBits(EX.L8, 8), val: (S: Frame) => '≈ ' + S.n(EX.q8, 5), note: { es: `marca ${EX.L8} de la regla`, en: `ruler mark ${EX.L8}` } },
  { seg: 'int4', name: 'INT4', bytes: 0.5, bits: () => intBits(EX.L4, 4), val: (S: Frame) => '≈ ' + S.n(EX.q4, 5), note: { es: `marca ${EX.L4} de la regla`, en: `ruler mark ${EX.L4}` } },
];

export function drawBytes(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, wt = tone(S, 'w'), lat = tone(S, 'lat');
  const short = isShort(S), aHead = ap(S, 'fp32', 0, 0.12);
  // cabecera
  const hy = A.y + lineH(S, 13, 0.6);
  const legend = S.l('▪ = 1 bit · 8 bits = 1 byte', '▪ = 1 bit · 8 bits = 1 byte'), head = S.l('Un parámetro real de Pythia-1.4B', 'A real parameter from Pythia-1.4B');
  const both = measure(S, legend, 12) + measure(S, head, 13, false, 700) + 20 * u <= A.w;
  fitText(S, head, A.x, hy, both ? A.w * 0.6 : A.w, { s: 13, weight: 700, c: p.mute, a: aHead });
  if (both) txt(S, legend, A.x + A.w, hy, { s: 12, weight: 600, c: p.mute, align: 'right', a: aHead });
  // geometría
  const rulerH = ap(S, 'int8', 0, 0.01) > 0 ? (short ? 58 : 76) * u : (short ? 58 : 76) * u;
  const top = hy + lineH(S, 13, 0.6) + (short ? 6 : 12) * u, bottom = A.y + A.h - rulerH - (short ? 4 : 10) * u;
  // En vertical cada formato ocupa dos renglones: nombre y número arriba, los bytes abajo a todo lo ancho.
  const port = S.portrait;
  const rowH = Math.min((port ? 92 : short ? 62 : 74) * u, (bottom - top) / 4);
  const nameW = port ? 0 : measure(S, 'FP32', 15, false, 800) + 16 * u;
  const labW = short ? measure(S, '4 bytes', 12.5, false, 700) + 14 * u : 0;
  const valW = port ? 0 : measure(S, '≈ 0.02404785', 14, true, 700) + 8 * u + (short ? measure(S, S.l('marca 68 de la regla', 'ruler mark 68'), 12, false, 600) + 12 * u : 0);
  const byteW = Math.min(118 * u, (A.w - nameW - valW - labW - (port ? 0 : 12 * u)) / 4), cellGap = Math.max(1, byteW * 0.03);
  const sum = hold(S, 'bytes-sum');
  ROWS.forEach((r, i) => {
    const a = ap(S, r.seg, 0, 0.14);
    if (a <= 0) return;
    const y = top + i * rowH, head = port ? lineH(S, 15, 1.2) : 0;
    const bh = Math.min(byteW / 8 * 1.7, (rowH - head) * (short ? 0.62 : 0.4)), by = y + head + (port ? 2 * u : short ? (rowH - Math.min(byteW / 8 * 1.7, rowH * 0.62)) / 2 : rowH * 0.12);
    const hot = S.is(r.seg) ? 1 : 0, nameY = port ? y + lineH(S, 15, 0.55) : by + bh / 2;
    d.withAlpha(a, () => {
      txt(S, r.name, A.x, nameY, { s: 15, weight: 800 });
      // bytes: cajas de 8 bits
      const bits = r.bits(), nb = Math.ceil(r.bytes), perBox = r.bytes < 1 ? 4 : 8;
      for (let b = 0; b < nb; b++) {
        const bx = A.x + nameW + b * byteW, boxW = r.bytes < 1 ? byteW / 2 : byteW, cw = (boxW - 3 * u - cellGap * (perBox + 1)) / perBox;
        d.rect(bx, by, boxW - 3 * u, bh, { stroke: hot ? p.ink : p.lineStrong, lw: hot ? 1.6 : 1.1, r: 2 });
        for (let k = 0; k < perBox; k++) {
          const on = bits[b * 8 + k] === '1';
          d.rect(bx + cellGap + k * (cw + cellGap), by + 2, cw, bh - 4, { fill: on ? alpha(wt.c, 0.88) : alpha(wt.c, 0.08) });
        }
      }
      // bytes por parámetro (se resaltan en el resumen)
      const lab = r.bytes < 1 ? S.l('½ byte', '½ byte') : r.bytes === 1 ? '1 byte' : `${r.bytes} bytes`;
      const ly = short ? by + bh / 2 : by + bh + lineH(S, 12.5, 0.75), lx = short ? A.x + nameW + 4 * byteW + 8 * u : A.x + nameW;
      if (sum > 0.01) pill(S, lab, lx, ly + 1, { tone: 'w', s: 12.5, align: 'left', a: sum });
      txt(S, lab, lx, ly, { s: 12.5, weight: 700, c: wt.ink, a: 1 - sum });
      // el número guardado
      const vx = A.x + A.w, note = S.l(r.note.es, r.note.en);
      if (short) {
        txt(S, note, vx, nameY, { s: 12, weight: 600, c: p.mute, align: 'right' });
        txt(S, r.val(S), vx - measure(S, note, 12, false, 600) - 10 * u, nameY, { s: 14, weight: 700, mono: true, align: 'right', c: hot ? p.ink : p.ink2 });
      } else {
        txt(S, r.val(S), vx, nameY, { s: 14, weight: 700, mono: true, align: 'right', c: hot ? p.ink : p.ink2 });
        txt(S, note, vx, ly, { s: 12, weight: 600, c: p.mute, align: 'right' });
      }
    });
  });
  // la regla de INT8 e INT4
  const aR = ap(S, 'int8', 0.3, 0.45);
  if (aR > 0) {
    const ry = A.y + A.h - rulerH * 0.42, rx0 = A.x + measure(S, S.l('regla de INT8', 'INT8 ruler'), 12.5, false, 800) + 14 * u, rx1 = A.x + A.w - 8 * u, top4 = EX.top;
    const X = (v: number) => rx0 + ((v + top4) / (2 * top4)) * (rx1 - rx0);
    const k4 = ap(S, 'int4', 0, 0.15), cur4 = k4 > 0.5;
    d.withAlpha(aR, () => {
      txt(S, cur4 ? S.l('regla de INT4', 'INT4 ruler') : S.l('regla de INT8', 'INT8 ruler'), A.x, ry, { s: 12.5, weight: 800, c: lat.ink });
      d.line(rx0, ry, rx1, ry, p.lineStrong, 1.5);
      // marcas: 255 (INT8) o 15 (INT4)
      d.withAlpha(1 - k4, () => { for (let q = -127; q <= 127; q++) { const x = X((q * top4) / 127); d.line(x, ry - 5 * u, x, ry + 5 * u, alpha(lat.c, 0.75), 1); } });
      d.withAlpha(k4, () => { for (let q = -7; q <= 7; q++) { const x = X((q * top4) / 7); d.line(x, ry - 9 * u, x, ry + 9 * u, lat.c, 2); } });
      txt(S, '−' + S.n(top4, 3), rx0, ry + 18 * u, { s: 12, mono: true, c: p.mute, align: 'left' });
      txt(S, S.n(top4, 3), rx1, ry + 18 * u, { s: 12, mono: true, c: p.mute, align: 'right' });
      // el parámetro (arriba) y dónde queda (abajo)
      const xw = X(EX.f16), q = cur4 ? EX.q4 : EX.q8, xq = X(q);
      d.polygon([[xw, ry - 4 * u], [xw - 6 * u, ry - 16 * u], [xw + 6 * u, ry - 16 * u]], { fill: wt.c });
      txt(S, S.n(EX.f16, 5), xw, ry - 20 * u, { s: 12.5, weight: 700, mono: true, c: wt.ink, align: 'center', base: 'bottom', halo: true });
      d.circle(xq, ry, 4.5 * u, { fill: lat.c, stroke: p.stage, lw: 1.5 });
      if (cur4) txt(S, S.n(q, 5) + ' ←', xq - 2 * u, ry + 18 * u, { s: 12.5, weight: 800, mono: true, c: lat.ink, align: 'right', halo: true, a: ap(S, 'int4', 0.45, 0.6) });
    });
  }
  provenance(S, S.l('Pythia-1.4B, capa 14 (atención): bits reales de un parámetro · regla del grupo de 32 al que pertenece', 'Pythia-1.4B, layer 14 (attention): real bits of one parameter · the ruler of its group of 32'), aHead);
  void mv;
}

// ═════════ la cuenta de 70 mil millones, despacio ═════════
export function drawCount(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, wt = tone(S, 'w');
  const short = isShort(S), port = S.portrait;
  const [eq, bars] = splitArea(S, A, port ? 0.44 : 0.47, port ? 10 : 22);
  // ── la ecuación ──
  const a1 = ap(S, 'count-n', 0, 0.14), a2 = ap(S, 'count-b', 0, 0.15), a2b = ap(S, 'count-b', 0.5, 0.64), a3 = ap(S, 'count-gb', 0.45, 0.6);
  const big = S.n(70e9, 0), bytes = S.n(140e9, 0);
  const s1 = fitSize(S, big, eq.w, port ? 26 : 32, true, 800), s2 = fitSize(S, `= ${bytes} bytes`, eq.w, port ? 17 : 20, true, 800);
  const gapL = (short ? 6 : port ? 7 : 14) * u;
  const hTot = lineH(S, s1, 1.05) + lineH(S, 12.5, 1.3) + gapL + lineH(S, 20, 1.1) + lineH(S, s2, 1.1) + gapL + lineH(S, port ? 26 : 34, 1.05) + lineH(S, 12.5, 1.3);
  let y = eq.y + Math.max(0, (eq.h - hTot) / 2);
  txt(S, big, eq.x, y + lineH(S, s1, 0.52), { s: s1, weight: 800, mono: true, c: wt.ink, a: a1 }); y += lineH(S, s1, 1.05);
  fitText(S, S.l('parámetros · como Llama 3.1 70B', 'parameters · like Llama 3.1 70B'), eq.x, y + lineH(S, 12.5, 0.6), eq.w, { s: 12.5, c: p.ink2, a: a1 }); y += lineH(S, 12.5, 1.3) + gapL;
  txt(S, S.l('× 2 bytes', '× 2 bytes'), eq.x, y + lineH(S, 20, 0.55), { s: 20, weight: 800, mono: true, a: a2 });
  txt(S, S.l('por parámetro, en FP16', 'per parameter, in FP16'), eq.x + measure(S, '× 2 bytes', 20, true, 800) + 10 * u, y + lineH(S, 20, 0.55), { s: 12.5, c: p.ink2, a: a2 });
  y += lineH(S, 20, 1.1);
  txt(S, `= ${bytes} bytes`, eq.x, y + lineH(S, s2, 0.55), { s: s2, weight: 800, mono: true, a: a2b }); y += lineH(S, s2, 1.1) + gapL;
  const sG = port ? 26 : 34;
  txt(S, '= 140 GB', eq.x, y + lineH(S, sG, 0.52), { s: sG, weight: 800, mono: true, c: wt.ink, a: a3 }); y += lineH(S, sG, 1.05);
  fitText(S, S.l(`porque 1 GB = ${S.n(1e9, 0)} bytes`, `because 1 GB = ${S.n(1e9, 0)} bytes`), eq.x, y + lineH(S, 12.5, 0.6), eq.w, { s: 12.5, c: p.ink2, a: ap(S, 'count-gb', 0, 0.15) });

  // ── las barras ──
  const aB = ap(S, 'count-fit', 0, 0.14);
  if (aB > 0) {
    const rowsY = bars.y + lineH(S, 13, 1.2) + lineH(S, 12.5, 1.2) + (short ? 12 : 22) * u, axisH = lineH(S, 12, 1.3) + 6 * u;
    const rowH = Math.min(48 * u, (bars.y + bars.h - rowsY - axisH) / 4), nameW = measure(S, 'FP32', 14, false, 800) + 10 * u, endW = (port ? 90 : 96) * u;
    const x0 = bars.x + nameW, x1 = bars.x + bars.w - endW, X = (g: number) => x0 + (g / 300) * (x1 - x0);
    fitText(S, S.l('Memoria de los parámetros, en GB', 'Memory for the parameters, in GB'), bars.x, bars.y + lineH(S, 13, 0.6), bars.w, { s: 13, weight: 800, a: aB });
    // eje
    d.withAlpha(aB, () => {
      const ay = rowsY + 4 * rowH;
      d.line(x0, ay, x1, ay, p.lineStrong, 1.2);
      [0, 100, 200, 300].forEach((g) => { d.line(X(g), ay, X(g), ay + 4 * u, p.lineStrong, 1.2); txt(S, String(g), X(g), ay + 6 * u, { s: 12, mono: true, c: p.mute, align: 'center', base: 'top' }); });
    });
    FMTS.forEach((f, i) => {
      const gb = weightsGB(70e9, f.bytes), at = f.id === 'fp16' ? 0 : f.id === 'fp32' ? 0.08 : f.id === 'int8' ? 0.36 : 0.72;
      const a = f.id === 'fp16' ? aB : ap(S, 'count-prec', at, at + 0.14);
      if (a <= 0) return;
      const y = rowsY + i * rowH, bh = rowH * 0.5, by = y + (rowH - bh) / 2, grow = f.id === 'fp16' ? ap(S, 'count-fit', 0.05, 0.3) : ap(S, 'count-prec', at, at + 0.2);
      d.withAlpha(a, () => {
        txt(S, f.name, bars.x, by + bh / 2, { s: 14, weight: 800 });
        d.rect(x0, by, Math.max(1, (X(gb) - x0) * grow), bh, { fill: alpha(wt.c, f.id === 'fp16' ? 0.8 : 0.6), stroke: wt.c, lw: 1.2, r: 2 });
        const vt = S.n(gb, 0), inside = X(gb) - x0 > measure(S, vt, 13, true, 800) + 14 * u;
        if (inside) txt(S, vt, x0 + (X(gb) - x0) * grow - 6 * u, by + bh / 2, { s: 13, weight: 800, mono: true, c: p.stage, align: 'right', a: grow });
        else txt(S, vt, X(gb) + 6 * u, by + bh / 2, { s: 13, weight: 800, mono: true, c: wt.ink, halo: true, a: grow });
        const ok = gb <= 80, mx = x1 + 16 * u;
        mark(S, mx, by + bh / 2, ok, 6.5, grow);
        const verdict = ok ? (gb > 64 ? S.l('justo', 'barely') : S.l('cabe', 'fits')) : `${Math.ceil(gb / 80)} H100`;
        fitText(S, verdict, mx + 13 * u, by + bh / 2, endW - 30 * u, { s: 12.5, weight: 700, c: p.ink2, a: grow });
      });
    });
    // la raya de la H100
    const aL = ap(S, 'count-fit', 0.12, 0.28);
    d.withAlpha(aL, () => {
      d.line(X(80), rowsY - 8 * u, X(80), rowsY + 4 * rowH, p.ink, 1.8, [5, 4]);
      txt(S, S.l('1 H100: 80 GB', '1 H100: 80 GB'), X(80), rowsY - 11 * u, { s: 12.5, weight: 800, align: 'center', base: 'bottom', halo: true });
    });
  }
  provenance(S, S.l('Llama 3.1 70B: Meta (2024) · solo los parámetros; usar el modelo pide algo más de memoria', 'Llama 3.1 70B: Meta (2024) · parameters only; using the model takes some extra memory'), a1);
  void card; void fz; void clamp;
}
export type { Rect };
