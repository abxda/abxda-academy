// Vistas 6 y 7: preparar los datos (data) y el piloto (pilot-def … metrics): seis semanas, solo las dudas por correo, una
// persona revisa cada respuesta; meta medible (al menos tres minutos ahorrados por duda, lo que hace falta para no perder
// dinero, sin más quejas); línea base medida antes; tres métricas cada semana.
// ILUSTRATIVO (rotulado): los documentos del manual y sus fallas, el plan del piloto y los valores de la línea base.
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, areaH, card, chip, chipH, chipW, fitText, fr, glyph, header, para, paraH, tight, win, type GlyphKind } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 6 · Revisar los datos: completo, al día, sin contradicciones
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawData(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  header(S, 5, undefined, fr(S, 'data', 0, 0.1));
  const intro = S.l('El manual de la tienda, antes de conectarlo a RAG', 'The shop’s manual, before connecting it to RAG');
  fitText(S, intro, A.x, A.y, A.w, 13.5, { weight: 700, color: p.mute, base: 'top', a: fr(S, 'data', 0.05, 0.16), italic: true });
  const top = A.y + FS(S, 13.5) * u * 1.6 + gap * 0.5;
  const cols: { q: string; docs: { t: string; bad?: boolean; old?: boolean }[]; prob: string; f: number }[] = [
    { q: S.l('¿Completo?', 'Complete?'), docs: [{ t: S.l('Motor', 'Motor') }, { t: S.l('Baterías de repuesto', 'Spare batteries'), bad: true }], prob: S.l('falta un documento', 'a document is missing'), f: 0.36 },
    { q: S.l('¿Al día?', 'Up to date?'), docs: [{ t: S.l('Envíos · sin fecha ni responsable', 'Shipping · no date, no owner'), bad: true }], prob: S.l('nadie sabe si sigue vigente', 'no one knows if it still applies'), f: 0.48 },
    { q: S.l('¿Sin contradicciones?', 'No contradictions?'), docs: [{ t: S.l('Garantía: 12 meses', 'Warranty: 12 months'), old: true }, { t: S.l('Garantía: 18 meses', 'Warranty: 18 months') }], prob: S.l('dos versiones que chocan', 'two versions that clash'), f: 0.62 },
  ];
  const n = cols.length, cw = port ? A.w : (A.w - (n - 1) * gap) / n;
  const pad0 = (tight(S) ? 7 : 10) * u, needH = pad0 * 2 + FS(S, 15) * u * 1.4 + 2 * (30 * u + 4 * u) + chipH(S, 12.5) + 10 * u;
  const ch = port ? Math.min(needH, (A.y + A.h - top - (n - 1) * gap) / n) : Math.min(needH, A.y + A.h - top);
  // el grupo se centra en el alto disponible
  const groupH = port ? n * ch + (n - 1) * gap : ch, off = Math.max(0, (A.y + A.h - top - groupH) / 2.5);
  cols.forEach((c, i) => {
    const r: Rect = port ? { x: A.x, y: off + top + i * (ch + gap), w: cw, h: ch } : { x: A.x + i * (cw + gap), y: off + top, w: cw, h: ch };
    const a = fr(S, 'data', c.f, c.f + 0.1);
    if (a <= 0.003) return;
    d.withAlpha(a, () => {
      card(S, r, { tone: 'w', hot: 0.03 });
      const pad = (tight(S) ? 7 : 10) * u;
      fitText(S, c.q, r.x + pad, r.y + pad, r.w - 2 * pad, 15, { weight: 800, color: tone(S, 'w').ink, base: 'top' });
      let y = r.y + pad + FS(S, 15) * u * 1.4;
      const dh = Math.min(30 * u, (r.h - (y - r.y) - pad - chipH(S, 12.5) - 8 * u) / Math.max(1, c.docs.length) - 4 * u);
      const docW = port ? Math.min(r.w - 2 * pad, 300 * u) : r.w - 2 * pad;
      c.docs.forEach((doc, j) => {
        const dy = y + j * (dh + 4 * u);
        if (dh < 14 * u) return;
        const t: Tone = doc.bad || doc.old ? 'err' : 'ink';
        d.rect(r.x + pad, dy, docW, dh, { fill: p.surface, stroke: doc.bad ? tone(S, 'err').c : p.lineStrong, lw: 1.3, dash: doc.bad && i === 0 ? [4, 3] : undefined, r: 3 });
        glyph(S, 'doc', r.x + pad + 10 * u, dy + dh / 2, Math.min(16 * u, dh * 0.7), p.ink2);
        fitText(S, doc.t, r.x + pad + 22 * u, dy + dh / 2, docW - 28 * u, 13, { weight: 650, color: doc.old ? p.mute : p.ink, base: 'middle' });
        if (doc.bad || doc.old) glyph(S, 'warn', r.x + pad + docW - 2 * u, dy + 2 * u, 14 * u, tone(S, t).ink, fr(S, 'data', c.f + 0.06, c.f + 0.14));
      });
      // el problema
      const py = y + c.docs.length * (dh + 4 * u) + 4 * u + chipH(S, 12.5) / 2;
      chip(S, c.prob, r.x + pad, py, 'err', { size: 12.5, align: 'left', maxW: r.w - 2 * pad, a: fr(S, 'data', c.f + 0.06, c.f + 0.14) });
    });
  });
  // el ejemplo: la garantía de doce y de dieciocho meses (lección 31)
  void win; void para; void paraH; void chipW; void alpha;
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// 7 · El piloto
// ════════════════════════════════════════════════════════════════════════════════════════════════
const WEEKS = 6;
export function drawPilot(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 6 : 12) * u;
  header(S, 5, undefined, 1);
  const sz = tight(S) ? 12.5 : 13.5;
  // ── el alcance: correo, una persona revisa ──
  const scope: [GlyphKind, string, number][] = [
    ['mail', S.l('solo las dudas por correo', 'only questions by email'), 0.5],
    ['user', S.l('una persona revisa cada respuesta', 'a person checks every answer'), 0.66],
  ];
  let y = A.y;
  const scH = chipH(S, sz) + 2 * u;
  const oneRow = !port && scope.reduce((w, [, t]) => w + S.d.measure(t, { size: FS(S, sz), weight: 700 }) + 30 * u + gap * 2, 0) <= A.w;
  let sx = A.x;
  scope.forEach(([g, t, f], i) => {
    const a = fr(S, 'pilot-def', f, f + 0.1), w = S.d.measure(t, { size: FS(S, sz), weight: 700 }) + 30 * u;
    const yy = oneRow ? y : y + i * scH;
    glyph(S, g, sx + 9 * u, yy + scH / 2, 15 * u, p.ink2, a);
    fitText(S, t, sx + 22 * u, yy + scH / 2, A.x + A.w - sx - 22 * u, sz, { weight: 700, color: p.ink, base: 'middle', a });
    if (oneRow) sx += w + gap * 2;
  });
  y += (oneRow ? 1 : 2) * scH + gap * (port ? 0.8 : 1.8);
  // ── la línea de tiempo: seis semanas y, en pantallas anchas, la meta al final ──
  const labW = port ? Math.min(A.w * 0.3, 104 * u) : Math.min(A.w * 0.24, 200 * u);
  const flagW = port ? 0 : Math.min(A.w * 0.22, 190 * u);
  const x0 = A.x + labW, x1 = A.x + A.w - flagW - (port ? 0 : gap);
  const colW = (x1 - x0) / WEEKS;
  const tlH = FS(S, 13) * u * 1.4 + 14 * u;
  const tlA = fr(S, 'pilot-def', 0.2, 0.34);
  d.withAlpha(tlA, () => {
    fitText(S, S.l('Piloto', 'Pilot'), A.x, y + tlH / 2, labW - 10 * u, 15, { weight: 800, color: tone(S, 'sig').ink, base: 'middle' });
    for (let k = 0; k < WEEKS; k++) {
      const cx = x0 + k * colW;
      d.rect(cx + 1, y + 3 * u, colW - 2, tlH - 6 * u, { fill: alpha(tone(S, 'sig').c, 0.16), stroke: tone(S, 'sig').c, lw: 1 });
      fitText(S, S.l(`S${k + 1}`, `W${k + 1}`), cx + colW / 2, y + tlH / 2, colW - 4 * u, 12.5, { weight: 800, color: tone(S, 'sig').ink, base: 'middle', align: 'center' });
    }
  });
  if (!port) fitText(S, S.l('seis semanas', 'six weeks'), x0 + (WEEKS * colW) / 2, y - 1 * u, WEEKS * colW, 12.5, { weight: 700, color: p.mute, base: 'bottom', align: 'center', a: fr(S, 'pilot-def', 0.3, 0.42) });
  // la meta: al final de la línea (ancho) o debajo (teléfono)
  const gA = fr(S, 'pilot-goal', 0.42, 0.54);
  const goal = S.l('Meta: al menos 3 min ahorrados por duda, sin más quejas', 'Goal: at least 3 min saved per question, no more complaints');
  if (!port) d.withAlpha(gA, () => {
    glyph(S, 'flag', x1 + gap + 9 * u, y + 10 * u, 16 * u, p.ink2);
    para(S, goal, x1 + gap + 22 * u, y + 1 * u, flagW - 22 * u, FS(S, 12.5), { weight: 750, color: p.ink, maxLines: 4 });
  });
  y += tlH + gap * 0.7;
  if (port) {
    d.withAlpha(gA, () => {
      glyph(S, 'flag', A.x + 9 * u, y + 9 * u, 15 * u, p.ink2);
      para(S, goal, A.x + 22 * u, y + 1 * u, A.w - 22 * u, FS(S, 12.5), { weight: 750, color: p.ink, maxLines: 2 });
    });
    y += paraH(S, goal, A.w - 22 * u, FS(S, 12.5), { weight: 750, maxLines: 2 }) + gap * 0.6;
  }
  // tres rasgos de un piloto
  const traits: [string, number][] = [[S.l('usuarios reales', 'real users'), 0.12], [S.l('un plazo', 'a deadline'), 0.2], [S.l('una meta medible', 'a measurable goal'), 0.3]];
  let tx = A.x;
  const trH = chipH(S, 12.5) + 6 * u;
  traits.forEach(([t, f]) => {
    const w = chipW(S, t, 12.5, 700);
    if (tx + w > A.x + A.w) return;
    chip(S, t, tx, y + trH / 2, 'sig', { size: 12.5, align: 'left', weight: 700, a: fr(S, 'pilot-goal', f, f + 0.1) });
    tx += w + 6 * u;
  });
  y += trH + gap * 0.6;
  // ── la línea base: medida antes de empezar ──
  const bA = fr(S, 'baseline', 0.08, 0.2);
  const bl = S.l('Línea base, medida hoy: 9 min por duda · 12 quejas al mes', 'Baseline, measured today: 9 min per question · 12 complaints a month');
  const blH = paraH(S, bl, A.w - 30 * u, FS(S, sz), { weight: 750, maxLines: 2 }) + 12 * u;
  d.withAlpha(bA, () => {
    card(S, { x: A.x, y, w: A.w - flagW, h: blH }, { tone: 'ink', hot: 0.06 });
    glyph(S, 'clock', A.x + 12 * u, y + blH / 2, 15 * u, p.ink2);
    para(S, bl, A.x + 26 * u, y + 6 * u, A.w - flagW - 32 * u, FS(S, sz), { weight: 750, color: p.ink, maxLines: 2 });
  });
  y += blH + gap;
  // ── las métricas, semana por semana ──
  const rows: [string, string, number][] = [
    [S.l('Calidad', 'Quality'), S.l('casos de oro', 'gold cases'), 0.2],
    [S.l('Negocio', 'Business'), S.l('minutos y quejas', 'minutes, complaints'), 0.5],
    [S.l('Costo', 'Cost'), S.l('por duda', 'per question'), 0.78],
  ];
  const rh = Math.min((A.y + A.h - y) / 3, 48 * u);
  rows.forEach(([t, sub, f], i) => {
    const ry = y + i * rh, a = fr(S, 'metrics', f, f + 0.1);
    d.withAlpha(a, () => {
      d.line(A.x, ry, x1, ry, p.line, 1);
      const two = rh >= FS(S, 13.5) * u * 1.25 + FS(S, 12.5) * u * 1.25 + 6 * u;
      fitText(S, t, A.x, ry + (two ? 4 * u : rh / 2), labW - 6 * u, 13.5, { weight: 800, color: p.ink, base: two ? 'top' : 'middle' });
      if (two) fitText(S, sub, A.x, ry + 4 * u + FS(S, 13.5) * u * 1.25, labW - 6 * u, 12.5, { weight: 600, color: p.mute, base: 'top' });
      for (let k = 0; k < WEEKS; k++) {
        const ka = fr(S, 'metrics', f + 0.02 * k, f + 0.02 * k + 0.06);
        glyph(S, 'check', x0 + k * colW + colW / 2, ry + rh / 2, Math.min(14 * u, colW * 0.5), tone(S, 'dat').ink, ka);
      }
    });
  });
}

export function pilotSource(S: Frame): string {
  if (S.on('pilot-def')) return S.l('Piloto, meta y línea base ilustrativos', 'Illustrative pilot, goal, and baseline');
  return S.l('Documentos ilustrativos (la garantía doble viene de la lección 31)', 'Illustrative documents (the double warranty comes from lesson 31)');
}
