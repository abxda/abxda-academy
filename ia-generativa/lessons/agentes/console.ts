// Acto 2 · la consola de un agente en vivo. Las herramientas son reales (agent.ts); el «modelo» es un guion.
// Hay dos fuentes para la misma vista: la narración (una corrida precalculada, función pura del tiempo) y el turno
// «Tu turno» (una corrida que avanza con update y responde a los controles). Ambas dibujan con drawConsole.
import { alpha, clamp, inset, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ITEMS, correctTotal, money, newRun, orderId, resolve, runAll, stepRun, toolName, type Lang, type Obs, type Run, type Scenario, type ToolId, type Turn, type Verdict } from './agent';
import { FS, T, frame, glyph, lineH, pill, smooth, typed, wrapLines } from './ui';

// ── tiempos de cada turno (segundos desde que empieza) ─────────────────────
const SLOW = { think: [0, 0.8], act: [0.9, 1.4], obs: [1.8, 2.3] } as const;
const FAST = { think: [0, 0.45], act: [0.5, 0.85], obs: [1.0, 1.4] } as const;
export const STEP_GAP = 1.7;

export interface TurnView { turn: Turn; t: number }
export interface ConView {
  fast: boolean; taskT: number; turns: TurnView[]; run: Run | null; orders: number;
  limit: number | null; verdict: Verdict | null; counts: boolean; world: boolean; pending: boolean;
}

/** Corrida de la narración: escenario normal, límite de 500. Precalculada una vez. */
export const NARR = runAll('normal', 500);

// ── estado del turno «Tu turno» ────────────────────────────────────────────
export interface CS { run: Run; scn: Scenario; auto: boolean; acc: number; clock: number; starts: number[]; seen: { blind: boolean; decided: boolean }; handled: boolean }
export const limitOf = (v: number) => (v >= 3000 ? Infinity : v);
export const csOf = (S: Frame): CS => (S.st.cs ??= fresh(S));
function fresh(S: Frame): CS {
  const scn = (S.p.scenario ?? 'slip') as Scenario;
  return { run: newRun(scn, limitOf(S.p.limit ?? 3000)), scn, auto: false, acc: 0, clock: 0, starts: [], seen: { blind: false, decided: false }, handled: false };
}
function restart(S: Frame, cs: CS, auto: boolean) {
  cs.scn = (S.p.scenario ?? 'slip') as Scenario;
  cs.run = newRun(cs.scn, limitOf(S.p.limit ?? 3000)); cs.starts = []; cs.clock = 0; cs.acc = STEP_GAP - 0.5; cs.auto = auto; cs.handled = false;
}

export function conAction(S: Frame, id: string) {
  const cs = csOf(S);
  if (id === 'run') restart(S, cs, true);
  else if (id === 'approve' || id === 'reject') {
    if (cs.run.status === 'awaiting') { resolve(cs.run, id === 'approve'); cs.starts[cs.run.turns.length - 1] = cs.clock - 0.35; cs.auto = true; cs.acc = STEP_GAP - 0.9; }
  }
}

/** Avanza el turno «Tu turno»; devuelve true cuando ya viste el error sin freno y decidiste con límite (la escena completa el gate). */
export function conUpdate(S: Frame): boolean {
  const cs = csOf(S), dt = S.dt;
  if (((S.p.scenario ?? 'slip') as Scenario) !== cs.scn) restart(S, cs, false);
  if (cs.run.status === 'running') cs.run.limit = limitOf(S.p.limit ?? 3000);
  cs.clock += dt;
  if (cs.auto && cs.run.status === 'running') {
    cs.acc += dt;
    if (cs.acc >= STEP_GAP) { cs.acc = 0; const t = stepRun(cs.run); if (t) cs.starts.push(cs.clock); }
  }
  if (cs.run.status === 'awaiting') cs.auto = false;
  if (cs.run.status === 'done' && !cs.handled) {
    cs.handled = true; cs.auto = false;
    if (cs.run.verdict === 'wrong-auto') cs.seen.blind = true;
    if (cs.run.decision) cs.seen.decided = true;
  }
  return cs.seen.blind && cs.seen.decided;
}

/** Vista del turno interactivo. */
export function viewOfState(S: Frame): ConView {
  const cs = S.st.cs as CS | undefined;
  if (!cs) return { fast: true, taskT: 99, turns: [], run: null, orders: 0, limit: limitOf(S.p.limit ?? 3000), verdict: null, counts: false, world: true, pending: false };
  const turns = cs.run.turns.map((turn, i) => ({ turn, t: cs.clock - (cs.starts[i] ?? cs.clock) }));
  return mk(cs.run, turns, true, 99, limitOf(S.p.limit ?? 3000), cs.run.status === 'done' ? cs.run.verdict ?? null : null, cs.run.turns.length > 0, true);
}

/** Vista de la narración: la corrida normal revelada al ritmo de los segmentos. */
export function viewOfNarration(S: Frame): ConView {
  const at: [string, number][] = [['run-look', 0.3], ['run-slip', 0.3], ['run-slip', 3.4], ['run-calc', 0.3], ['run-calc', 3.4], ['run-order', 0.3], ['run-done', 0.3]];
  const turns: TurnView[] = [];
  at.forEach(([seg, off], i) => { if (S.on(seg)) { const t = S.t - (S.start(seg) + off); if (t >= 0) turns.push({ turn: NARR.turns[i], t }); } });
  const taskT = S.on('task') ? S.since('task') : -1;
  return mk(NARR, turns, false, taskT, S.on('perm') ? 500 : null, null, S.on('run-done'), S.on('demo-intro'));
}

function mk(run: Run, turns: TurnView[], fast: boolean, taskT: number, limit: number | null, verdict: Verdict | null, counts: boolean, world: boolean): ConView {
  const tm = fast ? FAST : SLOW;
  const orders = turns.filter((tv) => tv.turn.call?.tool === 'order' && tv.turn.obs?.ok && tv.t >= tm.obs[0]).length;
  return { fast, taskT, turns, run, orders, limit, verdict, counts, world, pending: run.status === 'awaiting' };
}

// ── geometría ──────────────────────────────────────────────────────────────
interface Lay { all: Rect; chips: Rect[]; ledger: Rect; loop: Rect | null; strip: Rect | null; right: Rect | null; bar: Rect | null }
function lay(S: Frame): Lay {
  const u = S.u, all = inset(S.full(), 14 * u), ch = 24 * u;
  if (S.portrait) {
    const cw = (all.w - 6 * u) / 2, chips = [0, 1, 2, 3].map((i) => ({ x: all.x + (i % 2) * (cw + 6 * u), y: all.y + Math.floor(i / 2) * (ch + 5 * u), w: cw, h: ch }));
    const strip: Rect = { x: all.x, y: chips[3].y + ch + 8 * u, w: all.w, h: 28 * u };
    const barH = 66 * u, bar: Rect = { x: all.x, y: all.y + all.h - barH, w: all.w, h: barH };
    const ledger: Rect = { x: all.x, y: strip.y + strip.h + 8 * u, w: all.w, h: bar.y - 8 * u - (strip.y + strip.h + 8 * u) };
    return { all, chips, ledger, loop: null, strip, right: null, bar };
  }
  const lw = all.w * 0.58, gap = 16 * u;
  const cw = (lw - 3 * 6 * u) / 4, chips = [0, 1, 2, 3].map((i) => ({ x: all.x + i * (cw + 6 * u), y: all.y, w: cw, h: ch }));
  const ledger: Rect = { x: all.x, y: all.y + ch + 8 * u, w: lw, h: all.h - ch - 8 * u };
  const right: Rect = { x: all.x + lw + gap, y: all.y, w: all.w - lw - gap, h: all.h };
  const tall = S.H >= 400;
  return { all, chips, ledger, loop: tall ? { x: right.x, y: right.y, w: right.w, h: 112 * u } : null, strip: tall ? null : { x: right.x, y: right.y, w: right.w, h: 30 * u }, right, bar: null };
}

// ── dibujo ─────────────────────────────────────────────────────────────────
const TOOLS: ToolId[] = ['inventory', 'price', 'calc', 'order'];
let hit: { approve: Rect; reject: Rect } | null = null;
export const approvalHit = () => hit;

export function drawConsole(S: Frame, v: ConView) {
  const { d, pal: p } = S, u = S.u, L = lay(S), tm = v.fast ? FAST : SLOW;
  hit = null;
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), sig = tone(S, 'sig'), w = tone(S, 'w');
  const last = v.turns[v.turns.length - 1];
  const activeTool = last?.turn.call && last.t < tm.obs[1] + 0.4 ? last.turn.call.tool : null;
  const phase: 'think' | 'act' | 'observe' | null = !last ? null : last.t < tm.act[0] ? 'think' : last.t < tm.obs[0] ? 'act' : last.t < tm.obs[1] + 0.9 ? 'observe' : null;

  // fichas de las herramientas
  L.chips.forEach((r, i) => {
    const tool = TOOLS[i], irr = tool === 'order', on = activeTool === tool;
    d.withAlpha(S.on('demo-intro') ? S.reveal('demo-intro', 0.2 + i * 0.12, 0.4) : 1, () => {
      frame(S, r, { tone: irr ? 'w' : 'dat', dash: irr ? [5, 3] : undefined, fill: on ? 0.34 : 0.07 });
      T(S, `${toolName(tool, S.lang)}()`, r.x + r.w / 2, r.y + r.h / 2, { size: 12, weight: 800, font: 'mono', color: irr ? w.ink : dat.ink, align: 'center', base: 'middle' });
    });
  });

  // el ciclo
  const loopA = S.on('demo-intro') ? S.reveal('demo-intro', 0.5, 0.5) : 1;
  if (L.strip) d.withAlpha(loopA, () => drawStrip(S, L.strip!, phase));
  if (L.loop) d.withAlpha(loopA, () => drawCycle(S, L.loop!, phase));

  // el libro de cuentas (contexto del modelo)
  d.withAlpha(loopA, () => drawLedger(S, L.ledger, v));

  // el mundo: inventario y pedidos, límite, cuentas y veredicto
  if (L.right) drawRight(S, L.right, L.loop ? L.loop.h + 8 * u : L.strip!.h + 8 * u, v, loopA);
  if (L.bar) drawBar(S, L.bar, v, loopA);
  void lat; void sig; void alpha; void lerp; void clamp; void orderId; void money; void ITEMS; void correctTotal;
}

function drawStrip(S: Frame, r: Rect, phase: string | null) {
  const { d, pal: p } = S, u = S.u;
  const names: [string, Tone, string][] = [[S.l('observar', 'observe'), 'sig', 'observe'], [S.l('pensar', 'think'), 'lat', 'think'], [S.l('actuar', 'act'), 'dat', 'act']];
  const wn = Math.min(92 * u, (r.w - 40 * u) / 3), gap = (r.w - 3 * wn) / 2, cy = r.y + 11 * u;
  const xs = names.map((_, i) => r.x + i * (wn + gap));
  names.forEach(([lab, t, key], i) => {
    const tc = tone(S, t), on = phase === key, rr: Rect = { x: xs[i], y: cy - 11 * u, w: wn, h: 22 * u };
    d.rect(rr.x, rr.y, rr.w, rr.h, { fill: alpha(tc.c, on ? 0.38 : 0.1), stroke: tc.c, lw: on ? 2.5 : 1.5, r: 3 });
    T(S, lab, rr.x + rr.w / 2, cy, { size: 12, weight: 800, color: tc.ink, align: 'center', base: 'middle' });
    if (i < 2) d.arrow(rr.x + wn + 2 * u, cy, xs[i + 1] - 2 * u, cy, p.ink2, 1.5, 6);
  });
  // vuelta: actuar → observar por debajo
  const yb = cy + 18 * u;
  d.polyline([[xs[2] + wn / 2, cy + 11 * u], [xs[2] + wn / 2, yb], [xs[0] + wn / 2, yb], [xs[0] + wn / 2, cy + 12 * u]], p.ink2, 1.5, { dash: [4, 4] });
  d.arrow(xs[0] + wn / 2, yb - 3 * u, xs[0] + wn / 2, cy + 11 * u, p.ink2, 1.5, 6);
}

function drawCycle(S: Frame, r: Rect, phase: string | null) {
  const { d, pal: p } = S, u = S.u, cx = r.x + r.w / 2, wn = 86 * u, hn = 24 * u;
  const pos: Record<string, [number, number]> = { observe: [cx - 78 * u, r.y + r.h - 22 * u], think: [cx, r.y + 18 * u], act: [cx + 78 * u, r.y + r.h - 22 * u] };
  const def: [string, string, Tone][] = [['observe', S.l('observar', 'observe'), 'sig'], ['think', S.l('pensar', 'think'), 'lat'], ['act', S.l('actuar', 'act'), 'dat']];
  const edge = (a: string, b: string) => {
    const A = pos[a], B = pos[b], ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    const off = (n: [number, number]) => [Math.cos(ang) * (wn / 2 + 4 * u), Math.sin(ang) * (hn / 2 + 5 * u)];
    const o1 = off(A);
    const horiz = Math.abs(B[1] - A[1]) < 2;
    const sx = horiz ? A[0] + Math.sign(B[0] - A[0]) * (wn / 2 + 4 * u) : A[0] + o1[0] * 0.55, sy = horiz ? A[1] : A[1] + o1[1];
    const ex = horiz ? B[0] - Math.sign(B[0] - A[0]) * (wn / 2 + 4 * u) : B[0] - o1[0] * 0.55, ey = horiz ? B[1] : B[1] - o1[1];
    d.arrow(sx, sy, ex, ey, p.ink2, 1.8, 7);
  };
  edge('observe', 'think'); edge('think', 'act'); edge('act', 'observe');
  def.forEach(([key, lab, t]) => {
    const tc = tone(S, t), [x, y] = pos[key], on = phase === key;
    d.rect(x - wn / 2, y - hn / 2, wn, hn, { fill: alpha(tc.c, on ? 0.4 : 0.1), stroke: tc.c, lw: on ? 2.8 : 1.5, r: 3 });
    T(S, lab, x, y, { size: 13, weight: 800, color: tc.ink, align: 'center', base: 'middle' });
  });
  T(S, S.l('el bucle', 'the loop'), cx, r.y + r.h / 2 + 2 * u, { size: 12, weight: 700, color: p.mute, align: 'center', base: 'middle' });
}

// ── el libro de cuentas ────────────────────────────────────────────────────
function drawLedger(S: Frame, r: Rect, v: ConView) {
  const { d, pal: p } = S, u = S.u, tm = v.fast ? FAST : SLOW;
  const lat = tone(S, 'lat'), dat = tone(S, 'dat'), sig = tone(S, 'sig'), err = tone(S, 'err'), w = tone(S, 'w');
  d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 3 });
  T(S, S.l('contexto del modelo', 'model context'), r.x + 8 * u, r.y + 5 * u, { size: 12, weight: 800, color: lat.ink });
  T(S, S.l('«modelo» = guion', '“model” = script'), r.x + r.w - 8 * u, r.y + 5 * u, { size: 12, weight: 600, color: p.mute, align: 'right' });
  const inner: Rect = { x: r.x + 8 * u, y: r.y + 24 * u, w: r.w - 16 * u, h: r.h - 30 * u };
  const lh = lineH(S, 12.5), idxW = 18 * u;
  const labs = [S.l('pensar', 'think'), S.l('actuar', 'act'), S.l('observar', 'observe'), S.l('respuesta', 'answer'), S.l('tarea', 'task')];
  const labW = Math.max(...labs.map((s) => d.measure(s, { size: FS(S, 12), weight: 800 }))) + 8 * u;
  const tx = inner.x + idxW + labW, tw = inner.x + inner.w - tx;
  const wrapT = (s: string, mono = false) => wrapLines(S, s, tw, 12.5, 600, mono ? 'mono' : 'ui');

  type Row = { h: number; draw: (y: number) => void };
  const rows: Row[] = [];
  // tarea
  if (v.taskT >= 0) {
    const task = S.l('Repón las piezas con poco inventario y haz el pedido al proveedor.', 'Restock the parts that are running low and place the order with the supplier.');
    const ls = wrapT(task), h = ls.length * lh + 6 * u, a = smooth(v.taskT / 0.5);
    rows.push({ h, draw: (y) => { d.withAlpha(a, () => { T(S, S.l('tarea', 'task'), inner.x + idxW, y, { size: 12, weight: 800, color: p.mute }); typed(S, ls, tx, y, v.taskT / 1.4, { size: 12.5, weight: 600 }); }); } });
  }
  // turnos
  v.turns.forEach((tv, i) => {
    const t = tv.turn, isLast = i === v.turns.length - 1;
    const cmp = isLast ? 0 : smooth((v.turns[i + 1].t) / 0.45);
    const ok = t.obs ? t.obs.ok : true;
    const thinkL = wrapT(t.think[S.lang]), actL = t.call ? wrapT(t.call[S.lang], true) : [];
    const wrapO = (s: string) => wrapLines(S, s, tw - 14 * u, 12.5, 600);
    const obsL = t.obs ? wrapO(t.obs[S.lang]) : t.wait ? wrapO(S.l('esperando tu decisión', 'waiting for your decision')) : [];
    const finL = t.final ? wrapT(t.final[S.lang]) : [];
    const expH = (thinkL.length + actL.length + obsL.length + finL.length) * lh + 8 * u, cmpH = lh + 4 * u;
    const h = lerp(expH, cmpH, cmp);
    rows.push({
      h,
      draw: (y) => {
        d.clip(inner.x, y, inner.w, Math.max(0, h), () => {
          // índice del turno
          const ir = 7 * u, ix = inner.x + idxW / 2 - 1 * u, iy = y + lh / 2 - 1 * u;
          d.circle(ix, iy, ir, { fill: p.surface2, stroke: p.lineStrong, lw: 1 });
          T(S, String(i + 1), ix, iy, { size: 12, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'middle', a: 1 });
          if (cmp < 1) d.withAlpha(1 - cmp, () => {
            let yy = y;
            const kThink = clamp((t.think ? v.turns[i].t : 0) / (tm.think[1] - tm.think[0] + 1e-6));
            T(S, S.l('pensar', 'think'), inner.x + idxW, yy, { size: 12, weight: 800, color: lat.ink });
            typed(S, thinkL, tx, yy, isLast ? kThink : 1, { size: 12.5, weight: 600 });
            yy += thinkL.length * lh;
            if (t.call) {
              const ka = clamp((tv.t - tm.act[0]) / (tm.act[1] - tm.act[0]));
              if (ka > 0 || !isLast) {
                T(S, S.l('actuar', 'act'), inner.x + idxW, yy, { size: 12, weight: 800, color: dat.ink, a: isLast ? ka : 1 });
                typed(S, actL, tx, yy, isLast ? ka : 1, { size: 12.5, weight: 700, font: 'mono', color: dat.ink });
              }
              yy += actL.length * lh;
            }
            if (t.obs || t.wait) {
              const ko = isLast ? smooth((tv.t - tm.obs[0]) / (tm.obs[1] - tm.obs[0])) : 1;
              if (ko > 0 || t.wait) {
                const tc = t.wait ? w : ok ? sig : err;
                d.withAlpha(t.wait ? clamp((tv.t - tm.act[1]) / 0.4) : ko, () => {
                  T(S, S.l('observar', 'observe'), inner.x + idxW, yy, { size: 12, weight: 800, color: tc.ink });
                  if (t.wait) glyph(S, 'person', tx + 5 * u, yy + lh * 0.5, 14 * u, w.c);
                  else glyph(S, ok ? 'check' : 'cross', tx + 5 * u, yy + lh * 0.5, 11 * u, tc.c);
                  obsL.forEach((ln, k) => T(S, ln, tx + 14 * u, yy + k * lh, { size: 12.5, weight: 600, color: t.wait ? w.ink : ok ? p.ink : err.ink }));
                });
              }
              yy += obsL.length * lh;
            }
            if (t.final) {
              const kf = clamp((tv.t - tm.act[0]) / 0.9);
              d.withAlpha(clamp((tv.t - tm.act[0]) / 0.3), () => {
                T(S, S.l('respuesta', 'answer'), inner.x + idxW, yy, { size: 12, weight: 800 });
                typed(S, finL, tx, yy, kf, { size: 12.5, weight: 700 });
              });
            }
          });
          if (cmp > 0) d.withAlpha(cmp, () => {
            const tc = t.final ? tone(S, 'ink') : ok ? dat : err;
            glyph(S, t.final ? 'play' : ok ? 'check' : 'cross', inner.x + idxW + 6 * u, y + lh / 2 - 1 * u, 10 * u, t.final ? p.ink : tc.c);
            T(S, t.short[S.lang], tx - 2 * u, y, { size: 12.5, weight: 600, color: ok ? p.ink2 : err.ink });
          });
        });
      },
    });
  });
  // tarjeta de aprobación
  if (v.pending && v.run?.pending) {
    const pd = v.run.pending, cardW = inner.w;
    const items = pd.lines.map((ln) => { const it = ITEMS.find((i) => i.sku === ln.sku)!; return { head: `${ln.qty} × ${ln.sku} = ${money(ln.qty * ln.unit, S.lang)}`, sub: S.l(`hay ${v.run!.world.stock[ln.sku]} · objetivo ${it.target}`, `have ${v.run!.world.stock[ln.sku]} · target ${it.target}`) }; });
    const lim = v.limit === null || v.limit === Infinity ? '' : v.limit <= 0 ? S.l('Tu límite exige aprobar todo pedido.', 'Your limit requires approving every order.') : S.l(`Supera tu límite de ${money(v.limit, S.lang)}.`, `It exceeds your limit of ${money(v.limit, S.lang)}.`);
    const limL = wrapLines(S, lim, cardW - 16 * u, 12.5, 600);
    const itemH = items.length * lh * 2;
    const h = lh * 1.2 + itemH + lh * 1.2 + limL.length * lh + 36 * u + 8 * u;
    rows.push({
      h: h + 6 * u,
      draw: (y) => {
        d.rect(inner.x, y, cardW, h, { fill: alpha(w.c, 0.1), stroke: w.c, lw: 2, r: 3 });
        let yy = y + 6 * u;
        T(S, S.l('El agente pide aprobar este pedido', 'The agent asks you to approve this order'), inner.x + 8 * u, yy, { size: 12.5, weight: 800, color: w.ink }); yy += lh * 1.2;
        items.forEach((it) => { T(S, it.head, inner.x + 8 * u, yy, { size: 12.5, weight: 800, font: 'mono' }); T(S, it.sub, inner.x + 8 * u, yy + lh, { size: 12, weight: 600, color: p.ink2 }); yy += lh * 2; });
        T(S, `${S.l('Total', 'Total')} ${money(pd.total, S.lang)}`, inner.x + 8 * u, yy, { size: 13, weight: 800, font: 'mono' }); yy += lh * 1.2;
        limL.forEach((ln, k) => T(S, ln, inner.x + 8 * u, yy + k * lh, { size: 12.5, weight: 600, color: w.ink })); yy += limL.length * lh + 4 * u;
        const bw = Math.min(120 * u, (cardW - 24 * u) / 2), bh = 30 * u;
        const ra: Rect = { x: inner.x + 8 * u, y: yy, w: bw, h: bh }, rr: Rect = { x: inner.x + 16 * u + bw, y: yy, w: bw, h: bh };
        [[ra, S.l('Aprobar', 'Approve'), dat, 'check'], [rr, S.l('Rechazar', 'Reject'), err, 'cross']].forEach(([rc, lab, tc, g]) => {
          const R = rc as Rect, C = tc as ReturnType<typeof tone>;
          d.rect(R.x, R.y, R.w, R.h, { fill: alpha(C.c, 0.16), stroke: C.c, lw: 2, r: 3 });
          glyph(S, g as 'check' | 'cross', R.x + 16 * u, R.y + R.h / 2, 12 * u, C.c);
          T(S, lab as string, R.x + R.w / 2 + 8 * u, R.y + R.h / 2, { size: 13, weight: 800, color: C.ink, align: 'center', base: 'middle' });
        });
        // coordenadas absolutas del lienzo para el puntero (se ajustan con el desplazamiento al dibujar)
        hit = { approve: { ...ra, y: ra.y }, reject: { ...rr, y: rr.y } };
      },
    });
  }
  // desplazamiento: lo más nuevo siempre visible
  const total = rows.reduce((a, rw) => a + rw.h, 0), off = Math.max(0, total - inner.h);
  d.clip(inner.x, inner.y, inner.w, inner.h, () => {
    let y = inner.y - off;
    rows.forEach((rw) => { rw.draw(y); y += rw.h; });
  });
  // el puntero recibe las coordenadas finales
  if (hit) { /* ya están en coordenadas absolutas del lienzo */ }
}

// ── columna derecha (escritorio y teléfono horizontal) ─────────────────────
function drawRight(S: Frame, r: Rect, top: number, v: ConView, a0: number) {
  const { d, pal: p } = S, u = S.u, lh = lineH(S, 12), err = tone(S, 'err'), w = tone(S, 'w'), dat = tone(S, 'dat');
  let y = r.y + top;
  const inv = v.turns.some((tv) => tv.turn.call?.tool === 'inventory' && tv.turn.obs && tv.t > (v.fast ? FAST : SLOW).obs[0]);
  // inventario
  if (v.world) d.withAlpha(a0, () => {
    T(S, S.l('el mundo: inventario', 'the world: inventory'), r.x, y, { size: 12, weight: 800, color: p.mute }); y += lh * 1.1;
    const cSku = r.x + 4 * u, cHay = r.x + r.w * 0.66, cMin = r.x + r.w - 4 * u;
    T(S, S.l('pieza', 'part'), cSku, y, { size: 12, weight: 700, color: p.mute }); T(S, S.l('hay', 'have'), cHay, y, { size: 12, weight: 700, color: p.mute, align: 'right' }); T(S, S.l('mín', 'min'), cMin, y, { size: 12, weight: 700, color: p.mute, align: 'right' });
    y += lh;
    d.line(r.x, y - 1 * u, r.x + r.w, y - 1 * u, p.line, 1);
    ITEMS.forEach((it) => {
      const stock = v.run?.world.stock[it.sku] ?? it.stock, low = inv && stock < it.min;
      if (low) d.rect(r.x, y - 1 * u, r.w, lh, { fill: alpha(err.c, 0.1) });
      if (low) d.polygon([[r.x + 1 * u, y + lh * 0.3], [r.x + 9 * u, y + lh * 0.3], [r.x + 5 * u, y + lh * 0.7]], { fill: err.c });
      T(S, it.sku, cSku + (low ? 10 * u : 0), y, { size: 12, weight: low ? 800 : 600, font: 'mono', color: low ? err.ink : p.ink });
      T(S, String(stock), cHay, y, { size: 12, weight: low ? 800 : 600, font: 'mono', color: low ? err.ink : p.ink, align: 'right' });
      T(S, String(it.min), cMin, y, { size: 12, weight: 600, font: 'mono', color: p.ink2, align: 'right' });
      y += lh;
    });
    y += 8 * u;
  });
  // pedidos
  if (v.world) d.withAlpha(a0, () => {
    T(S, S.l('pedidos enviados', 'orders sent'), r.x, y, { size: 12, weight: 800, color: p.mute }); y += lh * 1.1;
    const os = v.run ? v.run.world.orders.slice(0, v.orders) : [];
    if (!os.length) { T(S, S.l('ninguno', 'none'), r.x + 4 * u, y, { size: 12, weight: 600, font: 'mono', color: p.mute }); y += lh; }
    os.forEach((o) => {
      const col = Math.abs(o.total - correctTotal(v.run!.world)) > 0.005 && v.verdict ? err : dat;
      d.rect(r.x, y - 1 * u, r.w, lh + 2 * u, { fill: alpha(col.c, 0.12), stroke: col.c, lw: 1.2, r: 2 });
      T(S, `${orderId(o.n, S.lang)}  ${money(o.total, S.lang)}`, r.x + 6 * u, y, { size: 12, weight: 800, font: 'mono', color: col.ink });
      if (o.byPerson) glyph(S, 'person', r.x + r.w - 12 * u, y + lh * 0.45, 12 * u, w.c);
      y += lh + 4 * u;
    });
    y += 6 * u;
  });
  // límite (permiso en el programa)
  const lim = v.limit;
  if (lim !== null) d.withAlpha(S.on('perm') ? S.reveal('perm', 0.2, 0.5) : 1, () => {
    const txt = lim === Infinity ? S.l('sin límite', 'no limit') : lim <= 0 ? S.l('siempre pide aprobación', 'always asks approval') : money(lim, S.lang);
    const hh = lh * 2.2;
    d.rect(r.x, y, r.w, hh, { fill: alpha(w.c, 0.1), stroke: w.c, lw: 1.5, r: 3 });
    glyph(S, 'lock', r.x + 14 * u, y + hh / 2, 14 * u, w.c);
    T(S, S.l('límite sin aprobar', 'limit without approval'), r.x + 28 * u, y + 3 * u, { size: 12, weight: 700, color: p.ink2 });
    T(S, txt, r.x + 28 * u, y + lh + 3 * u, { size: 12.5, weight: 800, font: 'mono', color: w.ink });
    y += hh + 8 * u;
  });
  // cuentas
  if (v.counts && v.run) d.withAlpha(S.on('run-done') ? S.reveal('run-done', 0.6, 0.5) : 1, () => {
    const tools = v.run!.turns.filter((t) => t.call).length, qs = v.run!.turns.length;
    T(S, `${tools} ${S.l('herramientas', 'tools')} · ${qs} ${S.l('consultas', 'queries')}`, r.x, y, { size: 13, weight: 800, font: 'mono' });
    y += lh * 1.3;
  });
  // veredicto
  if (v.verdict) verdictBox(S, { x: r.x, y, w: r.w, h: r.y + r.h - y }, v);
}

function verdictText(S: Frame, v: ConView): { t: Tone; s: string } {
  const run = v.run!, o = run.world.orders[0], good = correctTotal(run.world), over = o ? o.total - good : 0;
  const m = (x: number) => money(x, S.lang);
  switch (v.verdict) {
    case 'none': return { t: 'dat', s: S.l('No había faltantes y el agente no hizo nada: su camino dependió de lo que observó.', 'Nothing was low and the agent did nothing: its path depended on what it observed.') };
    case 'outage': return { t: 'dat', s: S.l('Falló el servicio de precios: el agente se detuvo y avisó, en vez de inventar precios.', 'The price service failed: the agent stopped and reported instead of making prices up.') };
    case 'ok-auto': return { t: 'dat', s: S.l(`Pedido correcto de ${m(o.total)}, dentro del límite. Nadie tuvo que intervenir.`, `Correct order of ${m(o.total)}, within the limit. Nobody had to step in.`) };
    case 'ok-approved': return { t: 'w', s: S.l('Aprobaste un pedido correcto: costó una decisión tuya y no evitó ningún error.', 'You approved a correct order: it cost you a decision and prevented no error.') };
    case 'wrong-auto': return { t: 'err', s: S.l(`El agente cree que terminó bien, pero pidió 280 cojinetes en lugar de 28: ${m(over)} de más, y ya no se puede deshacer.`, `The agent believes it finished well, but ordered 280 bearings instead of 28: ${m(over)} too much, and it cannot be undone.`) };
    case 'wrong-approved': return { t: 'err', s: S.l(`Aprobaste 280 cojinetes en lugar de 28: el error llegó al mundo con tu aprobación. Revisar es leer las cifras.`, `You approved 280 bearings instead of 28: the error reached the world with your approval. Reviewing means reading the numbers.`) };
    case 'rejected-wrong': return { t: 'dat', s: S.l('Rechazaste un pedido de 280 cojinetes en lugar de 28: el error no llegó al mundo. Costó una decisión tuya.', 'You rejected an order of 280 bearings instead of 28: the error never reached the world. It cost you one decision.') };
    default: return { t: 'w', s: S.l('Rechazaste un pedido correcto: el control frenó un acierto. Revisar también tiene un costo.', 'You rejected a correct order: the control stopped a good result. Reviewing has a cost too.') };
  }
}
function verdictBox(S: Frame, r: Rect, v: ConView) {
  const { d } = S, u = S.u, { t, s } = verdictText(S, v), tc = tone(S, t), lh = lineH(S, 12.5);
  const ls = wrapLines(S, s, r.w - 14 * u, 12.5, 700), h = ls.length * lh + 10 * u;
  d.withAlpha(smooth(0.999), () => {
    d.rect(r.x, r.y, r.w, h, { fill: alpha(tc.c, 0.12), stroke: tc.c, lw: 2, r: 3 });
    ls.forEach((ln, k) => T(S, ln, r.x + 7 * u, r.y + 5 * u + k * lh, { size: 12.5, weight: 700, color: tc.ink }));
  });
}

// ── barra inferior (teléfono vertical) ─────────────────────────────────────
function drawBar(S: Frame, r: Rect, v: ConView, a0: number) {
  const { d, pal: p } = S, u = S.u, lh = lineH(S, 12), w = tone(S, 'w'), dat = tone(S, 'dat'), err = tone(S, 'err');
  d.withAlpha(a0, () => {
    if (v.verdict) { verdictBox(S, r, v); return; }
    let y = r.y + 2 * u;
    const os = v.run ? v.run.world.orders.slice(0, v.orders) : [];
    T(S, S.l('pedidos enviados:', 'orders sent:'), r.x, y, { size: 12, weight: 800, color: p.mute });
    if (!os.length) T(S, S.l('ninguno', 'none'), r.x + 112 * u, y, { size: 12, weight: 600, font: 'mono', color: p.mute });
    os.forEach((o, k) => T(S, `${orderId(o.n, S.lang)} ${money(o.total, S.lang)}`, r.x + 112 * u, y + k * lh, { size: 12, weight: 800, font: 'mono', color: dat.ink }));
    y += Math.max(1, os.length) * lh + 4 * u;
    const lim = v.limit;
    if (lim !== null) {
      const txt = lim === Infinity ? S.l('sin límite', 'no limit') : lim <= 0 ? S.l('siempre pide aprobación', 'always asks approval') : money(lim, S.lang);
      glyph(S, 'lock', r.x + 8 * u, y + lh * 0.5, 13 * u, w.c);
      T(S, `${S.l('límite sin aprobar', 'limit without approval')}: ${txt}`, r.x + 22 * u, y, { size: 12, weight: 700, color: w.ink });
    } else if (v.counts && v.run) {
      const tools = v.run.turns.filter((t) => t.call).length;
      T(S, `${tools} ${S.l('herramientas', 'tools')} · ${v.run.turns.length} ${S.l('consultas al modelo', 'model queries')}`, r.x, y, { size: 12.5, weight: 800, font: 'mono' });
    }
  });
  void err;
}
