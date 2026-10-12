// Vista 3: el cuadro de dos por dos (axis-x … try-matrix). Eje horizontal: valor en juego (frecuencia × minutos de cada
// vez); eje vertical: riesgo (probabilidad × impacto, lección 35). Cuatro zonas: empieza aquí (mucho valor, poco riesgo),
// después con controles (mucho valor, riesgo alto), basta la política (poco y poco) y no se hace (poco valor, riesgo alto).
// ILUSTRATIVO (rotulado): los cinco casos y dónde caen. Las posiciones son ordinales (no a escala): «por dentro» lo dice.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import type { L10n } from '../../../../../core/types';
import { CASES, caseById, hoursOf, type UseCase } from './model';
import { RISK_TONE, riskLabel } from './v-intro';
import { FS, areaH, card, chip, chipH, fitText, fr, glyph, header, lerp2, para, paraH, smooth, tight, win, type GlyphKind } from './ui';

export const CASE_IDS = CASES.map((c) => c.id);
type Zone = 'start' | 'later' | 'free' | 'drop';
const ZONE: Record<Zone, { t: L10n; s: L10n; act: L10n; tone: Tone; g: GlyphKind; seg: string }> = {
  start: { t: { es: 'Empieza aquí', en: 'Start here' }, s: { es: 'Empieza aquí', en: 'Start here' }, act: { es: 'Primer proyecto: un piloto, con respuestas con fuente y revisión.', en: 'First project: a pilot, with sourced answers and review.' }, tone: 'dat', g: 'check', seg: 'q-start' },
  later: { t: { es: 'Después, con controles', en: 'Later, with controls' }, s: { es: 'Después', en: 'Later' }, act: { es: 'Más adelante: con revisión humana, permisos mínimos y experiencia.', en: 'Further on: with human review, minimal permissions, and experience.' }, tone: 'w', g: 'lock', seg: 'q-later' },
  free: { t: { es: 'Basta la política', en: 'The policy is enough' }, s: { es: 'Solo política', en: 'Policy only' }, act: { es: 'Sin proyecto: herramientas aprobadas y la política de uso.', en: 'No project: approved tools and the usage policy.' }, tone: 'lat', g: 'doc', seg: 'q-free' },
  drop: { t: { es: 'No se hace', en: 'Don’t do it' }, s: { es: 'No se hace', en: 'Skip it' }, act: { es: 'No se hace: el riesgo no compensa el poco valor.', en: 'Not done: the risk outweighs the little value.' }, tone: 'err', g: 'cross', seg: 'q-drop' },
};
const zoneOf = (x: number, y: number): Zone => (x >= 0.5 ? (y < 0.5 ? 'start' : 'later') : y < 0.5 ? 'free' : 'drop');

/** Caso que la escena muestra en cada momento de la demostración. */
export function demoCase(S: Frame): string {
  if (S.on('q-drop')) return fr(S, 'q-drop', 0.26, 0.27) > 0 ? 'curriculos' : 'redes';
  if (S.on('q-free')) return fr(S, 'q-free', 0.8, 0.81) > 0 ? 'redes' : fr(S, 'q-free', 0.68, 0.69) > 0 ? 'catalogo' : 'diagnostico';
  if (S.on('q-later')) return fr(S, 'q-later', 0.66, 0.67) > 0 ? 'diagnostico' : 'garantia';
  return 'garantia';
}
/** 0..1: cuánto ha aparecido el punto de cada caso. */
function placed(S: Frame, c: UseCase): number {
  const f: Record<string, [string, number]> = { garantia: ['q-start', 0.4], diagnostico: ['q-later', 0.66], catalogo: ['q-free', 0.68], redes: ['q-free', 0.8], curriculos: ['q-drop', 0.26] };
  return fr(S, f[c.id][0], f[c.id][1], f[c.id][1] + 0.08);
}
/** La duda de garantía baja con los controles de la lección 35. */
const movedK = (S: Frame) => smooth(fr(S, 'q-start', 0.64, 0.86, 'lin'));
const yOf = (S: Frame, c: UseCase) => (c.y2 === undefined ? c.y : lerp2(c.y, c.y2, movedK(S)));
const caseNow = (S: Frame) => caseById(S.on('q-start') ? (S.p.caso ?? demoCase(S)) : 'garantia');

interface Lay { grid: Rect; g: number; panel: Rect; yl: number }
function lay(S: Frame): Lay {
  const u = S.u, B = areaH(S);
  const yl = Math.max(...[S.l('alto', 'high'), S.l('bajo', 'low')].map((t) => S.d.measure(t, { size: FS(S, 13), weight: 700 }))) + 14 * u;
  const one = tight(S) && !S.portrait, xlH = FS(S, 13) * u * (one ? 1.3 : 2.5) + 10 * u, topPad = FS(S, 13) * u + 12 * u;
  if (S.portrait) {
    const g = Math.min(B.w - yl - 6 * u, B.h * (tight(S) ? 0.62 : 0.66) - xlH - topPad);
    const grid = { x: B.x + yl + (B.w - yl - g) / 2, y: B.y + topPad, w: g, h: g };
    const py = grid.y + g + xlH + 4 * u;
    return { grid, g, panel: { x: B.x, y: py, w: B.w, h: B.y + B.h - py }, yl };
  }
  const g = Math.min(B.h - xlH - topPad, B.w * 0.5);
  const grid = { x: B.x + yl, y: B.y + topPad, w: g, h: g };
  const px = grid.x + g + (tight(S) ? 18 : 34) * u;
  return { grid, g, panel: { x: px, y: B.y, w: B.x + B.w - px, h: B.h }, yl };
}
const pt = (L: Lay, x: number, y: number): [number, number] => [L.grid.x + x * L.g, L.grid.y + (1 - y) * L.g];

export function drawMatrix(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = lay(S), G = L.grid;
  header(S, 1, undefined, fr(S, 'axis-x', 0, 0.1));
  // ── ejes ──
  const xa = fr(S, 'axis-x', 0.1, 0.24), ya = fr(S, 'axis-y', 0.06, 0.2);
  d.withAlpha(xa, () => {
    d.line(G.x, G.y + G.h, G.x + G.w, G.y + G.h, p.ink, 1.8);
    d.arrow(G.x + G.w - 1, G.y + G.h, G.x + G.w + 10 * u, G.y + G.h, p.ink, 1.8, 7);
  });
  const ly = G.y + G.h + 6 * u;
  fitText(S, S.l('poco', 'little'), G.x, ly, G.w * (tight(S) && !S.portrait ? 0.24 : 0.45), 13, { weight: 700, color: p.ink, base: 'top', a: fr(S, 'axis-x', 0.62, 0.72) });
  fitText(S, S.l('mucho', 'a lot'), G.x + G.w, ly, G.w * (tight(S) && !S.portrait ? 0.24 : 0.45), 13, { weight: 700, color: p.ink, base: 'top', align: 'right', a: fr(S, 'axis-x', 0.78, 0.88) });
  // en teléfono horizontal, el nombre del eje va en el mismo renglón que «poco» y «mucho»
  const oneLine = tight(S) && !S.portrait;
  fitText(S, S.l('valor en juego →', 'value at stake →'), G.x + G.w / 2, ly + (oneLine ? 0 : FS(S, 13) * u * 1.25), oneLine ? G.w * 0.5 : G.w, 13, { weight: 800, color: tone(S, 'dat').ink, base: 'top', align: 'center', a: fr(S, 'axis-x', 0.28, 0.4) });
  d.withAlpha(ya, () => {
    d.line(G.x, G.y + G.h, G.x, G.y, p.ink, 1.8);
    d.arrow(G.x, G.y + 1, G.x, G.y - 10 * u, p.ink, 1.8, 7);
  });
  fitText(S, S.l('bajo', 'low'), G.x - 7 * u, G.y + G.h - 2 * u, L.yl - 10 * u, 13, { weight: 700, color: p.ink, base: 'bottom', align: 'right', a: fr(S, 'axis-y', 0.3, 0.4) });
  fitText(S, S.l('alto', 'high'), G.x - 7 * u, G.y + 2 * u, L.yl - 10 * u, 13, { weight: 700, color: p.ink, base: 'top', align: 'right', a: fr(S, 'axis-y', 0.42, 0.52) });
  fitText(S, S.l('↑ riesgo', '↑ risk'), G.x - L.yl * 0.6, G.y - 12 * u, L.yl + G.w * 0.5, 13, { weight: 800, color: tone(S, 'err').ink, base: 'bottom', a: fr(S, 'axis-y', 0.12, 0.24) });
  // ── las líneas del centro y las cuatro zonas ──
  const ca = fr(S, 'axis-y', 0.58, 0.72);
  d.withAlpha(ca, () => {
    d.line(G.x + G.w / 2, G.y, G.x + G.w / 2, G.y + G.h, alpha(p.ink, 0.55), 1.4, [5, 4]);
    d.line(G.x, G.y + G.h / 2, G.x + G.w, G.y + G.h / 2, alpha(p.ink, 0.55), 1.4, [5, 4]);
  });
  const cur = caseNow(S), sel = S.on('q-start') ? cur.id : '';
  (['drop', 'later', 'free', 'start'] as Zone[]).forEach((z) => {
    const Z = ZONE[z], za = fr(S, Z.seg, 0.04, 0.16);
    if (za <= 0.003) return;
    const right = z === 'start' || z === 'later', top = z === 'drop' || z === 'later';
    const r: Rect = { x: G.x + (right ? G.w / 2 : 0), y: G.y + (top ? 0 : G.h / 2), w: G.w / 2, h: G.h / 2 };
    const t = tone(S, Z.tone), selZ = sel && zoneOf(cur.x, yOf(S, cur)) === z && (cur.id !== 'garantia' || movedK(S) > 0.98) ? 1 : 0;
    d.withAlpha(za, () => {
      d.rect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, { fill: alpha(t.c, 0.12 + 0.08 * selZ), stroke: selZ ? t.c : undefined, lw: 2.2 });
      // rótulo de la zona: arriba en las de arriba, abajo en las de abajo (los puntos quedan en medio)
      const pad = 6 * u, gs = 13 * u, tw = r.w - 2 * pad - gs - 5 * u, size = FS(S, 12.5);
      // el rótulo completo si cabe en dos renglones; si no, el corto
      const full = S.d.wrap(S.L(Z.t), tw, { size, weight: 800 });
      // si ni el corto cabe (cuadro diminuto), solo el pictograma: el nombre de la zona va en el panel
      // en cuadros chicos: el rótulo corto, y si ni así cabe junto al pictograma, el rótulo corto sin pictograma
      const mw = (t2: string) => S.d.measure(t2, { size, weight: 800 });
      const fullOk = full.length <= 2 && full.every((l) => mw(l) <= tw) && r.h > 120 * u;
      const noGlyph = !fullOk && mw(S.L(Z.s)) > tw && mw(S.L(Z.s)) <= r.w - 2 * pad;
      const ls = fullOk ? full : mw(S.L(Z.s)) <= tw || noGlyph ? [S.L(Z.s)] : [], lh = size * u * 1.15;
      const by = top ? r.y + pad : r.y + r.h - pad - Math.max(1, ls.length) * lh;
      if (!noGlyph) glyph(S, Z.g, r.x + pad + gs / 2, by + lh / 2, gs, t.ink);
      const tx0 = noGlyph ? r.x + pad : r.x + pad + gs + 5 * u;
      ls.forEach((ln, k) => fitText(S, ln, tx0, by + k * lh, noGlyph ? r.w - 2 * pad : tw, 12.5, { weight: 800, color: t.ink, base: 'top' }));
    });
  });
  // ── los casos ──
  const rad = Math.max(10 * u, Math.min(L.g * 0.045, 14 * u));
  CASES.forEach((c, n) => {
    const k = placed(S, c);
    if (k <= 0.003) return;
    const y = yOf(S, c), [px, py] = pt(L, c.x, y), on = c.id === sel;
    // la duda de garantía: su lugar antes de los controles queda punteado
    if (c.y2 !== undefined && movedK(S) > 0.02) {
      const [ox, oy] = pt(L, c.x, c.y);
      d.circle(ox, oy, rad, { stroke: alpha(p.ink, 0.45), lw: 1.2, dash: [3, 3] });
      d.withAlpha(clamp(movedK(S) * 3), () => d.line(ox, oy + rad, px, py - rad, alpha(p.ink, 0.45), 1.2, [3, 3]));
    }
    d.withAlpha(clamp(k * 1.5), () => {
      d.circle(px, py, rad + (on ? 3 * u : 0), { fill: on ? p.ink : p.surface, stroke: p.ink, lw: on ? 2.4 : 1.6 });
      d.text(String(n + 1), px, py + 0.5, { size: FS(S, 12.5), weight: 800, color: on ? p.stage : p.ink, align: 'center', base: 'middle' });
    });
  });
  drawPanel(S, L, cur);
}

function drawPanel(S: Frame, L: Lay, c: UseCase) {
  const { d, pal: p } = S, u = S.u, P = L.panel, gap = (tight(S) ? 5 : 8) * u, compact = S.portrait || tight(S);
  // antes de los casos: qué mide cada eje
  const fa = win(S, 'axis-x', 'q-start');
  if (fa > 0.01) {
    const defs: [string, Tone, string, number][] = [
      [S.l('valor en juego = veces al mes × minutos de cada vez', 'value at stake = times a month × minutes each time'), 'dat', 'axis-x', 0.3],
      [S.l('riesgo = probabilidad × impacto (lección 35)', 'risk = likelihood × impact (lesson 35)'), 'err', 'axis-y', 0.24],
    ];
    let y = P.y + (compact ? 0 : 6 * u);
    defs.forEach(([t, tn, seg, f]) => {
      const a = fa * fr(S, seg, f, f + 0.12), sz = FS(S, compact ? 13 : 14), h = paraH(S, t, P.w - 20 * u, sz, { weight: 750 }) + 14 * u;
      d.withAlpha(a, () => { card(S, { x: P.x, y, w: P.w, h }, { tone: tn, hot: 0.04 }); para(S, t, P.x + 10 * u, y + 7 * u, P.w - 20 * u, sz, { weight: 750, color: tone(S, tn).ink }); });
      y += h + gap;
    });
    return;
  }
  const ca = win(S, 'q-start', 'paths');
  if (ca <= 0.01) return;
  const t0 = S.st.es?.casoAt as number | undefined, fade = t0 === undefined ? 1 : clamp((S.clock - t0) / 0.25);
  const k = placed(S, c), n = CASES.indexOf(c) + 1;
  d.withAlpha(ca * fade * clamp(k * 1.5 + (S.on('try-matrix') ? 1 : 0)), () => {
    let y = P.y;
    const title = `${n} · ${S.L(compact ? c.short : c.name)}`;
    const th = paraH(S, title, P.w, FS(S, 15), { weight: 800, maxLines: compact ? 1 : 2 });
    para(S, title, P.x, y, P.w, FS(S, 15), { weight: 800, color: p.ink, maxLines: compact ? 1 : 2 });
    y += th + gap * 0.6;
    const sz = compact ? 13 : 13.5;
    const vt = S.l(`${S.n(c.freq, 0)} al mes × ${c.min} min = ${S.n(hoursOf(c), 0)} h al mes`, `${S.n(c.freq, 0)} a month × ${c.min} min = ${S.n(hoursOf(c), 0)} h a month`);
    fitText(S, vt, P.x, y, P.w, sz, { weight: 700, color: tone(S, 'dat').ink, base: 'top' });
    y += FS(S, sz) * u * 1.35;
    const moved = c.y2 !== undefined ? movedK(S) : 0;
    const rt = S.l(`riesgo: ${riskLabel(S, c.risk)}`, `risk: ${riskLabel(S, c.risk)}`) + (moved > 0.5 ? S.l(' → bajo, con controles', ' → low, with controls') : '');
    fitText(S, rt, P.x, y, P.w, sz, { weight: 700, color: tone(S, RISK_TONE[moved > 0.5 ? 'low' : c.risk]).ink, base: 'top' });
    y += FS(S, sz) * u * 1.35 + gap * 0.6;
    // la zona y qué se hace (la duda de garantía, hasta que baja)
    const z = zoneOf(c.x, yOf(S, c)), za = c.y2 !== undefined ? clamp((moved - 0.95) * 20) : 1;
    if (za > 0.003) {
      chip(S, S.L(ZONE[z].t), P.x, y + chipH(S, 13.5) / 2, ZONE[z].tone, { size: 13.5, align: 'left', solid: true, a: za, maxW: P.w });
      y += chipH(S, 13.5) + gap * 0.6;
      const at = S.L(ZONE[z].act), ah = paraH(S, at, P.w, FS(S, sz), { weight: 600, maxLines: compact ? 2 : 3 });
      if (y + ah <= P.y + P.h + 2) d.withAlpha(za, () => para(S, at, P.x, y, P.w, FS(S, sz), { weight: 600, color: p.ink, maxLines: compact ? 2 : 3 }));
      y += ah + gap * 1.2;
    }
    // la lista de los cinco casos (si cabe)
    const rowH = FS(S, 13) * u * 1.4;
    if (!compact && y + 5 * rowH <= P.y + P.h) {
      CASES.forEach((cc, i) => {
        const a = clamp(placed(S, cc) * 1.5), on = cc.id === c.id;
        if (a <= 0.003) return;
        d.withAlpha(a, () => fitText(S, `${i + 1} · ${S.L(cc.short)}`, P.x, y + i * rowH, P.w, 13, { weight: on ? 800 : 600, color: on ? p.ink : p.mute, base: 'top' }));
      });
    }
  });
}

export function matrixSource(S: Frame): string {
  if (S.on('q-start')) return S.l('Casos y posiciones ilustrativos; el orden importa, la distancia no', 'Illustrative cases and positions; order matters, distance does not');
  return S.l('Cifras ilustrativas de la tienda', 'Illustrative figures for the shop');
}
