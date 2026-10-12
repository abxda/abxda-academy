// Vista 7 · responder o callar (abstain … thr-cost). Las 424 preguntas REALES de Pythia-1.4B (real-data.ts), cada una un
// cuadrito en la columna de su confianza: relleno = acertó, hueco = falló. A la izquierda del umbral, el sistema calla («no lo sé»).
// Las cuentas salen de stats.ts. En «thr-cost», dónde convendría el umbral para dos usos: ILUSTRATIVO.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { QA } from './real-data';
import { outcome } from './stats';
import { FS, LH, area, chip, chipW, fitText, fr, para, pct, stat, tight } from './ui';

const NCOL = 25;
const OK = [...QA.ok].map((c) => c === '1');
/** Columnas de 4 % de ancho: dentro de cada una, primero los aciertos (abajo) y luego los errores. */
const COLS: { conf: number; ok: boolean }[][] = Array.from({ length: NCOL }, () => []);
QA.conf.forEach((c, i) => COLS[Math.min(NCOL - 1, Math.floor(c * NCOL))].push({ conf: c, ok: OK[i] }));
COLS.forEach((col) => col.sort((a, b) => Number(b.ok) - Number(a.ok) || a.conf - b.conf));
const MAXN = Math.max(...COLS.map((c) => c.length));

/** Umbral que la escena muestra (lo mueve la demostración o la persona). */
export const thrOf = (S: Frame) => clamp(Number(S.p.thr ?? 0));
/** Demostración: cero, luego sube a 50 %. */
export function demoThr(S: Frame) {
  if (S.on('try-thr')) return 0.5;
  if (!S.on('abstain-demo')) return 0;
  const k = fr(S, 'abstain-demo', 0.45, 0.72, 'io');
  return Math.round(k * 0.5 * 50) / 50;
}

export function drawThresh(S: Frame) {
  const A = area(S), { d, pal: p } = S, u = S.u, vert = S.portrait, small = tight(S);
  const th = thrOf(S), o = outcome(th);
  const enter = fr(S, 'abstain', 0.05, 0.25);
  // reparto: gráfica + cuentas (a la derecha en horizontal, abajo en vertical)
  const asideW = vert ? 0 : Math.min(A.w * 0.27, 200 * u), statsH = vert ? (small ? 48 : 58) * u : 0;
  const head = para(S, S.l('Cada cuadrito es una de las 424 preguntas, puesta en su confianza', 'Each square is one of the 424 questions, placed at its confidence'), A.x, A.y, A.w - asideW, FS(S, 13), { weight: 700, color: p.ink2, a: enter, maxLines: 2 });
  const padB = (small ? 44 : 50) * u;
  const pr: Rect = { x: A.x + 4 * u, y: A.y + head + 30 * u, w: A.w - asideW - (asideW ? 18 * u : 0) - 8 * u, h: A.h - head - 30 * u - padB - statsH };
  const X = (v: number) => pr.x + v * pr.w;
  const cw = pr.w / NCOL, sq = Math.max(2, Math.min(cw - 1.5, pr.h / MAXN - 0.6)), step = Math.min(pr.h / MAXN, sq + 1);
  d.withAlpha(enter, () => {
    // eje
    d.line(pr.x, pr.y + pr.h, pr.x + pr.w, pr.y + pr.h, p.lineStrong, 1.5);
    for (let i = 0; i <= 5; i++) {
      const x = X(i / 5);
      d.line(x, pr.y + pr.h, x, pr.y + pr.h + 4 * u, p.lineStrong, 1.5);
      d.text(String(i * 20), x, pr.y + pr.h + 6 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: i === 0 ? 'left' : i === 5 ? 'right' : 'center', base: 'top' });
    }
    fitText(S, S.l('confianza (%) →', 'confidence (%) →'), pr.x + pr.w, pr.y + pr.h + 8 * u + FS(S, 12) * u * 1.4, pr.w * 0.5, 12.5, { weight: 700, color: p.ink2, align: 'right', base: 'top' });
    // la zona que calla
    if (th > 0.004) {
      d.rect(pr.x, pr.y - 4 * u, X(th) - pr.x, pr.h + 4 * u, { fill: alpha(p.ink, 0.06) });
      if (X(th) - pr.x > 70 * u) fitText(S, S.l('calla: «no lo sé»', 'silent: “I don’t know”'), pr.x + 6 * u, pr.y + 6 * u, X(th) - pr.x - 12 * u, 12.5, { weight: 800, color: p.mute, base: 'top' });
    }
    // los cuadritos
    const dat = tone(S, 'dat').c, err = tone(S, 'err').c;
    COLS.forEach((col, ci) => {
      col.forEach((q, k) => {
        const x = pr.x + ci * cw + (cw - sq) / 2, y = pr.y + pr.h - (k + 1) * step;
        const silent = q.conf < th - 1e-9;
        const a = silent ? 0.22 : 1;
        if (q.ok) d.rect(x, y, sq, sq, { fill: alpha(dat, 0.85 * a) });
        else d.rect(x + 0.5, y + 0.5, sq - 1, sq - 1, { stroke: alpha(err, a), lw: Math.max(1.2, sq * 0.28) });
      });
    });
    // la línea del umbral
    const x = X(th);
    d.line(x, pr.y - 16 * u, x, pr.y + pr.h, tone(S, 'w').c, 2.6);
    chip(S, `${S.l('umbral', 'threshold')} ${pct(S, th, 0)}`, Math.min(Math.max(x, pr.x + 50 * u), pr.x + pr.w - 50 * u), pr.y - 18 * u, 'w', { size: 12.5, solid: true });
  });
  // leyenda mínima: relleno = acertó, hueco = falló
  const lg = fr(S, 'abstain', 0.4, 0.55);
  d.withAlpha(lg * enter, () => {
    const ly = pr.y + pr.h + 8 * u + FS(S, 12) * u * 1.4, s = 9 * u;
    d.rect(A.x, ly, s, s, { fill: tone(S, 'dat').c });
    const t1 = S.l('acertó', 'right'); d.text(t1, A.x + s + 5 * u, ly + s / 2, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
    const x2 = A.x + s + 5 * u + S.d.measure(t1, { size: FS(S, 12), weight: 700 }) + 16 * u;
    d.rect(x2 + 0.5, ly + 0.5, s - 1, s - 1, { stroke: tone(S, 'err').c, lw: 2 });
    d.text(S.l('falló', 'wrong'), x2 + s + 5 * u, ly + s / 2, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
  });
  void small;
  // cuentas
  const items: [string, string, 'dat' | 'err' | 'ink'][] = [
    [S.l('aciertos', 'right'), S.n(o.correct, 0), 'dat'],
    [S.l('errores', 'wrong'), S.n(o.wrong, 0), 'err'],
    [S.l('silencios', 'silent'), S.n(o.silent, 0), 'ink'],
  ];
  const sa = fr(S, 'abstain', 0.3, 0.5);
  if (vert) {
    const cwid = A.w / 3, y = A.y + A.h - statsH + 4 * u;
    items.forEach(([l, v, t], i) => stat(S, A.x + i * cwid, y, l, v, t, { size: 22, w: cwid - 8 * u, a: sa }));
  } else {
    const x = A.x + A.w - asideW;
    items.forEach(([l, v, t], i) => stat(S, x, A.y + 10 * u + i * 62 * u, l, v, t, { size: 26, w: asideW, a: sa }));
    const ey = A.y + 10 * u + 3 * 62 * u;
    if (o.answered > 0 && ey + 40 * u < A.y + A.h) d.withAlpha(sa, () => para(S, S.l(`de lo que responde, falla ${pct(S, o.errRate, 1)}`, `of what it answers, ${pct(S, o.errRate, 1)} is wrong`), x, ey, asideW, FS(S, 12.5), { weight: 700, color: tone(S, 'err').ink, maxLines: 2 }));
  }
  // dónde ponerlo según el costo del error (ilustrativo)
  const c = fr(S, 'thr-cost', 0.3, 0.45), c2 = fr(S, 'thr-cost', 0.55, 0.7);
  const tag = (v: number, txt: string, t: 'dat' | 'err', a: number, row: number) => {
    if (a <= 0.01) return;
    const x = X(v), y = pr.y + 14 * u + row * 30 * u;
    d.withAlpha(a, () => {
      d.line(x, y + 10 * u, x, pr.y + pr.h, tone(S, t).c, 1.6, [4, 4]);
      const w = Math.min(chipW(S, txt, 12), pr.w * 0.62);
      chip(S, txt, Math.min(Math.max(x, pr.x + w / 2 + 2 * u), pr.x + pr.w - w / 2 - 2 * u), y, t, { size: 12, maxW: w });
    });
  };
  tag(0.1, S.l('recetas: umbral bajo', 'recipes: low threshold'), 'dat', c, 1);
  tag(0.85, S.l('dosis o cita legal: alto', 'dose, legal citation: high'), 'err', c2, 2);
  void LH;
}
