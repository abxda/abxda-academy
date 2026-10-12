// Derechos, consentimiento y privacidad: de qué está hecho The Pile (Gao et al., 2020, tabla 1) con Books3 señalado; el caso
// Bartz v. Anthropic (orden del 23 de junio de 2025 y acuerdo aprobado el 20 de julio de 2026); y los 604 textos memorizados
// de 1 800 candidatos que Carlini et al. (2021) sacaron de GPT-2.
import { alpha, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, area, card, fitText, fr, hbar, hold, isShort, lineH, lines, mark, measure, para, paraH, provenance, provH, txt } from './draw';

// peso de cada componente en The Pile (porcentaje de bytes en el conjunto final, tabla 1)
const PILE: { es: string; en: string; w: number; hot?: boolean }[] = [
  { es: 'Web (Pile-CC)', en: 'Web (Pile-CC)', w: 18.11 },
  { es: 'Artículos médicos (PubMed Central)', en: 'Medical papers (PubMed Central)', w: 14.4 },
  { es: 'Libros (Books3)', en: 'Books (Books3)', w: 12.07, hot: true },
  { es: 'Páginas enlazadas en Reddit', en: 'Pages linked from Reddit', w: 10.01 },
  { es: 'Artículos de arXiv', en: 'arXiv papers', w: 8.96 },
  { es: 'Código (GitHub)', en: 'Code (GitHub)', w: 7.59 },
  { es: 'Sentencias (FreeLaw)', en: 'Court opinions (FreeLaw)', w: 6.12 },
  { es: 'Stack Exchange', en: 'Stack Exchange', w: 5.13 },
  { es: 'Otras 14 fuentes', en: 'Other 14 sources', w: 17.61 },
];

export function drawRights(S: Frame) {
  const aP = hold(S, 'rights-pile', 'rights-case');
  if (aP > 0.01) drawPile(S, aP);
  const aC = ap(S, 'rights-case', 0, 0.1);
  if (aC > 0.01) drawCase(S, aC);
}

function drawPile(S: Frame, a: number) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, wt = tone(S, 'w');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const noteLines = P ? 3 : 2, headH = lineH(S, 14) + 12, noteH = lineH(S, 13) * noteLines + 12;
  // si no caben las nueve filas sin encimarse, las últimas se juntan en «otras fuentes»
  const rhMin = lineH(S, 12.5) + 2, fit = Math.max(4, Math.floor((A.h - headH - noteH) / rhMin));
  const rows = fit >= PILE.length ? PILE : [...PILE.slice(0, fit - 1), { es: `Otras ${22 - (fit - 1)} fuentes`, en: `Other ${22 - (fit - 1)} sources`, w: PILE.slice(fit - 1).reduce((acc, r) => acc + r.w, 0) }];
  const rh = Math.min(30, (A.h - headH - noteH) / rows.length), oy = A.y + Math.max(0, (A.h - headH - noteH - rh * rows.length) / 2), top = oy + headH;
  fitText(S, S.l('The Pile, el corpus de Pythia: de qué está hecho', 'The Pile, Pythia’s corpus: what it is made of'), A.x, oy + headH / 2, A.w, { s: 14, weight: 800, a });
  const labW = Math.min(A.w * (P ? 0.5 : 0.36), 300), valW = measure(S, '18.1 %', 12.5, true, 800) + 8;
  const bx = A.x + labW, bw = A.w - labW - valW, max = Math.max(20, ...rows.map((r) => r.w));
  rows.forEach((r, i) => {
    const ai = a * ap(S, 'rights-pile', 0.05 + i * 0.03, 0.12 + i * 0.03), y = top + i * rh;
    if (ai <= 0.01) return;
    const hot = !!r.hot && ap(S, 'rights-pile', 0.3, 0.42) > 0.5;
    d.withAlpha(ai, () => {
      if (hot) d.rect(A.x - 4, y + 1, A.w + 8, rh - 2, { fill: alpha(wt.c, 0.12), stroke: wt.c, lw: 1.5, r: 3 });
      fitText(S, S.l(r.es, r.en), A.x, y + rh / 2, labW - 8, { s: 12.5, weight: hot ? 800 : 600, c: hot ? wt.ink : p.ink });
      hbar(S, bx, y + rh * 0.25, bw, rh * 0.5, r.w / max, { tone: hot ? 'w' : 'dat', hot: hot ? 1 : 0 });
      txt(S, `${S.n(r.w, 1)}${S.l(' %', '%')}`, A.x + A.w, y + rh / 2, { s: 12.5, weight: 800, mono: true, c: hot ? wt.ink : p.ink2, align: 'right' });
    });
  });
  const aN = a * ap(S, 'rights-pile', 0.55, 0.68);
  para(S, S.l('Books3: libros de una copia del sitio privado de descargas Bibliotik, sin el consentimiento de sus autores (tabla 5 del artículo).', 'Books3: books from a copy of the private download site Bibliotik, without their authors’ consent (the paper’s table 5).'), A.x, top + rh * rows.length + 6, A.w, { s: 13, weight: 700, c: wt.ink, max: noteLines, a: aN });
  provenance(S, S.l('Gao et al., 2020 (The Pile), tablas 1 y 5 · peso = porcentaje de bytes', 'Gao et al., 2020 (The Pile), tables 1 and 5 · weight = share of bytes'), a);
}

function drawCase(S: Frame, a: number) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const head = S.l('Bartz y otros contra Anthropic · tribunal federal de EE. UU.', 'Bartz et al. v. Anthropic · U.S. federal court');
  const headH = paraH(S, head, A.w, { s: 14, weight: 800, max: 2 }) + 12, gap = 10;
  const vertical = P || A.w < 560;
  const cw = vertical ? A.w : (A.w - 2 * gap) / 3;
  const items = [
    { kind: 'ok' as const, seg: 'rights-case', at: 0.3, head: S.l('Usar los libros para entrenar', 'Using the books for training'), sub: S.l('uso legítimo (fair use) · 23 de junio de 2025', 'fair use · June 23, 2025') },
    { kind: 'no' as const, seg: 'rights-case', at: 0.62, head: S.l('Bajar y guardar copias piratas', 'Downloading and keeping pirated copies'), sub: S.l('no es uso legítimo', 'not fair use') },
    { kind: 'money' as const, seg: 'rights-settle', at: 0.1, head: S.l('Acuerdo: 1 500 millones de dólares', 'Settlement: $1.5 billion'), sub: S.l('unos 3 000 dólares por libro, unas 482 000 obras · aprobado el 20 de julio de 2026', 'about $3,000 per book, some 482,000 works · approved July 20, 2026') },
  ];
  const icon = 26, hs = short ? 13 : 14, ss = 12.5;
  const tw = vertical ? cw - 12 - icon - 10 - 10 : cw - 24;
  const sizes = items.map((it) => ({ h1: paraH(S, it.head, tw, { s: hs, weight: 800, max: 2 }), h2: paraH(S, it.sub, tw, { s: ss, weight: 600, max: 3 }) }));
  const inner = Math.max(...sizes.map((z) => z.h1 + 4 + z.h2));
  const avail = vertical ? (A.h - headH - 2 * gap) / 3 : A.h - headH;
  const ch = Math.min(avail, vertical ? Math.max(icon, inner) + 22 : 14 + icon + 10 + inner + 14);
  const groupH = headH + (vertical ? 3 * ch + 2 * gap : ch), oy = A.y + Math.max(0, (A.h - groupH) / 2);
  para(S, head, A.x, oy, A.w, { s: 14, weight: 800, max: 2, a });
  const cell = (i: number): Rect => (vertical ? { x: A.x, y: oy + headH + i * (ch + gap), w: cw, h: ch } : { x: A.x + i * (cw + gap), y: oy + headH, w: cw, h: ch });
  items.forEach((it, i) => {
    const r = cell(i), ai = a * ap(S, it.seg, it.at, it.at + 0.12);
    if (ai <= 0.01) return;
    const tn = it.kind === 'ok' ? 'dat' : it.kind === 'no' ? 'err' : 'w';
    d.withAlpha(ai, () => {
      card(S, r, { tone: tn, fill: 0.06 });
      const ix = r.x + 12, iy = vertical ? r.y + r.h / 2 : r.y + 14 + icon / 2;
      if (it.kind === 'money') {
        d.circle(ix + icon / 2, iy, icon / 2, { fill: alpha(tone(S, 'w').c, 0.16), stroke: tone(S, 'w').c, lw: 1.5 });
        txt(S, '$', ix + icon / 2, iy + 1, { s: 15, weight: 800, c: tone(S, 'w').ink, align: 'center' });
      } else mark(S, ix + icon / 2, iy, it.kind === 'ok', 9);
      const tx = vertical ? ix + icon + 10 : r.x + 12;
      const y0 = vertical ? r.y + (r.h - sizes[i].h1 - 4 - sizes[i].h2) / 2 : r.y + 14 + icon + 10;
      const h1 = para(S, it.head, tx, y0, tw, { s: hs, weight: 800, max: 2, c: tone(S, tn).ink });
      para(S, it.sub, tx, y0 + h1 + 4, tw, { s: ss, weight: 600, c: p.ink2, max: 3 });
    });
  });
  provenance(S, S.l('Bartz v. Anthropic (N. D. Cal.): orden sobre uso legítimo, 23/6/2025; aprobación final del acuerdo, 20/7/2026', 'Bartz v. Anthropic (N.D. Cal.): order on fair use, 6/23/2025; final approval of the settlement, 7/20/2026'), a);
  void lines; void fr;
}

// ═════════ privacidad: 604 de 1 800 ═════════
export function drawPrivacy(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S), er = tone(S, 'err');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const headH = lineH(S, 13.5) + 10, footH = lineH(S, 13) * 2 + (short ? 8 : 14);
  const N = 1800, M = 604;
  const g: Rect = { x: A.x, y: A.y + headH, w: A.w, h: A.h - headH - footH };
  // columnas: que las celdas sean cuadradas y llenen el espacio
  let cols = P ? 40 : 60;
  while (cols < 120 && Math.ceil(N / cols) * (g.w / cols) > g.h) cols += 5;
  const rows = Math.ceil(N / cols), cell = Math.min(g.w / cols, g.h / rows);
  const gx = g.x + (g.w - cell * cols) / 2, gy = g.y + (g.h - cell * rows) / 2;
  const fill = fr(S, 'privacy', 0.42, 0.72) * M;
  const order = ORDER;
  const a0 = ap(S, 'privacy', 0.04, 0.16);
  fitText(S, S.l('1 800 textos sospechosos sacados de GPT-2', '1,800 suspicious texts pulled out of GPT-2'), A.x, A.y + headH / 2, A.w, { s: 13.5, weight: 800, a: a0 });
  d.withAlpha(a0, () => {
    for (let i = 0; i < N; i++) {
      const x = gx + (i % cols) * cell, y = gy + Math.floor(i / cols) * cell, on = order[i] < fill;
      if (on) d.rect(x + 0.4, y + 0.4, cell - 1, cell - 1, { fill: er.c });
      else d.rect(x + 0.6, y + 0.6, cell - 1.6, cell - 1.6, { stroke: alpha(p.ink, 0.28), lw: 0.8 });
    }
  });
  const aT = ap(S, 'privacy', 0.7, 0.82);
  d.withAlpha(aT, () => {
    const y = g.y + g.h + (short ? 4 : 8), big = short ? 18 : 22, bw = measure(S, '604', big, true, 800);
    txt(S, '604', A.x, y + lineH(S, big) / 2, { s: big, weight: 800, mono: true, c: er.ink });
    para(S, S.l('eran copias de lo que leyó al entrenar; entre ellas, nombres, teléfonos y correos reales', 'were copies of what it read in training; among them, real names, phone numbers, and emails'), A.x + bw + 10, y, A.w - bw - 10, { s: 13, weight: 700, max: 2 });
  });
  provenance(S, S.l('Carlini et al., 2021 · cuadro relleno = texto memorizado · se omiten los datos personales', 'Carlini et al., 2021 · filled square = memorized text · personal data withheld'), a0);
}
/** Orden fijo (pseudoaleatorio, determinista) en que se rellenan las celdas. */
const ORDER: number[] = (() => {
  const idx = Array.from({ length: 1800 }, (_, i) => i).sort((a, b) => hash(a, 11) - hash(b, 11));
  const rank = new Array<number>(1800); idx.forEach((c, i) => (rank[c] = i)); return rank;
})();
