// Vista 5: costo por tarea, costo total y retorno (task-cost … try-roi), y de nuevo con lo medido en el piloto
// (pilot-measure, scale).
// · Costo por tarea (lección 26): 3 500 tokens de entrada × 3 dólares por millón + 300 de salida × 15 = 0.015 dólares.
// · Costo total del primer año: una vez (construir e integrar, 4 000; datos y casos de oro, 2 000) + cada mes (servicio y
//   monitoreo, 70; personas, 400; tokens, 30) × 12 = 12 000. Los tokens: 360, el 3 %.
// · Beneficio: dudas al mes × minutos ÷ 60 × 10 dólares la hora × 12. Retorno = beneficio − costo total.
// ILUSTRATIVO (rotulado «supuestos editables»): todas las cifras salvo los precios de ejemplo por millón de tokens.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { A as AS, MONTHLY, ONCE, TOK, breakEvenMin, costIn, costOut, perTask, year1 } from './model';
import { FS, areaH, card, chip, chipH, fitText, fr, glyph, header, lerp2, money, para, paraH, smooth, tight, win } from './ui';

/** ¿Estamos en la parte del piloto (con lo medido)? */
const measuredPhase = (S: Frame) => S.on('pilot-measure');
const volNow = (S: Frame) => (measuredPhase(S) ? AS.vol : S.on('roi-demo') ? (S.p.vol ?? AS.vol) : AS.vol);
const minNow = (S: Frame) => (measuredPhase(S) ? (S.p.min ?? AS.min) : AS.min);

export function drawCost(S: Frame) {
  const k = measuredPhase(S) ? 5 : S.on('roi-benefit') ? 4 : 3;
  header(S, k, undefined, 1);
  const p1 = win(S, 'task-cost', 'tco-def');
  if (p1 > 0.003 && !measuredPhase(S)) S.d.withAlpha(p1, () => drawPerTask(S));
  const p2 = measuredPhase(S) ? 1 : win(S, 'tco-def');
  if (p2 > 0.003) S.d.withAlpha(p2, () => drawTotals(S));
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// costo por tarea
// ════════════════════════════════════════════════════════════════════════════════════════════════
function drawPerTask(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  const w = Math.min(A.w, 680 * u), x = A.x + (A.w - w) / 2;
  const f = S.l('costo por tarea = tokens de entrada × su precio + tokens de salida × su precio', 'cost per task = input tokens × their price + output tokens × theirs');
  const fs = FS(S, tight(S) ? 14 : 15.5), fh = paraH(S, f, w - 24 * u, fs, { weight: 800 }) + 18 * u;
  const rowH = (port ? 4 : 1.9) * FS(S, 14) * u + (port ? 8 : 14) * u;
  const totH = chipH(S, 15) + 6 * u;
  const total = fh + gap * 1.5 + 2 * rowH + gap + totH;
  let y = A.y + Math.max(0, (A.h - total) / 2);
  d.withAlpha(fr(S, 'task-cost', 0.12, 0.26), () => {
    card(S, { x, y, w, h: fh }, { tone: 'ink', hot: 0.04 });
    para(S, f, x + 12 * u, y + 9 * u, w - 24 * u, fs, { weight: 800, color: p.ink, align: 'center' });
  });
  y += fh + gap * 1.5;
  // las dos partes: entrada y salida (la barra mide los tokens)
  const rows: { lab: string; tok: number; price: number; cost: number; tone: Tone; f: number }[] = [
    { lab: S.l('entrada', 'input'), tok: TOK.tin, price: TOK.pin, cost: costIn, tone: 'sig', f: 0.14 },
    { lab: S.l('salida', 'output'), tok: TOK.tout, price: TOK.pout, cost: costOut, tone: 'lat', f: 0.42 },
  ];
  const labW = Math.max(...rows.map((r) => S.d.measure(r.lab, { size: FS(S, 14), weight: 800 }))) + 14 * u;
  rows.forEach((r) => {
    const a = fr(S, 'task-cost-ex', r.f, r.f + 0.12), t = tone(S, r.tone);
    if (a <= 0.003) return;
    d.withAlpha(a, () => {
      fitText(S, r.lab, x, y + FS(S, 14) * u * 0.6, labW, 14, { weight: 800, color: t.ink, base: 'middle' });
      const bx = x + labW, bw = (w - labW) * (port ? 1 : 0.42), bh = 12 * u;
      d.rect(bx, y + FS(S, 14) * u * 0.6 - bh / 2, Math.max(3, (bw * r.tok) / TOK.tin), bh, { fill: t.c, r: 2 });
      const tok = S.l(`${S.n(r.tok, 0)} tokens × ${r.price} dólares por millón`, `${S.n(r.tok, 0)} tokens × $${r.price} per million`);
      const res = `= ${S.n(r.cost, 4)} ${S.l('dólares', 'dollars')}`;
      if (port) {
        fitText(S, tok, x, y + FS(S, 14) * u * 1.6, w, 13, { weight: 650, color: p.ink, base: 'top' });
        fitText(S, res, x, y + FS(S, 14) * u * 2.7, w, 13, { weight: 800, color: t.ink, base: 'top' });
      } else {
        const tx = bx + bw + 12 * u;
        fitText(S, tok, tx, y + FS(S, 14) * u * 0.6, x + w - tx, 13.5, { weight: 650, color: p.ink, base: 'middle' });
        fitText(S, res, tx, y + FS(S, 14) * u * 1.75, x + w - tx, 13.5, { weight: 800, color: t.ink, base: 'middle' });
      }
    });
    y += rowH;
  });
  y += gap;
  chip(S, S.l(`total: ${S.n(perTask, 3)} dólares por duda, un centavo y medio`, `total: $${S.n(perTask, 3)} per question, a cent and a half`), x + w / 2, y + totH / 2, 'dat', { size: 15, solid: true, a: fr(S, 'task-cost-ex', 0.7, 0.82), maxW: w });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// costo total y retorno: dos barras (costo total y beneficio del primer año) y un panel con las cuentas
// ════════════════════════════════════════════════════════════════════════════════════════════════
interface Lay { bars: Rect; panel: Rect; bw: number; cx: [number, number] }
function lay(S: Frame): Lay {
  const u = S.u, A = areaH(S), gap = (tight(S) ? 10 : 18) * u;
  if (S.portrait) {
    const bh = A.h * (tight(S) ? 0.44 : 0.47);
    const bars = { x: A.x, y: A.y, w: A.w, h: bh };
    const bw = Math.min(70 * u, A.w * 0.2);
    return { bars, panel: { x: A.x, y: A.y + bh + gap, w: A.w, h: A.h - bh - gap }, bw, cx: [A.x + A.w * 0.3, A.x + A.w * 0.72] };
  }
  const bwid = A.w * 0.42;
  const bars = { x: A.x, y: A.y, w: bwid, h: A.h };
  const bw = Math.min(84 * u, bwid * 0.26);
  return { bars, panel: { x: A.x + bwid + gap * 1.4, y: A.y, w: A.w - bwid - gap * 1.4, h: A.h }, bw, cx: [A.x + bwid * 0.3, A.x + bwid * 0.74] };
}

interface Piece { key: 'tokens' | 'build' | 'prep' | 'svc' | 'people'; v: number; tone: Tone; a: number; seg: string; f: number; lab: string; sub?: string }

export function pieces(S: Frame, vol: number): Piece[] {
  const y = year1(vol, AS.min), m = measuredPhase(S);
  const at = (seg: string, f: number) => (m ? 1 : fr(S, seg, f, f + 0.12));
  return [
    { key: 'tokens', v: y.tokens, tone: 'lat', a: 1, seg: 'tco-def', f: 0.06, lab: S.l('Tokens', 'Tokens'), sub: S.l(`${S.n(vol * perTask, 0)} al mes`, `${S.n(vol * perTask, 0)} a month`) },
    { key: 'build', v: y.build, tone: 'w', a: 1, seg: 'tco-once', f: 0.22, lab: S.l('Construir e integrar', 'Building and integrating') },
    { key: 'prep', v: y.prep, tone: 'w', a: 0.55, seg: 'tco-once', f: 0.55, lab: S.l('Datos y casos de oro', 'Data and gold cases') },
    { key: 'svc', v: y.svc, tone: 'sig', a: 0.55, seg: 'tco-month', f: 0.24, lab: S.l('Servicio y monitoreo', 'Hosting and monitoring'), sub: S.l(`${AS.svc} al mes`, `${AS.svc} a month`) },
    { key: 'people', v: y.people, tone: 'sig', a: 1, seg: 'tco-month', f: 0.52, lab: S.l('Personas que revisan', 'People who review'), sub: S.l(`${AS.people} al mes`, `${AS.people} a month`) },
  ].map((pc) => ({ ...pc, a: pc.a, shown: at(pc.seg, pc.f) })) as (Piece & { shown: number })[];
}

function drawTotals(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = lay(S), B = L.bars, m = measuredPhase(S);
  const vol = volNow(S), min = minNow(S), y1 = year1(vol, min);
  // escala: al principio solo el costo (13 000 arriba); con el beneficio, 36 000
  const zoom = m ? 1 : smooth(fr(S, 'roi-benefit', 0.04, 0.3, 'lin'));
  const maxV = lerp2(13000, 36000, zoom);
  const labTop = FS(S, 14) * u * 1.4 + 4 * u, labBot = FS(S, 12.5) * u * 2.6 + 8 * u;
  const base = B.y + B.h - labBot, top = B.y + labTop, H = base - top;
  const hOf = (v: number) => (H * v) / maxV;
  // línea de base
  d.withAlpha(fr(S, 'tco-def', 0.04, 0.16) || (m ? 1 : 0), () => d.line(B.x, base, B.x + B.w, base, p.lineStrong, 1.4));
  // ── barra del costo total ──
  const cx = L.cx[0], bw = L.bw;
  const ghost = m ? 0 : fr(S, 'tco-def', 0.48, 0.6) * (1 - fr(S, 'tco-year', 0.05, 0.2));
  if (ghost > 0.003) d.withAlpha(ghost, () => {
    d.rect(cx - bw / 2, base - hOf(AS.build + AS.prep + 12 * MONTHLY + 12 * AS.vol * perTask), bw, hOf(AS.build + AS.prep + 12 * MONTHLY + 12 * AS.vol * perTask), { stroke: p.lineStrong, lw: 1.4, dash: [5, 4] });
    fitText(S, '?', cx, base - hOf(9000), bw, 22, { weight: 800, color: p.mute, align: 'center', base: 'middle' });
  });
  const ps = pieces(S, vol) as (Piece & { shown: number })[];
  let acc = 0;
  ps.forEach((pc) => {
    const h = hOf(pc.v) * pc.shown;
    if (h <= 0.01) { acc += hOf(pc.v) * pc.shown; return; }
    const t = tone(S, pc.tone), yb = base - acc;
    d.rect(cx - bw / 2, yb - h, bw, Math.max(h, pc.key === 'tokens' ? 2 : 0), { fill: alpha(t.c, pc.a), stroke: p.stage, lw: 0.8 });
    acc += h;
  });
  // marcador de los tokens: una línea que sale de la tajada más delgada
  const tokA = m ? 0 : fr(S, 'tco-def', 0.08, 0.2) * (1 - fr(S, 'roi-benefit', 0, 0.2));
  if (tokA > 0.003) d.withAlpha(tokA, () => {
    const ty = base - Math.max(1, hOf(ps[0].v)) / 2, lx = cx + bw / 2 + 4 * u;
    d.line(lx, ty, lx + 14 * u, ty, p.ink2, 1.2);
    const pct = fr(S, 'tco-year', 0.45, 0.6);
    fitText(S, S.l(`tokens: ${S.n(y1.tokens, 0)}`, `tokens: ${S.n(y1.tokens, 0)}`) + (pct > 0.5 ? ' (3 %)' : ''), lx + 18 * u, ty, B.x + B.w - lx - 18 * u + (S.portrait ? 0 : 30 * u), 12.5, { weight: 800, color: tone(S, 'lat').ink, base: 'middle' });
  });
  // total encima de la barra
  const costShown = ps.reduce((s, pc) => s + pc.v * pc.shown, 0);
  const totA = m ? 1 : fr(S, 'tco-year', 0.08, 0.2);
  fitText(S, S.n(Math.round(costShown), 0), cx, base - hOf(costShown) - 5 * u, bw * 1.8, 14, { weight: 800, color: p.ink, align: 'center', base: 'bottom', a: totA });
  // ── barra del beneficio ──
  const bx = L.cx[1];
  const grow = m ? 1 : fr(S, 'roi-benefit', 0.56, 0.86, 'io');
  if (grow > 0.003) {
    const bh = Math.min(H + labTop * 0.6, hOf(y1.benefit)) * grow;
    if (m) {
      // el beneficio supuesto (seis minutos) queda punteado detrás del medido
      const old = year1(AS.vol, AS.min).benefit;
      d.rect(bx - bw / 2, base - hOf(old), bw, hOf(old), { stroke: alpha(p.ink, 0.5), lw: 1.3, dash: [5, 4] });
      fitText(S, S.l('supuesto', 'assumed'), bx, base - hOf(old) - 5 * u, bw * 1.6, 12.5, { weight: 700, color: p.mute, base: 'bottom', align: 'center', italic: true, a: fr(S, 'pilot-measure', 0.52, 0.62) });
    }
    d.rect(bx - bw / 2, base - bh, bw, bh, { fill: tone(S, 'dat').c });
    fitText(S, S.n(Math.round(y1.benefit), 0), bx, base - bh - 5 * u, bw * 1.8, 14, { weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'bottom', a: clamp((grow - 0.5) * 2) });
  }
  // ── el retorno: la distancia entre las dos barras ──
  const ra = m ? 1 : fr(S, 'roi-return', 0.3, 0.44);
  if (ra > 0.003) {
    const yc = base - hOf(y1.tco), yb = base - Math.min(H + labTop * 0.6, hOf(y1.benefit)), xm = (cx + bx) / 2;
    const pos = y1.ret >= 0, t = tone(S, pos ? 'dat' : 'err');
    d.withAlpha(ra, () => {
      d.line(cx + bw / 2, yc, bx - bw / 2, yc, alpha(p.ink, 0.5), 1.2, [3, 3]);
      d.line(xm, yc, xm, yb, t.c, 2.2);
      d.line(xm - 5 * u, yb, xm + 5 * u, yb, t.c, 2.2);
      d.line(xm - 5 * u, yc, xm + 5 * u, yc, t.c, 2.2);
    });
  }
  // rótulos debajo de las barras
  const lab = (x: number, t1: string, a: number) => d.withAlpha(a, () => {
    const w = Math.min((B.w / 2) * 0.96, 170 * u);
    fitText(S, t1, x, base + 6 * u, w, 12.5, { weight: 800, color: p.ink, base: 'top', align: 'center' });
    fitText(S, S.l('primer año', 'first year'), x, base + 6 * u + FS(S, 12.5) * u * 1.2, w, 12.5, { weight: 600, color: p.mute, base: 'top', align: 'center' });
  });
  lab(cx, S.l('Costo total', 'Total cost'), m ? 1 : fr(S, 'tco-def', 0.5, 0.62));
  lab(bx, S.l('Beneficio', 'Benefit'), m ? 1 : fr(S, 'roi-benefit', 0.5, 0.62));
  // ── el panel ──
  const pa = m ? 0 : win(S, 'tco-def', 'roi-benefit');
  if (pa > 0.003) d.withAlpha(pa, () => drawCostList(S, L.panel, ps, y1.tco));
  const pb = m ? 0 : win(S, 'roi-benefit');
  if (pb > 0.003) d.withAlpha(pb, () => drawRoiPanel(S, L.panel, vol, min));
  if (m) drawMeasuredPanel(S, L.panel, min);
}

/** Lista de lo que se paga, con el total del primer año. */
function drawCostList(S: Frame, P: Rect, ps: (Piece & { shown: number })[], tco: number) {
  const { d, pal: p } = S, u = S.u, compact = S.portrait || tight(S), sz = compact ? 13 : 14;
  const lh = FS(S, sz) * u * (compact ? 1.35 : 1.6);
  let y = P.y;
  fitText(S, S.l('En el primer año, en dólares', 'In the first year, in dollars'), P.x, y, P.w, 12.5, { weight: 700, color: p.mute, base: 'top', italic: true, a: fr(S, 'tco-def', 0.1, 0.2) });
  y += FS(S, 12.5) * u * 1.5;
  const sw = 10 * u, numW = S.d.measure('4 800', { size: FS(S, sz), weight: 800 }) + 4 * u;
  const groups: [string, string, number, number][] = [['tco-once', S.l('Una vez', 'Once'), 1, 3], ['tco-month', S.l('Cada mes, por doce', 'Every month, times twelve'), 3, 5]];
  const row = (pc: Piece & { shown: number }) => {
    if (pc.shown <= 0.003) { y += lh; return; }
    d.withAlpha(pc.shown, () => {
      const t = tone(S, pc.tone), cy = y + lh / 2;
      d.rect(P.x, cy - sw / 2, sw, sw, { fill: alpha(t.c, pc.a), stroke: t.c, lw: 1 });
      const txt = pc.lab + (pc.sub && !compact ? ` (${pc.sub})` : '');
      fitText(S, txt, P.x + sw + 8 * u, cy, P.w - sw - 8 * u - numW - 6 * u, sz, { weight: 650, color: p.ink, base: 'middle' });
      fitText(S, S.n(pc.v, 0), P.x + P.w, cy, numW, sz, { weight: 800, color: p.ink, base: 'middle', align: 'right' });
    });
    y += lh;
  };
  row(ps[0]);
  groups.forEach(([seg, title, i0, i1]) => {
    fitText(S, title, P.x, y + 4 * u, P.w, 12.5, { weight: 800, color: p.ink2, base: 'top', a: fr(S, seg, 0.04, 0.14) });
    y += FS(S, 12.5) * u * 1.3 + 4 * u;
    for (let i = i0; i < i1; i++) row(ps[i]);
  });
  const ta = fr(S, 'tco-year', 0.08, 0.2);
  d.withAlpha(ta, () => {
    d.line(P.x, y + 3 * u, P.x + P.w, y + 3 * u, p.lineStrong, 1.2);
    fitText(S, S.l('Costo total, primer año', 'Total cost, first year'), P.x, y + 6 * u + lh / 2, P.w - numW - 6 * u, sz, { weight: 800, color: p.ink, base: 'middle' });
    fitText(S, S.n(tco, 0), P.x + P.w, y + 6 * u + lh / 2, numW + 20 * u, sz, { weight: 800, color: p.ink, base: 'middle', align: 'right' });
  });
  y += lh + 10 * u;
  const pctA = fr(S, 'tco-year', 0.45, 0.58);
  if (y + chipH(S, 13) <= P.y + P.h) chip(S, S.l('tokens: 3 % del total', 'tokens: 3% of the total'), P.x, y + chipH(S, 13) / 2, 'lat', { size: 13, align: 'left', a: pctA, maxW: P.w });
}

/** Supuestos editables y resultado del retorno. */
function drawRoiPanel(S: Frame, P: Rect, vol: number, min: number) {
  const { d, pal: p } = S, u = S.u, compact = S.portrait || tight(S), sz = compact ? 13 : 14, y1 = year1(vol, min);
  let y = P.y;
  fitText(S, S.l('Supuestos editables', 'Editable assumptions'), P.x, y, P.w, 13, { weight: 800, color: p.ink2, base: 'top', a: fr(S, 'roi-benefit', 0.08, 0.18) });
  y += FS(S, 13) * u * 1.5;
  const items: [string, string, number, boolean?][] = [
    [S.l('Costo de una hora de trabajo', 'Cost of an hour of work'), money(S, AS.h), 0.18],
    [S.l('Minutos ahorrados por duda', 'Minutes saved per question'), S.n(min, 0), 0.34],
    [S.l('Dudas al mes', 'Questions per month'), S.n(vol, 0), 0.7, true],
    [S.l('Costo por duda (tokens)', 'Cost per question (tokens)'), money(S, perTask, { digits: 3 }), 0.84],
    [S.l('Una vez · cada mes', 'Once · every month'), `${S.n(ONCE, 0)} · ${S.n(MONTHLY, 0)}`, 0.84],
  ];
  if (compact) {
    // en teléfono, los supuestos en un párrafo
    const t = S.l(`Hora de trabajo: ${AS.h} dólares · ${S.n(min, 0)} min por duda · ${S.n(vol, 0)} dudas al mes · ${S.n(perTask, 3)} dólares por duda · ${S.n(ONCE, 0)} una vez · ${MONTHLY} al mes`,
      `Hour of work: $${AS.h} · ${S.n(min, 0)} min per question · ${S.n(vol, 0)} questions a month · $${S.n(perTask, 3)} per question · ${S.n(ONCE, 0)} once · ${MONTHLY} a month`);
    const h = para(S, t, P.x, y, P.w, FS(S, 12.5), { weight: 650, color: p.ink, a: fr(S, 'roi-benefit', 0.18, 0.3), maxLines: 3 });
    y += h + 6 * u;
  } else {
    const lh = FS(S, sz) * u * 1.5, numW = S.d.measure('10 dólares', { size: FS(S, sz), weight: 800 }) + 6 * u;
    items.forEach(([lab, val, f, hot]) => {
      const a = fr(S, 'roi-benefit', f, f + 0.1), cy = y + lh / 2;
      d.withAlpha(a, () => {
        if (hot && S.on('roi-demo')) d.rect(P.x - 4 * u, y + 1, P.w + 8 * u, lh - 2, { fill: alpha(tone(S, 'sig').c, 0.12), r: 3 });
        fitText(S, lab, P.x, cy, P.w - numW - 8 * u, sz, { weight: 600, color: p.ink, base: 'middle' });
        fitText(S, val, P.x + P.w, cy, numW + 30 * u, sz, { weight: 800, color: hot ? tone(S, 'sig').ink : p.ink, base: 'middle', align: 'right' });
      });
      y += lh;
    });
    y += 4 * u;
  }
  // beneficio por duda y del año
  const bt = S.l(`Cada duda ahorra ${S.n(min, 0)} min: ${money(S, (min / 60) * AS.h, { digits: 2 })}. Al año: ${S.n(y1.benefit, 0)}.`, `Each question saves ${S.n(min, 0)} min: ${money(S, (min / 60) * AS.h, { digits: 2 })}. Per year: ${S.n(y1.benefit, 0)}.`);
  const bh = para(S, bt, P.x, y, P.w, FS(S, compact ? 12.5 : 13.5), { weight: 700, color: tone(S, 'dat').ink, a: fr(S, 'roi-benefit', 0.52, 0.64), maxLines: 2 });
  y += bh + (compact ? 6 : 10) * u;
  // resultado
  const ra = fr(S, 'roi-return', 0.3, 0.44), pos = y1.ret >= 0;
  const rt = S.l(`Retorno, primer año: ${S.n(y1.benefit, 0)} − ${S.n(y1.tco, 0)} = ${y1.ret >= 0 ? '+' : '−'}${S.n(Math.abs(y1.ret), 0)}`, `First-year return: ${S.n(y1.benefit, 0)} − ${S.n(y1.tco, 0)} = ${y1.ret >= 0 ? '+' : '−'}${S.n(Math.abs(y1.ret), 0)}`);
  chip(S, rt, P.x, y + chipH(S, 14) / 2, pos ? 'dat' : 'err', { size: 14, align: 'left', solid: true, a: ra, maxW: P.w });
  y += chipH(S, 14) + 6 * u;
  const pb = y1.payback;
  const pt = pos ? S.l(`Se recupera en el mes ${Math.ceil(pb - 1e-9)}`, `Paid back in month ${Math.ceil(pb - 1e-9)}`) : S.l('No se recupera en el primer año: se pierde dinero', 'Not paid back in the first year: money is lost');
  if (y + FS(S, sz) * u * 1.3 <= P.y + P.h + 2) {
    glyph(S, pos ? 'clock' : 'warn', P.x + 8 * u, y + FS(S, sz) * u * 0.65, 14 * u, tone(S, pos ? 'dat' : 'err').ink, fr(S, 'roi-return', 0.66, 0.78));
    fitText(S, pt, P.x + 22 * u, y, P.w - 22 * u, sz, { weight: 700, color: p.ink, base: 'top', a: fr(S, 'roi-return', 0.66, 0.78) });
  }
}

/** Con lo medido en el piloto: el supuesto (seis minutos) frente a lo medido, el retorno y la decisión. */
function drawMeasuredPanel(S: Frame, P: Rect, min: number) {
  const { d, pal: p } = S, u = S.u, compact = S.portrait || tight(S), sz = compact ? 13 : 14.5, y1 = year1(AS.vol, min);
  let y = P.y;
  const lh = FS(S, sz) * u * 1.55;
  const ch = fr(S, 'pilot-measure', 0.4, 0.52);
  fitText(S, S.l(`Supuesto: ${AS.min} min ahorrados por duda`, `Assumed: ${AS.min} min saved per question`), P.x, y, P.w, sz, { weight: 650, color: ch > 0.5 ? p.mute : p.ink, base: 'top', a: fr(S, 'pilot-measure', 0.06, 0.16) });
  if (ch > 0.003) d.withAlpha(ch, () => d.line(P.x, y + FS(S, sz) * u * 0.62, P.x + Math.min(P.w, S.d.measure(S.l(`Supuesto: ${AS.min} min ahorrados por duda`, `Assumed: ${AS.min} min saved per question`), { size: FS(S, sz), weight: 650 })), y + FS(S, sz) * u * 0.62, p.mute, 1.5));
  y += lh;
  fitText(S, S.l(`Medido en el piloto: ${S.n(min, min % 1 ? 1 : 0)} min`, `Measured in the pilot: ${S.n(min, min % 1 ? 1 : 0)} min`), P.x, y, P.w, sz, { weight: 800, color: tone(S, 'sig').ink, base: 'top', a: ch });
  y += lh + 4 * u;
  const pos = y1.ret >= 0;
  const rt = S.l(`Retorno, primer año: ${pos ? '+' : '−'}${S.n(Math.abs(y1.ret), 0)} dólares`, `First-year return: ${pos ? '+' : '−'}$${S.n(Math.abs(y1.ret), 0)}`);
  chip(S, rt, P.x, y + chipH(S, 14) / 2, pos ? 'dat' : 'err', { size: 14, align: 'left', solid: true, a: fr(S, 'pilot-measure', 0.62, 0.74), maxW: P.w });
  y += chipH(S, 14) + (compact ? 8 : 14) * u;
  // la decisión: la meta era no perder dinero (tres minutos)
  const da = fr(S, 'scale', 0.04, 0.16);
  if (da <= 0.003) return;
  const goal = breakEvenMin(AS.vol), ok = min >= goal - 1e-9;
  d.withAlpha(da, () => {
    const g = S.l(`Meta: al menos ${S.n(goal, 0)} min por duda`, `Goal: at least ${S.n(goal, 0)} min per question`);
    glyph(S, 'flag', P.x + 8 * u, y + FS(S, sz) * u * 0.65, 15 * u, p.ink2);
    fitText(S, g, P.x + 22 * u, y, P.w - 22 * u, sz, { weight: 700, color: p.ink, base: 'top' });
    y += lh;
    const dec = ok ? S.l('Se amplía a todos, con un responsable', 'Expand to everyone, with an owner') : S.l('Se corrige o se cierra', 'Fix it or shut it down');
    glyph(S, ok ? 'check' : 'cross', P.x + 8 * u, y + FS(S, sz) * u * 0.65, 15 * u, tone(S, ok ? 'dat' : 'err').ink, fr(S, 'scale', 0.14, 0.26));
    const dh = paraH(S, dec, P.w - 22 * u, FS(S, sz), { weight: 800, maxLines: 2 });
    para(S, dec, P.x + 22 * u, y, P.w - 22 * u, FS(S, sz), { weight: 800, color: tone(S, ok ? 'dat' : 'err').ink, a: fr(S, 'scale', 0.14, 0.26), maxLines: 2 });
    y += dh + 8 * u;
    const alt = S.l('Si no la cumpliera: corregir o cerrar. Cerrar a tiempo también es un buen resultado.', 'Had it fallen short: fix it or shut it down. Shutting down in time is a good outcome too.');
    if (ok && y + paraH(S, alt, P.w, FS(S, 12.5), { weight: 600, maxLines: 3 }) <= P.y + P.h + 2) para(S, alt, P.x, y, P.w, FS(S, 12.5), { weight: 600, color: p.mute, a: fr(S, 'scale', 0.5, 0.62), maxLines: 3 });
  });
}

export function costSource(S: Frame): string {
  if (S.on('pilot-measure')) return S.l('Supuestos y medición ilustrativos', 'Illustrative assumptions and measurement');
  if (S.on('tco-def')) return S.l('Supuestos editables, ilustrativos; precios por millón de tokens: los de ejemplo de la lección 26', 'Illustrative, editable assumptions; prices per million tokens: lesson 26’s examples');
  return S.l('Precios de ejemplo de la lección 26 (3 y 15 dólares por millón de tokens)', 'Lesson 26’s example prices ($3 and $15 per million tokens)');
}
