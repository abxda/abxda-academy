// DPO, el atajo: el camino largo (preferencias → juez → práctica → modelo), el atajo directo, y la equivalencia exacta
// en el juguete: con las mismas cinco elecciones, RLHF con correa (presión 1) y DPO dan las mismas barras (toy.ts, state.ts).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { effective, st } from './state';
import { Q_REF, tilt } from './toy';
import { FS, TRAIT_KEYS, area, card, chip, fitText, fr, glyph, growArrow, para, pct, tight, traitName, traitTone } from './ui';

function headChip(S: Frame, r: Rect) {
  const a1 = 1 - fr(S, 'dpo-idea', 0, 0.12), a2 = fr(S, 'dpo-idea', 0.04, 0.16);
  const y = r.y + (FS(S, 13) * S.u + 10 * S.u) / 2;
  if (S.on('dpo-same')) { chip(S, S.l('Atajo · DPO', 'Shortcut · DPO'), r.x, y, 'ink', { align: 'left', size: 13 }); return; }
  chip(S, S.l('Pasos 2 y 3', 'Steps 2 and 3'), r.x, y, 'ink', { align: 'left', size: 13, a: a1 });
  chip(S, S.l('Atajo · DPO', 'Shortcut · DPO'), r.x, y, 'ink', { align: 'left', size: 13, a: a2 });
}

export function drawDpoPipe(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S), et = tone(S, 'err'), lt = tone(S, 'lat');
  headChip(S, r);
  const top = r.y + FS(S, 13) * u + 10 * u + 10 * u;
  const H = r.y + r.h - top, miniH = (cmp ? 54 : 74) * u;
  const names: { t: string; s: string; k: Tone }[] = [
    { t: S.l('Preferencias', 'Preferences'), s: S.l('parejas: mejor y peor', 'pairs: better and worse'), k: 'dat' },
    { t: S.l('Juez', 'Judge'), s: S.l('se entrena aparte', 'trained separately'), k: 'w' },
    { t: S.l('Práctica', 'Practice'), s: S.l('ciclo de refuerzo', 'reinforcement loop'), k: 'sig' },
    { t: S.l('Modelo', 'Model'), s: S.l('el asistente', 'the assistant'), k: 'lat' },
  ];
  const gap = (port ? 16 : 26) * u;
  const colW = port ? r.w * 0.62 : r.w;
  const bw = port ? colW : (r.w - 3 * gap) / 4, bh = port ? Math.min((H - miniH - 3 * gap - 10 * u) / 4, 52 * u) : Math.min((H - miniH) * 0.42, (cmp ? 64 : 92) * u);
  const y0 = port ? top : top + 8 * u;
  const box = (i: number): Rect => (port ? { x: r.x, y: y0 + i * (bh + gap), w: bw, h: bh } : { x: r.x + i * (bw + gap), y: y0, w: bw, h: bh });
  const kD = fr(S, 'dpo-idea', 0.22, 0.42, 'io');
  names.forEach((nm, i) => {
    const b = box(i), c = tone(S, nm.k), mid = i === 1 || i === 2;
    const a = fr(S, 'dpo-problem', 0.06 + i * 0.12, 0.16 + i * 0.12) * (mid ? 1 - 0.7 * kD : 1);
    const wob = mid && S.is('dpo-problem') ? Math.sin(S.clock * 10 + i) * 1.3 * u * fr(S, 'dpo-problem', 0.6, 0.7) : 0;
    d.withAlpha(a, () => {
      const bb = { x: b.x + wob, y: b.y, w: b.w, h: b.h };
      card(S, bb, { tone: nm.k, fill: alpha(c.c, 0.1), lw: 2, dash: kD > 0.5 && mid ? [5, 4] : undefined });
      if (port) {
        fitText(S, nm.t, bb.x + 10 * u, bb.y + bb.h * 0.36, bb.w * 0.5, 15, { weight: 800, color: c.ink, base: 'middle' });
        fitText(S, nm.s, bb.x + 10 * u, bb.y + bb.h * 0.72, bb.w - 20 * u, 12, { weight: 600, color: p.ink2, base: 'middle' });
      } else {
        fitText(S, nm.t, bb.x + bb.w / 2, bb.y + bb.h * 0.38, bb.w - 12 * u, 16, { weight: 800, color: c.ink, align: 'center', base: 'middle' });
        if (!cmp) fitText(S, nm.s, bb.x + bb.w / 2, bb.y + bb.h * 0.7, bb.w - 12 * u, 12, { weight: 600, color: p.ink2, align: 'center', base: 'middle' });
      }
    });
    if (i < 3) {
      const k = fr(S, 'dpo-problem', 0.14 + i * 0.12, 0.2 + i * 0.12), b2 = box(i + 1);
      d.withAlpha(1 - 0.7 * kD, () => {
        if (port) growArrow(S, b.x + b.w / 2, b.y + b.h + 3 * u, b.x + b.w / 2, b2.y - 3 * u, k, p.ink, 2.2);
        else growArrow(S, b.x + b.w + 3 * u, b.y + b.h / 2, b2.x - 3 * u, b.y + b.h / 2, k, p.ink, 2.2);
      });
    }
  });
  // lo delicado
  const b1 = box(1), b2 = box(2);
  d.withAlpha(fr(S, 'dpo-problem', 0.6, 0.72) * (1 - kD), () => {
    if (port) { const x = b1.x + b1.w + 10 * u; d.line(x, b1.y, x, b2.y + b2.h, et.c, 3); fitText(S, S.l('delicado', 'delicate'), x + 6 * u, (b1.y + b2.y + b2.h) / 2, r.x + r.w - x - 8 * u, 13, { weight: 800, color: et.ink, base: 'middle' }); }
    else { const y = b1.y + b1.h + 10 * u; d.line(b1.x, y, b2.x + b2.w, y, et.c, 3); fitText(S, S.l('muchas piezas · puede volverse inestable', 'many pieces · can become unstable'), (b1.x + b2.x + b2.w) / 2, y + 8 * u, b2.x + b2.w - b1.x, 13, { weight: 800, color: et.ink, align: 'center', base: 'top' }); }
  });
  // el atajo
  if (kD > 0) {
    const a = box(0), m = box(3);
    if (port) {
      const x = a.x + a.w + 20 * u, xr = Math.min(r.x + r.w - 30 * u, x + 40 * u);
      const pts: [number, number][] = [[a.x + a.w + 4 * u, a.y + a.h / 2], [xr, a.y + a.h / 2], [xr, m.y + m.h / 2], [m.x + m.w + 4 * u, m.y + m.h / 2]];
      drawPartial(S, pts, kD, lt.c);
      if (kD > 0.9) chip(S, 'DPO', xr + 4 * u, (a.y + m.y + m.h) / 2, 'lat', { align: 'left', size: 15 });
    } else {
      const yb = a.y + a.h + (cmp ? 30 : 46) * u;
      const pts: [number, number][] = [[a.x + a.w / 2, a.y + a.h + 4 * u], [a.x + a.w / 2, yb], [m.x + m.w / 2, yb], [m.x + m.w / 2, m.y + m.h + 4 * u]];
      drawPartial(S, pts, kD, lt.c);
      if (kD > 0.9) chip(S, S.l('DPO: directo, sin juez', 'DPO: direct, no judge'), (a.x + m.x + m.w) / 2, yb, 'lat', { size: 15 });
    }
  }
  // qué hace con cada pareja (ilustrativo)
  const aM = fr(S, 'dpo-idea', 0.55, 0.66), k = fr(S, 'dpo-idea', 0.66, 0.9, 'io');
  const M: Rect = { x: r.x, y: r.y + r.h - miniH, w: port ? r.w : Math.min(r.w, 640 * u), h: miniH };
  if (!port) M.x = r.x + (r.w - M.w) / 2;
  d.withAlpha(aM, () => {
    const rows: [string, number, number, Tone][] = [[S.l('preferida', 'preferred'), 0.3, 0.55, 'dat'], [S.l('rechazada', 'rejected'), 0.3, 0.1, 'err']];
    const rh = M.h / 2, lw = Math.max(...rows.map(([t]) => S.d.measure(t, { size: FS(S, 13), weight: 700 }))) + 16 * u;
    const pw = S.d.measure('↓ ' + S.l('probabilidad', 'probability'), { size: FS(S, 12), weight: 700 }) + 12 * u;
    rows.forEach(([t, v0, v1, tn], i) => {
      const y = M.y + i * rh + rh / 2, c = tone(S, tn), v = v0 + (v1 - v0) * k, bx = M.x + lw, bw = M.w - lw - pw;
      fitText(S, t, M.x, y, lw - 6 * u, 13, { weight: 700, color: c.ink, base: 'middle' });
      d.rect(bx, y - 6 * u, bw, 12 * u, { fill: p.surface2 });
      d.rect(bx, y - 6 * u, bw * v, 12 * u, { fill: c.c });
      d.line(bx + bw * v0, y - 9 * u, bx + bw * v0, y + 9 * u, p.ink, 2);
      d.text((i === 0 ? '↑ ' : '↓ ') + S.l('probabilidad', 'probability'), bx + bw + 6 * u, y, { size: FS(S, 12), weight: 700, color: c.ink, base: 'middle' });
    });
  });
}

function drawPartial(S: Frame, pts: [number, number][], k: number, color: string) {
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1])), tot = segs.reduce((a, b) => a + b, 0);
  let left = k * tot; const out: [number, number][] = [pts[0]];
  for (let i = 0; i < segs.length && left > 0; i++) { const f = Math.min(1, left / segs[i]); out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]); left -= segs[i]; }
  S.d.polyline(out, color, 3);
  if (k > 0.97) { const n = pts.length; S.d.arrow(pts[n - 2][0], pts[n - 2][1], pts[n - 1][0], pts[n - 1][1], color, 3, 10 * S.u); }
}

// ── las mismas barras por los dos caminos ──
export function drawDpoSame(S: Frame) {
  const { d, pal: p } = S, u = S.u, r = area(S), port = S.portrait, cmp = tight(S);
  headChip(S, r);
  const e = effective(st(S)), mR = tilt(1, e.w), mD = e.marg;
  const top = r.y + FS(S, 13) * u + 10 * u + 10 * u, foot = (port ? 66 : cmp ? 54 : 62) * u;
  const W = Math.min(r.w, 700 * u), X = r.x + (r.w - W) / 2, nameW = (port ? 100 : 124) * u, gap = 14 * u, colW = (W - nameW - gap) / 2;
  const head = (cmp ? 34 : 44) * u, rowH = Math.min(52 * u, (r.y + r.h - top - foot - head - 20 * u) / 4), y0 = top;
  const col = (i: number) => X + nameW + i * (colW + gap), bw = colW - 48 * u;
  const heads = [
    { t: S.l('RLHF con correa', 'RLHF on a leash'), s: S.l('juez + práctica (presión 1)', 'judge + practice (pressure 1)'), a: fr(S, 'dpo-same', 0.14, 0.24), m: mR, k: fr(S, 'dpo-same', 0.18, 0.34, 'io') },
    { t: 'DPO', s: S.l('directo, sin juez', 'direct, no judge'), a: fr(S, 'dpo-same', 0.3, 0.4), m: mD, k: fr(S, 'dpo-same', 0.34, 0.5, 'io') },
  ];
  d.withAlpha(fr(S, 'dpo-same', 0.02, 0.12), () => fitText(S, e.own ? S.l('con tus cinco elecciones del paso dos', 'with your five choices from step two') : S.l('con las cinco elecciones del ejemplo (paso dos)', 'with the example’s five choices (step two)'), X, y0, W, 13, { weight: 700, color: p.ink2, base: 'top' }));
  heads.forEach((h, i) => d.withAlpha(h.a, () => {
    fitText(S, h.t, col(i), y0 + 20 * u, colW, 16, { weight: 800, color: i ? tone(S, 'lat').ink : tone(S, 'sig').ink, base: 'top' });
    if (!cmp && d.measure(h.s, { size: FS(S, 12), weight: 600 }) <= colW - 4 * u) d.text(h.s, col(i), y0 + 40 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top' });
  }));
  TRAIT_KEYS.forEach((k, i) => {
    const cy = y0 + 20 * u + head + i * rowH + rowH / 2, c = tone(S, traitTone(k)), bh = Math.min(13 * u, rowH * 0.4);
    d.withAlpha(fr(S, 'dpo-same', 0.06, 0.16), () => { glyph(S, k, X + 8 * u, cy, 7.5 * u); fitText(S, traitName(S, k), X + 22 * u, cy, nameW - 24 * u, 14, { weight: 700, base: 'middle' }); });
    heads.forEach((h, j) => d.withAlpha(h.a, () => {
      const bx = col(j), v = Q_REF[i] + (h.m[i] - Q_REF[i]) * h.k;
      d.rect(bx, cy - bh / 2, bw, bh, { fill: p.surface2 });
      d.rect(bx, cy - bh / 2, bw * clamp(v), bh, { fill: c.c });
      d.line(bx + bw * Q_REF[i], cy - bh / 2 - 3 * u, bx + bw * Q_REF[i], cy + bh / 2 + 3 * u, p.ink, 2);
      d.text(pct(S, v), bx + bw + 6 * u, cy, { size: FS(S, 13), weight: 700, font: 'mono', color: c.ink, base: 'middle' });
    }));
  });
  const yb = y0 + 20 * u + head + 4 * rowH + 6 * u;
  d.withAlpha(fr(S, 'dpo-same', 0.5, 0.6), () => para(S, S.l('= los mismos números · │ = modelo de partida', '= the same numbers · │ = starting model'), port ? X : X + nameW, yb + 6 * u, port ? W : W - nameW, FS(S, 13), { weight: 800, maxLines: 2 }));
  const cy = r.y + r.h - (port ? 44 : 12) * u;
  d.withAlpha(fr(S, 'dpo-same', 0.68, 0.78), () => chip(S, S.l('Meta · Llama 3 (2024): DPO', 'Meta · Llama 3 (2024): DPO'), X, cy, 'lat', { align: 'left', size: 13, maxW: W }));
  d.withAlpha(fr(S, 'dpo-same', 0.84, 0.94), () => {
    const str = S.l('TinyLlama Chat: DPO', 'TinyLlama Chat: DPO');
    if (port) chip(S, str, X, cy + 30 * u, 'lat', { align: 'left', size: 13, maxW: W });
    else chip(S, str, X + d.measure(S.l('Meta · Llama 3 (2024): DPO', 'Meta · Llama 3 (2024): DPO'), { size: FS(S, 13), weight: 700 }) + 34 * u, cy, 'lat', { align: 'left', size: 13 });
  });
  void para;
}
