// Vistas de entrada: el modelo base y lo que no sabe de tu caso (hook) → tus ejemplos entran al modelo (ft-def) → cada ejemplo es
// un par entrada → respuesta (ft-pairs) → el bucle de la lección 8 (ft-loop); y la escala de datos (ft-small).
// El bloque del modelo base son los 1 024 pesos REALES de la capa del centro del modelo diminuto; en ft-loop se les superpone el
// cambio real que les deja el ajuste completo, paso a paso. Los pares de ejemplo son ilustrativos (así se rotulan).
import { alpha, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BASE } from './base';
import { ap, area, arrowP, card, fitSize, fitText, fr, hold, isShort, lineH, mv, pill, provenance, txt } from './draw';
import { getRun, STEPS } from './runs';
import { alp, drawSigned, maxAbs } from './ui';
import { FULL } from './v-toy';

const RANGE0 = maxAbs(BASE.W2) * 0.9;

interface Lay { model: Rect; pillY: number; capY: number; chips: Rect; pairs: Rect; loop: Rect }
function layout(S: Frame): Lay {
  const A = area(S), u = S.u, port = S.portrait, short = isShort(S), ph = lineH(S, 13, 1) + 12 * u;
  if (port) {
    const side = Math.min(A.w * 0.36, A.h * 0.27);
    const model = { x: A.x, y: A.y + ph + 4 * u, w: side, h: side };
    const chips = { x: model.x + side + 14 * u, y: model.y, w: A.w - side - 14 * u, h: side };
    const top = model.y + side + 14 * u, loopH = 2 * 34 * u + 8 * u;
    return { model, pillY: A.y + ph / 2, capY: 0, chips, pairs: { x: A.x, y: top, w: A.w, h: A.y + A.h - loopH - 10 * u - top }, loop: { x: A.x, y: A.y + A.h - loopH, w: A.w, h: loopH } };
  }
  const loopH = (short ? 38 : 52) * u, loopGap = (short ? 12 : 26) * u, topH = A.h - loopH - loopGap;
  const cap = short ? 0 : lineH(S, 12, 1.2) + 10 * u;
  const side = Math.min(A.w * 0.3, topH - ph - cap);
  const mGap = Math.max((short ? 70 : 96) * u, S.d.measure(S.l('ajuste fino', 'fine-tuning'), { size: 13, weight: 800 }) + 40 * u);
  const model = { x: A.x, y: A.y + ph + Math.max(0, (topH - ph - cap - side) / 2), w: side, h: side };
  const R = { x: A.x + side + mGap, y: A.y, w: A.w - side - mGap, h: A.h };
  return { model, pillY: model.y - ph / 2, capY: model.y + side + 14 * u, chips: { x: R.x, y: model.y, w: Math.min(R.w, 320 * u), h: side }, pairs: { x: R.x, y: R.y, w: R.w, h: topH }, loop: { x: R.x, y: R.y + R.h - loopH, w: R.w, h: loopH } };
}

const PAIRS: [string, string, string, string][] = [
  ['Llegó roto mi vaso', 'My glass came broken', 'envío dañado', 'damaged item'],
  ['¿Puedo pagar a meses?', 'Can I pay monthly?', 'pagos', 'payments'],
  ['Quiero otra talla', 'I need another size', 'cambios', 'exchanges'],
];

export function drawIntro(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S), port = S.portrait;
  // ── el modelo base: sus pesos como píxeles ──
  const aM = ap(S, 'hook', 0.02, 0.16), M = L.model;
  pill(S, S.l('modelo base', 'base model'), M.x + M.w / 2, L.pillY, { s: 13, tone: 'ink', a: aM });
  drawSigned(S, M.x, M.y, BASE.W2, 32, 32, M.w / 32, { range: RANGE0, neutral: true, a: aM });
  if (S.on('ft-loop')) {
    const st = Math.round(STEPS * mv(S, 'ft-loop', 0.15, 0.95)), dW = getRun(FULL).at(st).dW;
    drawSigned(S, M.x, M.y, dW, 32, 32, M.w / 32, { range: Math.max(0.6, maxAbs(getRun(FULL).at(STEPS).dW)) * 0.7, a: 0.9 * ap(S, 'ft-loop', 0.12, 0.25), frame: false });
  }
  if (!port && !isShort(S)) fitText(S, S.l('sus parámetros: cada cuadrito es un número', 'its parameters: each little square is a number'), M.x + M.w / 2, L.capY, M.w + 30 * u, { s: 12, c: p.mute, align: 'center', a: ap(S, 'hook', 0.12, 0.25) });

  // ── lo que no sabe (hook) ──
  const aChips = hold(S, 'hook', 'ft-def', 0.25, 0.35);
  if (aChips > 0.01) {
    const C = L.chips, items = [S.l('tu tono', 'your tone'), S.l('tus formatos', 'your formats'), S.l('tus categorías', 'your categories')];
    const head = lineH(S, 12.5, 1.3), ch = Math.min(36 * u, (C.h - head) / 3.4), gap = Math.min(12 * u, (C.h - head - 3 * ch) / 3);
    d.withAlpha(aChips, () => {
      txt(S, S.l('lo que no sabe:', 'what it does not know:'), C.x, C.y + head / 2, { s: 12.5, weight: 700, c: p.mute });
      items.forEach((t, i) => {
        const a = ap(S, 'hook', 0.4 + i * 0.14, 0.52 + i * 0.14), y = C.y + head + 4 * u + i * (ch + gap), w = Math.min(C.w, 210 * u);
        d.withAlpha(a, () => {
          d.rect(C.x, y, w, ch, { fill: alpha(tone(S, 'dat').c, 0.06), stroke: tone(S, 'dat').c, lw: 1.4, r: ch / 2, dash: [5, 4] });
          fitText(S, t, C.x + 14 * u, y + ch / 2, w - 44 * u, { s: 14, weight: 700, c: tone(S, 'dat').ink });
          txt(S, '?', C.x + w - 18 * u, y + ch / 2, { s: 17, weight: 800, c: tone(S, 'dat').ink, align: 'center' });
        });
      });
    });
  }

  // ── tus ejemplos (ft-def, ft-pairs) ──
  if (S.on('ft-def')) {
    const P = L.pairs, head = lineH(S, 12.5, 1.3), rows = 3;
    const rh = Math.min((port ? 42 : 50) * u, (P.h - head * 3 - 10 * u) / rows - 8 * u), gap = Math.min(10 * u, (P.h - head * 2 - rows * rh) / rows);
    const blockH = head + rows * rh + (rows - 1) * gap;
    const y0 = port ? P.y + head * 2 : P.y + Math.max(head, (P.h - blockH) / 2);
    const wIn = P.w * (port ? 0.54 : 0.58), gx = P.w * (port ? 0.06 : 0.08), wOut = P.w - wIn - gx;
    const aCols = ap(S, 'ft-pairs', 0.08, 0.2);
    txt(S, S.l('tus ejemplos', 'your examples'), P.x, y0 - head * 1.45, { s: 13, weight: 800, c: p.ink, a: ap(S, 'ft-def', 0.25, 0.36) });
    d.withAlpha(aCols, () => {
      fitText(S, S.l('entrada', 'input'), P.x, y0 - head * 0.5, wIn, { s: 12, weight: 700, c: tone(S, 'sig').ink });
      fitText(S, port ? S.l('respuesta', 'answer') : S.l('respuesta que quieres', 'answer you want'), P.x + wIn + gx, y0 - head * 0.5, wOut, { s: 12, weight: 700, c: tone(S, 'dat').ink });
    });
    PAIRS.forEach(([ies, ien, oes, oen], i) => {
      const a = ap(S, 'ft-def', 0.32 + i * 0.1, 0.46 + i * 0.1), y = y0 + i * (rh + gap), slide = (1 - a) * 30 * u, x = P.x + slide;
      const aT = ap(S, 'ft-pairs', 0.22 + i * 0.16, 0.34 + i * 0.16);
      d.withAlpha(a, () => {
        d.rect(x, y, wIn, rh, { fill: alpha(tone(S, 'sig').c, 0.08), stroke: tone(S, 'sig').c, lw: 1.3, r: 4 });
        d.rect(x + wIn + gx, y, wOut, rh, { fill: alpha(tone(S, 'dat').c, 0.1), stroke: tone(S, 'dat').c, lw: 1.3, r: 4 });
        arrowP(S, x + wIn + 4 * u, y + rh / 2, x + wIn + gx - 4 * u, y + rh / 2, { tone: 'ink', lw: 1.6, head: 6 });
        if (aT < 1) d.withAlpha(1 - aT, () => {
          d.rect(x + 10 * u, y + rh * 0.42, wIn * 0.6, 4 * u, { fill: alp(tone(S, 'sig').c, 0.4) });
          d.rect(x + wIn + gx + 10 * u, y + rh * 0.42, wOut * 0.5, 4 * u, { fill: alp(tone(S, 'dat').c, 0.45) });
        });
        fitText(S, `«${S.l(ies, ien)}»`, x + 10 * u, y + rh / 2, wIn - 18 * u, { s: port ? 13.5 : 15, weight: 600, c: p.ink, a: aT });
        fitText(S, S.l(oes, oen), x + wIn + gx + 10 * u, y + rh / 2, wOut - 18 * u, { s: port ? 13.5 : 15, weight: 800, c: tone(S, 'dat').ink, a: aT });
      });
    });
    fitText(S, S.l('ejemplos ilustrativos', 'illustrative examples'), P.x + P.w, y0 + rows * (rh + gap) + 4 * u, P.w, { s: 12, c: p.mute, align: 'right', a: ap(S, 'ft-pairs', 0.6, 0.72) });
    // la flecha: tus ejemplos entran al modelo (ajuste fino)
    const aA = ap(S, 'ft-def', 0.5, 0.68), M2 = L.model;
    if (port) {
      const ax = M2.x + M2.w + 40 * u;
      arrowP(S, ax, y0 - head * 1.9, M2.x + M2.w + 8 * u, M2.y + M2.h * 0.75, { tone: 'w', lw: 2.6, p: mv(S, 'ft-def', 0.5, 0.68), head: 10 });
      pill(S, S.l('ajuste fino', 'fine-tuning'), Math.min(ax + 64 * u, L.chips.x + L.chips.w - 60 * u), M2.y + M2.h * 0.55, { s: 13, tone: 'w', solid: true, a: aA });
    } else {
      const ay = M2.y + M2.h / 2;
      arrowP(S, P.x - 10 * u, ay, M2.x + M2.w + 10 * u, ay, { tone: 'w', lw: 2.6, p: mv(S, 'ft-def', 0.5, 0.68), head: 10 });
      pill(S, S.l('ajuste fino', 'fine-tuning'), (P.x + M2.x + M2.w) / 2, ay - 24 * u, { s: 13, tone: 'w', solid: true, a: aA });
    }
  }

  // ── el bucle de la lección 8 (ft-loop) ──
  if (S.on('ft-loop')) {
    const A0 = area(S), short = isShort(S), R = port || short ? L.loop : { x: A0.x, y: L.loop.y, w: A0.w, h: L.loop.h };
    const labels = [S.l('responde', 'answers'), S.l('error', 'error'), S.l('retropropagación', 'backpropagation'), S.l('ajuste', 'adjustment')];
    const tones = ['sig', 'err', 'err', 'w'] as const, cols = port ? 2 : 4, rowsN = port ? 2 : 1, gap = (port ? 10 : 16) * u;
    const bw = (R.w - gap * (cols - 1)) / cols, bh = (R.h - gap * (rowsN - 1)) / rowsN;
    const act = Math.floor(fr(S, 'ft-loop', 0.55, 1) * 8) % 4, cyc = fr(S, 'ft-loop', 0.55, 1) > 0;
    labels.forEach((t, i) => {
      const order = port ? [0, 1, 3, 2][i] : i;   // en 2×2 el bucle gira en sentido horario
      const cx = R.x + (order % cols) * (bw + gap), cy = R.y + Math.floor(order / cols) * (bh + gap), a = ap(S, 'ft-loop', 0.1 + i * 0.1, 0.2 + i * 0.1), c = tone(S, tones[i]);
      d.withAlpha(a, () => {
        const on = cyc && act === i;
        d.rect(cx, cy, bw, bh, { fill: alpha(c.c, on ? 0.22 : 0.08), stroke: c.c, lw: on ? 2.4 : 1.4, r: 5 });
        fitText(S, `${i + 1}. ${t}`, cx + bw / 2, cy + bh / 2, bw - 12 * u, { s: 13, weight: 800, c: c.ink, align: 'center' });
      });
    });
    if (!port) {
      const aL = ap(S, 'ft-loop', 0.5, 0.6);
      d.withAlpha(aL, () => { const y = R.y + R.h + 6 * u, x0 = R.x + bw / 2, x1 = R.x + 3 * (bw + gap) + bw / 2; d.polyline([[x1, R.y + R.h], [x1, y], [x0, y]], p.ink2, 1.5); d.arrow(x0 + 1, y, x0, R.y + R.h + 1, p.ink2, 1.5, 6); });
      for (let i = 0; i < 3; i++) arrowP(S, R.x + i * (bw + gap) + bw + 2 * u, R.y + R.h / 2, R.x + (i + 1) * (bw + gap) - 2 * u, R.y + R.h / 2, { tone: 'ink', p: mv(S, 'ft-loop', 0.18 + i * 0.1, 0.28 + i * 0.1), head: 6 });
    }
    const capT = S.l('en color: lo que cambia el ajuste', 'in color: what tuning changes');
    if (port) fitText(S, capT, L.chips.x, L.model.y + 8 * u, L.chips.w, { s: 12, c: tone(S, 'w').ink, a: ap(S, 'ft-loop', 0.25, 0.4) });
    else if (!short) fitText(S, capT, L.model.x + L.model.w / 2, L.capY + 18 * u, L.model.w + 30 * u, { s: 12, c: tone(S, 'w').ink, align: 'center', a: ap(S, 'ft-loop', 0.25, 0.4) });
  }
}

/** ft-small: el preentrenamiento frente al ajuste fino, en el mismo modelo (LLaMA de 65 mil millones). */
export function drawScale(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, gap = (port ? 14 : 24) * u;
  const cards: Rect[] = port
    ? [{ x: A.x, y: A.y + A.h * 0.04, w: A.w, h: A.h * 0.44 }, { x: A.x, y: A.y + A.h * 0.52, w: A.w, h: A.h * 0.4 }]
    : [{ x: A.x, y: A.y + A.h * 0.12, w: (A.w - gap) * 0.6, h: A.h * 0.66 }, { x: A.x + (A.w - gap) * 0.6 + gap, y: A.y + A.h * 0.12, w: (A.w - gap) * 0.4, h: A.h * 0.66 }];
  const items = [
    { a: ap(S, 'ft-small', 0.42, 0.56), t: 'lat' as const, head: S.l('preentrenamiento de LLaMA', 'LLaMA pretraining'), num: S.n(1.4e12, 0), unit: S.l('tokens leídos', 'tokens read') },
    { a: ap(S, 'ft-small', 0.08, 0.22), t: 'dat' as const, head: S.l('ajuste fino de LIMA', 'LIMA fine-tuning'), num: S.n(1000, 0), unit: S.l('ejemplos (unos 750 000 tokens)', 'examples (about 750,000 tokens)') },
  ];
  // el ajuste aparece primero (la voz empieza por él); el preentrenamiento, después
  const order = [items[1], items[0]];
  order.forEach((it, i) => {
    const r = cards[port ? i : 1 - i], c = tone(S, it.t);
    d.withAlpha(it.a, () => {
      card(S, r, { tone: it.t, fill: 0.07 });
      const pad = 16 * u;
      fitText(S, it.head, r.x + pad, r.y + pad + lineH(S, 13.5, 1) / 2, r.w - 2 * pad, { s: 13.5, weight: 800, c: c.ink });
      const s = fitSize(S, it.num, r.w - 2 * pad, port ? 30 : 38, true, 800);
      d.text(it.num, r.x + pad, r.y + r.h / 2 + 4 * u, { size: s, weight: 800, font: 'mono', color: c.ink, base: 'middle' });
      fitText(S, it.unit, r.x + pad, r.y + r.h - pad - lineH(S, 13, 1) / 2, r.w - 2 * pad, { s: 13, weight: 600, c: p.ink2 });
    });
  });
  const mid = S.l('el mismo modelo: 65 mil millones de parámetros', 'the same model: 65 billion parameters');
  if (!port) fitText(S, mid, A.x + A.w / 2, cards[0].y + cards[0].h + 26 * u, A.w, { s: 13, weight: 700, c: p.ink2, align: 'center', a: ap(S, 'ft-small', 0.5, 0.62) });
  provenance(S, S.l('Zhou et al., 2023 (LIMA) · Touvron et al., 2023 (LLaMA)', 'Zhou et al., 2023 (LIMA) · Touvron et al., 2023 (LLaMA)'), ap(S, 'ft-small', 0.1, 0.25));
  void isShort;
}
