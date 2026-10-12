// Vista 10: dos errores comunes (err-demo … shadow-stat).
// · Decidir por una demo: la demo enseña los casos que salen bien; la evaluación con casos de oro (lección 34) cuenta los
//   que salen mal. Los cien casos y sus trece fallas son ILUSTRATIVOS.
// · La IA en la sombra. REAL: Microsoft y LinkedIn, Work Trend Index (8 de mayo de 2024): 31 000 personas en 31 países;
//   el 75 % de los trabajadores del conocimiento usaba IA generativa en el trabajo y el 78 % de quienes la usaban llevaba
//   sus propias herramientas. El caso de Samsung es el de la lección 35.
import { alpha, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, areaH, card, chip, chipH, fitText, fr, glyph, header, para, paraH, person, tight, win } from './ui';

export function drawErrors(S: Frame) {
  header(S, 6, undefined, 1);
  const a1 = win(S, 'err-demo', 'err-shadow'), a2 = win(S, 'err-shadow');
  if (a1 > 0.003) S.d.withAlpha(a1, () => drawDemo(S));
  if (a2 > 0.003) S.d.withAlpha(a2, () => drawShadow(S));
}

const WRONG = new Set([3, 11, 18, 27, 34, 46, 52, 58, 66, 73, 81, 89, 95]);   // trece de cien (ilustrativo)
const DEMO = [0, 1, 2];                                                       // la demo: tres que salen bien

function drawDemo(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 16) * u;
  fitText(S, S.l('Error 1: decidir por una demo', 'Mistake 1: deciding based on a demo'), A.x, A.y, A.w, 16, { weight: 800, color: p.ink, base: 'top', a: fr(S, 'err-demo', 0.12, 0.24) });
  const top = A.y + FS(S, 16) * u * 1.6;
  const L: Rect = port ? { x: A.x, y: top, w: A.w, h: (A.y + A.h - top) * 0.3 } : { x: A.x, y: top, w: A.w * 0.34, h: A.y + A.h - top };
  const R: Rect = port ? { x: A.x, y: L.y + L.h + gap, w: A.w, h: A.y + A.h - (L.y + L.h + gap) } : { x: L.x + L.w + gap * 2, y: top, w: A.w - L.w - gap * 2, h: A.y + A.h - top };
  // la demo: tres respuestas que salen bien
  const da = fr(S, 'err-demo', 0.3, 0.42);
  d.withAlpha(da, () => {
    fitText(S, S.l('La demo', 'The demo'), L.x, L.y, L.w, 14, { weight: 800, color: p.ink2, base: 'top' });
    const y0 = L.y + FS(S, 14) * u * 1.5, n = 3, bh = Math.min(30 * u, (L.h - (y0 - L.y) - 2 * 6 * u) / n);
    for (let i = 0; i < n; i++) {
      const y = y0 + i * (bh + 6 * u), w = port ? L.w * 0.6 : L.w * 0.9;
      d.rect(L.x, y, w, bh, { fill: alpha(tone(S, 'dat').c, 0.12), stroke: tone(S, 'dat').c, lw: 1.3, r: 6 });
      glyph(S, 'chat', L.x + 14 * u, y + bh / 2, Math.min(18 * u, bh * 0.6), tone(S, 'dat').ink);
      glyph(S, 'check', L.x + w - 14 * u, y + bh / 2, Math.min(16 * u, bh * 0.55), tone(S, 'dat').ink);
      fitText(S, S.l(`respuesta ${i + 1}`, `answer ${i + 1}`), L.x + 28 * u, y + bh / 2, w - 52 * u, 13, { weight: 650, color: p.ink, base: 'middle' });
    }
  });
  // la evaluación: cien casos de oro
  const ea = fr(S, 'err-demo', 0.68, 0.8);
  d.withAlpha(ea, () => {
    fitText(S, S.l('Tus 100 casos de oro', 'Your 100 gold cases'), R.x, R.y, R.w, 14, { weight: 800, color: p.ink2, base: 'top' });
    const y0 = R.y + FS(S, 14) * u * 1.5, capH = FS(S, 13) * u * 1.6;
    const s = Math.min((R.w - 9 * 3 * u) / 10, (R.h - (y0 - R.y) - capH - 9 * 3 * u) / 10), g = 3 * u;
    for (let i = 0; i < 100; i++) {
      const x = R.x + (i % 10) * (s + g), y = y0 + Math.floor(i / 10) * (s + g), bad = WRONG.has(i), demo = DEMO.includes(i);
      const ka = fr(S, 'err-demo', 0.7 + 0.002 * i, 0.74 + 0.002 * i);
      d.withAlpha(ka, () => {
        d.rect(x, y, s, s, { fill: bad ? alpha(tone(S, 'err').c, 0.2) : alpha(tone(S, 'dat').c, demo ? 0.4 : 0.14), stroke: bad ? tone(S, 'err').c : demo ? tone(S, 'dat').c : undefined, lw: 1.2, r: 2 });
        if (bad && s >= 9 * u) glyph(S, 'cross', x + s / 2, y + s / 2, s * 0.6, tone(S, 'err').ink);
      });
    }
    const cy = y0 + 10 * (s + g) + 2 * u;
    fitText(S, S.l('13 salen mal: la demo no las muestra', '13 go wrong: the demo doesn’t show them'), R.x, cy, R.w, 13, { weight: 750, color: tone(S, 'err').ink, base: 'top', a: fr(S, 'err-demo', 0.86, 0.94) });
  });
  void hash; void card; void para; void paraH; void chip; void chipH; void person;
}

function drawShadow(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  fitText(S, S.l('Error 2: la IA en la sombra', 'Mistake 2: shadow AI'), A.x, A.y, A.w, 16, { weight: 800, color: p.ink, base: 'top', a: fr(S, 'err-shadow', 0.08, 0.2) });
  const top = A.y + FS(S, 16) * u * 1.6;
  // cuatro personas: tres usan IA; de ellas, la mayoría con herramientas propias, sin aprobación
  const n = 4, avail = port ? A.w : A.w * 0.5, cw = avail / n;
  const sc = Math.max(2.4, Math.min(5 * u, (A.h * (port ? 0.22 : 0.3)) / 9));
  const py = top + gap * 0.5;
  const statA = fr(S, 'shadow-stat', 0.36, 0.48);
  for (let i = 0; i < n; i++) {
    const cx = A.x + i * cw + cw / 2, uses = i < 3, a = fr(S, 'err-shadow', 0.22 + i * 0.05, 0.3 + i * 0.05);
    d.withAlpha(a, () => {
      person(S, cx - 3 * sc, py, sc, uses && statA > 0.5 ? 'sig' : 'mute');
      // su herramienta
      const gy = py + 9 * sc + 14 * u;
      if (uses) {
        glyph(S, 'phone', cx, gy, 18 * u, p.ink2);
        fitText(S, S.l('propia', 'own tool'), cx, gy + 16 * u, cw - 6 * u, 12.5, { weight: 700, color: tone(S, 'err').ink, base: 'top', align: 'center', a: fr(S, 'err-shadow', 0.4, 0.5) });
      }
    });
  }
  // el dato que sale
  const ly = py + 9 * sc + 14 * u + 16 * u + FS(S, 12.5) * u * 1.4 + gap * 0.6;
  const leak = S.l('datos de la empresa, en servicios que nadie aprobó', 'company data, in services nobody approved');
  d.withAlpha(fr(S, 'err-shadow', 0.5, 0.62), () => {
    glyph(S, 'doc', A.x + 9 * u, ly + 9 * u, 16 * u, tone(S, 'err').ink);
    para(S, leak, A.x + 24 * u, ly + 1 * u, avail - 24 * u, FS(S, 13.5), { weight: 700, color: p.ink, maxLines: 2 });
  });
  const lh = paraH(S, leak, avail - 24 * u, FS(S, 13.5), { weight: 700, maxLines: 2 });
  chip(S, S.l('como el código de Samsung (lección 35)', 'like the Samsung code (lesson 35)'), A.x, ly + lh + gap * 0.5 + chipH(S, 13) / 2, 'err', { size: 13, align: 'left', a: fr(S, 'err-shadow', 0.78, 0.9), maxW: avail, dash: true });
  // la encuesta
  const P: Rect = port ? { x: A.x, y: ly + lh + gap * 1.2 + chipH(S, 13), w: A.w, h: 0 } : { x: A.x + A.w * 0.56, y: top, w: A.w * 0.44, h: 0 };
  P.h = A.y + A.h - P.y;
  const sa = fr(S, 'shadow-stat', 0.06, 0.18);
  if (sa <= 0.003) return;
  d.withAlpha(sa, () => {
    let y = P.y;
    const src = S.l('Encuesta de Microsoft y LinkedIn, 2024: 31 000 personas en 31 países', 'Microsoft and LinkedIn survey, 2024: 31,000 people in 31 countries');
    y += para(S, src, P.x, y, P.w, FS(S, 12.5), { weight: 700, color: p.mute, maxLines: 2, italic: true }) + gap * 0.5;
    const rows: [string, number, number][] = [
      [S.l('usaban IA en el trabajo', 'used AI at work'), 75, 0.36],
      [S.l('de ellos, con herramientas propias', 'of them, with their own tools'), 78, 0.74],
    ];
    const bh = 14 * u, rowH = FS(S, 13.5) * u * 1.4 + bh + 10 * u;
    rows.forEach(([t, v, f]) => {
      if (y + rowH > P.y + P.h + 4) return;
      const a = fr(S, 'shadow-stat', f, f + 0.1), k = fr(S, 'shadow-stat', f, f + 0.16, 'io');
      d.withAlpha(a, () => {
        fitText(S, `${v} % ${t}`, P.x, y, P.w, 13.5, { weight: 800, color: p.ink, base: 'top' });
        const by = y + FS(S, 13.5) * u * 1.4;
        d.rect(P.x, by, P.w, bh, { fill: alpha(p.ink, 0.06), stroke: p.line, lw: 1, r: 2 });
        d.rect(P.x, by, (P.w * v * k) / 100, bh, { fill: tone(S, 'sig').c, r: 2 });
      });
      y += rowH;
    });
  });
}

export const errorsSource = (S: Frame) => (S.on('shadow-stat') ? S.l('Microsoft y LinkedIn, Work Trend Index (8 de mayo de 2024)', 'Microsoft and LinkedIn, Work Trend Index (May 8, 2024)') : S.on('err-demo') && !S.on('err-shadow') ? S.l('Casos ilustrativos', 'Illustrative cases') : '');
