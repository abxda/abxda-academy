// Vistas 1 y 2: el problema del tren, una pasada por token, y los 32 intentos sin pensar.
import { alpha, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { area, chip, chipH, fitText, flat, fr, fz, K, mark, note, noteH } from './ui';
import { attempts, bounds, hitsLabel, modelBox, track, trackH } from './parts';
import { answers, hits, N_TRIES, type L2 } from './runs';

const lg = (S: Frame) => S.lang as L2;

// ═════════ 1 · el problema, la pregunta, una pasada por token ═════════
export function drawProblem(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = area(S), P = S.portrait, F = flat(S), k = K(S);
  // encabezado: la pregunta de la lección
  const headH = fz(S, 13 * k) * u * 1.4;
  fitText(S, S.l('¿Puede un modelo pensar antes de responder?', 'Can a model think before it answers?'), R.x, R.y, R.w, { size: 13 * k, weight: 700, color: p.mute, base: 'top', a: fr(S, 'hook', 0.02, 0.15) });
  const tH = trackH(S);
  const tr: Rect = { x: R.x, y: R.y + headH + (F ? 2 : 10) * u, w: R.w, h: tH };
  track(S, tr, { start: fr(S, 'hook', 0.55, 0.72), stop1: fr(S, 'train', 0.04, 0.24), stop2: fr(S, 'train', 0.5, 0.7), end: fr(S, 'ask', 0.02, 0.16) });

  // abajo: lo que le pedimos → el modelo → sus tokens
  const askA = fr(S, 'ask', 0.52, 0.68), modA = fr(S, 'ask', 0.3, 0.46);
  if (askA <= 0.01 && modA <= 0.01) return;
  const lowY = tr.y + tH + (F ? 6 : 16) * u, lowH = R.y + R.h - lowY;
  const req = S.l('«Responde solo con el número final.»', '“Reply with only the final number.”');
  const capS = 12.5 * k, capH = fz(S, capS) * u * 1.4;
  const lab = (i: number) => S.l(`pasada ${i + 1}`, `pass ${i + 1}`);
  const tokW = Math.max(52 * u * k, S.d.measure(lab(2), { size: fz(S, 12 * k), weight: 600 }) + 8 * u), gap = 10 * u;
  const tokH = Math.min(tokW, 58 * u * k);
  const rowW = 3 * tokW + 2 * gap;
  let reqR: Rect, modR: Rect, tx0: number, ty: number;
  if (P) {
    const nh = noteH(S, req, R.w * 0.92, 13);
    const modW = Math.min(R.w - rowW - 30 * u, 120 * u), modH = Math.max(tokH + 10 * u, 56 * u);
    const blockH = fz(S, 12) * u * 1.3 + nh + 26 * u + modH + 8 * u + 2 * capH;
    const y0 = lowY + Math.max(0, (lowH - blockH) / 2);
    reqR = { x: R.x + R.w * 0.04, y: y0 + fz(S, 12) * u * 1.3, w: R.w * 0.92, h: nh };
    modR = { x: R.x, y: reqR.y + nh + 26 * u, w: modW, h: modH };
    tx0 = modR.x + modR.w + 26 * u; ty = modR.y + modR.h / 2 - tokH / 2;
  } else {
    const bw = Math.min(R.w * 0.28, 280 * u * k), nh = noteH(S, req, bw, 13 * k);
    const modW = Math.min(150 * u * k, R.w * 0.17), modH = Math.max(tokH + 12 * u, 64 * u * k);
    const blockH = Math.max(modH, tokH) + 8 * u + 2 * capH;
    const cy = lowY + Math.max(modH / 2, (lowH - blockH) / 2 + modH / 2);
    reqR = { x: R.x, y: cy - nh / 2, w: bw, h: nh };
    modR = { x: R.x + bw + 36 * u, y: cy - modH / 2, w: modW, h: modH };
    tx0 = modR.x + modR.w + 34 * u; ty = cy - tokH / 2;
  }
  d.withAlpha(askA, () => {
    fitText(S, S.l('le pedimos:', 'we asked:'), reqR.x, reqR.y - 4 * u, reqR.w, { size: 12 * k, weight: 700, color: p.mute, base: 'bottom' });
    note(S, req, reqR.x + reqR.w / 2, reqR.y, reqR.w, 'ink', { size: 13 * (P ? 1 : k) });
  });
  const pulse = S.is('one-pass') ? 0.3 * Math.sin(S.clock * 3) ** 2 : 0;
  modelBox(S, modR, { a: modA, sub: S.l('de lenguaje', 'language'), active: pulse });
  // flecha de la petición al modelo
  d.withAlpha(askA * modA, () => {
    if (P) d.arrow(modR.x + modR.w / 2, reqR.y + reqR.h + 3 * u, modR.x + modR.w / 2, modR.y - 4 * u, p.lineStrong, 1.6, 7 * u);
    else d.arrow(reqR.x + reqR.w + 6 * u, modR.y + modR.h / 2, modR.x - 6 * u, modR.y + modR.h / 2, p.lineStrong, 1.6, 7 * u);
  });

  // los tres tokens de la respuesta, uno por pasada (respuesta real del primer intento)
  if (!S.on('one-pass')) return;
  const digits = String(answers(lg(S), 0)[0] ?? '').split('');
  const lat = tone(S, 'lat'), w = tone(S, 'w');
  digits.forEach((ch, i) => {
    const t0 = 0.26 + 0.15 * i, a = fr(S, 'one-pass', t0 + 0.06, t0 + 0.14);
    const x = tx0 + i * (tokW + gap);
    // un pulso viaja del modelo a la casilla: la pasada
    const pf = fr(S, 'one-pass', t0, t0 + 0.08, 'lin');
    if (pf > 0 && pf < 1) d.circle(modR.x + modR.w + (x + tokW / 2 - modR.x - modR.w) * pf, ty + tokH / 2, 4.5 * u, { fill: w.c });
    if (a <= 0.01) return;
    d.withAlpha(a, () => {
      d.rect(x, ty, tokW, tokH, { fill: alpha(lat.c, 0.16), stroke: lat.c, lw: 1.5, r: 3 });
      fitText(S, ch, x + tokW / 2, ty + tokH / 2 + 0.5, tokW - 6 * u, { size: 22 * k, weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
      fitText(S, lab(i), x + tokW / 2, ty + tokH + 5 * u, tokW + gap - 2 * u, { size: 12 * k, weight: 600, color: p.mute, align: 'center', base: 'top' });
    });
  });
  const endX = tx0 + rowW;
  const capY = ty + tokH + 5 * u + fz(S, 12 * k) * u * 1.3 + 6 * u;
  const capW = P ? R.x + R.w - tx0 : Math.max(rowW + 80 * u, R.x + R.w - tx0);
  fitText(S, S.l('cada cifra es un token', 'each digit is a token'), tx0, capY, capW, { size: capS, weight: 700, color: lat.ink, base: 'top', a: fr(S, 'one-pass', 0.8, 0.92) * (1 - fr(S, 'instant', 0.05, 0.2)) });
  // instant: solo tres pasadas, sin pasos escritos; y falló
  if (S.on('instant')) {
    const a = fr(S, 'instant', 0.12, 0.28);
    d.withAlpha(a, () => {
      const by = ty - 8 * u;
      d.line(tx0, by, endX, by, w.c, 2); d.line(tx0, by - 4 * u, tx0, by + 4 * u, w.c, 2); d.line(endX, by - 4 * u, endX, by + 4 * u, w.c, 2);
    });
    fitText(S, S.l('3 pasadas, sin pasos escritos', '3 passes, no written steps'), tx0, capY, capW, { size: capS, weight: 700, color: w.ink, base: 'top', a: fr(S, 'instant', 0.3, 0.45) });
    const e = fr(S, 'instant', 0.82, 0.94), err = tone(S, 'err');
    d.withAlpha(e, () => {
      if (P) {
        const yy = capY + capH + 6 * u;
        mark(S, tx0 + 7 * u, yy + 7 * u, false, 6 * u, err.c, 2.6);
        fitText(S, S.l('falló', 'wrong'), tx0 + 20 * u, yy + 7 * u, 100 * u, { size: 14, weight: 800, color: err.ink, base: 'middle' });
      } else {
        const mx = endX + 24 * u;
        mark(S, mx, ty + tokH / 2, false, 8 * u * k, err.c, 3);
        fitText(S, S.l('falló', 'wrong'), mx + 16 * u * k, ty + tokH / 2, Math.max(60 * u, R.x + R.w - mx - 16 * u * k), { size: 15 * k, weight: 800, color: err.ink, base: 'middle' });
      }
    });
  }
}

// ═════════ 2 · treinta y dos intentos, sin pensar ═════════
export function drawTries(S: Frame) {
  const { pal: p } = S, u = S.u, R = area(S), k = K(S);
  // el problema, en una tira compacta (la vía de antes, encogida)
  const stripH = 30 * u;
  track(S, { x: R.x, y: R.y, w: Math.min(R.w, 520 * u), h: stripH }, { start: 1, stop1: 1, stop2: 1, end: 1, result: fr(S, 'count0', 0.05, 0.2) });
  // quién responde
  const infoY = R.y + stripH + 8 * u;
  const info = S.l('Qwen3.5-4B · 4 mil millones de parámetros · abierto', 'Qwen3.5-4B · 4 billion parameters · open');
  fitText(S, info, R.x, infoY, R.w, { size: 13 * k, weight: 700, color: p.ink2, base: 'top', a: fr(S, 'tries', 0.05, 0.25) });
  const tag = S.l('32 intentos · sin pensar', '32 tries · no thinking');
  const tagY = infoY + fz(S, 13 * k) * u * 1.35 + 4 * u;
  chip(S, tag, R.x, tagY + chipH(S, 12.5 * k) / 2, 'ink', { size: 12.5 * k, align: 'left', a: fr(S, 'tries', 0.5, 0.65) });
  // la cuadrícula y, justo debajo, los aciertos
  const gy = tagY + chipH(S, 12.5 * k) + 10 * u, readH = fz(S, 15 * k) * u * 1.8;
  const gr: Rect = { x: R.x, y: gy, w: R.w, h: R.y + R.h - gy - readH };
  const cells = attempts(S, gr, answers(lg(S), 0), { appear: fr(S, 'tries', 0.5, 0.95, 'lin'), fill: fr(S, 'sampling', 0.45, 0.95, 'lin'), marks: fr(S, 'count0', 0.35, 0.55) });
  const b = bounds(cells);
  hitsLabel(S, b.x, b.y + b.h + readH / 2 + 2 * u, b.w, hits(lg(S), 0), N_TRIES, { a: fr(S, 'count0', 0.6, 0.75) });
}
