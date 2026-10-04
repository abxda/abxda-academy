// Acto 5: la aritmética de significados, con sus matices (excluir las palabras de entrada, aciertos medidos) y el segundo «Tu turno».
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import AN from './data/analogy-eval.json';
import { DIM, V, combine, idOf, nearestTo } from './vectors';
import { arOf, arithView } from './logic';
import { actAlpha, area, big, chip, cosBars, fit, fs, isTiny, num, pca2, pct, placeLabels, strip, word, type LabelItem, type Pca2 } from './ui';

const ids = (ks: string[]) => ks.map(idOf);
const row = (i: number) => V.subarray(i * DIM, (i + 1) * DIM);
const WORDS_OFF = ids(['france', 'paris', 'germany', 'berlin', 'japan', 'tokyo', 'egypt', 'cairo']);   // 4 de los 19 pares: elegidos para que las flechas no se crucen
const CAP19 = [['france', 'paris'], ['italy', 'rome'], ['spain', 'madrid'], ['germany', 'berlin'], ['japan', 'tokyo'], ['china', 'beijing'], ['russia', 'moscow'], ['england', 'london'], ['canada', 'ottawa'], ['greece', 'athens'], ['egypt', 'cairo'], ['portugal', 'lisbon'], ['sweden', 'stockholm'], ['norway', 'oslo'], ['cuba', 'havana'], ['colombia', 'bogota'], ['ecuador', 'quito'], ['venezuela', 'caracas'], ['uruguay', 'montevideo']].map(([a, b]) => [idOf(a), idOf(b)] as [number, number]);
let capStats: { mean: number; min: number; max: number; n: number } | null = null;
const getCap = () => (capStats ??= (() => { const c: number[] = []; for (let i = 0; i < CAP19.length; i++) for (let j = i + 1; j < CAP19.length; j++) c.push(offCos(CAP19[i][0], CAP19[i][1], CAP19[j][0], CAP19[j][1])); return { mean: c.reduce((s, x) => s + x, 0) / c.length, min: Math.min(...c), max: Math.max(...c), n: c.length }; })());
const WORDS_GEN = ids(['man', 'woman', 'king', 'queen']);
let pcaOff: Pca2 | null = null, pcaGen: Pca2 | null = null;
const getOff = () => (pcaOff ??= pca2(WORDS_OFF.map(row), [[0, 1], [2, 3], [4, 5], [6, 7]]));
const getGen = () => (pcaGen ??= pca2(WORDS_GEN.map(row), [[1, 0]]));
const offCos = (a: number, a2: number, b: number, b2: number) => { let s = 0, x = 0, y = 0; for (let k = 0; k < DIM; k++) { const p = V[a2 * DIM + k] - V[a * DIM + k], q = V[b2 * DIM + k] - V[b * DIM + k]; s += p * q; x += p * p; y += q * q; } return s / Math.sqrt(x * y); };
const noApple = (s: string) => s.replace(' (apple)', '');

interface Fit { X: (x: number) => number; Y: (y: number) => number }
function fitPlane(R: Rect, pts: [number, number][], pad: number): Fit {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const sc = Math.min((R.w - 2 * pad) / (x1 - x0 || 1), (R.h - 2 * pad) / (y1 - y0 || 1)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return { X: (x) => R.x + R.w / 2 + (x - cx) * sc, Y: (y) => R.y + R.h / 2 - (y - cy) * sc };
}
function layout(S: Frame) {
  const A = area(S), u = S.u;
  if (S.portrait) { const h = Math.min(A.h * 0.5, A.w); return { fig: { x: A.x + (A.w - h) / 2, y: A.y, w: h, h }, side: { x: A.x, y: A.y + h + 8 * u, w: A.w, h: A.h - h - 8 * u } }; }
  const s = Math.min(A.h, A.w * 0.52);
  return { fig: { x: A.x, y: A.y + (A.h - s) / 2, w: s, h: s }, side: { x: A.x + s + 20 * u, y: A.y, w: A.w - s - 20 * u, h: A.h } };
}

// ═════════════ offset · calc · exclude ═════════════
export function drawArith(S: Frame) {
  const a = actAlpha(S, 'offset', 'limits'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, { fig, side } = layout(S), tiny = isTiny(S);
  const lt = tone(S, 'lat'), sg = tone(S, 'sig'), er = tone(S, 'err');
  d.withAlpha(a, () => {
    d.rect(fig.x, fig.y, fig.w, fig.h, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 1.2, r: 3 });
    const gen = S.on('calc');
    // ─── offset: país → capital, cuatro flechas casi paralelas ───
    const kOff = 1 - S.at('calc', 0, 0.5, 'out');
    if (kOff > 0.01) d.withAlpha(kOff, () => {
      const P = getOff(), F = fitPlane(fig, P.pts, 34 * u);
      for (let k = 0; k < 4; k++) {
        const a0 = P.pts[2 * k], b0 = P.pts[2 * k + 1], ra = S.reveal('offset', 0.4 + k * 1.1, 0.7);
        if (ra <= 0) continue;
        d.withAlpha(ra, () => {
          d.arrow(F.X(a0[0]), F.Y(a0[1]), F.X(a0[0]) + (F.X(b0[0]) - F.X(a0[0])) * ra, F.Y(a0[1]) + (F.Y(b0[1]) - F.Y(a0[1])) * ra, sg.c, 2.6, 9);
          [2 * k, 2 * k + 1].forEach((j) => { d.circle(F.X(P.pts[j][0]), F.Y(P.pts[j][1]), 4.5 * u, { fill: lt.c, stroke: p.stage, lw: 1.5 }); });
        });
      }
      const items: LabelItem[] = WORDS_OFF.map((i, j) => ({ x: F.X(P.pts[j][0]), y: F.Y(P.pts[j][1]), r: 5 * u, text: word(S, i), prio: 10 - j, color: j % 2 ? p.ink : lt.ink, weight: j % 2 ? 800 : 700, size: fs(S, 13) }));
      d.withAlpha(S.reveal('offset', 1.2, 1), () => placeLabels(S, items, { x: fig.x + 3, y: fig.y + 26 * u, w: fig.w - 6, h: fig.h - 28 * u }, []));
      chip(S, S.l(`proyección PCA · ${pct(S, P.explained)} de la varianza`, `PCA projection · ${pct(S, P.explained)} of the variance`), fig.x + 8 * u, fig.y + 14 * u, { tone: 'err', align: 'left', size: fs(S, 11) });
      const R = side, aR = S.reveal('offset', 4.4, 0.8), cs = getCap();
      d.withAlpha(aR, () => {
        const y0 = R.y + (S.portrait ? 0 : R.h * 0.14);
        d.text(S.l('¿cuánto se parecen los desplazamientos país → capital?', 'how alike are the country → capital offsets?'), R.x, y0, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top', w: R.w });
        const y = y0 + (S.portrait ? 34 : 48) * u;
        d.text(num(S, cs.mean, 2), R.x, y, { size: S.portrait ? 26 : 40, weight: 800, font: 'mono', color: sg.ink, base: 'top' });
        d.text(S.l(`coseno medio entre los ${cs.n} pares de desplazamientos de ${CAP19.length} países; de ${num(S, cs.min, 2)} a ${num(S, cs.max, 2)}`, `mean cosine over the ${cs.n} pairs of offsets of ${CAP19.length} countries; from ${num(S, cs.min, 2)} to ${num(S, cs.max, 2)}`), R.x + (S.portrait ? 74 : 0) * u, y + (S.portrait ? 2 : 48) * u, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'top', w: R.w - (S.portrait ? 74 : 0) * u });
        if (!S.portrait && !tiny) d.text(S.l('Se dibujan cuatro países, elegidos para que las flechas no se crucen.', 'Four countries are drawn, chosen so the arrows do not cross.'), R.x, y + 112 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: R.w });
      });
    });
    // ─── calc / exclude: rey − hombre + mujer ───
    if (gen) {
      const kGen = S.at('calc', 0, 0.6, 'out');
      d.withAlpha(kGen, () => {
        const P = getGen(), [man, woman, king, queen] = WORDS_GEN;
        const v = combine([{ i: king, sign: 1 }, { i: man, sign: -1 }, { i: woman, sign: 1 }]), rp = P.project(v);
        const F = fitPlane(fig, [...P.pts, rp], 38 * u);
        const pt = (i: number): [number, number] => { const q = P.pts[WORDS_GEN.indexOf(i)]; return [F.X(q[0]), F.Y(q[1])]; };
        const [mx, my] = pt(man), [wx, wy] = pt(woman), [kx, ky] = pt(king), [qx, qy] = pt(queen), rx = F.X(rp[0]), ry = F.Y(rp[1]);
        const rv = (s: number, dl = 0, du = 0.7) => S.reveal('calc', dl + s, du);
        d.withAlpha(rv(0), () => { d.arrow(mx, my, mx + (wx - mx) * rv(0.6), my + (wy - my) * rv(0.6), sg.c, 2.8, 9); });
        d.withAlpha(rv(2.2), () => { const t = rv(2.2); d.arrow(kx, ky, kx + (rx - kx) * t, ky + (ry - ky) * t, sg.c, 2.8, 9); });
        [man, woman, king, queen].forEach((i) => { const [x, y] = pt(i); d.circle(x, y, 5 * u, { fill: lt.c, stroke: p.stage, lw: 1.5 }); });
        d.withAlpha(rv(3.6), () => { d.line(rx - 7 * u, ry - 7 * u, rx + 7 * u, ry + 7 * u, er.c, 3); d.line(rx - 7 * u, ry + 7 * u, rx + 7 * u, ry - 7 * u, er.c, 3); });
        const items: LabelItem[] = [man, woman, king, queen].map((i) => ({ x: pt(i)[0], y: pt(i)[1], r: 5 * u, text: word(S, i), prio: 20, color: p.ink, weight: 800, size: fs(S, 14) }));
        placeLabels(S, items, { x: fig.x + 3, y: fig.y + 26 * u, w: fig.w - 6, h: fig.h - 28 * u }, []);
        d.withAlpha(rv(3.6), () => d.text(S.l('rey − hombre + mujer', 'king − man + woman'), rx, ry + (ry > fig.y + fig.h * 0.7 ? -14 : 16) * u, { size: fs(S, 12), weight: 800, color: er.ink, align: rx > fig.x + fig.w * 0.6 ? 'right' : 'center', base: 'middle', halo: p.stage, haloW: 4 }));
        chip(S, S.l(`proyección PCA · ${pct(S, P.explained)} de la varianza`, `PCA projection · ${pct(S, P.explained)} of the variance`), fig.x + 8 * u, fig.y + 14 * u, { tone: 'err', align: 'left', size: fs(S, 11) });
        // listas de vecinos del vector resultado
        const excl = nearestTo(v, 5, [king, man, woman]), incl = nearestTo(v, 5), R = side;
        const kEx = S.on('exclude') ? S.at('exclude', 0, 0.6, 'out') : 0;
        const rowH = Math.min(24 * u, S.portrait ? 19 * u : 26 * u), th = fs(S, 13) * u * (R.w < 300 ? 1.9 : 1.45), n = S.portrait ? 3 : 5;
        const block = (y: number, title: string, rows: { label: string; value: number; hot: boolean; tone: 'lat' | 'err'; tag?: string }[]) => {
          d.text(title, R.x, y, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top', w: R.w });
          cosBars(S, { x: R.x, y: y + th, w: R.w, h: rowH * n }, rows, { rowH });
        };
        const yA = R.y + (S.portrait ? 0 : 6 * u), yB = yA + th + rowH * n + 12 * u, both = kEx > 0.01;
        const inputs = [king, man, woman];
        d.withAlpha(S.reveal('calc', 4.4, 0.7), () => block(both ? yB : yA, S.l('más cercanas, sin contar las tres escritas', 'closest, not counting the three typed'), excl.slice(0, n).map((q, k) => ({ label: noApple(word(S, q.i)), value: q.s, hot: k === 0, tone: 'lat' as const }))));
        if (both) d.withAlpha(kEx, () => block(yA, S.l('más cercanas, sin excluir nada', 'closest, excluding nothing'), incl.slice(0, n).map((q, k) => ({ label: noApple(word(S, q.i)), value: q.s, hot: k === 0, tone: (inputs.includes(q.i) ? 'err' : 'lat') as 'err' | 'lat', tag: inputs.includes(q.i) ? S.l('← entrada', '← input') : '' }))));
      });
    }
  });
  void chip; void clamp;
}

// ═════════════ limits: cuántas aciertos, medidos ═════════════
export function drawLimits(S: Frame) {
  const a = actAlpha(S, 'limits', 'try2'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S);
  const FV = AN.full_vocab, lt = tone(S, 'lat'), wt = tone(S, 'w');
  const rows = [
    { l: S.l('capital → país', 'capital → country'), n: S.l(`${FV.capitals.questions} preguntas`, `${FV.capitals.questions} questions`), v: FV.capitals.correct_excluding / FV.capitals.questions, v2: FV.capitals.correct_including / FV.capitals.questions, c: FV.capitals.correct_excluding, tn: 'lat' as const },
    { l: S.l('pares de género', 'gender pairs'), n: S.l(`${FV.gender.questions} preguntas`, `${FV.gender.questions} questions`), v: FV.gender.correct_excluding / FV.gender.questions, v2: FV.gender.correct_including / FV.gender.questions, c: FV.gender.correct_excluding, tn: 'lat' as const },
    { l: S.l('Mikolov et al.: su mejor modelo', 'Mikolov et al.: their best model'), n: S.l(`${big(S, 19544)} preguntas variadas`, `${big(S, 19544)} mixed questions`), v: 0.656, v2: -1, c: -1, tn: 'w' as const },
  ];
  d.withAlpha(a, () => {
    const lw = Math.min(A.w * (S.portrait ? 0.4 : 0.3), 230 * u), bx = A.x + lw + 10 * u, bw = A.w - lw - 10 * u - 66 * u;
    const rh = Math.min(S.portrait ? 84 * u : 108 * u, (A.h - 80 * u) / 3), y0 = A.y + (tiny ? 4 : 14) * u;
    d.text(S.l('aciertos con exclusión de las palabras de entrada', 'hits with the input words excluded'), A.x, A.y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: A.w });
    const total = 3 * rh + 40 * u, y1 = A.y + fs(S, 12) * u * 1.4 + Math.max(0, (A.h - total - 30 * u) / 2);
    rows.forEach((r, k) => {
      const ra = S.reveal('limits', 0.4 + k * 1.2, 0.8), y = y1 + 8 * u + k * rh;
      d.withAlpha(ra, () => {
        const th = d.text(r.l, A.x + lw, y + 2 * u, { size: fs(S, 14), weight: 800, color: p.ink, align: 'right', base: 'top', w: lw }).h;
        d.text(r.n, A.x + lw, y + 4 * u + th, { size: fs(S, 12), weight: 600, color: p.mute, align: 'right', base: 'top' });
        const t = r.tn === 'w' ? wt : lt;
        d.rect(bx, y + rh * 0.12, bw, rh * 0.42, { fill: p.surface2 });
        d.rect(bx, y + rh * 0.12, bw * r.v * ra, rh * 0.42, { fill: t.c });
        d.text(pct(S, r.v, 1), bx + bw + 8 * u, y + rh * 0.33, { size: fs(S, 14), weight: 800, font: 'mono', color: t.ink, base: 'middle' });
        if (r.v2 >= 0) { const x = bx + bw * r.v2; d.line(x, y + rh * 0.06, x, y + rh * 0.6, p.ink, 2.4); d.text(S.l('sin excluir ', 'not excluding ') + pct(S, r.v2, 0), x, y + rh * 0.62, { size: fs(S, 11), weight: 700, color: p.ink2, align: x > bx + bw * 0.6 ? 'right' : 'left', base: 'top' }); }
      });
    });
    d.withAlpha(S.reveal('limits', 4.2, 0.8), () => {
      const y = y1 + 8 * u + 3 * rh + 4 * u;
      d.text(S.l(`GloVe eligiendo entre ${big(S, 400000)} palabras; con solo las 880 de la lección sería más fácil: ${pct(S, AN.capitals.correct_excluding / AN.capitals.questions)} y ${pct(S, AN.gender.correct_excluding / AN.gender.questions)}.`, `GloVe choosing among ${big(S, 400000)} words; with only the lesson’s 880 it would be easier: ${pct(S, AN.capitals.correct_excluding / AN.capitals.questions)} and ${pct(S, AN.gender.correct_excluding / AN.gender.questions)}.`), A.x, y, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: A.w });
    });
  });
}

// ═════════════ try2: tu propia operación ═════════════
export function drawTry2(S: Frame) {
  const a = actAlpha(S, 'try2', 'bias-intro'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S);
  const v = arithView(S), st = arOf(S), sg = tone(S, 'sig'), lt = tone(S, 'lat'), er = tone(S, 'err');
  const excl = S.p.excl !== false;
  d.withAlpha(a, () => {
    const colW = S.portrait ? A.w : Math.min(A.w * 0.46, 400 * u);
    // la expresión, escrita con las palabras que entendió
    let y = A.y + 4 * u;
    d.text(S.l('tu operación', 'your operation'), A.x, y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
    y += fs(S, 12) * u * 1.5;
    if (v.terms.length) {
      let x = A.x; const ch = 30 * u;
      v.terms.forEach((t, k) => {
        const sign = k === 0 ? (t.sign > 0 ? '' : '− ') : t.sign > 0 ? '+ ' : '− ', txt = sign + noApple(word(S, t.i));
        const b = chip(S, txt, x, y + ch / 2, { tone: t.sign > 0 ? 'lat' : 'err', align: 'left', size: fs(S, 14), weight: 800 });
        x += b.w + 6 * u; if (x > A.x + colW - 40 * u && k < v.terms.length - 1) { x = A.x; y += ch + 6 * u; }
      });
      chip(S, '= ?', x, y + ch / 2, { align: 'left', size: fs(S, 14), mono: true, weight: 800 });
      y += ch + 10 * u;
    } else { d.text(S.l('Escribe, por ejemplo: rey - hombre + mujer', 'Type, for example: king - man + woman'), A.x, y, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'top', w: colW }); y += 40 * u; }
    if (v.bad.length) { d.text(S.l(`No conozco: ${v.bad.join(', ')}.`, `I do not know: ${v.bad.join(', ')}.`), A.x, y, { size: fs(S, 12), weight: 700, color: er.ink, base: 'top', w: colW }); y += fs(S, 12) * u * 1.5; }
    if (st.src === 'typed' && !v.valid && !v.bad.length && String(S.p.expr ?? '').trim()) { d.text(S.l('Usa al menos dos palabras con + o −.', 'Use at least two words with + or −.'), A.x, y, { size: fs(S, 12), weight: 700, color: er.ink, base: 'top', w: colW }); y += fs(S, 12) * u * 1.5; }
    // el vector resultado
    if (v.valid && !tiny) {
      const vec = combine(v.terms);
      d.text(S.l('vector resultado (cien números)', 'result vector (a hundred numbers)'), A.x, y, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top' });
      strip(S, { x: A.x, y: y + fs(S, 11) * u * 1.4, w: Math.min(colW, 330 * u), h: (S.portrait ? 26 : 40) * u }, vec, { tone: 'sig' });
      y += fs(S, 11) * u * 1.4 + (S.portrait ? 30 : 46) * u;
    }
    // progreso del turno
    const prog = [S.l(`operaciones distintas: ${Math.min(2, st.seen.length)} de 2`, `different operations: ${Math.min(2, st.seen.length)} of 2`), S.l(`con exclusión: ${st.on ? 'visto' : 'falta'} · sin exclusión: ${st.off ? 'visto' : 'falta'}`, `excluded: ${st.on ? 'seen' : 'missing'} · not excluded: ${st.off ? 'seen' : 'missing'}`)];
    const py = S.portrait ? A.y + A.h - fs(S, 12) * u * 2.8 : A.y + A.h - fs(S, 12) * u * 2.8 - 4 * u;
    prog.forEach((t, k) => d.text(t, A.x, py + k * fs(S, 12) * u * 1.4, { size: fs(S, 12), weight: 700, color: (k === 0 ? st.seen.length >= 2 : st.on && st.off) ? tone(S, 'dat').ink : p.mute, base: 'top' }));
    // la lista de vecinos del resultado
    const R: Rect = S.portrait ? { x: A.x, y: Math.max(y, A.y + A.h * 0.5), w: A.w, h: py - Math.max(y, A.y + A.h * 0.5) - 4 * u } : { x: A.x + colW + 24 * u, y: A.y, w: A.w - colW - 24 * u, h: A.h };
    if (v.valid) {
      const list = excl ? v.excl : v.incl, inputs = new Set(v.terms.map((t) => t.i));
      const rh = Math.min(28 * u, (R.h - fs(S, 13) * u * 1.6) / Math.max(1, Math.min(list.length, S.portrait ? 4 : 6)));
      d.text(excl ? S.l('más cercanas, sin contar las palabras escritas', 'closest, not counting the typed words') : S.l('más cercanas, contando todo el vocabulario', 'closest, counting the whole vocabulary'), R.x, R.y, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top', w: R.w });
      const n = Math.max(2, Math.min(list.length, Math.floor((R.h - fs(S, 13) * u * 1.8) / rh)));
      cosBars(S, { x: R.x, y: R.y + fs(S, 13) * u * (R.w < 300 ? 2.2 : 1.6), w: R.w, h: rh * n }, list.slice(0, n).map((q, k) => ({ label: noApple(word(S, q.i)), value: q.s, hot: k === 0, tone: (inputs.has(q.i) ? 'err' : 'lat') as 'err' | 'lat', tag: inputs.has(q.i) ? S.l('← entrada', '← input') : '' })), { rowH: rh });
    } else if (!S.portrait) d.text(S.l('El resultado aparece aquí.', 'The result appears here.'), R.x, R.y + R.h * 0.3, { size: fs(S, 13), weight: 600, color: p.mute, base: 'top' });
  });
  void alpha; void clamp; void sg; void lt; void fit;
}
