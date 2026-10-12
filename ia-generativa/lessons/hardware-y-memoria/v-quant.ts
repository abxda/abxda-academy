// Vistas 11 a 16: cuantizar. La idea (menos bits por parámetro: 140 → 70 → 35 GB); una imagen ilustrativa con menos tonos;
// la regla con 32 pesos reales de Pythia-1.4B (un grupo) que se redondean a sus marcas; el laboratorio con 1 024 pesos reales
// cuantizados de verdad y la pérdida MEDIDA del modelo entero (real-data.ts, build-data.py); lo que se gana y la advertencia.
import { alpha, clamp, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BITS, EX, IH, IW, P, W0, bitsOf, f16bits, intBits, lossOf, picture, posterize, quantPatch, rulerMarks } from './model';
import { PATCH, SAMPLE } from './real-data';
import { ap, area, card, fitSize, fitText, gbTxt, hold, isShort, lineH, mark, measure, para, pill, provenance, splitArea, txt } from './draw';

// ═════════ la idea: menos bits por parámetro ═════════
export function drawQuantQ(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), wt = tone(S, 'w');
  const rows: [string, string, number, number][] = [
    ['FP16', f16bits(EX.f16), 140, 0.04],
    ['INT8', intBits(EX.L8, 8), 70, 0.36],
    ['INT4', intBits(EX.L4, 4), 35, 0.52],
  ];
  const nameW = measure(S, 'INT8', 15, false, 800) + 14 * u, gbW = measure(S, '140 GB', 15, true, 800) + 10 * u;
  const cell = Math.min(26 * u, (A.w - nameW - gbW - measure(S, '16 bits', 12.5, false, 700) - 26 * u) / 16), rh = Math.min((short ? 44 : 64) * u, (A.h - lineH(S, 16, 2.4)) / 3);
  const y0 = A.y + lineH(S, 16, 2) + Math.max(0, (A.h - lineH(S, 16, 2) - 3 * rh) / 2) * 0.4;
  txt(S, S.l('El mismo parámetro, con menos bits', 'The same parameter, with fewer bits'), A.x, A.y + lineH(S, 13, 0.6), { s: 13, weight: 700, c: p.mute, a: ap(S, 'quant-q', 0, 0.12) });
  rows.forEach(([name, bits, gb, at], i) => {
    const a = ap(S, 'quant-q', at, at + 0.14), y = y0 + i * rh, ch = Math.min(cell * 1.3, rh * 0.5);
    d.withAlpha(a, () => {
      txt(S, name, A.x, y + ch / 2, { s: 15, weight: 800 });
      for (let k = 0; k < bits.length; k++) {
        const x = A.x + nameW + k * cell;
        d.rect(x + 1, y, cell - 2, ch, { fill: bits[k] === '1' ? alpha(wt.c, 0.85) : alpha(wt.c, 0.08), stroke: alpha(wt.c, 0.7), lw: 1, r: 1.5 });
      }
      txt(S, S.l(`${bits.length} bits`, `${bits.length} bits`), A.x + nameW + bits.length * cell + 8 * u, y + ch / 2, { s: 12.5, weight: 700, c: p.ink2 });
      txt(S, `${gb} GB`, A.x + A.w, y + ch / 2, { s: 15, weight: 800, mono: true, c: wt.ink, align: 'right' });
    });
  });
  fitText(S, S.l('memoria del modelo de 70 mil M', 'memory of the 70B model'), A.x + A.w, y0 - lineH(S, 12, 0.9), A.w, { s: 12, weight: 600, c: p.mute, align: 'right', a: ap(S, 'quant-q', 0.1, 0.22) });
  const aN = ap(S, 'quant-q', 0.78, 0.9);
  if (aN > 0) pill(S, S.l('cuantizar: guardar con menos bits, ya entrenado', 'quantizing: storing with fewer bits, once trained'), A.x + A.w / 2, y0 + 3 * rh + lineH(S, 13, 0.6), { tone: 'lat', s: 13, a: aN });
  provenance(S, S.l('Bits reales del parámetro de Pythia-1.4B de la vista de bytes', 'Real bits of the Pythia-1.4B parameter from the bytes view'), ap(S, 'quant-q', 0, 0.12));
}

// ═════════ una imagen con menos tonos (ilustrativa) ═════════
export function drawImg(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait;
  const panels: [number, string, string, number][] = [
    [256, S.l('256 tonos', '256 shades'), S.l('8 bits', '8 bits'), 0.08],
    [16, S.l('16 tonos', '16 shades'), S.l('4 bits', '4 bits'), 0.36],
    [4, S.l('4 tonos', '4 shades'), S.l('2 bits', '2 bits'), 0.56],
    [2, S.l('2 tonos', '2 shades'), S.l('1 bit', '1 bit'), 0.76],
  ];
  const cols = port ? 2 : 4, rows = port ? 2 : 1, gap = 14 * u, labH = lineH(S, 13.5, 1.2) + lineH(S, 12, 1.2) + 6 * u;
  const pw = (A.w - gap * (cols - 1)) / cols, ph = (A.h - gap * (rows - 1)) / rows - labH;
  const cs = Math.min(pw / IW, ph / IH), W = cs * IW, H = cs * IH;
  const blockH = rows * (H + labH) + (rows - 1) * gap, y0 = A.y + Math.max(0, (A.h - blockH) / 2);
  panels.forEach(([lv, l1, l2, at], n) => {
    const a = ap(S, 'quant-img', at, at + 0.14);
    if (a <= 0) return;
    const cx = A.x + (n % cols) * (pw + gap) + (pw - W) / 2, cy = y0 + Math.floor(n / cols) * (H + labH + gap);
    d.withAlpha(a, () => {
      for (let j = 0; j < IH; j++) {
        // tramos horizontales del mismo tono: un rectángulo por tramo
        let i0 = 0, v0 = posterize(picture(0, j), lv);
        for (let i = 1; i <= IW; i++) {
          const v = i < IW ? posterize(picture(i, j), lv) : -1;
          if (v !== v0) { d.rect(cx + i0 * cs, cy + j * cs, (i - i0) * cs + 0.6, cs + 0.6, { fill: alpha(p.ink, 0.04 + 0.9 * v0) }); i0 = i; v0 = v; }
        }
      }
      d.rect(cx - 0.5, cy - 0.5, W + 1, H + 1, { stroke: p.lineStrong, lw: 1 });
      txt(S, l1, cx + W / 2, cy + H + lineH(S, 13.5, 0.7), { s: 13.5, weight: 800, align: 'center' });
      txt(S, l2, cx + W / 2, cy + H + lineH(S, 13.5, 1.2) + lineH(S, 12, 0.6), { s: 12, weight: 700, c: p.mute, align: 'center' });
    });
  });
  provenance(S, S.l('Imagen ilustrativa, generada por fórmula', 'Illustrative image, generated from a formula'), ap(S, 'quant-img', 0, 0.12));
}

// ═════════ la regla: 32 pesos reales, redondeados a sus marcas ═════════
export function drawRuler(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), wt = tone(S, 'w'), lat = tone(S, 'lat');
  const a0 = ap(S, 'quant-ruler', 0, 0.12), bits = bitsOf(S.p.bits), row = PATCH[0], top = EX.top;
  para(S, S.l('32 parámetros reales de Pythia: un grupo con su propia regla', '32 real parameters from Pythia: one group with its own ruler'), A.x, A.y, A.w, { s: 13.5, weight: 800, max: 2, a: a0 });
  const x0 = A.x + 10 * u, x1 = A.x + A.w - 10 * u, X = (v: number) => x0 + ((v + top) / (2 * top)) * (x1 - x0);
  const ry = A.y + A.h * (short ? 0.56 : 0.54), upY = ry - (short ? 46 : 70) * u, loY = ry + (short ? 30 : 46) * u;
  txt(S, S.l('originales', 'originals'), A.x, upY - (short ? 20 : 28) * u, { s: 12.5, weight: 700, c: wt.ink, a: a0 });
  const marks = bits >= 16 ? [] : rulerMarks(bits, top);
  const snap = (v: number) => (bits >= 16 ? v : marks.reduce((b, m) => (Math.abs(m - v) < Math.abs(b - v) ? m : b), marks[0]));
  d.withAlpha(a0, () => {
    d.line(x0, ry, x1, ry, p.lineStrong, 1.6);
    marks.forEach((m) => { const x = X(m); d.line(x, ry - (marks.length > 40 ? 5 : 10) * u, x, ry + (marks.length > 40 ? 5 : 10) * u, marks.length > 40 ? alpha(lat.c, 0.7) : lat.c, marks.length > 40 ? 1 : 2); });
    txt(S, '−' + S.n(top, 3), x0, loY + 18 * u, { s: 12, mono: true, c: p.mute, align: 'left' });
    txt(S, S.n(top, 3), x1, loY + 18 * u, { s: 12, mono: true, c: p.mute, align: 'right' });
    row.forEach((v, i) => {
      const xo = X(v), xq = X(snap(v)), yo = upY + (i % 3) * 7 * u;
      d.line(xo, yo, xq, loY, alpha(p.ink2, 0.35), 1);
      d.circle(xo, yo, 3.6 * u, { fill: wt.c, stroke: p.stage, lw: 1.2 });
      d.circle(xq, loY, 3.6 * u, { fill: lat.c, stroke: p.stage, lw: 1.2 });
    });
  });
  txt(S, S.l('redondeados', 'rounded'), A.x + A.w / 2, loY + 18 * u, { s: 12.5, weight: 700, c: lat.ink, align: 'center', a: a0 });
  pill(S, bits >= 16 ? S.l('sin redondear', 'not rounded') : S.l(`regla de ${bits} bits`, `${bits}-bit ruler`), A.x + A.w, upY - (short ? 20 : 28) * u, { tone: 'lat', s: 13, align: 'right', a: a0 });
  provenance(S, S.l('Pythia-1.4B, capa 14 (atención), fila 1 de la muestra: 32 pesos reales · regla = su máximo ÷ (2^(bits−1) − 1)', 'Pythia-1.4B, layer 14 (attention), row 1 of the sample: 32 real weights · ruler = its max ÷ (2^(bits−1) − 1)'), a0);
}

// ═════════ el laboratorio: 1 024 pesos reales y la pérdida medida del modelo entero ═════════
function weightGrid(S: Frame, x: number, y: number, side: number, vals: (i: number) => number) {
  const { d, pal: p } = S, cs = side / P, wt = tone(S, 'w'), sig = SAMPLE.sigma * 2.5;
  d.rect(x, y, side, side, { fill: p.surface });
  for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
    const v = vals(j * P + i);
    if (Math.abs(v) < 1e-9) continue;
    const k = clamp(Math.abs(v) / sig);
    d.rect(x + i * cs, y + j * cs, cs + 0.4, cs + 0.4, { fill: v > 0 ? alpha(wt.c, 0.12 + 0.88 * k) : alpha(p.ink, 0.1 + 0.8 * k) });
  }
  d.rect(x - 0.5, y - 0.5, side + 1, side + 1, { stroke: p.lineStrong, lw: 1 });
}

export function drawLab(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait, wt = tone(S, 'w'), er = tone(S, 'err');
  const a0 = ap(S, 'quant-real', 0, 0.12);
  const [main, side] = splitArea(S, A, port ? 0.52 : short ? 0.5 : 0.56, port ? 10 : 22);
  const bits = bitsOf(S.p.bits), prev = S.st.bitsPrev ?? bits, k = clamp((S.clock - (S.st.bitsSince ?? -1e9)) / 0.3);
  const qc = quantPatch(bits).q, qp = quantPatch(prev).q;
  // ── dos imágenes ──
  const gap = 14 * u, capH = lineH(S, 12.5, 1.4), side2 = Math.min((main.w - gap) / 2, main.h - capH - lineH(S, 12, 1.6));
  const ix = main.x + (main.w - (2 * side2 + gap)) / 2, iy = main.y + capH + Math.max(0, (main.h - capH - side2 - lineH(S, 12, 1.6)) / 2) * (port ? 0 : 0.5);
  d.withAlpha(a0, () => {
    fitText(S, S.l('originales (FP16)', 'originals (FP16)'), ix, iy - capH / 2, side2, { s: 12.5, weight: 800 });
    fitText(S, bits >= 16 ? S.l('sin cuantizar', 'not quantized') : S.l(`cuantizados a ${bits} bits`, `quantized to ${bits} bits`), ix + side2 + gap, iy - capH / 2, side2, { s: 12.5, weight: 800, c: tone(S, 'lat').ink });
    weightGrid(S, ix, iy, side2, (i) => W0[i]);
    weightGrid(S, ix + side2 + gap, iy, side2, (i) => lerp(qp[i], qc[i], k));
    fitText(S, S.l('+ positivo · − negativo · en blanco: cero', '+ positive · − negative · blank: zero'), ix, iy + side2 + lineH(S, 12, 0.8), 2 * side2 + gap, { s: 12, c: p.mute });
  });
  // ── lecturas ──
  let y = side.y;
  const zero = quantPatch(bits).zero;
  d.withAlpha(a0, () => {
    const t1 = S.l(`${bits >= 16 ? 16 : bits} bits por parámetro`, `${bits >= 16 ? 16 : bits} bits per parameter`);
    txt(S, t1, side.x, y + lineH(S, 16, 0.55), { s: 16, weight: 800, mono: true }); y += lineH(S, 16, 1.25);
    fitText(S, S.l(`en cero: ${S.n(zero * 100, 0)} % de estos ${S.n(P * P, 0)}`, `at zero: ${S.n(zero * 100, 0)}% of these ${S.n(P * P, 0)}`), side.x, y + lineH(S, 13, 0.55), side.w, { s: 13, weight: 700, c: p.ink2 });
    y += lineH(S, 13, 1.3) + (short ? 6 : 14) * u;
  });
  // ── la pérdida medida del modelo entero ──
  const aL = ap(S, 'quant-loss', 0, 0.14);
  if (aL > 0) {
    const order = [16, 8, 6, 5, 4, 3, 2], ch: Rect = { x: side.x, y: y + lineH(S, 13, 1.3), w: side.w, h: side.y + side.h - y - lineH(S, 13, 1.3) - lineH(S, 12, 1.4) };
    fitText(S, S.l('pérdida del modelo entero, medida', 'loss of the whole model, measured'), side.x, y + lineH(S, 13, 0.55), side.w, { s: 13, weight: 800, a: aL });
    const bw = ch.w / order.length, Y = (v: number) => ch.y + ch.h - (v / 12) * (ch.h - lineH(S, 12, 1.2));
    d.withAlpha(aL, () => {
      d.line(ch.x, ch.y + ch.h, ch.x + ch.w, ch.y + ch.h, p.lineStrong, 1.2);
      d.line(ch.x, Y(lossOf(16)), ch.x + ch.w, Y(lossOf(16)), p.ink2, 1.2, [4, 4]);
      order.forEach((b, i) => {
        const v = lossOf(b), x = ch.x + i * bw, cur = b === bits, broke = v > 5;
        d.rect(x + bw * 0.16, Y(v), bw * 0.68, ch.y + ch.h - Y(v), { fill: alpha(broke ? er.c : wt.c, cur ? 0.9 : 0.4), stroke: cur ? p.ink : undefined, lw: 1.6 });
        const vs = S.n(v, v >= 10 ? 1 : 2);
        fitText(S, vs, x + bw / 2, Y(v) - lineH(S, 12, 0.55), bw + 6 * u, { s: 12, weight: cur ? 800 : 600, mono: true, c: cur ? p.ink : p.ink2, align: 'center' });
        txt(S, b >= 16 ? 'FP16' : String(b), x + bw / 2, ch.y + ch.h + lineH(S, 12, 0.6), { s: 12, weight: cur ? 800 : 600, c: cur ? p.ink : p.mute, align: 'center' });
      });
    });
  }
  provenance(S, S.l('Pythia-1.4B: 1 024 pesos reales (capa 14) · pérdida medida con las 96 matrices cuantizadas, en WikiText-2', 'Pythia-1.4B: 1,024 real weights (layer 14) · loss measured with all 96 matrices quantized, on WikiText-2'), a0);
  void card; void fitSize; void hold; void mark; void gbTxt; void BITS; void neu;
}

// ═════════ lo que se gana ═════════
export function drawPay(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait, wt = tone(S, 'w');
  const a0 = ap(S, 'quant-pay', 0, 0.12);
  fitText(S, S.l('El modelo de 70 mil millones', 'The 70-billion model'), A.x, A.y + lineH(S, 16, 0.55), A.w, { s: 16, weight: 800, a: a0 });
  const rows: [string, number, number][] = [['FP16', 140, 0.05], ['INT4', 35, 0.3]];
  const top = A.y + lineH(S, 16, 1.4) + (short ? 22 : 40) * u, rh = Math.min((short ? 46 : 70) * u, A.h * 0.22);
  const nameW = measure(S, 'INT4', 15, false, 800) + 12 * u, endW = (port ? 90 : 150) * u, x0 = A.x + nameW, x1 = A.x + A.w - endW, X = (g: number) => x0 + (g / 150) * (x1 - x0);
  rows.forEach(([name, gb, at], i) => {
    const a = ap(S, 'quant-pay', at, at + 0.14), y = top + i * rh, bh = rh * 0.5, by = y + (rh - bh) / 2, ok = gb <= 80;
    d.withAlpha(a, () => {
      txt(S, name, A.x, by + bh / 2, { s: 15, weight: 800 });
      d.rect(x0, by, X(gb) - x0, bh, { fill: alpha(wt.c, 0.7), r: 2 });
      const vt = `${gb} GB`;
      if (X(gb) - x0 > measure(S, vt, 14, true, 800) + 14 * u) txt(S, vt, X(gb) - 6 * u, by + bh / 2, { s: 14, weight: 800, mono: true, c: p.stage, align: 'right' });
      else txt(S, vt, X(gb) + 6 * u, by + bh / 2, { s: 14, weight: 800, mono: true, c: wt.ink, halo: true });
      mark(S, x1 + 16 * u, by + bh / 2, ok, 7);
      fitText(S, ok ? (port ? S.l('cabe', 'fits') : S.l('cabe en 1 H100', 'fits in 1 H100')) : S.l('2 H100', '2 H100s'), x1 + 30 * u, by + bh / 2, endW - 32 * u, { s: 13, weight: 700, c: p.ink2 });
    });
  });
  d.withAlpha(ap(S, 'quant-pay', 0.25, 0.4), () => {
    d.line(X(80), top - 8 * u, X(80), top + 2 * rh, p.ink, 1.8, [5, 4]);
    txt(S, S.l('1 H100: 80 GB', '1 H100: 80 GB'), X(80), top - 11 * u, { s: 12.5, weight: 800, align: 'center', base: 'bottom', halo: true });
  });
  const aR = ap(S, 'quant-pay', 0.62, 0.76);
  if (aR > 0) {
    const t = S.l('y por cada token, 4 veces menos bytes que leer', 'and for each token, 4 times fewer bytes to read'), y = top + 2 * rh + (short ? 14 : 30) * u;
    pill(S, t, A.x + A.w / 2, y, { tone: 'sig', s: 13.5, a: aR });
  }
  provenance(S, S.l('Cuenta: 70 mil M × ½ byte · con escalas por grupo, unos 39 GB (ver «por dentro»)', 'Math: 70B × ½ byte · with per-group scales, about 39 GB (see “under the hood”)'), a0);
}

// ═════════ la advertencia ═════════
export function drawCaution(S: Frame) {
  const { pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait;
  const a0 = ap(S, 'quant-caution', 0, 0.12);
  const sc = Math.max(3, Math.round((short ? 3.4 : 4.6) * u)), nw = 24 * sc;
  const textX = port ? A.x : A.x + nw + 26 * u, textW = port ? A.w : A.w - nw - 26 * u;
  const ny = port ? A.y + 4 * u : A.y + A.h / 2 - 12 * sc;
  neu(S, port ? A.x + A.w - nw : A.x, ny, { scale: sc, mood: 'think', a: a0 });
  let y = port ? A.y + 12 * sc + 30 * u : A.y + A.h * 0.16;
  txt(S, S.l('No es gratis', 'It is not free'), textX, y + lineH(S, 20, 0.5), { s: 20, weight: 800, a: a0 }); y += lineH(S, 20, 1.3) + 6 * u;
  const lines: [string, number][] = [
    [S.l('Cada modelo resiste distinto la cuantización.', 'Every model tolerates quantization differently.'), 0.05],
    [S.l('Meta, con Llama 3: las pruebas estándar decían «igual que antes», y aun así a veces salían respuestas dañadas.', 'Meta, with Llama 3: standard benchmarks said “same as before”, and still some answers came out corrupted.'), 0.3],
  ];
  lines.forEach(([t, at]) => {
    const a = ap(S, 'quant-caution', at, at + 0.14);
    S.d.text(t, textX, y, { size: Math.max(14, 12.2 / u), weight: 600, color: p.ink2, base: 'top', w: textW, a });
    y += S.d.wrap(t, textW, { size: Math.max(14, 12.2 / u), weight: 600 }).length * lineH(S, 14, 1.3) + 10 * u;
  });
  pill(S, S.l('pruébalo con tus propias tareas', 'test it on your own tasks'), textX, y + lineH(S, 14, 0.8), { tone: 'dat', s: 14, align: 'left', a: ap(S, 'quant-caution', 0.7, 0.84) });
  provenance(S, S.l('Llama Team, AI @ Meta (2024), §6.2: cuantización a FP8 de Llama 3 405B', 'Llama Team, AI @ Meta (2024), §6.2: FP8 quantization of Llama 3 405B'), a0);
}
