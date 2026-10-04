// Parte 3: las funciones de activación (sigmoide, tanh, ReLU) y la intuición geométrica de la no linealidad:
// una capa de dos neuronas ReLU dobla la recta numérica en forma de L, y tras el doblez una recta separa lo que antes no.
import { Plot, alpha, badge, box, clamp, lerp, link, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { drawFrame, drawLegend, drawRegion } from './field';
import { R } from './mlp';
import { fs, ph, sn, square } from './shared';

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
const relu = (z: number) => Math.max(0, z);

// ═════════════════════════════════════════════════════════════════════════
// Activaciones
// ═════════════════════════════════════════════════════════════════════════
interface Act { id: 'sigmoid' | 'tanh' | 'relu'; f: (z: number) => number; xr: [number, number]; yr: [number, number]; name: string; formula: string; range: string; tone: 'sig' | 'lat' | 'w' | 'dat' }

export function drawActs(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const acts: Act[] = [
    { id: 'sigmoid', f: sigmoid, xr: [-6, 6], yr: [-0.25, 1.25], name: S.l('sigmoide', 'sigmoid'), formula: 'σ(z) = 1 / (1 + e⁻ᶻ)', range: S.l('sale entre 0 y 1', 'output between 0 and 1'), tone: 'sig' },
    { id: 'tanh', f: Math.tanh, xr: [-3, 3], yr: [-1.4, 1.4], name: S.l('tangente hiperbólica', 'hyperbolic tangent'), formula: 'tanh(z) = 2σ(2z) − 1', range: S.l('sale entre −1 y 1', 'output between −1 and 1'), tone: 'lat' },
    { id: 'relu', f: relu, xr: [-2.2, 2.2], yr: [-0.4, 2.2], name: 'ReLU', formula: 'ReLU(z) = max(0, z)', range: S.l('cero si z < 0; z si z ≥ 0', 'zero if z < 0; z if z ≥ 0'), tone: 'w' },
  ];
  // franja superior: suma → activación → salida
  const stripH = 34 * u, strip: Rect = { x: all.x, y: all.y, w: all.w, h: stripH };
  const body: Rect = { x: all.x, y: all.y + stripH + 10 * u, w: all.w, h: all.h - stripH - 10 * u };
  const sa = ph(S, 'activations', 0.0, 0.25, 'out');
  d.withAlpha(sa, () => {
    const names = [S.l('suma ponderada z', 'weighted sum z'), S.l('activación φ', 'activation φ'), S.l('salida φ(z)', 'output φ(z)')];
    const bw = Math.min(190 * u, (strip.w - 2 * 26 * u) / 3);
    const x0 = strip.x + (strip.w - (3 * bw + 2 * 26 * u)) / 2, rs: Rect[] = [0, 1, 2].map((i) => ({ x: x0 + i * (bw + 26 * u), y: strip.y, w: bw, h: stripH }));
    rs.forEach((r, i) => box(S, r, names[i], { tone: i === 1 ? 'sig' : 'ink', size: 13, active: i === 1 ? 0.5 : 0 }));
    link(S, rs[0], rs[1], { tone: 'ink' }); link(S, rs[1], rs[2], { tone: 'ink' });
  });

  // celdas
  const gap = 14 * u;
  const cells: Rect[] = S.portrait
    ? [0, 1, 2].map((i) => { const h = (body.h - 2 * gap) / 3; return { x: body.x, y: body.y + i * (h + gap), w: body.w, h }; })
    : [0, 1, 2].map((i) => { const w = (body.w - 2 * gap) / 3; return { x: body.x + i * (w + gap), y: body.y, w, h: body.h }; });
  const reveals = [ph(S, 'activations', 0.4, 0.58, 'out'), ph(S, 'activations', 0.66, 0.86, 'out'), ph(S, 'relu', 0.1, 0.34, 'out')];
  const lin = ph(S, 'nonlinear', 0.05, 0.3, 'out'), tags = ph(S, 'nonlinear', 0.35, 0.6, 'out');
  acts.forEach((a, i) => {
    const v = reveals[i]; if (v <= 0) return;
    const c = cells[i], t = tone(S, a.tone);
    // en vertical, el gráfico va a la izquierda y el texto a la derecha; en horizontal, el texto va debajo
    const plotR: Rect = S.portrait ? { x: c.x, y: c.y, w: c.w * 0.46, h: c.h } : { x: c.x, y: c.y, w: c.w, h: c.h - 76 * u };
    const textR: Rect = S.portrait ? { x: c.x + c.w * 0.49, y: c.y, w: c.w * 0.51, h: c.h } : { x: c.x, y: c.y + plotR.h + 4 * u, w: c.w, h: 72 * u };
    d.withAlpha(v, () => {
      const plot = new Plot(S, plotR, { xr: a.xr, yr: a.yr, originAxes: true, pad: { l: 8, r: 8, t: 8, b: 8 } });
      d.rect(plot.r.x, plot.r.y, plot.r.w, plot.r.h, { fill: alpha(p.surface, 0.7), stroke: p.line, lw: 1 });
      plot.axes();
      if (lin > 0) d.withAlpha(lin, () => plot.curve((z) => z, 'mute', 2, { dash: [6, 5] }));
      plot.curve(a.f, a.tone, 3.4);
      if (a.id === 'relu') {
        const ca = ph(S, 'relu', 0.55, 0.78, 'out');
        if (ca > 0) d.withAlpha(ca, () => { plot.dot(0, 0, 6, 'w', { ring: true }); plot.label(S.l('esquina', 'corner'), 0.3, -0.2, 'w', { size: 13, align: 'left' }); });
      }
      if (tags > 0) d.withAlpha(tags, () => {
        const px = plot.X(a.xr[1] * 0.35), py = plot.Y(a.f(a.xr[1] * 0.35));
        const lx = plot.r.x + 6 * u, ly = plot.r.y + 14 * u;
        void px; void py;
        badge(S, S.l('no lineal', 'nonlinear'), lx, ly, { tone: a.tone, align: 'left' });
      });
      if (lin > 0 && i === 2) d.withAlpha(lin, () => plot.label(S.l('lineal', 'linear'), a.xr[1] * 0.55, a.xr[1] * 0.55 + 0.02, 'mute', { size: 12, align: 'right', base: 'bottom' }));
    });
    d.withAlpha(v, () => {
      const tx = textR.x + (S.portrait ? 4 * u : 0), wrapW = textR.w - 8 * u;
      let ty = textR.y + (S.portrait ? Math.max(4 * u, c.h * 0.5 - 40 * u) : 6 * u);
      const put = (str: string, o: { size: number; weight: number; font?: 'mono'; color: string }, gap: number) => {
        const r = d.text(str, tx, ty, { ...o, base: 'top', w: wrapW });
        ty += r.h + gap * u;
      };
      put(a.name, { size: fs(S, 15), weight: 800, color: t.ink }, 3);
      put(a.formula, { size: fs(S, 13), weight: 600, font: 'mono', color: p.ink }, 3);
      put(a.range, { size: fs(S, 12), weight: 500, color: p.ink2 }, 0);
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// El doblez: una recta numérica → plano → L
// ═════════════════════════════════════════════════════════════════════════
const IN0 = [-0.8, -0.55, -0.3, -0.05, 0.2, 0.45, 0.75];                  // clase 0 (círculos): centro
const OUT1 = [-2.55, -2.2, -1.85, -1.5, 1.45, 1.8, 2.15, 2.5];            // clase 1 (cruces): a ambos lados
const THR = 1.1;                                                            // |x| < 1,1  ⇔  h₁ + h₂ < 1,1
const FN = 28;
const fbuf = new Float32Array(FN * FN);

export function drawFold(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const main = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.66 } : { x: all.x, y: all.y, w: all.w * 0.62, h: all.h };
  const aside = S.portrait ? { x: all.x, y: all.y + all.h * 0.68, w: all.w, h: all.h * 0.32 } : { x: all.x + all.w * 0.66, y: all.y, w: all.w * 0.34, h: all.h };
  const sq = square(main, 'left'), plot = new Plot(S, sq, { xr: [-R + 0.2, R - 0.2], yr: [-R + 0.2, R - 0.2], pad: { l: 4, r: 4, t: 4, b: 4 } });
  const dt = tone(S, 'dat'), er = tone(S, 'err'), sg = tone(S, 'sig');
  const s1 = ph(S, 'fold-sum', 0.28, 0.72), s2 = ph(S, 'fold-relu', 0.22, 0.7), sl = ph(S, 'fold-line', 0.12, 0.45), a0 = S.reveal('fold-problem', 0, 0.6);

  // posición de un punto en cada etapa: (x, 0) → (x, −x) → (ReLU(x), ReLU(−x))
  const pos = (x: number): [number, number] => {
    const ya = -x * s1;
    return [lerp(x, relu(x), s2), lerp(ya, relu(-x), s2)];
  };

  // región tras trazar la recta h₁ + h₂ = 1,1
  if (sl > 0) {
    for (let j = 0; j < FN; j++) for (let i = 0; i < FN; i++) {
      const x = plot.iX(plot.r.x + ((i + 0.5) / FN) * plot.r.w), y = plot.iY(plot.r.y + ((j + 0.5) / FN) * plot.r.h);
      fbuf[j * FN + i] = x + y < THR ? 0.05 : 0.95;
    }
    d.withAlpha(sl, () => drawRegion(S, plot, fbuf, FN, 1));
  }
  d.withAlpha(a0, () => {
    d.rect(plot.r.x, plot.r.y, plot.r.w, plot.r.h, { fill: sl > 0 ? undefined : alpha(p.surface, 0.5) });
    drawFrame(S, plot);
    // ejes: al principio solo la recta numérica
    const y0 = plot.Y(0), x0 = plot.X(0);
    d.line(plot.r.x, y0, plot.r.x + plot.r.w, y0, p.lineStrong, 1.6);
    for (const t of [-2, -1, 0, 1, 2]) { d.line(plot.X(t), y0 - 4 * u, plot.X(t), y0 + 4 * u, p.lineStrong, 1.4); if (s1 < 0.5) d.text(String(t).replace('-', '−'), plot.X(t), y0 + 16 * u, { size: fs(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'middle' }); }
    d.text(S.l('x', 'x'), plot.r.x + plot.r.w - 8 * u, y0 - 14 * u, { size: fs(S, 14), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    const ya = S.at('fold-sum', 0, 0.8);
    if (ya > 0) d.withAlpha(ya, () => {
      d.line(x0, plot.r.y, x0, plot.r.y + plot.r.h, p.lineStrong, 1.6);
      d.text(S.l('neurona 2', 'neuron 2'), x0 + 16 * u, plot.r.y + 40 * u, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'middle' });
      d.text(S.l('neurona 1', 'neuron 1'), plot.r.x + plot.r.w - 8 * u, y0 + 22 * u, { size: fs(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'middle' });
    });
    // la recta separadora
    if (sl > 0) plot.line(THR + 3, -3, -3, THR + 3, 'ink', 2.6 * sl);
    // puntos
    const rr = Math.max(3.4, plot.r.w / 90);
    IN0.forEach((x) => { const [px, py] = pos(x); plot.datum(px, py, 0, { r: rr }); });
    OUT1.forEach((x) => { const [px, py] = pos(x); plot.datum(px, py, 1, { r: rr }); });
  });
  drawLegend(S, plot, a0);

  // lateral: qué hace cada neurona, con las cuentas
  const lines: { t: string; at: number; tn: 'ink' | 'dat' | 'sig' | 'err' }[] = [];
  const al = (id: string, f = 0.2) => ph(S, id, f, f + 0.18, 'out');
  const rows: { t: string[]; a: number }[] = [
    { t: [S.l('un solo corte no separa', 'one single cut does not separate')], a: S.at('fold-problem', 0.6, 1.2) * (1 - S.at('fold-sum', 0, 0.5)) },
    { t: [`z₁ = x`, `z₂ = −x`], a: al('fold-sum') * (1 - S.at('fold-relu', 0, 0.5)) },
    { t: [`h₁ = ReLU(z₁)`, `h₂ = ReLU(z₂)`], a: al('fold-relu') * (1 - S.at('fold-line', 0, 0.5)) },
    { t: [`h₁ + h₂ < ${sn(S, THR, 1)}`, S.l(`⇔  |x| < ${sn(S, THR, 1)}`, `⇔  |x| < ${sn(S, THR, 1)}`)], a: al('fold-line', 0.3) },
  ];
  rows.forEach((r, k) => {
    if (r.a <= 0.01) return;
    d.withAlpha(r.a, () => r.t.forEach((t, i) => d.text(t, aside.x + 4 * u, aside.y + (S.portrait ? 14 : 30) * u + i * 30 * u, { size: fs(S, k === 0 ? 14 : 17), weight: 700, font: k === 0 ? undefined : 'mono', color: k === 3 && i === 1 ? dt.ink : p.ink, base: 'middle', w: aside.w - 8 * u })));
  });
  void er; void sg; void clamp;
}
