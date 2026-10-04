// Acto 7: búsqueda semántica. Diez artículos de ayuda como vectores, el promedio de palabras, el marcador de tres métodos con 36 preguntas,
// el tercer «Tu turno», el límite del promedio (el orden) y la evaluación con casos propios.
import { alpha, box, clamp, link, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DIM, cos, mean, parse, type Lg } from './vectors';
import { DOCS, MODEL, ORDER, QUERIES, board, docWords, firstIsRight, search, type Hit } from './search';
import { seOf, searchView } from './logic';
import { actAlpha, area, big, chip, cosBars, fit, fs, isTiny, lg, num, pct, strip, word } from './ui';

const Q0 = 4; // «quiero mi dinero de vuelta» ↔ «Reembolsos»
const wilson = (k: number, n: number, z = 1.96): [number, number] => { const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d, h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d; return [c - h, c + h]; };
const docVec = (S: Frame, id: string) => { const doc = DOCS.find((d) => d.id === id)!; return mean(docWords(doc, lg(S))); };
const METHODS = (S: Frame) => [
  { k: 'exact', label: S.l('palabras exactas', 'exact words'), tone: 'mute' as const },
  { k: 'avg', label: S.l('promedio de vectores', 'vector average'), tone: 'lat' as const },
  { k: 'modern', label: S.l('modelo de oraciones', 'sentence model'), tone: 'dat' as const },
];

// ═════════════ search-intro: los artículos como vectores ═════════════
export function drawSearchIntro(S: Frame) {
  const a = actAlpha(S, 'search-intro', 'search-avg'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S), lt = tone(S, 'lat'), dt = tone(S, 'dat'), sg = tone(S, 'sig');
  const q = QUERIES[Q0], res = search(q[L], L), best = res.semantic[0];
  d.withAlpha(a, () => {
    const cols = S.portrait ? 2 : 1, listW = S.portrait ? A.w : Math.min(A.w * 0.5, 440 * u), rows = Math.ceil(DOCS.length / cols);
    const listH = S.portrait ? A.h * 0.6 : A.h, rh = Math.min((tiny ? 26 : 38) * u, (listH - 4 * u) / rows), cw = (listW - (cols - 1) * 8 * u) / cols;
    DOCS.forEach((doc, k) => {
      const c = k % cols, r = Math.floor(k / cols), x = A.x + c * (cw + 8 * u), y = A.y + r * rh + (S.portrait ? 0 : (A.h - rows * rh) / 2);
      const ra = S.reveal('search-intro', 0.3 + k * 0.32, 0.5), isBest = S.on('search-intro') && S.since('search-intro') > 5.6 && doc.id === best.doc.id;
      d.withAlpha(ra, () => {
        d.rect(x, y, cw - 2, rh - 3 * u, { fill: isBest ? alpha(dt.c, 0.14) : p.surface, stroke: isBest ? dt.c : p.line, lw: isBest ? 2.4 : 1, r: 3 });
        const sw = Math.min(70 * u, cw * 0.34);
        d.text(fit(S, doc.title[L], cw - sw - 16 * u, fs(S, 12), 700), x + 6 * u, y + (rh - 3 * u) / 2, { size: fs(S, 12), weight: 700, color: p.ink, base: 'middle' });
        strip(S, { x: x + cw - sw - 8 * u, y: y + 3 * u, w: sw, h: rh - 9 * u }, docVec(S, doc.id), { tone: 'lat', a: clamp((S.since('search-intro') - 0.6 - k * 0.32) / 0.6) });
      });
    });
    // la pregunta, su vector y el artículo más cercano
    const R: Rect = S.portrait ? { x: A.x, y: A.y + listH + 8 * u, w: A.w, h: A.h - listH - 8 * u } : { x: A.x + listW + 24 * u, y: A.y, w: A.w - listW - 24 * u, h: A.h };
    const rq = S.reveal('search-intro', 4.2, 0.8);
    d.withAlpha(rq, () => {
      const y = R.y + (S.portrait ? 0 : R.h * 0.22);
      d.rect(R.x, y, R.w, (S.portrait ? 34 : 42) * u, { fill: p.surface, stroke: sg.c, lw: 1.5, r: 4 });
      d.text('«' + q[L] + '»', R.x + 10 * u, y + (S.portrait ? 17 : 21) * u, { size: fs(S, 14), weight: 700, color: sg.ink, base: 'middle', w: R.w - 20 * u });
      const sy = y + (S.portrait ? 40 : 52) * u;
      strip(S, { x: R.x, y: sy, w: Math.min(R.w, 300 * u), h: (S.portrait ? 24 : 40) * u }, mean(res.known), { tone: 'sig' });
      d.text(S.l('vector de la pregunta', 'question vector'), R.x, sy + (S.portrait ? 28 : 44) * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top' });
    });
    const rb = S.reveal('search-intro', 5.8, 0.8);
    d.withAlpha(rb, () => {
      const y = R.y + (S.portrait ? 0 : R.h * 0.22) + (S.portrait ? 88 : 112) * u;
      chip(S, S.l(`más cercano: ${best.doc.title[L]}`, `closest: ${best.doc.title[L]}`), R.x, y + 13 * u, { tone: 'dat', align: 'left', size: fs(S, 13), weight: 800 });
      d.text(S.l(`coseno ${num(S, best.score, 2)}`, `cosine ${num(S, best.score, 2)}`), R.x, y + 38 * u, { size: fs(S, 12), weight: 700, font: 'mono', color: dt.ink, base: 'top' });
    });
  });
  void lt;
}

// ═════════════ search-avg: promediar los vectores de las palabras ═════════════
export function drawSearchAvg(S: Frame) {
  const a = actAlpha(S, 'search-avg', 'search-board'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S), lt = tone(S, 'lat'), dt = tone(S, 'dat'), er = tone(S, 'err');
  const q = QUERIES[Q0], res = search(q[L], L), words: { w: string; known: boolean }[] = [];
  const rawWords = q[L].toLowerCase().match(/[\p{L}][\p{L}'’-]*/gu) ?? [];
  rawWords.forEach((w) => words.push({ w, known: res.knownWords.includes(w) }));
  d.withAlpha(a, () => {
    const colW = S.portrait ? A.w : Math.min(A.w * 0.5, 430 * u);
    let y = A.y + 2 * u;
    d.text(S.l('palabras de la pregunta', 'words of the question'), A.x, y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
    y += fs(S, 12) * u * 1.6;
    let x = A.x; const ch = 30 * u;
    words.forEach((wd, k) => {
      const ra = S.reveal('search-avg', 0.3 + k * 0.4, 0.5); if (ra <= 0) return;
      const b = chip(S, wd.w, x, y + ch / 2, { tone: wd.known ? 'lat' : undefined, align: 'left', size: fs(S, 14), a: wd.known ? ra : ra * 0.7, weight: wd.known ? 800 : 500 });
      if (!wd.known) d.withAlpha(ra * 0.9, () => d.line(b.x + 2, b.y + b.h - 2, b.x + b.w - 2, b.y + b.h - 2, p.mute, 1.5, [3, 2]));
      x += b.w + 6 * u; if (x > A.x + colW - 70 * u && k < words.length - 1) { x = A.x; y += ch + 4 * u; }
    });
    y += ch + 4 * u;
    d.withAlpha(S.reveal('search-avg', 2.2, 0.6), () => d.text(S.l('subrayadas: no están en el vocabulario y se ignoran', 'underlined: not in the vocabulary, so ignored'), A.x, y, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: colW }));
    y += fs(S, 11) * u * 2.6;
    const sa = S.reveal('search-avg', 3.2, 0.8);
    d.withAlpha(sa, () => {
      d.text(S.l('promedio de sus vectores', 'average of their vectors'), A.x, y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
      strip(S, { x: A.x, y: y + fs(S, 12) * u * 1.4, w: Math.min(colW, 330 * u), h: (S.portrait ? 30 : 46) * u }, mean(res.known), { tone: 'lat', reveal: clamp((S.since('search-avg') - 3.4) / 1.2) });
    });
    // la lista ordenada de artículos por coseno
    const R: Rect = S.portrait ? { x: A.x, y: y + fs(S, 12) * u * 1.4 + 40 * u, w: A.w, h: A.y + A.h - (y + fs(S, 12) * u * 1.4 + 40 * u) } : { x: A.x + colW + 24 * u, y: A.y, w: A.w - colW - 24 * u, h: A.h };
    const lr = S.reveal('search-avg', 4.6, 0.8);
    d.withAlpha(lr, () => {
      const n = Math.max(3, Math.min(res.semantic.length, S.portrait ? 4 : tiny ? 6 : 8)), rh = Math.min(28 * u, (R.h - fs(S, 13) * u * 1.8) / n);
      d.text(S.l('artículos más cercanos (coseno)', 'closest articles (cosine)'), R.x, R.y, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top', w: R.w });
      cosBars(S, { x: R.x, y: R.y + fs(S, 13) * u * 1.7, w: R.w, h: rh * n }, res.semantic.slice(0, n).map((h, k) => ({ label: fit(S, h.doc.title[L], R.w * 0.46, fs(S, 13), 700), value: h.score, hot: k === 0, tone: (h.doc.id === QUERIES[Q0].want ? 'dat' : 'lat') as 'dat' | 'lat', tag: h.doc.id === QUERIES[Q0].want ? '✓' : '' })), { rowH: rh });
    });
  });
  void dt; void er; void lt;
}

// ═════════════ search-board: tres métodos, 36 preguntas ═════════════
export function boardCells(S: Frame) {
  const L = lg(S);
  return QUERIES.map((q) => { const r = search(q[L], L); return { exact: firstIsRight(r.exact, q.want, true), avg: firstIsRight(r.semantic, q.want), modern: firstIsRight(r.modern, q.want) }; });
}
export function drawBoard(S: Frame) {
  const a = actAlpha(S, 'search-board', 'try3'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S);
  const cells = boardCells(S), b = board(L), M = METHODS(S);
  d.withAlpha(a, () => {
    d.text(S.l(`¿salió primero el artículo correcto? ${QUERIES.length} preguntas (escritas por mí; ilustrativas)`, `was the correct article first? ${QUERIES.length} questions (written by me; illustrative)`), A.x, A.y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: A.w });
    const lw = S.portrait ? 0 : Math.min(A.w * 0.2, 170 * u), cw = A.w - lw - 74 * u, cs = Math.min(cw / QUERIES.length, 22 * u), gw = cs * QUERIES.length;
    const lab = S.portrait ? fs(S, 13) * u * 1.5 : 0;
    const top = A.y + fs(S, 12) * u * (S.portrait ? 3.2 : 2) + 8 * u, rh = Math.min((S.portrait ? 84 : 96) * u, (A.h - (top - A.y) - 10 * u) / 3);
    M.forEach((m, k) => {
      const ra = S.reveal('search-board', 0.4 + k * 1.7, 0.7), y = top + k * rh + lab, t = tone(S, m.tone), hits = k === 0 ? b.exact : k === 1 ? b.avg : b.modern;
      d.withAlpha(ra, () => {
        if (S.portrait) d.text(m.label, A.x, y - lab + 2 * u, { size: fs(S, 13), weight: 800, color: t.ink, base: 'top' });
        else d.text(m.label, A.x + lw, y + cs / 2 + 2 * u, { size: fs(S, 13), weight: 800, color: t.ink, align: 'right', base: 'middle', w: lw });
        const gx = A.x + lw + (S.portrait ? 0 : 10 * u);
        QUERIES.forEach((_, i) => {
          const hit = k === 0 ? cells[i].exact : k === 1 ? cells[i].avg : cells[i].modern, x = gx + i * cs, c = clamp((S.since('search-board') - 0.6 - k * 1.7 - i * 0.02) / 0.3);
          if (c <= 0) return;
          if (hit) d.rect(x, y, cs - 2, cs - 2, { fill: t.c, a: c }); else d.rect(x + 0.5, y + 0.5, cs - 3, cs - 3, { stroke: p.lineStrong, lw: 1, a: c });
        });
        d.text(`${hits}/${QUERIES.length}`, gx + gw + 10 * u, y + cs / 2, { size: fs(S, 15), weight: 800, font: 'mono', color: t.ink, base: 'middle' });
        d.text(pct(S, hits / QUERIES.length), gx + gw + 10 * u, y + cs / 2 + fs(S, 15) * u * 1.15, { size: fs(S, 12), weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
      });
    });
    d.withAlpha(S.reveal('search-board', 5.4, 0.8), () => d.text(S.l('cuadro lleno = acierto · cuadro vacío = fallo', 'filled square = hit · empty square = miss'), A.x + lw + (S.portrait ? 0 : 10 * u), top + 3 * rh + lab - 2 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: A.w - lw }));
  });
  void tiny;
}

// ═════════════ try3: tu pregunta, tres métodos ═════════════
export function drawTry3(S: Frame) {
  const a = actAlpha(S, 'try3', 'order'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S), sg = tone(S, 'sig'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const v = searchView(S), st = seOf(S), M = METHODS(S), want = v.res.caseIndex >= 0 ? QUERIES[v.res.caseIndex].want : null;
  d.withAlpha(a, () => {
    // la pregunta
    const qh = 32 * u;
    d.rect(A.x, A.y, A.w, qh, { fill: p.surface, stroke: sg.c, lw: 1.5, r: 4 });
    d.text(v.text.trim() ? '«' + v.text.trim() + '»' : S.l('escribe una pregunta', 'type a question'), A.x + 10 * u, A.y + qh / 2, { size: fs(S, 14), weight: 700, color: v.text.trim() ? sg.ink : p.mute, base: 'middle', w: A.w - 20 * u });
    const lists: { hits: Hit[] | null; fmt: (h: Hit) => string; note?: string; zero?: boolean }[] = [
      { hits: v.res.exact.some((h) => h.score > 0) ? v.res.exact.filter((h) => h.score > 0) : null, fmt: (h) => S.l(`${h.score} pal.`, `${h.score} wd.`), note: S.l('sin coincidencias: ninguna palabra en común', 'no match: no word in common'), zero: true },
      { hits: v.res.semantic.length ? v.res.semantic : null, fmt: (h) => num(S, h.score, 2), note: S.l('ninguna palabra conocida', 'no known word') },
      { hits: v.res.modern, fmt: (h) => num(S, h.score, 2), note: S.l('solo calculado para las preguntas de la lista', 'only computed for the listed questions') },
    ];
    const y0 = A.y + qh + 8 * u, hasProg = true, progH = fs(S, 12) * u * 2.9;
    const bodyH = A.y + A.h - y0 - (hasProg ? progH : 0);
    const nShow = S.portrait ? 3 : tiny ? 3 : 5;
    lists.forEach((l, k) => {
      const t = tone(S, M[k].tone);
      const boxH = 12 * u + fs(S, 12) * u * 1.5 + nShow * (tiny ? 34 : 40) * u, x = S.portrait ? A.x : A.x + k * ((A.w + 10 * u) / 3), w = S.portrait ? A.w : (A.w - 20 * u) / 3, y = S.portrait ? y0 + k * (bodyH / 3) : y0, h = S.portrait ? bodyH / 3 - 3 * u : Math.min(bodyH, boxH);
      d.rect(x, y, w, h, { fill: alpha(t.c, 0.05), stroke: alpha(t.c, 0.6), lw: 1, r: 3 });
      d.text(M[k].label, x + 8 * u, y + 5 * u, { size: fs(S, 12), weight: 800, color: t.ink, base: 'top' });
      const hy = y + 5 * u + fs(S, 12) * u * 1.5;
      if (!l.hits) { d.text(l.note ?? '', x + 8 * u, hy + 2 * u, { size: fs(S, 12), weight: 700, color: l.zero ? er.ink : p.mute, base: 'top', w: w - 16 * u }); return; }
      const rh = Math.min(S.portrait ? 18 * u : (tiny ? 34 : 40) * u, (y + h - hy - 2 * u) / nShow);
      l.hits.slice(0, nShow).forEach((h2, i) => {
        const yy = hy + i * rh, right = want && h2.doc.id === want, zero = false;
        const sc = l.fmt(h2), scW = d.measure(sc, { size: fs(S, 11), weight: 700, font: 'mono' }) + 6 * u, mark = right ? '✓ ' : '';
        d.text(String(i + 1), x + 8 * u, yy + rh / 2, { size: fs(S, 11), weight: 800, color: i === 0 ? p.ink : p.mute, base: 'middle', font: 'mono' });
        const title = mark + h2.doc.title[L];
        if (S.portrait) d.text(fit(S, title, w - 28 * u - scW - 8 * u, fs(S, 12), i === 0 ? 800 : 600), x + 22 * u, yy + rh / 2, { size: fs(S, 12), weight: i === 0 ? 800 : 600, color: right ? dt.ink : zero ? p.mute : p.ink, base: 'middle' });
        else d.text(title, x + 22 * u, yy + rh / 2, { size: fs(S, 12), weight: i === 0 ? 800 : 600, color: right ? dt.ink : zero ? p.mute : p.ink, base: 'middle', w: w - 30 * u - scW, lh: 1.05 });
        d.text(sc, x + w - 6 * u, yy + rh / 2, { size: fs(S, 11), weight: 700, font: 'mono', color: zero ? er.ink : p.ink2, align: 'right', base: 'middle' });
      });
    });
    // progreso del turno
    const prog = [S.l(`preguntas distintas: ${Math.min(3, st.seen.length)} de 3`, `different questions: ${Math.min(3, st.seen.length)} of 3`), S.l(`la búsqueda por palabras sin resultado: ${st.zero ? 'vista' : 'falta'}`, `the word search with no result: ${st.zero ? 'seen' : 'missing'}`)];
    const py = S.portrait ? A.y + A.h - progH + 2 * u : Math.min(A.y + A.h - progH + 2 * u, y0 + 12 * u + fs(S, 12) * u * 1.5 + nShow * (tiny ? 34 : 40) * u + 10 * u);
    prog.forEach((t, k) => d.text(t, A.x, py + k * fs(S, 12) * u * 1.4, { size: fs(S, 12), weight: 700, color: (k === 0 ? st.seen.length >= 3 : st.zero) ? dt.ink : p.mute, base: 'top' }));
    if (v.res.unknown.length && v.text.trim() && !tiny) d.text(S.l(`ignoradas: ${v.res.unknown.slice(0, 4).join(', ')}`, `ignored: ${v.res.unknown.slice(0, 4).join(', ')}`), A.x + A.w, py, { size: fs(S, 11), weight: 600, color: p.mute, align: 'right', base: 'top' });
  });
  void big;
}

// ═════════════ order: el promedio ignora el orden ═════════════
export function drawOrder(S: Frame) {
  const a = actAlpha(S, 'order', 'measure'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S), lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const sents = [ORDER.a[L], ORDER.b[L]], vs = sents.map((t) => mean(parse(t, L as Lg).ids));
  let dot = 0, n1 = 0, n2 = 0; for (let k = 0; k < DIM; k++) { dot += vs[0][k] * vs[1][k]; n1 += vs[0][k] ** 2; n2 += vs[1][k] ** 2; }
  const c = dot / Math.sqrt(n1 * n2);
  d.withAlpha(a, () => {
    const gap = 18 * u, cw = S.portrait ? A.w : (A.w - gap) / 2, ch = S.portrait ? (A.h * 0.5 - gap) / 2 : Math.min(A.h * 0.42, 190 * u);
    sents.forEach((t, k) => {
      const r: Rect = S.portrait ? { x: A.x, y: A.y + k * (ch + gap / 2), w: cw, h: ch } : { x: A.x + k * (cw + gap), y: A.y + 4 * u, w: cw, h: ch };
      d.withAlpha(S.reveal('order', 0.3 + k * 1.2, 0.7), () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: lt.c, lw: 1.5, r: 4 });
        d.text('«' + t + '»', r.x + 10 * u, r.y + 10 * u, { size: fs(S, S.portrait ? 15 : 20), weight: 800, color: p.ink, base: 'top', w: r.w - 20 * u });
        const sh = Math.min((S.portrait ? 26 : 60) * u, r.h - 60 * u);
        strip(S, { x: r.x + 10 * u, y: r.y + r.h - sh - 10 * u, w: r.w - 20 * u, h: sh }, vs[k], { tone: 'lat', reveal: clamp((S.since('order') - 0.8 - k * 1.2) / 1) });
        d.text(S.l('promedio de sus palabras', 'average of its words'), r.x + 10 * u, r.y + r.h - sh - 12 * u - fs(S, 11) * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top' });
      });
    });
    const y1 = S.portrait ? A.y + 2 * ch + gap : A.y + ch + 26 * u;
    d.withAlpha(S.reveal('order', 3.2, 0.8), () => {
      d.text(S.l('coseno entre los dos vectores', 'cosine between the two vectors'), A.x, y1, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
      const bigSz = S.portrait ? 28 : 46, nw = d.measure(num(S, c, 2), { size: bigSz, weight: 800, font: 'mono' }) + 14 * u;
      d.text(num(S, c, 2), A.x, y1 + fs(S, 12) * u * 1.4, { size: bigSz, weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top' });
      d.text(S.l('las mismas palabras, otro significado: el vector no lo distingue', 'same words, different meaning: the vector cannot tell'), A.x + nw, y1 + fs(S, 12) * u * 1.4 + 6 * u, { size: fs(S, 12), weight: 700, color: p.ink2, base: 'top', w: A.w - nw });
    });
    const y2 = y1 + (S.portrait ? 74 : 104) * u;
    d.withAlpha(S.reveal('order', 6.4, 0.9), () => {
      if (y2 + 44 * u > A.y + A.h) return;
      const bw = Math.min(A.w, 560 * u), bx = A.x, bh = 40 * u;
      const r1: Rect = { x: bx, y: y2, w: bw * 0.52, h: bh }, r2: Rect = { x: bx + bw * 0.62, y: y2, w: bw * 0.38, h: bh };
      box(S, r1, S.l('modelo de oraciones (atención)', 'sentence model (attention)'), { tone: 'dat', size: fs(S, 12) });
      box(S, r2, S.l('384 números', '384 numbers'), { tone: 'lat', size: fs(S, 12), font: 'mono' });
      link(S, r1, r2, { tone: 'ink' });
    });
  });
  void tiny; void dt;
}

// ═════════════ measure: la evaluación con casos propios ═════════════
export function drawMeasure(S: Frame) {
  const a = actAlpha(S, 'measure', 'recap'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S), tiny = isTiny(S), dt = tone(S, 'dat');
  const b = board(L), M = METHODS(S), n = QUERIES.length, hits = [b.exact, b.avg, b.modern];
  d.withAlpha(a, () => {
    const colW = S.portrait ? A.w : Math.min(A.w * 0.56, 480 * u), lw = Math.min(colW * 0.34, 150 * u), bx = A.x + lw + 8 * u, bw = colW - lw - 8 * u - 56 * u;
    d.text(S.l(`aciertos con intervalo de confianza del 95 % (n = ${n})`, `hits with a 95% confidence interval (n = ${n})`), A.x, A.y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: colW });
    const top = A.y + fs(S, 12) * u * (S.portrait ? 3.2 : 2.2), rh = Math.min((S.portrait ? 52 : 92) * u, (A.h * (S.portrait ? 0.5 : 0.78)) / 3);
    M.forEach((m, k) => {
      const ra = S.reveal('measure', 0.4 + k * 0.9, 0.7), y = top + k * rh, t = tone(S, m.tone), f = hits[k] / n, [lo, hi] = wilson(hits[k], n);
      d.withAlpha(ra, () => {
        d.text(m.label, A.x + lw, y + rh * 0.4, { size: fs(S, 13), weight: 800, color: t.ink, align: 'right', base: 'middle', w: lw });
        d.rect(bx, y + rh * 0.18, bw, rh * 0.44, { fill: p.surface2 });
        d.rect(bx, y + rh * 0.18, bw * f, rh * 0.44, { fill: alpha(t.c, 0.7) });
        const x0 = bx + bw * lo, x1 = bx + bw * hi, ym = y + rh * 0.4;
        d.line(x0, ym, x1, ym, p.ink, 2.2); d.line(x0, ym - 7 * u, x0, ym + 7 * u, p.ink, 2.2); d.line(x1, ym - 7 * u, x1, ym + 7 * u, p.ink, 2.2);
        d.text(pct(S, f), bx + bw + 8 * u, ym, { size: fs(S, 14), weight: 800, font: 'mono', color: t.ink, base: 'middle' });
        d.text(`${pct(S, lo)} – ${pct(S, hi)}`, bx + bw * 0.5, y + rh * 0.66 + 2 * u, { size: fs(S, 11), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
      });
    });
    // lista de pasos para armar una evaluación propia
    const steps = [S.l('Reúne unas decenas de preguntas reales.', 'Gather a few dozen real questions.'), S.l('Marca el documento correcto de cada una.', 'Mark the correct document for each.'), S.l('Cuenta cuántas veces sale primero (o entre los cinco primeros).', 'Count how often it comes first (or in the top five).'), S.l('Compara las opciones con las mismas preguntas.', 'Compare the options on the same questions.')];
    const R: Rect = S.portrait ? { x: A.x, y: top + 3 * rh + 8 * u, w: A.w, h: A.y + A.h - (top + 3 * rh + 8 * u) } : { x: A.x + colW + 28 * u, y: A.y, w: A.w - colW - 28 * u, h: A.h };
    d.withAlpha(S.reveal('measure', 3.4, 0.8), () => {
      d.text(S.l('tu evaluación', 'your evaluation'), R.x, R.y + (S.portrait ? 0 : R.h * 0.12), { size: fs(S, 14), weight: 800, color: dt.ink, base: 'top' });
      let y = R.y + (S.portrait ? 0 : R.h * 0.12) + fs(S, 14) * u * 1.6;
      steps.slice(0, S.portrait || tiny ? 3 : 4).forEach((t, k) => {
        const ra = S.reveal('measure', 3.8 + k * 0.9, 0.6);
        d.withAlpha(ra, () => { d.circle(R.x + 9 * u, y + fs(S, 12) * u * 0.7, 9 * u, { fill: alpha(dt.c, 0.18), stroke: dt.c, lw: 1.5 }); d.text(String(k + 1), R.x + 9 * u, y + fs(S, 12) * u * 0.7, { size: fs(S, 11), weight: 800, color: dt.ink, align: 'center', base: 'middle' });
          const h = d.text(t, R.x + 26 * u, y, { size: fs(S, 12), weight: 600, color: p.ink, base: 'top', w: R.w - 28 * u }).h; y += Math.max(h, 20 * u) + 6 * u; });
      });
    });
  });
  void tiny; void MODEL;
}
