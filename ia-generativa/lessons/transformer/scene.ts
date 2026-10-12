// Escena: El transformer completo. Un transformer diminuto REAL (weights.ts, entrenado por train_tiny.py; el pase de
// model.ts coincide con PyTorch) recorrido de punta a punta con «el gato come»: tokens, números, embeddings, bloques,
// puntajes y softmax; la demostración de cambiar el sujeto; el bloque pieza por pieza (atención, red, conexión residual,
// normalización de capa); la codificación de posición; la máscara causal con el experimento del modelo que copia; solo
// decodificador; y la cuenta de parámetros por parte, del juguete a GPT-3.
//
// Las demostraciones mueven solas sus controles (S.drive) mientras la persona no los toque; los «tu turno» son opcionales
// y se completan solo con lo que ella hace (S.touched). Todo se anima por fracciones de la duración de cada segmento.
import { clamp, ease, type Frame, type SceneFactory } from '../../../../../theme/kit';
import { drawHook, drawToy } from './act-intro';
import { drawPath, visTarget, type Vis } from './act-path';
import { drawBlock } from './act-block';
import { drawMask, drawMaskTest, drawPos } from './act-order';
import { drawBridge, drawDecoder, drawParams, drawRecap, drawToday, partsTarget, type PartsVis } from './act-end';
import { fr } from './draw';
import { SUBJ } from './data';
import type { Lang } from './model';
import { MODEL_IDS, type ModelId } from './params';

/** Vistas: cada una vive desde el inicio de un segmento hasta el inicio de otro. */
const VIEWS: [string, string | undefined, (S: Frame) => void][] = [
  ['hook', 'toy', drawHook],
  ['toy', 'path-tokens', drawToy],
  ['path-tokens', 'block-parts', drawPath],
  ['block-parts', 'pos-why', drawBlock],
  ['pos-why', 'mask-train', drawPos],
  ['mask-train', 'mask-test', drawMask],
  ['mask-test', 'enc-dec', drawMaskTest],
  ['enc-dec', 'params-emb', drawDecoder],
  ['params-emb', 'today', drawParams],
  ['today', 'recap', drawToday],
  ['recap', 'bridge', drawRecap],
  ['bridge', undefined, drawBridge],
];

const lerpArr = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);

const scene: SceneFactory = () => ({
  controls: [
    {
      id: 'subj', kind: 'choice', label: { es: 'Sujeto', en: 'Subject' }, value: 0, from: 'pass-demo', to: 'block-parts',
      options: SUBJ.es.map((w, i) => ({ value: i, label: { es: `el ${w}`, en: `the ${SUBJ.en[i]}` } })),
    },
    {
      id: 'model', kind: 'choice', label: { es: 'Modelo', en: 'Model' }, value: 'gpt3', from: 'params-real', to: 'today',
      options: [
        { value: 'toy', label: { es: 'Juguete', en: 'Toy' } },
        { value: 'small', label: { es: 'GPT-3 pequeño', en: 'GPT-3 Small' } },
        { value: 'gpt3', label: { es: 'GPT-3', en: 'GPT-3' } },
      ],
    },
  ],

  init(S) { S.st = {}; },

  // Demostraciones guiadas, suavizado de lo que se dibuja y gates. render() solo lee S.st.
  update(S) {
    const L = S.lang as Lang, dt = Math.min(S.dt, 0.1);
    const jumped = S.st.lastT === undefined || Math.abs(S.t - S.st.lastT) > 0.3;
    S.st.lastT = S.t;
    // ── el sujeto: gato → perro → loro en la demostración; luego lo que elija la persona ──
    if (S.is('pass-demo')) { const q = fr(S, 'pass-demo', 0, 1); S.drive('subj', q < 0.2 ? 0 : q < 0.58 ? 1 : 2); }
    const subj = S.between('pass-demo', 'block-parts') ? clamp(Math.round(+(S.p.subj ?? 0)), 0, 2) : 0;
    const tgt = visTarget(L, subj);
    let v = S.st.vis as (Vis & { lang?: Lang }) | undefined;
    if (!v || v.lang !== L || jumped) v = { ...tgt, pulse: 9, lang: L };
    else {
      if (tgt.subj !== v.subj) { v.subj = tgt.subj; v.ids = tgt.ids; v.pulse = 0; }
      v.pulse += dt;
      const k = 1 - Math.exp(-dt * 5);
      v.emb = v.emb.map((r, i) => lerpArr(r, tgt.emb[i], v!.pulse > 0.3 ? k : 0));
      v.out = v.out.map((r, i) => lerpArr(r, tgt.out[i], v!.pulse > 0.6 ? k : 0));
      if (v.pulse > 0.75) { v.logits = lerpArr(v.logits, tgt.logits, k); v.probs = lerpArr(v.probs, tgt.probs, k); }
    }
    S.st.vis = v;
    if (S.between('pass-try', 'block-parts') && S.touched.has('subj')) S.complete('subject');

    // ── el modelo de la cuenta de parámetros: el juguete, luego GPT-3; en la demostración, los tres ──
    if (S.is('params-real')) S.drive('model', 'gpt3');
    else if (S.is('params-demo')) { const q = fr(S, 'params-demo', 0, 1); S.drive('model', q < 0.3 ? 'toy' : q < 0.62 ? 'small' : 'gpt3'); }
    const model: ModelId = S.on('params-real') && S.between('params-real', 'today') && MODEL_IDS.includes(S.p.model) ? S.p.model : S.on('today') ? 'gpt3' : 'toy';
    const pt = partsTarget(model);
    let pv = S.st.parts as PartsVis | undefined;
    if (!pv || jumped) pv = { ...pt };
    else { const k = 1 - Math.exp(-dt * 6); pv.share = lerpArr(pv.share, pt.share, k); pv.model = pt.model; pv.counts = pt.counts; pv.total = pt.total; }
    S.st.parts = pv;
    if (S.between('params-try', 'today') && S.touched.has('model')) S.complete('model');
  },

  render(S) {
    // En escenarios grandes todo crece un poco (letra y bloques); se restablece al final.
    const u0 = S.u, z = S.portrait ? clamp(S.H / 440, 1, 1.12) : S.H < 300 ? 1 : clamp(S.H / 400, 1, 1.25);
    S.u = u0 * z; S.d.u = S.u;
    try {
      for (const [from, to, fn] of VIEWS) {
        if (!S.on(from) && from !== 'hook') continue;
        if (to && S.on(to) && fr(S, to, 0, 0.06) >= 1) continue;
        const aIn = from === 'hook' ? 1 : ease.out(fr(S, from, 0, 0.07));
        const aOut = to && S.on(to) ? 1 - fr(S, to, 0, 0.05) : 1;
        const a = aIn * aOut;
        if (a > 0.003) S.d.withAlpha(a, () => fn(S));
      }
    } finally { S.u = u0; S.d.u = u0; }
  },
});
export default scene;
