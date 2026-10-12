// Vistas 7 y 8: el ancho de banda. La memoria y los núcleos unidos por un tubo por el que viajan los números; cuánto pasa por
// segundo en una H100 (ficha de NVIDIA) y en una RTX 3060 (medido); al escribir, cada token exige leer todo el modelo, y eso pone
// un techo de tokens por segundo. Después, el «muro»: en lo que llega un parámetro, la H100 podría hacer unas 590 operaciones.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { H100, OPS_PER_PARAM, RTX_BW_MEASURED } from './model';
import { ap, area, card, fitSize, fitText, fr, hold, isShort, lineH, measure, para, paraH, provenance, txt } from './draw';

const WORDS = { es: ['El', ' gato', ' duerme', ' sobre', ' la', ' silla', ' de', ' la'], en: ['The', ' cat', ' sleeps', ' on', ' the', ' old', ' chair', ' by'] };

export function drawPipe(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait;
  const wt = tone(S, 'w'), dat = tone(S, 'dat'), sg = tone(S, 'sig');
  const a0 = ap(S, 'bw-what', 0, 0.12);
  // ── la memoria, el tubo y los núcleos ──
  const hp = A.h * (short ? 0.42 : port ? 0.4 : 0.44), cy = A.y + hp * 0.5;
  const bw = Math.min(A.w * 0.24, 150 * u), bh = Math.min(hp * 0.72, bw * 1.05);
  const mem: Rect = { x: A.x, y: cy - bh / 2, w: bw, h: bh }, cor: Rect = { x: A.x + A.w - bw, y: cy - bh / 2, w: bw, h: bh };
  const px0 = mem.x + mem.w, px1 = cor.x, ph = Math.min(26 * u, bh * 0.3);
  const reading = S.on('bw-token');
  d.withAlpha(a0, () => {
    d.rect(mem.x, mem.y, mem.w, mem.h, { fill: alpha(wt.c, 0.14), stroke: wt.c, lw: 1.6, r: 4 });
    for (let k = 1; k < 5; k++) d.line(mem.x + 4, mem.y + (mem.h * k) / 5, mem.x + mem.w - 4, mem.y + (mem.h * k) / 5, alpha(wt.c, 0.5), 1);
    d.rect(cor.x, cor.y, cor.w, cor.h, { fill: p.surface, stroke: p.ink2, lw: 1.6, r: 4 });
    const n = 6, g = 3 * u, cs = (cor.w - g * (n + 1)) / n, rows = Math.floor((cor.h - g) / (cs + g));
    for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
      const lit = 0.5 + 0.5 * Math.sin(S.clock * 3 - (i + j) * 0.6);
      d.rect(cor.x + g + i * (cs + g), cor.y + (cor.h - rows * (cs + g) + g) / 2 + j * (cs + g), cs, cs, { fill: alpha(dat.c, 0.15 + 0.55 * lit) });
    }
    txt(S, S.l('memoria', 'memory'), mem.x + mem.w / 2, mem.y + mem.h + lineH(S, 13, 0.7), { s: 13, weight: 800, c: wt.ink, align: 'center' });
    txt(S, S.l('núcleos', 'cores'), cor.x + cor.w / 2, cor.y + cor.h + lineH(S, 13, 0.7), { s: 13, weight: 800, c: dat.ink, align: 'center' });
    // el tubo
    d.line(px0, cy - ph / 2, px1, cy - ph / 2, p.lineStrong, 1.5);
    d.line(px0, cy + ph / 2, px1, cy + ph / 2, p.lineStrong, 1.5);
    const nd = 9;
    for (let k = 0; k < nd; k++) {
      const t = (S.clock * 0.55 + k / nd) % 1, x = px0 + (px1 - px0) * t;
      d.rect(x - 3.5 * u, cy - 3.5 * u, 7 * u, 7 * u, { fill: sg.c, a: Math.sin(Math.PI * t) });
    }
  });
  // nombre del tubo
  const aName = ap(S, 'bw-what', 0.6, 0.75);
  if (aName > 0) {
    const t = S.l('ancho de banda: bytes por segundo', 'bandwidth: bytes per second'), w = px1 - px0 - 12 * u, h = paraH(S, t, w, { s: 13.5, weight: 800 });
    para(S, t, px0 + 6 * u, cy - ph / 2 - 8 * u - h, w, { s: 13.5, weight: 800, c: sg.ink, align: 'center', a: aName });
  }
  // el modelo dentro de la memoria (desde bw-token)
  const aM = ap(S, 'bw-token', 0.55, 0.7);
  if (aM > 0) {
    d.withAlpha(aM, () => {
      txt(S, '8 GB', mem.x + mem.w / 2, cy, { s: 16, weight: 800, mono: true, c: wt.ink, align: 'center', halo: true });
      fitText(S, S.l('8 mil M en INT8', '8B in INT8'), mem.x, mem.y + mem.h + lineH(S, 13, 1.25) + lineH(S, 12, 0.5), Math.max(mem.w, (px1 - px0) * 0.8), { s: 12, weight: 700, c: p.ink2 });
    });
  }

  // ── abajo: los dos anchos de banda (bw-numbers), luego los tokens y el techo (bw-token, bw-rate) ──
  const by0 = Math.max(A.y + hp + (short ? 12 : 24) * u, mem.y + mem.h + lineH(S, 13, 1.25) + lineH(S, 12, 1.3) + 8 * u), bandH = A.y + A.h - by0;
  const aNum = hold(S, 'bw-numbers', 'bw-token');
  if (aNum > 0.01) {
    const rows: [string, number, string][] = [
      ['H100', H100.bwGBs, S.l(`${S.n(H100.bwGBs, 0)} GB/s`, `${S.n(H100.bwGBs, 0)} GB/s`)],
      ['RTX 3060', RTX_BW_MEASURED, S.l(`≈ ${S.n(330, 0)} GB/s, medido`, `≈ ${S.n(330, 0)} GB/s, measured`)],
    ];
    const rh = Math.min(bandH / 2, lineH(S, 13, 1.2) + 26 * u), barH = Math.min(18 * u, rh - lineH(S, 13, 1.2) - 6 * u);
    rows.forEach(([name, v, lab], i) => {
      const a = aNum * ap(S, 'bw-numbers', 0.05 + i * 0.4, 0.2 + i * 0.4), y = by0 + i * rh;
      d.withAlpha(a, () => {
        txt(S, name, A.x, y + lineH(S, 13, 0.55), { s: 13, weight: 800 });
        txt(S, lab, A.x + A.w, y + lineH(S, 13, 0.55), { s: 13, weight: 700, mono: true, c: sg.ink, align: 'right' });
        const yb = y + lineH(S, 13, 1.2), grow = ap(S, 'bw-numbers', 0.1 + i * 0.4, 0.35 + i * 0.4);
        d.rect(A.x, yb, A.w, barH, { fill: alpha(p.ink, 0.04), stroke: p.line, lw: 1, r: 2 });
        d.rect(A.x, yb, Math.max(2, A.w * (v / H100.bwGBs) * grow), barH, { fill: alpha(sg.c, 0.7), r: 2 });
      });
    });
  }
  const aTok = ap(S, 'bw-token', 0.08, 0.2);
  if (aTok > 0.01) {
    // un token por cada lectura completa de los 8 GB (el ritmo es ilustrativo, no el real)
    const T = 1.5, since = S.since('bw-token'), passes = Math.floor(Math.max(0, since - 0.6) / T), part = (Math.max(0, since - 0.6) % T) / T;
    const words = WORDS[S.lang], shown = Math.min(words.length, passes);
    const ty = by0 + lineH(S, 13, 0.55);
    txt(S, S.l('lectura de los 8 GB', 'reading the 8 GB'), A.x, ty, { s: 12.5, weight: 700, c: p.ink2, a: aTok });
    const lw = Math.min(A.w * 0.45, 220 * u), lx = A.x + A.w - lw, lh = 10 * u;
    d.withAlpha(aTok, () => {
      d.rect(lx, ty - lh / 2, lw, lh, { fill: alpha(p.ink, 0.05), stroke: p.line, lw: 1, r: 2 });
      d.rect(lx, ty - lh / 2, lw * (shown >= words.length ? 1 : part), lh, { fill: alpha(wt.c, 0.75), r: 2 });
    });
    // los tokens que salen
    let x = A.x; const y2 = ty + lineH(S, 13, 1.2) + 14 * u, chipH = lineH(S, 14, 1) + 10 * u;
    for (let i = 0; i < shown; i++) {
      const w = measure(S, words[i].trim(), 14, true, 700) + 14 * u;
      if (x + w > A.x + A.w) break;
      const a = clamp((since - 0.6 - (i + 1) * T) / 0.3 + 1) * aTok;
      d.withAlpha(a, () => {
        d.rect(x, y2 - chipH / 2, w, chipH, { fill: alpha(tone(S, 'lat').c, 0.14), stroke: tone(S, 'lat').c, lw: 1.3, r: 3 });
        txt(S, words[i].trim(), x + w / 2, y2, { s: 14, weight: 700, mono: true, c: tone(S, 'lat').ink, align: 'center' });
      });
      x += w + 6 * u;
    }
    // el techo
    const aR = ap(S, 'bw-rate', 0.05, 0.2);
    if (aR > 0) {
      const t1 = `${S.n(330, 0)} GB/s ÷ 8 GB`, t2 = S.l('≈ 41 tokens por segundo, como máximo', '≈ 41 tokens per second, at most'), one = `${t1} ${t2}`;
      const ey = y2 + chipH / 2 + (short ? 14 : 26) * u, fits1 = measure(S, one, 12, true, 800) <= A.w - 24 * u;
      const parts = fits1 ? [one] : [t1, t2], s = Math.min(...parts.map((q) => fitSize(S, q, A.w - 24 * u, short ? 15 : 17, true, 800)));
      const tw = Math.max(...parts.map((q) => S.d.measure(q, { size: s, weight: 800, font: 'mono' }))), lh = lineH(S, s, 1.25), ch = parts.length * lh + 12 * u;
      card(S, { x: A.x, y: ey, w: tw + 24 * u, h: ch }, { tone: 'sig', a: aR, fill: 0.08 });
      parts.forEach((q, i) => txt(S, q, A.x + 12 * u, ey + 6 * u + lh * (i + 0.5), { s, weight: 800, mono: true, a: aR }));
    }
  }
  provenance(S, S.l('Ficha de NVIDIA (H100 SXM) · RTX 3060: medido con measure-memory.py (copiar 1 GiB: 333 GB/s) · ritmo de la animación ilustrativo', 'NVIDIA datasheet (H100 SXM) · RTX 3060: measured with measure-memory.py (copying 1 GiB: 333 GB/s) · animation pace illustrative'), a0);
}

export function drawWall(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait, dat = tone(S, 'dat'), sg = tone(S, 'sig');
  const a0 = ap(S, 'bw-wall', 0, 0.12);
  const head = S.l('Mientras llega 1 parámetro (2 bytes), los núcleos de una H100 podrían hacer…', 'While 1 parameter (2 bytes) arrives, an H100’s cores could do…');
  const hh = Math.min(lineH(S, 15, 2.6), lines2(S, head, A.w) * lineH(S, 15, 1.3));
  S.d.text(head, A.x, A.y, { size: Math.max(15, 12.2 / u), weight: 800, color: p.ink, base: 'top', w: A.w, a: a0 });
  const footH = (short ? 40 : port ? 92 : 56) * u;
  const gr: Rect = { x: A.x, y: A.y + hh + 10 * u, w: A.w, h: A.h - hh - 10 * u - footH - 8 * u };
  const n = OPS_PER_PARAM, cols = Math.max(12, Math.round(Math.sqrt((n * gr.w) / Math.max(30, gr.h)))), rows = Math.ceil(n / cols);
  const cs = Math.min(gr.w / cols, gr.h / rows), gap = Math.max(1, cs * 0.16), gx = gr.x + (gr.w - cs * cols) / 2, gy = gr.y + (gr.h - cs * rows) / 2;
  const grow = fr(S, 'bw-wall', 0.08, 0.45) * n, used = ap(S, 'bw-wall', 0.58, 0.68);
  for (let k = 0; k < n; k++) {
    const a = clamp(grow - k + 1); if (a <= 0) break;
    const i = k % cols, j = Math.floor(k / cols), isUsed = k < 2;
    d.rect(gx + i * cs, gy + j * cs, cs - gap, cs - gap, { fill: isUsed && used > 0 ? alpha(sg.c, 0.25 + 0.75 * used) : alpha(dat.c, 0.22 - 0.1 * used), a: a * a0 });
    if (isUsed && used > 0) d.rect(gx + i * cs - 2, gy + j * cs - 2, cs - gap + 4, cs - gap + 4, { stroke: sg.c, lw: 2, a: used * a0 });
  }
  // las dos cifras, nombradas completas
  const fy = A.y + A.h - footH, aC = ap(S, 'bw-wall', 0.35, 0.48), aU = used;
  const cw = port ? A.w : (A.w - 14 * u) / 2, ch = port ? (footH - 8 * u) / 2 : footH;
  const chip = (x: number, y: number, lab: string, val: string, t: 'dat' | 'sig', a: number) => {
    card(S, { x, y, w: cw, h: ch }, { tone: t, a, fill: 0.07 });
    fitText(S, lab, x + 10 * u, y + ch * 0.32, cw - 20 * u, { s: 12, weight: 700, c: p.mute, a });
    fitText(S, val, x + 10 * u, y + ch * 0.7, cw - 20 * u, { s: short ? 14 : 16, weight: 800, mono: true, c: tone(S, t).ink, a });
  };
  chip(A.x, fy, S.l('podrían hacer', 'could do'), S.l(`≈ ${n} operaciones`, `≈ ${n} operations`), 'dat', aC);
  chip(port ? A.x : A.x + cw + 14 * u, port ? fy + ch + 8 * u : fy, S.l('con ese parámetro hacen', 'with that parameter they do'), S.l('2: multiplicar y sumar', '2: multiply and add'), 'sig', aU);
  provenance(S, S.l(`${S.n(H100.tflopsDense, 0)} billones de operaciones por segundo ÷ ${S.n(H100.bwGBs, 0)} GB/s × 2 bytes (ficha de NVIDIA, FP16 sin dispersión)`, `${S.n(H100.tflopsDense, 0)} trillion operations per second ÷ ${S.n(H100.bwGBs, 0)} GB/s × 2 bytes (NVIDIA datasheet, dense FP16)`), a0);
}
const lines2 = (S: Frame, str: string, w: number) => S.d.wrap(str, w, { size: Math.max(15, 12.2 / S.u), weight: 800 }).length;
