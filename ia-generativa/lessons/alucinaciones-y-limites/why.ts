// Acto 3 · por qué ocurre: el objetivo premia lo plausible (diagrama), los datos raros no se aprenden (histograma ilustrativo)
// y lo escrito se vuelve contexto (continuación real de Pythia). Fuente de la cota: Kalai, Nachum, Vempala y Zhang (2025).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SNOW } from './real-data';
import { FS, card, fitText, mark, para, smooth, stamp, tagText } from './ui';

// ───────────────────────── objective: el bucle de entrenamiento y la pieza que falta ─────────────────────────
export function drawObjective(S: Frame, R: { main: Rect; aside: Rect; all: Rect }, a: number) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const labels = [S.l('Texto real', 'Real text'), S.l('Modelo', 'Model'), S.l('Predice la pieza que sigue', 'Predicts the next piece'), S.l('Compara con la real', 'Compares with the real one'), S.l('Error: se ajusta', 'Error: adjust')];
  const tones = ['ink', 'w', 'lat', 'dat', 'err'] as const;
  const n = labels.length, vertical = S.portrait || r.w < 560 * u;
  const bw = vertical ? Math.min(r.w * 0.8, 260 * u) : Math.min((r.w - 4 * 26 * u) / n, 150 * u);
  const bh = vertical ? Math.min(40 * u, (r.h * 0.62) / n) : 58 * u;
  const gap = vertical ? Math.max(8 * u, (r.h * 0.66 - n * bh) / (n - 1)) : (r.w - n * bw) / (n - 1);
  const x0 = vertical ? r.x + (r.w - bw) / 2 : r.x, y0 = vertical ? r.y + 2 * u : r.y + r.h * 0.18;
  const boxes: Rect[] = labels.map((_, i) => (vertical ? { x: x0, y: y0 + i * (bh + gap), w: bw, h: bh } : { x: x0 + i * (bw + gap), y: y0, w: bw, h: bh }));
  d.withAlpha(a, () => {
    boxes.forEach((b, i) => {
      const al = S.reveal('objective', 0.15 + i * 0.5, 0.5);
      if (al <= 0) return;
      d.withAlpha(al, () => {
        card(S, b, tones[i], { hot: 0.4 });
        fitText(S, labels[i], b.x + b.w / 2, b.y + b.h / 2, b.w - 12 * u, 14, { weight: 800, color: tone(S, tones[i]).ink, align: 'center', base: 'middle' });
      });
      if (i > 0) {
        const pr = S.at('objective', 0.5 + i * 0.5, 1.0 + i * 0.5);
        if (pr > 0) { const A = boxes[i - 1], B = b, t = tone(S, 'ink'); if (vertical) d.arrow(A.x + A.w / 2, A.y + A.h, A.x + A.w / 2, A.y + A.h + (B.y - A.y - A.h) * pr, t.c, 2, 8); else d.arrow(A.x + A.w, A.y + A.h / 2, A.x + A.w + (B.x - A.x - A.w) * pr, A.y + A.h / 2, t.c, 2, 8); }
      }
    });
    // la pieza que falta: «¿es verdad?», conectada con una línea rota
    const al = S.reveal('objective', 3.6, 0.6);
    if (al > 0) {
      const last = boxes[n - 1];
      const tb: Rect = vertical ? { x: last.x, y: last.y + last.h + Math.max(14 * u, gap), w: bw, h: bh } : { x: last.x - (bw + gap), y: y0 + bh + Math.min(70 * u, r.h * 0.26), w: bw * 1.25, h: bh };
      d.withAlpha(al, () => {
        d.rect(tb.x, tb.y, tb.w, tb.h, { stroke: tone(S, 'mute').c, lw: 1.6, r: 3, dash: [5, 4] });
        fitText(S, S.l('¿Es verdad?', 'Is it true?'), tb.x + tb.w / 2, tb.y + tb.h / 2, tb.w - 12 * u, 14, { weight: 800, color: p.mute, align: 'center', base: 'middle' });
        const sx = tb.x + tb.w / 2, ex = last.x + last.w / 2;
        if (vertical) { d.line(tb.x + tb.w / 2, tb.y, last.x + last.w / 2, last.y + last.h + 3, p.mute, 1.6, [4, 4]); mark(S, tb.x + tb.w / 2, tb.y - (tb.y - last.y - last.h) / 2, 'no', 8 * u); }
        else { d.line(sx, tb.y, ex, last.y + last.h + 3, p.mute, 1.6, [4, 4]); mark(S, (sx + ex) / 2, (tb.y + last.y + last.h) / 2, 'no', 8 * u); }
      });
      d.withAlpha(S.reveal('objective', 4.6, 0.6), () => {
        const ty = vertical ? tb.y + tb.h + 10 * u : tb.y + tb.h + 18 * u;
        para(S, S.l('Nada en el proceso comprueba la verdad: solo si la pieza coincide con el texto.', 'Nothing in the process checks truth: only whether the piece matches the text.'), vertical ? r.x : r.x + r.w * 0.1, ty, vertical ? r.w : r.w * 0.8, { size: 14, weight: 600, color: p.ink2, align: 'center' });
      });
    }
  });
}

// ───────────────────────── rare + bound: cuántas veces aparece cada dato ─────────────────────────
// Ilustrativo: la forma (muchos datos aparecen pocas veces) es la cola larga; el 20 % es el ejemplo de la narración, no una medición.
const FREQ = [{ es: '1 vez', en: '1 time', v: 0.2 }, { es: '2–5', en: '2–5', v: 0.28 }, { es: '6–50', en: '6–50', v: 0.3 }, { es: 'más de 50', en: 'over 50', v: 0.22 }];

export function drawRare(S: Frame, R: { main: Rect; aside: Rect; all: Rect }, a: number) {
  const { d, pal: p } = S, u = S.u, m = R.main;
  const lm = 36 * u, bm = 44 * u, tm = 28 * u;
  const plot: Rect = { x: m.x + lm, y: m.y + tm, w: m.w - lm - 6 * u, h: m.h - tm - bm };
  const err = tone(S, 'err'), lat = tone(S, 'lat');
  d.withAlpha(a, () => {
    d.withAlpha(S.reveal('rare', 0.1, 0.5), () => {
      d.text(S.l('qué fracción de los datos…', 'what share of the facts…'), m.x, m.y, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
      d.line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, p.lineStrong, 1.5);
      d.line(plot.x, plot.y, plot.x, plot.y + plot.h, p.lineStrong, 1.5);
      d.text(S.l('…aparece este número de veces en el entrenamiento', '…appears this many times in training'), plot.x + plot.w, plot.y + plot.h + 30 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, align: 'right', base: 'top' });
      [0, 0.1, 0.2, 0.3].forEach((v) => { const y = plot.y + plot.h - (v / 0.35) * plot.h; d.line(plot.x - 4 * u, y, plot.x, y, p.lineStrong, 1.5); d.text(`${Math.round(v * 100)} %`, plot.x - 7 * u, y, { size: FS(S, 11.5), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    });
    const bw = plot.w / FREQ.length;
    FREQ.forEach((f, i) => {
      const al = S.reveal('rare', 0.5 + i * 0.35, 0.55), h = (f.v / 0.35) * plot.h * smooth(al);
      const hot = i === 0 && S.on('bound'), x = plot.x + i * bw + bw * 0.14;
      d.withAlpha(clamp(al * 2), () => {
        d.rect(x, plot.y + plot.h - h, bw * 0.72, h, { fill: i === 0 ? alpha(err.c, hot ? 0.9 : 0.55) : alpha(lat.c, 0.5), stroke: i === 0 ? err.c : lat.c, lw: 1.4 });
        d.text(S.lang === 'es' ? f.es : f.en, x + bw * 0.36, plot.y + plot.h + 6 * u, { size: FS(S, 12), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
      });
    });
    // el contraste con el estilo: millones de veces
    d.withAlpha(S.reveal('rare', 2.3, 0.6), () => {
      const bx = plot.x + plot.w * 0.52, by = plot.y + 2 * u, bwid = plot.w * 0.46;
      d.rect(bx, by, bwid, 46 * u, { fill: alpha(tone(S, 'dat').c, 0.1), stroke: tone(S, 'dat').c, lw: 1.4, r: 3 });
      fitText(S, S.l('Estilo y gramática', 'Style and grammar'), bx + 10 * u, by + 8 * u, bwid - 20 * u, 14, { weight: 800, color: tone(S, 'dat').ink, base: 'top' });
      fitText(S, S.l('millones de veces: se aprenden', 'millions of times: they are learned'), bx + 10 * u, by + 27 * u, bwid - 20 * u, 12.5, { weight: 600, color: p.ink2, base: 'top' });
    });
    d.withAlpha(S.reveal('rare', 3.2, 0.6), () => fitText(S, S.l('ilustrativo', 'illustrative'), plot.x + plot.w, m.y, 120 * u, 12, { weight: 700, color: p.mute, align: 'right', base: 'top' }));
    // la cota: la primera barra es el piso de errores
    if (S.on('bound')) {
      const al = S.reveal('bound', 0.4, 0.7), x = plot.x + bw * 0.14, h = (0.2 / 0.35) * plot.h;
      d.withAlpha(al, () => {
        const yb = plot.y + plot.h - h;
        d.line(plot.x, yb, plot.x + plot.w, yb, err.c, 1.8, [6, 4]);
        const bx = plot.x + bw * 1.05, by = yb - 56 * u > plot.y + 50 * u ? yb - 54 * u : plot.y + plot.h * 0.52;
        d.rect(bx, by, Math.min(plot.w * 0.55, 300 * u), 44 * u, { fill: p.surface, stroke: err.c, lw: 1.6, r: 3 });
        fitText(S, S.l('≥ 20 % de errores esperados', '≥ 20% of errors expected'), bx + 10 * u, by + 8 * u, Math.min(plot.w * 0.55, 300 * u) - 20 * u, 14, { weight: 800, color: err.ink, base: 'top' });
        fitText(S, S.l('en esos datos (modelo base)', 'on those facts (base model)'), bx + 10 * u, by + 26 * u, Math.min(plot.w * 0.55, 300 * u) - 20 * u, 12.5, { weight: 600, color: p.ink2, base: 'top' });
        void x;
      });
    }
  });
  void stamp; void tagText;
}

// ───────────────────────── snowball: lo escrito se vuelve contexto ─────────────────────────
export function drawSnow(S: Frame, R: { main: Rect; aside: Rect; all: Rect }, a: number) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const premise = SNOW[0].prefix, cont = SNOW[0].cont.replace(/\n.*/s, '').trim();
  d.withAlpha(a, () => {
    const w = Math.min(r.w, 640 * u), x = r.x + (r.w - w) / 2;
    let y = r.y + 4 * u;
    d.withAlpha(S.reveal('snowball', 0, 0.5), () => {
      d.text(S.l('Texto que se le da a Pythia (en inglés)', 'Text given to Pythia'), x, y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    });
    y += 22 * u;
    // premisa con «Pablo Neruda» resaltado
    const pre1 = 'Pedro Páramo is a novel by ', hot = 'Pablo Neruda', pre2 = ', first published in';
    const size = w > 520 * u ? 17 : 15;
    const lineH = FS(S, size) * u * 1.4;
    d.withAlpha(S.reveal('snowball', 0.1, 0.5), () => {
      const f = { size: FS(S, size), weight: 600, font: 'mono' as const };
      const w1 = d.measure(pre1, f), w2 = d.measure(hot, f);
      const tot = d.measure(pre1 + hot + pre2, f);
      if (tot > w) { para(S, premise, x, y, w, { size, font: 'mono', weight: 600 }); }
      else {
        d.text(pre1, x, y, { ...f, color: p.ink, base: 'top' });
        d.rect(x + w1 - 3, y - 2 * u, w2 + 6, lineH * 0.95, { fill: alpha(tone(S, 'err').c, 0.16), stroke: tone(S, 'err').c, lw: 1.4, r: 2 });
        d.text(hot, x + w1, y, { ...f, weight: 800, color: tone(S, 'err').ink, base: 'top' });
        d.text(pre2, x + w1 + w2, y, { ...f, color: p.ink, base: 'top' });
      }
    });
    y += lineH * (d.measure(premise, { size: FS(S, size), weight: 600, font: 'mono' }) > w ? 2.2 : 1.1);
    // continuación escrita por el modelo, letra a letra
    const k = Math.floor(clamp((S.since('snowball') - 1.0) / 5.0) * cont.length);
    const shown = cont.slice(0, k);
    const lat = tone(S, 'lat');
    const hl = 'a collection of poems';
    const idx = cont.indexOf(hl);
    d.withAlpha(S.reveal('snowball', 1.0, 0.4), () => {
      d.text(S.l('Lo que escribe el modelo (voraz)', 'What the model writes (greedy)'), x, y, { size: FS(S, 12), weight: 700, color: lat.ink, base: 'top' });
    });
    y += 20 * u;
    const f = { size: FS(S, size), weight: 600, font: 'mono' as const };
    const lines = d.wrap(shown, w - 8 * u, f);
    const blockH = lines.length * lineH;
    d.rect(x - 6 * u, y - 4 * u, w + 12 * u, Math.max(lineH * 2.2, d.wrap(cont, w - 8 * u, f).length * lineH) + 10 * u, { fill: alpha(lat.c, 0.07), stroke: lat.c, lw: 1.3, r: 3 });
    // texto con la frase clave subrayada cuando ya apareció
    let yy = y, consumed = 0;
    for (const ln of lines) {
      const start = consumed, end = consumed + ln.length;
      d.text(ln, x, yy, { ...f, color: p.ink, base: 'top' });
      if (idx >= 0 && shown.length > idx + hl.length - 2) {
        const s = Math.max(idx, start), e = Math.min(idx + hl.length, end + 1);
        if (e > s) {
          const pre = d.measure(cont.slice(start, s).slice(0, s - start), f), len = d.measure(cont.slice(s, e), f);
          d.rect(x + pre - 2, yy - 1 * u, len + 4, lineH * 0.92, { fill: alpha(tone(S, 'err').c, 0.18), stroke: tone(S, 'err').c, lw: 1.3, r: 2 });
          d.text(cont.slice(s, e), x + pre, yy, { ...f, weight: 800, color: tone(S, 'err').ink, base: 'top' });
        }
      }
      consumed = end + 1; yy += lineH;
    }
    y += Math.max(lineH * 2.2, d.wrap(cont, w - 8 * u, f).length * lineH) + 14 * u;
    void blockH;
    d.withAlpha(S.reveal('snowball', 6.4, 0.6), () => {
      para(S, S.l('«Neruda» pesa en todo lo que sigue: el modelo describe el libro como poemas, no como la novela que es.', '“Neruda” weighs on everything that follows: the model describes the book as poems, not as the novel it is.'), x, y, w, { size: 14, weight: 600, color: p.ink2 });
    });
  });
}
