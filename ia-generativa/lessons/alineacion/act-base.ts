// Acto 1 · El modelo base no es un asistente: un documento que se completa, y la brecha entre «predecir texto» y «ayudar».
import { alpha, inset, neu, tokenRow, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SAMPLES } from './outputs-data';
import { FS, card, docLines, drawDoc, cursor, fitText, glyph, isCompact, para, paraH, tab } from './ui';

export const DEMO_Q = 1;   // la indicación de la narración (la 2.ª de las 4 fijadas de antemano); en el turno se ven las cuatro

export function drawBase(S: Frame) {
  const d = S.d, toWhy = S.at('why', 0, 0.9);
  if (1 - toWhy > 0.005) d.withAlpha(1 - toWhy, () => drawDemo(S));
  if (toWhy > 0.005) d.withAlpha(toWhy, () => drawWhy(S));
}

// ── el documento: la indicación y lo que el modelo base escribe a continuación ──
function drawDemo(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u);
  const sample = SAMPLES[DEMO_Q];
  const foot = 44 * u, size = FS(S, isCompact(S) ? 16 : 18), pad = 16 * u, lh = 1.32 * size * u;
  const avail = r.h - foot - 14 * u, maxLines = Math.max(3, Math.floor((avail - 2 * pad - 30 * u) / lh));
  const ls = docLines(S, sample.prompt, sample.base, sample.baseCut, r.w - 2 * pad, size, Math.min(maxLines, 9));
  const ph = Math.min(avail, ls.length * lh + 2 * pad + 44 * u);
  const panel: Rect = { x: r.x, y: r.y + 12 * u + (avail - ph) * 0.35, w: r.w, h: ph };
  const a = S.reveal('hook', 0, 0.6);
  d.withAlpha(a, () => {
    card(S, panel, { tone: 'lat', fill: alpha(tone(S, 'lat').c, 0.05) });
    tab(S, S.l('Modelo base · TinyLlama 1.1B', 'Base model · TinyLlama 1.1B'), panel.x + 12 * u, panel.y, { t: 'lat', align: 'left' });
  });
  const pCh = ls.filter((l) => l.kind === 'p').reduce((s, l) => s + l.text.length + 1, 0), cCh = ls.filter((l) => l.kind === 'c').reduce((s, l) => s + l.text.length + 1, 0);
  const chars = S.on('base-demo') ? pCh + S.at('base-demo', 0.4, 3.8, 'lin') * cCh : S.at('hook', 0.5, 1.9, 'lin') * pCh;
  d.withAlpha(a, () => {
    const [cx, cy] = drawDoc(S, ls, panel.x + pad, panel.y + 24 * u, size, chars);
    cursor(S, cx, cy, size, S.on('base-demo') ? 'lat' : 'ink');
  });
  // leyenda de colores (aparece con la demostración)
  const aL = S.reveal('base-demo', 0.4, 0.5);
  if (aL > 0) d.withAlpha(aL, () => {
    const y = panel.y + panel.h - 18 * u, ts = FS(S, 12);
    d.rect(panel.x + pad, y - 5 * u, 10 * u, 10 * u, { fill: p.ink });
    d.text(S.l('tu texto de partida', 'your starting text'), panel.x + pad + 16 * u, y, { size: ts, weight: 600, color: p.ink2, base: 'middle' });
    const x2 = panel.x + pad + 16 * u + d.measure(S.l('tu texto de partida', 'your starting text'), { size: ts, weight: 600 }) + 18 * u;
    d.rect(x2, y - 5 * u, 10 * u, 10 * u, { fill: tone(S, 'lat').c });
    d.text(S.l('lo que añade el modelo', 'what the model adds'), x2 + 16 * u, y, { size: ts, weight: 600, color: tone(S, 'lat').ink, base: 'middle' });
  });
  // pie: procedencia
  d.withAlpha(S.reveal('base-demo', 0.6, 0.5), () => para(S, S.l('Salida real de TinyLlama 1.1B (base), sin retoques. Modelo entrenado sobre todo en inglés.', 'Real output of TinyLlama 1.1B (base), unedited. A model trained mostly in English.'), r.x, panel.y + panel.h + 12 * u, r.w, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
}

// ── la brecha entre lo que optimizó y lo que queremos, y el puente: la alineación ──
export function drawWhy(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = inset(S.full(), 14 * u), port = S.portrait, cmp = isCompact(S);
  const bw = port ? r.w : Math.min(r.w * (cmp ? 0.4 : 0.36), 330 * u), bh = port ? r.h * 0.3 : Math.min(r.h * (cmp ? 0.7 : 0.5), 220 * u);
  const L: Rect = port ? { x: r.x, y: r.y + r.h * 0.02, w: bw, h: bh } : { x: r.x, y: r.y + (r.h - bh) * (cmp ? 0.25 : 0.34), w: bw, h: bh };
  const R: Rect = port ? { x: r.x, y: r.y + r.h * 0.6, w: bw, h: bh } : { x: r.x + r.w - bw, y: L.y, w: bw, h: bh };
  const lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const aL = S.reveal('why', 0.1, 0.6), aR = S.reveal('why', 1.2, 0.6);

  // caja izquierda: lo que optimizó
  d.withAlpha(aL, () => {
    card(S, L, { tone: 'lat', fill: alpha(lt.c, 0.07) });
    const x = L.x + 12 * u, w = L.w - 24 * u;
    fitText(S, S.l('Lo que optimizó', 'What it optimized'), x, L.y + 12 * u, w, 17, { weight: 800, color: lt.ink, base: 'top' });
    const hb = para(S, S.l('Predecir el siguiente token del texto de internet.', 'Predict the next token of internet text.'), x, L.y + 40 * u, w, FS(S, 16), { weight: 600, maxLines: 3 });
    const y2 = L.y + 40 * u + hb + 10 * u;
    if (y2 + 28 * u < L.y + L.h) tokenRow(S, x, y2, w, ['The', 'capital', 'of', 'France', 'is', '→ Paris'], { tone: 'lat', size: FS(S, 14), h: 26, gap: 5, active: [5] });
  });
  // caja derecha: lo que queremos
  d.withAlpha(aR, () => {
    card(S, R, { tone: 'dat', fill: alpha(dt.c, 0.07) });
    const x = R.x + 12 * u, w = R.w - 24 * u;
    fitText(S, S.l('Lo que queremos', 'What we want'), x, R.y + 12 * u, w, 17, { weight: 800, color: dt.ink, base: 'top' });
    const labels = [S.l('útil', 'helpful'), S.l('veraz', 'honest'), S.l('inofensivo', 'harmless')];
    const rowH = Math.min(34 * u, (R.h - 48 * u) / 3);
    labels.forEach((t, i) => {
      const y = R.y + 44 * u + i * rowH + rowH / 2;
      if (y + rowH / 2 > R.y + R.h) return;
      glyph(S, 'ok', x + 10 * u, y, 9 * u);
      d.text(t, x + 28 * u, y, { size: FS(S, 17), weight: 700, color: p.ink, base: 'middle' });
    });
  });

  // la brecha y el puente
  const gx1 = port ? L.x + L.w / 2 : L.x + L.w + 8 * u, gy1 = port ? L.y + L.h + 6 * u : L.y + L.h / 2;
  const gx2 = port ? R.x + R.w / 2 : R.x - 8 * u, gy2 = port ? R.y - 6 * u : R.y + R.h / 2;
  const kBridge = S.on('align') ? S.at('align', 0.2, 1.5, 'io') : 0, gapA = S.reveal('why', 1.8, 0.6) * (1 - kBridge);
  if (gapA > 0) d.withAlpha(gapA, () => {
    d.line(gx1, gy1, gx2, gy2, p.mute, 2, [6, 6]);
    const mx = (gx1 + gx2) / 2, my = (gy1 + gy2) / 2;
    d.rect(mx - 24 * u, my - 18 * u, 48 * u, 36 * u, { fill: p.stage });
    d.text('?', mx, my, { size: 28, weight: 800, color: p.ink2, align: 'center', base: 'middle', a: 0.55 + 0.45 * Math.abs(Math.sin(S.clock * 2.4)) });
    d.text(S.l('la brecha', 'the gap'), port ? mx + 40 * u : mx, port ? my : my + 30 * u, { size: FS(S, 13), weight: 700, color: p.mute, align: port ? 'left' : 'center', base: 'middle' });
  });
  if (kBridge > 0) {
    const ix = gx1 + (gx2 - gx1) * kBridge, iy = gy1 + (gy2 - gy1) * kBridge;
    d.arrow(gx1, gy1, ix, iy, p.ink, 4, kBridge > 0.97 ? 12 : 0.001);
    if (kBridge > 0.8) {
      const mx = (gx1 + gx2) / 2, my = (gy1 + gy2) / 2, a = (kBridge - 0.8) / 0.2;
      d.withAlpha(a, () => {
        const t = S.l('alineación', 'alignment');
        const tw = d.measure(t, { size: FS(S, 16), weight: 800 }) + 22 * u;
        d.rect(mx - tw / 2, my - 15 * u - (port ? 0 : 22 * u), tw, 30 * u, { fill: p.surface, stroke: p.ink, lw: 2, r: 3 });
        d.text(t, mx, my - (port ? 0 : 22 * u), { size: FS(S, 16), weight: 800, color: p.ink, align: 'center', base: 'middle' });
      });
    }
    // definición bajo el diagrama
    const y = port ? R.y + R.h + 10 * u : L.y + L.h + 16 * u;
    const cap = S.l('que el modelo haga lo que la persona pretende', 'so the model does what the person intends');
    const ch = paraH(S, cap, r.w, FS(S, 16), { weight: 700, maxLines: 2 });
    if (y + ch < r.y + r.h + 6 * u) d.withAlpha(S.reveal('align', 1.2, 0.6), () => para(S, cap, r.x, y, r.w, FS(S, 16), { weight: 700, align: 'center', maxLines: 2 }));
  }
  if (!port && !cmp) neu(S, r.x + r.w / 2 - 36 * u, r.y + r.h - 62 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: S.on('align') ? 'happy' : 'think', a: S.reveal('why', 1.4, 0.5) });
}
