// Acto 4: cada turno reenvía el historial → el total procesado crece con el cuadrado de los turnos. Calculadora con
// supuestos editables (turnos, tokens por turno, prompt del sistema, precio) y la caché del prefijo como opción.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CACHE_READ, CACHE_WRITE, cachedEquivalent, inputAt, onceOnly, totalInput, usd, type CostIn } from './model';
import { K, T, Tbot, chip, isShort, mw, num, pad, stat, wrapLines } from './ui';

export const COST_FROM = 'cost-q', COST_TO = 'litm-q';
const U_NEW = 50; // tokens del mensaje nuevo en cada turno (supuesto fijo; ver «Por dentro»)

export const costOf = (S: Frame): { c: CostIn; price: number; cache: boolean } => ({
  c: { n: Math.round(S.p.n ?? 20), m: S.p.m ?? 150, u: U_NEW, S: S.p.sys ?? 0 },
  price: S.p.price ?? 3,
  cache: !!S.p.cache,
});

const usdStr = (S: Frame, v: number) => '$' + S.n(v, v < 1 ? 3 : v < 100 ? 2 : 0);

interface Box { outer: Rect; plot: Rect }
/** Marco de una gráfica con título; devuelve el rectángulo interior. */
function box(S: Frame, r: Rect, title: string, a: number): Box {
  const u = S.u;
  T(S, title, r.x, r.y, { px: 12.5, weight: 800, color: S.pal.ink2, base: 'top', a, w: r.w });
  const top = 22 * u, plot: Rect = { x: r.x + 6 * u, y: r.y + top, w: r.w - 12 * u, h: r.h - top - 22 * u };
  S.d.line(plot.x, plot.y + plot.h, plot.x + plot.w, plot.y + plot.h, S.pal.lineStrong, 1.5, undefined, a);
  S.d.line(plot.x, plot.y, plot.x, plot.y + plot.h, S.pal.lineStrong, 1.5, undefined, a);
  return { outer: r, plot };
}

export function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S);
  const aV = S.at(COST_FROM, 0, 0.5, 'out') * (1 - S.at(COST_TO, 0, 0.45, 'out'));
  if (aV <= 0) return;
  const { c, price, cache } = costOf(S);
  const n = c.n;
  const short = isShort(S);

  // geometría: dos gráficas y una fila de cifras
  let stairs: Rect, cum: Rect, stats: Rect;
  if (!S.portrait) {
    const ch = F.h * (short ? 0.6 : 0.66), gap = 20 * u, lw = (F.w - gap) * 0.52;
    stairs = { x: F.x, y: F.y, w: lw, h: ch };
    cum = { x: F.x + lw + gap, y: F.y, w: F.w - lw - gap, h: ch };
    stats = { x: F.x, y: F.y + ch + 14 * u, w: F.w, h: F.h - ch - 14 * u };
  } else {
    const h1 = F.h * 0.34, h2 = F.h * 0.3;
    stairs = { x: F.x, y: F.y, w: F.w, h: h1 };
    cum = { x: F.x, y: F.y + h1 + 8 * u, w: F.w, h: h2 };
    stats = { x: F.x, y: F.y + h1 + h2 + 14 * u, w: F.w, h: F.h - h1 - h2 - 14 * u };
  }

  d.withAlpha(aV, () => {
    // ── escalera: tokens enviados en cada turno
    const bs = box(S, stairs, S.l('tokens que se envían en cada turno', 'tokens sent on each turn'), 1);
    const pl = bs.plot, ymax = inputAt(n, c) * 1.04, bw = pl.w / n;
    const shown = S.on('cost-q') ? clamp(S.since('cost-q') / 3.2 - 0.05) * n : n;
    const tS = tone(S, 'ink'), tH = tone(S, 'lat'), tN = tone(S, 'sig');
    for (let k = 1; k <= n; k++) {
      const a = clamp(shown - (k - 1));
      if (a <= 0) continue;
      const x = pl.x + (k - 1) * bw + bw * 0.1, w = Math.max(1, bw * 0.8), hS = (c.S / ymax) * pl.h, hH = (((k - 1) * c.m) / ymax) * pl.h, hN = (c.u / ymax) * pl.h, y0 = pl.y + pl.h;
      d.withAlpha(a, () => {
        d.rect(x, y0 - hS, w, hS, { fill: alpha(tS.c, 0.55) });
        d.rect(x, y0 - hS - hH, w, hH, { fill: alpha(tH.c, 0.5) });
        d.rect(x, y0 - hS - hH - hN, w, hN, { fill: alpha(tN.c, 0.85) });
      });
    }
    T(S, '1', pl.x + bw / 2, pl.y + pl.h + 4 * u, { px: 12, weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    T(S, String(n), pl.x + pl.w - bw / 2, pl.y + pl.h + 4 * u, { px: 12, weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top' });
    T(S, S.l('turno', 'turn'), pl.x + pl.w / 2, pl.y + pl.h + 4 * u, { px: 12, weight: 700, color: p.mute, align: 'center', base: 'top' });
    // leyenda y valor del último turno
    let ly = pl.y + 4 * u;
    let lx = pl.x + 8 * u;
    ([['sistema', 'system', tS], ['historial reenviado', 'history resent', tH], ['mensaje nuevo', 'new message', tN]] as const).forEach(([es, en, t]) => {
      if (c.S === 0 && es === 'sistema') return;
      const tw = mw(S, S.l(es, en), 12, 600);
      if (lx + 14 * u + tw > pl.x + pl.w - 64 * u && lx > pl.x + 12 * u) { lx = pl.x + 8 * u; ly += 16 * u; }   // salta de línea para no pisar el valor del último turno
      d.rect(lx, ly, 10 * u, 10 * u, { fill: alpha(t.c, 0.7) });
      T(S, S.l(es, en), lx + 14 * u, ly + 5 * u, { px: 12, weight: 600, color: p.ink2, base: 'middle' });
      lx += 14 * u + tw + 12 * u;
    });
    if (shown >= n - 0.01) T(S, num(S, inputAt(n, c)), pl.x + pl.w - bw * 1.1, pl.y + pl.h - (inputAt(n, c) / ymax) * pl.h + 2 * u, { px: 13, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'top', a: S.reveal('cost-q', 3.4, 0.4), halo: true });

    // ── acumulado
    if (S.on('cost-sum')) {
      const aC = S.reveal('cost-sum', 0.2, 0.5);
      const total = totalInput(c), once = onceOnly(c), ceq = cachedEquivalent(c), yTop = Math.max(total, 1) * 1.05;
      d.withAlpha(aC, () => {
        const bc = box(S, cum, S.l('tokens procesados, acumulados', 'tokens processed, cumulative'), 1), q = bc.plot;
        const X = (k: number) => q.x + (k / n) * q.w, Y = (v: number) => q.y + q.h - (v / yTop) * q.h;
        const prog = S.at('cost-sum', 0.3, 2.4, 'io');
        const upto = Math.max(1, Math.round(n * prog));
        const line = (f: (k: number) => number, t: ReturnType<typeof tone>, lw: number, dash?: number[]) => {
          const pts: [number, number][] = [];
          for (let k = 0; k <= upto; k++) pts.push([X(k), Y(f(k))]);
          d.polyline(pts, t.c, lw, { dash });
        };
        let acc = 0; const cumFull: number[] = [0]; for (let k = 1; k <= n; k++) { acc += inputAt(k, c); cumFull.push(acc); }
        let accC = 0; const cumCache: number[] = [0]; for (let k = 1; k <= n; k++) { accC += k === 1 ? CACHE_WRITE * inputAt(1, c) : CACHE_READ * inputAt(k - 1, c) + CACHE_WRITE * c.m; cumCache.push(accC); }
        line((k) => c.S + k * c.m, tone(S, 'mute'), 2, [5, 4]);
        line((k) => cumFull[k], tone(S, 'err'), 3);
        if (cache) line((k) => cumCache[k], tone(S, 'dat'), 3);
        // rótulos al final de cada línea
        if (prog > 0.95) {
          T(S, S.l('reenviando todo', 'resending everything'), q.x + q.w - 4 * u, Y(total) + 4 * u, { px: 12.5, weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'top', halo: true });
          T(S, S.l('cada token, una vez', 'each token, once'), q.x + q.w - 4 * u, Y(once) - 6 * u, { px: 12.5, weight: 700, color: p.mute, align: 'right', base: 'bottom', halo: true });
          if (cache) T(S, S.l('con caché', 'with caching'), q.x + q.w - 4 * u, Y(ceq) - 6 * u, { px: 12.5, weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'bottom', halo: true });
        }
      });
      // ── cifras
      const aS = S.reveal('cost-sum', 0.9, 0.5);
      const toks = cache ? ceq : total, cost = usd(toks, price), per1k = cost * 1000;
      d.withAlpha(aS, () => {
        const cols = S.portrait || short ? 2 : 4, cw = stats.w / cols, rh = (S.portrait ? 46 : short ? 38 : 56) * u;
        const items: [string, string, 'err' | 'dat' | 'ink' | 'sig'][] = [
          [S.l('tokens procesados', 'tokens processed'), num(S, total), 'err'],
          [S.l('si cada token, una vez', 'if each token, once'), num(S, once) + (once > 0 ? ' · ×' + S.n(total / once, 1) : ''), 'ink'],
          [cache ? S.l('con caché (equiv.)', 'with caching (equiv.)') : S.l('costo por conversación', 'cost per conversation'), cache ? num(S, ceq) + ' · ' + usdStr(S, cost) : usdStr(S, cost), cache ? 'dat' : 'sig'],
          [S.l('por mil conversaciones', 'per thousand conversations'), usdStr(S, per1k), 'sig'],
        ];
        items.forEach(([l, v, t], i) => stat(S, stats.x + (i % cols) * cw, stats.y + Math.floor(i / cols) * rh, l, v, { tone: t, px: S.portrait ? 18 : short ? 17 : 21 }));
        const note = S.l(`Supuestos: ${usdStr(S, price)} por millón de tokens de entrada, mensaje nuevo de ${U_NEW} tokens; sin tokens de salida.`, `Assumptions: ${usdStr(S, price)} per million input tokens, ${U_NEW}-token new message; output tokens not included.`);
        Tbot(S, note, stats.x, stats.y + stats.h, { px: 12, weight: 600, color: p.mute, w: stats.w });
        // «cost-play»: qué probar, con una marca cuando se hizo (cambio visible del segmento)
        if (S.on('cost-play')) {
          const aP = S.reveal('cost-play', 0.2, 0.5), rowsH = Math.ceil(items.length / cols) * rh, noteH = wrapLines(S, note, stats.w, 12, 600).length * 12 * K(S) * 1.3;
          if (stats.h >= rowsH + 26 * u + noteH + 8 * u) {
            d.withAlpha(aP, () => {
              const cy = stats.y + rowsH + 12 * u, lab = S.l('Prueba:', 'Try:');
              T(S, lab, stats.x, cy, { px: 12.5, weight: 700, color: p.mute, base: 'middle' });
              let x = stats.x + mw(S, lab, 12.5, 700) + 10 * u;
              const todo: [string, boolean][] = [
                [S.l(`sistema largo (≥ ${num(S, 1000)})`, `long system prompt (≥ ${num(S, 1000)})`), c.S >= 1000],
                [S.l('con caché', 'with caching'), cache],
              ];
              todo.forEach(([t, ok]) => {
                const r = chip(S, t, x, cy, { tone: ok ? 'dat' : undefined, align: 'left' });
                x += r.w + 6 * u;
                if (ok) { const k = 5 * u, td = tone(S, 'dat'); d.polyline([[x, cy], [x + k * 0.8, cy + k * 0.9], [x + k * 2.2, cy - k * 0.9]], td.c, 2.5); x += k * 2.2 + 4 * u; }
                x += 8 * u;
              });
            });
          } else {
            // sin espacio para las marcas: se enmarca la cifra del costo
            const cwx = stats.x + (2 % cols) * cw, cyy = stats.y + Math.floor(2 / cols) * rh;
            d.rect(cwx - 5 * u, cyy - 3 * u, cw - 10 * u, 39 * u, { stroke: tone(S, 'sig').c, lw: 2, r: 4, a: aP });
          }
        }
      });
    }
  });
}
