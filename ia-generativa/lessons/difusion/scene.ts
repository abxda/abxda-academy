// Escena: Difusión. El proceso directo sobre una imagen en píxeles y sobre dos lunas de puntos (todo calculado),
// el muestreo inverso con un modelo REAL entrenado offline (denoiser.json), el guiado sin clasificador y la difusión latente.
import {
  Plot, alpha, badge, box, clamp, gauss, lerp, link, neu, regions, rng, tone, type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { DATA, T, abar, sample, stats } from './diff';

// ── imagen de juguete (16×16) y su ruido fijo ─────────────────────────────
const N = 16;
const IMG: number[][] = Array.from({ length: N }, () => new Array(N).fill(0.15));
for (let r = 8; r <= 14; r++) for (let c = 4; c <= 11; c++) IMG[r][c] = 0.75;
for (let r = 3; r <= 7; r++) for (let c = 8 - (r - 3) - 1; c <= 8 + (r - 3); c++) IMG[r][c] = 0.9;
for (let r = 11; r <= 14; r++) { IMG[r][7] = 0.3; IMG[r][8] = 0.3; }
IMG[10][10] = 0.35; IMG[10][5] = 0.35;
const EPS_IMG = (() => { const r = rng(5); return Array.from({ length: N }, () => Array.from({ length: N }, () => gauss(r))); })();
const EPS_PTS = (() => { const r = rng(9); return Float32Array.from({ length: DATA.x.length }, () => gauss(r)); })();

interface Run { cls: number; w: number; fid: number; sd: number; ref: number }
interface St { k: number; run: boolean; acc: number; traj?: Float32Array[]; seed: number; stoch?: Float32Array[]; gen?: { pts: Float32Array; cls: number; w: number }; runs: Run[]; lastGen: number; lastReseed: number; lastStep: number; lastRun: number }
const stNew = (): St => ({ k: 0, run: false, acc: 0, seed: 100, runs: [], lastGen: 0, lastReseed: 0, lastStep: 0, lastRun: 0 });
const stOf = (S: Frame): St => (S.st.s ??= stNew());

const scene: SceneFactory = () => ({
  controls: [
    { id: 'tt', kind: 'slider', label: { es: 'Paso de ruido t', en: 'Noise step t' }, min: 0, max: T, step: 1, value: 0, from: 'try1', to: 'reverse', fmt: (v) => `${v} / ${T}` },
    { id: 'step1', kind: 'button', label: { es: 'Un paso', en: 'One step' }, from: 'try2', to: 'stoch' },
    { id: 'run', kind: 'button', primary: true, label: { es: 'Reproducir', en: 'Play' }, from: 'try2', to: 'stoch' },
    { id: 'reseed', kind: 'button', label: { es: 'Nuevo ruido', en: 'New noise' }, from: 'try2', to: 'stoch' },
    { id: 'cls', kind: 'choice', label: { es: 'Luna', en: 'Moon' }, value: '0', from: 'guide', to: 'latent', options: [{ value: '0', label: { es: 'Arriba', en: 'Upper' } }, { value: '1', label: { es: 'Abajo', en: 'Lower' } }] },
    { id: 'w', kind: 'slider', label: { es: 'Guiado w', en: 'Guidance w' }, min: 0, max: 5, step: 0.5, value: 0, from: 'guide', to: 'latent', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
    { id: 'gen', kind: 'button', primary: true, label: { es: 'Generar', en: 'Generate' }, from: 'guide', to: 'latent' },
  ],
  init(S) { S.st.s = stNew(); },

  action(S, id) {
    const st = stOf(S);
    if (id === 'step1') { ensureTraj(st); st.k = Math.min(T, Math.floor(st.k) + 1); st.run = false; }
    else if (id === 'run') { ensureTraj(st); if (st.k >= T) st.k = 0; st.run = true; }
    else if (id === 'reseed') { st.seed += 17; st.traj = undefined; st.k = 0; st.run = false; ensureTraj(st); }
    else if (id === 'gen') {
      const cls = +(S.p.cls ?? '0'), w = S.p.w ?? 0, tr = sample(200, cls, w, 500 + st.runs.length * 13);
      const pts = tr[T], s = stats(pts, cls);
      st.gen = { pts, cls, w }; st.runs.push({ cls, w, fid: s.fidelity, sd: s.variety, ref: s.refVariety });
      if (st.runs.some((a) => st.runs.some((b) => a.cls === b.cls && Math.abs(a.w - b.w) >= 2))) S.complete('guidance');
    }
  },

  update(S) {
    const st = stOf(S);
    if (S.between('try1', 'reverse') && (S.p.tt ?? 0) >= T - 2) S.complete('noise');
    if (S.between('try2', 'stoch')) {
      ensureTraj(st);
      if (st.run) { st.acc += S.dt; st.k = Math.min(T, st.k + S.dt * 7); if (st.k >= T) st.run = false; }
      if (st.k >= T - 0.01) S.complete('reverse');
    }
    if (S.on('stoch') && !st.stoch) st.stoch = [11, 12, 13].map((sd) => sample(160, 2, 0, sd)[T]);
  },

  render(S) {
    const g = groupOf(S), prev = groupOf(S, Math.max(0, S.seg - 1));
    const fade = g !== prev && S.seg > 0 ? clamp(S.segT / 0.5) : 1;
    S.d.withAlpha(fade, () => {
      switch (g) {
        case 'img': return drawImage(S);
        case 'net': return drawNet(S);
        case 'pts': return drawPoints(S);
        case 'latent': return drawLatent(S);
        case 'cost': return drawCost(S);
        case 'limits': return drawLimits(S);
        case 'recap': return drawRecap(S);
        default: return drawBridge(S);
      }
    });
  },
});

function ensureTraj(st: St) { if (!st.traj) st.traj = sample(240, 2, 0, st.seed); }

function groupOf(S: Frame, seg = S.seg) {
  const id = (k: string) => S.segIndex(k);
  if (seg < id('reverse')) return 'img';
  if (seg < id('toy')) return 'net';
  if (seg < id('latent')) return 'pts';
  if (seg === id('latent')) return 'latent';
  if (seg === id('cost')) return 'cost';
  if (seg === id('limits')) return 'limits';
  if (seg === id('recap')) return 'recap';
  return 'bridge';
}

// ═════════ imagen con ruido ═════════
function noisyValue(v: number, e: number, t: number) { const a = t <= 0 ? 1 : abar[Math.min(T, t) - 1]; return clamp((Math.sqrt(a) * (2 * v - 1) + Math.sqrt(1 - a) * e + 1) / 2); }
function drawImage(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.74 : 0.5);
  let t = 0;
  if (S.is('tv')) t = S.at('tv', 0.5, 6.0, 'lin') * T;
  else if (S.is('schedule')) t = T * 0.5;
  else if (S.between('try1', 'reverse')) t = S.p.tt ?? 0;
  const ti = Math.round(t);
  const cs = Math.floor(Math.min(R.main.w / N, R.main.h / N)), x0 = R.main.x + (R.main.w - N * cs) / 2, y0 = R.main.y + (R.main.h - N * cs) / 2;
  d.rect(x0 - 1, y0 - 1, N * cs + 2, N * cs + 2, { stroke: p.lineStrong });
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = Math.round(255 * noisyValue(IMG[r][c], EPS_IMG[r][c], ti)); d.rect(x0 + c * cs, y0 + r * cs, cs, cs, { fill: `rgb(${g},${g},${g})` }); }
  d.text(S.l(`paso t = ${ti} de ${T}`, `step t = ${ti} of ${T}`), x0, y0 - 8 * u, { size: 13, weight: 700, color: p.ink2 });
  // señal y ruido frente al paso
  const a = S.reveal('schedule', 0.2, 0.6);
  const sig = ti <= 0 ? 1 : Math.sqrt(abar[ti - 1]), noi = ti <= 0 ? 0 : Math.sqrt(1 - abar[ti - 1]);
  const plot = new Plot(S, R.aside, { xr: [0, T], yr: [0, 1.05], xLabel: S.l('paso', 'step'), xTicks: [0, 20, 40], yTicks: [0, 0.5, 1], tickFmt: (v) => S.n(v, v % 1 ? 1 : 0), pad: { l: 30, b: 28, t: 6, r: 8 } });
  d.withAlpha(Math.max(a, S.on('tv') ? 0.6 : 0), () => {
    plot.axes();
    plot.curve((x) => (x <= 0 ? 1 : Math.sqrt(abar[Math.min(T, Math.round(x)) - 1])), 'dat', 2.5); plot.curve((x) => (x <= 0 ? 0 : Math.sqrt(1 - abar[Math.min(T, Math.round(x)) - 1])), 'err', 2.5);
    plot.dot(ti, sig, 4.5, 'dat'); plot.dot(ti, noi, 4.5, 'err');
    d.text(S.l('señal', 'signal'), plot.X(3), plot.Y(0.9), { size: 12, weight: 800, color: tone(S, 'dat').ink, halo: p.stage });
    d.text(S.l('ruido', 'noise'), plot.X(T - 2), plot.Y(0.96), { size: 12, weight: 800, color: tone(S, 'err').ink, align: 'right', halo: p.stage });
    d.text(S.l(`señal restante: ${S.n(sig * 100, 0)} %`, `signal left: ${S.n(sig * 100, 0)}%`), R.aside.x + 2, R.aside.y + R.aside.h + (S.portrait ? -2 : 16 * u), { size: 12, weight: 700, color: p.ink2, base: S.portrait ? 'bottom' : 'alphabetic' });
  });
}

// ═════════ la red predice el ruido (esquema) ═════════
function drawNet(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const ti = 22, cs = Math.floor(Math.min(R.w * (S.portrait ? 0.5 : 0.22), S.portrait ? (R.h - 160 * u) / 2 : R.h * 0.5) / N), bw = N * cs;
  const miniNoisy = (x: number, y: number, kind: 'noisy' | 'noise') => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const g = Math.round(255 * (kind === 'noisy' ? noisyValue(IMG[r][c], EPS_IMG[r][c], ti) : clamp(EPS_IMG[r][c] * 0.25 + 0.5))); d.rect(x + c * cs, y + r * cs, cs, cs, { fill: `rgb(${g},${g},${g})` }); } d.rect(x - 1, y - 1, bw + 2, bw + 2, { stroke: p.lineStrong }); };
  const y = R.y + R.h * 0.18;
  const pos = (k: number) => S.portrait ? { x: R.x + (R.w - bw) / 2, y: R.y + 6 * u + (k === 0 ? 0 : k === 1 ? bw + 30 * u : bw + 30 * u + 54 * u) } : { x: k === 0 ? R.x + R.w * 0.04 : k === 2 ? R.x + R.w * 0.96 - bw : R.x + R.w / 2 - 36 * u, y };
  const a1 = S.reveal('reverse', 0.2, 0.6);
  d.withAlpha(a1, () => { const q = pos(0); miniNoisy(q.x, q.y, 'noisy'); d.text(S.l('imagen ruidosa xₜ', 'noisy image xₜ'), q.x, q.y + bw + 16 * u, { size: 12, weight: 700, color: p.ink2 }); });
  const a2 = S.reveal('reverse', 1.0, 0.6);
  d.withAlpha(a2, () => { const q = pos(1); box(S, S.portrait ? { x: q.x, y: q.y, w: bw, h: 36 * u } : { x: q.x, y: y + bw / 2 - 30 * u, w: 72 * u, h: 60 * u }, S.l('red', 'network'), { tone: 'w', size: 15 }); });
  const a3 = S.reveal('reverse', 1.9, 0.6);
  d.withAlpha(a3, () => { const q = pos(2); miniNoisy(q.x, q.y, 'noise'); d.text(S.l('ruido predicho ε̂', 'predicted noise ε̂'), q.x, q.y + bw + 16 * u, { size: 12, weight: 700, color: tone(S, 'err').ink }); });
  if (S.is('train')) {
    const k = S.reveal('train', 0.4, 0.8);
    d.withAlpha(k, () => {
      d.text('pérdida = ‖ε − ε̂‖²'.replace('pérdida', S.l('pérdida', 'loss')), R.x + R.w / 2, R.y + R.h - 30 * u, { size: S.portrait ? 18 : 22, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'center' });
      d.text(S.l('(ε = el ruido real que se añadió)', '(ε = the real noise that was added)'), R.x + R.w / 2, R.y + R.h - 8 * u, { size: 12, weight: 600, color: p.ink2, align: 'center' });
    });
  }
  if (S.is('sample')) {
    const k = S.reveal('sample', 0.3, 0.6), n = Math.floor(S.at('sample', 0.8, 6.0, 'lin') * T);
    d.withAlpha(k, () => {
      d.text(S.l(`paso ${T - n} → ${Math.max(0, T - n - 1)}: restar un poco de ruido`, `step ${T - n} → ${Math.max(0, T - n - 1)}: subtract a little noise`), R.x + R.w / 2, R.y + R.h - 34 * u, { size: 15, weight: 800, color: p.ink, align: 'center', w: R.w - 16 * u });
      d.text('xₜ₋₁ = f(xₜ, ε̂) + ruido', R.x + R.w / 2, R.y + R.h - 10 * u, { size: 13, font: 'mono', color: p.ink2, align: 'center' });
    });
  }
  void link; void alpha;
}

// ═════════ puntos: lunas, proceso directo, muestreo inverso, guiado ═════════
function drawPoints(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.76 : 0.62), st = stOf(S);
  const side = Math.min(R.main.w, R.main.h), outer = { x: R.main.x + (R.main.w - side) / 2, y: R.main.y + (R.main.h - side) / 2, w: side, h: side };
  const plot = new Plot(S, outer, { xr: [-3.4, 3.4], yr: [-3.4, 3.4], xTicks: [-2, 0, 2], yTicks: [-2, 0, 2], tickFmt: (v) => String(v), pad: { l: 26, b: 22, t: 8, r: 8 } });
  plot.axes(S.reveal('toy', 0, 0.5));
  const dot = (x: number, y: number, tn: 'ink' | 'dat' | 'err' | 'sig' | 'w' | 'lat', r = 3, a = 0.9) => plot.dot(x, y, r, tn, { a });
  const n = DATA.y.length;
  const cls = (i: number) => DATA.y[i];
  if (S.is('toy')) { const k = S.reveal('toy', 0.2, 1.0); for (let i = 0; i < n; i++) dot(DATA.x[2 * i], DATA.x[2 * i + 1], 'ink', 3 * k, 0.8 * k); }
  else if (S.is('toy-fwd')) {
    const t = Math.round(S.at('toy-fwd', 0.6, 6.0, 'lin') * T), a = t <= 0 ? 1 : abar[t - 1];
    for (let i = 0; i < n; i++) dot(Math.sqrt(a) * DATA.x[2 * i] + Math.sqrt(1 - a) * EPS_PTS[2 * i], Math.sqrt(a) * DATA.x[2 * i + 1] + Math.sqrt(1 - a) * EPS_PTS[2 * i + 1], 'ink');
    d.text(S.l(`paso ${t} de ${T}`, `step ${t} of ${T}`), plot.r.x + 6, plot.r.y + 6, { size: 13, weight: 700, color: p.ink2, base: 'top' });
    d.text('xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε', R.aside.x, R.aside.y + 6, { size: 14, font: 'mono', weight: 700, color: p.ink2 });
  } else if (S.between('try2', 'stoch')) {
    ensureTraj(st);
    const k = Math.floor(st.k), tr = st.traj![k], m = tr.length / 2, f = st.k - k, nx = st.traj![Math.min(T, k + 1)];
    for (let i = 0; i < m; i++) dot(lerp(tr[2 * i], nx[2 * i], f), lerp(tr[2 * i + 1], nx[2 * i + 1], f), 'sig', 3);
    d.text(S.l(`paso inverso ${Math.round(st.k)} de ${T}`, `reverse step ${Math.round(st.k)} of ${T}`), plot.r.x + 6, plot.r.y + 6, { size: 13, weight: 700, color: p.ink2, base: 'top' });
    d.withAlpha(clamp((st.k - T + 4) / 3), () => badge(S, S.l('modelo real, entrenado para esto', 'a real model, trained for this'), plot.X(0), plot.Y(-2.9), { tone: 'dat', size: 11 }));
  } else if (S.is('stoch')) {
    const sets = st.stoch; if (sets) (['sig', 'w', 'lat'] as const).forEach((tn, si) => { const s = sets[si]; for (let i = 0; i < s.length / 2; i++) dot(s[2 * i], s[2 * i + 1], tn, 3, 0.8); });
    d.withAlpha(S.reveal('stoch', 0.8, 0.6), () => (['sig', 'w', 'lat'] as const).forEach((tn, si) => badge(S, S.l(`ruido ${si + 1}`, `noise ${si + 1}`), R.aside.x + 36 * u, R.aside.y + 10 * u + si * 28 * u, { tone: tn, size: 11 })));
  } else if (S.is('guide')) {
    for (let i = 0; i < n; i++) plot.datum(DATA.x[2 * i], DATA.x[2 * i + 1], cls(i) === 0 ? 0 : 1, { r: 3.4, a: 0.85 * S.reveal('guide', 0.2, 0.8) });
    d.withAlpha(S.reveal('guide', 1.0, 0.6), () => d.text('ε̂ = ε∅ + s·(ε_c − ε∅)', R.aside.x, R.aside.y + 8, { size: 15, font: 'mono', weight: 700, color: p.ink }));
    d.withAlpha(S.reveal('guide', 1.8, 0.6), () => d.text(S.l('s = 1 + w · más w, más fidelidad y menos variedad', 's = 1 + w · more w, more fidelity and less variety'), R.aside.x, R.aside.y + 32 * u, { size: 12, weight: 600, color: p.ink2, w: R.aside.w }));
  } else if (S.is('try3')) {
    for (let i = 0; i < n; i++) dot(DATA.x[2 * i], DATA.x[2 * i + 1], 'ink', 2, 0.18);
    const g = st.gen; if (g) for (let i = 0; i < g.pts.length / 2; i++) plot.datum(g.pts[2 * i], g.pts[2 * i + 1], g.cls === 0 ? 0 : 1, { r: 3.2, a: 0.9 });
    const r = R.aside;
    d.text(S.l('generaciones (fidelidad · variedad)', 'generations (fidelity · variety)'), r.x, r.y + 6, { size: 12, weight: 700, color: p.mute });
    st.runs.slice(-4).forEach((q, i) => d.text(`${S.l(q.cls === 0 ? 'arriba' : 'abajo', q.cls === 0 ? 'upper' : 'lower')} · w=${S.n(q.w, 1)}  →  ${S.n(q.fid * 100, 0)} % · ${S.n(q.sd, 2)}`, r.x, r.y + 28 * u + i * 20 * u, { size: 12, font: 'mono', weight: 600, color: p.ink }));
    if (!st.runs.length) d.text(S.l('pulsa «Generar»', 'press “Generate”'), r.x, r.y + 30 * u, { size: 13, weight: 600, color: p.ink2 });
    else d.text(S.l(`variedad de los datos de esa luna: ${S.n(st.runs[st.runs.length - 1].ref, 2)}`, `variety of that moon’s data: ${S.n(st.runs[st.runs.length - 1].ref, 2)}`), r.x, r.y + 28 * u + 4 * 20 * u + 6 * u, { size: 11, color: p.mute, w: r.w });
  }
}

// ═════════ latente, costo, límites ═════════
function drawLatent(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const labels = [S.l('Imagen', 'Image'), S.l('Codificador', 'Encoder'), S.l('Difusión en el latente', 'Diffusion in the latent'), S.l('Decodificador', 'Decoder'), S.l('Imagen', 'Image')];
  const tones = ['ink', 'lat', 'sig', 'lat', 'ink'] as const;
  const bw = S.portrait ? Math.min(R.w - 24 * u, 220 * u) : (R.w - 4 * 26 * u) / 5, bh = (S.portrait ? 46 : 70) * u;
  const pos: Rect[] = labels.map((_, i) => S.portrait ? { x: R.x + (R.w - bw) / 2, y: R.y + 6 * u + i * (bh + 24 * u), w: bw, h: bh } : { x: R.x + i * (bw + 26 * u), y: R.y + R.h / 2 - bh / 2, w: bw, h: bh });
  pos.forEach((b, i) => { const a = S.reveal('latent', 0.2 + i * 0.55, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: S.portrait ? 13 : 12, active: i === 2 ? 0.4 : 0 }); });
  for (let i = 0; i < 4; i++) { const a = S.at('latent', 0.5 + i * 0.55, 0.9 + i * 0.55); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  d.withAlpha(S.at('latent', 3.4, 4.2), () => d.text(S.l('el cómputo baja porque el latente es mucho más pequeño que la imagen', 'compute drops because the latent is much smaller than the image'), R.x + R.w / 2, R.y + R.h - 6 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'bottom', w: R.w - 16 * u }));
}
function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, a = S.reveal('cost', 0.2, 0.8), cx = R.x + R.w / 2;
  d.withAlpha(a, () => {
    d.text(S.l('pasos por imagen', 'steps per image'), cx, R.y + R.h * 0.2, { size: 14, weight: 700, color: p.ink2, align: 'center' });
    const rows = [{ l: S.l('artículo original (2020)', 'original paper (2020)'), v: 1000, tn: 'err' as const }, { l: S.l('en nuestra demostración', 'in our demo'), v: 40, tn: 'sig' as const }];
    rows.forEach((r, i) => { const w = (R.w * 0.7 * Math.sqrt(r.v)) / Math.sqrt(1000), y = R.y + R.h * 0.3 + i * 56 * u; d.rect(cx - R.w * 0.35, y, w, 28 * u, { fill: alpha(tone(S, r.tn).c, 0.5), stroke: tone(S, r.tn).c }); d.text(`${r.v.toLocaleString(S.l('es-MX', 'en-US'))}`, cx - R.w * 0.35 + w + 8 * u, y + 14 * u, { size: 16, weight: 800, font: 'mono', base: 'middle' }); d.text(r.l, cx - R.w * 0.35, y - 6 * u, { size: 12, weight: 600, color: p.ink2 }); });
    d.text(S.l('(la longitud de las barras está en raíz cuadrada)', '(bar length is on a square-root scale)'), cx, R.y + R.h * 0.3 + 130 * u, { size: 11, color: p.mute, align: 'center' });
  });
}
function drawLimits(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const items = [{ es: 'De dónde vienen los datos', en: 'Where the data comes from', tn: 'w' as const }, { es: 'Quién tiene los derechos', en: 'Who holds the rights', tn: 'err' as const }, { es: '¿Real o sintética?', en: 'Real or synthetic?', tn: 'lat' as const }];
  const bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.3, 240 * u), bh = 70 * u;
  items.forEach((it, i) => { const a = S.reveal('limits', 0.2 + i * 0.7, 0.6), x = S.portrait ? R.x + (R.w - bw) / 2 : R.x + i * (R.w - bw) / 2, y = S.portrait ? R.y + 8 * u + i * (bh + 22 * u) : R.y + R.h / 2 - bh / 2; if (a > 0) box(S, { x, y, w: bw, h: bh }, S.l(it.es, it.en), { tone: it.tn, a, size: 14 }); });
  d.withAlpha(S.at('limits', 2.6, 3.4), () => d.text(S.l('preguntas abiertas que hay que responder antes de usarlos', 'open questions to answer before using them'), R.x + R.w / 2, R.y + R.h - 6 * u, { size: 13, weight: 700, color: p.ink2, align: 'center', base: 'bottom' }));
}
function drawRecap(S: Frame) {
  const R = regions(S, 1).all, u = S.u;
  const labels = [S.l('1 · Añadir ruido (fácil)', '1 · Add noise (easy)'), S.l('2 · Aprender a predecir el ruido', '2 · Learn to predict the noise'), S.l('3 · Partir de ruido y quitarlo', '3 · Start from noise and remove it'), S.l('4 · Una etiqueta guía el resultado', '4 · A label steers the result')];
  const tones = ['err', 'w', 'sig', 'dat'] as const, bw = Math.min(S.portrait ? R.w - 24 * u : R.w * 0.46, 280 * u), bh = 56 * u;
  labels.forEach((l, i) => { const a = S.reveal('recap', 0.2 + i * 0.4, 0.5), col = S.portrait ? 0 : i % 2, row = S.portrait ? i : Math.floor(i / 2), x = S.portrait ? R.x + (R.w - bw) / 2 : R.x + R.w / 2 + (col ? 10 * u : -bw - 10 * u), y = R.y + (S.portrait ? 10 * u : R.h * 0.22) + row * (bh + 22 * u); if (a > 0) box(S, { x, y, w: bw, h: bh }, l, { tone: tones[i], a, size: 13 }); });
}
function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => { d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: 13, weight: 700, color: p.mute, align: 'center' }); d.text(S.l('De texto a imagen', 'From text to image'), cx, cy + 82 * u, { size: 24, weight: 800, align: 'center' }); });
}

export default scene;
