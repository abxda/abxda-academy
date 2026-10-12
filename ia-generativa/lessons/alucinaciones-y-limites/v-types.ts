// Vista 4 · tres familias de error (types, cutoff, cutoff-ex, reason). Ejemplos medidos en Pythia-1.4B:
// inventar (Pedro Páramo, real-data.ts), desactualizarse (Mundial 2022, cutoff-data.ts; The Pile termina en 2020) y razonar mal
// (40 multiplicaciones de tres por dos cifras, real-data.ts ARITH). Unas pestañas arriba dicen en cuál de las tres vamos.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ARITH } from './real-data';
import { CUTOFF } from './cutoff-data';
import { FS, LH, area, card, chip, chipH, fitText, fr, mark, para, pct, smooth, stat, tabs, tight } from './ui';

export function drawTypes(S: Frame) {
  const A = area(S), u = S.u;
  const fam = S.on('reason') ? 2 : S.on('cutoff') ? 1 : 0;
  const items: { label: string; t: Tone; on: number; hot: number }[] = [
    { label: S.l('1 · Inventar', '1 · Inventing'), t: 'err', on: fr(S, 'types', 0.02, 0.12), hot: fam === 0 ? 1 : 0 },
    { label: S.l('2 · Desactualizarse', '2 · Going stale'), t: 'w', on: fr(S, 'cutoff', 0, 0.1), hot: fam === 1 ? 1 : 0 },
    { label: S.l('3 · Razonar mal', '3 · Reasoning badly'), t: 'sig', on: fr(S, 'reason', 0, 0.1), hot: fam === 2 ? 1 : 0 },
  ];
  const th = tabs(S, A, items);
  const P: Rect = { x: A.x, y: A.y + th + 12 * u, w: A.w, h: A.h - th - 12 * u };
  const a0 = 1 - smooth(fr(S, 'cutoff', 0, 0.08)), a1 = S.on('cutoff') ? smooth(fr(S, 'cutoff', 0, 0.1)) * (1 - smooth(fr(S, 'reason', 0, 0.08))) : 0, a2 = S.on('reason') ? smooth(fr(S, 'reason', 0, 0.1)) : 0;
  if (a0 > 0.01) S.d.withAlpha(a0, () => drawInvent(S, P));
  if (a1 > 0.01) S.d.withAlpha(a1, () => drawStale(S, P));
  if (a2 > 0.01) S.d.withAlpha(a2, () => drawReason(S, P));
}

/** Alto de las tres filas de qa(). */
function qaH(S: Frame, r: Rect) {
  const u = S.u, pad = 12 * u, vert = S.portrait || r.w < 520 * u, lh = LH(S, FS(S, 15), 1.5);
  return vert ? 2 * pad + 3 * lh + 3 * LH(S, FS(S, 12), 1.2) - LH(S, FS(S, 12), 0.1) : 2 * pad + 3 * lh;
}
/** Fila «pregunta → respuesta del modelo ✗ → la correcta ✓». */
function qa(S: Frame, r: Rect, q: string, bad: string, good: string, a: number[], o: { mono?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, pad = 12 * u;
  const vert = S.portrait || r.w < 520 * u;
  const sz = FS(S, 15), lh = LH(S, sz, 1.5);
  const lw = vert ? 0 : Math.min(r.w * 0.22, 130 * u);
  const rowsY = [0, 1, 2].map((i) => r.y + pad + (vert ? i * (lh + LH(S, FS(S, 12), 1.2)) : i * lh));
  const labels = [S.l('Pregunta', 'Question'), 'Pythia', S.l('Correcta', 'Correct')];
  const vals = [q, bad, good];
  rowsY.forEach((y, i) => d.withAlpha(a[i] ?? 1, () => {
    const lx = r.x + pad, vx = vert ? lx : lx + lw, vy = vert ? y + LH(S, FS(S, 12), 1.1) + lh / 2 : y + lh / 2;
    fitText(S, labels[i], lx, vert ? y + 6 * u : vy, vert ? r.w - 2 * pad : lw - 8 * u, 12, { weight: 700, color: p.mute });
    const t = i === 0 ? p.ink : i === 1 ? tone(S, 'err').ink : tone(S, 'dat').ink;
    const w = r.x + r.w - pad - vx - (i ? 26 * u : 0);
    fitText(S, vals[i], vx, vy, w, 16, { weight: i ? 800 : 600, color: t, font: o.mono ? 'mono' : 'ui' });
    if (i) mark(S, r.x + r.w - pad - 9 * u, vy, i === 2, 6.5);
  }));
  const last = rowsY[2] + (vert ? LH(S, FS(S, 12), 1.1) + lh : lh);
  return last - r.y + pad;
}

function drawInvent(S: Frame, P: Rect) {
  const { pal: p } = S, u = S.u;
  const head = fr(S, 'types', 0.1, 0.22);
  const hh = para(S, S.l('El dato no está en el modelo, y lo fabrica.', 'The fact is not in the model, so it makes one up.'), P.x, P.y, P.w, FS(S, 16), { weight: 800, a: head, maxLines: 2 });
  const r: Rect = { x: P.x, y: P.y + hh + 10 * u, w: P.w, h: 0 };
  const a = [fr(S, 'types', 0.4, 0.5), fr(S, 'types', 0.5, 0.6), fr(S, 'types', 0.6, 0.7)];
  r.h = qaH(S, r);
  S.d.withAlpha(a[0], () => card(S, r, { fill: alpha(p.surface, 0.5) }));
  qa(S, r, S.l('¿Quién escribió Pedro Páramo?', 'Who wrote Pedro Páramo?'), 'Pablo Neruda', 'Juan Rulfo', a);
  const y = r.y + r.h + 14 * u, b = fr(S, 'types', 0.75, 0.86);
  if (y + chipH(S, 13) < P.y + P.h) chip(S, S.l('y los seis casos judiciales de Nueva York', 'and the six New York court cases'), P.x, y + chipH(S, 13) / 2, 'err', { align: 'left', a: b, size: 13, maxW: P.w });
}

function drawStale(S: Frame, P: Rect) {
  const { d, pal: p } = S, u = S.u, small = tight(S);
  const head = fr(S, 'cutoff', 0.08, 0.2);
  const hh = para(S, S.l('Lo posterior a sus datos, no lo sabe.', 'What came after its data, it does not know.'), P.x, P.y, P.w, FS(S, 16), { weight: 800, a: head, maxLines: 2 });
  // línea de tiempo: 2013 … 2026; datos hasta 2020; corte; después, zona punteada
  const y0 = P.y + hh + (small ? 46 : 56) * u, x0 = P.x + 8 * u, x1 = P.x + P.w - 8 * u;
  const Y0 = 2013, Y1 = 2026, X = (yr: number) => x0 + ((yr - Y0) / (Y1 - Y0)) * (x1 - x0), cut = X(CUTOFF.dataEnd + 1);
  const band = fr(S, 'cutoff', 0.25, 0.45), cutA = fr(S, 'cutoff', 0.5, 0.62), after = fr(S, 'cutoff', 0.65, 0.78);
  const bh = 14 * u;
  d.withAlpha(band, () => {
    d.rect(x0, y0, (cut - x0) * smooth(band), bh, { fill: tone(S, 'w').c, r: 2 });
    fitText(S, S.l('textos de entrenamiento', 'training texts'), x0, y0 - 10 * u, cut - x0, 12.5, { weight: 700, color: tone(S, 'w').ink });
    for (const yr of [2013, 2020, 2026]) {
      const x = yr === 2020 ? cut : X(yr);
      d.text(String(yr), x, y0 + bh + 8 * u, { size: FS(S, 12), weight: 600, font: 'mono', color: p.mute, align: yr === 2013 ? 'left' : yr === 2026 ? 'right' : 'center', base: 'top' });
    }
  });
  d.withAlpha(after, () => {
    d.rect(cut, y0, x1 - cut, bh, { stroke: p.lineStrong, lw: 1.4, dash: [4, 3], r: 2 });
    fitText(S, S.l('después: no lo sabe', 'after: unknown'), x1, y0 - 10 * u, x1 - cut, 12.5, { weight: 700, color: p.mute, align: 'right', a: 1 - fr(S, 'cutoff-ex', 0, 0.12) });
  });
  d.withAlpha(cutA, () => {
    d.line(cut, y0 - 6 * u, cut, y0 + bh + 6 * u, p.ink, 2.5);
    chip(S, S.l('corte de conocimiento', 'knowledge cutoff'), cut, y0 + bh + 40 * u, 'ink', { size: 12.5, maxW: Math.min(P.w, 2 * Math.min(cut - P.x, P.x + P.w - cut)) });
  });
  // la pregunta del Mundial 2022 (cutoff-ex)
  if (!S.on('cutoff-ex')) return;
  const m = fr(S, 'cutoff-ex', 0.03, 0.15), x22 = X(2022);
  d.withAlpha(m, () => {
    d.circle(x22, y0 + bh / 2, 6 * u, { fill: tone(S, 'sig').c, stroke: S.pal.stage, lw: 2 });
    d.line(x22, y0 - 22 * u, x22, y0, tone(S, 'sig').c, 1.5);
    const lw = S.d.measure(S.l('Mundial 2022', '2022 World Cup'), { size: FS(S, 12.5), weight: 800 }) + 4 * u;
    fitText(S, S.l('Mundial 2022', '2022 World Cup'), Math.min(x22, x1 - lw / 2), y0 - 32 * u, lw, 12.5, { weight: 800, color: tone(S, 'sig').ink, align: 'center' });
  });
  const ry = y0 + bh + 62 * u;
  const r: Rect = { x: P.x, y: ry, w: P.w, h: P.y + P.h - ry };
  const a = [fr(S, 'cutoff-ex', 0.1, 0.2), fr(S, 'cutoff-ex', 0.35, 0.45), fr(S, 'cutoff-ex', 0.62, 0.72)];
  const ans = S.l(`Alemania (${pct(S, CUTOFF.p, 0)})`, `Germany (${pct(S, CUTOFF.p, 0)})`);
  if (r.h > 60 * u) qa(S, r, S.l('¿Quién ganó el Mundial 2022?', 'Who won the 2022 World Cup?'), ans, 'Argentina', a);
}

function drawReason(S: Frame, P: Rect) {
  const { pal: p } = S, u = S.u;
  const it = ARITH.items[0];
  const head = fr(S, 'reason', 0.08, 0.2);
  const hh = para(S, S.l('Los datos están, pero falla la cadena de pasos.', 'The facts are there, but the chain of steps fails.'), P.x, P.y, P.w, FS(S, 16), { weight: 800, a: head, maxLines: 2 });
  const r: Rect = { x: P.x, y: P.y + hh + 10 * u, w: P.w, h: P.h - hh - 10 * u };
  const a = [fr(S, 'reason', 0.25, 0.35), fr(S, 'reason', 0.38, 0.48), fr(S, 'reason', 0.5, 0.6)];
  const h = qa(S, r, `${it.a} × ${it.b}`, S.n(Number(it.ans), 0), S.n(it.gold, 0), a, { mono: true });
  const right = Math.round(ARITH.acc * ARITH.n);
  const sy = r.y + h + 8 * u;
  if (sy + 50 * u < P.y + P.h) stat(S, P.x, sy, S.l('multiplicaciones correctas', 'multiplications right'), S.l(`${right} de ${ARITH.n}`, `${right} of ${ARITH.n}`), 'err', { size: 28, w: P.w, a: fr(S, 'reason', 0.72, 0.84) });
  void p;
}
