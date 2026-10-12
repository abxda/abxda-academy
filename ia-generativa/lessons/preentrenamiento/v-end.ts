// El modelo base no es un asistente (indicaciones reales al último punto de control de Pythia-1.4B), el corte de
// conocimiento (The Pile es de 2020; el Mundial de 2022 lo inventa), el resumen y el puente a la lección 24.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, area, card, chip, chipW, fitText, hold, isShort, lineH, lines, mark, measure, para, paraH, provenance, provH, txt } from './draw';
import { BASE_IDS, BASE_OUT, BASE_PROMPT, FINAL, docLines, flat, promptOf, type BaseId } from './pythia';

/** Indicación del modelo base que se muestra: la del control (la demostración la mueve sola). */
export const baseShown = (S: Frame): BaseId => (BASE_IDS as readonly string[]).includes(S.p.base) ? S.p.base : 'chat_capital';

const GLOSS: Record<BaseId, string | null> = {
  chat_capital: '«¿Cuál es la capital de Francia?»',
  chat_poem: '«Escribe un poema corto sobre el mar.»',
  doc_list: '«Preguntas frecuentes. P: ¿Cuál es la capital de Francia? R: París. P: ¿Cuál es la capital de Italia? R:»',
  chat_es: null,
};
const VERDICT: Record<BaseId, { ok: boolean; es: string; en: string }> = {
  chat_capital: { ok: false, es: 'no contesta como asistente: imita una página y se repite', en: 'does not answer like an assistant: it imitates a page and repeats' },
  chat_poem: { ok: false, es: 'no obedece: repite la misma línea', en: 'does not obey: it repeats the same line' },
  doc_list: { ok: true, es: 'completa bien el documento (Roma) y sigue inventando preguntas', en: 'completes the document well (Rome) and keeps inventing questions' },
  chat_es: { ok: false, es: 'no contesta: inventa un diálogo', en: 'does not answer: it makes up a dialogue' },
};

export function drawBase(S: Frame) {
  const aD = hold(S, 'base-def', 'base-q');
  if (aD > 0.01) drawBaseDef(S, aD);
  const aB = ap(S, 'base-q', 0, 0.1);
  if (aB > 0.01) drawBaseDemo(S, aB);
}

function drawBaseDef(S: Frame, a: number) {
  const { d } = S, A = area(S), short = isShort(S), wt = tone(S, 'w');
  const big = short ? 24 : 30, lh = lineH(S, 15) + 10;
  const blockH = lineH(S, big) + 20 + 2 * lh, y0 = A.y + (A.h - blockH) / 2;
  d.withAlpha(a, () => {
    fitText(S, S.l('modelo base', 'base model'), A.x + A.w / 2, y0 + lineH(S, big) / 2, A.w, { s: big, weight: 800, c: wt.ink, align: 'center', a: ap(S, 'base-def', 0.04, 0.18) });
    const items: [boolean, string, number][] = [[true, S.l('sabe continuar textos', 'knows how to continue texts'), 0.3], [false, S.l('todavía no es un asistente', 'is not an assistant yet'), 0.6]];
    const tw = Math.max(...items.map(([, t]) => measure(S, t, 15, false, 700))) + 30, x = A.x + (A.w - Math.min(tw, A.w)) / 2;
    items.forEach(([ok, t, at], i) => {
      const ai = ap(S, 'base-def', at, at + 0.12), y = y0 + lineH(S, big) + 20 + i * lh + lh / 2;
      d.withAlpha(ai, () => { mark(S, x + 8, y, ok, 7); fitText(S, t, x + 28, y, A.w - (x - A.x) - 28, { s: 15, weight: 700 }); });
    });
  });
}

function drawBaseDemo(S: Frame, a: number) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S);
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const id = baseShown(S), since = +(S.st.baseSince ?? -1e9), fade = clamp((S.clock - since) / 0.35);
  const verdict = VERDICT[id];
  const footH = lineH(S, 13.5) * 2 + 10, gap = 12;
  const s = short ? 12.5 : 13, lh = lineH(S, s), hh = lineH(S, 13) + 14;
  // alto de las tarjetas: el que pida la indicación más larga (así no cambian de tamaño al elegir otra)
  const w1 = P ? A.w : (A.w - gap) * 0.42, w2 = P ? A.w : A.w - w1 - gap;
  const wrapDoc = (t: string, w: number) => docLines(t).flatMap((ln) => (ln.trim() ? lines(S, ln, w, { s, mono: true, weight: 700 }) : ['']));
  const need1 = Math.max(...BASE_IDS.map((k) => wrapDoc(BASE_PROMPT(k), w1 - 20).length * lh + (S.lang === 'es' && GLOSS[k] ? paraH(S, GLOSS[k]!, w1 - 20, { s: 12.5, weight: 600, max: 3 }) + 6 : 0)));
  const need2 = Math.min(10, Math.max(...BASE_IDS.map((k) => wrapDoc(BASE_OUT(k), w2 - 20).length))) * lh;
  const availH = A.h - footH;
  const h1 = P ? Math.min((availH - gap) * 0.45, hh + need1 + 10) : Math.min(availH, hh + Math.max(need1, need2) + 10);
  const h2 = P ? Math.min(availH - gap - h1, hh + need2 + 10) : h1;
  const groupH = (P ? h1 + gap + h2 : h1) + footH, oy = A.y + Math.max(0, (A.h - groupH) / 2);
  const c1: Rect = { x: A.x, y: oy, w: w1, h: h1 };
  const c2: Rect = P ? { x: A.x, y: oy + h1 + gap, w: w2, h: h2 } : { x: A.x + w1 + gap, y: oy, w: w2, h: h2 };
  d.withAlpha(a, () => {
    // lo que le escribimos
    card(S, c1);
    fitText(S, S.l('le escribimos', 'we write'), c1.x + 10, c1.y + 8 + lineH(S, 13) / 2, c1.w - 20, { s: 13, weight: 800, c: p.ink2 });
    d.withAlpha(fade, () => {
      const gl = S.lang === 'es' ? GLOSS[id] : null;
      const glH = gl ? paraH(S, gl, c1.w - 20, { s: 12.5, weight: 600, max: 3 }) + 6 : 0;
      const room = Math.max(1, Math.floor((c1.h - hh - glH - 8) / lh));
      const ls = docLines(BASE_PROMPT(id)).flatMap((ln) => (ln.trim() ? lines(S, ln, c1.w - 20, { s, mono: true, weight: 700 }) : ['']));
      const shown = ls.slice(0, room);
      shown.forEach((ln, j) => txt(S, ln, c1.x + 10, c1.y + hh + j * lh + lh / 2, { s, weight: 700, mono: true }));
      if (gl) para(S, gl, c1.x + 10, c1.y + hh + shown.length * lh + 6, c1.w - 20, { s: 12.5, weight: 600, c: p.mute, max: 3 });
    });
    // lo que escribe Pythia
    card(S, c2, { tone: verdict.ok ? 'dat' : 'err', fill: 0.05 });
    fitText(S, S.l('Pythia continúa', 'Pythia continues'), c2.x + 10, c2.y + 8 + lineH(S, 13) / 2, c2.w - 20, { s: 13, weight: 800, c: p.ink2 });
    d.withAlpha(fade, () => {
      const room = Math.max(1, Math.floor((c2.h - hh - 8) / lh));
      const all = docLines(BASE_OUT(id)).flatMap((ln) => (ln.trim() ? lines(S, ln, c2.w - 20, { s, mono: true, weight: 700 }) : ['']));
      const shown = all.slice(0, room);
      if (all.length > room && shown.length) shown[shown.length - 1] = '…';
      shown.forEach((ln, j) => txt(S, ln, c2.x + 10, c2.y + hh + j * lh + lh / 2, { s, weight: 700, mono: true, c: tone(S, verdict.ok ? 'dat' : 'err').ink }));
    });
  });
  // veredicto
  d.withAlpha(a * fade, () => {
    const y = oy + groupH - footH / 2;
    mark(S, A.x + 8, y, verdict.ok, 6);
    para(S, S.l(verdict.es, verdict.en), A.x + 26, y - paraH(S, S.l(verdict.es, verdict.en), A.w - 26, { s: 13.5, weight: 700, max: 2 }) / 2, A.w - 26, { s: 13.5, weight: 700, max: 2, c: tone(S, verdict.ok ? 'dat' : 'err').ink });
  });
  provenance(S, S.l('medición real · Pythia-1.4B, último punto de control · decodificación voraz', 'real measurement · Pythia-1.4B, last checkpoint · greedy decoding'), a);
}

// ═════════ corte de conocimiento ═════════
export function drawCutoff(S: Frame) {
  const { d, pal: p } = S, A0 = area(S), P = S.portrait, short = isShort(S), wt = tone(S, 'w'), er = tone(S, 'err'), dt = tone(S, 'dat');
  const A: Rect = { ...A0, h: A0.h - provH(S) };
  const y0 = 2016, y1 = 2026.5, X = (yr: number) => A.x + 6 + (A.w - 12) * ((yr - y0) / (y1 - y0));
  const lhC = lineH(S, 13), lhL = lineH(S, 12.5), cw0 = A.w - 24;
  // la tarjeta: lo que le escribimos, lo que continúa (✕) y lo que pasó (✓); en pantallas angostas el texto se parte en líneas
  const gFull = flat(FINAL.gen.wc22), gCut = gFull.indexOf('.') > 0 ? gFull.slice(0, gFull.indexOf('.') + 1) : gFull;
  const pL = lines(S, promptOf('wc22'), cw0, { s: 13, mono: true, weight: 700, max: 2 }), gL = lines(S, gCut, cw0 - 22, { s: 13, mono: true, weight: 700, max: 2 });
  // en escenarios bajos (teléfono en horizontal) cabe todo en tres renglones: rótulo y texto en la misma línea
  const inline = short;
  const cardH = inline ? 16 + 3 * (lhC + 6) : 10 + lhL + pL.length * lhC + 6 + lhL + gL.length * lhC + 6 + (lhC + 6) + 10;
  const bandH = lineH(S, 13) + 8, tyOff = lhC + 6 + bandH + 6;
  // en escenarios bajos, «Mundial 2022» va junto al punto (no debajo de los años) para ahorrar alto
  const tlH = short ? tyOff + 8 + lineH(S, 12) + 4 : tyOff + 8 + lineH(S, 12) * 2.4 + 10;
  const oy = A.y + Math.max(0, (A.h - tlH - cardH - 10) / 2);
  const ty = oy + tyOff;
  const a0 = ap(S, 'cutoff', 0.05, 0.18);
  d.withAlpha(a0, () => {
    // eje de años
    d.line(X(y0), ty, X(y1), ty, p.lineStrong, 1.5);
    for (let yr = 2016; yr <= 2026; yr += 1) {
      d.line(X(yr), ty - 3, X(yr), ty + 3, p.lineStrong, 1.2);
      if (yr % 2 === 0) txt(S, String(yr), X(yr), ty + 6 + lineH(S, 12) / 2, { s: 12, weight: 600, mono: true, c: p.mute, align: 'center' });
    }
  });
  // lo que leyó
  const aB = ap(S, 'cutoff', 0.25, 0.4);
  d.withAlpha(aB, () => {
    d.rect(X(y0), ty - bandH - 6, X(2021) - X(y0), bandH, { fill: alpha(dt.c, 0.18), stroke: dt.c, lw: 1.4, r: 3 });
    fitText(S, S.l('lo que leyó (The Pile)', 'what it read (The Pile)'), X(y0) + 8, ty - bandH / 2 - 6, X(2021) - X(y0) - 16, { s: 13, weight: 800, c: dt.ink });
    fitText(S, S.l('no lo vio', 'never saw it'), X(2021) + 8, ty - bandH / 2 - 6, X(y1) - X(2021) - 12, { s: 13, weight: 700, c: p.mute });
  });
  const aC = ap(S, 'cutoff', 0.62, 0.76);
  d.withAlpha(aC, () => {
    d.line(X(2021), oy + 4, X(2021), ty + 4, wt.c, 2.4);
    const lab = S.l('corte de conocimiento', 'knowledge cutoff'), lw = measure(S, lab, 13, false, 800);
    txt(S, lab, clamp(X(2021) - lw / 2, A.x, A.x + A.w - lw), oy + lineH(S, 13) / 2, { s: 13, weight: 800, c: wt.ink, halo: true });
  });
  // el Mundial de 2022: lo inventa
  const aW = ap(S, 'cutoff-demo', 0.04, 0.16);
  if (aW > 0.01) d.withAlpha(aW, () => {
    const x = X(2022.96);
    d.circle(x, ty, 6, { fill: er.c, stroke: p.stage, lw: 2 });
    const lab = S.l('Mundial 2022', '2022 World Cup'), lw = measure(S, lab, 12.5, false, 700);
    if (short) txt(S, lab, Math.min(x + 10, A.x + A.w - lw), ty - bandH / 2 - 6, { s: 12.5, weight: 700, c: er.ink });
    else txt(S, lab, clamp(x - lw / 2, A.x, A.x + A.w - lw), ty + 8 + lineH(S, 12) * 1.6, { s: 12.5, weight: 700, c: er.ink });
  });
  const cardR: Rect = { x: A.x, y: oy + tlH + 10, w: A.w, h: Math.min(cardH, A.y + A.h - oy - tlH - 10) };
  if (aW > 0.01 && cardR.h > 40) d.withAlpha(aW, () => {
    card(S, cardR, { tone: 'err', fill: 0.04 });
    const x = cardR.x + 12;
    if (inline) {
      const rowH = lhC + 6, w = cardR.w - 24;
      let yy = cardR.y + 8;
      const lab1 = S.l('le escribimos: ', 'we write: '), l1w = measure(S, lab1, 12.5, false, 800);
      txt(S, lab1, x, yy + rowH / 2, { s: 12.5, weight: 800, c: p.ink2 });
      fitText(S, promptOf('wc22'), x + l1w, yy + rowH / 2, w - l1w, { s: 13, weight: 700, mono: true });
      yy += rowH;
      mark(S, x + 7, yy + rowH / 2, false, 6);
      fitText(S, `${S.l('Pythia continúa: ', 'Pythia continues: ')}${gCut}`, x + 22, yy + rowH / 2, w - 22, { s: 13, weight: 700, mono: true, c: er.ink });
      yy += rowH;
      const aT = ap(S, 'cutoff-demo', 0.62, 0.76), t = S.l('ganó Argentina', 'Argentina won'), cw = chipW(S, t, 13);
      d.withAlpha(aT, () => { mark(S, x + 7, yy + rowH / 2, true, 6); chip(S, x + 22, yy + 2, t, { s: 13, h: rowH - 4, w: cw, tone: 'dat' }); });
      return;
    }
    let y = cardR.y + 10;
    txt(S, S.l('le escribimos', 'we write'), x, y + lhL / 2, { s: 12.5, weight: 800, c: p.ink2 }); y += lhL;
    pL.forEach((ln) => { txt(S, ln, x, y + lhC / 2, { s: 13, weight: 700, mono: true }); y += lhC; });
    y += 6;
    txt(S, S.l('Pythia continúa', 'Pythia continues'), x, y + lhL / 2, { s: 12.5, weight: 800, c: p.ink2 }); y += lhL;
    mark(S, x + 7, y + lhC / 2, false, 6);
    gL.forEach((ln) => { txt(S, ln, x + 22, y + lhC / 2, { s: 13, weight: 700, mono: true, c: er.ink }); y += lhC; });
    y += 6;
    const aT = ap(S, 'cutoff-demo', 0.62, 0.76), t = S.l('ganó Argentina', 'Argentina won'), cw = chipW(S, t, 13), rowH = lhC + 6;
    d.withAlpha(aT, () => { mark(S, x + 7, y + rowH / 2, true, 6); chip(S, x + 22, y + 2, t, { s: 13, h: rowH - 4, w: cw, tone: 'dat' }); });
  });
  provenance(S, S.l('medición real · Pythia-1.4B, último punto de control · The Pile: 2020 · resultado: FIFA', 'real measurement · Pythia-1.4B, last checkpoint · The Pile: 2020 · result: FIFA'), a0);
  void P;
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S);
  const items = [
    [S.l('Tapar la siguiente pieza y adivinarla', 'Cover the next piece and guess it'), S.l('autosupervisado: el texto trae la respuesta', 'self-supervised: the text carries the answer'), 'err'],
    [S.l('Texto limpio y sin copias', 'Clean text, without copies'), S.l('idioma, calidad, datos personales, duplicados', 'language, quality, personal data, duplicates'), 'dat'],
    [S.l('Primero la gramática', 'Grammar first'), S.l('después, hechos y patrones', 'then facts and patterns'), 'lat'],
    [S.l('Resultado: un modelo base', 'Result: a base model'), S.l('continúa textos; no sabe nada después de su corte', 'continues texts; knows nothing after its cutoff'), 'w'],
  ] as const;
  const gap = short ? 6 : 10, rh = Math.min(short ? 56 : 74, (A.h - 3 * gap) / 4);
  const y0 = A.y + (A.h - (4 * rh + 3 * gap)) / 2;
  items.forEach(([h, sub, tn], i) => {
    const a = ap(S, 'recap', 0.04 + i * 0.2, 0.14 + i * 0.2), y = y0 + i * (rh + gap), t = tone(S, tn);
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      card(S, { x: A.x, y, w: A.w, h: rh }, { tone: tn, fill: 0.05 });
      const r = Math.min(14, rh * 0.28), cx = A.x + 12 + r;
      d.circle(cx, y + rh / 2, r, { fill: alpha(t.c, 0.2), stroke: t.c, lw: 1.5 });
      txt(S, String(i + 1), cx, y + rh / 2 + 0.5, { s: 13, weight: 800, c: t.ink, align: 'center' });
      const x = cx + r + 12, w = A.x + A.w - 10 - x, lh1 = lineH(S, 14.5), lh2 = lineH(S, 12.5);
      const yy = y + (rh - lh1 - lh2 - 2) / 2;
      fitText(S, h, x, yy + lh1 / 2, w, { s: 14.5, weight: 800, c: t.ink });
      fitText(S, sub, x, yy + lh1 + 2 + lh2 / 2, w, { s: 12.5, weight: 600, c: p.ink2 });
    });
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, A = area(S), short = isShort(S), wt = tone(S, 'w');
  const big = short ? 20 : 26;
  const lines3 = [
    { t: S.l('Pythia', 'Pythia'), s: 14, c: p.ink2, at: 0.02 },
    { t: S.l('1 400 millones de parámetros', '1.4 billion parameters'), s: big, c: wt.ink, at: 0.06, mono: true },
    { t: S.l('300 000 millones de tokens leídos', '300 billion tokens read'), s: big, c: wt.ink, at: 0.2, mono: true },
    { t: S.l('¿Cuánto cuesta?', 'What does it cost?'), s: 18, c: p.ink, at: 0.5 },
    { t: S.l('¿Qué se gana al hacerlo más grande?', 'What do you gain by making it bigger?'), s: 18, c: p.ink, at: 0.62 },
    { t: S.l('Lección 24 · Leyes de escala y costos', 'Lesson 24 · Scaling laws and costs'), s: 13, c: p.mute, at: 0.78 },
  ];
  const hs = lines3.map((l) => lineH(S, l.s) + (short ? 4 : 10));
  const total = hs.reduce((a, b) => a + b, 0);
  let y = A.y + Math.max(0, (A.h - total) / 2);
  lines3.forEach((l, i) => {
    const a = ap(S, 'bridge', l.at, l.at + 0.12);
    fitText(S, l.t, A.x + A.w / 2, y + hs[i] / 2, A.w, { s: l.s, weight: 800, c: l.c, align: 'center', a, mono: l.mono });
    y += hs[i];
  });
  void d;
}
