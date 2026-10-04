// El plano de las dos entradas: regiones, frontera de decisión, puntos de ejemplo y las lecturas laterales.
import { Plot, alpha, clamp, lerp, mix, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DATA, EX, N, act, chord, fire, zOf, type Params } from './model';
import { arrow, fs, num, tag, txt } from './ui';

const LO = -0.06, HI = 1.06;

export interface PlaneSpec {
  p: Params;
  ghost?: Params | null;
  blend?: number;        // 0 = escalón, 1 = sigmoide
  k?: number;            // multiplicador de la pendiente de la sigmoide
  tint?: number;         // opacidad de las regiones
  line?: number;         // progreso de trazo de la frontera
  points?: number;       // cuántos puntos de datos se ven (fraccionario)
  rings?: number;        // opacidad de los aros de error
  example?: number;      // opacidad del correo de ejemplo
  probe?: { x: number; y: number } | null;
  arrow?: number;        // opacidad de la flecha del vector w
  zLabel?: number;       // opacidad de la etiqueta «z = 0»
  sides?: number;        // opacidad de los rótulos de región
  hot?: number;          // índice del punto resaltado (-1 ninguno)
  pulse?: boolean;
}

/** Rectángulo cuadrado del plano dentro de la zona principal. */
export function planeRect(S: Frame, main: Rect): Rect {
  const u = S.u, padL = 36 * u, padB = 36 * u, padT = 8 * u, padR = 8 * u;
  const side = Math.max(60, Math.min(main.w - padL - padR, main.h - padB - padT));
  return { x: main.x + padL + (main.w - padL - padR - side) / 2, y: main.y + padT + (main.h - padB - padT - side) / 2, w: side, h: side };
}
export const planePlot = (S: Frame, main: Rect) => new Plot(S, planeRect(S, main), { xr: [LO, HI], yr: [LO, HI], pad: { l: 0, r: 0, t: 0, b: 0 } });

export function drawPlane(S: Frame, main: Rect, o: PlaneSpec): Plot {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const plot = planePlot(S, main), r = plot.r;
  const dt = tone(S, 'dat'), er = tone(S, 'err'), wt = tone(S, 'w'), sg = tone(S, 'sig');
  const { w1, w2, b } = o.p, blend = o.blend ?? 0, kk = o.k ?? 1;

  // marco y ejes
  d.rect(r.x, r.y, r.w, r.h, { fill: alpha(p.surface, 0.55) });
  // regiones (mapa de calor pixelado: cada celda es la salida de la neurona en ese punto)
  const tint = o.tint ?? 0;
  if (tint > 0.01) {
    const lut: string[] = []; for (let i = 0; i <= 32; i++) lut.push(alpha(mix(dt.c, er.c, i / 32), 0.2));
    plot.heat((x, y) => act(zOf(w1, w2, b, x, y), blend, kk), (v) => lut[Math.round(clamp(v) * 32)], port ? [30, 30] : [38, 38], tint);
  }
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1.5 });
  // ticks 0 y 1 y rótulos de los ejes
  [0, 1].forEach((v) => {
    d.line(plot.X(v), r.y + r.h, plot.X(v), r.y + r.h + 4 * u, p.lineStrong, 1.5);
    txt(S, String(v), plot.X(v), r.y + r.h + 6 * u, { size: 12, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    d.line(r.x - 4 * u, plot.Y(v), r.x, plot.Y(v), p.lineStrong, 1.5);
    txt(S, String(v), r.x - 7 * u, plot.Y(v), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  });
  txt(S, `${S.l('enlaces', 'links')} x₁ →`, r.x + r.w, r.y + r.h + 22 * u, { size: 13, weight: 700, color: p.ink2, align: 'right', base: 'top' });
  S.ctx.save(); S.ctx.translate(r.x - 24 * u, r.y + r.h); S.ctx.rotate(-Math.PI / 2);
  txt(S, `${S.l('confianza', 'trust')} x₂ →`, 0, 0, { size: 13, weight: 700, color: p.ink2, align: 'left', base: 'bottom' });
  S.ctx.restore();

  const box: [number, number, number, number] = [LO, HI, LO, HI];
  const line = (pp: Params, color: string, lw: number, dash?: number[], t = 1, a = 1) => {
    const c = chord(pp.w1, pp.w2, pp.b, box); if (!c) return null;
    const [A, B] = c;
    d.line(plot.X(A[0]), plot.Y(A[1]), lerp(plot.X(A[0]), plot.X(B[0]), t), lerp(plot.Y(A[1]), plot.Y(B[1]), t), color, lw, dash, a);
    return c;
  };
  if (o.ghost) line(o.ghost, p.mute, 2, [6, 5], 1, 0.9);
  const lt = o.line ?? 0;
  let ch: ReturnType<typeof chord> = null;
  if (lt > 0) ch = line(o.p, p.ink, 3.2 * Math.max(1, u * 0.85), undefined, lt);

  // flecha del vector w (normal a la frontera: apunta hacia donde z crece)
  const ar = o.arrow ?? 0;
  if (ar > 0 && ch) {
    const mx = (ch[0][0] + ch[1][0]) / 2, my = (ch[0][1] + ch[1][1]) / 2, n = Math.hypot(w1, w2) || 1;
    const len = Math.min(r.w * 0.16, 56 * u), sx = plot.X(mx), sy = plot.Y(my), ex = sx + (w1 / n) * len, ey = sy - (w2 / n) * len;
    // la etiqueta «w» va junto a la punta, del lado donde no haya un punto de datos
    const dx = w1 / n, dy = -w2 / n, vis = Math.ceil(o.points ?? 0);
    const cands: [number, number][] = [[dx * 11, dy * 11], [-dy * 13 + dx * 4, dx * 13 + dy * 4], [dy * 13 + dx * 4, -dx * 13 + dy * 4], [dx * 20, dy * 20]];
    const clear = (cx: number, cy: number) => Math.min(99, ...DATA.slice(0, vis).map((q) => Math.hypot(plot.X(q.x) - cx, plot.Y(q.y) - cy) / u));
    let best = cands[0], bd = -1;
    for (const c of cands) { const k = clear(ex + c[0] * u, ey + c[1] * u); if (k > bd + 1e-6) { bd = k; best = c; if (k >= 14) break; } }
    d.withAlpha(ar, () => {
      arrow(S, sx, sy, ex, ey, wt.c, 3, 10);
      txt(S, 'w', ex + best[0] * u, ey + best[1] * u, { size: 15, weight: 800, color: wt.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 4 });
    });
  }
  if ((o.zLabel ?? 0) > 0 && ch) {
    const t = ch[0][1] > ch[1][1] ? ch[0] : ch[1], q = ch[0][1] > ch[1][1] ? ch[1] : ch[0];
    const px = clamp(lerp(t[0], q[0], 0.18), 0.1, 0.9), py = lerp(t[1], q[1], 0.18);
    d.withAlpha(o.zLabel ?? 0, () => tag(S, 'z = 0', plot.X(px) + 0 * u, plot.Y(py) - 14 * u, { mono: true, size: 12, weight: 800 }));
  }

  // rótulos de región (centroide de cada lado, solo si hay área suficiente)
  if ((o.sides ?? 0) > 0) {
    let c1 = [0, 0, 0], c0 = [0, 0, 0];
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const x = LO + ((i + 0.5) / 12) * (HI - LO), y = LO + ((j + 0.5) / 12) * (HI - LO); const t = zOf(w1, w2, b, x, y) >= 0 ? c1 : c0; t[0] += x; t[1] += y; t[2]++; }
    const place = (c: number[], text: string, tn: 'err' | 'dat') => {
      if (c[2] < 14) return;
      const w = d.measure(text, { size: fs(S, 12), weight: 600 }) + 12 * u;
      const x = clamp(plot.X(c[0] / c[2]), r.x + w / 2 + 4, r.x + r.w - w / 2 - 4), y = clamp(plot.Y(c[1] / c[2]), r.y + 14 * u, r.y + r.h - 14 * u);
      tag(S, text, x, y, { tone: tn, a: o.sides, size: 12 });
    };
    place(c1, S.l('1 · sospechoso', '1 · suspicious'), 'err'); place(c0, S.l('0 · legítimo', '0 · legitimate'), 'dat');
  }

  // correo de ejemplo
  const ea = o.example ?? 0;
  if (ea > 0) {
    d.withAlpha(ea, () => {
      const ex = plot.X(EX.x1), ey = plot.Y(EX.x2), pl = o.pulse ? 0.5 + 0.5 * Math.sin(S.clock * 4) : 1;
      d.circle(ex, ey, 11 * u, { fill: alpha(sg.c, 0.25), stroke: sg.c, lw: 3 });
      d.circle(ex, ey, 4 * u, { fill: sg.c });
      d.circle(ex, ey, 17 * u + 3 * u * pl, { stroke: sg.c, lw: 1.5, a: 0.5 });
      tag(S, S.l('este correo', 'this email'), clamp(ex - 4 * u, r.x + 40 * u, r.x + r.w - 40 * u), ey + 28 * u, { tone: 'sig' });
    });
  }

  // datos
  const np = o.points ?? 0;
  if (np > 0) {
    DATA.forEach((q, i) => {
      const a = clamp(np - i);
      if (a <= 0) return;
      const wrong = fire(zOf(w1, w2, b, q.x, q.y)) !== q.t;
      plot.datum(q.x, q.y, q.t, { a, r: 5.2 });
      if (wrong && (o.rings ?? 0) > 0) d.circle(plot.X(q.x), plot.Y(q.y), (5.2 + 6.5) * u, { stroke: p.ink, lw: 2, a: (o.rings ?? 0) * a });
    });
  }
  if (o.hot !== undefined && o.hot >= 0) {
    const q = DATA[o.hot], pl = 0.5 + 0.5 * Math.sin(S.clock * 5);
    d.circle(plot.X(q.x), plot.Y(q.y), (13 + 3 * pl) * u, { stroke: tone(S, 'err').c === p.err ? p.ink : p.ink, lw: 3 });
  }

  // sonda: el correo nuevo que la persona toca
  if (o.probe) {
    const pr = o.probe, z = zOf(w1, w2, b, pr.x, pr.y), v = act(z, blend, kk), px = plot.X(pr.x), py = plot.Y(pr.y);
    d.polygon([[px, py - 8 * u], [px + 8 * u, py], [px, py + 8 * u], [px - 8 * u, py]], { fill: p.stage, stroke: p.ink, lw: 2.5 });
    const text = blend > 0.5 ? num(S, v, 2) : String(fire(z));
    const ty = py - 22 * u < r.y + 10 * u ? py + 22 * u : py - 22 * u;
    tag(S, text, clamp(px, r.x + 24 * u, r.x + r.w - 24 * u), ty, { mono: true, weight: 800, size: 13 });
  }
  return plot;
}

// ── gráfica de la función de activación ──────────────────────────────────
export function drawAct(S: Frame, r: Rect, o: { blend: number; k?: number; z?: number | null; flat?: number; label?: boolean }) {
  const { d, pal: p } = S, u = S.u, sg = tone(S, 'sig'), er = tone(S, 'err');
  const pad = { l: 26 * u, r: 8 * u, t: 8 * u, b: 20 * u };
  const R: Rect = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const ZR = 5, X = (z: number) => R.x + ((z + ZR) / (2 * ZR)) * R.w, Y = (v: number) => R.y + R.h - v * R.h;
  d.line(R.x, Y(0), R.x + R.w, Y(0), p.lineStrong, 1.5); d.line(R.x, Y(1), R.x + R.w, Y(1), p.line, 1, [4, 4]); d.line(X(0), R.y, X(0), R.y + R.h, p.line, 1);
  txt(S, '1', R.x - 6 * u, Y(1), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  txt(S, '0', R.x - 6 * u, Y(0), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
  txt(S, 'z', R.x + R.w, Y(0) + 4 * u, { size: 13, weight: 700, color: p.ink2, align: 'right', base: 'top' });
  txt(S, 'f(z)', R.x + 4 * u, R.y, { size: 12, weight: 700, color: p.ink2, base: 'top' });
  if (o.blend > 0.02) { d.line(R.x, Y(0.5), R.x + R.w, Y(0.5), p.line, 1, [2, 4]); txt(S, S.n(0.5, 1), R.x - 6 * u, Y(0.5), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); }
  const zs: number[] = [];
  for (let i = -ZR * 10; i <= ZR * 10; i++) { if (i === 0) zs.push(-1e-6); zs.push(i / 10); }
  const pts: [number, number][] = zs.map((z) => [X(z), Y(act(z, o.blend, o.k ?? 1))]);
  d.polyline(pts, sg.c, 2.8);
  if ((o.flat ?? 0) > 0) {
    d.withAlpha(o.flat!, () => {
      d.line(X(1.3), Y(1), X(3.6), Y(1), er.c, 3.5); d.line(X(-3.6), Y(0), X(-1.3), Y(0), er.c, 3.5);
      tag(S, S.l('pendiente 0', 'slope 0'), X(2.4), Y(1) + 26 * u, { tone: 'err' });
    });
  }
  if (o.z !== undefined && o.z !== null) {
    const z = clamp(o.z, -ZR, ZR), v = act(o.z, o.blend, o.k ?? 1);
    d.line(X(z), Y(0), X(z), Y(v), sg.c, 1.5, [3, 3]);
    d.circle(X(z), Y(v), 5 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
  }
}

// ── aciertos en cada paso del perceptrón ─────────────────────────────────
export function drawHist(S: Frame, r: Rect, hist: number[], a = 1) {
  const { d, pal: p } = S, u = S.u, dt = tone(S, 'dat');
  const pad = { l: 26 * u, r: 10 * u, t: 22 * u, b: 6 * u };
  const R: Rect = { x: r.x + pad.l, y: r.y + pad.t, w: r.w - pad.l - pad.r, h: r.h - pad.t - pad.b };
  const nx = Math.max(10, hist.length), X = (i: number) => R.x + (i / (nx - 1)) * R.w, Y = (v: number) => R.y + R.h - (v / N) * R.h;
  d.withAlpha(a, () => {
    txt(S, S.l('aciertos en cada paso', 'hits at each step'), r.x, r.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
    d.line(R.x, Y(0), R.x + R.w, Y(0), p.line, 1); d.line(R.x, Y(N), R.x + R.w, Y(N), p.line, 1, [4, 4]);
    txt(S, String(N), R.x - 5 * u, Y(N), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    txt(S, '0', R.x - 5 * u, Y(0), { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    const pts: [number, number][] = hist.map((v, i) => [X(i), Y(v)]);
    d.polyline(pts, dt.c, 2.2);
    pts.forEach(([x, y]) => d.circle(x, y, 2.8 * u, { fill: dt.c }));
  });
}
