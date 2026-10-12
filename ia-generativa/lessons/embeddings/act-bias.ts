// Acto 6: los sesgos del texto viajan al espacio. Eje de género medido con los vectores reales, objetos neutros como referencia,
// las fuentes y el experimento de «quitar una dirección».
import { alpha, box, clamp, lerp, link, tone, type Frame, type Rect } from '../../../../../theme/kit';
import MEAS from './data/measures.json';
import { FEM, MAS, debiasedScore, genderScore } from './bias';
import { idOf } from './vectors';
import { actAlpha, area, chip, fs, isTiny, num, word } from './ui';

const PROF_ALL = ['boss', 'manager', 'engineer', 'mechanic', 'architect', 'ceo', 'programmer', 'scientist', 'doctor', 'lawyer', 'teacher', 'pilot', 'dentist', 'librarian', 'dancer', 'hairdresser', 'babysitter', 'nurse', 'receptionist'];
const PROF_FEW = ['boss', 'manager', 'engineer', 'mechanic', 'ceo', 'scientist', 'teacher', 'doctor', 'dentist', 'nurse', 'receptionist', 'hairdresser', 'babysitter'];
const EXTREME = new Set(['boss', 'manager', 'engineer', 'mechanic', 'receptionist', 'babysitter', 'nurse']);
const LO = -0.19, HI = 0.14;

function lanes(S: Frame, xs: { x: number; w: number }[], laneH: number, n: number): number[] {
  // asigna a cada etiqueta (ordenada por x) una fila arriba o abajo del eje sin que dos se pisen
  const order = xs.map((_, i) => i).sort((a, b) => xs[a].x - xs[b].x), taken: { x0: number; x1: number }[][] = Array.from({ length: n * 2 }, () => []), out = new Array(xs.length).fill(0);
  const seq = Array.from({ length: n }, (_, k) => [-(k + 1), k + 1]).flat();   // −1, +1, −2, +2…
  for (const i of order) {
    const x0 = xs[i].x - xs[i].w / 2 - 4, x1 = xs[i].x + xs[i].w / 2 + 4;
    for (const L of seq) { const slot = taken[L < 0 ? -L * 2 - 2 : L * 2 - 1]; if (slot.every((t) => x1 < t.x0 || x0 > t.x1)) { slot.push({ x0, x1 }); out[i] = L * laneH; break; } }
  }
  void S; return out;
}

export function drawBias(S: Frame) {
  const a = actAlpha(S, 'bias-intro', 'search-intro'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, A = area(S), tiny = isTiny(S), lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const narrow = S.portrait || tiny;
  d.withAlpha(a, () => {
    // ─── intro: texto de personas → vectores → ¿sesgos? ───
    const kIntro = 1 - S.at('bias-axis', 0, 0.5, 'out');
    if (kIntro > 0.01) d.withAlpha(kIntro, () => {
      const bh = (S.portrait ? 60 : 74) * u, gap = (S.portrait ? 30 : 56) * u, cx = A.x + A.w / 2, cy = A.y + A.h * 0.42;
      const bw = S.portrait ? Math.min(A.w * 0.8, 260 * u) : (A.w - gap * 2) / 3;
      const rs: Rect[] = S.portrait ? [0, 1, 2].map((k) => ({ x: cx - bw / 2, y: A.y + 10 * u + k * (bh + gap), w: bw, h: bh })) : [0, 1, 2].map((k) => ({ x: A.x + k * (bw + gap), y: cy - bh / 2, w: bw, h: bh }));
      const labs = [[S.l('texto escrito', 'text written'), S.l('por personas', 'by people'), 'dat'], [S.l('vectores', 'vectors'), S.l('aprendidos de ese texto', 'learned from that text'), 'lat'], [S.l('¿sesgos?', 'biases?'), S.l('medidos, no supuestos', 'measured, not assumed'), 'err']] as const;
      rs.forEach((r, k) => { const ra = S.reveal('bias-intro', 0.3 + k * 1.2, 0.6); if (ra > 0) box(S, r, labs[k][0], { tone: labs[k][2] as 'dat' | 'lat' | 'err', sub: labs[k][1], a: ra, size: fs(S, 16) }); if (k < 2) link(S, rs[k], rs[k + 1], { tone: 'ink', progress: S.at('bias-intro', 0.9 + k * 1.2, 1.5 + k * 1.2) }); });
    });
    // ─── eje de género ───
    const kAxis = S.at('bias-axis', 0, 0.6, 'out') * (1 - S.at('bias-source', 0, 0.5, 'out') * (1 - S.at('bias-fix', 0, 0.5, 'out')));
    if (kAxis > 0.01) d.withAlpha(kAxis, () => {
      const keys = narrow ? PROF_FEW : PROF_ALL, prof = keys.map(idOf), sc = prof.map(genderScore), sc2 = prof.map(debiasedScore);
      const pad = 18 * u, ax0 = A.x + pad, ax1 = A.x + A.w - pad, X = (v: number) => lerp(ax0, ax1, (v - LO) / (HI - LO));
      const topH = (narrow ? 66 : 70) * u, axY = A.y + topH + (A.h - topH - 40 * u) * (narrow ? 0.52 : 0.5);
      // conjuntos de palabras de cada extremo
      d.withAlpha(S.reveal('bias-axis', 0.3, 0.8), () => {
        const bw = (A.w - 16 * u) / 2, mk = (ids: number[]) => ids.map((i) => word(S, i)).join(' · ');
        d.text(S.l('palabras femeninas', 'female words'), A.x + A.w, A.y, { size: fs(S, 12), weight: 800, color: p.ink, align: 'right', base: 'top' });
        d.text(mk(FEM), A.x + A.w, A.y + fs(S, 12) * u * 1.4, { size: fs(S, 11), weight: 600, color: p.ink2, align: 'right', base: 'top', w: bw });
        d.text(S.l('palabras masculinas', 'male words'), A.x, A.y, { size: fs(S, 12), weight: 800, color: p.ink, base: 'top' });
        d.text(mk(MAS), A.x, A.y + fs(S, 12) * u * 1.4, { size: fs(S, 11), weight: 600, color: p.ink2, base: 'top', w: bw });
      });
      // eje
      d.line(ax0, axY, ax1, axY, p.lineStrong, 2);
      d.line(X(0), axY - 8 * u, X(0), axY + 8 * u, p.ink2, 2);
      // banda de los objetos neutros: una columna tenue que cruza el eje
      const kBand = S.on('bias-result') ? S.reveal('bias-result', 1.8, 0.8) : 0;
      if (kBand > 0) d.withAlpha(kBand, () => {
        const b0 = X(MEAS.bias.neutral[0]), b1 = X(MEAS.bias.neutral[1]), by0 = A.y + topH + 4 * u, by1 = A.y + A.h - 30 * u;
        d.rect(b0, by0, b1 - b0, by1 - by0, { fill: alpha(p.mute, 0.13), stroke: alpha(p.mute, 0.7), lw: 1, dash: [4, 3] });
        d.text(S.l(`${MEAS.bias.neutral_n} objetos sin género (mesa, árbol, río…)`, `${MEAS.bias.neutral_n} objects with no gender (table, tree, river…)`), (b0 + b1) / 2, by0 + 4 * u, { size: fs(S, 11), weight: 700, color: p.ink2, align: 'center', base: 'top', w: Math.max(b1 - b0 - 6 * u, 70 * u), halo: p.stage, haloW: 4 });
      });
      // profesiones
      const fix = S.on('bias-fix') ? S.at('bias-fix', 0.6, 3.2, 'io') : 0;
      const xs = prof.map((_, k) => { const v = lerp(sc[k], sc2[k], fix); return { x: X(v), w: S.d.measure(word(S, prof[k]).replace('/a', ''), { size: fs(S, 12), weight: 700 }) + 8 }; });
      const laneH = fs(S, 12) * u * 1.55, nLanes = Math.max(2, Math.min(5, Math.floor((axY - A.y - topH + 2 * u) / laneH)));
      const ly = lanes(S, xs, laneH, nLanes);
      const order = sc.map((v, i) => [v, i]).sort((m, n) => m[0] - n[0]).map((m) => m[1]);
      order.forEach((k, rank) => {
        const ra = S.reveal('bias-axis', 1.2 + rank * 0.28, 0.5); if (ra <= 0) return;
        const x = xs[k].x, y = axY, hot = EXTREME.has(keys[k]) && S.on('bias-result');
        d.withAlpha(ra, () => {
          d.circle(x, y, (hot ? 6.5 : 5) * u, { fill: lt.c, stroke: p.stage, lw: 1.5 });
          if (hot) d.circle(x, y, 9.5 * u, { stroke: lt.c, lw: 1.8 });
          const la = 1 - clamp(fix * 2.2);
          if (la > 0.02) d.withAlpha(la, () => { d.line(x, y, x, y + ly[k] + (ly[k] < 0 ? 6 : -6) * u, p.line, 1); d.text(word(S, prof[k]).replace('/a', ''), x, y + ly[k], { size: fs(S, 12), weight: hot ? 800 : 600, color: hot ? p.ink : p.ink2, align: 'center', base: 'middle', halo: p.stage, haloW: 4 }); });
        });
      });
      // extremos del eje (fuera de la zona de etiquetas para que no se pisen)
      d.withAlpha(S.reveal('bias-axis', 0.6, 0.8), () => {
        // si las dos frases no caben en una línea (teléfono pequeño), se usan las cortas
        let lm = S.l('← más cerca de lo masculino', '← closer to the male words'), lf = S.l('más cerca de lo femenino →', 'closer to the female words →');
        const m = (t: string) => d.measure(t, { size: fs(S, 12), weight: 800 });
        if (m(lm) + m(lf) + 16 * u > ax1 - ax0) { lm = S.l('← masculino', '← male'); lf = S.l('femenino →', 'female →'); }
        d.text(lm, ax0, A.y + A.h - 6 * u, { size: fs(S, 12), weight: 800, color: p.ink2, base: 'bottom' });
        d.text(lf, ax1, A.y + A.h - 6 * u, { size: fs(S, 12), weight: 800, color: p.ink2, align: 'right', base: 'bottom' });
      });
      // resultado del experimento de quitar la dirección
      if (S.on('bias-fix')) {
        d.withAlpha(S.reveal('bias-fix', 2.4, 0.8), () => d.text(S.l('sin la dirección de género, todas quedan en cero en este eje', 'with the gender direction removed, all sit at zero on this axis'), A.x + A.w / 2, axY - 34 * u, { size: fs(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle', w: A.w - 20 * u, halo: p.stage, haloW: 4 }));
        const rv = S.reveal('bias-fix', 3.6, 0.9), db = MEAS.bias.debias, W2 = Math.min(A.w, 420 * u), y = A.y + A.h - 86 * u;
        d.withAlpha(rv, () => {
          // columna de etiquetas tan ancha como la etiqueta más larga (con letra mínima, «direction removed» no cabe en 100 u)
          const lw = Math.max(100 * u, ...[S.l('antes', 'before'), S.l('sin la dirección', 'direction removed')].map((t) => d.measure(t, { size: fs(S, 11), weight: 700 }) + 10 * u));
          const bx = A.x + A.w / 2 - W2 / 2 + lw, bw = W2 - lw - 56 * u;
          d.rect(A.x + A.w / 2 - W2 / 2 - 6 * u, y - 24 * u, W2 + 12 * u, 66 * u, { fill: p.stage, stroke: p.line, lw: 1, r: 3 });
          d.text(S.l('adivinar el lado de cada profesión', 'guessing each profession’s side'), A.x + A.w / 2, y - 16 * u, { size: fs(S, 11), weight: 800, color: p.ink, align: 'center', base: 'middle' });
          [[S.l('antes', 'before'), db.before], [S.l('sin la dirección', 'direction removed'), db.after]].forEach(([lab, v], k) => {
            const yy = y + 4 * u + k * 18 * u, f = (v as number) / db.n;
            d.text(String(lab), bx - 6 * u, yy + 6 * u, { size: fs(S, 11), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
            d.rect(bx, yy, bw, 12 * u, { fill: p.surface2 }); d.rect(bx, yy, bw * f, 12 * u, { fill: k ? er.c : lt.c });
            d.text(`${v}/${db.n}`, bx + bw + 6 * u, yy + 6 * u, { size: fs(S, 11), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
          });
          d.line(bx + bw * 0.5, y + 1 * u, bx + bw * 0.5, y + 36 * u, p.ink2, 1.5, [3, 3]);
          d.text(S.l('azar', 'chance'), bx + bw * 0.5, y + 38 * u, { size: fs(S, 10), weight: 700, color: p.mute, align: 'center', base: 'top' });
        });
      }
      void dt; void num;
    });
    // ─── fuentes ───
    const kSrc = S.on('bias-source') ? S.at('bias-source', 0, 0.6, 'out') * (1 - S.at('bias-fix', 0, 0.5, 'out')) : 0;
    if (kSrc > 0.01) d.withAlpha(kSrc, () => {
      const cards = [
        { t: 'Bolukbasi et al. · 2016', s: S.l('Vectores entrenados con noticias de Google: estereotipos de género.', 'Vectors trained on Google News: gender stereotypes.') },
        { t: 'Caliskan, Bryson, Narayanan · 2017', s: S.l('GloVe entrenado con texto de la web: asociaciones humanas del test de asociación implícita.', 'GloVe trained on web text: the human associations of the implicit association test.') },
        { t: S.l('Esta lección', 'This lesson'), s: S.l(`El puntaje de género coincide con «she» − «he» de GloVe completo: correlación ${num(S, MEAS.bias.spearman_vs_he_she, 2)} (Spearman, ${MEAS.bias.n_professions} profesiones).`, `The gender score matches “she” − “he” in the full GloVe: correlation ${num(S, MEAS.bias.spearman_vs_he_she, 2)} (Spearman, ${MEAS.bias.n_professions} professions).`) },
      ];
      // cada tarjeta mide lo que su texto (en pantallas angostas el texto ocupa más líneas)
      const ch = Math.min((narrow ? 78 : 92) * u, (A.h - 16 * u) / 3 - 8 * u), cw = Math.min(A.w, 640 * u), x = A.x + (A.w - cw) / 2;
      const hs = cards.map((c) => Math.max(ch, 18 * u + fs(S, 13) * u * 1.35 + d.wrap(c.s, cw - 24 * u, { size: fs(S, 12), weight: 600 }).length * fs(S, 12) * u * 1.3));
      const tot = hs.reduce((q, h) => q + h + 8 * u, 0), y0 = A.y + Math.max(0, (A.h - tot) / 2);
      cards.forEach((c, k) => {
        const ra = S.reveal('bias-source', 0.3 + k * 1.6, 0.7), y = y0 + hs.slice(0, k).reduce((q, h) => q + h + 8 * u, 0), ch = hs[k];
        d.withAlpha(ra, () => {
          d.rect(x, y, cw, ch, { fill: p.surface, stroke: k < 2 ? lt.c : dt.c, lw: 1.5, r: 4 });
          d.text(c.t, x + 12 * u, y + 8 * u, { size: fs(S, 13), weight: 800, color: k < 2 ? lt.ink : dt.ink, base: 'top' });
          d.text(c.s, x + 12 * u, y + 10 * u + fs(S, 13) * u * 1.35, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'top', w: cw - 24 * u });
        });
      });
    });
  });
  void clamp; void chip; void er;
}
