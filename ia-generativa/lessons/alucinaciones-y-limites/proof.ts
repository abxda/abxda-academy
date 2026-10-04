// Acto 9 · evidencia y cierre. Cifras de fuente primaria (verificadas contra los documentos originales):
//  · Magesh et al. (2024), arXiv:2405.20362, versión de junio de 2024, figura 4: alucinaron Lexis+ AI 17 %, Ask Practical Law AI 17 %,
//    Westlaw AI-Assisted Research 33 %, GPT-4 (sin recuperación) 43 %; más de 200 consultas jurídicas.
//  · Moffatt v. Air Canada, 2024 BCCRT 149 (14 feb. 2024): el tribunal ordena pagar 812,02 dólares (650,88 de daños, 36,14 de intereses, 125 de tasas);
//    califica de «notable» el argumento de que el chatbot es una entidad aparte responsable de sus actos.
//  · Lin, Hilton y Evans (2021), TruthfulQA: 817 preguntas, 38 categorías; el mejor modelo, 58 % veraz; personas, 94 %.
import { alpha, clamp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, bubble, card, fitText, fr, mark, para, probBars, smooth, source, stamp, tagText, type BarRow } from './ui';

// ───────────────────────── evidence ─────────────────────────
export function drawEvidence(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const w = Math.min(r.w, 720 * u), x = r.x + (r.w - w) / 2;
  d.withAlpha(S.reveal('evidence', 0.1, 0.5), () => {
    fitText(S, S.l('Respuestas con alucinación, en consultas jurídicas', 'Hallucinated answers on legal research queries'), x, r.y + 4 * u, w, 18, { weight: 800, color: p.ink, base: 'top' });
    fitText(S, S.l('herramientas con recuperación de documentos', 'tools that retrieve documents'), x, r.y + 30 * u, w, 13.5, { weight: 600, color: p.ink2, base: 'top' });
  });
  const rows: BarRow[] = [
    { label: 'Lexis+ AI', value: 0.17, t: 'err', a: S.reveal('evidence', 0.5, 0.6), hot: true },
    { label: 'Ask Practical Law AI', value: 0.17, t: 'err', a: S.reveal('evidence', 0.9, 0.6), hot: true },
    { label: 'Westlaw AI-Assisted Research', value: 0.33, t: 'err', a: S.reveal('evidence', 1.3, 0.6), hot: true },
    { label: S.l('GPT-4 solo (referencia)', 'GPT-4 alone (reference)'), value: 0.43, t: 'mute', ghost: true, a: S.reveal('evidence', 2.2, 0.6) },
  ];
  const top = r.y + 64 * u, rh = Math.min(48 * u, (r.h - 64 * u - 36 * u) / rows.length);
  probBars(S, { x, y: top, w, h: rh * rows.length }, rows, { rowH: rh, labelW: Math.min(w * 0.42, 230 * u), max: 0.5, size: 14, fmt: (v) => `${Math.round(v * 100)}${S.lang === 'es' ? ' %' : '%'}` });
  d.withAlpha(S.reveal('evidence', 3.0, 0.6), () => {
    para(S, S.l('Ninguna llega a cero. Menos que un modelo solo, pero lejos de «libre de alucinaciones».', 'None reaches zero. Less than a model alone, but far from “hallucination-free.”'), x, top + rh * rows.length + 10 * u, w, { size: 14, weight: 700, color: p.ink2 });
  });
  source(S, S.l('Magesh et al. (2024) · más de 200 consultas jurídicas · versión de junio de 2024', 'Magesh et al. (2024) · 200+ legal queries · June 2024 version'), S.reveal('evidence', 0.4, 0.5));
}

// ───────────────────────── accountability ─────────────────────────
export function drawAccount(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const portrait = S.portrait || r.w < 600 * u, gap = 16 * u;
  const colW = portrait ? r.w : (r.w - gap) / 2, colH = portrait ? (r.h - gap) / 2 : r.h;
  const L: Rect = { x: r.x, y: r.y, w: colW, h: colH }, Rr: Rect = portrait ? { x: r.x, y: r.y + colH + gap, w: colW, h: colH } : { x: r.x + colW + gap, y: r.y, w: colW, h: colH };
  const a1 = S.reveal('accountability', 0.1, 0.5), a2 = S.reveal('accountability', 1.0, 0.5);
  d.withAlpha(a1, () => {
    fitText(S, S.l('Lo que dijo el chatbot', 'What the chatbot said'), L.x, L.y + 2 * u, L.w, 15, { weight: 800, color: p.ink, base: 'top' });
    const q = bubble(S, S.l('Si ya viajaste, puedes pedir la tarifa reducida por duelo dentro de los 90 días desde que se emitió tu boleto.', 'If you have already traveled, you can request the reduced bereavement fare within 90 days of the date your ticket was issued.'), L.x, L.y + 28 * u, L.w, 'bot', { size: 14, tag: 'Air Canada · chatbot (paráfrasis)' });
    para(S, S.l('La política publicada en su sitio decía lo contrario.', 'The policy published on its own site said the opposite.'), L.x, q.y + q.h + 10 * u, L.w, { size: 13.5, weight: 600, color: p.ink2 });
  });
  d.withAlpha(a2, () => {
    fitText(S, S.l('Lo que resolvió el tribunal', 'What the tribunal ruled'), Rr.x, Rr.y + 2 * u, Rr.w, 15, { weight: 800, color: p.ink, base: 'top' });
    stamp(S, S.l('PAGAR · CA$ 812,02', 'PAY · CA$812.02'), Rr.x + Rr.w * 0.5, Rr.y + 54 * u, 'err', { angle: -0.04, size: 17, pop: smooth(S.at('accountability', 1.2, 1.8)) });
    // argumento de la empresa, tachado
    const by = Rr.y + 98 * u, ap = fr(S, 'accountability', 0.58, 0.8), lw = Rr.w;
    const txt = S.l('«El chatbot es una entidad aparte, responsable de sus actos»', '“The chatbot is a separate entity, responsible for its own actions”');
    const lines = d.wrap(txt, lw - 24 * u, { size: FS(S, 14), weight: 600 });
    const hh = lines.length * FS(S, 14) * u * 1.3 + 36 * u;
    d.rect(Rr.x, by, lw, hh, { fill: alpha(p.mute, 0.06), stroke: p.mute, lw: 1.4, r: 3, dash: [5, 3] });
    d.text(S.l('Argumento de Air Canada', 'Air Canada’s argument'), Rr.x + 10 * u, by + 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    d.text(txt, Rr.x + 10 * u, by + 26 * u, { size: FS(S, 14), weight: 600, color: p.ink2, w: lw - 24 * u, base: 'top' });
    d.withAlpha(ap, () => {
      lines.forEach((ln, i) => { const y = by + 26 * u + (i + 0.55) * FS(S, 14) * u * 1.3; d.line(Rr.x + 10 * u, y, Rr.x + 10 * u + d.measure(ln, { size: FS(S, 14), weight: 600 }) * ap, y, tone(S, 'err').c, 2); });
      mark(S, Rr.x + lw - 18 * u, by + 18 * u, 'no', 8 * u);
      para(S, S.l('Rechazado: la empresa responde por toda la información de su sitio, sea una página o un chatbot.', 'Rejected: the company answers for all the information on its site, whether a page or a chatbot.'), Rr.x, by + hh + 10 * u, lw, { size: 13.5, weight: 700, color: tone(S, 'err').ink });
    });
  });
  source(S, S.l('Moffatt v. Air Canada, 2024 BCCRT 149 · tribunal de reclamos menores (Columbia Británica), 14 de febrero de 2024', 'Moffatt v. Air Canada, 2024 BCCRT 149 · small-claims tribunal (British Columbia), February 14, 2024'), a1);
}

// ───────────────────────── truthfulqa ─────────────────────────
export function drawTruthful(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const w = Math.min(r.w, 700 * u), x = r.x + (r.w - w) / 2;
  d.withAlpha(S.reveal('truthfulqa', 0.1, 0.5), () => {
    fitText(S, 'TruthfulQA', x, r.y + 4 * u, w, 22, { weight: 800, color: p.ink, base: 'top' });
    fitText(S, S.l('817 preguntas · 38 categorías · piden repetir falsedades populares', '817 questions · 38 categories · invite repeating popular falsehoods'), x, r.y + 34 * u, w, 13.5, { weight: 600, color: p.ink2, base: 'top' });
  });
  const rows: BarRow[] = [
    { label: S.l('Mejor modelo (2021)', 'Best model (2021)'), value: 0.58, t: 'lat', hot: true, a: S.reveal('truthfulqa', 0.7, 0.6) },
    { label: S.l('Personas', 'People'), value: 0.94, t: 'dat', hot: true, a: S.reveal('truthfulqa', 1.6, 0.6) },
  ];
  const top = r.y + 76 * u, rh = Math.min(56 * u, (r.h - 76 * u - 60 * u) / 2);
  d.withAlpha(S.reveal('truthfulqa', 0.5, 0.4), () => fitText(S, S.l('respuestas veraces', 'truthful answers'), x + Math.min(w * 0.34, 150 * u), top - 8 * u, w, 12.5, { weight: 700, color: p.mute, base: 'bottom' }));
  probBars(S, { x, y: top, w, h: rh * 2 }, rows, { rowH: rh, labelW: Math.min(w * 0.34, 150 * u), max: 1, size: 14, fmt: (v) => `${Math.round(v * 100)}${S.lang === 'es' ? ' %' : '%'}` });
  d.withAlpha(S.reveal('truthfulqa', 3.2, 0.6), () => {
    para(S, S.l('Hallazgo del estudio: los modelos más grandes fueron, en general, los menos veraces.', 'Finding of the study: the largest models were generally the least truthful.'), x, top + rh * 2 + 14 * u, w, { size: 14, weight: 700, color: p.ink2 });
  });
  source(S, S.l('Lin, Hilton y Evans (2021) · modelos de 2021: GPT-3, GPT-Neo/J, GPT-2 y uno basado en T5', 'Lin, Hilton, and Evans (2021) · 2021 models: GPT-3, GPT-Neo/J, GPT-2, and a T5-based one'), S.reveal('truthfulqa', 0.4, 0.5));
}

// ───────────────────────── recap + bridge ─────────────────────────
export function drawRecap(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const cards: { t: 'err' | 'lat' | 'dat'; title: string; sub: string; at: number }[] = [
    { t: 'err', title: S.l('Plausible, no verdadero', 'Plausible, not true'), sub: S.l('el objetivo de entrenamiento', 'the training objective'), at: 0.02 },
    { t: 'lat', title: S.l('La duda no se ve', 'The doubt is hidden'), sub: S.l('existe dentro, el texto no la muestra', 'it exists inside; the text hides it'), at: 0.34 },
    { t: 'dat', title: S.l('Verificar según el riesgo', 'Verify by risk'), sub: S.l('más riesgo, más revisión', 'more risk, more review'), at: 0.66 },
  ];
  const gap = 16 * u, n = cards.length, portrait = S.portrait || r.w < 560 * u;
  const cw = portrait ? r.w : (r.w - gap * (n - 1)) / n, ch = portrait ? (r.h - gap * (n - 1)) / n : clamp(r.h * 0.5, 130 * u, 200 * u), y0 = portrait ? r.y : r.y + (r.h - ch) / 2;
  cards.forEach((c, i) => {
    const a = fr(S, 'recap', c.at, c.at + 0.1), rc: Rect = portrait ? { x: r.x, y: y0 + i * (ch + gap), w: cw, h: ch } : { x: r.x + i * (cw + gap), y: y0, w: cw, h: ch }, col = tone(S, c.t);
    if (a <= 0) return;
    d.withAlpha(a, () => {
      card(S, rc, c.t, { hot: 0.35, fill: 0.05 });
      d.text(String(i + 1), rc.x + 10 * u, rc.y + 8 * u, { size: FS(S, 14), weight: 800, font: 'mono', color: col.ink, base: 'top' });
      d.text(c.title, rc.x + rc.w / 2, rc.y + rc.h * (portrait ? 0.36 : 0.36), { size: FS(S, portrait ? 18 : 21), weight: 800, color: col.ink, align: 'center', base: 'middle', w: rc.w - 20 * u });
      d.text(c.sub, rc.x + rc.w / 2, rc.y + rc.h * (portrait ? 0.7 : 0.72), { size: FS(S, 14), weight: 600, color: p.ink2, align: 'center', base: 'middle', w: rc.w - 24 * u });
    });
  });
  void tagText;
}

export function drawBridge(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cy - 18 * sc - 20 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('¿Sirve para tu caso?', 'Does it work for your case?'), cx, cy + 36 * u, { size: FS(S, 14), weight: 700, color: p.mute, align: 'center', w: S.W - 40 * u });
    d.text(S.l('Evaluar sistemas de IA', 'Evaluating AI systems'), cx, cy + 74 * u, { size: FS(S, 26), weight: 800, align: 'center', w: S.W - 40 * u });
  });
  void R; void mark; void source;
}
