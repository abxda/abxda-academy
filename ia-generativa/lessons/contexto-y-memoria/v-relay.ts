// Vista 3: la aplicación guarda la conversación y la reenvía entera en cada turno (el modelo no tiene estado);
// luego, la prueba: enviar todo el historial o solo la pregunta.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { NO_NAME, YES_NAME } from './model';
import { st } from './state';
import { FS, area, bubble, card, chip, fitText, fits, fr, growArrow, lock, para, smooth } from './ui';

type Card = { role: 'user' | 'ai'; n: number };
const label = (S: Frame, c: Card) => (c.role === 'user' ? S.l('tú', 'you') : S.l('IA', 'AI')) + ' ' + c.n;

/** Tarjeta de mensaje (igual ancho para todos: aquí aún no importa su largo). */
function msgCard(S: Frame, x: number, y: number, w: number, h: number, c: Card, o: { a?: number; hot?: number; ghost?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, c.role === 'user' ? 'sig' : 'lat'), u = S.u;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: o.ghost ? alpha(p.stage, 0.5) : alpha(t.c, 0.16 + 0.32 * (o.hot ?? 0)), stroke: t.c, lw: (o.hot ?? 0) > 0.4 ? 2.6 : 1.4, r: 4 * u, dash: o.ghost ? [4, 3] : undefined });
    if (c.role === 'ai' && !o.ghost) d.rect(x + 2 * u, y + 2.5 * u, w - 4 * u, 2.5 * u, { fill: alpha(t.c, 0.6) });
    // si «tú 1» no cabe, solo el papel («tú» / «IA»)
    const full = label(S, c), str = fits(S, full, w - 6 * u, 12.5, 700) ? full : c.role === 'user' ? S.l('tú', 'you') : S.l('IA', 'AI');
    fitText(S, str, x + w / 2, y + h / 2 + (c.role === 'ai' ? 1 : 0), w - 4 * u, 12.5, { weight: 700, color: t.ink, align: 'center', base: 'middle' });
  });
}

/** Modelo en miniatura (una llamada): caja de pesos con candado. */
function miniModel(S: Frame, x: number, y: number, w: number, h: number, a = 1, hot = 0) {
  const { d } = S, wt = tone(S, 'w'), u = S.u;
  d.withAlpha(a, () => {
    d.rect(x, y, w, h, { fill: alpha(wt.c, 0.12 + 0.2 * hot), stroke: wt.c, lw: 1.6, r: 4 * u });
    fitText(S, S.l('modelo', 'model'), x + w / 2, y + 5 * u, w - 6 * u, 12, { weight: 800, color: wt.ink, align: 'center', base: 'top' });
    const c = Math.max(1.5, Math.round(1.8 * u));
    if (h >= (FS(S, 12) + 13) * u + 8 * c) lock(S, x + w / 2 - 4 * c, y + h - 8 * c - 4 * u, c);
  });
}

const ROWS: Card[][] = [
  [{ role: 'user', n: 1 }],
  [{ role: 'user', n: 1 }, { role: 'ai', n: 1 }, { role: 'user', n: 2 }],
  [{ role: 'user', n: 1 }, { role: 'ai', n: 1 }, { role: 'user', n: 2 }, { role: 'ai', n: 2 }, { role: 'user', n: 3 }],
];
const SAVED: Card[] = [{ role: 'user', n: 1 }, { role: 'ai', n: 1 }, { role: 'user', n: 2 }, { role: 'ai', n: 2 }, { role: 'user', n: 3 }, { role: 'ai', n: 3 }];
const TURN_SEG = ['turn1', 'turn2', 'turn3'];

/** Cuándo queda guardado cada mensaje en la lista de la aplicación (segmento y fracción). */
function savedAt(S: Frame, i: number): number {
  const turn = Math.floor(i / 2), isAi = i % 2 === 1, seg = TURN_SEG[turn];
  return isAi ? fr(S, seg, 0.72, 0.84) : fr(S, seg, 0.04, 0.14);
}

/** Medidas de las filas (tarjetas, modelo en miniatura, flechas) según el escenario. */
function dims(S: Frame) {
  const u = S.u, A = area(S), por = S.portrait;
  const ch = (FS(S, 12.5) + 12) * u, gap = 4 * u, arrowW = (por ? 14 : 56) * u, arrow2 = (por ? 12 : 28) * u;
  const mw = Math.max((por ? 50 : 76) * u, S.d.measure(S.l('modelo', 'model'), { size: FS(S, 12), weight: 800 }) + 8 * u);
  let cw = (por ? 36 : 58) * u;
  const fixed = arrowW + mw + arrow2 + 4 * gap;
  const maxRowsW = por ? A.w : A.w - Math.min(250 * u, A.w * 0.27) - 24 * u;
  cw = Math.min(cw, (maxRowsW - fixed) / 6);
  const rowsW = 5 * (cw + gap) - gap + arrowW + mw + arrow2 + cw;
  return { A, ch, gap, arrowW, arrow2, mw, cw, rowsW };
}

function lay(S: Frame) {
  const u = S.u, D = dims(S), A = D.A;
  if (S.portrait) {
    const appH = Math.min(96 * u, A.h * 0.26), rowH = Math.min((A.h - appH - 12 * u - 34 * u) / 3, 92 * u);
    const Hb = appH + 12 * u + 3 * rowH + 34 * u, y0 = A.y + Math.max(0, (A.h - Hb) / 2);
    return { D, rowH, app: { x: A.x, y: y0, w: A.w, h: appH } as Rect, rows: { x: A.x + (A.w - D.rowsW) / 2, y: y0 + appH + 12 * u, w: D.rowsW, h: 3 * rowH + 34 * u } as Rect };
  }
  const appW = Math.min(250 * u, A.w * 0.27), rowH = Math.min((A.h - 34 * u) / 3, 96 * u), Hb = 3 * rowH + 34 * u;
  const total = appW + 24 * u + D.rowsW, x0 = A.x + Math.max(0, (A.w - total) / 2), y0 = A.y + Math.max(0, (A.h - Hb) / 2);
  // la tarjeta de la aplicación mide lo que su lista (seis mensajes) necesita
  const cw = 52 * u, perRow = Math.max(1, Math.floor((appW - 18 * u) / (cw + 5 * u))), chh = (FS(S, 12.5) + 10) * u;
  const appH = Math.min(Hb, 24 * u + (FS(S, 14) + FS(S, 12)) * u + Math.ceil(6 / perRow) * (chh + 5 * u) + 12 * u);
  return { D, rowH, app: { x: x0, y: y0, w: appW, h: appH } as Rect, rows: { x: x0 + appW + 24 * u, y: y0, w: D.rowsW, h: Hb } as Rect };
}

function drawApp(S: Frame, R: Rect, o: { hot: number; nameHot: number; nameOut: number; listA: (i: number) => number }) {
  const { d, pal: p } = S, u = S.u, ink = tone(S, 'ink');
  card(S, R, { fill: alpha(p.surface, 0.75), hot: o.hot * 0.4 });
  fitText(S, S.l('aplicación', 'application'), R.x + 10 * u, R.y + 8 * u, R.w - 20 * u, 14, { weight: 800, base: 'top' });
  fitText(S, S.l('guarda la conversación', 'keeps the conversation'), R.x + 10 * u, R.y + 8 * u + FS(S, 14) * u + 4 * u, R.w - 20 * u, 12, { weight: 600, color: p.mute, base: 'top' });
  // lista guardada: tarjetas que se acomodan en filas
  const cw = (S.portrait ? 40 : 52) * u, ch = (FS(S, 12.5) + 10) * u, gap = 5 * u;
  let x = R.x + 10 * u, y = R.y + 14 * u + (FS(S, 14) + FS(S, 12)) * u + 10 * u;
  SAVED.forEach((c, i) => {
    const a = o.listA(i);
    if (x + cw > R.x + R.w - 8 * u) { x = R.x + 10 * u; y += ch + gap; }
    if (y + ch > R.y + R.h - 4 * u) return;
    if (a > 0.01) {
      msgCard(S, x, y, cw, ch, c, { a, hot: i === 0 ? o.nameHot : 0 });
      if (i === 0 && o.nameOut > 0.01) d.withAlpha(o.nameOut, () => d.rect(x - 3 * u, y - 3 * u, cw + 6 * u, ch + 6 * u, { stroke: tone(S, 'err').c, lw: 2, r: 5 * u, dash: [4, 3] }));
    }
    x += cw + gap;
  });
  void ink;
}

export function drawRelay(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = lay(S), s = st(S);
  const sendA = fr(S, 'demo-send', 0.04, 0.2), rowsA = 1 - fr(S, 'demo-send', 0, 0.14);
  const notExist = S.on('not-exist') ? fr(S, 'not-exist', 0.1, 0.35) : 0;
  const stateless = S.on('stateless') ? fr(S, 'stateless', 0.1, 0.35) : 0;
  drawApp(S, L.app, {
    hot: Math.max(stateless * (1 - sendA), 0),
    nameHot: fr(S, 'turn3', 0.5, 0.7) * (1 - sendA) + notExist,
    nameOut: notExist,
    listA: (i) => (S.on('demo-send') ? 1 : savedAt(S, i)),
  });

  // ── filas: una llamada por turno ──
  if (rowsA > 0.01) d.withAlpha(rowsA, () => {
    const R = L.rows, n = 3, rowH = L.rowH, D = L.D, { cw, ch, gap, mw, arrowW, arrow2 } = D;
    const mh = Math.min(rowH - 26 * u, 60 * u);
    const intro = fr(S, 'app', 0.3, 0.5);
    const mx = R.x + 5 * (cw + gap) - gap + arrowW;
    for (let r = 0; r < n; r++) {
      const seg = TURN_SEG[r], ra = S.on(seg) ? fr(S, seg, 0, 0.12) : 0;
      const y0 = R.y + r * rowH, cy = y0 + 18 * u + mh / 2;
      if (ra > 0.01) fitText(S, S.l(`turno ${r + 1}`, `turn ${r + 1}`), R.x, y0 + 2 * u, R.w * 0.5, 13, { weight: 800, color: p.ink2, base: 'top', a: ra });
      // el paquete que se envía, desde la aplicación
      const cards = ROWS[r], pk = smooth(fr(S, seg, 0.12, 0.38));
      const packW = cards.length * (cw + gap) - gap, px0 = R.x, px = px0 - (1 - pk) * 24 * u;
      if (ra > 0.01) cards.forEach((c, i) => msgCard(S, px + i * (cw + gap), cy - ch / 2, cw, ch, c, { a: ra * clamp(pk * 1.6 - i * 0.12), hot: r === 2 && i === 0 ? fr(S, 'turn3', 0.5, 0.7) : 0 }));
      // flecha → modelo → respuesta
      growArrow(S, px0 + packW + 4 * u, cy, mx - 4 * u, cy, fr(S, seg, 0.38, 0.5) * ra, p.ink2, 2);
      const ma = r === 0 ? Math.max(intro, ra) : ra;
      miniModel(S, mx, cy - mh / 2, mw, mh, ma, fr(S, seg, 0.45, 0.6) * (1 - fr(S, seg, 0.7, 0.85)));
      const rx = mx + mw + 4 * u;
      growArrow(S, rx, cy, rx + arrow2 - 4 * u, cy, fr(S, seg, 0.55, 0.65) * ra, p.ink2, 2);
      msgCard(S, rx + arrow2, cy - ch / 2, cw, ch, { role: 'ai', n: r + 1 }, { a: fr(S, seg, 0.6, 0.72) * ra });
      if (r === 2 && ra > 0.01) {
        const k = fr(S, 'turn3', 0.5, 0.7);
        if (k > 0.01) chip(S, S.l('«me llamo Ana»', '“my name is Ana”'), px0, cy + ch / 2 + 14 * u, 'sig', { align: 'left', a: k, size: 12.5, maxW: R.w * 0.6 });
      }
      // «sin estado»: cada llamada por separado
      if (stateless > 0.01 && r > 0) d.line(R.x, y0 - 2 * u, R.x + R.w, y0 - 2 * u, alpha(p.ink2, 0.5 * stateless), 1.2, [5, 5]);
    }
    if (S.on('app') && !S.on('turn1')) {
      // antes del primer turno: solo el modelo, que no guarda nada
      const k = fr(S, 'app', 0.5, 0.7);
      fitText(S, S.l('no guarda nada', 'stores nothing'), mx + mw / 2, R.y + 18 * u + mh + 8 * u, R.w, 12.5, { weight: 700, color: tone(S, 'w').ink, align: 'center', base: 'top', a: k });
    }
    if (stateless > 0.01) chip(S, S.l('sin estado: cada llamada empieza de cero', 'stateless: every call starts from scratch'), R.x + R.w / 2, R.y + n * rowH + 14 * u, 'w', { a: stateless, size: 13, maxW: Math.max(R.w, L.D.A.w * 0.9) });
  });

  // ── la prueba: todo el historial o solo la pregunta ──
  if (sendA > 0.01) d.withAlpha(sendA, () => {
    const R = L.rows, all: Card[] = ROWS[2], k = s.send;   // 0 = todo, 1 = solo la pregunta
    const cw = Math.min((S.portrait ? 46 : 72) * u, (R.w - 24 * u) / 5.4), ch = (FS(S, 13) + 16) * u, gap = 6 * u;
    const packW = all.length * (cw + gap) - gap, mw = (S.portrait ? 72 : 104) * u, mh = (S.portrait ? 60 : 76) * u;
    const blockH = 24 * u + ch + 26 * u + 30 * u + mh + 14 * u + 44 * u;
    const y0 = R.y + Math.max(0, (R.h - blockH) / 2);
    fitText(S, S.l('lo que envía la aplicación', 'what the app sends'), R.x, y0, R.w, 13, { weight: 800, color: p.ink2, base: 'top' });
    const cy = y0 + 24 * u + ch / 2;
    const px = R.x + Math.max(0, (R.w - packW) / 2);
    all.forEach((c, i) => {
      const last = i === all.length - 1;
      msgCard(S, px + i * (cw + gap), cy - ch / 2, cw, ch, c, { a: last ? 1 : 1 - 0.65 * k, ghost: !last && k > 0.5, hot: i === 0 ? (1 - k) * 0.6 : 0 });
    });
    // marco del contexto: rodea lo que sí se envía
    const fx0 = px + (packW - cw) * k - 5 * u, fx1 = px + packW + 5 * u;
    d.rect(fx0, cy - ch / 2 - 5 * u, fx1 - fx0, ch + 10 * u, { stroke: tone(S, 'lat').c, lw: 2, r: 6 * u });
    fitText(S, S.l('contexto', 'context'), fx1, cy + ch / 2 + 8 * u, Math.max(60 * u, fx1 - fx0), 12.5, { weight: 800, color: tone(S, 'lat').ink, align: 'right', base: 'top' });
    if (k > 0.5) fitText(S, S.l('no se envían', 'not sent'), px, cy + ch / 2 + 8 * u, Math.max(10, fx0 - px - 8 * u), 12.5, { weight: 700, color: p.mute, base: 'top', a: (k - 0.5) * 2 });
    // modelo y respuesta
    const my = cy + ch / 2 + 26 * u + 30 * u, mx = R.x + (R.w - mw) / 2;
    growArrow(S, mx + mw / 2, cy + ch / 2 + 8 * u, mx + mw / 2, my - 4 * u, 1, p.ink2, 2);
    miniModel(S, mx, my, mw, mh, 1, 0.2);
    const by = my + mh + 14 * u, bwMax = Math.min(R.w, 400 * u), size = FS(S, S.portrait ? 14 : 15);
    const txtA = YES_NAME[S.lang], txtB = NO_NAME[S.lang];
    if (k < 0.98) bubble(S, txtA, 'ai', R.x + (R.w - bwMax) / 2, by, bwMax, size, { a: 1 - k });
    if (k > 0.02) bubble(S, txtB, 'ai', R.x + (R.w - bwMax) / 2, by, bwMax, size, { a: k, hot: notExist * 0.5 });
    if (notExist > 0.01) para(S, S.l('«Ana» no está en el contexto: para el modelo, no existe', '“Ana” is not in the context: for the model, it does not exist'), R.x - (S.portrait ? 0 : 40 * u), by + 46 * u, R.w + (S.portrait ? 0 : 80 * u), FS(S, 13.5), { weight: 800, color: tone(S, 'err').ink, align: 'center', a: notExist });
  });
}
