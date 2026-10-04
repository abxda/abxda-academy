// Acto 6 · calibración: el diagrama de fiabilidad de Pythia-1.4B sobre 424 preguntas (real-data.ts), lo que un chat no muestra
// y qué cambia el tamaño del modelo (mismas preguntas, siete tamaños de Pythia).
// Fuentes: mediciones propias (run-qa.py); GPT-4 Technical Report (OpenAI, 2023), figura 8 y texto sobre calibración.
import { Plot, alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CONFIDENT_WRONG, QA, SCALE } from './real-data';
import { reliability } from './stats';
import { FS, axes, bubble, card, fitText, fr, mark, pct, para, probBars, smooth, source, stat, tagText, num, type BarRow } from './ui';

const CONF = QA.conf, OK = [...QA.ok].map((c) => c === '1');
/** Errores cuya probabilidad era al menos `th`. */
export const confidentErrors = (th: number) => CONF.reduce((n, c, i) => n + (!OK[i] && c >= th ? 1 : 0), 0);
const BELIZE = CONFIDENT_WRONG.find((c) => c.q.includes('Belize')) ?? CONFIDENT_WRONG[0];

// ───────────────────────── calib + signal: diagrama de fiabilidad ─────────────────────────
export function drawCalib(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, m = R.main;
  const pl = new Plot(S, m, { xr: [0, 1], yr: [0, 1], pad: { l: 46, r: 8, t: 26, b: 52 } });
  const bins = reliability(10), dat = tone(S, 'dat'), err = tone(S, 'err');
  const inSignal = S.on('signal');
  const grow = fr(S, 'calib', 0.5, 0.82), axA = S.reveal('calib', 0, 0.5);
  axes(S, pl, { xTicks: [0, 0.25, 0.5, 0.75, 1], yTicks: [0, 0.25, 0.5, 0.75, 1], xFmt: (v) => pct(S, v), yFmt: (v) => pct(S, v), grid: true, a: axA,
    xLabel: S.l('probabilidad que dio a su respuesta', 'probability it gave its answer'), yLabel: S.l('porcentaje de aciertos', 'share of right answers') });
  // idea: la diagonal es «calibrado»
  const dg = fr(S, 'calib', 0.04, 0.2);
  d.withAlpha(dg, () => {
    d.line(pl.X(0), pl.Y(0), pl.X(dg), pl.Y(dg), p.ink2, 2, [7, 5]);
    tagText(S, S.l('calibrado', 'calibrated'), pl.X(0.16), pl.Y(0.16) - 12 * u, { t: 'ink', align: 'left', size: 13 });
  });
  const ex = fr(S, 'calib', 0.2, 0.36);
  d.withAlpha(ex, () => {
    d.circle(pl.X(0.6), pl.Y(0.6), 6 * u, { fill: p.ink, stroke: p.stage, lw: 2 });
    tagText(S, S.l('60 % → 6 de 10', '60% → 6 in 10'), pl.X(0.6) - 10 * u, pl.Y(0.6) + 14 * u, { t: 'ink', align: 'right', size: 13 });
  });
  // barras medidas
  const bw = pl.r.w / bins.length;
  bins.forEach((b, i) => {
    const g = clamp(grow * (bins.length + 2) - i * 1.0);
    if (g <= 0 || b.n === 0) return;
    const hot = !inSignal || i === 0 || i === bins.length - 1, h = (pl.r.h * b.acc) * smooth(g), x = pl.r.x + i * bw + bw * 0.1, w = bw * 0.8, y = pl.r.y + pl.r.h - h;
    d.withAlpha(hot ? 1 : 0.38, () => {
      d.rect(x, y, w, h, { fill: alpha(dat.c, hot ? 0.62 : 0.45), stroke: dat.c, lw: inSignal && hot ? 2.4 : 1.4 });
      if (smooth(g) > 0.6) fitText(S, String(b.n), x + w / 2, y - 3 * u, bw, 11.5, { weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'bottom' });
    });
  });
  d.withAlpha(grow, () => fitText(S, S.l('sobre cada barra: número de preguntas', 'above each bar: number of questions'), pl.r.x + 4 * u, pl.r.y - 6 * u, pl.r.w, 12, { weight: 600, color: p.mute, base: 'bottom', align: 'left', a: 0 }));
  // lateral: los tres hallazgos de «signal»
  const low = bins[0], hi = bins[bins.length - 1];
  const lowOk = Math.round(low.acc * low.n), hiOk = Math.round(hi.acc * hi.n);
  const a = R.aside, cols = S.portrait ? 3 : 1, cw = a.w / cols, rh = 66 * u;
  const items: { l: string; v: string; t: 'err' | 'dat' | 'w'; at: number }[] = [
    { l: S.l('con menos de 10 %: aciertan', 'under 10%: right'), v: `${lowOk} / ${low.n}`, t: 'err', at: 0.04 },
    { l: S.l('con más de 90 %: aciertan', 'over 90%: right'), v: `${hiOk} / ${hi.n}`, t: 'dat', at: 0.38 },
    { l: S.l('errores con 50 % o más', 'errors at 50% or more'), v: String(confidentErrors(0.5)), t: 'w', at: 0.7 },
  ];
  if (inSignal) items.forEach((it, i) => stat(S, a.x + (i % cols) * cw, a.y + Math.floor(i / cols) * rh + 2 * u, it.l, it.v, it.t, { size: 24, w: cw - 8 * u, a: fr(S, 'signal', it.at, it.at + 0.12) }));
  if (inSignal && !S.portrait) d.withAlpha(fr(S, 'signal', 0.72, 0.85), () => {
    const y = a.y + 3 * rh + 6 * u;
    para(S, `${S.l('Ejemplo', 'Example')}: ${S.l('capital de Belice', 'capital of Belize')} → Belize City (${pct(S, BELIZE.p)})`, a.x, y, a.w, { size: 13, weight: 600, color: p.ink2 });
  });
  source(S, S.l('Pythia-1.4B · 424 preguntas de cultura general (ilustrativas) · modelo base, 5 ejemplos en el prompt', 'Pythia-1.4B · 424 general-knowledge questions (illustrative) · base model, 5 examples in the prompt'), grow);
  void FS; void card; void bubble; void mark; void probBars; void err; void num;
}

// ───────────────────────── hidden: lo que ves y lo que no ves ─────────────────────────
export function drawHidden(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const portrait = S.portrait || r.w < 600 * u, gap = 16 * u;
  const colW = portrait ? r.w : (r.w - gap) / 2;
  const topH = portrait ? (r.h - gap) * 0.5 : Math.min(r.h, 250 * u);
  const left: Rect = { x: r.x, y: r.y, w: colW, h: topH };
  const right: Rect = portrait ? { x: r.x, y: r.y + topH + gap, w: colW, h: topH } : { x: r.x + colW + gap, y: r.y, w: colW, h: topH };
  const lat = tone(S, 'lat'), err = tone(S, 'err');
  const a1 = S.reveal('hidden', 0.1, 0.5), a2 = S.reveal('hidden', 1.2, 0.6);
  // izquierda: lo que muestra un chat
  d.withAlpha(a1, () => {
    card(S, left, 'ink', { fill: 0.02 });
    fitText(S, S.l('Lo que ves en el chat', 'What you see in the chat'), left.x + 12 * u, left.y + 10 * u, left.w - 24 * u, 14, { weight: 800, color: p.ink, base: 'top' });
    const bw = left.w - 24 * u;
    const q = bubble(S, S.l('What is the capital of Belize?  (¿Capital de Belice?)', 'What is the capital of Belize?'), left.x + 12 * u, left.y + 38 * u, bw, 'user', { size: 13.5 });
    bubble(S, 'Belize City', left.x + 12 * u, q.y + q.h + 8 * u, bw * 0.7, 'bot', { size: 15, tag: 'Pythia-1.4B' });
  });
  // derecha: lo que hay dentro y no se muestra
  d.withAlpha(a2, () => {
    d.rect(right.x, right.y, right.w, right.h, { stroke: p.mute, lw: 1.6, r: 3, dash: [6, 4] });
    fitText(S, S.l('Lo que hay dentro (no se muestra)', 'What is inside (not shown)'), right.x + 12 * u, right.y + 10 * u, right.w - 24 * u, 14, { weight: 800, color: p.ink2, base: 'top' });
    const by = right.y + 54 * u, bx = right.x + 14 * u, bw = right.w - 28 * u, bh = 22 * u;
    fitText(S, S.l('probabilidad de su respuesta', 'probability of its answer'), bx, by - 6 * u, bw, 13, { weight: 600, color: p.ink2, base: 'bottom' });
    d.rect(bx, by, bw, bh, { fill: p.surface2 });
    d.rect(bx, by, bw * BELIZE.p * smooth(S.at('hidden', 1.4, 2.4)), bh, { fill: alpha(lat.c, 0.7) });
    d.text(pct(S, BELIZE.p), bx + bw * BELIZE.p * smooth(S.at('hidden', 1.4, 2.4)) - 6 * u, by + bh / 2, { size: FS(S, 14), weight: 800, color: p.ink, align: 'right', base: 'middle', font: 'mono', halo: alpha(lat.c, 0.0), haloW: 0 });
    // ✗ la respuesta era falsa
    const ma = S.reveal('hidden', 2.6, 0.5);
    d.withAlpha(ma, () => {
      mark(S, bx + 10 * u, by + bh + 26 * u, 'no', 8 * u);
      fitText(S, S.l('Respuesta falsa: la capital es Belmopan', 'Wrong answer: the capital is Belmopan'), bx + 28 * u, by + bh + 26 * u, bw - 28 * u, 13.5, { weight: 800, color: err.ink, base: 'middle' });
    });
  });
  // GPT-4: el ajuste posterior reduce la calibración
  const a3 = fr(S, 'hidden', 0.5, 0.7);
  d.withAlpha(a3, () => {
    const y = portrait ? right.y + right.h + 14 * u : left.y + left.h + 18 * u, w = portrait ? r.w : r.w, h = 70 * u;
    if (y + h > r.y + r.h + 4 * u) return;
    d.rect(r.x, y, w, h, { fill: p.surface, stroke: p.line, lw: 1.2, r: 3 });
    fitText(S, S.l('Informe técnico de GPT-4 (OpenAI, 2023)', 'GPT-4 technical report (OpenAI, 2023)'), r.x + 12 * u, y + 9 * u, w - 24 * u, 13, { weight: 800, color: p.ink, base: 'top' });
    fitText(S, S.l('preentrenado: confianza ≈ acierto  →  tras el ajuste: la calibración se reduce', 'pretrained: confidence ≈ accuracy  →  after tuning: calibration is reduced'), r.x + 12 * u, y + 34 * u, w - 24 * u, 13, { weight: 600, color: p.ink2, base: 'top' });
  });
  source(S, S.l('Pythia-1.4B · la maqueta del chat es ilustrativa; la respuesta y su probabilidad son medidas', 'Pythia-1.4B · the chat mockup is illustrative; the answer and its probability are measured'), a1);
}

// ───────────────────────── scale: más parámetros, mismas preguntas ─────────────────────────
const SIZE_LABEL = (name: string) => name.replace('pythia-', '').toUpperCase().replace('M', ' M').replace('B', ' B');
export function drawScale(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, m = R.main;
  const rows = SCALE.map((s) => ({ ...s, label: SIZE_LABEL(s.name) }));
  const pl = new Plot(S, m, { xr: [0, rows.length], yr: [0, 1], pad: { l: 46, r: 8, t: 26, b: 44 } });
  const dat = tone(S, 'dat'), err = tone(S, 'err');
  const g = S.reveal('scale', 0.1, 0.5);
  axes(S, pl, { xTicks: [], yTicks: [0, 0.25, 0.5, 0.75, 1], yFmt: (v) => pct(S, v), xFmt: () => '', grid: true, a: g, yLabel: S.l('aciertos en las 424 preguntas', 'right answers on the 424 questions') });
  const bw = pl.r.w / rows.length;
  rows.forEach((s, i) => {
    const k = clamp(fr(S, 'scale', 0.08, 0.5) * (rows.length + 2) - i), h = pl.r.h * s.acc * smooth(k), x = pl.r.x + i * bw + bw * 0.14, w = bw * 0.72, y = pl.r.y + pl.r.h - h;
    if (k <= 0) return;
    d.withAlpha(clamp(k * 2), () => {
      d.rect(x, y, w, h, { fill: alpha(dat.c, 0.6), stroke: dat.c, lw: 1.4 });
      fitText(S, pct(S, s.acc), x + w / 2, y - 3 * u, bw + 4 * u, 12, { weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'bottom' });
      fitText(S, s.label, x + w / 2, pl.r.y + pl.r.h + 6 * u, bw, 12, { weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    });
  });
  d.withAlpha(g, () => fitText(S, S.l('parámetros', 'parameters'), pl.r.x + pl.r.w, pl.r.y + pl.r.h + 26 * u, 120 * u, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' }));
  // el techo: ningún tamaño llega a cien
  const ceil = fr(S, 'scale', 0.55, 0.8);
  d.withAlpha(ceil, () => {
    d.line(pl.r.x, pl.Y(1), pl.r.x + pl.r.w, pl.Y(1), err.c, 1.8, [6, 4]);
    tagText(S, S.l('100 %: ninguno llega', '100%: none reaches it'), pl.r.x + 6 * u, pl.Y(1) + 12 * u, { t: 'err', align: 'left', size: 13 });
  });
  // lateral: los errores seguros no desaparecen
  const a = R.aside, last = rows[rows.length - 1];
  const cw = S.portrait ? a.w / 2 : a.w;
  const st = fr(S, 'scale', 0.62, 0.8);
  stat(S, a.x, a.y + 2 * u, S.l(`errores con 50 % o más (${rows[1].label})`, `errors at 50% or more (${rows[1].label})`), String(rows[1].confWrong), 'w', { size: 24, w: cw - 8 * u, a: st });
  stat(S, a.x + (S.portrait ? cw : 0), a.y + (S.portrait ? 2 * u : 66 * u), S.l(`errores con 50 % o más (${last.label})`, `errors at 50% or more (${last.label})`), String(last.confWrong), 'err', { size: 24, w: cw - 8 * u, a: st });
  source(S, S.l('Siete tamaños de Pythia · mismas preguntas y mismo prompt · decodificación voraz', 'Seven Pythia sizes · same questions and prompt · greedy decoding'), g);
  void num;
}
