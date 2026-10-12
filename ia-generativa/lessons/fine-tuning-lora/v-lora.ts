// La idea de LoRA, pieza por pieza:
//   lora-idea, lora-table, lora-big  tabla original (congelada) + corrección = tabla ajustada; una casilla con sus números reales;
//   mult-table, rank1, rank2, ba-name  la tabla de multiplicar (columna × fila), rango uno, rango dos, y los nombres B y A;
//   count … gpt3-table               el esquema B · A de la capa del centro (32 × 32) y el deslizador de rango; las cuentas de GPT-3;
//   paper                             1 de cada 10 000 parámetros, y la memoria (Hu et al., 2021);
//   b-zero, adapters                  B empieza en cero (corrida REAL del modelo diminuto); un modelo base y un adaptador por tarea.
// Las tablas de la capa del centro son las REALES del modelo diminuto (base.ts y la corrida de LoRA); las tiras B y A del
// deslizador son ilustrativas (las cuentas sí son exactas) y así se rotulan.
import { alpha, clamp, gauss, rng, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BASE } from './base';
import { ap, area, arrowP, card, fitSize, fitText, fr, hold, isShort, lineH, lines, memBar, mv, pill, provenance, txt } from './draw';
import { getRun, STEPS } from './runs';
import { alp, drawSigned, lock, maxAbs } from './ui';
import { LORA_R } from './v-toy';

const RANGE0 = maxAbs(BASE.W2) * 0.9;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ═════════ 1 · tabla original + corrección = tabla ajustada ═════════
export function drawLoraIdea(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait || short;
  const fin = getRun(LORA_R).at(STEPS), dW = fin.dW, W1 = BASE.W2.map((v, k) => v + dW[k]);
  const dRange = Math.max(0.3, maxAbs(dW));
  const opW = (port ? 22 : 40) * u, headH = lineH(S, 13, 1.25) * 2 + 8 * u, footH = lineH(S, 13, 1.3) * (port ? 4.2 : 3.4);
  const side = Math.min((A.w - 2 * opW) / 3, A.h - headH - footH - 10 * u);
  const total = 3 * side + 2 * opW, x0 = A.x + (A.w - total) / 2, y0 = A.y + headH + Math.max(0, (A.h - headH - footH - side) / 2) * (short ? 0.3 : 0.5);
  const X = [x0, x0 + side + opW, x0 + 2 * (side + opW)];
  const a1 = ap(S, 'lora-idea', 0.08, 0.2), aLock = ap(S, 'lora-idea', 0.3, 0.42), a2 = ap(S, 'lora-idea', 0.5, 0.62), a3 = ap(S, 'lora-idea', 0.74, 0.86);
  const heads: [string, string, string, number, 'ink' | 'w'][] = [
    [port ? S.l('original', 'original') : S.l('parámetros originales', 'original parameters'), S.l('congelados', 'frozen'), '', a1, 'ink'],
    [S.l('corrección', 'correction'), port ? S.l('aparte', 'separate') : S.l('se aprende aparte', 'learned separately'), '', a2, 'w'],
    [port ? S.l('ajustado', 'tuned') : S.l('modelo ajustado', 'tuned model'), port ? S.l('la suma', 'the sum') : S.l('original + corrección', 'original + correction'), '', a3, 'ink'],
  ];
  heads.forEach(([h1, h2, , a, t], i) => {
    const cx = X[i] + side / 2;
    fitText(S, h1, cx, y0 - headH + lineH(S, 13, 1.25) / 2, side + opW * 0.9, { s: 13, weight: 800, c: t === 'w' ? tone(S, 'w').ink : p.ink, align: 'center', a });
    fitText(S, h2, cx, y0 - headH + lineH(S, 13, 1.25) * 1.5 + 2 * u, side + opW * 0.9, { s: 12, weight: 600, c: p.mute, align: 'center', a: i === 0 ? a * aLock : a });
  });
  drawSigned(S, X[0], y0, BASE.W2, 32, 32, side / 32, { range: RANGE0, neutral: true, a: a1 });
  lock(S, X[0] + side - 12 * u, y0 + 14 * u, 18 * u, aLock);
  txt(S, '+', X[0] + side + opW / 2, y0 + side / 2, { s: port ? 20 : 28, weight: 800, c: p.ink2, align: 'center', a: a2 });
  drawSigned(S, X[1], y0, dW, 32, 32, side / 32, { range: dRange, a: a2 });
  txt(S, '=', X[1] + side + opW / 2, y0 + side / 2, { s: port ? 20 : 28, weight: 800, c: p.ink2, align: 'center', a: a3 });
  drawSigned(S, X[2], y0, W1, 32, 32, side / 32, { range: RANGE0, neutral: true, a: a3 });

  // lora-table: es una tabla (matriz) de 32 × 32; una casilla y sus números reales
  const yF = y0 + side + 12 * u;
  if (S.on('lora-table')) {
    const aT = hold(S, 'lora-table', 'lora-big', 0.06, 0.16), aC = ap(S, 'lora-table', 0.5, 0.62);
    d.withAlpha(aT, () => X.forEach((x) => fitText(S, S.l('32 × 32', '32 × 32'), x + side / 2, yF + lineH(S, 12, 1.2) / 2, side, { s: 12.5, weight: 700, mono: true, c: p.mute, align: 'center' })));
    const i = 9, j = 21, c = side / 32, k = i * 32 + j;
    d.withAlpha(aC, () => {
      X.forEach((x) => d.rect(x + j * c - 2 * u, y0 + i * c - 2 * u, c + 4 * u, c + 4 * u, { stroke: tone(S, 'err').c, lw: 2.4 }));
      const eq = `${S.n(BASE.W2[k], 2)}  +  ${S.n(dW[k], 2)}  =  ${S.n(W1[k], 2)}`;
      const s = fitSize(S, eq, A.w * 0.9, port ? 15 : 18, true, 800);
      d.text(eq, A.x + A.w / 2, yF + lineH(S, 12, 1.2) + 8 * u + lineH(S, 18, 1) / 2, { size: s, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'center', base: 'middle', a: aT });
      fitText(S, S.l('una casilla: original + corrección = ajustada', 'one cell: original + correction = tuned'), A.x + A.w / 2, yF + lineH(S, 12, 1.2) + 8 * u + lineH(S, 18, 1) + 12 * u, A.w, { s: 12, c: p.mute, align: 'center', a: aT });
    });
  }
  // lora-big: si cada casilla fuera libre, 1 024 números que entrenar
  if (S.on('lora-big')) {
    const aB = ap(S, 'lora-big', 0.1, 0.22), aQ = ap(S, 'lora-big', 0.62, 0.74);
    fitText(S, S.l(`${S.n(1024, 0)} casillas libres = ${S.n(1024, 0)} números que entrenar`, `${S.n(1024, 0)} free cells = ${S.n(1024, 0)} numbers to train`), A.x + A.w / 2, yF + lineH(S, 14, 1.2) / 2 + 4 * u, A.w, { s: 14, weight: 800, c: tone(S, 'err').ink, align: 'center', a: aB });
    pill(S, S.l('¿y con muchos menos?', 'what about far fewer?'), X[1] + side / 2, yF + lineH(S, 14, 1.2) + lineH(S, 13, 1) + 16 * u, { s: 13, tone: 'w', a: aQ });
  }
  provenance(S, S.l('tablas reales: la capa del centro del modelo diminuto y una corrección LoRA entrenada', 'real tables: the tiny model’s middle layer and a trained LoRA correction'), a1);
  void alp; void short;
}

// ═════════ 2 · piezas columna × fila ═════════
const COLS = [[1, 2, 3, 4, 5, 6], [3, 1, 0, 2, 1, 2], [0, 2, 1, 1, 3, 0]];
const ROWS = [[1, 2, 3, 4, 5, 6], [1, 2, 3, 0, 1, 2], [2, 0, 1, 3, 0, 1]];

export function drawPieces(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, w = tone(S, 'w'), sg = tone(S, 'sig');
  const n = 6, side = port ? A.w : A.w * 0.62;
  const headH = lineH(S, 13, 1.3);
  const c = Math.min((side - 6 * u) / (n + 2.3), (A.h - headH * (port ? 4.6 : 1.6)) / (n + 2.3), 56 * u);
  const gx = 0.3 * c;                       // separación entre las cabeceras y la tabla
  const tx = A.x + (port ? (A.w - (n + 2) * c - gx) / 2 : 0) + 2 * c + gx, ty = A.y + headH + 2 * c + gx;
  // qué se ve: tabla de multiplicar → otra pieza (rango 1) → dos piezas (rango 2)
  const k1 = S.on('rank1') ? mv(S, 'rank1', 0.08, 0.26) : 0;            // de la tabla de multiplicar a otra pieza
  const k2 = S.on('rank2') ? mv(S, 'rank2', 0.2, 0.36) : 0;             // aparece la segunda pieza
  const kSum = S.on('rank2') ? mv(S, 'rank2', 0.42, 0.6) : 0;           // la tabla pasa a ser la suma
  const col1 = COLS[0].map((v, i) => lerp(v, COLS[1][i], k1)), row1 = ROWS[0].map((v, i) => lerp(v, ROWS[1][i], k1));
  const val = (i: number, j: number) => col1[i] * row1[j] + kSum * COLS[2][i] * ROWS[2][j];
  let vmax = 1; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) vmax = Math.max(vmax, val(i, j));
  const aTab = ap(S, 'mult-table', 0.04, 0.16);
  const fill = S.on('rank1') ? 1 : mv(S, 'mult-table', 0.32, 0.8);     // las casillas se llenan fila por fila
  const fmt = (v: number) => S.n(Math.round(v), 0);
  // cabeceras: columna(s) a la izquierda, fila(s) arriba; la pieza 2 va por fuera de la 1
  const hdr = (x: number, y: number, v: number, t: typeof w, a: number, hot = 0) => d.withAlpha(a, () => {
    d.rect(x + 1, y + 1, c - 2, c - 2, { fill: alpha(t.c, 0.14 + 0.25 * hot), stroke: t.c, lw: 1.4 + hot, r: 3 });
    txt(S, fmt(v), x + c / 2, y + c / 2 + 1, { s: Math.min(17, c / u * 0.42), weight: 800, mono: true, c: t.ink, align: 'center' });
  });
  const hotI = 3, hotJ = 4, hot = S.is('mult-table') ? ap(S, 'mult-table', 0.84, 0.94) : 0;
  for (let i = 0; i < n; i++) hdr(tx - c - gx, ty + i * c, col1[i], w, aTab, i === hotI ? hot : 0);
  for (let j = 0; j < n; j++) hdr(tx + j * c, ty - c - gx, row1[j], w, aTab, j === hotJ ? hot : 0);
  if (k2 > 0) {
    for (let i = 0; i < n; i++) hdr(tx - 2 * c - gx, ty + i * c, COLS[2][i], sg, k2);
    for (let j = 0; j < n; j++) hdr(tx + j * c, ty - 2 * c - gx, ROWS[2][j], sg, k2);
  }
  txt(S, '×', tx - c / 2 - gx / 2, ty - c / 2 - gx / 2, { s: Math.min(18, c / u * 0.45), weight: 800, c: p.mute, align: 'center', a: aTab });
  // la tabla
  d.withAlpha(aTab, () => {
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = clamp(fill * n * n - (i * n + j)), v = val(i, j), x = tx + j * c, y = ty + i * c;
      d.rect(x, y, c, c, { fill: p.surface, stroke: p.line, lw: 1 });
      if (a <= 0) continue;
      d.withAlpha(a, () => {
        d.rect(x + 1, y + 1, c - 2, c - 2, { fill: alp(w.c, 0.06 + 0.5 * (v / vmax)) });
        txt(S, fmt(v), x + c / 2, y + c / 2 + 1, { s: Math.min(16, c / u * 0.4), weight: 700, mono: true, c: p.ink, align: 'center' });
      });
    }
    d.rect(tx - 0.5, ty - 0.5, n * c + 1, n * c + 1, { stroke: p.lineStrong, lw: 1.6 });
    if (hot > 0) d.rect(tx + hotJ * c - 1, ty + hotI * c - 1, c + 2, c + 2, { stroke: tone(S, 'err').c, lw: 2.6, a: hot });
  });

  // lecturas (a la derecha en horizontal, abajo en vertical)
  const R: Rect = port ? { x: A.x, y: ty + n * c + 14 * u, w: A.w, h: A.y + A.h - (ty + n * c + 14 * u) } : { x: tx + n * c + 34 * u, y: ty, w: A.x + A.w - (tx + n * c + 34 * u), h: n * c };
  const L = (i: number) => R.y + lineH(S, 14, 1.35) * (i + 0.5);
  const r2 = S.on('rank2');
  const nums = r2 ? 24 : 12;
  const rows: [string, number, string?][] = [
    [S.l('36 casillas', '36 cells'), ap(S, 'mult-table', 0.2, 0.32)],
    [S.l(`salen de ${nums} números`, `come from ${nums} numbers`), ap(S, 'mult-table', 0.5, 0.62)],
    [r2 ? S.l('rango 2: dos piezas sumadas', 'rank 2: two pieces added') : S.l('rango 1: una pieza, columna × fila', 'rank 1: one piece, column × row'), S.on('rank1') ? ap(S, 'rank1', 0.6, 0.72) : 0, 'w'],
  ];
  if (port) {
    const line = rows.filter((r) => r[1] > 0.01);
    fitText(S, `${rows[0][0]} · ${rows[1][0]}`, R.x + R.w / 2, R.y + lineH(S, 14, 1.3) / 2, R.w, { s: 14, weight: 700, c: p.ink, align: 'center', a: rows[1][1] > 0 ? 1 : rows[0][1] });
    if (rows[2][1] > 0) fitText(S, rows[2][0], R.x + R.w / 2, R.y + lineH(S, 14, 1.3) * 1.5 + 4 * u, R.w, { s: 14, weight: 800, c: w.ink, align: 'center', a: rows[2][1] });
    void line;
  } else {
    rows.forEach(([t, a, tn], i) => fitText(S, t, R.x, L(i * 1.2), R.w, { s: 15, weight: i === 2 ? 800 : 700, c: tn ? w.ink : p.ink, a }));
    if (hot > 0) fitText(S, S.l(`fila 4, columna 5: ${fmt(4)} × ${fmt(5)} = ${fmt(20)}`, `row 4, column 5: ${fmt(4)} × ${fmt(5)} = ${fmt(20)}`), R.x, L(4), R.w, { s: 13.5, weight: 700, mono: true, c: tone(S, 'err').ink, a: hot });
  }

  // ba-name: las columnas juntas son B; las filas juntas, A; B × A es la corrección, que se suma a la tabla congelada
  if (S.on('ba-name')) {
    const aB = ap(S, 'ba-name', 0.12, 0.26), aA = ap(S, 'ba-name', 0.36, 0.5), aS = ap(S, 'ba-name', 0.62, 0.76);
    const bx = tx - 2 * c - gx, ay = ty - 2 * c - gx;
    d.withAlpha(aB, () => {
      d.rect(bx - 4 * u, ty - 4 * u, 2 * c + 8 * u, n * c + 8 * u, { stroke: w.c, lw: 2.4, r: 4 });
      pill(S, 'B', bx + c, ty + n * c + 4 * u + lineH(S, 15, 1) * 0.75, { s: 15, tone: 'w', solid: true });
    });
    d.withAlpha(aA, () => {
      d.rect(tx - 4 * u, ay - 4 * u, n * c + 8 * u, 2 * c + 8 * u, { stroke: w.c, lw: 2.4, r: 4 });
      pill(S, 'A', tx - c - gx / 2, ay + c / 2, { s: 15, tone: 'w', solid: true });
    });
    const t1 = S.l('corrección = B × A', 'correction = B × A'), t2 = S.l('se suma a la tabla congelada', 'added to the frozen table');
    if (port) {
      fitText(S, `${t1} · ${t2}`, R.x + R.w / 2, R.y + lineH(S, 14, 1.3) * 2.6 + 4 * u, R.w, { s: 13.5, weight: 800, c: w.ink, align: 'center', a: aS });
    } else {
      fitText(S, t1, R.x, L(4.4), R.w, { s: 16, weight: 800, mono: true, c: w.ink, a: aS });
      d.withAlpha(aS, () => { lock(S, R.x + 10 * u, L(5.6), 16 * u); fitText(S, t2, R.x + 26 * u, L(5.6), R.w - 26 * u, { s: 13.5, weight: 700, c: p.ink2 }); });
    }
  }
  void card;
}

// ═════════ 3 · el esquema B · A de la capa del centro, con el deslizador de rango ═════════
const RMAX = 32;
// tiras ilustrativas: las primeras r columnas de BB y las primeras r filas de AA (subir el rango agrega piezas sin cambiar las anteriores)
const BB: number[] = (() => { const g = rng(27); return Array.from({ length: 32 * RMAX }, () => gauss(g)); })();
const AA: number[] = (() => { const g = rng(28); return Array.from({ length: RMAX * 32 }, () => gauss(g)); })();
const DW_CACHE = new Map<number, number[]>();
function deltaOf(r: number): number[] {
  let D = DW_CACHE.get(r);
  if (!D) { D = new Array(32 * 32).fill(0); for (let i = 0; i < 32; i++) for (let j = 0; j < 32; j++) { let s = 0; for (let k = 0; k < r; k++) s += BB[i * RMAX + k] * AA[k * 32 + j]; D[i * 32 + j] = s / Math.sqrt(r); } DW_CACHE.set(r, D); }
  return D;
}

export const rankOf = (S: Frame) => Math.max(1, Math.min(RMAX, Math.round(Number(S.p.r ?? 2))));

export function drawCount(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, short = isShort(S), w = tone(S, 'w');
  const r = rankOf(S), rs = clamp(Number(S.st.rShow ?? r), 1, RMAX);
  // el esquema: B (32 × r) a la izquierda, A (r × 32) arriba, la corrección (32 × 32) abajo a la derecha
  const box: Rect = port ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.56 } : { x: A.x, y: A.y, w: A.w * 0.52, h: A.h };
  const lab = lineH(S, 13, 1.2) + 6 * u;
  const c = Math.min((box.w - lab) / (32 + Math.max(6, rs) + 3), (box.h - lab * 2) / (32 + Math.max(6, rs) + 3));
  const gap = 2 * c, ext = (32 + rs) * c + gap;
  const ox = box.x + (box.w - ext) / 2 + (port ? 0 : -lab * 0.2), oy = box.y + lab + Math.max(0, (box.h - lab * 2 - ext) / 2);
  const bx = ox, by = oy + rs * c + gap, axx = ox + rs * c + gap, ay = oy, dx = axx, dy = by;
  const ri = Math.max(1, Math.round(rs));
  const Bm = new Array(32 * ri), Am = new Array(ri * 32);
  for (let i = 0; i < 32; i++) for (let k = 0; k < ri; k++) Bm[i * ri + k] = BB[i * RMAX + k];
  for (let k = 0; k < ri; k++) for (let j = 0; j < 32; j++) Am[k * 32 + j] = AA[k * 32 + j];
  const aS = ap(S, 'count', 0.06, 0.2);
  d.withAlpha(aS, () => {
    drawSigned(S, bx, by, Bm, 32, ri, (rs * c) / ri, { range: 2.2, cellH: c });
    drawSigned(S, axx, ay, Am, ri, 32, c, { range: 2.2, cellH: (rs * c) / ri });
    S.d.rect(axx - 0.5, ay - 0.5, 32 * c + 1, rs * c + 1, { stroke: p.lineStrong, lw: 1.5 });
    drawSigned(S, dx, dy, deltaOf(ri), 32, 32, c, { range: 2.6 });
    fitText(S, 'B', bx + (rs * c) / 2, by + 32 * c + lab / 2 + 2 * u, Math.max(rs * c, 20 * u), { s: 15, weight: 800, c: w.ink, align: 'center' });
    fitText(S, 'A', axx - lab / 2 - 2 * u, ay + (rs * c) / 2, lab, { s: 15, weight: 800, c: w.ink, align: 'center' });
    fitText(S, S.l('corrección = B × A', 'correction = B × A'), dx + 16 * c, dy + 32 * c + lab / 2 + 2 * u, 32 * c + 20 * u, { s: 13, weight: 700, c: p.ink2, align: 'center' });
    fitText(S, S.l(`rango ${r}`, `rank ${r}`), ox, oy - lab / 2, rs * c + gap + 32 * c, { s: 14, weight: 800, c: w.ink });
  });

  // las cuentas
  const R: Rect = port ? { x: A.x, y: box.y + box.h + 8 * u, w: A.w, h: A.y + A.h - (box.y + box.h + 8 * u) } : { x: box.x + box.w + 26 * u, y: A.y + (short ? 0 : A.h * 0.04), w: A.w - box.w - 26 * u, h: A.h };
  const full = 1024, lora = r * 64;
  const lh = lineH(S, port ? 13 : 14, 1.3), mx = Math.max(full, lora), bh = (port ? 9 : 12) * u;
  let y = R.y;
  const aF = ap(S, 'count', 0.18, 0.3), aL = ap(S, 'count', 0.55, 0.68);
  d.withAlpha(aF, () => {
    fitText(S, S.l(`tabla completa: 32 × 32 = ${S.n(full, 0)}`, `full table: 32 × 32 = ${S.n(full, 0)}`), R.x, y + lh / 2, R.w, { s: port ? 13 : 14, weight: 700, mono: true, c: p.ink });
    memBar(S, R.x, y + lh + 2 * u, R.w, bh, full / mx, { tone: 'mute' });
  });
  y += lh + bh + (port ? 8 : 14) * u;
  d.withAlpha(aL, () => {
    fitText(S, S.l(`B y A: ${r} × (32 + 32) = ${S.n(lora, 0)}`, `B and A: ${r} × (32 + 32) = ${S.n(lora, 0)}`), R.x, y + lh / 2, R.w, { s: port ? 13 : 14, weight: 800, mono: true, c: w.ink });
    memBar(S, R.x, y + lh + 2 * u, R.w, bh, lora / mx, { tone: 'w' });
    const ratio = full / lora, rd = Math.abs(ratio - Math.round(ratio)) < 0.05 ? 0 : 1;
    const msg = lora < full ? S.l(`${S.n(ratio, rd)} veces menos números`, `${S.n(ratio, rd)} times fewer numbers`) : lora === full ? S.l('tantos como la tabla entera', 'as many as the whole table') : S.l('ya no ahorra: más que la tabla entera', 'no longer saves: more than the whole table');
    fitText(S, msg, R.x, y + lh + bh + 6 * u + lh / 2, R.w, { s: 13, weight: 800, c: lora <= full ? w.ink : tone(S, 'err').ink });
  });
  y += 2 * lh + bh + (port ? 10 : 26) * u;
  // GPT-3 (desde gpt3-table)
  if (S.on('gpt3-table')) {
    const aG = ap(S, 'gpt3-table', 0.06, 0.2), d3 = 12288, f3 = d3 * d3, l3 = r * (d3 + d3);
    d.withAlpha(aG, () => {
      if (!port) { d.line(R.x, y - 8 * u, R.x + R.w, y - 8 * u, p.line, 1); }
      fitText(S, S.l(`una tabla de GPT-3: ${S.n(d3, 0)} × ${S.n(d3, 0)}`, `one GPT-3 table: ${S.n(d3, 0)} × ${S.n(d3, 0)}`), R.x, y + lh / 2, R.w, { s: port ? 12.5 : 13.5, weight: 700, mono: true, c: p.ink });
      y += lh;
      fitText(S, S.l(`= ${S.n(f3, 0)} números`, `= ${S.n(f3, 0)} numbers`), R.x, y + lh / 2, R.w, { s: port ? 12.5 : 13.5, weight: 700, mono: true, c: p.ink });
      y += lh;
      fitText(S, S.l(`B y A, rango ${r}: ${S.n(l3, 0)}`, `B and A, rank ${r}: ${S.n(l3, 0)}`), R.x, y + lh / 2, R.w, { s: port ? 12.5 : 13.5, weight: 800, mono: true, c: w.ink });
      y += lh;
      fitText(S, S.l(`${S.n(f3 / l3, 0)} veces menos números`, `${S.n(f3 / l3, 0)} times fewer numbers`), R.x, y + lh / 2, R.w, { s: 13, weight: 800, c: w.ink });
    });
  }
  provenance(S, S.l('tiras B y A ilustrativas · las cuentas son exactas', 'illustrative B and A strips · the counts are exact'), aS);
  void arrowP; void fr; void card; void mv;
}

// ═════════ 4 · el resultado del artículo en GPT-3 ═════════
export function drawPaper(S: Frame) {
  const { d, ctx, pal: p } = S, A = area(S), u = S.u, port = S.portrait, w = tone(S, 'w');
  const s = port ? Math.min(A.w * 0.62, A.h * 0.5) : Math.min(A.h * 0.86, A.w * 0.42);
  const gx = port ? A.x + (A.w - s) / 2 : A.x, gy = A.y + (port ? 0 : (A.h - s) / 2);
  const aG = ap(S, 'paper', 0.06, 0.2), aH = ap(S, 'paper', 0.24, 0.36);
  d.withAlpha(aG, () => {
    d.rect(gx, gy, s, s, { fill: alp(p.ink, p.dark ? 0.1 : 0.06), stroke: p.lineStrong, lw: 1.5 });
    ctx.save(); ctx.strokeStyle = alp(p.ink, (s > 300 ? 0.16 : 0.12) * (p.dark ? 1.6 : 1)); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 1; i < 100; i++) { const t = Math.round(gx + (i * s) / 100) + 0.5; ctx.moveTo(t, gy); ctx.lineTo(t, gy + s); const q = Math.round(gy + (i * s) / 100) + 0.5; ctx.moveTo(gx, q); ctx.lineTo(gx + s, q); }
    ctx.stroke(); ctx.restore();
  });
  const ci = 61, cj = 38, cs = s / 100, hx = gx + cj * cs, hy = gy + ci * cs;
  d.withAlpha(aH, () => {
    d.rect(hx, hy, Math.max(cs, 2), Math.max(cs, 2), { fill: w.c });
    d.circle(hx + cs / 2, hy + cs / 2, 9 * u + 6 * u * (1 - aH), { stroke: w.c, lw: 2.2 });
  });
  const R: Rect = port ? { x: A.x, y: gy + s + 12 * u, w: A.w, h: A.y + A.h - (gy + s + 12 * u) } : { x: gx + s + 30 * u, y: A.y, w: A.w - s - 30 * u, h: A.h };
  const lh = lineH(S, 14, 1.3);
  let y = port ? R.y : R.y + R.h * 0.08;
  const hl = lines(S, S.l('GPT-3: LoRA entrena 1 de cada 10 000 parámetros', 'GPT-3: LoRA trains 1 out of every 10,000 parameters'), R.w, { s: port ? 13.5 : 15, weight: 800, max: 2 });
  hl.forEach((ln, k) => txt(S, ln, R.x, y + lh / 2 + k * lineH(S, port ? 13.5 : 15, 1.25), { s: port ? 13.5 : 15, weight: 800, c: w.ink, a: aH }));
  y += lh * (port ? 0.3 : 0.8) + hl.length * lineH(S, port ? 13.5 : 15, 1.25);
  const aM = ap(S, 'paper', 0.5, 0.64);
  d.withAlpha(aM, () => {
    fitText(S, S.l('memoria de GPU al entrenar', 'GPU memory while training'), R.x, y + lh / 2, R.w, { s: 13, weight: 700, c: p.mute });
    y += lh;
    const labW = Math.min(R.w * 0.42, 150 * u), bw = R.w - labW, bh = (port ? 12 : 16) * u;
    fitText(S, S.l('ajuste completo', 'full tuning'), R.x, y + bh / 2, labW - 8 * u, { s: 12.5, weight: 700, c: p.ink2 });
    memBar(S, R.x + labW, y, bw, bh, 1, { tone: 'err' });
    txt(S, '1.2 TB', R.x + labW + bw - 6 * u, y + bh / 2, { s: 12, weight: 800, mono: true, c: p.stage, align: 'right' });
    y += bh + 8 * u;
    fitText(S, 'LoRA', R.x, y + bh / 2, labW - 8 * u, { s: 12.5, weight: 700, c: p.ink2 });
    memBar(S, R.x + labW, y, bw, bh, 350 / 1200, { tone: 'w' });
    txt(S, '350 GB', R.x + labW + bw * (350 / 1200) + 6 * u, y + bh / 2, { s: 12, weight: 800, mono: true, c: w.ink });
    y += bh + 8 * u;
    fitText(S, S.l('unas 3 veces menos', 'about 3 times less'), R.x + labW, y + lh / 2, bw, { s: 13, weight: 800, c: w.ink });
  });
  y += lh + (port ? 6 : 18) * u;
  pill(S, S.l('calidad: igual o mejor en sus pruebas', 'quality: equal or better in its tests'), R.x, y + lh / 2, { s: 13, tone: 'dat', align: 'left', a: ap(S, 'paper', 0.74, 0.86) });
  provenance(S, S.l('Hu et al., 2021 · GPT-3 de 175 mil millones de parámetros', 'Hu et al., 2021 · GPT-3, 175 billion parameters'), aG);
}

// ═════════ 5 · B empieza en cero (corrida real) ═════════
export function drawZero(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, w = tone(S, 'w');
  const run = getRun(LORA_R), st = Math.round(STEPS * mv(S, 'b-zero', 0.58, 0.95)), sn = run.at(st), fin = run.at(STEPS);
  const r = 2, lab = lineH(S, 13, 1.2) + 6 * u;
  const box: Rect = port ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.62 } : { x: A.x, y: A.y, w: A.w * 0.5, h: A.h };
  const c = Math.min((box.w - lab * 2) / (32 + r + 3), (box.h - lab * 2) / (32 + r + 3)) * (port ? 1 : 0.92);
  const ext = (32 + r) * c + 2 * c, ox = box.x + (box.w - ext) / 2, oy = box.y + lab + (box.h - lab * 2 - ext) / 2;
  const bx = ox, by = oy + r * c + 2 * c, axx = ox + r * c + 2 * c, ay = oy;
  const Bmax = Math.max(0.2, maxAbs(fin.B ?? [1])), Amax = Math.max(0.5, maxAbs(fin.A ?? [1])), Dmax = Math.max(0.2, maxAbs(fin.dW));
  const a0 = ap(S, 'b-zero', 0.04, 0.16);
  d.withAlpha(a0, () => {
    drawSigned(S, bx, by, sn.B ?? [], 32, r, c, { range: Bmax });
    drawSigned(S, axx + 0.4 * c, ay, sn.A ?? [], r, 32, c, { range: Amax });
    drawSigned(S, axx + 0.4 * c, by, sn.dW, 32, 32, c, { range: Dmax });
    txt(S, 'B', bx + r * c * 0.5, by + 32 * c + lab / 2 + 2 * u, { s: 15, weight: 800, c: w.ink, align: 'center' });
    txt(S, 'A', axx + 0.4 * c - lab / 2, ay + r * c / 2, { s: 15, weight: 800, c: w.ink, align: 'center' });
    fitText(S, S.l('corrección = B × A', 'correction = B × A'), axx + 0.4 * c + 16 * c, by + 32 * c + lab / 2 + 2 * u, 32 * c + 20 * u, { s: 13, weight: 700, c: p.ink2, align: 'center' });
  });
  const R: Rect = port ? { x: A.x, y: box.y + box.h + 8 * u, w: A.w, h: A.h - box.h - 8 * u } : { x: box.x + box.w + 26 * u, y: A.y + A.h * 0.18, w: A.w - box.w - 26 * u, h: A.h * 0.7 };
  const lh = lineH(S, 14, 1.35);
  const zA = hold(S, 'b-zero', undefined, 0.16, 0.28) * (1 - ap(S, 'b-zero', 0.56, 0.62));
  const steps: [string, number][] = [
    [S.l('al empezar, B = 0', 'at the start, B = 0'), ap(S, 'b-zero', 0.12, 0.24)],
    [S.l('→ corrección = 0', '→ correction = 0'), ap(S, 'b-zero', 0.26, 0.38)],
    [S.l('→ idéntico al modelo base', '→ identical to the base model'), ap(S, 'b-zero', 0.4, 0.52)],
    [S.l('entrenar: solo se mueven B y A', 'training: only B and A move'), ap(S, 'b-zero', 0.6, 0.72)],
  ];
  steps.forEach(([t, a], i) => fitText(S, t, R.x, R.y + lh * (i + 0.5) * (port ? 1 : 1.25), R.w, { s: port ? 13.5 : 15, weight: i === 3 ? 800 : 700, c: i === 3 ? w.ink : p.ink, a }));
  void zA;
  provenance(S, S.l('corrida real: LoRA de rango 2 en el modelo diminuto', 'real run: rank-2 LoRA in the tiny model'), a0);
}

// ═════════ 6 · un modelo base y un adaptador por tarea ═════════
export function drawAdapters(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, port = S.portrait, w = tone(S, 'w');
  const side = port ? Math.min(A.w * 0.48, A.h * 0.42) : Math.min(A.h * 0.62, A.w * 0.32);
  const mx = port ? A.x : A.x + A.w * 0.06, my = port ? A.y + lineH(S, 13, 1) + 12 * u : A.y + (A.h - side) / 2;
  const aM = ap(S, 'adapters', 0.04, 0.16);
  d.withAlpha(aM, () => {
    pill(S, S.l('un solo modelo base', 'a single base model'), mx + side / 2, my - lineH(S, 13, 1) / 2 - 6 * u, { s: 13, tone: 'ink' });
    drawSigned(S, mx, my, BASE.W2, 32, 32, side / 32, { range: RANGE0, neutral: true });
    lock(S, mx + side - 12 * u, my + 14 * u, 18 * u);
  });
  // tres adaptadores (una tira B y una tira A cada uno), por cliente
  const names = [S.l('cliente A', 'customer A'), S.l('cliente B', 'customer B'), S.l('cliente C', 'customer C')];
  const aw = port ? (A.w - 2 * 12 * u) / 3 : Math.min(150 * u, (A.w - side - A.w * 0.12) * 0.5), ah = port ? 54 * u : Math.min(72 * u, A.h * 0.22);
  const slot = (i: number): Rect => port
    ? { x: A.x + i * (aw + 12 * u), y: my + side + 30 * u, w: aw, h: ah }
    : { x: A.x + A.w - aw, y: A.y + A.h * 0.08 + i * (ah + (A.h * 0.84 - 3 * ah) / 2), w: aw, h: ah };
  const plug: Rect = port ? { x: mx + side + 26 * u, y: my + (side - ah) / 2, w: A.x + A.w - (mx + side + 26 * u), h: ah } : { x: mx + side + 26 * u, y: my + (side - ah) / 2, w: aw, h: ah };
  // cuál está enchufado: ninguno → A (0.42) → B (0.62) → C (0.8)
  const fA = fr(S, 'adapters', 0, 1), cur = fA >= 0.8 ? 2 : fA >= 0.62 ? 1 : fA >= 0.42 ? 0 : -1;
  const since = cur === 2 ? 0.8 : cur === 1 ? 0.62 : 0.42, kIn = cur >= 0 ? mv(S, 'adapters', since, since + 0.08) : 0;
  names.forEach((nm, i) => {
    const a = ap(S, 'adapters', 0.2 + i * 0.06, 0.3 + i * 0.06), s0 = slot(i), on = i === cur;
    const k = on ? kIn : 0, rr: Rect = { x: lerp(s0.x, plug.x, k), y: lerp(s0.y, plug.y, k), w: lerp(s0.w, plug.w, k), h: lerp(s0.h, plug.h, k) };
    d.withAlpha(a, () => {
      if (on) d.rect(s0.x, s0.y, s0.w, s0.h, { stroke: p.line, lw: 1, r: 5, dash: [4, 3] });
      drawAdapterIcon(S, rr, nm, i, on ? 1 : 0);
    });
  });
  if (cur >= 0) {
    d.withAlpha(kIn, () => { txt(S, '+', (mx + side + plug.x) / 2, my + side / 2, { s: 22, weight: 800, c: p.ink2, align: 'center' }); });
  }
  const aT = ap(S, 'adapters', 0.46, 0.58);
  const tl = S.l('adaptador = B y A: se pone, se quita o se cambia', 'adapter = B and A: add it, remove it, or swap it');
  fitText(S, tl, port ? A.x + A.w / 2 : mx, port ? A.y + A.h - lineH(S, 13.5, 1) / 2 : my + side + 24 * u, port ? A.w : A.w * 0.6, { s: 13.5, weight: 800, c: w.ink, align: port ? 'center' : 'left', a: aT });
  void card; void isShort;
}

function drawAdapterIcon(S: Frame, r: Rect, name: string, seed: number, on: number) {
  const { d, pal: p } = S, u = S.u, w = tone(S, 'w');
  d.rect(r.x, r.y, r.w, r.h, { fill: alpha(w.c, 0.08 + 0.08 * on), stroke: w.c, lw: 1.4 + on, r: 5 });
  const pad = 7 * u, bw = Math.max(5 * u, r.h * 0.12), lh = lineH(S, 12.5, 1);
  const top = r.y + pad, avail = r.h - 2 * pad - lh - 2 * u;
  // tira B (vertical) y tira A (horizontal), con un patrón distinto por cliente
  for (let k = 0; k < 6; k++) {
    const v = Math.sin(seed * 2.3 + k * 1.7), y = top + (k * avail) / 6;
    d.rect(r.x + pad, y, bw, avail / 6 - 1, { fill: alp(v >= 0 ? w.c : tone(S, 'sig').c, 0.25 + 0.6 * Math.abs(v)) });
  }
  const ax0 = r.x + pad + bw + 5 * u, aw = r.w - (ax0 - r.x) - pad;
  for (let k = 0; k < 8; k++) {
    const v = Math.cos(seed * 1.9 + k * 1.3);
    d.rect(ax0 + (k * aw) / 8, top, aw / 8 - 1, bw, { fill: alp(v >= 0 ? w.c : tone(S, 'sig').c, 0.25 + 0.6 * Math.abs(v)) });
  }
  fitText(S, name, r.x + r.w / 2, r.y + r.h - pad - lh / 2 + 2 * u, r.w - 2 * pad, { s: 12.5, weight: 800, c: on ? w.ink : p.ink2, align: 'center' });
}
