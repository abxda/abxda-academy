// Acto F (explain → causal): los límites de la atención. Un mapa no es una explicación (una cabeza entre 144 cabezas × capas),
// la atención sola no sabe el orden (barajar no cambia los pesos) y los modelos que escriben solo miran hacia atrás (máscara causal).
// «order» y «causal» usan el juguete de nueve palabras: pesos calculados con `attend` y, en «causal», con la máscara aplicada
// a las puntuaciones antes del softmax.
import { alpha, badge, clamp, inset, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { layoutChips, chip, chipSize } from './act-sentence';
import { mapGrid, gridGeom } from './act-map';
import { mosaic } from './act-heads';
import { ATT_IT, CAUSAL, I, MAP, SHUF, TOK } from './data';
import { REAL } from './real-data';
import { actAlpha, arcBetween, fs, pct, textBlock } from './ui';

// ───────────────────────────── explain ─────────────────────────────
export function drawExplain(S: Frame) {
  const A = actAlpha(S, 'explain', 'order'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), R = REAL[S.lang], sig = tone(S, 'sig'), err = tone(S, 'err');
  const ref = R.heads.find((h) => h.kind === 'ref')!;
  const mr: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.56 } : { x: all.x, y: all.y, w: Math.min(all.h, all.w * 0.5), h: all.h - 30 * u };
  d.withAlpha(A, () => {
    const g = mosaic(S, mr, R.grid.sp, { a: S.reveal('explain', 0, 0.6), faint: true });
    // la cabeza que acabamos de mirar: una entre 144
    const a1 = S.reveal('explain', 0.9, 0.6), cx = g.gx + (ref.head - 0.5) * g.cs, cy = g.gy + (ref.layer - 0.5) * g.cs;
    d.withAlpha(a1, () => {
      d.rect(g.gx + (ref.head - 1) * g.cs - 1, g.gy + (ref.layer - 1) * g.cs - 1, g.cs + 1, g.cs + 1, { stroke: sig.c, lw: 3 });
      badge(S, S.l('la cabeza que miramos: 1 de 144', 'the head we looked at: 1 of 144'), g.gx + g.side / 2, g.gy + g.side + 16 * u, { tone: 'sig', size: fs(S, 12) });
    });
    // respuesta del modelo
    const bx = S.portrait ? all.x + all.w / 2 - 90 * u : mr.x + mr.w + Math.min(70 * u, all.w * 0.08), bw = S.portrait ? 180 * u : all.w - (bx - all.x), bh = 74 * u;
    const by = S.portrait ? all.y + all.h - bh - 24 * u : all.y + (all.h - 30 * u) / 2 - bh / 2;
    const a2 = S.reveal('explain', 2.4, 0.7);
    d.withAlpha(a2, () => {
      // muchas cabezas y capas empujan la respuesta
      for (let k = 0; k < 7; k++) {
        const sx = S.portrait ? g.gx + (0.08 + k * 0.14) * g.side : g.gx + g.side, sy = S.portrait ? g.gy + g.side : g.gy + (0.1 + k * 0.13) * g.side;
        const ex = S.portrait ? bx + bw * (0.1 + k * 0.13) : bx, ey = S.portrait ? by : by + bh * (0.15 + k * 0.11);
        d.line(sx, sy, ex, ey, p.lineStrong, 1.2, [3, 4], 0.7);
      }
      d.rect(bx, by, bw, bh, { fill: p.surface, stroke: p.lineStrong, lw: 1.75, r: 4 });
      d.text(S.l('respuesta del modelo', 'model’s answer'), bx + bw / 2, by + 22 * u, { size: fs(S, 14), weight: 800, color: p.ink, align: 'center', base: 'middle', w: bw - 12 * u });
      d.text(S.l('¿por qué?', 'why?'), bx + bw / 2, by + bh - 24 * u, { size: fs(S, 20), weight: 800, color: err.ink, align: 'center', base: 'middle' });
    });
    d.withAlpha(S.reveal('explain', 4.6, 0.7), () => {
      const tw = S.portrait ? all.w : bw;
      textBlock(S, S.l('una pista, no la explicación completa', 'a clue, not the full explanation'), bx + bw / 2, by + bh + (S.portrait ? 18 : 28) * u, tw - 8 * u, { size: fs(S, 13), weight: 800, color: err.ink, align: 'center', lh: 1.2 });
    });
    void cx; void cy;
  });
}

// ───────────────────────────── order ─────────────────────────────
export function drawOrder(S: Frame) {
  const A = actAlpha(S, 'order', 'causal'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), words = TOK[S.lang], sig = tone(S, 'sig');
  const gap = 6 * u, h = 30 * u, size = chipSize(S, all.w, gap), rowGap = 34 * u;
  const shuf = SHUF.map((i) => words[i]);
  const L0 = layoutChips(S, words, 0, 0, all.w, size, h, gap, rowGap), L1 = layoutChips(S, shuf, 0, 0, all.w, size, h, gap, rowGap);
  const bh = Math.max(L0.height, L1.height), head = 64 * u, foot = 64 * u, top = all.y + Math.max(0, (all.h - bh - head - foot) / 2) + head;
  const x0 = all.x + (all.w - Math.max(L0.width, L1.width)) / 2, m = S.at('order', 0.8, 2.8, 'io');
  const slotOf = (i: number) => SHUF.indexOf(i);
  const rects: Rect[] = words.map((_, i) => { const a = L0.rects[i], b = L1.rects[slotOf(i)]; return { x: lerp(a.x, b.x, m) + x0, y: lerp(a.y, b.y, m) + top, w: a.w, h: a.h }; });
  d.withAlpha(A, () => {
    const it = rects[I.it];
    ATT_IT.w.forEach((w, i) => {
      if (i === I.it || w < 0.03) return;
      arcBetween(S, it, rects[i], { tone: 'sig', lw: 1.4 + 9 * w, a: 0.9 * S.reveal('order', 0.1, 0.6), lift: Math.min(head * 0.9, 12 * u + Math.abs(it.x - rects[i].x) * 0.15), head: w > 0.04 });
    });
    rects.forEach((r, i) => chip(S, r, words[i], { size, a: S.reveal('order', 0, 0.5), fill: (i === I.it ? 0 : ATT_IT.w[i]) * 1.25, ring: i === I.it }));
    rects.forEach((r, i) => {
      const w = ATT_IT.w[i]; if (i === I.it || w < 0.05) return;
      d.text(pct(S, w) + ' %', r.x + r.w / 2, r.y + r.h + 11 * u, { size: fs(S, 12), weight: 800, font: 'mono', color: sig.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4, a: S.reveal('order', 0.4, 0.5) });
    });
    d.withAlpha(S.at('order', 2.4, 3.2), () => {
      badge(S, S.l('mismos pesos, otro orden', 'same weights, another order'), all.x + all.w / 2, top + bh + 44 * u, { tone: 'sig', size: fs(S, 14) });
      textBlock(S, S.l('sin la posición, la atención no distingue el orden de las palabras', 'without position, attention cannot tell the order of the words'), all.x + all.w / 2, top + bh + 76 * u, all.w - 20 * u, { size: fs(S, 13), align: 'center', lh: 1.25 });
    });
    d.text(S.l('pesos ilustrativos', 'illustrative weights'), all.x, all.y + all.h - 2 * u, { size: fs(S, 12), weight: 600, color: p.mute, base: 'bottom' });
  });
}

// ───────────────────────────── causal ─────────────────────────────
export function drawCausal(S: Frame) {
  const A = actAlpha(S, 'causal', 'recap'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), words = TOK[S.lang], sig = tone(S, 'sig');
  const m = S.at('causal', 0.7, 2.7, 'io'), badgeH = 26 * u;
  const gr: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h - badgeH - 38 * u } : { x: all.x, y: all.y, w: Math.round(all.w * 0.56), h: all.h - badgeH };
  d.withAlpha(A, () => {
    const M = MAP.map((row, i) => row.map((w, j) => lerp(w, CAUSAL[i][j], m)));
    mapGrid(S, gr, { words, M, hotRow: I.it, mask: m, minNum: 0.1, rowA: () => S.reveal('causal', 0, 0.5) });
    d.withAlpha(S.reveal('causal', 1.8, 0.6), () => badge(S, S.l('máscara causal: cada fila vuelve a sumar 100 %', 'causal mask: each row adds up to 100 % again'), gr.x + gr.w / 2, gr.y + gr.h + 14 * u, { tone: 'sig', size: fs(S, 12) }));
    // leyenda
    const G = gridGeom(S, gr, words), lx = S.portrait ? all.x : gr.x + gr.w + 22 * u, ly = S.portrait ? all.y + all.h - 24 * u : all.y + all.h * 0.2, lw = S.portrait ? all.w : all.w - gr.w - 22 * u;
    d.withAlpha(S.reveal('causal', 2.2, 0.6), () => {
      const cs = 18 * u, sz = fs(S, 13);
      if (S.portrait) {
        d.rect(lx, ly, cs, cs, { fill: alpha(sig.c, 0.6) });
        d.text(S.l('puede mirar', 'can look'), lx + cs + 6 * u, ly + cs / 2, { size: sz, weight: 700, color: p.ink2, base: 'middle' });
        const x2 = lx + all.w * 0.48;
        d.rect(x2, ly, cs, cs, { fill: p.surface, stroke: alpha(p.ink2, 0.6), lw: 1 }); d.line(x2 + 3, ly + cs - 3, x2 + cs - 3, ly + 3, p.ink2, 1.2, undefined, 0.6);
        d.text(S.l('futuro: tapado', 'future: covered'), x2 + cs + 6 * u, ly + cs / 2, { size: sz, weight: 700, color: p.ink2, base: 'middle' });
      } else {
        d.rect(lx, ly, cs, cs, { fill: alpha(sig.c, 0.6) });
        d.text(S.l('puede mirar: ella misma y las anteriores', 'can look at: itself and the previous ones'), lx + cs + 8 * u, ly + cs / 2, { size: sz, weight: 700, color: p.ink2, base: 'middle', w: lw - cs - 8 * u });
        const y2 = ly + 52 * u;
        d.rect(lx, y2, cs, cs, { fill: p.surface, stroke: alpha(p.ink2, 0.6), lw: 1 }); d.line(lx + 3, y2 + cs - 3, lx + cs - 3, y2 + 3, p.ink2, 1.2, undefined, 0.6);
        d.text(S.l('futuro: tapado antes del softmax', 'future: covered before softmax'), lx + cs + 8 * u, y2 + cs / 2, { size: sz, weight: 700, color: p.ink2, base: 'middle', w: lw - cs - 8 * u });
        textBlock(S, S.l('Así escribe GPT: cada palabra solo ve las que ya están escritas. Pesos ilustrativos.', 'This is how GPT writes: each word only sees the ones already written. Illustrative weights.'), lx, all.y + all.h - 40 * u, lw, { size: fs(S, 12), weight: 600, color: p.mute, lh: 1.2 });
      }
    });
    void G;
  });
  void clamp;
}
