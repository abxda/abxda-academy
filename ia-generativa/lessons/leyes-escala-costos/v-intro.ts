// Vista 1 · «Escalar»: las dos preguntas y las tres perillas (parámetros N, tokens D, cómputo C), una por segmento.
// Al empezar la gráfica de Kaplan, las tres tarjetas se mudan (sin saltar) a la columna lateral, donde siguen a la vista.
import { alpha, regions, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { MULT } from './data';
import { chip, fitText, fr, fz, kk, lerp, lineH, para } from './ui';

export type Knob = 'N' | 'D' | 'C';
const KNOBS: { k: Knob; seg: string; t: Tone }[] = [
  { k: 'N', seg: 'knob-n', t: 'w' },
  { k: 'D', seg: 'knob-d', t: 'lat' },
  { k: 'C', seg: 'knob-c', t: 'dat' },
];
const LABEL: Record<Knob, [string, string]> = { N: ['parámetros', 'parameters'], D: ['tokens de datos', 'data tokens'], C: ['cómputo', 'compute'] };
const SUB: Record<Knob, [string, string]> = {
  N: ['números que se ajustan al entrenar', 'numbers adjusted during training'],
  D: ['piezas de texto que lee', 'pieces of text it reads'],
  C: ['operaciones en todo el entrenamiento', 'operations over the whole training run'],
};

/** Las dos preguntas: grandes al centro en el gancho, arriba y pequeñas desde «escalar». */
function questionGeo(S: Frame) {
  const R = regions(S, S.portrait ? 0.64 : 0.68), all = R.all, k = kk(S);
  const t = fr(S, 'scale', 0, 0.3, 'io');
  const big = fz(S, S.portrait ? 21 : 27), small = fz(S, 14.5);
  const size = lerp(big, small, t);
  const y0 = lerp(all.y + all.h * 0.36, all.y + 2 * k, t);
  return { all, size, y0, t, lh: size * S.u * 1.3 };
}
/** Alto de la franja de preguntas una vez arriba. */
const bandH = (S: Frame) => fz(S, 14.5) * S.u * 1.3 * 2 + 12 * kk(S);

/** Rectángulos de las tarjetas: al centro (vista 1) o en la columna lateral (vistas 2). */
export function knobRects(S: Frame): { rects: Rect[]; side: number } {
  const R = regions(S, S.portrait ? 0.64 : 0.68), all = R.all, k = kk(S), g = 10 * k;
  const top = all.y + bandH(S), h = all.y + all.h - top;
  const center: Rect[] = S.portrait
    ? [0, 1, 2].map((i) => { const ch = Math.min((h - 2 * g) / 3, 96 * k); return { x: all.x, y: top + i * (ch + g), w: all.w, h: ch }; })
    : [0, 1, 2].map((i) => { const cw = (all.w - 2 * g) / 3, ch = Math.min(h * 0.86, 200 * k); return { x: all.x + i * (cw + g), y: top + (h - ch) / 2, w: cw, h: ch }; });
  const a = R.aside, gs = 8 * k;
  const aside: Rect[] = S.portrait
    ? [0, 1, 2].map((i) => { const cw = (a.w - 2 * gs) / 3, ch = Math.min(a.h, 96 * k); return { x: a.x + i * (cw + gs), y: a.y + (a.h - ch) / 2, w: cw, h: ch }; })
    : [0, 1, 2].map((i) => { const ch = Math.min((a.h - 2 * gs) / 3, 92 * k), y0 = a.y + (a.h - 3 * ch - 2 * gs) / 2; return { x: a.x, y: y0 + i * (ch + gs), w: a.w, h: ch }; });
  const side = fr(S, 'kaplan', 0, 0.3, 'io');
  const L = (p: Rect, q: Rect): Rect => ({ x: lerp(p.x, q.x, side), y: lerp(p.y, q.y, side), w: lerp(p.w, q.w, side), h: lerp(p.h, q.h, side) });
  return { rects: center.map((c, i) => L(c, aside[i])), side };
}

/** Una perilla dibujada: círculo con aguja que gira de «poco» a «mucho». */
function dial(S: Frame, cx: number, cy: number, r: number, t: Tone, turn: number, a = 1) {
  const { d, pal: p } = S, c = tone(S, t);
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = lerp(a0, a0 + (a1 - a0) * 0.85, turn);
  d.withAlpha(a, () => {
    const arc: [number, number][] = [];
    for (let i = 0; i <= 24; i++) { const q = a0 + ((a1 - a0) * i) / 24; arc.push([cx + Math.cos(q) * (r + 4 * S.u), cy + Math.sin(q) * (r + 4 * S.u)]); }
    d.polyline(arc, p.line, 1.5);
    const fill: [number, number][] = [];
    for (let i = 0; i <= 24; i++) { const q = a0 + ((ang - a0) * i) / 24; fill.push([cx + Math.cos(q) * (r + 4 * S.u), cy + Math.sin(q) * (r + 4 * S.u)]); }
    if (turn > 0.01) d.polyline(fill, c.c, 3);
    d.circle(cx, cy, r, { fill: p.surface, stroke: c.c, lw: 1.6 });
    d.line(cx, cy, cx + Math.cos(ang) * r * 0.8, cy + Math.sin(ang) * r * 0.8, c.ink, 2.4);
    d.circle(cx, cy, 2.5 * S.u, { fill: c.ink });
  });
}

/** Las preguntas del gancho (y la respuesta «menos pérdida» en «loss»). */
export function drawQuestions(S: Frame) {
  const { d, pal: p } = S, k = kk(S), q = questionGeo(S), all = q.all;
  const out = 1 - fr(S, 'kaplan', 0, 0.25);
  if (out <= 0.01) return;
  // la voz: Pythia (sus cifras) → «si lo hacemos más grande» → «¿cuánto mejora?» → «¿y cuánto cuesta?»
  const a1 = Math.max(fr(S, 'hook', 0.7, 0.8), fr(S, 'scale', 0, 0.01)) * out, a2 = Math.max(fr(S, 'hook', 0.86, 0.95), fr(S, 'scale', 0, 0.01)) * out;
  const align: CanvasTextAlign = q.t > 0.5 ? 'left' : 'center';
  const x = lerp(all.x + all.w / 2, all.x, q.t);
  const lines = [S.l('¿cuánto mejora?', 'how much better?'), S.l('¿cuánto cuesta?', 'what does it cost?')];
  // el modelo que «crece» (solo en el gancho)
  const grow = fr(S, 'hook', 0.5, 0.7, 'io'), gA = S.reveal('hook', 0, 0.6) * (1 - q.t);
  if (gA > 0.01) {
    const n = Math.round(lerp(3, 7, grow)), cell = Math.max(4, Math.min(15 * k, (all.h * 0.36 - 34 * k) / 7)), side = n * cell;
    const gx = all.x + all.w / 2 - side / 2, gy = all.y + all.h * 0.36 - side - 26 * k;
    d.withAlpha(gA, () => {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d.rect(gx + i * cell + 1, gy + j * cell + 1, cell - 2, cell - 2, { fill: alpha(tone(S, 'w').c, 0.55) });
      const sw = fr(S, 'hook', 0.48, 0.58);
      const lab1 = S.l('Pythia: 1.4 mil M de parámetros, 300 mil M de tokens', 'Pythia: 1.4B parameters, 300B tokens');
      fitText(S, lab1, all.x + all.w / 2, gy - 6 * k, all.w, { size: 12.5, weight: 700, color: p.mute, align: 'center', base: 'bottom', a: 1 - sw });
      d.text(S.l('¿y si fuera más grande?', 'what if it were bigger?'), all.x + all.w / 2, gy - 6 * k, { size: fz(S, 12.5), weight: 700, color: p.mute, align: 'center', base: 'bottom', a: sw });
    });
  }
  lines.forEach((ln, i) => {
    const y = q.y0 + i * q.lh, a = i === 0 ? a1 : a2;
    if (a > 0.01) d.text(ln, x, y, { size: q.size, weight: 800, color: p.ink, align, base: 'top', a });
  });
  // en «loss»: cómo se mide «mejora»
  const la = fr(S, 'loss', 0.25, 0.45) * out;
  if (la > 0.01) {
    const w1 = d.measure(lines[0], { size: q.size, weight: 800 });
    const tx = x + w1 + 12 * k, room = all.x + all.w - tx;
    const str = S.l('→ que baje la pérdida', '→ a lower loss');
    if (room > d.measure(str, { size: fz(S, 12.5), weight: 700 }) + 16 * k) chip(S, str, tx, q.y0 + q.lh / 2 - 1, 'err', { align: 'left', a: la, size: 12.5 });
  }
}

/** Contenido de una tarjeta. `side` 0 = tarjeta grande (vista 1), 1 = tarjeta lateral (vista 2). */
export function drawKnobs(S: Frame, hot: Partial<Record<Knob, number>> = {}) {
  const { d, pal: p } = S, k = kk(S), u = S.u;
  if (!S.on('scale')) return;
  const { rects, side } = knobRects(S);
  KNOBS.forEach((K, i) => {
    const r = rects[i], c = tone(S, K.t);
    const outline = fr(S, 'scale', 0.3 + i * 0.15, 0.5 + i * 0.15);
    const filled = fr(S, K.seg, 0.03, 0.25);
    const turn = fr(S, K.seg, 0.3, 0.75, 'io');
    if (outline < 0.01) return;
    const h = hot[K.k] ?? 0;
    d.withAlpha(outline, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: filled > 0 ? alpha(c.c, (0.06 + 0.16 * h) * filled) : p.surface, stroke: filled > 0.5 ? c.c : p.lineStrong, lw: h > 0.5 ? 2.4 : 1.4, r: 4, dash: filled > 0.5 ? undefined : [5, 4] });
      if (filled < 0.99) d.text('?', r.x + r.w / 2, r.y + r.h / 2, { size: fz(S, 22), weight: 800, color: p.mute, align: 'center', base: 'middle', a: 1 - filled });
    });
    if (filled < 0.01) return;
    const pad = 10 * k;
    // ── modo grande (vista 1)
    const big = 1 - side;
    if (big > 0.01) d.withAlpha(filled * big, () => {
      // las tarjetas grandes (escritorio) llevan todo más grande; nunca menos de 12 px
      const cs = S.portrait ? 1 : Math.max(1, Math.min(1.4, r.h / (120 * k), r.w / (210 * k)));
      const dialR = Math.min(r.h * 0.2, 18 * k * cs);
      const letterS = fz(S, (S.portrait ? 26 : 30) * cs);
      d.text(K.k, r.x + pad, r.y + pad, { size: letterS, weight: 800, font: 'mono', color: c.ink, base: 'top' });
      const lx = r.x + pad + d.measure('N', { size: letterS, weight: 800, font: 'mono' }) + 10 * k;
      const textW = r.x + r.w - pad - 2 * dialR - 12 * k - lx;
      const ly = r.y + pad + 2 * k;
      fitText(S, S.l(...LABEL[K.k]), lx, ly, textW, { size: 15 * cs, weight: 800, color: p.ink, base: 'top' });
      const subY = ly + lineH(S, 15 * cs) + 2 * k;
      const subH = para(S, S.l(...SUB[K.k]), lx, subY, textW, { size: 12.5 * cs, weight: 600, color: p.ink2 });
      const ex = K.k === 'N' ? S.l('GPT-3: 175 mil M', 'GPT-3: 175B') : K.k === 'D' ? S.l('GPT-3: 300 mil M', 'GPT-3: 300B') : S.l('crece con N y con D', 'grows with N and D');
      const exY = subY + subH + 6 * k;
      if (exY + lineH(S, 13 * cs) <= r.y + r.h - 4 * k) fitText(S, ex, lx, exY, textW, { size: 13.5 * cs, weight: 700, font: K.k === 'C' ? 'ui' : 'mono', color: c.ink, base: 'top', a: fr(S, K.seg, 0.45, 0.65) });
      dial(S, r.x + r.w - pad - dialR - 4 * k, r.y + r.h / 2, dialR, K.t, turn);
    });
    // ── modo lateral (vista 2): letra, rótulo y, desde «law», el multiplicador de la ley de escala
    if (side > 0.01) d.withAlpha(filled * side, () => {
      const narrow = r.w < 140 * k;
      const letterS = fz(S, narrow ? 20 : 24);
      d.text(K.k, r.x + 8 * k, r.y + 6 * k, { size: letterS, weight: 800, font: 'mono', color: c.ink, base: 'top' });
      const lw = d.measure('N', { size: letterS, weight: 800, font: 'mono' });
      if (narrow) para(S, S.l(...LABEL[K.k]), r.x + 8 * k, r.y + 8 * k + letterS * u * 1.1, r.w - 14 * k, { size: 12, weight: 700, color: p.ink2 });
      else fitText(S, S.l(...LABEL[K.k]), r.x + 14 * k + lw, r.y + 6 * k + letterS * u * 0.55, r.w - lw - 22 * k, { size: 14, weight: 800, color: p.ink2, base: 'middle' });
      const m = fr(S, 'law', 0.3 + i * 0.18, 0.45 + i * 0.18);
      if (m > 0.01) {
        const mult = K.k === 'N' ? MULT.N : K.k === 'D' ? MULT.D : MULT.C;
        const str = `×10 → ×${S.n(mult, 2)}`;
        fitText(S, str, r.x + r.w / 2, r.y + r.h - 7 * k, r.w - 12 * k, { size: 15, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'center', base: 'bottom', a: m });
      }
    });
  });
}
