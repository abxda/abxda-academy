// Vista 5: la calculadora de memoria. Arriba, la cuenta viva (parámetros × bytes = gigabytes); abajo, tres opciones de
// hardware (RTX 3060, una H100, un servidor de 8 H100) con lo que ocupa el modelo y si cabe. Solo cuenta los parámetros.
// La escena mueve sola el tamaño y el formato (S.drive) mientras la persona no los toque; render solo lee S.p y S.st.
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { GPUS, fmtOf, modelOf, weightsGB } from './model';
import { ap, area, card, fitSize, fitText, gbTxt, isShort, lineH, mark, measure, memBar, provenance, txt } from './draw';

/** Lo que muestra la calculadora (la cifra de gigabytes se desliza hacia la nueva en update). */
export function calcTarget(S: Frame) {
  const m = modelOf(String(S.p.model ?? '70')), f = fmtOf(String(S.p.fmt ?? 'fp16'));
  return { m, f, gb: weightsGB(m.params, f.bytes) };
}

export function drawCalc(S: Frame) {
  const { d, pal: p } = S, A = area(S), u = S.u, wt = tone(S, 'w');
  const short = isShort(S), port = S.portrait;
  const { m, f, gb: target } = calcTarget(S), gb = S.st.gbShow ?? target;
  const a0 = ap(S, 'calc-demo', 0, 0.12);
  // ── la cuenta ──
  const opW = 22 * u, chipH = (short ? 44 : 54) * u, cw = (A.w - 2 * opW) / 3;
  const chips: [string, string, 'w' | 'ink'][] = [
    [S.l('parámetros', 'parameters'), S.l(m.es, m.en), 'w'],
    [S.l(`bytes (${f.name})`, `bytes (${f.name})`), f.bytes < 1 ? '½' : String(f.bytes), 'ink'],
    [S.l('memoria', 'memory'), gbTxt(S, target), 'w'],
  ];
  d.withAlpha(a0, () => {
    chips.forEach(([lab, val, t], i) => {
      const x = A.x + i * (cw + opW), r: Rect = { x, y: A.y, w: cw, h: chipH };
      card(S, r, { tone: t === 'w' ? 'w' : undefined, fill: 0.08 });
      fitText(S, lab, x + cw / 2, A.y + lineH(S, 12, 0.75), cw - 8 * u, { s: 12, weight: 700, c: p.mute, align: 'center' });
      const vs = fitSize(S, val, cw - 10 * u, short ? 17 : 21, true, 800);
      txt(S, val, x + cw / 2, A.y + chipH - lineH(S, vs, 0.62), { s: vs, weight: 800, mono: true, c: t === 'w' ? wt.ink : p.ink, align: 'center' });
      if (i < 2) txt(S, i === 0 ? '×' : '=', x + cw + opW / 2, A.y + chipH / 2, { s: 20, weight: 800, mono: true, c: p.mute, align: 'center' });
    });
  });
  // ── las tres opciones ──
  const top = A.y + chipH + (short ? 10 : 22) * u, rowH = Math.min((short ? 62 : port ? 104 : 84) * u, (A.y + A.h - top) / 3);
  const nameW = Math.min(port ? 92 * u : 150 * u, A.w * 0.3), endW = port ? 74 * u : Math.min(190 * u, A.w * 0.28);
  const bx = A.x + nameW, bw = A.w - nameW - endW - 10 * u;
  GPUS.forEach((g, i) => {
    const a = ap(S, 'calc-demo', 0.05 + i * 0.05, 0.17 + i * 0.05);
    if (a <= 0) return;
    const y = top + i * rowH, cy = y + rowH * 0.42, bh = Math.min(24 * u, rowH * 0.36), frac = gb / g.mem, ok = target <= g.mem;
    d.withAlpha(a, () => {
      fitText(S, S.l(g.es, g.en), A.x, cy - lineH(S, 14, 0.42), nameW - 8 * u, { s: 14, weight: 800 });
      fitText(S, port ? `${g.mem} GB` : `${g.mem} GB · ${S.l(g.sub.es, g.sub.en)}`, A.x, cy + lineH(S, 12, 0.62), nameW - 8 * u, { s: 12, c: p.mute });
      memBar(S, bx, cy - bh / 2, bw, bh, frac, { tone: ok ? 'w' : 'err' });
      // lo que se pasa: flecha que sale de la tarjeta
      if (frac > 1) {
        const er = tone(S, 'err');
        d.polygon([[bx + bw + 2 * u, cy - bh / 2], [bx + bw + 10 * u, cy], [bx + bw + 2 * u, cy + bh / 2]], { fill: er.c });
      }
      // cuánto ocupa (dentro de la barra si cabe; si no, a la izquierda)
      const lab = `${gbTxt(S, gb)}`, inside = Math.min(1, frac) * bw;
      if (inside > measure(S, lab, 12.5, true, 800) + 12 * u) txt(S, lab, bx + 6 * u, cy, { s: 12.5, weight: 800, mono: true, c: p.stage });
      else txt(S, lab, bx + inside + 6 * u, cy, { s: 12.5, weight: 800, mono: true, c: wt.ink, halo: true });
      // veredicto
      const mx = bx + bw + 22 * u;
      mark(S, mx, cy, ok, 7);
      const need = Math.ceil(target / g.mem);
      const v = ok ? (target > g.mem * 0.8 ? S.l('cabe, justo', 'fits, barely') : S.l('cabe', 'fits'))
        : port ? `× ${need}` : S.l(`no cabe: harían falta ${need}`, `no fit: would need ${need}`);
      fitText(S, v, mx + 14 * u, cy, A.x + A.w - mx - 14 * u, { s: 13, weight: 700, c: p.ink2 });
    });
  });
  provenance(S, S.l('Solo los parámetros: al usarlo hace falta algo más de memoria · tamaños nominales de Llama 3.1 y Pythia', 'Parameters only: using the model takes some extra memory · nominal sizes of Llama 3.1 and Pythia'), a0);
  void clamp; void alpha;
}
