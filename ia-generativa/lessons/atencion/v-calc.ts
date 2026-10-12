// Vista 3 (three … flip): las cuentas, pieza por pieza, con el ejemplo hecho a mano. A un lado, la tabla de la frase
// (token · clave/valor · puntuación · peso); al otro, una tarjeta con el paso del momento: de dónde salen consulta,
// clave y valor; el producto punto; las flechas; softmax; la mezcla de valores; el resultado; y la otra frase.
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { A, ATT_A, ATT_B, B, DIM, Q_BANK, type Att, type Lang, type Toy, type V2 } from './data';
import { area, cells, chip, fitSize, fr, fz, isShort, kk, label, life, num, numA, pct, q, rich, senseScale, tagNote, vecBars } from './ui';

interface Geo { T: Rect; C: Rect; rh: number; hdr: number; xTok: number; tokW: number; xSlot: number; cw: number; xScore: number; xBar: number; barW: number; size: number }
function geo(S: Frame): Geo {
  const R = area(S), P = S.portrait, sh = isShort(S), u = S.u;
  const T: Rect = P ? { x: R.x, y: R.y + R.h * 0.41, w: R.w, h: R.h * 0.59 } : { x: R.x, y: R.y, w: R.w * (sh ? 0.54 : 0.55), h: R.h };
  const C: Rect = P ? { x: R.x, y: R.y, w: R.w, h: R.h * 0.37 } : { x: R.x + R.w * (sh ? 0.57 : 0.59), y: R.y, w: R.w * (sh ? 0.43 : 0.41), h: R.h };
  const size = fz(S, sh ? 12.5 : 13.5);
  const hdr = size * u * 1.7, rh = Math.min(42 * kk(S), (T.h - hdr) / 8);
  if (!P) { const used = hdr + rh * 8, dy = Math.max(0, (T.h - used) * 0.4); T.y += dy; T.h -= dy; }
  const L = S.lang as Lang, words = [...A[L].tok, ...B[L].tok];
  const tokW = Math.max(...words.map((w) => S.d.measure(w, { size, weight: 600 }))) + 14 * u;
  const cwPx = Math.max(30 * u, S.d.measure('−1.6', { size, weight: 700, font: 'mono' }) + 8 * u), cw = cwPx / u, slotW = cwPx * 2 + 3 * u, gap = 10 * u, scoreW = S.d.measure('−1.6', { size, weight: 700, font: 'mono' }) + 8 * u;
  const pctW = S.d.measure('60 %', { size, weight: 800, font: 'mono' }) + 6 * u;
  const xTok = T.x, xSlot = xTok + tokW + gap + slotW / 2, xScore = xSlot + slotW / 2 + gap + scoreW / 2, xBar = xScore + scoreW / 2 + gap;
  const barW = Math.max(24 * u, T.x + T.w - xBar - pctW - 4 * u);
  return { T, C, rh, hdr, xTok, tokW, xSlot, cw, xScore, xBar, barW, size };
}
const rowY = (G: Geo, i: number) => G.T.y + G.hdr + (i + 0.5) * G.rh;

/** La tabla de una frase. `cols` dice qué columnas se ven (0..1) y `rowA` cuánto se ve cada fila. */
function drawTable(S: Frame, G: Geo, T: Toy, att: Att, o: { a: number; rowA: (i: number) => number; key: (i: number) => number; val: (i: number) => number; score: (i: number) => number; weight: (i: number) => number; hl?: (i: number) => [Tone, number] | null }) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig');
  if (o.a < 0.01) return;
  d.withAlpha(o.a, () => {
    T.tok.forEach((w, i) => {
      const ra = o.rowA(i);
      if (ra < 0.01) return;
      const y = rowY(G, i), ch = G.rh * 0.8;
      const h = o.hl?.(i);
      if (h && h[1] > 0.01) d.rect(G.T.x - 4 * u, y - G.rh / 2 + 1, G.T.w + 4 * u, G.rh - 2, { fill: alpha(tone(S, h[0]).c, 0.1), a: h[1] * ra });
      chip(S, { x: G.xTok, y: y - ch / 2, w: G.tokW, h: ch }, w, { a: ra, size: G.size, tone: 'lat', strong: i === T.q ? 1 : 0 });
      const ka = o.key(i) * ra, va = o.val(i) * ra;
      if (ka > 0.01) cells(S, G.xSlot, y, T.K[i], { tone: 'w', a: ka, cw: G.cw, h: G.rh * 0.72 / u, size: G.size });
      if (va > 0.01) cells(S, G.xSlot, y, T.V[i], { tone: 'dat', a: va, cw: G.cw, h: G.rh * 0.72 / u, size: G.size });
      const sa = o.score(i) * ra;
      if (sa > 0.01) label(S, num(S, att.s[i], 1), G.xScore, y, { a: sa, size: G.size, weight: 700, font: 'mono', color: p.ink });
      const wa = o.weight(i) * ra;
      if (wa > 0.01) {
        const bh = G.rh * 0.46;
        d.rect(G.xBar, y - bh / 2, G.barW, bh, { fill: p.surface2, r: 2, a: ra });
        d.rect(G.xBar, y - bh / 2, G.barW * att.w[i] * wa, bh, { fill: sg.c, r: 2 });
        label(S, pct(S, att.w[i]), G.xBar + G.barW + 4 * u, y, { a: wa, size: G.size, weight: 800, font: 'mono', color: att.w[i] > 0.05 ? sg.ink : p.mute, align: 'left' });
      }
    });
  });
}

// ═════════ tarjetas ═════════
/** De dónde salen consulta, clave y valor (three). */
function cardThree(S: Frame, C: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang, P = S.portrait;
  if (a < 0.01) return;
  const lt = tone(S, 'lat');
  d.withAlpha(a, () => {
    const size = fz(S, 13), cx = C.x + C.w / 2;
    const y0 = C.y + C.h * (P ? 0.1 : 0.16);
    const name = A[L].tok[A[L].q];
    const cw = d.measure(name, { size: fz(S, 14), weight: 700 }) + 16 * u;
    chip(S, { x: cx - cw / 2, y: y0, w: cw, h: fz(S, 14) * u * 1.75 }, name, { size: fz(S, 14), tone: 'lat', strong: 1, a: fr(S, 'three', 0.02, 0.12) });
    const k = kk(S), eb: Rect = { x: cx - 60 * k, y: y0 + fz(S, 14) * u * 1.75 + 12 * k, w: 120 * k, h: (P ? 26 : 36) * k };
    vecBars(S, eb, [0.55, -0.3, 0.8, 0.2, -0.65, 0.4], { a: fr(S, 'three', 0.1, 0.22) });
    label(S, 'embedding', eb.x + eb.w + 6 * u, eb.y + eb.h / 2, { a: fr(S, 'three', 0.1, 0.22), size: fz(S, 12), color: lt.ink, align: 'left', weight: 700 });
    const outs: [string, Tone, number][] = [[S.l('consulta', 'query'), 'sig', 0.3], [S.l('clave', 'key'), 'w', 0.4], [S.l('valor', 'value'), 'dat', 0.5]];
    const yv = Math.min(C.y + C.h - (P ? 30 : 46) * u, eb.y + eb.h + (P ? 48 : 84) * k), span = Math.min(C.w * 0.33, 120 * k);
    outs.forEach(([nm, t, f], n) => {
      const x = cx + (n - 1) * span, aa = fr(S, 'three', f, f + 0.12);
      if (aa < 0.01) return;
      d.arrow(cx, eb.y + eb.h + 3 * u, x, yv - 17 * k, tone(S, t).c, 1.5, 7 * u, aa);
      cells(S, x, yv, [0.3, -0.6], { tone: t, a: aa, cw: 24, h: 22 * k / u, size: fz(S, 13) });
      label(S, nm, x, yv + 11 * k + 4 * u, { a: aa, size: fz(S, 13), weight: 800, color: tone(S, t).ink, base: 'top' });
    });
    if (!P) label(S, S.l('cada flecha: × una tabla de pesos aprendida', 'each arrow: × a learned table of weights'), cx, C.y + C.h - 2 * u, { a: fr(S, 'three', 0.65, 0.8), size: fz(S, 12), color: p.mute, base: 'bottom', italic: true });
    void size;
  });
}

/** El producto punto, paso a paso (toy … dot-sum). */
function cardDot(S: Frame, C: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang;
  if (a < 0.01) return;
  const sg = tone(S, 'sig'), wt = tone(S, 'w');
  const T = A[L], kJ = T.K[T.ctx];
  d.withAlpha(a, () => {
    const size = fz(S, 13), big = fz(S, 15), ch = 26;
    const lq = S.l(`consulta de ${q(S, T.tok[T.q])}`, `query of ${q(S, T.tok[T.q])}`), lk = S.l(`clave de ${q(S, T.tok[T.ctx])}`, `key of ${q(S, T.tok[T.ctx])}`);
    const lblW = Math.max(d.measure(lq, { size, weight: 700 }), d.measure(lk, { size, weight: 700 }));
    const cwPx = Math.max(38 * u, d.measure('0.8', { size: big, weight: 700, font: 'mono' }) + 10 * u), vecW = cwPx * 2 + 3 * u;
    const x0 = C.x + Math.max(0, (C.w - lblW - 12 * u - vecW) / 2), xv = x0 + lblW + 12 * u;
    const colX = (k: number) => xv + k * (cwPx + 3 * u) + cwPx / 2;
    const lh = Math.min(38 * u * (S.portrait ? 0.9 : 1.1), C.h / 5.6), y1 = C.y + Math.max(lh * 0.6, (C.h - lh * 5) / 2);
    const aq = fr(S, 'toy', 0.15, 0.3), ak = fr(S, 'dot-q', 0.5, 0.65);
    const m1 = fr(S, 'dot-mult', 0.3, 0.45), m2 = fr(S, 'dot-mult', 0.6, 0.75);
    // columnas resaltadas mientras se multiplica cada lugar
    const hl = (k: number, aa: number) => { if (aa > 0.01) d.rect(colX(k) - cwPx / 2 - 4 * u, y1 - ch * u / 2 - 4 * u, cwPx + 8 * u, lh + ch * u + 8 * u, { stroke: p.ink2, lw: 1.5, r: 5, dash: [4, 3], a: aa }); };
    hl(0, m1 * (1 - m2)); hl(1, m2 * (1 - fr(S, 'dot-sum', 0, 0.15)));
    label(S, lq, x0 + lblW, y1, { a: aq, size, weight: 700, color: sg.ink, align: 'right' });
    cells(S, xv, y1, Q_BANK, { tone: 'sig', a: aq, cw: cwPx / u, h: ch, strong: true, size: big, left: true });
    label(S, lk, x0 + lblW, y1 + lh, { a: ak, size, weight: 700, color: wt.ink, align: 'right' });
    cells(S, xv, y1 + lh, kJ, { tone: 'w', a: ak, cw: cwPx / u, h: ch, strong: true, size: big, left: true });
    // lugar por lugar: 1 × 1 = 1 ; 1 × 0.8 = 0.8
    const cx = C.x + C.w / 2;
    const prod = (k: number, y: number, aa: number) => {
      if (aa < 0.01) return;
      rich(S, [[numA(S, Q_BANK[k]), sg.ink], [' × ', p.mute], [numA(S, kJ[k]), wt.ink], [' = ', p.mute], [numA(S, Q_BANK[k] * kJ[k]), p.ink]], cx, y, { size: big, a: aa });
    };
    prod(0, y1 + lh * 2.2, m1); prod(1, y1 + lh * 3.0, m2);
    const as = fr(S, 'dot-sum', 0.12, 0.3), ar = fr(S, 'dot-sum', 0.3, 0.45);
    if (as > 0.01) {
      const y = y1 + lh * 4.0;
      d.line(cx - 80 * u, y - lh * 0.48, cx + 80 * u, y - lh * 0.48, p.line, 1.2, undefined, as);
      rich(S, [[numA(S, Q_BANK[0] * kJ[0]), p.ink], [' + ', p.mute], [numA(S, Q_BANK[1] * kJ[1]), p.ink], [' = ', p.mute]], cx, y, { size: big, a: as });
      const w0 = d.measure(`${numA(S, 1)} + ${numA(S, 0.8)} = `, { size: big, weight: 800, font: 'mono' });
      label(S, numA(S, 1.8), cx + w0 / 2, y, { a: ar, size: fz(S, 18), weight: 800, font: 'mono', color: sg.ink, align: 'left' });
      label(S, S.l('producto punto', 'dot product'), cx, y + lh * 0.75, { a: fr(S, 'dot-sum', 0.55, 0.7), size, weight: 800, color: p.ink, base: 'middle' });
    }
  });
}

/** Las flechas: el mismo lado, perpendiculares u opuestas (dot-arrows, scores). */
function cardArrows(S: Frame, C: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang;
  if (a < 0.01) return;
  const T = A[L], sg = tone(S, 'sig'), wt = tone(S, 'w');
  d.withAlpha(a, () => {
    const side = Math.min(C.w * 0.9, C.h - 8 * u), cx = C.x + C.w / 2, cy = C.y + C.h / 2, sc = side / 2 / 2.1;
    const X = (x: number) => cx + x * sc, Y = (y: number) => cy - y * sc;
    d.line(X(-2), Y(0), X(2), Y(0), p.line, 1); d.line(X(0), Y(-2), X(0), Y(2), p.line, 1);
    // las tres claves de la demostración: mismo lado, perpendicular, opuesta
    const demo: [number, string, number][] = [[T.ctx, '+', 0.3], [T.q, '0', 0.5], [3, '−', 0.7]];
    const others = [0, 1];
    const allA = fr(S, 'scores', 0.1, 0.3);
    others.forEach((j) => { const k = T.K[j]; d.arrow(X(0), Y(0), X(k[0]), Y(k[1]), wt.c, 1.5, 7 * u, allA * 0.8); });
    demo.forEach(([j, , f]) => { const k = T.K[j], aa = fr(S, 'dot-arrows', f, f + 0.12); d.arrow(X(0), Y(0), X(k[0]), Y(k[1]), wt.c, 2, 8 * u, aa); });
    d.arrow(X(0), Y(0), X(Q_BANK[0]), Y(Q_BANK[1]), sg.c, 3, 10 * u, fr(S, 'dot-arrows', 0.05, 0.2));
    label(S, S.l('consulta', 'query'), X(Q_BANK[0]) - 4 * u, Y(Q_BANK[1]) - 6 * u, { a: fr(S, 'dot-arrows', 0.1, 0.25), size: fz(S, 12), weight: 800, color: sg.ink, align: 'right', base: 'bottom', halo: true });
    const tagFor = (j: number, txt: string, aa: number) => {
      const k = T.K[j], len = Math.hypot(k[0], k[1]) || 1, ox = (k[0] / len) * 14 * u, oy = -(k[1] / len) * 14 * u;
      label(S, txt, X(k[0]) + ox, Y(k[1]) + oy, { a: aa, size: fz(S, 12), weight: 700, color: wt.ink, align: k[0] >= 0 ? 'left' : 'right', halo: true });
    };
    demo.forEach(([j, sgn, f]) => tagFor(j, `${T.tok[j]}: ${sgn === '0' ? '0' : sgn === '+' ? S.l('positivo', 'positive') : S.l('negativo', 'negative')}`, fr(S, 'dot-arrows', f + 0.05, f + 0.17) * (1 - allA)));
    [...others, ...demo.map((x) => x[0])].forEach((j) => tagFor(j, `${T.tok[j]} ${num(S, ATT_A[L].s[j], 1)}`, allA));
  });
}

/** Softmax: puntuación → exponencial → ÷ suma (softmax, weights). */
function cardSoftmax(S: Frame, C: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang;
  if (a < 0.01) return;
  const T = A[L], att = ATT_A[L], sg = tone(S, 'sig');
  const groups: [number, string][] = [[T.ctx, T.tok[T.ctx]], [1, T.tok[1]], [T.q, T.tok[T.q]], [0, S.l('otros', 'others')]];
  d.withAlpha(a, () => {
    const size = fz(S, 13), rows = groups.length + 2, lh = Math.min(30 * kk(S), (C.h - 8 * u) / rows);
    const nameW = Math.max(...groups.map((g) => d.measure(g[1], { size, weight: 700 }))) + 8 * u;
    const colW = Math.min(76 * kk(S), (C.w - nameW) / 3);
    const x0 = C.x + Math.max(0, (C.w - nameW - colW * 3) / 2) + nameW, cx = (k: number) => x0 + colW * (k + 0.5);
    const y0 = C.y + Math.max(0, (C.h - lh * rows) / 2) + lh * 0.5;
    const hdrs = [S.l('puntuación', 'score'), S.l('exponencial', 'exponential'), S.l('÷ suma', '÷ sum')];
    const colA = [1, fr(S, 'softmax', 0.45, 0.6), fr(S, 'weights', 0.05, 0.2)];
    hdrs.forEach((h, k) => label(S, h, cx(k), y0, { a: colA[k], size: fitSize(S, h, colW - 4 * u, fz(S, 12), 700), weight: 700, color: k === 2 ? sg.ink : p.mute }));
    let eSum = 0;
    groups.forEach(([j, nm], r) => {
      const y = y0 + lh * (r + 1), ra = fr(S, 'softmax', 0.08 + r * 0.04, 0.2 + r * 0.04);
      const n = j === 0 ? 5 : 1;
      label(S, nm + (n > 1 ? ' ×5' : ''), x0 - 8 * u, y, { a: ra, size, weight: 700, color: p.ink2, align: 'right' });
      label(S, num(S, att.s[j], 1), cx(0), y, { a: ra, size, weight: 700, font: 'mono', color: p.ink });
      const ea = fr(S, 'softmax', 0.5 + r * 0.05, 0.6 + r * 0.05);
      d.arrow(cx(0) + colW * 0.28, y, cx(1) - colW * 0.3, y, p.mute, 1.2, 6 * u, ea * 0.8);
      label(S, num(S, att.e[j], 1), cx(1), y, { a: ea, size, weight: 700, font: 'mono', color: p.ink });
      label(S, pct(S, att.w[j]), cx(2), y, { a: fr(S, 'weights', 0.1 + r * 0.06, 0.22 + r * 0.06), size, weight: 800, font: 'mono', color: sg.ink });
      eSum += att.e[j] * n;
    });
    const ys = y0 + lh * (groups.length + 1);
    d.line(cx(1) - colW * 0.4, ys - lh * 0.5, cx(2) + colW * 0.4, ys - lh * 0.5, p.line, 1, undefined, fr(S, 'softmax', 0.75, 0.85));
    label(S, S.l('suma', 'sum'), x0 - 8 * u, ys, { a: fr(S, 'softmax', 0.75, 0.85), size, weight: 700, color: p.ink2, align: 'right' });
    label(S, `≈ ${num(S, eSum, 0)}`, cx(1), ys, { a: fr(S, 'softmax', 0.78, 0.9), size, weight: 800, font: 'mono', color: p.ink });
    label(S, pct(S, 1), cx(2), ys, { a: fr(S, 'weights', 0.5, 0.65), size, weight: 800, font: 'mono', color: sg.ink });
  });
}

/** Valores y mezcla (values, mix, result) y la otra frase (flip). */
function cardMix(S: Frame, C: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang, P = S.portrait;
  if (a < 0.01) return;
  const dt = tone(S, 'dat'), sg = tone(S, 'sig'), lt = tone(S, 'lat');
  const kB = fr(S, 'flip', 0.15, 0.35);
  const draw = (T: Toy, att: Att, aa: number) => {
    if (aa < 0.01) return;
    d.withAlpha(aa, () => {
      const size = fz(S, 13), cw = Math.max(32 * u, d.measure('0.5', { size, weight: 700, font: 'mono' }) + 8 * u) / u;
      // encabezado: qué significa cada número del valor
      const yh = C.y + 4 * u + size * u * 0.6;
      const hx = C.x + C.w / 2;
      label(S, S.l(`valor = (${DIM[L][0]}, ${DIM[L][1]})`, `value = (${DIM[L][0]}, ${DIM[L][1]})`), hx, yh, { size, weight: 700, color: dt.ink });
      // contribuciones: peso × valor
      const verb = T === A[L] ? 1 : L === 'es' ? 0 : 1, top = [T.ctx, verb, T.q];
      const lines = top.map((j) => ({ j, w: att.w[j], v: T.V[j] }));
      const rows = lines.length + (P ? 1 : 2), lh = Math.min(28 * kk(S), (C.h * (P ? 0.72 : 0.6) - size * u * 1.6) / rows);
      const y0 = yh + size * u * 1.2 + lh * 0.5;
      const xEq = C.x + C.w * 0.5;
      // en el teléfono vertical no caben las cuentas y la escala a la vez: las cuentas se apagan al llegar el resultado
      const lineA = !P ? 1 : T === A[L] ? 1 - fr(S, 'result', 0.05, 0.25) : 0;
      lines.forEach((ln, r) => {
        const y = y0 + r * lh, ra = (T === A[L] ? fr(S, 'mix', 0.12 + r * 0.17, 0.24 + r * 0.17) : 1) * lineA;
        label(S, `${pct(S, ln.w)}  ×`, xEq - 4 * u, y, { a: ra, size, weight: 800, font: 'mono', color: sg.ink, align: 'right' });
        const vw = cells(S, xEq + 6 * u, y, ln.v, { tone: 'dat', a: ra, cw, h: lh * 0.78 / u, size, left: true });
        label(S, `(${T.tok[ln.j]})`, xEq + 6 * u + vw + 8 * u, y, { a: ra, size: fz(S, 12), color: p.mute, align: 'left', italic: true });
      });
      const yo = y0 + lines.length * lh, ao = (T === A[L] ? fr(S, 'mix', 0.66, 0.78) : 1) * lineA;
      if (!P) label(S, S.l('+ los demás × (0, 0)', '+ the rest × (0, 0)'), xEq - 4 * u, yo, { a: ao, size: fz(S, 12), color: p.mute, align: 'right', italic: true });
      const yr = (P ? yo - lh * 0.1 : yo + lh * 1.05), ar = T === A[L] ? fr(S, 'mix', 0.82, 0.95) : 1;
      d.line(C.x + C.w * 0.12, yr - lh * 0.55, C.x + C.w * 0.88, yr - lh * 0.55, p.ink2, 1.2, undefined, ar);
      label(S, S.l(`nuevo ${q(S, T.tok[T.q])} =`, `new ${q(S, T.tok[T.q])} =`), xEq - 4 * u, yr, { a: ar, size, weight: 800, color: lt.ink, align: 'right' });
      cells(S, xEq + 6 * u, yr, att.out, { tone: 'lat', a: ar, cw: 40, h: lh * 0.85 / u, size: fz(S, 14), strong: true, digits: 2, left: true });
      // la escala de los dos sentidos
      const sa = T === A[L] ? fr(S, 'result', 0.3, 0.45) : 1;
      if (sa > 0.01) {
        const k = T === A[L] ? fr(S, 'result', 0.45, 0.8, 'io') : 1;
        const from: V2 = T === A[L] ? [0.5, 0.5] : ATT_A[L].out;
        const v: V2 = [lerp(from[0], att.out[0], k), lerp(from[1], att.out[1], k)];
        const sr: Rect = P ? { x: C.x + C.w * 0.04, y: y0 - lh * 0.2, w: C.w * 0.92, h: 36 * u } : { x: C.x + C.w * 0.04, y: Math.min(C.y + C.h - 40 * u, yr + lh * 0.75), w: C.w * 0.92, h: 36 * u };
        senseScale(S, sr, v, { dims: DIM[L], ghost: [0.5, 0.5], ghostA: 1, caption: q(S, T.tok[T.q]) });
      }
    });
  };
  // fase «values»: la leyenda y los dos valores de ejemplo
  const aLeg = fr(S, 'values', 0.2, 0.35) * (1 - fr(S, 'mix', 0, 0.1));
  if (aLeg > 0.01) {
    const T = A[L], size = fz(S, 13), cy = C.y + C.h * 0.3;
    d.withAlpha(aLeg, () => {
      label(S, S.l('el valor dice cuánto apunta a…', 'the value says how much it points to…'), C.x + C.w / 2, cy - 30 * u, { size: fz(S, 12), color: p.mute, italic: true });
      const cx = C.x + C.w / 2;
      label(S, DIM[L][0], cx - 18 * u, cy, { size, weight: 700, color: dt.ink, align: 'right' });
      label(S, DIM[L][1], cx + 18 * u, cy, { size, weight: 700, color: dt.ink, align: 'left' });
      label(S, '·', cx, cy, { size, weight: 800, color: p.mute });
      [[T.ctx, 0.5], [T.q, 0.7]].forEach(([j, f], r) => {
        const y = cy + 40 * u + r * 34 * u, aa = fr(S, 'values', f, f + 0.12);
        label(S, q(S, T.tok[j]), cx - 44 * u, y, { a: aa, size, weight: 700, color: p.ink2, align: 'right' });
        cells(S, cx + 2 * u, y, T.V[j], { tone: 'dat', a: aa, cw: 34, h: 24, size, strong: true });
      });
    });
  }
  const aMix = fr(S, 'mix', 0.02, 0.12);
  draw(A[L], ATT_A[L], aMix * (1 - kB));
  draw(B[L], ATT_B[L], aMix * kB);
}

export function drawCalc(S: Frame) {
  const G = geo(S), L = S.lang as Lang, u = S.u;
  const kB = fr(S, 'flip', 0.15, 0.35);
  const ta = A[L], tb = B[L];
  const scoreOrder = [ta.ctx, 1, ta.q, 0, 2, 3, 5, 6];
  const optsA = {
    a: 1 - kB,
    rowA: (i: number) => fr(S, 'three', 0.02 + i * 0.03, 0.12 + i * 0.03),
    key: (i: number) => fr(S, 'toy', 0.3 + i * 0.05, 0.42 + i * 0.05) * (1 - fr(S, 'values', 0.1, 0.25)),
    val: (i: number) => fr(S, 'values', 0.2, 0.35),
    score: (i: number) => (i === ta.ctx ? fr(S, 'dot-sum', 0.35, 0.5) : fr(S, 'scores', 0.12 + scoreOrder.indexOf(i) * 0.08, 0.22 + scoreOrder.indexOf(i) * 0.08)),
    weight: (i: number) => fr(S, 'weights', 0.1, 0.55, 'io'),
    hl: (i: number): [Tone, number] | null => {
      if (i === ta.ctx && S.between('dot-q', 'dot-arrows')) return ['sig', fr(S, 'dot-q', 0.5, 0.65)];
      if (S.between('mix', 'result')) { const k = [ta.ctx, 1, ta.q].indexOf(i); if (k >= 0) return ['dat', fr(S, 'mix', 0.12 + k * 0.17, 0.24 + k * 0.17)]; }
      return null;
    },
  };
  // encabezados
  const { d, pal: p } = S, hy = G.T.y + G.hdr * 0.45, hs = fz(S, 12);
  const hA = fr(S, 'toy', 0.25, 0.4);
  const keyH = 1 - fr(S, 'values', 0.1, 0.25), valH = fr(S, 'values', 0.2, 0.35);
  label(S, S.l('clave', 'key'), G.xSlot, hy, { a: hA * keyH, size: hs, weight: 800, color: tone(S, 'w').ink });
  label(S, S.l('valor', 'value'), G.xSlot, hy, { a: valH, size: hs, weight: 800, color: tone(S, 'dat').ink });
  const sH = Math.max(fr(S, 'dot-sum', 0.35, 0.5), 0);
  label(S, S.l('puntuación', 'score'), G.xScore, hy, { a: sH, size: hs, weight: 800, color: p.mute });
  label(S, S.l('peso', 'weight'), G.xBar + G.barW / 2 + 10 * u, hy, { a: fr(S, 'weights', 0.05, 0.2), size: hs, weight: 800, color: tone(S, 'sig').ink });
  d.line(G.T.x, G.T.y + G.hdr * 0.95, G.T.x + G.T.w, G.T.y + G.hdr * 0.95, p.line, 1, undefined, hA);

  drawTable(S, G, ta, ATT_A[L], optsA);
  drawTable(S, G, tb, ATT_B[L], { a: kB, rowA: () => 1, key: () => 0, val: () => 1, score: () => 1, weight: () => 1, hl: (i) => (i === tb.ctx ? ['sig', 1] : null) });

  // tarjetas
  // en vertical, mientras la tabla solo muestra las fichas, el diagrama usa también el espacio a su derecha
  const C3: Rect = S.portrait ? { x: G.xTok + G.tokW + 8 * u, y: G.C.y, w: G.T.x + G.T.w - G.xTok - G.tokW - 8 * u, h: G.T.y + G.T.h * 0.62 - G.C.y } : G.C;
  cardThree(S, C3, life(S, 'three', 'toy'));
  cardDot(S, G.C, life(S, 'toy', 'dot-arrows'));
  cardArrows(S, G.C, life(S, 'dot-arrows', 'softmax'));
  cardSoftmax(S, G.C, life(S, 'softmax', 'values'));
  cardMix(S, G.C, S.on('values') ? fr(S, 'values', 0, 0.12) : 0);
  const R = area(S);
  if (isShort(S) || S.portrait) tagNote(S, S.l('ilustrativo', 'illustrative'), G.T.x, G.T.y + G.hdr * 0.45 - fz(S, 12) * u * 0.6, fr(S, 'toy', 0.6, 0.75), 'left');
  else tagNote(S, S.l('ejemplo hecho a mano', 'handmade example'), R.x + R.w, R.y + R.h - fz(S, 12) * u * 1.3, fr(S, 'toy', 0.6, 0.75));
  void clamp;
}
