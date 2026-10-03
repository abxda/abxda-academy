// Acto 5 · ¿Habilidades «emergentes»? Un modelo SINTÉTICO (ilustrativo, no son datos de modelos reales) que reproduce el
// mecanismo de Schaeffer et al. (2023): la pérdida por token baja suave, pero una métrica «todo o nada» sobre k tokens
// (p^k) parece un salto. Con una métrica gradual (el promedio por token, p), la curva es suave.
import { Plot, alpha, clamp, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ceTok, exactMatch, pTok } from './model';
import { FS, axes, fitText, log10, pow10, tagText } from './ui';

const XR: [number, number] = [8, 13];

interface View { k: number; mix: number; showPartial: boolean; gate: boolean }
function view(S: Frame): View {
  if (S.between('try-metric', 'verdict')) { const m = S.p.metric ?? 'exact'; return { k: S.p.kk ?? 10, mix: m === 'partial' ? 1 : 0, showPartial: true, gate: true }; }
  if (S.on('verdict')) return { k: 10, mix: 1, showPartial: true, gate: false };
  if (S.on('mirage')) return { k: 10, mix: S.at('mirage', 1.8, 3.0, 'io'), showPartial: true, gate: false };
  return { k: 10, mix: 0, showPartial: false, gate: false };
}

export function drawAct5(S: Frame) {
  const { d, pal: p } = S, u = S.u;
  const R = regions(S, S.portrait ? 0.66 : 0.64);
  const a = S.reveal('emergent', 0, 0.7), V = view(S);
  if (a <= 0) return;
  const plot = new Plot(S, R.main, { xr: XR, yr: [0, 1], pad: { l: 46, b: 44, t: 24, r: 10 } });
  const dat = tone(S, 'dat'), sig = tone(S, 'sig');
  d.withAlpha(a, () => {
    axes(S, plot, { xTicks: [8, 9, 10, 11, 12, 13], yTicks: [0, 0.5, 1], xFmt: pow10, yFmt: (v) => `${Math.round(v * 100)} %`, xLabel: S.l('parámetros N', 'parameters N'), yLabel: S.l('acierto en la tarea', 'task success'), grid: true });
    // curva «todo o nada» y puntaje parcial
    const exactA = 1 - 0.62 * V.mix, partialA = V.showPartial ? 0.38 + 0.62 * V.mix : 0;
    plot.curve((x) => exactMatch(10 ** x, V.k), 'dat', 2 + 1.6 * exactA, { n: 140, a: 0.45 + 0.55 * exactA, dash: exactA < 0.6 ? [6, 5] : undefined });
    if (partialA > 0) plot.curve((x) => pTok(10 ** x), 'sig', 2 + 1.6 * partialA, { n: 140, a: 0.45 + 0.55 * partialA, dash: partialA < 0.6 ? [6, 5] : undefined });
    // leyenda
    const lx = plot.r.x + 12 * u, ly = plot.r.y + 14 * u;
    d.line(lx, ly, lx + 26 * u, ly, dat.c, 3.4); fitText(S, S.l(`todo o nada: los ${V.k} tokens exactos`, `all or nothing: all ${V.k} tokens exact`), lx + 34 * u, ly, plot.r.w - 52 * u, 13, { weight: 700, color: dat.ink, base: 'middle' });
    if (V.showPartial) {
      d.line(lx, ly + 22 * u, lx + 26 * u, ly + 22 * u, sig.c, 3.4);
      fitText(S, S.l('puntaje parcial: acierto por token', 'partial score: per-token accuracy'), lx + 34 * u, ly + 22 * u, plot.r.w - 52 * u, 13, { weight: 700, color: sig.ink, base: 'middle' });
    }
    // «ilustrativo»
    d.text(S.l('ilustrativo: modelo sintético', 'illustrative: synthetic model'), plot.r.x + plot.r.w - 8 * u, plot.r.y + plot.r.h - 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'bottom', halo: p.stage });
  });
  void alpha; void clamp;
  drawAside5(S, R.aside, V);
}

function drawAside5(S: Frame, r: Rect, V: View) {
  const { d, pal: p } = S, u = S.u;
  if (!S.on('mirage')) {
    // el ejemplo publicado por Wei et al. (2022)
    const aa = S.reveal('emergent', 1.0, 0.7);
    d.withAlpha(aa, () => {
      d.text(S.l('Ejemplo publicado', 'Published example'), r.x, r.y + 2 * u, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' });
      d.text(S.l('Wei et al., 2022: suma y resta de tres dígitos. GPT-3 pasa de casi cero a bien por encima del azar cerca de 13 mil M de parámetros.', 'Wei et al., 2022: three-digit addition and subtraction. GPT-3 goes from near zero to well above chance near 13B parameters.'), r.x, r.y + 28 * u, { size: FS(S, 13), weight: 600, color: p.ink2, base: 'top', w: r.w, lh: 1.35 });
    });
    return;
  }
  // pérdida por token: una recta en log-log (lo predecible)
  const headH = S.portrait ? 0 : 0;
  const pr: Rect = { x: r.x, y: r.y + headH, w: r.w, h: S.between('try-metric', 'verdict') && !S.portrait ? r.h * 0.62 : r.h };
  const lo = log10(0.02), hi = log10(1.2);
  const pl = new Plot(S, pr, { xr: XR, yr: [lo, hi], pad: { l: 44, b: 38, t: 18, r: 8 } });
  const aa = S.reveal('mirage', 0.4, 0.7);
  d.withAlpha(aa, () => {
    axes(S, pl, { xTicks: [8, 10, 12], yTicks: [log10(0.03), log10(0.1), log10(0.3), log10(1)], xFmt: pow10, yFmt: (v) => S.n(10 ** v, 2), xLabel: 'N', yLabel: S.l('pérdida por token', 'loss per token'), grid: true });
    pl.curve((x) => log10(ceTok(10 ** x)), 'err', 3, { n: 40 });
    tagText(S, S.l('una recta: predecible', 'a line: predictable'), pl.r.x + pl.r.w - 6 * u, pl.r.y + 14 * u, { t: 'err', align: 'right', size: 13 });
  });
  // lectura numérica en N = 10^11 durante el turno
  if (S.between('try-metric', 'verdict') && !S.portrait) {
    const N = 1e11, y0 = pr.y + pr.h + 8 * u;
    const aR = S.reveal('try-metric', 0.4, 0.5);
    d.withAlpha(aR, () => {
      d.text(S.l(`Con N = ${pow10(11)}:`, `At N = ${pow10(11)}:`), r.x, y0, { size: FS(S, 12.5), weight: 700, color: p.mute, base: 'top' });
      d.text(`${S.l('parcial', 'partial')} ${S.n(pTok(N) * 100, 0)} %`, r.x, y0 + 20 * u, { size: FS(S, 15), weight: 800, font: 'mono', color: tone(S, 'sig').ink, base: 'top' });
      d.text(`${S.l('todo o nada', 'all or nothing')} ${S.n(exactMatch(N, V.k) * 100, 0)} %`, r.x, y0 + 42 * u, { size: FS(S, 15), weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    });
  }
}

/** true cuando la persona ya cambió a puntaje parcial o acortó la respuesta. */
export function updateMetric(S: Frame): boolean {
  if (!S.between('try-metric', 'verdict')) return false;
  const m = S.p.metric ?? 'exact', k = S.p.kk ?? 10;
  return m === 'partial' || k <= 2;
}
