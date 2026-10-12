// Vista 3 · ¿Cuántas operaciones? Un FLOP con números; las dos operaciones de cada parámetro; la ida (2N) y el regreso (4N)
// sobre una barra que representa el modelo; seis por N por D; el caso de GPT-3 y qué tan grande es 10²³.
// A la izquierda (o arriba en vertical) el diagrama; a la derecha (o abajo) la cuenta, que crece una línea por segmento.
import { alpha, regions, split, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MODELS, flops } from './data';
import { chip, count, fitSize, fitText, fr, fz, kk, lineH, para, sci } from './ui';

function lay(S: Frame) {
  const all = regions(S).all, g = 16 * kk(S);
  const [diag, calc] = S.portrait ? split(all, 'v', 0.52, g) : split(all, 'h', 0.54, g);
  return { all, diag, calc };
}
/** Escritorio y tableta: todo un poco más grande; teléfono: tamaño base. */
const big = (S: Frame) => (S.portrait || S.H < 300 ? 1 : 1.18);

/** Las dos operaciones con números («flop» y «per-param»), centradas en vertical. */
function drawEquations(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, k = kk(S), b = big(S);
  const e1 = `${S.n(2.5, 1)} × ${S.n(0.3, 1)} = ${S.n(0.75, 2)}`, e2 = `${S.n(1.2, 1)} + ${S.n(0.75, 2)} = ${S.n(1.95, 2)}`;
  const chipW = d.measure('1 FLOP', { size: fz(S, 12.5), weight: 700 }) + 24 * k;
  const size = fitSize(S, e1, r.w - chipW - 14 * k, 26 * b, { weight: 800, font: 'mono' });
  const lh = size * S.u, lab = lineH(S, 12);
  const title = S.l('FLOP: una operación de punto flotante, es decir, con decimales', 'FLOP: a floating-point operation, that is, one with decimals');
  const titleLines = d.wrap(title, r.w, { size: fz(S, 13.5 * b), weight: 700 }).length;
  const titleH = titleLines * lineH(S, 13.5 * b);
  const total = titleH + 14 * k + lab + 4 * k + lh + 6 * k + lab + 14 * k + lh + 6 * k + lab;
  let y = r.y + Math.max(0, (r.h - total) / 2);
  para(S, title, r.x, y, r.w, { size: 13.5 * b, weight: 700, color: p.ink2, a: S.reveal('flop', 0.1, 0.6) * a });
  y += titleH + 14 * k + lab + 4 * k;
  const y1 = y, y2 = y1 + lh + 6 * k + lab + 14 * k;
  const x0 = r.x, w1 = d.measure(e1, { size, weight: 800, font: 'mono' });
  // la multiplicación aparece cuando la voz la nombra; la suma, después
  const aMul = fr(S, 'flop', 0.62, 0.78) * a, aSum = fr(S, 'flop', 0.82, 0.95) * a;
  d.text(e1, x0, y1, { size, weight: 800, font: 'mono', color: p.ink, base: 'top', a: aMul });
  chip(S, '1 FLOP', x0 + w1 + 12 * k, y1 + lh / 2, 'dat', { align: 'left', a: aMul });
  d.text(e2, x0, y2, { size, weight: 800, font: 'mono', color: p.ink, base: 'top', a: aSum });
  chip(S, '1 FLOP', x0 + d.measure(e2, { size, weight: 800, font: 'mono' }) + 12 * k, y2 + lh / 2, 'dat', { align: 'left', a: aSum });
  // «per-param»: el 0.3 es el peso (un parámetro); el 2.5, el número que llega; el 1.2, el total que se va acumulando
  const pa = fr(S, 'per-param', 0.15, 0.3) * a, pb = fr(S, 'per-param', 0.4, 0.55) * a;
  if (pa > 0.01) {
    const xs = x0 + d.measure(`${S.n(2.5, 1)} × `, { size, weight: 800, font: 'mono' }), ws = d.measure(S.n(0.3, 1), { size, weight: 800, font: 'mono' });
    d.rect(xs - 3 * k, y1 - 3 * k, ws + 6 * k, lh + 6 * k, { stroke: tone(S, 'w').c, lw: 2, r: 3, fill: alpha(tone(S, 'w').c, 0.12), a: pa });
    d.text(S.l('peso: un parámetro', 'weight: one parameter'), xs + ws / 2, y1 + lh + 6 * k, { size: fz(S, 12), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'top', a: pa });
    d.text(S.l('número que llega', 'incoming number'), x0, y1 - 4 * k, { size: fz(S, 12), weight: 800, color: tone(S, 'sig').ink, base: 'bottom', a: pa });
  }
  if (pb > 0.01) {
    const wt = d.measure(S.n(1.2, 1), { size, weight: 800, font: 'mono' });
    d.rect(x0 - 3 * k, y2 - 3 * k, wt + 6 * k, lh + 6 * k, { stroke: p.ink2, lw: 1.6, r: 3, dash: [4, 3], a: pb });
    d.text(S.l('el total que se acumula', 'the running total'), x0, y2 + lh + 6 * k, { size: fz(S, 12), weight: 800, color: p.ink2, base: 'top', a: pb });
  }
}

/** La barra del modelo con la ida (2N) y el regreso (4N); debajo, los D tokens. Todo centrado en vertical. */
function drawBar(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, k = kk(S), wT = tone(S, 'w'), b = big(S);
  const bw = r.w * 0.96, bh = Math.max(24 * k, Math.min(40 * k, r.h * 0.14)), bx = r.x;
  const l13 = lineH(S, 13.5 * b), l12 = lineH(S, 12);
  const subLines = d.wrap(S.l('= 2N culpa de cada peso + 2N culpa hacia atrás', '= 2N each weight’s blame + 2N blame passed back'), bw, { size: fz(S, 12), weight: 600 }).length;
  const tok = 16 * k;
  const total = l13 + 22 * k + bh + 22 * k + l13 + subLines * l12 + 18 * k + tok;
  const top = r.y + Math.max(0, (r.h - total) / 2);
  const ay1 = top + l13 + 10 * k, by = ay1 + 12 * k, ay2 = by + bh + 12 * k;
  const cells = Math.max(12, Math.floor(bw / (9 * k))), cw = bw / cells;
  d.withAlpha(a, () => {
    for (let i = 0; i < cells; i++) d.rect(bx + i * cw + 1, by + 1, cw - 2, bh - 2, { fill: alpha(wT.c, 0.35) });
    d.rect(bx, by, bw, bh, { stroke: wT.c, lw: 1.6, r: 3 });
  });
  const gpt = fr(S, 'gpt3', 0.1, 0.3);
  fitText(S, S.l('el modelo: N parámetros', 'the model: N parameters'), bx + bw / 2, by + bh / 2, bw - 12 * k, { size: 13.5 * b, weight: 800, color: p.ink, align: 'center', base: 'middle', a: a * (1 - gpt), halo: true });
  if (gpt > 0.01) fitText(S, `GPT-3: N = ${count(S, MODELS.gpt3.N)}`, bx + bw / 2, by + bh / 2, bw - 12 * k, { size: 13.5 * b, weight: 800, color: p.ink, align: 'center', base: 'middle', a: a * gpt, halo: true });
  // ida
  const fa = fr(S, 'backward', 0.08, 0.22) * a;
  if (fa > 0.01) {
    d.arrow(bx, ay1, bx + bw, ay1, tone(S, 'sig').c, 2.6, 9 * k, fa);
    fitText(S, S.l('ida: 2 · N por token', 'forward: 2 · N per token'), bx, ay1 - 6 * k, bw, { size: 13.5 * b, weight: 800, color: tone(S, 'sig').ink, base: 'bottom', a: fa });
  }
  // regreso
  const ba = fr(S, 'backward', 0.4, 0.55) * a;
  let y = ay2 + 6 * k + l13;
  if (ba > 0.01) {
    d.arrow(bx + bw, ay2, bx, ay2, tone(S, 'err').c, 2.6, 9 * k, ba);
    fitText(S, S.l('regreso: 4 · N por token', 'backward: 4 · N per token'), bx + bw, ay2 + 6 * k, bw, { size: 13.5 * b, weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'top', a: ba });
    const sa = fr(S, 'backward', 0.6, 0.75) * a;
    if (sa > 0.01) para(S, S.l('= 2N culpa de cada peso + 2N culpa hacia atrás', '= 2N each weight’s blame + 2N blame passed back'), bx, y + 2 * k, bw, { size: 12, weight: 600, color: p.ink2, a: sa, align: 'left' });
  }
  y += subLines * l12 + 18 * k;
  // los D tokens
  const ta = fr(S, 'sixnd', 0.1, 0.3) * a;
  if (ta > 0.01) {
    const n = 9, tg = 5 * k, ty = y + tok / 2;
    const lab = fr(S, 'gpt3', 0.3, 0.5) > 0 ? `× D tokens (GPT-3: ${count(S, MODELS.gpt3.D)})` : '× D tokens';
    for (let i = 0; i < n; i++) d.rect(bx + i * (tok + tg), ty - tok / 2, tok, tok, { fill: alpha(tone(S, 'lat').c, 0.35), stroke: tone(S, 'lat').c, lw: 1.2, r: 2, a: ta * fr(S, 'sixnd', 0.1 + i * 0.02, 0.2 + i * 0.02) });
    const lx = bx + n * (tok + tg) + 4 * k;
    fitText(S, lab, lx, ty, bx + bw - lx, { size: 13 * b, weight: 800, color: tone(S, 'lat').ink, base: 'middle', a: ta });
  }
}

/** 10²³ escrito con todas sus cifras («big-number»). */
function drawBigNumber(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, k = kk(S), b = big(S);
  const group = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, S.lang === 'es' ? ' ' : ',');
  const one = group('1' + '0'.repeat(23)), bigN = group('315' + '0'.repeat(21));
  const size = Math.min(fitSize(S, one, r.w, 17 * b, { weight: 700, font: 'mono' }), fitSize(S, bigN, r.w, 17 * b, { weight: 700, font: 'mono' }));
  const lh = size * S.u * 1.35, l13 = lineH(S, 13.5 * b);
  let y = r.y + Math.max(0, (r.h - (l13 * 2 + lh * 2 + 30 * k)) / 2);
  const a1 = fr(S, 'big-number', 0.15, 0.3) * a, a2 = fr(S, 'big-number', 0.35, 0.5) * a, a3 = fr(S, 'big-number', 0.65, 0.8) * a;
  fitText(S, `10²³ = ${S.l('un 1 y 23 ceros', 'a 1 and 23 zeros')}`, r.x, y, r.w, { size: 13.5 * b, weight: 800, color: p.ink2, base: 'top', a: a1 });
  y += l13 + 4 * k;
  d.text(one, r.x, y, { size, weight: 700, font: 'mono', color: p.ink, base: 'top', a: a2 });
  y += lh + 22 * k;
  fitText(S, `${sci(S, 3.15e23)} =`, r.x, y, r.w, { size: 13.5 * b, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top', a: a3 });
  y += l13 + 4 * k;
  d.text(bigN, r.x, y, { size, weight: 700, font: 'mono', color: tone(S, 'dat').ink, base: 'top', a: a3 });
}

/** La cuenta, una línea por segmento, de arriba abajo. */
function drawDerivation(S: Frame, r: Rect) {
  const { d, pal: p } = S, k = kk(S), b = big(S);
  const C3 = flops(MODELS.gpt3.N, MODELS.gpt3.D);
  const rows: { seg: string; at: number; str: string; tone?: 'sig' | 'err' | 'dat'; big?: boolean; sub?: string }[] = [
    { seg: 'per-param', at: 0.7, str: S.l('ida: 2 · N', 'forward: 2 · N'), tone: 'sig' },
    { seg: 'backward', at: 0.5, str: S.l('regreso: 4 · N', 'backward: 4 · N'), tone: 'err' },
    { seg: 'six', at: 0.35, str: S.l('total: 6 · N por token', 'total: 6 · N per token') },
    { seg: 'sixnd', at: 0.25, str: 'C ≈ 6 · N · D', tone: 'dat', big: true, sub: S.l('frente a un conteo exacto: menos de 10 % de diferencia', 'vs. an exact count: within 10%') },
    { seg: 'gpt3', at: 0.15, str: `GPT-3: 6 × ${count(S, MODELS.gpt3.N)} × ${count(S, MODELS.gpt3.D)}` },
    { seg: 'gpt3', at: 0.7, str: `= ${sci(S, C3)} FLOPs`, tone: 'dat', big: true },
  ];
  const n = rows.length, avail = r.h;
  const step = Math.min(44 * k * b, avail / (n + 1));
  let y = r.y + (S.portrait ? 0 : Math.max(0, (avail - step * (n + 1)) / 2));
  const cur = rows.reduce((m, row, i) => (fr(S, row.seg, row.at, row.at + 0.1) > 0 ? i : m), -1);
  rows.forEach((row, i) => {
    const a = fr(S, row.seg, row.at, row.at + 0.15);
    const size = fitSize(S, row.str, r.w - (row.big ? 16 * k : 0), (row.big ? 21 : 17) * b, { weight: 800, font: 'mono' });
    const dim = i === cur ? 1 : 0.62;
    if (a > 0.01) {
      if (row.big) d.rect(r.x - 6 * k, y - 4 * k, Math.min(r.w + 6 * k, d.measure(row.str, { size, weight: 800, font: 'mono' }) + 16 * k), size * S.u + 8 * k, { fill: alpha(tone(S, 'dat').c, 0.1), stroke: tone(S, 'dat').c, lw: 1.4, r: 3, a: a * dim });
      d.text(row.str, r.x, y, { size, weight: 800, font: 'mono', color: row.tone ? tone(S, row.tone).ink : p.ink, base: 'top', a: a * dim });
    }
    y += step;
    if (row.sub) {
      const sa = fr(S, row.seg, 0.6, 0.75);
      if (sa > 0.01) fitText(S, row.sub, r.x, y - step * 0.12, r.w, { size: 12, weight: 600, color: p.mute, base: 'top', a: sa * dim, italic: true });
      y += step * 0.75;
    }
  });
}

export function drawFlops(S: Frame) {
  const L = lay(S);
  const eqA = 1 - fr(S, 'backward', 0, 0.25);
  if (eqA > 0.01) drawEquations(S, L.diag, eqA);
  const barA = fr(S, 'backward', 0.05, 0.3) * (1 - fr(S, 'big-number', 0, 0.2));
  if (barA > 0.01) drawBar(S, L.diag, barA);
  if (S.on('big-number')) drawBigNumber(S, L.diag, fr(S, 'big-number', 0.05, 0.25));
  drawDerivation(S, L.calc);
}
