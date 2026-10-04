// Acto 3: los trucos (ReLU, dropout) y AlexNet (arquitectura, memoria de GPU, resultado de 2012).
import { Plot, alpha, badge, clamp, hash, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ALEXNET, SECOND_2012, WINNERS } from './facts';
import { reluD, reluF, tanhD } from './model';
import { dec, fa, fmtInt, glyph, pct, strip } from './shared';

// ═════════ los tres trucos ═════════
export function drawTricks(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait, gap = 12 * u;
  const items: { k: 'relu' | 'drop' | 'skip'; es: string; en: string; t: 'sig' | 'w' | 'err'; sub: [string, string] }[] = [
    { k: 'relu', es: 'ReLU', en: 'ReLU', t: 'sig', sub: ['la pendiente no se aplasta', 'the slope does not flatten'] },
    { k: 'drop', es: 'Dropout', en: 'Dropout', t: 'w', sub: ['apagar neuronas al azar', 'switch neurons off at random'] },
    { k: 'skip', es: 'Atajos residuales', en: 'Residual shortcuts', t: 'err', sub: ['sumar la entrada a la salida', 'add the input to the output'] },
  ];
  const tw = vertical ? B.w : (B.w - 2 * gap) / 3, th = vertical ? (B.h - 2 * gap) / 3 : Math.min(B.h * 0.8, 280 * u);
  items.forEach((it, i) => {
    const a = fa(S, 'tricks', 0.3 + i * 0.18, 0.42 + i * 0.18);
    if (a <= 0) return;
    const x = vertical ? B.x : B.x + i * (tw + gap), y = vertical ? B.y + i * (th + gap) : B.y + (B.h - th) / 2, c = tone(S, it.t);
    d.withAlpha(a, () => {
      d.rect(x, y, tw, th, { fill: c.soft, stroke: c.c, lw: 1.5, r: 3 });
      const gs = vertical ? Math.min(th * 0.6, 60 * u) : Math.min(tw * 0.45, th * 0.36);
      const gx = vertical ? x + 14 * u + gs / 2 : x + tw / 2, gy = vertical ? y + th / 2 : y + th * 0.34;
      glyph(S, it.k, gx, gy, gs);
      const tx = vertical ? x + 14 * u + gs + 14 * u : x + tw / 2, ty = vertical ? y + th / 2 - 12 * u : y + th * 0.68;
      d.text(S.l(it.es, it.en), tx, ty, { size: 17, weight: 800, color: c.ink, align: vertical ? 'left' : 'center', base: 'middle' });
      d.text(S.l(it.sub[0], it.sub[1]), tx, ty + 22 * u, { size: 13, weight: 600, color: p.ink2, align: vertical ? 'left' : 'center', base: 'middle', w: vertical ? tw - (tx - x) - 8 * u : tw - 12 * u });
    });
  });
}

// ═════════ ReLU frente a tanh: la pendiente ═════════
export function drawRelu(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait;
  const bars = (vertical ? 104 : 58) * u, ph = B.h - bars - 4 * u;
  const rects: Rect[] = vertical
    ? [{ x: B.x, y: B.y, w: B.w, h: (ph - 6 * u) / 2 }, { x: B.x, y: B.y + (ph + 6 * u) / 2, w: B.w, h: (ph - 6 * u) / 2 }]
    : [{ x: B.x, y: B.y, w: (B.w - 12 * u) / 2, h: ph }, { x: B.x + (B.w + 12 * u) / 2, y: B.y, w: (B.w - 12 * u) / 2, h: ph }];
  const specs = [
    { name: 'tanh', f: Math.tanh, g: tanhD, at: 0.03, probe: 3 },
    { name: 'ReLU', f: reluF, g: reluD, at: 0.28, probe: 3 },
  ];
  specs.forEach((sp, i) => {
    const a = fa(S, 'relu', sp.at, sp.at + 0.12), r = rects[i];
    if (a <= 0) return;
    const plot = new Plot(S, r, { xr: [-4, 4], yr: [-1.35, 1.6], xTicks: [-3, 0, 3], yTicks: [], tickFmt: (v) => String(v), pad: { l: 8, t: 22, b: 22, r: 8 } });
    d.withAlpha(a, () => {
      d.text(sp.name, r.x + 6 * u, r.y + 2 * u, { size: 16, weight: 800, color: p.ink, base: 'top' });
      plot.axes();
      plot.line(-4, 0, 4, 0, 'mute', 1, [3, 4]);
      plot.curve(sp.f, 'ink', 2, { n: 120 });
      plot.curve(sp.g, 'err', 3.5, { n: i === 1 ? 400 : 160 });
      // la pendiente en x = 3
      const v = sp.g(sp.probe), pa = fa(S, 'relu', 0.5 + i * 0.12, 0.62 + i * 0.12);
      d.withAlpha(pa, () => {
        plot.line(sp.probe, 0, sp.probe, v, 'err', 1.5, [3, 3]);
        plot.dot(sp.probe, v, 5.5, 'err');
        const lx = plot.X(sp.probe) - 10 * u, ly = plot.Y(v) + (v > 0.5 ? -16 : 18) * u;
        d.text(`${S.l('pendiente en 3', 'slope at 3')}: ${dec(S, v, v < 0.1 ? 2 : 0)}`, lx, ly, { size: 13, weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'middle', halo: p.stage, haloW: 5 });
      });
    });
  });
  // leyenda
  const ly0 = B.y + ph + 6 * u;
  d.withAlpha(fa(S, 'relu', 0.2, 0.3), () => {
    d.line(B.x + 4 * u, ly0 + 8 * u, B.x + 28 * u, ly0 + 8 * u, p.ink, 2); d.text(S.l('función', 'function'), B.x + 34 * u, ly0 + 8 * u, { size: 12, weight: 600, color: p.ink2, base: 'middle' });
    d.line(B.x + 4 * u, ly0 + 28 * u, B.x + 28 * u, ly0 + 28 * u, tone(S, 'err').c, 3.5); d.text(S.l('pendiente (lo que se retropropaga)', 'slope (what gets backpropagated)'), B.x + 34 * u, ly0 + 28 * u, { size: 12, weight: 600, color: p.ink2, base: 'middle' });
  });
  // seis veces más rápido (prueba del artículo de AlexNet)
  const sx = fa(S, 'relu', 0.68, 0.82);
  if (sx > 0) d.withAlpha(sx, () => {
    // en vertical la leyenda ocupa el ancho: las barras van debajo de ella; en horizontal, a la derecha
    const w = vertical ? Math.min(B.w * 0.8, 260 * u) : Math.min(B.w * 0.46, 230 * u), x = vertical ? B.x + 2 * u : B.x + B.w - w - 2 * u, labW = 40 * u, bwMax = w - labW - 30 * u;
    const y0 = vertical ? ly0 + 46 * u : ly0 + 2 * u;
    d.text(S.l('CIFAR-10: iteraciones hasta 25 % de error', 'CIFAR-10: iterations to 25% error'), vertical ? B.x + 2 * u : B.x + B.w - 2 * u, y0, { size: 12, weight: 600, color: p.mute, align: vertical ? 'left' : 'right', base: 'top' });
    ([['tanh', 6, 'mute'], ['ReLU', 1, 'sig']] as const).forEach(([nm, v, t], i) => {
      const yy = y0 + 18 * u + i * 17 * u, c = tone(S, t), bl = (bwMax * v) / 6 * sx;
      d.text(nm, x + labW - 6 * u, yy + 6 * u, { size: 12, weight: 700, color: c.ink, align: 'right', base: 'middle' });
      d.rect(x + labW, yy, bl, 12 * u, { fill: alpha(c.c, 0.6), stroke: c.c, lw: 1 });
      d.text(`${v}×`, x + labW + bl + 6 * u, yy + 6 * u, { size: 13, weight: 800, font: 'mono', color: c.ink, base: 'middle' });
    });
  });
}

// ═════════ dropout: la mitad de las neuronas se apaga en cada paso ═════════
export function drawDropout(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait;
  const layers = [5, 8, 4], hot = 1;
  const nw = B.w, nh = B.h - 56 * u;
  const lx = (l: number) => B.x + 24 * u + (l * (nw - 48 * u)) / (layers.length - 1);
  const ly = (l: number, i: number) => B.y + 16 * u + nh / 2 - 8 * u + (i - (layers[l] - 1) / 2) * Math.min(vertical ? 30 * u : 38 * u, (nh - 20 * u) / layers[l]);
  const step = Math.floor(S.clock / 1.1);
  // se apagan 4 de las 8 neuronas ocultas: las de menor hash en este paso
  const order = Array.from({ length: layers[hot] }, (_, i) => ({ i, h: hash(step, i + 40) })).sort((a, b) => a.h - b.h);
  const off = new Set(order.slice(0, layers[hot] / 2).map((o) => o.i));
  const a = fa(S, 'dropout', 0.03, 0.18), sig = tone(S, 'sig'), w = tone(S, 'w');
  d.withAlpha(a, () => {
    for (let l = 0; l < layers.length - 1; l++) for (let i = 0; i < layers[l]; i++) for (let j = 0; j < layers[l + 1]; j++) {
      const dropped = (l === 0 && off.has(j)) || (l === 1 && off.has(i));
      if (dropped) continue;
      d.line(lx(l), ly(l, i), lx(l + 1), ly(l + 1, j), alpha(w.c, 0.35), 1.2);
    }
    for (let l = 0; l < layers.length; l++) for (let i = 0; i < layers[l]; i++) {
      const x = lx(l), y = ly(l, i), r = 9 * u;
      if (l === hot && off.has(i)) {
        d.circle(x, y, r, { stroke: p.mute, lw: 1.5, dash: [3, 3], fill: p.stage });
        d.line(x - r * 0.55, y - r * 0.55, x + r * 0.55, y + r * 0.55, p.mute, 1.8); d.line(x - r * 0.55, y + r * 0.55, x + r * 0.55, y - r * 0.55, p.mute, 1.8);
      } else d.circle(x, y, r, { fill: l === hot ? alpha(w.c, 0.55) : alpha(sig.c, 0.5), stroke: l === hot ? w.c : sig.c, lw: 2 });
    }
    d.text(S.l('capa con dropout', 'layer with dropout'), lx(hot), B.y + 4 * u, { size: 12, weight: 700, color: w.ink, align: 'center', base: 'top' });
  });
  // probabilidad y AlexNet
  const pa = fa(S, 'dropout', 0.3, 0.45);
  d.withAlpha(pa, () => {
    badge(S, S.l('cada neurona: apagada con probabilidad 0,5', 'each neuron: off with probability 0.5'), B.x + B.w / 2, B.y + B.h - 38 * u, { tone: 'w' });
  });
  d.withAlpha(fa(S, 'dropout', 0.62, 0.78), () => badge(S, S.l('AlexNet: en sus dos primeras capas densas', 'AlexNet: in its first two dense layers'), B.x + B.w / 2, B.y + B.h - 12 * u, { tone: 'mute' }));
}

// ═════════ AlexNet: ocho capas, dos GPU ═════════
export function drawAlex(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait;
  const L = ALEXNET.layerNeurons, n = L.length;
  const split = !S.is('alexnet') && S.on('memory');
  const labels = ['1', '2', '3', '4', '5', '1', '2', S.l('sal', 'out')];
  const body: Rect = { x: B.x, y: B.y + 4 * u, w: B.w, h: B.h - 58 * u };
  const slot = (body.w - 56 * u) / n, colW = Math.min(slot * 0.66, 56 * u);
  const hMax = body.h - 26 * u, sq = (v: number) => Math.max(8 * u, hMax * Math.sqrt(v / L[0]));
  const x0 = body.x + 4 * u + 30 * u;
  // imagen de entrada
  d.withAlpha(fa(S, 'alexnet', 0.03, 0.12), () => {
    const s = Math.min(26 * u, hMax * 0.2);
    d.rect(body.x + 2 * u, body.y + body.h / 2 - s - 10 * u, s, s, { fill: alpha(tone(S, 'dat').c, 0.5), stroke: tone(S, 'dat').c, lw: 1.5 });
    d.text(S.l('foto', 'photo'), body.x + 2 * u + s / 2, body.y + body.h / 2 - 6 * u, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'top' });
  });
  L.forEach((v, i) => {
    const a = fa(S, 'alexnet', 0.1 + i * 0.065, 0.2 + i * 0.065);
    if (a <= 0) return;
    const conv = i < 5, c = tone(S, conv ? 'sig' : 'dat'), h = sq(v), cx = x0 + i * slot + (slot - colW) / 2, cy = body.y + (body.h - h) / 2 - 4 * u;
    d.withAlpha(a, () => {
      if (split) {
        const g1 = tone(S, 'dat'), g2 = tone(S, 'lat');
        d.rect(cx, cy, colW, h / 2, { fill: alpha(g1.c, 0.4), stroke: g1.c, lw: 1.5 });
        d.rect(cx, cy + h / 2, colW, h / 2, { fill: alpha(g2.c, 0.4), stroke: g2.c, lw: 1.5, dash: [4, 3] });
      } else d.rect(cx, cy, colW, h, { fill: alpha(c.c, 0.4), stroke: c.c, lw: 1.5 });
      d.text(labels[i], cx + colW / 2, body.y + body.h + 2 * u, { size: 13, weight: 800, color: c.ink, align: 'center', base: 'top' });
      if (!vertical) d.text(fmtInt(S, v), cx + colW / 2, cy - 4 * u, { size: 12, weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'bottom' });
    });
  });
  // llaves: convolucionales / densas
  const ba = fa(S, 'alexnet', 0.55, 0.7);
  d.withAlpha(ba, () => {
    const yb = body.y + body.h + 22 * u, xa = x0 + (slot - colW) / 2, xb = x0 + 5 * slot - (slot - colW) / 2 - 4 * u, xc = x0 + 5 * slot + (slot - colW) / 2, xd = x0 + n * slot - (slot - colW) / 2;
    d.line(xa, yb, xb, yb, tone(S, 'sig').c, 2); d.line(xc, yb, xd, yb, tone(S, 'dat').c, 2);
    d.text(S.l('convolucionales', 'convolutional'), (xa + xb) / 2, yb + 4 * u, { size: 12, weight: 700, color: tone(S, 'sig').ink, align: 'center', base: 'top' });
    d.text(S.l('densas', 'dense'), (xc + xd) / 2, yb + 4 * u, { size: 12, weight: 700, color: tone(S, 'dat').ink, align: 'center', base: 'top' });
  });
  if (!split) {
    d.withAlpha(fa(S, 'alexnet', 0.62, 0.74), () => badge(S, S.l('60 millones de pesos', '60 million weights'), B.x + B.w - 4 * u, B.y + 14 * u, { tone: 'w', align: 'right' }));
    d.withAlpha(fa(S, 'alexnet', 0.74, 0.86), () => badge(S, S.l('650 000 neuronas', '650,000 neurons'), B.x + B.w - 4 * u, B.y + 44 * u, { tone: 'sig', align: 'right' }));
    d.withAlpha(fa(S, 'alexnet', 0.5, 0.62) * 0.9, () => d.text(S.l('neuronas por capa (altura ∝ raíz)', 'neurons per layer (height ∝ root)'), B.x + B.w - 2 * u, B.y + B.h - 2 * u, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'bottom' }));
  } else {
    const m = fa(S, 'memory', 0.1, 0.25);
    d.withAlpha(m, () => {
      const g1 = tone(S, 'dat'), g2 = tone(S, 'lat'), y1 = B.y + 14 * u, xr = B.x + B.w - 4 * u;
      d.rect(xr - 112 * u, y1 - 6 * u, 11 * u, 11 * u, { fill: alpha(g1.c, 0.4), stroke: g1.c, lw: 1.5 });
      d.text('GPU 1 · 3 GB', xr, y1, { size: 13, weight: 800, color: g1.ink, align: 'right', base: 'middle' });
      d.rect(xr - 112 * u, y1 + 24 * u, 11 * u, 11 * u, { fill: alpha(g2.c, 0.4), stroke: g2.c, lw: 1.5, dash: [3, 2] });
      d.text('GPU 2 · 3 GB', xr, y1 + 30 * u, { size: 13, weight: 800, color: g2.ink, align: 'right', base: 'middle' });
    });
    d.withAlpha(fa(S, 'memory', 0.4, 0.55), () => badge(S, S.l('en una sola GPU: no cabe', 'on a single GPU: does not fit'), B.x + B.w - 4 * u, B.y + 70 * u, { tone: 'err', align: 'right' }));
  }
  void clamp; void neu;
}

// ═════════ resultado de 2012 y el salto ═════════
export function drawResults(S: Frame) {
  const { d, pal: p } = S, u = S.u, B = strip(S, 2), vertical = S.portrait;
  const jump = S.on('jump');
  const k = jump ? 'jump' : 'result';
  const items = jump
    ? [{ lab: '2010', sub: 'NEC', v: WINNERS[0].err, t: 'mute' as const, at: 0.06 }, { lab: '2011', sub: 'XRCE', v: WINNERS[1].err, t: 'mute' as const, at: 0.2 }, { lab: '2012', sub: 'AlexNet', v: WINNERS[2].err, t: 'sig' as const, at: 0.42 }]
    : [{ lab: 'AlexNet', sub: S.l('red convolucional', 'convolutional net'), v: WINNERS[2].err, t: 'sig' as const, at: 0.12 }, { lab: S.l('2.º lugar', 'Runner-up'), sub: S.l('métodos clásicos', 'classic methods'), v: SECOND_2012, t: 'mute' as const, at: 0.3 }];
  const vmax = 30, n = items.length, areaH = B.h - (jump ? 104 : 86) * u, base = B.y + 22 * u + areaH, cw = B.w / Math.max(n, 3);
  const bw = Math.min(cw * 0.56, 110 * u);
  d.line(B.x + 4 * u, base, B.x + B.w - 4 * u, base, p.lineStrong, 1.5);
  const xs = items.map((_, i) => B.x + (jump ? i * cw + cw / 2 : B.w * (0.27 + i * 0.46)) );
  items.forEach((it, i) => {
    const a = fa(S, k, it.at, it.at + 0.14), h = (areaH * it.v) / vmax * a, c = tone(S, it.t), cx = xs[i];
    if (a <= 0) return;
    d.withAlpha(a, () => {
      d.rect(cx - bw / 2, base - h, bw, h, { fill: alpha(c.c, 0.55), stroke: c.c, lw: 1.5 });
      d.text(pct(S, it.v, 1), cx, base - h - 6 * u, { size: jump ? 17 : 22, weight: 800, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
      d.text(it.lab, cx, base + 8 * u, { size: 14, weight: 800, color: p.ink, align: 'center', base: 'top' });
      d.text(it.sub, cx, base + 27 * u, { size: 12, weight: 600, color: p.ink2, align: 'center', base: 'top' });
    });
  });
  if (!jump) {
    d.withAlpha(fa(S, 'result', 0.55, 0.7), () => d.text(S.l('conjunto de 7 redes · 16,4 % con solo los datos del concurso', 'ensemble of 7 networks · 16.4% with only the contest data'), B.x + B.w / 2, B.y + B.h - 2 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom', w: B.w }));
    neu(S, xs[0] + bw / 2 + 6 * u, B.y + 8 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'wow', a: fa(S, 'result', 0.3, 0.45) });
    d.withAlpha(fa(S, 'result', 0.6, 0.75), () => {
      const y = base - (areaH * SECOND_2012) / vmax + 4 * u;
      badge(S, S.l('−10,9 puntos', '−10.9 points'), (xs[0] + xs[1]) / 2, Math.max(B.y + 54 * u, y - 14 * u), { tone: 'err' });
    });
  } else {
    // deltas entre años
    const deltas = [{ a: 0, b: 1, at: 0.28, txt: `−${dec(S, WINNERS[0].err - WINNERS[1].err, 1)}` }, { a: 1, b: 2, at: 0.55, txt: `−${dec(S, WINNERS[1].err - WINNERS[2].err, 1)}` }];
    deltas.forEach((dl) => {
      const aa = fa(S, 'jump', dl.at, dl.at + 0.12);
      if (aa <= 0) return;
      d.withAlpha(aa, () => badge(S, `${dl.txt} ${S.l('pts', 'pts')}`, (xs[dl.a] + xs[dl.b]) / 2, B.y + 14 * u + (dl.a === 1 ? 26 * u : 0), { tone: dl.a === 1 ? 'err' : 'mute' }));
    });
    d.withAlpha(fa(S, 'jump', 0.72, 0.86), () => badge(S, S.l('2013: la gran mayoría usa redes profundas', '2013: the vast majority use deep networks'), B.x + B.w / 2, B.y + B.h - 10 * u, { tone: 'sig' }));
  }
}
