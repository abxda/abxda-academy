// Vista 1 · el caso de Nueva York (hook, hook-six, ask, define).
// Fuente: Mata v. Avianca, Inc., 22-cv-1461 (PKC), S.D.N.Y., Opinión y orden sobre sanciones (22 de junio de 2023):
// ¶7 la otra parte «no pudo localizar la mayoría» de los casos citados; ¶36 los seis casos los generó ChatGPT y no existen;
// ¶45 ChatGPT respondió que eran «reales» y que estaban en Westlaw y LexisNexis (capturas del apéndice B: aquí, paráfrasis rotulada);
// multa de 5 000 dólares, solidaria, a los dos abogados y a su despacho.
import { clamp, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, LH, area, card, chip, fitText, fr, mark, para, paraH, smooth, stamp, tight } from './ui';

/** Los seis casos que el tribunal declaró inexistentes, con su cita tal como aparece en el escrito. */
const CASES: [string, string, string][] = [
  ['Varghese v. China Southern Airlines', '925 F.3d 1339 (2019)', 'Varghese v. China Southern'],
  ['Shaboon v. Egyptair', '2013 IL App (1st) 111279-U', 'Shaboon v. Egyptair'],
  ['Petersen v. Iran Air', '905 F. Supp. 2d 121 (2012)', 'Petersen v. Iran Air'],
  ['Martinez v. Delta Airlines', '2019 WL 4639462', 'Martinez v. Delta'],
  ['Estate of Durden v. KLM', '2017 WL 2418825', 'Durden v. KLM'],
  ['Miller v. United Airlines', '174 F.3d 366 (1999)', 'Miller v. United'],
];

export function drawCase(S: Frame) {
  const A = area(S), u = S.u;
  const toAsk = smooth(fr(S, 'ask', 0, 0.12)), toDef = smooth(fr(S, 'define', 0, 0.1));
  const live = 1 - toDef;
  if (live > 0.01) S.d.withAlpha(live, () => {
    if (S.portrait) {
      // teléfono: el escrito ocupa todo; en «ask» se pliega a una franja y deja sitio al chat
      const hc = Math.max(74 * u, LH(S, FS(S, 13), 1.4) * 3.2);
      const full = A, small: Rect = { x: A.x, y: A.y, w: A.w, h: hc };
      const r: Rect = { x: A.x, y: A.y, w: A.w, h: lerp(full.h, small.h, toAsk) };
      if (toAsk < 0.98) S.d.withAlpha(1 - toAsk, () => drawDoc(S, r));
      if (toAsk > 0.02) S.d.withAlpha(toAsk, () => drawCompact(S, r));
      if (toAsk > 0.01) drawChat(S, { x: A.x, y: A.y + hc + 12 * u, w: A.w, h: A.h - hc - 12 * u }, toAsk);
    } else {
      const w0 = Math.min(A.w * 0.66, 560 * u), w1 = Math.min(A.w * 0.48, 440 * u);
      const w = lerp(w0, w1, toAsk), x = lerp(A.x + (A.w - w0) / 2, A.x, toAsk);
      drawDoc(S, { x, y: A.y, w, h: A.h });
      if (toAsk > 0.01) { const cx = x + w + 18 * u; drawChat(S, { x: cx, y: A.y, w: A.x + A.w - cx, h: A.h }, toAsk); }
    }
  });
  if (toDef > 0.01) S.d.withAlpha(toDef, () => drawDefinition(S, A));
}

/** El escrito: encabezado, los seis casos citados, las dudas de la otra parte y, en «hook-six», cada caso tachado. */
function drawDoc(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u, pad = 12 * u;
  card(S, r, { fill: p.surface });
  const tsz = FS(S, 14);
  fitText(S, S.l('Escrito presentado al tribunal', 'Brief filed with the court'), r.x + pad, r.y + pad + LH(S, tsz, 0.5), r.w - 2 * pad, 14, { weight: 800 });
  fitText(S, S.l('Nueva York · 2023 · «jurisprudencia citada:»', 'New York · 2023 · “case law cited:”'), r.x + pad, r.y + pad + LH(S, tsz, 1.75), r.w - 2 * pad, 12.5, { weight: 600, color: p.mute });
  const y0 = r.y + pad + LH(S, tsz, 2.6), rowsH = r.y + r.h - pad - y0;
  const sz = FS(S, 13), room = rowsH - 92 * u, twoLine = room / CASES.length > LH(S, sz, 2.4) && r.w > 300 * u;
  const rh = Math.max(LH(S, sz, 1.5), Math.min(Math.max(room, rowsH * 0.6) / CASES.length, twoLine ? LH(S, sz, 2.9) : LH(S, sz, 1.9)));
  const appear = (i: number) => fr(S, 'hook', 0.08 + i * 0.07, 0.16 + i * 0.07);
  const doubt = (i: number) => fr(S, 'hook', 0.62 + i * 0.04, 0.7 + i * 0.04);
  const cross = (i: number) => fr(S, 'hook-six', 0.06 + i * 0.07, 0.14 + i * 0.07);
  const markW = 26 * u, textW = r.w - 2 * pad - markW;
  const useShort = d.measure(CASES[0][0], { size: sz, weight: 700 }) > textW;
  CASES.forEach(([name, cite, short], i) => {
    const a = appear(i); if (a <= 0.01) return;
    const y = y0 + i * rh, cy = y + rh / 2, gone = cross(i);
    d.withAlpha(a, () => {
      const nm = useShort ? short : name;
      const ny = twoLine ? cy - LH(S, sz, 0.45) : cy;
      fitText(S, nm, r.x + pad, ny, textW, 13, { weight: 700, color: gone > 0.5 ? p.mute : p.ink });
      if (twoLine) fitText(S, cite, r.x + pad, cy + LH(S, sz, 0.5), textW, 12, { weight: 600, font: 'mono', color: p.mute });
      if (gone > 0) {
        const lw = Math.min(textW, d.measure(nm, { size: fitSizeLocal(S, nm, textW, sz), weight: 700 }));
        d.line(r.x + pad, ny, r.x + pad + lw * smooth(gone), ny, tone(S, 'err').c, 2);
        mark(S, r.x + r.w - pad - 8 * u, cy, false, 6, smooth(gone));
      } else {
        const q = doubt(i);
        if (q > 0.01) d.text('?', r.x + r.w - pad - 8 * u, cy, { size: FS(S, 16), weight: 800, color: tone(S, 'sig').ink, align: 'center', base: 'middle', a: q });
      }
    });
  });
  // «no las encontramos» de la otra parte (hook) y el sello (hook-six)
  if (!S.on('hook-six')) {
    const q = fr(S, 'hook', 0.7, 0.85);
    if (q > 0.01 && r.h > 200 * u) chip(S, S.l('la otra parte: «no las encontramos»', 'the other side: “we can’t find them”'), r.x + r.w - pad, r.y + r.h - pad - 10 * u, 'sig', { align: 'right', a: q, size: 12, maxW: r.w - 2 * pad });
  }
  // sello y autoría: debajo de la lista si hay sitio; si no, encima, a la derecha
  const listEnd = y0 + CASES.length * rh, free = r.y + r.h - pad - listEnd;
  const sy = free > 84 * u ? listEnd + free * 0.38 : y0 + rowsH * 0.42, sx = free > 84 * u ? r.x + r.w / 2 : r.x + r.w * 0.6;
  const st = fr(S, 'hook-six', 0.55, 0.68);
  if (st > 0.01) stamp(S, S.l('NO EXISTEN', 'THEY DO NOT EXIST'), sx, sy, 'err', { pop: st, size: 20, maxW: r.w * 0.8 });
  const by = fr(S, 'hook-six', 0.72, 0.84);
  if (by > 0.01) chip(S, S.l('los escribió ChatGPT', 'written by ChatGPT'), sx, sy + 40 * u, 'err', { a: by, size: 14, maxW: r.w - 2 * pad });
}
const fitSizeLocal = (S: Frame, s: string, w: number, size: number) => { let z = size; while (z > FS(S, 12) && S.d.measure(s, { size: z, weight: 700 }) > w) z -= 0.5; return z; };

/** Versión plegada del escrito (teléfono, desde «ask»). */
function drawCompact(S: Frame, r: Rect) {
  const { pal: p } = S, u = S.u, pad = 12 * u, sz = FS(S, 13);
  card(S, r, { fill: p.surface });
  fitText(S, S.l('Escrito presentado al tribunal · 2023', 'Brief filed with the court · 2023'), r.x + pad, r.y + pad + LH(S, sz, 0.5), r.w - 2 * pad, 13, { weight: 800 });
  const y = r.y + r.h - pad - LH(S, sz, 0.6);
  mark(S, r.x + pad + 6 * u, y, false, 6);
  fitText(S, S.l('6 casos citados: ninguno existe', '6 cases cited: none exists'), r.x + pad + 22 * u, y, r.w - 2 * pad - 22 * u, 13.5, { weight: 800, color: tone(S, 'err').ink });
}

/** Burbuja de chat (pregunta a la derecha, respuesta a la izquierda). Devuelve su alto. */
function bubble(S: Frame, str: string, x: number, y: number, w: number, who: 'user' | 'bot', tag: string, a: number) {
  const { d, pal: p } = S, u = S.u, sz = FS(S, 14), pad = 9 * u, t = tone(S, who === 'user' ? 'sig' : 'lat');
  const tagH = LH(S, FS(S, 12), 1.25), h = pad * 2 + tagH + paraH(S, str, w - 2 * pad, sz);
  d.withAlpha(a, () => {
    d.rect(x, y, w, h, { fill: t.soft, stroke: t.c, lw: 1.4, r: 6 });
    fitText(S, tag, x + pad, y + pad + tagH / 2 - 1, w - 2 * pad, 12, { weight: 700, color: t.ink });
    para(S, str, x + pad, y + pad + tagH, w - 2 * pad, sz, { weight: 600 });
  });
  return h;
}

function drawChat(S: Frame, r: Rect, a: number) {
  const { pal: p } = S, u = S.u, bw = Math.min(r.w, 340 * u);
  const a1 = fr(S, 'ask', 0.12, 0.22), a2 = fr(S, 'ask', 0.4, 0.5), a3 = fr(S, 'ask', 0.62, 0.74);
  S.d.withAlpha(a, () => {
    const q = S.l('¿Es real el caso Varghese?', 'Is Varghese a real case?');
    const h1 = bubble(S, q, r.x + r.w - bw, r.y, bw, 'user', S.l('el abogado', 'the lawyer'), a1);
    const ans = S.l('Sí, es un caso real. Se puede encontrar en Westlaw y LexisNexis.', 'Yes, it is a real case. It can be found on Westlaw and LexisNexis.');
    const y2 = r.y + h1 + 10 * u;
    const h2 = bubble(S, ans, r.x, y2, bw, 'bot', 'ChatGPT', a2);
    const ny = y2 + h2 + 8 * u;
    if (r.y + r.h - ny > LH(S, FS(S, 12), 2.4)) para(S, S.l('Paráfrasis de lo que consta en la sentencia. El caso no existe.', 'Paraphrase of what the ruling records. The case does not exist.'), r.x, ny, bw, FS(S, 12), { color: p.mute, italic: true, a: a3, maxLines: 2 });
  });
}

/** Multa y definición: alucinación = fluida + segura + falsa o sin respaldo. */
function drawDefinition(S: Frame, A: Rect) {
  const { pal: p } = S, u = S.u, cx = A.x + A.w / 2, small = tight(S);
  const fine = fr(S, 'define', 0.05, 0.2), word = fr(S, 'define', 0.42, 0.56);
  const y0 = A.y + A.h * (S.portrait ? 0.1 : 0.12);
  stamp(S, S.l(`MULTA: ${S.n(5000, 0)} DÓLARES`, `FINE: $${S.n(5000, 0)}`), cx, y0 + 12 * u, 'ink', { pop: fine, size: small ? 16 : 19, angle: -0.05 });
  const wy = y0 + (small ? 44 : 64) * u;
  S.d.withAlpha(word, () => {
    S.d.text(S.l('Alucinación', 'Hallucination'), cx, wy, { size: FS(S, small ? 26 : 36), weight: 800, align: 'center', base: 'top' });
  });
  const chips: [string, 'sig' | 'w' | 'err', number][] = [[S.l('fluida', 'fluent'), 'sig', 0.55], [S.l('segura', 'confident'), 'w', 0.65], [S.l('falsa o sin respaldo', 'false or unsupported'), 'err', 0.75]];
  const cy = wy + FS(S, small ? 26 : 36) * u * 1.25 + (small ? 18 : 30) * u, gap = 10 * u;
  const ws = chips.map(([t]) => S.d.measure(t, { size: FS(S, small ? 15 : 17), weight: 800 }) + 24 * u);
  const row = ws.reduce((s, w) => s + w, 0) + gap * 2 + 2 * S.d.measure('+', { size: FS(S, 16), weight: 800 }) + 4 * gap;
  if (row <= A.w) {
    let x = cx - row / 2;
    chips.forEach(([t, tn, at], i) => {
      const a = fr(S, 'define', at, at + 0.1);
      chip(S, t, x, cy, tn, { align: 'left', a, size: small ? 15 : 17, weight: 800 });
      x += ws[i] + gap;
      if (i < 2) { S.d.text('+', x + gap / 2, cy, { size: FS(S, 16), weight: 800, color: p.mute, align: 'center', base: 'middle', a }); x += S.d.measure('+', { size: FS(S, 16), weight: 800 }) + 2 * gap; }
    });
  } else {
    const ch = 30 * u + FS(S, 15) * u * 0.4;
    chips.forEach(([t, tn, at], i) => chip(S, t, cx, cy + i * (ch + 4 * u), tn, { a: fr(S, 'define', at, at + 0.1), size: 15, weight: 800, maxW: A.w }));
  }
  void clamp;
}
