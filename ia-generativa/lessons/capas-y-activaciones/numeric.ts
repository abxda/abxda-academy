// Parte 1 de la escena: una red 2-2-1 con números reales. Pase hacia delante, colapso de capas lineales (dos capas = una
// neurona) y cómo la ReLU rompe el colapso. Todo se calcula aquí con los pesos de la lección (nada «ilustrativo»).
import { alpha, badge, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { check, cross, fs, ph, sn } from './shared';

// Pesos de la lección. Capa oculta: h = W1·x (cada fila es una neurona). Salida: y = W2·h. Sin sesgos, para ver la aritmética.
const W1 = [[1, 2], [3, -1]];
const W2 = [2, 1];
const FUSED = [W2[0] * W1[0][0] + W2[1] * W1[1][0], W2[0] * W1[0][1] + W2[1] * W1[1][1]];   // [5, 3]
const X_SUM = [2, 1], X_REL = [0, 1];
const hid = (x: number[]) => W1.map((r) => r[0] * x[0] + r[1] * x[1]);
const relu = (z: number) => Math.max(0, z);

interface Pt { x: number; y: number }

export function drawNumeric(S: Frame, all: Rect, mode: 'sum' | 'relu') {
  const { d, pal: p } = S, u = S.u, isR = mode === 'relu';
  const x0 = isR ? X_REL : X_SUM, z = hid(x0), h = isR ? z.map(relu) : z, yOut = W2[0] * h[0] + W2[1] * h[1];
  const wt = tone(S, 'w'), sg = tone(S, 'sig'), dt = tone(S, 'dat'), er = tone(S, 'err');

  // ── geometría ──
  const netR: Rect = S.portrait ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.46 } : { x: all.x, y: all.y, w: all.w * 0.58, h: all.h };
  const panR: Rect = S.portrait ? { x: all.x, y: all.y + all.h * 0.5, w: all.w, h: all.h * 0.5 } : { x: all.x + all.w * 0.62, y: all.y, w: all.w * 0.38, h: all.h };
  const inner: Rect = { x: netR.x + 44 * u, y: netR.y + 40 * u, w: netR.w - 44 * u - 40 * u, h: netR.h - 40 * u - 10 * u };
  const r = (S.portrait ? 19 : 23) * u, sp = Math.min(inner.h * 0.55, 130 * u), cy = inner.y + inner.h / 2;
  const cxs = [inner.x, inner.x + inner.w / 2, inner.x + inner.w];
  const N: Pt[][] = [[{ x: cxs[0], y: cy - sp / 2 }, { x: cxs[0], y: cy + sp / 2 }], [{ x: cxs[1], y: cy - sp / 2 }, { x: cxs[1], y: cy + sp / 2 }], [{ x: cxs[2], y: cy }]];

  // ── tiempos ──
  const rev = isR ? 3 : S.on('hook') ? S.at('hook', 0.2, 2.8, 'lin') * 3 : 0;
  const showW = isR ? 1 : S.reveal('layer', 0.1, 0.8);
  const lab = isR ? 1 : S.reveal('layer', 0.25, 0.6);
  let inA = 0, fp = 0, shown = 0;           // fp: 0..2 (entrada→oculta→salida)
  let reluK = 0;                            // 0..1: aplicar ReLU a la oculta
  if (!isR) { inA = ph(S, 'forward', 0, 0.1, 'out'); fp = ph(S, 'forward', 0.12, 0.8, 'lin') * 2; shown = fp; }
  else { inA = ph(S, 'break', 0.02, 0.14, 'out'); const a = ph(S, 'break', 0.14, 0.42, 'lin'); reluK = ph(S, 'break', 0.5, 0.64); const b = ph(S, 'break', 0.7, 0.9, 'lin'); fp = a + b; shown = a + b; }

  // ── aristas ──
  const edges: { a: Pt; b: Pt; w: number; layer: number; t: number; key: string }[] = [];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) edges.push({ a: N[0][i], b: N[1][j], w: W1[j][i], layer: 0, t: 0.3, key: `${i}${j}` });
  for (let j = 0; j < 2; j++) edges.push({ a: N[1][j], b: N[2][0], w: W2[j], layer: 1, t: 0.5, key: `h${j}` });
  const eVis = (l: number) => clamp(rev - (l + 1));
  d.withAlpha(isR ? 1 : 1, () => {
    for (const e of edges) {
      const v = eVis(e.layer); if (v <= 0) continue;
      const mag = clamp(Math.abs(e.w) / 3.2, 0.12, 1);
      d.line(e.a.x, e.a.y, e.b.x, e.b.y, alpha(wt.c, 0.35 + 0.55 * mag), 1.2 + 2.4 * mag, e.w < 0 ? [6, 4] : undefined, v);
    }
    // pulsos de señal (progreso fp: capa 0 durante 0..1, capa 1 durante 1..2); luego, flujo ambiente tras nombrar el pase
    const flow = !isR && S.on('forward-name') ? ((S.clock * 0.55) % 2) : fp;
    for (const e of edges) {
      const f = clamp(flow - e.layer);
      if (f > 0.02 && f < 0.98 && eVis(e.layer) > 0.5) d.circle(lerp(e.a.x, e.b.x, f), lerp(e.a.y, e.b.y, f), 4 * u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
    }
    // etiquetas de peso
    for (const e of edges) {
      const v = eVis(e.layer) * showW; if (v <= 0.01) continue;
      d.text(sn(S, e.w, 0), lerp(e.a.x, e.b.x, e.t), lerp(e.a.y, e.b.y, e.t), { size: fs(S, 14), weight: 700, font: 'mono', color: wt.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 5, a: v });
    }
  });

  // ── nodos ──
  const nodeA = (l: number) => clamp(rev - l);
  const symbols = [['x₁', 'x₂'], ['h₁', 'h₂'], ['y']];
  const vals: (number | null)[][] = [
    inA > 0.02 ? x0 : [null, null],
    shown >= 1 || (isR && shown > 0.98) ? h : [null, null],
    (isR ? shown >= 1.98 : fp >= 1.98) ? [yOut] : [null],
  ];
  // en modo ReLU, mientras no se aplica, la oculta muestra la suma z; después, relu(z)
  const hiddenShown = (k: number): number | null => {
    if (!isR) return vals[1][k];
    if (shown < 0.98) return null;
    return reluK > 0.5 ? h[k] : z[k];
  };
  for (let l = 0; l < 3; l++) for (let i = 0; i < N[l].length; i++) {
    const P = N[l][i], a = nodeA(l); if (a <= 0) continue;
    const v = l === 1 ? hiddenShown(i) : vals[l][i];
    d.withAlpha(a, () => {
      const off = isR && l === 1 && i === 1 && reluK > 0.5;       // neurona «apagada» por la ReLU
      d.circle(P.x, P.y, r, { fill: p.surface, stroke: l === 0 ? dt.c : sg.c, lw: 2.2, dash: off ? [4, 3] : undefined });
      if (v !== null) {
        const fl = l === 1 && isR ? 1 - clamp((reluK - 0.5) * 4) * 0 : 1;
        d.circle(P.x, P.y, r - 3, { fill: alpha(l === 0 ? dt.c : sg.c, off ? 0.04 : 0.16) });
        d.text(sn(S, v, 0), P.x, P.y + 1, { size: fs(S, 17), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', a: fl });
      }
      const sx = l === 0 ? P.x - r - 8 * u : l === 2 ? P.x + r + 8 * u : P.x;
      const sy = l === 1 ? P.y - r - 9 * u : P.y;
      d.text(symbols[l][i], sx, sy, { size: fs(S, 14), weight: 700, color: p.ink2, align: l === 0 ? 'right' : l === 2 ? 'left' : 'center', base: 'middle' });
    });
  }

  // ── ReLU: suma antes de activar (z) y marca de activación sobre la capa oculta ──
  if (isR) {
    const a = clamp((shown - 0.98) * 6);
    if (a > 0) d.withAlpha(a * (1 - reluK * 0.0), () => z.forEach((zv, k) => {
      const P = N[1][k];
      d.text(`z = ${sn(S, zv, 0)}`, P.x + r + 8 * u, P.y + 2, { size: fs(S, 14), weight: 700, font: 'mono', color: zv < 0 ? er.ink : p.ink2, base: 'middle', halo: p.stage, haloW: 4 });
    }));
    const ra = ph(S, 'break', 0.45, 0.58, 'out');
    if (ra > 0) d.withAlpha(ra, () => N[1].forEach((P) => badge(S, 'ReLU', P.x, P.y + r + 15 * u, { tone: 'sig' })));
    if (reluK > 0.5) d.withAlpha(clamp((reluK - 0.5) * 3), () => { const P = N[1][1]; d.text(S.l('negativo → 0', 'negative → 0'), P.x + r + 8 * u, P.y + 22 * u, { size: fs(S, 13), weight: 700, color: er.ink, base: 'middle', halo: p.stage, haloW: 4 }); });
  }

  // ── etiquetas de columna y marco de la capa oculta ──
  if (lab > 0.01) d.withAlpha(lab, () => {
    const names = [S.l('entradas', 'inputs'), S.l('capa oculta', 'hidden layer'), S.l('salida', 'output')];
    names.forEach((t, i) => d.text(t, cxs[i], netR.y + 14 * u, { size: fs(S, 13), weight: 700, color: i === 1 ? wt.ink : p.mute, align: 'center', base: 'middle' }));
    // la capa oculta, recuadrada
    d.rect(cxs[1] - r - 14 * u, N[1][0].y - r - 22 * u, 2 * r + 28 * u, sp + 2 * r + 40 * u, { stroke: wt.c, lw: 1.6, dash: [5, 4], r: 6 });
  });
  // en el modo ReLU el recuadro y las etiquetas se ven desde el principio; los nombres de arriba ya están en `lab`

  // ── panel derecho / inferior ──
  drawPanel(S, panR, { isR, x0, yOut, formulas: !isR ? shown : 0 });
}

// ═════════════════════════════════════════════════════════════════════════
function drawPanel(S: Frame, r: Rect, o: { isR: boolean; x0: number[]; yOut: number; formulas: number }) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), sg = tone(S, 'sig'), dt = tone(S, 'dat'), er = tone(S, 'err');
  const mono = (t: string, x: number, y: number, c: string, a = 1, size = 15, w = 700) => d.text(t, x, y, { size: fs(S, size), weight: w, font: 'mono', color: c, base: 'middle', a });
  const X = o.x0;
  const lineH = 30 * u;

  if (!o.isR) {
    // cuentas del pase hacia delante, línea por línea
    const fa = (1 - S.at('collapse', 0, 0.5)) * 1;
    if (fa > 0 && o.formulas > 0) d.withAlpha(fa, () => {
      const rows: { t: string; res: string; at: number }[] = [
        { t: `h₁ = ${sn(S, W1[0][0], 0)}·${X[0]} + ${sn(S, W1[0][1], 0)}·${X[1]} = `, res: String(hid(X)[0]), at: 1 },
        { t: `h₂ = ${sn(S, W1[1][0], 0)}·${X[0]} + (${sn(S, W1[1][1], 0)})·${X[1]} = `, res: String(hid(X)[1]), at: 1 },
        { t: `y = ${W2[0]}·${hid(X)[0]} + ${W2[1]}·${hid(X)[1]} = `, res: String(W2[0] * hid(X)[0] + W2[1] * hid(X)[1]), at: 2 },
      ];
      d.text(S.l('las cuentas', 'the arithmetic'), r.x, r.y + 12 * u, { size: fs(S, 13), weight: 700, color: p.mute, base: 'middle' });
      rows.forEach((row, i) => {
        const a = clamp((o.formulas - row.at + 1) * 4); if (a <= 0) return;
        const y = r.y + 46 * u + i * lineH, tw = d.measure(row.t, { size: fs(S, 15), weight: 700, font: 'mono' });
        d.withAlpha(a, () => { mono(row.t, r.x, y, p.ink2, 1); mono(row.res, r.x + tw, y, dt.ink, 1, 17, 800); });
      });
    });
  }

  if (!o.isR) {
    // colapso: una sola neurona con los pesos fusionados
    const ca = S.at('collapse', 0.2, 0.9);
    if (ca > 0) {
      const small = S.on('collapse-check');
      const nh = Math.min(small ? 96 * u : 120 * u, r.h * (small ? 0.34 : 0.4));
      const nr: Rect = { x: r.x, y: r.y + 8 * u, w: r.w, h: nh };
      d.withAlpha(ca, () => {
        badge(S, S.l('una sola neurona', 'a single neuron'), r.x + 6 * u, r.y + 6 * u, { tone: 'w', align: 'left' });
        neuronMini(S, { x: nr.x, y: nr.y + 16 * u, w: nr.w, h: nr.h - 10 * u }, { x: null, w: FUSED, out: null });
      });
      // aritmética del colapso
      const la = ph(S, 'collapse', 0.4, 0.75, 'out') * (1 - S.at('collapse-check', 0, 0.5));
      if (la > 0) d.withAlpha(la, () => {
        const y = r.y + nh + 36 * u;
        mono(`[${W2[0]} ${W2[1]}] · [${W1[0][0]} ${W1[0][1]}; ${W1[1][0]} ${sn(S, W1[1][1], 0)}] = [${FUSED[0]} ${FUSED[1]}]`, r.x, y, wt.ink, 1, 14);
        mono(`${FUSED[0]} = ${W2[0]}·${W1[0][0]} + ${W2[1]}·${W1[1][0]}`, r.x, y + lineH, p.ink2, 1, 14);
        mono(`${FUSED[1]} = ${W2[0]}·${W1[0][1]} + ${W2[1]}·(${sn(S, W1[1][1], 0)})`, r.x, y + 2 * lineH, p.ink2, 1, 14);
      });
      // tabla de comprobación
      const ta = S.at('collapse-check', 0.3, 1);
      if (ta > 0) d.withAlpha(ta, () => {
        const y0 = r.y + nh + 30 * u, cw = [r.w * 0.34, r.w * 0.33, r.w * 0.33], rh = 32 * u;
        const heads = [S.l('entrada', 'input'), S.l('dos capas', 'two layers'), S.l('una neurona', 'one neuron')];
        let cx = r.x;
        heads.forEach((t, i) => { d.text(t, cx + cw[i] / 2, y0, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center', base: 'middle' }); cx += cw[i]; });
        d.line(r.x, y0 + 14 * u, r.x + r.w, y0 + 14 * u, p.line, 1);
        [[2, 1], [1, 0]].forEach((xin, k) => {
          const rowA = clamp(ph(S, 'collapse-check', 0.2 + k * 0.28, 0.4 + k * 0.28, 'out'));
          const y = y0 + 14 * u + rh * (k + 0.55);
          const two = W2[0] * hid(xin)[0] + W2[1] * hid(xin)[1], one = FUSED[0] * xin[0] + FUSED[1] * xin[1];
          d.withAlpha(rowA, () => {
            mono(`(${xin[0]}, ${xin[1]})`, r.x + cw[0] / 2 - 22 * u, y, p.ink, 1, 15);
            d.text(String(two), r.x + cw[0] + cw[1] / 2, y, { size: fs(S, 17), weight: 800, font: 'mono', color: sg.ink, align: 'center', base: 'middle' });
            d.text(String(one), r.x + cw[0] + cw[1] + cw[2] / 2 - 10 * u, y, { size: fs(S, 17), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle' });
            check(S, r.x + r.w - 8 * u, y, 12 * u, dt.c);
          });
        });
        d.text(S.l('Iguales siempre.', 'Always equal.'), r.x, y0 + 14 * u + rh * 2.5 + 6 * u, { size: fs(S, 14), weight: 700, color: dt.ink, base: 'middle', a: ph(S, 'collapse-check', 0.65, 0.85, 'out') });
      });
    }
  } else {
    // modo ReLU: la neurona única (5, 3) frente a la red con ReLU
    const ca = ph(S, 'break', 0.3, 0.46, 'out');
    if (ca > 0) {
      const nh = Math.min(120 * u, r.h * 0.4);
      d.withAlpha(ca, () => {
        badge(S, S.l('una neurona (5 y 3)', 'one neuron (5 and 3)'), r.x + 6 * u, r.y + 6 * u, { tone: 'w', align: 'left' });
        neuronMini(S, { x: r.x, y: r.y + 24 * u, w: r.w, h: nh - 10 * u }, { x: X, w: FUSED, out: FUSED[0] * X[0] + FUSED[1] * X[1] });
      });
      const cmp = ph(S, 'break', 0.88, 1, 'out');
      if (cmp > 0) d.withAlpha(cmp, () => {
        const y = r.y + nh + 44 * u, one = FUSED[0] * X[0] + FUSED[1] * X[1];
        d.text(S.l('red con ReLU', 'network with ReLU'), r.x, y, { size: fs(S, 14), weight: 700, color: sg.ink, base: 'middle' });
        d.text(String(o.yOut), r.x + r.w * 0.62, y, { size: fs(S, 24), weight: 800, font: 'mono', color: sg.ink, base: 'middle' });
        d.text(S.l('una neurona', 'one neuron'), r.x, y + 40 * u, { size: fs(S, 14), weight: 700, color: wt.ink, base: 'middle' });
        d.text(String(one), r.x + r.w * 0.62, y + 40 * u, { size: fs(S, 24), weight: 800, font: 'mono', color: wt.ink, base: 'middle' });
        d.text('≠', r.x + r.w * 0.86, y + 20 * u, { size: fs(S, 34), weight: 800, color: er.ink, align: 'center', base: 'middle' });
        cross(S, r.x + r.w * 0.86, y + 20 * u + 30 * u, 12 * u, er.c);
      });
    }
  }
  void er;
}

/** Una neurona con dos entradas y los pesos sobre las aristas; `x` y `out` opcionales. */
function neuronMini(S: Frame, r: Rect, o: { x: number[] | null; w: number[]; out: number | null }) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w'), sg = tone(S, 'sig'), dt = tone(S, 'dat');
  const rad = 18 * u, ax = r.x + rad + 26 * u, bx = r.x + r.w - rad - 34 * u;
  const A: Pt[] = [{ x: ax, y: r.y + r.h * 0.2 }, { x: ax, y: r.y + r.h * 0.8 }], B: Pt = { x: bx, y: r.y + r.h / 2 };
  A.forEach((a, i) => {
    d.line(a.x, a.y, B.x, B.y, alpha(wt.c, 0.8), 1.4 + 2.2 * clamp(Math.abs(o.w[i]) / 5), Math.sign(o.w[i]) < 0 ? [6, 4] : undefined);
    d.text(String(o.w[i]), lerp(a.x, B.x, 0.42), lerp(a.y, B.y, 0.42) + (i === 0 ? -9 : 9) * u, { size: fs(S, 15), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'middle', halo: p.stage, haloW: 5 });
    d.circle(a.x, a.y, rad * 0.85, { fill: p.surface, stroke: dt.c, lw: 2 });
    d.text(o.x ? String(o.x[i]) : ['x₁', 'x₂'][i], a.x, a.y + 1, { size: fs(S, o.x ? 16 : 14), weight: 800, font: o.x ? 'mono' : undefined, color: o.x ? p.ink : p.ink2, align: 'center', base: 'middle' });
  });
  d.circle(B.x, B.y, rad, { fill: p.surface, stroke: sg.c, lw: 2.2 });
  if (o.out !== null) { d.circle(B.x, B.y, rad - 3, { fill: alpha(sg.c, 0.16) }); }
  d.text(o.out !== null ? sn(S, o.out, 0) : 'y', B.x, B.y + 1, { size: fs(S, o.out !== null ? 17 : 14), weight: 800, font: o.out !== null ? 'mono' : undefined, color: o.out !== null ? p.ink : p.ink2, align: 'center', base: 'middle' });
}
