// Acto 2 · las probabilidades de un modelo real (Pythia-1.4B): una pregunta que domina, una que no, y por qué elige igual.
// Todo viene de real-data.ts (medido con run-demo.py). Las piezas («tokens») son las que el modelo ve: «Can» es el primer trozo de «Canberra».
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DIST, IDK } from './real-data';
import { FS, card, fitText, mark, para, pct, probBars, smooth, stamp, stat, type BarRow } from './ui';

const AUS = DIST[0], PAR = DIST[2];
const TOPK = 7;

/** Etiqueta legible de una pieza: sin el espacio inicial; «Can» se muestra como la palabra a la que pertenece. */
function tokLabel(t: string, q: string, lang: 'es' | 'en') {
  const s = t.replace(/^ /, '');
  if (q.includes('Australia') && s === 'Can') return 'Can… (Canberra)';
  if (q.includes('Australia') && s === 'Hob') return 'Hob… (Hobart)';
  if (lang === 'es' && s === 'Sydney') return 'Sydney (Sídney)';
  return s;
}

function rowsFor(S: Frame, d: typeof AUS, hotIdx: number | -1, prog: number, extra?: BarRow): BarRow[] {
  const top = d.top.slice(0, TOPK), rest = Math.max(0, 1 - top.reduce((s, [, p]) => s + p, 0));
  const rows: BarRow[] = top.map(([t, p], i) => ({ label: tokLabel(t, d.q, S.lang), value: p, hot: i === hotIdx, t: 'lat', a: clamp(prog * (TOPK + 2) - i * 0.9) }));
  rows.push({ label: S.l('otras (miles)', 'others (thousands)'), value: rest, ghost: true, t: 'lat', a: clamp(prog * (TOPK + 2) - TOPK * 0.9) });
  if (extra) rows.push(extra);
  return rows;
}

export function drawProbs(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const toUnk = S.at('unknown', 0, 0.8), inUnk = S.on('unknown');
  const m = R.main;
  // prompt: lo que el modelo lee
  const q1 = AUS.q, q2 = PAR.q;
  const promptH = 36 * u;
  const promptRect: Rect = { x: m.x, y: m.y, w: m.w, h: promptH };
  const pa = S.reveal('recall', 0, 0.5);
  d.withAlpha(pa, () => {
    card(S, promptRect, 'ink', { fill: 0.03 });
    const qa = (inUnk ? q2 : q1);
    const alpha1 = inUnk ? smooth(toUnk) : 1 - 0;
    const txt = (q: string) => `Q: ${q}   A:`;
    d.withAlpha(1 - smooth(toUnk) * (inUnk ? 1 : 0), () => fitText(S, txt(q1), m.x + 10 * u, m.y + promptH / 2, m.w - 20 * u, 14, { weight: 700, font: 'mono', base: 'middle' }));
    if (inUnk) d.withAlpha(alpha1, () => fitText(S, txt(q2), m.x + 10 * u, m.y + promptH / 2, m.w - 20 * u, 14, { weight: 700, font: 'mono', base: 'middle' }));
    void qa;
  });
  d.withAlpha(S.reveal('recall', 0.4, 0.5), () => {
    fitText(S, S.l('Pythia · 1 400 millones de parámetros · modelo base en inglés (la pregunta va en inglés)', 'Pythia · 1.4 billion parameters · base model, English only'), m.x, m.y + promptH + 4 * u, m.w, 12, { weight: 600, color: p.mute, base: 'top' });
  });

  // barras
  const bars: Rect = { x: m.x, y: m.y + promptH + 26 * u, w: m.w, h: m.h - promptH - 26 * u };
  const nrows = TOPK + 1 + (S.on('noidk') ? 1 : 0);
  const rowH = Math.min(30 * u, bars.h / (TOPK + 2));
  const growA = S.at('known', 0.1, 1.5, 'out'), growB = S.at('unknown', 0.2, 1.8, 'out');
  const showA = S.on('recall') ? 1 - smooth(toUnk) : 0;
  if (showA > 0.01) d.withAlpha(showA, () => {
    const rows = rowsFor(S, AUS, 0, S.on('known') ? growA : 0.0001, undefined).map((r, i) => (S.on('known') ? r : { ...r, value: 0, a: S.reveal('recall', 0.7 + i * 0.07, 0.4) }));
    probBars(S, { ...bars, h: rowH * nrows }, rows, { rowH, labelW: Math.min(150 * u, bars.w * 0.38) });
  });
  if (inUnk) {
    const mustHot = S.on('must') ? 0 : -1;
    const extra: BarRow | undefined = S.on('noidk') ? { label: S.l('«I don’t know» (frase)', '“I don’t know” (phrase)'), value: IDK[PAR.q]?.idk ?? 0, t: 'err', a: S.reveal('noidk', 0.2, 0.6), hot: false } : undefined;
    d.withAlpha(smooth(toUnk), () => probBars(S, { ...bars, h: rowH * nrows }, rowsFor(S, PAR, mustHot, growB, extra), { rowH, labelW: Math.min(150 * u, bars.w * 0.38) }));
  }

  // la respuesta que sale (must)
  if (S.on('must')) {
    const a = S.reveal('must', 0.4, 0.6), a2 = S.reveal('must', 1.4, 0.6), a3 = S.reveal('must', 2.4, 0.6);
    const y = bars.y + rowH * nrows + 6 * u, hh = Math.min(34 * u, m.y + m.h - y);
    if (hh > 20 * u && !S.on('noidk')) {
      d.withAlpha(a, () => {
        d.text(S.l('El modelo escribe:', 'The model writes:'), m.x, y + hh / 2, { size: FS(S, 13), weight: 700, color: p.mute, base: 'middle' });
        const x0 = m.x + d.measure(S.l('El modelo escribe:', 'The model writes:'), { size: FS(S, 13), weight: 700 }) + 10 * u;
        d.withAlpha(1, () => fitText(S, 'Pablo', x0, y + hh / 2, 80 * u, 17, { weight: 800, color: tone(S, 'lat').ink, base: 'middle' }));
        const w1 = d.measure('Pablo ', { size: FS(S, 17), weight: 800 });
        d.withAlpha(a2, () => fitText(S, 'Neruda', x0 + w1, y + hh / 2, 110 * u, 17, { weight: 800, color: tone(S, 'lat').ink, base: 'middle' }));
        if (a3 > 0) stamp(S, S.l('INVENTADA', 'INVENTED'), m.x + m.w - 70 * u, y + hh / 2, 'err', { angle: -0.1, size: 14, pop: smooth(a3) });
      });
    }
  }
  drawProbAside(S, R.aside);
}

function drawProbAside(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  const items: { l: string; v: string; t: 'ink' | 'lat' | 'err' | 'dat' | 'w' }[] = [];
  if (S.on('noidk')) items.push({ l: S.l('«no sé» (frase completa)', '“I don’t know” (full phrase)'), v: pct(S, IDK[PAR.q]?.idk ?? 0, 3), t: 'err' }, { l: S.l('«Pablo Neruda» (respuesta dada)', '“Pablo Neruda” (answer given)'), v: pct(S, PAR.p, 1), t: 'lat' });
  else if (S.on('must')) items.push({ l: S.l('«Pablo Neruda» (inventada)', '“Pablo Neruda” (invented)'), v: pct(S, PAR.p, 1), t: 'err' }, { l: S.l('«Juan Rulfo» (correcta)', '“Juan Rulfo” (correct)'), v: pct(S, IDK[PAR.q]?.variants[' Juan Rulfo'] ?? 0.001, 1), t: 'dat' });
  else if (S.on('unknown')) items.push({ l: S.l('la más probable', 'most probable'), v: pct(S, PAR.top[0][1], 1), t: 'lat' }, { l: S.l('el resto, repartido', 'the rest, spread out'), v: pct(S, 1 - PAR.top.slice(0, TOPK).reduce((s, [, q]) => s + q, 0), 0), t: 'lat' });
  else if (S.on('known')) items.push({ l: S.l('Canberra (correcta)', 'Canberra (correct)'), v: pct(S, AUS.p, 0), t: 'dat' }, { l: S.l('Sídney (incorrecta)', 'Sydney (wrong)'), v: pct(S, AUS.top[1][1], 0), t: 'err' });
  else items.push({ l: S.l('piezas posibles', 'possible pieces'), v: '≈ 50 000', t: 'lat' });
  const cols = S.portrait ? 2 : 1, cw = r.w / cols, rh = 62 * u;
  items.forEach((it, i) => stat(S, r.x + (i % cols) * cw, r.y + Math.floor(i / cols) * rh + 2 * u, it.l, it.v, it.t, { size: 24, w: cw - 8 * u, a: S.reveal(S.on('noidk') ? 'noidk' : S.on('must') ? 'must' : S.on('unknown') ? 'unknown' : S.on('known') ? 'known' : 'recall', 0.9 + i * 0.3, 0.5) }));
  void card; void mark; void para; void alpha;
}
