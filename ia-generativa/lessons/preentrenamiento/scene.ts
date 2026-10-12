// Escena: Preentrenamiento. El objetivo autosupervisado con una frase real y la apuesta de Pythia-1.4B antes y después de
// entrenar; de dónde sale el texto y cómo se limpia (una tubería real sobre doce páginas escritas para la lección); el
// duplicado casi idéntico medido por trozos de cinco palabras y el umbral; la memorización; la mezcla de GPT-3; qué aprende
// y en qué orden (curva y salidas reales de Pythia en 25 puntos de control); derechos, consentimiento y privacidad; el
// modelo base que no obedece; el corte de conocimiento; el resumen y el puente.
//
// Las demostraciones mueven solas sus controles (S.drive) mientras la persona no los toque; los tres «tu turno» son
// opcionales y se completan solo con lo que ella hace (S.touched). Todo se anima por fracciones de la duración de cada
// segmento. Las mediciones salen de pythia-data.ts (build-pythia.py); lo ilustrativo se rotula en el lienzo.
import { clamp, lerp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { ap, fr, mv } from './draw';
import { drawHook, drawObjective } from './v-intro';
import { drawNear, drawPipe, drawQuality, drawRecite, drawRuler, drawWeb } from './v-data';
import { ckptShown, drawLangGap, drawLearn } from './v-learn';
import { drawPrivacy, drawRights } from './v-rights';
import { baseShown, drawBase, drawBridge, drawCutoff, drawRecap } from './v-end';
import { LAST, ROWS, idxOf } from './pythia';

/** Vistas: cada una vive desde el inicio de un segmento hasta el inicio de otro. */
const VIEWS: [string, string | undefined, (S: Frame) => void][] = [
  ['hook', 'obj-task', drawHook],
  ['obj-task', 'web', drawObjective],
  ['web', 'pipe-intro', drawWeb],
  ['pipe-intro', 'near-def', drawPipe],
  ['near-def', 'near-ruler', drawNear],
  ['near-ruler', 'recite', drawRuler],
  ['recite', 'quality', drawRecite],
  ['quality', 'learn-intro', drawQuality],
  ['learn-intro', 'lang-gap', drawLearn],
  ['lang-gap', 'rights-pile', drawLangGap],
  ['rights-pile', 'privacy', drawRights],
  ['privacy', 'base-def', drawPrivacy],
  ['base-def', 'cutoff', drawBase],
  ['cutoff', 'recap', drawCutoff],
  ['recap', 'bridge', drawRecap],
  ['bridge', undefined, drawBridge],
];

// formato de los controles (sin Frame: mismo criterio que S.n, punto decimal y espacio para los miles en español)
const nfmt = (x: number, d: number, l: 'es' | 'en') => { const s = x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); return l === 'es' ? s.replace(/,/g, ' ') : s; };
const tokFmt = (n: number, l: 'es' | 'en') => {
  if (n <= 0) return '0';
  const sig = (v: number) => nfmt(v, v >= 10 ? 0 : 1, l).replace(/\.0$/, '');
  if (n < 1e9) return l === 'es' ? `${sig(n / 1e6)} M` : `${sig(n / 1e6)}M`;
  return l === 'es' ? `${sig(n / 1e9)} mil M` : `${sig(n / 1e9)}B`;
};
const r2 = (v: number) => Math.round(v * 100) / 100;

const scene: SceneFactory = () => ({
  controls: [
    {
      id: 'thr', kind: 'slider', label: { es: 'Umbral de parecido', en: 'Similarity threshold' }, min: 0.05, max: 1, step: 0.01, value: 1, from: 'thr-demo', to: 'recite',
      fmt: (v, l) => `${nfmt(v * 100, 0, l)}${l === 'es' ? ' %' : '%'}`,
    },
    {
      id: 'ckpt', kind: 'slider', label: { es: 'Punto del entrenamiento', en: 'Point in training' }, min: 0, max: LAST, step: 1, value: 0, from: 'learn-noise', to: 'lang-gap',
      fmt: (v, l) => { const r = ROWS[clamp(Math.round(v), 0, LAST)]; return `${l === 'es' ? 'paso' : 'step'} ${nfmt(r.step, 0, l)} · ${tokFmt(r.tokens, l)} tokens`; },
    },
    {
      id: 'base', kind: 'choice', label: { es: 'Indicación', en: 'Prompt' }, value: 'chat_capital', from: 'base-q', to: 'cutoff',
      options: [
        { value: 'chat_capital', label: { es: 'Una pregunta', en: 'A question' } },
        { value: 'chat_poem', label: { es: 'Una orden', en: 'An order' } },
        { value: 'doc_list', label: { es: 'Un documento', en: 'A document' } },
        { value: 'chat_es', label: { es: 'En español', en: 'In Spanish' } },
      ],
    },
  ],

  init(S) { S.st = {}; },

  // Demostraciones guiadas y gates. render() solo lee S.st y S.p.
  update(S) {
    const dt = Math.min(S.dt, 0.1);
    const jumped = S.st.lastT === undefined || Math.abs(S.t - S.st.lastT) > 0.3;
    S.st.lastT = S.t;

    // ── el umbral de duplicados: baja de 100 % a 50 % (salen las copias), luego a 15 % (sale la reescrita) y sube a 87 % ──
    if (S.is('thr-demo')) S.drive('thr', r2(1 - 0.5 * mv(S, 'thr-demo', 0.12, 0.85)));
    else if (S.is('thr-low')) S.drive('thr', r2(0.5 - 0.35 * mv(S, 'thr-low', 0.06, 0.5)));
    else if (S.is('thr-try')) S.drive('thr', r2(0.15 + 0.72 * mv(S, 'thr-try', 0.02, 0.3)));
    if (S.between('thr-try', 'recite') && S.touched.has('thr')) S.complete('dedup');

    // ── el recorrido del entrenamiento: la demostración pasa por los puntos que nombra la voz ──
    const I = idxOf, glide = (a: number, b: number, k: number) => Math.round(lerp(a, b, k));
    if (S.is('learn-noise')) S.drive('ckpt', 0);
    else if (S.is('learn-freq')) S.drive('ckpt', glide(0, I(16), mv(S, 'learn-freq', 0.04, 0.4)));
    else if (S.is('learn-grammar')) S.drive('ckpt', glide(I(16), I(1000), mv(S, 'learn-grammar', 0.04, 0.4)));
    else if (S.is('learn-fact')) {
      const q = fr(S, 'learn-fact', 0, 1);
      S.drive('ckpt', q < 0.42 ? glide(I(1000), I(6000), mv(S, 'learn-fact', 0.18, 0.42)) : q < 0.72 ? I(6000) : I(8000));
    } else if (S.is('learn-paris')) {
      const q = fr(S, 'learn-paris', 0, 1);
      S.drive('ckpt', q < 0.4 ? glide(I(8000), I(16000), mv(S, 'learn-paris', 0.02, 0.14)) : glide(I(16000), LAST, mv(S, 'learn-paris', 0.45, 0.88)));
    } else if (S.is('learn-pattern')) {
      const q = fr(S, 'learn-pattern', 0, 1);
      S.drive('ckpt', q < 0.5 ? glide(LAST, I(16000), mv(S, 'learn-pattern', 0.04, 0.28)) : glide(I(16000), LAST, mv(S, 'learn-pattern', 0.55, 0.9)));
    } else if (S.is('learn-try')) S.drive('ckpt', LAST);
    if (S.between('learn-try', 'lang-gap') && S.touched.has('ckpt')) S.complete('scrub');
    // el marcador de la curva se desliza hacia el punto elegido
    const kT = ckptShown(S);
    S.st.kShow = jumped || S.st.kShow === undefined ? kT : S.st.kShow + (kT - S.st.kShow) * (1 - Math.exp(-dt * 7));

    // ── el modelo base: una pregunta, una orden y un documento ──
    if (S.is('base-q')) S.drive('base', 'chat_capital');
    else if (S.is('base-poem')) S.drive('base', 'chat_poem');
    else if (S.is('base-faq')) S.drive('base', 'doc_list');
    const b = baseShown(S);
    // el cambio se funde con el reloj continuo (S.clock), que sigue corriendo aunque la lección esté en pausa en un gate
    if (b !== S.st.baseCur || jumped) { S.st.baseSince = S.st.baseCur === undefined || jumped ? -1e9 : S.clock; S.st.baseCur = b; }
    if (S.between('base-try', 'cutoff') && S.touched.has('base')) S.complete('base');
  },

  render(S) {
    // En escenarios grandes todo crece un poco (letra y piezas); se restablece al final.
    const u0 = S.u, z = S.portrait ? clamp(S.H / 440, 1, 1.12) : S.H < 330 ? 1 : clamp(S.H / 400, 1, 1.25);
    S.u = u0 * z; S.d.u = S.u;
    try {
      for (const [from, to, fn] of VIEWS) {
        if (!S.on(from) && from !== 'hook') continue;
        if (to && S.on(to) && fr(S, to, 0, 0.06) >= 1) continue;
        const aIn = from === 'hook' ? 1 : ap(S, from, 0, 0.07);
        const aOut = to && S.on(to) ? 1 - fr(S, to, 0, 0.05) : 1;
        const a = aIn * aOut;
        if (a > 0.003) S.d.withAlpha(a, () => fn(S));
      }
    } finally { S.u = u0; S.d.u = u0; }
  },
});
export default scene;
