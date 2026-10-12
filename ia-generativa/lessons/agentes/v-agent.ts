// Vista 2: el agente por dentro (tool-def … react). Un solo diagrama que se arma pieza por pieza:
//   contexto (la lista de mensajes que lee el modelo) → modelo → programa → herramientas → programa → contexto.
// Las piezas quedan siempre en su sitio; lo que cambia es qué se resalta y qué mensajes se van agregando.
// La línea de «lo que pasa ahora» (debajo del diagrama) muestra la llamada que escribe el modelo, el resultado que
// devuelve la herramienta o la cuenta que hace el modelo.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { MSGS, ROLE_TONE, TOOLS, msg, roleName, txt, type Msg } from './story';
import { FS, area, card, chip, chipH, fitText, fr, growArrow, hold, lines, lock, para, pick, tight } from './ui';

// ── geometría ───────────────────────────────────────────────────────────────────────────────────────
export interface AgentLay { A: Rect; ctx: Rect; model: Rect; prog: Rect; tools: Rect[]; msg: Rect; port: boolean; short?: boolean }
export function agentLay(S: Frame): AgentLay {
  const u = S.u, A = area(S);
  if (S.portrait) {
    const ctxH = A.h * (tight(S) ? 0.44 : 0.48), gap = 22 * u;
    const ctx = { x: A.x, y: A.y, w: A.w, h: ctxH };
    const y1 = ctx.y + ctxH + gap, aw = 30 * u, bw = Math.min((A.w - aw) / 2, 150 * u), bh = 48 * u;
    const x0 = A.x + (A.w - (2 * bw + aw)) / 2;
    const model = { x: x0, y: y1, w: bw, h: bh }, prog = { x: x0 + bw + aw, y: y1, w: bw, h: bh };
    const y2 = y1 + bh + 22 * u, th = Math.max(40 * u, (FS(S, 12.5) * 2.4 + 8) * u), tw = (A.w - 8 * u) / 2;
    const tools = [{ x: A.x, y: y2, w: tw, h: th }, { x: A.x + tw + 8 * u, y: y2, w: tw, h: th }];
    const my = y2 + th + 10 * u;
    return { A, ctx, model, prog, tools, msg: { x: A.x, y: my, w: A.w, h: Math.max(30 * u, A.y + A.h - my) }, port: true };
  }
  const ctxW = clamp(A.w * 0.4, 220 * u, 410 * u), ctx = { x: A.x, y: A.y, w: ctxW, h: A.h };
  const R = { x: A.x + ctxW + 26 * u, y: A.y, w: A.w - ctxW - 26 * u, h: A.h };
  const aw = clamp(R.w * 0.08, 22 * u, 44 * u), bw = (R.w - 2 * aw) * 0.27, tw = R.w - 2 * aw - 2 * bw;
  const short = R.h < 230 * u;
  const bh = clamp(R.h * 0.22, 46 * u, 84 * u), th = Math.max((FS(S, 13) * 2.5 + 8) * u, bh * 0.6), toolsH = 2 * th + 8 * u;
  const rowH = Math.max(bh, toolsH);
  // la fila baja lo suficiente para que, por encima, pase la flecha de la descripción y quepan los rótulos del bucle
  const ry = short ? R.y + 24 * u : Math.max(R.y + 36 * u, ctxRowY(S, ctx, 1) + 22 * u);
  const model = { x: R.x, y: ry + (rowH - bh) / 2, w: bw, h: bh };
  const prog = { x: R.x + bw + aw, y: ry + (rowH - bh) / 2, w: bw, h: bh };
  const tx = R.x + 2 * bw + 2 * aw, ty = ry + (rowH - toolsH) / 2;
  const tools = [{ x: tx, y: ty, w: tw, h: th }, { x: tx, y: ty + th + 8 * u, w: tw, h: th }];
  const my = ry + rowH + (short ? 12 : 24) * u;
  return { A, ctx, model, prog, tools, msg: { x: R.x, y: my, w: R.w, h: Math.max(30 * u, Math.min(80 * u, R.y + R.h - my - 24 * u)) }, port: false, short };
}

// ── geometría del contexto ──────────────────────────────────────────────────────────────────────────
export function ctxGeom(S: Frame, R: Rect) {
  const { d } = S, u = S.u, head = (FS(S, 13) + 8) * u;
  const inner = { x: R.x + 6 * u, y: R.y + head + 4 * u, w: R.w - 12 * u, h: R.h - head - 10 * u };
  const raw = tight(S) ? 12 : 13, size = FS(S, raw), gap = 3 * u, minH = size * u + 9 * u;
  const total = MSGS.length;
  const cap = Math.max(4, Math.floor((inner.h + gap) / (minH + gap)));
  const twoOK = !tight(S) && (inner.h + gap) / total - gap >= size * u * 2.4 + 6 * u && inner.w < 520 * u;
  const ch = Math.min(twoOK ? size * u * 2.4 + 6 * u : 34 * u, (inner.h + gap) / Math.min(total, cap) - gap);
  const tagW = Math.min(inner.w * 0.3, Math.max(...MSGS.map((m) => d.measure(roleName(S, m.role), { size: FS(S, 12), weight: 800 }))) + 10 * u);
  return { head, inner, raw, size, gap, cap, twoOK, ch, tagW };
}
/** Centro vertical de la fila i del contexto. */
const ctxRowY = (S: Frame, R: Rect, i: number) => { const g = ctxGeom(S, R); return g.inner.y + i * (g.ch + g.gap) + g.ch / 2; };

// ── cuándo entra cada mensaje al contexto ───────────────────────────────────────────────────────────
function msgIn(S: Frame, id: string): number {
  switch (id) {
    case 'sys': return fr(S, 'tool-desc', 0.1, 0.25);
    case 'tools': return fr(S, 'tool-desc', 0.35, 0.5);
    case 'user': return Math.max(fr(S, 'tool-desc', 0.8, 0.95), 0);
    case 'call1': return fr(S, 'paste', 0.08, 0.22);
    case 'res1': return fr(S, 'paste', 0.28, 0.42);
    case 'call2': return fr(S, 'second-result', 0.05, 0.18);
    case 'res2': return fr(S, 'second-result', 0.3, 0.44);
    case 'answer': return fr(S, 'second-result', 0.62, 0.76);
  }
  return 0;
}
function msgHot(S: Frame, id: string): number {
  switch (id) {
    case 'tools': return hold(S, 'tool-desc', 'call', 0.4, 0.55);
    case 'user': return fr(S, 'call', 0.02, 0.15) * (1 - fr(S, 'call', 0.4, 0.55));
    case 'res1': return Math.max(fr(S, 'paste', 0.3, 0.45) * (1 - fr(S, 'paste', 0.85, 1)), hold(S, 'observe', 'second-call', 0.02, 0.15));
    case 'res2': return fr(S, 'second-result', 0.32, 0.45) * (1 - fr(S, 'second-result', 0.6, 0.7));
    case 'answer': return fr(S, 'second-result', 0.64, 0.78) * (1 - (S.on('loop') ? fr(S, 'loop', 0, 0.1) : 0));
  }
  return 0;
}

/** Una tarjeta de mensaje del contexto: rótulo del papel a la izquierda, texto a la derecha (una o dos líneas). */
function msgCard(S: Frame, r: Rect, m: Msg, o: { a?: number; hot?: number; tagW: number; size: number; raw: number; two: boolean }) {
  const { d, pal: p } = S, u = S.u, t = tone(S, ROLE_TONE[m.role]);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(m.role === 'sys' ? p.ink : t.c, 0.07 + 0.22 * (o.hot ?? 0)), stroke: m.role === 'sys' ? p.lineStrong : t.c, lw: (o.hot ?? 0) > 0.4 ? 2.4 : 1.2, r: 3 * u, dash: m.role === 'tools' ? [4, 3] : undefined });
    const tagStr = pick(S, [roleName(S, m.role), roleName(S, m.role, true)], o.tagW - 6 * u, 12, 800);
    fitText(S, tagStr, r.x + 5 * u, r.y + r.h / 2 + 0.5, o.tagW - 6 * u, 12, { weight: 800, color: m.role === 'sys' ? p.ink2 : t.ink, base: 'middle' });
    const tx = r.x + o.tagW + 2 * u, tw = r.w - o.tagW - 8 * u;
    if (o.two) {
      const ls = lines(S, txt(S, m), tw, o.size, { weight: 600, font: m.mono ? 'mono' : 'ui', maxLines: 2 });
      const lh = o.size * u * 1.18, y0 = r.y + r.h / 2 - ((ls.length - 1) * lh) / 2;
      ls.forEach((ln, i) => fitText(S, ln, tx, y0 + i * lh + 0.5, tw, o.raw, { weight: 600, font: m.mono ? 'mono' : 'ui', color: p.ink, base: 'middle' }));
    } else fitText(S, txt(S, m), tx, r.y + r.h / 2 + 0.5, tw, o.raw, { weight: 600, font: m.mono ? 'mono' : 'ui', base: 'middle' });
  });
}

/** El contexto: marco y tarjetas. Si no caben todas, se juntan las de en medio en una fila «… y N más». */
function drawCtx(S: Frame, L: AgentLay, frameA: number) {
  const { d, pal: p } = S, u = S.u, R = L.ctx, g = ctxGeom(S, R);
  d.withAlpha(frameA, () => {
    d.rect(R.x, R.y + g.head - 4 * u, R.w, R.h - g.head + 4 * u, { fill: alpha(tone(S, 'lat').c, 0.035), stroke: p.ink2, lw: 1.6, r: 6 * u });
    fitText(S, S.l('contexto: lo que lee el modelo', 'context: what the model reads'), R.x + 2 * u, R.y + g.head - 10 * u, R.w, 13, { weight: 800, color: p.ink, base: 'bottom' });
  });
  const shown = MSGS.map((m) => ({ m, a: msgIn(S, m.id) })).filter((x) => x.a > 0.001);
  if (!shown.length) return;
  const { inner, ch, gap, cap, tagW, size, raw, twoOK } = g;
  // filas a mostrar: las dos primeras, «… N más», y las últimas
  let rows: ({ m: Msg; a: number } | { more: number; a: number })[] = shown;
  if (shown.length > cap) { const tail = cap - 3; rows = [shown[0], shown[1], { more: shown.length - 2 - tail, a: 1 }, ...shown.slice(shown.length - tail)]; }
  rows.forEach((row, i) => {
    const r = { x: inner.x, y: inner.y + i * (ch + gap), w: inner.w, h: ch };
    if ('more' in row) { fitText(S, S.l(`… y ${row.more} mensajes más`, `… and ${row.more} more messages`), r.x + 6 * u, r.y + r.h / 2, r.w, 12, { weight: 700, color: p.mute, base: 'middle' }); return; }
    // al entrar, la tarjeta se desliza un poco desde la derecha
    const k = row.a, dx = (1 - k) * 14 * u;
    msgCard(S, { ...r, x: r.x + dx }, row.m, { a: k, hot: msgHot(S, row.m.id), tagW, size, raw, two: twoOK && ch > size * u * 2.2 });
  });
}

/** Caja de modelo (pesos y candado) o de programa (engranes simplificados: renglones de código). */
function drawBox(S: Frame, r: Rect, kind: 'model' | 'prog', a: number, hot: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, kind === 'model' ? 'w' : 'ink');
  if (a <= 0.01) return;
  d.withAlpha(a, () => {
    card(S, r, { tone: kind === 'model' ? 'w' : undefined, hot: 0.15 + 0.6 * hot, fill: kind === 'prog' ? alpha(p.ink, 0.04 + 0.16 * hot) : undefined });
    const lab = kind === 'model' ? S.l('modelo', 'model') : S.l('programa', 'program');
    fitText(S, lab, r.x + r.w / 2, r.y + 6 * u, r.w - 10 * u, 14, { weight: 800, align: 'center', base: 'top', color: kind === 'model' ? t.ink : p.ink });
    const top = r.y + 6 * u + FS(S, 14) * u + 4 * u, room = r.y + r.h - top - 5 * u;
    if (room < 10 * u) return;
    const sub = kind === 'model' ? S.l('solo escribe texto', 'only writes text') : S.l('ejecuta y pega', 'runs and pastes');
    const sz = FS(S, 12), ls = lines(S, sub, r.w - 10 * u, sz, { weight: 600 });
    if (ls.length === 1 || room < sz * u * 2.5) { if (room >= sz * u + 2) fitText(S, sub, r.x + r.w / 2, top, r.w - 10 * u, 12, { weight: 600, align: 'center', base: 'top', color: p.ink2 }); }
    else para(S, sub, r.x + 5 * u, top, r.w - 10 * u, sz, { weight: 600, align: 'center', color: p.ink2, maxLines: 2, lh: 1.15 });
  });
}

function drawTool(S: Frame, r: Rect, i: number, a: number, hot: number, kindA: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, 'dat'), T = TOOLS[i];
  if (a <= 0.01) return;
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.3 * hot), stroke: t.c, lw: hot > 0.4 ? 2.6 : 1.5, r: 4 * u });
    const nm = T.name[S.lang], ar = T.args[S.lang];
    const k = T.kind[S.lang], kw = d.measure(k, { size: FS(S, 12), weight: 700 }) + 14 * u;
    fitText(S, nm, r.x + 7 * u, r.y + r.h * 0.3, r.w - 14 * u, 13, { weight: 800, font: 'mono', color: t.ink, base: 'middle' });
    fitText(S, ar, r.x + 7 * u, r.y + r.h * 0.72, r.w - 14 * u - (kindA > 0.01 ? kw + 4 * u : 0), 12, { weight: 600, font: 'mono', color: p.ink2, base: 'middle' });
    if (kindA > 0.01) chip(S, k, r.x + r.w - 5 * u, r.y + r.h * 0.72, i === 1 ? 'err' : 'dat', { align: 'right', size: 12, a: kindA });
  });
}

// ── la línea de «lo que pasa ahora» ─────────────────────────────────────────────────────────────────
interface Line { label: string; text: string; mono?: boolean; tone: 'lat' | 'dat' | 'w' | 'ink'; a: number; tag?: string; tagA?: number }
function msgLines(S: Frame): Line[] {
  const out: Line[] = [];
  const writes = S.l('el modelo escribe:', 'the model writes:'), gives = S.l('la herramienta devuelve:', 'the tool returns:'), thinks = S.l('el modelo piensa:', 'the model thinks:');
  // 0 · qué es una herramienta (tool-def, tool-two)
  const a0 = fr(S, 'tool-def', 0.45, 0.6) * (1 - (S.on('tool-two') ? fr(S, 'tool-two', 0.05, 0.15) : 0));
  if (a0 > 0.01) out.push({ label: S.l('una herramienta:', 'a tool:'), text: S.l('nombre(datos que recibe) → resultado', 'name(data it takes) → result'), mono: true, tone: 'dat', a: a0 });
  const a0b = (S.on('tool-two') ? fr(S, 'tool-two', 0.12, 0.25) : 0) * (1 - (S.on('tool-desc') ? fr(S, 'tool-desc', 0, 0.12) : 0));
  if (a0b > 0.01) out.push({ label: S.l('ejemplo:', 'example:'), text: S.l('buscar_funciones(fecha="hoy") → la cartelera de hoy', 'find_showtimes(date="today") → today’s listings'), mono: true, tone: 'dat', a: a0b });
  // 1 · la primera llamada (call … program)
  const a1 = fr(S, 'call', 0.42, 0.58) * (1 - (S.on('result') ? fr(S, 'result', 0, 0.12) : 0));
  if (a1 > 0.01) out.push({ label: writes, text: txt(S, msg('call1')), mono: true, tone: 'lat', a: a1, tag: S.l('llamada a función', 'function call'), tagA: hold(S, 'call-name', 'result', 0.05, 0.2) });
  // 2 · el resultado (result … paste)
  const a2 = (S.on('result') ? fr(S, 'result', 0.18, 0.32) : 0) * (1 - (S.on('paste') ? fr(S, 'paste', 0.3, 0.42) : 0));
  if (a2 > 0.01) out.push({ label: gives, text: txt(S, msg('res1')), tone: 'dat', a: a2 });
  // 3 · el modelo cambia de plan (observe)
  const a3 = hold(S, 'observe', 'second-call', 0.25, 0.4);
  if (a3 > 0.01) out.push({ label: thinks, text: S.l('20:00 agotada → mejor 21:30', '8:00 pm sold out → 9:30 pm instead'), tone: 'w', a: a3 });
  // 4 · la cuenta y la segunda llamada (second-call)
  const a4 = (S.on('second-call') ? fr(S, 'second-call', 0.05, 0.2) : 0) * (1 - (S.on('second-result') ? fr(S, 'second-result', 0, 0.1) : 0)) * (1 - fr(S, 'second-call', 0.55, 0.65));
  if (a4 > 0.01) out.push({ label: thinks, text: S.l('2 × 95 = 190 pesos · menos de 300', '2 × 95 = 190 pesos · under 300'), tone: 'w', a: a4 });
  const a5 = fr(S, 'second-call', 0.6, 0.72) * (1 - (S.on('second-result') ? fr(S, 'second-result', 0.05, 0.15) : 0));
  if (a5 > 0.01) out.push({ label: writes, text: txt(S, msg('call2')), mono: true, tone: 'lat', a: a5 });
  // 5 · el segundo resultado y la respuesta (second-result)
  const a6 = (S.on('second-result') ? fr(S, 'second-result', 0.15, 0.25) : 0) * (1 - fr(S, 'second-result', 0.34, 0.44));
  if (a6 > 0.01) out.push({ label: gives, text: txt(S, msg('res2')), tone: 'dat', a: a6 });
  const a7 = fr(S, 'second-result', 0.62, 0.74) * (1 - (S.on('loop') ? fr(S, 'loop', 0, 0.1) : 0));
  if (a7 > 0.01) out.push({ label: S.l('el modelo responde:', 'the model answers:'), text: txt(S, msg('answer')), tone: 'lat', a: a7 });
  return out;
}

function drawMsgLine(S: Frame, L: AgentLay) {
  const { d, pal: p } = S, u = S.u, M = L.msg;
  const ls = msgLines(S);
  ls.forEach((ln) => d.withAlpha(ln.a, () => {
    const t = tone(S, ln.tone), size = FS(S, 12.5);
    const tagW = ln.tag && (ln.tagA ?? 0) > 0.01 ? d.measure(ln.tag, { size: FS(S, 12), weight: 700 }) + 14 * u : 0;
    fitText(S, ln.label, M.x, M.y, M.w - tagW - 6 * u, 12, { weight: 700, color: p.mute, base: 'top' });
    if (tagW) chip(S, ln.tag!, M.x + M.w, M.y + FS(S, 12) * u * 0.55, 'lat', { align: 'right', size: 12, a: ln.tagA, solid: true });
    const ty = M.y + FS(S, 12) * u + 7 * u, tw = M.w - 16 * u, maxL = M.h > 60 * u ? 2 : 1;
    const tl = lines(S, ln.text, tw, size, { weight: 700, font: ln.mono ? 'mono' : 'ui', maxLines: maxL });
    const bh = tl.length * size * u * 1.25 + 10 * u;
    d.rect(M.x, ty, M.w, bh, { fill: alpha(t.c, 0.12), stroke: t.c, lw: 1.4, r: 4 * u, dash: [5, 4] });
    tl.forEach((s, i) => d.text(s, M.x + 8 * u, ty + 5 * u + i * size * u * 1.25, { size, weight: 700, font: ln.mono ? 'mono' : 'ui', color: p.ink, base: 'top' }));
  }));
}

// ── flechas del bucle ───────────────────────────────────────────────────────────────────────────────
type Seg = 'read' | 'write' | 'run' | 'back' | 'paste';
function arrowPts(L: AgentLay, k: Seg, toolI: number, S: Frame): [number, number, number, number] {
  const u = S.u, { ctx, model: m, prog: g } = L, tl = L.tools[toolI];
  if (L.port) {
    switch (k) {
      case 'read': return [m.x + m.w / 2, ctx.y + ctx.h + 3 * u, m.x + m.w / 2, m.y - 3 * u];
      case 'write': return [m.x + m.w + 3 * u, m.y + m.h * 0.5, g.x - 3 * u, g.y + g.h * 0.5];
      case 'run': return [g.x + g.w * 0.5 + (toolI === 0 ? -10 : 10) * u, g.y + g.h + 3 * u, tl.x + tl.w / 2, tl.y - 3 * u];
      case 'back': return [tl.x + tl.w / 2 + (toolI === 0 ? 14 : -14) * u, tl.y - 3 * u, g.x + g.w * 0.5 + (toolI === 0 ? 4 : -4) * u, g.y + g.h + 3 * u];
      case 'paste': return [g.x + g.w / 2, g.y - 3 * u, g.x + g.w / 2, ctx.y + ctx.h + 3 * u];
    }
  }
  switch (k) {
    case 'read': return [ctx.x + ctx.w + 3 * u, m.y + m.h * 0.3, m.x - 3 * u, m.y + m.h * 0.3];
    case 'write': return [m.x + m.w + 3 * u, m.y + m.h * 0.5, g.x - 3 * u, g.y + g.h * 0.5];
    case 'run': return [g.x + g.w + 3 * u, g.y + g.h * 0.35, tl.x - 3 * u, tl.y + tl.h * 0.4];
    case 'back': return [tl.x - 3 * u, tl.y + tl.h * 0.68, g.x + g.w + 3 * u, g.y + g.h * 0.7];
    case 'paste': return [g.x + g.w * 0.5, g.y + g.h + 3 * u, ctx.x + ctx.w + 3 * u, g.y + g.h + 3 * u];
  }
}
function drawArrow(S: Frame, L: AgentLay, k: Seg, toolI: number, a: number, hot: number, label?: string) {
  if (a <= 0.01) return;
  const { pal: p } = S, u = S.u, [x1, y1, x2, y2] = arrowPts(L, k, toolI, S);
  const col = hot > 0.4 ? tone(S, k === 'back' || k === 'paste' ? 'dat' : k === 'run' ? 'dat' : 'lat').c : p.lineStrong;
  S.d.withAlpha(a, () => {
    if (k === 'paste' && !L.port) {
      // el programa pega: baja desde el programa y va a la izquierda, al contexto (por debajo de la línea de mensajes)
      const yb = Math.min(L.A.y + L.A.h - 6 * u, L.msg.y + L.msg.h + 10 * u);
      S.d.polyline([[x1, y1], [x1, yb]], col, hot > 0.4 ? 2.6 : 1.8);
      S.d.arrow(x1, yb, x2, yb, col, hot > 0.4 ? 2.6 : 1.8, 8 * Math.max(0.85, u));
      if (label) fitText(S, label, (x1 + x2) / 2, yb - 4 * u, Math.abs(x1 - x2) - 16 * u, 12, { weight: 700, color: hot > 0.4 ? tone(S, 'dat').ink : p.mute, align: 'center', base: 'bottom', halo: true });
      return;
    }
    growArrow(S, x1, y1, x2, y2, 1, col, hot > 0.4 ? 2.6 : 1.8);
    if (label) {
      const horiz = Math.abs(x2 - x1) > Math.abs(y2 - y1);
      if (horiz) fitText(S, label, (x1 + x2) / 2, Math.min(y1, y2) - 4 * u, Math.max(40 * u, Math.abs(x2 - x1) + 30 * u), 12, { weight: 700, color: hot > 0.4 ? p.ink : p.mute, align: 'center', base: 'bottom', halo: true });
      else {
        const room = L.A.x + L.A.w - (x1 + 6 * u), need = S.d.measure(label, { size: FS(S, 12), weight: 700 });
        if (room >= need || room >= 90 * u) fitText(S, label, x1 + 6 * u, (y1 + y2) / 2, room, 12, { weight: 700, color: hot > 0.4 ? p.ink : p.mute, base: 'middle', halo: true });
        else fitText(S, label, x1 - 6 * u, (y1 + y2) / 2, x1 - L.A.x - 6 * u, 12, { weight: 700, color: hot > 0.4 ? p.ink : p.mute, align: 'right', base: 'middle', halo: true });
      }
    }
  });
}

// ── la vista ────────────────────────────────────────────────────────────────────────────────────────
export function drawAgent(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = agentLay(S);
  const toolA = [fr(S, 'tool-def', 0.15, 0.35), fr(S, 'tool-two', 0.3, 0.5)];
  const kindA = [fr(S, 'tool-two', 0.15, 0.3), fr(S, 'tool-two', 0.55, 0.7)];
  const ctxA = fr(S, 'tool-desc', 0, 0.15), modelA = fr(S, 'tool-desc', 0.55, 0.7), progA = fr(S, 'program', 0.05, 0.22);

  // resaltes
  const mHot = Math.max(fr(S, 'call', 0.15, 0.3) * (1 - fr(S, 'call', 0.6, 0.75)), hold(S, 'observe', 'second-result', 0.1, 0.25), fr(S, 'second-result', 0.55, 0.65) * (1 - fr(S, 'second-result', 0.85, 0.95)));
  const gHot = Math.max(hold(S, 'program', 'result', 0.15, 0.3), fr(S, 'paste', 0, 0.1) * (1 - fr(S, 'paste', 0.5, 0.6)), fr(S, 'second-result', 0.02, 0.1) * (1 - fr(S, 'second-result', 0.45, 0.55)));
  const t0Hot = Math.max(hold(S, 'program', 'paste', 0.45, 0.6), fr(S, 'tool-def', 0.3, 0.45) * (1 - fr(S, 'tool-two', 0.2, 0.35)));
  const t1Hot = Math.max(fr(S, 'second-result', 0.1, 0.2) * (1 - fr(S, 'second-result', 0.4, 0.5)), fr(S, 'tool-two', 0.5, 0.65) * (1 - fr(S, 'tool-two', 0.85, 1)));

  // el bucle: en «loop» las flechas se encienden una tras otra, dos vueltas
  const portReact = L.port && S.on('react') ? fr(S, 'react', 0.05, 0.25) : 0;   // en vertical, ReAct ocupa el lugar de los rótulos del bucle
  const loopOn = (S.on('loop') ? fr(S, 'loop', 0.05, 0.15) : 0) * (1 - portReact);
  const lp = S.on('loop') && !S.on('agent') ? (fr(S, 'loop', 0.1, 0.95, 'lin') * 2) % 1 : -1;
  const inLoop = (lo: number, hi: number) => (lp >= lo && lp < hi ? 1 : 0);

  drawCtx(S, L, ctxA);
  drawBox(S, L.model, 'model', modelA, Math.max(mHot, inLoop(0.2, 0.4)));
  drawBox(S, L.prog, 'prog', progA, Math.max(gHot, inLoop(0.4, 0.6), inLoop(0.8, 1)));
  drawTool(S, L.tools[0], 0, toolA[0], Math.max(t0Hot, inLoop(0.6, 0.8)), kindA[0]);
  drawTool(S, L.tools[1], 1, toolA[1], t1Hot, kindA[1]);

  // «solo la descripción» viaja de las herramientas al contexto (tool-desc)
  const descA = hold(S, 'tool-desc', 'call', 0.3, 0.45);
  if (descA > 0.01) {
    const tl = L.tools[0], dat = tone(S, 'dat');
    d.withAlpha(descA, () => {
      // las dos herramientas, resaltadas con el mismo borde punteado que su descripción en el contexto
      L.tools.forEach((r) => d.rect(r.x - 3 * u, r.y - 3 * u, r.w + 6 * u, r.h + 6 * u, { stroke: dat.c, lw: 1.6, r: 5 * u, dash: [4, 3] }));
      const lab = S.l('solo su descripción', 'only its description');
      if (L.short) {
        const b = chip(S, lab, L.msg.x, L.msg.y + chipH(S, 12) / 2 + 2 * u, 'dat', { size: 12, dash: true, maxW: L.msg.w, align: 'left' });
        const cy = ctxRowY(S, L.ctx, 1);
        S.d.arrow(b.x - 2 * u, b.y + b.h / 2, L.ctx.x + L.ctx.w + 3 * u, cy, dat.c, 2, 7);
      } else if (L.port) {
        const gy = (L.ctx.y + L.ctx.h + L.model.y) / 2;
        chip(S, lab, L.A.x + L.A.w / 2, gy + 3 * u, 'dat', { size: 12, dash: true, maxW: L.A.w * 0.8 });
        S.d.arrow(L.A.x + L.A.w / 2, gy - 6 * u, L.A.x + L.A.w / 2, L.ctx.y + L.ctx.h + 2 * u, dat.c, 2, 7);
      } else {
        const x1 = tl.x + tl.w / 2, y1 = tl.y - 5 * u, y2 = ctxRowY(S, L.ctx, 1), x2 = L.ctx.x + L.ctx.w + 3 * u;
        S.d.polyline([[x1, y1], [x1, y2]], dat.c, 2, { dash: [5, 4] });
        S.d.arrow(x1, y2, x2, y2, dat.c, 2, 8);
        chip(S, lab, (x1 + x2) / 2, y2 - 13 * u, 'dat', { size: 12, dash: true, maxW: x1 - x2 });
      }
    });
  }

  // flechas
  const arrA = progA;
  const readHot = Math.max(fr(S, 'call', 0.05, 0.15) * (1 - fr(S, 'call', 0.35, 0.45)), fr(S, 'paste', 0.6, 0.7) * (1 - fr(S, 'paste', 0.9, 1)), hold(S, 'observe', 'second-call', 0, 0.1) * (1 - fr(S, 'observe', 0.5, 0.6)), inLoop(0, 0.2));
  drawArrow(S, L, 'read', 0, Math.max(modelA * fr(S, 'call', 0, 0.12), arrA), readHot);
  // escribir: antes de que exista el programa, una flecha corta del modelo a la línea de mensajes
  const preA = fr(S, 'call', 0.35, 0.5) * (1 - progA);
  if (preA > 0.01) {
    const m = L.model, x = m.x + m.w / 2;
    d.withAlpha(preA, () => growArrow(S, x, m.y + m.h + 3 * u, x, L.msg.y - 3 * u, 1, tone(S, 'lat').c, 2.4));
  }
  drawArrow(S, L, 'write', 0, arrA, Math.max(fr(S, 'program', 0.05, 0.2) * (1 - fr(S, 'program', 0.4, 0.5)), fr(S, 'second-result', 0, 0.06) * (1 - fr(S, 'second-result', 0.12, 0.2)), inLoop(0.2, 0.4)));
  const tI = S.on('second-result') && !S.on('loop') ? 1 : 0;
  drawArrow(S, L, 'run', tI, arrA, Math.max(hold(S, 'program', 'result', 0.35, 0.5), fr(S, 'second-result', 0.08, 0.15) * (1 - fr(S, 'second-result', 0.25, 0.32)), inLoop(0.4, 0.6)));
  drawArrow(S, L, 'back', tI, arrA * Math.max(fr(S, 'result', 0, 0.15), S.on('paste') ? 1 : 0), Math.max(fr(S, 'result', 0.05, 0.2) * (1 - fr(S, 'result', 0.6, 0.75)), fr(S, 'second-result', 0.18, 0.25) * (1 - fr(S, 'second-result', 0.32, 0.4)), inLoop(0.6, 0.8)));
  drawArrow(S, L, 'paste', 0, arrA * Math.max(fr(S, 'paste', 0, 0.1), S.on('observe') ? 1 : 0), Math.max(fr(S, 'paste', 0.05, 0.15) * (1 - fr(S, 'paste', 0.5, 0.6)), fr(S, 'second-result', 0.25, 0.32) * (1 - fr(S, 'second-result', 0.48, 0.55)), inLoop(0.8, 1)), S.l('pega el resultado', 'pastes the result'));

  // la línea de lo que pasa ahora
  drawMsgLine(S, L);

  // el bucle con nombre: pensar, actuar, observar
  if (loopOn > 0.01) {
    const s = 12.5, m = L.model, tl = L.tools[0], ctx = L.ctx;
    d.withAlpha(loopOn, () => {
      if (L.port) {
        const M = L.msg, labs = [S.l('1 · pensar', '1 · think'), S.l('2 · actuar', '2 · act'), S.l('3 · observar', '3 · observe')], tones = ['w', 'dat', 'lat'] as const;
        const on = [inLoop(0.2, 0.4), Math.max(inLoop(0.4, 0.8)), Math.max(inLoop(0.8, 1), inLoop(0, 0.2))];
        const cw = (M.w - 2 * 18 * u) / 3, cy = M.y + chipH(S, s) / 2 + 4 * u;
        labs.forEach((t, i) => {
          const cx = M.x + i * (cw + 18 * u) + cw / 2;
          chip(S, t, cx, cy, tones[i], { size: s, solid: on[i] > 0 || S.on('agent'), maxW: cw });
          if (i < 2) S.d.arrow(cx + cw / 2 + 2 * u, cy, cx + cw / 2 + 16 * u, cy, p.lineStrong, 1.6, 6);
        });
        return;
      }
      chip(S, S.l('1 · pensar', '1 · think'), m.x + m.w / 2, m.y - 12 * u, 'w', { size: s, solid: inLoop(0.2, 0.4) > 0 || S.on('agent'), maxW: m.w + 30 * u });
      chip(S, S.l('2 · actuar', '2 · act'), tl.x + tl.w / 2, tl.y - (L.port ? 0 : 12 * u), 'dat', { size: s, solid: inLoop(0.4, 0.8) > 0 || S.on('agent'), maxW: tl.w });
      const ox = L.port ? ctx.x + ctx.w - 6 * u : ctx.x + ctx.w - 6 * u, oy = L.port ? ctx.y + ctx.h - 2 * u : ctx.y + ctx.h - 6 * u;
      chip(S, S.l('3 · observar', '3 · observe'), ox, oy - chipH(S, s) / 2, 'lat', { size: s, align: 'right', solid: inLoop(0.8, 1) > 0 || inLoop(0, 0.2) > 0 || S.on('agent') });
    });
  }

  // el agente: todo junto
  const agA = S.on('agent') ? fr(S, 'agent', 0.1, 0.3) : 0;
  if (agA > 0.01) {
    const pad = (L.short ? 2 : 5) * u, r = { x: L.A.x - pad, y: L.A.y - pad, w: L.A.w + 2 * pad, h: L.A.h + (L.port ? 1.2 : L.short ? 0 : 2) * pad - (L.short ? 2 * u : 0) };
    d.withAlpha(agA, () => {
      d.rect(r.x, r.y, r.w, r.h, { stroke: tone(S, 'w').c, lw: 2.2, r: 8 * u, dash: [7, 5] });
      const lab = pick(S, [S.l('agente = modelo + herramientas + bucle', 'agent = model + tools + loop'), S.l('agente', 'agent')], L.port ? L.A.w * 0.9 : L.A.w * 0.5, 13, 800);
      if (L.port) chip(S, lab, L.msg.x + L.msg.w / 2, L.msg.y + chipH(S, 12.5) + 8 * u + chipH(S, 13) / 2 + 6 * u, 'w', { size: 13, solid: true, maxW: L.msg.w, a: 1 - portReact });
      else if (L.short) chip(S, lab, r.x + r.w - 8 * u, r.y + r.h - chipH(S, 13) / 2 - 3 * u, 'w', { size: 13, align: 'right', solid: true });
      else chip(S, lab, r.x + r.w - 10 * u, r.y + 1, 'w', { size: 13, align: 'right', solid: true });
    });
  }
  // ReAct
  const reA = S.on('react') ? fr(S, 'react', 0.3, 0.45) : 0;
  if (reA > 0.01) {
    const M = L.msg;
    d.withAlpha(reA, () => {
      fitText(S, S.l('ReAct (Yao y colaboradores, 2022)', 'ReAct (Yao and colleagues, 2022)'), M.x, M.y, M.w, 12.5, { weight: 800, base: 'top' });
      para(S, S.l('razonar → actuar → observar → razonar…', 'reason → act → observe → reason…'), M.x, M.y + FS(S, 12.5) * u + 6 * u, M.w, FS(S, 13), { weight: 700, color: tone(S, 'w').ink, maxLines: 2 });
    });
  }
  void p; void lock;
}
