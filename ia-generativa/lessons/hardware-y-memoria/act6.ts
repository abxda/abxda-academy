// Acto 6 · El resumen (cuatro reglas de bolsillo) y el puente hacia la inferencia.
import { alpha, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { nf } from './model';
import { FS, fitText, phases } from './ui';

export function drawAct6(S: Frame, all: Rect) {
  const [a, b] = phases(S, ['recap', 'bridge']);
  if (a > 0.005) S.d.withAlpha(a, () => drawRecap(S, all));
  if (b > 0.005) S.d.withAlpha(b, () => drawBridge(S));
}

function drawRecap(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const cards: { head: string; formula: string; ex: string; t: 'w' | 'err' | 'sig' | 'dat' }[] = [
    { head: S.l('Cabe, o no', 'Does it fit'), formula: S.l('parámetros × bytes', 'parameters × bytes'), ex: S.l('8 mil M × 2 B = 16 GB', '8B × 2 B = 16 GB'), t: 'w' },
    { head: S.l('Entrenar', 'Training'), formula: S.l('≈ 16 B por parámetro', '≈ 16 B per parameter'), ex: S.l('8 mil M → 128 GB, más activaciones', '8B → 128 GB, plus activations'), t: 'err' },
    { head: S.l('Leer los pesos', 'Reading the weights'), formula: S.l('bytes ÷ ancho de banda', 'bytes ÷ bandwidth'), ex: S.l(`16 GB ÷ 3,35 TB/s ≈ ${nf(16 / 3.35, 1, 'es')} ms (H100)`, `16 GB ÷ 3.35 TB/s ≈ ${nf(16 / 3.35, 1, 'en')} ms (H100)`), t: 'sig' },
    { head: S.l('Si no cabe', 'If it does not fit'), formula: S.l('repartir o cuantizar', 'split or quantize'), ex: S.l('tensor × pipeline × datos · o ÷ 4 con 4 bits', 'tensor × pipeline × data · or ÷ 4 at 4 bits'), t: 'dat' },
  ];
  const gap = 12 * u, cols = port ? 1 : 2, rows = port ? 4 : 2, cw = (all.w - gap * (cols - 1)) / cols, ch = Math.min(110 * u, (all.h - 8 * u - gap * (rows - 1)) / rows);
  const y0 = all.y + Math.max(0, (all.h - (rows * ch + (rows - 1) * gap)) / 2);
  cards.forEach((c, i) => {
    const a = S.reveal('recap', 0.2 + i * 0.5, 0.6), x = all.x + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), col = tone(S, c.t);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: alpha(col.c, 0.08), stroke: col.c, lw: 1.6, r: 3 });
      d.rect(x, y, 5 * u, ch, { fill: col.c });
      d.text(c.head, x + 16 * u, y + 10 * u, { size: FS(S, 13), weight: 700, color: p.mute, base: 'top' });
      fitText(S, c.formula, x + 16 * u, y + ch * 0.46, cw - 28 * u, port ? 17 : 19, { weight: 800, font: 'mono', color: col.ink, base: 'middle' });
      fitText(S, c.ex, x + 16 * u, y + ch - 12 * u, cw - 28 * u, 13, { weight: 600, color: p.ink2, base: 'bottom' });
    });
  });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 78 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 56 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Inferencia: cómo responde un modelo', 'Inference: how a model answers'), cx, cy + 86 * u, { size: 24, weight: 800, align: 'center', w: S.W * 0.9 });
  });
}
