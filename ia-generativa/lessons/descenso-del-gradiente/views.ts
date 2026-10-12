// Vistas de la lección fuera de la curva de un peso: la pregunta inicial, el paisaje de dos pesos (el gradiente),
// la escala, el paisaje con dos valles, el bucle y el puente. Todas se animan por fracciones de su segmento.
import { Plot, alpha, box, clamp, ease, hash, lerp, link, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { C2, L2, PATH2, R as RL, PATH_A, PATH_B, RSTEPS, START2, STEPS2, g2 } from './curves';
import { flow, type Ro } from './aside';
import { fr, fz, kk, label, sg, sn } from './helpers';

type Lay = { main: Rect; aside: Rect; all: Rect };

// ── la pregunta inicial ──
export function drawHook(S: Frame, R: Lay) {
  const { d, pal: p } = S, k = kk(S), r = R.all, cx = r.x + r.w / 2, cy = r.y + r.h * 0.46;
  const sc = Math.max(3, Math.round(4 * S.u)), nw = 24 * sc;
  neu(S, cx - nw / 2, cy - 18 * sc - 34 * k, { scale: sc, mood: 'think', a: fr(S, 'hook', 0, 0.12) });
  const a = fr(S, 'hook', 0.55, 0.7);
  d.text(S.l('¿Qué peso se equivoca menos?', 'Which weight is least wrong?'), cx, cy + 6 * k, { size: fz(S, 20), weight: 800, color: p.ink, align: 'center', base: 'top', a, w: r.w - 32 * k });
  d.text(S.l('sin probarlos todos', 'without trying them all'), cx, cy + 40 * k, { size: fz(S, 14), weight: 600, color: p.ink2, align: 'center', base: 'top', a: a * fr(S, 'hook', 0.7, 0.82) });
}

// ═════════════════════════════════════════════════════════════════════════
// Dos pesos: el paisaje visto desde arriba, las dos pendientes y el gradiente
// ═════════════════════════════════════════════════════════════════════════
const LEVELS = [8, 5.5, 3.5, 2, 1, 0.4];
export function draw2D(S: Frame, R: Lay) {
  const { d, pal: p } = S, k = kk(S), er = tone(S, 'err'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const pad = { l: 34, r: 10, t: 24, b: 40 };
  const iw = R.main.w - (pad.l + pad.r) * S.u, ih = R.main.h - (pad.t + pad.b) * S.u;
  // misma escala en los dos ejes si cabe; en una gráfica muy baja (teléfono horizontal) se estira para que quepa el camino
  const xr: [number, number] = [-2.2, 4.4], yh = Math.max(1.45, ((xr[1] - xr[0]) * ih) / iw / 2);
  const pl = new Plot(S, R.main, { xr, yr: [C2[1] - yh, C2[1] + yh], pad });
  const r = pl.r;
  // ejes y rótulos
  const axA = fr(S, 'two-weights', 0.1, 0.3);
  d.withAlpha(axA, () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    d.text(S.l('primer peso w₁', 'first weight w₁'), r.x + r.w, r.y + r.h + 8 * k, { size: fz(S, 13), weight: 700, color: wt.ink, align: 'right', base: 'top' });
    d.text(S.l('segundo peso w₂', 'second weight w₂'), pl.outer.x + 2, r.y - 8 * k, { size: fz(S, 13), weight: 700, color: wt.ink, base: 'bottom' });
  });
  // el paisaje: más color, más error
  const heatA = fr(S, 'two-weights', 0.35, 0.75);
  if (heatA > 0.01) pl.heat(L2, (v) => alpha(er.c, 0.01 + 0.11 * Math.sqrt(clamp(v / 14))), [44, 30], heatA);
  // curvas de nivel, de fuera hacia dentro
  LEVELS.forEach((lv, i) => { const a = fr(S, 'contours', 0.12 + i * 0.07, 0.2 + i * 0.07); if (a > 0.01) pl.contours(L2, [lv], 'mute', { lw: 1.3, res: 56, a }); });
  const minA = fr(S, 'contours', 0.62, 0.74);
  if (minA > 0.01) {
    d.withAlpha(minA, () => d.circle(pl.X(C2[0]), pl.Y(C2[1]), 6 * k, { fill: dt.c, stroke: p.stage, lw: 2 }));
    label(S, S.l('fondo', 'bottom'), pl.X(C2[0]) + 12 * k, pl.Y(C2[1]) + 18 * k, { tone: 'dat', a: minA, align: 'left' });
  }

  // punto de partida, las dos pendientes y el gradiente
  // la flecha del gradiente cabe siempre en la gráfica (en teléfono horizontal la gráfica es muy baja)
  const [gx, gy] = g2(START2[0], START2[1]), gl = Math.hypot(gx, gy);
  const s = Math.min(1.35 / gl, (0.8 * (pl.o.yr[1] - START2[1])) / Math.abs(gy), (0.8 * (START2[0] - xr[0])) / Math.abs(gx));
  const sx = pl.X(START2[0]), sy = pl.Y(START2[1]);
  const compA = fr(S, 'two-slopes', 0.25, 0.4) * (1 - 0.6 * fr(S, 'path2d', 0, 0.2)), compB = fr(S, 'two-slopes', 0.5, 0.65) * (1 - 0.6 * fr(S, 'path2d', 0, 0.2));
  const ex = pl.X(START2[0] + gx * s), ey = pl.Y(START2[1] + gy * s);
  if (compA > 0.01) {
    d.arrow(sx, sy, ex, sy, er.c, 2.5, 9 * k, compA);
    d.text('w₁', (sx + ex) / 2, sy + 6 * k, { size: fz(S, 13), weight: 800, color: er.ink, align: 'center', base: 'top', halo: p.stage, a: compA });
  }
  if (compB > 0.01) {
    d.arrow(sx, sy, sx, ey, er.c, 2.5, 9 * k, compB);
    d.text('w₂', sx + 7 * k, (sy + ey) / 2, { size: fz(S, 13), weight: 800, color: er.ink, base: 'middle', halo: p.stage, a: compB });
  }
  const gA = fr(S, 'gradient', 0.42, 0.55);
  if (gA > 0.01) {
    d.line(ex, sy, ex, ey, er.c, 1.5, [4, 4], gA * (1 - fr(S, 'path2d', 0, 0.2)));
    d.line(sx, ey, ex, ey, er.c, 1.5, [4, 4], gA * (1 - fr(S, 'path2d', 0, 0.2)));
    const f = fr(S, 'gradient', 0.42, 0.65, 'io');
    d.arrow(sx, sy, lerp(sx, ex, f), lerp(sy, ey, f), er.c, 3.5, 11 * k, gA);
    label(S, S.l('gradiente: cuesta arriba', 'gradient: uphill'), sx + 14 * k, ey + 2 * k, { tone: 'err', a: fr(S, 'gradient', 0.62, 0.72), align: 'left' });
  }
  // el paso: al revés de la flecha; luego el camino completo
  const stA = fr(S, 'path2d', 0.08, 0.2) * (1 - fr(S, 'path2d', 0.3, 0.4));
  if (stA > 0.01) {
    const qx = pl.X(START2[0] - gx * s * 0.7), qy = pl.Y(START2[1] - gy * s * 0.7);
    d.arrow(sx, sy, qx, qy, wt.c, 3.5, 11 * k, stA);
    label(S, S.l('bajar: al revés', 'go down: opposite'), qx + 6 * k, qy + 16 * k, { tone: 'w', a: stA, align: 'left' });
  }
  const kf = fr(S, 'path2d', 0.3, 0.92, 'lin') * STEPS2, n = Math.floor(kf), e = kf - n;
  const cur: [number, number] = n < STEPS2 ? [lerp(PATH2[n][0], PATH2[n + 1][0], ease.io(e)), lerp(PATH2[n][1], PATH2[n + 1][1], ease.io(e))] : PATH2[STEPS2];
  if (S.on('path2d')) {
    for (let i = 0; i < Math.min(n, STEPS2); i++) pl.line(PATH2[i][0], PATH2[i][1], PATH2[i + 1][0], PATH2[i + 1][1], 'w', 2.4);
    if (n < STEPS2 && kf > 0) pl.line(PATH2[n][0], PATH2[n][1], cur[0], cur[1], 'w', 2.4);
    PATH2.slice(0, Math.min(n, STEPS2) + 1).forEach((q) => pl.dot(q[0], q[1], 3, 'w', { a: 0.6 }));
  }
  const bA = fr(S, 'two-weights', 0.75, 0.88);
  if (bA > 0.01) d.withAlpha(bA, () => d.circle(pl.X(cur[0]), pl.Y(cur[1]), 8 * k, { fill: wt.c, stroke: p.stage, lw: 2.5 }));
  if (bA > 0.01 && !S.on('gradient')) label(S, `error ${sn(S, L2(START2[0], START2[1]), 2)}`, sx + 12 * k, sy - 22 * k, { tone: 'err', a: fr(S, 'two-weights', 0.82, 0.92) * (1 - fr(S, 'two-slopes', 0, 0.15)), mono: true, align: 'left' });

  // columna lateral
  const [cx, cy] = cur, [hx, hy] = g2(cx, cy), steps = S.on('path2d') ? Math.min(STEPS2, n) : 0;
  const slA = fr(S, 'two-slopes', 0.25, 0.4);
  const er_: Ro = { name: 'error', value: sn(S, L2(cx, cy), 2), tone: 'err', a: fr(S, 'two-weights', 0.82, 0.92) };
  const st_: Ro = { name: S.l('pasos', 'steps'), value: String(steps), a: fr(S, 'path2d', 0.25, 0.35) };
  const w1: Ro = { name: S.l('pendiente w₁', 'slope w₁'), value: sg(S, hx, 2), tone: 'err', a: slA };
  const w2: Ro = { name: S.l('pendiente w₂', 'slope w₂'), value: sg(S, hy, 2), tone: 'err', a: fr(S, 'two-slopes', 0.5, 0.65) };
  const items = S.portrait ? [er_, w1, w2, st_] : [er_, st_, w1, w2];
  flow(S, R.aside, [
    { k: 'ro', items, cols: S.portrait ? 4 : 2 },
    { k: 'swatch', lo: S.l('poco error', 'little error'), hi: S.l('mucho error', 'a lot of error'), a: fr(S, 'contours', 0.3, 0.45) },
    { k: 'text', mono: true, tone: 'err', a: fr(S, 'gradient', 0.3, 0.45), text: `${S.l('gradiente', 'gradient')} = (${sg(S, gx, 1)}, ${sg(S, gy, 1)})` },
    { k: 'text', tone: 'ink', a: fr(S, 'gradient', 0.6, 0.72), text: S.l('Una pendiente por peso.', 'One slope per weight.') },
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// Escala: muchísimos pesos, todos a la vez en cada paso
// ═════════════════════════════════════════════════════════════════════════
export function drawScale(S: Frame, R: Lay) {
  const { d, pal: p } = S, k = kk(S), r = R.all, wt = tone(S, 'w');
  const cols = S.portrait ? 18 : 36, rows = S.portrait ? 12 : 12;
  const gh = r.h * 0.56, cs = Math.min(r.w / cols, gh / rows), x0 = r.x + (r.w - cs * cols) / 2, y0 = r.y + 4 * k;
  // cada paso cambia todos los cuadros a la vez
  const q = fr(S, 'scale', 0.25, 0.9, 'lin') * 6, j = Math.min(5, Math.floor(q)), e = ease.io(clamp((q - j) / 0.35));
  d.withAlpha(fr(S, 'scale', 0.05, 0.2), () => {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const id = y * cols + x, v = lerp(hash(id, j), hash(id, j + 1), e);
      d.rect(x0 + x * cs, y0 + y * cs, cs - 1.5, cs - 1.5, { fill: alpha(wt.c, 0.08 + 0.6 * v) });
    }
  });
  const ty = y0 + rows * cs;
  d.text(S.l('cada cuadro es un peso (aquí, una muestra)', 'each square is one weight (a sample here)'), r.x + r.w / 2, ty + 6 * k, { size: fz(S, 12), color: p.mute, align: 'center', base: 'top', a: fr(S, 'scale', 0.15, 0.3) });
  const nA = fr(S, 'scale', 0.62, 0.75);
  d.text(S.l('175 000 000 000', '175,000,000,000'), r.x + r.w / 2, ty + 28 * k, { size: fz(S, Math.min(34, 20 + r.w / 40)), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'top', a: nA });
  d.text(S.l('pesos en GPT-3: una pendiente por peso, y todos se ajustan a la vez en cada paso', 'weights in GPT-3: one slope per weight, and all adjusted at once on every step'), r.x + r.w / 2, ty + 72 * k, { size: fz(S, 13.5), weight: 600, color: p.ink2, align: 'center', base: 'top', w: Math.min(r.w - 24 * k, 520 * k), a: nA });
}

// ═════════════════════════════════════════════════════════════════════════
// Paisaje irregular: dos puntos de partida, dos valles
// ═════════════════════════════════════════════════════════════════════════
export function drawRugged(S: Frame, R: Lay) {
  const { d, pal: p } = S, k = kk(S);
  const pl = new Plot(S, R.all, { xr: [-3.2, 3.2], yr: [0, 5], pad: { l: 34, r: 10, t: 30, b: 42 } }), r = pl.r;
  d.withAlpha(fr(S, 'rugged', 0.05, 0.2), () => {
    d.line(r.x, r.y + r.h, r.x + r.w, r.y + r.h, p.lineStrong, 1.5);
    d.line(r.x, r.y, r.x, r.y + r.h, p.lineStrong, 1.5);
    d.text(S.l('peso w', 'weight w'), r.x + r.w, r.y + r.h + 8 * k, { size: fz(S, 13), weight: 700, color: tone(S, 'w').ink, align: 'right', base: 'top' });
    d.text('error', pl.outer.x + 2, r.y - 8 * k, { size: fz(S, 13), weight: 700, color: tone(S, 'err').ink, base: 'bottom' });
  });
  const cA = fr(S, 'rugged', 0.12, 0.4, 'io');
  if (cA > 0.001) pl.curve(RL, 'ink', 3, { to: lerp(-3.2, 3.2, cA) });
  const kf = fr(S, 'valleys', 0.06, 0.62, 'lin') * RSTEPS, n = Math.floor(kf), f = kf - n;
  const one = (path: number[], tn: 'w' | 'lat', name: string, a: number) => {
    for (let i = 0; i < Math.min(n, RSTEPS); i++) pl.line(path[i], RL(path[i]), path[i + 1], RL(path[i + 1]), tn, 2, [4, 3], 0.8 * a);
    const w = lerp(path[Math.min(n, RSTEPS)], path[Math.min(n + 1, RSTEPS)], f), t = tone(S, tn);
    d.withAlpha(a, () => d.circle(pl.X(w), pl.Y(RL(w)), 8 * k, { fill: t.c, stroke: p.stage, lw: 2.5 }));
    d.text(name, pl.X(w), pl.Y(RL(w)) - 14 * k, { size: fz(S, 15), weight: 800, color: t.ink, align: 'center', base: 'bottom', halo: p.stage, a });
    return w;
  };
  const wa = one(PATH_A, 'w', 'A', fr(S, 'rugged', 0.5, 0.62)), wb = one(PATH_B, 'lat', 'B', fr(S, 'rugged', 0.66, 0.78));
  const endA = fr(S, 'valleys', 0.66, 0.78);
  if (endA > 0.01) {
    label(S, `A · error ${sn(S, RL(wa), 2)}`, pl.X(wa), pl.Y(RL(wa)) + 26 * k, { tone: 'w', a: endA, mono: true });
    label(S, `B · error ${sn(S, RL(wb), 2)}`, pl.X(wb), pl.Y(RL(wb)) + 26 * k, { tone: 'lat', a: endA, mono: true });
    d.text(S.l('Misma regla, otro inicio, otro valle.', 'Same rule, another start, another valley.'), r.x + r.w / 2, r.y + 4 * k, { size: fz(S, 14), weight: 700, color: p.ink, align: 'center', base: 'top', halo: p.stage, a: fr(S, 'valleys', 0.8, 0.9) });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// El bucle y el puente
// ═════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame, R: Lay) {
  const r = R.all, k = kk(S);
  const labels = [S.l('1 · Medir el error', '1 · Measure the error'), S.l('2 · Calcular la pendiente', '2 · Compute the slope'), S.l('3 · Dar un paso en contra', '3 · Step against it'), S.l('4 · Repetir', '4 · Repeat')];
  const tones = ['err', 'err', 'w', 'dat'] as const;
  const bw = Math.min(230 * k, S.portrait ? r.w - 40 * k : r.w * 0.36), bh = 54 * k;
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: r.x + (r.w - bw) / 2 - 8 * k, y: r.y + 8 * k + i * (bh + (r.h - 4 * bh - 16 * k) / 3), w: bw, h: bh }))
    : [{ x: r.x + r.w * 0.5 - bw - 40 * k, y: r.y + r.h * 0.18, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 40 * k, y: r.y + r.h * 0.18, w: bw, h: bh }, { x: r.x + r.w * 0.5 + 40 * k, y: r.y + r.h * 0.6, w: bw, h: bh }, { x: r.x + r.w * 0.5 - bw - 40 * k, y: r.y + r.h * 0.6, w: bw, h: bh }];
  const hot = Math.floor(S.clock / 1.1) % 4, on = fr(S, 'recap', 0.75, 0.85);
  pos.forEach((b, i) => { const a = fr(S, 'recap', 0.08 + i * 0.12, 0.16 + i * 0.12); if (a > 0.01) box(S, b, labels[i], { tone: tones[i], a, active: i === hot ? on : 0, size: fz(S, 14) }); });
  for (let i = 0; i < 3; i++) { const a = fr(S, 'recap', 0.14 + i * 0.12, 0.2 + i * 0.12); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
  const aLoop = fr(S, 'recap', 0.5, 0.6);
  if (aLoop > 0) {
    if (S.portrait) {
      const x1 = pos[3].x + pos[3].w, x2 = x1 + 16 * k, ya = pos[3].y + pos[3].h / 2, yb = pos[0].y + pos[0].h / 2;
      S.d.polyline([[x1, ya], [x2, ya], [x2, yb + (ya - yb) * (1 - aLoop)]], tone(S, 'ink').c, 2);
      if (aLoop > 0.98) S.d.arrow(x2, yb, x1 + 1, yb, tone(S, 'ink').c, 2, 8);
    } else link(S, pos[3], pos[0], { tone: 'ink', progress: aLoop });
  }
  if (!S.portrait) { const sc = Math.max(2, Math.round(2.8 * S.u)); neu(S, r.x + r.w / 2 - 12 * sc, r.y + r.h * 0.39, { scale: sc, mood: 'happy', a: fr(S, 'recap', 0.6, 0.7) }); }
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, k = kk(S), cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(6 * S.u));
  neu(S, cx - 12 * sc, cy - 18 * sc - 30 * k, { scale: sc, mood: 'happy', a: fr(S, 'bridge', 0.1, 0.25) });
  const a = fr(S, 'bridge', 0.5, 0.65);
  d.text(S.l('Siguiente', 'Next'), cx, cy + 6 * k, { size: fz(S, 13), weight: 700, color: p.mute, align: 'center', base: 'top', a });
  d.text(S.l('La neurona artificial', 'The artificial neuron'), cx, cy + 28 * k, { size: fz(S, 24), weight: 800, color: p.ink, align: 'center', base: 'top', a });
}
