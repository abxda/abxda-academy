// Acto 5: la memoria. memory (de 1,2 TB a 350 GB en GPT-3, y por qué: bytes por parámetro) y qlora (base en 4 bits + adaptador en 16).
// REAL: las cifras de GPT-3 son las del artículo de LoRA (Hu et al., 2021) y las de 65 mil millones, las de QLoRA (Dettmers et al., 2023);
// los 16 bytes por parámetro son la cuenta de ZeRO (Rajbhandari et al., 2019); lo del modelo diminuto se mide aquí (quant.ts, runs.ts).
import { clamp, inset, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { BASE } from './base';
import { BASE_NF4, NF4 } from './quant';
import { getRun } from './runs';
import { STEPS } from './runs';
import { mapOf } from './task';
import { FS, alp, chip, drawSigned, maxAbs, para } from './ui';

// ═════════════════════════════════════════════════════════════════════════════
// memory
// ═════════════════════════════════════════════════════════════════════════════
function bar(S: Frame, r: Rect, label: string, value: string, frac: number, tn: Tone, a: number, o: { tag?: string; tagA?: number } = {}) {
  const { d, pal: p } = S, u = S.u, t = tone(S, tn), bh = 22 * u;
  d.withAlpha(a, () => {
    d.text(label, r.x, r.y, { size: FS(S, 13), weight: 700, color: p.ink2, base: 'top' });
    d.text(value, r.x + r.w, r.y - 1 * u, { size: FS(S, 17), weight: 800, font: 'mono', color: t.ink, align: 'right', base: 'top' });
    const by = r.y + 20 * u;
    d.rect(r.x, by, r.w, bh, { fill: p.surface2, stroke: p.line, lw: 1 });
    d.rect(r.x, by, r.w * clamp(frac), bh, { fill: alp(t.c, 0.78) });
    if (o.tag) d.text(o.tag, r.x + r.w * clamp(frac) + 10 * u, by + bh / 2, { size: FS(S, 13), weight: 800, color: p.ink, base: 'middle', a: o.tagA ?? 1 });
  });
}

/** Barra apilada en bytes por parámetro (16 B = ancho completo). */
function stack(S: Frame, r: Rect, parts: { b: number; label: string; tn: Tone; ghost?: boolean }[], total: number, a: number) {
  const { d, pal: p } = S, u = S.u, h = 26 * u;
  d.withAlpha(a, () => {
    let x = r.x;
    for (const pt of parts) {
      const w = (pt.b / total) * r.w, t = tone(S, pt.tn);
      if (pt.ghost) { d.rect(x, r.y, w, h, { stroke: t.c, lw: 1.6, dash: [4, 3] }); d.text(pt.label, x + w / 2, r.y + h / 2, { size: FS(S, 12), weight: 700, color: p.mute, align: 'center', base: 'middle' }); }
      else { d.rect(x, r.y, w, h, { fill: alp(t.c, 0.8), stroke: p.stage, lw: 1.5 }); d.text(pt.label, x + w / 2, r.y + h / 2, { size: FS(S, 12), weight: 800, color: p.stage, align: 'center', base: 'middle' }); }
      x += w;
    }
  });
}

export function drawMemory(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u);
  d.withAlpha(vis, () => {
    // 1 · las cifras del artículo
    let y = all.y;
    d.text(S.l('GPT-3 175B · memoria de GPU al entrenar (Hu et al., 2021)', 'GPT-3 175B · GPU memory while training (Hu et al., 2021)'), all.x, y, { size: FS(S, 13), weight: 800, color: p.ink, base: 'top', w: all.w, a: S.reveal('memory', 0, 0.5) });
    y += (S.portrait ? 36 : 22) * u;
    bar(S, { x: all.x, y, w: all.w, h: 0 }, S.l('ajuste completo con Adam', 'full fine-tuning with Adam'), S.l('1.2 TB', '1.2 TB'), 1, 'dat', S.reveal('memory', 0.3, 0.6));
    y += 54 * u;
    bar(S, { x: all.x, y, w: all.w, h: 0 }, S.l('LoRA', 'LoRA'), '350 GB', 350 / 1200, 'w', S.reveal('memory', 1.6, 0.6), { tag: S.l('≈ 3 veces menos', '≈ 3× less'), tagA: S.reveal('memory', 2.8, 0.5) });
    y += 62 * u;
    // 2 · por qué: bytes por parámetro
    const a2 = S.reveal('memory', 4.5, 0.6);
    d.text(S.l('¿Por qué? Bytes por parámetro (cuenta propia, Adam en precisión mixta)', 'Why? Bytes per parameter (our own count, Adam in mixed precision)'), all.x, y, { size: FS(S, 13), weight: 800, color: p.ink, base: 'top', w: all.w, a: a2 });
    y += (S.portrait ? 38 : 22) * u;
    const sw = all.w, full: { b: number; label: string; tn: Tone }[] = [
      { b: 2, label: S.l('2', '2'), tn: 'w' }, { b: 2, label: S.l('2', '2'), tn: 'err' }, { b: 12, label: S.l('12 · estados de Adam y copia FP32', '12 · Adam states and FP32 copy'), tn: 'dat' },
    ];
    d.text(S.l('ajuste completo: 16 B', 'full fine-tuning: 16 B'), all.x, y, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top', a: a2 });
    stack(S, { x: all.x, y: y + 17 * u, w: sw, h: 0 }, full, 16, a2);
    y += 48 * u;
    const a3 = S.reveal('memory', 7.0, 0.6);
    d.text(S.l('LoRA, pesos congelados: 2 B', 'LoRA, frozen weights: 2 B'), all.x, y, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top', a: a3 });
    stack(S, { x: all.x, y: y + 17 * u, w: sw, h: 0 }, [{ b: 2, label: '2', tn: 'w' }, { b: 14, label: S.l('sin gradientes ni estados de Adam para lo congelado', 'no gradients or Adam states for what is frozen'), tn: 'ink', ghost: true }], 16, a3);
    y += 48 * u;
    // leyenda de colores (la forma acompaña: cuadros)
    const a4 = S.reveal('memory', 5.2, 0.6);
    const legend: { t: string; tn: Tone }[] = [{ t: S.l('pesos', 'weights'), tn: 'w' }, { t: S.l('gradientes', 'gradients'), tn: 'err' }, { t: S.l('Adam + copia', 'Adam + copy'), tn: 'dat' }];
    let lx = all.x;
    legend.forEach((l) => { d.rect(lx, y + 2 * u, 11 * u, 11 * u, { fill: alp(tone(S, l.tn).c, 0.8), a: a4 }); const w = d.text(l.t, lx + 16 * u, y, { size: FS(S, 12), weight: 700, color: p.ink2, base: 'top', a: a4 }).w; lx += 16 * u + w + 18 * u; });
    y += 20 * u;
    para(S, S.l('Solo A y B pagan los 16 B: en GPT-3, con r = 4 en W_q y W_v, son el 0.01 % de los parámetros. 1.2 TB es la cifra del artículo; la cuenta de 16 B daría 2.8 TB: depende de qué se guarde.', 'Only A and B pay the 16 B: on GPT-3, with r = 4 on W_q and W_v, they are 0.01% of the parameters. 1.2 TB is the paper’s figure; the 16 B count would give 2.8 TB: it depends on what is stored.'), all.x, y, all.w, { size: 12, weight: 600, color: p.mute, a: S.reveal('memory', 9.0, 0.6) });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// qlora
// ═════════════════════════════════════════════════════════════════════════════
let QSTATS: { agree: number; relErr: number } | null = null;
function qstats() {
  if (!QSTATS) {
    const a = mapOf(BASE, null), b = mapOf(BASE_NF4, null);
    let same = 0; for (let k = 0; k < a.length; k++) if (a[k] === b[k]) same++;
    let e = 0, n = 0; for (const key of ['W1', 'W2', 'W3'] as const) for (let i = 0; i < BASE[key].length; i++) { e += (BASE_NF4[key][i] - BASE[key][i]) ** 2; n += BASE[key][i] ** 2; }
    QSTATS = { agree: same / a.length, relErr: Math.sqrt(e / n) };
  }
  return QSTATS;
}

export function drawQlora(S: Frame, vis: number) {
  if (vis < 0.01) return;
  const { d, pal: p } = S, u = S.u, all = inset(S.full(), 14 * u), pc = (v: number, dg = 0) => S.n(v * 100, dg) + '\u00a0%';
  const q = qstats(), sp = { mode: 2, replay: true, rule: 'A' as const };
  const r16 = getRun(sp).at(STEPS), r4 = getRun({ ...sp, q: true }).at(STEPS);
  const wide = !S.portrait, wl = wide ? all.w * 0.5 : all.w;
  d.withAlpha(vis, () => {
    // 1 · la matriz central en 16 bits y en 4 bits
    const ms = wide ? Math.min((wl - 70 * u) / 2, 190 * u, all.h - 170 * u) : Math.min(96 * u, (all.w - 70 * u) / 2.2), cs = ms / 32, top = all.y + 26 * u;
    const gap = wide ? 56 * u : 46 * u, gx = all.x + (wl - (2 * ms + gap)) / 2;
    const x1 = gx, x2 = gx + ms + gap, rg = maxAbs(BASE.W2) * 0.9;
    const a1 = S.reveal('qlora', 0.2, 0.6), a2 = S.reveal('qlora', 1.8, 0.7), a3 = S.reveal('qlora', 3.6, 0.6);
    d.withAlpha(a1, () => {
      drawSigned(S, x1, top, BASE.W2, 32, 32, cs, { range: rg });
      d.text(S.l('16 bits', '16 bits'), x1 + ms / 2, top - 8 * u, { size: FS(S, 13), weight: 800, color: p.ink, align: 'center', base: 'bottom' });
      d.text(S.l('2 bytes por peso', '2 bytes per weight'), x1 + ms / 2, top + ms + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', w: ms + gap * 0.6 });
    });
    d.withAlpha(a2, () => {
      d.arrow(x1 + ms + 8 * u, top + ms / 2, x2 - 8 * u, top + ms / 2, p.ink2, 2, 8);
      drawSigned(S, x2, top, BASE_NF4.W2, 32, 32, cs, { range: rg });
      d.text(S.l('4 bits (NF4)', '4 bits (NF4)'), x2 + ms / 2, top - 8 * u, { size: FS(S, 13), weight: 800, color: tone(S, 'dat').ink, align: 'center', base: 'bottom' });
      d.text(S.portrait ? S.l('≈ 0.5 byte · 16 valores', '≈ 0.5 byte · 16 values') : S.l('≈ 0.5 byte por peso · solo 16 valores', '≈ 0.5 byte per weight · only 16 values'), x2 + ms / 2, top + ms + 6 * u, { size: FS(S, 12), weight: 600, color: p.mute, align: 'center', base: 'top', w: ms + gap * 0.6 });
      const sy = top + ms + (S.portrait ? 54 : 48) * u, sw = ms / 16;
      NF4.forEach((v, i) => { d.rect(x2 + i * sw, sy, sw - 1, 9 * u, { fill: alp(v >= 0 ? tone(S, 'w').c : tone(S, 'sig').c, 0.1 + 0.85 * Math.abs(v)) }); });
    });
    // 2 · el adaptador, en 16 bits
    const ay = top + ms + (S.portrait ? 88 : 88) * u;
    if (a3 > 0.01) d.withAlpha(a3, () => chip(S, S.l('+ adaptador B·A en 16 bits (se entrena)', '+ adapter B·A in 16 bits (trained)'), all.x + wl / 2, ay, { tone: 'w', align: 'center', size: 13 }));
    // 3 · lo medido en el modelo diminuto
    const rx = wide ? all.x + wl + 22 * u : all.x, rw = wide ? all.w - wl - 22 * u : all.w, yy = wide ? all.y + 22 * u : ay + 30 * u;
    const a5 = S.reveal('qlora', 6.0, 0.6), a6 = S.reveal('qlora', 7.0, 0.6), a7 = S.reveal('qlora', 8.0, 0.6);
    const th = para(S, S.l('Modelo diminuto, medido (las tres matrices en 4 bits)', 'Tiny model, measured (all three matrices in 4 bits)'), rx, yy, rw, { size: 13, weight: 800, color: p.ink, a: a5 }).h;
    let ty = yy + th + 6 * u;
    const rows = [
      { a: a5, t: S.l(`mapa del modelo: ${pc(q.agree, 1)} de las celdas iguales; error relativo de los pesos ${pc(q.relErr, 1)}`, `model map: ${pc(q.agree, 1)} of cells unchanged; relative weight error ${pc(q.relErr, 1)}`) },
      { a: a6, t: S.l(`LoRA r = 2 con repaso, base de 16 bits: nueva ${pc(r16.newSk)} · original ${pc(r16.oldSk)}`, `LoRA r = 2 with replay, 16-bit base: new ${pc(r16.newSk)} · original ${pc(r16.oldSk)}`) },
      { a: a7, t: S.l(`LoRA r = 2 con repaso, base de 4 bits: nueva ${pc(r4.newSk)} · original ${pc(r4.oldSk)}`, `LoRA r = 2 with replay, 4-bit base: new ${pc(r4.newSk)} · original ${pc(r4.oldSk)}`) },
    ];
    rows.forEach((r) => { const h = para(S, r.t, rx, ty, rw, { size: 13, weight: 600, color: p.ink2, a: r.a, lh: 1.28 }).h; ty += h + 8 * u; });
    // 4 · titular: 65 mil millones
    const a8 = S.reveal('qlora', 10.0, 0.7), hy = Math.min(ty + 10 * u, all.y + all.h - 54 * u);
    d.withAlpha(a8, () => {
      const h1 = para(S, S.l('65 mil millones de parámetros: de > 780 GB a < 48 GB', '65 billion parameters: from > 780 GB to < 48 GB'), rx, hy, rw, { size: S.portrait ? 15 : 18, weight: 800, color: tone(S, 'w').ink, lh: 1.25 }).h;
      para(S, S.l('Dettmers et al., 2023 · ajuste fino de 16 bits frente a QLoRA', 'Dettmers et al., 2023 · 16-bit fine-tuning versus QLoRA'), rx, hy + h1 + 4 * u, rw, { size: 12, weight: 600, color: p.mute });
    });
  });
}
