// Vistas de la introducción: el recuerdo de las lecciones 23 y 27, el mismo modelo antes y después (salidas reales de TinyLlama),
// la brecha entre lo que aprendió y lo que queremos (alineación) y el recorrido de tres pasos (que vuelve en el repaso, con sus nombres).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { SAMPLES } from './outputs-data';
import { DEMO_WIN, demoQ, st } from './state';
import {
  FS, area, card, chip, chipW, cursor, docChars, docLines, drawDoc, fitText, fr, glyph, growArrow, isCompact, lines, mark, para, paraH, person, tab, tight,
} from './ui';

// ── 0 · el gancho: lo que ya sabes ─────────────────────────────────────────────────────────────────
export function drawHook(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait;
  const lt = tone(S, 'lat'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const gap = 14 * u, n = 3;
  const W = Math.min(r.w, 820 * u), X = r.x + (r.w - W) / 2;
  const bw = port ? W : (W - 2 * (gap + 26 * u)) / n, bh = port ? Math.min((r.h - 2 * (gap + 20 * u)) / n, 96 * u) : Math.min(r.h * 0.5, 150 * u);
  const y0 = port ? r.y + (r.h - (n * bh + 2 * (gap + 20 * u))) / 2 : r.y + (r.h - bh) / 2;
  const box = (i: number): Rect => (port ? { x: X, y: y0 + i * (bh + gap + 20 * u), w: bw, h: bh } : { x: X + i * (bw + gap + 26 * u), y: y0, w: bw, h: bh });
  const items: { t: Tone; title: string; sub: string; at: number }[] = [
    { t: 'lat', title: S.l('Modelo base', 'Base model'), sub: S.l('solo continúa texto · lección 23', 'only continues text · lesson 23'), at: 0.08 },
    { t: 'w', title: S.l('Ajuste fino', 'Fine-tuning'), sub: S.l('los ejemplos cambian su conducta · lección 27', 'examples change its behavior · lesson 27'), at: 0.42 },
    { t: 'dat', title: S.l('Asistente', 'Assistant'), sub: S.l('hoy: ¿cómo se llega aquí?', 'today: how do we get here?'), at: 0.78 },
  ];
  items.forEach((it, i) => {
    const b = box(i), a = fr(S, 'hook', it.at, it.at + 0.12), c = tone(S, it.t);
    d.withAlpha(a, () => {
      card(S, b, { tone: it.t, fill: alpha(c.c, 0.08), lw: 2, dash: i === 2 ? [6, 4] : undefined });
      const tsz = port ? 17 : 19;
      fitText(S, it.title, b.x + b.w / 2, b.y + b.h * (port ? 0.34 : 0.32), b.w - 20 * u, tsz, { weight: 800, color: c.ink, align: 'center', base: 'middle' });
      para(S, it.sub, b.x + 12 * u, b.y + b.h * (port ? 0.56 : 0.5), b.w - 24 * u, FS(S, 14), { weight: 600, color: p.ink2, align: 'center', maxLines: 2 });
    });
    if (i < n - 1) {
      const k = fr(S, 'hook', items[i + 1].at - 0.06, items[i + 1].at + 0.04);
      const b2 = box(i + 1);
      if (port) growArrow(S, b.x + b.w / 2, b.y + b.h + 4 * u, b.x + b.w / 2, b2.y - 4 * u, k, p.ink, 2.4);
      else growArrow(S, b.x + b.w + 5 * u, b.y + b.h / 2, b2.x - 5 * u, b.y + b.h / 2, k, p.ink, 2.4);
    }
  });
  void lt; void wt; void dt;
}

// ── 1 · el mismo modelo, antes y después ──────────────────────────────────────────────────────────
/** Traducción de las cuatro indicaciones (fijadas en inglés antes de ver ninguna salida). */
const GLOSS_ES = ['¿Cuál es la capital de Francia?', 'Explica en una frase qué es la inflación.', 'Escribe un correo de dos líneas para pedir una reunión.', 'Dame tres consejos para dormir mejor.'];
/** Líneas inventadas por el modelo base que se resaltan al explicarlas (solo en la indicación de la inflación). */
const HL = ['What is the difference'];

function cmpLayout(S: Frame) {
  const u = S.u, r = area(S), port = S.portrait, cmp = tight(S), gap = (cmp ? 8 : 12) * u;
  const ph = (S.lang === 'es' ? (cmp ? 46 : 54) : (cmp ? 32 : 38)) * u;
  const pr: Rect = { x: r.x, y: r.y, w: r.w, h: ph };
  const top = pr.y + ph + gap + 6 * u, avail = r.y + r.h - top;
  const A: Rect = port ? { x: r.x, y: top, w: r.w, h: (avail - gap - 6 * u) / 2 } : { x: r.x, y: top, w: (r.w - gap) / 2, h: avail };
  const B: Rect = port ? { x: r.x, y: top + (avail - gap - 6 * u) / 2 + gap + 6 * u, w: r.w, h: (avail - gap - 6 * u) / 2 } : { x: r.x + (r.w + gap) / 2, y: top, w: (r.w - gap) / 2, h: avail };
  return { r, pr, A, B, port, cmp };
}

/** Indicación vigente y cuántos caracteres se ven de cada salida. */
function cmpText(S: Frame) {
  const s = st(S);
  const own = s.qOwn && S.on('try-compare');
  const q = own ? s.q : demoQ(S);
  let base = Infinity, chat = Infinity, prompt = Infinity;
  if (own) { const t = (S.clock - s.qClock) * 120; base = t; chat = t - 20; prompt = t * 3; }
  else if (!S.on('compare-demo')) {
    prompt = fr(S, 'base-demo', 0.12, 0.42, 'lin') * 60;
    base = fr(S, 'base-demo', 0.45, 0.98, 'lin') * 400;
    chat = fr(S, 'chat-demo', 0.32, 0.72, 'lin') * 200;
  } else if (!S.on('try-compare')) {
    const [a, b] = DEMO_WIN[q] ?? [0, 0.2];
    const k = fr(S, 'compare-demo', a, b, 'lin');
    prompt = k * 300; base = k * 500; chat = k * 500;
  }
  return { q, base, chat, prompt, own };
}

export function drawCompare(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = cmpLayout(S), { pr, A, B, cmp } = L;
  const T = cmpText(S), sample = SAMPLES[T.q];
  const lt = tone(S, 'lat'), dt = tone(S, 'dat'), gt = tone(S, 'sig');
  const a0 = fr(S, 'base-demo', 0, 0.1);
  // la indicación
  d.withAlpha(a0, () => {
    card(S, pr, { tone: 'sig', fill: alpha(gt.c, 0.08) });
    const lab = S.l('indicación', 'prompt'), ls = FS(S, 12), lw = d.measure(lab, { size: ls, weight: 800 });
    const one = S.lang !== 'es';
    const ty = one ? pr.y + pr.h / 2 : pr.y + 8 * u + FS(S, 15) * u * 0.55;
    d.text(lab, pr.x + 10 * u, ty, { size: ls, weight: 800, color: gt.ink, base: 'middle' });
    const shown = sample.prompt.slice(0, Math.max(0, Math.floor(T.prompt)));
    fitText(S, shown, pr.x + 10 * u + lw + 10 * u, ty, pr.w - lw - 30 * u, 15, { weight: 700, base: 'middle' });
    if (!one) fitText(S, '«' + GLOSS_ES[T.q] + '»', pr.x + 10 * u, pr.y + pr.h - 7 * u, pr.w - 20 * u, 13, { weight: 600, color: p.mute, base: 'bottom', a: clamp(T.prompt / 30) });
  });
  const size = FS(S, cmp ? 13 : S.portrait ? 13.5 : 17), lh = 1.3 * size * u, pad = 10 * u;
  const rows = (R: Rect) => Math.max(2, Math.floor((R.h - 22 * u - pad) / lh));
  const verdict = fr(S, 'compare-demo', 0.82, 0.95);
  // izquierda / arriba: el modelo base
  d.withAlpha(a0, () => {
    card(S, A, { tone: 'lat', fill: alpha(lt.c, 0.05) });
    tab(S, verdict > 0.5 ? S.l('Modelo base · continúa el texto', 'Base model · continues the text') : S.l('Modelo base · TinyLlama 1.1B', 'Base model · TinyLlama 1.1B'), A.x + 10 * u, A.y, { t: 'lat', align: 'left', maxW: A.w - 20 * u });
    const ls = docLines(S, null, sample.base, sample.baseCut, A.w - 2 * pad, size, rows(A), T.q === 1 ? HL : []);
    const hlA = T.q === 1 && S.between('base-what', 'chat-demo') ? fr(S, 'base-what', 0.18, 0.32) : T.q === 1 && S.on('chat-demo') && !S.on('compare-demo') ? 1 - fr(S, 'chat-demo', 0, 0.15) : 0;
    const [cx, cy] = drawDoc(S, ls, A.x + pad, A.y + 20 * u, size, T.base, { lh: 1.3, hlA, w: A.w - 2 * pad });
    if (T.base < docChars(ls) + 2 && T.base > 0) cursor(S, cx, cy, size, 'lat');
    else if (T.base <= 0 && S.on('base-demo')) cursor(S, A.x + pad, A.y + 20 * u, size, 'lat');
    // rótulos de lo que hace: inventa una pregunta, se repite
    if (hlA > 0.01) {
      // debajo del texto: qué hace (las líneas resaltadas son las preguntas inventadas)
      const yb = Math.min(A.y + A.h - 16 * u, A.y + 20 * u + ls.length * lh + 18 * u);
      const c1 = S.l('inventa otra pregunta', 'makes up a question'), c2 = S.l('y se repite', 'and repeats itself');
      const b1 = { w: 0 };
      d.withAlpha(hlA, () => { b1.w = chip(S, c1, A.x + pad, yb, 'err', { align: 'left', size: 13, maxW: A.w - 2 * pad }).w; });
      const aR = fr(S, 'base-what', 0.42, 0.55) * (S.is('base-what') ? 1 : hlA);
      const fitsRow = b1.w + 10 * u + chipW(S, c2) <= A.w - 2 * pad;
      d.withAlpha(aR, () => chip(S, c2, fitsRow ? A.x + pad + b1.w + 10 * u : A.x + pad, fitsRow ? yb : yb + 28 * u, 'err', { align: 'left', size: 13, maxW: A.w - 2 * pad }));
    }
  });
  // derecha / abajo: el asistente (mismo modelo, ajustado)
  const aB = fr(S, 'chat-demo', 0, 0.12);
  d.withAlpha(a0 * (1 - aB), () => {
    card(S, B, { tone: 'dat', fill: 'transparent', dash: [6, 5] });
    fitText(S, S.l('Asistente: ¿?', 'Assistant: ?'), B.x + B.w / 2, B.y + B.h / 2, B.w - 20 * u, 16, { weight: 700, color: p.mute, align: 'center', base: 'middle' });
  });
  d.withAlpha(aB, () => {
    card(S, B, { tone: 'dat', fill: alpha(dt.c, 0.06) });
    tab(S, verdict > 0.5 ? S.l('Asistente · atiende la petición', 'Assistant · handles the request') : S.l('Asistente · TinyLlama Chat', 'Assistant · TinyLlama Chat'), B.x + 10 * u, B.y, { t: 'dat', align: 'left', maxW: B.w - 20 * u });
    const ls = docLines(S, null, sample.chat, sample.chatCut, B.w - 2 * pad, size, rows(B));
    const [cx, cy] = drawDoc(S, ls, B.x + pad, B.y + 20 * u, size, T.chat, { contTone: 'dat', lh: 1.3 });
    if (T.chat < docChars(ls) + 2 && T.chat > 0) cursor(S, cx, cy, size, 'dat');
    // en la demostración inicial: «se detiene» (fin de la respuesta)
    if (T.q === 1 && T.chat >= docChars(ls)) {
      const aS = S.on('compare-demo') ? 0 : fr(S, 'chat-demo', 0.74, 0.86);
      if (aS > 0) d.withAlpha(aS, () => { mark(S, 'yes', cx + 14 * u, cy + size * u * 0.55, 8 * u); fitText(S, S.l('se detiene', 'it stops'), cx + 26 * u, cy + size * u * 0.55, Math.max(40 * u, B.x + B.w - cx - 34 * u), 13, { weight: 700, color: dt.ink, base: 'middle' }); });
      const aT = S.on('compare-demo') ? 0 : fr(S, 'chat-demo', 0.84, 0.94);
      if (aT > 0) d.withAlpha(aT, () => chip(S, S.l('se pidió una frase; usó dos', 'it was asked for one sentence; it used two'), B.x + pad, Math.min(B.y + B.h - 16 * u, cy + size * u * 1.3 + 22 * u), 'mute', { align: 'left', size: 13, maxW: B.w - 2 * pad }));
    }
  });
}

// ── 2 · la brecha y la alineación ─────────────────────────────────────────────────────────────────
export function drawGap(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  const lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const capH = (cmp ? 30 : 46) * u;
  const bw = port ? r.w : Math.min(r.w * 0.38, 340 * u), bh = port ? (r.h - capH - 60 * u) / 2 : Math.min(r.h - capH - 10 * u, 210 * u);
  const L: Rect = port ? { x: r.x, y: r.y, w: bw, h: bh } : { x: r.x, y: r.y + (r.h - capH - bh) / 2, w: bw, h: bh };
  const R: Rect = port ? { x: r.x, y: L.y + bh + 60 * u, w: bw, h: bh } : { x: r.x + r.w - bw, y: L.y, w: bw, h: bh };
  const aL = fr(S, 'why', 0.12, 0.25), aR = fr(S, 'why', 0.5, 0.62);
  d.withAlpha(aL, () => {
    card(S, L, { tone: 'lat', fill: alpha(lt.c, 0.07), lw: 2 });
    const x = L.x + 12 * u, w = L.w - 24 * u;
    fitText(S, S.l('Lo que aprendió', 'What it learned'), x, L.y + 12 * u, w, 17, { weight: 800, color: lt.ink, base: 'top' });
    const hb = para(S, S.l('adivinar la siguiente pieza de textos de internet', 'guess the next piece of internet text'), x, L.y + 40 * u, w, FS(S, 15), { weight: 600, maxLines: 3 });
    // un ejemplo: tras una pregunta, en internet suele venir… otra pregunta
    const y2 = L.y + 40 * u + hb + 8 * u;
    if (y2 + 34 * u < L.y + L.h) {
      const s = FS(S, 13);
      para(S, S.l('«¿Qué es la inflación?» → «¿Y la deflación?»', '“What is inflation?” → “And deflation?”'), x, y2, w, s, { weight: 600, color: lt.ink, maxLines: 2 });
    }
  });
  d.withAlpha(aR, () => {
    card(S, R, { tone: 'dat', fill: alpha(dt.c, 0.07), lw: 2 });
    const x = R.x + 12 * u, w = R.w - 24 * u;
    fitText(S, S.l('Lo que queremos', 'What we want'), x, R.y + 12 * u, w, 17, { weight: 800, color: dt.ink, base: 'top' });
    const labels = [S.l('útil', 'helpful'), S.l('veraz', 'honest'), S.l('que no cause daño', 'harmless')];
    const rowH = Math.min(32 * u, (R.h - 46 * u) / 3);
    labels.forEach((t, i) => {
      const y = R.y + 42 * u + i * rowH + rowH / 2, a = fr(S, 'why', 0.62 + i * 0.1, 0.72 + i * 0.1);
      d.withAlpha(a, () => { glyph(S, 'ok', x + 10 * u, y, 9 * u); fitText(S, t, x + 28 * u, y, w - 30 * u, 16, { weight: 700, base: 'middle' }); });
    });
  });
  // la brecha, luego el puente
  const gx1 = port ? L.x + L.w / 2 : L.x + L.w + 8 * u, gy1 = port ? L.y + L.h + 6 * u : L.y + L.h / 2;
  const gx2 = port ? R.x + R.w / 2 : R.x - 8 * u, gy2 = port ? R.y - 6 * u : R.y + R.h / 2;
  const kB = fr(S, 'alignment', 0.04, 0.3, 'io'), gapA = fr(S, 'why', 0.55, 0.68) * (1 - kB);
  const mx = (gx1 + gx2) / 2, my = (gy1 + gy2) / 2;
  if (gapA > 0) d.withAlpha(gapA, () => {
    d.line(gx1, gy1, gx2, gy2, p.mute, 2, [6, 6]);
    d.rect(mx - 22 * u, my - 16 * u, 44 * u, 32 * u, { fill: p.stage });
    d.text('?', mx, my, { size: 26, weight: 800, color: p.ink2, align: 'center', base: 'middle' });
    if (!port) d.text(S.l('la brecha', 'the gap'), mx, my + 30 * u, { size: FS(S, 13), weight: 700, color: p.mute, align: 'center', base: 'middle' });
    else d.text(S.l('la brecha', 'the gap'), mx + 30 * u, my, { size: FS(S, 13), weight: 700, color: p.mute, base: 'middle' });
  });
  if (kB > 0) {
    if (port) growArrow(S, gx1, gy1, gx2, gy2, kB, p.ink, 3.5); else growArrow(S, gx1, gy1, gx2, gy2, kB, p.ink, 3.5);
    const a = fr(S, 'alignment', 0.22, 0.34);
    d.withAlpha(a, () => {
      const t = S.l('alineación', 'alignment'), ts = FS(S, 16), tw = d.measure(t, { size: ts, weight: 800 }) + 22 * u;
      const ly = port ? my : my - 24 * u;
      d.rect(mx - tw / 2, ly - 15 * u, tw, 30 * u, { fill: p.surface, stroke: p.ink, lw: 2, r: 3 });
      d.text(t, mx, ly, { size: ts, weight: 800, align: 'center', base: 'middle' });
    });
    const cap = S.l('que el modelo haga lo que la persona pretende', 'so the model does what the person intends');
    const y = port ? R.y + R.h + 8 * u : L.y + L.h + 10 * u;
    d.withAlpha(fr(S, 'alignment', 0.3, 0.45), () => para(S, cap, r.x, y, r.w, FS(S, cmp ? 14 : 16), { weight: 700, align: 'center', maxLines: 2 }));
  }
}

// ── 3 · el recorrido de tres pasos (y su repaso, con nombres) ─────────────────────────────────────
function stepIcon(S: Frame, i: number, cx: number, cy: number, sc: number) {
  const { d, pal: p } = S, u = S.u;
  if (i === 0) {   // una persona escribe
    person(S, cx - 26 * sc * u, cy - 14 * sc * u, Math.max(1.6, 2.6 * sc * u), 'ink');
    for (let k = 0; k < 3; k++) d.rect(cx - 2 * sc * u, cy - 10 * sc * u + k * 9 * sc * u, (k === 2 ? 18 : 30) * sc * u, 4 * sc * u, { fill: alpha(p.ink, 0.35) });
  } else if (i === 1) {   // dos respuestas, una elegida
    [0, 1].forEach((k) => {
      const x = cx - 30 * sc * u + k * 32 * sc * u, y = cy - 14 * sc * u, w = 26 * sc * u, h = 28 * sc * u;
      d.rect(x, y, w, h, { stroke: k ? tone(S, 'dat').c : p.lineStrong, lw: 1.6, r: 3, fill: k ? alpha(tone(S, 'dat').c, 0.12) : p.surface });
      d.text(k ? 'B' : 'A', x + w / 2, y + h / 2, { size: FS(S, 13), weight: 800, color: p.ink2, align: 'center', base: 'middle' });
    });
    mark(S, 'yes', cx + 26 * sc * u, cy - 14 * sc * u, 7 * sc * u);
  } else {   // un ciclo
    const R = 15 * sc * u, ctx = S.ctx, c = tone(S, 'sig').c;
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, R, 0.2 * Math.PI, 1.85 * Math.PI); ctx.stroke(); ctx.restore();
    const ax = cx + R * Math.cos(0.2 * Math.PI), ay = cy + R * Math.sin(0.2 * Math.PI);
    d.arrow(ax + 3 * u, ay - 5 * u, ax, ay, c, 2.4, 8 * u);
    d.text('+', cx, cy, { size: FS(S, 15), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'middle' });
  }
}

export function drawSteps(S: Frame, mode: 'road' | 'recap') {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), k = mode === 'road' ? 'roadmap' : 'recap';
  const gap = (port ? 10 : 18) * u, n = 3;
  const W = Math.min(r.w, 860 * u), X = r.x + (r.w - W) / 2;
  const foot = mode === 'recap' ? (cmp ? 30 : 44) * u : 0;
  const bw = port ? W : (W - 2 * gap) / n, bh = port ? (r.h - foot - 2 * gap) / n : Math.min(r.h - foot - 10 * u, 230 * u);
  const y0 = port ? r.y : r.y + (r.h - foot - bh) / 2;
  const plain = [S.l('Personas escriben ejemplos', 'People write examples'), S.l('Personas comparan respuestas', 'People compare answers'), S.l('El modelo practica con un juez', 'The model practices with a judge')];
  const names = [S.l('ajuste con instrucciones', 'instruction tuning'), S.l('modelo de recompensa', 'reward model'), S.l('RLHF · o DPO, sin juez', 'RLHF · or DPO, no judge')];
  const tones: Tone[] = ['w', 'dat', 'sig'];
  const at = mode === 'road' ? [0.28, 0.5, 0.72] : [0.08, 0.3, 0.52];
  for (let i = 0; i < n; i++) {
    const b: Rect = port ? { x: X, y: y0 + i * (bh + gap), w: bw, h: bh } : { x: X + i * (bw + gap), y: y0, w: bw, h: bh };
    const a = mode === 'road' ? fr(S, k, at[i], at[i] + 0.1) : 1, c = tone(S, tones[i]);
    const aName = mode === 'recap' ? fr(S, k, at[i], at[i] + 0.1) : 0;
    d.withAlpha(a, () => {
      card(S, b, { tone: tones[i], fill: alpha(c.c, 0.07), lw: 2 });
      const numR = (port ? 13 : 16) * u;
      d.circle(b.x + 12 * u + numR, b.y + 12 * u + numR, numR, { fill: c.c });
      d.text(String(i + 1), b.x + 12 * u + numR, b.y + 12 * u + numR + 0.5, { size: port ? 15 : 18, weight: 800, color: p.stage, align: 'center', base: 'middle' });
      if (port) {
        const tx = b.x + 24 * u + 2 * numR, tw = b.x + b.w - tx - 74 * u;
        para(S, plain[i], tx, b.y + 10 * u, tw, FS(S, 15), { weight: 800, maxLines: 2, lh: 1.15 });
        stepIcon(S, i, b.x + b.w - 40 * u, b.y + b.h * 0.42, Math.min(0.85, bh / (110 * u)));
        if (aName > 0) d.withAlpha(aName, () => chip(S, names[i], tx, b.y + b.h - 18 * u, tones[i], { align: 'left', size: 13, maxW: b.x + b.w - tx - 10 * u }));
      } else {
        stepIcon(S, i, b.x + b.w / 2, b.y + b.h * 0.38, cmp ? 0.75 : 1);
        para(S, plain[i], b.x + 12 * u, b.y + b.h * (cmp ? 0.56 : 0.6), b.w - 24 * u, FS(S, 15), { weight: 800, align: 'center', maxLines: 2, lh: 1.15 });
        if (aName > 0) d.withAlpha(aName, () => chip(S, names[i], b.x + b.w / 2, b.y + b.h - (cmp ? 16 : 22) * u, tones[i], { size: 13, maxW: b.w - 16 * u }));
      }
    });
  }
  if (mode === 'recap') d.withAlpha(fr(S, 'recap', 0.74, 0.86), () => para(S, S.l('Todo moldea cómo responde, más que lo que sabe.', 'It all shapes how it answers, more than what it knows.'), r.x, r.y + r.h - foot + 8 * u, r.w, FS(S, cmp ? 14 : 16), { weight: 800, align: 'center', maxLines: 2 }));
  void lines; void paraH; void isCompact;
}
