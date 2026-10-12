// Vistas 1 y 2: la conversación que «recuerda» y el modelo con sus pesos fijos.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CHAT } from './model';
import { FS, area, bubble, card, chip, fitText, fr, growArrow, modelBox, para, smooth, tight } from './ui';

// ── 1 · el chat ─────────────────────────────────────────────────────────────────────────────────────
/** Momento en que aparece cada globo (fracción de su segmento). */
const SHOW: [string, string, number][] = [
  ['U1', 'hook', 0.04], ['A1', 'hook', 0.3], ['U2', 'hook', 0.56], ['A2', 'hook', 0.74],
  ['U3', 'seems', 0.04], ['A3', 'seems', 0.3],
];

export function drawChat(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const W = Math.min(A.w, S.portrait ? A.w : 560 * u), x = A.x + (A.w - W) / 2;
  // tamaño de letra que hace caber los seis globos (sin bajar de 12 px)
  const tg = tight(S), gap = (tg ? 4 : 7) * u, head = (tg ? 22 : 34) * u, maxW = W * 0.78;
  let size = FS(S, S.portrait ? 15 : 17);
  const heights = () => CHAT.map((m) => bubble(S, m.text[S.lang], m.role, 0, 0, maxW, size, { measureOnly: true }));
  const room = A.h - head;
  while (size > FS(S, 12) && heights().reduce((a, b) => a + b + gap, 0) - gap > room) size -= 0.5;
  const hs = heights();
  // si ni así caben los seis, el chat se desplaza como uno real: se ven los más recientes
  const shown = CHAT.map((m, i) => fr(S, SHOW[i][1], SHOW[i][2], SHOW[i][2] + 0.1));
  let first = 0, tot = hs.reduce((a, b) => a + b + gap, 0) - gap;
  const lastShown = shown.reduce((k, a, i) => (a > 0.01 ? i : k), 0);
  while (tot > room && first < lastShown) { tot -= hs[first] + gap; first++; }
  const total = hs.slice(first).reduce((a, b) => a + b + gap, 0) - gap;
  const top = A.y + Math.max(0, (A.h - total - head) / 2);
  const frame: Rect = { x: x - 8 * u, y: top, w: W + 16 * u, h: Math.min(A.h, total + head) };
  card(S, frame, { fill: alpha(p.surface, 0.7) });
  fitText(S, S.l('chat', 'chat'), frame.x + 10 * u, frame.y + (tg ? 4 : 6) * u, frame.w - 20 * u, 12.5, { weight: 800, color: p.mute, base: 'top' });
  let y = frame.y + head - (tg ? 2 : 8) * u;
  const hot = fr(S, 'seems', 0.6, 0.8);
  CHAT.forEach((m, i) => {
    if (i < first) return;
    const a = shown[i];
    if (a > 0.01) {
      const yy = y + (1 - smooth(a)) * 8 * u;
      const h = (m.id === 'U1' || m.id === 'A3') ? hot : 0;
      // la persona escribe a la derecha; el modelo, a la izquierda
      bubble(S, m.text[S.lang], m.role, m.role === 'user' ? x + W - maxW : x, yy, maxW, size, { a, hot: h });
      if (m.id === 'A3' && hot > 0.05) chip(S, S.l('¿lo recuerda?', 'does it remember?'), x + W, yy + hs[i] / 2, 'err', { align: 'right', a: hot, size: 13 });
    }
    y += hs[i] + gap;
  });
  void d;
}

// ── 2 · el modelo ───────────────────────────────────────────────────────────────────────────────────
const CTX = { es: ['el', 'cielo', 'es'], en: ['the', 'sky', 'is'] };
const NEXT = { es: [['azul', 0.62], ['gris', 0.23], ['claro', 0.15]], en: [['blue', 0.62], ['gray', 0.23], ['clear', 0.15]] } as const;

export function drawModel(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), lt = tone(S, 'lat'), wt = tone(S, 'w');
  const tokSize = FS(S, 14);
  const tokW = (s: string) => d.measure(s, { size: tokSize, weight: 700 }) + 16 * u, tokH = tokSize * u + 12 * u;
  const ctx = CTX[S.lang], next = NEXT[S.lang];
  const chosen = next[0][0] as string;
  // geometría: entrada (tokens) → modelo → salida (barras). En vertical, de arriba abajo.
  let inR: Rect, mR: Rect, outR: Rect;
  if (S.portrait) {
    const h1 = tokH + 30 * u, hm = Math.min(150 * u, A.h * 0.36);
    inR = { x: A.x, y: A.y + 4 * u, w: A.w, h: h1 };
    mR = { x: A.x + A.w * 0.2, y: inR.y + h1 + 22 * u, w: A.w * 0.6, h: hm };
    outR = { x: A.x, y: mR.y + hm + 22 * u, w: A.w, h: A.y + A.h - (mR.y + hm + 22 * u) };
  } else {
    const wIn = A.w * 0.3, wM = A.w * 0.26;
    inR = { x: A.x, y: A.y, w: wIn, h: A.h };
    mR = { x: A.x + wIn + A.w * 0.06, y: A.y + A.h * 0.18, w: wM, h: A.h * 0.5 };
    outR = { x: mR.x + wM + A.w * 0.06, y: A.y, w: A.x + A.w - (mR.x + wM + A.w * 0.06), h: A.h };
  }
  const lockA = fr(S, 'frozen', 0.08, 0.25);
  const puzzle = fr(S, 'puzzle', 0.05, 0.25);
  modelBox(S, mR, { locked: lockA, hot: 0.12 });

  // entrada: los tokens del contexto (y el que se agrega al final: autorregresión)
  const inA = 1 - puzzle;
  const app = fr(S, 'model', 0.75, 0.92);
  const items = [...ctx, ...(app > 0.01 ? [chosen] : [])];
  const totalW = items.reduce((a, s) => a + tokW(s) + 6 * u, -6 * u);
  const cy = S.portrait ? inR.y + inR.h - tokH - 4 * u : mR.y + mR.h / 2 - tokH / 2;
  let tx = S.portrait ? inR.x + (inR.w - totalW) / 2 : inR.x + Math.max(0, inR.w - totalW - 8 * u);
  d.withAlpha(inA, () => {
    fitText(S, S.l('contexto', 'context'), S.portrait ? inR.x + inR.w / 2 : tx, cy - 10 * u, inR.w, 13, { weight: 800, color: lt.ink, base: 'bottom', align: S.portrait ? 'center' : 'left' });
    items.forEach((s, i) => {
      const a = i < ctx.length ? fr(S, 'model', 0.04 + i * 0.07, 0.14 + i * 0.07) : app;
      const w = tokW(s);
      d.rect(tx, cy, w, tokH, { fill: alpha(lt.c, i === ctx.length ? 0.4 : 0.16), stroke: lt.c, lw: 1.5, r: 3, a });
      d.text(s, tx + w / 2, cy + tokH / 2, { size: tokSize, weight: 700, color: lt.ink, align: 'center', base: 'middle', a });
      tx += w + 6 * u;
    });
  });
  // flecha de entrada
  const ar = fr(S, 'model', 0.28, 0.4);
  if (S.portrait) growArrow(S, mR.x + mR.w / 2, cy + tokH + 4 * u, mR.x + mR.w / 2, mR.y - 4 * u, ar * inA, p.ink2);
  else growArrow(S, inR.x + inR.w + 4 * u, mR.y + mR.h / 2, mR.x - 4 * u, mR.y + mR.h / 2, ar * inA, p.ink2);

  // salida: probabilidades del token siguiente (ilustrativas)
  const ba = fr(S, 'model', 0.42, 0.6) * (1 - puzzle);
  if (ba > 0.01) {
    if (S.portrait) growArrow(S, mR.x + mR.w / 2, mR.y + mR.h + 4 * u, mR.x + mR.w / 2, outR.y + 2 * u, ba, p.ink2);
    else growArrow(S, mR.x + mR.w + 4 * u, mR.y + mR.h / 2, outR.x - 4 * u, mR.y + mR.h / 2, ba, p.ink2);
    const bx = S.portrait ? outR.x + outR.w * 0.12 : outR.x + 4 * u, bw = S.portrait ? outR.w * 0.76 : outR.w - 8 * u;
    const rowH = Math.min(30 * u, (S.portrait ? outR.h - 24 * u : A.h * 0.5) / 3.6);
    const by0 = S.portrait ? outR.y + 22 * u : mR.y + mR.h / 2 - rowH * 1.9;
    d.withAlpha(ba, () => {
      fitText(S, S.l('¿qué token sigue?', 'which token comes next?'), bx, by0 - 6 * u, bw, 13, { weight: 800, color: p.ink2, base: 'bottom' });
      const lw = Math.max(...next.map(([s]) => d.measure(s as string, { size: FS(S, 13), weight: 700 }))) + 8 * u;
      next.forEach(([s, v], i) => {
        const y = by0 + i * rowH, barW = (bw - lw - 46 * u) * (v as number) * smooth(clamp(ba * 1.4 - i * 0.15));
        d.text(s as string, bx + lw - 6 * u, y + rowH / 2, { size: FS(S, 13), weight: 700, color: i === 0 ? p.ink : p.ink2, align: 'right', base: 'middle' });
        d.rect(bx + lw, y + rowH * 0.2, barW, rowH * 0.6, { fill: i === 0 ? lt.c : alpha(lt.c, 0.45) });
        d.text(S.n((v as number) * 100, 0) + ' %', bx + lw + barW + 6 * u, y + rowH / 2, { size: FS(S, 12), font: 'mono', weight: 700, color: p.ink2, base: 'middle' });
      });
      fitText(S, S.l('ilustrativo', 'illustrative'), bx, by0 + 3 * rowH + 6 * u, bw, 12, { weight: 600, italic: true, color: p.mute, base: 'top' });
    });
  }

  // pesos fijos: contador
  if (lockA > 0.01) {
    const ra = fr(S, 'frozen', 0.4, 0.6) * (1 - puzzle);
    if (ra > 0.01) {
      // en vertical, la cifra va como pastilla sobre el borde de abajo de la caja (abajo están las barras)
      if (S.portrait) chip(S, S.l('pesos que cambian: 0', 'weights that change: 0'), mR.x + mR.w / 2, mR.y + mR.h, 'w', { a: ra, size: 13, solid: true, maxW: A.w });
      else para(S, S.l('pesos que cambian al conversar: 0', 'weights that change while you chat: 0'), mR.x - 30 * u, mR.y + mR.h + 14 * u, mR.w + 60 * u, FS(S, 13), { weight: 800, color: wt.ink, align: 'center', a: ra });
    }
  }

  // la pregunta: ¿dónde quedó «Ana»?
  if (puzzle > 0.01) {
    const ax = S.portrait ? mR.x + mR.w / 2 : inR.x + inR.w * 0.6, ay = S.portrait ? inR.y + inR.h * 0.45 : mR.y + mR.h / 2;
    const q = fr(S, 'puzzle', 0.35, 0.55);
    chip(S, '«Ana»', ax, ay, 'sig', { a: puzzle, size: 15 });
    if (q > 0.01) {
      d.withAlpha(q, () => {
        if (S.portrait) d.line(ax, ay + 14 * u, ax, mR.y - 4 * u, p.ink2, 1.6, [4, 4]);
        else d.line(ax + 34 * u, ay, mR.x - 4 * u, ay, p.ink2, 1.6, [4, 4]);
        const qx = S.portrait ? mR.x + mR.w + 10 * u : mR.x + mR.w + 16 * u, qy = mR.y + mR.h / 2;
        const qr = 18 * u;
        if (qx + qr * 2 < A.x + A.w) {
          d.circle(qx + qr, qy, qr, { fill: alpha(tone(S, 'err').c, 0.12), stroke: tone(S, 'err').c, lw: 2 });
          d.text('?', qx + qr, qy + 1, { size: FS(S, 22), weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'middle' });
        }
        const lab = S.l('¿dónde quedó tu nombre?', 'where did your name go?');
        const ly = S.portrait ? mR.y + mR.h + 14 * u : mR.y + mR.h + 14 * u;
        para(S, lab, S.portrait ? A.x : mR.x - 40 * u, ly, S.portrait ? A.w : mR.w + 80 * u, FS(S, 14), { weight: 800, color: tone(S, 'err').ink, align: 'center' });
      });
    }
  }
}
