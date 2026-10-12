// Actos 5 y 6: la regla práctica, por qué se cobra por token y el precio; y el idioma: la misma frase en inglés y en
// español (GPT-4o), mil doce frases medidas con tres tokenizadores, la causa (el juguete) y otros idiomas.
import { alpha, box, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { REAL, toyPairTotals, type Lg } from './data';
import { ap, area, caption, countTag, drawBlocks, fitBlocks, fitText, fits, fr, isShort, note } from './viz';

const trim = (a: readonly string[]) => a.map((s) => s.trim());

// ═════════ 100 tokens ≈ 75 palabras ═════════
export function drawRule(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), lat = tone(S, 'lat'), dat = tone(S, 'dat');
  const headH = 26 * u, footH = (short ? 16 : 40) * u, gapX = 36 * u;
  const cs = Math.min((A.w - gapX) / 20, (A.h - headH - footH) / 10, 22 * u), gw = cs * 10;
  const x1 = A.x + (A.w - 2 * gw - gapX) / 2, x2 = x1 + gw + gapX, y0 = A.y + headH;
  const a1 = fr(S, 'rule', 0.06, 0.36), a2 = fr(S, 'rule', 0.4, 0.66);
  d.withAlpha(ap(S, 'rule', 0.03, 0.12), () => fitText(S, '100 tokens', x1, A.y, gw, { size: 15, weight: 800, color: lat.ink }));
  d.withAlpha(ap(S, 'rule', 0.38, 0.46), () => fitText(S, S.l('≈ 75 palabras', '≈ 75 words'), x2, A.y, gw, { size: 15, weight: 800, color: dat.ink }));
  for (let i = 0; i < 100; i++) {
    const cx = i % 10, cy = Math.floor(i / 10);
    const b1 = clamp(a1 * 100 - i), b2 = clamp(a2 * 100 - i);
    if (b1 > 0) d.rect(x1 + cx * cs, y0 + cy * cs, cs - 2, cs - 2, { fill: alpha(lat.c, 0.55), a: b1 });
    if (b2 > 0) d.rect(x2 + cx * cs, y0 + cy * cs, cs - 2, cs - 2, i < 75 ? { fill: alpha(dat.c, 0.55), a: b2 } : { stroke: p.line, lw: 1, a: b2, dash: [2, 2] });
  }
  const a3 = ap(S, 'rule', 0.7, 0.8);
  if (a3 > 0 && !short) d.withAlpha(a3, () => {
    fitText(S, S.l('1 token ≈ ¾ de palabra ≈ 4 caracteres', '1 token ≈ ¾ of a word ≈ 4 characters'), A.x + A.w / 2, y0 + gw + 10 * u, A.w, { size: 14, weight: 800, align: 'center', color: p.ink });
    note(S, S.l('Regla práctica para inglés (OpenAI). En otros idiomas cambia.', 'Rule of thumb for English (OpenAI). It changes in other languages.'), A.x + A.w / 2, y0 + gw + 30 * u, A.w, { align: 'center' });
  });
  if (a3 > 0 && short) caption(S, S.l('regla práctica para inglés (OpenAI)', 'rule of thumb for English (OpenAI)'), A.x + A.w / 2, y0 + gw + 4 * u, A.w, { align: 'center', a: a3 });
}

// ═════════ lo que lee, lo que escribe y el precio ═════════
export function drawCost(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lg, A = area(S), short = isShort(S), land = !S.portrait;
  const C = REAL.chat[L], inL = trim(C.ask.pieces), outL = trim(C.answer.pieces);
  const priceH = (short ? 44 : 78) * u;
  const top: Rect = { x: A.x, y: A.y, w: A.w, h: A.h - priceH - (short ? 6 : 12) * u };
  const sig = tone(S, 'sig'), lat = tone(S, 'lat');
  const nOut = S.on('price') ? outL.length : fr(S, 'billing', 0.4, 0.92) * outL.length;
  const aIn = ap(S, 'billing', 0.04, 0.16), aM = ap(S, 'billing', 0.18, 0.3), aOut = ap(S, 'billing', 0.3, 0.4);
  let inR: Rect, mR: Rect, outR: Rect;
  if (land) {
    const mw = Math.min(110 * u, top.w * 0.16), cw = (top.w - mw - 40 * u) / 2;
    inR = { x: top.x, y: top.y, w: cw, h: top.h }; mR = { x: top.x + cw + 20 * u, y: top.y + top.h / 2 - 22 * u, w: mw, h: 44 * u }; outR = { x: mR.x + mw + 20 * u, y: top.y, w: cw, h: top.h };
  } else {
    const ch = (top.h - 44 * u - 40 * u) / 2;
    inR = { x: top.x, y: top.y, w: top.w, h: ch }; mR = { x: top.x + top.w / 2 - 60 * u, y: top.y + ch + 20 * u, w: 120 * u, h: 44 * u }; outR = { x: top.x, y: mR.y + 44 * u + 20 * u, w: top.w, h: ch };
  }
  const panel = (r: Rect, title: string, labels: string[], n: number, t: Tone, a: number, lab: string) => {
    if (a <= 0) return;
    const c = tone(S, t), lay = fitBlocks(S, labels, { w: r.w, h: r.h - 46 * u }, { size: short ? 14 : 16, minSize: 12 });
    const by = land ? r.y + Math.max(20 * u, (r.h - lay.h) / 2) : r === inR ? r.y + Math.max(22 * u, r.h - lay.h - 4 * u) : r.y + 22 * u;
    d.withAlpha(a, () => {
      fitText(S, title, r.x, by - 22 * u, r.w - 96 * u, { size: 13, weight: 800, color: c.ink });
      countTag(S, `${Math.min(labels.length, Math.floor(n + 1e-6))} ${lab}`, r.x + r.w, by - 14 * u, t);
      drawBlocks(S, labels, { x: r.x, y: by, w: r.w, h: lay.h }, { tone: t, show: n }, lay);
    });
  };
  panel(inR, S.l('lo que lee', 'what it reads'), inL, inL.length, 'sig', aIn, S.l('leídos', 'read'));
  if (aM > 0) {
    const pulse = S.is('billing') && nOut > 0 && nOut < outL.length ? 0.5 + 0.5 * Math.cos((nOut % 1) * Math.PI * 2) : 0;
    box(S, mR, S.l('modelo', 'model'), { tone: 'ink', a: aM, active: pulse * 0.6 });
    d.withAlpha(aM, () => {
      if (land) { d.arrow(inR.x + inR.w + 4 * u, mR.y + mR.h / 2, mR.x - 3 * u, mR.y + mR.h / 2, p.ink2, 1.6, 7); d.arrow(mR.x + mR.w + 3 * u, mR.y + mR.h / 2, outR.x - 4 * u, mR.y + mR.h / 2, p.ink2, 1.6, 7); }
      else { d.arrow(mR.x + mR.w / 2, mR.y - 16 * u, mR.x + mR.w / 2, mR.y - 3 * u, p.ink2, 1.6, 7); d.arrow(mR.x + mR.w / 2, mR.y + mR.h + 3 * u, mR.x + mR.w / 2, mR.y + mR.h + 16 * u, p.ink2, 1.6, 7); }
    });
  }
  panel(outR, S.l('lo que escribe, uno a uno', 'what it writes, one by one'), outL, nOut, 'lat', aOut, S.l('escritos', 'written'));

  // el precio (segmento «price»)
  const aP = ap(S, 'price', 0.05, 0.2);
  if (aP > 0) {
    const y = A.y + A.h - priceH, cw = Math.min(A.w / 2 - 8 * u, 300 * u), x1 = A.x + A.w / 2 - cw - 8 * u, x2 = A.x + A.w / 2 + 8 * u;
    const tag = (x: number, lbl: string, val: string, c: ReturnType<typeof tone>, a: number) => d.withAlpha(a, () => {
      d.rect(x, y, cw, (short ? 36 : 46) * u, { fill: alpha(c.c, 0.1), stroke: c.c, lw: 1.4, r: 4 });
      fitText(S, lbl, x + 10 * u, y + 5 * u, cw - 20 * u, { size: 12, weight: 700, color: p.mute });
      fitText(S, val, x + 10 * u, y + (short ? 17 : 21) * u, cw - 20 * u, { size: short ? 14 : 17, weight: 800, font: 'mono', color: c.ink });
    });
    tag(x1, S.l('leer: por millón', 'reading: per million'), S.l('3 USD', '$3'), sig, aP);
    tag(x2, S.l('escribir: por millón', 'writing: per million'), S.l('15 USD (× 5)', '$15 (× 5)'), lat, ap(S, 'price', 0.25, 0.4));
    if (!short) note(S, S.l('ejemplo: precios publicados de un modelo (Anthropic, octubre de 2026)', 'example: published prices of one model (Anthropic, October 2026)'), A.x + A.w / 2, y + 52 * u, A.w, { align: 'center', a: ap(S, 'price', 0.45, 0.55) });
  }
}

// ═════════ la misma frase en dos idiomas (GPT-4o) ═════════
export const pairNow = (S: Frame) => clamp(Math.round(Number(S.p.pair ?? 0)), 0, REAL.pairs.length - 1);

export function drawLang(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S);
  const P = REAL.pairs[pairNow(S)], en = trim(P.en.pieces), es = trim(P.es.pieces);
  const nEn = en.length, nEs = es.length, diff = Math.round((100 * (nEs - nEn)) / nEn);
  const ratioH = (short ? 22 : 40) * u, g = (short ? 6 : 12) * u, headH = (short ? 16 : 20) * u;
  const laneH = (A.h - ratioH - 2 * g) / 2;
  const asTok = ap(S, 'lang', 0.42, 0.56);
  // en la demostración, cada cambio de frase pasa por un breve desvanecido (los cambios de la persona son inmediatos)
  let dip = 1;
  if (S.is('lang-demo') && !S.touched.has('pair')) { const q = fr(S, 'lang-demo', 0, 1); for (const sp of [0.12, 0.42, 0.7]) dip = Math.min(dip, clamp(Math.abs(q - sp) / 0.025)); }
  const lane = (y: number, title: string, text: string, labels: string[], t: Tone) => {
    const c = tone(S, t), a = ap(S, 'lang', 0.04, 0.16);
    d.withAlpha(a, () => {
      fitText(S, title, A.x, y, A.w * 0.5, { size: 13, weight: 800, color: c.ink });
      const hot = S.is('lang-count') ? ap(S, 'lang-count', title === S.l('inglés', 'English') ? 0.05 : 0.3, title === S.l('inglés', 'English') ? 0.15 : 0.4) : 0;
      if (asTok > 0) { countTag(S, `${labels.length} tokens`, A.x + A.w, y + 8 * u, t, { a: asTok * dip }); if (hot > 0) d.rect(A.x + A.w - 76 * u, y - 4 * u, 78 * u, 24 * u, { stroke: p.ink, lw: 2, r: 4, a: hot }); }
      const r: Rect = { x: A.x, y: y + headH + 2 * u, w: A.w, h: laneH - headH - 4 * u };
      if (asTok < 1) d.text(text, r.x, r.y, { size: short ? 14 : 16, weight: 600, color: p.ink, base: 'top', w: r.w, a: 1 - asTok });
      if (asTok > 0) { const lay = fitBlocks(S, labels, r, { size: short ? 14 : 17, minSize: 12 }); drawBlocks(S, labels, r, { tone: 'lat', a: asTok * dip }, lay); }
    });
  };
  lane(A.y, S.l('inglés', 'English'), P.en.text, en, 'dat');
  lane(A.y + laneH + g, S.l('español', 'Spanish'), P.es.text, es, 'w');
  const aR = Math.max(ap(S, 'lang-count', 0.45, 0.6), S.on('lang-demo') ? 1 : 0);
  if (aR > 0) {
    const y = A.y + 2 * laneH + 2 * g;
    const msg = diff > 0 ? S.l(`el español usa ${diff} % más tokens`, `Spanish uses ${diff}% more tokens`) : diff < 0 ? S.l(`el español usa ${-diff} % menos tokens`, `Spanish uses ${-diff}% fewer tokens`) : S.l('empate: los mismos tokens', 'a tie: the same tokens');
    fitText(S, msg, A.x + A.w / 2, y + (short ? 2 : 8) * u, A.w, { size: short ? 14 : 17, weight: 800, color: diff > 0 ? tone(S, 'err').ink : tone(S, 'dat').ink, align: 'center', a: aR * dip });
  }
}

// ═════════ mil doce frases, tres tokenizadores ═════════
export function drawLangBars(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), F = REAL.flores;
  const groups = [
    { name: 'GPT-2', sub: 'gpt2 · 2019', v: F.gpt2, a: ap(S, 'lang-old', 0.42, 0.55) },
    { name: 'GPT-4', sub: 'cl100k_base', v: F.cl100k_base, a: ap(S, 'lang-old', 0.06, 0.2) },
    { name: 'GPT-4o', sub: 'o200k_base', v: F.o200k_base, a: ap(S, 'lang-avg', 0.3, 0.45) },
  ];
  const headH = (short ? 18 : 26) * u, footH = short ? 0 : 18 * u, gh = (A.h - headH - footH) / 3;
  const lw = short ? 70 * u : Math.min(110 * u, A.w * 0.24), rw = 64 * u, bx = A.x + lw, bw = A.w - lw - rw - 60 * u;
  caption(S, S.l(`tokens en ${S.n(F.sentences, 0)} frases traducidas (FLORES-200)`, `tokens in ${S.n(F.sentences, 0)} translated sentences (FLORES-200)`), A.x, A.y, A.w, { a: ap(S, 'lang-avg', 0.04, 0.16) });
  const max = F.gpt2.es;
  groups.forEach((g, i) => {
    if (g.a <= 0) return;
    const y = A.y + headH + i * gh, bh = Math.min(20 * u, (gh - 10 * u) / 2 - 2 * u), ratio = g.v.es / g.v.en;
    d.withAlpha(g.a, () => {
      fitText(S, g.name, A.x, y + gh / 2 - 15 * u, lw - 8 * u, { size: 14, weight: 800, color: p.ink });
      if (fits(S, g.sub, lw - 8 * u, 12, 600)) fitText(S, g.sub, A.x, y + gh / 2 + 2 * u, lw - 8 * u, { size: 12, weight: 600, color: p.mute });
      ([['en', g.v.en, 'dat'], ['es', g.v.es, 'w']] as const).forEach(([k, val, tn], j) => {
        const yy = y + gh / 2 - bh - 1 * u + j * (bh + 2 * u), w = (bw * val) / max, c = tone(S, tn);
        d.rect(bx, yy, w, bh, { fill: alpha(c.c, 0.6), stroke: c.c, lw: 1 });
        d.text(S.l(k === 'en' ? 'inglés' : 'español', k === 'en' ? 'English' : 'Spanish'), bx + 5 * u, yy + bh / 2, { size: 12, weight: 700, color: p.ink, base: 'middle' });
        d.text(S.n(val, 0), bx + w + 6 * u, yy + bh / 2, { size: 12, weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
      });
      d.text(`+${Math.round((ratio - 1) * 100)} %`.replace(' %', S.lang === 'es' ? ' %' : '%'), A.x + A.w, y + gh / 2, { size: short ? 15 : 18, weight: 800, font: 'mono', color: tone(S, 'err').ink, align: 'right', base: 'middle' });
    });
  });
  if (!short) caption(S, S.l('contado por nosotros con tiktoken 0.14.0', 'counted by us with tiktoken 0.14.0'), A.x, A.y + A.h - 14 * u, A.w, { a: ap(S, 'lang-avg', 0.5, 0.6) });
}

// ═════════ por qué: lo que el tokenizador vio poco, lo parte más ═════════
export function drawLangWhy(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), land = !S.portrait;
  const P = REAL.pairs[1], enW = P.en.pieces.filter((s) => s.trim() === 'investing').map((s) => s.trim());
  const i0 = P.es.pieces.findIndex((s) => s.trim() === 'inv'), esW = P.es.pieces.slice(i0, i0 + 3).map((s) => s.trim());
  const ex: Rect = land ? { x: A.x, y: A.y, w: A.w * 0.44, h: A.h } : { x: A.x, y: A.y, w: A.w, h: A.h * 0.42 };
  const ty: Rect = land ? { x: A.x + A.w * 0.5, y: A.y, w: A.w * 0.5, h: A.h } : { x: A.x, y: A.y + A.h * 0.46, w: A.w, h: A.h * 0.54 };
  // ejemplo real (GPT-4o): el mismo verbo
  const a1 = ap(S, 'lang-why', 0.25, 0.4), a2 = ap(S, 'lang-why', 0.5, 0.65);
  caption(S, S.l('GPT-4o, el mismo verbo:', 'GPT-4o, the same verb:'), ex.x, ex.y, ex.w, { a: ap(S, 'lang-why', 0.15, 0.25) });
  const rowH = (short ? 40 : 54) * u;
  const row = (y: number, labels: string[], word: string, t: Tone, a: number, lab: string) => d.withAlpha(a, () => {
    fitText(S, word, ex.x, y, ex.w * 0.5, { size: 13, weight: 800, color: tone(S, t).ink });
    countTag(S, lab, ex.x + ex.w, y + 8 * u, t);
    drawBlocks(S, labels, { x: ex.x, y: y + 18 * u, w: ex.w, h: rowH - 18 * u }, { tone: 'lat', size: short ? 14 : 17 });
  });
  row(ex.y + 20 * u, enW, S.l('inglés: investing', 'English: investing'), 'dat', a1, S.l('1 token', '1 token'));
  row(ex.y + 20 * u + rowH + 8 * u, esW, S.l('español: invirtiendo', 'Spanish: invirtiendo'), 'w', a2, S.l('3 tokens', '3 tokens'));
  // el juguete, entrenado de dos maneras (lang-toy)
  const aT = ap(S, 'lang-toy', 0.05, 0.18);
  if (aT > 0) {
    const groups = [
      { name: S.l('juguete entrenado solo con inglés', 'toy trained on English only'), v: toyPairTotals('en'), a: ap(S, 'lang-toy', 0.15, 0.3) },
      { name: S.l('juguete entrenado con los dos idiomas por igual', 'toy trained on both languages equally'), v: toyPairTotals('bal'), a: ap(S, 'lang-toy', 0.55, 0.7) },
    ];
    const max = Math.max(...groups.map((g) => g.v.es));
    d.withAlpha(aT, () => caption(S, S.l('las cuatro frases del «tu turno»: tokens en total', 'the four “your turn” sentences: total tokens'), ty.x, ty.y, ty.w));
    const gh = (ty.h - 20 * u) / 2, rw = 56 * u;
    groups.forEach((g, i) => {
      if (g.a <= 0) return;
      const y = ty.y + 20 * u + i * gh, bh = Math.min(18 * u, (gh - 26 * u) / 2 - 2 * u), bw = ty.w - rw - 40 * u;
      d.withAlpha(g.a, () => {
        fitText(S, g.name, ty.x, y, ty.w, { size: 13, weight: 800, color: p.ink });
        ([['en', g.v.en, 'dat'], ['es', g.v.es, 'w']] as const).forEach(([k, val, tn], j) => {
          const yy = y + 20 * u + j * (bh + 3 * u), w = (bw * val) / max, c = tone(S, tn);
          d.rect(ty.x, yy, w, bh, { fill: alpha(c.c, 0.6), stroke: c.c, lw: 1 });
          d.text(S.l(k === 'en' ? 'inglés' : 'español', k === 'en' ? 'English' : 'Spanish'), ty.x + 5 * u, yy + bh / 2, { size: 12, weight: 700, color: p.ink, base: 'middle' });
          d.text(String(val), ty.x + w + 6 * u, yy + bh / 2, { size: 12, weight: 700, font: 'mono', color: p.ink2, base: 'middle' });
        });
        const pct = Math.round((g.v.es / g.v.en - 1) * 100);
        d.text(`+${pct}${S.lang === 'es' ? ' %' : '%'}`, ty.x + ty.w, y + 20 * u + bh, { size: 16, weight: 800, font: 'mono', color: pct > 20 ? tone(S, 'err').ink : tone(S, 'dat').ink, align: 'right', base: 'middle' });
      });
    });
  }
}

// ═════════ otros idiomas: hasta quince veces ═════════
export function drawLangOther(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), short = isShort(S), er = tone(S, 'err'), lat = tone(S, 'lat');
  const a = ap(S, 'lang-other', 0.05, 0.2);
  const cy = A.y + A.h * (short ? 0.32 : 0.3);
  d.withAlpha(a, () => {
    d.text(S.l('hasta 15×', 'up to 15×'), A.x + A.w / 2, cy, { size: short ? 34 : 46, weight: 800, font: 'mono', color: er.ink, align: 'center', base: 'middle' });
    d.text(S.l('más tokens para el mismo texto traducido, entre algunos idiomas', 'more tokens for the same translated text, between some languages'), A.x + A.w / 2, cy + (short ? 22 : 32) * u, { size: short ? 13 : 14, weight: 700, color: p.ink, align: 'center', base: 'top', w: A.w });
  });
  // proporción: un bloque frente a quince
  const a2 = ap(S, 'lang-other', 0.35, 0.5);
  if (a2 > 0) {
    const cs = Math.min(22 * u, (A.w - 40 * u) / 17), y = cy + (short ? 46 : S.portrait ? 84 : 70) * u, x0 = A.x + (A.w - 16 * cs - 30 * u) / 2;
    d.withAlpha(a2, () => {
      d.rect(x0, y, cs - 3, cs - 3, { fill: alpha(lat.c, 0.6) });
      for (let i = 0; i < 15; i++) d.rect(x0 + cs + 30 * u + i * cs, y, cs - 3, cs - 3, { fill: alpha(er.c, 0.55), a: clamp(fr(S, 'lang-other', 0.35, 0.65) * 15 - i) });
      d.text('1', x0 + cs / 2, y + cs + 4 * u, { size: 12, weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
      d.text('15', x0 + cs + 30 * u + 7.5 * cs, y + cs + 4 * u, { size: 12, weight: 700, font: 'mono', color: p.ink2, align: 'center', base: 'top' });
    });
  }
  if (!short) caption(S, S.l('Petrov y colegas, NeurIPS 2023', 'Petrov and colleagues, NeurIPS 2023'), A.x + A.w / 2, A.y + A.h - 14 * u, A.w, { align: 'center', a: ap(S, 'lang-other', 0.5, 0.6) });
}
