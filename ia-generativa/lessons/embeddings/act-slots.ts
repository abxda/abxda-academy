// Actos 1 y 2: el problema (palabras sin parecido), la idea (vectores densos aprendidos) y el objetivo de entrenamiento (adivinar por el contexto).
import { alpha, box, clamp, link, tokenRow, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DOCS, QUERIES } from './search';
import { cos, idOf, V } from './vectors';
import { actAlpha, area, big, chip, fs, isTiny, lg, num, strip, word } from './ui';

/** Las ocho palabras del ejemplo de one-hot (y de la tabla). */
export const SLOT_KEYS = ['cat', 'dog', 'bread', 'king', 'queen', 'car', 'paris', 'rain'];
const SLOT = SLOT_KEYS.map(idOf);

// ═════════════ hook: una pregunta y un artículo sin palabras en común ═════════════
export function drawHook(S: Frame) {
  const a = actAlpha(S, 'hook', 'onehot'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), L = lg(S);
  const doc = DOCS.find((x) => x.id === 'refund')!, q = QUERIES[4];
  const words = (t: string) => t.replace(/[.,;:!?¿¡]/g, '').split(/\s+/).filter(Boolean);
  const gap = (S.portrait ? 74 : 150) * u, tiny = isTiny(S);
  const ch = S.portrait ? Math.min((A.h - gap) / 2 - 4 * u, 150 * u) : Math.min(A.h * 0.72, 150 * u), cw = S.portrait ? A.w : (A.w - gap) / 2;
  const top = S.portrait ? A.y + (A.h - (2 * ch + gap)) / 2 : A.y + (A.h - ch) / 2;
  const R1: Rect = { x: A.x, y: top, w: cw, h: ch };
  const R2: Rect = S.portrait ? { x: A.x, y: top + ch + gap, w: cw, h: ch } : { x: A.x + cw + gap, y: top, w: cw, h: ch };
  const sz = fs(S, tiny ? 12 : 13), rh = (tiny ? 24 : 28) * u;
  d.withAlpha(a, () => {
    const card = (r: Rect, title: string, text: string, tn: 'sig' | 'dat', rev: number) => {
      d.withAlpha(rev, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: tone(S, tn).c, lw: 1.5, r: 4 });
        d.text(title, r.x + 10 * u, r.y + 8 * u, { size: fs(S, 12), weight: 800, color: tone(S, tn).ink, base: 'top' });
        const ws = words(text), show = ws.length * clamp((rev - 0.3) / 0.7);
        tokenRow(S, r.x + 10 * u, r.y + 8 * u + fs(S, 12) * u + 10 * u, r.w - 20 * u, ws, { tone: tn, h: rh / u, size: sz, gap: 5, show });
      });
    };
    card(R1, S.l('Pregunta de un cliente', 'A customer’s question'), q[L], 'sig', S.reveal('hook', 0.3, 1.4));
    card(R2, S.l('Artículo de ayuda: ', 'Help article: ') + doc.title[L], doc[L], 'dat', S.reveal('hook', 2.6, 1.6));
    // enlace roto entre ambas
    const aL = S.reveal('hook', 5.4, 0.7);
    d.withAlpha(aL, () => {
      const cx = S.portrait ? R1.x + R1.w / 2 : R1.x + R1.w + gap / 2, cy = S.portrait ? R1.y + R1.h + gap / 2 : R1.y + R1.h / 2, e = tone(S, 'err');
      if (S.portrait) d.line(cx, R1.y + R1.h, cx, R2.y, e.c, 2, [5, 4]); else d.line(R1.x + R1.w, cy, R2.x, cy, e.c, 2, [5, 4]);
      const w = Math.min(gap - 8 * u, 150 * u);
      if (S.portrait) {
        d.rect(cx - 96 * u, cy - 14 * u, 192 * u, 28 * u, { fill: p.stage, stroke: e.c, lw: 1.5, r: 4 });
        d.text(S.l('0 palabras en común', '0 words in common'), cx, cy, { size: fs(S, 13), weight: 800, color: e.ink, align: 'center', base: 'middle' });
      } else {
        d.rect(cx - w / 2, cy - 36 * u, w, 72 * u, { fill: p.stage });
        d.text('0', cx, cy - 12 * u, { size: 34, weight: 800, font: 'mono', color: e.ink, align: 'center', base: 'middle' });
        d.text(S.l('palabras en común', 'words in common'), cx, cy + 20 * u, { size: fs(S, 12), weight: 700, color: e.ink, align: 'center', base: 'middle', w });
      }
    });
    const aQ = S.reveal('hook', 8.2, 0.8);
    if (aQ > 0 && !tiny) chip(S, S.l('¿mismo significado?', 'same meaning?'), A.x + A.w / 2, S.portrait ? A.y + A.h - 4 * u : R1.y + R1.h + 24 * u, { tone: 'lat', a: aQ, size: fs(S, 13) });
  });
}

// ═════════════ one-hot: una casilla por palabra, y por qué no basta ═════════════
interface Panel { x: number; y: number; lw: number; cs: number; hh: number }
function slotPanels(S: Frame): { one: Panel; sim: Panel } {
  const A = area(S), u = S.u, gap = 26 * u, lw = (S.portrait ? 58 : 70) * u, hh = 44 * u;
  const pw = S.portrait ? A.w : (A.w - gap) / 2;
  const cs = Math.min((pw - lw) / 8, (A.h - hh - 8 * u) / 8, 46 * u);
  const w = lw + cs * 8, h = hh + cs * 8, y = A.y + Math.max(0, (A.h - h - (S.portrait ? 0 : 16 * u)) / 2);
  if (S.portrait) { const x = A.x + (A.w - w) / 2; return { one: { x, y, lw, cs, hh }, sim: { x, y, lw, cs, hh } }; }
  const total = w * 2 + gap, x0 = A.x + (A.w - total) / 2;
  return { one: { x: x0, y, lw, cs, hh }, sim: { x: x0 + w + gap, y, lw, cs, hh } };
}
function slotGrid(S: Frame, P: Panel, title: string, M: number[][], rev: number, o: { hot?: number; labels?: boolean; cells?: [number, number][] } = {}) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat');
  d.text(title, P.x, P.y + 4 * u, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top' });
  for (let c = 0; c < 8; c++) d.text(String(c + 1), P.x + P.lw + c * P.cs + P.cs / 2, P.y + P.hh - 6 * u, { size: fs(S, 11), weight: 600, color: p.mute, align: 'center', base: 'bottom', font: 'mono' });
  for (let r = 0; r < 8; r++) {
    const ra = clamp(rev * 9 - r);
    if (ra <= 0) continue;
    d.withAlpha(ra, () => {
      const y = P.y + P.hh + r * P.cs;
      d.text(word(S, SLOT[r]), P.x + P.lw - 8 * u, y + P.cs / 2, { size: fs(S, 13), weight: o.hot === r ? 800 : 600, color: o.hot === r ? p.ink : p.ink2, align: 'right', base: 'middle' });
      for (let c = 0; c < 8; c++) {
        const v = M[r][c], x = P.x + P.lw + c * P.cs;
        d.rect(x, y, P.cs - 2, P.cs - 2, { fill: v ? alpha(lt.c, 0.18 + 0.62 * v) : p.surface2, stroke: v ? lt.c : undefined, lw: 1.5 });
        if (P.cs >= 22) d.text(String(v), x + (P.cs - 2) / 2, y + (P.cs - 2) / 2, { size: fs(S, 12), weight: v ? 800 : 500, font: 'mono', color: v ? p.ink : p.mute, align: 'center', base: 'middle' });
      }
    });
  }
  for (const [r, c] of o.cells ?? []) {
    const e = tone(S, 'err'), x = P.x + P.lw + c * P.cs, y = P.y + P.hh + r * P.cs;
    d.rect(x - 2, y - 2, P.cs + 2, P.cs + 2, { stroke: e.c, lw: 2.5 });
  }
}
const ID8: number[][] = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (r === c ? 1 : 0)));

export function drawOneHot(S: Frame) {
  const a = actAlpha(S, 'onehot', 'dense'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, P = slotPanels(S);
  const flaw = S.on('onehot-flaw'), tiny = isTiny(S);
  d.withAlpha(a, () => {
    // panel izquierdo: la matriz one-hot (en vertical se cede el sitio a la de parecidos)
    const kOne = S.portrait && flaw ? 1 - S.at('onehot-flaw', 0, 0.5, 'out') : 1;
    d.withAlpha(kOne, () => {
      slotGrid(S, P.one, S.l('one-hot: una casilla por palabra', 'one-hot: one slot per word'), ID8, S.reveal('onehot', 0.2, 2.6), { hot: S.on('onehot') && S.since('onehot') > 3 ? 0 : -1 });
      const aV = S.reveal('onehot', 3.4, 0.7);
      if (aV > 0 && !flaw && !tiny) {
        const y = P.one.y + P.one.hh + P.one.cs * 8 + 10 * u;
        d.withAlpha(aV, () => d.text(`${word(S, SLOT[0])} = [1, 0, 0, 0, 0, 0, 0, 0]`, P.one.x + P.one.lw, y, { size: fs(S, 13), weight: 700, font: 'mono', color: tone(S, 'lat').ink, base: 'top' }));
      }
    });
    // panel derecho: el parecido entre palabras distintas es cero
    if (flaw) {
      const rev = S.reveal('onehot-flaw', 0.2, 1.2), pn = S.portrait ? P.one : P.sim;
      d.withAlpha(rev, () => {
        const cells: [number, number][] = [[0, 1], [0, 2]];
        slotGrid(S, pn, S.l('parecido entre palabras', 'similarity between words'), ID8, 1, { hot: 0, cells: S.at('onehot-flaw', 2.2, 2.8) > 0.5 ? cells : [] });
        const aC = S.reveal('onehot-flaw', 2.4, 0.7);
        if (aC > 0 && !tiny) {
          const e = tone(S, 'err'), x = pn.x + pn.lw, y = pn.y + pn.hh + pn.cs * 8 + 8 * u;
          d.withAlpha(aC, () => {
            d.text(S.l(`«${word(S, SLOT[0])}» y «${word(S, SLOT[1])}»: 0`, `“${word(S, SLOT[0])}” and “${word(S, SLOT[1])}”: 0`), x, y, { size: fs(S, 13), weight: 800, color: e.ink, base: 'top' });
            d.text(S.l(`«${word(S, SLOT[0])}» y «${word(S, SLOT[2])}»: 0`, `“${word(S, SLOT[0])}” and “${word(S, SLOT[2])}”: 0`), x + (S.portrait ? 0 : 0), y + fs(S, 13) * u * 1.35, { size: fs(S, 13), weight: 800, color: e.ink, base: 'top' });
          });
        }
      });
    }
  });
  void p;
}

// ═════════════ vectores densos: la tabla de embeddings ═════════════
export function drawDense(S: Frame) {
  const a = actAlpha(S, 'dense', 'context'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S), lt = tone(S, 'lat'), wt = tone(S, 'w');
  const C = S.portrait ? 3 : tiny ? 4 : 6, lw = (S.portrait ? 62 : 78) * u, cw = (S.portrait ? 48 : 54) * u, dots = 26 * u;
  const tw = lw + C * cw + dots, hh = 46 * u;
  const rh = Math.min(34 * u, (A.h - hh - (S.portrait ? 96 * u : 8 * u)) / 8);
  const tx = S.portrait ? A.x + (A.w - tw) / 2 : A.x + 4 * u, ty = A.y + (S.portrait ? 0 : Math.max(0, (A.h - hh - rh * 8) / 2));
  const onTable = S.on('table');
  d.withAlpha(a, () => {
    d.text(onTable ? S.l('tabla de embeddings', 'embedding table') : S.l('un vector denso por palabra', 'one dense vector per word'), tx, ty + 2 * u, { size: fs(S, 13), weight: 800, color: onTable ? wt.ink : p.ink, base: 'top' });
    d.text(S.l('100 números reales →', '100 real numbers →'), tx + lw, ty + hh - 6 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'bottom' });
    const rev = S.reveal('dense', 0.2, 2.6);
    let mx = 0; for (let r = 0; r < 8; r++) for (let c = 0; c < C; c++) mx = Math.max(mx, Math.abs(V[SLOT[r] * 100 + c]));
    for (let r = 0; r < 8; r++) {
      const ra = clamp(rev * 9 - r); if (ra <= 0) continue;
      d.withAlpha(ra, () => {
        const y = ty + hh + r * rh;
        d.text(word(S, SLOT[r]), tx + lw - 8 * u, y + rh / 2, { size: fs(S, 13), weight: 600, color: p.ink2, align: 'right', base: 'middle' });
        for (let c = 0; c < C; c++) {
          const v = V[SLOT[r] * 100 + c], x = tx + lw + c * cw;
          d.rect(x, y, cw - 2, rh - 2, { fill: alpha(lt.c, 0.06 + 0.5 * Math.abs(v) / mx) });
          d.text(num(S, v, 2), x + (cw - 2) / 2, y + (rh - 2) / 2, { size: fs(S, 12), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
        }
        d.text('…', tx + lw + C * cw + dots / 2, y + rh / 2, { size: fs(S, 14), weight: 700, color: p.mute, align: 'center', base: 'middle' });
      });
    }
    // la fila de «perro» como embedding
    const aT = S.reveal('table', 0.3, 0.8);
    if (aT > 0) {
      const y = ty + hh + 1 * rh;
      d.withAlpha(aT, () => {
        d.rect(tx + lw - 3, y - 2, C * cw + dots + 4, rh + 2, { stroke: wt.c, lw: 2.5 });
        const e = word(S, SLOT[1]);
        if (!S.portrait) chip(S, S.l(`fila de «${e}» = su embedding`, `row of “${e}” = its embedding`), tx + tw + 14 * u, y + rh / 2, { tone: 'w', align: 'left', size: fs(S, 12) });
      });
    }
    // lado derecho (o inferior): comparación one-hot frente a denso, y luego el tamaño de la tabla real
    const R: Rect = S.portrait ? { x: A.x, y: ty + hh + rh * 8 + 12 * u, w: A.w, h: A.y + A.h - (ty + hh + rh * 8 + 12 * u) } : { x: tx + tw + 20 * u, y: A.y, w: A.x + A.w - (tx + tw + 20 * u), h: A.h };
    const kCmp = 1 - S.at('table', 0, 0.5);
    if (kCmp > 0.01 && S.at('dense', 3.4, 4.2) > 0) d.withAlpha(kCmp * S.reveal('dense', 3.4, 0.8), () => {
      const sh = S.portrait ? Math.min(30 * u, (R.h - 40 * u) / 2) : 46 * u;
      const one = new Float32Array(100); one[37] = 1;
      const row = (y: number, title: string, vals: ArrayLike<number>, tn: 'ink' | 'lat') => {
        d.text(title, R.x, y, { size: fs(S, 12), weight: 700, color: p.ink2, base: 'top' });
        strip(S, { x: R.x, y: y + fs(S, 12) * u * 1.25, w: Math.min(R.w, 300 * u), h: sh }, vals, { tone: tn === 'ink' ? 'mute' : 'lat', max: tn === 'ink' ? 1 : 0.4 });
      };
      row(R.y + (S.portrait ? 0 : R.h * 0.22), S.l('one-hot: 100 de 50 000 casillas', 'one-hot: 100 of 50,000 slots'), one, 'ink');
      row(R.y + (S.portrait ? sh + 28 * u : R.h * 0.22 + sh + 44 * u), S.l('embedding: 100 de 100 números', 'embedding: 100 of 100 numbers'), Array.from({ length: 100 }, (_, k) => V[SLOT[1] * 100 + k]), 'lat');
    });
    const aS = S.reveal('table', 1.4, 0.8);
    if (aS > 0) d.withAlpha(aS, () => {
      const bx = S.portrait ? R.x : R.x, by = S.portrait ? R.y : R.y + R.h * 0.42, w = S.portrait ? R.w : Math.min(R.w, 300 * u);
      d.text('400 000 × 100', bx, by, { size: S.portrait ? 18 : 24, weight: 800, font: 'mono', color: wt.ink, base: 'top' });
      d.text(S.l(`= ${big(S, 40000000)} números aprendidos (GloVe)`, `= ${big(S, 40000000)} learned numbers (GloVe)`), bx, by + (S.portrait ? 24 : 32) * u, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top', w });
      if (!S.portrait) d.text(S.l('Aquí: ochocientas ochenta filas.', 'Here: eight hundred eighty rows.'), bx, by + 84 * u, { size: fs(S, 12), weight: 600, color: p.mute, base: 'top', w });
    });
  });
}

// ═════════════ objetivo: adivinar una palabra por su contexto ═════════════
const CTX = [
  { es: 'mi … duerme en casa', en: 'my … sleeps at home', ok: [1, 1, 0] },
  { es: 'el … come del plato', en: 'the … eats from the plate', ok: [1, 1, 0] },
  { es: 'el … ladra en el patio', en: 'the … barks in the yard', ok: [1, 0, 0] },
  { es: 'el … ronronea en el sofá', en: 'the … purrs on the sofa', ok: [0, 1, 0] },
  { es: 'un … con mantequilla', en: 'a … with butter', ok: [0, 0, 1] },
];
export function drawContext(S: Frame) {
  const a = actAlpha(S, 'context', 'glove'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S), L = lg(S);
  const W3 = [idOf('dog'), idOf('cat'), idOf('bread')];
  const stage2 = S.at('learned', 0, 0.6, 'out'), stage1 = 1 - stage2;
  d.withAlpha(a, () => {
    // etapa 1: una frase con hueco y tres candidatas
    if (stage1 > 0.01) d.withAlpha(stage1, () => {
      const cx = A.x + A.w / 2, y0 = A.y + A.h * (S.portrait ? 0.16 : 0.2), size = fs(S, S.portrait ? 20 : 26);
      const [pre, post] = CTX[0][L].split('…').map((s) => s.trim());
      const wPre = d.measure(pre + ' ', { size, weight: 700 }), wPost = d.measure(' ' + post, { size, weight: 700 }), bw = 92 * u, tot = wPre + bw + wPost, x0 = cx - tot / 2;
      d.withAlpha(S.reveal('context', 0.3, 0.6), () => {
        d.text(pre + ' ', x0, y0, { size, weight: 700, color: p.ink, base: 'middle' });
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin(S.clock * 2.4));
        d.rect(x0 + wPre, y0 - 17 * u, bw, 34 * u, { stroke: tone(S, 'lat').c, lw: 2, dash: [5, 4], r: 3, a: pulse });
        d.text('?', x0 + wPre + bw / 2, y0, { size: 22, weight: 800, color: tone(S, 'lat').ink, align: 'center', base: 'middle' });
        d.text(' ' + post, x0 + wPre + bw, y0, { size, weight: 700, color: p.ink, base: 'middle' });
      });
      const aW = S.reveal('context', 4.2, 0.9);
      if (aW > 0) d.withAlpha(aW, () => {
        const ys = y0 + 62 * u, gap = 18 * u, items = W3.map((i, k) => ({ i, ok: CTX[0].ok[k] === 1 }));
        const ws = items.map((it) => d.measure(word(S, it.i), { size: fs(S, 16), weight: 700 }) + 34 * u), tw = ws.reduce((s, x) => s + x, 0) + gap * 2;
        let x = cx - tw / 2;
        items.forEach((it, k) => {
          const tn = it.ok ? 'dat' : 'err', t = tone(S, tn), w = ws[k];
          d.rect(x, ys, w, 38 * u, { fill: t.soft, stroke: t.c, lw: 1.5, r: 4 });
          d.text(word(S, it.i), x + w / 2 - 6 * u, ys + 19 * u, { size: fs(S, 16), weight: 700, color: t.ink, align: 'center', base: 'middle' });
          if (it.ok) { d.polyline([[x + w - 20 * u, ys + 19 * u], [x + w - 15 * u, ys + 25 * u], [x + w - 7 * u, ys + 12 * u]], t.c, 2.4); }
          else { d.line(x + w - 20 * u, ys + 12 * u, x + w - 8 * u, ys + 26 * u, t.c, 2.4); d.line(x + w - 20 * u, ys + 26 * u, x + w - 8 * u, ys + 12 * u, t.c, 2.4); d.line(x + 5, ys + 19 * u, x + w - 26 * u, ys + 19 * u, t.c, 2); }
          x += w + gap;
        });
        d.text(S.l('ilustrativo', 'illustrative'), cx, ys + 56 * u, { size: fs(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top' });
      });
    });
    // etapa 2: contextos compartidos → vectores parecidos
    if (stage2 > 0.01) d.withAlpha(stage2, () => {
      const rows = S.portrait ? 5 : 5, lw = Math.min(A.w * (S.portrait ? 0.58 : 0.34), 240 * u), cw = Math.min((S.portrait ? A.w - lw : A.w * 0.34 - lw * 0) / 3, 62 * u);
      const gw = lw + cw * 3, x0 = S.portrait ? A.x + (A.w - gw) / 2 : A.x + 8 * u, rh = Math.min(36 * u, (A.h - 90 * u) / (rows + 1)), y0 = A.y + (tiny ? 2 : 8) * u;
      d.text(S.l('¿qué palabra cabe? (ilustrativo)', 'which word fits? (illustrative)'), x0, y0, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
      const hy = y0 + fs(S, 12) * u + 10 * u;
      W3.forEach((i, k) => d.text(word(S, i), x0 + lw + k * cw + cw / 2, hy + 10 * u, { size: fs(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle' }));
      CTX.forEach((c, r) => {
        const y = hy + 24 * u + r * rh, ra = S.reveal('learned', 0.4 + r * 0.35, 0.5);
        d.withAlpha(ra, () => {
          d.text('«' + c[L] + '»', x0 + lw - 8 * u, y + rh / 2, { size: fs(S, 12), weight: 600, color: p.ink2, align: 'right', base: 'middle' });
          c.ok.forEach((ok, k) => { if (ok) { const t = tone(S, 'dat'), cx = x0 + lw + k * cw + cw / 2, cy = y + rh / 2; d.rect(cx - 13 * u, cy - 11 * u, 26 * u, 22 * u, { fill: t.soft, stroke: t.c, lw: 1.5, r: 3 }); d.polyline([[cx - 6 * u, cy], [cx - 2 * u, cy + 5 * u], [cx + 6 * u, cy - 5 * u]], t.c, 2.2); } else d.circle(x0 + lw + k * cw + cw / 2, y + rh / 2, 2.2 * u, { fill: p.line }); });
        });
      });
      // consecuencia: vectores parecidos (cifras reales)
      const aR = S.reveal('learned', 2.6, 0.9);
      if (aR > 0) d.withAlpha(aR, () => {
        const R: Rect = S.portrait ? { x: A.x, y: hy + 24 * u + 5 * rh + 14 * u, w: A.w, h: A.y + A.h - (hy + 24 * u + 5 * rh + 14 * u) } : { x: x0 + gw + 28 * u, y: A.y + A.h * 0.18, w: A.x + A.w - (x0 + gw + 28 * u), h: A.h * 0.6 };
        const lt = tone(S, 'lat'), pairs: [number, number][] = [[W3[0], W3[1]], [W3[0], W3[2]]];
        pairs.forEach(([i, j], k) => {
          const y = R.y + k * (S.portrait ? 40 * u : 70 * u), c = cos(i, j);
          d.text(S.l(`«${word(S, i)}» y «${word(S, j)}»`, `“${word(S, i)}” and “${word(S, j)}”`), R.x, y, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top' });
          const by = y + (S.portrait ? fs(S, 13) * u * 1.3 : 22 * u);
          const bw = Math.min(R.w - 70 * u, 220 * u);
          d.rect(R.x, by, bw, 12 * u, { fill: p.surface2 }); d.rect(R.x, by, bw * c, 12 * u, { fill: k === 0 ? lt.c : alpha(lt.c, 0.45) });
          d.text(num(S, c, 2), R.x + bw + 8 * u, by + 6 * u, { size: fs(S, 14), weight: 800, font: 'mono', color: lt.ink, base: 'middle' });
        });
        if (!S.portrait) d.text(S.l('mismo contexto, vectores parecidos', 'same context, similar vectors'), R.x, R.y + 148 * u, { size: fs(S, 13), weight: 800, color: lt.ink, base: 'top', w: R.w });
      });
    });
  });
}

// ═════════════ GloVe: de dónde salen los números, y las barras de tres palabras ═════════════
export function drawGlove(S: Frame) {
  const a = actAlpha(S, 'glove', 'space'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S), wt = tone(S, 'w');
  const three = [idOf('dog'), idOf('cat'), idOf('bread')];
  d.withAlpha(a, () => {
    // tubería: texto → entrenamiento → tabla
    const bh = (S.portrait ? 66 : tiny ? 46 : 62) * u, gap = (S.portrait ? 12 : 30) * u, bw = (A.w - gap * 2) / 3;
    const subs = [S.l('palabras de texto en inglés', 'words of English text'), S.l('números por palabra', 'numbers per word'), S.l('palabras en la tabla', 'words in the table')];
    const bigs = ['6 000 000 000', '100', '400 000'];
    const bx = [0, 1, 2].map((k) => ({ x: A.x + k * (bw + gap), y: A.y, w: bw, h: bh }));
    bx.forEach((r, k) => {
      const ak = S.reveal('glove', 0.3 + k * 0.9, 0.6);
      d.withAlpha(ak, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tone(S, k === 1 ? 'w' : 'dat').c, 0.1), stroke: tone(S, k === 1 ? 'w' : 'dat').c, lw: 1.5, r: 3 });
        const bsz = S.portrait ? 12 : 20; let bs = bsz; while (bs > 8 && d.measure(bigs[k], { size: bs, weight: 800, font: 'mono' }) > r.w - 8 * u) bs -= 1;
        d.text(bigs[k], r.x + r.w / 2, r.y + r.h * 0.3, { size: bs, weight: 800, font: 'mono', color: tone(S, k === 1 ? 'w' : 'dat').ink, align: 'center', base: 'middle' });
        d.text(subs[k], r.x + r.w / 2, r.y + r.h * 0.56, { size: fs(S, 11), weight: 600, color: p.ink2, align: 'center', base: 'top', w: r.w - 6 * u, lh: 1.05 });
      });
      if (k < 2) { const al = S.reveal('glove', 0.9 + k * 0.9, 0.5); d.withAlpha(al, () => d.arrow(r.x + r.w + 3, r.y + r.h / 2, r.x + r.w + gap - 3, r.y + r.h / 2, p.ink2, 2, 7)); }
    });
    d.withAlpha(S.reveal('glove', 2.6, 0.6), () => d.text(S.l('GloVe 6B · Pennington, Socher y Manning, 2014 · licencia de dominio público', 'GloVe 6B · Pennington, Socher & Manning, 2014 · public-domain license'), A.x, A.y + bh + 6 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: A.w }));
    // barras reales
    const y0 = A.y + bh + (S.portrait ? 54 : 36) * u, sh = Math.min((tiny ? 40 : 84) * u, (A.y + A.h - y0 - 22 * u) / 3 - 6 * u), lw = (S.portrait ? 54 : 70) * u;
    three.forEach((i, k) => {
      const ra = S.reveal('glove', 3.6 + k * 0.5, 0.5), y = y0 + k * (sh + 8 * u);
      d.withAlpha(ra, () => {
        d.text(word(S, i), A.x + lw - 8 * u, y + sh / 2, { size: fs(S, 14), weight: 800, color: p.ink, align: 'right', base: 'middle' });
        d.rect(A.x + lw, y, A.w - lw, sh, { fill: p.surface });
        strip(S, { x: A.x + lw + 2, y, w: A.w - lw - 4, h: sh }, Array.from({ length: 100 }, (_, c) => V[i * 100 + c]), { tone: 'lat', max: 0.4, reveal: clamp((S.since('glove') - 3.8 - k * 0.5) / 1.1) });
      });
    });
    d.withAlpha(S.reveal('glove', 5.6, 0.6), () => d.text(S.l('100 barras = 100 números reales (positivo arriba, negativo abajo)', '100 bars = 100 real numbers (positive up, negative down)'), A.x + lw, y0 + 3 * (sh + 8 * u) + 2 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'top', w: A.w - lw }));
  });
  void wt; void box; void link;
}
