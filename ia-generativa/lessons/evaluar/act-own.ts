// Actos 7–8: el conjunto de evaluación propio (casos de oro) y la mezcla de casos (turno 2).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { REAL_EASY, REAL_SCORE, STRATA, mixPasses, mixScore, mixShares } from './data';
import { stag } from './act-bench';
import { foot, fs, hbar, layout, pcu } from './ui';

// ═════════ casos de oro: entrada real + respuesta aceptada ═════════
export function drawGold(S: Frame) {
  const { d, pal: p } = S, u = S.u, R = layout(S, 1).all;
  const cols = S.portrait ? 1 : 2, rows = S.portrait ? 4 : 2, gap = (S.portrait ? 8 : 12) * u;
  const cw = (R.w - gap * (cols - 1)) / cols, ch = (R.h - gap * (rows - 1)) / rows;
  STRATA.forEach((s, i) => {
    const a = stag(S, 'gold', 0.1 + i * 0.17, 0.12);
    if (a <= 0) return;
    const x = R.x + (i % cols) * (cw + gap), y = R.y + Math.floor(i / cols) * (ch + gap), t = tone(S, s.tone), ex = S.lang === 'es' ? s.ex.es : s.ex.en;
    d.withAlpha(a, () => {
      d.rect(x, y, cw, ch, { fill: p.surface, stroke: p.lineStrong, lw: 1.3, r: 3 });
      d.rect(x, y, 6 * u, ch, { fill: t.c });
      const tx = x + 16 * u, tw = cw - 26 * u;
      d.tag(S.l(s.es, s.en).toLowerCase(), x + cw - 8 * u, y + 15 * u, { size: fs(S, 11.5), color: t.ink, fill: t.soft, stroke: t.c, align: 'right' });
      if (S.portrait) {
        const h1 = d.text(ex[0], tx, y + 9 * u, { size: fs(S, 12.5), weight: 800, color: p.ink, base: 'top', w: tw - 96 * u }).h;
        d.text('→ ' + ex[1], tx, y + 14 * u + Math.max(h1, 18 * u), { size: fs(S, 12.5), weight: 600, color: t.ink, base: 'top', w: tw });
      } else {
        d.text(S.l('ENTRADA REAL', 'REAL INPUT'), tx, y + 12 * u, { size: fs(S, 11.5), weight: 800, color: p.mute, base: 'top' });
        const h1 = d.text(ex[0], tx, y + 32 * u, { size: fs(S, 15), weight: 800, color: p.ink, base: 'top', w: tw }).h;
        d.text(S.l('RESPUESTA ACEPTADA', 'ACCEPTED ANSWER'), tx, y + 42 * u + h1, { size: fs(S, 11.5), weight: 800, color: p.mute, base: 'top' });
        d.text(ex[1], tx, y + 62 * u + h1, { size: fs(S, 15), weight: 600, color: t.ink, base: 'top', w: tw });
      }
    });
  });
  foot(S, S.l('mesa de ayuda interna; los reales saldrían de tus registros, anonimizados', 'internal help desk; real ones would come from your logs, anonymized'), { tag: S.l('ilustrativo', 'illustrative'), a: S.reveal('gold', 0.6, 0.5) });
}

// ═════════ la mezcla decide la nota ═════════
export function drawMix(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = layout(S, S.portrait ? 0.7 : 0.64);
  const interactive = S.on('try2');
  const easy = interactive ? clamp((S.p.mix ?? 50) / 100) : REAL_EASY;
  const shares = mixShares(easy), real = mixShares(REAL_EASY), score = mixScore(easy);
  const m = L.main, bh = (S.portrait ? 24 : 32) * u;
  const stack = (y: number, sh: number[], label: string, a: number, bold: boolean) => {
    d.withAlpha(a, () => {
      d.text(label, m.x, y, { size: fs(S, 13), weight: 800, color: bold ? p.ink : p.ink2, base: 'bottom' });
      let x = m.x;
      sh.forEach((w, i) => {
        const wp = w * m.w, t = tone(S, STRATA[i].tone);
        d.rect(x, y + 3 * u, wp - 1, bh, { fill: alpha(t.c, 0.82), stroke: p.stage, lw: 1 });
        if (wp > 34 * u) d.text(`${Math.round(w * 100)}`, x + wp / 2, y + 3 * u + bh / 2, { size: fs(S, 13), weight: 800, font: 'mono', color: p.stage, align: 'center', base: 'middle' });
        x += wp;
      });
    });
  };
  let y = m.y + 20 * u;
  if (interactive) { stack(y, shares, S.l('Tu conjunto de evaluación (%)', 'Your eval set (%)'), 1, true); y += bh + 34 * u; }
  stack(y, real, S.l('Tráfico real (%)', 'Real traffic (%)'), S.reveal('mix', 0.2, 0.6), !interactive);
  y += bh + 32 * u;
  const rh = Math.min(62 * u, (m.y + m.h - y) / 4), nameW = Math.min(150 * u, m.w * 0.38);
  d.withAlpha(clamp(stag(S, 'mix', 0.3, 0.1) + (interactive ? 1 : 0)), () => d.text(S.l('acierto del sistema en cada segmento', 'the system’s accuracy on each segment'), m.x, y - 6 * u, { size: fs(S, 12), weight: 700, color: p.mute, base: 'bottom' }));
  STRATA.forEach((s, i) => {
    const a = clamp(stag(S, 'mix', 0.15 + i * 0.14, 0.12) + (interactive ? 1 : 0)), yy = y + i * rh, t = tone(S, s.tone), weak = S.on('slices') && s.acc < 0.6;
    d.withAlpha(a, () => {
      d.rect(m.x, yy + rh / 2 - 7 * u, 14 * u, 14 * u, { fill: t.c });
      d.text(S.l(s.es, s.en), m.x + 22 * u, yy + rh / 2, { size: fs(S, 13.5), weight: 700, color: p.ink, base: 'middle', w: nameW - 24 * u });
      const bx = m.x + nameW, bw = m.w - nameW - 50 * u, bhh = Math.min(22 * u, rh * 0.5);
      hbar(S, bx, yy + rh / 2 - bhh / 2, bw, bhh, s.acc, s.tone);
      if (weak) d.rect(bx - 3, yy + rh / 2 - bhh / 2 - 3, bw + 6, bhh + 6, { stroke: tone(S, 'err').c, lw: 2 });
      d.text(pcu(S, s.acc), bx + bw + 8 * u, yy + rh / 2, { size: fs(S, 14), weight: 800, font: 'mono', color: p.ink, base: 'middle' });
    });
  });
  // marcador
  const a = L.aside, aa = clamp(stag(S, 'mix', 0.55, 0.12) + (interactive ? 1 : 0));
  d.withAlpha(aa, () => {
    const col = S.portrait ? 2 : 1, cw = a.w / col, big = S.portrait ? 26 : 34;
    const rd = (x: number, yy: number, lab: string, val: string, tn: 'dat' | 'err' | 'ink') => {
      d.text(lab, x, yy, { size: fs(S, 12.5), weight: 700, color: p.mute, base: 'top', w: cw - 8 * u });
      d.text(val, x, yy + 22 * u, { size: fs(S, big), weight: 800, font: 'mono', color: tn === 'ink' ? p.ink : tone(S, tn).ink, base: 'top' });
    };
    if (interactive) {
      rd(a.x, a.y, S.l('Nota con tu conjunto', 'Score on your set'), pcu(S, score), mixPasses(easy) ? 'err' : 'ink');
      rd(a.x + (S.portrait ? cw : 0), a.y + (S.portrait ? 0 : 84 * u), S.l('Con el tráfico real', 'With real traffic'), pcu(S, REAL_SCORE), 'dat');
      const st = S.st.mixHit as boolean | undefined, near = Math.abs(easy - REAL_EASY) <= 0.051;
      const ly = a.y + (S.portrait ? 74 * u : 184 * u);
      const step = (i: number, ok: boolean, txt: string) => {
        const yy = ly + i * 26 * u;
        d.rect(a.x, yy - 8 * u, 16 * u, 16 * u, { stroke: ok ? tone(S, 'dat').c : p.lineStrong, lw: 1.8, fill: ok ? alpha(tone(S, 'dat').c, 0.2) : undefined });
        if (ok) d.polyline([[a.x + 3.5 * u, yy], [a.x + 7 * u, yy + 4.5 * u], [a.x + 12.5 * u, yy - 4.5 * u]], tone(S, 'dat').c, 2.4);
        d.text(txt, a.x + 24 * u, yy, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'middle', w: a.w - 28 * u });
      };
      step(0, !!st, S.l('llegar a 93 %', 'reach 93%'));
      step(1, !!st && near, S.l('volver a 70 % fáciles', 'back to 70% easy'));
    } else {
      rd(a.x, a.y, S.l('Con el tráfico real', 'With real traffic'), pcu(S, REAL_SCORE), 'dat');
    }
  });
  foot(S, S.l('sistema ficticio de mesa de ayuda; el acierto por segmento es un supuesto', 'a fictional help-desk system; the accuracy per segment is an assumption'), { tag: S.l('ilustrativo', 'illustrative'), a: S.reveal('mix', 0.6, 0.5) });
}
