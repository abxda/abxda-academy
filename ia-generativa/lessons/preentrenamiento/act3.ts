// Acto 3 · qué se aprende: mediciones REALES de Pythia-1.4B en 25 puntos de control (ver build-pythia.py y pythia-data.ts).
import { alpha, clamp, lerp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, area, chip, count, fitText, isCompact, layoutChips, nf, para, pieceLabel, provenance, sig, tagText } from './ui';
import { PYTHIA, type PythiaRow } from './pythia-data';

export const ROWS: PythiaRow[] = PYTHIA.rows;
export const N = ROWS.length;
const LAST = N - 1;
/** Primer punto de control en que la decodificación voraz dice «Paris» tras «The capital of France is». */
export const FIRST_FACT = ROWS.findIndex((r) => r.probs.fact.hit);
const MEM_TOKENS = 40;                    // piezas que se generan en cada prueba de memorización (build-pythia.py)
const LN_VOCAB = Math.log(PYTHIA.vocab);  // pérdida de adivinar al azar entre todas las piezas del vocabulario

// ── acceso a los datos con interpolación entre puntos de control ────────────────────────────────────────────────
const at = (k: number) => { const i0 = clamp(Math.floor(k), 0, LAST), i1 = clamp(i0 + 1, 0, LAST); return { i0, i1, f: clamp(k - i0) }; };
const mix = (k: number, g: (r: PythiaRow) => number) => { const { i0, i1, f } = at(k); return lerp(g(ROWS[i0]), g(ROWS[i1]), f); };
export const rowOf = (k: number) => ROWS[clamp(Math.round(k), 0, LAST)];
const xOf = (tokens: number) => (tokens <= 0 ? 0 : 0.07 + 0.93 * clamp((Math.log10(tokens) - 6.2) / (11.5 - 6.2)));
const kx = (k: number) => { const { i0, i1, f } = at(k); return lerp(xOf(ROWS[i0].tokens), xOf(ROWS[i1].tokens), f); };

// indicaciones que se pueden elegir y la respuesta correcta que se mide
export const PROMPT_IDS = ['fact', 'count', 'pattern', 'walk'] as const;
export const PROBE_OF: Record<string, string | null> = { fact: 'fact', count: 'count', pattern: 'pattern', walk: null, opp: 'opp' };
const ANSWER_LABEL: Record<string, string> = { fact: 'Paris', count: '6', pattern: 'casa', opp: 'cold' };

/** Posición (fraccionaria) en la lista de puntos de control que muestra la escena. */
export function kPos(S: Frame): number {
  if (S.on('recite')) return LAST;
  if (S.on('lang') || S.on('kinds')) return LAST;
  if (S.on('pattern')) return lerp(14, LAST, S.at('pattern', 0.5, 7.5, 'lin'));
  if (S.on('try-scrub')) return S.st.k ?? (S.p.ckpt ?? 12);
  if (S.on('facts')) return lerp(14, LAST, S.at('facts', 0.5, 8.5, 'lin'));
  if (S.on('grammar')) return lerp(11, 16, S.at('grammar', 0.4, 6, 'lin'));
  if (S.on('first')) return lerp(0, 11, S.at('first', 0.5, 7.5, 'lin'));
  return 0;
}
/** Indicación vigente (la escena la fija en los segmentos narrados; la persona la elige en el turno). */
export function promptOf(S: Frame): string {
  if (S.between('try-scrub', 'pattern')) return S.p.prompt ?? 'fact';
  if (S.on('pattern')) return 'pattern';
  if (S.on('facts')) return 'fact';
  return 'walk';
}

export function updateScrub(S: Frame): boolean {
  if (!S.between('try-scrub', 'pattern')) { S.st.k = S.on('try-scrub') ? S.st.k : undefined; return false; }
  const target = S.p.ckpt ?? 12;
  S.st.k = S.st.k === undefined ? target : S.st.k + (target - S.st.k) * (1 - Math.exp(-S.dt * 12));
  return Math.round(target) === FIRST_FACT;
}

// ═════════════════════════════════════════════════════════════════════════
// Diseño de las tres piezas: tira de piezas, curva y texto generado
// ═════════════════════════════════════════════════════════════════════════
interface L3 { strip: Rect; gen: Rect; curve: Rect; nTok: number }
function layout3(S: Frame): L3 {
  const u = S.u, r = area(S, 0, 20 * u), compact = isCompact(S), nTok = S.portrait || compact ? 19 : 40;
  const maxW = (S.portrait ? r.w : r.w * 0.6 - 8 * u);
  const probe = layoutChips(S, PYTHIA.passage_pieces.slice(0, nTok), 0, 0, maxW, { size: 13, h: compact ? 20 : 24, rowGap: 11 });
  const headH = 20 * u, legH = compact ? 0 : 20 * u, stripH = headH + probe.h + 8 * u + legH;
  if (S.portrait) {
    const gap = 8 * u, rest = r.h - stripH - gap * 2, curveH = Math.max(120 * u, rest * 0.46);
    return { nTok, strip: { x: r.x, y: r.y, w: r.w, h: stripH }, curve: { x: r.x, y: r.y + stripH + gap, w: r.w, h: curveH }, gen: { x: r.x, y: r.y + stripH + curveH + gap * 2, w: r.w, h: rest - curveH } };
  }
  const colW = r.w * 0.6 - 8 * u;
  return { nTok, strip: { x: r.x, y: r.y, w: colW, h: stripH }, gen: { x: r.x, y: r.y + stripH + 12 * u, w: colW, h: r.h - stripH - 12 * u }, curve: { x: r.x + colW + 16 * u, y: r.y, w: r.w - colW - 16 * u, h: r.h } };
}

// ── tira de piezas teñida por sorpresa ─────────────────────────────────────────────────────────────────────────
function drawStrip(S: Frame, rc: Rect, k: number, nTok: number, a: number) {
  const { d, pal: p } = S, u = S.u, er = tone(S, 'err'), compact = isCompact(S);
  const pieces = PYTHIA.passage_pieces.slice(0, nTok), headH = 20 * u;
  const { pos } = layoutChips(S, pieces, rc.x, rc.y + headH, rc.w, { size: 13, h: compact ? 20 : 24, rowGap: 11 });
  const meanLoss = mix(k, (r) => r.en.loss);
  d.withAlpha(a, () => {
    d.text(S.l('texto de prueba: color y barra = sorpresa del modelo', 'test text: color and bar = the model’s surprise'), rc.x, rc.y + headH - 4 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom', w: rc.w });
    pieces.forEach((t, i) => {
      const c = pos[i];
      const L = i === 0 ? NaN : mix(k, (r) => r.passage[i - 1]);
      const fillA = Number.isNaN(L) ? 0 : 0.05 + 0.78 * clamp(L / 9);
      d.rect(c.x, c.y, c.w, c.h, { fill: Number.isNaN(L) ? p.surface2 : alpha(er.c, fillA), stroke: alpha(p.ink, 0.28), lw: 1, r: 2 });
      d.text(pieceLabel(t), c.x + c.w / 2, c.y + c.h / 2, { size: FS(S, 13), weight: 600, font: 'mono', color: p.ink, align: 'center', base: 'middle' });
      const bh = Number.isNaN(L) ? 0 : clamp(L / 12) * 9 * u;
      if (bh > 0.5) d.rect(c.x + 1, c.y + c.h + 2 * u, c.w - 2, bh, { fill: er.c });
      else d.rect(c.x + 1, c.y + c.h + 2 * u, c.w - 2, 1.5, { fill: p.line });
    });
    // leyenda
    if (!compact) {
      const ly = rc.y + rc.h - 2 * u, sw = 14 * u;
      d.text(S.l('poca', 'little'), rc.x, ly, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
      const tw = d.measure(S.l('poca', 'little'), { size: FS(S, 12), weight: 700 }) + 6 * u;
      [0.08, 0.25, 0.45, 0.65, 0.85].forEach((v, i) => d.rect(rc.x + tw + i * sw, ly - 13 * u, sw - 1, 12 * u, { fill: alpha(er.c, v) }));
      d.text(S.l('mucha sorpresa', 'a lot of surprise'), rc.x + tw + 5 * sw + 4 * u, ly, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom' });
      d.text(`${S.l('pérdida media', 'mean loss')} ${nf(S, meanLoss, 2)}`, rc.x + rc.w, ly, { size: FS(S, 12.5), weight: 800, font: 'mono', color: er.ink, align: 'right', base: 'bottom' });
    }
  });
}

// ── texto que el modelo escribe ────────────────────────────────────────────────────────────────────────────────
const clean = (t: string) => t.replace(/\n+/g, (m) => '↵'.repeat(Math.min(2, m.length)) + ' ').replace(/\s+/g, ' ').trim();
function drawGen(S: Frame, rc: Rect, k: number, prompt: string, a: number, o: { final?: boolean; label?: string } = {}) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat'), dt = tone(S, 'dat'), row = rowOf(k);
  const text = clean(row.gen[prompt] ?? ''), pr = PYTHIA.prompts[prompt] ?? '';
  const sz = FS(S, 13), compact = isCompact(S);
  d.withAlpha(a, () => {
    d.rect(rc.x, rc.y, rc.w, rc.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.3, r: 3 });
    d.rect(rc.x, rc.y, 4 * u, rc.h, { fill: lt.c });
    const title = o.label ?? S.l('Lo que escribe el modelo', 'What the model writes');
    d.text(title, rc.x + 12 * u, rc.y + 6 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
    const stepTxt = `${S.l('paso', 'step')} ${nf(S, row.step, 0)} · ${count(S, row.tokens)} ${S.l('tokens', 'tokens')}`;
    d.text(stepTxt, rc.x + rc.w - 10 * u, rc.y + 6 * u, { size: FS(S, 12.5), weight: 800, font: 'mono', color: lt.ink, align: 'right', base: 'top' });
    // indicación y continuación
    const tx = rc.x + 12 * u, tw = rc.w - 22 * u, ty = rc.y + (compact ? 22 : 28) * u;
    const prompt1 = clean(pr);
    const full = prompt1 + ' ' + text;
    const lines = d.wrap(full, tw, { size: sz, weight: 600, font: 'mono' });
    // se dibuja renglón por renglón para teñir la indicación en gris y la continuación en tinta
    let used = 0, lh = sz * u * 1.34;
    const maxLines = Math.max(2, Math.floor((rc.h - (ty - rc.y) - (PROBE_OF[prompt] && !o.final ? 26 * u : 8 * u)) / lh));
    for (let li = 0; li < Math.min(lines.length, maxLines); li++) {
      let ln = lines[li], x = tx;
      const inP = Math.max(0, Math.min(ln.length, prompt1.length - used));
      if (inP > 0) { d.text(ln.slice(0, inP), x, ty + li * lh, { size: sz, weight: 700, font: 'mono', color: p.ink2, base: 'top' }); x += d.measure(ln.slice(0, inP), { size: sz, weight: 700, font: 'mono' }); }
      const rest = ln.slice(inP);
      if (rest) d.text(rest, x, ty + li * lh, { size: sz, weight: 600, font: 'mono', color: p.ink, base: 'top' });
      used += ln.length + 1;
    }
    if (lines.length > maxLines) d.text('…', tx + tw, ty + (maxLines - 1) * lh, { size: sz, weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'top' });
    // probabilidad de la respuesta correcta
    const pk = PROBE_OF[prompt];
    if (pk && !o.final) {
      const pv = mix(k, (r) => r.probs[pk]?.p ?? 0), by = rc.y + rc.h - 18 * u;
      const lab = `${S.l('probabilidad de', 'probability of')} «${ANSWER_LABEL[pk]}»`;
      d.text(lab, tx, by + 5 * u, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'middle' });
      const lw = d.measure(lab, { size: FS(S, 12), weight: 700 }) + 10 * u, bw = Math.max(40 * u, rc.w - lw - 90 * u);
      d.rect(tx + lw, by, bw, 10 * u, { fill: p.surface2 });
      d.rect(tx + lw, by, Math.max(1.5, bw * pv), 10 * u, { fill: dt.c });
      d.text(`${nf(S, pv * 100, pv < 0.1 ? 1 : 0)} %`, tx + lw + bw + 6 * u, by + 5 * u, { size: FS(S, 12.5), weight: 800, font: 'mono', color: dt.ink, base: 'middle' });
    }
  });
}

// ── curva de pérdida frente a tokens vistos ────────────────────────────────────────────────────────────────────
type Mode = 'loss' | 'bpb' | 'cat';
interface Series { id: string; label: string; t: Tone; y: (r: PythiaRow) => number; marker: 'o' | 's' | 'd' | 't'; dash?: number[] }
function marker(S: Frame, x: number, y: number, kind: Series['marker'], r: number, c: string, fill = true) {
  const d = S.d;
  if (kind === 'o') d.circle(x, y, r, fill ? { fill: c, stroke: S.pal.stage, lw: 1.2 } : { stroke: c, lw: 1.8, fill: S.pal.stage });
  else if (kind === 's') d.rect(x - r, y - r, 2 * r, 2 * r, fill ? { fill: c, stroke: S.pal.stage, lw: 1.2 } : { stroke: c, lw: 1.8, fill: S.pal.stage });
  else if (kind === 'd') d.polygon([[x, y - r * 1.25], [x + r * 1.25, y], [x, y + r * 1.25], [x - r * 1.25, y]], fill ? { fill: c, stroke: S.pal.stage, lw: 1.2 } : { stroke: c, lw: 1.8, fill: S.pal.stage });
  else d.polygon([[x, y - r * 1.2], [x + r * 1.15, y + r * 0.9], [x - r * 1.15, y + r * 0.9]], fill ? { fill: c, stroke: S.pal.stage, lw: 1.2 } : { stroke: c, lw: 1.8, fill: S.pal.stage });
}

function drawCurve(S: Frame, rc: Rect, mode: Mode, k: number, a: number, o: { full?: boolean; legend?: boolean; dots?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, compact = isCompact(S);
  const series: Series[] = mode === 'loss' ? [{ id: 'en', label: S.l('pérdida del texto de prueba', 'test-text loss'), t: 'err', y: (r) => r.en.loss, marker: 'o' }]
    : mode === 'bpb' ? [
      { id: 'en', label: S.l('inglés', 'English'), t: 'sig', y: (r) => r.en.bpb, marker: 'o' },
      { id: 'es', label: S.l('español (misma idea)', 'Spanish (same content)'), t: 'w', y: (r) => r.es.bpb, marker: 's', dash: [6, 4] },
    ] : [
      { id: 'punct', label: S.l('puntuación', 'punctuation'), t: 'sig', y: (r) => r.cat.punct, marker: 'o' },
      { id: 'func', label: S.l('palabras de enlace', 'function words'), t: 'dat', y: (r) => r.cat.func, marker: 's' },
      { id: 'content', label: S.l('otras palabras', 'other words'), t: 'w', y: (r) => r.cat.content, marker: 'd' },
      { id: 'name', label: S.l('con mayúscula', 'capitalized'), t: 'err', y: (r) => r.cat.name, marker: 't' },
    ];
  const yMax = mode === 'bpb' ? 5.5 : 12, yTicks = mode === 'bpb' ? [0, 2, 4] : [0, 4, 8, 12];
  const ts = FS(S, 11.5), lm = (mode === 'bpb' ? 26 : 30) * u, bm = 22 * u, tm = 18 * u + (o.legend ? (series.length > 2 ? (compact ? 0 : 38 * u) : 20 * u) : 0);
  const pl: Rect = { x: rc.x + lm, y: rc.y + tm, w: rc.w - lm - 8 * u, h: rc.h - tm - bm - (compact ? 4 : 18) * u };
  const X = (v: number) => pl.x + pl.w * v, Y = (v: number) => pl.y + pl.h - pl.h * clamp(v / yMax);
  d.withAlpha(a, () => {
    // título y ejes
    const yl = mode === 'bpb' ? S.l('bits por byte', 'bits per byte') : S.l('pérdida (nats por pieza)', 'loss (nats per piece)');
    d.text(yl, rc.x, rc.y + 2 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top' });
    d.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, p.lineStrong, 1.5); d.line(pl.x, pl.y, pl.x, pl.y + pl.h, p.lineStrong, 1.5);
    yTicks.forEach((v) => { d.line(pl.x - 4 * u, Y(v), pl.x + pl.w, Y(v), v === 0 ? p.lineStrong : p.line, 1); d.text(nf(S, v, 0), pl.x - 7 * u, Y(v), { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    const xt: [number, string][] = [[0, '0'], [1e7, count(S, 1e7)], [1e9, count(S, 1e9)], [1e11, count(S, 1e11)]];
    xt.forEach(([v, lab], i) => { const x = X(xOf(v)); d.line(x, pl.y + pl.h, x, pl.y + pl.h + 4 * u, p.lineStrong, 1.5); d.text(lab, i === 0 ? x : Math.min(x, pl.x + pl.w - 14 * u), pl.y + pl.h + 6 * u, { size: ts, font: 'mono', color: p.mute, align: i === 0 ? 'left' : 'center', base: 'top' }); });
    if (!compact) d.text(S.l('tokens vistos (escala logarítmica)', 'tokens seen (log scale)'), pl.x + pl.w, pl.y + pl.h + 6 * u + ts * u + 5 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    // adivinar al azar
    if (mode === 'loss') {
      d.line(pl.x, Y(LN_VOCAB), pl.x + pl.w, Y(LN_VOCAB), p.mute, 1.4, [5, 4]);
      d.text(S.l('azar: ln(50 254)', 'chance: ln(50,254)'), pl.x + pl.w - 4 * u, Y(LN_VOCAB) + 4 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'top', halo: p.stage });
    }
    // series
    series.forEach((s, si) => {
      const c = tone(S, s.t);
      const pts: [number, number][] = ROWS.map((r, i) => [X(xOf(r.tokens)), Y(s.y(r))]);
      if (o.dots) { pts.forEach(([x, y]) => marker(S, x, y, s.marker, 3 * u, c.c, false)); return; }
      const upto = o.full ? LAST : k;
      const lim = pts.slice(0, Math.floor(upto) + 1);
      const { i0, i1, f } = at(upto);
      const cur: [number, number] = [lerp(pts[i0][0], pts[i1][0], f), lerp(pts[i0][1], pts[i1][1], f)];
      if (o.full) { d.polyline(pts, c.c, 2, { dash: s.dash }); }
      else { d.polyline([...lim, cur], c.c, 2.4, { dash: s.dash }); }
      ROWS.forEach((r, i) => { if (o.full ? true : i <= Math.floor(upto)) marker(S, pts[i][0], pts[i][1], s.marker, 2.8 * u, c.c); });
      // punto actual, más grande, y su valor
      if (mode !== 'cat' || si === 0 || true) marker(S, cur[0], cur[1], s.marker, 6 * u, c.c);
      if (mode !== 'cat') {
        const v = mix(upto, s.y), right = cur[0] > pl.x + pl.w * 0.7;
        d.text(nf(S, v, 2), cur[0] + (right ? -9 : 9) * u, cur[1] - (si === 0 ? 11 : -11) * u, { size: FS(S, 13), weight: 800, font: 'mono', color: c.ink, align: right ? 'right' : 'left', base: 'middle', halo: p.stage });
      }
    });
    // leyenda
    if (o.legend) {
      let lx = rc.x, ly = rc.y + 24 * u;
      series.forEach((s, i) => {
        const c = tone(S, s.t), tw = d.measure(s.label, { size: FS(S, 12), weight: 700 }) + 26 * u;
        if (lx + tw > rc.x + rc.w && lx > rc.x) { lx = rc.x; ly += 16 * u; }
        d.line(lx, ly, lx + 16 * u, ly, c.c, 2.4, s.dash);
        marker(S, lx + 8 * u, ly, s.marker, 3.2 * u, c.c);
        d.text(s.label, lx + 20 * u, ly, { size: FS(S, 12), weight: 700, color: c.ink, base: 'middle' });
        lx += tw + 8 * u;
        void i;
      });
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Escenas del acto
// ═════════════════════════════════════════════════════════════════════════
/** Línea de tiempo de los 25 puntos de control (segmento «pythia»). */
function drawTimelineIntro(S: Frame, L: L3, a: number) {
  const { d, pal: p } = S, u = S.u;
  drawCurve(S, L.curve, 'loss', 0, a, { dots: true });
  void p; void d; void u;
}

export function drawAct3Main(S: Frame, alpha_: number) {
  const L = layout3(S), k = kPos(S), prompt = promptOf(S);
  const aIntro = S.reveal('pythia', 0, 0.7), aStart = S.reveal('start', 0, 0.7);
  const mode: Mode = S.on('kinds') ? 'cat' : 'loss';
  const full = S.on('try-scrub') || S.on('kinds');
  S.d.withAlpha(alpha_, () => {
    if (!S.on('start')) { drawTimelineIntro(S, L, aIntro); return; }
    drawStrip(S, L.strip, k, L.nTok, aStart);
    if (mode === 'loss') drawCurve(S, L.curve, 'loss', k, aStart, { full, dots: false });
    else drawCurve(S, L.curve, 'cat', k, S.reveal('kinds', 0, 0.6), { full: true, legend: true });
    if (mode === 'loss') drawGen(S, L.gen, k, prompt, aStart);
    else drawGen(S, L.gen, k, 'walk', S.reveal('kinds', 0, 0.6));
  });
  // el recuadro «azar» ya está en la curva; el rótulo de procedencia va al pie
  provenance(S, S.l('medición real · Pythia-1.4B (EleutherAI) · texto de prueba escrito para la lección · escritura voraz', 'real measurement · Pythia-1.4B (EleutherAI) · test text written for the lesson · greedy decoding'), { a: alpha_ * aIntro });
}

// ── idiomas ─────────────────────────────────────────────────────────────────────────────────────────────────────
export function drawLang(S: Frame, a: number) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 20 * u), compact = isCompact(S);
  const vertical = S.portrait, gap = 14 * u;
  const A: Rect = vertical ? { x: r.x, y: r.y, w: r.w, h: (r.h - gap) * 0.5 } : { x: r.x, y: r.y, w: (r.w - gap) * 0.5, h: r.h };
  const B: Rect = vertical ? { x: r.x, y: r.y + A.h + gap, w: r.w, h: r.h - A.h - gap } : { x: r.x + A.w + gap, y: r.y, w: r.w - A.w - gap, h: r.h };
  const k = LAST, row = ROWS[LAST];
  S.d.withAlpha(a, () => {
    drawCurve(S, A, 'bpb', k, S.reveal('lang', 0, 0.7), { full: true, legend: true });
    // dos indicaciones: la misma pregunta en inglés y en español
    const boxH = (B.h - gap * 0.7) / 2;
    const gens: { id: 'fact' | 'es'; lab: string }[] = [{ id: 'fact', lab: S.l('Pregunta en inglés', 'Question in English') }, { id: 'es', lab: S.l('La misma pregunta en español', 'The same question in Spanish') }];
    gens.forEach((g, i) => {
      const rc: Rect = { x: B.x, y: B.y + i * (boxH + gap * 0.7), w: B.w, h: boxH }, aa = S.reveal('lang', 1.2 + i * 1.6, 0.6);
      drawGen(S, rc, k, g.id, aa, { final: true, label: g.lab });
    });
    void row; void d; void p; void compact;
  });
  provenance(S, S.l('medición real · Pythia-1.4B · las dos versiones del texto de prueba dicen lo mismo, escritas por separado', 'real measurement · Pythia-1.4B · the two versions of the test text say the same thing, written separately'), { a: a * S.reveal('lang', 0, 0.5) });
}

// ── memorización ────────────────────────────────────────────────────────────────────────────────────────────────
export const MEM_IDS = ['mit', 'lorem', 'preamble'] as const;
const MEM_NAME: Record<string, { es: string; en: string }> = { mit: { es: 'Licencia MIT', en: 'MIT license' }, lorem: { es: 'Texto «lorem ipsum»', en: '“lorem ipsum” text' }, preamble: { es: 'Preámbulo de la Constitución de EE. UU.', en: 'Preamble of the U.S. Constitution' } };
export const memShort: Record<string, { es: string; en: string }> = { mit: { es: 'Licencia MIT', en: 'MIT license' }, lorem: { es: '«lorem ipsum»', en: '“lorem ipsum”' }, preamble: { es: 'Preámbulo EE. UU.', en: 'U.S. Preamble' } };

const frac = (r: PythiaRow, id: string) => { const m = r.mem[id]; return m.match / Math.min(m.truth, MEM_TOKENS); };
export function drawMem(S: Frame, a: number) {
  const { d, pal: p } = S, u = S.u, r = area(S, 0, 20 * u), compact = isCompact(S);
  const vertical = S.portrait, gap = 14 * u, sel = S.p.mem ?? 'mit';
  const A: Rect = vertical ? { x: r.x, y: r.y, w: r.w, h: (r.h - gap) * 0.46 } : { x: r.x, y: r.y, w: (r.w - gap) * 0.5, h: r.h };
  const B: Rect = vertical ? { x: r.x, y: r.y + A.h + gap, w: r.w, h: r.h - A.h - gap } : { x: r.x + A.w + gap, y: r.y, w: r.w - A.w - gap, h: r.h };
  const ts = FS(S, 11.5), lm = 30 * u, bm = 22 * u, tm = (compact ? 22 : 46) * u;
  const pl: Rect = { x: A.x + lm, y: A.y + tm, w: A.w - lm - 8 * u, h: A.h - tm - bm - (compact ? 2 : 18) * u };
  const X = (v: number) => pl.x + pl.w * v, Y = (v: number) => pl.y + pl.h - pl.h * clamp(v);
  const tones: Record<string, Tone> = { mit: 'dat', lorem: 'lat', preamble: 'w' };
  const marks: Record<string, 'o' | 's' | 'd'> = { mit: 'o', lorem: 's', preamble: 'd' };
  const aa = S.reveal('recite', 0, 0.6), grow = S.at('recite', 0.3, 4.5, 'lin') * LAST;
  d.withAlpha(a * aa, () => {
    d.text(S.l('fracción del texto original que recita palabra por palabra', 'share of the original text recited word for word'), A.x, A.y + 2 * u, { size: FS(S, 12.5), weight: 700, color: p.ink2, base: 'top', w: A.w });
    // leyenda
    let lx = A.x, ly = A.y + (compact ? 0 : 30) * u + (compact ? 18 * u : 0);
    if (!compact) MEM_IDS.forEach((id) => {
      const c = tone(S, tones[id]), lab = S.L(memShort[id]), tw = d.measure(lab, { size: FS(S, 12), weight: 700 }) + 24 * u;
      if (lx + tw > A.x + A.w && lx > A.x) { lx = A.x; ly += 16 * u; }
      marker(S, lx + 6 * u, ly, marks[id], 3.4 * u, c.c); d.text(lab, lx + 14 * u, ly, { size: FS(S, 12), weight: 700, color: c.ink, base: 'middle' }); lx += tw + 6 * u;
    });
    d.line(pl.x, pl.y + pl.h, pl.x + pl.w, pl.y + pl.h, p.lineStrong, 1.5); d.line(pl.x, pl.y, pl.x, pl.y + pl.h, p.lineStrong, 1.5);
    [0, 0.5, 1].forEach((v) => { d.line(pl.x - 4 * u, Y(v), pl.x + pl.w, Y(v), v === 0 ? p.lineStrong : p.line, 1); d.text(`${nf(S, v * 100, 0)} %`, pl.x - 7 * u, Y(v), { size: ts, font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    const xt: [number, string][] = [[0, '0'], [1e9, count(S, 1e9)], [1e11, count(S, 1e11)]];
    xt.forEach(([v, lab], i) => { const x = X(xOf(v)); d.line(x, pl.y + pl.h, x, pl.y + pl.h + 4 * u, p.lineStrong, 1.5); d.text(lab, i === 0 ? x : Math.min(x, pl.x + pl.w - 14 * u), pl.y + pl.h + 6 * u, { size: ts, font: 'mono', color: p.mute, align: i === 0 ? 'left' : 'center', base: 'top' }); });
    if (!compact) d.text(S.l('tokens vistos (escala logarítmica)', 'tokens seen (log scale)'), pl.x + pl.w, pl.y + pl.h + 6 * u + ts * u + 5 * u, { size: FS(S, 12), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    MEM_IDS.forEach((id) => {
      const c = tone(S, tones[id]), pts = ROWS.map((row) => [X(xOf(row.tokens)), Y(frac(row, id))] as [number, number]);
      const n = Math.floor(grow), { f } = at(grow), cur: [number, number] = n < LAST ? [lerp(pts[n][0], pts[n + 1][0], f), lerp(pts[n][1], pts[n + 1][1], f)] : pts[LAST];
      d.polyline([...pts.slice(0, n + 1), cur], c.c, id === sel ? 3 : 2, { a: id === sel ? 1 : 0.7 });
      pts.slice(0, n + 1).forEach(([x, y]) => marker(S, x, y, marks[id], 2.8 * u, c.c));
      marker(S, cur[0], cur[1], marks[id], 5.5 * u, c.c);
    });
  });
  // la continuación literal
  const row = ROWS[LAST], m = row.mem[sel], truth = PYTHIA.mem_truth[sel], pre = PYTHIA.mem_prompts[sel];
  let same = 0; while (same < truth.length && same < m.gen.length && truth[same] === m.gen[same]) same++;
  const gen = m.gen, ok = gen.slice(0, same), rest = gen.slice(same);
  const aB = S.reveal('recite', 1.0, 0.7);
  d.withAlpha(a * aB, () => {
    const dt = tone(S, 'dat'), er = tone(S, 'err');
    d.rect(B.x, B.y, B.w, B.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.3, r: 3 });
    d.text(S.L(MEM_NAME[sel]), B.x + 10 * u, B.y + 6 * u, { size: FS(S, 12.5), weight: 800, color: p.ink2, base: 'top' });
    d.text(`${S.l('paso', 'step')} ${nf(S, row.step, 0)} · ${count(S, row.tokens)}`, B.x + B.w - 10 * u, B.y + 6 * u, { size: FS(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'top' });
    const sz = FS(S, 12.5), tw = B.w - 20 * u, lh = sz * u * 1.34, ty = B.y + 28 * u;
    const full = clean(pre) + ' ';
    // indicación en gris; después, lo que acierta (verde) y lo que difiere (magenta)
    const parts: [string, string][] = [[full, p.ink2], [clean(ok), dt.ink], [clean(rest), er.ink]];
    // se envuelve el texto completo y se tiñe por tramos de caracteres
    const flat = parts.map((x) => x[0]).join(''), lines = d.wrap(flat, tw, { size: sz, weight: 600, font: 'mono' });
    let pos = 0; const bounds = [parts[0][0].length, parts[0][0].length + parts[1][0].length];
    const maxLines = Math.max(3, Math.floor((B.h - 28 * u - 30 * u) / lh));
    for (let li = 0; li < Math.min(lines.length, maxLines); li++) {
      const ln = lines[li]; let x = B.x + 10 * u;
      let s0 = 0;
      while (s0 < ln.length) {
        const g = pos + s0, col = g < bounds[0] ? parts[0][1] : g < bounds[1] ? parts[1][1] : parts[2][1];
        const lim = g < bounds[0] ? bounds[0] - pos : g < bounds[1] ? bounds[1] - pos : ln.length;
        const seg = ln.slice(s0, Math.min(ln.length, Math.max(lim, s0 + 1)));
        d.text(seg, x, ty + li * lh, { size: sz, weight: 600, font: 'mono', color: col, base: 'top' });
        x += d.measure(seg, { size: sz, weight: 600, font: 'mono' }); s0 += seg.length;
      }
      pos += ln.length + 1;
    }
    const fr = frac(row, sel), n = Math.min(m.match, MEM_TOKENS);
    const msg = S.l(`${n} de ${Math.min(m.truth, MEM_TOKENS)} piezas seguidas idénticas al original`, `${n} of ${Math.min(m.truth, MEM_TOKENS)} consecutive pieces identical to the original`);
    d.text(msg, B.x + 10 * u, B.y + B.h - 8 * u, { size: FS(S, 12.5), weight: 800, color: fr >= 0.99 ? dt.ink : er.ink, base: 'bottom', w: B.w - 20 * u });
  });
  provenance(S, S.l('medición real · Pythia-1.4B · textos libres de derechos · voraz, 40 piezas', 'real measurement · Pythia-1.4B · rights-free texts · greedy, 40 pieces'), { a: a * aa });
  void chip; void fitText; void para; void sig; void tagText;
}
