// Acto 1: el problema (un modelo que no leyó tus documentos), por qué no basta pegarlo todo, la idea de RAG y sus dos tiempos.
import { alpha, clamp, hash, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { LLM } from './llm';
import { demoQ, lang } from './model';
import { arrow, area, drawFlow, flow, fz, lh, node, page, tagAt, toks } from './ui';

const clean = (s: string) => s.replace(/[*#`]/g, '').replace(/\s+/g, ' ').trim();
const FALLBACK = {
  es: 'Normalmente, las baterías de bicicletas eléctricas tienen entre uno y dos años de garantía.',
  en: 'Electric bike batteries typically come with a one- to two-year warranty.',
};
/** La respuesta del modelo sin documentos: real (build-llm.py) si existe; si no, un texto genérico rotulado ilustrativo. */
export const noRagAnswer = (l: 'es' | 'en') => { const a = LLM?.[l]?.norag?.answer; return a ? { text: clean(a), real: true } : { text: FALLBACK[l], real: false }; };

function bubble(S: Frame, key: string, x: number, y: number, w: number, text: string, o: { tone: 'sig' | 'mute'; dashed?: boolean; maxLines?: number; a?: number; minH?: number }) {
  const { d, pal: p } = S, u = S.u, sz = fz(S, 13), pad = 8 * u, t = tone(S, o.tone);
  const f = flow(S, key, toks(S, text), w - 2 * pad, sz, { maxLines: o.maxLines, weight: 600 });
  const h = Math.max(o.minH ?? 0, f.h + 2 * pad);
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: o.tone === 'sig' ? t.soft : p.surface, stroke: t.c, lw: 1.5, r: 6, dash: o.dashed ? [5, 4] : undefined });
    drawFlow(S, f, x + pad, y + pad, { weight: 600 });
  });
  return h;
}

// ═════════════ el problema: hook · frozen · guess ═════════════
export function drawProblem(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S, false), sz = fz(S, 13), L = lh(S, sz);
  let chat: Rect, model: Rect, manual: Rect;
  if (S.portrait) {
    const chatH = A.h * 0.48, gap = 10 * u, rowY = A.y + chatH + gap, rowH = A.h - chatH - gap, cw = (A.w - 12 * u) / 2;
    chat = { x: A.x, y: A.y, w: A.w, h: chatH };
    model = { x: A.x, y: rowY, w: cw, h: rowH };
    manual = { x: A.x + cw + 12 * u, y: rowY, w: cw, h: rowH };
  } else {
    const Hc = Math.min(A.h, 300 * u + 40), y0 = A.y + (A.h - Hc) / 2, lw = A.w * 0.4, gap = 14 * u, mh = Hc / 2 - gap / 2;
    model = { x: A.x, y: y0, w: lw, h: mh };
    manual = { x: A.x, y: y0 + mh + gap, w: lw, h: mh };
    chat = { x: A.x + lw + gap, y: y0, w: A.w - lw - gap, h: Hc };
  }
  const aChat = S.reveal('hook', 0, 0.5), aSide = S.reveal('hook', 0.5, 0.6);

  // ── chat ──
  d.withAlpha(aChat, () => {
    d.rect(chat.x, chat.y, chat.w, chat.h, { fill: alpha(p.surface, 0.55), stroke: p.line, lw: 1.5, r: 6 });
    d.text(S.l('Chat de la tienda', 'Shop chat'), chat.x + 10 * u, chat.y + 6 * u + L / 2, { size: sz, weight: 800, color: p.mute, base: 'middle' });
  });
  const inner = chat.w - 20 * u, bw = inner * 0.92;
  const qy = chat.y + 12 * u + L;
  const qh = bubble(S, 'q', chat.x + 10 * u + inner - bw, qy, bw, demoQ(l).q, { tone: 'sig', a: S.reveal('hook', 0.15, 0.5) });
  const ay = qy + qh + 8 * u, ans = noRagAnswer(l);
  if (!S.on('guess')) {
    // el modelo «piensa»: tres puntos
    const a = S.reveal('hook', 0.8, 0.5);
    d.withAlpha(a, () => {
      d.rect(chat.x + 10 * u, ay, 54 * u, L + 14 * u, { fill: p.surface, stroke: p.line, lw: 1.5, r: 6 });
      for (let i = 0; i < 3; i++) d.circle(chat.x + 10 * u + 15 * u + i * 12 * u, ay + (L + 14 * u) / 2, (3 + 1.2 * Math.max(0, Math.sin(S.clock * 5 - i))) * u, { fill: p.mute });
    });
  } else {
    const room = chat.y + chat.h - ay - 10 * u - (L + 8 * u), maxLines = Math.max(2, Math.floor((room - 16 * u) / L));
    const a = S.reveal('guess', 0, 0.5), h = bubble(S, 'a|' + ans.text.slice(0, 20), chat.x + 10 * u, ay, bw, ans.text, { tone: 'mute', dashed: true, maxLines, a });
    d.withAlpha(S.reveal('guess', 0.6, 0.5), () => {
      tagAt(S, S.l('sin fuente', 'no source'), chat.x + 10 * u, ay + h + 6 * u + L / 2, { tone: 'err', align: 'left' });
      tagAt(S, ans.real ? S.l('modelo real, sin documentos', 'real model, no documents') : S.l('ilustrativo', 'illustrative'), chat.x + 10 * u + 84 * u + (S.lang === 'es' ? 0 : 6 * u), ay + h + 6 * u + L / 2, { tone: 'mute', align: 'left' });
    });
  }

  // ── modelo ──
  d.withAlpha(aSide, () => {
    const t = tone(S, 'w');
    d.rect(model.x, model.y, model.w, model.h, { fill: alpha(t.c, 0.07), stroke: t.c, lw: 1.5, r: 4 });
    d.text(S.l('Modelo', 'Model'), model.x + 8 * u, model.y + 6 * u + L / 2, { size: sz, weight: 800, color: t.ink, base: 'middle' });
    // pesos: una cuadrícula que no cambia
    const cols = S.portrait ? 6 : 8, gx = model.x + 8 * u, gy = model.y + 10 * u + L, cs = Math.min((model.w - 16 * u) / cols, 26 * u), rows = Math.max(2, Math.min(5, Math.floor((model.h - L * 4.1 - 12 * u) / cs)));
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) d.rect(gx + i * cs, gy + j * cs, cs - 2, cs - 2, { fill: alpha(t.c, 0.18 + 0.6 * hash(i, j + 7)) });
    const fy = gy + rows * cs + 3 * u, a2 = S.reveal('frozen', 0.1, 0.5);
    d.withAlpha(a2, () => {
      tagAt(S, S.l('pesos congelados', 'frozen weights'), model.x + 8 * u, fy + L / 2, { tone: 'w', align: 'left' });
      if (fy + L * 1.9 < model.y + model.h) tagAt(S, S.l('fecha de corte', 'cutoff date'), model.x + 8 * u, fy + L * 1.5 + 4 * u, { tone: 'mute', align: 'left' });
    });
  });

  // ── manual (el modelo nunca lo leyó) ──
  d.withAlpha(aSide, () => {
    const t = tone(S, 'dat');
    d.rect(manual.x, manual.y, manual.w, manual.h, { fill: alpha(p.mute, 0.05), stroke: p.mute, lw: 1.5, r: 4, dash: [5, 4] });
    d.text(fitText(S, S.l('Manual de la tienda', 'Shop manual'), manual.w - 12 * u), manual.x + 8 * u, manual.y + 6 * u + L / 2, { size: sz, weight: 800, color: p.ink2, base: 'middle' });
    const ph = Math.min(manual.h - L * 3.4, 84 * u), pw = ph * 0.72;
    for (let i = 2; i >= 0; i--) page(S, manual.x + 10 * u + i * 12 * u, manual.y + 10 * u + L + (2 - i) * 5 * u, pw, ph, { tone: 'dat', a: 0.55 + 0.15 * (2 - i), dashed: true });
    tagAt(S, S.l('nunca lo leyó', 'never read it'), manual.x + 8 * u, manual.y + manual.h - 6 * u - L / 2, { tone: 'err', align: 'left' });
    void t;
  });
  // barrera entre modelo y manual
  d.withAlpha(aSide, () => {
    if (S.portrait) d.line(model.x + model.w + 6 * u, model.y + 4 * u, model.x + model.w + 6 * u, model.y + model.h - 4 * u, tone(S, 'err').c, 2, [6, 5]);
    else d.line(model.x + 6 * u, model.y + model.h + 7 * u, model.x + model.w - 6 * u, model.y + model.h + 7 * u, tone(S, 'err').c, 2, [6, 5]);
  });
  if (!S.portrait && S.H > 330) neu(S, chat.x + chat.w - 62 * u, chat.y + chat.h - 60 * u, { scale: Math.max(2, Math.round(2.2 * u)), mood: S.on('guess') ? 'sad' : 'think', a: S.reveal('hook', 1, 0.5) });
}

function fitText(S: Frame, text: string, w: number) { const sz = fz(S, 13); let s = text; while (s.length > 3 && S.d.measure(s, { size: sz, weight: 800 }) > w) s = s.slice(0, -1); return s; }

// ═════════════ pegarlo todo: paste ═════════════
export function drawPaste(S: Frame) {
  const { d } = S, u = S.u, A = area(S, false), sz = fz(S, 13), L = lh(S, sz);
  const t = tone(S, 'dat'), lt = tone(S, 'lat');
  const cols = S.portrait ? 8 : 12, rows = 6, N = cols * rows, CAP = S.portrait ? 12 : 18, wc = 6;
  const gap = 3 * u, top = A.y + L + 8 * u;
  const docsW = S.portrait ? A.w : A.w * 0.5, pw = (docsW - (cols - 1) * gap) / cols;
  const availH = S.portrait ? A.h * 0.36 : A.h - L - 12 * u, ph = Math.min((availH - (rows - 1) * gap) / rows, pw * 1.3);
  const gridH = rows * ph + (rows - 1) * gap;
  let winR: Rect;
  if (S.portrait) { const wy = top + gridH + 12 * u + L + 6 * u; winR = { x: A.x + A.w * 0.1, y: wy, w: A.w * 0.8, h: Math.max(60 * u, A.y + A.h - wy - L - 10 * u) }; }
  else winR = { x: A.x + A.w * 0.58, y: top + L + 6 * u, w: A.w * 0.42, h: Math.min(A.h * 0.55, A.y + A.h - top - 2 * L - 24 * u) };
  const a = S.reveal('paste', 0, 0.5);
  d.withAlpha(a, () => {
    d.text(S.l('tus documentos (ilustrativo)', 'your documents (illustrative)'), A.x, A.y + L / 2, { size: sz, weight: 800, color: t.ink, base: 'middle' });
    d.text(S.l('ventana de contexto', 'context window'), winR.x, winR.y - L / 2 - 4 * u, { size: sz, weight: 800, color: lt.ink, base: 'middle' });
    d.rect(winR.x, winR.y, winR.w, winR.h, { fill: alpha(lt.c, 0.06), stroke: lt.c, lw: 2, r: 4 });
  });
  const wr = Math.ceil(CAP / wc), wgap = 3 * u, wpw = (winR.w - 12 * u - (wc - 1) * wgap) / wc, wph = Math.min((winR.h - 12 * u - (wr - 1) * wgap) / wr, wpw * 1.3);
  const prog = S.at('paste', 0.4, 4.2, 'lin') * N;
  for (let i = 0; i < N; i++) {
    const cx = A.x + (i % cols) * (pw + gap), cy = top + Math.floor(i / cols) * (ph + gap), reached = prog > i, inWin = i < CAP;
    d.withAlpha(a, () => {
      if (reached && inWin) { page(S, cx, cy, pw, ph, { tone: 'dat', a: 0.22, lines: 2 }); const wx = winR.x + 6 * u + (i % wc) * (wpw + wgap), wy = winR.y + 6 * u + Math.floor(i / wc) * (wph + wgap); page(S, wx, wy, wpw, wph, { tone: 'dat', lines: 2 }); }
      else if (reached) page(S, cx, cy, pw, ph, { tone: 'err', a: 0.9, lines: 2, dashed: true });
      else page(S, cx, cy, pw, ph, { tone: 'dat', lines: 2 });
    });
  }
  d.withAlpha(S.at('paste', 3.0, 3.8) * a, () => tagAt(S, S.l('no cabe', 'does not fit'), A.x + A.w, A.y + L / 2, { tone: 'err', align: 'right' }));
  d.withAlpha(S.at('paste', 3.6, 4.4) * a, () => tagAt(S, S.l('cada token se paga', 'every token costs money'), winR.x + winR.w, winR.y + winR.h + 8 * u + L / 2, { tone: 'w', align: 'right' }));
}

// ═════════════ la idea y los dos tiempos: idea · phases (y recap) ═════════════
interface PipeRects { docs: Rect; chunk: Rect; vec: Rect; index: Rect; q: Rect; ret: Rect; rerank: Rect; prompt: Rect; gen: Rect; titleA: [number, number]; titleB: [number, number] }
export function pipeRects(S: Frame, A: Rect): PipeRects {
  const u = S.u, sz = fz(S, 13), L = lh(S, sz);
  if (S.portrait) {
    const cw = (A.w - 16 * u) / 2, top = A.y + L + 6 * u, nh = Math.min(46 * u, (A.h - L - 6 * u - 4 * 18 * u) / 5), ga = (A.h - L - 6 * u - 5 * nh) / 4.6;
    const ya = (i: number) => top + i * (nh + ga), xa = A.x, xb = A.x + cw + 16 * u, r = (x: number, i: number): Rect => ({ x, y: ya(i), w: cw, h: nh });
    return { docs: r(xa, 0), chunk: r(xa, 1), vec: r(xa, 2), index: r(xa, 3), q: r(xb, 0), ret: r(xb, 1), rerank: r(xb, 2), prompt: r(xb, 3), gen: r(xb, 4), titleA: [xa, A.y + L / 2], titleB: [xb, A.y + L / 2] };
  }
  const nh = Math.min(50 * u, A.h * 0.17), gA = 24 * u, gB = 16 * u, wa = (A.w - 3 * gA) / 4, wb = (A.w - 4 * gB) / 5;
  const yA = A.y + L + 8 * u, yB = A.y + A.h * 0.58, ra = (i: number): Rect => ({ x: A.x + i * (wa + gA), y: yA, w: wa, h: nh }), rb = (i: number): Rect => ({ x: A.x + i * (wb + gB), y: yB, w: wb, h: nh });
  return { docs: ra(0), chunk: ra(1), vec: ra(2), index: ra(3), q: rb(0), ret: rb(1), rerank: rb(2), prompt: rb(3), gen: rb(4), titleA: [A.x, A.y + L / 2], titleB: [A.x, yB - L / 2 - 6 * u] };
}

export function drawPipe(S: Frame, mode: 'idea' | 'recap') {
  const { d, pal: p } = S, u = S.u, A = area(S, mode === 'recap'), R = pipeRects(S, A), sz = fz(S, 13), L = lh(S, sz);
  const recap = mode === 'recap';
  const ph = recap ? 1 : S.reveal('phases', 0, 0.7), idea = recap ? 0 : 1 - ph;       // «idea» (se ve la versión corta) → «phases» (se ve completa)
  const base = recap ? S.reveal('recap', 0, 0.5) : S.reveal('idea', 0, 0.5);
  const hot = recap ? Math.floor(S.clock / 0.9) % 9 : -1;
  const order = ['docs', 'chunk', 'vec', 'index', 'q', 'ret', 'rerank', 'prompt', 'gen'] as const;
  const lab: Record<string, string> = { docs: S.l('Documentos', 'Documents'), chunk: S.l('Fragmentar', 'Chunk'), vec: S.l('Vectorizar', 'Vectorize'), index: S.l('Índice', 'Index'), q: S.l('Pregunta', 'Question'), ret: S.l('Recuperar', 'Retrieve'), rerank: S.l('Reordenar', 'Rerank'), prompt: 'Prompt', gen: S.l('Modelo', 'Model') };
  const tn: Record<string, 'dat' | 'lat' | 'sig' | 'w' | 'ink'> = { docs: 'dat', chunk: 'dat', vec: 'lat', index: 'lat', q: 'ink', ret: 'lat', rerank: 'lat', prompt: 'sig', gen: 'w' };
  const sub: Record<string, string> = { chunk: S.l('trozos', 'pieces'), vec: 'TF-IDF', index: S.l('vectores + texto', 'vectors + text'), rerank: S.l('más fino', 'finer'), prompt: S.l('fuentes + pregunta', 'sources + question') };
  const subOn = S.portrait ? false : true;
  // visibilidad por nodo
  const vis = (k: string) => {
    if (k === 'docs' || k === 'q' || k === 'ret' || k === 'gen') return base;
    return ph;
  };
  d.withAlpha(ph, () => {
    d.text(S.l('Preparar (una sola vez)', 'Prepare (once)'), R.titleA[0], R.titleA[1], { size: sz, weight: 800, color: tone(S, 'dat').ink, base: 'middle' });
    d.text(S.l('Con cada pregunta', 'With every question'), R.titleB[0], R.titleB[1], { size: sz, weight: 800, color: tone(S, 'lat').ink, base: 'middle' });
  });
  order.forEach((k, i) => node(S, R[k], lab[k], { tone: tn[k], a: vis(k), active: recap ? (hot === i ? 1 : 0.15) : 0, sub: subOn && sub[k] && R[k].h > 40 * u ? sub[k] : undefined }));
  const mid = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
  const right = (r: Rect): [number, number] => [r.x + r.w, r.y + r.h / 2], left = (r: Rect): [number, number] => [r.x, r.y + r.h / 2], bot = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h], top = (r: Rect): [number, number] => [r.x + r.w / 2, r.y];
  const chain = (a: Rect, b: Rect, k: number, tone_: 'ink' | 'dat' | 'lat' = 'ink') => { const vert = S.portrait; const [x1, y1] = vert ? bot(a) : right(a), [x2, y2] = vert ? top(b) : left(b); arrow(S, x1, y1, x2, y2, { tone: tone_, k, lw: 2 }); };
  // flechas de «idea» (versión corta): docs → recuperar (punteada) y recuperar → modelo (larga)
  const kk = S.at('idea', 0.8, 1.6);
  if (!recap) {
    if (idea > 0.02) {
      const [dx, dy] = S.portrait ? bot(R.docs) : bot(R.docs), [rx, ry] = S.portrait ? left(R.ret) : top(R.ret);
      if (S.portrait) { const sx = R.docs.x + R.docs.w, sy = R.docs.y + R.docs.h / 2; d.withAlpha(idea * base, () => d.polyline([[sx, sy], [sx + 8 * u, sy], [sx + 8 * u, ry], [rx, ry]], tone(S, 'dat').c, 2, { dash: [5, 4] })); }
      else d.withAlpha(idea * base, () => d.polyline([[dx, dy], [dx, (dy + ry) / 2], [rx, (dy + ry) / 2], [rx, ry]], tone(S, 'dat').c, 2, { dash: [5, 4] }));
      d.withAlpha(idea * base * kk, () => {
        const [x1, y1] = S.portrait ? bot(R.q) : right(R.q), [x2, y2] = S.portrait ? top(R.ret) : left(R.ret); arrow(S, x1, y1, x2, y2, { tone: 'ink', lw: 2 });
        if (S.portrait) { const [a1, b1] = bot(R.ret), [a2, b2] = top(R.gen); arrow(S, a1, b1, a2, b2, { tone: 'ink', lw: 2, dashed: true }); }
        else { const [a1, b1] = right(R.ret), [a2, b2] = left(R.gen); arrow(S, a1, b1, a2, b2, { tone: 'ink', lw: 2, dashed: true }); }
      });
    }
  }
  const fl = recap ? 1 : ph;
  const sec = (k: number) => clamp(fl * 3 - k);
  d.withAlpha(0, () => {});
  chain(R.docs, R.chunk, sec(0)); chain(R.chunk, R.vec, sec(0.6)); chain(R.vec, R.index, sec(1.1));
  chain(R.q, R.ret, recap ? 1 : Math.max(sec(0.2), idea * kk)); chain(R.ret, R.rerank, sec(1.4)); chain(R.rerank, R.prompt, sec(1.7)); chain(R.prompt, R.gen, sec(2));
  // índice → recuperar
  if (fl > 0.4) {
    const a = clamp((fl - 0.4) * 2), ix = R.index, rt = R.ret;
    if (S.portrait) { const sx = ix.x + ix.w, sy = ix.y + ix.h / 2, mx = sx + 8 * u, ex = rt.x, ey = rt.y + rt.h / 2; d.withAlpha(a, () => { d.polyline([[sx, sy], [mx, sy], [mx, ey], [ex - 2, ey]], tone(S, 'lat').c, 2); d.arrow(mx, ey, ex, ey, tone(S, 'lat').c, 2, 7 * u); }); }
    else { const sx = ix.x + ix.w / 2, sy = ix.y + ix.h, ex = rt.x + rt.w / 2, ey = rt.y, my = (sy + ey) / 2; d.withAlpha(a, () => { d.polyline([[sx, sy], [sx, my], [ex, my], [ex, ey - 2]], tone(S, 'lat').c, 2); d.arrow(ex, my + (ey - my) * 0.5, ex, ey, tone(S, 'lat').c, 2, 7 * u); }); }
  }
  // la respuesta
  const ga = recap ? 1 : S.reveal('idea', 1.6, 0.6);
  d.withAlpha(ga, () => {
    const g = R.gen;
    if (S.portrait) tagAt(S, S.l('respuesta + citas', 'answer + citations'), g.x + g.w / 2, g.y + g.h + 6 * u + L / 2, { tone: 'sig' });
    else tagAt(S, S.l('respuesta + citas', 'answer + citations'), g.x + g.w / 2, g.y + g.h + 8 * u + L / 2, { tone: 'sig' });
  });
  if (!recap) { const sc = Math.max(2, Math.round(2.6 * u)); if (S.portrait) neu(S, R.docs.x + (R.docs.w - 24 * sc) / 2, (R.docs.y + R.gen.y) / 2 + 10 * u, { scale: sc, mood: 'happy', a: S.reveal('idea', 0.6, 0.5) * idea }); else if (S.H > 340) neu(S, A.x + A.w - 24 * sc - 4 * u, A.y + 4 * u, { scale: sc, mood: 'happy', a: S.reveal('idea', 0.6, 0.5) * idea }); }
  void p;
}
