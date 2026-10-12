// Actos 1 y 2: la frase cortada en tokens por un tokenizador real (GPT-4o), sus números, el vocabulario;
// y por qué ni letras ni palabras (tres carriles con la misma frase).
import { alpha, box, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REAL, SENT, WORDS, type Lg } from './data';
import { ap, area, caption, countTag, downArrow, drawBlocks, fitBlocks, fitText, fits, fr, isShort, layBlocks, mv, type BLay } from './viz';

const RARE = [4, 5, 6, 7, 8];   // índices de los trozos del nombre raro en la frase de GPT-4o (es y en)

// ═════════ 1 · la frase, sus tokens y sus números ═════════
export function drawIntro(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, R = REAL.sent[L];
  const labels = R.pieces.map((s) => s.trim()), ids = R.ids.map(String);
  const A = area(S), short = isShort(S), land = !S.portrait;
  const main: Rect = land ? { x: A.x, y: A.y, w: A.w * 0.6, h: A.h } : A;
  const side: Rect | null = land ? { x: A.x + A.w * 0.65, y: A.y, w: A.w * 0.35, h: A.h } : null;

  // ranuras verticales (todas reservadas desde el principio: nada salta de lugar)
  const tkH = (short ? 24 : 32) * u, capH = (short ? 15 : 18) * u, g = (short ? 6 : 12) * u, tagH = (short ? 16 : 20) * u;
  const nums = ids.join('  '), oneLine = d.measure(nums, { size: 13, font: 'mono' }) + 24 * u < main.w;
  const modelH = (short ? 18 : 22) * u + (oneLine ? 1 : 2) * 18 * u + 8 * u;
  const fixedH = tkH + capH + g + tagH + g + modelH;
  const vocabMin = S.portrait ? 100 * u : 0;
  const lay = fitBlocks(S, labels, { w: main.w, h: Math.max(40 * u, main.h - fixedH - vocabMin) }, { size: short ? 17 : 22, minSize: 13, ids, center: true, maxRows: 2, breakAt: 4 });
  const total = fixedH + lay.h;
  const y0 = land ? main.y + Math.max(0, (main.h - total) / 2) : main.y;
  const yTk = y0, yCap = yTk + tkH, yB = yCap + capH, yTag = yB + lay.h + g, yM = yTag + tagH + g;
  const cx = main.x + main.w / 2;

  // tokenizador (segmento «tokenizer»)
  const aTk = ap(S, 'tokenizer', 0.04, 0.2);
  if (aTk > 0) {
    const bw = Math.min(250 * u, main.w);
    box(S, { x: cx - bw / 2, y: yTk, w: bw, h: tkH }, S.l('tokenizador: corta el texto', 'tokenizer: cuts the text'), { tone: 'lat', a: aTk, size: short ? 12 : 13, active: 0.4 });
    downArrow(S, cx, yTk + tkH + 2 * u, yB - 3 * u, aTk);
  }
  // «10 tokens» (segmento «token»)
  const aTok = ap(S, 'token', 0.05, 0.2);
  if (aTok > 0) caption(S, `${labels.length} tokens`, main.x, yCap + 1 * u, main.w * 0.4, { color: tone(S, 'lat').ink, a: aTok });

  // la frase → bloques
  const k = mv(S, 'cut', 0.06, 0.42);
  drawMorph(S, R.pieces, labels, ids, { x: main.x, y: yB, w: main.w, h: lay.h }, lay, k, ap(S, 'hook', 0.03, 0.15));
  // fuente: tokenizador real
  if (k > 0) { const cw = main.w / 2 - 14 * u, long = S.l('cortes reales de GPT-4o', 'real GPT-4o cuts'); caption(S, fits(S, long, cw) ? long : S.l('GPT-4o, real', 'GPT-4o, real'), main.x + main.w, yCap + 1 * u, cw, { align: 'right', a: ap(S, 'cut', 0.45, 0.6) }); }

  // marcas bajo los bloques: «5 trozos» (cut) y palabra / signo (token)
  const abs = lay.boxes.map((b) => ({ x: main.x + b.x, y: yB + b.y, w: b.w, h: b.h }));
  const aRare = ap(S, 'cut', 0.5, 0.65);
  if (aRare > 0) bracket(S, abs, RARE, yTag, S.l('5 trozos', '5 chunks'), 'err', aRare);
  if (aTok > 0) {
    const tag = (i: number, s: string) => { const b = abs[i]; fitText(S, s, b.x + b.w / 2, yTag + 2 * u, Math.max(b.w + 30 * u, 60 * u), { size: 12, weight: 700, color: tone(S, 'dat').ink, align: 'center', a: ap(S, 'token', 0.2 + 0.15 * (i === 9 ? 1 : 0), 0.35 + 0.15 * (i === 9 ? 1 : 0)) }); };
    if (lay.rowOf[1] === lay.rowOf[9]) tag(1, S.l('palabra', 'word'));
    else {   // dos filas: el rótulo va junto a la primera fila, a la derecha de su última palabra
      const lastTop = abs[lay.rowOf.lastIndexOf(lay.rowOf[1])], x = lastTop.x + lastTop.w + 8 * u, room = main.x + main.w - x;
      if (fits(S, S.l('← palabras', '← words'), room)) fitText(S, S.l('← palabras', '← words'), x, lastTop.y + lastTop.h / 2 - 8 * u, room, { size: 12, weight: 700, color: tone(S, 'dat').ink, a: ap(S, 'token', 0.2, 0.35) });
    }
    tag(9, S.l('signo', 'symbol'));
  }

  // el modelo solo recibe números (segmento «ids»)
  const aM = ap(S, 'ids', 0.38, 0.52);
  if (aM > 0) {
    const bw = Math.min(main.w, (oneLine ? d.measure(nums, { size: 13, font: 'mono' }) : main.w) + 24 * u);
    const r: Rect = { x: cx - bw / 2, y: yM, w: bw, h: modelH };
    d.withAlpha(aM, () => {
      downArrow(S, cx, yTag + tagH - 2 * u, yM - 2 * u);
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.ink, 0.04), stroke: p.lineStrong, lw: 1.5, r: 4 });
      caption(S, S.l('lo único que recibe el modelo', 'all the model receives'), cx, r.y + 6 * u, r.w - 12 * u, { align: 'center' });
      const shown = Math.floor(fr(S, 'ids', 0.45, 0.85) * ids.length + 0.999);
      const half = Math.ceil(ids.length / 2), lines = oneLine ? [ids] : [ids.slice(0, half), ids.slice(half)];
      let c = 0;
      lines.forEach((ln, li) => {
        const txt = ln.map((v) => (c++ < shown ? v : ' '.repeat(v.length))).join('  ');
        d.text(txt, cx, r.y + (short ? 20 : 24) * u + li * 18 * u, { size: 13, weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      });
    });
  }

  // vocabulario (segmento «vocab»)
  const aV = ap(S, 'vocab', 0.05, 0.2);
  if (aV > 0) {
    const vr: Rect = side ?? { x: main.x, y: yM + modelH + g * 1.5, w: main.w, h: main.y + main.h - (yM + modelH + g * 1.5) };
    drawVocab(S, vr, labels, R.ids as readonly number[], aV, fr(S, 'vocab', 0.15, 0.6));
  }
}

/** La frase escrita de corrido que se abre en bloques (k: 0 = texto, 1 = bloques). */
function drawMorph(S: Frame, raw: readonly string[], labels: string[], ids: string[], r: Rect, lay: BLay, k: number, a: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'lat'), size = lay.size;
  if (k >= 1) {   // ya son bloques: se dibujan con el resaltado del nombre raro
    const hiR = ap(S, 'cut', 0.5, 0.65) * (1 - 0.6 * ap(S, 'ids', 0, 0.15));
    drawBlocks(S, labels, r, { ids, idsA: ap(S, 'ids', 0.08, 0.3), hi: (i) => (RARE.includes(i) ? hiR : 0) }, lay);
    return;
  }
  const sp = d.measure(' ', { size, weight: 600, font: 'mono' });
  // posiciones de corrido, fila por fila (mismas filas que los bloques)
  const rows = new Map<number, number[]>();
  lay.rowOf.forEach((rr, i) => rows.set(rr, [...(rows.get(rr) ?? []), i]));
  const cont: number[] = [];
  for (const idx of rows.values()) {
    const ws = idx.map((i, j) => d.measure(j === 0 ? raw[i].trimStart() : raw[i], { size, weight: 600, font: 'mono' }));
    let x = r.x + (r.w - ws.reduce((s, v) => s + v, 0)) / 2;
    idx.forEach((i, j) => { const lead = j > 0 && raw[i].startsWith(' ') ? sp : 0; cont[i] = x + lead + d.measure(labels[i], { size, weight: 600, font: 'mono' }) / 2; x += ws[j]; });
  }
  d.withAlpha(a, () => labels.forEach((l, i) => {
    const b = lay.boxes[i], bx = r.x + b.x, by = r.y + b.y, x = lerp(cont[i], bx + b.w / 2, k);
    if (k > 0) d.rect(bx, by, b.w, b.h, { fill: alpha(t.c, (0.13 + 0.12 * (i % 2)) * k), stroke: t.c, lw: 1.3, r: 3, a: k });
    d.text(l, x, by + b.h / 2 + 0.5 * u, { size, weight: 600, font: 'mono', color: k > 0.5 ? t.ink : p.ink, align: 'center', base: 'middle' });
  }));
}

/** Corchete bajo un grupo de bloques de la última fila, con su rótulo debajo. */
function bracket(S: Frame, boxes: Rect[], idx: number[], y: number, label: string, tn: 'err' | 'dat', a: number) {
  const { d } = S, u = S.u, c = tone(S, tn), bs = idx.map((i) => boxes[i]);
  const x1 = Math.min(...bs.map((b) => b.x)), x2 = Math.max(...bs.map((b) => b.x + b.w));
  d.withAlpha(a, () => {
    d.polyline([[x1, y - 2 * u], [x1, y + 2 * u], [x2, y + 2 * u], [x2, y - 2 * u]], c.c, 1.6);
    d.text(label, (x1 + x2) / 2, y + 4 * u, { size: 12, weight: 700, color: c.ink, align: 'center', base: 'top' });
  });
}

/** La lista del vocabulario: el primer elemento, «⋮» y las piezas de la frase con su número. */
function drawVocab(S: Frame, r: Rect, labels: string[], ids: readonly number[], a: number, prog: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'lat');
  const ours = labels.map((l, i) => ({ id: ids[i], l })).sort((x, y) => x.id - y.id);
  const rowH = 19 * u, headH = 20 * u, footH = 18 * u;
  const perCol = Math.max(3, Math.floor((r.h - headH - footH) / rowH));
  const cols = Math.max(1, Math.min(r.w >= 240 * u ? 2 : 1, Math.ceil((ours.length + 3) / perCol)));
  const slots = perCol * cols - 3;
  const pick = ours.length <= slots ? ours : ours.filter((_, i) => i % Math.ceil(ours.length / slots) === 0).slice(0, slots);
  const items: ({ id: number; l: string } | null)[] = [{ id: 0, l: '!' }, null, ...pick, null];
  const colW = r.w / cols;
  d.withAlpha(a, () => {
    fitText(S, S.l('vocabulario de GPT-4o: número → pieza', 'GPT-4o vocabulary: number → piece'), r.x, r.y, r.w, { size: 13, weight: 800, color: t.ink });
    items.forEach((it, i) => {
      const c = Math.floor(i / perCol), row = i % perCol, x = r.x + c * colW, y = r.y + headH + row * rowH;
      const aa = clamp(prog * items.length - i);
      if (aa <= 0) return;
      d.withAlpha(aa, () => {
        const idW = 52 * u;
        if (!it) { d.text('⋮', x + idW - 4 * u, y + rowH / 2, { size: 14, weight: 700, color: p.mute, align: 'right', base: 'middle' }); return; }
        d.text(String(it.id), x + idW - 4 * u, y + rowH / 2, { size: 12, font: 'mono', weight: 500, color: p.ink2, align: 'right', base: 'middle' });
        const w = d.measure(it.l, { size: 13, weight: 600, font: 'mono' }) + 12 * u;
        d.rect(x + idW + 4 * u, y + 2 * u, w, rowH - 4 * u, { fill: alpha(t.c, it.id === 0 ? 0.06 : 0.2), stroke: it.id === 0 ? p.line : t.c, lw: 1.2, r: 3 });
        d.text(it.l, x + idW + 4 * u + w / 2, y + rowH / 2, { size: 13, weight: 600, font: 'mono', color: it.id === 0 ? p.ink2 : t.ink, align: 'center', base: 'middle' });
      });
    });
    const fy = r.y + headH + Math.min(items.length, perCol) * rowH + 4 * u;
    fitText(S, S.l(`… ${S.n(REAL.vocab.o200k_base, 0)} piezas en total`, `… ${S.n(REAL.vocab.o200k_base, 0)} pieces in all`), r.x, fy, r.w, { size: 12, weight: 700, color: p.ink2, a: clamp(prog * items.length - items.length + 1) });
  });
}

// ═════════ 2 · letra por letra, palabra por palabra, tokens ═════════
export function drawLanes(S: Frame) {
  const { pal: p } = S, u = S.u, L = S.lang as Lg, A = area(S), short = isShort(S);
  const letters = [...SENT[L]].map((c) => (c === ' ' ? '·' : c)), words = WORDS[L], toks = REAL.sent[L].pieces.map((s) => s.trim());
  const labelW = short ? 92 * u : 0, bw = A.w - labelW, headH = short ? 0 : 20 * u, g = (short ? 7 : 12) * u, noteH = (short ? 15 : 18) * u;
  // tamaños: se achican juntos hasta que todo cabe
  let s = short ? 15 : 19, Ls: BLay, Lw: BLay, Lt: BLay, need = 0;
  for (;;) {
    Ls = layBlocks(S, letters, bw, Math.max(12, s - 3), { gap: 3 });
    Lw = layBlocks(S, words, bw, s, {});
    Lt = layBlocks(S, toks, bw, s, { breakAt: 4 });
    const lane = (l: BLay) => (short ? Math.max(l.h, 34 * u) : headH + l.h);
    need = lane(Ls) + lane(Lw) + noteH + lane(Lt) + 3 * g;
    if (need <= A.h || s <= 12) break;
    s--;
  }
  const y0 = A.y + Math.max(0, (A.h - need) / 2);
  const lanes = [
    { seg: 'letters', lab: short ? S.l('letras', 'letters') : S.l('letra por letra', 'letter by letter'), labels: letters, lay: Ls, tn: 'mute' as const, n: letters.length },
    { seg: 'words', lab: short ? S.l('palabras', 'words') : S.l('palabra por palabra', 'word by word'), labels: words, lay: Lw, tn: 'dat' as const, n: words.length },
    { seg: 'middle', lab: S.l('tokens', 'tokens'), labels: toks, lay: Lt, tn: 'lat' as const, n: toks.length },
  ];
  let y = y0;
  lanes.forEach((ln, li) => {
    const a = ap(S, ln.seg, 0, 0.1);
    const laneH = short ? Math.max(ln.lay.h, 34 * u) : headH + ln.lay.h;
    if (a > 0) {
      const c = tone(S, ln.tn);
      const tagStr = `${ln.n} ${S.l('piezas', 'pieces')}`;
      if (short) {
        fitText(S, ln.lab, A.x, y + 1 * u, labelW - 8 * u, { size: 13, weight: 800, color: ln.tn === 'mute' ? p.ink2 : c.ink, a });
        countTag(S, tagStr, A.x, y + 26 * u, ln.tn === 'mute' ? 'ink' : ln.tn, { align: 'left', a: ap(S, ln.seg, 0.4, 0.5) });
      } else {
        fitText(S, ln.lab, A.x, y, A.w * 0.6, { size: 13, weight: 800, color: ln.tn === 'mute' ? p.ink2 : c.ink, a });
        countTag(S, tagStr, A.x + A.w, y + 8 * u, ln.tn === 'mute' ? 'ink' : ln.tn, { a: ap(S, ln.seg, 0.4, 0.5) });
      }
      const r: Rect = { x: A.x + labelW, y: y + headH, w: bw, h: ln.lay.h };
      const show = fr(S, ln.seg, 0.04, li === 0 ? 0.4 : 0.25) * ln.n;
      if (li === 0) {
        // el modelo trabaja pieza por pieza: un cursor recorre las treinta letras
        const scan = S.is('letters') ? fr(S, 'letters', 0.55, 0.95) : 0, at = scan > 0 && scan < 1 ? Math.floor(scan * ln.n) : -1;
        drawBlocks(S, ln.labels, r, { gap: 3, tone: 'mute', show, hi: (i) => (i === at ? 1 : 0) }, ln.lay);
      } else if (li === 1) {
        const w = ap(S, 'words-new', 0.35, 0.5) * (1 - 0.5 * ap(S, 'middle', 0, 0.2));
        drawBlocks(S, ln.labels, r, { tone: 'dat', show, warn: (i) => (i === 4 ? w : 0) }, ln.lay);
      } else {
        drawBlocks(S, ln.labels, r, { tone: 'lat', show, hi: (i) => (RARE.includes(i) ? 0.35 * ap(S, 'middle', 0.45, 0.6) : 0) }, ln.lay);
      }
    }
    y += laneH + g;
    if (li === 1) {
      // la lista de palabras que haría falta (words) y la palabra que no está (words-new)
      const a1 = ap(S, 'words', 0.45, 0.6) * (1 - ap(S, 'words-new', 0.3, 0.45)), a2 = ap(S, 'words-new', 0.35, 0.5);
      const x = A.x + labelW;
      if (a1 > 0) fitText(S, S.l('la lista necesitaría: gato, gatos, gata, gatas, gatito, gatitos, llamo, llamas, llamamos, llamaron…', 'the list would need: cat, cats, kitten, kittens, name, names, named, naming, renamed…'), x, y - g * 0.4, bw, { size: 12, weight: 600, color: p.ink2, a: a1 });
      if (a2 > 0) fitText(S, S.l('«Quetzalcóatl» no está en la lista', '“Quetzalcoatl” is not on the list'), x, y - g * 0.4, bw, { size: 12, weight: 700, color: tone(S, 'err').ink, a: a2 * (1 - 0.5 * ap(S, 'middle', 0, 0.2)) });
      y += noteH;
    }
  });
}
