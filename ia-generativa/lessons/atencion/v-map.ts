// Vista 4 (all … try-map): todos los tokens preguntan a la vez; sus filas forman el mapa de atención (autoatención).
// Pesos del ejemplo hecho a mano (data.ts: MAP_A). La escena recorre sola algunas filas; la persona puede elegir otra.
import { lerp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { A, MAP_A, type Lang } from './data';
import { stOf, swap } from './state';
import { area, attArc, chip, drawGrid, fr, fz, gridGeom, isShort, kk, label, layoutChips, pct, placeRow, q, type GridGeom } from './ui';

export interface MapGeo { R: Rect; G: GridGeom & { colLabels: boolean }; chips: Rect[]; size: number; chipSize: number; arcMax: number; pctY: number; side: Rect }
export function mapGeo(S: Frame): MapGeo {
  const R = area(S), P = S.portrait, sh = isShort(S), u = S.u, L = S.lang as Lang, T = A[L];
  const size = fz(S, sh ? 12 : 13), chipSize = fz(S, P ? 14 : sh ? 13 : 15);
  let gridR: Rect, side: Rect;
  const foot = (sh ? 0 : 2) * size * u * 1.45;   // dos renglones bajo el mapa: cómo se lee
  if (P) { const top = R.h * 0.3; side = { x: R.x, y: R.y, w: R.w, h: top }; gridR = { x: R.x, y: R.y + top + 4 * u, w: R.w, h: R.h - top - 4 * u - foot }; }
  else { const gw = Math.min(R.h * (sh ? 1 : 0.9), R.w * 0.46); gridR = { x: R.x, y: R.y, w: gw + 30 * u, h: R.h - foot }; side = { x: R.x + gridR.w + 20 * u, y: R.y, w: R.w - gridR.w - 20 * u, h: R.h }; }
  const G = gridGeom(S, gridR, T.tok, T.tok, size);
  const row = layoutChips(S, T.tok, side.w, chipSize);
  const yChips = P ? side.y + side.h * 0.42 : side.y + side.h * (sh ? 0.42 : 0.36);
  const chips = placeRow(row, side.x + side.w / 2, yChips);
  return { R, G, chips, size, chipSize: row.size, arcMax: (yChips - side.y) / u - 6, pctY: yChips + row.h + 5 * u, side };
}

export function drawMap(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = S.lang as Lang, T = A[L], M = mapGeo(S), st = stOf(S);
  const sg = tone(S, 'sig'), lt = tone(S, 'lat');
  // ── el mapa: las filas aparecen una por una (todos preguntan a la vez) ──
  const rowA = (i: number) => fr(S, 'all', 0.35 + i * 0.05, 0.45 + i * 0.05);
  const gA = fr(S, 'all', 0.05, 0.2);
  const k = swap(S, st.tokT0), hl = S.on('all') ? st.tok : 4;
  drawGrid(S, M.G, MAP_A, { a: gA, rows: T.tok, cols: T.tok, size: M.size, rowA, hlRow: hl, hlA: fr(S, 'all', 0.1, 0.25), colLabels: M.G.colLabels });
  // cómo se lee (debajo del mapa; en el teléfono horizontal, junto a la frase): filas, columnas, más lleno = más peso, y que es un ejemplo hecho a mano
  {
    const G = M.G, ls = fz(S, 12), sh = isShort(S);
    const aRead = fr(S, 'map', 0.2, 0.35), aL = fr(S, 'map', 0.6, 0.75), aTag = fr(S, 'all', 0.2, 0.35);
    const lx = sh ? M.side.x + M.side.w / 2 : G.x - G.lw + (G.lw + G.m * G.cs) / 2, ly = sh ? M.side.y + M.side.h - ls * u * 2.6 : G.y + G.n * G.cs + 4 * u;
    label(S, S.l('fila: quién mira · columna: a quién mira', 'row: who looks · column: whom it looks at'), lx, ly, { a: aRead, size: ls, weight: 700, color: lt.ink, base: 'top' });
    const cs = 11 * u, y2 = ly + ls * u * 1.4;
    const tPoco = S.l('poco', 'little'), tMucho = S.l('mucho', 'a lot'), tTag = S.l('ejemplo hecho a mano', 'handmade example');
    const wPoco = d.measure(tPoco, { size: ls, weight: 600 }), wMucho = d.measure(tMucho, { size: ls, weight: 600 }), wTag = d.measure(tTag, { size: ls, weight: 600, italic: true });
    const tot = wPoco + wMucho + 3 * (cs + 4 * u) + 12 * u + 16 * u + wTag;
    let x = lx - tot / 2;
    label(S, tPoco, x, y2 + cs / 2, { a: aL, size: ls, color: p.mute, align: 'left' });
    x += wPoco + 6 * u;
    [0.05, 0.25, 0.6].forEach((w) => { d.rect(x, y2, cs, cs, { fill: p.surface, stroke: p.line, lw: 1, a: aL }); const s2 = (cs - 2) * Math.sqrt(w); d.rect(x + (cs - s2) / 2, y2 + (cs - s2) / 2, s2, s2, { fill: sg.c, a: aL }); x += cs + 4 * u; });
    label(S, tMucho, x + 2 * u, y2 + cs / 2, { a: aL, size: ls, color: p.mute, align: 'left' });
    x += wMucho + 18 * u;
    label(S, tTag, x, y2 + cs / 2, { a: aTag, size: ls, color: p.mute, align: 'left', italic: true });
  }
  // autoatención: cada fila suma 100 %
  const aSelf = fr(S, 'self', 0.35, 0.5);
  if (aSelf > 0.01) {
    const G = M.G;
    d.rect(G.x - 3, G.y - 3, G.m * G.cs + 6, G.n * G.cs + 6, { stroke: lt.c, lw: 2, r: 4, a: aSelf });
    for (let i = 0; i < G.n; i++) label(S, '100', G.x + G.m * G.cs + 5 * u, G.y + (i + 0.5) * G.cs, { a: fr(S, 'self', 0.55 + i * 0.03, 0.65 + i * 0.03), size: fz(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'left' });
  }

  // ── la frase, con los arcos del token elegido ──
  const aC = fr(S, 'all', 0.02, 0.15);
  const ask = (i: number) => (S.on('all') && !S.on('map') ? Math.max(0, Math.sin(Math.PI * fr(S, 'all', 0.35 + i * 0.05, 0.55 + i * 0.05, 'lin'))) : 0);
  T.tok.forEach((w, i) => chip(S, M.chips[i], w, { a: aC, size: M.chipSize, tone: i === hl ? 'lat' : 'sig', strong: i === hl ? 1 : ask(i) }));
  const drawRow = (r: number, a: number) => {
    if (a < 0.01) return;
    MAP_A[r].forEach((w, j) => attArc(S, M.chips[r], M.chips[j], w, { a, hMax: M.arcMax, head: w > 0.05 }));
    // porcentajes bajo las fichas (de mayor a menor peso; se omite el que no cabe sin pisar a otro)
    const placed: [number, number][] = [];
    MAP_A[r].map((w, j) => [w, j]).sort((x, y) => y[0] - x[0]).forEach(([w, j]) => {
      if (w < 0.05) return;
      const t = pct(S, w), tw = d.measure(t, { size: fz(S, 12), weight: 800, font: 'mono' }), cx = M.chips[j].x + M.chips[j].w / 2;
      if (placed.some(([x0, x1]) => cx - tw / 2 - 4 * u < x1 && cx + tw / 2 + 4 * u > x0)) return;
      placed.push([cx - tw / 2, cx + tw / 2]);
      label(S, t, cx, M.pctY, { a, size: fz(S, 12), weight: 800, font: 'mono', color: sg.ink, base: 'top' });
    });
  };
  const aArcs = aC * (S.on('all') ? 1 : 0);
  if (k < 1) drawRow(st.tokPrev, aArcs * (1 - k));
  drawRow(hl, aArcs * k);
  // título del token elegido
  const tA = aC;
  const ty = M.side.y + (S.portrait ? 2 * u : M.side.h * 0.08);
  label(S, S.l(`fila de ${q(S, T.tok[hl])}: a quién mira`, `row of ${q(S, T.tok[hl])}: whom it looks at`), M.side.x + M.side.w / 2, ty, { a: tA, size: fz(S, 13), weight: 800, color: lt.ink, base: 'top' });
  if (aSelf > 0.01) {
    const yy = S.portrait ? M.pctY + 22 * u : Math.min(M.side.y + M.side.h - 40 * u, M.pctY + 46 * kk(S));
    label(S, S.l('autoatención', 'self-attention'), M.side.x + M.side.w / 2, yy, { a: aSelf, size: fz(S, 16), weight: 800, color: lt.ink });
    label(S, S.l('la frase se mira a sí misma', 'the sentence looks at itself'), M.side.x + M.side.w / 2, yy + fz(S, 16) * u * 1.2, { a: aSelf, size: fz(S, 12), color: p.mute });
  }
  void lerp;
}
