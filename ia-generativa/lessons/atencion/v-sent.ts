// Vista 1 (hook … blend): las dos frases con «banco», el vector único de «banco», y la idea de «a quién mirar y cuánto»
// con los pesos del ejemplo hecho a mano (arcos sobre la frase, porcentajes debajo y la escala de los dos sentidos).
import { clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ATT_A, DIM, SENT, A, B, type Lang } from './data';
import { area, attArc, chip, fr, fz, isShort, label, layoutChips, pct, placeRow, q, senseScale, tagNote, vecBars, type ChipRow } from './ui';

const EMB = [0.55, -0.3, 0.8, 0.2, -0.65, 0.4];   // un vector cualquiera (ilustrativo): el embedding de «banco»

interface Geo { R: Rect; rowA: ChipRow; rowB: ChipRow; ra: Rect[]; rb: Rect[]; panel: Rect; scale: Rect; arcMax: number; pctY: number }
export function sentGeo(S: Frame): Geo {
  const R = area(S), u = S.u, P = S.portrait, sh = isShort(S);
  const L = S.lang as Lang;
  const textW = P ? R.w : R.w * 0.64;
  const size = fz(S, P ? 15 : sh ? 14 : 17);
  const rowA = layoutChips(S, SENT.A[L], textW, size), rowB = layoutChips(S, SENT.B[L], textW, size);
  const glide = S.on('who') ? fr(S, 'who', 0.04, 0.3, 'io') : 0;   // en la fase 2 la frase se centra (se desliza, no salta)
  const cx = P ? R.x + R.w / 2 : lerp(R.x + textW / 2, R.x + R.w / 2, glide);
  const yA = P ? R.y + R.h * lerp(0.17, 0.28, glide) : sh ? R.y + R.h * 0.3 : R.y + R.h * 0.3;
  const yB = P ? R.y + R.h * 0.5 : sh ? R.y + R.h * 0.68 : R.y + R.h * 0.64;
  const ra = placeRow(rowA, cx, yA), rb = placeRow(rowB, cx, yB);
  const pw = P ? Math.min(R.w * 0.7, 230 * u) : Math.min(R.w * 0.3, 220 * u), ph = sh ? 34 * u : 44 * u;
  const panel: Rect = P ? { x: R.x + (R.w - pw) / 2, y: R.y + R.h * 0.8, w: pw, h: ph } : { x: R.x + R.w * 0.68 + (R.w * 0.32 - pw) / 2, y: (yA + yB + rowA.h) / 2 - ph / 2 + (sh ? 6 * u : 0), w: pw, h: ph };
  const pctY = yA + rowA.h + 6 * u;
  const sw = Math.min(textW, 520 * u);
  const scale: Rect = { x: cx - sw / 2, y: P ? R.y + R.h * 0.66 : sh ? yB - 10 * u : yB, w: sw, h: 40 * u };
  return { R, rowA, rowB, ra, rb, panel, scale, arcMax: (yA - R.y) / u - 4, pctY };
}

export function drawSent(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang, G = sentGeo(S);
  const lt = tone(S, 'lat'), sg = tone(S, 'sig');
  const ta = A[L], tb = B[L];
  const phase2 = S.on('who') ? fr(S, 'who', 0, 0.15) : 0;   // la frase B y el panel del vector se van
  const bA = 1 - phase2;

  // ── frase A ──
  ta.tok.forEach((w, i) => {
    const a = fr(S, 'hook', 0.04 + i * 0.045, 0.14 + i * 0.045);
    const hb = i === ta.q ? fr(S, 'hook', 0.5, 0.62) : 0;
    const hc = i === ta.ctx ? (S.on('who') ? 1 - phase2 * 0.6 : fr(S, 'look', 0.2, 0.32)) : 0;
    chip(S, G.ra[i], w, { a, size: G.rowA.size, tone: i === ta.q ? 'lat' : 'sig', strong: i === ta.q ? hb : hc });
  });
  // ── frase B ──
  if (bA > 0.01) tb.tok.forEach((w, i) => {
    const a = fr(S, 'hook2', 0.04 + i * 0.05, 0.14 + i * 0.05) * bA;
    const hb = i === tb.q ? fr(S, 'hook2', 0.45, 0.57) : 0, hc = i === tb.ctx ? fr(S, 'look', 0.45, 0.57) : 0;
    chip(S, G.rb[i], w, { a, size: G.rowB.size, tone: i === tb.q ? 'lat' : 'sig', strong: i === tb.q ? hb : hc });
  });

  // ── el sentido de cada «banco» (debajo de la ficha) ──
  const senseA = fr(S, 'hook', 0.68, 0.8) * (1 - fr(S, 'vector', 0, 0.15));
  const senseB = fr(S, 'hook2', 0.62, 0.74) * (1 - fr(S, 'vector', 0, 0.15));
  const sense = (r: Rect, txt: string, a: number) => {
    if (a < 0.01) return;
    const y = r.y + r.h + 8 * u;
    d.line(r.x + r.w / 2, r.y + r.h + 1, r.x + r.w / 2, y, lt.c, 1.5, undefined, a);
    label(S, `= ${txt}`, r.x + r.w / 2, y + 2 * u, { a, size: fz(S, 13), weight: 700, color: lt.ink, base: 'top', italic: true });
  };
  sense(G.ra[ta.q], DIM[L][0], senseA);
  sense(G.rb[tb.q], DIM[L][1], senseB * bA);

  // ── miraste otras palabras: arcos de «banco» a la palabra que decide ──
  const lookA = (1 - phase2);
  if (S.on('look') && lookA > 0.01) {
    attArc(S, G.ra[ta.q], G.ra[ta.ctx], 0.5, { t: fr(S, 'look', 0.22, 0.4, 'io'), a: lookA, hMax: G.arcMax });
    attArc(S, G.rb[tb.q], G.rb[tb.ctx], 0.5, { t: fr(S, 'look', 0.45, 0.62, 'io'), a: lookA, hMax: 60 });
  }
  // toma algo: puntos que viajan de la palabra que decide hacia «banco» (idea)
  if (S.on('idea') && lookA > 0.01) {
    const a = fr(S, 'idea', 0.45, 0.6) * lookA;
    for (const [ra, i, j] of [[G.ra, ta.ctx, ta.q], [G.rb, tb.ctx, tb.q]] as [Rect[], number, number][]) {
      const s = ra[i], t = ra[j], x0 = s.x + s.w / 2, x1 = t.x + t.w / 2, y0 = s.y;
      const lift = Math.min(60 * u, 10 * u + Math.abs(x1 - x0) * 0.32), cx = (x0 + x1) / 2, cy = y0 - lift;
      for (let k = 0; k < 3; k++) {
        const f = ((S.clock * 0.45 + k / 3) % 1), m = 1 - f;
        const x = m * m * x0 + 2 * m * f * cx + f * f * x1, y = m * m * y0 + 2 * m * f * cy + f * f * y0;
        d.circle(x, y, 3.2 * u, { fill: sg.c, a: a * Math.sin(f * Math.PI) });
      }
    }
    const r = G.ra[ta.ctx];
    label(S, S.l('atención', 'attention'), (G.ra[ta.q].x + r.x + r.w) / 2, G.ra[ta.q].y - Math.min(60 * u, 10 * u + Math.abs(r.x - G.ra[ta.q].x) * 0.32) - 4 * u, { a: fr(S, 'idea', 0.05, 0.2) * lookA, size: fz(S, 14), weight: 800, color: sg.ink, base: 'bottom', halo: true });
  }

  // ── el vector de «banco»: uno solo para las dos frases ──
  const vA = fr(S, 'vector', 0.35, 0.55) * bA;
  if (vA > 0.01) {
    const P = G.panel, cA = G.ra[ta.q], cB = G.rb[tb.q];
    const conn = (r: Rect, t: number) => {
      const x0 = r.x + r.w / 2, y0 = r.y + r.h, x1 = P.x + P.w / 2, y1 = S.portrait ? P.y - 18 * u : P.y + P.h / 2;
      const xe = S.portrait ? lerp(x0, x1, t) : lerp(x0, P.x - 6 * u, t), ye = lerp(y0, y1, t);
      d.line(x0, y0, xe, ye, lt.c, 1.5, [4, 4], vA * 0.8);
    };
    conn(cA, fr(S, 'vector', 0.45, 0.65)); conn(cB, fr(S, 'vector', 0.5, 0.7));
    vecBars(S, P, EMB, { a: vA });
    label(S, S.l(`el vector de ${q(S, 'banco')}`, `the vector for ${q(S, 'bank')}`), P.x + P.w / 2, P.y - 4 * u, { a: vA, size: fz(S, 13), weight: 700, color: lt.ink, base: 'bottom' });
    label(S, S.l('(su embedding)', '(its embedding)'), P.x + P.w / 2, P.y + P.h + 4 * u, { a: vA * (1 - fr(S, 'same', 0, 0.15)), size: fz(S, 12), color: p.mute, base: 'top' });
    const sA = fr(S, 'same', 0.2, 0.4) * bA;
    label(S, S.l('el mismo en las dos frases', 'the same in both sentences'), P.x + P.w / 2, P.y + P.h + 4 * u, { a: sA, size: fz(S, 13), weight: 700, color: p.ink, base: 'top' });
    label(S, `${DIM[L][0]}  ·  ${DIM[L][1]}  ?`, P.x + P.w / 2, P.y + P.h + 4 * u + fz(S, 13) * u * 1.4, { a: fr(S, 'same', 0.6, 0.75) * bA, size: fz(S, 13), weight: 700, color: lt.ink, base: 'top', italic: true });
  }

  // ═════ fase 2: a quién mirar y cuánto (frase A) ═════
  if (!S.on('who')) return;
  const W = ATT_A[L].w;
  const order = W.map((w, j) => [w, j]).sort((x, y) => y[0] - x[0]).map((x) => x[1]);
  order.forEach((j, k) => {
    const t = fr(S, 'who', 0.25 + k * 0.05, 0.4 + k * 0.05, 'io');
    attArc(S, G.ra[ta.q], G.ra[j], W[j], { t, hMax: G.arcMax, head: W[j] > 0.05 });
  });
  // porcentajes debajo de cada ficha
  W.forEach((w, j) => {
    const r = G.ra[j], a = fr(S, 'how-much', 0.3 + j * 0.03, 0.42 + j * 0.03);
    label(S, pct(S, w), r.x + r.w / 2, G.pctY, { a, size: fz(S, 13), weight: 800, color: w > 0.05 ? sg.ink : p.mute, base: 'top', font: 'mono' });
  });
  const sumA = fr(S, 'how-much', 0.75, 0.88);
  const last = G.ra[G.ra.length - 1];
  if (!S.portrait) label(S, `= ${pct(S, 1)}`, last.x + last.w + 10 * u, G.pctY, { a: sumA, size: fz(S, 13), weight: 800, color: p.ink, base: 'top', align: 'left', font: 'mono' });
  else label(S, S.l(`suman ${pct(S, 1)}`, `they add up to ${pct(S, 1)}`), G.R.x + G.R.w / 2, G.pctY + fz(S, 13) * u * 1.6, { a: sumA, size: fz(S, 12), weight: 700, color: p.ink2, base: 'top' });
  tagNote(S, S.l('ejemplo hecho a mano', 'handmade example'), G.R.x + G.R.w, G.R.y, fr(S, 'how-much', 0.3, 0.45));

  // la escala de los dos sentidos: «banco» se corre hacia «asiento»
  const sA = fr(S, 'blend', 0.15, 0.3);
  if (sA > 0.01) {
    const k = fr(S, 'blend', 0.45, 0.85, 'io');
    const out = ATT_A[L].out;
    const v: [number, number] = [lerp(0.5, out[0], k), lerp(0.5, out[1], k)];
    senseScale(S, G.scale, v, { a: sA, dims: DIM[L], ghost: [0.5, 0.5], ghostA: clamp(k * 3), caption: q(S, ta.tok[ta.q]) });
    label(S, S.l(`significado de ${q(S, 'banco')}`, `meaning of ${q(S, 'bank')}`), G.scale.x + G.scale.w / 2, G.scale.y - 6 * u, { a: sA, size: fz(S, 12), color: p.mute, base: 'bottom' });
  }
}
