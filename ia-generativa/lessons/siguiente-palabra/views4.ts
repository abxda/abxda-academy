// Cierre: ¿cómo escribe un ensayo algo que solo predice?, la advertencia (lo probable no es lo verdadero), la escala de
// GPT-1 a GPT-3 (cifras de sus artículos), el resumen con el bucle y el puente a los tokens.
import { alpha, clamp, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import type { Demo } from './demo';
import { area, chip, fitSize, fr, fz, isShort, kk, label, loopDiagram, probBars } from './helpers';

// ═════════ el ensayo ═════════
export function drawEssay(S: Frame, D: Demo) {
  const { d, pal: p } = S, R = area(S), k = kk(S), u = S.u, P = S.portrait, lat = tone(S, 'lat');
  const aH = fr(S, 'essay-hard', 0, 0.1), aT = fr(S, 'honest', 0, 0.1);
  // la página del ensayo
  if (aH < 0.99) d.withAlpha(1 - aH, () => {
    const pw = P ? R.w * 0.8 : Math.min(R.w * 0.42, R.h * 0.85), ph = P ? R.h - 22 * k - 64 * k : R.h * 0.86;
    const pg: Rect = { x: R.x + (R.w - pw) / 2 + (P ? 10 * u : 0), y: P ? R.y + 22 * k : R.y + (R.h - ph) / 2, w: pw, h: ph };
    d.rect(pg.x, pg.y, pg.w, pg.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4, a: fr(S, 'essay-q', 0, 0.15) });
    label(S, S.l('un ensayo de mil palabras', 'a thousand-word essay'), pg.x + pg.w / 2, pg.y - 22 * k, { size: fz(S, 13), weight: 800, color: p.ink2, a: fr(S, 'essay-q', 0.1, 0.25) });
    const n = 16, lh = (pg.h - 30 * k) / n;
    const fill = fr(S, 'essay-loop', 0.08, 0.85, 'lin');
    const done = fill * n;
    for (let i = 0; i < n; i++) {
      const wfrac = i === n - 1 ? 0.55 : 0.78 + 0.2 * hash(i, 19);
      const a = clamp(done - i), y = pg.y + 18 * k + i * lh;
      d.rect(pg.x + 16 * u, y, (pg.w - 32 * u) * wfrac, Math.max(3, lh * 0.32), { fill: alpha(p.ink2, 0.12), r: 2 });
      if (a > 0.01) d.rect(pg.x + 16 * u, y, (pg.w - 32 * u) * wfrac * a, Math.max(3, lh * 0.32), { fill: alpha(p.ink, 0.55), r: 2 });
    }
    const qa = fr(S, 'essay-q', 0.35, 0.5) * (1 - fr(S, 'essay-loop', 0, 0.1));
    if (qa > 0.01) d.text('?', pg.x + pg.w / 2, pg.y + pg.h / 2, { size: fz(S, 64), weight: 800, color: p.mute, align: 'center', base: 'middle', a: qa });
    if (S.on('essay-loop')) {
      const turns = Math.max(1, Math.round(1000 * Math.pow(fill, 1.6)));
      const la = fr(S, 'essay-loop', 0.04, 0.14);
      const cx = P ? pg.x + pg.w / 2 : pg.x + pg.w + 24 * u;
      const cy = P ? pg.y + pg.h + 10 * k : pg.y + pg.h * 0.3;
      label(S, S.l(`vuelta ${S.n(turns, 0)} de ${S.n(1000, 0)}`, `turn ${S.n(turns, 0)} of ${S.n(1000, 0)}`), cx, cy, { align: P ? 'center' : 'left', size: fz(S, 15), weight: 800, color: tone(S, 'sig').ink, a: la });
      // lo que mira: todo lo escrito antes (llave junto a la página)
      const ba = fr(S, 'essay-loop', 0.55, 0.7);
      if (ba > 0.01 && done > 0.5) {
        const x = pg.x - 8 * u, y0 = pg.y + 16 * k, y1 = pg.y + 18 * k + Math.min(done, n) * lh - lh * 0.5;
        d.line(x, y0, x, y1, lat.c, 3, undefined, ba);
        if (!P) label(S, S.l('mira todo lo anterior', 'looks at all of it'), x - 8 * u, (y0 + y1) / 2, { align: 'right', base: 'middle', size: fz(S, 13), weight: 800, color: lat.ink, a: ba, w: R.w * 0.22 });
        else label(S, S.l('mira todo lo anterior', 'looks at all of it'), pg.x + pg.w / 2, pg.y + pg.h + 34 * k, { size: fz(S, 13), weight: 800, color: lat.ink, a: ba });
      }
    }
  });
  // predecir bien exige mucho: un dato y una lógica
  if (aH > 0.01 && aT < 0.99) d.withAlpha(aH * (1 - aT), () => {
    const cards: [string, string, string][] = [
      [S.l('La capital de Francia es', 'The capital of France is'), S.l('París', 'Paris'), S.l('hace falta un dato', 'it takes a fact')],
      [S.l('Ana es mayor que Luis, y Luis es mayor que Eva. La mayor de los tres es', 'Ana is older than Luis, and Luis is older than Eva. The oldest of the three is'), 'Ana', S.l('hace falta seguir la lógica', 'it takes following the logic')],
    ];
    const gap = 16 * k;
    const rects: Rect[] = P ? [{ x: R.x, y: R.y + 8 * k, w: R.w, h: (R.h - gap - 8 * k) / 2 }, { x: R.x, y: R.y + 8 * k + (R.h - gap - 8 * k) / 2 + gap, w: R.w, h: (R.h - gap - 8 * k) / 2 }]
      : [{ x: R.x, y: R.y + R.h * 0.2, w: (R.w - gap) / 2, h: R.h * 0.56 }, { x: R.x + (R.w + gap) / 2, y: R.y + R.h * 0.2, w: (R.w - gap) / 2, h: R.h * 0.56 }];
    cards.forEach(([ctx, ans, why], i) => {
      const a = fr(S, 'essay-hard', 0.18 + 0.32 * i, 0.3 + 0.32 * i);
      if (a < 0.01) return;
      const r = rects[i], size = fz(S, P ? 16 : 17);
      d.withAlpha(a, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 6 });
        const lines = d.wrap(ctx + ' ___', r.w - 28 * u, { size, weight: 650 });
        const lh = size * u * 1.4;
        lines.forEach((ln, j) => d.text(ln, r.x + 14 * u, r.y + 18 * k + j * lh, { size, weight: 650, color: p.ink, base: 'top' }));
        const ay = r.y + 18 * k + lines.length * lh + 10 * k;
        const ansA = fr(S, 'essay-hard', 0.26 + 0.32 * i, 0.36 + 0.32 * i);
        chip(S, r.x + 14 * u, ay, ans, { a: ansA, tone: 'sig', size: fz(S, 16), h: 30, hot: true });
        label(S, why, r.x + 14 * u, Math.min(r.y + r.h - 24 * k, ay + 40 * k), { align: 'left', size: fz(S, 13), weight: 800, color: tone(S, 'w').ink, a: ansA });
      });
    });
  });
  // lo probable no es lo verdadero
  if (aT > 0.01) d.withAlpha(aT, () => {
    const cw = Math.min(R.w, 520 * k), ch = Math.min(R.h * 0.8, 250 * k);
    const r: Rect = { x: R.x + (R.w - cw) / 2, y: R.y + (R.h - ch) / 2, w: cw, h: ch };
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 6 });
    label(S, S.l('lo que propone nuestro modelo', 'what our model suggests'), r.x + 14 * u, r.y + 10 * k, { align: 'left', size: fz(S, 12), weight: 700, color: p.mute });
    const sent = S.l(`El ${D.W.sol} es ${D.W.azul}.`, `The ${D.W.sol} is ${D.W.azul}.`);
    const size = fitSize(S, sent, r.w - 40 * u, fz(S, 30), 800);
    d.text(sent, r.x + r.w / 2, r.y + r.h * 0.36, { size, weight: 800, color: p.ink, align: 'center', base: 'middle' });
    probBars(S, { x: r.x + 20 * u, y: r.y + r.h * 0.52, w: r.w - 40 * u, h: 36 * k }, [{ label: D.W.azul, p: D.esP[0].p, hot: 1 }], { rowH: 36 * k, labelW: fitSize(S, 'oscuro', 200, fz(S, 15)) * 0 + S.d.measure('oscuro', { size: fz(S, 15), weight: 700 }) + 12 * u });
    const st = fr(S, 'honest', 0.2, 0.35), err = tone(S, 'err');
    if (st > 0.01) {
      const txt = S.l('lo probable, no lo verdadero', 'likely, not true'), sz = fz(S, 17), tw = d.measure(txt, { size: sz, weight: 800 }) + 24 * u;
      const cx = r.x + r.w / 2, cy = r.y + r.h * 0.84;
      d.withAlpha(st, () => {
        d.rect(cx - tw / 2, cy - 18 * k, tw, 36 * k, { fill: alpha(err.c, 0.14), stroke: err.c, lw: 2, r: 4 });
        d.text(txt, cx, cy, { size: sz, weight: 800, color: err.ink, align: 'center', base: 'middle' });
      });
    }
  });
}

// ═════════ GPT-1, 2 y 3 ═════════
export function drawGpt(S: Frame, D: Demo) {
  const { d, pal: p } = S, R = area(S), k = kk(S), u = S.u, P = S.portrait, w = tone(S, 'w');
  void D;
  const rows = [
    { n: 'GPT-1', y: 2018, v: 117e6, t: S.l('117 millones', '117 million'), a: fr(S, 'gpt1', 0.3, 0.45), g: fr(S, 'gpt1', 0.55, 0.75, 'io') },
    { n: 'GPT-2', y: 2019, v: 1.5e9, t: S.l('1 500 millones', '1.5 billion'), a: fr(S, 'gpt23', 0.04, 0.14), g: fr(S, 'gpt23', 0.1, 0.25, 'io') },
    { n: 'GPT-3', y: 2020, v: 175e9, t: S.l('175 000 millones', '175 billion'), a: fr(S, 'gpt23', 0.36, 0.46), g: fr(S, 'gpt23', 0.42, 0.66, 'io') },
  ];
  label(S, S.l('parámetros de cada modelo (escala lineal)', 'parameters of each model (linear scale)'), R.x, R.y + 2 * k, { align: 'left', size: fz(S, 14), weight: 800, color: p.ink, w: R.w });
  const short = isShort(S), nsz = fz(S, short ? 14 : 17), vsz = fz(S, 14);
  const nameW = d.measure(short ? 'GPT-3 · 2020' : 'GPT-3', { size: nsz, weight: 800 }) + 16 * u;
  const foot = (short ? 2 * 20 : P ? 3 * 30 : 2 * 30) * k + 20 * k;
  const top = R.y + (short ? 30 : 50) * k, rh = Math.min(P ? 92 * k : 76 * k, (R.y + R.h - top - foot) / 3);
  const bx = R.x + nameW, bw = R.w - nameW, barH = Math.min(20 * k, rh * 0.5);
  rows.forEach((r, i) => {
    if (r.a < 0.01) return;
    const y = top + i * rh, cy = y + (short ? rh / 2 : Math.min(14 * k, rh * 0.3));
    d.withAlpha(r.a, () => {
      d.text(short ? `${r.n} · ${r.y}` : r.n, R.x, cy, { size: nsz, weight: 800, color: p.ink, base: 'middle' });
      if (!short) d.text(String(r.y), R.x, cy + 20 * k, { size: fz(S, 12), weight: 600, color: p.mute, base: 'middle' });
      const len = Math.max(2.5, bw * (r.v / 175e9) * r.g);
      d.rect(bx, cy - barH / 2, len, barH, { fill: alpha(w.c, 0.65), r: 2 });
      const tw = d.measure(r.t, { size: vsz, weight: 800 });
      const fits = bx + len + 8 * u + tw <= R.x + R.w;
      // la cifra va junto a la barra; si no cabe, dentro de la barra (a la derecha, sobre fondo claro)
      if (fits) d.text(r.t, bx + len + 8 * u, cy, { size: vsz, weight: 800, color: w.ink, base: 'middle' });
      else {
        d.rect(R.x + R.w - tw - 12 * u, cy - barH / 2 - 1, tw + 12 * u, barH + 2, { fill: p.stage, r: 3 });
        d.text(r.t, R.x + R.w - 6 * u, cy, { size: vsz, weight: 800, color: w.ink, base: 'middle', align: 'right' });
      }
    });
  });
  const xa = fr(S, 'gpt23', 0.74, 0.86);
  const fy = top + 3 * rh + 8 * k;
  if (xa > 0.01) label(S, S.l('GPT-3 ≈ 1 500 × GPT-1', 'GPT-3 ≈ 1,500 × GPT-1'), R.x + R.w, fy, { align: 'right', size: fz(S, 14), weight: 800, color: w.ink, a: xa });
  const ga = fr(S, 'same-goal', 0.08, 0.22), sa = fr(S, 'same-goal', 0.55, 0.7);
  const gy = fy + (short ? 0 : 30 * k);
  if (ga > 0.01) label(S, S.l('el mismo objetivo: predecir la siguiente palabra', 'the same goal: predict the next word'), R.x, gy, { align: 'left', size: fz(S, short ? 13 : 15), weight: 800, color: tone(S, 'lat').ink, a: ga, w: short ? R.w * 0.62 : R.w });
  if (sa > 0.01) label(S, S.l('lo que crece: la red y el texto que lee', 'what grows: the network and the text it reads'), R.x, gy + (P ? 46 : short ? 20 : 26) * k, { align: 'left', size: fz(S, short ? 12 : 14), weight: 700, color: p.ink2, a: sa, w: R.w });
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame, D: Demo) {
  const { pal: p } = S, R = area(S), k = kk(S), P = S.portrait;
  void D;
  label(S, S.l('el bucle de un modelo de lenguaje', 'the loop of a language model'), R.x + R.w / 2, R.y + 2 * k, { size: fz(S, 15), weight: 800, color: p.ink });
  const box: Rect = P ? { x: R.x, y: R.y + R.h * 0.18, w: R.w, h: R.h * 0.62 } : { x: R.x + R.w * 0.12, y: R.y + R.h * 0.14, w: R.w * 0.76, h: R.h * 0.72 };
  const prog = fr(S, 'recap', 0.04, 0.5, 'lin') * 4.4;
  const act = prog < 4 ? Math.floor(prog) : -1;
  loopDiagram(S, box, act, { shown: 0.6 + prog, sub: (i) => (i === 2 && fr(S, 'recap', 0.6, 0.75) > 0.5 ? S.l('temperatura · top-k · top-p', 'temperature · top-k · top-p') : undefined) });
}

export function drawBridge(S: Frame, D: Demo) {
  const { d, pal: p } = S, R = area(S), u = S.u, lat = tone(S, 'lat');
  const words = [...D.start, D.W.azul];
  const pieces = S.lang === 'es' ? ['el', 'cie', 'lo', 'es', 'az', 'ul'] : ['the', 'sk', 'y', 'is', 'bl', 'ue'];
  const join = S.lang === 'es' ? [false, false, true, false, false, true] : [false, false, true, false, false, true];   // pieza pegada a la anterior
  const size = fz(S, 18);
  // bloque: rótulo, palabras, flecha, rótulo, piezas, pregunta final (centrado; se aprieta si falta alto)
  const k0 = kk(S), want = (20 + 34 + 12 + 26 + 22 + 34 + 18 + 26) * k0, sc = Math.min(1, R.h / want), k = k0 * sc;
  let y = R.y + (R.h - want * sc) / 2;
  const chipH = 34 * Math.min(1, sc + 0.15);
  const row = (items: string[], glue: boolean[], yy: number, a: number) => {
    const ws = items.map((t) => d.measure(t, { size, weight: 700 }) + 14 * u);
    const gapOf = (i: number) => (i === 0 ? 0 : glue[i] ? 2 * u : 10 * u);
    const tot = ws.reduce((acc, w, i) => acc + w + gapOf(i), 0);
    let x = R.x + (R.w - tot) / 2;
    items.forEach((t, i) => { x += gapOf(i); chip(S, x, yy, t, { a, size, h: chipH }); x += ws[i]; });
  };
  const a1 = fr(S, 'bridge', 0.05, 0.18), a2 = fr(S, 'bridge', 0.35, 0.5), a3 = fr(S, 'bridge', 0.75, 0.88);
  label(S, S.l('lo que dijimos: palabras', 'what we said: words'), R.x + R.w / 2, y, { size: fz(S, 13), weight: 800, color: p.ink2, a: a1 });
  y += 20 * k;
  row(words, words.map(() => false), y, a1);
  y += chipH * kk(S) + 12 * k;
  d.arrow(R.x + R.w / 2, y, R.x + R.w / 2, y + 20 * k, p.ink2, 2, 8 * u, a2);
  y += 26 * k;
  const lab2 = S.l('lo que lee de verdad: piezas más pequeñas (partición ilustrativa)', 'what it really reads: smaller pieces (illustrative split)');
  const h2 = label(S, lab2, R.x + R.w / 2, y, { size: fz(S, 13), weight: 800, color: p.ink2, a: a2, w: R.w }).h || d.wrap(lab2, R.w, { size: fz(S, 13), weight: 800 }).length * fz(S, 13) * u * 1.3;
  y += Math.max(22 * k, h2 + 6 * k);
  row(pieces, join, y, a2);
  y += chipH * kk(S) + 18 * k;
  label(S, S.l('¿qué piezas? → los tokens (lección 20)', 'which pieces? → tokens (lesson 20)'), R.x + R.w / 2, y, { size: fz(S, 17), weight: 800, color: lat.ink, a: a3, w: R.w });
}
