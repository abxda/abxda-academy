// Actos 1–3: el gancho, el caso de las herramientas jurídicas, el benchmark (MMLU), la escala y su techo, el protocolo.
import { alpha, bars, clamp, ease, lerp, neu, split, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { GEMINI, GPT4_MMLU, LEGAL, MMLU, MMLU_ERRORS } from './data';
import { cells, foot, fs, hAxis, layout, nf, panel, pc } from './ui';

/** Progreso 0..1 a lo largo del segmento k (según su duración real); sirve para escalonar hechos que la voz va diciendo en orden. */
export const fr = (S: Frame, k: string) => (S.on(k) ? clamp((S.t - S.start(k)) / Math.max(0.5, S.end(k) - S.start(k))) : 0);
/** Aparición escalonada: 0 hasta f0, 1 desde f0 + dur (en fracciones del segmento). */
export const stag = (S: Frame, k: string, f0: number, dur = 0.08) => ease.out(clamp((fr(S, k) - f0) / dur));

// ═════════ gancho: tabla pública frente a «tu caso» ═════════
export function drawHook(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = layout(S, 1, { foot: false }).all;
  const [L, Rr] = S.portrait ? split(R, 'v', 0.5, 14 * u) : split(R, 'h', 0.5, 22 * u);
  const aL = S.reveal('hook', 0.2, 0.7), aR = S.reveal('hook', 2.2, 0.7);
  const names = [S.l('Modelo A', 'Model A'), S.l('Modelo B', 'Model B'), S.l('Modelo C', 'Model C')], vals = [0.93, 0.91, 0.9];
  const lat = tone(S, 'lat'), sig = tone(S, 'sig');
  const inL = panel(S, L, S.l('Examen público', 'Public exam'), { a: aL, tone: 'lat', sub: S.l('tabla de posiciones', 'leaderboard') });
  const rowH = Math.min(74 * u, inL.h / 3.3), y0 = inL.y + (inL.h - 3 * rowH) / 2 - 8 * u;
  d.withAlpha(aL, () => names.forEach((nm, i) => {
    const y = y0 + i * rowH + rowH / 2, lw = 86 * u, bx = inL.x + lw + 26 * u, bw = inL.w - lw - 28 * u;
    d.circle(inL.x + 11 * u, y, 11 * u, { fill: i === 0 ? lat.c : p.surface2, stroke: lat.c, lw: 1.5 });
    d.text(String(i + 1), inL.x + 11 * u, y, { size: fs(S, 13), weight: 800, color: i === 0 ? p.stage : p.ink2, align: 'center', base: 'middle' });
    d.text(nm, inL.x + 30 * u, y, { size: fs(S, 14.5), weight: 700, color: p.ink, base: 'middle' });
    d.rect(bx, y - 11 * u, bw, 22 * u, { fill: p.surface2 });
    d.rect(bx, y - 11 * u, bw * vals[i], 22 * u, { fill: alpha(lat.c, i === 0 ? 0.95 : 0.55) });
  }));
  d.withAlpha(aL, () => d.tag(S.l('ilustrativo', 'illustrative'), L.x + L.w - 10 * u, L.y + L.h - 16 * u, { size: fs(S, 11.5), color: p.mute, fill: p.stage, stroke: p.line, align: 'right' }));
  const inR = panel(S, Rr, S.l('Tu caso', 'Your case'), { a: aR, tone: 'sig', sub: S.l('tus tareas reales', 'your real tasks') });
  const rowH2 = Math.min(74 * u, inR.h / 3.3), y0R = inR.y + (inR.h - 3 * rowH2) / 2 - 8 * u;
  d.withAlpha(aR, () => [0, 1, 2].forEach((i) => {
    const y = y0R + i * rowH2 + rowH2 / 2, bx = Rr.x + 22 * u, bw = Rr.w - 78 * u, pulse = 0.5 + 0.5 * Math.sin(S.clock * 2.4 - i * 0.7);
    d.rect(bx, y - 11 * u, bw, 22 * u, { stroke: sig.c, lw: 1.8, dash: [5, 4], a: 0.5 + 0.4 * pulse });
    d.text('?', bx + bw + 24 * u, y, { size: fs(S, 28), weight: 800, color: sig.ink, align: 'center', base: 'middle' });
  }));
  if (!S.portrait && Rr.h > 260 * u) neu(S, Rr.x + Rr.w - 88 * u, Rr.y + Rr.h - 76 * u, { scale: Math.max(3, Math.round(3.2 * u)), mood: 'think', a: S.reveal('hook', 3.2, 0.5) });
}

// ═════════ el caso de las herramientas jurídicas con IA ═════════
export function drawClaim(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, 0.36), sig = tone(S, 'sig');
  const aP = S.reveal('claim', 0.1, 0.6);
  const pr: Rect = S.portrait ? { x: L.all.x, y: L.all.y + 2 * u, w: L.all.w, h: 62 * u } : { x: L.main.x, y: L.main.y + 6 * u, w: L.main.w, h: Math.min(150 * u, L.main.h * 0.5) };
  d.withAlpha(aP, () => {
    d.rect(pr.x, pr.y, pr.w, pr.h, { fill: alpha(sig.c, 0.1), stroke: sig.c, lw: 1.6, r: 4 });
    d.text(S.l('Lo anunciado', 'What was promised'), pr.x + 14 * u, pr.y + 12 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top' });
    d.text(S.l('«evitar las alucinaciones»', '“avoid hallucinations”'), pr.x + 14 * u, pr.y + 32 * u, { size: fs(S, S.portrait ? 17 : 20), weight: 800, color: sig.ink, base: 'top', w: pr.w - 28 * u });
  });
  const mr: Rect = S.portrait ? { x: L.all.x, y: pr.y + pr.h + 18 * u, w: L.all.w, h: L.all.y + L.all.h - (pr.y + pr.h + 18 * u) } : L.aside;
  d.withAlpha(stag(S, 'claim', 0.3, 0.1), () => d.text(S.l('Lo medido: respuestas con alucinación', 'What was measured: answers with a hallucination'), mr.x, mr.y + 2 * u, { size: fs(S, 14.5), weight: 800, color: p.ink, base: 'top', w: mr.w }));
  const br: Rect = { x: mr.x, y: mr.y + 40 * u, w: mr.w, h: Math.min(mr.h - 76 * u, 4 * 62 * u) };
  const k = ease.out(clamp((fr(S, 'claim') - 0.35) / 0.4));
  bars(S, br, LEGAL.map((r) => ({ label: r.label, value: (r.v / 100) * k, tone: r.id === 'gpt4' ? 'mute' as const : 'err' as const, hot: r.id === 'wl' })), {
    max: 0.5, rowH: br.h / 4, labelW: Math.min(150 * u, mr.w * 0.42), fmt: (v) => `${Math.round(v * 100)} %`, show: 4 * clamp((fr(S, 'claim') - 0.3) / 0.45) + 0.0001, size: fs(S, 13),
  });
  d.withAlpha(stag(S, 'claim', 0.75, 0.1), () => d.tag(S.l('GPT-4: modelo general, de referencia', 'GPT-4: a general model, for reference'), mr.x + mr.w, br.y + br.h + 18 * u, { size: fs(S, 11.5), color: p.mute, fill: p.stage, stroke: p.line, align: 'right' }));
  foot(S, S.l('Magesh et al., 2025 · evaluación independiente, más de 200 consultas jurídicas', 'Magesh et al., 2025 · independent evaluation, over 200 legal queries'), { a: stag(S, 'claim', 0.8, 0.1) });
}

// ═════════ benchmark: 57 temas y una pregunta de ejemplo ═════════
export function drawBench(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, 0.6), lat = tone(S, 'lat');
  const cols = S.portrait ? 10 : 12, rows = S.portrait ? 6 : 5, n = MMLU.subjects;
  const m = L.main, rdH = 62 * u, capH = 40 * u;
  const tr: Rect = { x: m.x, y: m.y, w: m.w, h: m.h - rdH - capH };
  const prog = clamp((S.t - S.start('bench') - 0.3) / 3.2) * n;
  const geo = cells(S, tr, cols, rows, (i, x, y, cs) => {
    if (i >= n) return;
    const a = clamp(prog - i);
    if (a <= 0) return;
    d.withAlpha(a, () => d.rect(x + 1.5, y + 1.5, cs - 3, cs - 3, { fill: alpha(lat.c, 0.2 + 0.5 * ((i * 7) % 5) / 4), stroke: lat.c, lw: 1 }));
  }, 40);
  d.withAlpha(S.reveal('bench', 3.0, 0.5), () => d.text(S.l('matemáticas elementales · historia · informática · derecho · …', 'elementary math · history · computer science · law · …'), m.x, geo.y + geo.h + 8 * u, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: m.w }));
  const yb = m.y + m.h - rdH + 4 * u;
  const rd = (x: number, v: string, lab: string) => { d.text(v, x, yb, { size: fs(S, 28), weight: 800, font: 'mono', color: lat.ink, base: 'top' }); d.text(lab, x, yb + 32 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top' }); };
  d.withAlpha(S.reveal('bench', 0.4, 0.6), () => { rd(m.x + 2 * u, String(MMLU.subjects), S.l('temas', 'subjects')); rd(m.x + Math.min(m.w * 0.3, 130 * u), nf(S, MMLU.questions, 0), S.l('preguntas', 'questions')); });
  // pregunta de ejemplo (ilustrativa)
  const a = S.reveal('bench', 2.2, 0.7), q: Rect = { ...L.aside, h: Math.min(L.aside.h, 220 * u) };
  d.withAlpha(a, () => {
    d.rect(q.x, q.y, q.w, q.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 4 });
    const h0 = d.text(S.l('Opción múltiple (ejemplo ilustrativo)', 'Multiple choice (illustrative example)'), q.x + 12 * u, q.y + 10 * u, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: q.w - 24 * u }).h;
    const h1 = d.text(S.l('¿Cuál es la capital de Perú?', 'What is the capital of Peru?'), q.x + 12 * u, q.y + 14 * u + h0, { size: fs(S, 14.5), weight: 800, color: p.ink, base: 'top', w: q.w - 24 * u }).h;
    const opts = ['Quito', 'Lima', 'Bogotá', 'Santiago'], right = 1, hit = S.at('bench', 4.2, 4.9);
    const top = q.y + 22 * u + h0 + h1, lh = Math.min(34 * u, (q.y + q.h - top - 8 * u) / 4);
    opts.forEach((o, i) => {
      const yy = top + i * lh, on = i === right && hit > 0;
      d.rect(q.x + 10 * u, yy, q.w - 20 * u, lh - 5 * u, { fill: on ? alpha(tone(S, 'dat').c, 0.18 * hit) : undefined, stroke: on ? tone(S, 'dat').c : p.line, lw: on ? 2 : 1, r: 2 });
      d.text(`${'ABCD'[i]}   ${o}`, q.x + 20 * u, yy + (lh - 5 * u) / 2, { size: fs(S, 13.5), weight: on ? 800 : 600, color: p.ink, base: 'middle' });
    });
  });
  foot(S, 'Hendrycks et al., 2020 (MMLU)', { a });
}

// ═════════ la escala: azar, GPT-3, GPT-4, expertos… y su techo ═════════
interface Pin { id: string; v: number; shape: 'circle' | 'square' | 'diamond' | 'band' | 'dash'; t: 'w' | 'dat' | 'lat' | 'sig' | 'mute'; row: 1 | 2; legend: string; label: string; a: number; la?: 'left' | 'right' }

export function drawScale(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, 1), R = L.all;
  const zoom = S.at('ceiling', 0.2, 1.5, 'io'), lo = lerp(0, 80, zoom), hi = 100, prot = S.on('protocol');
  const x0 = R.x + 12 * u, x1 = R.x + R.w - 12 * u, axisY = R.y + Math.max(120 * u, R.h * 0.3);
  const a0 = clamp(1 - zoom * 2), a1 = clamp(zoom * 2 - 1), fmt = (v: number) => nf(S, v, 0);
  hAxis(S, x0, x1, axisY, lo, hi, [0, 25, 50, 75, 100], fmt, a0, 22);
  const X = hAxis(S, x0, x1, axisY, lo, hi, [80, 85, 90, 95, 100], fmt, a1, 22);
  d.text(S.l('% de aciertos en MMLU', '% correct on MMLU'), x0, R.y, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
  d.withAlpha(clamp(zoom * 2), () => { d.line(X(100), axisY - 36 * u, X(100), axisY, p.lineStrong, 2, [3, 3]); d.text(S.l('techo', 'ceiling'), X(100) - 4 * u, axisY - 38 * u, { size: fs(S, 12.5), weight: 700, color: p.mute, align: 'right', base: 'bottom' }); });
  const f1 = (k: number) => stag(S, 'saturation', k);
  const pins: Pin[] = [
    { id: 'chance', v: MMLU.chance, shape: 'dash', t: 'mute', row: 1, label: nf(S, MMLU.chance, 0), legend: S.l('azar (4 opciones)', 'chance (4 options)'), a: f1(0.5) },
    { id: 'gpt3', v: MMLU.gpt3, shape: 'circle', t: 'w', row: 1, label: nf(S, MMLU.gpt3, 1), legend: 'GPT-3 · 2020', a: f1(0.18) },
    { id: 'gpt4', v: GPT4_MMLU, shape: 'circle', t: 'dat', row: 1, la: prot || S.on('ceiling') ? undefined : 'right', label: nf(S, GPT4_MMLU, 1), legend: 'GPT-4 · 2023', a: f1(0.68) * (prot ? 0.3 : 1) },
    { id: 'expert', v: MMLU.expert, shape: 'band', t: 'sig', row: 2, la: prot ? 'left' : undefined, label: nf(S, MMLU.expert, 1), legend: S.l('experto humano (estimado)', 'human expert (estimated)'), a: f1(0.88) },
    { id: 'g5', v: GEMINI.fiveShot, shape: 'square', t: 'lat', row: 1, label: nf(S, GEMINI.fiveShot, 1), legend: S.l('Gemini Ultra · 5 ejemplos', 'Gemini Ultra · 5 examples'), a: stag(S, 'protocol', 0.3) },
    { id: 'g32', v: GEMINI.cot32, shape: 'diamond', t: 'lat', row: 1, label: nf(S, GEMINI.cot32, 2), legend: S.l('Gemini Ultra · voto entre 32 razonamientos', 'Gemini Ultra · vote among 32 reasoning attempts'), a: stag(S, 'protocol', 0.6) },
  ];
  const vis = (pn: Pin) => S.on('saturation') && pn.a > 0 && pn.v >= lo - 0.2 && pn.v <= hi + 0.2;
  const inLegend = (pn: Pin) => vis(pn) && (pn.id === 'g5' || pn.id === 'g32' ? prot : pn.id === 'expert' ? true : !prot);
  const r = 9 * u;
  for (const pn of pins) {
    if (!vis(pn)) continue;
    const x = X(pn.v), tc = tone(S, pn.t), ly = axisY - (pn.row === 1 ? 28 : 52) * u;
    d.withAlpha(pn.a, () => {
      if (pn.shape === 'dash') d.line(x, axisY - 20 * u, x, axisY + 2, tc.c, 2.4, [4, 3]);
      else if (pn.shape === 'band') d.rect(x - 2.5 * u, axisY - 18 * u, 5 * u, 36 * u, { fill: tc.c });
      else if (pn.shape === 'circle') d.circle(x, axisY, r, { fill: tc.c, stroke: p.stage, lw: 2 });
      else if (pn.shape === 'square') d.rect(x - r, axisY - r, 2 * r, 2 * r, { fill: tc.c, stroke: p.stage, lw: 2 });
      else d.polygon([[x, axisY - r * 1.3], [x + r * 1.3, axisY], [x, axisY + r * 1.3], [x - r * 1.3, axisY]], { fill: tc.c, stroke: p.stage, lw: 2 });
      if (pn.row === 2) d.line(x, axisY - 18 * u, x, ly + 8 * u, tc.c, 1.5);
      d.text(pn.label, pn.la === 'left' ? x + 9 * u : pn.la === 'right' ? x + 3 * u : x, ly, { size: fs(S, 13.5), weight: 800, font: 'mono', color: tc.ink, align: pn.la ?? 'center', base: 'middle', halo: p.stage, haloW: 4 });
    });
  }
  // «mismo modelo, otro protocolo»
  const gb = stag(S, 'protocol', 0.62);
  if (prot && gb > 0) d.withAlpha(gb, () => {
    const xa = X(GEMINI.fiveShot), xb = X(GEMINI.cot32), yb = axisY - 84 * u, c = tone(S, 'lat');
    d.polyline([[xa, axisY - 40 * u], [xa, yb], [xb, yb], [xb, axisY - 40 * u]], c.c, 1.8);
    d.text(S.l('mismo modelo, otro protocolo', 'same model, different protocol'), (xa + xb) / 2, yb - 5 * u, { size: fs(S, 13), weight: 800, color: c.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
  });
  // leyenda y, en el techo, errores del examen
  const items = pins.filter(inLegend), lh = 23 * u, top = axisY + 52 * u;
  const legendW = S.portrait ? R.w : R.w * (S.on('ceiling') && !prot ? 0.46 : 1);
  items.forEach((pn, i) => {
    const y = top + i * lh, tc = tone(S, pn.t), x = R.x + 12 * u, rr = 6 * u;
    d.withAlpha(pn.a, () => {
      if (pn.shape === 'dash') d.line(x, y - 8 * u, x, y + 8 * u, tc.c, 2.4, [3, 2]);
      else if (pn.shape === 'band') d.rect(x - 2.5 * u, y - 8 * u, 5 * u, 16 * u, { fill: tc.c });
      else if (pn.shape === 'circle') d.circle(x, y, rr, { fill: tc.c });
      else if (pn.shape === 'square') d.rect(x - rr, y - rr, 2 * rr, 2 * rr, { fill: tc.c });
      else d.polygon([[x, y - rr * 1.3], [x + rr * 1.3, y], [x, y + rr * 1.3], [x - rr * 1.3, y]], { fill: tc.c });
      d.text(`${pn.legend} — ${pn.label} %`, x + 16 * u, y, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'middle', w: legendW - 30 * u });
    });
  });
  if (S.on('ceiling') && !prot) {
    const a = S.at('ceiling', 1.8, 2.6);
    const area: Rect = S.portrait ? { x: R.x, y: top + 2 * lh + 10 * u, w: R.w, h: R.y + R.h - (top + 2 * lh + 10 * u) } : { x: R.x + R.w * 0.46, y: top - 14 * u, w: R.w * 0.54, h: R.y + R.h - (top - 14 * u) };
    if (area.h > 70 * u) d.withAlpha(a, () => {
      const half = area.w / 2, err = tone(S, 'err'), prog = clamp((fr(S, 'ceiling') - 0.5) / 0.3), lblH = 44 * u;
      const draw = (gx: number, nErr: number, big: string, small: string) => {
        const g: Rect = { x: gx, y: area.y, w: half - 10 * u, h: area.h - lblH };
        const geo = cells(S, g, 10, 10, (i, x, y, cs) => {
          const k = clamp(nErr * prog - i);
          d.rect(x + 0.5, y + 0.5, cs - 1.5, cs - 1.5, { fill: k > 0 ? alpha(err.c, 0.25 + 0.65 * k) : undefined, stroke: k > 0 ? err.c : p.line, lw: 1 });
          if (k > 0.5) { d.line(x + 2, y + 2, x + cs - 3, y + cs - 3, err.c, 1.4); d.line(x + cs - 3, y + 2, x + 2, y + cs - 3, err.c, 1.4); }
        }, 22);
        d.text(big, gx + g.w / 2, geo.y + geo.h + 6 * u, { size: fs(S, 15.5), weight: 800, font: 'mono', color: err.ink, align: 'center', base: 'top' });
        d.text(small, gx + g.w / 2, geo.y + geo.h + 26 * u, { size: fs(S, 12), weight: 600, color: p.ink2, align: 'center', base: 'top', w: g.w + 8 * u });
      };
      draw(area.x + 4 * u, MMLU_ERRORS.all, pc(S, MMLU_ERRORS.all, 2), S.l('de todas las preguntas', 'of all questions'));
      draw(area.x + half + 6 * u, MMLU_ERRORS.virology, pc(S, MMLU_ERRORS.virology, 0), S.l('en virología (analizadas)', 'in virology (analyzed)'));
    });
  }
  const src = S.on('ceiling') ? 'Hendrycks et al., 2020 · OpenAI, 2023 · Gema et al., 2024 · Gemini Team, 2023' : 'Hendrycks et al., 2020 · OpenAI, 2023';
  foot(S, src, { a: S.reveal('saturation', 0.5, 0.5) });
}
