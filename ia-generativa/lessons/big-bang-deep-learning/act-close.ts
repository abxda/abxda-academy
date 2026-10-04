// Acto 5: el cierre. La curva de los ganadores (con la referencia humana), el crecimiento del cómputo, el resumen y el puente.
import { Plot, alpha, badge, box, link, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { COMPUTE, HUMAN, WINNERS } from './facts';
import { area, dec, fa, pct, strip } from './shared';

// ═════════ los ganadores de ILSVRC, año por año ═════════
export function drawStory(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = area(S), human = S.on('human');
  const k = human ? 'human' : 'story-chart';
  const n = WINNERS.length, cw = B.w / n, vmax = 30;
  const top = B.y + 26 * u, base = B.y + B.h - 64 * u, ah = base - top;
  const bw = Math.min(cw * 0.6, 72 * u);
  d.line(B.x + 2 * u, base, B.x + B.w - 2 * u, base, p.lineStrong, 1.5);
  const narrow = cw < 72 * u;
  // referencia humana: se dibuja PRIMERO (detrás de las barras y de sus cifras) y su leyenda va arriba a la derecha, donde no hay barras
  if (human) {
    const a = fa(S, 'human', 0.1, 0.25), y1 = base - (ah * HUMAN.a1) / vmax, y2 = base - (ah * HUMAN.a2) / vmax, r1 = B.x + B.w - 4 * u;
    const t1 = S.l(`un anotador experto: ${dec(S, HUMAN.a1, 1)} %`, `one expert annotator: ${dec(S, HUMAN.a1, 1)}%`), t2 = S.l(`otro anotador: ${dec(S, HUMAN.a2, 0)} %`, `another annotator: ${dec(S, HUMAN.a2, 0)}%`);
    const w1 = d.measure(t1, { size: 12, weight: 800 }), w2 = d.measure(t2, { size: 12, weight: 700 }), ly = B.y + 36 * u;
    d.withAlpha(a, () => {
      d.line(B.x + 2 * u, y1, B.x + B.w - 2 * u, y1, tone(S, 'err').c, 2.2, [7, 5]);
      d.line(r1 - w1 - 34 * u, ly, r1 - w1 - 8 * u, ly, tone(S, 'err').c, 2.2, [7, 5]);
      d.text(t1, r1, ly, { size: 12, weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle' });
    });
    d.withAlpha(fa(S, 'human', 0.3, 0.45), () => {
      d.line(B.x + 2 * u, y2, B.x + B.w - 2 * u, y2, p.mute, 1.5, [3, 5]);
      d.line(r1 - w2 - 34 * u, ly + 20 * u, r1 - w2 - 8 * u, ly + 20 * u, p.mute, 1.5, [3, 5]);
      d.text(t2, r1, ly + 20 * u, { size: 12, weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    });
  }
  WINNERS.forEach((w, i) => {
    const a = human ? 1 : fa(S, 'story-chart', 0.06 + i * 0.1, 0.18 + i * 0.1), cx = B.x + i * cw + cw / 2, h = (ah * w.err) / vmax * a;
    const dl = w.year >= 2012, c = tone(S, dl ? 'sig' : 'mute');
    if (a <= 0) return;
    d.withAlpha(a, () => {
      d.rect(cx - bw / 2, base - h, bw, h, { fill: alpha(c.c, dl ? 0.6 : 0.45), stroke: c.c, lw: 1.5 });
      d.text(dec(S, w.err, w.err < 10 ? (w.err === 6.7 ? 1 : 2) : 1) + (w.year === 2012 && !human ? '†' : ''), cx, base - h - 5 * u, { size: 15, weight: 800, font: 'mono', color: c.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
      d.text(String(w.year), cx, base + 8 * u, { size: 13, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      d.text(w.who, cx, base + 26 * u, { size: 12, weight: 600, color: p.ink2, align: 'center', base: 'top' });
      if (w.depth && !human) {
        // en columnas estrechas (teléfono) el número y la palabra van en dos líneas para que no se toquen
        if (narrow) { d.text(String(w.depth), cx, base + 44 * u, { size: 12, weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'top' }); d.text(S.l('capas', 'layers'), cx, base + 57 * u, { size: 12, weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'top' }); }
        else d.text(`${w.depth} ${S.l('capas', 'layers')}`, cx, base + 44 * u, { size: 12, weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'top' });
      }
    });
  });
  d.withAlpha(human ? 1 : fa(S, 'story-chart', 0.04, 0.14), () => d.text(S.l('error top-5 del ganador (%)', 'winner’s top-5 error (%)'), B.x + 2 * u, B.y + 10 * u, { size: 13, weight: 700, color: p.ink2, base: 'middle' }));
  // nota de 2012: 15,3 % es con datos extra de ImageNet; con solo los datos del concurso fue 16,4 % (Krizhevsky et al., 2012, tabla 2)
  if (!human) d.withAlpha(fa(S, 'story-chart', 0.3, 0.45), () => d.text(S.l('† con datos extra; 16.4 % sin ellos', '† extra data; 16.4% without'), B.x + B.w - 2 * u, B.y + 36 * u, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'middle' }));
  if (human) {
    d.withAlpha(fa(S, 'human', 0.55, 0.7), () => badge(S, S.l('una tarea concreta: 1 000 categorías, 1 etiqueta por foto', 'one specific task: 1,000 categories, 1 label per photo'), B.x + B.w / 2, B.y + B.h - 8 * u, { tone: 'mute', size: 12 }));
  }
  void pct;
}

// ═════════ el cómputo de los mayores entrenamientos (escala logarítmica) ═════════
export function drawComputeGrowth(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1);
  // el eje llega a 6,5 (no a 6) para que la marca de «1 millón×» no choque con el rótulo del eje
  const lmax = 6.5, fast = Math.log10(COMPUTE.factor), slow = Math.log10(COMPUTE.moore), vertical = S.portrait;
  const ticks = [0, 1, 2, 3, 4, 5, 6];
  const big = S.lang === 'es' ? ['1 mil', '10 mil', '100 mil', '1 millón'] : ['1 k', '10 k', '100 k', '1 M'];
  const lab = (v: number) => (v === 0 ? '1×' : v === 1 ? '10×' : v === 2 ? '100×' : `${big[v - 3]}×`);
  const plot = new Plot(S, { x: B.x, y: B.y, w: B.w, h: B.h - 4 * u }, { xr: [0, 1], yr: [0, lmax], yTicks: ticks, tickFmt: lab, xLabel: S.l('AlexNet (2012) → AlphaGo Zero (2017)', 'AlexNet (2012) → AlphaGo Zero (2017)'), yLabel: S.l('cómputo respecto de AlexNet', 'compute relative to AlexNet'), pad: { l: 64, r: 14, t: vertical ? 44 : 26, b: 38 } });
  const a = fa(S, 'compute-growth', 0.03, 0.12);
  plot.axes(a);
  const g = fa(S, 'compute-growth', 0.15, 0.55, 'io');
  plot.curve((x) => x * slow, 'mute', 3, { to: g });
  plot.curve((x) => x * fast, 'dat', 4, { to: g });
  plot.dot(0, 0, 5, 'ink');
  d.withAlpha(a, () => plot.label('AlexNet', 0.01, 0.35, 'ink', { size: 13, align: 'left' }));
  if (g > 0.98) {
    d.withAlpha(fa(S, 'compute-growth', 0.55, 0.7), () => {
      plot.dot(1, fast, 6, 'dat');
      d.text(S.l('AlphaGo Zero: más de 300 000×', 'AlphaGo Zero: over 300,000×'), plot.X(1) - 8 * u, plot.Y(fast) - 14 * u, { size: 13, weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'middle', halo: p.stage, haloW: 5 });
      d.text(S.l('duplica cada 3.4 meses', 'doubles every 3.4 months'), plot.X(vertical ? 0.62 : 0.5) - 6 * u, plot.Y((vertical ? 0.62 : 0.5) * fast) - 4 * u, { size: 13, weight: 700, color: tone(S, 'dat').ink, align: 'right', base: 'bottom', halo: p.stage, haloW: 5 });
    });
    d.withAlpha(fa(S, 'compute-growth', 0.7, 0.85), () => {
      plot.dot(1, slow, 5, 'mute');
      d.text(S.l('ley de Moore (cada 2 años): ≈ 7×', 'Moore’s law (every 2 years): ≈ 7×'), plot.X(1) - 8 * u, plot.Y(slow) - 12 * u, { size: 13, weight: 700, color: p.ink2, align: 'right', base: 'middle', halo: p.stage, haloW: 5 });
    });
  }
  d.withAlpha(fa(S, 'compute-growth', 0.75, 0.9) * 0.9, () => d.text(S.l('los mayores entrenamientos de cada época, no un promedio', 'the largest training runs of each era, not an average'), vertical ? B.x + 4 * u : B.x + B.w - 4 * u, B.y + 4 * u, { size: 12, weight: 600, color: p.mute, align: vertical ? 'left' : 'right', base: 'top', w: B.w - 8 * u }));
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), vertical = S.portrait;
  const items: { es: string; en: string; t: 'dat' | 'w'; sub: [string, string] }[] = [
    { es: 'Datos', en: 'Data', t: 'dat', sub: ['para no memorizar', 'so it does not memorize'] },
    { es: 'GPUs', en: 'GPUs', t: 'dat', sub: ['matrices a la vez', 'matrices all at once'] },
    { es: 'Trucos', en: 'Tricks', t: 'w', sub: ['ReLU, dropout, atajos', 'ReLU, dropout, shortcuts'] },
  ];
  const gap = 12 * u, bw = vertical ? R.w : (R.w - 2 * gap) / 3, bh = vertical ? Math.min((R.h * 0.62 - 2 * gap) / 3, 62 * u) : 78 * u;
  const railW = 26 * u;                                          // en vertical: carril a la izquierda que desemboca en el resultado
  const rects: Rect[] = items.map((_, i) => (vertical ? { x: R.x + railW, y: R.y + 4 * u + i * (bh + gap), w: bw - railW, h: bh } : { x: R.x + i * (bw + gap), y: R.y + R.h * 0.14, w: bw, h: bh }));
  items.forEach((it, i) => { const a = fa(S, 'recap', 0.08 + i * 0.12, 0.2 + i * 0.12); if (a > 0) box(S, rects[i], S.l(it.es, it.en), { tone: it.t, sub: S.l(it.sub[0], it.sub[1]), a, size: 16 }); });
  const res: Rect = vertical ? { x: R.x + R.w * 0.1, y: R.y + R.h * 0.72, w: R.w * 0.8, h: Math.min(60 * u, R.h * 0.18) } : { x: R.x + R.w * 0.2, y: R.y + R.h * 0.6, w: R.w * 0.6, h: 70 * u };
  const ar = fa(S, 'recap', 0.5, 0.68);
  if (ar > 0) {
    if (vertical) d.withAlpha(ar, () => {
      const rx = R.x + 9 * u, ry = res.y + res.h / 2;
      d.line(rx, rects[0].y + rects[0].h / 2, rx, ry, p.mute, 2);
      rects.forEach((r) => d.line(rx, r.y + r.h / 2, r.x - 2, r.y + r.h / 2, p.mute, 2));
      d.arrow(rx, ry, res.x - 2, ry, p.mute, 2, 8);
    });
    else rects.forEach((r) => { d.withAlpha(ar, () => d.arrow(r.x + r.w / 2, r.y + r.h + 2, res.x + res.w * (0.2 + 0.3 * rects.indexOf(r)), res.y - 2, p.mute, 2, 8)); });
    box(S, res, S.l('Deep learning', 'Deep learning'), { tone: 'sig', sub: S.l('ideas viejas + escala + trucos', 'old ideas + scale + tricks'), a: ar, size: 18, active: 0.3 });
  }
  neu(S, vertical ? R.x + R.w - 66 * u : R.x + R.w - 74 * u, vertical ? R.y + R.h - 56 * u : R.y + 4 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'happy', a: fa(S, 'recap', 0.7, 0.85) });
  void link;
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Embeddings: el significado', 'Embeddings: meaning'), cx, cy + 82 * u, { size: 22, weight: 800, align: 'center' });
    d.text(S.l('como geometría', 'as geometry'), cx, cy + 110 * u, { size: 22, weight: 800, align: 'center' });
  });
}
