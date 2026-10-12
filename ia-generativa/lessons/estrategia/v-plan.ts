// Vista 11: el plan de noventa días (plan-1 … plan-3) y el puente a la lección 37 (bridge).
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, areaH, card, fitText, fr, glyph, header, para, paraH, tight } from './ui';

interface Phase { seg: string; days: [string, string]; t: [string, string]; tone: Tone; items: [string, string, number, string, string][] }
const PHASES: Phase[] = [
  { seg: 'plan-1', days: ['Días 1 a 30', 'Days 1 to 30'], t: ['Elegir', 'Choose'], tone: 'sig', items: [
    ['inventario y política de uso', 'inventory and usage policy', 0.34, 'inventario y política', 'inventory and policy'], ['lista de casos de uso', 'list of use cases', 0.5, 'lista de casos', 'list of cases'],
    ['cuadro de dos por dos', 'two-by-two grid', 0.6, 'cuadro de dos por dos', 'two-by-two grid'], ['elegir uno, con su línea base', 'pick one, with its baseline', 0.74, 'elegir uno y medir', 'pick one, measure it']] },
  { seg: 'plan-2', days: ['Días 31 a 60', 'Days 31 to 60'], t: ['Construir y probar', 'Build and test'], tone: 'w', items: [
    ['preparar los datos', 'prepare the data', 0.22, 'preparar los datos', 'prepare the data'], ['armar los casos de oro', 'put together the gold cases', 0.36, 'casos de oro', 'gold cases'],
    ['construir lo mínimo', 'build the minimum', 0.5, 'construir lo mínimo', 'build the minimum'], ['piloto con un grupo pequeño, midiendo cada semana', 'pilot with a small group, measuring weekly', 0.64, 'piloto y medir', 'pilot and measure']] },
  { seg: 'plan-3', days: ['Días 61 a 90', 'Days 61 to 90'], t: ['Decidir', 'Decide'], tone: 'dat', items: [
    ['comparar con la línea base', 'compare against the baseline', 0.22, 'comparar con la base', 'compare to baseline'], ['recalcular el retorno con lo medido', 'recalculate the return with what was measured', 0.38, 'recalcular el retorno', 'recalculate return'],
    ['ampliar, corregir o cerrar', 'expand, fix, or shut down', 0.56, 'ampliar, corregir o cerrar', 'expand, fix, or stop'], ['después, el siguiente caso del cuadro', 'then, the next case on the grid', 0.84, 'el siguiente caso', 'the next case']] },
];

export function drawPlan(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 7 : 12) * u;
  header(S, 0, S.l('Plan de noventa días', 'Ninety-day plan'), fr(S, 'plan-1', 0, 0.1));
  // barra de tiempo: 0, 30, 60, 90 días
  const barH = 8 * u, labH = FS(S, 12.5) * u * 1.3;
  // en pantallas anchas, la barra y las tarjetas se centran en el alto disponible
  const cw0 = (A.w - 2 * gap) / 3, pad0 = (tight(S) ? 7 : 10) * u, sz0 = FS(S, tight(S) ? 12.5 : 13.5);
  const need0 = Math.max(...PHASES.map((ph) => ph.items.reduce((s2, it) => s2 + paraH(S, S.l(it[0], it[1]), cw0 - 2 * pad0 - 20 * u, sz0, { weight: 650, maxLines: 2 }) + 3 * u, 0))) + pad0 * 2 + FS(S, 14.5) * u * 1.4 + 6 * u;
  const grpH = labH + 2 * u + barH + gap * 1.2 + need0;
  const by = A.y + (port ? 0 : Math.max(0, (A.h - grpH) / 2.5)) + labH + 2 * u;
  const yLab = by - labH - 2 * u;
  d.withAlpha(fr(S, 'plan-1', 0.1, 0.22), () => {
    d.rect(A.x, by, A.w, barH, { fill: alpha(p.ink, 0.06), stroke: p.line, lw: 1, r: 3 });
    [0, 30, 60, 90].forEach((n, i) => fitText(S, String(n), A.x + (A.w * i) / 3, yLab, 40 * u, 12.5, { weight: 700, color: p.mute, base: 'top', align: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }));
  });
  PHASES.forEach((ph, i) => {
    const k = fr(S, ph.seg, 0.02, 0.5, 'lin');
    if (k > 0.003) d.rect(A.x + (A.w * i) / 3, by, (A.w / 3) * k, barH, { fill: tone(S, ph.tone).c, r: 2 });
  });
  const top = by + barH + gap * 1.2;
  const H = A.y + A.h - top;
  // en pantallas anchas, la tarjeta mide lo que su lista más larga
  const cwL = (A.w - 2 * gap) / 3, padL = (tight(S) ? 7 : 10) * u, szL = FS(S, tight(S) ? 12.5 : 13.5);
  const needL = Math.max(...PHASES.map((ph) => ph.items.reduce((s2, it) => s2 + paraH(S, S.l(it[0], it[1]), cwL - 2 * padL - 20 * u, szL, { weight: 650, maxLines: 2 }) + 3 * u, 0))) + padL * 2 + FS(S, 14.5) * u * 1.4 + 6 * u;
  PHASES.forEach((ph, i) => {
    const r: Rect = port ? { x: A.x, y: top + i * (H / 3), w: A.w, h: H / 3 - gap * 0.6 } : { x: A.x + i * ((A.w + gap) / 3), y: top, w: cwL, h: Math.min(H, needL) };
    const a = fr(S, ph.seg, 0.02, 0.14);
    if (a <= 0.003) return;
    const t = tone(S, ph.tone), pad = (tight(S) ? 7 : 10) * u;
    d.withAlpha(a, () => {
      card(S, r, { tone: ph.tone, hot: 0.04 });
      const h1 = FS(S, 13) * u * 1.3, title = `${S.l(ph.days[0], ph.days[1])} · ${S.l(ph.t[0], ph.t[1])}`;
      fitText(S, title, r.x + pad, r.y + pad, r.w - 2 * pad, 14.5, { weight: 800, color: t.ink, base: 'top' });
      let y = r.y + pad + FS(S, 14.5) * u * 1.4 + 2 * u;
      const sz = FS(S, port ? 12.5 : tight(S) ? 12.5 : 13.5);
      // en teléfono, dos columnas de puntos si no caben en una
      const rest = r.y + r.h - pad - y, oneH = ph.items.reduce((s, it) => s + paraH(S, S.l(it[0], it[1]), r.w - 2 * pad - 18 * u, sz, { weight: 650, maxLines: 2 }) + 2 * u, 0);
      const twoCol = port && oneH > rest;
      const colW = twoCol ? (r.w - 2 * pad) / 2 : r.w - 2 * pad;
      let yy = y;
      ph.items.forEach(([es, en, f, esS, enS], j) => {
        const ia = fr(S, ph.seg, f, f + 0.08), txt = twoCol ? S.l(esS, enS) : S.l(es, en);
        const cx = r.x + pad + (twoCol ? (j % 2) * colW : 0);
        const cy = twoCol ? y + Math.floor(j / 2) * (rest / 2) : yy;
        const lines = twoCol ? 2 : 2, ih = paraH(S, txt, colW - 18 * u, sz, { weight: 650, maxLines: lines });
        if (cy + Math.min(ih, sz * u * 1.3) > r.y + r.h - pad + 2) return;
        glyph(S, 'check', cx + 6 * u, cy + sz * u * 0.62, 11 * u, t.ink, ia);
        para(S, txt, cx + 18 * u, cy, colW - 20 * u, sz, { weight: 650, color: p.ink, a: ia, maxLines: Math.max(1, Math.min(lines, Math.floor((r.y + r.h - pad - cy) / (sz * u * 1.26)))) });
        yy += ih + 3 * u;
      });
      void h1;
    });
  });
}

/** El puente: el recorrido del curso, lección por lección, y la que sigue. */
export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait;
  header(S, 0, S.l('De la neurona a tu organización', 'From the neuron to your organization'), fr(S, 'bridge', 0, 0.1));
  const n = 37, cols = port ? 6 : 10, rows = Math.ceil(n / cols);
  const cw = A.w / cols, rh = Math.min((A.h * 0.78) / rows, cw * 0.9), y0 = A.y + (A.h - rows * rh) / 2;
  const posOf = (i: number): [number, number] => {
    const r = Math.floor(i / cols), c0 = i % cols, c = r % 2 === 0 ? c0 : cols - 1 - c0;   // en serpentina
    return [A.x + c * cw + cw / 2, y0 + r * rh + rh / 2];
  };
  const MOD = [4, 6, 4, 4, 4, 4, 6, 4, 1];   // lecciones por módulo (1 a 9)
  const tones: Tone[] = ['sig', 'w', 'lat', 'dat', 'sig', 'w', 'lat', 'dat', 'err'];
  const modOf = (i: number) => { let s = 0; for (let m = 0; m < MOD.length; m++) { s += MOD[m]; if (i < s) return m; } return MOD.length - 1; };
  for (let i = 0; i < n - 1; i++) {
    const [x1, y1] = posOf(i), [x2, y2] = posOf(i + 1), a = fr(S, 'bridge', 0.05 + (0.45 * i) / n, 0.1 + (0.45 * i) / n);
    d.line(x1, y1, x2, y2, alpha(p.ink, 0.25 * a), 1.4);
  }
  const rr = Math.max(5 * u, Math.min(cw, rh) * 0.16);
  for (let i = 0; i < n; i++) {
    const [x, y] = posOf(i), a = fr(S, 'bridge', 0.05 + (0.45 * i) / n, 0.1 + (0.45 * i) / n), t = tone(S, tones[modOf(i)]);
    const last = i === n - 1, here = i === n - 2;
    d.withAlpha(a, () => {
      d.circle(x, y, rr * (here ? 1.4 : 1), { fill: last ? p.surface : t.c, stroke: last ? p.ink : t.c, lw: last ? 2.2 : 1, dash: last ? [3, 2] : undefined });
    });
  }
  // rótulos: aquí estás (36) y lo que sigue (37)
  const [hx, hy] = posOf(n - 2), [lx, ly] = posOf(n - 1);
  const la = fr(S, 'bridge', 0.6, 0.72);
  const l36 = S.l('36 · aquí', '36 · here'), w36 = S.d.measure(l36, { size: FS(S, 12.5), weight: 800 });
  const a36: CanvasTextAlign = hx - w36 / 2 < A.x ? 'left' : hx + w36 / 2 > A.x + A.w ? 'right' : 'center';
  fitText(S, l36, a36 === 'left' ? A.x : a36 === 'right' ? A.x + A.w : hx, hy - rr * 1.4 - 6 * u, A.w, 12.5, { weight: 800, color: p.ink, base: 'bottom', align: a36, a: la });
  const l37 = S.l('37 · el mapa completo', '37 · the complete map'), w37 = S.d.measure(l37, { size: FS(S, 13), weight: 800 });
  const al: CanvasTextAlign = lx - w37 / 2 < A.x ? 'left' : lx + w37 / 2 > A.x + A.w ? 'right' : 'center';
  fitText(S, l37, al === 'left' ? Math.max(A.x, lx - rr) : al === 'right' ? Math.min(A.x + A.w, lx + rr) : lx, ly + rr + 8 * u, A.w, 13, { weight: 800, color: p.ink, base: 'top', align: al, a: fr(S, 'bridge', 0.78, 0.9) });
  void para;
}
