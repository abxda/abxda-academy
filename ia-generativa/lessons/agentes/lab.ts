// Acto 4 y 5 · el laboratorio de fiabilidad: una cadena de pasos, cien corridas simuladas de verdad (rel.ts),
// la curva p^n y los puntos de control. Todo es función pura de S.t y de los controles.
import { alpha, clamp, inset, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { COST, P_DEFAULT, costAttempt, costPerSuccess, n50, simulate, stats, tokensRead, type RunOut } from './rel';
import { FS, T, big, glyph, lineH, pill, smooth } from './ui';

const area = (S: Frame) => inset(S.full(), 14 * S.u);

// ═════════════════════════════════════════════════════════════════════════
// Cadena de pasos (chain, compound)
// ═════════════════════════════════════════════════════════════════════════
export function drawChain(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12), dat = tone(S, 'dat'), err = tone(S, 'err');
  const cs = Math.min(all.w / (10 * 1.22 - 0.22), 46 * u), gap = cs * 0.22, rowW = 10 * cs + 9 * gap, x0 = all.x + (all.w - rowW) / 2;
  const compound = S.on('compound');
  const head = 56 * u, rowH = cs + lh * 1.3 + 8 * u, y1 = all.y + head, y2 = y1 + rowH + 10 * u;
  const nowRow2 = compound ? S.at('compound', 4.6, 5.0) : 0;
  const cum = (i: number) => Math.pow(P_DEFAULT, i + 1);
  // cabecera: la cifra grande
  const ten = compound && S.on('compound') ? S.at('compound', 3.4, 3.9) : 0, twenty = compound ? S.at('compound', 8.0, 8.5) : 0;
  d.withAlpha(S.reveal('chain', 0.2, 0.5), () => {
    if (!compound) { T(S, '95 %', all.x, all.y + 6 * u, { size: 36, weight: 800, font: 'mono', color: dat.ink }); T(S, S.l('por paso', 'per step'), all.x + 126 * u, all.y + 22 * u, { size: 14, weight: 700, color: p.ink2 }); }
  });
  if (compound) {
    const n = twenty > 0.5 ? 20 : 10, val = cum(n - 1), a = n === 20 ? twenty : ten;
    d.withAlpha(Math.max(a, 0), () => {
      T(S, `0.95${n === 20 ? '²⁰' : '¹⁰'} ≈ ${S.n(val, 2)}`, all.x, all.y + 20 * u, { size: 18, weight: 800, font: 'mono' });
      T(S, `≈ ${Math.round(val * 100)} %`, all.x + all.w, all.y + 4 * u, { size: 38, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'right' });
      T(S, S.l(`los ${n} pasos bien`, `all ${n} steps right`), all.x + all.w, all.y + 4 * u + 40 * u, { size: 12, weight: 700, color: p.ink2, align: 'right' });
    });
  }
  const square = (i: number, x: number, y: number, a: number) => {
    d.withAlpha(a, () => {
      d.rect(x, y, cs, cs, { fill: alpha(dat.c, 0.16), stroke: dat.c, lw: 1.8, r: 3 });
      glyph(S, 'check', x + cs / 2, y + cs / 2, cs * 0.5, dat.c);
    });
    const cr = compound ? S.at('compound', 0.5 + (i < 10 ? i * 0.3 : 4.3 + (i - 10) * 0.25), 0.9 + (i < 10 ? i * 0.3 : 4.3 + (i - 10) * 0.25), 'out') : 0;
    const one = 1 - cr;
    d.withAlpha(a, () => {
      if (one > 0.02) T(S, '95', x + cs / 2, y + cs + 4 * u, { size: 12, font: 'mono', color: p.mute, align: 'center', a: one });
      if (cr > 0.02) T(S, String(Math.round(cum(i) * 100)), x + cs / 2, y + cs + 4 * u, { size: 12, weight: 800, font: 'mono', color: cum(i) < 0.5 ? err.ink : p.ink, align: 'center', a: cr });
    });
  };
  for (let i = 0; i < 10; i++) square(i, x0 + i * (cs + gap), y1, S.reveal('chain', 0.4 + i * 0.25, 0.4));
  if (compound) for (let i = 10; i < 20; i++) square(i, x0 + (i - 10) * (cs + gap), y2, S.reveal('compound', 4.6 + (i - 10) * 0.25, 0.4));
  d.withAlpha(S.reveal('chain', 0.4, 0.5), () => T(S, compound ? S.l('éxito acumulado (%)', 'cumulative success (%)') : S.l('probabilidad de que cada paso salga bien (%)', 'probability that each step goes right (%)'), x0, y1 - lh * 1.5, { size: 12, weight: 700, color: p.mute }));
  // curva acumulada
  if (compound) {
    const top = (nowRow2 > 0 ? y2 + rowH : y1 + rowH) + 14 * u, ch: Rect = { x: all.x + 34 * u, y: top + 4 * u, w: all.w - 40 * u, h: all.y + all.h - top - lh * 2.4 };
    if (ch.h > 56 * u) {
      const a = S.reveal('compound', 1.2, 0.6);
      d.withAlpha(a, () => {
        const X = (v: number) => ch.x + (v / 20) * ch.w, Y = (v: number) => ch.y + ch.h - v * ch.h;
        [0, 0.5, 1].forEach((v) => { d.line(ch.x, Y(v), ch.x + ch.w, Y(v), v === 0 ? p.lineStrong : p.line, v === 0 ? 1.5 : 1, v === 0.5 ? [4, 4] : undefined); T(S, `${v * 100}`, ch.x - 6 * u, Y(v), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
        T(S, S.l('pasos', 'steps'), ch.x + ch.w, ch.y + ch.h + 5 * u, { size: 12, weight: 700, color: p.ink2, align: 'right' });
        const upto = compound ? clamp((S.since('compound') - 0.5) / 3.0) * 10 + clamp((S.since('compound') - 4.8) / 2.5) * 10 : 0;
        const pts: [number, number][] = [[X(0), Y(1)]];
        for (let i = 1; i <= Math.floor(upto); i++) pts.push([X(i), Y(cum(i - 1))]);
        const fr = upto - Math.floor(upto);
        if (fr > 0 && upto < 20) { const i = Math.floor(upto); pts.push([lerp(X(i), X(i + 1), fr), lerp(Y(i === 0 ? 1 : cum(i - 1)), Y(cum(i)), fr)]); }
        d.polyline(pts, err.c, 2.5);
        pts.slice(1).forEach((q, i) => { if (i + 1 === 10 || i + 1 === 20) d.circle(q[0], q[1], 5 * u, { fill: err.c, stroke: p.stage, lw: 2 }); });
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Parámetros de cada laboratorio
// ═════════════════════════════════════════════════════════════════════════
interface Prm { p: number; n: number; k: number; q: number }
function relPrm(S: Frame): Prm {
  const on = S.on('try-rel');
  return { p: on ? clamp((S.p.pstep ?? 95) / 100, 0.5, 0.995) : P_DEFAULT, n: on ? Math.round(S.p.nsteps ?? 10) : 10, k: 0, q: 0.9 };
}
function chkPrm(S: Frame): Prm & { anim: number } {
  if (S.on('try-chk')) return { p: P_DEFAULT, n: 20, k: Math.round(S.p.chk ?? 0), q: clamp((S.p.qrev ?? 90) / 100), anim: 1 };
  return { p: P_DEFAULT, n: 20, k: 5, q: 0.9, anim: S.at('checkpoints', 3.4, 5.0, 'io') };
}

// ═════════════════════════════════════════════════════════════════════════
// Cuadrícula de cien corridas
// ═════════════════════════════════════════════════════════════════════════
function runsGrid(S: Frame, x: number, y: number, cell: number, runs: RunOut[], shown = 100, title?: string) {
  const { d, pal: p } = S, dat = tone(S, 'dat'), err = tone(S, 'err'), lh = lineH(S, 12);
  if (title) T(S, title, x, y - lh * 1.35, { size: 12, weight: 800, color: p.ink2 });
  runs.forEach((r, i) => {
    if (i >= shown) return;
    const cx = x + (i % 10) * cell, cy = y + Math.floor(i / 10) * cell, t = r.ok ? dat : err;
    d.rect(cx + 1, cy + 1, cell - 2, cell - 2, { fill: alpha(t.c, r.ok ? 0.16 : 0.26), stroke: t.c, lw: 1.2 });
    glyph(S, r.ok ? 'check' : 'cross', cx + cell / 2, cy + cell / 2, cell * 0.5, t.c);
  });
}

function rows(S: Frame, x: number, y: number, w: number, items: { l: string; v: string; t?: Tone; big?: boolean }[]) {
  const { d, pal: p } = S, lh = lineH(S, 12.5);
  items.forEach((it, i) => {
    const yy = y + i * lh * 1.45;
    T(S, it.l, x, yy + (it.big ? 3 * S.u : 0), { size: 12.5, weight: 600, color: p.ink2, w: w * 0.62 });
    T(S, it.v, x + w, yy - (it.big ? 1 : 0), { size: it.big ? 16 : 13, weight: 800, font: 'mono', color: it.t ? tone(S, it.t).ink : p.ink, align: 'right' });
  });
  void d;
}

// ═════════════════════════════════════════════════════════════════════════
// Laboratorio 1: éxito frente al número de pasos (grid, try-rel, cost-success)
// ═════════════════════════════════════════════════════════════════════════
export function drawRel(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5), dat = tone(S, 'dat'), err = tone(S, 'err'), mute = tone(S, 'mute');
  const P = relPrm(S), succ = Math.pow(P.p, P.n), runs = simulate(P.p, P.n, 0, P.q), okN = runs.filter((r) => r.ok).length;
  const cost = S.on('cost-success') ? S.reveal('cost-success', 0.6, 0.6) : 0;
  const port = S.portrait;
  const topH = port ? 214 * u : all.h;
  const gridR: Rect = port ? { x: all.x, y: all.y + lh * 1.5, w: all.w * 0.48, h: topH - lh * 1.5 } : { x: all.x + all.w * 0.58, y: all.y + lh * 1.5, w: all.w * 0.42, h: all.h };
  const cell = port ? Math.min(gridR.w / 10, (topH - lh * 2) / 10) : Math.min(gridR.w / 10, (all.h - lh * 1.5 - (cost > 0 ? 8.2 : 5.6) * lh * 1.45) / 10, 30 * u);
  const shown = S.is('grid') ? Math.floor(S.at('grid', 0.3, 3.8, 'lin') * 100) : 100;
  runsGrid(S, gridR.x, gridR.y, cell, runs, shown, S.l('100 corridas del mismo agente', '100 runs of the same agent'));
  // lecturas
  const ra = S.reveal('grid', 3.8, 0.6) * (S.on('try-rel') ? 1 : 1) + (S.on('try-rel') ? 1 : 0);
  const rd: Rect = port ? { x: all.x + all.w * 0.52, y: all.y + lh * 1.5, w: all.w * 0.48, h: topH } : { x: gridR.x, y: gridR.y + cell * 10 + 12 * u, w: gridR.w, h: all.h };
  const items: { l: string; v: string; t?: Tone; big?: boolean }[] = [
    { l: S.l('éxito esperado', 'expected success'), v: `${S.n(succ * 100, 1)} %`, t: succ < 0.5 ? 'err' : 'dat', big: true },
    { l: S.l('en estas 100', 'in these 100'), v: `${okN}` },
  ];
  if (cost > 0) items.push(
    { l: S.l('tokens leídos (supuesto)', 'tokens read (assumed)'), v: big(S, tokensRead(P.n)) },
    { l: S.l('costo por intento', 'cost per attempt'), v: money2(S, costAttempt(P.n)) },
    { l: S.l('por tarea lograda', 'per completed task'), v: money2(S, costPerSuccess(P.p, P.n)), t: 'err', big: true });
  d.withAlpha(clamp(ra), () => rows(S, rd.x, rd.y, rd.w, items.map((it, i) => (i < 2 ? it : { ...it }))));
  if (cost > 0) d.withAlpha(cost, () => T(S, S.l(`Supuestos ilustrativos: ${big(S, COST.base)} tokens base, ${big(S, COST.perStep)} por paso, US$ ${COST.perMillion} por millón.`, `Illustrative assumptions: ${big(S, COST.base)} base tokens, ${big(S, COST.perStep)} per step, $${COST.perMillion} per million.`), rd.x, rd.y + items.length * lh * 1.45 + 2 * u, { size: 12, weight: 600, color: p.mute, w: rd.w }));
  // estado del turno
  if (S.on('try-rel') && !S.on('cost-success')) {
    const cross = Math.abs(P.n - n50(P.p)) <= 1, below = succ < 0.5;
    const msg = cross ? S.l('Ahí cruza: el éxito pasa de más a menos de la mitad.', 'There it crosses: success goes from above to below one half.') : below ? S.l('Ya falla más de lo que acierta. Prueba con menos pasos.', 'It already fails more than it succeeds. Try fewer steps.') : S.l('Aún acierta más de la mitad. Sube los pasos.', 'It still succeeds more than half the time. Raise the steps.');
    d.withAlpha(S.reveal('try-rel', 0.2, 0.4), () => T(S, msg, rd.x, rd.y + items.length * lh * 1.45 + 4 * u, { size: 12.5, weight: 800, color: tone(S, cross ? 'dat' : 'mute').ink, w: rd.w }));
  }
  // curva
  const ch: Rect = port ? { x: all.x, y: all.y + topH + lh * 1.4, w: all.w, h: all.h - topH - lh * 1.4 } : { x: all.x, y: all.y + lh * 1.5, w: all.w * 0.54, h: all.h - lh * 1.5 };
  const left = 40 * u, bot = lh * 2.2 + 4 * u, pr: Rect = { x: ch.x + left, y: ch.y + 6 * u, w: ch.w - left - 10 * u, h: ch.h - bot - 6 * u };
  const X = (v: number) => pr.x + (v / 40) * pr.w, Y = (v: number) => pr.y + pr.h - v * pr.h;
  d.withAlpha(S.reveal('grid', 0.2, 0.6), () => {
    T(S, S.l('éxito de la tarea', 'task success'), ch.x, ch.y - lh * 1.4, { size: 12, weight: 800, color: p.ink2 });
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => { d.line(pr.x, Y(v), pr.x + pr.w, Y(v), v === 0 ? p.lineStrong : p.line, v === 0 ? 1.5 : 1); T(S, `${v * 100}`, pr.x - 6 * u, Y(v), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    [0, 10, 20, 30, 40].forEach((v) => T(S, String(v), X(v), pr.y + pr.h + 5 * u, { size: 12, font: 'mono', color: p.mute, align: 'center' }));
    T(S, S.l('pasos de la tarea', 'steps in the task'), pr.x + pr.w, pr.y + pr.h + 5 * u + lh * 1.2, { size: 12, weight: 700, color: p.ink2, align: 'right' });
    d.line(pr.x, Y(0.5), pr.x + pr.w, Y(0.5), err.c, 1.5, [5, 4]);
    const curve = (pp: number, color: string, lw: number, dash?: number[]) => { const pts: [number, number][] = []; for (let i = 0; i <= 80; i++) { const x = i / 2; pts.push([X(x), Y(Math.pow(pp, x))]); } d.polyline(pts, color, lw, { dash }); };
    if (Math.abs(P.p - P_DEFAULT) > 0.0005) curve(P_DEFAULT, mute.c, 1.8, [5, 4]);
    curve(P.p, dat.c, 3);
    const nn = n50(P.p);
    if (nn <= 40) { d.line(X(nn), pr.y, X(nn), pr.y + pr.h, err.c, 1.5, [3, 4]); pill(S, `n₅₀ ≈ ${S.n(nn, 1)}`, clamp(X(nn), pr.x + 36 * u, pr.x + pr.w - 36 * u), pr.y + 12 * u, { tone: 'err', weight: 800 }); }
    const dx = X(P.n), dy = Y(succ);
    d.circle(dx, dy, 7 * u, { fill: p.stage, stroke: p.ink, lw: 3 });
    const lab = `n = ${P.n} · ${Math.round(succ * 100)} %`, wl = d.measure(lab, { size: FS(S, 12.5), weight: 800, font: 'mono' }), lx = clamp(dx + 12 * u, pr.x, pr.x + pr.w - wl);
    T(S, lab, lx, clamp(dy - 22 * u, pr.y + 22 * u, pr.y + pr.h - 4 * u), { size: 12.5, weight: 800, font: 'mono', halo: true });
  });
}

const money2 = (S: Frame, x: number) => (S.lang === 'es' ? 'US$ ' : '$') + x.toLocaleString(S.lang === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ═════════════════════════════════════════════════════════════════════════
// Laboratorio 2: puntos de control (checkpoints, try-chk, tradeoff)
// ═════════════════════════════════════════════════════════════════════════
const OPTS: [number, string, string][] = [[0, 'Nunca', 'Never'], [20, 'Solo al final', 'Only at the end'], [10, 'Cada 10', 'Every 10'], [5, 'Cada 5', 'Every 5'], [4, 'Cada 4', 'Every 4'], [2, 'Cada 2', 'Every 2'], [1, 'Cada 1', 'Every 1']];

export function drawChk(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5), dat = tone(S, 'dat'), w = tone(S, 'w'), err = tone(S, 'err'), ink = tone(S, 'ink');
  const P = chkPrm(S), port = S.portrait;
  const tradeoff = S.on('tradeoff');
  // estadísticas: durante la narración se interpola de «nunca» a «cada 5»
  const s0 = stats(P.p, P.n, 0, P.q), s1 = stats(P.p, P.n, P.k, P.q);
  const st = { success: lerp(s0.success, s1.success, P.anim), reviews: lerp(s0.reviews, s1.reviews, P.anim), steps: lerp(s0.steps, s1.steps, P.anim) };
  const kEff = S.on('try-chk') ? P.k : P.anim > 0.5 ? 5 : 0;
  const runs = simulate(P.p, P.n, kEff, P.q);
  // la cadena de 20 pasos con banderas
  const cs = Math.min((all.w * (port ? 1 : 0.62) - 9 * 5 * u) / 10, 34 * u), gap = 5 * u, rowW = 10 * cs + 9 * gap, x0 = all.x + (port ? (all.w - rowW) / 2 : 0);
  const ry = all.y + 30 * u, rh = cs + 24 * u;
  d.withAlpha(S.reveal('checkpoints', 0.2, 0.5), () => T(S, S.l('una tarea de 20 pasos · 95 % por paso', 'a 20-step task · 95% per step'), x0, all.y, { size: 12, weight: 800, color: p.ink2 }));
  for (let i = 0; i < 20; i++) {
    const a = S.reveal('checkpoints', 0.3 + i * 0.05, 0.3), cx = x0 + (i % 10) * (cs + gap), cy = ry + Math.floor(i / 10) * rh;
    d.withAlpha(a, () => { d.rect(cx, cy, cs, cs, { fill: alpha(dat.c, 0.14), stroke: dat.c, lw: 1.5, r: 2 }); T(S, String(i + 1), cx + cs / 2, cy + cs / 2, { size: 12, weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'middle' }); });
    const flag = kEff > 0 && ((i + 1) % kEff === 0 || i === 19) && (S.on('try-chk') || S.at('checkpoints', 2.0 + Math.floor(i / 5) * 0.4, 2.5 + Math.floor(i / 5) * 0.4) > 0);
    if (flag) { d.withAlpha(S.on('try-chk') ? 1 : S.at('checkpoints', 2.0 + Math.floor(i / 5) * 0.4, 2.5 + Math.floor(i / 5) * 0.4), () => { glyph(S, 'person', cx + cs / 2, cy + cs + 11 * u, 16 * u, w.c); }); }
  }
  // lecturas como barras con su objetivo
  const bx = port ? all.x : all.x, by = ry + 2 * rh + (port ? 6 : 14) * u, bw = port ? all.w : all.w * 0.62;
  const bars: { l: string; v: number; max: number; txt: string; t: Tone; goal?: number; lessIsBetter?: boolean }[] = [
    { l: S.l('éxito', 'success'), v: st.success, max: 1, txt: `${S.n(st.success * 100, 1)} %`, t: 'dat', goal: 0.85 },
    { l: S.l('revisiones (atención humana)', 'reviews (human attention)'), v: st.reviews, max: 22, txt: S.n(st.reviews, 1), t: 'w', goal: 4, lessIsBetter: true },
    { l: S.l('pasos del agente (mínimo 20)', 'agent steps (minimum 20)'), v: st.steps, max: 56, txt: S.n(st.steps, 1), t: 'ink', goal: 35, lessIsBetter: true },
  ];
  const bh = Math.min(26 * u, (all.y + all.h - by - lh * 1.4 * 3) / 3);
  bars.forEach((b, i) => {
    const y = by + i * (bh + lh * 1.5), a = S.reveal('checkpoints', 1.0 + i * 0.4, 0.5), tc = tone(S, b.t);
    const lab = bw - 74 * u;
    d.withAlpha(a, () => {
      T(S, b.l, bx, y, { size: 12, weight: 700, color: p.ink2 });
      d.rect(bx, y + lh * 1.1, lab, bh, { fill: p.surface2 });
      d.rect(bx, y + lh * 1.1, lab * clamp(b.v / b.max), bh, { fill: alpha(tc.c, 0.7), stroke: tc.c, lw: 1 });
      if (S.on('try-chk') && !tradeoff && b.goal !== undefined) {
        const gx = bx + lab * (b.goal / b.max);
        d.line(gx, y + lh * 1.1 - 3 * u, gx, y + lh * 1.1 + bh + 3 * u, p.ink, 2, [3, 2]);
        const ok = b.lessIsBetter ? b.v <= b.goal : b.v >= b.goal;
        glyph(S, ok ? 'check' : 'cross', bx + lab + 10 * u, y + lh * 1.1 + bh / 2, 13 * u, ok ? dat.c : err.c);
      }
      T(S, b.txt, bx + bw, y + lh * 1.1 + bh / 2, { size: 14, weight: 800, font: 'mono', color: tc.ink, align: 'right', base: 'middle' });
    });
  });
  // a la derecha: las cien corridas, o la tabla de todas las opciones
  const gr: Rect = port ? { x: all.x, y: by + 3 * (bh + lh * 1.5) + lh * 1.4, w: all.w, h: all.y + all.h - (by + 3 * (bh + lh * 1.5) + lh * 1.4) } : { x: all.x + all.w * 0.68, y: all.y + lh * 1.4, w: all.w * 0.32, h: all.h - lh * 1.4 };
  if (!tradeoff) {
    const cell = port ? Math.max(0, Math.min(gr.h / 10, 18 * u)) : Math.min(gr.w / 10, (gr.h) / 10);
    if (cell > 8) runsGrid(S, port ? all.x + all.w - cell * 10 : gr.x, gr.y, cell, runs, 100, S.l('100 corridas', '100 runs'));
    if (S.on('try-chk')) {
      const ok = st.success >= 0.85 && st.reviews <= 4 && st.steps <= 35 && kEff > 0;
      d.withAlpha(S.reveal('try-chk', 0.2, 0.4), () => T(S, ok ? S.l('Cumples los tres límites.', 'You meet all three limits.') : S.l('Aún no cumples los tres límites (las marcas).', 'You do not meet all three limits yet (the marks).'), gr.x, port ? gr.y - lh * 3.2 : gr.y + cell * 10 + 10 * u, { size: 12.5, weight: 800, color: tone(S, ok ? 'dat' : 'mute').ink, w: port ? all.w * 0.5 : gr.w }));
    }
  } else {
    const t0 = port ? by + 3 * (bh + lh * 1.5) + 6 * u : all.y + lh * 1.4, tw = port ? all.w : all.w * 0.38, tx = port ? all.x : all.x + all.w * 0.62 + 8 * u, rowH = Math.min(lh * 1.45, (all.y + all.h - t0) / 8.4);
    const a = S.reveal('tradeoff', 0.2, 0.5), cols = [0.0, 0.42, 0.62, 0.8];
    d.withAlpha(a, () => {
      [S.l('revisar', 'review'), S.l('éxito', 'success'), S.l('revis.', 'revs.'), S.l('pasos', 'steps')].forEach((h, i) => T(S, h, tx + (i === 0 ? 0 : tw * (cols[i] + 0.18)), t0, { size: 12, weight: 800, color: p.mute, align: i === 0 ? 'left' : 'right' }));
      OPTS.forEach(([k, es, en], i) => {
        const s = stats(P.p, P.n, k, P.q), y = t0 + rowH * (i + 1), hot = (k === 5 && S.at('tradeoff', 0.5, 1, 'out') > 0 && S.since('tradeoff') < 5.5) || (k === 1 && S.since('tradeoff') >= 3.2);
        if (hot) d.rect(tx - 4 * u, y - 2 * u, tw + 8 * u, rowH, { fill: alpha(w.c, 0.16), stroke: w.c, lw: 1.2, r: 2 });
        T(S, S.l(es, en), tx, y, { size: 12, weight: hot ? 800 : 600 });
        T(S, `${S.n(s.success * 100, 1)}`, tx + tw * (cols[1] + 0.18), y, { size: 12, weight: hot ? 800 : 600, font: 'mono', align: 'right', color: dat.ink });
        T(S, S.n(s.reviews, 1), tx + tw * (cols[2] + 0.18), y, { size: 12, weight: hot ? 800 : 600, font: 'mono', align: 'right', color: w.ink });
        T(S, S.n(s.steps, 1), tx + tw * (cols[3] + 0.18), y, { size: 12, weight: hot ? 800 : 600, font: 'mono', align: 'right' });
      });
    });
    d.withAlpha(S.reveal('tradeoff', 7.4, 0.6), () => pill(S, S.l(`techo ≈ ${Math.round(stats(P.p, P.n, 1, P.q).success * 100)} %: lo fija quien revisa`, `ceiling ≈ ${Math.round(stats(P.p, P.n, 1, P.q).success * 100)}%: set by the reviewer`), tx + tw, t0 + rowH * 8.6, { tone: 'w', align: 'right', weight: 800 }));
  }
  void ink; void smooth;
}
