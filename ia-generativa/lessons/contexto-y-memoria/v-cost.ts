// Vista 7: lo que cuesta reenviar todo. Una barra por turno con los tokens que procesa el modelo en ese turno: la parte
// clara es lo que se reenvía otra vez; la oscura, lo nuevo. Supuesto rotulado: cada turno agrega 100 tokens.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { PER_TURN, processed, textTokens } from './model';
import { st } from './state';
import { FS, area, chip, fitText, fr, para } from './ui';

export function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), s = st(S), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const tShown = clamp(s.turns, 1, 20), N = Math.round(tShown);
  const slots = Math.max(10, tShown), yMax = PER_TURN * slots;
  // reparto: gráfica + columna de cifras (a la derecha) o franja de cifras (abajo, en vertical)
  const side = !S.portrait;
  const statW = side ? Math.min(220 * u, A.w * 0.3) : A.w, statH = side ? A.h : 96 * u;
  const chart: Rect = side ? { x: A.x, y: A.y, w: A.w - statW - 16 * u, h: A.h } : { x: A.x, y: A.y, w: A.w, h: A.h - statH - 8 * u };
  const stats: Rect = side ? { x: A.x + A.w - statW, y: A.y + 30 * u, w: statW, h: statH } : { x: A.x, y: A.y + A.h - statH, w: A.w, h: statH };

  fitText(S, S.l('tokens que procesa el modelo en cada turno', 'tokens the model processes on each turn'), chart.x, chart.y + 2 * u, chart.w, 14, { weight: 800, base: 'top' });
  const sup = fr(S, 'cost-setup', 0.45, 0.62);
  chip(S, S.l(`supuesto: cada turno agrega ${S.n(PER_TURN, 0)} tokens`, `assumption: each turn adds ${S.n(PER_TURN, 0)} tokens`), chart.x, chart.y + (FS(S, 14) + 18) * u, 'ink', { align: 'left', a: sup, size: 12.5, maxW: chart.w, dash: true });

  // ejes
  const pl = 44 * u, pb = 34 * u, pt = (FS(S, 14) + 44) * u;
  const P: Rect = { x: chart.x + pl, y: chart.y + pt, w: chart.w - pl - 6 * u, h: chart.h - pt - pb };
  const X = (k: number) => P.x + ((k - 0.5) / slots) * P.w, Y = (v: number) => P.y + P.h - (v / yMax) * P.h;
  d.line(P.x, P.y + P.h, P.x + P.w, P.y + P.h, p.lineStrong, 1.5);
  d.line(P.x, P.y, P.x, P.y + P.h, p.lineStrong, 1.5);
  [0, yMax / 2, yMax].forEach((v) => {
    d.line(P.x - 4 * u, Y(v), P.x, Y(v), p.lineStrong, 1.5);
    d.text(S.n(v, 0), P.x - 7 * u, Y(v), { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' });
  });
  const ticks = slots > 12 ? [1, 5, 10, 15, 20] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  ticks.filter((k) => k <= Math.ceil(slots)).forEach((k) => d.text(String(k), X(k), P.y + P.h + 5 * u, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' }));
  fitText(S, S.l('turno', 'turn'), P.x + P.w, P.y + P.h + 20 * u, P.w * 0.4, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' });

  // barras
  const bw = Math.max(2, (P.w / slots) * 0.7);
  for (let k = 1; k <= 20; k++) {
    const g = clamp(tShown - k + 1);
    if (g <= 0.01) break;
    const total = k * PER_TURN * g, old = (k - 1) * PER_TURN * g, x = X(k) - bw / 2;
    const hot = S.on('cost-pay') && (k === 1 || k === 20) ? fr(S, 'cost-pay', 0.4, 0.6) : 0;
    d.rect(x, Y(total), bw, Y(old) - Y(total), { fill: dt.c });
    if (old > 0) { d.rect(x, Y(old), bw, Y(0) - Y(old), { fill: alpha(dt.c, 0.28) }); d.dither(x, Y(old), bw, Y(0) - Y(old), alpha(dt.c, 0.5), 0.35, 2); }
    if (hot > 0.01) d.rect(x - 3 * u, Y(total) - 3 * u, bw + 6 * u, Y(0) - Y(total) + 3 * u, { stroke: p.ink, lw: 2, a: hot });
    if (k === N && slots <= 12 && g > 0.9) d.text(S.n(k * PER_TURN, 0), X(k), Y(total) - 4 * u, { size: FS(S, 12), font: 'mono', weight: 700, color: dt.ink, align: 'center', base: 'bottom' });
  }
  // leyenda: nuevo (sólido) y reenviado (claro y tramado)
  const lgA = fr(S, 'cost-bars', 0.45, 0.6);
  if (lgA > 0.01) d.withAlpha(lgA, () => {
    const lx = P.x + 8 * u, ly = P.y + 2 * u, sw = 14 * u;
    d.rect(lx, ly, sw, sw, { fill: dt.c });
    fitText(S, S.l('nuevo en ese turno', 'new on that turn'), lx + sw + 6 * u, ly + sw / 2, P.w * 0.6, 12.5, { weight: 600, color: p.ink2, base: 'middle' });
    const ly2 = ly + sw + 8 * u;
    d.rect(lx, ly2, sw, sw, { fill: alpha(dt.c, 0.28) }); d.dither(lx, ly2, sw, sw, alpha(dt.c, 0.5), 0.35, 2);
    fitText(S, S.l('reenviado otra vez', 'resent again'), lx + sw + 6 * u, ly2 + sw / 2, P.w * 0.6, 12.5, { weight: 600, color: p.ink2, base: 'middle' });
  });

  // cifras: texto de la conversación frente a tokens procesados
  const sa = fr(S, 'cost-total', 0.25, 0.45);
  if (sa > 0.01) d.withAlpha(sa, () => {
    const rows: [string, string, typeof lt][] = [
      [S.l('texto de la conversación', 'conversation text'), `${S.n(textTokens(N), 0)} tokens`, lt],
      [S.l('procesados en total', 'processed in total'), `${S.n(processed(N), 0)} tokens`, dt],
      [S.l('veces más', 'times as many'), `× ${S.n(processed(N) / textTokens(N), 1)}`, tone(S, 'err')],
    ];
    const cols = side ? 1 : 3, cw = stats.w / cols, rh = side ? 58 * u : stats.h / 1.2;
    rows.forEach(([lab, val, t], i) => {
      const x = stats.x + (i % cols) * cw, y = stats.y + Math.floor(i / cols) * rh + (side ? 0 : 8 * u);
      const ra = i === 2 ? fr(S, 'cost-total', 0.6, 0.75) : 1;
      const lh = side ? (FS(S, 12.5) + 6) * u : FS(S, 12.5) * 1.28 * 2 * u + 4 * u;   // en vertical, el rótulo puede ocupar dos renglones
      if (side) fitText(S, lab, x, y, cw - 8 * u, 12.5, { weight: 700, color: p.mute, base: 'top', a: ra });
      else para(S, lab, x, y, cw - 8 * u, FS(S, 12.5), { weight: 700, color: p.mute, maxLines: 2, a: ra });
      fitText(S, val, x, y + lh, cw - 8 * u, side ? 22 : 17, { weight: 800, font: 'mono', color: t.ink, base: 'top', a: ra });
    });
  });
  const pa = S.on('cost-pay') ? fr(S, 'cost-pay', 0.45, 0.65) : 0;
  if (pa > 0.01) {
    const txt = S.l('el turno 20 procesa veinte veces más que el turno 1', 'turn 20 processes twenty times as much as turn 1');
    if (side) para(S, txt, stats.x, stats.y + 3 * 58 * u + 6 * u, stats.w - 8 * u, FS(S, 13), { weight: 800, color: tone(S, 'err').ink, a: pa });
    else para(S, txt, P.x + 8 * u, P.y + 50 * u, P.w * 0.5, FS(S, 13), { weight: 800, color: tone(S, 'err').ink, a: pa });
  }
}
