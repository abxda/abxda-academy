// Vista 9: el cuadro de probabilidad por impacto (two-q … residual).
// Riesgo = probabilidad × impacto, cada uno de 1 a 3 (definición del NIST AI RMF 1.0: «medida compuesta de la
// probabilidad de un evento y de la magnitud de sus consecuencias»). Zonas: bajo 1–2, medio 3–4, alto 6–9.
// Los cinco casos de la tienda, dónde caen y sus controles son ILUSTRATIVOS (juicios rotulados como tales); las cuentas
// coinciden con el código de «por dentro».
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { L10n } from '../../../../../core/types';
import { FS, area, card, chip, chipH, fitText, fr, glyph, header, lerp2, para, paraH, smooth, tight, win } from './ui';

export interface Case { id: string; short: L10n; name: L10n; p: number; i: number; p2: number; i2: number; off: [number, number]; off2: [number, number] }
export const CASES: Case[] = [
  { id: 'ideas', short: { es: 'Ideas para redes', en: 'Social media ideas' }, name: { es: 'Pedir ideas para redes sociales', en: 'Asking for social media ideas' }, p: 2, i: 1, p2: 1, i2: 1, off: [0, 0], off2: [-0.2, 0.14] },
  { id: 'traducir', short: { es: 'Traducir el manual', en: 'Translating the manual' }, name: { es: 'Traducir el manual de la bici', en: 'Translating the bike manual' }, p: 1, i: 1, p2: 1, i2: 1, off: [0.18, -0.14], off2: [0.18, -0.14] },
  { id: 'garantia', short: { es: 'Dudas de garantía', en: 'Warranty questions' }, name: { es: 'Responder dudas de garantía', en: 'Answering warranty questions' }, p: 2, i: 2, p2: 1, i2: 2, off: [0, 0], off2: [0, 0] },
  { id: 'correos', short: { es: 'Correos que envía solo', en: 'Emails it sends alone' }, name: { es: 'Leer correos de extraños y enviar por su cuenta', en: 'Reading strangers’ emails and sending on its own' }, p: 2, i: 3, p2: 2, i2: 2, off: [0, 0], off2: [0, 0] },
  { id: 'curriculos', short: { es: 'Filtrar currículos', en: 'Screening résumés' }, name: { es: 'Filtrar currículos de mecánicos', en: 'Screening mechanic résumés' }, p: 3, i: 3, p2: 2, i2: 3, off: [0, 0], off2: [0, 0] },
];
type Zone = 'low' | 'mid' | 'high';
const zoneOf = (r: number): Zone => (r <= 2 ? 'low' : r <= 4 ? 'mid' : 'high');
const ZT: Record<Zone, Tone> = { low: 'dat', mid: 'w', high: 'err' };
const ZL: Record<Zone, L10n> = { low: { es: 'bajo', en: 'low' }, mid: { es: 'medio', en: 'medium' }, high: { es: 'alto', en: 'high' } };
const PL: L10n[] = [{ es: 'rara vez', en: 'rarely' }, { es: 'a veces', en: 'sometimes' }, { es: 'seguido', en: 'often' }];
const IL: L10n[] = [{ es: 'molestia', en: 'nuisance' }, { es: 'cuesta', en: 'costly' }, { es: 'grave', en: 'severe' }];
const CTRL: Record<Zone, L10n[]> = {
  low: [{ es: 'política de uso', en: 'usage policy' }, { es: 'alguien lee antes de publicar', en: 'someone reads before publishing' }],
  mid: [{ es: 'pruebas con casos propios (lección 34)', en: 'tests with your own cases (lesson 34)' }, { es: 'respuestas con fuente', en: 'answers with sources' }, { es: 'revisar una muestra cada semana', en: 'check a sample every week' }],
  high: [{ es: 'aprobación humana antes de actuar', en: 'human approval before acting' }, { es: 'permisos mínimos', en: 'minimal permissions' }, { es: 'medir el error por grupo', en: 'measure the error by group' }, { es: 'si nada lo baja, no se usa', en: 'if nothing lowers it, don’t use it' }],
};

/** Caso que la escena muestra en cada momento de la demostración. */
export function demoCase(S: Frame): string {
  if (S.on('residual')) return 'correos';
  if (S.on('try-matrix')) return 'curriculos';
  if (S.on('controls-high')) return fr(S, 'controls-high', 0.3, 0.31) > 0 ? 'curriculos' : 'correos';
  if (S.on('controls-mid')) return 'garantia';
  if (S.on('controls-low')) return fr(S, 'controls-low', 0.42, 0.43) > 0 ? 'traducir' : 'ideas';
  if (S.on('place-2')) return 'correos';
  return 'garantia';
}
const caseNow = (S: Frame) => CASES.find((c) => c.id === (S.on('place-1') ? (S.p.caso ?? demoCase(S)) : 'garantia')) ?? CASES[2];

interface Lay { grid: Rect; cell: number; panel: Rect; yl: number; small: boolean }
function lay(S: Frame): Lay {
  const u = S.u, A = area(S), hh = FS(S, 13) * u + (tight(S) ? 8 : 14) * u;
  const B = { x: A.x, y: A.y + hh, w: A.w, h: A.h - hh };
  const yl = Math.max(...IL.map((l) => S.d.measure(S.L(l), { size: FS(S, 13), weight: 700 }))) + 12 * u;
  const xlH = FS(S, 13) * u + 8 * u + FS(S, 13) * u + 10 * u + (tight(S) ? 16 : 0), topPad = FS(S, 13) * u + 10 * u;
  if (S.portrait) {
    const g = Math.min(B.w - yl, B.h * (tight(S) ? 0.56 : 0.62) - xlH - topPad);
    const grid = { x: B.x + yl + (B.w - yl - g) / 2, y: B.y + topPad, w: g, h: g };
    const py = grid.y + g + xlH + 4 * u;
    return { grid, cell: g / 3, panel: { x: B.x, y: py, w: B.w, h: B.y + B.h - py }, yl, small: g / 3 < 54 * u };
  }
  const g = Math.min(B.h - xlH - topPad, B.w * 0.5);
  const grid = { x: B.x + yl, y: B.y + topPad, w: g, h: g };
  const px = grid.x + g + (tight(S) ? 16 : 30) * u;
  return { grid, cell: g / 3, panel: { x: px, y: B.y, w: B.x + B.w - px, h: B.h }, yl, small: g / 3 < 54 * u };
}
/** ¿Caben los tres rótulos de probabilidad en un renglón, cada uno bajo su columna? */
const xOneLine = (S: Frame, L: Lay) => PL.every((l, k) => S.d.measure(S.L(l), { size: 12.2 / S.u, weight: 700 }) <= L.cell * (k === 1 ? 1.3 : 0.95));
/** Centro (px) de la posición (p, i) del cuadro, con desplazamiento dentro de la celda. */
function at(L: Lay, p: number, i: number, off: [number, number] = [0, 0]): [number, number] {
  // un poco por debajo (y, en celdas chicas, a la derecha) del centro: arriba a la izquierda va el rótulo de la zona
  const dx = L.small ? 0.1 : 0, dy = L.small ? 0.61 : 0.58;
  return [L.grid.x + (p - 0.5 + dx + off[0] * (L.small ? 0.8 : 1)) * L.cell, L.grid.y + L.grid.h - (i - dy + off[1] * (L.small ? 0.8 : 1)) * L.cell];
}

export function drawMatrix(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = lay(S), G = L.grid;
  header(S, 0, S.l('Ordenar los riesgos', 'Ranking the risks'), fr(S, 'two-q', 0, 0.12));
  // ── las dos preguntas ──
  const qa = win(S, 'two-q', 'axis-x');
  if (qa > 0.01) {
    const q1 = S.l('¿Qué tan probable es que pase?', 'How likely is it to happen?'), q2 = S.l('Si pasa, ¿qué tan grave es?', 'If it happens, how bad is it?');
    const A0 = area(S), cx = A0.x + A0.w / 2, cy = G.y + G.h / 2, mw = Math.min(A0.w, 440 * u);
    chip(S, q1, cx, cy - chipH(S, 15) * 0.8, 'sig', { size: 15, a: qa * fr(S, 'two-q', 0.42, 0.54), maxW: mw });
    chip(S, q2, cx, cy + chipH(S, 15) * 0.8, 'err', { size: 15, a: qa * fr(S, 'two-q', 0.62, 0.74), maxW: mw });
  }
  // ── ejes ──
  const xa = fr(S, 'axis-x', 0.08, 0.2), ya = fr(S, 'axis-y', 0.08, 0.2);
  d.withAlpha(xa, () => {
    d.line(G.x, G.y + G.h, G.x + G.w, G.y + G.h, p.ink, 1.8);
    d.arrow(G.x + G.w - 1, G.y + G.h, G.x + G.w + 10 * u, G.y + G.h, p.ink, 1.8, 7);
  });
  // rótulos de probabilidad: en una línea si caben; si no, el de en medio baja un renglón (escalonados, sin encimarse)
  const oneLine = xOneLine(S, L);
  PL.forEach((l, k) => d.withAlpha(fr(S, 'axis-x', 0.3 + k * 0.16, 0.4 + k * 0.16), () => {
    const yy = G.y + G.h + 6 * u + (!oneLine && k === 1 ? 12.2 * 1.25 : 0);
    fitText(S, S.L(l), G.x + (k + 0.5) * L.cell, yy, oneLine ? L.cell * (k === 1 ? 1.3 : 0.9) : L.cell * 1.9, 13, { weight: 700, color: p.ink, align: 'center', base: 'top' });
  }));
  d.withAlpha(fr(S, 'axis-x', 0.12, 0.24), () => fitText(S, S.l('probabilidad →', 'likelihood →'), G.x + G.w / 2, G.y + G.h + 6 * u + (oneLine ? FS(S, 13) * u : 12.2 * 2.3) + 6 * u, G.w, 13, { weight: 800, color: tone(S, 'sig').ink, align: 'center', base: 'top' }));
  d.withAlpha(ya, () => {
    d.line(G.x, G.y + G.h, G.x, G.y, p.ink, 1.8);
    d.arrow(G.x, G.y + 1, G.x, G.y - 10 * u, p.ink, 1.8, 7);
  });
  IL.forEach((l, k) => d.withAlpha(fr(S, 'axis-y', 0.3 + k * 0.16, 0.4 + k * 0.16), () => fitText(S, S.L(l), G.x - 8 * u, G.y + G.h - (k + 0.5) * L.cell, L.yl - 12 * u, 13, { weight: 700, color: p.ink, align: 'right', base: 'middle' })));
  d.withAlpha(fr(S, 'axis-y', 0.12, 0.24), () => fitText(S, S.l('↑ impacto', '↑ impact'), G.x - L.yl, G.y - 12 * u, L.yl + G.w * 0.6, 13, { weight: 800, color: tone(S, 'err').ink, base: 'bottom' }));
  // ── zonas ──
  for (let pi = 1; pi <= 3; pi++) for (let ii = 1; ii <= 3; ii++) {
    const z = zoneOf(pi * ii), f = z === 'low' ? 0.3 : z === 'mid' ? 0.46 : 0.62, za = fr(S, 'risk-def', f, f + 0.1);
    const x = G.x + (pi - 1) * L.cell, y = G.y + G.h - ii * L.cell, t = tone(S, ZT[z]);
    const cur = caseNow(S), resid = residualK(S), cp = Math.round(lerp2(cur.p, cur.p2, resid)), ci = Math.round(lerp2(cur.i, cur.i2, resid));
    const sel = S.on('place-1') && placedK(S, cur) > 0.98 && cp === pi && ci === ii ? 1 : 0;
    d.withAlpha(za, () => {
      d.rect(x + 1.5, y + 1.5, L.cell - 3, L.cell - 3, { fill: alpha(t.c, z === 'low' ? 0.1 : z === 'mid' ? 0.14 : 0.18), stroke: sel ? t.c : alpha(t.c, 0.35), lw: sel ? 2.6 : 1 });
      // si la celda es chica, la inicial de la zona (la leyenda la explica)
      const full = S.L(ZL[z]), fitsFull = (['low', 'mid', 'high'] as Zone[]).every((zz) => S.d.measure(S.L(ZL[zz]), { size: 12.2 / u, weight: 800 }) <= L.cell - 9 * u);
      fitText(S, fitsFull ? full : full[0].toUpperCase(), x + 5 * u, y + 4 * u, L.cell - 9 * u, 12, { weight: 800, color: t.ink, base: 'top', a: 0.9 });
    });
  }
  // ── los casos ──
  const cur = caseNow(S);
  CASES.forEach((c, n) => {
    const k = placedK(S, c);
    if (k <= 0.001) return;
    const resid = residualK(S);
    const pos0 = pathPos(S, L, c), pos1 = at(L, c.p2, c.i2, c.off2);
    const [x, y] = resid > 0 ? [lerp2(pos0[0], pos1[0], resid), lerp2(pos0[1], pos1[1], resid)] : pos0;
    const isSel = S.on('place-1') && c.id === cur.id, r = Math.max(9 * u, Math.min(L.cell * 0.13, 14 * u)), t = tone(S, 'ink');
    // fantasma de la posición original durante el riesgo residual
    if (resid > 0.02 && (c.p !== c.p2 || c.i !== c.i2)) {
      const o = at(L, c.p, c.i, c.off);
      d.circle(o[0], o[1], r, { stroke: alpha(p.ink, 0.45), lw: 1.2, dash: [3, 3] });
      d.line(o[0], o[1], x, y, alpha(p.ink, 0.45), 1.2, [3, 3]);
    }
    d.withAlpha(clamp(k * 4), () => {
      d.circle(x, y, r + (isSel ? 3 * u : 0), { fill: isSel ? p.ink : S.pal.surface, stroke: p.ink, lw: isSel ? 2.4 : 1.6 });
      d.text(String(n + 1), x, y + 0.5, { size: FS(S, 12.5), weight: 800, color: isSel ? S.pal.stage : t.ink, align: 'center', base: 'middle' });
    });
  });
  drawPanel(S, L, cur);
}

/** 0..1: cuánto se ha colocado el caso c (los dos de la demostración viajan; los demás aparecen en su sitio). */
function placedK(S: Frame, c: Case): number {
  if (c.id === 'garantia') return S.on('place-1') ? fr(S, 'place-1', 0.06, 0.78, 'lin') : 0;
  if (c.id === 'correos') return S.on('place-2') ? fr(S, 'place-2', 0.06, 0.74, 'lin') : 0;
  if (c.id === 'ideas') return fr(S, 'controls-low', 0.22, 0.3) ? fr(S, 'controls-low', 0.22, 0.3) : 0;
  if (c.id === 'traducir') return fr(S, 'controls-low', 0.42, 0.5);
  return fr(S, 'controls-high', 0.3, 0.38);
}
/** Posición mientras se coloca: primero a lo ancho (probabilidad), luego hacia arriba (impacto). */
function pathPos(S: Frame, L: Lay, c: Case): [number, number] {
  const end = at(L, c.p, c.i, c.off);
  if (c.id !== 'garantia' && c.id !== 'correos') return end;
  const k = placedK(S, c), start = at(L, 0.6, 0.6);
  // tramo 1 (0.15–0.5): a lo ancho; tramo 2 (0.6–0.95): hacia arriba
  const kx = smooth((k - 0.15) / 0.35), ky = smooth((k - 0.6) / 0.35);
  return [lerp2(start[0], end[0], kx), lerp2(start[1], end[1], ky)];
}
const residualK = (S: Frame) => smooth(fr(S, 'residual', 0.14, 0.52, 'lin'));

function drawPanel(S: Frame, L: Lay, c: Case) {
  const { d, pal: p } = S, u = S.u, P = L.panel, sz = FS(S, tight(S) ? 13 : 14), gap = (tight(S) ? 5 : 8) * u;
  // antes de los casos: la fórmula y las zonas
  const fa = win(S, 'risk-def', 'place-1');
  if (fa > 0.01) {
    d.withAlpha(fa * fr(S, 'risk-def', 0.06, 0.18), () => {
      const f = S.l('riesgo = probabilidad × impacto', 'risk = likelihood × impact');
      card(S, { x: P.x, y: P.y, w: P.w, h: chipH(S, 15) + 12 * u }, { tone: 'ink', hot: 0.02 });
      fitText(S, f, P.x + 10 * u, P.y + (chipH(S, 15) + 12 * u) / 2, P.w - 20 * u, 15, { weight: 800, color: p.ink, base: 'middle' });
    });
    let y = P.y + chipH(S, 15) + 12 * u + gap * 1.5;
    (['low', 'mid', 'high'] as Zone[]).forEach((z, k) => {
      const lab = z === 'low' ? S.l('bajo (B): 1 o 2', 'low (L): 1 or 2') : z === 'mid' ? S.l('medio (M): 3 o 4', 'medium (M): 3 or 4') : S.l('alto (A): 6 o 9', 'high (H): 6 or 9');
      chip(S, lab, P.x, y + chipH(S, 13) / 2, ZT[z], { size: 13, align: 'left', a: fa * fr(S, 'risk-def', 0.3 + k * 0.16, 0.4 + k * 0.16), maxW: P.w });
      y += chipH(S, 13) + gap;
    });
    return;
  }
  const ca = win(S, 'place-1', 'gov-def');
  if (ca <= 0.01) return;
  const resid = S.on('residual');
  const k = placedK(S, c), rp = resid ? c.p2 : c.p, ri = resid ? c.i2 : c.i, r = rp * ri, z = zoneOf(r);
  // fundido al cambiar de caso (la persona o la demostración)
  const t0 = S.st.rg?.casoAt as number | undefined, fade = t0 === undefined ? 1 : clamp((S.clock - t0) / 0.25);
  d.withAlpha(ca * fade, () => {
    let y = P.y;
    const n = CASES.indexOf(c) + 1, compact = S.portrait || tight(S);
    const title = `${n} · ${S.L(compact ? c.short : c.name)}`;
    const th = paraH(S, title, P.w, FS(S, 14.5), { weight: 800, maxLines: compact ? 1 : 2 });
    para(S, title, P.x, y, P.w, FS(S, 14.5), { weight: 800, color: p.ink, maxLines: compact ? 1 : 2 });
    y += th + gap * (compact ? 0.4 : 1);
    // probabilidad e impacto (se escriben a medida que el punto llega); en teléfono, en un solo renglón
    const showP = c.id === 'garantia' || c.id === 'correos' ? clamp((k - 0.4) * 5) : 1, showI = c.id === 'garantia' || c.id === 'correos' ? clamp((k - 0.85) * 6) : 1;
    const lp = S.l(`probabilidad: ${S.L(PL[rp - 1])} (${rp})`, `likelihood: ${S.L(PL[rp - 1])} (${rp})`), li = S.l(`impacto: ${S.L(IL[ri - 1])} (${ri})`, `impact: ${S.L(IL[ri - 1])} (${ri})`);
    if (compact) {
      const wp = S.d.measure(lp + ' · ', { size: FS(S, 13), weight: 650 });
      fitText(S, lp + ' ·', P.x, y, P.w, 13, { weight: 650, color: tone(S, 'sig').ink, base: 'top', a: showP });
      fitText(S, li, P.x + wp, y, P.w - wp, 13, { weight: 650, color: tone(S, 'err').ink, base: 'top', a: showI });
      y += FS(S, 13) * u * 1.3 + gap * 0.3;
    } else {
      fitText(S, lp, P.x, y, P.w, 13.5, { weight: 650, color: tone(S, 'sig').ink, base: 'top', a: showP });
      y += FS(S, 13.5) * u * 1.3;
      fitText(S, li, P.x, y, P.w, 13.5, { weight: 650, color: tone(S, 'err').ink, base: 'top', a: showI });
      y += FS(S, 13.5) * u * 1.3 + gap * 0.5;
    }
    const ra = c.id === 'garantia' || c.id === 'correos' ? clamp((k - 0.95) * 20) : 1;
    const rl = S.l(`riesgo ${rp} × ${ri} = ${r}: ${S.L(ZL[z])}`, `risk ${rp} × ${ri} = ${r}: ${S.L(ZL[z])}`);
    chip(S, (resid ? S.l('con controles: ', 'with controls: ') : '') + rl, P.x, y + chipH(S, 13.5) / 2, ZT[z], { size: 13.5, align: 'left', a: ra, maxW: P.w, solid: true });
    y += chipH(S, 13.5) + gap * (compact ? 0.8 : 1.4);
    // controles de la zona (en la demostración aparecen con la voz; después, de inmediato)
    if (S.on('controls-low')) {
      const cz = resid ? zoneOf(c.p * c.i) : z;
      const items = CTRL[cz];
      fitText(S, S.l('controles', 'controls'), P.x, y, P.w, 13, { weight: 800, color: p.mute, base: 'top', a: ctrlA(S, cz, -1) });
      y += FS(S, 13) * u * 1.3;
      items.forEach((it, j) => {
        const t = S.L(it), h = paraH(S, t, P.w - 22 * u, sz, { weight: 650 });
        if (y + h > P.y + P.h + 2) return;
        const a = ctrlA(S, cz, j);
        glyph(S, j === 3 ? 'cross' : 'check', P.x + 7 * u, y + sz * u * 0.62, 13 * u, tone(S, j === 3 ? 'err' : 'dat').ink, a);
        d.withAlpha(a, () => para(S, t, P.x + 22 * u, y, P.w - 22 * u, sz, { weight: 650, color: p.ink }));
        y += h + gap * 0.6;
      });
    }
  });
}
/** Opacidad del control j de la zona z: durante la demostración, con la voz; después, todos. */
function ctrlA(S: Frame, z: Zone, j: number): number {
  const seg = z === 'low' ? 'controls-low' : z === 'mid' ? 'controls-mid' : 'controls-high';
  if (S.on('try-matrix')) return 1;
  if (!S.on(seg)) return S.on('controls-low') ? 1 : 0;
  const base = z === 'low' ? 0.56 : z === 'mid' ? 0.3 : 0.5;
  return j < 0 ? fr(S, seg, base - 0.06, base + 0.04) : fr(S, seg, base + j * 0.1, base + 0.1 + j * 0.1);
}

export function matrixSource(S: Frame): string {
  if (S.on('place-1')) return S.l('Casos, posiciones y controles ilustrativos', 'Illustrative cases, positions, and controls');
  if (S.on('risk-def')) return S.l('NIST AI RMF 1.0 (enero de 2023): riesgo = probabilidad y magnitud de las consecuencias', 'NIST AI RMF 1.0 (January 2023): risk = probability and magnitude of consequences');
  return '';
}
