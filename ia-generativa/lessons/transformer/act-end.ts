// Acto 5: solo decodificador (las dos mitades del artículo de 2017 y la que conserva GPT), la cuenta de parámetros por
// parte (el juguete paso a paso; luego GPT-3 pequeño y GPT-3, con el selector de modelo), lo que cambian los modelos
// actuales, el resumen del camino y el puente al preentrenamiento.
import { alpha, clamp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ap, area, arrowP, bigNum, caption, chip, chipW, fitText, fmtInt, fr, hatch, hbar, hold, isShort, measure, mv, node, txt } from './draw';
import { SENT5 } from './data';
import type { Lang } from './model';
import { countParams, MODELS, type ModelId } from './params';

// ═════════ codificador y decodificador ═════════
function maskIcon(S: Frame, x: number, y: number, c: number) {
  const { d, pal: p } = S;
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
    const cx = x + k * c, cy = y + r * c;
    if (k > r) { d.rect(cx, cy, c - 1, c - 1, { fill: p.surface2, stroke: p.line, lw: 1 }); hatch(S, { x: cx, y: cy, w: c - 1, h: c - 1 }); }
    else d.rect(cx, cy, c - 1, c - 1, { fill: alpha(tone(S, 'sig').c, 0.45) });
  }
}

export function drawDecoder(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), port = S.portrait, L = S.lang as Lang;
  const src = L === 'es' ? SENT5.en.slice(0, 4).join(' ') : SENT5.es.slice(0, 4).join(' '), dst = SENT5[L].slice(0, 4).join(' ');
  const gap = port ? 18 : 60, bw = Math.min((A.w - gap) / 2, 300), bh = Math.min(A.h - (short ? 70 : 120), port ? 200 : 230);
  const x1 = A.x + (A.w - 2 * bw - gap) / 2, x2 = x1 + bw + gap, by = A.y + (A.h - bh) / 2 - (short ? 0 : 6);
  const only = S.on('decoder-only') ? mv(S, 'decoder-only', 0.25, 0.45) : 0;
  const aE = ap(S, 'enc-dec', 0.25, 0.38), aD = ap(S, 'enc-dec', 0.55, 0.68);
  const box = (x: number, title: string, sub: string, tn: Tone, a: number, active: number, mask: boolean) => d.withAlpha(a, () => {
    const t = tone(S, tn);
    d.rect(x, by, bw, bh, { fill: alpha(t.c, 0.06 + 0.12 * active), stroke: active > 0.5 ? p.ink : t.c, lw: 1.6 + 1.4 * active, r: 5 });
    fitText(S, title, x + bw / 2, by + 16, bw - 12, { s: 15, weight: 800, align: 'center', c: t.ink });
    caption(S, sub, x + bw / 2, by + 34, bw - 12, { align: 'center' });
    const n = short ? 2 : 3, rh = Math.min(28, (bh - 60 - (mask ? 0 : 0)) / (n + 0.6)), bx = x + 14, bww = bw - 28 - (mask ? 44 : 0);
    for (let i = 0; i < n; i++) node(S, { x: bx, y: by + 48 + i * (rh + 6), w: bww, h: rh }, S.l('bloque', 'block'), { tone: tn, size: 12 });
    if (mask) maskIcon(S, x + bw - 50, by + 50, 9);
  });
  box(x1, S.l('codificador', 'encoder'), S.l('lee, sin máscara', 'reads, no mask'), 'lat', aE * (1 - 0.72 * only), 0, false);
  box(x2, S.l('decodificador', 'decoder'), S.l('escribe, con máscara', 'writes, with a mask'), 'sig', aD, only, true);
  // frases
  const ty = by + bh + (short ? 14 : 22);
  const q = (t: string) => (L === 'es' ? `«${t}»` : `“${t}”`);
  d.withAlpha(aE * (1 - 0.72 * only), () => txt(S, `${S.l('lee', 'reads')}: ${q(src)}`, x1 + bw / 2, ty - 6, { s: 13, weight: 700, align: 'center', c: p.ink2, w: bw, base: 'top' }));
  d.withAlpha(aD, () => txt(S, `${S.l('escribe', 'writes')}: ${q(dst)}`, x2 + bw / 2, ty - 6, { s: 13, weight: 700, align: 'center', c: p.ink2, w: bw, base: 'top' }));
  d.withAlpha(aD * (1 - only), () => arrowP(S, x1 + bw + 4, by + bh / 2, x2 - 4, by + bh / 2, { tone: 'ink', lw: 2, head: 8 }));
  // artículo de 2017 / GPT
  const top = by - (short ? 12 : 20);
  d.withAlpha(ap(S, 'enc-dec', 0.05, 0.15) * (1 - only), () => fitText(S, S.l('el transformer de 2017, para traducir', 'the 2017 transformer, for translation'), A.x + A.w / 2, top, A.w, { s: 13, weight: 800, align: 'center', c: p.ink2 }));
  d.withAlpha(only, () => fitText(S, S.l('GPT y nuestro juguete: solo decodificador', 'GPT and our toy: decoder-only'), A.x + A.w / 2, top, A.w, { s: 14, weight: 800, align: 'center', c: tone(S, 'sig').ink }));
}

// ═════════ parámetros por parte ═════════
export interface PartsVis { model: ModelId; share: number[]; counts: number[]; total: number }
export function partsTarget(m: ModelId): PartsVis {
  const c = countParams(MODELS[m]), counts = [c.emb, c.attn, c.mlp, c.norms];
  return { model: m, counts, total: c.total, share: counts.map((x) => x / c.total) };
}
const partsOf = (S: Frame): PartsVis => (S.st.parts as PartsVis | undefined) ?? partsTarget('toy');

const pctStr = (S: Frame, sh: number) => (sh < 0.001 ? (S.lang === 'es' ? '< 0.1 %' : '< 0.1%') : S.lang === 'es' ? `${S.n(sh * 100, sh < 0.1 ? 1 : 0)} %` : `${S.n(sh * 100, sh < 0.1 ? 1 : 0)}%`);

export function drawParams(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), port = S.portrait, v = partsOf(S), toy = v.model === 'toy';
  const cfg = MODELS[v.model];
  const names = [S.l('embeddings', 'embeddings'), S.l('atención', 'attention'), S.l('red', 'network'), S.l('normalizaciones', 'normalizations')];
  const tones: Tone[] = ['lat', 'sig', 'dat', 'mute'];
  const formulas = [S.l('12 palabras × 8', '12 words × 8'), '2 × (4 × 64 + 32)', '2 × (2 × 256 + 40)', '5 × 16'];
  const segs = ['params-emb', 'params-attn', 'params-mlp', 'params-total'];
  // cabecera: qué modelo
  const name = v.model === 'toy' ? S.l('nuestro juguete', 'our toy') : v.model === 'small' ? S.l('GPT-3 pequeño', 'GPT-3 Small') : 'GPT-3';
  const conf = S.l(`${fmtInt(S, cfg.V)} ${toy ? 'palabras' : 'tokens'} · listas de ${fmtInt(S, cfg.d)} · ${cfg.L} bloques`, `${fmtInt(S, cfg.V)} ${toy ? 'words' : 'tokens'} · lists of ${fmtInt(S, cfg.d)} · ${cfg.L} blocks`);
  const headH = short ? 34 : 50;
  fitText(S, name, A.x, A.y + 10, A.w * 0.5, { s: short ? 15 : 18, weight: 800 });
  caption(S, conf, A.x, A.y + (short ? 26 : 32), A.w, { c: p.ink2 });
  // filas
  const totH = short ? 26 : 40, rowsH = A.h - headH - totH - (toy ? 0 : short ? 0 : 16);
  const rh = Math.min(port ? 66 : short ? 34 : 64, rowsH / 4), y0 = A.y + headH + (rowsH - 4 * rh) * 0.3;
  const labW = port ? A.w * 0.55 : Math.min(A.w * 0.2, 170), fW = port ? 0 : Math.min(A.w * 0.24, 200), cW = port ? A.w * 0.45 : Math.min(A.w * 0.22, 190);
  const bx = port ? A.x : A.x + labW + fW + cW + 10, bW = port ? A.w - 70 : A.x + A.w - bx - 70;
  const showPct = S.on('params-total') ? ap(S, 'params-total', 0.4, 0.55) : 0;
  const embHot = S.is('params-demo') ? ap(S, 'params-demo', 0.1, 0.2) : 0;
  for (let i = 0; i < 4; i++) {
    const a = S.on(segs[i]) ? ap(S, segs[i], 0.1, 0.22) : 0;
    if (a <= 0.01) continue;
    const hot = Math.max(S.is(segs[i]) ? ap(S, segs[i], 0.15, 0.25) : 0, i === 0 ? embHot : 0);
    const y = y0 + i * rh, t = tone(S, tones[i]);
    d.withAlpha(a, () => {
      if (hot > 0.01) d.rect(A.x - 6, y + 2, A.w + 12, rh - 4, { fill: alpha(t.c, 0.08 * hot), stroke: alpha(p.ink, 0.5 * hot), lw: 1.2, r: 4 });
      const ly = port ? y + rh * 0.3 : y + rh / 2;
      fitText(S, names[i], A.x + 4, ly, port ? A.w * 0.5 : labW - 8, { s: 14, weight: 800, c: t.ink });
      if (toy && fW) fitText(S, formulas[i], A.x + labW, ly, fW - 10, { s: 13, mono: true, c: p.ink2, a: toy ? 1 : 0 });
      const cnt = bigNum(S, v.counts[i]);
      fitText(S, cnt, port ? A.x + A.w : A.x + labW + fW + cW - 8, ly, port ? A.w - measure(S, names[i], 14, false, 800) - 20 : cW - 8, { s: 14, mono: true, weight: 800, align: 'right' });
      const barY = port ? y + rh * 0.62 : y + rh / 2, bh = port ? 12 : Math.min(18, rh * 0.36);
      if (port && toy) fitText(S, formulas[i], A.x + 4, barY, A.w * 0.5, { s: 12, mono: true, c: p.ink2 });
      const bxx = port ? A.x + A.w * (toy ? 0.5 : 0) : bx, bww = port ? A.w * (toy ? 0.5 : 1) - 64 : bW;
      hbar(S, bxx, barY - bh / 2, bww, bh, v.share[i], { tone: tones[i], hot: hot });
      d.withAlpha(showPct, () => txt(S, pctStr(S, v.share[i]), A.x + A.w, barY, { s: 13, mono: true, weight: i === 0 && embHot > 0.5 ? 800 : 700, align: 'right', c: i === 0 && embHot > 0.5 ? p.ink : p.ink2 }));
    });
  }
  // total
  const aT = S.on('params-total') ? ap(S, 'params-total', 0.3, 0.45) : 0;
  if (aT > 0.01) d.withAlpha(aT, () => {
    const ty = y0 + 4 * rh + (short ? 10 : 18);
    d.line(A.x, ty - (short ? 8 : 12), A.x + A.w, ty - (short ? 8 : 12), p.lineStrong, 1.3);
    fitText(S, S.l('total', 'total'), A.x + 4, ty, labW, { s: 15, weight: 800 });
    fitText(S, bigNum(S, v.total), port ? A.x + A.w : A.x + labW + fW + cW - 8, ty, port ? A.w * 0.6 : cW + fW, { s: 16, mono: true, weight: 800, align: 'right' });
    if (!toy && !short) caption(S, v.model === 'gpt3' ? S.l('artículo de GPT-3: 175.0 mil millones', 'GPT-3 paper: 175.0 billion') : S.l('artículo de GPT-3: 125 millones', 'GPT-3 paper: 125 million'), port ? A.x + 4 : bx, ty + (port ? 18 : 0), port ? A.w : bW + 60, { c: p.ink2 });
  });
  if (!toy && !short) caption(S, port ? S.l('embeddings: con 2 048 posiciones aprendidas', 'embeddings: with 2,048 learned positions') : S.l('embeddings: incluye las 2 048 posiciones aprendidas · reparto: nuestro cálculo', 'embeddings: include the 2,048 learned positions · split: our calculation'), A.x + A.w / 2, A.y + A.h - 4, A.w, { align: 'center', a: ap(S, 'params-real', 0.3, 0.45) });
  void chip; void chipW; void measure; void clamp; void hold;
}

// ═════════ lo que cambian los modelos actuales ═════════
export function drawToday(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), port = S.portrait, sig = tone(S, 'sig');
  const rows: [string, string, string][] = [
    [S.l('posición', 'position'), S.l('ondas o aprendida', 'waves or learned'), S.l('rotatoria (RoPE)', 'rotary (RoPE)')],
    [S.l('normalización', 'normalization'), S.l('de capa', 'layer norm'), 'RMSNorm'],
    [S.l('activación de la red', 'network activation'), 'ReLU / GELU', 'SwiGLU'],
  ];
  const head = ap(S, 'today', 0.05, 0.15), sk = ap(S, 'today', 0.68, 0.8);
  if (port) {
    // vertical: cada pieza en dos líneas (nombre; antes → ahora)
    const rh = Math.min(70, (A.h - 120) / 3), y0 = A.y + 44;
    d.withAlpha(head, () => { caption(S, S.l('juguete, GPT-2 y GPT-3  →  Llama 2 (2023), por ejemplo', 'toy, GPT-2, GPT-3  →  Llama 2 (2023), for example'), A.x + A.w / 2, A.y + 10, A.w, { align: 'center', c: p.ink2 }); });
    rows.forEach(([k, a1, a2], i) => {
      const a = ap(S, 'today', 0.15 + i * 0.12, 0.25 + i * 0.12), y = y0 + i * rh;
      d.withAlpha(a, () => {
        d.line(A.x, y - 8, A.x + A.w, y - 8, p.line, 1);
        fitText(S, k, A.x, y + 8, A.w, { s: 14, weight: 800 });
        const w1 = measure(S, a1, 13, false, 600);
        fitText(S, a1, A.x, y + 32, A.w * 0.48, { s: 13, c: p.ink2 });
        txt(S, '→', A.x + Math.min(w1, A.w * 0.48) + 14, y + 32, { s: 13, c: p.mute, align: 'center' });
        fitText(S, a2, A.x + Math.min(w1, A.w * 0.48) + 28, y + 32, A.w * 0.5, { s: 13, weight: 800, c: sig.ink });
      });
    });
    d.withAlpha(sk, () => {
      const y = y0 + 3 * rh;
      d.line(A.x, y - 8, A.x + A.w, y - 8, p.lineStrong, 1.3);
      txt(S, S.l('El esqueleto, igual: bloques de atención con máscara y red, con sumas y normalización.', 'The skeleton, the same: blocks of masked attention and a network, with sums and normalization.'), A.x, y + 6, { s: 14, weight: 800, base: 'top', w: A.w });
    });
    return;
  }
  const c0 = A.w * 0.3, c1 = (A.w - c0) / 2, rh = Math.min(short ? 36 : 64, (A.h - 90) / 4), y0 = A.y + (short ? 30 : 50);
  caption(S, S.l('juguete, GPT-2 y GPT-3', 'toy, GPT-2, and GPT-3'), A.x + c0 + c1 / 2, y0 - 12, c1, { align: 'center', c: p.ink2, a: head });
  caption(S, S.l('Llama 2 (2023), por ejemplo', 'Llama 2 (2023), for example'), A.x + c0 + c1 * 1.5, y0 - 12, c1, { align: 'center', c: p.ink2, a: head });
  rows.forEach(([k, a1, a2], i) => {
    const a = ap(S, 'today', 0.15 + i * 0.12, 0.25 + i * 0.12), y = y0 + i * rh;
    d.withAlpha(a, () => {
      d.line(A.x, y, A.x + A.w, y, p.line, 1);
      fitText(S, k, A.x, y + rh / 2, c0 - 8, { s: 14, weight: 800 });
      fitText(S, a1, A.x + c0 + c1 / 2, y + rh / 2, c1 - 8, { s: 14, align: 'center', c: p.ink2 });
      fitText(S, a2, A.x + c0 + c1 * 1.5, y + rh / 2, c1 - 8, { s: 14, weight: 700, align: 'center', c: sig.ink });
    });
  });
  const ys = y0 + 3 * rh;
  d.withAlpha(sk, () => {
    d.line(A.x, ys, A.x + A.w, ys, p.lineStrong, 1.3);
    fitText(S, S.l('el esqueleto', 'the skeleton'), A.x, ys + rh / 2, c0 - 8, { s: 14, weight: 800 });
    txt(S, S.l('igual: bloques de atención con máscara y red, con sumas y normalización', 'the same: blocks of masked attention and a network, with sums and normalization'), A.x + c0, ys + rh / 2 - (short ? 0 : 8), { s: 14, weight: 800, c: p.ink, w: A.w - c0, base: 'middle' });
  });
}

// ═════════ resumen ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), port = S.portrait;
  const items: [string, number | null, Tone][] = [
    [S.l('tokens', 'tokens'), 20, 'lat'], [S.l('números', 'numbers'), 20, 'lat'], [S.l('embeddings + posición', 'embeddings + position'), 14, 'lat'],
    [S.l('bloques: atención con máscara + red', 'blocks: masked attention + network'), 21, 'sig'], [S.l('sumas y normalización', 'sums and normalization'), 22, 'mute'],
    [S.l('puntajes', 'scores'), null, 'dat'], [S.l('softmax', 'softmax'), 19, 'dat'], [S.l('siguiente palabra', 'next word'), 19, 'dat'],
  ];
  const s = short ? 13 : port ? 15 : 16, h = short ? 26 : port ? 34 : 38, gapX = short ? 22 : 30, gapY = short ? 26 : 40;
  // reparto en líneas
  const ws = items.map(([t]) => chipW(S, t, s) + 6);
  const lines: number[][] = []; let cur: number[] = [], w = 0;
  ws.forEach((cw, i) => { if (cur.length && w + gapX + cw > A.w) { lines.push(cur); cur = []; w = 0; } w += (cur.length ? gapX : 0) + cw; cur.push(i); });
  if (cur.length) lines.push(cur);
  const totH = lines.length * (h + gapY) - gapY + 16, y0 = A.y + (A.h - totH) / 2;
  let prev: [number, number] | null = null;
  lines.forEach((ln, li) => {
    const lw = ln.reduce((a, i) => a + ws[i], 0) + gapX * (ln.length - 1);
    let x = A.x + (A.w - lw) / 2; const y = y0 + li * (h + gapY);
    ln.forEach((i) => {
      const a = ap(S, 'recap', 0.04 + i * 0.1, 0.12 + i * 0.1);
      const [t, les, tn] = items[i];
      if (a > 0.01) {
        if (prev) {
          const [px, py] = prev;
          if (Math.abs(py - (y + h / 2)) < 1) arrowP(S, px + 3, py, x - 3, py, { a, head: 6 });
          else d.withAlpha(a * 0.8, () => d.polyline([[px, py], [px + 8, py], [px + 8, py + h / 2 + gapY / 2], [x - 10, py + h / 2 + gapY / 2], [x - 10, y + h / 2], [x - 3, y + h / 2]], p.mute, 1.4, { dash: [4, 3] }));
        }
        chip(S, x, y, t, { s, h, w: ws[i] - 6, tone: tn, a });
        if (les && !short) caption(S, S.l(`lección ${les}`, `lesson ${les}`), x + (ws[i] - 6) / 2, y + h + 10, ws[i], { align: 'center', a });
        else if (les && short && port) caption(S, String(les), x + (ws[i] - 6) / 2, y + h + 9, ws[i], { align: 'center', a });
      }
      prev = [x + ws[i] - 6, y + h / 2];
      x += ws[i] + gapX;
    });
  });
}

// ═════════ puente ═════════
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, A = area(S), cx = A.x + A.w / 2, cy = A.y + A.h / 2, sc = Math.max(4, Math.round((isShort(S) ? 4 : 6) * S.u));
  neu(S, cx - 12 * sc, cy - 20 * sc, { scale: sc, mood: 'happy', a: ap(S, 'bridge', 0.05, 0.2) });
  d.withAlpha(ap(S, 'bridge', 0.55, 0.7), () => {
    txt(S, S.l('Siguiente', 'Next'), cx, cy + (isShort(S) ? 26 : 40), { s: 13, weight: 700, c: p.mute, align: 'center' });
    fitText(S, S.l('Preentrenamiento', 'Pretraining'), cx, cy + (isShort(S) ? 50 : 72), A.w, { s: 24, weight: 800, align: 'center' });
  });
  void fr; void clamp;
}
