// Acto 2: fragmentar. La garantía de la tienda se corta en grupos de oraciones; el mejor fragmento para la pregunta se calcula
// de verdad (coseno TF-IDF contra cada fragmento) y se comprueba si trae el dato Y su condición, y cuánto de él es respuesta.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { CHUNK_DEMO } from './corpus';
import { chunkDemo, lang, type ChunkDemo } from './model';
import { area, drawFlow, flow, fit, fz, lh, tagAt, type Tok } from './ui';

function docToks(S: Frame, cd: ChunkDemo, shown: number, bestOn: boolean): Tok[] {
  const p = S.pal, dat = tone(S, 'dat'), lat = tone(S, 'lat'), sg = tone(S, 'sig'), w = tone(S, 'w');
  const out: Tok[] = [];
  cd.wins.forEach(([a, b], ci) => {
    const on = ci < shown, best = bestOn && ci === cd.best;
    const bg = !on ? undefined : best ? alpha(lat.c, 0.3) : ci % 2 ? alpha(p.mute, 0.16) : alpha(dat.c, 0.16);
    const tc = best ? lat : dat;
    if (on) out.push({ t: String(ci + 1), mono: true, tag: { fill: alpha(tc.c, 0.3), stroke: tc.c, ink: tc.ink } });
    for (let si = a; si < b; si++) for (const wd of cd.sents[si].split(/\s+/).filter(Boolean)) {
      const isF = si === cd.fi, isC = si === cd.ci;
      out.push({ t: wd, bg, color: isF ? sg.ink : isC ? w.ink : p.ink, weight: isF || isC ? 800 : 500, ul: isF ? sg.c : isC ? w.c : undefined, uld: isC });
    }
  });
  return out;
}

/** ✓ o ✗ dibujados con trazos (la forma acompaña al color). */
export function mark(S: Frame, x: number, y: number, ok: boolean, size = 7) {
  const { d } = S, u = S.u, s = size * u, t = tone(S, ok ? 'dat' : 'err');
  if (ok) d.polyline([[x - s * 0.9, y], [x - s * 0.25, y + s * 0.7], [x + s, y - s * 0.8]], t.c, 3, { join: 'round' });
  else { d.line(x - s * 0.8, y - s * 0.8, x + s * 0.8, y + s * 0.8, t.c, 3); d.line(x - s * 0.8, y + s * 0.8, x + s * 0.8, y - s * 0.8, t.c, 3); }
}

export function drawChunk(S: Frame) {
  const { d, pal: p } = S, u = S.u, l = lang(S), A = area(S, true), sz = fz(S, 13), L = lh(S, sz);
  // ¿qué tamaño se muestra?
  let g: number, shown = 99, bestOn = true, readouts = true;
  if (!S.on('chunk-small')) {
    g = 2; bestOn = false; readouts = false;
    shown = Math.floor(S.at('chunk', 0.6, 3.4, 'lin') * 4.999) ;
  } else if (!S.on('try-chunk')) { g = 1; bestOn = S.since('chunk-small') > 0.9; }
  else if (!S.on('chunk-big')) g = Math.round(Number(S.p.g ?? 1));
  else { const t = S.since('chunk-big'); g = t < 2.6 ? 3 : Math.min(8, 4 + Math.floor((t - 2.6) / 0.9)); }
  const cd = chunkDemo(l, g);
  if (!S.on('chunk-small')) shown = Math.max(0, Math.min(cd.wins.length, shown));

  // reparto
  let docR: Rect, sideR: Rect;
  if (S.portrait) { docR = { x: A.x, y: A.y, w: A.w, h: 0 }; sideR = { x: A.x, y: 0, w: A.w, h: 0 }; }
  else { const w1 = A.w * 0.56; docR = { x: A.x, y: A.y, w: w1, h: A.h }; sideR = { x: A.x + w1 + 14 * u, y: A.y, w: A.w - w1 - 14 * u, h: A.h }; }

  // pregunta
  const q = CHUNK_DEMO[l].q;
  d.withAlpha(S.reveal('chunk', 0, 0.4), () => {
    d.text(S.l('Pregunta', 'Question'), docR.x, docR.y + L / 2, { size: sz, weight: 800, color: p.mute, base: 'middle' });
    d.text(fit(S, q, docR.w - 78 * u, sz, 700), docR.x + 76 * u, docR.y + L / 2, { size: sz, weight: 700, color: p.ink, base: 'middle' });
  });
  // documento
  const dy = docR.y + L + 8 * u, key = `doc|${g}|${shown}|${bestOn ? cd.best : -1}`;
  const f = flow(S, key, docToks(S, cd, shown, bestOn), docR.w - 2 * u, sz, {});
  d.withAlpha(S.reveal('chunk', 0.1, 0.5), () => drawFlow(S, f, docR.x, dy));
  const docBottom = dy + f.h;
  if (S.portrait) { sideR = { x: A.x, y: docBottom + 10 * u, w: A.w, h: A.y + A.h - docBottom - 10 * u }; }
  if (!readouts) {
    const a = S.at('chunk', 2.2, 3.2);
    d.withAlpha(a, () => tagAt(S, S.l(`${cd.wins.length} fragmentos`, `${cd.wins.length} chunks`), sideR.x + (S.portrait ? A.w / 2 : sideR.w / 2), S.portrait ? sideR.y + L : sideR.y + L, { tone: 'dat', align: 'center' }));
    return;
  }

  // lecturas
  const a = S.reveal(S.on('try-chunk') ? 'try-chunk' : 'chunk-small', S.on('try-chunk') ? 0 : 0.5, 0.5);
  d.withAlpha(a, () => {
    const dat = tone(S, 'dat'), lat = tone(S, 'lat'), sg = tone(S, 'sig'), w = tone(S, 'w');
    const nr = S.portrait ? 5.6 : 7.4, rowH = Math.max(L * 1.12, Math.min(L * 1.9, (sideR.h - 4 * u) / nr)), x = sideR.x, W = sideR.w;
    let y = sideR.y + (S.portrait ? 0 : L + 8 * u);
    const row = (label: string, value: string, color: string, glyph?: boolean) => {
      d.text(fit(S, label, W - 60 * u, sz, 700), x, y + rowH / 2, { size: sz, weight: 700, color, base: 'middle' });
      if (glyph !== undefined) mark(S, x + W - 8 * u, y + rowH / 2, glyph, 6);
      if (value) d.text(value, x + W - (glyph !== undefined ? 22 * u : 0), y + rowH / 2, { size: sz, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
      y += rowH;
    };
    if (!S.portrait) { row(S.l('Oraciones por fragmento', 'Sentences per chunk'), String(g), p.ink2); row(S.l('Fragmentos', 'Chunks'), String(cd.wins.length), p.ink2); }
    // mejor fragmento + coseno
    d.rect(x, y + rowH / 2 - 6 * u, 12 * u, 12 * u, { fill: alpha(lat.c, 0.3), stroke: lat.c, lw: 1.5, r: 2 });
    d.text(fit(S, S.l('Recuperado · coseno', 'Retrieved · cosine'), W - 80 * u, sz, 700), x + 18 * u, y + rowH / 2, { size: sz, weight: 700, color: lat.ink, base: 'middle' });
    d.text(S.n(cd.cos[cd.best], 2), x + W, y + rowH / 2, { size: sz, weight: 800, font: 'mono', color: p.ink, align: 'right', base: 'middle' });
    y += rowH;
    row(S.l('Trae el dato', 'Has the fact'), '', sg.ink, cd.hasFact);
    row(S.l('Trae la condición', 'Has the condition'), '', w.ink, cd.hasCond);
    // fracción que es respuesta, con marca en 40 %
    const pct = Math.round(cd.frac * 100), bw = W, by = y + rowH * 0.62;
    d.text(fit(S, S.l('Es respuesta', 'Is the answer'), W - 60 * u, sz, 700), x, y + rowH * 0.3, { size: sz, weight: 700, color: dat.ink, base: 'middle' });
    d.text(`${pct} %`, x + W, y + rowH * 0.3, { size: sz, weight: 800, font: 'mono', color: pct >= 40 ? dat.ink : tone(S, 'err').ink, align: 'right', base: 'middle' });
    d.rect(x, by, bw, 6 * u, { fill: p.surface2 });
    d.rect(x, by, bw * clamp(cd.frac), 6 * u, { fill: pct >= 40 ? dat.c : tone(S, 'err').c });
    d.line(x + bw * 0.4, by - 3 * u, x + bw * 0.4, by + 9 * u, p.ink, 1.5);
    y += rowH * 1.15;
    // veredicto
    if (S.on('try-chunk')) {
      const ok = cd.ok;
      const msg = ok ? S.l('Dato y condición juntos, con poco ruido.', 'Fact and condition together, with little noise.') : !cd.hasFact || !cd.hasCond ? S.l('Falta algo: la respuesta sale incompleta.', 'Something is missing: the answer comes out incomplete.') : S.l('Está todo, pero se diluye en ruido.', 'It is all there, but it drowns in noise.');
      const t = tone(S, ok ? 'dat' : 'err');
      const hh = S.d.wrap(msg, W, { size: sz, weight: 700 }).length * L;
      if (y + hh <= sideR.y + sideR.h + 2) S.d.text(msg, x, y + 2, { size: sz, weight: 700, color: t.ink, w: W, base: 'top' });
    }
  });
}
