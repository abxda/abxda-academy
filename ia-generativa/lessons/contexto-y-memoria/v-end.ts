// Vistas finales: las «memorias» de los asistentes (texto guardado fuera y vuelto a enviar), el resumen, las notas,
// la privacidad, el repaso y el puente a RAG. Todo es ilustrativo y puro (depende solo del tiempo).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { WINDOW } from './model';
import { geom, rails, trainRow, type W0 } from './v-train';
import { FS, area, bubble, card, chip, doc, fitText, fr, gauge, growArrow, lock, para, paraH, smooth, windowFrame } from './ui';

/** Ventana con su tren fijo, regla y ocupación. Devuelve la geometría para anotar. */
function windowTrain(S: Frame, ws: W0[], o: { label?: string; A?: Rect; gaugeA?: number; low?: number } = {}) {
  const { d, pal: p } = S, u = S.u, G = geom(S, o.A, WINDOW, o.low ?? 120);
  rails(S, G.A.x + 4 * u, G.A.x + G.A.w - 4 * u, G.y + G.h + 4 * u);
  windowFrame(S, G.x0, G.x1, G.y, G.h, WINDOW, { label: o.label ?? S.l(`ventana de contexto · ${S.n(WINDOW, 0)} tokens`, `context window · ${S.n(WINDOW, 0)} tokens`), ruler: 1 });
  const rects = trainRow(S, G.x0, G.y, G.h, G.scale, ws);
  const used = ws.reduce((a, w) => a + w.tokens * (w.len ?? 1) * (w.a ?? 1), 0);
  const ga = o.gaugeA ?? 1;
  if (ga > 0.01) d.withAlpha(ga, () => {
    const txt = S.l(`ocupado: ${S.n(Math.round(used), 0)} de ${S.n(WINDOW, 0)} tokens`, `used: ${S.n(Math.round(used), 0)} of ${S.n(WINDOW, 0)} tokens`);
    const tw = Math.min(G.A.w * 0.72, d.measure(txt, { size: FS(S, 13), weight: 800 }) + 4 * u);
    fitText(S, txt, G.x0, G.gaugeY, tw, 13, { weight: 800, base: 'top' });
    gauge(S, { x: G.x0 + tw + 10 * u, y: G.gaugeY + 3 * u, w: Math.max(30 * u, G.x1 - G.x0 - tw - 10 * u), h: 10 * u }, used, WINDOW);
  });
  void p;
  return { G, rects };
}

// ── memoria = texto guardado fuera ──────────────────────────────────────────────────────────────────
export function drawMemoryQ(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), dt = tone(S, 'dat');
  const v = S.portrait;
  const bw = v ? A.w * 0.8 : A.w * 0.26, bh = v ? Math.min(84 * u, A.h * 0.22) : Math.min(170 * u, A.h * 0.5);
  const gap = v ? (A.h - 3 * bh) / 2 : (A.w - 3 * bw) / 2;
  const box = (i: number): Rect => v ? { x: A.x + (A.w - bw) / 2, y: A.y + i * (bh + gap), w: bw, h: bh } : { x: A.x + i * (bw + gap), y: A.y + (A.h - bh) / 2, w: bw, h: bh };
  const a0 = fr(S, 'memory-q', 0.05, 0.2), a1 = fr(S, 'memory-q', 0.3, 0.45), a2 = fr(S, 'memory-q', 0.55, 0.7);
  // 1 · guardado fuera
  const b0 = box(0);
  d.withAlpha(a0, () => {
    card(S, b0, { tone: 'dat', dash: [5, 4], fill: alpha(dt.c, 0.08) });
    const th = para(S, S.l('texto guardado fuera del modelo', 'text stored outside the model'), b0.x + 10 * u, b0.y + 8 * u, b0.w - 20 * u, FS(S, 13), { weight: 800, color: dt.ink, maxLines: 2 });
    const ls = [S.l('notas: «se llama Ana»', 'notes: “her name is Ana”'), S.l('resumen de lo anterior', 'summary of earlier turns')];
    ls.forEach((l, i) => fitText(S, l, b0.x + 10 * u, b0.y + 14 * u + th + i * 20 * u, b0.w - 20 * u, 12.5, { weight: 600, font: 'mono', color: p.ink2, base: 'top' }));
  });
  // 2 · el contexto (tren corto)
  const b1 = box(1);
  d.withAlpha(a1, () => {
    card(S, b1, { tone: 'lat', fill: alpha(tone(S, 'lat').c, 0.05) });
    fitText(S, S.l('contexto de este turno', 'this turn’s context'), b1.x + 10 * u, b1.y + 8 * u, b1.w - 20 * u, 13, { weight: 800, color: tone(S, 'lat').ink, base: 'top' });
    const h = Math.min(32 * u, b1.h - 44 * u), sc = (b1.w - 20 * u) / 150;
    trainRow(S, b1.x + 10 * u, b1.y + b1.h - h - 12 * u, h, sc, [{ role: 'sys', tokens: 40, label: null }, { role: 'note', tokens: 40, hot: 0.5 }, { role: 'user', tokens: 35 }, { role: 'ai', tokens: 35 }]);
  });
  // 3 · el modelo, que solo lee
  const b2 = box(2);
  d.withAlpha(a2, () => {
    card(S, b2, { tone: 'w' });
    fitText(S, S.l('modelo · pesos fijos', 'model · fixed weights'), b2.x + 10 * u, b2.y + 8 * u, b2.w - 20 * u, 13, { weight: 800, color: tone(S, 'w').ink, base: 'top' });
    const c = Math.max(2, Math.round(2.6 * u));
    if (b2.h > 40 * u + 8 * c) lock(S, b2.x + b2.w / 2 - 4 * c, b2.y + b2.h - 8 * c - 10 * u, c);
  });
  const k1 = fr(S, 'memory-q', 0.4, 0.55), k2 = fr(S, 'memory-q', 0.65, 0.8);
  if (v) { growArrow(S, b0.x + b0.w / 2, b0.y + b0.h + 3 * u, b1.x + b1.w / 2, b1.y - 3 * u, k1, p.ink2); growArrow(S, b1.x + b1.w / 2, b1.y + b1.h + 3 * u, b2.x + b2.w / 2, b2.y - 3 * u, k2, p.ink2); }
  else { growArrow(S, b0.x + b0.w + 4 * u, b0.y + b0.h / 2, b1.x - 4 * u, b1.y + b1.h / 2, k1, p.ink2); growArrow(S, b1.x + b1.w + 4 * u, b1.y + b1.h / 2, b2.x - 4 * u, b2.y + b2.h / 2, k2, p.ink2); }
  const lab = S.l('se vuelve a enviar', 'sent again');
  if (k1 > 0.5) {
    if (v) fitText(S, lab, b0.x + b0.w / 2 + 10 * u, (b0.y + b0.h + b1.y) / 2, A.w * 0.45, 12.5, { weight: 700, color: dt.ink, base: 'middle', a: (k1 - 0.5) * 2 });
    else para(S, lab, b0.x + b0.w + 4 * u, b0.y + b0.h / 2 + 8 * u, gap - 8 * u, FS(S, 12.5), { weight: 700, color: dt.ink, align: 'center', a: (k1 - 0.5) * 2 });
  }
}

// ── el resumen ──────────────────────────────────────────────────────────────────────────────────────
export function drawSummary(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const k = smooth(fr(S, 'memory-summary', 0.25, 0.55)), nw = fr(S, 'memory-summary', 0.62, 0.78);
  const old: W0[] = ([{ role: 'user', tokens: 30 }, { role: 'ai', tokens: 60 }, { role: 'user', tokens: 30 }, { role: 'ai', tokens: 80 }] as W0[]).map((w) => ({ ...w, len: 1 - k, label: k > 0.3 ? null : undefined }));
  const ws: W0[] = [
    { role: 'sys', tokens: 60, label: S.l('instr.', 'instr.') },
    ...old,
    { role: 'sum', tokens: 40, len: k, a: clamp(k * 2) },
    { role: 'user', tokens: 30 }, { role: 'ai', tokens: 30 }, { role: 'user', tokens: 30 }, { role: 'ai', tokens: 50 },
    { role: 'user', tokens: 30, a: nw, len: nw }, { role: 'ai', tokens: 50, a: nw, len: nw },
  ];
  const { G } = windowTrain(S, ws);
  const L = G.low, bw = S.portrait ? L.w - 16 * u : Math.min(L.w * 0.6, 460 * u);
  const sa = fr(S, 'memory-summary', 0.4, 0.55);
  if (sa > 0.01) {
    const txt = S.l('resumen: «Se llama Ana, trabaja en logística y pidió ideas para ahorrar en envíos».', 'summary: “Her name is Ana, she works in logistics, and she asked for ideas to save on shipping.”');
    const r: Rect = { x: L.x + 8 * u, y: L.y + 8 * u, w: bw, h: 0 };
    const size = FS(S, 13);
    const h = paraH(S, txt, r.w - 20 * u, size, { weight: 600 });
    r.h = h + 16 * u;
    card(S, r, { tone: 'dat', dash: [5, 4], fill: alpha(p.surface, 0.92), a: sa });
    para(S, txt, r.x + 10 * u, r.y + 8 * u, r.w - 20 * u, size, { weight: 600, a: sa });
    const la = fr(S, 'memory-summary', 0.78, 0.92);
    if (la > 0.01) {
      const y = r.y + r.h + 10 * u;
      const lost = S.l('se perdió: «junta pedidos pequeños en un solo camión»', 'lost: “combine small orders into one truck”');
      if (y + 20 * u < L.y + L.h + 8 * u) {
        para(S, lost, r.x, y, Math.min(L.w - 16 * u, bw), FS(S, 12.5), { weight: 700, color: tone(S, 'err').ink, a: la, maxLines: 2 });
      }
    }
  }
}

// ── las notas ───────────────────────────────────────────────────────────────────────────────────────
export function drawNotes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A0 = area(S);
  const ca = fr(S, 'memory-notes', 0.05, 0.2), hook = smooth(fr(S, 'memory-notes', 0.35, 0.6)), q = fr(S, 'memory-notes', 0.6, 0.72), ans = fr(S, 'memory-notes', 0.78, 0.9);
  // el tren de la conversación nueva (abajo de las notas)
  const noteH = (FS(S, 12.5) + 2 * FS(S, 13) * 1.3 + 22) * u;
  const A: Rect = { x: A0.x, y: A0.y + noteH + 26 * u, w: A0.w, h: A0.h - noteH - 26 * u };
  const ws: W0[] = [
    { role: 'sys', tokens: 60, label: S.l('instr.', 'instr.') },
    { role: 'note', tokens: 40, a: hook, len: hook, hot: 0.4 },
    { role: 'user', tokens: 30, a: q, len: q },
    { role: 'ai', tokens: 30, a: ans, len: ans },
  ];
  const { G } = windowTrain(S, ws, { A, label: S.l('conversación nueva · ventana de 400 tokens', 'new conversation · 400-token window'), low: 80 });
  // tarjeta de notas guardadas
  const nw = Math.min(A0.w, 340 * u), nr: Rect = { x: A0.x, y: A0.y, w: nw, h: noteH };
  d.withAlpha(ca, () => {
    card(S, nr, { tone: 'dat', dash: [5, 4], fill: alpha(tone(S, 'dat').c, 0.08) });
    fitText(S, S.l('notas guardadas por la aplicación', 'notes saved by the app'), nr.x + 10 * u, nr.y + 8 * u, nr.w - 20 * u, 12.5, { weight: 800, color: tone(S, 'dat').ink, base: 'top' });
    [S.l('· se llama Ana', '· her name is Ana'), S.l('· trabaja en logística', '· works in logistics')].forEach((t, i) => fitText(S, t, nr.x + 10 * u, nr.y + (FS(S, 12.5) + 14) * u + i * FS(S, 13) * 1.3 * u, nr.w - 20 * u, 13, { weight: 600, font: 'mono', base: 'top' }));
  });
  // la nota baja y se engancha
  const nx = G.x0 + (60 + 20) * G.scale;
  if (hook > 0.01 && hook < 0.99) growArrow(S, nr.x + 40 * u, nr.y + nr.h + 2 * u, nx, G.frame.y - 2 * u, hook, tone(S, 'dat').c, 2);
  // pregunta y respuesta: en horizontal, junto a la tarjeta de notas; en vertical, debajo del tren
  const L = G.low, size = FS(S, 13.5);
  const bw = S.portrait ? L.w - 16 * u : Math.min(A0.w - nw - 30 * u, 360 * u), bx = S.portrait ? L.x + 8 * u : A0.x + A0.w - bw;
  let y = S.portrait ? L.y + 6 * u : A0.y;
  if (q > 0.01) y += bubble(S, S.l('¿Cómo me llamo?', 'What is my name?'), 'user', bx, y, bw, size, { a: q }) + 6 * u;
  if (ans > 0.01) bubble(S, S.l('Te llamas Ana.', 'Your name is Ana.'), 'ai', bx, y, bw, size, { a: ans });
  void p;
}

// ── privacidad ──────────────────────────────────────────────────────────────────────────────────────
export function drawPrivacy(S: Frame) {
  const { d, pal: p } = S, u = S.u, A0 = area(S);
  const provH = Math.min(84 * u, A0.h * 0.28);
  const A: Rect = { x: A0.x, y: A0.y, w: A0.w, h: A0.h - provH - 20 * u };
  const ws: W0[] = [
    { role: 'sys', tokens: 60, label: S.l('instr.', 'instr.') },
    { role: 'note', tokens: 40 },
    { role: 'user', tokens: 120, label: S.l('documento', 'document') },
    { role: 'user', tokens: 30 }, { role: 'ai', tokens: 60 }, { role: 'user', tokens: 30 },
  ];
  const { G } = windowTrain(S, ws, { A, gaugeA: 0, low: 10 });
  // el proveedor
  const pw = Math.min(A0.w * 0.7, 300 * u), pr: Rect = { x: A0.x + (A0.w - pw) / 2, y: A0.y + A0.h - provH, w: pw, h: provH };
  const pa = fr(S, 'privacy', 0.25, 0.4);
  d.withAlpha(pa, () => {
    card(S, pr, { fill: alpha(p.surface, 0.9) });
    fitText(S, S.l('proveedor del modelo', 'model provider'), pr.x + 10 * u, pr.y + 8 * u, pr.w - 20 * u, 13.5, { weight: 800, base: 'top' });
    // servidores (rayas)
    const sy = pr.y + 32 * u, sh = Math.max(6 * u, (pr.h - 44 * u) / 3);
    for (let i = 0; i < 3; i++) { d.rect(pr.x + 12 * u, sy + i * (sh + 3 * u), pr.w - 24 * u, sh, { fill: p.surface2, stroke: p.line, lw: 1, r: 2 }); d.circle(pr.x + 20 * u, sy + i * (sh + 3 * u) + sh / 2, 2 * u, { fill: tone(S, 'dat').c }); }
  });
  // todo el tren viaja en cada turno
  const ka = fr(S, 'privacy', 0.35, 0.6);
  const mx = (G.x0 + G.x1) / 2;
  growArrow(S, mx, G.rulerY + 24 * u, mx, pr.y - 4 * u, ka, p.ink2, 2.4);
  const lab = S.l('se envía todo, en cada turno', 'everything is sent, every turn');
  if (ka > 0.5) para(S, lab, mx + 10 * u, (G.rulerY + 24 * u + pr.y) / 2 - 10 * u, A0.x + A0.w - mx - 14 * u, FS(S, 12.5), { weight: 800, color: p.ink, a: (ka - 0.5) * 2, maxLines: 2 });
  const ta = fr(S, 'privacy', 0.6, 0.78);
  if (ta > 0.01) {
    const items = [S.l('documentos', 'documents'), S.l('notas', 'notes'), S.l('historial', 'history')];
    const y0 = G.rulerY + 30 * u, span = pr.y - y0 - 6 * u;
    if (span >= 3 * 26 * u) items.forEach((t, i) => chip(S, t, mx - 10 * u, y0 + (i + 0.5) * Math.min(28 * u, span / 3), 'dat', { align: 'right', a: ta, size: 12.5 }));
    else { let cx = mx - 10 * u; [...items].reverse().forEach((t) => { const b = chip(S, t, cx, y0 + span / 2, 'dat', { align: 'right', a: ta, size: 12.5 }); cx = b.x - 6 * u; }); }
  }
}

// ── repaso ──────────────────────────────────────────────────────────────────────────────────────────
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const ws: W0[] = [
    { role: 'sys', tokens: 60, label: S.l('instr.', 'instr.') },
    { role: 'user', tokens: 30 }, { role: 'ai', tokens: 60 }, { role: 'user', tokens: 30 }, { role: 'ai', tokens: 80 },
    { role: 'user', tokens: 30, hot: 0.5 }, { role: 'ai', tokens: 50, dash: true },
  ];
  const { G, rects } = windowTrain(S, ws, { label: S.l('en cada turno, el modelo solo lee esto', 'on every turn, the model reads only this'), gaugeA: 0, low: 80 });
  // llaves bajo el tren: instrucciones · historial · tu mensaje · respuesta
  const groups: [number, number, string][] = [[0, 0, S.l('instrucciones', 'instructions')], [1, 4, S.l('historial', 'history')], [5, 5, S.l('tu mensaje', 'your message')], [6, 6, S.l('respuesta', 'answer')]];
  const by = G.gaugeY + 2 * u, lh = (FS(S, 12) + 6) * u, v = S.portrait;
  groups.forEach(([a, b, t], i) => {
    const k = fr(S, 'recap', 0.1 + i * 0.12, 0.2 + i * 0.12);
    if (k < 0.01) return;
    const x0 = rects[a].x + 2 * u, x1 = rects[b].x + rects[b].w - 2 * u;
    d.withAlpha(k, () => {
      d.polyline([[x0, by], [x0, by + 5 * u], [x1, by + 5 * u], [x1, by]], p.ink2, 1.4);
      // en vertical cada rótulo en su renglón (a la izquierda los del principio, a la derecha los del final)
      const row = v ? i : i % 2, ty = by + 9 * u + row * lh;
      if (v) fitText(S, t, i < 2 ? x0 + 4 * u : x1 - 4 * u, ty, G.x1 - G.x0, 12, { weight: 700, color: p.ink2, align: i < 2 ? 'left' : 'right', base: 'top' });
      else fitText(S, t, (x0 + x1) / 2, ty, Math.max(x1 - x0 + 30 * u, 60 * u), 12, { weight: 700, color: p.ink2, align: 'center', base: 'top' });
    });
  });
  // fuera de la ventana: no existe
  const oa = fr(S, 'recap', 0.62, 0.8);
  if (oa > 0.01) {
    const L = G.low, y = Math.max(L.y + 30 * u, by + 9 * u + (S.portrait ? 4 : 2) * lh + 26 * u), h = G.h;
    if (y + h + 10 * u < L.y + L.h + 20 * u) d.withAlpha(oa, () => {
      fitText(S, S.l('fuera de la ventana: para el modelo, no existe', 'outside the window: for the model, it does not exist'), L.x + 8 * u, y - 8 * u, L.w - 16 * u, 12.5, { weight: 800, color: tone(S, 'err').ink, base: 'bottom' });
      trainRow(S, L.x + 8 * u, y, h, G.scale, [{ role: 'user', tokens: 30, a: 0.6, dash: true }, { role: 'ai', tokens: 60, a: 0.6, dash: true }]);
    });
  }
}

// ── puente: tus documentos no caben ─────────────────────────────────────────────────────────────────
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const pa = fr(S, 'bridge', 0.05, 0.3);
  // pila de páginas
  const pw0 = Math.min(A.w * 0.32, 130 * u), ph = Math.min(pw0 * 1.3, A.h - 90 * u), pw = Math.min(pw0, ph / 1.1), px = A.x + (S.portrait ? (A.w - pw) / 2 : A.w * 0.12), py = A.y + (S.portrait ? 6 * u : (A.h - ph) / 2);
  for (let i = 9; i >= 0; i--) doc(S, { x: px + i * 4 * u, y: py + i * 3 * u, w: pw, h: ph }, { a: pa });
  const tw = S.portrait ? A.w : Math.max(pw + 80 * u, 220 * u);
  para(S, S.l('tus documentos: miles de páginas', 'your documents: thousands of pages'), px + pw / 2 + 18 * u - tw / 2, py + ph + 36 * u, tw, FS(S, 13.5), { weight: 800, align: 'center', a: pa, maxLines: 2 });
  // la ventana, chica a su lado
  const wa = fr(S, 'bridge', 0.3, 0.5);
  const ww = S.portrait ? A.w * 0.7 : A.w * 0.36, wh = 44 * u;
  const wx = S.portrait ? A.x + (A.w - ww) / 2 : A.x + A.w * 0.56, wy = S.portrait ? py + ph + 76 * u : A.y + A.h / 2 - wh / 2;
  d.withAlpha(wa, () => {
    d.rect(wx, wy, ww, wh, { fill: alpha(tone(S, 'lat').c, 0.06), stroke: p.ink2, lw: 2, r: 5 * u });
    fitText(S, S.l('ventana de contexto', 'context window'), wx, wy - 6 * u, ww, 12.5, { weight: 800, color: p.ink2, base: 'bottom' });
    chip(S, S.l('no caben', 'they don’t fit'), wx + ww / 2, wy + wh / 2, 'err', { size: 13 });
  });
  const ra = fr(S, 'bridge', 0.7, 0.88);
  if (ra > 0.01) chip(S, S.l('siguiente lección: RAG', 'next lesson: RAG'), wx + ww / 2, wy + wh + 30 * u, 'lat', { a: ra, size: 14, solid: true });
}
