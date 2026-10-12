// Vista 8: «perdido en el medio». Veinte documentos y una pregunta; uno solo tiene la respuesta y cambia de lugar.
// La gráfica se arma eje por eje y punto por punto con los valores REALES de Liu et al. (2023), tabla 6 (GPT-3.5-Turbo,
// 20 documentos), y la línea «sin documentos» de su tabla 1.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { GPT35, LITM_POS, litmAcc } from './model';
import { st } from './state';
import { FS, area, chip, doc, fitText, fr, para, tight } from './ui';

const Y0 = 40, Y1 = 80;

export function drawLitm(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), s = st(S), lt = tone(S, 'lat'), dt = tone(S, 'dat'), et = tone(S, 'err');
  // ── fila de documentos ──
  const qW = Math.max(46 * u, d.measure(S.l('pregunta', 'question'), { size: FS(S, 12.5), weight: 700 }) + 16 * u);
  const tg = tight(S) && !S.portrait, rowW = A.w - qW - 10 * u, slot = rowW / 20, dw = Math.max(6, slot * 0.72), dh = tg ? 16 * u : Math.min(30 * u, Math.max(16 * u, dw * 1.35));
  const ry = A.y + (tg ? 2 : 4) * u;
  const docX = (j: number) => A.x + (j - 1) * slot + (slot - dw) / 2;
  const pos = clamp(s.pos, 1, 20), near = Math.round(pos), moving = Math.abs(pos - near);
  for (let j = 1; j <= 20; j++) {
    const a = fr(S, 'litm-setup', 0.15 + j * 0.02, 0.22 + j * 0.02);
    if (a < 0.01) continue;
    if (j === near && fr(S, 'litm-setup', 0.7, 0.8) > 0.5) continue;
    doc(S, { x: docX(j), y: ry, w: dw, h: dh }, { a });
  }
  const ga = fr(S, 'litm-setup', 0.62, 0.78);
  if (ga > 0.01) doc(S, { x: A.x + (pos - 1) * slot + (slot - dw) / 2, y: ry - moving * 8 * u, w: dw, h: dh }, { a: ga, mark: true, hot: 0.4 });
  const qa = fr(S, 'litm-setup', 0.5, 0.62);
  chip(S, S.l('pregunta', 'question'), A.x + A.w - qW / 2, ry + dh / 2, 'ink', { a: qa, size: 12.5 });
  const ra = fr(S, 'litm-setup', 0.4, 0.55) * (tg ? 1 - fr(S, 'litm-y', 0, 0.2) : 1);
  fitText(S, S.l('20 documentos · uno tiene la respuesta', '20 documents · one has the answer'), A.x, ry + dh + 6 * u, rowW, 12.5, { weight: 700, color: p.mute, base: 'top', a: ra });

  // ── gráfica ──
  const top = ry + dh + (tg ? 4 : FS(S, 12.5) + 22) * u;
  const pl = 46 * u, pb = (tg ? 32 : 42) * u, ph = (tg ? 18 : 26) * u;
  const P: Rect = { x: A.x + pl, y: top + ph, w: A.w - pl - 14 * u, h: A.y + A.h - top - ph - pb };
  const X = (j: number) => P.x + ((j - 1) / 19) * P.w, Y = (v: number) => P.y + P.h - ((v - Y0) / (Y1 - Y0)) * P.h;
  const ax = fr(S, 'litm-x', 0.05, 0.3), ay = fr(S, 'litm-y', 0.05, 0.3);
  if (ax > 0.01) d.withAlpha(ax, () => {
    d.line(P.x, P.y + P.h, P.x + P.w, P.y + P.h, p.lineStrong, 1.5);
    LITM_POS.forEach((j) => {
      d.line(X(j), P.y + P.h, X(j), P.y + P.h + 4 * u, p.lineStrong, 1.5);
      d.text(S.l(`${j}.º`, ordinal(j)), X(j), P.y + P.h + 7 * u, { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' });
    });
    fitText(S, S.l('lugar del documento con la respuesta', 'place of the document with the answer'), P.x + P.w, P.y + P.h + (FS(S, 12) + 12) * u, P.w, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
    // flechas «principio» y «final»
    const ea = fr(S, 'litm-x', 0.45, 0.65);
    fitText(S, S.l('← principio', '← start'), P.x, P.y + P.h - 6 * u, P.w * 0.4, 12, { weight: 700, color: p.mute, base: 'bottom', a: ea * (1 - ay) });
    fitText(S, S.l('final →', 'end →'), P.x + P.w, P.y + P.h - 6 * u, P.w * 0.4, 12, { weight: 700, color: p.mute, align: 'right', base: 'bottom', a: ea * (1 - ay) });
  });
  if (ay > 0.01) d.withAlpha(ay, () => {
    d.line(P.x, P.y, P.x, P.y + P.h, p.lineStrong, 1.5);
    (tg ? [40, 60, 80] : [40, 50, 60, 70, 80]).forEach((v) => {
      d.line(P.x - 4 * u, Y(v), P.x, Y(v), p.lineStrong, 1.5);
      d.line(P.x, Y(v), P.x + P.w, Y(v), alpha(p.line, 0.6), 1);
      d.text(`${v} %`, P.x - 7 * u, Y(v), { size: FS(S, 12), font: 'mono', weight: 600, color: p.mute, align: 'right', base: 'middle' });
    });
    fitText(S, S.l('% de preguntas acertadas', '% of questions answered correctly'), A.x, P.y - (tg ? 4 : 10) * u, P.w * 0.75, 12.5, { weight: 700, color: p.ink2, base: 'bottom' });
    chip(S, GPT35.name, P.x + P.w, P.y - (tg ? 12 : 16) * u, 'lat', { align: 'right', size: 12.5, a: fr(S, 'litm-y', 0.5, 0.7) });
  });

  // la U: zona del medio
  const ua = fr(S, 'litm-name', 0.15, 0.35);
  if (ua > 0.01) {
    d.rect(X(4), P.y, X(17) - X(4), P.h, { fill: alpha(et.c, 0.07 * ua) });
    fitText(S, S.l('perdido en el medio', 'lost in the middle'), (X(4) + X(17)) / 2, P.y + 6 * u, X(17) - X(4), 13.5, { weight: 800, color: et.ink, align: 'center', base: 'top', a: ua });
  }
  // sin documentos (tabla 1): línea punteada, con su rótulo arriba a la derecha (zona libre de la curva)
  const ca = fr(S, 'litm-closed', 0.2, 0.4), legA = 1 - fr(S, 'litm-advice', 0, 0.2);
  if (ca > 0.01) d.withAlpha(ca, () => {
    d.line(P.x, Y(GPT35.closed), P.x + P.w, Y(GPT35.closed), p.ink2, 2, [6, 5]);
    if (legA < 0.01) return;
    const txt = S.l(`sin documentos: ${S.n(GPT35.closed, 0)} %`, `no documents: ${S.n(GPT35.closed, 0)}%`);
    // rótulo abajo a la derecha: bajo el 52 % no pasa la curva (en «litm-advice» ese lugar es del consejo)
    const tw = Math.min(P.w * 0.55, d.measure(txt, { size: FS(S, 12.5), weight: 800 }) + 4 * u), ly = Y(45.5);
    d.line(P.x + P.w - tw - 26 * u, ly, P.x + P.w - tw - 6 * u, ly, p.ink2, 2, [6, 5], legA);
    fitText(S, txt, P.x + P.w, ly, tw, 12.5, { weight: 800, color: p.ink, align: 'right', base: 'middle', halo: true, a: legA });
  });

  // puntos medidos: 1.º, 10.º y 20.º narrados; 5.º y 15.º y la línea al final
  const ptA = (j: number) => j === 1 ? fr(S, 'litm-first', 0.1, 0.3) : j === 10 ? fr(S, 'litm-middle', 0.15, 0.35) : j === 20 ? fr(S, 'litm-last', 0.15, 0.35) : fr(S, 'litm-last', 0.55, 0.7);
  const la = fr(S, 'litm-last', 0.6, 0.85);
  if (la > 0.01) {
    const pts = LITM_POS.map((j) => [X(j), Y(litmAcc(j))] as [number, number]);
    const n = Math.max(2, Math.ceil(la * pts.length));
    d.polyline(pts.slice(0, n), lt.c, 2.6, { a: la });
  }
  LITM_POS.forEach((j) => {
    const a = ptA(j);
    if (a < 0.01) return;
    const v = litmAcc(j), cur = Math.abs(pos - j) < 0.5 && S.on('litm-first');
    d.circle(X(j), Y(v), (cur ? 7 : 5) * u, { fill: cur ? lt.c : p.stage, stroke: lt.c, lw: 2.4, a });
    const lab = `${S.n(v, 0)} %`;
    const above = !(j === 10 && ca > 0.01);
    const txt = S.lang === 'es' ? lab : lab.replace(' %', '%'), o = { size: FS(S, cur ? 14 : 12.5), font: 'mono' as const, weight: 800, color: lt.ink, a, halo: p.stage, haloW: 4 };
    if (j === 1) d.text(txt, X(j) + 10 * u, Y(v), { ...o, align: 'left', base: 'middle' });
    else d.text(txt, X(j), Y(v) + (above ? -10 : 12) * u, { ...o, align: j === 20 ? 'right' : 'center', base: above ? 'bottom' : 'top' });
  });
  // guía del documento actual hacia su punto
  if (S.on('litm-first') && near === Math.round(pos)) {
    const j = LITM_POS.reduce((a, b) => (Math.abs(b - pos) < Math.abs(a - pos) ? b : a), 1);
    const gA = S.on('try-litm') && !S.on('litm-advice') ? 1 : 1 - fr(S, 'litm-name', 0, 0.3);   // la guía estorba mientras se leen la U y la línea punteada
    if (Math.abs(j - pos) < 0.5 && ptA(j) > 0.5 && gA > 0.01) d.line(X(j), ry + dh + 2 * u, X(j), Y(litmAcc(j)) - 8 * u, alpha(dt.c, 0.6 * gA), 1.4, [3, 4]);
  }
  // consejo final
  const adv = fr(S, 'litm-advice', 0.2, 0.4);
  // (en la franja de abajo de la gráfica, bajo el 52 %, no pasa la curva)
  if (adv > 0.01) para(S, S.l('modelos de 2023 · una sola prueba · cada modelo tiene su curva', '2023 models · a single test · each model has its own curve'), P.x + 6 * u, Y(48), P.w - 12 * u, FS(S, 12.5), { weight: 700, color: p.ink2, align: 'center', a: adv, italic: true, maxLines: 2 });
}

function ordinal(j: number) { return j === 1 ? '1st' : `${j}th`; }
