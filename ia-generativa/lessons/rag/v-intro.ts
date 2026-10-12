// Vistas del principio y del cierre:
//  · drawChat   (hook, never-read, guess): el chat de la tienda, el modelo con pesos fijos y el manual que nunca leyó.
//  · drawPages  (paste, idea): pegarlo todo no cabe; buscar primero y pegar solo lo que responde.
//  · drawName   (rag-name, rag-paper): qué significa RAG y de dónde viene el nombre.
//  · drawPipe   (two-times y recap): los dos tiempos, preparar una vez y responder con cada pregunta.
//  · drawBridge (bridge): la siguiente lección.
import { alpha, clamp, hash, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { demoQ, lang } from './model';
import { FS, LH, Z, area, arrow, card, chip, chipW, fitText, fr, header, lines, node, page, tight, tiny } from './ui';

// ── piezas locales ──────────────────────────────────────────────────────────────────────────────────
/** Candado en píxeles: los pesos quedan fijos. Ocupa 8·cell de lado. */
const LOCK = ['..1111..', '.1....1.', '.1....1.', '11111111', '11222211', '11222211', '11222211', '11111111'];
export function lock(S: Frame, x: number, y: number, cell: number, a = 1) {
  S.d.withAlpha(a, () => LOCK.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') S.d.rect(x + c * cell, y + r * cell, cell, cell, { fill: ch === '1' ? S.pal.ink2 : tone(S, 'w').c }); })));
}

/** Globo de chat: el del cliente a la derecha, el del modelo a la izquierda. Devuelve su alto. */
function bubble(S: Frame, text: string, who: 'user' | 'ai', x: number, y: number, maxW: number, size: number, o: { a?: number; dash?: boolean; maxLines?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, who === 'user' ? 'sig' : 'w'), pad = (tight(S) ? 6 : 8) * u;
  const ls = lines(S, text, maxW - 2 * pad, size, { weight: 600, maxLines: o.maxLines });
  const tw = Math.max(...ls.map((l) => d.measure(l, { size, weight: 600 }))), w = Math.min(maxW, tw + 2 * pad), lh = size * u * 1.25, h = ls.length * lh + 2 * pad - 3 * u;
  const bx = who === 'user' ? x + maxW - w : x;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(bx, y, w, h, { fill: who === 'user' ? alpha(t.c, 0.14) : p.surface, stroke: t.c, lw: 1.4, r: 8 * u, dash: o.dash ? [5, 4] : undefined });
    ls.forEach((l, i) => d.text(l, bx + pad, y + pad - 1.5 * u + i * lh, { size, weight: 600, color: p.ink, base: 'top' }));
  });
  return h;
}

const GUESS = { es: 'Normalmente, la batería tiene uno o dos años de garantía.', en: 'Usually, the battery comes with a one- to two-year warranty.' };

// ═════════════ el chat, el modelo y el manual ═════════════
export function drawChat(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S), sz = FS(S, 13), L = LH(S, sz);
  let chat: Rect, model: Rect, manual: Rect;
  if (S.portrait) {
    const ch = A.h * 0.56, gap = 10 * u, cw = (A.w - gap) / 2, y = A.y + ch + gap;
    chat = { x: A.x, y: A.y, w: A.w, h: ch };
    model = { x: A.x, y, w: cw, h: A.y + A.h - y };
    manual = { x: A.x + cw + gap, y, w: cw, h: A.y + A.h - y };
  } else {
    // compacto y centrado: en pantallas grandes no se estira de más
    const lw = Math.min(A.w * 0.38, 330 * u), gap = 14 * u, H = Math.min(A.h, 330 * u * Z(S)), y0 = A.y + (A.h - H) / 2;
    chat = { x: A.x + lw + gap, y: y0, w: A.w - lw - gap, h: H };
    if (tiny(S)) { const cw = (lw - 10 * u) / 2; model = { x: A.x, y: y0, w: cw, h: H }; manual = { x: A.x + cw + 10 * u, y: y0, w: cw, h: H }; }
    else { const mh = (H - gap) / 2; model = { x: A.x, y: y0, w: lw, h: mh }; manual = { x: A.x, y: y0 + mh + gap, w: lw, h: mh }; }
  }
  const aChat = fr(S, 'hook', 0, 0.12), aQ = fr(S, 'hook', 0.08, 0.22), aModel = fr(S, 'hook', 0.25, 0.4), aMan = fr(S, 'hook', 0.62, 0.78);

  // ── chat ──
  d.withAlpha(aChat, () => {
    card(S, chat, { fill: alpha(p.surface, 0.6) });
    header(S, S.l('Chat de la tienda', 'Shop chat'), { x: chat.x + 10 * u, y: chat.y + 4 * u, w: chat.w - 20 * u, h: L }, 1);
  });
  const inner = chat.w - 20 * u, bw = inner * 0.9, qy = chat.y + 8 * u + L * 1.4;
  const qh = bubble(S, demoQ(l).q, 'user', chat.x + 10 * u + inner - bw, qy, bw, sz, { a: aQ });
  const ay = qy + qh + 8 * u;
  if (!S.on('guess')) {
    d.withAlpha(fr(S, 'hook', 0.3, 0.45), () => {
      const bh = L + 12 * u;
      d.rect(chat.x + 10 * u, ay, 54 * u, bh, { fill: p.surface, stroke: tone(S, 'w').c, lw: 1.4, r: 8 * u });
      for (let i = 0; i < 3; i++) d.circle(chat.x + 10 * u + 15 * u + i * 12 * u, ay + bh / 2, (2.6 + 1.1 * Math.max(0, Math.sin(S.clock * 5 - i))) * u, { fill: p.mute });
    });
  } else {
    const room = chat.y + chat.h - ay - 10 * u - (L + 12 * u), maxLines = Math.max(1, Math.floor(room / (sz * u * 1.25)) - 1);
    const h = bubble(S, GUESS[l], 'ai', chat.x + 10 * u, ay, bw, sz, { a: fr(S, 'guess', 0.05, 0.2), dash: true, maxLines });
    const ty = ay + h + 6 * u + chipH2(S) / 2;
    if (ty + chipH2(S) / 2 < chat.y + chat.h - 2 * u) {
      const c1 = chip(S, S.l('respuesta ilustrativa', 'illustrative answer'), chat.x + 10 * u, ty, 'mute', { size: 12, align: 'left', dash: true, a: fr(S, 'guess', 0.25, 0.4), maxW: inner * 0.55 });
      chip(S, S.l('¿de dónde salió?', 'where is it from?'), c1.x + c1.w + 8 * u, ty, 'err', { size: 12, align: 'left', a: fr(S, 'guess', 0.6, 0.75), maxW: inner - c1.w - 8 * u });
    }
  }

  // ── modelo ──
  d.withAlpha(aModel, () => {
    const t = tone(S, 'w');
    card(S, model, { tone: 'w', fill: alpha(t.c, 0.06) });
    fitText(S, S.l('Modelo', 'Model'), model.x + 8 * u, model.y + 6 * u + L / 2, model.w - 16 * u, sz, { weight: 800, color: t.ink });
    const gx = model.x + 8 * u, gy = model.y + 10 * u + L, avail = model.y + model.h - gy - 8 * u - (L + 12 * u);
    const cols = S.portrait || tiny(S) ? 6 : 8, cs = Math.min((model.w - 16 * u) / cols, 22 * u), rows = Math.max(1, Math.min(4, Math.floor(avail / cs)));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d.rect(gx + i * cs, gy + j * cs, cs - 2, cs - 2, { fill: alpha(t.c, 0.16 + 0.55 * hash(i, j + 7)) });
    const lk = Math.max(2, Math.round(Math.min(cs * rows, 40 * u) / 9)), la = fr(S, 'never-read', 0.35, 0.5);
    lock(S, gx + cols * cs / 2 - 4 * lk, gy + (rows * cs) / 2 - 4 * lk, lk, la);
    chip(S, S.l('pesos fijos', 'fixed weights'), model.x + 8 * u, gy + rows * cs + 6 * u + chipH2(S) / 2, 'w', { size: 12, align: 'left', a: fr(S, 'never-read', 0.45, 0.6), maxW: model.w - 16 * u });
  });

  // ── manual de la tienda ──
  d.withAlpha(aMan, () => {
    card(S, manual, { tone: 'dat', fill: alpha(tone(S, 'dat').c, 0.05) });
    fitText(S, S.l('Manual de la tienda', 'Shop manual'), manual.x + 8 * u, manual.y + 6 * u + L / 2, manual.w - 16 * u, sz, { weight: 800, color: tone(S, 'dat').ink });
    const top = manual.y + 10 * u + L, avail = manual.y + manual.h - top - 8 * u - (L + 12 * u), ph = Math.max(16 * u, Math.min(avail, 70 * u)), pw = ph * 0.74;
    for (let i = 2; i >= 0; i--) page(S, manual.x + 12 * u + i * 9 * u, top + (2 - i) * 4 * u, pw, ph - 8 * u, { tone: 'dat', lines: 3 });
    chip(S, S.l('nunca lo leyó', 'never read it'), manual.x + 8 * u, top + ph + 2 * u + chipH2(S) / 2, 'err', { size: 12, align: 'left', a: fr(S, 'never-read', 0.12, 0.28), maxW: manual.w - 16 * u });
  });
  // barrera entre el modelo y el manual
  d.withAlpha(fr(S, 'never-read', 0.1, 0.25), () => {
    const c = tone(S, 'err').c;
    if (S.portrait || tiny(S)) { const x = (model.x + model.w + manual.x) / 2; d.line(x, model.y + 6 * u, x, model.y + model.h - 6 * u, c, 2.4, [6, 5]); }
    else { const y = (model.y + model.h + manual.y) / 2; d.line(model.x + 6 * u, y, model.x + model.w - 6 * u, y, c, 2.4, [6, 5]); }
  });
}
const chipH2 = (S: Frame) => FS(S, 12) * S.u + 10 * S.u;

// ═════════════ pegarlo todo frente a buscar primero ═════════════
const PICK = [9, 30, 52];
export function drawPages(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), sz = FS(S, 13), L = LH(S, sz);
  const hh = header(S, S.l('Documentos de una empresa (ilustrativo)', 'A company’s documents (illustrative)'), A, fr(S, 'paste', 0, 0.1));
  const C: Rect = { x: A.x, y: A.y + hh + 4 * u, w: A.w, h: A.h - hh - 4 * u };
  const cols = S.portrait ? 10 : tiny(S) ? 16 : 12, rows = S.portrait ? 6 : tiny(S) ? 4 : 6, N = cols * rows, CAP = 12, wc = 4, wr = 3;
  let G: Rect, W: Rect;
  if (S.portrait) { const gh = C.h * 0.42; G = { x: C.x, y: C.y, w: C.w, h: gh }; const wy = C.y + gh + L * 1.6 + 8 * u; W = { x: C.x + C.w * 0.12, y: wy, w: C.w * 0.76, h: Math.min(C.y + C.h - wy - chipH2(S) - 8 * u, C.w * 0.5) }; }
  else { const gw = C.w * 0.56; G = { x: C.x, y: C.y, w: gw, h: C.h }; const wx = C.x + gw + C.w * 0.06; W = { x: wx, y: C.y + L * 1.4 + 2 * u, w: C.x + C.w - wx, h: Math.min(C.h - L * 1.4 - chipH2(S) - 12 * u, (C.x + C.w - wx) * 0.62) }; }
  const gap = 3 * u, pw = Math.min((G.w - (cols - 1) * gap) / cols, ((G.h - (rows - 1) * gap) / rows) * 0.78), ph = pw * 1.28;
  const gx0 = G.x + (G.w - (cols * pw + (cols - 1) * gap)) / 2, gy0 = G.y;
  const at = (i: number): [number, number] => [gx0 + (i % cols) * (pw + gap), gy0 + Math.floor(i / cols) * (ph + gap)];
  const wg = 5 * u, wpw = Math.min((W.w - 12 * u - (wc - 1) * wg) / wc, ((W.h - 12 * u - (wr - 1) * wg) / wr) / 1.28), wph = wpw * 1.28;
  const wx0 = W.x + (W.w - (wc * wpw + (wc - 1) * wg)) / 2, wy0 = W.y + (W.h - (wr * wph + (wr - 1) * wg)) / 2;
  const slot = (j: number): [number, number] => [wx0 + (j % wc) * (wpw + wg), wy0 + Math.floor(j / wc) * (wph + wg)];
  const lt = tone(S, 'lat');
  // ventana de contexto
  d.withAlpha(fr(S, 'paste', 0.04, 0.16), () => {
    fitText(S, S.l('Ventana de contexto', 'Context window'), W.x, W.y - L * 0.7, W.w, sz, { weight: 800, color: lt.ink });
    d.rect(W.x, W.y, W.w, W.h, { fill: alpha(lt.c, 0.06), stroke: lt.c, lw: 2, r: 4 });
  });
  const idea = S.on('idea'), out = idea ? 1 - fr(S, 'idea', 0, 0.14) : 1, prog = fr(S, 'paste', 0.14, 0.6, 'lin') * N;
  const pick = PICK.map((i) => Math.min(i, N - 1)), hl = fr(S, 'idea', 0.28, 0.42), mv = fr(S, 'idea', 0.48, 0.7, 'io');
  for (let i = 0; i < N; i++) {
    const [x, y] = at(i), reached = clamp(prog - i), pi = pick.indexOf(i);
    if (idea && pi >= 0) {
      // las tres partes que responden: se resaltan y entran en la ventana
      const [sx, sy] = slot(pi), k = mv, xx = lerp(x, sx, k), yy = lerp(y, sy, k), ww = lerp(pw, wpw, k), hh2 = lerp(ph, wph, k);
      if (k < 1) page(S, x, y, pw, ph, { tone: 'dat', lines: 2, a: 0.25 });
      page(S, xx, yy, ww, hh2, { tone: 'sig', lines: 2, fill: alpha(tone(S, 'sig').c, 0.15 * hl) });
      if (hl > 0.01) d.rect(xx - 2, yy - 2, ww + 4, hh2 + 4, { stroke: tone(S, 'sig').c, lw: 2, r: 3, a: hl });
      continue;
    }
    if (reached > 0 && i < CAP) {
      const [sx, sy] = slot(i);
      page(S, x, y, pw, ph, { tone: 'dat', lines: 2, a: 0.22 + 0.78 * (1 - out) });
      d.withAlpha(out, () => page(S, lerp(x, sx, reached), lerp(y, sy, reached), lerp(pw, wpw, reached), lerp(ph, wph, reached), { tone: 'dat', lines: 2 }));
    } else if (reached > 0) {
      d.withAlpha(1 - out, () => page(S, x, y, pw, ph, { tone: 'dat', lines: 2 }));
      d.withAlpha(out, () => page(S, x, y, pw, ph, { tone: 'err', lines: 2, dash: true, fill: alpha(tone(S, 'err').c, 0.12 * reached) }));
    } else page(S, x, y, pw, ph, { tone: 'dat', lines: 2, a: fr(S, 'paste', 0, 0.12) });
  }
  const gBottom = gy0 + rows * (ph + gap);
  // rótulos
  const cy = W.y + W.h + 8 * u + chipH2(S) / 2;
  if (!idea || out > 0) {
    d.withAlpha(out, () => {
      chip(S, S.l('no caben', 'they do not fit'), S.portrait ? G.x + G.w : gx0 + cols * (pw + gap) - gap, Math.min(gBottom + 6 * u + chipH2(S) / 2, S.portrait ? W.y - L * 1.6 : C.y + C.h - chipH2(S) / 2), 'err', { size: 12, align: 'right', a: fr(S, 'paste', 0.55, 0.68) });
      chip(S, S.l('cada token se paga', 'every token costs money'), W.x + W.w, cy, 'w', { size: 12, align: 'right', a: fr(S, 'paste', 0.72, 0.85), maxW: W.w });
    });
  }
  if (idea) chip(S, S.l('solo lo que responde', 'only what answers'), W.x + W.w, cy, 'sig', { size: 12, align: 'right', a: fr(S, 'idea', 0.72, 0.85), maxW: W.w });
}

// ═════════════ el nombre ═════════════
export function drawName(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), cx = A.x + A.w / 2;
  const big = FS(S, tiny(S) ? 30 : 46), sz = FS(S, 14), L = LH(S, sz);
  const y0 = A.y + (tiny(S) ? 4 * u : A.h * 0.06), ty = y0 + big * u * 0.55;
  d.withAlpha(fr(S, 'rag-name', 0, 0.1), () => d.text('RAG', cx, ty, { size: big, weight: 800, align: 'center', base: 'middle', color: tone(S, 'lat').ink }));
  // Retrieval-Augmented Generation, con sus iniciales resaltadas
  const parts = ['Retrieval-', 'Augmented ', 'Generation'], wsz = fitSize2(S, 'Retrieval-Augmented Generation', A.w, FS(S, 17), 700);
  const tw = parts.reduce((a, s) => a + d.measure(s, { size: wsz, weight: 700 }), 0);
  let x = cx - tw / 2; const ey = ty + big * u * 0.62 + L * 0.5;
  d.withAlpha(fr(S, 'rag-name', 0.08, 0.2), () => parts.forEach((s) => {
    d.text(s[0], x, ey, { size: wsz, weight: 800, color: tone(S, 'lat').ink, base: 'middle' });
    d.text(s.slice(1), x + d.measure(s[0], { size: wsz, weight: 800 }), ey, { size: wsz, weight: 600, color: p.ink2, base: 'middle' });
    x += d.measure(s, { size: wsz, weight: 700 });
  }));
  let yy = ey + L * 0.9;
  if (S.lang === 'es') { d.withAlpha(fr(S, 'rag-name', 0.14, 0.26), () => fitText(S, 'generación aumentada por recuperación', cx, yy, A.w, sz, { weight: 600, color: p.mute, align: 'center' })); yy += L; }
  // los dos pasos (rag-name) → el artículo (rag-paper)
  const R: Rect = { x: A.x, y: yy + (tiny(S) ? 4 : 16) * u, w: A.w, h: A.y + A.h - yy - (tiny(S) ? 4 : 16) * u };
  const steps = 1 - fr(S, 'rag-paper', 0, 0.12);
  if (steps > 0.01) d.withAlpha(steps, () => {
    const nw = Math.min(S.portrait ? R.w * 0.8 : R.w * 0.36, 280 * u), nh = Math.min(tiny(S) ? 46 * u : 64 * u, S.portrait ? R.h * 0.38 : R.h * 0.8);
    const vert = S.portrait, gap = vert ? Math.min(30 * u, R.h - 2 * nh) : Math.min(80 * u, R.w - 2 * nw);
    const b1: Rect = vert ? { x: cx - nw / 2, y: R.y, w: nw, h: nh } : { x: cx - gap / 2 - nw, y: R.y + (R.h - nh) * 0.35, w: nw, h: nh };
    const b2: Rect = vert ? { x: cx - nw / 2, y: R.y + nh + gap, w: nw, h: nh } : { x: cx + gap / 2, y: b1.y, w: nw, h: nh };
    stepBox(S, b1, S.l('1 · Recuperar', '1 · Retrieve'), S.l('buscar y traer', 'find and fetch'), 'lat', fr(S, 'rag-name', 0.4, 0.55));
    stepBox(S, b2, S.l('2 · Generar', '2 · Generate'), S.l('escribir la respuesta', 'write the answer'), 'w', fr(S, 'rag-name', 0.72, 0.86));
    if (vert) arrow(S, cx, b1.y + b1.h + 3 * u, cx, b2.y - 3 * u, { k: fr(S, 'rag-name', 0.6, 0.72) });
    else arrow(S, b1.x + b1.w + 6 * u, b1.y + nh / 2, b2.x - 6 * u, b1.y + nh / 2, { k: fr(S, 'rag-name', 0.6, 0.72) });
  });
  if (S.on('rag-paper')) {
    const a = fr(S, 'rag-paper', 0.08, 0.22), cw = Math.min(R.w, 460 * u), x0 = cx - cw / 2;
    d.withAlpha(a, () => {
      const nsz = FS(S, tiny(S) ? 22 : 30), small = FS(S, 13), h = LH(S, small) * 2.6 + nsz * u * 1.3 + 16 * u, y = R.y + Math.max(0, (R.h - h) * 0.3);
      card(S, { x: x0, y, w: cw, h }, { tone: 'dat', fill: alpha(tone(S, 'dat').c, 0.05) });
      fitText(S, S.l('Lewis y su equipo, 2020', 'Lewis and team, 2020'), cx, y + 8 * u + LH(S, small) / 2, cw - 16 * u, small, { weight: 800, align: 'center', color: tone(S, 'dat').ink });
      fitText(S, S.l('Wikipedia entera, cortada en', 'All of Wikipedia, cut into'), cx, y + 8 * u + LH(S, small) * 1.5, cw - 16 * u, small, { weight: 600, align: 'center', color: p.ink2 });
      const ny = y + 8 * u + LH(S, small) * 2 + nsz * u * 0.65;
      d.withAlpha(fr(S, 'rag-paper', 0.6, 0.75), () => {
        d.text(S.n(21e6, 0), cx, ny, { size: nsz, weight: 800, font: 'mono', align: 'center', base: 'middle', color: p.ink });
        fitText(S, S.l('trozos de 100 palabras', 'pieces of 100 words'), cx, ny + nsz * u * 0.65 + LH(S, small) * 0.5, cw - 16 * u, small, { weight: 700, align: 'center', color: tone(S, 'dat').ink });
      });
    });
  }
}
function fitSize2(S: Frame, str: string, w: number, size: number, weight: number) { let s = size; const m = FS(S, 12); while (s > m && S.d.measure(str, { size: s, weight }) > w) s -= 0.5; return s; }
function stepBox(S: Frame, r: Rect, title: string, sub: string, t: 'lat' | 'w', a: number) {
  const sz = FS(S, 14), L = LH(S, sz), small = FS(S, 12.5), c = tone(S, t);
  S.d.withAlpha(a, () => {
    card(S, r, { tone: t, fill: alpha(c.c, 0.1) });
    fitText(S, title, r.x + r.w / 2, r.y + r.h / 2 - L * 0.42, r.w - 12 * S.u, sz, { weight: 800, align: 'center', color: c.ink });
    fitText(S, sub, r.x + r.w / 2, r.y + r.h / 2 + L * 0.5, r.w - 12 * S.u, small, { weight: 600, align: 'center', color: S.pal.ink2 });
  });
}

// ═════════════ los dos tiempos (y el resumen) ═════════════
type Key = 'docs' | 'chunk' | 'vec' | 'index' | 'q' | 'ret' | 'prompt' | 'model';
function pipeRects(S: Frame, A: Rect): Record<Key, Rect> & { la: [number, number, number]; lb: [number, number, number] } {
  const u = S.u, L = LH(S, FS(S, 13));
  if (S.portrait) {
    const gx = 18 * u, cw = (A.w - gx) / 2, top = A.y + L * 2.4, rest = A.h - L * 2.4 - 2 * chipH2(S) - 18 * u, nh = Math.min(48 * u, rest / 5.2), gap = (rest - 4 * nh) / 3;
    const r = (col: number, i: number): Rect => ({ x: A.x + col * (cw + gx), y: top + i * (nh + gap), w: cw, h: nh });
    return { docs: r(0, 0), chunk: r(0, 1), vec: r(0, 2), index: r(0, 3), q: r(1, 0), ret: r(1, 1), prompt: r(1, 2), model: r(1, 3), la: [A.x, A.y + L * 0.5, cw], lb: [A.x + cw + gx, A.y + L * 0.5, cw] };
  }
  const gx = (tiny(S) ? 18 : 28) * u, nw = (A.w - 3 * gx) / 4, nh = Math.min(50 * u, A.h * 0.2), yA = A.y + L * 1.3, yB = A.y + A.h * (tiny(S) ? 0.5 : 0.56);
  const r = (y: number, i: number): Rect => ({ x: A.x + i * (nw + gx), y, w: nw, h: nh });
  return { docs: r(yA, 0), chunk: r(yA, 1), vec: r(yA, 2), index: r(yA, 3), q: r(yB, 0), ret: r(yB, 1), prompt: r(yB, 2), model: r(yB, 3), la: [A.x, A.y + L * 0.5, A.w], lb: [A.x, yB - L * 0.8, A.w] };
}
export function drawPipe(S: Frame, mode: 'two' | 'recap') {
  const { d, pal: p } = S, u = S.u, A = area(S), R = pipeRects(S, A), sz = FS(S, 13), recap = mode === 'recap';
  const k0 = recap ? 'recap' : 'two-times';
  const aA = recap ? 1 : fr(S, k0, 0.12, 0.3), aB = recap ? 1 : fr(S, k0, 0.52, 0.7);
  const lab: Record<Key, string> = { docs: S.l('Documentos', 'Documents'), chunk: S.l('Fragmentar', 'Chunk'), vec: S.l('Vectorizar', 'Vectorize'), index: S.l('Índice', 'Index'), q: S.l('Pregunta', 'Question'), ret: S.l('Recuperar', 'Retrieve'), prompt: S.l('Armar prompt', 'Build prompt'), model: S.l('Modelo', 'Model') };
  const tn: Record<Key, 'dat' | 'lat' | 'sig' | 'w'> = { docs: 'dat', chunk: 'dat', vec: 'lat', index: 'lat', q: 'sig', ret: 'lat', prompt: 'sig', model: 'w' };
  // recap: se encienden en orden, al ritmo de la frase
  const hotAt: Partial<Record<Key, number>> = { chunk: 0.14, index: 0.24, ret: 0.42, prompt: 0.56, model: 0.7 };
  const hot = (k: Key) => (recap && hotAt[k] !== undefined ? fr(S, 'recap', hotAt[k]!, hotAt[k]! + 0.08) : 0);
  const laneA = S.l('Preparar · una sola vez', 'Prepare · just once'), laneB = S.l('Con cada pregunta', 'With every question');
  d.withAlpha(aA, () => fitText(S, laneA, R.la[0], R.la[1], R.la[2], sz, { weight: 800, color: tone(S, 'dat').ink }));
  d.withAlpha(aB, () => fitText(S, laneB, R.lb[0], R.lb[1], R.lb[2], sz, { weight: 800, color: tone(S, 'sig').ink }));
  const A1: Key[] = ['docs', 'chunk', 'vec', 'index'], B1: Key[] = ['q', 'ret', 'prompt', 'model'];
  const link = (a: Rect, b: Rect, k: number) => S.portrait ? arrow(S, a.x + a.w / 2, a.y + a.h + 2 * u, b.x + b.w / 2, b.y - 3 * u, { k }) : arrow(S, a.x + a.w + 3 * u, a.y + a.h / 2, b.x - 4 * u, b.y + b.h / 2, { k });
  A1.forEach((k, i) => { const a = recap ? 1 : fr(S, k0, 0.12 + i * 0.06, 0.24 + i * 0.06); node(S, R[k], lab[k], { tone: tn[k], a, hot: hot(k) }); if (i) link(R[A1[i - 1]], R[k], recap ? 1 : fr(S, k0, 0.12 + i * 0.06, 0.24 + i * 0.06)); });
  B1.forEach((k, i) => { const a = recap ? 1 : fr(S, k0, 0.52 + i * 0.06, 0.64 + i * 0.06); node(S, R[k], lab[k], { tone: tn[k], a, hot: hot(k) }); if (i) link(R[B1[i - 1]], R[k], recap ? 1 : fr(S, k0, 0.52 + i * 0.06, 0.64 + i * 0.06)); });
  // el índice alimenta a «Recuperar»
  const ka = recap ? 1 : fr(S, k0, 0.78, 0.9), ix = R.index, rt = R.ret, c = tone(S, 'lat').c;
  if (ka > 0.01) d.withAlpha(ka, () => {
    if (S.portrait) { const sx = ix.x + ix.w, sy = ix.y + ix.h / 2, mx = sx + 9 * u, ey = rt.y + rt.h / 2; d.polyline([[sx, sy], [mx, sy], [mx, ey]], c, 2); d.arrow(mx, ey, rt.x - 2, ey, c, 2, 7 * u); }
    else { const sx = ix.x + ix.w / 2, sy = ix.y + ix.h, ex = rt.x + rt.w / 2, my = (sy + rt.y) / 2; d.polyline([[sx, sy], [sx, my], [ex, my]], c, 2); d.arrow(ex, my, ex, rt.y - 2, c, 2, 7 * u); }
  });
  // la respuesta, con citas
  const m = R.model, ra = recap ? fr(S, 'recap', 0.72, 0.82) : fr(S, k0, 0.8, 0.92);
  const cy = m.y + m.h + 6 * u + chipH2(S) / 2;
  chip(S, S.l('respuesta + citas', 'answer + citations'), m.x + m.w / 2, cy, 'sig', { size: 12, a: ra, maxW: S.portrait ? m.w + 16 * u : m.w + 30 * u });
  if (recap) {
    const a = fr(S, 'recap', 0.86, 0.96), lk = Math.max(2, Math.round(2.2 * u));
    d.withAlpha(a, () => {
      const txt = S.l('sin reentrenar', 'no retraining'), w = chipW(S, txt, 12) + 12 * lk;
      const ansW = chipW(S, S.l('respuesta + citas', 'answer + citations'), 12);
      const x = S.portrait ? m.x + m.w - w : m.x + m.w / 2 - ansW / 2 - 10 * u - w, y = S.portrait ? cy + chipH2(S) / 2 + 6 * u : cy - chipH2(S) / 2;
      if (y > A.y + LH(S, sz) && y + chipH2(S) <= A.y + A.h + 2 * u) { lock(S, x, y + chipH2(S) / 2 - 4 * lk, lk); chip(S, txt, x + 10 * lk, y + chipH2(S) / 2, 'w', { size: 12, align: 'left' }); }
    });
  }
  void p;
}

// ═════════════ puente ═════════════
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), cx = A.x + A.w / 2, sz = FS(S, 13), big = FS(S, tiny(S) ? 20 : 24);
  const sc = Math.max(2, Math.round((tiny(S) ? 2.4 : 4) * u)), ny = A.y + (tiny(S) ? 2 * u : A.h * 0.1);
  neu(S, cx - 12 * sc, ny, { scale: sc, mood: 'happy', a: fr(S, 'bridge', 0.05, 0.2) });
  const ty = ny + 18 * sc + (tiny(S) ? 10 : 22) * u;
  d.withAlpha(fr(S, 'bridge', 0.1, 0.25), () => {
    d.text(S.l('Hasta aquí: leer', 'So far: reading'), cx, ty, { size: sz, weight: 700, color: p.mute, align: 'center', base: 'middle' });
  });
  const acts = [S.l('consultar un pedido', 'look up an order'), S.l('calcular un reembolso', 'work out a refund'), S.l('enviar un correo', 'send an email')];
  const ch = chipH2(S), gap = 8 * u, ay = ty + LH(S, sz) * 0.9 + ch / 2;
  const widths = acts.map((a) => chipW(S, a, 12)), row = !S.portrait && widths.reduce((a, b) => a + b, 0) + 2 * gap < A.w;
  let x = cx - (row ? widths.reduce((a, b) => a + b, 0) + 2 * gap : 0) / 2;
  acts.forEach((a, i) => {
    const at = fr(S, 'bridge', 0.42 + i * 0.1, 0.52 + i * 0.1);
    if (row) { chip(S, a, x, ay, 'w', { size: 12, align: 'left', a: at }); x += widths[i] + gap; }
    else chip(S, a, cx, ay + i * (ch + 5 * u), 'w', { size: 12, a: at });
  });
  const by = (row ? ay + ch : ay + 3 * (ch + 5 * u)) + (tiny(S) ? 8 : 18) * u;
  d.withAlpha(fr(S, 'bridge', 0.78, 0.92), () => {
    const t = S.l('Siguiente: agentes y herramientas', 'Next: agents and tools'), ls = lines(S, t, A.w, big, { weight: 800 }), lh = big * u * 1.2;
    ls.forEach((ln, i) => d.text(ln, cx, by + i * lh, { size: big, weight: 800, align: 'center', base: 'middle', color: p.ink }));
  });
}
