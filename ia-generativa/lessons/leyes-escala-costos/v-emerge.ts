// Vista 6 · ¿Habilidades emergentes? Ejemplo ILUSTRATIVO con el modelo matemático de Schaeffer et al. (2023): la
// probabilidad de acertar cada cifra mejora poco a poco con el tamaño; acertar las cinco cifras a la vez (todo o nada)
// sube tarde y de golpe. Al lado, una suma concreta calificada de las dos formas.
// Vista 7 · Qué decides tú (costo de entrenar desde cero; cómo leer «más grande = mejor») y el puente a la memoria.
import { alpha, regions, split, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { EM_SIZES, GOPHER, MMLU, MODELS, calc, exact, pDigit } from './data';
import { box, chip, count, fitText, fr, fz, kk, lineH, money, para, provenance, roomy } from './ui';

const LX0 = 7, LX1 = 12;

function geo(S: Frame) {
  const R = regions(S, S.portrait ? 0.62 : 0.64), m = R.main, k = kk(S), u = S.u;
  const padL = Math.max(36, 42 * u), padB = 7 * k + lineH(S, 12) + 4 * k + lineH(S, 13), padT = lineH(S, 13) + 16 * k, padR = 12 * k;
  const r: Rect = { x: m.x + padL, y: m.y + padT, w: m.w - padL - padR, h: m.h - padT - padB };
  const X = (N: number) => r.x + ((Math.log10(N) - LX0) / (LX1 - LX0)) * r.w, Y = (v: number) => r.y + r.h - v * r.h;
  return { R, r, X, Y };
}

export function drawEmerge(S: Frame) {
  const { d, pal: p } = S, k = kk(S), g = geo(S), { r } = g, ts = fz(S, 11.5), es = S.lang === 'es';
  // ejes
  const ax = fr(S, 'emergent', 0.45, 0.7);
  d.withAlpha(ax, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    const labs: [number, string][] = [[1e7, es ? '10 M' : '10M'], [1e8, es ? '100 M' : '100M'], [1e9, es ? '1 000 M' : '1B'], [1e10, es ? '10 mil M' : '10B'], [1e11, es ? '100 mil M' : '100B'], [1e12, es ? '1 billón' : '1T']];
    // rótulos: se omite el que choque con el anterior (el último va alineado a la derecha)
    let lastRight = -Infinity;
    labs.forEach(([v, s], i) => {
      const x = g.X(v), w = d.measure(s, { size: ts, font: 'mono' }), al: CanvasTextAlign = i === labs.length - 1 ? 'right' : i === 0 ? 'left' : 'center';
      d.line(x, r.y + r.h, x, r.y + r.h + 4 * k, p.lineStrong, 1.5);
      const x0 = al === 'left' ? x : al === 'right' ? x - w : x - w / 2;
      if (x0 < lastRight + 8 * k) return;
      if (i < labs.length - 1 && x0 + w > g.X(1e12) - d.measure(labs[labs.length - 1][1], { size: ts, font: 'mono' }) - 8 * k) return;
      d.text(s, x, r.y + r.h + 7 * k, { size: ts, font: 'mono', color: p.mute, align: al, base: 'top' });
      lastRight = x0 + w;
    });
    [0, 0.5, 1].forEach((v) => { const y = g.Y(v); d.line(r.x - 4 * k, y, r.x, y, p.lineStrong, 1.5); d.text(`${S.n(v * 100, 0)}${es ? ' %' : '%'}`, r.x - 7 * k, y, { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    fitText(S, S.l('tamaño del modelo, parámetros (escala logarítmica)', 'model size, parameters (log scale)'), r.x + r.w, r.y + r.h + 7 * k + lineH(S, 12) + 3 * k, r.w, { size: 12.5, weight: 700, color: tone(S, 'w').ink, align: 'right', base: 'top' });
    fitText(S, S.l('aciertos en sumas de 5 cifras', 'accuracy on 5-digit sums'), g.R.main.x, r.y - 12 * k, r.w * 0.6, { size: 13, weight: 700, color: p.ink2, base: 'bottom' });
  });
  provenance(S, S.l('ilustrativo: modelo de Schaeffer et al. (2023)', 'illustrative: Schaeffer et al. (2023) model'), r.x + r.w, r.y - 12 * k, r.w * 0.45, { align: 'right', a: fr(S, 'emergent-ex', 0.05, 0.2) });

  // todo o nada (exact match de 5 cifras): curva y modelos de muestra
  const eA = fr(S, 'emergent-ex', 0.1, 0.25);
  if (eA > 0.01) {
    const prog = fr(S, 'emergent-ex', 0.15, 0.7, 'lin'), pts: [number, number][] = [];
    for (let i = 0; i <= 160 * prog; i++) { const N = 10 ** (LX0 + ((LX1 - LX0) * i) / 160); pts.push([g.X(N), g.Y(exact(N))]); }
    if (pts.length > 1) d.polyline(pts, tone(S, 'err').c, 2.8, { a: eA });
    EM_SIZES.forEach((N) => { if ((Math.log10(N) - LX0) / (LX1 - LX0) <= prog + 0.001) d.circle(g.X(N), g.Y(exact(N)), 4 * k, { fill: tone(S, 'err').c, stroke: p.stage, lw: 1.5, a: eA }); });
    const la = fr(S, 'emergent-ex', 0.7, 0.85);
    fitText(S, S.l('todo o nada', 'all or nothing'), g.X(3e10) + 8 * k, g.Y(exact(3e10)) + 10 * k, r.x + r.w - g.X(3e10) - 8 * k, { size: 13, weight: 800, color: tone(S, 'err').ink, base: 'top', a: eA * la, halo: true });
    const ja = fr(S, 'emergent-ex', 0.75, 0.9) * (1 - fr(S, 'mirage-demo', 0.5, 0.7));
    if (ja > 0.01) chip(S, S.l('¿un salto?', 'a jump?'), g.X(4e8), g.Y(0.42), 'err', { a: ja });
  }
  // por cifra: la mejora gradual
  const pA = fr(S, 'mirage-demo', 0.25, 0.4);
  if (pA > 0.01) {
    const prog = fr(S, 'mirage-demo', 0.25, 0.65, 'lin'), pts: [number, number][] = [];
    for (let i = 0; i <= 160 * prog; i++) { const N = 10 ** (LX0 + ((LX1 - LX0) * i) / 160); pts.push([g.X(N), g.Y(pDigit(N))]); }
    if (pts.length > 1) d.polyline(pts, tone(S, 'sig').c, 2.8, { a: pA });
    EM_SIZES.forEach((N) => { if ((Math.log10(N) - LX0) / (LX1 - LX0) <= prog + 0.001) d.circle(g.X(N), g.Y(pDigit(N)), 4 * k, { fill: tone(S, 'sig').c, stroke: p.stage, lw: 1.5, a: pA }); });
    fitText(S, S.l('por cifra', 'per digit'), g.X(1e8) - 6 * k, g.Y(pDigit(1e8)) - 8 * k, g.X(1e8) - r.x, { size: 13, weight: 800, color: tone(S, 'sig').ink, align: 'right', base: 'bottom', a: pA * fr(S, 'mirage-demo', 0.5, 0.65), halo: true });
  }
  // veredicto: la misma mejora, dos maneras de medirla
  const vA = fr(S, 'verdict', 0.1, 0.3);
  if (vA > 0.01) {
    // abajo a la derecha: ahí las dos curvas ya van altas y la zona está vacía
    const str = S.l('parte del salto lo pone la medida', 'part of the jump comes from the metric');
    const bw = Math.min(r.w * 0.46, d.measure(str, { size: fz(S, 12.5), weight: 800 }) + 16 * k);
    const lines = d.wrap(str, bw - 16 * k, { size: fz(S, 12.5), weight: 800 }), lh = lineH(S, 12.5);
    const bh = lines.length * lh + 10 * k, bx = r.x + r.w - bw - 4 * k, by = r.y + r.h - bh - 8 * k;
    d.rect(bx, by, bw, bh, { fill: S.pal.surface, stroke: p.ink2, lw: 1.4, r: 3, a: vA });
    lines.forEach((ln, i) => d.text(ln, bx + 8 * k, by + 5 * k + i * lh, { size: fz(S, 12.5), weight: 800, color: p.ink, base: 'top', a: vA }));
  }

  drawSum(S, g.R.aside);
}

/** La suma de ejemplo: 5 815 + 4 736 = 10 551; el modelo responde 10 541 (falla una cifra). */
function drawSum(S: Frame, A: Rect) {
  const { d, pal: p } = S, k = kk(S), b = roomy(S);
  const a0 = fr(S, 'mirage', 0.15, 0.3);
  if (a0 < 0.01) return;
  const truth = '10551', said = '10541';
  let y = A.y;
  const q = `${S.n(5815, 0)} + ${S.n(4736, 0)} = ?`;
  fitText(S, q, A.x, y, A.w, { size: 17 * b, weight: 800, font: 'mono', color: p.ink, base: 'top', a: a0 });
  y += lineH(S, 17 * b) + 8 * k;
  const cell = Math.min(34 * k * b, (A.w - 110 * k) / 5.6, (A.h - lineH(S, 16) * 4) / 2.8);
  const row = (lab: string, digits: string, mark: boolean, yy: number, a: number) => {
    const lw = 96 * k;
    fitText(S, lab, A.x, yy + cell / 2, lw - 6 * k, { size: 12.5, weight: 700, color: p.ink2, base: 'middle', a });
    [...digits].forEach((ch, i) => {
      const x = A.x + lw + i * (cell + 3 * k), bad = mark && ch !== truth[i];
      const t: Tone = mark ? (bad ? 'err' : 'sig') : 'mute';
      d.rect(x, yy, cell, cell, { fill: alpha(tone(S, t).c, mark ? 0.16 : 0.06), stroke: tone(S, t).c, lw: 1.4, r: 2, a });
      d.text(ch, x + cell / 2, yy + cell / 2 + 1, { size: fz(S, 15 * Math.min(b, 1.15)), weight: 800, font: 'mono', color: tone(S, t).ink, align: 'center', base: 'middle', a });
      if (mark) d.text(bad ? '✗' : '✓', x + cell / 2, yy + cell + 2 * k, { size: fz(S, 12), weight: 800, color: tone(S, t).ink, align: 'center', base: 'top', a: a * fr(S, 'mirage', 0.5, 0.6) });
    });
  };
  row(S.l('correcta', 'correct'), truth, false, y, a0);
  y += cell + 6 * k;
  row(S.l('el modelo', 'the model'), said, true, y, fr(S, 'mirage', 0.35, 0.5));
  y += cell + lineH(S, 12) + 8 * k;
  const s1 = fr(S, 'mirage', 0.65, 0.8), s2 = fr(S, 'mirage-demo', 0.15, 0.3);
  fitText(S, S.l('todo o nada: 0 puntos', 'all or nothing: 0 points'), A.x, y, A.w, { size: 14 * b, weight: 800, color: tone(S, 'err').ink, base: 'top', a: s1 });
  y += lineH(S, 14 * b) + 3 * k;
  if (y + lineH(S, 13) <= A.y + A.h + 2 * k) fitText(S, S.l('por cifra: 4 de 5', 'per digit: 4 of 5'), A.x, y, A.w, { size: 14 * b, weight: 800, color: tone(S, 'sig').ink, base: 'top', a: s2 });
}

/** Pila vertical de bloques repartidos dentro de una tarjeta (el espacio sobrante se reparte entre los huecos). */
function stack(S: Frame, c: Rect, pad: number, items: { h: number; draw: (y: number) => void }[]) {
  const k = kk(S), inner = c.h - 2 * pad, used = items.reduce((t, it) => t + it.h, 0);
  const gap = Math.max(4 * k, Math.min(22 * k, (inner - used) / Math.max(1, items.length - 1)));
  let y = c.y + pad;
  for (const it of items) { if (y + it.h > c.y + c.h - pad + 2 * k) break; it.draw(y); y += it.h + gap; }
}

/** Vista 7: para quien decide (dos tarjetas) y el puente a la memoria. */
export function drawClose(S: Frame) {
  const { d, pal: p } = S, k = kk(S), all = regions(S).all, b = roomy(S);
  const cardsA = 1 - fr(S, 'bridge', 0, 0.2);
  const [c1, c2] = S.portrait ? split(all, 'v', 0.48, 10 * k) : split(all, 'h', 0.5, 14 * k);
  const pad = (S.portrait ? 10 : 14) * k;
  if (cardsA > 0.01) d.withAlpha(cardsA, () => {
    // 1 · entrenar desde cero
    const a1 = fr(S, 'lens-scratch', 0.05, 0.2);
    d.withAlpha(a1, () => {
      box(S, c1, 'err', { fill: 0.05 });
      const w = c1.w - 2 * pad, x = c1.x + pad, ll = calc(MODELS.llama);
      const note = S.l('solo la corrida final de Llama 3.1, con nuestros supuestos', 'final run of Llama 3.1 alone, with our assumptions');
      const lst = S.l('no incluye: ensayos, fallas, datos ni personas', 'excludes: experiments, failures, data, and people');
      const end = S.l('→ se parte de un modelo ya entrenado', '→ start from an already trained model');
      const hOf = (str: string, sz: number, wt = 700) => d.wrap(str, w, { size: fz(S, sz), weight: wt }).length * lineH(S, sz);
      stack(S, c1, pad, [
        { h: lineH(S, 17 * b), draw: (y) => fitText(S, S.l('Entrenar desde cero', 'Training from scratch'), x, y, w, { size: 17 * b, weight: 800, color: p.ink, base: 'top' }) },
        { h: lineH(S, 30 * b) + hOf(note, 12, 600), draw: (y) => { fitText(S, `≈ ${money(S, ll.cost)}`, x, y, w, { size: 30 * b, weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top', a: fr(S, 'lens-scratch', 0.2, 0.35) }); para(S, note, x, y + lineH(S, 30 * b), w, { size: 12, weight: 600, color: p.mute, italic: true, a: fr(S, 'lens-scratch', 0.2, 0.35) }); } },
        { h: hOf(lst, 13.5 * b), draw: (y) => para(S, lst, x, y, w, { size: 13.5 * b, weight: 700, color: p.ink2, a: fr(S, 'lens-scratch', 0.4, 0.55) }) },
        { h: hOf(end, 14.5 * b, 800), draw: (y) => para(S, end, x, y, w, { size: 14.5 * b, weight: 800, color: tone(S, 'sig').ink, a: fr(S, 'lens-scratch', 0.72, 0.88) }) },
      ]);
    });
    // 2 · ¿más grande = mejor?
    const a2 = fr(S, 'lens-bigger', 0.05, 0.2);
    if (a2 > 0.01) d.withAlpha(a2, () => {
      box(S, c2, 'sig', { fill: 0.05 });
      const w = c2.w - 2 * pad, x = c2.x + pad;
      const qs = [S.l('¿con cuántos datos?', 'trained on how much data?'), S.l('¿con cuánto cómputo?', 'with how much compute?'), S.l('¿cómo le va en tus tareas?', 'how does it do on your tasks?')];
      const qs2 = S.portrait ? 13 : 14.5 * b, qH = lineH(S, qs2) * (S.portrait ? 1.05 : 1.15);
      const bars: [string, number, 'w' | 'lat'][] = [[`Chinchilla · ${count(S, MODELS.chinchilla.N)}`, MMLU.chinchilla, 'lat'], [`Gopher · ${count(S, GOPHER.N)}`, MMLU.gopher, 'w']];
      const bh = S.portrait ? lineH(S, 12.5) + 2 * k : Math.max(lineH(S, 12.5) + 6 * k, 20 * k * b);
      stack(S, c2, pad, [
        { h: lineH(S, S.portrait ? 15 : 17 * b), draw: (y) => fitText(S, S.l('¿Más grande = mejor?', 'Bigger = better?'), x, y, w, { size: S.portrait ? 15 : 17 * b, weight: 800, color: p.ink, base: 'top' }) },
        { h: qH * 3, draw: (y) => qs.forEach((q, i) => fitText(S, `· ${q}`, x, y + i * qH, w, { size: qs2, weight: 700, color: p.ink2, base: 'top', a: fr(S, 'lens-bigger', 0.25 + i * 0.12, 0.35 + i * 0.12) })) },
        { h: lineH(S, 12) + 2 * bh + 10 * k, draw: (y) => {
          const aa = fr(S, 'lens-bigger', 0.72, 0.88);
          fitText(S, S.l('MMLU, % de aciertos', 'MMLU, % correct'), x, y, w, { size: 12, weight: 700, color: p.mute, base: 'top', a: aa });
          const labW = Math.min(w * 0.55, Math.max(...bars.map(([l]) => d.measure(l, { size: fz(S, 12.5), weight: 700 }))) + 10 * k);
          bars.forEach(([l, v, t], i) => {
            const yy = y + lineH(S, 12) + 4 * k + i * (bh + 4 * k), bw = (w - labW - 52 * k) * (v / 100);
            fitText(S, l, x, yy + bh / 2, labW - 6 * k, { size: 12.5, weight: 700, color: tone(S, t).ink, base: 'middle', a: aa });
            d.rect(x + labW, yy, bw, bh, { fill: alpha(tone(S, t).c, 0.45), stroke: tone(S, t).c, lw: 1.2, r: 2, a: aa });
            d.text(`${S.n(v, 1)}${S.lang === 'es' ? ' %' : '%'}`, x + labW + bw + 6 * k, yy + bh / 2, { size: fz(S, 13), weight: 800, font: 'mono', color: p.ink, base: 'middle', a: aa });
          });
        } },
      ]);
    });
  });
  // puente: ¿cabe el modelo en la memoria de la GPU?
  const bA = fr(S, 'bridge', 0.2, 0.4);
  if (bA > 0.01) d.withAlpha(bA, () => {
    const cx = all.x + all.w / 2, cy = all.y + all.h / 2;
    const mw = Math.min(all.w * 0.55, 330 * k * b), mh = Math.min(all.h * 0.5, 150 * k * b);
    const gw = Math.min(all.w * 0.24, 120 * k * b), gh = Math.min(all.h * 0.3, 76 * k * b);
    const S2 = S.portrait;
    const mx = S2 ? cx - mw / 2 : cx - (mw + gw + 50 * k) / 2, my = S2 ? all.y + 30 * k : cy - mh / 2;
    const gx = S2 ? cx - gw / 2 : mx + mw + 50 * k, gy = S2 ? my + mh + 50 * k : cy - gh / 2;
    // el modelo: muchos parámetros
    const cols = 24, rows = 10, cw = mw / cols, ch = mh / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) d.rect(mx + i * cw + 0.5, my + j * ch + 0.5, cw - 1, ch - 1, { fill: alpha(tone(S, 'w').c, 0.4) });
    d.rect(mx, my, mw, mh, { stroke: tone(S, 'w').c, lw: 1.6, r: 2 });
    fitText(S, S.l(`${count(S, MODELS.llama.N)} de parámetros`, `${count(S, MODELS.llama.N)} parameters`), mx + mw / 2, my - 6 * k, mw, { size: 14 * b, weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'bottom' });
    // la memoria de una GPU
    const ga = fr(S, 'bridge', 0.45, 0.6);
    d.withAlpha(ga, () => {
      d.rect(gx, gy, gw, gh, { fill: alpha(tone(S, 'dat').c, 0.12), stroke: tone(S, 'dat').c, lw: 2, r: 3 });
      fitText(S, S.l('memoria de una GPU', 'one GPU’s memory'), gx + gw / 2, gy + gh + 6 * k, Math.max(gw, 120 * k), { size: 13.5 * b, weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'top' });
      fitText(S, 'H100: 80 GB', gx + gw / 2, gy + gh / 2, gw - 8 * k, { size: 14 * b, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
    });
    const qa = fr(S, 'bridge', 0.7, 0.85);
    const qx = S2 ? cx + gw / 2 + 24 * k : (mx + mw + gx) / 2, qy = S2 ? gy + gh / 2 : cy;
    d.text('?', qx, qy, { size: fz(S, 30), weight: 800, color: p.ink2, align: 'center', base: 'middle', a: qa });
  });
}
