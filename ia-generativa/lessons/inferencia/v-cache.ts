// Vistas de la caché KV: el recuerdo de la atención (attn-recall), la tabla de vueltas sin y con caché (recompute ·
// unchanged · kvcache · count), cuánto pesa por token (kv-price · kv-llama) y la memoria de la GPU (kv-demo … kv-long).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CELLS_NO, CELLS_YES, G_OUT, H100, KV_NUMS, KV_TOKEN, LLAMA, P_IN, W_BYTES, kvBytes, maxUsers } from './model';
import { runDemo, type Demo } from './tiny';
import { WORDS, area, chip, curveArrow, fitText, fits, fr, fz, gb, hatch, int, lg, note, noteH, para, paraH, tight, tok } from './ui';

// ═════════ la atención, en una frase ═════════
// Los seis tokens anteriores, cada uno con su clave y su valor; el token nuevo, con su consulta. La consulta se compara con
// una clave a la vez (una sola línea en pantalla) y al final se mezclan los valores (una llave hacia el resultado).
export function drawAttnRecall(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), W = WORDS[lg(S)];
  const words = [...W.msg, W.ans[0]], n = words.length, sig = tone(S, 'sig'), w = tone(S, 'w');
  const P = S.portrait;
  const kLab = S.l('clave', 'key'), vLab = S.l('valor', 'value'), qLab = S.l('consulta', 'query'), mLab = S.l('mezcla', 'mix');
  const aTok = fr(S, 'attn-recall', 0.02, 0.15), aKV = fr(S, 'attn-recall', 0.12, 0.26), aQ = fr(S, 'attn-recall', 0.24, 0.34);
  const cmp = fr(S, 'attn-recall', 0.34, 0.64, 'lin'), mixV = fr(S, 'attn-recall', 0.68, 0.84);
  const chipH = fz(S, 12) * u + 9 * u;
  type Cell = { tok: Rect; k: [number, number]; v: [number, number] };
  const cells: Cell[] = [];
  let colW = 0;
  if (!P) {
    colW = Math.min(118 * u, R.w / n);
    const x0 = R.x + (R.w - colW * n) / 2, th = Math.max(fz(S, 13) * u + 12 * u, 34 * u);
    const ty = R.y + R.h * 0.12, ky = ty + th + 26 * u + chipH / 2, vy = ky + chipH + 26 * u;
    for (let i = 0; i < n; i++) cells.push({ tok: { x: x0 + i * colW + 3 * u, y: ty, w: colW - 6 * u, h: th }, k: [x0 + (i + 0.5) * colW, ky], v: [x0 + (i + 0.5) * colW, vy] });
  } else {
    const rh = Math.min(40 * u, (R.h * 0.8) / n), tw = Math.min(R.w * 0.4, 150 * u), y0 = R.y + 6 * u;
    colW = (R.w - tw) * 0.3;
    for (let i = 0; i < n; i++) {
      const y = y0 + i * rh;
      cells.push({ tok: { x: R.x, y: y + 3 * u, w: tw, h: rh - 6 * u }, k: [R.x + tw + (R.w - tw) * 0.3, y + rh / 2], v: [R.x + tw + (R.w - tw) * 0.72, y + rh / 2] });
    }
  }
  const maxChip = P ? colW * 1.25 : colW - 4 * u;
  const cur = Math.min(n - 2, Math.floor(cmp * (n - 1)));
  cells.forEach((c, i) => {
    const isNew = i === n - 1;
    tok(S, c.tok, words[i], { t: isNew ? 'sig' : 'lat', a: aTok, hot: isNew ? 0.6 : 0 });
    if (!isNew) {
      const seen = cmp > 0 && (i < cur || cmp >= 1) ? 1 : 0, now = cmp > 0 && cmp < 1 && i === cur ? 1 : 0;
      chip(S, kLab, c.k[0], c.k[1], 'lat', { a: aKV, size: 12, maxW: maxChip, fill: 0.1 + 0.25 * seen + 0.5 * now });
      chip(S, vLab, c.v[0], c.v[1], 'w', { a: aKV, size: 12, maxW: maxChip, fill: 0.1 + 0.4 * mixV });
    }
  });
  // la consulta del token nuevo (en la fila de las claves) y el resultado de la mezcla (en la de los valores)
  const qn = cells[n - 1];
  const q = chip(S, qLab, qn.k[0], qn.k[1], 'sig', { a: aQ, size: 12.5, maxW: P ? colW * 1.4 : colW + 10 * u, fill: 0.3 });
  // una comparación a la vez: una línea de la consulta a la clave que se está comparando
  if (cmp > 0 && cmp < 1) d.withAlpha(aQ, () => {
    const [kx, ky] = cells[cur].k;
    if (!P) { const yl = ky + chipH / 2 + 7 * u; d.polyline([[q.x + q.w / 2, q.y + q.h], [q.x + q.w / 2, yl], [kx, yl]], sig.c, 1.8); d.arrow(kx, yl, kx, ky + chipH / 2 + 1 * u, sig.c, 1.8, 6 * Math.max(0.8, u)); }
    else { const xl = q.x - 10 * u; d.polyline([[q.x, q.y + q.h / 2], [xl, q.y + q.h / 2], [xl, ky]], sig.c, 1.8); d.arrow(xl, ky, kx - maxChip / 2 + 4 * u, ky, sig.c, 1.8, 6 * Math.max(0.8, u)); }
  });
  // la mezcla de los valores: una llave que los junta y una flecha al resultado
  if (mixV > 0.01) d.withAlpha(mixV, () => {
    if (!P) {
      const yb = cells[0].v[1] + chipH / 2 + 8 * u, xa = cells[0].v[0] - colW * 0.35, xb = cells[n - 2].v[0] + colW * 0.35;
      d.polyline([[xa, yb - 5 * u], [xa, yb], [xb, yb], [xb, yb - 5 * u]], w.c, 1.8);
      const mx = qn.v[0];
      d.polyline([[xb, yb], [mx, yb]], w.c, 1.8);
      d.arrow(mx, yb, mx, qn.v[1] + chipH / 2 + 2 * u, w.c, 1.8, 6 * Math.max(0.8, u));
    } else {
      const xb = cells[0].v[0] + maxChip / 2 + 8 * u, ya = cells[0].v[1] - chipH / 2, yb = cells[n - 2].v[1] + chipH / 2;
      d.polyline([[xb - 5 * u, ya], [xb, ya], [xb, yb], [xb - 5 * u, yb]], w.c, 1.8);
      d.arrow(xb, yb, xb, qn.v[1] - chipH / 2 - 2 * u, w.c, 1.8, 6 * Math.max(0.8, u));
    }
  });
  chip(S, mLab, qn.v[0], qn.v[1], 'sig', { a: fr(S, 'attn-recall', 0.8, 0.9), size: 12.5, maxW: P ? colW * 1.4 : colW + 10 * u, fill: 0.3 });
  // pie
  const capY = P ? cells[n - 1].tok.y + cells[n - 1].tok.h + 22 * u : cells[0].v[1] + chipH + 40 * u;
  const cap = S.l('el token nuevo compara su consulta con cada clave y mezcla los valores', 'the new token compares its query with every key and mixes the values');
  const cw = Math.min(R.w, 560 * u);
  para(S, cap, R.x + R.w / 2, capY, cw, { size: 13.5, align: 'center', a: fr(S, 'attn-recall', 0.36, 0.48) });
  void p; void alpha; void curveArrow; void paraH;
}

// ═════════ la tabla de vueltas: sin caché y con caché ═════════
let DEMO: Demo | undefined;
const demo = () => (DEMO ??= runDemo(Array.from({ length: P_IN + G_OUT }, (_, i) => i), P_IN, P_IN + G_OUT));
const COLS = P_IN + G_OUT - 1, ROWS = G_OUT;

function gridRects(S: Frame) {
  const u = S.u, P = S.portrait, gap = 18 * u, R0 = area(S);
  // una línea al pie para el veredicto (count)
  const verdictH = fz(S, 13) * u * 1.3 * (P ? 2 : 1) + 12 * u;
  const R = { ...R0, h: R0.h - verdictH };
  const capH = fz(S, 14) * u * 1.4 + fz(S, 12) * u * 1.5 + 6 * u;      // título y rótulos de columnas
  const countH = fz(S, 13) * u * 1.3 * 2 + 10 * u;                      // una o dos líneas de conteo
  const halves: Rect[] = P ? [{ x: R.x, y: R.y, w: R.w, h: (R.h - gap) / 2 }, { x: R.x, y: R.y + (R.h + gap) / 2, w: R.w, h: (R.h - gap) / 2 }]
    : [{ x: R.x, y: R.y, w: (R.w - gap) / 2, h: R.h }, { x: R.x + (R.w + gap) / 2, y: R.y, w: (R.w - gap) / 2, h: R.h }];
  const labW = S.d.measure(S.l('vueltas ↓', 'turns ↓'), { size: fz(S, 12), weight: 600 }) + 8 * u;
  const cs = Math.max(6, Math.floor(Math.min((halves[0].w - labW) / COLS, (halves[0].h - capH - countH) / ROWS, 30 * u)));
  return halves.map((h) => {
    const gw = cs * COLS, gh = cs * ROWS;
    const gx = h.x + labW + (h.w - labW - gw) / 2, gy = h.y + capH;
    return { half: h, gx, gy, cs, gw, gh, verdictY: R0.y + R0.h - verdictH + 6 * u };
  });
}

function drawGrid(S: Frame, G: ReturnType<typeof gridRects>[number], mode: 'no' | 'yes', a: number) {
  const { d, pal: p } = S, u = S.u, dat = tone(S, 'dat'), err = tone(S, 'err'), lat = tone(S, 'lat'), sg = tone(S, 'sig');
  const seg = mode === 'no' ? 'recompute' : 'kvcache';
  const rowA = (j: number) => fr(S, seg, 0.14 + 0.065 * j, 0.19 + 0.065 * j);
  const rep = mode === 'no' ? (S.on('unchanged') ? fr(S, 'unchanged', 0.2, 0.45) : 0) : 0;
  d.withAlpha(a, () => {
    // título
    const title = mode === 'no' ? S.l('sin caché', 'without a cache') : S.l('con caché KV', 'with a KV cache');
    fitText(S, title, G.half.x, G.half.y, G.half.w, { size: 14, weight: 800, color: mode === 'no' ? p.ink : lat.ink, base: 'top' });
    // columnas: los tokens del mensaje y los de la respuesta; filas: las vueltas
    const axY = G.gy - 5 * u, mw = P_IN * G.cs, rw = G.gw - mw;
    d.line(G.gx, axY + 2 * u, G.gx + mw - 2 * u, axY + 2 * u, lat.c, 2);
    d.line(G.gx + mw + 1 * u, axY + 2 * u, G.gx + G.gw, axY + 2 * u, sg.c, 2);
    const lm = S.l('mensaje', 'message'), lr = S.l('respuesta →', 'answer →');
    if (fits(S, lm, mw, { weight: 700 }) && fits(S, lr, rw, { weight: 700 })) {
      fitText(S, lm, G.gx + mw / 2, axY - 1 * u, mw, { size: 12, weight: 700, color: lat.ink, align: 'center', base: 'bottom' });
      fitText(S, lr, G.gx + mw + rw / 2, axY - 1 * u, rw, { size: 12, weight: 700, color: sg.ink, align: 'center', base: 'bottom' });
    } else fitText(S, S.l('tokens →', 'tokens →'), G.gx, axY - 1 * u, G.half.x + G.half.w - G.gx, { size: 12, weight: 700, color: p.mute, base: 'bottom' });
    fitText(S, S.l('vueltas ↓', 'turns ↓'), G.gx - 4 * u, G.gy + G.cs / 2, G.gx - G.half.x, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'middle' });
    for (let j = 0; j < ROWS; j++) {
      const ra = rowA(j);
      if (ra <= 0.01) continue;
      const last = P_IN + j - 1;   // columna del token que se calcula por primera vez en esta vuelta (en la primera, las seis del mensaje)
      for (let c = 0; c <= last; c++) {
        const x = G.gx + c * G.cs, y = G.gy + j * G.cs, r = { x: x + 1, y: y + 1, w: G.cs - 2, h: G.cs - 2 };
        const fresh = mode === 'no' || j === 0 || c === last;
        d.withAlpha(ra, () => {
          if (fresh) {
            d.rect(r.x, r.y, r.w, r.h, { fill: alpha(dat.c, 0.75) });
            if (mode === 'no' && j > 0 && c < last && rep > 0) d.withAlpha(rep, () => { d.rect(r.x, r.y, r.w, r.h, { fill: alpha(err.c, 0.55) }); hatch(S, r, alpha(p.stage, 0.7), 4, 1); });
          } else d.rect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, { fill: alpha(lat.c, 0.12), stroke: alpha(lat.c, 0.55), lw: 1 });
        });
      }
    }
    // conteos: a la izquierda las casillas calculadas; a la derecha (o debajo, si no cabe) la nota
    const cy = G.gy + G.gh + 8 * u, lh1 = fz(S, 13) * u * 1.3;
    const nShown = Math.round(clamp((fr(S, seg, 0.14, 0.14 + 0.065 * (ROWS - 1) + 0.05, 'lin'))) * ROWS);
    let count = 0;
    for (let j = 0; j < nShown; j++) count += mode === 'no' ? P_IN + j : j === 0 ? P_IN : 1;
    const txt = S.l(`casillas calculadas: ${count}`, `cells computed: ${count}`);
    const boxed = S.on('count') ? fr(S, 'count', 0.05, 0.2) : 0;
    const tw = d.measure(txt, { size: fz(S, 13), weight: 700 });
    if (boxed > 0.01) d.rect(G.gx - 4 * u, cy - 3 * u, tw + 8 * u, lh1 + 4 * u, { stroke: mode === 'no' ? p.ink : lat.c, lw: 1.6, r: 3, a: boxed });
    fitText(S, txt, G.gx, cy, G.half.x + G.half.w - G.gx, { size: 13, weight: 700, color: dat.ink, base: 'top' });
    const side = mode === 'no' ? S.l(`repetidas: ${CELLS_NO - CELLS_YES}`, `repeated: ${CELLS_NO - CELLS_YES}`) : S.l('las demás se leen de la caché', 'the rest are read from the cache');
    const sa = mode === 'no' ? rep : fr(S, 'kvcache', 0.7, 0.82);
    if (sa > 0.01) {
      const sw = d.measure(side, { size: fz(S, 12.5), weight: 700 });
      const sameLine = tw + sw + 16 * u <= G.gw;
      fitText(S, side, sameLine ? G.gx + G.gw : G.gx, sameLine ? cy : cy + lh1 + 2 * u, G.half.x + G.half.w - G.gx, { size: 12.5, weight: 700, color: mode === 'no' ? err.ink : lat.ink, align: sameLine ? 'right' : 'left', base: 'top', a: sa });
    }
  });
}

export function drawGrids(S: Frame) {
  const u = S.u, G = gridRects(S);
  drawGrid(S, G[0], 'no', 1);
  if (S.on('kvcache')) drawGrid(S, G[1], 'yes', fr(S, 'kvcache', 0, 0.1));
  // nota de «repetido» donde luego irá la segunda tabla
  if (S.between('unchanged', 'kvcache')) {
    const a = fr(S, 'unchanged', 0.4, 0.55), g = G[1].half;
    const txt = S.l('cada token solo mira hacia atrás: su clave y su valor no cambian de una vuelta a otra', 'each token only looks back: its key and value do not change from one turn to the next');
    const w = Math.min(g.w, 360 * u), h = paraH(S, txt, w, 14, 700);
    para(S, txt, g.x + g.w / 2, g.y + g.h / 2 - h / 2, w, { size: 14, weight: 700, align: 'center', color: tone(S, 'err').ink, a });
  }
  // el veredicto, comprobado con el transformer de juguete
  if (S.on('count')) {
    const a = fr(S, 'count', 0.45, 0.6), D = demo();
    const ok = D.maxDiff === 0 && D.passesNoCache === CELLS_NO && D.passesCache === CELLS_YES;
    const txt = ok ? S.l('✓ la misma respuesta con y sin caché (transformer de juguete: diferencia 0)', '✓ the same answer with and without the cache (toy transformer: difference 0)') : '…';
    const R = area(S), w = Math.min(R.w, 640 * u);
    note(S, txt, R.x + R.w / 2, G[0].verdictY, w, 'dat', { a, size: 13 });
  }
}

// ═════════ cuánto pesa la caché por token ═════════
export function drawKvBytes(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, lat = tone(S, 'lat'), w = tone(S, 'w');
  const a0 = fr(S, 'kv-price', 0.05, 0.2);
  // un token → la pila de 32 bloques, cada uno con su clave y su valor
  const stackH = Math.min(P ? R.h * 0.5 : R.h * 0.78, 300 * u), stackW = Math.min(P ? R.w * 0.62 : R.w * 0.32, 230 * u);
  const sx = P ? R.x + (R.w - stackW) / 2 + 30 * u : R.x + R.w * 0.2, sy = R.y + (P ? 6 * u : (R.h - stackH) / 2);
  const rh = stackH / LLAMA.layers;
  const tw = Math.min(90 * u, R.w * 0.2), th = Math.max(fz(S, 13) * u + 12 * u, 30 * u);
  const tr: Rect = P ? { x: R.x, y: sy + stackH / 2 - th / 2, w: tw, h: th } : { x: R.x, y: sy + stackH / 2 - th / 2, w: tw, h: th };
  tok(S, tr, S.l('1 token', '1 token'), { t: 'sig', a: a0 });
  d.withAlpha(a0, () => d.arrow(tr.x + tr.w + 4 * u, tr.y + tr.h / 2, sx - 8 * u, tr.y + tr.h / 2, p.ink2, 1.8, 7 * Math.max(0.8, u)));
  for (let b = 0; b < LLAMA.layers; b++) {
    const a = fr(S, 'kv-price', 0.2 + 0.4 * (b / LLAMA.layers), 0.25 + 0.4 * (b / LLAMA.layers));
    if (a <= 0.01) continue;
    const y = sy + b * rh;
    d.withAlpha(a, () => {
      d.rect(sx, y + 0.5, stackW * 0.36, Math.max(1, rh - 1.5), { fill: alpha(p.ink2, 0.18) });
      d.rect(sx + stackW * 0.42, y + 0.5, stackW * 0.27, Math.max(1, rh - 1.5), { fill: alpha(lat.c, 0.7) });
      d.rect(sx + stackW * 0.73, y + 0.5, stackW * 0.27, Math.max(1, rh - 1.5), { fill: alpha(w.c, 0.7) });
    });
  }
  // rótulos de las columnas
  const la = fr(S, 'kv-price', 0.55, 0.7);
  d.withAlpha(la, () => {
    const ly = sy - 6 * u;
    fitText(S, S.l(`${LLAMA.layers} bloques`, `${LLAMA.layers} blocks`), sx + stackW * 0.18, ly, stackW * 0.4, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
    fitText(S, S.l('clave', 'key'), sx + stackW * 0.555, ly, stackW * 0.3, { size: 12, weight: 700, color: lat.ink, align: 'center', base: 'bottom' });
    fitText(S, S.l('valor', 'value'), sx + stackW * 0.865, ly, stackW * 0.3, { size: 12, weight: 700, color: w.ink, align: 'center', base: 'bottom' });
  });
  // la cuenta (kv-llama)
  if (S.on('kv-llama')) {
    const box: Rect = P ? { x: R.x, y: sy + stackH + 18 * u, w: R.w, h: R.y + R.h - (sy + stackH + 18 * u) } : { x: sx + stackW + 36 * u, y: R.y + R.h * 0.18, w: R.x + R.w - (sx + stackW + 36 * u), h: R.h * 0.64 };
    const lines: [string, 'ink' | 'lat' | 'w' | 'dat', number][] = [
      [S.l('2 (una clave y un valor)', '2 (one key and one value)'), 'ink', 0.08],
      [S.l(`× ${LLAMA.layers} bloques`, `× ${LLAMA.layers} blocks`), 'ink', 0.2],
      [S.l(`× ${S.n(KV_NUMS, 0)} números cada uno`, `× ${S.n(KV_NUMS, 0)} numbers each`), 'ink', 0.32],
      [S.l('× 2 bytes por número', '× 2 bytes per number'), 'ink', 0.44],
      [S.l(`= ${S.n(KV_TOKEN, 0)} bytes por token`, `= ${S.n(KV_TOKEN, 0)} bytes per token`), 'lat', 0.6],
      [S.l(`≈ ${S.n(KV_TOKEN / 1e6, 2)} MB por token`, `≈ ${S.n(KV_TOKEN / 1e6, 2)} MB per token`), 'lat', 0.72],
    ];
    const lhh = Math.min(fz(S, 15) * u * 1.45, box.h / lines.length);
    const size = Math.min(15, Math.max(12.2 / u, lhh / u / 1.45));
    lines.forEach(([t, tn, at], i) => {
      const a = fr(S, 'kv-llama', at, at + 0.1);
      fitText(S, t, box.x + (P ? box.w / 2 : 0), box.y + i * lhh, box.w, { size, weight: i >= 4 ? 800 : 600, font: 'mono', color: tn === 'ink' ? p.ink2 : tone(S, tn).ink, align: P ? 'center' : 'left', base: 'top', a });
    });
  }
}

// ═════════ la memoria de una H100 ═════════
export function drawMemory(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), T = tight(S), lat = tone(S, 'lat'), w = tone(S, 'w');
  const multi = S.on('kv-many');
  const ctx = S.st.ctxShown ?? 1000;
  const barW = R.w, bx = R.x, bh = Math.max(34 * u, Math.min(64 * u, R.h * 0.14));
  const titleH = fz(S, 14) * u * 1.4, readH = fz(S, 22) * u * 1.25 + fz(S, 12) * u * 1.4;
  // todo el conjunto (título, lecturas, barra, marcas y nota) se centra en vertical
  const contentH = titleH + 10 * u + readH + 12 * u + bh + 6 * u + fz(S, 12) * u * 1.4 + 14 * u + fz(S, 13.5) * u * 2.6;
  const top = R.y + (T ? 0 : Math.max(0, (R.h - contentH) / 2 - 8 * u));
  const by = top + titleH + 10 * u + readH + 12 * u;
  const X = (bytes: number) => bx + barW * clamp(bytes / H100.mem);
  // título
  fitText(S, S.l('memoria de una H100: 80 GB', 'memory of an H100: 80 GB'), R.x, top, R.w, { size: 14, weight: 800, color: p.ink, base: 'top' });
  // la barra
  d.rect(bx, by, barW, bh, { fill: p.surface2, stroke: p.lineStrong, lw: 1.2, r: 3 });
  // pesos
  const wx = X(W_BYTES);
  d.rect(bx, by, wx - bx, bh, { fill: alpha(w.c, 0.8), r: 3 });
  fitText(S, S.l('pesos', 'weights'), (bx + wx) / 2, by + bh / 2, wx - bx - 6 * u, { size: 13, weight: 800, color: p.stage, align: 'center', base: 'middle' });
  // marcas
  const ty = by + bh + 6 * u;
  for (let g = 0; g <= 80; g += 20) {
    const x = X(g * 1e9);
    d.line(x, by + bh, x, by + bh + 4 * u, p.lineStrong, 1.2);
    fitText(S, g === 80 ? '80 GB' : String(g), x, ty, 60 * u, { size: 12, weight: 600, font: 'mono', color: p.mute, align: g === 0 ? 'left' : g === 80 ? 'right' : 'center', base: 'top' });
  }
  const below = ty + fz(S, 12) * u * 1.4 + 14 * u;
  // ── una conversación ──
  const aOne = 1 - (multi ? fr(S, 'kv-many', 0, 0.12) : 0);
  if (aOne > 0.01) d.withAlpha(aOne, () => {
    const kv = kvBytes(ctx), cx2 = X(W_BYTES + kv);
    d.rect(wx + 1, by + 1, Math.max(1, cx2 - wx - 1), bh - 2, { fill: alpha(lat.c, 0.75), r: 2 });
    if (cx2 - wx > d.measure(S.l('caché', 'cache'), { size: fz(S, 13), weight: 800 }) + 10 * u) fitText(S, S.l('caché', 'cache'), (wx + cx2) / 2, by + bh / 2, cx2 - wx - 6 * u, { size: 13, weight: 800, color: p.stage, align: 'center', base: 'middle' });
    // lecturas
    const ry = top + titleH + 8 * u;
    const half = R.w / 2 - 8 * u;
    fitText(S, S.l('largo de la conversación', 'conversation length'), R.x, ry, half, { size: 12, weight: 700, color: p.mute, base: 'top' });
    const ctxT = S.st.ctxTarget ?? ctx;   // el número muestra el valor elegido; la barra se mueve con suavidad
    fitText(S, S.l(`${int(S, ctxT)} tokens`, `${int(S, ctxT)} tokens`), R.x, ry + fz(S, 12) * u * 1.4, half, { size: 22, weight: 800, font: 'mono', color: tone(S, 'sig').ink, base: 'top' });
    fitText(S, S.portrait ? S.l('su caché', 'its cache') : S.l('caché de esa conversación', 'that conversation’s cache'), R.x + R.w, ry, half, { size: 12, weight: 700, color: p.mute, align: 'right', base: 'top' });
    fitText(S, gb(S, kvBytes(ctxT)), R.x + R.w, ry + fz(S, 12) * u * 1.4, half, { size: 22, weight: 800, font: 'mono', color: lat.ink, align: 'right', base: 'top' });
    // pesos frente a caché
    const more = kvBytes(ctxT) > W_BYTES ? 1 : 0;
    const msg = more ? S.l('la caché ya pesa más que el modelo entero', 'the cache now weighs more than the whole model') : S.l(`los pesos: ${gb(S, W_BYTES, 2)}, siempre los mismos`, `the weights: ${gb(S, W_BYTES, 2)}, always the same`);
    note(S, msg, R.x + R.w / 2, below, R.w, more ? 'lat' : 'w', { size: 13.5, a: fr(S, 'kv-demo', 0.12, 0.25) });
  });
  // ── muchas conversaciones ──
  if (multi) {
    const long = S.on('kv-long');
    const scen = [[8000, fr(S, 'kv-many', 0.05, 0.15) * (long ? 1 - fr(S, 'kv-long', 0, 0.15) : 1), 'kv-many'], [128000, long ? fr(S, 'kv-long', 0.1, 0.22) : 0, 'kv-long']] as const;
    for (const [C, a, seg] of scen) {
      if (a <= 0.01) continue;
      const n = maxUsers(C), per = kvBytes(C), grow = fr(S, seg, 0.15, 0.7, 'lin');
      const k = Math.round(grow * n);
      d.withAlpha(a, () => {
        for (let i = 0; i < k; i++) {
          const x1 = X(W_BYTES + i * per), x2 = X(W_BYTES + (i + 1) * per);
          d.rect(x1 + 0.6, by + 2, Math.max(1, x2 - x1 - 1.2), bh - 4, { fill: alpha(lat.c, i % 2 ? 0.6 : 0.8), r: 1 });
        }
        const ry = top + titleH + 8 * u;
        fitText(S, S.l(`conversaciones de ${int(S, C)} tokens`, `conversations of ${int(S, C)} tokens`), R.x, ry, R.w * 0.62, { size: 12, weight: 700, color: p.mute, base: 'top' });
        fitText(S, S.l(`caben ${k}`, `${k} fit`), R.x, ry + fz(S, 12) * u * 1.4, R.w * 0.5, { size: 22, weight: 800, font: 'mono', color: lat.ink, base: 'top' });
        fitText(S, S.l('cada una', 'each one'), R.x + R.w, ry, R.w * 0.36, { size: 12, weight: 700, color: p.mute, align: 'right', base: 'top' });
        fitText(S, gb(S, per), R.x + R.w, ry + fz(S, 12) * u * 1.4, R.w * 0.36, { size: 22, weight: 800, font: 'mono', color: lat.ink, align: 'right', base: 'top' });
        const free = H100.mem - W_BYTES - n * per;
        const msg = C === 8000 ? S.l('cada persona trae su caché; los pesos se guardan una sola vez', 'each person brings a cache; the weights are stored only once')
          : S.l(`sobran ${gb(S, free)}: no cabe otra conversación`, `${gb(S, free)} left over: no room for another conversation`);
        note(S, msg, R.x + R.w / 2, below, R.w, C === 8000 ? 'w' : 'lat', { size: 13.5, a: fr(S, seg, 0.55, 0.7) });
      });
    }
  }
}
