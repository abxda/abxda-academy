// Acto 4 · Refuerzo con retroalimentación humana: el ciclo, la correa (penalización KL), el sustituto frente a la calidad real y el turno
// «sube la presión de optimización» (ley de Goodhart). Todo número del turno sale de toy.ts (óptimo exacto con penalización KL);
// las unidades y los pesos de partida son ilustrativos y así se rotulan.
import { Plot, alpha, along, clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, card, fitText, glyph, isCompact, mark, num, para, person, sgn, tab, traitName, TRAIT_KEYS, traitTone } from './ui';
import { banner, compareTable, phases, pct, traitBar } from './board';
import { PAIRS } from './pairs';
import { CURVE_STEPS, S_BEST, effective, gains, pressure, st } from './state';
import { Q_REF, tilt } from './toy';

const R = (S: Frame) => inset(S.full(), (isCompact(S) ? 8 : 14) * S.u);

export function drawRl(S: Frame) {
  phases(S, [
    { from: 'rl-idea', draw: drawLoop },
    { from: 'kl', draw: drawLeash },
    { from: 'proxy', draw: drawProxy },
    { from: 'try-opt', draw: drawOpt },
  ], 'dpo-problem');
}

// ── 1 · el ciclo: escribe, puntúa, se corrige ──
function drawLoop(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S);
  const lt = tone(S, 'lat'), wt = tone(S, 'w'), st_ = tone(S, 'sig');
  const topH = (port ? 58 : cmp ? 32 : 46) * u, botH = (port ? 64 : cmp ? 36 : 48) * u;
  const area: Rect = { x: r.x, y: r.y + topH, w: r.w, h: r.h - topH - botH };
  const bw = Math.min(area.w * (port ? 0.32 : 0.28), 230 * u), bh = Math.min(area.h * 0.5, (cmp ? 90 : 140) * u), cy = area.y + bh / 2 + area.h * 0.06;
  const M: Rect = { x: area.x + (port ? 0 : area.w * 0.02), y: cy - bh / 2, w: bw, h: bh };
  const RM: Rect = { x: area.x + area.w - bw - (port ? 0 : area.w * 0.02), y: cy - bh / 2, w: bw, h: bh };
  // cajas
  const aM = S.reveal('rl-idea', 0, 0.5), aRM = S.reveal('rl-idea', 1.6, 0.5);
  d.withAlpha(aM, () => {
    card(S, M, { tone: 'lat', fill: alpha(lt.c, 0.1), lw: 2 });
    fitText(S, S.l('Modelo ajustado', 'Tuned model'), M.x + M.w / 2, M.y + M.h * 0.38, M.w - 12 * u, 17, { weight: 800, color: lt.ink, align: 'center', base: 'middle' });
    if (!cmp) fitText(S, S.l('escribe una respuesta', 'writes an answer'), M.x + M.w / 2, M.y + M.h * 0.68, M.w - 12 * u, 13, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
  d.withAlpha(aRM, () => {
    card(S, RM, { tone: 'w', fill: alpha(wt.c, 0.1), lw: 2 });
    fitText(S, S.l('Modelo de recompensa', 'Reward model'), RM.x + RM.w / 2, RM.y + RM.h * 0.34, RM.w - 12 * u, 16, { weight: 800, color: wt.ink, align: 'center', base: 'middle' });
    const e = effective(st(S)), v = e.w[0];
    const aS = S.reveal('rl-idea', 2.4, 0.5);
    d.withAlpha(aS, () => d.tag(S.l('puntuación ', 'score ') + num(S, v, 2), RM.x + RM.w / 2, RM.y + RM.h * 0.74, { color: wt.ink, stroke: wt.c, size: FS(S, 13), weight: 800, pad: 6 }));
  });
  // flecha de ida (respuesta) y camino de vuelta (se corrige)
  const y1 = cy, x1 = M.x + M.w + 8 * u, x2 = RM.x - 8 * u, kA = S.at('rl-idea', 0.9, 1.7, 'out');
  const ansCard = (S.lang === 'es' ? PAIRS[0].B.es : PAIRS[0].B.en);
  if (kA > 0) d.arrow(x1, y1, x1 + (x2 - x1) * kA, y1, p.ink, 2.6, kA > 0.97 ? 10 : 0.001);
  d.withAlpha(S.reveal('rl-idea', 1.1, 0.5), () => {
    const w = x2 - x1;
    fitText(S, S.l('respuesta', 'answer'), (x1 + x2) / 2, y1 - 8 * u, w, 13, { weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
    if (!port && !cmp) fitText(S, '«' + ansCard + '»', (x1 + x2) / 2, y1 + 8 * u, w, 14, { weight: 700, color: lt.ink, align: 'center', base: 'top' });
  });
  const ry = RM.y + RM.h + (area.y + area.h - (RM.y + RM.h)) * 0.5;
  const back: [number, number][] = [[RM.x + RM.w / 2, RM.y + RM.h + 4 * u], [RM.x + RM.w / 2, ry], [M.x + M.w / 2, ry], [M.x + M.w / 2, M.y + M.h + 8 * u]];
  const kB = S.at('rl-idea', 3.0, 4.4, 'io');
  if (kB > 0) {
    const n = back.length - 1, tot = back.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - back[i - 1][0], q[1] - back[i - 1][1]) : 0), 0);
    let acc = 0; const cut: [number, number][] = [back[0]];
    for (let i = 1; i <= n; i++) { const l = Math.hypot(back[i][0] - back[i - 1][0], back[i][1] - back[i - 1][1]); if (acc + l <= kB * tot) { cut.push(back[i]); acc += l; } else { const f = (kB * tot - acc) / l; cut.push([back[i - 1][0] + (back[i][0] - back[i - 1][0]) * f, back[i - 1][1] + (back[i][1] - back[i - 1][1]) * f]); break; } }
    d.polyline(cut, st_.c, 2.6);
    if (kB > 0.98) { const a = back[n - 1], b = back[n]; d.arrow(a[0], a[1], b[0], b[1], st_.c, 2.6, 10); }
  }
  d.withAlpha(S.reveal('rl-idea', 4.0, 0.5), () => para(S, S.l('se corrige: las respuestas bien puntuadas se vuelven más probables', 'it corrects itself: well-scored answers become more likely'), M.x, ry + 6 * u, RM.x + RM.w - M.x, FS(S, 14), { weight: 700, color: st_.ink, align: 'center', maxLines: 2 }));
  // un pulso recorre el ciclo una vez terminado
  if (S.since('rl-idea') > 5.2) {
    const loop: [number, number][] = [[M.x + M.w, y1], [RM.x, y1], ...back.slice(0, 3).map((q) => [q[0], q[1]] as [number, number]), [M.x + M.w / 2, M.y + M.h]];
    const [px, py] = along(loop, (S.clock * 0.22) % 1);
    d.circle(px, py, 5 * u, { fill: st_.c, stroke: p.stage, lw: 1.5 });
  }
  // nombre del ciclo y de quién lo usó
  const aT = S.reveal('rl-name', 0.2, 0.5), aC = 1 - S.at('rl-name', 0, 0.4);
  d.withAlpha(aC, () => fitText(S, S.l('El modelo practica y se corrige', 'The model practices and corrects itself'), r.x, r.y + 6 * u, r.w, 17, { weight: 700, color: p.ink2, base: 'top' }));
  banner(S, r, 'RLHF', S.l('aprendizaje por refuerzo con retroalimentación humana', 'reinforcement learning from human feedback'), aT);
  const by = area.y + area.h + 8 * u, c = tone(S, 'dat');
  const b1 = S.l('InstructGPT · 2022', 'InstructGPT · 2022'), b2 = S.l('ChatGPT · 30 nov 2022 (según OpenAI)', 'ChatGPT · Nov 30, 2022 (per OpenAI)');
  d.withAlpha(S.reveal('rl-name', 1.0, 0.5), () => d.tag(b1, r.x, by + 10 * u, { color: c.ink, stroke: c.c, size: FS(S, 14), align: 'left', weight: 700, pad: 7 }));
  d.withAlpha(S.reveal('rl-name', 1.8, 0.5), () => d.tag(b2, port ? r.x : r.x + d.measure(b1, { size: FS(S, 14), weight: 700 }) + 40 * u, port ? by + 38 * u : by + 10 * u, { color: c.ink, stroke: c.c, size: FS(S, 14), align: 'left', weight: 700, pad: 7 }));
}

// ── 2 · la correa: con y sin penalización por alejarse del modelo de partida ──
function drawLeash(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, et = tone(S, 'err');
  const kLeash = S.at('kl', 0.8, 2.6, 'io'), kFree = S.at('kl', 2.8, 4.8, 'io');
  const mL = tilt(1 * kLeash), mF = tilt(8 * kFree);
  const T = compareTable(S, r, {
    heads: [{ title: S.l('con correa', 'with leash'), sub: S.l('presión moderada', 'moderate pressure'), a: S.reveal('kl', 0, 0.5) }, { title: S.l('sin correa', 'no leash'), sub: S.l('presión máxima', 'maximum pressure'), t: 'err', a: S.reveal('kl', 2.6, 0.5) }],
    cols: [mL, mF], aNames: S.reveal('kl', 0, 0.5), foot: port ? 70 : 52,
  });
  // los trucos: los dos sesgos del juez se disparan sin correa
  const aTr = S.reveal('kl', 4.8, 0.6);
  if (aTr > 0) d.withAlpha(aTr, () => {
    [1, 3].forEach((i) => d.rect(T.col(1) - 4 * u, T.y0 + T.head + i * T.rowH + 2 * u, T.bw + 8 * u, T.rowH - 4 * u, { stroke: et.c, lw: 2, dash: [5, 3], r: 3 }));
    para(S, S.l('Recuadro punteado: los sesgos del juez (larga, da la razón) se disparan.', 'Dashed box: the judge’s biases (long, agrees) take off.'), T.X, T.bottom + 6 * u, T.W, FS(S, 13), { color: et.ink, weight: 700, maxLines: 2 });
  });
  d.withAlpha(S.reveal('kl', 0.6, 0.5), () => para(S, S.l('Marca │ = modelo de partida. Juguete: un modelo de recompensa con dos sesgos (supuesto).', '│ mark = starting model. Toy: a reward model with two biases (assumed).'), T.X, Math.min(T.bottom + (port ? 40 : 34) * u, r.y + r.h - 28 * u), T.W, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
}

// ── 3 · el sustituto frente a la calidad real ──
function drawProxy(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S);
  const wt = tone(S, 'w'), dt = tone(S, 'dat');
  const bw = port ? r.w : Math.min(r.w * 0.38, 340 * u), bh = port ? r.h * 0.34 : Math.min(r.h * (cmp ? 0.72 : 0.55), 230 * u);
  const L: Rect = port ? { x: r.x, y: r.y + r.h * 0.02, w: bw, h: bh } : { x: r.x, y: r.y + (r.h - bh) * 0.4, w: bw, h: bh };
  const Rr: Rect = port ? { x: r.x, y: r.y + r.h * 0.62, w: bw, h: bh } : { x: r.x + r.w - bw, y: L.y, w: bw, h: bh };
  d.withAlpha(S.reveal('proxy', 0.1, 0.6), () => {
    card(S, L, { tone: 'w', fill: alpha(wt.c, 0.08), lw: 2 });
    const x = L.x + 12 * u, w = L.w - 24 * u;
    fitText(S, S.l('Puntuación del modelo de recompensa', 'Reward model score'), x, L.y + 12 * u, w, 16, { weight: 800, color: wt.ink, base: 'top' });
    fitText(S, S.l('un número, al instante, sin costo', 'a number, instantly, at no cost'), x, L.y + 38 * u, w, 14, { weight: 600, color: p.ink2, base: 'top' });
    const by = L.y + L.h - 22 * u, k = S.at('proxy', 0.4, 2.0, 'out');
    d.rect(x, by - 8 * u, w, 12 * u, { fill: p.surface2 });
    d.rect(x, by - 8 * u, w * 0.85 * k, 12 * u, { fill: wt.c });
    d.text(S.l('sustituto', 'stand-in'), x, by - 14 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
  });
  d.withAlpha(S.reveal('proxy', 1.2, 0.6), () => {
    card(S, Rr, { tone: 'dat', fill: alpha(dt.c, 0.08), lw: 2 });
    const x = Rr.x + 12 * u, w = Rr.w - 24 * u;
    fitText(S, S.l('Calidad real', 'Real quality'), x, Rr.y + 12 * u, w, 16, { weight: 800, color: dt.ink, base: 'top' });
    fitText(S, S.l('la juzgan personas: lento y caro', 'people judge it: slow and expensive'), x, Rr.y + 38 * u, w, 14, { weight: 600, color: p.ink2, base: 'top' });
    const pc = cmp ? 2 : 3, py = Rr.y + Rr.h - 14 * u - 9 * pc;
    for (let i = 0; i < 4; i++) person(S, x + i * (6 * pc + 8 * u), py, pc, 'ink', S.reveal('proxy', 1.6 + i * 0.25, 0.3));
    d.text(S.l('objetivo real', 'real goal'), x + w, py + 9 * pc, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  const x1 = port ? L.x + L.w / 2 : L.x + L.w + 10 * u, y1 = port ? L.y + L.h + 6 * u : L.y + L.h / 2, x2 = port ? Rr.x + Rr.w / 2 : Rr.x - 10 * u, y2 = port ? Rr.y - 6 * u : Rr.y + Rr.h / 2;
  const kA = S.at('proxy', 2.4, 3.4, 'out');
  if (kA > 0) {
    d.line(x1, y1, x1 + (x2 - x1) * kA, y1 + (y2 - y1) * kA, p.ink, 2.4, [6, 5]);
    if (kA > 0.9) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, t = S.l('solo se parece a', 'only resembles');
      const tw = d.measure(t, { size: FS(S, 13), weight: 800 }) + 14 * u;
      d.withAlpha((kA - 0.9) / 0.1, () => { d.rect(mx - tw / 2, my - 13 * u, tw, 26 * u, { fill: p.surface, stroke: p.ink, lw: 1.5, r: 3 }); d.text(t, mx, my, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'middle' }); });
    }
  }
  void mark; void tab; void sgn;
}

// ── 4 · el turno: la presión de optimización y la ley de Goodhart ──
const yMin = -1.3, yMax = 2.2;

function legend(S: Frame, x: number, y: number, w: number, items: { label: string; t: Tone; dash?: number[] }[]): number {
  const { d, pal: p } = S, u = S.u, size = FS(S, 13);
  const widths = items.map((it) => 26 * u + d.measure(it.label, { size, weight: 700 }) + 16 * u), total = widths.reduce((a, b) => a + b, 0), one = total <= w;
  let cx = x, cy = y;
  items.forEach((it, i) => {
    if (!one && i > 0) { cx = x; cy += 18 * u; }
    const c = tone(S, it.t);
    d.line(cx, cy + 8 * u, cx + 20 * u, cy + 8 * u, c.c, 3, it.dash);
    d.text(it.label, cx + 26 * u, cy + 8 * u, { size, weight: 700, color: c.ink, base: 'middle' });
    cx += widths[i];
  });
  return (one ? 1 : items.length) * 18 * u;
}

function drawOpt(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = R(S), port = S.portrait, cmp = isCompact(S), s = st(S);
  const gap = 12 * u, wt = tone(S, 'w'), dt = tone(S, 'dat'), et = tone(S, 'err');
  const area: Rect = port ? { x: r.x, y: r.y, w: r.w, h: r.h * 0.5 } : { x: r.x, y: r.y, w: r.w * 0.62, h: r.h };
  const pan: Rect = port ? { x: r.x, y: r.y + r.h * 0.5 + gap * 0.5, w: r.w, h: r.h * 0.5 - gap * 0.5 } : { x: r.x + r.w * 0.62 + gap, y: r.y, w: r.w * 0.38 - gap, h: r.h };
  const a0 = S.reveal('try-opt', 0, 0.5);
  const sv = clamp(s.sShown), g = gains(pressure(sv));
  const legH = legend(S, area.x, area.y, area.w, [{ label: S.l('puntuación del juez (modelo de recompensa)', 'judge’s score (reward model)'), t: 'w', dash: [7, 4] }, { label: S.l('calidad real', 'real quality'), t: 'dat' }]);
  const foot = (port ? 0 : 38) * u;
  const pr: Rect = { x: area.x, y: area.y + legH + 4 * u, w: area.w, h: area.h - legH - 4 * u - foot };
  const plot = new Plot(S, pr, { xr: [0, 1], yr: [yMin, yMax], pad: { l: 8, r: 8, t: 4, b: port ? 22 : 26 } });
  d.withAlpha(a0, () => {
    plot.axes();
    d.line(plot.r.x, plot.Y(0), plot.r.x + plot.r.w, plot.Y(0), p.mute, 1.5, [5, 4]);
    d.text(S.l('modelo de partida', 'starting model'), plot.r.x + 4 * u, plot.Y(0) + 4 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
    d.text(S.l('presión de optimización →', 'optimization pressure →'), plot.r.x + plot.r.w, plot.r.y + plot.r.h + 6 * u, { size: FS(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
  });
  // zona de Goodhart
  const aZ = S.reveal('goodhart', 0.2, 0.8);
  if (aZ > 0) d.withAlpha(aZ, () => {
    const zx = plot.X(S_BEST);
    d.rect(zx, plot.r.y, plot.r.x + plot.r.w - zx, plot.r.h, { fill: alpha(et.c, 0.09) });
    d.line(zx, plot.r.y, zx, plot.r.y + plot.r.h, et.c, 1.8, [5, 4]);
    const lx = Math.max(zx + 6 * u, plot.X(0.64));
    para(S, S.l('la puntuación sube, la calidad real cae', 'the score rises, real quality falls'), lx, plot.Y(1.3), plot.r.x + plot.r.w - lx - 6 * u, FS(S, 13), { weight: 800, color: et.ink, maxLines: 3, halo: true });
    d.text(S.l('máximo de calidad real', 'peak of real quality'), zx - 4 * u, plot.r.y + 4 * u, { size: FS(S, 12), weight: 700, color: dt.ink, align: 'right', base: 'top' });
  });
  // curvas: solo lo explorado (o todo, tras la explicación)
  const ext = clamp(Math.max(s.sMax, S.on('goodhart') ? S.at('goodhart', 0, 1.8, 'io') : 0));
  const n = Math.max(1, Math.round(ext * CURVE_STEPS)), ptsP: [number, number][] = [], ptsG: [number, number][] = [];
  for (let i = 0; i <= n; i++) { const q = Math.min(ext, i / CURVE_STEPS), c = gains(pressure(q)); ptsP.push([plot.X(q), plot.Y(c.proxy)]); ptsG.push([plot.X(q), plot.Y(c.gold)]); }
  d.clip(plot.r.x, plot.r.y, plot.r.w, plot.r.h, () => {
    if (ptsP.length > 1) { d.polyline(ptsP, wt.c, 3, { dash: [7, 4] }); d.polyline(ptsG, dt.c, 3.4); }
  });
  // mejor calidad real vista hasta ahora (marca de agua), y el máximo una vez encontrado
  if (s.goldBest > 0.05) d.withAlpha(a0, () => { d.line(plot.r.x, plot.Y(s.goldBest), plot.r.x + plot.r.w, plot.Y(s.goldBest), dt.c, 1.4, [2, 4]); });
  if (s.bestHit || S.on('goodhart')) { const pk = gains(pressure(S_BEST)); d.circle(plot.X(S_BEST), plot.Y(pk.gold), 9 * u, { stroke: dt.c, lw: 2.4 }); }
  // el control actual
  d.withAlpha(a0, () => {
    const x = plot.X(sv);
    d.line(x, plot.r.y, x, plot.r.y + plot.r.h, p.ink, 1.6);
    d.circle(x, plot.Y(g.proxy), 6 * u, { fill: wt.c, stroke: p.stage, lw: 1.5 });
    d.circle(x, plot.Y(g.gold), 6.5 * u, { fill: dt.c, stroke: p.stage, lw: 1.5 });
  });
  // pie: procedencia
  if (!port) d.withAlpha(S.reveal('goodhart', 0.4, 0.5), () => para(S, S.l('Juguete ilustrativo. Gao et al. (2022) midieron el patrón en modelos de lenguaje, con un modelo «de oro» como árbitro.', 'Illustrative toy. Gao et al. (2022) measured the pattern in language models, with a “gold” model as the referee.'), area.x, pr.y + pr.h + 4 * u, area.w, FS(S, 12), { color: p.mute, weight: 600, maxLines: 2 }));
  // panel: lecturas y rasgos
  d.withAlpha(a0, () => {
    const x = pan.x + (port ? 0 : 10 * u), w = pan.w - (port ? 0 : 20 * u), rowH = (port ? 17 : cmp ? 20 : 24) * u;
    const content = (10 + 3 * (cmp ? 20 : 24) + 6 + 17 + 4 * (cmp ? 20 : 26) + 10) * u;
    if (!port) card(S, { x: pan.x, y: pan.y, w: pan.w, h: Math.min(pan.h, content) }, { tone: 'ink', fill: p.surface });
    let y = pan.y + (port ? 2 : 10) * u;
    const reads: [string, string, Tone][] = [[S.l('puntuación del juez', 'judge’s score'), sgn(S, g.proxy, 2), 'w'], [S.l('calidad real', 'real quality'), sgn(S, g.gold, 2), 'dat'], [S.l('distancia al inicio (KL)', 'distance from start (KL)'), num(S, g.kl, 2), 'ink']];
    reads.forEach(([lab, val, tn]) => {
      const c = tone(S, tn);
      d.text(lab, x, y + rowH / 2, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'middle' });
      d.text(val, x + w, y + rowH / 2, { size: FS(S, 16), weight: 800, font: 'mono', color: tn === 'ink' ? p.ink : c.ink, align: 'right', base: 'middle' });
      y += rowH;
    });
    y += 6 * u;
    d.text(S.l('probabilidad de cada rasgo (│ = inicio)', 'probability of each trait (│ = start)'), x, y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    y += 17 * u;
    const bh = Math.min((port ? 17 : cmp ? 20 : 26) * u, (pan.y + pan.h - y - 4 * u) / 4);
    g.m.forEach((m, i) => traitBar(S, { x, y: y + i * bh, w, h: bh }, i, m, { nameW: (port ? 92 : 104) * u }));
  });
}
