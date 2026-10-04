// Acto 0: la línea de tiempo del enigma (hook, quiet) y los tres ingredientes (three).
import { alpha, badge, clamp, neu, tone, type Frame } from '../../../../../theme/kit';
import { area, fa, glyph, coreGrid, miniPic } from './shared';

const Y0 = 1984, Y1 = 2014;

// ═════════ línea de tiempo: 1986 → 1989 → … → 2012 ═════════
export function drawTime(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), vertical = S.portrait;
  const hook = S.is('hook') || !S.on('quiet');
  const k = hook ? 'hook' : 'quiet';
  // eje: horizontal (escritorio) o vertical (teléfono). pos(año) → [x, y] sobre el eje
  const ax = vertical ? R.x + 56 * u : R.x + 14 * u, ay = vertical ? R.y + 12 * u : R.y + R.h * 0.56;
  const len = vertical ? R.h - 28 * u : R.w - 28 * u;
  const pos = (yr: number): [number, number] => {
    const t = (yr - Y0) / (Y1 - Y0);
    return vertical ? [ax, ay + t * len] : [ax + t * len, ay];
  };
  // línea base y marcas de década
  const [bx0, by0] = pos(Y0), [bx1, by1] = pos(Y1);
  d.line(bx0, by0, bx1, by1, p.lineStrong, 2);
  [1990, 2000, 2010].forEach((yr) => {
    const [x, y] = pos(yr);
    if (vertical) { d.line(x - 5 * u, y, x + 5 * u, y, p.lineStrong, 1.5); d.text(String(yr), x - 10 * u, y, { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
    else { d.line(x, y - 5 * u, x, y + 5 * u, p.lineStrong, 1.5); d.text(String(yr), x, y + 10 * u, { size: 13, font: 'mono', color: p.mute, align: 'center', base: 'top' }); }
  });
  const ev = (yr: number, label: string, side: 1 | -1, a: number, t: 'sig' | 'w' | 'err', big = false) => {
    if (a <= 0) return;
    const [x, y] = pos(yr), c = tone(S, t);
    d.withAlpha(a, () => {
      const stem = (big ? 84 : 58) * u;
      if (vertical) {
        d.line(x, y, x + 22 * u, y, c.c, 2);
        d.circle(x, y, (big ? 10 : 8) * u, { fill: c.c, stroke: p.stage, lw: 2 });
        d.text(`${yr}`, x + 28 * u, y - 10 * u, { size: 16, weight: 800, font: 'mono', color: c.ink, base: 'middle' });
        d.text(label, x + 28 * u, y + 10 * u, { size: 14, weight: 700, color: p.ink2, base: 'middle', w: R.x + R.w - (x + 28 * u) });
      } else {
        d.line(x, y, x, y + side * stem, c.c, 2);
        d.circle(x, y, (big ? 11 : 8) * u, { fill: c.c, stroke: p.stage, lw: 2 });
        d.text(`${yr}`, x, y + side * (stem + 4 * u), { size: big ? 22 : 18, weight: 800, font: 'mono', color: c.ink, align: 'center', base: side > 0 ? 'top' : 'bottom' });
        d.text(label, x, y + side * (stem + (big ? 30 : 26) * u), { size: big ? 16 : 15, weight: 700, color: p.ink2, align: 'center', base: side > 0 ? 'top' : 'bottom' });
      }
    });
  };
  // 1986 y 1989 (se dicen al principio), luego el hueco y 2012 con la pregunta
  const a86 = fa(S, 'hook', 0.1, 0.2), a89 = fa(S, 'hook', 0.38, 0.48), a12 = hook ? fa(S, 'hook', 0.7, 0.8) : 1;
  ev(1986, S.l('Retropropagación', 'Backpropagation'), -1, a86, 'w');
  ev(1989, S.l('Códigos postales', 'Zip codes'), 1, a89, 'sig');
  // hueco 1989 → 2012
  const gapA = fa(S, 'hook', 0.62, 0.78) * (hook ? 1 : 1);
  if (gapA > 0) {
    const [x0, y0] = pos(1989.6), [x1, y1] = pos(2011.4), mx = x0 + (x1 - x0) * gapA, my = y0 + (y1 - y0) * gapA;
    d.line(x0, y0, mx, my, p.mute, 2, [5, 5]);
    if (gapA > 0.9) {
      const [cx, cy] = pos(2000);
      badge(S, S.l('23 años', '23 years'), vertical ? cx + 44 * u : cx, vertical ? cy : cy - 28 * u, { tone: 'mute' });
    }
  }
  if (hook) ev(2012, S.l('¿Qué cambió?', 'What changed?'), -1, a12, 'err', true);
  else ev(2012, S.l('Despegue', 'Takeoff'), -1, 1, 'err', true);
  // «quiet»: 2010 y 2011, los ganadores usaban características a mano
  if (!hook) {
    const a = fa(S, 'quiet', 0.1, 0.25);
    if (a > 0) {
      const [x0, y0] = pos(2010), [x1, y1] = pos(2011.95);
      d.withAlpha(a, () => {
        if (vertical) {
          d.rect(x0 - 8 * u, y0, 16 * u, y1 - y0, { fill: alpha(tone(S, 'mute').c, 0.5), stroke: tone(S, 'mute').c, lw: 1.5 });
        } else {
          d.rect(x0, y0 - 8 * u, x1 - x0, 16 * u, { fill: alpha(tone(S, 'mute').c, 0.5), stroke: tone(S, 'mute').c, lw: 1.5 });
        }
      });
      const b = fa(S, 'quiet', 0.35, 0.5);
      d.withAlpha(b, () => {
        const lab = S.l('características diseñadas a mano', 'hand-designed features');
        const lab2 = S.l('+ clasificador clásico', '+ classic classifier');
        if (vertical) {
          // en vertical el texto va ENCIMA de la banda (hacia los años anteriores): debajo chocaría con «Despegue 2012»
          const tx = x0 + 20 * u, ww = R.x + R.w - tx;
          d.text('2010–2011', tx, y0 - 66 * u, { size: 13, weight: 800, font: 'mono', color: p.ink2, base: 'middle' });
          d.text(lab, tx, y0 - 46 * u, { size: 13, weight: 700, color: tone(S, 'mute').ink, base: 'middle', w: ww });
          d.text(lab2, tx, y0 - 26 * u, { size: 13, weight: 700, color: tone(S, 'mute').ink, base: 'middle', w: ww });
        } else {
          // centrado en la banda, pero sin salirse del área (la banda está junto al borde derecho)
          const half = Math.max(d.measure(lab, { size: 15, weight: 700 }), d.measure(lab2, { size: 15, weight: 700 })) / 2;
          const cx = Math.min((x0 + x1) / 2, R.x + R.w - half - 4 * u);
          d.text(lab, cx, y0 + 44 * u, { size: 15, weight: 700, color: tone(S, 'mute').ink, align: 'center', base: 'top' });
          d.text(lab2, cx, y0 + 64 * u, { size: 15, weight: 700, color: tone(S, 'mute').ink, align: 'center', base: 'top' });
        }
      });
    }
  }
  // Neu piensa mientras dura el enigma
  const mood = hook ? 'think' : 'think';
  const nx = vertical ? R.x + R.w - 70 * u : R.x + 8 * u, ny = vertical ? R.y + R.h - 60 * u : R.y + 8 * u;
  neu(S, nx, ny, { scale: Math.max(2, Math.round(2.6 * u)), mood, a: fa(S, k, 0.05, 0.15) });
  void clamp;
}

// ═════════ los tres ingredientes ═════════
export function drawThree(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), vertical = S.portrait;
  const items: { k: 'data' | 'compute' | 'tricks'; es: string; en: string; sub: [string, string]; t: 'dat' | 'sig' | 'w' }[] = [
    { k: 'data', es: 'Datos', en: 'Data', sub: ['millones de fotos etiquetadas', 'millions of labeled photos'], t: 'dat' },
    { k: 'compute', es: 'Cómputo', en: 'Compute', sub: ['GPUs: miles de núcleos', 'GPUs: thousands of cores'], t: 'dat' },
    { k: 'tricks', es: 'Trucos', en: 'Tricks', sub: ['ReLU, dropout, atajos', 'ReLU, dropout, shortcuts'], t: 'w' },
  ];
  const gap = 12 * u;
  const tw = vertical ? R.w : (R.w - 2 * gap) / 3, th = vertical ? (R.h - 2 * gap) / 3 : Math.min(R.h * 0.78, 300 * u);
  items.forEach((it, i) => {
    const a = fa(S, 'three', 0.38 + i * 0.16, 0.5 + i * 0.16);
    if (a <= 0) return;
    const x = vertical ? R.x : R.x + i * (tw + gap), y = vertical ? R.y + i * (th + gap) : R.y + (R.h - th) / 2;
    const c = tone(S, it.t);
    d.withAlpha(a, () => {
      d.rect(x, y, tw, th, { fill: c.soft, stroke: c.c, lw: 1.5, r: 3 });
      const gs0 = vertical ? Math.min(th * 0.62, 64 * u) : Math.min(tw * 0.55, th * 0.42);
      const gs = it.k === 'tricks' && vertical ? gs0 * 0.8 : gs0;
      const gwid = it.k === 'tricks' ? gs * 1.8 : gs;                         // ancho real del pictograma (tres iconos para «Trucos»)
      const gx = vertical ? x + 14 * u + gwid / 2 : x + tw / 2, gy = vertical ? y + th / 2 : y + th * 0.38;
      if (it.k === 'data') glyph(S, 'data', gx, gy, gs);
      else if (it.k === 'compute') glyph(S, 'compute', gx, gy, gs);
      else { const q = gs * 0.62; glyph(S, 'relu', gx - q * 1.05, gy, q * 0.8); glyph(S, 'drop', gx, gy, q * 0.8); glyph(S, 'skip', gx + q * 1.05, gy, q * 0.8); }
      const tx = vertical ? x + 14 * u + gwid + 14 * u : x + tw / 2, ty = vertical ? y + th / 2 - 12 * u : y + th * 0.72;
      d.text(S.l(it.es, it.en), tx, ty, { size: 22, weight: 800, color: c.ink, align: vertical ? 'left' : 'center', base: 'middle' });
      d.text(S.l(it.sub[0], it.sub[1]), tx, ty + 28 * u, { size: 15, weight: 600, color: p.ink2, align: vertical ? 'left' : 'center', base: 'middle', w: vertical ? tw - (tx - x) - 8 * u : tw - 12 * u });
    });
  });
  void coreGrid; void miniPic;
}
