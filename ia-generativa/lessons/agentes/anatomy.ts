// Acto 1 · Anatomía de un agente: contexto → modelo → programa → herramientas, armada pieza por pieza
// (hook … loop). El modelo solo escribe texto; quien ejecuta es el programa que lo rodea.
import { alpha, clamp, inset, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, T, frame, glyph, lineH, pill, smooth, typed, wrapLines } from './ui';
import { ITEMS, toolName } from './agent';

interface Geo { all: Rect; ctx: Rect; model: Rect; prog: Rect; world: Rect; cards: Rect[]; back: [number, number][]; midY: number }

function geo(S: Frame): Geo {
  const u = S.u, all = inset(S.full(), 14 * u);
  if (!S.portrait) {
    const wc = 180 * u, wm = 140 * u, wp = 140 * u, wt = 190 * u;
    const gg = (all.w - wc - wm - wp - wt) / 3;
    const ctx: Rect = { x: all.x, y: all.y + 32 * u, w: wc, h: all.h - 66 * u };
    const midY = ctx.y + ctx.h / 2;
    const model: Rect = { x: ctx.x + wc + gg, y: midY - 56 * u, w: wm, h: 112 * u };
    const prog: Rect = { x: model.x + wm + gg, y: midY - 46 * u, w: wp, h: 92 * u };
    const tx = prog.x + wp + gg, ch = Math.min(54 * u, (ctx.h - 3 * 12 * u) / 4), th = 4 * ch + 3 * 12 * u;
    const world: Rect = { x: tx, y: midY - th / 2, w: wt, h: th };
    const cards = [0, 1, 2, 3].map((i) => ({ x: tx, y: world.y + i * (ch + 12 * u), w: wt, h: ch }));
    const yb = all.y + all.h - 8 * u;
    const back: [number, number][] = [[tx + wt / 2, world.y + th], [tx + wt / 2, yb], [ctx.x + wc / 2, yb], [ctx.x + wc / 2, ctx.y + ctx.h]];
    return { all, ctx, model, prog, world, cards, back, midY };
  }
  // vertical: cuatro filas apiladas. El contexto manda: debe caber el mensaje, las herramientas (en dos columnas) y el resultado.
  const lhc = lineH(S, 12.5), g1 = 24 * u, g2 = 22 * u, g3 = 20 * u, top = 30 * u, bot = 12 * u;
  const hc = Math.max(all.h * 0.28, lhc * 6.2 + 26 * u), hm = Math.max(all.h * 0.11, 44 * u), hp = Math.max(all.h * 0.1, 42 * u), ht = all.h - top - hc - hm - hp - g1 - g2 - g3 - bot;
  const ctx: Rect = { x: all.x, y: all.y + top, w: all.w, h: hc };
  const model: Rect = { x: all.x + all.w * 0.18, y: ctx.y + hc + g1, w: all.w * 0.64, h: hm };
  const prog: Rect = { x: all.x + all.w * 0.18, y: model.y + hm + g2, w: all.w * 0.64, h: hp };
  const world: Rect = { x: all.x, y: prog.y + hp + g3, w: all.w, h: ht };
  const cw = (all.w - 10 * u) / 2, ch = (ht - 8 * u) / 2;
  const cards = [0, 1, 2, 3].map((i) => ({ x: all.x + (i % 2) * (cw + 10 * u), y: world.y + Math.floor(i / 2) * (ch + 8 * u), w: cw, h: ch }));
  const xr = S.W - 6 * u;
  const back: [number, number][] = [[world.x + world.w, world.y + world.h / 2], [xr, world.y + world.h / 2], [xr, ctx.y + ctx.h / 2], [ctx.x + ctx.w, ctx.y + ctx.h / 2]];
  return { all, ctx, model, prog, world, cards, back, midY: model.y + model.h / 2 };
}

const KIND = (S: Frame, i: number) => [S.l('lee datos', 'reads data'), S.l('lee datos', 'reads data'), S.l('calcula', 'computes'), S.l('actúa: no se deshace', 'acts: cannot be undone')][i];
const SIG = (S: Frame, i: number) => ['inventario()', 'precio(sku)', 'calcular(expr)', 'hacer_pedido(…)'].map((s, k) => (S.lang === 'es' ? s : ['get_inventory()', 'get_price(sku)', 'calculate(expr)', 'place_order(…)'][k]))[i];

/** Flecha entre dos puntos con progreso 0..1. */
function arrow(S: Frame, a: [number, number], b: [number, number], t: ReturnType<typeof tone>, k: number, o: { dash?: number[]; lw?: number } = {}) {
  if (k <= 0) return;
  const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
  if (o.dash) S.d.line(a[0], a[1], x, y, t.c, o.lw ?? 2, o.dash);
  else S.d.arrow(a[0], a[1], x, y, t.c, o.lw ?? 2, k > 0.97 ? 8 : 0.001);
}

/** Punto a lo largo de una polilínea. */
function onPath(pts: [number, number][], k: number): [number, number] {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1])), tot = lens.reduce((a, b) => a + b, 0);
  let d = clamp(k) * tot;
  for (let i = 0; i < lens.length; i++) { if (d <= lens[i] || i === lens.length - 1) { const f = lens[i] ? d / lens[i] : 0; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; } d -= lens[i]; }
  return pts[pts.length - 1];
}

export function drawAnatomy(S: Frame) {
  const { d, pal: p } = S, u = S.u, G = geo(S);
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), sig = tone(S, 'sig'), ink = tone(S, 'ink'), mute = tone(S, 'mute'), w = tone(S, 'w');
  const showTools = S.on('hands'), showProg = S.on('harness');

  // ── el mundo (hook) → las herramientas (hands) ──
  const worldA = S.reveal('hook', 1.8, 0.7);
  if (!showTools) {
    d.withAlpha(worldA, () => {
      frame(S, G.world, { dash: [6, 5], fill: 0.02 });
      T(S, S.l('el mundo', 'the world'), G.world.x + G.world.w / 2, G.world.y + 10 * u, { size: 14, weight: 800, color: mute.ink, align: 'center' });
      const items = [S.l('inventario de hoy', 'today’s inventory'), S.l('pedidos', 'orders')];
      if (S.portrait) items.forEach((s, i) => T(S, s, G.world.x + G.world.w * (i ? 0.76 : 0.27), G.world.y + 32 * u, { size: 13, color: p.ink2, align: 'center' }));
      else items.forEach((s, i) => T(S, s, G.world.x + G.world.w / 2, G.world.y + G.world.h / 2 - 14 * u + i * 26 * u, { size: 13, color: p.ink2, align: 'center', base: 'middle' }));
      T(S, '?', G.world.x + G.world.w / 2, G.world.y + G.world.h - (S.portrait ? 27 : 28) * u, { size: 22, weight: 800, color: mute.ink, align: 'center' });
    });
    // el muro: sin acceso
    const wx = (G.model.x + G.model.w + G.world.x) / 2, wy = G.midY;
    d.withAlpha(worldA, () => {
      // el muro se interrumpe donde va el rótulo, para que la línea no lo atraviese
      const nol = S.l('sin acceso', 'no access'), hw = d.measure(nol, { size: FS(S, 12), weight: 600 }) / 2 + 14 * u;
      if (S.portrait) {
        const my = G.prog.y + G.prog.h / 2, mx = G.all.x + G.all.w / 2;
        d.line(G.all.x + 12 * u, my, mx - hw, my, p.lineStrong, 2, [8, 6]); d.line(mx + hw, my, G.all.x + G.all.w - 12 * u, my, p.lineStrong, 2, [8, 6]);
        pill(S, nol, mx, my, { tone: 'err' });
      } else {
        const py = wy + 40 * u;   // debajo de la flecha de «texto», que sale del modelo a la altura media
        d.line(wx, G.all.y + 4 * u, wx, py - 16 * u, p.lineStrong, 2, [8, 6]); d.line(wx, py + 16 * u, wx, G.all.y + G.all.h - 4 * u, p.lineStrong, 2, [8, 6]);
        pill(S, nol, wx, py, { tone: 'err' });
      }
    });
  }
  if (showTools) {
    const f = S.reveal('hands', 0, 0.5);
    d.withAlpha(f, () => T(S, S.l('herramientas', 'tools'), G.world.x + (S.portrait ? 0 : G.world.w / 2), G.world.y - (S.portrait ? 17 : 20) * u, { size: 13, weight: 800, color: dat.ink, align: S.portrait ? 'left' : 'center' }));
    G.cards.forEach((r, i) => {
      const a = S.reveal('hands', 0.5 + i * 0.7, 0.5), irr = i === 3, t = irr ? w : dat;
      if (a <= 0) return;
      const hot = toolHot(S, i);
      d.withAlpha(a, () => {
        frame(S, r, { tone: irr ? 'w' : 'dat', dash: irr ? [5, 3] : undefined, fill: 0.08 + 0.3 * hot });
        T(S, SIG(S, i), r.x + r.w / 2, r.y + r.h * 0.12, { size: 13, weight: 800, font: 'mono', color: t.ink, align: 'center' });
        T(S, KIND(S, i), r.x + r.w / 2, r.y + r.h * 0.58, { size: 12, weight: 600, color: irr ? w.ink : p.ink2, align: 'center' });
      });
    });
  }

  // ── el contexto ──
  const cA = S.reveal('hook', 0, 0.6);
  d.withAlpha(cA, () => {
    frame(S, G.ctx, { tone: 'lat', fill: 0.04 });
    T(S, S.l('contexto', 'context'), G.ctx.x + 4 * u, G.ctx.y - (S.portrait ? 17 : 19) * u, { size: 13, weight: 800, color: lat.ink });
    const iw = G.ctx.w - 20 * u;
    let y = G.ctx.y + 8 * u;
    const lh = lineH(S, 12.5);
    // mensaje del usuario
    const q = S.l('¿Qué piezas faltan y cuánto cuesta reponerlas?', 'Which parts are missing, and what does restocking them cost?');
    const ulab = S.l('usuario', 'user'), ulw = S.portrait ? d.measure(ulab, { size: FS(S, 12), weight: 800 }) + 8 * u : 0;   // en vertical la etiqueta va en la misma línea
    T(S, ulab, G.ctx.x + 10 * u, y, { size: 12, weight: 800, color: p.mute });
    const ql = wrapLines(S, q, iw - ulw, 12.5, 600);
    d.withAlpha(S.reveal('hook', 0.5, 0.6), () => typed(S, ql, G.ctx.x + 10 * u + ulw, y + (S.portrait ? 0 : lh), S.at('hook', 0.5, 2.4, 'lin'), { size: 12.5, weight: 600 }));
    y += lh * ((S.portrait ? 0 : 1) + ql.length) + 8 * u;
    // descripciones de herramientas
    if (S.on('describe')) {
      const a = S.reveal('describe', 0.4, 0.5);
      d.withAlpha(a, () => {
        T(S, S.l('herramientas disponibles', 'available tools'), G.ctx.x + 10 * u, y, { size: 12, weight: 800, color: dat.ink });
        y += lh;
        [0, 1, 2, 3].forEach((i) => {
          const k = clamp(S.at('describe', 0.8 + i * 0.7, 1.5 + i * 0.7, 'out'));
          // en vertical, las cuatro firmas van en dos columnas
          const tx = G.ctx.x + 10 * u + (S.portrait ? (i % 2) * (iw / 2) : 0), ty = y + (S.portrait ? Math.floor(i / 2) : i) * lh * 1.05;
          if (k > 0) T(S, SIG(S, i), tx, ty, { size: 12, weight: 600, font: 'mono', color: dat.ink, a: k });
        });
      });
      y += (S.portrait ? 2.2 : 4.2) * lh;
    }
    // resultado pegado por el programa
    const rk = S.at('harness', 5.6, 6.4, 'out');
    if (rk > 0) {
      d.withAlpha(rk, () => {
        const rlab = S.l('resultado', 'result'), rval = S.l('precio: 8.50', 'price: 8.50');
        T(S, rlab, G.ctx.x + 10 * u, y, { size: 12, weight: 800, color: sig.ink });
        if (S.portrait) T(S, rval, G.ctx.x + 10 * u + d.measure(rlab, { size: FS(S, 12), weight: 800 }) + 8 * u, y, { size: 12.5, weight: 600, font: 'mono', color: sig.ink });
        else T(S, rval, G.ctx.x + 10 * u, y + lh, { size: 12.5, weight: 600, font: 'mono', color: sig.ink });
      });
    }
  });

  // ── el modelo ──
  d.withAlpha(cA, () => {
    const r = G.model, pulse = S.on('observe') && !S.on('loop') ? 0.4 + 0.4 * Math.abs(Math.sin(S.clock * 2.2)) : 0;
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(lat.c, 0.12 + 0.25 * pulse), stroke: lat.c, lw: 2, r: 4 });
    T(S, S.l('modelo', 'model'), r.x + r.w / 2, r.y + r.h * 0.3, { size: 17, weight: 800, color: lat.ink, align: 'center', base: 'middle' });
    T(S, S.l('texto entra, texto sale', 'text in, text out'), r.x + r.w / 2, r.y + r.h * 0.66, { size: 12, weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w - 12 * u });
  });
  // flechas: contexto → modelo (lee) y modelo → afuera (escribe)
  const mid = G.midY;
  const cm: [[number, number], [number, number]] = S.portrait ? [[G.model.x + G.model.w / 2, G.ctx.y + G.ctx.h], [G.model.x + G.model.w / 2, G.model.y]] : [[G.ctx.x + G.ctx.w, mid], [G.model.x, mid]];
  arrow(S, cm[0], cm[1], lat, S.at('hook', 0.2, 0.9));
  if (!showProg && !S.on('call')) {
    const out: [[number, number], [number, number]] = S.portrait ? [[G.model.x + G.model.w / 2, G.model.y + G.model.h], [G.model.x + G.model.w / 2, G.model.y + G.model.h + 16 * u]] : [[G.model.x + G.model.w, mid], [G.model.x + G.model.w + 26 * u, mid]];
    arrow(S, out[0], out[1], lat, S.at('hook', 1.2, 1.9));
    if (!S.on('call')) T(S, S.l('texto', 'text'), out[1][0] + (S.portrait ? 12 * u : 4 * u), out[1][1] + (S.portrait ? -4 * u : -4 * u), { size: 12, weight: 700, color: lat.ink, base: S.portrait ? 'middle' : 'bottom', a: S.reveal('hook', 1.8, 0.5) });
  }

  // ── la llamada que escribe el modelo (call): un texto que aparece junto al modelo ──
  const callTxt = S.lang === 'es' ? 'precio("COJ-6204")' : 'get_price("COJ-6204")';
  // la llamada es un texto en una ficha; si no cabe entre el modelo y las herramientas, se parte en dos líneas
  const chipFont = { size: FS(S, 12.5), weight: 800, font: 'mono' as const }, chipLh = lineH(S, 12.5);
  const chipBox = (text: string) => {
    const full = d.measure(text, chipFont) + 16 * u, avail = S.portrait ? G.all.w * 0.9 : G.cards[1].x - (G.model.x + G.model.w) - 12 * u, pi = text.indexOf('(') + 1;
    const split = full > avail && pi > 1 && pi < text.length;
    const w = split ? Math.max(d.measure(text.slice(0, pi), chipFont), d.measure(text.slice(pi), chipFont)) + 16 * u : full;
    return { w, h: split ? 2 * chipLh + 8 * u : 24 * u, pi: split ? pi : 0 };
  };
  const progMid: [number, number] = [G.prog.x + G.prog.w / 2, G.prog.y + G.prog.h / 2];
  const toolMid: [number, number] = [G.cards[1].x + G.cards[1].w / 2, G.cards[1].y + G.cards[1].h / 2];
  const chipHome: [number, number] = [progMid[0], progMid[1]];
  let chipAt: [number, number] | null = null, chipTone = dat, chipText = callTxt, chipK = 1;
  if (S.on('call') && !S.on('harness')) {
    chipAt = chipHome; chipK = S.at('call', 0.4, 2.2, 'lin');
    const wch = chipBox(callTxt).w;
    const from: [number, number] = S.portrait ? [G.model.x + G.model.w / 2, G.model.y + G.model.h] : [G.model.x + G.model.w, mid];
    const to: [number, number] = S.portrait ? [chipHome[0], chipHome[1] - 14 * u] : [chipHome[0] - wch / 2 - 3 * u, chipHome[1]];
    arrow(S, from, to, lat, S.at('call', 0.1, 0.6));
  } else if (S.on('harness')) {
    const t = S.since('harness');
    // chip en el programa → herramienta (2.4–3.6) → el resultado vuelve por el camino hasta el contexto (4.0–5.6)
    if (t < 4.0) { const k2 = smooth(clamp((t - 2.4) / 1.2)); chipAt = [lerp(chipHome[0], toolMid[0], k2), lerp(chipHome[1], toolMid[1], k2)]; }
    else { chipTone = sig; chipText = '8.50'; const k = smooth(clamp((t - 4.0) / 1.6)); chipAt = onPath([toolMid, ...G.back.slice(1)], k); chipK = 1; if (k > 0.94) chipAt = null; }
  }
  if (chipAt) {
    const label = chipText.slice(0, Math.max(1, Math.ceil(chipText.length * chipK)));
    const box = chipBox(chipText), wch = box.w, hch = box.h;
    d.rect(chipAt[0] - wch / 2, chipAt[1] - hch / 2, wch, hch, { fill: chipTone.c, stroke: p.stage, lw: 2, r: 3 });
    if (box.pi) [label.slice(0, box.pi), label.slice(box.pi)].forEach((ln, k) => { if (ln) T(S, ln, chipAt![0] - wch / 2 + 8 * u, chipAt![1] - hch / 2 + 4 * u + k * chipLh, { size: 12.5, weight: 800, font: 'mono', color: p.stage }); });
    else T(S, label, chipAt[0] - wch / 2 + 8 * u, chipAt[1], { size: 12.5, weight: 800, font: 'mono', color: p.stage, base: 'middle' });
  }

  // ── el programa (harness) ──
  if (showProg) {
    const a = S.reveal('harness', 0, 0.6), r = G.prog, flash = S.at('harness', 1.8, 2.4) * (1 - S.at('harness', 2.4, 3.2));
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(ink.c, 0.06 + 0.12 * flash), stroke: ink.c, lw: 2, r: 4 });
      const la = S.at('harness', 3.0, 3.6);
      T(S, S.l('programa', 'program'), r.x + r.w / 2, r.y + r.h * 0.34, { size: 16, weight: 800, align: 'center', base: 'middle', a: la });
      T(S, S.l('ejecuta de verdad', 'runs it for real'), r.x + r.w / 2, r.y + r.h * 0.7, { size: 12, weight: 600, color: p.ink2, align: 'center', base: 'middle', w: r.w - 10 * u, a: la });
    });
    // conexiones programa ↔ herramientas
    const ptA: [number, number] = S.portrait ? [progMid[0], G.prog.y + G.prog.h] : [G.prog.x + G.prog.w, progMid[1]];
    const ptB: [number, number] = S.portrait ? [G.cards[1].x + G.cards[1].w / 2, G.world.y] : [G.cards[1].x, G.cards[1].y + G.cards[1].h / 2];
    arrow(S, ptA, ptB, dat, S.at('harness', 0.6, 1.2), { lw: 1.5 });
    const mp: [number, number] = S.portrait ? [progMid[0], G.model.y + G.model.h] : [G.model.x + G.model.w, mid], pp: [number, number] = S.portrait ? [progMid[0], G.prog.y] : [G.prog.x, progMid[1]];
    arrow(S, mp, pp, lat, S.at('harness', 0.2, 0.8), { lw: 1.5 });
  }

  // ── el camino de vuelta: resultado → contexto (se dibuja al llegar el resultado y en el bucle) ──
  const backA = Math.max(S.at('harness', 4.0, 4.6), S.on('describe') && !S.on('call') ? S.at('describe', 0.2, 0.8) * 0.6 : 0);
  if (S.on('harness') && backA > 0) {
    d.withAlpha(clamp(backA), () => { d.polyline(G.back, sig.c, 2, { dash: [6, 5] }); });
  }
  if (S.on('describe') && !S.on('call')) {
    // las descripciones viajan de las herramientas al contexto (solo texto)
    const k = S.at('describe', 0.4, 3.2, 'io');
    if (S.on('hands')) {
      const pts: [number, number][] = [[G.world.x + G.world.w / 2, S.portrait ? G.world.y : G.world.y], ...G.back.slice(1)];
      const start = S.portrait ? [G.world.x + G.world.w, G.world.y + G.world.h / 2] as [number, number] : [G.world.x + G.world.w / 2, G.world.y + G.world.h] as [number, number];
      const path = [start, ...G.back.slice(1)];
      d.withAlpha(0.6 * S.reveal('describe', 0, 0.4), () => d.polyline(path, dat.c, 1.5, { dash: [5, 5] }));
      if (k > 0 && k < 1) { const q = onPath(path, k); d.circle(q[0], q[1], 4.5 * u, { fill: dat.c, stroke: p.stage, lw: 1.5 }); }
      void pts;
    }
  }

  // ── observar · pensar · actuar (observe) ──
  if (S.on('observe')) {
    const a = S.reveal('observe', 0.3, 0.5), a2 = S.reveal('observe', 1.6, 0.5), a3 = S.reveal('observe', 2.8, 0.5);
    const off = S.portrait ? 0 : 0;
    const cmMid: [number, number] = [(cm[0][0] + cm[1][0]) / 2, (cm[0][1] + cm[1][1]) / 2];
    const mpMid: [number, number] = S.portrait ? [progMid[0], G.model.y + G.model.h + (G.prog.y - G.model.y - G.model.h) / 2] : [(G.model.x + G.model.w + G.prog.x) / 2, mid];
    pill(S, S.l('observar', 'observe'), cmMid[0] + (S.portrait ? 72 * u : 0), cmMid[1] + (S.portrait ? 0 : -22 * u) + off, { tone: 'sig', a, weight: 800 });
    pill(S, S.l('pensar', 'think'), S.portrait ? G.model.x + 40 * u : G.model.x + G.model.w / 2, G.model.y - (S.portrait ? 3 : 14) * u, { tone: 'lat', a: a2, weight: 800 });
    pill(S, S.l('actuar', 'act'), mpMid[0] + (S.portrait ? 72 * u : 0), mpMid[1] + (S.portrait ? 0 : -22 * u), { tone: 'dat', a: a3, weight: 800 });
  }

  // ── el agente: el ciclo completo (loop) ──
  if (S.on('loop')) {
    const a = S.reveal('loop', 0, 0.8), fr = inset(G.all, -2 * u);
    d.withAlpha(a, () => {
      d.rect(fr.x, fr.y, fr.w, fr.h, { stroke: ink.c, lw: 2, r: 6, dash: [10, 6] });
      pill(S, S.l('agente', 'agent'), fr.x + 14 * u, fr.y, { tone: 'ink', align: 'left', weight: 800, size: 13 });
    });
    const k = (S.clock * 0.16) % 1;
    const loopPath: [number, number][] = S.portrait
      ? [[G.ctx.x + G.ctx.w / 2, G.ctx.y + G.ctx.h], [G.model.x + G.model.w / 2, G.model.y], [G.model.x + G.model.w / 2, G.model.y + G.model.h], [progMid[0], G.prog.y], [progMid[0], G.prog.y + G.prog.h], [G.cards[1].x + G.cards[1].w / 2, G.world.y], ...G.back.slice(1)]
      : [[G.ctx.x + G.ctx.w, mid], [G.model.x, mid], [G.model.x + G.model.w, mid], [G.prog.x, progMid[1]], [G.prog.x + G.prog.w, progMid[1]], [G.cards[1].x, G.cards[1].y + G.cards[1].h / 2], [G.cards[1].x + G.cards[1].w / 2, G.cards[1].y + G.cards[1].h / 2], ...G.back];
    d.withAlpha(S.reveal('loop', 0.6, 0.6), () => { d.polyline(G.back, sig.c, 2, { dash: [6, 5] }); const q = onPath(loopPath, k); d.circle(q[0], q[1], 5 * u, { fill: S.pal.ink, stroke: p.stage, lw: 2 }); });
    // etiquetas del ciclo, ya presentadas
    const l1 = S.reveal('loop', 1.2, 0.6);
    d.withAlpha(l1, () => {
      const lab = S.l('repetir hasta cumplir el objetivo', 'repeat until the goal is met');
      if (S.portrait) {   // sobre el borde inferior del marco, con fondo para que el trazo no lo atraviese
        const pw = d.measure(lab, { size: FS(S, 12), weight: 700 }) + 24 * u;
        d.rect(fr.x + fr.w / 2 - pw / 2, fr.y + fr.h - 11 * u, pw, 22 * u, { fill: p.stage });
        pill(S, lab, fr.x + fr.w / 2, fr.y + fr.h, { tone: 'sig', align: 'center', weight: 700 });
      }
      else pill(S, lab, (G.back[1][0] + G.back[2][0]) / 2, G.back[1][1] - 14 * u, { tone: 'sig', align: 'center', weight: 700 });
    });
    d.withAlpha(S.reveal('loop', 2.6, 0.6), () => pill(S, S.l('ReAct · Yao et al., 2022', 'ReAct · Yao et al., 2022'), S.W - 14 * u, S.portrait ? fr.y : fr.y, { tone: 'mute', align: 'right', weight: 700 }));
  }

  // Neu observa el hook
  if (!S.portrait && S.between('hook', 'hands')) neu(S, G.world.x + G.world.w - 70 * u, G.all.y + G.all.h - 58 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: S.reveal('hook', 2.6, 0.5) });
}

function toolHot(S: Frame, i: number): number {
  // la herramienta «precio» (índice 1) se ilumina cuando el programa la ejecuta
  if (i !== 1 || !S.on('harness')) return 0;
  return S.at('harness', 2.8, 3.4) * (1 - S.at('harness', 3.6, 4.2));
}
void ITEMS; void toolName;
