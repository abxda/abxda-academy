// Vistas 3, 4 y cierre: plan y memoria (plan … memory-out), MCP (mcp-problem, mcp), repaso y puente.
import { alpha, clamp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MSGS, ROLE_TONE, roleName } from './story';
import { FS, area, card, chip, chipH, fitText, fr, glyph, hold, para, paraH, pick, tight } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Plan y memoria
// ════════════════════════════════════════════════════════════════════════════════════════════════
/** Largo ilustrativo de cada mensaje (en «unidades», proporcional a su texto): solo para dibujar barras. */
const LEN: Record<string, number> = Object.fromEntries(MSGS.map((m) => [m.id, Math.max(18, m.es.length)]));
const ROUNDS = [['sys', 'tools', 'user'], ['sys', 'tools', 'user', 'call1', 'res1'], ['sys', 'tools', 'user', 'call1', 'res1', 'call2', 'res2']];

export function drawMemory(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const planR: Rect = port ? { x: A.x, y: A.y, w: A.w, h: A.h * 0.42 } : { x: A.x, y: A.y, w: Math.min(A.w * 0.38, 300 * u), h: A.h };
  const R: Rect = port ? { x: A.x, y: planR.y + planR.h + 16 * u, w: A.w, h: A.h - planR.h - 16 * u } : { x: planR.x + planR.w + 28 * u, y: A.y, w: A.w - planR.w - 28 * u, h: A.h };
  // ── el plan ──
  const items = [S.l('buscar funciones de hoy', 'find tonight’s showtimes'), S.l('elegir una con 2 lugares juntos', 'pick one with 2 seats together'), S.l('comprar si cuesta menos de 300', 'buy if it costs under 300'), S.l('responder con los asientos', 'answer with the seats')];
  const sizeR = tight(S) ? 12.5 : 13.5, size = FS(S, sizeR), rowH = size * u * 1.25 + (tight(S) ? 6 : 10) * u, head = FS(S, 13) * u + 14 * u;
  const ph = Math.min(planR.h, head + items.length * rowH + 12 * u), py = planR.y + (port ? 0 : Math.max(0, (planR.h - ph) / 2));
  d.withAlpha(fr(S, 'plan', 0.05, 0.2), () => {
    card(S, { x: planR.x, y: py, w: planR.w, h: ph }, { tone: 'lat', hot: 0.03 });
    fitText(S, S.l('plan (texto en el contexto)', 'plan (text in the context)'), planR.x + 10 * u, py + 8 * u, planR.w - 20 * u, 13, { weight: 800, color: tone(S, 'lat').ink, base: 'top' });
    items.forEach((t, i) => {
      const y = py + head + i * rowH, a = fr(S, 'plan', 0.2 + i * 0.08, 0.28 + i * 0.08), tick = fr(S, 'plan', 0.55 + i * 0.1, 0.62 + i * 0.1);
      d.withAlpha(a, () => {
        const bs = 14 * u, bx = planR.x + 12 * u, by = y + (rowH - bs) / 2 - 2 * u;
        d.rect(bx, by, bs, bs, { stroke: p.ink2, lw: 1.4, r: 2 });
        if (tick > 0.01) glyph(S, 'check', bx + bs / 2, by + bs / 2, bs * 0.9, tone(S, 'dat').ink, tick);
        fitText(S, t, bx + bs + 8 * u, by + bs / 2, planR.w - bs - 32 * u, sizeR, { weight: 600, base: 'middle' });
        if (tick > 0.01) d.line(bx + bs + 8 * u, by + bs / 2, bx + bs + 8 * u + Math.min(planR.w - bs - 32 * u, d.measure(t, { size, weight: 600 })) * tick, by + bs / 2, alpha(p.ink2, 0.6), 1.3);
      });
    });
  });
  // ── lo que relee en cada vuelta ──
  const mA = S.on('memory') ? fr(S, 'memory', 0.05, 0.18) : 0;
  if (mA < 0.01) return;
  const outA = S.on('memory-out') ? fr(S, 'memory-out', 0.1, 0.3) : 0;
  const bh = Math.max(18 * u, Math.min(30 * u, (R.h - 120 * u) / 5)), gap = (tight(S) ? 6 : 12) * u, labW = Math.min(R.w * 0.26, d.measure(S.l('vuelta 30', 'round 30'), { size: FS(S, 12.5), weight: 700 }) + 10 * u);
  const maxLen = ROUNDS[2].reduce((s, k) => s + LEN[k], 0);
  const barMax = (R.w - labW) * (outA > 0 ? 0.62 : 0.92), sc = barMax / maxLen;
  const H = FS(S, 13) * u + 12 * u + 3 * (bh + gap) + (outA > 0 ? bh + gap + 50 * u : 30 * u);
  let y = R.y + Math.max(0, (R.h - H) / 2);
  d.withAlpha(mA * (1 - outA), () => fitText(S, S.l('lo que el modelo lee en cada vuelta', 'what the model reads each round'), R.x, y, R.w, 13, { weight: 800, color: p.ink2, base: 'top' }));
  y += FS(S, 13) * u + 12 * u;
  const bx = R.x + labW;
  ROUNDS.forEach((ids, i) => {
    const a = fr(S, 'memory', 0.1 + i * 0.12, 0.2 + i * 0.12);
    d.withAlpha(a, () => {
      fitText(S, S.l(`vuelta ${i + 1}`, `round ${i + 1}`), R.x, y + bh / 2, labW - 6 * u, 12.5, { weight: 700, color: p.ink2, base: 'middle' });
      let x = bx;
      ids.forEach((id, j) => {
        const m = MSGS.find((q) => q.id === id)!, w = LEN[id] * sc, t = tone(S, ROLE_TONE[m.role]);
        const isNew = i > 0 && !ROUNDS[i - 1].includes(id);
        d.rect(x, y, w - 1.5, bh, { fill: alpha(m.role === 'sys' ? p.ink : t.c, isNew ? 0.5 : 0.2), stroke: m.role === 'sys' ? p.lineStrong : t.c, lw: 1, r: 2 });
        if (j < 3 && i === 0 && w > d.measure(roleName(S, m.role, true), { size: FS(S, 12), weight: 700 }) + 6 * u) fitText(S, roleName(S, m.role, true), x + w / 2, y + bh / 2, w - 4 * u, 12, { weight: 700, align: 'center', base: 'middle' });
        x += w;
      });
    });
    y += bh + gap;
  });
  const capA = fr(S, 'memory', 0.55, 0.7) * (1 - outA);
  if (capA > 0.01) para(S, S.l('cada vuelta relee todo, desde el principio: cada paso cuesta más que el anterior', 'every round rereads everything from the start: each step costs more than the last'), R.x, y + 4 * u, R.w, FS(S, 13), { weight: 700, color: tone(S, 'err').ink, a: capA, maxLines: 3 });
  // ── la ventana se llena: notas fuera ──
  if (outA > 0.01) d.withAlpha(outA, () => {
    const winX = bx + barMax * 1.08, top = y - 3 * (bh + gap) - 6 * u;
    // una vuelta muy posterior (ilustrativa) ya no cabe
    const long = (R.x + R.w) - bx - 4 * u;
    d.rect(bx, y, Math.min(winX - bx, long), bh, { fill: alpha(tone(S, 'lat').c, 0.35), stroke: tone(S, 'lat').c, lw: 1, r: 2 });
    if (long > winX - bx) d.rect(winX, y, long - (winX - bx), bh, { stroke: tone(S, 'err').c, lw: 1.2, r: 2, dash: [4, 3] });
    fitText(S, S.l('vuelta 30', 'round 30'), R.x, y + bh / 2, labW - 6 * u, 12.5, { weight: 700, color: p.ink2, base: 'middle' });
    d.line(winX, top, winX, y + bh + 6 * u, p.ink, 2.2);
    fitText(S, S.l('fin de la ventana', 'end of window'), winX - 4 * u, top - 2 * u, winX - R.x, 12, { weight: 800, align: 'right', base: 'bottom' });
    // notas fuera
    const ny = y + bh + 14 * u, nh = Math.min(42 * u, R.y + R.h - ny);
    if (nh > 20 * u) {
      const nw = Math.min(R.w * 0.5, 210 * u), nx = R.x + R.w - nw;
      card(S, { x: nx, y: ny, w: nw, h: nh }, { tone: 'dat', dash: [4, 3], hot: 0.1 });
      glyph(S, 'doc', nx + 14 * u, ny + nh / 2, Math.min(nh - 8 * u, 22 * u), tone(S, 'dat').ink);
      fitText(S, S.l('notas.txt: fuera del contexto', 'notes.txt: outside the context'), nx + 28 * u, ny + nh / 2, nw - 34 * u, 12.5, { weight: 700, base: 'middle' });
      const ax = nx - 8 * u, k = fr(S, 'memory-out', 0.4, 0.6);
      if (k > 0.01) { S.d.arrow(bx + 40 * u, ny + nh * 0.3, ax, ny + nh * 0.3, tone(S, 'dat').c, 1.8, 7, k); fitText(S, S.l('guarda', 'saves'), bx + 40 * u, ny + nh * 0.3 - 3 * u, ax - bx - 40 * u, 12, { weight: 700, color: tone(S, 'dat').ink, base: 'bottom', a: k }); }
      const k2 = fr(S, 'memory-out', 0.65, 0.85);
      if (k2 > 0.01) { S.d.arrow(ax, ny + nh * 0.8, bx + 40 * u, ny + nh * 0.8, tone(S, 'lat').c, 1.8, 7, k2); fitText(S, S.l('relee', 'rereads'), bx + 40 * u, ny + nh * 0.8 + 3 * u, ax - bx - 40 * u, 12, { weight: 700, color: tone(S, 'lat').ink, base: 'top', a: k2 }); }
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// MCP
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawMcp(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const apps = [S.l('chat', 'chat'), S.l('editor de código', 'code editor'), S.l('asistente de oficina', 'office assistant')];
  const tools = [S.l('cartelera', 'showtimes'), S.l('calendario', 'calendar'), S.l('correo', 'email'), S.l('base de datos', 'database')];
  const hubK = S.on('mcp') ? fr(S, 'mcp', 0.15, 0.4) : 0;
  const capH = FS(S, 13.5) * u + 16 * u;
  const B = { x: A.x, y: A.y, w: A.w, h: A.h - capH };
  const boxH = chipH(S, 13) + 6 * u;
  // posiciones
  const pos = (n: number, i: number, side: 0 | 1): Rect => {
    if (port) {
      const w = (B.w - (n - 1) * 6 * u) / n, y = side === 0 ? B.y : B.y + B.h - boxH * 1.6;
      return { x: B.x + i * (w + 6 * u), y, w, h: boxH * 1.6 };
    }
    const w = Math.min(B.w * 0.3, 190 * u), x = side === 0 ? B.x : B.x + B.w - w, gap = (B.h - n * boxH) / (n + 1);
    return { x, y: B.y + gap + i * (boxH + gap), w, h: boxH };
  };
  const hub: Rect = port ? { x: B.x + B.w / 2 - 70 * u, y: B.y + B.h / 2 - 24 * u, w: 140 * u, h: 48 * u } : { x: B.x + B.w / 2 - 55 * u, y: B.y + B.h / 2 - 28 * u, w: 110 * u, h: 56 * u };
  const ap = apps.map((_, i) => pos(apps.length, i, 0)), tp = tools.map((_, i) => pos(tools.length, i, 1));
  const anchorA = (r: Rect) => (port ? [r.x + r.w / 2, r.y + r.h] : [r.x + r.w, r.y + r.h / 2]) as [number, number];
  const anchorT = (r: Rect) => (port ? [r.x + r.w / 2, r.y] : [r.x, r.y + r.h / 2]) as [number, number];
  // conexiones a la medida
  const lineA = fr(S, 'mcp-problem', 0.3, 0.8, 'lin');
  let k = 0;
  ap.forEach((a) => tp.forEach((t) => {
    const idx = k++, la = clamp(lineA * 12 - idx) * (1 - hubK);
    if (la <= 0.01) return;
    const [x1, y1] = anchorA(a), [x2, y2] = anchorT(t);
    d.line(x1, y1, x2, y2, alpha(tone(S, 'err').c, 0.7 * la), 1.4);
    d.circle((x1 + x2) / 2, (y1 + y2) / 2, 3 * u, { fill: tone(S, 'err').c, a: la });
  }));
  // por el estándar
  if (hubK > 0.01) d.withAlpha(hubK, () => {
    const hc: [number, number] = [hub.x + hub.w / 2, hub.y + hub.h / 2];
    ap.forEach((a) => { const [x, y] = anchorA(a); d.line(x, y, port ? hc[0] : hub.x, port ? hub.y : hc[1], tone(S, 'w').c, 2); });
    tp.forEach((t) => { const [x, y] = anchorT(t); d.line(port ? hc[0] : hub.x + hub.w, port ? hub.y + hub.h : hc[1], x, y, tone(S, 'w').c, 2); });
    card(S, hub, { tone: 'w', hot: 0.5, r: 8 * u });
    fitText(S, 'MCP', hub.x + hub.w / 2, hub.y + hub.h * 0.36, hub.w - 10 * u, 17, { weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'middle' });
    fitText(S, S.l('estándar abierto', 'open standard'), hub.x + hub.w / 2, hub.y + hub.h * 0.74, hub.w - 8 * u, 12, { weight: 700, color: p.ink2, align: 'center', base: 'middle' });
  });
  // cajas
  const boxes = (rs: Rect[], names: string[], t: 'sig' | 'dat', a0: number) => rs.forEach((r, i) => {
    const a = fr(S, 'mcp-problem', a0 + i * 0.04, a0 + 0.1 + i * 0.04);
    d.withAlpha(a, () => {
      card(S, r, { tone: t, hot: 0.08 });
      if (port) para(S, names[i], r.x + 3 * u, r.y + r.h / 2 - paraH(S, names[i], r.w - 6 * u, FS(S, 12), { weight: 700, maxLines: 2 }) / 2, r.w - 6 * u, FS(S, 12), { weight: 700, align: 'center', maxLines: 2 });
      else fitText(S, names[i], r.x + r.w / 2, r.y + r.h / 2, r.w - 10 * u, 13, { weight: 700, align: 'center', base: 'middle' });
    });
  });
  boxes(ap, apps, 'sig', 0.02);
  boxes(tp, tools, 'dat', 0.14);
  // títulos de columna (solo en horizontal) y la cuenta
  if (!port) {
    fitText(S, S.l('aplicaciones de IA', 'AI apps'), ap[0].x, ap[0].y - 8 * u, ap[0].w, 12.5, { weight: 800, color: p.ink2, base: 'bottom', a: fr(S, 'mcp-problem', 0, 0.1) });
    fitText(S, S.l('herramientas y datos', 'tools and data'), tp[0].x, tp[0].y - 8 * u, tp[0].w, 12.5, { weight: 800, color: p.ink2, base: 'bottom', a: fr(S, 'mcp-problem', 0.12, 0.22) });
  }
  const cy = A.y + A.h - capH / 2;
  const c1 = fr(S, 'mcp-problem', 0.7, 0.85) * (1 - hubK), c2 = S.on('mcp') ? fr(S, 'mcp', 0.45, 0.6) : 0;
  if (c1 > 0.01) chip(S, S.l('3 × 4 = 12 conexiones a la medida', '3 × 4 = 12 custom connections'), A.x + A.w / 2, cy, 'err', { size: 13.5, a: c1, maxW: A.w });
  if (c2 > 0.01) chip(S, S.l('3 + 4 = 7 conexiones · Anthropic, noviembre de 2024', '3 + 4 = 7 connections · Anthropic, November 2024'), A.x + A.w / 2, cy, 'w', { size: 13.5, a: c2, maxW: A.w });
  void hold; void pick;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Repaso y puente
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const rows = [
    { t: S.l('un agente es un modelo en un bucle: pensar → actuar → observar', 'an agent is a model in a loop: think → act → observe'), tone: 'w' as const },
    { t: S.l('el modelo escribe llamadas; un programa las ejecuta y le devuelve el resultado', 'the model writes calls; a program runs them and returns the result'), tone: 'lat' as const },
    { t: S.l('los errores se acumulan: 0.95 por paso son 0.60 en diez pasos', 'errors pile up: 0.95 per step is 0.60 over ten steps'), tone: 'err' as const },
    { t: S.l('la revisión humana y los permisos en el programa contienen el error', 'human review and permissions in the program keep errors in check'), tone: 'dat' as const },
  ];
  const w = Math.min(A.w, 640 * u), x = A.x + (A.w - w) / 2, size = FS(S, tight(S) ? 13 : 16), nb = 26 * u;
  const hs = rows.map((r) => Math.max(nb, paraH(S, r.t, w - nb - 14 * u, size, { weight: 700, maxLines: 2 })));
  const gap = (tight(S) ? 8 : 14) * u, H = hs.reduce((a, b) => a + b, 0) + gap * 3;
  let y = A.y + Math.max(0, (A.h - H) / 2);
  rows.forEach((r, i) => {
    const a = fr(S, 'recap', 0.05 + i * 0.18, 0.15 + i * 0.18), t = tone(S, r.tone);
    d.withAlpha(a, () => {
      d.circle(x + nb / 2, y + nb / 2, nb / 2, { fill: alpha(t.c, 0.18), stroke: t.c, lw: 1.5 });
      d.text(String(i + 1), x + nb / 2, y + nb / 2, { size: FS(S, 13), weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
      para(S, r.t, x + nb + 14 * u, y + Math.max(0, (nb - size * u * 1.28) / 2), w - nb - 14 * u, size, { weight: 700, maxLines: 2 });
    });
    y += hs[i] + gap;
  });
  void p;
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const sc = Math.max(3, Math.round(4 * u)), nw = 24 * sc, ny = A.y + A.h * 0.18;
  neu(S, A.x + A.w / 2 - nw / 2, ny, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  const y = ny + 26 * sc;
  d.withAlpha(fr(S, 'bridge', 0.35, 0.5), () => {
    fitText(S, S.l('siguiente lección', 'next lesson'), A.x + A.w / 2, y, A.w, 13, { weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, S.l('Alucinaciones y límites', 'Hallucinations and limits'), A.x + A.w / 2, y + FS(S, 13) * u + 8 * u, A.w, 22, { weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'top' });
  });
  para(S, S.l('¿Por qué se equivoca con tanta seguridad, y qué se puede hacer?', 'Why is it wrong with such confidence, and what can be done?'), A.x + A.w * 0.1, y + FS(S, 13) * u + FS(S, 22) * u + 22 * u, A.w * 0.8, FS(S, 14), { weight: 600, color: p.ink2, align: 'center', a: fr(S, 'bridge', 0.6, 0.75) });
}
