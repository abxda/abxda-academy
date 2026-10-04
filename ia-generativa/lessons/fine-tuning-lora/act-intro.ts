// Actos 1 y 2: el problema (modelo base + tus datos) y el modelo diminuto (ajuste completo y olvido).
import { box, clamp, ease, inset, link, neu, regions, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { BASE } from './base';
import { drawPanel } from './panel';
import { getRun, STEPS, type Snap } from './runs';
import { CHANGED, FT, G, TARGET, TARGET_BASE, skills } from './task';
import { alp, chip, classMark, drawMap, drawSigned, maxAbs, para, squareIn, wrongCells, CLS_TONE, FS } from './ui';

export const FULL_A = { mode: 'full', replay: false, rule: 'A' } as const;
const RATE = 100;                                    // pasos de entrenamiento por segundo en las animaciones narradas
export const stepAt = (S: Frame, seg: string, delay = 0.5): number => clamp(Math.floor((S.since(seg) - delay) * RATE), 0, STEPS);

const BASE_SK = skills(TARGET_BASE, 'A');            // el modelo base sobre la regla A: la habilidad nueva es ≈ 0 y la original 100 %
const wrongCache = new WeakMap<Snap, Uint8Array>();
export const wrongOld = (s: Snap): Uint8Array => { let w = wrongCache.get(s); if (!w) { w = wrongCells(s.pred, TARGET.A, TARGET_BASE, CHANGED.A, 'old'); wrongCache.set(s, w); } return w; };

// ═════════════════════════════════════════════════════════════════════════════
// Acto 1 · el modelo base, tus ejemplos y el bucle
// ═════════════════════════════════════════════════════════════════════════════
export function drawConcept(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const fadePiles = S.at('scale-diff', 0, 0.7);
  const main = (1 - fadePiles) * vis;
  if (main > 0.01) d.withAlpha(main, () => drawBaseBlock(S, all));
  if (fadePiles > 0.01) d.withAlpha(fadePiles * vis, () => drawPiles(S, all));
  void p;
}

function drawBaseBlock(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u;
  const side = Math.min(all.h * (S.portrait ? 0.42 : 0.66), all.w * (S.portrait ? 0.44 : 0.3));
  const bx = all.x + 8 * u, by = all.y + (S.portrait ? 34 : 46) * u;
  const aBlock = S.reveal('hook', 0, 0.8);
  // el bloque: la capa central REAL del modelo diminuto (1 024 pesos) como imagen de «los pesos del modelo base»
  d.withAlpha(aBlock, () => {
    drawSigned(S, bx, by, BASE.W2, 32, 32, side / 32, { range: maxAbs(BASE.W2) * 0.9, neutral: true });
    // el ajuste fino empuja los pesos: superponemos el cambio REAL del ajuste completo, paso a paso
    const k = S.on('ft-def') ? Math.min(60, Math.floor(S.since('ft-def') * 28)) : 0;
    if (k > 0) {
      const dW = getRun(FULL_A).at(k).dW, fade = S.at('scale-diff', 0, 0.4);
      drawSigned(S, bx, by, dW, 32, 32, side / 32, { range: Math.max(1.2, maxAbs(dW)) * 1.1, a: 0.85 * (1 - fade), frame: false });
    }
  });
  chip(S, S.l('modelo base', 'base model'), bx + side / 2, by - 18 * u, { tone: 'ink', a: aBlock });
  d.text(S.l('(sus pesos, en píxeles)', '(its weights, as pixels)'), bx + side / 2, by + side + 8 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', a: aBlock });

  // columna derecha
  const cx = bx + side + 28 * u, cw = all.x + all.w - cx;
  const know = [S.l('gramática', 'grammar'), S.l('hechos del mundo', 'world facts'), S.l('código', 'code')];
  const dont = [S.l('tu empresa', 'your company'), S.l('tu tono', 'your tone'), S.l('tus formatos', 'your formats')];
  const hookFade = 1 - S.at('ft-def', 0, 0.6);
  if (hookFade > 0.01) {
    const gap = 30 * u;
    d.text(S.l('lo que sabe', 'what it knows'), cx, by - 2 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom', a: S.reveal('hook', 0.5, 0.4) * hookFade });
    know.forEach((t, i) => chip(S, t, cx, by + 14 * u + i * gap, { align: 'left', tone: 'ink', a: S.reveal('hook', 0.7 + i * 0.35, 0.4) * hookFade }));
    const y2 = by + 14 * u + 3 * gap + 16 * u;
    d.text(S.l('lo que no sabe', 'what it does not know'), cx, y2 - 14 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom', a: S.reveal('hook', 2.0, 0.4) * hookFade });
    dont.forEach((t, i) => chip(S, t, cx, y2 + i * gap, { align: 'left', tone: 'dat', dashed: true, a: S.reveal('hook', 2.2 + i * 0.35, 0.4) * hookFade }));
    if (!S.portrait) neu(S, cx + cw - 70 * u, by + 6 * u, { scale: Math.max(2, Math.round(2.4 * u)), mood: 'think', a: S.reveal('hook', 3.2, 0.5) * hookFade });
  }

  // tus ejemplos (entrada → respuesta) entran al bloque
  if (S.on('ft-def')) {
    const ch = (S.portrait ? 38 : 44) * u, gap = 12 * u, n = 3;
    const y0 = by + (S.portrait ? 4 : 14) * u;
    d.text(S.l('tus ejemplos', 'your examples'), cx, y0 - 8 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'bottom', a: S.reveal('ft-def', 0, 0.4) });
    for (let i = 0; i < n; i++) {
      const a = S.reveal('ft-def', 0.2 + i * 0.3, 0.5), y = y0 + i * (ch + gap), slide = (1 - a) * 40 * u;
      d.withAlpha(a, () => {
        const wIn = cw * 0.44, wOut = cw * 0.34, x = cx + slide;
        d.rect(x, y, wIn, ch, { fill: tone(S, 'sig').soft, stroke: tone(S, 'sig').c, lw: 1.3, r: 3 });
        d.rect(x + wIn + cw * 0.08, y, wOut, ch, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.3, r: 3 });
        d.arrow(x + wIn + 3, y + ch / 2, x + wIn + cw * 0.08 - 3, y + ch / 2, p.ink2, 1.6, 6);
        // líneas de «texto» (marcadores de posición)
        for (let q = 0; q < 2; q++) { d.rect(x + 8 * u, y + 9 * u + q * 12 * u, wIn * (q ? 0.55 : 0.78), 4 * u, { fill: alp(tone(S, 'sig').c, 0.45) }); }
        d.rect(x + wIn + cw * 0.08 + 8 * u, y + 15 * u, wOut * 0.62, 4 * u, { fill: alp(tone(S, 'dat').c, 0.5) });
      });
    }
    d.text(S.l('entrada', 'input'), cx + cw * 0.22, y0 + 3 * (ch + gap) - 4 * u, { size: FS(S, 12), weight: 700, color: tone(S, 'sig').ink, align: 'center', base: 'top', a: S.reveal('ft-def', 1.0, 0.4) });
    d.text(S.l('respuesta que quieres', 'answer you want'), cx + cw * 0.52 + cw * 0.17, y0 + 3 * (ch + gap) - 4 * u, { size: FS(S, 12), weight: 700, color: tone(S, 'dat').ink, align: 'center', base: 'top', a: S.reveal('ft-def', 1.0, 0.4) });
  }

  // el bucle de siempre
  if (S.on('ft-def')) {
    const labels = [S.l('ejemplo', 'example'), S.l('error', 'error'), S.l('gradiente', 'gradient'), S.l('actualizar', 'update')];
    const tones = ['dat', 'err', 'err', 'w'] as const;
    const bh = 32 * u, gap = 22 * u, bw = (all.w - 3 * gap) / 4, y = all.y + all.h - bh - 2 * u;
    const boxes: Rect[] = labels.map((_, i) => ({ x: all.x + i * (bw + gap), y, w: bw, h: bh }));
    boxes.forEach((b, i) => { const a = S.reveal('ft-def', 1.6 + i * 0.35, 0.4); if (a > 0) box(S, b, labels[i], { tone: tones[i], a, size: FS(S, 13), active: Math.floor(S.clock / 0.9) % 4 === i ? 1 : 0 }); });
    for (let i = 0; i < 3; i++) { const a = S.at('ft-def', 1.9 + i * 0.35, 2.4 + i * 0.35); if (a > 0) link(S, boxes[i], boxes[i + 1], { tone: 'ink', progress: a }); }
    const aL = S.at('ft-def', 3.0, 3.6);
    if (aL > 0) d.withAlpha(aL, () => { d.polyline([[boxes[3].x + boxes[3].w / 2, y + bh], [boxes[3].x + boxes[3].w / 2, y + bh + 9 * u], [boxes[0].x + boxes[0].w / 2, y + bh + 9 * u], [boxes[0].x + boxes[0].w / 2, y + bh]], p.ink2, 1.5); });
  }
}

function drawPiles(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const big: Rect = S.portrait ? { x: all.x, y: all.y + 10 * u, w: all.w, h: all.h * 0.4 } : { x: all.x, y: all.y + 30 * u, w: all.w * 0.6, h: all.h * 0.52 };
  const small: Rect = S.portrait ? { x: all.x, y: all.y + all.h * 0.58, w: all.w, h: all.h * 0.3 } : { x: all.x + all.w * 0.68, y: all.y + 30 * u, w: all.w * 0.32, h: all.h * 0.52 };
  const a1 = S.reveal('scale-diff', 0, 0.7), a2 = S.reveal('scale-diff', 1.8, 0.7);
  d.withAlpha(a1, () => {
    d.rect(big.x, big.y, big.w, big.h, { fill: p.surface, stroke: lat.c, lw: 1.5 });
    d.dither(big.x + 2, big.y + 2, big.w - 4, big.h - 4, lat.c, 0.55, 2);
    const num = S.l('300 000 000 000', '300,000,000,000');
    const nw = d.measure(num, { size: S.portrait ? 22 : 30, weight: 800, font: 'mono' });
    d.rect(big.x + big.w / 2 - nw / 2 - 12 * u, big.y + big.h / 2 - 22 * u, nw + 24 * u, 44 * u, { fill: p.surface, stroke: lat.c, lw: 1.5, r: 3 });
    d.text(num, big.x + big.w / 2, big.y + big.h / 2, { size: S.portrait ? 22 : 30, weight: 800, font: 'mono', color: lat.ink, align: 'center', base: 'middle' });
    d.text(S.l('tokens · preentrenamiento de GPT-3', 'tokens · GPT-3 pretraining'), big.x, big.y - 8 * u, { size: FS(S, 13), weight: 700, color: lat.ink, base: 'bottom' });
  });
  d.withAlpha(a2, () => {
    const cols = 5, rows = 4, cs = Math.min(small.w / 9, small.h / 7, 16 * u), gx = small.x + (S.portrait ? 0 : small.w / 2 - (cols * cs) / 2), gy = small.y + small.h * 0.12;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d.rect(gx + i * cs, gy + j * cs, cs - 2, cs - 2, { fill: alp(dat.c, 0.75) });
    const cx = S.portrait ? gx + cols * cs + 14 * u : small.x + small.w / 2;
    d.text(S.l('1 000', '1,000'), S.portrait ? cx : cx, S.portrait ? gy + 4 * u : gy + rows * cs + 10 * u, { size: S.portrait ? 24 : 28, weight: 800, font: 'mono', color: dat.ink, align: S.portrait ? 'left' : 'center', base: 'top' });
    para(S, S.l('ejemplos · ajuste fino de LIMA (65 mil millones de parámetros)', 'examples · LIMA fine-tuning (65 billion parameters)'), S.portrait ? cx : small.x, S.portrait ? gy + 36 * u : gy + rows * cs + 44 * u, S.portrait ? all.x + all.w - cx : small.w, { size: FS(S, 13), weight: 700, color: dat.ink, align: S.portrait ? 'left' : 'left' });
  });
  d.text(S.l('(sin escala: solo para sentir la diferencia)', '(not to scale: just to feel the difference)'), all.x + all.w / 2, all.y + all.h - 2 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'bottom', a: a2 });
}

// ═════════════════════════════════════════════════════════════════════════════
// Acto 2 · el modelo diminuto: mapa de decisión, regla nueva, ajuste completo y olvido
// ═════════════════════════════════════════════════════════════════════════════
export function drawToy(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u;
  const R = regions(S, S.portrait ? 0.7 : 0.6);
  const cap = (S.portrait ? 20 : 24) * u;
  const mapR = squareIn(R.main, 0, cap, 'l');
  const run = getRun(FULL_A);
  const step = S.on('full-ft') ? stepAt(S, 'full-ft') : 0;
  const snap = run.at(step);
  const inCopies = S.on('cost-copies');
  const a = vis * (inCopies ? 1 - S.at('cost-copies', 0, 0.5) : 1);
  if (a < 0.01) return;
  d.withAlpha(a, () => {
    // mapa
    drawMap(S, mapR, snap.pred, {
      reveal: S.reveal('toy-intro', 0.1, 1.2),
      hatch: S.on('company-rule') ? CHANGED.A : null, a: 1,
      wrong: S.on('forget-name') ? wrongOld(snap) : null,
      data: S.on('company-rule') ? FT.A.slice(0, Math.round(FT.A.length * S.at('company-rule', 0.8, 2.4, 'lin'))) : undefined,
      dataA: 0.95,
    });
    // pie del mapa
    const capText = S.on('forget-name') ? S.l('punto oscuro = respuesta incorrecta', 'dark dot = wrong answer')
      : S.on('company-rule') ? S.l('rayado = donde cambia la regla · marcas = tus ejemplos', 'hatched = where the rule changes · marks = your examples')
        : S.l('qué responde el modelo en cada punto del plano', 'what the model answers at each point of the plane');
    d.text(capText, mapR.x, mapR.y + mapR.h + 7 * u, { size: FS(S, 12), weight: 600, color: p.mute, base: 'top', w: Math.max(mapR.w, R.main.w) });
    // leyenda de clases
    if (!S.on('company-rule') || S.portrait === false) {
      const ly = mapR.y - 2 * u;
      void ly;
    }
    // aside
    const first = S.reveal('toy-intro', 0.8, 0.6);
    if (!S.on('company-rule')) {
      d.withAlpha(first, () => {
        const r = R.aside; let y = r.y;
        d.text(S.l('modelo diminuto', 'tiny model'), r.x, y, { size: FS(S, 14), weight: 800, color: p.ink, base: 'top' }); y += 22 * u;
        d.text(S.l('ilustrativo, pero real: se entrena en tu navegador', 'illustrative, but real: it trains in your browser'), r.x, y, { size: FS(S, 12), weight: 600, color: p.mute, w: r.w, base: 'top' }); y += 40 * u;
        d.text(S.l('parámetros', 'parameters'), r.x, y, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
        d.text(S.n(1251, 0), r.x, y + 15 * u, { size: FS(S, 28), weight: 700, font: 'mono', color: tone(S, 'w').ink, base: 'top' }); y += 56 * u;
        d.text(S.l('entrada: 2 números · 2 capas de 32 · salida: 3 clases', 'input: 2 numbers · 2 layers of 32 · output: 3 classes'), r.x, y, { size: FS(S, 12), weight: 600, color: p.ink2, w: r.w, base: 'top' }); y += 44 * u;
        // leyenda de clases
        [0, 1, 2].forEach((c, i) => { const yy = y + i * 24 * u; classMark(S, c, r.x + 8 * u, yy + 8 * u, 5 * u); d.text(S.l(`clase ${c + 1}`, `class ${c + 1}`), r.x + 24 * u, yy + 8 * u, { size: FS(S, 13), weight: 600, color: tone(S, CLS_TONE[c]).ink, base: 'middle' }); });
      });
    } else {
      const trainable = S.on('full-ft') ? 1251 : 0;
      drawPanel(S, R.aside, {
        a: S.reveal('company-rule', 0.2, 0.6), trainable, frozen: S.on('full-ft') ? 0 : 1251,
        newSk: snap.newSk, oldSk: snap.oldSk, oldRef: S.on('forget-name') ? BASE_SK.oldSk : undefined,
        showTrain: S.on('full-ft'), losses: run.losses, step, total: STEPS, showLoss: S.on('full-ft'),
        title: S.l('habilidades medidas en el mapa', 'skills measured on the map'),
      });
    }
  });
}

/** Tres copias completas del modelo (una por cliente), cada una de 350 GB en GPT-3. */
export function drawCopies(S: Frame, vis: number) {
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 16 * u);
  const a = vis * S.at('cost-copies', 0, 0.7);
  if (a < 0.01) return;
  d.withAlpha(a, () => {
    const n = 3, gap = 22 * u, side = Math.min((all.w - gap * (n - 1)) / n, all.h * 0.52, 190 * u);
    const x0 = all.x + (all.w - (n * side + (n - 1) * gap)) / 2, y0 = all.y + all.h * 0.12;
    const names = [S.l('cliente A', 'customer A'), S.l('cliente B', 'customer B'), S.l('cliente C', 'customer C')];
    for (let i = 0; i < n; i++) {
      const ai = S.reveal('cost-copies', 0.2 + i * 0.5, 0.6), x = x0 + i * (side + gap);
      d.withAlpha(ai, () => {
        drawSigned(S, x, y0, BASE.W2.map((v, k) => v * (1 + 0.3 * Math.sin(k * 0.37 + i * 2))), 32, 32, side / 32, { range: maxAbs(BASE.W2) * 0.9, neutral: true });
        chip(S, names[i], x + side / 2, y0 - 16 * u, { tone: 'ink' });
        d.text('350 GB', x + side / 2, y0 + side + 16 * u, { size: S.portrait ? 18 : 22, weight: 800, font: 'mono', color: p.ink, align: 'center', base: 'top' });
      });
    }
    const a2 = S.reveal('cost-copies', 2.0, 0.6);
    d.text(S.l('GPT-3: una copia completa por cliente o tarea', 'GPT-3: one full copy per customer or task'), all.x + all.w / 2, y0 + side + 52 * u, { size: FS(S, 14), weight: 700, color: p.ink2, align: 'center', base: 'top', a: a2, w: all.w });
    d.text(S.l('350 GB = 175 mil millones de parámetros × 2 bytes (Hu et al., 2021)', '350 GB = 175 billion parameters × 2 bytes (Hu et al., 2021)'), all.x + all.w / 2, y0 + side + 76 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', a: a2, w: all.w });
  });
  void ease;
}
