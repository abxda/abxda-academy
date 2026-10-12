// Vista 8 (recap, bridge): el recorrido completo en una tira de pasos y el puente hacia el transformer.
import { alpha, tone, type Frame, type Tone } from '../../../../../theme/kit';
import { area, fitText, fr, fz, isShort, kk, label } from './ui';

export function drawClose(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, sh = isShort(S);
  const aR = 1 - fr(S, 'bridge', 0, 0.12);
  const steps: [string, Tone][] = [
    [S.l('consulta · claves', 'query · keys'), 'sig'],
    [S.l('producto punto', 'dot product'), 'w'],
    ['softmax', 'sig'],
    [S.l('pesos (100 %)', 'weights (100%)'), 'sig'],
    [S.l('mezcla de valores', 'blend of values'), 'dat'],
  ];
  if (aR > 0.01) d.withAlpha(aR, () => {
    const n = steps.length, size = fz(S, P ? 13 : 14);
    if (P) {
      const bh = Math.min(40 * u, (R.h * 0.72) / n - 12 * u), bw = Math.min(R.w * 0.8, 260 * u), x = R.x + (R.w - bw) / 2;
      steps.forEach(([t, tn], i) => {
        const a = fr(S, 'recap', 0.05 + i * 0.1, 0.15 + i * 0.1), y = R.y + 8 * u + i * (bh + 12 * u);
        d.rect(x, y, bw, bh, { fill: alpha(tone(S, tn).c, 0.14), stroke: tone(S, tn).c, lw: 1.5, r: 6, a });
        label(S, t, x + bw / 2, y + bh / 2, { a, size, weight: 800, color: tone(S, tn).ink });
        if (i < n - 1) d.arrow(x + bw / 2, y + bh + 1, x + bw / 2, y + bh + 11 * u, p.mute, 1.3, 6 * u, fr(S, 'recap', 0.12 + i * 0.1, 0.2 + i * 0.1));
      });
      fitText(S, S.l('× varias cabezas · todos los tokens a la vez', '× several heads · all tokens at once'), R.x + R.w / 2, R.y + 8 * u + n * (bh + 12 * u) + 4 * u, R.w, { a: fr(S, 'recap', 0.68, 0.82), size: fz(S, 13), weight: 800, color: p.ink, base: 'top' });
    } else {
      const gap = 22 * u, bw = Math.min((R.w - gap * (n - 1)) / n, 170 * kk(S)), bh = (sh ? 46 : 64) * u, x0 = R.x + (R.w - (bw * n + gap * (n - 1))) / 2, y = R.y + R.h * 0.34;
      steps.forEach(([t, tn], i) => {
        const a = fr(S, 'recap', 0.05 + i * 0.1, 0.15 + i * 0.1), x = x0 + i * (bw + gap);
        d.rect(x, y, bw, bh, { fill: alpha(tone(S, tn).c, 0.14), stroke: tone(S, tn).c, lw: 1.5, r: 6, a });
        fitText(S, t, x + bw / 2, y + bh / 2, bw - 10 * u, { a, size, weight: 800, color: tone(S, tn).ink });
        if (i < n - 1) d.arrow(x + bw + 3 * u, y + bh / 2, x + bw + gap - 3 * u, y + bh / 2, p.mute, 1.3, 6 * u, fr(S, 'recap', 0.12 + i * 0.1, 0.2 + i * 0.1));
      });
      label(S, S.l('× varias cabezas · todos los tokens a la vez', '× several heads · all tokens at once'), R.x + R.w / 2, y + bh + 28 * u, { a: fr(S, 'recap', 0.68, 0.82), size: fz(S, 15), weight: 800, color: p.ink });
    }
  });
  // ── puente ──
  const aB = fr(S, 'bridge', 0.05, 0.2);
  if (aB > 0.01) d.withAlpha(aB, () => {
    const cx = R.x + R.w / 2, cy = R.y + R.h * 0.42, bw = Math.min(R.w * 0.36, 180 * kk(S)), bh = (sh ? 40 : 52) * u;
    const sx = P ? cx - bw / 2 : cx - bw - 30 * u, sy = P ? cy - bh - 30 * u : cy - bh / 2;
    d.rect(sx, sy, bw, bh, { fill: alpha(tone(S, 'sig').c, 0.18), stroke: tone(S, 'sig').c, lw: 2, r: 6 });
    label(S, S.l('atención', 'attention'), sx + bw / 2, sy + bh / 2, { size: fz(S, 16), weight: 800, color: tone(S, 'sig').ink });
    const a2 = fr(S, 'bridge', 0.35, 0.5);
    const tx = P ? cx - bw / 2 : cx + 30 * u, ty = P ? cy + 30 * u : cy - bh / 2;
    d.rect(tx, ty, bw, bh, { fill: p.surface, stroke: p.line, lw: 1.5, r: 6, dash: [5, 4], a: a2 });
    label(S, S.l('¿modelo completo?', 'a complete model?'), tx + bw / 2, ty + bh / 2, { a: a2, size: fz(S, 15), weight: 800, color: p.ink2 });
    if (P) d.arrow(cx, sy + bh + 4 * u, cx, ty - 4 * u, p.mute, 1.5, 7 * u, a2); else d.arrow(sx + bw + 6 * u, cy, tx - 6 * u, cy, p.mute, 1.5, 7 * u, a2);
    label(S, S.l('el transformer · lección 22', 'the transformer · lesson 22'), cx, (P ? ty + bh : cy + bh / 2) + 26 * u, { a: fr(S, 'bridge', 0.7, 0.85), size: fz(S, 15), weight: 800, color: tone(S, 'lat').ink });
  });
}
