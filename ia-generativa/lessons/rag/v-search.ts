// Vistas de «con cada pregunta»:
//  · drawSearch (ask … topk-read): la pregunta se vuelve vector, se compara con los 25 (coseno TF-IDF real), se ordena,
//    se toman los k = 3 primeros.
//  · drawPrompt (prompt-system … grounding): el prompt con instrucciones, fuentes numeradas y pregunta; la respuesta del
//    generador de juguete (copia frases de la mejor fuente) con su cita, y la línea que la une a su fuente.
//  · drawBoard  (demo-ask, nope, try-ask): la misma tubería con otras preguntas (las elige la escena o la persona).
//  · drawK      (k-one … try-k): cuántos fragmentos se pegan; el que responde entra con k = 3.
//  · drawRerank (rerank, rerank-demo): el reordenador real (cross-encoder) reordena los 5 primeros.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { words, type Answer, type Chunk } from './ir';
import { ABSTAIN, board, chunkById, demoQ, exampleQ, hardQ, lang, rerankDemo, stemSet, vocabPos } from './model';
import { SYSTEM_RAG } from './prompts';
import {
  FS, LH, area, badgeNum, tight, card, cardH, chip, chipH, chunkCard, drawFlow, fitText, flow, fr, header, lines, mark, para, srcLabel, strip, tiny, type Tok, toks,
} from './ui';

// ── la tarjeta de la pregunta ───────────────────────────────────────────────────────────────────────
/** Alto fijo (no depende del texto, para que nada salte al cambiar de pregunta). */
export const qCardH = (S: Frame, withVec = false) => { const L = LH(S, FS(S, 13)); return (tiny(S) ? L : L * 2) + 12 * S.u + (withVec ? (tiny(S) ? 0 : 22 * S.u) : 0); };
export function qCard(S: Frame, r: Rect, q: string, o: { a?: number; hit?: boolean; vec?: number } = {}) {
  const { d, pal: p } = S, u = S.u, l = lang(S), sz = FS(S, 13), sg = tone(S, 'sig');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(sg.c, 0.1), stroke: sg.c, lw: 1.5, r: 4 });
    const lab = S.l('Pregunta', 'Question'), lw = S.d.measure(lab, { size: sz, weight: 800 }) + 12 * u;
    d.text(lab, r.x + 8 * u, r.y + 6 * u + LH(S, sz) / 2, { size: sz, weight: 800, color: sg.ink, base: 'middle' });
    const f = flow(S, 'q|' + q + (o.hit ? '|h' : ''), toks(S, q, { hit: o.hit ? stemSet(l, q) : undefined }), r.w - lw - 16 * u, sz, { weight: 600, maxLines: tiny(S) ? 1 : 2 });
    drawFlow(S, f, r.x + 8 * u + lw, r.y + 6 * u, { weight: 600 });
    if ((o.vec ?? 0) > 0.01 && !tiny(S)) {
      const B = board(l, q, 3), sr: Rect = { x: r.x + 8 * u + lw, y: r.y + r.h - 24 * u, w: r.w - lw - 16 * u, h: 16 * u };
      d.withAlpha(o.vec!, () => {
        fitText(S, S.l('vector', 'vector'), r.x + 8 * u, sr.y + sr.h / 2, lw - 4 * u, FS(S, 12), { weight: 700, color: tone(S, 'lat').ink });
        strip(S, sr, B.qv, vocabPos(l), B.ix.vocab.length, { grow: 1, max: 0.8 });
      });
    }
  });
}

// ── barras de parecido: una por fragmento ─────────────────────────────────────────────────────────────
function bars(S: Frame, C: Rect, q: string, o: { grow: number; sort: number; k: number; a?: number; empty?: number; label?: string }) {
  const { d, pal: p } = S, u = S.u, l = lang(S), B = board(l, q, 3), N = B.ix.N, lt = tone(S, 'lat'), sz = FS(S, 12);
  const rank = new Array<number>(N); B.hits.forEach((h, r) => { rank[h.i] = r; });
  const score = new Array<number>(N); B.hits.forEach((h) => { score[h.i] = h.score; });
  const smax = Math.max(0.4, B.top * 1.15), base = C.y + C.h - LH(S, sz) * 1.3, H = base - C.y - 14 * u, slot = C.w / N, bw = Math.max(3 * u, slot * 0.72);
  d.withAlpha(o.a ?? 1, () => {
    d.line(C.x, base, C.x + C.w, base, p.lineStrong, 1.5);
    if ((o.empty ?? 0) > 0.01) for (let i = 0; i < N; i++) d.rect(C.x + i * slot + (slot - bw) / 2, base - H * 0.3, bw, H * 0.3, { stroke: alpha(lt.c, 0.7 * o.empty!), lw: 1, dash: [3, 3] });
    for (let i = 0; i < N; i++) {
      const x = C.x + lerp(i, rank[i], o.sort) * slot + (slot - bw) / 2, hh = Math.max(1.5 * u, H * clamp((score[i] / smax) * o.grow)), top = rank[i] < o.k && score[i] > 0 && o.sort > 0.5;
      if (o.grow > 0.001) d.rect(x, base - hh, bw, hh, { fill: top ? lt.c : alpha(lt.c, lerp(0.55, 0.32, o.sort)) });
      if (top && o.sort > 0.9) badgeNum(S, rank[i] + 1, x + bw / 2, base - hh - 10 * u, 8 * u, 'lat');
    }
    if (o.k > 0 && o.sort > 0.9) {
      const cx = C.x + o.k * slot;
      d.line(cx, C.y + 4 * u, cx, base, tone(S, 'ink').c, 1.5, [4, 4]);
      fitText(S, `k = ${o.k}`, cx + 4 * u, C.y + 10 * u, C.w - o.k * slot - 4 * u, sz, { weight: 800, font: 'mono', color: p.ink });
    }
    if (o.label) fitText(S, o.label, C.x, base + LH(S, sz) * 0.7, C.w, sz, { weight: 600, color: p.mute });
  });
  return B;
}

// ═════════════ buscar: ask · compare · sort · topk · topk-read ═════════════
export function drawSearch(S: Frame) {
  const { pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), q = demoQ(l).q, T = tiny(S);
  const qh = qCardH(S, true), Q: Rect = { x: A.x, y: A.y, w: A.w, h: qh };
  qCard(S, Q, q, { a: fr(S, 'ask', 0, 0.12), hit: S.on('ask') && fr(S, 'ask', 0.45, 0.6) > 0, vec: fr(S, 'ask', 0.6, 0.78) });
  const gap = 10 * u, y = A.y + qh + gap;
  let C: Rect, K: Rect;
  if (S.portrait) { const ch = Math.min(A.h * 0.28, 130 * u); C = { x: A.x, y, w: A.w, h: ch }; K = { x: A.x, y: y + ch + gap, w: A.w, h: A.y + A.h - (y + ch + gap) }; }
  else { const cw = A.w * 0.5; C = { x: A.x, y, w: cw, h: A.y + A.h - y }; K = { x: A.x + cw + 16 * u, y, w: A.w - cw - 16 * u, h: A.y + A.h - y }; }
  const grow = S.on('compare') ? fr(S, 'compare', 0.15, 0.55, 'io') : 0, sort = S.on('sort') ? fr(S, 'sort', 0.08, 0.45, 'io') : 0, k = S.on('topk') && fr(S, 'topk', 0.15, 0.2) > 0 ? 3 : 0;
  const label = !S.on('compare') ? S.l('25 fragmentos del índice, sin comparar todavía', '25 chunks in the index, not compared yet')
    : !S.on('sort') ? S.l('parecido con la pregunta (coseno), en el orden del manual', 'similarity to the question (cosine), in manual order')
    : S.l('de más a menos parecido', 'from most to least similar');
  const B = bars(S, C, q, { grow, sort, k, a: fr(S, 'ask', 0.75, 0.9), empty: 1 - grow, label });
  // tarjetas de los k primeros
  if (S.on('topk')) {
    const n = 3, gp = 6 * u, nL = T ? 0 : S.portrait ? 1 : 2, ch = Math.min(cardH(S, nL), (K.h - (n - 1) * gp) / n), hit = stemSet(l, q);
    for (let r = 0; r < n; r++) {
      const h = B.hits[r], c = B.ix.chunks[h.i], a = fr(S, 'topk', 0.45 + r * 0.1, 0.55 + r * 0.1);
      const read = S.on('topk-read'), ok = read ? (r === 0 ? true : false) : null, ra = read ? fr(S, 'topk-read', r === 0 ? 0.1 : 0.55, r === 0 ? 0.22 : 0.67) : 0;
      chunkCard(S, { x: K.x, y: K.y + r * (ch + gp), w: K.w, h: ch }, c, { rank: r + 1, score: S.n(h.score, 2), hit, a, ok: ra > 0.5 ? ok : null, tag: ra > 0.5 ? (r === 0 ? { text: S.l('responde', 'answers'), tone: 'dat' } : { text: S.l('no responde', 'does not answer'), tone: 'mute' }) : undefined });
    }
    if (S.is('topk') || S.is('topk-read')) {
      const a = fr(S, 'topk', 0.8, 0.92);
      const ty = K.y + n * (ch + gp) + 4 * u + chipH(S, 12) / 2;
      if (ty + chipH(S, 12) / 2 < A.y + A.h + 4 * u) chip(S, S.l('recuperación: los k más parecidos', 'retrieval: the k most similar'), K.x, ty, 'lat', { size: 12, align: 'left', a, maxW: K.w });
    }
  }
  void p;
}

// ═════════════ el prompt y la respuesta ═════════════
/** Fichas de la respuesta: las frases copiadas, cada una seguida de su cita [n]. */
function answerToks(S: Frame, ans: Answer, hot = 0): Tok[] {
  const sg = tone(S, 'sig'), out: Tok[] = [];
  for (const part of ans.parts) {
    for (const w of part.text.split(/\s+/).filter(Boolean)) out.push({ t: w });
    out.push({ t: `[${part.src}]`, color: sg.ink, weight: 800, bg: hot > 0.01 ? alpha(sg.c, 0.25 * hot) : undefined });
  }
  return out;
}
export const ABSTAIN_TXT = (S: Frame) => S.l('No lo encuentro en el manual.', 'I can’t find it in the manual.');

export function drawPrompt(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), small = FS(S, 12), L = LH(S, sz), Ls = LH(S, small), T = tiny(S);
  const q = demoQ(l).q, B = board(l, q, 3), sg = tone(S, 'sig'), wt = tone(S, 'w');
  let P: Rect, M: Rect, R: Rect;
  // en vertical, el alto del prompt sale de su contenido (instrucciones + 3 fuentes de una línea + pregunta)
  const sysLines = T ? 1 : S.portrait && tight(S) ? 2 : 3, sysTxt = SYSTEM_RAG[l].replace(/^[^.]*\.\s*/, '');
  if (S.portrait) { const ph = Math.min(A.h * 0.62, 8 * u + L + 2 * u + Ls + 1 * u + lines(S, sysTxt, A.w - 16 * u, small, { weight: 600, maxLines: sysLines }).length * small * u * 1.28 + 6 * u + Ls + 2 * u + 3 * (L + 4 * u) + 6 * u + Ls + L + 8 * u); P = { x: A.x, y: A.y, w: A.w, h: ph }; M = { x: A.x + A.w * 0.3, y: A.y + ph + 10 * u, w: A.w * 0.4, h: L + 12 * u }; R = { x: A.x, y: M.y + M.h + 10 * u, w: A.w, h: A.y + A.h - (M.y + M.h + 10 * u) }; }
  else { const pw = A.w * 0.56; P = { x: A.x, y: A.y, w: pw, h: A.h }; M = { x: A.x + pw + 40 * u, y: A.y + (T ? 0 : 8 * u), w: A.w - pw - 40 * u, h: L + 14 * u }; R = { x: M.x, y: M.y + M.h + 12 * u, w: M.w, h: A.y + A.h - (M.y + M.h + 12 * u) }; }
  // ── el prompt ──
  const aP = fr(S, 'prompt-system', 0, 0.12);
  let y = P.y + 6 * u;
  const srcY: number[] = [];
  d.withAlpha(aP, () => {
    card(S, P, { tone: 'sig', fill: alpha(sg.c, 0.04) });
    fitText(S, 'Prompt', P.x + 8 * u, y + L / 2, P.w - 16 * u, sz, { weight: 800, color: sg.ink });
  });
  y += L + 2 * u;
  const iw = P.w - 16 * u, x = P.x + 8 * u;
  // instrucciones del sistema
  const sysA = fr(S, 'prompt-system', 0.12, 0.28);
  d.withAlpha(sysA, () => {
    fitText(S, S.l('Instrucciones del sistema', 'System instructions'), x, y + Ls / 2, iw, small, { weight: 800, color: p.mute });
  });
  y += Ls + 1 * u;
  const sh = para(S, sysTxt, x, y, iw, small, { weight: 600, color: p.ink2, maxLines: sysLines, a: sysA });
  y += sh + 6 * u;
  // fuentes numeradas
  const srcA = fr(S, 'prompt-sources', 0.05, 0.18), cite = S.on('cite') ? fr(S, 'cite', 0.15, 0.35) : 0;
  d.withAlpha(srcA, () => fitText(S, S.l('Fuentes', 'Sources'), x, y + Ls / 2, iw, small, { weight: 800, color: p.mute }));
  y += Ls + 2 * u;
  const room = P.y + P.h - y - (Ls + L + 14 * u), per = S.portrait ? 1 : Math.max(1, Math.min(2, Math.floor(room / 3 / L) || 1)), rowH = per * L + 4 * u;
  B.hits.slice(0, 3).forEach((h, r) => {
    const c = B.ix.chunks[h.i], a = fr(S, 'prompt-sources', 0.15 + r * 0.14, 0.27 + r * 0.14);
    srcY.push(y + L / 2);
    d.withAlpha(a, () => {
      if (r === 0 && cite > 0.01) d.rect(x - 3 * u, y - 1, iw + 6 * u, rowH - 2 * u, { fill: alpha(sg.c, 0.16 * cite), r: 3 });
      badgeNum(S, r + 1, x + L * 0.42, y + L / 2, L * 0.42, 'sig');
      const tx = x + L + 6 * u, lab = srcLabel(c) + ': ';
      const f = flow(S, `ps|${c.id}|${per}`, [{ t: lab.trim(), weight: 800, color: tone(S, 'dat').ink }, ...toks(S, c.text)], x + iw - tx, sz, { maxLines: per });
      drawFlow(S, f, tx, y);
    });
    y += rowH;
  });
  // la pregunta
  const qa = fr(S, 'prompt-sources', 0.72, 0.86);
  d.withAlpha(qa, () => {
    fitText(S, S.l('Pregunta', 'Question'), x, y + 2 * u + Ls / 2, iw, small, { weight: 800, color: p.mute });
    fitText(S, q, x, y + 4 * u + Ls + L / 2, iw, sz, { weight: 700, color: p.ink });
  });
  // ── el modelo y su respuesta ──
  const ga = fr(S, 'generate', 0.02, 0.15);
  d.withAlpha(ga, () => {
    if (S.portrait) d.arrow(M.x + M.w / 2, P.y + P.h + 1 * u, M.x + M.w / 2, M.y - 2 * u, p.ink, 2, 7 * u);
    else d.arrow(P.x + P.w + 4 * u, M.y + M.h / 2, M.x - 4 * u, M.y + M.h / 2, p.ink, 2, 7 * u);
    const pulse = S.is('generate') ? 0.25 + 0.2 * Math.sin(S.clock * 6) * (1 - fr(S, 'generate', 0.55, 0.6)) : 0;
    card(S, M, { tone: 'w', fill: alpha(wt.c, 0.1 + pulse) });
    fitText(S, S.l('Modelo', 'Model'), M.x + M.w / 2, M.y + M.h / 2, M.w - 12 * u, sz, { weight: 800, color: wt.ink, align: 'center' });
  });
  if (S.on('generate')) {
    const at = answerToks(S, B.ans, cite), maxL = Math.max(1, Math.floor((R.h - chipH(S, 12) - 18 * u) / L));
    const f = flow(S, 'ans|' + q + '|' + (cite > 0.01 ? 1 : 0), at, R.w - 16 * u, sz, { weight: 600, maxLines: maxL });
    const bh = f.h + 12 * u, shown = Math.ceil(fr(S, 'generate', 0.2, 0.55, 'lin') * f.items.length);
    d.withAlpha(fr(S, 'generate', 0.15, 0.25), () => {
      d.rect(R.x, R.y, R.w, bh, { fill: p.surface, stroke: wt.c, lw: 1.5, r: 8 * u });
      drawFlow(S, { ...f, items: f.items.slice(0, shown) }, R.x + 8 * u, R.y + 6 * u, { weight: 600 });
    });
    const cy = R.y + bh + 6 * u + chipH(S, 12) / 2;
    const toy = chip(S, S.l('generador de juguete: copia frases', 'toy generator: copies sentences'), R.x, cy, 'mute', { size: 12, align: 'left', dash: true, a: fr(S, 'generate', 0.62, 0.75) * (1 - fr(S, 'grounding', 0.4, 0.55)), maxW: R.w });
    // la cita [1] de la respuesta y su fuente, unidas
    const c1 = f.items.find((it) => it.k.t === '[1]');
    if (c1 && S.on('cite')) {
      const ax = R.x + 8 * u + c1.x + c1.w / 2, ay = R.y + 6 * u + c1.y + f.lh / 2;
      d.withAlpha(cite, () => d.circle(ax, ay, Math.max(c1.w, f.lh) * 0.62, { stroke: sg.c, lw: 2 }));
      const gl = S.on('grounding') ? fr(S, 'grounding', 0.08, 0.35, 'io') : 0;
      if (gl > 0.01 && srcY[0] !== undefined && !S.portrait) {
        const x0 = R.x - 3 * u, sx = P.x + P.w - 3 * u, sy = srcY[0], mx = (P.x + P.w + R.x) / 2;
        const pts: [number, number][] = [];
        for (let i = 0; i <= 24; i++) pts.push(bez(x0, ay, mx, ay, mx, sy, sx, sy, (i / 24) * gl));
        d.polyline(pts, sg.c, 2, { dash: [5, 4] });
        if (gl > 0.97) d.circle(sx, sy, 3 * u, { fill: sg.c });
      }
      const ok = fr(S, 'grounding', 0.5, 0.65);
      if (ok > 0.01) {
        const cx = R.x, b = chip(S, S.l('se puede comprobar', 'it can be checked'), cx + 18 * u, cy, 'dat', { size: 12, align: 'left', a: ok, maxW: R.w - 18 * u });
        mark(S, cx + 7 * u, cy, true, 5, ok);
        void b;
      }
    }
    void toy;
  }
}
function bez(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, t: number): [number, number] {
  const m = 1 - t;
  return [m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3, m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3];
}

// ═════════════ probar preguntas ═════════════
/** La pregunta que se muestra en el tablero: Lima en «nope»; si no, la escrita o la elegida. */
export function boardQ(S: Frame): string {
  const l = lang(S);
  if (S.between('nope', 'try-ask')) return exampleQ(l, 4);
  const typed = String(S.p.q ?? '').trim();
  if (typed && S.st.src === 'q') return typed;
  return exampleQ(l, Number(S.p.ex ?? 0));
}
function boardFor(S: Frame, q: string, a: number) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const B = board(l, q, 3), hit = stemSet(l, q);
  const qh = qCardH(S), gap = 10 * u, y = A.y + qh + gap;
  let K: Rect, R: Rect;
  if (S.portrait) { const kh = Math.min(3 * cardH(S, 1) + 12 * u, (A.y + A.h - y) * 0.56); K = { x: A.x, y, w: A.w, h: kh }; R = { x: A.x, y: y + kh + gap, w: A.w, h: A.y + A.h - (y + kh + gap) }; }
  else { const kw = A.w * 0.52; K = { x: A.x, y, w: kw, h: A.y + A.h - y }; R = { x: A.x + kw + 16 * u, y, w: A.w - kw - 16 * u, h: A.y + A.h - y }; }
  d.withAlpha(a, () => {
    qCard(S, { x: A.x, y: A.y, w: A.w, h: qh }, q, { hit: true });
    // fragmentos recuperados
    if (B.abstain) {
      const h = Math.min(K.h, L * 4.4);
      card(S, { x: K.x, y: K.y, w: K.w, h }, { tone: 'mute', dash: [5, 4], fill: alpha(p.surface, 0.5) });
      const msg = S.l(`Ningún fragmento se parece: el mejor da ${S.n(B.top, 2)}, y el mínimo para responder es ${S.n(ABSTAIN, 2)}.`, `No chunk is similar: the best scores ${S.n(B.top, 2)}, and the minimum to answer is ${S.n(ABSTAIN, 2)}.`);
      para(S, msg, K.x + 10 * u, K.y + 8 * u, K.w - 20 * u, sz, { weight: 700, color: p.ink2, maxLines: Math.max(1, Math.floor((h - 12 * u) / LH(S, sz, 1.28))) });
    } else {
      const n = 3, gp = 6 * u, nL = T ? 0 : S.portrait ? 1 : 2, ch = Math.min(cardH(S, nL), (K.h - (n - 1) * gp) / n);
      for (let r = 0; r < n; r++) {
        const h = B.hits[r], c = B.ix.chunks[h.i];
        chunkCard(S, { x: K.x, y: K.y + r * (ch + gp), w: K.w, h: ch }, c, { rank: r + 1, score: S.n(h.score, 2), hit, dim: h.score < ABSTAIN, dash: h.score <= 0 });
      }
    }
    // la respuesta
    const lab = S.l('Respuesta', 'Answer');
    fitText(S, lab, R.x, R.y + L / 2, R.w, FS(S, 12), { weight: 800, color: tone(S, 'w').ink });
    const ry = R.y + L + 2 * u, maxL = Math.max(1, Math.floor((A.y + A.h - ry - 12 * u) / L));
    if (B.abstain) {
      const f = flow(S, 'abst|' + l, [{ t: ABSTAIN_TXT(S), weight: 700, color: tone(S, 'err').ink }], R.w - 16 * u, sz, { maxLines: maxL });
      d.rect(R.x, ry, R.w, f.h + 12 * u, { fill: p.surface, stroke: tone(S, 'err').c, lw: 1.5, r: 8 * u, dash: [5, 4] });
      drawFlow(S, f, R.x + 8 * u, ry + 6 * u);
    } else {
      const f = flow(S, 'bans|' + q, answerToks(S, B.ans), R.w - 16 * u, sz, { weight: 600, maxLines: maxL });
      d.rect(R.x, ry, R.w, f.h + 12 * u, { fill: p.surface, stroke: tone(S, 'w').c, lw: 1.5, r: 8 * u });
      drawFlow(S, f, R.x + 8 * u, ry + 6 * u, { weight: 600 });
    }
  });
}
export function drawBoard(S: Frame) {
  const q = boardQ(S), xf = S.st.qx as { cur: string; prev: string; t0: number } | undefined;
  const k = xf && xf.cur === q ? clamp((S.clock - xf.t0) / 0.4) : 1, prev = xf && xf.cur === q ? xf.prev : q;
  if (k < 1 && prev !== q) boardFor(S, prev, 1 - k);
  boardFor(S, q, k);
}

// ═════════════ cuántos fragmentos: k ═════════════
export const kNow = (S: Frame) => Math.max(1, Math.min(5, Math.round(Number(S.p.k ?? 1))));
export function drawK(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const hq = hardQ(l), B = board(l, hq.q, 5), hit = stemSet(l, hq.q), kS = Number(S.st.kShown ?? kNow(S));
  const qh = qCardH(S), foot = chipH(S, 12) + 8 * u;
  qCard(S, { x: A.x, y: A.y, w: A.w, h: qh }, hq.q, { hit: true, a: fr(S, 'k-one', 0, 0.12) });
  const bx = A.x, lx = A.x + 44 * u, y0 = A.y + qh + 10 * u, n = 5, gp = 5 * u, avail = A.y + A.h - foot - y0;
  const nL = T ? 0 : S.portrait ? (avail > 5 * cardH(S, 1) + 4 * gp ? 1 : 0) : 1, ch = Math.min(cardH(S, nL), (avail - (n - 1) * gp) / n);
  let wordsIn = 0;
  for (let r = 0; r < n; r++) {
    const h = B.hits[r], c = B.ix.chunks[h.i], inside = clamp(kS - r + 0.5), y = y0 + r * (ch + gp);
    if (r < kNow(S)) wordsIn += words(c.text).length;
    const isGold = c.id === hq.gold, a = fr(S, 'k-one', 0.15 + r * 0.06, 0.27 + r * 0.06);
    const ok = inside > 0.5 && (r === 0 ? fr(S, 'k-one', 0.65, 0.7) > 0 : true) ? (isGold ? true : h.score > 0 ? false : null) : null;
    chunkCard(S, { x: lx, y, w: A.x + A.w - lx, h: ch }, c, { rank: r + 1, score: S.n(h.score, 2), hit, a: a * lerp(0.5, 1, inside), dim: inside < 0.5, dash: inside < 0.5, ok, tag: ok === true ? { text: S.l('responde', 'answers'), tone: 'dat' } : undefined, maxLines: nL });
  }
  // corchete: lo que se pega en el prompt
  const kb = clamp(kS), yb = y0 + kS * (ch + gp) - gp;
  d.withAlpha(fr(S, 'k-one', 0.3, 0.45) * kb, () => {
    const c = tone(S, 'sig').c;
    d.polyline([[bx + 30 * u, y0], [bx + 22 * u, y0], [bx + 22 * u, yb], [bx + 30 * u, yb]], c, 2.4);
    const ty = (y0 + yb) / 2;
    d.withAlpha(1, () => {
      S.ctx.save(); S.ctx.translate(bx + 10 * u, ty); S.ctx.rotate(-Math.PI / 2);
      const long = S.l(`al prompt · k = ${kNow(S)}`, `to the prompt · k = ${kNow(S)}`), fits = d.measure(long, { size: FS(S, 12), weight: 800 }) <= yb - y0 - 4 * u;
      d.text(fits ? long : `k = ${kNow(S)}`, 0, 0, { size: FS(S, 12), weight: 800, color: tone(S, 'sig').ink, align: 'center', base: 'middle' });
      S.ctx.restore();
    });
  });
  // cuánto se pega
  d.withAlpha(fr(S, 'k-one', 0.5, 0.65), () => {
    chip(S, S.l(`palabras de fuentes en el prompt: ${wordsIn}`, `source words in the prompt: ${wordsIn}`), A.x + A.w, A.y + A.h - foot / 2 + 2 * u, 'w', { size: 12, align: 'right', maxW: A.w });
  });
  void p;
}

// ═════════════ reordenar ═════════════
export function drawRerank(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz), T = tiny(S);
  const R = rerankDemo(l), hq = hardQ(l);
  const qh = qCardH(S);
  qCard(S, { x: A.x, y: A.y, w: A.w, h: qh }, hq.q, { hit: true, a: fr(S, 'rerank', 0, 0.12) });
  const y0 = A.y + qh + 10 * u, colW = S.portrait ? (A.w - 30 * u) / 2 : Math.min(A.w * 0.34, 300 * u), gapC = S.portrait ? 30 * u : Math.min(A.w - 2 * colW, 200 * u);
  const x0 = A.x + (A.w - 2 * colW - gapC) / 2, x1 = x0 + colW + gapC;
  const hy = y0 + L / 2, sub = T ? 0 : LH(S, FS(S, 12)), top = y0 + L + sub + 8 * u, rowH = Math.min(cardH(S, 0) + 6 * u, (A.y + A.h - top) / 5);
  const lt = tone(S, 'lat');
  d.withAlpha(fr(S, 'rerank', 0.12, 0.26), () => {
    fitText(S, S.l('por palabras', 'by words'), x0, hy, colW, sz, { weight: 800, color: lt.ink });
    if (sub) fitText(S, S.l('rápido, barato', 'fast, cheap'), x0, hy + L * 0.95, colW, FS(S, 12), { weight: 600, color: p.mute });
  });
  d.withAlpha(fr(S, 'rerank', 0.55, 0.7), () => {
    fitText(S, S.l('reordenador', 'reranker'), x1, hy, colW, sz, { weight: 800, color: tone(S, 'w').ink });
    if (sub) fitText(S, S.l('lee pregunta y fragmento juntos', 'reads question and chunk together'), x1, hy + L * 0.95, colW, FS(S, 12), { weight: 600, color: p.mute });
  });
  const chipRow = (x: number, y: number, c: Chunk, rank: number, t: 'lat' | 'w', gold: boolean, a: number) => {
    d.withAlpha(a, () => {
      const h = rowH - 6 * u;
      d.rect(x, y, colW, h, { fill: gold ? alpha(tone(S, 'dat').c, 0.14) : p.surface, stroke: gold ? tone(S, 'dat').c : tone(S, t).c, lw: gold ? 2.2 : 1.4, r: 4 });
      badgeNum(S, rank, x + 6 * u + L * 0.42, y + h / 2, L * 0.42, t);
      fitText(S, srcLabel(c), x + 12 * u + L * 0.84, y + h / 2, colW - L * 0.84 - (gold ? 34 : 18) * u, sz, { weight: 700, color: gold ? tone(S, 'dat').ink : p.ink });
      if (gold) mark(S, x + colW - 12 * u, y + h / 2, true, 5);
    });
  };
  R.before.forEach((b, i) => chipRow(x0, top + i * rowH, chunkById(l, b.id), i + 1, 'lat', b.id === R.gold && S.on('rerank-demo'), fr(S, 'rerank', 0.2 + i * 0.05, 0.3 + i * 0.05)));
  const mv = fr(S, 'rerank-demo', 0.08, 0.45, 'io');
  if (S.on('rerank-demo')) {
    R.after.forEach((id, j) => {
      const i = R.before.findIndex((b) => b.id === id), ya = top + i * rowH + (rowH - 6 * u) / 2, yb = top + j * rowH + (rowH - 6 * u) / 2, gold = id === R.gold;
      d.line(x0 + colW + 4 * u, ya, lerp(x0 + colW + 4 * u, x1 - 4 * u, mv), lerp(ya, yb, mv), gold ? tone(S, 'dat').c : alpha(p.ink, 0.35), gold ? 2.6 : 1.4);
      chipRow(x1, top + j * rowH, chunkById(l, id), j + 1, 'w', gold, fr(S, 'rerank-demo', 0.35 + j * 0.04, 0.45 + j * 0.04));
    });
    const a = fr(S, 'rerank-demo', 0.7, 0.82), cy = A.y + A.h - chipH(S, 12) / 2;
    if (top + 5 * rowH + chipH(S, 12) + 4 * u < A.y + A.h) chip(S, S.l('más lento: solo para unos pocos candidatos', 'slower: only for a few candidates'), A.x + A.w, cy, 'w', { size: 12, align: 'right', a, maxW: A.w });
  }
  void lines; void clamp;
}
