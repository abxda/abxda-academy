// Acto 1: las piezas conocidas que se juntan en una máquina, el modelo de juguete (sus doce palabras) y su tarea.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ap, area, caption, chip, chipW, fitText, isShort, txt } from './draw';
import { DET, SUBJ, VERB, vocab } from './data';
import type { Lang } from './model';

// ═════════ gancho: tokens, embeddings, atención, siguiente palabra → transformer ═════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S);
  const bw = Math.min(A.w, S.portrait ? A.w : 600), bh = short ? A.h : Math.min(A.h * 0.78, 300);
  const bx = A.x + (A.w - bw) / 2, by = A.y + (A.h - bh) / 2;
  const pieces: [string, number, Tone][] = [
    [S.l('tokens', 'tokens'), 20, 'lat'], [S.l('embeddings', 'embeddings'), 14, 'lat'],
    [S.l('atención', 'attention'), 21, 'sig'], [S.l('siguiente palabra', 'next word'), 19, 'dat'],
  ];
  const titleH = short ? 30 : 46, pad = short ? 10 : 18;
  const inner: Rect = { x: bx + pad, y: by + titleH, w: bw - 2 * pad, h: bh - titleH - pad };
  const cw = (inner.w - pad) / 2, chH = short ? 28 : 34, capH = 18, cellH = chH + capH;
  const gy = (inner.h - 2 * cellH) / 3;
  pieces.forEach(([name, les, tn], i) => {
    const a = ap(S, 'hook', 0.06 + i * 0.12, 0.16 + i * 0.12);
    if (a <= 0.01) return;
    const col = i % 2, row = Math.floor(i / 2), x = inner.x + col * (cw + pad), y = inner.y + gy + row * (cellH + gy);
    chip(S, x, y, name, { tone: tn, h: chH, s: short ? 14 : 16, w: cw, a });
    caption(S, S.l(`lección ${les}`, `lesson ${les}`), x + cw / 2, y + chH + capH / 2 + 2, cw, { align: 'center', a });
  });
  const aB = ap(S, 'hook', 0.62, 0.76);
  d.withAlpha(aB, () => {
    d.rect(bx, by, bw, bh, { stroke: p.ink, lw: 2.5, r: 6, fill: alpha(p.ink, 0.03) });
    fitText(S, 'transformer', bx + bw / 2, by + titleH / 2 + 2, bw - 20, { s: short ? 16 : 20, weight: 800, mono: true, align: 'center' });
  });
}

// ═════════ el modelo de juguete y su tarea ═════════
/** Fichas en filas con salto de línea dentro de `w`. */
function flow(S: Frame, items: string[], w: number, s: number, gap: number, h: number) {
  const pos: { x: number; y: number; w: number }[] = []; let x = 0, y = 0;
  items.forEach((t) => { const cw = chipW(S, t, s); if (x > 0 && x + cw > w) { x = 0; y += h + gap; } pos.push({ x, y, w: cw }); x += cw + gap; });
  return { pos, h: y + h };
}

export function drawToy(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), L = S.lang as Lang, V = vocab(L);
  const land = !S.portrait;
  const left: Rect = land ? { x: A.x, y: A.y, w: A.w * 0.5, h: A.h } : { x: A.x, y: A.y, w: A.w, h: A.h * 0.56 };
  const s = short ? 13 : land ? 16 : 14, chH = short ? 24 : land ? 32 : 27, gap = 5;
  const groups: [string, string[]][] = [
    [S.l('estructura', 'structure'), [V[1], V[0]]],
    [S.l('sujetos', 'subjects'), V.slice(2, 5)],
    [S.l('verbos', 'verbs'), [V[6], V[5]]],
    [S.l('objetos', 'objects'), [V[9], V[10], V[11], V[7], V[8]]],
  ];
  // encabezado
  const aH = ap(S, 'toy', 0.02, 0.12), headH = short ? 18 : 26;
  caption(S, S.l('nuestro transformer diminuto: 12 palabras', 'our tiny transformer: 12 words'), left.x, left.y + headH / 2, left.w, { a: aH, s: 13, c: tone(S, 'lat').ink });
  // grupos: rótulo a la izquierda (horizontal) o encima (vertical)
  const capW = land ? Math.min(left.w * 0.32, 96) : 0, rowGap = short ? 4 : 8;
  let y = left.y + headH + (short ? 2 : 6);
  groups.forEach(([lab, items], gi) => {
    const a = ap(S, 'toy', 0.08 + gi * 0.08, 0.18 + gi * 0.08);
    const fw = left.w - capW, f = flow(S, items, fw, s, gap, chH);
    if (a > 0.01) {
      if (land) caption(S, lab, left.x, y + chH / 2, capW - 6, { a });
      else caption(S, lab, left.x, y + 7, left.w, { a });
      const ox = left.x + capW, oy = land ? y : y + 16;
      items.forEach((t, i) => chip(S, ox + f.pos[i].x, oy + f.pos[i].y, t, { s, h: chH, a, w: f.pos[i].w }));
    }
    y += (land ? 0 : 16) + f.h + rowGap;
  });
  void d; void p;
  const right: Rect = land ? { x: A.x + A.w * 0.54, y: A.y, w: A.w * 0.46, h: A.h } : { x: A.x, y: y + 4, w: A.w, h: A.y + A.h - y - 4 };
  // ejemplos (toy) → tarea (toy-task)
  const aEx = S.on('toy-task') ? 1 - ap(S, 'toy-task', 0, 0.1) : 1;
  const ex: string[][] = [[DET[L], SUBJ[L][0], VERB[L], V[9], '.'], [DET[L], SUBJ[L][2], V[5], V[8], '.']];
  const exH = chH + (short ? 6 : 12);
  const exY = right.y + (right.h - (exH * 2 + 20)) / 2;
  ex.forEach((wds, k) => {
    const a = ap(S, 'toy', 0.55 + k * 0.15, 0.65 + k * 0.15) * aEx;
    if (a <= 0.01) return;
    if (k === 0) caption(S, S.l('frases de ejemplo', 'example sentences'), right.x, exY - 2, right.w, { a });
    const f = flow(S, wds, right.w, s, gap, chH);
    wds.forEach((t, i) => chip(S, right.x + f.pos[i].x, exY + 12 + k * exH + f.pos[i].y, t, { s, h: chH, a, w: f.pos[i].w, tone: 'ink' }));
  });
  if (S.on('toy-task')) drawTask(S, right, s, chH);
}

/** La tarea: el principio de una frase → una probabilidad para cada una de las doce palabras (todavía desconocidas). */
function drawTask(S: Frame, R: Rect, s: number, chH: number) {
  const { d, pal: p } = S, L = S.lang as Lang, short = isShort(S);
  const aBars = ap(S, 'toy-task', 0.18, 0.32), aIn = ap(S, 'toy-task', 0.62, 0.74);
  const words = [DET[L], SUBJ[L][0], VERB[L]];
  const rowW = words.reduce((a, t) => a + chipW(S, t, s) + 5, -5);
  const barsH = short ? Math.min(60, R.h * 0.42) : Math.min(110, R.h * 0.42);
  const top = R.y + (R.h - (chH + 16 + barsH + 34)) / 2;
  // el principio de la frase
  let x = R.x + (R.w - rowW) / 2;
  words.forEach((t) => { x += chip(S, x, top, t, { s, h: chH, a: aIn }) + 5; });
  // flecha y barras vacías
  d.withAlpha(aBars, () => {
    const by = top + chH + 16, n = 12, bw = Math.min(22, (R.w - 20) / n), x0 = R.x + (R.w - n * bw) / 2;
    d.arrow(R.x + R.w / 2, top + chH + 2, R.x + R.w / 2, by - 2, p.mute, 1.6, 6);
    for (let i = 0; i < n; i++) d.rect(x0 + i * bw + 2, by + barsH * 0.15, bw - 4, barsH * 0.85, { stroke: p.mute, lw: 1, dash: [3, 3], fill: alpha(p.mute, 0.08) });
    txt(S, '?', R.x + R.w / 2, by + barsH * 0.55, { s: short ? 18 : 24, weight: 800, c: p.mute, align: 'center', halo: true });
    caption(S, S.l('una probabilidad para cada palabra', 'a probability for each word'), R.x + R.w / 2, by + barsH + 14, R.w, { align: 'center' });
  });
}
