// Cuarto acto: el éxito (seq2seq) y los tres límites, el resumen y el puente.
import { alpha, box, clamp, inset, link, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { sentenceRun, G_DEFAULT } from './model';
import { arrow, fit, fz, panel, stateBars, tok, uu } from './ui';

const ENC = { es: ['Las', 'flores', 'están', 'marchitas'], en: ['The', 'flowers', 'are', 'wilted'] };
const DEC = { es: ['The', 'flowers', 'are', 'wilted'], en: ['Les', 'fleurs', 'sont', 'fanées'] };

// ═════════════════════════════════════════════════════════════════════════
// Codificador → vector fijo → decodificador
// ═════════════════════════════════════════════════════════════════════════
export function drawSeq2Seq(S: Frame, a: number) {
  if (a <= 0) return;
  const { d, pal: p } = S, u = uu(S), all = inset(S.full(), 14 * u), vert = S.portrait;
  const wt = tone(S, 'w'), lat = tone(S, 'lat'), dat = tone(S, 'dat'), sg = tone(S, 'sig'), err = tone(S, 'err');
  const infoH = vert ? 86 * u : Math.max(64 * u, S.H * 0.22);
  const chain: Rect = { x: all.x, y: all.y, w: all.w, h: all.h - infoH - 6 * u }, info: Rect = { x: all.x, y: all.y + all.h - infoH, w: all.w, h: infoH };
  const units = [1, 1, 1, 1, 1.6, 1, 1, 1, 1], tot = units.reduce((s, x) => s + x, 0);
  const sizeAlong = vert ? chain.h : chain.w;
  const start: number[] = []; let acc = 0; units.forEach((w) => { start.push(acc); acc += (w / tot) * sizeAlong; });
  const span = (i: number) => (units[i] / tot) * sizeAlong;
  const cen = (i: number) => (vert ? chain.y : chain.x) + start[i] + span(i) / 2;
  const ENCW = ENC[S.lang], DECW = DEC[S.lang];
  const vis = (i: number) => S.reveal('success', 0.3 + i * 0.32, 0.45);
  const cw = vert ? 48 * u : Math.min(span(0) * 0.74, 64 * u), ch = vert ? Math.min(span(0) * 0.72, 28 * u) : 36 * u;
  const midX = chain.x + chain.w / 2, midY = chain.y + chain.h / 2;
  const hot = S.on('limit-seq') ? Math.floor((S.reduced ? 0 : S.clock * 1.5) % 10) : -1;
  const numA = S.at('limit-seq', 0.2, 1.0);

  d.withAlpha(a, () => {
    for (let i = 0; i < 9; i++) {
      const ai = vis(i); if (ai <= 0) continue;
      const c = cen(i), isVec = i === 4, enc = i < 4, wi = enc ? i : i - 5;
      if (isVec) {
        const bw = vert ? 72 * u : Math.min(span(i) * 0.74, 92 * u), bh = vert ? Math.min(span(i) * 0.82, 40 * u) : 64 * u;
        const r: Rect = vert ? { x: midX - bw / 2 - 20 * u, y: c - bh / 2, w: bw, h: bh } : { x: c - bw / 2, y: midY - bh / 2 - 6 * u, w: bw, h: bh };
        const focus = S.between('limit-bottleneck', 'limit-short') ? 1 : 0;
        d.withAlpha(ai, () => {
          d.rect(r.x - 2 * u, r.y - 2 * u, r.w + 4 * u, r.h + 4 * u, { fill: alpha(lat.c, 0.1 + 0.15 * focus), stroke: lat.c, lw: 2 + 2 * focus, r: 4 });
          stateBars(S, inset(r, 6 * u, 6 * u, 6 * u, 6 * u), sentenceRun(G_DEFAULT).states[7], { a: 1, tone: 'lat' });
          const lab = S.l('vector fijo', 'fixed vector');
          if (vert) fit(S, lab, r.x + r.w + 8 * u, c, all.w - (r.x + r.w - all.x) - 10 * u, { size: 12.5, weight: 800, color: lat.ink, align: 'left' });
          else fit(S, lab, c, r.y + r.h + 16 * u, span(i) + 20 * u, { size: 12.5, weight: 800, color: lat.ink, align: 'center' });
        });
        continue;
      }
      const cx = vert ? midX - 20 * u : c, cy = vert ? c : midY - 6 * u;
      d.withAlpha(ai, () => {
        d.rect(cx - cw / 2, cy - ch / 2, cw, ch, { fill: alpha(wt.c, hot === i ? 0.45 : 0.12), stroke: wt.c, lw: hot === i ? 3 : 1.8, r: 3 });
        fit(S, 'LSTM', cx, cy, cw - 4 * u, { size: 12.5, weight: 800, color: wt.ink, align: 'center' });
        if (enc) {
          if (!vert) { arrow(S, cx, cy + ch / 2 + 17 * u, cx, cy + ch / 2 + 1, p.ink2, { lw: 1.6, head: 5 }); tok(S, ENCW[wi], cx, cy + ch / 2 + 30 * u, { maxW: span(i) - 2 * u, h: 24, size: 13 }); }
          else { const tx = all.x + 34 * u; arrow(S, tx + 28 * u, cy, cx - cw / 2 - 1, cy, p.ink2, { lw: 1.6, head: 5 }); tok(S, ENCW[wi], tx, cy, { maxW: 68 * u, h: 22, size: 13 }); }
        } else {
          if (!vert) { arrow(S, cx, cy - ch / 2 - 1, cx, cy - ch / 2 - 17 * u, p.ink2, { lw: 1.6, head: 5 }); tok(S, DECW[wi], cx, cy - ch / 2 - 30 * u, { maxW: span(i) - 2 * u, h: 24, size: 13, tone: 'dat' }); }
          else { const tx = all.x + all.w - 38 * u; arrow(S, cx + cw / 2 + 1, cy, tx - 30 * u, cy, p.ink2, { lw: 1.6, head: 5 }); tok(S, DECW[wi], tx, cy, { maxW: 72 * u, h: 22, size: 13, tone: 'dat' }); }
        }
        if (numA > 0 && S.on('limit-seq')) { d.withAlpha(numA, () => d.text(String(i + 1), vert ? cx - cw / 2 - 12 * u : cx, vert ? cy : cy - ch / 2 - 10 * u, { size: fz(S, 12), weight: 700, font: 'mono', color: err.ink, align: 'center', base: 'middle' })); }
        // enlace con la celda siguiente
        const nx = i + 1; if (nx <= 8 && nx !== 4 && i !== 4) {
          const c2 = cen(nx), cx2 = vert ? cx : c2, cy2 = vert ? c2 : cy;
          if (S.reveal('success', 0.3 + nx * 0.32, 0.45) > 0.3) {
            if (!vert) arrow(S, cx + cw / 2 + 1, cy, cx2 - cw / 2 - 1, cy, dat.c, { lw: 1.8, head: 6 });
            else arrow(S, cx, cy + ch / 2 + 1, cx2, cy2 - ch / 2 - 1, dat.c, { lw: 1.8, head: 6 });
          }
        }
      });
      // enlaces a y desde el vector
      if (i === 3 || i === 5) {
        const c4 = cen(4), v4 = vert ? { x: midX - 20 * u, y: c4 } : { x: c4, y: midY - 6 * u };
        void v4;
      }
    }
    // conexiones con el vector (de la última celda del codificador al vector y del vector a la primera del decodificador)
    if (vis(5) > 0.3) {
      const c3 = cen(3), c4 = cen(4), c5 = cen(5);
      if (!vert) {
        const y = midY - 6 * u, vb = Math.min(span(4) * 0.74, 92 * u);
        arrow(S, c3 + cw / 2 + 1, y, c4 - vb / 2 - 4 * u, y, dat.c, { lw: 1.8, head: 6, a: vis(4) });
        arrow(S, c4 + vb / 2 + 4 * u, y, c5 - cw / 2 - 1, y, dat.c, { lw: 1.8, head: 6, a: vis(5) });
      } else {
        const x = midX - 20 * u, vb = Math.min(span(4) * 0.82, 40 * u);
        arrow(S, x, c3 + ch / 2 + 1, x, c4 - vb / 2 - 4 * u, dat.c, { lw: 1.8, head: 6, a: vis(4) });
        arrow(S, x, c4 + vb / 2 + 4 * u, x, c5 - ch / 2 - 1, dat.c, { lw: 1.8, head: 6, a: vis(5) });
      }
    }
    // información de cada límite
    if (S.on('limit-seq') && !S.on('limit-bottleneck')) infoSeq(S, info, S.reveal('limit-seq', 0.4, 0.6));
    if (S.on('limit-bottleneck')) infoBottleneck(S, info, S.reveal('limit-bottleneck', 0.4, 0.6));
    if (S.between('success', 'limit-seq')) {
      const ia = S.reveal('success', 3.0, 0.7);
      d.withAlpha(ia, () => {
        const inn = panel(S, info, 1);
        fit(S, S.l('Traducción automática con LSTM, 2014', 'Machine translation with LSTMs, 2014'), inn.x, inn.y + 10 * u, inn.w, { size: 12.5, weight: 800, color: sg.ink, align: 'left' });
        fit(S, S.l('un LSTM lee la frase y la comprime; otro la escribe', 'one LSTM reads and compresses the sentence; another writes it'), inn.x, inn.y + 32 * u, inn.w, { size: 12.5, weight: 600, color: p.ink2, align: 'left' });
      });
    }
  });
}

function infoSeq(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = uu(S), inn = panel(S, r, a), err = tone(S, 'err');
  d.withAlpha(a, () => {
    fit(S, S.l('En fila: cada paso espera al anterior', 'In a line: every step waits for the previous one'), inn.x, inn.y + 10 * u, inn.w, { size: 12.5, weight: 800, color: err.ink, align: 'left' });
    fit(S, S.l('mil palabras son mil pasos en fila', 'a thousand words are a thousand steps in a line'), inn.x, inn.y + 32 * u, inn.w, { size: 12.5, weight: 600, color: p.ink2, align: 'left' });
    const y = inn.y + inn.h - 10 * u;
    arrow(S, inn.x, y, inn.x + inn.w, y, err.c, { lw: 2, head: 7 });
    fit(S, S.l('tiempo', 'time'), inn.x + inn.w, y - 11 * u, 80 * u, { size: 12, weight: 700, color: err.ink, align: 'right' });
  });
}

function infoBottleneck(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = uu(S), inn = panel(S, r, a), lat = tone(S, 'lat'), err = tone(S, 'err');
  d.withAlpha(a, () => {
    fit(S, S.l('Todo cabe en el mismo vector', 'It all has to fit in the same vector'), inn.x, inn.y + 10 * u, inn.w, { size: 12.5, weight: 800, color: lat.ink, align: 'left' });
    const rows: [string, number][] = [[S.l('frase corta', 'short sentence'), 4], [S.l('frase larga', 'long sentence'), 18]];
    const lw = Math.min(96 * u, inn.w * 0.3), cell = Math.min(10 * u, (inn.w - lw - 80 * u) / 18), y0 = inn.y + 30 * u, rh = Math.min(20 * u, (inn.h - 36 * u) / 2);
    rows.forEach(([lab, n], j) => {
      const y = y0 + j * rh + rh / 2;
      fit(S, lab, inn.x, y, lw - 6 * u, { size: 12, weight: 600, color: p.ink2, align: 'left' });
      for (let k = 0; k < n; k++) d.rect(inn.x + lw + k * (cell + 2 * u), y - 5 * u, cell, 10 * u, { fill: alpha(lat.c, 0.5), stroke: lat.c, lw: 1 });
      const ex = inn.x + lw + n * (cell + 2 * u) + 6 * u, bx = inn.x + inn.w - 56 * u;
      arrow(S, ex, y, bx - 4 * u, y, p.ink2, { lw: 1.4, head: 5 });
    });
    const bx = inn.x + inn.w - 52 * u, by = y0 + 2 * u, bh = rh * 2 - 4 * u;
    d.rect(bx, by, 48 * u, bh, { fill: alpha(lat.c, 0.12), stroke: lat.c, lw: 2.2, r: 3 });
    fit(S, S.l('mismo tamaño', 'same size'), bx + 24 * u, by + bh + 9 * u, 100 * u, { size: 12, weight: 700, color: err.ink, align: 'center' });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Tercer límite: la memoria útil
// ═════════════════════════════════════════════════════════════════════════
export function drawGauge(S: Frame, a: number) {
  if (a <= 0) return;
  const { d, pal: p } = S, u = uu(S), all = inset(S.full(), 18 * u), dat = tone(S, 'dat'), err = tone(S, 'err');
  const bx = all.x + 8 * u, bw = all.w - 16 * u, MAXW = 250, X = (n: number) => bx + (n / MAXW) * bw, bh = 54 * u, by = all.y + all.h * (S.portrait ? 0.22 : 0.24);
  d.withAlpha(a, () => {
    fit(S, S.l('Cuánto del texto anterior aprovecha una LSTM', 'How much earlier text an LSTM makes use of'), all.x, all.y + 8 * u, all.w, { size: 13.5, weight: 800, color: p.ink, align: 'left' });
    const g1 = S.reveal('limit-short', 0.3, 0.7), g2 = S.reveal('limit-short', 1.2, 0.8), g3 = S.reveal('limit-short', 2.2, 0.7);
    d.rect(bx, by, bw, bh, { stroke: p.lineStrong, lw: 1.5 });
    // 0–50: nítido; 50–200: borroso; >200: nada
    d.withAlpha(g1, () => d.rect(X(0), by, X(50) - X(0), bh, { fill: alpha(dat.c, 0.9) }));
    d.withAlpha(g2, () => d.dither(X(50), by, X(200) - X(50), bh, dat.c, 0.5, 2));
    d.withAlpha(g3, () => d.rect(X(200), by, X(250) - X(200), bh, { stroke: err.c, lw: 1.5, dash: [4, 4] }));
    [0, 50, 100, 200].forEach((n) => { d.line(X(n), by + bh, X(n), by + bh + 5 * u, p.lineStrong, 1.5); d.text(String(n), X(n), by + bh + 8 * u, { size: fz(S, 12), font: 'mono', color: p.mute, align: n === 0 ? 'left' : 'center', base: 'top' }); });
    fit(S, S.l('palabras hacia atrás', 'words back'), X(250), by + bh + 8 * u, bw * 0.5, { size: 12, weight: 700, color: p.ink2, align: 'right', base: 'top' });
    // leyenda
    const ly = by + bh + 50 * u, rowH = 32 * u;
    const items: [string, string, 'dat' | 'err', number, number][] = [
      [S.l('0–50: el orden importa', '0–50: word order matters'), 'solid', 'dat', g1, 0],
      [S.l('50–200: se usa, sin orden', '50–200: used, without order'), 'dither', 'dat', g2, 1],
      [S.l('más de 200: no se usa', 'beyond 200: not used'), 'empty', 'err', g3, 2],
    ];
    items.forEach(([lab, kind, tn, ga, i]) => {
      const y = ly + i * rowH, t = tone(S, tn);
      d.withAlpha(ga, () => {
        if (kind === 'solid') d.rect(all.x + 4 * u, y - 8 * u, 22 * u, 16 * u, { fill: alpha(t.c, 0.9) });
        else if (kind === 'dither') { d.rect(all.x + 4 * u, y - 8 * u, 22 * u, 16 * u, { stroke: p.line, lw: 1 }); d.dither(all.x + 4 * u, y - 8 * u, 22 * u, 16 * u, t.c, 0.5, 2); }
        else d.rect(all.x + 4 * u, y - 8 * u, 22 * u, 16 * u, { stroke: t.c, lw: 1.5, dash: [3, 3] });
        fit(S, lab, all.x + 34 * u, y, all.w - 40 * u, { size: 13, weight: 600, color: p.ink, align: 'left' });
      });
    });
    const ca = S.reveal('limit-short', 3.2, 0.7);
    d.withAlpha(ca, () => fit(S, S.l('Khandelwal et al., 2018 · valores aproximados', 'Khandelwal et al., 2018 · approximate values'), all.x + 4 * u, all.y + all.h - 8 * u, all.w - 8 * u, { size: 12, weight: 500, color: p.mute, align: 'left' }));
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Resumen y puente
// ═════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame, a: number) {
  if (a <= 0) return;
  const u = uu(S), r = inset(S.full(), 16 * u);
  const labels = [S.l('Estado oculto', 'Hidden state'), S.l('La culpa se apaga', 'The blame fades'), S.l('Compuertas', 'Gates')];
  const subs = [S.l('memoria de lo leído', 'memory of what was read'), S.l('en muchos pasos', 'over many steps'), S.l('olvidar, escribir, leer', 'forget, write, read')];
  const tones = ['dat', 'err', 'sig'] as const;
  const vert = S.portrait, bw = vert ? Math.min(r.w, 240 * u) : Math.min(r.w * 0.29, 250 * u), bh = 70 * u;
  const pos: Rect[] = [0, 1, 2].map((i) => vert ? { x: r.x + (r.w - bw) / 2, y: r.y + 8 * u + i * (bh + 36 * u), w: bw, h: bh } : { x: r.x + (r.w - 3 * bw - 2 * 44 * u) / 2 + i * (bw + 44 * u), y: r.y + r.h * 0.26, w: bw, h: bh });
  S.d.withAlpha(a, () => {
    pos.forEach((b, i) => { const ai = S.reveal('recap', 0.2 + i * 0.4, 0.5); if (ai > 0) box(S, b, labels[i], { tone: tones[i], a: ai, sub: subs[i], size: fz(S, 14) }); });
    for (let i = 0; i < 2; i++) { const ai = S.at('recap', 0.6 + i * 0.4, 1.1 + i * 0.4); if (ai > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: ai }); }
    const la = S.reveal('recap', 1.7, 0.6), y = vert ? pos[2].y + bh + 30 * u : pos[0].y + bh + 34 * u;
    S.d.withAlpha(la, () => {
      fit(S, S.l('Límites: va en fila · un solo vector · memoria corta', 'Limits: runs in a line · one single vector · short memory'), r.x + r.w / 2, y, r.w, { size: 13.5, weight: 700, color: tone(S, 'err').ink, align: 'center' });
    });
    if (!vert) neu(S, r.x + r.w / 2 - 36 * u, y + 28 * u, { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 2.0, 0.5) });
  });
}

export function drawBridge(S: Frame, a: number) {
  if (a <= 0) return;
  const { d, pal: p } = S, u = uu(S), cx = S.W / 2, cy = S.H / 2, sc = Math.max(4, Math.round(5.5 * u));
  d.withAlpha(a, () => {
    neu(S, cx - (24 * sc) / 2, cy - 100 * u, { scale: sc, mood: 'think', a: S.reveal('bridge', 0.2, 0.6) });
    d.withAlpha(S.reveal('bridge', 0.8, 0.6), () => {
      fit(S, S.l('Siguiente', 'Next'), cx, cy + 34 * u, S.W - 32 * u, { size: 13, weight: 700, color: p.mute, align: 'center' });
      fit(S, S.l('El big bang del deep learning', 'The deep learning big bang'), cx, cy + 66 * u, S.W - 24 * u, { size: 24, weight: 800, color: p.ink, align: 'center' });
      fit(S, S.l('¿Por qué despegó hacia 2012?', 'Why did it take off around 2012?'), cx, cy + 100 * u, S.W - 32 * u, { size: 15, weight: 600, color: p.ink2, align: 'center' });
    });
  });
  void clamp;
}
