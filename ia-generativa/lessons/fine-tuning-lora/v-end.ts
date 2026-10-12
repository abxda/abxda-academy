// Vistas finales: el resumen en cuatro tarjetas y el puente hacia la lección 28 (de modelo base a asistente).
import { alpha, neu, tone, type Frame } from '../../../../../theme/kit';
import { ap, area, fitText, isShort, lineH, txt } from './draw';

export function drawRecap(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S);
  const cards: [string, string, string, 'dat' | 'err' | 'w' | 'lat', number][] = [
    [S.l('Ajuste fino', 'Fine-tuning'), S.l('seguir entrenando', 'keep training'), S.l('con tus pares entrada → respuesta', 'on your input → answer pairs'), 'dat', 0.04],
    [S.l('Olvido', 'Forgetting'), S.l('mover todo desacomoda', 'moving it all disturbs'), S.l('defensa: repaso y medir lo que ya sabía', 'defense: replay, and measure what it knew'), 'err', 0.24],
    [S.l('LoRA', 'LoRA'), S.l('corrección = B × A', 'correction = B × A'), S.l('rango × (filas + columnas) números', 'rank × (rows + columns) numbers'), 'w', 0.44],
    [S.l('Cuándo', 'When'), S.l('prompt → RAG → ajuste', 'prompt → RAG → tuning'), S.l('para conducta, no para hechos', 'for behavior, not for facts'), 'lat', 0.7],
  ];
  const cols = port ? 1 : 2, rows = port ? 4 : 2, gap = (short ? 8 : 14) * u;
  const cw = (A.w - gap * (cols - 1)) / cols, ch = Math.min((short ? 70 : 104) * u, (A.h - gap * (rows - 1)) / rows);
  const y0 = A.y + Math.max(0, (A.h - (rows * ch + (rows - 1) * gap)) / 2);
  cards.forEach(([head, rule, ex, t, at], i) => {
    const a = ap(S, 'recap', at, at + 0.14), x = A.x + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), c = tone(S, t);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: alpha(c.c, 0.08), stroke: c.c, lw: 1.5, r: 4 });
      d.rect(x, y, 5 * u, ch, { fill: c.c });
      const tx = x + 16 * u, tw = cw - 26 * u;
      if (port || short) {
        fitText(S, `${head} · ${rule}`, tx, y + ch * 0.36, tw, { s: 14, weight: 800, c: c.ink });
        fitText(S, ex, tx, y + ch * 0.72, tw, { s: 12.5, c: p.ink2 });
      } else {
        fitText(S, head, tx, y + ch * 0.22, tw, { s: 12.5, weight: 700, c: p.mute });
        fitText(S, rule, tx, y + ch * 0.5, tw, { s: 18, weight: 800, c: c.ink });
        fitText(S, ex, tx, y + ch * 0.8, tw, { s: 13, c: p.ink2 });
      }
    });
  });
}

export function drawBridge(S: Frame) {
  const { pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 26 * sc, { scale: sc, mood: 'think', a: ap(S, 'bridge', 0.05, 0.2) });
  txt(S, S.l('Siguiente', 'Next'), cx, cy + 30 * u, { s: 13, weight: 700, c: p.mute, align: 'center', a: ap(S, 'bridge', 0.55, 0.7) });
  fitText(S, S.l('De modelo base a asistente', 'From base model to assistant'), cx, cy + 30 * u + lineH(S, 22, 1.1), S.W * 0.9, { s: 22, weight: 800, align: 'center', a: ap(S, 'bridge', 0.6, 0.75) });
  void area;
}
