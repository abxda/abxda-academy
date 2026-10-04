// Acto 2: la ventana de contexto como tramo de vía, qué cabe, el prompt del sistema, cómo creció la ventana,
// qué pasa al desbordarla (animación) y el gate 2: llenar la ventana hasta que se salga el mensaje con tu nombre.
import { alpha, clamp, ease, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import {
  NO_NAME, SIZES, SYS_PROMPT, YES_NAME, STORY_ARRIVALS, WINDOWS, fitWindow, nameInside, storyTrain, total, wordsOf, baseTrain,
  type Wagon,
} from './model';
import { K, T, card, chip, fitLabel, gauge, isShort, mw, neuAt, neuH, neuW, num, pad, pt, roleLabel, seg, sz, wagon, windowFrame, wrapLines, type Track } from './ui';

// ───────────────────────────── estado de una vía ─────────────────────────────
export interface Flip { to: 'in' | 'out'; at: number; s0: number }
export interface TS { wagons: Wagon[]; L: number; flips: Record<string, Flip>; now: number; grow?: { id: string; k: number } }

/** Gate 2: estado interactivo del tren. */
export interface G2 { wagons: Wagon[]; L: number; inside: Set<string>; flips: Record<string, Flip>; seenLost: boolean; sends: number }
export const g2Init = (): G2 => { const w = baseTrain(), L = WINDOWS[0]; return { wagons: w, L, inside: fitWindow(w, L), flips: {}, seenLost: false, sends: 0 }; };
export const g2Of = (S: Frame): G2 => (S.st.g2 ??= g2Init());

/** Inicio (en tokens) de un vagón dentro de la ventana, dado el conjunto de los que están dentro. */
export function startTok(w: Wagon[], inside: Set<string>, id: string): number {
  let s = 0;
  for (const x of w) { if (x.id === id) return s; if (inside.has(x.id)) s += x.tokens; }
  return s;
}

/** Actualiza los flips (entradas y salidas) al cambiar los vagones o el tamaño de la ventana. */
export function g2Sync(S: Frame, g: G2, prevIds: Set<string>) {
  const inside = fitWindow(g.wagons, g.L);
  for (const x of g.wagons) {
    const was = g.inside.has(x.id), is = inside.has(x.id), isNew = !prevIds.has(x.id);
    if (isNew) g.flips[x.id] = { to: 'in', at: S.clock, s0: 0 };
    else if (was && !is) g.flips[x.id] = { to: 'out', at: S.clock, s0: startTok(g.wagons, g.inside, x.id) };
    else if (!was && is) g.flips[x.id] = { to: 'in', at: S.clock, s0: 0 };
  }
  g.inside = inside;
  if (!nameInside(g.wagons, g.L)) g.seenLost = true;
}

// ───────────────────────────── geometría de la vía y la bandeja ─────────────────────────────
export interface TL { win: Track; tray: Track; scale: number; trayLabel: [number, number]; rest: Rect; right: Rect; vertical: boolean }

export function trainLayout(S: Frame, L: number, mode: 'story' | 'play' = 'play'): TL {
  const F = pad(S), u = S.u;
  if (!S.portrait) {
    const short = isShort(S);
    const thick = mode === 'story' ? Math.max(40 * u, Math.min(F.h * 0.25, 108 * u)) : Math.max(38 * u, Math.min(F.h * 0.19, 84 * u));
    const y0 = mode === 'story' ? F.y + (short ? 30 : 36) * u + F.h * (short ? 0.02 : 0.08) : F.y + (short ? 26 : 34) * u;
    const win: Track = { x: F.x + 8 * u, y: y0, len: F.w - 16 * u, thick, vertical: false };
    const trayY = win.y + thick + (short ? 44 : 66) * u;
    const tray: Track = { ...win, y: trayY };
    const restY = mode === 'story' && !short ? win.y + thick + 74 * u : trayY + thick + 14 * u;
    return { win, tray, scale: win.len / L, trayLabel: [win.x, trayY - 8 * u], rest: { x: F.x, y: restY, w: F.w, h: F.y + F.h - restY }, right: { x: F.x, y: F.y, w: F.w, h: F.h }, vertical: false };
  }
  const thick = 112 * u, y0 = F.y + 30 * u, len = F.h - 36 * u;
  const win: Track = { x: F.x + 6 * u, y: y0, len, thick, vertical: true };
  const rx = win.x + thick + 34 * u, rw = F.x + F.w - rx;
  const tray: Track = { x: rx, y: y0 + 24 * u, len: Math.min(len * 0.36, 140 * u), thick: Math.min(rw, 100 * u), vertical: true };
  const restY = tray.y + tray.len + 12 * u;
  return { win, tray, scale: len / L, trayLabel: [rx, y0 + 18 * u], rest: { x: rx, y: restY, w: rw, h: F.y + F.h - restY }, right: { x: rx, y: y0, w: rw, h: len }, vertical: true };
}

const labelsOf = (S: Frame, w: Wagon): string[] => (w.fact ? ['Ana'] : w.role === 'sys' ? [roleLabel(S, 'sys'), 'S'] : w.role === 'doc' ? [roleLabel(S, 'doc'), 'doc'] : [roleLabel(S, w.role, true)]);

/** Dibuja la vía con su ventana, los vagones dentro y la bandeja con los que quedaron fuera. */
export function drawTrain(S: Frame, tl: TL, ts: TS, o: { a?: number; label?: boolean; reveal?: number; hotId?: string; trayLabel?: boolean; showFree?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, a = o.a ?? 1;
  const inside = fitWindow(ts.wagons, ts.L), now = ts.now;
  const evicted = ts.wagons.filter((w) => !inside.has(w.id)), evTotal = evicted.reduce((x, w) => x + w.tokens, 0);
  const lpx = tl.vertical ? 12.5 : Math.max(12.5, Math.min(16, tl.win.thick * 0.2 / K(S)));
  const grown = (w: Wagon) => (ts.grow && ts.grow.id === w.id ? w.tokens * ts.grow.k : w.tokens);
  d.withAlpha(a, () => {
    if (o.label !== false) windowFrame(S, tl.win, { limit: ts.L, label: S.l(`ventana de contexto · ${num(S, ts.L)} tokens`, `context window · ${num(S, ts.L)} tokens`) });
    // tokens
    let s = 0;
    const trayScale = Math.min(tl.scale, tl.tray.len / Math.max(1, evTotal));
    let ts2 = 0, k = 0;
    ts.wagons.forEach((w, idx) => {
      const rev = o.reveal !== undefined ? clamp(o.reveal - idx) : 1;
      const f = ts.flips[w.id], age = f ? (now - f.at) : 99;
      const hot = o.hotId === w.id || (w.fact && !o.hotId);
      if (inside.has(w.id)) {
        const r = seg(tl.win, s * tl.scale + 1, (s + grown(w)) * tl.scale - 1);
        const appear = f && f.to === 'in' ? ease.out(clamp(age / 0.5)) : 1;
        if (rev > 0) d.shift(tl.vertical ? 0 : (1 - appear) * 22 * u, tl.vertical ? (1 - appear) * 22 * u : 0, () => wagon(S, r, w.role, { label: fitLabel(S, r, labelsOf(S, w), lpx), px: lpx, a: appear * rev, hot, wheels: !tl.vertical && r.w > 20 * u }));
        s += grown(w); k++;
      } else {
        const r = seg(tl.tray, ts2 * trayScale + 1, (ts2 + w.tokens) * trayScale - 1);
        const appear = f && f.to === 'out' ? ease.out(clamp((age - 0.25) / 0.5)) : 1;
        wagon(S, r, w.role, { label: fitLabel(S, r, labelsOf(S, w), lpx), px: lpx, a: 0.62 * appear, dashed: true, hot: w.fact });
        // fantasma que cae desde la ventana hacia la bandeja
        if (f && f.to === 'out' && age < 0.8) {
          const g0 = seg(tl.win, f.s0 * tl.scale + 1, (f.s0 + w.tokens) * tl.scale - 1), t = ease.io(clamp(age / 0.7));
          const x = lerp(g0.x, r.x, t), y = lerp(g0.y, r.y, t);
          wagon(S, { x, y, w: lerp(g0.w, r.w, t), h: lerp(g0.h, r.h, t) }, w.role, { label: false, a: (1 - t) * 0.9, hot: w.fact });
        }
        ts2 += w.tokens;
      }
    });
    // espacio libre en la ventana
    const free = ts.L - total(ts.wagons.filter((w) => inside.has(w.id))) + (ts.grow ? ts.wagons.filter((w) => w.id === ts.grow!.id).reduce((x, w) => x + w.tokens * (1 - ts.grow!.k), 0) : 0);
    if (o.showFree !== false && free > 8) {
      const used = s, r = seg(tl.win, used * tl.scale + 1, tl.win.len);
      d.rect(r.x, r.y, r.w, r.h, { stroke: p.line, lw: 1.5, dash: [4, 4], r: 3 });
      if ((tl.vertical ? r.h : r.w) > 54 * u && r.h > 18 * u) T(S, S.l('libre', 'free'), r.x + r.w / 2, r.y + r.h / 2, { px: 12.5, weight: 700, color: p.mute, align: 'center', base: 'middle' });
    }
    // rótulo de la bandeja
    if (o.trayLabel && evicted.length > 0) {
      const [lx, ly] = tl.trayLabel;
      T(S, S.l('fuera de la ventana', 'outside the window'), lx, ly, { px: 12.5, weight: 800, color: tone(S, 'err').ink, base: 'bottom', w: tl.vertical ? tl.right.w : undefined });
    }
  });
  return { used: total(ts.wagons.filter((w) => inside.has(w.id))), evicted: evicted.length };
}

// ───────────────────────────── la narración: window → contents → system ─────────────────────────────
const VIEW_END = 'sizes';

/** Tren de la historia: la pregunta ya viajó (hasta U3); la respuesta A3 se va escribiendo durante «contents». */
export function storyState(S: Frame): TS {
  const wagons = storyTrain(), L = WINDOWS[0], flips: Record<string, Flip> = {};
  const k = S.on('contents') ? ease.io(clamp(S.since('contents') / 3.0)) : 0;
  return { wagons, L, flips, now: 99, grow: { id: 'A3', k } };
}

export function drawWindowStory(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const aV = S.at('window', 0, 0.5, 'out') * (1 - S.at(VIEW_END, 0, 0.45, 'out'));
  if (aV <= 0) return;
  const ts = storyState(S), tl = trainLayout(S, ts.L, 'story');
  // los vagones entran uno a uno al empezar «window»
  const reveal = S.on('window') ? S.since('window') / 0.22 + 0.2 : 0;
  d.withAlpha(aV, () => {
    drawTrain(S, tl, ts, { reveal: Math.min(reveal, 12), hotId: S.between('system', VIEW_END) ? 'S' : '' });
    const hist = ts.wagons.filter((w) => w.id !== 'S');
    void hist;
    // ── contents: llaves con el nombre de cada parte
    if (S.on('contents')) bracketsFor(S, tl, ts, S.reveal('contents', 0.15, 0.6) * (1 - S.at('system', 0, 0.4, 'out')));
    // ── system: tarjeta con el prompt del sistema
    if (S.on('system')) systemCard(S, tl, S.reveal('system', 0.2, 0.6));
    // uso
    if (S.on('window')) usage(S, tl, ts, S.reveal('window', 0.9, 0.5));
  });
}

function usage(S: Frame, tl: TL, ts: TS, a: number, o: { y?: number } = {}) {
  const { d, pal: p } = S, u = S.u, inside = fitWindow(ts.wagons, ts.L), F = pad(S);
  const used = ts.wagons.filter((w) => inside.has(w.id)).reduce((x, w) => x + (ts.grow && ts.grow.id === w.id ? w.tokens * ts.grow.k : w.tokens), 0);
  const txt = S.l(`en la ventana: ${num(S, used)} de ${num(S, ts.L)} tokens`, `in the window: ${num(S, used)} of ${num(S, ts.L)} tokens`);
  d.withAlpha(a, () => {
    if (!tl.vertical) {
      const y = o.y ?? F.y + F.h - 30 * u;
      T(S, txt, tl.win.x, y, { px: 13, weight: 800, color: p.ink2, base: 'middle' });
      gauge(S, { x: tl.win.x, y: y + 14 * u, w: Math.min(280 * u, tl.win.len * 0.45), h: 9 * u }, used, ts.L);
    } else {
      T(S, txt, tl.right.x, tl.right.y + tl.right.h, { px: 12.5, weight: 800, color: p.ink2, base: 'bottom', w: tl.right.w });
    }
  });
}

/** Llaves junto a la vía con el nombre de cada parte: instrucciones, historial, tu pregunta, respuesta. */
function bracketsFor(S: Frame, tl: TL, ts: TS, a: number) {
  const { d, pal: p } = S, u = S.u;
  const w = ts.wagons, idx = (id: string) => w.findIndex((x) => x.id === id);
  const startOf = (i: number) => w.slice(0, i).reduce((x, y) => x + y.tokens, 0), endOf = (i: number) => w.slice(0, i + 1).reduce((x, y, j) => x + (ts.grow && ts.grow.id === y.id ? y.tokens * ts.grow.k : y.tokens), 0);
  const parts = [
    { from: 0, to: 0, es: 'instrucciones', en: 'instructions', tone: 'ink' as const },
    { from: 1, to: idx('A2'), es: 'historial', en: 'history', tone: 'lat' as const },
    { from: idx('U3'), to: idx('U3'), es: 'tu pregunta', en: 'your question', tone: 'sig' as const },
    { from: idx('A3'), to: idx('A3'), es: 'respuesta', en: 'answer', tone: 'lat' as const },
  ];
  d.withAlpha(a, () => {
    parts.forEach((pt_, i) => {
      const s0 = startOf(pt_.from) * tl.scale, s1 = endOf(pt_.to) * tl.scale, t = tone(S, pt_.tone), lab = S.l(pt_.es, pt_.en);
      if (!tl.vertical) {
        const y = tl.win.y + tl.win.thick + 30 * u + (i % 2) * 38 * u, x0 = tl.win.x + s0 + 2, x1 = tl.win.x + s1 - 2;
        d.polyline([[x0, y - 5 * u], [x0, y], [x1, y], [x1, y - 5 * u]], t.c, 2);
        const lw = mw(S, lab, 12.5, 800), cx = Math.min(Math.max((x0 + x1) / 2, tl.win.x + lw / 2), tl.win.x + tl.win.len - lw / 2);
        T(S, lab, cx, y + 3 * u, { px: 12.5, weight: 800, color: t.ink, align: 'center', base: 'top' });
      } else {
        const x = tl.win.x + tl.win.thick + 14 * u, y0 = tl.win.y + s0 + 2, y1 = tl.win.y + s1 - 2;
        d.polyline([[x - 5 * u, y0], [x, y0], [x, y1], [x - 5 * u, y1]], t.c, 2);
        T(S, lab, x + 6 * u, (y0 + y1) / 2, { px: 12.5, weight: 800, color: t.ink, base: 'middle', w: tl.right.w - 6 * u });
      }
    });
  });
}

function systemCard(S: Frame, tl: TL, a: number) {
  const { d, pal: p } = S, u = S.u, px = 12.5, lh = px * K(S) * 1.3;
  const w = tl.vertical ? tl.right.w : Math.min(380 * u, tl.win.len * 0.52), inner = w - 20 * u;
  const wrap = (str: string, f: 'ui' | 'mono') => S.d.wrap(str, inner, { size: sz(S, px), weight: 600, font: f });
  const body = SYS_PROMPT[S.lang].flatMap((l) => wrap(l, 'mono')), foot = wrap(S.l('tú no lo ves · el modelo lo lee primero', 'you don’t see it · the model reads it first'), 'ui');
  const h = 30 * u + body.length * lh + 8 * u + foot.length * lh + 12 * u;
  const x = tl.vertical ? tl.right.x : tl.win.x, y = tl.vertical ? tl.right.y + 6 * u : tl.win.y + tl.win.thick + 40 * u;
  d.withAlpha(a, () => {
    card(S, { x, y, w, h }, { tone: 'ink', title: S.l('prompt del sistema (ejemplo)', 'system prompt (example)') });
    body.forEach((l, i) => T(S, l, x + 10 * u, y + 30 * u + i * lh, { px, weight: 600, color: p.ink, base: 'top', font: 'mono' }));
    foot.forEach((l, i) => T(S, l, x + 10 * u, y + 38 * u + body.length * lh + i * lh, { px, weight: 700, color: tone(S, 'err').ink, base: 'top' }));
  });
}

// ───────────────────────────── tamaños de ventana (datos reales) ─────────────────────────────
export function drawSizes(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S);
  const a = S.at('sizes', 0, 0.5, 'out') * (1 - S.at('overflow', 0, 0.45, 'out'));
  if (a <= 0) return;
  const n = SIZES.length, lo = Math.log10(200), hi = Math.log10(2.2e6);
  const nameW = (S.portrait ? 96 : 150) * u, wordsW = S.portrait ? 0 : 190 * u, valW = 64 * u;
  const top = F.y + 6 * u, bottom = F.y + F.h - 34 * u, rowH = Math.min(S.portrait ? 62 * u : 54 * u, (bottom - top) / n);
  const barX = F.x + nameW, barW = F.w - nameW - wordsW - valW;
  const wordsOn = S.reveal('sizes', 2.6, 0.6);
  d.withAlpha(a, () => {
    SIZES.forEach((row, i) => {
      const y = top + i * rowH + rowH / 2, t0 = 0.2 + i * 0.28, k = S.at('sizes', t0, t0 + 0.8, 'out');
      if (k <= 0) return;
      const len = ((Math.log10(row.tokens) - lo) / (hi - lo)) * barW * k, big = row.id === 'claude';
      const tn = tone(S, row.plus ? 'lat' : 'lat');
      d.withAlpha(clamp(k * 3), () => {
        T(S, row.name, F.x, y - (S.portrait ? 8 : 0) * u, { px: 14, weight: 800, color: p.ink, base: 'middle' });
        T(S, String(row.year), F.x, y + (S.portrait ? 10 : 18) * u, { px: 12, weight: 600, color: p.mute, base: S.portrait ? 'middle' : 'middle' });
        d.rect(barX, y - 10 * u, len, 20 * u, { fill: alpha(tn.c, big && wordsOn > 0.5 ? 0.6 : 0.4), stroke: tn.c, lw: 1.5, r: 2 });
        if (row.plus) d.arrow(barX + len, y, barX + len + 22 * u, y, tn.c, 2, 7);
        T(S, row.short, barX + len + (row.plus ? 28 : 8) * u, y, { px: 13, weight: 800, font: 'mono', color: tn.ink, base: 'middle' });
        // palabras
        const words = `≈ ${num(S, Math.round(wordsOf(row.tokens) / (row.tokens > 5000 ? 1000 : 10)) * (row.tokens > 5000 ? 1000 : 10))}`;
        const wtxt = S.l(`${words} palabras`, `${words} words`);
        if (wordsW > 0) T(S, wtxt, F.x + F.w, y, { px: 12.5, weight: 700, color: p.ink2, align: 'right', base: 'middle', a: wordsOn });
        else T(S, wtxt, F.x + F.w, y - 8 * u, { px: 12, weight: 700, color: p.ink2, align: 'right', base: 'middle', a: wordsOn });
        if (big && wordsOn > 0.2) chip(S, S.l('una novela entera', 'an entire novel'), barX + barW * 0.42, y - 24 * u + (S.portrait ? 4 * u : 0), { tone: 'sig', a: wordsOn, align: 'center' });
      });
    });
    T(S, S.l('Tokens de contexto (escala logarítmica). Palabras: aproximadas, ¾ de palabra por token en inglés.', 'Context tokens (logarithmic scale). Words: approximate, ¾ of a word per token in English.'), F.x, F.y + F.h, { px: 12, weight: 600, color: p.mute, base: 'bottom', w: F.w });
  });
}

// ───────────────────────────── el desborde narrado ─────────────────────────────
export function overflowState(S: Frame): TS {
  const base = storyTrain(), [u4, a4] = STORY_ARRIVALS, L = WINDOWS[0];
  const t = S.since('overflow'), flips: Record<string, Flip> = {};
  base.forEach((w) => (flips[w.id] = { to: 'in', at: -9, s0: 0 }));
  const wagons = [...base];
  const T1 = 1.0, T2 = 3.4;
  const insideBefore = (list: Wagon[]) => fitWindow(list, L);
  if (t >= T1) {
    const prev = insideBefore(wagons); wagons.push(u4); const inn = insideBefore(wagons);
    flips[u4.id] = { to: 'in', at: T1, s0: 0 };
    for (const w of wagons) if (prev.has(w.id) && !inn.has(w.id)) flips[w.id] = { to: 'out', at: T1, s0: startTok(wagons, prev, w.id) };
    if (t >= T2) {
      const prev2 = inn; wagons.push(a4); const inn2 = insideBefore(wagons);
      flips[a4.id] = { to: 'in', at: T2, s0: 0 };
      for (const w of wagons) if (prev2.has(w.id) && !inn2.has(w.id)) flips[w.id] = { to: 'out', at: T2, s0: startTok(wagons, prev2, w.id) };
    }
  }
  return { wagons, L, flips, now: t };
}

export function drawOverflow(S: Frame) {
  const { d } = S, u = S.u;
  const a = S.at('overflow', 0, 0.5, 'out') * (1 - S.at('try-train', 0, 0.45, 'out'));
  if (a <= 0) return;
  const ts = overflowState(S), tl = trainLayout(S, ts.L, 'play');
  d.withAlpha(a, () => {
    drawTrain(S, tl, ts, { trayLabel: true });
    // las tres decisiones posibles de la aplicación
    const aP = S.reveal('overflow', 0.4, 0.6), opts = [S.l('recortar', 'trim'), S.l('resumir', 'summarize'), S.l('rechazar (error)', 'reject (error)')];
    d.withAlpha(aP, () => {
      if (!tl.vertical) {
        let x = tl.rest.x; const y = tl.rest.y + 18 * u;
        T(S, S.l('la app decide:', 'the app decides:'), x, y, { px: 13, weight: 700, color: S.pal.ink2, base: 'middle' });
        x += mw(S, S.l('la app decide:', 'the app decides:'), 13, 700) + 12 * u;
        opts.forEach((o, i) => { const r = chip(S, o, x, y, { tone: i === 0 ? 'err' : undefined, align: 'left' }); x += r.w + 8 * u; });
      } else {
        let y = tl.rest.y + 10 * u;
        T(S, S.l('la app decide:', 'the app decides:'), tl.rest.x, y, { px: 12.5, weight: 700, color: S.pal.ink2, base: 'top' });
        y += 26 * u;
        opts.forEach((o, i) => { const r = chip(S, o, tl.rest.x, y, { tone: i === 0 ? 'err' : undefined, align: 'left' }); y += r.h + 6 * u; });
      }
    });
    usage(S, tl, ts, aP, { y: tl.rest.y + 70 * u });
  });
}

// ───────────────────────────── gate 2 ─────────────────────────────
export function drawGate2(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const a = S.at('try-train', 0, 0.5, 'out') * (1 - S.at('cost-q', 0, 0.45, 'out'));
  if (a <= 0) return;
  const g = g2Of(S), ts: TS = { wagons: g.wagons, L: g.L, flips: g.flips, now: S.clock }, tl = trainLayout(S, g.L);
  d.withAlpha(a, () => {
    const info = drawTrain(S, tl, ts, { trayLabel: true });
    const lost = !nameInside(g.wagons, g.L);
    // sonda: qué respondería ahora
    const t = tone(S, lost ? 'err' : 'dat');
    const q = S.l('Si ahora preguntas «¿cómo me llamo?»…', 'If you now ask “what is my name?”…'), ans = S.L(lost ? NO_NAME : YES_NAME);
    if (!tl.vertical) {
      const r = tl.rest, pw = Math.min(r.w * 0.6, 520 * u), ph = Math.min(r.h - 4 * u, 84 * u);
      d.rect(r.x, r.y, pw, ph, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 2, r: 5, dash: lost ? [5, 3] : undefined });
      T(S, q, r.x + 12 * u, r.y + 8 * u, { px: 12.5, weight: 800, color: t.ink, base: 'top', w: pw - 24 * u });
      T(S, '«' + ans + '»', r.x + 12 * u, r.y + 28 * u, { px: 14.5, weight: 600, color: p.ink, base: 'top', w: pw - 24 * u });
      // lecturas
      const sx = r.x + pw + 18 * u;
      T(S, S.l('en la ventana', 'in the window'), sx, r.y + 4 * u, { px: 12, weight: 700, color: p.mute, base: 'top' });
      T(S, `${num(S, info.used)} / ${num(S, g.L)}`, sx, r.y + 20 * u, { px: 20, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      gauge(S, { x: sx, y: r.y + 50 * u, w: Math.max(80 * u, r.x + r.w - sx), h: 9 * u }, info.used, g.L);
      T(S, S.l(`fuera: ${info.evicted} mensajes`, `outside: ${info.evicted} messages`), sx, r.y + 68 * u, { px: 12.5, weight: 700, color: info.evicted ? tone(S, 'err').ink : p.mute, base: 'top' });
      T(S, S.l('Respuestas típicas, ilustrativas.', 'Typical answers, illustrative.'), r.x, r.y + r.h, { px: 12, weight: 600, color: p.mute, base: 'bottom' });
    } else {
      const r = tl.rest, ph = Math.min(r.h - 54 * u, 132 * u);
      d.rect(r.x, r.y, r.w, ph, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 2, r: 5, dash: lost ? [5, 3] : undefined });
      T(S, q, r.x + 8 * u, r.y + 6 * u, { px: 12, weight: 800, color: t.ink, base: 'top', w: r.w - 16 * u });
      T(S, '«' + ans + '»', r.x + 8 * u, r.y + 44 * u, { px: 13, weight: 600, color: p.ink, base: 'top', w: r.w - 16 * u });
      T(S, `${num(S, info.used)} / ${num(S, g.L)}`, r.x, r.y + ph + 8 * u, { px: 17, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      T(S, S.l(`fuera: ${info.evicted}`, `outside: ${info.evicted}`), r.x + r.w, r.y + ph + 10 * u, { px: 12.5, weight: 700, color: info.evicted ? tone(S, 'err').ink : p.mute, align: 'right', base: 'top' });
      T(S, S.l('ilustrativo', 'illustrative'), r.x, r.y + r.h, { px: 12, weight: 600, color: p.mute, base: 'bottom' });
    }
    if (S.on('train-after') && !S.portrait && !isShort(S)) neuAt(S, tl.win.x + tl.win.len - neuW(S), tl.rest.y + 2 * u, 'wow', S.reveal('train-after', 0.2, 0.5));
  });
  void neuH; void K; void pt; void wrapLines;
}
