// Vista 9–11 · qué hacer (mit-doc … verify), la evidencia (evidence), verificar según el riesgo (risk), la responsabilidad
// (accountability), el resumen y el puente.
//  · mitigaciones: diagramas ILUSTRATIVOS con los ejemplos de la lección (Pedro Páramo, 684 × 32, los casos de Nueva York).
//  · evidence: Magesh et al. (2024): Lexis+ AI, Westlaw AI-Assisted Research y Ask Practical Law AI alucinaron entre 17 % y 33 %.
//  · accountability: Moffatt v. Air Canada, 2024 BCCRT 149 (el chatbot dijo que el descuento por duelo se podía pedir después
//    del viaje; otra página de la aerolínea lo contradecía; el tribunal rechazó que el chatbot fuera «una entidad legal aparte»).
import { alpha, neu, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ARITH } from './real-data';
import { FS, LH, area, arrow, card, chip, chipH, fitText, fr, mark, para, paraH as paraHeight, smooth, tabs, tight } from './ui';

export function drawEnd(S: Frame) {
  const A = area(S);
  const parts: [string, string | undefined, (S: Frame, A: Rect) => void][] = [
    ['mit-doc', 'evidence', drawMitig], ['evidence', 'risk', drawEvidence], ['risk', 'accountability', drawRisk],
    ['accountability', 'recap', drawAccount], ['recap', 'bridge', drawRecap], ['bridge', undefined, drawBridge],
  ];
  for (const [from, to, fn] of parts) {
    if (!S.on(from)) continue;
    const a = smooth(fr(S, from, 0, 0.08)) * (to ? 1 - smooth(fr(S, to, 0, 0.08)) : 1);
    if (a > 0.01) S.d.withAlpha(a, () => fn(S, A));
  }
}

// ── cuatro palancas ─────────────────────────────────────────────────────────────────────────────────
const LEVERS = ['mit-doc', 'mit-tools', 'mit-format', 'verify'] as const;
function drawMitig(S: Frame, A: Rect) {
  const u = S.u;
  const cur = LEVERS.reduce((k, id, i) => (S.on(id) ? i : k), 0);
  const items: { label: string; t: Tone; on: number; hot: number }[] = [
    { label: S.l('1 · Documento', '1 · Document'), t: 'dat', on: fr(S, 'mit-doc', 0.1, 0.2), hot: cur === 0 ? 1 : 0 },
    { label: S.l('2 · Herramientas', '2 · Tools'), t: 'dat', on: fr(S, 'mit-tools', 0, 0.1), hot: cur === 1 ? 1 : 0 },
    { label: S.l('3 · Salida acotada', '3 · Constrained output'), t: 'dat', on: fr(S, 'mit-format', 0, 0.1), hot: cur === 2 ? 1 : 0 },
    { label: S.l('4 · Verificar', '4 · Verify'), t: 'dat', on: fr(S, 'verify', 0, 0.1), hot: cur === 3 ? 1 : 0 },
  ];
  // en teléfono las cuatro pestañas no caben en una fila: se muestran solo hasta la actual
  const th = tabs(S, A, S.portrait ? items.filter((_, i) => i <= cur).slice(-2) : items);
  const P: Rect = { x: A.x, y: A.y + th + 14 * u, w: A.w, h: A.h - th - 14 * u };
  const fns = [leverDoc, leverTools, leverFormat, leverVerify];
  LEVERS.forEach((id, i) => {
    const next = LEVERS[i + 1];
    const a = S.on(id) ? smooth(fr(S, id, 0, 0.1)) * (next ? 1 - smooth(fr(S, next, 0, 0.08)) : 1) : 0;
    if (a > 0.01) S.d.withAlpha(a, () => fns[i](S, P));
  });
}

/** Caja de diagrama con título y una línea de texto. */
function box(S: Frame, r: Rect, title: string, body: string, t: Tone | undefined, a: number, o: { dash?: boolean; mono?: boolean } = {}) {
  const { pal: p } = S, u = S.u, pad = 10 * u;
  S.d.withAlpha(a, () => {
    card(S, r, { tone: t, dash: o.dash, fill: t ? undefined : p.surface });
    fitText(S, title, r.x + pad, r.y + pad + 5 * u, r.w - 2 * pad, 12, { weight: 700, color: t ? tone(S, t).ink : p.mute });
    para(S, body, r.x + pad, r.y + pad + 18 * u, r.w - 2 * pad, FS(S, S.portrait ? 14 : 16), { weight: 700, font: o.mono ? 'mono' : 'ui', maxLines: 3 });
  });
}
/** Tres cajas en fila (horizontal) o en columna (vertical) unidas por flechas. */
function chain(S: Frame, P: Rect, n = 3) {
  const u = S.u, vert = S.portrait || P.w < 520 * u, gap = 26 * u;
  if (vert) { const h = Math.min((P.h - gap * (n - 1)) / n, 92 * u); return { vert, rs: Array.from({ length: n }, (_, i) => ({ x: P.x, y: P.y + i * (h + gap), w: P.w, h })) }; }
  const w = (P.w - gap * (n - 1)) / n, h = Math.min(P.h * 0.5, 150 * u), y = P.y + Math.max(10 * u, (P.h - h) / 2 - 24 * u);
  return { vert, rs: Array.from({ length: n }, (_, i) => ({ x: P.x + i * (w + gap), y, w, h })) };
}
function link(S: Frame, a: Rect, b: Rect, vert: boolean, k: number, t: Tone = 'ink') {
  const u = S.u;
  if (vert) arrow(S, a.x + a.w / 2, a.y + a.h + 3 * u, b.x + b.w / 2, b.y - 3 * u, { k, tone: t });
  else arrow(S, a.x + a.w + 3 * u, a.y + a.h / 2, b.x - 3 * u, b.y + b.h / 2, { k, tone: t });
}
function foot(S: Frame, P: Rect, y: number, str: string, a: number, t?: Tone) {
  if (y + LH(S, FS(S, 13), 1.4) > P.y + P.h) return;
  para(S, str, P.x, y, P.w, FS(S, 13.5), { weight: 700, color: t ? tone(S, t).ink : S.pal.ink2, a, maxLines: 2 });
}

function leverDoc(S: Frame, P: Rect) {
  const u = S.u, { vert, rs } = chain(S, P);
  const a = [fr(S, 'mit-doc', 0.3, 0.4), fr(S, 'mit-doc', 0.45, 0.55), fr(S, 'mit-doc', 0.6, 0.7)];
  box(S, rs[0], S.l('tu documento', 'your document'), S.l('«Pedro Páramo (1955), novela de Juan Rulfo»', '“Pedro Páramo (1955), a novel by Juan Rulfo”'), 'dat', a[0]);
  box(S, rs[1], S.l('el modelo lo lee', 'the model reads it'), S.l('¿Quién escribió Pedro Páramo?', 'Who wrote Pedro Páramo?'), 'lat', a[1]);
  box(S, rs[2], S.l('responde y cita', 'answers and cites'), 'Juan Rulfo [1]', 'dat', a[2]);
  link(S, rs[0], rs[1], vert, a[1]); link(S, rs[1], rs[2], vert, a[2]);
  foot(S, P, rs[2].y + rs[2].h + 16 * u, S.l('Ilustrativo · RAG, lección 31', 'Illustrative · RAG, lesson 31'), a[2]);
}
function leverTools(S: Frame, P: Rect) {
  const u = S.u, { vert, rs } = chain(S, P), it = ARITH.items[0];
  const a = [fr(S, 'mit-tools', 0.3, 0.4), fr(S, 'mit-tools', 0.45, 0.55), fr(S, 'mit-tools', 0.6, 0.7)];
  box(S, rs[0], S.l('el modelo pide', 'the model asks'), `${it.a} × ${it.b}`, 'lat', a[0], { mono: true });
  box(S, rs[1], S.l('la calculadora calcula', 'the calculator computes'), S.l('programa exacto', 'exact program'), 'w', a[1]);
  box(S, rs[2], S.l('el modelo comunica', 'the model reports'), S.n(it.gold, 0), 'dat', a[2], { mono: true });
  link(S, rs[0], rs[1], vert, a[1]); link(S, rs[1], rs[2], vert, a[2]);
  S.d.withAlpha(a[2], () => mark(S, rs[2].x + rs[2].w - 16 * u, rs[2].y + 16 * u, true, 6));
  foot(S, P, rs[2].y + rs[2].h + 16 * u, S.l(`Solo, Pythia había escrito ${S.n(Number(it.ans), 0)}.`, `On its own, Pythia had written ${S.n(Number(it.ans), 0)}.`), a[2], 'err');
}
function leverFormat(S: Frame, P: Rect) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait;
  const a1 = fr(S, 'mit-format', 0.25, 0.4), a2 = fr(S, 'mit-format', 0.42, 0.55), a3 = fr(S, 'mit-format', 0.7, 0.82);
  const w1 = vert ? P.w : P.w * 0.55;
  // diez códigos válidos y uno inventado que se rechaza
  d.withAlpha(a1, () => {
    fitText(S, S.l('códigos válidos', 'valid codes'), P.x, P.y + 8 * u, w1, 12.5, { weight: 700, color: p.mute });
    const cols = 5, cw = Math.min((w1 - 8 * u * (cols - 1)) / cols, 70 * u), ch = chipH(S, 13);
    for (let i = 0; i < 10; i++) {
      const x = P.x + (i % cols) * (cw + 8 * u), y = P.y + 22 * u + Math.floor(i / cols) * (ch + 8 * u);
      d.rect(x, y, cw, ch, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.2, r: 3 });
      d.text(`A${i + 1}`, x + cw / 2, y + ch / 2, { size: FS(S, 13), weight: 800, font: 'mono', color: tone(S, 'dat').ink, align: 'center', base: 'middle' });
    }
  });
  const yb = P.y + 22 * u + 2 * (chipH(S, 13) + 8 * u) + 10 * u;
  d.withAlpha(a2, () => {
    const c = chip(S, 'A11', P.x, yb + chipH(S, 13) / 2, 'err', { align: 'left', size: 13, dash: true });
    d.line(c.x - 2, c.y + c.h / 2, c.x + c.w + 2, c.y + c.h / 2, tone(S, 'err').c, 2);
    fitText(S, S.l('inventado: el sistema lo rechaza', 'made up: the system rejects it'), c.x + c.w + 10 * u, yb + chipH(S, 13) / 2, w1 - c.w - 10 * u, 13, { weight: 700, color: tone(S, 'err').ink });
  });
  // pedir fuentes: solo sirve si alguien las revisa
  const fx = vert ? P.x : P.x + w1 + 20 * u, fy = vert ? yb + chipH(S, 13) + 24 * u : P.y + 8 * u, fw = vert ? P.w : P.w - w1 - 20 * u;
  if (fy + 60 * u < P.y + P.h) d.withAlpha(a3, () => {
    const h = Math.min(P.y + P.h - fy, 110 * u);
    card(S, { x: fx, y: fy, w: fw, h }, { tone: 'w' });
    fitText(S, S.l('«Fuente: Varghese, 925 F.3d 1339»', '“Source: Varghese, 925 F.3d 1339”'), fx + 10 * u, fy + 18 * u, fw - 20 * u, 13, { weight: 700, font: 'mono' });
    para(S, S.l('Una fuente citada no prueba nada hasta que alguien la busca.', 'A cited source proves nothing until someone looks it up.'), fx + 10 * u, fy + 34 * u, fw - 20 * u, FS(S, 13), { weight: 600, color: p.ink2, maxLines: 3 });
  });
}
function leverVerify(S: Frame, P: Rect) {
  const { pal: p } = S, u = S.u, vert = S.portrait || P.w < 520 * u;
  const a0 = fr(S, 'verify', 0.15, 0.28), a1 = fr(S, 'verify', 0.55, 0.68), a2 = fr(S, 'verify', 0.3, 0.42);
  const gap = 16 * u, w = vert ? P.w : (P.w - gap) / 2, h = Math.min(vert ? (P.h - 2 * gap - 70 * u) / 2 : P.h * 0.62, 130 * u);
  const top: Rect = { x: P.x, y: P.y, w: P.w, h: 52 * u };
  box(S, top, S.l('la respuesta', 'the answer'), S.l('«Varghese es un caso real»', '“Varghese is a real case”'), 'lat', a0);
  const r1: Rect = { x: P.x, y: P.y + 52 * u + gap, w, h }, r2: Rect = vert ? { x: P.x, y: r1.y + h + gap, w, h } : { x: P.x + w + gap, y: r1.y, w, h };
  box(S, r1, S.l('preguntarle al mismo modelo', 'asking the same model'), S.l('«Sí, está en Westlaw». No comprueba nada.', '“Yes, it is on Westlaw.” Checks nothing.'), 'err', a2, { dash: true });
  box(S, r2, S.l('fuente independiente', 'independent source'), S.l('El registro judicial: no aparece.', 'The court record: it is not there.'), 'dat', a1);
  S.d.withAlpha(a2, () => mark(S, r1.x + r1.w - 16 * u, r1.y + 16 * u, false, 6));
  S.d.withAlpha(a1, () => mark(S, r2.x + r2.w - 16 * u, r2.y + 16 * u, true, 6));
  void p;
}

// ── la evidencia ────────────────────────────────────────────────────────────────────────────────────
function drawEvidence(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const h0 = fr(S, 'evidence', 0.04, 0.15), band = fr(S, 'evidence', 0.45, 0.65), zero = fr(S, 'evidence', 0.75, 0.88);
  const hh = para(S, S.l('Herramientas jurídicas que buscan en documentos (2024): respuestas con alucinaciones', 'Legal research tools that search documents (2024): answers with hallucinations'), A.x, A.y, A.w, FS(S, 14), { weight: 800, a: h0, maxLines: 3 });
  const y = S.portrait ? A.y + hh + (tight(S) ? 70 : 96) * u : Math.max(A.y + hh + 80 * u, A.y + A.h * 0.5), x0 = A.x + 8 * u, x1 = A.x + A.w - 8 * u, X = (v: number) => x0 + v * (x1 - x0);
  d.withAlpha(h0, () => {
    d.line(x0, y, x1, y, p.lineStrong, 2);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) { d.line(X(v), y - 5 * u, X(v), y + 5 * u, p.lineStrong, 1.5); d.text(S.lang === 'es' ? `${v * 100} %` : `${v * 100}%`, X(v), y + 10 * u, { size: FS(S, 12), font: 'mono', color: p.mute, align: v === 0 ? 'left' : v === 1 ? 'right' : 'center', base: 'top' }); }
  });
  d.withAlpha(band, () => {
    d.rect(X(0.17), y - 30 * u, (X(0.33) - X(0.17)) * smooth(band), 26 * u, { fill: alpha(tone(S, 'err').c, 0.35), stroke: tone(S, 'err').c, lw: 1.6, r: 3 });
    chip(S, S.l('entre 17 y 33 %', 'between 17 and 33%'), X(0.25), y - 50 * u, 'err', { size: 14 });
  });
  d.withAlpha(zero, () => {
    d.circle(X(0), y, 6 * u, { fill: tone(S, 'dat').c });
    chip(S, S.l('cero: no se logra', 'zero: not reached'), X(0), y + 44 * u, 'dat', { align: 'left', size: 12.5 });
  });
}

// ── verificar según el riesgo ───────────────────────────────────────────────────────────────────────
function drawRisk(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u;
  const rows: { use: string; how: string; n: number; t: Tone; at: number }[] = [
    { use: S.l('Lluvia de ideas', 'Brainstorm'), how: S.l('solo se lee', 'just read it'), n: 1, t: 'dat', at: 0.15 },
    { use: S.l('Informe interno', 'Internal report'), how: S.l('se revisan las cifras clave', 'check the key figures'), n: 2, t: 'w', at: 0.35 },
    { use: S.l('Cita legal o dosis', 'Legal citation or dose'), how: S.l('cada dato, en la fuente', 'every fact, at the source'), n: 3, t: 'err', at: 0.6 },
  ];
  const h0 = fr(S, 'risk', 0.03, 0.12);
  const hh = para(S, S.l('Verificar en proporción al riesgo', 'Verify in proportion to the risk'), A.x + 30 * u, A.y, A.w - 30 * u, FS(S, 15), { weight: 800, a: h0 });
  const top = A.y + hh + 12 * u, rh = Math.min((A.y + A.h - top) / 3, 84 * u);
  // flecha del riesgo a la izquierda
  d.withAlpha(h0, () => {
    d.arrow(A.x + 10 * u, top + 3 * rh - 6 * u, A.x + 10 * u, top + 6 * u, p.ink2, 2, 7 * u);
  });
  rows.forEach((r, i) => {
    const a = fr(S, 'risk', r.at, r.at + 0.12), y = top + (2 - i) * rh;
    const rr: Rect = { x: A.x + 30 * u, y: y + 4 * u, w: A.w - 30 * u, h: rh - 8 * u };
    d.withAlpha(a, () => {
      card(S, rr, { tone: r.t });
      const pad = 12 * u, iw = r.n * 22 * u;
      fitText(S, r.use, rr.x + pad, rr.y + rr.h * 0.34, rr.w - 2 * pad - iw, 15, { weight: 800 });
      fitText(S, r.how, rr.x + pad, rr.y + rr.h * 0.7, rr.w - 2 * pad - iw, 13, { weight: 600, color: tone(S, r.t).ink });
      // lupas: más revisión cuanto más riesgo
      for (let k = 0; k < r.n; k++) {
        const cx = rr.x + rr.w - pad - 8 * u - k * 22 * u, cy = rr.y + rr.h / 2 - 2 * u;
        d.circle(cx, cy, 6 * u, { stroke: tone(S, r.t).c, lw: 2 });
        d.line(cx + 4.5 * u, cy + 4.5 * u, cx + 9 * u, cy + 9 * u, tone(S, r.t).c, 2.4);
      }
    });
  });
}

// ── la responsabilidad ──────────────────────────────────────────────────────────────────────────────
function drawAccount(S: Frame, A: Rect) {
  const { pal: p } = S, u = S.u;
  const a1 = fr(S, 'accountability', 0.15, 0.3), a2 = fr(S, 'accountability', 0.4, 0.55), a3 = fr(S, 'accountability', 0.65, 0.8);
  const cw = Math.min(A.w, 520 * u), cx = A.x + (A.w - cw) / 2, pad = 14 * u;
  const lines: [string, number, number, string?][] = [
    [S.l('Moffatt contra Air Canada · Canadá, 2024', 'Moffatt v. Air Canada · Canada, 2024'), 12.5, a1, p.mute],
    [S.l('El chatbot le dijo a un cliente que podía pedir un descuento por duelo después de viajar. Otra página de la aerolínea decía lo contrario.', 'The chatbot told a customer he could ask for a bereavement discount after traveling. Another page of the airline said otherwise.'), 14.5, a1],
    [S.l('La aerolínea alegó que el chatbot respondía por sí mismo. El tribunal lo rechazó: la empresa responde por todo lo que hay en su sitio.', 'The airline argued the chatbot answered for itself. The tribunal rejected it: the company answers for everything on its website.'), 14.5, a2],
  ];
  const sizes = lines.map(([t, sz]) => paraHeight(S, t, cw - 2 * pad, FS(S, sz), { maxLines: 5 }));
  const need = pad * 2 + sizes.reduce((a, b) => a + b + 10 * u, 0) + chipH(S, 14) + 8 * u;
  const top = S.portrait ? A.y : A.y + Math.max(0, (A.h - need) / 2);
  S.d.withAlpha(a1, () => card(S, { x: cx, y: top, w: cw, h: Math.min(A.y + A.h - top, need) }, { fill: S.pal.surface }));
  let y = top;
  lines.forEach(([t, sz, a, col]) => {
    const h = para(S, t, cx + pad, y + pad, cw - 2 * pad, FS(S, sz), { weight: sz > 13 ? 600 : 700, color: col ?? p.ink, a, maxLines: 5 });
    y += h + 10 * u;
  });
  if (y + chipH(S, 14) + pad < A.y + A.h) chip(S, S.l('la responsabilidad no se delega', 'responsibility cannot be handed off'), cx + cw / 2, y + pad + chipH(S, 14) / 2 - 4 * u, 'w', { size: 14, a: a3, solid: true, maxW: cw - 2 * pad });
}

// ── resumen y puente ────────────────────────────────────────────────────────────────────────────────
function drawRecap(S: Frame, A: Rect) {
  const u = S.u;
  const items: [string, Tone, number][] = [
    [S.l('Escribe lo plausible, no lo verdadero', 'It writes the plausible, not the true'), 'lat', 0.1],
    [S.l('Su duda existe, pero el texto no la muestra', 'Its doubt exists, but the text hides it'), 'w', 0.4],
    [S.l('Verifica en proporción al riesgo', 'Verify in proportion to the risk'), 'dat', 0.7],
  ];
  const bh = Math.min((A.h - 24 * u) / 3, 76 * u), bw = Math.min(A.w, 480 * u), x = A.x + (A.w - bw) / 2;
  const y0 = A.y + (A.h - 3 * bh - 24 * u) / 2;
  items.forEach(([t, tn, at], i) => {
    const a = fr(S, 'recap', at, at + 0.12), r: Rect = { x, y: y0 + i * (bh + 12 * u), w: bw, h: bh };
    S.d.withAlpha(a, () => { card(S, r, { tone: tn, hot: 0.3 }); para(S, t, r.x + 14 * u, r.y + r.h / 2 - LH(S, FS(S, 16), 0.65), r.w - 28 * u, FS(S, 16), { weight: 800, align: 'center', maxLines: 2 }); });
  });
}
function drawBridge(S: Frame, A: Rect) {
  const { d, pal: p } = S, u = S.u, cx = A.x + A.w / 2, cy = A.y + A.h * 0.42, sc = Math.max(4, Math.round((tight(S) ? 4 : 6) * u));
  neu(S, cx - 12 * sc, cy - 20 * sc, { scale: sc, mood: 'think', a: fr(S, 'bridge', 0.1, 0.25) });
  d.withAlpha(fr(S, 'bridge', 0.6, 0.75), () => {
    d.text(S.l('Siguiente', 'Next'), cx, cy + 14 * u, { size: FS(S, 13), weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, S.l('Evaluar sistemas de IA', 'Evaluating AI systems'), cx, cy + 46 * u, A.w, 24, { weight: 800, align: 'center' });
  });
}
