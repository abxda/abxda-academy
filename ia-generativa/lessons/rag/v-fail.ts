// Vistas de las fallas y de la evaluación:
//  · drawMiss     (fail-miss, fail-miss-emb): una paráfrasis sin palabras en común; puesto del fragmento correcto por palabras
//                 (ninguno) y con embeddings reales (fuera de los tres primeros).
//  · drawConflict (fail-conflict): la garantía vieja y la nueva llegan casi empatadas (búsqueda real con la versión vieja añadida).
//  · drawTrap     (fail-trap, fail-trap-2): una reseña con una orden escondida llega al prompt (búsqueda real); la respuesta
//                 que podría dar el modelo es ilustrativa.
//  · drawGuard    (fail-guard): qué reduce el riesgo.
//  · drawEval     (eval-gold … eval-answer): 10 preguntas con su fragmento correcto; ¿llega con k = 3? por palabras,
//                 con embeddings y con embeddings + reordenador (mediciones reales).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REVIEW_TRAP } from './corpus';
import { mainIndex } from './ir';
import { chunkById, conflictDemo, demoQ, denseOrder, evalRows, lang, metrics, missQ, TRAP_Q } from './model';
import { qCard, qCardH } from './v-search';
import { FS, LH, area, badgeNum, card, cardH, chip, chipH, chunkCard, drawFlow, fitText, flow, fr, header, mark, para, srcLabel, tiny, toks } from './ui';
import { trapDemo } from './model';

const K = 3;

// ═════════════ no encontrar ═════════════
export function drawMiss(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const mq = missQ(l), gold = chunkById(l, mq.gold!), N = mainIndex(l).N;
  const qh = qCardH(S);
  qCard(S, { x: A.x, y: A.y, w: A.w, h: qh }, mq.q, { hit: true, a: fr(S, 'fail-miss', 0.3, 0.42) });
  const capH = LH(S, FS(S, 12)), gy = A.y + qh + 6 * u + capH, nL = T ? 1 : 2, gh = cardH(S, nL), ga = fr(S, 'fail-miss', 0.55, 0.68);
  d.withAlpha(ga, () => {
    const c1 = S.l('el fragmento que responde · ', 'the chunk that answers · '), w1 = d.measure(c1, { size: FS(S, 12), weight: 800 });
    fitText(S, c1, A.x, gy - capH * 0.5, A.w, FS(S, 12), { weight: 800, color: tone(S, 'dat').ink });
    fitText(S, S.l('0 palabras en común', '0 words in common'), A.x + w1, gy - capH * 0.5, A.w - w1, FS(S, 12), { weight: 800, color: tone(S, 'err').ink });
  });
  chunkCard(S, { x: A.x, y: gy, w: A.w, h: gh }, gold, { tone: 'dat', a: ga, maxLines: nL });
  // dos filas de puestos: por palabras y con embeddings
  const top = gy + gh + (T ? 8 : 16) * u, rowGap = (T ? 6 : 12) * u, rh = (T ? 18 : 26) * u, lw = Math.min(S.portrait ? 96 * u : 130 * u, A.w * 0.3);
  const sx = A.x + lw + 8 * u, sw = A.x + A.w - sx, slot = sw / N;
  const rows = [
    { lab: S.l('por palabras', 'by words'), rank: 0, at: 'fail-miss', a0: 0.72 },
    { lab: S.l('embeddings', 'embeddings'), rank: (denseOrder(l, mq.q) ?? []).findIndex((x) => x.id === mq.gold) + 1, at: 'fail-miss-emb', a0: 0.15 },
  ];
  // zona que llega al prompt
  const zoneA = fr(S, 'fail-miss', 0.72, 0.85);
  d.withAlpha(zoneA, () => {
    d.rect(sx, top - 4 * u, slot * K, 2 * rh + rowGap + 8 * u, { fill: alpha(tone(S, 'sig').c, 0.12), stroke: tone(S, 'sig').c, lw: 1.2, r: 3, dash: [4, 3] });
    fitText(S, S.l(`llega al prompt (k = ${K})`, `reaches the prompt (k = ${K})`), sx, top + 2 * rh + rowGap + 6 * u + L / 2, sw, FS(S, 12), { weight: 700, color: tone(S, 'sig').ink });
  });
  rows.forEach((r, j) => {
    const y = top + j * (rh + rowGap), a = fr(S, r.at, r.a0, r.a0 + 0.14);
    d.withAlpha(a, () => {
      fitText(S, r.lab, A.x, y + rh / 2, lw, sz, { weight: 800, color: j ? tone(S, 'lat').ink : p.ink2 });
      for (let i = 0; i < N; i++) d.rect(sx + i * slot + 1, y + 2 * u, slot - 2, rh - 4 * u, { fill: p.surface2 });
      if (r.rank > 0) {
        const x = sx + (r.rank - 1) * slot;
        d.rect(x + 1, y, slot - 2, rh, { fill: tone(S, 'dat').c });
        const lab = S.l(`puesto ${r.rank}`, `place ${r.rank}`);
        fitText(S, lab, x + slot + 6 * u, y + rh / 2, sw - (r.rank) * slot - 6 * u, FS(S, 12), { weight: 800, color: tone(S, 'dat').ink });
      } else fitText(S, S.l('puntaje 0: no aparece', 'score 0: it never shows up'), sx + K * slot + 8 * u, y + rh / 2, sw - K * slot - 8 * u, FS(S, 12), { weight: 800, color: tone(S, 'err').ink });
    });
  });
  void clamp;
}

// ═════════════ contradicciones ═════════════
export function drawConflict(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const C = conflictDemo(l), q = demoQ(l).q;
  const qh = qCardH(S);
  qCard(S, { x: A.x, y: A.y, w: A.w, h: qh }, q, { hit: true, a: fr(S, 'fail-conflict', 0, 0.1) });
  const y0 = A.y + qh + 8 * u + LH(S, FS(S, 12)), two = C.hits.slice(0, 2);
  const ansH = chipH(S, 13) + 10 * u, nL = T ? 1 : S.portrait ? 3 : 2, gp = 8 * u;
  let ch = Math.min(cardH(S, nL), (A.y + A.h - y0 - ansH - gp - 22 * u) / 2);
  const P: Rect = { x: A.x, y: y0, w: A.w, h: 2 * ch + gp + 16 * u };
  d.withAlpha(fr(S, 'fail-conflict', 0.3, 0.42), () => {
    d.rect(P.x, P.y, P.w, P.h, { stroke: tone(S, 'sig').c, lw: 1.5, r: 5, dash: [5, 4] });
    fitText(S, S.l('fuentes que llegan al prompt', 'sources that reach the prompt'), P.x + 2 * u, P.y - LH(S, FS(S, 12)) * 0.55, P.w, FS(S, 12), { weight: 800, color: tone(S, 'sig').ink });
  });
  two.forEach((h, r) => {
    const c = C.ix.chunks[h.i], old = c.doc !== 'garantia';
    const at = r === 0 ? 0.32 : 0.42;
    chunkCard(S, { x: P.x + 8 * u, y: P.y + 10 * u + r * (ch + gp), w: P.w - 16 * u, h: ch }, c, {
      rank: r + 1, score: S.n(h.score, 2), hit: C.hit, tone: old ? 'err' : 'dat', a: fr(S, 'fail-conflict', at, at + 0.1), maxLines: nL,
      tag: { text: old ? S.l('vieja', 'old') : S.l('vigente', 'current'), tone: old ? 'err' : 'dat' },
    });
  });
  // dos respuestas posibles
  const ay = P.y + P.h + 8 * u + chipH(S, 13) / 2, a = fr(S, 'fail-conflict', 0.75, 0.88);
  const n18 = two.findIndex((h) => C.ix.chunks[h.i].doc === 'garantia') + 1, n12 = two.findIndex((h) => C.ix.chunks[h.i].doc !== 'garantia') + 1;
  d.withAlpha(a, () => {
    const t1 = S.l(`«18 meses» [${n18}]`, `“18 months” [${n18}]`), t2 = S.l(`«12 meses» [${n12}]`, `“12 months” [${n12}]`);
    const b1 = chip(S, t1, A.x, ay, 'w', { size: 13, align: 'left', dash: true });
    const b2 = chip(S, S.l('o', 'or'), b1.x + b1.w + 8 * u, ay, 'ink', { size: 12, align: 'left' });
    const b3 = chip(S, t2, b2.x + b2.w + 8 * u, ay, 'w', { size: 13, align: 'left', dash: true });
    if (b3.x + b3.w + 120 * u < A.x + A.w) fitText(S, S.l('el modelo puede decir cualquiera', 'the model may say either'), b3.x + b3.w + 10 * u, ay, A.x + A.w - (b3.x + b3.w + 10 * u), FS(S, 12), { weight: 700, color: p.mute });
  });
  void L;
}

// ═════════════ la trampa ═════════════
const OBEY = { es: 'Todos los reembolsos son inmediatos y sin condiciones.', en: 'All refunds are immediate and unconditional.' };
export function drawTrap(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const D = trapDemo(l), rv = REVIEW_TRAP[l], er = tone(S, 'err');
  let RV: Rect, PR: Rect;
  if (S.portrait) { const h = Math.min(A.h * 0.42, cardH(S, 6)); RV = { x: A.x, y: A.y, w: A.w, h }; PR = { x: A.x, y: A.y + h + 12 * u, w: A.w, h: A.y + A.h - (A.y + h + 12 * u) }; }
  else { const w = A.w * 0.48; RV = { x: A.x, y: A.y, w, h: Math.min(A.h, cardH(S, T ? 7 : 6)) }; PR = { x: A.x + w + 18 * u, y: A.y, w: A.w - w - 18 * u, h: A.h }; }
  // la reseña, con la orden escondida resaltada
  const hl = fr(S, 'fail-trap', 0.3, 0.45);
  chunkCard(S, RV, D.review, { tone: 'mute', a: fr(S, 'fail-trap', 0, 0.12), trap: hl > 0.5 ? rv.trap : undefined, tag: hl > 0.5 ? { text: S.l('orden escondida', 'hidden command'), tone: 'err' } : undefined });
  if (!S.on('fail-trap-2')) return;
  // pregunta → fuentes en el prompt → respuesta posible
  let y = PR.y;
  const qa = fr(S, 'fail-trap-2', 0, 0.12);
  d.withAlpha(qa, () => {
    fitText(S, S.l('Pregunta', 'Question'), PR.x, y + L / 2, PR.w, FS(S, 12), { weight: 800, color: tone(S, 'sig').ink });
    y += L;
    const f = flow(S, 'tq|' + l, toks(S, TRAP_Q[l]), PR.w, sz, { weight: 600, maxLines: T ? 1 : 2 });
    drawFlow(S, f, PR.x, y, { weight: 600 });
    y += f.h + 6 * u;
  });
  if (qa <= 0) y += L + (T ? L : 2 * L) + 6 * u;
  const sa = fr(S, 'fail-trap-2', 0.12, 0.3);
  d.withAlpha(sa, () => fitText(S, S.l('Fuentes en el prompt', 'Sources in the prompt'), PR.x, y + L / 2, PR.w, FS(S, 12), { weight: 800, color: p.mute }));
  y += L;
  const rH = Math.max(L + 4 * u, Math.min(L * 1.4, (PR.y + PR.h - y) / 6));
  D.top.forEach((h, r) => {
    const c = D.ix.chunks[h.i], bad = r === D.at, a = fr(S, 'fail-trap-2', 0.15 + r * 0.06, 0.27 + r * 0.06);
    d.withAlpha(a, () => {
      if (bad) d.rect(PR.x - 2 * u, y + 1, PR.w + 4 * u, rH - 2, { fill: alpha(er.c, 0.14), stroke: er.c, lw: 1.4, r: 3 });
      badgeNum(S, r + 1, PR.x + L * 0.45, y + rH / 2, L * 0.42, bad ? 'err' : 'lat');
      fitText(S, srcLabel(c) + (bad ? S.l(' · con la orden', ' · with the command') : ''), PR.x + L + 4 * u, y + rH / 2, PR.w - L - 8 * u, sz, { weight: 700, color: bad ? er.ink : p.ink });
    });
    y += rH;
  });
  y += 6 * u;
  // lo que podría responder si obedece (ilustrativo)
  const ba = fr(S, 'fail-trap-2', 0.45, 0.6), room = PR.y + PR.h - y - chipH(S, 12) - 8 * u;
  if (room > L) {
    const f = flow(S, 'obey|' + l, [{ t: '«', color: er.ink, weight: 700 }, ...toks(S, OBEY[l]).map((t) => ({ ...t, color: er.ink, weight: 700 })), { t: '»', color: er.ink, weight: 700 }], PR.w - 16 * u, sz, { maxLines: Math.max(1, Math.floor((room - 12 * u) / L)) });
    d.withAlpha(ba, () => {
      d.rect(PR.x, y, PR.w, f.h + 12 * u, { fill: p.surface, stroke: er.c, lw: 1.5, r: 8 * u, dash: [5, 4] });
      drawFlow(S, f, PR.x + 8 * u, y + 6 * u);
    });
    y += f.h + 12 * u;
    const cy = y + 6 * u + chipH(S, 12) / 2;
    const b1 = chip(S, S.l('lo que podría decir (ilustrativo)', 'what it might say (illustrative)'), PR.x, cy, 'mute', { size: 12, align: 'left', dash: true, a: fr(S, 'fail-trap-2', 0.6, 0.72), maxW: PR.w });
    if (cy + chipH(S, 12) * 1.1 + 4 * u < A.y + A.h + 4 * u && !T) chip(S, S.l('inyección de instrucciones', 'prompt injection'), PR.x, cy + chipH(S, 12) + 4 * u, 'err', { size: 12, align: 'left', a: fr(S, 'fail-trap-2', 0.68, 0.8), maxW: PR.w });
    else if (b1.x + b1.w + chipH(S, 12) < PR.x + PR.w) void 0;
  }
}

// ═════════════ defensas ═════════════
export function drawGuard(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), sz = FS(S, 14), L = LH(S, sz), T = tiny(S);
  const hh = header(S, S.l('No hay defensa perfecta; se reduce el riesgo', 'There is no perfect defense; the risk is reduced'), A, fr(S, 'fail-guard', 0, 0.12));
  const items = [
    { t: S.l('Poner fecha y versión a cada documento', 'Put a date and version on every document'), s: S.l('y retirar lo viejo del índice', 'and remove old ones from the index'), at: 0.38 },
    { t: S.l('Indexar solo fuentes confiables', 'Index only trusted sources'), s: S.l('lo recuperado es dato, no una orden', 'what is retrieved is data, not an order'), at: 0.58 },
    { t: S.l('Revisar a mano lo delicado', 'Check sensitive things by hand'), s: S.l('una persona aprueba antes de actuar', 'a person approves before acting'), at: 0.78 },
  ];
  const bw = Math.min(A.w, 560 * u), x = A.x + (A.w - bw) / 2, gap = (T ? 6 : 12) * u, bh = Math.min((A.h - hh - 2 * gap) / 3, T ? L * 1.6 : L * 2.6 + 10 * u);
  items.forEach((it, i) => {
    const y = A.y + hh + 4 * u + i * (bh + gap), a = fr(S, 'fail-guard', it.at, it.at + 0.12);
    d.withAlpha(a, () => {
      card(S, { x, y, w: bw, h: bh }, { tone: 'dat', fill: alpha(tone(S, 'dat').c, 0.06) });
      mark(S, x + 18 * u, y + bh / 2, true, 6);
      const tx = x + 38 * u, tw = bw - 46 * u;
      if (T || bh < L * 2.2) fitText(S, it.t, tx, y + bh / 2, tw, sz, { weight: 800, color: p.ink });
      else { fitText(S, it.t, tx, y + bh / 2 - L * 0.45, tw, sz, { weight: 800, color: p.ink }); fitText(S, it.s, tx, y + bh / 2 + L * 0.55, tw, FS(S, 12.5), { weight: 600, color: p.ink2 }); }
    });
  });
}

// ═════════════ evaluar ═════════════
export function drawEval(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 12.5), T = tiny(S);
  const rows = evalRows(l), cols = [0, 2, 3] as const;
  const heads = [S.l('palabras', 'words'), S.l('embeddings', 'embeddings'), S.l('+ reordenar', '+ rerank')];
  const headW = Math.max(...heads.map((h) => d.measure(h, { size: FS(S, 12), weight: 800 })));
  // si las columnas dejan poco espacio a la pregunta (teléfono), los encabezados van girados y las columnas se estrechan
  const rot = headW * 3 + 40 * u > A.w * 0.5, cw = rot ? Math.max(40 * u, d.measure('10/10', { size: FS(S, 13), weight: 800, font: 'mono' }) + 8 * u) : headW + 12 * u;
  const hh = rot ? headW + 10 * u : LH(S, FS(S, 12), 1.4), totH = LH(S, FS(S, 13), 1.6), foot = T ? 0 : chipH(S, 12) + 6 * u;
  const rh = Math.min(LH(S, sz, 1.55), (A.h - hh - totH - foot) / rows.length);
  const qx = A.x, qw = A.w - 3 * cw - 8 * u, cx = (j: number) => A.x + qw + 8 * u + j * cw;
  const y0 = A.y + hh;
  // encabezados
  d.withAlpha(fr(S, 'eval-gold', 0.05, 0.18), () => {
    fitText(S, S.l('pregunta de prueba → su fragmento correcto', 'test question → its correct chunk'), qx, A.y + hh - LH(S, FS(S, 12)) * 0.55, qw - 6 * u, FS(S, 12), { weight: 800, color: p.mute });
  });
  const colA = [fr(S, 'eval-words', 0.02, 0.12), fr(S, 'eval-emb', 0.02, 0.12), fr(S, 'eval-emb', 0.38, 0.48)];
  heads.forEach((h, j) => d.withAlpha(colA[j], () => {
    const color = j === 0 ? p.ink2 : j === 1 ? tone(S, 'lat').ink : tone(S, 'w').ink;
    if (!rot) { fitText(S, h, cx(j) + cw / 2, A.y + hh / 2, cw - 4 * u, FS(S, 12), { weight: 800, color, align: 'center' }); return; }
    S.ctx.save(); S.ctx.translate(cx(j) + cw / 2, A.y + hh - 5 * u); S.ctx.rotate(-Math.PI / 2);
    d.text(h, 0, 0, { size: FS(S, 12), weight: 800, color, base: 'middle' });
    S.ctx.restore();
  }));
  // filas
  rows.forEach((r, i) => {
    const y = y0 + i * rh, a = fr(S, 'eval-gold', 0.25 + i * 0.05, 0.33 + i * 0.05);
    const miss = r.ranks[0] === 0 || r.ranks[0] > K, flag = S.on('eval-words') ? fr(S, 'eval-words', 0.8, 0.92) : 0;
    d.withAlpha(a, () => {
      if (i % 2 === 0) d.rect(A.x, y, A.w, rh, { fill: alpha(p.ink, 0.035) });
      if (miss && flag > 0.01) d.rect(A.x, y + 1, qw, rh - 2, { fill: alpha(tone(S, 'err').c, 0.12 * flag) });
      const g = chunkById(l, r.gold), gl = `→ ${g.title.split(/[ ,]/)[0]} §${g.n}`, glw = T || S.portrait ? 0 : d.measure(gl, { size: FS(S, 12), weight: 700 }) + 10 * u;
      fitText(S, r.q, qx + 4 * u, y + rh / 2, qw - 8 * u - glw, sz, { weight: 600, color: p.ink });
      if (glw) fitText(S, gl, qx + qw - glw, y + rh / 2, glw - 4 * u, FS(S, 12), { weight: 700, color: tone(S, 'dat').ink });
    });
    cols.forEach((c, j) => {
      const seg = j === 0 ? 'eval-words' : 'eval-emb', s0 = j === 0 ? 0.12 : j === 1 ? 0.1 : 0.48, step = j === 0 ? 0.05 : 0.025;
      const ca = fr(S, seg, s0 + i * step, s0 + i * step + 0.06);
      if (ca > 0.01) mark(S, cx(j) + cw / 2, y + rh / 2, r.ranks[c] > 0 && r.ranks[c] <= K, Math.min(5, rh / (2.6 * u)), ca);
    });
  });
  // totales (k = 3)
  const ty = y0 + rows.length * rh + totH / 2 + 2 * u;
  d.withAlpha(fr(S, 'eval-words', 0.02, 0.12), () => fitText(S, S.l(`llega al prompt con k = ${K}`, `reaches the prompt with k = ${K}`), qx + 4 * u, ty, qw - 8 * u, FS(S, 12), { weight: 800, color: p.mute }));
  const totA = [fr(S, 'eval-words', 0.66, 0.76), fr(S, 'eval-emb', 0.3, 0.4), fr(S, 'eval-emb', 0.66, 0.76)];
  cols.forEach((c, j) => {
    const m = metrics(rows, c, K);
    d.withAlpha(totA[j], () => d.text(rot ? `${m.hit}/${m.n}` : S.l(`${m.hit} de ${m.n}`, `${m.hit} of ${m.n}`), cx(j) + cw / 2, ty, { size: FS(S, 13), weight: 800, font: 'mono', color: j === 0 ? p.ink : j === 1 ? tone(S, 'lat').ink : tone(S, 'w').ink, align: 'center', base: 'middle' }));
  });
  // después: revisar la respuesta
  if (!T && S.on('eval-answer')) chip(S, S.l('después: ¿la respuesta dice lo mismo que su fuente?', 'then: does the answer say the same as its source?'), A.x, A.y + A.h - foot / 2 + 2 * u, 'w', { size: 12, align: 'left', a: fr(S, 'eval-answer', 0.1, 0.25), maxW: A.w });
  void para; void card;
}
