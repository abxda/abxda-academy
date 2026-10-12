// Vistas 18–23: evaluar siempre.
//  · drawDrift    (drift): GPT-4, ¿es primo?: 84 % en marzo y 51 % en junio de 2023 (Chen, Zaharia y Zou, 2023).
//  · drawRegress  (regress): la prueba de regresión, corrida tras corrida (ilustrativo).
//  · drawRedteam  (redteam, redteam-case): atacar el sistema a propósito; 38 961 ataques (Ganguli et al., 2022); falla → caso nuevo.
//  · drawBusiness (business): la nota no es el resultado de negocio; el piloto.
//  · drawRecap, drawBridge.
import { alpha, clamp, lerp, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { DRIFT, REDTEAM_ATTACKS } from './data';
import { FS, area, card, chip, chipH, fitText, fr, glyph, growArrow, para, pct, person, tight } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La nota caduca
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawDrift(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  fitText(S, S.l('GPT-4: ¿el número es primo? (mismas preguntas)', 'GPT-4: is the number prime? (same questions)'), A.x, A.y + 4 * u, A.w, 14, { weight: 800, base: 'top', color: p.ink2, a: fr(S, 'drift', 0.2, 0.32) });
  const bars = [{ lab: S.l('marzo de 2023', 'March 2023'), v: DRIFT.march, at: 0.55, t: 'dat' as const }, { lab: S.l('junio de 2023', 'June 2023'), v: DRIFT.june, at: 0.78, t: 'err' as const }];
  const top = A.y + FS(S, 14) * u + 46 * u, bot = A.y + A.h - FS(S, 13) * u - 18 * u, H = bot - top;
  const bw = Math.min(110 * u, A.w * 0.22), gap = Math.min(120 * u, A.w * 0.2), x0 = A.x + (A.w - 2 * bw - gap) / 2;
  d.withAlpha(fr(S, 'drift', 0.4, 0.5), () => d.line(A.x + A.w * 0.12, bot, A.x + A.w * 0.88, bot, p.lineStrong, 1.6));
  bars.forEach((b, i) => {
    const a = fr(S, 'drift', b.at - 0.1, b.at), x = x0 + i * (bw + gap), h = H * (b.v / 100) * a, c = tone(S, b.t);
    if (a <= 0.01) return;
    d.withAlpha(clamp(a * 2), () => {
      d.rect(x, bot - h, bw, h, { fill: alpha(c.c, 0.55), stroke: c.c, lw: 1.6, r: 2 });
      d.text(pct(S, Math.round(b.v)), x + bw / 2, bot - h - 8 * u, { size: FS(S, 22), weight: 800, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
      fitText(S, b.lab, x + bw / 2, bot + 8 * u, bw + gap * 0.9, 13, { weight: 700, align: 'center', base: 'top' });
    });
  });
  const k = fr(S, 'drift', 0.9, 0.98);
  if (k > 0.01) growArrow(S, x0 + bw + 8 * u, bot - H * 0.86, x0 + bw + gap - 8 * u, bot - H * 0.55, k, tone(S, 'err').c, 2.2);
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Prueba de regresión (ilustrativo)
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawRegress(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const runs = [
    { lab: S.l('versión actual', 'current version'), v: 87, at: 0.12 },
    { lab: S.l('cambio de modelo', 'model change'), v: 88, at: 0.3 },
    { lab: S.l('cambio de instrucciones', 'instructions change'), v: 79, at: 0.46 },
  ];
  const n = runs.length, gap = 14 * u;
  const bwid = port ? A.w : (A.w - (n - 1) * gap) / n, bh = port ? Math.min(92 * u, (A.h - 60 * u - (n - 1) * gap) / n) : Math.min(170 * u, A.h * 0.5);
  const y0 = port ? A.y + 30 * u : A.y + (A.h - bh) / 2;
  fitText(S, S.l('tu conjunto de oro, en cada cambio', 'your gold set, after every change'), A.x, A.y + 2 * u, A.w, 14, { weight: 800, base: 'top', color: p.ink2, a: fr(S, 'regress', 0.05, 0.16) });
  runs.forEach((r, i) => {
    const R: Rect = port ? { x: A.x, y: y0 + i * (bh + gap), w: bwid, h: bh } : { x: A.x + i * (bwid + gap), y: y0, w: bwid, h: bh };
    const a = fr(S, 'regress', r.at, r.at + 0.1), bad = i > 0 && r.v < runs[i - 1].v - 2;
    const cmp = i > 0 ? fr(S, 'regress', 0.6 + i * 0.08, 0.68 + i * 0.08) : 0;
    d.withAlpha(a, () => {
      card(S, R, { tone: bad && cmp > 0.5 ? 'err' : 'w', fill: p.surface, hot: bad ? cmp * 0.5 : 0 });
      const pad = 10 * u;
      fitText(S, `${i + 1} · ${r.lab}`, R.x + pad, R.y + pad, R.w - 2 * pad, 13, { weight: 800, base: 'top' });
      d.text(pct(S, r.v), R.x + pad, R.y + R.h - pad, { size: FS(S, tight(S) ? 20 : 24), weight: 800, font: 'mono', color: bad && cmp > 0.5 ? tone(S, 'err').ink : tone(S, 'dat').ink, base: 'bottom' });
      if (i > 0) d.withAlpha(cmp, () => {
        const dv = r.v - runs[i - 1].v, t = `${dv > 0 ? '+' : '−'}${Math.abs(dv)}`;
        const cx = R.x + R.w - pad, cy = R.y + R.h - pad - FS(S, 15) * u / 2;
        if (bad) { glyph(S, 'warn', cx - 12 * u, cy - 26 * u, 20 * u, tone(S, 'err').c); }
        d.text(S.l(`${t} contra la anterior`, `${t} vs. previous`), cx, cy, { size: FS(S, 13), weight: 800, color: bad ? tone(S, 'err').ink : tone(S, 'dat').ink, align: 'right', base: 'middle' });
      });
    });
  });
  const kk = fr(S, 'regress', 0.86, 0.96);
  chip(S, S.l('prueba de regresión', 'regression test'), A.x + A.w / 2, A.y + A.h - chipH(S, 14) / 2, 'w', { a: kk, size: 14, weight: 800 });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Red teaming
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawRedteam(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const sw = Math.min(160 * u, A.w * (port ? 0.46 : 0.24)), sh = Math.min(96 * u, A.h * 0.26);
  const caseShift = S.on('redteam-case') ? fr(S, 'redteam-case', 0.0, 0.2, 'io') : 0;
  const sysX = lerp(A.x + (A.w - sw) / 2, port ? A.x + (A.w - sw) / 2 : A.x + A.w * 0.3 - sw / 2, caseShift);
  const sys: Rect = { x: sysX, y: port ? A.y + A.h * 0.46 : A.y + (A.h - sh) / 2, w: sw, h: sh };
  const attacks = [S.l('pregunta con trampa', 'trick question'), S.l('instrucción escondida', 'hidden instruction'), S.l('petición prohibida', 'forbidden request')];
  const aAtk = S.on('redteam-case') ? 1 - fr(S, 'redteam-case', 0, 0.15) : 1;
  // atacantes: en columna a la izquierda (horizontal) o en filas arriba (vertical)
  const sc = Math.max(2, Math.round(2.6 * u)), rowH = Math.max(9 * sc, chipH(S, 12.5)) + 10 * u;
  d.withAlpha(aAtk, () => attacks.forEach((t, i) => {
    const a = fr(S, 'redteam', 0.5 + i * 0.08, 0.6 + i * 0.08);
    const px = A.x + (port ? 0 : 10 * u), py = port ? A.y + 4 * u + i * rowH : A.y + A.h * (0.12 + i * 0.3);
    person(S, px, py, sc, 'err', a);
    const cx = px + 6 * sc + 10 * u, cy = py + 4.5 * sc;
    const c = chip(S, t, cx, cy, 'err', { a, size: 12.5, align: 'left', maxW: port ? A.w - 6 * sc - 14 * u : A.w * 0.3 });
    const from: [number, number] = port ? [A.x + A.w * (0.3 + 0.2 * i), A.y + 4 * u + 3 * rowH] : [c.x + c.w + 6 * u, cy];
    const to: [number, number] = port ? [sys.x + sys.w / 2 + (i - 1) * 30 * u, sys.y - 6 * u] : [sys.x - 6 * u, sys.y + sys.h / 2 + (i - 1) * 18 * u];
    growArrow(S, from[0], from[1], to[0], to[1], fr(S, 'redteam', 0.6 + i * 0.08, 0.72 + i * 0.08), tone(S, 'err').c, 1.8);
  }));
  // el sistema
  const aSys = fr(S, 'redteam', 0.1, 0.22);
  const crack = fr(S, 'redteam', 0.86, 0.96);
  d.withAlpha(aSys, () => {
    card(S, sys, { tone: 'lat', fill: p.surface });
    fitText(S, S.l('tu sistema', 'your system'), sys.x + sys.w / 2, sys.y + 12 * u, sys.w - 12 * u, 14, { weight: 800, align: 'center', base: 'top', color: tone(S, 'lat').ink });
    glyph(S, 'cross', sys.x + sys.w / 2, sys.y + sys.h * 0.64, 26 * u, tone(S, 'err').c, crack * (1 - caseShift));
  });
  if (!port || !S.on('redteam-case')) fitText(S, S.l('busca el peor caso', 'look for the worst case'), sys.x + sys.w / 2, sys.y + sys.h + 10 * u, Math.max(sys.w + 60 * u, 200 * u), 13, { weight: 800, align: 'center', base: 'top', color: tone(S, 'err').ink, a: fr(S, 'redteam', 0.3, 0.42) * aAtk });
  if (!S.on('redteam-case')) return;
  // 38 961 ataques; la falla se vuelve un caso nuevo
  const k1 = fr(S, 'redteam-case', 0.1, 0.25);
  d.withAlpha(k1, () => {
    d.text(S.n(REDTEAM_ATTACKS, 0), A.x + A.w / 2, A.y + 4 * u, { size: FS(S, tight(S) ? 22 : 28), weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'center', base: 'top' });
    fitText(S, S.l('ataques publicados por Anthropic (2022)', 'attacks published by Anthropic (2022)'), A.x + A.w / 2, A.y + 4 * u + FS(S, tight(S) ? 22 : 28) * u * 1.15, A.w, 13, { weight: 700, align: 'center', base: 'top', color: p.ink2 });
  });
  const stW = Math.min(150 * u, A.w * (port ? 0.42 : 0.22)), stH = stW * 0.62;
  const st: Rect = port ? { x: A.x + (A.w - stW) / 2, y: A.y + A.h - stH - 30 * u, w: stW, h: stH } : { x: A.x + A.w * 0.72 - stW / 2, y: sys.y + (sys.h - stH) / 2, w: stW, h: stH };
  const k2 = fr(S, 'redteam-case', 0.55, 0.65);
  d.withAlpha(k2, () => {
    for (let i = 3; i >= 0; i--) card(S, { x: st.x + i * 7 * u, y: st.y - i * 7 * u, w: st.w, h: st.h }, { tone: 'w', fill: p.surface });
    fitText(S, S.l('tu conjunto de oro', 'your gold set'), st.x + st.w / 2, st.y + st.h + 10 * u, st.w + 80 * u, 13, { weight: 800, align: 'center', base: 'top', color: tone(S, 'w').ink });
  });
  // la falla viaja como tarjeta nueva
  const fly = fr(S, 'redteam-case', 0.66, 0.88, 'io');
  if (fly > 0.01) {
    const fx = lerp(sys.x + sys.w / 2, st.x + st.w / 2 + 28 * u, fly), fy = lerp(sys.y + sys.h * 0.64, st.y - 28 * u + st.h / 2, fly) - Math.sin(fly * Math.PI) * 40 * u;
    const cw = lerp(40 * u, st.w * 0.8, fly), chh = cw * 0.6;
    d.withAlpha(1, () => {
      card(S, { x: fx - cw / 2, y: fy - chh / 2, w: cw, h: chh }, { tone: 'err', fill: p.surface, lw: 2 });
      glyph(S, 'cross', fx, fy, Math.min(cw, chh) * 0.5, tone(S, 'err').c);
    });
    chip(S, S.l('caso nuevo', 'new case'), fx, fy - chh / 2 - 14 * u, 'err', { a: fr(S, 'redteam-case', 0.85, 0.95), size: 12.5, weight: 800 });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Resultado de negocio
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawBusiness(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const sw = Math.min(150 * u, A.w * (port ? 0.42 : 0.2)), sh = Math.min(84 * u, A.h * 0.24);
  const score: Rect = port ? { x: A.x, y: A.y + 6 * u, w: sw, h: sh } : { x: A.x, y: A.y + A.h * 0.18, w: sw, h: sh };
  d.withAlpha(fr(S, 'business', 0.04, 0.16), () => {
    card(S, score, { tone: 'dat', fill: p.surface });
    fitText(S, S.l('nota del conjunto', 'set score'), score.x + 10 * u, score.y + 10 * u, score.w - 20 * u, 12.5, { weight: 700, base: 'top', color: p.ink2 });
    d.text(pct(S, 87), score.x + 10 * u, score.y + score.h - 10 * u, { size: FS(S, 24), weight: 800, font: 'mono', color: tone(S, 'dat').ink, base: 'bottom' });
  });
  const neq = fr(S, 'business', 0.16, 0.26);
  const nx = port ? score.x + score.w + 26 * u : score.x + score.w + 30 * u, ny = score.y + score.h / 2;
  d.withAlpha(neq, () => { glyph(S, 'equal', nx, ny, 26 * u, p.ink); d.line(nx - 10 * u, ny + 12 * u, nx + 10 * u, ny - 12 * u, p.ink, 2.4); });
  const tiles = [S.l('costo por caso resuelto', 'cost per resolved case'), S.l('tiempo ahorrado', 'time saved'), S.l('quejas', 'complaints')];
  const tx = port ? A.x : nx + 30 * u, tw = port ? A.w : A.x + A.w - tx;
  const ty0 = port ? score.y + score.h + 22 * u : A.y + A.h * 0.08, th = Math.min(54 * u, (port ? A.h * 0.42 : A.h * 0.56) / 3 - 10 * u);
  tiles.forEach((t, i) => {
    const a = fr(S, 'business', 0.38 + i * 0.1, 0.48 + i * 0.1), R: Rect = { x: tx, y: ty0 + i * (th + 10 * u), w: tw, h: th };
    d.withAlpha(a, () => { card(S, R, { tone: 'sig', fill: p.surface }); fitText(S, t, R.x + 14 * u, R.y + R.h / 2, R.w - 28 * u, 15, { weight: 800, base: 'middle', color: tone(S, 'sig').ink }); });
  });
  // piloto con usuarios reales
  const k = fr(S, 'business', 0.76, 0.88);
  const py = port ? ty0 + 3 * (th + 10 * u) + 16 * u : A.y + A.h * 0.78;
  d.withAlpha(k, () => {
    const sc = Math.max(2, Math.round(2.4 * u)), lab = S.l('en un piloto con usuarios reales', 'in a pilot with real users');
    const lw = S.d.measure(lab, { size: FS(S, 14), weight: 800 }), total = 4 * 8 * sc + 12 * u + lw;
    const x0 = A.x + Math.max(0, (A.w - total) / 2);
    for (let i = 0; i < 4; i++) person(S, x0 + i * 8 * sc, py, sc, 'sig');
    fitText(S, lab, x0 + 4 * 8 * sc + 12 * u, py + 4.5 * sc, A.w - (x0 - A.x) - 4 * 8 * sc - 12 * u, 14, { weight: 800, base: 'middle' });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Repaso y puente
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const items = [
    { t: S.l('casos tuyos que nadie haya visto', 'your own cases no one has seen'), tn: 'w' as const },
    { t: S.l('rúbrica y revisión humana', 'rubric and human review'), tn: 'lat' as const },
    { t: S.l('un margen en cada nota', 'a margin on every score'), tn: 'sig' as const },
    { t: S.l('repetir la prueba en cada cambio', 'rerun the test after every change'), tn: 'dat' as const },
  ];
  const cols = port ? 1 : 2, rows = Math.ceil(items.length / cols), gap = 14 * u;
  const bw = (A.w - (cols - 1) * gap) / cols, bh = Math.min(port ? 76 * u : 96 * u, (A.h - (rows - 1) * gap) / rows), fs = FS(S, port ? 15 : 17);
  const y0 = A.y + (A.h - rows * bh - (rows - 1) * gap) / 2;
  items.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), a = fr(S, 'recap', 0.12 + i * 0.18, 0.24 + i * 0.18);
    const R: Rect = { x: A.x + c * (bw + gap), y: y0 + r * (bh + gap), w: bw, h: bh };
    d.withAlpha(a, () => {
      card(S, R, { tone: it.tn, fill: p.surface });
      d.text(String(i + 1), R.x + 16 * u, R.y + R.h / 2, { size: FS(S, 20), weight: 800, font: 'mono', color: tone(S, it.tn).ink, base: 'middle' });
      para(S, it.t, R.x + 44 * u, R.y + R.h / 2 - fs * u * 0.64 * Math.min(2, Math.ceil(S.d.measure(it.t, { size: fs, weight: 800 }) / (R.w - 56 * u))), R.w - 56 * u, fs, { weight: 800, maxLines: 2 });
    });
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round((tight(S) ? 4 : 6) * u));
  neu(S, cx - 12 * sc, cy - 18 * sc - 30 * u, { scale: sc, mood: 'think', a: fr(S, 'bridge', 0.05, 0.2) });
  d.withAlpha(fr(S, 'bridge', 0.6, 0.75), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 10 * u, { size: FS(S, 13), weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, S.l('Riesgos y gobernanza', 'Risks and governance'), cx, cy + 34 * u, S.W - 32 * u, 24, { weight: 800, align: 'center', base: 'top' });
  });
}
