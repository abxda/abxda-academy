// Vistas 9–13: lo que no se deshace, un caso real, permisos y persona en el bucle, niveles de autonomía y cómo empezar.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BAD_CALL, GOOD_CALL, LIMIT, PRICE } from './story';
import { FS, area, card, chip, chipH, fitText, fits, fr, glyph, hold, lines, lock, para, paraH, person, pick, tight } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Lo que se deshace y lo que no
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawIrreversible(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const cols = [
    { tone: 'dat' as const, g: 'redo' as const, title: S.l('se puede repetir o deshacer', 'can be repeated or undone'), items: [S.l('buscar funciones', 'look up showtimes'), S.l('leer un correo', 'read an email'), S.l('redactar un borrador', 'write a draft')], a0: 0.15 },
    { tone: 'err' as const, g: 'warn' as const, title: S.l('no se deshace', 'cannot be undone'), items: [S.l('comprar boletos', 'buy tickets'), S.l('pagar', 'pay'), S.l('enviar un correo', 'send an email'), S.l('borrar datos', 'delete data')], a0: 0.45 },
  ];
  const port = S.portrait, gap = 18 * u;
  const cw = port ? A.w : Math.min((A.w - gap) / 2, 330 * u);
  const rowH = chipH(S, 14.5) + (tight(S) ? 4 : 8) * u, headH = FS(S, 15) * u + 16 * u;
  const ch = (k: number) => headH + cols[k].items.length * rowH + 8 * u;
  const totalH = port ? ch(0) + gap + ch(1) : Math.max(ch(0), ch(1));
  const x0 = A.x + (A.w - (port ? cw : 2 * cw + gap)) / 2, y0 = A.y + Math.max(0, (A.h - totalH) / 2);
  cols.forEach((c, k) => {
    const x = port ? x0 : x0 + k * (cw + gap), y = port ? y0 + (k ? ch(0) + gap : 0) : y0;
    const a = fr(S, 'irreversible', c.a0, c.a0 + 0.12), t = tone(S, c.tone);
    d.withAlpha(a, () => {
      card(S, { x, y, w: cw, h: ch(k) }, { tone: c.tone, hot: 0.05 });
      glyph(S, c.g, x + 16 * u, y + headH / 2, 18 * u, t.ink);
      fitText(S, c.title, x + 32 * u, y + headH / 2, cw - 40 * u, 15, { weight: 800, color: t.ink, base: 'middle' });
      c.items.forEach((it, i) => {
        const ia = fr(S, 'irreversible', c.a0 + 0.06 + i * 0.07, c.a0 + 0.14 + i * 0.07);
        chip(S, it, x + 12 * u, y + headH + i * rowH + rowH / 2, c.tone, { align: 'left', size: 14.5, a: ia, maxW: cw - 24 * u, weight: 700 });
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Un caso reportado
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawIncident(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const w = Math.min(A.w, 580 * u), x = A.x + (A.w - w) / 2;
  const L1 = S.l('Un agente de programación borró una base de datos de producción.', 'A coding agent deleted a production database.');
  const L2 = S.l('Se le había pedido no hacer cambios.', 'It had been told to make no changes.');
  const L3 = S.l('Así lo contó su usuario. La empresa lo llamó inaceptable y anunció que separaría las bases de datos de prueba y de producción.', 'So its user reported. The company called it unacceptable and announced it would separate test and production databases.');
  const s1 = FS(S, tight(S) ? 15 : 18.5), s2 = FS(S, tight(S) ? 13.5 : 14.5), pad = 16 * u, tw = w - 2 * pad - 30 * u;
  const h = pad * 2 + FS(S, 13) * u + 10 * u + paraH(S, L1, tw, s1, { weight: 800 }) + 8 * u + paraH(S, L2, tw, s2, { weight: 700 }) + 8 * u + paraH(S, L3, tw, s2, { weight: 500 });
  const y = A.y + Math.max(0, (A.h - h) / 2);
  d.withAlpha(fr(S, 'incident', 0.05, 0.2), () => {
    card(S, { x, y, w, h }, { tone: 'err', hot: 0.05 });
    glyph(S, 'warn', x + pad + 10 * u, y + pad + 10 * u, 22 * u, tone(S, 'err').ink);
    const tx = x + pad + 30 * u;
    let yy = y + pad;
    fitText(S, S.l('julio de 2025 · Replit', 'July 2025 · Replit'), tx, yy, tw, 13, { weight: 800, color: tone(S, 'err').ink, base: 'top' });
    yy += FS(S, 13) * u + 10 * u;
    yy += para(S, L1, tx, yy, tw, s1, { weight: 800, a: fr(S, 'incident', 0.3, 0.45) }) + 8 * u;
    yy += para(S, L2, tx, yy, tw, s2, { weight: 700, color: p.ink, a: fr(S, 'incident', 0.6, 0.72) }) + 8 * u;
    para(S, L3, tx, yy, tw, s2, { weight: 500, color: p.ink2, a: fr(S, 'incident', 0.78, 0.9) });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Ruego o permiso; persona en el bucle; la compra equivocada
// ════════════════════════════════════════════════════════════════════════════════════════════════
export type Decision = 'wait' | 'approve' | 'reject';
/** Decisión vigente: la de la persona si ya pulsó un botón; si no, la de la demostración. */
export function decisionNow(S: Frame): Decision {
  const mine = S.st.ag?.dec as Decision | undefined;
  if (mine && (S.touched.has('approve') || S.touched.has('reject'))) return mine;
  return S.on('hitl-reject') && fr(S, 'hitl-reject', 0.18, 0.19) > 0 ? 'reject' : 'wait';
}
const userDecided = (S: Frame) => S.touched.has('approve') || S.touched.has('reject');

export interface PermLay { A: Rect; pipe: Rect; card: Rect; out: Rect; port: boolean }
export function permLay(S: Frame): PermLay {
  const u = S.u, A = area(S), pipeH = Math.max(40 * u, chipH(S, 13) + 18 * u);
  const below = { x: A.x, y: A.y + pipeH + (tight(S) ? 10 : 20) * u, w: A.w, h: A.h - pipeH - (tight(S) ? 10 : 20) * u };
  if (S.portrait) {
    const ch = Math.min(below.h * 0.56, 200 * u);
    return { A, pipe: { x: A.x, y: A.y, w: A.w, h: pipeH }, card: { x: below.x, y: below.y, w: below.w, h: ch }, out: { x: below.x, y: below.y + ch + 12 * u, w: below.w, h: below.h - ch - 12 * u }, port: true };
  }
  const cw = Math.min(below.w * 0.54, 440 * u);
  return { A, pipe: { x: A.x, y: A.y, w: A.w, h: pipeH }, card: { x: below.x, y: below.y, w: cw, h: below.h }, out: { x: below.x + cw + 20 * u, y: below.y, w: below.w - cw - 20 * u, h: below.h }, port: false };
}
/** Botones dibujados en la tarjeta de aprobación (también se pueden pulsar en el lienzo). */
export function permButtons(S: Frame): { approve: Rect; reject: Rect } | null {
  const L = permLay(S), u = S.u, C = L.card, bh = Math.max(30 * u, chipH(S, 13) + 8 * u), pad = 10 * u;
  const bw = (C.w - 3 * pad) / 2, y = cardBottom(S, L) - bh - pad;
  return { approve: { x: C.x + pad, y, w: bw, h: bh }, reject: { x: C.x + 2 * pad + bw, y, w: bw, h: bh } };
}
function cardLines(S: Frame, C: Rect) {
  const u = S.u, tw = C.w - 20 * u;
  const call = lines(S, BAD_CALL[S.lang], tw, FS(S, 12.5), { weight: 700, font: 'mono', maxLines: 2 });
  return { call, tw };
}
function cardBottom(S: Frame, L: PermLay) {
  const u = S.u, C = L.card, { call } = cardLines(S, C);
  const bh = Math.max(30 * u, chipH(S, 13) + 8 * u);
  const h = 10 * u + FS(S, 13) * u + 8 * u + call.length * FS(S, 12.5) * u * 1.25 + 10 * u + FS(S, 14) * u + 6 * u + FS(S, 12.5) * u + 8 * u + FS(S, 12) * u + 8 * u + bh + 10 * u;
  return C.y + Math.min(C.h, h);
}

function drawPipe(S: Frame, L: PermLay, a: number, personHot: number) {
  const { d, pal: p } = S, u = S.u, R = L.pipe;
  const items = [
    { t: S.l('modelo', 'model'), tone: 'w' as const },
    { t: S.l('programa', 'program'), tone: 'ink' as const },
    { t: S.l('persona', 'person'), tone: 'sig' as const, person: true },
    { t: pick(S, [S.l('comprar_boletos', 'buy_tickets'), S.l('comprar', 'buy')], (R.w - 3 * 22 * u) / 4 - 14 * u, 13, 800, 'mono'), tone: 'dat' as const, mono: true },
  ];
  const aw = (tight(S) ? 16 : 26) * u, bh = R.h - 6 * u;
  const widths = items.map((it) => Math.max(d.measure(it.t, { size: FS(S, 13), weight: 800, font: it.mono ? 'mono' : 'ui' }) + 16 * u + (it.person ? 14 * u : 0), 54 * u));
  let scale = 1; const tot = widths.reduce((s, w) => s + w, 0) + 3 * aw;
  if (tot > R.w) scale = (R.w - 3 * aw) / (tot - 3 * aw);
  let x = R.x + Math.max(0, (R.w - Math.min(tot, R.w)) / 2);
  d.withAlpha(a, () => items.forEach((it, i) => {
    const w = widths[i] * scale, r = { x, y: R.y + 3 * u, w, h: bh }, t = tone(S, it.tone);
    const hot = it.person ? personHot : 0;
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(it.tone === 'ink' ? p.ink : t.c, 0.08 + 0.3 * hot), stroke: it.tone === 'ink' ? p.lineStrong : t.c, lw: hot > 0.4 ? 2.6 : 1.5, r: 4 * u });
    let tx = r.x + r.w / 2;
    if (it.person) { const sc = Math.max(1.5, Math.min(2.4 * u, (bh - 8 * u) / 9)); person(S, r.x + 7 * u, r.y + bh / 2 - 4.5 * sc, sc, 'sig'); tx += 6 * u * scale + 3 * u; }
    fitText(S, it.t, tx, r.y + bh / 2, r.w - (it.person ? 22 : 8) * u, 13, { weight: 800, font: it.mono ? 'mono' : 'ui', color: it.tone === 'ink' ? p.ink : t.ink, align: 'center', base: 'middle' });
    if (i < items.length - 1) S.d.arrow(r.x + r.w + 3 * u, r.y + bh / 2, r.x + r.w + aw - 3 * u, r.y + bh / 2, p.lineStrong, 1.8, 7);
    x += w + aw;
  }));
}

function button(S: Frame, r: Rect, label: string, kind: 'approve' | 'reject', state: number, a: number) {
  const { d, pal: p } = S, u = S.u, t = tone(S, kind === 'approve' ? 'dat' : 'err');
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: state > 0.5 ? t.c : alpha(t.c, 0.1), stroke: t.c, lw: 1.8, r: 5 * u });
    glyph(S, kind === 'approve' ? 'check' : 'cross', r.x + 14 * u, r.y + r.h / 2, 13 * u, state > 0.5 ? p.stage : t.ink);
    fitText(S, label, r.x + r.w / 2 + 8 * u, r.y + r.h / 2, r.w - 34 * u, 13.5, { weight: 800, color: state > 0.5 ? p.stage : t.ink, align: 'center', base: 'middle' });
  });
}

export function drawPerm(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  // ── plea: ruego contra permiso ──
  const pleaA = fr(S, 'plea', 0, 0.12) * (1 - (S.on('hitl') ? fr(S, 'hitl', 0, 0.12) : 0));
  if (pleaA > 0.01) d.withAlpha(pleaA, () => {
    const port = S.portrait, gap = 18 * u, cw = port ? A.w : Math.min((A.w - gap) / 2, 360 * u);
    const cards = [
      { a: fr(S, 'plea', 0.05, 0.2), tone: 'lat' as const, dash: true, head: S.l('en el texto: una instrucción', 'in the text: an instruction'), body: S.l('«No gastes más de 300 pesos.»', '“Don’t spend more than 300 pesos.”'), mono: false, foot: S.l('un ruego: el modelo puede fallar', 'a plea: the model can slip') },
      { a: fr(S, 'plea', 0.5, 0.65), tone: 'w' as const, dash: false, head: S.l('en el programa: un permiso', 'in the program: a permission'), body: S.l('si total > 300: detener y preguntar', 'if total > 300: stop and ask'), mono: true, foot: S.l('una regla: se cumple siempre', 'a rule: it always holds') },
    ];
    const hOf = (c: (typeof cards)[number]) => 14 * u + FS(S, 13) * u + 10 * u + paraH(S, c.body, cw - 28 * u, FS(S, 16.5), { weight: 700, font: c.mono ? 'mono' : 'ui' }) + 10 * u + paraH(S, c.foot, cw - 28 * u, FS(S, 13.5), { weight: 700 }) + 12 * u;
    const H = port ? hOf(cards[0]) + gap + hOf(cards[1]) : Math.max(hOf(cards[0]), hOf(cards[1]));
    const x0 = A.x + (A.w - (port ? cw : 2 * cw + gap)) / 2, y0 = A.y + Math.max(0, (A.h - H) / 2);
    cards.forEach((c, k) => {
      const x = port ? x0 : x0 + k * (cw + gap), y = port ? y0 + (k ? hOf(cards[0]) + gap : 0) : y0, h = port ? hOf(c) : H, t = tone(S, c.tone);
      d.withAlpha(c.a, () => {
        card(S, { x, y, w: cw, h }, { tone: c.tone, dash: c.dash ? [6, 4] : undefined, hot: 0.05 });
        let yy = y + 12 * u;
        fitText(S, c.head, x + 14 * u, yy, cw - 28 * u - (c.dash ? 0 : 26 * u), 13, { weight: 800, color: t.ink, base: 'top' });
        if (!c.dash) { const cc = Math.max(2, Math.round(2.2 * u)); lock(S, x + cw - 12 * u - 8 * cc, y + 10 * u, cc); }
        yy += FS(S, 13) * u + 10 * u;
        yy += para(S, c.body, x + 14 * u, yy, cw - 28 * u, FS(S, 16.5), { weight: 700, font: c.mono ? 'mono' : 'ui' }) + 10 * u;
        para(S, c.foot, x + 14 * u, yy, cw - 28 * u, FS(S, 13.5), { weight: 700, color: p.ink2 });
      });
    });
  });

  // ── hitl en adelante: la tubería, la tarjeta de aprobación y lo que pasa después ──
  const hA = S.on('hitl') ? fr(S, 'hitl', 0.05, 0.2) : 0;
  if (hA < 0.01) return;
  const L = permLay(S), dec = decisionNow(S);
  const personHot = Math.max(hold(S, 'hitl', 'hitl-demo', 0.35, 0.5), S.on('hitl-demo') ? (dec === 'wait' ? 0.6 + 0.4 * Math.sin(S.clock * 4) ** 2 : 0.3) : 0);
  drawPipe(S, L, hA, personHot);
  if (!S.on('hitl-demo')) {
    // texto breve bajo la tubería
    const R = { x: L.A.x, y: L.card.y, w: L.A.w, h: L.card.h };
    para(S, S.l('Antes de lo que no se deshace, o de lo que pasa de un límite, el programa se detiene y espera la decisión de una persona.', 'Before anything that cannot be undone, or that goes over a limit, the program stops and waits for a person’s decision.'), R.x + (S.portrait ? 0 : R.w * 0.12), R.y + 10 * u, R.w * (S.portrait ? 1 : 0.76), FS(S, 16), { weight: 700, a: fr(S, 'hitl', 0.5, 0.65), align: 'center' });
    return;
  }
  // tarjeta de aprobación
  const C = L.card, cA = fr(S, 'hitl-demo', 0.15, 0.3), { call } = cardLines(S, C), bot = cardBottom(S, L);
  d.withAlpha(cA, () => {
    card(S, { x: C.x, y: C.y, w: C.w, h: bot - C.y }, { tone: 'sig', hot: dec === 'wait' ? 0.15 : 0.05 });
    let y = C.y + 10 * u;
    fitText(S, S.l('el programa se detuvo y pregunta:', 'the program stopped and asks:'), C.x + 10 * u, y, C.w - 20 * u, 13, { weight: 800, color: tone(S, 'sig').ink, base: 'top' });
    y += FS(S, 13) * u + 8 * u;
    call.forEach((ln, i) => d.text(ln, C.x + 10 * u, y + i * FS(S, 12.5) * u * 1.25, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.ink, base: 'top' }));
    y += call.length * FS(S, 12.5) * u * 1.25 + 10 * u;
    const tot = S.l(`total: 20 × ${PRICE} = ${S.n(20 * PRICE, 0)} pesos`, `total: 20 × ${PRICE} = ${S.n(20 * PRICE, 0)} pesos`);
    fitText(S, tot, C.x + 10 * u, y, C.w - 20 * u, 14, { weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top', a: fr(S, 'hitl-demo', 0.35, 0.5) });
    y += FS(S, 14) * u + 6 * u;
    fitText(S, S.l(`límite sin aprobación: ${LIMIT} pesos`, `limit without approval: ${LIMIT} pesos`), C.x + 10 * u, y, C.w - 20 * u, 12.5, { weight: 700, color: p.ink2, base: 'top', a: fr(S, 'hitl-demo', 0.55, 0.7) });
    const B = permButtons(S)!, ba = fr(S, 'hitl-demo', 0.7, 0.85);
    button(S, B.approve, S.l('Aprobar', 'Approve'), 'approve', dec === 'approve' ? 1 : 0, ba);
    button(S, B.reject, S.l('Rechazar', 'Reject'), 'reject', dec === 'reject' ? 1 : 0, ba);
    // la demostración «pulsa» Rechazar: un puntero que llega al botón
    if (!userDecided(S) && S.on('hitl-reject') && !S.on('try-approve')) {
      const k = clamp(fr(S, 'hitl-reject', 0, 0.18, 'io')), pa = 1 - fr(S, 'hitl-reject', 0.3, 0.4);
      const tx = B.reject.x + B.reject.w * 0.6, ty = B.reject.y + B.reject.h * 0.6, sx = tx + 50 * u, sy = ty + 40 * u;
      const x = sx + (tx - sx) * k, yy = sy + (ty - sy) * k, s = 14 * u;
      if (pa > 0.01) d.withAlpha(pa, () => d.polygon([[x, yy], [x, yy + s], [x + s * 0.3, yy + s * 0.72], [x + s * 0.72, yy + s * 0.72]], { fill: p.ink, stroke: p.stage, lw: 1.5 }));
    }
    if (dec === 'wait' && !S.on('hitl-reject')) {
      const dots = '·'.repeat(1 + (Math.floor(S.clock * 2.5) % 3));
      fitText(S, S.l(`esperando una decisión ${dots}`, `waiting for a decision ${dots}`), C.x + 10 * u, B.reject.y - 5 * u, C.w - 20 * u, 12, { weight: 700, color: p.mute, base: 'bottom', a: ba });
    }
  });
  // lo que pasa después
  if (dec === 'wait') return;
  const O = L.out, rows: { t: string; tone: 'dat' | 'lat' | 'w' | 'err' | 'ink'; mono?: boolean; warn?: boolean }[] = dec === 'reject'
    ? [
      { t: S.l('resultado: rechazado por la persona', 'result: rejected by the person'), tone: 'dat' },
      { t: GOOD_CALL[S.lang], tone: 'lat', mono: true },
      { t: S.l(`2 × ${PRICE} = 190 ≤ ${LIMIT}: se ejecuta`, `2 × ${PRICE} = 190 ≤ ${LIMIT}: it runs`), tone: 'w' },
      { t: S.l('listo: asientos F7 y F8 · 190 pesos', 'done: seats F7 and F8 · 190 pesos'), tone: 'dat' },
    ]
    : [
      { t: S.l('aprobado por la persona', 'approved by the person'), tone: 'ink' },
      { t: S.l(`listo: 20 boletos · ${S.n(20 * PRICE, 0)} pesos`, `done: 20 tickets · ${S.n(20 * PRICE, 0)} pesos`), tone: 'err' },
      { t: S.l('aprobar sin leer las cifras no protege', 'approving without reading the numbers does not protect'), tone: 'err', warn: true },
    ];
  if (dec === 'reject' && tight(S) && S.portrait) rows.splice(2, 1);   // en un teléfono pequeño se omite la cuenta: el último renglón ya dice 190 pesos
  const t0 = userDecided(S) ? clamp((S.clock - ((S.st.ag?.decAt as number) ?? S.clock)) / 0.35) : 1;
  const base = (i: number) => (userDecided(S) ? clamp(t0 * 4 - i) : fr(S, 'hitl-reject', 0.25 + i * 0.15, 0.35 + i * 0.15));
  let y = O.y + (L.port ? 0 : 4 * u);
  fitText(S, S.l('después:', 'next:'), O.x, y, O.w, 13, { weight: 800, color: p.ink2, base: 'top', a: base(0) });
  y += FS(S, 13) * u + 8 * u;
  const size = FS(S, 12.5);
  rows.forEach((r, i) => {
    const a = base(i), t = tone(S, r.tone);
    const ls = lines(S, r.t, O.w - (r.warn ? 34 : 16) * u, size, { weight: 700, font: r.mono ? 'mono' : 'ui', maxLines: tight(S) ? 1 : 2 });
    const h = ls.length * size * u * 1.25 + 10 * u;
    if (y + h > O.y + O.h + 8 * u) return;
    d.withAlpha(a, () => {
      d.rect(O.x, y, O.w, h, { fill: alpha(r.tone === 'ink' ? p.ink : t.c, 0.1), stroke: r.tone === 'ink' ? p.lineStrong : t.c, lw: 1.3, r: 4 * u });
      if (r.warn) glyph(S, 'warn', O.x + 13 * u, y + h / 2, 15 * u, t.ink);
      ls.forEach((ln, j) => d.text(ln, O.x + (r.warn ? 26 : 8) * u, y + 5 * u + j * size * u * 1.25, { size, weight: 700, font: r.mono ? 'mono' : 'ui', color: p.ink, base: 'top' }));
    });
    y += h + 6 * u;
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Niveles de autonomía
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawLevels(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), port = S.portrait;
  const rungs = [
    S.l('solo sugiere: tú haces todo', 'only suggests: you do everything'),
    S.l('actúa con tu aprobación, cada vez', 'acts with your approval, every time'),
    S.l('actúa solo hasta un límite', 'acts alone up to a limit'),
    S.l('actúa solo, del todo', 'acts fully alone'),
  ];
  // en vertical, los rótulos de la flecha van arriba y abajo de la escalera; en horizontal, a un lado
  const sideW = port ? 0 : Math.min(A.w * 0.26, 150 * u), capH = port ? FS(S, 12.5) * u + 10 * u : 0;
  const lw = port ? A.w - 22 * u : Math.min(A.w - sideW - 16 * u, 440 * u);
  const rh = Math.min((A.h - 2 * capH - 10 * u) / 4.4, 60 * u), gap = Math.min(10 * u, rh * 0.18), H = 4 * rh + 3 * gap;
  const x0 = port ? A.x + 22 * u : A.x + (A.w - (lw + 16 * u + sideW)) / 2, y0 = A.y + capH + Math.max(0, (A.h - 2 * capH - H) / 2);
  rungs.forEach((t, i) => {
    const a = fr(S, 'levels', 0.12 + i * 0.13, 0.22 + i * 0.13), y = y0 + (3 - i) * (rh + gap), hot = i === 2 ? fr(S, 'levels', 0.85, 0.95) : 0;
    d.withAlpha(a, () => {
      card(S, { x: x0, y, w: lw, h: rh }, { tone: 'w', hot: 0.04 + 0.12 * i + 0.4 * hot });
      const nb = Math.min(rh - 12 * u, 30 * u);
      d.circle(x0 + 8 * u + nb / 2, y + rh / 2, nb / 2, { fill: alpha(tone(S, 'w').c, 0.2 + 0.15 * i), stroke: tone(S, 'w').c, lw: 1.5 });
      d.text(String(i + 1), x0 + 8 * u + nb / 2, y + rh / 2, { size: FS(S, 14), weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'center', base: 'middle' });
      fitText(S, t, x0 + 16 * u + nb, y + rh / 2, lw - 24 * u - nb, 15.5, { weight: 700, base: 'middle' });
    });
  });
  const sa = fr(S, 'levels', 0.62, 0.78);
  d.withAlpha(sa, () => {
    const up = S.l('más rapidez, menos control', 'more speed, less control'), down = S.l('más control, más atención', 'more control, more attention');
    if (port) {
      const ax = A.x + 8 * u;
      S.d.arrow(ax, y0 + H, ax, y0 + 4 * u, tone(S, 'err').c, 2.4, 9);
      fitText(S, '↑ ' + up, x0, y0 - 6 * u, lw, 12.5, { weight: 800, color: tone(S, 'err').ink, base: 'bottom' });
      fitText(S, '↓ ' + down, x0, y0 + H + 6 * u, lw, 12.5, { weight: 700, color: p.ink2, base: 'top' });
      return;
    }
    const ax = x0 + lw + 26 * u;
    S.d.arrow(ax, y0 + H, ax, y0 + 4 * u, tone(S, 'err').c, 2.4, 9);
    para(S, up, ax + 10 * u, y0, sideW - 22 * u, FS(S, 12.5), { weight: 800, color: tone(S, 'err').ink, maxLines: 3 });
    para(S, down, ax + 10 * u, y0 + H - FS(S, 12.5) * u * 2.6, sideW - 22 * u, FS(S, 12.5), { weight: 700, color: p.ink2, maxLines: 3 });
  });
  const ha = fr(S, 'levels', 0.85, 0.95);
  if (ha > 0.01) {
    // dentro del escalón 3, a la derecha: aquí está el agente de boletos (compra solo hasta 300 pesos)
    const y3 = y0 + (rh + gap), nb = Math.min(rh - 12 * u, 30 * u), free = lw - (16 * u + nb + d.measure(rungs[2], { size: FS(S, 15.5), weight: 700 })) - 18 * u;
    const lab = pick(S, [S.l('aquí: el agente de boletos', 'here: the ticket agent'), S.l('el de boletos', 'the ticket agent')], free - 16 * u, 12.5, 700);
    if (fits(S, lab, free - 14 * u, 12.5, 700)) chip(S, lab, x0 + lw - 8 * u, y3 + rh / 2, 'w', { size: 12.5, a: ha, solid: true, align: 'right' });
    else chip(S, S.l('nivel 3: el agente de boletos', 'level 3: the ticket agent'), x0 + lw - 6 * u, y3, 'w', { size: 12, a: ha, solid: true, align: 'right', maxW: lw * 0.7 });
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Cómo empezar
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawStart(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S);
  const items = [
    S.l('empieza con lo que se deshace: leer, buscar, redactar borradores', 'start with what can be undone: reading, searching, drafting'),
    S.l('permisos mínimos: solo las herramientas que la tarea necesita', 'minimal permissions: only the tools the task needs'),
    S.l('un registro de cada llamada y de su resultado', 'a log of every call and its result'),
    S.l('aprobación de una persona antes de lo irreversible', 'a person’s approval before anything irreversible'),
    S.l('más autonomía solo con evidencia medida', 'more autonomy only with measured evidence'),
  ];
  const w = Math.min(A.w, 620 * u), x = A.x + (A.w - w) / 2, size = FS(S, tight(S) ? 13 : 16), gs = 18 * u;
  const hs = items.map((t) => paraH(S, t, w - gs - 16 * u, size, { weight: 700, maxLines: 2 }));
  const gap = (tight(S) ? 6 : 12) * u, head = FS(S, 13) * u + 12 * u, H = head + hs.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let y = A.y + Math.max(0, (A.h - H) / 2);
  fitText(S, S.l('para empezar con un agente', 'to start with an agent'), x, y, w, 13, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'start-small', 0, 0.12) });
  y += head;
  items.forEach((t, i) => {
    const a = fr(S, 'start-small', 0.08 + i * 0.15, 0.18 + i * 0.15);
    d.withAlpha(a, () => {
      d.circle(x + gs / 2, y + size * u * 0.62, gs / 2, { fill: alpha(tone(S, 'dat').c, 0.18), stroke: tone(S, 'dat').c, lw: 1.4 });
      glyph(S, 'check', x + gs / 2, y + size * u * 0.62, gs * 0.6, tone(S, 'dat').ink);
      para(S, t, x + gs + 12 * u, y, w - gs - 16 * u, size, { weight: 700, maxLines: 2 });
    });
    y += hs[i] + gap;
  });
}
