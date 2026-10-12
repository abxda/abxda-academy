// Escena: Leyes de escala y costos. Siete vistas que se funden una en otra:
//  1 · escalar: las tres perillas (N, D, C), una por segmento        2 · la curva de Kaplan: escala normal → logarítmica → recta
//  3 · cuántas operaciones: un FLOP, 2N de ida, 4N de regreso, 6·N·D  4 · presupuesto fijo: el rectángulo N × D, Gopher y Chinchilla
//  5 · de operaciones a horas, días y dinero (la calculadora)        6 · ¿habilidades emergentes? (ilustrativo, Schaeffer et al.)
//  7 · qué decides tú y el puente a la memoria.
// La escena hace sola cada demostración (cambia la escala, recorre modelos) moviendo sus controles con S.drive; los dos
// «tu turno» son opcionales y solo cuentan lo que hizo la persona (S.touched). Las animaciones van por fracciones de cada segmento.
import type { Frame, SceneFactory } from '../../../../../theme/kit';
import { MODEL_ORDER, type ModelId } from './data';
import { fr } from './ui';
import { drawKnobs, drawQuestions } from './v-intro';
import { drawCurve } from './v-curve';
import { drawFlops } from './v-flops';
import { drawBudget } from './v-budget';
import { drawCalc } from './v-calc';
import { drawClose, drawEmerge } from './v-emerge';

interface St { lgx: number; lgy: number; lastScale?: string; flips: number; lastModel?: string; modelFlash: number }
const fresh = (): St => ({ lgx: 0, lgy: 0, flips: 0, modelFlash: -9 });
const stOf = (S: Frame): St => (S.st as unknown as { q?: St }).q ?? ((S.st as unknown as { q: St }).q = fresh());

const scene: SceneFactory = () => ({
  controls: [
    // (una «choice» y no un interruptor: la interfaz refleja lo que mueve S.drive en sliders y choices, no en toggles)
    {
      id: 'logscale', kind: 'choice', label: { es: 'Escala de la gráfica', en: 'Chart scale' }, value: 'lin', from: 'log-x', to: 'predict',
      options: [{ value: 'lin', label: { es: 'Normal', en: 'Ordinary' } }, { value: 'log', label: { es: 'Logarítmica', en: 'Logarithmic' } }],
    },
    {
      id: 'model', kind: 'choice', label: { es: 'Modelo', en: 'Model' }, value: 'llama', from: 'calc-demo', to: 'emergent',
      options: [
        { value: 'pythia', label: { es: 'Pythia', en: 'Pythia' } },
        { value: 'gpt3', label: { es: 'GPT-3', en: 'GPT-3' } },
        { value: 'chinchilla', label: { es: 'Chinchilla', en: 'Chinchilla' } },
        { value: 'llama', label: { es: 'Llama 3.1', en: 'Llama 3.1' } },
      ],
    },
  ],

  init(S) { (S.st as unknown as { q: St }).q = fresh(); },

  update(S) {
    const q = stOf(S), dt = Math.min(S.dt || 0.016, 0.1);
    // ── escala de la gráfica: por tiempo en la demostración; si la persona tocó el interruptor, lo sigue
    if (S.between('kaplan', 'flop')) {
      const timeX = fr(S, 'log-x', 0.2, 0.75, 'io'), timeY = fr(S, 'log-y', 0.12, 0.65, 'io');
      if (S.between('log-x', 'predict')) S.drive('logscale', fr(S, 'log-x', 0.2, 0.21, 'lin') > 0 ? 'log' : 'lin');
      const touched = S.touched.has('logscale'), cur = String(S.p.logscale ?? 'lin');
      if (!touched) { q.lgx = timeX; q.lgy = timeY; q.lastScale = cur; }
      else {
        const target = S.on('predict') ? 1 : cur === 'log' ? 1 : 0, kE = 1 - Math.exp(-dt * 5);
        q.lgx += (target - q.lgx) * kE;
        if (Math.abs(q.lgx - target) < 0.4) q.lgy += (target - q.lgy) * kE;
        if (cur !== q.lastScale) { q.flips++; q.lastScale = cur; }
        if (q.flips >= 1 && S.between('try-scale', 'predict')) S.complete('scale');
      }
    }
    // ── la calculadora: la demostración recorre Chinchilla, GPT-3 y Pythia; luego la persona elige si quiere
    if (S.between('calc-demo', 'emergent')) {
      if (!S.touched.has('model')) {
        const f = fr(S, 'calc-demo', 0, 1, 'lin');
        const want: ModelId = S.on('try-calc') ? 'pythia' : f < 0.2 ? 'llama' : f < 0.47 ? 'chinchilla' : f < 0.72 ? 'gpt3' : 'pythia';
        S.drive('model', want);
      }
      const m = String(S.p.model ?? 'llama');
      if (m !== q.lastModel) {
        if (q.lastModel !== undefined) q.modelFlash = S.clock;
        if (q.lastModel !== undefined && S.touched.has('model') && S.between('try-calc', 'emergent')) S.complete('calc');
        q.lastModel = m;
      }
    }
    S.st.lgx = q.lgx; S.st.lgy = q.lgy; S.st.flash = q.modelFlash;
    S.st.model = S.between('calc-demo', 'emergent') && MODEL_ORDER.includes(S.p.model) ? S.p.model : 'llama';
  },

  render(S) {
    const d = S.d;
    const out = (k: string) => 1 - S.at(k, 0, 0.5);
    const inn = (k: string) => S.at(k, 0.15, 0.75);
    // vista 1 y tarjetas laterales (se apagan al llegar a «flop»)
    const aK = out('flop');
    if (aK > 0.01) d.withAlpha(aK, () => { drawQuestions(S); drawKnobs(S, { N: S.between('kaplan', 'law') ? 1 : 0 }); });
    const views: [string, string | null, (S: Frame) => void][] = [
      ['kaplan', 'flop', drawCurve],
      ['flop', 'budget', drawFlops],
      ['budget', 'gpu-speed', drawBudget],
      ['gpu-speed', 'emergent', drawCalc],
      ['emergent', 'lens-scratch', drawEmerge],
      ['lens-scratch', null, drawClose],
    ];
    for (const [from, to, fn] of views) {
      if (!S.on(from)) continue;
      const a = (from === 'kaplan' ? 1 : inn(from)) * (to ? out(to) : 1);
      if (a > 0.01) d.withAlpha(a, () => fn(S));
    }
  },
});

export default scene;
