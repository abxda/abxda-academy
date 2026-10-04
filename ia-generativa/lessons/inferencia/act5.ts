// Acto 5 · Mezcla de expertos (idea, números, memoria), decodificación especulativa (mención), resumen y puente.
import { alpha, clamp, hash, neu, token, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { expertsTouched, gb, mixtralParams, nf } from './model';
import { FS, chip, fitText, lang, mark, noteUp, pad, pill, show, tagText, tokW } from './ui';

const MP = mixtralParams();
const E = 8;

/** Los dos expertos que elige el enrutador para el token `i` (determinista). */
export const pick2 = (i: number, layer = 0): [number, number] => {
  const a = Math.floor(hash(i * 7 + 1, layer + 11) * E), b = (a + 1 + Math.floor(hash(i * 7 + 2, layer + 11) * (E - 1))) % E;
  return [a, b];
};

function expertBoxes(S: Frame, r: Rect): Rect[] {
  const u = S.u, g = 8 * u, cols = S.portrait ? 4 : 8, rows = S.portrait ? 2 : 1, w = (r.w - g * (cols - 1)) / cols, h = Math.min((r.h - g * (rows - 1)) / rows, 90 * u);
  return Array.from({ length: E }, (_, i) => ({ x: r.x + (i % cols) * (w + g), y: r.y + Math.floor(i / cols) * (h + g), w, h }));
}
function drawExperts(S: Frame, boxes: Rect[], hits: number[], hot: number[] = []) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w');
  boxes.forEach((b, i) => {
    const on = hits[i] > 0;
    d.rect(b.x, b.y, b.w, b.h, { fill: on ? alpha(wt.c, hot.includes(i) ? 0.5 : 0.28) : p.surface, stroke: on ? wt.c : p.mute, lw: on ? 2.2 : 1.2, r: 3, dash: on ? undefined : [4, 3] });
    d.text(`E${i + 1}`, b.x + b.w / 2, b.y + b.h * (hits[i] > 1 ? 0.36 : 0.5), { size: FS(S, 14), weight: 800, font: 'mono', color: on ? wt.ink : p.mute, align: 'center', base: 'middle' });
    if (hits[i] > 1) d.text(`×${hits[i]}`, b.x + b.w / 2, b.y + b.h * 0.72, { size: FS(S, 12), weight: 700, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
  });
}

// ═════════════ la idea: ocho redes, el enrutador elige dos ═════════════
export function drawMoeIdea(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w'), sg = tone(S, 'sig'), lt = tone(S, 'lat');
  const words = l === 'es' ? ['plazo', 'doce', 'meses', 'paga'] : ['term', 'twelve', 'months', 'paid'];
  const idx = Math.floor(Math.max(0, S.since('moe-idea') - 1.6) / 2.4) % 4, started = S.since('moe-idea') > 1.6, [a, b] = pick2(idx);
  const exH = S.portrait ? A.h * 0.36 : A.h * 0.3, ex: Rect = { x: A.x, y: A.y + A.h - exH - 22 * u, w: A.w, h: exH };
  const boxes = expertBoxes(S, ex);
  const tokY = A.y + 6 * u, tokH = 34 * u, routerY = tokY + (S.portrait ? 62 : 84) * u, routerW = Math.min(240 * u, A.w * 0.5), routerH = 40 * u, cx = A.x + A.w / 2;
  const aT = S.reveal('moe-idea', 0.2, 0.5), aR = S.reveal('moe-idea', 0.6, 0.5), aE = S.reveal('moe-idea', 1.0, 0.6);
  // líneas (detrás de las cajas)
  show(S, aE, () => {
    boxes.forEach((bx, i) => { const on = started && (i === a || i === b); d.line(cx, routerY + routerH, bx.x + bx.w / 2, bx.y, on ? wt.c : alpha(p.mute, 0.45), on ? 3.2 : 1, on ? undefined : [3, 4]); });
  });
  show(S, aE, () => { drawExperts(S, boxes, boxes.map((_, i) => (started && (i === a || i === b) ? 1 : 0)), [a, b]); });
  show(S, aR, () => {
    d.rect(cx - routerW / 2, routerY, routerW, routerH, { fill: sg.soft, stroke: sg.c, lw: 1.8, r: 4 });
    fitText(S, S.l('enrutador', 'router'), cx, routerY + routerH / 2, routerW - 12 * u, 16, { weight: 800, color: sg.ink, align: 'center', base: 'middle' });
  });
  show(S, aT, () => {
    const w = tokW(S, words[idx], FS(S, 15));
    token(S, cx - w / 2, tokY, words[idx], { tone: 'lat', size: FS(S, 15), h: tokH / u, active: started ? 0.5 : 0 });
    d.line(cx, tokY + tokH, cx, routerY, p.lineStrong, 1.6);
    tagText(S, S.l('un token', 'one token'), cx + w / 2 + 10 * u, tokY + tokH / 2, { t: 'lat', align: 'left' });
  });
  show(S, S.reveal('moe-idea', 2.0, 0.6), () => {
    const pl = S.l('elige 2 de 8', 'picks 2 of 8'), pw = d.measure(pl, { size: FS(S, 12), weight: 600 }) + 14 * u;
    pill(S, pl, Math.min(cx + routerW / 2 + 8 * u + pw / 2, A.x + A.w - pw / 2), routerY + routerH / 2, { t: 'w' });
    tagText(S, S.l('ocho expertos: ocho redes MLP', 'eight experts: eight MLP networks'), cx, ex.y + ex.h + 14 * u + (S.portrait ? 6 * u : 0), { t: 'w', align: 'center', base: 'top', w: A.w });
  });
  void lt;
}

// ═════════════ los números de Mixtral ═════════════
export function drawMoeNumbers(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w');
  const lw = Math.min(130 * u, A.w * 0.28), bx = A.x + lw + 8 * u, bw = A.w - lw - 8 * u - 12 * u, bh = clamp(A.h * 0.12, 38 * u, 66 * u), y0 = A.y + clamp(A.h * 0.18, 40 * u, 100 * u), pitch = bh + clamp(A.h * 0.16, 44 * u, 90 * u);
  const full = MP.total, k = (v: number) => bw * (v / full);
  show(S, S.reveal('moe-numbers', 0.1, 0.5), () => fitText(S, S.l('Parámetros de Mixtral 8x7B', 'Parameters of Mixtral 8x7B'), A.x, A.y + 6 * u, A.w, 17, { weight: 800, base: 'top' }));
  // total
  const a1 = S.reveal('moe-numbers', 0.4, 1.0);
  show(S, a1, () => {
    d.text(S.l('en total', 'in total'), bx - 8 * u, y0 + bh / 2, { size: FS(S, 14), weight: 700, color: wt.ink, align: 'right', base: 'middle' });
    d.rect(bx, y0, k(MP.shared) * a1, bh, { fill: wt.c });
    d.rect(bx + k(MP.shared), y0, k(MP.expertsAll) * a1, bh, { fill: alpha(wt.c, 0.45), stroke: wt.c, lw: 1.4 });
    d.text(`≈ ${nf(MP.total / 1e9, 0, l)} ${S.l('mil M', 'B')}`, bx + bw, y0 - 8 * u, { size: FS(S, 18), weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'bottom', a: a1 });
  });
  // activos
  const a2 = S.reveal('moe-numbers', 3.4, 1.0), y1 = y0 + pitch;
  show(S, a2, () => {
    d.text(S.l('activos por token', 'active per token'), bx - 8 * u, y1 + bh / 2, { size: FS(S, 14), weight: 700, color: wt.ink, align: 'right', base: 'middle', w: lw });
    d.rect(bx, y1, k(MP.shared) * a2, bh, { fill: wt.c });
    d.rect(bx + k(MP.shared), y1, k(MP.expertsActive) * a2, bh, { fill: alpha(wt.c, 0.45), stroke: wt.c, lw: 1.4 });
    d.rect(bx + k(MP.active), y1, (bw - k(MP.active)) * a2, bh, { stroke: p.mute, lw: 1.4, dash: [5, 4] });
    d.text(`≈ ${nf(MP.active / 1e9, 0, l)} ${S.l('mil M', 'B')}`, bx + k(MP.active), y1 - 8 * u, { size: FS(S, 18), weight: 800, font: 'mono', color: p.ink, align: 'left', base: 'bottom', a: a2 });
    d.text(S.l('no se usan con este token', 'not used for this token'), bx + k(MP.active) + (bw - k(MP.active)) / 2, y1 + bh / 2, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle', w: bw - k(MP.active) - 8 * u });
  });
  // leyenda
  show(S, S.reveal('moe-numbers', 4.6, 0.7), () => {
    const y = y1 + bh + 28 * u, sw = 12 * u;
    const lx = S.portrait ? A.x : bx;   // en el teléfono la leyenda usa todo el ancho (si no, el texto se parte en dos renglones y se pisa)
    d.rect(lx, y - sw / 2, sw, sw, { fill: wt.c }); d.text(S.l(`comunes: atención y embeddings (${nf(MP.shared / 1e9, 1, l)} mil M)`, `shared: attention and embeddings (${nf(MP.shared / 1e9, 1, l)}B)`), lx + sw + 6 * u, y, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle', w: A.x + A.w - lx - sw - 8 * u });
    const y2 = y + 22 * u; d.rect(lx, y2 - sw / 2, sw, sw, { fill: alpha(wt.c, 0.45), stroke: wt.c, lw: 1.2 }); d.text(S.l('expertos: dos de ocho por token', 'experts: two of eight per token'), lx + sw + 6 * u, y2, { size: FS(S, 12), weight: 600, color: p.ink2, base: 'middle', w: A.x + A.w - lx - sw - 8 * u });
  });
  show(S, S.reveal('moe-numbers', 6.4, 0.7), () => {
    const y = A.y + A.h - 4 * u, w = (A.w - 12 * u) / 2;
    chip(S, { x: A.x, y: y - 56 * u, w, h: 56 * u }, S.l('calcula como uno de', 'computes like one of'), `${nf(MP.active / 1e9, 0, l)} ${S.l('mil M', 'B')}`, 'dat', { vsize: S.portrait ? 15 : 18 });
    chip(S, { x: A.x + w + 12 * u, y: y - 56 * u, w, h: 56 * u }, S.l('guarda como uno de', 'stores like one of'), `${nf(MP.total / 1e9, 0, l)} ${S.l('mil M', 'B')}`, 'w', { vsize: S.portrait ? 15 : 18 });
  });
}

// ═════════════ la memoria no se ahorra ═════════════
export function updateMoe(S: Frame) {
  const st = (S.st.moe ??= { touched: false, last: Number(S.p.moeB ?? 1) });
  if (S.between('moe-memory', 'spec') && Number(S.p.moeB ?? 1) !== st.last) { st.touched = true; st.last = Number(S.p.moeB ?? 1); }
}
export function drawMoeMemory(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w');
  const st = (S.st.moe ??= { touched: false, last: 1 });
  const B = st.touched ? Math.round(Number(S.p.moeB ?? 1)) : Math.max(1, Math.round(1 + 15 * S.at('moe-memory', 1.0, 8.0, 'lin')));
  const hits = new Array(E).fill(0); for (let i = 0; i < B; i++) pick2(i).forEach((e) => hits[e]++);
  const touchedN = hits.filter((h) => h > 0).length, f = expertsTouched(B), total = (MP.shared + MP.expertsAll) * 2, read = (MP.shared + MP.expertsAll * f) * 2, denseRef = MP.active * 2;
  const ex: Rect = { x: A.x, y: A.y + 40 * u, w: A.w, h: S.portrait ? A.h * 0.3 : A.h * 0.24 }, bxs = expertBoxes(S, ex), exBottom = bxs[E - 1].y + bxs[E - 1].h;
  show(S, S.reveal('moe-memory', 0.1, 0.5), () => {
    fitText(S, S.l(`Una capa de Mixtral con ${B} ${B === 1 ? 'token' : 'tokens'} en el lote`, `One Mixtral layer with ${B} ${B === 1 ? 'token' : 'tokens'} in the batch`), A.x, A.y + 6 * u, A.w, 16, { weight: 800, base: 'top' });
    drawExperts(S, bxs, hits);
    tagText(S, S.l(`expertos consultados en esta capa: ${touchedN} de 8`, `experts consulted in this layer: ${touchedN} of 8`), A.x, exBottom + 12 * u, { t: 'w', align: 'left', base: 'top', w: A.w });
  });
  // pesos leídos por vuelta
  const by = exBottom + (S.portrait ? 68 : 88) * u, bh = clamp(A.h * 0.1, 30 * u, 48 * u), bw = A.w;
  show(S, S.reveal('moe-memory', 0.8, 0.6), () => {
    d.text(S.l('pesos que se leen en cada vuelta (FP16)', 'weights read on every turn (FP16)'), A.x, by - 10 * u, { size: FS(S, 14), weight: 700, color: p.ink, base: 'bottom' });
    d.rect(A.x, by, bw, bh, { fill: p.surface2, stroke: p.lineStrong, lw: 1.3 });
    d.rect(A.x, by, bw * (read / total), bh, { fill: wt.c });
    const xd = A.x + bw * (denseRef / total);
    d.line(xd, by - 6 * u, xd, by + bh + 6 * u, p.ink, 2, [4, 3]);
    d.text(`${gb(read, l, 0)}`, A.x + bw * (read / total) - 8 * u, by + bh / 2, { size: FS(S, 16), weight: 800, font: 'mono', color: p.stage, align: 'right', base: 'middle', a: read / total > 0.18 ? 1 : 0 });
    d.text(S.l(`solo 2 de 8: ${gb(denseRef, 'es', 0)}`, `only 2 of 8: ${gb(denseRef, 'en', 0)}`), xd + 6 * u, by + bh + 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top' });
    d.text(S.l(`todos: ${gb(total, 'es', 0)}`, `all of them: ${gb(total, 'en', 0)}`), A.x + bw, by + bh + 8 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.text(S.l(`esperado: ${nf(f * 100, 0, 'es')} % de los expertos`, `expected: ${nf(f * 100, 0, 'en')}% of the experts`), A.x, by + bh + 28 * u, { size: FS(S, 13), weight: 700, color: wt.ink, base: 'top' });
  });
  show(S, S.reveal('moe-memory', 1.0, 0.6), () => noteUp(S, S.l('ilustrativo: cada token elige sus dos expertos al azar y por igual', 'illustrative: each token picks its two experts at random, uniformly'), A.x, A.y + A.h - 2 * u, A.w));
}

// ═════════════ decodificación especulativa ═════════════
export function drawSpec(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), wt = tone(S, 'w'), lt = tone(S, 'lat'), dt = tone(S, 'dat'), er = tone(S, 'err');
  const draft = l === 'es' ? ['El', 'plazo', 'es', 'de', 'doce', 'años'] : ['The', 'term', 'is', 'twelve', 'years'], acc = l === 'es' ? 5 : 4, fix = l === 'es' ? 'meses' : 'months';
  const fs = FS(S, S.portrait ? 14 : 16), th = S.portrait ? 30 : 36, rowGap = clamp((A.h - 3 * th * u - 40 * u) / 3, 40 * u, 100 * u), y1 = A.y + 34 * u, y2 = y1 + th * u + rowGap, y3 = y2 + th * u + rowGap;
  const widths = draft.map((t) => tokW(S, t, fs)), gap = 8 * u, total = widths.reduce((a, b) => a + b, 0) + gap * (draft.length - 1), x0 = A.x + Math.max(0, (A.w - total) / 2);
  const xs: number[] = []; let x = x0; widths.forEach((w) => { xs.push(x); x += w + gap; });
  show(S, S.reveal('spec', 0.1, 0.5), () => tagText(S, S.l('1 · el modelo pequeño propone, rápido', '1 · the small model proposes, fast'), A.x, y1 - 14 * u, { t: 'mute', align: 'left', base: 'bottom', size: 14 }));
  draft.forEach((t, i) => { const a = S.reveal('spec', 0.7 + i * 0.35, 0.4); if (a > 0) token(S, xs[i], y1, t, { tone: 'mute', size: fs, h: th, a }); });
  const aV = S.reveal('spec', 3.6, 0.6);
  show(S, aV, () => {
    d.rect(x0 - 6 * u, y2 - 4 * u, total + 12 * u, th * u + 8 * u, { fill: alpha(wt.c, 0.1), stroke: wt.c, lw: 1.6, r: 4 });
    draft.forEach((t, i) => {
      const ok = i < acc, cx = xs[i] + widths[i] / 2;
      d.line(cx, y1 + th * u, cx, y2 - 4 * u, alpha(wt.c, 0.5), 1.4);
      token(S, xs[i], y2, t, { tone: ok ? 'dat' : 'err', size: fs, h: th, a: ok ? 1 : 0.55 });
      if (!ok) d.line(xs[i], y2 + th * u / 2, xs[i] + widths[i], y2 + th * u / 2, er.c, 2.4);
      mark(S, cx, y2 + th * u + 16 * u, ok, { r: 7 });
    });
    tagText(S, S.l('2 · el modelo grande verifica todos de una pasada', '2 · the large model checks them all in one pass'), A.x, y2 - 14 * u, { t: 'w', align: 'left', base: 'bottom', size: 14 });   // al final: el halo tapa las líneas que lo cruzan
  });
  const aR = S.reveal('spec', 6.0, 0.7);
  show(S, aR, () => {
    tagText(S, S.l('3 · se conservan los aciertos y se corrige el primer fallo', '3 · the hits are kept and the first miss is corrected'), A.x, y3 - 14 * u, { t: 'dat', align: 'left', base: 'bottom', size: 14 });
    const all = [...draft.slice(0, acc), fix], ws = all.map((t) => tokW(S, t, fs));
    let xx = x0; all.forEach((t, i) => { token(S, xx, y3, t, { tone: i < acc ? 'dat' : 'lat', size: fs, h: th, active: i === acc ? 0.6 : 0 }); xx += ws[i] + gap; });
    tagText(S, S.l(`${all.length} tokens con una sola pasada del modelo grande`, `${all.length} tokens from a single pass of the large model`), A.x + A.w / 2, y3 + th * u + 22 * u, { t: 'ink', align: 'center', size: 15, w: A.w });
  });
  void p; void lt; void dt;
}

// ═════════════ resumen y puente ═════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S);
  const cards: { t: 'dat' | 'w' | 'lat' | 'sig'; title: string; sub: string }[] = [
    { t: 'dat', title: 'Prefill', sub: S.l('todo el mensaje, en paralelo', 'the whole message, in parallel') },
    { t: 'w', title: 'Decode', sub: S.l('un token por vuelta', 'one token per turn') },
    { t: 'lat', title: S.l('Caché KV', 'KV cache'), sub: S.l('memoria a cambio de no repetir trabajo', 'memory in exchange for no repeated work') },
    { t: 'sig', title: S.l('Ancho de banda', 'Bandwidth'), sub: S.l('manda en la velocidad y el costo', 'rules both speed and cost') },
  ];
  const gap = 22 * u, n = 4;
  const cw = S.portrait ? A.w : (A.w - gap * (n - 1)) / n, ch = S.portrait ? (A.h - gap * (n - 1)) / n : clamp(A.h * 0.5, 120 * u, 190 * u), y0 = S.portrait ? A.y : A.y + (A.h - ch) / 2;
  cards.forEach((c, i) => {
    const a = S.reveal('recap', 0.3 + i * 0.9, 0.6), r: Rect = S.portrait ? { x: A.x, y: y0 + i * (ch + gap), w: cw, h: ch } : { x: A.x + i * (cw + gap), y: y0, w: cw, h: ch }, col = tone(S, c.t);
    show(S, a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(col.c, 0.1), stroke: col.c, lw: 1.8, r: 4 });
      d.text(String(i + 1), r.x + 10 * u, r.y + 8 * u, { size: FS(S, 14), weight: 800, font: 'mono', color: col.ink, base: 'top' });
      d.text(c.title, r.x + r.w / 2, r.y + (S.portrait ? r.h * 0.34 : r.h * 0.32), { size: FS(S, S.portrait ? 18 : 22), weight: 800, color: col.ink, align: 'center', base: 'middle', w: r.w - 16 * u });
      d.text(c.sub, r.x + r.w / 2, r.y + (S.portrait ? r.h * 0.68 : r.h * 0.66), { size: FS(S, 14), weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w - 24 * u });
      if (i < n - 1) {
        const pa = S.reveal('recap', 0.8 + i * 0.9, 0.5);
        if (S.portrait) d.arrow(r.x + r.w / 2, r.y + r.h + 2 * u, r.x + r.w / 2, r.y + r.h + gap - 2 * u, alpha(p.ink, pa), 2, 8);
        else d.arrow(r.x + r.w + 3 * u, r.y + r.h / 2, r.x + r.w + gap - 3 * u, r.y + r.h / 2, alpha(p.ink, pa), 2, 8);
      }
    });
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cy - 18 * sc - 20 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 40 * u, { size: FS(S, 14), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Ajuste fino y LoRA', 'Fine-tuning and LoRA'), cx, cy + 76 * u, { size: FS(S, 26), weight: 800, align: 'center', w: S.W - 40 * u });
  });
  void clamp; void fitText;
}
