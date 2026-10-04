// Acto 4: recuperar. La pregunta se vuelve vector, se compara con los 25 fragmentos (coseno TF-IDF, en vivo), se ordenan y se
// toman los k mejores. Cada barra es una puntuación real. En el turno de la persona la pregunta es la que escribe o elige.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ABSTAIN } from './ir';
import { board, demoQ, lang, nopeQ, stemSet, surfaceOf, userQuery } from './model';
import { angleDeg, area, cardH, chunkCard, drawFlow, fit, flow, fz, lh, srcShort, tagAt, toks } from './ui';

/** La pregunta que se muestra según el segmento: demo fija, la de la persona, o la que el manual no responde. */
export function activeQ(S: Frame): string {
  const l = lang(S);
  if (S.on('abstain')) return nopeQ(l).q;
  if (S.on('try-ask')) return userQuery(S);
  return demoQ(l).q;
}

interface Lay { q: Rect; chart: Rect; cards: Rect }
function layout(S: Frame, A: Rect, qh: number): Lay {
  const u = S.u, gap = 10 * u;
  if (S.portrait) {
    const ch = Math.min(124 * u, A.h * 0.31), cy = A.y + qh + gap;
    return { q: { x: A.x, y: A.y, w: A.w, h: qh }, chart: { x: A.x, y: cy, w: A.w, h: ch }, cards: { x: A.x, y: cy + ch + gap, w: A.w, h: A.y + A.h - (cy + ch + gap) } };
  }
  const w1 = A.w * 0.5, y = A.y + qh + gap;
  return { q: { x: A.x, y: A.y, w: A.w, h: qh }, chart: { x: A.x, y, w: w1, h: A.y + A.h - y }, cards: { x: A.x + w1 + 14 * u, y, w: A.w - w1 - 14 * u, h: A.y + A.h - y } };
}

export function drawBoard(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S, true), sz = fz(S, 13), L = lh(S, sz);
  const q = activeQ(S), B = board(l, q, 3), ix = B.ix, N = ix.N, lat = tone(S, 'lat'), sg = tone(S, 'sig');
  const hit = stemSet(l, q);

  // ── tarjeta de la pregunta ──
  const qFlow = flow(S, 'bq|' + q, toks(S, q, { hit, hitTone: 'sig' }), A.w - 20 * u - 70 * u, sz, { weight: 700, maxLines: S.portrait ? 2 : 2 });
  const wts = [...B.qv].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, w]) => `${surfaceOf(l, ix.vocab[k])} ${S.n(w, 2)}`);
  const wtxt = wts.length ? wts.join(' · ') : S.l('ninguna palabra conocida', 'no known word');
  const qh = 12 * u + qFlow.h + L * 1.2 + 6 * u;
  const R = layout(S, A, qh);
  d.withAlpha(S.reveal('ask', 0, 0.5), () => {
    d.rect(R.q.x, R.q.y, R.q.w, R.q.h, { fill: sg.soft, stroke: sg.c, lw: 1.5, r: 4 });
    d.text(S.l('Pregunta', 'Question'), R.q.x + 10 * u, R.q.y + 6 * u + L / 2, { size: sz * 0.92, weight: 800, color: sg.ink, base: 'middle' });
    drawFlow(S, qFlow, R.q.x + 10 * u + 70 * u, R.q.y + 6 * u, { weight: 700 });
    const vy = R.q.y + 8 * u + qFlow.h + L * 0.5;
    d.text(fit(S, S.l('vector: ', 'vector: ') + wtxt, R.q.w - 20 * u, sz * 0.92, 600, 'mono'), R.q.x + 10 * u, vy, { size: sz * 0.92, weight: 600, font: 'mono', color: p.ink2, base: 'middle' });
  });

  // ── barras: una por fragmento ──
  const C = R.chart, tSort = S.on('topk') ? S.at('topk', 0.2, 1.5, 'io') : 0, grow = S.on('cosine') ? S.at('cosine', 0.3, 2.2, 'out') : 0;
  const vis = S.on('try-ask') || S.on('abstain') ? 1 : grow, sortT = S.on('try-ask') || S.on('abstain') ? 1 : tSort;
  const ranks = new Array<number>(N); B.hits.forEach((h, r) => { ranks[h.i] = r; });
  const top = B.hits[0]?.score ?? 0, smax = Math.max(0.4, top * 1.2);
  const padL = 4 * u, baseY = C.y + C.h - L * 1.5, areaH = C.h - L * 2.0, slot = (C.w - padL) / N, bw = Math.max(3 * u, slot * 0.74);
  const a0 = S.reveal('ask', 0.6, 0.6), asked = !S.on('cosine');
  d.withAlpha(a0, () => {
    d.line(C.x + padL, baseY, C.x + C.w, baseY, p.lineStrong, 1.5);
    if (asked) {
      // todavía sin comparar: 25 huecos, uno por fragmento
      for (let i = 0; i < N; i++) d.rect(C.x + padL + i * slot + (slot - bw) / 2, baseY - areaH * 0.34, bw, areaH * 0.34, { stroke: alpha(lat.c, 0.7), lw: 1, dash: [3, 3] });
      d.text(S.l(`${N} fragmentos del índice, todavía sin comparar`, `${N} chunks in the index, not compared yet`), C.x + padL, baseY + L * 0.8, { size: sz * 0.92, weight: 600, color: p.mute, base: 'middle' });
      return;
    }
    // umbral
    const ty = baseY - areaH * clamp(ABSTAIN / smax);
    d.line(C.x + padL, ty, C.x + C.w, ty, tone(S, 'err').c, 1.5, [5, 4]);
    if (S.on('abstain') || S.on('try-ask')) d.text(S.l('umbral', 'threshold'), C.x + C.w - 2 * u, ty - L * 0.45, { size: sz * 0.92, weight: 700, color: tone(S, 'err').ink, align: 'right', base: 'middle', halo: p.stage });
    for (let i = 0; i < N; i++) {
      const sc = B.hits.find((h) => h.i === i)!.score, r = ranks[i], x = C.x + padL + lerp(i, r, sortT) * slot + (slot - bw) / 2;
      const hgt = Math.max(1.5 * u, areaH * clamp((sc / smax) * vis)), isTop = r < 3 && sc > 0 && sortT > 0.5;
      d.rect(x, baseY - hgt, bw, hgt, { fill: isTop ? lat.c : alpha(lat.c, lerp(0.62, 0.3, sortT)) });
      if (isTop && sortT > 0.9) {
        const by = baseY - hgt - 11 * u, rr = 8 * u;
        d.circle(x + bw / 2, by, rr, { fill: lat.c }); d.text(String(r + 1), x + bw / 2, by, { size: sz * 0.85, weight: 800, color: p.stage, align: 'center', base: 'middle' });
      }
    }
    const lab = sortT > 0.5 ? S.l('coseno · de más a menos parecido', 'cosine · most to least similar') : S.l(`coseno · ${N} fragmentos, en el orden del manual`, `cosine · ${N} chunks, in manual order`);
    d.text(lab, C.x + padL, baseY + L * 0.8, { size: sz * 0.92, weight: 600, color: p.mute, base: 'middle' });
  });

  // ── a la derecha/abajo: la brújula (cosine) o las tarjetas (topk…) ──
  const showFan = S.between('cosine', 'topk'), showCards = S.on('topk');
  if (showFan) drawFan(S, R.cards, B, ix);
  if (showCards) {
    const cr = R.cards, k = 3;
    const ch = Math.min(cardH(S, S.portrait ? 2 : 3), (cr.h - (k - 1) * 6 * u) / k);
    const abst = B.abstain;
    if (abst) {
      d.withAlpha(S.reveal('topk', 0.2, 0.4), () => {
        const er = tone(S, 'err'), hh = Math.min(cr.h, L * 6);
        d.rect(cr.x, cr.y, cr.w, hh, { fill: er.soft, stroke: er.c, lw: 2, r: 4, dash: [6, 4] });
        d.text(S.l('No lo encuentro en el manual', 'I can’t find it in the manual'), cr.x + cr.w / 2, cr.y + hh * 0.34, { size: sz * 1.05, weight: 800, color: er.ink, align: 'center', base: 'middle', w: cr.w - 16 * u });
        d.text(S.l(`mejor coseno ${S.n(B.top, 2)} < umbral ${S.n(ABSTAIN, 2)}`, `best cosine ${S.n(B.top, 2)} < threshold ${S.n(ABSTAIN, 2)}`), cr.x + cr.w / 2, cr.y + hh * 0.72, { size: sz * 0.95, weight: 600, font: 'mono', color: p.ink2, align: 'center', base: 'middle' });
      });
    } else for (let r = 0; r < k; r++) {
      const h = B.hits[r], a = S.reveal(S.on('try-ask') ? 'try-ask' : 'topk', S.on('try-ask') ? 0 : 0.9 + r * 0.35, 0.4);
      chunkCard(S, { x: cr.x, y: cr.y + r * (ch + 6 * u), w: cr.w, h: ch }, ix.chunks[h.i], { rank: r + 1, score: S.n(h.score, 2), hit, tone: 'lat', a, subtle: h.score < ABSTAIN });
    }
  }
}

/** Brújula: la pregunta apunta a la derecha; cada fragmento es una flecha con el ángulo real (arccos del coseno). */
function drawFan(S: Frame, r: Rect, B: ReturnType<typeof board>, ix: ReturnType<typeof board>['ix']) {
  const { d, pal: p } = S, u = S.u, sz = fz(S, 13), L = lh(S, sz), a = S.reveal('cosine', 0.4, 0.6);
  const sg = tone(S, 'sig'), lat = tone(S, 'lat');
  const ox = r.x + 14 * u, oy = r.y + L * 1.6 + (r.h - L * 3.2) / 2, R0 = Math.max(40 * u, Math.min(r.w - 28 * u - 70 * u, (r.h - L * 3.4) / 2, 190 * u));
  d.withAlpha(a, () => {
    // 90°: nada en común
    d.line(ox, oy - R0, ox, oy + R0, p.mute, 1.5, [4, 4]);
    d.text(S.l('90° = nada en común · 0° = idénticos', '90° = nothing in common · 0° = identical'), r.x, r.y + L * 0.5, { size: sz * 0.9, weight: 600, color: p.mute, base: 'middle' });
    // la pregunta
    d.arrow(ox, oy, ox + R0, oy, sg.c, 3, 10 * u);
    d.text(S.l('pregunta', 'question'), ox + R0 + 6 * u, oy, { size: sz, weight: 800, color: sg.ink, base: 'middle' });
    // los 4 mejores
    B.hits.slice(0, 4).forEach((h, i) => {
      if (h.score <= 0) return;
      const th = (angleDeg(h.score) * Math.PI) / 180, sgn = i % 2 === 0 ? -1 : 1, rr = R0 * (0.98 - 0.07 * i);
      const ex = ox + Math.cos(th) * rr, ey = oy + sgn * Math.sin(th) * rr, hot = i < 3;
      const k = clamp(S.at('cosine', 0.8 + i * 0.35, 1.5 + i * 0.35, 'out'));
      d.arrow(ox, oy, lerp(ox, ex, k), lerp(oy, ey, k), hot ? lat.c : alpha(lat.c, 0.45), hot ? 2.5 : 1.8, 8 * u);
      if (k > 0.95) d.text(`${i + 1}`, ex + (sgn < 0 ? 0 : 0), ey + sgn * 9 * u, { size: sz * 0.92, weight: 800, color: lat.ink, align: 'center', base: 'middle', halo: p.stage });
    });
    // lectura del mejor
    const h0 = B.hits[0];
    if (h0 && h0.score > 0) {
      const ty = r.y + r.h - L * 0.6;
      d.text(fit(S, `${srcShort(ix.chunks[h0.i])} · cos ${S.n(h0.score, 2)} · ${Math.round(angleDeg(h0.score))}°`, r.w, sz * 0.95, 700, 'mono'), r.x + r.w / 2, ty, { size: sz * 0.95, weight: 700, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
    }
  });
  void tagAt;
}
