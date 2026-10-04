// El diagrama de la neurona, armado pieza por pieza: entradas × pesos → suma → + sesgo → activación → salida.
import { alpha, clamp, lerp, neu, pulses, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BASE, fire } from './model';
import { arrow, fs, num, parts, tag, tau, tr, txt } from './ui';

type P2 = { x: number; y: number };

interface Geo {
  in1: P2; in2: P2; nr: number;
  body: Rect; entry1: P2; entry2: P2;
  sum: Rect; sumPort1: P2; sumPort2: P2;
  junc: P2; jr: number; bias: P2; br: number;
  f: Rect; out: P2; or: number;
}

function geometry(S: Frame, A: Rect): Geo {
  const u = S.u;
  if (!S.portrait) {
    const cy = A.y + A.h * 0.56, X = (k: number) => A.x + A.w * k;
    const sum: Rect = { x: X(0.37) - 43 * u, y: cy - 33 * u, w: 86 * u, h: 66 * u };
    const f: Rect = { x: X(0.72) - 52 * u, y: cy - 43 * u, w: 104 * u, h: 86 * u };
    const body: Rect = { x: sum.x - 24 * u, y: cy - 69 * u, w: f.x + f.w + 20 * u - (sum.x - 24 * u), h: 138 * u };
    return {
      in1: { x: X(0.10), y: cy - A.h * 0.29 }, in2: { x: X(0.10), y: cy + A.h * 0.29 }, nr: 21 * u,
      body, entry1: { x: body.x, y: cy - 15 * u }, entry2: { x: body.x, y: cy + 15 * u },
      sum, sumPort1: { x: sum.x, y: cy - 15 * u }, sumPort2: { x: sum.x, y: cy + 15 * u },
      junc: { x: X(0.555), y: cy }, jr: 13 * u, bias: { x: X(0.555), y: body.y }, br: 17 * u,
      f, out: { x: X(0.915), y: cy }, or: 24 * u,
    };
  }
  const cx = A.x + A.w / 2, Y = (k: number) => A.y + A.h * k;
  const sum: Rect = { x: cx - 56 * u, y: Y(0.43) - 24 * u, w: 112 * u, h: 48 * u };
  const f: Rect = { x: cx - 64 * u, y: Y(0.73) - 33 * u, w: 128 * u, h: 66 * u };
  const body: Rect = { x: cx - 100 * u, y: Y(0.30), w: 200 * u, h: f.y + f.h + 12 * u - Y(0.30) };
  return {
    in1: { x: A.x + A.w * 0.15, y: Y(0.10) }, in2: { x: A.x + A.w * 0.85, y: Y(0.10) }, nr: 20 * u,
    body, entry1: { x: cx - 28 * u, y: body.y }, entry2: { x: cx + 28 * u, y: body.y },
    sum, sumPort1: { x: cx - 28 * u, y: sum.y }, sumPort2: { x: cx + 28 * u, y: sum.y },
    junc: { x: cx, y: Y(0.575) }, jr: 12 * u, bias: { x: body.x + body.w, y: Y(0.575) }, br: 16 * u,
    f, out: { x: cx, y: Y(0.94) }, or: 21 * u,
  };
}

const edgePt = (from: P2, to: P2, r: number): P2 => { const a = Math.atan2(to.y - from.y, to.x - from.x); return { x: from.x + Math.cos(a) * r, y: from.y + Math.sin(a) * r }; };

/** Posición de la etiqueta del peso: sobre la línea (teléfono vertical) o desplazada hacia fuera del par de aristas (horizontal). */
const wTagPos = (a: P2, e: P2, other: P2, r: number, k: number, off: number): P2 => {
  const A0 = edgePt(a, e, r), dx = e.x - A0.x, dy = e.y - A0.y, L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (nx * (a.x - other.x) + ny * (a.y - other.y) < 0) { nx = -nx; ny = -ny; }
  return { x: lerp(A0.x, e.x, k) + nx * off, y: lerp(A0.y, e.y, k) + ny * off };
};

export function drawDiagram(S: Frame, D: Rect, vin: { x1: number; x2: number }) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const sg = tone(S, 'sig'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const { w1, w2, b } = BASE, { x1, x2 } = vin;
  const pr1 = w1 * x1, pr2 = w2 * x2, sm = pr1 + pr2, z = sm + b, y = fire(z);

  const strip = (port ? 30 : 38) * u, A: Rect = { x: D.x, y: D.y + strip + 6 * u, w: D.w, h: D.h - strip - 6 * u };
  const G = geometry(S, A);
  const cur = (id: string) => S.is(id);
  const pulse = 0.55 + 0.45 * Math.sin(S.clock * 4);

  // ── fórmula (franja superior)
  const aF = S.reveal('formula', 0.1, 0.6);
  if (S.on('formula') && aF > 0) {
    parts(S, [['y', sg.ink, true], [' = f(', p.ink2], ['w₁', wt.ink, true], ['x₁', sg.ink, true], [' + ', p.ink2], ['w₂', wt.ink, true], ['x₂', sg.ink, true], [' + ', p.ink2], ['b', wt.ink, true], [')', p.ink2]], D.x + D.w / 2, D.y + strip / 2, { size: port ? 17 : 20, a: aF });
  }

  // ── entradas
  const aIn = S.reveal('inputs', 0.2, 0.6);
  const ins: { P: P2; v: number; name: string; sym: string; above: boolean }[] = [
    { P: G.in1, v: x1, name: S.l('enlaces', 'links'), sym: 'x₁', above: true },
    { P: G.in2, v: x2, name: S.l('confianza', 'trust'), sym: 'x₂', above: port },
  ];
  d.withAlpha(aIn, () => ins.forEach((it) => {
    d.circle(it.P.x, it.P.y, G.nr, { fill: alpha(sg.c, 0.14), stroke: sg.c, lw: cur('inputs') ? 3 : 2 });
    txt(S, num(S, it.v, 2), it.P.x, it.P.y, { size: 13, weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
    const ly = it.above ? it.P.y - G.nr - 10 * u : it.P.y + G.nr + 10 * u;
    txt(S, `${it.name} ${it.sym}`, it.P.x, ly, { size: 13, weight: 700, color: p.ink2, align: 'center', base: it.above ? 'bottom' : 'top' });
  }));
  if (cur('inputs') && aIn > 0.5) {
    ins.forEach((it) => d.circle(it.P.x, it.P.y, G.nr + 5 * u, { stroke: p.ink, lw: 2, a: pulse * 0.8 }));
  }

  // ── cuerpo de la neurona (contenedor) y pesos
  const aBody = S.reveal('weights', 0, 0.6);
  if (aBody > 0) {
    d.withAlpha(aBody, () => {
      d.rect(G.body.x, G.body.y, G.body.w, G.body.h, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 1.5, dash: [7, 5], r: 12 * u });
      tag(S, S.l('neurona', 'neuron'), port ? G.body.x + 36 * u : G.body.x + G.body.w * 0.36, port ? G.body.y + G.body.h : G.body.y, { size: 12, opaque: true });
    });
  }
  const sumE = S.at('sum', 0, 0.6);
  const edges = [
    { a: G.in1, e: G.entry1, sp: G.sumPort1, w: w1, v: x1, pr: pr1, sym: 'w₁', other: G.in2 },
    { a: G.in2, e: G.entry2, sp: G.sumPort2, w: w2, v: x2, pr: pr2, sym: 'w₂', other: G.in1 },
  ];
  const aW = S.at('weights', 0.2, 1.1, 'io');
  edges.forEach((E) => {
    if (aW <= 0) return;
    const A0 = edgePt(E.a, E.e, G.nr + 2 * u);
    const tgt: P2 = { x: lerp(E.e.x, E.sp.x, sumE), y: lerp(E.e.y, E.sp.y, sumE) };
    const mag = Math.abs(E.w), lw = (1.4 + 1.1 * mag) * Math.max(1, u * 0.9);
    const end: P2 = { x: lerp(A0.x, tgt.x, aW), y: lerp(A0.y, tgt.y, aW) };
    d.line(A0.x, A0.y, end.x, end.y, wt.c, lw, E.w < 0 ? [7, 5] : undefined);
    if (aW >= 0.98 && sumE >= 0.98) arrow(S, lerp(A0.x, tgt.x, 0.9), lerp(A0.y, tgt.y, 0.9), tgt.x, tgt.y, wt.c, lw, 8);
    // etiqueta del peso, sobre la línea
    const aT = S.reveal('weights', 0.9, 0.5);
    if (aT > 0) {
      const tp = wTagPos(E.a, E.e, E.other, G.nr + 2 * u, port ? 0.46 : 0.34, port ? 0 : 21 * u);
      tag(S, `${E.sym} = ${num(S, E.w, 1)}`, tp.x, tp.y, { tone: 'w', mono: true, a: aT, size: 13, opaque: true });
    }
    // producto: en escritorio, justo encima (o debajo) de la etiqueta del peso; en teléfono, cerca de la entrada a la neurona
    const aP = S.reveal('products', 0.3, 0.6);
    if (aP > 0) {
      let cx: number, cy: number, ax: CanvasTextAlign = 'center';
      const compact = port || S.W < 700;
      const text = compact ? `= ${num(S, E.pr, 2)}` : `${num(S, E.v, 2)}×${num(S, E.w, 1)}=${num(S, E.pr, 2)}`;
      if (!compact) { cx = lerp(A0.x, E.e.x, 0.66); cy = lerp(A0.y, E.e.y, 0.66); }
      else if (!port) {
        // teléfono horizontal: el valor va entre las dos aristas, a la izquierda de su línea (a la derecha chocaría con la neurona)
        const px = lerp(A0.x, E.e.x, 0.6), py = lerp(A0.y, E.e.y, 0.6), dx = E.e.x - A0.x, dy = E.e.y - A0.y, L = Math.hypot(dx, dy) || 1;
        let nx = -dy / L, ny = dx / L;
        if (nx * (E.a.x - E.other.x) + ny * (E.a.y - E.other.y) > 0) { nx = -nx; ny = -ny; }
        cx = px + nx * 8 * u; cy = py + ny * 8 * u; ax = 'right';
      } else {
        const px = lerp(A0.x, E.e.x, 0.8), py = lerp(A0.y, E.e.y, 0.8), dx = E.e.x - A0.x, dy = E.e.y - A0.y, L = Math.hypot(dx, dy) || 1;
        let nx = -dy / L, ny = dx / L;
        if (nx * (E.a.x - E.other.x) + ny * (E.a.y - E.other.y) < 0) { nx = -nx; ny = -ny; }
        cx = px + nx * 12 * u; cy = py + ny * 12 * u; ax = nx < 0 ? 'right' : 'left';
      }
      const tw = d.measure(text, { size: fs(S, 12), weight: 700, font: 'mono' });
      d.withAlpha(aP, () => { d.rect((ax === 'right' ? cx - tw : ax === 'left' ? cx : cx - tw / 2) - 3, cy - 9 * u, tw + 6, 18 * u, { fill: alpha(p.stage, 0.92) }); txt(S, text, cx, cy, { size: 12, weight: 700, font: 'mono', color: dt.ink, align: ax, base: 'middle' }); });
    }
  });

  // ── Σ
  const aS = S.reveal('sum', 0.2, 0.6);
  if (aS > 0) d.withAlpha(aS, () => {
    d.rect(G.sum.x, G.sum.y, G.sum.w, G.sum.h, { fill: alpha(dt.c, cur('sum') ? 0.22 : 0.1), stroke: dt.c, lw: cur('sum') ? 3 : 2, r: 6 * u });
    d.text('Σ', G.sum.x + G.sum.w / 2, G.sum.y + G.sum.h * (port ? 0.34 : 0.33), { size: fs(S, 22), weight: 800, color: dt.ink, align: 'center', base: 'middle' });
    txt(S, num(S, sm, 2), G.sum.x + G.sum.w / 2, G.sum.y + G.sum.h * 0.72, { size: 15, weight: 800, font: 'mono', color: dt.ink, align: 'center', base: 'middle' });
  });
  // ── junción + sesgo
  const aB = S.reveal('bias', 0.2, 0.6);
  if (aB > 0) {
    const J = G.junc, B = G.bias;
    d.withAlpha(aB, () => {
      // Σ → +
      if (port) arrow(S, G.sum.x + G.sum.w / 2, G.sum.y + G.sum.h, J.x, J.y - G.jr, p.ink2, 2, 8);
      else arrow(S, G.sum.x + G.sum.w, J.y, J.x - G.jr, J.y, p.ink2, 2, 8);
      d.circle(J.x, J.y, G.jr, { fill: p.surface, stroke: dt.c, lw: cur('bias') ? 3 : 2 });
      d.text('+', J.x, J.y, { size: fs(S, 18), weight: 800, color: dt.ink, align: 'center', base: 'middle' });
      // sesgo → +
      const bp = edgePt(B, J, G.br + 1), jp = edgePt(J, B, G.jr + 1);
      arrow(S, bp.x, bp.y, jp.x, jp.y, wt.c, 2.5, 8);
      d.circle(B.x, B.y, G.br, { fill: alpha(wt.c, 0.18), stroke: wt.c, lw: cur('bias') ? 3 : 2 });
      d.text('b', B.x, B.y, { size: fs(S, 15), weight: 800, color: wt.ink, align: 'center', base: 'middle' });
      if (port) txt(S, num(S, b, 2), B.x, B.y + G.br + 6 * u, { size: 13, weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'top' });
      else txt(S, num(S, b, 2), B.x + G.br + 8 * u, B.y, { size: 13, weight: 800, font: 'mono', color: wt.ink, base: 'middle' });
      // z
      const zt = `z = ${num(S, z, 2)}`;
      if (port) txt(S, zt, J.x - G.jr - 8 * u, J.y, { size: 14, weight: 800, font: 'mono', color: dt.ink, align: 'right', base: 'middle' });
      else txt(S, zt, J.x, J.y + G.jr + 8 * u, { size: 14, weight: 800, font: 'mono', color: dt.ink, align: 'center', base: 'top' });
    });
  }
  // ── activación (escalón)
  const aAct = S.reveal('activation', 0.2, 0.6);
  if (aAct > 0) d.withAlpha(aAct, () => {
    const F = G.f, J = G.junc;
    if (port) arrow(S, J.x, J.y + G.jr, F.x + F.w / 2, F.y, p.ink2, 2, 8);
    else arrow(S, J.x + G.jr, J.y, F.x, J.y, p.ink2, 2, 8);
    d.rect(F.x, F.y, F.w, F.h, { fill: alpha(sg.c, cur('activation') ? 0.14 : 0.06), stroke: sg.c, lw: cur('activation') ? 3 : 2, r: 6 * u });
    const pad = 9 * u, px0 = F.x + pad, px1 = F.x + F.w - pad, py0 = F.y + F.h - pad - 11 * u, py1 = F.y + pad + 10 * u;
    const X = (v: number) => px0 + ((clamp(v, -2, 2) + 2) / 4) * (px1 - px0), Y = (v: number) => py0 + (py1 - py0) * v;
    d.line(px0, py0, px1, py0, p.line, 1); d.line(X(0), py0 + 3, X(0), py1 - 3, p.line, 1);
    d.polyline([[X(-2), Y(0)], [X(0), Y(0)], [X(0), Y(1)], [X(2), Y(1)]], sg.c, 2.5, { join: 'miter' });
    d.circle(X(z), Y(y), 4.5 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
    txt(S, port ? `f · ${S.l('escalón', 'step')}` : 'f', F.x + 8 * u, F.y + 4 * u, { size: port ? 12 : 14, weight: 800, color: sg.ink, base: 'top' });
    if (!port) tag(S, S.l('escalón', 'step'), F.x + F.w / 2, F.y + F.h + 16 * u, { tone: 'sig' });
  });
  // ── salida
  const tA = tau(S, 'activation');
  if (aAct > 0) d.withAlpha(tr(tA, 0.5, 0.64), () => {
    const F = G.f, O = G.out;
    if (port) arrow(S, F.x + F.w / 2, F.y + F.h, O.x, O.y - G.or - 1, p.ink2, 2, 8);
    else arrow(S, F.x + F.w + 2, O.y, O.x - G.or, O.y, p.ink2, 2, 8);
    d.circle(O.x, O.y, G.or, { fill: alpha(sg.c, 0.12 + 0.8 * y), stroke: sg.c, lw: 2.5 });
    d.text(String(y), O.x, O.y, { size: fs(S, 22), weight: 800, font: 'mono', color: y ? p.stage : sg.ink, align: 'center', base: 'middle' });
    const verdict = y ? S.l('sospechoso', 'suspicious') : S.l('legítimo', 'legitimate');
    const vA = S.on('try0') ? 1 : tr(tA, 0.84, 0.94);
    if (port) {
      txt(S, S.l('salida y', 'output y'), O.x + G.or + 12 * u, O.y - 11 * u, { size: 13, weight: 700, color: p.mute, base: 'middle' });
      tag(S, verdict, O.x + G.or + 12 * u, O.y + 10 * u, { tone: y ? 'err' : 'dat', align: 'left', a: vA });
    } else {
      txt(S, S.l('salida y', 'output y'), O.x, O.y - G.or - 8 * u, { size: 13, weight: 700, color: p.mute, align: 'center', base: 'bottom' });
      tag(S, verdict, O.x, O.y + G.or + 18 * u, { tone: y ? 'err' : 'dat', a: vA });
    }
  });

  // ── una señal recorre la neurona (solo mientras se resume la fórmula)
  if (cur('formula') && !S.reduced) {
    const q = (S.clock % 3.0) / 2.4;
    const path = (A0: P2, E: P2) => [[A0.x, A0.y], [E.x, E.y], [G.sum.x + G.sum.w / 2, G.sum.y + G.sum.h / 2], [G.junc.x, G.junc.y], [G.f.x + G.f.w / 2, G.f.y + G.f.h / 2], [G.out.x, G.out.y]] as [number, number][];
    pulses(S, path(G.in1, G.entry1), q, { tone: 'sig', n: 2, r: 4.5, spread: 0.12 });
    pulses(S, path(G.in2, G.entry2), q, { tone: 'sig', n: 2, r: 4.5, spread: 0.12 });
  }
  // ── los parámetros resaltados al final de «formula»
  if (cur('formula')) {
    const a = tr(tau(S, 'formula'), 0.55, 0.66, 'io');
    if (a > 0) {
      d.withAlpha(a * (0.6 + 0.4 * pulse), () => {
        d.circle(G.bias.x, G.bias.y, G.br + 6 * u, { stroke: wt.c, lw: 3 });
        edges.forEach((E) => { const m = wTagPos(E.a, E.e, E.other, G.nr + 2 * u, port ? 0.46 : 0.34, port ? 0 : 21 * u); d.rect(m.x - 47 * u, m.y - 13 * u, 94 * u, 26 * u, { stroke: wt.c, lw: 3, r: 4 }); });
      });
      d.withAlpha(a, () => (port
        ? tag(S, S.l('parámetros', 'parameters'), D.x + D.w - 2 * u, G.bias.y + G.br + 38 * u, { tone: 'w', size: 13, align: 'right', opaque: true })
        : tag(S, S.l('parámetros', 'parameters'), G.bias.x, G.bias.y - G.br - 24 * u, { tone: 'w', size: 13, opaque: true })));
    }
  }

  // ── Neu celebra que lograste apagarla
  if (S.done.has('off')) neu(S, D.x + D.w - (port ? 56 : 74) * u, port ? D.y + D.h - 40 * u : D.y, { scale: port ? 2 : 3, mood: 'happy', a: 1 });
}
