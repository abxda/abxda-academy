// Escena: Programar o aprender. Un correo se vuelve dos números y un punto; la persona escribe una regla a mano y
// la prueba con correos nuevos; luego la máquina encuentra la frontera a partir de los ejemplos (entrenamiento real,
// aquí a pequeña escala) y se usa con casos que nunca vio. Los datos son sintéticos y se rotulan como ilustrativos.
// Las animaciones se reparten por fracciones de cada segmento (fr): así siguen a la voz en cualquier idioma.
import { Plot, alpha, badge, clamp, hash, lerp, neu, regions, tone, type Frame, type Rect, type SceneFactory } from '../../../../../theme/kit';
import {
  BAD, BAD_PATH, BY_N, DEMO, FINAL, FRESH, MAIL, PATH, SIZES, START, TRAIN, handHits, handSpam, isUsed, measureMail, modelHits, modelSpam,
  score, stepAt, subset, type Model,
} from './data';
import { flow, type Cell } from './aside';
import { axes, drawModelLine, dur, fr, fz, kk, mark, pct, signed, type BarRow } from './helpers';
import { drawBridge, drawDiagram, drawRecap, drawSamuel, drawTvu, drawWhen } from './views';

// ── estado interactivo ─────────────────────────────────────────────────────
interface St { lastA: number; lastB: number; moves: number; low: boolean; probes: { l: number; c: number }[]; placed: number }
const fresh = (): St => ({ lastA: -1, lastB: -1, moves: 0, low: false, probes: [], placed: 0 });
const stOf = (S: Frame): St => (S.st.q ??= fresh()) as St;
const handOf = (S: Frame) => ({ a: Math.round(S.p.ra ?? 7), b: Math.round(S.p.rb ?? 28) });
const nOf = (S: Frame) => clamp(2 * Math.round((S.p.n ?? 30) / 2), 4, 30);
/** Pequeña dispersión horizontal para que los puntos con los mismos enlaces no se encimen. */
const jx = (i: number, off = 0) => (hash(i + off, 5) - 0.5) * 0.24;

function addProbe(S: Frame, l: number, c: number) {
  const q = stOf(S);
  q.probes.push({ l, c }); if (q.probes.length > 8) q.probes.shift();
  q.placed++;
  if (q.placed >= 3) S.complete('probe');
}

function lay(S: Frame) {
  const R = regions(S, S.portrait ? 0.64 : 0.62);
  const plot = new Plot(S, R.main, { xr: [-0.7, 10.7], yr: [0, 43], pad: { l: 40, r: 8, t: 22, b: 40 } });
  return { R, plot };
}

// ── la escena ──────────────────────────────────────────────────────────────
const scene: SceneFactory = () => ({
  controls: [
    { id: 'ra', kind: 'slider', label: { es: 'Enlaces: spam desde…', en: 'Links: spam from…' }, min: 1, max: 10, step: 1, value: 7, from: 'rule-intro', to: 'errors', fmt: (v) => String(v) },
    { id: 'rb', kind: 'slider', label: { es: 'Mayúsculas: spam desde… (%)', en: 'Capitals: spam from… (%)' }, min: 5, max: 40, step: 1, value: 28, from: 'rule-intro', to: 'errors', fmt: (v) => `${v} %` },
    { id: 'n', kind: 'slider', label: { es: 'Ejemplos para aprender', en: 'Examples to learn from' }, min: 4, max: 30, step: 2, value: 30, from: 'try-data', to: 'more-data', fmt: (v) => String(v) },
    { id: 'probe', kind: 'button', primary: true, label: { es: 'Otro correo nuevo', en: 'Another new email' }, from: 'try-use', to: 'garbage' },
  ],

  init(S) { S.st.q = fresh(); },

  action(S, id) {
    if (id !== 'probe') return;
    const i = S.p.probe ?? 1;
    addProbe(S, Math.round(hash(i, 11) * 10), Math.round(hash(i, 12) * 76 + 4) / 2);
  },

  pointer(S, e) {
    // en táctil solo con el gate abierto: así un toque para desplazar la página no pone un correo
    if (e.type !== 'down' || !S.between('try-use', 'garbage') || (S.coarse && !S.free)) return;
    const { plot } = lay(S);
    if (plot.inside(e.x, e.y)) addProbe(S, clamp(Math.round(plot.iX(e.x)), 0, 10), clamp(Math.round(plot.iY(e.y) * 2) / 2, 0, 42));
  },

  cursor(S, x, y) { return S.between('try-use', 'garbage') && lay(S).plot.inside(x, y) ? 'crosshair' : undefined; },

  // Los «tu turno» se comprueban aquí, aunque el escenario no esté a la vista.
  update(S) {
    const q = stOf(S);
    if (S.between('rule-intro', 'errors')) {
      const h = handOf(S);
      if (q.lastA !== h.a || q.lastB !== h.b) { if (q.lastA >= 0) q.moves++; q.lastA = h.a; q.lastB = h.b; }
      if (handHits(h.a, h.b, TRAIN) >= 24 || q.moves >= 12) S.complete('rule');
    }
    if (S.between('try-data', 'more-data')) {
      const n = nOf(S);
      if (n <= 8) q.low = true;
      if (q.low && n >= 26) S.complete('data');
    }
  },

  render(S) {
    const d = S.d, hand = handOf(S);
    const prog = S.at('programming', 0, 0.8), sam = S.at('samuel', 0, 0.8), ls = S.at('learn-setup', 0, 0.8);
    const tvu = S.at('train-vs-use', 0, 0.7) * (1 - S.at('try-use', 0, 0.7));
    const rec = S.at('recap', 0, 0.8), whn = S.at('when', 0, 0.8), brg = S.at('bridge', 0, 0.8);
    const a1 = 1 - prog, a2 = prog * (1 - sam), aS = sam * (1 - ls), a3 = ls * (1 - rec) * (1 - tvu);
    const aT = tvu * (1 - rec), aR = rec * (1 - whn), aW = whn * (1 - brg);
    if (a1 > 0.01) d.withAlpha(a1, () => drawV1(S, hand));
    if (a2 > 0.01) d.withAlpha(a2, () => drawDiagram(S, hand));
    if (aS > 0.01) d.withAlpha(aS, () => drawSamuel(S));
    if (a3 > 0.01) d.withAlpha(a3, () => drawV3(S, hand));
    if (aT > 0.01) d.withAlpha(aT, () => drawTvu(S));
    if (aR > 0.01) d.withAlpha(aR, () => drawRecap(S));
    if (aW > 0.01) d.withAlpha(aW, () => drawWhen(S));
    if (brg > 0.01) d.withAlpha(brg, () => drawBridge(S));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Vista 1: de la tarjeta al punto, la regla a mano y los correos nuevos
// ═════════════════════════════════════════════════════════════════════════
function cardGeom(S: Frame, R: { main: Rect; all: Rect }) {
  const k = kk(S), size = fz(S, 13) * clamp(S.W / 760, 1, 1.25), lines = MAIL[S.lang];
  const cwid = S.d.measure('M', { size, font: 'mono' });
  const maxCh = Math.max(...lines.map((l) => l.length));
  const w = Math.min(R.all.w, maxCh * cwid + 28 * k), lh = size * S.u * 1.45, h = lines.length * lh + 20 * k;
  // al inicio la tarjeta está centrada en todo el escenario; al medir pasa a la zona principal
  const t = S.at('measure', 0, 0.9, 'io');
  const cx = lerp(R.all.x + R.all.w / 2, R.main.x + R.main.w / 2, t);
  const top = lerp(R.all.y + (R.all.h - h - 40 * k) / 2, R.main.y + Math.max(0, (R.main.h - h - 40 * k) / 2), t);
  return { x: cx - w / 2, y: top, w, h, cwid, size, lh };
}

function drawCard(S: Frame, g: ReturnType<typeof cardGeom>, hlL: number, hlC: number) {
  const { d, pal: p } = S, k = kk(S), sg = tone(S, 'sig');
  d.rect(g.x, g.y, g.w, g.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 3 });
  MAIL[S.lang].forEach((ln, i) => {
    const x = g.x + 14 * k, y = g.y + 10 * k + i * g.lh, isLink = /\.example\//.test(ln);
    if (hlC > 0) [...ln].forEach((ch, j) => { if (/\p{L}/u.test(ch) && ch === ch.toUpperCase() && ch !== ch.toLowerCase()) d.rect(x + j * g.cwid - 0.5, y - 1, g.cwid + 1, g.lh - 2 * k, { fill: alpha(sg.c, 0.32 * hlC) }); });
    d.text(ln, x, y, { size: g.size, font: 'mono', weight: isLink ? 700 : 500, color: isLink && hlL > 0.5 ? sg.ink : p.ink, base: 'top' });
    if (isLink && hlL > 0) d.line(x, y + g.lh - 4 * k, x + ln.length * g.cwid, y + g.lh - 4 * k, sg.c, 2, undefined, hlL);
  });
}

/** La regla a mano: «spam si enlaces ≥ a o mayúsculas ≥ b». Se sombrea lo que marca como spam. */
function handLayer(S: Frame, plot: Plot, h: { a: number; b: number }, a: number) {
  const { d, pal: p } = S, r = plot.r, k = kk(S), er = tone(S, 'err');
  const xa = plot.X(h.a - 0.5), yb = plot.Y(h.b);
  d.withAlpha(a, () => {
    d.rect(xa, r.y, r.x + r.w - xa, r.h, { fill: alpha(er.c, 0.1) });
    d.rect(r.x, r.y, xa - r.x, Math.max(0, yb - r.y), { fill: alpha(er.c, 0.1) });
    d.line(xa, yb, xa, r.y + r.h, er.c, 2.5); d.line(r.x, yb, xa, yb, er.c, 2.5);
    d.text('spam', r.x + r.w - 6 * k, r.y + 5 * k, { size: fz(S, 13), weight: 800, color: er.ink, align: 'right', base: 'top', halo: p.stage });
    d.text(S.l('normal', 'legit'), r.x + 6 * k, r.y + r.h - 5 * k, { size: fz(S, 13), weight: 800, color: tone(S, 'dat').ink, base: 'bottom', halo: p.stage });
  });
}

function drawV1(S: Frame, hand: { a: number; b: number }) {
  const { R, plot } = lay(S), d = S.d, p = S.pal, k = kk(S);
  const g = cardGeom(S, R), demo = TRAIN[DEMO], dot: [number, number] = [plot.X(demo.l + jx(DEMO)), plot.Y(demo.c)];
  const pl = S.at('plane', 0.2, 2.4, 'io'), hlL = fr(S, 'measure', 0.4, 0.5, 'lin'), hlC = fr(S, 'measure', 0.76, 0.88, 'lin');
  const mm = measureMail(MAIL[S.lang]);

  // tarjeta del correo → punto del plano
  const cardA = S.reveal('hook', 0, 0.7) * (1 - S.at('plane', 1.7, 2.4, 'lin'));
  if (cardA > 0.01) {
    const cx0 = g.x + g.w / 2, cy0 = g.y + g.h / 2, cx = lerp(cx0, dot[0], pl), cy = lerp(cy0, dot[1], pl), sc = lerp(1, 0.07, pl);
    d.withAlpha(cardA, () => { S.ctx.save(); S.ctx.translate(cx, cy); S.ctx.scale(sc, sc); S.ctx.translate(-cx0, -cy0); drawCard(S, g, hlL, hlC); S.ctx.restore(); });
    const qa = S.reveal('hook', 0.7, 0.5) * (1 - S.at('measure', 0, 0.4)) * cardA;
    if (qa > 0.01) badge(S, S.l('¿spam o normal?', 'spam or legit?'), g.x + g.w / 2, g.y + g.h + 24 * k, { size: fz(S, 14), a: qa });
  }
  if (S.between('hook', 'measure')) {
    const sc = Math.max(2, Math.round(2.4 * S.u)), nx = S.portrait ? g.x + g.w - 24 * sc : g.x + g.w + 22 * k, ny = S.portrait ? g.y - 18 * sc - 10 * k : g.y + 6 * k;
    neu(S, nx, ny, { scale: sc, mood: 'think', a: S.reveal('hook', 1.2, 0.6) });
  }

  // plano
  if (S.on('plane')) axes(S, plot, S.reveal('plane', 0.2, 0.9));
  if (S.between('plane', 'labeled')) {
    const a = S.at('plane', 1.8, 2.5, 'lin');
    d.withAlpha(a, () => { d.circle(dot[0], dot[1], 6.5 * S.u, { fill: p.ink, stroke: p.stage, lw: 1.5 }); });
    badge(S, S.l('este correo', 'this email'), dot[0], dot[1] - 20 * k, { size: fz(S, 12), a });
  }

  // la regla a mano
  const ruleA = fr(S, 'rule-intro', 0.3, 0.42);
  if (S.on('rule-intro')) handLayer(S, plot, hand, ruleA);

  // los treinta ejemplos (y su respuesta)
  TRAIN.forEach((pt, i) => {
    const a = i === DEMO ? (S.on('labeled') ? S.reveal('labeled', 0, 0.3) : 0) : fr(S, 'labeled', 0.1 + i * 0.0125, 0.1 + i * 0.0125 + 0.08);
    if (a < 0.01) return;
    mark(S, plot.X(pt.l + jx(i)), plot.Y(pt.c), pt.y, { a, ring: S.on('rule-intro') && handSpam(hand.a, hand.b, pt) !== pt.y, ringA: ruleA });
  });

  // la zona donde las dos clases se mezclan
  if (S.on('errors') && !S.on('unseen')) {
    const ea = fr(S, 'errors', 0.58, 0.72), pts: [number, number][] = [];
    for (let j = 0; j <= 48; j++) { const th = (j / 48) * Math.PI * 2; pts.push([plot.X(3.2 + 3.1 * Math.cos(th)), plot.Y(15 + 9 * Math.sin(th))]); }
    d.polyline(pts, p.ink2, 2, { dash: [6, 5], a: ea });
    badge(S, S.l('se mezclan', 'they mix'), plot.X(6.6), plot.Y(15), { size: fz(S, 12), align: 'left', a: ea });
  }

  // sesenta correos nuevos
  if (S.on('unseen')) {
    const ringA = fr(S, 'unseen', 0.86, 0.94, 'lin');
    FRESH.forEach((pt, i) => {
      const a = fr(S, 'unseen', 0.55 + i * 0.004, 0.55 + i * 0.004 + 0.06);
      if (a < 0.01) return;
      mark(S, plot.X(pt.l + jx(i, 100)), plot.Y(pt.c), pt.y, { a, ghost: true, ring: handSpam(hand.a, hand.b, pt) !== pt.y, ringA });
    });
  }

  // columna lateral
  const cells: Cell[] = [];
  let aA = 1;
  const hits = handHits(hand.a, hand.b, TRAIN), fh = handHits(hand.a, hand.b, FRESH);
  if (S.between('measure', 'labeled')) {
    cells.push({ k: 'ro', name: S.l('enlaces', 'links'), value: String(mm.links), tone: 'sig', a: hlL }, { k: 'ro', name: S.l('mayúsculas', 'capitals'), value: pct(S, mm.caps / 100), tone: 'sig', a: hlC });
  } else if (S.between('labeled', 'rule-intro')) {
    cells.push({ k: 'ro', name: S.l('ejemplos', 'examples'), value: '30', a: fr(S, 'labeled', 0.3, 0.4) }, { k: 'legend', counts: true });
    aA = fr(S, 'labeled', 0.5, 0.6);
  } else if (S.between('rule-intro', 'unseen')) {
    cells.push(
      { k: 'text', text: S.l(`spam si enlaces ≥ ${hand.a} o mayúsculas ≥ ${hand.b} %`, `spam if links ≥ ${hand.a} or capitals ≥ ${hand.b}%`), mono: true, tone: 'err' },
      { k: 'gauge', name: S.l('aciertos con los 30', 'hits on the 30'), f: hits / 30, text: `${hits} / 30`, tone: 'ink', marks: [{ f: 0.5, text: S.l('azar', 'chance') }] },
      { k: 'legend', ring: true },
    );
    aA = fr(S, 'rule-intro', 0.4, 0.5);
  } else if (S.on('unseen')) {
    const dp = (fh / 60 - hits / 30) * 100;
    const row: BarRow = { name: S.l('Tu regla', 'Your rule'), tone: 'ink', seen: hits / 30, fresh: fh / 60, freshOn: fr(S, 'unseen', 0.84, 0.92, 'lin') };
    cells.push({ k: 'lockText', text: S.l('regla fija', 'rule is frozen'), a: fr(S, 'unseen', 0.4, 0.5) }, { k: 'bars', rows: [row], seen: S.l('vistos', 'seen'), fresh: S.l('nuevos', 'new') }, { k: 'legend', fresh: true, ring: true });
    if (S.on('fragile')) cells.push({ k: 'text', mono: true, tone: dp < -0.5 ? 'err' : 'dat', a: fr(S, 'fragile', 0.78, 0.88), text: S.l(`nuevos − vistos: ${signed(S, dp, 0)} puntos`, `new − seen: ${signed(S, dp, 0)} points`) });
  }
  flow(S, R.aside, cells, aA);
}

// ═════════════════════════════════════════════════════════════════════════
// Vista 3: la máquina aprende y se usa
// ═════════════════════════════════════════════════════════════════════════
const wobble = (q: number) => {
  const ph = Math.min(2, Math.floor(q * 3)), t = q * 3 - ph, s = Math.sin(t * Math.PI * 2), m: Model = { ...START };
  if (ph === 0) m.b += 0.5 * s; else if (ph === 1) m.w1 += 0.1 * s; else m.w2 += 0.03 * s;
  return { m, hot: ph === 0 ? 2 : ph === 1 ? 0 : 1 };   // pastilla que se mueve: b, w₁ o w₂
};

/** Rótulos «spam» y «normal» en las esquinas de cada lado de la recta. */
function sideLabels(S: Frame, plot: Plot, m: Model, a: number) {
  const r = plot.r, k = kk(S), d = S.d;
  const cs = [{ x: r.x, y: r.y, h: 'left', v: 'top' }, { x: r.x + r.w, y: r.y, h: 'right', v: 'top' }, { x: r.x, y: r.y + r.h, h: 'left', v: 'bottom' }, { x: r.x + r.w, y: r.y + r.h, h: 'right', v: 'bottom' }] as const;
  ([[1, 'spam', 'err'], [-1, S.l('normal', 'legit'), 'dat']] as const).forEach(([sg, txt, tn]) => {
    let best: (typeof cs)[number] | null = null, bv = 0;
    cs.forEach((c) => { const v = sg * score(m, plot.iX(c.x), plot.iY(c.y)); if (v > bv) { bv = v; best = c; } });
    if (!best) return;
    const c = best as (typeof cs)[number];
    d.text(txt, c.x + (c.h === 'left' ? 6 : -6) * k, c.y + (c.v === 'top' ? 5 : -5) * k, { size: fz(S, 13), weight: 800, color: tone(S, tn).ink, align: c.h, base: c.v, halo: S.pal.stage, a });
  });
}

function drawV3(S: Frame, hand: { a: number; b: number }) {
  const { R, plot } = lay(S), d = S.d, p = S.pal;
  const n = nOf(S), inTry = S.between('try-data', 'more-data'), garb = S.on('garbage');
  const useIn = S.reveal('use-arrive', 0, 0.8);
  axes(S, plot, 1);

  // ── el modelo que se muestra ──
  let m: Model | null = null, hot = -1, step = -1;
  if (S.on('model-sign')) m = START;
  if (S.on('params')) { const D = dur(S, 'params'), w = wobble(S.at('params', 0.12 * D, 0.88 * D, 'lin')); m = w.m; hot = w.hot; }
  if (S.on('training')) { const D = dur(S, 'training'); step = stepAt(S.at('training', 0.35 * D, 0.95 * D, 'lin')); m = PATH[step]; hot = -1; }
  if (S.on('train-result')) m = FINAL;
  if (inTry) m = BY_N[n];
  if (S.on('more-data')) m = FINAL;
  let gm: Model | null = null;   // advertencia: entrenar con respuestas torcidas
  if (garb) { const D = dur(S, 'garbage'); gm = BAD_PATH[stepAt(S.at('garbage', 0.62 * D, 0.97 * D, 'lin'))]; m = gm; }

  // ── la recta ──
  if (garb) {
    drawModelLine(S, plot, FINAL, { a: 0.95, lw: 2, dash: [6, 5], tone: 'mute' });
    drawModelLine(S, plot, gm!, { a: fr(S, 'garbage', 0.58, 0.64, 'lin'), lw: 3, tone: 'err' });
  } else if (m) {
    const tintA = S.on('model-sign') ? fr(S, 'model-sign', 0.12, 0.28) : 0, lineA = S.on('model-sign') ? fr(S, 'model-sign', 0.7, 0.8) : 0;
    drawModelLine(S, plot, m, { a: tintA, tint: S.on('model-sign') ? 0.07 : 0.05, line: false });
    drawModelLine(S, plot, m, { a: lineA, lw: 3 });
    if (S.between('model-sign', 'training')) sideLabels(S, plot, m, fr(S, 'model-sign', 0.18, 0.3));
  }
  if (S.on('more-data') && !S.on('use-arrive')) {
    SIZES.filter((s) => s < 30).forEach((s, j) => drawModelLine(S, plot, BY_N[s], { a: fr(S, 'more-data', 0.45 + j * 0.04, 0.45 + j * 0.04 + 0.06) * (0.2 + 0.4 * (s / 30)), lw: 1.8 }));
  }

  // ── los treinta ejemplos ──
  const flipA = fr(S, 'garbage', 0.42, 0.55, 'io');
  TRAIN.forEach((pt, i) => {
    let a = S.at('learn-setup', 0.15 + i * 0.035, 0.15 + i * 0.035 + 0.3, 'out');
    if (inTry && !isUsed(i, n)) a *= 0.25;
    if (S.on('use-arrive')) a *= 1 - 0.65 * useIn * (1 - S.at('garbage', 0, 0.5, 'lin'));
    const x = plot.X(pt.l + jx(i)), y = plot.Y(pt.c);
    if (garb && BAD.includes(i)) {
      mark(S, x, y, 1, { a: a * (1 - flipA) }); mark(S, x, y, 0, { a: a * flipA });
      d.withAlpha(flipA, () => d.circle(x, y, 11 * S.u, { stroke: p.ink, lw: 1.8, dash: [3, 3] }));
      return;
    }
    const ring = !garb && m !== null && S.between('training', 'try-data') && modelSpam(m, pt) !== pt.y;
    mark(S, x, y, pt.y, { a, ring });
  });

  // ── los sesenta nuevos ──
  const freshOut = 1 - S.at('use-arrive', 0, 0.6);
  if (S.on('train-result') && freshOut > 0.01 && m) {
    const ringA = inTry ? 1 : fr(S, 'train-result', 0.82, 0.92, 'lin');
    FRESH.forEach((pt, i) => {
      const a = fr(S, 'train-result', 0.5 + i * 0.004, 0.5 + i * 0.004 + 0.06) * freshOut;
      if (a < 0.01) return;
      mark(S, plot.X(pt.l + jx(i, 100)), plot.Y(pt.c), pt.y, { a, ghost: true, ring: modelSpam(m!, pt) !== pt.y, ringA });
    });
  }

  // ── casos nuevos para usar el modelo ──
  const qMark = (x: number, y: number, a: number) => d.withAlpha(a, () => { d.circle(x, y, 11 * S.u, { fill: p.stage, stroke: p.ink, lw: 2.2, dash: [3, 3] }); d.text('?', x, y, { size: fz(S, 17), weight: 800, font: 'mono', align: 'center', base: 'middle' }); });
  if (S.between('use-arrive', 'try-use')) {
    const x = plot.X(2), y = plot.Y(24);
    if (!S.on('use-compute')) qMark(x, y, fr(S, 'use-arrive', 0.55, 0.65));
    else {
      const ra = fr(S, 'use-compute', 0.5, 0.6);
      mark(S, x, y, score(FINAL, 2, 24) > 0 ? 1 : 0, { big: true, a: ra, ring: true });
      qMark(x, y, 1 - ra);
    }
  }
  if (S.between('try-use', 'garbage')) {
    const q = stOf(S);
    q.probes.forEach((pr, j) => {
      const x = plot.X(pr.l), y = plot.Y(pr.c), v = score(FINAL, pr.l, pr.c) > 0 ? 1 : 0, last = j === q.probes.length - 1;
      mark(S, x, y, v, { big: true, ring: !last });
      if (last) d.circle(x, y, (12 + 2.5 * Math.sin(S.clock * 4)) * S.u, { stroke: p.ink, lw: 2 });
    });
  }

  // ── columna lateral ──
  const cells: Cell[] = [];
  let aA = 1;
  const chips = (mm: Model, lockIt = false): Cell => ({ k: 'chips', m: mm, hot: hot >= 0 ? hot : undefined, lock: lockIt });
  if (garb) {
    const fh = modelHits(gm!, FRESH), cf = modelHits(FINAL, FRESH);
    cells.push(
      { k: 'gauge', name: S.l('acierto con 60 correos nuevos', 'hits on 60 new emails'), f: fh / 60, text: `${fh} / 60`, tone: 'err', marks: [{ f: cf / 60, text: S.l('con respuestas bien', 'with correct labels') }] },
      { k: 'text', text: S.l('Ilustrativo: cuatro respuestas alteradas a propósito.', 'Illustrative: four answers altered on purpose.'), a: fr(S, 'garbage', 0.45, 0.55) },
    );
  } else if (S.between('learn-setup', 'model-form')) {
    cells.push({ k: 'ro', name: S.l('ejemplos', 'examples'), value: '30' }, { k: 'legend', counts: true });
  } else if (S.between('model-form', 'model-sign')) { cells.push({ k: 'eq' }); aA = fr(S, 'model-form', 0.08, 0.2); }
  else if (S.between('model-sign', 'params')) { cells.push({ k: 'eq' }, { k: 'text', text: S.l('positivo: spam · negativo: normal', 'positive: spam · negative: legit'), a: fr(S, 'model-sign', 0.2, 0.32) }); }
  else if (S.between('params', 'training') && m) { cells.push(chips(m)); aA = fr(S, 'params', 0.05, 0.15); }
  else if (S.between('training', 'train-result') && m) {
    const h = modelHits(m, TRAIN);
    cells.push(chips(m), { k: 'gauge', name: S.l(`aciertos · ajuste ${step}`, `hits · adjustment ${step}`), f: h / 30, text: `${h} / 30`, tone: 'w', marks: [{ f: 0.5, text: S.l('azar', 'chance') }] });
  } else if (S.between('train-result', 'try-data')) {
    const on = fr(S, 'train-result', 0.78, 0.9, 'lin');
    const rows: BarRow[] = [
      { name: S.l('Tu regla', 'Your rule'), tone: 'ink', seen: handHits(hand.a, hand.b, TRAIN) / 30, fresh: handHits(hand.a, hand.b, FRESH) / 60, freshOn: on },
      { name: S.l('La máquina', 'The machine'), tone: 'w', seen: modelHits(FINAL, TRAIN) / 30, fresh: modelHits(FINAL, FRESH) / 60, freshOn: on },
    ];
    cells.push({ k: 'bars', rows, seen: S.l('vistos', 'seen'), fresh: S.l('nuevos', 'new') });
    if (!S.portrait) cells.push({ k: 'legend', fresh: true, ring: true });
    aA = fr(S, 'train-result', 0.45, 0.55);
  } else if (inTry) {
    const sub = subset(n), mn = BY_N[n], fh = modelHits(mn, FRESH), hf = handHits(hand.a, hand.b, FRESH);
    cells.push(
      { k: 'ro', name: S.l('ejemplos', 'examples'), value: String(n) },
      { k: 'ro', name: S.l('acierta con ellos', 'hits on them'), value: pct(S, modelHits(mn, sub) / n), tone: 'w' },
      { k: 'gauge', name: S.l('con los 60 nuevos', 'on the 60 new'), f: fh / 60, text: `${fh} / 60`, tone: 'w', marks: [{ f: hf / 60, text: S.l('tu regla', 'your rule'), tone: 'ink' }] },
    );
  } else if (S.between('more-data', 'use-arrive')) cells.push({ k: 'text', text: S.l('Tenue: pocos ejemplos. Sólida: los 30.', 'Faint: few examples. Solid: all 30.'), a: fr(S, 'more-data', 0.4, 0.5) });
  else if (S.between('use-arrive', 'use-compute')) cells.push(chips(FINAL, true), { k: 'text', text: S.l('parámetros fijos', 'frozen parameters'), a: fr(S, 'use-arrive', 0.3, 0.4) });
  else if (S.between('use-compute', 'train-vs-use')) cells.push(chips(FINAL, true), { k: 'arith', m: FINAL, l: 2, c: 24, a: fr(S, 'use-compute', 0.22, 0.32) });
  else if (S.between('try-use', 'garbage')) {
    const q = stOf(S), last = q.probes[q.probes.length - 1];
    cells.push(chips(FINAL, true), last ? { k: 'arith', m: FINAL, l: last.l, c: last.c } : { k: 'text', text: S.l('Toca el plano para poner un correo.', 'Tap the plane to place an email.') });
  }
  flow(S, R.aside, cells, aA);
}

export default scene;
