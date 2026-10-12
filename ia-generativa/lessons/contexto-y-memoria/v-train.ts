// Vista 4: el tren de contexto. Cada vagón es un mensaje y su largo, su número de tokens; la ventana es el tramo de largo
// fijo que el modelo lee. Se suman las instrucciones del sistema y la respuesta, el tren se llena y, cuando ya no cabe,
// los vagones más viejos se desenganchan y bajan a la vía de abajo («fuera de la ventana»).
// También exporta las piezas que reutilizan las vistas de memoria y el repaso.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { NO_NAME, SYS_LINES, WINDOW, chatMsg, type Role } from './model';
import { st, stepNow } from './state';
import { FS, area, bubble, card, chip, fitText, fr, gauge, para, wagon, windowFrame } from './ui';

export interface Geom { A: Rect; x0: number; x1: number; y: number; h: number; scale: number; frame: Rect; rulerY: number; gaugeY: number; low: Rect }

/** Geometría del tren: ventana arriba (todo el ancho), regla, ocupación y una zona libre abajo. */
export function geom(S: Frame, A = area(S), limit = WINDOW, lowNeed = 150): Geom {
  const u = S.u, m = 8 * u, short = S.H < 360;
  const h = short ? clamp(26 * u, 22, 30) : clamp(Math.min(46 * u, A.h * 0.1), 26, 52);
  // en escenarios altos, el conjunto (ventana, regla, ocupación y zona de abajo) se centra en vertical
  const need = (short ? 20 : 26) * u + h + 18 * u + (FS(S, 12) + 14) * u + (short ? 24 : 34) * u + lowNeed * u;
  const top = A.y + (short ? 20 : 26) * u + Math.max(0, (A.h - need) * 0.45);
  const x0 = A.x + m + 6 * u, x1 = A.x + A.w - m - 6 * u;
  const frame: Rect = { x: x0 - 6 * u, y: top, w: x1 - x0 + 12 * u, h: h + 12 * u + 6 * u };
  const y = top + 6 * u, rulerY = frame.y + frame.h + 5 * u, gaugeY = rulerY + (FS(S, 12) + 14) * u;
  const lowY = gaugeY + (short ? 24 : 34) * u;
  return { A, x0, x1, y, h, scale: (x1 - x0) / limit, frame, rulerY, gaugeY, low: { x: A.x, y: lowY, w: A.w, h: A.y + A.h - lowY } };
}

/** Rieles de una vía (entre x0 y x1, bajo los vagones). */
export function rails(S: Frame, x0: number, x1: number, y: number, a = 1) {
  const { d, pal: p } = S;
  d.withAlpha(a, () => { d.line(x0, y, x1, y, p.lineStrong, 1.5); d.line(x0, y + 3 * S.u, x1, y + 3 * S.u, alpha(p.lineStrong, 0.5), 1, [3, 4]); });
}

/** Tren fijo (sin estado): los vagones en fila desde x. Para las vistas de memoria y el repaso. */
export interface W0 { role: Role; tokens: number; label?: string | null; hot?: number; a?: number; len?: number; dash?: boolean }
export function trainRow(S: Frame, x: number, y: number, h: number, scale: number, ws: W0[]) {
  let cx = x;
  const out: Rect[] = [];
  ws.forEach((w) => {
    const len = (w.len ?? 1) * w.tokens * scale, r = { x: cx + 1, y, w: Math.max(0, len - 2), h };
    if ((w.a ?? 1) > 0.01 && r.w > 0.5) wagon(S, r, w.role, { a: w.a, hot: w.hot, label: w.label, dash: w.dash });
    out.push(r); cx += len;
  });
  return out;
}

/** Leyenda de los vagones: la forma acompaña al color. */
function legend(S: Frame, x: number, y: number, w: number, a: number) {
  const { d, pal: p } = S, u = S.u, h = 22 * u, items: [Role, string][] = [['user', S.l('tu mensaje', 'your message')], ['ai', S.l('respuesta del modelo', 'model’s answer')]];
  let cx = x, cy = y;
  d.withAlpha(a, () => {
    items.forEach(([r, t]) => {
      const tw = d.measure(t, { size: FS(S, 12.5), weight: 600 }) + 46 * u;
      if (cx + tw > x + w && cx > x) { cx = x; cy += h + 8 * u; }
      wagon(S, { x: cx, y: cy, w: 34 * u, h }, r, { label: r === 'user' ? S.l('tú', 'you') : S.l('IA', 'AI'), wheels: false });
      d.text(t, cx + 40 * u, cy + h / 2, { size: FS(S, 12.5), weight: 600, color: p.ink2, base: 'middle' });
      cx += tw + 12 * u;
    });
    const t = S.l('largo del vagón = número de tokens', 'car length = number of tokens');
    fitText(S, t, x, cy + h + 10 * u, w, 12.5, { weight: 700, color: p.ink2, base: 'top' });
  });
}

export function drawTrain(S: Frame) {
  const { d, pal: p } = S, u = S.u, G = geom(S), s = st(S), step = stepNow(S);
  const winA = fr(S, 'window', 0.1, 0.35), rulerA = fr(S, 'ruler', 0.08, 0.3);
  const frameHot = fr(S, 'window', 0.1, 0.35) * (1 - fr(S, 'window', 0.75, 0.95));
  // rieles y ventana
  rails(S, G.A.x + 4 * u, G.A.x + G.A.w - 4 * u, G.y + G.h + 4 * u, 1);
  if (winA > 0.01) windowFrame(S, G.x0, G.x1, G.y, G.h, WINDOW, { a: winA, label: S.l(`ventana de contexto · ${S.n(WINDOW, 0)} tokens`, `context window · ${S.n(WINDOW, 0)} tokens`), ruler: rulerA, hot: frameHot });
  else fitText(S, S.l('lo que se envía al modelo', 'what is sent to the model'), G.x0, G.frame.y - 5 * u, G.x1 - G.x0, 13, { weight: 800, color: p.ink2, base: 'bottom' });

  // zona de abajo: vía de los que salieron (desde que se desengancha el primero)
  const L = G.low, land = !S.portrait;
  const dropped = s.order.filter((id) => (s.disp[id]?.drop ?? 0) > 0.02);
  const sidA = Math.max(dropped.length ? 1 : 0, 0) * (S.on('overflow') ? 1 : 0);
  const sid: Rect = land ? { x: L.x + 8 * u, y: L.y + 22 * u, w: L.w * 0.52, h: G.h } : { x: L.x + 8 * u, y: L.y + 22 * u, w: L.w - 16 * u, h: G.h };
  if (sidA > 0.01) {
    fitText(S, S.l('fuera de la ventana: el modelo no los ve', 'outside the window: the model can’t see them'), sid.x, sid.y - 6 * u, sid.w, 12.5, { weight: 800, color: tone(S, 'err').ink, base: 'bottom', a: sidA });
    rails(S, sid.x, sid.x + sid.w, sid.y + G.h + 4 * u, sidA * 0.8);
  }
  // corrimiento de la vía de abajo para que se vean los últimos en salir
  let maxOut = 0;
  dropped.forEach((id) => { const q = s.disp[id]; if (q.drop > 0.5) maxOut = Math.max(maxOut, q.off + q.len); });
  const shift = Math.max(0, maxOut * G.scale - sid.w);

  // vagones
  const showNums = S.on('train') && !S.on('ruler');
  s.order.forEach((id, i) => {
    const q = s.disp[id];
    if (!q) return;
    const reveal = S.on('window') ? 1 : fr(S, 'train', 0.1 + 0.09 * i, 0.2 + 0.09 * i);
    const a = q.a * reveal * (1 - 0.35 * q.drop);
    if (a < 0.01) return;
    const xTrack = G.x0 + q.off * G.scale, xSid = sid.x - shift + q.off * G.scale;
    const x = xTrack + (xSid - xTrack) * q.drop, y = G.y + (sid.y - G.y) * q.drop;
    const w = Math.max(0, q.len * G.scale - 2);
    const hot = q.name ? Math.max(fr(S, 'name-lost', 0.1, 0.3) * (1 - fr(S, 'try-more', 0, 0.2) * 0.5), 0) : q.role === 'sys' ? fr(S, 'system', 0.25, 0.45) * (1 - fr(S, 'answer-space', 0, 0.2)) : q.role === 'ai' && id === 'A3' ? fr(S, 'answer-space', 0.35, 0.55) * (1 - fr(S, 'fill', 0, 0.2)) : 0;
    const draw = () => wagon(S, { x: x + 1, y, w, h: G.h }, q.role, { a, hot, dash: q.role === 'ai' && q.len < q.tokens - 0.5 });
    if (q.drop > 0.5) d.clip(sid.x - 2, sid.y - 4 * u, sid.w + 4, G.h + 14 * u, draw); else draw();
    // antes de la regla, cada vagón dice sus tokens debajo de la vía
    if (showNums && q.drop < 0.5 && w > 14 * u) d.text(S.n(q.tokens, 0), x + 1 + w / 2, G.frame.y + G.frame.h + 5 * u, { size: FS(S, 12), font: 'mono', weight: 700, color: p.ink2, align: 'center', base: 'top', a: a * (1 - fr(S, 'ruler', 0, 0.2)) });
  });

  // ocupación
  let used = 0;
  s.order.forEach((id) => { const q = s.disp[id]; if (q) used += q.len * (1 - q.drop) * q.a; });
  if (rulerA > 0.01) d.withAlpha(rulerA, () => {
    const full = used >= WINDOW - 0.5;
    const txt = S.l(`ocupado: ${S.n(Math.round(used), 0)} de ${S.n(WINDOW, 0)} tokens`, `used: ${S.n(Math.round(used), 0)} of ${S.n(WINDOW, 0)} tokens`);
    const tw = Math.min(G.A.w * 0.72, d.measure(txt, { size: FS(S, 13), weight: 800 }) + 4 * u);
    fitText(S, txt, G.x0, G.gaugeY, tw, 13, { weight: 800, color: full ? tone(S, 'err').ink : p.ink, base: 'top' });
    gauge(S, { x: G.x0 + tw + 10 * u, y: G.gaugeY + 3 * u, w: Math.max(30 * u, G.x1 - G.x0 - tw - 10 * u), h: 10 * u }, used, WINDOW, { over: full && S.on('fill') });
  });

  // leyenda (al presentar el tren)
  const legA = fr(S, 'train', 0.55, 0.75) * (1 - fr(S, 'system', 0, 0.2));
  if (legA > 0.01) legend(S, L.x + 8 * u, L.y + 6 * u, L.w - 16 * u, legA);

  // instrucciones del sistema: tarjeta con sus renglones (ilustrativos)
  const sysA = fr(S, 'system', 0.25, 0.45) * (1 - fr(S, 'answer-space', 0, 0.2));
  if (sysA > 0.01 && step >= 1) d.withAlpha(sysA, () => {
    const cw = Math.min(L.w - 16 * u, 340 * u), r: Rect = { x: L.x + 8 * u, y: L.y + 8 * u, w: cw, h: 0 };
    const size = FS(S, 13), room = L.h - 14 * u, lh = size * u * 1.35;
    const ls = SYS_LINES[S.lang].slice(0, Math.max(1, Math.floor((room - 36 * u) / lh)));
    r.h = 30 * u + ls.length * lh + 6 * u;
    card(S, r, { fill: alpha(p.surface, 0.92) });
    fitText(S, S.l('instrucciones del sistema · no las ves', 'system prompt · you don’t see it'), r.x + 10 * u, r.y + 8 * u, r.w - 20 * u, 12.5, { weight: 800, color: p.mute, base: 'top' });
    ls.forEach((l, i) => fitText(S, l, r.x + 10 * u, r.y + 28 * u + i * size * u * 1.35, r.w - 20 * u, 13, { weight: 600, font: 'mono', base: 'top' }));
  });

  // la respuesta se escribe dentro de la ventana (el vagón se resalta; el rótulo va abajo, sin cruzar la regla)
  const ansA = fr(S, 'answer-space', 0.35, 0.55) * (1 - fr(S, 'fill', 0, 0.2));
  const a3 = s.disp.A3;
  if (ansA > 0.01 && a3) {
    const ax = G.x0 + (a3.off + a3.len / 2) * G.scale;
    const txt = S.l('la respuesta también ocupa lugar', 'the answer takes up room too');
    const tw = Math.min(L.w - 16 * u, d.measure(txt, { size: FS(S, 13.5), weight: 800 }) + 4 * u);
    const tx = clamp(ax - tw / 2, L.x + 8 * u, L.x + L.w - 8 * u - tw);
    chip(S, txt, tx, L.y + 16 * u, 'lat', { align: 'left', a: ansA, size: 13.5, maxW: L.w - 16 * u });
  }

  // ¿sigue tu nombre en la ventana?
  if (S.on('fill')) {
    const nm = s.disp.U1, inside = nm ? nm.drop < 0.5 : false, a = fr(S, 'fill', 0.5, 0.7);
    const txt = inside ? S.l('tu nombre: dentro de la ventana', 'your name: inside the window') : S.l('tu nombre: fuera de la ventana', 'your name: outside the window');
    const y = land ? L.y + 22 * u + G.h / 2 : sid.y + G.h + 26 * u;
    if (land) chip(S, txt, L.x + L.w - 8 * u, y, inside ? 'sig' : 'err', { align: 'right', a, size: 13, maxW: L.w * 0.42 });
    else chip(S, txt, L.x + 8 * u, y, inside ? 'sig' : 'err', { align: 'left', a, size: 13, maxW: L.w - 16 * u });
  }

  // la pregunta y la respuesta sin el nombre
  const qa = step >= 5 ? fr(S, 'name-lost', 0.35, 0.55) : 0;
  if (qa > 0.01 || (S.on('try-more') && step >= 5)) {
    const k = Math.max(qa, S.on('try-more') ? 1 : 0);
    const bw = land ? L.w * 0.42 : L.w - 16 * u, bx = land ? L.x + L.w - 8 * u - bw : L.x + 8 * u;
    let by = land ? L.y + 22 * u + G.h / 2 + 22 * u : sid.y + G.h + 44 * u;
    const size = FS(S, 13);
    if (by + 60 * u < L.y + L.h + 10 * u) {
      by += bubble(S, chatMsg('U3').text[S.lang], 'user', bx, by, bw, size, { a: k }) + 6 * u;
      if (by + 24 * u < L.y + L.h + 10 * u) bubble(S, NO_NAME[S.lang], 'ai', bx, by, bw, size, { a: k * fr(S, 'name-lost', 0.55, 0.7) || (S.on('try-more') ? 1 : 0) });
    }
  }
  // la aplicación aún los guarda
  if (S.on('try-more') && sidA > 0.01) {
    const a = fr(S, 'try-more', 0.45, 0.65);
    const y = sid.y + G.h + 10 * u;
    if (land) para(S, S.l('la aplicación aún los guarda', 'the app still keeps them'), sid.x, y, sid.w, FS(S, 12.5), { weight: 700, color: p.mute, a, italic: true });
  }
}
