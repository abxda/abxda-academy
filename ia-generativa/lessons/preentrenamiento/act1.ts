// Acto 1 · el objetivo: el texto trae su propia respuesta. Aprendizaje autosupervisado y preentrenamiento.
import { alpha, box, clamp, hash, lerp, link, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, area, count, fitText, isCompact, layoutChips, nf, para, pieceLabel, provenance, smooth, sig } from './ui';
import { PYTHIA } from './pythia-data';

const SENT = PYTHIA.passage_pieces.slice(0, 19);        // primera frase del texto de prueba, ya partida en piezas
const TARGET = 17;                                       // « five»
const G0 = PYTHIA.guess.steps['0'], G1 = PYTHIA.guess.steps['143000'];

function chips(S: Frame, rc: Rect, o: { show?: (i: number) => number; hidden?: number[]; hot?: number[]; tint?: (i: number) => string | null; size?: number; h?: number }) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat');
  const { pos, h } = layoutChips(S, SENT, rc.x, rc.y, rc.w, { size: o.size ?? 14, h: o.h ?? 26, rowGap: 10 });
  SENT.forEach((t, i) => {
    const c = pos[i], a = o.show ? o.show(i) : 1;
    if (a <= 0.01) return;
    const hidden = o.hidden?.includes(i), hot = o.hot?.includes(i);
    d.withAlpha(a, () => {
      if (hidden) {
        d.rect(c.x, c.y, Math.max(c.w, 44 * u), c.h, { fill: alpha(tone(S, 'err').c, 0.1), stroke: tone(S, 'err').c, lw: 1.8, r: 3, dash: [4, 3] });
        d.text('?', c.x + Math.max(c.w, 44 * u) / 2, c.y + c.h / 2, { size: FS(S, 16), weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'middle' });
      } else {
        const tint = o.tint?.(i);
        d.rect(c.x, c.y, c.w, c.h, { fill: tint ?? alpha(lt.c, hot ? 0.34 : 0.14), stroke: hot ? lt.c : alpha(lt.c, 0.75), lw: hot ? 2.2 : 1.2, r: 3 });
        d.text(pieceLabel(t), c.x + c.w / 2, c.y + c.h / 2, { size: FS(S, o.size ?? 14), weight: 600, font: 'mono', color: lt.ink, align: 'center', base: 'middle' });
      }
    });
  });
  void p;
  return { pos, h };
}

// ── hook · una frase y, detrás, un muro de textos ──────────────────────────────────────────────────────────────
function drawHook(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, compact = isCompact(S);
  const a0 = S.reveal('hook', 0, 0.5);
  d.withAlpha(a0, () => d.text(S.l('un texto, partido en piezas (tokens)', 'a text, split into pieces (tokens)'), r.x, r.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top' }));
  const { h } = chips(S, { x: r.x, y: r.y + 20 * u, w: r.w, h: 100 }, { show: (i) => S.at('hook', 0.2 + i * 0.07, 0.7 + i * 0.07, 'out') });
  // muro de textos: cada tarjeta es un documento; el largo de las barras varía
  const top = r.y + 20 * u + h + (compact ? 12 : 26) * u, wall: Rect = { x: r.x, y: top, w: r.w, h: r.y + r.h - top - 22 * u };
  const cols = S.portrait ? 11 : 20, rows = Math.max(2, Math.min(S.portrait ? 6 : 5, Math.floor(wall.h / (34 * u))));
  const cw = (wall.w - 5 * u * (cols - 1)) / cols, ch = Math.min(30 * u, (wall.h - 5 * u * (rows - 1)) / rows);
  const dt = tone(S, 'dat');
  const aW = S.at('hook', 1.8, 5.2, 'lin');
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, vis = clamp(aW * (cols * rows + 12) - k), x = wall.x + i * (cw + 5 * u), y = wall.y + j * (ch + 5 * u);
    if (vis <= 0) continue;
    d.withAlpha(vis, () => {
      d.rect(x, y, cw, ch, { fill: p.surface, stroke: alpha(dt.c, 0.6), lw: 1, r: 1 });
      for (let l = 0; l < 3; l++) d.rect(x + 3 * u, y + 4 * u + l * (ch - 8 * u) / 3, (cw - 6 * u) * (0.35 + 0.65 * hash(k, l)), Math.max(1.5, (ch - 8 * u) / 7), { fill: alpha(dt.c, 0.5) });
    });
  }
  d.withAlpha(S.at('hook', 4.5, 5.5, 'out'), () => d.text(S.l('…y millones de textos más', '…and millions more texts'), wall.x + wall.w, wall.y + wall.h + 6 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'top' }));
}

// ── guess y grade · taparla y apostar; destaparla y medir ───────────────────────────────────────────────────
const pct = (S: Frame, v: number) => { const x = v * 100; return `${nf(S, x, x >= 10 ? 0 : x >= 1 ? 1 : x >= 0.1 ? 2 : 3)} %`; };

function drawPanel(S: Frame, rc: Rect, g: typeof G0, title: string, loss: number, a: number, truth: string) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat'), dt = tone(S, 'dat'), er = tone(S, 'err');
  const rowsN = g.top.length + 1, hdr = 20 * u, ft = 22 * u, rh = Math.min(19 * u, (rc.h - hdr - ft) / rowsN);
  d.withAlpha(a, () => {
    d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.2, r: 3 });
    d.text(title, rc.x + 8 * u, rc.y + 5 * u, { size: FS(S, 12.5), weight: 800, color: p.ink, base: 'top', w: rc.w - 16 * u });
    const lw = Math.min(80 * u, rc.w * 0.3), bw = rc.w - lw - 72 * u, scale = 0.3;
    const inTop = g.top.findIndex(([t]) => t === truth);
    const list = g.top.map(([t, v], i) => ({ t, v, hit: i === inTop }));
    if (inTop < 0) list.push({ t: truth, v: g.p_true, hit: true });
    list.forEach((it, i) => {
      const y = rc.y + hdr + 8 * u + i * rh;
      d.text(it.t.trim(), rc.x + 8 * u, y + rh / 2, { size: FS(S, 12.5), weight: it.hit ? 800 : 600, font: 'mono', color: it.hit ? tone(S, 'dat').ink : p.ink2, base: 'middle' });
      const w = Math.max(1.5, bw * clamp(it.v / scale));
      d.rect(rc.x + lw, y + rh * 0.2, w, rh * 0.6, { fill: it.hit ? dt.c : alpha(lt.c, 0.6) });
      d.text(pct(S, it.v), rc.x + lw + Math.min(w, bw) + 5 * u, y + rh / 2, { size: FS(S, 12), weight: 700, font: 'mono', color: it.hit ? dt.ink : p.ink2, base: 'middle' });
      if (it.hit) d.text('✓', rc.x + rc.w - 10 * u, y + rh / 2, { size: FS(S, 13), weight: 800, color: dt.ink, align: 'right', base: 'middle' });
      if (inTop < 0 && i === list.length - 1) d.text(S.l(`puesto ${nf(S, g.rank_true, 0)}`, `rank ${nf(S, g.rank_true, 0)}`), rc.x + rc.w - 8 * u, y + rh / 2, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'middle' });
    });
    d.text(`${S.l('pérdida = −ln(p) =', 'loss = −ln(p) =')} ${nf(S, loss, 1)}`, rc.x + 8 * u, rc.y + rc.h - 6 * u, { size: FS(S, 12.5), weight: 800, font: 'mono', color: er.ink, base: 'bottom' });
  });
}

function drawGuess(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat'), compact = isCompact(S);
  const grade = S.on('grade');
  const revealT = S.at('grade', 0.2, 0.9, 'out');
  const top = r.y;
  const { pos, h } = chips(S, { x: r.x, y: top, w: r.w, h: 100 }, {
    hidden: grade ? [] : [TARGET], hot: grade ? [TARGET] : [], show: (i) => (i > TARGET && !grade ? 0.28 : 1),
    tint: (i) => (grade && i === TARGET ? alpha(dt.c, 0.32 * revealT + 0.14 * (1 - revealT)) : null),
  });
  // corchete del contexto
  const rowsOf = (i: number) => pos[i].row, c0 = pos[0], cT = pos[TARGET];
  const aG = S.reveal('guess', 0.4, 0.6);
  if (!grade) d.withAlpha(aG, () => {
    const y = c0.y + (rowsOf(TARGET) + 1) * (c0.h + 10 * u) - 6 * u;
    d.line(r.x, y, r.x + (rowsOf(TARGET) > 0 ? r.w : cT.x - 4 * u), y, lt.c, 2);
    d.text(S.l('contexto: todo lo anterior', 'context: everything before'), r.x, y + 3 * u, { size: FS(S, 12.5), weight: 700, color: lt.ink, base: 'top' });
    d.arrow(cT.x + 12 * u, y + 5 * u, cT.x + 12 * u, cT.y + cT.h + 5 * u, er.c, 2, 8);
    d.text(S.l('el modelo apuesta la siguiente pieza', 'the model bets on the next piece'), r.x + r.w, y + 3 * u, { size: FS(S, 12.5), weight: 700, color: er.ink, align: 'right', base: 'top' });
  });
  if (grade) {
    const y0 = top + h + (compact ? 10 : 22) * u, H = r.y + r.h - y0 - 20 * u, gap = 12 * u;
    const vertical = S.portrait;
    const A: Rect = vertical ? { x: r.x, y: y0, w: r.w, h: (H - gap) / 2 } : { x: r.x, y: y0, w: (r.w - gap) / 2, h: H };
    const B: Rect = vertical ? { x: r.x, y: y0 + A.h + gap, w: r.w, h: H - A.h - gap } : { x: r.x + A.w + gap, y: y0, w: r.w - A.w - gap, h: H };
    const truth = PYTHIA.guess.truth.trim();
    drawPanel(S, A, G0, S.l('Sin entrenar (pesos al azar)', 'Untrained (random weights)'), -Math.log(G0.p_true), S.reveal('grade', 1.0, 0.6), PYTHIA.guess.truth.trim() === truth ? 'five'.padStart(0) : truth);
    drawPanel(S, B, G1, S.l('Tras leer 300 mil M de tokens', 'After reading 300B tokens'), -Math.log(G1.p_true), S.reveal('grade', 3.2, 0.6), 'five');
  }
  provenance(S, S.l('medición real · Pythia-1.4B · texto de prueba escrito para la lección', 'real measurement · Pythia-1.4B · test text written for the lesson'), { a: S.reveal('guess', 0, 0.5) });
  void p; void fitText; void lerp; void para; void smooth;
}

// ── free · los pares (contexto → siguiente) salen del propio texto ─────────────────────────────────────────────
function drawFree(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat'), dt = tone(S, 'dat'), compact = isCompact(S);
  const prog = S.at('free', 0.5, 5.5, 'lin') * 8, n = Math.floor(prog) + 1;     // cuántos pares se han formado
  const hot = Array.from({ length: Math.min(n, 18) }, (_, i) => i);
  const { pos, h } = chips(S, { x: r.x, y: r.y, w: r.w, h: 100 }, { size: 13, h: 24, hot: [Math.min(n, 18)], tint: (i) => (i === Math.min(n, 18) ? alpha(dt.c, 0.36) : null) });
  void hot; void pos;
  // lista de pares
  const y0 = r.y + h + (compact ? 8 : 18) * u, rows = Math.min(8, Math.max(3, Math.floor((r.y + r.h - y0 - 36 * u) / (24 * u))));
  const first = Math.max(0, n - rows);
  const rh = Math.min(26 * u, (r.y + r.h - y0 - 34 * u) / rows);
  for (let q = 0; q < rows; q++) {
    const j = first + q + 1; if (j > n || j > 18) continue;                   // j = índice de la pieza objetivo
    const ctx = SENT.slice(Math.max(0, j - 3), j), pre = j > 3 ? '…' : '';
    const y = y0 + q * rh, sz = FS(S, 13), cy = y + rh / 2;
    const a = q === rows - 1 || j < n ? 1 : 0.55;
    d.withAlpha(a, () => {
      const ctxStr = pre + ctx.map((t) => t.trim()).join(' ');
      const wMax = r.w * (S.portrait ? 0.56 : 0.5);
      let s = ctxStr; while (d.measure(s, { size: sz, weight: 600, font: 'mono' }) > wMax && s.length > 4) s = '…' + s.slice(2);
      const tw = d.measure(s, { size: sz, weight: 600, font: 'mono' }) + 12 * u;
      d.rect(r.x, y + 1, tw, rh - 3, { fill: alpha(lt.c, 0.12), stroke: alpha(lt.c, 0.7), lw: 1, r: 2 });
      d.text(s, r.x + 6 * u, cy, { size: sz, weight: 600, font: 'mono', color: lt.ink, base: 'middle' });
      const ax = r.x + tw + 8 * u;
      d.arrow(ax, cy, ax + 22 * u, cy, p.ink2, 1.8, 7);
      const tgt = pieceLabel(SENT[j]), tw2 = d.measure(tgt, { size: sz, weight: 800, font: 'mono' }) + 12 * u;
      d.rect(ax + 28 * u, y + 1, tw2, rh - 3, { fill: alpha(dt.c, 0.3), stroke: dt.c, lw: 1.6, r: 2 });
      d.text(tgt, ax + 28 * u + tw2 / 2, cy, { size: sz, weight: 800, font: 'mono', color: dt.ink, align: 'center', base: 'middle' });
    });
  }
  const aT = S.reveal('free', 1.0, 0.6);
  d.withAlpha(aT, () => {
    const ty = r.y + r.h - 6 * u;
    d.text(S.l('contexto', 'context'), r.x + 4 * u, y0 - 2 * u, { size: FS(S, 12), weight: 700, color: lt.ink, base: 'bottom' });
    d.text(S.l('«etiqueta» gratis: la pieza que sigue', 'free “label”: the piece that follows'), r.x + r.w, ty, { size: FS(S, 12.5), weight: 800, color: dt.ink, align: 'right', base: 'bottom' });
  });
  provenance(S, S.l('pares reales de la primera frase del texto de prueba (piezas del tokenizador de Pythia)', 'real pairs from the first sentence of the test text (Pythia tokenizer pieces)'), { a: S.reveal('free', 0, 0.5) });
}

// ── many · cuántos ejemplos salen del texto, y cuánto es leer 300 mil M de piezas ───────────────────────────────
function drawMany(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, dt = tone(S, 'dat'), w = tone(S, 'w'), compact = isCompact(S);
  const rows = [
    { es: 'una frase', en: 'one sentence', v: 18, t: 'lat' as const, lab: '18' },
    { es: 'un libro (unas 80 000 palabras)', en: 'a book (about 80,000 words)', v: 110000, t: 'dat' as const, lab: '≈ ' + count(S, 110000) },
    { es: 'el entrenamiento de GPT-3', en: 'GPT-3’s training', v: 3e11, t: 'w' as const, lab: count(S, 3e11) },
  ];
  const bh = Math.min(30 * u, (compact ? 22 : 30) * u), gapY = (compact ? 10 : 22) * u;
  const aT = S.reveal('many', 0, 0.5);
  d.withAlpha(aT, () => d.text(S.l('ejemplos de entrenamiento (escala logarítmica)', 'training examples (log scale)'), r.x, r.y, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top' }));
  rows.forEach((row, i) => {
    const y = r.y + 24 * u + i * (bh + 20 * u + gapY), a = S.reveal('many', 0.5 + i * 0.9, 0.6), k = S.at('many', 0.5 + i * 0.9, 1.8 + i * 0.9, 'out');
    const c = tone(S, row.t), bw = r.w * (Math.log10(row.v) / 12) * k;
    d.withAlpha(a, () => {
      d.text(S.l(row.es, row.en), r.x, y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top' });
      d.rect(r.x, y + 18 * u, Math.max(3, bw), bh, { fill: alpha(c.c, 0.7), stroke: c.c, lw: 1 });
      d.text(row.lab, r.x + Math.max(3, bw) + 8 * u, y + 18 * u + bh / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: c.ink, base: 'middle', halo: p.stage });
    });
  });
  // cuánto tardaría una persona
  const aY = S.reveal('many', 4.8, 0.8), yy = r.y + 24 * u + 3 * (bh + 20 * u + gapY) - 6 * u;
  d.withAlpha(aY, () => {
    const big = S.l('≈ 5 000 años', '≈ 5,000 years');
    d.text(big, r.x, yy, { size: FS(S, compact ? 22 : 30), weight: 800, color: w.ink, base: 'top' });
    const bw2 = d.measure(big, { size: FS(S, compact ? 22 : 30), weight: 800 });
    para(S, S.l('leyendo ocho horas al día, para leer esas piezas una vez', 'reading eight hours a day, to read those pieces once'), r.x + bw2 + 12 * u, yy + 4 * u, Math.max(120 * u, r.w - bw2 - 14 * u), { size: 12.5, weight: 700, color: p.ink2 });
  });
  provenance(S, S.l('orden de magnitud con supuestos: ¾ de palabra por token, 250 palabras por minuto · GPT-3: Brown et al., 2020', 'order of magnitude with assumptions: ¾ of a word per token, 250 words per minute · GPT-3: Brown et al., 2020'), { a: aT });
  void sig; void dt;
}

// ── define · corpus → transformer → modelo base ────────────────────────────────────────────────────────────────
function drawDefine(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, compact = isCompact(S);
  const vertical = S.portrait;
  const bw = vertical ? Math.min(r.w * 0.72, 260 * u) : Math.min(210 * u, (r.w - 120 * u) / 3), bh = (compact ? 54 : 70) * u;
  const rects: Rect[] = vertical
    ? [0, 1, 2].map((i) => ({ x: r.x + (r.w - bw) / 2, y: r.y + 20 * u + i * ((r.h - 40 * u - 3 * bh) / 2 + bh), w: bw, h: bh }))
    : [0, 1, 2].map((i) => ({ x: r.x + i * ((r.w - bw) / 2), y: r.y + (r.h - bh) / 2 - 8 * u, w: bw, h: bh }));
  const labels = [S.l('Corpus', 'Corpus'), S.l('Transformer', 'Transformer'), S.l('Modelo base', 'Base model')];
  const subs = [S.l('texto a escala web', 'web-scale text'), S.l('predice la siguiente pieza', 'predicts the next piece'), S.l('sabe continuar texto', 'knows how to continue text')];
  const tones = ['dat', 'w', 'lat'] as const;
  rects.forEach((rc, i) => { const a = S.reveal('define', 0.3 + i * 0.7, 0.6); if (a > 0) box(S, rc, labels[i], { tone: tones[i], sub: subs[i], a, size: 15 }); });
  [0, 1].forEach((i) => { const a = S.at('define', 0.8 + i * 0.7, 1.8 + i * 0.7); if (a > 0) link(S, rects[i], rects[i + 1], { tone: 'ink', progress: a }); });
  // rótulos de término
  const aP = S.reveal('define', 2.4, 0.7), aB = S.reveal('define', 3.6, 0.7);
  const wt = tone(S, 'w'), lt = tone(S, 'lat');
  d.withAlpha(aP, () => {
    const x = vertical ? rects[1].x - 6 * u : (rects[0].x + rects[1].x + rects[0].w) / 2 + (rects[0].w) * 0 ;
    if (vertical) d.text(S.l('PREENTRENAMIENTO', 'PRETRAINING'), r.x + r.w / 2, rects[0].y + bh + (rects[1].y - rects[0].y - bh) / 2, { size: FS(S, 12.5), weight: 800, color: wt.ink, align: 'center', base: 'middle', halo: p.stage, w: r.w });
    else {
      const ya = rects[0].y - 16 * u, xa = rects[0].x + rects[0].w / 2, xb = rects[1].x + rects[1].w / 2;
      d.line(xa, ya + 6 * u, xb, ya + 6 * u, wt.c, 2.4); d.line(xa, ya + 6 * u, xa, rects[0].y - 2 * u, wt.c, 2.4); d.line(xb, ya + 6 * u, xb, rects[1].y - 2 * u, wt.c, 2.4);
      d.text(S.l('PREENTRENAMIENTO', 'PRETRAINING'), (xa + xb) / 2, ya, { size: FS(S, 13), weight: 800, color: wt.ink, align: 'center', base: 'bottom', halo: p.stage });
    }
    void x;
  });
  d.withAlpha(aB, () => {
    const rc = rects[2];
    para(S, S.l('lo que sale: no obedece, completa', 'what comes out: it does not obey, it completes'), rc.x, rc.y + rc.h + 10 * u, rc.w, { size: 12.5, weight: 700, color: lt.ink, align: 'center' });
  });
}

export function drawAct1(S: Frame) {
  const r = area(S, 0, 22 * S.u);
  const t = (id: string) => S.at(id, 0, 0.8);
  const aHook = 1 - t('guess'), aGuess = t('guess') * (1 - t('free')), aFree = t('free') * (1 - t('many')), aMany = t('many') * (1 - t('define'));
  const aDef = t('define');
  if (aHook > 0.005) S.d.withAlpha(aHook, () => drawHook(S, r));
  if (aGuess > 0.005) S.d.withAlpha(aGuess, () => drawGuess(S, r));
  if (aFree > 0.005) S.d.withAlpha(aFree, () => drawFree(S, r));
  if (aMany > 0.005) S.d.withAlpha(aMany, () => drawMany(S, r));
  if (aDef > 0.005) S.d.withAlpha(aDef, () => drawDefine(S, r));
}
