// Escena: Predecir la siguiente palabra. Un modelo de lenguaje de verdad, a escala diminuta (lm.ts): un modelo de
// n-gramas de pares de palabras contado sobre un texto de ocho frases escrito para la lección, paralelo en español e
// inglés (las cifras coinciden en los dos idiomas). Se ve contar, dividir, escribir palabra por palabra
// (autorregresión), elegir voraz o sorteando, softmax paso a paso, la temperatura, top-k/top-p y la escala de GPT.
// La escena hace sola cada demostración (escribe, sortea, mueve la temperatura con S.drive); los «tu turno» son
// opcionales y solo cuentan lo que hace la persona (S.touched).
// Las animaciones se reparten por fracciones de cada segmento (fr): así siguen a la voz en cualquier idioma.
// Vista vertical (S.portrait): cada vista reacomoda sus piezas en columna (ver *Geom en views*.ts).
import { clamp, lerp, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { demoOf, userSeed, type Demo } from './demo';
import { fr } from './helpers';
import type { Lang } from './lm';
import { freshSt, stOf } from './state';
import { drawCount, drawIntro } from './views1';
import { drawChoose, drawWrite } from './views2';
import { drawLimits, drawSoftmax, drawTemp, drawTop } from './views3';
import { drawBridge, drawEssay, drawGpt, drawRecap } from './views4';

/** Vistas: cada una empieza en un segmento y dura hasta que empieza la siguiente. */
const VIEWS: [string, (S: Frame, D: Demo) => void][] = [
  ['hook', drawIntro], ['text', drawCount], ['write1', drawWrite], ['greedy-def', drawChoose], ['limit-short', drawLimits],
  ['scores', drawSoftmax], ['temp', drawTemp], ['topk', drawTop], ['essay-q', drawEssay], ['gpt1', drawGpt], ['recap', drawRecap], ['bridge', drawBridge],
];

const fmtT = (v: number, l: string) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const scene: SceneFactory = () => ({
  controls: [
    { id: 'gen', kind: 'button', primary: true, label: { es: 'Escribir otra vez', en: 'Write again' }, from: 'sample-runs', to: 'limit-short' },
    { id: 'temp', kind: 'slider', label: { es: 'Temperatura', en: 'Temperature' }, min: 0.1, max: 3, step: 0.05, value: 1, from: 'temp', to: 'topk', fmt: fmtT },
  ],

  init(S) { S.st.q = freshSt(); },

  action(S, id) {
    if (id !== 'gen') return;
    const st = stOf(S);
    st.presses++;
    st.runs.push({ seed: userSeed(st.presses), t0: S.clock });
    if (st.runs.length > 6) st.runs.shift();
  },

  // Demostraciones guiadas (la escena mueve la temperatura mientras nadie la toque) y comprobación de los «tu turno».
  update(S) {
    const st = stOf(S);
    // temperatura: 1 → 0.5 (temp-low) → 0.1 (temp-zero) → 2 (temp-high) → baja, alta y de vuelta a 1 (temp-use)
    if (S.between('temp', 'topk')) {
      let t = 1;
      if (S.on('temp-low')) t = lerp(1, 0.5, fr(S, 'temp-low', 0.2, 0.5, 'io'));
      if (S.on('temp-zero')) t = lerp(0.5, 0.1, fr(S, 'temp-zero', 0.42, 0.7, 'io'));
      if (S.on('temp-high')) t = lerp(0.1, 2, fr(S, 'temp-high', 0.08, 0.45, 'io'));
      if (S.on('temp-use')) {
        const a = fr(S, 'temp-use', 0.04, 0.2, 'io'), b = fr(S, 'temp-use', 0.32, 0.5, 'io'), c = fr(S, 'temp-use', 0.78, 0.94, 'io');
        t = c > 0 ? lerp(2.5, 1, c) : b > 0 ? lerp(0.3, 2.5, b) : lerp(2, 0.3, a);
      }
      if (S.on('try-temp')) t = 1;
      S.drive('temp', Math.round(clamp(t, 0.1, 3) * 20) / 20);
    }
    if (S.between('temp', 'topk') && S.touched.has('temp')) {
      st.temps.add(Math.round((S.p.temp ?? 1) * 4));
      if (st.temps.size >= 3) S.complete('temp');
    }
    if (S.between('sample-runs', 'limit-short') && S.touched.has('gen') && st.presses > 0) S.complete('gen');
  },

  render(S) {
    const D = demoOf(S.lang as Lang);
    for (let i = 0; i < VIEWS.length; i++) {
      const [start, draw] = VIEWS[i], next = VIEWS[i + 1]?.[0];
      if (!S.on(start)) break;
      const aIn = i === 0 ? 1 : fr(S, start, 0, 0.08), aOut = next ? 1 - fr(S, next, 0, 0.05) : 1;
      const a = aIn * aOut;
      if (a > 0.01) S.d.withAlpha(a, () => draw(S, D));
    }
    if (S.portrait) return;
  },
});

export default scene;
