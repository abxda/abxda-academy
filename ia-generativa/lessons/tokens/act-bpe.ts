// Acto 3: BPE en pequeño. Cinco palabras con su frecuencia; se cuentan las parejas vecinas y la escena fusiona sola,
// una por una, la más frecuente (cálculo real: `trace` de bpe.ts). Después, de dónde viene la idea.
import { alpha, bars, clamp, ease, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MINI, TRACE, pairCounts, type Lg } from './data';
import { ap, area, caption, fitText, fits, fr, isShort } from './viz';

/** Fusiones de la animación: en qué segmento y entre qué fracciones de su duración ocurre cada una. */
function transitions(L: Lg) {
  const n = TRACE[L].length - 1;   // es: 6 · en: 5
  const out: { seg: string; a: number; b: number; step: number }[] = [
    { seg: 'merge1', a: 0.12, b: 0.62, step: 1 },
    { seg: 'merge2', a: 0.4, b: 0.85, step: 2 },
  ];
  const rest = n - 2, span = 0.86 / rest;
  for (let s = 0; s < rest; s++) out.push({ seg: 'merge-run', a: 0.05 + s * span, b: 0.05 + s * span + span * 0.92, step: 3 + s });
  return out;
}

/** Estado de la animación: k fusiones ya hechas; hl = resaltado del par que se va a fundir; f = avance del deslizamiento. */
export function miniState(S: Frame) {
  const L = S.lang as Lg;
  let k = 0, hl = 0, f = 0;
  for (const tr of transitions(L)) {
    const q = fr(S, tr.seg, tr.a, tr.b);
    if (q <= 0) break;
    if (q >= 1) { k = tr.step; continue; }
    k = tr.step - 1; hl = clamp(q / 0.35); f = clamp((q - 0.35) / 0.5);
    break;
  }
  return { k, hl, f };
}

function layout(S: Frame) {
  const u = S.u, A = area(S), short = isShort(S), land = !S.portrait;
  let size = short ? 13 : 16, rowGap = (short ? 4 : 7) * u;
  const headH = (short ? 24 : 32) * u;
  const need = (sz: number, rg: number) => headH + 5 * ((sz + 10) * u + rg) + (land ? 0 : 20 * u + 3 * 20 * u + 14 * u + 18 * u + 2 * 28 * u + 10 * u);
  while (need(size, rowGap) > A.h && size > 12) { size -= 1; rowGap = Math.max(3 * u, rowGap - 1 * u); }
  const bh = (size + 10) * u, rowH = (short ? 17 : 20) * u;
  // en horizontal, todo el bloque se centra en vertical
  const leftH = headH + 5 * (bh + rowGap), rightH = headH + rowH + 19 * u + 3 * rowH + 10 * u + 18 * u + 2 * 28 * u;
  const oy = land ? Math.max(0, (A.h - Math.max(leftH, rightH)) / 2) : 0;
  const left: Rect = land ? { x: A.x, y: A.y + oy, w: A.w * 0.56, h: A.h - oy } : A;
  const rowsY = left.y + headH;
  const rowsBottom = rowsY + 5 * (bh + rowGap);
  const right: Rect = land ? { x: A.x + A.w * 0.6, y: A.y + oy + headH, w: A.w * 0.4, h: A.h - headH - oy } : { x: A.x, y: rowsBottom + 6 * u, w: A.w, h: A.y + A.h - rowsBottom - 6 * u };
  return { A, left, right, rowsY, bh, rowGap, size, headH, short, land };
}

export function drawMini(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, list = MINI[L], tr = TRACE[L], freq = list.map(([, n]) => n);
  const G = layout(S), t = tone(S, 'lat'), er = tone(S, 'err');
  const { k, hl, f } = miniState(S);
  const pad = Math.max(5, G.size * 0.4) * u, gp = 4 * u;
  const wOf = (s: string) => d.measure(s, { size: G.size, weight: 600, font: 'mono' }) + 2 * pad;

  // cabecera: BPE
  const aH = ap(S, 'bpe-q', 0.05, 0.2);
  d.withAlpha(aH, () => {
    const bw = d.text('BPE', G.left.x, G.left.y, { size: G.short ? 18 : 24, weight: 800, color: t.ink, base: 'top' }).w;
    fitText(S, S.l('codificación por pares de bytes', 'byte pair encoding'), G.left.x + bw + 10 * u, G.left.y + (G.short ? 4 : 7) * u, G.left.w - bw - 10 * u, { size: 12, weight: 600, color: p.mute });
  });

  // filas del corpus
  const aRows = (i: number) => ap(S, 'corpus', 0.04 + i * 0.06, 0.16 + i * 0.06);
  const split = ease.io(fr(S, 'corpus', 0.5, 0.78));
  const x0 = G.left.x + 34 * u;
  const rare = ap(S, 'rare-stays', 0.1, 0.3), rule = ap(S, 'bpe-rule', 0.0, 0.15);
  const pair = tr[k + 1]?.pair;
  const countRow = (i: number) => (S.is('count') ? ap(S, 'count', 0.12 + i * 0.12, 0.2 + i * 0.12) : 0);
  list.forEach(([word, n], wi) => {
    const a = aRows(wi);
    if (a <= 0) return;
    const y = G.rowsY + wi * (G.bh + G.rowGap);
    const dimRow = wi === 4 ? 0 : 0.55 * rare;
    d.withAlpha(a * (1 - dimRow) * (1 - 0.75 * rule), () => {
      d.text('×' + n, x0 - 8 * u, y + G.bh / 2, { size: 13, weight: 700, font: 'mono', color: p.ink2, align: 'right', base: 'middle' });
      if (split < 1) {   // la palabra entera que se abre en letras
        const letters = [...word];
        let x = x0;
        letters.forEach((c) => {
          const w = wOf(c), tw = d.measure(c, { size: G.size, weight: 600, font: 'mono' });
          const bx = lerp(x, x, 1), wv = lerp(tw, w, split);
          if (split > 0) d.rect(bx, y, wv, G.bh, { fill: alpha(t.c, 0.16 * split), stroke: t.c, lw: 1.3, r: 3, a: split });
          d.text(c, bx + wv / 2, y + G.bh / 2, { size: G.size, weight: 600, font: 'mono', color: split > 0.5 ? t.ink : p.ink, align: 'center', base: 'middle' });
          x += wv + gp * split;
        });
        return;
      }
      const op = tr[k].pieces[wi], np = f > 0 && tr[k + 1] ? tr[k + 1].pieces[wi] : null;
      const xsOf = (ps: string[]) => { let x = x0; return ps.map((s) => { const r = x; x += wOf(s) + gp; return r; }); };
      const block = (x: number, s: string, hi: number) => {
        d.rect(x, y, wOf(s), G.bh, { fill: alpha(t.c, 0.16 + 0.42 * hi), stroke: hi > 0.5 ? p.ink : t.c, lw: 1.3 + 1.2 * hi, r: 3 });
        d.text(s, x + wOf(s) / 2, y + G.bh / 2, { size: G.size, weight: 600, font: 'mono', color: hi > 0.5 ? p.ink : t.ink, align: 'center', base: 'middle' });
      };
      const xo = xsOf(op);
      if (!np || !pair) {
        const h = k === 0 && S.is('count') ? countRow(wi) : hl;
        const pr = k === 0 && S.is('count') ? tr[1].pair! : pair;
        op.forEach((s, i) => {
          const on = !!pr && h > 0 && ((i < op.length - 1 && op[i] === pr[0] && op[i + 1] === pr[1]) || (i > 0 && op[i - 1] === pr[0] && op[i] === pr[1]));
          block(xo[i], s, on ? h : 0);
        });
      } else {
        const xn = xsOf(np), e = ease.io(clamp(f / 0.85));
        let i = 0;
        np.forEach((ns, j) => {
          const merged = i < op.length - 1 && op[i] === pair[0] && op[i + 1] === pair[1] && op[i] + op[i + 1] === ns;
          if (merged) {
            if (f < 0.85) { block(lerp(xo[i], xn[j], e), op[i], 1); block(lerp(xo[i + 1], xn[j] + wOf(op[i]), e), op[i + 1], 1); }
            else block(xn[j], ns, 1 - (f - 0.85) / 0.15);
            i += 2;
          } else { block(lerp(xo[i], xn[j], e), op[i], 0); i += 1; }
        });
      }
      if (wi === 4 && rare > 0) {   // la palabra rara se queda en trozos
        const xs = xsOf(op), x2 = xs[xs.length - 1] + wOf(op[op.length - 1]);
        d.rect(x0 - 3 * u, y - 3 * u, x2 - x0 + 6 * u, G.bh + 6 * u, { stroke: er.c, lw: 2, r: 4, dash: [4, 3], a: rare });
        const lx = x2 + 10 * u, room = G.left.x + G.left.w - lx;
        { const long = S.l('apareció 1 vez: se queda en trozos', 'appeared once: stays in chunks'), brief = S.l('1 vez: en trozos', 'once: in chunks'), str = fits(S, long, room) ? long : brief; if (fits(S, str, room)) fitText(S, str, lx, y + G.bh / 2 - 7 * u, room, { size: 12, weight: 700, color: er.ink, a: rare }); }
      }
    });
  });

  // panel derecho / inferior: la suma, la tabla de parejas y la lista de piezas
  const R = G.right, rowH = (G.short ? 17 : 20) * u;
  let y = R.y;
  const aSum = ap(S, 'count', 0.1, 0.2) * (1 - ap(S, 'merge2', 0, 0.1));
  const aTab = Math.max(ap(S, 'count', 0.78, 0.9), S.on('merge1') ? 1 : 0);
  d.withAlpha(1 - 0.75 * rule, () => {
    if (aSum > 0) {
      const terms = freq.map((v, i) => (countRow(i) > 0 || !S.is('count') ? String(v) : '')).filter(Boolean);
      const done = !S.is('count') || fr(S, 'count', 0.7, 0.72) >= 1;
      const pr = tr[1].pair!;
      fitText(S, `«${pr[0]}» «${pr[1]}»: ${terms.join(' + ')}${done ? ' = ' + tr[1].count : ''}`, R.x, y, R.w, { size: 13, weight: 800, font: 'mono', color: t.ink, a: aSum });
    }
    y += rowH + 2 * u;
    if (aTab > 0) {
      const tableK = S.on('merge2') ? k : 0;
      const rows = pairCounts(tr[tableK].pieces, freq).slice(0, 3);
      d.withAlpha(aTab, () => {
        caption(S, S.l('parejas vecinas: cuántas veces', 'neighboring pairs: how many times'), R.x, y, R.w);
        bars(S, { x: R.x, y: y + 17 * u, w: R.w, h: rowH * rows.length }, rows.map((r, i) => ({ label: `${r.a} ${r.b}`, value: r.n, tone: i === 0 ? 'lat' as const : 'mute' as const, hot: i === 0 })), { max: 15, labelW: Math.min(70 * u, R.w * 0.3), rowH, fmt: (v) => String(v), size: 13 });
      });
    }
    y += 17 * u + rowH * 3 + 10 * u;
    // la lista de piezas: letras sueltas y las piezas nuevas
    const aList = ap(S, 'corpus', 0.8, 0.95);
    if (aList > 0) {
      const base = [...new Set(list.map(([w]) => w).join(''))];
      const made = tr.slice(1, k + 1).map((s) => s.made!);
      d.withAlpha(aList, () => {
        caption(S, S.l(`lista de piezas: ${base.length + made.length}`, `list of pieces: ${base.length + made.length}`), R.x, y, R.w);
        let cx = R.x, cy = y + 18 * u;
        const th = (G.short ? 20 : 24) * u;
        [...base, ...made].forEach((s, i) => {
          const isNew = i >= base.length, w = d.measure(s, { size: 13, weight: 600, font: 'mono' }) + 12 * u;
          if (cx + w > R.x + R.w) { cx = R.x; cy += th + 4 * u; }
          const fresh = isNew && i === base.length + made.length - 1 && f === 0 && hl === 0 && S.on('merge1') ? 1 : 0;
          d.rect(cx, cy, w, th, { fill: alpha(isNew ? t.c : p.mute, isNew ? 0.22 + 0.3 * fresh : 0.1), stroke: isNew ? t.c : p.line, lw: 1.2 + fresh, r: 3 });
          d.text(s, cx + w / 2, cy + th / 2, { size: 13, weight: 600, font: 'mono', color: isNew ? t.ink : p.ink2, align: 'center', base: 'middle' });
          cx += w + 4 * u;
        });
      });
    }
  });

  // la regla, como tarjeta (bpe-rule)
  if (rule > 0) {
    const w = Math.min(G.A.w * 0.9, 380 * u), steps = [S.l('1  contar las parejas vecinas', '1  count neighboring pairs'), S.l('2  fusionar la más frecuente', '2  merge the most frequent'), S.l('3  repetir', '3  repeat')];
    const lh = (G.short ? 24 : 30) * u, h = lh * steps.length + 40 * u, x = G.A.x + (G.A.w - w) / 2, y0 = G.A.y + (G.A.h - h) / 2;
    d.withAlpha(rule, () => {
      d.rect(x, y0, w, h, { fill: p.surface, stroke: t.c, lw: 1.5, r: 6 });
      caption(S, S.l('BPE, completo', 'BPE, complete'), x + 16 * u, y0 + 12 * u, w - 32 * u, { color: t.ink });
      steps.forEach((s, i) => d.withAlpha(ap(S, 'bpe-rule', 0.1 + i * 0.12, 0.22 + i * 0.12), () => fitText(S, s, x + 16 * u, y0 + 34 * u + i * lh, w - 60 * u, { size: G.short ? 14 : 16, weight: 700, color: p.ink })));
      // flecha de vuelta: de «repetir» a «contar»
      const ax = x + w - 26 * u, a3 = ap(S, 'bpe-rule', 0.5, 0.65);
      if (a3 > 0) d.withAlpha(a3, () => { d.polyline([[ax - 14 * u, y0 + 34 * u + 2 * lh + 9 * u], [ax, y0 + 34 * u + 2 * lh + 9 * u], [ax, y0 + 34 * u + 9 * u]], t.c, 1.8); d.arrow(ax, y0 + 34 * u + 9 * u, ax - 14 * u, y0 + 34 * u + 9 * u, t.c, 1.8, 7); });
    });
  }
}

// ═════════ de dónde viene: 1994 y 2016 ═════════
export function drawOrigin(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), land = !S.portrait, short = isShort(S), t = tone(S, 'lat');
  const items = [
    { year: '1994', who: 'Philip Gage', what: S.l('comprimir archivos: cambiar la pareja de bytes más frecuente por un byte nuevo', 'compress files: replace the most frequent pair of bytes with a new byte'), a: ap(S, 'bpe-origin', 0.04, 0.18) },
    { year: '2016', who: S.l('Sennrich, Haddow y Birch', 'Sennrich, Haddow and Birch'), what: S.l('partir las palabras raras en trozos para traducirlas', 'split rare words into chunks to translate them'), a: ap(S, 'bpe-origin', 0.42, 0.56) },
  ];
  if (land) {
    const yL = A.y + A.h * (short ? 0.3 : 0.36), x1 = A.x + A.w * 0.08, x2 = A.x + A.w * 0.92;
    d.line(x1, yL, x1 + (x2 - x1) * Math.max(items[0].a, items[1].a > 0 ? 1 : items[0].a * 0.5), yL, p.lineStrong, 2);
    items.forEach((it, i) => {
      const cx = A.x + A.w * (i === 0 ? 0.27 : 0.73), cw = A.w * 0.42;
      d.withAlpha(it.a, () => {
        d.circle(cx, yL, 7 * u, { fill: t.c });
        d.text(it.year, cx, yL - 14 * u, { size: short ? 20 : 26, weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'bottom' });
        fitText(S, it.who, cx, yL + 14 * u, cw, { size: 14, weight: 800, color: p.ink, align: 'center' });
        d.text(it.what, cx, yL + (short ? 34 : 38) * u, { size: 13, weight: 600, color: p.ink2, align: 'center', base: 'top', w: cw });
      });
    });
  } else {
    const xL = A.x + 10 * u, y1 = A.y + A.h * 0.12, gap = A.h * 0.42;
    d.line(xL, y1, xL, y1 + gap * Math.max(items[0].a, items[1].a > 0 ? 1 : items[0].a * 0.5), p.lineStrong, 2);
    items.forEach((it, i) => {
      const y = y1 + i * gap, x = xL + 22 * u, w = A.x + A.w - x;
      d.withAlpha(it.a, () => {
        d.circle(xL, y + 12 * u, 7 * u, { fill: t.c });
        d.text(it.year, x, y, { size: 26, weight: 800, font: 'mono', color: t.ink, base: 'top' });
        fitText(S, it.who, x, y + 34 * u, w, { size: 14, weight: 800, color: p.ink });
        d.text(it.what, x, y + 56 * u, { size: 13, weight: 600, color: p.ink2, base: 'top', w });
      });
    });
  }
}
