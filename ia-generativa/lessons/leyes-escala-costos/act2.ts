// Acto 2 · Cuánto cómputo: C ≈ 6·N·D. Qué es un FLOP, el pase hacia delante (2N), hacia atrás (4N) y la comprobación con modelos reales.
import { alpha, clamp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REF, count, sci, flops } from './model';
import { FS, chip, fitText, tagText, log10 } from './ui';

export function drawAct2(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const aFlops = 1 - S.at('fwd', 0, 0.5);
  const aGrid = S.at('fwd', 0, 0.5) * (1 - S.at('check', 0, 0.7));
  const aCheck = S.at('check', 0, 0.7);
  if (aFlops > 0.01) S.d.withAlpha(aFlops, () => drawFlop(S, R.all));
  if (aGrid > 0.01) S.d.withAlpha(aGrid, () => drawModel(S, R.all));
  if (aCheck > 0.01) S.d.withAlpha(aCheck, () => drawCheck(S, R.all));
}

// ── «1 FLOP»: una operación aritmética con decimales ────────────────────────────
function drawFlop(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat');
  const w = Math.min(r.w * 0.8, 360 * u), x = r.x + (r.w - w) / 2, h = 56 * u, gap = 16 * u;
  const y0 = r.y + r.h / 2 - (h * 2 + gap) / 2 - 20 * u;
  const rows = [`${S.n(3.1, 1)} × ${S.n(2, 1)} = ${S.n(6.2, 1)}`, `${S.n(6.2, 1)} + ${S.n(0.5, 1)} = ${S.n(6.7, 1)}`];
  rows.forEach((t, i) => {
    const a = S.reveal('flops', 0.5 + i * 0.9, 0.6), y = y0 + i * (h + gap);
    d.withAlpha(a, () => {
      d.rect(x, y, w, h, { fill: alpha(dat.c, 0.08), stroke: dat.c, lw: 1.6, r: 3 });
      d.text(t, x + 18 * u, y + h / 2, { size: FS(S, 24), weight: 700, font: 'mono', color: p.ink, base: 'middle' });
      d.tag(S.l('1 FLOP', '1 FLOP'), x + w - 14 * u, y + h / 2, { align: 'right', color: dat.ink, fill: dat.soft, stroke: dat.c, size: FS(S, 13), weight: 700 });
    });
  });
  d.withAlpha(S.reveal('flops', 2.2, 0.7), () => {
    d.text(S.l('FLOPs: operaciones de coma flotante', 'FLOPs: floating-point operations'), r.x + r.w / 2, y0 + 2 * h + gap + 34 * u, { size: FS(S, 17), weight: 800, color: dat.ink, align: 'center', base: 'middle' });
    d.text(S.l('cada suma o multiplicación con decimales cuenta una', 'each addition or multiplication with decimals counts one'), r.x + r.w / 2, y0 + 2 * h + gap + 58 * u, { size: FS(S, 13), weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w * 0.9 });
  });
}

// ── un token cruza el modelo: 2N hacia delante, 4N hacia atrás ──────────────────
function drawModel(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, wT = tone(S, 'w'), sig = tone(S, 'sig'), err = tone(S, 'err'), lat = tone(S, 'lat');
  const port = S.portrait;
  const left: Rect = port ? { x: r.x, y: r.y, w: r.w, h: r.h * 0.5 } : { x: r.x, y: r.y, w: r.w * 0.56, h: r.h };
  const right: Rect = port ? { x: r.x, y: r.y + r.h * 0.52, w: r.w, h: r.h * 0.48 } : { x: r.x + r.w * 0.6, y: r.y, w: r.w * 0.4, h: r.h };

  // la rejilla de parámetros
  const cols = port ? 10 : 12, rows = port ? 6 : 7;
  const tokW = 64 * u, gx = left.x + tokW + 22 * u, gw = left.w - tokW - 22 * u - 4 * u;
  const cs = Math.min(gw / cols, (left.h - 64 * u) / rows), gh = cs * rows;
  const gy = left.y + (left.h - gh) / 2 - 8 * u;
  const aGrid = S.reveal('fwd', 0, 0.7);
  const f = S.on('fwd') ? S.at('fwd', 0.5, 2.6, 'lin') : 0, b = S.on('bwd') ? S.at('bwd', 0.5, 2.6, 'lin') : 0;
  const stream = S.on('sixnd');
  d.withAlpha(aGrid, () => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = gx + i * cs, y = gy + j * cs, q = cs - 2 * u;
      d.rect(x, y, q, q, { fill: alpha(wT.c, 0.1), stroke: alpha(wT.c, 0.55), lw: 1 });
      const fl = clamp(f * cols - i + 0.5), bl = clamp(b * cols - (cols - 1 - i) + 0.5);
      if (fl > 0) d.rect(x + 1, y + 1, q - 2, (q - 2) / 3, { fill: alpha(sig.c, 0.22 + 0.7 * fl * (fl < 1 ? 1 : 0.55)) });
      if (bl > 0) d.rect(x + 1, y + 1 + (q - 2) / 3, q - 2, ((q - 2) * 2) / 3, { fill: alpha(err.c, 0.18 + 0.7 * bl * (bl < 1 ? 1 : 0.5)) });
    }
  });
  // etiqueta N bajo la rejilla
  d.withAlpha(aGrid, () => {
    d.line(gx, gy + gh + 8 * u, gx + cols * cs - 2 * u, gy + gh + 8 * u, wT.c, 2);
    d.text(S.l('N parámetros', 'N parameters'), gx + (cols * cs) / 2, gy + gh + 12 * u, { size: FS(S, 14), weight: 700, color: wT.ink, align: 'center', base: 'top' });
  });
  // el token (o la corriente de tokens)
  const ty = gy + gh / 2;
  d.withAlpha(aGrid, () => {
    if (!stream) {
      const x = left.x + 2 * u, w = tokW - 6 * u, h = 30 * u;
      d.rect(x, ty - h / 2, w, h, { fill: alpha(lat.c, 0.2), stroke: lat.c, lw: 1.6, r: 3 });
      d.text('token', x + w / 2, ty, { size: FS(S, 13), weight: 700, color: lat.ink, align: 'center', base: 'middle' });
      d.arrow(x + w + 2 * u, ty, gx - 4 * u, ty, p.ink2, 2, 7);
    } else {
      const a = S.reveal('sixnd', 0.2, 0.6);
      for (let k = 0; k < 4; k++) {
        const ph = (S.clock * 0.6 + k * 0.25) % 1, x = left.x + 2 * u + ph * (tokW - 6 * u) * 0.2 + (3 - k) * 0 ;
        const bx = left.x + 2 * u, w = tokW - 6 * u, h = 22 * u, y = ty - 46 * u + k * 29 * u;
        void ph; void x;
        d.rect(bx, y, w, h, { fill: alpha(lat.c, 0.2 + 0.12 * (k === 0 ? 1 : 0)), stroke: lat.c, lw: 1.4, r: 3, a });
      }
      d.text('D', left.x + 2 * u + (tokW - 6 * u) / 2, ty + 62 * u, { size: FS(S, 17), weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle', a });
      d.text(S.l('tokens', 'tokens'), left.x + 2 * u + (tokW - 6 * u) / 2, ty + 80 * u, { size: FS(S, 12.5), weight: 700, color: lat.ink, align: 'center', base: 'middle', a });
      d.arrow(left.x + tokW - 2 * u, ty, gx - 4 * u, ty, p.ink2, 2, 7, a);
    }
  });
  // etiquetas de las dos pasadas sobre la rejilla
  if (S.on('fwd')) tagText(S, S.l('hacia delante', 'forward'), gx, gy - 12 * u, { align: 'left', t: 'sig', size: 13, a: S.reveal('fwd', 0.4, 0.5) });
  if (S.on('bwd')) tagText(S, S.l('hacia atrás', 'backward'), gx + cols * cs - 2 * u, gy - 12 * u, { align: 'right', t: 'err', size: 13, a: S.reveal('bwd', 0.4, 0.5) });

  // contadores / fórmula
  const aCounters = (1 - S.at('sixnd', 0, 0.6));
  if (aCounters > 0.01 && S.on('fwd')) d.withAlpha(aCounters, () => counters(S, right));
  if (S.on('sixnd')) d.withAlpha(S.reveal('sixnd', 0.3, 0.7), () => formulaBlock(S, right));
  if (S.on('bwd') && !S.on('sixnd') && !port) neu(S, right.x + right.w - 70 * u, right.y + right.h - 58 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'wow', a: S.reveal('bwd', 2.4, 0.5) });
}

function counters(S: Frame, r: Rect) {
  const u = S.u, gap = 8 * u;
  const items: { label: string; value: string; t: 'sig' | 'err' | 'ink'; a: number; vs: number }[] = [
    { label: S.l('hacia delante', 'forward'), value: '2 N', t: 'sig', a: S.on('fwd') ? S.at('fwd', 1.4, 2.0) : 0, vs: 20 },
    { label: S.l('hacia atrás', 'backward'), value: '4 N', t: 'err', a: S.on('bwd') ? S.at('bwd', 1.4, 2.0) : 0, vs: 20 },
    { label: S.l('por cada token', 'per token'), value: '6 N', t: 'ink', a: S.on('bwd') ? S.at('bwd', 2.6, 3.4) : 0, vs: 26 },
  ];
  const port = S.portrait, ch = port ? Math.min(r.h, 64 * u) : Math.min(78 * u, (r.h - gap * 2) / 3), cw = port ? (r.w - gap * 2) / 3 : r.w;
  items.forEach((it, i) => {
    if (it.a <= 0) return;
    const rect: Rect = port ? { x: r.x + i * (cw + gap), y: r.y + 10 * u, w: cw, h: ch } : { x: r.x, y: r.y + 14 * u + i * (ch + gap), w: cw, h: ch };
    chip(S, rect, it.label, it.value, it.t, { a: it.a, vsize: it.vs, hot: i === 2 ? 0.5 : 0 });
  });
  if (port) return;
  const a = S.on('bwd') ? S.at('bwd', 2.8, 3.6) : 0;
  if (a > 0) S.d.text(S.l('operaciones por token: 2N + 4N', 'operations per token: 2N + 4N'), r.x, r.y + 14 * u + 3 * (ch + gap) + 2 * u, { size: FS(S, 12.5), weight: 600, color: S.pal.mute, base: 'top', a });
}

/** C ≈ 6·N·D con su leyenda. */
function formulaBlock(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const dat = tone(S, 'dat'), wT = tone(S, 'w'), lat = tone(S, 'lat');
  const size = FS(S, S.portrait ? 30 : 34);
  const parts: [string, string][] = [['C', dat.ink], [' ≈ ', p.mute], ['6', p.ink], [' · ', p.mute], ['N', wT.ink], [' · ', p.mute], ['D', lat.ink]];
  const widths = parts.map(([t]) => d.measure(t, { size, weight: 800, font: 'mono' }));
  const tw = widths.reduce((a, b) => a + b, 0), x0 = r.x + (r.w - tw) / 2, y = r.y + 34 * u;
  let x = x0;
  parts.forEach(([t, c], i) => { d.text(t, x, y, { size, weight: 800, font: 'mono', color: c, base: 'middle' }); x += widths[i]; });
  const lines: [string, string, string][] = [
    ['C', S.l('FLOPs de entrenamiento', 'training FLOPs'), dat.ink],
    ['6', S.l('2N + 4N por parámetro y token', '2N + 4N per parameter and token'), p.ink],
    ['N', S.l('parámetros', 'parameters'), wT.ink],
    ['D', S.l('tokens de entrenamiento', 'training tokens'), lat.ink],
  ];
  const lh = 22 * u, ly = y + 40 * u, lx = r.x + Math.max(0, (r.w - Math.min(r.w, 330 * u)) / 2);
  lines.forEach(([k, t, c], i) => {
    const a = S.reveal('sixnd', 0.8 + i * 0.35, 0.5);
    d.text(k, lx, ly + i * lh, { size: FS(S, 15), weight: 800, font: 'mono', color: c, base: 'middle', a });
    fitText(S, t, lx + 24 * u, ly + i * lh, Math.min(r.w, 330 * u) - 26 * u, 13.5, { weight: 600, color: p.ink2, base: 'middle' });
  });
  d.text(S.l('Kaplan 2020 · Hoffmann 2022: acierta a ±10 %', 'Kaplan 2020 · Hoffmann 2022: accurate to ±10%'), lx, ly + 4 * lh + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', a: S.reveal('sixnd', 2.4, 0.6), w: Math.min(r.w, 330 * u) });
}

// ── comprobación: 6·N·D frente a lo que informan GPT-3 y Llama 3.1 ──────────────
function drawCheck(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat');
  const rows = [
    { name: 'GPT-3', src: S.l('Brown et al., 2020 (tabla D.1)', 'Brown et al., 2020 (table D.1)'), N: REF.gpt3.N, D: REF.gpt3.D, rep: REF.gpt3.reported, delay: 0.4 },
    { name: 'Llama 3.1 405B', src: S.l('informe técnico de Llama 3', 'Llama 3 technical report'), N: REF.llama31.N, D: REF.llama31.D, rep: REF.llama31.reported, delay: 4.2 },
  ];
  const LO = 22, HI = 26;
  const rowH = Math.min(150 * u, (r.h - 56 * u) / 2), top = r.y + 4 * u;
  d.text(S.l('6 · N · D  frente a lo informado', '6 · N · D  versus what was reported'), r.x, top, { size: FS(S, 14), weight: 700, color: p.ink2, base: 'top' });
  rows.forEach((row, i) => {
    const a = S.reveal('check', row.delay, 0.7), y = top + 30 * u + i * rowH, C = flops(row.N, row.D);
    if (a <= 0) return;
    d.withAlpha(a, () => {
      d.rect(r.x, y, r.w, rowH - 8 * u, { fill: alpha(dat.c, 0.05), stroke: p.line, lw: 1, r: 3 });
      d.text(row.name, r.x + 10 * u, y + 8 * u, { size: FS(S, 17), weight: 800, color: p.ink, base: 'top' });
      fitText(S, `${count(row.N, S.lang)} × ${count(row.D, S.lang)} × 6`, r.x + r.w - 10 * u, y + 10 * u, r.w * 0.6, 14, { weight: 600, font: 'mono', color: p.ink2, align: 'right', base: 'top' });
      const by = y + 40 * u, bw = r.w - 20 * u, bx = r.x + 10 * u, bh = 14 * u, fr = clamp((log10(C) - LO) / (HI - LO)), fr2 = clamp((log10(row.rep) - LO) / (HI - LO));
      d.rect(bx, by, bw, bh, { fill: p.surface2 });
      d.rect(bx, by, bw * fr * a, bh, { fill: dat.c });
      d.line(bx + bw * fr2, by - 4 * u, bx + bw * fr2, by + bh + 4 * u, p.ink, 2.2);
      [22, 23, 24, 25, 26].forEach((v) => d.text(`10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[Math.floor(v / 10)]}${'⁰¹²³⁴⁵⁶⁷⁸⁹'[v % 10]}`, bx + (bw * (v - LO)) / (HI - LO), by + bh + 7 * u, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: v === 22 ? 'left' : v === 26 ? 'right' : 'center', base: 'top' }));
      const ly = by + bh + 7 * u + FS(S, 11.5) * u + 12 * u;
      d.text(`6·N·D = ${sci(C, S.lang)}`, bx, ly, { size: FS(S, 15), weight: 800, font: 'mono', color: dat.ink, base: 'top' });
      fitText(S, `${S.l('informe', 'reported')}: ${sci(row.rep, S.lang)}`, bx + bw, ly + 1 * u, bw * 0.5, 13.5, { weight: 700, font: 'mono', color: p.ink, align: 'right', base: 'top' });
      d.text(row.src, bx, ly + 24 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
    });
  });
  const a = S.reveal('check', 5.4, 0.6);
  if (a > 0) {
    const ratio = rows[1].rep / rows[0].rep;
    tagText(S, S.l(`Llama 3.1 usó ≈ ${S.n(ratio, 0)} veces el cómputo de GPT-3`, `Llama 3.1 used ≈ ${S.n(ratio, 0)}× GPT-3’s compute`), r.x + r.w / 2, r.y + r.h - 6 * u, { t: 'ink', align: 'center', base: 'bottom', size: 14, a });
  }
}
