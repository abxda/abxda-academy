// Escena: Tokens. Letras, palabras y tokens; BPE paso a paso sobre un corpus diminuto; un tokenizador de juguete REAL
// (entrenado offline, ver build-tokenizers.mts) con un control de fusiones; tamaños de vocabulario; costo por token con
// precio editable (supuesto); el campo de texto libre; la brecha español/inglés; y por qué fallan las letras y las cifras.
//
// Lo «medido» (tokenizadores reales) son cifras fijas de data.ts → REAL, obtenidas con measure-real.py.
import {
  Plot, alpha, badge, bars, box, clamp, ease, lerp, neu, readout, regions, token, tone,
  type Frame, type Rect, type SceneFactory,
} from '../../../../../theme/kit';
import { chunks, toBytes, trace, type Step } from './bpe';
import {
  COMMON, MERGE_COUNT, PAIRS, RARE, REAL, SAMPLE, SENT,
  corpusShare, curve, curveSum, isKnownWord, mergesToSingle, pairTotals, perChunk, tok, type Lg, type Variant,
} from './data';
import { drawTokens, laneLabel, note, tokensHeight } from './viz';

// ── utilidades ────────────────────────────────────────────────────────────
/** Zoom del contenido: en escenarios grandes (escritorio) los bloques y las lecturas crecen para llenar el espacio. */
const zoom = (S: Frame) => (S.portrait ? clamp(S.H / 480, 1, 1.2) : clamp(S.H / 430, 1, 1.5));
const frame = (S: Frame) => { const u = S.u, z = zoom(S), m = 16 * u; return { u, z, U: u * z, x: m, y: m, w: S.W - 2 * m, h: S.H - 2 * m }; };
const lg = (S: Frame): Lg => S.lang;
const userText = (S: Frame): string => String(S.p.txt ?? '');
const fmtUsd = (S: Frame, x: number) => '$' + S.n(x, x < 10 ? 2 : 0);
const viewAlpha = (S: Frame, from: string, to?: string) => S.at(from, 0, 0.5, 'out') * (1 - (to ? S.at(to, 0, 0.4, 'out') : 0));

/** La palabra (trozo de letras) que más se parte en un texto. */
function maxWord(text: string, v: Variant = 'mix') {
  const per = perChunk(tok(text, v));
  let best = { i: -1, n: 0, word: '' };
  chunks(text).forEach((c, i) => { if (/\p{L}/u.test(c) && (per[i] ?? 0) > best.n) best = { i, n: per[i], word: c.trim() }; });
  return best;
}

// ── la animación de BPE: corpus diminuto, por idioma ─────────────────────
const MINI: Record<Lg, [string, number][]> = {
  es: [['gato', 5], ['gatos', 3], ['pato', 4], ['patos', 2], ['gatito', 1]],
  en: [['cat', 5], ['cats', 3], ['hat', 4], ['hats', 2], ['catnip', 1]],
};
const TR: Record<Lg, Step[]> = { es: trace(MINI.es, 8), en: trace(MINI.en, 8) };
/** Transiciones (fusiones) de la animación: en qué segmento empiezan y cuántos segundos después. */
const TRANS: { seg: string; t0: number; step: number }[] = [
  { seg: 'bpe-merge', t0: 0.5, step: 1 },
  { seg: 'bpe-more', t0: 0.3, step: 2 }, { seg: 'bpe-more', t0: 2.7, step: 3 }, { seg: 'bpe-more', t0: 5.1, step: 4 },
  { seg: 'bpe-loop', t0: 0.3, step: 5 }, { seg: 'bpe-loop', t0: 2.7, step: 6 },
];
/** Estado de la animación en el instante actual: paso k, resaltado del par (hl) y progreso de la fusión (f) hacia k+1. */
function miniState(S: Frame) {
  let k = 0, hl = 0, f = 0;
  for (const tr of TRANS) {
    const u = S.t - (S.start(tr.seg) + tr.t0);
    if (u < 0) break;
    k = tr.step - 1; hl = clamp(u / 1.0); f = clamp((u - 1.0) / 1.0);
    if (u >= 2.0) { k = tr.step; hl = 0; f = 0; }
  }
  return { k, hl, f };
}

// ═════════════════════════════════════════════════════════════════════════
const scene: SceneFactory = () => ({
  controls: [
    { id: 'merges', kind: 'slider', label: { es: 'Fusiones aplicadas', en: 'Merges applied' }, min: 0, max: MERGE_COUNT, step: 1, value: 0, from: 'train-intro', to: 'size', fmt: (v) => String(v) },
    { id: 'price', kind: 'slider', label: { es: 'Precio supuesto (USD por millón de tokens)', en: 'Assumed price (USD per million tokens)' }, min: 0.1, max: 20, step: 0.1, value: 2, from: 'price', to: 'lang-intro', fmt: (v, l) => '$' + v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) },
    { id: 'volume', kind: 'slider', label: { es: 'Mensajes por día (supuesto)', en: 'Messages per day (assumed)' }, min: 100, max: 100000, step: 100, value: 20000, from: 'price', to: 'lang-intro', fmt: (v, l) => v.toLocaleString(l === 'es' ? 'es-MX' : 'en-US') },
    { id: 'ids', kind: 'toggle', label: { es: 'Mostrar el número de cada token', en: 'Show each token’s number' }, value: false, from: 'play-intro', to: 'lang-intro' },
    { id: 'txt', kind: 'text', label: { es: 'Tu texto', en: 'Your text' }, value: '', placeholder: { es: 'Escribe aquí, por ejemplo: Hola, ¿cómo estás hoy?', en: 'Type here, for example: Hello, how are you today?' }, maxLength: 200, from: 'play-intro', to: 'lang-intro' },
    { id: 'guess', kind: 'choice', label: { es: 'Tu predicción: ¿cuál usa más tokens?', en: 'Your prediction: which uses more tokens?' }, options: [{ value: 'en', label: { es: 'Inglés', en: 'English' } }, { value: 'es', label: { es: 'Español', en: 'Spanish' } }], value: '', from: 'try-lang', to: 'lang-why' },
    { id: 'corpus', kind: 'choice', label: { es: 'Corpus de entrenamiento', en: 'Training corpus' }, options: [{ value: 'en', label: { es: 'Solo inglés', en: 'English only' } }, { value: 'mix', label: { es: 'Mayormente inglés', en: 'Mostly English' } }, { value: 'bal', label: { es: 'Equilibrado', en: 'Balanced' } }], value: 'mix', from: 'lang-intro', to: 'fail-letters' },
  ],

  // El estado interactivo avanza siempre; render() solo dibuja.
  update(S) {
    const L = lg(S);
    if (S.between('try-merges', 'merges-after')) {
      if (perChunk(tok(SENT[L], 'mix', S.p.merges ?? 0))[1] === 1) S.complete('merges');
    }
    if (S.between('try-rare', 'lang-intro')) {
      const t = userText(S);
      if (t && maxWord(t).n >= 5) S.complete('rare');
    }
    if (S.between('try-lang', 'fail-letters')) {
      if (S.p.corpus !== 'mix') S.st.touched = true;
      if (S.p.guess && S.st.guessAt === undefined) {
        const v = (S.p.corpus ?? 'mix') as Variant, t = pairTotals(v);
        S.st.guessAt = S.clock;
        S.st.verdict = (t.es > t.en ? 'es' : t.en > t.es ? 'en' : 'eq') === S.p.guess ? 'ok' : 'no';
      }
      if (S.st.touched && S.p.guess) S.complete('lang');
    }
  },

  render(S) {
    const views: [string, string | undefined, (S: Frame) => void][] = [
      ['hook', 'bpe-q', drawLanes], ['bpe-q', 'train-intro', drawMini], ['train-intro', 'size', drawTrain], ['size', 'real-sizes', drawSize],
      ['real-sizes', 'rule', drawReal], ['rule', 'space-case', drawRule], ['space-case', 'bytes', drawCase], ['bytes', 'billing', drawBytes],
      ['billing', 'price', drawBilling], ['price', 'play-intro', drawPrice], ['play-intro', 'lang-intro', drawPlay], ['lang-intro', 'lang-real', drawLang],
      ['lang-real', 'fail-letters', drawLangReal], ['fail-letters', 'fail-math', drawFailLetters], ['fail-math', 'fail-fix', drawFailMath],
      ['fail-fix', 'limits', drawFix], ['limits', 'recap', drawLimits], ['recap', 'bridge', drawRecap], ['bridge', undefined, drawBridge],
    ];
    for (const [from, to, fn] of views) { const a = viewAlpha(S, from, to); if (a > 0.002) S.d.withAlpha(a, () => fn(S)); }
  },
});
export default scene;

// ═════════════════════════════════════════════════════════════════════════
// 1 · Letras, palabras y tokens
// ═════════════════════════════════════════════════════════════════════════
function drawLanes(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), sent = SENT[L];
  const letters = [...sent], words = sent.split(' '), toks = tok(sent, 'mix');
  const aS = S.reveal('hook', 0.1, 0.6);
  let y = F.y;
  d.withAlpha(aS, () => d.text(S.l('texto', 'text'), F.x, y, { size: 12, weight: 700, color: p.mute, base: 'top' }));
  y += 17 * u;
  const hs = d.text(sent, F.x, y, { size: 22, weight: 700, w: F.w - (S.portrait ? 0 : 90 * u), base: 'top', a: aS }).h;
  y += hs + 12 * u;
  if (!S.portrait) neu(S, F.x + F.w - 76 * u, F.y, { scale: Math.max(2, Math.round(2.6 * u)), mood: S.on('middle') ? 'happy' : 'think', a: S.reveal('hook', 0.4, 0.5) });

  // alturas disponibles: el resto del escenario menos rótulos y la caja del modelo
  const labelH = 22 * u, modelH = S.on('vocab') ? 54 * u : 0, avail = F.y + F.h - y - 3 * labelH - modelH - 8 * u;
  const dimA = S.on('vocab') ? 1 - 0.65 * S.at('vocab', 0, 0.6) : 1;
  const hL = Math.min(tokensHeight(S, null, F.w, { labels: letters, size: 13, gap: 3 }), avail * 0.34);
  const hW = Math.min(tokensHeight(S, null, F.w, { labels: words, size: 14 }), avail * 0.22);
  const hT = Math.min(tokensHeight(S, toks, F.w, { size: 14, ids: true }), avail - hL - hW);

  // letras
  const aL = S.reveal('letters', 0, 0.4);
  if (aL > 0) {
    laneLabel(S, S.l('letras', 'letters'), F.x, y, F.w, { badge: `${letters.length} ${S.l('piezas', 'pieces')}`, tone: 'mute', a: aL * dimA });
    drawTokens(S, null, { x: F.x, y: y + labelH, w: F.w, h: hL }, { labels: letters.map((c) => (c === ' ' ? '·' : c)), raws: letters.map(() => false), size: 13, gap: 3, tone: 'mute', show: S.at('letters', 0.2, 1.8, 'lin') * letters.length, a: dimA });
  }
  y += labelH + hL + 8 * u;
  // palabras
  const aW = S.reveal('words', 0, 0.4);
  if (aW > 0) {
    laneLabel(S, S.l('palabras', 'words'), F.x, y, F.w, { badge: `${words.length} ${S.l('piezas', 'pieces')}`, tone: 'dat', a: aW * dimA });
    const unknown = words.map((w) => !isKnownWord(w));
    drawTokens(S, null, { x: F.x, y: y + labelH, w: F.w, h: hW }, { labels: words.map((w, i) => (unknown[i] ? '? ' + w : w)), raws: words.map(() => false), warn: (i) => unknown[i] && S.on('words') && S.since('words') > 1.2, size: 14, tone: 'dat', show: S.at('words', 0.2, 1.4, 'lin') * words.length, a: dimA });
    if (S.since('words') > 1.6) d.withAlpha(S.reveal('words', 1.6, 0.5) * dimA, () => note(S, S.l('? = fuera de la lista de palabras conocidas', '? = not on the list of known words'), F.x, y + labelH + hW + 2 * u, F.w, { size: 12 }));
  }
  y += labelH + hW + 8 * u + (S.on('words') ? 14 * u : 0);
  // tokens
  const aT = S.reveal('middle', 0, 0.4);
  if (aT > 0) {
    laneLabel(S, S.l('tokens', 'tokens'), F.x, y, F.w, { badge: `${toks.length} ${S.l('piezas', 'pieces')}`, tone: 'lat', a: aT });
    drawTokens(S, toks, { x: F.x, y: y + labelH, w: F.w, h: hT }, { size: 14, ids: true, idsA: S.reveal('vocab', 0.5, 0.6), show: S.at('middle', 0.2, 1.8, 'lin') * toks.length });
  }
  y += labelH + hT + 6 * u;
  // el modelo recibe solo números
  if (S.on('vocab')) {
    const a = S.reveal('vocab', 1.0, 0.5), bw = Math.min(260 * u, F.w), r: Rect = { x: F.x + (F.w - bw) / 2, y: Math.min(y + 8 * u, F.y + F.h - 40 * u), w: bw, h: 40 * u };
    d.withAlpha(a, () => { d.arrow(F.x + F.w / 2, r.y - 8 * u, F.x + F.w / 2, r.y - 1, p.ink2, 2, 8); box(S, r, S.l('modelo: solo recibe estos números', 'model: receives only these numbers'), { tone: 'ink', size: 13 }); });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 2 · BPE paso a paso (corpus diminuto, letras)
// ═════════════════════════════════════════════════════════════════════════
const pairTable = (pieces: string[][], freq: number[]) => {
  const m = new Map<string, number>();
  pieces.forEach((p, wi) => { for (let i = 0; i < p.length - 1; i++) { const k = p[i] + '\u0000' + p[i + 1]; m.set(k, (m.get(k) ?? 0) + freq[wi]); } });
  return [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([k, n]) => ({ a: k.split('\u0000')[0], b: k.split('\u0000')[1], n }));
};

function drawMini(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), list = MINI[L], tr = TR[L];
  const { k, hl, f } = miniState(S);
  const freq = list.map(([, n]) => n);
  const a0 = S.reveal('bpe-q', 0.1, 0.6);
  const rowsW = S.portrait ? F.w : F.w * 0.56, rh = 30 * u, gap = 6 * u, size = 15, pad = 6 * u, bh = 26 * u, g = 3 * u;
  d.withAlpha(a0, () => d.text(S.l('corpus de ejemplo: palabra × frecuencia', 'example corpus: word × frequency'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top', w: rowsW }));
  const top = F.y + 22 * u, x0 = F.x + 38 * u;
  const wOf = (s: string) => d.measure(s, { size, weight: 600, font: 'mono' }) + 2 * pad;
  const t = tone(S, 'lat');
  const pairNow = tr[k + 1]?.pair;   // el par que se va a fundir en la transición k → k+1
  const trans = f > 0 || hl > 0;

  const block = (x: number, y: number, w: number, label: string, o: { hi?: number; alt?: boolean; a?: number } = {}) => {
    d.withAlpha(o.a ?? 1, () => {
      d.rect(x, y, w, bh, { fill: alpha(t.c, 0.14 + (o.alt ? 0.1 : 0) + 0.42 * (o.hi ?? 0)), stroke: (o.hi ?? 0) > 0.5 ? p.ink : t.c, lw: (o.hi ?? 0) > 0.5 ? 2.4 : 1.3, r: 3 });
      d.text(label, x + w / 2, y + bh / 2, { size, weight: 600, font: 'mono', color: t.ink, align: 'center', base: 'middle' });
    });
  };

  list.forEach(([word], wi) => {
    const y = top + wi * (rh + gap), a = S.reveal('bpe-q', 0.3 + wi * 0.12, 0.45);
    d.withAlpha(a, () => d.text('×' + list[wi][1], x0 - 8 * u, y + bh / 2, { size: 13, weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'middle' }));
    const op = tr[k].pieces[wi], np = trans && tr[k + 1] ? tr[k + 1].pieces[wi] : null;
    const xs: number[] = []; let x = x0; op.forEach((s) => { xs.push(x); x += wOf(s) + g; });
    d.withAlpha(a, () => {
      if (!np || f <= 0) {   // sin movimiento: se resaltan las apariciones del par
        op.forEach((s, i) => {
          const isPair = !!pairNow && hl > 0 && i < op.length - 1 && op[i] === pairNow[0] && op[i + 1] === pairNow[1];
          const isSecond = !!pairNow && hl > 0 && i > 0 && op[i - 1] === pairNow[0] && op[i] === pairNow[1];
          block(xs[i], y, wOf(s), s, { hi: isPair || isSecond ? hl : 0, alt: i % 2 === 1 });
        });
      } else {   // fusión: los dos bloques se acercan y se vuelven uno
        let i = 0, nx = x0; const ef = ease.io(f);
        np.forEach((ns) => {
          const merged = !(i < op.length && op[i] === ns && !(i + 1 < op.length && op[i] + op[i + 1] === ns));
          const w = wOf(ns);
          if (!merged) { block(lerp(xs[i], nx, ef), y, wOf(op[i]), ns, { alt: i % 2 === 1 }); i += 1; }
          else if (f < 0.6) {
            const gf = ease.io(f / 0.6), wa = wOf(op[i]);
            block(lerp(xs[i], nx, gf), y, wa, op[i], { hi: 1 }); block(lerp(xs[i + 1], nx + wa + g, gf), y, wOf(op[i + 1]), op[i + 1], { hi: 1 });
            i += 2;
          } else { block(nx, y, w, ns, { hi: 1 - (f - 0.6) / 0.4 }); i += 2; }
          nx += (merged && f >= 0.6 ? w : merged ? wOf(ns) : wOf(ns)) + g;
        });
      }
    });
    void word;
  });
  const bottom = top + list.length * (rh + gap);

  // el pequeño aviso de lo raro (al final)
  if (S.on('bpe-loop') && k >= 6) d.withAlpha(S.reveal('bpe-loop', 5.0, 0.5), () => badge(S, S.l('lo raro sigue en fragmentos', 'the rare stays in fragments'), x0, top + 4 * (rh + gap) + bh + 14 * u, { tone: 'err', align: 'left' }));

  // panel: pares vecinos y vocabulario nuevo
  const pr: Rect = S.portrait ? { x: F.x, y: bottom + (S.on('bpe-loop') && k >= 6 ? 30 : 10) * u, w: F.w, h: F.y + F.h - bottom - 14 * u } : { x: F.x + F.w * 0.6, y: F.y, w: F.w * 0.4, h: F.h };
  const aP = S.reveal('bpe-merge', 0.1, 0.5);
  if (aP > 0 && pr.h > 60 * u) {
    const table = pairTable(tr[k].pieces, freq).slice(0, S.portrait ? 3 : 4);
    d.withAlpha(aP, () => {
      d.text(S.l('pares vecinos: conteo', 'neighboring pairs: count'), pr.x, pr.y, { size: 12, weight: 700, color: p.mute, base: 'top', w: pr.w });
      const rowH = 24 * u;
      bars(S, { x: pr.x, y: pr.y + 20 * u, w: pr.w, h: rowH * table.length }, table.map((r, i) => ({ label: `${r.a} ${r.b}`, value: r.n, tone: i === 0 ? 'lat' as const : 'mute' as const, hot: i === 0 && (hl > 0 || f > 0 || k === 0) })), { max: Math.max(1, table[0]?.n ?? 1), labelW: 62, rowH, fmt: (v) => String(v), size: 13 });
      const vy = pr.y + 20 * u + rowH * table.length + 14 * u;
      d.text(S.l('vocabulario nuevo', 'new vocabulary'), pr.x, vy, { size: 12, weight: 700, color: p.mute, base: 'top', w: pr.w });
      let cx = pr.x, cy = vy + 20 * u;
      for (let s = 1; s <= k; s++) {
        const lab = tr[s].made ?? '', cw = d.measure(lab, { size: 14, weight: 600, font: 'mono' }) + 18 * u;
        if (cx + cw > pr.x + pr.w) { cx = pr.x; cy += 34 * u; }
        token(S, cx, cy, lab, { tone: 'lat', mono: true, h: 26, active: s === k && trans === false && S.t - S.start('bpe-merge') < 99 ? 0.25 : 0 }); cx += cw + 6 * u;
      }
      if (k === 0) d.text(S.l('(aún vacío: solo las letras)', '(still empty: just the letters)'), pr.x, vy + 22 * u, { size: 12, color: p.mute, base: 'top', w: pr.w });
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════
// 3 · El tokenizador de juguete con el control de fusiones
// ═════════════════════════════════════════════════════════════════════════
function drawTrain(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), sent = SENT[L];
  const m = clamp(Math.round(S.p.merges ?? 0), 0, MERGE_COUNT), toks = tok(sent, 'mix', m), per = perChunk(toks);
  const nBytes = toBytes(sent).length, afterGate = S.on('merges-after');
  const a = S.reveal('train-intro', 0.1, 0.6);
  const gateOk = S.done.has('merges');

  // readouts
  const items: { l: string; v: string; t: 'w' | 'lat' | 'ink' | 'dat' | 'err' }[] = [
    { l: S.l('fusiones', 'merges'), v: String(m), t: 'w' },
    { l: S.l('vocabulario', 'vocabulary'), v: String(256 + m), t: 'lat' },
    { l: S.l('tokens de la frase', 'tokens in the sentence'), v: String(toks.length), t: 'ink' },
    { l: COMMON[L].trim() === 'gato' ? S.l('tokens de «gato»', 'tokens of “cat”') : '', v: String(per[1] ?? 0), t: 'dat' },
    { l: S.l('tokens de «Quetzalcóatl»', 'tokens of “Quetzalcoatl”'), v: String(per[4] ?? 0), t: 'err' },
  ];
  const aside = !S.portrait;
  const R = aside ? regions(S, 0.7) : null;
  const mainRect: Rect = aside ? R!.main : { x: F.x, y: F.y, w: F.w, h: F.h };
  const roH = 50 * u;
  const tokRect: Rect = { x: mainRect.x, y: mainRect.y + 22 * u, w: mainRect.w, h: (aside ? mainRect.h * 0.34 : F.h * 0.25) };
  d.withAlpha(a, () => d.text(S.l('la frase, partida en tokens', 'the sentence, split into tokens'), mainRect.x, mainRect.y, { size: 12, weight: 700, color: p.mute, base: 'top' }));
  d.withAlpha(a, () => drawTokens(S, toks, tokRect, { size: 14, hi: (i) => toks[i].chunk === 1 && per[1] === 1 || (toks[i].chunk === 1), }));

  // gráfico o carrera
  let ry: number;
  if (aside) {
    d.withAlpha(a, () => items.forEach((it, i) => readout(S, R!.aside.x, R!.aside.y + i * roH + 14 * u, it.l, it.v, { tone: it.t, size: 24 })));
    ry = tokRect.y + tokRect.h + 14 * u;
  } else {
    const cols = 3, cw = F.w / cols, y0 = tokRect.y + tokRect.h + 12 * u;
    d.withAlpha(a, () => items.forEach((it, i) => readout(S, F.x + (i % cols) * cw, y0 + Math.floor(i / cols) * 46 * u + 12 * u, it.l, it.v, { tone: it.t, size: 20 })));
    ry = y0 + 2 * 46 * u + 14 * u;
  }
  const plotRect: Rect = { x: mainRect.x, y: ry, w: mainRect.w, h: Math.max(60 * u, F.y + F.h - ry) };
  const aRace = afterGate ? S.reveal('merges-after', 0, 0.5) : 0;
  if (aRace < 1) d.withAlpha(a * (1 - aRace), () => {
    const pl = new Plot(S, plotRect, { xr: [0, MERGE_COUNT], yr: [0, Math.ceil((nBytes + 1) / 10) * 10], xLabel: S.l('fusiones', 'merges'), yLabel: S.l('tokens de la frase', 'tokens in the sentence'), xTicks: [0, 100, 200, 300, 400], yTicks: [0, 10, 20, 30], tickFmt: (v) => String(v), pad: { l: 30, b: 32 } });
    pl.axes();
    const pts = curve(sent, 8).map((c) => [pl.X(c.m), pl.Y(c.n)] as [number, number]);
    d.polyline(pts, tone(S, 'lat').c, 2.5);
    pl.line(m, 0, m, toks.length, 'w', 1.2, [4, 4]); pl.dot(m, toks.length, 6, 'w');
  });
  if (aRace > 0) d.withAlpha(aRace, () => drawRace(S, plotRect, m, L));
  // objetivo del turno
  if (S.between('try-merges', 'merges-after')) {
    const gx = aside ? R!.aside.x : F.x, gy = aside ? R!.aside.y + items.length * roH + 8 * u : plotRect.y - 4 * u, gw = aside ? R!.aside.w : F.w;
    if (aside) d.text(gateOk ? S.l('✓ ¡Lo lograste!', '✓ You did it!') : S.l('Objetivo: «gato» en un solo token', 'Goal: “cat” in a single token'), gx, gy, { size: 13, weight: 700, color: gateOk ? tone(S, 'dat').ink : p.ink2, w: gw, base: 'top' });
  }
}

/** Carrera: con cuántas fusiones cada palabra pasa a ser un solo token. */
function drawRace(S: Frame, r: Rect, m: number, L: Lg) {
  const { d, pal: p } = S, u = S.u;
  const words = L === 'es' ? [' el', ' que', ' gato', ' llama'] : [' the', ' is', ' cat', ' named'];
  const rows = [...words.map((w) => ({ w, n: mergesToSingle(w) })), { w: RARE[L], n: -1 }];
  d.text(S.l('fusiones necesarias para que la palabra sea un solo token', 'merges needed for the word to be a single token'), r.x, r.y, { size: 12, weight: 700, color: p.mute, base: 'top', w: r.w });
  const top = r.y + (S.portrait ? 36 : 22) * u, rowH = Math.min(30 * u, (r.y + r.h - top - 14 * u) / rows.length), lw = Math.min(150 * u, r.w * 0.36), bx = r.x + lw, bw = r.w - lw - 50 * u;
  rows.forEach((row, i) => {
    const y = top + i * rowH, a = S.reveal('merges-after', 0.2 + i * 0.25, 0.5), rare = row.n < 0;
    d.withAlpha(a, () => {
      d.text(row.w.replace(' ', '·'), bx - 8 * u, y + rowH / 2, { size: 13, weight: 700, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
      d.rect(bx, y + rowH * 0.2, bw, rowH * 0.6, { fill: p.surface2 });
      if (rare) { d.rect(bx, y + rowH * 0.2, bw, rowH * 0.6, { stroke: tone(S, 'err').c, lw: 1.4, dash: [5, 4] }); d.text(S.l('nunca', 'never'), bx + bw + 6 * u, y + rowH / 2, { size: 13, weight: 700, color: tone(S, 'err').ink, base: 'middle' }); }
      else { d.rect(bx, y + rowH * 0.2, (bw * row.n) / MERGE_COUNT, rowH * 0.6, { fill: tone(S, 'lat').c }); d.text(String(row.n), bx + (bw * row.n) / MERGE_COUNT + 6 * u, y + rowH / 2, { size: 13, weight: 700, font: 'mono', color: p.ink2, base: 'middle' }); }
    });
  });
  // marcador de las fusiones actuales
  const mx = bx + (bw * m) / MERGE_COUNT;
  d.line(mx, top - 4 * u, mx, top + rows.length * rowH, tone(S, 'w').c, 2, [4, 4]);
}

// ═════════════════════════════════════════════════════════════════════════
// 4 · Tamaño del vocabulario: compromiso y cifras reales
// ═════════════════════════════════════════════════════════════════════════
function drawSize(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S);
  const texts = PAIRS.map((pr) => pr[L === 'es' ? 1 : 0]), data = curveSum(texts, 8), n0 = data[0].n;
  const m = S.at('size', 0.4, 4.6, 'io') * MERGE_COUNT, V = 256 + m;
  const n = lerp(data[Math.floor(m / 8)].n, data[Math.min(data.length - 1, Math.floor(m / 8) + 1)].n, (m % 8) / 8);
  const plotH = F.h * (S.portrait ? 0.62 : 0.66);
  const a = S.reveal('size', 0.1, 0.6);
  d.withAlpha(a, () => {
    const pl = new Plot(S, { x: F.x, y: F.y, w: F.w, h: plotH }, { xr: [0, MERGE_COUNT], yr: [0, Math.ceil(n0 / 20) * 20], xLabel: S.l('fusiones (vocabulario = 256 + fusiones)', 'merges (vocabulary = 256 + merges)'), yLabel: S.l('tokens de cuatro frases', 'tokens in four sentences'), xTicks: [0, 100, 200, 300, 400], tickFmt: (v) => String(v), pad: { l: 34, b: 36 } });
    pl.axes();
    d.polyline(data.map((c) => [pl.X(c.m), pl.Y(c.n)] as [number, number]), tone(S, 'lat').c, 2.5);
    pl.line(m, 0, m, n, 'w', 1.2, [4, 4]); pl.dot(m, n, 6, 'w');
    pl.label(S.l('textos más cortos →', 'shorter texts →'), 200, n0 * 0.82, 'lat', { size: 13, align: 'left' });
  });
  // tabla de embeddings: una fila por pieza
  const by = F.y + plotH + 16 * u, a2 = S.reveal('size', 0.6, 0.6);
  d.withAlpha(a2, () => {
    d.text(S.l('tabla de embeddings: una fila por pieza del vocabulario', 'embedding table: one row per vocabulary piece'), F.x, by, { size: 12, weight: 700, color: p.mute, base: 'top', w: F.w });
    const bh = 26 * u, y = by + (S.portrait ? 34 : 20) * u, w = F.w * (V / (256 + MERGE_COUNT));
    d.rect(F.x, y, F.w, bh, { fill: p.surface2 });
    d.rect(F.x, y, w, bh, { fill: alpha(tone(S, 'w').c, 0.5), stroke: tone(S, 'w').c, lw: 1.5 });
    d.text(`${S.l('piezas', 'pieces')}: ${Math.round(V)}`, F.x + 8 * u, y + bh / 2, { size: 13, weight: 700, font: 'mono', color: p.ink, base: 'middle' });
    d.text(S.l('← más piezas, tabla más grande', '← more pieces, bigger table'), F.x, y + bh + 6 * u, { size: 13, weight: 700, color: tone(S, 'w').ink, base: 'top' });
  });
}

function drawReal(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u;
  const names: Record<string, string> = { toy: S.l('juguete (esta lección)', 'toy (this lesson)'), llama2: 'Llama 2', gpt2: 'GPT-2', cl100k: 'GPT-4', llama3: 'Llama 3', o200k: 'GPT-4o' };
  const delay: Record<string, number> = { gpt2: 0.4, llama2: 1.2, cl100k: 2.4, llama3: 3.0, o200k: 3.6, toy: 5.2 };
  const max = 200019, foot = 40 * u, rowH = Math.min(46 * u, (F.h - foot) / REAL.vocab.length), lw = Math.min(170 * u, F.w * 0.34), bx = F.x + lw, bw = F.w - lw - 74 * u;
  d.text(S.l('tamaño del vocabulario (piezas)', 'vocabulary size (pieces)'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
  const top = F.y + 22 * u;
  REAL.vocab.forEach((r, i) => {
    const y = top + i * rowH, a = S.reveal('real-sizes', delay[r.id], 0.5), toy = r.id === 'toy';
    d.withAlpha(a, () => {
      d.text(names[r.id], bx - 8 * u, y + rowH / 2, { size: 13, weight: toy ? 800 : 700, color: toy ? tone(S, 'err').ink : p.ink, align: 'right', base: 'middle', w: lw - 8 * u });
      d.rect(bx, y + rowH * 0.2, bw, rowH * 0.6, { fill: p.surface2 });
      const w = Math.max(3 * u, (bw * r.v) / max);
      d.rect(bx, y + rowH * 0.2, w, rowH * 0.6, { fill: toy ? tone(S, 'err').c : tone(S, 'lat').c });
      d.text(S.n(r.v, 0), bx + w + 6 * u, y + rowH / 2, { size: 13, weight: 700, font: 'mono', color: toy ? tone(S, 'err').ink : p.ink2, base: 'middle' });
    });
  });
  d.withAlpha(S.reveal('real-sizes', 5.6, 0.5), () => note(S, S.l('Fuentes: informes técnicos (GPT-2, Llama 2, Llama 3) y tiktoken (GPT-4, GPT-4o).', 'Sources: technical reports (GPT-2, Llama 2, Llama 3) and tiktoken (GPT-4, GPT-4o).'), F.x, F.y + F.h - foot + 10 * u, F.w, { size: 12 }));
}

function drawRule(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u;
  const gapX = 28 * u, cs = Math.min((F.w - gapX) / 2 / 10, (F.h - 96 * u) / 10), gw = cs * 10, x1 = F.x + (F.w - 2 * gw - gapX) / 2, x2 = x1 + gw + gapX, y0 = F.y + 30 * u;
  const lat = tone(S, 'lat'), dat = tone(S, 'dat');
  d.text('100 ' + S.l('tokens', 'tokens'), x1, F.y, { size: 15, weight: 800, color: lat.ink, base: 'top' });
  d.text('≈ 75 ' + S.l('palabras', 'words'), x2, F.y, { size: 15, weight: 800, color: dat.ink, base: 'top' });
  for (let i = 0; i < 100; i++) {
    const cx = i % 10, cy = Math.floor(i / 10);
    const a1 = clamp(S.at('rule', 0.2, 1.8, 'lin') * 100 - i), a2 = clamp(S.at('rule', 1.8, 3.4, 'lin') * 100 - i);
    d.rect(x1 + cx * cs, y0 + cy * cs, cs - 2, cs - 2, { fill: alpha(lat.c, 0.5), a: a1 });
    d.rect(x2 + cx * cs, y0 + cy * cs, cs - 2, cs - 2, i < 75 ? { fill: alpha(dat.c, 0.5), a: a2 } : { stroke: p.line, lw: 1, a: a2, dash: [2, 2] });
  }
  d.withAlpha(S.reveal('rule', 3.4, 0.6), () => {
    d.text(S.l('1 token ≈ 4 caracteres ≈ ¾ de palabra', '1 token ≈ 4 characters ≈ ¾ of a word'), F.x + F.w / 2, y0 + gw + 16 * u, { size: 15, weight: 800, align: 'center', base: 'top', w: F.w });
    d.text(S.l('Regla práctica para inglés; no es exacta, y en español sale más alto.', 'Rule of thumb for English; not exact, and Spanish comes out higher.'), F.x + F.w / 2, y0 + gw + 42 * u, { size: 12, weight: 600, color: p.mute, align: 'center', base: 'top', w: F.w });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 5 · Detalles: espacio y mayúsculas; bytes
// ═════════════════════════════════════════════════════════════════════════
function drawCase(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S);
  const words = L === 'es' ? ['gato', ' gato', 'Gato'] : ['cat', ' cat', 'Cat'];
  d.text(S.l('mismas letras, piezas distintas', 'same letters, different pieces'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
  const top = F.y + 24 * u, rowH = Math.min(96 * u, (F.h - 70 * u) / 3), lw = S.portrait ? 0 : 96 * u;
  words.forEach((w, i) => {
    const toks = tok(w, 'mix'), y = top + i * rowH, a = S.reveal('space-case', 0.3 + i * 0.9, 0.5);
    d.withAlpha(a, () => {
      d.text('«' + w.replace(' ', '·') + '»', F.x, y + (S.portrait ? 0 : 6 * u), { size: 16, weight: 800, font: 'mono', color: p.ink, base: 'top' });
      const tx = F.x + lw, ty = y + (S.portrait ? 24 * u : 0), tw = F.w - lw - 90 * u;
      drawTokens(S, toks, { x: tx, y: ty, w: Math.max(80 * u, tw), h: rowH - 26 * u }, { size: 15, ids: true });
      d.tag(`${toks.length} ${toks.length === 1 ? S.l('token', 'token') : S.l('tokens', 'tokens')}`, F.x + F.w, y + 12 * u, { align: 'right', color: tone(S, 'lat').ink, fill: tone(S, 'lat').soft, stroke: tone(S, 'lat').c, font: 'mono', size: 12 });
    });
  });
  d.withAlpha(S.reveal('space-case', 3.2, 0.6), () => note(S, S.l('· = un espacio. El número bajo cada bloque es su lugar en el vocabulario de juguete.', '· = a space. The number under each block is its place in the toy vocabulary.'), F.x, top + 3 * rowH + 4 * u, F.w, { size: 12 }));
}

function drawBytes(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S);
  const text = L === 'es' ? 'pingüino 🐧' : 'naïve 🐧', rareCh = L === 'es' ? 'ü' : 'ï';
  const toks = tok(text, 'mix'), a = S.reveal('bytes', 0.1, 0.6);
  d.withAlpha(a, () => {
    d.text(S.l('texto', 'text'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
    d.text(text, F.x, F.y + 18 * u, { size: 26, weight: 700, base: 'top' });
  });
  const y1 = F.y + 70 * u, a2 = S.reveal('bytes', 0.9, 0.6);
  d.withAlpha(a2, () => {
    laneLabel(S, S.l('tokens', 'tokens'), F.x, y1, F.w, { badge: `${toks.length} ${S.l('tokens', 'tokens')}`, tone: 'lat' });
    const r = drawTokens(S, toks, { x: F.x, y: y1 + 22 * u, w: F.w, h: F.h * 0.4 }, { size: 15, ids: true });
    const yy = y1 + 22 * u + r.h + 22 * u;
    const hex = (c: string) => toBytes(c).map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    d.withAlpha(S.reveal('bytes', 2.2, 0.6), () => {
      d.text(`${rareCh}  =  ${toBytes(rareCh).length} ${S.l('bytes', 'bytes')}:  ${hex(rareCh)}`, F.x, yy, { size: 14, weight: 700, font: 'mono', color: p.ink2, base: 'top', w: F.w });
      d.text(`🐧  =  ${toBytes('🐧').length} ${S.l('bytes', 'bytes')}:  ${hex('🐧')}`, F.x, yy + 26 * u, { size: 14, weight: 700, font: 'mono', color: p.ink2, base: 'top', w: F.w });
      note(S, S.l('Borde punteado = bytes sueltos: lo que el vocabulario no cubre.', 'Dashed border = loose bytes: what the vocabulary does not cover.'), F.x, yy + 58 * u, F.w, { size: 12 });
    });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 6 · Costo por token
// ═════════════════════════════════════════════════════════════════════════
const ANSWER: Record<Lg, string> = { es: 'Muy bien, gracias. ¿Y tú?', en: 'Very well, thanks. And you?' };

function drawBilling(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S);
  const tin = tok(SAMPLE[L], 'mix'), tout = tok(ANSWER[L], 'mix');
  const a = S.reveal('billing', 0.1, 0.6);
  const colW = S.portrait ? F.w : (F.w - 130 * u) / 2, mid = S.portrait ? 44 * u : 130 * u;
  const inRect: Rect = { x: F.x, y: F.y, w: colW, h: S.portrait ? (F.h - mid) * 0.45 : F.h };
  const outRect: Rect = S.portrait ? { x: F.x, y: F.y + inRect.h + mid, w: F.w, h: (F.h - mid) * 0.5 } : { x: F.x + colW + mid, y: F.y, w: colW, h: F.h };
  const panel = (r: Rect, title: string, toks: ReturnType<typeof tok>, showN: number, tn: 'sig' | 'lat', price: string) => {
    const t = tone(S, tn);
    d.text(title, r.x, r.y, { size: 13, weight: 800, color: t.ink, base: 'top' });
    d.tag(`${Math.min(toks.length, Math.floor(showN))} ${S.l('tokens', 'tokens')}`, r.x + r.w, r.y + 8 * u, { align: 'right', color: t.ink, fill: t.soft, stroke: t.c, font: 'mono', size: 12 });
    drawTokens(S, toks, { x: r.x, y: r.y + 28 * u, w: r.w, h: Math.max(40 * u, r.h - 78 * u) }, { size: 14, tone: tn === 'sig' ? 'sig' : 'lat', show: showN });
    note(S, price, r.x, r.y + r.h - 34 * u, r.w, { size: 12 });
  };
  d.withAlpha(a, () => panel(inRect, S.l('entrada', 'input'), tin, S.at('billing', 0.2, 1.4, 'lin') * tin.length, 'sig', S.l('cada token se procesa y se cobra', 'every token is processed and billed')));
  const aM = S.reveal('billing', 1.2, 0.5);
  d.withAlpha(aM, () => {
    const mr: Rect = S.portrait ? { x: F.x + F.w / 2 - 70 * u, y: inRect.y + inRect.h + 4 * u, w: 140 * u, h: 36 * u } : { x: inRect.x + colW + 8 * u, y: F.y + F.h / 2 - 22 * u, w: mid - 16 * u, h: 44 * u };
    box(S, mr, S.l('modelo', 'model'), { tone: 'ink' });
    if (S.portrait) { d.arrow(mr.x + mr.w / 2, inRect.y + inRect.h - 2 * u, mr.x + mr.w / 2, mr.y - 1, p.ink2, 2, 7); d.arrow(mr.x + mr.w / 2, mr.y + mr.h, mr.x + mr.w / 2, outRect.y - 2 * u, p.ink2, 2, 7); }
    else { d.arrow(inRect.x + colW - 4 * u, F.y + F.h / 2, mr.x, F.y + F.h / 2, p.ink2, 2, 7); d.arrow(mr.x + mr.w, F.y + F.h / 2, outRect.x + 4 * u, F.y + F.h / 2, p.ink2, 2, 7); }
  });
  const prog = S.at('billing', 2.2, 7.0, 'lin') * tout.length;
  d.withAlpha(S.reveal('billing', 2.0, 0.5), () => panel(outRect, S.l('salida', 'output'), tout, prog, 'lat', S.l('uno por uno: cada token, una pasada completa por el modelo', 'one by one: each token, a full pass through the model')));
}

function costBits(S: Frame, n: number) {
  const price = S.p.price ?? 2, vol = S.p.volume ?? 20000;
  return { price, vol, perMsg: (n * price) / 1e6, month: (n * price * vol * 30) / 1e6 };
}

function drawPrice(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), toks = tok(SAMPLE[L], 'mix'), n = toks.length, c = costBits(S, n);
  const a = S.reveal('price', 0.1, 0.6);
  d.withAlpha(a, () => {
    d.text(S.l('costo = tokens × precio ÷ 1 000 000', 'cost = tokens × price ÷ 1,000,000'), F.x, F.y, { size: S.portrait ? 17 : 22, weight: 800, font: 'mono', color: p.ink, w: F.w, base: 'top' });
    d.text(S.l('un mensaje de ejemplo:', 'an example message:'), F.x, F.y + (S.portrait ? 50 : 42) * u, { size: 12, weight: 700, color: p.mute, base: 'top' });
    const r = drawTokens(S, toks, { x: F.x, y: F.y + (S.portrait ? 70 : 62) * u, w: F.w, h: 70 * u }, { size: 14 });
    const y0 = F.y + (S.portrait ? 70 : 62) * u + r.h + 24 * u, cols = S.portrait ? 2 : 4, cw = F.w / cols, rh = 62 * u;
    const items: { l: string; v: string; t: 'lat' | 'ink' | 'dat'; flag?: boolean }[] = [
      { l: S.l('tokens por mensaje', 'tokens per message'), v: String(n), t: 'lat' },
      { l: S.l('precio por millón', 'price per million'), v: fmtUsd(S, c.price), t: 'ink', flag: true },
      { l: S.l('mensajes al día', 'messages per day'), v: S.n(c.vol, 0), t: 'ink', flag: true },
      { l: S.l('costo al mes (30 días)', 'cost per month (30 days)'), v: fmtUsd(S, c.month), t: 'dat' },
    ];
    items.forEach((it, i) => {
      const x = F.x + (i % cols) * cw, y = y0 + Math.floor(i / cols) * rh;
      readout(S, x, y + 12 * u, it.l, it.v, { tone: it.t, size: S.portrait ? 20 : 24 });
      if (it.flag) badge(S, S.l('supuesto', 'assumption'), x + Math.min(cw - 50 * u, d.measure(it.v, { size: S.portrait ? 20 : 24, weight: 700, font: 'mono' }) + 52 * u), y + 36 * u, { tone: 'w', size: 12 });
    });
    note(S, S.l('Tokens con el tokenizador de juguete. Los precios y el volumen son supuestos editables; los mensajes reales suelen ser mucho más largos.', 'Tokens use the toy tokenizer. Price and volume are editable assumptions; real messages are usually much longer.'), F.x, F.y + F.h - 40 * u, F.w, { size: 12 });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 7 · Tu texto y la palabra rara
// ═════════════════════════════════════════════════════════════════════════
function drawPlay(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S);
  const own = userText(S), text = own || SAMPLE[L], toks = tok(text, 'mix'), per = perChunk(toks), mw = maxWord(text);
  const a = S.reveal('play-intro', 0.1, 0.6), gateOk = S.done.has('rare');
  const nWords = chunks(text).filter((c) => /\p{L}/u.test(c)).length, c = costBits(S, toks.length);
  d.withAlpha(a, () => {
    d.text(S.l('tu texto, partido en tokens', 'your text, split into tokens'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
    if (!own) d.tag(S.l('ejemplo: escribe el tuyo abajo', 'example: type yours below'), F.x + F.w, F.y + 8 * u, { align: 'right', color: tone(S, 'w').ink, fill: tone(S, 'w').soft, stroke: tone(S, 'w').c, size: 12 });
    const tr: Rect = { x: F.x, y: F.y + 22 * u, w: F.w, h: F.h * (S.portrait ? 0.46 : 0.5) };
    const r = drawTokens(S, toks, tr, { size: 15, ids: !!S.p.ids, hi: (i) => mw.n >= 2 && toks[i].chunk === mw.i });
    if (r.truncated) d.text('…', F.x + F.w - 14 * u, tr.y + tr.h - 6 * u, { size: 18, weight: 800, color: p.mute, align: 'right', base: 'bottom' });
    // lecturas
    const y0 = tr.y + tr.h + 14 * u, cols = S.portrait ? 2 : 4, cw = F.w / cols, rh = 56 * u;
    const items: { l: string; v: string; t: 'lat' | 'ink' | 'dat' | 'err' }[] = [
      { l: S.l('tokens', 'tokens'), v: String(toks.length), t: 'lat' },
      { l: S.l('palabras', 'words'), v: String(nWords), t: 'ink' },
      { l: mw.n >= 1 ? S.l(`palabra más partida: «${mw.word.slice(0, 16)}»`, `most-split word: “${mw.word.slice(0, 16)}”`) : S.l('palabra más partida', 'most-split word'), v: mw.n >= 1 ? `${mw.n} ${S.l('tokens', 'tokens')}` : '–', t: gateOk ? 'dat' : 'err' },
      { l: S.l('costo al mes (supuesto)', 'cost per month (assumed)'), v: fmtUsd(S, c.month), t: 'dat' },
    ];
    items.forEach((it, i) => readout(S, F.x + (i % cols) * cw, y0 + Math.floor(i / cols) * rh + 12 * u, it.l, it.v, { tone: it.t, size: S.portrait ? 20 : 24 }));
    const ny = y0 + Math.ceil(items.length / cols) * rh + 6 * u;
    if (S.between('try-rare', 'lang-intro')) note(S, gateOk ? S.l('✓ Una palabra rara cuesta muchos tokens; una común, uno.', '✓ A rare word costs many tokens; a common one, one.') : S.l('Pista: prueba una palabra larga, un nombre raro o letras al azar.', 'Hint: try a long word, a rare name, or random letters.'), F.x, ny, F.w, { size: 13, weight: 700, color: gateOk ? tone(S, 'dat').ink : p.ink2 });
    void per;
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 8 · Español frente a inglés
// ═════════════════════════════════════════════════════════════════════════
const VARIANT_NAME: Record<Variant, [string, string]> = { en: ['solo inglés', 'English only'], mix: ['mayormente inglés', 'mostly English'], bal: ['equilibrado', 'balanced'] };

function drawLang(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), v = (S.p.corpus ?? 'mix') as Variant;
  const [en, es] = PAIRS[0], tEn = tok(en, v), tEs = tok(es, v);
  const guessed = !!S.p.guess, reveal = guessed || S.on('lang-why');
  const rp = S.st.guessAt !== undefined ? S.clock - S.st.guessAt : S.since('lang-why');
  const a = S.reveal('lang-intro', 0.1, 0.6);
  const share = corpusShare(v), tot = pairTotals(v), ratio = tot.es / tot.en;
  const footH = 84 * u, avail = F.h - footH, laneH = avail / 2;
  const lane = (y: number, label: string, text: string, toks: typeof tEn, tn: 'dat' | 'w') => {
    const t = tone(S, tn);
    d.text(label, F.x, y, { size: 13, weight: 800, color: t.ink, base: 'top' });
    if (reveal) d.tag(`${toks.length} ${S.l('tokens', 'tokens')}`, F.x + F.w, y + 8 * u, { align: 'right', color: t.ink, fill: t.soft, stroke: t.c, font: 'mono', size: 12 });
    else d.tag(S.l('¿cuántos tokens?', 'how many tokens?'), F.x + F.w, y + 8 * u, { align: 'right', color: p.mute, size: 12 });
    const r: Rect = { x: F.x, y: y + 22 * u, w: F.w, h: laneH - 34 * u };
    if (!reveal) d.text(text, r.x, r.y, { size: 16, weight: 600, color: p.ink, w: r.w, base: 'top' });
    else drawTokens(S, toks, r, { size: 14, tone: 'lat', show: rp * 24 });
  };
  d.withAlpha(a, () => {
    lane(F.y, S.l('inglés', 'English'), en, tEn, 'dat');
    lane(F.y + laneH, S.l('español', 'Spanish'), es, tEs, 'w');
    // pie: composición del corpus y razón
    const fy = F.y + avail + 4 * u;
    d.text(`${S.l('texto de entrenamiento', 'training text')}: ${S.l(VARIANT_NAME[v][0], VARIANT_NAME[v][1])}`, F.x, fy, { size: 12, weight: 700, color: p.mute, base: 'top', w: F.w });
    const bw = F.w * (S.portrait ? 1 : 0.5), tw = share.en + share.es, bh = 18 * u, by = fy + 20 * u;
    d.rect(F.x, by, bw, bh, { fill: p.surface2 });
    d.rect(F.x, by, (bw * share.en) / tw, bh, { fill: alpha(tone(S, 'dat').c, 0.55) });
    d.rect(F.x + (bw * share.en) / tw, by, (bw * share.es) / tw, bh, { fill: alpha(tone(S, 'w').c, 0.7) });
    d.text(`${S.l('inglés', 'English')} ${S.n((100 * share.en) / tw, 0)} %`, F.x + 6 * u, by + bh / 2, { size: 12, weight: 700, color: p.ink, base: 'middle' });
    if (share.es > 0) d.text(`${S.l('español', 'Spanish')} ${S.n((100 * share.es) / tw, 0)} %`, F.x + bw - 6 * u, by + bh / 2, { size: 12, weight: 700, color: p.ink, align: 'right', base: 'middle' });
    if (reveal) {
      const rx = S.portrait ? F.x : F.x + bw + 20 * u, ry = S.portrait ? by + bh + 8 * u : fy;
      d.text(`${S.l('razón español / inglés (cuatro frases)', 'Spanish / English ratio (four sentences)')}: ${S.n(ratio, 2)}×`, rx, ry, { size: 13, weight: 800, color: ratio > 1.05 ? tone(S, 'err').ink : tone(S, 'dat').ink, base: 'top', w: S.portrait ? F.w : F.x + F.w - rx });
      if (S.st.verdict) d.text(S.st.verdict === 'ok' ? S.l('✓ Tu predicción acertó para el corpus que tenías.', '✓ Your prediction was right for the corpus you had.') : S.l('✗ Con ese corpus pasaba lo contrario.', '✗ With that corpus the opposite held.'), rx, ry + 20 * u, { size: 12, weight: 700, color: p.ink2, base: 'top', w: S.portrait ? F.w : F.x + F.w - rx });
    }
  });
}

function drawLangReal(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, v = (S.p.corpus ?? 'mix') as Variant;
  const toy = pairTotals(v);
  const groups: { name: string; en: number; es: number; toy?: boolean }[] = [
    { name: S.l('juguete', 'toy') + ' · ' + S.l(VARIANT_NAME[v][0], VARIANT_NAME[v][1]), ...toy, toy: true },
    { name: 'GPT-2', ...REAL.pairs.gpt2 }, { name: 'GPT-4', ...REAL.pairs.cl100k }, { name: 'GPT-4o', ...REAL.pairs.o200k },
  ];
  const max = Math.max(...groups.flatMap((g) => [g.en, g.es]));
  d.text(S.l('tokens de las mismas cuatro frases', 'tokens for the same four sentences'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' });
  const top = F.y + 22 * u, foot = 44 * u, gh = (F.h - 22 * u - foot) / groups.length, lw = S.portrait ? 0 : Math.min(150 * u, F.w * 0.24), bw = F.w - lw - 70 * u;
  groups.forEach((g, i) => {
    const y = top + i * gh, a = S.reveal('lang-real', 0.2 + i * 0.45, 0.5), ratio = g.es / g.en;
    d.withAlpha(a, () => {
      const nameY = S.portrait ? y : y + gh / 2, bx = F.x + lw, by = y + (S.portrait ? 18 * u : 4 * u), bh = Math.max(12 * u, (gh - (S.portrait ? 22 : 8) * u) / 2 - 2 * u);
      d.text(g.name, F.x, nameY, { size: 13, weight: 800, color: g.toy ? tone(S, 'lat').ink : p.ink, base: S.portrait ? 'top' : 'middle', w: S.portrait ? F.w * 0.6 : lw - 8 * u });
      ([['en', g.en, 'dat'], ['es', g.es, 'w']] as const).forEach(([k, val, tn], j) => {
        const yy = by + j * (bh + 3 * u), w = (bw * val) / max;
        d.rect(bx, yy, bw, bh, { fill: p.surface2 });
        d.rect(bx, yy, w, bh, { fill: alpha(tone(S, tn).c, 0.6), stroke: tone(S, tn).c, lw: 1 });
        d.text(k, bx + 4 * u, yy + bh / 2, { size: 12, weight: 800, font: 'mono', color: p.ink, base: 'middle' });
        d.text(String(val), bx + w + 6 * u, yy + bh / 2, { size: 12, weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
      });
      d.text(S.n(ratio, 2) + '×', F.x + F.w, by + bh, { size: 15, weight: 800, font: 'mono', color: ratio > 1.05 ? tone(S, 'err').ink : tone(S, 'dat').ink, align: 'right', base: 'middle' });
    });
  });
  d.withAlpha(S.reveal('lang-real', 2.4, 0.6), () => note(S, S.l('Real: medido con tiktoken en cuatro frases (muestra muy pequeña). Entre algunos idiomas se han medido hasta 15× (Petrov et al., 2023).', 'Real: measured with tiktoken on four sentences (a very small sample). Up to 15× has been measured between some languages (Petrov et al., 2023).'), F.x, F.y + F.h - foot + 8 * u, F.w, { size: 12 }));
}

// ═════════════════════════════════════════════════════════════════════════
// 9 · Letras y cifras
// ═════════════════════════════════════════════════════════════════════════
function drawFailLetters(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), w = REAL.word[L], word = w.text.trim();
  const a = S.reveal('fail-letters', 0.1, 0.6), er = tone(S, 'err');
  const fade = 1 - 0.7 * S.at('fail-letters', 2.2, 3.4);
  let y = F.y;
  d.withAlpha(a, () => d.text(S.l('lo que vemos', 'what we see'), F.x, y, { size: 12, weight: 700, color: p.mute, base: 'top' }));
  y += 18 * u;
  // letras, con las «r» resaltadas
  const size = 26, lw = d.measure('m', { size, weight: 700, font: 'mono' }) + 4 * u;
  d.withAlpha(a * fade, () => [...word].forEach((c, i) => { const x = F.x + i * lw; if (c === 'r') d.rect(x - 2 * u, y - 2 * u, lw, size * u * 1.25, { fill: alpha(er.c, 0.18), stroke: er.c, lw: 1.4 }); d.text(c, x + lw / 2 - 2 * u, y, { size, weight: 700, font: 'mono', color: c === 'r' ? er.ink : p.ink, align: 'center', base: 'top' }); }));
  d.withAlpha(a, () => d.text(S.l('¿cuántas «r» tiene?', 'how many “r” does it have?'), F.x + Math.max(word.length * lw + 16 * u, 0), y + 6 * u, { size: 14, weight: 700, color: er.ink, base: 'top', w: Math.max(80 * u, F.w - word.length * lw - 16 * u) }));
  y += size * u * 1.25 + 22 * u;
  const a2 = S.reveal('fail-letters', 1.4, 0.6);
  d.withAlpha(a2, () => {
    d.arrow(F.x + 20 * u, y, F.x + 20 * u, y + 24 * u, p.ink2, 2, 8);
    d.text(S.l('tokenizador (real: cl100k_base)', 'tokenizer (real: cl100k_base)'), F.x + 34 * u, y + 12 * u, { size: 12, weight: 700, color: p.mute, base: 'middle' });
    const toks = w.pieces.map((s, i) => ({ id: w.ids[i], bytes: [], text: s, chunk: 0 }));
    const r = drawTokens(S, toks, { x: F.x, y: y + 32 * u, w: F.w, h: 90 * u }, { size: 17, ids: true, labels: w.pieces.map((s) => s.replace(' ', '·')), raws: w.pieces.map(() => false), idList: w.ids });
    const by = y + 32 * u + r.h + 22 * u;
    d.withAlpha(S.reveal('fail-letters', 2.6, 0.6), () => {
      box(S, { x: F.x, y: by, w: Math.min(F.w, 330 * u), h: 40 * u }, S.l('el modelo recibe solo: ', 'the model receives only: ') + '[' + w.ids.join(', ') + ']', { tone: 'ink', size: 13, font: 'mono' });
      note(S, S.l('Sin letras a la vista, tiene que haber aprendido de memoria cómo se escribe cada pieza.', 'With no letters in sight, it must have learned by heart how each piece is spelled.'), F.x, by + 52 * u, F.w, { size: 12 });
    });
  });
}

function drawFailMath(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, n = REAL.num, lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const a = S.reveal('fail-math', 0.1, 0.6);
  d.withAlpha(a, () => { d.text(S.l('el número', 'the number'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top' }); d.text(S.n(+n.text, 0).replace(/[.,]/g, ''), F.x, F.y + 18 * u, { size: 30, weight: 800, font: 'mono', base: 'top' }); });
  const y1 = F.y + 78 * u;
  d.withAlpha(S.reveal('fail-math', 0.8, 0.6), () => {
    laneLabel(S, S.l('tokenizador (real: cl100k_base): bloques de tres desde la izquierda', 'tokenizer (real: cl100k_base): blocks of three from the left'), F.x, y1, F.w, { tone: 'lat' });
    drawTokens(S, null, { x: F.x, y: y1 + 38 * u, w: F.w, h: 70 * u }, { labels: n.pieces, raws: n.pieces.map(() => false), size: 20, ids: true, idList: n.ids });
  });
  const y2 = y1 + 38 * u + 76 * u;
  d.withAlpha(S.reveal('fail-math', 2.0, 0.6), () => {
    laneLabel(S, S.l('como lo leemos: unidades, miles, millones', 'how we read it: units, thousands, millions'), F.x, y2, F.w, { tone: 'dat' });
    drawTokens(S, null, { x: F.x, y: y2 + 38 * u, w: F.w, h: 50 * u }, { labels: ['1', '234', '567'], raws: [false, false, false], size: 20, tone: 'dat' });
    note(S, S.l('Los bloques del modelo no coinciden con los nuestros: sumar cifras largas se vuelve torpe.', 'The model’s blocks do not line up with ours: adding long numbers gets clumsy.'), F.x, y2 + 38 * u + 52 * u, F.w, { size: 12 });
  });
  void lat; void dat;
}

function drawFix(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), word = REAL.word[L].text;
  const plain = tok(word, 'mix'), spelled = tok([...word.trim()].join(' '), 'mix');
  const a = S.reveal('fail-fix', 0.1, 0.6);
  d.withAlpha(a, () => {
    laneLabel(S, S.l('tal como llega', 'as it arrives'), F.x, F.y, F.w, { badge: `${plain.length} ${S.l('tokens', 'tokens')}`, tone: 'lat' });
    const r1 = drawTokens(S, plain, { x: F.x, y: F.y + 24 * u, w: F.w, h: 60 * u }, { size: 16 });
    d.text(S.l('(tokenizador de juguete)', '(toy tokenizer)'), F.x, F.y + 24 * u + r1.h + 4 * u, { size: 12, color: p.mute, base: 'top' });
  });
  const y2 = F.y + 120 * u;
  d.withAlpha(S.reveal('fail-fix', 1.0, 0.6), () => {
    laneLabel(S, S.l('deletreada: una pieza por letra, a la vista', 'spelled out: one piece per letter, in sight'), F.x, y2, F.w, { badge: `${spelled.length} ${S.l('tokens', 'tokens')}`, tone: 'dat' });
    drawTokens(S, spelled, { x: F.x, y: y2 + 24 * u, w: F.w, h: 70 * u }, { size: 16, tone: 'dat' });
  });
  const y3 = y2 + 24 * u + 82 * u;
  d.withAlpha(S.reveal('fail-fix', 2.2, 0.6), () => {
    box(S, { x: F.x, y: Math.min(y3, F.y + F.h - 44 * u), w: Math.min(F.w, 300 * u), h: 40 * u }, S.l('o una herramienta de cálculo', 'or a calculation tool'), { tone: 'dat', size: 13 });
  });
}

// ═════════════════════════════════════════════════════════════════════════
// 10 · Límites, resumen y puente
// ═════════════════════════════════════════════════════════════════════════
function drawLimits(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u;
  const parts: { n: number; tn: 'sig' | 'dat' | 'lat'; l: string }[] = [
    { n: 6, tn: 'sig', l: S.l('instrucciones y pregunta', 'instructions and question') },
    { n: 22, tn: 'dat', l: S.l('documento', 'document') },
    { n: 12, tn: 'lat', l: S.l('respuesta', 'answer') },
  ];
  const total = 40, cols = S.portrait ? 10 : 20, rows = total / cols, cs = Math.min((F.w - 4 * u) / cols, (F.h * 0.4) / rows), gw = cs * cols, x0 = F.x + (F.w - gw) / 2, y0 = F.y + 48 * u;
  d.text(S.l('presupuesto de tokens de una petición (ilustrativo)', 'token budget of one request (illustrative)'), F.x, F.y, { size: 12, weight: 700, color: p.mute, base: 'top', w: F.w });
  let k = 0;
  parts.forEach((pt, pi) => {
    const t = tone(S, pt.tn), a = S.reveal('limits', 0.3 + pi * 0.9, 0.6);
    for (let i = 0; i < pt.n; i++, k++) { const cx = k % cols, cy = Math.floor(k / cols); d.rect(x0 + cx * cs, y0 + cy * cs, cs - 2, cs - 2, { fill: alpha(t.c, 0.5), stroke: t.c, lw: 1, a: clamp(a * 1.4 - i * 0.01) }); }
  });
  d.rect(x0 - 3, y0 - 3, gw + 6 - 2, rows * cs + 6 - 2, { stroke: p.ink, lw: 2 });
  const ly = y0 + rows * cs + 18 * u;
  parts.forEach((pt, i) => { const t = tone(S, pt.tn), a = S.reveal('limits', 0.5 + i * 0.9, 0.6), ly2 = ly + i * 24 * u; d.withAlpha(a, () => { d.rect(F.x, ly2 + 2 * u, 14 * u, 14 * u, { fill: alpha(t.c, 0.5), stroke: t.c, lw: 1 }); d.text(pt.l, F.x + 22 * u, ly2, { size: 13, weight: 700, color: p.ink, base: 'top' }); }); });
  d.withAlpha(S.reveal('limits', 3.0, 0.6), () => note(S, S.l('Entrada y salida comparten el mismo límite, y todo se mide en tokens.', 'Input and output share the same limit, and everything is measured in tokens.'), F.x, ly + 3 * 24 * u + 4 * u, F.w, { size: 13, weight: 700, color: p.ink2 }));
}

function drawRecap(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u;
  const labels = [S.l('texto', 'text'), S.l('tokenizador (BPE)', 'tokenizer (BPE)'), S.l('números', 'numbers'), S.l('modelo', 'model')];
  const tones = ['ink', 'lat', 'lat', 'ink'] as const;
  const bw = S.portrait ? Math.min(220 * u, F.w) : (F.w - 3 * 28 * u) / 4, bh = 48 * u;
  const pos: Rect[] = labels.map((_, i) => S.portrait ? { x: F.x + (F.w - bw) / 2, y: F.y + i * (bh + 22 * u), w: bw, h: bh } : { x: F.x + i * (bw + 28 * u), y: F.y + 10 * u, w: bw, h: bh });
  pos.forEach((r, i) => { const a = S.reveal('recap', 0.1 + i * 0.4, 0.5); if (a > 0) box(S, r, labels[i], { tone: tones[i], a, size: 14 }); });
  for (let i = 0; i < 3; i++) { const a = S.at('recap', 0.5 + i * 0.4, 1.0 + i * 0.4); if (a > 0) { const A = pos[i], B = pos[i + 1], horiz = !S.portrait; d.arrow(horiz ? A.x + A.w : A.x + A.w / 2, horiz ? A.y + A.h / 2 : A.y + A.h, lerp(horiz ? A.x + A.w : A.x + A.w / 2, horiz ? B.x : B.x + B.w / 2, a), lerp(horiz ? A.y + A.h / 2 : A.y + A.h, horiz ? B.y + B.h / 2 : B.y, a), p.ink2, 2, a > 0.98 ? 8 : 0.001); } }
  const tags: { l: string; tn: 'dat' | 'err' | 'w' | 'lat' }[] = [
    { l: S.l('común = barato', 'common = cheap'), tn: 'dat' }, { l: S.l('raro = caro', 'rare = expensive'), tn: 'err' },
    { l: S.l('otro idioma = más tokens', 'another language = more tokens'), tn: 'w' }, { l: S.l('costo y límites en tokens', 'cost and limits in tokens'), tn: 'lat' },
  ];
  const ty = S.portrait ? F.y + 4 * (bh + 22 * u) + 4 * u : F.y + bh + 70 * u;
  tags.forEach((t, i) => { const a = S.reveal('recap', 1.8 + i * 0.35, 0.5), col = S.portrait ? 0 : i % 2, row = S.portrait ? i : Math.floor(i / 2); badge(S, t.l, S.portrait ? F.x + F.w / 2 : F.x + F.w * (0.27 + 0.46 * col), ty + row * 34 * u, { tone: t.tn, a, size: 13 }); });
  if (!S.portrait) neu(S, F.x + F.w - 64 * u, F.y + F.h - 54 * u, { scale: Math.max(2, Math.round(2.6 * u)), mood: 'happy', a: S.reveal('recap', 2.4, 0.5) });
}

function drawBridge(S: Frame) {
  const { d, pal: p } = S, F = frame(S), u = F.u, L = lg(S), toks = tok(SENT[L], 'mix');
  const a = S.reveal('bridge', 0.1, 0.6);
  const rect: Rect = { x: F.x, y: F.y + F.h * 0.34, w: F.w, h: F.h * 0.3 };
  d.withAlpha(a, () => {
    const r = drawTokens(S, toks, rect, { size: 15, show: S.at('bridge', 0.2, 1.4, 'lin') * toks.length });
    // arcos tenues: «¿a cuáles mirar?» desde el último token
    const last = r.boxes[r.boxes.length - 1];
    if (last) r.boxes.slice(0, -1).forEach((b, i) => {
      const s = S.reveal('bridge', 1.6 + i * 0.04, 0.5), x1 = last.x + last.w / 2, x2 = b.x + b.w / 2, y = b.y, h = Math.min(60 * u, 14 * u + Math.abs(x1 - x2) * 0.18);
      const pts: [number, number][] = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([lerp(x1, x2, t), y - 4 * u - Math.sin(Math.PI * t) * h]); }
      if (Math.abs(b.y - last.y) < 4) d.polyline(pts, tone(S, 'lat').c, 1.4, { a: 0.22 + 0.5 * (1 - i / r.boxes.length) * s });
    });
  });
  d.withAlpha(S.reveal('bridge', 2.4, 0.6), () => d.text(S.l('¿a cuáles mirar?', 'which ones to look at?'), F.x + F.w / 2, F.y + F.h * 0.2, { size: 22, weight: 800, align: 'center', base: 'middle', color: tone(S, 'lat').ink, w: F.w }));
  neu(S, F.x + F.w / 2 - 36 * u, F.y + F.h * 0.7, { scale: Math.max(3, Math.round(3.4 * u)), mood: 'think', a: S.reveal('bridge', 0.4, 0.6) });
  d.withAlpha(S.reveal('bridge', 3.0, 0.6), () => {
    d.text(S.l('Siguiente', 'Next'), F.x + F.w / 2, F.y + F.h - 54 * u, { size: 13, weight: 700, color: p.mute, align: 'center', base: 'top' });
    d.text(S.l('Atención', 'Attention'), F.x + F.w / 2, F.y + F.h - 34 * u, { size: 24, weight: 800, align: 'center', base: 'top' });
  });
}
