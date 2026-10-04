// Acto A (hook → idea): la frase, el pronombre que no significa nada por sí solo, el mismo vector con dos referentes
// y la idea de la atención como mezcla ponderada de las demás palabras.
import { alpha, badge, clamp, inset, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ATT_IT, I, TOK, TOK_TIRED, X_IT } from './data';
import { actAlpha, arcBetween, fs, pct, vecCells } from './ui';

export interface ChipLayout { rects: Rect[]; width: number; height: number; lines: number }
/** Reparte fichas en líneas (alineadas a la izquierda desde x0). */
export function layoutChips(S: Frame, words: string[], x0: number, y: number, maxW: number, size: number, h: number, gap: number, rowGap: number): ChipLayout {
  const ws = words.map((w) => S.d.measure(w, { size, weight: 600 }) + 18 * S.u);
  const rects: Rect[] = []; let cx = 0, cy = 0, maxLine = 0, lines = 1;
  words.forEach((_, i) => {
    if (cx + ws[i] > maxW && cx > 0) { maxLine = Math.max(maxLine, cx - gap); cx = 0; cy += h + rowGap; lines++; }
    rects.push({ x: cx, y: cy, w: ws[i], h }); cx += ws[i] + gap;
  });
  maxLine = Math.max(maxLine, cx - gap);
  return { rects: rects.map((r) => ({ ...r, x: r.x + x0, y: r.y + y })), width: maxLine, height: cy + h, lines };
}

/** Una ficha de palabra: borde violeta (es un token), relleno cian según la atención recibida. */
export function chip(S: Frame, r: Rect, text: string, o: { size: number; fill?: number; a?: number; ring?: boolean; dim?: number }) {
  const { d, pal: p } = S, lat = tone(S, 'lat'), sig = tone(S, 'sig'), f = clamp(o.fill ?? 0);
  d.withAlpha((o.a ?? 1) * (o.dim ?? 1), () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(lat.c, 0.12), stroke: lat.c, lw: 1.5, r: 3 });
    if (f > 0.01) d.rect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, { fill: alpha(sig.c, 0.12 + 0.62 * f), r: 3 });
    if (o.ring) d.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, { stroke: sig.c, lw: 2.2, r: 5 });
    d.text(text, r.x + r.w / 2, r.y + r.h / 2, { size: o.size, weight: 600, color: f > 0.78 ? p.stage : lat.ink, align: 'center', base: 'middle' });
  });
}

/** Tamaño de ficha: el mayor (hasta 18 px) con el que las dos frases caben en una sola línea; en teléfono vertical, el mayor con el que caben en dos. */
export function chipSize(S: Frame, maxW: number, gap: number) {
  const words = [...TOK[S.lang], ...TOK_TIRED[S.lang].slice(7)];
  for (const px of [18, 17, 16, 15, 14, 13]) {
    const size = fs(S, px), l = layoutChips(S, words, 0, 0, 1e6, size, 30 * S.u, gap, 6 * S.u);
    if (l.width <= maxW) return size;
  }
  if (S.portrait) for (const px of [18, 17, 16, 15]) {
    const size = fs(S, px), h = 30 * S.u;
    if (layoutChips(S, TOK[S.lang], 0, 0, maxW, size, h, gap, 6 * S.u).lines <= 2 && layoutChips(S, TOK_TIRED[S.lang], 0, 0, maxW, size, h, gap, 6 * S.u).lines <= 2) return size;
  }
  return fs(S, 14);
}

export function drawSentence(S: Frame) {
  const A = actAlpha(S, 'hook', 'roles'); if (A <= 0) return;
  S.d.withAlpha(A, () => body(S));
}

function body(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u);
  const gap = 6 * u, h = 30 * u, size = chipSize(S, all.w, gap);
  const w1 = TOK[S.lang], w2 = TOK_TIRED[S.lang];
  const rowGap0 = 6 * u;
  const probe1 = layoutChips(S, w1, 0, 0, all.w, size, h, gap, rowGap0);
  const rowGap = probe1.lines > 1 ? 26 * u : rowGap0;
  const P1 = layoutChips(S, w1, 0, 0, all.w, size, h, gap, rowGap), P2 = layoutChips(S, w2, 0, 0, all.w, size, h, gap, rowGap);
  const x0 = all.x + (all.w - Math.max(P1.width, P2.width)) / 2;
  const chipsH = Math.max(P1.height, P2.height);
  const head = (P1.lines > 1 ? 54 : 70) * u, foot = (P1.lines > 1 ? 62 : 64) * u, blockH = head + chipsH + foot;

  // alturas: una frase centrada, o dos frases apiladas durante «flip»
  const flipT = S.at('flip', 0, 0.9), backT = S.at('idea', 0, 0.9);
  const yMid = all.y + (all.h - blockH) / 2 + head;
  const total = 2 * blockH, top = all.y + (all.h - total) / 2;
  const yA = lerp(lerp(yMid, top + head, flipT), yMid, backT), yB = top + blockH + head;
  const L1 = layoutChips(S, w1, x0, yA, all.w, size, h, gap, rowGap), L2 = layoutChips(S, w2, x0, yB, all.w, size, h, gap, rowGap);
  const sec2 = S.on('flip') ? flipT * (1 - backT) : 0;

  // fichas de la frase 1 (aparecen una a una en «hook»)
  const show = S.on('fixed') ? 9 : S.at('hook', 0.15, 2.5, 'lin') * 9;
  const idea = S.on('idea') ? S.at('idea', 0.3, 1.5, 'out') : 0;
  L1.rects.forEach((r, i) => {
    const a = clamp(show - i);
    if (a <= 0) return;
    chip(S, r, w1[i], { size, a, fill: idea * (i === I.it ? 0 : ATT_IT.w[i]) * 1.25, ring: i === I.it });
  });
  const it1 = L1.rects[I.it], sig = tone(S, 'sig');

  // «?» sobre el pronombre
  if (!S.on('fixed')) {
    const a = S.reveal('hook', 2.2, 0.5), pulse = 0.7 + 0.3 * Math.abs(Math.sin(S.clock * 3));
    const qy = L1.lines > 1 ? it1.y - rowGap / 2 - 1 : it1.y - 22 * u;
    d.withAlpha(a * pulse, () => d.text('?', it1.x + it1.w / 2, qy, { size: fs(S, 24), weight: 800, color: sig.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 }));
  }

  // «fixed»: la persona lo resuelve, y el vector de «este» es fijo
  const ro = L1.rects[I.robot], pk = L1.rects[I.pkg];
  const lift = (a: Rect, b: Rect) => Math.min(head * 0.88, 12 * u + Math.abs(a.x - b.x) * 0.16);
  if (S.on('fixed') && !S.on('idea')) {
    const prog = S.reveal('fixed', 0.3, 0.9);
    const mid = arcBetween(S, it1, pk, { tone: 'sig', lw: 2.6, dash: [6, 4], progress: prog, lift: lift(it1, pk) });
    d.withAlpha(S.reveal('fixed', 1.1, 0.4), () => badge(S, S.l('tú', 'you'), mid[0], mid[1] - 2 * u, { tone: 'sig' }));
  }
  const vecA = S.on('fixed') ? S.reveal('fixed', 1.6, 0.6) * (1 - backT) : 0;
  const drawVec = (r: Rect, a: number, label: string) => {
    if (a <= 0) return;
    const cw = 38 * u, vw = 2 * cw + 2 * u, vx = r.x + r.w / 2 - vw / 2, vy = r.y + r.h + 20 * u;
    d.withAlpha(a, () => {
      vecCells(S, vx, vy, X_IT, { tone: 'lat', cw: 38, h: 22, strong: true });
      d.text(label, r.x + r.w / 2, vy + 20 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'middle' });
    });
  };
  drawVec(it1, vecA, S.l('vector fijo', 'fixed vector'));

  // «flip»: la misma frase con otro final y la respuesta cambia
  if (sec2 > 0.01) {
    L2.rects.forEach((r, i) => chip(S, r, w2[i], { size, a: sec2, ring: i === I.it }));
    const it2 = L2.rects[I.it], ro2 = L2.rects[I.robot];
    const prog = S.at('flip', 0.7, 1.7, 'out');
    const mid = arcBetween(S, it2, ro2, { tone: 'sig', lw: 2.6, dash: [6, 4], progress: prog, a: sec2, lift: lift(it2, ro2) });
    d.withAlpha(sec2 * S.reveal('flip', 1.5, 0.4), () => badge(S, S.l('robot', 'robot'), mid[0], mid[1] - 2 * u, { tone: 'sig' }));
    drawVec(it2, sec2 * S.reveal('flip', 1.0, 0.5), S.l('el mismo vector', 'the same vector'));
  }

  // «idea»: la atención como mezcla ponderada (pesos ilustrativos: son los que se calcularán)
  if (S.on('idea')) {
    const targets = ATT_IT.w.map((w, i) => ({ w, i })).filter((t) => t.i !== I.it && t.w >= 0.02).sort((a, b) => a.w - b.w);
    targets.forEach((t, k) => {
      const prog = S.at('idea', 0.4 + k * 0.12, 1.2 + k * 0.12, 'out'), r = L1.rects[t.i];
      arcBetween(S, it1, r, { tone: 'sig', lw: 1.4 + 9 * t.w, a: 0.9, progress: prog, lift: lift(it1, r), head: t.w > 0.04 });
    });
    d.withAlpha(S.reveal('idea', 1.4, 0.5), () => {
      L1.rects.forEach((r, i) => {
        const wv = ATT_IT.w[i];
        if (i === I.it || wv < 0.05) return;
        const firstLine = L1.lines > 1 && r.y < it1.y - 1;
        d.text(pct(S, wv) + ' %', r.x + r.w / 2, firstLine ? r.y - 11 * u : r.y + r.h + 11 * u, { size: fs(S, 12), weight: 800, font: 'mono', color: sig.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
      });
      d.text(S.l('pesos ilustrativos (los calcularemos)', 'illustrative weights (we will compute them)'), all.x, all.y + all.h - 2 * u, { size: fs(S, 12), weight: 600, color: p.mute, base: 'bottom' });
    });
  }
  void ro;

  // Neu: piensa mientras la frase espera; sonríe con la idea
  if (!S.portrait) neu(S, all.x + all.w - 78 * u, all.y + all.h - 58 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: S.on('idea') ? 'happy' : 'think', a: S.reveal('hook', 0.2, 0.5) });
}
