// Acto 3: los vectores como flechas, el ángulo entre ellas y la similitud coseno (con las cifras reales de perro, gato y pan).
import { clamp, ease, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { cos, idOf } from './vectors';
import { actAlpha, area, arrowLabel, cosBars, fs, isTiny, num, word } from './ui';

const DOG = idOf('dog'), CAT = idOf('cat'), BREAD = idOf('bread'), KING = idOf('king'), QUEEN = idOf('queen'), PUPPY = idOf('puppy');
const deg = (c: number) => (Math.acos(clamp(c, -1, 1)) * 180) / Math.PI;

function geom(S: Frame): { plane: Rect; O: [number, number]; L: number; side: Rect } {
  const A = area(S), u = S.u;
  if (S.portrait) {
    const h = Math.min(A.h * 0.52, A.w), plane = { x: A.x, y: A.y, w: A.w, h };
    return { plane, O: [plane.x + plane.w / 2, plane.y + h / 2], L: Math.min(h, A.w) * 0.36, side: { x: A.x, y: A.y + h + 22 * u, w: A.w, h: A.h - h - 22 * u } };
  }
  const w = Math.min(A.w * 0.52, A.h), plane = { x: A.x, y: A.y, w, h: A.h };
  return { plane, O: [plane.x + w / 2, plane.y + A.h / 2], L: Math.min(w, A.h) * 0.4, side: { x: A.x + w + 18 * u, y: A.y, w: A.w - w - 18 * u, h: A.h } };
}
const tip = (O: [number, number], L: number, thDeg: number): [number, number] => [O[0] + L * Math.cos((thDeg * Math.PI) / 180), O[1] - L * Math.sin((thDeg * Math.PI) / 180)];
function arc(S: Frame, O: [number, number], r: number, a0: number, a1: number, color: string, lw = 1.6) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 4)), pts: [number, number][] = [];
  for (let k = 0; k <= n; k++) pts.push(tip(O, r, lerp(a0, a1, k / n)));
  S.d.polyline(pts, color, lw);
}
function axes(S: Frame, O: [number, number], L: number, a = 1) {
  const p = S.pal;
  S.d.withAlpha(a * 0.8, () => { S.d.line(O[0] - L * 1.12, O[1], O[0] + L * 1.12, O[1], p.line, 1); S.d.line(O[0], O[1] - L * 1.12, O[0], O[1] + L * 1.12, p.line, 1); S.d.circle(O[0], O[1], 3 * S.u, { fill: p.ink2 }); });
}

export function drawGeom(S: Frame) {
  const a = actAlpha(S, 'space', 'map'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, { plane, O, L, side } = geom(S), tiny = isTiny(S);
  const lt = tone(S, 'lat'), sg = tone(S, 'sig');
  const aGen = S.on('cos') ? S.at('cos', 0, 0.5, 'out') * (1 - S.at('cos-real', 0, 0.5, 'out')) : 0;   // flechas genéricas a y b
  const aReal = 1 - S.at('cos', 0, 0.4, 'out') + S.at('cos-real', 0, 0.5, 'out');                      // perro, gato y pan
  d.withAlpha(a, () => {
    axes(S, O, L);
    // ─── flechas reales (espacio y cos-real) ───
    const kReal = clamp(aReal);
    if (kReal > 0.01) d.withAlpha(kReal, () => {
      const th = [0, deg(cos(DOG, CAT)), -deg(cos(DOG, BREAD))];
      const revDog = S.reveal('space', 0.3, 0.8), revCat = S.on('cos-real') ? 1 : S.reveal('space', 3.4, 0.8), revBread = S.on('cos-real') ? 1 : S.reveal('space', 6.6, 0.8);
      const draw = (k: number, i: number, tn: 'lat' | 'mute', rev: number, w: number, alp: number) => {
        if (rev <= 0) return; const t = tip(O, L * rev, th[k]), c = tn === 'lat' ? lt.c : p.ink2;
        d.withAlpha(alp, () => { d.arrow(O[0], O[1], t[0], t[1], c, w, 10);
          if (rev > 0.9) d.text(word(S, i), t[0] + (t[0] >= O[0] ? 8 : -8) * u, t[1] + (th[k] > 0 ? -8 : 8) * u, { size: fs(S, 14), weight: 800, color: tn === 'lat' ? lt.ink : p.ink, align: t[0] >= O[0] ? 'left' : 'right', base: 'middle', halo: p.stage, haloW: 4 }); });
      };
      draw(0, DOG, 'lat', revDog, 3.2, 1); draw(1, CAT, 'lat', revCat, 3, 0.8); draw(2, BREAD, 'mute', revBread, 3, 0.9);
      if (revCat > 0.9) { arc(S, O, L * 0.34, 0, th[1], p.ink2); const m = tip(O, L * 0.34 + 14 * u, th[1] / 2); d.text(`${Math.round(th[1])}°`, m[0], m[1], { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 }); }
      if (revBread > 0.9) { arc(S, O, L * 0.22, th[2], 0, p.ink2); const m = tip(O, L * 0.22 + 16 * u, th[2] / 2); d.text(`${Math.round(-th[2])}°`, m[0] + 6 * u, m[1], { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 }); }
    });
    // pie del plano
    if (!tiny) d.withAlpha(S.reveal('space', 1.0, 0.8) * (1 - aGen), () => d.text(S.l('dibujo en un plano: el ángulo de cada flecha con «perro» es el real', 'drawn on a plane: each arrow’s angle with “dog” is the real one'), plane.x + 4 * u, S.portrait ? plane.y + plane.h + 2 * u : plane.y + plane.h - 2 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: S.portrait ? 'top' : 'bottom', w: plane.w - 8 * u }));
    // ─── cos: flechas genéricas a y b con el ángulo en movimiento ───
    if (aGen > 0.01) d.withAlpha(aGen, () => {
      const t = S.since('cos');
      const keys: [number, number][] = [[0, 0], [0.8, 0], [2.6, 90], [3.8, 90], [5.6, 180], [6.8, 180], [8.4, 40]];
      let th = 40; for (let k = 1; k < keys.length; k++) if (t <= keys[k][0]) { th = lerp(keys[k - 1][1], keys[k][1], ease.io(clamp((t - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0])))); break; }
      const len = 1 + 0.8 * ease.io(clamp((t - 8.6) / 1.4)), thr = (th * Math.PI) / 180, c = Math.cos(thr);
      const ta = tip(O, L, 0), tb = tip(O, L * len * 0.82, th);
      d.arrow(O[0], O[1], ta[0], ta[1], p.ink, 3, 10); d.text('a', ta[0] + 8 * u, ta[1] + 12 * u, { size: fs(S, 15), weight: 800, color: p.ink, base: 'middle', halo: p.stage, haloW: 4 });
      d.arrow(O[0], O[1], tb[0], tb[1], sg.c, 3, 10); d.text('b', tb[0] + (tb[0] >= O[0] ? 8 : -8) * u, tb[1] + (tb[1] < O[1] ? -10 : 10) * u, { size: fs(S, 15), weight: 800, color: sg.ink, align: tb[0] >= O[0] ? 'left' : 'right', base: 'middle', halo: p.stage, haloW: 4 });
      if (th > 2) arc(S, O, L * 0.3, 0, th, p.ink2, 2);
      // lectura
      const R = side, x = R.x + 4 * u, y = R.y + (S.portrait ? 2 * u : R.h * 0.12), big = S.portrait ? 26 : 34;
      d.text(S.l('ángulo θ', 'angle θ'), x, y, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
      d.text(`${Math.round(th)}°`, x, y + 16 * u, { size: big, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      const x2 = x + (S.portrait ? R.w * 0.42 : 0), y2 = S.portrait ? y : y + 16 * u + big * u + 12 * u;
      d.text('cos θ', x2, y2, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
      d.text(num(S, c, 2), x2, y2 + 16 * u, { size: big, weight: 800, font: 'mono', color: sg.ink, base: 'top' });
      if (len > 1.05) d.text(S.l(`|b| ×${num(S, len, 1)}: el coseno no cambia`, `|b| ×${num(S, len, 1)}: the cosine does not change`), x, (S.portrait ? y + 16 * u + big * u + 10 * u : y2 + 16 * u + big * u + 14 * u), { size: fs(S, 12), weight: 700, color: p.ink2, base: 'top', w: R.w - 8 * u });
      if (!S.portrait && !tiny) d.text('cos θ = a·b / (|a| |b|)', x, R.y + R.h - 8 * u, { size: fs(S, 14), weight: 700, font: 'mono', color: p.ink2, base: 'bottom' });
    });
    // ─── space: de cien dimensiones a un plano ───
    if (S.on('space') && !S.on('cos')) d.withAlpha(S.reveal('space', 1.6, 0.8), () => {
      const R = side, y = R.y + (S.portrait ? 2 * u : R.h * 0.2), bg = S.portrait ? 30 : 56;
      d.text('100', R.x + 4 * u, y, { size: bg, weight: 800, font: 'mono', color: lt.ink, base: 'top' });
      d.text(S.l('dimensiones por palabra. No se pueden dibujar, pero el ángulo entre dos flechas se mide igual que en un plano.', 'dimensions per word. We cannot draw them, but the angle between two arrows is measured just as on a plane.'), R.x + 4 * u, y + bg * u + 8 * u, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'top', w: R.w - 8 * u });
    });
    // ─── cos-real: pares con sus cifras reales ───
    if (S.on('cos-real')) {
      const R = side, pairs: [number, number][] = [[DOG, CAT], [DOG, PUPPY], [KING, QUEEN], [DOG, BREAD], [CAT, BREAD], [KING, BREAD]];
      const rev = S.reveal('cos-real', 0.3, 0.8), n = pairs.length, rh = Math.min(30 * u, (R.h - 24 * u) / n);
      d.withAlpha(rev, () => {
        d.text(S.l('similitud coseno (vectores reales)', 'cosine similarity (real vectors)'), R.x, R.y + (S.portrait ? 0 : R.h * 0.05), { size: fs(S, 12), weight: 700, color: p.mute, base: 'top' });
        cosBars(S, { x: R.x, y: R.y + fs(S, 12) * u * 1.5 + (S.portrait ? 0 : R.h * 0.05), w: R.w, h: rh * n }, pairs.map(([i, j], k) => ({ label: `${word(S, i)} · ${word(S, j)}`, value: cos(i, j), hot: k === 0 || k === 3, tone: k < 3 ? 'lat' : 'mute' })), { rowH: rh, show: S.since('cos-real') * 1.6 });
      });
    }
  });
  void arrowLabel;
}
