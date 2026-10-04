// Actos 18–22: deriva y regresión, red teaming, métricas de negocio, resumen y puente.
import { alpha, badge, box, clamp, gauss, hash, link, neu, regions, rng, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DRIFT, REDTEAM_ATTACKS } from './data';
import { wilson } from './stats';
import { stag } from './act-bench';
import { fs, source, stamp, tick, nf } from './ui';

// ═════════ los modelos cambian ═════════
export function drawDrift(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all, dat = tone(S, 'dat'), err = tone(S, 'err');
  const base = R.y + R.h - 64 * u, top = R.y + 56 * u, H = base - top, cw = Math.min(110 * u, R.w * 0.26), gap = Math.min(110 * u, R.w * 0.2);
  const x1 = R.x + (R.w - 2 * cw - gap) / 2, x2 = x1 + cw + gap;
  d.text(S.l('GPT-4: distinguir números primos de compuestos', 'GPT-4: telling prime numbers from composites'), R.x + R.w / 2, R.y + 6 * u, { size: fs(S, 14), weight: 800, color: p.ink, align: 'center', base: 'top', w: R.w });
  const col = (x: number, v: number, a: number, label: string, tn: typeof dat) => {
    d.withAlpha(a, () => {
      const h = (H * v) / 100 * a;
      d.rect(x, base - h, cw, h, { fill: alpha(tn.c, 0.8), stroke: tn.c, lw: 1.5 });
      d.text(`${Math.round(v * a)} %`, x + cw / 2, base - h - 6 * u, { size: fs(S, 24), weight: 800, font: 'mono', color: tn.ink, align: 'center', base: 'bottom' });
      d.text(label, x + cw / 2, base + 8 * u, { size: fs(S, 13), weight: 700, color: p.ink, align: 'center', base: 'top', w: cw + gap * 0.6 });
    });
  };
  d.line(R.x + 10 * u, base, R.x + R.w - 10 * u, base, p.lineStrong, 1.5);
  col(x1, DRIFT.march, S.reveal('drift', 0.2, 1.0), S.l('marzo de 2023', 'March 2023'), dat);
  col(x2, DRIFT.june, stag(S, 'drift', 0.45, 0.2), S.l('junio de 2023', 'June 2023'), err);
  const a = stag(S, 'drift', 0.7, 0.1);
  d.withAlpha(a, () => {
    const ya = base - (H * DRIFT.march) / 100 + 20 * u, yb = base - (H * DRIFT.june) / 100 - 30 * u;
    d.arrow(x1 + cw + 8 * u, ya, x2 - 8 * u, yb, err.c, 2.4, 9);
    d.text(`−${DRIFT.march - DRIFT.june}`, (x1 + cw + x2) / 2, (ya + yb) / 2 - 12 * u, { size: fs(S, 20), weight: 800, font: 'mono', color: err.ink, align: 'center', base: 'bottom', halo: p.stage, haloW: 4 });
    d.text(S.l('puntos', 'points'), (x1 + cw + x2) / 2, (ya + yb) / 2 - 12 * u, { size: fs(S, 12), weight: 700, color: err.ink, align: 'center', base: 'top' });
  });
  source(S, S.l('Chen, Zaharia y Zou, 2023 · mismas preguntas, otra versión del modelo', 'Chen, Zaharia & Zou, 2023 · same questions, a different model version'), R.x, R.y + R.h + 4 * u, R.w, stag(S, 'drift', 0.6, 0.1));
}

// ═════════ prueba de regresión ═════════
export function drawRegress(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const steps = [
    { l: S.l('Cambio', 'Change'), s: S.l('modelo · instrucciones · datos', 'model · instructions · data'), t: 'w' as const },
    { l: S.l('Correr casos de oro', 'Run gold cases'), s: S.l('siempre los mismos', 'always the same ones'), t: 'dat' as const },
    { l: S.l('Comparar', 'Compare'), s: S.l('con la corrida anterior', 'with the previous run'), t: 'ink' as const },
    { l: S.l('¿Cae más que el margen?', 'Drops more than the margin?'), s: S.l('alerta y se detiene', 'alert and stop'), t: 'err' as const },
  ];
  const pipeH = S.portrait ? R.h * 0.5 : R.h * 0.36, gap = (S.portrait ? 16 : 22) * u;
  const bh = S.portrait ? (pipeH - 3 * gap) / 4 : pipeH * 0.7, bw = S.portrait ? R.w * 0.72 : (R.w - 3 * gap) / 4;
  const rects: Rect[] = steps.map((_, i) => S.portrait ? { x: R.x + (R.w - bw) / 2, y: R.y + i * (bh + gap), w: bw, h: bh } : { x: R.x + i * (bw + gap), y: R.y + 4 * u, w: bw, h: bh });
  steps.forEach((s, i) => {
    const a = stag(S, 'regress', 0.06 + i * 0.14, 0.1);
    d.withAlpha(a, () => box(S, rects[i], s.l, { sub: s.s, tone: s.t, size: fs(S, 12.5), active: i === 3 ? 0.4 : 0 }));
    if (i > 0) { const k = stag(S, 'regress', 0.1 + i * 0.14, 0.08); if (k > 0) link(S, rects[i - 1], rects[i], { tone: 'ink', progress: k }); }
  });
  // mini gráfico: versiones y su nota con intervalo
  const cy = (S.portrait ? R.y + pipeH + 30 * u : R.y + pipeH + 28 * u), ch = R.y + R.h - cy - 38 * u, cx0 = R.x + 44 * u, cw = R.w - 56 * u, n = 300;
  const vers = [{ v: 'v1', k: 261 }, { v: 'v2', k: 264 }, { v: 'v3', k: 261 }, { v: 'v4', k: 237 }];
  const Y = (v: number) => cy + ch - ((v - 60) / 40) * ch;
  const a = stag(S, 'regress', 0.66, 0.12);
  d.withAlpha(a, () => {
    d.text(S.l('nota en tus casos de oro (con intervalo)', 'score on your gold cases (with interval)'), R.x, cy - 8 * u, { size: fs(S, 12), weight: 800, color: p.ink2, base: 'bottom' });
    [60, 80, 100].forEach((v) => { d.line(cx0 - 6 * u, Y(v), cx0 + cw, Y(v), p.line, 1); d.text(String(v), cx0 - 10 * u, Y(v), { size: fs(S, 11.5), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    vers.forEach((vv, i) => {
      const x = cx0 + ((i + 0.5) / vers.length) * cw, [lo, hi] = wilson(vv.k, n), bad = i === 3, t = tone(S, bad ? 'err' : 'dat');
      d.line(x, Y(hi * 100), x, Y(lo * 100), t.c, 3);
      d.line(x - 6 * u, Y(hi * 100), x + 6 * u, Y(hi * 100), t.c, 3); d.line(x - 6 * u, Y(lo * 100), x + 6 * u, Y(lo * 100), t.c, 3);
      d.circle(x, Y((vv.k / n) * 100), 5 * u, { fill: t.c, stroke: p.stage, lw: 1.5 });
      d.text(vv.v, x, cy + ch + 8 * u, { size: fs(S, 12.5), weight: 700, color: p.ink, align: 'center', base: 'top' });
      if (bad) d.tag(S.l('alerta', 'alert'), x, Y(hi * 100) - 16 * u, { size: fs(S, 12), color: t.ink, fill: t.soft, stroke: t.c });
    });
  });
  stamp(S, S.l('ilustrativo · 300 casos por versión', 'illustrative · 300 cases per version'), R.x + R.w, R.y + R.h + 4 * u, a);
}

// ═════════ red teaming ═════════
export function drawRedTeam(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, S.portrait ? 0.76 : 0.7), m = R.main, dat = tone(S, 'dat'), err = tone(S, 'err');
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2, rx = m.w * 0.3, ry = m.h * 0.3;
  const aBase = S.reveal('redteam', 0.1, 0.6);
  d.withAlpha(aBase, () => {
    d.rect(m.x, m.y, m.w, m.h, { stroke: p.line, lw: 1.2, r: 4 });
    const g = rng(77), N = 70;
    for (let i = 0; i < N; i++) {
      let x = 0, y = 0;
      do { x = gauss(g) * 0.5; y = gauss(g) * 0.5; } while (x * x + y * y > 1);
      d.circle(cx + x * rx, cy + y * ry, 3 * u, { fill: alpha(dat.c, 0.65) });
    }
    // casos de oro (anillos)
    [[0.1, -0.2], [-0.35, 0.15], [0.3, 0.3], [-0.1, 0.4], [0.45, -0.1]].forEach(([x, y]) => d.circle(cx + x * rx, cy + y * ry, 6.5 * u, { stroke: tone(S, 'sig').c, lw: 2 }));
    // frontera del comportamiento seguro
    d.ctx.save(); d.ctx.setLineDash([6, 5]); d.ctx.strokeStyle = p.ink2; d.ctx.lineWidth = 1.8; d.ctx.beginPath(); d.ctx.ellipse(cx, cy, rx * 1.12, ry * 1.12, 0, 0, Math.PI * 2); d.ctx.stroke(); d.ctx.restore();
    d.text(S.l('uso típico', 'typical use'), cx, cy - ry * 1.12 - 6 * u, { size: fs(S, 12.5), weight: 700, color: dat.ink, align: 'center', base: 'bottom' });
  });
  // ataques
  const NA = 14, fracs = (i: number) => 0.7 + 0.85 * hash(i, 17), ang = (i: number) => (i / NA) * Math.PI * 2 + hash(i, 4) * 0.4;
  const k = Math.floor(clamp((S.on('redteam') ? (S.t - S.start('redteam')) / Math.max(0.5, S.end('redteam') - S.start('redteam')) : 0) - 0.25) / 0.45 * NA);
  let fails = 0;
  for (let i = 0; i < Math.min(k, NA); i++) {
    const f = fracs(i), x = cx + Math.cos(ang(i)) * rx * 1.12 * f * 1.35, y = cy + Math.sin(ang(i)) * ry * 1.12 * f * 1.35, fail = f > 0.95, s = 6 * u;
    if (fail) fails++;
    d.line(cx, cy, x, y, alpha(err.c, 0.3), 1);
    d.line(x - s, y - s, x + s, y + s, err.c, 2.4); d.line(x - s, y + s, x + s, y - s, err.c, 2.4);
    if (fail) d.circle(x, y, 11 * u, { stroke: err.c, lw: 2 });
  }
  const a = R.aside, ka = stag(S, 'redteam', 0.3, 0.1);
  d.withAlpha(ka, () => {
    const col = S.portrait ? 3 : 1, cw = a.w / col;
    const rd = (x: number, y: number, v: string, lab: string, t: typeof err) => { d.text(v, x, y, { size: fs(S, 24), weight: 800, font: 'mono', color: t.ink, base: 'top' }); d.text(lab, x, y + 28 * u, { size: fs(S, 12), weight: 700, color: p.mute, base: 'top', w: cw - 6 * u }); };
    rd(a.x, a.y, String(Math.min(k, NA)), S.l('ataques', 'attacks'), err);
    rd(a.x + (S.portrait ? cw : 0), a.y + (S.portrait ? 0 : 64 * u), String(fails), S.l('fallas halladas', 'failures found'), err);
    rd(a.x + (S.portrait ? 2 * cw : 0), a.y + (S.portrait ? 0 : 128 * u), '+' + String(fails), S.l('casos nuevos de oro', 'new gold cases'), tone(S, 'sig'));
  });
  stamp(S, S.l('ilustrativo', 'illustrative'), m.x + m.w, m.y + m.h + 14 * u, aBase);
  d.withAlpha(stag(S, 'redteam', 0.7, 0.1), () => d.text(S.l(`Un estudio de Anthropic publicó ${nf(S, REDTEAM_ATTACKS, 0)} ataques`, `An Anthropic study released ${nf(S, REDTEAM_ATTACKS, 0)} attacks`), R.all.x, R.all.y + R.all.h, { size: fs(S, 12.5), weight: 700, color: p.ink2, base: 'bottom', w: R.all.w }));
}

// ═════════ de la nota al resultado de negocio ═════════
export function drawBusiness(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const cols = S.portrait ? 1 : 3, rows = S.portrait ? 3 : 1, gap = (S.portrait ? 16 : 30) * u;
  const cw = (R.w - gap * (cols - 1)) / cols, ch = (R.h - gap * (rows - 1)) / rows;
  const steps = [
    { n: '1', l: S.l('Casos de oro', 'Gold cases'), s: S.l('fuera de línea', 'offline'), t: 'dat' as const, chips: [S.l('exactitud con intervalo', 'accuracy with interval'), S.l('por segmento', 'by segment')] },
    { n: '2', l: S.l('Piloto', 'Pilot'), s: S.l('usuarios reales', 'real users'), t: 'lat' as const, chips: [S.l('tasa de resolución', 'resolution rate'), S.l('escalamientos', 'escalations')] },
    { n: '3', l: S.l('Negocio', 'Business'), s: S.l('el resultado que pagas', 'the result you pay for'), t: 'sig' as const, chips: [S.l('costo por caso resuelto', 'cost per resolved case'), S.l('tiempo ahorrado', 'time saved'), S.l('quejas', 'complaints')] },
  ];
  const rects: Rect[] = steps.map((_, i) => ({ x: R.x + (i % cols) * (cw + gap), y: R.y + Math.floor(i / cols) * (ch + gap), w: cw, h: ch }));
  steps.forEach((s, i) => {
    const a = stag(S, 'business', 0.08 + i * 0.22, 0.14), r = rects[i], t = tone(S, s.t);
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.07), stroke: t.c, lw: 1.8, r: 4 });
      d.circle(r.x + 22 * u, r.y + 24 * u, 13 * u, { fill: t.c });
      d.text(s.n, r.x + 22 * u, r.y + 24 * u, { size: fs(S, 14), weight: 800, color: p.stage, align: 'center', base: 'middle' });
      d.text(s.l, r.x + 44 * u, r.y + 17 * u, { size: fs(S, 15), weight: 800, color: t.ink, base: 'top', w: r.w - 52 * u });
      d.text(s.s, r.x + 44 * u, r.y + 38 * u, { size: fs(S, 12.5), weight: 600, color: p.ink2, base: 'top', w: r.w - 52 * u });
      let y = r.y + (S.portrait ? 62 : 70) * u, x = r.x + 12 * u;
      s.chips.forEach((c) => {
        const w = d.measure(c, { size: fs(S, 12), weight: 600 }) + 20 * u;
        if (x + w > r.x + r.w - 6 * u && x > r.x + 12 * u) { x = r.x + 12 * u; y += 26 * u; }
        d.tag(c, x, y, { size: fs(S, 12), color: t.ink, fill: t.soft, stroke: t.c, align: 'left' });
        x += w + 6 * u;
      });
    });
    if (i > 0) { const k = stag(S, 'business', 0.16 + i * 0.22, 0.1); if (k > 0) link(S, rects[i - 1], r, { tone: 'ink', progress: k }); }
  });
  d.withAlpha(stag(S, 'business', 0.82, 0.1), () => d.text(S.l('ejemplos de métricas', 'example metrics'), R.x + R.w, R.y + R.h + 8 * u, { size: fs(S, 11.5), weight: 600, color: p.mute, align: 'right', base: 'top' }));
}

// ═════════ resumen: la tarjeta de evaluación ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = regions(S, 1).all;
  const items: { t: string; tn: 'dat' | 'lat' | 'sig' | 'w' | 'err' | 'ink' }[] = [
    { t: S.l('Casos reales, por segmento', 'Real cases, by segment'), tn: 'dat' },
    { t: S.l('Criterios claros; juez contrastado con personas', 'Clear criteria; judge checked against people'), tn: 'lat' },
    { t: S.l('Un intervalo en cada nota', 'An interval on every score'), tn: 'sig' },
    { t: S.l('Repetir en cada cambio', 'Repeat on every change'), tn: 'w' },
    { t: S.l('Atacar el sistema', 'Attack the system'), tn: 'err' },
    { t: S.l('Resultado de negocio, en un piloto', 'Business result, in a pilot'), tn: 'ink' },
  ];
  const rh = Math.min(56 * u, (R.h - 8 * u) / items.length);
  items.forEach((it, i) => {
    const a = stag(S, 'recap', 0.06 + i * 0.12, 0.1), y = R.y + 4 * u + i * rh, t = tone(S, it.tn);
    d.withAlpha(a, () => {
      d.rect(R.x, y, R.w, rh - 6 * u, { fill: alpha(t.c, 0.08), stroke: t.c, lw: 1.5, r: 3 });
      d.rect(R.x + 12 * u, y + (rh - 6 * u) / 2 - 10 * u, 20 * u, 20 * u, { stroke: t.c, lw: 2, fill: p.surface });
      tick(S, R.x + 22 * u, y + (rh - 6 * u) / 2, 14 * u, true);
      d.text(it.t, R.x + 44 * u, y + (rh - 6 * u) / 2, { size: fs(S, 14), weight: 700, color: p.ink, base: 'middle', w: R.w - 56 * u });
    });
  });
  if (!S.portrait) neu(S, R.x + R.w - 70 * u, R.y + R.h - 60 * u, { scale: Math.max(3, Math.round(3 * u)), mood: 'happy', a: stag(S, 'recap', 0.8, 0.1) });
  void badge;
}

// ═════════ puente ═════════
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(5, Math.round(6 * u));
  neu(S, cx - 12 * sc, cy - 80 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
  d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 56 * u, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Riesgos y gobernanza', 'Risks and governance'), cx, cy + 90 * u, { size: fs(S, 24), weight: 800, align: 'center', w: S.W - 40 * u });
  });
}
