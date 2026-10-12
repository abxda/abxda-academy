// Vista 2 · lo que pasa dentro de un modelo real (recall … no-idk). Mediciones de Pythia-1.4B (real-data.ts, run-demo.py):
// las piezas más probables tras «A:» para dos preguntas, la respuesta voraz y su probabilidad conjunta, la probabilidad de la
// respuesta correcta («Juan Rulfo») y la de ocho maneras de decir «no lo sé» (sumadas).
// Las piezas son las que ve el modelo: «Can» es el primer trozo de «Canberra».
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DIST, IDK } from './real-data';
import { FS, LH, area, card, chip, fitText, fr, mark, para, pct, probBars, smooth, step, stat, tight, type BarRow } from './ui';

const AUS = DIST[0], PAR = DIST[2];
const TOPK = 7;
const RULFO = IDK[PAR.q].gold[' Juan Rulfo'];
const NOIDK = IDK[PAR.q].idk;

function tokLabel(S: Frame, t: string) {
  const s = t.replace(/^ /, '');
  if (s === 'Can') return 'Can… (Canberra)';
  if (s === 'Hob') return 'Hob… (Hobart)';
  if (s === 'Sydney') return S.l('Sydney (Sídney)', 'Sydney');
  if (s === 'C') return 'C…';
  return s;
}

function rows(S: Frame, d: typeof AUS, grow: number, hot: number): BarRow[] {
  const top = d.top.slice(0, TOPK), rest = Math.max(0, 1 - top.reduce((s, [, p]) => s + p, 0));
  const out: BarRow[] = top.map(([t, p], i) => ({ label: tokLabel(S, t), value: p, hot: i === hot, t: 'lat', grow: clamp(grow * 1.6 - i * 0.08) }));
  out.push({ label: S.l('otras (cientos)', 'others (hundreds)'), value: rest, ghost: true, t: 'lat', grow: clamp(grow * 1.6 - TOPK * 0.08) });
  return out;
}

export function drawProbs(S: Frame) {
  const A = area(S);
  // tres momentos: el diagrama (recall) · pregunta y barras (aus-q … par-pick) · comparar (same-tone, no-idk)
  const toBars = smooth(fr(S, 'aus-q', 0, 0.1)), toCmp = smooth(fr(S, 'same-tone', 0, 0.1));
  if (toBars < 0.99) S.d.withAlpha(1 - toBars, () => drawIntro(S, A));
  if (toBars > 0.01 && toCmp < 0.99) S.d.withAlpha(toBars * (1 - toCmp), () => drawBars(S, A));
  if (toCmp > 0.01) S.d.withAlpha(toCmp, () => drawCompare(S, A));
}

/** recall: texto → Pythia → una barra por cada pieza que podría seguir. */
function drawIntro(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const a1 = fr(S, 'recall', 0.05, 0.2), a2 = fr(S, 'recall', 0.25, 0.4), a3 = fr(S, 'recall', 0.45, 0.6), a4 = fr(S, 'recall', 0.62, 0.78);
  const bw = vert ? Math.min(A.w * 0.8, 280 * u) : Math.min(A.w * 0.27, 240 * u), bh = vert ? Math.min(A.h * 0.24, 96 * u) : Math.min(A.h * 0.42, 140 * u);
  const boxes: Rect[] = vert
    ? [0, 1, 2].map((i) => ({ x: A.x + (A.w - bw) / 2, y: A.y + A.h * 0.02 + i * (bh + A.h * 0.08), w: bw, h: bh }))
    : [0, 1, 2].map((i) => ({ x: A.x + (A.w - 3 * bw) / 2 + i * bw * 1.25 - bw * 0.25, y: A.y + (A.h - bh) / 2 - 10 * u, w: bw, h: bh }));
  // 1 · el texto hasta aquí
  d.withAlpha(a1, () => {
    card(S, boxes[0], { tone: 'sig' });
    fitText(S, S.l('texto hasta aquí', 'text so far'), boxes[0].x + 10 * u, boxes[0].y + 14 * u, boxes[0].w - 20 * u, 12, { weight: 700, color: tone(S, 'sig').ink });
    fitText(S, S.l('«El cielo es…»', '“The sky is…”'), boxes[0].x + boxes[0].w / 2, boxes[0].y + boxes[0].h * 0.62, boxes[0].w - 20 * u, 16, { weight: 700, align: 'center' });
  });
  // 2 · el modelo
  d.withAlpha(a2, () => {
    card(S, boxes[1], { tone: 'w', hot: 0.4 });
    fitText(S, 'Pythia', boxes[1].x + boxes[1].w / 2, boxes[1].y + boxes[1].h * 0.38, boxes[1].w - 20 * u, 20, { weight: 800, align: 'center', color: tone(S, 'w').ink });
    fitText(S, S.l(`${S.n(1400, 0)} millones de parámetros`, '1.4 billion parameters'), boxes[1].x + boxes[1].w / 2, boxes[1].y + boxes[1].h * 0.72, boxes[1].w - 16 * u, 12, { weight: 600, align: 'center', color: p.ink2 });
  });
  // 3 · las barras
  d.withAlpha(a3, () => {
    const b = boxes[2];
    card(S, b, { tone: 'lat' });
    fitText(S, S.l('probabilidad de cada pieza', 'probability of each piece'), b.x + 10 * u, b.y + 14 * u, b.w - 20 * u, 12, { weight: 700, color: tone(S, 'lat').ink });
    const vals = [0.5, 0.25, 0.13, 0.12], labs = S.lang === 'es' ? ['azul', 'gris', 'grande', 'oscuro'] : ['blue', 'gray', 'big', 'dark'];
    const r: Rect = { x: b.x + 8 * u, y: b.y + 26 * u, w: b.w - 16 * u, h: b.h - 32 * u };
    const roomy = r.h / 4 >= LH(S, FS(S, 13), 1.05);
    if (r.h > 24 * u) probBars(S, r, vals.map((v, i) => ({ label: roomy ? labs[i] : '', value: v, t: 'lat', grow: clamp(a4 * 1.5 - i * 0.12), text: ' ' })), { labelW: roomy ? r.w * 0.42 : 0, valueW: 4 * u });
  });
  // flechas
  const ar = (from: Rect, to: Rect, k: number) => {
    if (vert) d.withAlpha(k, () => d.arrow(from.x + from.w / 2, from.y + from.h + 4 * u, to.x + to.w / 2, to.y - 4 * u, p.lineStrong, 2, 7 * u));
    else d.withAlpha(k, () => d.arrow(from.x + from.w + 4 * u, from.y + from.h / 2, to.x - 4 * u, to.y + to.h / 2, p.lineStrong, 2, 7 * u));
  };
  ar(boxes[0], boxes[1], a2); ar(boxes[1], boxes[2], a3);
  const capY = vert ? boxes[2].y + boxes[2].h + 14 * u : boxes[2].y + boxes[2].h + 22 * u;
  if (capY + 20 * u < A.y + A.h) d.withAlpha(a4, () => para(S, S.l('Ejemplo de la lección diecinueve', 'Example from lesson nineteen'), A.x, capY, A.w, FS(S, 12), { align: 'center', color: p.mute, italic: true }));
}

/** aus-q … par-pick: la pregunta, las barras y lo que escribe el modelo. */
function drawBars(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, P = S.on('par-q');
  const swap = smooth(fr(S, 'par-q', 0, 0.12));
  // regiones: pregunta arriba; barras; lecturas a la derecha (horizontal) o abajo (vertical)
  const asideW = S.portrait ? 0 : Math.min(A.w * 0.3, 240 * u);
  const main: Rect = { x: A.x, y: A.y, w: A.w - asideW - (asideW ? 18 * u : 0), h: A.h };
  const msz = FS(S, 14), qh = LH(S, msz, 1.35) * 2 + 18 * u;
  const qr: Rect = { x: main.x, y: main.y, w: main.w, h: qh };
  const statH = S.portrait ? (tight(S) ? 52 : 60) * u : 0;
  const glossH = S.lang === 'es' && !tight(S) ? LH(S, FS(S, 12), 1.4) : 0;
  const br: Rect = { x: main.x, y: qr.y + qh + glossH + 10 * u, w: main.w, h: main.y + main.h - (qr.y + qh + glossH + 10 * u) - statH };
  // ── la pregunta (con lo que va escribiendo el modelo) ──
  card(S, qr, { fill: p.surface });
  const write = (q: string, ans: string[], ok: boolean | null, a: number, prog: number[]) => d.withAlpha(a, () => {
    const x = qr.x + 12 * u, y1 = qr.y + 9 * u + LH(S, msz, 0.5), y2 = y1 + LH(S, msz, 1.35);
    fitText(S, `Q: ${q}`, x, y1, qr.w - 24 * u, 14, { weight: 700, font: 'mono' });
    const ax = x + d.measure('A: ', { size: msz, weight: 700, font: 'mono' });
    d.text('A:', x, y2, { size: msz, weight: 700, font: 'mono', base: 'middle' });
    let cx = ax;
    ans.forEach((w, i) => {
      const k = prog[i]; if (k <= 0.01) return;
      d.text(w, cx, y2, { size: msz, weight: 800, font: 'mono', base: 'middle', color: tone(S, 'lat').ink, a: k });
      cx += d.measure(w + ' ', { size: msz, weight: 800, font: 'mono' });
    });
    const typed = prog.some((k) => k > 0.01);
    if (!typed) { const blink = (Math.sin(S.clock * 6) + 1) / 2; d.rect(ax, y2 - msz * u * 0.45, 2 * u, msz * u * 0.9, { fill: alpha(p.ink, 0.3 + 0.6 * blink) }); }
    if (ok !== null && typed) { const k = prog[prog.length - 1]; mark(S, Math.min(cx + 10 * u, qr.x + qr.w - 14 * u), y2, ok, 6.5, k); }
  });
  const ausPick = fr(S, 'aus-pick', 0.1, 0.25), parA = fr(S, 'par-pick', 0.25, 0.37), parB = fr(S, 'par-pick', 0.45, 0.57);
  if (swap < 0.99) write('What is the capital of Australia?', ['Canberra'], true, (1 - swap) * fr(S, 'aus-q', 0.05, 0.2), [ausPick]);
  if (swap > 0.01) write('Who wrote Pedro Páramo?', ['Pablo', 'Neruda'], false, swap, [parA, parB]);
  if (glossH) {
    const g = P ? '¿Quién escribió Pedro Páramo?' : '¿Cuál es la capital de Australia?';
    fitText(S, `Q = pregunta · A = respuesta · ${g}`, qr.x + 2 * u, qr.y + qh + glossH * 0.55, qr.w - 4 * u, 12, { weight: 600, color: p.mute, a: fr(S, 'aus-q', 0.2, 0.35) });
  }
  // ── las barras ──
  const rh = Math.min(br.h / (TOPK + 1), (S.portrait ? 30 : 38) * u), bars: Rect = { ...br, h: rh * (TOPK + 1) };
  const labelW = Math.min(bars.w * 0.42, 150 * u);
  if (swap < 0.99) d.withAlpha(1 - swap, () => probBars(S, bars, rows(S, AUS, fr(S, 'aus-bars', 0.05, 0.5, 'lin'), S.on('aus-pick') ? 0 : -1), { labelW }));
  if (swap > 0.01) d.withAlpha(swap, () => probBars(S, bars, rows(S, PAR, fr(S, 'par-bars', 0.05, 0.5, 'lin'), S.on('par-pick') ? 0 : -1), { labelW }));
  // ── lecturas ──
  const items: { l: string; v: string; t: 'lat' | 'dat' | 'err'; a: number }[] = [];
  if (P) {
    if (S.on('par-pick')) {
      items.push({ l: S.l('respuesta: Pablo Neruda', 'answer: Pablo Neruda'), v: S.l('falsa', 'false'), t: 'err', a: fr(S, 'par-pick', 0.6, 0.7) });
      items.push({ l: S.l('Juan Rulfo, la correcta', 'Juan Rulfo, the right one'), v: pct(S, RULFO, 1), t: 'dat', a: fr(S, 'par-pick', 0.72, 0.82) });
    } else {
      items.push({ l: S.l('la más alta', 'the tallest'), v: pct(S, PAR.top[0][1], 0), t: 'lat', a: fr(S, 'par-bars', 0.4, 0.5) });
      items.push({ l: S.l('repartido en cientos', 'spread over hundreds'), v: pct(S, 1 - PAR.top.slice(0, TOPK).reduce((s, [, q]) => s + q, 0), 0), t: 'lat', a: fr(S, 'par-bars', 0.62, 0.72) });
    }
  } else if (S.on('aus-pick')) {
    items.push({ l: S.l('respuesta: Canberra', 'answer: Canberra'), v: S.l('correcta', 'correct'), t: 'dat', a: fr(S, 'aus-pick', 0.3, 0.4) });
  } else if (S.on('aus-bars')) {
    items.push({ l: 'Can… (Canberra)', v: pct(S, AUS.top[0][1], 0), t: 'lat', a: fr(S, 'aus-bars', 0.5, 0.6) });
    items.push({ l: S.l('Sídney', 'Sydney'), v: pct(S, AUS.top[1][1], 0), t: 'lat', a: fr(S, 'aus-bars', 0.75, 0.85) });
  }
  if (S.portrait) {
    const cw = A.w / 2, y = A.y + A.h - statH + 6 * u;
    items.forEach((it, i) => stat(S, A.x + i * cw, y, it.l, it.v, it.t, { size: 20, w: cw - 10 * u, a: it.a }));
  } else {
    const x = A.x + A.w - asideW;
    d.withAlpha(fr(S, 'aus-q', 0.1, 0.3), () => fitText(S, S.l('Pythia-1.4B, medido', 'Pythia-1.4B, measured'), x, A.y + 8 * u, asideW, 12, { weight: 700, color: p.mute }));
    items.forEach((it, i) => stat(S, x, A.y + 34 * u + i * 66 * u, it.l, it.v, it.t, { size: 24, w: asideW, a: it.a }));
  }
}

/** same-tone y no-idk: las dos respuestas se ven igual; adentro, una tenía 69 % y la otra 4 %. Luego, de cada diez mil veces. */
function drawCompare(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const toIdk = smooth(fr(S, 'no-idk', 0, 0.1));
  if (toIdk < 0.99) d.withAlpha(1 - toIdk, () => {
    const gap = 16 * u, vert = S.portrait;
    const cw = vert ? A.w : (A.w - gap) / 2, chh = Math.min(vert ? A.h * 0.42 : A.h * 0.62, 210 * u);
    const cards: { q: string; ans: string; conf: number; ok: boolean }[] = [
      { q: S.l('Capital de Australia', 'Capital of Australia'), ans: 'Canberra', conf: AUS.p, ok: true },
      { q: S.l('Autor de Pedro Páramo', 'Author of Pedro Páramo'), ans: 'Pablo Neruda', conf: PAR.p, ok: false },
    ];
    const hdr = fr(S, 'same-tone', 0.05, 0.18), meter = fr(S, 'same-tone', 0.35, 0.55), verdict = fr(S, 'same-tone', 0.7, 0.82);
    cards.forEach((c, i) => {
      const r: Rect = vert ? { x: A.x, y: A.y + i * (chh + gap), w: cw, h: chh } : { x: A.x + i * (cw + gap), y: A.y + (A.h - chh) / 2, w: cw, h: chh };
      const pad = 12 * u;
      d.withAlpha(hdr, () => {
        card(S, r, { fill: p.surface });
        fitText(S, c.q, r.x + pad, r.y + pad + 6 * u, r.w - 2 * pad, 12.5, { weight: 700, color: p.mute });
        fitText(S, c.ans, r.x + r.w / 2, r.y + r.h * 0.36, r.w - 2 * pad, vert ? 26 : 32, { weight: 800, align: 'center' });
        fitText(S, S.l('así se ve en pantalla', 'how it looks on screen'), r.x + r.w / 2, r.y + r.h * 0.36 + 26 * u, r.w - 2 * pad, 12, { weight: 600, color: p.mute, align: 'center', italic: true });
      });
      // la duda escondida: un medidor de 0 a 100 %
      d.withAlpha(meter, () => {
        const my = r.y + r.h * 0.7, mx = r.x + pad, mw = r.w - 2 * pad, mh = 14 * u;
        fitText(S, S.l('dentro del modelo:', 'inside the model:'), mx, my - 12 * u, mw * 0.6, 12, { weight: 700, color: tone(S, 'lat').ink });
        d.rect(mx, my, mw, mh, { fill: alpha(p.ink, 0.06), stroke: p.line, lw: 1, r: 2 });
        d.rect(mx, my, mw * c.conf * smooth(meter), mh, { fill: tone(S, 'lat').c, r: 2 });
        fitText(S, pct(S, c.conf, 0), mx + mw, my - 12 * u, mw * 0.4, 16, { weight: 800, font: 'mono', align: 'right', color: tone(S, 'lat').ink });
      });
      d.withAlpha(verdict, () => {
        mark(S, r.x + r.w - pad - 6 * u, r.y + pad + 6 * u, c.ok, 6);
      });
    });
  });
  if (toIdk > 0.01) d.withAlpha(toIdk, () => {
    const t1 = fr(S, 'no-idk', 0.1, 0.25);
    const title = S.l(`Pedro Páramo: de cada ${S.n(10000, 0)} veces, el modelo escribiría…`, `Pedro Páramo: out of ${S.n(10000, 0)} times, the model would write…`);
    const tsz = FS(S, 14), th = para(S, title, A.x, A.y + 4 * u, A.w, tsz, { weight: 800, a: t1, maxLines: 2 });
    const k = 10000;
    const rs: BarRow[] = [
      { label: 'Pablo Neruda', value: PAR.p, t: 'err', hot: true, text: S.n(PAR.p * k, 0), grow: fr(S, 'no-idk', 0.2, 0.4, 'lin') },
      { label: 'Juan Rulfo', value: RULFO, t: 'dat', text: S.n(RULFO * k, 0), grow: fr(S, 'no-idk', 0.35, 0.55, 'lin') },
      { label: S.l('«no lo sé»', '“I don’t know”'), value: NOIDK, t: 'w', hot: true, text: S.l('menos de 1', 'less than 1'), grow: fr(S, 'no-idk', 0.55, 0.75, 'lin') },
    ];
    const rh = Math.min(48 * u, (A.h - th - 40 * u) / 3);
    const vw = d.measure(S.l('menos de 1', 'less than 1'), { size: FS(S, 13), weight: 800, font: 'mono' });
    const r: Rect = { x: A.x, y: A.y + th + 18 * u, w: A.w, h: rh * 3 };
    probBars(S, r, rs, { max: PAR.p, labelW: Math.min(150 * u, A.w * 0.34), rowH: rh, valueW: vw + 10 * u });
    const ny = r.y + r.h + 10 * u;
    if (A.y + A.h - ny > LH(S, FS(S, 12), 2.6)) para(S, S.l('«no lo sé» suma ocho formas de decirlo: «I don’t know», «Unknown», «Not sure»…', '“I don’t know” adds up eight ways of saying it: “I don’t know,” “Unknown,” “Not sure”…'), A.x, ny, A.w, FS(S, 12), { color: p.mute, a: fr(S, 'no-idk', 0.7, 0.85), maxLines: 2 });
  });
  void chip; void step;
}
