// Vistas 10–13: quién califica.
//  · drawGrade    (grade, rubric, judge): respuesta cerrada (programa), respuesta abierta (rúbrica) y el LLM como juez.
//  · drawAgree    (judge-agree): GPT-4 con expertos 85 %, expertos entre sí 81 % (Zheng et al., 2023, tabla 5).
//  · drawPosition (position, position-num): el sesgo de orden; 65 de 100 veredictos se mantienen (tabla 2).
//  · drawHuman    (human): una muestra calificada a mano para medir al juez (ilustrativo).
import { alpha, clamp, hash, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { JUDGE } from './data';
import { FS, area, card, chip, chipH, fitText, fr, glyph, gridGeom, growArrow, mark, ofN, para, pct, person, tight } from './ui';

const RUBRIC = [
  { es: 'cita la política correcta', en: 'cites the right policy', ok: true },
  { es: 'no inventa montos', en: 'makes up no amounts', ok: true },
  { es: 'dice a quién acudir', en: 'says whom to contact', ok: false },
];

/** Renglones grises que hacen de texto (una respuesta abierta). */
function fakeText(S: Frame, r: Rect, n: number, seed: number, a = 1, t: 'ink' | 'lat' = 'ink') {
  const u = S.u, lh = Math.min(12 * u, r.h / n);
  for (let i = 0; i < n; i++) S.d.rect(r.x, r.y + i * lh, r.w * (i === n - 1 ? 0.5 : 0.78 + 0.2 * hash(i, seed)), Math.max(3, 4 * u), { fill: alpha(t === 'lat' ? tone(S, 'lat').c : S.pal.ink2, 0.3), r: 2, a });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Calificar: un programa, una rúbrica, un juez
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawGrade(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait, pad = (tight(S) ? 8 : 12) * u;
  // ── grade: respuesta cerrada ──
  const aClosed = S.on('rubric') ? 1 - fr(S, 'rubric', 0, 0.14) : 1;
  if (aClosed > 0.01) d.withAlpha(aClosed, () => {
    const cw = port ? A.w : Math.min(320 * u, (A.w - 80 * u) / 2), ch = Math.min(port ? 96 * u : 120 * u, A.h * (port ? 0.22 : 0.36));
    const L: Rect = port ? { x: A.x, y: A.y + chipH(S, 13) + 18 * u, w: cw, h: ch } : { x: A.x + A.w / 2 - cw - 40 * u, y: A.y + A.h * 0.24, w: cw, h: ch };
    const R: Rect = port ? { x: A.x, y: L.y + ch + 50 * u, w: cw, h: ch } : { x: A.x + A.w / 2 + 40 * u, y: L.y, w: cw, h: ch };
    // tipos de respuesta cerrada
    const kinds = [S.l('un monto', 'an amount'), S.l('una fecha', 'a date'), S.l('sí o no', 'yes or no')];
    let kx = A.x + (port ? 0 : A.w / 2 - 160 * u);
    kinds.forEach((k, i) => { const c = chip(S, k, kx, A.y + chipH(S, 13) / 2, 'ink', { align: 'left', a: fr(S, 'grade', 0.3 + i * 0.07, 0.4 + i * 0.07), size: 12.5 }); kx += c.w + 8 * u; });
    const box = (r: Rect, title: string, a: number) => d.withAlpha(a, () => {
      card(S, r, { fill: p.surface });
      fitText(S, title, r.x + pad, r.y + pad, r.w - 2 * pad, 12, { weight: 700, base: 'top', color: p.mute });
      fitText(S, S.l('«Sí, con comprobante.»', '“Yes, with a receipt.”'), r.x + pad, r.y + r.h * 0.62, r.w - 2 * pad, port ? 15 : 18, { weight: 800, base: 'middle' });
    });
    box(L, S.l('respuesta del sistema', 'system’s answer'), fr(S, 'grade', 0.05, 0.18));
    box(R, S.l('respuesta aceptada', 'accepted answer'), fr(S, 'grade', 0.45, 0.58));
    const k = fr(S, 'grade', 0.62, 0.74);
    const mx = port ? A.x + A.w / 2 : (L.x + L.w + R.x) / 2, my = port ? (L.y + L.h + R.y) / 2 : L.y + ch / 2;
    glyph(S, 'equal', mx, my, 26 * u, p.ink, k);
    const pk = fr(S, 'grade', 0.84, 0.95), py = port ? R.y + R.h + 26 * u : L.y + ch + 40 * u;
    d.withAlpha(pk, () => {
      const c = chip(S, S.l('lo califica un programa', 'a program grades it'), A.x + A.w / 2, py, 'dat', { weight: 800, size: 14 });
      glyph(S, 'check', c.x + c.w + 16 * u, py, 18 * u, tone(S, 'dat').ink);
    });
  });
  if (!S.on('rubric')) return;
  // ── rubric / judge: respuesta abierta, rúbrica y juez ──
  const port2 = port;
  const ans: Rect = port2 ? { x: A.x, y: A.y, w: A.w * 0.46, h: A.h * 0.36 } : { x: A.x, y: A.y + A.h * 0.06, w: A.w * 0.34, h: A.h * 0.5 };
  const rub: Rect = port2 ? { x: A.x + A.w * 0.52, y: A.y, w: A.w * 0.48, h: A.h * 0.36 } : { x: A.x + A.w * 0.62, y: ans.y, w: A.w * 0.38, h: ans.h };
  const a1 = fr(S, 'rubric', 0.08, 0.22);
  d.withAlpha(a1, () => {
    card(S, ans, { fill: p.surface });
    fitText(S, S.l('una explicación', 'an explanation'), ans.x + pad, ans.y + pad, ans.w - 2 * pad, 13, { weight: 800, base: 'top' });
    fakeText(S, { x: ans.x + pad, y: ans.y + pad + FS(S, 13) * u + 12 * u, w: ans.w - 2 * pad, h: ans.h - 2 * pad - FS(S, 13) * u - 12 * u }, 6, 3);
  });
  const a2 = fr(S, 'rubric', 0.55, 0.68);
  const judgeK = S.on('judge') ? fr(S, 'judge', 0.55, 0.85, 'lin') : 0;
  d.withAlpha(a2, () => {
    card(S, rub, { tone: 'w', fill: p.surface });
    fitText(S, S.l('rúbrica', 'rubric'), rub.x + pad, rub.y + pad, rub.w - 2 * pad, 13, { weight: 800, base: 'top', color: tone(S, 'w').ink });
    const top = rub.y + pad + FS(S, 13) * u + 10 * u, ih = (rub.h - (top - rub.y) - pad) / 3;
    RUBRIC.forEach((it, i) => {
      const y = top + i * ih, a = fr(S, 'rubric', 0.62 + i * 0.08, 0.72 + i * 0.08), m = clamp(judgeK * 3 - i);
      d.withAlpha(a, () => {
        d.rect(rub.x + pad, y + ih / 2 - 8 * u, 16 * u, 16 * u, { stroke: p.lineStrong, lw: 1.3, r: 2 });
        if (m > 0.01) glyph(S, it.ok ? 'check' : 'cross', rub.x + pad + 8 * u, y + ih / 2, 13 * u, it.ok ? tone(S, 'dat').ink : tone(S, 'err').c, m);
        para(S, S.l(it.es, it.en), rub.x + pad + 24 * u, y + ih / 2 - FS(S, 12.5) * u * 0.62, rub.w - 2 * pad - 24 * u, FS(S, 12.5), { weight: 600, maxLines: 2, lh: 1.2 });
      });
    });
  });
  if (!S.on('judge')) return;
  // el juez
  const jw = Math.min(port ? A.w * 0.6 : A.w * 0.28, 230 * u), jh = Math.min(78 * u, A.h * 0.2);
  const J: Rect = port ? { x: A.x + (A.w - jw) / 2, y: ans.y + ans.h + 46 * u, w: jw, h: jh } : { x: A.x + (A.w - jw) / 2, y: ans.y + ans.h + 34 * u, w: jw, h: jh };
  const aj = fr(S, 'judge', 0.2, 0.34);
  d.withAlpha(aj, () => {
    growArrow(S, ans.x + ans.w / 2, ans.y + ans.h + 4 * u, J.x + J.w * 0.3, J.y - 4 * u, fr(S, 'judge', 0.3, 0.45), p.lineStrong, 2);
    growArrow(S, rub.x + rub.w / 2, rub.y + rub.h + 4 * u, J.x + J.w * 0.7, J.y - 4 * u, fr(S, 'judge', 0.36, 0.5), p.lineStrong, 2);
    card(S, J, { tone: 'lat', hot: 0.3 });
    fitText(S, S.l('juez: otro LLM', 'judge: another LLM'), J.x + J.w / 2, J.y + J.h / 2, J.w - 12 * u, 15, { weight: 800, align: 'center', base: 'middle', color: tone(S, 'lat').ink });
  });
  const ak = fr(S, 'judge', 0.86, 0.96);
  chip(S, S.l(`calificación: ${ofN(S, 2, 3)}`, `grade: ${ofN(S, 2, 3)}`), A.x + A.w / 2, Math.min(J.y + J.h + 28 * u, A.y + A.h - 10 * u), 'w', { a: ak, weight: 800, size: 14 });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Cuánto coincide el juez con expertos
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawAgree(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const rows = [
    { lab: S.l('GPT-4 como juez y un experto', 'GPT-4 as judge and an expert'), v: JUDGE.agree, t: 'lat' as const, at: 0.55 },
    { lab: S.l('dos expertos entre sí', 'two experts with each other'), v: JUDGE.humans, t: 'sig' as const, at: 0.8 },
  ];
  fitText(S, S.l('¿cuántas veces coinciden? (de cada 100)', 'how often do they agree? (out of 100)'), A.x, A.y + 4 * u, A.w, 14, { weight: 800, base: 'top', color: p.ink2, a: fr(S, 'judge-agree', 0.3, 0.42) });
  const top = A.y + A.h * 0.2, rh = Math.min(90 * u, A.h * 0.3), numW = 70 * u, bx = A.x, bw = A.w - numW;
  rows.forEach((r, i) => {
    const y = top + i * rh, a = fr(S, 'judge-agree', r.at - 0.12, r.at), c = tone(S, r.t), bh = Math.min(30 * u, rh * 0.36);
    d.withAlpha(a, () => {
      fitText(S, r.lab, bx, y, A.w, 14, { weight: 700, base: 'top' });
      const by = y + FS(S, 14) * u + 10 * u;
      d.rect(bx, by, bw, bh, { fill: p.surface2, r: 2 });
      d.rect(bx, by, bw * (r.v / 100) * a, bh, { fill: alpha(c.c, 0.75), r: 2 });
      d.text(S.n(r.v, 0), bx + bw + 10 * u, by + bh / 2, { size: FS(S, 22), weight: 800, font: 'mono', color: c.ink, base: 'middle' });
    });
  });
  fitText(S, S.l('sin contar empates · preguntas de MT-bench', 'not counting ties · MT-bench questions'), A.x, top + 2 * rh + 6 * u, A.w, 12.5, { weight: 600, base: 'top', color: p.mute, a: fr(S, 'judge-agree', 0.85, 0.95) });
  void port;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Sesgo de orden
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawPosition(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait, pad = 10 * u;
  // ── position: dos respuestas casi iguales; se invierte el orden ──
  const aSwap = S.on('position-num') ? 1 - fr(S, 'position-num', 0, 0.14) : 1;
  if (aSwap > 0.01) d.withAlpha(aSwap, () => {
    const cw = Math.min(port ? A.w * 0.44 : A.w * 0.32, port ? 230 * u : 290 * u), ch = Math.min(port ? A.h * 0.3 : A.h * 0.46, port ? 150 * u : 190 * u), gap = port ? A.w - 2 * cw : 50 * u;
    const x1 = port ? A.x : A.x + A.w / 2 - cw - gap / 2, x2 = x1 + cw + gap, y0 = A.y + FS(S, 12.5) * u + 34 * u;
    const sw = S.on('position') ? fr(S, 'position', 0.5, 0.66, 'io') : 0;
    const cards = [{ k: 'X', x: lerp(x1, x2, sw), t: 'lat' as const }, { k: 'Y', x: lerp(x2, x1, sw), t: 'w' as const }];
    // rótulos de posición (fijos)
    fitText(S, S.l('primera', 'first'), x1 + cw / 2, A.y + 6 * u, cw, 12.5, { weight: 700, align: 'center', base: 'top', color: p.mute, a: fr(S, 'position', 0.15, 0.25) });
    fitText(S, S.l('segunda', 'second'), x2 + cw / 2, A.y + 6 * u, cw, 12.5, { weight: 700, align: 'center', base: 'top', color: p.mute, a: fr(S, 'position', 0.15, 0.25) });
    cards.forEach((c, i) => {
      const yy = y0 + (sw > 0 && sw < 1 ? Math.sin(sw * Math.PI) * (i ? 1 : -1) * 18 * u : 0);
      d.withAlpha(fr(S, 'position', 0.12 + i * 0.05, 0.22 + i * 0.05), () => {
        card(S, { x: c.x, y: yy, w: cw, h: ch }, { tone: c.t, fill: p.surface });
        fitText(S, S.l(`respuesta ${c.k}`, `answer ${c.k}`), c.x + pad, yy + pad, cw - 2 * pad, 13.5, { weight: 800, base: 'top', color: tone(S, c.t).ink });
        fakeText(S, { x: c.x + pad, y: yy + pad + FS(S, 13.5) * u + 10 * u, w: cw - 2 * pad, h: ch - 2 * pad - FS(S, 13.5) * u - 10 * u }, 5, 9, 1, 'ink');
      });
    });
    // veredicto: siempre gana la que está primero
    const vy = y0 + ch + 34 * u;
    const v1 = fr(S, 'position', 0.28, 0.4) * (1 - fr(S, 'position', 0.48, 0.54)), v2 = fr(S, 'position', 0.72, 0.84);
    chip(S, S.l('el juez elige: X', 'the judge picks: X'), A.x + A.w / 2, vy, 'lat', { a: v1, weight: 800, size: 14 });
    d.withAlpha(v2, () => {
      chip(S, S.l('el juez elige: Y', 'the judge picks: Y'), A.x + A.w / 2, vy, 'w', { weight: 800, size: 14 });
      fitText(S, S.l('cambió solo por el orden', 'it changed just because of the order'), A.x + A.w / 2, vy + chipH(S, 14) / 2 + 10 * u, A.w, 13.5, { weight: 800, align: 'center', base: 'top', color: tone(S, 'err').ink });
    });
  });
  if (!S.on('position-num')) return;
  // ── position-num: 65 de cada 100 veredictos se mantienen ──
  const gR: Rect = port ? { x: A.x, y: A.y + FS(S, 13.5) * u + 10 * u, w: A.w, h: A.h * 0.52 } : { x: A.x, y: A.y + FS(S, 13.5) * u + 10 * u, w: A.w * 0.46, h: A.h - FS(S, 13.5) * u - 10 * u };
  const g = gridGeom(gR, 10, 10, 30 * u), a0 = fr(S, 'position-num', 0.1, 0.22);
  fitText(S, S.l('GPT-4 como juez: 100 pares, en los dos órdenes', 'GPT-4 as judge: 100 pairs, in both orders'), port ? A.x : g.x, A.y, port ? A.w : A.w * 0.6, 13.5, { weight: 800, base: 'top', color: p.ink2, a: a0 });
  const kept = JUDGE.consistent, ord = Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a, 65) - hash(b, 65));
  const rank = new Map(ord.map((q, i) => [q, i]));
  const fill = fr(S, 'position-num', 0.15, 0.5, 'lin');
  for (let q = 0; q < 100; q++) {
    const r = rank.get(q)!, a = clamp(fill * 100 - r * 0.9);
    mark(S, g.x + (q % 10) * g.s, g.y + Math.floor(q / 10) * g.s, g.s, r < kept ? 'ok' : 'bad', a0 * clamp(a), 'dat');
  }
  const T: Rect = port ? { x: A.x, y: g.y + g.h + 14 * u, w: A.w, h: A.y + A.h - g.y - g.h - 14 * u } : { x: A.x + A.w * 0.52, y: A.y + A.h * 0.1, w: A.w * 0.48, h: A.h * 0.8 };
  const k1 = fr(S, 'position-num', 0.3, 0.42);
  d.withAlpha(k1, () => {
    const big = FS(S, tight(S) ? 22 : 28);
    d.text(ofN(S, kept, 100), T.x, T.y, { size: big, weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'top' });
    para(S, S.l('mantuvo su veredicto al invertir el orden', 'kept its verdict when the order was swapped'), T.x, T.y + big * u * 1.2, T.w, FS(S, 13), { weight: 700, color: p.ink2, maxLines: 2 });
  });
  const k2 = fr(S, 'position-num', 0.62, 0.74);
  const dy = T.y + FS(S, tight(S) ? 22 : 28) * u * 1.2 + 2 * FS(S, 13) * u * 1.3 + (port ? 8 : 26) * u;
  d.withAlpha(k2, () => {
    fitText(S, S.l('defensa:', 'defense:'), T.x, dy, T.w, 13, { weight: 800, base: 'top', color: tone(S, 'sig').ink });
    para(S, S.l('califica en los dos órdenes; si no coincide, es empate', 'grade in both orders; if they disagree, it is a tie'), T.x, dy + FS(S, 13) * u * 1.4, T.w, FS(S, 13.5), { weight: 700, maxLines: 3 });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Personas: la referencia
// ════════════════════════════════════════════════════════════════════════════════════════════════
const DISAGREE = new Set(Array.from({ length: 100 }, (_, i) => i).sort((a, b) => hash(a, 404) - hash(b, 404)).slice(0, 10));
export function drawHuman(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const sc = Math.max(2, Math.round(3.2 * u)), personH = 9 * sc;
  const gR: Rect = port ? { x: A.x, y: A.y + personH + 14 * u + FS(S, 13) * u + 8 * u, w: A.w, h: A.h * 0.5 } : { x: A.x + A.w * 0.3, y: A.y + 34 * u, w: A.w * 0.4, h: A.h - 34 * u };
  const g = gridGeom(gR, 10, 10, 30 * u);
  const a0 = fr(S, 'human', 0.3, 0.42);
  // la persona y el juez, a los lados
  const px = port ? A.x : A.x + A.w * 0.1, py = port ? A.y + 2 * u : A.y + A.h * 0.36;
  person(S, px, py, sc, 'sig', fr(S, 'human', 0.05, 0.16));
  if (port) fitText(S, S.l('una persona califica a mano', 'a person grades by hand'), px + 6 * sc + 10 * u, py + personH / 2, A.w - 6 * sc - 10 * u, 13, { weight: 800, base: 'middle', color: tone(S, 'sig').ink, a: fr(S, 'human', 0.05, 0.16) });
  else fitText(S, S.l('una persona', 'a person'), px + 3 * sc, py + personH + 6 * u, A.w * 0.25, 13, { weight: 800, align: 'center', base: 'top', color: tone(S, 'sig').ink, a: fr(S, 'human', 0.05, 0.16) });
  const fill = fr(S, 'human', 0.35, 0.62, 'lin'), cmp = fr(S, 'human', 0.72, 0.86);
  for (let q = 0; q < 100; q++) {
    const a = a0 * clamp(fill * 110 - q);
    const x = g.x + (q % 10) * g.s, y = g.y + Math.floor(q / 10) * g.s;
    if (cmp < 0.01) mark(S, x, y, g.s, 'none', a);
    else { mark(S, x, y, g.s, 'none', a * (1 - cmp)); mark(S, x, y, g.s, DISAGREE.has(q) ? 'bad' : 'ok', a * cmp, 'sig'); }
  }
  fitText(S, S.l('muestra calificada a mano: 100 casos', 'sample graded by hand: 100 cases'), g.x + g.w / 2, g.y - 8 * u, port ? A.w : g.w + 80 * u, 13, { weight: 700, align: 'center', base: 'bottom', color: p.ink2, a: a0 });
  // el juez y el resultado
  const jx = port ? A.x : A.x + A.w * 0.74, jy = port ? g.y + g.h + 14 * u : A.y + A.h * 0.3, jw = port ? A.w : A.w * 0.26;
  d.withAlpha(cmp, () => {
    chip(S, S.l('juez: otro LLM', 'judge: another LLM'), jx, jy + chipH(S, 13) / 2, 'lat', { align: 'left', weight: 800, maxW: jw });
    const big = FS(S, tight(S) ? 20 : 24);
    const ty = jy + chipH(S, 13) + 10 * u;
    d.text(S.l('coincide en', 'agrees on'), jx, ty, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
    const tw = port ? S.d.measure(S.l('coincide en', 'agrees on'), { size: FS(S, 12.5), weight: 700 }) + 8 * u : 0;
    d.text(ofN(S, 100 - DISAGREE.size, 100), jx + tw, port ? ty - 4 * u : ty + FS(S, 12.5) * u * 1.4, { size: big, weight: 800, font: 'mono', color: tone(S, 'sig').ink, base: 'top' });
  });
  void pct;
}
