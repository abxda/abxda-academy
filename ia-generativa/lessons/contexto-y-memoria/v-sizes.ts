// Vista 5: por qué hay un límite (GPT-3 aprendió una lista de posición para cada uno de sus 2 048 lugares) y
// vista 6: cuánto crecieron las ventanas (la escala se aleja para que quepan cien mil y un millón).
import { alpha, clamp, tone, type Frame } from '../../../../../theme/kit';
import { SIZES } from './model';
import { FS, area, chip, fitText, fr, para, smooth } from './ui';

export function drawLimit(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), lt = tone(S, 'lat'), et = tone(S, 'err');
  fitText(S, S.l('GPT-3: una lista de posición por cada lugar', 'GPT-3: one position list for each place'), A.x, A.y + 4 * u, A.w, 15, { weight: 800, base: 'top' });
  // fila de lugares: 1 2 3 4 … 2 047 2 048 | 2 049
  const labels = S.portrait ? ['1', '2', '3', '…', S.n(2048, 0), S.n(2049, 0)] : ['1', '2', '3', '4', '…', S.n(2047, 0), S.n(2048, 0), S.n(2049, 0)];
  const n = labels.length, gap = 6 * u;
  const slotW = Math.min(76 * u, (A.w - gap * (n - 1)) / n), rowW = n * slotW + (n - 1) * gap;
  const listH = Math.min(70 * u, A.h * 0.3), blockH = listH + 8 * u + 30 * u + 80 * u;
  const x0 = A.x + (A.w - rowW) / 2, y0 = A.y + 48 * u + Math.max(0, (A.h - 48 * u - blockH) * 0.4);
  labels.forEach((lab, i) => {
    const x = x0 + i * (slotW + gap), last = i === n - 1, dots = lab === '…';
    const a = last ? fr(S, 'why-limit', 0.62, 0.75) : fr(S, 'why-limit', 0.2 + 0.05 * i, 0.3 + 0.05 * i);
    if (a < 0.01) return;
    d.withAlpha(a, () => {
      if (dots) { d.text('…', x + slotW / 2, y0 + listH / 2, { size: FS(S, 18), weight: 800, color: p.mute, align: 'center', base: 'middle' }); return; }
      // la lista de posición: una columnita de números (aprendidos), salvo en el lugar que no existe
      const cw = Math.min(16 * u, slotW * 0.4), cx = x + (slotW - cw) / 2;
      if (!last) for (let k = 0; k < 5; k++) {
        const v = 0.25 + 0.6 * (((i * 5 + k * 3) % 7) / 7);
        d.rect(cx, y0 + k * (listH / 5), cw, listH / 5 - 2 * u, { fill: alpha(lt.c, v) });
      } else {
        d.rect(cx, y0, cw, listH - 2 * u, { stroke: et.c, lw: 1.6, dash: [3, 3] });
        d.line(cx - 4 * u, y0 - 2 * u, cx + cw + 4 * u, y0 + listH, et.c, 2.2);
        d.line(cx + cw + 4 * u, y0 - 2 * u, cx - 4 * u, y0 + listH, et.c, 2.2);
      }
      // la casilla del lugar
      const by = y0 + listH + 8 * u, bh = (FS(S, 12) + 12) * u;
      d.rect(x, by, slotW, bh, { fill: last ? alpha(et.c, 0.08) : p.surface, stroke: last ? et.c : p.lineStrong, lw: 1.4, r: 3, dash: last ? [4, 3] : undefined });
      fitText(S, lab, x + slotW / 2, by + bh / 2, slotW - 6 * u, 12.5, { font: 'mono', weight: 700, color: last ? et.ink : p.ink, align: 'center', base: 'middle' });
    });
  });
  const by = y0 + listH + 8 * u + (FS(S, 12) + 12) * u;
  const la = fr(S, 'why-limit', 0.3, 0.45);
  fitText(S, S.l('lugar en el texto', 'place in the text'), x0, by + 8 * u, rowW, 12.5, { weight: 700, color: p.mute, base: 'top', a: la });
  fitText(S, S.l('lista de posición (lección 22)', 'position list (lesson 22)'), x0, y0 - 6 * u, rowW, 12.5, { weight: 700, color: lt.ink, base: 'bottom', a: la });
  const ea = fr(S, 'why-limit', 0.72, 0.88);
  if (ea > 0.01) para(S, S.l('no hay lista para el lugar 2 049: ahí termina su ventana', 'there is no list for place 2,049: its window ends there'), A.x, by + 36 * u, A.w, FS(S, 14), { weight: 800, color: et.ink, align: 'center', a: ea });
}

/** Escala de la gráfica (tokens que caben a todo lo ancho): se aleja en dos pasos. */
function scaleMax(S: Frame) {
  const a = smooth(fr(S, 'size-100k', 0.08, 0.4)), b = smooth(fr(S, 'size-1m', 0.08, 0.4));
  const l0 = Math.log(2048 * 1.12), l1 = Math.log(128000 * 1.15), l2 = Math.log(1000000 * 1.18);
  return Math.exp(l0 + (l1 - l0) * a + (l2 - l1) * b);
}

export function drawSizes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), lt = tone(S, 'lat');
  const max = scaleMax(S);
  fitText(S, S.l('tamaño de la ventana de contexto (tokens)', 'context window size (tokens)'), A.x, A.y + 4 * u, A.w, 15, { weight: 800, base: 'top' });
  const show = [1, fr(S, 'size-100k', 0.3, 0.45), fr(S, 'size-1m', 0.3, 0.45), fr(S, 'size-1m', 0.45, 0.6)];
  const top = A.y + 34 * u, rowH = S.portrait ? Math.min(80 * u, (A.h - 70 * u) / 4) : Math.min(64 * u, (A.h - 40 * u) / 4.2);
  const bx = A.x, bw = A.w - 8 * u, barH = Math.min(18 * u, rowH * 0.32);
  // marca de la escala (dónde está el borde derecho)
  const e = 10 ** (Math.floor(Math.log10(max)) - 1), full = S.n(Math.round(max / e) * e, 0);
  const fullTxt = S.l(`todo lo ancho = ${full} tokens`, `full width = ${full} tokens`);
  // en vertical, debajo de las barras (arriba choca con el título)
  if (!S.portrait) fitText(S, fullTxt, A.x + A.w, top - 8 * u, A.w * 0.6, 12, { weight: 600, italic: true, color: p.mute, align: 'right', base: 'bottom' });
  SIZES.forEach((r, i) => {
    const a = show[i];
    if (a < 0.01) return;
    const y = top + i * rowH, w = clamp(r.tokens / max) * bw;
    d.withAlpha(a, () => {
      const head = `${r.name} · ${r.year}`;
      fitText(S, head, bx, y, bw * 0.6, 13.5, { weight: 800, base: 'top' });
      const yb = y + FS(S, 13.5) * u + 6 * u;
      d.rect(bx, yb, bw, barH, { fill: p.surface2 });
      d.rect(bx, yb, Math.max(1.5, w), barH, { fill: i === 0 ? lt.c : alpha(lt.c, 0.6) });
      if (r.plus) { const ax = bx + w; d.polygon([[ax + 2, yb - 2], [ax + 10 * u, yb + barH / 2], [ax + 2, yb + barH + 2]], { fill: lt.c }); }
      const val = r.plus ? S.l(`más de ${S.n(r.tokens, 0)}`, `over ${S.n(r.tokens, 0)}`) : S.n(r.tokens, 0);
      const vw = d.measure(val, { size: FS(S, 12.5), weight: 700, font: 'mono' });
      const inside = w > vw + 16 * u && w > bw * 0.5;
      const vx = inside ? bx + w - 6 * u : Math.min(bx + w + (r.plus ? 14 : 6) * u, bx + bw - vw);
      d.text(val, vx, yb + barH / 2, { size: FS(S, 12.5), weight: 700, font: 'mono', color: inside ? p.stage : p.ink, align: inside ? 'right' : 'left', base: 'middle' });
      // equivalencias en palabras
      const note = i === 0 ? S.l(`≈ ${S.n(1500, 0)} palabras en inglés`, `≈ ${S.n(1500, 0)} words of English`)
        : i === 1 ? S.l(`≈ ${S.n(75000, 0)} palabras · cupo El gran Gatsby`, `≈ ${S.n(75000, 0)} words · The Great Gatsby fit`) : '';
      const na = i === 0 ? fr(S, 'size-gpt3', 0.45, 0.6) : fr(S, 'size-100k', 0.6, 0.75);
      if (note && S.portrait) fitText(S, note, bx, yb + barH + 6 * u, bw, 12.5, { weight: 600, color: p.mute, base: 'top', a: na });
      else if (note) fitText(S, note, bx + bw, y, bw * 0.45, 12, { weight: 600, color: p.mute, align: 'right', base: 'top', a: na });
    });
  });
  if (S.portrait) fitText(S, fullTxt, A.x + A.w, top + 4 * rowH + 4 * u, A.w, 12.5, { weight: 600, italic: true, color: p.mute, align: 'right', base: 'top' });
  // «casi no se ve»: señalar la barra de GPT-3 al final (a la derecha de su cifra, en la misma línea)
  const ga = fr(S, 'size-1m', 0.65, 0.8);
  if (ga > 0.01) {
    const yb = top + FS(S, 13.5) * u + 6 * u, vw = d.measure(S.n(2048, 0), { size: FS(S, 12.5), weight: 700, font: 'mono' });
    chip(S, S.l('← casi invisible', '← barely visible'), bx + vw + 18 * u, yb + barH / 2, 'err', { align: 'left', a: ga, size: 12.5 });
  }
}
