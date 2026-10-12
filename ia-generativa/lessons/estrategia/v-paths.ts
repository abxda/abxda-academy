// Vista 4: construir, comprar o ajustar (paths … bvb-rule). Cuatro caminos, de menos a más esfuerzo: comprar un producto
// hecho, construir sobre el modelo de un proveedor (prompt y RAG, lección 31), ajustar con tus ejemplos (lección 27) y
// entrenar desde cero (lección 24: decenas de millones de dólares). La tienda construye.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, areaH, card, chip, chipH, fitText, fr, glyph, header, para, paraH, tight, type GlyphKind } from './ui';

interface Path { seg: string; g: GlyphKind; tone: Tone; t: [string, string]; what: [string, string]; when: [string, string] }
const PATHS: Path[] = [
  { seg: 'buy', g: 'cart', tone: 'sig', t: ['Comprar', 'Buy'], what: ['un producto hecho, pago por mes', 'a ready-made product, paid monthly'], when: ['lo común: transcribir, redactar', 'common tasks: transcribing, drafting'] },
  { seg: 'build', g: 'blocks', tone: 'dat', t: ['Construir', 'Build'], what: ['prompt y RAG sobre el modelo de un proveedor', 'prompt and RAG on a provider’s model'], when: ['lo que usa tus datos', 'what uses your data'] },
  { seg: 'tune', g: 'tune', tone: 'w', t: ['Ajustar', 'Fine-tune'], what: ['entrenar con tus ejemplos (lección 27)', 'train on your examples (lesson 27)'], when: ['si lo anterior no alcanza', 'if the above falls short'] },
  { seg: 'scratch', g: 'chip', tone: 'err', t: ['Desde cero', 'From scratch'], what: ['decenas de millones de dólares (lección 24)', 'tens of millions of dollars (lesson 24)'], when: ['casi nunca', 'almost never'] },
];

export function drawPaths(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 6 : 12) * u;
  header(S, 2, undefined, fr(S, 'paths', 0, 0.1));
  const ruleA = fr(S, 'bvb-rule', 0.08, 0.2);
  // reparto: arriba, el caso elegido; en medio, los cuatro caminos; abajo, la flecha del esfuerzo (y luego la regla)
  const caseH = chipH(S, 13.5) + 4 * u;
  const ruleTxt = S.l('Compra lo común · construye lo que usa tus datos · ajusta solo si no alcanza', 'Buy what is common · build what uses your data · fine-tune only if that falls short');
  const ruleH = paraH(S, ruleTxt, A.w - 24 * u, FS(S, tight(S) ? 13 : 14), { weight: 750 }) + 16 * u;
  const arrowH = FS(S, 12.5) * u + 16 * u;
  const top = A.y + caseH + gap, bot = A.y + A.h - ruleH - gap - arrowH;
  chip(S, S.l('Caso elegido: dudas de garantía', 'Chosen case: warranty questions'), A.x, A.y + caseH / 2, 'dat', { size: 13.5, align: 'left', a: fr(S, 'paths', 0.06, 0.18), maxW: A.w });
  const slots = fr(S, 'paths', 0.5, 0.64);
  PATHS.forEach((pa, i) => {
    const r = slot(S, i, top, bot, A, gap, port);
    const a = fr(S, pa.seg, 0.03, 0.15), t = tone(S, pa.tone);
    const cur = S.between(pa.seg, i < 3 ? PATHS[i + 1].seg : 'bvb-rule') ? 1 : 0;
    const chosen = pa.seg === 'build' ? ruleA : 0, out = pa.seg === 'scratch' ? ruleA : 0;
    if (a < 0.99) d.withAlpha(slots * (1 - a), () => d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1.2, dash: [5, 4], r: 5 }));
    if (a <= 0.003) return;
    d.withAlpha(a * (1 - 0.45 * out), () => {
      card(S, r, { tone: pa.tone, hot: 0.05 + 0.25 * Math.max(cur, chosen), lw: cur || chosen > 0.5 ? 2.6 : 1.5, dash: out > 0.5 ? [5, 4] : undefined, r: 5 });
      const pad = (tight(S) ? 7 : 10) * u, gs = Math.min(22 * u, r.h * 0.3);
      glyph(S, pa.g, r.x + pad + gs / 2, r.y + pad + gs / 2, gs, t.ink);
      fitText(S, S.l(pa.t[0], pa.t[1]), r.x + pad * 2 + gs, r.y + pad + gs / 2, r.w - 3 * pad - gs, 15, { weight: 800, color: t.ink, base: 'middle' });
      const sz = FS(S, tight(S) ? 12.5 : 13.5), ty = r.y + pad + gs + 6 * u, tw = r.w - 2 * pad;
      const room = r.y + r.h - pad - ty, lh = sz * u * 1.26;
      const whatL = Math.max(1, Math.min(3, Math.floor((room - lh * 1.2) / lh)));
      const wh = para(S, S.l(pa.what[0], pa.what[1]), r.x + pad, ty, tw, sz, { weight: 600, color: p.ink, maxLines: whatL });
      if (ty + wh + lh <= r.y + r.h - pad + 2) fitText(S, S.l(pa.when[0], pa.when[1]), r.x + pad, ty + wh + 3 * u, tw, tight(S) ? 12.5 : 13, { weight: 750, color: p.mute, base: 'top', italic: true });
    });
    // la elección de la tienda y el camino que casi nunca conviene
    if (chosen > 0.003) glyph(S, 'check', r.x + r.w - 14 * u, r.y + 14 * u, 18 * u, tone(S, 'dat').ink, chosen);
    if (out > 0.003) glyph(S, 'cross', r.x + r.w - 14 * u, r.y + 14 * u, 16 * u, tone(S, 'err').ink, out);
  });
  // la flecha: más esfuerzo, más costo, más control
  const ay = bot + gap + FS(S, 12.5) * u * 0.6;
  d.withAlpha(fr(S, 'paths', 0.42, 0.56), () => {
    d.arrow(A.x, ay, A.x + A.w - 2 * u, ay, alpha(p.ink, 0.7), 1.6, 7);
    fitText(S, S.l('más esfuerzo, más costo, más control →', 'more effort, more cost, more control →'), A.x + A.w / 2, ay + 5 * u, A.w, 12.5, { weight: 700, color: p.mute, base: 'top', align: 'center' });
  });
  // la regla
  const ry = A.y + A.h - ruleH;
  d.withAlpha(ruleA, () => {
    card(S, { x: A.x, y: ry, w: A.w, h: ruleH }, { tone: 'ink', hot: 0.05, lw: 2 });
    para(S, ruleTxt, A.x + 12 * u, ry + 8 * u, A.w - 24 * u, FS(S, tight(S) ? 13 : 14), { weight: 750, color: p.ink, align: 'center' });
  });
  void clamp;
}

/** Caja del camino i: cuatro escalones que suben (horizontal) o cuatro renglones que se alargan (vertical). */
function slot(S: Frame, i: number, top: number, bot: number, A: Rect, gap: number, port: boolean): Rect {
  const h = bot - top;
  if (port) {
    const rh = (h - 3 * gap) / 4, minW = A.w * 0.72;
    const w = minW + (A.w - minW) * (i / 3);
    return { x: A.x, y: top + i * (rh + gap), w, h: rh };
  }
  const cw = (A.w - 3 * gap) / 4, minH = h * 0.62;
  const ch = minH + (h - minH) * (i / 3);
  return { x: A.x + i * (cw + gap), y: bot - ch, w: cw, h: ch };
}
