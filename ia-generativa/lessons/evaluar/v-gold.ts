// Vistas 8–9: tus propios casos (ILUSTRATIVO: una mesa de ayuda de viáticos).
//  · drawGold (gold, gold-ex, eval-set): anatomía de un caso de oro, el ejemplo del taxi y el conjunto de evaluación.
//  · drawMix  (mix, slices, avg): cuatro grupos de casos, la nota de cada uno y el promedio que esconde dónde falla.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SLICES, mixAverage } from './data';
import { FS, area, card, chip, chipH, fitText, fr, glyph, hold, para, paraH, pct, tight } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Un caso de oro y el conjunto de evaluación
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawGold(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const ex = SLICES[0];
  // tamaño de la tarjeta grande
  const cw = Math.min(A.w, port ? A.w : 600 * u), pad = (tight(S) ? 10 : 14) * u;
  const qs = FS(S, port ? 15 : 17), as = FS(S, port ? 14 : 16);
  const slotH = Math.max(paraH(S, S.l(ex.q.es, ex.q.en), cw - 2 * pad, qs, { weight: 700 }), qs * u * 1.3) + FS(S, 12) * u + 14 * u;
  const slot2H = Math.max(paraH(S, S.l(ex.a.es, ex.a.en), cw - 2 * pad, as, { weight: 600 }), as * u * 1.3) + FS(S, 12) * u + 14 * u;
  const ch = pad + chipH(S, 13) + 10 * u + slotH + 10 * u + slot2H + pad;
  const big: Rect = { x: A.x + (A.w - cw) / 2, y: A.y + Math.max(FS(S, 12.5) * u + 12 * u, (A.h - ch) / 2), w: cw, h: ch };
  // eval-set: la tarjeta se encoge hacia una pila
  const shrink = S.on('eval-set') ? fr(S, 'eval-set', 0.02, 0.3, 'io') : 0;
  const sw = Math.min(port ? A.w * 0.46 : A.w * 0.3, 210 * u), sh = sw * 0.62;
  const stackX = port ? A.x + (A.w - sw) / 2 - 16 * u : A.x + A.w * 0.12, stackY = port ? A.y + A.h * 0.14 : A.y + (A.h - sh) / 2 - 30 * u;
  const R: Rect = { x: lerp(big.x, stackX, shrink), y: lerp(big.y, stackY, shrink), w: lerp(big.w, sw, shrink), h: lerp(big.h, sh, shrink) };
  // la pila detrás
  if (shrink > 0.01) for (let i = 4; i >= 1; i--) d.withAlpha(clamp(shrink * 1.5 - 0.3) * (1 - i * 0.12), () => card(S, { x: R.x + i * 8 * u, y: R.y - i * 8 * u, w: R.w, h: R.h }, { tone: 'w', fill: p.surface }));
  const aCard = fr(S, 'gold', 0.12, 0.26);
  d.withAlpha(aCard, () => {
    card(S, R, { tone: 'w', fill: p.surface, lw: 2 });
    if (shrink < 0.6) d.withAlpha(1 - shrink / 0.6, () => {
      chip(S, S.l('caso de oro', 'gold case'), R.x + pad, R.y + pad + chipH(S, 13) / 2, 'w', { align: 'left', a: fr(S, 'gold', 0.78, 0.9), weight: 800 });
      let y = R.y + pad + chipH(S, 13) + 10 * u;
      // pregunta
      d.withAlpha(fr(S, 'gold', 0.25, 0.38), () => {
        fitText(S, S.l('pregunta real de tu trabajo', 'real question from your work'), R.x + pad, y, R.w - 2 * pad, 12, { weight: 700, base: 'top', color: p.mute });
        const yy = y + FS(S, 12) * u + 6 * u;
        if (S.on('gold-ex')) para(S, S.l(ex.q.es, ex.q.en), R.x + pad, yy, R.w - 2 * pad, qs, { weight: 700, a: fr(S, 'gold-ex', 0.3, 0.42) });
        else d.rect(R.x + pad, yy + 4 * u, (R.w - 2 * pad) * 0.7, 8 * u, { fill: alpha(p.ink2, 0.18), r: 3 });
      });
      y += slotH + 10 * u;
      d.line(R.x + pad, y - 5 * u, R.x + R.w - pad, y - 5 * u, p.line, 1);
      d.withAlpha(fr(S, 'gold', 0.45, 0.58), () => {
        fitText(S, S.l('respuesta que aceptan tus expertos', 'answer your experts accept'), R.x + pad, y, R.w - 2 * pad, 12, { weight: 700, base: 'top', color: p.mute });
        const yy = y + FS(S, 12) * u + 6 * u;
        if (S.on('gold-ex')) {
          const k = fr(S, 'gold-ex', 0.72, 0.84);
          glyph(S, 'check', R.x + pad + 8 * u, yy + as * u * 0.6, 14 * u, tone(S, 'dat').ink, k);
          para(S, S.l(ex.a.es, ex.a.en), R.x + pad + 22 * u, yy, R.w - 2 * pad - 22 * u, as, { weight: 700, a: k, color: tone(S, 'dat').ink });
        } else d.rect(R.x + pad, yy + 4 * u, (R.w - 2 * pad) * 0.45, 8 * u, { fill: alpha(p.ink2, 0.18), r: 3 });
      });
    });
  });
  if (S.on('gold-ex') && !S.on('eval-set')) fitText(S, S.l('mesa de ayuda de viáticos · ejemplo ilustrativo', 'travel-expense help desk · illustrative example'), A.x + A.w / 2, A.y + 2 * u, A.w, 12.5, { weight: 700, align: 'center', base: 'top', color: p.mute, a: fr(S, 'gold-ex', 0.05, 0.18) });
  if (!S.on('eval-set')) return;
  // rótulo de la pila
  const lab = S.l('tu conjunto de evaluación', 'your evaluation set');
  d.withAlpha(fr(S, 'eval-set', 0.25, 0.38), () => {
    d.text(S.l('casos de oro', 'gold cases'), R.x + R.w / 2 + 16 * u, R.y + R.h / 2, { size: FS(S, 14), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'middle' });
    fitText(S, lab, R.x + R.w / 2 + 16 * u, R.y + R.h + 12 * u, Math.max(R.w + 40 * u, 200 * u), 14, { weight: 800, align: 'center', base: 'top' });
  });
  // como el conjunto de prueba (lección 10), bajo la pila; el proveedor, que no lo ha visto, a la derecha
  const k1 = fr(S, 'eval-set', 0.42, 0.54), k2 = fr(S, 'eval-set', 0.68, 0.8);
  chip(S, S.l('como el conjunto de prueba (lección 10)', 'like the test set (lesson 10)'), port ? A.x + A.w / 2 : R.x + R.w / 2 + 16 * u, R.y + R.h + 12 * u + FS(S, 14) * u * 1.3 + 10 * u + chipH(S, 12.5) / 2, 'ink', { a: k1, size: 12.5, maxW: port ? A.w : A.w * 0.5 });
  const vw = port ? A.w * 0.62 : Math.min(A.w * 0.32, 280 * u), bh = Math.min(84 * u, A.h * 0.24);
  const vx = port ? A.x + (A.w - vw) / 2 : A.x + A.w - vw - 10 * u, vy = port ? A.y + A.h - bh - 6 * u : A.y + (A.h - bh) / 2 - 10 * u;
  d.withAlpha(k2, () => {
    card(S, { x: vx, y: vy, w: vw, h: bh }, { tone: 'lat' });
    fitText(S, S.l('proveedor', 'vendor'), vx + vw / 2, vy + 12 * u, vw - 12 * u, 14, { weight: 800, align: 'center', base: 'top', color: tone(S, 'lat').ink });
    glyph(S, 'lock', vx + 22 * u, vy + bh * 0.66, 22 * u, tone(S, 'err').c);
    fitText(S, S.l('no lo ha visto', 'has not seen it'), vx + 40 * u, vy + bh * 0.66, vw - 48 * u, 13.5, { weight: 700, base: 'middle', color: tone(S, 'err').ink });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La mezcla de casos, la nota por grupo y el promedio
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawMix(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const at = [0.3, 0.5, 0.66, 0.82];
  const avg = mixAverage(), aAvg = fr(S, 'avg', 0.2, 0.35), hotRisk = hold(S, 'slices', undefined, 0.78, 0.9), hotFreq = S.on('slices') ? fr(S, 'slices', 0.42, 0.54) * (1 - 0.6 * fr(S, 'slices', 0.78, 0.9)) : 0;
  const barA = (i: number) => (S.on('slices') ? fr(S, 'slices', 0.15 + i * 0.06, 0.32 + i * 0.06) : 0);
  if (port) {
    // filas: nombre, ejemplo, barra horizontal; el promedio, en una quinta fila
    const rh = (A.h - 8 * u) / 4.7, bx = A.x, bw = A.w - 64 * u, X = (v: number) => bx + (v / 100) * bw;
    SLICES.forEach((s, i) => {
      const y = A.y + i * rh, a = fr(S, 'mix', at[i] - 0.06, at[i] + 0.06), c = tone(S, s.tone);
      const hot = s.id === 'risk' ? Math.max(hotRisk, aAvg) : s.id === 'freq' ? hotFreq : 0;
      d.withAlpha(a, () => {
        const cb = chip(S, S.l(s.es, s.en), A.x, y + chipH(S, 13) / 2, s.tone, { align: 'left', weight: 800 });
        if (s.id === 'risk' && aAvg > 0.01) glyph(S, 'warn', cb.x + cb.w + 14 * u, y + chipH(S, 13) / 2, 15 * u, tone(S, 'err').c, aAvg);
        fitText(S, S.l(s.q.es, s.q.en), A.x, y + chipH(S, 13) + 5 * u, A.w, 12.5, { weight: 600, base: 'top', color: p.ink2, italic: true });
        const by = y + chipH(S, 13) + FS(S, 12.5) * u + 12 * u, bh = Math.min(18 * u, rh - (by - y) - 6 * u);
        const k = barA(i);
        if (k > 0.01 && bh > 4) {
          d.rect(bx, by, bw, bh, { fill: p.surface2, r: 2 });
          d.rect(bx, by, (X(s.acc) - bx) * k, bh, { fill: alpha(c.c, 0.45 + 0.4 * hot), stroke: hot > 0.3 ? c.c : undefined, lw: 2, r: 2 });
          d.text(pct(S, s.acc), bx + bw + 6 * u, by + bh / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: c.ink, base: 'middle', a: k });
        }
      });
    });
    if (aAvg > 0.01) d.withAlpha(aAvg, () => {
      const y = A.y + 4 * rh + 6 * u, bh = Math.min(22 * u, rh * 0.4);
      d.line(A.x, y - 6 * u, A.x + A.w, y - 6 * u, p.lineStrong, 1.2);
      fitText(S, S.l('promedio con la mezcla real', 'average with the real mix'), A.x, y, A.w, 13, { weight: 800, base: 'top' });
      const by = y + FS(S, 13) * u + 8 * u;
      d.rect(bx, by, bw, bh, { fill: p.surface2, r: 2 });
      d.rect(bx, by, X(avg) - bx, bh, { fill: alpha(p.ink, 0.55), r: 2 });
      d.text(pct(S, Math.round(avg)), bx + bw + 6 * u, by + bh / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
    });
    return;
  }
  // horizontal: columnas con nombre y ejemplo arriba; barras verticales abajo
  const cw = A.w / 4, headH = chipH(S, 13) + 8 * u + 3 * FS(S, 12.5) * u * 1.28 + 8 * u;
  const by0 = A.y + headH + 26 * u, by1 = A.y + A.h - 20 * u, H = by1 - by0, Y = (v: number) => by1 - (v / 100) * H;
  // la línea del promedio va detrás de las barras y de sus cifras
  if (aAvg > 0.01) d.line(A.x, Y(avg), A.x + A.w, Y(avg), p.ink, 2, [6, 4], aAvg);
  SLICES.forEach((s, i) => {
    const x = A.x + i * cw, a = fr(S, 'mix', at[i] - 0.06, at[i] + 0.06), c = tone(S, s.tone);
    const hot = s.id === 'risk' ? Math.max(hotRisk, aAvg) : s.id === 'freq' ? hotFreq : 0;
    d.withAlpha(a, () => {
      chip(S, S.l(s.es, s.en), x + cw / 2, A.y + chipH(S, 13) / 2, s.tone, { weight: 800, maxW: cw - 8 * u });
      para(S, S.l(s.q.es, s.q.en), x + 6 * u, A.y + chipH(S, 13) + 8 * u, cw - 12 * u, FS(S, 12.5), { weight: 600, color: p.ink2, align: 'center', maxLines: 3, italic: true });
      const k = barA(i), bw = Math.min(cw * 0.5, 80 * u), bx = x + (cw - bw) / 2;
      if (k > 0.01) {
        d.rect(bx, by0, bw, H, { fill: p.surface2, r: 2 });
        d.rect(bx, by1 - (by1 - Y(s.acc)) * k, bw, (by1 - Y(s.acc)) * k, { fill: alpha(c.c, 0.45 + 0.4 * hot), stroke: hot > 0.3 ? c.c : undefined, lw: 2, r: 2 });
        d.text(pct(S, s.acc), x + cw / 2, Y(s.acc) - 6 * u, { size: FS(S, 16), weight: 800, font: 'mono', color: c.ink, align: 'center', base: 'bottom', a: k, halo: p.stage, haloW: 5 });
        if (s.id === 'risk' && aAvg > 0.01) glyph(S, 'warn', x + cw / 2, Y(s.acc) - FS(S, 16) * u - 22 * u, 18 * u, tone(S, 'err').c, aAvg);
      }
    });
  });
  if (barA(0) > 0.01) d.line(A.x, by1, A.x + A.w, by1, p.lineStrong, 1.5);
  if (aAvg > 0.01) d.withAlpha(aAvg, () => {
    const ya = Y(avg);
    chip(S, S.l(`promedio con la mezcla real: ${pct(S, Math.round(avg))}`, `average with the real mix: ${pct(S, Math.round(avg))}`), A.x + A.w, ya - chipH(S, 13.5) / 2 - 4 * u, 'ink', { size: 13.5, weight: 800, maxW: A.w * 0.48, align: 'right' });
  });
}
