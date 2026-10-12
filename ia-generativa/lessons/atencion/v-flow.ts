// Vista 7 (rnn … history): la red recurrente lee en fila y lo de atrás llega apagado; la atención calcula todo a la vez
// y conecta cualquier par en un paso; el precio (n × n comparaciones) y de dónde viene la idea (2014, 2017).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { A, type Lang } from './data';
import { area, chip, fitText, fr, fz, isShort, kk, label, layoutChips, placeRow } from './ui';

export function drawFlow(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, sh = isShort(S), L = S.lang as Lang, T = A[L];
  const sg = tone(S, 'sig'), lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const phA = 1 - fr(S, 'cost', 0, 0.12), phB = fr(S, 'cost', 0.02, 0.14) * (1 - fr(S, 'history', 0, 0.12)), phC = fr(S, 'history', 0.02, 0.14);

  // ═════ A: en fila frente a todos a la vez ═════
  if (phA > 0.01) d.withAlpha(phA, () => {
    const size = fz(S, P ? 13 : 16), row = layoutChips(S, T.tok, R.w * (P ? 1 : 0.8), size);
    const titleS = fz(S, 14);
    const y1 = R.y + (P ? R.h * 0.08 : R.h * 0.1), y2 = R.y + (P ? R.h * 0.58 : sh ? R.h * 0.62 : R.h * 0.6);
    const r1 = placeRow(row, R.x + R.w / 2, y1 + titleS * u * 1.8), r2 = placeRow(row, R.x + R.w / 2, y2 + titleS * u * 1.8 + (P ? 36 : sh ? 22 : 40) * u);
    // red recurrente: un estado que pasa de token en token; lo de atrás se apaga
    const aR = fr(S, 'rnn', 0.05, 0.18);
    label(S, S.l('red recurrente: uno tras otro', 'recurrent network: one after another'), R.x + R.w / 2, y1, { a: aR, size: titleS, weight: 800, color: p.ink, base: 'top' });
    const prog = S.on('parallel') ? T.tok.length - 0.001 : fr(S, 'rnn', 0.18, 0.88, 'lin') * (T.tok.length - 0.001);
    const cur = Math.floor(prog);
    T.tok.forEach((w, i) => {
      const seen = i <= cur, fade = seen ? Math.pow(0.6, cur - i) : 0;
      chip(S, r1[i], w, { a: aR, size: row.size, tone: 'lat', strong: seen ? fade : 0 });
    });
    if (aR > 0.01) {
      const by = r1[0].y + r1[0].h + 12 * u, bw = 54 * u, bh = 20 * u;
      const fx = (t: number) => { const i = Math.min(T.tok.length - 1, Math.floor(t)), f = t - i, a0 = r1[i], a1 = r1[Math.min(T.tok.length - 1, i + 1)]; return a0.x + a0.w / 2 + ((a1.x + a1.w / 2) - (a0.x + a0.w / 2)) * clamp((f - 0.6) / 0.4); };
      const bx = fx(prog);
      for (let i = 0; i < cur; i++) { const xa = r1[i].x + r1[i].w / 2, xb = r1[i + 1].x + r1[i + 1].w / 2; d.arrow(xa + 6 * u, by + bh / 2, xb - 6 * u, by + bh / 2, p.mute, 1.2, 6 * u, aR * 0.7); }
      d.rect(bx - bw / 2, by, bw, bh, { fill: alpha(lt.c, 0.2), stroke: lt.c, lw: 1.5, r: 4, a: aR });
      label(S, S.l('estado', 'state'), bx, by + bh / 2, { a: aR, size: fz(S, 12), weight: 700, color: lt.ink });
      label(S, S.l('lo de atrás llega apagado', 'what lies far back arrives faded'), R.x + R.w / 2, by + bh + 8 * u, { a: fr(S, 'rnn', 0.7, 0.85), size: fz(S, 12), color: p.mute, base: 'top', italic: true });
    }
    // atención: todos los pares a la vez
    const aP = fr(S, 'parallel', 0.05, 0.18);
    if (aP > 0.01) {
      label(S, S.l('atención: todos a la vez', 'attention: all at once'), R.x + R.w / 2, y2, { a: aP, size: titleS, weight: 800, color: p.ink, base: 'top' });
      const arcsA = fr(S, 'parallel', 0.15, 0.35);
      for (let i = 0; i < T.tok.length; i++) for (let j = i + 1; j < T.tok.length; j++) {
        const a = r2[i], b = r2[j], x0 = a.x + a.w / 2, x1 = b.x + b.w / 2, y = a.y, lift = Math.min(36 * kk(S), 6 * u + (x1 - x0) * 0.22);
        const pts: [number, number][] = []; for (let k = 0; k <= 16; k++) { const t = k / 16, m = 1 - t; pts.push([m * m * x0 + 2 * m * t * (x0 + x1) / 2 + t * t * x1, m * m * y + 2 * m * t * (y - lift) + t * t * y]); }
        d.polyline(pts, sg.c, 1.2, { a: aP * arcsA * 0.55 });
      }
      T.tok.forEach((w, i) => chip(S, r2[i], w, { a: aP, size: row.size, tone: 'sig', strong: arcsA * 0.5 }));
      const ty = r2[0].y + r2[0].h + 10 * u;
      fitText(S, S.l('cualquier par se conecta en un paso · ideal para una GPU', 'any pair connects in one step · ideal for a GPU'), R.x + R.w / 2, ty, R.w, { a: fr(S, 'parallel', 0.45, 0.6), size: fz(S, 12), weight: 700, color: sg.ink, base: 'top' });
    }
  });

  // ═════ B: el precio, n × n ═════
  if (phB > 0.01) d.withAlpha(phB, () => {
    const boxes: [number, number][] = [[4, 0.15], [8, 0.45]];
    const labH = fz(S, 13) * u * 1.3 + 14 * u;
    const maxSide = P ? Math.min(R.w * 0.6, (R.h - labH * 3 - 10 * u) / 1.5) : Math.min(R.h * 0.62, R.w * 0.32);
    const cx = (k: number) => (P ? R.x + R.w / 2 : R.x + R.w * (k === 0 ? 0.3 : 0.7));
    boxes.forEach(([n, f], k) => {
      const a = fr(S, 'cost', f, f + 0.15), side = maxSide * (n / 8), cs = side / n;
      const x0 = cx(k) - side / 2, y0 = P ? R.y + (k === 0 ? 0 : maxSide / 2 + labH + 6 * u) : R.y + R.h * 0.12 + (maxSide - side);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d.rect(x0 + j * cs + 1, y0 + i * cs + 1, cs - 2, cs - 2, { fill: alpha(sg.c, 0.55), a: a * clamp(fr(S, 'cost', f + 0.03, f + 0.2) * n * n - (i * n + j)) });
      label(S, S.l(`${n} tokens → ${n * n} comparaciones`, `${n} tokens → ${n * n} comparisons`), cx(k), y0 + side + 8 * u, { a, size: fz(S, 13), weight: 800, color: p.ink, base: 'top' });
    });
    const aX = fr(S, 'cost', 0.7, 0.85);
    const tx = R.x + R.w / 2, ty = P ? R.y + maxSide * 1.5 + labH * 2 + 20 * u : R.y + R.h * 0.12 + maxSide + 46 * u;
    label(S, S.l('el doble de tokens → cuatro veces más', 'twice the tokens → four times as many'), tx, Math.min(ty, R.y + R.h - 10 * u), { a: aX, size: fz(S, 14), weight: 800, color: tone(S, 'err').ink });
  });

  // ═════ C: de dónde viene ═════
  if (phC > 0.01) d.withAlpha(phC, () => {
    const y = R.y + R.h * (P ? 0.2 : 0.42), x0 = R.x + R.w * 0.25, x1 = R.x + R.w * 0.75;
    const evs: [number, string, string, number][] = [
      [x0, '2014', S.l('Bahdanau, Cho y Bengio: el traductor mira la frase original', 'Bahdanau, Cho, and Bengio: the translator looks back at the source sentence'), 0.15],
      [x1, '2017', S.l('«Attention Is All You Need»: solo atención, sin recurrencia', '“Attention Is All You Need”: only attention, no recurrence'), 0.6],
    ];
    if (P) {
      evs.forEach(([, yr, txt, f], k) => {
        const a = fr(S, 'history', f, f + 0.15), yy = R.y + R.h * (0.18 + k * 0.4);
        d.circle(R.x + 14 * u, yy, 7 * u, { fill: dt.c, a });
        label(S, yr, R.x + 30 * u, yy, { a, size: fz(S, 18), weight: 800, font: 'mono', color: dt.ink, align: 'left' });
        fitText(S, txt, R.x + 30 * u, yy + 20 * u, R.w - 34 * u, { a, size: fz(S, 13), weight: 700, color: p.ink2, align: 'left', base: 'top' });
      });
      d.line(R.x + 14 * u, R.y + R.h * 0.18, R.x + 14 * u, R.y + R.h * 0.58, p.line, 2, undefined, fr(S, 'history', 0.4, 0.6));
    } else {
      d.line(x0, y, x1, y, p.line, 2, undefined, fr(S, 'history', 0.35, 0.55));
      evs.forEach(([x, yr, txt, f]) => {
        const a = fr(S, 'history', f, f + 0.15);
        d.circle(x, y, 8 * u, { fill: dt.c, a });
        label(S, yr, x, y - 14 * u, { a, size: fz(S, 18), weight: 800, font: 'mono', color: dt.ink, base: 'bottom' });
        fitText(S, txt, x, y + 16 * u, R.w * 0.46, { a, size: fz(S, 14), weight: 700, color: p.ink2, base: 'top' });
      });
    }
  });
  void (null as unknown as Rect);
}
