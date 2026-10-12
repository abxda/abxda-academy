// Vista del plano de códigos (VAE de la lección 15): la nube de datos y sus grupos, el proceso hacia delante, el regreso paso a paso
// con flechas (la red real estima el ruido de cada punto), la decodificación de puntos nuevos y el guiado sin clasificador
// (dos flechas, su diferencia exagerada, la escala y su precio). Todo sale de models.ts / state.ts.
import { Plot, alpha, clamp, lerp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CODES, LAB, NCODES, NULL, T, latMove, signalShare, vaeDec } from './models';
import { DEMO } from './demo';
import { DATA_EPS, SEVENS_IDX, STAR_K, guidedPts, scaleView, sevensCount, sixPoints, starPoint, unc, uncovered } from './state';
import { cellFor, dots, fr, fz, kk, label, live, mixBar, pix } from './helpers';

const XR: [number, number] = [-4.0, 6.1], YR: [number, number] = [-4.75, 5.35];   // cabe todo: datos, estática y la nube guiada con escala 5 (hasta x ≈ 5.9)
const ARROW = 0.55;   // largo (en unidades del plano) de las flechas típicas del regreso: el movimiento real de un paso es muy pequeño

export function layPlane(S: Frame) {
  const R = regions(S, S.portrait ? 0.64 : 0.56), side = Math.min(R.main.w, R.main.h);
  const sq: Rect = { x: R.main.x + (R.main.w - side) / 2, y: R.main.y + (R.main.h - side) / 2, w: side, h: side };
  return { R, plot: new Plot(S, sq, { xr: XR, yr: YR, pad: { l: 6, r: 6, t: 6, b: 6 } }), k: kk(S) };
}

const MEANS = (() => { const m: [number, number, number][] = Array.from({ length: 10 }, () => [0, 0, 0]); for (let i = 0; i < NCODES; i++) { const g = m[LAB[i]]; g[0] += CODES[2 * i]; g[1] += CODES[2 * i + 1]; g[2]++; } return m.map(([x, y, n]) => [x / n, y / n] as [number, number]); })();
const SUB = Array.from({ length: Math.ceil(DEMO.nPts / 4) }, (_, i) => i * 4);   // puntos con flecha

/** Paso del regreso que se ve (fraccionario durante la demostración, para que el movimiento sea continuo). */
function revK(S: Frame): number {
  if (S.touched.has('rev')) return S.p.rev ?? 0;
  if (S.is('plane-rev-demo')) return T * fr(S, 'plane-rev-demo', 0.06, 0.9, 'lin');
  if (S.between('plane-start', 'plane-rev-demo')) return 0;
  return S.p.rev ?? T;
}
const lerpPts = (a: Float32Array, b: Float32Array, f: number) => (f <= 0 ? a : Float32Array.from(a, (v, i) => lerp(v, b[i], f)));

export function drawPlane(S: Frame) {
  const { d, pal: p } = S, { R, plot, k } = layPlane(S), r = plot.r, lat = tone(S, 'lat'), A = R.aside;
  // marco y ejes mínimos
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1 });
  const axA = 0.55 + 0.45 * live(S, 'plane-intro', 'plane-fwd', 0.1, 0.1);
  d.text(S.l('número 1 del código →', 'code number 1 →'), r.x + r.w - 6 * k, r.y + r.h - 6 * k, { size: fz(S, 12), weight: 600, color: p.mute, align: 'right', base: 'bottom', a: axA });
  d.text(S.l('↑ número 2', '↑ number 2'), r.x + 6 * k, r.y + 6 * k, { size: fz(S, 12), weight: 600, color: p.mute, base: 'top', a: axA });

  // ── los datos ──
  const gen = S.on('plane-start');
  if (!gen) {
    const t = T * fr(S, 'plane-fwd', 0.1, 0.8, 'lin'), a = signalShare(t), sa = Math.sqrt(a), sn = Math.sqrt(1 - a);
    const xy = t > 0 ? Float32Array.from(CODES, (v, i) => sa * v + sn * DATA_EPS[i]) : CODES;
    dots(S, plot, xy, NCODES, 1.9, lat.c, 0.8 * fr(S, 'plane-intro', 0.12, 0.5));
  } else {
    const blobOut = 1 - fr(S, 'plane-start', 0, 0.25);
    if (blobOut > 0.01) dots(S, plot, Float32Array.from(CODES, (v, i) => Math.sqrt(signalShare(T)) * v + Math.sqrt(1 - signalShare(T)) * DATA_EPS[i]), NCODES, 1.9, lat.c, 0.8 * blobOut);
    let ghost = 0.2 * fr(S, 'plane-start', 0.15, 0.4);
    if (S.between('plane-match', 'hint-two')) ghost = lerp(0.2, 0.38, fr(S, 'plane-match', 0.15, 0.35));
    if (S.on('scale-demo')) ghost = 0.16;
    dots(S, plot, CODES, NCODES, 1.6, lat.c, ghost);
    if (S.on('scale-demo')) dots(S, plot, CODES, NCODES, 1.9, lat.c, 0.55 * fr(S, 'scale-demo', 0, 0.12), SEVENS_IDX);
  }
  // los grupos
  if (S.between('plane-groups', 'plane-fwd')) {
    ([[0, S.l('ceros', 'zeros'), 0.28], [4, S.l('cuatros', 'fours'), 0.42], [7, S.l('sietes', 'sevens'), 0.56]] as const).forEach(([g, t, at]) => {
      const a = fr(S, 'plane-groups', at, at + 0.08), [mx, my] = MEANS[g];
      if (a > 0.01) d.tag(t, plot.X(mx), plot.Y(my) - 18 * k, { size: fz(S, 12), color: lat.ink, fill: p.surface, stroke: lat.c, a });
    });
  }

  // ── los puntos nuevos ──
  if (gen && !S.on('scale-demo')) {
    const j = unc(), tr = j.traj;
    let pts: Float32Array | null = null, kNow = 0, fade = 1;
    if (S.on('hint-two')) { pts = tr[STAR_K] ?? null; fade = 0.3; }
    else if (S.on('plane-match')) pts = tr[T] ?? null;
    else { const kf = clamp(revK(S), 0, T), k0 = Math.floor(kf); kNow = k0; if (tr[k0]) pts = lerpPts(tr[k0], tr[Math.min(T, k0 + 1)] ?? tr[k0], kf - k0); }
    const pa = fr(S, 'plane-start', 0.3, 0.55) * fade;
    if (pts) {
      dots(S, plot, pts, DEMO.nPts, 2.6, p.ink, pa);
      // flechas: hacia dónde irá cada punto en este paso (solo mientras se recorre el regreso)
      const arrA = S.between('plane-arrows', 'plane-match') ? fr(S, 'plane-arrows', 0.3, 0.5) : 0;
      if (arrA > 0.01 && kNow < T) {
        const i = T - 1 - kNow, sg = tone(S, 'sig');
        const mv = SUB.map((q) => latMove(pts![2 * q], pts![2 * q + 1], i, NULL, 0));
        const mags = mv.map((m) => Math.hypot(m[0], m[1])).sort((a, b) => a - b), ref = Math.max(1e-6, mags[Math.floor(mags.length * 0.8)]);
        const sc = ARROW / ref;   // se agrandan para que se vean: lo que importa es la dirección (y cuáles se mueven más)
        d.withAlpha(arrA, () => d.clip(r.x, r.y, r.w, r.h, () => SUB.forEach((q, n) => {
          const x = pts![2 * q], y = pts![2 * q + 1], m = mv[n], L = Math.min(ARROW * 1.5, Math.hypot(m[0], m[1]) * sc), ang = Math.atan2(m[1], m[0]);
          if (L * r.w / (XR[1] - XR[0]) < 4) return;
          d.arrow(plot.X(x), plot.Y(y), plot.X(x + L * Math.cos(ang)), plot.Y(y + L * Math.sin(ang)), sg.c, 1.6, 6);
        })));
      }
      // los seis puntos que se decodifican
      const ra = S.between('plane-decode', 'hint-two') ? fr(S, 'plane-decode', 0.2, 0.35) * (1 - fr(S, 'hint-q', 0.6, 0.75)) : 0;
      if (ra > 0.01) sixPoints().forEach((q, n) => {
        const px = plot.X(pts![2 * q]), py = plot.Y(pts![2 * q + 1]);
        d.circle(px, py, 8 * k, { stroke: p.ink, lw: 2, a: ra });
        d.text(String(n + 1), px + 9 * k, py - 9 * k, { size: fz(S, 12), weight: 800, font: 'mono', color: p.ink, halo: p.stage, base: 'bottom', a: ra });
      });
    }
  }
  // ── el punto de las dos flechas ──
  if (S.between('hint-two', 'scale-demo')) drawStar(S, plot);

  // ── guiado: la nube con la pista «siete» ──
  if (S.on('scale-demo')) {
    const pts = guidedPts(S), ga = fr(S, 'scale-demo', 0, 0.1);
    if (pts) dots(S, plot, pts, DEMO.nPts, 2.6, p.ink, ga);
    const { s, k: kk2 } = scaleView(S);
    const un = S.on('trade') && kk2 >= T ? uncovered(s) : null;
    if (un) { const ua = S.touched.has('scale') ? 1 : fr(S, 'trade', 0.25, 0.4), er = tone(S, 'err'); un.forEach((i) => d.circle(plot.X(CODES[2 * i]), plot.Y(CODES[2 * i + 1]), 5 * k, { stroke: er.c, lw: 1.8, a: ua })); }
  }

  drawPanel(S, A, k);
}

function drawStar(S: Frame, plot: Plot) {
  const { d, pal: p } = S, k = kk(S), st = starPoint(), r = plot.r;
  const g: [number, number] = [st.u[0] + 3 * (st.c[0] - st.u[0]), st.u[1] + 3 * (st.c[1] - st.u[1])];
  const scale = 1.25 / Math.max(1e-6, Math.hypot(st.u[0], st.u[1]), Math.hypot(st.c[0], st.c[1]));   // las dos flechas se ven; la guiada mide lo que le toque
  const X = (dx: number) => plot.X(st.x + dx * scale), Y = (dy: number) => plot.Y(st.y + dy * scale), px = plot.X(st.x), py = plot.Y(st.y);
  const a1 = fr(S, 'hint-two', 0.25, 0.4), a2 = fr(S, 'hint-two', 0.5, 0.65), a3 = fr(S, 'hint-amp', 0.15, 0.3), a4 = fr(S, 'hint-amp', 0.5, 0.65);
  d.circle(px, py, 6 * k, { fill: p.ink, stroke: p.stage, lw: 2, a: fr(S, 'hint-two', 0.05, 0.2) });
  d.circle(px, py, 11 * k, { stroke: p.ink, lw: 1.5, a: fr(S, 'hint-two', 0.05, 0.2) });
  d.clip(r.x, r.y, r.w, r.h, () => {
    if (a1 > 0.01) { d.line(px, py, X(st.u[0]), Y(st.u[1]), p.ink2, 2, [5, 4], a1); d.arrow(lerp(px, X(st.u[0]), 0.9), lerp(py, Y(st.u[1]), 0.9), X(st.u[0]), Y(st.u[1]), p.ink2, 2, 9, a1); }
    if (a2 > 0.01) d.arrow(px, py, X(st.c[0]), Y(st.c[1]), tone(S, 'lat').c, 2.4, 9, a2);
    if (a3 > 0.01) d.line(X(st.u[0]), Y(st.u[1]), X(st.c[0]), Y(st.c[1]), tone(S, 'err').c, 2, [2, 3], a3);
    if (a4 > 0.01) d.arrow(px, py, X(g[0]), Y(g[1]), tone(S, 'w').c, 4.5, 13, a4);
  });
  if (a4 > 0.01) d.text('× 3', X(g[0]) + 8 * k, Y(g[1]), { size: fz(S, 13), weight: 800, color: tone(S, 'w').ink, base: 'middle', halo: p.stage, a: a4 });
  // dónde están los sietes
  const [mx, my] = MEANS[7], la = fr(S, 'hint-two', 0.5, 0.65);
  d.tag(S.l('sietes', 'sevens'), plot.X(mx), plot.Y(my) - 16 * k, { size: fz(S, 12), color: tone(S, 'lat').ink, fill: p.surface, stroke: tone(S, 'lat').c, a: la });
}

// ═════════ el panel ═════════
/** Pila de textos y piezas en el panel lateral (o de abajo, en teléfono). */
function drawPanel(S: Frame, A: Rect, k: number) {
  const { d, pal: p } = S, cx = A.x + A.w / 2, P = S.portrait, lat = tone(S, 'lat');
  const seg = (a: string, b?: string) => live(S, a, b, 0.12, 0.1);
  let y = A.y + (P ? 2 * k : Math.max(4 * k, A.h * 0.12));
  const line = (t: string, a: number, o: { size?: number; weight?: number; color?: string } = {}) => {
    if (a <= 0.01) return; const h = label(S, t, cx, y, A.w, { size: o.size ?? 13, weight: o.weight ?? 700, color: o.color, a }).h; y += h + 6 * k;
  };
  const yTop = y;
  // la nube de datos
  const a1 = seg('plane-intro', 'plane-fwd');
  if (a1 > 0.01) {
    line(S.l('1 500 dígitos de entrenamiento', '1,500 training digits'), a1 * fr(S, 'plane-intro', 0.3, 0.45), { size: 14, weight: 800, color: p.ink });
    line(S.l('cada punto: su código de dos números en el VAE de la lección 15', 'each point: its two-number code in lesson 15’s VAE'), a1 * fr(S, 'plane-intro', 0.5, 0.65), { size: 12, weight: 600 });
    line(S.l('la forma de la nube es la distribución', 'the shape of the cloud is the distribution'), a1 * fr(S, 'plane-groups', 0.7, 0.85), { size: 12, weight: 700, color: lat.ink });
  }
  // proceso hacia delante en el plano
  const a2 = seg('plane-fwd', 'plane-start');
  if (a2 > 0.01) {
    y = yTop; const t = Math.round(T * fr(S, 'plane-fwd', 0.1, 0.8, 'lin'));
    line(S.l(`paso ${t} de ${T}`, `step ${t} of ${T}`), a2, { size: 15, weight: 800, color: p.ink });
    const bw = Math.min(A.w, 260 * k); y += mixBar(S, cx - bw / 2, y, bw, signalShare(t), { a: a2 }) + 4 * k;
  }
  // el regreso
  const a3 = seg('plane-start', 'plane-match');
  if (a3 > 0.01) {
    y = yTop;
    const kNow = Math.round(clamp(revK(S), 0, T));
    if (S.on('plane-rev-demo')) line(S.l(`regreso: paso ${kNow} de ${T}`, `way back: step ${kNow} of ${T}`), a3, { size: 15, weight: 800, color: p.ink });
    else line(S.l('200 puntos de estática', '200 points of static'), a3 * fr(S, 'plane-start', 0.3, 0.45), { size: 15, weight: 800, color: p.ink });
    if (!S.on('plane-arrows')) line(S.l('ninguno es un dato', 'none is a data point'), a3 * fr(S, 'plane-start', 0.6, 0.75), { size: 12, weight: 600 });
    const aa = (S.on('plane-arrows') ? fr(S, 'plane-arrows', 0.3, 0.5) : 0) * (kNow < T ? 1 : 0);
    if (aa > 0.01) {
      const sg = tone(S, 'sig'), lw = 34 * k, tw = Math.min(A.w - lw - 8 * k, 260 * k), x0 = cx - (lw + 8 * k + tw) / 2;
      d.arrow(x0, y + 9 * k, x0 + lw, y + 9 * k, sg.c, 1.8, 7, aa);
      const h = S.d.text(S.l('hacia dónde irá en este paso', 'where it goes in this step'), x0 + lw + 8 * k, y, { size: fz(S, 12), weight: 700, color: sg.ink, base: 'top', w: tw, a: aa }).h;
      y += Math.max(h, 18 * k) + 4 * k;
      line(S.l('(flechas agrandadas para que se vean)', '(arrows enlarged so you can see them)'), aa, { size: 12, weight: 500 });
    }
  }
  // al final
  const a4 = seg('plane-match', 'plane-decode');
  if (a4 > 0.01) {
    y = yTop;
    line(S.l('en tenue: los 1 500 datos', 'faint: the 1,500 data points'), a4 * fr(S, 'plane-match', 0.2, 0.35), { size: 13, color: lat.ink });
    line(S.l('200 puntos nuevos, ninguno es copia', '200 new points, none is a copy'), a4 * fr(S, 'plane-match', 0.5, 0.65), { size: 13, weight: 800, color: p.ink });
  }
  // decodificar seis puntos
  const a5 = seg('plane-decode', 'hint-q');
  if (a5 > 0.01) {
    y = yTop; const six = sixPoints(), q = unc().traj[T];
    line(S.l('dibujados por el decodificador del VAE', 'drawn by the VAE’s decoder'), a5 * fr(S, 'plane-decode', 0.15, 0.3), { size: 12, weight: 700 });
    if (q) thumbs(S, A, y, six.map((i) => vaeDec(q[2 * i], q[2 * i + 1])), (n) => String(n + 1), a5, (n) => fr(S, 'plane-decode', 0.3 + n * 0.07, 0.4 + n * 0.07));
  }
  // la pista: tercera entrada
  const a6 = seg('hint-q', 'hint-train');
  if (a6 > 0.01) { y = yTop; inputs(S, A, y, a6); }
  // al entrenar se oculta la etiqueta 15 de cada 100 veces
  const a7 = seg('hint-train', 'hint-two');
  if (a7 > 0.01) { y = yTop; hidden(S, A, y, a7); }
  // dos flechas y su diferencia exagerada
  const a8 = seg('hint-two', 'scale-demo');
  if (a8 > 0.01) {
    y = yTop;
    const row = (t: string, a: number, kind: 'dash' | 'solid' | 'diff' | 'thick', color: string) => {
      if (a <= 0.01) return; const lw = 34 * k, tw = Math.min(A.w - lw - 10 * k, 240 * k), x0 = cx - (lw + 10 * k + tw) / 2, yy = y + 9 * k;
      d.withAlpha(a, () => {
        if (kind === 'dash') d.line(x0, yy, x0 + lw, yy, color, 2, [5, 4]); else if (kind === 'diff') d.line(x0, yy, x0 + lw, yy, color, 2, [2, 3]);
        else d.arrow(x0, yy, x0 + lw, yy, color, kind === 'thick' ? 4.5 : 2.4, kind === 'thick' ? 12 : 9);
      });
      const h = d.text(t, x0 + lw + 10 * k, y, { size: fz(S, 12), weight: 700, color, base: 'top', w: tw, a }).h; y += Math.max(h, 18 * k) + 6 * k;
    };
    row(S.l('sin pista', 'no hint'), a8 * fr(S, 'hint-two', 0.25, 0.4), 'dash', p.ink2);
    row(S.l('con la pista «siete»', 'with the hint “seven”'), a8 * fr(S, 'hint-two', 0.5, 0.65), 'solid', lat.ink);
    row(S.l('diferencia: apunta a los sietes', 'difference: points to the sevens'), a8 * fr(S, 'hint-amp', 0.15, 0.3), 'diff', tone(S, 'err').ink);
    row(S.l('guiada: la diferencia × 3', 'guided: the difference × 3'), a8 * fr(S, 'hint-amp', 0.5, 0.65), 'thick', tone(S, 'w').ink);
    const fa = a8 * fr(S, 'cfg-name', 0.3, 0.45);
    if (fa > 0.01) { y += 4 * k; line(S.l('guiada = sin pista + escala × (con pista − sin pista)', 'guided = no hint + scale × (with hint − no hint)'), fa, { size: 12, weight: 700, color: p.ink }); }
  }
  // la escala
  const a9 = live(S, 'scale-demo', undefined, 0.1);
  if (a9 > 0.01) {
    y = yTop;
    const { s, k: kk2 } = scaleView(S), done = kk2 >= T, c7 = done ? sevensCount(s) : null;
    line(S.l(`escala de guiado: ${S.n(s, 1)}`, `guidance scale: ${S.n(s, 1)}`), a9, { size: 15, weight: 800, color: tone(S, 'w').ink });
    line(c7 === null ? S.l('generando…', 'generating…') : S.l(`se leen como siete: ${c7} de ${DEMO.nPts}`, `read as a seven: ${c7} of ${DEMO.nPts}`), a9, { size: 13, weight: 700, color: p.ink });
    const pts = guidedPts(S);
    if (pts) thumbs(S, A, y, [0, 1, 2, 3, 4, 5].map((i) => vaeDec(pts[2 * i], pts[2 * i + 1])), () => '', a9, () => 1);
    if (S.on('trade')) {
      const un = done ? uncovered(s) : null, ta = S.touched.has('scale') ? 1 : fr(S, 'trade', 0.25, 0.4);
      y = thumbsBottom + 8 * k;
      if (un) line(S.l(`sietes reales sin ningún punto cerca: ${un.length} de ${SEVENS_IDX.length}`, `real sevens with no point nearby: ${un.length} of ${SEVENS_IDX.length}`), a9 * ta, { size: 12, weight: 700, color: tone(S, 'err').ink });
    }
  }
}

let thumbsBottom = 0;
/** Fila de miniaturas decodificadas (hasta seis), con número opcional encima. */
function thumbs(S: Frame, A: Rect, y: number, ims: Float32Array[], tag: (n: number) => string, a: number, each: (n: number) => number) {
  const k = kk(S), n = ims.length, gap = 8 * k, hasTag = tag(0) !== '', tagH = hasTag ? fz(S, 12) * S.u + 4 * k : 0;
  const cell = cellFor(Math.min((A.w - (n - 1) * gap) / n, A.y + A.h - y - tagH - 4 * k, 56 * k), 7), tw = cell * 8, x0 = A.x + (A.w - (n * tw + (n - 1) * gap)) / 2;
  ims.forEach((im, i) => {
    const e = each(i) * a, x = x0 + i * (tw + gap);
    if (e <= 0.01) return;
    if (hasTag) S.d.text(tag(i), x + tw / 2, y, { size: fz(S, 12), weight: 800, font: 'mono', color: S.pal.ink, align: 'center', base: 'top', a: e });
    pix(S, x, y + tagH, im, cell, { a: e, kind: 'model' });
  });
  thumbsBottom = y + tagH + tw;
}

/** Las tres entradas de la red: punto con ruido, paso y etiqueta (la tercera, la pista). */
function inputs(S: Frame, A: Rect, y: number, a: number) {
  const { d, pal: p } = S, k = kk(S), cx = A.x + A.w / 2, P = S.portrait;
  const items = [S.l('punto con ruido', 'noisy point'), S.l('paso', 'step'), S.l('etiqueta: siete', 'label: seven')];
  const ch = 26 * k, gap = 6 * k, cw = Math.min(A.w * (P ? 0.5 : 0.62), 190 * k), bx = P ? A.x + A.w * 0.56 : cx - cw / 2;
  const x0 = P ? A.x : cx - cw / 2, red: Rect = P ? { x: A.x + A.w - Math.min(90 * k, A.w * 0.3), y, w: Math.min(90 * k, A.w * 0.3), h: 3 * ch + 2 * gap } : { x: cx - 50 * k, y: y + 3 * (ch + gap) + 22 * k, w: 100 * k, h: 34 * k };
  items.forEach((t, i) => {
    const e = i < 2 ? a : a * fr(S, 'hint-q', 0.55, 0.7), hot = i === 2, tn = tone(S, hot ? 'lat' : 'ink'), yy = y + i * (ch + gap), w = P ? Math.min(cw, red.x - x0 - 22 * k) : cw;
    d.withAlpha(e, () => {
      d.rect(x0, yy, w, ch, { fill: hot ? tn.soft : p.surface, stroke: hot ? tn.c : p.lineStrong, lw: hot ? 2 : 1.2, r: 3 });
      d.text(t, x0 + w / 2, yy + ch / 2, { size: fit12(S, t, w - 8 * k), weight: hot ? 800 : 600, color: hot ? tn.ink : p.ink2, align: 'center', base: 'middle' });
      if (P) d.arrow(x0 + w + 4 * k, yy + ch / 2, red.x - 4 * k, red.y + red.h / 2, p.mute, 1.5, 7);
    });
  });
  if (!P) d.withAlpha(a, () => d.arrow(cx, y + 3 * (ch + gap) - gap + 4 * k, cx, red.y - 4 * k, p.mute, 1.5, 7));
  d.withAlpha(a, () => { d.rect(red.x, red.y, red.w, red.h, { fill: alpha(tone(S, 'w').c, 0.12), stroke: tone(S, 'w').c, lw: 1.5, r: 3 }); d.text(S.l('red', 'network'), red.x + red.w / 2, red.y + red.h / 2, { size: fz(S, 14), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'middle' }); });
  void bx;
}
const fit12 = (S: Frame, t: string, w: number) => { let s = fz(S, 13); while (s > 12 / S.u && S.d.measure(t, { size: s, weight: 700 }) > w) s -= 0.5; return s; };

/** Veinte ejemplos de entrenamiento: tres (15 de cada 100) llegan sin etiqueta. */
function hidden(S: Frame, A: Rect, y: number, a: number) {
  const { d, pal: p } = S, k = kk(S), n = 20, HID = [4, 11, 17], cols = S.portrait || A.w < 300 * k ? 10 : 5, rows = n / cols;
  const gap = 5 * k, cw = Math.min(30 * k, (A.w - (cols - 1) * gap) / cols), ch = cw, x0 = A.x + (A.w - (cols * cw + (cols - 1) * gap)) / 2;
  const labels = [7, 3, 0, 8, -1, 1, 5, 9, 2, 6, 4, -1, 7, 0, 3, 8, 2, -1, 5, 9];
  for (let i = 0; i < n; i++) {
    const e = a * fr(S, 'hint-train', 0.15 + i * 0.012, 0.22 + i * 0.012), x = x0 + (i % cols) * (cw + gap), yy = y + Math.floor(i / cols) * (ch + gap), hid = HID.includes(i);
    const lt = tone(S, 'lat');
    d.withAlpha(e, () => {
      d.rect(x, yy, cw, ch, { fill: hid ? p.surface : lt.soft, stroke: hid ? p.lineStrong : lt.c, lw: 1.2, r: 3, dash: hid ? [3, 2] : undefined });
      d.text(hid ? '—' : String(labels[i]), x + cw / 2, yy + ch / 2, { size: fz(S, 13), weight: 800, font: 'mono', color: hid ? p.mute : lt.ink, align: 'center', base: 'middle' });
    });
  }
  label(S, S.l('sin etiqueta: 15 de cada 100', 'no label: 15 out of 100'), A.x + A.w / 2, y + rows * (ch + gap) + 6 * k, A.w, { size: 13, weight: 800, color: p.ink, a: a * fr(S, 'hint-train', 0.55, 0.7) });
}
