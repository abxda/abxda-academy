// Vistas 3–5: quien escribe (jailbreak), lo que aprendió (sesgo) y de quién es el texto (propiedad intelectual).
// ILUSTRATIVO (rotulado): la línea de rechazo y los pedidos (como en la lección 28), las posiciones de las profesiones
// en los embeddings (las medidas reales están en la lección 14) y el orden de los currículos.
// REAL: Gender Shades (Buolamwini y Gebru, 2018): error máximo 0.8 % (hombres de piel clara) y hasta 34.7 % (mujeres de
// piel oscura), exactitud general de 87.9 % a 93.7 %; Oficina de Derechos de Autor de EE. UU. (enero de 2025); el acuerdo
// de Bartz v. Anthropic (lección 23).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, PATHS, areaH, card, chip, chipH, chipW, fitText, fr, glyph, growArrow, header, lerp2, para, paraH, smooth, tight, win } from './ui';

const head = (S: Frame, k: number, a = 1) => header(S, k, S.L({ es: PATHS[k - 1][0], en: PATHS[k - 1][1] }), a);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Quien escribe: la línea de rechazo y el jailbreak
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawJailbreak(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), err = tone(S, 'err'), dat = tone(S, 'dat');
  head(S, 3);
  const port = S.portrait, padX = 14 * u;
  const x0 = A.x + padX, x1 = A.x + A.w - padX, X = (f: number) => lerp2(x0, x1, f);
  // el bloque (título, eje, rótulos y la tarjeta de abajo) se centra en vertical
  const tt = tight(S), titleGap = (tt && !S.portrait ? 44 : 52) * u, chipGap = 26 * u + 16 * u + chipH(S, 12.5) / 2 + 4 * u;
  const blockH = titleGap + chipGap + chipH(S, 12.5) + (tt ? 10 : 22) * u + 2 * chipH(S, 13) + FS(S, 14) * u + 20 * u;
  const yAxis = A.y + Math.max(0, (A.h - blockH) / 2) + titleGap;
  const xr = X(0.63);
  // título del eje
  d.withAlpha(fr(S, 'jb', 0.06, 0.18), () => {
    fitText(S, S.l('pedidos, de menos a más dañinos', 'requests, from less to more harmful'), x0, yAxis - titleGap, x1 - x0, 14, { weight: 800, color: p.ink2, base: 'top' });
    growArrow(S, x0, yAxis, x1, yAxis, 1, p.lineStrong, 1.6);
  });
  // pedidos
  const xs = [0.04, 0.13, 0.22, 0.31, 0.4, 0.5, 0.71, 0.79, 0.95];
  const rr = 8 * u * Math.max(1, u);
  xs.forEach((f, i) => {
    const a = fr(S, 'jb', 0.1 + i * 0.02, 0.2 + i * 0.02), x = X(f), right = f > 0.63;
    d.withAlpha(a, () => {
      d.circle(x, yAxis, rr, { fill: right ? alpha(err.c, 0.22) : alpha(dat.c, 0.2), stroke: right ? err.c : dat.c, lw: 1.5 });
      if (right) glyph(S, 'cross', x, yAxis, rr * 1.2, err.c, fr(S, 'jb', 0.44, 0.54));
    });
  });
  // la línea de rechazo
  const la = fr(S, 'jb', 0.3, 0.42);
  d.withAlpha(la, () => {
    d.line(xr, yAxis - 34 * u, xr, yAxis + 30 * u, err.c, 2.4, [6, 4]);
    fitText(S, S.l('línea de rechazo', 'refusal line'), xr + 6 * u, yAxis - 30 * u, x1 - xr - 6 * u, 12.5, { weight: 800, color: err.ink, base: 'top' });
  });
  // zonas
  const za = fr(S, 'jb', 0.42, 0.54), zy = yAxis + 26 * u;
  d.withAlpha(za, () => {
    glyph(S, 'check', x0 + 8 * u, zy + 8 * u, 14 * u, dat.ink);
    fitText(S, S.l('los responde', 'it answers them'), x0 + 20 * u, zy + 8 * u, xr - x0 - 28 * u, 13, { weight: 700, color: dat.ink, base: 'middle' });
    glyph(S, 'cross', xr + 12 * u, zy + 8 * u, 13 * u, err.c);
    fitText(S, S.l('los rechaza', 'it refuses them'), xr + 24 * u, zy + 8 * u, x1 - xr - 26 * u, 13, { weight: 700, color: err.ink, base: 'middle' });
  });
  // el pedido dañino que se disfraza
  const hx0 = X(0.87), hx1 = X(0.42);
  const move = smooth(fr(S, 'jb-how', 0.24, 0.56, 'lin'));
  const hx = lerp2(hx0, hx1, move), ha = fr(S, 'jb', 0.58, 0.68);
  if (ha > 0.01) {
    const disguise = fr(S, 'jb-how', 0.06, 0.18);
    d.withAlpha(ha, () => {
      d.circle(hx, yAxis, rr * 1.35, { fill: alpha(err.c, 0.4), stroke: err.c, lw: 2 });
      if (disguise > 0.01) d.circle(hx, yAxis, rr * 2.3, { stroke: tone(S, 'lat').c, lw: 2, dash: [4, 3], a: disguise });
    });
    // el rótulo de la ficha cambia: pedido dañino → disfrazado → (al cruzar la línea) ¡y lo responde!
    const answered = fr(S, 'jb-how', 0.58, 0.66);
    const lab = answered > 0.5 ? S.l('disfrazado: ¡lo responde!', 'disguised: it answers!') : disguise > 0.5 ? S.l('disfrazado de juego de rol', 'dressed up as a role-play') : S.l('pedido dañino', 'harmful request');
    const lw = Math.min(chipW(S, lab, 12.5, 800), x1 - x0), lx = clamp(hx - lw / 2, x0, x1 - lw);
    chip(S, lab, lx, yAxis + chipGap, answered > 0.5 ? 'err' : disguise > 0.5 ? 'lat' : 'err', { size: 12.5, align: 'left', a: ha, weight: 800, maxW: x1 - x0, solid: answered > 0.5 });
  }
  // abajo: qué es un jailbreak y qué hacer
  const by = yAxis + chipGap + chipH(S, 12.5) + (tt ? 10 : 22) * u, bw = x1 - x0;
  const ta = fr(S, 'jb', 0.78, 0.9) * (1 - fr(S, 'jb-how', 0.66, 0.74));
  if (ta > 0.01) {
    const def = S.l('Jailbreak: un texto hecho para cruzar la línea de rechazo.', 'Jailbreak: a text built to get across the refusal line.');
    const h = paraH(S, def, bw - 20 * u, FS(S, 14.5), { weight: 750 }) + 18 * u;
    d.withAlpha(ta, () => { card(S, { x: x0, y: by, w: bw, h }, { tone: 'err', hot: 0.05 }); para(S, def, x0 + 10 * u, by + 9 * u, bw - 20 * u, FS(S, 14.5), { weight: 750, color: p.ink }); });
  }
  const ca = fr(S, 'jb-how', 0.7, 0.8);
  if (ca > 0.01) {
    fitText(S, S.l('No basta con que se niegue. Se suman:', 'Its refusal is not enough. You add:'), x0, by, bw, 14, { weight: 800, color: p.ink, base: 'top', a: ca });
    const items = [S.l('filtros a la entrada y a la salida', 'input and output filters'), S.l('límites a lo que puede hacer', 'limits on what it can do'), S.l('pruebas adversarias', 'adversarial testing')];
    let cx = x0, cy = by + FS(S, 14) * u + 12 * u + chipH(S, 13) / 2;
    items.forEach((t, i) => {
      const w = Math.min(chipW(S, t, 13), bw);
      if (cx + w > x1 + 1) { cx = x0; cy += chipH(S, 13) + 6 * u; }
      chip(S, t, cx, cy, 'dat', { size: 13, align: 'left', a: fr(S, 'jb-how', 0.74 + i * 0.05, 0.82 + i * 0.05), maxW: bw });
      cx += w + 8 * u;
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Lo que aprendió: sesgo
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawBias(S: Frame) {
  head(S, 4);
  const a1 = win(S, 'bias-recall', 'bias-def'), a2 = win(S, 'bias-def', 'bias-shades'), a3 = win(S, 'bias-shades');
  if (a1 > 0.01) S.d.withAlpha(a1, () => drawEmbAxis(S));
  if (a2 > 0.01) S.d.withAlpha(a2, () => drawResumes(S));
  if (a3 > 0.01) S.d.withAlpha(a3, () => drawShades(S));
}

function drawEmbAxis(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), lat = tone(S, 'lat'), err = tone(S, 'err');
  const padX = 18 * u, x0 = A.x + padX, x1 = A.x + A.w - padX, cy = A.y + A.h * 0.46;
  const X = (v: number) => lerp2(x0, x1, (v + 1) / 2);
  d.withAlpha(fr(S, 'bias-recall', 0.18, 0.3), () => {
    growArrow(S, X(0), cy, x0, cy, 1, p.lineStrong, 1.6);
    growArrow(S, X(0), cy, x1, cy, 1, p.lineStrong, 1.6);
    d.line(X(0), cy - 8 * u, X(0), cy + 8 * u, p.lineStrong, 1.4);
    const lw = (x1 - x0) / 2 - 8 * u;
    fitText(S, S.l('más femenino', 'more feminine'), x0, cy + 26 * u, lw, 13, { weight: 700, color: p.mute, base: 'top' });
    fitText(S, S.l('más masculino', 'more masculine'), x1, cy + 26 * u, lw, 13, { weight: 700, color: p.mute, base: 'top', align: 'right' });
  });
  const W: [string, string, number, boolean][] = [
    ['enfermera', 'nurse', -0.74, false], ['recepcionista', 'receptionist', -0.42, false], ['ingeniero', 'engineer', 0.38, false], ['mecánico', 'mechanic', 0.72, true],
  ];
  W.forEach(([es, en, v, hot], i) => {
    const a = fr(S, 'bias-recall', 0.32 + i * 0.07, 0.42 + i * 0.07), x = X(v), up = i % 2 === 0;
    d.withAlpha(a, () => {
      d.circle(x, cy, (hot ? 7 : 5.5) * u, { fill: hot ? err.c : lat.c });
      const ty = up ? cy - 16 * u : cy - 16 * u - (FS(S, 13.5) + 6) * u;
      fitText(S, S.l(es, en), x, ty, Math.min(150 * u, (x1 - x0) / 3), hot ? 15 : 13.5, { weight: hot ? 800 : 650, color: hot ? err.ink : p.ink, base: 'bottom', align: 'center', halo: true });
      d.line(x, cy - 7 * u, x, ty + 2 * u, alpha(hot ? err.c : lat.c, 0.6), 1);
    });
  });
  const ha = fr(S, 'bias-recall', 0.68, 0.8);
  d.withAlpha(ha, () => para(S, S.l('El modelo hereda los patrones de sus datos.', 'The model inherits the patterns in its data.'), x0, cy + 60 * u, x1 - x0, FS(S, 15), { weight: 800, color: p.ink, align: 'center' }));
}

function drawResumes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, sig = tone(S, 'sig'), lat = tone(S, 'lat'), err = tone(S, 'err');
  // seis currículos: ♀ = círculo (candidata), ♂ = cuadro (candidato); orden por experiencia y orden del filtro sesgado
  const R = [
    { f: true, yrs: 9 }, { f: false, yrs: 8 }, { f: true, yrs: 7 }, { f: false, yrs: 6 }, { f: true, yrs: 5 }, { f: false, yrs: 4 },
  ];
  const biased = [1, 3, 0, 5, 2, 4];   // posición final de cada currículo (las candidatas bajan)
  const listW = port ? A.w : Math.min(A.w * 0.54, 360 * u), listH = port ? A.h * 0.6 : A.h;
  const rowH = Math.min((listH - FS(S, 13) * u - 14 * u - FS(S, 12.5) * u - 8 * u) / 6, 40 * u), lx = A.x, ly = A.y + FS(S, 13) * u + 12 * u;
  d.withAlpha(fr(S, 'bias-def', 0.02, 0.14), () => fitText(S, S.l('filtro de currículos de mecánicos', 'mechanic résumé screener'), lx, A.y, listW, 13, { weight: 800, color: p.ink2, base: 'top' }));
  const k = smooth(fr(S, 'bias-def', 0.18, 0.48, 'lin'));
  R.forEach((r, i) => {
    const y = ly + lerp2(i, biased[i], k) * rowH, a = fr(S, 'bias-def', 0.04 + i * 0.02, 0.14 + i * 0.02);
    const t = r.f ? lat : sig;
    d.withAlpha(a, () => {
      d.rect(lx, y + 2 * u, listW, rowH - 4 * u, { fill: alpha(t.c, r.f && k > 0.5 ? 0.16 : 0.08), stroke: t.c, lw: 1.2, r: 3 });
      const s = Math.min(rowH * 0.4, 12 * u), cx = lx + 12 * u + s / 2, cyy = y + rowH / 2;
      if (r.f) d.circle(cx, cyy, s / 2, { fill: t.c }); else d.rect(cx - s / 2, cyy - s / 2, s, s, { fill: t.c });
      const lab = r.f ? S.l(`candidata · ${r.yrs} años de experiencia`, `woman · ${r.yrs} years’ experience`) : S.l(`candidato · ${r.yrs} años de experiencia`, `man · ${r.yrs} years’ experience`);
      fitText(S, lab, cx + s / 2 + 8 * u, cyy, listW - s - 30 * u, 13, { weight: 650, color: p.ink, base: 'middle' });
    });
  });
  d.withAlpha(fr(S, 'bias-def', 0.2, 0.3), () => {
    const lab = S.l('las candidatas bajan', 'the women drop'), x = lx + listW - 4 * u;
    if (k > 0.05) fitText(S, lab, x, ly + 6 * rowH + 6 * u, listW * 0.6, 12.5, { weight: 800, color: err.ink, base: 'top', align: 'right' });
  });
  // el término
  const tx = port ? A.x : lx + listW + 24 * u, ty = port ? ly + 6 * rowH + FS(S, 12.5) * u + 18 * u : A.y + 30 * u, tw = port ? A.w : A.x + A.w - tx;
  const def = S.l('Sesgo: un error que se repite contra un grupo de personas.', 'Bias: an error that repeats against a group of people.');
  const note = S.l('No es el sesgo b de la lección 3.', 'Not the bias b from lesson 3.');
  const h = paraH(S, def, tw - 20 * u, FS(S, 14.5), { weight: 750 }) + 18 * u;
  if (ty + h <= A.y + A.h + 4 * u) {
    d.withAlpha(fr(S, 'bias-def', 0.55, 0.67), () => { card(S, { x: tx, y: ty, w: tw, h }, { tone: 'err', hot: 0.05 }); para(S, def, tx + 10 * u, ty + 9 * u, tw - 20 * u, FS(S, 14.5), { weight: 750, color: p.ink }); });
    if (ty + h + 10 * u + FS(S, 13) * u <= A.y + A.h + 4 * u) d.withAlpha(fr(S, 'bias-def', 0.84, 0.94), () => fitText(S, note, tx, ty + h + 10 * u, tw, 13, { weight: 700, color: p.mute, base: 'top', italic: true }));
  }
}

function drawShades(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), err = tone(S, 'err');
  const title = S.l('Error al adivinar el género en fotos: el peor de tres sistemas comerciales', 'Error guessing gender from photos: the worst of three commercial systems');
  const tH = paraH(S, title, A.w, FS(S, 14.5), { weight: 800 });
  const port = S.portrait, labW = port ? 0 : Math.min(220 * u, A.w * 0.32);
  const bx = A.x + labW, bw = A.w - labW - 80 * u, max = 40;
  const rowH = Math.min((A.h - tH - 110 * u) / 2, port ? 78 * u : 66 * u);
  const blockH = tH + (tight(S) ? 10 : 20) * u + 2 * rowH + 4 * u + FS(S, 12) * u + 22 * u + chipH(S, 13.5) / 2 + 10 * u + FS(S, 15) * u * 2.6;
  const yTop = A.y + Math.max(0, (A.h - blockH) / 2);
  d.withAlpha(fr(S, 'bias-shades', 0.08, 0.2), () => para(S, title, A.x, yTop, A.w, FS(S, 14.5), { weight: 800, color: p.ink2 }));
  const top = yTop + tH + (tight(S) ? 10 : 20) * u;
  const rows: { lab: string; v: number; f: [string, number] }[] = [
    { lab: S.l('hombres de piel clara', 'lighter-skinned men'), v: 0.8, f: ['bias-shades', 0.3] },
    { lab: S.l('mujeres de piel oscura', 'darker-skinned women'), v: 34.7, f: ['bias-shades-2', 0.04] },
  ];
  // eje
  const axY = top + rows.length * rowH + 4 * u;
  d.withAlpha(fr(S, 'bias-shades', 0.18, 0.28), () => {
    d.line(bx, axY, bx + bw, axY, p.lineStrong, 1.2);
    [0, 10, 20, 30, 40].forEach((t) => { const x = bx + (t / max) * bw; d.line(x, axY, x, axY + 4 * u, p.lineStrong, 1); d.text(`${t}${S.l(' %', '%')}`, x, axY + 7 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: t === 0 ? 'left' : 'center', base: 'top' }); });
  });
  rows.forEach((r, i) => {
    const a = fr(S, r.f[0], r.f[1], r.f[1] + 0.1), g = fr(S, r.f[0], r.f[1] + 0.04, r.f[1] + 0.3, 'out');
    const y = top + i * rowH, barY = port ? y + FS(S, 13.5) * u + 8 * u : y + rowH * 0.2, barH = port ? rowH - FS(S, 13.5) * u - 18 * u : rowH * 0.56;
    d.withAlpha(a, () => {
      if (port) fitText(S, r.lab, bx, y + 2 * u, A.w, 13.5, { weight: 700, color: p.ink, base: 'top' });
      else fitText(S, r.lab, bx - 10 * u, barY + barH / 2, labW - 14 * u, 14, { weight: 700, color: p.ink, base: 'middle', align: 'right' });
      d.rect(bx, barY, bw, barH, { fill: alpha(p.ink, 0.04) });
      const w = Math.max(2 * u, (r.v / max) * bw * g);
      d.rect(bx, barY, w, barH, { fill: alpha(err.c, i ? 0.75 : 0.45), stroke: err.c, lw: 1.2 });
      d.text(`${S.n(r.v, 1)}${S.l(' %', '%')}`, bx + w + 8 * u, barY + barH / 2, { size: FS(S, 15), weight: 800, font: 'mono', color: err.ink, base: 'middle', a: clamp(g * 1.4) });
    });
  });
  // acierto general y la lección
  const cy0 = axY + 7 * u + FS(S, 12) * u + 12 * u + chipH(S, 13.5) / 2;
  const accLab = S.l(`acierto general: ${S.n(87.9, 1)} % a ${S.n(93.7, 1)} %`, `overall accuracy: ${S.n(87.9, 1)}% to ${S.n(93.7, 1)}%`);
  chip(S, accLab, A.x + (port ? 0 : labW), cy0, 'dat', { size: 13.5, align: 'left', a: fr(S, 'bias-shades-2', 0.42, 0.54), maxW: A.w - (port ? 0 : labW) });
  const msg = S.l('El problema solo se ve al medir por grupo.', 'The problem only shows when you measure by group.');
  if (cy0 + chipH(S, 13.5) + 8 * u + FS(S, 15) * u < A.y + A.h + 6 * u)
    d.withAlpha(fr(S, 'bias-shades-2', 0.7, 0.82), () => para(S, msg, A.x + (port ? 0 : labW), cy0 + chipH(S, 13.5) / 2 + 10 * u, A.w - (port ? 0 : labW), FS(S, 15), { weight: 800, color: err.ink }));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// De quién es el texto
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawIP(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, w = tone(S, 'w');
  head(S, 5);
  // tres zonas: lo que entra → modelo → lo que sale. Las alturas se calculan con el contenido y el conjunto se centra.
  const gap = (tight(S) ? 10 : 20) * u, titleH = FS(S, 14) * u + (tight(S) ? 6 : 12) * u, chH = chipH(S, 13);
  const mwL = Math.min(A.w * 0.18, 140 * u), sw = port ? A.w : (A.w - mwL - 4 * gap) / 2;
  const gs = (tight(S) ? 24 : 30) * u, ls = (tight(S) ? 42 : 54) * u;
  const outTxt = S.l('EE. UU., 2025: un prompt no basta para ser autor del resultado.', 'U.S., 2025: a prompt alone does not make you the author.');
  const cardH = paraH(S, outTxt, sw - 20 * u, FS(S, 14), { weight: 700 }) + 18 * u;
  const inH = titleH + gs + 14 * u + chH * 2 + 6 * u, outH = titleH + ls + 12 * u + cardH;
  const mh = Math.max(46 * u, chipH(S, 16) + 16 * u);
  let zin: Rect, zout: Rect, mr: Rect;
  if (port) {
    const total = inH + gap * 1.6 + mh + gap * 1.6 + outH, y0 = A.y + Math.max(0, (A.h - total) / 2);
    zin = { x: A.x, y: y0, w: sw, h: inH };
    const mw = Math.min(A.w * 0.6, 200 * u);
    mr = { x: A.x + (A.w - mw) / 2, y: y0 + inH + gap * 1.6, w: mw, h: mh };
    zout = { x: A.x, y: mr.y + mh + gap * 1.6, w: sw, h: outH };
  } else {
    const H = Math.max(inH, outH), y0 = A.y + Math.max(0, (A.h - H) / 2);
    zin = { x: A.x, y: y0, w: sw, h: H };
    zout = { x: A.x + sw + 2 * gap + mwL + 2 * gap, y: y0, w: sw, h: H };
    const rowC = y0 + titleH + Math.max(gs, ls) / 2;
    mr = { x: A.x + sw + 2 * gap, y: rowC - mh / 2, w: mwL, h: mh };
  }
  // el modelo
  d.withAlpha(fr(S, 'ip-in', 0.04, 0.16), () => {
    d.rect(mr.x, mr.y, mr.w, mr.h, { fill: alpha(w.c, 0.12), stroke: w.c, lw: 1.6, r: 6 * u });
    fitText(S, S.l('modelo', 'model'), mr.x + mr.w / 2, mr.y + mr.h / 2, mr.w - 12 * u, 16, { weight: 800, color: w.ink, align: 'center', base: 'middle' });
  });
  // flechas
  const ai = fr(S, 'ip-in', 0.3, 0.44), ao = fr(S, 'ip-out', 0.06, 0.2);
  if (port) {
    growArrow(S, A.x + A.w / 2, zin.y + zin.h + 4 * u, A.x + A.w / 2, mr.y - 4 * u, ai, p.ink2, 2);
    growArrow(S, A.x + A.w / 2, mr.y + mr.h + 4 * u, A.x + A.w / 2, zout.y - 4 * u, ao, p.ink2, 2);
  } else {
    growArrow(S, zin.x + zin.w + 4 * u, mr.y + mr.h / 2, mr.x - 4 * u, mr.y + mr.h / 2, ai, p.ink2, 2);
    growArrow(S, mr.x + mr.w + 4 * u, mr.y + mr.h / 2, zout.x - 4 * u, mr.y + mr.h / 2, ao, p.ink2, 2);
  }
  // lo que entra
  d.withAlpha(fr(S, 'ip-in', 0.08, 0.2), () => fitText(S, S.l('Lo que entra', 'What goes in'), zin.x, zin.y, zin.w, 14, { weight: 800, color: p.ink2, base: 'top' }));
  let y = zin.y + titleH;
  [0, 1, 2].forEach((i) => glyph(S, 'book', zin.x + gs / 2 + i * (gs + 6 * u), y + gs / 2, gs, tone(S, 'dat').ink, fr(S, 'ip-in', 0.14 + i * 0.04, 0.24 + i * 0.04)));
  const tx = zin.x + 3 * (gs + 6 * u) + 4 * u;
  d.withAlpha(fr(S, 'ip-in', 0.2, 0.3), () => para(S, S.l('libros y textos con dueño', 'books and texts with owners'), tx, y + gs / 2 - FS(S, 14) * u * 0.65, zin.x + zin.w - tx, FS(S, 14), { weight: 700, color: p.ink, maxLines: 2 }));
  y += gs + 14 * u + chH / 2;
  chip(S, S.l('lección 23: demandas', 'lesson 23: lawsuits'), zin.x, y, 'err', { size: 13, align: 'left', a: fr(S, 'ip-in', 0.5, 0.6), maxW: zin.w });
  chip(S, S.l(`acuerdo de ${S.n(1500, 0)} millones de dólares`, '1.5-billion-dollar settlement'), zin.x, y + chH + 6 * u, 'err', { size: 13, align: 'left', a: fr(S, 'ip-in', 0.72, 0.82), maxW: zin.w });
  // lo que sale
  d.withAlpha(fr(S, 'ip-out', 0.12, 0.22), () => fitText(S, S.l('Lo que sale', 'What comes out'), zout.x, zout.y, zout.w, 14, { weight: 800, color: p.ink2, base: 'top' }));
  y = zout.y + titleH;
  const lx = zout.x + ls / 2 + 2 * u, ly = y + ls / 2, ink = tone(S, 'lat').ink;
  d.withAlpha(fr(S, 'ip-out', 0.16, 0.28), () => {
    // un logotipo genérico: una bicicleta dentro de un círculo
    d.circle(lx, ly, ls / 2, { fill: alpha(tone(S, 'lat').c, 0.14), stroke: tone(S, 'lat').c, lw: 1.6 });
    const r = ls * 0.15;
    d.circle(lx - ls * 0.2, ly + ls * 0.1, r, { stroke: ink, lw: 1.6 }); d.circle(lx + ls * 0.2, ly + ls * 0.1, r, { stroke: ink, lw: 1.6 });
    d.polyline([[lx - ls * 0.2, ly + ls * 0.1], [lx - ls * 0.04, ly - ls * 0.12], [lx + ls * 0.12, ly - ls * 0.12], [lx + ls * 0.2, ly + ls * 0.1]], ink, 1.6);
  });
  const ox = zout.x + ls + 12 * u;
  d.withAlpha(fr(S, 'ip-out', 0.22, 0.32), () => fitText(S, S.l('logotipo generado', 'generated logo'), ox, ly - 3 * u, zout.x + zout.w - ox, 14, { weight: 700, color: p.ink, base: 'bottom' }));
  chip(S, S.l('¿de quién es?', 'whose is it?'), ox, ly + chH / 2 + 2 * u, 'err', { size: 13, align: 'left', a: fr(S, 'ip-out', 0.34, 0.44), maxW: zout.x + zout.w - ox });
  const cy = y + ls + 12 * u;
  d.withAlpha(fr(S, 'ip-out', 0.5, 0.62), () => { card(S, { x: zout.x, y: cy, w: zout.w, h: cardH }, { tone: 'err', hot: 0.05 }); para(S, outTxt, zout.x + 10 * u, cy + 9 * u, zout.w - 20 * u, FS(S, 14), { weight: 700, color: p.ink }); });
}

export function riskSource(S: Frame): string {
  if (S.on('ip-out')) return S.l('Oficina de Derechos de Autor de EE. UU., informe parte 2 (enero de 2025) · logotipo ilustrativo', 'U.S. Copyright Office, report part 2 (January 2025) · illustrative logo');
  if (S.on('ip-in')) return S.l('Bartz v. Anthropic (lección 23)', 'Bartz v. Anthropic (lesson 23)');
  if (S.on('bias-shades')) return S.l('Buolamwini y Gebru (2018), Gender Shades: 1 270 rostros; IBM, Microsoft y Face++', 'Buolamwini and Gebru (2018), Gender Shades: 1,270 faces; IBM, Microsoft, and Face++');
  if (S.on('bias-def')) return S.l('Ilustrativo: currículos y orden inventados', 'Illustrative: made-up résumés and ranking');
  if (S.on('bias-recall')) return S.l('Esquema ilustrativo · las medidas reales están en la lección 14', 'Illustrative sketch · the real measurements are in lesson 14');
  if (S.on('jb')) return S.l('Esquema ilustrativo, como la línea de rechazo de la lección 28 · Wei et al. (2023)', 'Illustrative sketch, like the refusal line in lesson 28 · Wei et al. (2023)');
  return '';
}
