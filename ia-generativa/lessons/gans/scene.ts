// Escena: GAN, el falsificador y el detective. Todo ocurre sobre una recta numérica (los datos son números sueltos):
// arriba, el histograma de los datos reales (dos montañas) y el de los falsos; abajo, la curva del detective: lo que
// responde (de 0 a 1) a cada número. A un lado (o abajo, en el teléfono), los dos jugadores como una tubería.
// Las redes son las de gan-data.ts y detective-data.ts y se ejecutan aquí de verdad (solo la pasada hacia delante, en
// data.ts): nada se simula. Las flechas son la derivada real de log D en cada falso (hacia dónde lo empuja el gradiente).
// La escena hace sola cada demostración (mueve el número a juzgar y el paso de la partida) con S.drive; quien quiere,
// toma el deslizador y la demostración le cede el paso. Se anima por fracciones de cada segmento (fr), no por segundos.
import { Plot, alpha, badge, clamp, hash, lerp, regions, tone, type Frame, type Rect, type SceneFactory } from '../../../../../theme/kit';
import * as M from './data';
import { fit, fr, fz, kk, live, num, pct, steps } from './helpers';
import { bellGlyph, chip, flow, gaugeGlyph, meter, pipeGeom, playerBox } from './players';
import { drawBridge, drawDiff, drawFaces, drawGrid, drawIntro, drawRecap } from './views';

// ── datos fijos de la narración (salen de las redes; verificados en verificacion/gans.md) ──
const DLAST = M.DET_ITS.length - 1;
const DA = (i: number) => M.detAlone(i);
const DA_FINAL = DA(DLAST);
const G0 = M.gen('A', 0);
const EX_Z = 0.8, EX_X = M.fwd(G0, EX_Z);          // 0.8 → 0.07
const PROBE_REAL = 1.6;                              // el detective solo responde 0.95
const XR: [number, number] = [-3.6, 3.6], YMAX = 220;
const BLAST = M.LAST;
const fmtStep = (i: number, lang: 'es' | 'en') => { const s = M.ITS[Math.round(i)].toLocaleString('en-US'); return lang === 'es' ? s.replace(/,/g, ' ') : s; };

// ── estado interactivo ─────────────────────────────────────────────────────
interface St { hi: boolean; lo: boolean; early: boolean }
const fresh = (): St => ({ hi: false, lo: false, early: false });
const stOf = (S: Frame): St => (S.st.q ??= fresh()) as St;

/** Índice de la corrida B según el tiempo (la partida que colapsa se reproduce sola). */
function bIndex(S: Frame): number {
  let st = 0;
  if (S.on('b-run')) st = lerp(0, 300, fr(S, 'b-run', 0.15, 0.85, 'lin'));
  if (S.on('b-stay')) st = lerp(300, 2000, fr(S, 'b-stay', 0.05, 0.9, 'lin'));
  if (S.on('b-wobble')) st = lerp(600, 2000, fr(S, 'b-wobble', 0.12, 0.95, 'lin'));
  return M.ckAt(st);
}

// ── geometría: dos paneles que comparten la recta ──────────────────────────
function lay(S: Frame) {
  const R = regions(S, S.portrait ? 0.66 : 0.64);
  const k = kk(S), sp = S.on('d-scale') ? fr(S, 'd-scale', 0, 0.25, 'io') : 0;
  const gap = 8 * k * sp, ratio = lerp(1, 0.6, sp);
  const top: Rect = { x: R.main.x, y: R.main.y, w: R.main.w, h: (R.main.h - gap) * ratio };
  const bot: Rect = { x: R.main.x, y: top.y + top.h + gap, w: R.main.w, h: R.main.h - top.h - gap };
  // a la derecha caben las palabras del panel del detective («real», «no sé», «falso»)
  const pl = 40, pr = 12 + Math.max(...detWords(S).map(([, t]) => S.d.measure(t, { size: fz(S, 12), weight: 700 }))) / S.u;
  const HP = new Plot(S, top, { xr: XR, yr: [0, YMAX], pad: { l: pl, r: pr, t: 22, b: 24 } });
  const DP = new Plot(S, bot, { xr: XR, yr: [0, 1], pad: { l: pl, r: pr, t: 14, b: 4 } });
  return { R, HP, DP, sp };
}

const detWords = (S: Frame): [number, string][] => [[1, S.l('real', 'real')], [0.5, S.l('no sé', 'can’t tell')], [0, S.l('falso', 'fake')]];

const scene: SceneFactory = () => ({
  controls: [
    { id: 'x', kind: 'slider', label: { es: 'Número que juzga el detective', en: 'Number the detective judges' }, min: -3.5, max: 3.5, step: 0.01, value: 3, from: 'd-test-real', to: 'game', fmt: (v) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2) },
    { id: 'step', kind: 'slider', label: { es: 'Paso de entrenamiento', en: 'Training step' }, min: 0, max: M.LAST, step: 1, value: 0, from: 'live-start', to: 'g-map', fmt: (v, lang) => fmtStep(v, lang) },
  ],

  init(S) { S.st.q = fresh(); },

  update(S) {
    const q = stOf(S);
    // el número que juzga el detective: entra por la derecha hasta 1.6 (real) y luego va al falso de antes, 0.07
    if (S.between('d-test-real', 'game')) {
      let x = lerp(3, PROBE_REAL, fr(S, 'd-test-real', 0.5, 0.72, 'io'));
      if (S.on('d-test-fake')) x = lerp(PROBE_REAL, EX_X, fr(S, 'd-test-fake', 0.05, 0.4, 'io'));
      S.drive('x', Math.round(x * 100) / 100);
      if (S.touched.has('x')) {
        const v = M.judge(DA_FINAL, S.p.x ?? 0);
        if (v > 0.9) q.hi = true;
        if (v < 0.1) q.lo = true;
        if (q.hi && q.lo) S.complete('probe');
      }
    }
    // la partida sana: 0 → 200 → 500 → 2000 pasos
    if (S.between('live-start', 'g-map')) {
      let st = 0;
      if (S.on('live-push')) st = lerp(0, 200, fr(S, 'live-push', 0.15, 0.9, 'lin'));
      if (S.on('live-spread')) st = lerp(200, 500, fr(S, 'live-spread', 0.05, 0.85, 'lin'));
      if (S.on('live-settle')) st = lerp(500, 2000, fr(S, 'live-settle', 0.05, 0.85, 'lin'));
      S.drive('step', M.ckAt(st));
      if (S.touched.has('step')) {
        const it = M.ITS[Math.round(S.p.step ?? 0)];
        if (it < 300) q.early = true;
        if (q.early && it > 1500) S.complete('live');
      }
    }
  },

  render(S) {
    const d = S.d;
    const lineIn = S.at('axis', 0, 0.7), gridIn = S.at('count-intro', 0, 0.7), facesIn = S.at('faces', 0, 0.7);
    const diffIn = S.at('diffusion', 0, 0.7), recIn = S.at('recap', 0, 0.7), brIn = S.at('bridge', 0, 0.7);
    const aI = 1 - lineIn, aL = lineIn * (1 - gridIn), aG = gridIn * (1 - facesIn), aF = facesIn * (1 - diffIn), aD = diffIn * (1 - recIn), aR = recIn * (1 - brIn);
    if (aI > 0.01) d.withAlpha(aI, () => drawIntro(S));
    if (aL > 0.01) d.withAlpha(aL, () => drawLine(S));
    if (aG > 0.01) d.withAlpha(aG, () => drawGrid(S));
    if (aF > 0.01) d.withAlpha(aF, () => drawFaces(S));
    if (aD > 0.01) d.withAlpha(aD, () => drawDiff(S));
    if (aR > 0.01) d.withAlpha(aR, () => drawRecap(S));
    if (brIn > 0.01) d.withAlpha(brIn, () => drawBridge(S));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// La recta: datos reales, falsos y la curva del detective
// ═════════════════════════════════════════════════════════════════════════

/** Qué falsos se muestran (y su opacidad), según el momento de la lección. */
function fakeSource(S: Frame): { hist: number[]; fakes: number[]; a: number; grow: number; run: M.Run | null; i: number } | null {
  if (!S.on('g-many')) return null;
  if (S.on('b-setup')) { const i = bIndex(S), c = M.checkpoint('B', i); return { ...c, a: 1, grow: 1, run: 'B', i }; }
  if (S.on('g-map')) { const c = M.checkpoint('A', BLAST); return { ...c, a: 1, grow: 1, run: 'A', i: BLAST }; }
  if (S.on('live-start')) { const i = Math.round(S.p.step ?? 0), c = M.checkpoint('A', i); return { ...c, a: 1, grow: 1, run: 'A', i }; }
  const c = M.checkpoint('A', 0);
  return { ...c, a: fr(S, 'g-many', 0.25, 0.4), grow: fr(S, 'g-many', 0.3, 0.75, 'io'), run: null, i: 0 };
}

/** Qué detective se muestra: su curva, su red y su opacidad. */
function detSource(S: Frame): { net: M.Net; curve: number[]; a: number; draw: number; run: M.Run | null } | null {
  if (!S.on('d-flat') || (S.on('g-map') && !S.on('b-setup'))) return null;
  if (S.on('b-setup')) { const i = bIndex(S), c = M.checkpoint('B', i); return { net: c.D, curve: c.curve, a: 1, draw: 1, run: 'B' }; }
  if (S.on('live-start')) { const i = Math.round(S.p.step ?? 0), c = M.checkpoint('A', i); return { net: c.D, curve: c.curve, a: 1, draw: 1, run: 'A' }; }
  if (S.on('game')) { const c = M.checkpoint('A', 0); return { net: c.D, curve: c.curve, a: fr(S, 'game', 0.2, 0.4), draw: 1, run: 'A' }; }
  let i = 0;
  if (S.on('d-train')) i = Math.min(DLAST, Math.floor(fr(S, 'd-train', 0.12, 0.92, 'lin') * (DLAST + 0.999)));
  const net = DA(i);
  return { net, curve: M.detCurve(`da${i}`, net), a: 1, draw: S.on('d-train') ? 1 : fr(S, 'd-flat', 0.1, 0.55, 'io'), run: null };
}

function drawLine(S: Frame) {
  const { R, HP, DP, sp } = lay(S), d = S.d, p = S.pal, k = kk(S), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const r = HP.r, base = r.y + r.h;
  const bw = (HP.X(M.BW) - HP.X(0));

  // ── eje horizontal (la recta)
  const ax = fr(S, 'axis', 0.15, 0.5, 'io');
  d.line(r.x, base, r.x + r.w * ax, base, p.lineStrong, 1.5);
  [-3, -2, -1, 0, 1, 2, 3].forEach((v, i) => {
    const a = fr(S, 'axis', 0.3 + i * 0.05, 0.42 + i * 0.05);
    if (a < 0.01) return;
    d.line(HP.X(v), base, HP.X(v), base + 4 * S.u, p.lineStrong, 1.5, undefined, a);
    d.text(v < 0 ? `−${-v}` : String(v), HP.X(v), base + 6 * S.u, { size: fz(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top', a });
  });

  // ── eje vertical: cuántos datos caen en cada tramo
  const ya = fr(S, 'hist', 0.3, 0.45);
  if (ya > 0.01) d.withAlpha(ya, () => {
    d.line(r.x, r.y, r.x, base, p.lineStrong, 1.2);
    [0, 100, 200].forEach((v) => { d.line(r.x - 4 * S.u, HP.Y(v), r.x, HP.Y(v), p.lineStrong, 1.2); d.text(String(v), r.x - 6 * S.u, HP.Y(v), { size: fz(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('cuántos', 'how many'), r.x - 2 * S.u, r.y - 7 * S.u, { size: fz(S, 12.5), weight: 700, color: p.ink2, base: 'bottom' });
  });

  // ── datos reales: primero como puntos, luego como barras
  const dotsA = fr(S, 'real-dots', 0.08, 0.3) * (1 - fr(S, 'hist', 0.35, 0.6));
  if (dotsA > 0.01) M.REAL.forEach((x, i) => {
    if (i % 10) return;
    const y = base - 8 * k - hash(i, 3) * Math.min(40 * k, r.h * 0.35);
    d.circle(HP.X(x), y, 3 * k, { fill: dt.c, stroke: p.stage, lw: 1, a: dotsA * fr(S, 'real-dots', 0.08 + (i / 800) * 0.2, 0.2 + (i / 800) * 0.2) });
  });
  if (S.between('real-dots', 'hist')) {
    const ca = fr(S, 'real-dots', 0.45, 0.6);
    [-1.5, 1.5].forEach((m) => badge(S, m < 0 ? '≈ −1.5' : '≈ 1.5', HP.X(m), base - Math.min(62 * k, r.h * 0.55), { size: fz(S, 12), tone: 'dat', a: ca }));
    badge(S, S.l('muy pocos', 'very few'), HP.X(0), base - Math.min(30 * k, r.h * 0.3), { size: fz(S, 12), a: fr(S, 'real-dots', 0.7, 0.82) });
  }
  const barsGrow = fr(S, 'hist', 0.1, 0.75, 'io');
  if (barsGrow > 0.001) {
    const hl = S.between('live-narrow', 'try-live') ? fr(S, 'live-narrow', 0.1, 0.25) : 0;
    M.REAL_HIST.forEach((v, b) => {
      const g = clamp((barsGrow * 1.6 - (b / M.NB) * 0.6)), h = v * g;
      if (h <= 0) return;
      const x = HP.X(M.binCenter(b) - M.BW / 2);
      d.rect(x + 0.5, HP.Y(h), bw - 1, base - HP.Y(h), { fill: alpha(dt.c, 0.32 + 0.1 * hl) });
    });
    // contorno de la distribución real (en «la meta» se resalta)
    const ga = S.between('goal', 'g-intro') ? fr(S, 'goal', 0.1, 0.3) : 0;
    const outline: [number, number][] = [];
    M.REAL_HIST.forEach((v, b) => { const x0 = HP.X(M.binCenter(b) - M.BW / 2); const h = v * clamp(barsGrow * 1.6 - (b / M.NB) * 0.6); outline.push([x0, HP.Y(h)], [x0 + bw, HP.Y(h)]); });
    d.polyline(outline, dt.c, 1.5 + 1.5 * ga + hl, { a: 0.9 });
    if (ga > 0.01) {
      badge(S, S.l('distribución real', 'real distribution'), HP.X(-1.5), HP.Y(118), { size: fz(S, 12), tone: 'dat', a: ga });
      badge(S, S.l('valle casi vacío', 'nearly empty valley'), HP.X(0), HP.Y(40), { size: fz(S, 12), a: fr(S, 'goal', 0.55, 0.7) });
    }
  }

  // ── el falso del ejemplo (0.8 → 0.07) cae en la recta
  const exA = S.between('g-example', 'g-spike') ? fr(S, 'g-example', 0.62, 0.75) * (1 - fr(S, 'g-many', 0.3, 0.45)) : 0;
  if (exA > 0.01) {
    d.circle(HP.X(EX_X), base - 6 * k, 5 * k, { fill: lt.c, stroke: p.stage, lw: 1.5, a: exA });
    badge(S, num(S, EX_X, 2), HP.X(EX_X), base - 26 * k, { size: fz(S, 12), tone: 'lat', a: exA, mono: true });
  }

  // ── falsos
  const fk = fakeSource(S);
  if (fk && fk.a > 0.01) {
    const pts: [number, number][] = [];
    const clipped: { x: number; v: number }[] = [];
    fk.hist.forEach((v, b) => {
      const x0 = HP.X(M.binCenter(b) - M.BW / 2), h = Math.min(v * fk.grow, YMAX);
      if (v * fk.grow > YMAX) clipped.push({ x: x0 + bw / 2, v });
      pts.push([x0, HP.Y(h)], [x0 + bw, HP.Y(h)]);
      if (h > 0) d.rect(x0 + 0.5, HP.Y(h), bw - 1, base - HP.Y(h), { fill: alpha(lt.c, 0.14), a: fk.a });
    });
    const narrowHl = S.between('live-narrow', 'try-live') ? fr(S, 'live-narrow', 0.1, 0.25) : 0;
    d.polyline(pts, lt.c, 2.5 + 1.5 * narrowHl, { a: fk.a });
    clipped.forEach((c) => {
      const y = r.y + 2 * k;
      d.polygon([[c.x, y - 6 * k], [c.x - 5 * k, y + 2 * k], [c.x + 5 * k, y + 2 * k]], { fill: lt.c, a: fk.a });
      d.text(String(c.v), c.x + 7 * k, y - 4 * k, { size: fz(S, 12), weight: 800, font: 'mono', color: lt.ink, base: 'top', a: fk.a, halo: p.stage });
    });
    // anotaciones
    if (S.between('g-spike', 'd-intro')) badge(S, S.l(`${M.checkpoint('A', 0).hist[14]} de 800 en un tramo`, `${M.checkpoint('A', 0).hist[14]} of 800 in one stretch`), HP.X(0.3), r.y + r.h * 0.45, { size: fz(S, 12), tone: 'lat', a: fr(S, 'g-spike', 0.25, 0.4), align: 'left' });
    if (S.between('live-narrow', 'try-live')) {
      const txt = S.l('angostas y altas', 'narrow and tall');
      badge(S, txt, HP.X(1.72), r.y + r.h * 0.28, { size: fz(S, 12), tone: 'lat', a: fr(S, 'live-narrow', 0.15, 0.3), align: 'left' });
    }
    if (S.between('b-name', 'count-intro') && !S.on('b-wobble')) {
      const a = fr(S, 'b-name', 0.3, 0.45);
      badge(S, S.l('colapso de modo', 'mode collapse'), HP.X(-0.95), r.y + r.h * 0.14, { size: fz(S, 12.5), tone: 'err', a, align: 'left' });
    }
    if (S.between('b-stay', 'count-intro')) {
      const a = fr(S, 'b-stay', 0.55, 0.7);
      badge(S, S.l('vacía: 0 falsos', 'empty: 0 fakes'), HP.X(1.5), HP.Y(130), { size: fz(S, 12), tone: 'err', a });
    }
  }

  // ── zonas «cerca de cada montaña» (a menos de 0.8 de su centro) y el puente del valle
  if (S.between('live-share', 'live-detective')) {
    const a = fr(S, 'live-share', 0.05, 0.2) * (1 - fr(S, 'live-detective', 0, 0.15));
    M.MODES.forEach((m) => d.rect(HP.X(m - 0.8), r.y, HP.X(m + 0.8) - HP.X(m - 0.8), r.h, { fill: alpha(p.ink, 0.06), stroke: alpha(p.ink, 0.35), lw: 1, a }));
  }
  if (S.between('live-valley', 'live-narrow')) {
    const a = fr(S, 'live-valley', 0.45, 0.6);
    const y = HP.Y(48);
    d.line(HP.X(-0.7), y, HP.X(0.7), y, lt.c, 2, undefined, a);
    badge(S, S.l('puente', 'bridge'), HP.X(0), y - 12 * k, { size: fz(S, 12), tone: 'lat', a });
  }

  // ── leyenda del panel de arriba
  const legA = Math.max(fr(S, 'hist', 0.6, 0.75), 0);
  if (legA > 0.01) {
    const items: [string, 'dat' | 'lat', boolean][] = [[S.l('reales', 'real'), 'dat', true]];
    if (fk) items.push([S.l('falsos', 'fakes'), 'lat', false]);
    let lx = r.x + r.w - 4 * k;
    for (let i = items.length - 1; i >= 0; i--) {
      const [t, tn, filled] = items[i], tw = d.measure(t, { size: fz(S, 12), weight: 700 });
      lx -= tw;
      d.text(t, lx, r.y - 7 * S.u, { size: fz(S, 12), weight: 700, color: tone(S, tn).ink, base: 'bottom', a: i === 1 ? fk!.a : legA });
      lx -= 16 * k;
      const sy = r.y - 7 * S.u - 10 * k;
      if (filled) d.rect(lx, sy, 11 * k, 9 * k, { fill: alpha(tone(S, tn).c, 0.4), stroke: tone(S, tn).c, lw: 1, a: legA });
      else d.rect(lx, sy, 11 * k, 9 * k, { stroke: tone(S, tn).c, lw: 2.2, a: i === 1 ? fk!.a : legA });
      lx -= 12 * k;
    }
  }

  // ── panel de abajo: la respuesta del detective (o, en «así quedó», los sorteos z)
  if (sp > 0.01) drawDetPanel(S, HP, DP, sp);

  // ── la tubería y las lecturas
  drawAside(S, R.aside, HP);
}

/** Panel del detective: eje 0–1 con «falso / no sé / real», su curva, flechas de empuje y la sonda. */
function drawDetPanel(S: Frame, HP: Plot, DP: Plot, sp: number) {
  const d = S.d, p = S.pal, k = kk(S), r = DP.r, sg = tone(S, 'sig'), lt = tone(S, 'lat'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const mapA = S.between('g-map', 'b-setup') ? fr(S, 'g-map', 0.05, 0.25) * (1 - fr(S, 'b-setup', 0, 0.2)) : 0;
  const axA = fr(S, 'd-scale', 0.15, 0.35) * (1 - mapA);
  if (axA > 0.01) d.withAlpha(axA * sp, () => {
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.2);
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.2);
    d.line(r.x, DP.Y(1), r.x + r.w, DP.Y(1), p.line, 1);
    d.line(r.x, DP.Y(0.5), r.x + r.w, DP.Y(0.5), p.mute, 1.3, [5, 4]);
    [0, 0.5, 1].forEach((v) => d.text(v === 0.5 ? S.n(0.5, 1) : String(v), r.x - 6 * S.u, DP.Y(v), { size: fz(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }));
    const wa = [fr(S, 'd-scale', 0.3, 0.42), fr(S, 'd-scale', 0.62, 0.74), fr(S, 'd-scale', 0.45, 0.58)];
    const cols = [dt.ink, p.ink2, lt.ink];
    detWords(S).forEach(([v, t], i) => d.text(t, r.x + r.w + 6 * S.u, DP.Y(v), { size: fz(S, 12), weight: 700, color: cols[i], base: 'middle', a: wa[i] }));
    const title = S.l('respuesta del detective', 'detective’s answer');
    d.text(title, r.x + 4 * k, DP.outer.y + 1 * k, { size: fz(S, 12), weight: 700, color: sg.ink, base: 'top', a: fr(S, 'd-scale', 0.1, 0.25) });
  });

  // la curva
  const ds = detSource(S);
  if (ds && ds.a * (1 - mapA) > 0.01) {
    const n = Math.max(2, Math.round(ds.curve.length * ds.draw));
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) pts.push([DP.X(M.curveX(i)), DP.Y(ds.curve[i])]);
    const y5 = DP.Y(0.5);
    const a = ds.a * (1 - mapA);
    // relleno: por encima de 0.5 «parece real», por debajo «parece falso»
    if (pts.length > 1) {
      const poly: [number, number][] = [[pts[0][0], y5], ...pts, [pts[pts.length - 1][0], y5]];
      d.withAlpha(a, () => {
        d.clip(r.x, r.y - 2, r.w, y5 - r.y + 2, () => d.polygon(poly, { fill: alpha(dt.c, 0.16) }));
        d.clip(r.x, y5, r.w, r.y + r.h - y5 + 2, () => d.polygon(poly, { fill: alpha(lt.c, 0.16) }));
      });
    }
    d.polyline(pts, sg.c, 3, { a });
    // flechas: hacia dónde empuja el gradiente a cada falso (derivada real de log D)
    const fk = fakeSource(S);
    const arrowsOn = (S.between('live-push', 'g-map') || S.between('b-run', 'count-intro')) && fk;
    if (arrowsOn && fk) {
      for (let j = 0; j < 7; j++) {
        const x = fk.fakes[57 + j * 114];
        if (x < XR[0] || x > XR[1]) continue;
        const v = M.judge(ds.net, x), e = 1e-3;
        const g = (Math.log(M.judge(ds.net, x + e)) - Math.log(M.judge(ds.net, x - e))) / (2 * e);
        const L = clamp(Math.abs(g) * 110, 0, 38) * k, px = DP.X(x), py = DP.Y(v);
        d.circle(px, py, 3 * k, { fill: S.pal.stage, stroke: lt.c, lw: 2, a });
        if (L > 6 * k) d.arrow(px + Math.sign(g) * 5 * k, py, px + Math.sign(g) * (5 * k + L), py, er.c, 2.4, 7 * k, a);
      }
    }
    // marcas de lectura sobre la curva
    const mark = (x: number, a: number, txt?: string) => {
      if (a < 0.01) return;
      const v = M.judge(ds.net, x), px = DP.X(x), py = DP.Y(v);
      d.circle(px, py, 6 * k, { fill: sg.c, stroke: p.stage, lw: 2, a });
      badge(S, txt ?? num(S, v, 2), px, py + (v > 0.6 ? 18 : -18) * k, { size: fz(S, 12), tone: 'sig', a, mono: true });
    };
    if (S.between('live-valley', 'live-narrow')) mark(0, fr(S, 'live-valley', 0.25, 0.4));
    if (S.between('b-detective', 'b-wobble')) mark(1.5, fr(S, 'b-detective', 0.2, 0.35));
    if (S.on('b-wobble') && !S.on('count-intro')) mark(0, fr(S, 'b-wobble', 0.05, 0.15));
    // «no sé» sobre las montañas
    if (S.between('live-detective', 'live-valley')) {
      const ha = fr(S, 'live-detective', 0.1, 0.25);
      M.MODES.forEach((m) => d.line(DP.X(m - 0.7), DP.Y(0.5), DP.X(m + 0.7), DP.Y(0.5), p.ink, 3, undefined, ha));
      badge(S, S.l('0.5: no sé', '0.5: can’t tell').replace('0.5', S.n(0.5, 1)), DP.X(1.5), DP.Y(0.5) - 16 * k, { size: fz(S, 12), a: ha });
    }
  }

  // la sonda: el número que juzga el detective
  if (S.between('d-test-real', 'game')) {
    const a = fr(S, 'd-test-real', 0.45, 0.55) * (1 - fr(S, 'game', 0, 0.15));
    const x = S.p.x ?? 3, v = M.judge(DA_FINAL, x), px = DP.X(x), py = DP.Y(v);
    d.withAlpha(a, () => {
      d.line(px, HP.r.y, px, r.y + r.h, p.ink2, 1.5, [4, 4]);
      const by = HP.r.y + HP.r.h;
      d.polygon([[px, by - 7 * k], [px + 6 * k, by], [px, by + 7 * k], [px - 6 * k, by]], { fill: p.ink, stroke: p.stage, lw: 1.5 });
      d.circle(px, py, 6.5 * k, { fill: sg.c, stroke: p.stage, lw: 2 });
      const txt = num(S, v, 2), tw = d.measure(txt, { size: 14, weight: 800, font: 'mono' });
      const right = px + 12 * k + tw < r.x + r.w;
      d.text(txt, right ? px + 11 * k : px - 11 * k, py + (v > 0.5 ? 12 : -12) * k, { size: 14, weight: 800, font: 'mono', color: sg.ink, align: right ? 'left' : 'right', base: 'middle', halo: p.stage });
    });
  }

  // así quedó el falsificador: cada sorteo z (abajo) va a su número x (arriba)
  if (mapA > 0.01) {
    const g = M.gen('A', BLAST), zy = r.y + r.h - 4 * k, top = HP.r.y + HP.r.h;
    d.withAlpha(mapA, () => {
      // la campana de los sorteos
      const pts: [number, number][] = [];
      for (let i = 0; i <= 80; i++) { const z = -3 + (6 * i) / 80; pts.push([DP.X(z), zy - Math.exp(-z * z / 2) * (r.h * 0.55)]); }
      d.polygon([[DP.X(-3), zy], ...pts, [DP.X(3), zy]], { fill: alpha(lt.c, 0.12) });
      d.polyline(pts, lt.c, 1.8);
      d.line(r.x, zy, r.x + r.w, zy, p.lineStrong, 1.2);
      d.text(S.l('sorteo z (campana estándar)', 'draw z (standard bell)'), r.x + 4 * k, r.y + 2 * k, { size: fz(S, 12), weight: 700, color: lt.ink, base: 'top', halo: p.stage, haloW: 5 });
      const n = 21;
      for (let i = 0; i < n; i++) {
        const z = M.ZQ[Math.round(((i + 0.5) / n) * (M.NZ - 1))], x = M.fwd(g, z);
        const t = fr(S, 'g-map', 0.15 + i * 0.02, 0.35 + i * 0.02, 'io');
        if (t < 0.01) continue;
        const c = z < 0 ? tone(S, 'lat').c : tone(S, 'sig').c;
        const x0 = DP.X(z), x1 = DP.X(x);
        d.line(x0, zy, lerp(x0, x1, t), lerp(zy, top, t), alpha(c, 0.8), 1.4);
        d.circle(x0, zy, 3 * k, { fill: c });
      }
      const la = fr(S, 'g-map', 0.6, 0.75);
      badge(S, 'z < 0', DP.X(-2.75), DP.Y(0.42), { size: fz(S, 12), tone: 'lat', a: la, mono: true });
      badge(S, 'z > 0', DP.X(2.75), DP.Y(0.42), { size: fz(S, 12), tone: 'sig', a: la, mono: true });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// La zona de los jugadores (lateral en escritorio, inferior en teléfono)
// ═════════════════════════════════════════════════════════════════════════
function drawAside(S: Frame, A: Rect, HP: Plot) {
  const d = S.d;
  // 800 datos reales
  const nA = live(S, 'hist', 'g-intro', 0.2, 0.15) * fr(S, 'hist', 0.15, 0.3);
  if (nA > 0.01) {
    const t = S.l('800 datos reales', '800 real data points');
    d.text(t, A.x + A.w / 2, A.y + A.h / 2, { size: fit(S, t, A.w, 16, 800), weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'middle', a: nA });
  }
  const pipeA = S.between('g-intro', 'live-start') ? 1 : S.between('live-start', 'live-push') ? 1 - fr(S, 'live-start', 0, 0.2) : 0;
  if (pipeA > 0.01) d.withAlpha(pipeA, () => drawPipe(S, A, HP));
  const readA = S.on('live-start') ? fr(S, 'live-start', 0.15, 0.35) : 0;
  if (readA > 0.01) d.withAlpha(readA, () => drawReadouts(S, A));
}

function drawPipe(S: Frame, A: Rect, HP: Plot) {
  const d = S.d, p = S.pal, k = kk(S), P = pipeGeom(S, A), lt = tone(S, 'lat'), sg = tone(S, 'sig'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const gA = fr(S, 'g-intro', 0.05, 0.25), bA = fr(S, 'g-noise', 0.05, 0.25), dA = fr(S, 'd-intro', 0.05, 0.25);
  const inGame = S.on('game');
  const hotD = S.between('turn-d', 'turn-g') ? fr(S, 'turn-d', 0.05, 0.2) : 0, hotG = S.between('turn-g', 'arms') ? fr(S, 'turn-g', 0.05, 0.2) : 0;
  // en «arms» se encienden por turnos
  let armsD = 0, armsG = 0;
  if (S.between('arms', 'live-start')) { const t = fr(S, 'arms', 0.05, 0.75, 'lin'), ph = Math.floor(t * 4); if (t < 1) { if (ph % 2 === 0) armsG = 1; else armsD = 1; } }
  // la campana (sorteo z)
  const zA = S.between('g-example', 'g-many') ? fr(S, 'g-example', 0.08, 0.2) : 0;
  const bellLab = S.portrait ? 1 - fr(S, 'turn-g', 0.4, 0.55) : 1;   // en el teléfono cede su sitio a «no ve datos reales»
  bellGlyph(S, P.bell, { a: bA, z: EX_Z, zA, zText: num(S, EX_Z, 2), many: S.on('g-many') ? fr(S, 'g-many', 0.05, 0.2) : 0, label: S.l('sorteo z', 'draw z'), labelA: bellLab });
  flow(S, P, P.bell, P.G, { a: Math.min(gA, bA) });
  playerBox(S, P.G, S.l('generador', 'generator'), S.l('falsificador', 'forger'), 'lat', { a: gA, hot: Math.max(hotG, armsG) });
  // la ficha con el dato que sale
  flow(S, P, P.G, P.chip, { a: gA });
  let chipTxt = '?', chipA = gA * 0.6;
  if (S.between('g-example', 'g-many')) { const t = fr(S, 'g-example', 0.35, 0.5); chipTxt = t > 0.5 ? num(S, EX_X, 2) : '?'; chipA = gA; }
  else if (S.between('g-many', 'd-test-real')) { chipTxt = '×800'; chipA = gA; }
  else if (S.between('d-test-real', 'game')) { chipTxt = num(S, S.p.x ?? 3, 2); chipA = 1; }
  else if (inGame) { chipTxt = S.l('falsos', 'fakes'); chipA = 1; }
  chip(S, P.chip, chipTxt, { a: chipA, tone: S.between('d-test-real', 'game') ? 'ink' : 'lat', caption: P.mode === 'row' ? S.l('dato x', 'data x') : undefined, below: true });
  // el detective
  flow(S, P, P.chip, P.D, { a: dA });
  playerBox(S, P.D, S.l('discriminador', 'discriminator'), S.l('detective', 'detective'), 'sig', { a: dA, hot: Math.max(hotD, armsD) });
  flow(S, P, P.D, P.gauge, { a: dA });
  let gv: number | null = null;
  if (S.between('d-test-real', 'game')) gv = M.judge(DA_FINAL, S.p.x ?? 3);
  gaugeGlyph(S, P.gauge, gv, { a: dA, caption: S.l('¿real?', 'real?') });
  // el entrenamiento del detective solo: paso a paso hasta mil (debajo de la tubería)
  if (S.between('d-train', 'try-probe')) {
    const a = fr(S, 'd-train', 0.08, 0.18) * (1 - fr(S, 'd-test-real', 0.35, 0.5));
    const i = S.on('d-test-real') ? DLAST : Math.min(DLAST, Math.floor(fr(S, 'd-train', 0.12, 0.92, 'lin') * (DLAST + 0.999)));
    const t = S.l(`detective entrenado solo: paso ${steps(S, M.DET_ITS[i])} de ${steps(S, 1000)}`, `detective trained alone: step ${steps(S, M.DET_ITS[i])} of ${steps(S, 1000)}`);
    d.text(t, A.x + A.w / 2, A.y + A.h - 2 * k, { size: fit(S, t, A.w, 12.5, 700), weight: 700, color: sg.ink, align: 'center', base: 'bottom', a });
  }
  // durante el juego: los reales entran al detective y la respuesta regresa al falsificador
  if (inGame) {
    const ra = fr(S, 'turn-d', 0.2, 0.4), ba = fr(S, 'turn-g', 0.25, 0.45);
    d.withAlpha(ra, () => {
      const lab = S.l('reales', 'real');
      if (P.mode === 'row') {
        // desde arriba (el histograma está encima)
        const x = P.D.x + P.D.w / 2, y0 = A.y - 4 * k;
        d.arrow(x, y0, x, P.D.y - 3 * k, dt.c, 2.2, 8 * k);
        d.text(lab, x + 5 * k, y0 + 2 * k, { size: fz(S, 12), weight: 700, color: dt.ink, base: 'top' });
      } else {
        // desde la izquierda (el histograma está a la izquierda)
        const y = P.D.y + P.D.h / 2, x0 = A.x - 2 * k;
        d.arrow(x0, y, P.D.x - 3 * k, y, dt.c, 2.2, 8 * k);
        d.text(lab, x0 + 4 * k, y - 5 * k, { size: fz(S, 12), weight: 700, color: dt.ink, base: 'bottom' });
      }
    });
    d.withAlpha(ba, () => {
      const lab = S.l('respuesta', 'answer');
      if (P.mode === 'column') {
        const xR = Math.min(A.x + A.w - 4 * k, P.D.x + P.D.w + 26 * k), y1 = P.gauge.y + P.gauge.h / 2, y0 = P.G.y + P.G.h / 2;
        d.polyline([[P.gauge.x + P.gauge.w + 4 * k, y1], [xR, y1], [xR, y0]], er.c, 2, { dash: [5, 4] });
        d.arrow(xR, y0, P.G.x + P.G.w + 3 * k, y0, er.c, 2, 8 * k);
        d.text(lab, xR - 4 * k, (y0 + y1) / 2, { size: fz(S, 12), weight: 700, color: er.ink, align: 'right', base: 'middle', halo: p.stage });
      } else if (P.mode === 'compact') {
        const x = P.gauge.x + P.gauge.w / 2, y0 = P.G.y + P.G.h / 2;
        d.line(x, P.gauge.y - 4 * k, x, y0, er.c, 2, [5, 4]);
        d.arrow(x, y0, P.G.x + P.G.w + 3 * k, y0, er.c, 2, 8 * k);
        d.text(lab, x - 4 * k, P.chip.y + P.chip.h / 2, { size: fz(S, 12), weight: 700, color: er.ink, align: 'right', base: 'middle', halo: p.stage });
      } else {
        const yB = Math.min(A.y + A.h - 4 * k, P.G.y + P.G.h + 24 * k), x1 = P.gauge.x + P.gauge.w / 2, x0 = P.G.x + P.G.w / 2;
        d.polyline([[x1, P.gauge.y + P.gauge.h + 4 * k], [x1, yB], [x0, yB]], er.c, 2, { dash: [5, 4] });
        d.arrow(x0, yB, x0, P.G.y + P.G.h + 3 * k, er.c, 2, 8 * k);
        d.text(lab, (x0 + x1) / 2, yB - 3 * k, { size: fz(S, 12), weight: 700, color: er.ink, align: 'center', base: 'bottom', halo: p.stage });
      }
    });
    // el falsificador nunca ve un dato real
    const nv = fr(S, 'turn-g', 0.55, 0.7) * (1 - fr(S, 'arms', 0, 0.15));
    if (nv > 0.01) {
      const t = S.l('no ve datos reales', 'sees no real data');
      const [gx, gy] = P.vertical ? [P.G.x + P.G.w / 2, P.G.y - 4 * k] : [P.G.x + P.G.w / 2, P.G.y - 4 * k];
      d.text(t, gx, gy, { size: fit(S, t, P.vertical ? A.w : P.G.w + 40 * k, 12, 700), weight: 700, color: er.ink, align: 'center', base: 'bottom', a: nv, halo: p.stage });
    }
    const aa = fr(S, 'arms', 0.75, 0.9) * (1 - fr(S, 'live-start', 0, 0.2));
    if (aa > 0.01) {
      const t = S.l('uno mejora → el otro debe mejorar', 'one improves → the other must too');
      // en la columna lateral va arriba; en el teléfono, abajo de la tubería
      d.text(t, A.x + A.w / 2, P.vertical ? A.y + 2 * k : A.y + A.h - 2 * k, { size: fit(S, t, A.w, 12.5, 700), weight: 700, color: p.ink, align: 'center', base: P.vertical ? 'top' : 'bottom', a: aa });
    }
  }
  // el falso del ejemplo vuela de la ficha a la recta
  if (S.between('g-example', 'g-many')) {
    const t = fr(S, 'g-example', 0.5, 0.68, 'io');
    if (t > 0.01 && t < 0.99) {
      const [cx, cy] = [P.chip.x + P.chip.w / 2, P.chip.y + P.chip.h / 2], tx = HP.X(EX_X), ty = HP.r.y + HP.r.h - 6 * k;
      d.circle(lerp(cx, tx, t), lerp(cy, ty, t) - Math.sin(t * Math.PI) * 30 * k, 5 * k, { fill: lt.c, stroke: p.stage, lw: 1.5 });
    }
  }
}

function drawReadouts(S: Frame, A: Rect) {
  const d = S.d, p = S.pal, k = kk(S), lt = tone(S, 'lat'), dt = tone(S, 'dat'), sg = tone(S, 'sig'), er = tone(S, 'err');
  const isB = S.on('b-setup');
  const run: M.Run = isB ? 'B' : 'A';
  const i = isB ? bIndex(S) : S.on('g-map') ? BLAST : Math.round(S.p.step ?? 0);
  const c = M.checkpoint(run, i);
  let top = A.y + 4 * k;
  // la regla de la partida que colapsa, a todo lo ancho
  if (isB) {
    const a = fr(S, 'b-setup', 0.35, 0.55), size = fz(S, 12.5);
    const t = S.l('detective: 5 pasos por cada paso del falsificador', 'detective: 5 steps per forger step');
    const lines = d.wrap(t, A.w, { size, weight: 800 });
    d.text(lines.join('\n'), A.x, top, { size, weight: 800, color: er.ink, base: 'top', a });
    top += lines.length * size * S.u * 1.3 + 8 * k;
  }
  // dos columnas en el teléfono (paso | lo demás); una sola en la columna lateral
  const portrait = S.portrait, lw = portrait ? Math.min(A.w * 0.32, 120 * k) : A.w;
  const L: Rect = { x: A.x, y: top, w: portrait ? lw - 10 * k : A.w, h: 0 };
  const Rt: Rect = portrait ? { x: A.x + lw, y: top, w: A.w - lw, h: 0 } : { x: A.x, y: top + 62 * k, w: A.w, h: 0 };
  // el paso de la partida
  const val = steps(S, c.it), of = S.l(`de ${steps(S, 2000)} pasos`, `of ${steps(S, 2000)} steps`);
  d.text(S.l('paso', 'step'), L.x, L.y, { size: fz(S, 12), weight: 700, color: p.mute, base: 'top' });
  d.text(val, L.x, L.y + 15 * k, { size: fit(S, val, L.w, 24, 800, 'mono'), weight: 800, font: 'mono', color: p.ink, base: 'top' });
  d.text(of, L.x, L.y + 44 * k, { size: fit(S, of, L.w, 12, 600), weight: 600, color: p.mute, base: 'top' });
  const bx = Rt.x, bwid = Rt.w;
  let yy = Rt.y;
  const legendOnly = S.between('live-start', 'live-share') || (isB && !S.on('b-detective'));
  if (legendOnly) {
    const items: [string, string, 'box' | 'line' | 'arrow'][] = [
      [S.l('reales', 'real'), dt.c, 'box'], [S.l('falsos', 'fakes'), lt.c, 'box'], [S.l('curva del detective', 'detective’s curve'), sg.c, 'line'],
    ];
    if (S.on('live-push') || isB) items.push([S.l('hacia dónde se mueve un falso', 'where a fake moves'), er.c, 'arrow']);
    items.forEach(([t, c2, kind]) => {
      const sx = bx, sy = yy + 7 * k;
      if (kind === 'box') d.rect(sx, sy - 5 * k, 12 * k, 10 * k, { fill: alpha(c2, 0.35), stroke: c2, lw: 1.5 });
      else if (kind === 'line') d.line(sx, sy, sx + 12 * k, sy, c2, 3);
      else d.arrow(sx, sy, sx + 14 * k, sy, c2, 2.2, 6 * k);
      d.text(t, sx + 20 * k, sy, { size: fit(S, t, bwid - 22 * k, 12.5, 600), weight: 600, color: p.ink2, base: 'middle' });
      yy += 19 * k;
    });
    if (isB && S.on('b-stay')) {
      const nR = c.fakes.filter((v) => Math.abs(v - 1.5) < 0.8).length;
      const t = S.l(`falsos cerca de la montaña derecha: ${nR}`, `fakes near the right mountain: ${nR}`);
      const lines = d.wrap(t, portrait ? bwid : A.w, { size: fz(S, 12.5), weight: 800 });
      d.text(lines.join('\n'), portrait ? bx : A.x, yy + 4 * k, { size: fz(S, 12.5), weight: 800, color: er.ink, base: 'top', a: fr(S, 'b-stay', 0.5, 0.65) });
    }
    return;
  }
  if (S.between('live-share', 'live-detective')) {
    // tabla: qué parte cae cerca de cada montaña, falsos y reales
    const a = fr(S, 'live-share', 0.1, 0.25), ra = fr(S, 'live-share', 0.62, 0.75);
    const realC = M.coverage(M.REAL), cols = [S.l('izquierda', 'left'), S.l('derecha', 'right')];
    const c0 = bx + Math.min(bwid * 0.36, 80 * k), cw = (bx + bwid - c0) / 2;
    d.withAlpha(a, () => {
      const head = S.l('cerca de la montaña…', 'near the mountain…');
      d.text(head, bx, yy, { size: fit(S, head, bwid, 12, 700), weight: 700, color: p.mute, base: 'top' });
      yy += 18 * k;
      cols.forEach((t, j) => d.text(t, c0 + cw * (j + 0.5), yy, { size: fit(S, t, cw - 4 * k, 12.5, 700), weight: 700, color: p.ink2, align: 'center', base: 'top' }));
      yy += 20 * k;
      ([[S.l('falsos', 'fakes'), c.cov, lt.ink, 1], [S.l('reales', 'real'), realC, dt.ink, ra]] as [string, [number, number], string, number][]).forEach(([t, cv, col, aa]) => {
        d.withAlpha(aa, () => {
          d.text(t, bx, yy, { size: fit(S, t, c0 - bx - 4 * k, 13, 700), weight: 700, color: col, base: 'top' });
          cv.forEach((v, j) => d.text(pct(S, v), c0 + cw * (j + 0.5), yy, { size: 14, weight: 800, font: 'mono', color: col, align: 'center', base: 'top' }));
        });
        yy += 22 * k;
      });
    });
    return;
  }
  // respuesta promedio del detective (desde «ya no distingue»)
  const a = isB ? 1 : fr(S, 'live-detective', 0.45, 0.6);
  const head = S.l('respuesta promedio del detective', 'detective’s average answer');
  d.text(head, bx, yy, { size: fit(S, head, bwid, 12, 700), weight: 700, color: sg.ink, base: 'top', a });
  yy += 18 * k;
  yy += meter(S, bx, yy, bwid, S.l('a los reales', 'to real data'), c.dReal, 'dat', { a });
  meter(S, bx, yy, bwid, S.l('a los falsos', 'to fakes'), c.dFake, 'lat', { a: a * (isB ? 1 : fr(S, 'live-detective', 0.7, 0.85)) });
}

export default scene;
