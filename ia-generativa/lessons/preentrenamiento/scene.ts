// Escena: Preentrenamiento. Cinco actos que se funden uno en otro:
//  1 · el objetivo autosupervisado (adivinar la siguiente pieza)   2 · el corpus y la tubería (mini-rastreo con funciones reales)
//  3 · qué se aprende: mediciones reales de Pythia-1.4B en 25 puntos de control   4 · derechos, consentimiento y privacidad
//  5 · el modelo base no es un asistente; el corte de conocimiento; cierre y puente.
// Tres turnos: elegir el umbral de duplicados, encontrar en qué punto del entrenamiento el modelo acierta un hecho, y probar
// indicaciones en un modelo base. Todo lo que se muestra como medición sale de pythia-data.ts (build-pythia.py); lo ilustrativo se rotula.
import { regions, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawAct1 } from './act1';
import { drawCorpus, drawQuality, drawShingle, drawSim, drawTiles, drawWhy, updateDedup } from './act2';
import { drawAct3Main, drawLang, drawMem, updateScrub, MEM_IDS, PROMPT_IDS, ROWS, memShort } from './act3';
import { baseChoices, drawBase, drawBooks, drawBridge, drawCutoff, drawPrivacy, drawRecap, drawRuling, updateBase } from './act45';
import { T0 } from './crawl';

const tokensFmt = (v: number, l: 'es' | 'en') => {
  const r = ROWS[Math.round(v)], nf = (x: number, d = 0) => x.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const t = r.tokens, c = t < 1e6 ? '0' : t < 1e9 ? `${nf(t / 1e6, t < 1e7 ? 1 : 0)} M` : t < 1e12 ? `${nf(t / 1e9, t < 1e10 ? 1 : 0)} ${l === 'es' ? 'mil M' : 'B'}` : `${nf(t / 1e12, 1)}T`;
  const cc = l === 'en' && t >= 1e6 && t < 1e9 ? c.replace(' M', 'M') : c;
  return `${l === 'es' ? 'paso' : 'step'} ${nf(r.step)} · ${cc} ${l === 'es' ? 'tokens' : 'tokens'}`;
};

const PROMPT_LABEL: Record<string, { es: string; en: string }> = {
  fact: { es: 'Capital de Francia', en: 'Capital of France' },
  count: { es: 'Contar', en: 'Counting' },
  pattern: { es: 'Patrón cat = gato', en: 'Pattern cat = gato' },
  walk: { es: 'Una frase', en: 'A sentence' },
};

const scene: SceneFactory = () => ({
  controls: [
    // ── turno 1: el umbral de duplicados ──
    { id: 'thr', kind: 'slider', label: { es: 'Umbral de similitud', en: 'Similarity threshold' }, min: 0.05, max: 1, step: 0.01, value: T0, fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), from: 'try-dedup', to: 'dedup-why' },
    // ── turno 2: recorrer el entrenamiento ──
    { id: 'ckpt', kind: 'slider', label: { es: 'Punto del entrenamiento', en: 'Point in training' }, min: 0, max: ROWS.length - 1, step: 1, value: 12, fmt: tokensFmt, from: 'try-scrub', to: 'pattern' },
    { id: 'prompt', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, options: PROMPT_IDS.map((v) => ({ value: v, label: PROMPT_LABEL[v] })), value: 'fact', from: 'try-scrub', to: 'pattern' },
    // ── memorización (no es un turno: solo cambia el texto que se ve) ──
    { id: 'mem', kind: 'choice', label: { es: 'Texto', en: 'Text' }, options: MEM_IDS.map((v) => ({ value: v, label: memShort[v] })), value: 'mit', from: 'recite', to: 'books' },
    // ── turno 3: probar indicaciones en el modelo base ──
    { id: 'base', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, options: baseChoices, value: 'chat_capital', from: 'try-base', to: 'cutoff' },
  ],

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    if (updateDedup(S)) S.complete('dedup');     // turno 1: copias fuera y textos distintos dentro
    if (updateScrub(S)) S.complete('scrub');     // turno 2: el primer punto en que el modelo dice «Paris»
    if (updateBase(S)) S.complete('base');       // turno 3: tres indicaciones distintas probadas
  },

  render(S) {
    const d = S.d, t = (id: string) => S.at(id, 0, 0.8);
    const v = {
      a1: 1 - t('corpus'),
      corpus: t('corpus') * (1 - t('raw')),
      tiles: t('raw') * (1 - t('f-dedup')),
      shingle: t('f-dedup') * (1 - t('try-dedup')),
      sim: t('try-dedup') * (1 - t('dedup-why')),
      why: t('dedup-why') * (1 - t('quality')),
      quality: t('quality') * (1 - t('pythia')),
      main: t('pythia') * (1 - t('lang')),
      lang: t('lang') * (1 - t('recite')),
      mem: t('recite') * (1 - t('books')),
      books: t('books') * (1 - t('ruling')),
      ruling: t('ruling') * (1 - t('privacy')),
      privacy: t('privacy') * (1 - t('base')),
      base: t('base') * (1 - t('cutoff')),
      cutoff: t('cutoff') * (1 - t('recap')),
      recap: t('recap') * (1 - t('bridge')),
      bridge: t('bridge'),
    };
    const show = (a: number, fn: () => void) => { if (a > 0.005) d.withAlpha(a, fn); };
    show(v.a1, () => drawAct1(S));
    show(v.corpus, () => drawCorpus(S));
    show(v.tiles, () => drawTiles(S));
    show(v.shingle, () => drawShingle(S));
    show(v.sim, () => drawSim(S));
    show(v.why, () => drawWhy(S));
    show(v.quality, () => drawQuality(S));
    show(v.main, () => drawAct3Main(S, 1));
    show(v.lang, () => drawLang(S, 1));
    show(v.mem, () => drawMem(S, 1));
    show(v.books, () => drawBooks(S));
    show(v.ruling, () => drawRuling(S));
    show(v.privacy, () => drawPrivacy(S));
    show(v.base, () => drawBase(S));
    show(v.cutoff, () => drawCutoff(S));
    show(v.recap, () => drawRecap(S));
    show(v.bridge, () => drawBridge(S));
  },
});

export default scene;
void regions;
void ({} as Frame);
