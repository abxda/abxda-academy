// Vistas 8 y 9: lo que dicen los estudios y las personas.
// REAL: Brynjolfsson, Li y Raymond (QJE 140(2), 2025): 5 172 agentes de atención; consultas resueltas por hora +15 % en
// promedio, +30 % en los menos hábiles y menos experimentados, poco efecto en los más experimentados (versión de trabajo
// de 2023: 14 % y 34 %). Gartner (29 de julio de 2024): al menos el 30 % de los proyectos de IA generativa se abandonarán
// tras la prueba de concepto para fines de 2025, por datos de mala calidad, controles de riesgo insuficientes, costos
// crecientes o valor poco claro (predicción). Dell’Acqua et al. (HBS 24-013, 2023): 758 consultores; en 18 tareas al
// alcance de GPT-4, 25.1 % más rápido (y 12.2 % más tareas); en una tarea fuera de su alcance, 19 % menos probabilidad de
// acertar que sin IA.
// ILUSTRATIVO: la forma de la frontera y la posición de las tareas (esquema).
import { alpha, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, areaH, card, chip, chipH, fitText, fr, glyph, header, para, paraH, person, tight, win } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 8 · Un caso medido (Brynjolfsson et al.) y la predicción de Gartner
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawStudies(S: Frame) {
  header(S, 5, undefined, 1);
  const a1 = win(S, 'real-study', 'pilots-fail'), a2 = win(S, 'pilots-fail');
  if (a1 > 0.003) S.d.withAlpha(a1, () => drawAgents(S));
  if (a2 > 0.003) S.d.withAlpha(a2, () => drawGartner(S));
}

function drawAgents(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  const title = S.l('Un asistente de IA para más de 5 000 agentes de atención', 'An AI assistant for more than 5,000 customer support agents');
  const sub = S.l('consultas resueltas por hora, frente a quienes aún no lo tenían', 'issues resolved per hour, compared with agents who did not have it yet');
  const ts = FS(S, tight(S) ? 15 : 17), th = paraH(S, title, A.w, ts, { weight: 800, maxLines: 2 });
  const rows: [string, number, string, number][] = [
    [S.l('Todos, en promedio', 'Everyone, on average'), 15, '+15 %', 0.45],
    [S.l('Los menos experimentados', 'The least experienced'), 30, '+30 %', 0.82],
    [S.l('Los más expertos', 'The most experienced'), 1.2, S.l('casi igual', 'about the same'), 0.92],
  ];
  const rowH = Math.min(port ? 62 * u : 56 * u, (A.h - th - gap * 3 - FS(S, 13) * u * 1.4) / 3);
  const total = th + gap * 0.6 + paraH(S, sub, A.w, FS(S, 13), { weight: 650, maxLines: 2 }) + gap + 3 * rowH;
  let y = A.y + Math.max(0, (A.h - total) / 2.4);
  d.withAlpha(fr(S, 'real-study', 0.12, 0.24), () => para(S, title, A.x, y, A.w, ts, { weight: 800, color: p.ink, maxLines: 2 }));
  y += th + gap * 0.6;
  y += para(S, sub, A.x, y, A.w, FS(S, 13), { weight: 650, color: p.mute, a: fr(S, 'real-study', 0.3, 0.4), italic: true, maxLines: 2 }) + gap;
  const labW = port ? A.w : Math.min(A.w * 0.34, 260 * u);
  const bx = port ? A.x : A.x + labW, bwMax = (port ? A.w : A.w - labW) * 0.72;
  rows.forEach(([lab, v, txt, f]) => {
    const a = fr(S, 'real-study', f - 0.06, f + 0.06), k = fr(S, 'real-study', f - 0.04, f + 0.12, 'io');
    d.withAlpha(a, () => {
      const by = port ? y + FS(S, 13.5) * u * 1.3 : y + rowH / 2 - 9 * u;
      if (port) fitText(S, lab, A.x, y, A.w, 13.5, { weight: 750, color: p.ink, base: 'top' });
      else fitText(S, lab, A.x, y + rowH / 2, labW - 12 * u, 14, { weight: 750, color: p.ink, base: 'middle' });
      const w = Math.max(3, (bwMax * v) / 30) * k, bh = 18 * u;
      d.rect(bx, by, w, bh, { fill: tone(S, 'dat').c, r: 2 });
      fitText(S, txt, bx + w + 8 * u, by + bh / 2, A.x + A.w - bx - w - 8 * u, 14, { weight: 800, color: tone(S, 'dat').ink, base: 'middle' });
    });
    y += rowH;
  });
}

function drawGartner(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  const title = S.l('Predicción de Gartner, 2024', 'Gartner’s prediction, 2024');
  const sub = S.l('al menos 3 de cada 10 proyectos de IA generativa, abandonados tras la prueba de concepto (para fines de 2025)', 'at least 3 in 10 generative AI projects abandoned after proof of concept (by the end of 2025)');
  const n0 = 10, s0 = Math.min(46 * u, (A.w - (n0 - 1) * 8 * u) / n0);
  const est = FS(S, 17) * u * 1.4 + paraH(S, sub, A.w, FS(S, tight(S) ? 13 : 14), { weight: 650, maxLines: 3 }) + gap + s0 + gap * 1.2 + FS(S, 13.5) * u * 1.4 + 2 * (chipH(S, 13.5) + 6 * u);
  let y = A.y + Math.max(0, (A.h - est) / 2.4);
  fitText(S, title, A.x, y, A.w, 17, { weight: 800, color: p.ink, base: 'top', a: fr(S, 'pilots-fail', 0.1, 0.2) });
  y += FS(S, 17) * u * 1.4;
  const sh = para(S, sub, A.x, y, A.w, FS(S, tight(S) ? 13 : 14), { weight: 650, color: p.ink2, a: fr(S, 'pilots-fail', 0.3, 0.42), maxLines: 3 });
  y += sh + gap;
  // diez proyectos; tres se abandonan
  const n = 10, s = Math.min(46 * u, (A.w - (n - 1) * 8 * u) / n), gx = 8 * u;
  const rowW = n * s + (n - 1) * gx, x0 = A.x + (port ? (A.w - rowW) / 2 : 0);
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (s + gx), a = fr(S, 'pilots-fail', 0.34 + i * 0.012, 0.42 + i * 0.012), bad = i >= 7, ka = fr(S, 'pilots-fail', 0.5, 0.6);
    d.withAlpha(a, () => {
      d.rect(x, y, s, s, { fill: bad && ka > 0.5 ? alpha(p.ink, 0.04) : alpha(tone(S, 'sig').c, 0.15), stroke: bad && ka > 0.5 ? p.lineStrong : tone(S, 'sig').c, lw: 1.4, dash: bad && ka > 0.5 ? [4, 3] : undefined, r: 4 });
      glyph(S, 'doc', x + s / 2, y + s / 2, s * 0.55, bad && ka > 0.5 ? p.mute : tone(S, 'sig').ink);
      if (bad) glyph(S, 'cross', x + s / 2, y + s / 2, s * 0.6, tone(S, 'err').ink, ka);
    });
  }
  y += s + gap * 1.2;
  // por qué
  fitText(S, S.l('Por qué:', 'Why:'), A.x, y, A.w, 13.5, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'pilots-fail', 0.64, 0.72) });
  y += FS(S, 13.5) * u * 1.4;
  const reasons: [string, number][] = [
    [S.l('datos de mala calidad', 'poor data quality'), 0.7], [S.l('riesgos sin control', 'inadequate risk controls'), 0.77],
    [S.l('costos que crecen', 'escalating costs'), 0.84], [S.l('valor poco claro', 'unclear business value'), 0.9],
  ];
  let x = A.x;
  const ch = chipH(S, 13.5) + 6 * u;
  reasons.forEach(([t, f]) => {
    const w = S.d.measure(t, { size: FS(S, 13.5), weight: 700 }) + 14 * u;
    if (x + w > A.x + A.w) { x = A.x; y += ch; }
    chip(S, t, x, y + ch / 2, 'err', { size: 13.5, align: 'left', weight: 700, a: fr(S, 'pilots-fail', f, f + 0.08), maxW: A.w });
    x += w + 8 * u;
  });
  void card; void person; void hash;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 9 · Las personas: gestión del cambio y la frontera irregular
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawPeople(S: Frame) {
  header(S, 6, undefined, fr(S, 'change', 0, 0.1));
  const a1 = win(S, 'change', 'jagged'), a2 = win(S, 'jagged');
  if (a1 > 0.003) S.d.withAlpha(a1, () => drawChange(S));
  if (a2 > 0.003) S.d.withAlpha(a2, () => drawJagged(S));
}

function drawChange(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  const title = S.l('Gestión del cambio', 'Change management');
  // todo el grupo (título, cajas y la pastilla final) se centra en el alto disponible
  const sc1 = Math.max(2, Math.min(4 * u, 3.4 * u)), lh1 = FS(S, tight(S) ? 13 : 14) * u * 1.5, bh1 = (k: number) => 20 * u + 9 * sc1 + 8 * u + k * lh1;
  const estH = FS(S, 17) * u * 1.5 + gap * 0.4 + (port ? bh1(1) + gap * 1.8 + bh1(3) : bh1(3)) + gap * 1.4 + chipH(S, 14) + gap;
  const y0 = A.y + Math.max(0, (A.h - estH) / 2.5);
  fitText(S, title, A.x, y0, A.w, 17, { weight: 800, color: p.ink, base: 'top', a: fr(S, 'change', 0.12, 0.24) });
  const top = y0 + FS(S, 17) * u * 1.5 + gap * 0.4;
  const train = S.l('Explicarlo y capacitar', 'Explain it, and train people');
  const trH = chipH(S, 14) + gap;
  const bodyH = A.y + A.h - top - trH;
  // cada caja mide lo que su contenido: la persona y sus renglones
  const sc0 = Math.max(2, Math.min(4 * u, 3.4 * u)), lh0 = FS(S, tight(S) ? 13 : 14) * u * 1.5, boxH = (k: number) => 10 * u * 2 + 9 * sc0 + 8 * u + k * lh0;
  const hB = Math.min(boxH(1), port ? bodyH * 0.32 : bodyH), hA = Math.min(boxH(3), port ? bodyH * 0.6 : bodyH);
  const before: Rect = port ? { x: A.x, y: top, w: A.w, h: hB } : { x: A.x, y: top, w: A.w * 0.36, h: hA };
  const after: Rect = port ? { x: A.x, y: top + hB + gap * 1.8, w: A.w, h: hA } : { x: A.x + A.w * 0.36 + gap * 3, y: top, w: A.w * 0.64 - gap * 3, h: hA };
  const box = (r: Rect, lab: string, items: [string, number][], t: 'ink' | 'sig', a0: number) => {
    d.withAlpha(a0, () => {
      card(S, r, { tone: t, hot: 0.04 });
      const pad = 10 * u, sc = sc0;
      person(S, r.x + pad, r.y + pad, sc, t === 'ink' ? 'mute' : 'sig');
      fitText(S, lab, r.x + pad + 6 * sc + 10 * u, r.y + pad + 4.5 * sc, r.w - 2 * pad - 6 * sc - 10 * u, 14.5, { weight: 800, color: t === 'ink' ? p.ink2 : tone(S, 'sig').ink, base: 'middle' });
      let y = r.y + pad + 9 * sc + 8 * u;
      const lh = FS(S, tight(S) ? 13 : 14) * u * 1.5;
      items.forEach(([it, f]) => {
        if (y + lh > r.y + r.h + 2) return;
        const a = fr(S, 'change', f, f + 0.08);
        glyph(S, 'check', r.x + pad + 7 * u, y + lh / 2, 12 * u, t === 'ink' ? p.mute : tone(S, 'sig').ink, a);
        fitText(S, it, r.x + pad + 20 * u, y + lh / 2, r.w - 2 * pad - 20 * u, tight(S) ? 13 : 14, { weight: 650, color: p.ink, base: 'middle', a });
        y += lh;
      });
    });
  };
  box(before, S.l('Antes', 'Before'), [[S.l('contesta cada duda', 'answers every question'), 0.36]], 'ink', fr(S, 'change', 0.3, 0.4));
  box(after, S.l('Ahora', 'Now'), [[S.l('revisa respuestas', 'reviews answers'), 0.48], [S.l('atiende lo difícil', 'handles the hard ones'), 0.56], [S.l('avisa si la IA falla', 'flags when the AI fails'), 0.66]], 'sig', fr(S, 'change', 0.44, 0.54));
  // flecha
  d.withAlpha(fr(S, 'change', 0.44, 0.54), () => {
    if (port) d.arrow(A.x + A.w / 2, before.y + before.h + 3 * u, A.x + A.w / 2, after.y - 3 * u, p.ink2, 1.8, 7);
    else d.arrow(before.x + before.w + 6 * u, before.y + before.h / 2, after.x - 6 * u, before.y + before.h / 2, p.ink2, 1.8, 7);
  });
  chip(S, train, A.x, Math.max(before.y + before.h, after.y + after.h) + gap * 1.4 + chipH(S, 14) / 2, 'dat', { size: 14, align: 'left', solid: true, a: fr(S, 'change', 0.84, 0.94), maxW: A.w });
}

/** La frontera irregular: lo que la IA hace bien no tiene un borde liso (esquema ilustrativo). */
function drawJagged(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  const title = S.l('758 consultores, con y sin IA', '758 consultants, with and without AI');
  fitText(S, title, A.x, A.y, A.w, 16, { weight: 800, color: p.ink, base: 'top', a: fr(S, 'jagged', 0.2, 0.32) });
  const top = A.y + FS(S, 16) * u * 1.5 + gap * 0.3;
  const R: Rect = port ? { x: A.x, y: top, w: A.w, h: (A.y + A.h - top) * 0.58 } : { x: A.x, y: top, w: A.w * 0.55, h: A.y + A.h - top };
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2, rad = Math.min(R.w, R.h) * 0.42;
  // el borde: radio irregular (dientes); en el ángulo NOTCH hay una muesca honda
  const N = 22, NOTCH = 5;
  const rOf = (i: number) => rad * (i === NOTCH ? 0.5 : 0.78 + 0.22 * hash(i, 31));
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) { const t = (i / N) * Math.PI * 2 - Math.PI / 2, r = rOf(i); pts.push([cx + Math.cos(t) * r * (R.w > R.h ? 1.25 : 1), cy + Math.sin(t) * r]); }
  const fa = fr(S, 'jagged', 0.3, 0.44);
  d.withAlpha(fa, () => {
    d.polygon(pts, { fill: alpha(tone(S, 'dat').c, 0.14), stroke: tone(S, 'dat').c, lw: 1.8 });
    // el nombre de la zona: dentro si cabe; si no, debajo de la figura
    const lab = S.l('al alcance de la IA', 'within AI’s reach'), lw = S.d.measure(lab, { size: FS(S, 13), weight: 800 });
    if (lw <= rad * 1.3) fitText(S, lab, cx, cy - rad * 0.12, rad * 1.4, 13, { weight: 800, color: tone(S, 'dat').ink, base: 'middle', align: 'center' });
    else fitText(S, lab, cx, cy + rad + 6 * u, R.w, 13, { weight: 800, color: tone(S, 'dat').ink, base: 'top', align: 'center' });
  });
  // 18 tareas dentro
  const ia = fr(S, 'jagged', 0.42, 0.56);
  for (let k = 0; k < 18; k++) {
    const t = hash(k, 7) * Math.PI * 2, r = rad * (0.2 + 0.45 * Math.sqrt(hash(k, 8)));
    if (Math.abs(((t + Math.PI / 2) / (Math.PI * 2)) * N - NOTCH) < 1.6) continue;
    const x = cx + Math.cos(t) * r * (R.w > R.h ? 1.25 : 1), y = cy + rad * 0.1 + Math.sin(t) * r * 0.75;
    d.circle(x, y, 4.5 * u, { fill: tone(S, 'dat').c, a: ia });
  }
  // una tarea en la muesca: parece igual de difícil, pero queda fuera
  const tn = (NOTCH / N) * Math.PI * 2 - Math.PI / 2, ox = cx + Math.cos(tn) * rad * 0.7 * (R.w > R.h ? 1.25 : 1), oy = cy + Math.sin(tn) * rad * 0.7;
  const oa = fr(S, 'jagged', 0.74, 0.86);
  d.withAlpha(oa, () => { d.circle(ox, oy, 6 * u, { fill: p.surface, stroke: tone(S, 'err').c, lw: 2.2 }); });
  // rótulos
  const P: Rect = port ? { x: A.x, y: R.y + R.h + gap * 0.5, w: A.w, h: A.y + A.h - (R.y + R.h + gap * 0.5) } : { x: R.x + R.w + gap * 1.5, y: R.y + R.h * 0.15, w: A.x + A.w - (R.x + R.w + gap * 1.5), h: R.h * 0.85 };
  let y = P.y;
  const sz = FS(S, tight(S) ? 13 : 14.5);
  const t1 = S.l('Tareas a su alcance: 25 % más rápido.', 'Tasks within its reach: 25% faster.');
  const t2 = S.l('Una tarea fuera de su alcance: acertaron menos que sin IA.', 'One task beyond it: they got it right less often than without AI.');
  glyph(S, 'check', P.x + 8 * u, y + sz * u * 0.62, 14 * u, tone(S, 'dat').ink, ia);
  y += para(S, t1, P.x + 22 * u, y, P.w - 22 * u, sz, { weight: 750, color: p.ink, a: ia, maxLines: 2 }) + gap * 0.6;
  glyph(S, 'cross', P.x + 8 * u, y + sz * u * 0.62, 13 * u, tone(S, 'err').ink, oa);
  para(S, t2, P.x + 22 * u, y, P.w - 22 * u, sz, { weight: 750, color: p.ink, a: oa, maxLines: 3 });
}

export const studiesSource = (S: Frame) => (S.on('pilots-fail') ? S.l('Gartner, comunicado del 29 de julio de 2024 (predicción)', 'Gartner press release, July 29, 2024 (a prediction)') : S.l('Brynjolfsson, Li y Raymond, Quarterly Journal of Economics (2025)', 'Brynjolfsson, Li, and Raymond, Quarterly Journal of Economics (2025)'));
export const peopleSource = (S: Frame) => (S.on('jagged') ? S.l('Dell’Acqua y colaboradores (Harvard y BCG, 2023); la forma del borde es un esquema', 'Dell’Acqua and colleagues (Harvard and BCG, 2023); the border’s shape is a sketch') : '');
