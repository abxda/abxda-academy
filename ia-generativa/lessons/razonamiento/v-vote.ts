// Vista 11: votar (autoconsistencia). Los 32 intentos pasan de la cuadrícula a filas, una por respuesta; gana la fila
// más larga. El control `vb` es el índice del presupuesto de los intentos que votan. Todo es lo medido (runs.ts).
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { area, chip, chipH, fitText, flat, fr, fz, int, K, mark, pct } from './ui';
import { cell, gridCells } from './parts';
import { groupBars } from './v-cot';
import { ANSWER, answers, BUDGETS, B_MAX, N_TRIES, PAPERS, tally, type L2 } from './runs';

const lg = (S: Frame) => S.lang as L2;
const MAX_ROWS = 5;

interface RowsGeo { rows: { v: number | null; n: number; y: number }[]; slot: Rect[]; labelX: number; sq: number; x0: number; rowH: number }

/** Filas por respuesta para el presupuesto `bi`: las MAX_ROWS más votadas y, si hay más, «las demás». */
function rowsGeo(S: Frame, r: Rect, bi: number): RowsGeo {
  const u = S.u, t = tally(lg(S), bi), ans = answers(lg(S), bi);
  const top = t.length > MAX_ROWS + 1 ? t.slice(0, MAX_ROWS) : t;
  const rest = t.length > MAX_ROWS + 1 ? t.slice(MAX_ROWS).reduce((s, x) => s + x.n, 0) : 0;
  const rows = [...top.map((x) => ({ v: x.v as number | null, n: x.n, y: 0 })), ...(rest ? [{ v: null, n: rest, y: 0 }] : [])];
  const k = K(S), labelW = Math.min(110 * u * k, r.w * 0.26), countW = 46 * u * k;
  const rowH = Math.min(r.h / Math.max(rows.length, 4), 52 * u * k);
  const sq = Math.max(4, Math.min((r.w - labelW - countW) / N_TRIES - 1.5 * u, rowH * 0.62));
  const off = Math.max(0, (r.h - rows.length * rowH) / 2) * 0.6;
  rows.forEach((row, i) => { row.y = r.y + off + i * rowH + rowH / 2; });
  const x0 = r.x + labelW;
  const fill = new Map<number, number>();
  const slot: Rect[] = ans.map((a) => {
    let ri = rows.findIndex((row) => row.v === a);
    if (ri < 0) ri = rows.length - 1;
    const j = fill.get(ri) ?? 0; fill.set(ri, j + 1);
    return { x: x0 + j * (sq + 1.5 * u), y: rows[ri].y - sq / 2, w: sq, h: sq };
  });
  return { rows, slot, labelX: x0 - 10 * u, sq, x0, rowH };
}

export function drawVote(S: Frame) {
  const palmA = S.between('sc-palm', 'vote-limit') ? S.at('sc-palm', 0, 0.45) : S.on('vote-limit') ? 1 - S.at('vote-limit', 0, 0.45) : 0;
  if (palmA < 0.996) S.d.withAlpha(1 - palmA, () => drawRows(S));
  if (palmA > 0.004) S.d.withAlpha(palmA, () => drawPalm(S));
}

function drawRows(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), F = flat(S), k = K(S);
  const dat = tone(S, 'dat'), err = tone(S, 'err'), hs = 13.5 * k;
  const bi = Math.round(Number(S.p.vb ?? 0)), shown = clamp(Number(S.st.vbShown ?? bi), 0, B_MAX);
  const lo = Math.floor(shown), hi = Math.min(B_MAX, lo + 1), f = shown - lo;
  // encabezado
  const headY = R.y + chipH(S, hs) / 2;
  fitText(S, S.l(`32 intentos · presupuesto: ${int(S, BUDGETS[bi])} tokens`, `32 tries · budget: ${int(S, BUDGETS[bi])} tokens`), R.x, headY, S.portrait ? R.w : R.w * 0.52, { size: hs, weight: 700, color: p.ink2, base: 'middle' });
  // el nombre
  const nm = fr(S, 'sc-name', 0.1, 0.3);
  const termY = headY + chipH(S, hs) / 2 + 6 * u + chipH(S, hs) / 2;
  if (nm > 0.01) chip(S, S.lang === 'es' ? 'autoconsistencia (self-consistency)' : 'self-consistency', R.x, termY, 'lat', { size: hs, align: 'left', a: nm, maxW: R.w });
  const bodyY = headY + chipH(S, hs) / 2 + (F ? 6 : 10) * u + (chipH(S, hs) + 6 * u) * clamp(nm * 2);
  const body: Rect = { x: R.x, y: bodyY, w: R.w, h: R.y + R.h - bodyY };
  // de la cuadrícula a las filas
  const morph = fr(S, 'vote-demo', 0.06, 0.4, 'io');
  const ans = answers(lg(S), lo), ansH = answers(lg(S), hi);
  const cells = gridCells(S, body, N_TRIES);
  const gA = rowsGeo(S, body, lo), gB = rowsGeo(S, body, hi);
  const labA = morph;
  // etiquetas de las filas (del presupuesto más cercano)
  const g = f < 0.5 ? gA : gB;
  d.withAlpha(labA, () => {
    g.rows.forEach((row) => {
      const ok = row.v === ANSWER;
      const lab = row.v === null ? S.l('los demás', 'the rest') : String(row.v);
      fitText(S, lab, g.labelX, row.y, g.x0 - R.x - 12 * u, { size: (row.v === null ? 12 : 14) * k, weight: 800, font: row.v === null ? 'ui' : 'mono', color: ok ? dat.ink : row.v === null ? p.mute : p.ink2, align: 'right', base: 'middle' });
      const end = g.x0 + row.n * (g.sq + 1.5 * u);
      fitText(S, `×${row.n}`, end + 6 * u, row.y, 50 * u, { size: 12.5 * k, weight: 800, font: 'mono', color: ok ? dat.ink : p.mute, base: 'middle' });
    });
  });
  // los 32 intentos
  for (let i = 0; i < N_TRIES; i++) {
    const a = gA.slot[i], b = gB.slot[i];
    const t: Rect = { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f), w: lerp(a.w, b.w, f), h: lerp(a.h, b.h, f) };
    const c = cells[i];
    const rr: Rect = { x: lerp(c.x, t.x, morph), y: lerp(c.y, t.y, morph), w: lerp(c.w, t.w, morph), h: lerp(c.h, t.h, morph) };
    const v = f < 0.5 ? ans[i] : ansH[i], ok = v === ANSWER;
    if (morph < 0.5) cell(S, rr, ans[i], { marks: 1, a: 1 - morph * 0.6 });
    else d.rect(rr.x, rr.y, rr.w, rr.h, ok ? { fill: alpha(dat.c, 0.75), stroke: dat.c, lw: 1 } : { fill: p.surface, stroke: err.c, lw: 1.1, dash: [2, 2] });
  }
  // quién gana la votación
  const winA = S.is('vote-demo') ? 0 : S.on('vote-why') ? fr(S, 'vote-why', 0.62, 0.78) : 0;
  if (winA > 0.01 && morph > 0.99) {
    const win = tally(lg(S), bi)[0], ok = win.v === ANSWER;
    const str = S.l(`gana la votación: ${win.v}`, `the vote picks: ${win.v}`);
    const P = S.portrait, x = R.x + R.w;
    const last = g.rows[g.rows.length - 1], y = P ? Math.min(last.y + g.rowH * 0.5 + chipH(S, 14) / 2 + 8 * u, R.y + R.h - chipH(S, 14) / 2) : headY;
    chip(S, str, x - 22 * u, y, ok ? 'dat' : 'err', { size: 14 * k, align: 'right', a: winA, maxW: P ? R.w - 30 * u : R.w * 0.45 });
    d.withAlpha(winA, () => mark(S, x - 8 * u, y, ok, 6 * u, ok ? dat.c : err.c, 2.4));
  }
}

function drawPalm(S: Frame) {
  const R = area(S), u = S.u;
  const y = groupBars(S, R, S.l('GSM8K: problemas escolares de matemáticas · % de aciertos', 'GSM8K: grade-school math problems · % correct'), [{
    name: S.l('PaLM · 540 mil millones de parámetros', 'PaLM · 540 billion parameters'), a: fr(S, 'sc-palm', 0.06, 0.2),
    bars: [
      { lab: S.l('una sola cadena', 'a single chain'), short: S.l('una cadena', 'one chain'), v: PAPERS.scSingle, txt: '≈ ' + pct(S, 57, 0), a: fr(S, 'sc-palm', 0.2, 0.4), solid: false },
      { lab: S.l('votando entre 40 cadenas', 'voting among 40 chains'), short: S.l('votando, 40', 'voting, 40'), v: PAPERS.scVote, txt: pct(S, PAPERS.scVote), a: fr(S, 'sc-palm', 0.62, 0.8), solid: true },
    ],
  }]);
  const fn = S.l('una cadena: 56.5 % (Wang et al.) y 56.9 % (Wei et al.)', 'single chain: 56.5% (Wang et al.) and 56.9% (Wei et al.)');
  if (y + fz(S, 12) * u * 1.4 < R.y + R.h) fitText(S, fn, R.x, y, R.w, { size: 12, weight: 600, color: S.pal.mute, base: 'top', italic: true, a: fr(S, 'sc-palm', 0.4, 0.55) });
}
