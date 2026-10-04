// Actos 4–6: contaminación (diagrama, medición con GSM1k y turno 1) y la ley de Goodhart.
import { Plot, alpha, clamp, hash, lerp, neu, split, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ABILITY_A, ABILITY_B, GSM1K, QN, SCORE_B, scoreA } from './data';
import { cells, foot, fs, hbar, layout, nf, panel } from './ui';
import { fr, stag } from './act-bench';

const order = (n: number, salt: number) => Array.from({ length: n }, (_, i) => i).sort((a, b) => hash(a, salt) - hash(b, salt));

// ═════════ el examen se cuela en el entrenamiento ═════════
export function drawContam(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = layout(S, 1, { foot: false }).all, lat = tone(S, 'lat'), err = tone(S, 'err');
  const body: Rect = { ...R, h: R.h - 38 * u };
  const [ex, co] = S.portrait ? split(body, 'v', 0.34, 26 * u) : split(body, 'h', 0.3, 60 * u);
  const aE = S.reveal('contam', 0.2, 0.6), aC = S.reveal('contam', 1.2, 0.7);
  const inE = panel(S, ex, S.l('Examen público', 'Public exam'), { a: aE });
  const nq = 5, qh = Math.min(46 * u, inE.h / nq);
  d.withAlpha(aE, () => {
    for (let i = 0; i < nq; i++) {
      const y = inE.y + i * qh + qh / 2;
      d.text(`P${i + 1}`, inE.x + 4 * u, y, { size: fs(S, 12.5), weight: 800, font: 'mono', color: p.mute, base: 'middle' });
      d.rect(inE.x + 38 * u, y - 6 * u, (inE.w - 46 * u) * (0.55 + 0.4 * hash(i, 3)), 12 * u, { fill: p.surface2, stroke: p.line, lw: 1 });
    }
  });
  const inC = panel(S, co, S.l('Datos de preentrenamiento', 'Pretraining data'), { a: aC, tone: 'lat', sub: S.l('web, libros, código…', 'web, books, code…') });
  const cols = S.portrait ? 18 : 22, rows = S.portrait ? 7 : 10;
  const copies = [3, 17, 40, 62, 85].map((k) => Math.floor((hash(k, 9) * 0.6 + 0.2) * cols * rows));
  const prog = stag(S, 'contam', 0.45, 0.2), lit = stag(S, 'contam', 0.62, 0.1);
  const geo = cells(S, inC, cols, rows, (i, x, y, cs) => {
    const isCopy = copies.includes(i), base = 0.1 + 0.4 * hash(i, 5);
    d.withAlpha(aC, () => {
      d.rect(x + 0.5, y + 0.5, cs - 1.5, cs - 1.5, { fill: alpha(lat.c, base) });
      if (isCopy && lit > 0) d.rect(x - 0.5, y - 0.5, cs + 0.5, cs + 0.5, { fill: alpha(err.c, 0.75 * lit), stroke: err.c, lw: 2, a: lit });
    });
  }, 30);
  const tileC = (i: number): [number, number] => [geo.x + ((i % cols) + 0.5) * geo.cs, geo.y + (Math.floor(i / cols) + 0.5) * geo.cs];
  copies.forEach((ci, k) => {
    const [tx, ty] = tileC(ci), qy = inE.y + (k + 0.5) * qh, sx = S.portrait ? inE.x + inE.w * (0.18 + 0.16 * k) : ex.x + ex.w, sy = S.portrait ? ex.y + ex.h : qy;
    const f = clamp(prog * 1.4 - k * 0.12);
    if (f > 0) d.arrow(sx, sy, lerp(sx, tx, f), lerp(sy, ty, f), err.c, 1.6, 7, 0.8);
  });
  d.withAlpha(stag(S, 'contam', 0.75, 0.15), () => {
    d.text(S.l('nota alta: ¿memoria o capacidad?', 'high score: memory or ability?'), R.x + R.w / 2, R.y + R.h - 2 * u, { size: fs(S, 16), weight: 800, color: err.ink, align: 'center', base: 'bottom', w: R.w, halo: p.stage });
  });
}

// ═════════ GSM1k: problemas nuevos, menos aciertos ═════════
export function drawGsm1k(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, 0.5), err = tone(S, 'err');
  const prog = clamp((fr(S, 'gsm1k') - 0.28) / 0.3), m = L.main;
  d.withAlpha(S.reveal('gsm1k', 0.1, 0.5), () => d.text(S.l('1 punto de exactitud = 1 cuadro', '1 accuracy point = 1 square'), m.x, m.y, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top' }));
  const g: Rect = { x: m.x, y: m.y + 24 * u, w: m.w, h: m.h - 24 * u };
  const lostArr = order(100, 7).slice(0, GSM1K.maxDrop), lostSet = new Set(lostArr);
  cells(S, g, 10, 10, (i, x, y, cs) => {
    const lost = lostSet.has(i), k = lost ? clamp(prog * GSM1K.maxDrop * 1.1 - lostArr.indexOf(i) * 0.9) : 0;
    d.withAlpha(S.reveal('gsm1k', 0.2 + (i % 10) * 0.03, 0.4), () => {
      d.rect(x + 1, y + 1, cs - 2.5, cs - 2.5, { fill: k > 0 ? alpha(err.c, 0.3 + 0.6 * k) : alpha(p.mute, 0.1), stroke: k > 0 ? err.c : p.line, lw: 1 });
      if (k > 0.5) { d.line(x + 3, y + 3, x + cs - 4, y + cs - 4, err.c, 1.6); d.line(x + cs - 4, y + 3, x + 3, y + cs - 4, err.c, 1.6); }
    });
  }, 44);
  const a = L.aside, x = a.x + (S.portrait ? 0 : 6 * u), y0 = a.y + (S.portrait ? 2 * u : 18 * u), big = S.portrait ? 26 : 34;
  d.withAlpha(S.reveal('gsm1k', 0.5, 0.6), () => {
    d.text(nf(S, GSM1K.problems, 0), x, y0, { size: fs(S, big), weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    d.text(S.l('problemas nuevos, escritos por personas', 'new problems, written by people'), x, y0 + (big + 8) * u, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'top', w: a.w - 6 * u });
  });
  d.withAlpha(stag(S, 'gsm1k', 0.5, 0.12), () => {
    const y1 = y0 + (S.portrait ? 74 : 112) * u;
    d.text(`−${GSM1K.maxDrop}`, x, y1, { size: fs(S, big), weight: 800, font: 'mono', color: err.ink, base: 'top' });
    d.text(S.l('puntos en el peor caso medido; los mejores modelos, casi nada', 'points in the worst case measured; the best models, almost nothing'), x, y1 + (big + 8) * u, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'top', w: a.w - 6 * u });
  });
  foot(S, S.l('Zhang et al., 2024 (GSM1k frente a GSM8K); la cifra es del estudio', 'Zhang et al., 2024 (GSM1k vs GSM8K); the figure is from the study'), { tag: S.l('esquema', 'sketch'), a: S.reveal('gsm1k', 1, 0.5) });
}

// ═════════ turno 1: dos modelos, un examen público, una parte memorizada ═════════
export interface Grid { right: boolean[]; seen: boolean[] }
const P_SEEN = order(QN, 21), P_A = order(QN, 22), P_B = order(QN, 23);
export function gridA(seen: number): Grid {
  const s = new Set(P_SEEN.slice(0, seen)), rest = P_A.filter((i) => !s.has(i)), k = Math.round(ABILITY_A * (QN - seen)), ok = new Set(rest.slice(0, k));
  return { right: Array.from({ length: QN }, (_, i) => s.has(i) || ok.has(i)), seen: Array.from({ length: QN }, (_, i) => s.has(i)) };
}
export function gridB(): Grid { const ok = new Set(P_B.slice(0, SCORE_B)); return { right: Array.from({ length: QN }, (_, i) => ok.has(i)), seen: Array.from({ length: QN }, () => false) }; }

export function drawContamGrids(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, S.portrait ? 0.55 : 0.56), dat = tone(S, 'dat'), lat = tone(S, 'lat'), err = tone(S, 'err');
  const seen = clamp(Math.round(S.p.seen ?? 0), 0, 40), A = gridA(seen), B = gridB();
  const sa = scoreA(seen), sb = SCORE_B, a = S.reveal('try1', 0.1, 0.6), m = L.main, t = L.aside;
  const gap = 12 * u, gw = (m.w - gap) / 2, legH = 22 * u;
  d.withAlpha(a, () => {
    const draw = (g: Grid, gx: number, name: string, score: number, tn: 'w' | 'sig') => {
      const head = 24 * u, r: Rect = { x: gx, y: m.y + head, w: gw, h: m.h - head - 46 * u - legH };
      d.text(name, gx + gw / 2, m.y, { size: fs(S, 15), weight: 800, color: tone(S, tn).ink, align: 'center', base: 'top' });
      const geo = cells(S, r, 10, 10, (i, x, y, cs) => {
        const ok = g.right[i], sn = g.seen[i];
        d.rect(x + 0.75, y + 0.75, cs - 1.75, cs - 1.75, { fill: ok ? alpha(dat.c, 0.78) : undefined, stroke: ok ? dat.c : p.lineStrong, lw: 1 });
        if (!ok) { d.line(x + cs * 0.3, y + cs * 0.3, x + cs * 0.7, y + cs * 0.7, alpha(err.c, 0.75), 1.3); d.line(x + cs * 0.7, y + cs * 0.3, x + cs * 0.3, y + cs * 0.7, alpha(err.c, 0.75), 1.3); }
        if (sn) d.rect(x + cs * 0.3, y + cs * 0.3, cs * 0.4, cs * 0.4, { fill: lat.c, stroke: p.stage, lw: 1 });
      }, 34);
      d.text(`${score}`, gx + gw / 2 - 16 * u, geo.y + geo.h + 6 * u, { size: fs(S, 26), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      d.text(S.l('de 100', 'of 100'), gx + gw / 2 + 8 * u, geo.y + geo.h + 16 * u, { size: fs(S, 12.5), weight: 600, color: p.mute, align: 'left', base: 'top' });
    };
    draw(A, m.x, S.l('Modelo A', 'Model A'), sa, 'w');
    draw(B, m.x + gw + gap, S.l('Modelo B', 'Model B'), sb, 'sig');
    const lx = m.x, ly = m.y + m.h - 6 * u;
    d.rect(lx, ly - 11 * u, 11 * u, 11 * u, { fill: lat.c, stroke: p.stage, lw: 1 });
    d.text(S.l('la vio al entrenarse (siempre la acierta)', 'seen in training (always right)'), lx + 17 * u, ly - 5 * u, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'middle', w: m.w - 20 * u });
  });
  // tabla: nota medida frente a capacidad real
  const rowH = Math.min((S.portrait ? 34 : 56) * u, (t.h - 90 * u) / 2), r0 = (S.portrait ? 36 : 54) * u;
  d.withAlpha(a, () => {
    d.text(S.l('Nota en el examen público', 'Score on the public exam'), t.x, t.y, { size: fs(S, 14), weight: 800, color: p.ink, base: 'top', w: t.w });
    ([['A', sa, ABILITY_A * 100, 'w'], ['B', sb, ABILITY_B * 100, 'sig']] as const).forEach(([nm, sc, real, tn], i) => {
      const cy = t.y + r0 + i * rowH, bx = t.x + 30 * u, bw = t.w - 80 * u;
      d.text(nm, t.x + 10 * u, cy, { size: fs(S, 16), weight: 800, color: tone(S, tn).ink, align: 'center', base: 'middle' });
      hbar(S, bx, cy - 10 * u, bw, 20 * u, sc / 100, tn);
      const mx = bx + bw * (real / 100);
      d.polygon([[mx, cy - 18 * u], [mx + 7 * u, cy - 11 * u], [mx, cy - 4 * u], [mx - 7 * u, cy - 11 * u]], { fill: p.ink, stroke: p.stage, lw: 1.5 });
      d.text(String(sc), bx + bw + 8 * u, cy, { size: fs(S, 17), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
    });
    const ly = t.y + r0 + 2 * rowH - 6 * u;
    d.polygon([[t.x + 10 * u, ly], [t.x + 15 * u, ly + 5 * u], [t.x + 10 * u, ly + 10 * u], [t.x + 5 * u, ly + 5 * u]], { fill: p.ink });
    d.text(S.l(`capacidad real: A ${Math.round(ABILITY_A * 100)}, B ${Math.round(ABILITY_B * 100)}`, `real ability: A ${Math.round(ABILITY_A * 100)}, B ${Math.round(ABILITY_B * 100)}`), t.x + 22 * u, ly + 5 * u, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'middle' });
    const verdict = sa > sb ? S.l('A aparece primero, pero B es mejor en tu tarea', 'A ranks first, but B is better on your task') : sa === sb ? S.l('Empate en la tabla', 'A tie in the table') : S.l('B aparece primero, y es el mejor de verdad', 'B ranks first, and it really is the best');
    d.text(verdict, t.x, ly + (S.portrait ? 20 : 26) * u, { size: fs(S, S.portrait ? 13 : 14), weight: 800, color: sa > sb ? err.ink : p.ink2, base: 'top', w: t.w });
  });
  if (!S.portrait && sa > sb && t.h > 200 * u) neu(S, t.x + t.w - 80 * u, t.y + t.h - 66 * u, { scale: 3, mood: 'think', a: 1 });
  foot(S, S.l('modelo simplificado: lo que vio, lo acierta siempre', 'simplified model: what it saw, it always gets right'), { tag: S.l('ilustrativo', 'illustrative'), a });
}

// ═════════ ley de Goodhart ═════════
export const proxy = (x: number) => 1 - Math.exp(-3.2 * x);
export const quality = (x: number) => proxy(x) - 0.9 * x * x;

export function drawGoodhart(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = layout(S, 1).all;
  const plot = new Plot(S, R, { xr: [0, 1], yr: [0, 1.34], xLabel: S.l('esfuerzo por subir la nota', 'effort to raise the score'), yLabel: S.l('valor', 'value'), pad: { l: 30, b: 40, t: 12, r: 10 } });
  plot.axes(S.reveal('goodhart', 0, 0.6));
  const sweep = S.at('goodhart', 0.4, 4.2, 'lin');
  plot.curve(proxy, 'dat', 3.4, { to: sweep });
  plot.curve(quality, 'sig', 3.4, { to: sweep });
  // la calidad real alcanza su máximo cerca de x = 0,44 (derivada de proxy − 0,9x²)
  const peak = 0.44, aPk = stag(S, 'goodhart', 0.55, 0.12);
  d.withAlpha(aPk, () => {
    plot.line(peak, 0, peak, quality(peak), 'ink', 1.5, [4, 4]);
    plot.dot(peak, quality(peak), 6, 'sig');
  });
  // leyenda arriba, donde no pasa ninguna curva: nunca tapa el trazo
  const rows: { t: string; tn: 'dat' | 'sig'; a: number; dot?: boolean }[] = [
    { t: S.l('la nota del examen (la medida)', 'the exam score (the measure)'), tn: 'dat', a: stag(S, 'goodhart', 0.3, 0.1) },
    { t: S.l('aquí la medida deja de ayudar', 'here the measure stops helping'), tn: 'sig', a: aPk, dot: true },
    { t: S.l('lo que querías (calidad real)', 'what you wanted (real quality)'), tn: 'sig', a: stag(S, 'goodhart', 0.78, 0.1) },
  ];
  rows.forEach((r, i) => {
    const y = plot.r.y + 12 * u + i * 21 * u, x = plot.r.x + 10 * u, t = tone(S, r.tn);
    d.withAlpha(r.a, () => {
      if (r.dot) d.circle(x + 11 * u, y, 5.5 * u, { fill: t.c });
      else d.line(x, y, x + 22 * u, y, t.c, 3.4);
      d.text(r.t, x + 32 * u, y, { size: fs(S, 13.5), weight: 700, color: t.ink, base: 'middle', w: plot.r.w - 44 * u });
    });
  });
  void p;
  foot(S, S.l('Forma según Gao et al., 2022 (modelos de recompensa); formulación de Strathern, 1997', 'Shape after Gao et al., 2022 (reward models); wording by Strathern, 1997'), { tag: S.l('ilustrativo', 'illustrative'), a: S.reveal('goodhart', 1, 0.5) });
}
