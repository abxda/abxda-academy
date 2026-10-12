// Vista 2 (search … fuzzy): un buscador de videos como analogía. Lo que escribes es la consulta; el título y las
// etiquetas de cada video, su clave; el video, su valor. La atención no devuelve un solo video: mezcla todos.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { area, fitSize, fr, fz, isShort, kk, label, pct } from './ui';

interface Card { title: [string, string]; tags: [string, string]; match: number; icon: 'taco' | 'cat' | 'salsa' }
const CARDS: Card[] = [
  { title: ['Tacos fáciles en casa', 'Easy tacos at home'], tags: ['#tacos #receta', '#tacos #recipe'], match: 0.7, icon: 'taco' },
  { title: ['Mi gato duerme', 'My cat napping'], tags: ['#gatos', '#cats'], match: 0.05, icon: 'cat' },
  { title: ['Salsa para tacos', 'Salsa for tacos'], tags: ['#salsa #receta', '#salsa #recipe'], match: 0.25, icon: 'salsa' },
];

/** Un dibujo mínimo de lo que trae cada video (su contenido = su valor). */
function icon(S: Frame, kind: Card['icon'], r: Rect, a: number) {
  const { d, pal: p } = S, t = tone(S, 'dat'), cx = r.x + r.w / 2, cy = r.y + r.h / 2, s = Math.min(r.w, r.h) * 0.36;
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1), stroke: alpha(t.c, 0.5), lw: 1, r: 4 });
    if (kind === 'taco') {
      S.ctx.save(); S.ctx.beginPath(); S.ctx.arc(cx, cy + s * 0.45, s * 1.05, Math.PI, 0); S.ctx.closePath(); S.ctx.fillStyle = t.c; S.ctx.globalAlpha *= 0.85; S.ctx.fill(); S.ctx.restore();
      d.circle(cx - s * 0.4, cy - s * 0.05, s * 0.18, { fill: p.surface }); d.circle(cx + s * 0.2, cy - s * 0.2, s * 0.15, { fill: p.surface });
    } else if (kind === 'cat') {
      d.circle(cx, cy + s * 0.1, s * 0.75, { fill: t.c, a: 0.85 });
      d.polygon([[cx - s * 0.7, cy - s * 0.2], [cx - s * 0.55, cy - s * 0.95], [cx - s * 0.15, cy - s * 0.55]], { fill: t.c, a: 0.85 });
      d.polygon([[cx + s * 0.7, cy - s * 0.2], [cx + s * 0.55, cy - s * 0.95], [cx + s * 0.15, cy - s * 0.55]], { fill: t.c, a: 0.85 });
      d.line(cx - s * 0.35, cy, cx - s * 0.12, cy, p.surface, 2); d.line(cx + s * 0.12, cy, cx + s * 0.35, cy, p.surface, 2);
    } else {
      d.polygon([[cx - s, cy - s * 0.15], [cx + s, cy - s * 0.15], [cx + s * 0.6, cy + s * 0.75], [cx - s * 0.6, cy + s * 0.75]], { fill: t.c, a: 0.85 });
      d.circle(cx - s * 0.25, cy - s * 0.35, s * 0.2, { fill: t.c, a: 0.6 }); d.circle(cx + s * 0.2, cy - s * 0.45, s * 0.16, { fill: t.c, a: 0.6 });
    }
  });
}

export function drawSearch(S: Frame) {
  const { d, pal: p } = S, u = kk(S), R = area(S), P = S.portrait, sh = isShort(S);
  const sg = tone(S, 'sig'), wt = tone(S, 'w'), dt = tone(S, 'dat');
  const li = S.lang === 'es' ? 0 : 1;
  // ── buscador ──
  const query = S.l('receta de tacos', 'taco recipe');
  const bh = (sh ? 28 : 36) * u, bw = Math.min(R.w * (P ? 1 : 0.62), 440 * u), bx = R.x + (R.w - bw) / 2, by = R.y + (P ? 18 : sh ? 2 : 22) * S.u;
  const aBox = fr(S, 'search', 0.05, 0.2);
  d.withAlpha(aBox, () => {
    d.rect(bx, by, bw, bh, { fill: p.surface, stroke: p.line, lw: 1.5, r: bh / 2 });
    const r = bh * 0.22, mx = bx + bh * 0.55, my = by + bh / 2 - 1;
    d.circle(mx, my, r, { stroke: p.mute, lw: 2 }); d.line(mx + r * 0.7, my + r * 0.7, mx + r * 1.5, my + r * 1.5, p.mute, 2);
    const typed = Math.round(query.length * fr(S, 'search', 0.45, 0.7, 'lin'));
    const qs = fz(S, sh ? 14 : 16);
    d.text(query.slice(0, typed), bx + bh * 1.05, by + bh / 2 + 0.5, { size: qs, weight: 600, color: p.ink, base: 'middle' });
    if (typed > 0 && typed === query.length) d.rect(bx + bh * 0.95, by + 3, d.measure(query, { size: qs, weight: 600 }) + bh * 0.25, bh - 6, { fill: alpha(sg.c, 0.16), stroke: sg.c, lw: 1.5, r: (bh - 6) / 2, a: fr(S, 'search', 0.75, 0.85) });
  });
  const aQ = fr(S, 'search', 0.78, 0.9);
  label(S, S.l('consulta', 'query'), P ? bx + bw / 2 : bx + bw + 10 * S.u, P ? by + bh + 4 * S.u : by + bh / 2, { a: aQ, size: fz(S, 14), weight: 800, color: sg.ink, align: P ? 'center' : 'left', base: P ? 'top' : 'middle' });

  // ── tarjetas ──
  const top = by + bh + (P ? 30 : sh ? 10 : 26) * S.u;
  const mixH = (sh ? 34 : 54) * S.u, bottom = R.y + R.h - mixH - (sh ? 4 : 10) * S.u;
  const n = CARDS.length, gap = (P ? 8 : 14) * S.u;
  const rects: Rect[] = CARDS.map((_, i) => {
    if (P) { const h = (bottom - top - gap * (n - 1)) / n; return { x: R.x, y: top + i * (h + gap), w: R.w, h }; }
    const w = Math.min((R.w - gap * (n - 1)) / n, 250 * u), x0 = R.x + (R.w - (w * n + gap * (n - 1))) / 2;
    return { x: x0 + i * (w + gap), y: top, w, h: bottom - top };
  });
  const aCards = (i: number) => fr(S, 'key', 0.02 + i * 0.06, 0.14 + i * 0.06);
  const aKey = fr(S, 'key', 0.28, 0.4), aMatch = fr(S, 'key', 0.6, 0.85, 'io'), aVal = fr(S, 'value', 0.15, 0.3);
  const ts = fz(S, sh ? 12.5 : 14), gs = fz(S, sh ? 12 : 13);
  CARDS.forEach((c, i) => {
    const r = rects[i], a = aCards(i);
    if (a < 0.01) return;
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 6 });
      // contenido (valor), título y etiquetas (clave), qué tanto coincide
      let th: Rect, tx: number, tw: number, ty: number;
      if (P) { const s = r.h - 12 * S.u; th = { x: r.x + 6 * S.u, y: r.y + 6 * S.u, w: s * 1.2, h: s }; tx = th.x + th.w + 10 * S.u; tw = r.x + r.w - tx - 8 * S.u; ty = r.y + r.h * 0.26; }
      else { const ih = Math.max(24 * S.u, r.h - (sh ? 4.3 : 4.4) * ts * S.u - (sh ? 24 : 22) * S.u); th = { x: r.x + 8 * S.u, y: r.y + 8 * S.u, w: r.w - 16 * S.u, h: ih }; tx = r.x + 8 * S.u; tw = r.w - 16 * S.u; ty = th.y + th.h + (sh ? 7 : 10) * S.u + ts * S.u * 0.5; }
      icon(S, c.icon, th, 1);
      if (aVal > 0.01) { d.rect(th.x - 3, th.y - 3, th.w + 6, th.h + 6, { stroke: dt.c, lw: 2, r: 6, a: aVal }); }
      const title = c.title[li];
      d.text(title, tx, ty, { size: fitSize(S, title, tw, ts, 700), weight: 700, color: p.ink, base: 'middle' });
      const gy = ty + ts * S.u * 1.45, tagW = d.measure(c.tags[li], { size: gs, weight: 600 });
      if (aKey > 0.01) d.rect(tx - 3 * S.u, gy - gs * S.u * 0.75, Math.min(tagW, tw) + 6 * S.u, gs * S.u * 1.5, { fill: alpha(wt.c, 0.14), stroke: wt.c, lw: 1.5, r: 3, a: aKey });
      d.text(c.tags[li], tx, gy, { size: fitSize(S, c.tags[li], tw, gs), weight: 600, color: aKey > 0.5 ? wt.ink : p.ink2, base: 'middle' });
      // medidor de coincidencia
      if (aMatch > 0.01) {
        const my = P ? gy + gs * S.u * 1.5 : gy + gs * S.u * (sh ? 1.35 : 1.6), mw = Math.min(tw * 0.62, 120 * u), mh = 7 * S.u;
        if (my + mh <= r.y + r.h - 2) {
          d.rect(tx, my - mh / 2, mw, mh, { fill: p.surface2, r: 3 });
          d.rect(tx, my - mh / 2, mw * c.match * aMatch / 0.7, mh, { fill: sg.c, r: 3 });
          label(S, S.l('coincide', 'match'), tx + mw + 6 * S.u, my, { a: aMatch, size: fz(S, 12), color: sg.ink, weight: 700, align: 'left' });
        }
      }
    });
    if (i === 0) {
      const lx = P ? r.x + r.w - 6 * S.u : r.x + r.w / 2;
      label(S, S.l('clave', 'key'), lx, P ? r.y + r.h - 4 * S.u : r.y - 4 * S.u, { a: aKey * a, size: fz(S, 13), weight: 800, color: wt.ink, align: P ? 'right' : 'center', base: 'bottom' });
    }
    if (i === 1) {
      label(S, S.l('valor', 'value'), P ? r.x + r.w - 6 * S.u : r.x + r.w / 2, P ? r.y + r.h - 4 * S.u : r.y - 4 * S.u, { a: aVal * a, size: fz(S, 13), weight: 800, color: dt.ink, align: P ? 'right' : 'center', base: 'bottom' });
    }
  });

  // ── la mezcla ──
  const aMix = fr(S, 'fuzzy', 0.3, 0.45);
  if (aMix > 0.01) {
    const lw = d.measure(S.l('mezcla:', 'blend:'), { size: fz(S, 14), weight: 800 }) + 10 * S.u;
    const mx = R.x + (P ? 0 : R.w * 0.12), mw = R.w * (P ? 1 : 0.76) - lw, my = R.y + R.h - mixH * 0.62, mh = Math.min(26 * S.u, mixH * 0.5);
    label(S, S.l('mezcla:', 'blend:'), mx, my + mh / 2, { a: aMix, size: fz(S, 14), weight: 800, color: dt.ink, align: 'left' });
    let x = mx + lw;
    const grow = fr(S, 'fuzzy', 0.4, 0.8, 'io');
    CARDS.forEach((c, i) => {
      const w = mw * c.match * grow;
      if (w < 1) return;
      d.rect(x, my, w, mh, { fill: alpha(dt.c, 0.25 + 0.6 * clamp(c.match * 1.3)), stroke: S.pal.stage, lw: 2, r: 3, a: aMix });
      if (w > 34 * S.u) label(S, pct(S, c.match), x + w / 2, my + mh / 2, { a: aMix * grow, size: fz(S, 12), weight: 800, color: S.pal.ink, font: 'mono', halo: true });
      x += w; void i;
    });
  }
}
