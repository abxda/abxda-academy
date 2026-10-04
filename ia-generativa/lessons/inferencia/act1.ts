// Acto 1 · Las dos fases de una respuesta: el chat, «entrenar vs servir», el recorrido prefill → decode y su duración real.
import { alpha, clamp, hash, lerp, split, token, tokenRow, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { A100, H100, LLAMA3_8B, decodeStep, denseParams, gb, prefillTime, secs, sig, tok } from './model';
import { FS, brace, fitText, hbar, lang, pad, pill, show, tagText, WORDS } from './ui';

const A8 = LLAMA3_8B, W8 = denseParams(A8) * 2;
void A100;

const join = (ws: readonly string[]) => ws.join(' ').replace(/ ([,.])/g, '$1');

// ═════════════ 1 · el chat (hook) ═════════════
export function drawChat(S: Frame) {
  const { d, pal: p } = S, u = S.u, A0 = pad(S), l = lang(S), W = WORDS[l];
  const A: Rect = { ...A0, y: A0.y + 18 * u, h: A0.h - 18 * u };      // 18 px arriba para el rótulo «Tú»
  const colW = Math.min(A.w, 640 * u), cx = A.x + (A.w - colW) / 2, fs = FS(S, S.portrait ? 16 : 19), lh = fs * 1.32 * u;
  const sg = tone(S, 'sig'), lt = tone(S, 'lat');
  // mensaje de la persona
  const bw = colW * 0.82, bx = cx + colW - bw, ptxt = join(W.prompt), pl = d.wrap(ptxt, bw - 28 * u, { size: fs, weight: 600 }), bh = pl.length * lh + 22 * u;
  const a1 = S.reveal('hook', 0.15, 0.5);
  show(S, a1, () => {
    d.rect(bx, A.y, bw, bh, { fill: sg.soft, stroke: sg.c, lw: 1.5, r: 8 });
    d.text(ptxt, bx + 14 * u, A.y + 11 * u, { size: fs, weight: 600, color: p.ink, w: bw - 28 * u, base: 'top' });
    d.text(S.l('Tú', 'You'), bx + bw - 6 * u, A.y - 4 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  // respuesta del modelo, palabra a palabra
  const t = S.since('hook'), first = 1.9, per = 0.2, n = Math.floor(clamp((t - first) / per, 0, W.reply.length));
  const ry = A.y + bh + 26 * u, rw = colW * 0.9, rtxt = join(W.reply.slice(0, n)), rl = d.wrap(join(W.reply), rw - 28 * u, { size: fs, weight: 600 });
  const rh = rl.length * lh + 22 * u;
  const a2 = S.reveal('hook', 0.7, 0.5);
  show(S, a2, () => {
    d.rect(cx, ry, rw, rh, { fill: p.surface, stroke: lt.c, lw: 1.5, r: 8 });
    d.text(S.l('Modelo', 'Model'), cx + 6 * u, ry - 4 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
    if (n === 0) {   // «escribiendo…»: tres puntos que laten
      for (let i = 0; i < 3; i++) d.circle(cx + (22 + i * 14) * u, ry + rh / 2, 4 * u, { fill: p.mute, a: 0.35 + 0.6 * Math.max(0, Math.sin(S.clock * 5 - i * 0.9)) });
    } else {
      d.text(rtxt, cx + 14 * u, ry + 11 * u, { size: fs, weight: 600, color: p.ink, w: rw - 28 * u, base: 'top' });
      const lines = d.wrap(rtxt, rw - 28 * u, { size: fs, weight: 600 }), last = lines[lines.length - 1] ?? '';
      if (Math.sin(S.clock * 6) > -0.4) d.rect(cx + 14 * u + d.measure(last, { size: fs, weight: 600 }) + 4 * u, ry + 11 * u + (lines.length - 1) * lh, 2.5 * u, fs * 1.1 * u, { fill: p.ink });
    }
  });
  // línea de tiempo: Enter → primera palabra → fin
  const ty = Math.min(A.y + A.h - 26 * u, ry + rh + 64 * u), x0 = cx, x1 = cx + colW, total = first + per * W.reply.length;
  const aT = S.reveal('hook', 1.2, 0.5), xf = x0 + (x1 - x0) * (first / total);
  show(S, aT, () => {
    d.arrow(x0, ty, x1, ty, p.lineStrong, 2, 8);
    d.circle(x0, ty, 5 * u, { fill: sg.c, stroke: p.stage, lw: 2 });
    tagText(S, 'Enter', x0, ty + 16 * u, { align: 'left', base: 'top', t: 'sig' });
    tagText(S, S.l('tiempo', 'time'), x1, ty + 16 * u, { align: 'right', base: 'top', t: 'mute', weight: 600 });
    if (t > first) {
      d.circle(xf, ty, 5 * u, { fill: lt.c, stroke: p.stage, lw: 2 });
      brace(S, x0 + 2, xf - 2, ty - 12 * u, S.l('espera', 'wait'), 'dat', { up: true });
      brace(S, xf + 2, x0 + (x1 - x0) * clamp((t) / total) - 2, ty - 12 * u, S.l('fluye', 'flows'), 'lat', { up: true, a: clamp((t - first) / 0.8) });
    }
    const px = x0 + (x1 - x0) * clamp(t / total);
    d.circle(px, ty, 4 * u, { fill: p.ink });
  });
}

// ═════════════ 2 · entrenar vs servir ═════════════
export function drawServing(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), wt = tone(S, 'w'), er = tone(S, 'err'), lt = tone(S, 'lat');
  const [a, b] = S.portrait ? split(A, 'v', 0.5, 12 * u) : split(A, 'h', 0.5, 16 * u);
  const grid = (r: Rect, moving: boolean, al: number) => {
    const cols = 10, rows = S.portrait ? 4 : 5, gap = 2 * u, cs = Math.min((r.w - 24 * u) / cols, (r.h * (S.portrait ? 0.4 : 0.42)) / rows), gw = cs * cols, gx = r.x + (r.w - gw) / 2, gy = r.y + 34 * u;
    d.withAlpha(al, () => {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const k = j * cols + i, v = moving ? 0.5 + 0.5 * Math.sin(S.clock * 1.7 + hash(k, 1) * 6.28) : hash(k, 1);
        d.rect(gx + i * cs, gy + j * cs, cs - gap, cs - gap, { fill: alpha(wt.c, 0.14 + 0.72 * v) });
      }
    });
    return { gx, gy, gw, gh: rows * cs };
  };
  const panel = (r: Rect, title: string, al: number) => d.withAlpha(al, () => { d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.line, lw: 1, r: 4 }); pill(S, title, r.x + 10 * u, r.y + 16 * u, { align: 'left', t: 'ink' }); });
  // izquierda: entrenar
  const a1 = S.reveal('serving', 0.2, 0.6);
  panel(a, S.l('Entrenar', 'Training'), a1);
  const g1 = grid(a, true, a1);
  show(S, a1, () => {
    const cx = g1.gx + g1.gw / 2, y = g1.gy + g1.gh + 10 * u, pulse = 0.5 + 0.5 * Math.sin(S.clock * 3);
    d.arrow(cx, y, cx, y + 22 * u, er.c, 3, 9, 0.5 + 0.5 * pulse);
    tagText(S, S.l('error → ajusta los pesos', 'error → adjusts the weights'), cx, y + 34 * u, { t: 'err', base: 'top', align: 'center', w: a.w - 20 * u });
    tagText(S, S.l('una vez, durante meses', 'once, over months'), cx, a.y + a.h - 12 * u, { t: 'mute', base: 'bottom', align: 'center', weight: 600 });
  });
  // derecha: servir
  const a2 = S.reveal('serving', 2.4, 0.6);
  panel(b, S.l('Usar: inferencia', 'Using: inference'), a2);
  const g2 = grid(b, false, a2);
  show(S, a2, () => {
    const lx = g2.gx + g2.gw + 4 * u, ly = g2.gy;
    d.rect(lx - 12 * u, ly + 8 * u, 10 * u, 8 * u, { fill: p.ink2 });                             // candado
    d.polyline([[lx - 10 * u, ly + 8 * u], [lx - 10 * u, ly + 3 * u], [lx - 4 * u, ly + 3 * u], [lx - 4 * u, ly + 8 * u]], p.ink2, 2);
    tagText(S, S.l('pesos fijos', 'frozen weights'), g2.gx + g2.gw / 2, g2.gy + g2.gh + 14 * u, { t: 'w', base: 'middle', align: 'center' });
  });
  // personas que llegan
  const a3 = S.reveal('serving', 5.0, 0.7);
  show(S, a3, () => {
    const y = b.y + b.h - (S.portrait ? 56 : 66) * u, n = 3, gw = (b.w - 24 * u) / n;
    for (let i = 0; i < n; i++) {
      const x = b.x + 12 * u + i * gw, bw = gw - 10 * u, ph = (S.clock * 0.8 + i * 0.33) % 1;
      d.rect(x, y, bw, 28 * u, { fill: lt.soft, stroke: lt.c, lw: 1.3, r: 4 });
      for (let k = 0; k < 4; k++) d.rect(x + 7 * u + k * ((bw - 14 * u) / 4), y + 9 * u, (bw - 14 * u) / 4 - 3 * u, 10 * u, { fill: alpha(lt.c, 0.55) });
      const px = x + bw / 2;
      d.line(px, y - 2 * u, px, y - 14 * u, p.lineStrong, 1.4);
      d.circle(px, y - 2 * u - 12 * u * ph, 3.4 * u, { fill: lt.c, stroke: p.stage, lw: 1.2 });
    }
    tagText(S, S.l('muchas personas a la vez', 'many people at once'), b.x + b.w / 2, b.y + b.h - 12 * u, { t: 'lat', base: 'bottom', align: 'center' });
  });
}

// ═════════════ 3 · el recorrido: prefill → decode ═════════════
interface FlowGeom { A: Rect; prompt: Rect; model: Rect; out: Rect; time: Rect; promptBoxes: Rect[]; outBoxes: Rect[]; fs: number; th: number }
function flowGeom(S: Frame): FlowGeom {
  const u = S.u, A0 = pad(S), A: Rect = { ...A0, y: A0.y + 20 * u, h: A0.h - 20 * u }, W = WORDS[lang(S)], fs = FS(S, S.portrait ? 13 : 15), th = S.portrait ? 24 : 28;   // 20 px arriba para «tu mensaje»
  const opts = { show: 0, size: fs, h: th, gap: 5, mono: false };
  const pb = tokenRow(S, A.x, A.y, A.w, [...W.prompt], opts), ob = tokenRow(S, A.x, 0, A.w, [...W.reply], opts);
  const ph = pb[pb.length - 1].y + pb[pb.length - 1].h - pb[0].y, oh = ob[ob.length - 1].y + ob[ob.length - 1].h - ob[0].y;
  const timeH = 44 * u, capH = 20 * u;
  let gapA = 34 * u, mh = Math.min(96 * u, Math.max(54 * u, A.h * 0.22));
  const need = () => ph + gapA + mh + gapA + oh + capH + timeH;
  while (need() > A.h && (gapA > 20 * u || mh > 46 * u)) { gapA = Math.max(20 * u, gapA - 2); mh = Math.max(46 * u, mh - 2); }
  const prompt: Rect = { x: A.x, y: A.y, w: A.w, h: ph }, model: Rect = { x: A.x, y: A.y + ph + gapA, w: A.w, h: mh };
  const outY = model.y + mh + gapA, out: Rect = { x: A.x, y: outY, w: A.w, h: oh };
  // recolocar las cajas con las posiciones reales
  const pbx = tokenRow(S, A.x, prompt.y, A.w, [...W.prompt], opts), obx = tokenRow(S, A.x, out.y, A.w, [...W.reply], opts);
  return { A, prompt, model, out, time: { x: A.x, y: A.y + A.h - timeH, w: A.w, h: timeH }, promptBoxes: pbx, outBoxes: obx, fs, th };
}

export function drawFlow(S: Frame) {
  const { d, pal: p } = S, u = S.u, g = flowGeom(S), l = lang(S), W = WORDS[l];
  const wt = tone(S, 'w'), dt = tone(S, 'dat'), lt = tone(S, 'lat');
  const inDecode = S.on('decode');
  const aP = S.reveal('prefill', 0.1, 0.6), aM = S.reveal('prefill', 0.5, 0.6);
  // prompt
  show(S, aP, () => {
    tokenRow(S, g.A.x, g.prompt.y, g.A.w, [...W.prompt], { size: g.fs, h: g.th, gap: 5, tone: 'lat' });
    tagText(S, S.l('tu mensaje · 10 tokens', 'your message · 10 tokens'), g.A.x, g.prompt.y - 8 * u, { t: 'mute', base: 'bottom', align: 'left', weight: 600 });
  });
  // modelo
  const wave = inDecode ? 1 : S.at('prefill', 1.3, 3.0, 'lin');
  show(S, aM, () => {
    const m = g.model, rows = 4, sh = (m.h - 12 * u) / rows;
    d.rect(m.x, m.y, m.w, m.h, { fill: alpha(wt.c, 0.07), stroke: wt.c, lw: 1.6, r: 4 });
    for (let i = 0; i < rows; i++) {
      const lit = inDecode ? clamp(1 - Math.abs(((S.since('decode') * 2.6) % 1.6) - i * 0.4) * 2) * 0 : clamp(1 - Math.abs(wave * 1.3 - (i + 0.5) / rows) * 3.2);
      d.rect(m.x + 8 * u, m.y + 6 * u + i * sh + 1, m.w - 16 * u, sh - 3, { fill: alpha(wt.c, 0.1 + 0.4 * lit) });
    }
    fitText(S, S.l('Modelo', 'Model'), m.x + 16 * u, m.y + m.h / 2 - 8 * u, m.w * 0.3, 16, { weight: 800, color: wt.ink, base: 'middle', halo: p.stage });
    fitText(S, S.l(`pesos: ${gb(W8, 'es', 1)}`, `weights: ${gb(W8, 'en', 1)}`), m.x + 16 * u, m.y + m.h / 2 + 10 * u, m.w * 0.36, 12, { weight: 600, font: 'mono', color: p.ink2, base: 'middle', halo: p.stage });
  });
  // prefill: todos los tokens a la vez
  if (!inDecode && wave > 0 && wave < 1) {
    const xs = new Set<number>(); g.promptBoxes.forEach((b) => xs.add(Math.round(b.x + b.w / 2)));
    const y0 = g.prompt.y + g.prompt.h, y1 = g.model.y + g.model.h, y = lerp(y0, y1, wave);
    xs.forEach((x) => { d.line(x, y0, x, y, alpha(dt.c, 0.35), 1.5); d.circle(x, y, 4.4 * u, { fill: dt.c, stroke: p.stage, lw: 1.5 }); });
  } else if (!inDecode && S.on('prefill')) {
    const y0 = g.prompt.y + g.prompt.h, y1 = g.model.y;
    g.promptBoxes.forEach((b) => d.line(b.x + b.w / 2, y0, b.x + b.w / 2, y1, alpha(dt.c, 0.28 * aP), 1.3));
  }
  // salida
  const kShow = inDecode ? 1 + clamp((S.since('decode') - 0.9) / 0.4, 0, 15) : S.at('prefill', 3.0, 3.6, 'out');
  const aO = S.reveal('prefill', 2.8, 0.5);
  show(S, aO, () => {
    tokenRow(S, g.A.x, g.out.y, g.A.w, [...W.reply], { size: g.fs, h: g.th, gap: 5, tone: 'dat', show: kShow, active: [Math.max(0, Math.min(15, Math.ceil(kShow) - 1))] });
    tagText(S, S.l('la respuesta', 'the answer'), g.A.x, g.out.y - 8 * u, { t: 'mute', base: 'bottom', align: 'left', weight: 600 });
    if (!inDecode && wave >= 1) tagText(S, S.l('1.er token', '1st token'), g.A.x + g.outBoxes[0].w + 10 * u, g.out.y + g.th * u / 2, { t: 'dat', align: 'left', size: 12 });
  });
  // rótulo del modo
  const mid = (g.prompt.y + g.prompt.h + g.model.y) / 2;
  if (!inDecode) show(S, S.reveal('prefill', 1.0, 0.5), () => pill(S, S.l('todos a la vez, en paralelo', 'all at once, in parallel'), g.A.x + g.A.w / 2, mid, { t: 'dat' }));
  else {
    show(S, S.reveal('decode', 0.1, 0.5), () => pill(S, S.l('uno por vuelta', 'one per turn'), g.A.x + g.A.w / 2, mid, { t: 'w' }));
    // el bucle: el token nuevo vuelve a la entrada
    const xl = S.W - 7 * u, my = g.model.y + g.model.h / 2, oy = g.out.y + g.out.h / 2, cur = Math.min(16, Math.floor(kShow));
    const path: [number, number][] = [[g.A.x + g.A.w, oy], [xl, oy], [xl, my], [g.A.x + g.A.w, my]];
    show(S, S.reveal('decode', 0.4, 0.5), () => {
      d.polyline(path, alpha(wt.c, 0.55), 2, { dash: [5, 4] });
      d.arrow(xl - 2, my, g.A.x + g.A.w + 1, my, alpha(wt.c, 0.75), 2, 8);
    });
    const f = kShow % 1;
    if (cur > 0 && cur < 16 && f > 0) {
      const tt = f, seg = (a: [number, number], b: [number, number], q: number): [number, number] => [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
      const pt = tt < 0.34 ? seg(path[0], path[1], tt / 0.34) : tt < 0.67 ? seg(path[1], path[2], (tt - 0.34) / 0.33) : seg(path[2], path[3], (tt - 0.67) / 0.33);
      d.circle(pt[0], pt[1], 4.4 * u, { fill: wt.c, stroke: p.stage, lw: 1.5 });
    }
    tagText(S, S.l(`vuelta ${Math.min(16, Math.ceil(kShow))}`, `turn ${Math.min(16, Math.ceil(kShow))}`), g.A.x + g.A.w, g.out.y + g.out.h + 12 * u, { t: 'w', align: 'right', base: 'top', font: 'mono' });
  }
  // eje de tiempo
  const tm = g.time, uw = (tm.w - 44 * u) / 19, by = tm.y + 4 * u, bh = 14 * u;
  const aT = S.reveal('prefill', 1.3, 0.5);
  show(S, aT, () => {
    d.arrow(tm.x, by + bh + 4 * u, tm.x + tm.w, by + bh + 4 * u, p.lineStrong, 1.5, 7);
    const pw = inDecode ? 1 : clamp(wave * 1.1);
    d.rect(tm.x, by, uw * pw - 1.5, bh, { fill: dt.c });
    brace(S, tm.x, tm.x + uw - 1.5, by + bh + 8 * u, 'prefill', 'dat', { a: inDecode ? 1 : clamp(wave * 3) });
    const n = inDecode ? Math.min(16, Math.ceil(kShow)) : 0;
    for (let i = 0; i < n; i++) d.rect(tm.x + uw * (i + 1), by, uw - 1.5, bh, { fill: wt.c });
    if (n > 1) brace(S, tm.x + uw + 1, tm.x + uw * (n + 1) - 2, by + bh + 8 * u, n > 4 ? 'decode' : '', 'w');
    tagText(S, S.l('tiempo', 'time'), tm.x + tm.w, by - 6 * u, { t: 'mute', align: 'right', base: 'bottom', weight: 600 });
  });
}

// ═════════════ 4 · la duración real (estimada) ═════════════
export function drawPhases(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = pad(S), l = lang(S), dt = tone(S, 'dat'), wt = tone(S, 'w');
  const Lin = 2000, Lout = 300, tPre = prefillTime(A8, H100, Lin), st = decodeStep(A8, H100, W8, 1, Lin + Lout / 2), tDec = st.t * Lout;
  const ratePre = Lin / tPre, rateDec = 1 / st.t;
  const barH = (S.portrait ? 54 : 64) * u, by = A.y + A.h * (S.portrait ? 0.3 : 0.34), bx = A.x, bw = A.w, pw = bw * (tPre / (tPre + tDec));
  const a0 = S.reveal('phases', 0.1, 0.5);
  show(S, a0, () => {
    fitText(S, S.l(`Ejemplo: ${tok(Lin, 'es')} tokens de entrada, ${tok(Lout, 'es')} de salida`, `Example: ${tok(Lin, 'en')} input tokens, ${tok(Lout, 'en')} output tokens`), A.x, A.y + 6 * u, A.w, 17, { weight: 800, base: 'top' });
    fitText(S, S.l('estimación · modelo de 8 mil M · H100 · un solo usuario', 'estimate · 8B model · H100 · single user'), A.x, A.y + 30 * u, A.w, 12, { weight: 600, color: p.mute, base: 'top' });
  });
  const aB = S.reveal('phases', 0.6, 0.8);
  show(S, aB, () => {
    d.rect(bx, by, bw, barH, { fill: p.surface2 });
    d.rect(bx, by, Math.max(3, pw * aB), barH, { fill: dt.c });
    d.rect(bx + pw, by, (bw - pw) * aB, barH, { fill: alpha(wt.c, 0.85) });
  });
  show(S, S.reveal('phases', 1.8, 0.6), () => {
    d.line(bx + Math.max(3, pw) / 2, by - 4 * u, bx + Math.max(3, pw) / 2, by - 22 * u, dt.c, 1.6);
    tagText(S, `prefill · ${secs(tPre, l)}`, bx, by - 30 * u, { t: 'dat', align: 'left', base: 'bottom', size: 15 });
  });
  show(S, S.reveal('phases', 3.6, 0.6), () => {
    tagText(S, S.l(`decode · ${secs(tDec, 'es')}`, `decode · ${secs(tDec, 'en')}`), bx + bw, by + barH + 22 * u, { t: 'w', align: 'right', base: 'middle', size: 16 });
    brace(S, bx + pw + 2, bx + bw, by + barH + 6 * u, '', 'w');
  });
  // ritmos
  const ry = by + barH + (S.portrait ? 70 : 74) * u, cw = (A.w - 14 * u) / 2;
  show(S, S.reveal('phases', 6.0, 0.7), () => {
    const rows: [string, string, string, 'dat' | 'w'][] = [[S.l('leer (entrada)', 'read (input)'), `≈ ${tok(Math.round(ratePre / 100) * 100, l)}`, S.l('tokens/s', 'tokens/s'), 'dat'], [S.l('escribir (salida)', 'write (output)'), `≈ ${tok(Math.round(rateDec / 5) * 5, l)}`, S.l('tokens/s', 'tokens/s'), 'w']];
    rows.forEach(([lab, v, unit, t], i) => {
      const x = A.x + i * (cw + 14 * u), c = tone(S, t);
      d.rect(x, ry, cw, 64 * u, { fill: alpha(c.c, 0.08), stroke: c.c, lw: 1.4, r: 3 });
      fitText(S, lab, x + cw / 2, ry + 6 * u, cw - 10 * u, 12, { weight: 700, color: p.mute, align: 'center', base: 'top' });
      fitText(S, `${v} ${unit}`, x + cw / 2, ry + 58 * u, cw - 10 * u, 20, { weight: 700, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
    });
    void hbar; void token; void sig;
  });
}
