// Tercer acto: la celda LSTM de juguete sobre la misma línea de pasos: la cinta (estado de la celda) y sus tres compuertas.
import { alpha, clamp, inset, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CUES, KEY, T, lstmRun, sentenceRun, G_DEFAULT, type LstmGates, type LstmRun } from './model';
import { drawInf, quoted, words } from './act-rnn';
import { NCOL, arrow, elbow, fit, fz, lane, mid, num, panel, panelTitle, pct, rich, tok, type Lane, type Part, uu } from './ui';

const sub = (n: number) => String.fromCharCode(0x2080 + n);

export interface LstmView {
  a: number;
  tokA: number[];            // 8
  beltA: number;
  barsA: number;             // contenido de la cinta
  valveA: { f: number; i: number; o: number };
  fv: number[];              // 7: compuerta de olvido que entra en la columna i (i ≥ 1)
  iv: number[];              // 7: compuerta de entrada en la columna i
  ov: number;
  c: number[];               // 7: contenido de la cinta tras cada palabra
  readA: number;
  read: number;              // h_T
  ref: number;
  verdict: LstmRun['verdict'];
  inf: (number | null)[] | null;   // culpa a lo largo de la cinta
  infA: number;
  strong: number;
  hl: number;                // columna resaltada (flores) o −1
  hlA: number;
  blame: number;             // progreso 0..1 de la culpa retrocediendo; < 0: ninguna
  fBlame: number;
}

/** Válvula: caja con una letra y un nivel (0..1) que rellena desde abajo. */
function valve(S: Frame, cx: number, cy: number, letter: string, level: number, a: number, o: { size?: number; hot?: boolean } = {}) {
  const { d, pal: p } = S, u = uu(S), sg = tone(S, 'sig'), s = (o.size ?? 22) * u, r = { x: cx - s / 2, y: cy - s / 2, w: s, h: s };
  d.withAlpha(a, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: sg.c, lw: o.hot ? 3 : 2, r: 3 });
    const hh = Math.max(0, clamp(level) * (s - 4)), top = r.y + 2 + (s - 4 - hh);
    d.rect(r.x + 2, top, s - 4, hh, { fill: alpha(sg.c, 0.55) });
    d.text(letter, cx, cy, { size: fz(S, 13), weight: 800, font: 'mono', color: level > 0.62 ? p.stage : sg.ink, align: 'center', base: 'middle', halo: level > 0.62 ? undefined : undefined });
  });
}

export function drawLstm(S: Frame, L: Lane, v: LstmView) {
  const { d, pal: p } = S, u = uu(S), vert = L.vertical, W = words(S);
  const dat = tone(S, 'dat'), sg = tone(S, 'sig'), err = tone(S, 'err');
  d.withAlpha(v.a, () => {
    if (v.hlA > 0 && v.hl >= 0) {
      const t = L.tok(v.hl), s = L.inf(v.hl);
      const r = vert ? { x: L.area.x - 3 * u, y: t.y - 3 * u, w: L.area.w + 6 * u, h: s.y + s.h - t.y + 6 * u } : { x: Math.min(t.x, s.x) - 3 * u, y: t.y - 4 * u, w: Math.max(t.w, s.w) + 6 * u, h: s.y + s.h - t.y + 8 * u };
      d.withAlpha(v.hlA, () => d.rect(r.x, r.y, r.w, r.h, { fill: alpha(sg.c, 0.07), stroke: sg.c, lw: 1.5, r: 4, dash: [5, 4] }));
    }
    // palabras
    for (let i = 0; i < 8; i++) {
      const a = v.tokA[i]; if (a <= 0) continue;
      const r = L.tok(i), [cx, cy] = mid(r);
      tok(S, i === 7 ? '?' : W[i], cx, cy, { maxW: r.w, h: r.h / u, a, dashed: i === 7 });
    }
    const bc = (i: number): [number, number] => mid(L.st(i));
    // cinta
    if (v.beltA > 0) {
      d.withAlpha(v.beltA, () => {
        const [x0, y0] = bc(0), [x1, y1] = bc(7);
        const lw = 4.5 * u;
        if (!vert) { d.line(x0 - L.step * 0.38, y0, x1 - 12 * u, y0, alpha(dat.c, 0.4), lw); d.polygon([[x1 - 4 * u, y0], [x1 - 15 * u, y0 - 6 * u], [x1 - 15 * u, y0 + 6 * u]], { fill: alpha(dat.c, 0.6) }); }
        else { d.line(x0, y0 - L.step * 0.38, x1, y1 - 14 * u, alpha(dat.c, 0.4), lw); d.polygon([[x1, y1 - 5 * u], [x1 - 6 * u, y1 - 16 * u], [x1 + 6 * u, y1 - 16 * u]], { fill: alpha(dat.c, 0.6) }); }
      });
    }
    // contenido de la cinta
    if (v.barsA > 0) {
      d.withAlpha(v.barsA, () => {
        for (let i = 0; i < NCOL; i++) {
          const r = L.st(i), [cx, cy] = bc(i), val = v.c[i], half = (vert ? r.w : r.h) / 2 - 3 * u, len = Math.min(1, Math.abs(val) / 1.2) * half, bw = (vert ? Math.min(r.h, 30 * u) : Math.min(r.w, 30 * u)) * 0.55;
          if (Math.abs(val) < 0.01) { d.circle(cx, cy, 2 * u, { fill: dat.c }); }
          else if (!vert) { if (val >= 0) d.rect(cx - bw / 2, cy - len, bw, len, { fill: dat.c }); else d.rect(cx - bw / 2, cy, bw, len, { fill: alpha(dat.c, 0.2), stroke: dat.c, lw: 1.6 }); }
          else { if (val >= 0) d.rect(cx, cy - bw / 2, len, bw, { fill: dat.c }); else d.rect(cx - len, cy - bw / 2, len, bw, { fill: alpha(dat.c, 0.2), stroke: dat.c, lw: 1.6 }); }
        }
      });
    }
    // rótulos c₁…c₇ (en teléfono, en el hueco entre la palabra y la cinta, por encima de la flecha de la compuerta de entrada)
    if (v.barsA > 0) {
      d.withAlpha(v.barsA, () => {
        for (let i = 0; i < NCOL; i++) {
          const r = L.st(i), [cx, cy] = bc(i), lx = vert ? r.x - 14 * u : cx, ly = vert ? cy - 10 * u : r.y + r.h + 9 * u;
          d.text(`c${sub(i + 1)}`, lx, ly, { size: fz(S, 12), weight: 600, font: 'mono', color: dat.ink, align: 'center', base: 'middle' });
        }
      });
    }
    // compuertas de entrada (una por palabra)
    if (v.valveA.i > 0) {
      for (let i = 0; i < NCOL; i++) {
        const t = L.tok(i), c = L.cell(i), st = L.st(i), [cx, cy] = mid(c);
        d.withAlpha(v.valveA.i, () => {
          if (!vert) { arrow(S, t.x + t.w / 2, t.y + t.h + 2, cx, cy - 11 * u - 1, p.ink2, { lw: 1.6, head: 5, a: 0.7 }); arrow(S, cx, cy + 11 * u + 1, cx, st.y - 1, p.ink2, { lw: 1.6, head: 5, a: 0.7 }); }
          else { arrow(S, t.x + t.w + 2, cy, cx - 11 * u - 1, cy, p.ink2, { lw: 1.6, head: 5, a: 0.7 }); arrow(S, cx + 11 * u + 1, cy, st.x + st.w / 2 - 5 * u, cy, p.ink2, { lw: 1.6, head: 5, a: 0.7 }); }
        });
        valve(S, cx, cy, 'i', v.iv[i], v.valveA.i, { hot: i === KEY - 1 });
      }
    }
    // compuertas de olvido (sobre la cinta, entre columnas)
    if (v.valveA.f > 0) for (let i = 1; i < NCOL; i++) {
      const [ax, ay] = bc(i - 1), [bx, by] = bc(i);
      valve(S, (ax + bx) / 2, (ay + by) / 2, 'f', v.fv[i], v.valveA.f);
    }
    // compuerta de salida y lectura
    if (v.valveA.o > 0) {
      const [ox, oy] = bc(7);
      valve(S, ox, oy, 'o', v.ov, v.valveA.o);
      if (!vert) arrow(S, ox, oy + 12 * u, ox, L.inf(7).y + 4 * u, p.ink2, { lw: 1.6, head: 5, a: v.valveA.o * 0.7 });
      else arrow(S, ox + 12 * u, oy, L.inf(7).x - 2 * u, oy, p.ink2, { lw: 1.6, head: 5, a: v.valveA.o * 0.7 });
    }
    if (v.readA > 0) {
      const r = L.inf(7), lab = v.verdict === 'ok' ? S.l('plural', 'plural') : v.verdict === 'wrong' ? S.l('singular', 'singular') : v.verdict === 'weak' ? S.l('plural débil', 'weak plural') : S.l('sin señal', 'no signal');
      const verb = v.verdict === 'ok' ? W[7] : v.verdict === 'wrong' ? S.l('está', 'is') : '?';
      const t = v.verdict === 'ok' ? dat : v.verdict === 'wrong' ? err : tone(S, 'mute');
      const w = r.w - 2 * u, h = vert ? Math.min(r.h, 34 * u) : Math.min(r.h * 0.55, 56 * u), cx = r.x + r.w / 2, y = vert ? r.y + r.h / 2 - h / 2 : r.y + 2 * u;
      d.withAlpha(v.readA, () => {
        d.rect(cx - w / 2, y, w, h, { fill: alpha(t.c, 0.14), stroke: t.c, lw: 2, r: 3 });
        fit(S, lab, cx, y + h * (vert ? 0.32 : 0.26), w - 6 * u, { size: 13, weight: 800, color: t.ink, align: 'center' });
        fit(S, `→ ${quoted(S, verb)}`, cx, y + h * (vert ? 0.72 : 0.62), w - 6 * u, { size: 12.5, weight: 600, color: t.ink, align: 'center' });
        if (!vert) fit(S, num(S, v.read, 2), cx, y + h + 14 * u, w, { size: 12.5, weight: 600, color: p.ink2, align: 'center', font: 'mono' });
      });
    }
    // culpa a lo largo de la cinta
    if (v.inf && v.infA > 0) drawInf(S, L, v.inf, v.infA, v.strong);
    if (v.blame >= 0 && v.inf) {
      const k = (NCOL - 1) * (1 - clamp(v.blame)), i0 = Math.floor(k), i1 = Math.min(NCOL - 1, i0 + 1), f = k - i0;
      const f0 = v.inf[i0] ?? 0, f1 = v.inf[i1] ?? 0, val = f0 + (f1 - f0) * f, A = bc(i0), B = bc(i1), x = A[0] + (B[0] - A[0]) * f, y = A[1] + (B[1] - A[1]) * f, E = bc(NCOL - 1);
      d.polyline([[E[0], E[1]], [x, y]], err.c, Math.max(2, 6 * Math.sqrt(clamp(val)) * u), { a: 0.55 });
      d.circle(x, y, (3 + 8 * Math.sqrt(clamp(val))) * u, { fill: alpha(err.c, 0.3), stroke: err.c, lw: 2 });
      d.circle(x, y, 2.2 * u, { fill: err.c });
    }
    // flecha de la cinta al último paso hacia la lectura (de la columna 6 al 7)
    void elbow; void inset;
  });
}

// ── banda ───────────────────────────────────────────────────────────────────
export function chip(S: Frame, x: number, y: number, w: number, letter: string, name: string, val: number, a: number, hot = false) {
  const { d } = S, u = uu(S);
  valve(S, x + 13 * u, y, letter, val, a, { size: 22, hot });
  d.withAlpha(a, () => {
    // nombre y valor en una sola línea: cabe en la banda aunque sea baja (teléfono horizontal)
    rich(S, x + 29 * u, y, [[name, hot ? 'sig' : 'ink2', hot], ['  ', 'ink2'], [num(S, val, 2), 'ink', true]], { size: 12.5, maxW: w - 29 * u });
  });
}

export function bandLstm(S: Frame, L: Lane, id: string, a: number, g: { f: number; i: number; o: number }, run: LstmRun, extraF = 0.97) {
  if (a <= 0) return;
  const u = uu(S), inn = panel(S, L.band, a), W = words(S), lh = fz(S, 13) * u * 1.55;
  const A = (k: string, delay = 0.2) => a * S.reveal(k, delay, 0.5);
  const toy = S.l('celda de juguete', 'toy cell');   // una sola celda escalar con pistas de número ILUSTRATIVAS
  const line = (y: number, parts: Part[], aa: number, o: { size?: number; font?: 'mono' | 'ui' } = {}) => rich(S, inn.x, y, parts, { size: o.size ?? 13, maxW: inn.w, a: aa, font: o.font });
  const chips = (hotKey: string, aa: number, y: number, which: ('f' | 'i' | 'o')[] = ['f', 'i', 'o']) => {
    const names = { f: S.l('olvido', 'forget'), i: S.l('entrada', 'input'), o: S.l('salida', 'output') };
    const cw = inn.w / which.length;
    // una sola compuerta y banda ancha: el valor va a la derecha, a la altura de las dos líneas de texto
    if (which.length === 1 && !S.portrait) { const w = 130 * u; chip(S, inn.x + inn.w - w, inn.y + inn.h * 0.62, w, which[0], names[which[0]], g[which[0]], aa, hotKey === which[0]); return; }
    which.forEach((k, j) => chip(S, inn.x + cw * j, y, cw - 4 * u, k, names[k], g[k], aa, hotKey === k));
  };
  switch (id) {
    case 'lstm-idea': {
      const y = panelTitle(S, inn, S.l('La cinta c: estado de la celda', 'The belt c: the cell state'), 'dat', A('lstm-idea', 0.2), S.l('pistas ilustrativas', 'illustrative cues'));
      line(y + lh * 0.75, [[S.l('lo guardado viaja sin reescribirse', 'what is stored travels without being rewritten'), 'ink2']], A('lstm-idea', 0.7));
      break;
    }
    case 'gate-forget': { const y = panelTitle(S, inn, S.l('Compuerta de olvido f', 'Forget gate f'), 'sig', A(id, 0.2), toy); line(y + lh * 0.55, [[S.l('multiplica lo que ya hay en la cinta', 'multiplies what is already on the belt'), 'ink2']], A(id, 0.5)); chips('f', A(id, 0.7), y + lh * 1.9, ['f']); break; }
    case 'gate-input': { const y = panelTitle(S, inn, S.l('Compuerta de entrada i', 'Input gate i'), 'sig', A(id, 0.2), toy); line(y + lh * 0.55, [[S.l('cuánto de cada palabra nueva se escribe', 'how much of each new word is written'), 'ink2']], A(id, 0.5)); chips('i', A(id, 0.7), y + lh * 1.9, ['i']); break; }
    case 'gate-output': { const y = panelTitle(S, inn, S.l('Compuerta de salida o', 'Output gate o'), 'sig', A(id, 0.2), toy); line(y + lh * 0.55, [[S.l('cuánto de la cinta se lee', 'how much of the belt is read'), 'ink2']], A(id, 0.5)); chips('o', A(id, 0.7), y + lh * 1.9, ['o']); break; }
    case 'gate-learn': {
      const y = panelTitle(S, inn, S.l('Las compuertas se calculan', 'The gates are computed'), 'sig', A(id, 0.2), S.l('valores ilustrativos', 'illustrative values'));
      line(y + lh * 0.7, [['f_t', 'sig', true], [' = σ( ', 'ink2'], ['W_f', 'w', true], [' · [', 'ink2'], ['h_(t−1)', 'dat', true], [', ', 'ink2'], ['x_t', 'lat', true], ['] + b_f )', 'ink2']], A(id, 0.5), { font: 'mono', size: 13 });
      line(y + lh * 1.6, [[S.l('σ: sigmoide, un valor entre 0 y 1', 'σ: sigmoid, a value between 0 and 1'), 'ink2']], A(id, 0.9), { size: 12.5 });
      break;
    }
    case 'gradient': {
      const y = panelTitle(S, inn, S.l('Culpa que llega a «flores»', 'Blame that reaches “flowers”').replace('«flores»', quoted(S, W[1])), 'err', A(id, 0.2));
      const rnn = sentenceRun(G_DEFAULT).infl[KEY];
      line(y + lh * 0.7, [[S.l('por la cinta (f = ', 'along the belt (f = '), 'ink2'], [num(S, extraF, 2), 'sig', true], ['): ', 'ink2'], [pct(S, Math.pow(extraF, T - KEY)), 'err', true]], A(id, 0.6), { size: 13.5 });
      line(y + lh * 1.7, [[S.l('en la RNN: ', 'in the RNN: '), 'ink2'], [pct(S, rnn), 'err', true]], A(id, 1.2), { size: 13.5 });
      break;
    }
    case 'try-gates': {
      chips('', a, inn.y + inn.h * 0.26);
      const lab = run.verdict === 'ok' ? S.l('Lectura plural: la celda recuerda.', 'Plural reading: the cell remembers.') : run.verdict === 'wrong' ? S.l('Lectura singular: «mercado» ganó.', 'Singular reading: “market” won.').replace(/«mercado»|“market”/, quoted(S, W[6])) : run.verdict === 'weak' ? S.l('Plural débil: la pista se apagó a medias.', 'Weak plural: the cue half faded.') : S.l('Sin señal: la pista se perdió.', 'No signal: the cue was lost.');
      const col = run.verdict === 'ok' ? 'dat' : 'err';
      rich(S, inn.x, inn.y + inn.h * 0.64, [[lab, col, true]], { size: 13, maxW: inn.w, a });
      rich(S, inn.x, inn.y + inn.h * 0.9, [[S.l('culpa a «flores»: ', 'blame to “flowers”: ').replace(/«flores»|“flowers”/, quoted(S, W[1])), 'ink2'], [pct(S, run.blame), 'err', true], [S.l('   lectura: ', '   reading: '), 'ink2'], [pct(S, Math.max(0, run.ratio)), 'dat', true], [S.l(' de la ideal', ' of ideal'), 'ink2']], { size: 12.5, maxW: inn.w, a });
      break;
    }
  }
  void CUES; void lane;
}
export type { LstmGates };
