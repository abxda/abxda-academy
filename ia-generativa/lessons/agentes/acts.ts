// Actos de apoyo: costo del bucle, plan y memoria, MCP, cifras reales, caso reportado, permisos, niveles,
// persona en el bucle, empezar con poco y el puente. Cada uno es una función pura de S.t.
import { alpha, clamp, inset, lerp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ITEMS, money, readLedger } from './agent';
import { NARR } from './console';
import { FS, T, big, frame, glyph, lineH, pill, smooth, wrapLines } from './ui';

const area = (S: Frame) => inset(S.full(), 14 * S.u);

/** Ejes con texto ≥ 12 px. Devuelve el rectángulo del área de trazado. */
function axes(S: Frame, outer: Rect, o: { yMax: number; yTicks: number[]; xLabel: string; yLabel: string; yFmt?: (v: number) => string; a?: number }): Rect {
  const { d, pal: p } = S, u = S.u, lh = lineH(S, 12);
  const l = 44 * u, b = lh * 2 + 8 * u, t = lh + 6 * u;
  const r: Rect = { x: outer.x + l, y: outer.y + t, w: outer.w - l - 6 * u, h: outer.h - t - b };
  d.withAlpha(o.a ?? 1, () => {
    o.yTicks.forEach((v) => {
      const y = r.y + r.h - (v / o.yMax) * r.h;
      d.line(r.x, y, r.x + r.w, y, v === 0 ? p.lineStrong : p.line, v === 0 ? 1.5 : 1);
      T(S, (o.yFmt ?? ((q) => String(q)))(v), r.x - 6 * u, y, { size: 12, font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    });
    T(S, o.yLabel, outer.x + 2 * u, outer.y, { size: 12, weight: 700, color: p.ink2 });
    T(S, o.xLabel, r.x + r.w, r.y + r.h + lh + 6 * u, { size: 12, weight: 700, color: p.ink2, align: 'right' });
  });
  return r;
}

// ═════════════════════════════════════════════════════════════════════════
// Costo del bucle: cada consulta relee el contexto
// ═════════════════════════════════════════════════════════════════════════
export function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12);
  const rows = readLedger(NARR.turns, S.lang), n = rows.length;
  const tot = rows.map((r) => r.base + r.hist + r.fresh), ymax = Math.ceil(Math.max(...tot) / 100) * 100;
  const side = !S.portrait, chartR: Rect = side ? { x: all.x, y: all.y, w: all.w * 0.64, h: all.h } : { x: all.x, y: all.y, w: all.w, h: all.h * 0.62 };
  const ax = axes(S, chartR, { yMax: ymax, yTicks: [0, ymax / 4, ymax / 2, (3 * ymax) / 4, ymax], xLabel: S.l('consulta al modelo', 'model query'), yLabel: S.l('tokens que lee (≈)', 'tokens it reads (≈)'), yFmt: (v) => String(Math.round(v)), a: S.reveal('cost-loop', 0, 0.5) });
  const bw = ax.w / n, gap = bw * 0.22, cols = [tone(S, 'mute'), tone(S, 'lat'), tone(S, 'sig')];
  rows.forEach((r, i) => {
    const k = smooth(S.at('cost-loop', 0.5 + i * 0.5, 1.2 + i * 0.5, 'lin'));
    if (k <= 0) return;
    let y = ax.y + ax.h;
    [r.base, r.hist, r.fresh].forEach((v, si) => {
      const h = (v / ymax) * ax.h * k;
      if (h > 0.5) {
        d.rect(ax.x + i * bw + gap / 2, y - h, bw - gap, h, { fill: alpha(cols[si].c, si === 0 ? 0.28 : 0.75), stroke: cols[si].c, lw: 1, dash: si === 0 ? [3, 3] : undefined });
        y -= h;
      }
    });
    T(S, String(i + 1), ax.x + i * bw + bw / 2, ax.y + ax.h + 4 * u, { size: 12, font: 'mono', color: p.ink2, align: 'center', a: k });
    T(S, big(S, tot[i]), ax.x + i * bw + bw / 2, y - 4 * u, { size: 12, weight: 700, font: 'mono', color: p.ink, align: 'center', base: 'bottom', a: k });
  });
  // leyenda y lectura
  const lg: Rect = side ? { x: chartR.x + chartR.w + 18 * u, y: all.y + 4 * u, w: all.w - chartR.w - 18 * u, h: all.h } : { x: all.x, y: chartR.y + chartR.h + 6 * u, w: all.w, h: all.h - chartR.h - 6 * u };
  const a1 = S.reveal('cost-loop', 5.4, 0.6), a2 = S.reveal('cost-loop', 7.4, 0.6);
  let y = lg.y;
  const legend: [number, string][] = [[0, S.l('instrucciones y herramientas', 'instructions and tools')], [1, S.l('historial acumulado', 'accumulated history')], [2, S.l('lo nuevo del paso anterior', 'new from the previous step')]];
  d.withAlpha(a1, () => legend.forEach(([si, txt]) => {
    d.rect(lg.x, y + 2 * u, 12 * u, 12 * u, { fill: alpha(cols[si].c, si === 0 ? 0.28 : 0.75), stroke: cols[si].c, lw: 1, dash: si === 0 ? [3, 3] : undefined });
    T(S, txt, lg.x + 18 * u, y, { size: 12, weight: 600, color: p.ink2 }); y += lh * 1.2;
  }));
  y += 6 * u;
  const total = tot.reduce((a, b) => a + b, 0), flat = rows[0].base * n;
  d.withAlpha(a2, () => {
    T(S, S.l('leído en total', 'read in total'), lg.x, y, { size: 12, weight: 700, color: p.mute });
    T(S, `≈ ${big(S, total)}`, lg.x, y + lh, { size: 20, weight: 800, font: 'mono' });
    T(S, S.l(`si el contexto no creciera: ≈ ${big(S, flat)}`, `if the context did not grow: ≈ ${big(S, flat)}`), lg.x, y + lh * 2.4, { size: 12, weight: 600, color: p.ink2, w: lg.w });
    y += lh * 4.4;
  });
  const foot = S.l('Estimación: un token ≈ cuatro caracteres. Aquí los resultados son cortos; con páginas o archivos el historial crece mucho más rápido. El caché de prompt abarata lo repetido, no lo elimina.', 'Estimate: one token ≈ four characters. Results here are short; with pages or files the history grows much faster. Prompt caching makes repeats cheaper, not free.');
  d.withAlpha(S.reveal('cost-loop', 9.2, 0.6), () => T(S, foot, lg.x, side ? Math.max(y, lg.y + lg.h - lh * 6.6) : lg.y + lh * 4.6, { size: 12, weight: 600, color: p.mute, w: lg.w }));
}

// ═════════════════════════════════════════════════════════════════════════
// Plan y memoria
// ═════════════════════════════════════════════════════════════════════════
export function drawPlan(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5);
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), sig = tone(S, 'sig'), err = tone(S, 'err');
  const side = !S.portrait;
  const ctx: Rect = side ? { x: all.x, y: all.y + 22 * u, w: all.w * 0.56, h: all.h - 30 * u } : { x: all.x, y: all.y + 22 * u, w: all.w, h: all.h * 0.5 };
  const notes: Rect = side ? { x: all.x + all.w * 0.7, y: all.y + 22 * u + (ctx.h - 150 * u) / 2, w: all.w * 0.3, h: 150 * u } : { x: all.x + all.w * 0.15, y: ctx.y + ctx.h + 52 * u, w: all.w * 0.7, h: all.h - ctx.h - 78 * u };
  d.withAlpha(S.reveal('plan-memory', 0, 0.5), () => { frame(S, ctx, { tone: 'lat', fill: 0.04 }); T(S, S.l('contexto', 'context'), ctx.x + 4 * u, ctx.y - 19 * u, { size: 13, weight: 800, color: lat.ink }); });
  // plan
  const items = [S.l('ver el inventario', 'check the inventory'), S.l('consultar los precios', 'look up the prices'), S.l('calcular el total', 'compute the total'), S.l('hacer el pedido', 'place the order')];
  const gw = 34 * u, planW = ctx.w - gw - 36 * u;
  d.withAlpha(S.reveal('plan-memory', 0.3, 0.5), () => T(S, S.l('plan', 'plan'), ctx.x + 12 * u, ctx.y + 10 * u, { size: 13, weight: 800 }));
  items.forEach((s, i) => {
    const a = S.reveal('plan-memory', 0.6 + i * 0.45, 0.4), tk = S.at('plan-memory', 2.4 + i * 0.7, 3.0 + i * 0.7, 'out');
    const y = ctx.y + 12 * u + lh * 1.5 + i * lh * 1.55, x = ctx.x + 12 * u;
    d.withAlpha(a, () => {
      d.rect(x, y + 1 * u, 14 * u, 14 * u, { stroke: p.lineStrong, lw: 1.5, fill: p.surface });
      if (tk > 0) glyph(S, 'check', x + 7 * u, y + 8 * u, 15 * u, dat.c, tk);
      T(S, s, x + 22 * u, y, { size: 12.5, weight: 600, color: tk > 0.6 ? p.mute : p.ink });
      if (tk > 0.4) { const wd = d.measure(s, { size: FS(S, 12.5), weight: 600 }); d.line(x + 22 * u, y + lh * 0.45, x + 22 * u + wd * tk, y + lh * 0.45, p.mute, 1.5); }
    });
  });
  // medidor del contexto: se llena y se desborda
  const fillK = smooth(S.at('plan-memory', 1.0, 6.5, 'lin')), full = S.at('plan-memory', 6.4, 6.8);
  const gx = ctx.x + ctx.w - gw - 10 * u, gy = ctx.y + 14 * u, gh = ctx.h - 28 * u;
  d.withAlpha(S.reveal('plan-memory', 0.5, 0.5), () => {
    d.rect(gx, gy, gw * 0.6, gh, { stroke: p.lineStrong, lw: 1.5, fill: p.surface2 });
    const fh = gh * (0.12 + 0.88 * fillK);
    d.rect(gx, gy + gh - fh, gw * 0.6, fh, { fill: alpha(full > 0.5 ? err.c : lat.c, 0.7) });
    T(S, S.l('límite', 'limit'), gx + gw * 0.3, gy - 4 * u, { size: 12, weight: 700, color: p.mute, align: 'center', base: 'bottom' });
  });
  d.withAlpha(full, () => pill(S, S.l('lleno', 'full'), gx + gw * 0.3, gy + gh / 2, { tone: 'err', weight: 800 }));
  // notas fuera
  const na = S.reveal('plan-memory', 6.8, 0.6);
  d.withAlpha(na, () => {
    frame(S, notes, { tone: 'dat', fill: 0.06 });
    glyph(S, 'doc', notes.x + 20 * u, notes.y + 22 * u, 24 * u, dat.c);
    T(S, S.l('notas guardadas fuera', 'notes saved outside'), notes.x + 38 * u, notes.y + 8 * u, { size: 12, weight: 800, color: dat.ink, w: notes.w - 44 * u });
    const lines = [S.l('precios: 8.50 y 14.20', 'prices: 8.50 and 14.20'), S.l('falta: hacer el pedido', 'left: place the order')];
    lines.forEach((s, i) => T(S, s, notes.x + 10 * u, notes.y + 52 * u + i * lh * 1.25, { size: 12, weight: 600, font: 'mono', w: notes.w - 16 * u }));
  });
  const ya = side ? ctx.y + ctx.h * 0.4 : 0;
  if (na > 0) {
    if (side) {
      const x1 = ctx.x + ctx.w, x2 = notes.x, ya2 = notes.y + notes.h * 0.35, yb2 = notes.y + notes.h * 0.7;
      d.withAlpha(na, () => { d.arrow(x1, ya2, x2, ya2, dat.c, 2, 8); d.arrow(x2, yb2, x1, yb2, sig.c, 2, 8); pill(S, S.l('guardar', 'save'), (x1 + x2) / 2, ya2 - 14 * u, { tone: 'dat' }); pill(S, S.l('releer', 'reread'), (x1 + x2) / 2, yb2 + 14 * u, { tone: 'sig' }); });
    } else {
      const cx = notes.x + notes.w / 2, y1 = ctx.y + ctx.h, y2 = notes.y, off = 36 * u;
      d.withAlpha(na, () => { d.arrow(cx - off, y1, cx - off, y2, dat.c, 2, 8); d.arrow(cx + off, y2, cx + off, y1, sig.c, 2, 8); pill(S, S.l('guardar', 'save'), cx - off - 40 * u, (y1 + y2) / 2, { tone: 'dat' }); pill(S, S.l('releer', 'reread'), cx + off + 40 * u, (y1 + y2) / 2, { tone: 'sig' }); });
    }
  }
  void ya;
}

// ═════════════════════════════════════════════════════════════════════════
// MCP: de N×M conexiones a N+M
// ═════════════════════════════════════════════════════════════════════════
export function drawMcp(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12);
  const sig = tone(S, 'sig'), dat = tone(S, 'dat'), ink = tone(S, 'ink');
  const apps = [S.l('Chat', 'Chat'), S.l('Editor', 'Editor'), S.l('Agente propio', 'Own agent')], srv = [S.l('Inventario', 'Inventory'), S.l('Correo', 'Email'), S.l('Archivos', 'Files')];
  const port = S.portrait, bw = port ? (all.w - 24 * u) / 3 : 140 * u, bh = 40 * u;
  const A: Rect[] = apps.map((_, i) => port ? { x: all.x + i * (bw + 12 * u), y: all.y + 20 * u, w: bw, h: bh } : { x: all.x, y: all.y + 40 * u + i * (bh + 30 * u), w: bw, h: bh });
  const B: Rect[] = srv.map((_, i) => port ? { x: all.x + i * (bw + 12 * u), y: all.y + all.h * 0.62, w: bw, h: bh } : { x: all.x + all.w - bw, y: all.y + 40 * u + i * (bh + 30 * u), w: bw, h: bh });
  const bus: Rect = port ? { x: all.x + 10 * u, y: all.y + all.h * 0.31, w: all.w - 20 * u, h: 30 * u } : { x: all.x + all.w / 2 - 22 * u, y: A[0].y - 8 * u, w: 44 * u, h: 3 * (bh + 30 * u) - 14 * u };
  const edgeA = (i: number): [number, number] => (port ? [A[i].x + A[i].w / 2, A[i].y + A[i].h] : [A[i].x + A[i].w, A[i].y + A[i].h / 2]);
  const edgeB = (i: number): [number, number] => (port ? [B[i].x + B[i].w / 2, B[i].y] : [B[i].x, B[i].y + B[i].h / 2]);
  d.withAlpha(S.reveal('mcp', 0, 0.5), () => {
    A.forEach((r, i) => { frame(S, r, { tone: 'sig', fill: 0.08 }); T(S, apps[i], r.x + r.w / 2, r.y + r.h / 2, { size: 13, weight: 800, color: sig.ink, align: 'center', base: 'middle' }); });
    B.forEach((r, i) => { frame(S, r, { tone: 'dat', fill: 0.08 }); T(S, srv[i], r.x + r.w / 2, r.y + r.h / 2, { size: 13, weight: 800, color: dat.ink, align: 'center', base: 'middle' }); });
    T(S, S.l('aplicaciones', 'applications'), port ? all.x : A[0].x, A[0].y - (port ? 20 : 30) * u, { size: 12, weight: 800, color: sig.ink });
    T(S, S.l('herramientas y datos', 'tools and data'), port ? all.x : B[0].x + bw, B[0].y - (port ? 20 : 30) * u, { size: 12, weight: 800, color: dat.ink, align: port ? 'left' : 'right' });
  });
  const phase2 = S.at('mcp', 6.0, 7.0), many = 1 - phase2 * 0.88;
  // 9 conexiones a medida
  let k = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++, k++) {
    const g = S.at('mcp', 0.6 + k * 0.28, 1.0 + k * 0.28, 'out');
    if (g <= 0) continue;
    const a = edgeA(i), b = edgeB(j);
    d.line(a[0], a[1], lerp(a[0], b[0], g), lerp(a[1], b[1], g), p.ink2, 1.5, undefined, many * 0.85);
  }
  const a1 = S.reveal('mcp', 3.8, 0.5);
  const cy = port ? all.y + all.h * 0.46 : all.y + all.h - 4 * u;
  d.withAlpha(a1 * (1 - phase2), () => T(S, S.l('3 × 3 = 9 conexiones a medida', '3 × 3 = 9 custom connections'), all.x + all.w / 2, port ? cy : cy, { size: 15, weight: 800, font: 'mono', color: p.ink, align: 'center', base: port ? 'middle' : 'bottom' }));
  // el estándar
  if (phase2 > 0) {
    d.withAlpha(phase2, () => {
      d.rect(bus.x, bus.y, bus.w, bus.h, { fill: alpha(ink.c, 0.12), stroke: ink.c, lw: 2.5, r: 6 });
      T(S, 'MCP', bus.x + bus.w / 2, bus.y + bus.h / 2, { size: 16, weight: 800, align: 'center', base: 'middle' });
    });
    for (let i = 0; i < 3; i++) {
      const g = S.at('mcp', 7.0 + i * 0.25, 7.6 + i * 0.25, 'out');
      const a = edgeA(i), a2: [number, number] = port ? [a[0], bus.y] : [bus.x, a[1]];
      const b = edgeB(i), b2: [number, number] = port ? [b[0], bus.y + bus.h] : [bus.x + bus.w, b[1]];
      d.line(a[0], a[1], lerp(a[0], a2[0], g), lerp(a[1], a2[1], g), sig.c, 2.2);
      d.line(b2[0], b2[1], lerp(b2[0], b[0], g), lerp(b2[1], b[1], g), dat.c, 2.2);
    }
    d.withAlpha(S.reveal('mcp', 8.6, 0.5), () => T(S, S.l('3 + 3 = 6 conexiones, una vez cada una', '3 + 3 = 6 connections, once each'), all.x + all.w / 2, port ? all.y + all.h - 6 * u : all.y + all.h - 4 * u, { size: 15, weight: 800, font: 'mono', color: ink.ink, align: 'center', base: 'bottom' }));
    d.withAlpha(S.reveal('mcp', 10.0, 0.5), () => T(S, S.l('con cinco y cinco: 25 contra 10', 'with five and five: 25 versus 10'), all.x + all.w / 2, port ? all.y + all.h - 6 * u - lh * 1.8 : all.y + all.h - 4 * u - lh * 1.8, { size: 12.5, weight: 600, color: p.ink2, align: 'center', base: 'bottom' }));
  }
}

// ═════════════════════════════════════════════════════════════════════════
// Cifras reales: τ-bench y el horizonte de METR
// ═════════════════════════════════════════════════════════════════════════
export function drawReal(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5), err = tone(S, 'err'), lat = tone(S, 'lat');
  d.withAlpha(S.reveal('real', 0, 0.5), () => pill(S, S.l('τ-bench · 2024 · agentes con llamadas a funciones', 'τ-bench · 2024 · function-calling agents'), all.x, all.y + 10 * u, { tone: 'lat', align: 'left', weight: 800, size: 13 }));
  const bars: [string, number, string, number][] = [[S.l('una vez', 'once'), 0.5, '< 50 %', 0.9], [S.l('ocho veces seguidas (comercio minorista)', 'eight times in a row (retail)'), 0.25, '< 25 %', 4.0]];
  const x0 = all.x, wMax = all.w, top = all.y + 52 * u, rowH = Math.min(100 * u, (all.h - 120 * u) / 2);
  bars.forEach(([lab, bound, txt, t0], i) => {
    const y = top + i * rowH, k = smooth(S.at('real', t0, t0 + 1.4, 'lin')), a = S.reveal('real', t0 - 0.3, 0.5);
    d.withAlpha(a, () => T(S, lab, x0, y, { size: 13, weight: 700, color: p.ink2, w: wMax }));
    const by = y + lh * (S.portrait && lab.length > 26 ? 2.4 : 1.4), bh = 30 * u;
    d.rect(x0, by, wMax, bh, { fill: p.surface2 });
    const bw = wMax * bound * k;
    d.rect(x0, by, bw, bh, { fill: alpha(err.c, 0.28), stroke: err.c, lw: 1.5 });
    for (let q = 0; q < bw - 6; q += 8 * u) d.line(x0 + q, by + bh, x0 + q + bh * 0.5, by, alpha(err.c, 0.35), 1.5);
    if (k > 0.98) { d.line(x0 + bw, by - 6 * u, x0 + bw, by + bh + 6 * u, err.c, 2.5, [5, 3]); T(S, txt, x0 + bw + 8 * u, by + bh / 2, { size: 16, weight: 800, font: 'mono', color: err.ink, base: 'middle' }); }
  });
  const ay = top + 2 * rowH - 6 * u;
  d.withAlpha(S.reveal('real', 6.6, 0.6), () => {
    [0, 0.25, 0.5, 0.75, 1].forEach((f) => { d.line(x0 + wMax * f, ay, x0 + wMax * f, ay + 5 * u, p.lineStrong, 1.5); T(S, `${Math.round(f * 100)} %`, x0 + wMax * f, ay + 7 * u, { size: 12, font: 'mono', color: p.mute, align: f === 0 ? 'left' : f === 1 ? 'right' : 'center' }); });
    T(S, S.l('Son los límites que da el resumen del artículo. Hoy los modelos son mejores; la lógica de la cadena sigue igual.', 'These are the bounds stated in the paper’s abstract. Models are better today; the logic of the chain stays the same.'), x0, ay + lh * 2.2, { size: 12, weight: 600, color: p.mute, w: wMax });
  });
  if (!S.portrait) neu(S, all.x + all.w - 64 * u, all.y + all.h - 50 * u, { scale: Math.max(2, Math.round(2.2 * u)), mood: 'think', a: S.reveal('real', 7.4, 0.5) });
  void lat;
}

export function drawHorizon(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5), lat = tone(S, 'lat'), sig = tone(S, 'sig');
  d.withAlpha(S.reveal('horizon', 0, 0.5), () => {
    pill(S, S.l('METR · 2025 · tareas de software', 'METR · 2025 · software tasks'), all.x, all.y + 10 * u, { tone: 'lat', align: 'left', weight: 800, size: 13 });
    T(S, S.l('duración de la tarea que el agente completa la mitad de las veces', 'length of the task the agent completes half the time'), all.x, all.y + 32 * u, { size: 12.5, weight: 600, color: p.ink2, w: all.w });
  });
  const n = 5, ch: Rect = { x: all.x + 8 * u, y: all.y + 76 * u, w: all.w - 16 * u, h: all.h - 76 * u - lh * 4.2 };
  const bw = ch.w / n, gap = bw * 0.28, base = ch.y + ch.h;
  for (let i = 0; i < n; i++) {
    const k = smooth(S.at('horizon', 0.8 + i * 0.7, 1.6 + i * 0.7, 'lin'));
    if (k <= 0) continue;
    const h = (ch.h * Math.pow(2, i)) / Math.pow(2, n - 1) * k;
    d.rect(ch.x + i * bw + gap / 2, base - h, bw - gap, h, { fill: alpha(lat.c, 0.3 + 0.1 * i), stroke: lat.c, lw: 1.5 });
    T(S, `${i * 7}`, ch.x + i * bw + bw / 2, base + 4 * u, { size: 12, font: 'mono', color: p.ink2, align: 'center', a: k });
    if (i > 0) d.withAlpha(k, () => pill(S, '×2', ch.x + i * bw - 2 * u, base - (ch.h * Math.pow(2, i - 1)) / Math.pow(2, n - 1) - 14 * u, { tone: 'sig', weight: 800 }));
  }
  d.line(ch.x, base, ch.x + ch.w, base, p.lineStrong, 1.5);
  d.withAlpha(S.reveal('horizon', 0.8, 0.5), () => T(S, S.l('meses', 'months'), ch.x + ch.w, base + lh * 1.3 + 4 * u, { size: 12, weight: 700, color: p.ink2, align: 'right' }));
  d.withAlpha(S.reveal('horizon', 5.2, 0.6), () => T(S, S.l('Ilustrativo: muestra la tasa (se duplica cada ≈ 7 meses), no las mediciones.', 'Illustrative: it shows the rate (doubling every ≈ 7 months), not the measurements.'), all.x, all.y + all.h - lh * 2.1, { size: 12, weight: 600, color: p.mute, w: all.w }));
  void sig;
}

// ═════════════════════════════════════════════════════════════════════════
// Caso reportado
// ═════════════════════════════════════════════════════════════════════════
export function drawIncident(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 13), lat = tone(S, 'lat'), err = tone(S, 'err');
  d.withAlpha(S.reveal('incident', 0.3, 0.5), () => pill(S, S.l('caso reportado · julio de 2025 · Replit', 'reported case · July 2025 · Replit'), all.x, all.y + 10 * u, { tone: 'mute', align: 'left', weight: 800, size: 13 }));
  const port = S.portrait, cw = port ? all.w : (all.w - 80 * u) / 2, ch = port ? 96 * u : 120 * u;
  const y0 = all.y + (port ? 56 * u : (all.h - ch) / 2 - 10 * u);
  const c1: Rect = { x: all.x, y: y0, w: cw, h: ch }, c2: Rect = port ? { x: all.x, y: y0 + ch + 76 * u, w: cw, h: ch } : { x: all.x + cw + 80 * u, y: y0, w: cw, h: ch };
  const card = (r: Rect, t: Tone, head: string, body: string, a: number) => d.withAlpha(a, () => {
    frame(S, r, { tone: t, fill: 0.08 });
    T(S, head, r.x + 12 * u, r.y + 10 * u, { size: 12, weight: 800, color: tone(S, t).ink });
    T(S, body, r.x + 12 * u, r.y + 12 * u + lh * 1.2, { size: 14, weight: 700, w: r.w - 24 * u });
  });
  card(c2, 'err', S.l('lo que hizo el agente', 'what the agent did'), S.l('borró la base de datos de producción', 'deleted the production database'), S.reveal('incident', 3.6, 0.6));
  card(c1, 'lat', S.l('la orden que tenía', 'the order it had'), S.l('congelación de cambios: no tocar nada', 'code freeze: change nothing'), S.reveal('incident', 7.2, 0.6));
  const a = S.reveal('incident', 9.4, 0.6);
  d.withAlpha(a, () => {
    const from: [number, number] = port ? [c1.x + c1.w / 2, c1.y + c1.h] : [c1.x + c1.w, c1.y + c1.h / 2], to: [number, number] = port ? [c2.x + c2.w / 2, c2.y] : [c2.x, c2.y + c2.h / 2];
    d.arrow(from[0], from[1], to[0], to[1], lat.c, 2, 9);
    const m: [number, number] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
    d.circle(m[0], m[1], 15 * u, { fill: p.stage, stroke: err.c, lw: 2.5 });
    glyph(S, 'cross', m[0], m[1], 18 * u, err.c);
    pill(S, S.l('no la frenó', 'did not stop it'), m[0], m[1] + (port ? 0 : 28 * u), { tone: 'err', weight: 800, align: port ? 'left' : 'center' });
  });
  d.withAlpha(S.reveal('incident', 10.2, 0.6), () => T(S, S.l('Según reportó su usuario; cobertura: The Register, 22 de julio de 2025.', 'As reported by its user; coverage: The Register, July 22, 2025.'), all.x, all.y + all.h - lh * 2.2, { size: 12, weight: 600, color: p.mute, w: all.w }));
  if (!port) neu(S, all.x + all.w - 64 * u, all.y + all.h - 80 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'sad', a: S.reveal('incident', 9.6, 0.5) });
}

// ═════════════════════════════════════════════════════════════════════════
// Permisos: una regla en el programa, no un ruego al modelo
// ═════════════════════════════════════════════════════════════════════════
export function drawPerm(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 13), lat = tone(S, 'lat'), w = tone(S, 'w'), dat = tone(S, 'dat'), err = tone(S, 'err'), ink = tone(S, 'ink');
  const port = S.portrait, ph = port ? 92 * u : 108 * u, gap = 14 * u, pw = port ? all.w : (all.w - gap) / 2;
  const P1: Rect = { x: all.x, y: all.y + 4 * u, w: pw, h: ph }, P2: Rect = port ? { x: all.x, y: P1.y + ph + gap, w: pw, h: ph } : { x: all.x + pw + gap, y: P1.y, w: pw, h: ph };
  d.withAlpha(S.reveal('perm', 0.3, 0.5), () => {
    frame(S, P1, { tone: 'lat', dash: [6, 4], fill: 0.05 });
    T(S, S.l('en el prompt', 'in the prompt'), P1.x + 10 * u, P1.y + 8 * u, { size: 12, weight: 800, color: lat.ink });
    T(S, S.l('«no gastes más de US$ 500»', '“do not spend over $500”'), P1.x + 10 * u, P1.y + 8 * u + lh * 1.3, { size: 14, weight: 700, w: P1.w - 20 * u });
    pill(S, S.l('un ruego', 'a plea'), P1.x + P1.w - 10 * u, P1.y + P1.h - 18 * u, { tone: 'lat', align: 'right', weight: 800 });
  });
  d.withAlpha(S.reveal('perm', 5.2, 0.5), () => {
    frame(S, P2, { tone: 'w', fill: 0.08, lw: 2.2 });
    glyph(S, 'lock', P2.x + P2.w - 22 * u, P2.y + 22 * u, 22 * u, w.c);
    T(S, S.l('en el programa', 'in the program'), P2.x + 10 * u, P2.y + 8 * u, { size: 12, weight: 800, color: w.ink });
    T(S, S.lang === 'es' ? 'si total > límite:\n  pedir_aprobación()' : 'if total > limit:\n  ask_approval()', P2.x + 10 * u, P2.y + 8 * u + lh * 1.3, { size: 13, weight: 700, font: 'mono', lh: 1.3 });
    pill(S, S.l('no depende del modelo', 'does not depend on the model'), P2.x + P2.w - 10 * u, P2.y + P2.h - 18 * u, { tone: 'w', align: 'right', weight: 800 });
  });
  // el flujo: modelo → programa (regla) → herramienta
  const fy = (port ? P2.y + ph : P1.y + ph) + (port ? 44 * u : 52 * u), bh = 44 * u, bw = port ? 84 * u : 120 * u;
  const xs = [all.x + (port ? 0 : 30 * u), all.x + all.w / 2 - bw / 2, all.x + all.w - bw - (port ? 0 : 30 * u)];
  const fa = S.reveal('perm', 8.4, 0.6);
  d.withAlpha(fa, () => {
    const labs: [string, Tone][] = [[S.l('modelo', 'model'), 'lat'], [S.l('programa', 'program'), 'ink'], [S.lang === 'es' ? 'hacer_pedido' : 'place_order', 'dat']];
    labs.forEach(([lab, t], i) => {
      const tc = tone(S, t), r: Rect = { x: xs[i], y: fy, w: bw, h: bh };
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tc.c, i === 2 ? 0.06 : 0.12), stroke: tc.c, lw: i === 1 ? 2.5 : 1.5, r: 3, dash: i === 2 ? [5, 4] : undefined });
      T(S, lab, r.x + r.w / 2, r.y + r.h / 2, { size: 12.5, weight: 800, color: tc.ink, align: 'center', base: 'middle', font: i === 2 ? 'mono' : 'ui' });
    });
    d.arrow(xs[0] + bw + 2 * u, fy + bh / 2, xs[1] - 2 * u, fy + bh / 2, lat.c, 2, 8);
    d.line(xs[1] + bw + 2 * u, fy + bh / 2, xs[2] - 2 * u, fy + bh / 2, p.lineStrong, 2, [5, 5]);
  });
  const k = S.at('perm', 9.4, 10.8, 'io'), hit = S.at('perm', 10.8, 11.2);
  if (k > 0) {
    const call = S.lang === 'es' ? 'hacer_pedido(2621.40)' : 'place_order(2621.40)', wch = d.measure(call, { size: FS(S, 12), weight: 800, font: 'mono' }) + 14 * u;
    const cx = lerp(xs[0] + bw, xs[1] - wch / 2 - 4 * u, k), cy = fy - 20 * u;
    d.withAlpha(Math.min(fa, 1), () => {
      d.rect(cx - (k < 1 ? 0 : wch / 2), cy - 11 * u, wch, 22 * u, { fill: dat.c, stroke: p.stage, lw: 2, r: 3 });
      T(S, call, cx - (k < 1 ? 0 : wch / 2) + 7 * u, cy, { size: 12, weight: 800, font: 'mono', color: p.stage, base: 'middle' });
    });
  }
  d.withAlpha(hit, () => {
    d.rect(xs[1] - 5 * u, fy - 5 * u, 8 * u, bh + 10 * u, { fill: err.c });
    pill(S, S.l('pide aprobación', 'asks approval'), xs[1] + bw / 2, fy + bh + 22 * u, { tone: 'w', weight: 800 });
  });
  void ink; void err;
}

// ═════════════════════════════════════════════════════════════════════════
// Niveles de autonomía
// ═════════════════════════════════════════════════════════════════════════
export function drawLevels(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12);
  const sig = tone(S, 'sig'), w = tone(S, 'w');
  const rows = [
    { n: S.l('Sugiere', 'Suggests'), s: S.l('La persona ejecuta cada acción.', 'The person runs every action.'), v: 1, c: 4 },
    { n: S.l('Pide aprobación', 'Asks approval'), s: S.l('Propone; la persona aprueba cada acción.', 'It proposes; the person approves each action.'), v: 2, c: 3 },
    { n: S.l('Actúa hasta un límite', 'Acts up to a limit'), s: S.l('Pide permiso solo por encima del límite.', 'It asks only above the limit.'), v: 3, c: 2 },
    { n: S.l('Actúa sola', 'Acts alone'), s: S.l('La persona revisa el registro después.', 'The person reviews the log afterward.'), v: 4, c: 1 },
  ];
  const port = S.portrait, mw = (port ? 56 : 80) * u, head = lh * 1.6, rh = (all.h - head) / 4;
  const mx = [all.x + all.w - 2 * mw - 18 * u, all.x + all.w - mw];
  d.withAlpha(S.reveal('levels', 0.2, 0.5), () => {
    T(S, S.l('velocidad', 'speed'), mx[0] + mw / 2, all.y, { size: 12, weight: 800, color: sig.ink, align: 'center' });
    T(S, S.l('control', 'control'), mx[1] + mw / 2, all.y, { size: 12, weight: 800, color: w.ink, align: 'center' });
  });
  rows.forEach((r, i) => {
    const a = S.reveal('levels', 0.5 + i * 2.0, 0.6), y = all.y + head + i * rh, h = rh - 8 * u;
    d.withAlpha(a, () => {
      d.rect(all.x, y, all.w, h, { fill: alpha(p.ink, 0.03 + i * 0.012), stroke: p.lineStrong, lw: 1.2, r: 3 });
      d.rect(all.x, y, 6 * u, h, { fill: alpha(w.c, 0.25 + 0.2 * i) });
      T(S, `${i + 1}`, all.x + 20 * u, y + h / 2, { size: 20, weight: 800, font: 'mono', color: p.mute, align: 'center', base: 'middle' });
      const tw = mx[0] - all.x - 44 * u - 8 * u;
      T(S, r.n, all.x + 38 * u, y + 6 * u, { size: 14, weight: 800, w: tw });
      T(S, r.s, all.x + 38 * u, y + 6 * u + lineH(S, 14) * (r.n.length * 8 * u > tw ? 2 : 1) + 2 * u, { size: 12, weight: 600, color: p.ink2, w: tw });
      [[mx[0], r.v, sig], [mx[1], r.c, w]].forEach(([x, v, tc]) => {
        for (let b = 0; b < 4; b++) {
          const bx = (x as number) + b * (mw / 4), on = b < (v as number);
          d.rect(bx + 1.5 * u, y + h / 2 - 9 * u, mw / 4 - 3 * u, 18 * u, { fill: on ? alpha((tc as ReturnType<typeof tone>).c, 0.8) : 'transparent', stroke: (tc as ReturnType<typeof tone>).c, lw: 1.2 });
        }
      });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Persona en el bucle: revisar es leer las cifras
// ═════════════════════════════════════════════════════════════════════════
export function drawHitl(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 12.5), w = tone(S, 'w'), dat = tone(S, 'dat'), err = tone(S, 'err'), ink = tone(S, 'ink'), lat = tone(S, 'lat');
  const port = S.portrait, bh = 44 * u, bw = port ? 86 * u : 118 * u, cy = all.y + 8 * u;
  const xs = [all.x, all.x + all.w / 2 - bw / 2, all.x + all.w - bw];
  const labs: [string, Tone][] = [[S.l('agente', 'agent'), 'lat'], [S.l('aprobación', 'approval'), 'w'], [S.l('el mundo', 'the world'), 'dat']];
  labs.forEach(([lab, t], i) => {
    const a = S.reveal('hitl', 0.3 + i * (i === 1 ? 2.8 : 0.7), 0.5), tc = tone(S, t);
    d.withAlpha(a, () => {
      d.rect(xs[i], cy, bw, bh, { fill: alpha(tc.c, 0.1), stroke: tc.c, lw: i === 1 ? 2.5 : 1.5, r: 3 });
      T(S, lab, xs[i] + bw / 2 + (i === 1 ? 10 * u : 0), cy + bh / 2, { size: 13, weight: 800, color: tc.ink, align: 'center', base: 'middle' });
      if (i === 1) glyph(S, 'person', xs[i] + 16 * u, cy + bh / 2, 18 * u, w.c);
    });
  });
  d.withAlpha(S.reveal('hitl', 1.0, 0.5), () => d.arrow(xs[0] + bw + 2 * u, cy + bh / 2, xs[1] - 2 * u, cy + bh / 2, lat.c, 2, 8));
  d.withAlpha(S.reveal('hitl', 3.4, 0.5), () => { d.arrow(xs[1] + bw + 2 * u, cy + bh / 2, xs[2] - 2 * u, cy + bh / 2, dat.c, 2, 8); T(S, S.l('si aprueba', 'if approved'), (xs[1] + bw + xs[2]) / 2, cy + bh / 2 - 8 * u, { size: 12, weight: 700, color: dat.ink, align: 'center', base: 'bottom' }); });
  // la tarjeta de aprobación del escenario «error de cantidad»
  const cw = port ? all.w : Math.min(all.w * 0.62, 430 * u), cx = all.x, cyy = cy + bh + 26 * u, a = S.reveal('hitl', 5.2, 0.6);
  const items = [{ sku: 'COJ-6204', qty: 280, unit: 8.5 }, { sku: 'FIL-A15', qty: 17, unit: 14.2 }];
  const ch = lh * 1.3 + items.length * lh * 2 + lh * 1.5 + 14 * u;
  d.withAlpha(a, () => {
    d.rect(cx, cyy, cw, ch, { fill: alpha(w.c, 0.1), stroke: w.c, lw: 2, r: 3 });
    let y = cyy + 7 * u;
    T(S, S.l('El agente pide aprobar este pedido', 'The agent asks you to approve this order'), cx + 10 * u, y, { size: 12.5, weight: 800, color: w.ink }); y += lh * 1.3;
    items.forEach((it) => {
      const stock = ITEMS.find((i) => i.sku === it.sku)!;
      T(S, `${it.qty} × ${it.sku} = ${money(it.qty * it.unit, S.lang)}`, cx + 10 * u, y, { size: 12.5, weight: 800, font: 'mono' });
      T(S, S.l(`hay ${stock.stock} · objetivo ${stock.target}`, `have ${stock.stock} · target ${stock.target}`), cx + 10 * u, y + lh, { size: 12, weight: 600, color: p.ink2 });
      y += lh * 2;
    });
    T(S, `${S.l('Total', 'Total')} ${money(2621.4, S.lang)}`, cx + 10 * u, y + 2 * u, { size: 13, weight: 800, font: 'mono' });
  });
  // el número sospechoso y la cuenta que lo delata
  const b = S.reveal('hitl', 8.6, 0.6);
  d.withAlpha(b, () => {
    const y1 = cyy + 7 * u + lh * 1.3, wd = d.measure('280', { size: FS(S, 12.5), weight: 800, font: 'mono' });
    d.rect(cx + 8 * u, y1 - 2 * u, wd + 4 * u, lh + 2 * u, { stroke: err.c, lw: 2.5, r: 2 });
    const bx = port ? cx : cx + cw + 16 * u, by = port ? cyy + ch + 10 * u : cyy + 8 * u, bw2 = port ? all.w : all.x + all.w - bx;
    pill(S, S.l('¿cuántas hacen falta?', 'how many are needed?'), bx, by + 10 * u, { tone: 'lat', align: 'left', weight: 800 });
    T(S, S.l('objetivo 40 − hay 12 = 28, no 280', 'target 40 − have 12 = 28, not 280'), bx, by + 30 * u, { size: 13, weight: 800, font: 'mono', color: err.ink, w: bw2 });
  });
  void ink;
}

// ═════════════════════════════════════════════════════════════════════════
// Empezar con poco
// ═════════════════════════════════════════════════════════════════════════
export function drawStart(S: Frame) {
  const { d, pal: p } = S, u = S.u, all = area(S), lh = lineH(S, 13);
  const dat = tone(S, 'dat'), w = tone(S, 'w'), err = tone(S, 'err');
  const steps: { t: string; u: string; tc: Tone; at: number }[] = [
    { t: S.l('leer y resumir', 'read and summarize'), u: S.l('se deshace', 'undoable'), tc: 'dat', at: 1.2 },
    { t: S.l('redactar borradores', 'draft'), u: S.l('se deshace', 'undoable'), tc: 'dat', at: 3.2 },
    { t: S.l('actuar con deshacer', 'act with undo'), u: S.l('se deshace a medias', 'partly undoable'), tc: 'w', at: 7.6 },
    { t: S.l('pagar, borrar, enviar', 'pay, delete, send'), u: S.l('no se deshace', 'cannot be undone'), tc: 'err', at: 9.2 },
  ];
  const port = S.portrait, stairs: Rect = port ? { x: all.x, y: all.y, w: all.w, h: all.h * 0.56 } : { x: all.x, y: all.y, w: all.w * 0.58, h: all.h };
  const sw = (stairs.w - 3 * 6 * u) / 4;
  steps.forEach((s, i) => {
    const a = S.reveal('start', s.at, 0.6), h = stairs.h * (0.3 + 0.18 * i) - (port ? 20 * u : 30 * u), tc = tone(S, s.tc), x = stairs.x + i * (sw + 6 * u), y = stairs.y + stairs.h - h;
    d.withAlpha(a, () => {
      d.rect(x, y, sw, h, { fill: alpha(tc.c, 0.12 + 0.05 * i), stroke: tc.c, lw: 2, r: 3, dash: s.tc === 'err' ? [6, 4] : undefined });
      T(S, s.t, x + sw / 2, y + 8 * u, { size: 12.5, weight: 800, color: tc.ink, align: 'center', w: sw - 8 * u });
      pill(S, s.u, x + sw / 2, y + h - 16 * u, { tone: s.tc, weight: 700, size: 12 });
    });
  });
  d.withAlpha(S.reveal('start', 1.0, 0.5), () => T(S, S.l('más riesgo, más control necesario →', 'more risk, more control needed →'), stairs.x, stairs.y - 2 * u, { size: 12, weight: 700, color: p.mute }));
  const list: Rect = port ? { x: all.x, y: stairs.y + stairs.h + 14 * u, w: all.w, h: all.h - stairs.h - 14 * u } : { x: stairs.x + stairs.w + 22 * u, y: all.y + 30 * u, w: all.w - stairs.w - 22 * u, h: all.h - 30 * u };
  const checks = [S.l('permisos mínimos', 'minimal permissions'), S.l('registro de cada llamada', 'a log of every call'), S.l('aprobación antes de lo irreversible', 'approval before the irreversible'), S.l('medir antes de subir de nivel', 'measure before moving up')];
  let y = list.y;
  checks.forEach((c, i) => {
    const a = S.reveal('start', 10.4 + i * 0.8, 0.5);
    const ls = wrapLines(S, c, list.w - 30 * u, 13, 700);
    d.withAlpha(a, () => { glyph(S, 'check', list.x + 10 * u, y + lh * 0.5, 16 * u, dat.c); ls.forEach((ln, k) => T(S, ln, list.x + 28 * u, y + k * lh, { size: 13, weight: 700 })); });
    y += ls.length * lh + 6 * u;
  });
  void w; void err;
}

// ═════════════════════════════════════════════════════════════════════════
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - (24 * sc) / 2, cy - 78 * u, { scale: sc, mood: 'happy', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    T(S, S.l('Siguiente', 'Next'), cx, cy + 56 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
    T(S, S.l('Alucinaciones y límites', 'Hallucinations and limits'), cx, cy + 82 * u, { size: 24, weight: 800, align: 'center', w: S.W - 40 * u });
  });
  void clamp;
}
