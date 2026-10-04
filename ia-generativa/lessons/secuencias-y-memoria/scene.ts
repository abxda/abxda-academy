// Escena: Secuencias y memoria. La frase «Las flores que compré en el mercado están marchitas», una RNN diminuta (números reales
// de model.ts) desenrollada sobre ella, el empujón que se apaga, el efecto del tamaño de los pesos (escala logarítmica) y una celda
// LSTM de juguete con tres compuertas. Tres turnos: predecir cuánto llega, subir g y ver lo que cuesta, y mover las compuertas.
import { lerp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { CUES, G_DEFAULT, G_MAX, G_MIN, GATES_DEFAULT, KEY, T, curveFor, lstmRun, lstmSteps, sentenceRun, verdictOf } from './model';
import { drawHook, drawRnnLane, drawSequences, bandRnn, type RnnView } from './act-rnn';
import { GOAL_N, GOAL_V, drawPlot, gShown, gq } from './act-plot';
import { bandLstm, drawLstm, type LstmView } from './act-lstm';
import { drawBridge, drawGauge, drawRecap, drawSeq2Seq } from './act-end';
import { NCOL, lane, num, win } from './ui';

const fmt2 = (v: number, l: string) => num({ lang: l } as Frame, v, 2);
const gatesOf = (S: Frame) => ({ f: Number(S.p.f ?? GATES_DEFAULT.f), i: Number(S.p.i ?? GATES_DEFAULT.i), o: Number(S.p.o ?? GATES_DEFAULT.o) });
const last = (S: Frame, ids: string[]) => { let r = ''; for (const id of ids) if (S.on(id)) r = id; return r; };

const scene: SceneFactory = () => ({
  controls: [
    { id: 'guess', kind: 'choice', label: { es: 'Tu predicción', en: 'Your prediction' }, value: 'x', from: 'predict', to: 'wiggle',
      options: [{ value: 'all', label: { es: 'Casi todo', en: 'Almost all' } }, { value: 'half', label: { es: 'Cerca de la mitad', en: 'About half' } }, { value: 'none', label: { es: 'Casi nada', en: 'Almost nothing' } }] },
    { id: 'g', kind: 'slider', label: { es: 'Tamaño de los pesos recurrentes g', en: 'Size of the recurrent weights g' }, min: G_MIN, max: G_MAX, step: 0.05, value: G_DEFAULT, from: 'try-g', to: 'lstm-idea', fmt: fmt2 },
    { id: 'f', kind: 'slider', label: { es: 'Compuerta de olvido f', en: 'Forget gate f' }, min: 0, max: 1, step: 0.01, value: GATES_DEFAULT.f, from: 'try-gates', to: 'success', fmt: fmt2 },
    { id: 'i', kind: 'slider', label: { es: 'Compuerta de entrada i (palabras sin importancia)', en: 'Input gate i (unimportant words)' }, min: 0, max: 1, step: 0.01, value: GATES_DEFAULT.i, from: 'try-gates', to: 'success', fmt: fmt2 },
    { id: 'o', kind: 'slider', label: { es: 'Compuerta de salida o', en: 'Output gate o' }, min: 0, max: 1, step: 0.01, value: GATES_DEFAULT.o, from: 'try-gates', to: 'success', fmt: fmt2 },
  ],

  // Estado interactivo: avanza siempre. render() solo dibuja.
  update(S) {
    if (S.between('predict', 'wiggle') && S.p.guess && S.p.guess !== 'x') S.complete('guess');
    if (S.between('try-g', 'lstm-idea') && curveFor(gq(Number(S.p.g ?? G_DEFAULT))).typ[GOAL_N] >= GOAL_V) S.complete('g');
    if (S.between('try-gates', 'success') && lstmRun(gatesOf(S)).verdict === 'ok') S.complete('gates');
  },

  render(S) {
    const L = lane(S), g = gShown(S);
    // ───── 1 · la frase
    const hookA = 1 - S.at('order', 0, 0.5);
    if (hookA > 0) S.d.withAlpha(hookA, () => drawHook(S));
    // ───── 2 · secuencias
    const seqA = win(S, 'order', 'reader', 0.7, 0.5);
    if (seqA > 0) S.d.withAlpha(seqA, () => drawSequences(S));
    // ───── 3 · la RNN desenrollada
    const rnnA = win(S, 'reader', 'regimes', 0.7, 0.6);
    if (rnnA > 0) {
      const v = rnnView(S);
      drawRnnLane(S, L, v);
      bandRnn(S, L, last(S, ['state', 'recipe', 'loop', 'unroll', 'predict', 'wiggle', 'fade', 'strip', 'bptt', 'vanish']), win(S, 'state', 'regimes', 0.3, 0.6), { guess: String(S.p.guess ?? 'x'), g: G_DEFAULT });
    }
    // ───── 4 · tamaño de los pesos
    drawPlot(S, win(S, 'regimes', 'lstm-idea', 0.7, 0.6));
    // ───── 5 · la LSTM
    const lA = win(S, 'lstm-idea', 'success', 0.7, 0.6);
    if (lA > 0) {
      const { v, shown, run } = lstmView(S);
      drawLstm(S, L, v);
      bandLstm(S, L, last(S, ['lstm-idea', 'gate-forget', 'gate-input', 'gate-output', 'gate-learn', 'gradient', 'try-gates']), lA, shown, run);
    }
    // ───── 6 · éxito y límites
    drawSeq2Seq(S, win(S, 'success', 'limit-short', 0.7, 0.6));
    drawGauge(S, win(S, 'limit-short', 'recap', 0.7, 0.6));
    drawRecap(S, win(S, 'recap', 'bridge', 0.7, 0.6));
    drawBridge(S, S.at('bridge', 0, 0.9));
  },
});

// ═════════════════════════════════════════════════════════════════════════
// Qué muestra la línea de pasos de la RNN en cada momento
// ═════════════════════════════════════════════════════════════════════════
function rnnView(S: Frame): RnnView {
  const run = sentenceRun(G_DEFAULT), ncol = NCOL;
  const tokA = Array.from({ length: 8 }, (_, i) => S.reveal('reader', 0.05 + i * 0.07, 0.4));
  const cellA = Array.from({ length: ncol }, (_, i) => (i < 3 ? S.reveal('reader', 0.7 + i * 0.8, 0.4) : S.reveal('unroll', 0.3 + (i - 3) * 0.45, 0.4)));
  const stA = Array.from({ length: ncol }, (_, i) => (i < 3 ? S.reveal('state', 0.2 + i * 0.55, 0.5) : S.reveal('unroll', 0.7 + (i - 3) * 0.45, 0.45)));
  const linkA = Array.from({ length: ncol }, (_, i) => (i === 0 ? 0 : i < 3 ? S.reveal('state', 0.3 + i * 0.45, 0.4) : S.reveal('unroll', 0.3 + (i - 3) * 0.45, 0.4)));
  const feedA = cellA.slice();
  // empujón en «flores»: viaja de la columna 1 a la 6; la cifra de cada celda aparece al llegar
  const pulseP = 1 + S.at('wiggle', 0.7, 3.7, 'lin') * (ncol - 2);
  const e = S.at('strip', 0.2, 1.4, 'io');
  const inf = Array.from({ length: ncol }, (_, i): number | null => {
    const fwd = i >= KEY - 1 && S.on('wiggle') && pulseP >= i - 0.01 ? run.amp[KEY][i + 1] : null;
    if (S.on('strip')) return lerp(fwd ?? 0, run.infl[i + 1], e);
    return fwd;
  });
  const hlFlores = S.on('predict') ? S.reveal('predict', 0.2, 0.5) * (1 - S.at('bptt', 0, 0.5)) : 0;
  const hlLast = S.on('strip') ? S.reveal('strip', 0.4, 0.5) * (1 - S.at('bptt', 0, 0.5)) : 0;
  return {
    a: win(S, 'reader', 'regimes', 0.7, 0.6), tokA, qMark: true, cellA, feedA, linkA, stA,
    hot: S.between('recipe', 'loop') ? 2 : -1, inf, infA: S.on('wiggle') ? S.reveal('wiggle', 0.3, 0.5) : 0, infLabelA: 1,
    strong: S.between('fade', 'strip') ? ncol - 1 : S.on('strip') ? KEY - 1 : -1,
    hl: [{ col: KEY - 1, a: hlFlores }, { col: ncol - 1, a: hlLast }],
    pulse: S.between('wiggle', 'strip') ? pulseP : -1, pulseA: S.at('wiggle', 0.4, 0.9) * (1 - S.at('wiggle', 4.1, 4.8)),
    predictA: S.on('predict') ? S.reveal('predict', 0.3, 0.6) : 0, layersA: S.on('bptt') ? 1 : 0,
    blame: S.on('vanish') ? S.at('vanish', 0.8, 3.8, 'lin') : -1, g: G_DEFAULT,
  };
}

// ═════════════════════════════════════════════════════════════════════════
// Qué muestra la celda LSTM en cada momento
// ═════════════════════════════════════════════════════════════════════════
const F_LEARN = [0.97, 0.98, 0.96, 0.98, 0.97, 0.98, 0.97];
const I_LEARN = [0.08, 1, 0.12, 0.06, 0.15, 0.09, 0.1];
function lstmView(S: Frame) {
  const n = NCOL, ones = (x: number) => new Array(n).fill(x);
  let fs = ones(1), is = ones(0), o = 1, shownF = 1, shownI = 0;
  let ib = KEY;
  if (S.between('gate-forget', 'gate-input')) { const f = lerp(1, 0.6, S.at('gate-forget', 0.9, 2.6)); fs = ones(f); shownF = f; }
  else if (S.between('gate-input', 'gate-output')) { const i = lerp(1, 0.1, S.at('gate-input', 0.9, 2.6)); is = ones(i); shownI = i; }
  else if (S.between('gate-output', 'gate-learn')) { is = ones(0.1); shownI = 0.1; o = S.at('gate-output', 0.9, 2.6); }
  else if (S.between('gate-learn', 'gradient')) { fs = F_LEARN; is = I_LEARN; shownF = 0.97; shownI = 0.1; }
  else if (S.between('gradient', 'try-gates')) { fs = ones(0.97); is = ones(0.1); shownF = 0.97; shownI = 0.1; }
  else if (S.on('try-gates')) { const gt = gatesOf(S); fs = ones(gt.f); is = ones(gt.i); o = gt.o; shownF = gt.f; shownI = gt.i; }
  void ib;
  const { c, read } = lstmSteps(fs, is, o), ref = Math.tanh(Math.tanh(CUES[KEY - 1])), verdict = verdictOf(read / ref);
  const fvals = fs.slice(), ivals = is.map((v, i) => (i === KEY - 1 ? 1 : v));
  const blameF = S.between('gradient', 'try-gates') ? 0.97 : S.on('try-gates') ? gatesOf(S).f : 0.97;
  const blameVals = Array.from({ length: n }, (_, i) => Math.pow(blameF, T - 1 - i));
  const showBlame = S.on('gradient');
  const run = lstmRun(S.on('try-gates') ? gatesOf(S) : { f: shownF, i: shownI, o });
  const v: LstmView = {
    a: win(S, 'lstm-idea', 'success', 0.7, 0.6), tokA: new Array(8).fill(1), beltA: S.reveal('lstm-idea', 0.2, 0.6), barsA: S.reveal('lstm-idea', 0.6, 0.6),
    valveA: { f: S.on('gate-forget') ? S.reveal('gate-forget', 0.2, 0.5) : 0, i: S.on('gate-input') ? S.reveal('gate-input', 0.2, 0.5) : 0, o: S.on('gate-output') ? S.reveal('gate-output', 0.2, 0.5) : 0 },
    fv: fvals, iv: ivals, ov: o, c: c.slice(1), readA: S.on('gate-output') ? S.reveal('gate-output', 0.4, 0.5) : 0, read, ref, verdict,
    inf: showBlame ? blameVals : null, infA: showBlame ? S.reveal('gradient', 0.3, 0.6) : 0, strong: KEY - 1,
    hl: KEY - 1, hlA: S.reveal('lstm-idea', 0.4, 0.5), blame: S.between('gradient', 'try-gates') ? S.at('gradient', 0.8, 3.6, 'lin') : -1, fBlame: blameF,
  };
  return { v, shown: { f: shownF, i: shownI, o }, run };
}

export default scene;
