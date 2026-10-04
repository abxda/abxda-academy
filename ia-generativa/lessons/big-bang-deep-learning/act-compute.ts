// Acto 2: el cómputo. Multiplicar matrices, CPU frente a GPU, la carrera (conteo ideal, interactiva),
// la ocupación de núcleos y las medidas reales de Raina et al. (2009).
import { Plot, alpha, badge, clamp, lerp, matrix, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { RAINA } from './facts';
import { CPU_CORES, GPUS, MA, MB, MC, raceModel, raceProgress, type Hardware } from './model';
import { cellRange, coreGrid, dec, fa, fmtInt, mark, pct, strip } from './shared';

// ═════════ C = A·B con una celda resaltada, luego todas a la vez ═════════
export function drawMatmul(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1), k = S.is('matmul') || !S.on('parallel') ? 'matmul' : 'parallel';
  const vertical = S.portrait, opW = 26 * u;
  const cs = vertical
    ? Math.floor(Math.min((B.w - opW) / 8, (B.h - 118 * u) / 8, 44 * u))
    : Math.floor(Math.min((B.w - 2 * opW - 8 * u) / 12, (B.h - 112 * u) / 4, 58 * u));
  const gw = 4 * cs;
  const ax = vertical ? B.x + (B.w - (2 * gw + opW)) / 2 : B.x + (B.w - (3 * gw + 2 * opW)) / 2, ay = B.y + 22 * u;
  const bx = ax + gw + opW, by = ay;
  const cx = vertical ? B.x + (B.w - gw) / 2 : bx + gw + opW, cy = vertical ? ay + gw + 58 * u : ay;
  const I = 1, J = 2;                                    // celda de ejemplo: fila 2, columna 3 (índices 1 y 2)
  const aA = fa(S, 'matmul', 0.02, 0.14), aB = fa(S, 'matmul', 0.14, 0.26), aC = fa(S, 'matmul', 0.28, 0.4);
  const hot = fa(S, 'matmul', 0.42, 0.55), calc = fa(S, 'matmul', 0.58, 0.72);
  const all = k === 'parallel' ? fa(S, 'parallel', 0.3, 0.5) : 0;
  const names: [string, number, number, number, 'w' | 'dat' | 'sig'][] = [[S.l('pesos', 'weights'), ax, aA, gw, 'w'], [S.l('datos', 'data'), bx, aB, gw, 'dat'], [S.l('resultado', 'result'), cx, aC, gw, 'sig']];
  const gy = (i: number) => (i === 2 ? cy : ay);
  names.forEach(([nm, x, a, w, t], i) => d.withAlpha(a, () => d.text(nm, x + w / 2, gy(i) - 8 * u, { size: 13, weight: 700, color: tone(S, t).ink, align: 'center', base: 'bottom' })));
  matrix(S, ax, ay, MA, { cell: cs / u, tone: 'w', a: aA, hotRows: hot > 0.5 ? [I] : undefined, fmt: (v) => String(v), range: [0, 4] });
  matrix(S, bx, by, MB, { cell: cs / u, tone: 'dat', a: aB, hotCols: hot > 0.5 ? [J] : undefined, fmt: (v) => String(v), range: [0, 4] });
  d.withAlpha(Math.min(aA, aB), () => {
    d.text('×', ax + gw + opW / 2, ay + gw / 2, { size: 26, weight: 800, color: p.mute, align: 'center', base: 'middle' });
    if (vertical) d.text('=', cx + gw / 2, cy - 30 * u, { size: 26, weight: 800, color: p.mute, align: 'center', base: 'middle' });
    else d.text('=', bx + gw + opW / 2, by + gw / 2, { size: 26, weight: 800, color: p.mute, align: 'center', base: 'middle' });
  });
  // C: celdas vacías; la de ejemplo (y luego todas) con su valor
  const sig = tone(S, 'sig');
  d.withAlpha(aC, () => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const on = (i === I && j === J) ? calc : all, x = cx + j * cs, y = cy + i * cs;
      d.rect(x, y, cs - 2, cs - 2, { fill: alpha(sig.c, 0.06 + 0.5 * on * (MC[i][j] / 13)), stroke: on > 0.5 ? undefined : p.line, lw: 1 });
      if (on > 0.4) d.text(String(MC[i][j]), x + (cs - 2) / 2, y + (cs - 2) / 2, { size: Math.min(15, (cs * 0.4) / u), font: 'mono', weight: 700, color: p.ink, align: 'center', base: 'middle', a: on });
    }
    if (hot > 0.3) d.rect(cx + J * cs - 2, cy + I * cs - 2, cs + 2, cs + 2, { stroke: p.ink, lw: 2.5, a: hot });
  });
  // la cuenta de esa celda
  if (calc > 0) d.withAlpha(calc, () => {
    const row = MA[I], col = MB.map((r) => r[J]);
    const txt = row.map((v, q) => `${v}·${col[q]}`).join(' + ') + ` = ${MC[I][J]}`;
    const ty = vertical ? cy + gw + 22 * u : ay + gw + 22 * u;
    d.text(txt, B.x + B.w / 2, ty, { size: 16, weight: 800, font: 'mono', color: tone(S, 'sig').ink, align: 'center', base: 'middle' });
  });
  // 16 celdas, 16 tareas independientes
  if (k === 'parallel') {
    const a = fa(S, 'parallel', 0.5, 0.65);
    d.withAlpha(a, () => badge(S, S.l('16 celdas = 16 tareas independientes', '16 cells = 16 independent tasks'), B.x + B.w / 2, B.y + B.h - 14 * u, { tone: 'sig' }));
  }
  d.withAlpha(Math.min(aA, aB), () => d.text(S.l('números de juguete', 'toy numbers'), B.x + B.w - 2 * u, B.y + 4 * u, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'top' }));
}

// ═════════ CPU frente a GPU: pocos núcleos grandes, miles pequeños ═════════
export function drawCores(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1), vertical = S.portrait;
  const chips: { t: 'sig' | 'dat' | 'lat'; es: string; en: string; sub: [string, string]; n: number; at: number; maxCell?: number }[] = [
    { t: 'sig', es: 'CPU', en: 'CPU', sub: ['8 núcleos (supuesto ilustrativo)', '8 cores (illustrative assumption)'], n: CPU_CORES, at: 0.05, maxCell: 40 * u },
    { t: 'dat', es: 'GPU GTX 580 · 2010', en: 'GPU GTX 580 · 2010', sub: [`${fmtInt(S, GPUS.gtx580.cores)} núcleos`, `${fmtInt(S, GPUS.gtx580.cores)} cores`], n: GPUS.gtx580.cores, at: 0.3 },
    { t: 'lat', es: 'GPU RTX 3060 · 2021', en: 'GPU RTX 3060 · 2021', sub: [`${fmtInt(S, GPUS.rtx3060.cores)} núcleos`, `${fmtInt(S, GPUS.rtx3060.cores)} cores`], n: GPUS.rtx3060.cores, at: 0.55 },
  ];
  const gap = 12 * u;
  const cw = vertical ? B.w : (B.w - 2 * gap) / 3, ch = vertical ? (B.h - 2 * gap) / 3 : B.h;
  chips.forEach((c, i) => {
    const a = fa(S, 'cores', c.at, c.at + 0.14);
    if (a <= 0) return;
    const x = vertical ? B.x : B.x + i * (cw + gap), y = vertical ? B.y + i * (ch + gap) : B.y, tc = tone(S, c.t);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: alpha(tc.c, 0.05), stroke: alpha(tc.c, 0.7), lw: 1.5, r: 3 });
      if (vertical) {
        const lw = Math.min(132 * u, cw * 0.4);
        d.text(S.l(c.es, c.en), x + 8 * u, y + 12 * u, { size: 13, weight: 800, color: tc.ink, base: 'top', w: lw - 8 * u });
        d.text(S.l(c.sub[0], c.sub[1]), x + 8 * u, y + ch - 10 * u, { size: 12, weight: 600, color: p.ink2, base: 'bottom', w: lw - 8 * u });
        coreGrid(S, { x: x + lw, y: y + 8 * u, w: cw - lw - 8 * u, h: ch - 16 * u }, c.n, c.t, { maxCell: c.maxCell });
      } else {
        d.text(S.l(c.es, c.en), x + cw / 2, y + 12 * u, { size: 14, weight: 800, color: tc.ink, align: 'center', base: 'top', w: cw - 8 * u });
        coreGrid(S, { x: x + 10 * u, y: y + 44 * u, w: cw - 20 * u, h: ch - 96 * u }, c.n, c.t, { maxCell: c.maxCell });
        d.text(S.l(c.sub[0], c.sub[1]), x + cw / 2, y + ch - 12 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'bottom', w: cw - 8 * u });
      }
    });
  });
}

// ═════════ la carrera interactiva (conteo ideal) ═════════
export interface RaceState { t: number; n: number; hw: Hardware['id']; done: boolean }
export interface RaceSeen { small: boolean; big: boolean }
export const RACE_DEFAULT = { n: 48, hw: 'gtx580' as Hardware['id'] };

/** Carrera que se muestra: la de la persona (st.race) o, si todavía no tocó nada, una de demostración guiada por el tiempo del segmento. */
function currentRace(S: Frame): { n: number; hw: Hardware['id']; t: number; user: boolean } {
  const r = S.st.race as RaceState | undefined;
  if (r) return { n: r.n, hw: r.hw, t: r.t, user: true };
  return { n: S.p.n ?? RACE_DEFAULT.n, hw: (S.p.hw ?? RACE_DEFAULT.hw) as Hardware['id'], t: S.since('race-try') - 0.3, user: false };
}

export function raceUpdate(S: Frame) {
  if (!S.between('race-try', 'race-lesson')) return;
  const n = Math.round(S.p.n ?? RACE_DEFAULT.n), hw = (S.p.hw ?? RACE_DEFAULT.hw) as Hardware['id'];
  const last = S.st.raceLast as { n: number; hw: string } | undefined;
  if (!last) S.st.raceLast = { n, hw };
  else if (last.n !== n || last.hw !== hw) { S.st.raceLast = { n, hw }; S.st.race = { t: 0, n, hw, done: false } as RaceState; }
  const r = S.st.race as RaceState | undefined;
  if (r) {
    r.t += S.dt;
    const m = raceModel(r.n, r.hw);
    if (!r.done && r.t >= m.totalSec + 0.3) {
      r.done = true;
      const seen: RaceSeen = (S.st.raceSeen ??= { small: false, big: false });
      if (r.n <= 8) seen.small = true;
      if (r.n >= 64) seen.big = true;
      if (seen.small && seen.big) S.complete('race');
    }
  }
}
export function raceAction(S: Frame, id: string) {
  if (id !== 'again') return;
  const n = Math.round(S.p.n ?? RACE_DEFAULT.n), hw = (S.p.hw ?? RACE_DEFAULT.hw) as Hardware['id'];
  S.st.raceLast = { n, hw };
  S.st.race = { t: 0, n, hw, done: false } as RaceState;
}

/** Un carril de la carrera: título, cuadrícula n×n con avance y cifras. */
function lane(S: Frame, r: Rect, o: { title: string; cores: number; coresNote: string; cells: number; n: number; b: number; tn: 'sig' | 'dat' | 'lat'; steps: number; showUtil?: number; gpu?: boolean }) {
  const { d, pal: p } = S, u = S.u, tc = tone(S, o.tn);
  const vertical = S.portrait;
  const titleH = 22 * u, statH = vertical ? 0 : 54 * u;
  const side = vertical ? Math.min(r.h - 4 * u, r.w * 0.42) : Math.min(r.w, r.h - titleH - statH - 6 * u);
  const gx = vertical ? r.x : r.x + (r.w - side) / 2, gy = vertical ? r.y + 2 * u : r.y + titleH;
  const cell = side / o.n, gap = cell >= 4 ? 1 : 0;
  const pr = raceProgress(o.cells, o.cores, o.b);
  d.rect(gx, gy, side, side, { fill: p.surface2 });
  cellRange(S, gx, gy, o.n, cell, gap, 0, pr.done, tc.c);
  cellRange(S, gx, gy, o.n, cell, gap, pr.done, pr.done + pr.live, alpha(tc.c, 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(S.clock * 8))));
  d.rect(gx, gy, side, side, { stroke: tc.c, lw: 1.5 });
  const frac = pr.done / o.cells;
  // título
  const tx = vertical ? gx + side + 12 * u : r.x + r.w / 2, ty = vertical ? r.y + 6 * u : r.y + titleH / 2;
  d.text(o.title, tx, ty, { size: 14, weight: 800, color: tc.ink, align: vertical ? 'left' : 'center', base: vertical ? 'top' : 'middle' });
  // cifras
  const lines: [string, string, boolean?][] = [
    [S.l('núcleos', 'cores'), o.coresNote],
    [S.l('pasos ideales', 'ideal steps'), fmtInt(S, o.steps)],
    [S.l('celdas hechas', 'cells done'), pct(S, frac * 100, frac < 0.1 && frac > 0 ? 1 : 0)],
  ];
  if (o.showUtil !== undefined) lines[0] = [S.l('núcleos con trabajo', 'cores with work'), pct(S, o.showUtil * 100, 0)];
  const sx = vertical ? tx : r.x + 4 * u, sy = vertical ? r.y + 30 * u : gy + side + 8 * u, lh = 16 * u;
  lines.forEach(([l, v], i) => {
    if (vertical) {
      d.text(l, sx, sy + i * lh * 1.55, { size: 12, weight: 600, color: p.mute, base: 'top' });
      d.text(v, r.x + r.w, sy + i * lh * 1.55, { size: 13, weight: 700, font: 'mono', color: p.ink, align: 'right', base: 'top' });
    } else {
      d.text(l, sx, sy + i * lh, { size: 12, weight: 600, color: p.mute, base: 'top' });
      d.text(v, r.x + r.w - 4 * u, sy + i * lh, { size: 13, weight: 700, font: 'mono', color: p.ink, align: 'right', base: 'top' });
    }
  });
}

export function drawRace(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1), vertical = S.portrait;
  const cur = currentRace(S), m = raceModel(cur.n, cur.hw), t = Math.max(0, cur.t), b = t / m.secPerBatch;
  const g = GPUS[cur.hw], gap = 12 * u;
  const banner = 30 * u;
  const body: Rect = { x: B.x, y: B.y, w: B.w, h: B.h - banner };
  const laneW = vertical ? body.w : (body.w - gap) / 2, laneH = vertical ? (body.h - gap) / 2 : body.h;
  const cpu: Rect = { x: body.x, y: body.y, w: laneW, h: laneH }, gpu: Rect = vertical ? { x: body.x, y: body.y + laneH + gap, w: laneW, h: laneH } : { x: body.x + laneW + gap, y: body.y, w: laneW, h: laneH };
  lane(S, cpu, { title: S.l('CPU · 8 núcleos', 'CPU · 8 cores'), cores: CPU_CORES, coresNote: S.l('8 (supuesto)', '8 (assumed)'), cells: m.cells, n: cur.n, b, tn: 'sig', steps: m.stepsCpu });
  lane(S, gpu, { title: `${g.name} · ${fmtInt(S, g.cores)} ${S.l('núcleos', 'cores')}`, cores: g.cores, coresNote: fmtInt(S, g.cores), cells: m.cells, n: cur.n, b, tn: 'dat', steps: m.stepsGpu, showUtil: m.util, gpu: true });
  // pie: n, celdas y ventaja cuando termina la GPU
  const fin = b >= m.nbGpu;
  const by = B.y + B.h - banner / 2;
  d.text(`n = ${cur.n}  ·  ${fmtInt(S, m.cells)} ${S.l('celdas', 'cells')}`, B.x + 2 * u, by, { size: 13, weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
  if (fin) d.withAlpha(clamp((b - m.nbGpu) / 0.4 + 0.2), () => {
    const lab = S.l(`la GPU necesita ${dec(S, m.speedup, m.speedup < 10 ? 1 : 0)}× menos pasos`, `the GPU needs ${dec(S, m.speedup, m.speedup < 10 ? 1 : 0)}× fewer steps`);
    badge(S, lab, B.x + B.w - 2 * u, by, { tone: 'dat', align: 'right', size: 13 });
  });
  if (!cur.user) d.withAlpha(fa(S, 'race-try', 0.5, 0.65) * 0.9, () => d.text(S.l('conteo ideal, no un cronómetro', 'ideal count, not a stopwatch'), B.x + B.w / 2, B.y + B.h - banner - 2 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom' }));
  void lerp; void mark;
}

// ═════════ ocupación de núcleos según el tamaño ═════════
export function drawOccupancy(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1);
  const plot = new Plot(S, { x: B.x, y: B.y, w: B.w, h: B.h - 34 * u }, { xr: [0, 96], yr: [0, 105], xLabel: S.l('tamaño n de la matriz', 'matrix size n'), yLabel: S.l('núcleos de la GPU con trabajo', 'GPU cores with work'), xTicks: [8, 32, 64, 96], yTicks: [0, 50, 100], tickFmt: (v) => String(v), pad: { l: 40, t: 18 } });
  const a = fa(S, 'race-lesson', 0.04, 0.16);
  plot.axes(a);
  const util = (n: number, P: number) => 100 * Math.min(1, (n * n) / P);
  const prog = fa(S, 'race-lesson', 0.12, 0.6, 'io');
  const hws: Hardware['id'][] = ['gtx580', 'rtx3060'];
  hws.forEach((id, i) => {
    const P = GPUS[id].cores, t = tone(S, i === 0 ? 'dat' : 'lat');
    plot.curve((n) => util(n, P), i === 0 ? 'dat' : 'lat', 3, { to: 96 * prog, dash: i === 1 ? [7, 5] : undefined, n: 160 });
    if (prog > 0.95) {
      const nsat = Math.sqrt(P);
      plot.dot(nsat, 100, 5, i === 0 ? 'dat' : 'lat', { ring: true });
      d.text(`${GPUS[id].name}`, plot.X(Math.min(94, nsat + (i === 0 ? 3 : 4))), plot.Y(100) - (i === 0 ? 10 : -16) * u, { size: 12, weight: 800, color: t.ink, base: 'middle', halo: p.stage, haloW: 4 });
    }
  });
  // marcas de la carrera: n = 8 y n = 64
  const mk = fa(S, 'race-lesson', 0.55, 0.7);
  if (mk > 0) d.withAlpha(mk, () => {
    [8, 64].forEach((n) => {
      plot.line(n, 0, n, 105, 'mute', 1.5, [4, 4]);
      hws.forEach((id, i) => plot.dot(n, util(n, GPUS[id].cores), 4.5, i === 0 ? 'dat' : 'lat'));
    });
    const y8 = plot.Y(util(8, 512));
    d.text(S.l('n = 8: casi ociosos', 'n = 8: mostly idle'), plot.X(8) + 8 * u, Math.min(plot.r.y + plot.r.h - 14 * u, y8 - 18 * u), { size: 12, weight: 700, color: p.ink2, base: 'middle', halo: p.stage, haloW: 4 });
    d.text(S.l('n = 64: todos trabajan', 'n = 64: all at work'), plot.X(64) - 8 * u, plot.Y(40), { size: 12, weight: 700, color: p.ink2, align: 'right', base: 'middle', halo: p.stage, haloW: 4 });
  });
  // pie: ventaja ideal máxima
  const f = fa(S, 'race-lesson', 0.7, 0.85);
  d.withAlpha(f, () => d.text(S.l('ventaja ideal máxima = núcleos de la GPU ÷ 8: 64× y 448×', 'maximum ideal advantage = GPU cores ÷ 8: 64× and 448×'), B.x + B.w / 2, B.y + B.h - 6 * u, { size: 13, weight: 700, color: p.ink, align: 'center', base: 'bottom', w: B.w }));
}

// ═════════ lo medido: Raina, Madhavan y Ng (2009) ═════════
export function drawRaina(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 1), vertical = S.portrait;
  const top = B.y + 6 * u, foot = 40 * u, area = { x: B.x, y: top, w: B.w, h: B.h - foot - 6 * u };
  const max = 80, n = RAINA.length;
  const tc = tone(S, 'dat');
  if (vertical) {
    const rh = area.h / n, lw = 96 * u;
    RAINA.forEach((r, i) => {
      const a = fa(S, 'race-real', 0.2 + i * 0.12, 0.32 + i * 0.12), y = area.y + i * rh;
      d.withAlpha(a, () => {
        d.text(`${dec(S, r.weights / 1e6, r.weights < 1e6 ? 1 : 1)} ${S.l('M pesos', 'M weights')}`, area.x, y + rh / 2, { size: 12, weight: 700, color: p.ink2, base: 'middle' });
        const bw = (area.w - lw - 60 * u) * (r.speedup / max) * a;
        d.rect(area.x + lw, y + rh * 0.2, bw, rh * 0.5, { fill: alpha(tc.c, 0.55), stroke: tc.c, lw: 1.5 });
        d.text(`${dec(S, r.speedup, 1)}×`, area.x + lw + bw + 6 * u, y + rh * 0.45, { size: 14, weight: 800, font: 'mono', color: tc.ink, base: 'middle' });
      });
    });
  } else {
    const cw = area.w / n, base = area.y + area.h - 34 * u, hh = area.h - 34 * u - 22 * u;
    d.line(area.x + 10 * u, base, area.x + area.w - 10 * u, base, p.lineStrong, 1.5);
    RAINA.forEach((r, i) => {
      const a = fa(S, 'race-real', 0.2 + i * 0.12, 0.32 + i * 0.12), x = area.x + i * cw + cw * 0.2, w = cw * 0.6, h = hh * (r.speedup / max) * a;
      d.withAlpha(a, () => {
        d.rect(x, base - h, w, h, { fill: alpha(tc.c, 0.55), stroke: tc.c, lw: 1.5 });
        d.text(`${dec(S, r.speedup, 1)}×`, x + w / 2, base - h - 6 * u, { size: 16, weight: 800, font: 'mono', color: tc.ink, align: 'center', base: 'bottom' });
        d.text(`${dec(S, r.weights / 1e6, 1)} ${S.l('M pesos', 'M weights')}`, x + w / 2, base + 8 * u, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'top' });
      });
    });
  }
  d.withAlpha(fa(S, 'race-real', 0.1, 0.25), () => {
    d.text(S.l('medido: GPU GTX 280 contra CPU de dos núcleos (Raina et al., 2009)', 'measured: GTX 280 GPU vs dual-core CPU (Raina et al., 2009)'), B.x + B.w / 2, B.y + B.h - 4 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom', w: B.w });
  });
}
