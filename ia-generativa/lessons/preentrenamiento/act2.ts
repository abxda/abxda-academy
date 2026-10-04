// Acto 2 · el corpus: de qué se compone, la tubería de limpieza (mini-rastreo con funciones reales) y la deduplicación.
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, area, chip, count, fitText, hbar, nf, para, provenance, sig, smooth, tagText, isCompact } from './ui';
import { PAGES, T0, isGoodThreshold, jaccard, runPipeline, shingles, stageCounts, type Row } from './crawl';

const memo = new Map<number, Row[]>();
/** La tubería es una función pura del umbral: se memoriza para no recalcularla en cada fotograma. */
export const pipe = (thr: number): Row[] => { const k = Math.round(thr * 100); let r = memo.get(k); if (!r) { r = runPipeline(k / 100); memo.set(k, r); } return r; };

const THR_DEFAULT = 0.5;

// ═════════════════════════════════════════════════════════════════════════
// Mezcla de entrenamiento de GPT-3 (Brown et al., 2020, tabla 2.2)
// ═════════════════════════════════════════════════════════════════════════
const MIX: { id: string; es: string; en: string; tokens: number; weight: number; epochs: number }[] = [
  { id: 'cc', es: 'Common Crawl (filtrado)', en: 'Common Crawl (filtered)', tokens: 410e9, weight: 0.6, epochs: 0.44 },
  { id: 'wt2', es: 'WebText2', en: 'WebText2', tokens: 19e9, weight: 0.22, epochs: 2.9 },
  { id: 'b1', es: 'Libros 1', en: 'Books1', tokens: 12e9, weight: 0.08, epochs: 1.9 },
  { id: 'b2', es: 'Libros 2', en: 'Books2', tokens: 55e9, weight: 0.08, epochs: 0.43 },
  { id: 'wp', es: 'Wikipedia', en: 'Wikipedia', tokens: 3e9, weight: 0.03, epochs: 3.4 },
];

export function drawCorpus(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const dat = tone(S, 'dat');
  // barra apilada con el peso de cada fuente en el entrenamiento
  const barH = (compact ? 22 : 30) * u, y0 = r.y + (compact ? 4 : 14) * u;
  let x = r.x;
  const a0 = S.reveal('corpus', 0, 0.6);
  d.withAlpha(a0, () => d.text(S.l('Así se reparte lo que lee GPT-3 durante el entrenamiento', 'How GPT-3’s training reading is split'), r.x, y0 - 4 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'bottom' }));
  MIX.forEach((m, i) => {
    const a = S.reveal('corpus', 0.3 + i * 0.25, 0.5), w = r.w * m.weight * a;
    d.rect(x, y0, Math.max(0, w - 2), barH, { fill: alpha(dat.c, 0.2 + 0.62 * (1 - i / 5)), stroke: dat.c, lw: 1 });
    if (m.weight >= 0.08 && a > 0.9) d.text(`${nf(S, m.weight * 100, 0)} %`, x + w / 2, y0 + barH / 2, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    x += w;
  });
  // filas: fuente, tokens que tiene y veces que se lee
  const ry0 = y0 + barH + 16 * u, rh = Math.min((compact ? 30 : 44) * u, (r.y + r.h - ry0) / (MIX.length + 0.8));
  const lw = Math.min(r.w * (S.portrait ? 0.34 : 0.28), 190 * u);
  const hdrA = S.reveal('corpus', 1.7, 0.5);
  d.withAlpha(hdrA, () => {
    d.text(S.l('tokens de la fuente', 'tokens in the source'), r.x + lw + (r.w - lw) * 0.0, ry0 - 2 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
    d.text(S.l('veces que se lee', 'times it is read'), r.x + r.w, ry0 - 2 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  MIX.forEach((m, i) => {
    const a = S.reveal('corpus', 1.5 + i * 0.22, 0.5);
    const y = ry0 + (i + 0.5) * rh + 4 * u;
    d.withAlpha(a, () => {
      d.text(S.l(m.es, m.en), r.x, y, { size: FS(S, 12.5), weight: 700, color: p.ink, base: 'middle', w: lw - 6 * u, lh: 1.05 });
      const bw = (r.w - lw - 74 * u);
      hbar(S, { x: r.x + lw, y: y - 7 * u, w: bw, h: 14 * u }, Math.log10(m.tokens / 1e9 + 1) / Math.log10(412), 'dat');
      d.text(count(S, m.tokens), r.x + lw + 4 * u, y, { size: FS(S, 12), weight: 700, font: 'mono', color: p.ink, base: 'middle', halo: p.stage });
      d.text(`× ${sig(S, m.epochs)}`, r.x + r.w, y, { size: FS(S, 13), weight: 700, font: 'mono', color: m.epochs > 1 ? tone(S, 'w').ink : p.ink2, align: 'right', base: 'middle' });
    });
  });
  const aN = S.reveal('corpus', 3.2, 0.6);
  if (aN > 0 && !compact) d.withAlpha(aN, () => para(S, S.l('Lo que se considera de más calidad se lee varias veces; el resto, menos de una.', 'What is judged higher quality is read several times; the rest, less than once.'), r.x, ry0 + MIX.length * rh + 10 * u, r.w, { size: 13, color: p.ink2, weight: 700 }));
  provenance(S, S.l('GPT-3 (Brown et al., 2020), tabla 2.2 · la longitud de la barra de tokens es logarítmica', 'GPT-3 (Brown et al., 2020), table 2.2 · the token bar length is logarithmic'), { a: a0 });
}

// ═════════════════════════════════════════════════════════════════════════
// Mini-rastreo: doce páginas, cuatro filtros reales
// ═════════════════════════════════════════════════════════════════════════
const STAGES = [
  { id: 'crawl', es: 'rastreo', en: 'crawl', t: 'ink' as const },
  { id: 'lang', es: 'idioma', en: 'language', t: 'sig' as const },
  { id: 'quality', es: 'calidad', en: 'quality', t: 'err' as const },
  { id: 'pii', es: 'datos', en: 'privacy', t: 'w' as const },
  { id: 'dedup', es: 'duplicados', en: 'duplicates', t: 'lat' as const },
];
/** Cuántas etapas ya están encendidas (0..5) según el segmento. */
const stageOn = (S: Frame) => (S.on('f-dedup') ? 5 : S.on('f-pii') ? 4 : S.on('f-quality') ? 3 : S.on('f-lang') ? 2 : S.on('raw') ? 1 : 0);

function strip(S: Frame, r: Rect, rows: Row[], on: number, cur: number) {
  const { d, pal: p } = S, u = S.u, n = STAGES.length, gap = 14 * u, w = (r.w - gap * (n - 1)) / n, h = r.h;
  const cnt = stageCounts(rows);
  STAGES.forEach((s, i) => {
    const t = tone(S, s.t), lit = i < on, hot = i === on - 1 ? 1 : 0, x = r.x + i * (w + gap);
    const a = lit ? 1 : 0.35;
    d.withAlpha(a, () => {
      d.rect(x, r.y, w, h, { fill: alpha(t.c, 0.08 + 0.2 * hot * (0.5 + 0.5 * Math.sin(S.clock * 3))), stroke: lit ? t.c : p.line, lw: hot ? 2 : 1.3, r: 3, dash: lit ? undefined : [4, 3] });
      fitText(S, S.l(s.es, s.en), x + w / 2, r.y + 4 * u, w - 4 * u, 12.5, { weight: 700, color: lit ? t.ink : p.mute, align: 'center', base: 'top' });
      if (lit) fitText(S, `${cnt[i].pages}`, x + w / 2, r.y + h - 4 * u, w - 4 * u, 15, { weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'bottom' });
    });
    if (i < n - 1) d.withAlpha(a * 0.9, () => d.arrow(x + w + 2 * u, r.y + h / 2, x + w + gap - 2 * u, r.y + h / 2, lit ? t.c : p.line, 1.6, 6));
  });
  void cur;
}

/** Posiciones de las doce fichas en la cuadrícula. */
function tileRects(S: Frame, r: Rect): Rect[] {
  const u = S.u, cols = S.portrait ? 4 : 6, rowsN = 12 / cols, gap = 10 * u, labelH = 18 * u;
  const w = (r.w - gap * (cols - 1)) / cols, h = Math.min(w * 1.12, (r.h - (rowsN - 1) * gap - rowsN * labelH) / rowsN);
  const used = rowsN * (h + labelH) + (rowsN - 1) * gap, y0 = r.y + Math.max(0, (r.h - used) / 2);
  return PAGES.map((_, i) => ({ x: r.x + (i % cols) * (w + gap), y: y0 + Math.floor(i / cols) * (h + labelH + gap), w, h }));
}

const LANG_TAG: Record<string, string> = { en: 'EN', es: 'ES', fr: 'FR' };

function tile(S: Frame, rc: Rect, row: Row, o: { a: number; showLang: boolean; dropped: number; mark: number; masked: number; label: boolean }) {
  const { d, pal: p } = S, u = S.u, c = tone(S, 'ink');
  const dead = o.dropped, fade = 1 - 0.62 * dead;
  d.withAlpha(o.a * fade, () => {
    d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.3, r: 2, dash: dead > 0.5 ? [4, 3] : undefined });
    // renglones: el largo de cada barra es el largo real de cada línea de la página
    const ls = row.page.text.split('\n').filter((l) => l.trim()), top = rc.y + (o.showLang ? 22 * u : 8 * u), bot = rc.y + rc.h - 6 * u;
    const step = Math.min(6.5 * u, (bot - top) / Math.max(1, ls.length));
    ls.forEach((l, i) => {
      const bw = Math.min(1, 0.18 + l.length / 150) * (rc.w - 12 * u);
      const hot = o.masked > 0 && /@|\d+\.\d+\.\d+\.\d+/.test(l);
      d.rect(rc.x + 6 * u, top + i * step, bw, Math.max(2, step * 0.55), { fill: hot ? alpha(tone(S, 'w').c, 0.85) : alpha(c.c, 0.38) });
    });
    if (o.showLang) {
      const lc = tone(S, 'sig');
      d.rect(rc.x + 4 * u, rc.y + 4 * u, 22 * u, 15 * u, { fill: alpha(lc.c, 0.14), stroke: lc.c, lw: 1, r: 2 });
      d.text(LANG_TAG[row.lang], rc.x + 15 * u, rc.y + 11.5 * u, { size: FS(S, 12), weight: 800, font: 'mono', color: lc.ink, align: 'center', base: 'middle' });
    }
  });
  if (dead > 0.01) {
    const e = tone(S, o.mark ? 'err' : 'mute'), k = smooth(dead), m = 7 * u;
    d.withAlpha(o.a * k, () => {
      d.line(rc.x + m, rc.y + m, rc.x + rc.w - m, rc.y + rc.h - m, e.c, 3);
      d.line(rc.x + rc.w - m, rc.y + m, rc.x + m, rc.y + rc.h - m, e.c, 3);
    });
  }
  if (o.label) {
    d.withAlpha(o.a * (1 - 0.35 * dead), () => fitText(S, S.l(row.page.tag.es, row.page.tag.en), rc.x + rc.w / 2, rc.y + rc.h + 3 * u, rc.w + 8 * u, 12, { weight: 700, color: dead > 0.5 ? p.mute : p.ink2, align: 'center', base: 'top' }));
  }
}

export function drawTiles(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 0), compact = isCompact(S);
  const rows = pipe(THR_DEFAULT), on = stageOn(S), cnt = stageCounts(rows);
  const stripH = (compact ? 40 : 52) * u;
  const aStrip = S.reveal('raw', 0.2, 0.6);
  d.withAlpha(aStrip, () => strip(S, { x: r.x, y: r.y, w: r.w, h: stripH }, rows, on, 0));
  const legendH = (compact ? 18 : S.portrait ? 62 : 44) * u;
  const grid: Rect = { x: r.x, y: r.y + stripH + 12 * u, w: r.w, h: r.h - stripH - 12 * u - legendH - 18 * u };
  const rc = tileRects(S, grid);
  rows.forEach((row, i) => {
    const a = S.reveal('raw', 0.4 + i * 0.07, 0.4);
    const langDrop = !row.langOk ? S.at('f-lang', 1.0, 1.7) : 0;
    const qDrop = row.langOk && !row.quality.ok ? S.at('f-quality', 0.9 + (['menu', 'spam', 'lorem'].indexOf(row.page.id)) * 0.55, 1.5 + (['menu', 'spam', 'lorem'].indexOf(row.page.id)) * 0.55) : 0;
    tile(S, rc[i], row, { a, showLang: S.on('f-lang'), dropped: Math.max(langDrop, qDrop), mark: 1, masked: S.on('f-pii') && row.pii > 0 ? 1 : 0, label: true });
  });
  // leyenda de lo que pasó en la etapa actual
  const ly = r.y + r.h - legendH;
  const t = (es: string, en: string) => S.l(es, en);
  let msg = '', mt: 'ink' | 'sig' | 'err' | 'w' = 'ink', k = 1;
  if (S.between('raw', 'f-lang')) { msg = t('Doce páginas de ejemplo: texto de verdad, menús, spam y copias. Cada barra es una línea.', 'Twelve sample pages: real text, menus, spam, and copies. Each bar is a line.'); k = S.reveal('raw', 1.4, 0.5); }
  else if (S.between('f-lang', 'f-quality')) { msg = t('Voto de palabras muy frecuentes en cada página. Se conservan español e inglés.', 'Vote by very common words on each page. Spanish and English are kept.'); mt = 'sig'; k = S.reveal('f-lang', 0.3, 0.5); }
  else if (S.between('f-quality', 'f-pii')) {
    const a = rows.find((x) => x.page.id === 'menu')!, b = rows.find((x) => x.page.id === 'spam')!;
    msg = t(`Menú: ${nf(S, a.quality.stats.punct * 100, 0)} % de líneas con punto (límite 12 %). Spam: ${nf(S, b.quality.stats.dup * 100, 0)} % de caracteres en líneas repetidas (límite 10 %). Relleno: «lorem ipsum».`,
      `Menu: ${nf(S, a.quality.stats.punct * 100, 0)}% of lines end in punctuation (limit 12%). Spam: ${nf(S, b.quality.stats.dup * 100, 0)}% of characters in repeated lines (limit 10%). Filler: “lorem ipsum”.`); mt = 'err'; k = S.reveal('f-quality', 0.3, 0.5);
  } else if (S.on('f-pii')) { msg = t('Los correos y las direcciones IP se tapan; la página se queda, sin esos datos.', 'Emails and IP addresses are masked; the page stays, without that data.'); mt = 'w'; k = S.reveal('f-pii', 0.3, 0.5); }
  const tc = tone(S, mt);
  d.withAlpha(k, () => { if (msg) para(S, msg, r.x, ly, r.w, { size: 13, weight: 700, color: mt === 'ink' ? p.ink2 : tc.ink }); });
  // cinta de PII: antes y después sobre la ficha de contacto
  if (S.between('f-pii', 'f-dedup')) drawPII(S, r, rows);
  const foot = S.between('raw', 'f-lang') ? S.l('ilustrativo: páginas escritas para la lección · Common Crawl produce ~20 TB de texto al mes (Raffel et al., 2019)', 'illustrative: pages written for this lesson · Common Crawl yields ~20 TB of text per month (Raffel et al., 2019)')
    : S.l('ilustrativo: las páginas son de ejemplo, las reglas y los cálculos son reales (FineWeb, C4)', 'illustrative: the pages are samples, the rules and computations are real (FineWeb, C4)');
  provenance(S, foot, { a: aStrip });
  void cnt; void lerp; void clamp;
}

function drawPII(S: Frame, r: Rect, rows: Row[]) {
  const { d, pal: p } = S, u = S.u, row = rows.find((x) => x.page.id === 'contact')!;
  const w = Math.min(r.w, 560 * u), h = (S.portrait ? 150 : 124) * u, x = r.x + (r.w - w) / 2, y = r.y + (r.h - h) / 2 - 8 * u;
  const a = S.reveal('f-pii', 0.6, 0.6), mask = S.at('f-pii', 2.2, 3.2, 'io');
  const wt = tone(S, 'w');
  d.withAlpha(a, () => {
    d.rect(x, y, w, h, { fill: p.surface, stroke: wt.c, lw: 2, r: 4 });
    d.text(S.l('Página «Contacto», línea por línea', 'The “Contact” page, line by line'), x + 10 * u, y + 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    const orig = row.page.text.split('\n')[2], masked = row.text.split('\n')[2];
    const sz = FS(S, 12.5);
    const hi = (txt: string, yy: number, al: number) => {
      // resalta correos e IP con una caja del tono de privacidad
      const parts = txt.split(/(\[correo\]|\[ip\]|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})/g);
      let cx = x + 10 * u;
      d.withAlpha(al, () => parts.forEach((pt) => {
        if (!pt) return; const isP = /^\[|@|^\d+\.\d+\.\d+\.\d+$/.test(pt);
        const tw = d.measure(pt, { size: sz, weight: isP ? 800 : 600, font: 'mono' });
        if (cx + tw > x + w - 8 * u) return;
        if (isP) d.rect(cx - 1, yy - 2, tw + 2, sz * u + 5, { fill: alpha(wt.c, 0.22), stroke: wt.c, lw: 1 });
        d.text(pt, cx, yy, { size: sz, weight: isP ? 800 : 600, font: 'mono', color: isP ? wt.ink : p.ink2, base: 'top' });
        cx += tw;
      }));
    };
    // el texto se envuelve en dos líneas para caber (se corta por palabras)
    const wrapTo = (txt: string, yy: number, al: number) => {
      const lines = d.wrap(txt, w - 20 * u, { size: sz, weight: 600, font: 'mono' }); lines.forEach((ln, i) => hi(ln, yy + i * (sz * u * 1.5), al));
    };
    wrapTo(orig, y + 30 * u, 1 - mask);
    wrapTo(masked, y + 30 * u, mask);
    d.text(row.pii === 3 ? S.l('3 datos enmascarados', '3 items masked') : `${row.pii}`, x + w - 10 * u, y + h - 8 * u, { size: FS(S, 12.5), weight: 800, color: wt.ink, align: 'right', base: 'bottom' });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Tejas de cinco palabras y similitud de Jaccard (un caso real con dos páginas del mini-rastreo)
// ═════════════════════════════════════════════════════════════════════════
const EXA = 'to plant two thousand trees along the river path before the end'.split(' ');
const EXB = 'to plant three thousand trees along the river path before the end'.split(' ');
const shA = [...shingles(EXA.join(' '))], shB = [...shingles(EXB.join(' '))];
const shared = shA.filter((x) => shB.includes(x)).length;
export const EXAMPLE = { words: EXA.length, shingles: shA.length, shared, union: shA.length + shB.length - shared, j: jaccard(new Set(shA), new Set(shB)) };

export function drawShingle(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), er = tone(S, 'err'), sg = tone(S, 'sig');
  const sz = FS(S, 13.5);
  // dos fragmentos, uno sobre otro; se muestra la ventana de cinco palabras desplazándose
  const cols = S.portrait ? 6 : 12, wordW = (r.w / cols) - 3 * u, rowsPer = 12 / cols, lineH = sz * u * 1.55;
  const blockH = rowsPer * lineH + 4 * u;
  const sqH = (compact ? 13 : 18) * u, sqGap = 4 * u, sqW = Math.min(30 * u, (r.w - sqGap * 7) / 8);
  const gap = (compact ? 8 : 16) * u;
  const y0 = r.y + 2 * u;
  const prog = S.at('f-dedup', 0.9, 5.2, 'lin') * (shA.length);       // cuántas tejas se han formado
  const aWords = S.reveal('f-dedup', 0, 0.5);
  const drawWords = (words: string[], y: number, tag: string, tint: boolean) => {
    d.withAlpha(aWords, () => {
      d.text(tag, r.x, y - 2 * u, { size: FS(S, 12), weight: 800, color: p.mute, base: 'bottom' });
      words.forEach((w, i) => {
        const cx = r.x + (i % cols) * (wordW + 3 * u), cy = y + Math.floor(i / cols) * lineH;
        const changed = tint && i === 2;
        d.rect(cx, cy, wordW, lineH - 3 * u, { fill: alpha(changed ? er.c : lat.c, changed ? 0.3 : 0.12), stroke: changed ? er.c : alpha(lat.c, 0.7), lw: 1, r: 2 });
        fitText(S, w, cx + wordW / 2, cy + (lineH - 3 * u) / 2, wordW - 3 * u, 13, { weight: 600, color: changed ? er.ink : lat.ink, align: 'center', base: 'middle' });
      });
    });
  };
  const yA = y0 + (compact ? 12 : 18) * u;
  drawWords(EXA, yA, S.l('Página A', 'Page A'), false);
  // ventana deslizante sobre A
  const kk = Math.min(shA.length - 1, Math.floor(prog));
  if (S.on('f-dedup') && prog > 0.05) {
    const i0 = kk, win = (i: number) => ({ x: r.x + (i % cols) * (wordW + 3 * u), y: yA + Math.floor(i / cols) * lineH });
    d.withAlpha(aWords, () => {
      for (let j = i0; j < i0 + 5; j++) { const q = win(j); d.rect(q.x - 1, q.y - 1, wordW + 2, lineH - 1, { stroke: sg.c, lw: 2.2, r: 2 }); }
    });
  }
  const sqY = yA + blockH + gap * 0.6;
  const sqs = (arr: string[], other: string[], y: number, upto: number, tone_: 'A' | 'B') => {
    arr.forEach((s, i) => {
      if (i >= upto) { d.rect(r.x + i * (sqW + sqGap), y, sqW, sqH, { stroke: p.line, lw: 1, dash: [3, 3] }); return; }
      const same = other.includes(s), t = same ? sg : tone_ === 'A' ? lat : er;
      d.rect(r.x + i * (sqW + sqGap), y, sqW, sqH, { fill: alpha(t.c, same ? 0.5 : 0.34), stroke: t.c, lw: 1.4 });
      if (!same) { d.line(r.x + i * (sqW + sqGap) + 3, y + 3, r.x + i * (sqW + sqGap) + sqW - 3, y + sqH - 3, er.c, 2); }
    });
  };
  d.withAlpha(aWords, () => {
    d.text(S.l('tejas de A', 'shingles of A'), r.x + 8 * (sqW + sqGap) + 2 * u, sqY + sqH / 2, { size: FS(S, 12), weight: 700, color: p.mute, base: 'middle' });
    sqs(shA, shB, sqY, Math.floor(prog) + (prog > 0.05 ? 1 : 0), 'A');
  });
  const yB = sqY + sqH + gap;
  const aB = S.at('f-dedup', 5.4, 6.2);
  drawWords(EXB, yB, S.l('Página B (cambia una palabra)', 'Page B (one word changed)'), true);
  d.withAlpha(aB * aWords, () => {
    const sqY2 = yB + blockH + gap * 0.6;
    sqs(shB, shA, sqY2, shB.length, 'B');
    d.text(S.l('tejas de B', 'shingles of B'), r.x + 8 * (sqW + sqGap) + 2 * u, sqY2 + sqH / 2, { size: FS(S, 12), weight: 700, color: p.mute, base: 'middle' });
    const ry = sqY2 + sqH + (compact ? 6 : 12) * u;
    const t = EXAMPLE;
    const txt = S.l(`Iguales: ${t.shared} de ${t.union} en total  →  similitud (Jaccard) = ${t.shared} / ${t.union} = ${nf(S, t.j, 2)}`, `Shared: ${t.shared} of ${t.union} in total  →  similarity (Jaccard) = ${t.shared} / ${t.union} = ${nf(S, t.j, 2)}`);
    para(S, txt, r.x, ry, r.w, { size: 14, weight: 800, color: dat.ink });
  });
  provenance(S, S.l('cálculo real con dos páginas del mini-rastreo · FineWeb usa tejas de 5 palabras con MinHash', 'real computation with two pages of the mini-crawl · FineWeb uses 5-word shingles with MinHash'), { a: aWords });
}

// ═════════════════════════════════════════════════════════════════════════
// Gate: el umbral de similitud
// ═════════════════════════════════════════════════════════════════════════
const SIM_IDS = ['news', 'news-copy', 'news-edit', 'recipe', 'recipe-copy', 'recipe-para', 'garden', 'contact'];

export function updateDedup(S: Frame): boolean {
  if (!S.between('try-dedup', 'dedup-why')) return false;
  const thr = S.p.thr ?? T0;
  return isGoodThreshold(pipe(thr));
}

export function drawSim(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 0), compact = isCompact(S);
  const thr = S.between('try-dedup', 'dedup-why') ? (S.p.thr ?? T0) : S.on('dedup-why') ? THR_DEFAULT : T0;
  const rows = pipe(thr), alive = SIM_IDS.map((id) => rows.find((x) => x.page.id === id)!);
  const a = S.reveal('try-dedup', 0, 0.6);
  const sg = tone(S, 'sig'), er = tone(S, 'err'), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const nDrop = alive.filter((x) => x.dup).length;
  const headH = (compact ? 20 : 34) * u;
  d.withAlpha(a, () => {
    d.text(S.l('similitud de cada página con la más parecida que la precede', 'similarity of each page to the most similar one before it'), r.x, r.y + 2 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: r.w });
  });
  const lw = Math.min(r.w * 0.34, 130 * u), rightW = 56 * u, bx = r.x + lw, bw = r.w - lw - rightW;
  const rowsTop = r.y + headH + (compact ? 4 : 10) * u, footH = (compact ? 40 : S.portrait ? 76 : 62) * u;
  const rh = Math.min(34 * u, (r.y + r.h - footH - rowsTop) / SIM_IDS.length);
  const X = (v: number) => bx + bw * clamp(v);
  d.withAlpha(a, () => {
    // eje 0..1
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
      d.line(X(v), rowsTop - 2 * u, X(v), rowsTop + rh * SIM_IDS.length, p.line, 1);
      d.text(nf(S, v, v === 0 || v === 1 ? 0 : 2), X(v), rowsTop + rh * SIM_IDS.length + 3 * u, { size: FS(S, 11.5), font: 'mono', weight: 600, color: p.mute, align: 'center', base: 'top' });
    });
    alive.forEach((row, i) => {
      const y = rowsTop + i * rh, cy = y + rh / 2, dead = row.dup;
      const label = S.l(row.page.tag.es, row.page.tag.en);
      d.text(label, r.x, cy, { size: FS(S, 12.5), weight: 700, color: dead ? p.mute : p.ink, base: 'middle' });
      if (dead) { const tw = d.measure(label, { size: FS(S, 12.5), weight: 700 }); d.line(r.x, cy, r.x + Math.min(tw, lw - 6 * u), cy, er.c, 1.6); }
      // barra de similitud
      const bh = Math.max(8 * u, rh * 0.5);
      d.rect(bx, cy - bh / 2, Math.max(1, bw * row.sim), bh, { fill: alpha(dead ? er.c : lt.c, dead ? 0.7 : 0.55), stroke: dead ? er.c : lt.c, lw: 1 });
      if (row.sim > 0.005) d.text(nf(S, row.sim, 2), X(row.sim) + 4 * u, cy, { size: FS(S, 12), weight: 700, font: 'mono', color: dead ? er.ink : p.ink2, base: 'middle', halo: p.stage });
      // marca de estado (forma + color)
      d.text(dead ? '✕' : '✓', r.x + r.w - 12 * u, cy, { size: FS(S, 16), weight: 800, color: dead ? er.ink : dt.ink, align: 'center', base: 'middle' });
    });
    // umbral
    const tx = X(thr);
    d.line(tx, rowsTop - 6 * u, tx, rowsTop + rh * SIM_IDS.length + 2 * u, sg.c, 3);
    d.tag(S.l(`umbral ${nf(S, thr, 2)}`, `threshold ${nf(S, thr, 2)}`), clamp(tx, r.x + 50 * u, r.x + r.w - 50 * u), rowsTop - 10 * u, { color: sg.ink, fill: sg.soft, stroke: sg.c, size: FS(S, 12), weight: 700 });
  });
  // veredicto
  const fy = r.y + r.h - footH + 4 * u, good = isGoodThreshold(rows);
  const paraDrop = rows.find((x) => x.page.id === 'recipe-para')!.dup, editKept = !rows.find((x) => x.page.id === 'news-edit')!.dup, copyKept = !rows.find((x) => x.page.id === 'news-copy')!.dup || !rows.find((x) => x.page.id === 'recipe-copy')!.dup;
  const msg = good ? S.l('Bien: las tres copias salen y los textos distintos se quedan.', 'Good: the three copies go and the distinct texts stay.')
    : paraDrop ? S.l('Demasiado bajo: también cae la receta reescrita, que no es una copia.', 'Too low: the rewritten recipe also goes, and it is not a copy.')
    : copyKept ? S.l('Todavía pasan copias casi idénticas: baja el umbral.', 'Near-identical copies still get through: lower the threshold.')
    : editKept ? S.l('La copia editada sigue ahí: baja un poco más el umbral.', 'The edited copy is still there: lower the threshold a bit more.')
    : '';
  d.withAlpha(a, () => {
    d.text(S.l(`descartadas ${nDrop} de ${SIM_IDS.length} · quedan ${SIM_IDS.length - nDrop}`, `dropped ${nDrop} of ${SIM_IDS.length} · ${SIM_IDS.length - nDrop} remain`), r.x, fy, { size: FS(S, 13.5), weight: 800, font: 'mono', color: p.ink, base: 'top' });
    if (msg) para(S, msg, r.x, fy + 22 * u, r.w, { size: 13, weight: 700, color: good ? dt.ink : er.ink });
  });
  provenance(S, S.l('cálculo real con el mini-rastreo (ilustrativo); en el umbral 1 solo cae lo idéntico', 'real computation on the mini-crawl (illustrative); at threshold 1 only identical text is dropped'), { a });
}

// ═════════════════════════════════════════════════════════════════════════
// Por qué importa quitar duplicados (Lee et al., 2022; Pythia/The Pile)
// ═════════════════════════════════════════════════════════════════════════
export function drawWhy(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const er = tone(S, 'err'), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const n = 3, gap = 14 * u, vertical = S.portrait || r.w < 560 * u;
  const cw = vertical ? r.w : (r.w - gap * (n - 1)) / n, ch = vertical ? (r.h - gap * (n - 1)) / n : r.h;
  const card = (i: number): Rect => (vertical ? { x: r.x, y: r.y + i * (ch + gap), w: cw, h: ch } : { x: r.x + i * (cw + gap), y: r.y, w: cw, h: ch });
  const cap = (rc: Rect, es: string, en: string, a: number) => para(S, S.l(es, en), rc.x + 10 * u, rc.y + rc.h - (vertical ? 38 : 70) * u, rc.w - 20 * u, { size: 12.5, color: p.ink2, a });
  // 1 · la frase repetida
  {
    const rc = card(0), a = S.reveal('dedup-why', 0, 0.6);
    d.withAlpha(a, () => {
      d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: er.c, lw: 1.5, r: 3 });
      d.text('61 036', rc.x + 10 * u, rc.y + 8 * u, { size: FS(S, compact ? 22 : 28), weight: 800, font: 'mono', color: er.ink, base: 'top' });
      const gy = rc.y + (compact ? 38 : 50) * u, gh = rc.h - (compact ? 38 : 50) * u - (vertical ? 40 : 76) * u;
      const cols = Math.max(8, Math.floor((rc.w - 20 * u) / (9 * u))), rowsN = Math.max(1, Math.floor(gh / (5 * u)));
      const total = Math.min(cols * rowsN, 360), shown = Math.floor(total * S.at('dedup-why', 0.4, 2.4, 'out'));
      for (let k = 0; k < shown; k++) d.rect(rc.x + 10 * u + (k % cols) * 9 * u, gy + Math.floor(k / cols) * 5 * u, 7 * u, 3 * u, { fill: alpha(er.c, 0.7) });
      cap(rc, 'veces repetida, palabra por palabra, una frase de 61 palabras en C4', 'times a 61-word sentence repeats, word for word, in C4', 1);
    });
  }
  // 2 · diez veces menos memoria
  {
    const rc = card(1), a = S.reveal('dedup-why', 1.2, 0.6);
    d.withAlpha(a, () => {
      d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: lt.c, lw: 1.5, r: 3 });
      d.text(S.l('10× menos', '10× less'), rc.x + 10 * u, rc.y + 8 * u, { size: FS(S, compact ? 22 : 28), weight: 800, font: 'mono', color: lt.ink, base: 'top' });
      const by = rc.y + (compact ? 40 : 56) * u, bwid = rc.w - 20 * u, bh = Math.max(10 * u, Math.min(22 * u, (rc.h - (vertical ? 96 : 130) * u) / 2.4));
      const k = S.at('dedup-why', 1.6, 3.0, 'out');
      d.rect(rc.x + 10 * u, by, bwid * k, bh, { fill: alpha(er.c, 0.7) });
      d.text(S.l('con duplicados', 'with duplicates'), rc.x + 14 * u, by + bh / 2, { size: FS(S, 12), weight: 700, color: p.stage, base: 'middle' });
      d.rect(rc.x + 10 * u, by + bh + 6 * u, bwid * 0.1 * k, bh, { fill: alpha(dt.c, 0.8) });
      d.text(S.l('sin duplicados', 'deduplicated'), rc.x + 10 * u + bwid * 0.1 * k + 6 * u, by + bh * 1.5 + 6 * u, { size: FS(S, 12), weight: 700, color: dt.ink, base: 'middle' });
      cap(rc, 'texto memorizado que el modelo suelta, al entrenar con datos deduplicados (Lee et al., 2022)', 'memorized text the model emits, when trained on deduplicated data (Lee et al., 2022)', 1);
    });
  }
  // 3 · The Pile
  {
    const rc = card(2), a = S.reveal('dedup-why', 2.2, 0.6);
    d.withAlpha(a, () => {
      d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: dt.c, lw: 1.5, r: 3 });
      d.text(S.l('334 → 207', '334 → 207'), rc.x + 10 * u, rc.y + 8 * u, { size: FS(S, compact ? 22 : 28), weight: 800, font: 'mono', color: dt.ink, base: 'top' });
      d.text(S.l('mil M de tokens', 'billion tokens'), rc.x + rc.w - 10 * u, rc.y + 12 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top' });
      const by = rc.y + (compact ? 40 : 56) * u, bwid = rc.w - 20 * u, bh = Math.max(10 * u, Math.min(22 * u, (rc.h - (vertical ? 96 : 130) * u) / 2.4));
      const k = S.at('dedup-why', 2.6, 4.0, 'out');
      d.rect(rc.x + 10 * u, by, bwid * k, bh, { fill: alpha(lt.c, 0.55) });
      d.rect(rc.x + 10 * u, by + bh + 6 * u, bwid * (207 / 334) * k, bh, { fill: alpha(dt.c, 0.8) });
      cap(rc, 'The Pile antes y después de quitar casi duplicados (MinHash, umbral 0,87)', 'The Pile before and after removing near-duplicates (MinHash, threshold 0.87)', 1);
    });
  }
  provenance(S, S.l('Lee et al., 2022 · Biderman et al., 2023 (Pythia) · conteos con el tokenizador de GPT-NeoX', 'Lee et al., 2022 · Biderman et al., 2023 (Pythia) · counts with the GPT-NeoX tokenizer'), { a: S.reveal('dedup-why', 0, 0.5) });
}

// ═════════════════════════════════════════════════════════════════════════
// Calidad frente a cantidad (FineWeb y FineWeb-Edu)
// ═════════════════════════════════════════════════════════════════════════
export function drawQuality(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 22 * u), compact = isCompact(S);
  const lt = tone(S, 'lat'), dt = tone(S, 'dat'), a0 = S.reveal('quality', 0, 0.6);
  const vertical = S.portrait || r.w < 560 * u, gap = 18 * u;
  const A: Rect = vertical ? { x: r.x, y: r.y, w: r.w, h: (r.h - gap) * 0.36 } : { x: r.x, y: r.y, w: (r.w - gap) * 0.42, h: r.h };
  const B: Rect = vertical ? { x: r.x, y: r.y + A.h + gap, w: r.w, h: r.h - A.h - gap } : { x: r.x + A.w + gap, y: r.y, w: r.w - A.w - gap, h: r.h };
  // A · cuánto texto hay
  d.withAlpha(a0, () => {
    d.text(S.l('Cuánto texto tiene cada corpus', 'How much text each corpus has'), A.x, A.y + 2 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top' });
    const rowsA = [{ es: 'FineWeb', en: 'FineWeb', v: 15e12, t: lt }, { es: 'FineWeb-Edu', en: 'FineWeb-Edu', v: 1.3e12, t: dt }];
    const lw = 92 * u, y0 = A.y + (compact ? 24 : 36) * u, bh = Math.min(30 * u, (A.h - 40 * u) / 2.4);
    rowsA.forEach((row, i) => {
      const y = y0 + i * (bh + 12 * u), k = S.at('quality', 0.5 + i * 0.4, 1.6 + i * 0.4, 'out');
      d.text(S.l(row.es, row.en), A.x, y + bh / 2, { size: FS(S, 12.5), weight: 700, color: p.ink, base: 'middle' });
      const bw = (A.w - lw - 76 * u) * (row.v / 15e12) * k;
      d.rect(A.x + lw, y, Math.max(2, bw), bh, { fill: alpha(row.t.c, 0.7) });
      d.text(count(S, row.v), A.x + lw + Math.max(2, bw) + 6 * u, y + bh / 2, { size: FS(S, 13), weight: 800, font: 'mono', color: row.t.ink, base: 'middle' });
    });
  });
  // B · cuánto rinde el modelo entrenado con 350 mil M de tokens de cada uno
  const a1 = S.reveal('quality', 1.8, 0.6);
  d.withAlpha(a1, () => {
    d.text(S.l('Puntaje de un modelo de 1.71 mil M, con 350 mil M de tokens de cada corpus', 'Score of a 1.71B model trained on 350B tokens from each corpus'), B.x, B.y + 2 * u, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top', w: B.w });
    const tests = [{ n: 'MMLU', a: 33, b: 37 }, { n: 'ARC', a: 46, b: 57 }];
    const top = B.y + (vertical ? 44 : 58) * u, lw = 56 * u, groupH = (B.h - (top - B.y) - 8 * u) / tests.length, bh = Math.max(11 * u, Math.min(24 * u, groupH * 0.34));
    tests.forEach((t, i) => {
      const y = top + i * groupH, k = S.at('quality', 2.2 + i * 0.5, 3.4 + i * 0.5, 'out');
      d.text(t.n, B.x, y + bh, { size: FS(S, 13), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
      const full = B.w - lw - 52 * u;
      [[t.a, lt], [t.b, dt]].forEach(([v, c], j) => {
        const tt = c as ReturnType<typeof tone>, w = full * (v as number) / 70 * k;
        d.rect(B.x + lw, y + j * (bh + 4 * u), Math.max(2, w), bh, { fill: alpha(tt.c, 0.75) });
        d.text(`${nf(S, (v as number) * k, 0)} %`, B.x + lw + Math.max(2, w) + 5 * u, y + j * (bh + 4 * u) + bh / 2, { size: FS(S, 12.5), weight: 800, font: 'mono', color: tt.ink, base: 'middle' });
      });
    });
    // leyenda
    const ly = B.y + B.h - 4 * u;
    d.rect(B.x, ly - 11 * u, 12 * u, 10 * u, { fill: alpha(lt.c, 0.75) });
    d.text('FineWeb', B.x + 17 * u, ly - 6 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
    d.rect(B.x + 92 * u, ly - 11 * u, 12 * u, 10 * u, { fill: alpha(dt.c, 0.75) });
    d.text('FineWeb-Edu', B.x + 109 * u, ly - 6 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
  });
  provenance(S, S.l('Penedo et al., 2024 (FineWeb), §4 · modelo de 1.71 mil M de parámetros', 'Penedo et al., 2024 (FineWeb), §4 · 1.71B-parameter model'), { a: a0 });
  void tagText;
}
