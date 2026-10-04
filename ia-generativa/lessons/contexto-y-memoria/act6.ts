// Acto 6: las funciones de memoria son texto guardado fuera del modelo que se vuelve a pegar en la ventana
// (cuaderno de notas, resumen, almacén externo), sus costos, el resumen del acto y el puente a RAG.
import { alpha, clamp, ease, hash, lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import type { Role } from './model';
import { K, T, Tbot, card, chip, fitLabel, isShort, mw, neuAt, neuH, neuW, num, pad, roleLabel, sz, wagon, wrapLines } from './ui';

const L_TOK = 1024;

// ───────────────────────────── una tira horizontal con vagones de ancho libre ─────────────────────────────
interface Item { role: Role; tokens: number; a?: number; label?: string; dashed?: boolean; hot?: boolean }
interface Strip { x: number; y: number; w: number; h: number }

function strip(S: Frame, r: Strip, items: Item[], o: { label?: string; a?: number; hotLast?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, scale = r.w / L_TOK;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x - 5 * u, r.y - 5 * u, r.w + 10 * u, r.h + 10 * u, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 2, r: 5 });
    if (o.label) T(S, o.label, r.x - 5 * u, r.y - 11 * u, { px: 12.5, weight: 800, color: p.ink2, base: 'bottom' });
    let s = 0;
    items.forEach((it) => {
      const w = it.tokens * scale;
      if (w >= 1) {
        const rr: Rect = { x: r.x + s + 1, y: r.y, w: w - 2, h: r.h };
        wagon(S, rr, it.role, { label: it.label === undefined ? fitLabel(S, rr, [roleLabel(S, it.role), roleLabel(S, it.role, true)]) : it.label, a: it.a ?? 1, dashed: it.dashed, hot: it.hot });
      }
      s += w;
    });
    if (s < r.w - 2) d.rect(r.x + s + 1, r.y, r.w - s - 2, r.h, { stroke: p.line, lw: 1.5, dash: [4, 4], r: 3 });
  });
}

const NOTES = {
  es: ['Ana · logística', 'Prefiere respuestas breves', 'Pidió ideas sobre fletes'],
  en: ['Ana · logistics', 'Prefers brief answers', 'Asked for freight ideas'],
};

/** Notas fuera del modelo, a un lado (o arriba en teléfono). */
function notebook(S: Frame, r: Rect, a: number, o: { title?: string; rows?: number; hot?: number[]; many?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, lh = 22 * u;
  card(S, r, { a, title: o.title ?? S.l('Cuaderno de notas · fuera del modelo', 'Notebook · outside the model'), dashed: false });
  d.withAlpha(a, () => {
    const rows = o.many ? Math.max(3, Math.floor((r.h - 40 * u) / lh)) : 3;
    for (let i = 0; i < rows; i++) {
      const y = r.y + 34 * u + i * lh, hot = o.hot?.includes(i), t = tone(S, hot ? 'dat' : 'mute');
      d.rect(r.x + 10 * u, y, r.w - 20 * u, lh - 4 * u, { fill: alpha(t.c, hot ? 0.3 : 0.1), stroke: t.c, lw: hot ? 2 : 1, r: 2 });
      const txt = o.many ? S.l(`nota ${i + 1}`, `note ${i + 1}`) : NOTES[S.lang][i];
      T(S, hot || !o.many ? txt : txt, r.x + 18 * u, y + (lh - 4 * u) / 2, { px: 12.5, weight: hot ? 800 : 600, color: hot ? t.ink : p.ink2, base: 'middle', w: r.w - 36 * u });
    }
  });
}

export function drawMemory(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S), short = isShort(S);
  const aV = S.at('memory-q', 0, 0.5, 'out') * (1 - S.at('memory-risk', 0, 0.45, 'out'));
  if (aV <= 0) return;
  const stripH = Math.max(40 * u, Math.min(F.h * 0.15, 64 * u)), tn = tone(S, 'dat'), land = !S.portrait;
  const sw = (w: Strip) => w.w / L_TOK;
  d.withAlpha(aV, () => {
    // ───────── memory-q: las notas viajan al inicio del contexto de una conversación nueva
    const aQ = S.at('memory-q', 0, 0.5, 'out') * (1 - S.at('memory-summary', 0, 0.45, 'out'));
    if (aQ > 0) d.withAlpha(aQ, () => {
      const ew = land ? Math.min(F.w * 0.34, 300 * u) : F.w, eh = land ? 134 * u : 128 * u;
      const ext: Rect = land ? { x: F.x, y: F.y + F.h * (short ? 0.12 : 0.22), w: ew, h: eh } : { x: F.x, y: F.y + 12 * u, w: F.w, h: eh };
      const win: Strip = land ? { x: ext.x + ew + 90 * u, y: ext.y + eh / 2 - stripH / 2, w: F.w - ew - 100 * u, h: stripH } : { x: F.x + 8 * u, y: ext.y + eh + 92 * u, w: F.w - 16 * u, h: stripH };
      notebook(S, ext, S.reveal('memory-q', 0.1, 0.5), { hot: [0, 1, 2] });
      const fly = S.at('memory-q', 1.2, 2.6, 'io'), memTok = 140, t = ease.io(fly);
      const items: Item[] = [{ role: 'sys', tokens: 200 }, { role: 'mem', tokens: memTok * ease.out(fly), label: fly > 0.99 ? S.l('notas', 'notes') : undefined, hot: fly > 0.99 }, { role: 'user', tokens: 110 }];
      strip(S, win, items, { label: S.l('conversación nueva · contexto', 'new conversation · context'), a: S.reveal('memory-q', 0.4, 0.5) });
      const tx = win.x + 200 * sw(win) + 70 * sw(win) * 0 + 16 * u, tyy = win.y + win.h / 2;
      if (fly > 0 && fly < 1) {
        const x0 = land ? ext.x + ext.w : ext.x + ext.w / 2, y0 = land ? ext.y + ext.h / 2 : ext.y + ext.h;
        const x = lerp(x0, tx, t), y = lerp(y0, tyy, t);
        d.line(x0, y0, x, y, tn.c, 2, [5, 4], 0.9);
        wagon(S, { x: x - 22 * u, y: y - 12 * u, w: 44 * u, h: 24 * u }, 'mem', { label: false, a: 0.95, solid: true });
      }
      T(S, S.l('se pega al inicio del contexto, en cada conversación', 'pasted at the start of the context, in every conversation'), win.x - 5 * u, win.y + win.h + 16 * u, { px: 13.5, weight: 700, color: tn.ink, base: 'top', w: win.w + 10 * u, a: S.reveal('memory-q', 3.4, 0.5) });
      if (!short && land) neuAt(S, F.x + F.w - neuW(S), F.y + F.h - neuH(S) - 4 * u, 'think', S.reveal('memory-q', 0.6, 0.5));
      Tbot(S, S.l('Ejemplo ilustrativo del mecanismo: cada producto lo implementa a su manera.', 'Illustrative example of the mechanism: each product implements it in its own way.'), F.x, F.y + F.h, { px: 12, weight: 600, color: p.mute, w: F.w * (land ? 0.78 : 1) });
    });

    // ───────── memory-summary: lo viejo se resume
    const aS = S.at('memory-summary', 0, 0.5, 'out') * (1 - S.at('memory-store', 0, 0.45, 'out'));
    if (aS > 0) d.withAlpha(aS, () => {
      const k = ease.io(clamp((S.since('memory-summary') - 1.4) / 1.6)), SUMM = 90;
      const win: Strip = { x: F.x + 8 * u, y: F.y + F.h * (land ? 0.14 : 0.12) + 14 * u, w: F.w - 16 * u, h: stripH };
      const items: Item[] = [
        { role: 'sys', tokens: 200 },
        { role: 'user', tokens: 80 * (1 - k), a: 1 - k }, { role: 'ai', tokens: 120 * (1 - k), a: 1 - k }, { role: 'user', tokens: 90 * (1 - k), a: 1 - k }, { role: 'ai', tokens: 200 * (1 - k), a: 1 - k },
        { role: 'sum', tokens: SUMM * k, a: k, dashed: true },
        { role: 'user', tokens: 70 }, { role: 'ai', tokens: 160 },
      ];
      strip(S, win, items, { label: k < 0.5 ? S.l('contexto casi lleno', 'context nearly full') : S.l('tras resumir: hay espacio', 'after summarizing: there is room'), a: S.reveal('memory-summary', 0.1, 0.5) });
      if (k > 0.9) { const used = (200 + SUMM + 70 + 160) * sw(win); chip(S, S.l('espacio recuperado', 'room recovered'), win.x + used + (win.w - used) / 2, win.y + win.h / 2, { tone: 'dat', a: S.reveal('memory-summary', 3.2, 0.4) }); }
      const cy = win.y + stripH + 40 * u, cw = land ? Math.min(F.w, 700 * u) : F.w, cx = F.x + (F.w - cw) / 2, px = land ? 14 : 13.5;
      const orig = S.l('«Me llamo Ana y trabajo en logística… Dame una idea para ahorrar en fletes… Consolida envíos y renegocia rutas.»', '“My name is Ana and I work in logistics… Give me one idea to save on freight… Consolidate shipments and renegotiate routes.”');
      const summ = S.l('«Ana, de logística, pidió ideas para ahorrar en fletes.»', '“Ana, in logistics, asked for ideas to save on freight.”');
      const aT = S.reveal('memory-summary', 0.6, 0.5), lhh = px * K(S) * 1.3;
      d.withAlpha(aT, () => {
        const oh = wrapLines(S, orig, cw - 24 * u, px, 600).length * lhh + 34 * u;
        card(S, { x: cx, y: cy, w: cw, h: oh }, { title: S.l('original (se sale de la ventana)', 'original (leaves the window)') });
        T(S, orig, cx + 12 * u, cy + 28 * u, { px, weight: 600, color: p.ink2, base: 'top', w: cw - 24 * u });
        const y2 = cy + oh + 16 * u, sh = wrapLines(S, summ, cw - 24 * u, px, 700).length * lhh + 34 * u;
        const a2 = S.at('memory-summary', 2.6, 3.4, 'out');
        d.withAlpha(a2, () => {
          card(S, { x: cx, y: y2, w: cw, h: sh }, { tone: 'dat', title: S.l('resumen (ocupa su lugar)', 'summary (takes its place)'), titleTone: 'dat' });
          T(S, summ, cx + 12 * u, y2 + 28 * u, { px, weight: 700, color: p.ink, base: 'top', w: cw - 24 * u });
          chip(S, S.l('se perdió: la idea concreta', 'lost: the actual idea'), cx + cw - 6 * u, y2 + sh + 18 * u, { tone: 'err', align: 'right' });
        });
      });
      T(S, S.l('Ejemplo ilustrativo.', 'Illustrative example.'), F.x, F.y + F.h, { px: 12, weight: 600, color: p.mute, base: 'bottom' });
    });

    // ───────── memory-store: almacén externo, solo lo relevante
    const aE = S.at('memory-store', 0, 0.5, 'out');
    if (aE > 0) d.withAlpha(aE, () => {
      const hot = [1, 4], ew = land ? Math.min(F.w * 0.34, 300 * u) : F.w;
      const st: Rect = land ? { x: F.x, y: F.y + 8 * u, w: ew, h: Math.min(F.h - 40 * u, 330 * u) } : { x: F.x, y: F.y + 8 * u, w: F.w, h: Math.min(F.h * 0.4, 168 * u) };
      notebook(S, st, S.reveal('memory-store', 0.1, 0.5), { title: S.l('Almacén externo · enorme y lento', 'External store · huge and slow'), many: true, hot: S.since('memory-store') > 1.6 ? hot : [] });
      const win: Strip = land ? { x: st.x + st.w + 90 * u, y: st.y + st.h / 2 - stripH / 2, w: F.w - st.w - 100 * u, h: stripH } : { x: F.x + 8 * u, y: st.y + st.h + 84 * u, w: F.w - 16 * u, h: stripH };
      const fly = S.at('memory-store', 1.6, 3.2, 'io');
      const winLabel = S.l('ventana · rápida y pequeña', 'window · fast and small');
      strip(S, win, [{ role: 'sys', tokens: 200 }, { role: 'mem', tokens: 90 * ease.out(fly) }, { role: 'mem', tokens: 90 * ease.out(fly) }, { role: 'user', tokens: 110 }], { label: land ? undefined : winLabel, a: S.reveal('memory-store', 0.3, 0.5) });
      // en horizontal el rótulo va a la derecha, para que las flechas de las notas no lo crucen
      if (land) T(S, winLabel, win.x + win.w + 5 * u, win.y - 11 * u, { px: 12.5, weight: 800, color: p.ink2, align: 'right', base: 'bottom', a: S.reveal('memory-store', 0.3, 0.5) });
      if (S.since('memory-store') > 1.4) {
        const a = S.reveal('memory-store', 1.4, 0.5), lh = 22 * u;
        d.withAlpha(a, () => {
          hot.forEach((h, j) => {
            const y0 = st.y + 34 * u + h * lh + (lh - 4 * u) / 2, tx = win.x + (200 + 45 + j * 90) * sw(win);
            if (land) d.arrow(st.x + st.w + 2 * u, y0, tx, win.y - 3 * u, tn.c, 2, 8, a);
          });
          if (!land) d.arrow(F.x + F.w / 2, st.y + st.h + 4 * u, F.x + F.w / 2, win.y - 14 * u, tn.c, 2, 8);
        });
        T(S, S.l('se busca solo lo relevante', 'only what is relevant is fetched'), win.x - 5 * u, win.y + win.h + 16 * u, { px: 13.5, weight: 700, color: tn.ink, base: 'top', w: win.w + 10 * u, a });
      }
      Tbot(S, S.l('MemGPT: niveles de memoria, como en un sistema operativo.', 'MemGPT: memory tiers, like in an operating system.'), F.x, F.y + F.h, { px: 12, weight: 600, color: p.mute, w: F.w, a: S.reveal('memory-store', 3.0, 0.5) });
    });
  });
  void hash; void mw; void num; void sz;
}

// ───────────────────────────── costos de cada vía ─────────────────────────────
export function drawRisks(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S);
  const a = S.at('memory-risk', 0, 0.5, 'out') * (1 - S.at('recap', 0, 0.45, 'out'));
  if (a <= 0) return;
  const cards = [
    { es: 'Resumen', en: 'Summary', ses: 'pierde detalle', sen: 'loses detail', glyph: 0 },
    { es: 'Notas', en: 'Notes', ses: 'pueden estar equivocadas u obsoletas', sen: 'can be wrong or outdated', glyph: 1 },
    { es: 'Datos', en: 'Data', ses: 'lo que se envía o se guarda sale de tu organización', sen: 'what is sent or stored leaves your organization', glyph: 2 },
  ];
  const gap = 12 * u, cols = S.portrait ? 1 : 3, cw = (F.w - gap * (cols - 1)) / cols, ch = S.portrait ? (F.h - gap * 2) / 3 : Math.min(F.h * 0.8, 260 * u);
  d.withAlpha(a, () => {
    cards.forEach((c, i) => {
      const x = F.x + (S.portrait ? 0 : i * (cw + gap)), y = S.portrait ? F.y + i * (ch + gap) : F.y + (F.h - ch) / 2;
      const ai = S.reveal('memory-risk', 0.1 + i * 0.35, 0.5);
      d.withAlpha(ai, () => {
        card(S, { x, y, w: cw, h: ch }, { tone: 'err' });
        const gx = S.portrait ? x + 14 * u : x + cw / 2, gy = S.portrait ? y + ch / 2 : y + ch * 0.3, gs = S.portrait ? 22 * u : 36 * u, te = tone(S, 'err');
        // glifos simples
        if (c.glyph === 0) { [1, 0.78, 0.55].forEach((k, j) => d.rect(gx - gs + (S.portrait ? gs : 0) - gs * k + gs, gy - gs * 0.5 + j * gs * 0.45, gs * 2 * k, gs * 0.28, { fill: alpha(te.c, 0.5) })); d.line(gx + (S.portrait ? gs : 0) + gs * 0.2, gy - gs * 0.6, gx + (S.portrait ? gs : 0) + gs * 0.2, gy + gs * 1.1, te.c, 2, [3, 3]); }
        else if (c.glyph === 1) { const x0 = gx + (S.portrait ? gs * 0.2 : -gs); d.rect(x0, gy - gs * 0.7, gs * 2, gs * 1.5, { fill: alpha(tone(S, 'dat').c, 0.25), stroke: tone(S, 'dat').c, lw: 2, r: 2 }); T(S, '?', x0 + gs, gy + gs * 0.05, { px: 22, weight: 900, color: te.ink, align: 'center', base: 'middle' }); }
        else { const x0 = gx + (S.portrait ? gs * 0.2 : -gs); d.rect(x0, gy - gs * 0.7, gs * 1.4, gs * 1.5, { stroke: p.lineStrong, lw: 2, r: 2 }); d.arrow(x0 + gs * 1.5, gy, x0 + gs * 2.5, gy, te.c, 2.5, 8); }
        const tx = S.portrait ? x + 14 * u + 78 * u : x + 12 * u, tw = S.portrait ? cw - 100 * u : cw - 24 * u;
        T(S, S.l(c.es, c.en), tx, S.portrait ? y + 12 * u : y + ch * 0.52, { px: 17, weight: 800, color: te.ink, base: 'top', w: tw });
        T(S, S.l(c.ses, c.sen), tx, S.portrait ? y + 36 * u : y + ch * 0.52 + 30 * u, { px: 14.5, weight: 600, color: p.ink, base: 'top', w: tw });
      });
    });
  });
}

// ───────────────────────────── resumen y puente ─────────────────────────────
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, F = pad(S);
  const a = S.at('recap', 0, 0.5, 'out') * (1 - S.at('bridge', 0, 0.45, 'out'));
  if (a <= 0) return;
  const items: { es: string; en: string; tone: 'ink' | 'lat' | 'err' | 'dat' }[] = [
    { es: '1 · El modelo no tiene estado', en: '1 · The model is stateless', tone: 'ink' },
    { es: '2 · La ventana es todo lo que ve', en: '2 · The window is all it sees', tone: 'lat' },
    { es: '3 · Más contexto: más costo, y el medio rinde peor', en: '3 · More context: more cost, and the middle does worse', tone: 'err' },
    { es: '4 · Memoria: texto reinsertado', en: '4 · Memory: reinserted text', tone: 'dat' },
  ];
  const cols = S.portrait ? 1 : 2, rows = S.portrait ? 4 : 2, gap = 12 * u, bw = (F.w - gap * (cols - 1)) / cols, bh = Math.min(S.portrait ? 66 * u : 112 * u, (F.h - gap * (rows - 1)) / rows);
  const top = F.y + (F.h - (rows * bh + (rows - 1) * gap)) / 2;
  d.withAlpha(a, () => {
    items.forEach((it, i) => {
      const r: Rect = { x: F.x + (i % cols) * (bw + gap), y: top + Math.floor(i / cols) * (bh + gap), w: bw, h: bh }, ai = S.reveal('recap', 0.2 + i * 0.3, 0.5), t = tone(S, it.tone);
      d.withAlpha(ai, () => {
        d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1), stroke: t.c, lw: 1.5, r: 4 });
        T(S, S.l(it.es, it.en), r.x + r.w / 2, r.y + r.h / 2, { px: S.portrait ? 15 : 17.5, weight: 800, color: t.ink, align: 'center', base: 'middle', w: r.w - 28 * u });
      });
    });
  });
  if (!S.portrait && !isShort(S)) neuAt(S, F.x + F.w - neuW(S), F.y + F.h - neuH(S), 'happy', a * S.reveal('recap', 1.4, 0.5));
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2, a = S.at('bridge', 0, 0.5, 'out');
  if (a <= 0) return;
  const k = Math.max(4, Math.round((S.portrait ? 4.5 : 6) * u)), nw = 24 * k, nh = 18 * k;
  d.withAlpha(a, () => {
    neuAt(S, cx - nw / 2, cy - nh - 28 * u, 'happy', S.reveal('bridge', 0.2, 0.6), k / u);
    T(S, S.l('Siguiente', 'Next'), cx, cy + 8 * u, { px: 13, weight: 700, color: p.mute, align: 'center', base: 'top', a: S.reveal('bridge', 0.8, 0.5) });
    T(S, S.l('RAG: leer antes de responder', 'RAG: read before answering'), cx, cy + 32 * u, { px: S.portrait ? 21 : 26, weight: 800, color: p.ink, align: 'center', base: 'top', w: S.W - 40 * u, a: S.reveal('bridge', 0.9, 0.5) });
    T(S, S.l('darle conocimiento propio sin reentrenarlo', 'giving it your own knowledge without retraining it'), cx, cy + (S.portrait ? 92 : 78) * u, { px: 14, weight: 600, color: p.ink2, align: 'center', base: 'top', w: S.W - 40 * u, a: S.reveal('bridge', 1.4, 0.5) });
  });
}
