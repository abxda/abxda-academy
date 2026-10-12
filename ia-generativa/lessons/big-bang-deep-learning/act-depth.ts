// Acto 4: la profundidad. El gradiente que se desvanece (retropropagación real en una red de juguete),
// la conexión residual, el turno de la persona, la degradación y ResNet.
import { Plot, alpha, along, badge, clamp, lerp, neu, tone, type Frame, type Pt, type Rect } from '../../../../../theme/kit';
import { D_MAX, WIDTH, gradRun, normAt, perLayerFactor, unitsAt } from './model';
import { dec, fa, sci, strip } from './shared';

// ═════════ vista de gradientes: mapa de calor por unidad + norma por capa (escala logarítmica) ═════════
export interface GradOpts { D: number; res: boolean; sweep: number; ghost?: boolean; marks?: boolean; probe?: boolean; head?: string }

export function gradView(S: Frame, B: Rect, o: GradOpts) {
  const { d, pal: p } = S, u = S.u, err = tone(S, 'err');
  const run = gradRun(o.D, o.res), D = run.depth, cols = D + 1, padL = 52;
  const hdr = o.head ? 22 * u : 0;
  const gh = clamp(B.h * 0.3, 54 * u, 120 * u), gx = B.x + padL * u, gw = B.w - padL * u - 8 * u, gy = B.y + hdr;
  const cw = gw / cols, ch = gh / WIDTH;
  if (o.head) d.text(o.head, B.x + 2 * u, B.y + 10 * u, { size: 14, weight: 800, color: o.res ? tone(S, 'dat').ink : err.ink, base: 'middle' });
  // mapa de calor: columna c = vector h_c (c = 0 entrada … c = D salida); el gradiente entra por la derecha
  const reach = o.sweep * cols;
  d.rect(gx - 1, gy - 1, gw + 2, gh + 2, { stroke: p.line, lw: 1 });
  for (let c = 0; c < cols; c++) {
    const vis = clamp(reach - (cols - 1 - c));
    const vec = unitsAt(run, c);
    for (let i = 0; i < WIDTH; i++) {
      const v = Math.log10(Math.max(Math.abs(vec[i]), 1e-14)), a = clamp((v + 11) / 11.5);
      d.rect(gx + c * cw, gy + i * ch, Math.max(1, cw - (cw > 5 ? 1 : 0.4)), ch - 0.6, { fill: alpha(err.c, 0.05 + vis * (0.02 + 0.9 * a)) });
    }
  }
  const front = Math.floor(cols - reach);
  if (o.sweep > 0 && o.sweep < 1) d.rect(gx + clamp(front, 0, cols - 1) * cw - 1, gy - 3, cw + 2, gh + 6, { stroke: p.ink, lw: 2 });
  d.text(S.l('entrada', 'input'), gx, gy + gh + 3 * u, { size: 12, weight: 700, color: p.mute, base: 'top' });
  d.text(S.l('salida', 'output'), gx + gw, gy + gh + 3 * u, { size: 12, weight: 700, color: p.mute, align: 'right', base: 'top' });
  d.text(S.l(`${D} capas × ${WIDTH} neuronas`, `${D} layers × ${WIDTH} neurons`), gx + gw / 2, gy + gh + 3 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'top' });
  // curva de la norma
  const py = gy + gh + 20 * u, ph = B.h - hdr - gh - 20 * u - 30 * u;
  const plot = new Plot(S, { x: B.x, y: py, w: B.w, h: ph }, { xr: [0, D], yr: [-12.5, 2], yTicks: [-10, -5, 0], tickFmt: (v) => (v === 0 ? '1' : `1e${v}`), yLabel: S.l('norma del gradiente', 'gradient norm'), pad: { l: padL, r: 8, t: 16, b: 4 } });
  plot.axes();
  const logn = (r: typeof run, c: number) => Math.log10(Math.max(normAt(r, c), 1e-14));
  const series = (r: typeof run, upto: number): Pt[] => {
    const pts: Pt[] = [];
    for (let c = D; c >= 0; c--) { if (D - c > upto * D + 1e-9) break; pts.push([plot.X(c), plot.Y(logn(r, c))]); }
    return pts;
  };
  plot.clip(() => {
    if (o.ghost && o.res) { const g = gradRun(o.D, false); d.polyline(series(g, o.sweep), err.c, 2, { dash: [5, 4], a: 0.55 }); }
    d.polyline(series(run, o.sweep), err.c, o.res ? 3.5 : 3, { dash: o.res ? undefined : [7, 4] });
  });
  // punto de partida del gradiente (tamaño 1) y marcas
  const start = fa(S, 'toy', 0.5, 0.65);
  if (o.probe) d.withAlpha(start, () => { plot.dot(D, 0, 5, 'err'); d.text(S.l('gradiente de tamaño 1', 'gradient of size 1'), plot.X(D) - 8 * u, plot.Y(0) - 12 * u, { size: 12, weight: 700, color: err.ink, align: 'right', base: 'middle', halo: p.stage, haloW: 4 }); });
  if (o.marks && o.sweep > 0.99 && D >= 40) {
    [10, 40].forEach((k) => {
      const c = D - k, v = logn(run, c);
      plot.dot(c, v, 5, 'err');
      // la curva sube hacia la derecha: la etiqueta va debajo-derecha del punto y, si no cabe (teléfono), arriba-izquierda
      const txt = `${k} ${S.l('capas', 'layers')}: ${sci(S, normAt(run, c))}`, tw = d.measure(txt, { size: 13, weight: 800, font: 'mono' }), px = plot.X(c), py2 = plot.Y(v);
      if (px + 8 * u + tw <= B.x + B.w - 2 * u) d.text(txt, px + 8 * u, py2 + 16 * u, { size: 13, weight: 800, font: 'mono', color: err.ink, base: 'middle', halo: p.stage, haloW: 5 });
      else d.text(txt, px - 8 * u, py2 - 14 * u, { size: 13, weight: 800, font: 'mono', color: err.ink, align: 'right', base: 'middle', halo: p.stage, haloW: 5 });
    });
  }
  // lectura
  const ry = B.y + B.h - 12 * u;
  const reached = clamp(o.sweep) >= 0.999;
  d.text(S.l('llega a la entrada:', 'reaches the input:'), B.x + 2 * u, ry, { size: 13, weight: 700, color: p.ink2, base: 'middle' });
  const shown = reached ? run.norms[D] : run.norms[Math.min(D, Math.floor(o.sweep * D))];
  d.text(sci(S, shown, 1), B.x + 2 * u + 140 * u, ry, { size: 16, weight: 800, font: 'mono', color: o.res ? tone(S, 'dat').ink : err.ink, base: 'middle' });
  if (o.res && o.ghost) { const g = gradRun(o.D, false); d.text(`${S.l('sin atajos', 'plain')}: ${sci(S, g.norms[D], 1)}`, B.x + B.w - 4 * u, ry, { size: 13, weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
  else if (!o.res && reached) d.text(`${S.l('por capa', 'per layer')} ×${dec(S, perLayerFactor(run), 2)}`, B.x + B.w - 4 * u, ry, { size: 13, weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  return { plot };
}

// ═════════ el problema: un factor menor que uno en cada capa ═════════
export function drawDeepProblem(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), err = tone(S, 'err');
  const n = 7, slot = (B.w - 12 * u) / n, bw = Math.min(slot * 0.62, 54 * u), hMax = B.h * 0.4, base = B.y + B.h * 0.66;
  for (let i = 0; i < n; i++) {                // i = 0: la capa de salida (derecha)
    const a = fa(S, 'deep-problem', 0.06 + i * 0.07, 0.16 + i * 0.07), x = B.x + 6 * u + (n - 1 - i) * slot + (slot - bw) / 2, v = Math.pow(0.5, i);
    if (a <= 0) continue;
    d.withAlpha(a, () => {
      d.rect(x, base, bw, 26 * u, { fill: p.surface2, stroke: p.lineStrong, lw: 1.5, r: 3 });
      d.text(String(n - i), x + bw / 2, base + 13 * u, { size: 13, weight: 700, font: 'mono', color: p.mute, align: 'center', base: 'middle' });
      const h = Math.max(2, hMax * v * a);
      d.rect(x + bw * 0.2, base - 8 * u - h, bw * 0.6, h, { fill: alpha(err.c, 0.65), stroke: err.c, lw: 1.5 });
      d.text(dec(S, v, v < 0.1 ? 3 : v < 0.2 ? 2 : v < 1 ? 2 : 0).replace(/(,|\.)?0+$/, ''), x + bw / 2, base - 12 * u - h, { size: 12, weight: 700, font: 'mono', color: err.ink, align: 'center', base: 'bottom' });
    });
  }
  const arrow = fa(S, 'deep-problem', 0.5, 0.75);
  d.withAlpha(arrow, () => {
    const y = base + 44 * u;
    d.arrow(B.x + B.w - 10 * u, y, B.x + 14 * u, y, p.ink2, 2, 9);
    d.text(S.l('retropropagación: el gradiente retrocede', 'backpropagation: the gradient travels back'), B.x + B.w / 2, y + 8 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'top', w: B.w });
    d.text(S.l('entrada', 'input'), B.x + 6 * u, base - 8 * u - hMax - 6 * u, { size: 12, weight: 700, color: p.mute, base: 'bottom' });
    d.text(S.l('salida', 'output'), B.x + B.w - 6 * u, base - 8 * u - hMax - 6 * u, { size: 12, weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  d.withAlpha(fa(S, 'deep-problem', 0.7, 0.85), () => badge(S, S.l('ilustración: factor 0.5 por capa', 'illustration: factor 0.5 per layer'), B.x + B.w / 2, B.y + 12 * u, { tone: 'mute' }));
}

// ═════════ el juguete: toy (se prepara) y vanish (el gradiente retrocede) ═════════
export function drawToy(S: Frame) {
  const B = strip(S, 2), vanish = S.on('vanish');
  const sweep = vanish ? fa(S, 'vanish', 0.06, 0.7, 'lin') : 0;
  gradView(S, B, { D: 40, res: false, sweep, marks: true, probe: !vanish });
  if (!vanish) {
    const a = fa(S, 'toy', 0.15, 0.3);
    S.d.withAlpha(a * 0.9, () => S.d.text(S.l('juguete: sin entrenar, sin normalización', 'toy: untrained, no normalization'), B.x + B.w - 4 * S.u, B.y + 2 * S.u, { size: 12, weight: 600, color: S.pal.mute, align: 'right', base: 'top' }));
  }
}

// ═════════ el bloque residual: x → F → + → y, con el atajo ═════════
export function drawSkipBlock(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), grad = S.on('skip-grad');
  const k = grad ? 'skip-grad' : 'skip-idea';
  const wt = tone(S, 'w'), sg = tone(S, 'sig'), er = tone(S, 'err');
  const cy = B.y + B.h * 0.5, x0 = B.x + B.w * 0.1, x1 = B.x + B.w * 0.4, x2 = B.x + B.w * 0.72, x3 = B.x + B.w * 0.92;
  const bw = Math.min(B.w * 0.2, 96 * u), bh = 44 * u, pr = 15 * u, arcH = Math.min(B.h * 0.3, 78 * u);
  const aIn = grad ? 1 : fa(S, 'skip-idea', 0.05, 0.15), aF = grad ? 1 : fa(S, 'skip-idea', 0.12, 0.25), aSkip = grad ? 1 : fa(S, 'skip-idea', 0.45, 0.62);
  // nodos
  d.withAlpha(aIn, () => {
    d.rect(x0 - 20 * u, cy - 20 * u, 40 * u, 40 * u, { fill: sg.soft, stroke: sg.c, lw: 2, r: 3 });
    d.text('x', x0, cy, { size: 20, weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
    d.text(S.l('entrada', 'input'), x0, cy + 34 * u, { size: 12, weight: 700, color: p.mute, align: 'center', base: 'top' });
  });
  d.withAlpha(aF, () => {
    d.rect(x1 - bw / 2, cy - bh / 2, bw, bh, { fill: wt.soft, stroke: wt.c, lw: 2, r: 3 });
    d.text('F', x1, cy - 4 * u, { size: 20, weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
    d.text(S.l('capas con pesos', 'layers with weights'), x1, cy + bh / 2 + 8 * u, { size: 12, weight: 700, color: p.mute, align: 'center', base: 'top' });
  });
  const yOut = aSkip > 0 ? 1 : 0;
  d.withAlpha(Math.max(aF, 0), () => {
    // flechas principales
    d.arrow(x0 + 20 * u, cy, x1 - bw / 2 - 2, cy, p.ink2, 2, 8);
    if (aSkip > 0) {
      d.arrow(x1 + bw / 2, cy, x2 - pr - 2, cy, p.ink2, 2, 8);
      d.arrow(x2 + pr, cy, x3 - 20 * u - 2, cy, p.ink2, 2, 8);
    } else d.arrow(x1 + bw / 2, cy, x3 - 20 * u - 2, cy, p.ink2, 2, 8);
  });
  d.withAlpha(aF, () => {
    d.rect(x3 - 20 * u, cy - 20 * u, 40 * u, 40 * u, { fill: p.surface2, stroke: p.lineStrong, lw: 2, r: 3 });
    d.text('y', x3, cy, { size: 20, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    d.text(S.l('salida', 'output'), x3, cy + 34 * u, { size: 12, weight: 700, color: p.mute, align: 'center', base: 'top' });
  });
  // el atajo y la suma
  let skipPath: Pt[] = [], mainPath: Pt[] = [[x0 + 20 * u, cy], [x1 - bw / 2, cy], [x1 + bw / 2, cy], [x3 - 20 * u, cy]];
  if (yOut) {
    skipPath = [[x0 + 24 * u, cy], [x0 + 24 * u, cy - arcH], [x2, cy - arcH], [x2, cy - pr]];
    mainPath = [[x0 + 20 * u, cy], [x1 - bw / 2, cy], [x1 + bw / 2, cy], [x2 - pr, cy], [x2 + pr, cy], [x3 - 20 * u, cy]];
    d.withAlpha(aSkip, () => {
      d.polyline(skipPath, tone(S, 'err').c, 2.5, { a: 0.9 });
      d.arrow(x2, cy - arcH + 0.1, x2, cy - pr - 1, tone(S, 'err').c, 2.5, 9);
      d.circle(x2, cy, pr, { fill: p.surface, stroke: p.ink, lw: 2 });
      d.text('+', x2, cy, { size: 22, weight: 800, color: p.ink, align: 'center', base: 'middle' });
      d.text(S.l('atajo', 'shortcut'), (x0 + x2) / 2, cy - arcH - 8 * u, { size: 13, weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'bottom' });
    });
  }
  // pulsos: hacia delante (señal) en skip-idea, hacia atrás (gradiente) en skip-grad
  if (!grad) {
    const t = (S.clock * 0.35) % 1, a = fa(S, 'skip-idea', 0.2, 0.3);
    d.withAlpha(a, () => {
      const q = along(mainPath, t); d.circle(q[0], q[1], 5 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
      if (yOut) { const s2 = along(skipPath, t); d.circle(s2[0], s2[1], 5 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 }); }
    });
  } else {
    const t = (S.clock * 0.3) % 1, a = fa(S, 'skip-grad', 0.1, 0.2), rev = (path: Pt[], tt: number) => along([...path].reverse(), tt);
    d.withAlpha(a, () => {
      const q = rev(mainPath, t), shrink = 1 - 0.55 * clamp((t - 0.35) / 0.4), pq = rev(skipPath, t);
      d.circle(q[0], q[1], 5.5 * u * (t > 0.35 && t < 0.78 ? shrink : t >= 0.78 ? 0.45 : 1), { fill: er.c, stroke: p.stage, lw: 1.5 });
      d.circle(pq[0], pq[1], 5.5 * u, { fill: er.c, stroke: p.stage, lw: 1.5 });
    });
    d.withAlpha(fa(S, 'skip-grad', 0.3, 0.45), () => {
      d.text(S.l('× pesos: se atenúa', '× weights: it fades'), x1, cy - bh / 2 - 8 * u, { size: 12, weight: 700, color: er.ink, align: 'center', base: 'bottom' });
      d.text(S.l('× 1: pasa intacto', '× 1: passes untouched'), (x0 + x2) / 2, cy - arcH + 18 * u, { size: 12, weight: 700, color: er.ink, align: 'center', base: 'top' });
    });
  }
  // fórmula
  const fy = B.y + B.h - 26 * u;
  if (!grad) d.withAlpha(fa(S, 'skip-idea', 0.55, 0.72), () => formulaBox(S, B.x + B.w / 2, fy, [['y', 'ink'], [' = ', 'mute'], ['x', 'sig'], [' + ', 'mute'], ['F(x)', 'w']]));
  else d.withAlpha(fa(S, 'skip-grad', 0.5, 0.7), () => formulaBox(S, B.x + B.w / 2, fy, [['∂y/∂x', 'ink'], [' = ', 'mute'], ['1', 'err'], [' + ', 'mute'], ['∂F/∂x', 'w']]));
  void k; void lerp; void neu;
}

function formulaBox(S: Frame, cx: number, cy: number, parts: [string, 'ink' | 'mute' | 'sig' | 'w' | 'err'][]) {
  const { d, pal: p } = S, u = S.u, size = 20;
  const widths = parts.map(([t]) => d.measure(t, { size, weight: 800, font: 'mono' }));
  const total = widths.reduce((a, b) => a + b, 0), x0 = cx - total / 2;
  d.rect(x0 - 14 * u, cy - 19 * u, total + 28 * u, 38 * u, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
  let x = x0;
  parts.forEach(([t, c], i) => { d.text(t, x, cy, { size, weight: 800, font: 'mono', color: c === 'ink' ? p.ink : c === 'mute' ? p.mute : tone(S, c).ink, base: 'middle' }); x += widths[i]; });
}

// ═════════ tu turno: profundidad y atajos ═════════
export interface SkipState { shown: number; seen: { plain: boolean; res: boolean } }
export function skipUpdate(S: Frame) {
  if (!S.between('skip-demo', 'degradation')) return;
  const st = (S.st.skip ??= { shown: 20, seen: { plain: false, res: false } } as SkipState) as SkipState;
  const target = clamp(Math.round(S.p.depth ?? 20), 1, D_MAX), res = S.p.mode === 'res';
  st.shown += (target - st.shown) * (1 - Math.exp(-S.dt * 9));
  if (Math.abs(target - st.shown) < 0.05) st.shown = target;
  if (target >= 30 && (S.touched.has('mode') || S.touched.has('depth'))) { if (res) st.seen.res = true; else st.seen.plain = true; }
  if (st.seen.plain && st.seen.res) S.complete('skip');
}
export function drawSkipTry(S: Frame) {
  const B = strip(S, 2), st = S.st.skip as SkipState | undefined;
  const D = clamp(Math.round(st?.shown ?? S.p.depth ?? 20), 1, D_MAX), res = S.p.mode === 'res';
  const a = Math.max(fa(S, 'skip-demo', 0.02, 0.15), S.on('skip-try') ? 1 : 0);
  S.d.withAlpha(a, () => gradView(S, B, { D, res, sweep: 1, ghost: true, head: res ? S.l('con atajos (y = x + F(x))', 'with shortcuts (y = x + F(x))') : S.l('red simple (sin atajos)', 'plain network (no shortcuts)') }));
}

// ═════════ la degradación: más capas, peor error de entrenamiento (esquema) ═════════
export function drawDegradation(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2);
  const plot = new Plot(S, { x: B.x, y: B.y, w: B.w, h: B.h - 30 * u }, { xr: [0, 1], yr: [0, 1], xLabel: S.l('iteraciones de entrenamiento', 'training iterations'), yLabel: S.l('error de entrenamiento', 'training error'), pad: { l: 14, t: 48, b: 34 } });
  const a = fa(S, 'degradation', 0.04, 0.16);
  plot.axes(a);
  const c20 = (t: number) => 0.1 + 0.8 * Math.exp(-3.4 * t) - 0.05 * clamp((t - 0.5) / 0.1), c56 = (t: number) => 0.3 + 0.62 * Math.exp(-2.6 * t) - 0.05 * clamp((t - 0.5) / 0.1);
  const g = fa(S, 'degradation', 0.2, 0.55, 'lin');
  plot.curve(c20, 'dat', 3.5, { to: g });
  plot.curve(c56, 'err', 3.5, { to: g, dash: [8, 4] });
  if (g > 0.98) {
    d.withAlpha(fa(S, 'degradation', 0.55, 0.7), () => {
      plot.label(S.l('20 capas', '20 layers'), 0.97, c20(1) - 0.07, 'dat', { size: 14, align: 'right', base: 'top' });
      plot.label(S.l('56 capas', '56 layers'), 0.97, c56(1) + 0.06, 'err', { size: 14, align: 'right', base: 'bottom' });
      plot.line(0.62, c20(0.62), 0.62, c56(0.62), 'ink', 2);
      plot.label(S.l('más error', 'more error'), 0.6, (c20(0.62) + c56(0.62)) / 2, 'ink', { size: 13, align: 'right' });
    });
    d.withAlpha(fa(S, 'degradation', 0.72, 0.85), () => badge(S, S.l('no es sobreajuste: también sube el error de entrenamiento', 'not overfitting: training error rises too'), B.x + B.w / 2, B.y + 12 * u, { tone: 'err', size: 12 }));
  }
  d.withAlpha(a * 0.9, () => d.text(S.l('esquema: forma según He et al. (2015), figura 1, CIFAR-10', 'sketch: shape after He et al. (2015), figure 1, CIFAR-10'), B.x + B.w / 2, B.y + B.h - 2 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom', w: B.w }));
}

// ═════════ ResNet-152 y el resultado de 2015 ═════════
export function drawResnetWin(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait;
  const er = tone(S, 'err'), dt = tone(S, 'dat');
  const gridR: Rect = vertical ? { x: B.x, y: B.y, w: B.w, h: B.h * 0.5 } : { x: B.x, y: B.y, w: B.w * 0.56, h: B.h };
  const numR: Rect = vertical ? { x: B.x, y: B.y + B.h * 0.5, w: B.w, h: B.h * 0.5 } : { x: B.x + B.w * 0.6, y: B.y, w: B.w * 0.4, h: B.h };
  // 50 bloques residuales (3 + 8 + 36 + 3)
  const cols = vertical ? 10 : 10, rows = 5, cw = Math.min(gridR.w / cols, (gridR.h - 24 * u) / rows * 1.3), ch = (gridR.h - 24 * u) / rows;
  const bw = cw * 0.8, bh = Math.min(ch * 0.46, 20 * u);
  const gx = gridR.x + (gridR.w - cols * cw) / 2;
  const prog = fa(S, 'resnet-win', 0.08, 0.5, 'lin');
  for (let k = 0; k < 50; k++) {
    const vis = clamp(prog * 50 - k);
    if (vis <= 0) continue;
    const r = Math.floor(k / cols), c = k % cols, x = gx + c * cw + (cw - bw) / 2, y = gridR.y + 6 * u + r * ch + ch * 0.36;
    d.withAlpha(vis, () => {
      d.rect(x, y, bw, bh, { fill: tone(S, 'w').soft, stroke: tone(S, 'w').c, lw: 1 });
      d.polyline([[x - 1, y + bh / 2], [x - 1, y - bh * 0.35], [x + bw + 1, y - bh * 0.35], [x + bw + 1, y + bh / 2]], er.c, 1.4);
    });
  }
  d.withAlpha(fa(S, 'resnet-win', 0.4, 0.55), () => d.text(S.l('50 bloques residuales', '50 residual blocks'), gridR.x + gridR.w / 2, gridR.y + gridR.h - 4 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'bottom' }));
  const a1 = fa(S, 'resnet-win', 0.3, 0.45), a2 = fa(S, 'resnet-win', 0.6, 0.78);
  const cx = numR.x + numR.w / 2, big = vertical ? 30 : 40;
  d.withAlpha(a1, () => {
    d.text('152', cx, numR.y + numR.h * (vertical ? 0.2 : 0.28), { size: big + 8, weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'middle' });
    d.text(S.l('capas', 'layers'), cx, numR.y + numR.h * (vertical ? 0.2 : 0.28) + 30 * u, { size: 14, weight: 700, color: p.ink2, align: 'center', base: 'top' });
  });
  d.withAlpha(a2, () => {
    d.text(`${dec(S, 3.57, 2)}${S.l(' %', '%')}`, cx, numR.y + numR.h * (vertical ? 0.62 : 0.66), { size: big + 4, weight: 800, font: 'mono', color: dt.ink, align: 'center', base: 'middle' });
    d.text(S.l('error top-5 (conjunto) · gana 2015', 'top-5 error (ensemble) · wins 2015'), cx, numR.y + numR.h * (vertical ? 0.62 : 0.66) + 28 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'top', w: numR.w - 8 * u });
  });
  neu(S, vertical ? numR.x + numR.w - 64 * u : numR.x + numR.w - 70 * u, vertical ? numR.y + 6 * u : B.y + B.h - 64 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'happy', a: a2 });
}
