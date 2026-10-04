// Acto 1: los datos. El mosaico de ImageNet, la comparación de tamaños y el error top-5.
import { alpha, badge, clamp, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { SETS } from './facts';
import { dec, fa, fmtInt, mark, miniPic, strip } from './shared';

// ═════════ ImageNet: un mosaico de fotos que se llena y un contador ═════════
export function drawMosaic(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 0);
  const panelH = (S.portrait ? 84 : 78) * u;
  const mr: Rect = { x: B.x, y: B.y, w: B.w, h: B.h - panelH - 6 * u };
  const ts = Math.max(16 * u, Math.sqrt((mr.w * mr.h) / (S.portrait ? 120 : 190)));
  const cols = Math.max(1, Math.floor(mr.w / ts)), rows = Math.max(1, Math.floor(mr.h / ts)), N = cols * rows;
  const cs = Math.min(mr.w / cols, mr.h / rows), x0 = mr.x + (mr.w - cs * cols) / 2, y0 = mr.y;
  const prog = fa(S, 'imagenet', 0.12, 0.62, 'io');
  for (let k = 0; k < N; k++) {
    const th = hash(k, 3) * 0.92;                 // cada tile aparece en un momento distinto
    const a = clamp((prog - th) / 0.08);
    if (a > 0) miniPic(S, x0 + (k % cols) * cs + 1, y0 + Math.floor(k / cols) * cs + 1, cs - 2, k, a);
  }
  d.rect(x0 - 1, y0 - 1, cs * cols + 2, cs * rows + 2, { stroke: p.line, lw: 1 });
  // contador y categorías
  const py = mr.y + mr.h + 8 * u;
  d.text(fmtInt(S, SETS.imagenet * prog), B.x + B.w / 2, py + 4 * u, { size: S.portrait ? 30 : 38, weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'top' });
  const lab = fa(S, 'imagenet', 0.45, 0.6);
  d.withAlpha(lab, () => {
    d.text(S.l('fotos etiquetadas por personas', 'photos labeled by people'), B.x + B.w / 2, py + (S.portrait ? 40 : 48) * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'top' });
    badge(S, S.l(`${fmtInt(S, SETS.synsets)} categorías`, `${fmtInt(S, SETS.synsets)} categories`), B.x + B.w / 2, py + (S.portrait ? 70 : 78) * u, { tone: 'dat' });
  });
  d.withAlpha(fa(S, 'imagenet', 0.6, 0.72), () => d.text(S.l('ilustrativo: no son las fotos reales', 'illustrative: not the real photos'), mr.x + mr.w - 4 * u, mr.y + mr.h - 3 * u, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'bottom', halo: p.stage, haloW: 5 }));
}

// ═════════ el concurso: tamaños comparados en escala lineal ═════════
export function drawSizes(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 0);
  const rowH = Math.min(B.h / 3.1, 104 * u), max = SETS.imagenet, y0 = B.y + Math.max(0, (B.h - 3 * rowH) / 2);
  const rows = [
    { es: 'MNIST, dígitos escritos a mano', en: 'MNIST, handwritten digits', sub: ['entrenamiento', 'training'], v: SETS.mnistTrain, t: 'mute' as const, at: 0.05 },
    { es: 'ILSVRC, el concurso', en: 'ILSVRC, the contest', sub: ['1 000 categorías · entrenamiento', '1,000 categories · training'], v: SETS.ilsvrcTrain, t: 'dat' as const, at: 0.35 },
    { es: 'ImageNet completo', en: 'Full ImageNet', sub: ['todas las categorías', 'all categories'], v: SETS.imagenet, t: 'sig' as const, at: 0.62 },
  ];
  const valW = 136 * u, barMax = B.w - valW;
  rows.forEach((r, i) => {
    const a = fa(S, 'ilsvrc', r.at, r.at + 0.14), y = y0 + i * rowH, c = tone(S, r.t);
    if (a <= 0) return;
    const w = Math.max(3, barMax * (r.v / max)) * a;
    d.withAlpha(a, () => {
      d.text(S.l(r.es, r.en), B.x, y + 2 * u, { size: 15, weight: 700, color: p.ink2, base: 'top' });
      d.rect(B.x, y + 26 * u, w, 30 * u, { fill: alpha(c.c, 0.55), stroke: c.c, lw: 1.5 });
      d.text(fmtInt(S, r.v), B.x + w + 10 * u, y + 41 * u, { size: 17, weight: 800, font: 'mono', color: c.ink, base: 'middle' });
      d.text(S.l(r.sub[0], r.sub[1]), B.x, y + 62 * u, { size: 13, weight: 600, color: p.mute, base: 'top' });
    });
  });
  // «más de 20 veces»
  const k = fa(S, 'ilsvrc', 0.5, 0.65);
  if (k > 0) d.withAlpha(k, () => badge(S, S.l('más de 20 veces MNIST', 'over 20 times MNIST'), B.x + B.w - 2 * u, y0 + rowH + 12 * u, { tone: 'dat', align: 'right' }));
}

// ═════════ error top-5: una foto y cinco respuestas ═════════
const CAT = [
  '..s......s..',
  '.soo....oos.',
  '.oooooooooo.',
  'ooooooooooo.'.padEnd(12, 'o'),
  'oeeoosooeeoo',
  'oekoosooekoo',
  'oooooonnoooo',
  'oow.oooo.woo',
  '.oooooooooo.',
  '..oooooooo..',
].map((r) => r.padEnd(12, '.').slice(0, 12));
const GUESSES = [
  { name: 'tiger cat', pr: 0.46, ok: false },
  { name: 'tabby', pr: 0.31, ok: true },
  { name: 'Egyptian cat', pr: 0.12, ok: false },
  { name: 'Persian cat', pr: 0.07, ok: false },
  { name: 'Siamese cat', pr: 0.04, ok: false },
];

function drawCat(S: Frame, x: number, y: number, cell: number, a: number) {
  const { d, pal: p } = S, fur = tone(S, 'w');
  const col: Record<string, string> = { o: alpha(fur.c, 0.55), s: fur.ink, e: p.stage, k: p.ink, n: tone(S, 'err').c, w: alpha(p.ink, 0.5) };
  d.withAlpha(a, () => {
    d.rect(x - 4, y - 4, cell * 12 + 8, cell * CAT.length + 8, { fill: p.surface2, stroke: p.line });
    CAT.forEach((row, r) => [...row].forEach((ch, c) => { if (col[ch]) d.rect(x + c * cell, y + r * cell, cell, cell, { fill: col[ch] }); }));
  });
}

export function drawTop5(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 0);
  const catCell = Math.max(5, Math.floor(Math.min((S.portrait ? B.w * 0.3 : B.w * 0.28) / 12, (B.h * 0.55) / CAT.length)));
  const rh = Math.min(48 * u, (B.h - 110 * u) / 5), listH = 5 * rh;
  const top = B.y + Math.max(8 * u, (B.h - (listH + 78 * u)) / 2);
  const cx = B.x + 6, cy = top + Math.max(0, (listH - catCell * CAT.length) / 2);
  drawCat(S, cx, cy, catCell, fa(S, 'top5', 0.03, 0.12));
  d.withAlpha(fa(S, 'top5', 0.05, 0.14), () => d.text(S.l('foto de prueba', 'test photo'), cx + (catCell * 12) / 2, cy + catCell * CAT.length + 14 * u, { size: 13, weight: 600, color: p.mute, align: 'center', base: 'top' }));
  // lista de cinco respuestas
  const lx = cx + catCell * 12 + (S.portrait ? 18 : 44) * u, lw = B.x + B.w - lx;
  const nameW = Math.min(118 * u, lw * 0.4), barX = lx + 22 * u + nameW, barW = lw - 22 * u - nameW - 48 * u;
  GUESSES.forEach((g, i) => {
    const a = fa(S, 'top5', 0.14 + i * 0.07, 0.24 + i * 0.07), y = top + i * rh, c = tone(S, g.ok ? 'dat' : 'mute');
    if (a <= 0) return;
    const hit = fa(S, 'top5', 0.6, 0.7);
    d.withAlpha(a, () => {
      d.text(String(i + 1), lx + 6 * u, y + rh / 2, { size: 14, weight: 800, font: 'mono', color: p.mute, align: 'center', base: 'middle' });
      d.text(g.name, lx + 22 * u, y + rh / 2, { size: 14, weight: g.ok && hit > 0.5 ? 800 : 600, color: g.ok && hit > 0.5 ? c.ink : p.ink2, base: 'middle' });
      d.rect(barX, y + rh * 0.25, barW, rh * 0.5, { fill: p.surface2 });
      d.rect(barX, y + rh * 0.25, barW * g.pr, rh * 0.5, { fill: alpha(c.c, g.ok && hit > 0.5 ? 0.9 : 0.5) });
      d.text(`${Math.round(g.pr * 100)}${S.l(' %', '%')}`, B.x + B.w, y + rh / 2, { size: 13, font: 'mono', weight: 600, color: p.ink2, align: 'right', base: 'middle' });
      if (g.ok && hit > 0) d.rect(lx - 2 * u, y + 1, lw + 4 * u, rh - 2, { stroke: tone(S, 'dat').c, lw: 2 * hit, r: 3, a: hit });
    });
  });
  d.withAlpha(fa(S, 'top5', 0.14, 0.24), () => d.text(S.l('ilustrativo: respuestas y probabilidades inventadas', 'illustrative: made-up answers and probabilities'), lx, top + listH + 6 * u, { size: 12, weight: 600, color: p.mute, base: 'top', w: lw }));
  // veredicto: top-1 falla, top-5 acierta
  const v = fa(S, 'top5', 0.74, 0.86), vy = top + listH + 54 * u;
  d.withAlpha(v, () => {
    const gx = B.x + B.w * (S.portrait ? 0.12 : 0.3);
    mark(S, 'miss', gx, vy, 10 * u); d.text(S.l('top-1: falla', 'top-1: miss'), gx + 18 * u, vy, { size: 16, weight: 800, color: tone(S, 'err').ink, base: 'middle' });
    const hx = B.x + B.w * (S.portrait ? 0.58 : 0.62);
    mark(S, 'hit', hx, vy, 10 * u); d.text(S.l('top-5: acierta', 'top-5: hit'), hx + 18 * u, vy, { size: 16, weight: 800, color: tone(S, 'dat').ink, base: 'middle' });
  });
  void dec;
}
