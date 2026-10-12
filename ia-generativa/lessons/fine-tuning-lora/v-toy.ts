// Vista del modelo diminuto REAL (2 → 32 → 32 → 3, se entrena en el navegador): el mapa de sus respuestas y dos medidores,
// «aciertos en lo nuevo (rayado)» y «aciertos en lo que ya sabía (resto)». Vive en dos tramos de la lección:
//   toy-intro … replay        el modelo base, la regla nueva, el ajuste completo, el olvido y el repaso;
//   toy-lora, toy-lora-result LoRA de rango 2 sobre la capa del centro, con el mismo repaso.
// Las corridas son deterministas (runs.ts) y avanzan por fracciones de cada segmento: saltar a cualquier punto da la misma imagen.
import { clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { ap, area, fitText, fr, hold, isShort, lineH, mv, pill, provenance, provH, txt } from './draw';
import { getRun, STEPS, type Snap, type Spec } from './runs';
import { CHANGED, FT, REPLAY, TARGET, TARGET_BASE } from './task';
import { nParams } from './tinynet';
import { alp, classMark, drawMap, meter, meterH, squareIn, wrongCells } from './ui';

export const FULL: Spec = { mode: 'full', replay: false, rule: 'A' };
export const FULL_R: Spec = { mode: 'full', replay: true, rule: 'A' };
export const LORA_R: Spec = { mode: 2, replay: true, rule: 'A' };
export const LORA_N: Spec = { mode: 2, replay: false, rule: 'A' };
const N_ALL = nParams();                       // 1 251
const N_LORA = 2 * (32 + 32);                  // 128

const wrongCache = new WeakMap<Snap, Uint8Array>();
const wrongOld = (s: Snap): Uint8Array => { let w = wrongCache.get(s); if (!w) { w = wrongCells(s.pred, TARGET.A, TARGET_BASE, CHANGED.A, 'old'); wrongCache.set(s, w); } return w; };
const stepOf = (S: Frame, seg: string, a: number, b: number) => Math.round(STEPS * mv(S, seg, a, b));

/** Qué corrida y en qué paso se ve ahora (y la anterior, para fundirlas al reiniciar). */
function state(S: Frame): { snap: Snap; prev?: Snap; k?: number; spec: Spec | null } {
  const base = getRun(FULL).at(0);
  if (S.on('toy-lora')) {
    const st = S.on('toy-lora-result') ? STEPS : stepOf(S, 'toy-lora', 0.3, 0.92);
    return { snap: getRun(LORA_R).at(st), spec: LORA_R };
  }
  if (S.on('replay')) {
    const st = stepOf(S, 'replay', 0.32, 0.92);
    return { snap: getRun(FULL_R).at(st), prev: getRun(FULL).at(STEPS), k: ap(S, 'replay', 0.22, 0.32), spec: FULL_R };
  }
  if (S.on('full-ft')) {
    const st = S.on('full-old') ? STEPS : stepOf(S, 'full-ft', 0.12, 0.88);
    return { snap: getRun(FULL).at(st), spec: FULL };
  }
  return { snap: base, spec: null };
}

interface Lay { map: Rect; cap: number; side: Rect }
function layout(S: Frame): Lay {
  const A = area(S), u = S.u, capH = lineH(S, 12, 1.2) + 6 * u;
  if (S.portrait) {
    const sideH = lineH(S, 13.5, 1.25) + 2 * u + lineH(S, 14, 1.2) + 10 * u + 2 * meterH(S) + 8 * u + 12 * u + lineH(S, 12.5, 1.2) + 4 * u;
    const mh = A.h - sideH - capH - 10 * u, s = Math.min(A.w, mh);
    const map = { x: A.x + (A.w - s) / 2, y: A.y, w: s, h: s };
    return { map, cap: map.y + s + capH / 2 + 2 * u, side: { x: A.x, y: map.y + s + capH + 8 * u, w: A.w, h: A.y + A.h - (map.y + s + capH + 8 * u) } };
  }
  const gap = (isShort(S) ? 14 : 22) * u, mw = Math.min(A.h - capH, A.w * 0.56), map = squareIn({ x: A.x, y: A.y, w: mw, h: A.h - capH }, 'l');
  return { map: { ...map, y: A.y }, cap: A.y + map.h + capH / 2 + 2 * u, side: { x: A.x + map.w + gap, y: A.y, w: A.w - map.w - gap, h: A.h } };
}

export function drawToy(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S), M = L.map;
  const { snap, prev, k, spec } = state(S);
  const lora = S.on('toy-lora');

  // ── el mapa ──
  const showHatch = S.on('rule-new');
  const hatchA = lora ? 1 : ap(S, 'rule-new', 0.06, 0.24);
  const nData = lora ? FT.A.length : S.on('rule-data') ? FT.A.length * mv(S, 'rule-data', 0.08, 0.6) : 0;
  const nExtra = lora ? REPLAY.A.length : S.on('replay') ? REPLAY.A.length * mv(S, 'replay', 0.06, 0.24) : 0;
  const wrongA = lora ? ap(S, 'toy-lora', 0.35, 0.45) : S.on('full-old') ? (S.on('replay') ? 1 : ap(S, 'full-old', 0.18, 0.32)) : 0;
  const reveal = lora ? 1 : mv(S, 'toy-intro', 0.04, 0.3);
  const common = { hatch: showHatch ? CHANGED.A : null, hatchA, data: FT.A, dataN: nData, extra: REPLAY.A, extraN: nExtra, reveal };
  if (prev && (k ?? 1) < 1) {
    drawMap(S, M, prev.pred, { ...common, wrong: wrongOld(prev), wrongA: 1 });
    d.withAlpha(k ?? 1, () => drawMap(S, M, snap.pred, { ...common, wrong: wrongOld(snap), wrongA }));
  } else drawMap(S, M, snap.pred, { ...common, wrong: wrongA > 0 ? wrongOld(snap) : null, wrongA });

  // zonas con su marca y su nombre (desde toy-map hasta rule-data)
  const zA = S.on('toy-map') && !lora ? hold(S, 'toy-map', 'rule-data') : 0;
  if (zA > 0.01) {
    const zones: [number, number, number, string, string][] = [
      [0, 0, 0.66, S.l('arriba', 'top'), ''],
      [1, -0.52, -0.6, S.l('abajo a la', 'bottom'), S.l('izquierda', 'left')],
      [2, 0.52, -0.6, S.l('abajo a la', 'bottom'), S.l('derecha', 'right')],
    ];
    zones.forEach(([c, x, y, l1, l2], i) => {
      const a = zA * ap(S, 'toy-map', 0.3 + i * 0.16, 0.42 + i * 0.16), px = M.x + ((x + 1) / 2) * M.w, py = M.y + ((1 - y) / 2) * M.h;
      const col = tone(S, (['dat', 'err', 'sig'] as const)[c]).ink, one = `${l1} ${l2}`.trim(), mw = M.w * 0.46;
      d.withAlpha(a, () => {
        classMark(S, c, px, py - 12 * u, 6 * u);
        if (S.d.measure(one, { size: Math.max(13, 12.2 / u), weight: 800 }) <= mw) fitText(S, one, px, py + 8 * u, mw, { s: 13, weight: 800, c: col, align: 'center', halo: true });
        else { fitText(S, l1, px, py + 8 * u, mw, { s: 13, weight: 800, c: col, align: 'center', halo: true }); fitText(S, l2, px, py + 8 * u + lineH(S, 13, 1.15), mw, { s: 13, weight: 800, c: col, align: 'center', halo: true }); }
      });
    });
  }
  // dónde están los ejemplos (forget-where)
  const bA = S.on('forget-where') && !S.on('replay') ? hold(S, 'forget-where', 'replay', 0.08, 0.2) : 0;
  if (bA > 0.01) {
    const x0 = M.x + ((0.05 + 1) / 2) * M.w, x1 = M.x + M.w, y0 = M.y + ((1 - 0.35) / 2) * M.h, y1 = M.y + ((1 + 0.5) / 2) * M.h;
    const lab = S.l('aquí están los ejemplos', 'the examples are here'), pw = S.d.measure(lab, { size: Math.max(12, 12.2 / u), weight: 800 }) + 14 * u;
    d.withAlpha(bA, () => {
      d.rect(x0, y0, x1 - x0 - 1, y1 - y0, { stroke: p.ink, lw: 2.2, dash: [6, 4] });
      pill(S, lab, Math.max(M.x + pw / 2 + 2 * u, Math.min((x0 + x1) / 2, M.x + M.w - pw / 2 - 2 * u)), y0 - lineH(S, 12, 1) * 0.9, { s: 12, tone: 'ink', a: 1 - ap(S, 'forget-name', 0, 0.12) });
    });
  }

  // pie del mapa: qué se ve
  const cap = lora ? S.l('marcas: ejemplos nuevos (70) · cuadros: repaso (30)', 'marks: new examples (70) · squares: replay (30)')
    : S.on('replay') ? S.l('cuadros: 30 ejemplos de repaso (lo que ya sabía)', 'squares: 30 replay examples (what it knew)')
      : S.on('full-old') ? S.l('cuadrito de tinta: antes acertaba, ahora falla', 'ink square: it used to be right, now it is wrong')
        : S.on('rule-data') ? S.l('marcas: los 70 ejemplos de tu empresa', 'marks: your company’s 70 examples')
          : S.on('rule-new') ? S.l('rayado: donde tu empresa quiere otra respuesta', 'hatched: where your company wants a different answer')
            : S.l('cada punto es una pregunta; el relleno, la respuesta', 'each point is a question; the fill is the answer');
  fitText(S, cap, S.portrait ? L.side.x : M.x, L.cap, S.portrait ? L.side.w : M.w + (L.side.x - M.x - M.w) + L.side.w * 0.2, { s: 12, c: p.mute, a: S.on('toy-intro') ? ap(S, 'toy-intro', 0.2, 0.35) : 1 });
  // el nombre del fenómeno, sobre la zona de arriba del mapa (forget-name)
  if (S.on('forget-name') && !S.on('replay')) pill(S, S.l('olvido catastrófico', 'catastrophic forgetting'), M.x + 10 * u, M.y + lineH(S, 13, 1) / 2 + 12 * u, { tone: 'err', s: 13, align: 'left', solid: true, a: ap(S, 'forget-name', 0.05, 0.2) });

  drawSide(S, L.side, snap, spec);
  provenance(S, S.l('modelo real, entrenado en tu navegador · datos sintéticos', 'real model, trained in your browser · synthetic data'), ap(S, 'toy-intro', 0.3, 0.45));
  void provH; void clamp;
}

function drawSide(S: Frame, r: Rect, snap: Snap, spec: Spec | null) {
  const { pal: p } = S, u = S.u, wt = tone(S, 'w'), lora = S.on('toy-lora'), port = S.portrait;
  let y = r.y;
  // ── qué modelo y cuántos parámetros se entrenan ──
  const title = lora ? S.l('LoRA de rango 2, en la capa del centro', 'rank-2 LoRA, on the middle layer')
    : S.on('replay') ? S.l('ajuste completo, ahora con repaso', 'full fine-tuning, now with replay')
      : S.on('full-ft') ? S.l('ajuste completo', 'full fine-tuning')
        : S.l('modelo diminuto, ya entrenado: el modelo base', 'tiny model, already trained: the base model');
  const trainOn = S.on('full-ft');
  const numLab = lora ? S.l('se entrenan', 'trainable') : trainOn ? S.l('se entrenan', 'trainable') : S.l('parámetros', 'parameters');
  const num = lora ? N_LORA : N_ALL;
  const aInfo = ap(S, 'toy-intro', 0.25, 0.4);
  if (port) {
    fitText(S, title, r.x, y + lineH(S, 13.5, 1.25) / 2, r.w, { s: 13.5, weight: 800, c: p.ink, a: aInfo });
    y += lineH(S, 13.5, 1.25) + 2 * u;
    const line = `${numLab}: ${S.n(num, 0)}` + (lora ? S.l(` · congelados: ${S.n(N_ALL, 0)}`, ` · frozen: ${S.n(N_ALL, 0)}`) : '');
    fitText(S, line, r.x, y + lineH(S, 14, 1.2) / 2, r.w, { s: 14, weight: 800, mono: true, c: trainOn || lora ? wt.ink : p.ink2, a: aInfo });
    y += lineH(S, 14, 1.2) + 10 * u;
  } else {
    fitText(S, title, r.x, y + lineH(S, 14, 1.25) / 2, r.w, { s: 14, weight: 800, c: p.ink, a: aInfo });
    y += lineH(S, 14, 1.25) + 6 * u;
    txt(S, numLab, r.x, y + lineH(S, 12.5, 1.2) / 2, { s: 12.5, weight: 700, c: p.mute, a: aInfo });
    y += lineH(S, 12.5, 1.2);
    txt(S, S.n(num, 0), r.x, y + lineH(S, 26, 1.1) / 2, { s: 26, weight: 800, mono: true, c: trainOn || lora ? wt.ink : p.ink, a: aInfo });
    if (lora) fitText(S, S.l(`congelados: ${S.n(N_ALL, 0)}`, `frozen: ${S.n(N_ALL, 0)}`), r.x + r.w, y + lineH(S, 26, 1.1) / 2, r.w * 0.5, { s: 13, weight: 700, c: p.mute, align: 'right' });
    y += lineH(S, 26, 1.1) + (isShort(S) ? 10 : 22) * u;
  }

  // ── los dos medidores ──
  const mh = meterH(S), gap = (port ? 8 : isShort(S) ? 10 : 18) * u;
  const a1 = lora ? 1 : ap(S, 'rule-new', 0.55, 0.7), a2 = lora ? 1 : ap(S, 'meter-old', 0.3, 0.45);
  const hot1 = lora ? 0 : (S.is('rule-new') ? ap(S, 'rule-new', 0.6, 0.72) : 0) + (S.is('full-ft') ? ap(S, 'full-ft', 0.1, 0.2) : 0);
  const hot2 = lora ? 0 : (S.is('meter-old') ? ap(S, 'meter-old', 0.3, 0.45) : 0) + (S.is('full-old') ? ap(S, 'full-old', 0.35, 0.5) : 0);
  const sk = spec ? snap : { newSk: 0, oldSk: 1 };
  meter(S, { x: r.x, y, w: r.w }, S.l('aciertos en lo nuevo (rayado)', 'accuracy on the new part (hatched)'), sk.newSk, { tone: 'dat', hatch: true, a: a1, hot: clamp(hot1) });
  y += mh + gap;
  meter(S, { x: r.x, y, w: r.w }, S.l('aciertos en lo que ya sabía (resto)', 'accuracy on what it knew (the rest)'), sk.oldSk, { tone: 'dat', a: a2, hot: clamp(hot2), ghost: S.on('full-old') && !S.on('replay') && !lora ? 1 : undefined });
  y += mh + gap + 4 * u;

  // ── una línea más, según el momento ──
  const yl = y + lineH(S, 12.5, 1.2) / 2;
  if (S.on('toy-lora-result')) {
    const nr = getRun(LORA_N).at(STEPS);
    fitText(S, S.l(`sin repaso: lo nuevo ${S.n(nr.newSk * 100, 0)} %, lo que sabía ${S.n(nr.oldSk * 100, 0)} %`, `without replay: new part ${S.n(nr.newSk * 100, 0)}%, what it knew ${S.n(nr.oldSk * 100, 0)}%`),
      r.x, yl, r.w, { s: 12.5, weight: 700, c: tone(S, 'err').ink, a: ap(S, 'toy-lora-result', 0.62, 0.76) });
  }
  void alp; void fr;
}
