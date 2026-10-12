// Escena: Lo que una neurona no puede (XOR). El plano de las cuatro esquinas, el mapa de todas las rectas posibles,
// la línea de tiempo del primer invierno y la red 2-2-1 con pesos reales que resuelve XOR. La escena hace sola las
// demostraciones (prueba rectas, recorre las cuatro entradas) con S.drive; los «tu turno» son opcionales.
import {
  Plot, alpha, badge, box, clamp, drawNet, ease, hash, inset, lerp, link, neu, regions, tone, type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';

type Fn = 'or' | 'and' | 'xor';
const PTS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const FN: Record<Fn, (x: number, y: number) => 0 | 1> = { or: (x, y) => (x || y ? 1 : 0), and: (x, y) => (x && y ? 1 : 0), xor: (x, y) => (x !== y ? 1 : 0) };
const H = (z: number) => (z > 0 ? 1 : 0);
const NET = { h1: (x: number, y: number) => H(x + y - 0.5), h2: (x: number, y: number) => H(x + y - 1.5), out: (h1: number, h2: number) => H(h1 - h2 - 0.5) };
const INPUTS = ['00', '01', '10', '11'];
const SQ2 = Math.SQRT2;

/** Aciertos de una recta n·p = c sobre XOR (se elige sola la orientación del lado). */
function score(fn: Fn, ang: number, c: number): number {
  const a = (ang * Math.PI) / 180, nx = Math.cos(a), ny = Math.sin(a);
  let ok = 0;
  for (const [x, y] of PTS) if ((nx * x + ny * y - c > 0 ? 1 : 0) === FN[fn](x, y)) ok++;
  return Math.max(ok, 4 - ok);
}

interface St { last?: { a: number; c: number }; attempts: number; best: number; dots: { a: number; c: number }[]; tried: Record<string, boolean>; chg: number; lastInp?: string }
const st0 = (): St => ({ attempts: 0, best: 0, dots: [], tried: {}, chg: -10 });
const stOf = (S: Frame): St => (S.st.s ??= st0());
/** Fracción 0..1 del segmento k. */
const tau = (S: Frame, k: string) => clamp((S.t - S.start(k)) / Math.max(0.5, S.end(k) - S.start(k)));

const scene: SceneFactory = () => ({
  controls: [
    { id: 'angle', kind: 'slider', label: { es: 'Ángulo de la recta', en: 'Line angle' }, min: 0, max: 180, step: 1, value: 30, from: 'xor-demo', to: 'proof', fmt: (v) => `${v}°` },
    { id: 'shift', kind: 'slider', label: { es: 'Desplazamiento', en: 'Shift' }, min: -1, max: 1.5, step: 0.05, value: 0.4, from: 'xor-demo', to: 'proof', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { id: 'inp', kind: 'choice', label: { es: 'Entrada (x, y)', en: 'Input (x, y)' }, value: '00', from: 'route-demo', to: 'space', options: INPUTS.map((v) => ({ value: v, label: { es: `(${v[0]}, ${v[1]})`, en: `(${v[0]}, ${v[1]})` } })) },
  ],

  init(S) { S.st.s = st0(); },

  update(S) {
    const st = stOf(S);
    // demostración: la recta gira de 30° a 165° mientras su desplazamiento busca el mejor lugar (el contador llega a 3, nunca a 4)
    if (S.between('xor-demo', 'proof')) {
      const q = clamp((tau(S, 'xor-demo') - 0.08) / 0.84), ang = S.on('try1') ? 135 : Math.round(lerp(30, 165, q));
      const shifts = Array.from({ length: 51 }, (_, i) => -1 + i * 0.05);
      const best = shifts.reduce((b, c) => (score('xor', ang, c) > score('xor', ang, b) ? c : b), 0.4);
      S.drive('angle', ang); S.drive('shift', Math.round(best * 20) / 20);
    }
    // con cada entrada, la señal recorre la red: 00, 01, 10, 11
    if (S.between('route-demo', 'space')) S.drive('inp', S.on('try2') ? '01' : INPUTS[Math.min(3, Math.floor(tau(S, 'route-demo') * 4))]);
    if (S.between('try1', 'proof') && (S.touched.has('angle') || S.touched.has('shift'))) {
      const a = S.p.angle ?? 30, c = S.p.shift ?? 0.4;
      if (!st.last) st.last = { a, c };
      if (Math.abs(a - st.last.a) >= 6 || Math.abs(c - st.last.c) >= 0.1) {
        st.attempts++; st.best = Math.max(st.best, score('xor', a, c)); st.dots.push({ a, c }); st.last = { a, c };
      }
      if (st.attempts >= 6) S.complete('tries');
    }
    if (S.between('route-demo', 'space')) {
      const inp = S.p.inp ?? '00';
      if (st.lastInp !== inp) st.chg = S.clock;
      if (S.touched.has('inp')) st.tried[inp] = true;
      st.lastInp = inp;
      if (INPUTS.every((k) => st.tried[k])) S.complete('corners');
    }
  },

  render(S) {
    const seg = S.seg, ix = (id: string) => S.segIndex(id);
    const g = groupOf(S, seg), gPrev = groupOf(S, Math.max(0, seg - 1));
    const fade = g !== gPrev && seg > 0 ? clamp(S.segT / 0.5) : 1;
    S.d.withAlpha(fade, () => {
      if (g === 'plane') drawPlane(S);
      else if (g === 'map') drawMap(S);
      else if (g === 'time') drawTime(S);
      else if (g === 'net') drawNetwork(S);
      else if (g === 'space') drawSpace(S);
      else if (g === 'recap') drawRecap(S);
      else drawBridge(S);
    });
    void ix;
  },
});

function groupOf(S: Frame, seg: number) {
  const id = (k: string) => S.segIndex(k);
  if (seg < id('proof')) return 'plane';
  if (seg === id('proof')) return 'map';
  if (seg === id('diagonals')) return 'plane';
  if (seg < id('fix')) return 'time';
  if (seg === id('fix')) return 'plane';
  if (seg < id('space')) return 'net';
  if (seg === id('space')) return 'space';
  if (seg < id('recap') ) return 'net';
  if (seg === id('recap')) return 'recap';
  return 'bridge';
}

// ═════════ el plano de las cuatro esquinas ═════════
function squarePlot(S: Frame, r: Rect, labels: [string, string] = ['x', 'y']) {
  const side = Math.min(r.w, r.h), outer = { x: r.x + (r.w - side) / 2, y: r.y + (r.h - side) / 2, w: side, h: side };
  return new Plot(S, outer, { xr: [-0.3, 1.3], yr: [-0.3, 1.3], xLabel: labels[0], yLabel: labels[1], xTicks: [0, 1], yTicks: [0, 1], tickFmt: (v) => String(v), pad: { l: 30, b: 30, t: 16, r: 12 } });
}
function lineN(plot: Plot, n: [number, number], c: number, color: 'ink' | 'sig' | 'w' | 'err' | 'dat' | 'lat' | 'mute', lw = 2.6, a = 1) {
  const d: [number, number] = [-n[1], n[0]], p0: [number, number] = [n[0] * c, n[1] * c];
  plot.line(p0[0] - d[0] * 4, p0[1] - d[1] * 4, p0[0] + d[0] * 4, p0[1] + d[1] * 4, color, lw, undefined, a);
}
const unit = (a: number): [number, number] => { const r = (a * Math.PI) / 180; return [Math.cos(r), Math.sin(r)]; };

function drawPlane(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.78 : 0.56);
  const plot = squarePlot(S, R.main);
  const on = (k: string) => S.on(k);
  // función activa según el segmento
  const fn: Fn = on('xor-def') ? 'xor' : on('and') ? 'and' : on('or') ? 'or' : 'xor';
  const showPoints = S.reveal('hook', 0.2, 0.6);
  plot.axes(S.reveal('hook', 0, 0.6));

  // regiones de la recta guiada (o, y) o de la recta del jugador
  let nline: [number, number] | null = null, cline = 0, region = 0;
  const lineA = (ang: number, c: number) => { nline = unit(ang); cline = c; };
  if (S.between('recall', 'xor-def')) {
    const isOr = !S.on('and'), tgt = isOr ? 0.5 / SQ2 : 1.5 / SQ2;
    const t = S.at(isOr ? (S.on('or') ? 'or' : 'recall') : 'and', 0.3, 1.5, 'io');
    lineA(lerp(isOr ? 100 : 45, 45, t), lerp(isOr ? -0.4 : 0.35, tgt, t)); region = isOr && !S.on('or') ? 0.6 * (1 - S.at('logic-intro', 0, 0.6)) : 1;
  } else if (S.between('xor-demo', 'proof')) { lineA(S.p.angle ?? 30, S.p.shift ?? 0.4); region = 1; }
  else if (S.is('fix')) { /* dos rectas, más abajo */ }

  if (nline && region > 0.01) {
    const n = nline as [number, number], c = cline;
    d.withAlpha(region, () => plot.heat((x, y) => (n[0] * x + n[1] * y - c > 0 ? 1 : 0), (v) => alpha(tone(S, v ? 'err' : 'dat').c, 0.1), [32, 32]));
    lineN(plot, n, c, 'ink', 2.8, region);
  }
  if (S.is('fix')) {
    const a = S.reveal('fix', 0.4, 0.8), b = S.reveal('fix', 1.6, 0.8);
    plot.heat((x, y) => (x + y - 0.5 > 0 && x + y - 1.5 <= 0 ? 1 : 0), (v) => (v ? alpha(tone(S, 'err').c, 0.14 * b) : alpha(tone(S, 'dat').c, 0.06 * b)), [32, 32]);
    lineN(plot, unit(45), 0.5 / SQ2, 'sig', 2.8, a); lineN(plot, unit(45), 1.5 / SQ2, 'w', 2.8, b);
    d.withAlpha(a, () => badge(S, 'OR', plot.X(-0.12), plot.Y(0.32), { tone: 'sig' }));
    d.withAlpha(b, () => badge(S, 'AND', plot.X(1.12), plot.Y(0.52), { tone: 'w' }));
  }
  if (S.is('diagonals')) {
    const a = S.at('diagonals', 0.3, 1.4, 'out'), b = S.at('diagonals', 1.0, 2.1, 'out');
    plot.line(0, 1, lerp(0, 1, a), lerp(1, 0, a), 'err', 3);
    plot.line(0, 0, lerp(0, 1, b), lerp(0, 1, b), 'dat', 3);
    if (b > 0.98) { plot.dot(0.5, 0.5, 6 + 2 * Math.sin(S.clock * 4), 'ink'); d.text(S.l('se cruzan', 'they cross'), plot.X(0.5) + 12 * u, plot.Y(0.5) - 12 * u, { size: 13, weight: 700, halo: p.stage }); }
  }

  // puntos con su clase: círculo = 0, cruz = 1 (la forma acompaña al color)
  PTS.forEach(([x, y], i) => {
    const k = S.reveal('hook', 0.3 + i * 0.12, 0.45);
    // antes de «or» las esquinas todavía no tienen respuesta: puntos neutros
    if (k > 0) { if (S.on('or')) plot.datum(x, y, FN[fn](x, y) as 0 | 1, { r: 7 * k, a: showPoints }); else plot.dot(x, y, 6 * k, 'ink'); }
  });
  // «logic-intro»: las cuatro combinaciones, rotuladas en su esquina
  if (S.between('logic-intro', 'or')) PTS.forEach(([x, y], i) => {
    const a = S.at('logic-intro', 0.3 * (S.end('logic-intro') - S.start('logic-intro')) + i * 0.35, 0.3 * (S.end('logic-intro') - S.start('logic-intro')) + i * 0.35 + 0.5);
    badge(S, `(${x}, ${y})`, plot.X(x) + (x ? -1 : 1) * 30 * u, plot.Y(y) + (y ? -1 : 1) * 22 * u, { size: 13, a });
  });
  // ¿y la función? (en hook todavía sin clases)
  if (S.between('hook', 'recall')) PTS.forEach(([x, y]) => d.text('?', plot.X(x) + 14 * u, plot.Y(y) - 10 * u, { size: 13, weight: 700, color: p.mute, halo: p.stage, a: showPoints * (0.5 + 0.5 * Math.sin(S.clock * 3) ** 2) }));

  // fórmula de la neurona (recall)
  if (S.between('recall', 'or')) {
    const a = S.reveal('recall', 0.4, 0.6);
    d.withAlpha(a, () => d.text('w₁·x + w₂·y + b > 0', R.aside.x, R.aside.y + 6 * u, { size: 18, weight: 700, font: 'mono', color: tone(S, 'w').ink }));
    d.withAlpha(a, () => d.text(S.l('→ 1 de un lado de la recta, 0 del otro', '→ 1 on one side of the line, 0 on the other'), R.aside.x, R.aside.y + 34 * u, { size: 13, weight: 600, color: p.ink2, w: R.aside.w }));
  }

  // tabla de verdad
  if (S.on('or') && !S.between('xor-demo', 'proof')) tableTruth(S, R.aside, fn, 56 * u);

  // jugador: marcador de aciertos
  if (S.between('xor-demo', 'proof')) {
    const st = stOf(S), cur = score('xor', S.p.angle ?? 30, S.p.shift ?? 0.4), r = R.aside;
    const all: [string, string, string][] = [[S.l('aciertos ahora', 'right now'), `${cur} / 4`, cur === 4 ? tone(S, 'dat').ink : p.ink], [S.l('tu mejor intento', 'your best attempt'), `${st.best} / 4`, tone(S, 'w').ink], [S.l('tus intentos', 'your attempts'), String(st.attempts), p.ink2]];
    const items = st.attempts > 0 ? all : all.slice(0, 1);   // en la demostración solo cuenta lo que se ve ahora
    items.forEach(([l, v, c], i) => {
      const x = S.portrait ? r.x + (i * r.w) / 3 : r.x, y = S.portrait ? r.y + 6 * u : r.y + 4 * u + i * 62 * u;
      d.text(l, x, y, { size: 12, weight: 700, color: p.mute });
      d.text(v, x, y + 8 * u, { size: S.portrait ? 24 : 32, weight: 800, font: 'mono', color: c, base: 'top' });
    });
    d.text(S.l('(el lado «uno» se elige solo)', '(the “one” side picks itself)'), r.x, r.y + (S.portrait ? 54 * u : 196 * u), { size: 12, color: p.mute, w: r.w });
  }
}

function tableTruth(S: Frame, r: Rect, fn: Fn, yoff = 0) {
  const { d, pal: p } = S, u = S.u, rh = 28 * u, a = S.reveal('or', 0.2, 0.5);
  const cell = (o: 0 | 1) => tone(S, o ? 'err' : 'dat');
  if (S.portrait) {   // transpuesta: una columna por entrada (cabe en poca altura)
    const lw = 38 * u, cw = Math.min((r.w - lw) / 4, 52 * u), y0 = r.y + 16 * u;
    d.withAlpha(a, () => {
      d.text(fn.toUpperCase(), r.x, r.y + 8 * u, { size: 14, weight: 800, base: 'middle' });
      ['x', 'y', S.l('sale', 'out')].forEach((h, k) => d.text(h, r.x + lw - 6 * u, y0 + (k + 0.5) * rh, { size: 12, weight: 700, color: p.ink2, align: 'right', base: 'middle' }));
      PTS.forEach(([x, y], i) => {
        const cx = r.x + lw + i * cw, o = FN[fn](x, y), t = cell(o);
        d.rect(cx, y0, cw - 4, rh * 3 - 4, { fill: p.surface2 });
        [x, y].forEach((v, k) => d.text(String(v), cx + (cw - 4) / 2, y0 + (k + 0.5) * rh, { size: 14, font: 'mono', weight: 600, align: 'center', base: 'middle' }));
        d.rect(cx + 2, y0 + 2 * rh, cw - 8, rh - 6, { fill: t.soft });
        d.text(String(o), cx + (cw - 4) / 2, y0 + 2.5 * rh - 2, { size: 14, font: 'mono', weight: 800, color: t.ink, align: 'center', base: 'middle' });
      });
    });
    return;
  }
  const w = Math.min(r.w, 190 * u), y0 = r.y + yoff;
  d.withAlpha(a, () => {
    d.text(fn.toUpperCase(), r.x, y0 - 4 * u, { size: 15, weight: 800, base: 'bottom' });
    d.rect(r.x, y0, w, rh, { fill: p.surface2 });
    ['x', 'y', S.l('sale', 'out')].forEach((h, i) => d.text(h, r.x + (i + 0.5) * (w / 3), y0 + rh / 2, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'middle' }));
    PTS.forEach(([x, y], i) => {
      const yy = y0 + (i + 1) * rh, o = FN[fn](x, y), t = cell(o);
      d.line(r.x, yy, r.x + w, yy, p.line, 1);
      [String(x), String(y)].forEach((v, k) => d.text(v, r.x + (k + 0.5) * (w / 3), yy + rh / 2, { size: 14, font: 'mono', weight: 600, align: 'center', base: 'middle' }));
      d.rect(r.x + 2 * (w / 3) + 4, yy + 3, w / 3 - 8, rh - 6, { fill: t.soft });
      d.text(String(o), r.x + 2.5 * (w / 3), yy + rh / 2, { size: 14, font: 'mono', weight: 800, color: t.ink, align: 'center', base: 'middle' });
    });
  });
}

// ═════════ el mapa de todas las rectas ═════════
function drawMap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.82 : 0.66);
  const plot = new Plot(S, R.main, { xr: [0, 180], yr: [-1, 1.5], xLabel: S.l('ángulo (°)', 'angle (°)'), yLabel: S.l('desplazamiento', 'shift'), xTicks: [0, 45, 90, 135, 180], yTicks: [-1, 0, 1], tickFmt: (v) => String(v), pad: { l: 40, b: 32, t: 16, r: 12 } });
  const sweep = S.at('proof', 0.5, 3.2, 'lin') * 180;
  const col = (v: number) => (v >= 4 ? alpha(tone(S, 'dat').c, 0.9) : v === 3 ? alpha(tone(S, 'sig').c, 0.45) : alpha(tone(S, 'mute').c, 0.14));
  plot.heat((a, c) => (a <= sweep ? score('xor', a, c) : 0), (v) => (v === 0 ? 'transparent' : col(v)), [90, 50]);
  plot.axes();
  const st = stOf(S);
  st.dots.forEach((q) => plot.dot(q.a, q.c, 3.2, 'w', { ring: true }));
  if (sweep < 180) plot.line(sweep, -1, sweep, 1.5, 'ink', 2);
  const r = R.aside, done = S.at('proof', 3.2, 3.8);
  d.withAlpha(done, () => {
    d.text(S.l('máximo', 'maximum'), r.x, r.y + 4 * u, { size: 12, weight: 700, color: p.mute });
    d.text('3 / 4', r.x, r.y + 12 * u, { size: 40, weight: 800, font: 'mono', base: 'top' });
    d.text(S.l('ninguna recta llega a 4', 'no line reaches 4'), r.x, r.y + 70 * u, { size: 13, weight: 700, color: tone(S, 'err').ink, w: r.w });
  });
  // leyenda
  const ly = r.y + (S.portrait ? 0 : 130 * u), lx = S.portrait ? r.x + r.w * 0.5 : r.x;
  [[2, S.l('2 aciertos', '2 right')], [3, S.l('3 aciertos', '3 right')], [4, S.l('4 aciertos (no existe)', '4 right (does not exist)')]].forEach(([v, t], i) => {
    d.rect(lx, ly + i * 22 * u, 14 * u, 14 * u, { fill: col(v as number), stroke: p.line });
    d.text(String(t), lx + 22 * u, ly + i * 22 * u + 7 * u, { size: 12, weight: 600, color: p.ink2, base: 'middle' });
  });
  if (stOf(S).dots.length) d.text(S.l('○ tus intentos', '○ your attempts'), lx, ly + 3 * 22 * u + 6 * u, { size: 12, weight: 600, color: tone(S, 'w').ink });
}

// ═════════ línea de tiempo ═════════
function drawTime(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const x0 = R.x + 24 * u, x1 = R.x + R.w - 24 * u, y = R.y + R.h * 0.5, y0 = 1955, y1 = 1982;
  const X = (yr: number) => lerp(x0, x1, (yr - y0) / (y1 - y0));
  const a = S.reveal('history', 0.1, 0.5);
  d.withAlpha(a, () => {
    d.line(x0, y, x1, y, p.lineStrong, 2);
    [1960, 1970, 1980].forEach((t) => { d.line(X(t), y - 5, X(t), y + 5, p.lineStrong, 2); d.text(String(t), X(t), y + 12 * u, { size: 11, font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
  });
  const P = S.portrait;
  const items = [
    { yr: 1958, es: P ? 'Rosenblatt' : 'Perceptrón (Rosenblatt)', en: P ? 'Rosenblatt' : 'Perceptron (Rosenblatt)', tone: 'sig' as const, dy: -56, t: 0.6 },
    { yr: 1969, es: P ? '«Perceptrons»' : '«Perceptrons» (Minsky y Papert)', en: P ? '“Perceptrons”' : '“Perceptrons” (Minsky and Papert)', tone: 'err' as const, dy: 52, t: 1.6 },
    { yr: 1973, es: P ? 'Lighthill' : 'Informe Lighthill (Reino Unido)', en: P ? 'Lighthill' : 'Lighthill report (UK)', tone: 'w' as const, dy: P ? -104 : -56, t: 3.4 },
  ];
  items.forEach((it) => {
    const k = S.at('history', it.t, it.t + 0.6, 'out'); if (k <= 0) return;
    const px = X(it.yr), ty = y + it.dy * u, up = it.dy < 0;
    d.withAlpha(k, () => {
      d.line(px, y, px, ty + (up ? 14 * u : -14 * u), tone(S, it.tone).c, 2);
      d.circle(px, y, 6 * u, { fill: tone(S, it.tone).c });
      badge(S, `${it.yr} · ${S.l(it.es, it.en)}`, clamp(px, R.x + 90 * u, R.x + R.w - 90 * u), ty, { tone: it.tone });
    });
  });
  // el "invierno": los años setenta (1970-1980). Las fechas exactas dependen de a quién se pregunte: es una ilustración cualitativa, no un dato
  const c = S.at('history', 3.4, 5.2, 'io');
  if (c > 0) {
    d.withAlpha(c, () => {
      d.rect(X(1970), R.y + 10 * u, X(1980) - X(1970), R.h - 20 * u, { fill: alpha(p.mute, 0.07 * c) });
      for (let i = 0; i < 46; i++) {   // nieve: píxeles que caen despacio
        const sx = X(1970) + hash(i, 1) * (X(1980) - X(1970)), sy = R.y + 10 * u + ((hash(i, 2) * (R.h - 20 * u) + S.clock * (8 + 10 * hash(i, 3))) % (R.h - 20 * u));
        d.rect(Math.round(sx), Math.round(sy), 3, 3, { fill: alpha(p.ink2, 0.35 * c) });
      }
      d.text(S.l('primer invierno de la IA', 'first AI winter'), (X(1970) + X(1980)) / 2, R.y + R.h - 30 * u, { size: 14, weight: 800, color: p.ink2, align: 'center' });
      d.text(S.l('años setenta · ilustración cualitativa', '1970s · qualitative illustration'), (X(1970) + X(1980)) / 2, R.y + R.h - 12 * u, { size: 11, color: p.mute, align: 'center' });
    });
  }
  if (S.is('nuance')) {
    const k = S.reveal('nuance', 0.2, 0.6);
    d.withAlpha(k, () => {
      const bw = Math.min(R.w * 0.42, 250 * u), bh = 56 * u, yy = R.y + 6 * u;
      box(S, { x: R.x + R.w / 2 - bw - 8 * u, y: yy, w: bw, h: bh }, S.l('Neurona sola', 'Single neuron'), { tone: 'err', sub: S.l('límite demostrado', 'limit proven') });
      box(S, { x: R.x + R.w / 2 + 8 * u, y: yy, w: bw, h: bh }, S.l('Varias capas', 'Several layers'), { tone: 'w', sub: S.l('dudas, no una prueba', 'doubts, not a proof') });
    });
  }
  neu(S, R.x + R.w - 70 * u, R.y + R.h - 64 * u - (S.portrait ? 30 * u : 0), { scale: Math.max(2, Math.round(2.4 * u)), mood: 'sleep', a: S.at('history', 3.6, 4.2) });
}

// ═════════ la red 2-2-1 ═════════
function drawNetwork(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.62 : 0.66);
  const isCompute = S.is('compute') || S.is('compute-out'), isTry = S.is('try2') || S.is('route-demo'), isLimit = S.is('limit'), after = S.on('compute');
  const reveal = S.is('hidden') ? 1 + 2 * S.at('hidden', 0.2, 2.6, 'io') : 3;
  let inp: [number, number] | null = null, sigma = 0;
  if (isCompute) {
    // «compute»: la señal llega a las neuronas ocultas, una entrada tras otra; «compute-out»: llega hasta la salida
    const seg = S.is('compute') ? 'compute' : 'compute-out', f = clamp((tau(S, seg) - 0.12) / 0.8) * 4, k = Math.min(3, Math.floor(f));
    inp = [PTS[k][0], PTS[k][1]]; sigma = clamp((f - k) / 0.6, 0, 1) * (seg === 'compute' ? 1 : 2);
  }
  if (isTry || S.on('space')) { const q = S.p.inp ?? '00'; inp = [+q[0], +q[1]]; sigma = isTry ? clamp((S.clock - stOf(S).chg) / 0.5, 0, 1) * 2 : 2; }
  const acts: number[][] | undefined = inp ? ((): number[][] => {
    const h1 = NET.h1(inp[0], inp[1]), h2 = NET.h2(inp[0], inp[1]);
    return [[inp[0], inp[1]], sigma >= 1 ? [h1, h2] : [0, 0], sigma >= 2 ? [NET.out(h1, h2)] : [0]].map((row, l) => (l === 1 && sigma < 1) || (l === 2 && sigma < 2) ? row.map(() => 0) : row);
  })() : undefined;
  const netR = inset(R.main, 24 * u, 52 * u, 8 * u, 26 * u);
  const g = drawNet(S, netR, {
    layers: [2, 2, 1], reveal, weights: [[[1, 1], [1, 1]], [[1], [-1]]], showWeights: !isLimit && S.on('hidden'), acts: acts as any,
    signal: inp ? sigma : 0, inLabels: ['x', 'y'], outLabels: ['XOR'], nodeR: Math.max(13, Math.min(26, R.main.h / 8, R.main.w / 13)) / u, fmt: (w) => S.n(w, 0),
  });
  // etiquetas de las neuronas ocultas y sesgos
  if (S.on('hidden')) {
    const a = S.at('hidden', 2.2, 3.0);
    d.withAlpha(a, () => {
      const bf = (v: number) => S.n(v, 1);
      const tags: [string, number, 'sig' | 'w'][] = [['OR', -0.5, 'sig'], ['AND', -1.5, 'w']];
      g.nodes[1].forEach((n, i) => badge(S, `${tags[i][0]} · b = ${bf(tags[i][1])}`, n.x, n.y - 36 * u, { tone: tags[i][2], size: 11 }));
      badge(S, `XOR · b = ${bf(-0.5)}`, g.nodes[2][0].x, g.nodes[2][0].y - 36 * u, { tone: 'err', size: 11 });
    });
  }
  if (isLimit) {
    const a = S.reveal('limit', 0.2, 0.6);
    d.withAlpha(a, () => g.nodes[0].concat(g.nodes[1]).forEach((n, i) => { if (i < 2) d.text('?', (n.x + g.nodes[1][0].x) / 2, n.y - 8 * u + (i ? 24 * u : -24 * u), { size: 20, weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'middle', a: 0.6 + 0.4 * Math.sin(S.clock * 3) ** 2 }); }));
    d.withAlpha(a, () => d.text(S.l('¿cómo se aprenden estos pesos?', 'how are these weights learned?'), R.main.x + R.main.w / 2, R.main.y + R.main.h - 8 * u, { size: 14, weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'bottom' }));
  }
  // tabla de cálculo
  if (after && !isLimit) calcTable(S, R.aside, inp, sigma);
}

function calcTable(S: Frame, r: Rect, inp: [number, number] | null, sigma: number) {
  const { d, pal: p } = S, u = S.u, rh = 28 * u, w = Math.min(r.w, 230 * u);
  // en «compute» se llenan las columnas OR y AND fila por fila; en «compute-out», la columna de salida
  const k = S.is('compute') ? clamp((tau(S, 'compute') - 0.12) / 0.8, 0, 1) * 4 : 4;
  const kOut = S.is('compute') ? 0 : S.is('compute-out') ? clamp((tau(S, 'compute-out') - 0.12) / 0.8, 0, 1) * 4 : 4;
  d.rect(r.x, r.y, w, rh, { fill: p.surface2 });
  ['x', 'y', 'OR', 'AND', S.l('sale', 'out')].forEach((h, i) => d.text(h, r.x + (i + 0.5) * (w / 5), r.y + rh / 2, { size: 12, weight: 700, color: p.ink2, align: 'center', base: 'middle' }));
  PTS.forEach(([x, y], i) => {
    const yy = r.y + (i + 1) * rh, vis = clamp(k - i);
    const h1 = NET.h1(x, y), h2 = NET.h2(x, y), o = NET.out(h1, h2);
    const hot = inp && inp[0] === x && inp[1] === y;
    d.line(r.x, yy, r.x + w, yy, p.line, 1);
    if (hot) d.rect(r.x, yy, w, rh, { fill: tone(S, 'sig').soft });
    const visOut = clamp(kOut - i);
    [x, y, h1, h2, o].forEach((v, c) => { const show = c < 2 || (c === 4 ? visOut > 0.9 : vis > 0.5); d.text(show ? String(v) : '·', r.x + (c + 0.5) * (w / 5), yy + rh / 2, { size: 14, font: 'mono', weight: c === 4 ? 800 : 600, color: c === 4 && show ? tone(S, o ? 'err' : 'dat').ink : p.ink, align: 'center', base: 'middle' }); });
  });
  void sigma;
}

// ═════════ el espacio que transforma la capa oculta ═════════
function drawSpace(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.78 : 0.6);
  const m = S.at('space', 0.8, 3.2, 'io');
  const plot = squarePlot(S, R.main, [m > 0.5 ? 'h₁ (OR)' : 'x', m > 0.5 ? 'h₂ (AND)' : 'y']);
  plot.axes();
  // la recta de salida aparece cuando ya se transformó
  const la = S.at('space', 3.4, 4.4);
  if (la > 0) { d.withAlpha(la, () => { plot.heat((x, y) => (x - y - 0.5 > 0 ? 1 : 0), (v) => alpha(tone(S, v ? 'err' : 'dat').c, 0.1), [32, 32]); lineN(plot, [1 / SQ2, -1 / SQ2], 0.5 / SQ2, 'ink', 2.8); }); }
  PTS.forEach(([x, y]) => {
    const hx = NET.h1(x, y), hy = NET.h2(x, y), px = lerp(x, hx, m), py = lerp(y, hy, m);
    plot.datum(px, py, FN.xor(x, y) as 0 | 1, { r: 7 });
  });
  if (m > 0.98) d.withAlpha(S.at('space', 3.0, 3.8), () => d.text(S.l('los dos unos coinciden en (1, 0)', 'the two ones coincide at (1, 0)'), plot.X(1.28), plot.Y(-0.12), { size: 12, weight: 700, color: tone(S, 'err').ink, align: 'right', halo: p.stage }));
  const r = R.aside;
  d.withAlpha(S.reveal('space', 0.4, 0.6), () => {
    d.text(S.l('antes: (x, y)', 'before: (x, y)'), r.x, r.y + 4 * u, { size: 13, weight: 700, color: p.ink2 });
    d.text(S.l('después: (h₁, h₂)', 'after: (h₁, h₂)'), r.x, r.y + 26 * u, { size: 13, weight: 700, color: tone(S, 'sig').ink });
    d.text(S.portrait ? '(0,0)→(0,0)  (0,1)→(1,0)\n(1,0)→(1,0)  (1,1)→(1,1)' : '(0,0)→(0,0)\n(0,1)→(1,0)\n(1,0)→(1,0)\n(1,1)→(1,1)', r.x, r.y + (S.portrait ? 46 : 56) * u, { size: 13, font: 'mono', color: p.ink, lh: 1.5 });
  });
}

// ═════════ resumen y puente ═════════
function drawRecap(S: Frame) {
  const R = regions(S, 1).all, u = S.u;
  const labels = [S.l('1 neurona: una recta', '1 neuron: one line'), S.l('XOR: ninguna recta basta', 'XOR: no single line'), S.l('Capa oculta: rectas combinadas', 'Hidden layer: combined lines')];
  const tones = ['sig', 'err', 'dat'] as const;
  const bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.3, 240 * u), bh = 70 * u;
  const pos: Rect[] = labels.map((_, i) => S.portrait
    ? { x: R.x + (R.w - bw) / 2, y: R.y + 10 * u + i * (bh + 36 * u), w: bw, h: bh }
    : { x: R.x + i * (R.w - bw) / 2, y: R.y + R.h / 2 - bh / 2, w: bw, h: bh });
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.2 + i * 0.5, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: 14 }); });
  for (let i = 0; i < 2; i++) { const a = S.at('recap', 0.7 + i * 0.5, 1.2 + i * 0.5); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
}
function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Capas y activaciones', 'Layers and activations'), cx, cy + 82 * u, { size: 24, weight: 800, align: 'center' });
  });
}

export default scene;
void ease; void inset;
