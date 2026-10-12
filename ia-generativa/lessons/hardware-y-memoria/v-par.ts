// Vistas 9 y 10: los tres paralelismos, uno por uno, con cuatro GPU esquemáticas y un modelo de 8 capas (ilustrativo):
// datos (copias completas que promedian sus gradientes), tubería (tramos de capas en fila; algunas esperan) y tensor (cada tabla
// partida en columnas; las piezas se juntan en cada capa, dentro del servidor). Después, la combinación real de Llama 3.1 405B:
// 8 de tensor × 16 de tubería × 128 de datos = 16 384 H100 (Llama Team, 2024, tabla 4).
import { alpha, clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, area, card, fitSize, fitText, fr, gpuBox, hold, isShort, layerStack, lineH, measure, mv, para, paraH, pill, provenance, txt } from './draw';

const L = 8;   // capas del modelo de juguete

function boxes(S: Frame, A: Rect, top: number, h: number): Rect[] {
  const u = S.u, gap = (S.portrait ? 10 : 18) * u, w = Math.min(150 * u, (A.w - 3 * gap) / 4), x0 = A.x + (A.w - (4 * w + 3 * gap)) / 2;
  return [0, 1, 2, 3].map((i) => ({ x: x0 + i * (w + gap), y: top, w, h }));
}

export function drawPar(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S);
  const sg = tone(S, 'sig'), er = tone(S, 'err'), wt = tone(S, 'w');
  // ── títulos (uno por forma) ──
  const titles: [string, string | undefined, string][] = [
    ['par-q', 'par-data', S.l('¿Y si no cabe, o tarda demasiado?', 'What if it does not fit, or takes too long?')],
    ['par-data', 'par-pipe', S.l('1 · Paralelismo de datos', '1 · Data parallelism')],
    ['par-pipe', 'par-tensor', S.l('2 · Paralelismo en tubería', '2 · Pipeline parallelism')],
    ['par-tensor', undefined, S.l('3 · Paralelismo de tensor', '3 · Tensor parallelism')],
  ];
  const ty = A.y + lineH(S, 16, 0.55);
  titles.forEach(([a, b, t]) => fitText(S, t, A.x, ty, A.w, { s: 16, weight: 800, a: hold(S, a, b) }));
  const subs: [string, string | undefined, string][] = [
    ['par-data', 'par-pipe', S.l('cada GPU, una copia completa; ejemplos distintos', 'each GPU, a full copy; different examples')],
    ['par-pipe', 'par-tensor', S.l('cada GPU, un tramo de capas, como una línea de montaje', 'each GPU, a stretch of layers, like an assembly line')],
    ['par-tensor', undefined, S.l('cada tabla de parámetros, partida en columnas', 'each table of parameters, cut into columns')],
  ];
  const sy = ty + lineH(S, 13, 1.25);
  subs.forEach(([a, b, t]) => fitText(S, t, A.x, sy, A.w, { s: 13, c: p.ink2, a: hold(S, a, b, 0.1, 0.22) }));
  // ── geometría fija para las tres formas (nada salta de lugar) ──
  const chipH = lineH(S, 12.5, 1) + 8 * u, chipBand = chipH + (short ? 8 : 14) * u;
  const labBand = lineH(S, 12.5, 1.3), gradBand = lineH(S, 13, 1.5) + (short ? 6 : 12) * u, footH = lineH(S, 13, S.portrait ? 2.5 : 1.3);
  const bodyTop = sy + lineH(S, 13, 0.7) + chipBand;
  const bh = Math.max(50 * u, A.y + A.h - bodyTop - labBand - gradBand - footH);
  const B = boxes(S, A, bodyTop, bh);
  const inner = (b: Rect): Rect => ({ x: b.x + 9 * u, y: b.y + 9 * u, w: b.w - 18 * u, h: b.h - 18 * u });
  const label = (b: Rect, t: string, a: number) => fitText(S, t, b.x + b.w / 2, b.y + b.h + labBand * 0.5, b.w + 10 * u, { s: 12.5, weight: 800, c: p.ink2, align: 'center', a });
  // ── ¿y si no cabe? un modelo más alto que la GPU ──
  const aQ = hold(S, 'par-q', 'par-data');
  if (aQ > 0.01) {
    const gw = B[0].w, bx = A.x + A.w / 2 - gw / 2, gpu: Rect = { x: bx, y: bodyTop + bh * 0.35, w: gw, h: bh * 0.65 };
    const rise = mv(S, 'par-q', 0.1, 0.4), mh = lerp(gpu.h - 18 * u, bh + chipBand * 0.6, rise);
    gpuBox(S, gpu, '', { a: aQ });
    label(gpu, S.l('1 GPU', '1 GPU'), aQ);
    layerStack(S, { x: gpu.x + 9 * u, y: gpu.y + gpu.h - 9 * u - mh, w: gw - 18 * u, h: mh }, L, 0, L, { a: aQ });
    pill(S, S.l('no cabe', 'does not fit'), bx + gw + 12 * u, gpu.y + 14 * u, { tone: 'err', s: 12.5, align: 'left', a: aQ * ap(S, 'par-q', 0.4, 0.52) });
  }
  // ── las cuatro GPU ──
  const aB = ap(S, 'par-data', 0, 0.14);
  if (aB > 0) {
    const pipeOn = S.on('par-pipe') && !S.on('par-tensor'), dataOn = !S.on('par-pipe'), tensorOn = S.on('par-tensor');
    const kP = ap(S, 'par-pipe', 0, 0.14);
    // el bloque de trabajo que recorre la tubería (ritmo ilustrativo, con el reloj continuo)
    const phase = (S.clock * 0.6) % 4, at = Math.floor(phase);
    B.forEach((b, i) => {
      const waiting = S.on('par-pipe2') && pipeOn && i !== at;
      gpuBox(S, b, '', { a: aB, dim: waiting ? 1 : 0 });
      label(b, `GPU ${i + 1}`, aB);
      if (dataOn) layerStack(S, inner(b), L, 0, L, { a: aB });
      if (pipeOn) layerStack(S, inner(b), L, i * 2, i * 2 + 2, { a: kP, hot: i === at ? 0.6 : 0 });
      if (waiting) txt(S, S.l('espera', 'waiting'), b.x + b.w / 2, b.y + b.h * 0.5, { s: 12.5, weight: 800, c: p.ink2, align: 'center', halo: true, a: ap(S, 'par-pipe2', 0.2, 0.35) });
    });
    // datos: ejemplos distintos que entran en cada copia
    if (dataOn) {
      B.forEach((b, i) => {
        const k = mv(S, 'par-data', 0.3 + i * 0.06, 0.5 + i * 0.06), w = Math.min(b.w, 100 * u);
        const y = lerp(b.y - chipBand - chipH * 0.3, b.y - chipBand + (chipBand - chipH) / 2, k), x = b.x + (b.w - w) / 2;
        d.withAlpha(ap(S, 'par-data', 0.25 + i * 0.06, 0.35 + i * 0.06), () => {
          d.rect(x, y, w, chipH, { fill: alpha(sg.c, 0.16), stroke: sg.c, lw: 1.3, r: 3 });
          const lab = S.l(`ejemplos ${i + 1}`, `examples ${i + 1}`), labS = S.l(`lote ${i + 1}`, `batch ${i + 1}`);
          fitText(S, measure(S, lab, 12, false, 700) <= w - 6 * u ? lab : labS, x + w / 2, y + chipH / 2, w - 6 * u, { s: 12.5, weight: 700, c: sg.ink, align: 'center' });
        });
      });
      // promediar gradientes
      const aG = ap(S, 'par-data2', 0.05, 0.25);
      if (aG > 0) {
        const yb = B[0].y + B[0].h + labBand + 4 * u, xm = A.x + A.w / 2;
        d.withAlpha(aG, () => {
          d.line(B[0].x + B[0].w / 2, yb, B[3].x + B[3].w / 2, yb, er.c, 2);
          B.forEach((b) => d.circle(b.x + b.w / 2, yb, 3 * u, { fill: er.c }));
        });
        pill(S, S.l('promedio de gradientes', 'average of gradients'), xm, yb + lineH(S, 13, 0.75) + 2 * u, { tone: 'err', s: 12.5, a: aG });
      }
    }
    // tubería: flechas entre GPU y el bloque que avanza
    if (pipeOn) {
      for (let i = 0; i < 3; i++) {
        const y = B[i].y + B[i].h / 2, x0 = B[i].x + B[i].w + 2 * u, x1 = B[i + 1].x - 2 * u;
        d.withAlpha(kP, () => d.arrow(x0, y, x1, y, p.ink2, 1.6, 6 * u));
      }
      const tt = phase - at, r = inner(B[at]), yb = r.y + ((at * 2 + 1) / L) * r.h, s = 12 * u;
      d.withAlpha(kP, () => d.rect(r.x + r.w / 2 - s / 2 + (tt - 0.5) * r.w * 0.5, yb - s / 2, s, s, { fill: sg.c, stroke: p.stage, lw: 1.5, r: 2 }));
    }
    // tensor: una tabla de 8 × 8 que se parte en cuatro y baja a las GPU
    if (tensorOn) {
      const n = 8, span = B[3].x + B[3].w - B[0].x, cs0 = Math.min(bh * 0.8 / n, span * 0.42 / n), mx = A.x + (A.w - cs0 * n) / 2, my = bodyTop + (bh - cs0 * n) / 2;
      const fall = mv(S, 'par-tensor', 0.38, 0.72);
      if (fall < 1) d.withAlpha((1 - fall) * ap(S, 'par-tensor', 0.05, 0.18), () => d.rect(mx - 22 * u, my - 10 * u, cs0 * n + 44 * u, cs0 * n + 20 * u, { fill: p.stage, stroke: p.lineStrong, lw: 1.2, r: 4 }));
      d.withAlpha(ap(S, 'par-tensor', 0.05, 0.18), () => {
        for (let c = 0; c < n; c++) {
          const g = Math.floor(c / 2), r = inner(B[g]);
          const tcs = Math.min(r.w / 2, r.h / n), tx = r.x + (r.w - 2 * tcs) / 2 + (c % 2) * tcs, ty0 = r.y + (r.h - n * tcs) / 2;
          // antes de bajar, cada pedazo se separa un poco del siguiente
          const split = mv(S, 'par-tensor', 0.18, 0.34) * (g - 1.5) * 8 * u;
          for (let rr = 0; rr < n; rr++) {
            const x = lerp(mx + c * cs0 + split, tx, fall), y = lerp(my + rr * cs0, ty0 + rr * tcs, fall), sz = lerp(cs0, tcs, fall);
            d.rect(x + 0.5, y + 0.5, sz - 1.5, sz - 1.5, { fill: alpha(wt.c, 0.3 + 0.14 * ((rr * 3 + c * 5) % 4)), stroke: alpha(wt.c, 0.9), lw: 1 });
          }
        }
      });
      // las piezas se juntan en cada capa: conexiones entre todas, dentro de un servidor
      const aJ = ap(S, 'par-tensor2', 0.05, 0.2);
      if (aJ > 0) {
        d.withAlpha(aJ, () => {
          const fx = B[0].x - 8 * u, fy = B[0].y - chipBand + 2 * u, fw = B[3].x + B[3].w + 8 * u - fx, fh = B[0].h + chipBand + labBand + gradBand - 4 * u;
          d.rect(fx, fy, fw, fh, { stroke: p.ink2, lw: 1.4, r: 6, dash: [6, 4] });
          fitText(S, S.l('un servidor: conexiones muy rápidas', 'one server: very fast links'), fx + 8 * u, fy + chipBand * 0.45, fw - 16 * u, { s: 12.5, weight: 800, c: p.ink2 });
          const yb = B[0].y + B[0].h + labBand;
          for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
            const x0 = B[i].x + B[i].w / 2, x1 = B[j].x + B[j].w / 2, dep = (gradBand - 10 * u) * (j - i) / 3, pts: [number, number][] = [];
            for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([lerp(x0, x1, t), yb + dep * Math.sin(Math.PI * t)]); }
            d.polyline(pts, alpha(sg.c, 0.8), 1.5);
            const t = (S.clock * 0.5 + (i + j) * 0.21) % 1;
            d.circle(lerp(x0, x1, t), yb + dep * Math.sin(Math.PI * t), 2.6 * u, { fill: sg.c });
          }
        });
      }
    }
  }
  // pie: lo que cuesta cada forma
  const foot: [string, string | undefined, string][] = [
    ['par-data2', 'par-pipe', S.l('acelera, pero cada copia carga el modelo entero', 'faster, but each copy holds the whole model')],
    ['par-pipe2', 'par-tensor', S.l('cada una, un tramo; mientras el trabajo avanza, otras esperan', 'each holds a stretch; while the work moves on, others wait')],
    ['par-tensor2', undefined, S.l('las piezas se juntan en cada capa, muchas veces por segundo', 'the pieces are combined at every layer, many times per second')],
  ];
  foot.forEach(([a, b, t]) => {
    const h = paraH(S, t, A.w, { s: 13, weight: 700, max: 2 });
    para(S, t, A.x, A.y + A.h - footH / 2 - h / 2, A.w, { s: 13, weight: 700, c: p.ink, align: 'center', max: 2, a: hold(S, a, b, 0.3, 0.45) });
  });
  provenance(S, S.l('Esquema ilustrativo con 4 GPU y un modelo de 8 capas · GPipe (2019), Megatron-LM (2019)', 'Illustrative sketch with 4 GPUs and an 8-layer model · GPipe (2019), Megatron-LM (2019)'), hold(S, 'par-q'));
}

// ═════════ Llama 3.1 405B: 8 × 16 × 128 ═════════
export function drawLlama(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, short = isShort(S), port = S.portrait, wt = tone(S, 'w');
  const a0 = ap(S, 'par-llama', 0, 0.12);
  fitText(S, S.l('Llama 3.1 405B: las tres formas a la vez', 'Llama 3.1 405B: all three forms at once'), A.x, A.y + lineH(S, 16, 0.55), A.w, { s: 16, weight: 800, a: a0 });
  // tres factores
  const fy = A.y + lineH(S, 16, 1.4) + (short ? 4 : 10) * u, opW = 24 * u, cw = (A.w - 2 * opW) / 3, ch = (short ? 46 : 60) * u;
  const longOk = measure(S, S.l('tramos de tubería', 'pipeline stages'), 12.5, false, 700) <= cw - 8 * u;
  const F: [string, string, 'w' | 'lat' | 'sig', number][] = [
    ['8', S.l('tensor', 'tensor'), 'w', 0.15],
    ['16', longOk ? S.l('tramos de tubería', 'pipeline stages') : S.l('tubería', 'pipeline'), 'lat', 0.4],
    ['128', longOk ? S.l('copias de datos', 'data copies') : S.l('datos', 'data'), 'sig', 0.68],
  ];
  F.forEach(([n, lab, t, at], i) => {
    const a = ap(S, 'par-llama', at, at + 0.14), x = A.x + i * (cw + opW);
    card(S, { x, y: fy, w: cw, h: ch }, { tone: t, a, fill: 0.08 });
    txt(S, n, x + cw / 2, fy + ch * 0.38, { s: short ? 20 : 26, weight: 800, mono: true, c: tone(S, t).ink, align: 'center', a });
    fitText(S, lab, x + cw / 2, fy + ch * 0.78, cw - 8 * u, { s: 12.5, weight: 700, c: p.ink2, align: 'center', a });
    if (i < 2) txt(S, '×', x + cw + opW / 2, fy + ch / 2, { s: 20, weight: 800, mono: true, c: p.mute, align: 'center', a: ap(S, 'par-llama', F[i + 1][3], F[i + 1][3] + 0.1) });
  });
  // el total y su dibujo: una copia (8 × 16 = 128 GPU) y las 128 copias
  const aT = ap(S, 'par-total', 0, 0.14);
  if (aT > 0) {
    const gy = fy + ch + (short ? 10 : 22) * u, totH = lineH(S, short ? 18 : 22, 1.3), gh = A.y + A.h - gy - totH - 6 * u;
    const half = port ? A.w : (A.w - 24 * u) / 2, gH = port ? (gh - 14 * u) / 2 : gh;
    // una copia
    const rep = (x: number, y: number, w: number, h: number, a: number, label: string, mini: boolean) => {
      const capH = lineH(S, 12.5, 1.3), cs = Math.min(w / 16, (h - capH) / 8), gx = x + (w - cs * 16) / 2;
      fitText(S, label, x + w / 2, y + capH / 2, w, { s: 12.5, weight: 700, c: p.ink2, align: 'center', a });
      d.withAlpha(a, () => {
        for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) {
          const k = r * 16 + c, on = clamp(fr(S, 'par-total', mini ? 0.3 : 0.08, mini ? 0.65 : 0.3) * 128 - k);
          d.rect(gx + c * cs + 0.5, y + capH + r * cs + 0.5, cs - (mini ? 1.5 : 2), cs - (mini ? 1.5 : 2), { fill: mini ? alpha(tone(S, 'sig').c, 0.15 + 0.6 * on) : alpha(wt.c, 0.15 + 0.6 * on), r: mini ? 1 : 1.5 });
        }
      });
    };
    rep(A.x, gy, half, gH, aT, S.l('1 copia del modelo: 8 × 16 = 128 H100', '1 copy of the model: 8 × 16 = 128 H100s'), false);
    rep(port ? A.x : A.x + half + 24 * u, port ? gy + gH + 14 * u : gy, half, gH, ap(S, 'par-total', 0.25, 0.4), S.l('128 copias (cada cuadro, 128 H100)', '128 copies (each square, 128 H100s)'), true);
    const t = S.l(`= ${S.n(16384, 0)} H100, con 80 GB cada una`, `= ${S.n(16384, 0)} H100s, 80 GB each`), s = fitSize(S, t, A.w, short ? 18 : 22, true, 800);
    txt(S, t, A.x + A.w / 2, A.y + A.h - totH / 2, { s, weight: 800, mono: true, align: 'center', a: ap(S, 'par-total', 0.5, 0.65) });
  }
  provenance(S, S.l('Llama Team, AI @ Meta (2024), tabla 4: hasta 16 384 H100 para entrenar Llama 3.1 405B', 'Llama Team, AI @ Meta (2024), table 4: up to 16,384 H100s to train Llama 3.1 405B'), a0);
}
