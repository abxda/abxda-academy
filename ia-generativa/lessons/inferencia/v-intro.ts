// Vistas de entrada: el chat que responde (hook), entrenar frente a usar (inference) y servir a muchas personas (serving).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { WORDS, area, fitText, fr, fz, lg, lh, note, para, paraH, roomy } from './ui';

// ── el chat ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function drawChat(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), W = WORDS[lg(S)];
  const rk = roomy(S), cw = Math.min(R.w, 600 * u * rk), x0 = R.x + (R.w - cw) / 2, size = 15 * rk, pad = 12 * u * rk;
  const bw = cw * (S.portrait ? 0.86 : 0.74);
  // mensaje de la persona (derecha)
  const h1 = paraH(S, W.full, bw - 2 * pad, size) + 2 * pad;
  const h2 = paraH(S, W.reply, bw - 2 * pad, size) + 2 * pad;
  const total = h1 + 22 * u + h2;
  const y1 = R.y + Math.max(10 * u, (R.h - total) / 2 - 10 * u), y2 = y1 + h1 + 22 * u;
  const a1 = fr(S, 'hook', 0.02, 0.12);
  d.withAlpha(a1, () => {
    d.rect(x0 + cw - bw, y1, bw, h1, { fill: alpha(tone(S, 'lat').c, 0.12), stroke: tone(S, 'lat').c, lw: 1.3, r: 8 });
    para(S, W.full, x0 + cw - bw + pad, y1 + pad, bw - 2 * pad, { size, color: p.ink });
    fitText(S, S.l('tú', 'you'), x0 + cw - 4 * u, y1 - 6 * u, 80 * u, { size: 12, weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  // respuesta que aparece palabra por palabra
  const words = W.reply.split(' '), k = fr(S, 'hook', 0.26, 0.92, 'lin');
  const n = Math.floor(k * words.length + 1e-6);
  const a2 = fr(S, 'hook', 0.2, 0.26);
  d.withAlpha(a2, () => {
    d.rect(x0, y2, bw, h2, { fill: p.surface, stroke: p.lineStrong, lw: 1.3, r: 8 });
    fitText(S, S.l('modelo', 'model'), x0 + 4 * u, y2 - 6 * u, 120 * u, { size: 12, weight: 700, color: p.mute, base: 'bottom' });
    // las palabras ya escritas se dibujan con el mismo ajuste de línea que el texto completo (nada se mueve)
    const sz = fz(S, size), lines = d.wrap(W.reply, bw - 2 * pad, { size: sz, weight: 600 });
    let left = n, yy = y2 + pad;
    for (const ln of lines) {
      const ws = ln.split(' '), show = ws.slice(0, Math.max(0, left)).join(' ');
      left -= ws.length;
      if (show) d.text(show, x0 + pad, yy, { size: sz, weight: 600, color: p.ink, base: 'top' });
      if (left < 0 || (left === 0 && n < words.length)) {
        if (n < words.length) { const cx = x0 + pad + (show ? d.measure(show + ' ', { size: sz, weight: 600 }) : 0); if ((S.clock * 2) % 1 < 0.6) d.rect(cx, yy + 2 * u, 2 * u, sz * u, { fill: p.ink }); }
        break;
      }
      yy += sz * u * 1.25;
    }
  });
}

// ── entrenar frente a usar ───────────────────────────────────────────────────────────────────────────────────────
export function drawTrainUse(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S);
  const P = S.portrait, gap = 18 * u;
  const cw = P ? Math.min(R.w, 380 * u) : Math.min((R.w - gap) / 2, 330 * u), ch = P ? Math.min(118 * u, (R.h - gap) / 2 - 10 * u) : Math.min(150 * u, R.h * 0.5);
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
  const boxes: [Rect, string, string, 'w' | 'dat', number][] = [
    [P ? { x: cx - cw / 2, y: cy - gap / 2 - ch, w: cw, h: ch } : { x: cx - gap / 2 - cw, y: cy - ch / 2, w: cw, h: ch },
      S.l('Entrenar', 'Training'), S.l('una vez, durante meses: ajusta los pesos', 'once, over months: it adjusts the weights'), 'w', fr(S, 'inference', 0.05, 0.2)],
    [P ? { x: cx - cw / 2, y: cy + gap / 2, w: cw, h: ch } : { x: cx + gap / 2, y: cy - ch / 2, w: cw, h: ch },
      S.l('Usar: inferencia', 'Using: inference'), S.l('en cada pregunta, con los pesos fijos', 'on every question, with the weights fixed'), 'dat', fr(S, 'inference', 0.3, 0.45)],
  ];
  boxes.forEach(([r, t, sub, tn, a], i) => {
    const c = tone(S, tn), hot = i === 1 ? fr(S, 'inference', 0.6, 0.75) : 0;
    d.withAlpha(a, () => {
      d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.08 + 0.1 * hot), stroke: c.c, lw: 1.5 + hot, r: 5 });
      fitText(S, t, r.x + r.w / 2, r.y + r.h * 0.36, r.w - 20 * u, { size: 20, weight: 800, color: c.ink, align: 'center', base: 'middle' });
      const sw = r.w - 24 * u, sh = paraH(S, sub, sw, 13);
      para(S, sub, r.x + r.w / 2, r.y + r.h * 0.62 - sh / 2 + 4 * u, sw, { size: 13, align: 'center' });
    });
  });
}

// ── servir el modelo ─────────────────────────────────────────────────────────────────────────────────────────────
function person(S: Frame, x: number, y: number, r: number, a: number, c: string) {
  S.d.withAlpha(a, () => {
    S.d.circle(x, y - r * 0.9, r * 0.55, { fill: c });
    S.d.rect(x - r * 0.85, y - r * 0.15, r * 1.7, r * 1.15, { fill: c, r: r * 0.6 });
  });
}
export function drawServing(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait;
  const gpu: Rect = P ? { x: R.x + R.w / 2 - Math.min(R.w * 0.42, 150 * u), y: R.y + R.h * 0.62, w: Math.min(R.w * 0.84, 300 * u), h: Math.min(84 * u, R.h * 0.22) }
    : { x: R.x + R.w * 0.6, y: R.y + R.h / 2 - Math.min(60 * u, R.h * 0.2), w: Math.min(R.w * 0.36, 280 * u), h: Math.min(120 * u, R.h * 0.4) };
  // personas: una cuadrícula que se llena poco a poco
  const cols = P ? 6 : 4, rows = 4, n = cols * rows;
  const zone: Rect = P ? { x: R.x, y: R.y + 4 * u, w: R.w, h: R.h * 0.44 } : { x: R.x, y: R.y + R.h * 0.12, w: R.w * 0.42, h: R.h * 0.76 };
  const sx = zone.w / cols, sy = zone.h / rows, r = Math.max(7, Math.min(sx, sy) * 0.24);
  const ink = alpha(p.ink2, 0.75), lat = tone(S, 'lat').c;
  for (let i = 0; i < n; i++) {
    const cx = zone.x + sx * (i % cols + 0.5), cy = zone.y + sy * (Math.floor(i / cols) + 0.55);
    const a = fr(S, 'serving', 0.05 + 0.4 * (i / n), 0.1 + 0.4 * (i / n));
    if (a <= 0.01) continue;
    person(S, cx, cy, r, a, ink);
    // su pregunta viaja hacia la GPU
    const k = fr(S, 'serving', 0.5 + 0.2 * ((i * 7) % n) / n, 0.68 + 0.2 * ((i * 7) % n) / n, 'io');
    if (k > 0 && k < 1) {
      const tx = P ? gpu.x + gpu.w / 2 : gpu.x, ty = P ? gpu.y : gpu.y + gpu.h / 2;
      const x = cx + (tx - cx) * k, y = cy + (ty - cy) * k;
      d.withAlpha(a * (1 - k * 0.4), () => d.rect(x - 4 * u, y - 3 * u, 8 * u, 6 * u, { fill: lat, r: 1.5 }));
    }
  }
  const ga = fr(S, 'serving', 0.0, 0.12);
  d.withAlpha(ga, () => {
    const c = tone(S, 'dat');
    d.rect(gpu.x, gpu.y, gpu.w, gpu.h, { fill: alpha(c.c, 0.1), stroke: c.c, lw: 1.8, r: 5 });
    fitText(S, S.l('una GPU con el modelo', 'one GPU with the model'), gpu.x + gpu.w / 2, gpu.y + gpu.h * 0.38, gpu.w - 16 * u, { size: 16, weight: 800, color: c.ink, align: 'center', base: 'middle' });
    fitText(S, S.l('pesos fijos', 'fixed weights'), gpu.x + gpu.w / 2, gpu.y + gpu.h * 0.7, gpu.w - 16 * u, { size: 13, weight: 600, color: p.ink2, align: 'center', base: 'middle' });
  });
  const la = fr(S, 'serving', 0.72, 0.85);
  const ly = gpu.y + gpu.h + 14 * u, ncx = gpu.x + gpu.w / 2, nw = P ? R.w : Math.min(2 * (R.x + R.w - ncx), 2 * (ncx - R.x));
  note(S, S.l('servir el modelo: muchas personas a la vez', 'serving the model: many people at once'), ncx, ly, nw, 'dat', { a: la, size: 13.5 });
  void lh; void clamp;
}
