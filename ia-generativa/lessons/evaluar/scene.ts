// Escena: Evaluar sistemas de IA. Benchmarks (escala, techo, protocolo, contaminación), evaluación propia (casos de oro y su mezcla),
// calificación (reglas, rúbrica, LLM como juez y sus sesgos, personas), incertidumbre (intervalo de confianza, tamaño de muestra),
// regresión, red teaming y métricas de negocio. Tres turnos interactivos; la estadística de stats.ts es cálculo real.
// Cada acto vive en su archivo act-*.ts y se adapta al dispositivo con regions(S) y S.portrait; el texto del lienzo va con S.l(es, en).
import { clamp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { COMPARE_N_DEFAULT, REAL_EASY, SCORE_B, mixPasses, scoreA } from './data';
import { N_STEPS, REPS, repeated } from './stats';
import { drawBench, drawClaim, drawHook, drawScale } from './act-bench';
import { drawContam, drawContamGrids, drawGoodhart, drawGsm1k } from './act-contam';
import { drawGold, drawMix } from './act-own';
import { drawBias, drawBias2, drawGrade, drawHuman, drawJudge } from './act-judge';
import { drawCI, drawCompare, drawNoise, drawProve } from './act-uncert';
import { drawBridge, drawBusiness, drawDrift, drawRecap, drawRedTeam, drawRegress } from './act-ops';

const nIdx = (S: Frame) => clamp(Math.round(S.p.nidx ?? COMPARE_N_DEFAULT), 0, N_STEPS.length - 1);

const scene: SceneFactory = () => ({
  controls: [
    { id: 'seen', kind: 'slider', label: { es: 'Parte del examen que A vio al entrenarse', en: 'Share of the exam A saw in training' }, min: 0, max: 40, step: 5, value: 0, from: 'try1', to: 'goodhart', fmt: (v) => `${v} %` },
    { id: 'mix', kind: 'slider', label: { es: 'Casos fáciles en tu conjunto', en: 'Easy cases in your set' }, min: 0, max: 100, step: 5, value: 50, from: 'try2', to: 'grade', fmt: (v) => `${v} %` },
    { id: 'nidx', kind: 'slider', label: { es: 'Casos en la evaluación', en: 'Cases in the evaluation' }, min: 0, max: N_STEPS.length - 1, step: 1, value: COMPARE_N_DEFAULT, from: 'try3', to: 'prove', fmt: (v, l) => N_STEPS[v].toLocaleString(l === 'es' ? 'es-MX' : 'en-US') },
    { id: 'paired', kind: 'toggle', label: { es: 'Los dos sistemas, con los mismos casos', en: 'Both systems on the same cases' }, value: true, from: 'try3', to: 'prove' },
    { id: 'draw', kind: 'button', primary: true, label: { es: 'Otra evaluación', en: 'Another evaluation' }, from: 'try3', to: 'prove' },
  ],

  init(S) { S.st.mixHit = false; S.st.warm = 0; },

  update(S) {
    const st = S.st;
    // turno 1: A aparece por encima de B sin ser mejor
    if (S.between('try1', 'goodhart') && scoreA(clamp(Math.round(S.p.seen ?? 0), 0, 40)) > SCORE_B) S.complete('contam');
    // turno 2: llegar a 93 % con casos fáciles y volver a la mezcla real
    if (S.between('try2', 'grade')) {
      const e = clamp((S.p.mix ?? 50) / 100);
      if (mixPasses(e)) st.mixHit = true;
      if (st.mixHit && Math.abs(e - REAL_EASY) <= 0.051) S.complete('mix');
    }
    // turno 3: tamaño de muestra con el que A gana en ≥ 95 de cada 100 evaluaciones
    if (S.between('try3', 'prove')) {
      const r = repeated(N_STEPS[nIdx(S)], (S.p.paired ?? true) !== false);
      if (r.winsA / REPS >= 0.95) S.complete('samplesize');
    }
    // precalienta las simulaciones (una por fotograma) para que mover el control sea instantáneo
    if (S.on('compare') && (st.warm ?? 0) < N_STEPS.length) repeated(N_STEPS[st.warm++], true);
  },

  render(S) {
    const g = groupOf(S), prev = groupOf(S, Math.max(0, S.seg - 1));
    const fade = g !== prev && S.seg > 0 ? clamp(S.segT / 0.5) : 1;
    S.d.withAlpha(fade, () => {
      switch (g) {
        case 'hook': return drawHook(S);
        case 'claim': return drawClaim(S);
        case 'bench': return drawBench(S);
        case 'scale': return drawScale(S);
        case 'contam': return drawContam(S);
        case 'gsm1k': return drawGsm1k(S);
        case 'grids': return drawContamGrids(S);
        case 'goodhart': return drawGoodhart(S);
        case 'gold': return drawGold(S);
        case 'mix': return drawMix(S);
        case 'grade': return drawGrade(S);
        case 'judge': return drawJudge(S);
        case 'bias': return drawBias(S);
        case 'bias2': return drawBias2(S);
        case 'human': return drawHuman(S);
        case 'noise': return drawNoise(S);
        case 'ci': return drawCI(S);
        case 'compare': return drawCompare(S);
        case 'prove': return drawProve(S);
        case 'drift': return drawDrift(S);
        case 'regress': return drawRegress(S);
        case 'redteam': return drawRedTeam(S);
        case 'business': return drawBusiness(S);
        case 'recap': return drawRecap(S);
        default: return drawBridge(S);
      }
    });
  },
});

/** A qué acto pertenece cada segmento (varios segmentos pueden compartir escenario). */
function groupOf(S: Frame, seg = S.seg): string {
  const i = (k: string) => S.segIndex(k);
  if (seg < i('claim')) return 'hook';
  if (seg < i('bench')) return 'claim';
  if (seg < i('saturation')) return 'bench';
  if (seg < i('contam')) return 'scale';
  if (seg < i('gsm1k')) return 'contam';
  if (seg < i('try1')) return 'gsm1k';
  if (seg < i('goodhart')) return 'grids';
  if (seg < i('gold')) return 'goodhart';
  if (seg < i('mix')) return 'gold';
  if (seg < i('grade')) return 'mix';
  if (seg < i('judge')) return 'grade';
  if (seg < i('bias')) return 'judge';
  if (seg < i('bias2')) return 'bias';
  if (seg < i('human')) return 'bias2';
  if (seg < i('noise')) return 'human';
  if (seg < i('ci')) return 'noise';
  if (seg < i('compare')) return 'ci';
  if (seg < i('prove')) return 'compare';
  if (seg < i('drift')) return 'prove';
  if (seg < i('regress')) return 'drift';
  if (seg < i('redteam')) return 'regress';
  if (seg < i('business')) return 'redteam';
  if (seg < i('recap')) return 'business';
  if (seg < i('bridge')) return 'recap';
  return 'bridge';
}

export default scene;
