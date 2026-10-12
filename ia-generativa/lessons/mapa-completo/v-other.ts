// Vistas sin mapa grande:
//  · el gancho (hook, plan): del correo de la lección 1 al chatbot, y las tres partes de esta lección;
//  · las diez preguntas (q-intro … q-use): la lista se arma una por una; al lado (o debajo), un mapa pequeño enciende las
//    lecciones de las que sale cada pregunta, con sus nombres;
//  · cómo seguir aprendiendo (learn-1 … learn-3): tres tarjetas.
// REAL: las lecciones de origen de cada pregunta (sus lentes de decisión). Las preguntas son la síntesis de este curso.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { QUESTIONS } from './data';
import { dot, lessonName, mapLayout, partial } from './v-map';
import { FS, area, card, chip, chipH, fitText, fr, glyph, panes, para, paraH, pick, tight, type GlyphKind } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Gancho
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const big = !port && !tight(S), sz = tight(S) ? 14 : big ? 18 : 16;
  // dos tarjetas: el correo (lección 1) y el chatbot (hoy), unidas por el camino de 36 lecciones
  const cw = port ? A.w : Math.min(big ? 300 * u : 260 * u, (A.w - 120 * u) / 2), chh = Math.max(64 * u, FS(S, sz) * u * 2.6 + 26 * u);
  const items: { g: GlyphKind; top: string; t: string; tn: Tone; f: number }[] = [
    { g: 'mail', top: S.l('Lección 1', 'Lesson 1'), t: S.l('¿Este correo es spam?', 'Is this email spam?'), tn: 'dat', f: 0.04 },
    { g: 'chat', top: S.l('Hoy', 'Today'), t: S.l('Cómo escribe un chatbot', 'How a chatbot writes'), tn: 'sig', f: 0.62 },
  ];
  const psz = big ? 16 : 14, planH = (chipH(S, psz) + 8 * u) * 3;
  const gapV = port ? 34 * u : 0;
  const blockH = port ? 2 * chh + gapV : chh;
  const totalH = blockH + (tight(S) ? 16 : 30) * u + planH;
  const y0 = A.y + Math.max(0, (A.h - totalH) / 2);
  const pos = items.map((_, i) => (port ? { x: A.x, y: y0 + i * (chh + gapV) } : { x: i === 0 ? A.x + (A.w - 2 * cw - 120 * u) / 2 : A.x + (A.w - 2 * cw - 120 * u) / 2 + cw + 120 * u, y: y0 }));
  items.forEach((it, i) => {
    const a = fr(S, 'hook', it.f, it.f + 0.14), t = tone(S, it.tn), { x, y } = pos[i];
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: chh }, { tone: it.tn, hot: 0.06 });
      const gs = Math.min(30 * u, chh * 0.42);
      glyph(S, it.g, x + 14 * u + gs / 2, y + chh / 2, gs, t.ink);
      const tx = x + 26 * u + gs, tw = cw - (tx - x) - 10 * u;
      fitText(S, it.top, tx, y + chh / 2 - 4 * u, tw, 12.5, { weight: 700, color: p.mute, base: 'bottom' });
      fitText(S, it.t, tx, y + chh / 2 + 2 * u, tw, sz, { weight: 800, color: t.ink, base: 'top' });
    });
  });
  // el camino: 36 puntitos entre las dos tarjetas
  const k = fr(S, 'hook', 0.36, 0.62, 'io');
  if (k > 0) {
    const [ax, ay, bx, by] = port
      ? [A.x + 30 * u, pos[0].y + chh + 4 * u, A.x + 30 * u, pos[1].y - 4 * u]
      : [pos[0].x + cw + 8 * u, y0 + chh / 2, pos[1].x - 8 * u, y0 + chh / 2];
    const n = 36;
    for (let i = 0; i < n * k; i++) {
      const t = (i + 0.5) / n;
      d.circle(ax + (bx - ax) * t, ay + (by - ay) * t, 1.7 * u, { fill: p.ink2 });
    }
    const lab = S.l('36 lecciones', '36 lessons');
    d.withAlpha(fr(S, 'hook', 0.5, 0.62), () => {
      if (port) fitText(S, lab, A.x + 42 * u, (ay + by) / 2, A.w - 50 * u, 13, { weight: 800, color: p.ink2, base: 'middle' });
      else fitText(S, lab, (ax + bx) / 2, ay - 8 * u, bx - ax + 30 * u, 13, { weight: 800, color: p.ink2, base: 'bottom', align: 'center' });
    });
  }
  // las tres partes de esta lección
  const plan: [GlyphKind, string, number][] = [
    ['map', S.l('El camino completo, en un mapa', 'The whole path, on one map'), 0.2],
    ['clock', S.l('Cuándo pasó cada cosa', 'When each thing happened'), 0.42],
    ['ask', S.l('Diez preguntas para la vida real', 'Ten questions for real life'), 0.66],
  ];
  const py = y0 + blockH + (tight(S) ? 16 : 30) * u, rh = chipH(S, psz) + 8 * u;
  const pw = Math.min(A.w, 460 * u), px = A.x + (A.w - pw) / 2;
  plan.forEach(([g, t, f], i) => {
    const a = fr(S, 'plan', f, f + 0.12);
    if (a <= 0.003) return;
    const y = py + i * rh;
    d.withAlpha(a, () => {
      glyph(S, g, px + 12 * u, y + rh / 2, (big ? 22 : 18) * u, p.ink2);
      fitText(S, `${i + 1} · ${t}`, px + 34 * u, y + rh / 2, pw - 34 * u, psz, { weight: 700, color: p.ink, base: 'middle' });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Las diez preguntas
// ════════════════════════════════════════════════════════════════════════════════════════════════
const QSEG = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];
/** Pregunta actual (0–9), −1 antes de la primera, 10 al final. */
const curQ = (S: Frame) => (S.on('q-use') ? 10 : QSEG.reduce((k, s, i) => (S.on(s) ? i : k), -1));

export function drawQuestions(S: Frame) {
  const { d, pal: p } = S, u = S.u, P = panes(S, 0.58, 104), R = P.main, lat = tone(S, 'lat');
  const cur = curQ(S);
  // encabezado
  const big = !S.portrait && !tight(S), hsz = big ? 16 : 14.5;
  const head = pick(S, [S.l('Diez preguntas para cualquier equipo o proveedor de IA', 'Ten questions for any AI team or vendor'), S.l('Diez preguntas para cualquier proveedor', 'Ten questions for any vendor'), S.l('Diez preguntas', 'Ten questions')], R.w, hsz, 800);
  const hh = FS(S, hsz) * u * 1.6;
  const sz0 = tight(S) ? 12.5 : big ? 16 : 14, rowH0 = Math.max(FS(S, sz0) * u * 1.5, 21 * u);
  const rowH = Math.min(rowH0, (R.h - hh) / 10);
  const total = hh + 10 * rowH, y0 = R.y + Math.max(0, (R.h - total) / 2);
  fitText(S, head, R.x, y0, R.w, hsz, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'q-intro', 0.04, 0.16) });
  const br = Math.max(7.5, Math.min(rowH * 0.42, 12 * u));
  QUESTIONS.forEach((q, i) => {
    const y = y0 + hh + i * rowH, isCur = i === cur;
    // «Estas diez»: primero aparecen los diez lugares vacíos, numerados; cada uno se llena con su pregunta
    const slot = fr(S, 'q-intro', 0.2 + 0.03 * i, 0.3 + 0.03 * i) * (1 - fr(S, QSEG[i], 0, 0.1));
    if (slot > 0.003) d.withAlpha(slot, () => {
      d.circle(R.x + br, y + rowH / 2, br, { fill: p.surface, stroke: p.line, lw: 1.2, dash: [3, 2] });
      d.text(String(i + 1), R.x + br, y + rowH / 2 + 0.5, { size: Math.max(12.2 / u, Math.min(FS(S, 12), (br * 1.25) / u)), weight: 700, color: p.mute, align: 'center', base: 'middle' });
      d.line(R.x + 2 * br + 8 * u, y + rowH / 2 + 4 * u, R.x + Math.min(R.w, 2 * br + 8 * u + 180 * u), y + rowH / 2 + 4 * u, p.line, 1.2, [3, 3]);
    });
    const a = fr(S, QSEG[i], 0, 0.1);
    if (a <= 0.003) return;
    const done = S.on('q-use') ? fr(S, 'q-use', 0.1 + 0.05 * i, 0.16 + 0.05 * i) : 0;
    d.withAlpha(a, () => {
      if (isCur) d.rect(R.x - 6 * u, y + 1, R.w + 6 * u, rowH - 2, { fill: alpha(lat.c, 0.12), r: 4 });
      d.circle(R.x + br, y + rowH / 2, br, { fill: isCur || done > 0.5 ? lat.c : p.surface, stroke: isCur || done > 0.5 ? lat.c : p.lineStrong, lw: 1.3 });
      d.text(String(i + 1), R.x + br, y + rowH / 2 + 0.5, { size: Math.max(12.2 / u, Math.min(FS(S, 12), (br * 1.25) / u)), weight: 800, color: isCur || done > 0.5 ? p.stage : p.ink, align: 'center', base: 'middle' });
      fitText(S, S.L(q.q), R.x + 2 * br + 8 * u, y + rowH / 2, R.w - 2 * br - 8 * u, sz0, { weight: isCur ? 800 : 600, color: isCur ? lat.ink : p.ink, base: 'middle' });
    });
  });
  drawQAside(S, P.aside, cur);
}

function drawQAside(S: Frame, R: Rect, cur: number) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat');
  const ls = cur >= 0 && cur < 10 ? QUESTIONS[cur].ls : cur === 10 ? [...new Set(QUESTIONS.flatMap((q) => q.ls))].sort((a, b) => a - b) : [];
  // los nombres de las lecciones de origen (siempre); el mapa pequeño, si queda lugar
  const ch = chipH(S, 12.5), names = cur === 10 ? [] : ls, maxN = 3;
  const namesH = maxN * (ch + 6 * u);
  const mapH0 = Math.min(R.h - namesH - 10 * u, R.w * 0.85);
  const showMap = mapH0 >= 64 * u;
  // el mapa pequeño ocupa solo lo que necesita: los nombres van justo debajo
  const L0 = showMap ? mapLayout(S, { x: R.x, y: R.y, w: R.w, h: mapH0 }, true) : null;
  const mapH = L0 ? L0.box.h + 2 * L0.r : 0;
  const blockH = (showMap ? mapH + 10 * u : 0) + namesH, by = R.y + Math.max(0, (R.h - blockH) / 2);
  const mapR: Rect = L0 ? { x: R.x, y: by + L0.r - (mapH0 - L0.box.h) / 2, w: R.w, h: mapH0 } : { x: R.x, y: by, w: R.w, h: 0 };   // mismo reparto que L0, corrido
  const a0 = fr(S, 'q-intro', 0.3, 0.45);
  if (showMap) {
    const L = mapLayout(S, mapR, true);
    d.withAlpha(a0, () => {
      partial(S, L.path, 1, alpha(p.ink, 0.2), 1.2);
      for (const nd of L.nodes) {
        const on = ls.includes(nd.n);
        dot(S, L, nd.x, nd.y, nd.n, { hot: on ? 1 : 0, t: 'lat', r: on ? Math.max(L.r * 1.6, 9.5 * u) : L.r, num: on });
      }
    });
    if (cur === 10) d.withAlpha(fr(S, 'q-use', 0.3, 0.42), () => fitText(S, S.l(`Salen de ${ls.length} lecciones`, `They come from ${ls.length} lessons`), R.x, by + mapH + 10 * u, R.w, 13, { weight: 800, color: lat.ink, base: 'top' }));
  } else if (cur === 10) {
    d.withAlpha(fr(S, 'q-use', 0.3, 0.42), () => para(S, S.l(`Salen de ${ls.length} lecciones: ${ls.join(' · ')}`, `They come from ${ls.length} lessons: ${ls.join(' · ')}`), R.x, R.y + 4 * u, R.w, FS(S, 13), { weight: 700, color: lat.ink }));
  }
  let y = showMap ? by + mapH + 10 * u : R.y + Math.max(0, (R.h - names.length * (ch + 6 * u)) / 2);
  names.forEach((n) => {
    const lab = `${n} · ${lessonName(S, n, R.w - 60 * u, 12.5, 700)}`;
    chip(S, lab, R.x, y + ch / 2, 'lat', { size: 12.5, align: 'left', maxW: R.w, a: fr(S, QSEG[cur], 0.75, 0.88) });
    y += ch + 6 * u;
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Cómo seguir aprendiendo
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawLearn(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait || A.w < 560 * u;
  const items: { g: GlyphKind; t: string; s: string; tn: Tone; seg: string }[] = [
    { g: 'book', t: S.l('Repasa', 'Review'), s: S.l('«Por dentro» y las fuentes de cada lección', '“Under the hood” and each lesson’s sources'), tn: 'sig', seg: 'learn-1' },
    { g: 'doc', t: S.l('Lee una fuente original', 'Read an original source'), s: S.l('Vaswani y colegas (2017), «Attention Is All You Need»', 'Vaswani and colleagues (2017), “Attention Is All You Need”'), tn: 'w', seg: 'learn-2' },
    { g: 'list', t: S.l('Practica con tus casos', 'Practice with your cases'), s: S.l('Diez casos de tu trabajo, con su respuesta correcta', 'Ten cases from your work, with their right answer'), tn: 'dat', seg: 'learn-3' },
  ];
  const head = S.l('Cómo seguir aprendiendo', 'How to keep learning'), hh = FS(S, 15) * u * 1.6;
  const big = !port && !tight(S), gap = (tight(S) ? 8 : 14) * u, tsz = tight(S) ? 14 : big ? 16.5 : 15.5, ssz = tight(S) ? 12.5 : big ? 14.5 : 13.5;
  const cols = port ? 1 : 3, cw = (A.w - (cols - 1) * gap) / cols;
  const pad = (big ? 16 : 12) * u, gs = (big ? 26 : 22) * u;
  const subH = (it: (typeof items)[0]) => paraH(S, it.s, cw - 2 * pad, FS(S, ssz), { weight: 600, maxLines: port ? 2 : 4 });
  const chs = items.map((it) => pad * 2 + Math.max(gs, FS(S, tsz) * u * 1.3) + 6 * u + subH(it));
  const ch = port ? Math.min(Math.max(...chs), (A.h - hh - 2 * gap) / 3) : Math.max(...chs);
  const total = hh + (port ? 3 * ch + 2 * gap : ch);
  const y0 = A.y + Math.max(0, (A.h - total) / 2);
  fitText(S, head, A.x, y0, A.w, 15, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'learn-1', 0, 0.12) });
  items.forEach((it, i) => {
    const a = fr(S, it.seg, 0.04, 0.16), t = tone(S, it.tn);
    const x = port ? A.x : A.x + i * (cw + gap), y = y0 + hh + (port ? i * (ch + gap) : 0);
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: ch }, { tone: it.tn, hot: 0.06 });
      glyph(S, it.g, x + pad + gs / 2, y + pad + gs / 2, gs, t.ink);
      fitText(S, `${i + 1} · ${it.t}`, x + pad + gs + 8 * u, y + pad + gs / 2, cw - 2 * pad - gs - 8 * u, tsz, { weight: 800, color: t.ink, base: 'middle' });
      const sy = y + pad + Math.max(gs, FS(S, tsz) * u * 1.3) + 6 * u;
      para(S, it.s, x + pad, sy, cw - 2 * pad, FS(S, ssz), { weight: 600, color: p.ink, maxLines: Math.max(1, Math.floor((y + ch - pad - sy) / (FS(S, ssz) * u * 1.26) + 0.02)) });
    });
  });
}
