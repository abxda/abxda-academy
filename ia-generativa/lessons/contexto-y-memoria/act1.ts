// Acto 1: parece memoria → el modelo es una función con pesos fijos → la aplicación reenvía todo (sin estado) → gate «Tu turno» 1.
import { alpha, clamp, hash, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CHAT, NO_NAME, YES_NAME, type Role } from './model';
import { K, T, bubble, card, chip, isShort, lock, mw, neuAt, neuH, neuW, pad, roleLabel, sz, wagon, wrapLines } from './ui';

// ───────────────────────────── estado del gate 1 ─────────────────────────────
export interface G1 { mode: null | 'all' | 'last'; at: number; tried: { all: boolean; last: boolean } }
export const g1Of = (S: Frame): G1 => (S.st.g1 ??= { mode: null, at: 0, tried: { all: false, last: false } } as G1);

// ───────────────────────────── 1 · El chat ─────────────────────────────
export function drawChat(S: Frame) {
  const { d, pal: p } = S, F = pad(S), u = S.u;
  const w = Math.min(F.w, S.portrait ? F.w : Math.max(400 * u, F.w * 0.64)), x = F.x + (S.portrait ? 0 : 6 * u);
  const px = S.portrait ? 14.5 : 15.5, gap = 10 * u, bw = w * (S.portrait ? 0.84 : 0.66);
  // el chat: seis burbujas que aparecen una a una
  const times = [0.3, 1.5, 2.7, 3.9]; // hook
  const alphaOf = (i: number) => (i < 4 ? S.reveal('hook', times[i], 0.45) : S.reveal('seems', i === 4 ? 0.3 : 1.6, 0.45));
  const heights = CHAT.map((m) => (wrapLines(S, S.l(m.es, m.en), bw - 16 * u, px, 600).length * px * K(S) * 1.3) + 18 * u);
  const total = heights.reduce((a, b) => a + b, 0) + gap * (CHAT.length - 1) + 26 * u;
  let y = F.y + Math.max(0, (F.h - total - 24 * u) / 2) + 22 * u;
  T(S, S.l('chat', 'chat'), x, y - 22 * u, { px: 12, weight: 800, color: p.mute, base: 'top', a: S.reveal('hook', 0, 0.4) });
  CHAT.forEach((m, i) => {
    const a = alphaOf(i), h = heights[i], bx = m.role === 'user' ? x + w - bw : x;
    if (a > 0) d.shift(0, (1 - a) * 8 * u, () => bubble(S, { x: bx, y, w: bw, h }, S.l(m.es, m.en), m.role, { a, px, hot: i === 4 || i === 5 ? i === 5 : false }));
    y += h + gap;
  });
  // nota de honestidad
  T(S, S.l('conversación de ejemplo (ilustrativa)', 'example conversation (illustrative)'), x, F.y + F.h, { px: 12, weight: 600, color: p.mute, base: 'bottom', a: S.reveal('hook', 0.6, 0.5) });
  // Neu reacciona
  if (!S.portrait && !isShort(S)) neuAt(S, F.x + F.w - neuW(S) - 8 * u, F.y + F.h * 0.38, S.on('seems') ? 'wow' : 'happy', S.reveal('hook', 0.4, 0.5));
}

// ───────────────────────────── 2 · Andamio: app → modelo ─────────────────────────────
export interface Scaf { app: Rect; mid: Rect; model: Rect; lane: (i: number) => Rect; wh: number; slot: number; arrowGap: number; bus: number }

export function scaf(S: Frame): Scaf {
  const F = pad(S), u = S.u, gap = 14 * u;
  let app: Rect, model: Rect, mid: Rect;
  if (!S.portrait) {
    const appW = Math.max(118 * u, Math.min(F.w * 0.19, 180 * u)), modW = Math.max(132 * u, Math.min(F.w * 0.21, 200 * u));
    app = { x: F.x, y: F.y, w: appW, h: F.h };
    model = { x: F.x + F.w - modW, y: F.y, w: modW, h: F.h };
    mid = { x: app.x + appW + gap, y: F.y, w: model.x - (app.x + appW + gap) - gap, h: F.h };
  } else {
    app = { x: F.x, y: F.y, w: F.w, h: 66 * u };
    model = { x: F.x, y: F.y + F.h - 92 * u, w: F.w, h: 92 * u };
    mid = { x: F.x, y: app.y + app.h + gap, w: F.w, h: model.y - gap - (app.y + app.h + gap) };
  }
  const laneH = Math.min(96 * u, mid.h / 3), top = mid.y + (mid.h - 3 * laneH) / 2;
  const arrowGap = S.portrait ? 18 * u : 22 * u, slot = (mid.w - arrowGap) / 6;
  const wh = Math.max(24 * u, Math.min(laneH * 0.46, 40 * u));
  return { app, mid, model, lane: (i) => ({ x: mid.x, y: top + i * laneH, w: mid.w, h: laneH }), wh, slot, arrowGap, bus: mid.x + mid.w - 6 * u };
}

const ORDER: { id: string; role: Role }[] = [
  { id: 'S', role: 'sys' }, { id: 'U1', role: 'user' }, { id: 'A1', role: 'ai' }, { id: 'U2', role: 'user' }, { id: 'A2', role: 'ai' }, { id: 'U3', role: 'user' },
];
const LANE_N = [2, 4, 6];

function weightsGrid(S: Frame, r: Rect, a: number) {
  const { d } = S, wt = tone(S, 'w'), cols = Math.max(4, Math.floor(r.w / (11 * S.u))), rows = Math.max(2, Math.floor(r.h / (11 * S.u))), cs = Math.min(r.w / cols, r.h / rows);
  d.withAlpha(a, () => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d.rect(r.x + i * cs, r.y + j * cs, cs - 1.5, cs - 1.5, { fill: alpha(wt.c, 0.12 + 0.62 * hash(i * 7 + 3, j * 13 + 5)) });
  });
}

function modelCard(S: Frame, r: Rect, a: number, o: { pulse?: number; q?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w');
  card(S, r, { a, tone: 'lat', title: S.l('Modelo', 'Model'), titleTone: 'lat' });
  d.withAlpha(a, () => {
    const inner: Rect = S.portrait
      ? { x: r.x + 12 * u, y: r.y + 30 * u, w: 74 * u, h: r.h - 42 * u }
      : { x: r.x + 14 * u, y: r.y + 34 * u, w: r.w - 28 * u, h: Math.min(r.h * 0.22, 84 * u) };
    weightsGrid(S, inner, 1);
    const lx = S.portrait ? inner.x + inner.w + 10 * u : inner.x, ly = S.portrait ? r.y + 32 * u : inner.y + inner.h + 10 * u;
    lock(S, lx, ly, 16 * u, wt.ink);
    T(S, S.l('pesos fijos', 'frozen weights'), lx + 22 * u, ly + 8 * u, { px: 12.5, weight: 800, color: wt.ink, base: 'middle' });
    if (S.portrait) T(S, S.l('sin memoria', 'no memory'), lx, ly + 34 * u, { px: 12.5, weight: 700, color: p.ink2, base: 'middle' });
    else if (r.h > 260 * u) chip(S, S.l('sin memoria', 'no memory'), r.x + r.w / 2, ly + 40 * u, { px: 12.5 });
    if ((o.pulse ?? 0) > 0) d.rect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, { stroke: tone(S, 'sig').c, lw: 3, r: 5, a: o.pulse });
  });
}

function appCard(S: Frame, r: Rect, a: number, o: { shown: number; hot: boolean; dimBefore?: number }) {
  const { d, pal: p } = S, u = S.u;
  card(S, r, { a, tone: o.hot ? 'sig' : undefined, title: S.l('La app', 'The app'), titleTone: o.hot ? 'sig' : undefined });
  d.withAlpha(a, () => {
    const n = o.shown;
    if (!S.portrait) {
      T(S, S.l('guarda el historial', 'stores the history'), r.x + 10 * u, r.y + 28 * u, { px: 12, weight: 600, color: p.mute, base: 'top', w: r.w - 20 * u });
      const rh = Math.min(22 * u, (r.h - 90 * u) / 6), y0 = r.y + 62 * u;
      ORDER.forEach((m, i) => { if (i < n) wagon(S, { x: r.x + 12 * u, y: y0 + i * (rh + 5 * u), w: r.w - 24 * u, h: rh }, m.role, { label: m.id === 'U1' ? 'Ana' : roleLabel(S, m.role, true), a: clamp(n - i), hot: m.id === 'U1' }); });
    } else {
      const sw = (r.w - 24 * u - 5 * u * 5) / 6, y0 = r.y + 32 * u, rh = 24 * u;
      ORDER.forEach((m, i) => { if (i < n) wagon(S, { x: r.x + 12 * u + i * (sw + 5 * u), y: y0, w: sw, h: rh }, m.role, { label: m.id === 'U1' ? 'Ana' : roleLabel(S, m.role, true), a: clamp(n - i), hot: m.id === 'U1', px: 12 }); });
      T(S, S.l('guarda el historial', 'stores the history'), r.x + r.w - 10 * u, r.y + 8 * u, { px: 12, weight: 600, color: p.mute, align: 'right', base: 'top' });
    }
  });
}

/** Un carril: los vagones que viajan al modelo en un turno. */
function lane(S: Frame, sc: Scaf, i: number, n: number, o: { a: number; reveal?: number; label?: string; dim?: Set<number>; hotFact?: boolean }) {
  const { d, pal: p } = S, u = S.u, L = sc.lane(i), wh = sc.wh;
  const y = L.y + L.h - wh - 8 * u;
  d.withAlpha(o.a, () => {
    T(S, o.label ?? S.l(`turno ${i + 1}`, `turn ${i + 1}`), L.x, y - 6 * u, { px: 12.5, weight: 800, color: p.ink2, base: 'bottom' });
    // riel
    d.line(L.x, y + wh + 3 * u, L.x + L.w - sc.arrowGap + 4 * u, y + wh + 3 * u, p.line, 1, [3, 4]);
    for (let k = 0; k < n; k++) {
      const a = clamp((o.reveal ?? n) - k), m = ORDER[k], dim = o.dim?.has(k);
      if (a <= 0) continue;
      const r: Rect = { x: L.x + k * sc.slot, y, w: sc.slot - 4 * u, h: wh };
      wagon(S, r, m.role, { label: m.id === 'U1' ? 'Ana' : roleLabel(S, m.role, true), a: a * (dim ? 0.3 : 1), dashed: !!dim, wheels: true, hot: m.id === 'U1' && !dim });
    }
    // flecha al modelo
    const ax = L.x + n * sc.slot - 2 * u, ex = S.portrait ? sc.bus : sc.model.x - 6 * u, ay = y + wh / 2;
    const ok = clamp((o.reveal ?? n) - n + 1);
    if (ok > 0) {
      d.line(ax, ay, S.portrait ? sc.bus : ex - 4 * u, ay, tone(S, 'sig').c, 1.5, [4, 4], 0.9 * ok);
      if (!S.portrait) d.arrow(ex - 14 * u, ay, ex, ay, tone(S, 'sig').c, 2, 7, ok);
    }
  });
}

// ───────────────────────────── 3 · Todo el acto 1 sobre el andamio ─────────────────────────────
/** Desde «function» hasta «window»: tarjetas de la app y del modelo, y en el centro, según el momento, la función, los carriles o el gate. */
export function drawAct1(S: Frame) {
  const { d, pal: p } = S, u = S.u, sc = scaf(S), g = g1Of(S);
  const aAll = S.at('function', 0, 0.6, 'out') * (1 - S.at('window', 0, 0.45, 'out'));
  if (aAll <= 0) return;
  const hot = S.between('stateless-def', 'try-state');
  modelCard(S, sc.model, aAll, { pulse: g.mode && S.between('try-state', 'window') ? clamp(1 - (S.clock - g.at) / 1.4) : 0 });
  appCard(S, sc.app, aAll, { shown: 6, hot });

  d.withAlpha(aAll, () => {
    // ── a) la función: entra texto, sale la probabilidad
    const aF = S.reveal('function', 0.8, 0.6) * (1 - S.at('stateless-q', 0, 0.45, 'out'));
    if (aF > 0) {
      const m = sc.mid, cy = m.y + m.h / 2;
      d.withAlpha(aF, () => {
        const lx = m.x, rx = m.x + m.w;
        if (!S.portrait) {
          const y1 = cy - 36 * u, y2 = cy + 24 * u;
          d.arrow(lx, y1, rx + 14 * u, y1, tone(S, 'sig').c, 2.5, 9);
          T(S, S.l('texto que entra', 'text in'), (lx + rx) / 2, y1 - 8 * u, { px: 13, weight: 700, color: tone(S, 'sig').ink, align: 'center', base: 'bottom' });
          d.arrow(rx + 14 * u, y2, lx, y2, tone(S, 'lat').c, 2.5, 9);
          T(S, S.l('probabilidad de la siguiente pieza', 'probability of the next piece'), (lx + rx) / 2, y2 + 8 * u, { px: 13, weight: 700, color: tone(S, 'lat').ink, align: 'center', base: 'top', w: m.w - 10 * u });
          const bx = lx + m.w * 0.2, bw = m.w * 0.6, by = y2 + 50 * u;
          [0.62, 0.21, 0.1, 0.04].forEach((v, i) => d.rect(bx, by + i * 14 * u, bw * v, 9 * u, { fill: alpha(tone(S, 'lat').c, i === 0 ? 0.8 : 0.4) }));
        } else {
          const x1 = m.x + m.w * 0.28, x2 = m.x + m.w * 0.72;
          d.arrow(x1, m.y + 4 * u, x1, m.y + m.h - 4 * u, tone(S, 'sig').c, 2.5, 9);
          T(S, S.l('texto que entra', 'text in'), x1 - 10 * u, cy, { px: 13, weight: 700, color: tone(S, 'sig').ink, align: 'right', base: 'middle', w: m.w * 0.24 });
          d.arrow(x2, m.y + m.h - 4 * u, x2, m.y + 4 * u, tone(S, 'lat').c, 2.5, 9);
          T(S, S.l('probabilidad de la siguiente pieza', 'probability of the next piece'), x2 + 10 * u, cy, { px: 13, weight: 700, color: tone(S, 'lat').ink, base: 'middle', w: m.w * 0.27 });
        }
      });
    }

    // ── b) un tren por turno
    if (S.on('stateless-q') && !S.on('try-state')) {
      for (let i = 0; i < 3; i++) {
        const t0 = 0.2 + i * 1.1, r = S.at('stateless-q', t0, t0 + 0.9, 'lin') * (LANE_N[i] + 1), a = S.at('stateless-q', t0, t0 + 0.3, 'out');
        if (a > 0) lane(S, sc, i, LANE_N[i], { a, reveal: r });
      }
      if (S.portrait) {
        const by0 = sc.lane(0).y + sc.lane(0).h - sc.wh / 2 - 8 * u, by1 = sc.model.y - 3 * u, ba = S.at('stateless-q', 0.3, 1.2, 'lin');
        d.line(sc.bus, by0, sc.bus, lerp(by0, by1, ba), tone(S, 'sig').c, 1.5, [4, 4], 0.9);
        if (ba > 0.98) d.arrow(sc.bus, by1 - 12 * u, sc.bus, by1, tone(S, 'sig').c, 2, 7);
      }
      if (S.on('stateless-def')) T(S, S.l('el tren crece en cada turno', 'the train grows every turn'), sc.mid.x + sc.mid.w / 2, sc.lane(0).y + 2 * u, { px: 12.5, weight: 700, color: tone(S, 'sig').ink, align: 'center', base: 'top', a: S.reveal('stateless-def', 0.3, 0.5) });
    }

    // ── c) gate 1
    const aG = S.at('try-state', 0, 0.5, 'out');
    if (aG > 0) gate1(S, sc, g, aG);
  });
}

function gate1(S: Frame, sc: Scaf, g: G1, a: number) {
  const { d, pal: p } = S, u = S.u;
  const laneH = Math.max(sc.wh + 36 * u, 82 * u), top = sc.mid.y + 4 * u;
  const one: Scaf = { ...sc, lane: () => ({ x: sc.mid.x, y: top, w: sc.mid.w, h: laneH }) };
  const dim = new Set<number>(g.mode === 'last' ? [1, 2, 3, 4] : []);
  lane(S, one, 0, 6, { a, label: S.l('turno 3: «¿cómo me llamo?»', 'turn 3: “what is my name?”'), dim });
  const sent = g.mode === 'last' ? S.l('Se envía solo la pregunta, más el prompt del sistema.', 'Only the question is sent, plus the system prompt.') : g.mode === 'all' ? S.l('Se envía todo el historial.', 'The whole history is sent.') : S.l('¿Qué enviar? Adivina la respuesta y pulsa.', 'What to send? Guess the answer, then press.');
  const ty = top + laneH + 2 * u;
  T(S, sent, sc.mid.x, ty, { px: 13, weight: 700, color: g.mode ? tone(S, 'sig').ink : p.mute, base: 'top', w: sc.mid.w, a });
  const rows: { key: 'all' | 'last'; q: string; ans: string; tn: 'dat' | 'err' }[] = [
    { key: 'all', q: S.l('Con el historial', 'With the history'), ans: S.L(YES_NAME), tn: 'dat' },
    { key: 'last', q: S.l('Solo la pregunta', 'Only the question'), ans: S.L(NO_NAME), tn: 'err' },
  ];
  let y = ty + 38 * u;
  const room = sc.mid.y + sc.mid.h - y - 20 * u, bh = Math.max(46 * u, Math.min(66 * u, room / 2 - 6 * u));
  rows.forEach((row) => {
    if (!g.tried[row.key]) return;
    const live = g.mode === row.key ? clamp((S.clock - g.at - 0.1) / 0.5) : 1, t = tone(S, row.tn);
    d.withAlpha(a * live, () => {
      const r: Rect = { x: sc.mid.x, y, w: sc.mid.w, h: bh };
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1), stroke: t.c, lw: g.mode === row.key ? 2.5 : 1.5, r: 5, dash: row.key === 'last' ? [5, 3] : undefined });
      T(S, row.q, r.x + 10 * u, r.y + 6 * u, { px: 12, weight: 800, color: t.ink, base: 'top' });
      T(S, '«' + row.ans + '»', r.x + 10 * u, r.y + 24 * u, { px: 13.5, weight: 600, color: p.ink, base: 'top', w: r.w - 20 * u });
    });
    y += bh + 8 * u;
  });
  T(S, S.l('Respuestas típicas, ilustrativas.', 'Typical answers, illustrative.'), sc.mid.x, sc.mid.y + sc.mid.h, { px: 12, weight: 600, color: p.mute, base: 'bottom', a });
  if (S.on('state-after') && !S.portrait && !isShort(S)) neuAt(S, sc.app.x + (sc.app.w - neuW(S)) / 2, sc.app.y + sc.app.h - neuH(S) - 10 * u, 'wow', S.reveal('state-after', 0.2, 0.5) * a);
}
