// Escena: Programar o aprender. Un correo se vuelve dos números y un punto (cada eje se presenta por separado y el
// punto se ubica paso a paso); una regla escrita a mano se arma por partes y se prueba con correos nuevos; luego la
// máquina encuentra la frontera a partir de los ejemplos (entrenamiento real, aquí a pequeña escala) y se usa con casos
// que nunca vio. Los datos son sintéticos y se rotulan como ilustrativos.
// La escena hace sola cada demostración (mueve los umbrales, el número de ejemplos, pone correos de prueba) con S.drive:
// quien solo mira entiende todo; quien quiere, toma los controles y la demostración le cede el paso.
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
/** El modelo de ejemplo de la narración: peso 1 para los enlaces, ½ para las mayúsculas, número fijo −12. */
const EX: Model = { w1: 1, w2: 0.5, b: -12 };
/** Correos de prueba que la escena pone sola en «try-use» si la persona no pone los suyos. */
const DEMO_PROBES = [{ l: 1, c: 6 }, { l: 8, c: 9 }, { l: 3, c: 31 }];
const lerpM = (a: Model, b: Model, t: number): Model => ({ w1: lerp(a.w1, b.w1, t), w2: lerp(a.w2, b.w2, t), b: lerp(a.b, b.b, t) });

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
    { id: 'ra', kind: 'slider', label: { es: 'Enlaces: spam desde…', en: 'Links: spam from…' }, min: 1, max: 10, step: 1, value: 7, from: 'rule-demo', to: 'errors', fmt: (v) => String(v) },
    { id: 'rb', kind: 'slider', label: { es: 'Mayúsculas: spam desde… (%)', en: 'Capitals: spam from… (%)' }, min: 5, max: 40, step: 1, value: 28, from: 'rule-demo', to: 'errors', fmt: (v) => `${v} %` },
    { id: 'n', kind: 'slider', label: { es: 'Ejemplos para aprender', en: 'Examples to learn from' }, min: 4, max: 30, step: 2, value: 30, from: 'data-demo', to: 'more-data', fmt: (v) => String(v) },
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
    if (plot.inside(e.x, e.y)) { S.touched.add('probe'); addProbe(S, clamp(Math.round(plot.iX(e.x)), 0, 10), clamp(Math.round(plot.iY(e.y) * 2) / 2, 0, 42)); }
  },

  cursor(S, x, y) { return S.between('try-use', 'garbage') && lay(S).plot.inside(x, y) ? 'crosshair' : undefined; },

  // Demostraciones guiadas (la escena mueve los controles mientras nadie los toque) y comprobación de los «tu turno».
  update(S) {
    const q = stOf(S);
    // los umbrales: 7 enlaces / 28 %, luego se baja el de mayúsculas hasta 12 % y se sube a 17 % (la mejor regla)
    // (se sigue fijando hasta «learn-setup»: si alguien salta desde la mitad de la demostración, «unseen» y «two-figures» usan la regla de 7 y 17 %)
    if (S.between('rule-links', 'learn-setup')) {
      let rb = 28;
      if (S.on('rule-demo')) { const down = fr(S, 'rule-demo', 0.12, 0.5, 'io'), up = fr(S, 'rule-demo', 0.62, 0.9, 'io'); rb = up > 0 ? lerp(12, 17, up) : lerp(28, 12, down); }
      if (S.on('try-rule')) rb = 17;
      S.drive('ra', 7); S.drive('rb', Math.round(rb));
    }
    if (S.between('rule-demo', 'errors') && (S.touched.has('ra') || S.touched.has('rb'))) {
      const h = handOf(S);
      if (q.lastA !== h.a || q.lastB !== h.b) { if (q.lastA >= 0) q.moves++; q.lastA = h.a; q.lastB = h.b; }
      if (q.moves >= 3) S.complete('rule');
    }
    // con cuántos ejemplos aprende: 30 → 6 y de vuelta a 30
    if (S.between('learn-setup', 'more-data')) {
      let n = 30;
      if (S.on('data-demo')) n = lerp(30, 6, fr(S, 'data-demo', 0.22, 0.5, 'io'));
      if (S.on('try-data')) n = lerp(6, 30, fr(S, 'try-data', 0.04, 0.3, 'io'));
      S.drive('n', 2 * Math.round(n / 2));
    }
    if (S.between('try-data', 'more-data') && S.touched.has('n')) {
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
// Vista 1: de la tarjeta al punto (eje por eje), la regla a mano por partes y los correos nuevos
// ═════════════════════════════════════════════════════════════════════════
function cardGeom(S: Frame, R: { main: Rect; all: Rect }) {
  const k = kk(S), size = fz(S, 13) * clamp(S.W / 760, 1, 1.25), lines = MAIL[S.lang];
  const cwid = S.d.measure('M', { size, font: 'mono' });
  const maxCh = Math.max(...lines.map((l) => l.length));
  const w = Math.min(R.all.w, maxCh * cwid + 28 * k), lh = size * S.u * 1.45, h = lines.length * lh + 20 * k;
  // al inicio la tarjeta está centrada en todo el escenario; al medir pasa a la zona principal
  const t = S.at('measure-links', 0, 0.9, 'io');
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

/** La regla a mano: «spam si enlaces ≥ a o mayúsculas ≥ b». Cada parte se dibuja con su propia opacidad (aL: enlaces, aC: mayúsculas). */
function handLayer(S: Frame, plot: Plot, h: { a: number; b: number }, aL: number, aC: number) {
  const { d, pal: p } = S, r = plot.r, k = kk(S), er = tone(S, 'err');
  const xa = plot.X(h.a - 0.5), yb = plot.Y(h.b);
  if (aL > 0.01) d.withAlpha(aL, () => {
    d.rect(xa, r.y, r.x + r.w - xa, r.h, { fill: alpha(er.c, 0.1) });
    d.line(xa, r.y, xa, r.y + r.h, er.c, 2.5);
  });
  if (aC > 0.01) d.withAlpha(aC, () => {
    d.rect(r.x, r.y, xa - r.x, Math.max(0, yb - r.y), { fill: alpha(er.c, 0.1) });
    d.line(r.x, yb, xa, yb, er.c, 2.5);
  });
  const lab = Math.max(aL, aC);
  if (lab > 0.01) d.withAlpha(lab, () => {
    d.text('spam', r.x + r.w - 6 * k, r.y + 5 * k, { size: fz(S, 13), weight: 800, color: er.ink, align: 'right', base: 'top', halo: p.stage });
    d.text(S.l('normal', 'legit'), r.x + 6 * k, r.y + r.h - 5 * k, { size: fz(S, 13), weight: 800, color: tone(S, 'dat').ink, base: 'bottom', halo: p.stage, a: aC });
  });
}

function drawV1(S: Frame, hand: { a: number; b: number }) {
  const { R, plot } = lay(S), d = S.d, p = S.pal, k = kk(S), sg = tone(S, 'sig'), r = plot.r;
  const g = cardGeom(S, R), demo = TRAIN[DEMO], dx = demo.l + jx(DEMO);
  const dot: [number, number] = [plot.X(dx), plot.Y(demo.c)];
  const hlL = fr(S, 'measure-links', 0.45, 0.6, 'lin'), hlC = fr(S, 'measure-caps', 0.2, 0.35, 'lin');
  const mm = measureMail(MAIL[S.lang]);

  // ── tarjeta del correo: centro → zona principal → miniatura (mientras se dibujan los ejes) → su punto
  const thumbT = fr(S, 'axis-x', 0, 0.3, 'io'), flyT = fr(S, 'place-y', 0.55, 0.82, 'io');
  const cardA = S.reveal('hook', 0, 0.7) * (1 - fr(S, 'place-y', 0.76, 0.86, 'lin'));
  if (cardA > 0.01) {
    const cx0 = g.x + g.w / 2, cy0 = g.y + g.h / 2;
    const thumbS = Math.min(0.34, (r.w * 0.36) / g.w), tx = r.x + r.w - 12 * k - (g.w * thumbS) / 2, ty = r.y + 8 * k + (g.h * thumbS) / 2;
    let cx = lerp(cx0, tx, thumbT), cy = lerp(cy0, ty, thumbT), sc = lerp(1, thumbS, thumbT);
    cx = lerp(cx, dot[0], flyT); cy = lerp(cy, dot[1], flyT); sc = lerp(sc, 0.05, flyT);
    // en «características» el texto del correo se apaga: la computadora solo ve los dos números
    const dim = fr(S, 'features', 0.15, 0.35) * (1 - fr(S, 'axis-x', 0, 0.2));
    d.withAlpha(cardA * (1 - 0.65 * dim), () => { S.ctx.save(); S.ctx.translate(cx, cy); S.ctx.scale(sc, sc); S.ctx.translate(-cx0, -cy0); drawCard(S, g, hlL, hlC); S.ctx.restore(); });
    const qa = S.reveal('hook', 0.7, 0.5) * (1 - S.at('measure-links', 0, 0.4)) * cardA;
    if (qa > 0.01) badge(S, S.l('¿spam o normal?', 'spam or legit?'), g.x + g.w / 2, g.y + g.h + 24 * k, { size: fz(S, 14), a: qa });
  }
  if (S.between('hook', 'measure-links')) {
    const sc = Math.max(2, Math.round(2.4 * S.u)), nx = S.portrait ? g.x + g.w - 24 * sc : g.x + g.w + 22 * k, ny = S.portrait ? g.y - 18 * sc - 10 * k : g.y + 6 * k;
    neu(S, nx, ny, { scale: sc, mood: 'think', a: S.reveal('hook', 1.2, 0.6) });
  }

  // ── el plano, eje por eje
  if (S.on('axis-x')) {
    const hintOut = 1 - fr(S, 'labeled', 0, 0.12);
    const hx = Math.max(fr(S, 'axis-x', 0.55, 0.7) * (1 - fr(S, 'axis-y', 0, 0.15)), fr(S, 'point-means', 0.35, 0.5)) * hintOut;
    const hy = Math.max(fr(S, 'axis-y', 0.55, 0.7) * (1 - fr(S, 'place-x', 0, 0.15)), fr(S, 'point-means', 0.6, 0.75)) * hintOut;
    axes(S, plot, 1, { ax: fr(S, 'axis-x', 0.25, 0.5), ay: fr(S, 'axis-y', 0.05, 0.3), hx, hy, data: fr(S, 'labeled', 0.05, 0.2) });
  }
  // ubicar el punto: avanzar hasta 4 enlaces, subir hasta 22 %
  const guideOut = 1 - fr(S, 'labeled', 0, 0.15);
  if (S.on('place-x') && guideOut > 0.01) {
    const wx = lerp(0, dx, fr(S, 'place-x', 0.3, 0.75, 'io')), up = fr(S, 'place-y', 0.08, 0.5, 'io');
    const wy = lerp(0, demo.c, up), x = plot.X(wx), yAxis = r.y + r.h;
    d.withAlpha(guideOut, () => {
      if (up > 0.001) d.line(x, yAxis, x, plot.Y(wy), sg.c, 2, [5, 4]);
      const hz = fr(S, 'place-y', 0.45, 0.6);
      if (hz > 0.01) d.line(r.x, dot[1], x, dot[1], sg.c, 2, [5, 4], hz);
      // marcador que camina
      d.circle(x, plot.Y(wy), 6 * S.u, { fill: sg.c, stroke: p.stage, lw: 1.5 });
      const lx = fr(S, 'place-x', 0.7, 0.85);
      if (lx > 0.01) badge(S, S.l('4 enlaces', '4 links'), x, yAxis - 18 * k, { size: fz(S, 12), a: lx * (1 - up) });
      if (hz > 0.01) badge(S, '22 %', r.x + 30 * k, dot[1] - 16 * k, { size: fz(S, 12), a: hz });
    });
  }
  if (S.between('place-y', 'labeled') || S.on('labeled')) {
    const a = fr(S, 'place-y', 0.55, 0.7, 'lin');
    if (!S.on('labeled')) {
      d.withAlpha(a, () => d.circle(dot[0], dot[1], 6.5 * S.u, { fill: p.ink, stroke: p.stage, lw: 1.5 }));
      badge(S, S.l('este correo', 'this email'), dot[0], dot[1] - 20 * k, { size: fz(S, 12), a: a * (1 - fr(S, 'point-means', 0.3, 0.45)) });
    }
  }

  // ── los treinta ejemplos (y su respuesta)
  TRAIN.forEach((pt, i) => {
    const a = i === DEMO ? (S.on('labeled') ? 1 : 0) : fr(S, 'labeled', 0.1 + i * 0.0125, 0.1 + i * 0.0125 + 0.08);
    if (a < 0.01) return;
    mark(S, plot.X(pt.l + jx(i)), plot.Y(pt.c), pt.y, { a, ring: S.on('rule-count') && handSpam(hand.a, hand.b, pt) !== pt.y, ringA: fr(S, 'rule-count', 0.3, 0.45) });
  });
  // dónde cae cada tipo
  if (S.on('pattern') && !S.on('rule-links')) {
    const na = fr(S, 'pattern', 0.12, 0.28), sa = fr(S, 'pattern', 0.55, 0.7), pts: [number, number][] = [];
    for (let j = 0; j <= 48; j++) { const th = (j / 48) * Math.PI * 2; pts.push([plot.X(2 + 2.6 * Math.cos(th)), plot.Y(9 + 6.2 * Math.sin(th))]); }
    d.polyline(pts, tone(S, 'dat').c, 2, { dash: [6, 5], a: na });
    badge(S, S.l('normales', 'legit'), plot.X(2), plot.Y(16.8), { size: fz(S, 12), a: na });
    badge(S, S.l('spam: más a la derecha o más arriba', 'spam: further right or higher up'), plot.X(6.2), plot.Y(39), { size: fz(S, 12), a: sa });
  }

  // ── la regla a mano, por partes
  if (S.on('rule-links')) handLayer(S, plot, hand, fr(S, 'rule-links', 0.55, 0.7), fr(S, 'rule-caps', 0.35, 0.5));

  // ── la zona donde las dos clases se mezclan
  if (S.on('errors') && !S.on('unseen')) {
    const ea = fr(S, 'errors', 0.5, 0.65), pts: [number, number][] = [];
    for (let j = 0; j <= 48; j++) { const th = (j / 48) * Math.PI * 2; pts.push([plot.X(3.2 + 3.1 * Math.cos(th)), plot.Y(15 + 9 * Math.sin(th))]); }
    d.polyline(pts, p.ink2, 2, { dash: [6, 5], a: ea });
    badge(S, S.l('se mezclan', 'they mix'), plot.X(6.6), plot.Y(15), { size: fz(S, 12), align: 'left', a: ea });
  }

  // ── sesenta correos nuevos
  if (S.on('unseen')) {
    const ringA = fr(S, 'unseen', 0.86, 0.94, 'lin');
    FRESH.forEach((pt, i) => {
      const a = fr(S, 'unseen', 0.55 + i * 0.004, 0.55 + i * 0.004 + 0.06);
      if (a < 0.01) return;
      mark(S, plot.X(pt.l + jx(i, 100)), plot.Y(pt.c), pt.y, { a, ghost: true, ring: handSpam(hand.a, hand.b, pt) !== pt.y, ringA });
    });
  }

  // ── columna lateral
  const cells: Cell[] = [];
  let aA = 1;
  const hits = handHits(hand.a, hand.b, TRAIN), fh = handHits(hand.a, hand.b, FRESH);
  const ruleTxt = (full: boolean) => full
    ? S.l(`spam si enlaces ≥ ${hand.a} o mayúsculas ≥ ${hand.b} %`, `spam if links ≥ ${hand.a} or capitals ≥ ${hand.b}%`)
    : S.l(`spam si enlaces ≥ ${hand.a}`, `spam if links ≥ ${hand.a}`);
  if (S.between('measure-links', 'labeled')) {
    // las dos medidas del correo; se resalta la que se está usando para ubicar el punto
    const onX = S.between('place-x', 'place-y') ? 1 : 0, onY = S.between('place-y', 'point-means') ? 1 : 0;
    cells.push(
      { k: 'ro', name: S.l('enlaces', 'links'), value: String(mm.links), tone: onX || !S.on('place-x') ? 'sig' : 'ink', a: hlL },
      { k: 'ro', name: S.l('mayúsculas', 'capitals'), value: pct(S, mm.caps / 100), tone: onY || !S.on('place-x') ? 'sig' : 'ink', a: hlC },
    );
    if (S.between('features', 'axis-x')) cells.push({ k: 'text', text: S.l('Lo único que verá la computadora: estos dos números.', 'All the computer will see: these two numbers.'), tone: 'sig', a: fr(S, 'features', 0.2, 0.35) });
  } else if (S.between('labeled', 'rule-links')) {
    cells.push({ k: 'ro', name: S.l('ejemplos', 'examples'), value: '30', a: fr(S, 'labeled', 0.3, 0.4) }, { k: 'legend', counts: true });
    aA = fr(S, 'labeled', 0.5, 0.6);
  } else if (S.between('rule-links', 'rule-count')) {
    cells.push({ k: 'text', text: ruleTxt(S.on('rule-caps')), mono: true, tone: 'err', a: fr(S, 'rule-links', 0.5, 0.62) }, { k: 'legend' });
  } else if (S.between('rule-count', 'unseen')) {
    cells.push(
      { k: 'text', text: ruleTxt(true), mono: true, tone: 'err' },
      { k: 'gauge', name: S.l('aciertos con los 30 vistos', 'hits on the 30 seen'), f: hits / 30, text: `${hits} / 30`, tone: 'ink', marks: [{ f: 0.5, text: S.l('azar', 'chance') }] },
      { k: 'legend', ring: true },
    );
    aA = S.on('rule-demo') ? 1 : fr(S, 'rule-count', 0.35, 0.5);
  } else if (S.on('unseen')) {
    const dp = (fh / 60 - hits / 30) * 100;
    const hlS = fr(S, 'two-figures', 0.12, 0.25) * (1 - fr(S, 'two-figures', 0.45, 0.55));
    const hlF = Math.max(fr(S, 'two-figures', 0.5, 0.62), S.on('generalize') ? 1 : 0) * (1 - fr(S, 'tune-trap', 0.6, 0.8));
    const row: BarRow = { name: S.l('Regla a mano', 'Handwritten rule'), tone: 'ink', seen: hits / 30, fresh: fh / 60, freshOn: fr(S, 'unseen', 0.84, 0.92, 'lin'), hl: [hlS, hlF] };
    cells.push({ k: 'lockText', text: S.l('regla fija', 'rule is frozen'), a: fr(S, 'unseen', 0.4, 0.5) });
    cells.push({ k: 'bars', rows: [row], seen: S.l('30 vistos', '30 seen'), fresh: S.l('60 nuevos', '60 new') }, { k: 'legend', fresh: true, ring: true });
    if (S.on('tune-trap')) {
      // la diferencia depende de la regla que quedó: el texto no afirma lo que la cifra no muestra
      const sd = Math.abs(dp) < 0.5 ? S.l('nuevos − vistos: sin cambio', 'new − seen: no change') : S.l(`nuevos − vistos: ${signed(S, dp, 0)} puntos`, `new − seen: ${signed(S, dp, 0)} points`);
      cells.push({ k: 'text', mono: true, tone: dp < -0.5 ? 'err' : 'dat', a: fr(S, 'tune-trap', 0.3, 0.45), text: sd });
      if (dp > -0.5 && !S.portrait) cells.push({ k: 'text', a: fr(S, 'tune-trap', 0.5, 0.65), text: S.l('Esta vez no bajó: es una tendencia, no una ley.', 'This time it did not drop: a tendency, not a law.') });
    }
  }
  flow(S, R.aside, cells, aA);
}

// ═════════════════════════════════════════════════════════════════════════
// Vista 3: la máquina aprende (el modelo pieza por pieza) y se usa
// ═════════════════════════════════════════════════════════════════════════
const wobble = (base: Model, q: number) => {
  const ph = Math.min(2, Math.floor(q * 3)), t = q * 3 - ph, s = Math.sin(t * Math.PI * 2), m: Model = { ...base };
  if (ph === 0) m.w1 += 0.35 * s; else if (ph === 1) m.w2 += 0.12 * s; else m.b += 3 * s;
  return { m, hot: ph === 0 ? 0 : ph === 1 ? 1 : 2 };   // pastilla que se mueve: w₁, w₂ o b
};

/** Rótulos «spam» y «normal» en las esquinas de cada lado de la recta. */
function sideLabels(S: Frame, plot: Plot, m: Model, a: number) {
  const r = plot.r, k = kk(S), d = S.d;
  const cs = [{ x: r.x, y: r.y, h: 'left', v: 'top' }, { x: r.x + r.w, y: r.y, h: 'right', v: 'top' }, { x: r.x, y: r.y + r.h, h: 'left', v: 'bottom' }, { x: r.x + r.w, y: r.y + r.h, h: 'right', v: 'bottom' }] as const;
  ([[1, S.l('spam (positivo)', 'spam (positive)'), 'err'], [-1, S.l('normal (negativo)', 'legit (negative)'), 'dat']] as const).forEach(([sg, txt, tn]) => {
    let best: (typeof cs)[number] | null = null, bv = 0;
    cs.forEach((c) => { const v = sg * score(m, plot.iX(c.x), plot.iY(c.y)); if (v > bv) { bv = v; best = c; } });
    if (!best) return;
    const c = best as (typeof cs)[number];
    d.text(txt, c.x + (c.h === 'left' ? 6 : -6) * k, c.y + (c.v === 'top' ? 5 : -5) * k, { size: fz(S, 13), weight: 800, color: tone(S, tn).ink, align: c.h, base: c.v, halo: S.pal.stage, a });
  });
}

function drawV3(S: Frame, hand: { a: number; b: number }) {
  const { R, plot } = lay(S), d = S.d, p = S.pal, k = kk(S), sg = tone(S, 'sig');
  const n = nOf(S), inTry = S.between('data-demo', 'more-data'), garb = S.on('garbage');
  const useIn = S.reveal('use-arrive', 0, 0.8);
  axes(S, plot, 1);

  // ── el modelo que se muestra ──
  let m: Model | null = null, hot = -1, step = -1;
  if (S.on('boundary')) m = EX;
  if (S.on('params')) { const D = dur(S, 'params'), w = wobble(EX, S.at('params', 0.12 * D, 0.88 * D, 'lin')); m = w.m; hot = w.hot; }
  if (S.on('training')) { m = lerpM(EX, START, fr(S, 'training', 0.25, 0.45, 'io')); hot = -1; }
  if (S.on('training-loop')) { const D = dur(S, 'training-loop'); step = stepAt(S.at('training-loop', 0.2 * D, 0.95 * D, 'lin')); m = PATH[step]; }
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
    const first = S.between('boundary', 'params');
    const tintA = first ? fr(S, 'boundary', 0.12, 0.35) : 1, lineA = first ? fr(S, 'boundary', 0.6, 0.75) : 1;
    drawModelLine(S, plot, m, { a: tintA, tint: first ? 0.08 : 0.05, line: false });
    drawModelLine(S, plot, m, { a: lineA, lw: 3 });
    if (S.between('boundary', 'training-loop')) sideLabels(S, plot, m, first ? fr(S, 'boundary', 0.2, 0.35) : 1);
  }
  if (S.on('more-data') && !S.on('use-arrive')) {
    SIZES.filter((s) => s < 30).forEach((s, j) => drawModelLine(S, plot, BY_N[s], { a: fr(S, 'more-data', 0.45 + j * 0.04, 0.45 + j * 0.04 + 0.06) * (0.2 + 0.4 * (s / 30)), lw: 1.8 }));
  }

  // ── los treinta ejemplos ──
  const flipA = fr(S, 'garbage', 0.42, 0.55, 'io');
  // mientras se explica el modelo con el correo de ejemplo, los demás se atenúan
  const focusEx = S.between('score-example', 'boundary') ? 1 - 0.7 * fr(S, 'score-example', 0, 0.2) : S.between('boundary', 'params') ? 0.3 + 0.7 * fr(S, 'boundary', 0.1, 0.3) : 1;
  TRAIN.forEach((pt, i) => {
    let a = S.at('learn-setup', 0.15 + i * 0.035, 0.15 + i * 0.035 + 0.3, 'out');
    if (i !== DEMO) a *= focusEx;
    if (inTry && !isUsed(i, n)) a *= 0.25;
    if (S.on('use-arrive')) a *= 1 - 0.65 * useIn * (1 - S.at('garbage', 0, 0.5, 'lin'));
    const x = plot.X(pt.l + jx(i)), y = plot.Y(pt.c);
    if (garb && BAD.includes(i)) {
      mark(S, x, y, 1, { a: a * (1 - flipA) }); mark(S, x, y, 0, { a: a * flipA });
      d.withAlpha(flipA, () => d.circle(x, y, 11 * S.u, { stroke: p.ink, lw: 1.8, dash: [3, 3] }));
      return;
    }
    const ringOn = garb || !m ? 0 : S.between('training', 'train-result') ? fr(S, 'training', 0.5, 0.62) : S.between('train-result', 'data-demo') ? 1 : 0;
    mark(S, x, y, pt.y, { a, ring: ringOn > 0 && modelSpam(m!, pt) !== pt.y, ringA: ringOn });
  });
  // el correo de ejemplo, con su cuenta
  if (S.between('score-example', 'boundary')) {
    const pt = TRAIN[DEMO], x = plot.X(pt.l + jx(DEMO)), y = plot.Y(pt.c), ra = fr(S, 'score-example', 0.05, 0.2);
    d.withAlpha(ra, () => d.circle(x, y, 13 * S.u, { stroke: p.ink, lw: 2.2 }));
    const tag = S.on('sign') ? fr(S, 'sign', 0.55, 0.7) : 0;
    badge(S, tag > 0.5 ? S.l('3.2 → spam', '3.2 → spam') : S.l('este correo', 'this email'), x, y - 24 * k, { size: fz(S, 12), a: ra });
  }

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
    const x = plot.X(2), y = plot.Y(24), r = plot.r;
    // se mide igual que los de entrenamiento: guías desde los dos ejes
    const gA = S.between('use-measure', 'train-vs-use') ? fr(S, 'use-measure', 0.35, 0.55) : 0;
    if (gA > 0.01) d.withAlpha(gA, () => { d.line(x, r.y + r.h, x, y, sg.c, 2, [5, 4]); d.line(r.x, y, x, y, sg.c, 2, [5, 4]); });
    if (!S.on('use-compute')) qMark(x, y, fr(S, 'use-arrive', 0.55, 0.65));
    else {
      const ra = fr(S, 'use-compute', 0.5, 0.6);
      mark(S, x, y, score(FINAL, 2, 24) > 0 ? 1 : 0, { big: true, a: ra, ring: true, dashRing: true });
      qMark(x, y, 1 - ra);
    }
  }
  const q = stOf(S);
  // si la persona no pone correos, la escena pone tres para mostrar cómo responde el modelo
  const probes = q.probes.length ? q.probes : DEMO_PROBES.filter((_, j) => fr(S, 'try-use', 0.2 + j * 0.2, 0.26 + j * 0.2) > 0.5);
  if (S.between('try-use', 'garbage')) {
    probes.forEach((pr, j) => {
      const x = plot.X(pr.l), y = plot.Y(pr.c), v = score(FINAL, pr.l, pr.c) > 0 ? 1 : 0, last = j === probes.length - 1;
      mark(S, x, y, v, { big: true, ring: !last, dashRing: true });
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
  } else if (S.between('learn-setup', 'model-idea')) {
    cells.push(
      { k: 'ro', name: S.l('ejemplos', 'examples'), value: '30' },
      { k: 'text', text: S.l('Ve: enlaces, mayúsculas y la respuesta. No recibe ninguna regla.', 'It sees: links, capitals, and the answer. It gets no rule.'), tone: 'sig', a: fr(S, 'learn-setup', 0.35, 0.5) },
      { k: 'legend', counts: true },
    );
  } else if (S.between('model-idea', 'weights')) {
    cells.push({ k: 'eq', blanks: true, rev: [fr(S, 'model-idea', 0.3, 0.45), fr(S, 'model-idea', 0.5, 0.65), 0] });
    cells.push({ k: 'text', text: S.l('Cada ▢ es un número por llenar.', 'Each ▢ is a number to fill in.'), a: fr(S, 'model-idea', 0.7, 0.85) });
  } else if (S.between('weights', 'bias')) {
    const h = fr(S, 'weights', 0.1, 0.25);
    cells.push({ k: 'eq', rev: [1, 1, 0], hot: [h, h, 0] }, { k: 'text', text: S.l('w₁ y w₂ son los pesos: cuánto cuenta cada medida.', 'w₁ and w₂ are the weights: how much each measure counts.'), tone: 'w', a: h });
  } else if (S.between('bias', 'score-example')) {
    const h = fr(S, 'bias', 0.1, 0.25);
    cells.push({ k: 'eq', rev: [1, 1, h], hot: [0, 0, h] }, { k: 'text', text: S.l('b es el número fijo: sube o baja todo el puntaje.', 'b is the fixed number: it raises or lowers the whole score.'), tone: 'w', a: h });
    cells.push({ k: 'text', text: S.l('Forma + números por llenar = modelo.', 'Form + numbers to fill in = model.'), tone: 'ink', a: fr(S, 'bias', 0.6, 0.75) });
  } else if (S.between('score-example', 'boundary')) {
    const pt = TRAIN[DEMO];
    cells.push({ k: 'eq', vals: EX, hot: [fr(S, 'score-example', 0.15, 0.3), fr(S, 'score-example', 0.3, 0.45), fr(S, 'score-example', 0.45, 0.6)] });
    cells.push({ k: 'arith', m: EX, l: pt.l, c: pt.c, a: fr(S, 'score-example', 0.6, 0.75), res: S.on('sign') ? fr(S, 'sign', 0, 0.15) : 0 });
    if (S.on('sign')) cells.push({ k: 'text', text: S.l('positivo → spam · negativo → normal', 'positive → spam · negative → legit'), a: fr(S, 'sign', 0.35, 0.5) });
  } else if (S.between('boundary', 'params')) {
    cells.push({ k: 'eq', vals: EX }, { k: 'text', text: S.l('La recta: donde el puntaje vale 0.', 'The line: where the score equals 0.'), a: fr(S, 'boundary', 0.6, 0.75) });
  } else if (S.between('params', 'training') && m) { cells.push(chips(m), { k: 'text', text: S.l('w₁, w₂: inclinan · b: desplaza', 'w₁, w₂: tilt · b: shift'), a: fr(S, 'params', 0.1, 0.2) }); }
  else if (S.between('training', 'train-result') && m) {
    const h = modelHits(m, TRAIN);
    const name = step >= 0 ? S.l(`aciertos · ajuste ${step}`, `hits · adjustment ${step}`) : S.l('aciertos con los 30', 'hits on the 30');
    cells.push(chips(m), { k: 'gauge', name, f: h / 30, text: `${h} / 30`, tone: 'w', marks: [{ f: 0.5, text: S.l('azar', 'chance') }] });
  } else if (S.between('train-result', 'data-demo')) {
    const on = fr(S, 'train-result', 0.78, 0.9, 'lin');
    const rows: BarRow[] = [
      { name: S.l('Regla a mano', 'Handwritten rule'), tone: 'ink', seen: handHits(hand.a, hand.b, TRAIN) / 30, fresh: handHits(hand.a, hand.b, FRESH) / 60, freshOn: on },
      { name: S.l('La máquina', 'The machine'), tone: 'w', seen: modelHits(FINAL, TRAIN) / 30, fresh: modelHits(FINAL, FRESH) / 60, freshOn: on },
    ];
    cells.push({ k: 'bars', rows, seen: S.l('30 vistos', '30 seen'), fresh: S.l('60 nuevos', '60 new') });
    if (!S.portrait) cells.push({ k: 'legend', fresh: true, ring: true });
    aA = S.on('train-compare') ? 1 : fr(S, 'train-result', 0.45, 0.55);
  } else if (inTry) {
    const sub = subset(n), mn = BY_N[n], fh = modelHits(mn, FRESH), hf = modelHits(FINAL, FRESH);
    cells.push(
      { k: 'ro', name: S.l('ejemplos', 'examples'), value: String(n) },
      { k: 'ro', name: S.l('acierta con ellos', 'hits on them'), value: pct(S, modelHits(mn, sub) / n), tone: 'w' },
      { k: 'gauge', name: S.l('con los 60 nuevos', 'on the 60 new'), f: fh / 60, text: `${fh} / 60`, tone: 'w', marks: [{ f: hf / 60, text: S.l('con los 30', 'with all 30'), tone: 'ink' }] },
    );
  } else if (S.between('more-data', 'use-arrive')) cells.push({ k: 'text', text: S.l('Tenue: pocos ejemplos. Sólida: los 30.', 'Faint: few examples. Solid: all 30.'), a: fr(S, 'more-data', 0.4, 0.5) });
  else if (S.between('use-arrive', 'use-measure')) cells.push(chips(FINAL, true), { k: 'text', text: S.l('parámetros fijos', 'frozen parameters'), a: fr(S, 'use-arrive', 0.3, 0.4) });
  else if (S.between('use-measure', 'use-compute')) {
    cells.push(
      { k: 'ro', name: S.l('enlaces', 'links'), value: '2', tone: 'sig', a: fr(S, 'use-measure', 0.55, 0.65) },
      { k: 'ro', name: S.l('mayúsculas', 'capitals'), value: pct(S, 0.24), tone: 'sig', a: fr(S, 'use-measure', 0.62, 0.72) },
      { k: 'text', text: S.l('Las mismas dos características que en el entrenamiento.', 'The same two features as in training.'), tone: 'sig', a: fr(S, 'use-measure', 0.2, 0.35) },
    );
  } else if (S.between('use-compute', 'train-vs-use')) cells.push(chips(FINAL, true), { k: 'arith', m: FINAL, l: 2, c: 24, a: fr(S, 'use-compute', 0.22, 0.32) });
  else if (S.between('try-use', 'garbage')) {
    const last = probes[probes.length - 1];
    cells.push(chips(FINAL, true), last ? { k: 'arith', m: FINAL, l: last.l, c: last.c } : { k: 'text', text: S.l('Toca el plano para poner un correo.', 'Tap the plane to place an email.') });
  }
  flow(S, R.aside, cells, aA);
}

export default scene;
