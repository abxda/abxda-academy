// Actos 4 y 5 · derechos y privacidad; el modelo base no es un asistente; el corte de conocimiento; cierre y puente.
import { alpha, box, clamp, hash, link, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, area, chip, count, fitText, isCompact, nf, para, provenance, smooth } from './ui';
import { PYTHIA } from './pythia-data';

const rowsLast = PYTHIA.rows[PYTHIA.rows.length - 1];
const clean = (t: string) => t.replace(/\n+/g, (m) => '↵'.repeat(Math.min(2, m.length)) + ' ').replace(/\s+/g, ' ').trim();

// ═════════════════════════════════════════════════════════════════════════
// books · de qué está hecho The Pile (Gao et al., 2020, tabla 1: peso en el entrenamiento)
// ═════════════════════════════════════════════════════════════════════════
const PILE: { id: string; es: string; en: string; w: number; hot?: 'w' | 'err' }[] = [
  { id: 'cc', es: 'Web (Pile-CC)', en: 'Web (Pile-CC)', w: 18.11 },
  { id: 'pmc', es: 'Artículos médicos (PubMed Central)', en: 'Medical papers (PubMed Central)', w: 14.4 },
  { id: 'b3', es: 'Libros (Books3)', en: 'Books (Books3)', w: 12.07, hot: 'w' },
  { id: 'owt', es: 'Enlaces de Reddit (OpenWebText2)', en: 'Reddit links (OpenWebText2)', w: 10.01 },
  { id: 'arx', es: 'Artículos de ArXiv', en: 'ArXiv papers', w: 8.96 },
  { id: 'gh', es: 'Código (GitHub)', en: 'Code (GitHub)', w: 7.59 },
  { id: 'law', es: 'Sentencias (FreeLaw)', en: 'Court opinions (FreeLaw)', w: 6.12 },
  { id: 'se', es: 'Stack Exchange', en: 'Stack Exchange', w: 5.13 },
  { id: 'rest', es: 'Otras 14 fuentes', en: 'Other 14 sources', w: 17.61 },
  { id: 'enron', es: '↳ incluye correos de Enron', en: '↳ includes Enron emails', w: 0.14, hot: 'err' },
];

export function drawBooks(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const hdr = 22 * u, n = PILE.length, rh = Math.min(34 * u, (r.h - hdr) / n);
  const lw = Math.min(r.w * (S.portrait ? 0.44 : 0.34), 280 * u), vw = 56 * u, bw = r.w - lw - vw;
  const a0 = S.reveal('books', 0, 0.6), maxW = 20;
  d.withAlpha(a0, () => d.text(S.l('The Pile: cuánto pesa cada fuente en el entrenamiento', 'The Pile: how much each source weighs in training'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: r.w }));
  PILE.forEach((row, i) => {
    const a = S.reveal('books', 0.4 + i * 0.12, 0.5), k = S.at('books', 0.4 + i * 0.12, 1.4 + i * 0.12, 'out');
    const t = tone(S, row.hot ?? (row.id === 'rest' ? 'mute' : 'dat'));
    const y = r.y + hdr + i * rh, hot = row.hot ? 1 : 0;
    d.withAlpha(a, () => {
      if (hot) d.rect(r.x - 4 * u, y, r.w + 8 * u, rh, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 1.3, r: 2 });
      d.text(S.l(row.es, row.en), r.x, y + rh / 2, { size: FS(S, 12.5), weight: hot ? 800 : 600, color: hot ? t.ink : p.ink, base: 'middle', w: lw - 6 * u, lh: 1.05 });
      d.rect(r.x + lw, y + rh * 0.2, Math.max(1.5, bw * (row.w / maxW) * k), rh * 0.6, { fill: alpha(t.c, hot ? 0.9 : 0.62) });
      d.text(`${nf(S, row.w * k, 2)} %`, r.x + r.w, y + rh / 2, { size: FS(S, 12.5), weight: 800, font: 'mono', color: hot ? t.ink : p.ink2, align: 'right', base: 'middle' });
    });
  });
  const aN = S.reveal('books', 2.6, 0.7);
  if (!compact) d.withAlpha(aN, () => {
    const y = r.y + hdr + n * rh + 8 * u, t = tone(S, 'w');
    para(S, S.l('Books3: libros de una copia de la red de descargas Bibliotik, según los propios autores del Pile.', 'Books3: books from a copy of the Bibliotik download network, according to the Pile’s own authors.'), r.x, y, r.w, { size: 12.5, weight: 700, color: t.ink });
  });
  provenance(S, S.l('Gao et al., 2020 (The Pile), tabla 1: peso = porcentaje de bytes en el conjunto final', 'Gao et al., 2020 (The Pile), table 1: weight = share of bytes in the final dataset'), { a: a0 });
}

// ═════════════════════════════════════════════════════════════════════════
// ruling · Bartz v. Anthropic (orden del 23 de junio de 2025)
// ═════════════════════════════════════════════════════════════════════════
export function drawRuling(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const dt = tone(S, 'dat'), er = tone(S, 'err'), wt = tone(S, 'w');
  const vertical = S.portrait || r.w < 560 * u, gap = 12 * u;
  const hs = vertical ? [0.34, 0.34, 0.32] : [1, 1, 1];
  const card = (i: number): Rect => (vertical
    ? { x: r.x, y: r.y + hs.slice(0, i).reduce((a, b) => a + b * (r.h - 2 * gap), 0) + i * gap, w: r.w, h: hs[i] * (r.h - 2 * gap) }
    : { x: r.x + i * ((r.w - 2 * gap) / 3 + gap), y: r.y, w: (r.w - 2 * gap) / 3, h: r.h });
  const draw = (i: number, t: ReturnType<typeof tone>, mark: string, head: string, body: string, delay: number) => {
    const rc = card(i), a = S.reveal('ruling', delay, 0.6);
    d.withAlpha(a, () => {
      d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: t.c, lw: 2, r: 4 });
      d.text(mark, rc.x + 12 * u, rc.y + 10 * u, { size: FS(S, compact ? 22 : 28), weight: 800, color: t.ink, base: 'top' });
      const tx = rc.x + 12 * u + (vertical ? 36 : 0) * u, ty = vertical ? rc.y + 10 * u : rc.y + 50 * u;
      const hh = para(S, head, tx, ty, rc.x + rc.w - tx - 10 * u, { size: 14, weight: 800, color: t.ink }).h;
      para(S, body, tx, ty + hh + 4 * u, rc.x + rc.w - tx - 10 * u, { size: 12.5, weight: 600, color: p.ink2 });
    });
  };
  draw(0, dt, '✓', S.l('Entrenar con los libros', 'Training on the books'), S.l('El juez lo consideró «uso legítimo» (fair use): una transformación.', 'The judge found it “fair use”: a transformation.'), 0.2);
  draw(1, er, '✕', S.l('Guardar copias pirata', 'Keeping pirated copies'), S.l('Armar con ellas una biblioteca permanente no quedó justificado.', 'Building a permanent library from them was not justified.'), 1.4);
  draw(2, wt, '$', S.l('Acuerdo: 1 500 M de dólares', 'Settlement: $1.5 billion'), S.l('Unos quinientos mil libros, al menos tres mil dólares cada uno.', 'About five hundred thousand books, at least three thousand dollars each.'), 2.6);
  provenance(S, S.l('Bartz v. Anthropic (N. D. Cal.), orden del 23 de junio de 2025 · acuerdo: Authors Guild · otros casos siguen abiertos', 'Bartz v. Anthropic (N.D. Cal.), order of June 23, 2025 · settlement: Authors Guild · other cases remain open'), { a: S.reveal('ruling', 0, 0.5) });
  void count; void fitText; void chip; void smooth; void clamp;
}

// ═════════════════════════════════════════════════════════════════════════
// privacy · Carlini et al., 2021: 604 de 1 800 candidatos eran texto memorizado
// ═════════════════════════════════════════════════════════════════════════
export function drawPrivacy(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const er = tone(S, 'err'), wt = tone(S, 'w');
  const cols = S.portrait ? 45 : 60, rowsN = 1800 / cols, hdr = 24 * u, foot = (compact ? 40 : S.portrait ? 78 : 62) * u;
  const cell = Math.min((r.w) / cols, (r.h - hdr - foot) / rowsN), gw = cell * cols, gx = r.x + (r.w - gw) / 2, gy = r.y + hdr;
  // 604 celdas rellenas, repartidas con un orden fijo (hash)
  const order = Array.from({ length: 1800 }, (_, i) => i).sort((a, b) => hash(a, 7) - hash(b, 7));
  const rank = new Array<number>(1800); order.forEach((c, i) => (rank[c] = i));
  const a0 = S.reveal('privacy', 0, 0.6), fill = S.at('privacy', 1.2, 5.2, 'out') * 604;
  d.withAlpha(a0, () => {
    d.text(S.l('1 800 textos candidatos que sacó de GPT-2', '1,800 candidate texts extracted from GPT-2'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: r.w });
    for (let i = 0; i < 1800; i++) {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell, on = rank[i] < fill && rank[i] < 604;
      if (on) d.rect(x, y, cell - 0.8, cell - 0.8, { fill: er.c });
      else d.rect(x + 0.3, y + 0.3, cell - 1.4, cell - 1.4, { stroke: alpha(p.ink, 0.28), lw: 0.8 });
    }
  });
  const aT = S.reveal('privacy', 3.2, 0.7);
  d.withAlpha(aT, () => {
    const fy = r.y + r.h - foot + 8 * u;
    d.text('604', r.x, fy, { size: FS(S, compact ? 22 : 28), weight: 800, font: 'mono', color: er.ink, base: 'top' });
    const w604 = d.measure('604', { size: FS(S, compact ? 22 : 28), weight: 800, font: 'mono' });
    para(S, S.l('eran texto memorizado, palabra por palabra: nombres, teléfonos, correos, conversaciones y código', 'were memorized text, word for word: names, phone numbers, emails, conversations, and code'), r.x + w604 + 12 * u, fy + 2 * u, r.w - w604 - 12 * u, { size: 12.5, weight: 700, color: p.ink });
  });
  const aN = S.reveal('privacy', 5.2, 0.7);
  d.withAlpha(aN * (compact ? 0 : 1), () => para(S, S.l('Cada uno aparecía en un solo documento del entrenamiento.', 'Each one appeared in just one training document.'), r.x, r.y + r.h - 18 * u, r.w, { size: 12.5, weight: 700, color: wt.ink }));
  provenance(S, S.l('Carlini et al., 2021 · GPT-2 · cuadro lleno = memorizado (604); los datos personales del artículo se omiten', 'Carlini et al., 2021 · GPT-2 · filled square = memorized (604); the paper’s personal data is withheld'), { a: a0 });
}

// ═════════════════════════════════════════════════════════════════════════
// base · el modelo base completa documentos, no obedece
// ═════════════════════════════════════════════════════════════════════════
export const BASE_IDS = ['chat_capital', 'chat_poem', 'chat_nn', 'doc_capital'] as const;
const BASE_LABEL: Record<string, { es: string; en: string }> = { chat_capital: { es: 'Pregunta', en: 'Question' }, chat_poem: { es: 'Orden', en: 'Command' }, chat_nn: { es: 'Explicación', en: 'Explanation' }, doc_capital: { es: 'Formato Q/A', en: 'Q/A format' } };
export const baseChoices = BASE_IDS.map((v) => ({ value: v, label: BASE_LABEL[v] }));

export function updateBase(S: Frame): boolean {
  if (!S.between('try-base', 'cutoff')) return false;
  const seen: Set<string> = (S.st.seen ??= new Set<string>());
  seen.add(S.p.base ?? 'chat_capital');
  return seen.size >= 3;
}

export function drawBase(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const id: string = S.between('try-base', 'cutoff') ? (S.p.base ?? 'chat_capital') : 'chat_capital';
  const prompt = PYTHIA.base_prompts[id], out = rowsLast.final?.[id] ?? '';
  const a0 = S.reveal('base', 0, 0.6);
  const sz = FS(S, 13.5), tw = r.w - 28 * u;
  d.withAlpha(a0, () => {
    d.text(S.l('Modelo base: Pythia-1.4B, sin ajuste posterior', 'Base model: Pythia-1.4B, with no further tuning'), r.x, r.y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: r.w });
    const top = r.y + 26 * u, pH = (compact ? 54 : 70) * u;
    // lo que escribe la persona
    d.rect(r.x, top, r.w, pH, { fill: alpha(er.c, 0.08), stroke: er.c, lw: 1.6, r: 4 });
    d.text(S.l('Tú escribes', 'You write'), r.x + 10 * u, top + 6 * u, { size: FS(S, 12), weight: 700, color: er.ink, base: 'top' });
    para(S, clean(prompt).replace(/↵/g, ' ↵ '), r.x + 10 * u, top + 24 * u, r.w - 20 * u, { size: 14, weight: 800, color: p.ink, font: 'mono' });
    // lo que continúa el modelo
    const y2 = top + pH + 12 * u, oH = r.y + r.h - y2 - 4 * u;
    d.rect(r.x, y2, r.w, oH, { fill: p.surface, stroke: lt.c, lw: 1.6, r: 4 });
    d.rect(r.x, y2, 4 * u, oH, { fill: lt.c });
    d.text(S.l('El modelo continúa el texto', 'The model continues the text'), r.x + 14 * u, y2 + 6 * u, { size: FS(S, 12), weight: 700, color: lt.ink, base: 'top' });
    const lines = d.wrap(clean(out), tw, { size: sz, weight: 600, font: 'mono' }), lh = sz * u * 1.34, maxL = Math.max(2, Math.floor((oH - 30 * u) / lh));
    const k = S.between('try-base', 'cutoff') ? 1 : S.at('base', 0.8, 5.5, 'lin');
    let budget = Math.floor(k * out.length * 0.9) + 1;
    for (let li = 0; li < Math.min(lines.length, maxL); li++) {
      const ln = lines[li].slice(0, Math.max(0, budget)); budget -= lines[li].length + 1;
      if (ln) d.text(ln, r.x + 14 * u, y2 + 26 * u + li * lh, { size: sz, weight: 600, font: 'mono', color: p.ink, base: 'top' });
    }
    if (lines.length > maxL) d.text('…', r.x + r.w - 10 * u, y2 + 26 * u + (maxL - 1) * lh, { size: sz, weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'top' });
    void dt;
  });
  provenance(S, S.l('medición real · Pythia-1.4B · el modelo escribe sin fin, aquí cortado a 56 piezas · voraz (sin azar), por eso repite', 'real measurement · Pythia-1.4B · the model keeps writing, cut here at 56 pieces · greedy (no chance), which is why it repeats'), { a: a0 });
}

// ═════════════════════════════════════════════════════════════════════════
// cutoff · lo que el corpus no cubre, el modelo lo inventa con aplomo
// ═════════════════════════════════════════════════════════════════════════
export function drawCutoff(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const dt = tone(S, 'dat'), er = tone(S, 'err'), wt = tone(S, 'w'), lt = tone(S, 'lat');
  const Y0 = 2015.6, Y1 = 2024.6, X = (y: number) => r.x + 6 * u + (r.w - 12 * u) * ((y - Y0) / (Y1 - Y0));
  const bars = [
    { es: 'GPT-3: rastreos de 2016 a 2019', en: 'GPT-3: crawls from 2016 to 2019', a: 2016, b: 2020, t: dt },
    { es: 'The Pile (Pythia): publicado a fines de 2020', en: 'The Pile (Pythia): published late 2020', a: 2016, b: 2021, t: lt },
    { es: 'Llama 3.1: datos hasta fines de 2023', en: 'Llama 3.1: data up to late 2023', a: 2016, b: 2024, t: wt },
  ];
  const bh = (compact ? 12 : 16) * u, rowH = (compact ? 26 : 38) * u, top = r.y + 4 * u;
  const a0 = S.reveal('cutoff', 0, 0.6);
  d.withAlpha(a0, () => {
    bars.forEach((b, i) => {
      const y = top + i * rowH, k = S.at('cutoff', 0.3 + i * 0.5, 1.4 + i * 0.5, 'out');
      d.text(S.l(b.es, b.en), r.x, y, { size: FS(S, 12.5), weight: 700, color: b.t.ink, base: 'top', w: r.w });
      d.rect(X(b.a), y + 17 * u, (X(b.b) - X(b.a)) * k, bh, { fill: alpha(b.t.c, 0.55), stroke: b.t.c, lw: 1.2 });
      d.text('▶', X(b.a) + (X(b.b) - X(b.a)) * k + 4 * u, y + 17 * u + bh / 2, { size: FS(S, 12), color: b.t.ink, base: 'middle', a: k > 0.95 ? 1 : 0 });
    });
    // eje de años
    const ay = top + 3 * rowH + 6 * u;
    d.line(X(Y0), ay, X(Y1), ay, p.lineStrong, 1.5);
    [2016, 2018, 2020, 2022, 2024].forEach((y) => { d.line(X(y), ay, X(y), ay + 4 * u, p.lineStrong, 1.5); d.text(String(y), X(y), ay + 6 * u, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    // el acontecimiento posterior a Pythia
    const ex = X(2022.95), aE = S.reveal('cutoff', 2.4, 0.6);
    d.withAlpha(aE, () => {
      d.line(ex, top + 8 * u, ex, ay, er.c, 2.4, [4, 3]);
      const lab = S.l('Mundial de Catar', 'Qatar World Cup');
      chip(S, lab, Math.min(ex, r.x + r.w - d.measure(lab, { size: FS(S, 12.5), weight: 700 }) / 2 - 12 * u), ay + (compact ? 18 : 26) * u, { t: 'err', size: 12.5 });
    });
  });
  // lo que responde Pythia
  const y0 = top + 3 * rowH + (compact ? 34 : 52) * u, H = r.y + r.h - y0 - 2 * u;
  const aO = S.reveal('cutoff', 3.6, 0.7);
  d.withAlpha(aO, () => {
    d.rect(r.x, y0, r.w, H, { fill: p.surface, stroke: er.c, lw: 1.6, r: 4 });
    const pr = PYTHIA.prompts.wc22;
    d.text(S.l(`Pythia, ante «${pr}…»`, `Pythia, given “${pr}…”`), r.x + 10 * u, y0 + 6 * u, { size: FS(S, 12.5), weight: 800, color: er.ink, base: 'top', w: r.w - 20 * u });
    const picks = [64000, 100000, 143000].map((s) => PYTHIA.rows.find((x) => x.step === s)!);
    const rh = Math.min(26 * u, (H - 30 * u - (compact ? 0 : 22 * u)) / 3);
    picks.forEach((row, i) => {
      const y = y0 + 26 * u + i * rh, a = S.reveal('cutoff', 4.0 + i * 0.8, 0.5);
      d.withAlpha(a, () => {
        d.text(`${S.l('paso', 'step')} ${nf(S, row.step, 0)}`, r.x + 10 * u, y + rh / 2, { size: FS(S, 12), weight: 800, font: 'mono', color: p.mute, base: 'middle' });
        const tx = r.x + 10 * u + 92 * u;
        fitText(S, clean(row.gen.wc22).split('↵')[0].replace(/\.$/, '') + '…', tx, y + rh / 2, r.x + r.w - tx - 8 * u, 13, { weight: 600, font: 'mono', color: p.ink, base: 'middle' });
      });
    });
    const aR = S.reveal('cutoff', 6.8, 0.7);
    if (!compact) d.withAlpha(aR, () => d.text(S.l('Respuesta real: Argentina. Cada punto de control inventa algo distinto.', 'Actual answer: Argentina. Each checkpoint makes up something different.'), r.x + 10 * u, y0 + H - 6 * u, { size: FS(S, 12.5), weight: 800, color: dt.ink, base: 'bottom', w: r.w - 20 * u }));
  });
  provenance(S, S.l('medición real · Pythia-1.4B · GPT-3 (Brown et al., 2020) · Llama 3 (2024), §3.1 · The Pile (2020)', 'real measurement · Pythia-1.4B · GPT-3 (Brown et al., 2020) · Llama 3 (2024), §3.1 · The Pile (2020)'), { a: a0 });
}

// ═════════════════════════════════════════════════════════════════════════
// recap y bridge
// ═════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 4 * u), compact = isCompact(S);
  const items: { es: string; en: string; t: 'sig' | 'dat' | 'w' | 'lat' | 'err' }[] = [
    { es: 'Objetivo: predecir la siguiente pieza', en: 'Objective: predict the next piece', t: 'sig' },
    { es: 'Corpus: filtrar, limpiar, deduplicar', en: 'Corpus: filter, clean, deduplicate', t: 'dat' },
    { es: 'Aprende en capas: frecuente, gramática, hechos', en: 'Learns in layers: frequent, grammar, facts', t: 'w' },
    { es: 'Memoriza lo repetido; hereda derechos y datos', en: 'Memorizes the repeated; inherits rights and data', t: 'err' },
    { es: 'Resultado: un modelo base, no un asistente', en: 'Result: a base model, not an assistant', t: 'lat' },
  ];
  const n = items.length, gap = (compact ? 5 : 10) * u, bh = Math.min(54 * u, (r.h - gap * (n - 1)) / n), bw = Math.min(r.w, 620 * u), x0 = r.x + (r.w - bw) / 2;
  const y0 = r.y + Math.max(0, (r.h - (n * bh + (n - 1) * gap)) / 2);
  items.forEach((it, i) => {
    const a = S.reveal('recap', 0.3 + i * 0.5, 0.5), rc: Rect = { x: x0, y: y0 + i * (bh + gap), w: bw, h: bh };
    d.withAlpha(a, () => {
      const c = tone(S, it.t);
      d.rect(rc.x, rc.y, rc.w, rc.h, { fill: alpha(c.c, 0.1), stroke: c.c, lw: 1.6, r: 3 });
      d.text(String(i + 1), rc.x + 14 * u, rc.y + rc.h / 2, { size: FS(S, 18), weight: 800, font: 'mono', color: c.ink, align: 'center', base: 'middle' });
      fitText(S, S.l(it.es, it.en), rc.x + 32 * u, rc.y + rc.h / 2, rc.w - 42 * u, 14, { weight: 700, color: p.ink, base: 'middle' });
    });
  });
  void box; void link;
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, compact = isCompact(S);
  const sc = Math.max(4, Math.round((compact ? 4 : 6) * u));
  neu(S, cx - (24 * sc) / 2, cy - (compact ? 80 : 110) * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + (compact ? 6 : 26) * u, { size: FS(S, 13), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Leyes de escala y costos', 'Scaling laws and costs'), cx, cy + (compact ? 28 : 56) * u, { size: FS(S, compact ? 20 : 24), weight: 800, align: 'center' });
    para(S, S.l('¿Cuánto cuesta esto, y qué se gana al hacerlo más grande?', 'How much does this cost, and what do you gain by making it bigger?'), cx - Math.min(S.W - 40 * u, 420 * u) / 2, cy + (compact ? 52 : 92) * u, Math.min(S.W - 40 * u, 420 * u), { size: 14, weight: 700, color: p.ink2, align: 'center' });
  });
}
