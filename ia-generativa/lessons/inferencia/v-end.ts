// Vistas finales: mezcla de expertos (moe-idea · moe-total · moe-active · moe-memory), decodificación especulativa (spec),
// resumen (recap), lente (lens) y puente (bridge).
import { alpha, hash, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MIXTRAL } from './model';
import { WORDS, area, chip, fitText, fr, fz, hbar, lg, note, para, paraH, tight, tok } from './ui';

// Los dos expertos que elige cada token del lote (fijos: el enrutador real depende del token; aquí, ilustrativo).
const PICKS: [number, number][] = [[2, 5], [0, 3], [1, 6], [4, 7], [2, 3], [5, 0], [6, 1], [7, 4]];

export function drawMoe(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, T = tight(S);
  const w = tone(S, 'w'), sg = tone(S, 'sig'), lat = tone(S, 'lat');
  const E = MIXTRAL.experts;
  // zona del bloque y zona de las barras
  // en teléfono horizontal (muy bajo) el bloque y las barras van lado a lado; si no, una sobre otra
  const side = !P && T;
  const blockH = side ? R.h : P ? R.h * 0.56 : R.h * 0.6;
  const blk: Rect = side ? { x: R.x, y: R.y, w: R.w * 0.6, h: R.h } : { x: R.x, y: R.y, w: R.w, h: blockH };
  const bars: Rect = side ? { x: R.x + R.w * 0.64, y: R.y + 4 * u, w: R.w * 0.36, h: R.h - 4 * u } : { x: R.x, y: R.y + blockH + 14 * u, w: R.w, h: R.h - blockH - 14 * u };
  // marco del bloque
  const aB = fr(S, 'moe-idea', 0.05, 0.18);
  const ex = blk.x + 6 * u, ew = (blk.w - 12 * u) / E;
  const tokY = blk.y + fz(S, 13) * u * 1.6, th = Math.max(fz(S, 12) * u + 10 * u, 26 * u);
  const rY = tokY + th + 16 * u, rH = Math.max(fz(S, 13) * u + 12 * u, 28 * u);
  const noteRoom = P ? fz(S, 12.5) * u * 1.3 + 14 * u : 0;   // en vertical, la nota del lote va bajo los expertos
  const eY = rY + rH + Math.max(26 * u, blk.h * 0.12), eH = Math.max(fz(S, 12) * u + 14 * u, Math.min(54 * u, blk.y + blk.h - eY - 8 * u - noteRoom));
  const router: Rect = { x: blk.x + blk.w * 0.3, y: rY, w: blk.w * 0.4, h: rH };
  const memPhase = S.on('moe-memory');
  const batchK = memPhase ? fr(S, 'moe-memory', 0.2, 0.6, 'lin') * PICKS.length : 0;
  const lit = new Set<number>();
  if (!memPhase) { if (fr(S, 'moe-idea', 0.5, 0.6) > 0.5) PICKS[0].forEach((e) => lit.add(e)); }
  else for (let i = 0; i < Math.min(PICKS.length, Math.ceil(batchK)); i++) PICKS[i].forEach((e) => lit.add(e));
  d.withAlpha(aB, () => {
    fitText(S, S.l('un bloque con mezcla de expertos', 'one block with a mixture of experts'), blk.x, blk.y, blk.w, { size: 13, weight: 800, color: p.ink2, base: 'top' });
    d.rect(router.x, router.y, router.w, router.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    fitText(S, S.l('enrutador', 'router'), router.x + router.w / 2, router.y + router.h / 2, router.w - 8 * u, { size: 13, weight: 800, color: p.ink, align: 'center', base: 'middle' });
    for (let e = 0; e < E; e++) {
      const r = { x: ex + e * ew + 3 * u, y: eY, w: ew - 6 * u, h: eH }, on = lit.has(e);
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(w.c, on ? 0.55 : 0.1), stroke: w.c, lw: on ? 2.2 : 1.2, r: 3 });
      fitText(S, (P || T ? '' : S.l('experto ', 'expert ')) + (e + 1), r.x + r.w / 2, r.y + r.h / 2, r.w - 4 * u, { size: 12.5, weight: 800, color: on ? p.ink : w.ink, align: 'center', base: 'middle' });
    }
  });
  // un token (o un lote) entra y elige
  const W = WORDS[lg(S)];
  if (!memPhase) {
    const a = fr(S, 'moe-idea', 0.25, 0.35);
    const tw = Math.min(110 * u, blk.w * 0.3), tr = { x: blk.x + (blk.w - tw) / 2, y: tokY, w: tw, h: th };
    tok(S, tr, W.ans[1], { t: 'sig', a });
    const k = fr(S, 'moe-idea', 0.35, 0.5);
    d.withAlpha(a, () => d.arrow(tr.x + tw / 2, tr.y + th + 2 * u, tr.x + tw / 2, tr.y + th + 2 * u + (router.y - tr.y - th - 6 * u) * k, sg.c, 1.8, k > 0.95 ? 7 : 0.01));
    const k2 = fr(S, 'moe-idea', 0.5, 0.62);
    d.withAlpha(k2, () => PICKS[0].forEach((e) => {
      const x2 = ex + (e + 0.5) * ew;
      d.arrow(router.x + router.w / 2, router.y + router.h + 2 * u, x2, eY - 3 * u, sg.c, 2, 7 * Math.max(0.8, u));
    }));
    chip(S, S.l('elige 2 de 8', 'picks 2 of 8'), router.x + router.w + 8 * u, router.y + router.h / 2, 'sig', { align: 'left', a: k2, size: 12.5, maxW: blk.x + blk.w - router.x - router.w - 10 * u });
  } else {
    const n = PICKS.length, tw = Math.min(40 * u, (blk.w * 0.9) / n - 4 * u);
    const x0 = blk.x + (blk.w - n * (tw + 4 * u)) / 2;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, Math.min(1, batchK - i + 1));
      const tr = { x: x0 + i * (tw + 4 * u), y: tokY, w: tw, h: th };
      tok(S, tr, String(i + 1), { t: 'sig', a: a > 0 ? 1 : 0.25, size: 12 });
      if (a > 0) d.withAlpha(Math.min(1, a) * 0.55, () => PICKS[i].forEach((e) => d.line(tr.x + tw / 2, tr.y + th, ex + (e + 0.5) * ew, eY - 2 * u, sg.c, 1.1)));
    }
    const txt = S.l(`lote de 8 tokens: usa ${lit.size} de 8 expertos`, `batch of 8 tokens: uses ${lit.size} of 8 experts`), na = fr(S, 'moe-memory', 0.55, 0.68);
    if (P) note(S, txt, blk.x + blk.w / 2, eY + eH + 6 * u, blk.w, 'sig', { a: na, size: 12.5 });
    else { const nx0 = router.x + router.w + 8 * u, nw = blk.x + blk.w - nx0; note(S, txt, nx0 + nw / 2, router.y + router.h / 2, nw, 'sig', { a: na, size: 12.5, base: 'middle' }); }
  }
  // barras: total frente a activos (con su encabezado: qué modelo es)
  const bh = Math.max(14 * u, Math.min(22 * u, bars.h * 0.13)), lhh = fz(S, 13.5) * u * 1.4, hh = fz(S, 12) * u * 1.5;
  const total = MIXTRAL.total, act = MIXTRAL.active;
  const rowsAt = [bars.y + hh, bars.y + hh + lhh + bh + 12 * u];
  const tA = fr(S, 'moe-total', 0.45, 0.6), aA = fr(S, 'moe-active', 0.2, 0.35);
  if (S.on('moe-total')) {
    fitText(S, S.l('Mixtral 8x7B: 8 expertos por bloque, 2 por token', 'Mixtral 8x7B: 8 experts per block, 2 per token'), bars.x, bars.y, bars.w, { size: 12, weight: 700, color: p.mute, base: 'top', a: fr(S, 'moe-total', 0.05, 0.18) });
    d.withAlpha(tA, () => {
      fitText(S, S.l('parámetros en total: unos 47 mil M', 'total parameters: about 47B'), bars.x, rowsAt[0], bars.w, { size: 13.5, weight: 800, color: w.ink, base: 'top' });
      hbar(S, { x: bars.x, y: rowsAt[0] + lhh, w: bars.w, h: bh }, fr(S, 'moe-total', 0.5, 0.75, 'out'), 'w');
    });
  }
  if (S.on('moe-active')) d.withAlpha(aA, () => {
    fitText(S, S.l('activos por token: unos 13 mil M', 'active per token: about 13B'), bars.x, rowsAt[1], bars.w, { size: 13.5, weight: 800, color: sg.ink, base: 'top' });
    hbar(S, { x: bars.x, y: rowsAt[1] + lhh, w: bars.w, h: bh }, (act / total) * fr(S, 'moe-active', 0.3, 0.55, 'out'), 'sig');
  });
  if (memPhase) {
    const a = fr(S, 'moe-memory', 0.72, 0.85);
    const y = rowsAt[1] + lhh + bh + 10 * u;
    note(S, S.l('en memoria: los 47 mil M · ahorra cálculo, no memoria', 'in memory: all 47B · saves arithmetic, not memory'), bars.x + bars.w / 2, y, bars.w, 'w', { a, size: 13 });
  }
  void lat; void hash;
}

// ═════════ decodificación especulativa ═════════
// Texto ya escrito (4 tokens) + 4 borradores del modelo pequeño. El grande los revisa en una vuelta: acepta tres, rechaza el
// cuarto (queda tachado) y en esa misma vuelta pone el suyo, a la derecha.
export function drawSpec(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, lat = tone(S, 'lat'), dat = tone(S, 'dat'), err = tone(S, 'err');
  const W = lg(S) === 'es'
    ? { base: ['El', 'plazo', 'es', 'de'], draft: ['doce', 'meses', 'y', 'paga'], fix: 'se' }
    : { base: ['The', 'term', 'is', 'twelve'], draft: ['months', 'long', 'and', 'pays'], fix: 'it' };
  const n = 9, gap = 5 * u, cols = P ? 4 : 9;
  const tw = Math.min(96 * u, (R.w - (cols - 1) * gap) / cols), th = Math.max(fz(S, 13) * u + 12 * u, 32 * u);
  const blockW = cols * tw + (cols - 1) * gap, x0 = R.x + (R.w - blockW) / 2;
  const mh = Math.max(th, 40 * u);
  const small: Rect = { x: R.x + R.w * 0.04, y: R.y + 4 * u, w: R.w * 0.42, h: mh };
  const big: Rect = { x: R.x + R.w * 0.54, y: R.y + 4 * u, w: R.w * 0.42, h: mh };
  const ty = small.y + small.h + Math.max(30 * u, R.h * 0.1) + (P ? fz(S, 12) * u : 0);
  const markH = fz(S, 16) * u + 8 * u;
  // en vertical: fila 1 el texto ya escrito, fila 2 los borradores, fila 3 el token del grande bajo el rechazado
  const rect = (i: number): Rect => (P && i === 8 ? { x: x0 + 3 * (tw + gap), y: ty + 2 * (th + gap + markH), w: tw, h: th } : { x: x0 + (i % cols) * (tw + gap), y: ty + Math.floor(i / cols) * (th + gap + markH), w: tw, h: th });
  const a0 = fr(S, 'spec', 0.05, 0.15);
  d.withAlpha(a0, () => {
    ([[small, S.l('modelo pequeño', 'small model'), lat], [big, S.l('modelo grande', 'big model'), dat]] as const).forEach(([r, t, c]) => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.08), stroke: c.c, lw: 1.5, r: 4 });
      fitText(S, t, r.x + r.w / 2, r.y + r.h / 2, r.w - 10 * u, { size: 14, weight: 800, color: c.ink, align: 'center', base: 'middle' });
    });
  });
  for (let i = 0; i < 4; i++) tok(S, rect(i), W.base[i], { t: 'sig', a: a0 });
  const checked = fr(S, 'spec', 0.5, 0.62);
  for (let i = 0; i < 4; i++) {
    const a = fr(S, 'spec', 0.18 + 0.06 * i, 0.22 + 0.06 * i), r = rect(4 + i), bad = i === 3;
    if (a <= 0.01) continue;
    tok(S, r, W.draft[i], { t: 'lat', a: a * (bad ? 1 - 0.55 * checked : 1) });
    d.withAlpha(checked, () => {
      fitText(S, bad ? '✗' : '✓', r.x + r.w / 2, r.y + r.h + markH / 2, r.w, { size: 16, weight: 800, color: bad ? err.ink : dat.ink, align: 'center', base: 'middle' });
      if (bad) d.line(r.x + 4 * u, r.y + r.h / 2, r.x + r.w - 4 * u, r.y + r.h / 2, err.c, 2);
    });
  }
  // el token del grande, en la misma vuelta
  tok(S, rect(8), W.fix, { t: 'sig', a: fr(S, 'spec', 0.66, 0.76), hot: 0.5 });
  // flechas de los modelos a la fila
  if (!P) {
    d.withAlpha(fr(S, 'spec', 0.16, 0.24) * (1 - 0.5 * fr(S, 'spec', 0.45, 0.5)), () => d.arrow(small.x + small.w / 2, small.y + small.h + 3 * u, rect(5).x + tw / 2, rect(5).y - 4 * u, lat.c, 1.6, 7 * Math.max(0.8, u)));
    d.withAlpha(fr(S, 'spec', 0.45, 0.55), () => d.arrow(big.x + big.w / 2, big.y + big.h + 3 * u, rect(6).x + tw / 2, rect(6).y - 4 * u, dat.c, 1.8, 7 * Math.max(0.8, u)));
  } else {
    // sin flechas que crucen la fila de arriba: un rótulo por fila
    const lab = (t: string, y: number, c: string, a: number) => fitText(S, t, x0, y - 3 * u, blockW, { size: 12, weight: 700, color: c, base: 'bottom', a });
    lab(S.l('borradores del modelo pequeño', 'drafts from the small model'), rect(4).y, lat.ink, fr(S, 'spec', 0.16, 0.24));
    const r8 = rect(8);
    fitText(S, S.l('el grande pone el suyo →', 'the big one adds its own →'), r8.x - 6 * u, r8.y + r8.h / 2, r8.x - x0 - 8 * u, { size: 12.5, weight: 700, color: dat.ink, align: 'right', base: 'middle', a: fr(S, 'spec', 0.66, 0.76) });
  }
  const capY = rect(8).y + th + markH + 12 * u;
  const cap = S.l('el grande revisa los cuatro borradores en una sola vuelta; en su artículo, de 2 a 3 veces más rápido, con la misma salida', 'the big one checks all four drafts in a single turn; in its paper, 2 to 3 times faster, with the same output');
  const cw = Math.min(R.w, 600 * u);
  if (capY + paraH(S, cap, cw, 13) < R.y + R.h + 18 * u) para(S, cap, R.x + R.w / 2, capY, cw, { size: 13, align: 'center', a: fr(S, 'spec', 0.8, 0.92) });
  void p; void n;
}

// ═════════ resumen, lente y puente ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait;
  const items: [string, string, 'dat' | 'sig' | 'lat' | 'w'][] = [
    [S.l('Llenado (prefill)', 'Prefill'), S.l('tu mensaje entra de una vez', 'your message goes in at once'), 'dat'],
    [S.l('Decodificación (decode)', 'Decode'), S.l('un token por vuelta', 'one token per turn'), 'sig'],
    [S.l('Caché KV', 'KV cache'), S.l('menos trabajo, más memoria', 'less work, more memory'), 'lat'],
    [S.l('Ancho de banda', 'Bandwidth'), S.l('marca la velocidad y el costo', 'sets speed and cost'), 'w'],
  ];
  const cols = P ? 1 : 2, gap = 14 * u;
  const bw = P ? Math.min(R.w, 380 * u) : Math.min((R.w - gap) / 2, 320 * u);
  const bh = Math.min(P ? (R.h - 3 * gap) / 4 : (R.h - gap) / 2 * 0.62, 92 * u);
  const totalH = (4 / cols) * bh + (4 / cols - 1) * gap, y0 = R.y + (R.h - totalH) / 2;
  const x0 = R.x + (R.w - (cols * bw + (cols - 1) * gap)) / 2;
  items.forEach(([t, s, tn], i) => {
    const a = fr(S, 'recap', 0.04 + 0.22 * i, 0.12 + 0.22 * i), c = tone(S, tn);
    const r = { x: x0 + (i % cols) * (bw + gap), y: y0 + Math.floor(i / cols) * (bh + gap), w: bw, h: bh };
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.08), stroke: c.c, lw: 1.5, r: 5 });
      fitText(S, t, r.x + 12 * u, r.y + r.h * 0.36, r.w - 24 * u, { size: 16, weight: 800, color: c.ink, base: 'middle' });
      fitText(S, s, r.x + 12 * u, r.y + r.h * 0.7, r.w - 24 * u, { size: 13.5, weight: 600, color: p.ink2, base: 'middle' });
    });
  });
}

export function drawLens(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait;
  const cw = Math.min(R.w, 620 * u);
  const x = R.x + (R.w - cw) / 2;
  const f1 = S.l('costo de una tarea =', 'cost of a task =');
  const f2 = S.l('entrada × su precio + salida × su precio', 'input × its price + output × its price');
  const s1 = 16, lh1 = fz(S, s1) * u * 1.5;
  const items = [S.l('pide el desglose de entrada y salida', 'ask for the input and output breakdown'), S.l('mide la espera con textos del largo de los tuyos', 'measure the wait with texts as long as yours')];
  const blockH = 2 * lh1 + 20 * u + items.length * fz(S, 14) * u * 1.8;
  const y0 = R.y + Math.max(0, (R.h - blockH) / 2 - 10 * u);
  d.withAlpha(fr(S, 'lens', 0.05, 0.18), () => {
    d.rect(x, y0 - 10 * u, cw, 2 * lh1 + 16 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.4, r: 5 });
    fitText(S, f1, x + cw / 2, y0, cw - 20 * u, { size: s1, weight: 700, color: p.ink2, align: 'center', base: 'top' });
    fitText(S, f2, x + cw / 2, y0 + lh1, cw - 20 * u, { size: s1, weight: 800, color: p.ink, align: 'center', base: 'top' });
  });
  items.forEach((t, i) => {
    const a = fr(S, 'lens', 0.45 + 0.2 * i, 0.55 + 0.2 * i), y = y0 + 2 * lh1 + 22 * u + i * fz(S, 14) * u * 1.8;
    d.withAlpha(a, () => {
      fitText(S, '✓', x + 8 * u, y, 20 * u, { size: 15, weight: 800, color: tone(S, 'dat').ink, base: 'top' });
      fitText(S, t, x + 30 * u, y, cw - 34 * u, { size: 14, weight: 700, color: p.ink, base: 'top' });
    });
  });
  void P;
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 90 * u, { scale: sc, mood: 'happy', a: fr(S, 'bridge', 0.05, 0.2) });
  d.withAlpha(fr(S, 'bridge', 0.2, 0.35), () => fitText(S, S.l('Fin de la parte 2', 'End of part 2'), cx, cy + 34 * u, S.W - 32 * u, { size: 14, weight: 700, color: p.mute, align: 'center', base: 'middle' }));
  d.withAlpha(fr(S, 'bridge', 0.75, 0.9), () => {
    fitText(S, S.l('Siguiente', 'Next'), cx, cy + 62 * u, S.W - 32 * u, { size: 13, weight: 700, color: p.mute, align: 'center', base: 'middle' });
    fitText(S, S.l('Ajuste fino y LoRA', 'Fine-tuning and LoRA'), cx, cy + 92 * u, S.W - 32 * u, { size: 24, weight: 800, color: p.ink, align: 'center', base: 'middle' });
  });
}
