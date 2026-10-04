// Vistas de la lección que no son la gráfica de correos: el diagrama programar/aprender, la tarjeta de Samuel,
// la tabla entrenar/usar, el resumen, el «cuándo conviene» y el puente. Los tiempos son fracciones del segmento (fr).
import { SPRITES, alpha, clamp, hash, lerp, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { TRAIN } from './data';
import { fr, fz, kk, mark } from './helpers';

type Kind = 'rules' | 'data' | 'answers';
const TONE: Record<Kind, Tone> = { rules: 'w', data: 'dat', answers: 'sig' };

// ── diagrama: reglas + datos → respuestas  /  datos + respuestas → reglas ──
function slotsOf(S: Frame) {
  const W = S.W, H = S.H, k = kk(S), m = (S.portrait ? 26 : 16) * k;
  if (!S.portrait) {
    const pw = clamp(W * 0.25, 138, 250), ph = clamp(H * 0.5, 130, 210), gap = (W - 3 * pw) / 4, y = H * 0.5 - ph / 2 + 4 * k;
    const s: Rect[] = [0, 1, 2].map((i) => ({ x: gap + i * (pw + gap), y, w: pw, h: ph }));
    return { s, plus: [s[0].x + pw + gap / 2, y + ph / 2] as [number, number], arrow: [s[1].x + pw + gap * 0.12, y + ph / 2, s[2].x - gap * 0.12, y + ph / 2] as [number, number, number, number], capY: y + ph + 44 * k };
  }
  const pw = (W - 3 * m) / 2, ph = clamp(H * 0.25, 104, 150), y0 = 44 * k, y1 = y0 + ph + 70 * k;
  const s: Rect[] = [{ x: m, y: y0, w: pw, h: ph }, { x: 2 * m + pw, y: y0, w: pw, h: ph }, { x: (W - pw) / 2, y: y1, w: pw, h: ph }];
  return { s, plus: [W / 2, y0 + ph / 2] as [number, number], arrow: [W / 2, y0 + ph + 8 * k, W / 2, y1 - 8 * k] as [number, number, number, number], capY: y1 + ph + 26 * k };
}

function panel(S: Frame, r: Rect, kind: Kind, a: number, o: { hand?: { a: number; b: number }; unknown?: number; many?: number; bars?: number; count?: number } = {}) {
  const { d, pal: p } = S, k = kk(S), t = tone(S, TONE[kind]);
  const title = kind === 'rules' ? S.l('Reglas', 'Rules') : kind === 'data' ? S.l('Datos', 'Data') : S.l('Respuestas', 'Answers');
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.stage, r: 4 });   // fondo opaco: al intercambiarse, un panel pasa por detrás de otro
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.08), stroke: t.c, lw: 2, r: 4 });
    d.text(title, r.x + 10 * k, r.y + 8 * k, { size: fz(S, 14), weight: 800, color: t.ink, base: 'top' });
    const body: Rect = { x: r.x + 10 * k, y: r.y + 32 * k, w: r.w - 20 * k, h: r.h - 40 * k };
    if (kind === 'rules') {
      const unk = o.unknown ?? 0, many = o.many ?? 0;
      if (o.hand && unk < 1) {
        const txt = S.l(`si enlaces ≥ ${o.hand.a} o mayúsculas ≥ ${o.hand.b} % → spam`, `if links ≥ ${o.hand.a} or capitals ≥ ${o.hand.b}% → spam`);
        d.text(txt, body.x, body.y, { size: fz(S, 13), weight: 700, font: 'mono', color: p.ink, w: body.w, base: 'top', a: (1 - unk) * (1 - many) });
      }
      if (many > 0) {
        const rows = Math.max(1, Math.floor(body.h / (11 * k))), n = Math.min(rows, Math.ceil((o.bars ?? 1) * rows));
        for (let i = 0; i < n; i++) d.rect(body.x, body.y + 2 * k + i * 11 * k, body.w * (0.35 + 0.6 * hash(i, 9)), 5 * k, { fill: alpha(t.c, 0.4), a: many });
        d.text('?', r.x + r.w - 14 * k, r.y + 8 * k, { size: fz(S, 18), weight: 800, color: tone(S, 'err').ink, align: 'right', base: 'top', a: many });
      }
      if (unk > 0) d.text('?', body.x + body.w / 2, body.y + body.h / 2, { size: fz(S, 40), weight: 800, font: 'mono', color: t.ink, align: 'center', base: 'middle', a: unk });
    } else if (kind === 'data') {
      const many = o.many ?? 0;
      d.withAlpha(1 - many, () => TRAIN.slice(0, 16).forEach((pt, i) => d.circle(body.x + 4 + ((pt.l + (hash(i, 3) - 0.5) * 0.8) / 10.5) * (body.w - 8), body.y + body.h - 4 - (pt.c / 42) * (body.h - 8), 3 * k, { fill: alpha(p.ink2, 0.7) })));
      if (many > 0) {
        const n = o.count ?? 1000, cs = clamp(Math.sqrt((body.w * body.h) / n) - 1, 1.6, 11 * k), cols = Math.max(1, Math.floor(body.w / (cs + 1)));
        d.clip(body.x, body.y, body.w, body.h, () => d.withAlpha(many, () => { for (let i = 0; i < n; i++) d.rect(body.x + (i % cols) * (cs + 1), body.y + Math.floor(i / cols) * (cs + 1), cs, cs, { fill: alpha(t.c, 0.75) }); }));
      }
    } else {
      const rowH = Math.min(30 * k, body.h / 2);
      ([[1, 'spam'], [0, S.l('normal', 'legit')]] as [0 | 1, string][]).forEach(([c, w], i) => {
        mark(S, body.x + 10 * k, body.y + rowH * i + rowH / 2, c, { r: 5.5 });
        d.text(w, body.x + 28 * k, body.y + rowH * i + rowH / 2, { size: fz(S, 14), weight: 700, color: p.ink, base: 'middle' });
      });
    }
  });
}

export function drawDiagram(S: Frame, hand: { a: number; b: number }) {
  const { d, pal: p } = S, k = kk(S), G = slotsOf(S);
  const fl = fr(S, 'flip', 0.08, 0.4, 'io'), flT = fr(S, 'flip', 0.05, 0.2, 'io');
  const pos = (kind: Kind): Rect => {
    const pi = { rules: 0, data: 1, answers: 2 }[kind], li = { data: 0, answers: 1, rules: 2 }[kind];
    return { x: lerp(G.s[pi].x, G.s[li].x, fl), y: lerp(G.s[pi].y, G.s[li].y, fl), w: G.s[pi].w, h: G.s[pi].h };
  };
  const aRules = fr(S, 'programming', 0.33, 0.43), aData = fr(S, 'programming', 0.56, 0.66), aAns = fr(S, 'programming', 0.78, 0.88);
  const hcN = fr(S, 'hand-cost', 0.5, 0.88, 'io'), hcOn = fr(S, 'hand-cost', 0.45, 0.52) * (1 - S.at('flip', 0, 0.8));
  const count = Math.round(lerp(2, 1000, hcN * hcN));
  const unk = fr(S, 'flip', 0.7, 0.85);
  panel(S, pos('rules'), 'rules', aRules, { hand, many: hcOn, bars: hcN, unknown: unk });
  panel(S, pos('data'), 'data', aData, { many: hcOn, count });
  panel(S, pos('answers'), 'answers', aAns);
  // operadores
  d.text('+', G.plus[0], G.plus[1], { size: 28, weight: 800, color: p.ink2, align: 'center', base: 'middle', a: fr(S, 'programming', 0.58, 0.66) });
  d.arrow(G.arrow[0], G.arrow[1], G.arrow[2], G.arrow[3], p.ink2, 3, 11, fr(S, 'programming', 0.78, 0.86));
  // contador de medidas
  if (hcOn > 0.02) {
    const dp = pos('data'), txt = count >= 1000 ? S.l('1 000 medidas', '1,000 measures') : S.l(`${count} medidas`, `${count} measures`);
    d.text(txt, dp.x + dp.w / 2, dp.y + dp.h + 8 * k, { size: fz(S, 14), weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'top', a: hcOn });
  }
  // título y fórmula
  d.text(S.l('PROGRAMAR', 'PROGRAMMING'), S.W / 2, 14 * k, { size: fz(S, 17), weight: 800, color: p.ink, align: 'center', base: 'top', a: fr(S, 'programming', 0.02, 0.1) * (1 - flT) });
  d.text(S.l('APRENDER', 'LEARNING'), S.W / 2, 14 * k, { size: fz(S, 17), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'top', a: flT });
  d.text(S.l('reglas + datos → respuestas', 'rules + data → answers'), S.W / 2, G.capY, { size: fz(S, 14), weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top', a: fr(S, 'programming', 0.9, 0.97) * (1 - flT) });
  d.text(S.l('datos + respuestas → reglas', 'data + answers → rules'), S.W / 2, G.capY, { size: fz(S, 14), weight: 700, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'top', a: flT * fr(S, 'flip', 0.5, 0.6) });
}

// ── tarjeta de Arthur Samuel ──
export function drawSamuel(S: Frame) {
  const { d, pal: p } = S, k = kk(S), W = S.W, H = S.H;
  const top = 58 * k;   // espacio del encabezado con el término
  const cs = S.portrait ? Math.min(32 * k, (W - 60 * k) / 8, (H - top - 215 * k) / 8) : Math.min(44 * k, (H - top - 40 * k) / 8);
  const bx = S.portrait ? (W - cs * 8) / 2 : W * 0.5 - cs * 8 - 28 * k, by = top + (S.portrait ? 6 * k : (H - top - cs * 8) / 2);
  // el término
  d.text(S.l('aprendizaje automático', 'machine learning'), W / 2, 14 * k, { size: fz(S, 22), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'top', a: fr(S, 'samuel', 0.04, 0.12) });
  if (S.lang === 'es') d.text('machine learning', W / 2, 14 * k + 28 * k, { size: fz(S, 13), weight: 600, font: 'mono', color: p.mute, align: 'center', base: 'top', a: fr(S, 'samuel', 0.12, 0.2) });
  // el tablero de damas
  d.withAlpha(fr(S, 'samuel', 0.74, 0.84), () => {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const dark = (r + c) % 2 === 1;
      d.rect(bx + c * cs, by + r * cs, cs, cs, { fill: dark ? alpha(p.ink, p.dark ? 0.32 : 0.22) : alpha(p.ink, 0.04) });
      if (dark && (r < 3 || r > 4)) d.circle(bx + c * cs + cs / 2, by + r * cs + cs / 2, cs * 0.34, { fill: r < 3 ? tone(S, 'err').c : p.ink, stroke: p.stage, lw: 1.5 });
    }
    d.rect(bx - 0.5, by - 0.5, cs * 8 + 1, cs * 8 + 1, { stroke: p.lineStrong, lw: 1.5 });
  });
  const tx = S.portrait ? 24 * k : W * 0.5 + 8 * k, ty = S.portrait ? by + cs * 8 + 16 * k : by, tw = S.portrait ? W - 48 * k : W * 0.5 - 28 * k;
  d.text('Arthur L. Samuel', tx, ty, { size: fz(S, 21), weight: 800, color: p.ink, base: 'top', a: fr(S, 'samuel', 0.4, 0.5) });
  d.text('1959', tx, ty + 30 * k, { size: fz(S, 40), weight: 700, font: 'pixel', color: tone(S, 'w').ink, base: 'top', a: fr(S, 'samuel', 0.6, 0.7) });
  d.text(S.l('IBM · damas', 'IBM · checkers'), tx, ty + 82 * k, { size: fz(S, 15), weight: 700, color: p.ink2, base: 'top', a: fr(S, 'samuel', 0.76, 0.84) });
  d.text('Some Studies in Machine Learning Using the Game of Checkers', tx, ty + 110 * k, { size: fz(S, 14), weight: 600, italic: true, color: p.ink2, w: tw, base: 'top', a: fr(S, 'samuel', 0.86, 0.94) });
  d.text('IBM Journal of Research and Development, 1959', tx, ty + 110 * k + (S.portrait ? 36 : 58) * k, { size: fz(S, 13), weight: 600, color: p.mute, w: tw, base: 'top', a: fr(S, 'samuel', 0.9, 0.97) });
}

// ── tabla entrenar / usar ──
export function drawTvu(S: Frame) {
  const { d, pal: p } = S, k = kk(S), W = S.W, H = S.H;
  const rows: [string, string, string, number][] = [
    [S.l('Entrada', 'Input'), S.l('ejemplos con respuesta', 'examples with answers'), S.l('un caso nuevo', 'one new case'), 0.14],
    [S.l('Parámetros', 'Parameters'), S.l('cambian', 'change'), S.l('fijos', 'frozen'), 0.22],
    [S.l('Costo por vez', 'Cost each time'), S.l('alto', 'high'), S.l('bajo', 'low'), 0.4],
    [S.l('Frecuencia', 'How often'), S.l('pocas veces', 'rarely'), S.l('sin parar', 'nonstop'), 0.62],
  ];
  const mx = (S.portrait ? 12 : 40) * k, tw = W - 2 * mx, lw = tw * (S.portrait ? 0.27 : 0.2), cw = (tw - lw) / 2, rh = clamp((H - 90 * k) / 5, 38 * k, 62 * k), y0 = (H - rh * 5) / 2 + 6 * k;
  const heads: [string, Tone, number, number][] = [[S.l('Entrenar', 'Train'), 'w', 0, 0.04], [S.l('Usar (inferencia)', 'Use (inference)'), 'sig', 1, 0.1]];
  heads.forEach(([txt, tn, i, at]) => {
    const t = tone(S, tn), a = fr(S, 'train-vs-use', at, at + 0.08);
    d.withAlpha(a, () => { d.rect(mx + lw + i * cw + 3 * k, y0, cw - 6 * k, rh - 6 * k, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 2, r: 3 }); d.text(txt, mx + lw + i * cw + cw / 2, y0 + (rh - 6 * k) / 2, { size: fz(S, 18), weight: 800, color: t.ink, align: 'center', base: 'middle', w: cw - 14 * k }); });
  });
  rows.forEach(([nm, a1, a2, at], i) => {
    const y = y0 + (i + 1) * rh, a = fr(S, 'train-vs-use', at, at + 0.08);
    d.withAlpha(a, () => {
      d.line(mx, y - 3 * k, mx + tw, y - 3 * k, p.line, 1);
      d.text(nm, mx + 4 * k, y + (rh - 6 * k) / 2, { size: fz(S, 14), weight: 700, color: p.mute, base: 'middle', w: lw - 8 * k });
      d.text(a1, mx + lw + cw / 2, y + (rh - 6 * k) / 2, { size: fz(S, 17), weight: 700, color: p.ink, align: 'center', base: 'middle', w: cw - 14 * k });
      d.text(a2, mx + lw + cw + cw / 2, y + (rh - 6 * k) / 2, { size: fz(S, 17), weight: 700, color: p.ink, align: 'center', base: 'middle', w: cw - 14 * k });
    });
  });
}

// ── resumen ──
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, k = kk(S), W = S.W, H = S.H;
  const items: [string, string, Tone, number][] = [
    [S.l('Programar', 'Programming'), S.l('reglas + datos → respuestas', 'rules + data → answers'), 'ink', 0.12],
    [S.l('Aprender', 'Learning'), S.l('datos + respuestas → reglas', 'data + answers → rules'), 'w', 0.42],
    [S.l('Generalizar', 'Generalizing'), S.l('acertar con lo que nunca vio', 'getting right what it never saw'), 'dat', 0.7],
  ];
  const bw = Math.min(W - 32 * k, 560 * k), bh = clamp((H - 60 * k) / 3.4, 54 * k, 86 * k), gap = 14 * k, y0 = (H - (3 * bh + 2 * gap)) / 2;
  items.forEach(([t, sub, tn, at], i) => {
    const a = fr(S, 'recap', at, at + 0.08), t2 = tone(S, tn);
    d.withAlpha(a, () => {
      const x = (W - bw) / 2, y = y0 + i * (bh + gap);
      d.rect(x, y, bw, bh, { fill: alpha(tn === 'ink' ? p.ink : t2.c, 0.08), stroke: tn === 'ink' ? p.lineStrong : t2.c, lw: 2, r: 4 });
      d.text(t, x + 16 * k, y + bh * 0.3, { size: fz(S, 18), weight: 800, color: t2.ink, base: 'middle' });
      d.text(sub, x + 16 * k, y + bh * 0.68, { size: fz(S, 14), weight: 700, font: 'mono', color: p.ink2, base: 'middle', w: bw - 32 * k });
    });
  });
}

// ── cuándo conviene aprender ──
export function drawWhen(S: Frame) {
  const { d, pal: p } = S, k = kk(S), W = S.W, H = S.H;
  const cols: { head: string; ex: string; tn: Tone; items: string[]; at: number[] }[] = [
    { head: S.l('Aprender de datos', 'Learn from data'), ex: S.l('ej.: detectar spam', 'e.g. spotting spam'), tn: 'w', items: [S.l('reglas difíciles de escribir', 'hard-to-write rules'), S.l('muchos ejemplos con respuesta', 'many labeled examples'), S.l('algún error es tolerable', 'some errors tolerable')], at: [0.04, 0.22, 0.42, 0.6] },
    { head: S.l('Escribir la regla', 'Write the rule'), ex: S.l('ej.: calcular un impuesto', 'e.g. computing a tax'), tn: 'ink', items: [S.l('regla clara y exacta', 'clear, exact rule'), S.l('pocos datos disponibles', 'little data available'), S.l('ningún error es tolerable', 'no errors tolerable')], at: [0.76, 0.8, 0.86, 0.92] },
  ];
  const portrait = S.portrait, mx = 14 * k, gap = 14 * k;
  const cw = portrait ? W - 2 * mx : (W - 2 * mx - gap) / 2, rowH = (portrait ? 34 : 46) * k, headH = 62 * k;
  const ch = Math.min(headH + 3 * rowH + 16 * k, portrait ? (H - 2 * mx - gap) / 2 : H - 2 * mx);
  const total = portrait ? 2 * ch + gap : ch, y00 = (H - total) / 2;
  cols.forEach((c, i) => {
    const x = portrait ? mx : mx + i * (cw + gap), y = portrait ? y00 + i * (ch + gap) : y00, t = tone(S, c.tn), a0 = fr(S, 'when', c.at[0], c.at[0] + 0.07);
    d.withAlpha(a0, () => {
      d.rect(x, y, cw, ch, { fill: alpha(c.tn === 'ink' ? p.ink : t.c, 0.06), stroke: c.tn === 'ink' ? p.lineStrong : t.c, lw: 2, r: 4 });
      d.text(c.head, x + 14 * k, y + 12 * k, { size: fz(S, 18), weight: 800, color: t.ink, base: 'top', w: cw - 28 * k });
      d.text(c.ex, x + 14 * k, y + 12 * k + 27 * k, { size: fz(S, 13), weight: 600, color: p.mute, base: 'top', w: cw - 28 * k });
    });
    c.items.forEach((it, j) => {
      const a = fr(S, 'when', c.at[j + 1], c.at[j + 1] + 0.07), iy = y + headH + j * rowH + 4 * k;
      d.withAlpha(a, () => {
        d.rect(x + 14 * k, iy, 18 * k, 18 * k, { stroke: c.tn === 'ink' ? p.ink2 : t.c, lw: 2 });
        d.line(x + 18 * k, iy + 9 * k, x + 22 * k, iy + 14 * k, c.tn === 'ink' ? p.ink : t.c, 2.5); d.line(x + 22 * k, iy + 14 * k, x + 29 * k, iy + 4 * k, c.tn === 'ink' ? p.ink : t.c, 2.5);
        d.text(it, x + 42 * k, iy + 9 * k, { size: fz(S, 15), weight: 700, color: p.ink, base: 'middle', w: cw - 56 * k });
      });
    });
  });
}

// ── puente: una imagen es una cuadrícula de números (0 = negro, 255 = blanco, como en la lección siguiente) ──
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, k = kk(S), W = S.W, H = S.H;
  const rows = SPRITES.smile, n = rows.length, cs = Math.min(((S.portrait ? W - 40 * k : H - 110 * k)) / n, 34 * k);
  const x0 = (W - n * cs) / 2, y0 = S.portrait ? 18 * k : 16 * k;
  const aImg = fr(S, 'bridge', 0.03, 0.12), aNum = fr(S, 'bridge', 0.42, 0.66, 'io');
  const white = p.dark ? p.ink : p.stage, black = p.dark ? p.stage : p.ink;   // el brillo real: 0 negro, 255 blanco, en claro y en oscuro
  d.withAlpha(aImg, () => {
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      const on = ch === '1';
      d.rect(x0 + c * cs, y0 + r * cs, cs, cs, { fill: on ? white : black, stroke: alpha(p.mute, 0.7 * aNum) });
      d.text(on ? '255' : '0', x0 + c * cs + cs / 2, y0 + r * cs + cs / 2, { size: fz(S, 12), weight: 700, font: 'mono', color: on ? black : white, align: 'center', base: 'middle', a: aNum });
    }));
    d.rect(x0 - 0.5, y0 - 0.5, n * cs + 1, n * cs + 1, { stroke: p.lineStrong, lw: 1.5 });
  });
  const by = y0 + n * cs + 22 * k;
  d.text(S.l('Siguiente', 'Next'), W / 2, by, { size: fz(S, 13), weight: 700, color: p.mute, align: 'center', base: 'top', a: fr(S, 'bridge', 0.76, 0.84) });
  d.text(S.l('El mundo hecho de números', 'The world as numbers'), W / 2, by + 22 * k, { size: fz(S, 22), weight: 800, align: 'center', base: 'top', w: W - 32 * k, a: fr(S, 'bridge', 0.8, 0.9) });
  if (!S.portrait) neu(S, W - 90 * k, H - 90 * k, { scale: 3, mood: 'happy', a: fr(S, 'bridge', 0.88, 0.96) });
}
