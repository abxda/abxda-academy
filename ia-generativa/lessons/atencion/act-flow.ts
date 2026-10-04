// Acto D (origin → cost): de dónde viene la atención (2014 y 2017), por qué cuando no hay turno todo va a la vez
// (red recurrente frente a atención) y el precio: las comparaciones crecen con el cuadrado de la longitud.
import { alpha, badge, clamp, inset, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { I, N, TOK } from './data';
import { actAlpha, arcBetween, fs, textBlock } from './ui';

// ───────────────────────────── origin ─────────────────────────────
/** Mini esquema: fila de cajas (el texto de origen) y, según el modo, cadena recurrente + mirada del decodificador, o malla de atención sin cadena. */
function miniSeq(S: Frame, r: Rect, mode: 'bahdanau' | 'vaswani', a: number, cross: number) {
  const { d, pal: p } = S, u = S.u, sig = tone(S, 'sig'), lat = tone(S, 'lat'), n = 5;
  const bw = Math.min(46 * u, r.w / (n + 1.2)), bh = Math.min(26 * u, r.h * 0.26), gap = (r.w - n * bw) / (n - 1);
  const rowY = mode === 'bahdanau' ? r.y + r.h * 0.5 : r.y + r.h * 0.56;
  const boxes: Rect[] = Array.from({ length: n }, (_, i) => ({ x: r.x + i * (bw + gap), y: rowY - bh / 2, w: bw, h: bh }));
  d.withAlpha(a, () => {
    // cadena recurrente (el estado pasa de una palabra a la siguiente)
    boxes.slice(0, -1).forEach((b, i) => d.arrow(b.x + b.w + 1, rowY, boxes[i + 1].x - 1, rowY, p.ink2, 1.6, 6, 1 - cross));
    boxes.forEach((b) => d.rect(b.x, b.y, b.w, b.h, { fill: lat.soft, stroke: lat.c, lw: 1.5, r: 2 }));
    if (mode === 'bahdanau') {
      const decW = Math.max(88 * u, d.measure(S.l('decodificador', 'decoder'), { size: fs(S, 12), weight: 700 }) + 16 * u);
      const dec: Rect = { x: r.x + r.w / 2 - decW / 2, y: r.y + r.h - bh - 2 * u, w: decW, h: bh };
      const wts = [0.05, 0.15, 0.5, 0.2, 0.1];
      boxes.forEach((b, i) => {
        const x1 = dec.x + dec.w / 2 + (i - 2) * 14 * u, y1 = dec.y, x2 = b.x + b.w / 2, y2 = b.y + b.h;
        d.curve(x1, y1, x2, y2, alpha(sig.c, 0.95), 1 + 7 * wts[i], { bend: 0 });
      });
      d.rect(dec.x, dec.y, dec.w, dec.h, { fill: alpha(sig.c, 0.14), stroke: sig.c, lw: 1.5, r: 2 });
      d.text(S.l('decodificador', 'decoder'), dec.x + dec.w / 2, dec.y + dec.h / 2, { size: fs(S, 12), weight: 700, color: sig.ink, align: 'center', base: 'middle' });
      d.text(S.l('origen', 'source'), r.x, r.y + 2 * u, { size: fs(S, 12), weight: 600, color: p.mute, base: 'top' });
    } else {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) arcBetween(S, boxes[i], boxes[j], { tone: 'sig', lw: 1.3, a: 0.5, head: false, lift: (10 + (j - i) * 10) * u });
      if (cross > 0.02) boxes.slice(0, -1).forEach((b, i) => { const mx = (b.x + b.w + boxes[i + 1].x) / 2; const e = tone(S, 'err').c; d.line(mx - 4 * u, rowY - 5 * u, mx + 4 * u, rowY + 5 * u, e, 2.2, undefined, cross); d.line(mx - 4 * u, rowY + 5 * u, mx + 4 * u, rowY - 5 * u, e, 2.2, undefined, cross); });
      if (cross > 0.5) d.text(S.l('sin recurrencia', 'no recurrence'), r.x + r.w / 2, r.y + r.h - 2 * u, { size: fs(S, 12), weight: 700, color: tone(S, 'err').ink, align: 'center', base: 'bottom', a: (cross - 0.5) * 2 });
    }
  });
}

export function drawOrigin(S: Frame) {
  const A = actAlpha(S, 'origin', 'parallel'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), sig = tone(S, 'sig');
  const cards = [
    { year: '2014', who: 'Bahdanau, Cho, Bengio', what: S.l('Traducción: el decodificador puede mirar el texto de origen.', 'Translation: the decoder can look back at the source text.'), mode: 'bahdanau' as const, a: S.reveal('origin', 0.3, 0.7), cross: 0 },
    { year: '2017', who: 'Vaswani et al.', what: S.l('«Attention Is All You Need»: solo atención, sin recurrencia.', '“Attention Is All You Need”: attention only, no recurrence.'), mode: 'vaswani' as const, a: S.reveal('origin', 3.6, 0.7), cross: S.at('origin', 5.2, 6.4) },
  ];
  d.withAlpha(A, () => {
    const gap = 12 * u, cw = S.portrait ? all.w : (all.w - gap) / 2, chh = S.portrait ? (all.h - gap) / 2 : all.h;
    cards.forEach((c, i) => {
      const r: Rect = S.portrait ? { x: all.x, y: all.y + i * (chh + gap), w: cw, h: chh } : { x: all.x + i * (cw + gap), y: all.y, w: cw, h: chh };
      d.withAlpha(c.a, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1.25, r: 3 });
        const pad = 12 * u;
        d.text(c.year, r.x + pad, r.y + pad, { size: fs(S, S.portrait ? 24 : 32), weight: 800, font: 'mono', color: sig.ink, base: 'top' });
        d.text(c.who, r.x + r.w - pad, r.y + pad + 4 * u, { size: fs(S, 14), weight: 800, color: p.ink, align: 'right', base: 'top' });
        const ty = r.y + pad + (S.portrait ? 34 : 46) * u;
        const tb = textBlock(S, c.what, r.x + pad, ty + (S.portrait ? 12 : 18) * u, r.w - 2 * pad, { size: fs(S, 13), lh: 1.25, color: p.ink2 });
        const top = ty + (S.portrait ? 12 : 18) * u + tb.h / 2 + 8 * u;
        const avail = r.y + r.h - top - pad, dh = Math.min(avail, 170 * u);
        miniSeq(S, { x: r.x + pad + 6 * u, y: top + (avail - dh) / 2, w: r.w - 2 * pad - 12 * u, h: dh }, c.mode, 1, c.cross);
      });
    });
    if (!S.portrait) d.withAlpha(S.reveal('origin', 3.6, 0.7), () => d.arrow(all.x + cw - 2, all.y + 30 * u, all.x + cw + gap + 2, all.y + 30 * u, p.ink2, 2, 8));
  });
}

// ───────────────────────────── parallel ─────────────────────────────
export function drawParallel(S: Frame) {
  const A = actAlpha(S, 'parallel', 'cost'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), words = TOK[S.lang], sig = tone(S, 'sig'), w = tone(S, 'w'), lat = tone(S, 'lat');
  const gap = 5 * u, bw = (all.w - 8 * gap) / 9, useWords = bw >= 58 * u, bh = Math.min(34 * u, bw), size = fs(S, 12);
  const rowH = (all.h - 20 * u) / 2, size2 = fs(S, 13);
  const stepT = 0.4, t0 = 0.5, tAtt = t0 + 9 * stepT + 0.6;
  d.withAlpha(A, () => {
    for (const row of [0, 1] as const) {
      const y0 = all.y + row * (rowH + 20 * u), cy = y0 + rowH * (S.portrait ? 0.52 : 0.5);
      const boxes: Rect[] = Array.from({ length: 9 }, (_, i) => ({ x: all.x + i * (bw + gap), y: cy - bh / 2, w: bw, h: bh }));
      d.text(row === 0 ? S.l('red recurrente: uno tras otro', 'recurrent network: one after another') : S.l('atención: todas a la vez', 'attention: all at once'), all.x, y0 + 2 * u, { size: size2, weight: 800, color: row === 0 ? w.ink : sig.ink, base: 'top' });
      const lit = row === 0 ? clamp((S.since('parallel') - t0) / stepT, 0, 9) : S.on('parallel') ? S.at('parallel', tAtt, tAtt + 0.5) : 0;
      boxes.forEach((b, i) => {
        const on = row === 0 ? clamp(lit - i) : lit, t = row === 0 ? w : sig;
        d.rect(b.x, b.y, b.w, b.h, { fill: alpha(t.c, 0.1 + 0.55 * on), stroke: t.c, lw: 1.5, r: 3 });
        d.text(useWords ? words[i] : String(i + 1), b.x + b.w / 2, b.y + b.h / 2, { size, weight: 700, color: on > 0.6 ? p.stage : lat.ink, align: 'center', base: 'middle' });
      });
      if (row === 0) {
        boxes.slice(0, -1).forEach((b, i) => d.arrow(b.x + b.w + 1, cy, boxes[i + 1].x - 1, cy, w.c, 1.8, 6, 0.35 + 0.65 * clamp(lit - i - 0.5)));
        // pulso que avanza
        if (lit < 9 && S.on('parallel')) { const k = Math.min(8, Math.floor(lit)), f = lit - k, b = boxes[k], nb = boxes[Math.min(8, k + 1)]; d.circle(lerp(b.x + b.w / 2, nb.x + nb.w / 2, f), cy - bh / 2 - 8 * u, 5 * u, { fill: w.c, stroke: p.stage, lw: 1.5 }); }
        d.text(S.l('pasos en fila: ', 'steps in a row: ') + Math.min(9, Math.ceil(lit)), all.x + all.w, y0 + (S.portrait ? 20 : 2) * u, { size: size2, weight: 800, font: 'mono', color: w.ink, align: 'right', base: 'top' });
        // camino robot → pesado
        d.withAlpha(clamp(lit - 8), () => { const a = boxes[I.robot], b = boxes[8]; d.line(a.x + a.w / 2, cy + bh / 2 + 8 * u, b.x + b.w / 2, cy + bh / 2 + 8 * u, w.c, 2, [5, 4]); d.text(S.l('robot → pesado: 7 pasos', 'robot → heavy: 7 steps'), (a.x + b.x + b.w) / 2, cy + bh / 2 + 12 * u, { size: size2, weight: 700, color: w.ink, align: 'center', base: 'top' }); });
      } else {
        for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) arcBetween(S, boxes[i], boxes[j], { tone: 'sig', lw: 1.2, a: 0.28 * lit, head: false, lift: Math.min(70 * u, 10 * u + (j - i) * 8 * u) });
        const a = boxes[I.robot], b = boxes[8];
        arcBetween(S, a, b, { tone: 'sig', lw: 3.2, a: lit, head: true, lift: Math.min(70 * u, 10 * u + 7 * 8 * u) });
        d.text(S.l('pasos: 1', 'steps: 1'), all.x + all.w, y0 + (S.portrait ? 20 : 2) * u, { size: size2, weight: 800, font: 'mono', color: sig.ink, align: 'right', base: 'top', a: lit });
        d.withAlpha(lit, () => d.text(S.l('robot → pesado: 1 paso', 'robot → heavy: 1 step'), (a.x + b.x + b.w) / 2, cy + bh / 2 + 12 * u, { size: size2, weight: 700, color: sig.ink, align: 'center', base: 'top' }));
      }
    }
  });
}

// ───────────────────────────── cost ─────────────────────────────
export function drawCost(S: Frame) {
  const A = actAlpha(S, 'cost', 'heads-why'); if (A <= 0) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), sig = tone(S, 'sig'), err = tone(S, 'err');
  const n = 8, pad = S.portrait ? 0 : 6 * u;
  const gw = S.portrait ? all.w : all.w * 0.5, gh = S.portrait ? all.h * 0.6 : all.h;
  const cs = Math.min((gw - pad) / n, (gh - 30 * u) / n), gx = all.x + (S.portrait ? (all.w - cs * n) / 2 : 0), gy = all.y + 22 * u;
  const q = [S.reveal('cost', 0.2, 0.6), S.reveal('cost', 2.4, 0.6), S.reveal('cost', 2.8, 0.6), S.reveal('cost', 3.2, 0.6)];  // cuadrantes: arriba-izq (n = 4), luego los otros tres
  d.withAlpha(A, () => {
    d.text(S.l('cada palabra se compara con todas', 'every word is compared with all'), gx, all.y + 2 * u, { size: fs(S, 13), weight: 700, color: p.mute, base: 'top' });
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = (i < 4 ? 0 : 1) * 2 + (j < 4 ? 0 : 1), qi = k === 0 ? q[0] : k === 1 ? q[1] : k === 2 ? q[2] : q[3];
      d.rect(gx + j * cs, gy + i * cs, cs - 1.5, cs - 1.5, { fill: k === 0 ? alpha(sig.c, 0.7) : alpha(err.c, 0.55), a: qi });
    }
    // marcas de los dos tamaños
    d.rect(gx - 1.5, gy - 1.5, cs * 4 + 1.5, cs * 4 + 1.5, { stroke: sig.c, lw: 2.5, a: q[0] });
    d.rect(gx - 1.5, gy - 1.5, cs * 8 + 1.5, cs * 8 + 1.5, { stroke: err.c, lw: 2.5, a: q[3] });
    // cuentas
    const tx = S.portrait ? all.x : gx + cs * n + 22 * u, ty = S.portrait ? gy + cs * n + 14 * u : all.y + all.h * 0.2, tw = S.portrait ? all.w : all.w - (tx - all.x);
    const big = fs(S, S.portrait ? 24 : 34);
    d.withAlpha(q[0], () => {
      d.text(S.l('4 palabras', '4 words'), tx, ty, { size: fs(S, 14), weight: 700, color: sig.ink, base: 'top' });
      d.text('4 × 4 = 16', tx + (S.portrait ? 0 : 0), ty + 20 * u, { size: big, weight: 800, font: 'mono', color: sig.ink, base: 'top' });
    });
    const y2 = ty + (S.portrait ? 62 : 86) * u;
    d.withAlpha(q[3], () => {
      d.text(S.l('8 palabras (el doble)', '8 words (double)'), tx, y2, { size: fs(S, 14), weight: 700, color: err.ink, base: 'top' });
      d.text('8 × 8 = 64', tx, y2 + 20 * u, { size: big, weight: 800, font: 'mono', color: err.ink, base: 'top' });
      badge(S, S.l('el doble de texto = 4 veces más', 'twice the text = 4 times more'), tx, y2 + (S.portrait ? 74 : 98) * u, { tone: 'err', align: 'left', size: fs(S, 13) });
    });
    void tw;
  });
  void N;
}
