// Primera parte de la escena: el gancho, el modelo de juguete, los tokens, el embedding, la posición y su suma.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LAST, PROMPT, trace, type Lay } from './data';
import { chip, chipRow, compact, fz, grid, measure, node, strip, txt, arrowP } from './draw';
import { TINY } from './weights';
import { posEnc, VOCAB, type Lang } from './model';
import { countParams, GPT3, TOY } from './params';
import { fmtInt } from './draw';

const words = (S: Frame) => PROMPT[S.lang as Lang];
const vocab = (S: Frame) => VOCAB(S.lang as Lang);

// ═════════════ gancho: texto → transformer → probabilidades ═════════════
export function vHook(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, w = words(S);
  const ink = tone(S, 'ink');
  const boxW = port ? Math.min(b.w, 300) : 168, boxH = port ? 112 : 128;
  const chipH = 28;
  // posiciones: vertical en teléfono, horizontal en pantalla ancha
  const inR: Rect = port ? { x: b.x, y: b.y + 4, w: b.w, h: chipH } : { x: b.x, y: b.y + (b.h - boxH) / 2 + boxH / 2 - 40, w: 150, h: 80 };
  const bx = port ? b.x + (b.w - boxW) / 2 : b.x + (b.w - boxW) / 2, by = port ? b.y + 70 : b.y + (b.h - boxH) / 2;
  const outR: Rect = port ? { x: b.x + 20, y: by + boxH + 46, w: b.w - 40, h: b.h - (by - b.y) - boxH - 50 } : { x: bx + boxW + 54, y: by, w: b.w - (bx - b.x) - boxW - 54, h: boxH };
  // texto de entrada
  const a0 = S.reveal('hook', 0.1, 0.5);
  d.withAlpha(a0, () => {
    if (port) {
      let x = b.x + (b.w - (w.reduce((s, t) => s + measure(S, t, 14) + 18 + 6, -6))) / 2;
      w.forEach((t) => { x += chip(S, x, inR.y, t, { tone: 'lat' }) + 6; });
      arrowP(S, b.x + b.w / 2, inR.y + chipH + 6, b.x + b.w / 2, by - 4, { tone: 'ink', p: S.reveal('hook', 0.5, 0.5) });
    } else {
      let y = by + 8;
      w.forEach((t) => { chip(S, inR.x + 30, y, t, { tone: 'lat', w: 96 }); y += chipH + 8; });
      arrowP(S, inR.x + 140, by + boxH / 2, bx - 4, by + boxH / 2, { tone: 'ink', p: S.reveal('hook', 0.5, 0.5) });
    }
  });
  // la caja «transformer» con las tres piezas que ya conoces
  const ab = S.reveal('hook', 0.4, 0.6);
  d.withAlpha(ab, () => {
    d.rect(bx, by, boxW, boxH, { fill: ink.soft, stroke: p.lineStrong, lw: 2, r: 4 });
    txt(S, 'transformer', bx + boxW / 2, by + 16, { s: 15, weight: 800, align: 'center', mono: true });
  });
  const pieces: [string, 'lat' | 'sig', string][] = [[S.l('tokens', 'tokens'), 'lat', 'a'], [S.l('embeddings', 'embeddings'), 'lat', 'b'], [S.l('atención', 'attention'), 'sig', 'c']];
  if (port) {
    const ws = pieces.map(([t]) => measure(S, t, 13) + 16), tot = ws.reduce((s, q) => s + q, 0) + 12;
    let x = bx + (boxW - tot) / 2;
    pieces.forEach(([t, tn], i) => { const a = S.reveal('hook', 1.2 + i * 0.9, 0.5); chip(S, x, by + 44, t, { tone: tn, h: 26, s: 13, a }); x += ws[i] + 6; });
  } else {
    pieces.forEach(([t, tn], i) => { const a = S.reveal('hook', 1.2 + i * 0.9, 0.5); chip(S, bx + 14, by + 36 + i * 30, t, { tone: tn, h: 26, s: 13, a, w: boxW - 28 }); });
  }
  // la salida: probabilidades todavía desconocidas
  const ao = S.reveal('hook', 3.4, 0.6);
  d.withAlpha(ao, () => {
    if (port) arrowP(S, b.x + b.w / 2, by + boxH + 4, b.x + b.w / 2, outR.y - 4, { tone: 'ink' });
    else arrowP(S, bx + boxW + 4, by + boxH / 2, outR.x - 4, by + boxH / 2, { tone: 'ink' });
    const rows = 5, rh = Math.min(20, (outR.h - 22) / rows), lenA = [0.7, 0.45, 0.3, 0.2, 0.12];
    txt(S, S.l('siguiente palabra', 'next word'), outR.x, outR.y + 8, { s: 13, weight: 700, c: p.ink2 });
    for (let i = 0; i < rows; i++) {
      const y = outR.y + 22 + i * rh;
      d.rect(outR.x, y + 2, (outR.w - 26) * lenA[i], rh - 5, { fill: alpha(p.mute, 0.3), stroke: p.mute, lw: 1, dash: [3, 3] });
    }
    txt(S, '?', outR.x + outR.w - 10, outR.y + 22 + (rows * rh) / 2, { s: 24, weight: 800, c: p.mute, align: 'center' });
  });
}

// ═════════════ el modelo de juguete: doce palabras y su tamaño ═════════════
export function vToy(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, V = vocab(S);
  const groups: [string, string[], 'lat'][] = [
    [S.l('estructura', 'structure'), [V[1], V[0]], 'lat'],
    [S.l('sujetos', 'subjects'), V.slice(2, 5), 'lat'],
    [S.l('verbos', 'verbs'), V.slice(5, 7), 'lat'],
    [S.l('objetos', 'objects'), V.slice(7, 12), 'lat'],
  ];
  const showSize = S.on('toy-size');
  const leftW = port ? b.w : (showSize ? Math.min(b.w * 0.5, 300) : b.w), rowH = 34;
  const labW = port ? 0 : 74;
  let y = b.y + 2;
  groups.forEach(([lab, items, tn], gi) => {
    const a = S.reveal('toy', 0.2 + gi * 0.35, 0.5);
    d.withAlpha(a, () => {
      if (port) {
        txt(S, lab, b.x, y + 6, { s: 12, c: p.mute, weight: 700, base: 'top' });
        const r = chipRow(S, b.x, y + 20, leftW, items.map((t) => (t === '.' ? '«.»' : t)), { tone: tn, h: 26, s: 14 });
        y += 20 + r.h + 8;
      } else {
        txt(S, lab, b.x, y + rowH / 2 - 2, { s: 13, c: p.mute, weight: 700 });
        const r = chipRow(S, b.x + labW, y, leftW - labW, items.map((t) => (t === '.' ? '«.»' : t)), { tone: tn, h: 28, s: 14 });
        y += Math.max(rowH, r.h) + 8;
      }
    });
  });
  // frase de ejemplo
  const ex = S.lang === 'es' ? ['el', 'gato', 'bebe', 'leche', '.'] : ['the', 'cat', 'drinks', 'milk', '.'];
  const ae = S.reveal('toy', 2.0, 0.6);
  d.withAlpha(ae, () => {
    txt(S, S.l('una frase del juguete', 'a toy sentence'), b.x, y + 6, { s: 12, c: p.mute, weight: 700, base: 'top' });
    chipRow(S, b.x, y + 22, leftW, ex.map((t) => (t === '.' ? '«.»' : t)), { tone: 'lat', h: 26, s: 14 });
  });
  // tamaño frente a GPT-3
  if (showSize) {
    const a = S.reveal('toy-size', 0.1, 0.6), r: Rect = port ? { x: b.x, y: Math.max(y + 62, b.y + b.h - 118), w: b.w, h: 116 } : { x: b.x + leftW + 24, y: b.y + 4, w: b.w - leftW - 24, h: 190 };
    const rows: [string, string, string][] = [
      [S.l('números por palabra', 'numbers per word'), '8', fmtInt(S, 12288)],
      [S.l('bloques', 'blocks'), '2', '96'],
      [S.l('cabezas por bloque', 'heads per block'), '2', '96'],
      [S.l('parámetros', 'parameters'), fmtInt(S, countParams(TOY).total), fmtInt(S, 175e9)],
    ];
    d.withAlpha(a, () => {
      const c2 = r.x + r.w - 118 * 1, c1 = c2 - 74, rh = (r.h - 22) / rows.length;
      txt(S, S.l('juguete', 'toy'), c1 + 70, r.y + 8, { s: 13, weight: 800, c: tone(S, 'lat').ink, align: 'right' });
      txt(S, 'GPT-3', c2 + 118, r.y + 8, { s: 13, weight: 800, c: tone(S, 'w').ink, align: 'right' });
      rows.forEach(([lab, a1, a2], i) => {
        const yy = r.y + 22 + i * rh + rh / 2, last = i === rows.length - 1;
        d.line(r.x, yy - rh / 2, r.x + r.w, yy - rh / 2, p.line, 1);
        txt(S, lab, r.x, yy, { s: 12, c: p.ink2, weight: 600 });
        txt(S, a1, c1 + 70, yy, { s: last ? 14 : 13, mono: true, weight: 800, align: 'right', c: tone(S, 'lat').ink });
        txt(S, a2, c2 + 118, yy, { s: last ? 14 : 13, mono: true, weight: 800, align: 'right', c: tone(S, 'w').ink });
      });
    });
  }
}

// ═════════════ tokens → identificadores ═════════════
export function vTokens(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, w = words(S), V = vocab(S), tr = trace(S);
  const cw = port ? 78 : 96, gap = 12, tot = w.length * cw + (w.length - 1) * gap, x0 = b.x + (b.w - tot) / 2;
  const topY = b.y + (port ? 10 : 6);
  txt(S, S.l('texto', 'text'), b.x, topY, { s: 12, c: p.mute, weight: 700, base: 'top' });
  w.forEach((t, i) => {
    const a = S.reveal('tokens-in', 0.2 + i * 0.4, 0.5), x = x0 + i * (cw + gap);
    d.withAlpha(a, () => {
      chip(S, x, topY + 20, t, { tone: 'lat', w: cw, h: 34, s: 16 });
      arrowP(S, x + cw / 2, topY + 58, x + cw / 2, topY + 82, { tone: 'ink', p: S.reveal('tokens-in', 1.2 + i * 0.3, 0.5) });
      d.withAlpha(S.reveal('tokens-in', 1.6 + i * 0.3, 0.5), () => txt(S, String(tr.ids[i]), x + cw / 2, topY + 100, { s: 26, weight: 800, mono: true, align: 'center', c: tone(S, 'lat').ink }));
    });
  });
  d.withAlpha(S.reveal('tokens-in', 2.6, 0.5), () => txt(S, S.l('identificador (id)', 'ID'), b.x + b.w / 2, topY + 124, { s: 12, c: p.mute, weight: 700, align: 'center', base: 'top' }));
  // el vocabulario completo con sus ids
  const vy = topY + 160, a = S.reveal('tokens-in', 3.2, 0.6);
  d.withAlpha(a, () => {
    txt(S, S.l('vocabulario: doce palabras', 'vocabulary: twelve words'), b.x, vy, { s: 12, c: p.mute, weight: 700, base: 'top' });
    const used = tr.ids, itemW = (b.w) / (port ? 4 : 6), rows = port ? 3 : 2, ch = port ? 38 : 40;
    V.forEach((t, i) => {
      const cx = b.x + (i % (port ? 4 : 6)) * itemW, cy = vy + 18 + Math.floor(i / (port ? 4 : 6)) * (ch + 6);
      const on = used.includes(i);
      chip(S, cx, cy, t === '.' ? '«.»' : t, { tone: 'lat', w: itemW - 6, h: 24, s: 13, active: on ? 0.4 : 0, dim: !on });
      txt(S, String(i), cx + (itemW - 6) / 2, cy + 33, { s: 12, mono: true, c: on ? p.ink : p.mute, align: 'center', weight: on ? 800 : 500 });
    });
    void rows;
  });
}

// ═════════════ embedding: la tabla y las tres filas elegidas ═════════════
export function vEmbed(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, tr = trace(S), Wt = TINY[S.lang as Lang], V = vocab(S);
  const Et: number[][] = V.map((_, i) => Wt.E.slice(i * 8, i * 8 + 8));
  const lat = tone(S, 'lat');
  const tch = port ? 15 : Math.min(18, (b.h - 30) / 12), tcw = port ? 18 : 14;
  const ta = S.reveal('embed', 0, 0.6);
  const tabY = b.y + 20, tabX = b.x;
  d.withAlpha(ta, () => txt(S, S.l('tabla de embeddings (12 × 8)', 'embedding table (12 × 8)'), tabX, b.y + 6, { s: 12, c: p.mute, weight: 700 }));
  const sel = tr.ids, hl = S.reveal('embed', 1.0, 0.5);
  const tg = grid(S, tabX, tabY, Et, { cw: tcw, ch: tch, gap: 1, numbers: false, rowLabels: V.map((t) => (t === '.' ? '«.»' : t)), labelSize: 12, tone: 'lat', a: ta, rowHot: hl > 0.5 ? sel : [], dimRows: hl > 0.3 ? V.map((_, i) => i).filter((i) => !sel.includes(i)) : [] });
  // matriz X: las tres filas elegidas, con números
  const xa = S.reveal('embed', 1.8, 0.6), ch = 28;
  const xcw = port ? clamp((b.w - 56) / 8, 28, 36) : clamp((b.w - tg.lw - 8 * tcw - 90 - 56) / 8, 30, 38);
  const xx = port ? b.x : tabX + tg.lw + 8 * tcw + 80, xy = port ? tabY + 12 * tch + 40 : b.y + 20 + (b.h - 20 - 3 * ch - 24) / 2;
  d.withAlpha(xa, () => {
    txt(S, S.l('lo que entra al modelo (3 × 8)', 'what enters the model (3 × 8)'), xx, xy - 14, { s: 12, c: p.mute, weight: 700 });
    grid(S, xx, xy, sel.map((i) => Et[i]), { cw: xcw, ch, rowLabels: words(S), tone: 'lat', cellA: (r) => clamp((S.since('embed') - 1.9 - r * 0.35) / 0.4), vmax: 1.3 });
  });
  // flechas de las filas elegidas a la matriz
  sel.forEach((id, i) => {
    const k = S.at('embed', 1.5 + i * 0.3, 2.1 + i * 0.3, 'out'); if (k <= 0) return;
    const x1 = tabX + tg.lw + 8 * tcw + 4, y1 = tg.y + id * tch + (tch - 1) / 2;
    const x2 = (port ? xx + 40 : xx + 40) , y2 = xy + (port ? 0 : 0) + i * ch + ch / 2;
    if (port) {
      const mx = x1 + 22; d.polyline([[x1, y1], [mx, y1], [mx, xy - 24 + i * 5], [xx + 44 + i * 10, xy - 24 + i * 5]].map(([a, c]) => [a, c] as [number, number]), alpha(lat.c, 0.6), 1.5, { a: k });
    } else {
      const mx = lerp(x1, xx + 36, 0.5);
      d.withAlpha(k, () => { d.polyline([[x1, y1], [mx, y1], [mx, y2], [xx + 34, y2]], alpha(lat.c, 0.7), 1.5); });
    }
    void x2; void y2;
  });
}

// ═════════════ sin posición, el orden se pierde ═════════════
export function vPosWhy(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, tr = trace(S), w = words(S);
  const order2 = [2, 1, 0], vw = 8 * 9, cw = port ? 84 : 120;
  const rowH = port ? 100 : 110;
  const row = (y: number, order: number[], a: number, label: string) => {
    d.withAlpha(a, () => {
      txt(S, label, b.x, y, { s: 12, c: p.mute, weight: 700, base: 'top' });
      const tot = 3 * cw + 2 * 14, x0 = b.x + (b.w - tot) / 2;
      order.forEach((k, i) => {
        const x = x0 + i * (cw + 14);
        chip(S, x, y + 20, w[k], { tone: 'lat', w: cw, h: 30, s: 15 });
        strip(S, x + (cw - vw) / 2, y + 60, tr.emb[k], { cw: 9, ch: 16, gap: 1, numbers: false, tone: 'lat', vmax: 1.3 });
      });
    });
  };
  row(b.y + 4, [0, 1, 2], S.reveal('pos-why', 0, 0.5), S.l('en el texto', 'in the text'));
  row(b.y + 4 + rowH + 28, order2, S.reveal('pos-why', 1.4, 0.6), S.l('barajadas', 'shuffled'));
  const ae = S.reveal('pos-why', 2.8, 0.6);
  d.withAlpha(ae, () => {
    const y = b.y + 4 + rowH + 14;
    txt(S, S.l('mismos vectores · otro orden', 'same vectors · another order'), b.x + b.w / 2, y, { s: 14, weight: 800, align: 'center', c: tone(S, 'err').ink });
  });
  d.withAlpha(S.reveal('pos-why', 3.8, 0.6), () => txt(S, S.l('¿cómo sabría la atención cuál va primero?', 'how would attention know which comes first?'), b.x + b.w / 2, b.y + b.h - 8, { s: 14, weight: 700, align: 'center', base: 'bottom', w: b.w - 10 }));
}

// ═════════════ codificación de posición: senos y cosenos ═════════════
export function vPos(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, port = S.portrait, T = 12;
  const PE = posEnc(T);
  const ch = port ? 21 : Math.min(22, (b.h - 54) / T), cw = port ? 30 : clamp((b.w - 56 - 210) / 8, 28, 36);
  const a = S.reveal('pos', 0, 0.6), hot = S.reveal('pos', 2.2, 0.6);
  const labs = Array.from({ length: T }, (_, i) => String(i));
  const x = b.x + 4, y = b.y + 20;
  d.withAlpha(a, () => txt(S, S.l('posición × dimensión', 'position × dimension'), x, b.y + 6, { s: 12, c: p.mute, weight: 700 }));
  const g = grid(S, x, y, PE, { cw, ch, gap: 1, rowLabels: labs, labelSize: 12, tone: 'dat', numbers: (v, r) => (r < 3 && hot > 0.4 ? compact(S, v, 1) : ''), vmax: 1, a, cellA: (r, c) => clamp((S.since('pos') - 0.3 - c * 0.12 - r * 0.02) / 0.4), dimRows: hot > 0.3 ? labs.map((_, i) => i).filter((i) => i > 2) : [], rowHot: hot > 0.4 ? [0, 1, 2] : [] });
  // lectura de las columnas: de rápida a lenta
  d.withAlpha(S.reveal('pos', 1.2, 0.6), () => {
    txt(S, S.l('rápida', 'fast'), g.x + 2, g.y + g.h + 12, { s: 12, c: p.mute, base: 'top', weight: 700 });
    txt(S, S.l('lenta', 'slow'), g.x + g.w - 2, g.y + g.h + 12, { s: 12, c: p.mute, base: 'top', weight: 700, align: 'right' });
    d.arrow(g.x + 44, g.y + g.h + 20, g.x + g.w - 44, g.y + g.h + 20, p.mute, 1.5, 6);
  });
  // fórmula
  const fa = S.reveal('pos', 1.8, 0.6);
  const fx = port ? x : g.x + g.w + 22, fy = port ? g.y + g.h + 40 : y + 6, fw = port ? b.w : b.x + b.w - fx;
  d.withAlpha(fa, () => {
    txt(S, S.l('para la posición pos y el par de dimensiones i:', 'for position pos and dimension pair i:'), fx, fy, { s: 12, c: p.mute, weight: 700, base: 'top', w: fw });
    const l1 = 'PE(pos, 2i)   = sen(pos / 10000^(2i/d))'.replace('sen', S.l('sen', 'sin')), l2 = 'PE(pos, 2i+1) = cos(pos / 10000^(2i/d))';
    const f = (s: string, yy: number) => txt(S, s, fx, yy, { s: port ? 12 : 13, mono: true, weight: 600, base: 'top', c: tone(S, 'dat').ink });
    f(l1, fy + (port ? 18 : 34)); f(l2, fy + (port ? 36 : 54));
  });
  if (!port) d.withAlpha(hot, () => {
    const by = g.y + 3 * ch;
    d.polyline([[g.x + g.w + 6, g.y], [g.x + g.w + 12, g.y], [g.x + g.w + 12, by - 2], [g.x + g.w + 6, by - 2]], p.ink, 1.5);
    txt(S, '«' + words(S).join(' ') + '»', g.x + g.w + 18, g.y + (3 * ch) / 2, { s: 13, weight: 800, c: p.ink, w: 150, base: 'middle' });
  });
}

// ═════════════ embedding + posición = entrada del bloque ═════════════
export function vPosAdd(S: Frame, L: Lay) {
  const { d, pal: p } = S, b = L.body, tr = trace(S), w = words(S), two = b.w >= 700;
  const ch = two ? 30 : clamp((b.h - 3 * 18 - 2 * 20) / 9, 19, 28), cw = two ? 38 : clamp((b.w - 60) / 8, 28, 36);
  const mw = 8 * cw + 56, mh = 3 * ch + 18;
  const E = tr.emb, P = tr.pos, X = tr.x0, vmax = 1.9;
  const A1 = S.reveal('pos-add', 0, 0.5), A2 = S.reveal('pos-add', 0.7, 0.5), A3 = S.at('pos-add', 1.8, 2.6);
  const pos: [number, number][] = two
    ? [[b.x + 4, b.y + 8], [b.x + 4, b.y + 8 + mh + 40], [b.x + b.w - mw - 4, b.y + 8 + (mh + 40) / 2]]
    : [[b.x + (b.w - mw) / 2, b.y + 2], [b.x + (b.w - mw) / 2, b.y + 2 + mh + 18], [b.x + (b.w - mw) / 2, b.y + 2 + 2 * (mh + 18)]];
  const mat = (i: number, M: number[][], title: string, tn: 'lat' | 'dat', a: number, cellA?: (r: number, c: number) => number) => {
    const [x, y] = pos[i];
    d.withAlpha(a, () => { txt(S, title, x + 56 - 0, y + 7, { s: 12, c: tone(S, tn).ink, weight: 800 }); });
    grid(S, x, y + 14, M, { cw, ch, rowLabels: w, tone: tn, vmax, cellA, a });
  };
  mat(0, E, S.l('embedding de la palabra', 'word embedding'), 'lat', A1);
  mat(1, P, S.l('+ posición (seno y coseno)', '+ position (sine and cosine)'), 'dat', A2);
  mat(2, X, S.l('= entrada del primer bloque', '= input to the first block'), 'lat', A3 > 0 ? 1 : 0, (r) => clamp((S.since('pos-add') - 1.8 - r * 0.5) / 0.5));
  // operadores
  const [ex, ey] = pos[0], [px, py] = pos[1], [xx, xy] = pos[2];
  d.withAlpha(A2, () => txt(S, '+', two ? ex + mw / 2 : px + mw / 2 - 6, two ? ey + mh + 18 : py - 6, { s: 22, weight: 800, align: 'center', c: p.ink }));
  d.withAlpha(A3 > 0 ? 1 : 0, () => {
    if (two) { d.arrow(px + mw + 8, py + mh / 2, xx - 10, xy + mh / 2, p.ink, 2, 8); txt(S, '=', xx - 22, xy + mh / 2 - 14, { s: 20, weight: 800, align: 'center' }); }
    else txt(S, '=', xx + mw / 2 - 6, xy - 6, { s: 22, weight: 800, align: 'center', c: p.ink });
  });
  void px; void ey;
}
void node; void fz; void lerp; void LAST;
