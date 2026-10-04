// Acto 6: cuándo sí y cuándo no. ladder / fit-for / not-facts (la escalera y lo que cada peldaño cambia), try-decide (turno: cuatro casos),
// evidence-first (tres cosas antes de ajustar), recap y bridge.
// REAL: las dos comparaciones citadas (Ovadia et al., 2023; Gekhman et al., 2024). ILUSTRATIVO (rotulado): los casos, las barras de línea base y los esquemas.
import { clamp, inset, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { CASES, OPTIONS } from './cases';
import { st } from './state';
import { FS, alp, chip, para } from './ui';

const L = (S: Frame, o: { es: string; en: string }) => o[S.lang];
const box = (S: Frame, r: Rect, tn: Tone | null, o: { a?: number; lw?: number; dash?: number[]; fill?: string } = {}) => {
  const t = tn ? tone(S, tn) : null;
  S.d.rect(r.x, r.y, r.w, r.h, { fill: o.fill ?? S.pal.surface, stroke: t ? t.c : S.pal.lineStrong, lw: o.lw ?? 1.5, r: 4, dash: o.dash, a: o.a });
};
/** Fila de rótulos que salta de línea; devuelve la y donde termina. */
function flow(S: Frame, items: string[], x: number, y: number, maxW: number, tn: Tone, a: (i: number) => number): number {
  const { d } = S, u = S.u, gap = 8 * u;
  let cx = x, cy = y;
  items.forEach((t, i) => {
    const w = d.measure(t, { size: FS(S, 13), weight: 700 }) + 14 * u;
    if (cx + w > x + maxW && cx > x) { cx = x; cy += 32 * u; }
    chip(S, t, cx, cy + 12 * u, { tone: tn, align: 'left', a: a(i), size: 13 });
    cx += w + gap;
  });
  return cy + 28 * u;
}

// ═════════════════════════════════════════════════════════════════════════════
// la escalera (ladder, fit-for, not-facts)
// ═════════════════════════════════════════════════════════════════════════════
interface Step { name: L2s; sees: L2s; cost: L2s; tn: Tone; effort: number }
type L2s = { es: string; en: string };
const STEPS3: Step[] = [
  { name: { es: 'Prompt', en: 'Prompt' }, sees: { es: 'cambia: lo que le pides', en: 'changes: what you ask' }, cost: { es: 'cuesta: casi nada', en: 'costs: almost nothing' }, tn: 'sig', effort: 1 },
  { name: { es: 'RAG', en: 'RAG' }, sees: { es: 'cambia: lo que puede consultar', en: 'changes: what it can look up' }, cost: { es: 'cuesta: un índice de documentos que mantener', en: 'costs: a document index to maintain' }, tn: 'lat', effort: 2 },
  { name: { es: 'Ajuste fino', en: 'Fine-tuning' }, sees: { es: 'cambia: cómo se comporta', en: 'changes: how it behaves' }, cost: { es: 'cuesta: datos, entrenamiento y mantenimiento', en: 'costs: data, training, and upkeep' }, tn: 'w', effort: 3 },
];

function stairGeom(S: Frame, all: Rect): { cards: Rect[]; bottom: number } {
  const u = S.u, n = 3;
  if (S.portrait) {
    const h = 54 * u, gap = 7 * u, ind = 16 * u;
    const cards = [0, 1, 2].map((i) => ({ x: all.x + i * ind, y: all.y + i * (h + gap), w: all.w - 2 * ind, h }));
    return { cards, bottom: all.y + n * (h + gap) };
  }
  const gap = 16 * u, w = (all.w - 2 * gap) / 3, h = (S.W < 700 ? 140 : 118) * u, step = 24 * u;
  const cards = [0, 1, 2].map((i) => ({ x: all.x + i * (w + gap), y: all.y + 8 * u + (2 - i) * step, w, h }));
  return { cards, bottom: all.y + 8 * u + 2 * step + h };
}

export function drawLadder(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), G = stairGeom(S, all);
  const hiFit = S.on('fit-for') ? S.at('fit-for', 0, 0.5) * (1 - S.at('not-facts', 0, 0.4)) : 0;
  const tFacts = S.at('not-facts', 0, 0.5);
  d.withAlpha(vis, () => {
    STEPS3.forEach((s, i) => {
      const r = G.cards[i], a = S.reveal('ladder', 0.2 + i * 1.5, 0.6), t = tone(S, s.tn);
      d.withAlpha(a, () => {
        const hot = i === 2 ? hiFit : i === 1 ? tFacts : 0;
        box(S, r, s.tn, { lw: 1.6 + 1.6 * hot });
        d.rect(r.x, r.y, 6 * u, r.h, { fill: t.c, r: 2 });
        d.text(L(S, s.name), r.x + 16 * u, r.y + 12 * u, { size: FS(S, 16), weight: 800, color: t.ink, base: 'top' });
        const hs = d.text(L(S, s.sees), r.x + 16 * u, r.y + (S.portrait ? 32 : 38) * u, { size: FS(S, 13), weight: 600, color: p.ink2, base: 'top', w: r.w - 30 * u }).h, yc = r.y + 38 * u + hs + 6 * u;
        // esfuerzo: tres cuadritos (cualitativo)
        const showTag = i >= 1 ? tFacts : 0, ex = r.x + r.w - 14 * u - 3 * 13 * u, ey = r.y + 14 * u;
        d.withAlpha(1 - showTag, () => {
          for (let q = 0; q < 3; q++) d.rect(ex + q * 13 * u, ey, 10 * u, 10 * u, q < s.effort ? { fill: alp(t.c, 0.85) } : { stroke: t.c, lw: 1.2 });
          if (!S.portrait && S.W >= 700) d.text(S.l('esfuerzo (cualitativo)', 'effort (qualitative)'), r.x + r.w - 14 * u, r.y + r.h - 12 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'right', base: 'bottom' });
        });
        if (!S.portrait) d.text(L(S, s.cost), r.x + 16 * u, yc, { size: FS(S, 13), weight: 600, color: p.ink2, base: 'top', w: r.w - 30 * u, a: 1 - showTag });
        // etiqueta de hechos nuevos (not-facts)
        if (i >= 1 && tFacts > 0.01) {
          const ok = i === 1;
          d.withAlpha(tFacts, () => chip(S, ok ? S.l('✓ hechos nuevos', '✓ new facts') : S.l('✗ hechos nuevos', '✗ new facts'), S.portrait ? r.x + r.w - 10 * u : r.x + 16 * u, S.portrait ? r.y + 18 * u : yc + 12 * u, { tone: ok ? 'dat' : 'err', align: S.portrait ? 'right' : 'left', dashed: !ok, size: 12 }));
        }
      });
      if (i < 2) {
        const nx = G.cards[i + 1], ar = S.reveal('ladder', 1.0 + i * 1.5, 0.5);
        d.withAlpha(ar, () => {
          if (S.portrait) d.arrow(r.x + r.w / 2 + 20 * u, r.y + r.h + 1, nx.x + nx.w / 2 + 20 * u, nx.y - 1, p.ink2, 1.6, 6);
          else d.arrow(r.x + r.w + 1, r.y + r.h * 0.5, nx.x - 1, nx.y + nx.h * 0.5, p.ink2, 1.6, 6);
        });
      }
    });
    const by = G.bottom + 14 * u, R: Rect = { x: all.x, y: by, w: all.w, h: all.y + all.h - by };
    const aL = S.reveal('ladder', 5.0, 0.6) * (1 - S.at('fit-for', 0, 0.4));
    if (aL > 0.01) d.text(S.l('Regla práctica: de lo barato a lo caro, midiendo en cada peldaño. No son excluyentes: se pueden combinar.', 'Rule of thumb: from cheap to costly, measuring at each step. They are not exclusive: they can be combined.'), R.x, R.y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: R.w, a: aL });
    // fit-for
    const aF = S.at('fit-for', 0, 0.6) * (1 - S.at('not-facts', 0, 0.4));
    if (aF > 0.01) d.withAlpha(aF, () => drawFit(S, R));
    const aN = S.at('not-facts', 0.2, 0.9);
    if (aN > 0.01) d.withAlpha(aN, () => drawFacts(S, R));
  });
}

function drawFit(S: Frame, R: Rect) {
  const { d, pal: p } = S, u = S.u, tn = 'w' as const, wt = tone(S, tn);
  const left = S.portrait ? R : { x: R.x, y: R.y, w: R.w * 0.46, h: R.h };
  d.text(S.l('sirve para cambiar…', 'good for changing…'), left.x, left.y, { size: FS(S, 13), weight: 800, color: p.ink, base: 'top', a: S.reveal('fit-for', 0.1, 0.4) });
  const items = [S.l('tono', 'tone'), S.l('formato', 'format'), S.l('vocabulario', 'vocabulary'), S.l('una tarea estrecha a gran escala', 'a narrow task at scale')];
  const endY = flow(S, items, left.x, left.y + 22 * u, left.w, tn, (i) => S.reveal('fit-for', 0.5 + i * 0.5, 0.5));
  // el prompt que se acorta (ilustrativo)
  const g: Rect = S.portrait ? { x: R.x, y: endY + 8 * u, w: R.w, h: R.y + R.h - endY - 8 * u } : { x: R.x + R.w * 0.52, y: R.y, w: R.w * 0.48, h: R.h };
  const aG = S.reveal('fit-for', 3.2, 0.7);
  d.withAlpha(aG, () => {
    const bw = Math.min(g.w * 0.34, 120 * u), lh = 9 * u, nBefore = 7, nAfter = 2;
    const bx = g.x + 4 * u, by = g.y + 20 * u;
    d.text(S.l('antes: prompt largo', 'before: long prompt'), bx, g.y, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top' });
    box(S, { x: bx, y: by, w: bw, h: nBefore * lh + 12 * u }, 'sig');
    for (let i = 0; i < nBefore; i++) d.rect(bx + 8 * u, by + 8 * u + i * lh, bw * (i % 3 === 2 ? 0.55 : 0.8), 4 * u, { fill: alp(tone(S, 'sig').c, 0.5) });
    const ax = bx + bw + 14 * u, bx2 = ax + 44 * u;
    d.arrow(ax, by + (nBefore * lh + 12 * u) / 2, ax + 34 * u, by + (nBefore * lh + 12 * u) / 2, p.ink2, 1.8, 7);
    d.text(S.l('después: prompt corto', 'after: short prompt'), bx2, g.y, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top' });
    box(S, { x: bx2, y: by, w: bw, h: nAfter * lh + 12 * u }, 'sig');
    for (let i = 0; i < nAfter; i++) d.rect(bx2 + 8 * u, by + 8 * u + i * lh, bw * 0.7, 4 * u, { fill: alp(tone(S, 'sig').c, 0.5) });
    const wy = by + nAfter * lh + 12 * u + 8 * u;
    box(S, { x: bx2, y: wy, w: bw, h: (nBefore - nAfter) * lh }, tn, { fill: wt.soft });
    d.text(S.l('en los pesos', 'in the weights'), bx2 + bw / 2, wy + ((nBefore - nAfter) * lh) / 2, { size: FS(S, 12), weight: 700, color: wt.ink, align: 'center', base: 'middle' });
    d.text(S.l('ilustrativo', 'illustrative'), bx, by + nBefore * lh + 20 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
  });
}

function drawFacts(S: Frame, R: Rect) {
  const { d, pal: p } = S, u = S.u, gap = 14 * u;
  const cw = S.portrait ? R.w : (R.w - gap) / 2, ch = S.portrait ? (R.h - gap) / 2 : Math.min(R.h, 120 * u);
  const ev = [
    { c: 'Ovadia et al., 2023', t: S.l('RAG superó al ajuste fino con texto crudo, tanto en conocimiento ya visto como en hechos nuevos.', 'RAG beat fine-tuning on raw text, on both knowledge seen before and entirely new facts.'), tn: 'lat' as const },
    { c: 'Gekhman et al., 2024', t: S.l('Los hechos nuevos se aprenden más lento y, al aprenderse, aumentan las alucinaciones.', 'New facts are learned more slowly and, once learned, increase hallucinations.'), tn: 'err' as const },
  ];
  ev.forEach((e, i) => {
    const r: Rect = S.portrait ? { x: R.x, y: R.y + i * (ch + gap), w: cw, h: ch } : { x: R.x + i * (cw + gap), y: R.y, w: cw, h: ch }, a = S.reveal('not-facts', 0.8 + i * 1.6, 0.6);
    d.withAlpha(a, () => {
      box(S, r, e.tn);
      chip(S, e.c, r.x + 10 * u, r.y + 16 * u, { tone: e.tn, align: 'left', size: 12 });
      para(S, e.t, r.x + 12 * u, r.y + 36 * u, r.w - 24 * u, { size: 13, weight: 600, color: p.ink, lh: 1.28 });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// try-decide: cuatro casos (turno)
// ═════════════════════════════════════════════════════════════════════════════
interface DG { card: Rect; btns: Rect[]; fb: Rect; list: Rect; row: number }
export function decideGeom(S: Frame): DG {
  const u = S.u, all = inset(S.full(), 14 * u), bh = Math.max(40, 40 * u);
  if (S.portrait) {
    const card: Rect = { x: all.x, y: all.y, w: all.w, h: 218 * u };
    const bg = 6 * u, bw = (card.w - 20 * u - 2 * bg) / 3, by = card.y + 112 * u;
    const btns = [0, 1, 2].map((i) => ({ x: card.x + 10 * u + i * (bw + bg), y: by, w: bw, h: bh }));
    const ly = card.y + card.h + 8 * u;
    return { card, btns, fb: { x: card.x + 10 * u, y: by + bh + 8 * u, w: card.w - 20 * u, h: card.y + card.h - by - bh - 10 * u }, list: { x: all.x, y: ly, w: all.w, h: all.y + all.h - ly }, row: Math.min(44 * u, (all.y + all.h - ly) / 4) };
  }
  const lw = all.w * 0.5, card: Rect = { x: all.x, y: all.y, w: lw, h: Math.min(all.h, 312 * u) };
  const bg = 8 * u, bw = (lw - 24 * u - 2 * bg) / 3, by = card.y + 176 * u;
  const btns = [0, 1, 2].map((i) => ({ x: card.x + 12 * u + i * (bw + bg), y: by, w: bw, h: bh }));
  const lx = all.x + lw + 18 * u;
  return { card, btns, fb: { x: card.x + 12 * u, y: by + bh + 14 * u, w: lw - 24 * u, h: card.y + card.h - by - bh - 24 * u }, list: { x: lx, y: all.y, w: all.x + all.w - lx, h: all.h }, row: all.h / 4 };
}
export const decideHit = (S: Frame, x: number, y: number): number => {
  if (!S.between('try-decide', 'evidence-first')) return -1;
  const dec = st(S).dec;
  if (dec.idx >= CASES.length) return -1;
  return decideGeom(S).btns.findIndex((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
};

const glyphOk = (S: Frame, x: number, y: number, r: number, tn: Tone) => { const { d } = S, t = tone(S, tn); d.circle(x, y, r, { fill: t.soft, stroke: t.c, lw: 1.6 }); d.polyline([[x - r * 0.45, y], [x - r * 0.1, y + r * 0.38], [x + r * 0.5, y - r * 0.38]], t.ink, 2); };

export function drawDecide(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, G = decideGeom(S), dec = st(S).dec, all = dec.idx >= CASES.length;
  const hover = S.ptr.inside ? G.btns.findIndex((b) => S.ptr.x >= b.x && S.ptr.x <= b.x + b.w && S.ptr.y >= b.y && S.ptr.y <= b.y + b.h) : -1;
  d.withAlpha(vis, () => {
    // tarjeta del caso actual
    const c = all ? CASES[CASES.length - 1] : CASES[dec.idx], a0 = S.reveal('try-decide', 0, 0.6);
    d.withAlpha(a0, () => {
      box(S, G.card, all ? 'dat' : 'ink', { lw: 1.8 });
      d.text(all ? S.l('Los cuatro casos, resueltos', 'All four cases, solved') : S.l(`caso ${dec.idx + 1} de ${CASES.length}  ·  ilustrativo`, `case ${dec.idx + 1} of ${CASES.length}  ·  illustrative`), G.card.x + 12 * u, G.card.y + 10 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
      if (!all) {
        d.text(L(S, c.title), G.card.x + 12 * u, G.card.y + (S.portrait ? 28 : 32) * u, { size: FS(S, 16), weight: 800, color: p.ink, base: 'top' });
        para(S, L(S, c.text), G.card.x + 12 * u, G.card.y + (S.portrait ? 50 : 62) * u, G.card.w - 24 * u, { size: 13.5, weight: 600, color: p.ink2, lh: 1.28 });
        G.btns.forEach((b, i) => {
          const wrong = dec.wrong && dec.wrong.idx === dec.idx && dec.wrong.opt === i, hot = hover === i;
          d.rect(b.x, b.y, b.w, b.h, { fill: wrong ? tone(S, 'err').soft : hot ? p.surface2 : p.surface, stroke: wrong ? tone(S, 'err').c : p.lineStrong, lw: wrong ? 2 : 1.6, r: 4, dash: wrong ? [5, 3] : undefined });
          d.text((wrong ? '✗ ' : '') + L(S, OPTIONS[i]), b.x + b.w / 2, b.y + b.h / 2, { size: FS(S, 14), weight: 800, color: wrong ? tone(S, 'err').ink : p.ink, align: 'center', base: 'middle' });
        });
      }
      // retroalimentación del último movimiento
      let fb: { t: string; tn: Tone } | null = null;
      if (dec.wrong && dec.wrong.idx === dec.idx && !all) fb = { t: '✗ ' + L(S, c.hint[dec.wrong.opt]), tn: 'err' };
      else if (dec.lastOk >= 0) fb = { t: '✓ ' + L(S, CASES[dec.lastOk].why), tn: 'dat' };
      if (fb) para(S, fb.t, G.fb.x, all ? G.card.y + 40 * u : G.fb.y, G.fb.w, { size: 13, weight: 700, color: tone(S, fb.tn).ink, lh: 1.28 });
      if (all) {
        const free = CASES.filter((q) => q.answer !== 2).length;
        para(S, S.l(`${S.n(free, 0)} de los ${S.n(CASES.length, 0)} casos se resolvían sin ajustar el modelo.`, `${S.n(free, 0)} of the ${S.n(CASES.length, 0)} cases were solved without tuning the model.`), G.fb.x, G.card.y + (S.portrait ? 150 : 170) * u, G.fb.w, { size: 14, weight: 800, color: p.ink, lh: 1.28 });
      }
    });
    // lista de los cuatro casos
    CASES.forEach((q, i) => {
      const y = G.list.y + i * G.row, solved = dec.picks[i] !== undefined, cur = i === dec.idx && !all, ai = S.reveal('try-decide', 0.3 + i * 0.15, 0.5);
      d.withAlpha(ai, () => {
        if (i > 0) d.line(G.list.x, y, G.list.x + G.list.w, y, p.line, 1);
        const gx = G.list.x + 12 * u, gy = y + (S.portrait ? G.row / 2 : 22 * u);
        if (solved) glyphOk(S, gx, gy, 9 * u, 'dat');
        else if (cur) { d.polygon([[gx - 6 * u, gy - 8 * u], [gx + 8 * u, gy], [gx - 6 * u, gy + 8 * u]], { fill: p.ink }); }
        else d.circle(gx, gy, 8 * u, { stroke: p.lineStrong, lw: 1.5, dash: [3, 3] });
        d.text(L(S, q.title), gx + 22 * u, gy, { size: FS(S, 14), weight: cur ? 800 : 700, color: solved || cur ? p.ink : p.mute, base: 'middle' });
        if (solved) chip(S, L(S, OPTIONS[dec.picks[i]]), G.list.x + G.list.w - 4 * u, gy, { align: 'right', tone: dec.picks[i] === 2 ? 'w' : dec.picks[i] === 1 ? 'lat' : 'sig', size: 12 });
        if (solved && !S.portrait) para(S, L(S, q.why), gx + 22 * u, y + 38 * u, G.list.w - 40 * u, { size: 12, weight: 600, color: p.ink2, lh: 1.25 });
      });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// evidence-first: tres cosas antes de ajustar
// ═════════════════════════════════════════════════════════════════════════════
export function drawEvidence(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), gap = 14 * u;
  const foot = (S.portrait ? 46 : 40) * u;
  const cw = S.portrait ? all.w : (all.w - 2 * gap) / 3, ch = S.portrait ? (all.h - foot - 2 * gap) / 3 : Math.min(all.h - foot, 270 * u);
  const titles = [S.l('pocos ejemplos, pero buenos', 'few examples, but good ones'), S.l('tu propia evaluación', 'your own evaluation'), S.l('una línea base', 'a baseline')];
  const caps = [S.l('revisados por quien conoce la tarea', 'reviewed by someone who knows the task'), S.l('con datos que el ajuste no vio, y también de lo anterior', 'on data the tuning did not see, and on what came before too'), S.l('lo que logran un prompt o RAG, medido', 'what a prompt or RAG achieves, measured')];
  const tns: Tone[] = ['dat', 'sig', 'w'];
  d.withAlpha(vis, () => {
    [0, 1, 2].forEach((i) => {
      const r: Rect = S.portrait ? { x: all.x, y: all.y + i * (ch + gap), w: cw, h: ch } : { x: all.x + i * (cw + gap), y: all.y, w: cw, h: ch }, a = S.reveal('evidence-first', 0.3 + i * 2.4, 0.6), t = tone(S, tns[i]);
      d.withAlpha(a, () => {
        box(S, r, tns[i]);
        const th = d.text(titles[i], r.x + 12 * u, r.y + 10 * u, { size: FS(S, 14), weight: 800, color: t.ink, base: 'top', w: r.w - 24 * u }).h, ty = r.y + 10 * u + th + 8 * u;
        const vis2: Rect = S.portrait ? { x: r.x + 12 * u, y: ty, w: 108 * u, h: r.y + r.h - ty - 8 * u } : { x: r.x + 14 * u, y: ty, w: r.w - 28 * u, h: Math.min(r.h * 0.4, 100 * u) };
        miniVis(S, i, vis2, a);
        const cap: Rect = S.portrait ? { x: vis2.x + vis2.w + 12 * u, y: ty, w: r.x + r.w - (vis2.x + vis2.w) - 24 * u, h: r.h - 40 * u } : { x: r.x + 12 * u, y: vis2.y + vis2.h + 14 * u, w: r.w - 24 * u, h: r.h * 0.3 };
        para(S, caps[i], cap.x, cap.y, cap.w, { size: 13, weight: 600, color: p.ink2, lh: 1.28 });
      });
    });
    d.text(S.l('Sin evaluación, ajustar cambia el modelo sin demostrar que mejoró.', 'Without evaluation, tuning changes the model without proving it improved.'), all.x, (S.portrait ? all.y + all.h - foot : all.y + ch) + 16 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', w: all.w, a: S.reveal('evidence-first', 8.0, 0.6) });
  });
}

function miniVis(S: Frame, i: number, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u;
  if (i === 0) {                                   // seis pares entrada → respuesta, cada uno con su visto bueno
    const cols = S.portrait ? 1 : 2, rows = S.portrait ? 3 : 3, cw = r.w / cols, rh = Math.min(r.h / rows, 22 * u);
    for (let k = 0; k < 6 && k < cols * rows * (S.portrait ? 1 : 1); k++) {
      const cx = r.x + (k % cols) * cw, cy = r.y + Math.floor(k / cols) * rh, w1 = cw * 0.34, w2 = cw * 0.26, ak = clamp((a - k * 0.04));
      d.withAlpha(ak, () => {
        d.rect(cx, cy, w1, rh - 5 * u, { fill: tone(S, 'sig').soft, stroke: tone(S, 'sig').c, lw: 1.2, r: 2 });
        d.arrow(cx + w1 + 2, cy + (rh - 5 * u) / 2, cx + w1 + 14 * u, cy + (rh - 5 * u) / 2, p.ink2, 1.3, 4);
        d.rect(cx + w1 + 16 * u, cy, w2, rh - 5 * u, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.2, r: 2 });
        glyphOk(S, cx + w1 + w2 + 32 * u, cy + (rh - 5 * u) / 2, 6 * u, 'dat');
      });
    }
  } else if (i === 1) {                            // dos filas de pruebas: lo nuevo y lo anterior
    const n = S.portrait ? 6 : 8, s = Math.min((r.w - 70 * u) / n, 16 * u, r.h / 2.3), rows = [{ l: S.l('nuevo', 'new'), bad: [5] }, { l: S.l('anterior', 'old'), bad: [] as number[] }];
    rows.forEach((row, ri) => {
      const y = r.y + ri * (s + 8 * u) + 4 * u;
      d.text(row.l, r.x, y + s / 2, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
      for (let k = 0; k < n; k++) {
        const x = r.x + 62 * u + k * (s + 3 * u), bad = row.bad.includes(k);
        if (bad) { d.rect(x, y, s, s, { stroke: tone(S, 'err').c, lw: 1.5, dash: [3, 2] }); d.line(x + 3, y + 3, x + s - 3, y + s - 3, tone(S, 'err').c, 1.6); d.line(x + 3, y + s - 3, x + s - 3, y + 3, tone(S, 'err').c, 1.6); }
        else { d.rect(x, y, s, s, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.2 }); d.polyline([[x + s * 0.25, y + s * 0.52], [x + s * 0.45, y + s * 0.72], [x + s * 0.78, y + s * 0.3]], tone(S, 'dat').ink, 1.6); }
      }
    });
  } else {                                         // línea base: prompt y RAG medidos; el ajuste fino, por demostrar (ilustrativo)
    const bars = [{ l: 'prompt', v: 0.62, g: false }, { l: 'RAG', v: 0.71, g: false }, { l: S.l('ajuste fino', 'fine-tuning'), v: 0.85, g: true }];
    const bh = Math.min(14 * u, r.h / 4.2), lw = Math.max(76 * u, ...bars.map((b) => d.measure(b.l, { size: FS(S, 12), weight: 700 })) ) + 10 * u;
    bars.forEach((b, k) => {
      const y = r.y + k * (bh + 8 * u), w = r.w - lw;
      d.text(b.l, r.x, y + bh / 2, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
      d.rect(r.x + lw, y, w, bh, { fill: p.surface2 });
      if (b.g) d.rect(r.x + lw, y, w * b.v, bh, { stroke: tone(S, 'w').c, lw: 1.6, dash: [4, 3] }); else d.rect(r.x + lw, y, w * b.v, bh, { fill: alp(tone(S, 'w').c, 0.78) });
    });
    d.text(S.l('ilustrativo', 'illustrative'), r.x + r.w, r.y + 3 * (bh + 8 * u) - 2 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top' });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// recap y bridge
// ═════════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), gap = 12 * u, rh = (all.h - 2 * gap) / 3;
  const caps = [S.l('Ajustar es seguir entrenando, con tus ejemplos.', 'Tuning is more training, on your examples.'), S.l('LoRA entrena solo una corrección de bajo rango: cuesta una fracción y se puede quitar.', 'LoRA trains only a low-rank correction: it costs a fraction and can be removed.'), S.l('Sirve para cambiar comportamiento, no para meter hechos frescos: para eso, RAG.', 'It is for changing behavior, not for stuffing in fresh facts: for those, RAG.')];
  const tns: Tone[] = ['err', 'w', 'lat'];
  d.withAlpha(vis, () => {
    [0, 1, 2].forEach((i) => {
      const r: Rect = { x: all.x, y: all.y + i * (rh + gap), w: all.w, h: rh }, a = S.reveal('recap', 0.3 + i * 3.0, 0.6), t = tone(S, tns[i]);
      d.withAlpha(a, () => {
        box(S, r, tns[i]);
        d.rect(r.x, r.y, 6 * u, r.h, { fill: t.c, r: 2 });
        if (S.portrait) {
          const vr: Rect = { x: r.x + 18 * u, y: r.y + 10 * u, w: r.w - 32 * u, h: 52 * u };
          recapVis(S, i, vr);
          para(S, caps[i], vr.x, r.y + 78 * u, vr.w, { size: 14, weight: 700, color: p.ink, lh: 1.28 });
        } else {
          const vr: Rect = { x: r.x + 20 * u, y: r.y + 8 * u, w: 360 * u, h: r.h - 16 * u }, cx = vr.x + vr.w + 24 * u;
          recapVis(S, i, vr);
          para(S, caps[i], cx, r.y + r.h / 2 - 20 * u, r.x + r.w - cx - 18 * u, { size: 15, weight: 700, color: p.ink, lh: 1.28 });
        }
      });
    });
  });
}

function recapVis(S: Frame, i: number, r: Rect) {
  const { d, pal: p } = S, u = S.u, cy = r.y + r.h / 2;
  if (i === 0) {
    const labels = [S.l('ejemplo', 'example'), S.l('error', 'error'), S.l('gradiente', 'gradient'), S.l('actualizar', 'update')], tns: Tone[] = ['dat', 'err', 'err', 'w'];
    const g = (S.portrait ? 8 : 14) * u, bw = (r.w - 3 * g) / 4, bh = 32 * u;
    for (let k = 0; k < 4; k++) {
      const x = r.x + k * (bw + g), t = tone(S, tns[k]);
      d.rect(x, cy - bh / 2, bw, bh, { fill: t.soft, stroke: t.c, lw: 1.3, r: 3 });
      d.text(labels[k], x + bw / 2, cy, { size: FS(S, 12), weight: 700, color: t.ink, align: 'center', base: 'middle' });
      if (k < 3) d.arrow(x + bw + 1, cy, x + bw + g - 1, cy, p.ink2, 1.4, 4);
    }
  } else if (i === 1) {
    const s = Math.min(r.h - 6 * u, 44 * u), t = tone(S, 'w'), x0 = r.x + 4 * u, y0 = cy - s / 2;
    d.rect(x0, y0, s, s, { fill: p.surface2, stroke: p.ink2, lw: 1.5 });
    d.dither(x0 + 1, y0 + 1, s - 2, s - 2, p.ink, 0.3, 2);
    d.text('W₀', x0 + s / 2, cy, { size: FS(S, 14), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.surface2, haloW: 5 });
    d.text('+', x0 + s + 14 * u, cy, { size: 20, weight: 800, color: p.ink2, align: 'center', base: 'middle' });
    const bx = x0 + s + 28 * u, ax = bx + 30 * u;
    d.rect(bx, y0, 8 * u, s, { fill: t.c });
    d.text('B', bx + 4 * u, y0 + s + 3 * u, { size: FS(S, 12), weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'top' });
    d.text('·', bx + 19 * u, cy, { size: 20, weight: 800, color: p.ink2, align: 'center', base: 'middle' });
    d.rect(ax, cy - 4 * u, s, 8 * u, { fill: t.c });
    d.text('A', ax + s / 2, cy + 7 * u, { size: FS(S, 12), weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'top' });
  } else {
    const rows = [{ t: S.l('comportamiento → ajuste fino', 'behavior → fine-tuning'), tn: 'w' as Tone }, { t: S.l('hechos que cambian → RAG', 'changing facts → RAG'), tn: 'lat' as Tone }];
    rows.forEach((q, k) => chip(S, q.t, r.x + 4 * u, cy + (k - 0.5) * 32 * u, { tone: q.tn, align: 'left', size: 13 }));
  }
}

export function drawBridge(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), cx = all.x + all.w / 2;
  d.withAlpha(vis, () => {
    const a0 = S.reveal('bridge', 0.2, 0.6), a1 = S.reveal('bridge', 2.0, 0.7);
    // lo que ya sabemos hacer
    const known = [S.l('ajuste fino: tus ejemplos', 'fine-tuning: your examples'), S.l('LoRA: barato y reversible', 'LoRA: cheap and reversible')];
    if (S.portrait) known.forEach((t, k) => chip(S, t, cx, all.y + 18 * u + k * 32 * u, { tone: 'w', a: a0, size: 13 }));
    else known.forEach((t, k) => chip(S, t, cx + (k ? 1 : -1) * 120 * u, all.y + 18 * u, { tone: 'w', a: a0, size: 13 }));
    // la pregunta
    const qy = all.y + (S.portrait ? 92 : 72) * u;
    d.withAlpha(a1, () => {
      d.text('?', cx, qy + (S.portrait ? 30 : 38) * u, { size: S.portrait ? 64 : 84, weight: 800, font: 'mono', color: tone(S, 'lat').ink, align: 'center', base: 'middle' });
      para(S, S.l('¿Qué ejemplos y qué señal convierten un modelo que solo completa texto en un asistente?', 'Which examples and which signal turn a model that only completes text into an assistant?'), cx, qy + (S.portrait ? 74 : 92) * u, all.w - (S.portrait ? 16 : 120) * u, { size: S.portrait ? 16 : 19, weight: 800, color: p.ink, align: 'center', lh: 1.28 });
    });
    // lo que un asistente hace (se verá en la lección siguiente)
    const items = [S.l('seguir instrucciones', 'follow instructions'), S.l('ser útil', 'be helpful'), S.l('negarse cuando toca', 'decline when it should')];
    const ws = items.map((t) => d.measure(t, { size: FS(S, 13), weight: 700 }) + 14 * u), gap = 12 * u, total = ws.reduce((a, b) => a + b, 0) + gap * 2;
    const by = all.y + all.h - (S.portrait ? 76 : 30) * u;
    if (!S.portrait && total <= all.w - 120 * u) {
      let x = cx - total / 2;
      items.forEach((t, k) => { chip(S, t, x, by, { tone: 'lat', align: 'left', a: S.reveal('bridge', 5.0 + k * 0.6, 0.5), size: 13 }); x += ws[k] + gap; });
    } else items.forEach((t, k) => chip(S, t, cx, by + k * 30 * u, { tone: 'lat', a: S.reveal('bridge', 5.0 + k * 0.6, 0.5), size: 13 }));
    if (!S.portrait) neu(S, all.x + 40 * u, all.y + all.h - 54 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: a1 });
  });
}
