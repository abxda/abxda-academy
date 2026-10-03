// Escena: Predecir la siguiente palabra. Un modelo de n-gramas REAL (lm.ts, calculado en el navegador sobre un texto
// de dominio público, corpus.ts) con barras de probabilidad, el bucle autorregresivo, softmax con temperatura,
// top-k/top-p, y tres turnos interactivos. Las animaciones de la narración usan generaciones con semilla fija
// (deterministas); los turnos usan semillas que cambian con cada pulsación, y su estado vive en S.st.
import {
  alpha, badge, box, clamp, inset, lerp, link, neu, rng, split, token, tone,
  type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { CORPUS } from './corpus';
import { barRows, cumChart, formulaBox, fz, lab, pct, probRows, ribbon, scoreTable, strip, tdial } from './draw';
import { buildModel, generate, kwic, lookup, pretty, probs, truncate, type Lang, type Model, type Prob, type Step } from './lm';

// ═════════════ configuración por idioma: cada idioma lee su propio texto ═════════════
interface Cfg {
  /** Contexto con favorita clara, mediano y plano. */
  A: string; B: string; C: string;
  start: string[]; start2: string[];
  unseen: string; seen: string;
  rand: [number, number, number]; tseed: [number, number, number]; ctx2seed: number;
  prompts: [string, string, string];
  sentence: string;
  word: string; pieces: [string, string];
}
const CFG: Record<Lang, Cfg> = {
  es: {
    A: 'don', B: 'aquel', C: 'de', start: ['don'], start2: ['don', 'quijote'], unseen: 'yegua', seen: 'rocín',
    rand: [2, 6, 4], tseed: [6, 6, 1], ctx2seed: 1,
    prompts: ['La capital de Francia es ___', 'Todos los gatos son animales. Tom es un gato, así que Tom es ___', 'Estimado cliente: le escribimos para ___'],
    sentence: 'El hidalgo leía libros de caballerías hasta que perdió el juicio y quiso hacerse caballero andante',
    word: 'predecir', pieces: ['pre', 'decir'],
  },
  en: {
    A: 'poor', B: 'when', C: 'the', start: ['poor'], start2: ['poor', 'alice'], unseen: 'hare', seen: 'rabbit',
    rand: [8, 6, 5], tseed: [3, 6, 1], ctx2seed: 14,
    prompts: ['The capital of France is ___', 'All cats are animals. Tom is a cat, so Tom is ___', 'Dear customer: we are writing to ___'],
    sentence: 'The girl followed the white rabbit down the hole until she landed in a strange hall of doors',
    word: 'predicting', pieces: ['predict', 'ing'],
  },
};
const SEED_RUN = 6;                   // «pick» y «run»: el primer sorteo cae en la favorita en ambos idiomas

// ═════════════ demostraciones deterministas (la misma semilla da el mismo texto) ═════════════
interface Demo {
  m: Model; c: Cfg;
  run: Step[]; greedy: Step[]; rand: Step[][]; samples: Step[][]; ctx2: [Step[], Step[]];
  cycle: [number, number] | null;
  ps: { A: Prob[]; B: Prob[]; C: Prob[]; seen: Prob[] };
  corpusWords: number; excerpt: string[];
}
const words = (start: string[], st: Step[]) => [...start, ...st.map((s) => s.ps[s.pick].w)];
const dist = (m: Model, w: string, T = 1) => probs(lookup(m, [w], 1)?.rows ?? [], T);

/** Tramo repetido al final de un texto voraz: [inicio, fin] de un ciclo que ya se repitió dos veces. */
function findCycle(w: string[]): [number, number] | null {
  for (let s = 0; s < w.length / 2; s++) for (let p = 1; s + 2 * p <= w.length; p++) {
    let ok = true; for (let i = s; i + p < w.length; i++) if (w[i] !== w[i + p]) { ok = false; break; }
    if (ok && s + 2 * p <= w.length) return [s, s + p - 1];
  }
  return null;
}

const DEMOS: Partial<Record<Lang, Demo>> = {};
function demo(lang: Lang): Demo {
  const hit = DEMOS[lang]; if (hit) return hit;
  const c = CFG[lang], m = buildModel(CORPUS[lang].paragraphs, lang);
  const g = generate(m, c.start, 30, { k: 1, T: 1, greedy: true }, 0), gw = words(c.start, g), cyc = findCycle(gw);
  const glen = cyc ? Math.max(cyc[0] + 2 * (cyc[1] - cyc[0] + 1) + 1, 10) : 12;
  const rand = c.rand.map((s) => generate(m, c.start, 12, { k: 1, T: 1 }, s));
  const samples = [0.3, 1, 2.5].map((T, i) => generate(m, c.start, 12, { k: 1, T }, c.tseed[i]));
  const par = CORPUS[lang].paragraphs, re = new RegExp(`\\b${c.A}\\b`, 'i');
  const para = par.find((q) => re.test(q)) ?? par[0];
  const ex = para.split(/\s+/); const at = ex.findIndex((w) => re.test(w));
  const from = Math.max(0, at - 30);
  const d: Demo = {
    m, c, run: generate(m, c.start, 10, { k: 1, T: 1 }, SEED_RUN), greedy: g.slice(0, glen - c.start.length),
    rand, samples, ctx2: [generate(m, c.start2, 14, { k: 1, T: 1 }, c.ctx2seed), generate(m, c.start2, 14, { k: 2, T: 1 }, c.ctx2seed)],
    cycle: cyc && cyc[1] < glen ? cyc : null,
    ps: { A: dist(m, c.A), B: dist(m, c.B), C: dist(m, c.C), seen: dist(m, c.seen) },
    corpusWords: CORPUS[lang].paragraphs.join(' ').split(/\s+/).length,
    excerpt: ex.slice(from, from + 62),
  };
  return (DEMOS[lang] = d);
}

// ═════════════ estado interactivo ═════════════
interface Run { mode: 'random' | 'greedy'; T: number; w: string[]; shown: number }
const grow = (S: Frame, key: 'g1' | 'g2'): { runs: Run[]; n: number; hi?: boolean; lo?: boolean } => (S.st[key] ??= { runs: [], n: 0, hi: false, lo: false });
const g3 = (S: Frame): { seen: Record<string, boolean>; moved: boolean } => (S.st.g3 ??= { seen: {}, moved: false });

// ═════════════ geometría ═════════════
function lay(S: Frame) {
  const u = S.u, all = inset(S.full(), 14 * u), gap = 10 * u;
  const rh = S.portrait ? Math.min(112 * u, all.h * 0.25) : Math.min(86 * u, all.h * 0.27);
  const rib: Rect = { x: all.x, y: all.y, w: all.w, h: rh };
  const body: Rect = { x: all.x, y: all.y + rh + gap, w: all.w, h: all.h - rh - gap };
  return { all, rib, body, gap };
}
/** Reparte un rectángulo: en horizontal, izquierda/derecha; en vertical (teléfono), arriba/abajo. */
const two = (S: Frame, r: Rect, ratio: number): [Rect, Rect] => split(r, S.portrait ? 'v' : 'h', ratio, 12 * S.u);

/** Vista con aparición y desaparición suaves entre segmentos. */
function view(S: Frame, from: string, to: string | undefined, fn: () => void) {
  if (!S.on(from)) return;
  const a = S.reveal(from, 0, 0.45) * (to ? 1 - S.reveal(to, 0, 0.35) : 1);
  if (a > 0.003) S.d.withAlpha(a, fn);
}
const tagAt = (S: Frame, text: string, x: number, y: number, t: 'sig' | 'err' | 'w' | 'dat' | 'lat' | 'mute' | 'ink' = 'ink', align: CanvasTextAlign = 'left') => badge(S, text, x, y, { tone: t, align, size: fz(S, 12) });

// ═════════════ la escena ═════════════
const fmt2 = (v: number, l: string) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CTX_OPTS = [
  { value: 'A', label: { es: '«don»', en: '“poor”' } },
  { value: 'B', label: { es: '«aquel»', en: '“when”' } },
  { value: 'C', label: { es: '«de»', en: '“the”' } },
];

const scene: SceneFactory = () => ({
  controls: [
    { id: 'mode', kind: 'choice', label: { es: 'Modo de elegir', en: 'How to choose' }, options: [{ value: 'random', label: { es: 'Aleatorio', en: 'Random' } }, { value: 'greedy', label: { es: 'Voraz', en: 'Greedy' } }], value: 'random', from: 'try1', to: 'scores' },
    { id: 'gen', kind: 'button', primary: true, label: { es: 'Generar texto', en: 'Generate text' }, from: 'try1', to: 'scores' },
    { id: 'temp', kind: 'slider', label: { es: 'Temperatura T', en: 'Temperature T' }, min: 0.1, max: 3, step: 0.05, value: 1, from: 'try2', to: 'samples', fmt: fmt2 },
    { id: 'gen2', kind: 'button', primary: true, label: { es: 'Generar con esta T', en: 'Generate with this T' }, from: 'try2', to: 'samples' },
    { id: 'topp', kind: 'slider', label: { es: 'p (top-p)', en: 'p (top-p)' }, min: 0.1, max: 1, step: 0.01, value: 0.9, from: 'try3', to: 'context2', fmt: (v) => `${Math.round(v * 100)} %` },
    { id: 'ctx3', kind: 'choice', label: { es: 'Contexto', en: 'Context' }, options: CTX_OPTS, value: 'A', from: 'try3', to: 'context2' },
  ],

  action(S, id) {
    const { m, c } = demo(S.lang as Lang);
    if (id === 'gen') {
      const g = grow(S, 'g1'), mode = S.p.mode === 'greedy' ? 'greedy' : 'random';
      const st = generate(m, c.start, 13, { k: 1, T: 1, greedy: mode === 'greedy' }, 41 + g.n * 17);
      g.runs.push({ mode, T: 1, w: words(c.start, st), shown: S.reduced ? 99 : 1 }); g.n++;
    } else if (id === 'gen2') {
      const g = grow(S, 'g2'), T = S.p.temp ?? 1;
      const st = generate(m, c.start, 13, { k: 1, T }, 77 + g.n * 23);
      g.runs.push({ mode: 'random', T, w: words(c.start, st), shown: S.reduced ? 99 : 1 }); g.n++;
    }
  },

  // Estado interactivo: avanza siempre, aunque el escenario no se vea. render() solo dibuja.
  update(S) {
    const { m, c } = demo(S.lang as Lang);
    for (const k of ['g1', 'g2'] as const) for (const r of grow(S, k).runs) if (r.shown < r.w.length) r.shown = S.reduced ? r.w.length : Math.min(r.w.length, r.shown + S.dt * 9);
    if (S.between('try1', 'scores')) {
      const g = grow(S, 'g1'); if (g.runs.filter((r) => r.mode === 'random').length >= 3 && g.runs.some((r) => r.mode === 'greedy')) S.complete('gen');
    }
    if (S.between('try2', 'samples')) {
      const g = grow(S, 'g2'), top = dist(m, c.B, S.p.temp ?? 1)[0].p;
      if (top >= 0.9) g.hi = true;
      if (top <= 0.2) g.lo = true;
      if (g.hi && g.lo) S.complete('temp');
    }
    if (S.between('try3', 'context2')) {
      const g = g3(S); g.seen[S.p.ctx3 ?? 'A'] = true;
      if (Math.abs((S.p.topp ?? 0.9) - 0.9) > 0.005) g.moved = true;
      if (g.moved && g.seen.A && g.seen.B && g.seen.C) S.complete('topp');
    }
  },

  render(S) {
    const D = demo(S.lang as Lang), L = lay(S);
    view(S, 'hook', 'source', () => vIntro(S, D, L));
    view(S, 'source', 'count', () => vSource(S, D, L));
    view(S, 'count', 'pick', () => vCount(S, D, L));
    view(S, 'pick', 'autoreg', () => vPick(S, D, L));
    view(S, 'autoreg', 'run', () => vLoop(S, D, L));
    view(S, 'run', 'greedy', () => vRun(S, D, L));
    view(S, 'greedy', 'random', () => vGreedy(S, D, L));
    view(S, 'random', 'try1', () => vRandom(S, D, L));
    view(S, 'try1', 'scores', () => vG1(S, D, L));
    view(S, 'scores', 'samples', () => vTable(S, D, L));
    view(S, 'samples', 'tail', () => vSamples(S, D, L));
    view(S, 'tail', 'topk', () => vTail(S, D, L, false));
    view(S, 'topk', 'topp', () => vTail(S, D, L, true));
    view(S, 'topp', 'try3', () => vTopP(S, D, L));
    view(S, 'try3', 'context2', () => vG3(S, D, L));
    view(S, 'context2', 'memorize', () => vCtx2(S, D, L));
    view(S, 'memorize', 'unseen', () => vMemorize(S, D, L));
    view(S, 'unseen', 'neural', () => vUnseen(S, D, L));
    view(S, 'neural', 'essay1', () => vNeural(S, D, L));
    view(S, 'essay1', 'essay2', () => vEssay1(S, D, L));
    view(S, 'essay2', 'honest', () => vEssay2(S, D, L));
    view(S, 'honest', 'scale', () => vHonest(S, D, L));
    view(S, 'scale', 'trained', () => vScale(S, D, L));
    view(S, 'trained', 'recap', () => vTrained(S, D, L));
    view(S, 'recap', 'bridge', () => vRecap(S, D, L));
    view(S, 'bridge', undefined, () => vBridge(S, D, L));
  },
});
export default scene;

type L = ReturnType<typeof lay>;

// ═════════════════════════════════════════════════════════════════════════
// Hook y barras: «don» ▍ → sugerencias → probabilidades
// ═════════════════════════════════════════════════════════════════════════
function vIntro(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, ps = D.ps.A;
  ribbon(S, m, L.rib, { tokens: [c.A], k: 1, cursor: true, label: S.l('texto', 'text'), a: S.reveal('hook', 0.1, 0.5) });
  const chipsA = 1 - S.at('bars', 0, 0.4);
  if (chipsA > 0.01) {
    const b = L.body, y = b.y + b.h * 0.3, size = fz(S, 20), h = 44 * u;
    const items = ps.slice(0, 3).map((q) => lab(S, m, q.w)), w = items.map((t) => d.measure(t, { size, weight: 700 }) + 34 * u);
    const tot = w.reduce((a, x) => a + x, 0) + 14 * u * 2;
    let x = b.x + (b.w - tot) / 2;
    d.withAlpha(chipsA * S.reveal('hook', 0.8, 0.4), () => d.text(S.l('sugerencias', 'suggestions'), b.x + b.w / 2, y - 22 * u, { size: fz(S, 13), weight: 700, color: p.mute, align: 'center', base: 'bottom' }));
    items.forEach((t, i) => {
      const a = S.reveal('hook', 1.0 + i * 0.5, 0.4) * chipsA;
      d.withAlpha(a, () => { d.rect(x, y, w[i], h, { fill: tone(S, 'lat').soft, stroke: tone(S, 'lat').c, lw: 1.5, r: 5 }); d.text(t, x + w[i] / 2, y + h / 2, { size, weight: 700, align: 'center', base: 'middle' }); });
      x += w[i] + 14 * u;
    });
  }
  if (S.on('bars')) {
    const b = L.body, sh = 58 * u, br: Rect = { x: b.x, y: b.y, w: b.w, h: b.h - sh - 6 * u }, sr: Rect = { x: b.x, y: b.y + b.h - sh, w: b.w, h: sh };
    const k = S.since('bars');
    barRows(S, br, probRows(S, m, ps, { rows: 5 }), { show: (k - 0.3) / 0.18, a: S.reveal('bars', 0.2, 0.4) });
    strip(S, sr, ps, { prog: S.at('bars', 1.8, 3.0), a: S.reveal('bars', 1.7, 0.4), label: S.l('todas suman', 'they all add up to') });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// De dónde salen: el texto de entrenamiento
// ═════════════════════════════════════════════════════════════════════════
const flowCache = new Map<string, { x: number; y: number; w: string }[]>();
function vSource(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, E = CORPUS[S.lang as Lang], r = L.all;
  const lat = tone(S, 'lat');
  // ficha del texto
  const hdr = fz(S, S.portrait ? 15 : 17), sub = fz(S, 13);
  const a0 = S.reveal('source', 0.1, 0.5);
  d.withAlpha(a0, () => {
    d.text(`${E.author.split(' ').slice(-1)[0] === 'Saavedra' ? 'Miguel de Cervantes' : E.author} · ${E.title} (${E.year})`, r.x, r.y + 2, { size: hdr, weight: 800, w: r.w, base: 'top' });
    const hy = r.y + (S.portrait ? 52 : 30) * u;
    d.text(`${E.part} · ${S.l('dominio público', 'public domain')} · ${E.source.split(' (')[0]}`, r.x, hy, { size: sub, color: p.mute, w: r.w, base: 'top' });
  });
  // texto con las apariciones resaltadas
  const top = r.y + (S.portrait ? 96 : 66) * u, box_: Rect = { x: r.x, y: top, w: r.w, h: r.h - (top - r.y) - 34 * u };
  const size = fz(S, S.portrait ? 14 : 15), lh = size * u * 1.5, sp = d.measure(' ', { size });
  const key = `${S.lang}|${Math.round(box_.w)}|${size}`;
  let lay_ = flowCache.get(key);
  if (!lay_) {
    lay_ = []; let x = 0, y = 0;
    D.excerpt.forEach((w) => { const wd = d.measure(w, { size }); if (x + wd > box_.w && x > 0) { x = 0; y += lh; } lay_!.push({ x, y, w }); x += wd + sp; });
    flowCache.set(key, lay_);
  }
  const rows = Math.max(1, Math.floor(box_.h / lh)), key2 = new RegExp(`^[^\\p{L}']*${D.c.A}[^\\p{L}']*$`, 'iu');
  const k = S.at('source', 0.6, 3.4, 'lin') * lay_.length;
  d.withAlpha(a0, () => {
    d.rect(box_.x - 6 * u, box_.y - 6 * u, box_.w + 12 * u, box_.h + 8 * u, { fill: p.surface, stroke: p.line, lw: 1, r: 4 });
    d.clip(box_.x, box_.y, box_.w, box_.h, () => {
      lay_!.forEach((t, i) => {
        const row = Math.round(t.y / lh); if (row >= rows) return;
        const a = clamp(k - i); if (a <= 0) return;
        const hit = key2.test(t.w), wd = d.measure(t.w, { size });
        d.withAlpha(a, () => {
          if (hit) d.rect(box_.x + t.x - 2 * u, box_.y + t.y, wd + 4 * u, lh - 2, { fill: lat.soft, stroke: lat.c, lw: 1, r: 3 });
          d.text(t.w, box_.x + t.x, box_.y + t.y + lh / 2, { size, weight: hit ? 800 : 500, color: hit ? p.ink : p.ink2, base: 'middle' });
        });
      });
    });
    d.dither(box_.x - 6 * u, box_.y + box_.h - 22 * u, box_.w + 12 * u, 24 * u, p.stage, 0.9, 2);
  });
  d.withAlpha(S.reveal('source', 2.2, 0.5), () => {
    d.text(S.l(`${S.n(D.corpusWords, 0)} palabras · el modelo solo conoce este texto`, `${S.n(D.corpusWords, 0)} words · the model knows only this text`), r.x + r.w / 2, r.y + r.h - 6 * u, { size: fz(S, 14), weight: 700, color: tone(S, 'dat').ink, align: 'center', base: 'bottom' });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Contar: concordancia y cuentas; dividir: probabilidades
// ═════════════════════════════════════════════════════════════════════════
function vCount(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, ps = D.ps.A, total = ps.reduce((a, q) => a + q.c, 0);
  ribbon(S, m, L.rib, { tokens: [c.A], k: 1, cursor: true, label: S.l('texto', 'text') });
  const b = L.body, divide = S.on('divide');
  const lines = kwic(m, c.A, S.portrait ? 6 : 7, S.portrait ? 3 : 4);
  // 1) concordancia (solo en «count»)
  const kA = divide ? 1 - S.at('divide', 0, 0.5) : 1;
  const [kr, tr] = divide ? two(S, b, S.portrait ? 0.34 : 0.4) : two(S, b, S.portrait ? 0.46 : 0.52);
  if (kA > 0.01 && !divide) {
    const rh = Math.min(32 * u, kr.h / (lines.length + 0.2)), size = fz(S, 15), cx = kr.x + kr.w * (S.portrait ? 0.46 : 0.5), cw = d.measure(m.show(c.A), { size, weight: 800 }) + 16 * u;
    lines.forEach((ln, i) => {
      const a = S.reveal('count', 0.5 + i * 0.5, 0.35) * kA; if (a <= 0) return;
      const y = kr.y + i * rh;
      d.withAlpha(a, () => {
        d.clip(kr.x, y, cx - cw / 2 - 6 * u - kr.x, rh, () => d.text(pretty(m, ln.left, false), cx - cw / 2 - 8 * u, y + rh / 2, { size, color: p.ink2, align: 'right', base: 'middle' }));
        d.rect(cx - cw / 2, y + 3, cw, rh - 6, { fill: tone(S, 'lat').soft, stroke: tone(S, 'lat').c, lw: 1.2, r: 3 });
        d.text(m.show(c.A), cx, y + rh / 2, { size, weight: 800, align: 'center', base: 'middle' });
        const nw = d.measure(lab(S, m, ln.next), { size, weight: 800 }) + 14 * u;
        d.rect(cx + cw / 2 + 6 * u, y + 3, Math.min(nw, kr.x + kr.w - (cx + cw / 2 + 6 * u)), rh - 6, { fill: tone(S, 'dat').soft, stroke: tone(S, 'dat').c, lw: 1.5, r: 3 });
        d.clip(cx + cw / 2 + 6 * u, y, kr.x + kr.w - (cx + cw / 2 + 6 * u), rh, () => d.text(lab(S, m, ln.next), cx + cw / 2 + 13 * u, y + rh / 2, { size, weight: 800, base: 'middle' }));
      });
    });
    d.withAlpha(S.reveal('count', 0.5 + lines.length * 0.5 + 0.2, 0.4) * kA, () => d.text('⋮', cx, kr.y + lines.length * rh + 2 * u, { size: fz(S, 16), color: p.mute, align: 'center', base: 'top' }));
  }
  // 2) cuentas → probabilidades
  const nShow = S.portrait ? 5 : 6, tall = divide ? b : tr;
  const reg: Rect = divide ? (S.portrait ? { x: b.x, y: b.y + 62 * u, w: b.w, h: b.h - 62 * u } : { x: b.x + b.w * 0.4 + 12 * u, y: b.y, w: b.w * 0.6 - 12 * u, h: b.h }) : tr;
  const tc = S.since('count'), full = S.at('count', 0.5 + lines.length * 0.5 + 0.4, 0.5 + lines.length * 0.5 + 1.6);
  const partial = (i: number) => lines.slice(0, clamp(Math.floor((tc - 0.5) / 0.5) + 1, 0, lines.length)).filter((l) => l.next === ps[i].w).length;
  const maxC = ps[0].c;
  if (!divide) {
    const rowsC = ps.slice(0, nShow).map((q, i) => ({ label: lab(S, m, q.w), v: lerp(partial(i), q.c, full), txt: String(Math.round(lerp(partial(i), q.c, full))), hot: false, c: q.c }));
    barRows(S, reg, rowsC, { axis: maxC, show: 99, tone: 'dat', a: S.reveal('count', 0.5, 0.5) });
    d.withAlpha(S.reveal('count', 0.5 + lines.length * 0.5 + 0.6, 0.5), () => d.text(S.l(`${total} apariciones de «${m.show(c.A)}»`, `${total} appearances of “${m.show(c.A)}”`), reg.x + reg.w, reg.y + reg.h - 2, { size: fz(S, 14), weight: 800, color: tone(S, 'dat').ink, align: 'right', base: 'bottom' }));
  } else {
    // «divide»: la misma lista, ahora con probabilidades
    const q0 = ps[0], pv = q0.c / total;
    barRows(S, reg, probRows(S, m, ps, { rows: nShow, hot: 0 }), { counts: true, a: S.reveal('divide', 0.1, 0.5) });
    const fr: Rect = S.portrait ? { x: b.x, y: b.y, w: b.w, h: 56 * u } : { x: b.x, y: b.y + 4 * u, w: b.w * 0.4, h: b.h };
    const wd = tone(S, 'dat'), lt = tone(S, 'lat');
    formulaBox(S, fr, [[['p', lt.ink], [' = ', p.ink2], ['c', wd.ink], [' ÷ ', p.ink2], [S.l('total', 'total'), p.ink]], [[`${q0.c} ÷ ${total} = ${S.n(pv, 3)}`, p.ink]]], { a: S.reveal('divide', 0.3, 0.5), size: S.portrait ? 16 : 18 });
    if (!S.portrait) d.withAlpha(S.reveal('divide', 1.6, 0.5), () => { d.text(S.l('modelo de n-gramas', 'n-gram model'), fr.x + fr.w / 2, fr.y + 118 * u, { size: fz(S, 15), weight: 800, color: p.ink, align: 'center' }); d.text(S.l('(contexto: 1 palabra)', '(context: 1 word)'), fr.x + fr.w / 2, fr.y + 140 * u, { size: fz(S, 13), color: p.mute, align: 'center' }); });
  }
  void tall;
}

// ═════════════════════════════════════════════════════════════════════════
// Elegir y agregar: sorteo sobre la franja, la palabra viaja al texto
// ═════════════════════════════════════════════════════════════════════════
function vPick(S: Frame, D: Demo, L: L) {
  const { d } = S, u = S.u, { m, c } = D, st = D.run[0], ps = st.ps;
  const b = L.body, sh = 58 * u, br: Rect = { x: b.x, y: b.y, w: b.w, h: b.h - sh - 6 * u }, sr: Rect = { x: b.x, y: b.y + b.h - sh, w: b.w, h: sh };
  const tok = words(c.start, [st]), fly = S.at('pick', 1.7, 2.6);
  const rb = ribbon(S, m, L.rib, { tokens: tok, k: 1, cursor: true, reveal: 1 + fly, newest: fly > 0.99, label: S.l('texto', 'text') });
  const u0 = S.reveal('pick', 0.3, 0.4) > 0 ? uOf(SEED_RUN) : undefined;
  const hot = S.on('pick') && S.since('pick') > 1.1 ? st.pick : undefined;
  const info = barRows(S, br, probRows(S, m, ps, { rows: 5, hot }), {});
  strip(S, sr, ps, { marker: S.reveal('pick', 0.3, 0.5) > 0.5 ? u0 : undefined, hot, a: 1, label: S.l('un número al azar, u, cae en un tramo', 'a random number, u, lands in a segment') });
  // la palabra elegida viaja al texto
  if (fly > 0.01 && fly < 0.99 && rb.pos[1]) {
    const t = rb.pos[1], from = { x: br.x + 60 * u, y: br.y + info.rowH * (st.pick + 0.5) };
    const x = lerp(from.x, t.x + t.w / 2, fly), y = lerp(from.y, t.y + t.h / 2, fly);
    d.text(lab(S, m, ps[st.pick].w), x, y, { size: fz(S, 18), weight: 800, align: 'center', base: 'middle', halo: S.pal.stage, haloW: 5 });
  }
}
/** Primer número que sortea la semilla (el mismo que usa generate en el primer paso). */
const uOf = (seed: number) => rng(seed)();

// ═════════════════════════════════════════════════════════════════════════
// El bucle (autorregresión)
// ═════════════════════════════════════════════════════════════════════════
function loopDiagram(S: Frame, r: Rect, o: { active: number; a?: number; reveal?: number; knobs?: boolean }) {
  const { d, pal: p } = S, u = S.u;
  const labels = [S.l('Texto (contexto)', 'Text (context)'), S.l('Modelo: probabilidades', 'Model: probabilities'), S.l('Elegir una palabra', 'Pick a word'), S.l('Agregar al texto', 'Append to text')];
  const tones = ['lat', 'w', 'dat', 'sig'] as const, rv = o.reveal ?? 4;
  const bw = Math.min(210 * u, S.portrait ? r.w * 0.8 : r.w * 0.36), bh = Math.min(54 * u, r.h * (S.portrait ? 0.15 : 0.22));
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: r.x + (r.w - bw) / 2 - 10 * u, y: r.y + 4 * u + i * (bh + (r.h - 4 * bh - 24 * u) / 3), w: bw, h: bh }))
    : [{ x: r.x + r.w / 2 - bw - 36 * u, y: r.y + r.h * 0.1, w: bw, h: bh }, { x: r.x + r.w / 2 + 36 * u, y: r.y + r.h * 0.1, w: bw, h: bh }, { x: r.x + r.w / 2 + 36 * u, y: r.y + r.h * 0.62, w: bw, h: bh }, { x: r.x + r.w / 2 - bw - 36 * u, y: r.y + r.h * 0.62, w: bw, h: bh }];
  d.withAlpha(o.a ?? 1, () => {
    pos.forEach((b, i) => { const a = clamp(rv - i); if (a > 0) box(S, b, `${i + 1} · ${labels[i]}`, { tone: tones[i], a, active: i === o.active ? 1 : 0, size: fz(S, 14) }); });
    for (let i = 0; i < 3; i++) { const a = clamp(rv - i - 0.5); if (a > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: a }); }
    const aLoop = clamp(rv - 3.4);
    if (aLoop > 0) {
      if (S.portrait) {
        const x1 = pos[3].x + pos[3].w, x2 = x1 + 16 * u, ya = pos[3].y + pos[3].h / 2, yb = pos[0].y + pos[0].h / 2;
        d.polyline([[x1, ya], [x2, ya], [x2, yb + (ya - yb) * (1 - aLoop)]], tone(S, 'ink').c, 2);
        if (aLoop > 0.98) d.arrow(x2, yb, x1 + 1, yb, tone(S, 'ink').c, 2, 8);
      } else link(S, pos[3], pos[0], { tone: 'ink', progress: aLoop });
    }
    if (o.knobs) {
      const kn = [{ i: 1, t: S.l('temperatura T', 'temperature T') }, { i: 2, t: 'top-p' }];
      kn.forEach(({ i, t }, j) => { const b = pos[i], y = S.portrait ? b.y + b.h + 2 * u : b.y + (i === 1 ? -22 * u : b.h + 16 * u); badge(S, '⚙ ' + t, b.x + b.w / 2, y + (S.portrait ? 9 * u : 0), { tone: 'w', size: fz(S, 12), a: clamp(rv - 4 - j * 0.5) }); });
    }
  });
  return pos;
}

function vLoop(S: Frame, D: Demo, L: L) {
  const { m, c } = D, tok = words(c.start, D.run.slice(0, 1));
  ribbon(S, m, L.rib, { tokens: tok, k: 1, cursor: true, newest: true, label: S.l('texto', 'text') });
  const k = S.since('autoreg');
  loopDiagram(S, L.body, { active: Math.floor(Math.max(0, k - 3.4) / 1.0) % 4, reveal: k / 0.75 });
  void c;
}

// ═════════════════════════════════════════════════════════════════════════
// El bucle en marcha (run), voraz (greedy), aleatorio (random)
// ═════════════════════════════════════════════════════════════════════════
/** Paso actual y fase dentro del paso, para una secuencia con tiempo `t` desde `t0`, `dt` por paso. */
function stepper(t: number, t0: number, dt: number, n: number) {
  const x = (t - t0) / dt; if (x < 0) return { i: -1, ph: 0, done: 0 };
  const i = Math.min(n - 1, Math.floor(x)), ph = i === n - 1 && x >= n ? 1 : x - Math.floor(x);
  return { i, ph: Math.min(ph, 0.999), done: i + (ph >= 0.5 || x >= n ? 1 : 0) };
}

function vRun(S: Frame, D: Demo, L: L) {
  const { m, c } = D, n = D.run.length, sp = stepper(S.since('run'), 0.5, 0.78, n);
  const done = Math.max(0, sp.done), idx = Math.max(0, Math.min(n - 1, sp.i));
  const fade = sp.i >= 0 && sp.ph >= 0.5 ? clamp((sp.ph - 0.5) / 0.3) : 1;
  ribbon(S, m, L.rib, { tokens: words(c.start, D.run.slice(0, Math.min(n, done + (sp.ph >= 0.5 || sp.i < 0 ? 0 : 0)))), k: 1, cursor: true, newest: done > 0, label: S.l('texto', 'text'), reveal: Math.max(1, done - 1 + fade) });
  const st = D.run[idx], hot = sp.i >= 0 && sp.ph >= 0.4 ? st.pick : undefined, b = L.body;
  barRows(S, b, probRows(S, m, st.ps, { rows: S.portrait ? 6 : 7, hot }), {});
  badge(S, S.l(`paso ${idx + 1} de ${n}`, `step ${idx + 1} of ${n}`), b.x + b.w, b.y - 2 * S.u, { tone: 'ink', align: 'right', size: fz(S, 12) });
  tagAt(S, S.l('contexto: ', 'context: ') + lab(S, m, st.ctx[st.ctx.length - 1]), b.x, b.y - 2 * S.u, 'lat');
}

function vGreedy(S: Frame, D: Demo, L: L) {
  const { m, c } = D, n = D.greedy.length, dt = 0.42, sp = stepper(S.since('greedy'), 0.4, dt, n);
  const shown = Math.max(0, sp.done);
  const w = words(c.start, D.greedy), cyc = D.cycle, cycleOn = cyc !== null && shown >= cyc[1] + (cyc[1] - cyc[0] + 1) + 1;
  ribbon(S, m, L.rib, { tokens: w.slice(0, Math.max(1, shown + c.start.length)), k: 1, cursor: true, newest: shown > 0, label: S.l('texto · modo voraz', 'text · greedy mode'), mark: cycleOn && cyc ? cyc : undefined, reveal: c.start.length + shown });
  const idx = Math.max(0, Math.min(n - 1, sp.i)), st = D.greedy[idx], b = L.body;
  barRows(S, b, probRows(S, m, st.ps, { rows: S.portrait ? 6 : 7, hot: sp.i >= 0 ? 0 : undefined }), {});
  tagAt(S, S.l('voraz: siempre la primera', 'greedy: always the first'), b.x, b.y - 2 * S.u, 'dat');
  if (cycleOn) badge(S, S.l('¡un ciclo!', 'a loop!'), b.x + b.w, b.y - 2 * S.u, { tone: 'err', align: 'right', size: fz(S, 13) });
}

function runRows(S: Frame, D: Demo, r: Rect, runs: { w: string[]; tag: string; t: 'dat' | 'w' | 'err' | 'sig' | 'lat'; reveal: number; a: number; k?: number }[], rowH: number) {
  const { m } = D;
  runs.forEach((q, i) => {
    const y = r.y + i * (rowH + 8 * S.u);
    if (y + rowH > r.y + r.h + 2) return;
    if (q.a <= 0) return;
    ribbon(S, m, { x: r.x, y, w: r.w, h: rowH }, { tokens: q.w, k: q.k ?? 0, reveal: q.reveal, label: q.tag, a: q.a, size: S.portrait ? 16 : 17, newest: false });
  });
}

function vRandom(S: Frame, D: Demo, L: L) {
  const { m, c } = D, t = S.since('random');
  ribbon(S, m, L.rib, { tokens: c.start, k: 1, cursor: true, label: S.l('texto: todos parten igual', 'text: all start the same') });
  const rowH = Math.min(70 * S.u, (L.body.h - 16 * S.u) / 3);
  runRows(S, D, L.body, D.rand.map((st, i) => ({ w: words(c.start, st), tag: S.l(`corrida ${i + 1}`, `run ${i + 1}`), t: 'lat' as const, reveal: ((t - 0.5 - i * 0.9) * 9), a: S.reveal('random', 0.4 + i * 0.9, 0.4) })), rowH);
}

// ═════════════════════════════════════════════════════════════════════════
// Turno 1: generar varias veces, en voraz y en aleatorio
// ═════════════════════════════════════════════════════════════════════════
function chip(S: Frame, x: number, y: number, text: string, ok: boolean, t: 'dat' | 'lat' | 'w' = 'dat') {
  const { d, pal: p } = S, u = S.u, size = fz(S, 14), tc = tone(S, ok ? 'dat' : t), w = d.measure(text, { size, weight: 700 }) + 38 * u, h = 28 * u;
  d.rect(x, y, w, h, { fill: ok ? tc.soft : p.surface, stroke: ok ? tc.c : p.lineStrong, lw: 1.5, r: 4, dash: ok ? undefined : [4, 3] });
  d.text(text, x + 30 * u, y + h / 2, { size, weight: 700, color: ok ? tc.ink : p.ink2, base: 'middle' });
  if (ok) d.polyline([[x + 9 * u, y + h / 2], [x + 14 * u, y + h / 2 + 5 * u], [x + 23 * u, y + h / 2 - 6 * u]], tc.c, 2.6);
  else d.circle(x + 16 * u, y + h / 2, 5 * u, { stroke: p.mute, lw: 1.5 });
  return w;
}

function vG1(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, g = grow(S, 'g1'), runs = g.runs;
  const last = runs[runs.length - 1], nR = runs.filter((r) => r.mode === 'random').length, nG = runs.filter((r) => r.mode === 'greedy').length;
  ribbon(S, m, L.rib, last ? { tokens: last.w, k: 1, reveal: last.shown, newest: true, cursor: last.shown >= last.w.length, label: S.l(`último texto · modo ${last.mode === 'greedy' ? 'voraz' : 'aleatorio'}`, `latest text · ${last.mode} mode`), size: S.portrait ? 18 : 20 } : { tokens: c.start, k: 1, cursor: true, label: S.l('texto: pulsa «Generar texto»', 'text: press “Generate text”') });
  const b = L.body;
  let x = b.x; x += chip(S, x, b.y, S.l(`aleatorio ${Math.min(nR, 3)}/3`, `random ${Math.min(nR, 3)}/3`), nR >= 3) + 10 * u; chip(S, x, b.y, S.l(`voraz ${Math.min(nG, 1)}/1`, `greedy ${Math.min(nG, 1)}/1`), nG >= 1);
  // historial (los anteriores al último)
  const hist = runs.slice(0, -1).slice(-(S.portrait ? 3 : 4)).reverse(), hy = b.y + 38 * u, rowH = Math.min(58 * u, (b.h - 38 * u - 44 * u) / Math.max(1, hist.length) - 6 * u);
  hist.forEach((r, i) => { const y = hy + i * (rowH + 6 * u); if (y + rowH < b.y + b.h - 30 * u) ribbon(S, m, { x: b.x, y, w: b.w, h: rowH }, { tokens: r.w, label: r.mode === 'greedy' ? S.l('voraz', 'greedy') : S.l('aleatorio', 'random'), size: S.portrait ? 14 : 15, a: 0.9 }); });
  // cuántos textos distintos hubo
  const distinct = (mode: string) => { const s = new Set(runs.filter((r) => r.mode === mode).map((r) => r.w.join(' '))); return `${s.size}/${runs.filter((r) => r.mode === mode).length}`; };
  if (runs.length > 0) d.text(S.l(`textos distintos · aleatorio ${distinct('random')} · voraz ${distinct('greedy')}`, `distinct texts · random ${distinct('random')} · greedy ${distinct('greedy')}`), b.x, b.y + b.h - 2 * u, { size: fz(S, 13), weight: 700, color: tone(S, 'dat').ink, base: 'bottom' });
  void p;
}

// ═════════════════════════════════════════════════════════════════════════
// Softmax y temperatura (tabla de puntuaciones)
// ═════════════════════════════════════════════════════════════════════════
function tempNow(S: Frame): number {
  if (S.between('try2', 'samples')) return S.p.temp ?? 1;
  if (S.on('hot')) return Math.exp(lerp(Math.log(0.25), Math.log(3), S.at('hot', 0.3, 3.4, 'io')));
  if (S.on('cold')) return Math.exp(lerp(0, Math.log(0.25), S.at('cold', 0.3, 2.8, 'io')));
  return 1;
}

function vTable(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, T = tempNow(S), inTry = S.on('try2');
  const ps = dist(m, c.B, T), total = ps.reduce((a, q) => a + q.c, 0), g2 = grow(S, 'g2'), last = g2.runs[g2.runs.length - 1];
  const rl = inTry && last ? { tokens: last.w, k: 1, reveal: last.shown, newest: true, cursor: last.shown >= last.w.length, label: S.l(`texto con T = ${S.n(last.T, 2)}`, `text with T = ${S.n(last.T, 2)}`) } : { tokens: [c.B], k: 1, cursor: true, label: S.l('texto', 'text') };
  ribbon(S, m, L.rib, rl);
  const b = L.body, [tr, ar] = two(S, b, S.portrait ? 0.66 : 0.64);
  const cols = { c: 1, z: S.reveal('scores', 1.5, 0.5), zt: S.on('temp') ? S.reveal('temp', 0.4, 0.5) : 0, p: S.on('softmax') ? S.reveal('softmax', 0.4, 0.5) : 0 };
  if (S.portrait && !S.on('temp')) cols.c = 1;
  scoreTable(S, m, tr, ps, T, cols, { rows: S.portrait ? 6 : 6, show: S.reveal('scores', 0.2, 0.01) * 99 });
  // fórmulas
  const wd = tone(S, 'dat'), sg = tone(S, 'sig'), lt = tone(S, 'lat'), wt = tone(S, 'w');
  const fa = S.portrait ? { x: ar.x, y: ar.y, w: ar.w, h: ar.h } : ar;
  if (!inTry) {
    let lines: [string, string?][][];
    if (S.on('temp')) lines = [[['p', lt.ink], [' = ', p.ink2], ['exp(', p.ink2], ['z/T', wt.ink], [')', p.ink2]], [['    ─────────', p.ink2]], [['Σ exp(', p.ink2], ['z/T', wt.ink], [')', p.ink2]]];
    else if (S.on('softmax')) lines = [[['p', lt.ink], [' = ', p.ink2], ['exp(', p.ink2], ['z', sg.ink], [')', p.ink2]], [['    ────────', p.ink2]], [['Σ exp(', p.ink2], ['z', sg.ink], [')', p.ink2]]];
    else lines = [[['z', sg.ink], [' = ln(', p.ink2], ['c', wd.ink], [')', p.ink2]]];
    const rv = S.on('temp') ? S.reveal('temp', 0.2, 0.5) : S.on('softmax') ? S.reveal('softmax', 0.2, 0.5) : S.reveal('scores', 2.2, 0.5);
    if (S.portrait && lines.length > 1) lines = [[lines[0][0], lines[0][1], lines[0][2], lines[0][3], lines[0][4], [' ÷ ', p.ink2], ...lines[2]]];
    const fb = formulaBox(S, fa, lines, { a: rv, size: S.portrait ? 16 : 17 });
    const ty = fa.y + fb.h + 12 * u;
    // aritmética con los números de la fila favorita
    if (S.on('softmax')) {
      const q = ps[0], se = ps.reduce((a, x) => a + Math.exp(x.z / T), 0);
      d.withAlpha(S.reveal('softmax', 1.6, 0.5), () => {
        d.text(`Σ exp(${S.on('temp') ? 'z/T' : 'z'}) = ${S.n(se, 1)}`, fa.x + fa.w / 2, ty, { size: fz(S, 15), font: 'mono', weight: 700, color: p.ink, align: 'center', base: 'top' });
        d.text(`${S.n(Math.exp(q.z / T), 1)} ÷ ${S.n(se, 1)} = ${S.n(q.p, 3)}`, fa.x + fa.w / 2, ty + 24 * u, { size: fz(S, 15), font: 'mono', weight: 700, color: lt.ink, align: 'center', base: 'top' });
        if (!S.on('temp') && !S.portrait) d.text(S.l(`(= ${q.c} ÷ ${total}: cuenta entre total)`, `(= ${q.c} ÷ ${total}: count over total)`), fa.x + fa.w / 2, ty + 50 * u, { size: fz(S, 13), color: p.mute, align: 'center', base: 'top' });
      });
    }
    if (S.on('temp')) {
      const dy = S.portrait ? ar.y + ar.h - 56 * u : ar.y + ar.h * 0.62;
      d.withAlpha(S.reveal('temp', 0.9, 0.5), () => {
        d.text(`T = ${S.n(T, 2)}`, ar.x + ar.w / 2, dy - 4 * u, { size: fz(S, 20), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'bottom' });
        tdial(S, { x: ar.x, y: dy, w: ar.w, h: 44 * u }, T);
      });
    }
  } else {
    const top = ps[0].p;
    const dy = ar.y + 36 * u;
    d.text(`T = ${S.n(T, 2)}`, ar.x + ar.w / 2, ar.y, { size: fz(S, 24), weight: 800, font: 'mono', color: wt.ink, align: 'center', base: 'top' });
    tdial(S, { x: ar.x, y: ar.y + 32 * u, w: ar.w, h: 44 * u }, T);
    d.text(S.l(`favorita: ${pct(S, top)}`, `favorite: ${pct(S, top)}`), ar.x + ar.w / 2, dy + 52 * u, { size: fz(S, 17), weight: 800, color: p.ink, align: 'center', base: 'top' });
    const fy = dy + 84 * u; let x = ar.x + (S.portrait ? 0 : 0);
    x += chip(S, x, fy, S.l('> 90 %', '> 90 %'), !!g2.hi) + 8 * u; chip(S, x, fy, S.l('< 20 %', '< 20 %'), !!g2.lo);
    d.text(S.l('favorita', 'favorite'), ar.x, fy + 38 * u, { size: fz(S, 12), color: p.mute, base: 'top' });
  }
}

function vSamples(S: Frame, D: Demo, L: L) {
  const { m, c } = D, t = S.since('samples');
  ribbon(S, m, L.rib, { tokens: c.start, k: 1, cursor: true, label: S.l('texto: mismo inicio, tres temperaturas', 'text: same start, three temperatures') });
  const rowH = Math.min(70 * S.u, (L.body.h - 16 * S.u) / 3), Ts = [0.3, 1, 2.5], names = [S.l('baja', 'low'), S.l('media', 'middle'), S.l('alta', 'high')];
  runRows(S, D, L.body, D.samples.map((st, i) => ({ w: words(c.start, st), tag: `T = ${S.n(Ts[i], Ts[i] === 1 ? 0 : 1)} · ${names[i]}`, t: 'w' as const, reveal: (t - 0.5 - i * 1.2) * 9, a: S.reveal('samples', 0.4 + i * 1.2, 0.4) })), rowH);
}

// ═════════════════════════════════════════════════════════════════════════
// La cola larga, top-k, top-p
// ═════════════════════════════════════════════════════════════════════════
function vTail(S: Frame, D: Demo, L: L, k: boolean) {
  const { m, c } = D, ps = D.ps.C, id = k ? 'topk' : 'tail', b = L.body, u = S.u;
  ribbon(S, m, L.rib, { tokens: [c.C], k: 1, cursor: true, label: S.l('texto', 'text') });
  const KK = 5, cutOn = k && S.since('topk') > 1.5, cut = k ? truncate(ps, { topK: KK }) : ps;
  const rows = probRows(S, m, cut, { rows: S.portrait ? 7 : 8, cut: cutOn });
  if (!k && S.since('tail') > 1.6) rows[rows.length - 1].hot = true;
  const info = barRows(S, b, rows, { show: k ? 99 : S.since('tail') / 0.16, maxRowH: 34 });
  if (k) {
    const y = b.y + info.rowH * KK, a = S.at('topk', 0.4, 1.2);
    S.d.line(b.x, y, b.x + (b.w) * a, y, tone(S, 'err').c, 2.5, [7, 4]);
    badge(S, `k = ${KK}`, b.x + b.w, y - 14 * u, { tone: 'err', align: 'right', size: fz(S, 13), a });
  }
  void id;
}

function vTopP(S: Frame, D: Demo, L: L) {
  const { m, c } = D, b = L.body, q = (w: string) => S.l(`«${m.show(w)}»`, `“${m.show(w)}”`);
  ribbon(S, m, L.rib, { tokens: [c.C], k: 1, cursor: true, label: S.l('texto', 'text') });
  const curves = [
    { ps: D.ps.A, tone: 'lat' as const, label: q(c.A), prog: S.at('topp', 0.6, 2.2, 'lin') },
    { ps: D.ps.C, tone: 'w' as const, label: q(c.C), dash: [7, 4], prog: S.at('topp', 2.4, 4.6, 'lin') },
  ];
  cumChart(S, b, curves, { p: S.on('topp') && S.since('topp') > 4.8 ? 0.9 : undefined, marks: S.since('topp') > 5.4 });
}

function vG3(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, ctx = (S.p.ctx3 ?? 'A') as 'A' | 'B' | 'C', word = c[ctx], P = S.p.topp ?? 0.9;
  const ps = D.ps[ctx], tr = truncate(ps, { topP: P }), kept = tr.filter((q) => q.keep).length;
  ribbon(S, m, L.rib, { tokens: [word], k: 1, cursor: true, label: S.l('texto', 'text') });
  const b = L.body, [br, cr] = S.portrait ? [b, b] : two(S, b, 0.56);
  const head = 46 * u;
  d.text(S.l(`en el grupo: ${kept} de ${ps.length} palabras`, `in the group: ${kept} of ${ps.length} words`), br.x, br.y + 2, { size: fz(S, S.portrait ? 18 : 20), weight: 800, color: tone(S, 'w').ink, base: 'top' });
  d.text(`p = ${Math.round(P * 100)} %`, br.x + br.w, br.y + 2, { size: fz(S, 17), weight: 800, font: 'mono', color: tone(S, 'w').ink, align: 'right', base: 'top' });
  barRows(S, { x: br.x, y: br.y + head, w: br.w, h: br.h - head }, probRows(S, m, tr, { rows: S.portrait ? 7 : 8, cut: true }), { maxRowH: 32 });
  if (!S.portrait) cumChart(S, { x: cr.x, y: cr.y + 4, w: cr.w, h: cr.h - 4 }, [{ ps, tone: 'lat', label: '' }], { p: P, marks: true });
  void p;
}

// ═════════════════════════════════════════════════════════════════════════
// Más contexto, memorización, palabras nunca vistas
// ═════════════════════════════════════════════════════════════════════════
function vCtx2(S: Frame, D: Demo, L: L) {
  const { m, c } = D, t = S.since('context2'), rowH = Math.min(80 * S.u, (L.body.h - 16 * S.u) / 2);
  ribbon(S, m, L.rib, { tokens: c.start2, k: 2, cursor: true, label: S.l('texto: mismo inicio', 'text: same start') });
  runRows(S, D, L.body, [
    { w: words(c.start2, D.ctx2[0]), tag: S.l('contexto de 1 palabra', 'context of 1 word'), t: 'lat', reveal: (t - 0.5) * 9, a: S.reveal('context2', 0.4, 0.4), k: 1 },
    { w: words(c.start2, D.ctx2[1]), tag: S.l('contexto de 2 palabras', 'context of 2 words'), t: 'lat', reveal: (t - 2.2) * 9, a: S.reveal('context2', 2.0, 0.4), k: 2 },
  ], rowH);
}

function vMemorize(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, st = D.m.stats, r = L.all;
  const items = [
    { t: S.l('contexto de 1 palabra', 'context of 1 word'), a: st.single1, n: st.ctx1, e: st.pairs1 },
    { t: S.l('contexto de 2 palabras', 'context of 2 words'), a: st.single2, n: st.ctx2, e: st.pairs2 },
  ];
  d.text(S.l('contextos vistos con una sola continuación', 'contexts seen with only one continuation'), r.x, r.y + 2, { size: fz(S, 16), weight: 800, w: r.w, base: 'top' });
  const y0 = r.y + (S.portrait ? 58 : 44) * u, rh = Math.min(120 * u, (r.h - (y0 - r.y) - 20 * u) / 2);
  items.forEach((q, i) => {
    const y = y0 + i * rh, a = S.reveal('memorize', 0.4 + i * 1.0, 0.5), f = q.a / q.n, w = r.w, bh = 34 * u;
    d.withAlpha(a, () => {
      d.text(q.t, r.x, y, { size: fz(S, 15), weight: 700, color: p.ink2, base: 'top' });
      d.rect(r.x, y + 24 * u, w, bh, { fill: p.surface2 });
      d.rect(r.x, y + 24 * u, w * f * S.at('memorize', 0.6 + i * 1.0, 1.8 + i * 1.0), bh, { fill: alpha(tone(S, i ? 'err' : 'w').c, 0.7) });
      d.text(`${S.n(f * 100, 0)} %`, r.x + w * f * S.at('memorize', 0.6 + i * 1.0, 1.8 + i * 1.0) - 8 * u, y + 24 * u + bh / 2, { size: fz(S, 18), weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'middle', halo: p.stage });
      d.text(S.l(`${S.n(q.a, 0)} de ${S.n(q.n, 0)} contextos · tabla de ${S.n(q.e, 0)} entradas`, `${S.n(q.a, 0)} of ${S.n(q.n, 0)} contexts · table of ${S.n(q.e, 0)} entries`), r.x, y + 24 * u + bh + 6 * u, { size: fz(S, 13), color: p.mute, base: 'top' });
    });
  });
  neu(S, r.x + r.w - 76 * u, r.y + r.h - 62 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: 'think', a: S.reveal('memorize', 2.4, 0.5) });
}

function vUnseen(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, b = L.body;
  const unseenTok = c.unseen;
  ribbon(S, m, L.rib, { tokens: [unseenTok], k: 1, cursor: true, label: S.l('texto', 'text') });
  const [l1, l2] = two(S, b, 0.5);
  // «yegua»: sin datos
  d.withAlpha(S.reveal('unseen', 0.3, 0.5), () => {
    tagAt(S, S.l(`contexto «${unseenTok}»`, `context “${unseenTok}”`), l1.x, l1.y + 4 * u, 'lat');
    d.rect(l1.x, l1.y + 30 * u, l1.w, l1.h - 34 * u, { stroke: p.mute, lw: 1.5, dash: [5, 4], r: 4 });
    d.text(S.l('sin datos', 'no data'), l1.x + l1.w / 2, l1.y + 30 * u + (l1.h - 34 * u) / 2 - 12 * u, { size: fz(S, 22), weight: 800, color: tone(S, 'err').ink, align: 'center', base: 'middle' });
    d.text(S.l(`«${unseenTok}» nunca apareció`, `“${unseenTok}” never appeared`), l1.x + l1.w / 2, l1.y + 30 * u + (l1.h - 34 * u) / 2 + 14 * u, { size: fz(S, 14), color: p.ink2, align: 'center', base: 'middle' });
  });
  // la palabra parecida, con datos
  const a2 = S.reveal('unseen', 1.6, 0.5);
  d.withAlpha(a2, () => {
    tagAt(S, S.l(`contexto «${m.show(c.seen)}»`, `context “${m.show(c.seen)}”`), l2.x, l2.y + 4 * u, 'lat');
    barRows(S, { x: l2.x, y: l2.y + 30 * u, w: l2.w, h: l2.h - 30 * u }, probRows(S, m, D.ps.seen, { rows: S.portrait ? 4 : 5 }), { maxRowH: 30 });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// Modelo neuronal: tabla → red
// ═════════════════════════════════════════════════════════════════════════
function vNeural(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, r = L.all, k = S.since('neural');
  const names: [string, string?][] = [[S.l('Contexto', 'Context')], [S.l('Embeddings', 'Embeddings'), S.l('lección 14', 'lesson 14')], [S.l('Red neuronal', 'Neural network'), S.l('lección 7', 'lesson 7')], [S.l('Puntuaciones z', 'Scores z')], [S.l('Softmax', 'Softmax')]];
  const tones = ['lat', 'lat', 'w', 'sig', 'dat'] as const, n = names.length;
  const horizontal = !S.portrait, gap = (horizontal ? 22 : 16) * u;
  const bw = horizontal ? (r.w - gap * (n - 1) - 0) / n : Math.min(r.w * 0.78, 250 * u), bh = horizontal ? 64 * u : Math.min(44 * u, (r.h - 70 * u - gap * (n - 1)) / n);
  const rects: Rect[] = names.map((_, i) => horizontal ? { x: r.x + i * (bw + gap), y: r.y + 6 * u, w: bw, h: bh } : { x: r.x + (r.w - bw) / 2 - 8 * u, y: r.y + i * (bh + gap), w: bw, h: bh });
  rects.forEach((b, i) => { const a = clamp((k - 0.3) / 0.7 - i * 0.55 + 0.4); box(S, b, names[i][0], { tone: tones[i], sub: names[i][1], a, size: fz(S, 13), active: Math.floor(Math.max(0, k - 4) / 0.9) % n === i && k > 4 ? 1 : 0 }); if (i < n - 1) link(S, b, rects[i + 1], { tone: 'ink', progress: clamp((k - 0.3) / 0.7 - i * 0.55 - 0.1) }); });
  // el resultado: barras de probabilidad (esquemáticas)
  const out: Rect = horizontal ? { x: r.x + r.w * 0.3, y: r.y + 6 * u + bh + 40 * u, w: r.w * 0.4, h: r.h - bh - 70 * u } : { x: r.x + 40 * u, y: rects[n - 1].y + bh + 18 * u, w: r.w - 80 * u, h: r.h - (rects[n - 1].y + bh + 18 * u - r.y) };
  const aO = S.reveal('neural', 4.2, 0.6);
  d.withAlpha(aO, () => {
    const hs = [0.62, 0.3, 0.2, 0.12, 0.08], bh2 = Math.min(18 * u, out.h / hs.length);
    hs.forEach((h, i) => { d.rect(out.x, out.y + i * bh2 + 2, out.w, bh2 - 4, { fill: p.surface2 }); d.rect(out.x, out.y + i * bh2 + 2, out.w * h, bh2 - 4, { fill: alpha(tone(S, 'lat').c, 0.6) }); });
    d.text(S.l('probabilidad de cada palabra posible (esquema)', 'probability of every possible word (schematic)'), out.x + out.w / 2, out.y - 6 * u, { size: fz(S, 13), weight: 700, color: p.ink2, align: 'center', base: 'bottom' });
  });
  void m; void c;
}

// ═════════════════════════════════════════════════════════════════════════
// El ensayo: dos respuestas y una advertencia
// ═════════════════════════════════════════════════════════════════════════
function vEssay1(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, r = L.all, { c } = D;
  const tags: ['dat' | 'sig' | 'lat', string][] = [['dat', S.l('necesita un dato', 'needs a fact')], ['sig', S.l('necesita lógica', 'needs logic')], ['lat', S.l('necesita estilo', 'needs style')]];
  const horizontal = !S.portrait, gap = 14 * u, cw = horizontal ? (r.w - 2 * gap) / 3 : r.w, ch = horizontal ? Math.min(r.h * 0.62, 190 * u) : Math.min((r.h - 2 * gap) / 3, 110 * u);
  c.prompts.forEach((q, i) => {
    const a = S.reveal('essay1', 0.6 + i * 1.4, 0.5), t = tone(S, tags[i][0]);
    const x = horizontal ? r.x + i * (cw + gap) : r.x, y = horizontal ? r.y + (r.h - ch) / 2 : r.y + i * (ch + gap);
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: p.surface, stroke: t.c, lw: 1.8, r: 5 });
      d.text(q, x + 12 * u, y + 12 * u, { size: fz(S, horizontal ? 17 : 16), weight: 600, w: cw - 24 * u, base: 'top', lh: 1.35 });
      badge(S, tags[i][1], x + 12 * u, y + ch - 20 * u, { tone: tags[i][0], size: fz(S, 13) });
    });
  });
}

function vEssay2(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, r = L.all;
  const toks = c.sentence.toLowerCase().replace(/[.,;]/g, '').split(/\s+/);
  const rowH = Math.min(S.portrait ? 120 * u : 100 * u, (r.h - 70 * u) / 2);
  const a1 = S.reveal('essay2', 0.3, 0.5), a2 = S.reveal('essay2', 2.0, 0.5);
  const sentence = toks.map((w) => w);
  // las palabras del ejemplo no son del corpus: se dibujan con el mismo estilo, sin pasar por el modelo
  const row = (y: number, k: number, label: string, a: number) => {
    const fake = { ...m, show: (w: string, s?: boolean) => (s ? w[0].toUpperCase() + w.slice(1) : w) } as Model;
    ribbon(S, fake, { x: r.x, y, w: r.w, h: rowH }, { tokens: sentence, k, cursor: true, label, a });
  };
  row(r.y, 1, S.l('un modelo de n-gramas ve solo 1 palabra', 'an n-gram model sees only 1 word'), a1);
  row(r.y + rowH + 14 * u, sentence.length, S.l('un modelo grande ve toda su ventana de texto', 'a large model sees its whole window of text'), a2);
  d.withAlpha(S.reveal('essay2', 3.6, 0.5), () => d.text(S.l('GPT-3: ventana de hasta 2 048 piezas de texto', 'GPT-3: a window of up to 2,048 pieces of text'), r.x + r.w / 2, r.y + r.h - 4 * u, { size: fz(S, 15), weight: 800, color: tone(S, 'w').ink, align: 'center', base: 'bottom' }));
  void p;
}

function vHonest(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { m, c } = D, r = L.all, st = D.ctx2[1];
  const w = words(c.start2, st), t = tone(S, 'dat'), e = tone(S, 'err');
  ribbon(S, m, { x: r.x, y: r.y, w: r.w, h: Math.min(110 * u, r.h * 0.34) }, { tokens: w, label: S.l('texto de nuestra tabla de trigramas', 'text from our trigram table'), size: S.portrait ? 17 : 19, a: S.reveal('honest', 0.2, 0.5) });
  const y0 = r.y + Math.min(110 * u, r.h * 0.34) + 24 * u, rh = 56 * u;
  const rows: [string, string, boolean, number][] = [[S.l('¿suena al original?', 'does it sound like the original?'), S.l('sí', 'yes'), true, 1.0], [S.l('¿es verdadero o tiene sentido?', 'is it true, or does it make sense?'), S.l('el modelo no lo comprueba', 'the model does not check'), false, 2.2]];
  rows.forEach(([q, ans, ok, at], i) => {
    const y = y0 + i * rh, a = S.reveal('honest', at, 0.5), c2 = ok ? t : e;
    d.withAlpha(a, () => {
      d.circle(r.x + 16 * u, y + rh / 2 - 6 * u, 13 * u, { fill: c2.soft, stroke: c2.c, lw: 2 });
      if (ok) d.polyline([[r.x + 9 * u, y + rh / 2 - 6 * u], [r.x + 14 * u, y + rh / 2 - 1 * u], [r.x + 23 * u, y + rh / 2 - 12 * u]], c2.c, 3);
      else d.text('?', r.x + 16 * u, y + rh / 2 - 5 * u, { size: fz(S, 20), weight: 800, color: c2.ink, align: 'center', base: 'middle' });
      d.text(q, r.x + 40 * u, y + 4 * u, { size: fz(S, 14), color: p.mute, w: r.w - 52 * u, base: 'top' });
      d.text(ans, r.x + 40 * u, y + 26 * u, { size: fz(S, 17), weight: 800, color: c2.ink, w: r.w - 52 * u, base: 'top' });
    });
  });
  neu(S, r.x + r.w - 76 * u, r.y + r.h - 62 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: 'think', a: S.reveal('honest', 2.8, 0.5) });
}

// ═════════════════════════════════════════════════════════════════════════
// Escala: tabla frente a GPT-1/2/3 (escala logarítmica), y el entrenamiento
// ═════════════════════════════════════════════════════════════════════════
function vScale(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, r = L.all, st = D.m.stats;
  const items: { l: string; v: number; txt: string; t: 'w' | 'lat' }[] = [
    { l: S.l('nuestra tabla', 'our table'), v: st.pairs2, txt: S.l(`${S.n(st.pairs2, 0)} números`, `${S.n(st.pairs2, 0)} numbers`), t: 'lat' },
    { l: 'GPT-1 · 2018', v: 117e6, txt: S.l('117 millones', '117 million'), t: 'w' },
    { l: 'GPT-2 · 2019', v: 1542e6, txt: S.l('1 542 millones', '1,542 million'), t: 'w' },
    { l: 'GPT-3 · 2020', v: 175e9, txt: S.l('175 000 millones', '175 billion'), t: 'w' },
  ];
  const lo = 3, hi = 12, lw = Math.min(130 * u, r.w * 0.3), bx = r.x + lw + 8 * u, bw = r.w - lw - 8 * u - 4 * u, top = r.y + 26 * u, rh = Math.min(60 * u, (r.h - 120 * u) / 4);
  const X = (v: number) => bx + bw * ((Math.log10(v) - lo) / (hi - lo));
  d.withAlpha(S.reveal('scale', 0.1, 0.5), () => {
    d.text(S.l('parámetros (números que guarda el modelo) · escala logarítmica', 'parameters (numbers the model stores) · logarithmic scale'), r.x, r.y, { size: fz(S, 13), weight: 700, color: p.ink2, w: r.w, base: 'top' });
    [3, 6, 9, 12].forEach((e, i) => {
      const x = bx + bw * ((e - lo) / (hi - lo)); d.line(x, top, x, top + 4 * rh, p.line, 1);
      d.text([S.l('mil', 'thousand'), S.l('millón', 'million'), S.l('mil millones', 'billion'), S.l('billón', 'trillion')][i], x, top + 4 * rh + 6 * u, { size: fz(S, 12), color: p.mute, align: i === 3 ? 'right' : 'center', base: 'top' });
    });
  });
  items.forEach((q, i) => {
    const a = S.reveal('scale', 0.5 + i * 1.3, 0.5), y = top + i * rh, tc = tone(S, q.t), w = X(q.v) - bx;
    d.withAlpha(a, () => {
      d.text(q.l, r.x + lw, y + rh / 2, { size: fz(S, 15), weight: 700, align: 'right', base: 'middle' });
      d.rect(bx, y + rh * 0.2, w * S.at('scale', 0.6 + i * 1.3, 1.6 + i * 1.3), rh * 0.6, { fill: alpha(tc.c, 0.7) });
      const tx = bx + w * S.at('scale', 0.6 + i * 1.3, 1.6 + i * 1.3);
      d.text(q.txt, Math.min(tx + 8 * u, r.x + r.w), y + rh / 2 - (tx + 8 * u + d.measure(q.txt, { size: fz(S, 14), font: 'mono', weight: 700 }) > r.x + r.w ? rh * 0.5 : 0), { size: fz(S, 14), font: 'mono', weight: 700, color: tc.ink, align: tx + 8 * u + d.measure(q.txt, { size: fz(S, 14), font: 'mono', weight: 700 }) > r.x + r.w ? 'right' : 'left', base: 'middle', halo: p.stage });
    });
  });
  d.withAlpha(S.reveal('scale', 5.0, 0.5), () => d.text(S.l(`GPT-3 ≈ ${S.n(175e9 / 117e6, 0)} veces GPT-1 · mismo objetivo: la siguiente palabra`, `GPT-3 ≈ ${S.n(175e9 / 117e6, 0)} times GPT-1 · same objective: the next word`), r.x + r.w / 2, r.y + r.h - 4 * u, { size: fz(S, 15), weight: 800, color: p.ink, align: 'center', base: 'bottom', w: r.w }));
}

function vTrained(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, r = L.all, { m, c } = D;
  const P1 = D.ps.A[0].p, p0 = 0.05, f = (q: number) => -Math.log(Math.max(q, 0.03));
  const prog = S.at('trained', 1.2, 5.0, 'io'), pc = lerp(p0, P1, prog), loss = f(pc);
  const [pr, ar] = two(S, r, S.portrait ? 0.7 : 0.66);
  const lt = tone(S, 'err');
  const x0 = pr.x + 44 * u, y0 = pr.y + 24 * u, w = pr.w - 56 * u, h = pr.h - 70 * u;
  const X = (v: number) => x0 + w * v, Y = (v: number) => y0 + h - (h * v) / 3.6;
  d.withAlpha(S.reveal('trained', 0.1, 0.5), () => {
    d.line(x0, y0 + h, x0 + w, y0 + h, p.lineStrong, 1.5); d.line(x0, y0, x0, y0 + h, p.lineStrong, 1.5);
    [0, 0.5, 1].forEach((v) => { d.line(X(v), y0 + h, X(v), y0 + h + 4 * u, p.lineStrong, 1.5); d.text(S.n(v, v === 0 || v === 1 ? 0 : 1), X(v), y0 + h + 7 * u, { size: fz(S, 12), font: 'mono', color: p.mute, align: 'center', base: 'top' }); });
    [0, 1, 2, 3].forEach((v) => { d.line(x0 - 4 * u, Y(v), x0, Y(v), p.lineStrong, 1.5); d.text(String(v), x0 - 7 * u, Y(v), { size: fz(S, 12), font: 'mono', color: p.mute, align: 'right', base: 'middle' }); });
    d.text(S.l('probabilidad de la palabra correcta', 'probability of the correct word'), x0 + w, y0 + h + 24 * u, { size: fz(S, 13), weight: 700, color: p.ink2, align: 'right', base: 'top' });
    d.text(S.l('pérdida = −ln p', 'loss = −ln p'), pr.x + 2, pr.y, { size: fz(S, 14), weight: 800, color: lt.ink, base: 'top' });
    const pts: [number, number][] = []; for (let i = 0; i <= 80; i++) { const q = 0.03 + (0.97 * i) / 80; pts.push([X(q), Y(Math.min(3.6, f(q)))]); }
    d.polyline(pts, lt.c, 3);
  });
  const a = S.reveal('trained', 1.0, 0.4);
  d.withAlpha(a, () => {
    d.line(X(pc), Y(loss), X(pc), y0 + h, tone(S, 'w').c, 1.5, [4, 3]); d.line(x0, Y(loss), X(pc), Y(loss), tone(S, 'w').c, 1.5, [4, 3]);
    d.circle(X(pc), Y(loss), 8 * u, { fill: tone(S, 'w').c, stroke: p.stage, lw: 2.5 });
  });
  d.withAlpha(a, () => {
    d.text(S.l('p', 'p'), ar.x, ar.y + 6 * u, { size: fz(S, 13), weight: 700, color: p.mute, base: 'top' });
    d.text(S.n(pc, 2), ar.x, ar.y + 22 * u, { size: fz(S, 26), weight: 800, font: 'mono', color: tone(S, 'lat').ink, base: 'top' });
    d.text(S.l('pérdida', 'loss'), ar.x + (S.portrait ? ar.w / 2 : 0), (S.portrait ? ar.y + 6 * u : ar.y + 70 * u), { size: fz(S, 13), weight: 700, color: p.mute, base: 'top' });
    d.text(S.n(loss, 2), ar.x + (S.portrait ? ar.w / 2 : 0), (S.portrait ? ar.y + 22 * u : ar.y + 86 * u), { size: fz(S, 26), weight: 800, font: 'mono', color: lt.ink, base: 'top' });
    d.text(S.l(`palabra correcta: «${m.show(c.start2[1])}» tras «${m.show(c.A)}» (ilustrativo)`, `correct word: “${m.show(c.start2[1])}” after “${m.show(c.A)}” (illustrative)`), ar.x, ar.y + (S.portrait ? 62 : 132) * u, { size: fz(S, 12), color: p.mute, w: ar.w, base: 'top' });
  });
}

function vRecap(S: Frame, D: Demo, L: L) {
  const k = S.since('recap');
  loopDiagram(S, L.all, { active: Math.floor(Math.max(0, k - 0.4) / 1.0) % 4, reveal: 4 + (k > 3 ? 2 : 0), knobs: k > 3 });
  void D;
}

function vBridge(S: Frame, D: Demo, L: L) {
  const { d, pal: p } = S, u = S.u, { c } = D, r = L.all, cx = r.x + r.w / 2;
  const size = fz(S, 28), cy = r.y + r.h * 0.3;
  // la palabra se parte en piezas (ilustrativo)
  const split_ = S.at('bridge', 1.6, 2.6), w0 = d.measure(c.word, { size, weight: 800 });
  d.withAlpha(S.reveal('bridge', 0.2, 0.5), () => {
    if (split_ < 0.02) d.text(c.word, cx, cy, { size, weight: 800, align: 'center', base: 'middle' });
    else {
      const wa = d.measure(c.pieces[0], { size, weight: 700 }) + 24 * u, wb = d.measure(c.pieces[1], { size, weight: 700 }) + 24 * u, gap = lerp(0, 18 * u, split_);
      const tw = wa + wb + gap, x = cx - tw / 2;
      token(S, x, cy - 20 * u, c.pieces[0], { h: 40, size: Math.round(size * 0.9) });
      token(S, x + wa + gap, cy - 20 * u, c.pieces[1], { h: 40, size: Math.round(size * 0.9) });
    }
    d.text(S.l('esquema ilustrativo', 'illustrative sketch'), cx, cy + 44 * u, { size: fz(S, 12), color: p.mute, align: 'center', base: 'top' });
  });
  void w0;
  neu(S, cx - 36 * u * 1.2, r.y + r.h * 0.5, { scale: Math.max(5, Math.round(5.5 * u)), mood: 'happy', a: S.reveal('bridge', 0.8, 0.6) });
  d.withAlpha(S.reveal('bridge', 1.2, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), cx, r.y + r.h * 0.76, { size: fz(S, 14), weight: 700, color: p.mute, align: 'center' });
    d.text(S.l('Tokens: el alfabeto del modelo', 'Tokens: the model’s alphabet'), cx, r.y + r.h * 0.76 + 34 * u, { size: fz(S, 24), weight: 800, align: 'center', w: r.w });
  });
}

