// Escena: Generar es aprender una distribución. Datos de juguete en 2D (discriminar vs generar), la distribución de la «tinta» de 1797 dígitos
// con una campana que se ajusta y se sortea, dígitos de 8×8 como puntos de un espacio de 64 números, un autocodificador y un VAE REALES
// (entrenados offline con train_toy.py; aquí solo se ejecutan), el plano latente que se recorre con el puntero, y la comparación del sorteo.
import {
  Plot, alpha, badge, box, clamp, ease, gauss, inset, lerp, link, neu, regions, rng, tone,
  type Frame, type Rect, type SceneFactory, type Tone,
} from '../../../../../theme/kit';
import * as L from './latent';
import { axes, digit, digitBars, digTone, ellipsePts, fs, lut, mark, strip, tileLayout } from './helpers';

// ═════════ datos de la escena (todo determinista) ═════════
const pickHeld = (d: number) => { for (let i = L.NTR; i < L.N_ALL; i++) if (L.LAB[i] === d) return i; return L.NTR; };
const HOOK = [7, 3, 0, 4, 9, 1].map(pickHeld);
const AE_EX = L.SHOW[1];                                    // un «0» reservado: el ejemplo del diagrama del autocodificador
const MED = Array.from({ length: 10 }, (_, k) => {          // mediana de los códigos del AE de cada dígito
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === k) { xs.push(L.CODES_AE.x[i]); ys.push(L.CODES_AE.y[i]); }
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  return [xs[xs.length >> 1], ys[ys.length >> 1]] as [number, number];
});
const MED_VAE = Array.from({ length: 10 }, (_, k) => {
  const xs: number[] = [], ys: number[] = [];
  for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === k) { xs.push(L.CODES_VAE.x[i]); ys.push(L.CODES_VAE.y[i]); }
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  return [xs[xs.length >> 1], ys[ys.length >> 1]] as [number, number];
});
/** Un ejemplo típico de entrenamiento de un dígito: el más cercano a la mediana de su grupo en el plano del AE. */
const typical = (k: number) => { let bi = 0, bd = Infinity; for (let i = 0; i < L.NTR; i++) if (L.LAB[i] === k) { const d = (L.CODES_AE.x[i] - MED[k][0]) ** 2 + (L.CODES_AE.y[i] - MED[k][1]) ** 2; if (d < bd) { bd = d; bi = i; } } return bi; };
const PEEK = [0, 4, 3].map(typical);                       // tres imágenes cuyos puntos se señalan en el mapa

// datos de juguete 2D: dos clases con nubes ovaladas (ilustrativo; generados con rng en esta carpeta)
interface Fit { m: [number, number]; ang: number; s1: number; s2: number }
const TOY = (() => {
  const r = rng(3);
  const mk = (cx: number, cy: number, sx: number, sy: number, ang: number, n: number) => Array.from({ length: n }, () => { const a = gauss(r) * sx, b = gauss(r) * sy; return [cx + a * Math.cos(ang) - b * Math.sin(ang), cy + a * Math.sin(ang) + b * Math.cos(ang)] as [number, number]; });
  const A = mk(-1.25, 0.65, 0.7, 0.4, 0.5, 34), B = mk(1.2, -0.55, 0.62, 0.42, -0.45, 34);
  const fit = (P: [number, number][]): Fit => {
    const n = P.length, mx = P.reduce((a, q) => a + q[0], 0) / n, my = P.reduce((a, q) => a + q[1], 0) / n;
    let sxx = 0, syy = 0, sxy = 0; for (const q of P) { sxx += (q[0] - mx) ** 2; syy += (q[1] - my) ** 2; sxy += (q[0] - mx) * (q[1] - my); }
    sxx /= n; syy /= n; sxy /= n;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
    return { m: [mx, my], ang: 0.5 * Math.atan2(2 * sxy, sxx - syy), s1: Math.sqrt(l1), s2: Math.sqrt(Math.max(l2, 1e-6)) };
  };
  const fa = fit(A), fb = fit(B), r2 = rng(9);
  const draw = (f: Fit, n: number) => Array.from({ length: n }, () => { const a = gauss(r2) * f.s1, b = gauss(r2) * f.s2; return [f.m[0] + a * Math.cos(f.ang) - b * Math.sin(f.ang), f.m[1] + a * Math.sin(f.ang) + b * Math.cos(f.ang)] as [number, number]; });
  return { A, B, fa, fb, newA: draw(fa, 5), newB: draw(fb, 5) };
})();
const ellPts = (f: Fit, k: number): [number, number][] => ellipsePts(0, 0, f.s1 * k, f.s2 * k, 48).map(([x, y]) => [f.m[0] + x * Math.cos(f.ang) - y * Math.sin(f.ang), f.m[1] + x * Math.sin(f.ang) + y * Math.cos(f.ang)]);

const SAMP = (() => { const r = rng(11); return Array.from({ length: 700 }, () => L.INK_MU + L.INK_SD * gauss(r)); })();
const RUG = Array.from({ length: 12 }, (_, i) => L.INK[(i * 149 + 37) % L.N_ALL]);       // doce datos reales para ver la altura de la curva en cada uno
const INK_N = L.N_ALL;

// reparto de los dígitos al sortear 1000 veces con cada modelo (para «result»)
let _res: { ae: number[]; vae: number[] } | null = null;
const result = () => (_res ??= { ae: L.digitFreq(L.drawAE(1000, 501).digit), vae: L.digitFreq(L.drawVAE(1000, 502).digit) });
// pares «generada ↔ más parecida del entrenamiento»
let _pairs: { g: Float32Array; i: number; d: number }[] | null = null;
const pairs = () => {
  if (_pairs) return _pairs;
  const D = L.drawVAE(60, 77), out: { g: Float32Array; i: number; d: number }[] = [], seen = new Set<number>();
  for (let k = 0; k < D.img.length && out.length < 5; k++) { const r = L.readDigit(D.img[k]); if (r.p < 0.8 || seen.has(r.digit)) continue; seen.add(r.digit); const n = L.nearest(D.img[k]); out.push({ g: D.img[k], i: n.i, d: n.d }); }
  return (_pairs = out);
};
let _sharp: { real: number; vae: number } | null = null;
const sharp = () => (_sharp ??= { real: L.mean(Array.from({ length: 100 }, (_, k) => L.crisp(L.img(L.NTR + k)))), vae: L.mean(L.drawVAE(100, 91).img.map(L.crisp)) });
// dónde está apiñado y dónde vacío en el plano del AE
let _void: { crowd: [number, number]; empty: [number, number] } | null = null;
const crowdEmpty = () => {
  if (_void) return _void;
  const B = L.AE_BOX, nx = 16, ny = 12, cnt = new Array(nx * ny).fill(0);
  for (let i = 0; i < L.NTR; i++) { const a = Math.min(nx - 1, Math.floor(((L.CODES_AE.x[i] - B.x0) / (B.x1 - B.x0)) * nx)), b = Math.min(ny - 1, Math.floor(((L.CODES_AE.y[i] - B.y0) / (B.y1 - B.y0)) * ny)); cnt[b * nx + a]++; }
  let ci = 0; for (let k = 1; k < cnt.length; k++) if (cnt[k] > cnt[ci]) ci = k;
  let ei = 0, ed = -1;
  for (let k = 0; k < cnt.length; k++) {
    const cx = B.x0 + (((k % nx) + 0.5) / nx) * (B.x1 - B.x0), cy = B.y0 + ((Math.floor(k / nx) + 0.5) / ny) * (B.y1 - B.y0);
    let md = Infinity; for (let i = 0; i < L.NTR; i += 3) { const dx = ((L.CODES_AE.x[i] - cx) / (B.x1 - B.x0)), dy = ((L.CODES_AE.y[i] - cy) / (B.y1 - B.y0)); md = Math.min(md, dx * dx + dy * dy); }
    if (md > ed) { ed = md; ei = k; }
  }
  const at = (k: number): [number, number] => [B.x0 + (((k % nx) + 0.5) / nx) * (B.x1 - B.x0), B.y0 + ((Math.floor(k / nx) + 0.5) / ny) * (B.y1 - B.y0)];
  return (_void = { crowd: at(ci), empty: at(ei) });
};

// ═════════ estado interactivo ═════════
interface Cmp { ae: number[]; vae: number[]; presses: { ae: number; vae: number }; last: L.Draws | null; lastModel: 'ae' | 'vae' }
interface St { z: [number, number]; drag: boolean; moved: boolean; found: boolean[]; extra: number; cmp: Cmp; fitDone: boolean }
const newSt = (): St => ({ z: [MED[7][0], MED[7][1]], drag: false, moved: false, found: new Array(10).fill(false), extra: 0, fitDone: false, cmp: { ae: new Array(10).fill(0), vae: new Array(10).fill(0), presses: { ae: 0, vae: 0 }, last: null, lastModel: 'ae' } });
const stOf = (S: Frame): St => (S.st.s ??= newSt());

const inExplore = (S: Frame) => S.between('try2', 'mosaic');
const fmt1 = (v: number, l: string) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ═════════ la escena ═════════
const scene: SceneFactory = () => ({
  controls: [
    { id: 'mu', kind: 'slider', label: { es: 'Centro de la campana', en: 'Center of the bell' }, min: 8, max: 32, step: 0.1, value: 12, from: 'try1', to: 'sample', fmt: fmt1 },
    { id: 'sigma', kind: 'slider', label: { es: 'Anchura de la campana', en: 'Width of the bell' }, min: 0.8, max: 8, step: 0.1, value: 4, from: 'try1', to: 'sample', fmt: fmt1 },
    { id: 'more', kind: 'button', primary: true, label: { es: 'Sortear más valores', en: 'Draw more values' }, from: 'sample', to: 'not-image' },
    { id: 'zl', kind: 'button', label: { es: '← Izquierda', en: '← Left' }, from: 'try2', to: 'mosaic' },
    { id: 'zr', kind: 'button', label: { es: 'Derecha →', en: 'Right →' }, from: 'try2', to: 'mosaic' },
    { id: 'zu', kind: 'button', label: { es: '↑ Arriba', en: '↑ Up' }, from: 'try2', to: 'mosaic' },
    { id: 'zd', kind: 'button', label: { es: '↓ Abajo', en: '↓ Down' }, from: 'try2', to: 'mosaic' },
    { id: 'zn', kind: 'button', primary: true, label: { es: 'Ir al grupo siguiente', en: 'Go to next group' }, from: 'try2', to: 'mosaic' },
    { id: 'model', kind: 'choice', label: { es: 'Modelo', en: 'Model' }, value: 'ae', from: 'try3', to: 'result', options: [{ value: 'ae', label: { es: 'Autocodificador', en: 'Autoencoder' } }, { value: 'vae', label: { es: 'VAE', en: 'VAE' } }] },
    { id: 'draw', kind: 'button', primary: true, label: { es: 'Sortear 32 imágenes', en: 'Draw 32 images' }, from: 'try3', to: 'result' },
  ],
  init(S) { S.st.s = newSt(); },

  action(S, id) {
    const st = stOf(S), B = L.AE_BOX;
    if (id === 'more') st.extra = Math.min(500, st.extra + 60);
    else if (id === 'zl' || id === 'zr' || id === 'zu' || id === 'zd') {
      const dx = (B.x1 - B.x0) * 0.06, dy = (B.y1 - B.y0) * 0.06;
      st.z = [clamp(st.z[0] + (id === 'zr' ? dx : id === 'zl' ? -dx : 0), B.x0, B.x1), clamp(st.z[1] + (id === 'zu' ? dy : id === 'zd' ? -dy : 0), B.y0, B.y1)];
      st.moved = true;
    } else if (id === 'zn') {
      let k = 0, best = Infinity;                                   // grupo más cercano al punto actual → siguiente
      for (let q = 0; q < 10; q++) { const d = Math.hypot(MED[q][0] - st.z[0], MED[q][1] - st.z[1]); if (d < best) { best = d; k = q; } }
      const next = (k + (Math.hypot(MED[k][0] - st.z[0], MED[k][1] - st.z[1]) < 0.4 ? 1 : 0)) % 10;
      st.z = [...MED[next]] as [number, number]; st.moved = true;
    } else if (id === 'draw') {
      const c = st.cmp, m = (S.p.model ?? 'ae') as 'ae' | 'vae', k = c.presses[m]++;
      const dr = m === 'ae' ? L.drawAE(32, 1000 + k * 17) : L.drawVAE(32, 2000 + k * 17);
      dr.digit.forEach((q) => c[m][q]++);
      c.last = dr; c.lastModel = m;
    }
  },

  update(S) {
    const st = stOf(S);
    if (S.between('try1', 'sample') && L.inkScore(S.p.mu ?? 12, S.p.sigma ?? 4) >= L.INK_BEST - 0.03) { st.fitDone = true; S.complete('fit'); }
    if (inExplore(S) && st.moved) {
      const r = L.readDigit(L.decAE(st.z[0], st.z[1]));
      if (r.p >= 0.8) st.found[r.digit] = true;
      if (st.found.filter(Boolean).length >= 3) S.complete('explore');
    }
    if (S.between('try3', 'result') && st.cmp.presses.ae >= 3 && st.cmp.presses.vae >= 3) S.complete('compare');
    if (S.on('not-image')) L.distances();                              // calcula (una vez) las distancias que se muestran más adelante
  },

  pointer(S, e) {
    if (!inExplore(S)) return;
    const st = stOf(S), P = mapLayout(S), r = P.plot.r, B = L.AE_BOX, h = S.hitR;
    const inside = e.x >= r.x - h && e.x <= r.x + r.w + h && e.y >= r.y - h && e.y <= r.y + r.h + h;
    if (e.type === 'down' && inside) st.drag = true;
    if ((e.type === 'down' || e.type === 'move') && st.drag) { st.z = [clamp(P.plot.iX(e.x), B.x0, B.x1), clamp(P.plot.iY(e.y), B.y0, B.y1)]; st.moved = true; }
    if (e.type === 'up' || e.type === 'leave') st.drag = false;
  },
  cursor(S, x, y) { if (!inExplore(S)) return undefined; const st = stOf(S), r = mapLayout(S).plot.r; if (st.drag) return 'grabbing'; return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h ? 'crosshair' : undefined; },

  render(S) {
    const g = groupAt(S, S.seg), pg = groupAt(S, Math.max(0, S.seg - 1));
    const fade = g !== pg && S.seg > 0 ? clamp(S.segT / 0.45) : 1;
    S.d.withAlpha(fade, () => {
      switch (g) {
        case 'tasks': return drawTasks(S);
        case 'hist': return drawHist(S);
        case 'pix': return drawPix(S);
        case 'ae': return drawAE(S);
        case 'train': return drawTrain(S);
        case 'sweep': return drawSweep(S);
        case 'map': return drawMap(S);
        case 'vae': return drawVae(S);
        case 'compare': return drawCompare(S);
        case 'collage': return drawCollage(S);
        case 'strip': return drawStrip2(S);
        case 'blur': return drawBlur(S);
        case 'recap': return drawRecap(S);
        default: return drawBridge(S);
      }
    });
  },
});

const ORDER: [string, string][] = [['tasks', 'hook'], ['hist', 'ink'], ['pix', 'not-image'], ['ae', 'compress'], ['train', 'training'], ['sweep', 'bottleneck'], ['map', 'latent-map'], ['vae', 'vae-cloud'], ['compare', 'try3'], ['collage', 'no-collage'], ['strip', 'caveat'], ['blur', 'blurry'], ['recap', 'recap'], ['bridge', 'bridge']];
function groupAt(S: Frame, seg: number) { let g = ORDER[0][0]; for (const [name, id] of ORDER) if (seg >= S.segIndex(id)) g = name; return g; }

/** Lectura con rótulo y valor (el del kit usa 12 px fijos). */
function ro(S: Frame, x: number, y: number, label: string, value: string, t: Tone, size = 22) {
  S.d.text(label, x, y, { size: fs(S, 12.5), weight: 700, color: S.pal.mute, base: 'top' });
  S.d.text(value, x, y + 17 * S.u, { size, weight: 700, font: 'mono', color: tone(S, t).ink, base: 'top' });
}
const R_ = (S: Frame, rl = 0.68, rp = 0.7) => regions(S, S.portrait ? rp : rl);

// ═════════════════════════════════════════════════════════════════════════
// 1 · discriminar frente a generar (datos de juguete) y el gancho
// ═════════════════════════════════════════════════════════════════════════
function drawTasks(S: Frame) {
  const a1 = 1 - S.at('discriminate', 0, 0.5), a2 = S.at('discriminate', 0.15, 0.7);
  if (a1 > 0) S.d.withAlpha(a1, () => drawHook(S));
  if (a2 > 0) S.d.withAlpha(a2, () => drawToy(S));
}

function drawHook(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 18 * u, 14 * u);
  const n = S.portrait ? 5 : 6;
  const area: Rect = { x: R.x, y: R.y + R.h * 0.2, w: R.w, h: R.h * 0.6 };
  const lay = tileLayout(area, n + 1, { cols: S.portrait ? 3 : n + 1, gap: 12 * u, maxCell: 9, valign: 'center' });
  d.text(S.l('dígitos escritos a mano', 'handwritten digits'), lay.x0, lay.y0 - 12 * u, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'bottom', a: S.reveal('hook', 0.1, 0.5) });
  for (let i = 0; i < n; i++) { const q = lay.pos(i); digit(S, q.x, q.y, L.img(HOOK[i]), lay.cell, { a: S.reveal('hook', 0.2 + 0.2 * i, 0.4) }); }
  const q = lay.pos(n), a = S.reveal('hook', 0.2 + 0.2 * n, 0.5), t = tone(S, 'lat');
  d.withAlpha(a, () => {
    d.rect(q.x - 0.5, q.y - 0.5, lay.tile + 1, lay.tile + 1, { stroke: t.c, lw: 2, dash: [5, 4], fill: t.soft });
    d.text('?', q.x + lay.tile / 2, q.y + lay.tile / 2, { size: lay.tile * 0.62 / u, weight: 800, color: t.ink, align: 'center', base: 'middle', a: 0.65 + 0.35 * Math.abs(Math.sin(S.clock * 2.2)) });
    d.text(S.l('¿uno nuevo?', 'a new one?'), q.x + lay.tile / 2, q.y + lay.tile + 8 * u, { size: fs(S, 13), weight: 700, color: t.ink, align: 'center', base: 'top' });
  });
}

function drawToy(S: Frame) {
  const { d, pal: p } = S, u = S.u, Rg = R_(S, 0.7, 0.74);
  const probe = new Plot(S, Rg.main, { xr: [0, 1], yr: [0, 1], pad: { l: 8, r: 8, t: 8, b: 8 } });
  const half = 3.3, asp = probe.r.h / probe.r.w;
  const plot = new Plot(S, Rg.main, { xr: [-half, half], yr: [-half * asp, half * asp], pad: { l: 8, r: 8, t: 8, b: 8 } });
  const r = plot.r;
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1 });
  // frontera (discriminar)
  const bA = 1 - S.at('generate', 0, 0.7);
  const fa = TOY.fa, fb = TOY.fb, mid: [number, number] = [(fa.m[0] + fb.m[0]) / 2, (fa.m[1] + fb.m[1]) / 2];
  let nx = fb.m[0] - fa.m[0], ny = fb.m[1] - fa.m[1]; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
  const dx = -ny, dy = nx;
  const showB = S.reveal('discriminate', 0.9, 0.7) * bA;
  if (showB > 0) {
    d.withAlpha(showB, () => {
      plot.line(mid[0] - dx * 9, mid[1] - dy * 9, mid[0] + dx * 9, mid[1] + dy * 9, 'ink', 3);
      const ty = half * asp * 0.8, tt = (ty - mid[1]) / dy;
      badge(S, S.l('frontera', 'boundary'), plot.X(mid[0] + dx * tt), plot.Y(ty), { size: fs(S, 12.5) });
    });
  }
  // nubes (generar)
  const ell = S.reveal('generate', 0.2, 0.9);
  if (ell > 0) {
    ([[fa, 'dat'], [fb, 'err']] as [typeof fa, Tone][]).forEach(([f, tn]) => {
      const t = tone(S, tn);
      [2, 1].forEach((k) => {
        const pts = ellPts(f, k * ell).map(([x, y]) => [plot.X(x), plot.Y(y)] as [number, number]);
        if (k === 2) d.polygon(pts, { fill: alpha(t.c, 0.08), stroke: alpha(t.c, 0.5), lw: 1.5 }); else d.polyline(pts, t.c, 2.2);
      });
    });
  }
  // datos reales
  [[TOY.A, 0], [TOY.B, 1]].forEach(([P, c]) => (P as [number, number][]).forEach(([x, y], i) => plot.datum(x, y, c as 0 | 1, { r: 4.6, a: S.reveal('discriminate', 0.05 + 0.012 * i, 0.3) })));
  // puntos nuevos (anillos punteados)
  [[TOY.newA, 'dat'], [TOY.newB, 'err']].forEach(([P, tn]) => (P as [number, number][]).forEach(([x, y], i) => {
    const a = S.reveal('generate', 1.5 + 0.28 * i, 0.4), t = tone(S, tn as Tone);
    d.withAlpha(a, () => { d.circle(plot.X(x), plot.Y(y), 8 * u, { fill: p.stage, stroke: t.c, lw: 2.4, dash: [3, 2.5] }); d.circle(plot.X(x), plot.Y(y), 1.6 * u, { fill: t.c }); });
  }));
  // leyenda
  const A = Rg.aside, ly = (k: number) => (S.portrait ? A.y + 14 * u : A.y + 20 * u + k * 34 * u), lx = (k: number) => (S.portrait ? A.x + 6 * u + k * (A.w / 3) : A.x + 6 * u);
  const items: [() => void, string][] = [
    [() => { d.circle(0, 0, 5 * u, { fill: tone(S, 'dat').c }); }, S.l('clase A', 'class A')],
    [() => { d.line(-5 * u, -5 * u, 5 * u, 5 * u, tone(S, 'err').c, 2.6); d.line(-5 * u, 5 * u, 5 * u, -5 * u, tone(S, 'err').c, 2.6); }, S.l('clase B', 'class B')],
    [() => { d.circle(0, 0, 7 * u, { fill: p.stage, stroke: p.ink2, lw: 2.2, dash: [3, 2.5] }); }, S.l('nuevo (generado)', 'new (generated)')],
  ];
  d.withAlpha(S.reveal('discriminate', 0.4, 0.6), () => {
    items.forEach(([sym, label], k) => {
      if (k === 2 && !S.on('generate')) return;
      const x = lx(k), y = ly(k);
      d.shift(x + 8 * u, y, sym);
      d.text(label, x + 24 * u, y, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'middle', w: S.portrait ? A.w / 3 - 26 * u : A.w - 30 * u });
    });
    d.text(S.l('datos de juguete (ilustrativo)', 'toy data (illustrative)'), A.x + 6 * u, A.y + A.h - 4 * u, { size: fs(S, 12), color: p.mute, base: 'bottom', w: A.w - 8 * u });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 2 · la distribución de la tinta: histograma, campana, puntuación, sorteo
// ═════════════════════════════════════════════════════════════════════════
const YMAX = 350;
function histPlot(S: Frame, main: Rect) {
  return new Plot(S, main, { xr: [10, 29], yr: [0, YMAX], pad: { l: 46, r: 12, t: 20, b: 44 } });
}
function bellNow(S: Frame): [number, number] {
  let mu = S.p.mu ?? 12, sd = S.p.sigma ?? 4;
  if (S.on('sample')) { const k = S.at('sample', 0, 1.2); mu = lerp(mu, L.INK_MU, k); sd = lerp(sd, L.INK_SD, k); }
  return [mu, sd];
}
function drawHist(S: Frame) {
  const { d, pal: p } = S, u = S.u, Rg = R_(S, 0.7, 0.66), plot = histPlot(S, Rg.main), r = plot.r;
  const NB = L.INK_HIST.length;
  axes(S, plot, { xTicks: [12, 16, 20, 24, 28], yTicks: [0, 100, 200, 300], xLabel: S.l('tinta total de la imagen', 'total ink of the image'), yLabel: S.l('imágenes', 'images'), a: S.reveal('ink', 0, 0.6), xLabelAlign: S.portrait ? 'center' : 'right' });
  // barras de los datos reales
  const prog = S.at('ink', 0.7, 3.8, 'lin'), dat = tone(S, 'dat');
  L.INK_HIST.forEach((c, i) => {
    const f = clamp((prog * (NB + 5) - i) / 5), x0 = plot.X(L.INK_LO + i) + 1, x1 = plot.X(L.INK_LO + i + 1) - 1, h = (plot.Y(0) - plot.Y(c)) * ease.out(f);
    if (h > 0.4) d.rect(x0, plot.Y(0) - h, x1 - x0, h, { fill: alpha(dat.c, 0.5), stroke: dat.c, lw: 1.2 });
  });
  d.text(S.l(`${S.n(INK_N, 0)} imágenes reales`, `${S.n(INK_N, 0)} real images`), r.x + r.w - 4, r.y + 2, { size: fs(S, 13), weight: 700, color: dat.ink, align: 'right', base: 'top', a: S.reveal('ink', 0.4, 0.5) });
  // probable / raro
  const aH = S.reveal('histogram', 0.7, 0.6) * (1 - S.at('bell', 0, 0.4));
  if (aH > 0) d.withAlpha(aH, () => {
    badge(S, S.l('probable', 'likely'), plot.X(19.5), plot.Y(332), { tone: 'dat', size: fs(S, 12.5) });
    badge(S, S.l('raro', 'rare'), plot.X(13.6), plot.Y(70), { tone: 'mute', size: fs(S, 12.5) });
    badge(S, S.l('raro', 'rare'), plot.X(25.6), plot.Y(70), { tone: 'mute', size: fs(S, 12.5) });
  });
  // campana
  const aB = S.reveal('bell', 0.2, 0.7);
  if (aB > 0) {
    const [mu, sd] = bellNow(S), w = tone(S, 'w');
    d.withAlpha(aB, () => {
      // datos reales: alturas de la curva en doce de ellos
      const aS = S.reveal('score', 0.3, 0.6) * (1 - S.at('sample', 0, 0.8));
      if (aS > 0) d.withAlpha(aS, () => RUG.forEach((v) => {
        const h = INK_N * L.normPdf(v, mu, sd);
        plot.line(v, 0, v, Math.min(h, YMAX), 'w', 1.6, [3, 3]);
        d.circle(plot.X(v), plot.Y(0), 3.4 * u, { fill: dat.c, stroke: p.stage, lw: 1.2 });
      }));
      plot.curve((x) => INK_N * L.normPdf(x, mu, sd), 'w', 3.6, { n: 160 });
      // parámetros sobre la curva
      const top = plot.Y(Math.min(YMAX * 0.97, INK_N * L.normPdf(mu, mu, sd)));
      d.line(plot.X(mu), top, plot.X(mu), plot.Y(0), w.c, 1.4, [4, 4], 0.7);
      badge(S, S.l('centro', 'center'), plot.X(mu), Math.max(r.y + 12 * u, top - 14 * u), { tone: 'w', size: fs(S, 12.5) });
      const hw = INK_N * L.normPdf(mu + sd, mu, sd);
      d.arrow(plot.X(mu - sd), plot.Y(hw), plot.X(mu + sd), plot.Y(hw), w.c, 2, 8);
      d.arrow(plot.X(mu + sd), plot.Y(hw), plot.X(mu - sd), plot.Y(hw), w.c, 2, 8);
      if (S.on('score') || sd > 1.5) badge(S, S.l('anchura', 'width'), plot.X(mu + sd) + 28 * u, plot.Y(hw) - 10 * u, { tone: 'w', size: fs(S, 12.5), align: 'left' });
    });
  }
  // datos sorteados (hueco) y su rastro
  if (S.on('sample')) {
    const st = stOf(S), n = Math.min(SAMP.length, Math.floor(S.at('sample', 1.2, 5.6, 'lin') * 220) + st.extra);
    const cnt = new Array(NB).fill(0); for (let i = 0; i < n; i++) { const b = Math.floor(SAMP[i]) - L.INK_LO; if (b >= 0 && b < NB) cnt[b]++; }
    const w = tone(S, 'w');
    d.withAlpha(S.reveal('sample', 0.8, 0.5), () => {
      cnt.forEach((c, i) => { const h = plot.Y(0) - plot.Y((c * INK_N) / Math.max(1, n)); if (h > 0.5) d.rect(plot.X(L.INK_LO + i) + 3, plot.Y(0) - h, plot.X(L.INK_LO + i + 1) - plot.X(L.INK_LO + i) - 6, h, { stroke: w.ink, lw: 2.2, fill: alpha(w.c, 0.12) }); });
      for (let i = Math.max(0, n - 10); i < n; i++) d.circle(plot.X(SAMP[i]), plot.Y(0) - 8 * u - ((i * 7) % 3) * 4 * u, 3.8 * u, { fill: w.c, stroke: p.stage, lw: 1.2 });
      badge(S, S.l(`sorteados: ${n}`, `drawn: ${n}`), r.x + r.w - 70 * u, r.y + 38 * u, { tone: 'w', size: fs(S, 12.5) });
    });
  }
  // lateral: miniaturas con su tinta, y luego lecturas
  const A = Rg.aside;
  if (!S.on('bell')) {
    const lay = tileLayout(A, 6, { cols: S.portrait ? 6 : 3, gap: 8 * u, extraH: 20 * u, maxCell: 6, valign: 'top' });
    d.withAlpha(S.reveal('ink', 0.3, 0.6), () => {
      L.INK_PICKS.forEach((idx, i) => { const q = lay.pos(i); digit(S, q.x, q.y, L.img(idx), lay.cell, { a: S.reveal('ink', 0.4 + 0.18 * i, 0.4) }); d.text(S.n(L.INK[idx], 1), q.x + lay.tile / 2, q.y + lay.tile + 3 * u, { size: fs(S, 12.5), weight: 700, font: 'mono', color: dat.ink, align: 'center', base: 'top', a: S.reveal('ink', 0.8 + 0.18 * i, 0.4) }); });
      d.text(S.l('tinta = suma de los 64 píxeles', 'ink = sum of the 64 pixels'), A.x + 2, lay.y0 + lay.h + 12 * u, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: A.w - 4 });
    });
  } else asideBell(S, A);
}

function asideBell(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, a = S.reveal('bell', 0.5, 0.6), [mu, sd] = bellNow(S);
  const score = L.inkScore(mu, sd), k = clamp((score + 6) / (L.INK_BEST + 6)), st = stOf(S);
  const cols = S.portrait ? 3 : 1, rowH = 46 * u;
  d.withAlpha(a, () => {
    ro(S, A.x + 2, A.y, S.l('centro', 'center'), S.n(mu, 1), 'w', S.portrait ? 20 : 22);
    ro(S, A.x + 2 + (A.w / cols) * (S.portrait ? 1 : 0), A.y + (S.portrait ? 0 : rowH), S.l('anchura', 'width'), S.n(sd, 1), 'w', S.portrait ? 20 : 22);
    if (S.on('score')) {
      const sx = A.x + 2 + (A.w / cols) * (S.portrait ? 2 : 0), sy = A.y + (S.portrait ? 0 : 2 * rowH);
      d.withAlpha(S.reveal('score', 0.2, 0.6), () => ro(S, sx, sy, S.l('puntuación', 'score'), S.n(score, 2), 'sig', S.portrait ? 20 : 22));
      // medidor con la marca de máximo
      const gy = S.portrait ? A.y + rowH + 16 * u : A.y + 3 * rowH + 8 * u, gw = A.w - 6 * u, gh = 12 * u;
      d.withAlpha(S.reveal('score', 0.5, 0.6), () => {
        d.rect(A.x + 2, gy, gw, gh, { fill: p.surface2, stroke: p.line, lw: 1 });
        const t = tone(S, st.fitDone || k > 0.985 ? 'dat' : 'sig');
        d.rect(A.x + 2, gy, gw * k, gh, { fill: alpha(t.c, 0.75) });
        d.line(A.x + 2 + gw, gy - 5 * u, A.x + 2 + gw, gy + gh + 5 * u, p.ink, 2.5);
        d.text(S.l('máximo con una campana', 'maximum with a bell'), A.x + 2 + gw, gy + gh + 8 * u, { size: fs(S, 12), weight: 600, color: p.ink2, align: 'right', base: 'top' });
        if (st.fitDone) d.text(S.l('✓ ¡llegaste!', '✓ you got there!'), A.x + 2, gy + gh + 8 * u, { size: fs(S, 13), weight: 800, color: tone(S, 'dat').ink, base: 'top' });
      });
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 3 · una imagen son 64 números: píxeles que dependen unos de otros
// ═════════════════════════════════════════════════════════════════════════
function drawPix(S: Frame) {
  const a1 = 1 - S.at('independent', 0, 0.5), a2 = S.at('independent', 0.1, 0.6) * (1 - S.at('space', 0, 0.5)), a3 = S.at('space', 0.1, 0.6);
  if (a1 > 0) S.d.withAlpha(a1, () => drawVector(S));
  if (a2 > 0) S.d.withAlpha(a2, () => drawIndependent(S));
  if (a3 > 0) S.d.withAlpha(a3, () => drawSpace(S));
}

function drawVector(S: Frame) {
  const { d, pal: p } = S, u = S.u, Rg = R_(S, 0.56, 0.6), im = L.img(HOOK[0]);
  const lay = tileLayout({ x: Rg.main.x, y: Rg.main.y + 26 * u, w: Rg.main.w, h: Rg.main.h - 26 * u }, 1, { maxCell: 52, valign: 'center' });
  const c2 = lay.cell;
  const q = lay.pos(0);
  digit(S, q.x, q.y, im, c2, { a: S.reveal('not-image', 0.1, 0.5), values: c2 >= 26 && S.on('not-image') && S.since('not-image') > 0.9 });
  d.text(S.l('8 × 8 = 64 píxeles', '8 × 8 = 64 pixels'), q.x, q.y - 8 * u, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'bottom', a: S.reveal('not-image', 0.2, 0.5) });
  // el vector y la tinta
  const A = Rg.aside, vals = Array.from({ length: 8 }, (_, i) => Math.round(im[i] * 16)), t = tone(S, 'dat');
  const a = S.reveal('not-image', 1.2, 0.6);
  d.withAlpha(a, () => {
    d.text(S.l('un solo punto con 64 coordenadas', 'a single point with 64 coordinates'), A.x + 4, A.y + 4, { size: fs(S, 13), weight: 700, color: t.ink, base: 'top', w: A.w - 8 });
    d.text(`[ ${vals.join(', ')}, … ]`, A.x + 4, A.y + (S.portrait ? 40 : 66) * u, { size: fs(S, 13), font: 'mono', weight: 600, color: p.ink, base: 'top', w: A.w - 8 });
    d.text(S.l(`tinta = suma = ${S.n(L.INK[HOOK[0]], 1)}`, `ink = sum = ${S.n(L.INK[HOOK[0]], 1)}`), A.x + 4, A.y + A.h - 6 * u, { size: fs(S, 13), weight: 700, color: t.ink, base: 'bottom' });
  });
}

function drawIndependent(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 16 * u, 16 * u), n = S.portrait ? 5 : 8;
  const half = (R.h - 12 * u) / 2, capH = 24 * u;
  const real = Array.from({ length: n }, (_, i) => L.img(L.NTR + 40 + i)), fake = L.drawIndependent(n, 7);
  const rows: [string, Float32Array[], 'real' | 'model', number][] = [[S.l('dígitos reales', 'real digits'), real, 'real', 0], [S.l('cada píxel sorteado por separado', 'each pixel drawn separately'), fake, 'model', 1]];
  rows.forEach(([label, imgs, kind, i]) => {
    const area: Rect = { x: R.x, y: R.y + i * (half + 12 * u) + capH, w: R.w, h: half - capH };
    const lay = tileLayout(area, n, { cols: n, gap: 8 * u, maxCell: 8, valign: 'center' });
    const a = i === 0 ? S.reveal('independent', 0.1, 0.5) : S.reveal('independent', 0.9, 0.6);
    d.withAlpha(a, () => {
      d.text(label, lay.x0, R.y + i * (half + 12 * u) + 2, { size: fs(S, 13), weight: 700, color: i ? tone(S, 'err').ink : p.ink2, base: 'top', w: R.w });
      imgs.forEach((im, k) => { const q = lay.pos(k); digit(S, q.x, q.y, im, lay.cell, { kind }); });
    });
  });
}

function drawSpace(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 14 * u, 16 * u, 10 * u), D = L.distances();
  const rows = [
    { label: S.l('dígitos reales nuevos', 'new real digits'), vals: D.real, tone: 'dat' as Tone, ex: D.ex.real, seed: 1 },
    { label: S.l('píxeles sorteados por separado', 'pixels drawn separately'), vals: D.indep, tone: 'mute' as Tone, ex: D.ex.indep, seed: 2 },
    { label: S.l('ruido al azar', 'random noise'), vals: D.noise, tone: 'mute' as Tone, ex: D.ex.noise, seed: 3 },
  ];
  rows.forEach((r, i) => (r as { a?: number }).a = S.reveal('space', 0.3 + 0.7 * i, 0.6));
  strip(S, R, rows, { xmax: 4.5, xTicks: [0, 1, 2, 3, 4], xLabel: S.l('distancia al dígito de entrenamiento más cercano', 'distance to the nearest training digit'), show: S.at('space', 0.5, 3.0, 'lin') });
  void p;
}

// ═════════════════════════════════════════════════════════════════════════
// 4 · el autocodificador: diagrama, entrenamiento, cuello de botella
// ═════════════════════════════════════════════════════════════════════════
interface AeLay { img: Rect; enc: Rect; code: Rect; dec: Rect; out: Rect; err: Rect; cell: number; hor: boolean }
function aeLay(S: Frame): AeLay {
  const u = S.u, R = inset(S.full(), 14 * u, 14 * u);
  if (!S.portrait) {
    const cell = Math.max(4, Math.min(8, Math.floor(R.h * 0.3 / 8))), im = 8 * cell, cy = R.y + R.h * 0.4, bh = Math.min(120 * u, R.h * 0.4);
    const encW = R.w * 0.2, codeW = Math.max(R.w * 0.13, 98), gap = (R.w - 2 * im - 2 * encW - codeW) / 4;
    const x1 = R.x, x2 = x1 + im + gap, x3 = x2 + encW + gap, x4 = x3 + codeW + gap, x5 = x4 + encW + gap;
    return { hor: true, cell, img: { x: x1, y: cy - im / 2, w: im, h: im }, enc: { x: x2, y: cy - bh / 2, w: encW, h: bh }, code: { x: x3, y: cy - 34 * u, w: codeW, h: 68 * u }, dec: { x: x4, y: cy - bh / 2, w: encW, h: bh }, out: { x: x5, y: cy - im / 2, w: im, h: im }, err: { x: x5 + (im - im * 0.7) / 2, y: cy + im / 2 + 54 * u, w: im * 0.7, h: im * 0.7 } };
  }
  // vertical: una columna (imagen → codificador → código → decodificador → reconstrucción) y los rótulos a su derecha, para que ninguna flecha cruce un texto
  const cell = 5, im = 8 * cell, cx = R.x + R.w * 0.36, bh = 36 * u, bw = Math.min(180 * u, R.w * 0.5), codeH = 46 * u, codeW = 124 * u, lossH = 28 * u;
  const gap = clamp((R.h - 4 * u - im * 2 - bh * 2 - codeH - lossH) / 4, 14 * u, 60 * u);
  let y = R.y + 2 * u;
  const img = { x: cx - im / 2, y, w: im, h: im }; y += im + gap;
  const enc = { x: cx - bw / 2, y, w: bw, h: bh }; y += bh + gap;
  const code = { x: cx - codeW / 2, y, w: codeW, h: codeH }; y += codeH + gap;
  const dec = { x: cx - bw / 2, y, w: bw, h: bh }; y += bh + gap;
  const out = { x: cx - im / 2, y, w: im, h: im };
  return { hor: false, cell, img, enc, code, dec, out, err: { x: R.x + R.w - im - 2, y, w: im, h: im } };
}
function trap(S: Frame, r: Rect, hor: boolean, narrowEnd: boolean, label: string, a: number, active = 0) {
  const { d, pal: p } = S, t = tone(S, 'w'), k = 0.28;
  let pts: [number, number][];
  if (hor) pts = narrowEnd ? [[r.x, r.y], [r.x + r.w, r.y + r.h * k], [r.x + r.w, r.y + r.h * (1 - k)], [r.x, r.y + r.h]] : [[r.x, r.y + r.h * k], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h * (1 - k)]];
  else pts = narrowEnd ? [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w * (1 - k), r.y + r.h], [r.x + r.w * k, r.y + r.h]] : [[r.x + r.w * k, r.y], [r.x + r.w * (1 - k), r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  d.withAlpha(a, () => {
    d.polygon(pts, { fill: alpha(t.c, 0.12 + 0.25 * active), stroke: t.c, lw: 2 });
    d.text(label, r.x + r.w / 2, r.y + r.h / 2, { size: fs(S, 13.5), weight: 800, color: t.ink, align: 'center', base: 'middle', halo: undefined });
  });
  void p;
}
function drawAE(S: Frame) {
  const { d, pal: p } = S, u = S.u, G = aeLay(S), im = L.img(AE_EX), z = L.encAE(im), rec = L.decAE(z[0], z[1]), lat = tone(S, 'lat');
  const cell = G.cell;
  // imagen de entrada
  digit(S, G.img.x, G.img.y, im, cell, { a: S.reveal('compress', 0.1, 0.5) });
  if (G.hor) {
    d.text(S.l('imagen', 'image'), G.img.x + G.img.w / 2, G.img.y - 8 * u, { size: fs(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'bottom', a: S.reveal('compress', 0.1, 0.5) });
    d.text(S.l('64 números', '64 numbers'), G.img.x + G.img.w / 2, G.img.y + G.img.h + 6 * u, { size: fs(S, 12), color: p.mute, align: 'center', base: 'top', a: S.reveal('compress', 0.3, 0.5) });
  } else {
    d.text(S.l('imagen', 'image'), G.img.x + G.img.w + 10 * u, G.img.y + G.img.h / 2 - 1, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'bottom', a: S.reveal('compress', 0.1, 0.5) });
    d.text(S.l('64 números', '64 numbers'), G.img.x + G.img.w + 10 * u, G.img.y + G.img.h / 2 + 1, { size: fs(S, 12), color: p.mute, base: 'top', a: S.reveal('compress', 0.3, 0.5) });
  }
  // codificador
  const aE = S.reveal('compress', 0.4, 0.6);
  trap(S, G.enc, G.hor, true, S.l('codificador', 'encoder'), aE, S.is('compress') ? 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 3)) : 0);
  if (aE > 0) { const a = G.img, b = G.enc; d.withAlpha(aE, () => G.hor ? d.arrow(a.x + a.w + 4, a.y + a.h / 2, b.x - 2, a.y + a.h / 2, p.ink2, 2, 8) : d.arrow(a.x + a.w / 2, a.y + a.h + 4, a.x + a.w / 2, b.y - 2, p.ink2, 2, 8)); }
  // código
  const aC = S.reveal('compress', 1.3, 0.6);
  d.withAlpha(aC, () => {
    const c = G.code;
    d.rect(c.x, c.y, c.w, c.h, { fill: lat.soft, stroke: lat.c, lw: 2, r: 3 });
    d.text(`z₁ = ${S.n(z[0], 1)}`, c.x + c.w / 2, c.y + c.h * 0.32, { size: fs(S, 14), weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
    d.text(`z₂ = ${S.n(z[1], 1)}`, c.x + c.w / 2, c.y + c.h * 0.7, { size: fs(S, 14), weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
    if (G.hor) d.text(S.l('código: 2 números', 'code: 2 numbers'), c.x + c.w / 2, c.y - 8 * u, { size: fs(S, 12.5), weight: 700, color: lat.ink, align: 'center', base: 'bottom' });
    else d.text(S.l('código: 2 números', 'code: 2 numbers'), c.x + c.w + 10 * u, c.y + c.h / 2, { size: fs(S, 12.5), weight: 700, color: lat.ink, base: 'middle', w: S.W - (c.x + c.w + 10 * u) - 12 * u });
    const b = G.enc; if (G.hor) d.arrow(b.x + b.w + 3, c.y + c.h / 2, c.x - 2, c.y + c.h / 2, p.ink2, 2, 8); else d.arrow(c.x + c.w / 2, b.y + b.h + 3, c.x + c.w / 2, c.y - 2, p.ink2, 2, 8);
  });
  // decodificador y reconstrucción
  const aD = S.reveal('decode', 0.2, 0.6);
  trap(S, G.dec, G.hor, false, S.l('decodificador', 'decoder'), aD, S.is('decode') ? 0.5 + 0.5 * Math.abs(Math.sin(S.clock * 3)) : 0);
  if (aD > 0) d.withAlpha(aD, () => { const c = G.code, b = G.dec; if (G.hor) d.arrow(c.x + c.w + 3, c.y + c.h / 2, b.x - 2, c.y + c.h / 2, p.ink2, 2, 8); else d.arrow(c.x + c.w / 2, c.y + c.h + 3, c.x + c.w / 2, b.y - 2, p.ink2, 2, 8); });
  const aO = S.reveal('decode', 1.2, 0.6);
  d.withAlpha(aO, () => {
    const b = G.dec, o = G.out;
    if (G.hor) d.arrow(b.x + b.w + 3, o.y + o.h / 2, o.x - 3, o.y + o.h / 2, p.ink2, 2, 8); else d.arrow(b.x + b.w / 2, b.y + b.h + 3, b.x + b.w / 2, o.y - 3 + (o.y - b.y - b.h < 8 ? 0 : 0), p.ink2, 2, 8);
    digit(S, o.x, o.y, rec, cell, { kind: 'model' });
    if (G.hor) d.text(S.l('reconstrucción', 'reconstruction'), o.x + o.w / 2, o.y - 8 * u, { size: fs(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
    else d.text(S.l('reconstrucción', 'reconstruction'), o.x + o.w + 10 * u, o.y + o.h / 2, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'middle' });
  });
  // error de reconstrucción y pérdida
  const aL = S.reveal('autoencoder', 0.2, 0.7);
  if (aL > 0) d.withAlpha(aL, () => {
    const diff = Float32Array.from(im, (v, i) => Math.abs(v - rec[i]));
    const sse = Array.from(im).reduce((a, v, i) => a + (v - rec[i]) ** 2, 0), e = G.err, errT = tone(S, 'err');
    digit(S, e.x, e.y, diff, Math.max(3, Math.floor(e.w / 8)), { tone: 'err', hl: 'err' });
    d.text(S.l('diferencia', 'difference'), G.hor ? e.x + e.w / 2 : e.x + e.w, e.y - 6 * u, { size: fs(S, 12.5), weight: 700, color: errT.ink, align: G.hor ? 'center' : 'right', base: 'bottom' });
    const tx = G.hor ? G.img.x : 14 * u, ty = G.hor ? G.err.y + 8 * u : G.out.y + G.out.h + 12 * u;
    d.text(S.l(`pérdida = Σ (x − x̂)² = ${S.n(sse, 2)}`, `loss = Σ (x − x̂)² = ${S.n(sse, 2)}`), tx, ty, { size: fs(S, G.hor ? 17 : 14), weight: 800, font: 'mono', color: errT.ink, base: 'top', w: G.hor ? G.err.x - G.img.x - 12 * u : S.W - tx - 10 * u });
  });
}

function drawTrain(S: Frame) {
  const { d, pal: p } = S, u = S.u, Rg = R_(S, 0.56, 0.58), sh = L.SHOW, n = sh.length;
  const t0 = S.since('training'), SNAPS = L.SNAP.ep, K = SNAPS.length, dt = 1.1, start = 0.5;
  const idx = clamp(Math.floor((t0 - start) / dt) + 1, 0, K - 1), prev = Math.max(0, idx - 1), blend = idx === 0 ? 1 : clamp(((t0 - start) - (idx - 1) * dt) / 0.3);
  const lay = tileLayout({ x: Rg.main.x, y: Rg.main.y + 26 * u, w: Rg.main.w, h: Rg.main.h - 26 * u }, n * 2, { cols: S.portrait ? 4 : 8, gap: 5 * u, maxCell: 7, extraH: 0 });
  const rowsGap = 30 * u, cols = lay.cols;
  const top = Rg.main.y + 22 * u, tile = lay.tile;
  const posOf = (row: number, i: number) => ({ x: lay.x0 + (i % cols) * (tile + lay.gap), y: top + Math.floor(i / cols) * (tile + lay.gap) + row * (Math.ceil(n / cols) * (tile + lay.gap) + rowsGap) });
  d.text(S.l('imágenes que la red no vio al entrenar', 'images the network never saw in training'), lay.x0, top - 6 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', a: S.reveal('training', 0.1, 0.4), w: Rg.main.w });
  for (let i = 0; i < n; i++) { const q = posOf(0, i); digit(S, q.x, q.y, L.img(sh[i]), lay.cell, { a: S.reveal('training', 0.1 + 0.05 * i, 0.4) }); }
  const q0 = posOf(1, 0), epochTxt = S.l(`paso ${SNAPS[idx]}`, `step ${SNAPS[idx]}`), lat = tone(S, 'lat');
  d.text(S.l('lo que reconstruye', 'what it rebuilds'), lay.x0, q0.y - 6 * u, { size: fs(S, 12.5), weight: 700, color: lat.ink, base: 'bottom', a: S.reveal('training', 0.5, 0.4) });
  d.withAlpha(S.reveal('training', 0.5, 0.4), () => {
    for (let i = 0; i < n; i++) {
      const q = posOf(1, i), A = L.slot(L.SNAP.rec[idx], i), B = L.slot(L.SNAP.rec[prev], i);
      const m = Float32Array.from(A, (v, j) => lerp(B[j], v, blend));
      digit(S, q.x, q.y, m, lay.cell, { kind: 'model' });
    }
  });
  // curva de la pérdida (escala logarítmica del paso)
  const A = Rg.aside, plot = new Plot(S, A, { xr: [0, Math.log10(1501)], yr: [0, L.LOSS[0] * 1.05], pad: { l: 42, r: 12, t: 22, b: 40 } });
  const X = (step: number) => plot.X(Math.log10(1 + step));
  d.withAlpha(S.reveal('training', 0.6, 0.5), () => {
    axes(S, plot, { xTicks: [0, 1, 2, 3].map((e) => (e === 0 ? 0 : 10 ** e) ), yTicks: [0, 4, 8, 12], xFmt: (v) => String(v), yLabel: S.l('error por imagen', 'error per image'), xLabel: S.l('paso (escala log)', 'step (log scale)') });
    const shown = SNAPS[idx] + (idx > 0 ? 0 : 0), pts: [number, number][] = [];
    L.LOSS.forEach((v, k) => { if (k * 10 <= shown) pts.push([X(k * 10), plot.Y(v)]); });
    if (pts.length > 1) d.polyline(pts, tone(S, 'err').c, 2.6);
    const cur = L.LOSS[Math.min(L.LOSS.length - 1, Math.round(shown / 10))];
    d.circle(X(shown), plot.Y(cur), 5.5 * u, { fill: tone(S, 'err').c, stroke: p.stage, lw: 2 });
    d.text(epochTxt, A.x + A.w - 6, A.y + 2, { size: fs(S, 14), weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'top' });
    const edge = X(shown) > A.x + A.w * 0.72;
    d.text(S.n(cur, 2), X(shown) + (edge ? -12 : 10) * u, plot.Y(cur) - 16 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: tone(S, 'err').ink, align: edge ? 'right' : 'left', base: 'bottom', halo: p.stage });
  });
}

function drawSweep(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 14 * u, 14 * u), ks = L.SWEEP.k, rows = ks.length + 1;
  const foot = S.portrait ? 26 * u : 0, labW = (S.portrait ? 54 : 150) * u, rightW = (S.portrait ? 62 : 230) * u, rowH = (R.h - 8 * u - foot) / rows;
  const area: Rect = { x: R.x + labW, y: R.y, w: R.w - labW - rightW, h: rowH * 1 };
  const tl = tileLayout({ x: R.x + labW, y: R.y, w: R.w - labW - rightW, h: rowH - 4 * u }, 8, { cols: 8, gap: 3 * u, maxCell: 6 });
  void area;
  const sh = L.SHOW;
  const rowY = (i: number) => R.y + i * rowH + (rowH - tl.tile) / 2;
  d.withAlpha(S.reveal('bottleneck', 0.1, 0.4), () => {
    d.text(S.l('originales', 'originals'), R.x, rowY(0) + tl.tile / 2, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'middle', w: labW - 6 });
    for (let i = 0; i < 8; i++) digit(S, tl.x0 + i * (tl.tile + tl.gap), rowY(0), L.img(sh[i]), tl.cell, {});
    if (!S.portrait) { d.text(S.l('error por imagen', 'error per image'), R.x + R.w - rightW + 8 * u, rowY(0) + tl.tile / 2, { size: fs(S, 12.5), weight: 700, color: tone(S, 'err').ink, base: 'middle', w: rightW - 10 }); }
  });
  if (S.portrait) d.text(S.l('números del código · error por imagen', 'code size · error per image'), R.x, R.y + R.h - 2, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'bottom', a: S.reveal('bottleneck', 0.8, 0.5), w: R.w });
  ks.forEach((k, r) => {
    const a = S.reveal('bottleneck', 0.5 + 0.55 * r, 0.5), y = rowY(r + 1), sse = L.SWEEP.sse[r], acc = L.SWEEP.acc[r];
    d.withAlpha(a, () => {
      d.text(S.portrait ? String(k) : S.l(k === 1 ? '1 número' : `${k} números`, k === 1 ? '1 number' : `${k} numbers`), R.x, y + tl.tile / 2, { size: fs(S, 13.5), weight: 800, color: tone(S, 'lat').ink, base: 'middle', font: S.portrait ? 'mono' : 'ui' });
      for (let i = 0; i < 8; i++) digit(S, tl.x0 + i * (tl.tile + tl.gap), y, L.slot(L.SWEEP.rec[r], i), tl.cell, { kind: 'model' });
      const bx = R.x + R.w - rightW + 8 * u, bw = rightW - 12 * u, errT = tone(S, 'err');
      if (S.portrait) {
        d.text(S.n(sse, 2), R.x + R.w, y + tl.tile / 2, { size: fs(S, 13.5), weight: 800, font: 'mono', color: errT.ink, align: 'right', base: 'middle' });
      } else {
        const bwid = (bw - 52 * u) * clamp(sse / L.SWEEP.base);
        d.rect(bx, y + tl.tile * 0.2, bw - 52 * u, tl.tile * 0.3, { fill: p.surface2 }); d.rect(bx, y + tl.tile * 0.2, bwid, tl.tile * 0.3, { fill: alpha(errT.c, 0.75) });
        d.text(S.n(sse, 2), bx + bw, y + tl.tile * 0.35, { size: fs(S, 13.5), weight: 800, font: 'mono', color: errT.ink, align: 'right', base: 'middle' });
        if (acc !== undefined) d.text(S.l(`se lee bien: ${S.n(acc * 100, 0)} %`, `read correctly: ${S.n(acc * 100, 0)}%`), bx, y + tl.tile * 0.82, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'middle' });
      }
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 5 · el plano latente del autocodificador
// ═════════════════════════════════════════════════════════════════════════
function mapLayout(S: Frame) {
  const Rg = R_(S, 0.66, 0.68), B = L.AE_BOX, px = (B.x1 - B.x0) * 0.05, py = (B.y1 - B.y0) * 0.06;
  const plot = new Plot(S, Rg.main, { xr: [B.x0 - px, B.x1 + px], yr: [B.y0 - py, B.y1 + py], pad: { l: 40, r: 12, t: 16, b: 40 } });
  return { Rg, plot };
}
function drawMap(S: Frame) {
  const { d, pal: p } = S, u = S.u, { Rg, plot } = mapLayout(S), r = plot.r, st = stOf(S), B = L.AE_BOX, A = Rg.aside;
  const pAll = S.reveal('latent-map', 0.1, 0.7), toMos = S.at('mosaic', 0.2, 1.4), outMos = S.at('problem', 0, 0.8);
  const ptsA = pAll * (1 - 0.88 * toMos * (1 - outMos));
  axes(S, plot, { xTicks: [-10, 0, 10], yTicks: [-20, -10, 0], xLabel: 'z₁', yLabel: 'z₂', a: pAll, xLabelAlign: 'right' });
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1, a: pAll });
  // mosaico de lo que decodifica cada punto del plano
  if (toMos > 0 && outMos < 1) {
    const cv = mosaicCanvas(S, plot);
    d.withAlpha(toMos * (1 - outMos), () => { S.ctx.drawImage(cv, r.x, r.y, r.w, r.h); d.rect(r.x, r.y, r.w, r.h, { stroke: p.lineStrong, lw: 1.2 }); });
  }
  // puntos de las 1500 imágenes de entrenamiento
  if (ptsA > 0.01) {
    d.withAlpha(ptsA, () => {
      plot.clip(() => { for (let i = 0; i < L.NTR; i++) mark(S, plot.X(L.CODES_AE.x[i]), plot.Y(L.CODES_AE.y[i]), L.LAB[i], 2.5 * u, 0.8); });
    });
  }
  // etiquetas de cada grupo (solo para quien mira: la red no usó etiquetas)
  const aL = S.reveal('latent-map', 1.6, 0.7) * (1 - toMos * (1 - outMos)) * (1 - 0.85 * S.at('problem', 0, 0.5)), aN = aL * (1 - S.at('walk', 0, 0.4));
  if (aL > 0) d.withAlpha(aL, () => {
    for (let k = 0; k < 10; k++) { const t = tone(S, digTone(k)); const x = plot.X(MED[k][0]), y = plot.Y(MED[k][1]); d.rect(x - 11 * u, y - 11 * u, 22 * u, 22 * u, { fill: p.surface, stroke: t.c, lw: 2, r: 3 }); d.text(String(k), x, y, { size: fs(S, 14), weight: 800, color: t.ink, align: 'center', base: 'middle' }); }
  });
  if (aN > 0) d.text(S.portrait || r.w < 440 ? S.l('solo para ti: la red no usó etiquetas', 'for you only: the network used no labels') : S.l('los colores y números están solo para ti: la red no los usó', 'colors and numbers are only for you: the network did not use them'), r.x + 6, r.y + r.h - 4, { size: fs(S, 12), color: p.ink2, weight: 600, base: 'bottom', halo: p.stage, w: r.w - 12, a: aN });
  // tres imágenes y su punto
  if (S.between('latent-map', 'walk')) {
    const lay = tileLayout(A, 3, { cols: S.portrait ? 3 : 1, gap: 12 * u, extraH: 0, maxCell: 8, valign: 'top' }), a = S.reveal('latent-map', 0.5, 0.6);
    d.withAlpha(a, () => PEEK.forEach((idx, i) => {
      const q = lay.pos(i), tx = plot.X(L.CODES_AE.x[idx]), ty = plot.Y(L.CODES_AE.y[idx]), lat = tone(S, 'lat');
      digit(S, q.x, q.y, L.img(idx), lay.cell);
      d.line(S.portrait ? q.x + lay.tile / 2 : q.x - 2, S.portrait ? q.y - 2 : q.y + lay.tile / 2, tx, ty, lat.c, 1.6, [4, 3]);
      d.circle(tx, ty, 8 * u, { stroke: lat.c, lw: 2.4 });
    }));
  }
  // el punto que se mueve y lo que decodifica
  if (S.on('walk') && !S.on('problem') && !(toMos > 0.02)) drawExplorer(S, plot, A, st);
  if (S.on('walk') && !S.on('mosaic')) void 0;
  if (S.on('mosaic') && !S.on('problem')) {
    d.withAlpha(S.reveal('mosaic', 0.6, 0.6), () => { d.text(S.l('cada cuadro: lo que decodifica ese punto del plano', 'each tile: what that point of the plane decodes to'), A.x + 2, A.y + 2, { size: fs(S, 13), weight: 700, color: tone(S, 'lat').ink, base: 'top', w: A.w - 6 }); });
    if (!S.portrait) neu(S, A.x + A.w - 70 * u, A.y + A.h - 62 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'wow', a: S.reveal('mosaic', 1.2, 0.5) });
  }
  // problema: apiñados, vacíos y el recuadro de sorteo
  if (S.on('problem')) {
    const a = S.reveal('problem', 0.2, 0.7), cv = crowdEmpty(), err = tone(S, 'err');
    d.withAlpha(a, () => {
      d.rect(plot.X(B.x0), plot.Y(B.y1), plot.X(B.x1) - plot.X(B.x0), plot.Y(B.y0) - plot.Y(B.y1), { stroke: p.ink, lw: 2, dash: [8, 5] });
      d.text(S.l('recuadro de los códigos', 'box of the codes'), plot.X(B.x1) - 6, plot.Y(B.y0) - 5, { size: fs(S, 12.5), weight: 700, color: p.ink, align: 'right', base: 'bottom', halo: p.stage });
      d.circle(plot.X(cv.crowd[0]), plot.Y(cv.crowd[1]), 30 * u, { stroke: err.c, lw: 2.5, dash: [5, 4] });
      badge(S, S.l('apiñados', 'crowded'), plot.X(cv.crowd[0]), plot.Y(cv.crowd[1]) - 42 * u, { tone: 'err', size: fs(S, 12.5) });
      d.circle(plot.X(cv.empty[0]), plot.Y(cv.empty[1]), 34 * u, { stroke: p.ink2, lw: 2.5, dash: [5, 4] });
      badge(S, S.l('vacío', 'empty'), plot.X(cv.empty[0]), plot.Y(cv.empty[1]), { tone: 'mute', size: fs(S, 12.5) });
    });
    if (!S.portrait) neu(S, A.x + A.w / 2 - 36 * u, A.y + A.h / 2 - 30 * u, { scale: Math.max(3, Math.round(3 * u)), mood: 'think', a: S.reveal('problem', 0.8, 0.5) });
  }
}

function drawExplorer(S: Frame, plot: Plot, A: Rect, st: St) {
  const { d, pal: p } = S, u = S.u, a = S.reveal('walk', 0.2, 0.6), lat = tone(S, 'lat');
  const x = plot.X(st.z[0]), y = plot.Y(st.z[1]), dec = L.decAE(st.z[0], st.z[1]), rd = L.readDigit(dec);
  d.withAlpha(a, () => {
    // asa
    d.line(x - 16 * u, y, x + 16 * u, y, p.ink, 1.5); d.line(x, y - 16 * u, x, y + 16 * u, p.ink, 1.5);
    d.circle(x, y, 9 * u, { fill: lat.soft, stroke: p.ink, lw: 2.8 });
    // imagen decodificada
    const imgW = S.portrait ? Math.min(A.h - 8 * u - (S.on('try2') ? 46 * u : 0), A.w * 0.42) : Math.min(A.w - 8, A.h * 0.5), cell = Math.max(4, Math.floor(imgW / 8));
    const ix = A.x + 2, iy = A.y + 4;
    digit(S, ix, iy, dec, cell, { kind: 'model' });
    d.line(x, y, ix + 4 * cell, iy + 8 * cell, lat.c, 1.4, [3, 3], 0.5);
    const tx = ix + 8 * cell + 14 * u;
    if (S.portrait) {
      ro(S, tx, A.y + 2, 'z₁', S.n(st.z[0], 1), 'lat', 17); ro(S, tx + 74 * u, A.y + 2, 'z₂', S.n(st.z[1], 1), 'lat', 17);
      d.text(S.l('parece un', 'looks like a'), tx, A.y + 50 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top' });
      d.text(rd.p >= 0.5 ? String(rd.digit) : '—', tx + 96 * u, A.y + 44 * u, { size: 30, weight: 800, color: rd.p >= 0.5 ? p.ink : p.mute, base: 'top' });
    } else {
      const ry = iy + 8 * cell + 14 * u;
      ro(S, ix, ry, 'z₁', S.n(st.z[0], 1), 'lat', 18); ro(S, ix + A.w * 0.5, ry, 'z₂', S.n(st.z[1], 1), 'lat', 18);
      d.text(S.l('parece un', 'looks like a'), ix, ry + 44 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top' });
      d.text(rd.p >= 0.5 ? String(rd.digit) : '—', ix + 104 * u, ry + 36 * u, { size: 34, weight: 800, color: rd.p >= 0.5 ? p.ink : p.mute, base: 'top' });
    }
    // dígitos encontrados (forma + rótulo, no solo color)
    if (S.on('try2')) {
      const cw = Math.min(26 * u, (A.w - 6) / 10), cy = A.y + A.h - cw - 2, cx0 = A.x + 2, done = st.found.filter(Boolean).length;
      d.text(S.l(`encontrados: ${done} de 3`, `found: ${done} of 3`), cx0, cy - 6 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom' });
      for (let k = 0; k < 10; k++) { const on = st.found[k], t = tone(S, 'dat'); d.rect(cx0 + k * cw, cy, cw - 2, cw - 2, { fill: on ? alpha(t.c, 0.75) : p.surface2, stroke: on ? t.c : p.line, lw: 1.5 }); d.text(String(k), cx0 + k * cw + (cw - 2) / 2, cy + (cw - 2) / 2, { size: fs(S, 12.5), weight: 800, font: 'mono', color: on ? p.stage : p.mute, align: 'center', base: 'middle' }); }
    }
  });
}

// mosaico de lo que decodifica cada punto del plano (se pinta una vez y se guarda: es una función pura de la geometría y el tema)
const MOS = new Map<string, HTMLCanvasElement>();
function mosaicCanvas(S: Frame, plot: Plot): HTMLCanvasElement {
  const r = plot.r, dpr = S.dpr, key = `${S.pal.ink}|${S.pal.surface}|${dpr}|${Math.round(r.w)}x${Math.round(r.h)}|${plot.o.xr}|${plot.o.yr}`;
  const hit = MOS.get(key); if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(r.w * dpr); cv.height = Math.ceil(r.h * dpr);
  const g = cv.getContext('2d')!; g.scale(dpr, dpr);
  const col = lut(S.pal.ink), cell = r.w > 420 ? 4 : 3, gap = 2, tile = 8 * cell;
  const nx = Math.floor((r.w + gap) / (tile + gap)), ny = Math.floor((r.h + gap) / (tile + gap));
  const ox = (r.w - (nx * (tile + gap) - gap)) / 2, oy = (r.h - (ny * (tile + gap) - gap)) / 2;
  g.fillStyle = S.pal.surface2; g.fillRect(0, 0, r.w, r.h);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = ox + i * (tile + gap), y = oy + j * (tile + gap), im = L.decAE(plot.iX(r.x + x + tile / 2), plot.iY(r.y + y + tile / 2));
    g.fillStyle = S.pal.surface; g.fillRect(x, y, tile, tile);
    for (let a = 0; a < 8; a++) for (let b = 0; b < 8; b++) { const k = Math.round(im[a * 8 + b] * 16); if (k > 0) { g.fillStyle = col[k]; g.fillRect(x + b * cell, y + a * cell, cell, cell); } }
  }
  if (MOS.size > 6) MOS.delete(MOS.keys().next().value as string);
  MOS.set(key, cv);
  return cv;
}

// ═════════════════════════════════════════════════════════════════════════
// 6 · el VAE: nubes, penalización, sorteo
// ═════════════════════════════════════════════════════════════════════════
const VAE_SUB = Array.from({ length: 42 }, (_, i) => (i * 36 + 5) % L.NTR);
// Imagen de entrenamiento cuya nube se enseña (un «0» aislado, a la izquierda del plano). Elegida a propósito, entre las imágenes cuyas cinco muestras
// (NOISE_EPS) se leen como su propio dígito: sirve para ver el mecanismo, no como estadística. (Con la primera imagen de dígito «2»,
// cuya nube cae junto a los «1», las cinco muestras salían como «1» y la escena contradecía a la voz.)
const NOISE_IMG = 845;
const NOISE_EPS = (() => { const r = rng(21); return Array.from({ length: 5 }, () => [gauss(r), gauss(r)] as [number, number]); })();
const VAE_DRAW = L.drawVAE(8, 33);

function vaePlot(S: Frame) {
  const Rg = R_(S, 0.62, 0.7), m = Rg.main, side = Math.min(m.w, m.h), sq: Rect = { x: m.x + (m.w - side) / 2, y: m.y + (m.h - side) / 2, w: side, h: side };
  const probe = new Plot(S, sq, { xr: [0, 1], yr: [0, 1], pad: { l: 36, r: 10, t: 10, b: 34 } }), half = 3.3, asp = probe.r.h / probe.r.w;
  return { Rg, plot: new Plot(S, sq, { xr: [-half, half], yr: [-half * asp, half * asp], pad: { l: 36, r: 10, t: 10, b: 34 } }) };
}
function drawVae(S: Frame) {
  const { d, pal: p } = S, u = S.u, { Rg, plot } = vaePlot(S), r = plot.r, A = Rg.aside, vd = L.CODES_VAE, lat = tone(S, 'lat');
  axes(S, plot, { xTicks: [-2, 0, 2], yTicks: [-2, 0, 2], xLabel: 'z₁', yLabel: 'z₂', a: S.reveal('vae-cloud', 0, 0.5) });
  d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1 });
  const aKL = S.reveal('vae-kl', 0.2, 0.9), aSm = S.reveal('vae-sample', 0, 0.6);
  // nubes
  const aCl = S.reveal('vae-cloud', 0.2, 0.6) * (1 - 0.65 * aKL);
  if (aCl > 0) d.withAlpha(aCl, () => plot.clip(() => VAE_SUB.forEach((i, k) => {
    const t = tone(S, digTone(L.LAB[i])), a = S.reveal('vae-cloud', 0.2 + 0.03 * k, 0.4);
    const pts = ellipsePts(plot.X(vd.x[i]), plot.Y(vd.y[i]), Math.abs(plot.X(vd.sx![i]) - plot.X(0)), Math.abs(plot.Y(vd.sy![i]) - plot.Y(0)), 28);
    d.withAlpha(a, () => { d.polygon(pts, { fill: alpha(t.c, 0.12), stroke: t.c, lw: 1.8 }); mark(S, plot.X(vd.x[i]), plot.Y(vd.y[i]), L.LAB[i], 2.6 * u); });
  })));
  // sorteo dentro de una nube (entrenamiento)
  if (S.between('vae-noise', 'vae-kl')) {
    const i = NOISE_IMG, cx = plot.X(vd.x[i]), cy = plot.Y(vd.y[i]), t = tone(S, 'sig');
    const rx = Math.abs(plot.X(vd.sx![i]) - plot.X(0)), ry = Math.abs(plot.Y(vd.sy![i]) - plot.Y(0));
    d.withAlpha(S.reveal('vae-noise', 0, 0.5), () => d.polygon(ellipsePts(cx, cy, rx, ry, 32), { stroke: p.ink, lw: 3, fill: alpha(t.c, 0.12) }));
    const lay = tileLayout(A, 6, { cols: S.portrait ? 6 : 3, gap: 8 * u, extraH: 18 * u, maxCell: 6 });
    const q0 = lay.pos(0);
    d.withAlpha(S.reveal('vae-noise', 0.3, 0.5), () => { digit(S, q0.x, q0.y, L.img(i), lay.cell, {}); d.text(S.l('imagen', 'image'), q0.x + lay.tile / 2, q0.y + lay.tile + 3 * u, { size: fs(S, 12.5), weight: 700, color: p.ink2, align: 'center', base: 'top' }); });
    NOISE_EPS.forEach(([e0, e1], k) => {
      const z0 = vd.x[i] + vd.sx![i] * e0, z1 = vd.y[i] + vd.sy![i] * e1, a = S.reveal('vae-noise', 0.9 + 0.45 * k, 0.4), q = lay.pos(k + 1);
      d.withAlpha(a, () => {
        d.circle(plot.X(z0), plot.Y(z1), 6.5 * u, { fill: p.stage, stroke: t.c, lw: 2.4 });
        d.text(String(k + 1), plot.X(z0), plot.Y(z1) - 12 * u, { size: fs(S, 12.5), weight: 800, color: t.ink, align: 'center', base: 'bottom', halo: p.stage });
        digit(S, q.x, q.y, L.decVAE(z0, z1), lay.cell, { kind: 'model' });
        d.text(String(k + 1), q.x + lay.tile / 2, q.y + lay.tile + 3 * u, { size: fs(S, 12.5), weight: 800, color: t.ink, align: 'center', base: 'top' });
      });
    });
  }
  // la penalización: todos los códigos, y los anillos de la campana estándar
  if (aKL > 0) {
    d.withAlpha(aKL, () => {
      plot.clip(() => { for (let i = 0; i < L.NTR; i++) mark(S, plot.X(vd.x[i]), plot.Y(vd.y[i]), L.LAB[i], 2.3 * u, 0.7); });
      [1, 2].forEach((k) => d.polyline(ellipsePts(plot.X(0), plot.Y(0), Math.abs(plot.X(k) - plot.X(0)), Math.abs(plot.Y(k) - plot.Y(0)), 64), p.ink, 2.2, { dash: [7, 5], a: 0.9 }));
      badge(S, S.l('campana estándar', 'standard bell'), plot.X(0), plot.Y(2) - 14 * u, { tone: 'ink', size: fs(S, 12.5) });
    });
    if (S.between('vae-kl', 'vae-sample')) d.withAlpha(S.reveal('vae-kl', 0.8, 0.6), () => lossBox(S, A));
  }
  // sorteo
  if (aSm > 0) {
    const t = tone(S, 'sig'), lay = tileLayout(A, 8, { cols: S.portrait ? 8 : 4, gap: 8 * u, extraH: 18 * u, maxCell: 6 });
    VAE_DRAW.z.forEach(([z0, z1], k) => {
      const a = S.reveal('vae-sample', 0.4 + 0.4 * k, 0.4), q = lay.pos(k);
      d.withAlpha(a, () => {
        d.circle(plot.X(z0), plot.Y(z1), 7 * u, { fill: p.stage, stroke: t.c, lw: 2.4, dash: [3, 2.5] });
        d.text(String(k + 1), plot.X(z0), plot.Y(z1) - 12 * u, { size: fs(S, 12.5), weight: 800, color: t.ink, align: 'center', base: 'bottom', halo: p.stage });
        digit(S, q.x, q.y, VAE_DRAW.img[k], lay.cell, { kind: 'model' });
        d.text(String(k + 1), q.x + lay.tile / 2, q.y + lay.tile + 3 * u, { size: fs(S, 12.5), weight: 800, color: t.ink, align: 'center', base: 'top' });
      });
    });
    void lat;
  }
}
function lossBox(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, er = tone(S, 'err'), lt = tone(S, 'lat');
  const sz = fs(S, S.portrait ? 14 : 15), x = A.x + 2, w = A.w - 6;
  d.text(S.l('pérdida =', 'loss ='), x, A.y + 4, { size: sz, weight: 800, color: p.ink, base: 'top' });
  d.text(S.l('error de reconstrucción', 'reconstruction error'), x, A.y + 4 + 22 * u, { size: sz, weight: 700, color: er.ink, base: 'top', w });
  d.text('+', x, A.y + 4 + 44 * u, { size: sz, weight: 800, color: p.ink, base: 'top' });
  d.text(S.l('penalización (hacia la campana)', 'penalty (toward the bell)'), x + 16 * u, A.y + 4 + 44 * u, { size: sz, weight: 700, color: lt.ink, base: 'top', w: w - 16 * u });
  d.text(S.l('compiten entre sí', 'they compete'), x, A.y + A.h - 4, { size: fs(S, 12.5), color: p.mute, weight: 600, base: 'bottom' });
}

// ═════════════════════════════════════════════════════════════════════════
// 7 · sortear con cada modelo
// ═════════════════════════════════════════════════════════════════════════
function drawCompare(S: Frame) {
  const { d, pal: p } = S, u = S.u, st = stOf(S), c = st.cmp;
  const inRes = S.on('result');
  const fRes = S.at('result', 0, 0.7);
  const Rg = R_(S, 0.6, 0.62), m = Rg.main, A = Rg.aside;
  // rejilla de las últimas 32 imágenes
  if (fRes < 1) d.withAlpha(1 - fRes, () => {
    const hasLast = !!c.last, ttl = c.last ? (c.lastModel === 'ae' ? S.l('Autocodificador: puntos al azar dentro del recuadro de sus códigos', 'Autoencoder: random points inside the box of its codes') : S.l('VAE: puntos de la campana estándar', 'VAE: points from the standard bell')) : S.l('Pulsa «Sortear 32 imágenes»', 'Press “Draw 32 images”');
    d.text(ttl, m.x + 2, m.y + 2, { size: fs(S, 13), weight: 700, color: hasLast ? (c.lastModel === 'ae' ? p.ink : tone(S, 'lat').ink) : p.mute, base: 'top', w: m.w - 4 });
    const lay = tileLayout({ x: m.x, y: m.y + 40 * u, w: m.w, h: m.h - 40 * u }, 32, { cols: 8, gap: 4 * u, maxCell: 6, valign: 'top' });
    if (c.last) c.last.img.forEach((im, i) => { const q = lay.pos(i); digit(S, q.x, q.y, im, lay.cell, { kind: 'model', hl: undefined }); });
    else for (let i = 0; i < 32; i++) { const q = lay.pos(i); d.rect(q.x, q.y, lay.tile, lay.tile, { stroke: p.line, lw: 1, dash: [3, 3], a: 0.7 }); }
    d.withAlpha(S.reveal('try3', 0.3, 0.6), () => d.text(S.l('cada imagen es un punto sorteado y decodificado', 'each image is a drawn point, decoded'), m.x + 2, m.y + m.h - 2, { size: fs(S, 12), color: p.mute, base: 'bottom', w: m.w - 4 }));
  });
  // histogramas por dígito (los acumulados al sortear, en el lateral)
  const hA: Rect = S.portrait ? { x: A.x, y: A.y, w: A.w / 2 - 8 * u, h: A.h } : { x: A.x, y: A.y, w: A.w, h: A.h / 2 - 6 * u };
  const hB: Rect = S.portrait ? { x: A.x + A.w / 2 + 8 * u, y: A.y, w: A.w / 2 - 8 * u, h: A.h } : { x: A.x, y: A.y + A.h / 2 + 6 * u, w: A.w, h: A.h / 2 - 6 * u };
  const ttl = (name: string, n: number) => S.l(`${name} · ${n} sorteos`, `${name} · ${n} draws`);
  const aeN = c.presses.ae * 32, vaeN = c.presses.vae * 32;
  if (fRes < 1) d.withAlpha(1 - fRes, () => {
    digitBars(S, hA, c.ae, { tone: 'sig', title: ttl(S.l('Autocod.', 'Autoenc.'), aeN), n: aeN, stats: aeN >= 96, refOutside: !S.portrait });
    digitBars(S, hB, c.vae, { tone: 'lat', title: ttl('VAE', vaeN), n: vaeN, stats: vaeN >= 96, refOutside: !S.portrait });
  });
  // tras mil sorteos con cada modelo: los dos gráficos ocupan toda la escena
  if (inRes) {
    const res = result(), F = inset(S.full(), 14 * u, 12 * u);
    d.withAlpha(fRes, () => {
      d.text(S.l('Reparto de dígitos tras mil sorteos con cada modelo', 'Digit mix after a thousand draws with each model'), F.x, F.y, { size: fs(S, 14), weight: 800, color: p.ink, base: 'top', w: F.w });
      const th = (S.portrait ? 40 : 22) * u;
      d.text(S.l('Línea punteada: la mezcla de los datos reales (cerca del 10 % de cada dígito). El autocodificador sortea en su recuadro; el VAE, de la campana estándar.', 'Dashed line: the mix of the real data (close to 10% of each digit). The autoencoder draws inside its box; the VAE, from the standard bell.'), F.x, F.y + th, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: F.w });
      const top = F.y + th + (S.portrait ? 60 : 40) * u, hh = F.h - (top - F.y), gap = 16 * u;
      const cA: Rect = S.portrait ? { x: F.x, y: top, w: F.w, h: (hh - gap) / 2 } : { x: F.x, y: top, w: (F.w - gap) / 2, h: hh };
      const cB: Rect = S.portrait ? { x: F.x, y: top + (hh + gap) / 2, w: F.w, h: (hh - gap) / 2 } : { x: F.x + (F.w + gap) / 2, y: top, w: (F.w - gap) / 2, h: hh };
      digitBars(S, cA, res.ae, { tone: 'sig', title: S.l('Autocodificador · 1000 sorteos', 'Autoencoder · 1000 draws'), n: 1000, stats: true, refOutside: true });
      digitBars(S, cB, res.vae, { tone: 'lat', title: S.l('VAE · 1000 sorteos', 'VAE · 1000 draws'), n: 1000, stats: true, refOutside: true });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 8 · ¿collage? memorización, nitidez, resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawCollage(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = R_(S, 0.7, 0.72), P = pairs(), D = L.distances();
  const m = R.main, A = R.aside, lat = tone(S, 'lat');
  const lay = tileLayout({ x: m.x, y: m.y + 8 * u, w: m.w, h: m.h * 0.92 }, P.length, { cols: P.length, gap: 10 * u, extraH: 0, maxCell: 8, valign: 'top' });
  const labW = 0;
  void labW;
  const topY = m.y + 28 * u, rowGap = lay.tile + 40 * u;
  d.withAlpha(S.reveal('no-collage', 0.1, 0.5), () => d.text(S.l('generada por el VAE', 'generated by the VAE'), lay.x0, topY - 8 * u, { size: fs(S, 13), weight: 800, color: lat.ink, base: 'bottom' }));
  P.forEach((q, k) => {
    const x = lay.x0 + k * (lay.tile + lay.gap), a = S.reveal('no-collage', 0.3 + 0.35 * k, 0.5);
    d.withAlpha(a, () => {
      digit(S, x, topY, q.g, lay.cell, { kind: 'model' });
      digit(S, x, topY + rowGap, L.img(q.i), lay.cell, { kind: 'real' });
      d.text(`d = ${S.n(q.d, 1)}`, x + lay.tile / 2, topY + lay.tile + 14 * u, { size: fs(S, 13), weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
      d.line(x + lay.tile / 2, topY + lay.tile + 26 * u, x + lay.tile / 2, topY + rowGap - 4, p.lineStrong, 1.5, [3, 3]);
    });
  });
  d.withAlpha(S.reveal('no-collage', 1.2, 0.5), () => d.text(S.l('el dígito de entrenamiento más parecido', 'the most similar training digit'), lay.x0, topY + rowGap + lay.tile + 8 * u, { size: fs(S, 13), weight: 800, color: p.ink2, base: 'top' }));
  // lectura numérica
  const mv = L.mean(D.vae), mr = L.mean(D.real), a2 = S.reveal('no-collage', 2.0, 0.6);
  d.withAlpha(a2, () => {
    const x = A.x + 2;
    d.text(S.l('distancia media al dato de entrenamiento más cercano', 'mean distance to the nearest training data'), x, A.y, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'top', w: A.w - 6 });
    const ry = A.y + (S.portrait ? 34 : 52) * u, cw = A.w / 3, rows = cw < 110;     // lateral estrecho (teléfono horizontal): una lectura debajo de otra
    const reads: [string, number, Tone][] = [[S.l('generadas', 'generated'), mv, 'lat'], [S.l('reales nuevos', 'new real'), mr, 'dat'], [S.l('una copia', 'a copy'), 0, 'err']];
    reads.forEach(([lab, v, t], k) => {
      if (!rows) ro(S, x + k * cw, ry, lab, S.n(v, 2), t, 20);
      else { const yy = ry - 10 * u + k * 38 * u; d.text(lab, x, yy + 12 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'middle' }); d.text(S.n(v, 2), x + A.w * 0.62, yy + 12 * u, { size: 18, weight: 700, font: 'mono', color: tone(S, t).ink, base: 'middle' }); }
    });
    d.text(S.l(`El modelo guarda ${S.n(L.N_PARAMS_VAE, 0)} pesos; los datos son ${S.n(L.NTR * 64, 0)} números.`, `The model stores ${S.n(L.N_PARAMS_VAE, 0)} weights; the data is ${S.n(L.NTR * 64, 0)} numbers.`), x, A.y + A.h - 4, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'bottom', w: A.w - 6 });
  });
}

function drawStrip2(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 16 * u, 18 * u, 12 * u), D = L.distances();
  const rows = [
    { label: S.l('dígitos reales nuevos', 'new real digits'), vals: D.real, tone: 'dat' as Tone, seed: 1, a: S.reveal('caveat', 0.2, 0.5) },
    { label: S.l('generados por nuestro VAE', 'generated by our VAE'), vals: D.vae, tone: 'lat' as Tone, seed: 4, a: S.reveal('caveat', 0.7, 0.5) },
  ];
  const lay = { x: R.x, y: R.y + 40 * u, w: R.w, h: R.h - 40 * u };
  const q = strip(S, lay, rows, { xmax: 4.5, xTicks: [0, 1, 2, 3, 4], xLabel: S.l('distancia al dato de entrenamiento más cercano', 'distance to the nearest training data'), ex: false, zero: 'copy', show: S.at('caveat', 0.5, 2.5, 'lin') });
  d.withAlpha(S.reveal('caveat', 1.6, 0.6), () => {
    badge(S, S.l('una copia estaría aquí: memorización', 'a copy would be here: memorization'), q.X(0) + 8 * u, lay.y + lay.h - q.axisH + 6 * u - 15 * u, { tone: 'err', align: 'left', size: fs(S, 12.5) });
  });
  d.withAlpha(S.reveal('caveat', 0.1, 0.5), () => d.text(S.l('nuestro modelo diminuto no copia; los enormes pueden hacerlo', 'our tiny model does not copy; huge ones can'), R.x + 2, R.y, { size: fs(S, 13), weight: 700, color: p.ink2, base: 'top', w: R.w - 4 }));
}

function drawBlur(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = inset(S.full(), 16 * u, 16 * u), n = S.portrait ? 5 : 8, half = (R.h - 28 * u) / 2, capH = 44 * u, sp = sharp();
  const real = Array.from({ length: n }, (_, i) => L.img(L.NTR + 100 + i)), gen = L.drawVAE(n, 91).img;
  const rows: [string, Float32Array[], 'real' | 'model', number][] = [[S.l('dígitos reales', 'real digits'), real, 'real', 0], [S.l('generados por el VAE', 'generated by the VAE'), gen, 'model', 1]];
  rows.forEach(([label, imgs, kind, i]) => {
    const top = R.y + i * (half + 14 * u), lay = tileLayout({ x: R.x, y: top + capH, w: R.w, h: half - capH - 4 * u }, n, { cols: n, gap: 8 * u, maxCell: 9, valign: 'center' });
    d.withAlpha(i === 0 ? S.reveal('blurry', 0.1, 0.5) : S.reveal('blurry', 0.8, 0.6), () => {
      d.text(label, lay.x0, top + 2, { size: fs(S, 13), weight: 700, color: i ? tone(S, 'lat').ink : p.ink2, base: 'top' });
      imgs.forEach((im, k) => { const q = lay.pos(k); digit(S, q.x, q.y, im, lay.cell, { kind }); });
      const v = i === 0 ? sp.real : sp.vae;
      d.text(S.l(`píxeles bien definidos: ${S.n(v * 100, 0)} %`, `well-defined pixels: ${S.n(v * 100, 0)}%`), lay.x0, top + 2 + 20 * u, { size: fs(S, 12.5), weight: 700, color: i ? tone(S, 'lat').ink : tone(S, 'dat').ink, base: 'top' });
    });
  });
}

function drawRecap(S: Frame) {
  const R = inset(S.full(), 14 * S.u, 16 * S.u), u = S.u;
  const labels = [S.l('datos reales', 'real data'), S.l('distribución aprendida', 'learned distribution'), S.l('sortear', 'draw a sample'), S.l('imagen nueva', 'new image')];
  const tones: Tone[] = ['dat', 'w', 'sig', 'lat'];
  const bw = Math.min(190 * u, S.portrait ? R.w * 0.8 : R.w * 0.21), bh = 54 * u;
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: R.x + (R.w - bw) / 2, y: R.y + 2 * u + i * ((R.h - 8 * u - bh - (62 + 24 * u)) / 3), w: bw, h: bh }))
    : [0, 1, 2, 3].map((i) => ({ x: R.x + i * ((R.w - bw) / 3), y: R.y + R.h * 0.3, w: bw, h: bh }));
  pos.forEach((b, i) => { const a = S.reveal('recap', 0.2 + 0.4 * i, 0.5); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: S.portrait ? 15 : 14 }); });
  for (let i = 0; i < 3; i++) { const a = S.at('recap', 0.6 + 0.4 * i, 1.2 + 0.4 * i); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  // la imagen que se había pedido al empezar
  const last = pos[3], im = VAE_DRAW.img[2], cell = Math.max(4, Math.min(8, Math.floor((S.portrait ? 40 * u : R.h * 0.3) / 8))), a = S.reveal('recap', 2.0, 0.7);
  d_img(S, last, im, cell, a);
}
function d_img(S: Frame, last: Rect, im: Float32Array, cell: number, a: number) {
  const x = last.x + (last.w - 8 * cell) / 2, y = S.portrait ? last.y + last.h + 14 * S.u : last.y + last.h + 22 * S.u;
  digit(S, x, y, im, cell, { kind: 'model', a });
  S.d.text(S.l('un dígito que nunca existió', 'a digit that never existed'), S.portrait ? x + 4 * cell : last.x + last.w, y + 8 * cell + 8 * S.u, { size: fs(S, 13), weight: 700, color: tone(S, 'lat').ink, align: S.portrait ? 'center' : 'right', base: 'top', a, w: Math.max(200, 8 * cell + 80) });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cy - 90 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 50 * u, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('GAN: el falsificador y el detective', 'GANs: the forger and the detective'), cx, cy + 84 * u, { size: 22, weight: 800, align: 'center', w: S.W - 40 * u });
  });
}

export default scene;
