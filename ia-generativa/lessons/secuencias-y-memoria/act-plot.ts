// Segundo acto: cuánta culpa llega a n pasos de distancia según el tamaño g de los pesos recurrentes (escala logarítmica).
import { alpha, clamp, inset, lerp, split, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { G_DEFAULT, NL, TMAX, curveFor } from './model';
import { fit, fz, num, panel, pct, rich, times, type Part, uu } from './ui';

/** g cuantizado (paso 0,05): acota el trabajo de cálculo y el caché. */
export const gq = (g: number) => Math.round(g * 20) / 20;
export const GOAL_N = 10, GOAL_V = 0.5;

/** Recorrido de g que acompaña a la narración de «regimes»: pequeño → grande → de vuelta al valor por defecto. */
export function gTour(S: Frame): number {
  const t = S.since('regimes');
  if (t < 0.6) return G_DEFAULT;
  if (t < 2.2) return lerp(G_DEFAULT, 0.4, (t - 0.6) / 1.6);
  if (t < 3.0) return 0.4;
  if (t < 5.0) return lerp(0.4, 2.3, (t - 3.0) / 2.0);
  if (t < 6.2) return 2.3;
  if (t < 7.6) return lerp(2.3, G_DEFAULT, (t - 6.2) / 1.4);
  return G_DEFAULT;
}
export const gShown = (S: Frame) => gq(S.on('try-g') ? Number(S.p.g ?? G_DEFAULT) : S.on('regimes') ? gTour(S) : G_DEFAULT);

const LOGLO = -5, LOGHI = 2;
const ly = (v: number) => clamp(Math.log10(Math.max(v, 1e-12)), LOGLO, LOGHI);

export function plotLayout(S: Frame) {
  const u = uu(S), all = inset(S.full(), 14 * u);
  const [main, aside] = S.portrait ? split(all, 'v', 0.6, 10 * u) : split(all, 'h', 0.64, 12 * u);
  return { all, main, aside };
}

export function drawPlot(S: Frame, a: number) {
  if (a <= 0) return;
  const { d, pal: p } = S, u = uu(S), { main, aside } = plotLayout(S), g = gShown(S), c = curveFor(g);
  const err = tone(S, 'err'), wt = tone(S, 'w'), dat = tone(S, 'dat');
  const padL = 56 * u, padB = 42 * u, padT = 34 * u, padR = 12 * u;
  const pr: Rect = { x: main.x + padL, y: main.y + padT, w: main.w - padL - padR, h: main.h - padT - padB };
  const X = (n: number) => pr.x + (n / TMAX) * pr.w, Y = (v: number) => pr.y + pr.h - ((ly(v) - LOGLO) / (LOGHI - LOGLO)) * pr.h;
  d.withAlpha(a, () => {
    // ejes y rejilla (una línea por potencia de diez, rótulos cada dos)
    for (let k = LOGLO; k <= LOGHI; k++) {
      const y = pr.y + pr.h - ((k - LOGLO) / (LOGHI - LOGLO)) * pr.h;
      d.line(pr.x, y, pr.x + pr.w, y, k === 0 ? p.lineStrong : p.line, k === 0 ? 1.6 : 1, k === 0 ? undefined : [2, 4]);
      if (k % 2 === 0) d.text(k >= 0 ? `×${Math.pow(10, k)}` : `×${num(S, Math.pow(10, k), -k)}`, pr.x - 7 * u, y, { size: fz(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' });
    }
    d.line(pr.x, pr.y, pr.x, pr.y + pr.h, p.lineStrong, 1.5); d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5);
    [0, 10, 20, 30].forEach((n) => { d.line(X(n), pr.y + pr.h, X(n), pr.y + pr.h + 4 * u, p.lineStrong, 1.5); d.text(String(n), X(n), pr.y + pr.h + 7 * u, { size: fz(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    fit(S, S.l('pasos hacia atrás', 'steps back'), pr.x + pr.w, pr.y + pr.h + 26 * u, pr.w * 0.6, { size: 12.5, weight: 700, color: p.ink2, align: 'right' });
    fit(S, S.l('culpa que llega, según la distancia', 'blame that arrives, by distance'), main.x + 2, main.y + 10 * u, main.w * 0.95, { size: 12.5, weight: 700, color: p.ink2, align: 'left' });
    // la frase del ejemplo: cinco pasos
    d.line(X(5), pr.y, X(5), pr.y + pr.h, wt.c, 1.4, [5, 4]);
    fit(S, S.l('«flores»', '“flowers”'), X(5) + 4 * u, pr.y + 11 * u, 70 * u, { size: 12, weight: 700, color: wt.ink, align: 'left' });
    // frases sueltas y frase típica
    const ln = Math.min(NL, c.lines.length);
    for (let j = 0; j < ln; j++) {
      const pts: [number, number][] = c.lines[j].map((v, n) => [X(n), Y(v)]);
      d.clip(pr.x, pr.y, pr.w, pr.h, () => d.polyline(pts, alpha(err.c, 0.9), 1.2, { a: 0.3 }));
    }
    d.clip(pr.x, pr.y, pr.w, pr.h, () => d.polyline(c.typ.map((v, n) => [X(n), Y(v)] as [number, number]), err.c, 3.6));
    // meta del turno
    if (S.on('try-g')) {
      const met = c.typ[GOAL_N] >= GOAL_V;
      d.circle(X(GOAL_N), Y(GOAL_V), 7 * u, { stroke: dat.c, lw: 2.5, fill: met ? alpha(dat.c, 0.35) : S.pal.stage });
      fit(S, S.l('meta', 'goal'), X(GOAL_N) + 11 * u, Y(GOAL_V) - 9 * u, 50 * u, { size: 12, weight: 700, color: dat.ink, align: 'left', halo: true });
      // dispersión entre frases a diez pasos
      const x = X(GOAL_N) + 20 * u;
      d.line(x, Y(c.p90), x, Y(c.p10), wt.c, 2.5); d.line(x - 4 * u, Y(c.p90), x + 4 * u, Y(c.p90), wt.c, 2.5); d.line(x - 4 * u, Y(c.p10), x + 4 * u, Y(c.p10), wt.c, 2.5);
      fit(S, S.l('entre frases', 'across sentences'), x + 8 * u, (Y(c.p90) + Y(c.p10)) / 2, 100 * u, { size: 12, weight: 700, color: wt.ink, align: 'left', halo: true });
    }
    // etiquetas de las líneas
    if (!S.on('try-g')) fit(S, S.l('frase típica', 'typical sentence'), X(TMAX) - 4 * u, Y(c.typ[TMAX - 3]) - 12 * u, 120 * u, { size: 12.5, weight: 700, color: err.ink, align: 'right', halo: true });
    const lab = S.l(`g = ${num(S, g, 2)}`, `g = ${num(S, g, 2)}`);
    S.d.tag(lab, pr.x + pr.w - 4 * u, pr.y + pr.h * 0.9, { color: wt.ink, fill: wt.soft, stroke: wt.c, align: 'right', size: fz(S, 13), font: 'mono' });
  });
  drawAside(S, aside, a, g, c);
}

function drawAside(S: Frame, r: Rect, a: number, g: number, c: ReturnType<typeof curveFor>) {
  const { d } = S, u = uu(S), inn = panel(S, r, a);
  const err = tone(S, 'err'), wt = tone(S, 'w'), dat = tone(S, 'dat');
  const rows: { l: string; v: string; t: 'w' | 'err' | 'dat'; on: boolean }[] = [
    { l: S.l('tamaño de pesos g', 'weight size g'), v: num(S, g, 2), t: 'w', on: true },
    { l: S.l('factor típico por paso', 'typical factor per step'), v: times(S, c.factor, 2), t: 'err', on: true },
    { l: S.l('a diez pasos', 'at ten steps'), v: times(S, c.typ[10], c.typ[10] < 0.01 ? 4 : 3), t: 'err', on: true },
    { l: S.l('unidades saturadas', 'saturated units'), v: pct(S, c.sat), t: 'dat', on: true },
  ];
  const cols = S.portrait ? 2 : 1, rowH = (S.portrait ? 44 : 50) * u, cw = inn.w / cols;
  d.withAlpha(a, () => {
    rows.forEach((it, i) => {
      const x = inn.x + (i % cols) * cw, y = inn.y + Math.floor(i / cols) * rowH;
      fit(S, it.l, x, y + 6 * u, cw - 6 * u, { size: 12, weight: 700, color: S.pal.mute, align: 'left' });
      fit(S, it.v, x, y + 6 * u + 18 * u, cw - 6 * u, { size: S.portrait ? 18 : 20, weight: 700, color: tone(S, it.t).ink, align: 'left', font: 'mono' });
    });
    // veredicto
    const y0 = inn.y + Math.ceil(rows.length / cols) * rowH + 6 * u;
    if (S.on('try-g') && y0 < inn.y + inn.h - 16 * u) {
      const typ = c.typ[10], met = typ >= GOAL_V;
      const msg = met
        ? S.l(`Llega la mitad, pero con ${pct(S, c.sat)} de unidades saturadas y, según la frase, entre ${times(S, c.p10, 2)} y ${times(S, c.p90, 1)}.`, `Half arrives, but with ${pct(S, c.sat)} of units saturated and, depending on the sentence, anywhere from ${times(S, c.p10, 2)} to ${times(S, c.p90, 1)}.`)
        : typ >= 0.1
          ? S.l(`Mejora, pero a diez pasos solo llega ${times(S, typ, 2)}.`, `Better, but at ten steps only ${times(S, typ, 2)} arrives.`)
          : S.l(`Se apaga: a diez pasos queda ${times(S, typ, typ < 0.01 ? 4 : 3)}.`, `It fades out: at ten steps only ${times(S, typ, typ < 0.01 ? 4 : 3)} is left.`);
      d.text(msg, inn.x, y0, { size: fz(S, 12.5), weight: 700, color: met ? wt.ink : err.ink, w: inn.w, base: 'top' });
    } else if (S.between('regimes', 'try-g')) {
      const msg = g < 0.7 ? S.l('Pesos pequeños: la culpa se apaga.', 'Small weights: the blame fades out.') : g > 1.8 ? S.l('Pesos grandes: errática y estado saturado.', 'Large weights: erratic, saturated state.') : S.l('Valor intermedio.', 'In between.');
      d.text(msg, inn.x, y0, { size: fz(S, 12.5), weight: 700, color: g < 0.7 ? err.ink : wt.ink, w: inn.w, base: 'top' });
    }
  });
  void rich; void fit;
}
export type { Part };
