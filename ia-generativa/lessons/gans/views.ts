// Vistas de pantalla completa: la presentación (falsificador y detective), las cuarenta partidas, el estudio de los
// rostros, por qué la difusión tomó la delantera, el resumen y el puente. Todo con tone()/S.pal (sin colores literales).
import { alpha, clamp, hash, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { fit, fr, fz, kk, pct } from './helpers';
import { NB, REAL_HIST, collapsed, coversBoth, grid } from './data';

type Pt = [number, number];
/** Puntos de un arco entre dos puntos (bend > 0 se curva hacia arriba en pantalla). */
function arc(x1: number, y1: number, x2: number, y2: number, bend: number, n = 28): Pt[] {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - bend, pts: Pt[] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([u * u * x1 + 2 * u * t * mx + t * t * x2, u * u * y1 + 2 * u * t * my + t * t * y2]); }
  return pts;
}
function arcArrow(S: Frame, pts: Pt[], c: string, lw: number, prog: number, a = 1) {
  if (prog <= 0.01) return;
  const n = Math.max(2, Math.round(pts.length * clamp(prog))), cut = pts.slice(0, n);
  S.d.polyline(cut, c, lw, { a });
  if (prog > 0.97) { const A = cut[cut.length - 2], B = cut[cut.length - 1]; S.d.arrow(A[0], A[1], B[0], B[1], c, lw, 9 * kk(S), a); }
}
const along = (pts: Pt[], t: number): Pt => pts[Math.min(pts.length - 1, Math.max(0, Math.round(t * (pts.length - 1))))];

function card(S: Frame, r: Rect, title: string, sub: string, t: Tone, a = 1, hot = 0) {
  const { d, pal: p } = S, tc = tone(S, t), k = kk(S);
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(tc.c, 0.1 + 0.25 * hot), stroke: tc.c, lw: 2, r: 5 });
    d.text(title, r.x + r.w / 2, r.y + r.h / 2 - (sub ? 2 * k : 0), { size: fit(S, title, r.w - 12 * k, 17, 800), weight: 800, color: tc.ink, align: 'center', base: sub ? 'bottom' : 'middle' });
    if (sub) d.text(sub, r.x + r.w / 2, r.y + r.h / 2 + 3 * k, { size: fit(S, sub, r.w - 12 * k, 12.5, 600), weight: 600, color: p.ink2, align: 'center', base: 'top' });
  });
}

// ═════════ presentación: el falsificador y el detective ═════════
export function drawIntro(S: Frame) {
  const { d, pal: p } = S, k = kk(S), lt = tone(S, 'lat'), sg = tone(S, 'sig'), er = tone(S, 'err');
  const short = !S.portrait && S.H < 340;   // teléfono horizontal: muy bajo
  const bw = Math.min(S.W * (S.portrait ? 0.38 : 0.26), 210 * k), bh = (short ? 50 : 66) * k;
  const gap = Math.min(S.W - 2 * bw - 40 * k, (S.portrait ? 70 : 170) * k);
  const lift = fr(S, 'idea', 0.05, 0.3, 'io') * (S.portrait ? 26 : short ? 16 : 34) * k;
  const bend = (short ? 30 : 46) * k, labOut = short ? 1 - fr(S, 'idea', 0, 0.2) : 1;
  const cy = S.H * 0.54 + lift, cx = S.W / 2;
  const F: Rect = { x: cx - gap / 2 - bw, y: cy - bh / 2, w: bw, h: bh }, D: Rect = { x: cx + gap / 2, y: cy - bh / 2, w: bw, h: bh };
  const aF = fr(S, 'hook', 0.02, 0.14), aD = fr(S, 'hook', 0.12, 0.24);
  card(S, F, S.l('falsificador', 'forger'), S.l('pinta billetes falsos', 'paints fake bills'), 'lat', aF);
  card(S, D, S.l('detective', 'detective'), S.l('busca los falsos', 'looks for fakes'), 'sig', aD);
  // arriba: el falso viaja al detective; abajo: «¡falso!» regresa y el falsificador aprende
  const top = arc(F.x + F.w * 0.7, F.y - 4 * k, D.x + D.w * 0.3, D.y - 4 * k, bend);
  const bot = arc(D.x + D.w * 0.3, D.y + D.h + 4 * k, F.x + F.w * 0.7, F.y + F.h + 4 * k, -bend);
  arcArrow(S, top, lt.c, 2.2, fr(S, 'hook', 0.24, 0.42, 'io'));
  const t1 = fr(S, 'hook', 0.42, 0.62, 'io');
  if (S.between('hook', 'idea') && t1 > 0 && t1 < 1) { const [x, y] = along(top, t1); d.rect(x - 13 * k, y - 7 * k, 26 * k, 14 * k, { fill: alpha(lt.c, 0.25), stroke: lt.c, lw: 1.5, r: 2 }); }
  const lab1 = fr(S, 'hook', 0.3, 0.42) * labOut;
  const [tx, ty] = along(top, 0.5);
  d.text(S.l('billete falso', 'fake bill'), tx, ty - 6 * k, { size: fz(S, 13), weight: 700, color: lt.ink, align: 'center', base: 'bottom', a: lab1, halo: p.stage });
  arcArrow(S, bot, er.c, 2.2, fr(S, 'hook', 0.62, 0.8, 'io'));
  const [bx, by] = along(bot, 0.5);
  d.text(S.l('«¡es falso!»', '“it’s fake!”'), bx, by + 6 * k, { size: fz(S, 13), weight: 700, color: er.ink, align: 'center', base: 'top', a: fr(S, 'hook', 0.7, 0.82) * labOut, halo: p.stage });
  // la idea: GAN, 2014
  const ia = fr(S, 'idea', 0.05, 0.25);
  if (ia > 0.01 && short) {
    // en una sola franja arriba: GAN, su nombre y la cita
    const t1 = S.l('GAN · red generativa adversaria', 'GAN · generative adversarial network');
    d.text(t1, cx, 8 * k, { size: fit(S, t1, S.W - 32 * k, 16, 800), weight: 800, color: p.ink, align: 'center', base: 'top', a: ia });
    const cite = S.l('Goodfellow y colegas, 2014', 'Goodfellow and colleagues, 2014');
    d.text(cite, cx, 28 * k, { size: fz(S, 12), weight: 600, italic: true, color: p.mute, align: 'center', base: 'top', a: fr(S, 'idea', 0.35, 0.5) });
    const two = S.l('dos redes que aprenden compitiendo', 'two networks that learn by competing');
    d.text(two, cx, S.H - 6 * k, { size: fit(S, two, S.W - 32 * k, 14, 700), weight: 700, color: sg.ink, align: 'center', base: 'bottom', a: fr(S, 'idea', 0.7, 0.85) });
  } else if (ia > 0.01) {
    const yT = Math.min(F.y - 80 * k, S.H * 0.22);
    d.text('GAN', cx, yT, { size: fz(S, 34), weight: 800, color: p.ink, align: 'center', base: 'bottom', a: ia });
    const sub = S.l('red generativa adversaria', 'generative adversarial network');
    d.text(sub, cx, yT + 4 * k, { size: fit(S, sub, S.W - 32 * k, 15, 700), weight: 700, color: p.ink2, align: 'center', base: 'top', a: ia });
    const cite = S.l('Goodfellow y colegas, 2014', 'Goodfellow and colleagues, 2014');
    d.text(cite, cx, yT + 26 * k, { size: fz(S, 13), weight: 600, italic: true, color: p.mute, align: 'center', base: 'top', a: fr(S, 'idea', 0.35, 0.5) });
    const two = S.l('dos redes que aprenden compitiendo', 'two networks that learn by competing');
    d.text(two, cx, Math.min(S.H - 14 * k, D.y + D.h + 70 * k), { size: fit(S, two, S.W - 32 * k, 14, 700), weight: 700, color: sg.ink, align: 'center', base: 'bottom', a: fr(S, 'idea', 0.7, 0.85) });
  }
}

// ═════════ las cuarenta partidas ═════════
function gridGeom(S: Frame) {
  const k = kk(S), all = inset(S.full(), 14 * k), titleH = 38 * k, legendH = 24 * k;
  const blocks: Rect[] = [];
  if (S.portrait) {
    const h = (all.h - legendH - 10 * k) / 2;
    blocks.push({ x: all.x, y: all.y, w: all.w, h }, { x: all.x, y: all.y + h + 10 * k, w: all.w, h });
  } else {
    const w = (all.w - 22 * k) / 2, h = all.h - legendH;
    blocks.push({ x: all.x, y: all.y, w, h }, { x: all.x + w + 22 * k, y: all.y, w, h });
  }
  const cells = blocks.map((b) => {
    const area = { x: b.x, y: b.y + titleH, w: b.w, h: b.h - titleH }, cols = 5, rows = 4, g = 5 * k;
    const cw = (area.w - (cols - 1) * g) / cols, ch = (area.h - (rows - 1) * g) / rows;
    return Array.from({ length: 20 }, (_, i) => ({ x: area.x + (i % cols) * (cw + g), y: area.y + Math.floor(i / cols) * (ch + g), w: cw, h: ch }));
  });
  return { all, blocks, cells, titleH, legendH };
}

function mini(S: Frame, r: Rect, h: number[], a: number) {
  const { d, pal: p } = S, lt = tone(S, 'lat'), dt = tone(S, 'dat'), k = kk(S);
  const ymax = 260, pad = 3 * k, x0 = r.x + pad, x1 = r.x + r.w - pad, base = r.y + r.h - pad, top = r.y + pad;
  const bw = (x1 - x0) / NB, Y = (v: number) => base - (base - top) * Math.min(v, ymax) / ymax;
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 3 });
    // los reales, como contorno tenue
    const rp: Pt[] = []; REAL_HIST.forEach((v, i) => { rp.push([x0 + i * bw, Y(v)], [x0 + (i + 1) * bw, Y(v)]); });
    d.polyline(rp, alpha(dt.c, 0.75), 1.2);
    h.forEach((v, i) => { if (v > 0) d.rect(x0 + i * bw, Y(v), Math.max(1, bw - 0.4), base - Y(v), { fill: alpha(lt.c, 0.7) }); });
    d.line(x0, base, x1, base, p.lineStrong, 1);
  });
}

export function drawGrid(S: Frame) {
  const { d, pal: p } = S, k = kk(S), G = grid(), geo = gridGeom(S), er = tone(S, 'err');
  const show = fr(S, 'count-intro', 0.05, 0.6, 'lin'), res = fr(S, 'count-result', 0.08, 0.3), inst = S.on('instability') ? fr(S, 'instability', 0.1, 0.3) : 0;
  const titles = [S.l('detective: 1 paso por cada paso del falsificador', 'detective: 1 step per forger step'), S.l('detective: 5 pasos por cada paso del falsificador', 'detective: 5 steps per forger step')];
  geo.blocks.forEach((b, j) => {
    const ta = fr(S, 'count-intro', 0.05 + j * 0.25, 0.2 + j * 0.25);
    d.text(titles[j], b.x, b.y + 2 * k, { size: fit(S, titles[j], b.w, 14, 800), weight: 800, color: p.ink, base: 'top', a: ta });
    const nCol = G[j].filter((s) => collapsed(s.cov)).length, nHalf = G[j].filter((s) => !collapsed(s.cov) && !coversBoth(s.cov)).length;
    const tally = j === 0 ? S.l(`las dos montañas: ${G[j].filter((s) => coversBoth(s.cov)).length} de 20`, `both mountains: ${G[j].filter((s) => coversBoth(s.cov)).length} of 20`)
      : S.l(`colapsan: ${nCol} de 20 · a medias: ${nHalf}`, `collapse: ${nCol} of 20 · halfway: ${nHalf}`);
    d.text(tally, b.x, b.y + 20 * k, { size: fit(S, tally, b.w, 13, 700), weight: 700, color: j === 0 ? tone(S, 'dat').ink : er.ink, base: 'top', a: res });
    geo.cells[j].forEach((c, i) => {
      const a = clamp(show * 1.6 * 20 - (i + j * 20) * 0.8 + 1) ;
      if (a <= 0.01) return;
      const st = G[j][i];
      mini(S, c, st.hist, clamp(a));
      if (res > 0.01 && j === 1) {
        if (collapsed(st.cov)) d.rect(c.x - 2, c.y - 2, c.w + 4, c.h + 4, { stroke: er.c, lw: 3, r: 4, a: res });
        else if (!coversBoth(st.cov)) d.rect(c.x - 2, c.y - 2, c.w + 4, c.h + 4, { stroke: er.c, lw: 2, r: 4, dash: [4, 3], a: res });
      }
    });
  });
  // leyenda
  const ly = geo.all.y + geo.all.h - 6 * k, lx = geo.all.x;
  // si no cabe junto a «mismas reglas, distinto azar», la leyenda del colapso le cede el sitio
  const tight = lx + d.measure(S.l('colapsó: una sola montaña', 'collapsed: a single mountain'), { size: fz(S, 12), weight: 600 }) + d.measure(S.l('mismas reglas, distinto azar', 'same rules, different luck'), { size: fz(S, 12), weight: 700 }) + 80 * k > geo.all.x + geo.all.w;
  d.withAlpha(res * (tight ? 1 - inst : 1), () => {
    d.rect(lx, ly - 12 * k, 18 * k, 12 * k, { stroke: er.c, lw: 3, r: 2 });
    const t1 = S.l('colapsó: una sola montaña', 'collapsed: a single mountain');
    d.text(t1, lx + 24 * k, ly - 6 * k, { size: fz(S, 12), weight: 600, color: p.ink2, base: 'middle' });
    const w1 = d.measure(t1, { size: fz(S, 12), weight: 600 }) + 40 * k;
    if (lx + w1 + 90 * k + (inst > 0.01 ? d.measure(S.l('mismas reglas, distinto azar', 'same rules, different luck'), { size: fz(S, 12), weight: 700 }) + 30 * k : 0) < geo.all.x + geo.all.w) {
      d.rect(lx + w1, ly - 12 * k, 18 * k, 12 * k, { stroke: er.c, lw: 2, r: 2, dash: [4, 3] });
      d.text(S.l('a medias', 'halfway'), lx + w1 + 24 * k, ly - 6 * k, { size: fz(S, 12), weight: 600, color: p.ink2, base: 'middle' });
    }
  });
  // mismas reglas, distinto azar: semilla 1 (sana) y semilla 2 (colapsa), ambas con 5 pasos
  if (inst > 0.01) {
    [geo.cells[1][1], geo.cells[1][2]].forEach((c) => d.rect(c.x - 5, c.y - 5, c.w + 10, c.h + 10, { stroke: p.ink, lw: 2, r: 5, a: inst }));
    const lx2 = geo.all.x + geo.all.w, txt = S.l('mismas reglas, distinto azar', 'same rules, different luck');
    const tw = d.measure(txt, { size: fz(S, 12), weight: 700 });
    d.rect(lx2 - tw - 24 * k, ly - 12 * k, 18 * k, 12 * k, { stroke: p.ink, lw: 2, r: 2, a: inst });
    d.text(txt, lx2, ly - 6 * k, { size: fz(S, 12), weight: 700, color: p.ink, align: 'right', base: 'middle', a: inst });
  }
}

// ═════════ el estudio de los rostros (Nightingale y Farid, 2022) ═════════
export function drawFaces(S: Frame) {
  const { d, pal: p } = S, k = kk(S), sg = tone(S, 'sig');
  const a1 = fr(S, 'faces', 0.25, 0.45), a2 = fr(S, 'faces', 0.5, 0.7);
  // teléfono horizontal (muy bajo): tarjetas a la izquierda y texto a la derecha; si no, una cosa debajo de la otra
  const short = !S.portrait && S.H < 340, all = inset(S.full(), 16 * k), textH = 168 * k;
  const C: Rect = short ? { x: all.x, y: all.y, w: all.w * 0.42, h: all.h } : { x: all.x, y: all.y, w: all.w, h: Math.max(120 * k, all.h - textH - 20 * k) };
  const T: Rect = short ? { x: all.x + all.w * 0.46, y: all.y + Math.max(0, (all.h - textH) / 2), w: all.w * 0.54, h: textH } : { x: all.x, y: C.y + C.h + 4 * k, w: all.w, h: textH };
  // dos tarjetas: rostro real y rostro hecho con una GAN (siluetas genéricas; no son rostros reales)
  const cw = Math.min(110 * k, C.w * 0.38, (C.h - 30 * k) / 1.15), ch = cw * 1.15, gap = 24 * k;
  const yC = C.y + Math.max(0, (C.h - ch - 24 * k) / 2), cx = C.x + C.w / 2;
  const face = (x: number, t: Tone, lab: string, a: number) => {
    const tc = tone(S, t);
    d.withAlpha(a, () => {
      d.rect(x, yC, cw, ch, { fill: alpha(tc.c, 0.08), stroke: tc.c, lw: 1.8, r: 4 });
      d.circle(x + cw / 2, yC + ch * 0.38, cw * 0.2, { stroke: tc.c, lw: 2 });
      d.polyline(arc(x + cw * 0.2, yC + ch * 0.95, x + cw * 0.8, yC + ch * 0.95, ch * 0.3), tc.c, 2);
      d.text(lab, x + cw / 2, yC + ch + 6 * k, { size: fit(S, lab, cw + gap - 4 * k, 13, 700), weight: 700, color: tc.ink, align: 'center', base: 'top' });
    });
  };
  face(cx - gap / 2 - cw, 'dat', S.l('foto real', 'real photo'), a1);
  face(cx + gap / 2, 'lat', S.l('hecho con una GAN', 'made with a GAN'), a1);
  d.text('?', cx, yC + ch * 0.45, { size: fz(S, 24), weight: 800, color: p.ink, align: 'center', base: 'middle', a: a1 });
  // texto y resultado
  const W = Math.min(T.w, 520 * k), x0 = T.x + (T.w - W) / 2, tc = x0 + W / 2;
  let y = T.y;
  const who = S.l('315 personas intentaron distinguirlos', '315 people tried to tell them apart');
  d.text(who, tc, y, { size: fit(S, who, W, 15, 700), weight: 700, color: p.ink, align: 'center', base: 'top', a: a2 });
  const gan = S.l('rostros sintéticos: StyleGAN2', 'synthetic faces: StyleGAN2');
  d.text(gan, tc, y + 22 * k, { size: fz(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', a: a2 });
  y += 62 * k;
  // resultado: 48.2 % de aciertos frente al 50 % del azar
  const ra = fr(S, 'faces-result', 0.05, 0.2), fill = fr(S, 'faces-result', 0.1, 0.45, 'io');
  if (ra > 0.01) d.withAlpha(ra, () => {
    const by = y, bh = 16 * k;
    d.rect(x0, by, W, bh, { fill: p.surface2, stroke: p.line, lw: 1, r: 3 });
    d.rect(x0, by, W * 0.482 * fill, bh, { fill: alpha(sg.c, 0.85), r: 3 });
    d.line(x0 + W * 0.5, by - 8 * k, x0 + W * 0.5, by + bh + 8 * k, p.ink, 2, [4, 3]);
    d.text(S.l('azar: 50 %', 'chance: 50%'), x0 + W * 0.5 + 6 * k, by - 6 * k, { size: fz(S, 12), weight: 700, color: p.ink2, base: 'bottom' });
    d.text(S.lang === 'es' ? '0 %' : '0%', x0, by + bh + 4 * k, { size: fz(S, 12), font: 'mono', color: p.mute, base: 'top' });
    d.text(S.lang === 'es' ? '100 %' : '100%', x0 + W, by + bh + 4 * k, { size: fz(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'top' });
    const lab = S.l(`aciertos: ${pct(S, 0.482, 1)}`, `correct: ${pct(S, 0.482, 1)}`);
    const lx = Math.max(x0 + d.measure(lab, { size: fz(S, 15), weight: 800, font: 'mono' }), x0 + W * 0.482 * fill - 6 * k);
    d.text(lab, lx, by + bh + 20 * k, { size: fz(S, 15), weight: 800, font: 'mono', color: sg.ink, align: 'right', base: 'top', a: fr(S, 'faces-result', 0.4, 0.55) });
    const coin = S.l('como lanzar una moneda: «no sé»', 'like flipping a coin: “I can’t tell”');
    d.text(coin, tc, by + bh + 46 * k, { size: fit(S, coin, W, 14, 700), weight: 700, color: p.ink2, align: 'center', base: 'top', a: fr(S, 'faces-result', 0.62, 0.78) });
  });
  const cite = S.l('Nightingale y Farid, PNAS, 2022', 'Nightingale and Farid, PNAS, 2022');
  d.text(cite, short ? tc : S.W / 2, short ? Math.min(S.H - 4 * k, T.y + T.h + 4 * k) : S.H - 12 * k, { size: fz(S, 12), italic: true, color: p.mute, align: 'center', base: 'bottom', a: a2 });
}

// ═════════ por qué la difusión tomó la delantera ═════════
export function drawDiff(S: Frame) {
  const { d, pal: p } = S, k = kk(S), lt = tone(S, 'lat'), sg = tone(S, 'sig');
  const all = inset(S.full(), (S.H < 340 && !S.portrait ? 10 : 18) * k), short = !S.portrait && S.H < 340;
  // línea del tiempo: 2014 → 2021 (en el teléfono horizontal, una sola línea de texto)
  const tlY = all.y + (short ? 12 : 34) * k, x0 = all.x + 30 * k, x1 = all.x + all.w - 30 * k, ta = fr(S, 'diffusion', 0.05, 0.25);
  if (short) {
    const t = S.l('2014: GAN  →  2021: la difusión supera a las GAN (Dhariwal y Nichol)', '2014: GAN  →  2021: diffusion beats GANs (Dhariwal & Nichol)');
    d.text(t, all.x + all.w / 2, tlY, { size: fit(S, t, all.w, 13, 700), weight: 700, color: p.ink, align: 'center', base: 'middle', a: ta });
  } else d.withAlpha(ta, () => {
    d.line(x0, tlY, x1, tlY, p.lineStrong, 2);
    [[x0, '2014', S.l('GAN', 'GAN')], [x1, '2021', S.l('difusión > GAN', 'diffusion > GAN')]].forEach(([x, yr, lab], i) => {
      const xx = x as number, a = i === 0 ? 1 : fr(S, 'diffusion', 0.4, 0.55);
      d.circle(xx, tlY, 6 * k, { fill: i === 0 ? lt.c : sg.c, stroke: p.stage, lw: 2, a });
      d.text(yr as string, xx, tlY - 10 * k, { size: fz(S, 13), weight: 800, font: 'mono', color: p.ink, align: i === 0 ? 'left' : 'right', base: 'bottom', a });
      d.text(lab as string, xx, tlY + 12 * k, { size: fz(S, 13), weight: 700, color: i === 0 ? lt.ink : sg.ink, align: i === 0 ? 'left' : 'right', base: 'top', a });
    });
    const cite = 'Dhariwal & Nichol';
    d.text(cite, x1, tlY + 30 * k, { size: fz(S, 12), italic: true, color: p.mute, align: 'right', base: 'top', a: fr(S, 'diffusion', 0.5, 0.65) });
  });
  // dos columnas: GAN | difusión
  const top = tlY + (short ? 18 : 62) * k, gap = 14 * k, cw = (all.w - gap) / 2, iGap = (short ? 4 : 12) * k, head = (short ? 30 : 40) * k;
  const itemSize = fz(S, 13.5), lhI = itemSize * S.u * 1.3;
  const cols: { title: string; t: Tone; seg: string; items: [string, boolean][] }[] = [
    { title: 'GAN', t: 'lat', seg: 'why-gan', items: [[S.l('menos variedad', 'less variety'), false], [S.l('difícil de entrenar: colapsa', 'hard to train: collapses'), false], [S.l('genera en 1 pasada', 'generates in 1 pass'), true]] },
    { title: S.l('Difusión', 'Diffusion'), t: 'sig', seg: 'why-diffusion', items: [[S.l('más variedad', 'more variety'), true], [S.l('meta fija: entrenamiento estable', 'fixed goal: stable training'), true], [S.l('genera en muchos pasos', 'generates in many steps'), false]] },
  ];
  // la altura de las dos columnas es la del contenido más largo
  const chH = Math.min(all.y + all.h - top, head + 8 * k + Math.max(...cols.map((c) => c.items.reduce((s2, [t]) => s2 + d.wrap(t, cw - 40 * k, { size: itemSize, weight: 700 }).length * lhI + iGap, 0))));
  cols.forEach((c, j) => {
    const x = all.x + j * (cw + gap), a = fr(S, c.seg, 0.03, 0.15);
    if (a < 0.01) return;
    const tc = tone(S, c.t);
    d.withAlpha(a, () => {
      d.rect(x, top, cw, chH, { fill: alpha(tc.c, 0.06), stroke: tc.c, lw: 1.5, r: 5 });
      d.text(c.title, x + 12 * k, top + (short ? 6 : 10) * k, { size: fz(S, short ? 14 : 16), weight: 800, color: tc.ink, base: 'top' });
      let y = top + head;
      c.items.forEach(([txt, good], i) => {
        // la velocidad (tercer renglón) se señala al final del segmento de la difusión
        const ia = i === 2 ? fr(S, 'why-diffusion', 0.62, 0.75) : fr(S, c.seg, 0.15 + i * 0.25, 0.27 + i * 0.25);
        if (ia < 0.01) { y += 0; return; }
        const size = itemSize, lines = d.wrap(txt, cw - 40 * k, { size, weight: 700 });
        d.withAlpha(ia, () => {
          // + o − con forma (no solo color)
          const mx = x + 18 * k, my = y + size * S.u * 0.6;
          d.line(mx - 5 * k, my, mx + 5 * k, my, good ? tone(S, 'dat').c : tone(S, 'err').c, 2.5);
          if (good) d.line(mx, my - 5 * k, mx, my + 5 * k, tone(S, 'dat').c, 2.5);
          d.text(lines.join('\n'), x + 32 * k, y, { size, weight: 700, color: p.ink, base: 'top' });
        });
        y += lines.length * size * S.u * 1.3 + iGap;
      });
    });
  });
}

// ═════════ resumen y puente ═════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, k = kk(S);
  const all = inset(S.full(), 22 * k), W = Math.min(all.w, 560 * k), x = (S.W - W) / 2;
  const rows: [Tone, string][] = [
    ['lat', S.l('generador: convierte azar en datos falsos', 'generator: turns chance into fake data')],
    ['sig', S.l('discriminador: juzga de 0 a 1 si es real', 'discriminator: judges from 0 to 1 if it is real')],
    ['ink', S.l('compiten hasta que el detective dice 0.5', 'they compete until the detective says 0.5')],
    ['err', S.l('riesgos: colapso de modo e inestabilidad', 'risks: mode collapse and instability')],
  ];
  const size = fz(S, 15), lh = size * S.u * 1.3;
  const blocks = rows.map(([, t]) => d.wrap(t, W - 34 * k, { size, weight: 700 }));
  const total = blocks.reduce((s, b) => s + b.length * lh + 18 * k, 0);
  let y = (S.H - total) / 2;
  rows.forEach(([t, ], i) => {
    const a = fr(S, 'recap', 0.05 + i * 0.2, 0.17 + i * 0.2);
    d.withAlpha(a, () => {
      d.rect(x, y + 2 * k, 12 * k, 12 * k, { fill: tone(S, t).c, r: 2 });
      d.text(blocks[i].join('\n'), x + 24 * k, y, { size, weight: 700, color: p.ink, base: 'top' });
    });
    y += blocks[i].length * lh + 18 * k;
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, k = kk(S), lt = tone(S, 'lat'), dt = tone(S, 'dat');
  const W = Math.min(S.W - 40 * k, 520 * k), x0 = (S.W - W) / 2, cy = S.H * 0.44, h = Math.min(90 * k, S.H * 0.2);
  const a = fr(S, 'bridge', 0.05, 0.25), b = fr(S, 'bridge', 0.35, 0.6, 'io');
  const bw = W * 0.38;
  // ruido (izquierda) → datos (derecha)
  d.withAlpha(a, () => {
    for (let i = 0; i < 70; i++) {
      d.circle(x0 + hash(i, 1) * bw, cy - h / 2 + hash(i, 2) * h, 2.2 * k, { fill: alpha(lt.c, 0.8) });
    }
    d.text(S.l('ruido', 'noise'), x0 + bw / 2, cy + h / 2 + 10 * k, { size: fz(S, 13), weight: 700, color: lt.ink, align: 'center', base: 'top' });
  });
  d.arrow(x0 + bw + 12 * k, cy, x0 + W - bw - 12 * k, cy, p.ink2, 2, 9 * k, b);
  d.withAlpha(b, () => {
    const xs = x0 + W - bw, pts: Pt[] = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, xx = -3 + 6 * t, yy = Math.exp(-((xx + 1.5) ** 2) / 0.32) + Math.exp(-((xx - 1.5) ** 2) / 0.32); pts.push([xs + t * bw, cy + h / 2 - yy * h * 0.9]); }
    d.polyline(pts, dt.c, 2.5);
    d.text(S.l('datos', 'data'), xs + bw / 2, cy + h / 2 + 10 * k, { size: fz(S, 13), weight: 700, color: dt.ink, align: 'center', base: 'top' });
  });
  const t = S.l('Siguiente: difusión, aprender a quitar ruido', 'Next: diffusion, learning to remove noise');
  d.text(t, S.W / 2, cy - h / 2 - 28 * k, { size: fit(S, t, S.W - 32 * k, 16, 800), weight: 800, color: p.ink, align: 'center', base: 'bottom', a: fr(S, 'bridge', 0.5, 0.7) });
}
