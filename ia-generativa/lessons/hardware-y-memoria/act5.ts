// Acto 5 · Cuantización: «menos colores», el laboratorio con pesos reales (una escala por matriz o por grupo), la pérdida medida del
// modelo completo, el doble beneficio (cabe y se lee más rápido) y la advertencia de Meta (mide con tus tareas). Turno 3.
import { alpha, clamp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LOSS, SAMPLE } from './real-data';
import { BITS_LIST, GB, GPUS, MARGIN, NB, PATCH_F32, bwText, effBits, fitOf, fullErr, fullZero, modelLoss, nf, quantOf, sig, type Scheme } from './model';
import { FS, check, chip, fitText, phases, tagText, verdict } from './ui';

type R3 = ReturnType<typeof regions>;

export function drawAct5(S: Frame, R: R3) {
  const [a0, a1, a2, a3, a4] = phases(S, ['quant-idea', 'round', 'real-loss', 'payoff', 'caution']);
  if (a0 > 0.005) S.d.withAlpha(a0, () => drawColors(S, R.all));
  if (a1 > 0.005) S.d.withAlpha(a1, () => drawLab(S));
  if (a2 > 0.005) S.d.withAlpha(a2, () => drawLoss(S, R.all));
  if (a3 > 0.005) S.d.withAlpha(a3, () => drawPayoff(S, R.all));
  if (a4 > 0.005) S.d.withAlpha(a4, () => drawCaution(S, R.all));
}

// ═════════════════════════════════════════════════════════════════════════
// «menos colores»: una imagen sencilla (ilustrativa, generada por fórmula) con 256, 16, 4 y 2 tonos
// ═════════════════════════════════════════════════════════════════════════
const IW = 30, IH = 20;
/** Imagen ilustrativa: sol, dos colinas y un árbol, con degradados suaves. Devuelve el tono de 0 a 1 de cada píxel. */
function scene(i: number, j: number): number {
  const x = (i + 0.5) / IW, y = (j + 0.5) / IH;
  let v = 0.78 - 0.5 * y;                                                     // cielo, más claro hacia el horizonte
  const ds = Math.hypot(x - 0.72, (y - 0.3) * 1.5);
  v += 0.22 * Math.exp(-((ds / 0.22) ** 2));                                  // resplandor
  if (ds < 0.11) v = 0.04;                                                    // sol
  const h1 = 0.62 + 0.07 * Math.sin(5 * x + 1), h2 = 0.8 + 0.07 * Math.sin(4 * x + 3);
  if (y > h1) v = 0.5 - 0.35 * (y - h1);                                      // colina lejana
  if (y > h2) v = 0.26 - 0.25 * (y - h2);                                     // colina cercana
  if (Math.abs(x - 0.2) < 0.018 && y > 0.5 && y < h2 + 0.02) v = 0.08;        // tronco
  if (Math.hypot(x - 0.2, (y - 0.46) * 1.3) < 0.085) v = 0.14;                // copa
  return clamp(v);
}

function drawColors(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const panels = [{ bits: 8, lv: 256, k: '1×' }, { bits: 4, lv: 16, k: '½' }, { bits: 2, lv: 4, k: '¼' }, { bits: 1, lv: 2, k: '⅛' }];
  const cols = port ? 2 : 4, rows = port ? 2 : 1, gap = 12 * u, labH = 40 * u;
  const pw = (all.w - gap * (cols - 1)) / cols, ph = (all.h - 22 * u - gap * (rows - 1)) / rows - labH;
  const cs = Math.min(pw / IW, ph / IH), W = cs * IW, H = cs * IH;
  d.withAlpha(S.reveal('quant-idea', 0, 0.6), () => d.text(S.l('Una imagen con menos colores (ilustrativa)', 'An image with fewer colors (illustrative)'), all.x, all.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', w: all.w }));
  panels.forEach((pn, n) => {
    const a = S.reveal('quant-idea', 0.4 + n * 0.7, 0.7);
    if (a <= 0) return;
    const cx = all.x + (n % cols) * (pw + gap) + (pw - W) / 2, cy = all.y + 24 * u + Math.floor(n / cols) * (ph + labH + gap);
    d.withAlpha(a, () => {
      for (let j = 0; j < IH; j++) for (let i = 0; i < IW; i++) {
        const v = scene(i, j), q = Math.round(v * (pn.lv - 1)) / (pn.lv - 1);
        d.rect(cx + i * cs, cy + j * cs, cs + 0.5, cs + 0.5, { fill: alpha(p.ink, 0.04 + 0.92 * q) });
      }
      d.rect(cx - 0.5, cy - 0.5, W + 1, H + 1, { stroke: p.lineStrong, lw: 1 });
      d.text(S.l(`${pn.lv} tonos`, `${pn.lv} shades`), cx + W / 2, cy + H + 6 * u, { size: FS(S, 13.5), weight: 800, color: p.ink, align: 'center', base: 'top' });
      d.text(S.l(`${pn.bits} ${pn.bits === 1 ? 'bit' : 'bits'} · ${pn.k} del tamaño`, `${pn.bits} ${pn.bits === 1 ? 'bit' : 'bits'} · ${pn.k} the size`), cx + W / 2, cy + H + 24 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'center', base: 'top' });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// el laboratorio: 1 024 pesos reales de Pythia-1.4B, cuantizados de verdad
// ═════════════════════════════════════════════════════════════════════════
export function labState(S: Frame): { bits: number; scheme: Scheme } {
  if (S.on('try-quant')) return { bits: BITS_LIST[clamp(Math.round(S.p.qbits ?? 5), 0, BITS_LIST.length - 1)], scheme: (S.p.qscheme ?? 'tensor') as Scheme };
  if (S.on('groups') && S.since('groups') > 1.0) return { bits: 4, scheme: 'group' };
  return { bits: 4, scheme: 'tensor' };
}

/** Color de un peso: ámbar si es positivo, tinta si es negativo; el cero exacto queda en blanco. */
function weightColor(S: Frame, w: number): string | null {
  const k = clamp(w / (3 * SAMPLE.sigma), -1, 1);
  if (Math.abs(k) < 1e-9) return null;
  return k > 0 ? alpha(tone(S, 'w').c, 0.12 + 0.88 * k) : alpha(S.pal.ink, 0.1 + 0.8 * -k);
}

function weightImage(S: Frame, x: number, y: number, side: number, w: ArrayLike<number>) {
  const { d, pal: p } = S, P = SAMPLE.patch, cs = side / P;
  for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) {
    const c = weightColor(S, w[j * P + i]);
    if (c) d.rect(x + i * cs, y + j * cs, cs + 0.4, cs + 0.4, { fill: c });
  }
  d.rect(x - 0.5, y - 0.5, side + 1, side + 1, { stroke: p.lineStrong, lw: 1 });
}

function drawLab(S: Frame) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, wt = tone(S, 'w');
  const R = regions(S, port ? 0.7 : 0.62);
  const { bits, scheme } = labState(S);
  const q = quantOf(bits, scheme), w0 = PATCH_F32;
  const main = R.main, gap = 14 * u;
  // ── imágenes ──
  const imgH = main.h * (port ? 0.58 : 0.62), side = Math.min((main.w - gap) / 2, imgH - 36 * u);
  const ix = main.x + (main.w - (2 * side + gap)) / 2, iy = main.y + 24 * u;
  const aIm = S.reveal('round', 0, 0.7), aQ = S.reveal('round', 1.4, 0.8);
  d.withAlpha(aIm, () => {
    d.text(S.l('Original (32 × 32 pesos reales)', 'Original (32 × 32 real weights)'), ix, iy - 8 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', w: side + 4 * u });
    weightImage(S, ix, iy, side, w0);
  });
  d.withAlpha(aQ, () => {
    d.text(S.l(`Cuantizado a ${bits} bits`, `Quantized to ${bits} bits`), ix + side + gap, iy - 8 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', w: side + 4 * u });
    weightImage(S, ix + side + gap, iy, side, q.q);
  });
  // leyenda de color
  d.withAlpha(aIm, () => {
    const ly = iy + side + 12 * u, lw = Math.min(150 * u, 2 * side + gap), lx = ix + (2 * side + gap - lw) / 2;
    for (let k = 0; k < 20; k++) { const v = -1 + (2 * (k + 0.5)) / 20, c = weightColor(S, v * 3 * SAMPLE.sigma); if (c) d.rect(lx + (k * lw) / 20, ly, lw / 20 + 0.5, 8 * u, { fill: c }); }
    d.rect(lx, ly, lw, 8 * u, { stroke: p.lineStrong, lw: 1 });
    d.text('−', lx - 5 * u, ly + 4 * u, { size: FS(S, 12.5), weight: 800, color: p.ink2, align: 'right', base: 'middle' });
    d.text('+', lx + lw + 5 * u, ly + 4 * u, { size: FS(S, 12.5), weight: 800, color: wt.ink, align: 'left', base: 'middle' });
    d.text(S.l('en blanco: cero exacto', 'blank: exactly zero'), ix + side + gap, ly + 16 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'left', base: 'top', a: aQ });
  });
  // ── histograma con los niveles ──
  const hy = iy + side + 40 * u, hr: Rect = { x: main.x, y: hy, w: main.w, h: Math.max(60 * u, main.y + main.h - hy - 18 * u) };
  if (S.on('round')) drawHist(S, hr, q, scheme, bits);
  // ── lectura ──
  drawReadout(S, R.aside, q, bits, scheme);
}

/** Histograma de w ÷ (valor que fija la escala), con las líneas de los niveles y la zona que se redondea a cero. */
function drawHist(S: Frame, r: Rect, q: ReturnType<typeof quantOf>, scheme: Scheme, bits: number) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), er = tone(S, 'err'), P = SAMPLE.patch;
  const a = S.reveal('round', 0.6, 0.8), labH = 20 * u, top = r.y + labH, h = r.h - labH - 18 * u, base = top + h;
  const X = (v: number) => r.x + ((v + 1) / 2) * r.w, bw = r.w / NB;
  let mx = 1; q.hist.forEach((c) => (mx = Math.max(mx, c)));
  d.withAlpha(a, () => {
    d.text(S.l(scheme === 'tensor' ? 'peso ÷ máximo de TODA la matriz' : 'peso ÷ máximo de su grupo de 32', scheme === 'tensor' ? 'weight ÷ maximum of the WHOLE matrix' : 'weight ÷ maximum of its group of 32'), r.x, r.y + 2 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top', w: r.w });
    // zona que se redondea a cero
    const z = 0.5 / q.qmax;
    d.rect(X(-z), top, X(z) - X(-z), h, { fill: alpha(er.c, 0.1) });
    d.dither(X(-z), top, X(z) - X(-z), h, er.c, 0.16, 2);
    // barras
    q.hist.forEach((c, k) => { const bh = (c / mx) * h * 0.96; d.rect(r.x + k * bw + 1, base - bh, bw - 2, bh, { fill: alpha(wt.c, 0.8), stroke: wt.c, lw: 0.8 }); });
    // niveles
    if (q.qmax <= 15) for (let l = -q.qmax; l <= q.qmax; l++) d.line(X(l / q.qmax), top - 2 * u, X(l / q.qmax), base, p.ink, l === 0 ? 1.8 : 1.1, [3, 3], l === 0 ? 0.9 : 0.55);
    d.line(r.x, base, r.x + r.w, base, p.lineStrong, 1.5);
    ['−1', '0', '+1'].forEach((t, k) => d.text(t, r.x + (k * r.w) / 2, base + 4 * u, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: k === 0 ? 'left' : k === 1 ? 'center' : 'right', base: 'top' }));
    d.text(S.l(`${2 * q.qmax + 1} niveles (líneas)`, `${2 * q.qmax + 1} levels (lines)`) + (q.qmax > 15 ? S.l(' · demasiadas para dibujarlas', ' · too many to draw') : ''), r.x + r.w, base + 4 * u, { size: FS(S, 11.5), weight: 600, color: p.mute, align: 'right', base: 'top' });
  });
  // llamadas
  if (S.between('round', 'groups') || S.on('try-quant')) {
    const zc = q.zero;
    tagText(S, S.l(`${nf(zc * 100, 0, S.lang)} % → 0`, `${nf(zc * 100, 0, S.lang)}% → 0`), X(0), top + 12 * u, { t: 'err', align: 'center', size: 13, a: S.on('outlier') || S.on('try-quant') ? 1 : 0 });
  }
  if (S.between('outlier', 'groups') && scheme === 'tensor') {
    const ao = S.reveal('outlier', 0.4, 0.7);
    d.withAlpha(ao, () => {
      d.arrow(X(0.82), top + h * 0.45, X(0.99), top + h * 0.45, p.ink, 2, 8);
      d.text(S.l(`el mayor peso de toda la matriz: ${nf(SAMPLE.ratio, 1, S.lang)} σ`, `the largest weight in the whole matrix: ${nf(SAMPLE.ratio, 1, S.lang)} σ`), X(0.8), top + h * 0.45 - 10 * u, { size: FS(S, 12.5), weight: 700, color: p.ink, align: 'right', base: 'bottom', halo: p.stage, haloW: 4, w: r.w * 0.62 });
    });
  }
  void bits; void P;
}

function drawReadout(S: Frame, r: Rect, q: ReturnType<typeof quantOf>, bits: number, scheme: Scheme) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const loss = modelLoss(bits, scheme), dl = loss === null ? null : loss - LOSS.fp16;
  const eb = effBits(bits, scheme);
  const items: { l: string; v: string; t: 'w' | 'err' | 'dat' | 'ink'; hot?: number; sub?: string }[] = [
    { l: S.l('bits por peso', 'bits per weight'), v: `${bits}${scheme === 'group' ? ` (${nf(eb, 1, S.lang)})` : ''}`, t: 'w' },
    { l: S.l('error de la muestra', 'sample error'), v: `${nf(q.err * 100, q.err < 0.1 ? 1 : 0, S.lang)} %`, t: q.err > 0.3 ? 'err' : 'ink', sub: S.l(`matriz entera ${nf(fullErr(bits, scheme) * 100, fullErr(bits, scheme) < 0.1 ? 1 : 0, S.lang)} %`, `whole matrix ${nf(fullErr(bits, scheme) * 100, fullErr(bits, scheme) < 0.1 ? 1 : 0, S.lang)}%`) },
    { l: S.l('pesos que dan 0', 'weights that become 0'), v: `${nf(q.zero * 100, 0, S.lang)} %`, t: q.zero > 0.4 ? 'err' : 'ink', sub: S.l(`matriz entera ${nf(fullZero(bits, scheme) * 100, 0, S.lang)} %`, `whole matrix ${nf(fullZero(bits, scheme) * 100, 0, S.lang)}%`) },
    { l: S.l('pérdida del modelo', 'model loss'), v: loss === null ? '—' : nf(loss, 2, S.lang), t: dl !== null && dl > 1 ? 'err' : 'dat', sub: S.l(`sin cuantizar ${nf(LOSS.fp16, 2, S.lang)} · medida`, `unquantized ${nf(LOSS.fp16, 2, S.lang)} · measured`) },
  ];
  const aR = S.reveal('round', 0.8, 0.8);
  d.withAlpha(aR, () => {
    if (port) {
      const gap = 8 * u, ch = Math.min(46 * u, (r.h - 30 * u) / 2), cw = (r.w - gap) / 2;
      items.forEach((it, i) => chip(S, { x: r.x + (i % 2) * (cw + gap), y: r.y + Math.floor(i / 2) * (ch + gap), w: cw, h: ch }, it.l, it.v, it.t, { vsize: 16, hot: it.hot }));
    } else {
      const ch = Math.min(56 * u, (r.h - 70 * u) / 4), gap = 10 * u;
      items.forEach((it, i) => {
        const y = r.y + i * (ch + gap);
        chip(S, { x: r.x, y, w: r.w, h: ch }, it.l, it.v, it.t, { vsize: 19, hot: it.hot });
        if (it.sub) d.text(it.sub, r.x + r.w, y + ch + 2 * u, { size: FS(S, 11.5), weight: 600, color: p.mute, align: 'right', base: 'top' });
      });
    }
  });
  // lista del turno
  if (S.between('try-quant', 'real-loss')) {
    const st = S.st.quantGate ?? { bad: false, fix: false };
    const y = port ? r.y + r.h - 2 * u : r.y + r.h - 22 * u;
    if (port) {
      check(S, r.x, y - 28 * u, !!st.bad, S.l('una escala por matriz: ≤ 4 bits', 'one scale per matrix: ≤ 4 bits'), r.w, 'dat');
      check(S, r.x, y - 6 * u, !!st.fix, S.l('luego, una escala por grupo', 'then one scale per group'), r.w, 'dat');
    } else {
      check(S, r.x, y - 22 * u, !!st.bad, S.l('con una escala por matriz, baja a 4 bits o menos', 'with one scale per matrix, go down to 4 bits or fewer'), r.w, 'dat');
      check(S, r.x, y, !!st.fix, S.l('cambia a una escala por grupo', 'switch to one scale per group'), r.w, 'dat');
    }
  }
}

/** Turno 3: primero romper el modelo (una escala por matriz, ≤ 4 bits), luego arreglarlo (una escala por grupo). */
export function updateQuant(S: Frame): boolean {
  const g = S.st.quantGate ?? (S.st.quantGate = { bad: false, fix: false });
  if (!S.between('try-quant', 'real-loss')) return false;
  const { bits, scheme } = labState(S);
  if (scheme === 'tensor' && bits <= 4) g.bad = true;
  if (g.bad && scheme === 'group' && bits <= 4) g.fix = true;
  return g.bad && g.fix;
}

// ═════════════════════════════════════════════════════════════════════════
// la pérdida de TODO el modelo, medida, frente a los bits
// ═════════════════════════════════════════════════════════════════════════
function drawLoss(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, er = tone(S, 'err'), dat = tone(S, 'dat');
  const pl: Rect = { x: all.x + 40 * u, y: all.y + 40 * u, w: all.w - 52 * u, h: all.h - 40 * u - 56 * u };
  const Y0 = Math.log10(2), Y1 = Math.log10(24), X = (b: number) => pl.x + ((b - 1.5) / 7) * pl.w, Y = (v: number) => pl.y + pl.h - ((Math.log10(v) - Y0) / (Y1 - Y0)) * pl.h;
  const a = S.reveal('real-loss', 0, 0.7);
  d.withAlpha(a, () => {
    d.text(S.l('Pérdida de Pythia-1.4B, completo, según los bits (medida)', 'Pythia-1.4B loss, whole model, by bits (measured)'), all.x, all.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top', w: all.w });
    d.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, p.lineStrong, 1.5); d.line(pl.x, pl.y, pl.x, pl.y + pl.h, p.lineStrong, 1.5);
    [2, 3, 4, 5, 6, 7, 8].forEach((b) => { d.line(X(b), pl.y + pl.h, X(b), pl.y + pl.h + 4 * u, p.lineStrong, 1.5); d.text(String(b), X(b), pl.y + pl.h + 7 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    d.text(S.l('bits por peso', 'bits per weight'), pl.x + pl.w, pl.y + pl.h + 24 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    [2, 3, 5, 10, 20].forEach((v) => { d.line(pl.x - 4 * u, Y(v), pl.x, Y(v), p.lineStrong, 1.5); d.line(pl.x, Y(v), pl.x + pl.w, Y(v), p.line, 1); d.text(String(v), pl.x - 7 * u, Y(v), { size: FS(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('pérdida (escala log.)', 'loss (log scale)'), all.x, pl.y - 6 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'bottom' });
    // referencias: sin cuantizar y el azar (ln 50 304 = 10,83)
    d.line(pl.x, Y(LOSS.fp16), pl.x + pl.w, Y(LOSS.fp16), p.ink, 1.6, [6, 4]);
    d.text(S.l(`sin cuantizar: ${nf(LOSS.fp16, 2, S.lang)}`, `unquantized: ${nf(LOSS.fp16, 2, S.lang)}`), pl.x + pl.w - 4 * u, Y(LOSS.fp16) + 4 * u, { size: FS(S, 12.5), weight: 700, color: p.ink, align: 'right', base: 'top', halo: p.stage, haloW: 4 });
    const rnd = Math.log(50304);
    d.line(pl.x, Y(rnd), pl.x + pl.w, Y(rnd), er.c, 1.6, [2, 4]);
    d.text(S.l(`adivinar al azar: ${nf(rnd, 1, S.lang)}`, `random guessing: ${nf(rnd, 1, S.lang)}`), pl.x + 6 * u, Y(rnd) - 4 * u, { size: FS(S, 12.5), weight: 700, color: er.ink, align: 'left', base: 'bottom', halo: p.stage, haloW: 4 });
  });
  // series
  const series: { sc: Scheme; t: typeof er; sq: boolean; name: string; at: number }[] = [
    { sc: 'tensor', t: er, sq: true, name: S.l('una escala por matriz', 'one scale per matrix'), at: 0.6 },
    { sc: 'group', t: dat, sq: false, name: S.l('una escala por grupo de 32', 'one scale per group of 32'), at: 2.0 },
  ];
  series.forEach((s) => {
    const prog = S.at('real-loss', s.at, s.at + 1.4, 'out'); if (prog <= 0) return;
    const pts = [...BITS_LIST].reverse().map((b) => [X(b), Y(modelLoss(b, s.sc) ?? 24)] as [number, number]);
    const cut: [number, number][] = [];
    const total = pts.length - 1, f = prog * total;
    for (let i = 0; i <= Math.floor(f) && i < pts.length; i++) cut.push(pts[i]);
    if (Math.floor(f) < total) { const i = Math.floor(f), t = f - i; cut.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]); }
    d.polyline(cut, s.t.c, 2.4, { dash: s.sq ? [6, 4] : undefined });
    pts.forEach((pt, i) => { if (i > f) return; if (s.sq) d.rect(pt[0] - 4.5 * u, pt[1] - 4.5 * u, 9 * u, 9 * u, { fill: s.t.c, stroke: p.stage, lw: 1.2 }); else d.circle(pt[0], pt[1], 5 * u, { fill: s.t.c, stroke: p.stage, lw: 1.2 }); });
  });
  // leyenda
  const ly = all.y + all.h - 22 * u;
  series.forEach((s, i) => {
    const a2 = S.reveal('real-loss', s.at, 0.6), lx = all.x + i * (port ? all.w * 0.5 : 230 * u);
    d.withAlpha(a2, () => {
      d.line(lx, ly, lx + 24 * u, ly, s.t.c, 2.4, s.sq ? [6, 4] : undefined);
      if (s.sq) d.rect(lx + 12 * u - 4 * u, ly - 4 * u, 8 * u, 8 * u, { fill: s.t.c }); else d.circle(lx + 12 * u, ly, 4.5 * u, { fill: s.t.c });
      fitText(S, s.name, lx + 30 * u, ly, (port ? all.w * 0.5 : 220 * u) - 34 * u, 12.5, { weight: 700, color: s.t.ink, base: 'middle' });
    });
  });
  // la selección actual (los controles siguen a la vista)
  const { bits, scheme } = labState(S), cur = modelLoss(bits, scheme);
  if (cur !== null && S.on('real-loss')) {
    const aM = S.reveal('real-loss', 3.2, 0.6);
    d.withAlpha(aM, () => {
      const x = X(bits), y = Y(cur), c = scheme === 'tensor' ? er : dat;
      d.circle(x, y, 11 * u, { stroke: p.ink, lw: 2.2 });
      const left = x > pl.x + pl.w * 0.6;
      tagText(S, nf(cur, 2, S.lang), x + (left ? -16 : 16) * u, y + (y < pl.y + 24 * u ? 16 : -4) * u, { t: scheme === 'tensor' ? 'err' : 'dat', align: left ? 'right' : 'left', size: 13, font: 'mono' });
      void c;
    });
  }
  d.withAlpha(S.reveal('real-loss', 3.6, 0.6), () => d.text(S.l('WikiText-2, 287 744 tokens; 96 matrices cuantizadas con redondeo simple', 'WikiText-2, 287,744 tokens; 96 matrices quantized with simple rounding'), all.x, all.y + all.h + 2 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom', w: all.w, a: 0 }));
}

// ═════════════════════════════════════════════════════════════════════════
// el doble beneficio: un modelo de 8 mil M en la RTX 3060 (12 GB, 360 GB/s)
// ═════════════════════════════════════════════════════════════════════════
function drawPayoff(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, wt = tone(S, 'w'), sg = tone(S, 'sig');
  const g = GPUS[0], N = 8e9;
  const rows = [
    { name: 'FP16', bits: 16, note: '' },
    { name: 'INT8', bits: 8, note: '' },
    { name: S.l('4 bits + escalas', '4 bits + scales'), bits: 4.5, note: S.l('4,5 bits por peso', '4.5 bits per weight') },
  ];
  d.withAlpha(S.reveal('payoff', 0, 0.6), () => d.text(S.l('Un modelo de 8 mil M de parámetros en una RTX 3060', 'An 8B-parameter model on an RTX 3060'), all.x, all.y + 2 * u, { size: FS(S, 14.5), weight: 800, color: p.ink, base: 'top', w: all.w }));
  const labW = (port ? 84 : 130) * u, top = all.y + (port ? 62 : 54) * u, rowH = Math.min(78 * u, (all.h - (top - all.y) - 24 * u) / 3);
  const colW = (all.w - labW) / 2 - 8 * u, c1 = all.x + labW, c2 = c1 + colW + 16 * u;
  d.withAlpha(S.reveal('payoff', 0.2, 0.6), () => {
    d.text(S.l('memoria (12 GB)', 'memory (12 GB)'), c1, top - 8 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'bottom' });
    d.text(S.l('leer todos los pesos', 'read all the weights'), c2, top - 8 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', w: colW });
    if (port) d.text('360 GB/s', c2, top - 24 * u, { size: FS(S, 12), weight: 600, font: 'mono', color: p.mute, base: 'bottom' });
  });
  rows.forEach((r, i) => {
    const a = S.reveal('payoff', 0.7 + i * 0.7, 0.6), y = top + i * rowH, gb = (N * r.bits) / 8 / GB, fit = fitOf(gb, g.mem), tms = (gb / g.bw) * 1000;
    d.withAlpha(a, () => {
      d.text(r.name, all.x, y + rowH * 0.22, { size: FS(S, 14), weight: 800, color: p.ink, base: 'middle', w: labW - 6 * u });
      d.text(`${nf(gb, gb % 1 ? 1 : 0, S.lang)} GB`, all.x, y + rowH * 0.22 + 17 * u, { size: FS(S, 12.5), weight: 700, font: 'mono', color: wt.ink, base: 'middle' });
      const bh = Math.min(26 * u, rowH * 0.4), by = y + rowH * 0.5 - bh / 2 - 4 * u;
      // memoria
      d.rect(c1, by, colW, bh, { fill: p.surface2, stroke: p.lineStrong, lw: 1.2 });
      d.dither(c1 + colW * (1 - MARGIN), by + 1, colW * MARGIN - 1, bh - 2, p.mute, 0.35, 2);
      const over = gb > g.mem;
      d.rect(c1, by, Math.min(1, gb / g.mem) * colW, bh, { fill: alpha(over ? tone(S, 'err').c : wt.c, over ? 0.55 : 0.85), stroke: over ? tone(S, 'err').c : wt.c, lw: 1.4 });
      verdict(S, c1 + colW - 12 * u, by + bh + 14 * u, fit, 6);
      d.text(fit === 'ok' ? S.l('cabe', 'fits') : fit === 'tight' ? S.l('justo', 'tight') : S.l('no cabe', 'does not fit'), c1 + colW - 24 * u, by + bh + 14 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
      // tiempo
      const tmax = (N * 16) / 8 / GB / g.bw * 1000;
      d.rect(c2, by, colW, bh, { fill: p.surface2, stroke: p.lineStrong, lw: 1.2 });
      d.rect(c2, by, (tms / tmax) * colW, bh, { fill: alpha(sg.c, over ? 0.25 : 0.7), stroke: sg.c, lw: 1.4, dash: over ? [4, 3] : undefined });
      d.text(`${sig(tms, S.lang)} ms${over ? '*' : ''}`, c2 + colW - 4 * u, by + bh + 14 * u, { size: FS(S, 13.5), weight: 800, font: 'mono', color: sg.ink, align: 'right', base: 'middle' });
    });
  });
  const aN = S.reveal('payoff', 3.4, 0.6);
  d.withAlpha(aN, () => {
    d.text(S.l('* sería, si cupiera. Tiempo = bytes ÷ ancho de banda (la lección siguiente: cada palabra generada lo paga).', '* it would be, if it fit. Time = bytes ÷ bandwidth (next lesson: every generated word pays it).'), all.x, all.y + all.h, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom', w: all.w });
  });
  void bwText;
}

// ═════════════════════════════════════════════════════════════════════════
// la advertencia: Llama 3 405B en FP8 (informe técnico de Meta, §6.2)
// ═════════════════════════════════════════════════════════════════════════
function drawCaution(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, dat = tone(S, 'dat'), er = tone(S, 'err');
  d.withAlpha(S.reveal('caution', 0, 0.6), () => d.text(S.l('Llama 3.1 405B, de BF16 a FP8 (informe técnico de Meta)', 'Llama 3.1 405B, from BF16 to FP8 (Meta’s technical report)'), all.x, all.y + 2 * u, { size: FS(S, 14.5), weight: 800, color: p.ink, base: 'top', w: all.w }));
  const cards: { head: string; body: string; t: 'dat' | 'err' | 'ink'; ok: boolean; at: number }[] = [
    { head: S.l('Las pruebas estándar', 'Standard benchmarks'), body: S.l('FP8 rinde igual que BF16, incluso sin precauciones.', 'FP8 performs on par with BF16, even without precautions.'), t: 'dat', ok: true, at: 0.5 },
    { head: S.l('Mirando las respuestas', 'Looking at the answers'), body: S.l('Aparecían respuestas corruptas de vez en cuando. Lo vieron puntuando 100 000 respuestas con un modelo de recompensa.', 'Corrupted answers showed up now and then. They saw it by scoring 100,000 responses with a reward model.'), t: 'err', ok: false, at: 1.6 },
    { head: S.l('Lo que hicieron', 'What they did'), body: S.l('Escalas por fila, sin cuantizar la primera y la última capa, y escalas acotadas.', 'Row-wise scales, no quantization in the first and last layers, and capped scales.'), t: 'ink', ok: true, at: 2.9 },
  ];
  const gap = 12 * u, top = all.y + 34 * u, cw = port ? all.w : (all.w - gap * 2) / 3, ch = port ? (all.h - 34 * u - gap * 2) / 3 : all.h - 34 * u - 30 * u;
  cards.forEach((c, i) => {
    const a = S.reveal('caution', c.at, 0.6), x = port ? all.x : all.x + i * (cw + gap), y = port ? top + i * (ch + gap) : top, col = tone(S, c.t);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: alpha(col.c, 0.07), stroke: col.c, lw: 1.5, r: 3, dash: c.t === 'err' ? [5, 3] : undefined });
      verdict(S, x + 18 * u, y + 20 * u, c.t === 'err' ? 'no' : 'ok', 7);
      d.text(c.head, x + 36 * u, y + 20 * u, { size: FS(S, 14), weight: 800, color: col.ink, base: 'middle', w: cw - 44 * u });
      d.text(c.body, x + 12 * u, y + 40 * u, { size: FS(S, 13), weight: 600, color: p.ink, base: 'top', w: cw - 24 * u, lh: 1.3 });
    });
  });
  void dat; void er;
}
