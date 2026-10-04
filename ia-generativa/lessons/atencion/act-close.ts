// Acto G (recap → bridge): el recorrido completo de una capa de atención y el puente hacia el transformer.
import { alpha, badge, inset, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { actAlpha, fs } from './ui';

export function drawRecap(S: Frame) {
  const A = actAlpha(S, 'recap', 'bridge'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u);
  const steps: [string, string, Tone][] = [
    [S.l('palabras', 'words'), S.l('→ Q, K, V', '→ Q, K, V'), 'lat'],
    ['Q · Kᵀ', S.l('puntuación', 'scores'), 'sig'],
    ['÷ √d', S.l('escala', 'scale'), 'mute'],
    ['softmax', S.l('pesos', 'weights'), 'ink'],
    ['· V', S.l('mezcla', 'blend'), 'dat'],
    [S.l('vector nuevo', 'new vector'), S.l('de cada palabra', 'for each word'), 'sig'],
  ];
  const n = steps.length, stackA = S.reveal('recap', 2.8, 0.6), parA = S.reveal('recap', 3.8, 0.6);
  d.withAlpha(A, () => {
    const boxes: Rect[] = [];
    if (S.portrait) {
      const bh = 34 * u, gap = (all.h - 78 * u - n * bh) / (n - 1);
      for (let i = 0; i < n; i++) boxes.push({ x: all.x + all.w * 0.1, y: all.y + i * (bh + gap), w: all.w * 0.8, h: bh });
    } else {
      const gap = 22 * u, bw = (all.w - (n - 1) * gap) / n, bh = Math.min(96 * u, all.h * 0.3), y = all.y + all.h * 0.28;
      for (let i = 0; i < n; i++) boxes.push({ x: all.x + i * (bw + gap), y, w: bw, h: bh });
    }
    boxes.forEach((r, i) => {
      const [label, sub, t] = steps[i], a = S.reveal('recap', 0.2 + i * 0.4, 0.5), tc = tone(S, t), mid = i >= 1 && i <= 4;
      // copias detrás: varias cabezas en paralelo
      if (mid) for (let k = 2; k >= 1; k--) d.rect(r.x + k * 5 * u, r.y - k * 5 * u, r.w, r.h, { fill: p.surface, stroke: alpha(tc.c, 0.55), lw: 1.25, r: 3, a: stackA });
      d.withAlpha(a, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: mid ? alpha(tc.c, 0.14) : alpha(tc.c, 0.1), stroke: t === 'ink' || t === 'mute' ? p.lineStrong : tc.c, lw: 1.75, r: 3 });
        d.text(label, r.x + r.w / 2, r.y + r.h / 2 - (S.portrait ? 0 : 9 * u), { size: fs(S, S.portrait ? 15 : 16), weight: 800, font: mid ? 'mono' : 'ui', color: tc.ink, align: 'center', base: 'middle', w: r.w - 8 * u });
        if (!S.portrait) d.text(sub, r.x + r.w / 2, r.y + r.h / 2 + 14 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle', w: r.w - 8 * u });
        else d.text(sub, r.x + r.w - 8 * u, r.y + r.h / 2, { size: fs(S, 12), weight: 600, color: p.mute, align: 'right', base: 'middle' });
      });
      if (i > 0) {
        const q = boxes[i - 1], aa = S.reveal('recap', 0.45 + i * 0.4, 0.4);
        if (S.portrait) d.arrow(q.x + q.w / 2, q.y + q.h + 1, r.x + r.w / 2, r.y - 1, p.ink2, 1.8, 7, aa);
        else d.arrow(q.x + q.w + 1, q.y + q.h / 2, r.x - 1, r.y + r.h / 2, p.ink2, 1.8, 8, aa);
      }
    });
    // las etiquetas finales: varias cabezas y todas las palabras a la vez
    const last = boxes[boxes.length - 1], first = boxes[0];
    if (S.portrait) {
      badge(S, S.l('× varias cabezas, en paralelo', '× several heads, in parallel'), all.x + all.w / 2, last.y + last.h + 18 * u, { tone: 'w', size: fs(S, 13), a: parA });
      badge(S, S.l('todas las palabras a la vez', 'all words at once'), all.x + all.w / 2, last.y + last.h + 46 * u, { tone: 'sig', size: fs(S, 13), a: S.reveal('recap', 5.0, 0.6) });
    } else {
      const y = first.y + first.h + 52 * u;
      badge(S, S.l('× varias cabezas, en paralelo', '× several heads, in parallel'), all.x + all.w * 0.4, y, { tone: 'w', size: fs(S, 14), a: parA });
      badge(S, S.l('todas las palabras a la vez', 'all words at once'), all.x + all.w * 0.4, y + 40 * u, { tone: 'sig', size: fs(S, 14), a: S.reveal('recap', 5.0, 0.6) });
      d.text(S.l('Atención = softmax(Q Kᵀ / √d) V', 'Attention = softmax(Q Kᵀ / √d) V'), all.x + all.w / 2, all.y + all.h - 8 * u, { size: fs(S, 15), weight: 800, font: 'mono', color: p.ink2, align: 'center', base: 'bottom', a: S.reveal('recap', 4.2, 0.6) });
    }
  });
}

export function drawBridge(S: Frame) {
  const A = actAlpha(S, 'bridge'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u);
  const pieces: [string, Tone][] = [
    [S.l('atención', 'attention'), 'sig'],
    [S.l('una red por palabra', 'a network per word'), 'dat'],
    [S.l('atajos', 'shortcuts'), 'w'],
    [S.l('posición', 'position'), 'lat'],
  ];
  d.withAlpha(A, () => {
    d.text(S.l('Siguiente', 'Next'), all.x + all.w / 2, all.y + all.h * 0.12, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center', base: 'middle', a: S.reveal('bridge', 0.1, 0.6) });
    d.text(S.l('El transformer', 'The transformer'), all.x + all.w / 2, all.y + all.h * 0.12 + 32 * u, { size: fs(S, 28), weight: 800, align: 'center', base: 'middle', a: S.reveal('bridge', 0.3, 0.6) });
    const cols = S.portrait ? 2 : 4, gap = 14 * u, bw = (all.w * (S.portrait ? 1 : 0.9) - (cols - 1) * gap) / cols, bh = Math.min(S.portrait ? 62 * u : 84 * u, all.h * 0.16);
    const x0 = all.x + (all.w - (cols * bw + (cols - 1) * gap)) / 2, y0 = all.y + all.h * (S.portrait ? 0.34 : 0.44);
    pieces.forEach(([label, t], i) => {
      const tc = tone(S, t), r: Rect = { x: x0 + (i % cols) * (bw + gap), y: y0 + Math.floor(i / cols) * (bh + gap), w: bw, h: bh }, a = S.reveal('bridge', 1.0 + i * 0.5, 0.6);
      d.withAlpha(a, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tc.c, 0.13), stroke: tc.c, lw: 1.75, r: 3 });
        d.text(label, r.x + r.w / 2, r.y + r.h / 2, { size: fs(S, 15), weight: 800, color: tc.ink, align: 'center', base: 'middle', w: r.w - 10 * u });
      });
    });
    if (!S.portrait) [1, 2, 3].forEach((i) => d.text('+', x0 + i * (bw + gap) - gap / 2, y0 + bh / 2, { size: fs(S, 22), weight: 800, color: p.ink2, align: 'center', base: 'middle', a: S.reveal('bridge', 1.0 + i * 0.5, 0.6) }));
    const sc = Math.max(4, Math.round((S.portrait ? 4.2 : 5) * u));
    neu(S, S.portrait ? all.x + all.w / 2 - 12 * sc : all.x + all.w / 2 - 12 * sc, all.y + all.h - 18 * sc - 6 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 3.2, 0.6) });
  });
}
