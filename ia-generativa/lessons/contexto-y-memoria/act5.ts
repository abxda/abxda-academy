// Acto 5: «perdido en el medio». Datos reales de Liu et al. (2023), figura 5 y tabla 1 (ver model.ts), y el hallazgo de RULER (2024).
import { alpha, clamp, ease, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LITM, LITM_POS, litmAt, litmRow } from './model';
import { K, T, Tbot, card, chip, isShort, mw, pad, wrapLines } from './ui';

export const LITM_FROM = 'litm-q', LITM_TO = 'memory-q';
export interface LitmSt { mid: boolean; edge: boolean }
export const litmSt = (S: Frame): LitmSt => (S.st.litm ??= { mid: false, edge: false } as LitmSt);

const YR: [number, number] = [25, 95];

/** Posición «mostrada»: la narración la mueve sola hasta el gate; después manda la persona. */
function posShown(S: Frame): number {
  if (S.on('try-litm')) return S.p.pos ?? 1;
  if (S.on('litm-u')) return S.since('litm-u') < 4 ? ease.io(clamp((S.since('litm-u') - 1.0) / 1.6)) * 9 + 1 : 10; // 1 → 10
  if (S.on('litm-q')) { const t = clamp((S.since('litm-q') - 0.8) / 4.2); return t < 0.5 ? 1 + ease.io(t / 0.5) * 19 : 20 - ease.io((t - 0.5) / 0.5) * 19; } // 1 → 20 → 1
  return 1;
}

export function drawLitm(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S);
  const aV = S.at(LITM_FROM, 0, 0.5, 'out') * (1 - S.at(LITM_TO, 0, 0.45, 'out'));
  if (aV <= 0) return;
  const model = litmRow(S.on('try-litm') ? String(S.p.model ?? 'gpt') : 'gpt');
  const pos = posShown(S), posI = Math.round(pos);
  const ruler = S.on('litm-ruler') ? S.at('litm-ruler', 0, 0.5, 'out') : 0;

  d.withAlpha(aV * (1 - 0.96 * ruler), () => {
    // ── fila de 20 documentos
    const cols = S.portrait ? 10 : 20, rows = S.portrait ? 2 : 1, gap = 3 * u;
    const cell = Math.min((F.w - gap * (cols - 1)) / cols, S.portrait ? 30 * u : 36 * u), rowW = cols * cell + gap * (cols - 1);
    const x0 = F.x + (F.w - rowW) / 2, y0 = F.y + 20 * u;
    T(S, S.l('20 documentos · solo uno tiene la respuesta', '20 documents · only one has the answer'), F.x, F.y, { px: 12.5, weight: 800, color: p.ink2, base: 'top', a: S.reveal(LITM_FROM, 0, 0.4) });
    for (let i = 0; i < 20; i++) {
      const a = S.at(LITM_FROM, 0.1 + i * 0.03, 0.4 + i * 0.03, 'out');
      if (a <= 0) continue;
      const cx = x0 + (i % cols) * (cell + gap), cy = y0 + Math.floor(i / cols) * (cell + gap), hit = i + 1 === posI, t = tone(S, hit ? 'sig' : 'mute');
      d.withAlpha(a, () => {
        d.rect(cx, cy, cell, cell, { fill: hit ? alpha(t.c, 0.55) : alpha(p.surface, 0.8), stroke: hit ? t.c : p.lineStrong, lw: hit ? 2.5 : 1, r: 2 });
        if (hit) d.polyline([[cx + cell * 0.25, cy + cell * 0.52], [cx + cell * 0.43, cy + cell * 0.7], [cx + cell * 0.76, cy + cell * 0.3]], p.stage, 3);
        else d.line(cx + cell * 0.25, cy + cell * 0.35, cx + cell * 0.75, cy + cell * 0.35, p.line, 1.5);
        if (!hit && cell > 22 * u) d.line(cx + cell * 0.25, cy + cell * 0.6, cx + cell * 0.65, cy + cell * 0.6, p.line, 1.5);
        if ([1, 5, 10, 15, 20].includes(i + 1) && !S.portrait) T(S, String(i + 1), cx + cell / 2, cy + cell + 3 * u, { px: 12, weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top' });
      });
    }
    const gridBottom = y0 + rows * (cell + gap) + (S.portrait ? 2 : 20) * u;

    // ── gráfica: acierto vs posición
    const short = isShort(S), ph = F.y + F.h - gridBottom - (S.portrait ? 96 : short ? 8 : 46) * u;
    const outer: Rect = { x: F.x, y: gridBottom + 6 * u, w: S.portrait ? F.w : F.w * (short ? 0.62 : 0.68), h: Math.max(60 * u, ph) };
    const pl: Rect = { x: outer.x + 34 * u, y: outer.y + 6 * u, w: outer.w - 44 * u, h: outer.h - (S.portrait ? 40 : 34) * u };
    const X = (v: number) => pl.x + ((v - 1) / 19) * pl.w, Y = (v: number) => pl.y + pl.h - ((v - YR[0]) / (YR[1] - YR[0])) * pl.h;
    const aAx = S.reveal(LITM_FROM, 0.6, 0.6);
    d.withAlpha(aAx, () => {
      [30, 50, 70, 90].forEach((v) => { d.line(pl.x, Y(v), pl.x + pl.w, Y(v), p.line, 1); T(S, v + ' %', pl.x - 6 * u, Y(v), { px: 12, weight: 600, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
      d.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, p.lineStrong, 1.5);
      LITM_POS.forEach((v) => T(S, String(v), X(v), pl.y + pl.h + 5 * u, { px: 12, weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top' }));
      T(S, S.l('posición del documento con la respuesta', 'position of the document with the answer'), pl.x + pl.w, pl.y + pl.h + 20 * u, { px: 12, weight: 700, color: p.ink2, align: 'right', base: 'top' });
      T(S, S.l('acierto', 'accuracy'), outer.x, outer.y - 4 * u, { px: 12, weight: 700, color: p.ink2, base: 'bottom' });
    });

    const showCurve = S.on('litm-u'), tm = tone(S, 'lat');
    // referencias: sin documentos / solo el correcto
    const showClosed = S.on('litm-closed'), showOracle = S.on('litm-u');
    const clipped = (fn: () => void) => d.clip(pl.x, pl.y, pl.w, pl.h, fn);
    if (showOracle) d.withAlpha(S.reveal('litm-u', 0.2, 0.6), () => {
      clipped(() => d.line(pl.x, Y(model.oracle), pl.x + pl.w, Y(model.oracle), tone(S, 'dat').c, 1.5, [6, 4]));
      T(S, S.n(model.oracle, 0) + ' %', pl.x + pl.w - 2 * u, Y(model.oracle) - 4 * u, { px: 12.5, weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'right', base: 'bottom', halo: true });
    });
    const aClosed = S.on('try-litm') ? 1 : showClosed ? S.reveal('litm-closed', 0.2, 0.6) : 0;
    if (aClosed > 0) d.withAlpha(aClosed, () => {
      clipped(() => d.line(pl.x, Y(model.closed), pl.x + pl.w, Y(model.closed), tone(S, 'err').c, 1.5, [6, 4]));
      T(S, S.n(model.closed, 0) + ' %', pl.x + pl.w - 2 * u, Y(model.closed) + (model.closed < 52 ? -4 : 4) * u, { px: 12.5, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'right', base: model.closed < 52 ? 'bottom' : 'top', halo: true });
    });
    // las otras curvas (tenues) a partir de litm-after
    const aAll = S.on('litm-after') ? S.reveal('litm-after', 0.1, 0.7) : 0;
    if (aAll > 0) LITM.filter((r) => r.id !== model.id).forEach((r) => d.withAlpha(aAll * 0.55, () => {
      d.polyline(LITM_POS.map((v, i) => [X(v), Y(r.acc[i])] as [number, number]), p.mute, 1.5, { dash: [4, 3] });
    }));
    // curva medida
    if (showCurve) {
      const k = S.at('litm-u', 0.3, 2.0, 'lin') * 5, n = S.on('try-litm') ? 5 : k;
      const pts: [number, number][] = [];
      LITM_POS.forEach((v, i) => { const a = clamp(n - i); if (a > 0) pts.push([lerp(i ? X(LITM_POS[i - 1]) : X(v), X(v), a), lerp(i ? Y(model.acc[i - 1]) : Y(model.acc[i]), Y(model.acc[i]), a)]); });
      d.polyline(pts, tm.c, 3, { dash: undefined });
      LITM_POS.forEach((v, i) => { const a = clamp(n - i); if (a > 0.6) { d.circle(X(v), Y(model.acc[i]), 5 * u, { fill: tm.c, stroke: p.stage, lw: 1.5 }); } });
      // etiquetas de los extremos y del medio (modelo por defecto en la narración)
      if (!S.on('try-litm') || true) {
        const lab = (i: number, dy: number) => T(S, S.n(model.acc[i], 0) + ' %', X(LITM_POS[i]), Y(model.acc[i]) + dy * u, { px: 13, weight: 800, font: 'mono', color: tm.ink, align: i === 0 ? 'left' : i === 4 ? 'right' : 'center', base: dy < 0 ? 'bottom' : 'top', halo: true, a: clamp(n - i - 0.2) });
        lab(0, -9); lab(2, 9); lab(4, -9);
      }
    }
    // marcador de la posición elegida (gate): guía vertical y valor
    if (S.on('try-litm')) {
      const { v, measured } = litmAt(model, posI);
      d.line(X(posI), pl.y, X(posI), pl.y + pl.h, tone(S, 'sig').c, 1.5, [3, 3]);
      d.circle(X(posI), Y(v), 8 * u, { stroke: tone(S, 'sig').c, lw: 3, fill: alpha(p.stage, 0.8) });
    }
    // lectura a la derecha / abajo
    const rd: Rect = S.portrait ? { x: F.x, y: outer.y + outer.h + 10 * u, w: F.w, h: 62 * u } : { x: outer.x + outer.w + 16 * u, y: outer.y, w: F.x + F.w - (outer.x + outer.w) - 16 * u, h: outer.h };
    const lrow = (x: number, y: number, tn: 'dat' | 'err' | 'mute', text: string, dash = true) => { const c = tn === 'mute' ? p.mute : tone(S, tn).c; d.line(x, y + 7 * u, x + 20 * u, y + 7 * u, c, 1.5, dash ? [5, 3] : undefined); T(S, text, x + 26 * u, y + 7 * u, { px: 12, weight: 600, color: tn === 'mute' ? p.ink2 : tone(S, tn).ink, base: 'middle', w: S.portrait ? rd.w * 0.52 - 30 * u : rd.w - 30 * u }); };
    const legend: [('dat' | 'err' | 'mute'), string][] = [];
    if (showOracle) legend.push(['dat', S.l(`solo el correcto · ${S.n(model.oracle, 0)} %`, `only the right one · ${S.n(model.oracle, 0)}%`)]);
    if (aClosed > 0) legend.push(['err', S.l(`sin documentos · ${S.n(model.closed, 0)} %`, `no documents · ${S.n(model.closed, 0)}%`)]);
    if (aAll > 0) LITM.filter((r) => r.id !== model.id).forEach((r) => legend.push(['mute', r.name]));
    if (S.on('try-litm')) {
      const { v, measured } = litmAt(model, posI), better = v >= model.closed;
      T(S, model.name, rd.x, rd.y, { px: 13, weight: 800, color: tm.ink, base: 'top', w: S.portrait ? rd.w * 0.46 : rd.w });
      if (!S.portrait) T(S, S.l('acierto', 'accuracy'), rd.x, rd.y + 20 * u, { px: 12, weight: 700, color: p.mute, base: 'top' });
      T(S, (measured ? '' : '≈ ') + S.n(v, 0) + ' %', rd.x, rd.y + (S.portrait ? 17 : 34) * u, { px: S.portrait ? 24 : 30, weight: 800, font: 'mono', color: better ? p.ink : tone(S, 'err').ink, base: 'top' });
      const nx = S.portrait ? rd.x + rd.w * 0.3 : rd.x, ny = S.portrait ? rd.y + 36 * u : rd.y + 76 * u, nw = S.portrait ? rd.w * 0.2 : rd.w;
      void nx; void ny; void nw;
      const note = better ? (measured ? S.l('valor medido', 'measured value') : S.l('interpolado entre medidas', 'interpolated between measurements')) : S.l('peor que sin documentos', 'worse than no documents');
      if (S.portrait) T(S, note, rd.x, rd.y + 48 * u, { px: 12, weight: 700, color: better ? p.mute : tone(S, 'err').ink, base: 'top', w: rd.w * 0.5 });
      else { T(S, measured ? S.l('valor medido', 'measured value') : S.l('interpolado entre medidas', 'interpolated between measurements'), rd.x, rd.y + 74 * u, { px: 12, weight: 600, color: p.mute, base: 'top', w: rd.w }); if (!better) T(S, S.l('peor que sin documentos', 'worse than no documents'), rd.x, rd.y + 94 * u, { px: 12.5, weight: 800, color: tone(S, 'err').ink, base: 'top', w: rd.w }); }
    } else if (!S.portrait && S.on('litm-u')) {
      T(S, S.l('Medido en 2023.', 'Measured in 2023.'), rd.x, rd.y, { px: 12.5, weight: 700, color: p.mute, base: 'top', w: rd.w });
    }
    if (!S.portrait) { let ly = rd.y + (S.on('try-litm') ? 124 : 26) * u; legend.forEach(([tn, tx], i) => { if (tn === 'mute' && i > 0 && legend[i - 1][0] !== 'mute') { T(S, S.l('otros modelos', 'other models'), rd.x, ly, { px: 12, weight: 700, color: p.mute, base: 'top' }); ly += 18 * u; } lrow(rd.x, ly, tn, tx); ly += 20 * u; }); }
    else { let ly = rd.y; const lx = rd.x + rd.w * 0.5; [...legend.filter(([tn]) => tn !== 'mute'), ...(aAll > 0 ? [['mute', S.l('otros modelos', 'other models')] as ['mute', string]] : [])].forEach(([tn, tx]) => { lrow(lx, ly, tn, tx); ly += 20 * u; }); }
    Tbot(S, S.l('Datos: Liu et al. (2023), tabla 6 (apéndice G) y tabla 1.', 'Data: Liu et al. (2023), table 6 (appendix G) and table 1.'), F.x, F.y + F.h, { px: 12, weight: 600, color: p.mute, w: F.w, a: S.reveal(LITM_FROM, 0.8, 0.5) });
  });

  // ── RULER: la mitad
  if (ruler > 0) d.withAlpha(ruler, () => {
    const cw = Math.min(F.w, 600 * u), ch = Math.min(F.h * 0.84, 290 * u), r: Rect = { x: F.x + (F.w - cw) / 2, y: F.y + (F.h - ch) / 2, w: cw, h: ch };
    card(S, r, { tone: 'ink', title: S.l('RULER · Hsieh et al., 2024', 'RULER · Hsieh et al., 2024') });
    const cols = 10, rows = 2, cs = Math.min(34 * u, (r.w - 40 * u) / cols), gx = r.x + (r.w - cols * cs) / 2, gy = r.y + 44 * u;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i, good = k < 10, t = tone(S, good ? 'dat' : 'err');
      const a = S.at('litm-ruler', 0.4 + k * 0.04, 0.9 + k * 0.04, 'out');
      d.withAlpha(a, () => { d.rect(gx + i * cs, gy + j * cs, cs - 3 * u, cs - 3 * u, { fill: good ? alpha(t.c, 0.7) : undefined, stroke: t.c, lw: 1.5, dash: good ? undefined : [3, 2] }); });
    }
    const ty = gy + rows * cs + 12 * u, t1 = S.l('modelos que declaraban 32 mil tokens o más', 'models that claimed 32 thousand tokens or more');
    T(S, t1, r.x + r.w / 2, ty, { px: 14.5, weight: 800, color: p.ink, align: 'center', base: 'top', w: r.w - 30 * u });
    const h1 = wrapLines(S, t1, r.w - 30 * u, 14.5, 800).length * 14.5 * K(S) * 1.3;
    T(S, S.l('verde: rinde bien a 32 mil · punteado: no (la mitad)', 'green: does well at 32 thousand · dashed: does not (half)'), r.x + r.w / 2, ty + h1 + 10 * u, { px: 12.5, weight: 700, color: p.ink2, align: 'center', base: 'top', w: r.w - 30 * u });
    T(S, S.l('Ilustra la proporción, no el número de modelos.', 'Illustrates the proportion, not the number of models.'), r.x + r.w / 2, r.y + r.h - 8 * u, { px: 12, weight: 600, color: p.mute, align: 'center', base: 'bottom' });
  });
  void chip; void mw;
}
