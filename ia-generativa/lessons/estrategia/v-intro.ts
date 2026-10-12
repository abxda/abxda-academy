// Vistas 1 y 2: la pregunta de quien dirige (hook) y la lista de casos de uso de la tienda, que se arma columna por
// columna: qué es un caso de uso (use-case), cuántas veces pasa (freq), cuánto vale cada vez (value-each), el valor en
// juego = frecuencia × minutos (value-year) y el riesgo de la lección 35 (risk).
// ILUSTRATIVO (rotulado al pie): la tienda, sus cinco casos y todas sus cifras (model.ts).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { CASES, hoursOf, type Risk, type UseCase } from './model';
import { FS, areaH, card, chip, chipH, chipW, fitText, fr, glyph, header, para, paraH, tight, win, type GlyphKind } from './ui';

export const CASE_GLYPH: Record<string, GlyphKind> = { garantia: 'chat', diagnostico: 'wrench', catalogo: 'book', redes: 'phone', curriculos: 'user' };
export const RISK_TONE: Record<Risk, Tone> = { low: 'dat', mid: 'w', high: 'err' };
export const riskLabel = (S: Frame, r: Risk) => (r === 'low' ? S.l('bajo', 'low') : r === 'mid' ? S.l('medio', 'medium') : S.l('alto', 'high'));

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · De las piezas a la decisión
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  header(S, 0, S.l('De las piezas a la decisión', 'From the pieces to the decision'), fr(S, 'hook', 0, 0.08));
  const items: { t: string; s: string; g: GlyphKind; tone: Tone; f: number }[] = [
    { t: S.l('Cómo aprende un modelo', 'How a model learns'), s: S.l('lecciones 1 a 23', 'lessons 1 to 23'), g: 'chip', tone: 'sig', f: 0.14 },
    { t: S.l('Cuánto cuesta usarlo', 'What it costs to use'), s: S.l('lecciones 24 a 26', 'lessons 24 to 26'), g: 'coin', tone: 'dat', f: 0.26 },
    { t: S.l('Cómo se evalúa', 'How it is evaluated'), s: S.l('lección 34', 'lesson 34'), g: 'check', tone: 'w', f: 0.36 },
    { t: S.l('Qué puede salir mal', 'What can go wrong'), s: S.l('lección 35', 'lesson 35'), g: 'warn', tone: 'err', f: 0.46 },
  ];
  const cols = !port && A.w / 4 >= 150 * u ? 4 : 2, rows = 4 / cols;
  const cw = (A.w - (cols - 1) * gap) / cols, ch = Math.min(84 * u, (A.h * 0.5 - (rows - 1) * gap) / rows);
  const q = S.l('¿Dónde conviene usarlo, y por dónde empezar?', 'Where is it worth using, and where do you start?');
  const qs = FS(S, tight(S) ? 16 : 19), qw = Math.min(A.w, 620 * u), qh = paraH(S, q, qw - 28 * u, qs, { weight: 800 }) + 24 * u;
  const total = rows * ch + (rows - 1) * gap + gap * 2.6 + qh;
  const y0 = A.y + Math.max(0, (A.h - total) / 2);
  items.forEach((it, i) => {
    const x = A.x + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), a = fr(S, 'hook', it.f, it.f + 0.1);
    if (a <= 0.003) return;
    const t = tone(S, it.tone);
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: ch }, { tone: it.tone, hot: 0.04 });
      const gs = Math.min(22 * u, ch * 0.32), pad = 10 * u;
      glyph(S, it.g, x + pad + gs / 2, y + ch / 2, gs, t.ink);
      const tx = x + pad * 2 + gs, tw = x + cw - pad - tx;
      const th = paraH(S, it.t, tw, FS(S, 14), { weight: 800, maxLines: 2, lh: 1.15 });
      const sh = FS(S, 12.5) * u * 1.25, ty = y + (ch - th - sh) / 2;
      para(S, it.t, tx, ty, tw, FS(S, 14), { weight: 800, color: t.ink, maxLines: 2, lh: 1.15 });
      fitText(S, it.s, tx, ty + th + 2 * u, tw, 12.5, { weight: 600, color: p.mute, base: 'top' });
    });
  });
  // las piezas convergen en la pregunta
  const gy = y0 + rows * ch + (rows - 1) * gap, qy = gy + gap * 2.6, qx = A.x + (A.w - qw) / 2;
  const ka = fr(S, 'hook', 0.55, 0.68);
  if (ka > 0.003) {
    for (let i = 0; i < cols; i++) {
      const cx = A.x + i * (cw + gap) + cw / 2;
      d.withAlpha(ka * 0.8, () => d.arrow(cx, gy + 4 * u, cx + (A.x + A.w / 2 - cx) * 0.35, qy - 6 * u, alpha(p.ink, 0.5), 1.5, 6));
    }
  }
  d.withAlpha(fr(S, 'hook', 0.62, 0.74), () => {
    card(S, { x: qx, y: qy, w: qw, h: qh }, { tone: 'ink', hot: 0.06, lw: 2 });
    para(S, q, qx + 14 * u, qy + 12 * u, qw - 28 * u, qs, { weight: 800, color: p.ink, align: 'center' });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · La lista de casos de uso, columna por columna
// ════════════════════════════════════════════════════════════════════════════════════════════════
interface TLay { A: Rect; port: boolean; head: number; rowH: number; y0: number; cols: { name: number; freq: number; min: number; hours: number; risk: number; end: number }; sz: number }
function tlay(S: Frame): TLay {
  const u = S.u, A = areaH(S), port = S.portrait;
  const sz = FS(S, tight(S) ? 13 : 14);
  if (port) {
    // dos renglones por caso: nombre y riesgo; frecuencia × minutos = horas, y la barra
    const rowH = Math.min((A.h - 6 * u) / 5, sz * u * 2 * 1.3 + 26 * u);
    const cols = { name: A.x, freq: 0, min: 0, hours: 0, risk: A.x + A.w, end: A.x + A.w };
    return { A, port, head: 0, rowH, y0: A.y + Math.max(0, (A.h - 5 * rowH) * 0.3), cols, sz };
  }
  const head = FS(S, 12.5) * u * 2.5 + 6 * u;
  const rowH = Math.min((A.h - head) / 5, 66 * u);
  const w = A.w, x = A.x;
  const cols = { name: x, freq: x + w * 0.33, min: x + w * 0.47, hours: x + w * 0.61, risk: x + w * 0.86, end: x + w };
  return { A, port, head, rowH, y0: A.y + head, cols, sz };
}

/** Texto de la frecuencia, los minutos y las horas de un caso. */
const fq = (S: Frame, c: UseCase) => S.l(`${S.n(c.freq, 0)} al mes`, `${S.n(c.freq, 0)} a month`);
const mn = (S: Frame, c: UseCase) => `× ${S.n(c.min, 0)} min`;
const hr = (S: Frame, c: UseCase) => `= ${S.n(hoursOf(c), 0)} h`;

export function drawList(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = tlay(S), A = L.A, port = L.port;
  header(S, 1, undefined, fr(S, 'ideas', 0, 0.1));
  const ucA = win(S, 'use-case', 'freq');                     // la ficha «caso de uso»
  const colA = (seg: string, f = 0.15) => fr(S, seg, f, f + 0.1);
  const vals = { freq: (i: number) => fr(S, 'freq', 0.42 + i * 0.09, 0.5 + i * 0.09), min: (i: number) => fr(S, 'value-each', 0.42 + i * 0.09, 0.5 + i * 0.09), bar: (i: number) => fr(S, 'value-year', 0.26 + i * 0.07, 0.42 + i * 0.07, 'io') };
  const riskF: Record<string, number> = { curriculos: 0.32, diagnostico: 0.45, garantia: 0.8, catalogo: 0.9, redes: 0.9 };
  const maxH = 200;

  // títulos de las columnas (escritorio y tableta)
  if (!port) {
    const ty = A.y + 2 * u, w = (k: number) => k - 10 * u;
    const titles: [number, number, string, string, number][] = [
      [L.cols.freq, L.cols.min, S.l('veces al mes', 'times a month'), '', colA('freq')],
      [L.cols.min, L.cols.hours, S.l('min ahorrados', 'min saved'), S.l('cada vez', 'each time'), colA('value-each')],
      [L.cols.hours, L.cols.risk, S.l('valor en juego', 'value at stake'), S.l('horas al mes', 'hours a month'), colA('value-year')],
      [L.cols.risk, L.cols.end, S.l('riesgo', 'risk'), S.l('(lección 35)', '(lesson 35)'), colA('risk')],
    ];
    titles.forEach(([x0, x1, t1, t2, a]) => {
      if (a <= 0.003) return;
      d.withAlpha(a, () => {
        const lines = t2 ? [t1, t2] : S.d.wrap(t1, w(x1 - x0), { size: FS(S, 12.5), weight: 800 }).slice(0, 2);
        lines.forEach((ln, j) => fitText(S, ln, x0, ty + j * FS(S, 12.5) * u * 1.2, w(x1 - x0), 12.5, { weight: j === 0 ? 800 : 600, color: j === 0 ? p.ink2 : p.mute, base: 'top' }));
      });
    });
    d.withAlpha(fr(S, 'freq', 0.1, 0.2) * 0.6, () => d.line(A.x, L.y0 - 3 * u, A.x + A.w, L.y0 - 3 * u, p.line, 1));
  }

  CASES.forEach((c, i) => {
    const ra = fr(S, 'ideas', [0.42, 0.56, 0.69, 0.79, 0.89][i], [0.5, 0.64, 0.77, 0.87, 0.97][i]);
    if (ra <= 0.003) return;
    const y = L.y0 + i * L.rowH, hot = i === 0 ? ucA : 0, dim = i === 0 ? 1 : 1 - 0.75 * ucA;
    const gs = Math.min(18 * u, L.rowH * 0.42);
    d.withAlpha(ra * dim, () => {
      // fondo del renglón y nombre
      d.rect(A.x, y + 2 * u, A.w, L.rowH - 4 * u, { fill: alpha(p.ink, 0.035 + 0.09 * hot), stroke: hot > 0.4 ? tone(S, 'sig').c : undefined, lw: 1.6, r: 4 });
      const nameY = port ? y + 4 * u + (L.sz * u * 1.3) / 2 + 2 * u : y + L.rowH / 2;
      glyph(S, CASE_GLYPH[c.id], A.x + 8 * u + gs / 2, nameY, gs, p.ink2);
      const nx = A.x + 16 * u + gs, nameW = (port ? A.x + A.w - chipW(S, riskLabel(S, 'mid'), 12.5) - 10 * u : L.cols.freq - 8 * u) - nx;
      fitText(S, S.L(port ? c.short : c.name), nx, nameY, nameW, port ? 14 : 14.5, { weight: 750, color: p.ink, base: 'middle' });
      if (port) drawPortraitLine(S, c, i, nx, y + 4 * u + L.sz * u * 1.3 + 6 * u, A.x + A.w - 8 * u, vals, maxH, L);
      else drawLandscapeCells(S, c, i, y, L, vals, maxH);
      // riesgo
      const rk = fr(S, 'risk', riskF[c.id], riskF[c.id] + 0.08);
      if (rk > 0.003) {
        const lab = riskLabel(S, c.risk);
        if (port) chip(S, lab, A.x + A.w - 6 * u, nameY, RISK_TONE[c.risk], { size: 12.5, align: 'right', a: rk });
        else chip(S, lab, L.cols.risk, y + L.rowH / 2, RISK_TONE[c.risk], { size: 13, align: 'left', a: rk, maxW: L.cols.end - L.cols.risk });
      }
    });
  });

  // la ficha «caso de uso»
  if (ucA > 0.003) drawUseCaseCard(S, L, ucA);
}

function drawLandscapeCells(S: Frame, c: UseCase, i: number, y: number, L: TLay, vals: { freq: (i: number) => number; min: (i: number) => number; bar: (i: number) => number }, maxH: number) {
  const { d, pal: p } = S, u = S.u, cy = y + L.rowH / 2;
  fitText(S, S.n(c.freq, 0), L.cols.freq, cy, L.cols.min - L.cols.freq - 10 * u, 14.5, { weight: 700, color: tone(S, 'sig').ink, base: 'middle', a: vals.freq(i) });
  fitText(S, S.n(c.min, 0), L.cols.min, cy, L.cols.hours - L.cols.min - 10 * u, 14.5, { weight: 700, color: tone(S, 'w').ink, base: 'middle', a: vals.min(i) });
  // «cinco veces más»: los minutos de una duda y de un diagnóstico, resaltados
  const ring = fr(S, 'value-year', 0.62, 0.72) * (1 - fr(S, 'risk', 0, 0.15));
  if (ring > 0.003 && i < 2) d.withAlpha(ring, () => d.rect(L.cols.min - 6 * u, cy - FS(S, 14.5) * u * 0.8, Math.min(46 * u, L.cols.hours - L.cols.min - 4 * u), FS(S, 14.5) * u * 1.6, { stroke: tone(S, 'w').c, lw: 2, r: 4 }));
  // barra de horas al mes
  const k = vals.bar(i);
  if (k > 0.003) {
    const bx = L.cols.hours, labW = S.d.measure('200 h', { size: FS(S, 13), weight: 800 }) + 8 * u, bw = Math.max(4, L.cols.risk - bx - labW - 12 * u);
    const h = hoursOf(c), w = Math.max(2, (bw * h) / maxH) * k, bh = Math.min(16 * u, L.rowH * 0.36);
    d.rect(bx, cy - bh / 2, w, bh, { fill: tone(S, 'dat').c, r: 2 });
    fitText(S, `${S.n(h, 0)} h`, bx + w + 6 * u, cy, labW + 4 * u, 13, { weight: 800, color: tone(S, 'dat').ink, base: 'middle', a: clamp((k - 0.6) * 3) });
  }
  void p;
}

function drawPortraitLine(S: Frame, c: UseCase, i: number, x: number, y: number, xEnd: number, vals: { freq: (i: number) => number; min: (i: number) => number; bar: (i: number) => number }, maxH: number, L: TLay) {
  const { d } = S, u = S.u, size = 13, cy = y + (FS(S, size) * u) / 2;
  const wf = Math.max(...CASES.map((cc) => S.d.measure(fq(S, cc), { size: FS(S, size), weight: 700 }))) + 7 * u;
  const wm = Math.max(...CASES.map((cc) => S.d.measure(mn(S, cc), { size: FS(S, size), weight: 700 }))) + 7 * u;
  const wh = Math.max(...CASES.map((cc) => S.d.measure(hr(S, cc), { size: FS(S, size), weight: 800 }))) + 8 * u;
  fitText(S, fq(S, c), x, cy, wf, size, { weight: 700, color: tone(S, 'sig').ink, base: 'middle', a: vals.freq(i) });
  fitText(S, mn(S, c), x + wf, cy, wm, size, { weight: 700, color: tone(S, 'w').ink, base: 'middle', a: vals.min(i) });
  const k = vals.bar(i);
  if (k > 0.003) {
    fitText(S, hr(S, c), x + wf + wm, cy, wh, size, { weight: 800, color: tone(S, 'dat').ink, base: 'middle', a: clamp(k * 2) });
    const bx = x + wf + wm + wh, bw = xEnd - bx;
    if (bw > 24 * u) d.rect(bx, cy - 5 * u, Math.max(2, (bw * hoursOf(c)) / maxH) * k, 10 * u, { fill: tone(S, 'dat').c, r: 2 });
  }
  void L;
}

function drawUseCaseCard(S: Frame, L: TLay, a: number) {
  const { d, pal: p } = S, u = S.u, A = L.A, port = L.port, pad = 12 * u;
  // dónde: a la derecha de los nombres (horizontal) o sobre los renglones 2 a 5 (vertical)
  const r: Rect = port
    ? { x: A.x, y: L.y0 + L.rowH + 4 * u, w: A.w, h: A.y + A.h - (L.y0 + L.rowH + 4 * u) }
    : { x: L.cols.freq, y: L.y0, w: A.x + A.w - L.cols.freq, h: Math.min(A.y + A.h - L.y0, 5 * L.rowH) };
  const sz = FS(S, tight(S) ? 13 : 14);
  if (!port) {
    // la ficha mide lo que su contenido (título, cuatro piezas en dos columnas y el «no / sí»)
    const need = pad * 2 + FS(S, 16) * u * 1.35 + 2 * u + (r.w > 380 * u ? 2 : 4) * sz * u * 1.45 + 8 * u + 2 * (chipH(S, 13.5) + 6 * u);
    r.h = Math.min(r.h, need);
  }
  const parts: [string, number][] = [
    [S.l('una tarea concreta', 'a specific task'), 0.18],
    [S.l('quién la hace', 'who does it'), 0.28],
    [S.l('cuántas veces', 'how often'), 0.36],
    [S.l('qué cambiaría la IA', 'what AI would change'), 0.46],
  ];
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, r: 6 });
    card(S, r, { tone: 'sig', hot: 0.05, r: 6 });
    let y = r.y + pad;
    fitText(S, S.l('Caso de uso', 'Use case'), r.x + pad, y, r.w - 2 * pad, 16, { weight: 800, color: tone(S, 'sig').ink, base: 'top', a: fr(S, 'use-case', 0.04, 0.14) });
    y += FS(S, 16) * u * 1.35 + 2 * u;
    // las cuatro piezas: en dos columnas si caben
    const twoCol = r.w > 380 * u, colW = twoCol ? (r.w - 2 * pad) / 2 : r.w - 2 * pad, lh = sz * u * 1.45;
    parts.forEach(([t, f], k) => {
      const cx = r.x + pad + (twoCol ? (k % 2) * colW : 0), cy = y + (twoCol ? Math.floor(k / 2) : k) * lh, pa = fr(S, 'use-case', f, f + 0.08);
      glyph(S, 'check', cx + 7 * u, cy + sz * u * 0.62, 12 * u, tone(S, 'sig').ink, pa);
      fitText(S, t, cx + 20 * u, cy, colW - 24 * u, tight(S) ? 13 : 14, { weight: 650, color: p.ink, base: 'top', a: pa });
    });
    y += (twoCol ? 2 : 4) * lh + 8 * u;
    // no / sí
    const rest = r.y + r.h - pad - y, rowH = chipH(S, 13.5) + 6 * u;
    if (rest >= rowH * 2 - 6 * u) {
      const noA = fr(S, 'use-case', 0.6, 0.7), siA = fr(S, 'use-case', 0.78, 0.88);
      glyph(S, 'cross', r.x + pad + 8 * u, y + rowH / 2 - 3 * u, 13 * u, tone(S, 'err').ink, noA);
      chip(S, S.l('«Usar IA en ventas»', '“Use AI in sales”'), r.x + pad + 22 * u, y + rowH / 2 - 3 * u, 'err', { size: 13.5, align: 'left', a: noA, dash: true, maxW: r.w - 2 * pad - 22 * u });
      y += rowH;
      glyph(S, 'check', r.x + pad + 8 * u, y + rowH / 2 - 3 * u, 13 * u, tone(S, 'dat').ink, siA);
      chip(S, S.l('«Contestar dudas de garantía»', '“Answer warranty questions”'), r.x + pad + 22 * u, y + rowH / 2 - 3 * u, 'dat', { size: 13.5, align: 'left', a: siA, maxW: r.w - 2 * pad - 22 * u });
    }
  });
}

export const listSource = (S: Frame) => (S.on('ideas') ? S.l('La tienda, sus casos y sus cifras son ilustrativos', 'The shop, its cases, and its figures are illustrative') : '');
