// Vista 5 (formula … sqrt-fix): la fórmula como resumen de lo ya visto (Q, K, V; productos punto; softmax; mezcla) y la
// pieza que faltaba, la división entre √d, con una demostración real: una consulta y ocho claves al azar (data.ts: demoAt)
// cuyo número de valores d sube de 1 a 64. Sin dividir, softmax se vuelve «todo o nada»; dividiendo, el reparto sigue suave.
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { DIMS, demoAt } from './data';
import { area, fr, fz, isShort, kk, label, num, pct } from './ui';

interface Piece { t: string; tone?: Tone; key?: string; sub?: boolean }
const PIECES = (S: Frame): Piece[] => [
  { t: S.l('Atención', 'Attention') }, { t: ' = ' }, { t: 'softmax', key: 'soft' }, { t: '( ' },
  { t: 'Q', tone: 'sig', key: 'Q' }, { t: 'K', tone: 'w', key: 'K' }, { t: 'ᵀ', tone: 'w', key: 'T' }, { t: ' / √d', key: 'sqrt' }, { t: ' )' }, { t: ' V', tone: 'dat', key: 'V' },
];

export function drawForm(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, sh = isShort(S);
  // ── la fórmula ──
  const pieces = PIECES(S);
  let size = fz(S, P ? 20 : sh ? 19 : 24);
  const meas = () => pieces.map((pc) => d.measure(pc.t, { size, weight: 800, font: pc.key === 'soft' ? 'ui' : 'mono' }));
  let ws = meas();
  while (ws.reduce((a, b) => a + b, 0) > R.w * 0.96 && size > 12 / u) { size -= 0.5; ws = meas(); }
  const W = ws.reduce((a, b) => a + b, 0), fy1 = R.y + (P ? R.h * 0.13 : sh ? R.h * 0.16 : R.h * 0.15);
  const fy = lerp(R.y + R.h * (P ? 0.32 : sh ? 0.4 : 0.36), fy1, fr(S, 'sqrt-big', 0, 0.15, 'io'));   // la fórmula sube (se desliza) para dejar sitio a la demostración
  const xs: number[] = []; let x = R.x + (R.w - W) / 2; ws.forEach((w) => { xs.push(x); x += w; });
  const aF = fr(S, 'formula', 0.05, 0.2), aSq = fr(S, 'sqrt-what', 0.08, 0.22);
  const hlSq = fr(S, 'sqrt-what', 0.08, 0.22) * (1 - fr(S, 'heads', 0, 0.1));
  pieces.forEach((pc, i) => {
    const a = pc.key === 'sqrt' ? aSq : aF;
    if (a < 0.01) return;
    const col = pc.tone ? tone(S, pc.tone).ink : pc.key === 'sqrt' ? tone(S, 'err').ink : p.ink;
    if (pc.key === 'sqrt' && hlSq > 0.01) d.rect(xs[i] + 4 * u, fy - size * u * 0.75, ws[i] - 4 * u, size * u * 1.5, { fill: alpha(tone(S, 'err').c, 0.12), stroke: tone(S, 'err').c, lw: 1.5, r: 4, a: hlSq });
    label(S, pc.t, xs[i], fy, { a, size: pc.t === 'ᵀ' ? size * 0.8 : size, weight: 800, font: pc.key === 'soft' ? 'ui' : 'mono', color: col, align: 'left', base: pc.t === 'ᵀ' ? 'bottom' : 'middle' });
  });
  // rótulos de Q, K y V (formula): tres tablas, una fila por token
  const idx = (k: string) => pieces.findIndex((pc) => pc.key === k);
  const ly = fy + size * u * 0.9 + 6 * u, ls = fz(S, 13), k = kk(S);
  const qkv: [string, Tone, string][] = [['Q', 'sig', S.l('consultas', 'queries')], ['K', 'w', S.l('claves', 'keys')], ['V', 'dat', S.l('valores', 'values')]];
  qkv.forEach(([k, t, nm], n) => {
    const i = idx(k), a = fr(S, 'formula', 0.3 + n * 0.17, 0.42 + n * 0.17) * (1 - fr(S, 'sqrt-what', 0, 0.12));
    if (a < 0.01) return;
    const cx = xs[i] + ws[i] / 2, tc = tone(S, t).c, cw = 9 * kk(S), chh = 7 * kk(S);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) d.rect(cx - cw + c * cw, ly + r * (chh + 1), cw - 1, chh, { fill: alpha(tc, 0.5), a });
    label(S, nm, cx + (k === 'K' ? 6 * u : 0), ly + 4 * (chh + 1) + 4 * u, { a, size: ls, weight: 800, color: tone(S, t).ink, base: 'top', align: k === 'Q' ? 'right' : k === 'K' ? 'left' : 'center' });
  });
  // lo que hace cada parte (formula2): llaves arriba
  const brace = (i0: number, i1: number, txt: string, f: number, t: Tone = 'ink') => {
    const a = fr(S, 'formula2', f, f + 0.12) * (1 - fr(S, 'sqrt-what', 0, 0.12));
    if (a < 0.01) return;
    const x0 = xs[i0] + 2 * u, x1 = xs[i1] + ws[i1] - 2 * u, y = fy - size * u * 0.8;
    d.polyline([[x0, y + 4 * u], [x0, y], [x1, y], [x1, y + 4 * u]], p.ink2, 1.3, { a });
    label(S, txt, (x0 + x1) / 2, y - 4 * u, { a, size: ls, weight: 800, color: t === 'ink' ? p.ink2 : tone(S, t).ink, base: 'bottom' });
  };
  brace(idx('Q'), idx('T'), S.l('productos punto', 'dot products'), 0.1);
  brace(idx('soft'), idx('soft'), S.l('pesos', 'weights'), 0.4, 'sig');
  brace(idx('V'), idx('V'), S.l('mezcla', 'blend'), 0.62, 'dat');
  // d = cuántos números tiene cada clave
  const aD = fr(S, 'sqrt-what', 0.3, 0.45) * (1 - fr(S, 'sqrt-big', 0, 0.12));
  if (aD > 0.01) {
    const cx = R.x + R.w / 2;
    label(S, S.l('d = números de cada clave', 'd = numbers in each key'), cx, ly + 2 * u, { a: aD, size: ls, weight: 700, color: tone(S, 'err').ink, base: 'top' });
    label(S, S.l('aquí 2 · en modelos reales, p. ej., 64', 'here 2 · in real models, e.g., 64'), cx, ly + 2 * u + ls * u * 1.4, { a: fr(S, 'sqrt-what', 0.6, 0.75) * aD, size: ls, color: p.mute, base: 'top' });
  }

  // ═════ la demostración de √d ═════
  if (!S.on('sqrt-big')) return;
  const aDemo = fr(S, 'sqrt-big', 0.02, 0.15);
  // d: sube de 1 a 64 en cada segmento (se ve moverse); se queda en 64
  let xd = 6;
  if (!S.on('sqrt-spike')) xd = 6 * fr(S, 'sqrt-big', 0.15, 0.7, 'io');
  else if (!S.on('sqrt-fix')) xd = 6 * fr(S, 'sqrt-spike', 0.08, 0.5, 'io');
  else xd = 6 * fr(S, 'sqrt-fix', 0.15, 0.6, 'io');
  const D = demoAt(xd);
  const top = fy1 + size * u * 0.9 + (sh ? 8 : 20) * u, bot = R.y + R.h;
  // deslizador dibujado de d (escala logarítmica)
  const sw = Math.min(R.w * (P ? 0.84 : 0.6), 460 * u), sx = R.x + (R.w - sw) / 2, sy = top + (P ? 24 : 10) * u;
  d.withAlpha(aDemo, () => {
    d.line(sx, sy, sx + sw, sy, p.line, 3);
    DIMS.forEach((dd, i) => { const tx = sx + (sw * i) / (DIMS.length - 1); d.line(tx, sy - 4 * u, tx, sy + 4 * u, p.mute, 1); label(S, String(dd), tx, sy + 7 * u, { size: fz(S, 12), color: p.mute, base: 'top', font: 'mono' }); });
    const kx = sx + (sw * xd) / (DIMS.length - 1);
    d.circle(kx, sy, 7 * u, { fill: tone(S, 'err').c, stroke: p.stage, lw: 2 });
    if (P) label(S, `d = ${Math.round(D.d)}`, kx, sy - 9 * u, { size: fz(S, 14), weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'bottom' });
    else label(S, `d = ${Math.round(D.d)}`, sx - 10 * u, sy, { size: fz(S, 14), weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'right' });
  });
  // dos columnas: sin dividir · dividiendo entre √d
  const colY = sy + (sh ? 26 : 34) * u, gap = 18 * u, cw = (R.w - gap) / 2, ch = bot - colY;
  const cols: { r: Rect; raw: boolean; a: number }[] = [
    { r: { x: R.x, y: colY, w: cw, h: ch }, raw: true, a: aDemo },
    { r: { x: R.x + cw + gap, y: colY, w: cw, h: ch }, raw: false, a: fr(S, 'sqrt-fix', 0.05, 0.18) },
  ];
  const lineMax = 12;
  cols.forEach(({ r, raw, a }) => {
    if (a < 0.01) return;
    const s = raw ? D.raw : D.scaled, w = raw ? D.wRaw : D.wScaled;
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 6 });
      const tt = raw ? S.l('sin dividir', 'not divided') : S.l('dividiendo entre √d', 'divided by √d');
      label(S, tt, r.x + r.w / 2, r.y + 6 * u, { size: fz(S, 13), weight: 800, color: raw ? p.ink : tone(S, 'err').ink, base: 'top' });
      // recta de puntuaciones
      const pl = r.x + 14 * u, pr = r.x + r.w - 14 * u, py = r.y + (sh ? 30 : 40) * u;
      const X = (v: number) => lerp(pl, pr, clamp((v + lineMax) / (2 * lineMax)));
      d.line(pl, py, pr, py, p.line, 1.5);
      [-10, -5, 0, 5, 10].forEach((t) => { d.line(X(t), py - 3 * u, X(t), py + 3 * u, p.mute, 1); });
      label(S, num(S, -10, 0), X(-10), py + 5 * u, { size: fz(S, 12), color: p.mute, base: 'top', font: 'mono' });
      label(S, '0', X(0), py + 5 * u, { size: fz(S, 12), color: p.mute, base: 'top', font: 'mono' });
      label(S, '10', X(10), py + 5 * u, { size: fz(S, 12), color: p.mute, base: 'top', font: 'mono' });
      s.forEach((v) => d.circle(X(v), py, 4.5 * u, { fill: tone(S, 'w').c, stroke: p.surface, lw: 1.5 }));
      label(S, S.l('puntuaciones', 'scores'), pl, py - 6 * u, { size: fz(S, 12), color: p.mute, align: 'left', base: 'bottom' });
      // barras de softmax
      const ba = raw ? fr(S, 'sqrt-spike', 0.02, 0.15) : 1;
      if (ba > 0.01) {
        const by0 = py + (sh ? 22 : 30) * u, bh = r.y + r.h - by0 - (sh ? 18 : 24) * u, n = w.length, bw = (pr - pl) / n;
        if (bh > 10 * u) {
          w.forEach((wi, i) => {
            const h = bh * wi;
            d.rect(pl + i * bw + bw * 0.18, by0 + bh - h, bw * 0.64, h, { fill: tone(S, 'sig').c, a: ba });
          });
          d.line(pl, by0 + bh, pr, by0 + bh, p.line, 1, undefined, ba);
          const mx = Math.max(...w);
          label(S, S.l(`peso mayor: ${pct(S, mx)}`, `largest weight: ${pct(S, mx)}`), r.x + r.w / 2, by0 + bh + 4 * u, { a: ba, size: fz(S, 12), weight: 800, color: tone(S, 'sig').ink, base: 'top' });
        }
      }
    });
  });
  void k;
}
